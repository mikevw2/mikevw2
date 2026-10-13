# 0005 — Quant stack: own engine, Coinbase data, TradeLocker demo

Date: 2026-10-13

## Context
Mike trades crypto and futures/FX CFDs through TradeLocker (demo so far), wants systematic rules,
free tooling only. vectorbt's open-source release no longer imports against current plotly;
Binance is geo-blocked from the container; ccxt ignores the proxy CA bundle.

## Decision
- Data: Coinbase Exchange public candles (1h/1d native, resampled to 2h/4h/12h), cached as CSV in
  `data/cache/` (gitignored). Years of history, no key, ~1 s per 3,000 bars.
- Engine: our own trade-level loop (`quant/engine.py`): next-bar execution, intrabar stops with
  gap handling, fees and slippage per side, fixed-fractional sizing to the stop, leverage cap,
  optional ATR trailing, and no re-entry after a stop until the signal leaves that direction.
- Validation: anchored rolling walk-forward (`quant/walkforward.py`); the report leads with
  out-of-sample numbers and shows the in-sample "best grid point" only as an overfit ceiling.
- Broker: TradeLocker Python client, env-var credentials, demo URL enforced while
  `live_enabled` is false. Live needs an ADR and the trade-guard confirmation path.
- Paper-trading gate (in `data/risk.yaml: paper_requirements`): >= 8 OOS windows, >= 100 OOS
  trades, OOS expectancy >= 0.1 R, OOS max drawdown <= 25%.

## First results (2020-01 → 2026-10, 4h, 25 bps round-trip-ish costs)
| Spec | OOS trades | OOS exp. R | PF | Max DD | Verdict |
|---|---|---|---|---|---|
| ema-trend-eth-4h | 265 | 0.26 | 1.50 | -21% | candidate; meets the gate on paper |
| ema-trend-btc-4h | 254 | 0.14 | 1.22 | -35% | fails drawdown limit |
| donchian-btc-4h | 194 | 0.14 | 1.21 | -24% | marginal; IS/OOS gap is large |
| bb-meanrev-eth-4h | 22 | -0.09 | 0.79 | -6% | too few trades, negative; shelve |

## Consequences
- Nothing paper-trades until a rule passes the gate on at least two markets or its single-market
  edge is explained. ETH trend is the first candidate to scrutinize, not to trade.
- Next: regime filters and volatility-scaled sizing as explicit, reasoned parameters; a
  `journal-review` that reads paper fills from TradeLocker.
