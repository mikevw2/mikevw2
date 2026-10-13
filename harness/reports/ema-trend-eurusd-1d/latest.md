# Backtest: ema-trend-eurusd-1d

Strategy `ema_trend` on EURUSD=X 1d (Coinbase), 2005-01-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 36 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 155 | 0.0353 | 0.3484 | 1.07 | 0.07 | -0.143 | 0.0023 | 0.0314 | 0.7412 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2005-01-03 | 2008-01-03 | 2008-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9704 | 11 | -1.01 | 1 | -0.0114 | -0.047 |
| 2005-07-03 | 2008-07-03 | 2009-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 8.215 | 3 | -0.265 | 5 | -0.0074 | -0.041 |
| 2006-01-03 | 2009-01-03 | 2009-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.852 | 7 | 0.1669 | 4 | 0.0012 | -0.0265 |
| 2006-07-03 | 2009-07-03 | 2010-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.9802 | 8 | 0.1357 | 3 | 0.004 | -0.0172 |
| 2007-01-03 | 2010-01-03 | 2010-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5092 | 12 | 6.963 | 1 | 0.07 | -0.0243 |
| 2007-07-03 | 2010-07-03 | 2011-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6815 | 11 | -0.5459 | 7 | -0.0386 | -0.0386 |
| 2008-01-03 | 2011-01-03 | 2011-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0435 | 15 | 0.7285 | 3 | 0.0219 | -0.0244 |
| 2008-07-03 | 2011-07-03 | 2012-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3667 | 17 | -0.3573 | 6 | -0.0216 | -0.0345 |
| 2009-01-03 | 2012-01-03 | 2012-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0988 | 18 | 0.3316 | 4 | 0.0131 | -0.0262 |
| 2009-07-03 | 2012-07-03 | 2013-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1255 | 17 | -0.1137 | 5 | -0.0058 | -0.0259 |
| 2010-01-03 | 2013-01-03 | 2013-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0137 | 20 | -0.1599 | 7 | -0.0114 | -0.0306 |
| 2010-07-03 | 2013-07-03 | 2014-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0254 | 19 | 0.2086 | 3 | 0.0062 | -0.0091 |
| 2011-01-03 | 2014-01-03 | 2014-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0443 | 18 | -0.2748 | 7 | -0.0201 | -0.0204 |
| 2011-07-03 | 2014-07-03 | 2015-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0268 | 23 | 1.725 | 3 | 0.0519 | -0.0107 |
| 2012-01-03 | 2015-01-03 | 2015-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3108 | 24 | 0.2879 | 2 | 0.0053 | -0.0387 |
| 2012-07-03 | 2015-07-03 | 2016-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.169 | 12 | -0.096 | 4 | -0.004 | -0.0202 |
| 2013-01-03 | 2016-01-03 | 2016-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.724 | 9 | -0.1949 | 6 | -0.0123 | -0.0281 |
| 2013-07-03 | 2016-07-03 | 2017-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5559 | 18 | -0.4644 | 10 | -0.0467 | -0.0523 |
| 2014-01-03 | 2017-01-03 | 2017-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0971 | 19 | 0.1 | 4 | 0.0038 | -0.0167 |
| 2014-07-03 | 2017-07-03 | 2018-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0607 | 21 | 1.79 | 1 | 0.018 | -0.0131 |
| 2015-01-03 | 2018-01-03 | 2018-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0557 | 19 | 0.0395 | 3 | 0.0011 | -0.0179 |
| 2015-07-03 | 2018-07-03 | 2019-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1579 | 19 | -0.0898 | 3 | -0.0027 | -0.0145 |
| 2016-01-03 | 2019-01-03 | 2019-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.011 | 7 | -0.1454 | 2 | -0.0029 | -0.0088 |
| 2016-07-03 | 2019-07-03 | 2020-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.441 | 6 | 0.0875 | 3 | 0.0025 | -0.0286 |
| 2017-01-03 | 2020-01-03 | 2020-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.481 | 7 | -0.6827 | 7 | -0.0478 | -0.0574 |
| 2017-07-03 | 2020-07-03 | 2021-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0755 | 13 | 5.328 | 1 | 0.0538 | -0.0172 |
| 2018-01-03 | 2021-01-03 | 2021-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2376 | 11 | -0.4309 | 5 | -0.0219 | -0.0291 |
| 2018-07-03 | 2021-07-03 | 2022-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0873 | 13 | 1.729 | 2 | 0.0348 | -0.0162 |
| 2019-01-03 | 2022-01-03 | 2022-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0698 | 13 | -1.02 | 1 | -0.0103 | -0.0205 |
| 2019-07-03 | 2022-07-03 | 2023-01-03 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.436 | 5 | 0.0965 | 4 | 0.0038 | -0.0336 |
| 2020-01-03 | 2023-01-03 | 2023-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.974 | 6 | -1.012 | 1 | -0.0102 | -0.0102 |
| 2020-07-03 | 2023-07-03 | 2024-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.827 | 4 | -0.4118 | 5 | -0.0209 | -0.0364 |
| 2021-01-03 | 2024-01-03 | 2024-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 1.207 | 6 | -0.4193 | 9 | -0.0378 | -0.0412 |
| 2021-07-03 | 2024-07-03 | 2025-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0166 | 20 | 1.05 | 6 | 0.0641 | -0.0176 |
| 2022-01-03 | 2025-01-03 | 2025-07-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0024 | 24 | 1.777 | 2 | 0.0352 | -0.0183 |
| 2022-07-03 | 2025-07-03 | 2026-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2145 | 19 | -0.054 | 2 | -0.0012 | -0.0114 |
| 2023-01-03 | 2026-01-03 | 2026-07-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1639 | 22 | -0.1599 | 10 | -0.0167 | -0.0422 |
| 2023-07-03 | 2026-07-03 | 2026-10-13 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2404 | 22 | 0.3751 | 3 | 0.0107 | -0.0208 |


Windows with positive OOS expectancy: 18 of 38.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 153 | 0.0853 | 0.2876 | 1.27 | 0.19 | -0.0994 | 0.0071 | 0.1158 | 0.8175 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 124 | 0.1872 | 0.2823 | 1.36 | 0.22 | -0.1469 | 0.0127 | 0.2159 | 0.8499 | {'fast': 20, 'slow': 100, 'atr_mult': 2.0} |


## Notes

- 5648 bars from 2005-01-03 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 38; grid points per window: 18.