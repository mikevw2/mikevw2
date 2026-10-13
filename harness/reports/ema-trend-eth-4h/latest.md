# Backtest: ema-trend-eth-4h

Strategy `ema_trend` on ETH-USD 4h (Coinbase), 2020-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 12 mo / test 3 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 265 | 0.2599 | 0.2113 | 1.5 | 0.75 | -0.2145 | 0.1215 | 0.9415 | 0.7326 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2020-01-01 | 2021-01-01 | 2021-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6229 | 51 | -0.3545 | 12 | 0.135 | -0.1342 |
| 2020-04-01 | 2021-04-01 | 2021-07-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.918 | 48 | 0.3706 | 8 | 0.0633 | -0.0569 |
| 2020-07-01 | 2021-07-01 | 2021-10-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.026 | 36 | 0.5847 | 13 | 0.0691 | -0.0847 |
| 2020-10-01 | 2021-10-01 | 2022-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.569 | 33 | -0.0001 | 14 | -0.0208 | -0.1031 |
| 2021-01-01 | 2022-01-01 | 2022-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5179 | 43 | 0.1777 | 6 | 0.0664 | -0.081 |
| 2021-04-01 | 2022-04-01 | 2022-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3746 | 37 | 2.596 | 5 | 0.126 | -0.0549 |
| 2021-07-01 | 2022-07-01 | 2022-10-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6007 | 35 | 0.0827 | 11 | -0.0071 | -0.0857 |
| 2021-10-01 | 2022-10-01 | 2023-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2674 | 40 | -0.5277 | 15 | -0.0947 | -0.127 |
| 2022-01-01 | 2023-01-01 | 2023-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0089 | 40 | 0.6933 | 8 | 0.0473 | -0.0741 |
| 2022-04-01 | 2023-04-01 | 2023-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.2153 | 36 | -0.4771 | 15 | -0.0795 | -0.1119 |
| 2022-07-01 | 2023-07-01 | 2023-10-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0865 | 56 | -0.0413 | 11 | -0.0188 | -0.0437 |
| 2022-10-01 | 2023-10-01 | 2024-01-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1068 | 53 | 0.2521 | 11 | 0.0197 | -0.0411 |
| 2023-01-01 | 2024-01-01 | 2024-04-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0084 | 43 | 1.015 | 15 | 0.1474 | -0.0887 |
| 2023-04-01 | 2024-04-01 | 2024-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4232 | 46 | -0.1271 | 17 | -0.0438 | -0.0737 |
| 2023-07-01 | 2024-07-01 | 2024-10-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4937 | 43 | 0.6438 | 7 | 0.042 | -0.0826 |
| 2023-10-01 | 2024-10-01 | 2025-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5361 | 41 | 0.3219 | 7 | -0.0067 | -0.0779 |
| 2024-01-01 | 2025-01-01 | 2025-04-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5272 | 41 | -0.154 | 15 | -0.039 | -0.1007 |
| 2024-04-01 | 2025-04-01 | 2025-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3968 | 35 | 0.3122 | 13 | 0.0435 | -0.1062 |
| 2024-07-01 | 2025-07-01 | 2025-10-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3806 | 37 | 0.8223 | 8 | 0.0595 | -0.0755 |
| 2024-10-01 | 2025-10-01 | 2026-01-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6269 | 40 | 0.2716 | 11 | 0.0006 | -0.0655 |
| 2025-01-01 | 2026-01-01 | 2026-04-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6765 | 37 | 0.0649 | 20 | -0.0014 | -0.1241 |
| 2025-04-01 | 2026-04-01 | 2026-07-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3636 | 56 | 0.0846 | 13 | -0.0023 | -0.0882 |
| 2025-07-01 | 2026-07-01 | 2026-10-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2338 | 39 | 2.277 | 9 | 0.218 | -0.0621 |
| 2025-10-01 | 2026-10-01 | 2026-10-13 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6576 | 40 | 0.7822 | 1 | 0.0076 | -0.0203 |


Windows with positive OOS expectancy: 17 of 24.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 347 | 0.2162 | 0.2075 | 1.49 | 0.73 | -0.156 | 0.0891 | 0.7846 | 0.8154 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 299 | 0.3982 | 0.1873 | 1.58 | 0.81 | -0.2962 | 0.1482 | 1.554 | 0.8207 | {'fast': 20, 'slow': 100, 'atr_mult': 2.0} |


## Notes

- 14865 bars from 2020-01-01 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 24; grid points per window: 18.