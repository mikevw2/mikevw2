/**
 * Friday digest. Pulls GSC, Pinterest analytics and Shopify orders, reads the publish log and
 * the gate table, and writes reports/weekly/YYYY-MM-DD.md. Claude writes only the 5-line
 * narrative at the top; every number below it is computed here. Every source is optional:
 * a missing key shows up as "unavailable" rather than failing the run.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool, type Queryable } from "../db.js";
import { loadEnv } from "../config.js";
import { createGscClient, type GscRow } from "../clients/gsc.js";
import { createPinterestClient } from "../clients/pinterest.js";
import { createShopifyClient, type ShopifyOrder } from "../clients/shopify.js";
import { memoryPublishLogger } from "../db.js";
import { draftText } from "../agents/llm.js";
import { main, todayIso } from "./runJob.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPORT_DIR = process.env["REPORT_DIR"] ?? path.resolve(here, "..", "..", "reports", "weekly");

/** Dated gates from the plan. Keep in sync with the report; the digest prints the next one. */
export const GATES = [
  { n: 0, name: "Setup", date: "2026-11-30", keep: "Merchant Center approved; Pinterest business account claimed with 3+ weeks of pins; app at Standard access or Tailwind; 10+ collection pages and 30+ rewritten products; 30+ Etsy POD listings; paid keyword map; GSC and Pinterest analytics flowing" },
  { n: 1, name: "First signal", date: "2027-01-31", keep: ">=5 Etsy orders; >=300 site visits in January; GSC impressions on 20+ queries; Pinterest outbound clicks rising WoW" },
  { n: 2, name: "Compounding", date: "2027-04-30", keep: ">=1,000 visits/month; >=10 Shopify orders/month; >=3 pages in top 10; first operating-profit month" },
  { n: 3, name: "Season readiness", date: "2027-07-31", keep: ">=2,000 visits/month; email list >=300; holiday collections and first gift-guide pins live" },
  { n: 4, name: "Season verdict", date: "2027-12-31", keep: "Cumulatively cash-positive; Nov-Dec > $2,500 revenue/month; no channel above 50% of orders" },
] as const;

export interface WeekRange { start: string; end: string; prevStart: string; prevEnd: string; label: string }

export function weekRange(now = new Date()): WeekRange {
  const d = (n: number) => { const x = new Date(now.getTime() - n * 86_400_000); return x.toISOString().slice(0, 10); };
  // GSC data lags ~2 days, so the "week" ends 3 days ago.
  return { start: d(9), end: d(3), prevStart: d(16), prevEnd: d(10), label: `${d(9)} to ${d(3)}` };
}

export interface Section { title: string; lines: string[] }

export interface ReportData {
  date: string;
  range: WeekRange;
  gsc: { ok: boolean; note?: string; clicks: number; impressions: number; prevClicks: number; prevImpressions: number; newTop10: string[]; topQueries: GscRow[] };
  pinterest: { ok: boolean; note?: string; impressions: number; saves: number; outbound: number; prevImpressions: number };
  shopify: { ok: boolean; note?: string; orders: ShopifyOrder[]; bySource: Record<string, number> };
  publishLog: Array<{ entity: string; action: string; entity_id: string | null; ok: boolean; created_at: Date }>;
  queue: { drafts: number; pinsPending: number; pinsApproved: number; pinsPostedWeek: number };
  paused: boolean;
}

export function pct(now: number, prev: number): string {
  if (prev === 0) return now === 0 ? "0%" : "new";
  const p = ((now - prev) / prev) * 100;
  return `${p >= 0 ? "+" : ""}${p.toFixed(0)}%`;
}

export function nextGate(today: string) {
  return GATES.find((g) => g.date >= today) ?? GATES[GATES.length - 1]!;
}

/** Pure: assemble the markdown from collected data plus an optional narrative. */
export function renderReport(data: ReportData, narrative: string | null): string {
  const g = nextGate(data.date);
  const lines: string[] = [];
  lines.push(`# Weekly digest ${data.date}`, "", `Window: ${data.range.label} (previous: ${data.range.prevStart} to ${data.range.prevEnd})`, "");
  lines.push("## Narrative", "", narrative ?? "_Narrative unavailable (no ANTHROPIC_API_KEY or the call failed); numbers below are complete._", "");
  lines.push("## Google Search Console", "");
  if (data.gsc.ok) {
    lines.push(`- Clicks: ${data.gsc.clicks} (${pct(data.gsc.clicks, data.gsc.prevClicks)} WoW)`);
    lines.push(`- Impressions: ${data.gsc.impressions} (${pct(data.gsc.impressions, data.gsc.prevImpressions)} WoW)`);
    lines.push(`- New top-10 queries: ${data.gsc.newTop10.length ? data.gsc.newTop10.map((q) => `"${q}"`).join(", ") : "none"}`);
    if (data.gsc.topQueries.length) {
      lines.push("", "| Query | Clicks | Impr. | Pos. |", "|---|---:|---:|---:|");
      for (const r of data.gsc.topQueries.slice(0, 15)) lines.push(`| ${r.keys[0] ?? ""} | ${r.clicks} | ${r.impressions} | ${r.position.toFixed(1)} |`);
    }
  } else lines.push(`- unavailable: ${data.gsc.note}`);
  lines.push("", "## Pinterest", "");
  if (data.pinterest.ok) {
    lines.push(`- Impressions: ${data.pinterest.impressions} (${pct(data.pinterest.impressions, data.pinterest.prevImpressions)} WoW)`);
    lines.push(`- Saves: ${data.pinterest.saves}`, `- Outbound clicks: ${data.pinterest.outbound}`);
  } else lines.push(`- unavailable: ${data.pinterest.note}`);
  lines.push(`- Poster status: ${data.paused ? "PAUSED (remove the PAUSED file after reviewing)" : "running"}`);
  lines.push(`- Pins posted this week: ${data.queue.pinsPostedWeek}; approved waiting: ${data.queue.pinsApproved}; pending review: ${data.queue.pinsPending}`);
  lines.push("", "## Shopify orders", "");
  if (data.shopify.ok) {
    const total = data.shopify.orders.reduce((a, o) => a + o.total, 0);
    lines.push(`- Orders: ${data.shopify.orders.length}; revenue: ${total.toFixed(2)} ${data.shopify.orders[0]?.currency ?? ""}`.trim());
    const srcs = Object.entries(data.shopify.bySource).sort((a, b) => b[1] - a[1]);
    lines.push(`- By first-touch source: ${srcs.length ? srcs.map(([s, n]) => `${s} ${n}`).join(", ") : "none"}`);
    const top = srcs[0];
    if (top && data.shopify.orders.length >= 4 && top[1] / data.shopify.orders.length > 0.5) lines.push(`- Warning: ${top[0]} is ${Math.round((100 * top[1]) / data.shopify.orders.length)}% of orders (plan says no channel above 50%)`);
  } else lines.push(`- unavailable: ${data.shopify.note}`);
  lines.push("", "## Publishing log (last 7 days)", "");
  if (data.publishLog.length === 0) lines.push("- nothing published");
  for (const p of data.publishLog) lines.push(`- ${p.created_at.toISOString().slice(0, 10)} ${p.entity} ${p.action}${p.entity_id ? ` ${p.entity_id}` : ""}${p.ok ? "" : " FAILED"}`);
  lines.push(`- Drafts awaiting review: ${data.queue.drafts}`);
  lines.push("", "## Gate status", "", `Next gate: **${g.n}: ${g.name}** on ${g.date}`, "", `Keep if: ${g.keep}`, "");
  lines.push("| Gate | Date | Status |", "|---|---|---|");
  for (const x of GATES) lines.push(`| ${x.n} ${x.name} | ${x.date} | ${x.date < data.date ? "passed date; record verdict by hand" : x === g ? "next" : "upcoming"} |`);
  lines.push("");
  return lines.join("\n");
}

export async function collect(db: Queryable, now = new Date()): Promise<ReportData> {
  const range = weekRange(now);
  const date = todayIso(now);
  const data: ReportData = {
    date, range,
    gsc: { ok: false, clicks: 0, impressions: 0, prevClicks: 0, prevImpressions: 0, newTop10: [], topQueries: [] },
    pinterest: { ok: false, impressions: 0, saves: 0, outbound: 0, prevImpressions: 0 },
    shopify: { ok: false, orders: [], bySource: {} },
    publishLog: [], queue: { drafts: 0, pinsPending: 0, pinsApproved: 0, pinsPostedWeek: 0 }, paused: false,
  };
  try {
    const gsc = createGscClient();
    const [cur, prev, curQ, prevQ] = await Promise.all([
      gsc.totals(range.start, range.end), gsc.totals(range.prevStart, range.prevEnd),
      gsc.query({ startDate: range.start, endDate: range.end, dimensions: ["query"], rowLimit: 500 }),
      gsc.query({ startDate: range.prevStart, endDate: range.prevEnd, dimensions: ["query"], rowLimit: 500 }),
    ]);
    const prevTop = new Set(prevQ.filter((r) => r.position <= 10).map((r) => r.keys[0]));
    data.gsc = { ok: true, clicks: cur.clicks, impressions: cur.impressions, prevClicks: prev.clicks, prevImpressions: prev.impressions,
      newTop10: curQ.filter((r) => r.position <= 10 && !prevTop.has(r.keys[0])).map((r) => r.keys[0] ?? ""), topQueries: curQ.sort((a, b) => b.clicks - a.clicks) };
    await db.query(`INSERT INTO metrics_daily (date, source, metric, value) VALUES ($1,'gsc','clicks',$2),($1,'gsc','impressions',$3) ON CONFLICT (date, source, metric, dimension) DO UPDATE SET value = EXCLUDED.value`, [range.end, cur.clicks, cur.impressions]);
  } catch (e) { data.gsc.note = String(e instanceof Error ? e.message : e); }
  try {
    const p = createPinterestClient();
    const [imp, prevImp, saves, out] = await Promise.all([
      p.sumAccountMetric("IMPRESSION", range.start, range.end), p.sumAccountMetric("IMPRESSION", range.prevStart, range.prevEnd),
      p.sumAccountMetric("SAVE", range.start, range.end), p.sumAccountMetric("OUTBOUND_CLICK", range.start, range.end),
    ]);
    data.pinterest = { ok: true, impressions: imp, prevImpressions: prevImp, saves, outbound: out };
    await db.query(`INSERT INTO metrics_daily (date, source, metric, value) VALUES ($1,'pinterest','impressions',$2),($1,'pinterest','saves',$3),($1,'pinterest','outbound_clicks',$4) ON CONFLICT (date, source, metric, dimension) DO UPDATE SET value = EXCLUDED.value`, [range.end, imp, saves, out]);
  } catch (e) { data.pinterest.note = String(e instanceof Error ? e.message : e); }
  try {
    const s = createShopifyClient({ logger: memoryPublishLogger() }); // reads only
    const orders = await s.recentOrders(range.start);
    const bySource: Record<string, number> = {};
    for (const o of orders) bySource[o.source] = (bySource[o.source] ?? 0) + 1;
    data.shopify = { ok: true, orders, bySource };
    await db.query(`INSERT INTO metrics_daily (date, source, metric, value) VALUES ($1,'shopify','orders',$2) ON CONFLICT (date, source, metric, dimension) DO UPDATE SET value = EXCLUDED.value`, [range.end, orders.length]);
  } catch (e) { data.shopify.note = String(e instanceof Error ? e.message : e); }

  const log = await db.query<ReportData["publishLog"][number]>(`SELECT entity, action, entity_id, ok, created_at FROM publish_log WHERE created_at >= now() - interval '7 days' AND action <> 'dry_run' ORDER BY created_at`);
  data.publishLog = log.rows;
  const q = await db.query<{ drafts: string; pending: string; approved: string; posted: string }>(
    `SELECT (SELECT count(*) FROM content_drafts WHERE status='draft')::text AS drafts,
            (SELECT count(*) FROM pin_queue WHERE status='pending')::text AS pending,
            (SELECT count(*) FROM pin_queue WHERE status='approved')::text AS approved,
            (SELECT count(*) FROM pins_posted WHERE posted_at >= now() - interval '7 days')::text AS posted`);
  const r = q.rows[0]!;
  data.queue = { drafts: Number(r.drafts), pinsPending: Number(r.pending), pinsApproved: Number(r.approved), pinsPostedWeek: Number(r.posted) };
  const { isPaused } = await import("./pause.js");
  data.paused = isPaused();
  return data;
}

export async function narrativeFor(data: ReportData): Promise<string | null> {
  if (!loadEnv().ANTHROPIC_API_KEY) return null;
  try {
    const facts = renderReport(data, null).split("## Narrative")[1] ?? "";
    return await draftText({
      system: "You write a five-line weekly status for a small store owner. Only use numbers present in the input. No advice, no praise, no speculation about causes you cannot see. Five short lines, each a plain sentence.",
      user: `Write the five-line narrative from these facts:\n${facts.slice(0, 6000)}`,
      maxTokens: 400,
    });
  } catch (e) {
    return `_Narrative failed: ${e instanceof Error ? e.message : String(e)}_`;
  }
}

export async function weeklyReportJob(log: (s: string) => void): Promise<string> {
  const data = await collect(getPool());
  const narrative = await narrativeFor(data);
  const md = renderReport(data, narrative);
  mkdirSync(REPORT_DIR, { recursive: true });
  const file = path.join(REPORT_DIR, `${data.date}.md`);
  writeFileSync(file, md);
  log(`wrote ${file} (gsc ${data.gsc.ok ? "ok" : "n/a"}, pinterest ${data.pinterest.ok ? "ok" : "n/a"}, shopify ${data.shopify.ok ? "ok" : "n/a"})`);
  return file;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("weekly-report", async (log) => { await weeklyReportJob(log); });
}
