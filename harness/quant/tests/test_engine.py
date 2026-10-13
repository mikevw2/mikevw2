import unittest
import numpy as np
import pandas as pd
from quant import engine, stats, indicators as ind, strategies, walkforward as wf


def frame(prices, start="2024-01-01"):
    idx = pd.date_range(start, periods=len(prices), freq="4h", tz="UTC")
    p = np.asarray(prices, float)
    return pd.DataFrame({"open": p, "high": p * 1.01, "low": p * 0.99, "close": p, "volume": 1.0}, index=idx)


def sig(df, signal, stop):
    return pd.DataFrame({"signal": signal, "stop": stop, "atr": 1.0}, index=df.index)


class EngineTests(unittest.TestCase):
    def test_long_trade_pnl_and_r(self):
        df = frame([100, 100, 110, 110, 110])
        s = sig(df, [1, 1, 1, 0, 0], [95, 95, 95, np.nan, np.nan])
        res = engine.run(df, s, engine.Costs(fee_bps=0, slippage_bps=0), engine.Risk(equity=10000, risk_pct=1, max_leverage=10))
        t = res.trades.iloc[0]
        self.assertEqual(t.side, "long"); self.assertEqual(t.entry, 100); self.assertEqual(t.exit, 110)
        self.assertAlmostEqual(t.units, 20.0)              # $100 risk / $5 stop distance
        self.assertAlmostEqual(t.pnl, 200.0); self.assertAlmostEqual(t.r, 2.0); self.assertEqual(t.reason, "signal")

    def test_stop_hit_intrabar(self):
        df = frame([100, 100, 100, 100]); df.loc[df.index[2], "low"] = 90
        s = sig(df, [1, 1, 1, 1], [95, 95, 95, 95])
        res = engine.run(df, s, engine.Costs(0, 0), engine.Risk(equity=10000, risk_pct=1, max_leverage=10))
        t = res.trades.iloc[0]
        self.assertEqual(t.reason, "stop"); self.assertEqual(t.exit, 95); self.assertAlmostEqual(t.r, -1.0)

    def test_gap_through_stop_fills_at_open(self):
        df = frame([100, 100, 80, 80]); df.loc[df.index[2], ["high", "low"]] = [81, 79]
        s = sig(df, [1, 1, 1, 1], [95, 95, 95, 95])
        res = engine.run(df, s, engine.Costs(0, 0), engine.Risk(equity=10000, risk_pct=1, max_leverage=10))
        self.assertEqual(res.trades.iloc[0].exit, 80); self.assertLess(res.trades.iloc[0].r, -1)

    def test_short_and_costs_reduce_pnl(self):
        df = frame([100, 100, 90, 90])
        s = sig(df, [-1, -1, 0, 0], [105, 105, np.nan, np.nan])
        clean = engine.run(df, s, engine.Costs(0, 0), engine.Risk(equity=10000, risk_pct=1, max_leverage=10)).trades.iloc[0]
        costly = engine.run(df, s, engine.Costs(20, 5), engine.Risk(equity=10000, risk_pct=1, max_leverage=10)).trades.iloc[0]
        self.assertEqual(clean.side, "short"); self.assertAlmostEqual(clean.r, 2.0)
        self.assertLess(costly.pnl, clean.pnl)

    def test_leverage_cap(self):
        df = frame([100, 100, 100])
        s = sig(df, [1, 1, 1], [99.9, 99.9, 99.9])       # tiny stop would imply huge size
        res = engine.run(df, s, engine.Costs(0, 0), engine.Risk(equity=10000, risk_pct=1, max_leverage=2))
        self.assertLessEqual(res.trades.iloc[0].units * 100, 20000 + 1e-6)

    def test_no_lookahead_signal_acts_next_bar(self):
        df = frame([100, 200, 300, 300])
        s = sig(df, [0, 1, 1, 1], [np.nan, 150, 150, 150])
        res = engine.run(df, s, engine.Costs(0, 0), engine.Risk(equity=10000, risk_pct=1, max_leverage=10))
        self.assertEqual(res.trades.iloc[0].entry, 300)   # signal at bar1 close -> fills at bar2 open (300)


    def test_no_reentry_after_stop_until_fresh_signal(self):
        df = frame([100] * 8); df.loc[df.index[2], "low"] = 90
        s = sig(df, [1, 1, 1, 1, 0, 1, 1, 1], [95] * 8)
        res = engine.run(df, s, engine.Costs(0, 0), engine.Risk(equity=10000, risk_pct=1, max_leverage=10))
        self.assertEqual(len(res.trades), 2)                       # stop at bar2, re-entry only after the flat at bar4
        self.assertEqual(res.trades.iloc[0].reason, "stop")
        self.assertEqual(res.trades.iloc[1].entry_time, df.index[6])


    def test_trade_from_blocks_entries_before_timestamp(self):
        df = frame([100] * 6)
        s = sig(df, [1] * 6, [95] * 6)
        res = engine.run(df, s, engine.Costs(0, 0), engine.Risk(equity=10000, risk_pct=1, max_leverage=10), trade_from=df.index[3])
        self.assertEqual(res.trades.iloc[0].entry_time, df.index[3])
        self.assertTrue((res.equity.iloc[:3] == 10000).all())


class IndicatorAndStrategyTests(unittest.TestCase):
    def test_indicators_basic(self):
        s = pd.Series(np.arange(1, 51, dtype=float))
        self.assertAlmostEqual(ind.sma(s, 5).iloc[-1], 48.0)
        self.assertTrue(ind.ema(s, 5).iloc[-1] < 50 and ind.ema(s, 5).iloc[-1] > 47)
        self.assertGreater(ind.rsi(s, 14).iloc[-1], 99)
        lo, mid, hi = ind.bollinger(s, 10, 2); self.assertAlmostEqual(mid.iloc[-1], 45.5)

    def test_strategies_emit_valid_frames(self):
        rng = np.random.default_rng(0)
        prices = 100 * np.exp(np.cumsum(rng.normal(0, 0.01, 1500)))
        df = frame(prices)
        for name, fn in strategies.REGISTRY.items():
            out = fn(df)
            self.assertEqual(set(out.columns), {"signal", "stop", "atr"})
            self.assertTrue(out.signal.isin([-1, 0, 1]).all(), name)
            long_rows = out[out.signal == 1]
            self.assertTrue((long_rows.stop < df.loc[long_rows.index, "close"]).all(), name)
            # no lookahead: truncating the data must not change earlier signals
            out2 = fn(df.iloc[:1000])
            pd.testing.assert_series_equal(out.signal.iloc[:1000], out2.signal, check_names=False)

    def test_stats_and_walkforward_smoke(self):
        rng = np.random.default_rng(1)
        prices = 100 * np.exp(np.cumsum(rng.normal(0.0003, 0.01, 4000)))
        df = frame(prices, start="2022-01-01")
        res, s = wf.run_once(df, "ema_trend", {"fast": 10, "slow": 30, "trend": 100}, engine.Costs(), engine.Risk(), "4h")
        self.assertIn("sharpe", s); self.assertEqual(s["bars"], 4000)
        table, eq, tr = wf.walk_forward(df, "ema_trend", {"trend": 100}, {"fast": [10, 20], "slow": [30, 60]}, engine.Costs(), engine.Risk(), "4h", 6, 3, 5, 150)
        self.assertGreater(len(table), 2)
        self.assertTrue(eq.index.is_monotonic_increasing)
        self.assertEqual(len(wf.grid_points({"a": [1, 2], "b": [3]})), 2)


if __name__ == "__main__":
    unittest.main()
