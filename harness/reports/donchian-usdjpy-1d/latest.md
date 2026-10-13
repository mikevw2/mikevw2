# Backtest: donchian-usdjpy-1d

Strategy `donchian_breakout` on USDJPY=X 1d (Coinbase), 2005-01-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 36 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 82 | -0.1569 | 0.3049 | 0.7 | -0.28 | -0.1575 | -0.0103 | -0.1294 | 0.296 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2005-01-03 | 2008-01-03 | 2008-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2383 | 19 | 0.0747 | 4 | 0.0038 | -0.0256 |
| 2005-07-03 | 2008-07-03 | 2009-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1698 | 20 | -0.609 | 8 | -0.0516 | -0.063 |
| 2006-01-03 | 2009-01-03 | 2009-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.2007 | 24 | -0.2149 | 3 | -0.0036 | -0.0255 |
| 2006-07-03 | 2009-07-03 | 2010-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.1764 | 22 | 0.1515 | 6 | 0.0094 | -0.0283 |
| 2007-01-03 | 2010-01-03 | 2010-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.069 | 24 | -1.007 | 4 | -0.0384 | -0.0437 |
| 2007-07-03 | 2010-07-03 | 2011-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.4926 | 12 | 1.735 | 1 | 0.0169 | -0.0103 |
| 2008-01-03 | 2011-01-03 | 2011-07-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.4192 | 9 | -0.9746 | 2 | -0.0195 | -0.0195 |
| 2008-07-03 | 2011-07-03 | 2012-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0859 | 7 | -1.009 | 1 | -0.0102 | -0.0158 |
| 2009-01-03 | 2012-01-03 | 2012-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.1037 | 17 | 0.0656 | 3 | 0.0019 | -0.011 |
| 2009-07-03 | 2012-07-03 | 2013-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.055 | 17 | 0.9393 | 3 | 0.0277 | -0.0168 |
| 2010-01-03 | 2013-01-03 | 2013-07-03 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.12 | 7 | 2.789 | 1 | 0.0279 | -0.0175 |
| 2010-07-03 | 2013-07-03 | 2014-01-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.254 | 7 | 2.587 | 1 | 0.026 | -0.0076 |
| 2011-01-03 | 2014-01-03 | 2014-07-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 3.396 | 6 | -1.018 | 1 | -0.0103 | -0.0112 |
| 2011-07-03 | 2014-07-03 | 2015-01-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 5.269 | 4 | 2.406 | 2 | 0.0488 | -0.0146 |
| 2012-01-03 | 2015-01-03 | 2015-07-03 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 6.441 | 3 | -1.006 | 1 | -0.0102 | -0.0102 |
| 2012-07-03 | 2015-07-03 | 2016-01-03 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 6.448 | 3 | -1.01 | 2 | -0.0203 | -0.0203 |
| 2013-01-03 | 2016-01-03 | 2016-07-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.118 | 2 | 0.1945 | 1 | 0.0019 | -0.0084 |
| 2013-07-03 | 2016-07-03 | 2017-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.477 | 3 | 3.27 | 1 | 0.0328 | -0.0078 |
| 2014-01-03 | 2017-01-03 | 2017-07-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.374 | 3 | -0.9344 | 2 | -0.0187 | -0.0193 |
| 2014-07-03 | 2017-07-03 | 2018-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3145 | 4 | nan | 0 | 0 | 0 |
| 2015-01-03 | 2018-01-03 | 2018-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2433 | 5 | -0.1678 | 1 | -0.0017 | -0.0073 |
| 2015-07-03 | 2018-07-03 | 2019-01-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4619 | 8 | -0.4182 | 3 | -0.0129 | -0.0237 |
| 2016-01-03 | 2019-01-03 | 2019-07-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4959 | 9 | -0.4071 | 2 | -0.0082 | -0.0095 |
| 2016-07-03 | 2019-07-03 | 2020-01-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5821 | 9 | -0.777 | 2 | -0.0158 | -0.0252 |
| 2017-01-03 | 2020-01-03 | 2020-07-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.535 | 9 | -0.0361 | 1 | -0.0004 | -0.0296 |
| 2017-07-03 | 2020-07-03 | 2021-01-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5235 | 9 | -1.046 | 1 | -0.0111 | -0.0111 |
| 2018-01-03 | 2021-01-03 | 2021-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.1647 | 13 | -1.016 | 2 | -0.0205 | -0.026 |
| 2018-07-03 | 2021-07-03 | 2022-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1618 | 10 | -1.012 | 1 | -0.0101 | -0.0101 |
| 2019-01-03 | 2022-01-03 | 2022-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.3206 | 7 | -0.4959 | 1 | -0.005 | -0.0105 |
| 2019-07-03 | 2022-07-03 | 2023-01-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.5975 | 5 | 0.2001 | 3 | 0.006 | -0.0137 |
| 2020-01-03 | 2023-01-03 | 2023-07-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.6278 | 6 | -0.6439 | 2 | -0.0129 | -0.017 |
| 2020-07-03 | 2023-07-03 | 2024-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.008 | 6 | 0.1423 | 2 | 0.0027 | -0.0157 |
| 2021-01-03 | 2024-01-03 | 2024-07-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7298 | 8 | 0.2423 | 2 | 0.0047 | -0.0151 |
| 2021-07-03 | 2024-07-03 | 2025-01-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.117 | 8 | 0.0768 | 2 | 0.0015 | -0.0136 |
| 2022-01-03 | 2025-01-03 | 2025-07-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.158 | 11 | -0.8665 | 2 | -0.0174 | -0.0176 |
| 2022-07-03 | 2025-07-03 | 2026-01-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6273 | 12 | -1.005 | 1 | -0.0101 | -0.0101 |
| 2023-01-03 | 2026-01-03 | 2026-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.7467 | 7 | -0.4249 | 3 | -0.0129 | -0.0187 |
| 2023-07-03 | 2026-07-03 | 2026-10-13 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.6659 | 9 | -0.4677 | 4 | -0.0192 | -0.045 |


Windows with positive OOS expectancy: 14 of 38.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 60 | 0.1072 | 0.35 | 1.13 | 0.09 | -0.1284 | 0.0029 | 0.0452 | 0.2413 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 72 | 0.1637 | 0.3472 | 1.23 | 0.15 | -0.1571 | 0.006 | 0.0965 | 0.265 | {'entry': 55, 'exit': 10, 'atr_mult': 2.0} |


## Notes

- 5648 bars from 2005-01-03 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 38; grid points per window: 12.