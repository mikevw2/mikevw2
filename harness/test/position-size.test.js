import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sizeFixedFractional, atrStop, kellyFraction, expectancyR } from '../lib/position-size.js';

test('long fixed-fractional sizing', () => {
  const s = sizeFixedFractional({ equity: 50000, riskPct: 1, entry: 100, stop: 95, targets: [110, 120] });
  assert.equal(s.direction, 'long');
  assert.equal(s.units, 100);          // $500 risk / $5 per share
  assert.equal(s.actualRisk, 500);
  assert.equal(s.positionValue, 10000);
  assert.deepEqual(s.rMultiples.map(r => r.r), [2, 4]);
  assert.equal(s.rewardRisk, 2);
});

test('short sizing and position cap', () => {
  const s = sizeFixedFractional({ equity: 20000, riskPct: 1, entry: 50, stop: 51, maxPositionPct: 20 });
  assert.equal(s.direction, 'short');
  // uncapped would be 200 shares = $10,000 = 50% of equity; cap at 20% => $4,000 => 80 shares
  assert.equal(s.units, 80);
  assert.equal(s.capped, true);
});

test('options multiplier and lot size', () => {
  const s = sizeFixedFractional({ equity: 25000, riskPct: 2, entry: 3.0, stop: 1.5, multiplier: 100, lotSize: 1 });
  assert.equal(s.perUnitRisk, 150);
  assert.equal(s.units, 3);            // $500 / $150 = 3.33 -> 3 contracts
});

test('rejects bad input', () => {
  assert.throws(() => sizeFixedFractional({ equity: 0, riskPct: 1, entry: 10, stop: 9 }));
  assert.throws(() => sizeFixedFractional({ equity: 100, riskPct: 1, entry: 10, stop: 10 }));
});

test('atr stop, kelly, expectancy', () => {
  assert.equal(atrStop({ entry: 100, atr: 2, mult: 1.5 }), 97);
  assert.equal(atrStop({ entry: 100, atr: 2, mult: 1.5, direction: 'short' }), 103);
  assert.equal(kellyFraction({ winRate: 0.5, avgWin: 2, avgLoss: 1 }), 25);
  assert.equal(kellyFraction({ winRate: 0.3, avgWin: 1, avgLoss: 1 }), 0);
  assert.equal(expectancyR({ winRate: 0.4, avgWinR: 2.5, avgLossR: 1 }), 0.4);
});
