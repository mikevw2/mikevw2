/**
 * Pinterest poster. Runs hourly 08–21 local. Posts at most MAX_PER_RUN approved pins whose slot
 * has arrived, enforces every cap through the guards, and pauses itself (PAUSED file +
 * job_runs ok=false) on any API error or a >50% week-over-week impression drop.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool, pgPublishLogger, type Queryable } from "../db.js";
import { CAPS } from "../config.js";
import { canPostPin, nextPinSlots, shouldAutoPause } from "../guards/caps.js";
import { createPinterestClient, type PinterestClient } from "../clients/pinterest.js";
import { isPaused, pause, pausedReason } from "./pause.js";
import { main, todayIso } from "./runJob.js";

export const MAX_PER_RUN = Number(process.env["POSTER_MAX_PER_RUN"] ?? 1);

interface QueueRow { id: number; page_url: string; board: string; title: string; description: string; alt_text: string | null; image_path: string; image_hash: string; scheduled_for: Date | null }

function iso(d: Date): string { return d.toISOString().slice(0, 10); }

/** Week-over-week impression check; returns a reason string if the poster should pause. */
export async function impressionDropReason(pinterest: Pick<PinterestClient, "sumAccountMetric">, now = new Date()): Promise<string | null> {
  const d = (n: number) => iso(new Date(now.getTime() - n * 86_400_000));
  const thisWeek = await pinterest.sumAccountMetric("IMPRESSION", d(7), d(1));
  const lastWeek = await pinterest.sumAccountMetric("IMPRESSION", d(14), d(8));
  if (shouldAutoPause(thisWeek, lastWeek)) {
    return `impressions fell >${CAPS.IMPRESSION_DROP_AUTOPAUSE * 100}% WoW (${thisWeek} vs ${lastWeek})`;
  }
  return null;
}

/** Give today's approved-but-unscheduled rows evenly spread slots. */
export async function assignSlots(db: Queryable, now: Date): Promise<number> {
  const unscheduled = await db.query<{ id: number }>(`SELECT id FROM pin_queue WHERE status = 'approved' AND scheduled_for IS NULL ORDER BY approved_at ASC, id ASC LIMIT $1`, [CAPS.MAX_PINS_PER_DAY]);
  if (unscheduled.rowCount === 0) return 0;
  const slots = nextPinSlots(now, unscheduled.rows.length).filter((s) => s.getTime() >= now.getTime() - 5 * 60_000);
  // If the day is mostly gone, remaining rows wait for tomorrow's first run.
  let n = 0;
  for (const [i, row] of unscheduled.rows.entries()) {
    const slot = slots[i];
    if (!slot) break;
    await db.query(`UPDATE pin_queue SET scheduled_for = $2 WHERE id = $1`, [row.id, slot]);
    n++;
  }
  return n;
}

export async function posterJob(log: (s: string) => void, deps: { db?: Queryable; pinterest?: PinterestClient; now?: Date } = {}): Promise<void> {
  const db = deps.db ?? getPool();
  const now = deps.now ?? new Date();
  if (isPaused()) {
    log(`PAUSED: ${pausedReason()?.trim()}. Remove the PAUSED file to resume.`);
    return;
  }
  const hour = now.getHours();
  if (hour < CAPS.PIN_WINDOW_START_HOUR || hour > CAPS.PIN_WINDOW_END_HOUR) {
    log(`outside posting window (${hour}:00); nothing to do`);
    return;
  }
  const pinterest = deps.pinterest ?? createPinterestClient();
  const logger = pgPublishLogger(db);

  // 1. Impression collapse check.
  try {
    const reason = await impressionDropReason(pinterest, now);
    if (reason) {
      pause(reason);
      throw new Error(`auto-paused: ${reason}`);
    }
  } catch (e) {
    if (String(e).includes("auto-paused")) throw e;
    // Analytics unavailable is itself an API error: pause rather than post blind.
    pause(`analytics error: ${String(e)}`);
    throw new Error(`auto-paused: analytics error ${String(e)}`);
  }

  // 2. Schedule and pick due rows.
  const assigned = await assignSlots(db, now);
  if (assigned) log(`assigned ${assigned} slot(s)`);
  const today = todayIso(now);
  const postedTodayRes = await db.query<{ n: string }>(`SELECT count(*)::text AS n FROM pins_posted WHERE posted_at::date = $1::date`, [today]);
  let postedToday = Number(postedTodayRes.rows[0]?.n ?? 0);
  const hashRes = await db.query<{ image_hash: string }>(`SELECT image_hash FROM pins_posted`);
  const usedHashes = new Set(hashRes.rows.map((r) => r.image_hash));
  const due = await db.query<QueueRow>(
    `SELECT id, page_url, board, title, description, alt_text, image_path, image_hash, scheduled_for
       FROM pin_queue WHERE status = 'approved' AND scheduled_for IS NOT NULL AND scheduled_for <= $1
      ORDER BY scheduled_for ASC LIMIT $2`,
    [now, MAX_PER_RUN],
  );
  if (due.rowCount === 0) {
    log("no approved pins due");
    return;
  }

  // 3. Post, one at a time, guard first.
  for (const row of due.rows) {
    const last = await db.query<{ last: Date | null }>(`SELECT max(posted_at) AS last FROM pins_posted WHERE page_url = $1`, [row.page_url]);
    const verdict = canPostPin({ postedToday, lastPostForUrl: last.rows[0]?.last ?? null, usedImageHashes: usedHashes, imageHash: row.image_hash, now, nearDuplicateDistance: 4 });
    if (!verdict.ok) {
      log(`skip #${row.id}: ${verdict.reason}`);
      if (verdict.reason.startsWith("daily cap")) break;
      // URL spacing / duplicate: push to tomorrow rather than drop.
      await db.query(`UPDATE pin_queue SET scheduled_for = NULL, error = $2 WHERE id = $1`, [row.id, verdict.reason]);
      continue;
    }
    const key = `pin:${row.id}:${row.image_hash}`;
    if (await logger.seen(key)) {
      log(`skip #${row.id}: already posted under ${key}`);
      await db.query(`UPDATE pin_queue SET status = 'posted', posted_at = coalesce(posted_at, now()) WHERE id = $1`, [row.id]);
      continue;
    }
    await db.query(`UPDATE pin_queue SET status = 'posting' WHERE id = $1`, [row.id]);
    try {
      const data = readFileSync(row.image_path).toString("base64");
      const created = await pinterest.createPin({
        board_id: row.board,
        title: row.title,
        description: row.description,
        link: row.page_url,
        ...(row.alt_text ? { alt_text: row.alt_text } : {}),
        media_source: { source_type: "image_base64", content_type: "image/png", data },
      });
      await logger.log({ entity: "pinterest.pin", action: "create", entityId: created.id, idempotencyKey: key, diff: { board: row.board, title: row.title, link: row.page_url, image_hash: row.image_hash } });
      await db.query(`UPDATE pin_queue SET status = 'posted', posted_at = now(), pinterest_pin_id = $2, error = NULL WHERE id = $1`, [row.id, created.id]);
      postedToday++;
      usedHashes.add(row.image_hash);
      log(`posted #${row.id} -> ${created.id} (${postedToday}/${CAPS.MAX_PINS_PER_DAY} today)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logger.log({ entity: "pinterest.pin", action: "create", idempotencyKey: `${key}:fail:${Date.now()}`, diff: { board: row.board, link: row.page_url }, ok: false, error: msg });
      await db.query(`UPDATE pin_queue SET status = 'failed', error = $2 WHERE id = $1`, [row.id, msg]);
      pause(`pin #${row.id} failed: ${msg}`);
      throw new Error(`auto-paused: pin #${row.id} failed: ${msg}`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("poster", (log) => posterJob(log));
}
