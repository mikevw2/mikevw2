import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rentalDays, isWeekendSpan, priceItem, deliveryFee, quote, availability, matchBundle, seasonalDiscount } from '../lib/pricing.js';

const business = { service_area: { free_radius_miles: 25, per_mile_fee: 2, max_radius_miles: 150, round_trip: true,
    flat_zones: [{ name: 'SLC', cities: ['Salt Lake City'], fee: 250, min_order: 600 }] },
  pricing: { retainer_pct: 25, tax_rate_pct: 6, bundle: { min_items: 2, discount_pct: 10 }, weekend_days: [5, 6, 0], weekend_max_days: 3,
    bundles: [{ id: 'pair', name: 'Pair', items: ['phone', 'wall'], price: 600, weekend_price: 650 }],
    seasonal: [{ id: 'off', name: 'Off-season', months: [11, 12, 1, 2, 3, 4], discount_pct: 15 }] } };
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
  assert.equal(q.bundle.id, 'pair');
  assert.equal(q.bundleDiscount, 100);  // named bundle (700 -> 600) beats 10%
  assert.equal(q.seasonal, null);       // June
  assert.equal(q.taxable, 715);         // 700 - 100 + 40 addons + 75 setup
  assert.equal(q.tax, 42.9);
  assert.equal(q.delivery.fee, 60);
  assert.equal(q.total, 817.9);
  assert.equal(q.deposit, 250);
  assert.equal(q.retainer, 204.48);
  assert.equal(q.dueBeforeEvent, 613.42);
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

test('percentage bundle when no named bundle matches, and seasonal discount', () => {
  const arch = { id: 'arch', name: 'Arch', quantity: 1, pricing: { base_rate: 325, additional_day_rate: 125, weekend_rate: 375, deposit: 100, setup_fee: 0 }, requires: { delivery: true } };
  const q = quote({ items: [{ item: wall }, { item: arch }], start: '2026-01-10', end: '2026-01-10', miles: 10 }, business);
  assert.equal(q.bundle.id, 'multi-item');
  assert.equal(q.bundleDiscount, 72.5);          // 10% of 725
  assert.equal(q.seasonal.id, 'off');
  assert.equal(q.seasonalDiscount, 97.88);       // 15% of 652.5
});

test('flat delivery zone and minimum order', () => {
  const d = deliveryFee(300, business.service_area, 'salt lake city');
  assert.equal(d.fee, 250); assert.equal(d.minOrder, 600);
  const small = quote({ items: [{ item: wall }], start: '2026-06-13', end: '2026-06-13', city: 'Salt Lake City' }, business);
  assert.equal(small.manualReview, true);
  assert.match(small.manualReviewReason, /minimum/);
  const big = quote({ items: [{ item: phone }, { item: wall }], start: '2026-06-13', end: '2026-06-13', city: 'Salt Lake City' }, business);
  assert.equal(big.manualReview, false); assert.equal(big.delivery.fee, 250);
});

test('weekend span honors max days', () => {
  const wk4 = { ...business, pricing: { ...business.pricing, weekend_days: [5, 6, 0, 1], weekend_max_days: 4 } };
  assert.equal(isWeekendSpan('2026-06-12', '2026-06-15', wk4.pricing.weekend_days, 4), true);
  assert.equal(matchBundle([{ id: 'phone', rental: 350, rateApplied: 'weekend' }, { id: 'wall', rental: 400, rateApplied: 'daily' }], wk4).price, 650);
  assert.equal(matchBundle([{ id: 'phone', rental: 300, rateApplied: 'daily' }, { id: 'wall', rental: 400, rateApplied: 'daily' }], wk4).price, 600);
  assert.equal(seasonalDiscount('2026-11-01', business, 100).amount, 15);
  assert.equal(seasonalDiscount('2026-07-01', business, 100), null);
});
