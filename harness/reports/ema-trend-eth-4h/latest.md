# Backtest: ema-trend-eth-4h

Strategy `ema_trend` on ETH-USD 4h (Coinbase), 2020-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 12 mo / test 3 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 286 | 0.2577 | 0.2098 | 1.44 | 0.63 | -0.2276 | 0.0952 | 0.6922 | 0.8057 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2020-01-01 | 2021-01-01 | 2021-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6229 | 51 | 1.07 | 13 | 0.1305 | -0.1329 |
| 2020-04-01 | 2021-04-01 | 2021-07-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.918 | 48 | 0.649 | 9 | 0.0585 | -0.0564 |
| 2020-07-01 | 2021-07-01 | 2021-10-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.026 | 36 | 0.5601 | 14 | 0.0692 | -0.0847 |
| 2020-10-01 | 2021-10-01 | 2022-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.569 | 33 | -0.0696 | 15 | -0.0173 | -0.1031 |
| 2021-01-01 | 2022-01-01 | 2022-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5179 | 43 | 0.0014 | 7 | 0.0003 | -0.0512 |
| 2021-04-01 | 2022-04-01 | 2022-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3746 | 37 | 1.986 | 6 | 0.1192 | -0.0601 |
| 2021-07-01 | 2022-07-01 | 2022-10-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6007 | 35 | -0.0104 | 12 | -0.0086 | -0.0857 |
| 2021-10-01 | 2022-10-01 | 2023-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2674 | 40 | -0.5315 | 16 | -0.0964 | -0.127 |
| 2022-01-01 | 2023-01-01 | 2023-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0089 | 40 | 0.4948 | 9 | 0.0418 | -0.0741 |
| 2022-04-01 | 2023-04-01 | 2023-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.2153 | 36 | -0.4399 | 16 | -0.0792 | -0.1235 |
| 2022-07-01 | 2023-07-01 | 2023-10-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0865 | 56 | -0.0947 | 12 | -0.0158 | -0.0397 |
| 2022-10-01 | 2023-10-01 | 2024-01-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1068 | 53 | 0.1936 | 12 | 0.0193 | -0.0411 |
| 2023-01-01 | 2024-01-01 | 2024-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0084 | 43 | 0.8845 | 16 | 0.1356 | -0.0887 |
| 2023-04-01 | 2024-04-01 | 2024-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4232 | 46 | -0.18 | 18 | -0.042 | -0.0737 |
| 2023-07-01 | 2024-07-01 | 2024-10-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4937 | 43 | 0.4428 | 8 | 0.0411 | -0.0826 |
| 2023-10-01 | 2024-10-01 | 2025-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5361 | 41 | 0.1464 | 8 | 0.0008 | -0.0754 |
| 2024-01-01 | 2025-01-01 | 2025-04-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5272 | 41 | -0.2111 | 16 | -0.0411 | -0.1007 |
| 2024-04-01 | 2025-04-01 | 2025-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3968 | 35 | 0.214 | 14 | 0.0227 | -0.1062 |
| 2024-07-01 | 2025-07-01 | 2025-10-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3806 | 37 | 0.8223 | 8 | 0.0595 | -0.0755 |
| 2024-10-01 | 2025-10-01 | 2026-01-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6269 | 40 | 0.1592 | 12 | 0.0114 | -0.0655 |
| 2025-01-01 | 2026-01-01 | 2026-04-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6765 | 37 | 0.0649 | 20 | -0.0014 | -0.1241 |
| 2025-04-01 | 2026-04-01 | 2026-07-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3636 | 56 | 0.0846 | 13 | -0.0023 | -0.0882 |
| 2025-07-01 | 2026-07-01 | 2026-10-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2338 | 39 | 1.942 | 10 | 0.2094 | -0.0621 |
| 2025-10-01 | 2026-10-01 | 2026-10-13 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6576 | 40 | -0.1498 | 2 | -0.0052 | -0.0213 |


Windows with positive OOS expectancy: 16 of 24.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 347 | 0.2159 | 0.2075 | 1.49 | 0.73 | -0.156 | 0.0889 | 0.7831 | 0.8154 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 299 | 0.3978 | 0.1873 | 1.58 | 0.81 | -0.2962 | 0.148 | 1.551 | 0.8207 | {'fast': 20, 'slow': 100, 'atr_mult': 2.0} |


## Notes

- 14865 bars from 2020-01-01 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 24; grid points per window: 18.