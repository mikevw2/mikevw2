/** Inventory item + business file validation. Shapes in data/inventory/_template.yaml and data/business.yaml */
const REQUIRED_ITEM = ['id', 'name', 'category', 'status', 'quantity', 'headline', 'pricing', 'requires'];
const CATEGORIES = ['decor', 'guestbook', 'lighting', 'furniture', 'other'];

const isTodo = (v) => typeof v === 'string' && /^TODO/i.test(v.trim());

export function validateItem(item) {
  const errors = [], warnings = [];
  if (!item || typeof item !== 'object') return { ok: false, errors: ['not an object'], warnings };
  for (const k of REQUIRED_ITEM) if (item[k] == null) errors.push(`missing: ${k}`);
  if (item.id && !/^[a-z0-9-]+$/.test(item.id)) errors.push('id must be kebab-case');
  if (item.category && !CATEGORIES.includes(item.category)) errors.push(`category must be one of ${CATEGORIES.join(', ')}`);
  if (item.status && !['active', 'hidden', 'retired'].includes(item.status)) errors.push('status must be active|hidden|retired');
  if (item.quantity != null && (!Number.isInteger(item.quantity) || item.quantity < 1)) errors.push('quantity must be a positive integer');
  const p = item.pricing ?? {};
  for (const k of ['base_rate', 'additional_day_rate', 'deposit', 'setup_fee']) {
    if (typeof p[k] !== 'number' || p[k] < 0) errors.push(`pricing.${k} must be a number >= 0`);
  }
  if (p.weekend_rate != null && (typeof p.weekend_rate !== 'number' || p.weekend_rate <= 0)) errors.push('pricing.weekend_rate must be null or a positive number');
  if (item.status === 'active') {
    if (!p.base_rate) warnings.push('base_rate is 0: item cannot be quoted or shown with a price');
    if (!item.photos?.length) warnings.push('no photos: site card will use a placeholder');
    if (isTodo(item.description)) warnings.push('description is TODO');
  }
  for (const a of item.addons ?? []) {
    if (!a.id || !a.name || typeof a.price !== 'number') errors.push(`addon ${a.id ?? '?'} needs id, name, numeric price`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function validateBusiness(b) {
  const errors = [], warnings = [];
  if (!b?.service_area || !b?.pricing || !b?.booking) errors.push('business.yaml needs service_area, pricing, booking');
  for (const k of ['name', 'domain']) if (!b?.[k] || isTodo(b[k])) warnings.push(`${k} is TODO`);
  for (const k of ['email', 'phone']) if (!b?.contact?.[k] || isTodo(b.contact[k])) warnings.push(`contact.${k} is TODO`);
  const sa = b?.service_area ?? {};
  for (const k of ['free_radius_miles', 'per_mile_fee', 'max_radius_miles']) if (typeof sa[k] !== 'number') errors.push(`service_area.${k} must be a number`);
  if (typeof b?.pricing?.tax_rate_pct !== 'number') errors.push('pricing.tax_rate_pct must be a number');
  return { ok: errors.length === 0, errors, warnings };
}
