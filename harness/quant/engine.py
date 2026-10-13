"""Trade-level backtest engine. One instrument, one position at a time, next-bar execution.

Why a loop and not vectorized: stops are path-dependent and we want a real trade list with
R-multiples, because the journal, the risk rules, and the review all speak in R.
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
import math
import numpy as np
import pandas as pd


@dataclass
class Costs:
    fee_bps: float = 20.0        # per side, on notional
    slippage_bps: float = 5.0    # per side, on price


@dataclass
class Risk:
    equity: float = 10_000.0
    risk_pct: float = 1.0        # % of current equity risked to the initial stop
    max_leverage: float = 2.0    # notional / equity cap
    trailing: bool = False       # trail the stop by atr_mult * ATR each bar
    atr_mult: float = 3.0
    min_units: float = 0.0


@dataclass
class Result:
    equity: pd.Series
    trades: pd.DataFrame
    params: dict = field(default_factory=dict)
    bars: int = 0


def _slip(price, side, slippage_bps, entering):
    """Buy orders fill higher, sell orders fill lower."""
    adverse = 1 if (side == 1) == entering else -1
    return price * (1 + adverse * slippage_bps / 1e4)


def run(df: pd.DataFrame, sig: pd.DataFrame, costs: Costs = Costs(), risk: Risk = Risk(), params: dict | None = None) -> Result:
    o, h, l, c = (df[k].to_numpy(float) for k in ("open", "high", "low", "close"))
    signal = sig["signal"].to_numpy(int)
    stop0 = sig["stop"].to_numpy(float)
    atr = sig["atr"].to_numpy(float)
    n = len(df)
    cash = risk.equity
    pos = 0; units = 0.0; entry = 0.0; stop = math.nan; entry_i = -1; init_risk = 0.0
    blocked = 0   # direction we were stopped out of; no re-entry until the signal leaves it
    eq = np.empty(n); eq[:] = risk.equity
    trades = []

    def close_trade(i, price, reason):
        nonlocal cash, pos, units, entry, stop, entry_i, init_risk
        fill = _slip(price, pos, costs.slippage_bps, entering=False)
        gross = (fill - entry) * units * pos
        fees = (abs(entry) + abs(fill)) * units * costs.fee_bps / 1e4
        pnl = gross - fees
        cash += pnl
        trades.append(dict(entry_time=df.index[entry_i], exit_time=df.index[i], side="long" if pos == 1 else "short",
                           entry=entry, exit=fill, units=units, pnl=pnl, r=(pnl / init_risk) if init_risk else 0.0,
                           bars=i - entry_i, reason=reason, equity_after=cash))
        pos = 0; units = 0.0; entry = 0.0; stop = math.nan; entry_i = -1; init_risk = 0.0

    for i in range(1, n):
        # 1) manage an open position on this bar's range
        if pos != 0:
            if risk.trailing and not math.isnan(atr[i - 1]):
                trail = c[i - 1] - risk.atr_mult * atr[i - 1] if pos == 1 else c[i - 1] + risk.atr_mult * atr[i - 1]
                stop = max(stop, trail) if pos == 1 else min(stop, trail)
            hit = (pos == 1 and l[i] <= stop) or (pos == -1 and h[i] >= stop)
            if hit:
                gap = (pos == 1 and o[i] <= stop) or (pos == -1 and o[i] >= stop)
                blocked = pos
                close_trade(i, o[i] if gap else stop, "stop")
        # 2) act on the signal decided at the previous close, at this bar's open
        want = signal[i - 1]
        if want != blocked:
            blocked = 0
        if pos != 0 and want != pos:
            close_trade(i, o[i], "signal")
        if pos == 0 and want != 0 and want != blocked and not math.isnan(stop0[i - 1]):
            px = _slip(o[i], want, costs.slippage_bps, entering=True)
            dist = abs(px - stop0[i - 1])
            if dist > 0:
                equity_now = cash
                u = (equity_now * risk.risk_pct / 100) / dist
                u = min(u, equity_now * risk.max_leverage / px)
                u = math.floor(u * 1e6) / 1e6
                if u > risk.min_units and u > 0:
                    fee = px * u * costs.fee_bps / 1e4
                    cash -= fee
                    pos = want; units = u; entry = px; stop = stop0[i - 1]; entry_i = i; init_risk = dist * u + fee
        # 3) mark to market
        eq[i] = cash + ((c[i] - entry) * units * pos if pos != 0 else 0.0)
    if pos != 0:
        close_trade(n - 1, c[n - 1], "end")
        eq[n - 1] = cash
    tr = pd.DataFrame(trades)
    return Result(equity=pd.Series(eq, index=df.index, name="equity"), trades=tr, params=params or {}, bars=n)
