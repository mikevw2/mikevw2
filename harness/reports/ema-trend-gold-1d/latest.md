# Backtest: ema-trend-gold-1d

Strategy `ema_trend` on GC=F 1d (Coinbase), 2005-01-01 → latest.
Costs: 3.0 bps fee/side, 1.0 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 36 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 147 | 0.1066 | 0.3129 | 1.25 | 0.18 | -0.1792 | 0.0094 | 0.1292 | 0.7804 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2005-01-03 | 2008-01-03 | 2008-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.9 | 12 | 0.1661 | 1 | 0.0006 | -0.0432 |
| 2005-07-03 | 2008-07-03 | 2009-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7256 | 12 | -0.2614 | 5 | -0.0095 | -0.0504 |
| 2006-01-03 | 2009-01-03 | 2009-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.011 | 15 | -0.0417 | 5 | 0.003 | -0.0331 |
| 2006-07-03 | 2009-07-03 | 2010-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4513 | 18 | 2.466 | 2 | 0.0526 | -0.0467 |
| 2007-01-03 | 2010-01-03 | 2010-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9711 | 8 | 0.5784 | 2 | 0.0114 | -0.0236 |
| 2007-07-03 | 2010-07-03 | 2011-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4533 | 9 | -1.4 | 1 | -0.0106 | -0.0158 |
| 2008-01-03 | 2011-01-03 | 2011-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.724 | 7 | -1.02 | 1 | -0.0129 | -0.0129 |
| 2008-07-03 | 2011-07-03 | 2012-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 15.33 | 1 | 1.165 | 2 | 0.0182 | -0.0728 |
| 2009-01-03 | 2012-01-03 | 2012-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 5.473 | 2 | -0.214 | 8 | -0.0142 | -0.0257 |
| 2009-07-03 | 2012-07-03 | 2013-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.9653 | 10 | -0.4017 | 3 | -0.0083 | -0.0636 |
| 2010-01-03 | 2013-01-03 | 2013-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2921 | 13 | 4.546 | 3 | 0.1372 | -0.0359 |
| 2010-07-03 | 2013-07-03 | 2014-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.881 | 17 | 0.1965 | 2 | 0.0051 | -0.0223 |
| 2011-01-03 | 2014-01-03 | 2014-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6116 | 16 | -0.5324 | 7 | -0.0343 | -0.0381 |
| 2011-07-03 | 2014-07-03 | 2015-01-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7741 | 14 | 0.1722 | 5 | 0.0109 | -0.0435 |
| 2012-01-03 | 2015-01-03 | 2015-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5907 | 20 | -0.3142 | 4 | -0.0077 | -0.0276 |
| 2012-07-03 | 2015-07-03 | 2016-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.034 | 16 | -0.4194 | 4 | -0.018 | -0.0933 |
| 2013-01-03 | 2016-01-03 | 2016-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.059 | 20 | 0.3055 | 4 | 0.0143 | -0.0153 |
| 2013-07-03 | 2016-07-03 | 2017-01-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0209 | 18 | -0.2457 | 5 | -0.0164 | -0.0287 |
| 2014-01-03 | 2017-01-03 | 2017-07-03 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0957 | 13 | -0.4157 | 8 | -0.0325 | -0.0325 |
| 2014-07-03 | 2017-07-03 | 2018-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0062 | 16 | -0.2797 | 6 | -0.0175 | -0.0351 |
| 2015-01-03 | 2018-01-03 | 2018-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | 0.0104 | 15 | 0.1084 | 5 | 0.0049 | -0.0196 |
| 2015-07-03 | 2018-07-03 | 2019-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0526 | 19 | 0.2661 | 4 | 0.0143 | -0.016 |
| 2016-01-03 | 2019-01-03 | 2019-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0343 | 16 | 0.1046 | 6 | 0.0037 | -0.0362 |
| 2016-07-03 | 2019-07-03 | 2020-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1128 | 24 | 1.573 | 1 | 0.0182 | -0.0165 |
| 2017-01-03 | 2020-01-03 | 2020-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.256 | 14 | 0.0449 | 3 | -0.0069 | -0.0726 |
| 2017-07-03 | 2020-07-03 | 2021-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.141 | 14 | -0.3214 | 2 | -0.0076 | -0.0555 |
| 2018-01-03 | 2021-01-03 | 2021-07-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.635 | 9 | -0.6279 | 4 | -0.031 | -0.0344 |
| 2018-07-03 | 2021-07-03 | 2022-01-03 | {'fast': 30, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.627 | 10 | -0.3519 | 11 | -0.0383 | -0.0522 |
| 2019-01-03 | 2022-01-03 | 2022-07-03 | {'fast': 20, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1922 | 25 | -0.1362 | 9 | -0.0091 | -0.033 |
| 2019-07-03 | 2022-07-03 | 2023-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1166 | 31 | 0.0577 | 4 | -0.0032 | -0.0175 |
| 2020-01-03 | 2023-01-03 | 2023-07-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1354 | 33 | 0.0769 | 2 | 0.0001 | -0.0116 |
| 2020-07-03 | 2023-07-03 | 2024-01-03 | {'fast': 10, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.1017 | 28 | -0.0889 | 5 | -0.0049 | -0.021 |
| 2021-01-03 | 2024-01-03 | 2024-07-03 | {'fast': 20, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 4.0, 'allow_short': True} | -0.0384 | 20 | 2.536 | 1 | 0.028 | -0.0117 |
| 2021-07-03 | 2024-07-03 | 2025-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.3212 | 11 | 3.151 | 1 | 0.0287 | -0.0213 |
| 2022-01-03 | 2025-01-03 | 2025-07-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 1.449 | 6 | 5.984 | 1 | 0.0618 | -0.0196 |
| 2022-07-03 | 2025-07-03 | 2026-01-03 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 4.184 | 4 | 4.898 | 1 | 0.0507 | -0.0195 |
| 2023-01-03 | 2026-01-03 | 2026-07-03 | {'fast': 10, 'slow': 100, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 34.09 | 1 | -0.0383 | 5 | -0.0047 | -0.0349 |
| 2023-07-03 | 2026-07-03 | 2026-10-13 | {'fast': 30, 'slow': 50, 'trend': 200, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 6.491 | 3 | -0.3221 | 4 | -0.0137 | -0.0207 |


Windows with positive OOS expectancy: 19 of 38.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 143 | 0.283 | 0.2448 | 1.88 | 0.44 | -0.1616 | 0.0246 | 0.4393 | 0.7671 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 128 | 0.4395 | 0.2656 | 2.33 | 0.53 | -0.1435 | 0.0328 | 0.6217 | 0.7958 | {'fast': 30, 'slow': 50, 'atr_mult': 3.0} |


## Notes

- 5475 bars from 2005-01-03 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 38; grid points per window: 18.