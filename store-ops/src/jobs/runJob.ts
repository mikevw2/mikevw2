/** Wrap a job body in a job_runs row. Any thrown error becomes ok=false with the message in notes. */
import { finishJobRun, getPool, startJobRun, closePool } from "../db.js";

export async function runJob(name: string, body: (log: (line: string) => void) => Promise<void>): Promise<boolean> {
  const notes: string[] = [];
  const log = (line: string) => {
    notes.push(line);
    console.log(`[${name}] ${line}`);
  };
  const db = getPool();
  const id = await startJobRun(name, db);
  let ok = true;
  try {
    await body(log);
  } catch (e) {
    ok = false;
    log(`ERROR ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  } finally {
    await finishJobRun(id, ok, notes.join("\n").slice(0, 8000), db);
  }
  return ok;
}

/** For `tsx src/jobs/x.ts` entry points: run, close the pool, exit non-zero on failure. */
export async function main(name: string, body: (log: (line: string) => void) => Promise<void>): Promise<void> {
  let ok = false;
  try {
    ok = await runJob(name, body);
  } finally {
    await closePool();
  }
  process.exitCode = ok ? 0 : 1;
}

export function todayIso(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
