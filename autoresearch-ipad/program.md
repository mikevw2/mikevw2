# autoresearch-ipad

This is an experiment to have the LLM do its own research. It is a scaled-down
port of [karpathy/autoresearch](https://github.com/karpathy/autoresearch): a
byte-level language model in pure NumPy, trained for a fixed 60 seconds on CPU,
so the whole loop also runs on an iPad.

## Setup

To set up a new experiment, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `oct3`).
   If git is available, create a branch `autoresearch/<tag>` from the current
   branch. (On an iPad there may be no git — that's fine, `run.py` keeps its own
   history.)
2. **Read the in-scope files** for full context:
   - `README.md` — repository context.
   - `prepare.py` — fixed constants, data loading, the evaluation metric. Do not modify.
   - `train.py` — the file you modify. Model, optimizer, training loop.
   - `run.py` — runs one experiment and does keep/discard bookkeeping. Do not modify.
3. **Verify data exists**: `data/input.txt` must exist. If not, run `python prepare.py`.
4. **Check for a previous run**: if `results.tsv` already exists, read it — you are
   continuing that run, and `best/train.py` is the current best. Otherwise the first
   experiment is the baseline.
5. **Confirm and go**.

## Experimentation

Each experiment trains for a **fixed time budget of 60 seconds** of wall-clock time
(plus a few seconds of evaluation) on CPU. You launch it with:

```
python run.py "short description of the idea" > run.log 2>&1
```

**What you CAN do:**
- Modify `train.py` — the only file you edit. Everything is fair game: architecture
  (layers, residual connections, normalization, attention, convolutions, gating),
  the optimizer, the LR schedule, initialization, batch size, model size, context length.

**What you CANNOT do:**
- Modify `prepare.py` or `run.py`. They are the fixed harness and the ground-truth metric.
- Add dependencies. Only the Python standard library and NumPy are available —
  the code must keep running on an iPad (no PyTorch, no `subprocess`, no compiled extensions).
- Change how `main()` reports results: it must return a dict with `val_bpb` and `num_steps`.

**The goal is simple: get the lowest val_bpb** (validation bits per byte). The model
receives up to `CTX_MAX` = 64 bytes of context at eval time and may use any of it.

**Memory** is a soft constraint. Keep peak RAM under ~2 GB so it stays well inside
what iPadOS gives a single app.

**Speed matters.** Because the budget is wall-clock, a cheaper step means more steps.
NumPy is fastest with large matrix multiplies and slowest with Python loops — vectorize.

**Simplicity criterion**: all else being equal, simpler is better. A tiny improvement
that adds ugly complexity is not worth it. Removing code and getting equal or better
results is a win. Run-to-run noise is real: the wall-clock budget means the step count
varies with machine load. Expect about ±0.005 bpb with an LR warmdown and much more
(±0.04 seen) without one, so treat small "improvements" with suspicion and re-run a
promising result before building on it.

**The first run**: always establish the baseline by running `train.py` unchanged.

## Output

`train.py` prints a summary at the end:

```
---
val_bpb:          2.345678
training_seconds: 60.001234
total_seconds:    61.234567
num_steps:        12345
num_params_K:     73.536000
final_train_loss: 1.623456
```

`run.py` then prints one line you can grep for:

```
grep "^=== result" run.log
```

## Bookkeeping (handled for you by run.py)

- Every attempt is saved to `history/NNNN.py` before it runs.
- **keep** — val_bpb beat the best so far → `train.py` is copied to `best/train.py`.
- **discard** — no improvement → `train.py` is restored from `best/train.py`.
- **crash** — exception → `train.py` is restored; the traceback is in `run.log`.
  If it was something dumb (typo, shape bug), copy `history/NNNN.py` back over
  `train.py`, fix it, and re-run. If the idea is fundamentally broken, move on.
- Results are appended to `results.tsv` (tab-separated):
  `exp  val_bpb  steps  status  description`.

If git is available, after each **keep** commit `train.py` with the description as the
message, so the branch history is the chain of improvements. Don't commit `results.tsv`,
`best/`, `history/` or `run.log` (they're gitignored).

## The experiment loop

LOOP FOREVER:

1. Look at `results.tsv` and the current `train.py` (which is always the best version).
2. Pick an idea and edit `train.py`.
3. `python run.py "<description>" > run.log 2>&1`
4. `grep "^=== result" run.log` — if it says CRASH, `tail -n 40 run.log` for the traceback.
5. If KEEP and git is available, commit.
6. Repeat.

**NEVER STOP**: once the loop has begun, do NOT pause to ask the human whether to
continue. They may be asleep or away and expect you to keep working until manually
stopped. If you run out of ideas, think harder: re-read `train.py`, combine near-misses
from `results.tsv`, try more radical architectures (e.g. a residual MLP, layer norm, a
small attention layer over the context, a convolution over bytes), or simplify.

At 60 seconds per experiment you can run roughly 50 per hour.
