# harness

A Claude Code harness for two lines of work:

1. **Web design + event rental business** (website, catalog, quotes, bookings, customer comms)
2. **Trading** (thesis, deterministic sizing, risk gates, journal, review)

The model supplies judgment and language. This repo supplies memory, enforcement,
deterministic math, schedules, and verification.

See `HARNESS_PLAN.md` for the full roadmap and `CLAUDE.md` for the rules Claude follows here.

## Layout

```
CLAUDE.md               rules Claude loads every session
HARNESS_PLAN.md         roadmap, inventory, phases
.claude/
  settings.json         hooks + permissions (the enforcement layer)
  hooks/                gate scripts: trade-guard, thesis-gate, session-start
  skills/               playbooks, one folder per skill (web/, rental/, trading/)
  agents/               subagent definitions (design-critic, risk-reviewer)
lib/                    deterministic modules (pure functions, unit tested)
scripts/                CLIs over lib/ (what hooks, routines, and you call)
data/
  risk.yaml             trading rules the hooks enforce
  business.yaml         business facts, service area, tax, bundle rules, policies
  inventory/            one YAML per rentable item (source of truth for site + quotes)
  journal/              one markdown file per trade thesis
docs/decisions/         ADRs: why things are the way they are
mcp/                    custom MCP servers (rental-data, market-data) — phase 2
plugins/                packaged, versioned plugins — phase 3
evals/                  skill eval suites — phase 3
qa/                     visual-qa output (screenshots, reports); gitignored
```

## Quick start

```bash
cd harness
npm install
npm test                       # unit tests for lib/
npm run size -- --entry 100 --stop 95 --targets 110,120
npm run quote -- --items guestbook-phone,flower-wall-white --start 2026-06-12 --end 2026-06-14 --miles 40
npm run validate -- data/business.yaml data/inventory data/journal
npm run qa -- https://example.com
```

Open this folder as the project root in Claude Code so `.claude/settings.json` hooks apply.

## Conventions

- Anything numeric that matters (position size, risk, quotes, delivery fees, tax) is computed in `lib/` and
  covered by a test. Claude narrates results; it never does the arithmetic in prose.
- Every rule a hook enforces is also written in plain English in `CLAUDE.md`.
- New skill: `.claude/skills/<track>/<name>/SKILL.md` with frontmatter `name` and `description`.
- New decision: `docs/decisions/NNNN-title.md`.
- Paper trading is the default. `data/risk.yaml` has `live_enabled: false` until decided otherwise.

## Status

Phase 0 (foundation). See the checklist at the bottom of `HARNESS_PLAN.md` section 6.
