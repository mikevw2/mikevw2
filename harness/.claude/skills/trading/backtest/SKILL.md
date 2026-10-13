---
name: backtest
description: Run and read systematic strategy backtests with walk-forward validation via `python -m quant.cli backtest`. Use for "backtest", "does this rule work", "optimize", "walk-forward", strategy comparisons, or before any systematic rule is paper-traded.
---

# backtest

Specs live in `data/strategies/*.yaml` (copy `_template.yaml`). Strategies are registered in
`quant/strategies.py`; the engine is `quant/engine.py`; stats in `quant/stats.py`.

## Run
```
source .venv/bin/activate
python -m quant.cli backtest data/strategies/<id>.yaml        # one spec (refreshes data)
python -m quant.cli backtest data/strategies --no-refresh      # all specs, cached data
```
Reports land in `reports/<id>/latest.md` (+ timestamped folder with JSON and OOS trades CSV).

## Read the report in this order, and report it in this order
1. **Out-of-sample** walk-forward stats: expectancy (R), trades, profit factor, max drawdown,
   Sharpe. Count windows with positive OOS expectancy.
2. In-sample with default params: only to see the gap. A big IS-over-OOS gap means the grid is
   fitting noise.
3. "Best grid point on full history": never quote this as performance. It is the overfit ceiling.

## Rules
- Costs stay on (20 bps fee + 5 bps slippage per side by default). A result that only works at
  zero cost does not exist.
- Fewer than ~100 OOS trades: say the evidence is thin, whatever the numbers.
- Never widen the grid to chase a result. Add a parameter only with a reason you can write down.
- Adding a strategy: implement in `quant/strategies.py` with no lookahead (the truncation test in
  `quant/tests/test_engine.py` must pass), add a spec, run, commit the `latest.md`.
- Paper trading a rule requires: positive OOS expectancy over >= 8 windows, max drawdown within
  `data/risk.yaml` limits, and an ADR naming the rule and its parameters.
