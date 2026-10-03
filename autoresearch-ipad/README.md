# autoresearch-ipad

A scaled-down port of Karpathy's [autoresearch](https://github.com/karpathy/autoresearch)
that runs on an iPad (built for an iPad Pro M5, 16 GB), a laptop or a cloud container.
No GPU, no PyTorch: just Python + NumPy.

The idea is the same as the original. There is a small but real language-model training
setup, and a loop that keeps changing it: edit `train.py` → train for a fixed **60 seconds**
→ score it → keep the change if the score improved, otherwise revert → repeat. You come
back to a log of experiments and (hopefully) a better model.

## What's in here

| File | Edited by | What it is |
|---|---|---|
| `prepare.py` | nobody | Fixed constants (60 s budget, eval size), data download, and the metric: **val_bpb** (validation bits per byte, lower is better). |
| `train.py` | the loop | A byte-level neural language model (embeddings → MLP → next-byte prediction) with hand-written backprop and AdamW, in pure NumPy. Everything in it is fair game. |
| `run.py` | nobody | Runs one experiment and does the bookkeeping: snapshot to `history/`, train, score, keep (→ `best/`) or revert, append to `results.tsv`. No git and no subprocesses, so it works on iPadOS. |
| `search.py` | nobody | The **on-device loop** with no AI agent: mutates one hyperparameter at random, runs it, keeps or reverts. |
| `program.md` | you | Instructions for an **AI agent** (e.g. Claude Code) to run the loop and invent real ideas: new architectures, optimizers, schedules. |

The default data is Tiny Shakespeare (1.1 MB). To train on your own text instead, put
any plain-text file at `data/input.txt` before starting a run.

## Two ways to run it

### 1. On the iPad itself: `search.py` (no agent)

iPadOS can't run a coding agent locally, so the on-device loop is a simple random
search over the hyperparameters in `train.py`. It's still a real keep/revert loop and
runs entirely on the iPad's CPU.

1. Install **a-Shell** (free, App Store). It ships with Python 3 and NumPy.
2. In a-Shell, download the files:
   ```sh
   mkdir autoresearch-ipad && cd autoresearch-ipad
   B=https://raw.githubusercontent.com/mikevw2/mikevw2/main/autoresearch-ipad
   for f in prepare.py train.py run.py search.py program.md; do curl -sLO $B/$f; done
   ```
   (Until this is merged to `main`, replace `main` with `claude/karpathy-auto-loops-khzzst`.)
3. One-time data download:
   ```sh
   python3 prepare.py
   ```
4. Start the loop. Each experiment takes about a minute:
   ```sh
   python3 search.py        # runs until you stop it
   python3 search.py 30     # or a fixed number of experiments
   ```
5. Check the results at any time:
   ```sh
   cat results.tsv
   ```

**Keep it running:** iPadOS pauses apps in the background. Keep a-Shell in the foreground,
plug in the iPad, and set *Settings → Display & Brightness → Auto-Lock → Never* for an
overnight run. If it gets interrupted, just start `search.py` again: it picks up
from `results.tsv` and `best/train.py`.

Pythonista and Carnets should also work (NumPy only, no subprocesses), but a-Shell is
the tested path.

### 2. Agent-driven: Claude Code, started from the iPad

This is the real autoresearch experience: an AI agent reads `program.md` and invents its
own experiments, not just random tweaks. Claude Code doesn't run *on* the iPad. Start a
Claude Code cloud session on this repository from the Claude app (it runs in a cloud
container) and prompt:

```
Have a look at autoresearch-ipad/program.md and let's kick off a new experiment!
Install numpy first if it's missing, then do the setup.
```

The agent creates an `autoresearch/<tag>` branch and commits each improvement. When it's
done, you can copy the winning `train.py` onto the iPad and run it there.

## Notes

- **Results aren't comparable across devices.** The budget is wall-clock time, so a faster
  machine trains for more steps. An M5 iPad and a cloud container will find different "best"
  models. Compare runs only on the same device.
- **Noise:** the step count varies with machine load, so the same code scores differently each run: about ±0.005 bpb once the LR warmdown is on, and up to ±0.04 with the constant-LR baseline. Treat small "improvements" with suspicion.
- **Footprint:** the baseline peaks at about 90 MB of RAM, far below what iPadOS allows one app.
- **Baseline** (this cloud container): about 36k steps in 60 s, val_bpb ≈ 2.61.
  Three random-search steps (lower LR, larger batch) got it to ≈ 2.49.
