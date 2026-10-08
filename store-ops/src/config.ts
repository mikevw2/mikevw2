/**
 * Environment loading (zod-validated) and the hard caps.
 *
 * The caps live in code, not in prompts. Every job imports CAPS and routes its
 * decisions through src/guards/caps.ts, which is pure and unit-tested.
 */
import "dotenv/config";
import { z } from "zod";

export const CAPS = {
  /** Pins posted per calendar day, all boards combined. Spec says 3–10; we enforce the top. */
  MAX_PINS_PER_DAY: 10,
  /** Minimum days between two pins pointing at the same page URL. */
  MIN_DAYS_BETWEEN_PINS_SAME_URL: 7,
  /** Long-form guides drafted per day (articles go up as isPublished:false). */
  MAX_GUIDES_PER_DAY: 1,
  /** Collection / product copy rewrites drafted per day. */
  MAX_PAGE_REWRITES_PER_DAY: 10,
  /** Internal-link anchor edits suggested per day. */
  MAX_LINK_EDITS_PER_DAY: 20,
  /** Outreach / expert-answer drafts per day. */
  MAX_OUTREACH_DRAFTS_PER_DAY: 5,
  /** DataForSEO tasks per calendar month (each task = up to 1,000 keywords). */
  MAX_DATAFORSEO_TASKS_PER_MONTH: 400,
  /** Poster auto-pauses when impressions this week < (1 - this) x last week. */
  IMPRESSION_DROP_AUTOPAUSE: 0.5,
  /** Pin posting window, local hours (inclusive start, inclusive end). */
  PIN_WINDOW_START_HOUR: 8,
  PIN_WINDOW_END_HOUR: 21,
} as const;

export type CapKind = "guide" | "page_rewrite" | "link_edit" | "outreach" | "pin";

/** Per-kind daily caps in one place so dailyCapReached() has a single source of truth. */
export const DAILY_CAPS: Record<CapKind, number> = {
  guide: CAPS.MAX_GUIDES_PER_DAY,
  page_rewrite: CAPS.MAX_PAGE_REWRITES_PER_DAY,
  link_edit: CAPS.MAX_LINK_EDITS_PER_DAY,
  outreach: CAPS.MAX_OUTREACH_DRAFTS_PER_DAY,
  pin: CAPS.MAX_PINS_PER_DAY,
};

/** SDK model ids. Never append date suffixes. */
export const MODELS = {
  /** Long-form drafting and the weekly narrative. */
  DRAFT: "claude-opus-5-5",
  /** Cheap classification and short variants (pin copy). */
  CHEAP: "claude-haiku-5-5",
} as const;

export const SHOPIFY_API_VERSION = "2026-10";

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_ADMIN_TOKEN: z.string().optional(),
  PINTEREST_APP_ID: z.string().optional(),
  PINTEREST_APP_SECRET: z.string().optional(),
  PINTEREST_ACCESS_TOKEN: z.string().optional(),
  PINTEREST_REDIRECT_URI: z.string().default("http://localhost:3999/oauth/pinterest/callback"),
  DATAFORSEO_LOGIN: z.string().optional(),
  DATAFORSEO_PASSWORD: z.string().optional(),
  GSC_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GSC_SITE_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  APPROVAL_UI_PORT: z.coerce.number().int().positive().default(3999),
  STORE_TIMEZONE: z.string().default("America/Boise"),
  STORE_PUBLIC_URL: z.string().default("https://example.com"),
  NODE_ENV: z.string().default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/** Parse process.env once. Optional keys stay optional so tests and dry runs work without secrets. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached && source === process.env) return cached;
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  if (source === process.env) cached = parsed.data;
  return parsed.data;
}

/** Throw a readable error when a job needs a secret that is not set. */
export function requireEnv<K extends keyof Env>(key: K, env: Env = loadEnv()): NonNullable<Env[K]> {
  const v = env[key];
  if (v === undefined || v === "") {
    throw new Error(`Missing ${String(key)}; see .env.example for where to get it`);
  }
  return v as NonNullable<Env[K]>;
}
