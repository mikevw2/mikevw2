# 0001 — One harness repo for both tracks

Date: 2026-10-13

## Context
Two lines of work (web/rental and trading) share the same harness primitives: CLAUDE.md rules,
skills, hooks, deterministic libs, routines, and eventually plugins to sell. Splitting them early
would duplicate tooling and make cross-cutting pieces (visual-qa, eval setup, plugin packaging) drift.

## Decision
One repo, `harness/`, with tracks separated by folder under `.claude/skills/`, `lib/`, and `data/`.
Deterministic code is plain Node (ESM, no framework) so hooks start fast and run anywhere Node 20+
exists. Python is reserved for the MCP servers and backtesting in phase 2.

## Consequences
- Hooks assume the harness folder is the Claude Code project root (`$CLAUDE_PROJECT_DIR`).
- When a track outgrows the shared repo, lift its skill/lib/data folders into a plugin under
  `plugins/` first; split the repo only if the plugin needs its own release cadence.
- Today the folder lives inside `mikevw2/mikevw2` because repo creation from the cloud session
  was denied; move it to `mikevw2/harness` when that repo exists. Nothing inside depends on the
  parent repo.
