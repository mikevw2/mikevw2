import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rentalDays, isWeekendSpan, priceItem, deliveryFee, quote, availability } from '../lib/pricing.js';

const business = { service_area: { free_radius_miles: 25, per_mile_fee: 2, max_radius_miles: 150, round_trip: true },
  pricing: { tax_rate_pct: 6, bundle: { min_items: 2, discount_pct: 10 }, weekend_days: [5, 6, 0] } };
const phone = { id: 'phone', name: 'Phone', quantity: 1, pricing: { base_rate: 300, additional_day_rate: 75, weekend_rate: 350, deposit: 100, setup_fee: 0 },
  addons: [{ id: 'usb', name: 'USB', price: 40 }], requires: { delivery: false } };
const wall = { id: 'wall', name: 'Wall', quantity: 1, pricing: { base_rate: 400, additional_day_rate: 100, weekend_rate: null, deposit: 150, setup_fee: 75 }, requires: { delivery: true } };

test('days and weekend detection', () => {
  assert.equal(rentalDays('2026-06-12', '2026-06-12'), 1);
  assert.equal(rentalDays('2026-06-12', '2026-06-14'), 3);
  assert.equal(isWeekendSpan('2026-06-12', '2026-06-14'), true);   // Fri-Sun
  assert.equal(isWeekendSpan('2026-06-11', '2026-06-12'), false);  // Thu-Fri
  assert.throws(() => rentalDays('2026-06-14', '2026-06-12'));
});

test('item pricing picks the cheaper of weekend and computed', () => {
  const wk = priceItem(phone, { start: '2026-06-12', end: '2026-06-14', addons: ['usb'] });
  assert.equal(wk.rateApplied, 'weekend'); assert.equal(wk.rental, 350); assert.equal(wk.lineTotal, 390);
  const one = priceItem(phone, { start: '2026-06-13', end: '2026-06-13' });
  assert.equal(one.rateApplied, 'daily'); assert.equal(one.rental, 300);
  assert.throws(() => priceItem(phone, { start: '2026-06-13', end: '2026-06-13', addons: ['nope'] }));
});

test('delivery fee', () => {
  assert.deepEqual(deliveryFee(10, business.service_area).fee, 0);
  assert.equal(deliveryFee(40, business.service_area).fee, 60);     // 15 mi over x2 x $2
  assert.equal(deliveryFee(200, business.service_area).fee, null);
  assert.equal(deliveryFee(null, business.service_area).fee, 0);
});

test('full quote with bundle, delivery, tax, deposit', () => {
  const q = quote({ items: [{ item: phone, addons: ['usb'] }, { item: wall }], start: '2026-06-13', end: '2026-06-13', miles: 40 }, business);
  assert.equal(q.rentalSubtotal, 700);
  assert.equal(q.bundleDiscount, 70);
  assert.equal(q.taxable, 745);        // 700 - 70 + 40 addons + 75 setup
  assert.equal(q.tax, 44.7);
  assert.equal(q.delivery.fee, 60);
  assert.equal(q.total, 849.7);
  assert.equal(q.deposit, 250);
  assert.equal(q.manualReview, false);
});

test('out-of-radius quote flags manual review', () => {
  const q = quote({ items: [{ item: wall }], start: '2026-06-13', end: '2026-06-13', miles: 500 }, business);
  assert.equal(q.total, null); assert.equal(q.manualReview, true);
});

test('availability honors turnaround and status', () => {
  const bookings = [
    { id: 'b1', item_id: 'wall', start: '2026-06-10', end: '2026-06-10', status: 'confirmed' },
    { id: 'b2', item_id: 'wall', start: '2026-06-20', end: '2026-06-20', status: 'cancelled' },
  ];
  assert.equal(availability(wall, bookings, { start: '2026-06-11', end: '2026-06-11', turnaroundDays: 1 }).available, false);
  assert.equal(availability(wall, bookings, { start: '2026-06-12', end: '2026-06-12', turnaroundDays: 1 }).available, true);
  assert.equal(availability(wall, bookings, { start: '2026-06-20', end: '2026-06-20' }).available, true);
});
