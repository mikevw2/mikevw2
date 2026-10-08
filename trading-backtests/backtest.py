"""Six strategies (3 crypto, 3 forex) on daily bars with costs. Signals use close t, trade into return t+1."""
import numpy as np, pandas as pd
from data import crypto_closes, fx_closes, rates

CRYPTO_COST = 0.0015   # per unit traded: 0.10% taker fee + 0.05% slippage
FX_COST = 0.0001       # ~1 pip spread on majors, per side
FX_CROSS_COST = 0.0002
SPLIT = "2022-01-01"   # report in-sample vs out-of-sample (parameters are textbook defaults, not fitted)


# ---------- helpers ----------
def rsi(p, n):
    d = p.diff()
    up, dn = d.clip(lower=0).ewm(alpha=1 / n, adjust=False).mean(), (-d.clip(upper=0)).ewm(alpha=1 / n, adjust=False).mean()
    return 100 - 100 / (1 + up / dn)


def run(weights, rets, cost):
    """weights: target positions decided at close t (DataFrame). Returns daily net portfolio return."""
    w = weights.reindex(rets.index).fillna(0)
    held = w.shift(1).fillna(0)
    turnover = w.diff().abs().fillna(w.abs())
    c = turnover * (cost if np.isscalar(cost) else pd.Series(cost))
    return (held * rets.fillna(0)).sum(axis=1) - c.sum(axis=1), w


def stats(r, w, periods=365):
    r = r.dropna()
    eq = (1 + r).cumprod()
    yrs = len(r) / periods
    trades = (w.diff().abs() > 1e-9).sum().sum() / 2
    return {"CAGR": eq.iloc[-1] ** (1 / yrs) - 1, "Vol": r.std() * np.sqrt(periods),
            "Sharpe": r.mean() / r.std() * np.sqrt(periods) if r.std() > 0 else np.nan,
            "MaxDD": (eq / eq.cummax() - 1).min(), "Exposure": (w.abs().sum(axis=1) > 0).mean(),
            "Trades/yr": trades / yrs}


# ---------- data ----------
def clean(px):
    r = px.pct_change()
    spike = (r.abs() > 0.03) & ((r + r.shift(-1)).abs() < 0.01)   # one-day spike that reverts = bad tick
    return px.mask(spike).ffill()


cpx = crypto_closes().loc["2018-01-01":]
cret = cpx.pct_change()
fpx = clean(fx_closes()).loc["2009-06-01":]
rt = rates().resample("ME").last().ffill().shift(1)   # monthly data, lagged one month (no look-ahead)
rt = rt.reindex(fpx.index, method="ffill").ffill() / 100


def fx_returns(pairs):
    """Long-pair total return = spot change + interest differential (base - quote), i.e. includes swap/carry."""
    spot = fpx[pairs].pct_change()
    carry = pd.DataFrame({p: (rt[p[:3]] - rt[p[3:]]) / 252 for p in pairs})
    return spot + carry


# ---------- CRYPTO ----------
def crypto_donchian():
    """C1 Turtle-style trend: long BTC/ETH when close > prior 20d high, exit on close < prior 10d low."""
    w = pd.DataFrame(0.0, index=cpx.index, columns=["BTC", "ETH"])
    for c in w:
        p = cpx[c]
        entry, exit_ = p > p.rolling(20).max().shift(1), p < p.rolling(10).min().shift(1)
        sig = pd.Series(np.where(entry, 1.0, np.where(exit_, 0.0, np.nan)), index=p.index).ffill().fillna(0)
        w[c] = sig * 0.5
    return run(w, cret[w.columns], CRYPTO_COST)


def crypto_xsmom():
    """C2 Cross-sectional momentum: weekly, hold top-3 coins by 28d return; cash when BTC < 200d SMA."""
    mom = cpx.pct_change(28).where(cpx.notna().rolling(90).sum() >= 90)   # coin needs 90d history
    regime = cpx["BTC"] > cpx["BTC"].rolling(200).mean()
    w = pd.DataFrame(np.nan, index=cpx.index, columns=cpx.columns)
    for d in cpx.index[cpx.index.dayofweek == 6]:  # Sunday rebalance
        row = pd.Series(0.0, index=cpx.columns)
        if regime[d]:
            top = mom.loc[d].dropna().nlargest(3).index
            row[top] = 1 / 3
        w.loc[d] = row
    return run(w.ffill().fillna(0), cret, CRYPTO_COST)


def crypto_rsi2():
    """C3 Connors RSI(2) dip-buy: long when RSI2 < 10 and close > 200d SMA; exit when close > 5d SMA."""
    w = pd.DataFrame(0.0, index=cpx.index, columns=["BTC", "ETH"])
    for c in w:
        p = cpx[c]
        entry = (rsi(p, 2) < 10) & (p > p.rolling(200).mean())
        exit_ = p > p.rolling(5).mean()
        sig = pd.Series(np.where(entry, 1.0, np.where(exit_, 0.0, np.nan)), index=p.index).ffill().fillna(0)
        w[c] = sig * 0.5
    return run(w, cret[w.columns], CRYPTO_COST)


def crypto_bh():
    w = pd.DataFrame({"BTC": 1.0}, index=cpx.index)
    return run(w, cret[["BTC"]], 0)


# ---------- FOREX ----------
MAJORS = ["EURUSD", "GBPUSD", "AUDUSD", "NZDUSD", "JPYUSD", "CADUSD", "CHFUSD"]


def fx_carry():
    """F1 G8 carry: monthly, long 3 highest-rate currencies, short 3 lowest (USD included, return 0)."""
    r = fx_returns(MAJORS)
    ccys = [p[:3] for p in MAJORS] + ["USD"]
    w = pd.DataFrame(np.nan, index=fpx.index, columns=MAJORS)
    month_end = fpx.index.to_series().groupby(fpx.index.to_period("M")).last()
    for d in month_end:
        rk = rt.loc[d, ccys].dropna().sort_values()
        lw = pd.Series(0.0, index=ccys)
        lw[rk.index[-3:]] = 1 / 3
        lw[rk.index[:3]] = -1 / 3
        w.loc[d] = lw[[p[:3] for p in MAJORS]].values   # USD leg is implicit
    return run(w.ffill().fillna(0), r, FX_COST)


def fx_tsmom():
    """F2 Time-series momentum: each major long/short on sign of 3-month return, scaled to 10% vol, averaged."""
    r = fx_returns(MAJORS)
    vol = r.rolling(60).std() * np.sqrt(252)
    sig = np.sign(fpx[MAJORS].pct_change(63))
    w = (sig * (0.10 / vol)).clip(-3, 3) / len(MAJORS)
    w = w[w.index.dayofweek == 4].reindex(w.index).ffill()   # rebalance weekly (Fri) to cut turnover
    return run(w.fillna(0), r, FX_COST)


def fx_meanrev():
    """F3 Bollinger mean reversion on range-bound crosses: fade |z|>2 of 20d band, exit at the mean."""
    pairs = ["EURGBP", "AUDNZD", "EURCHF"]
    r = fx_returns(pairs)
    w = pd.DataFrame(0.0, index=fpx.index, columns=pairs)
    for c in pairs:
        p = fpx[c]
        z = (p - p.rolling(20).mean()) / p.rolling(20).std()
        sig = pd.Series(np.where(z < -2, 1.0, np.where(z > 2, -1.0, np.nan)), index=p.index)
        cross = np.sign(z) != np.sign(z.shift(1))
        sig = sig.where(sig.notna() | ~cross, 0.0).ffill().fillna(0)
        w[c] = sig / len(pairs)
    return run(w, r, FX_CROSS_COST)


STRATS = {"C1 Donchian trend (BTC/ETH)": (crypto_donchian, 365), "C2 X-sectional momentum (top 3 of 15)": (crypto_xsmom, 365),
          "C3 RSI(2) dip-buy (BTC/ETH)": (crypto_rsi2, 365), "   BTC buy & hold (benchmark)": (crypto_bh, 365),
          "F1 G8 carry (long 3 / short 3)": (fx_carry, 252), "F2 Time-series momentum (7 majors)": (fx_tsmom, 252),
          "F3 Bollinger mean reversion (crosses)": (fx_meanrev, 252)}

if __name__ == "__main__":
    curves, rows = {}, []
    for name, (fn, per) in STRATS.items():
        r, w = fn()
        start = w.abs().sum(axis=1).gt(0).idxmax() if "buy & hold" not in name else r.index[0]
        start = max(start, pd.Timestamp("2010-01-01" if per == 252 else "2018-08-01"))
        r, w = r.loc[start:], w.loc[start:]
        curves[name] = (1 + r).cumprod()
        for label, sl in [("Full", slice(None)), ("In-sample", slice(None, SPLIT)), ("Out-of-sample 2022+", slice(SPLIT, None))]:
            rows.append({"Strategy": name, "Period": label, **stats(r.loc[sl], w.loc[sl], per)})
    df = pd.DataFrame(rows).set_index(["Strategy", "Period"])
    fmt = {"CAGR": "{:.1%}", "Vol": "{:.1%}", "Sharpe": "{:.2f}", "MaxDD": "{:.1%}", "Exposure": "{:.0%}", "Trades/yr": "{:.0f}"}
    out = df.copy()
    for k, f in fmt.items():
        out[k] = df[k].map(f.format)
    pd.set_option("display.width", 200)
    print(out.to_string())
    df.to_csv("results.csv")
    pd.DataFrame(curves).to_csv("equity_curves.csv")
