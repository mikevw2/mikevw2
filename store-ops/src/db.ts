/**
 * Thin Postgres layer. One pool, typed query helper, and the small write helpers
 * (publish log, job runs, monthly task counter) that every job shares.
 *
 * Nothing here is clever on purpose: the owner can read it in a minute.
 */
import pg from "pg";
import { loadEnv, requireEnv } from "./config.js";

export type Queryable = {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<pg.QueryResult<R>>;
};

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (!pool) {
    const url = requireEnv("DATABASE_URL", loadEnv());
    pool = new pg.Pool({ connectionString: url, max: 5 });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

/** Run fn inside a transaction on a dedicated client. */
export async function withTx<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// publish_log
// ---------------------------------------------------------------------------

export interface PublishLogEntry {
  entity: string;
  action: string;
  entityId?: string | null;
  diff: unknown;
  idempotencyKey: string;
  ok?: boolean;
  error?: string | null;
}

/** Interface every external client takes so it can be tested without a database. */
export interface PublishLogger {
  /** Returns true if the key was new (and the row was written), false if it already existed. */
  log(entry: PublishLogEntry): Promise<boolean>;
  /** Has this idempotency key already been recorded as ok? */
  seen(idempotencyKey: string): Promise<boolean>;
}

export function pgPublishLogger(db: Queryable = getPool()): PublishLogger {
  return {
    async log(e) {
      const r = await db.query(
        `INSERT INTO publish_log (entity, action, entity_id, diff_json, idempotency_key, ok, error)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING id`,
        [e.entity, e.action, e.entityId ?? null, JSON.stringify(e.diff ?? {}), e.idempotencyKey, e.ok ?? true, e.error ?? null],
      );
      return r.rowCount === 1;
    },
    async seen(key) {
      const r = await db.query(`SELECT 1 FROM publish_log WHERE idempotency_key = $1 AND ok = true`, [key]);
      return (r.rowCount ?? 0) > 0;
    },
  };
}

/** In-memory logger for tests, dry runs and scripts. */
export function memoryPublishLogger(): PublishLogger & { entries: PublishLogEntry[] } {
  const entries: PublishLogEntry[] = [];
  return {
    entries,
    async log(e) {
      if (entries.some((x) => x.idempotencyKey === e.idempotencyKey)) return false;
      entries.push(e);
      return true;
    },
    async seen(key) {
      return entries.some((x) => x.idempotencyKey === key && (x.ok ?? true));
    },
  };
}

// ---------------------------------------------------------------------------
// job_runs
// ---------------------------------------------------------------------------

export async function startJobRun(job: string, db: Queryable = getPool()): Promise<number> {
  const r = await db.query<{ id: number }>(`INSERT INTO job_runs (job) VALUES ($1) RETURNING id`, [job]);
  return r.rows[0]!.id;
}

export async function finishJobRun(id: number, ok: boolean, notes: string, db: Queryable = getPool()): Promise<void> {
  await db.query(`UPDATE job_runs SET finished_at = now(), ok = $2, notes = $3 WHERE id = $1`, [id, ok, notes]);
}

// ---------------------------------------------------------------------------
// Monthly API task counter (DataForSEO cap)
// ---------------------------------------------------------------------------

/** Interface the DataForSEO client takes; pure in tests, Postgres in production. */
export interface MonthlyTaskCounter {
  /** Tasks already used this calendar month. */
  used(): Promise<number>;
  /** Record n more tasks. */
  add(n: number): Promise<void>;
}

export function pgMonthlyCounter(provider: string, db: Queryable = getPool(), now: () => Date = () => new Date()): MonthlyTaskCounter {
  const monthStart = () => {
    const d = now();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
  };
  return {
    async used() {
      const r = await db.query<{ count: number }>(`SELECT count FROM api_task_counter WHERE provider = $1 AND month = $2`, [provider, monthStart()]);
      return Number(r.rows[0]?.count ?? 0);
    },
    async add(n) {
      await db.query(
        `INSERT INTO api_task_counter (provider, month, count) VALUES ($1,$2,$3)
         ON CONFLICT (provider, month) DO UPDATE SET count = api_task_counter.count + EXCLUDED.count`,
        [provider, monthStart(), n],
      );
    },
  };
}

export function memoryMonthlyCounter(initial = 0): MonthlyTaskCounter & { count: number } {
  const c = { count: initial, async used() { return c.count; }, async add(n: number) { c.count += n; } };
  return c;
}
