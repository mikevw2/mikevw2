# Backtest: ema-trend-btc-4h

Strategy `ema_trend` on BTC-USD 4h (Coinbase), 2020-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 12 mo / test 3 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 254 | 0.1434 | 0.2126 | 1.22 | 0.12 | -0.3502 | 0.0066 | 0.0388 | 0.7751 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2020-01-01 | 2021-01-01 | 2021-04-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9445 | 47 | -0.066 | 13 | 0.0135 | -0.147 |
| 2020-04-01 | 2021-04-01 | 2021-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7356 | 53 | -0.3908 | 12 | -0.0753 | -0.1043 |
| 2020-07-01 | 2021-07-01 | 2021-10-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6944 | 45 | 1.092 | 8 | 0.0806 | -0.0686 |
| 2020-10-01 | 2021-10-01 | 2022-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.8392 | 36 | 2.329 | 4 | 0.0784 | -0.0346 |
| 2021-01-01 | 2022-01-01 | 2022-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3891 | 33 | -0.335 | 7 | 0.0054 | -0.0887 |
| 2021-04-01 | 2022-04-01 | 2022-07-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7141 | 24 | 1.848 | 7 | 0.1234 | -0.0539 |
| 2021-07-01 | 2022-07-01 | 2022-10-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.8765 | 24 | -0.2364 | 10 | -0.0386 | -0.0544 |
| 2021-10-01 | 2022-10-01 | 2023-01-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3372 | 32 | -0.5901 | 12 | -0.0851 | -0.093 |
| 2022-01-01 | 2023-01-01 | 2023-04-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0269 | 38 | 1.223 | 10 | 0.1133 | -0.059 |
| 2022-04-01 | 2023-04-01 | 2023-07-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.4911 | 35 | -0.0549 | 14 | -0.0189 | -0.0875 |
| 2022-07-01 | 2023-07-01 | 2023-10-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3161 | 40 | -0.5429 | 15 | -0.108 | -0.1205 |
| 2022-10-01 | 2023-10-01 | 2024-01-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2222 | 44 | 3.173 | 4 | 0.1247 | -0.0527 |
| 2023-01-01 | 2024-01-01 | 2024-04-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2531 | 44 | 1.698 | 8 | 0.1357 | -0.0721 |
| 2023-04-01 | 2024-04-01 | 2024-07-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9421 | 36 | -0.2827 | 16 | -0.0748 | -0.0958 |
| 2023-07-01 | 2024-07-01 | 2024-10-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7135 | 39 | -0.2544 | 14 | -0.0311 | -0.1004 |
| 2023-10-01 | 2024-10-01 | 2025-01-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2738 | 41 | 0.3501 | 11 | 0.012 | -0.0812 |
| 2024-01-01 | 2025-01-01 | 2025-04-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4526 | 41 | -0.47 | 18 | -0.1092 | -0.1124 |
| 2024-04-01 | 2025-04-01 | 2025-07-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0216 | 45 | -0.0516 | 13 | -0.023 | -0.0596 |
| 2024-07-01 | 2025-07-01 | 2025-10-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1083 | 52 | -0.3021 | 12 | -0.0619 | -0.1328 |
| 2024-10-01 | 2025-10-01 | 2026-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0442 | 50 | -0.1154 | 7 | -0.0134 | -0.077 |
| 2025-01-01 | 2026-01-01 | 2026-04-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0629 | 48 | 0.2239 | 14 | 0.0281 | -0.0426 |
| 2025-04-01 | 2026-04-01 | 2026-07-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0069 | 49 | 0.9519 | 7 | 0.0644 | -0.0227 |
| 2025-07-01 | 2026-07-01 | 2026-10-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2032 | 43 | 0.1842 | 16 | -0.0116 | -0.1401 |
| 2025-10-01 | 2026-10-01 | 2026-10-13 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4535 | 45 | -0.8828 | 2 | -0.0266 | -0.0393 |


Windows with positive OOS expectancy: 10 of 24.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 353 | 0.1421 | 0.1785 | 1.28 | 0.4 | -0.2494 | 0.0424 | 0.3252 | 0.7929 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 334 | 0.2817 | 0.1617 | 1.39 | 0.57 | -0.2676 | 0.0937 | 0.8363 | 0.839 | {'fast': 10, 'slow': 100, 'atr_mult': 2.0} |


## Notes

- 14865 bars from 2020-01-01 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 24; grid points per window: 18.