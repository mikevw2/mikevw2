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
| `remote/` | nobody | `setup.sh` + `start.sh` to run the agent loop on your own Mac/Linux machine, driven from the iPad over SSH (Termius). |

The default data is Tiny Shakespeare (1.1 MB). To train on your own text instead, put
any plain-text file at `data/input.txt` before starting a run.

## Three ways to run it

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

### 3. Agent-driven on your own machine, controlled from the iPad over SSH (Termius)

Claude Code runs on a Mac or Linux machine you own or rent, and the iPad is your
terminal into it. Unlike a cloud session, it can run for as long as you like, and it
keeps running in `tmux` after you close Termius.

**You need a host to connect to.** One of:
- **A Mac at home:** *System Settings → General → Sharing → Remote Login* → on. Connect
  to its local IP (or install Tailscale on the Mac and the iPad to reach it from anywhere).
- **A Linux server:** any Ubuntu/Debian box, or a small cloud VPS (2–4 vCPU is plenty;
  this is CPU-only).

**In Termius:** *Hosts → +* → address (IP or hostname), username, password or SSH key → connect.

**On the host, once:**
```sh
curl -fsSL https://raw.githubusercontent.com/mikevw2/mikevw2/claude/karpathy-auto-loops-khzzst/autoresearch-ipad/remote/setup.sh | bash
```
This installs git, tmux, Python + NumPy (in `autoresearch-ipad/.venv`) and Claude Code,
clones this repo to `~/mikevw2`, and downloads the data. It's safe to re-run.

**Start the agent:**
```sh
bash ~/mikevw2/autoresearch-ipad/remote/start.sh
```
- The first time, Claude Code shows a login URL. Open it in Safari on the iPad, approve,
  and paste the code back into Termius.
- It then starts on `program.md` by itself. Confirm the run tag when it asks, and it loops.
- **Leave it running:** press `Ctrl-b` then `d` to detach, then close Termius.
  **Check in later:** run `start.sh` again and it reattaches.
- **Stop it:** reattach and press `Esc`, or run `tmux kill-session -t autoresearch`.

**What the agent is allowed to do without asking**
(`autoresearch-ipad/.claude/settings.json`): edit `train.py`, run `python3 run.py`,
read logs, and `git add`/`commit` on its own branch. It's blocked from `git push`, `rm`,
`pip`, and editing `prepare.py`/`run.py`. Anything else pops up a prompt, which will
wait until you reattach and answer. When you're happy with a run, push its branch
yourself: `git push -u origin autoresearch/<tag>`.

## Notes

- **Results aren't comparable across devices.** The budget is wall-clock time, so a faster
  machine trains for more steps. An M5 iPad and a cloud container will find different "best"
  models. Compare runs only on the same device.
- **Noise:** the step count varies with machine load, so the same code scores differently each run: about ±0.005 bpb once the LR warmdown is on, and up to ±0.04 with the constant-LR baseline. Treat small "improvements" with suspicion.
- **Footprint:** the baseline peaks at about 90 MB of RAM, far below what iPadOS allows one app.
- **Baseline** (this cloud container): about 36k steps in 60 s, val_bpb ≈ 2.61.
  Three random-search steps (lower LR, larger batch) got it to ≈ 2.49.
