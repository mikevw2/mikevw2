"""Anchored-rolling walk-forward: optimize on a train window, test on the next window, roll."""
from __future__ import annotations
import itertools
import pandas as pd
from . import engine, stats as st, strategies


def grid_points(grid: dict) -> list[dict]:
    if not grid:
        return [{}]
    keys = list(grid)
    return [dict(zip(keys, vals)) for vals in itertools.product(*(grid[k] for k in keys))]


def run_once(df, strategy, params, costs, risk, timeframe):
    sig = strategies.REGISTRY[strategy](df, **params)
    res = engine.run(df, sig, costs, risk, params)
    return res, st.summarize(res.equity, res.trades, timeframe)


def windows(index: pd.DatetimeIndex, train_months: int, test_months: int):
    start = index[0]
    end = index[-1]
    t0 = start
    while True:
        t1 = t0 + pd.DateOffset(months=train_months)
        t2 = t1 + pd.DateOffset(months=test_months)
        if t1 >= end:
            break
        yield t0, t1, min(t2, end)
        t0 = t0 + pd.DateOffset(months=test_months)


def walk_forward(df, strategy, base_params, grid, costs, risk, timeframe, train_months=12, test_months=3, min_trades=20, warmup_bars=300):
    """Returns (per-window DataFrame, stitched OOS equity Series, OOS trades DataFrame)."""
    rows = []
    oos_equity_parts = []
    oos_trades = []
    level = risk.equity
    for t0, t1, t2 in windows(df.index, train_months, test_months):
        train = df[(df.index >= t0) & (df.index < t1)]
        # give the test window indicator warm-up by including trailing train bars, then cut them from results
        test_full = df[(df.index >= t1) & (df.index < t2)]
        if len(train) < warmup_bars or len(test_full) < 10:
            continue
        best, best_score, best_stats = None, -1e18, None
        for gp in grid_points(grid):
            p = {**base_params, **gp}
            _, s = run_once(train, strategy, p, costs, risk, timeframe)
            sc = st.objective(s, min_trades)
            if sc > best_score:
                best, best_score, best_stats = p, sc, s
        warm = df[(df.index < t1)].tail(warmup_bars)
        seg = pd.concat([warm, test_full])
        res, _ = run_once(seg, strategy, best, costs, engine.Risk(**{**risk.__dict__, "equity": level}), timeframe)
        eq = res.equity[res.equity.index >= t1]
        tr = res.trades[res.trades.entry_time >= t1] if not res.trades.empty else res.trades
        # equity at t1 is `level`; rebase so warm-up trades don't leak into OOS
        if len(eq):
            eq = eq / eq.iloc[0] * level
            level = float(eq.iloc[-1])
            oos_equity_parts.append(eq)
        if not tr.empty:
            oos_trades.append(tr)
        s_test = st.summarize(eq, tr, timeframe) if len(eq) else {}
        rows.append(dict(train_start=t0.date(), test_start=t1.date(), test_end=t2.date(), params=best,
                         is_expectancy_r=best_stats.get("expectancy_r"), is_trades=best_stats.get("trades"),
                         oos_expectancy_r=s_test.get("expectancy_r"), oos_trades=s_test.get("trades"), oos_return=s_test.get("total_return"), oos_max_dd=s_test.get("max_drawdown")))
    oos_eq = pd.concat(oos_equity_parts) if oos_equity_parts else pd.Series(dtype=float)
    oos_tr = pd.concat(oos_trades) if oos_trades else pd.DataFrame()
    return pd.DataFrame(rows), oos_eq, oos_tr
