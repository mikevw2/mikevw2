/**
 * Daily pin factory. For approved/published content_drafts with a public URL, make 3 pins each
 * (cheap-model copy + rendered PNG) until today's pending queue holds a day's worth. Inserts pending only.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "../db.js";
import { CAPS, loadEnv } from "../config.js";
import { makePinsForPage, type PinSourcePage } from "../agents/pinFactory.js";
import { closeBrowser } from "../render/renderPin.js";
import { main, todayIso } from "./runJob.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PIN_OUT_DIR = process.env["PIN_OUT_DIR"] ?? path.resolve(here, "..", "..", "samples", "pins");

const DEFAULT_BOARD = process.env["PINTEREST_DEFAULT_BOARD"] ?? "home-organization";

function pageUrl(kind: string, handle: string): string {
  const base = loadEnv().STORE_PUBLIC_URL.replace(/\/$/, "");
  if (kind === "guide") return `${base}/blogs/guides/${handle}`;
  if (kind === "collection") return `${base}/collections/${handle}`;
  return `${base}/products/${handle}`;
}

export async function pinFactoryJob(log: (s: string) => void): Promise<void> {
  const db = getPool();
  const day = todayIso();
  const pending = await db.query<{ n: string }>(`SELECT count(*)::text AS n FROM pin_queue WHERE status = 'pending' AND created_at::date = $1::date`, [day]);
  let queuedToday = Number(pending.rows[0]?.n ?? 0);
  if (queuedToday >= CAPS.MAX_PINS_PER_DAY) {
    log(`already ${queuedToday} pending pins created today; nothing to do`);
    return;
  }
  const hashes = await db.query<{ image_hash: string }>(`SELECT image_hash FROM pin_queue WHERE status IN ('pending','approved','posting','posted')`);
  const used = new Set(hashes.rows.map((r) => r.image_hash));

  // Pages least recently pinned first; skip anything pinned in the last 7 days.
  const pages = await db.query<{ id: number; kind: string; target_handle: string; title: string; seo_description: string; keyword: string | null; last_pin: Date | null }>(
    `SELECT d.id, d.kind, d.target_handle, d.title, d.seo_description, k.term AS keyword,
            (SELECT max(posted_at) FROM pins_posted p WHERE p.page_url LIKE '%/' || d.target_handle) AS last_pin
       FROM content_drafts d LEFT JOIN keywords k ON k.id = d.keyword_id
      WHERE d.status IN ('approved','published')
      ORDER BY last_pin NULLS FIRST, d.approved_at ASC
      LIMIT 20`,
  );
  try {
    for (const p of pages.rows) {
      if (queuedToday >= CAPS.MAX_PINS_PER_DAY) break;
      const url = pageUrl(p.kind, p.target_handle);
      const page: PinSourcePage = { url, title: p.title, summary: p.seo_description, keyword: p.keyword ?? p.title, board: DEFAULT_BOARD };
      const r = await makePinsForPage({ db, page, outDir: PIN_OUT_DIR, usedHashes: used, lastPostForUrl: p.last_pin });
      queuedToday += r.queued;
      log(`${url}: queued ${r.queued}${r.skipped.length ? `, skipped ${r.skipped.map((s) => s.reason).join(" | ")}` : ""}`);
    }
  } finally {
    await closeBrowser();
  }
  log(`done: ${queuedToday} pending pins created today`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("pin-factory", pinFactoryJob);
}
