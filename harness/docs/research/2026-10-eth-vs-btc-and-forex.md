# Why ETH "passed" and BTC didn't, and whether these rules work on forex

Date: 2026-10-13. Engine: `quant/` after the warm-up fix (test windows start flat). All numbers
out-of-sample walk-forward unless marked IS. Crypto costs 20 bps fee + 5 bps slippage per side;
FX 1 + 0.5 bps; gold 3 + 1 bps.

## 1. ETH vs BTC on the 4h EMA trend rule

| | ETH-USD 4h | BTC-USD 4h |
|---|---|---|
| Annualized vol | 78% | 60% |
| Efficiency ratio (50 bars) | 0.161 | 0.160 |
| Variance ratio (10 bars) | 0.99 | 0.97 |
| OOS trades | 286 | 274 |
| OOS expectancy | +0.26 R | +0.10 R |
| Longs: sum R | +75.5 | +42.1 |
| Shorts: sum R | -1.8 | -14.1 |
| Worst year | 2023: -1.4 R | 2025: -16.8 R |
| Max drawdown | -23% | -34% |
| Expectancy at 0 / 20 / 40 bps (IS) | 0.30 / 0.22 / 0.14 | 0.25 / 0.14 / 0.04 |
| Windows with positive OOS expectancy | 16 of 24 | 12 of 24 |

Findings, in order of weight:

1. **Shorts are the whole difference.** Long trades were profitable on both markets with similar
   win rates. Shorts lost 14 R on BTC and broke even on ETH. BTC's 2025 (-16.8 R, both sides)
   is the drawdown: a wide range after the ETF highs, where a 4h trend rule gets whipsawed in
   both directions. ETH's 2022 bear gave shorts a real trend to ride (+5.9 R in 2022).
2. **Volatility per unit of cost.** Both markets are equally "trendy" (same efficiency and
   variance ratios), but ETH moves 30% more per bar. A trend rule pays fixed bps per round trip
   and earns proportional-to-volatility moves, so the same rule nets more on the higher-vol
   asset. BTC's expectancy falls to ~0 at 40 bps; ETH's does not.
3. **4h is near the cost floor for BTC.** The same rule on 12h and daily bars is better on both
   markets and the BTC/ETH gap closes:

| OOS, EMA trend, long+short | 4h | 12h | 1d |
|---|---|---|---|
| BTC expectancy / PF / max DD | 0.10 / 1.14 / -34% | 0.48 / 1.83 / -12% | 0.48 / 1.70 / -16% |
| ETH expectancy / PF / max DD | 0.26 / 1.44 / -23% | 0.15 / 1.28 / -18% | 0.50 / 2.13 / -19% |

4. **Long-only removes most of the problem** and roughly halves trade count:

| OOS, long-only | trades | expectancy | PF | max DD |
|---|---|---|---|---|
| BTC 4h | 131 | 0.34 | 1.52 | -16% |
| ETH 4h | 139 | 0.44 | 1.60 | -21% |
| BTC 1d | 33 | 1.53 | 3.47 | -9% |
| ETH 1d | 33 | 1.35 | 3.59 | -18% |

5. **Parameter stability** favors ETH: the walk-forward picked fast 20 / slow 100 / 2 ATR in
   most windows for ETH; BTC flipped between fast 10, 20, 30 and ATR 2–4 window to window.

Conclusion: ETH did not have an edge BTC lacked. The rule is a slow trend-follower that needs
big moves relative to costs, and it was run on a timeframe where BTC's moves are too small and
its 2024–26 range too long. The robust version of the finding is: **long-biased trend following
on 12h–1d crypto bars, costs included, has held up out of sample on both majors.** The 4h ETH
result is the lucky end of that same distribution, not a separate edge.

Caveats: daily has 33–80 OOS trades, below the 100-trade gate. Long-only is a structural bet on
crypto's upward drift continuing. Forced closes at window ends ("end" exits) hold a large share of
R because trend profits concentrate in a few long winners; that is a property of the strategy,
not an artifact, but it means live results will be lumpy.

## 2. Forex and gold

Same two rules, free Yahoo data, FX costs 1.5 bps per side (generous for a retail CFD account
once spread and swap are counted; TradeLocker prop accounts also charge commissions).

| Spec | Bars | OOS trades | Expectancy | PF | Sharpe | Max DD |
|---|---|---|---|---|---|---|
| EMA trend EURUSD 1d (2005→) | 5.4k | 155 | +0.04 | 1.07 | 0.07 | -14% |
| EMA trend GBPUSD 1d | 5.4k | 172 | +0.02 | 1.03 | 0.03 | -14% |
| EMA trend USDJPY 1d | 5.4k | 168 | -0.05 | 0.85 | -0.17 | -15% |
| EMA trend gold (GC=F) 1d | 5.3k | 147 | +0.11 | 1.25 | 0.18 | -18% |
| Donchian EURUSD 1d | 5.4k | 94 | -0.06 | 0.87 | -0.11 | -14% |
| Donchian GBPUSD 1d | 5.4k | 99 | -0.14 | 0.67 | -0.32 | -17% |
| Donchian USDJPY 1d | 5.4k | 82 | -0.16 | 0.70 | -0.28 | -16% |
| EMA trend EURUSD 4h (2 yrs) | 3.1k | 81 | -0.01 | 0.95 | -0.14 | -20% |
| EMA trend GBPUSD 4h | 3.1k | 98 | -0.16 | 0.65 | -1.05 | -24% |
| EMA trend USDJPY 4h | 3.1k | 104 | -0.14 | 0.68 | -0.97 | -25% |

Answer: **not as written.** On FX majors the rules are flat to negative out of sample at every
timeframe, with ~15% drawdowns for nothing. Gold is the only non-crypto market with a positive
OOS expectancy, and it is thin (0.11 R, PF 1.25). This matches the market character numbers:
FX majors have annualized vol of 7–10%, a quarter of BTC's, so a trend move rarely covers even
small costs before mean-reverting, and the 4h efficiency ratios are the lowest of any market
tested. The rules are not broken; the input is the wrong kind of market for them.

What would be different for FX, if we pursue it:
- Carry-aware or session-aware rules (London/NY open breakouts) rather than 24h trend rules.
- Cross-sectional momentum across 6–8 pairs rather than one pair at a time.
- Lower frequency with portfolio sizing, accepting Sharpe around 0.3–0.5 as the realistic bar.
- Index CFDs (NAS100, US30) and gold behave more like crypto for trend rules and are worth
  testing next before FX majors.

## 3. What this changes in the harness
- `risk.yaml` paper gate stays. No rule passes it on two markets yet; daily crypto is closest.
- Next experiments, each a one-line spec change: long-only daily and 12h on BTC, ETH, SOL;
  gold and NAS100 daily; volatility-scaled sizing (risk per trade scaled by 1/ATR percentile).
- Walk-forward now starts each test window flat (engine `trade_from`), so trade stats and
  equity stats describe the same trades.
