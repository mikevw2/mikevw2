#!/usr/bin/env node
// PreToolUse hook (matcher: mcp__.*). Blocks broker write calls unless paper mode or live confirm.
// Exit 2 = block (stderr goes back to Claude). Exit 0 = allow.
// Logs every broker-shaped call to data/journal/.broker-log.jsonl.
import { readFileSync, appendFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* no stdin */ }
const tool = input.tool_name || '';
const args = input.tool_input || {};

let risk = {};
try { risk = YAML.parse(readFileSync(join(root, 'data', 'risk.yaml'), 'utf8')) || {}; } catch { /* defaults */ }

const WRITE_RE = /(place|submit|create|send|cancel|modify|replace|close|liquidate)[_-]?(order|position|trade)s?|order[_-]?(place|submit|create)|execute[_-]?trade/i;
const brokerPrefixes = risk.broker_tool_prefixes || ['mcp__ibkr', 'mcp__interactive', 'mcp__alpaca', 'mcp__tradier', 'mcp__coinbase', 'mcp__binance', 'mcp__kraken', 'mcp__hyperliquid'];
const looksBroker = brokerPrefixes.some(p => tool.toLowerCase().startsWith(p.toLowerCase()));
const isWrite = WRITE_RE.test(tool);

if (!looksBroker && !isWrite) process.exit(0);

const paper = process.env.PAPER === '1' || args.paper === true || args.account_type === 'paper';
let confirmed = false;
const confirmFile = join(root, '.claude', 'CONFIRM_LIVE');
if (existsSync(confirmFile)) {
  const ageMin = (Date.now() - statSync(confirmFile).mtimeMs) / 60000;
  confirmed = ageMin <= (risk.live_confirm_window_min ?? 10);
}

const decision = !isWrite ? 'allow:read' : paper ? 'allow:paper' : (risk.live_enabled && confirmed) ? 'allow:live-confirmed' : 'block';
try {
  mkdirSync(join(root, 'data', 'journal'), { recursive: true });
  appendFileSync(join(root, 'data', 'journal', '.broker-log.jsonl'), JSON.stringify({ t: new Date().toISOString(), tool, decision, args }) + '\n');
} catch { /* logging must never break the gate */ }

if (decision === 'block') {
  console.error([
    `trade-guard: blocked ${tool}.`,
    `live_enabled=${!!risk.live_enabled}, PAPER=${process.env.PAPER ?? 'unset'}, confirm=${confirmed}.`,
    'Broker write calls run only in paper mode (PAPER=1 or paper:true) or, when live_enabled is true in data/risk.yaml,',
    `within ${risk.live_confirm_window_min ?? 10} minutes of the user touching .claude/CONFIRM_LIVE themselves.`,
    'Do not work around this. Tell the user what was blocked and stop.',
  ].join(' '));
  process.exit(2);
}
process.exit(0);
