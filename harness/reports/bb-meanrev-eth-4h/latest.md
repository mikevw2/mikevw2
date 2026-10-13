# Backtest: bb-meanrev-eth-4h

Strategy `bb_meanrev` on ETH-USD 4h (Coinbase), 2020-01-01 → latest.
Costs: 20 bps fee/side, 5 bps slippage/side. Risk: 1.0% per trade, max leverage 2.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 12 mo / test 3 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 22 | -0.0921 | 0.5455 | 0.79 | -0.29 | -0.0577 | -0.0056 | -0.0322 | 0.0177 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2020-01-01 | 2021-01-01 | 2021-04-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.1865 | 2 | nan | 0 | 0 | 0 |
| 2020-04-01 | 2021-04-01 | 2021-07-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6743 | 1 | nan | 0 | 0 | 0 |
| 2020-07-01 | 2021-07-01 | 2021-10-01 | {'n': 20, 'k': 2.5, 'rsi_n': 14, 'rsi_lo': 30, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9803 | 2 | -1.031 | 1 | -0.0109 | -0.0129 |
| 2020-10-01 | 2021-10-01 | 2022-01-01 | {'n': 20, 'k': 2.5, 'rsi_n': 14, 'rsi_lo': 30, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.4057 | 3 | -1.032 | 1 | -0.0109 | -0.0109 |
| 2021-01-01 | 2022-01-01 | 2022-04-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0156 | 1 | -1.03 | 1 | -0.0108 | -0.0108 |
| 2021-04-01 | 2022-04-01 | 2022-07-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.5072 | 2 | 0.4735 | 2 | 0.0092 | -0.0042 |
| 2021-07-01 | 2022-07-01 | 2022-10-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0169 | 4 | -0.3911 | 2 | -0.0085 | -0.0113 |
| 2021-10-01 | 2022-10-01 | 2023-01-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.065 | 5 | -0.3667 | 1 | -0.0044 | -0.0072 |
| 2022-01-01 | 2023-01-01 | 2023-04-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0703 | 5 | nan | 0 | 0 | 0 |
| 2022-04-01 | 2023-04-01 | 2023-07-01 | {'n': 20, 'k': 2.5, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0986 | 4 | -1.093 | 1 | -0.0126 | -0.0126 |
| 2022-07-01 | 2023-07-01 | 2023-10-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.7804 | 3 | 0.8184 | 1 | 0.0081 | -0.0042 |
| 2022-10-01 | 2023-10-01 | 2024-01-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0909 | 3 | 0.6464 | 1 | 0.0062 | -0.0018 |
| 2023-01-01 | 2024-01-01 | 2024-04-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2468 | 3 | nan | 0 | 0 | 0 |
| 2023-04-01 | 2024-04-01 | 2024-07-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 30, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3347 | 4 | nan | 0 | 0 | 0 |
| 2023-07-01 | 2024-07-01 | 2024-10-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 30, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.8107 | 3 | -1.085 | 1 | -0.0123 | -0.0123 |
| 2023-10-01 | 2024-10-01 | 2025-01-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 35, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.234 | 11 | -0.3804 | 2 | -0.0084 | -0.0136 |
| 2024-01-01 | 2025-01-01 | 2025-04-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 30, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.5355 | 3 | 0.7829 | 2 | 0.0155 | -0.0057 |
| 2024-04-01 | 2025-04-01 | 2025-07-01 | {'n': 20, 'k': 2.5, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7829 | 2 | nan | 0 | 0 | 0 |
| 2024-07-01 | 2025-07-01 | 2025-10-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7829 | 2 | nan | 0 | 0 | 0 |
| 2024-10-01 | 2025-10-01 | 2026-01-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7829 | 2 | nan | 0 | 0 | 0 |
| 2025-01-01 | 2026-01-01 | 2026-04-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7829 | 2 | 1.019 | 1 | 0.0102 | -0.0019 |
| 2025-04-01 | 2026-04-01 | 2026-07-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 25, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.019 | 1 | -1.592 | 1 | -0.0177 | -0.0177 |
| 2025-07-01 | 2026-07-01 | 2026-10-01 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 35, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2012 | 3 | 0.9482 | 3 | 0.0286 | -0.0084 |
| 2025-10-01 | 2026-10-01 | 2026-10-13 | {'n': 20, 'k': 2.0, 'rsi_n': 14, 'rsi_lo': 35, 'rsi_hi': 70, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4543 | 5 | -1.095 | 1 | -0.0127 | -0.0127 |


Windows with positive OOS expectancy: 6 of 24.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 29 | -0.2759 | 0.4483 | 0.47 | -0.77 | -0.0911 | -0.014 | -0.0911 | 0.0217 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 15 | -0.0216 | 0.5333 | 0.95 | -0.1 | -0.0441 | -0.0017 | -0.0115 | 0.0104 | {'k': 2.5, 'rsi_lo': 25, 'atr_mult': 2.0} |


## Notes

- 14865 bars from 2020-01-01 00:00:00+00:00 to 2026-10-13 12:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 24; grid points per window: 12.