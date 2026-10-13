# Backtest: ema-trend-btc-12h

Strategy `ema_trend` on BTC-USD 12h (Coinbase), 2020-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 18 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 87 | 0.4803 | 0.2759 | 1.83 | 0.72 | -0.1214 | 0.0713 | 0.4398 | 0.7874 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2020-01-01 | 2021-07-01 | 2022-01-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 6.305 | 15 | -0.0818 | 11 | -0.0156 | -0.0538 |
| 2020-07-01 | 2022-01-01 | 2022-07-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 6.907 | 14 | 0.7335 | 8 | 0.0584 | -0.0714 |
| 2021-01-01 | 2022-07-01 | 2023-01-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2376 | 24 | -0.4632 | 7 | -0.0388 | -0.0436 |
| 2021-07-01 | 2023-01-01 | 2023-07-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4491 | 14 | 0.4656 | 11 | 0.0494 | -0.0913 |
| 2022-01-01 | 2023-07-01 | 2024-01-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7822 | 14 | 3.995 | 4 | 0.1682 | -0.039 |
| 2022-07-01 | 2024-01-01 | 2024-07-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.256 | 16 | 1.073 | 7 | 0.0711 | -0.0622 |
| 2023-01-01 | 2024-07-01 | 2025-01-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.295 | 16 | 0.5258 | 8 | 0.0368 | -0.088 |
| 2023-07-01 | 2025-01-01 | 2025-07-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.84 | 15 | 0.3112 | 6 | 0.0159 | -0.0376 |
| 2024-01-01 | 2025-07-01 | 2026-01-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4062 | 14 | -0.1257 | 11 | -0.0193 | -0.1058 |
| 2024-07-01 | 2026-01-01 | 2026-07-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7618 | 17 | 0.4393 | 10 | 0.0406 | -0.0609 |
| 2025-01-01 | 2026-07-01 | 2026-10-13 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3792 | 22 | 0.5918 | 4 | 0.0219 | -0.0345 |


Windows with positive OOS expectancy: 8 of 11.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 94 | 0.6499 | 0.266 | 2.38 | 0.94 | -0.1299 | 0.0829 | 0.717 | 0.7669 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 85 | 1.575 | 0.2941 | 3.08 | 1.06 | -0.1707 | 0.1689 | 1.885 | 0.7082 | {'fast': 30, 'slow': 50, 'atr_mult': 2.0} |


## Notes

- 4956 bars from 2020-01-01 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 11; grid points per window: 18.