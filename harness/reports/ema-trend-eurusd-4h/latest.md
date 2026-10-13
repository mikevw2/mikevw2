# Backtest: ema-trend-eurusd-4h

Strategy `ema_trend` on EURUSD=X 4h (Coinbase), 2023-10-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 9 mo / test 3 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 81 | -0.0147 | 0.2099 | 0.95 | -0.14 | -0.1957 | -0.023 | -0.0338 | 0.7359 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2023-12-27 | 2024-09-27 | 2024-12-27 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1517 | 34 | 0.0312 | 6 | 0.0018 | -0.0256 |
| 2024-03-27 | 2024-12-27 | 2025-03-27 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1476 | 16 | 0.0609 | 10 | 0.0032 | -0.0635 |
| 2024-06-27 | 2025-03-27 | 2025-06-27 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3681 | 17 | 1.259 | 7 | 0.0882 | -0.0769 |
| 2024-09-27 | 2025-06-27 | 2025-09-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.009 | 16 | -0.6914 | 17 | -0.1167 | -0.1314 |
| 2024-12-27 | 2025-09-27 | 2025-12-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1964 | 23 | -0.1895 | 14 | -0.0309 | -0.0719 |
| 2025-03-27 | 2025-12-27 | 2026-03-27 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1661 | 35 | -0.0515 | 12 | -0.0077 | -0.0431 |
| 2025-06-27 | 2026-03-27 | 2026-06-27 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1378 | 32 | -0.0111 | 10 | -0.0025 | -0.0397 |
| 2025-09-27 | 2026-06-27 | 2026-09-27 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0121 | 26 | 0.1865 | 4 | 0.0063 | -0.0335 |
| 2025-12-27 | 2026-09-27 | 2026-10-13 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2721 | 15 | 3.586 | 1 | 0.0371 | -0.019 |


Windows with positive OOS expectancy: 5 of 9.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 116 | -0.0711 | 0.2155 | 0.8 | -0.5 | -0.1778 | -0.0534 | -0.1055 | 0.7584 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 99 | -0.0316 | 0.1919 | 0.89 | -0.23 | -0.1484 | -0.0283 | -0.0567 | 0.8657 | {'fast': 20, 'slow': 100, 'atr_mult': 3.0} |


## Notes

- 4446 bars from 2023-12-27 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 9; grid points per window: 18.