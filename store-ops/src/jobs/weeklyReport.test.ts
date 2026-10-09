import { describe, it, expect } from "vitest";
import { renderReport, pct, nextGate, weekRange, type ReportData } from "./weeklyReport.js";

const base: ReportData = {
  date: "2026-12-04",
  range: weekRange(new Date("2026-12-04T12:00:00Z")),
  gsc: { ok: true, clicks: 12, impressions: 900, prevClicks: 10, prevImpressions: 600, newTop10: ["drawer organizer for makeup"], topQueries: [{ keys: ["drawer organizer for makeup"], clicks: 5, impressions: 300, ctr: 0.016, position: 8.2 }] },
  pinterest: { ok: true, impressions: 4000, saves: 30, outbound: 12, prevImpressions: 3500 },
  shopify: { ok: true, orders: [{ id: "1", name: "#1001", createdAt: "", total: 42, currency: "USD", source: "pinterest" }, { id: "2", name: "#1002", createdAt: "", total: 30, currency: "USD", source: "google" }], bySource: { pinterest: 1, google: 1 } },
  publishLog: [{ entity: "shopify.article", action: "articleCreate", entity_id: "gid://shopify/Article/1", ok: true, created_at: new Date("2026-12-01T10:00:00Z") }],
  queue: { drafts: 3, pinsPending: 6, pinsApproved: 2, pinsPostedWeek: 9 },
  paused: false,
};

describe("weekly report", () => {
  it("renders every section with numbers", () => {
    const md = renderReport(base, "Line 1\nLine 2\nLine 3\nLine 4\nLine 5");
    expect(md).toContain("# Weekly digest 2026-12-04");
    expect(md).toContain("Clicks: 12 (+20% WoW)");
    expect(md).toContain("Impressions: 900 (+50% WoW)");
    expect(md).toContain('"drawer organizer for makeup"');
    expect(md).toContain("Saves: 30");
    expect(md).toContain("Orders: 2; revenue: 72.00 USD");
    expect(md).toContain("shopify.article articleCreate gid://shopify/Article/1");
    expect(md).toContain("Next gate: **1: First signal** on 2027-01-31");
    expect(md).toContain("Line 5");
  });
  it("marks unavailable sources and a paused poster", () => {
    const md = renderReport({ ...base, gsc: { ...base.gsc, ok: false, note: "Missing GSC_SITE_URL" }, paused: true }, null);
    expect(md).toContain("unavailable: Missing GSC_SITE_URL");
    expect(md).toContain("PAUSED");
    expect(md).toContain("Narrative unavailable");
  });
  it("warns when one channel exceeds 50% of orders", () => {
    const orders = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `#${i}`, createdAt: "", total: 10, currency: "USD", source: i < 4 ? "pinterest" : "google" }));
    const md = renderReport({ ...base, shopify: { ok: true, orders, bySource: { pinterest: 4, google: 1 } } }, null);
    expect(md).toContain("Warning: pinterest is 80% of orders");
  });
  it("pct handles zero baselines", () => {
    expect(pct(0, 0)).toBe("0%");
    expect(pct(5, 0)).toBe("new");
    expect(pct(50, 100)).toBe("-50%");
  });
  it("nextGate picks the first undated gate", () => {
    expect(nextGate("2026-10-09").n).toBe(0);
    expect(nextGate("2026-12-01").n).toBe(1);
    expect(nextGate("2028-01-01").n).toBe(4);
  });
  it("weekRange ends 3 days ago and is 7 days long", () => {
    const r = weekRange(new Date("2026-12-04T12:00:00Z"));
    expect(r.end).toBe("2026-12-01");
    expect(r.start).toBe("2026-11-25");
    expect(r.prevEnd).toBe("2026-11-24");
  });
});
