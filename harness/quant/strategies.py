"""Baseline systematic strategies. Each returns a DataFrame of per-bar instructions:

  signal : target direction decided at the CLOSE of the bar: 1 long, -1 short, 0 flat
  stop   : initial stop price to use if a new position is opened from this bar's signal
  atr    : ATR at the bar (for sizing / trailing)

The engine executes signal changes at the NEXT bar's open. Strategies never look ahead:
everything is computed from data available at the bar close.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from . import indicators as ind

REGISTRY = {}


def register(name):
    def deco(fn):
        REGISTRY[name] = fn
        return fn
    return deco


def _frame(df, signal, atr_s, mult):
    out = pd.DataFrame(index=df.index)
    out["signal"] = signal.fillna(0).astype(int)
    out["atr"] = atr_s
    out["stop"] = np.where(out["signal"] > 0, df["close"] - mult * atr_s,
                           np.where(out["signal"] < 0, df["close"] + mult * atr_s, np.nan))
    return out


@register("ema_trend")
def ema_trend(df, fast=20, slow=50, trend=200, atr_period=14, atr_mult=3.0, allow_short=True, **_):
    """Long when fast EMA > slow EMA and close above the trend EMA; short mirrored. Flat otherwise."""
    f, s, t = ind.ema(df["close"], fast), ind.ema(df["close"], slow), ind.ema(df["close"], trend)
    long = (f > s) & (df["close"] > t)
    short = (f < s) & (df["close"] < t) if allow_short else pd.Series(False, index=df.index)
    sig = pd.Series(0, index=df.index).where(~long, 1).where(~short, -1)
    return _frame(df, sig, ind.atr(df, atr_period), atr_mult)


@register("donchian_breakout")
def donchian_breakout(df, entry=55, exit=20, atr_period=14, atr_mult=2.0, allow_short=True, **_):
    """Classic channel breakout: enter on an N-bar high/low, exit on the opposite M-bar channel.
    Stateful, so it is computed with a loop over bars (positions persist between breakouts)."""
    hi_e, lo_e = ind.donchian(df, entry)
    hi_x, lo_x = ind.donchian(df, exit)
    close = df["close"].to_numpy()
    sig = np.zeros(len(df), dtype=int)
    pos = 0
    hi_e, lo_e, hi_x, lo_x = (x.to_numpy() for x in (hi_e, lo_e, hi_x, lo_x))
    for i in range(len(df)):
        if np.isnan(hi_e[i]) or np.isnan(hi_x[i]):
            continue
        if pos == 1 and close[i] < lo_x[i]:
            pos = 0
        elif pos == -1 and close[i] > hi_x[i]:
            pos = 0
        if pos == 0:
            if close[i] > hi_e[i]:
                pos = 1
            elif allow_short and close[i] < lo_e[i]:
                pos = -1
        sig[i] = pos
    return _frame(df, pd.Series(sig, index=df.index), ind.atr(df, atr_period), atr_mult)


@register("bb_meanrev")
def bb_meanrev(df, n=20, k=2.0, rsi_n=14, rsi_lo=30, rsi_hi=70, trend=200, atr_period=14, atr_mult=2.5, allow_short=True, **_):
    """Mean reversion: enter long when close < lower band and RSI < rsi_lo while above the trend EMA
    (buy dips in uptrends); exit when close crosses back above the middle band. Shorts mirrored."""
    lo, mid, hi = ind.bollinger(df["close"], n, k)
    r = ind.rsi(df["close"], rsi_n)
    t = ind.ema(df["close"], trend)
    close = df["close"].to_numpy()
    lo, mid, hi, r, t = (x.to_numpy() for x in (lo, mid, hi, r, t))
    sig = np.zeros(len(df), dtype=int)
    pos = 0
    for i in range(len(df)):
        if np.isnan(mid[i]) or np.isnan(r[i]) or np.isnan(t[i]):
            continue
        if pos == 1 and close[i] >= mid[i]:
            pos = 0
        elif pos == -1 and close[i] <= mid[i]:
            pos = 0
        if pos == 0:
            if close[i] < lo[i] and r[i] < rsi_lo and close[i] > t[i]:
                pos = 1
            elif allow_short and close[i] > hi[i] and r[i] > rsi_hi and close[i] < t[i]:
                pos = -1
        sig[i] = pos
    return _frame(df, pd.Series(sig, index=df.index), ind.atr(df, atr_period), atr_mult)
