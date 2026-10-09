/**
 * DataForSEO: Google Ads search volume, live endpoint. One task = up to 1,000 keywords
 * (~$0.05–0.075). The monthly cap (400 tasks) is enforced through the injected counter
 * and the pure guard; the client refuses to send when the budget is exhausted.
 *
 * VERIFY AGAINST LIVE DOCS: endpoint path and result field names (search_volume, competition_index, cpc, monthly_searches).
 */
import { loadEnv, requireEnv } from "../config.js";
import type { MonthlyTaskCounter } from "../db.js";
import { canSpendTasks } from "../guards/caps.js";
import { defaultFetch, readJson, type FetchLike } from "./http.js";

const ENDPOINT = "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live";
export const MAX_KEYWORDS_PER_TASK = 1000;

export interface KeywordVolume {
  keyword: string;
  search_volume: number | null;
  competition: string | null;
  competition_index: number | null;
  cpc: number | null;
  monthly_searches: Array<{ year: number; month: number; search_volume: number }>;
}

interface DfsResponse {
  status_code: number;
  status_message: string;
  cost?: number;
  tasks: Array<{ status_code: number; status_message: string; cost?: number; result: KeywordVolume[] | null }>;
}

export interface DataForSeoOptions {
  login?: string;
  password?: string;
  counter: MonthlyTaskCounter;
  fetch?: FetchLike;
  locationCode?: number; // 2840 = United States
  languageCode?: string; // "en"
}

export function createDataForSeoClient(opts: DataForSeoOptions) {
  const env = loadEnv();
  const login = opts.login ?? env.DATAFORSEO_LOGIN;
  const password = opts.password ?? env.DATAFORSEO_PASSWORD;
  const doFetch = opts.fetch ?? defaultFetch;
  const locationCode = opts.locationCode ?? 2840;
  const languageCode = opts.languageCode ?? "en";

  /** Split keywords into tasks of ≤1,000. */
  function chunk(keywords: string[]): string[][] {
    const out: string[][] = [];
    for (let i = 0; i < keywords.length; i += MAX_KEYWORDS_PER_TASK) out.push(keywords.slice(i, i + MAX_KEYWORDS_PER_TASK));
    return out;
  }

  async function searchVolume(keywords: string[]): Promise<{ rows: KeywordVolume[]; tasksUsed: number; cost: number }> {
    const clean = Array.from(new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean)));
    if (clean.length === 0) return { rows: [], tasksUsed: 0, cost: 0 };
    const tasks = chunk(clean);
    const verdict = canSpendTasks(await opts.counter.used(), tasks.length);
    if (!verdict.ok) throw new Error(verdict.reason);
    if (!login || !password) {
      requireEnv("DATAFORSEO_LOGIN", env);
      requireEnv("DATAFORSEO_PASSWORD", env);
    }
    const basic = Buffer.from(`${login}:${password}`).toString("base64");
    const res = await doFetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
      body: JSON.stringify(tasks.map((kw) => ({ keywords: kw, location_code: locationCode, language_code: languageCode }))),
    });
    // Count before parsing: a sent task is billed whether or not we like the answer.
    await opts.counter.add(tasks.length);
    const json = await readJson<DfsResponse>(res, ENDPOINT);
    if (json.status_code !== 20000) throw new Error(`DataForSEO ${json.status_code}: ${json.status_message}`);
    const rows: KeywordVolume[] = [];
    for (const t of json.tasks) {
      if (t.status_code !== 20000) throw new Error(`DataForSEO task ${t.status_code}: ${t.status_message}`);
      rows.push(...(t.result ?? []));
    }
    return { rows, tasksUsed: tasks.length, cost: json.cost ?? 0 };
  }

  return { searchVolume, chunk };
}

export type DataForSeoClient = ReturnType<typeof createDataForSeoClient>;
