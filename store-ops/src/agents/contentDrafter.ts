/**
 * Content drafter. Input: a keyword row, product facts, the style guide. Output: one row in
 * content_drafts with status='draft'. It never touches Shopify and never sets any other status.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod/v4";
import type { Queryable } from "../db.js";
import { draftStructured } from "./llm.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export const DraftSchema = z.object({
  title: z.string().min(5).max(120).describe("Page or article title (H1)"),
  seo_title: z.string().max(60).describe("Meta title, at most 60 characters, keyword first"),
  seo_description: z.string().max(155).describe("Meta description, at most 155 characters"),
  body_html: z.string().min(50).describe("Body as clean HTML using h2/h3/p/ul/li only, no inline styles, no scripts"),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).max(8),
  internal_links: z
    .array(z.object({ anchor_text: z.string(), target_handle: z.string().describe("A handle from the allowed list") }))
    .max(6),
});
export type Draft = z.infer<typeof DraftSchema>;

export type DraftKind = "guide" | "collection" | "product";

export interface KeywordRow { id?: number; term: string; volume?: number | null; kd?: number | null; intent?: string | null; season?: string | null }

export interface ProductFacts {
  /** The Shopify handle this copy is for (article handle for guides). */
  handle: string;
  name: string;
  /** Verified facts only: dimensions, materials, counts, what is in the box. Anything not here must not appear in copy. */
  facts: string[];
  /** Existing copy, if rewriting. */
  existingHtml?: string;
  /** Collection / guide handles the model may link to. */
  linkableHandles: Array<{ handle: string; title: string }>;
}

export function loadStyleGuide(): string {
  return readFileSync(path.join(here, "..", "prompts", "styleGuide.md"), "utf8");
}

export function buildDraftPrompt(kind: DraftKind, keyword: KeywordRow, facts: ProductFacts, styleGuide: string): { system: string; user: string } {
  const system = `You draft ${kind} copy for a small home-organization store. Follow the style guide exactly. ` +
    `Everything you write will be fact-checked by a human before it goes live; anything not supported by PRODUCT FACTS will be cut, so do not write it.\n\n` +
    `<style_guide>\n${styleGuide}\n</style_guide>`;
  const user = [
    `KIND: ${kind}`,
    `TARGET KEYWORD: ${keyword.term}`,
    keyword.intent ? `SEARCH INTENT: ${keyword.intent}` : "",
    keyword.season ? `SEASON: ${keyword.season}` : "",
    `PAGE HANDLE: ${facts.handle}`,
    `NAME: ${facts.name}`,
    `PRODUCT FACTS (the only facts you may use):`,
    ...facts.facts.map((f) => `- ${f}`),
    facts.existingHtml ? `\nEXISTING COPY (rewrite; do not reuse supplier phrasing):\n${facts.existingHtml}` : "",
    `\nALLOWED INTERNAL LINK TARGETS (handle — title):`,
    ...facts.linkableHandles.map((l) => `- ${l.handle} — ${l.title}`),
    `\nReturn the draft in the structured format. Respect seo_title ≤ 60 and seo_description ≤ 155 characters.`,
  ]
    .filter(Boolean)
    .join("\n");
  return { system, user };
}

/** Stable key so a re-run on the same day for the same target does not create a second draft. */
export function draftIdempotencyKey(kind: DraftKind, handle: string, term: string, day: string): string {
  return "draft:" + createHash("sha256").update(`${kind}|${handle}|${term.toLowerCase()}|${day}`).digest("hex").slice(0, 32);
}

/** Post-validation beyond what the schema can express. Returns a list of problems; empty means fine. */
export function lintDraft(d: Draft, facts: ProductFacts): string[] {
  const problems: string[] = [];
  if (d.seo_title.length > 60) problems.push("seo_title > 60");
  if (d.seo_description.length > 155) problems.push("seo_description > 155");
  if (/<script|<style|onerror=|javascript:/i.test(d.body_html)) problems.push("body_html contains script/style");
  const allowed = new Set(facts.linkableHandles.map((l) => l.handle));
  for (const l of d.internal_links) if (!allowed.has(l.target_handle)) problems.push(`internal link to unknown handle ${l.target_handle}`);
  if (/\b(\d+(\.\d+)?)\s?(in|inch|inches|cm|mm|lb|lbs|oz|kg|")\b/i.test(stripFacts(d.body_html, facts))) {
    problems.push("body_html mentions a measurement not present in facts (manual check)");
  }
  if (/★|⭐|stars?\b.*\b(rating|review)/i.test(d.body_html)) problems.push("body_html looks like it contains a review/rating");
  return problems;
}

/** Remove every fact string from the html so a measurement regex only flags *new* numbers. */
function stripFacts(html: string, facts: ProductFacts): string {
  let out = html;
  for (const f of facts.facts) {
    for (const m of f.match(/\d+(\.\d+)?\s?(in|inch|inches|cm|mm|lb|lbs|oz|kg|")/gi) ?? []) out = out.split(m).join(" ");
  }
  return out;
}

export interface DraftRunResult { draftId: number | null; inserted: boolean; draft: Draft; lint: string[]; model: string }

/**
 * Draft one piece and insert it as status='draft'. Returns inserted=false when the idempotency key already exists.
 */
export async function draftAndStore(args: {
  db: Queryable;
  kind: DraftKind;
  keyword: KeywordRow;
  facts: ProductFacts;
  styleGuide?: string;
  day?: string;
}): Promise<DraftRunResult> {
  const styleGuide = args.styleGuide ?? loadStyleGuide();
  const day = args.day ?? new Date().toISOString().slice(0, 10);
  const key = draftIdempotencyKey(args.kind, args.facts.handle, args.keyword.term, day);
  const existing = await args.db.query<{ id: number }>(`SELECT id FROM content_drafts WHERE idempotency_key = $1`, [key]);
  const { system, user } = buildDraftPrompt(args.kind, args.keyword, args.facts, styleGuide);
  if (existing.rows[0]) {
    // Already drafted today for this target; do not spend tokens again.
    const r = await args.db.query<{ title: string; seo_title: string; seo_description: string; body_html: string; faq_json: Draft["faq"]; internal_links: Draft["internal_links"]; model: string }>(
      `SELECT title, seo_title, seo_description, body_html, faq_json, internal_links, model FROM content_drafts WHERE id = $1`,
      [existing.rows[0].id],
    );
    const row = r.rows[0]!;
    const draft: Draft = { title: row.title, seo_title: row.seo_title, seo_description: row.seo_description, body_html: row.body_html, faq: row.faq_json, internal_links: row.internal_links };
    return { draftId: existing.rows[0].id, inserted: false, draft, lint: lintDraft(draft, args.facts), model: row.model };
  }
  const result = await draftStructured({ schema: DraftSchema, system, user, effort: args.kind === "guide" ? "high" : "medium" });
  const draft = result.output;
  const lint = lintDraft(draft, args.facts);
  const ins = await args.db.query<{ id: number }>(
    `INSERT INTO content_drafts (kind, target_handle, keyword_id, title, body_html, seo_title, seo_description, faq_json, internal_links, status, idempotency_key, model, reviewer_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,'draft',$10,$11,$12)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [
      args.kind,
      args.facts.handle,
      args.keyword.id ?? null,
      draft.title,
      draft.body_html,
      draft.seo_title.slice(0, 60),
      draft.seo_description.slice(0, 155),
      JSON.stringify(draft.faq),
      JSON.stringify(draft.internal_links),
      key,
      result.model,
      lint.length ? `lint: ${lint.join("; ")}` : null,
    ],
  );
  return { draftId: ins.rows[0]?.id ?? null, inserted: (ins.rowCount ?? 0) === 1, draft, lint, model: result.model };
}
