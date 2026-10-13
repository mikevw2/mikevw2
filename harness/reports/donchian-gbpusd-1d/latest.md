# Backtest: donchian-gbpusd-1d

Strategy `donchian_breakout` on GBPUSD=X 1d (Coinbase), 2005-01-01 → latest.
Costs: 1.0 bps fee/side, 0.5 bps slippage/side. Risk: 1.0% per trade, max leverage 5.0x.

## 1. Out-of-sample (walk-forward) — the number that counts

Train 36 mo / test 6 mo, parameters re-selected each window from the grid.

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 99 | -0.1361 | 0.3535 | 0.67 | -0.32 | -0.1694 | -0.0108 | -0.135 | 0.3821 |


### Windows

| train_start | test_start | test_end | params | is_expectancy_r | is_trades | oos_expectancy_r | oos_trades | oos_return | oos_max_dd |
|---|---|---|---|---|---|---|---|---|---|
| 2005-01-03 | 2008-01-03 | 2008-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3089 | 8 | -0.8098 | 2 | -0.0164 | -0.0203 |
| 2005-07-03 | 2008-07-03 | 2009-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0796 | 7 | 1.457 | 2 | 0.0292 | -0.0216 |
| 2006-01-03 | 2009-01-03 | 2009-07-03 | {'entry': 55, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.3658 | 14 | 0.0058 | 3 | 0.0029 | -0.018 |
| 2006-07-03 | 2009-07-03 | 2010-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4955 | 10 | -1.048 | 2 | -0.0199 | -0.0199 |
| 2007-01-03 | 2010-01-03 | 2010-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4916 | 9 | 0.6207 | 2 | 0.0123 | -0.0131 |
| 2007-07-03 | 2010-07-03 | 2011-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.4987 | 9 | 0.2869 | 1 | 0.0028 | -0.0195 |
| 2008-01-03 | 2011-01-03 | 2011-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.7993 | 8 | -1.008 | 1 | -0.0102 | -0.0113 |
| 2008-07-03 | 2011-07-03 | 2012-01-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1938 | 23 | -0.3394 | 5 | -0.0172 | -0.0319 |
| 2009-01-03 | 2012-01-03 | 2012-07-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.147 | 23 | -0.1611 | 4 | -0.0066 | -0.0149 |
| 2009-07-03 | 2012-07-03 | 2013-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.1869 | 6 | nan | 0 | 0 | 0 |
| 2010-01-03 | 2013-01-03 | 2013-07-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.0749 | 17 | 0.2225 | 4 | 0.0083 | -0.0281 |
| 2010-07-03 | 2013-07-03 | 2014-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.1606 | 4 | 0.5231 | 1 | 0.0052 | -0.0162 |
| 2011-01-03 | 2014-01-03 | 2014-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5432 | 4 | -1.021 | 2 | -0.0203 | -0.0203 |
| 2011-07-03 | 2014-07-03 | 2015-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.5417 | 4 | 0.1391 | 2 | 0.0025 | -0.0322 |
| 2012-01-03 | 2015-01-03 | 2015-07-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 1.118 | 4 | -0.4611 | 3 | -0.014 | -0.0229 |
| 2012-07-03 | 2015-07-03 | 2016-01-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.6053 | 7 | 0.1257 | 2 | 0.0023 | -0.0129 |
| 2013-01-03 | 2016-01-03 | 2016-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.2851 | 8 | -1.166 | 3 | -0.0353 | -0.0518 |
| 2013-07-03 | 2016-07-03 | 2017-01-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.1426 | 7 | -0.432 | 2 | -0.0087 | -0.0087 |
| 2014-01-03 | 2017-01-03 | 2017-07-03 | {'entry': 100, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0945 | 6 | -0.2991 | 2 | -0.006 | -0.0118 |
| 2014-07-03 | 2017-07-03 | 2018-01-03 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.127 | 7 | -0.4519 | 1 | -0.0046 | -0.0107 |
| 2015-01-03 | 2018-01-03 | 2018-07-03 | {'entry': 55, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.2618 | 6 | 0.2054 | 3 | 0.006 | -0.0217 |
| 2015-07-03 | 2018-07-03 | 2019-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.1057 | 11 | 0.337 | 1 | 0.0035 | -0.0072 |
| 2016-01-03 | 2019-01-03 | 2019-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.4719 | 11 | -0.5705 | 3 | -0.0171 | -0.0187 |
| 2016-07-03 | 2019-07-03 | 2020-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | -0.1684 | 11 | 0.1203 | 2 | 0.0023 | -0.0238 |
| 2017-01-03 | 2020-01-03 | 2020-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1593 | 10 | -0.5868 | 7 | -0.041 | -0.042 |
| 2017-07-03 | 2020-07-03 | 2021-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0431 | 13 | 0.7909 | 3 | 0.0239 | -0.0153 |
| 2018-01-03 | 2021-01-03 | 2021-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1082 | 14 | 0.0496 | 4 | 0.0018 | -0.0175 |
| 2018-07-03 | 2021-07-03 | 2022-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0593 | 15 | -0.1885 | 2 | -0.0037 | -0.0152 |
| 2019-01-03 | 2022-01-03 | 2022-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | -0.0366 | 14 | 0.3594 | 2 | 0.0072 | -0.0154 |
| 2019-07-03 | 2022-07-03 | 2023-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0163 | 15 | 0.2863 | 2 | 0.0056 | -0.0153 |
| 2020-01-03 | 2023-01-03 | 2023-07-03 | {'entry': 100, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.224 | 6 | -0.3296 | 2 | -0.0066 | -0.0163 |
| 2020-07-03 | 2023-07-03 | 2024-01-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1048 | 16 | 0.7093 | 3 | 0.0214 | -0.0121 |
| 2021-01-03 | 2024-01-03 | 2024-07-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1463 | 16 | -0.4829 | 4 | -0.0194 | -0.0279 |
| 2021-07-03 | 2024-07-03 | 2025-01-03 | {'entry': 20, 'exit': 10, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.0402 | 15 | 0.0318 | 5 | 0.0012 | -0.0197 |
| 2022-01-03 | 2025-01-03 | 2025-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 3.0, 'allow_short': True} | 0.1676 | 13 | 0.0405 | 2 | 0.0008 | -0.0084 |
| 2022-07-03 | 2025-07-03 | 2026-01-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2609 | 14 | -0.213 | 3 | -0.0066 | -0.0227 |
| 2023-01-03 | 2026-01-03 | 2026-07-03 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.256 | 14 | -0.1742 | 4 | -0.007 | -0.0437 |
| 2023-07-03 | 2026-07-03 | 2026-10-13 | {'entry': 20, 'exit': 20, 'atr_period': 14, 'atr_mult': 2.0, 'allow_short': True} | 0.2277 | 13 | -0.4255 | 3 | -0.0133 | -0.0228 |


Windows with positive OOS expectancy: 18 of 38.

## 2. In-sample, default params on the whole history (for reference only)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure |
|---|---|---|---|---|---|---|---|---|
| 65 | -0.4111 | 0.2769 | 0.46 | -0.47 | -0.2768 | -0.018 | -0.2458 | 0.2231 |


## 3. Best grid point on the whole history (what overfitting looks like)

| trades | expectancy_r | win_rate | profit_factor | sharpe | max_drawdown | cagr | total_return | exposure | params |
|---|---|---|---|---|---|---|---|---|---|
| 46 | -0.0981 | 0.3696 | 0.79 | -0.13 | -0.1239 | -0.0032 | -0.0486 | 0.1853 | {'entry': 100, 'exit': 20, 'atr_mult': 3.0} |


## Notes

- 5660 bars from 2005-01-03 00:00:00+00:00 to 2026-10-13 00:00:00+00:00
- Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap).
- Walk-forward windows: 38; grid points per window: 12.