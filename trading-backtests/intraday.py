"""Step 2: intraday versions.

A) Crypto C1 (Donchian 20/10) and C3 (RSI(2) dip-buy) on 4h and 1h bars, same textbook rules as daily.
B) FX London breakout on hourly bars: Asian range 00:00-07:00 UTC, enter on a close outside it between
   07:00 and 12:00 UTC, stop at the other side of the range, flat by 16:00 UTC. One trade per pair per day.
"""
import numpy as np, pandas as pd
import backtest as bt
from data import crypto_hourly, fx_hourly

FX_PAIRS = {"EURUSD=X": "EURUSD", "GBPUSD=X": "GBPUSD", "JPY=X": "USDJPY"}


def table(rows):
    df = pd.DataFrame(rows).set_index(["Strategy", "Period"])
    fmt = {"CAGR": "{:.1%}", "Vol": "{:.1%}", "Sharpe": "{:.2f}", "MaxDD": "{:.1%}", "Exposure": "{:.0%}", "Trades/yr": "{:.0f}"}
    out = df.copy()
    for k, f in fmt.items():
        out[k] = df[k].map(f.format)
    return df, out


# ---------- A) crypto on intraday bars ----------
def crypto_bars(rule):
    px = pd.DataFrame({c: crypto_hourly(c)["close"] for c in ["BTC", "ETH"]})
    return px.resample(rule, label="right", closed="right").last().dropna() if rule != "1h" else px


def donchian(px):
    w = pd.DataFrame(0.0, index=px.index, columns=px.columns)
    for c in px:
        p = px[c]
        sig = pd.Series(np.where(p > p.rolling(20).max().shift(1), 1.0,
                                 np.where(p < p.rolling(10).min().shift(1), 0.0, np.nan)), index=p.index)
        w[c] = sig.ffill().fillna(0) * 0.5
    return w


def rsi2(px):
    w = pd.DataFrame(0.0, index=px.index, columns=px.columns)
    for c in px:
        p = px[c]
        entry = (bt.rsi(p, 2) < 10) & (p > p.rolling(200).mean())
        sig = pd.Series(np.where(entry, 1.0, np.where(p > p.rolling(5).mean(), 0.0, np.nan)), index=p.index)
        w[c] = sig.ffill().fillna(0) * 0.5
    return w


def crypto_rows():
    rows = []
    for rule, per in [("1D", 365), ("4h", 6 * 365), ("1h", 24 * 365)]:
        px = crypto_bars(rule).loc["2018-08-01":]
        for name, fn in [("C1 Donchian", donchian), ("C3 RSI(2)", rsi2)]:
            r, w = bt.run(fn(px), px.pct_change(), bt.CRYPTO_COST)
            for label, sl in [("Full", slice(None)), ("Out-of-sample 2022+", slice(bt.SPLIT, None))]:
                s = bt.stats(r.loc[sl], w.loc[sl], per)
                # cost drag: what fees took per year
                s["Fees/yr"] = (w.loc[sl].diff().abs().sum(axis=1) * bt.CRYPTO_COST).sum() / (len(r.loc[sl]) / per)
                rows.append({"Strategy": f"{name} {rule} bars", "Period": label, **s})
    return rows


# ---------- B) London breakout ----------
def london_breakout(df, cost=bt.FX_COST):
    """Returns one row per trade: date, side, entry, exit, return (net of cost both sides)."""
    trades = []
    for day, g in df.groupby(df.index.normalize()):
        asia = g[g.index.hour < 7]
        if len(asia) < 6:
            continue
        hi, lo = asia["High"].max(), asia["Low"].min()
        session = g[(g.index.hour >= 7) & (g.index.hour < 16)]
        pos = None
        for t, b in session.iterrows():
            if pos is None:
                if t.hour >= 12:
                    break
                if b["Close"] > hi:
                    pos, entry, stop = 1, b["Close"], lo
                elif b["Close"] < lo:
                    pos, entry, stop = -1, b["Close"], hi
                continue
            # in a trade: stop hit inside this bar? fill at stop, or at the open if it gapped through
            if pos == 1 and b["Low"] <= stop:
                exit_, why = min(stop, b["Open"]), "stop"
            elif pos == -1 and b["High"] >= stop:
                exit_, why = max(stop, b["Open"]), "stop"
            else:
                exit_, why = b["Close"], "time"
                if t.hour < 15:
                    continue
            trades.append({"date": day, "side": pos, "ret": pos * (exit_ / entry - 1) - 2 * cost,
                           "risk": abs(entry - stop) / entry, "exit": why})
            break
    return pd.DataFrame(trades)


def fx_rows():
    rows, summary = [], []
    daily = {}
    for tk, name in FX_PAIRS.items():
        df = fx_hourly(tk, name)
        df = df[df.index.dayofweek < 5]
        t = london_breakout(df)
        daily[name] = t.set_index("date")["ret"]
        summary.append({"Pair": name, "Trades": len(t), "Win rate": (t["ret"] > 0).mean(),
                        "Avg trade": t["ret"].mean(), "Avg R": (t["ret"] / t["risk"]).mean(),
                        "Stopped out": (t["exit"] == "stop").mean(),
                        "t-stat": t["ret"].mean() / t["ret"].std() * np.sqrt(len(t))})
    d = pd.DataFrame(daily).fillna(0)
    days = pd.bdate_range(d.index.min(), d.index.max())
    port = d.reindex(days).fillna(0).mean(axis=1)          # 1x notional per pair, equal weight
    w = pd.DataFrame({"x": (d.reindex(days).fillna(0) != 0).any(axis=1).astype(float)})
    rows.append({"Strategy": "F4 London breakout (EUR, GBP, JPY)", "Period": f"{days[0].date()} to {days[-1].date()}",
                 **bt.stats(port, w, 252)})
    return rows, pd.DataFrame(summary).set_index("Pair"), port


if __name__ == "__main__":
    pd.set_option("display.width", 220)
    df, out = table(crypto_rows())
    out["Fees/yr"] = df["Fees/yr"].map("{:.1%}".format)
    print(out.to_string(), "\n")
    df.to_csv("intraday_crypto_results.csv")
    rows, summ, port = fx_rows()
    df2, out2 = table(rows)
    print(out2.to_string(), "\n")
    print(summ.to_string(formatters={"Win rate": "{:.0%}".format, "Avg trade": "{:.3%}".format,
                                     "Avg R": "{:.2f}".format, "Stopped out": "{:.0%}".format, "t-stat": "{:.2f}".format}))
    summ.to_csv("london_breakout_trades_summary.csv")
