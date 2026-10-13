"""Quant CLI.

  python -m quant.cli data BTC-USD 4h --start 2020-01-01
  python -m quant.cli backtest data/strategies/ema-trend-btc-4h.yaml [--no-wf] [--no-refresh]
  python -m quant.cli backtest data/strategies            # every spec in the folder
"""
from __future__ import annotations
import argparse
import datetime as dt
from pathlib import Path
import yaml
import pandas as pd
from . import data, engine, report, stats as st, strategies, walkforward as wf

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "reports"


def load_spec(p: Path) -> dict:
    spec = yaml.safe_load(p.read_text())
    spec.setdefault("costs", {}); spec.setdefault("risk", {}); spec.setdefault("walkforward", {}); spec.setdefault("history", {})
    spec["costs"] = {"fee_bps": 20, "slippage_bps": 5, **spec["costs"]}
    spec["risk"] = {"equity": 10000, "risk_pct": 1.0, "max_leverage": 2.0, "trailing": False, **spec["risk"]}
    spec["walkforward"] = {"train_months": 12, "test_months": 3, "min_trades": 20, **spec["walkforward"]}
    spec["history"] = {"start": "2020-01-01", **spec["history"]}
    if spec["strategy"] not in strategies.REGISTRY:
        raise SystemExit(f"unknown strategy {spec['strategy']}; known: {list(strategies.REGISTRY)}")
    return spec


def cmd_backtest(args):
    paths = [Path(args.spec)] if Path(args.spec).is_file() else sorted(Path(args.spec).glob("*.yaml"))
    for p in paths:
        if p.name.startswith("_"):
            continue
        spec = load_spec(p)
        m = spec["market"]
        df = data.load_any(m.get("exchange", "coinbase"), m["product"], m["timeframe"], spec["history"]["start"], spec["history"].get("end"), refresh=not args.no_refresh)
        costs = engine.Costs(**spec["costs"])
        risk = engine.Risk(**{k: v for k, v in spec["risk"].items() if k in engine.Risk.__dataclass_fields__})
        params = spec.get("params", {})
        notes = [f"{len(df)} bars from {df.index[0]} to {df.index[-1]}", "Signals act at the next bar open; stops fill intrabar at the stop price (or the open on a gap)."]
        res, is_stats = wf.run_once(df, spec["strategy"], params, costs, risk, m["timeframe"])
        is_best = None
        if spec.get("grid"):
            best, best_s = None, -1e18
            for gp in wf.grid_points(spec["grid"]):
                _, s = wf.run_once(df, spec["strategy"], {**params, **gp}, costs, risk, m["timeframe"])
                if st.objective(s) > best_s:
                    best, best_s = {**s, "params": gp}, st.objective(s)
            is_best = best
        wf_table, oos_eq, oos_tr = (pd.DataFrame(), pd.Series(dtype=float), pd.DataFrame())
        oos_stats = {}
        if not args.no_wf and spec.get("grid"):
            w = spec["walkforward"]
            wf_table, oos_eq, oos_tr = wf.walk_forward(df, spec["strategy"], params, spec["grid"], costs, risk, m["timeframe"], w["train_months"], w["test_months"], w["min_trades"])
            oos_stats = st.summarize(oos_eq, oos_tr, m["timeframe"]) if len(oos_eq) else {}
            notes.append(f"Walk-forward windows: {len(wf_table)}; grid points per window: {len(wf.grid_points(spec['grid']))}.")
        else:
            notes.append("No walk-forward run (no grid or --no-wf); treat in-sample numbers as optimistic.")
        out = REPORTS / spec["id"] / dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        path = report.write(out, spec, oos_stats, wf_table, is_stats, is_best, oos_tr, notes)
        latest = REPORTS / spec["id"] / "latest.md"
        latest.write_text(path.read_text())
        print(f"\n== {spec['id']} ==")
        print("OOS:", {k: oos_stats.get(k) for k in report.KEY_STATS} if oos_stats else "n/a")
        print("IS :", {k: is_stats.get(k) for k in report.KEY_STATS})
        print("report:", path)


def cmd_data(args):
    df = data.load(args.product, args.timeframe, args.start, args.end, refresh=not args.no_refresh)
    print(df.tail(3)); print(f"{len(df)} bars, {df.index[0]} → {df.index[-1]}")


def main():
    ap = argparse.ArgumentParser(prog="quant")
    sub = ap.add_subparsers(required=True)
    b = sub.add_parser("backtest"); b.add_argument("spec"); b.add_argument("--no-wf", action="store_true"); b.add_argument("--no-refresh", action="store_true"); b.set_defaults(fn=cmd_backtest)
    d = sub.add_parser("data"); d.add_argument("product"); d.add_argument("timeframe"); d.add_argument("--start", default="2020-01-01"); d.add_argument("--end"); d.add_argument("--no-refresh", action="store_true"); d.set_defaults(fn=cmd_data)
    a = ap.parse_args(); a.fn(a)


if __name__ == "__main__":
    main()
