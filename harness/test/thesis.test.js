import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateThesis } from '../lib/thesis.js';

const risk = { account_equity: 25000, max_risk_per_trade_pct: 1, max_position_pct: 25, min_reward_risk: 2, live_enabled: false };
const good = `---
ticker: XYZ
direction: long
instrument: equity
status: draft
setup: breakout
catalyst: earnings
entry: 100
stop: 95
targets: [112, 120]
invalidation: close below 95
horizon: swing
risk_pct: 1
paper: true
---
## Thesis
x
## Invalidation
y
`;

test('valid draft passes and computes size', () => {
  const r = validateThesis(good, risk);
  assert.equal(r.ok, true, r.errors.join('; '));
  assert.equal(r.size.units, 50);
});

test('risk breaches are errors', () => {
  assert.ok(!validateThesis(good.replace('risk_pct: 1', 'risk_pct: 2'), risk).ok);
  assert.ok(!validateThesis(good.replace('targets: [112, 120]', 'targets: [104]'), risk).ok);
  assert.ok(!validateThesis(good.replace('paper: true', 'paper: false'), risk).ok);
  assert.ok(!validateThesis(good.replace('stop: 95', 'stop: 105'), risk).ok);
});

test('approved requires a size no larger than computed', () => {
  const approvedNoSize = good.replace('status: draft', 'status: approved');
  assert.ok(!validateThesis(approvedNoSize, risk).ok);
  assert.ok(validateThesis(approvedNoSize.replace('paper: true', 'paper: true\nsize: 50'), risk).ok);
  assert.ok(!validateThesis(approvedNoSize.replace('paper: true', 'paper: true\nsize: 60'), risk).ok);
});

test('missing frontmatter fails', () => {
  assert.ok(!validateThesis('# no frontmatter', risk).ok);
});
