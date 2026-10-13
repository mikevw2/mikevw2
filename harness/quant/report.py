"""Markdown + JSON reports. Out-of-sample first, always."""
from __future__ import annotations
import json
from pathlib import Path
import pandas as pd


def _fmt(v):
    if v is None:
        return "-"
    if isinstance(v, float):
        return f"{v:.4g}"
    return str(v)


def df_table(df: pd.DataFrame) -> str:
    cols = list(df.columns)
    lines = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for _, row in df.iterrows():
        lines.append("| " + " | ".join(_fmt(row[c]) for c in cols) + " |")
    return "\n".join(lines) + "\n"


def table(d: dict, keys: list[str]) -> str:
    return "| " + " | ".join(keys) + " |\n|" + "---|" * len(keys) + "\n| " + " | ".join(_fmt(d.get(k)) for k in keys) + " |\n"


KEY_STATS = ["trades", "expectancy_r", "win_rate", "profit_factor", "sharpe", "max_drawdown", "cagr", "total_return", "exposure"]


def write(out_dir: Path, spec: dict, oos_stats: dict, wf_table: pd.DataFrame, is_stats: dict, is_best_stats: dict | None, oos_trades: pd.DataFrame, notes: list[str]):
    out_dir.mkdir(parents=True, exist_ok=True)
    m = spec["market"]
    md = [f"# Backtest: {spec['id']}", "",
          f"Strategy `{spec['strategy']}` on {m['product']} {m['timeframe']} (Coinbase), {spec['history']['start']} → {spec['history'].get('end') or 'latest'}.",
          f"Costs: {spec['costs']['fee_bps']} bps fee/side, {spec['costs']['slippage_bps']} bps slippage/side. Risk: {spec['risk']['risk_pct']}% per trade, max leverage {spec['risk'].get('max_leverage', 2)}x.", "",
          "## 1. Out-of-sample (walk-forward) — the number that counts", "",
          f"Train {spec['walkforward']['train_months']} mo / test {spec['walkforward']['test_months']} mo, parameters re-selected each window from the grid.", "",
          table(oos_stats, KEY_STATS), ""]
    if not wf_table.empty:
        md += ["### Windows", "", df_table(wf_table), ""]
        pos = (wf_table.oos_expectancy_r.fillna(0) > 0).sum()
        md += [f"Windows with positive OOS expectancy: {pos} of {len(wf_table)}.", ""]
    md += ["## 2. In-sample, default params on the whole history (for reference only)", "", table(is_stats, KEY_STATS), ""]
    if is_best_stats:
        md += ["## 3. Best grid point on the whole history (what overfitting looks like)", "", table(is_best_stats, KEY_STATS + ["params"]), ""]
    md += ["## Notes", ""] + [f"- {n}" for n in notes]
    (out_dir / "report.md").write_text("\n".join(md))
    payload = dict(spec=spec, oos=oos_stats, windows=json.loads(wf_table.to_json(orient="records", date_format="iso")) if not wf_table.empty else [],
                   in_sample=is_stats, in_sample_best=is_best_stats)
    (out_dir / "report.json").write_text(json.dumps(payload, indent=2, default=str))
    if oos_trades is not None and not oos_trades.empty:
        oos_trades.to_csv(out_dir / "oos_trades.csv", index=False)
    return out_dir / "report.md"
