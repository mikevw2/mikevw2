# Backtest: ema-trend-eth-1d

Strategy `ema_trend` on ETH-USD 1d (Coinbase), 2017-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 24 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 63 | 0.4974 | 0.3651 | 2.13 | 0.48 | -0.1924 | 0.0385 | 0.3423 | 0.7808 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2017-01-01 | 2019-01-01 | 2019-07-01 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.199 | 7 | 0.761 | 3 | 0.0258 | -0.0189 |
| 2017-07-01 | 2019-07-01 | 2020-01-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.013 | 6 | 0.239 | 7 | 0.0152 | -0.0217 |
| 2018-01-01 | 2020-01-01 | 2020-07-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.337 | 6 | -0.7894 | 6 | -0.0466 | -0.0873 |
| 2018-07-01 | 2020-07-01 | 2021-01-01 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0767 | 16 | 3.784 | 2 | 0.0764 | -0.0352 |
| 2019-01-01 | 2021-01-01 | 2021-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.933 | 9 | 3.849 | 3 | 0.1172 | -0.1894 |
| 2019-07-01 | 2021-07-01 | 2022-01-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 8.495 | 8 | 1.618 | 2 | 0.0326 | -0.0372 |
| 2020-01-01 | 2022-01-01 | 2022-07-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 24.71 | 5 | 1.438 | 4 | 0.0572 | -0.0355 |
| 2020-07-01 | 2022-07-01 | 2023-01-01 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.316 | 9 | -0.6255 | 3 | -0.0196 | -0.0238 |
| 2021-01-01 | 2023-01-01 | 2023-07-01 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7227 | 8 | -0.2827 | 6 | -0.0182 | -0.0386 |
| 2021-07-01 | 2023-07-01 | 2024-01-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.382 | 9 | 0.1745 | 4 | 0.0062 | -0.0388 |
| 2022-01-01 | 2024-01-01 | 2024-07-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0131 | 12 | 0.8543 | 2 | 0.0152 | -0.0287 |
| 2022-07-01 | 2024-07-01 | 2025-01-01 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.848 | 5 | -0.6017 | 5 | -0.0315 | -0.0324 |
| 2023-01-01 | 2025-01-01 | 2025-07-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.105 | 8 | -0.0546 | 7 | -0.0057 | -0.0354 |
| 2023-07-01 | 2025-07-01 | 2026-01-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0815 | 10 | 0.8337 | 3 | 0.0267 | -0.0199 |
| 2024-01-01 | 2026-01-01 | 2026-07-01 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7153 | 10 | 1.48 | 4 | 0.062 | -0.0261 |
| 2024-07-01 | 2026-07-01 | 2026-10-13 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.197 | 10 | 0.076 | 2 | 0.0037 | -0.0222 |


Windows with positive OOS expectancy: 11 of 16.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 57 | 1.099 | 0.4035 | 4.58 | 0.63 | -0.2185 | 0.0587 | 0.7475 | 0.7817 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 48 | 2.061 | 0.3958 | 5.21 | 0.64 | -0.307 | 0.0851 | 1.224 | 0.8662 | {'fast': 10, 'slow': 100, 'atr_mult': 2.0} |


## Notes

- 3573 bars from 2017-01-01 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 16; grid points per window: 18.