/**
 * Google Search Console: searchanalytics.query for one property using a service-account JWT.
 * jose signs the assertion; no google-auth-library dependency.
 *
 * Setup (human): create a service account, download the JSON key, add its client_email as a
 * user (Full or Restricted) on the property in Search Console, set GSC_SERVICE_ACCOUNT_JSON and GSC_SITE_URL.
 */
import { readFileSync } from "node:fs";
import { SignJWT, importPKCS8 } from "jose";
import { loadEnv, requireEnv } from "../config.js";
import { defaultFetch, readJson, type FetchLike } from "./http.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const API = "https://searchconsole.googleapis.com/webmasters/v3";

export interface ServiceAccount { client_email: string; private_key: string; token_uri?: string }

export type GscDimension = "query" | "page" | "date" | "country" | "device";

export interface GscRow { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }

export interface GscQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions?: GscDimension[];
  rowLimit?: number;
  startRow?: number;
  dimensionFilterGroups?: unknown[];
}

export function parseServiceAccount(raw: string): ServiceAccount {
  const text = raw.trim().startsWith("{") ? raw : readFileSync(raw, "utf8");
  const json = JSON.parse(text) as Partial<ServiceAccount>;
  if (!json.client_email || !json.private_key) throw new Error("service account JSON needs client_email and private_key");
  return { client_email: json.client_email, private_key: json.private_key, token_uri: json.token_uri };
}

export interface GscClientOptions {
  serviceAccount?: ServiceAccount;
  siteUrl?: string;
  fetch?: FetchLike;
  now?: () => Date;
}

export function createGscClient(opts: GscClientOptions = {}) {
  const env = loadEnv();
  const doFetch = opts.fetch ?? defaultFetch;
  const now = opts.now ?? (() => new Date());
  let sa: ServiceAccount | undefined = opts.serviceAccount;
  let siteUrl = opts.siteUrl;
  let cachedToken: { value: string; exp: number } | undefined;

  function account(): ServiceAccount {
    if (!sa) sa = parseServiceAccount(requireEnv("GSC_SERVICE_ACCOUNT_JSON", env));
    return sa;
  }
  function site(): string {
    if (!siteUrl) siteUrl = requireEnv("GSC_SITE_URL", env);
    return siteUrl;
  }

  async function accessToken(): Promise<string> {
    const t = Math.floor(now().getTime() / 1000);
    if (cachedToken && cachedToken.exp - 60 > t) return cachedToken.value;
    const acct = account();
    const key = await importPKCS8(acct.private_key, "RS256");
    const assertion = await new SignJWT({ scope: SCOPE })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(acct.client_email)
      .setAudience(acct.token_uri ?? TOKEN_URL)
      .setIssuedAt(t)
      .setExpirationTime(t + 3600)
      .sign(key);
    const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion });
    const res = await doFetch(acct.token_uri ?? TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    const json = await readJson<{ access_token: string; expires_in: number }>(res, TOKEN_URL);
    cachedToken = { value: json.access_token, exp: t + json.expires_in };
    return json.access_token;
  }

  async function query(q: GscQuery): Promise<GscRow[]> {
    const url = `${API}/sites/${encodeURIComponent(site())}/searchAnalytics/query`;
    const res = await doFetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: q.startDate, endDate: q.endDate, dimensions: q.dimensions ?? ["query"], rowLimit: q.rowLimit ?? 1000, startRow: q.startRow ?? 0, ...(q.dimensionFilterGroups ? { dimensionFilterGroups: q.dimensionFilterGroups } : {}) }),
    });
    const json = await readJson<{ rows?: GscRow[] }>(res, url);
    return json.rows ?? [];
  }

  /** Totals for a range (no dimensions). */
  async function totals(startDate: string, endDate: string): Promise<{ clicks: number; impressions: number; ctr: number; position: number }> {
    const rows = await query({ startDate, endDate, dimensions: [], rowLimit: 1 });
    const r = rows[0];
    return r ? { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position } : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }

  return { query, totals, accessToken };
}

export type GscClient = ReturnType<typeof createGscClient>;
