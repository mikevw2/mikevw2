# Backtest: ema-trend-gbpusd-1d

Strategy `ema_trend` on GBPUSD=X 1d (Coinbase), 2005-01-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 36 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 172 | 0.0223 | 0.2849 | 1.03 | 0.03 | -0.1421 | 0.0004 | 0.0051 | 0.7675 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2005-01-03 | 2008-01-03 | 2008-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.597 | 4 | -0.4516 | 5 | -0.0251 | -0.037 |
| 2005-07-03 | 2008-07-03 | 2009-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5525 | 8 | 4.353 | 4 | 0.1734 | -0.0365 |
| 2006-01-03 | 2009-01-03 | 2009-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.973 | 10 | 0.1732 | 2 | 0.0064 | -0.0131 |
| 2006-07-03 | 2009-07-03 | 2010-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.617 | 11 | -1.027 | 4 | -0.04 | -0.0555 |
| 2007-01-03 | 2010-01-03 | 2010-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9065 | 12 | 0.97 | 2 | 0.0193 | -0.0267 |
| 2007-07-03 | 2010-07-03 | 2011-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.6 | 11 | -0.0313 | 10 | -0.0037 | -0.0247 |
| 2008-01-03 | 2011-01-03 | 2011-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3014 | 17 | -0.0256 | 3 | -0.0013 | -0.024 |
| 2008-07-03 | 2011-07-03 | 2012-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0307 | 18 | -0.2709 | 9 | -0.025 | -0.04 |
| 2009-01-03 | 2012-01-03 | 2012-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0179 | 24 | -0.0868 | 10 | -0.0089 | -0.0133 |
| 2009-07-03 | 2012-07-03 | 2013-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1141 | 24 | 0.0603 | 4 | 0.0023 | -0.0106 |
| 2010-01-03 | 2013-01-03 | 2013-07-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0896 | 24 | -0.1973 | 6 | -0.012 | -0.0218 |
| 2010-07-03 | 2013-07-03 | 2014-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1211 | 25 | 0.0705 | 4 | 0.0027 | -0.0172 |
| 2011-01-03 | 2014-01-03 | 2014-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0342 | 20 | -1.031 | 1 | -0.0101 | -0.0101 |
| 2011-07-03 | 2014-07-03 | 2015-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3476 | 10 | 2.156 | 2 | 0.043 | -0.0186 |
| 2012-01-03 | 2015-01-03 | 2015-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7555 | 8 | -0.327 | 4 | -0.0133 | -0.0263 |
| 2012-07-03 | 2015-07-03 | 2016-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5432 | 11 | -0.0544 | 9 | -0.0062 | -0.0317 |
| 2013-01-03 | 2016-01-03 | 2016-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9355 | 10 | -0.397 | 5 | -0.0202 | -0.0603 |
| 2013-07-03 | 2016-07-03 | 2017-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3309 | 13 | 1.317 | 1 | 0.0133 | -0.0078 |
| 2014-01-03 | 2017-01-03 | 2017-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0839 | 12 | -0.3386 | 3 | -0.0102 | -0.0179 |
| 2014-07-03 | 2017-07-03 | 2018-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0575 | 18 | 0.473 | 2 | 0.0094 | -0.0127 |
| 2015-01-03 | 2018-01-03 | 2018-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1327 | 10 | 0.4336 | 2 | 0.0086 | -0.0302 |
| 2015-07-03 | 2018-07-03 | 2019-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1765 | 8 | 1.267 | 1 | 0.0129 | -0.0189 |
| 2016-01-03 | 2019-01-03 | 2019-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.8877 | 5 | -0.3084 | 10 | -0.0316 | -0.0611 |
| 2016-07-03 | 2019-07-03 | 2020-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3296 | 15 | 0.5448 | 2 | 0.0109 | -0.0278 |
| 2017-01-03 | 2020-01-03 | 2020-07-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3692 | 18 | -0.5888 | 6 | -0.0358 | -0.0369 |
| 2017-07-03 | 2020-07-03 | 2021-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0663 | 19 | 0.128 | 5 | 0.0062 | -0.0216 |
| 2018-01-03 | 2021-01-03 | 2021-07-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0436 | 21 | -0.0601 | 3 | -0.0019 | -0.012 |
| 2018-07-03 | 2021-07-03 | 2022-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1482 | 13 | -0.1709 | 5 | -0.009 | -0.0186 |
| 2019-01-03 | 2022-01-03 | 2022-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.035 | 17 | 0.5171 | 5 | 0.0256 | -0.0115 |
| 2019-07-03 | 2022-07-03 | 2023-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3404 | 17 | 0.0132 | 2 | 0.0001 | -0.0381 |
| 2020-01-03 | 2023-01-03 | 2023-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6753 | 12 | -0.1824 | 6 | -0.0113 | -0.0283 |
| 2020-07-03 | 2023-07-03 | 2024-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2681 | 18 | 0.308 | 3 | 0.0092 | -0.0221 |
| 2021-01-03 | 2024-01-03 | 2024-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4854 | 17 | -0.4154 | 6 | -0.0253 | -0.042 |
| 2021-07-03 | 2024-07-03 | 2025-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1502 | 21 | 0.7256 | 3 | 0.0218 | -0.0348 |
| 2022-01-03 | 2025-01-03 | 2025-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0294 | 18 | 0.3274 | 3 | 0.0097 | -0.0136 |
| 2022-07-03 | 2025-07-03 | 2026-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4282 | 12 | -0.5203 | 4 | -0.0209 | -0.0268 |
| 2023-01-03 | 2026-01-03 | 2026-07-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0745 | 17 | -0.2021 | 10 | -0.0204 | -0.0385 |
| 2023-07-03 | 2026-07-03 | 2026-10-13 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0227 | 20 | -0.1848 | 6 | -0.0114 | -0.018 |


Windows with positive OOS expectancy: 17 of 38.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 149 | 0.0664 | 0.2617 | 1.22 | 0.16 | -0.0861 | 0.0053 | 0.0846 | 0.8249 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 149 | 0.0922 | 0.2617 | 1.18 | 0.14 | -0.1263 | 0.0066 | 0.1071 | 0.7966 | {'fast': 20, 'slow': 50, 'atr_mult': 2.0} |


## Notes

- 5660 bars from 2005-01-03 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 38; grid points per window: 18.