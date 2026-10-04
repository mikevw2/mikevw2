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

### 3. Agent-driven on your Mac, controlled from the iPad over SSH (Termius)

Claude Code runs on your Mac, and the iPad is your terminal into it. Unlike a cloud
session, it can run for as long as you like, and it keeps running after you close
Termius. (Ubuntu/Debian Linux works the same way.)

**Part A: at the Mac, once (about 10 minutes)**

1. **Turn on SSH:** *System Settings → General → Sharing → Remote Login* → on.
2. Open **Terminal** and run the installer:
   ```sh
   curl -fsSL https://raw.githubusercontent.com/mikevw2/mikevw2/claude/karpathy-auto-loops-khzzst/autoresearch-ipad/remote/setup.sh | bash
   ```
   It installs Python + NumPy (in `~/mikevw2/autoresearch-ipad/.venv`) and Claude Code,
   clones this repo to `~/mikevw2`, and downloads the data. If it asks you to install the
   command line developer tools, accept, then run it again.
3. **Log in to Claude Code here, at the Mac**, where the browser opens normally:
   ```sh
   ~/.local/bin/claude
   ```
   Finish the login, then type `/exit`. Logging in at the Mac avoids macOS Keychain
   problems that can happen when logging in over SSH.
4. **Note what Termius needs:**
   ```sh
   whoami                  # your username
   ipconfig getifaddr en0  # the Mac's Wi-Fi IP address, e.g. 192.168.1.23
   ```
5. **Stop the Mac from sleeping** while it's plugged in: *System Settings → Battery
   (or Energy) → Options → "Prevent automatic sleeping when the display is off"* on.
   (`start.sh` also runs `caffeinate`.) A MacBook needs its lid open, or an external
   display attached.

**Part B: from the iPad, every time**

1. **Termius:** *Hosts → +* → address = the IP from step 4, username = `whoami`, and your
   Mac login password → connect.
2. **Start (or reattach to) the agent:**
   ```sh
   bash ~/mikevw2/autoresearch-ipad/remote/start.sh
   ```
   It opens Claude Code on `program.md`. Confirm the run tag when it asks, and it loops,
   about 50 experiments an hour.
3. **Leave it running:** press `Ctrl-b` then `d` to detach, then close Termius. On a Mac
   without tmux it uses the built-in `screen`, where it's `Ctrl-a` then `d`. **Check in
   later:** run `start.sh` again and it reattaches.
4. **Stop it:** reattach, press `Esc`, and type `/exit`.

**Away from home?** The IP above only works on your Wi-Fi. Install **Tailscale** (free) on
the Mac and the iPad, and use the Mac's Tailscale address in Termius instead.

**What the agent is allowed to do without asking**
(`autoresearch-ipad/.claude/settings.json`): edit `train.py`, run `python run.py`,
read logs, and `git add`/`commit` on its own branch. It's blocked from `git push`, `rm`,
`pip`, and editing `prepare.py`/`run.py`. Anything else pops up a prompt, which will
wait until you reattach and answer. When you're happy with a run, push its branch
yourself: `git push -u origin autoresearch/<tag>`.

**If something goes wrong**
- *`claude: command not found`*: run `~/.local/bin/claude`, or open a new Termius tab.
- *Claude Code says you're not logged in, or mentions the keychain, over SSH*: run
  `security unlock-keychain ~/Library/Keychains/login.keychain-db` (asks for your Mac
  password), then `start.sh` again. Or redo Part A step 3 at the Mac.
- *Termius can't connect*: check that Remote Login is on, the Mac is awake, and you're
  on the same Wi-Fi (or both on Tailscale).

## Notes

- **Results aren't comparable across devices.** The budget is wall-clock time, so a faster
  machine trains for more steps. An M5 iPad and a cloud container will find different "best"
  models. Compare runs only on the same device.
- **Noise:** the step count varies with machine load, so the same code scores differently each run: about ±0.005 bpb once the LR warmdown is on, and up to ±0.04 with the constant-LR baseline. Treat small "improvements" with suspicion.
- **Footprint:** the baseline peaks at about 90 MB of RAM, far below what iPadOS allows one app.
- **Starting point:** `train.py` is the winner of a 40-experiment agent run in a cloud
  container (val_bpb 2.57 → 2.18). Each improvement is a commit on the `autoresearch/oct3`
  branch. On a new device, the first run re-measures the baseline, because scores
  depend on the hardware.
