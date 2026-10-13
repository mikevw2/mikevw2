# Backtest: ema-trend-btc-1d

Strategy `ema_trend` on BTC-USD 1d (Coinbase), 2017-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 24 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 80 | 0.4793 | 0.2375 | 1.7 | 0.6 | -0.1649 | 0.0425 | 0.3827 | 0.7452 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2017-01-01 | 2019-01-01 | 2019-07-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.503 | 8 | 7.358 | 2 | 0.1524 | -0.0507 |
| 2017-07-01 | 2019-07-01 | 2020-01-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.06 | 8 | -0.0878 | 3 | -0.0022 | -0.0296 |
| 2018-01-01 | 2020-01-01 | 2020-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.982 | 5 | -0.6435 | 8 | -0.0529 | -0.0619 |
| 2018-07-01 | 2020-07-01 | 2021-01-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.026 | 12 | 7.152 | 4 | 0.2965 | -0.0483 |
| 2019-01-01 | 2021-01-01 | 2021-07-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.942 | 14 | 2.111 | 3 | 0.0622 | -0.0568 |
| 2019-07-01 | 2021-07-01 | 2022-01-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 7.052 | 8 | -0.4747 | 10 | -0.0511 | -0.0624 |
| 2020-01-01 | 2022-01-01 | 2022-07-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 6.461 | 11 | 1.292 | 3 | 0.0417 | -0.0393 |
| 2020-07-01 | 2022-07-01 | 2023-01-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.2584 | 13 | -0.3943 | 3 | -0.0137 | -0.0179 |
| 2021-01-01 | 2023-01-01 | 2023-07-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.336 | 11 | 0.1722 | 5 | 0.0079 | -0.0402 |
| 2021-07-01 | 2023-07-01 | 2024-01-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9824 | 7 | 0.3884 | 7 | 0.0228 | -0.0524 |
| 2022-01-01 | 2024-01-01 | 2024-07-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5218 | 15 | -0.7939 | 2 | -0.023 | -0.0322 |
| 2022-07-01 | 2024-07-01 | 2025-01-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.192 | 10 | -0.556 | 11 | -0.0632 | -0.0638 |
| 2023-01-01 | 2025-01-01 | 2025-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.202 | 16 | -0.2571 | 7 | -0.0209 | -0.0544 |
| 2023-07-01 | 2025-07-01 | 2026-01-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3161 | 18 | -0.0187 | 7 | -0.0012 | -0.057 |
| 2024-01-01 | 2026-01-01 | 2026-07-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1074 | 20 | 0.8551 | 3 | 0.0278 | -0.0141 |
| 2024-07-01 | 2026-07-01 | 2026-10-13 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3759 | 12 | -0.1802 | 2 | -0.0008 | -0.0141 |


Windows with positive OOS expectancy: 7 of 16.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 76 | 1.012 | 0.2763 | 3.66 | 0.81 | -0.1255 | 0.0723 | 0.9796 | 0.8114 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 84 | 1.238 | 0.3095 | 3.34 | 0.87 | -0.162 | 0.0949 | 1.43 | 0.7764 | {'fast': 10, 'slow': 50, 'atr_mult': 2.0} |


## Notes

- 3573 bars from 2017-01-01 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 16; grid points per window: 18.