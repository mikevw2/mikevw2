/**
 * Pin factory. For an approved page: the cheap classification model writes 3 distinct title/description
 * variants, the renderer turns each into a 1000x1500 PNG, the hash guard drops duplicates,
 * and the survivors land in pin_queue as status='pending'. Nothing is posted here.
 */
import { z } from "zod/v4";
import type { Queryable } from "../db.js";
import { canPostPin } from "../guards/caps.js";
import { renderPin, type TemplateName } from "../render/renderPin.js";
import { cheapStructured } from "./llm.js";

export const PinVariantSchema = z.object({
  title: z.string().max(100).describe("Search-style pin title, at most 100 characters, keyword near the front"),
  description: z.string().max(500).describe("At most 500 characters, natural sentences, keyword and 2-3 related phrases, no hashtag spam (0-2 hashtags max)"),
  headline: z.string().max(48).describe("Short overlay text for the image, at most 48 characters, no punctuation at the end"),
  alt_text: z.string().max(200).describe("Plain description of the image for accessibility"),
});
export const PinVariantsSchema = z.object({
  variants: z.array(PinVariantSchema).length(3).describe("Three distinct angles: problem, outcome, how-to"),
});
export type PinVariant = z.infer<typeof PinVariantSchema>;

export interface PinSourcePage {
  url: string;
  title: string;
  /** Short plain-text summary of the page, from the approved draft. */
  summary: string;
  keyword: string;
  /** Local photo paths; the first is used as the hero. */
  photoPaths?: string[];
  board: string;
}

export function buildPinPrompt(page: PinSourcePage): { system: string; user: string } {
  return {
    system:
      "You write Pinterest pin copy for a home-organization store. Pinterest is a search engine: titles read like a helpful search result, " +
      "descriptions are 1-3 natural sentences that use the keyword and two or three closely related phrases. No hashtag lists, no emoji, " +
      "no exclamation marks, no claims about measurements, prices, shipping, or reviews. Each of the three variants must take a different angle " +
      "(the problem, the result, the how-to) and must not share a first word.",
    user: [
      `PAGE TITLE: ${page.title}`,
      `URL: ${page.url}`,
      `KEYWORD: ${page.keyword}`,
      `PAGE SUMMARY: ${page.summary}`,
      "Return three variants in the structured format.",
    ].join("\n"),
  };
}

export function lintVariants(vs: PinVariant[]): string[] {
  const problems: string[] = [];
  const firstWords = new Set<string>();
  for (const [i, v] of vs.entries()) {
    const hashtags = (v.description.match(/#\w+/g) ?? []).length;
    if (hashtags > 2) problems.push(`variant ${i}: ${hashtags} hashtags`);
    if (v.title.length > 100) problems.push(`variant ${i}: title > 100`);
    if (v.description.length > 500) problems.push(`variant ${i}: description > 500`);
    const fw = v.title.split(/\s+/)[0]?.toLowerCase() ?? "";
    if (firstWords.has(fw)) problems.push(`variant ${i}: duplicate first word "${fw}"`);
    firstWords.add(fw);
  }
  if (new Set(vs.map((v) => v.title.toLowerCase())).size !== vs.length) problems.push("duplicate titles");
  return problems;
}

export async function generatePinVariants(page: PinSourcePage): Promise<PinVariant[]> {
  const { system, user } = buildPinPrompt(page);
  const r = await cheapStructured({ schema: PinVariantsSchema, system, user });
  return r.output.variants;
}

export interface PinFactoryResult { queued: number; skipped: Array<{ title: string; reason: string }> }

const TEMPLATE_ROTATION: TemplateName[] = ["product-color-block", "before-after-split", "product-color-block"];

/**
 * Generate variants, render, hash-check, insert as pending. `usedHashes` and `lastPostForUrl`
 * come from the job so this stays testable with an in-memory db.
 */
export async function makePinsForPage(args: {
  db: Queryable;
  page: PinSourcePage;
  outDir: string;
  usedHashes: ReadonlySet<string>;
  lastPostForUrl: Date | null;
  now?: Date;
  variants?: PinVariant[];
}): Promise<PinFactoryResult> {
  const now = args.now ?? new Date();
  const variants = args.variants ?? (await generatePinVariants(args.page));
  const lint = lintVariants(variants);
  if (lint.length) console.warn(`[pinFactory] lint: ${lint.join("; ")}`);
  const used = new Set(args.usedHashes);
  const result: PinFactoryResult = { queued: 0, skipped: [] };

  for (const [i, v] of variants.entries()) {
    const template = TEMPLATE_ROTATION[i % TEMPLATE_ROTATION.length]!;
    const slug = `${slugify(args.page.keyword)}-${now.toISOString().slice(0, 10)}-${i + 1}`;
    const rendered = await renderPin({
      template,
      outPath: `${args.outDir}/${slug}.png`,
      data: { headline: v.headline, subline: args.page.title, keyword: args.page.keyword, photoPath: args.page.photoPaths?.[i % Math.max(1, args.page.photoPaths?.length ?? 1)], photoPathAfter: args.page.photoPaths?.[1], variantIndex: i },
    });
    // postedToday is irrelevant at queue time; the poster re-checks it. We pass 0 to only test URL spacing + hash.
    const verdict = canPostPin({ postedToday: 0, lastPostForUrl: args.lastPostForUrl, usedImageHashes: used, imageHash: rendered.hash, now, nearDuplicateDistance: 4 });
    if (!verdict.ok) {
      result.skipped.push({ title: v.title, reason: verdict.reason });
      continue;
    }
    used.add(rendered.hash);
    await args.db.query(
      `INSERT INTO pin_queue (page_url, board, title, description, alt_text, keyword, template, image_path, image_hash, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
      [args.page.url, args.page.board, v.title.slice(0, 100), v.description.slice(0, 500), v.alt_text, args.page.keyword, template, rendered.path, rendered.hash],
    );
    result.queued++;
  }
  return result;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "pin";
}
