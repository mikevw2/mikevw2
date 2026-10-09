/**
 * Shopify Admin GraphQL client (API version 2026-10).
 *
 * Every mutation:
 *   - takes an idempotency key and refuses to re-send if the publish log has it,
 *   - writes the diff to publish_log through the injected PublishLogger,
 *   - honours dryRun, which logs the mutation and returns without sending.
 *
 * Reads never log. Nothing here publishes an article: articleCreate always sends isPublished:false.
 *
 * VERIFY AGAINST LIVE DOCS before first real run (shapes written from memory of 2025-era schema):
 *   - articleCreate input field names (blogId, body, isPublished, author.name)
 *   - productUpdate argument name (`product:` vs `input:`)
 *   - customerJourneySummary fields on Order
 */
import { SHOPIFY_API_VERSION, loadEnv, requireEnv } from "../config.js";
import type { PublishLogger } from "../db.js";
import { defaultFetch, readJson, type FetchLike } from "./http.js";

export interface ShopifyClientOptions {
  storeDomain?: string;
  adminToken?: string;
  apiVersion?: string;
  logger: PublishLogger;
  /** Log mutations instead of sending them. Reads still go out. */
  dryRun?: boolean;
  fetch?: FetchLike;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: unknown }>;
}

export interface UserError { field?: string[] | null; message: string; code?: string }

export class ShopifyError extends Error {
  constructor(message: string, public readonly userErrors: UserError[] = []) {
    super(message);
    this.name = "ShopifyError";
  }
}

export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  total: number;
  currency: string;
  /** Best-effort first-touch source: utm_source, Shopify's `source`, referrer host, or 'direct'. */
  source: string;
}

export interface MutationResult<T> {
  /** true when nothing was sent (dry run or duplicate idempotency key). */
  skipped: boolean;
  reason?: "dry_run" | "duplicate";
  data?: T;
}

export function createShopifyClient(opts: ShopifyClientOptions) {
  const env = loadEnv();
  const domain = opts.storeDomain ?? (opts.dryRun ? env.SHOPIFY_STORE_DOMAIN ?? "dry-run.myshopify.com" : requireEnv("SHOPIFY_STORE_DOMAIN", env));
  const token = opts.adminToken ?? (opts.dryRun ? env.SHOPIFY_ADMIN_TOKEN ?? "" : requireEnv("SHOPIFY_ADMIN_TOKEN", env));
  const version = opts.apiVersion ?? SHOPIFY_API_VERSION;
  const doFetch = opts.fetch ?? defaultFetch;
  const endpoint = `https://${domain}/admin/api/${version}/graphql.json`;
  const dryRun = opts.dryRun ?? false;

  async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await doFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query, variables }),
    });
    const json = await readJson<GraphQLResponse<T>>(res, endpoint);
    if (json.errors?.length) throw new ShopifyError(json.errors.map((e) => e.message).join("; "));
    if (!json.data) throw new ShopifyError("empty data in GraphQL response");
    return json.data;
  }

  /** Common path for every mutation: idempotency check -> dry run -> send -> log. */
  async function mutate<T>(args: {
    entity: string;
    action: string;
    idempotencyKey: string;
    query: string;
    variables: Record<string, unknown>;
    diff: unknown;
    entityIdFrom?: (data: T) => string | undefined;
    userErrorsFrom?: (data: T) => UserError[] | undefined;
  }): Promise<MutationResult<T>> {
    if (await opts.logger.seen(args.idempotencyKey)) {
      return { skipped: true, reason: "duplicate" };
    }
    if (dryRun) {
      await opts.logger.log({
        entity: args.entity,
        action: "dry_run",
        idempotencyKey: args.idempotencyKey,
        diff: { intendedAction: args.action, variables: args.variables, diff: args.diff },
      });
      return { skipped: true, reason: "dry_run" };
    }
    try {
      const data = await gql<T>(args.query, args.variables);
      const userErrors = args.userErrorsFrom?.(data) ?? [];
      if (userErrors.length) {
        await opts.logger.log({ entity: args.entity, action: args.action, idempotencyKey: args.idempotencyKey, diff: args.diff, ok: false, error: JSON.stringify(userErrors) });
        throw new ShopifyError(`${args.action} userErrors: ${userErrors.map((e) => e.message).join("; ")}`, userErrors);
      }
      await opts.logger.log({ entity: args.entity, action: args.action, idempotencyKey: args.idempotencyKey, diff: args.diff, entityId: args.entityIdFrom?.(data) ?? null });
      return { skipped: false, data };
    } catch (e) {
      if (!(e instanceof ShopifyError)) {
        await opts.logger.log({ entity: args.entity, action: args.action, idempotencyKey: args.idempotencyKey, diff: args.diff, ok: false, error: String(e) });
      }
      throw e;
    }
  }

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  async function createArticleDraft(input: {
    blogId: string;
    title: string;
    bodyHtml: string;
    handle?: string;
    summary?: string;
    authorName?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    idempotencyKey: string;
  }) {
    type R = { articleCreate: { article: { id: string; handle: string; title: string } | null; userErrors: UserError[] } };
    const article: Record<string, unknown> = {
      blogId: input.blogId,
      title: input.title,
      body: input.bodyHtml,
      isPublished: false, // never flip this here; publishing is a human action in Shopify admin
      ...(input.handle ? { handle: input.handle } : {}),
      ...(input.summary ? { summary: input.summary } : {}),
      ...(input.authorName ? { author: { name: input.authorName } } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
      ...(input.seoTitle || input.seoDescription
        ? {
            metafields: [
              ...(input.seoTitle ? [{ namespace: "global", key: "title_tag", type: "single_line_text_field", value: input.seoTitle }] : []),
              ...(input.seoDescription ? [{ namespace: "global", key: "description_tag", type: "single_line_text_field", value: input.seoDescription }] : []),
            ],
          }
        : {}),
    };
    return mutate<R>({
      entity: "shopify.article",
      action: "articleCreate",
      idempotencyKey: input.idempotencyKey,
      query: `mutation ArticleCreateDraft($article: ArticleCreateInput!) {
        articleCreate(article: $article) {
          article { id handle title }
          userErrors { field message code }
        }
      }`,
      variables: { article },
      diff: { create: { title: input.title, handle: input.handle, isPublished: false, bodyChars: input.bodyHtml.length } },
      entityIdFrom: (d) => d.articleCreate.article?.id,
      userErrorsFrom: (d) => d.articleCreate.userErrors,
    });
  }

  /** Set SEO title/description on any owner (product, collection, article) via global.* metafields. */
  async function setSeoMetafields(input: { ownerId: string; seoTitle?: string; seoDescription?: string; idempotencyKey: string }) {
    type R = { metafieldsSet: { metafields: Array<{ id: string; namespace: string; key: string; value: string }>; userErrors: UserError[] } };
    const metafields = [
      ...(input.seoTitle !== undefined ? [{ ownerId: input.ownerId, namespace: "global", key: "title_tag", type: "single_line_text_field", value: input.seoTitle }] : []),
      ...(input.seoDescription !== undefined ? [{ ownerId: input.ownerId, namespace: "global", key: "description_tag", type: "single_line_text_field", value: input.seoDescription }] : []),
    ];
    if (metafields.length === 0) throw new ShopifyError("setSeoMetafields: nothing to set");
    return mutate<R>({
      entity: "shopify.metafield",
      action: "metafieldsSet",
      idempotencyKey: input.idempotencyKey,
      query: `mutation SetSeo($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key value }
          userErrors { field message code }
        }
      }`,
      variables: { metafields },
      diff: { ownerId: input.ownerId, seoTitle: input.seoTitle, seoDescription: input.seoDescription },
      entityIdFrom: () => input.ownerId,
      userErrorsFrom: (d) => d.metafieldsSet.userErrors,
    });
  }

  async function updateProductDescription(input: { productId: string; descriptionHtml: string; previousHtml?: string; idempotencyKey: string }) {
    type R = { productUpdate: { product: { id: string; handle: string } | null; userErrors: UserError[] } };
    return mutate<R>({
      entity: "shopify.product",
      action: "productUpdate",
      idempotencyKey: input.idempotencyKey,
      query: `mutation UpdateProductDescription($product: ProductUpdateInput!) {
        productUpdate(product: $product) {
          product { id handle }
          userErrors { field message }
        }
      }`,
      variables: { product: { id: input.productId, descriptionHtml: input.descriptionHtml } },
      diff: { productId: input.productId, before: input.previousHtml ?? null, after: input.descriptionHtml },
      entityIdFrom: (d) => d.productUpdate.product?.id,
      userErrorsFrom: (d) => d.productUpdate.userErrors,
    });
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async function listCollections(first = 50) {
    type R = { collections: { edges: Array<{ node: { id: string; handle: string; title: string; descriptionHtml: string; productsCount: { count: number } } }> } };
    const d = await gql<R>(
      `query Collections($first: Int!) {
        collections(first: $first, sortKey: TITLE) {
          edges { node { id handle title descriptionHtml productsCount { count } } }
        }
      }`,
      { first },
    );
    return d.collections.edges.map((e) => ({ ...e.node, productsCount: e.node.productsCount?.count ?? 0 }));
  }

  async function listBlogs() {
    type R = { blogs: { edges: Array<{ node: { id: string; handle: string; title: string } }> } };
    const d = await gql<R>(`query { blogs(first: 10) { edges { node { id handle title } } } }`);
    return d.blogs.edges.map((e) => e.node);
  }

  async function getProduct(handle: string) {
    type R = { productByHandle: { id: string; handle: string; title: string; descriptionHtml: string; tags: string[]; featuredImage: { url: string } | null } | null };
    const d = await gql<R>(
      `query Product($handle: String!) {
        productByHandle(handle: $handle) { id handle title descriptionHtml tags featuredImage { url } }
      }`,
      { handle },
    );
    return d.productByHandle;
  }

  /** Orders since a date, with a best-effort first-touch source for the weekly digest. */
  async function recentOrders(sinceIso: string, first = 100): Promise<ShopifyOrder[]> {
    type R = {
      orders: {
        edges: Array<{
          node: {
            id: string;
            name: string;
            createdAt: string;
            totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
            customerJourneySummary: { firstVisit: { source: string | null; referrerUrl: string | null; utmParameters: { source: string | null; medium: string | null } | null } | null } | null;
          };
        }>;
      };
    };
    const d = await gql<R>(
      `query RecentOrders($first: Int!, $query: String!) {
        orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
          edges { node {
            id name createdAt
            totalPriceSet { shopMoney { amount currencyCode } }
            customerJourneySummary { firstVisit { source referrerUrl utmParameters { source medium } } }
          } }
        }
      }`,
      { first, query: `created_at:>=${sinceIso.slice(0, 10)}` },
    );
    return d.orders.edges.map(({ node }) => {
      const fv = node.customerJourneySummary?.firstVisit;
      const source = fv?.utmParameters?.source ?? fv?.source ?? (fv?.referrerUrl ? hostOf(fv.referrerUrl) : "direct");
      return {
        id: node.id,
        name: node.name,
        createdAt: node.createdAt,
        total: Number(node.totalPriceSet.shopMoney.amount),
        currency: node.totalPriceSet.shopMoney.currencyCode,
        source: (source || "direct").toLowerCase(),
      };
    });
  }

  return { gql, createArticleDraft, setSeoMetafields, updateProductDescription, listCollections, listBlogs, getProduct, recentOrders, endpoint, dryRun };
}

export type ShopifyClient = ReturnType<typeof createShopifyClient>;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
