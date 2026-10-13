"""Performance statistics from an equity curve and a trade list. Deterministic, no plotting."""
from __future__ import annotations
import math
import numpy as np
import pandas as pd

BARS_PER_YEAR = {"1m": 525_600, "5m": 105_120, "15m": 35_040, "1h": 8_760, "2h": 4_380, "4h": 2_190, "6h": 1_460, "12h": 730, "1d": 365, "1w": 52}


def _r(x, dp=4):
    return None if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))) else round(float(x), dp)


def summarize(equity: pd.Series, trades: pd.DataFrame, timeframe: str) -> dict:
    bpy = BARS_PER_YEAR[timeframe]
    rets = equity.pct_change().fillna(0.0)
    n = len(equity)
    years = n / bpy if bpy else float("nan")
    total = equity.iloc[-1] / equity.iloc[0] - 1 if n else 0.0
    cagr = (equity.iloc[-1] / equity.iloc[0]) ** (1 / years) - 1 if years and years > 0 and equity.iloc[0] > 0 and equity.iloc[-1] > 0 else float("nan")
    vol = rets.std(ddof=0) * math.sqrt(bpy)
    sharpe = (rets.mean() * bpy) / vol if vol else float("nan")
    downside = rets[rets < 0].std(ddof=0) * math.sqrt(bpy)
    sortino = (rets.mean() * bpy) / downside if downside else float("nan")
    dd = equity / equity.cummax() - 1
    max_dd = dd.min()
    calmar = cagr / abs(max_dd) if max_dd and not math.isnan(cagr) else float("nan")
    out = dict(bars=n, years=_r(years, 2), total_return=_r(total), cagr=_r(cagr), ann_vol=_r(vol), sharpe=_r(sharpe, 2), sortino=_r(sortino, 2),
               max_drawdown=_r(max_dd), calmar=_r(calmar, 2), final_equity=_r(equity.iloc[-1], 2))
    if trades is None or trades.empty:
        out.update(trades=0, win_rate=None, expectancy_r=None, profit_factor=None, avg_win_r=None, avg_loss_r=None, avg_bars=None, exposure=0.0)
        return out
    wins = trades[trades.pnl > 0]; losses = trades[trades.pnl <= 0]
    gp = wins.pnl.sum(); gl = -losses.pnl.sum()
    exposure = trades.bars.sum() / n if n else 0.0
    out.update(trades=int(len(trades)), win_rate=_r(len(wins) / len(trades)), expectancy_r=_r(trades.r.mean()),
               median_r=_r(trades.r.median()), avg_win_r=_r(wins.r.mean()) if len(wins) else None, avg_loss_r=_r(losses.r.mean()) if len(losses) else None,
               profit_factor=_r(gp / gl, 2) if gl else None, avg_bars=_r(trades.bars.mean(), 1), exposure=_r(exposure),
               longs=int((trades.side == "long").sum()), shorts=int((trades.side == "short").sum()),
               stop_exits=int((trades.reason == "stop").sum()), max_consec_losses=int(_max_streak(trades.pnl <= 0)))
    return out


def _max_streak(mask: pd.Series) -> int:
    best = cur = 0
    for v in mask:
        cur = cur + 1 if v else 0
        best = max(best, cur)
    return best


def objective(stats: dict, min_trades: int = 20) -> float:
    """Selection score for walk-forward: expectancy in R scaled by evidence, penalized under min trades."""
    t = stats.get("trades") or 0
    e = stats.get("expectancy_r")
    if not t or e is None:
        return -1e9
    score = e * math.sqrt(t)
    if t < min_trades:
        score -= (min_trades - t) * 0.05
    return score
