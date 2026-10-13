/** Property fact-sheet validation. Shape documented in data/properties/_template.yaml */
export const REQUIRED_TOP = ['id', 'name', 'type', 'address', 'income', 'expenses'];

export function validateProperty(prop) {
  const errors = [], warnings = [];
  if (!prop || typeof prop !== 'object') return { ok: false, errors: ['not an object'], warnings };
  for (const k of REQUIRED_TOP) if (prop[k] == null) errors.push(`missing: ${k}`);
  if (prop.type && !['ltr', 'str'].includes(prop.type)) errors.push('type must be ltr or str');
  if (prop.id && !/^[a-z0-9-]+$/.test(prop.id)) errors.push('id must be kebab-case (a-z, 0-9, -)');
  if (prop.type === 'ltr' && prop.income && typeof prop.income.rent_monthly !== 'number') errors.push('ltr income.rent_monthly must be a number');
  if (prop.type === 'str' && prop.income) {
    for (const k of ['adr', 'occupancy_pct']) if (typeof prop.income[k] !== 'number') errors.push(`str income.${k} must be a number`);
  }
  if (!prop.listing?.headline) warnings.push('listing.headline missing (listing-copy will ask)');
  if (!prop.features?.length) warnings.push('features list empty');
  if (prop.loan && prop.loan.principal && !prop.loan.rate_pct) errors.push('loan.rate_pct required when loan.principal is set');
  return { ok: errors.length === 0, errors, warnings };
}
