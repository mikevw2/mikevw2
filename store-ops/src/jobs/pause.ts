/**
 * The PAUSED flag file. When present, the poster refuses to run. Only a human removes it.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PAUSED_FILE = process.env["STORE_OPS_PAUSED_FILE"] ?? path.resolve(here, "..", "..", "PAUSED");

export function isPaused(file = PAUSED_FILE): boolean {
  return existsSync(file);
}

export function pausedReason(file = PAUSED_FILE): string | null {
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

export function pause(reason: string, file = PAUSED_FILE): void {
  writeFileSync(file, `${new Date().toISOString()} ${reason}\n`, { flag: "a" });
}

export function unpause(file = PAUSED_FILE): void {
  if (existsSync(file)) unlinkSync(file);
}
