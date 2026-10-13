# Backtest: ema-trend-usdjpy-4h

Strategy `ema_trend` on USDJPY=X 4h (Coinbase), 2023-10-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 9 mo / test 3 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 104 | -0.1352 | 0.1731 | 0.68 | -0.97 | -0.2459 | -0.1042 | -0.1501 | 0.7854 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2023-12-27 | 2024-09-27 | 2024-12-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.8886 | 14 | 1.102 | 6 | 0.0646 | -0.0381 |
| 2024-03-27 | 2024-12-27 | 2025-03-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.142 | 17 | -0.1823 | 16 | -0.0307 | -0.0598 |
| 2024-06-27 | 2025-03-27 | 2025-06-27 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2337 | 26 | -0.1597 | 17 | -0.0275 | -0.1057 |
| 2024-09-27 | 2025-06-27 | 2025-09-27 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0196 | 36 | -0.3535 | 25 | -0.0885 | -0.125 |
| 2024-12-27 | 2025-09-27 | 2025-12-27 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1435 | 52 | -0.0931 | 9 | -0.009 | -0.0248 |
| 2025-03-27 | 2025-12-27 | 2026-03-27 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1862 | 50 | -0.0395 | 9 | -0.0035 | -0.0256 |
| 2025-06-27 | 2026-03-27 | 2026-06-27 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1838 | 35 | -0.2351 | 9 | -0.0216 | -0.0495 |
| 2025-09-27 | 2026-06-27 | 2026-09-27 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1159 | 20 | -0.2604 | 11 | -0.03 | -0.0511 |
| 2025-12-27 | 2026-09-27 | 2026-10-13 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.2054 | 18 | -0.0178 | 2 | -0.0005 | -0.0042 |


Windows with positive OOS expectancy: 1 of 9.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 114 | -0.079 | 0.1667 | 0.79 | -0.52 | -0.2399 | -0.0529 | -0.1043 | 0.7952 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 130 | -0.0492 | 0.2231 | 0.81 | -0.5 | -0.1704 | -0.0381 | -0.0758 | 0.7927 | {'fast': 10, 'slow': 50, 'atr_mult': 4.0} |


## Notes

- 4443 bars from 2023-12-27 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 9; grid points per window: 18.