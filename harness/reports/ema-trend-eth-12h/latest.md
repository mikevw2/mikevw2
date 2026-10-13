# Backtest: ema-trend-eth-12h

Strategy `ema_trend` on ETH-USD 12h (Coinbase), 2020-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 18 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 108 | 0.1531 | 0.1852 | 1.28 | 0.27 | -0.1769 | 0.0218 | 0.121 | 0.7477 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2020-01-01 | 2021-07-01 | 2022-01-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 8.132 | 11 | -0.0046 | 14 | -0.0079 | -0.0701 |
| 2020-07-01 | 2022-01-01 | 2022-07-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 4.391 | 19 | 1.515 | 6 | 0.0925 | -0.0454 |
| 2021-01-01 | 2022-07-01 | 2023-01-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3427 | 24 | -0.7091 | 9 | -0.0661 | -0.0723 |
| 2021-07-01 | 2023-01-01 | 2023-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1772 | 17 | -0.0401 | 7 | -0.0056 | -0.0828 |
| 2022-01-01 | 2023-07-01 | 2024-01-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0594 | 20 | 0.532 | 7 | 0.0353 | -0.0667 |
| 2022-07-01 | 2024-01-01 | 2024-07-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3355 | 17 | 0.0652 | 11 | 0.0014 | -0.11 |
| 2023-01-01 | 2024-07-01 | 2025-01-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3354 | 24 | -0.2465 | 10 | -0.0295 | -0.0591 |
| 2023-07-01 | 2025-01-01 | 2025-07-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2308 | 23 | 0.1654 | 10 | 0.0126 | -0.0471 |
| 2024-01-01 | 2025-07-01 | 2026-01-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0674 | 32 | 0.5272 | 9 | 0.0456 | -0.047 |
| 2024-07-01 | 2026-01-01 | 2026-07-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.392 | 21 | 0.1596 | 14 | 0.0176 | -0.0723 |
| 2025-01-01 | 2026-07-01 | 2026-10-13 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5702 | 22 | 0.3242 | 11 | 0.0302 | -0.0598 |


Windows with positive OOS expectancy: 7 of 11.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 106 | 0.5478 | 0.217 | 2.28 | 0.84 | -0.1196 | 0.0791 | 0.6767 | 0.7496 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 102 | 1.079 | 0.1961 | 2.35 | 0.78 | -0.3273 | 0.1317 | 1.316 | 0.7922 | {'fast': 10, 'slow': 100, 'atr_mult': 2.0} |


## Notes

- 4956 bars from 2020-01-01 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 11; grid points per window: 18.