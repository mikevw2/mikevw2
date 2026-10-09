import { describe, it, expect } from "vitest";
import { DraftSchema, buildDraftPrompt, draftIdempotencyKey, lintDraft, loadStyleGuide, type ProductFacts } from "./contentDrafter.js";
import { PinVariantsSchema, buildPinPrompt, lintVariants, slugify } from "./pinFactory.js";
import { impressionDropReason } from "../jobs/poster.js";

const facts: ProductFacts = { handle: "drawer-organizers-for-makeup", name: "Drawer organizers for makeup", facts: ["Tray is 12 in x 6 in", "Clear acrylic"], linkableHandles: [{ handle: "drawer-organizers", title: "Drawer organizers" }] };

describe("content drafter", () => {
  it("style guide loads and forbids invented facts", () => {
    const g = loadStyleGuide();
    expect(g).toMatch(/No invented measurements/);
    expect(g).toMatch(/No invented reviews/);
  });
  it("prompt carries facts, keyword and link targets", () => {
    const { system, user } = buildDraftPrompt("collection", { term: "drawer organizer for makeup" }, facts, "GUIDE");
    expect(system).toContain("<style_guide>\nGUIDE\n</style_guide>");
    expect(user).toContain("TARGET KEYWORD: drawer organizer for makeup");
    expect(user).toContain("- Tray is 12 in x 6 in");
    expect(user).toContain("- drawer-organizers — Drawer organizers");
  });
  it("idempotency key is stable per kind/handle/term/day and case-insensitive on term", () => {
    const a = draftIdempotencyKey("guide", "h", "Desk", "2026-12-01");
    expect(a).toBe(draftIdempotencyKey("guide", "h", "desk", "2026-12-01"));
    expect(a).not.toBe(draftIdempotencyKey("guide", "h", "desk", "2026-12-02"));
    expect(a).not.toBe(draftIdempotencyKey("product", "h", "desk", "2026-12-01"));
  });
  it("schema enforces meta lengths", () => {
    const good = { title: "Drawer organizers for makeup", seo_title: "x".repeat(60), seo_description: "y".repeat(155), body_html: "<h2>Why</h2><p>" + "z".repeat(60) + "</p>", faq: [], internal_links: [] };
    expect(DraftSchema.safeParse(good).success).toBe(true);
    expect(DraftSchema.safeParse({ ...good, seo_title: "x".repeat(61) }).success).toBe(false);
    expect(DraftSchema.safeParse({ ...good, seo_description: "y".repeat(156) }).success).toBe(false);
  });
  it("lint flags unknown links, new measurements and scripts", () => {
    const base = { title: "t", seo_title: "s", seo_description: "d", body_html: "<p>The tray is 12 in x 6 in of clear acrylic.</p>", faq: [], internal_links: [{ anchor_text: "a", target_handle: "drawer-organizers" }] };
    expect(lintDraft(base, facts)).toEqual([]);
    expect(lintDraft({ ...base, body_html: "<p>It is 14 in wide.</p>" }, facts)).toContain("body_html mentions a measurement not present in facts (manual check)");
    expect(lintDraft({ ...base, internal_links: [{ anchor_text: "a", target_handle: "nope" }] }, facts)[0]).toMatch(/unknown handle/);
    expect(lintDraft({ ...base, body_html: "<script>1</script>" }, facts)[0]).toMatch(/script/);
  });
});

describe("pin factory", () => {
  it("variants schema requires exactly three", () => {
    const v = { title: "t", description: "d", headline: "h", alt_text: "a" };
    expect(PinVariantsSchema.safeParse({ variants: [v, v, v] }).success).toBe(true);
    expect(PinVariantsSchema.safeParse({ variants: [v, v] }).success).toBe(false);
  });
  it("lint catches hashtag spam and shared first words", () => {
    const v = (title: string, description = "fine") => ({ title, description, headline: "h", alt_text: "a" });
    expect(lintVariants([v("Tidy desk"), v("Tidy drawer"), v("Clean pantry")])).toContain('variant 1: duplicate first word "tidy"');
    expect(lintVariants([v("A", "#a #b #c #d"), v("B"), v("C")])[0]).toMatch(/hashtags/);
    expect(lintVariants([v("A"), v("B"), v("C")])).toEqual([]);
  });
  it("prompt and slug", () => {
    const { user } = buildPinPrompt({ url: "https://e.com/c/x", title: "T", summary: "S", keyword: "desk organizer", board: "b" });
    expect(user).toContain("KEYWORD: desk organizer");
    expect(slugify("Desk Organizer / Small Desks!")).toBe("desk-organizer-small-desks");
  });
});

describe("poster impression check", () => {
  const fake = (thisWeek: number, lastWeek: number) => ({
    async sumAccountMetric(_m: string, start: string, _end: string) {
      // the second call asks for the older window
      return start < "2026-12-01" ? lastWeek : thisWeek;
    },
  });
  const now = new Date("2026-12-10T12:00:00Z");
  it("returns a reason on a >50% drop", async () => {
    expect(await impressionDropReason(fake(100, 1000), now)).toMatch(/fell/);
  });
  it("returns null when stable", async () => {
    expect(await impressionDropReason(fake(900, 1000), now)).toBeNull();
  });
});
