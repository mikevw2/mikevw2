/**
 * Deterministic quoting and availability for event rentals. Pure functions.
 * Money in dollars; percentages as percents (6 = 6%).
 */
const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;
const DAY = 86400000;

export function parseDate(s) {
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`bad date: ${s}`);
  return d;
}

/** Inclusive day count between two YYYY-MM-DD dates. */
export function rentalDays(start, end) {
  const a = parseDate(start), b = parseDate(end);
  if (b < a) throw new Error('end before start');
  return Math.round((b - a) / DAY) + 1;
}

/** True when every rental day falls on a configured weekend day and the span is <= 3 days. */
export function isWeekendSpan(start, end, weekendDays = [5, 6, 0]) {
  const days = rentalDays(start, end);
  if (days > 3) return false;
  const a = parseDate(start);
  for (let i = 0; i < days; i++) {
    if (!weekendDays.includes(new Date(a.getTime() + i * DAY).getUTCDay())) return false;
  }
  return true;
}

export function priceItem(item, { start, end, addons = [], weekendDays }) {
  const days = rentalDays(start, end);
  const p = item.pricing;
  const computed = p.base_rate + p.additional_day_rate * (days - 1);
  const weekend = p.weekend_rate != null && isWeekendSpan(start, end, weekendDays) && p.weekend_rate < computed;
  const rental = weekend ? p.weekend_rate : computed;
  const addonLines = addons.map(id => {
    const a = (item.addons ?? []).find(x => x.id === id);
    if (!a) throw new Error(`unknown addon ${id} for ${item.id}`);
    return { id: a.id, name: a.name, price: a.price };
  });
  const addonsTotal = addonLines.reduce((s, a) => s + a.price, 0);
  return {
    id: item.id, name: item.name, days,
    rateApplied: weekend ? 'weekend' : 'daily',
    rental: round(rental), setupFee: p.setup_fee ?? 0, deposit: p.deposit ?? 0,
    addons: addonLines, addonsTotal: round(addonsTotal),
    lineTotal: round(rental + (p.setup_fee ?? 0) + addonsTotal),
  };
}

export function deliveryFee(miles, sa) {
  if (miles == null) return { fee: 0, note: 'pickup / no delivery' };
  if (miles > sa.max_radius_miles) return { fee: null, note: `beyond ${sa.max_radius_miles} mi: quote manually` };
  const billable = Math.max(0, miles - sa.free_radius_miles) * (sa.round_trip ? 2 : 1);
  return { fee: round(billable * sa.per_mile_fee), note: billable ? `${billable} billable mi` : `within ${sa.free_radius_miles} mi` };
}

/**
 * Build a full quote.
 * @param {object} q  { items: [{item, addons?}], start, end, miles? }
 * @param {object} business  data/business.yaml
 */
export function quote(q, business) {
  if (!q.items?.length) throw new Error('no items');
  const weekendDays = business.pricing.weekend_days;
  const lines = q.items.map(({ item, addons }) => priceItem(item, { start: q.start, end: q.end, addons, weekendDays }));
  const rentalSubtotal = round(lines.reduce((s, l) => s + l.rental, 0));
  const setupTotal = round(lines.reduce((s, l) => s + l.setupFee, 0));
  const addonsTotal = round(lines.reduce((s, l) => s + l.addonsTotal, 0));
  const bundle = business.pricing.bundle ?? {};
  const bundleDiscount = lines.length >= (bundle.min_items ?? Infinity) ? round(rentalSubtotal * (bundle.discount_pct ?? 0) / 100) : 0;
  const needsDelivery = q.items.some(({ item }) => item.requires?.delivery);
  const delivery = needsDelivery || q.miles != null ? deliveryFee(q.miles ?? 0, business.service_area) : { fee: 0, note: 'not required' };
  const taxable = round(rentalSubtotal - bundleDiscount + addonsTotal + setupTotal);
  const tax = round(taxable * (business.pricing.tax_rate_pct ?? 0) / 100);
  const total = delivery.fee == null ? null : round(taxable + tax + delivery.fee);
  const deposit = round(lines.reduce((s, l) => s + l.deposit, 0));
  const retainer = total == null ? null : round(total * (business.pricing.retainer_pct ?? 0) / 100);
  return {
    start: q.start, end: q.end, days: lines[0].days, lines,
    rentalSubtotal, bundleDiscount, addonsTotal, setupTotal, delivery, taxable, tax, total,
    deposit, retainer,
    dueToReserve: retainer,                                   // non-refundable, credited to balance
    dueBeforeEvent: total == null ? null : round(total - retainer),
    balanceDueDaysBefore: business.pricing.balance_due_days_before ?? 14,
    manualReview: total == null,
  };
}

/**
 * Availability: given bookings [{item_id, start, end, status, quantity?}] return remaining units
 * for the item over the span, honoring turnaround buffer days on either side.
 */
export function availability(item, bookings, { start, end, turnaroundDays = 0, blockingStatuses = ['confirmed', 'hold'] }) {
  const a = parseDate(start).getTime() - turnaroundDays * DAY;
  const b = parseDate(end).getTime() + turnaroundDays * DAY;
  const overlapping = bookings.filter(bk => bk.item_id === item.id && blockingStatuses.includes(bk.status)
    && parseDate(bk.start).getTime() <= b && parseDate(bk.end).getTime() >= a);
  const used = overlapping.reduce((s, bk) => s + (bk.quantity ?? 1), 0);
  const remaining = Math.max(0, (item.quantity ?? 1) - used);
  return { itemId: item.id, remaining, available: remaining > 0, conflicts: overlapping.map(bk => bk.id ?? `${bk.start}..${bk.end}`) };
}
