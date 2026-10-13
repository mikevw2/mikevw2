# 0002 — Paper trading by default, live gated by two factors

Date: 2026-10-13

## Context
The model is good at narrative and bad at discipline under ambiguity. The costliest failure mode is
an order placed on a half-formed idea, or sizing done in prose.

## Decision
`data/risk.yaml: live_enabled: false`. The trade-guard hook blocks any broker-shaped MCP write
unless `PAPER=1` / `paper: true`. Going live requires both `live_enabled: true` (a committed
change) and a fresh touch of `.claude/CONFIRM_LIVE` by the user within a short window. All
sizing goes through `scripts/size.js`; theses are validated by `thesis-gate` on every write.

## Consequences
- Claude cannot place a live order on its own, by design. Blocked calls are reported, not retried.
- Flipping `live_enabled` is a visible commit with an ADR explaining why.
