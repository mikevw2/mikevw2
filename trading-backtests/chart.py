import pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
eq = pd.read_csv("equity_curves.csv", index_col=0, parse_dates=True)
C = ["#2a78d6", "#eb6834", "#1baf7a", "#52514e"]
fig, axes = plt.subplots(1, 2, figsize=(14, 5.5), facecolor="#fcfcfb")
for ax, keys, title, log in [(axes[0], [k for k in eq if k.startswith(("C", "   "))], "Crypto: growth of $1 (log scale), 2018–2026", True),
                             (axes[1], [k for k in eq if k.startswith("F")], "Forex: growth of $1, 2010–2026", False)]:
    for k, c in zip(keys, C):
        s = eq[k].dropna()
        ax.plot(s.index, s / s.iloc[0], color=c, lw=2 if "benchmark" not in k else 1.2,
                ls="-" if "benchmark" not in k else "--", label=k.strip())
        ax.annotate(f"{s.iloc[-1] / s.iloc[0]:.2f}×", (s.index[-1], s.iloc[-1] / s.iloc[0]), xytext=(4, 0),
                    textcoords="offset points", fontsize=9, color="#0b0b0b", va="center")
    if log: ax.set_yscale("log")
    ax.axvline(pd.Timestamp("2022-01-01"), color="#52514e", lw=1, ls=":")
    ax.text(pd.Timestamp("2022-02-01"), 0.02, "out-of-sample →", transform=ax.get_xaxis_transform(), fontsize=9, color="#52514e")
    ax.set_title(title, loc="left", fontsize=12, color="#0b0b0b")
    ax.set_facecolor("#fcfcfb"); ax.grid(alpha=0.25); [ax.spines[s].set_visible(False) for s in ("top", "right")]
    ax.legend(frameon=False, fontsize=9, loc="upper left")
fig.text(0.01, 0.01, "Net of costs: crypto 0.15%/side, FX 1–2 pips/side incl. swap/carry. Daily bars; signals at close, filled next day.", fontsize=8.5, color="#52514e")
plt.tight_layout(rect=(0, 0.03, 1, 1)); plt.savefig("equity_curves.png", dpi=140)
