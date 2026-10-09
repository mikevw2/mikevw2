import { describe, it, expect } from "vitest";
import { createShopifyClient, ShopifyError } from "./shopify.js";
import { createPinterestClient, normalizeAnalytics, pinterestAuthorizationUrl } from "./pinterest.js";
import { createDataForSeoClient, MAX_KEYWORDS_PER_TASK } from "./dataforseo.js";
import { parseServiceAccount } from "./gsc.js";
import { memoryMonthlyCounter, memoryPublishLogger } from "../db.js";
import type { FetchLike } from "./http.js";

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function recordingFetch(reply: (url: string, init?: RequestInit) => unknown): { fetch: FetchLike; calls: Array<{ url: string; body: unknown }> } {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return jsonResponse(reply(url, init));
  };
  return { fetch, calls };
}

describe("shopify client", () => {
  const base = { storeDomain: "test.myshopify.com", adminToken: "tok" };

  it("dryRun logs the mutation and sends nothing", async () => {
    const logger = memoryPublishLogger();
    const net = recordingFetch(() => ({ data: {} }));
    const s = createShopifyClient({ ...base, logger, dryRun: true, fetch: net.fetch });
    const r = await s.createArticleDraft({ blogId: "gid://shopify/Blog/1", title: "T", bodyHtml: "<p>x</p>", idempotencyKey: "k1" });
    expect(r).toEqual({ skipped: true, reason: "dry_run" });
    expect(net.calls).toHaveLength(0);
    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0]!.action).toBe("dry_run");
    const diff = logger.entries[0]!.diff as { variables: { article: { isPublished: boolean } } };
    expect(diff.variables.article.isPublished).toBe(false);
  });

  it("sends articleCreate with isPublished:false and logs the id", async () => {
    const logger = memoryPublishLogger();
    const net = recordingFetch(() => ({ data: { articleCreate: { article: { id: "gid://shopify/Article/9", handle: "h", title: "T" }, userErrors: [] } } }));
    const s = createShopifyClient({ ...base, logger, fetch: net.fetch });
    const r = await s.createArticleDraft({ blogId: "gid://shopify/Blog/1", title: "T", bodyHtml: "<p>x</p>", seoTitle: "seo", idempotencyKey: "k2" });
    expect(r.skipped).toBe(false);
    expect(net.calls[0]!.url).toBe("https://test.myshopify.com/admin/api/2026-10/graphql.json");
    const body = net.calls[0]!.body as { variables: { article: Record<string, unknown> } };
    expect(body.variables.article["isPublished"]).toBe(false);
    expect(body.variables.article["metafields"]).toEqual([{ namespace: "global", key: "title_tag", type: "single_line_text_field", value: "seo" }]);
    expect(logger.entries[0]!.entityId).toBe("gid://shopify/Article/9");
  });

  it("refuses to resend a seen idempotency key", async () => {
    const logger = memoryPublishLogger();
    await logger.log({ entity: "x", action: "y", diff: {}, idempotencyKey: "dup" });
    const net = recordingFetch(() => ({ data: {} }));
    const s = createShopifyClient({ ...base, logger, fetch: net.fetch });
    const r = await s.updateProductDescription({ productId: "gid://shopify/Product/1", descriptionHtml: "<p>new</p>", idempotencyKey: "dup" });
    expect(r).toEqual({ skipped: true, reason: "duplicate" });
    expect(net.calls).toHaveLength(0);
  });

  it("turns userErrors into ShopifyError and logs ok=false", async () => {
    const logger = memoryPublishLogger();
    const net = recordingFetch(() => ({ data: { metafieldsSet: { metafields: [], userErrors: [{ field: ["value"], message: "too long" }] } } }));
    const s = createShopifyClient({ ...base, logger, fetch: net.fetch });
    await expect(s.setSeoMetafields({ ownerId: "gid://shopify/Product/1", seoTitle: "x", idempotencyKey: "k3" })).rejects.toBeInstanceOf(ShopifyError);
    expect(logger.entries[0]!.ok).toBe(false);
    expect(await logger.seen("k3")).toBe(false); // a failed attempt may be retried
  });

  it("maps orders to a first-touch source", async () => {
    const net = recordingFetch(() => ({
      data: { orders: { edges: [
        { node: { id: "1", name: "#1", createdAt: "2026-12-01", totalPriceSet: { shopMoney: { amount: "42.00", currencyCode: "USD" } }, customerJourneySummary: { firstVisit: { source: "pinterest", referrerUrl: null, utmParameters: null } } } },
        { node: { id: "2", name: "#2", createdAt: "2026-12-01", totalPriceSet: { shopMoney: { amount: "10.00", currencyCode: "USD" } }, customerJourneySummary: { firstVisit: { source: null, referrerUrl: "https://www.google.com/", utmParameters: null } } } },
        { node: { id: "3", name: "#3", createdAt: "2026-12-01", totalPriceSet: { shopMoney: { amount: "10.00", currencyCode: "USD" } }, customerJourneySummary: null } },
      ] } },
    }));
    const s = createShopifyClient({ ...base, logger: memoryPublishLogger(), fetch: net.fetch });
    const orders = await s.recentOrders("2026-11-25");
    expect(orders.map((o) => o.source)).toEqual(["pinterest", "google.com", "direct"]);
    expect(orders[0]!.total).toBe(42);
  });
});

describe("pinterest client", () => {
  it("flattens analytics", () => {
    const rows = normalizeAnalytics({ all: { daily_metrics: [{ date: "2026-12-01", metrics: { IMPRESSION: 10, SAVE: 2 } }, { date: "2026-12-02", metrics: { IMPRESSION: 5 } }] } });
    expect(rows).toHaveLength(2);
    expect(rows[1]!.metrics.IMPRESSION).toBe(5);
  });
  it("sums a metric over the range", async () => {
    const net = recordingFetch(() => ({ all: { daily_metrics: [{ date: "d1", metrics: { IMPRESSION: 10 } }, { date: "d2", metrics: { IMPRESSION: 15 } }] } }));
    const p = createPinterestClient({ accessToken: "t", fetch: net.fetch });
    expect(await p.sumAccountMetric("IMPRESSION", "2026-12-01", "2026-12-07")).toBe(25);
    expect(net.calls[0]!.url).toContain("/user_account/analytics?");
    expect(net.calls[0]!.url).toContain("metric_types=IMPRESSION");
  });
  it("createPin rejects over-length copy before sending and honours dryRun", async () => {
    const net = recordingFetch(() => ({ id: "real" }));
    const p = createPinterestClient({ accessToken: "t", fetch: net.fetch, dryRun: true });
    await expect(p.createPin({ board_id: "b", title: "x".repeat(101), description: "d", link: "https://e.com", media_source: { source_type: "image_url", url: "https://e.com/i.png" } })).rejects.toThrow(/title/);
    const r = await p.createPin({ board_id: "b", title: "ok", description: "d", link: "https://e.com", media_source: { source_type: "image_url", url: "https://e.com/i.png" } });
    expect(r.id).toMatch(/^dry-run-/);
    expect(net.calls).toHaveLength(0);
  });
  it("pages through boards with a bookmark", async () => {
    let n = 0;
    const net = recordingFetch(() => (n++ === 0 ? { items: [{ id: "1", name: "a" }], bookmark: "next" } : { items: [{ id: "2", name: "b" }], bookmark: null }));
    const p = createPinterestClient({ accessToken: "t", fetch: net.fetch });
    expect((await p.listBoards()).map((b) => b.id)).toEqual(["1", "2"]);
    expect(net.calls[1]!.url).toContain("bookmark=next");
  });
  it("builds the OAuth authorization URL", () => {
    const url = new URL(pinterestAuthorizationUrl({ appId: "123", redirectUri: "http://localhost:3999/cb", state: "s1" }));
    expect(url.origin + url.pathname).toBe("https://www.pinterest.com/oauth/");
    expect(url.searchParams.get("client_id")).toBe("123");
    expect(url.searchParams.get("scope")).toContain("pins:write");
    expect(url.searchParams.get("state")).toBe("s1");
  });
});

describe("dataforseo client", () => {
  it("chunks into tasks of 1,000 and counts them", async () => {
    const counter = memoryMonthlyCounter(0);
    const net = recordingFetch(() => ({ status_code: 20000, status_message: "Ok", cost: 0.1, tasks: [{ status_code: 20000, status_message: "Ok", result: [{ keyword: "a", search_volume: 10, competition: "LOW", competition_index: 1, cpc: 0.2, monthly_searches: [] }] }, { status_code: 20000, status_message: "Ok", result: [] }] }));
    const c = createDataForSeoClient({ login: "l", password: "p", counter, fetch: net.fetch });
    const kws = Array.from({ length: MAX_KEYWORDS_PER_TASK + 1 }, (_, i) => `kw ${i}`);
    const r = await c.searchVolume(kws);
    expect(r.tasksUsed).toBe(2);
    expect(counter.count).toBe(2);
    expect((net.calls[0]!.body as unknown[]).length).toBe(2);
    expect(r.rows[0]!.keyword).toBe("a");
  });
  it("refuses when the monthly cap would be exceeded and sends nothing", async () => {
    const counter = memoryMonthlyCounter(400);
    const net = recordingFetch(() => ({}));
    const c = createDataForSeoClient({ login: "l", password: "p", counter, fetch: net.fetch });
    await expect(c.searchVolume(["a"])).rejects.toThrow(/monthly cap/);
    expect(net.calls).toHaveLength(0);
    expect(counter.count).toBe(400);
  });
  it("dedupes and trims keywords", async () => {
    const net = recordingFetch(() => ({ status_code: 20000, status_message: "Ok", tasks: [{ status_code: 20000, status_message: "Ok", result: [] }] }));
    const c = createDataForSeoClient({ login: "l", password: "p", counter: memoryMonthlyCounter(), fetch: net.fetch });
    await c.searchVolume([" Desk Organizer ", "desk organizer", ""]);
    expect((net.calls[0]!.body as Array<{ keywords: string[] }>)[0]!.keywords).toEqual(["desk organizer"]);
  });
});

describe("gsc service account", () => {
  it("parses inline JSON", () => {
    const sa = parseServiceAccount(JSON.stringify({ client_email: "a@b.iam", private_key: "-----BEGIN PRIVATE KEY-----" }));
    expect(sa.client_email).toBe("a@b.iam");
  });
  it("rejects incomplete JSON", () => {
    expect(() => parseServiceAccount("{}")).toThrow(/client_email/);
  });
});
