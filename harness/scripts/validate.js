#!/usr/bin/env node
// Validate business file, inventory items, and trade theses.
//   node scripts/validate.js data/business.yaml data/inventory data/journal
//   node scripts/validate.js data/journal/2026-10-13-XYZ.md
import { readFileSync } from 'node:fs';
import { validateThesis } from '../lib/thesis.js';
import { validateItem, validateBusiness } from '../lib/inventory.js';
import { readYaml, loadRisk, expandPaths } from '../lib/io.js';

const paths = process.argv.slice(2);
if (!paths.length) { console.error('usage: validate.js <file|dir>...'); process.exit(2); }
const risk = loadRisk();
let failed = 0, checked = 0;
const report = (f, r) => {
  checked++;
  const tag = r.ok ? 'ok  ' : 'FAIL';
  console.log(`${tag} ${f}`);
  for (const e of r.errors) console.log(`       error: ${e}`);
  for (const w of r.warnings) console.log(`       warn:  ${w}`);
  if (!r.ok) failed++;
};
for (const f of [...expandPaths(paths, '.yaml'), ...expandPaths(paths, '.md')]) {
  if (/business\.yaml$/.test(f)) report(f, validateBusiness(readYaml(f)));
  else if (/[\\/]inventory[\\/].*\.yaml$/.test(f)) report(f, validateItem(readYaml(f)));
  else if (/[\\/]journal[\\/]/.test(f) && !/readme\.md$/i.test(f)) report(f, validateThesis(readFileSync(f, 'utf8'), risk));
}
console.log(`\n${checked} checked, ${failed} failed`);
process.exit(failed ? 1 : 0);
