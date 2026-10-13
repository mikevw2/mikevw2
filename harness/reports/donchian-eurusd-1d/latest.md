# Backtest: donchian-eurusd-1d

Strategy `donchian_breakout` on EURUSD=X 1d (Coinbase), 2005-01-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 36 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 94 | -0.0563 | 0.3404 | 0.87 | -0.11 | -0.1383 | -0.005 | -0.0646 | 0.4195 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2005-01-03 | 2008-01-03 | 2008-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.315 | 7 | -0.088 | 2 | -0.0018 | -0.0125 |
| 2005-07-03 | 2008-07-03 | 2009-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.177 | 7 | 0.1986 | 2 | 0.0039 | -0.0103 |
| 2006-01-03 | 2009-01-03 | 2009-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.903 | 8 | -1.007 | 1 | -0.0102 | -0.0162 |
| 2006-07-03 | 2009-07-03 | 2010-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.6916 | 9 | -0.6058 | 4 | -0.0245 | -0.0252 |
| 2007-01-03 | 2010-01-03 | 2010-07-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.1683 | 14 | 0.3666 | 4 | 0.0172 | -0.0205 |
| 2007-07-03 | 2010-07-03 | 2011-01-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.056 | 15 | 0.2664 | 2 | 0.0052 | -0.0149 |
| 2008-01-03 | 2011-01-03 | 2011-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1366 | 11 | -1.009 | 1 | -0.0102 | -0.0119 |
| 2008-07-03 | 2011-07-03 | 2012-01-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1787 | 23 | 0.457 | 1 | 0.0046 | -0.014 |
| 2009-01-03 | 2012-01-03 | 2012-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2399 | 13 | 0.4859 | 3 | 0.0146 | -0.0257 |
| 2009-07-03 | 2012-07-03 | 2013-01-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4967 | 18 | -0.1848 | 5 | -0.0099 | -0.032 |
| 2010-01-03 | 2013-01-03 | 2013-07-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4354 | 18 | -0.7751 | 5 | -0.0387 | -0.0387 |
| 2010-07-03 | 2013-07-03 | 2014-01-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0368 | 19 | -0.3453 | 3 | -0.0105 | -0.0214 |
| 2011-01-03 | 2014-01-03 | 2014-07-03 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0491 | 8 | -1.028 | 1 | -0.0104 | -0.0104 |
| 2011-07-03 | 2014-07-03 | 2015-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0404 | 12 | 1.748 | 2 | 0.0348 | -0.0173 |
| 2012-01-03 | 2015-01-03 | 2015-07-03 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.28 | 6 | 3.211 | 1 | 0.032 | -0.0132 |
| 2012-07-03 | 2015-07-03 | 2016-01-03 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.51 | 4 | 0.1242 | 2 | 0.0025 | -0.0177 |
| 2013-01-03 | 2016-01-03 | 2016-07-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.52 | 4 | -0.7069 | 1 | -0.0071 | -0.0104 |
| 2013-07-03 | 2016-07-03 | 2017-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 2.649 | 2 | -0.1257 | 2 | -0.0026 | -0.0106 |
| 2014-01-03 | 2017-01-03 | 2017-07-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.643 | 3 | 1.214 | 2 | 0.0241 | -0.019 |
| 2014-07-03 | 2017-07-03 | 2018-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.915 | 4 | 1.888 | 1 | 0.0192 | -0.0193 |
| 2015-01-03 | 2018-01-03 | 2018-07-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.393 | 3 | 0.1539 | 2 | 0.003 | -0.0124 |
| 2015-07-03 | 2018-07-03 | 2019-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.353 | 4 | 0.0671 | 1 | 0.0008 | -0.0109 |
| 2016-01-03 | 2019-01-03 | 2019-07-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.421 | 4 | -1.017 | 2 | -0.0206 | -0.0206 |
| 2016-07-03 | 2019-07-03 | 2020-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5311 | 6 | -1.015 | 1 | -0.0104 | -0.0105 |
| 2017-01-03 | 2020-01-03 | 2020-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0776 | 13 | -0.6177 | 5 | -0.0311 | -0.0407 |
| 2017-07-03 | 2020-07-03 | 2021-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.616 | 8 | 0.2405 | 2 | 0.0048 | -0.0111 |
| 2018-01-03 | 2021-01-03 | 2021-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.1816 | 15 | -0.5012 | 4 | -0.0203 | -0.0279 |
| 2018-07-03 | 2021-07-03 | 2022-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.4687 | 17 | 0.9453 | 3 | 0.0282 | -0.0185 |
| 2019-01-03 | 2022-01-03 | 2022-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0221 | 17 | -0.9984 | 3 | -0.03 | -0.04 |
| 2019-07-03 | 2022-07-03 | 2023-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.0015 | 15 | 0.299 | 2 | 0.0057 | -0.0255 |
| 2020-01-03 | 2023-01-03 | 2023-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1389 | 14 | -0.2324 | 5 | -0.0118 | -0.0266 |
| 2020-07-03 | 2023-07-03 | 2024-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.3192 | 4 | -0.1753 | 2 | -0.0036 | -0.0098 |
| 2021-01-03 | 2024-01-03 | 2024-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.2231 | 14 | -0.86 | 3 | -0.0258 | -0.0286 |
| 2021-07-03 | 2024-07-03 | 2025-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1619 | 14 | 1.815 | 2 | 0.0368 | -0.014 |
| 2022-01-03 | 2025-01-03 | 2025-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.4979 | 11 | -0.0909 | 2 | -0.0019 | -0.0094 |
| 2022-07-03 | 2025-07-03 | 2026-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.4132 | 12 | -0.8274 | 3 | -0.0248 | -0.0248 |
| 2023-01-03 | 2026-01-03 | 2026-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0914 | 13 | 0.1326 | 4 | 0.0049 | -0.0349 |
| 2023-07-03 | 2026-07-03 | 2026-10-13 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4408 | 11 | 0.3358 | 3 | 0.0095 | -0.0268 |


Windows with positive OOS expectancy: 18 of 38.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 61 | 0.0374 | 0.3443 | 1.04 | 0.04 | -0.1299 | 0.0007 | 0.0116 | 0.2422 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 40 | 0.1578 | 0.35 | 1.27 | 0.12 | -0.108 | 0.0036 | 0.0576 | 0.1776 | {'entry': 100, 'exit': 20, 'atr_mult': 2.0} |


## Notes

- 5648 bars from 2005-01-03 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 38; grid points per window: 12.