"""Diagnostics: why does a strategy work on one market and not another?

  python -m quant.analyze compare data/strategies/ema-trend-eth-4h.yaml data/strategies/ema-trend-btc-4h.yaml
"""
from __future__ import annotations
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from . import cli, data, engine, stats as st, walkforward as wf, indicators as ind


def market_character(df: pd.DataFrame, bpy: int) -> dict:
    r = np.log(df.close).diff().dropna()
    ann_vol = r.std() * np.sqrt(bpy)
    # Efficiency ratio over 50 bars: |net move| / sum|moves| (1 = straight line, 0 = pure chop)
    n = 50
    er = (df.close.diff(n).abs() / df.close.diff().abs().rolling(n).sum()).dropna()
    # Variance ratio (10 bars): >1 trending/persistent, <1 mean reverting
    vr = (np.log(df.close).diff(10).dropna().var() / (10 * r.var()))
    ac1 = r.autocorr(1); ac5 = pd.Series(np.log(df.close).diff(5).dropna()).autocorr(1)
    ema200 = ind.ema(df.close, 200); atr = ind.atr(df, 14)
    dist = ((df.close - ema200).abs() / atr).dropna()
    above = (df.close > ema200).mean()
    # longest run of bars on one side of EMA200, in days
    side = np.sign(df.close - ema200).dropna()
    runs = (side != side.shift()).cumsum(); longest = side.groupby(runs).size().max() / (bpy / 365)
    return dict(bars=len(df), ann_vol=round(ann_vol, 3), efficiency_ratio_50=round(er.mean(), 3), variance_ratio_10=round(vr, 3),
                autocorr_1bar=round(ac1, 4), autocorr_5bar=round(ac5, 4), median_dist_to_ema200_atr=round(dist.median(), 2),
                pct_above_ema200=round(above, 3), longest_one_side_run_days=round(longest, 1))


def by_period(trades: pd.DataFrame, freq="YE") -> pd.DataFrame:
    if trades.empty:
        return pd.DataFrame()
    g = trades.set_index(pd.to_datetime(trades.exit_time)).groupby(pd.Grouper(freq=freq))
    out = g.agg(trades=("r", "size"), exp_r=("r", "mean"), win=("pnl", lambda x: (x > 0).mean()), sum_r=("r", "sum"),
                longs_r=("r", lambda x: x[trades.loc[x.index, "side"] == "long"].sum() if False else np.nan))
    out = out.drop(columns=["longs_r"])
    side = trades.set_index(pd.to_datetime(trades.exit_time)).groupby([pd.Grouper(freq=freq), "side"]).r.sum().unstack(fill_value=0)
    out = out.join(side.rename(columns=lambda c: f"{c}_sum_r"))
    out.index = out.index.year if freq == "YE" else out.index
    return out.round(3)


def cost_sensitivity(df, spec, bps_list=(0, 10, 20, 40)):
    rows = []
    for b in bps_list:
        _, s = wf.run_once(df, spec["strategy"], spec.get("params", {}), engine.Costs(fee_bps=b, slippage_bps=5), engine.Risk(**{k: v for k, v in spec["risk"].items() if k in engine.Risk.__dataclass_fields__}), spec["market"]["timeframe"])
        rows.append(dict(fee_bps=b, trades=s["trades"], exp_r=s["expectancy_r"], pf=s["profit_factor"], max_dd=s["max_drawdown"]))
    return pd.DataFrame(rows)


def timeframe_sensitivity(spec, tfs=("2h", "4h", "12h", "1d")):
    rows = []
    for tf in tfs:
        df = data.load_any(spec["market"].get("exchange", "coinbase"), spec["market"]["product"], tf, spec["history"]["start"], refresh=False)
        _, s = wf.run_once(df, spec["strategy"], spec.get("params", {}), engine.Costs(**spec["costs"]), engine.Risk(**{k: v for k, v in spec["risk"].items() if k in engine.Risk.__dataclass_fields__}), tf)
        rows.append(dict(timeframe=tf, bars=s["bars"], trades=s["trades"], exp_r=s["expectancy_r"], pf=s["profit_factor"], sharpe=s["sharpe"], max_dd=s["max_drawdown"], cagr=s["cagr"]))
    return pd.DataFrame(rows)


def compare(spec_paths):
    out = []
    for p in spec_paths:
        spec = cli.load_spec(Path(p)); m = spec["market"]
        df = data.load_any(m.get("exchange", "coinbase"), m["product"], m["timeframe"], spec["history"]["start"], refresh=False)
        costs = engine.Costs(**spec["costs"]); risk = engine.Risk(**{k: v for k, v in spec["risk"].items() if k in engine.Risk.__dataclass_fields__})
        w = spec["walkforward"]
        table, oos_eq, oos_tr = wf.walk_forward(df, spec["strategy"], spec.get("params", {}), spec["grid"], costs, risk, m["timeframe"], w["train_months"], w["test_months"], w["min_trades"])
        res, is_s = wf.run_once(df, spec["strategy"], spec.get("params", {}), costs, risk, m["timeframe"])
        print(f"\n######## {spec['id']} ({m['product']} {m['timeframe']})")
        print("\n-- market character"); print(pd.Series(market_character(df, st.BARS_PER_YEAR[m['timeframe']])).to_string())
        print("\n-- OOS trades by year (exit year)"); print(by_period(oos_tr).to_string())
        print("\n-- OOS by side"); print(oos_tr.groupby("side").agg(trades=("r", "size"), exp_r=("r", "mean"), win=("pnl", lambda x: (x > 0).mean()), sum_r=("r", "sum"), avg_bars=("bars", "mean")).round(3).to_string())
        print("\n-- OOS exit reasons"); print(oos_tr.groupby("reason").agg(trades=("r", "size"), exp_r=("r", "mean")).round(3).to_string())
        print("\n-- walk-forward param choices"); print(table[["test_start", "params", "is_expectancy_r", "oos_expectancy_r", "oos_trades", "oos_max_dd"]].to_string(index=False))
        print("\n-- cost sensitivity (in-sample, default params)"); print(cost_sensitivity(df, spec).to_string(index=False))
        print("\n-- timeframe sensitivity (in-sample, default params, same costs)"); print(timeframe_sensitivity(spec).to_string(index=False))
        # drawdown episode of the OOS curve
        dd = oos_eq / oos_eq.cummax() - 1; trough = dd.idxmin(); peak = oos_eq[:trough].idxmax()
        print(f"\n-- worst OOS drawdown {dd.min():.1%}: peak {peak.date()} → trough {trough.date()}")
        out.append((spec, oos_tr, oos_eq))
    return out


if __name__ == "__main__":
    if sys.argv[1] == "compare":
        compare(sys.argv[2:])
