/**
 * Daily content drafter. Picks the next keyword(s) without a draft, drafts within the daily
 * caps (1 guide, 10 page rewrites), inserts status='draft'. Never publishes.
 *
 * Product facts come from a `product_facts` JSON file you maintain by hand (verified
 * measurements and materials); see README. Nothing is drafted for a handle without facts.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "../db.js";
import { dailyCapReached, remainingToday } from "../guards/caps.js";
import { draftAndStore, type DraftKind, type KeywordRow, type ProductFacts } from "../agents/contentDrafter.js";
import { main, todayIso } from "./runJob.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const FACTS_FILE = process.env["PRODUCT_FACTS_FILE"] ?? path.resolve(here, "..", "..", "data", "product-facts.json");

interface FactsFile { linkable: Array<{ handle: string; title: string }>; pages: Array<{ kind: DraftKind; handle: string; name: string; keyword: string; facts: string[]; existingHtml?: string }> }

export function loadFacts(file = FACTS_FILE): FactsFile {
  if (!existsSync(file)) return { linkable: [], pages: [] };
  return JSON.parse(readFileSync(file, "utf8")) as FactsFile;
}

export async function countDraftsToday(kind: DraftKind, day: string): Promise<number> {
  const r = await getPool().query<{ n: string }>(
    `SELECT count(*)::text AS n FROM content_drafts WHERE kind = $1 AND created_at::date = $2::date`,
    [kind, day],
  );
  return Number(r.rows[0]?.n ?? 0);
}

async function findKeyword(term: string): Promise<KeywordRow> {
  const r = await getPool().query<KeywordRow>(`SELECT id, term, volume, kd, intent, season FROM keywords WHERE lower(term) = lower($1) ORDER BY snapshot_date DESC LIMIT 1`, [term]);
  return r.rows[0] ?? { term };
}

export async function drafterJob(log: (s: string) => void): Promise<void> {
  const day = todayIso();
  const facts = loadFacts();
  if (facts.pages.length === 0) {
    log(`no product facts at ${FACTS_FILE}; nothing to draft`);
    return;
  }
  const db = getPool();
  const done = await db.query<{ target_handle: string }>(`SELECT DISTINCT target_handle FROM content_drafts WHERE status IN ('draft','approved','published')`);
  const doneHandles = new Set(done.rows.map((r) => r.target_handle));
  let guides = await countDraftsToday("guide", day);
  let rewrites = (await countDraftsToday("collection", day)) + (await countDraftsToday("product", day));

  for (const page of facts.pages) {
    if (doneHandles.has(page.handle)) continue;
    const capKind = page.kind === "guide" ? "guide" : "page_rewrite";
    const count = page.kind === "guide" ? guides : rewrites;
    if (dailyCapReached(capKind, count)) {
      log(`cap reached for ${capKind}; remaining ${remainingToday(capKind, count)}; skipping ${page.handle}`);
      continue;
    }
    const pf: ProductFacts = { handle: page.handle, name: page.name, facts: page.facts, existingHtml: page.existingHtml, linkableHandles: facts.linkable };
    const r = await draftAndStore({ db, kind: page.kind, keyword: await findKeyword(page.keyword), facts: pf, day });
    log(`${r.inserted ? "drafted" : "already-drafted"} ${page.kind} ${page.handle} id=${r.draftId} model=${r.model}${r.lint.length ? ` lint=[${r.lint.join("; ")}]` : ""}`);
    if (r.inserted) {
      if (page.kind === "guide") guides++;
      else rewrites++;
    }
  }
  log(`done: guides today=${guides}, rewrites today=${rewrites}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("drafter", drafterJob);
}
