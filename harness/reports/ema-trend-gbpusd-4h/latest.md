# Backtest: ema-trend-gbpusd-4h

Strategy `ema_trend` on GBPUSD=X 4h (Coinbase), 2023-10-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 9 mo / test 3 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 98 | -0.1641 | 0.2041 | 0.65 | -1.05 | -0.2361 | -0.1185 | -0.1703 | 0.6976 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2023-12-27 | 2024-09-27 | 2024-12-27 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2225 | 30 | -0.4382 | 5 | -0.0206 | -0.0529 |
| 2024-03-27 | 2024-12-27 | 2025-03-27 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6233 | 24 | -0.37 | 12 | -0.047 | -0.0794 |
| 2024-06-27 | 2025-03-27 | 2025-06-27 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4653 | 25 | -0.1188 | 15 | -0.0219 | -0.0607 |
| 2024-09-27 | 2025-06-27 | 2025-09-27 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0881 | 31 | -0.3718 | 20 | -0.079 | -0.1287 |
| 2024-12-27 | 2025-09-27 | 2025-12-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0262 | 24 | 0.2232 | 11 | 0.0234 | -0.0398 |
| 2025-03-27 | 2025-12-27 | 2026-03-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0702 | 31 | -0.0606 | 11 | -0.0085 | -0.028 |
| 2025-06-27 | 2026-03-27 | 2026-06-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0527 | 30 | -0.021 | 10 | -0.0036 | -0.0464 |
| 2025-09-27 | 2026-06-27 | 2026-09-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.032 | 24 | -0.0604 | 13 | -0.013 | -0.0865 |
| 2025-12-27 | 2026-09-27 | 2026-10-13 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0205 | 29 | -1.029 | 1 | -0.0101 | -0.0127 |


Windows with positive OOS expectancy: 1 of 9.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 130 | -0.0926 | 0.2 | 0.72 | -0.71 | -0.2128 | -0.07 | -0.137 | 0.7483 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 107 | -0.0247 | 0.243 | 0.88 | -0.22 | -0.0963 | -0.0203 | -0.0407 | 0.8527 | {'fast': 30, 'slow': 100, 'atr_mult': 4.0} |


## Notes

- 4446 bars from 2023-12-27 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 9; grid points per window: 18.