/**
 * Deterministic position sizing. Pure functions, no I/O.
 * All percentages are expressed as percent (1 = 1%), not fractions.
 */

const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

/**
 * Fixed-fractional sizing: risk a fixed % of equity per trade, sized by stop distance.
 * @param {object} p
 * @param {number} p.equity          account equity in currency
 * @param {number} p.riskPct         percent of equity to risk (e.g. 1 = 1%)
 * @param {number} p.entry           entry price
 * @param {number} p.stop            stop price
 * @param {number[]} [p.targets]     target prices for R-multiple calc
 * @param {number} [p.maxPositionPct] cap on position value as % of equity
 * @param {number} [p.multiplier=1]  contract multiplier (options 100, futures per spec)
 * @param {number} [p.lotSize=1]     round units down to this lot
 */
export function sizeFixedFractional(p) {
  const { equity, riskPct, entry, stop, targets = [], maxPositionPct, multiplier = 1, lotSize = 1 } = p;
  for (const [k, v] of Object.entries({ equity, riskPct, entry, stop })) {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${k} must be a finite number`);
  }
  if (equity <= 0) throw new Error('equity must be > 0');
  if (riskPct <= 0) throw new Error('riskPct must be > 0');
  if (entry <= 0 || stop <= 0) throw new Error('entry and stop must be > 0');
  if (entry === stop) throw new Error('entry and stop cannot be equal');

  const direction = stop < entry ? 'long' : 'short';
  const perUnitRisk = Math.abs(entry - stop) * multiplier;
  const riskDollars = equity * (riskPct / 100);
  let units = Math.floor(riskDollars / perUnitRisk / lotSize) * lotSize;

  let capped = false;
  if (maxPositionPct != null) {
    const maxValue = equity * (maxPositionPct / 100);
    const maxUnits = Math.floor(maxValue / (entry * multiplier) / lotSize) * lotSize;
    if (units > maxUnits) { units = maxUnits; capped = true; }
  }

  const positionValue = units * entry * multiplier;
  const actualRisk = units * perUnitRisk;
  const rMultiples = targets.map(t => {
    const move = direction === 'long' ? t - entry : entry - t;
    return { target: t, r: round(move * multiplier / perUnitRisk, 2) };
  });

  return {
    direction,
    units,
    perUnitRisk: round(perUnitRisk, 4),
    riskDollars: round(riskDollars),
    actualRisk: round(actualRisk),
    actualRiskPct: round((actualRisk / equity) * 100, 3),
    positionValue: round(positionValue),
    positionPct: round((positionValue / equity) * 100, 2),
    capped,
    rMultiples,
    rewardRisk: rMultiples.length ? rMultiples[0].r : null,
  };
}

/** Stop placed N ATRs from entry. */
export function atrStop({ entry, atr, mult = 2, direction = 'long' }) {
  if (![entry, atr, mult].every(Number.isFinite)) throw new Error('entry, atr, mult must be numbers');
  return round(direction === 'long' ? entry - atr * mult : entry + atr * mult, 4);
}

/**
 * Kelly fraction from win rate and average win/loss (as positive magnitudes).
 * Returns the full Kelly as a percent of equity; callers usually take a fraction (e.g. 0.25x).
 */
export function kellyFraction({ winRate, avgWin, avgLoss }) {
  if (winRate <= 0 || winRate >= 1) throw new Error('winRate must be between 0 and 1 exclusive');
  if (avgWin <= 0 || avgLoss <= 0) throw new Error('avgWin and avgLoss must be > 0');
  const b = avgWin / avgLoss;
  const k = winRate - (1 - winRate) / b;
  return round(Math.max(0, k) * 100, 2);
}

/** Expectancy per trade in R, given win rate and average win/loss in R. */
export function expectancyR({ winRate, avgWinR, avgLossR }) {
  return round(winRate * avgWinR - (1 - winRate) * Math.abs(avgLossR), 3);
}
