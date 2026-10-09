/** Apply db/schema.sql to DATABASE_URL. Idempotent (IF NOT EXISTS everywhere). */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool } from "../src/db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(path.resolve(here, "..", "db", "schema.sql"), "utf8");
try {
  await getPool().query(sql);
  console.log("schema applied");
} finally {
  await closePool();
}
