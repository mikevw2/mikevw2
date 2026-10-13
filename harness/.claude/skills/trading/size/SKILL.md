---
name: size
description: Compute position size, risk dollars, and R multiples deterministically via scripts/size.js. Use whenever position size, share count, contracts, "how much", risk per trade, or R:R comes up. Never do this math in prose.
---

# size

Run `npm run size -- --entry <E> --stop <S> [--targets T1,T2] [--risk pct] [--equity n] [--mult m] [--lot n] [--cap pct]`.

Defaults (equity, risk %, position cap) come from `data/risk.yaml`. Output is JSON:
`units`, `riskDollars`, `actualRisk`, `positionValue`, `positionPct`, `capped`, `rMultiples`, `rewardRisk`,
plus a `warning` when a risk.yaml limit is breached.

Report the numbers verbatim in a short table. If `warning` is present, lead with it.
For options use `--mult 100`. For futures use the contract multiplier.
For a stop derived from ATR, say so and show the ATR and multiple you used.
