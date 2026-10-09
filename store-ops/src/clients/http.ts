/** Shared fetch type so every client can take an injected transport in tests. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const defaultFetch: FetchLike = (input, init) => fetch(input, init);

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly url: string, public readonly body: string) {
    super(`HTTP ${status} from ${url}: ${body.slice(0, 500)}`);
    this.name = "HttpError";
  }
}

export async function readJson<T>(res: Response, url: string): Promise<T> {
  const text = await res.text();
  if (!res.ok) throw new HttpError(res.status, url, text);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(res.status, url, `non-JSON body: ${text.slice(0, 200)}`);
  }
}
