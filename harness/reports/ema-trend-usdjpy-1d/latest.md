# Backtest: ema-trend-usdjpy-1d

Strategy `ema_trend` on USDJPY=X 1d (Coinbase), 2005-01-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 36 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 168 | -0.0466 | 0.2798 | 0.85 | -0.17 | -0.1506 | -0.0075 | -0.0951 | 0.6886 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2005-01-03 | 2008-01-03 | 2008-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0486 | 16 | 0.2243 | 1 | 0.0028 | -0.0242 |
| 2005-07-03 | 2008-07-03 | 2009-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0762 | 19 | -0.8378 | 9 | -0.0748 | -0.076 |
| 2006-01-03 | 2009-01-03 | 2009-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0629 | 19 | -0.2252 | 14 | -0.03 | -0.0368 |
| 2006-07-03 | 2009-07-03 | 2010-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0387 | 24 | 0.2635 | 3 | 0.0083 | -0.0201 |
| 2007-01-03 | 2010-01-03 | 2010-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0416 | 26 | -0.3615 | 8 | -0.0281 | -0.0355 |
| 2007-07-03 | 2010-07-03 | 2011-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.108 | 27 | 1.758 | 1 | 0.0173 | -0.0107 |
| 2008-01-03 | 2011-01-03 | 2011-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.033 | 21 | -0.3135 | 3 | -0.0095 | -0.0193 |
| 2008-07-03 | 2011-07-03 | 2012-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0339 | 15 | 2.381 | 1 | 0.0242 | -0.0157 |
| 2009-01-03 | 2012-01-03 | 2012-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0471 | 11 | -0.3242 | 8 | -0.0263 | -0.044 |
| 2009-07-03 | 2012-07-03 | 2013-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0684 | 13 | 1.061 | 5 | 0.0528 | -0.0166 |
| 2010-01-03 | 2013-01-03 | 2013-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3459 | 15 | 6.104 | 1 | 0.0612 | -0.041 |
| 2010-07-03 | 2013-07-03 | 2014-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.547 | 14 | 1.126 | 3 | 0.0331 | -0.0217 |
| 2011-01-03 | 2014-01-03 | 2014-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.361 | 14 | -0.7487 | 2 | -0.0153 | -0.0192 |
| 2011-07-03 | 2014-07-03 | 2015-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.011 | 17 | -0.5773 | 4 | -0.0234 | -0.0234 |
| 2012-01-03 | 2015-01-03 | 2015-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 10.57 | 4 | -1.004 | 1 | -0.0102 | -0.0102 |
| 2012-07-03 | 2015-07-03 | 2016-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 7.287 | 3 | -0.4389 | 6 | -0.0264 | -0.0339 |
| 2013-01-03 | 2016-01-03 | 2016-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 1.575 | 11 | 1.15 | 2 | 0.023 | -0.0192 |
| 2013-07-03 | 2016-07-03 | 2017-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.064 | 15 | 0.6156 | 2 | 0.0122 | -0.0156 |
| 2014-01-03 | 2017-01-03 | 2017-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 1.103 | 7 | -0.2627 | 8 | -0.0212 | -0.0254 |
| 2014-07-03 | 2017-07-03 | 2018-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0423 | 16 | -0.3315 | 6 | -0.0203 | -0.0342 |
| 2015-01-03 | 2018-01-03 | 2018-07-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0345 | 25 | -0.0558 | 8 | -0.0046 | -0.0224 |
| 2015-07-03 | 2018-07-03 | 2019-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0435 | 24 | -0.0404 | 3 | -0.0012 | -0.0135 |
| 2016-01-03 | 2019-01-03 | 2019-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0646 | 27 | -0.2724 | 6 | -0.0166 | -0.023 |
| 2016-07-03 | 2019-07-03 | 2020-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.083 | 30 | -0.1094 | 9 | -0.0103 | -0.0221 |
| 2017-01-03 | 2020-01-03 | 2020-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1112 | 29 | -0.2276 | 9 | -0.0206 | -0.0272 |
| 2017-07-03 | 2020-07-03 | 2021-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.182 | 31 | 1.493 | 1 | 0.015 | -0.008 |
| 2018-01-03 | 2021-01-03 | 2021-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1621 | 24 | 0.0608 | 4 | 0.0021 | -0.0176 |
| 2018-07-03 | 2021-07-03 | 2022-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1112 | 21 | -1.008 | 1 | -0.0101 | -0.0101 |
| 2019-01-03 | 2022-01-03 | 2022-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0302 | 12 | 8.339 | 1 | 0.0838 | -0.0154 |
| 2019-07-03 | 2022-07-03 | 2023-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 3.036 | 5 | -0.1973 | 3 | -0.006 | -0.0273 |
| 2020-01-03 | 2023-01-03 | 2023-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.494 | 8 | -0.2659 | 6 | -0.0164 | -0.046 |
| 2020-07-03 | 2023-07-03 | 2024-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.568 | 11 | -0.3728 | 2 | -0.0075 | -0.0149 |
| 2021-01-03 | 2024-01-03 | 2024-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.982 | 8 | 1.5 | 2 | 0.0297 | -0.0153 |
| 2021-07-03 | 2024-07-03 | 2025-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.151 | 11 | -0.6252 | 6 | -0.0373 | -0.0378 |
| 2022-01-03 | 2025-01-03 | 2025-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0307 | 17 | -0.0082 | 3 | -0.0004 | -0.0124 |
| 2022-07-03 | 2025-07-03 | 2026-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2645 | 13 | -0.0987 | 10 | -0.0107 | -0.0285 |
| 2023-01-03 | 2026-01-03 | 2026-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0072 | 19 | -0.0559 | 3 | -0.0018 | -0.0152 |
| 2023-07-03 | 2026-07-03 | 2026-10-13 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0205 | 18 | -0.5398 | 3 | -0.0165 | -0.0315 |


Windows with positive OOS expectancy: 13 of 38.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 166 | 0.0818 | 0.247 | 1.22 | 0.17 | -0.1415 | 0.0067 | 0.1088 | 0.7937 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 141 | 0.1417 | 0.2482 | 1.4 | 0.25 | -0.1682 | 0.0107 | 0.1787 | 0.8445 | {'fast': 30, 'slow': 100, 'atr_mult': 3.0} |


## Notes

- 5648 bars from 2005-01-03 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 38; grid points per window: 18.