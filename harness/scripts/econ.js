#!/usr/bin/env node
// Unit economics CLI. Example:
//   node scripts/econ.js data/properties            # all units + portfolio rollup
//   node scripts/econ.js data/properties/foo.yaml   # one unit
//   add --json for machine output
import { analyze, rollup } from '../lib/unit-economics.js';
import { validateProperty } from '../lib/property.js';
import { readYaml, expandPaths } from '../lib/io.js';

const argv = process.argv.slice(2);
const json = argv.includes('--json');
const paths = argv.filter(a => !a.startsWith('--'));
if (!paths.length) paths.push('data/properties');

const results = [];
for (const f of expandPaths(paths, '.yaml')) {
  const prop = readYaml(f);
  const v = validateProperty(prop);
  if (!v.ok) { console.error(`${f}: ${v.errors.join('; ')}`); process.exitCode = 1; continue; }
  results.push(analyze(prop));
}
const port = results.length > 1 ? rollup(results) : null;
if (json) { console.log(JSON.stringify({ units: results, portfolio: port }, null, 2)); process.exit(); }

const money = (n) => n == null ? '-' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
for (const r of results) {
  console.log(`\n${r.id} (${r.type})`);
  console.log(`  gross ${money(r.gross)}  effective ${money(r.effectiveGross)}  opex ${money(r.opex)} (${r.opexRatioPct}%)`);
  console.log(`  NOI ${money(r.noi)}  debt ${money(r.debtService)}  cash flow ${money(r.cashFlow)} (${money(r.cashFlowMonthly)}/mo)`);
  console.log(`  cap ${r.capRate ?? '-'}%  CoC ${r.cashOnCash ?? '-'}%  DSCR ${r.dscr ?? '-'}`);
  if (r.type === 'str') console.log(`  RevPAR ${money(r.str.revpar)}  nights ${r.str.nightsBooked}  break-even occupancy ${r.breakEvenOccupancyPct}%`);
  else console.log(`  break-even rent ${money(r.breakEvenRentMonthly)}/mo`);
}
if (port) {
  console.log(`\nPORTFOLIO (${port.units} units)`);
  console.log(`  NOI ${money(port.noi)}  debt ${money(port.debtService)}  cash flow ${money(port.cashFlow)} (${money(port.cashFlowMonthly)}/mo)  DSCR ${port.dscr ?? '-'}`);
}
