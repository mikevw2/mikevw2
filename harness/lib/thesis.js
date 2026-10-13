/**
 * Trade thesis parsing + validation against data/risk.yaml.
 * A thesis is a markdown file with YAML frontmatter (see data/journal/_template.md).
 */
import YAML from 'yaml';
import { sizeFixedFractional } from './position-size.js';

export const REQUIRED = ['ticker', 'direction', 'instrument', 'status', 'setup', 'catalyst', 'entry', 'stop', 'targets', 'invalidation', 'horizon', 'risk_pct', 'paper'];
export const STATUSES = ['draft', 'approved', 'open', 'closed', 'passed'];

export function parseThesis(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { front: null, body: text, error: 'missing YAML frontmatter' };
  try {
    return { front: YAML.parse(m[1]) ?? {}, body: m[2] };
  } catch (e) {
    return { front: null, body: m[2], error: `frontmatter YAML: ${e.message}` };
  }
}

/**
 * @returns {{ok:boolean, errors:string[], warnings:string[], size?:object}}
 */
export function validateThesis(text, risk) {
  const errors = [], warnings = [];
  const { front, body, error } = parseThesis(text);
  if (error) return { ok: false, errors: [error], warnings };

  for (const k of REQUIRED) if (front[k] === undefined || front[k] === null || front[k] === '') errors.push(`missing field: ${k}`);
  if (errors.length) return { ok: false, errors, warnings };

  if (!STATUSES.includes(front.status)) errors.push(`status must be one of ${STATUSES.join(', ')}`);
  if (!['long', 'short'].includes(front.direction)) errors.push('direction must be long or short');
  if (!Array.isArray(front.targets) || !front.targets.length) errors.push('targets must be a non-empty list');
  if (typeof front.entry !== 'number' || typeof front.stop !== 'number') errors.push('entry and stop must be numbers');

  if (typeof front.entry === 'number' && typeof front.stop === 'number') {
    if (front.direction === 'long' && front.stop >= front.entry) errors.push('long: stop must be below entry');
    if (front.direction === 'short' && front.stop <= front.entry) errors.push('short: stop must be above entry');
  }

  // Risk rules
  if (front.risk_pct > risk.max_risk_per_trade_pct) errors.push(`risk_pct ${front.risk_pct} exceeds max_risk_per_trade_pct ${risk.max_risk_per_trade_pct}`);
  if (front.paper !== true && !risk.live_enabled) errors.push('paper must be true while risk.yaml live_enabled is false');
  if (!/##\s*Invalidation/i.test(body)) warnings.push('body has no "## Invalidation" section');
  if (!/##\s*Thesis/i.test(body)) warnings.push('body has no "## Thesis" section');

  let size;
  if (!errors.length) {
    try {
      size = sizeFixedFractional({
        equity: front.account_equity ?? risk.account_equity,
        riskPct: front.risk_pct,
        entry: front.entry, stop: front.stop, targets: front.targets,
        maxPositionPct: risk.max_position_pct,
        multiplier: front.multiplier ?? 1,
      });
      if (size.rewardRisk != null && size.rewardRisk < risk.min_reward_risk) {
        errors.push(`reward:risk to first target is ${size.rewardRisk}, below min_reward_risk ${risk.min_reward_risk}`);
      }
      if (size.units === 0) errors.push('computed size is 0 units: stop too wide for the risk budget');
      if (['approved', 'open'].includes(front.status)) {
        if (front.size == null) errors.push('status approved/open requires a `size` field (units) from scripts/size.js');
        else if (Number(front.size) > size.units) errors.push(`size ${front.size} exceeds computed max ${size.units}`);
      }
    } catch (e) {
      errors.push(`sizing: ${e.message}`);
    }
  }
  return { ok: errors.length === 0, errors, warnings, size, front };
}
