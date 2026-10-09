import pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
eq = pd.read_csv("portfolio_curves.csv", index_col=0, parse_dates=True)
C = {"Equal capital (1/3 each)": "#2a78d6", "Risk parity (inverse vol)": "#1baf7a",
     "Risk parity, 15% vol target": "#eb6834", "BTC buy & hold": "#52514e"}
fig, axes = plt.subplots(2, 1, figsize=(12, 8), facecolor="#fcfcfb", sharex=True, gridspec_kw={"height_ratios": [2, 1]})
for k, c in C.items():
    s = eq[k].dropna()
    bench = k == "BTC buy & hold"
    axes[0].plot(s.index, s, color=c, lw=1.2 if bench else 2, ls="--" if bench else "-", label=k)
    axes[0].annotate(f"{s.iloc[-1]:.1f}×", (s.index[-1], s.iloc[-1]), xytext=(4, 0), textcoords="offset points", fontsize=9, va="center")
    axes[1].plot(s.index, s / s.cummax() - 1, color=c, lw=1.2 if bench else 1.6, ls="--" if bench else "-")
axes[0].set_yscale("log"); axes[0].set_title("Combined portfolio C1 + C3 + F3: growth of $1 (log scale)", loc="left", fontsize=12)
axes[1].set_title("Drawdown from peak", loc="left", fontsize=11)
axes[1].yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0))
for ax in axes:
    ax.axvline(pd.Timestamp("2022-01-01"), color="#52514e", lw=1, ls=":")
    ax.set_facecolor("#fcfcfb"); ax.grid(alpha=0.25); [ax.spines[s].set_visible(False) for s in ("top", "right")]
axes[0].legend(frameon=False, fontsize=9, loc="upper left")
fig.text(0.01, 0.01, "Net of costs. Sleeve weights reset monthly from data available at the time. Dotted line: 2022 out-of-sample split.", fontsize=8.5, color="#52514e")
plt.tight_layout(rect=(0, 0.03, 1, 1)); plt.savefig("portfolio_curves.png", dpi=140)
