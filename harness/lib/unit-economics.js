/**
 * Deterministic rental unit economics. Pure functions over a property fact sheet.
 * Property shape: see data/properties/_template.yaml
 */

const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;
const pct = (v) => (v ?? 0) / 100;

/** Standard amortized monthly payment. rate is annual percent. */
export function monthlyPayment({ principal, rate, termYears }) {
  if (!principal) return 0;
  const r = pct(rate) / 12;
  const n = termYears * 12;
  if (r === 0) return round(principal / n);
  return round((principal * r) / (1 - (1 + r) ** -n));
}

/** Gross scheduled annual income from the property's income model. */
export function grossAnnualIncome(prop) {
  if (prop.type === 'str') {
    const { adr, occupancy_pct, nights_available = 365 } = prop.income;
    return round(adr * nights_available * pct(occupancy_pct));
  }
  const { rent_monthly, other_monthly = 0 } = prop.income;
  return round((rent_monthly + other_monthly) * 12);
}

export function analyze(prop) {
  if (!prop || !prop.type || !prop.income || !prop.expenses) throw new Error('property needs type, income, expenses');
  const gross = grossAnnualIncome(prop);

  // Income reductions
  const vacancyLoss = prop.type === 'ltr' ? gross * pct(prop.income.vacancy_pct ?? 5) : 0;
  const platformFees = prop.type === 'str' ? gross * pct(prop.income.platform_fee_pct ?? 0) : 0;
  const effectiveGross = round(gross - vacancyLoss - platformFees);

  // Operating expenses
  const e = prop.expenses;
  const fixedAnnual = 12 * ((e.tax_monthly ?? 0) + (e.insurance_monthly ?? 0) + (e.hoa_monthly ?? 0)
    + (e.utilities_monthly ?? 0) + (e.other_monthly ?? 0));
  const cleaningAnnual = prop.type === 'str'
    ? (e.cleaning_cost_per_turn ?? 0) * (prop.income.turns_per_year ?? 0)
    : 0;
  const variableAnnual = effectiveGross * (pct(e.maintenance_pct) + pct(e.management_pct) + pct(e.capex_reserve_pct));
  const opex = round(fixedAnnual + cleaningAnnual + variableAnnual);

  const noi = round(effectiveGross - opex);

  // Debt
  const loan = prop.loan ?? {};
  const debtMonthly = monthlyPayment({ principal: loan.principal ?? 0, rate: loan.rate_pct ?? 0, termYears: loan.term_years ?? 30 });
  const debtService = round(debtMonthly * 12);
  const cashFlow = round(noi - debtService);

  // Returns
  const price = prop.purchase?.price ?? 0;
  const cashIn = (prop.purchase?.down_payment ?? 0) + (prop.purchase?.closing_costs ?? 0) + (prop.purchase?.rehab ?? 0);
  const capRate = price ? round((noi / price) * 100) : null;
  const cashOnCash = cashIn ? round((cashFlow / cashIn) * 100) : null;
  const dscr = debtService ? round(noi / debtService) : null;

  // Break-even occupancy / rent
  const annualFixedOut = opex - variableAnnual + debtService; // what must be covered before variable costs
  const variableRate = pct(e.maintenance_pct) + pct(e.management_pct) + pct(e.capex_reserve_pct)
    + (prop.type === 'str' ? pct(prop.income.platform_fee_pct ?? 0) : pct(prop.income.vacancy_pct ?? 5));
  const breakEvenGross = round(annualFixedOut / (1 - variableRate));
  const breakEvenOccupancyPct = prop.type === 'str'
    ? round((breakEvenGross / (prop.income.adr * (prop.income.nights_available ?? 365))) * 100)
    : null;
  const breakEvenRentMonthly = prop.type === 'ltr' ? round(breakEvenGross / 12) : null;

  const str = prop.type === 'str' ? {
    revpar: round(prop.income.adr * pct(prop.income.occupancy_pct)),
    nightsBooked: Math.round((prop.income.nights_available ?? 365) * pct(prop.income.occupancy_pct)),
  } : null;

  return {
    id: prop.id, type: prop.type,
    gross, vacancyLoss: round(vacancyLoss), platformFees: round(platformFees), effectiveGross,
    opex, opexRatioPct: effectiveGross ? round((opex / effectiveGross) * 100) : null,
    noi, debtService, cashFlow, cashFlowMonthly: round(cashFlow / 12),
    capRate, cashOnCash, dscr,
    breakEvenOccupancyPct, breakEvenRentMonthly,
    str,
  };
}

/** Portfolio rollup across analyzed units. */
export function rollup(results) {
  const sum = (k) => round(results.reduce((a, r) => a + (r[k] ?? 0), 0));
  return {
    units: results.length,
    gross: sum('gross'), effectiveGross: sum('effectiveGross'), opex: sum('opex'),
    noi: sum('noi'), debtService: sum('debtService'), cashFlow: sum('cashFlow'),
    cashFlowMonthly: round(sum('cashFlow') / 12),
    dscr: sum('debtService') ? round(sum('noi') / sum('debtService')) : null,
  };
}
