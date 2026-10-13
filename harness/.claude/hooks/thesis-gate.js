#!/usr/bin/env node
// Thesis gate. Runs as PreToolUse (Write) and PostToolUse (Edit|MultiEdit|Write).
// Only acts on files under data/journal/*.md (ignores _template.md and README.md).
// Pre: validates the content about to be written; blocks (exit 2) if invalid.
// Post: validates the file on disk; exit 2 so Claude sees the errors and fixes them.
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import YAML from 'yaml';
import { validateThesis } from '../../lib/thesis.js';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* none */ }
const file = input.tool_input?.file_path ? resolve(root, input.tool_input.file_path) : null;
if (!file || !/[\\/]data[\\/]journal[\\/][^\\/]+\.md$/.test(file)) process.exit(0);
const name = basename(file);
if (name.startsWith('_') || name.toLowerCase() === 'readme.md') process.exit(0);

const risk = YAML.parse(readFileSync(join(root, 'data', 'risk.yaml'), 'utf8'));
const pre = input.hook_event_name === 'PreToolUse';
let text;
if (pre) text = input.tool_input.content ?? '';
else if (existsSync(file)) text = readFileSync(file, 'utf8');
else process.exit(0);

const r = validateThesis(text, risk);
if (r.ok) {
  if (r.warnings.length) console.log(`thesis-gate: ${name} ok with warnings: ${r.warnings.join('; ')}`);
  process.exit(0);
}
console.error(`thesis-gate: ${name} ${pre ? 'rejected' : 'is invalid after edit'}:\n - ${r.errors.join('\n - ')}` +
  (r.warnings.length ? `\n warnings:\n - ${r.warnings.join('\n - ')}` : '') +
  `\nFix the thesis to satisfy data/risk.yaml, or set status: passed and explain why in the body.`);
process.exit(2);
