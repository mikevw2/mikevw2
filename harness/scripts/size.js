#!/usr/bin/env node
// Position size CLI. Example:
//   node scripts/size.js --entry 100 --stop 95 --targets 110,120 [--equity 50000] [--risk 1] [--mult 100]
// Defaults for equity, risk, and position cap come from data/risk.yaml.
import { sizeFixedFractional } from '../lib/position-size.js';
import { loadRisk } from '../lib/io.js';

const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map(s => {
  const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ')];
}));
const risk = loadRisk();
const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
try {
  const out = sizeFixedFractional({
    equity: num(args.equity, risk.account_equity),
    riskPct: num(args.risk, risk.default_risk_pct ?? risk.max_risk_per_trade_pct),
    entry: num(args.entry), stop: num(args.stop),
    targets: args.targets ? args.targets.split(',').map(Number) : [],
    maxPositionPct: num(args.cap, risk.max_position_pct),
    multiplier: num(args.mult, 1), lotSize: num(args.lot, 1),
  });
  if (out.actualRiskPct > risk.max_risk_per_trade_pct) out.warning = `risk ${out.actualRiskPct}% exceeds max_risk_per_trade_pct ${risk.max_risk_per_trade_pct}`;
  if (out.rewardRisk != null && out.rewardRisk < risk.min_reward_risk) out.warning = `R:R ${out.rewardRisk} below min_reward_risk ${risk.min_reward_risk}`;
  console.log(JSON.stringify(out, null, 2));
} catch (e) {
  console.error('size: ' + e.message); process.exit(1);
}
