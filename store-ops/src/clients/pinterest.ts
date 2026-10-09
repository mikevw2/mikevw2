/**
 * Pinterest API v5 client plus the OAuth helper needed for the Standard-access demo.
 *
 * Posting is the only write and it is only ever called by src/jobs/poster.ts
 * from approved pin_queue rows. The client itself enforces nothing; the guards do.
 *
 * VERIFY AGAINST LIVE DOCS before first real run:
 *   - POST /v5/pins media_source shapes (image_base64 / image_url) and the `alt_text` field
 *   - analytics metric_types names (IMPRESSION, SAVE, OUTBOUND_CLICK, PIN_CLICK) and response shape
 *   - OAuth scopes string and token endpoint auth (Basic app_id:secret)
 */
import { loadEnv, requireEnv } from "../config.js";
import { defaultFetch, readJson, type FetchLike } from "./http.js";

const API = "https://api.pinterest.com/v5";
const OAUTH_AUTHORIZE = "https://www.pinterest.com/oauth/";
const OAUTH_TOKEN = `${API}/oauth/token`;

export const PINTEREST_SCOPES = ["boards:read", "pins:read", "pins:write", "user_accounts:read"] as const;

export interface PinterestBoard { id: string; name: string; privacy?: string; pin_count?: number }

export interface CreatePinInput {
  board_id: string;
  title: string;
  description: string;
  link: string;
  alt_text?: string;
  media_source: { source_type: "image_base64"; content_type: "image/png" | "image/jpeg"; data: string } | { source_type: "image_url"; url: string };
}

export interface CreatedPin { id: string; link?: string; board_id?: string; created_at?: string }

export type AnalyticsMetric = "IMPRESSION" | "SAVE" | "OUTBOUND_CLICK" | "PIN_CLICK" | "ENGAGEMENT";

export interface DailyMetric { date: string; metrics: Partial<Record<AnalyticsMetric, number>> }

export interface PinterestClientOptions {
  accessToken?: string;
  fetch?: FetchLike;
  /** Log instead of sending writes. */
  dryRun?: boolean;
}

export function createPinterestClient(opts: PinterestClientOptions = {}) {
  const env = loadEnv();
  const token = opts.accessToken ?? (opts.dryRun ? env.PINTEREST_ACCESS_TOKEN ?? "" : requireEnv("PINTEREST_ACCESS_TOKEN", env));
  const doFetch = opts.fetch ?? defaultFetch;
  const dryRun = opts.dryRun ?? false;

  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${API}${path}`;
    const res = await doFetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    return readJson<T>(res, url);
  }

  async function listBoards(): Promise<PinterestBoard[]> {
    const out: PinterestBoard[] = [];
    let bookmark: string | undefined;
    do {
      const q = new URLSearchParams({ page_size: "100", ...(bookmark ? { bookmark } : {}) });
      const page = await call<{ items: PinterestBoard[]; bookmark?: string | null }>(`/boards?${q}`);
      out.push(...page.items);
      bookmark = page.bookmark ?? undefined;
    } while (bookmark);
    return out;
  }

  async function createPin(input: CreatePinInput): Promise<CreatedPin> {
    if (input.title.length > 100) throw new Error("pin title > 100 chars");
    if (input.description.length > 500) throw new Error("pin description > 500 chars");
    if (dryRun) {
      return { id: `dry-run-${Date.now()}`, board_id: input.board_id, link: input.link };
    }
    return call<CreatedPin>("/pins", { method: "POST", body: JSON.stringify(input) });
  }

  /** Per-pin analytics. Dates are YYYY-MM-DD. */
  async function getPinAnalytics(pinId: string, startDate: string, endDate: string, metrics: AnalyticsMetric[] = ["IMPRESSION", "SAVE", "OUTBOUND_CLICK"]): Promise<DailyMetric[]> {
    const q = new URLSearchParams({ start_date: startDate, end_date: endDate, metric_types: metrics.join(","), app_types: "ALL" });
    const raw = await call<AnalyticsRaw>(`/pins/${encodeURIComponent(pinId)}/analytics?${q}`);
    return normalizeAnalytics(raw);
  }

  /** Account-wide analytics; this is what the impression-drop auto-pause reads. */
  async function getAccountAnalytics(startDate: string, endDate: string, metrics: AnalyticsMetric[] = ["IMPRESSION", "SAVE", "OUTBOUND_CLICK", "PIN_CLICK"]): Promise<DailyMetric[]> {
    const q = new URLSearchParams({ start_date: startDate, end_date: endDate, metric_types: metrics.join(","), granularity: "DAY" });
    const raw = await call<AnalyticsRaw>(`/user_account/analytics?${q}`);
    return normalizeAnalytics(raw);
  }

  /** Sum one metric over a date range (helper for the auto-pause check). */
  async function sumAccountMetric(metric: AnalyticsMetric, startDate: string, endDate: string): Promise<number> {
    const rows = await getAccountAnalytics(startDate, endDate, [metric]);
    return rows.reduce((acc, r) => acc + (r.metrics[metric] ?? 0), 0);
  }

  return { listBoards, createPin, getPinAnalytics, getAccountAnalytics, sumAccountMetric, dryRun };
}

export type PinterestClient = ReturnType<typeof createPinterestClient>;

/**
 * Pinterest returns analytics as { all: { daily_metrics: [{ date, metrics: {IMPRESSION: n} }] } }
 * for pins and { all: { daily_metrics: [...] } } (or per app type) for the account; we flatten to one list.
 */
type AnalyticsRaw = Record<string, { daily_metrics?: Array<{ date: string; metrics?: Record<string, number>; data_status?: string }> } | undefined>;

export function normalizeAnalytics(raw: AnalyticsRaw): DailyMetric[] {
  const bucket = raw["all"] ?? raw["ALL"] ?? Object.values(raw)[0];
  const daily = bucket?.daily_metrics ?? [];
  return daily.map((d) => ({ date: d.date, metrics: (d.metrics ?? {}) as Partial<Record<AnalyticsMetric, number>> }));
}

// ---------------------------------------------------------------------------
// OAuth (needed once, and recorded for the Standard-access demo video)
// ---------------------------------------------------------------------------

export function pinterestAuthorizationUrl(opts: { appId?: string; redirectUri?: string; state: string; scopes?: readonly string[] } ): string {
  const env = loadEnv();
  const q = new URLSearchParams({
    client_id: opts.appId ?? requireEnv("PINTEREST_APP_ID", env),
    redirect_uri: opts.redirectUri ?? env.PINTEREST_REDIRECT_URI,
    response_type: "code",
    scope: (opts.scopes ?? PINTEREST_SCOPES).join(","),
    state: opts.state,
  });
  return `${OAUTH_AUTHORIZE}?${q}`;
}

export interface PinterestToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  scope: string;
}

export async function exchangePinterestCode(opts: { code: string; appId?: string; appSecret?: string; redirectUri?: string; fetch?: FetchLike }): Promise<PinterestToken> {
  const env = loadEnv();
  const appId = opts.appId ?? requireEnv("PINTEREST_APP_ID", env);
  const secret = opts.appSecret ?? requireEnv("PINTEREST_APP_SECRET", env);
  const basic = Buffer.from(`${appId}:${secret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "authorization_code", code: opts.code, redirect_uri: opts.redirectUri ?? env.PINTEREST_REDIRECT_URI });
  const res = await (opts.fetch ?? defaultFetch)(OAUTH_TOKEN, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return readJson<PinterestToken>(res, OAUTH_TOKEN);
}

export async function refreshPinterestToken(opts: { refreshToken: string; appId?: string; appSecret?: string; fetch?: FetchLike }): Promise<PinterestToken> {
  const env = loadEnv();
  const appId = opts.appId ?? requireEnv("PINTEREST_APP_ID", env);
  const secret = opts.appSecret ?? requireEnv("PINTEREST_APP_SECRET", env);
  const basic = Buffer.from(`${appId}:${secret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: opts.refreshToken });
  const res = await (opts.fetch ?? defaultFetch)(OAUTH_TOKEN, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return readJson<PinterestToken>(res, OAUTH_TOKEN);
}
