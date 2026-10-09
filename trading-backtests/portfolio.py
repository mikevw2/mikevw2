"""Step 1: combine C1 (Donchian trend), C3 (RSI2 dip-buy) and F3 (FX mean reversion) into one portfolio.

Each sleeve's asset positions are scaled by a sleeve weight and traded together, so rebalancing costs
are charged on the actual combined positions. Sleeve weights are set monthly from data up to that day.
"""
import numpy as np, pandas as pd
import backtest as bt

START, VOL_TARGET, MAX_LEV = "2019-05-01", 0.15, 5.0
SLEEVES = {"C1 Donchian": bt.crypto_donchian, "C3 RSI(2)": bt.crypto_rsi2, "F3 FX mean rev": bt.fx_meanrev}
FX_PAIRS = ["EURGBP", "AUDNZD", "EURCHF"]

idx = bt.cpx.index   # calendar days; FX has no weekend returns
rets = pd.concat([bt.cret[["BTC", "ETH"]], bt.fx_returns(FX_PAIRS).reindex(idx).fillna(0)], axis=1)
cost = pd.Series({"BTC": bt.CRYPTO_COST, "ETH": bt.CRYPTO_COST, **{p: bt.FX_CROSS_COST for p in FX_PAIRS}})

sleeve_r, sleeve_w = {}, {}
for name, fn in SLEEVES.items():
    r, w = fn()
    w = w.reindex(idx).ffill().fillna(0)          # FX positions persist over weekends
    sleeve_w[name] = w
    sleeve_r[name] = (w.shift(1) * rets[w.columns]).sum(axis=1)   # gross, for sizing only
sleeve_r = pd.DataFrame(sleeve_r)


def monthly(x):
    """Hold month-end values for the following month (decided at close, used from next day)."""
    me = x.index.to_series().groupby(x.index.to_period("M")).last()
    return x.loc[me].reindex(x.index).ffill()


def combine(sw):
    """sw: sleeve weights over time. Returns net daily return and combined asset weights."""
    w = pd.concat([sleeve_w[s].mul(sw[s], axis=0) for s in SLEEVES], axis=1).T.groupby(level=0).sum().T
    return bt.run(w, rets[w.columns], cost)


# expanding-window vol: a rolling window collapses to ~0 when a sleeve sits flat for months
vol = sleeve_r.expanding(min_periods=180).std() * np.sqrt(365)
ones = pd.DataFrame(1 / 3, index=idx, columns=list(SLEEVES))
inv = (1 / vol).div((1 / vol).sum(axis=1), axis=0)
port_vol = (sleeve_r * inv.shift(1)).sum(axis=1).expanding(min_periods=180).std() * np.sqrt(365)
scale = (VOL_TARGET / port_vol).clip(upper=MAX_LEV)

variants = {"Equal capital (1/3 each)": monthly(ones),
            "Risk parity (inverse vol)": monthly(inv),
            f"Risk parity, {VOL_TARGET:.0%} vol target": monthly(inv.mul(scale, axis=0)).clip(upper=MAX_LEV)}

if __name__ == "__main__":
    pd.set_option("display.width", 200)
    print("Daily return correlation of sleeves (2019-05+):")
    print(sleeve_r.loc[START:].corr().round(2).to_string(), "\n")
    rows, curves = [], {}
    for name, sw in variants.items():
        r, w = combine(sw.fillna(0))
        r, w = r.loc[START:], w.loc[START:]
        curves[name] = (1 + r).cumprod()
        for label, sl in [("Full", slice(None)), ("In-sample", slice(None, bt.SPLIT)), ("Out-of-sample 2022+", slice(bt.SPLIT, None))]:
            rows.append({"Portfolio": name, "Period": label, **bt.stats(r.loc[sl], w.loc[sl], 365)})
        avg = sw.loc[START:].mean()
        print(f"{name}: avg sleeve weights " + ", ".join(f"{k} {v:.2f}" for k, v in avg.items()))
    # individual sleeves over the same window, for comparison
    for s in SLEEVES:
        r, w = combine(pd.DataFrame({k: float(k == s) for k in SLEEVES}, index=idx))
        r, w = r.loc[START:], w.loc[START:]
        for label, sl in [("Full", slice(None)), ("Out-of-sample 2022+", slice(bt.SPLIT, None))]:
            rows.append({"Portfolio": f"  (alone) {s}", "Period": label, **bt.stats(r.loc[sl], w.loc[sl], 365)})
    r = bt.cret["BTC"].loc[START:]
    for label, sl in [("Full", slice(None)), ("Out-of-sample 2022+", slice(bt.SPLIT, None))]:
        rows.append({"Portfolio": "  (benchmark) BTC buy & hold", "Period": label,
                     **bt.stats(r.loc[sl], pd.DataFrame({"BTC": 1.0}, index=r.loc[sl].index), 365)})
    curves["BTC buy & hold"] = (1 + r).cumprod()
    df = pd.DataFrame(rows).set_index(["Portfolio", "Period"])
    fmt = {"CAGR": "{:.1%}", "Vol": "{:.1%}", "Sharpe": "{:.2f}", "MaxDD": "{:.1%}", "Exposure": "{:.0%}", "Trades/yr": "{:.0f}"}
    out = df.copy()
    for k, f in fmt.items():
        out[k] = df[k].map(f.format)
    print("\n" + out.drop(columns=["Trades/yr"]).to_string())
    df.to_csv("portfolio_results.csv")
    pd.DataFrame(curves).to_csv("portfolio_curves.csv")
