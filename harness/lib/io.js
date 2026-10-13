import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function readYaml(path) {
  return YAML.parse(readFileSync(path, 'utf8'));
}

export function loadRisk(root = ROOT) {
  return readYaml(join(root, 'data', 'risk.yaml'));
}

/** Expand a list of files/dirs into files matching ext (skipping _template*). */
export function expandPaths(paths, ext) {
  const out = [];
  for (const p of paths) {
    const abs = resolve(p);
    if (statSync(abs).isDirectory()) {
      for (const f of readdirSync(abs)) if (f.endsWith(ext) && !f.startsWith('_') && !f.startsWith('.')) out.push(join(abs, f));
    } else out.push(abs);
  }
  return out;
}
