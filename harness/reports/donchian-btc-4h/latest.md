# Backtest: donchian-btc-4h

Strategy `donchian_breakout` on BTC-USD 4h (Coinbase), 2020-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 12 mo / test 3 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 206 | 0.1109 | 0.3301 | 1.18 | 0.16 | -0.237 | 0.0121 | 0.0722 | 0.3919 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2020-01-01 | 2021-01-01 | 2021-04-01 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.623 | 11 | -0.4437 | 5 | -0.0263 | -0.0497 |
| 2020-04-01 | 2021-04-01 | 2021-07-01 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.071 | 10 | -0.1637 | 4 | -0.009 | -0.0309 |
| 2020-07-01 | 2021-07-01 | 2021-10-01 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.472 | 12 | 0.5287 | 5 | 0.0249 | -0.0283 |
| 2020-10-01 | 2021-10-01 | 2022-01-01 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4846 | 21 | -0.1253 | 5 | -0.0088 | -0.0475 |
| 2021-01-01 | 2022-01-01 | 2022-04-01 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1018 | 16 | 0.2378 | 5 | 0.0107 | -0.0197 |
| 2021-04-01 | 2022-04-01 | 2022-07-01 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3978 | 16 | 1.266 | 5 | 0.0628 | -0.04 |
| 2021-07-01 | 2022-07-01 | 2022-10-01 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6509 | 24 | -0.373 | 9 | -0.0414 | -0.0568 |
| 2021-10-01 | 2022-10-01 | 2023-01-01 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2091 | 41 | -0.5628 | 14 | -0.0933 | -0.1072 |
| 2022-01-01 | 2023-01-01 | 2023-04-01 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3075 | 26 | 5.872 | 5 | 0.3487 | -0.0581 |
| 2022-04-01 | 2023-04-01 | 2023-07-01 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.63 | 19 | -0.274 | 6 | -0.0224 | -0.0669 |
| 2022-07-01 | 2023-07-01 | 2023-10-01 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.3 | 19 | -0.1163 | 5 | -0.0101 | -0.0437 |
| 2022-10-01 | 2023-10-01 | 2024-01-01 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.38 | 19 | 1.456 | 4 | 0.0593 | -0.0342 |
| 2023-01-01 | 2024-01-01 | 2024-04-01 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.235 | 36 | 0.1354 | 6 | 0.0058 | -0.0209 |
| 2023-04-01 | 2024-04-01 | 2024-07-01 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5295 | 35 | -0.3269 | 12 | -0.0444 | -0.0534 |
| 2023-07-01 | 2024-07-01 | 2024-10-01 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3252 | 36 | 0.2732 | 12 | 0.0223 | -0.0561 |
| 2023-10-01 | 2024-10-01 | 2025-01-01 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.467 | 54 | -0.0525 | 16 | -0.0221 | -0.0854 |
| 2024-01-01 | 2025-01-01 | 2025-04-01 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2327 | 54 | -0.0477 | 16 | -0.02 | -0.0788 |
| 2024-04-01 | 2025-04-01 | 2025-07-01 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0808 | 48 | -0.3185 | 16 | -0.0607 | -0.0767 |
| 2024-07-01 | 2025-07-01 | 2025-10-01 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0129 | 52 | 0.2197 | 11 | 0.0188 | -0.0415 |
| 2024-10-01 | 2025-10-01 | 2026-01-01 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0287 | 30 | 0.3126 | 6 | 0.0165 | -0.0304 |
| 2025-01-01 | 2026-01-01 | 2026-04-01 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0507 | 47 | -0.0802 | 16 | -0.0211 | -0.086 |
| 2025-04-01 | 2026-04-01 | 2026-07-01 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0671 | 27 | -0.7852 | 7 | -0.0641 | -0.0711 |
| 2025-07-01 | 2026-07-01 | 2026-10-01 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1385 | 42 | 0.7236 | 11 | 0.0821 | -0.0714 |
| 2025-10-01 | 2026-10-01 | 2026-10-13 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.101 | 44 | -0.8969 | 5 | -0.052 | -0.0537 |


Windows with positive OOS expectancy: 10 of 24.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 171 | 0.3002 | 0.3333 | 1.42 | 0.56 | -0.2143 | 0.0582 | 0.4684 | 0.3045 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 127 | 0.4434 | 0.3307 | 1.55 | 0.73 | -0.2157 | 0.0726 | 0.6092 | 0.2145 | {'entry': 100, 'exit': 20, 'atr_mult': 2.0} |


## Notes

- 14865 bars from 2020-01-01 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 24; grid points per window: 12.