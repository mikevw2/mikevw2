---
ticker: TICKER
direction: long            # long | short
instrument: equity         # equity | option | future | crypto | forex
status: draft              # draft | approved | open | closed | passed
setup: ""                  # e.g. breakout, pullback-to-20ema, post-earnings-drift
catalyst: ""               # why now
entry: 0
stop: 0
targets: [0]
invalidation: ""           # one sentence: what proves the thesis wrong
horizon: swing             # intraday | swing | position
risk_pct: 0.5              # <= max_risk_per_trade_pct in data/risk.yaml
paper: true
# account_equity: 25000    # optional override of risk.yaml
# multiplier: 100          # options/futures
# size: 0                  # required when status is approved/open; from `npm run size`
# opened: 2026-01-01
# closed: 2026-01-01
# exit: 0
# result_r: 0
# tags: []
---

## Thesis
Two to five sentences. What is the edge, why does it exist, who is on the other side.

## Invalidation
What price, time, or event makes this wrong. This is the stop's reason, not just its level.

## Plan
Entry trigger, scaling, target management, time stop.

## Review (after close)
What happened vs plan. Rule violations. One lesson.
