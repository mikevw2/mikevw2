import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyPayment, analyze, rollup } from '../lib/unit-economics.js';

const ltr = {
  id: 't-ltr', type: 'ltr',
  purchase: { price: 300000, down_payment: 60000, closing_costs: 5000, rehab: 0 },
  loan: { principal: 240000, rate_pct: 6.5, term_years: 30 },
  income: { rent_monthly: 2400, other_monthly: 0, vacancy_pct: 5 },
  expenses: { tax_monthly: 250, insurance_monthly: 100, hoa_monthly: 0, utilities_monthly: 0, other_monthly: 0,
              maintenance_pct: 5, management_pct: 0, capex_reserve_pct: 5 },
};

test('mortgage payment', () => {
  assert.equal(monthlyPayment({ principal: 240000, rate: 6.5, termYears: 30 }), 1516.96);
  assert.equal(monthlyPayment({ principal: 120000, rate: 0, termYears: 10 }), 1000);
});

test('ltr analysis', () => {
  const r = analyze(ltr);
  assert.equal(r.gross, 28800);
  assert.equal(r.effectiveGross, 27360);
  // fixed 4200 + variable 10% of 27360 = 2736 => 6936
  assert.equal(r.opex, 6936);
  assert.equal(r.noi, 20424);
  assert.equal(r.debtService, 18203.52);
  assert.equal(r.cashFlow, 2220.48);
  assert.equal(r.capRate, 6.81);
  assert.equal(r.cashOnCash, 3.42);
  assert.equal(r.dscr, 1.12);
  assert.ok(r.breakEvenRentMonthly > 2000 && r.breakEvenRentMonthly < 2400);
});

test('str analysis', () => {
  const r = analyze({
    id: 't-str', type: 'str',
    income: { adr: 200, occupancy_pct: 60, nights_available: 365, platform_fee_pct: 3, turns_per_year: 80 },
    expenses: { tax_monthly: 200, insurance_monthly: 150, utilities_monthly: 300, cleaning_cost_per_turn: 120,
                maintenance_pct: 5, management_pct: 0, capex_reserve_pct: 5 },
  });
  assert.equal(r.gross, 43800);
  assert.equal(r.str.revpar, 120);
  assert.equal(r.str.nightsBooked, 219);
  assert.ok(r.noi > 0);
  assert.ok(r.breakEvenOccupancyPct > 0 && r.breakEvenOccupancyPct < 60);
});

test('rollup', () => {
  const a = analyze(ltr), b = analyze({ ...ltr, id: 'b' });
  const p = rollup([a, b]);
  assert.equal(p.units, 2);
  assert.equal(p.noi, 40848);
});
