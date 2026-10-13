#!/usr/bin/env node
// Quote CLI.
//   node scripts/quote.js --items guestbook-phone,flower-wall-white --start 2026-06-12 --end 2026-06-14 [--miles 40] [--addons keepsake-usb] [--json]
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { quote } from '../lib/pricing.js';
import { readYaml, ROOT } from '../lib/io.js';

const raw = process.argv.slice(2).join(' ');
const json = /--json\b/.test(raw);
const args = Object.fromEntries(raw.replace('--json', '').split('--').filter(Boolean).map(s => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ')]; }));
if (!args.items || !args.start || !args.end) { console.error('usage: quote.js --items a,b --start YYYY-MM-DD --end YYYY-MM-DD [--miles n] [--addons x,y]'); process.exit(2); }

const business = readYaml(join(ROOT, 'data', 'business.yaml'));
const invDir = join(ROOT, 'data', 'inventory');
const inventory = Object.fromEntries(readdirSync(invDir).filter(f => f.endsWith('.yaml') && !f.startsWith('_')).map(f => { const i = readYaml(join(invDir, f)); return [i.id, i]; }));
const addons = args.addons ? args.addons.split(',') : [];
const items = args.items.split(',').map(id => {
  const item = inventory[id]; if (!item) { console.error(`unknown item ${id}. Known: ${Object.keys(inventory).join(', ')}`); process.exit(1); }
  return { item, addons: addons.filter(a => (item.addons ?? []).some(x => x.id === a)) };
});
const q = quote({ items, start: args.start, end: args.end, miles: args.miles ? Number(args.miles) : undefined }, business);
if (json) { console.log(JSON.stringify(q, null, 2)); process.exit(); }
const $ = (n) => n == null ? 'manual' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
console.log(`Quote ${q.start} → ${q.end} (${q.days} day${q.days > 1 ? 's' : ''})`);
for (const l of q.lines) {
  console.log(`  ${l.name}: ${$(l.rental)} (${l.rateApplied})${l.setupFee ? ` + setup ${$(l.setupFee)}` : ''}${l.addons.length ? ` + add-ons ${$(l.addonsTotal)}` : ''}`);
}
if (q.bundleDiscount) console.log(`  Bundle discount: -${$(q.bundleDiscount)}`);
console.log(`  Delivery: ${$(q.delivery.fee)} (${q.delivery.note})`);
console.log(`  Tax: ${$(q.tax)}`);
console.log(`  TOTAL: ${$(q.total)}`);
console.log(`  Due to reserve (retainer): ${$(q.retainer)}   Balance ${q.balanceDueDaysBefore} days before: ${$(q.dueBeforeEvent)}   Refundable damage deposit: ${$(q.deposit)}`);
if (q.manualReview) console.log('  Needs manual review (outside delivery radius).');
