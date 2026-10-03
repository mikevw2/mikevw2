"""
Runs one experiment and does the bookkeeping: snapshot -> train -> score ->
keep or discard -> log. Works without git and without subprocesses, so it runs
on iPadOS (a-Shell, Pythonista, Carnets) as well as on a laptop or in the cloud.

Usage: python run.py "short description of what this experiment tries"

- keep:    val_bpb beat the best so far; train.py is saved to best/train.py
- discard: no improvement; train.py is restored from best/train.py
- crash:   exception; train.py is restored (the attempt is kept in history/)
"""

import importlib.util
import math
import os
import shutil
import sys
import time
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
TRAIN = os.path.join(HERE, "train.py")
BEST = os.path.join(HERE, "best", "train.py")
HISTORY = os.path.join(HERE, "history")
RESULTS = os.path.join(HERE, "results.tsv")
COLUMNS = ["exp", "val_bpb", "steps", "status", "description"]


def read_results():
    if not os.path.exists(RESULTS):
        return []
    with open(RESULTS) as f:
        lines = f.read().splitlines()[1:]
    return [dict(zip(COLUMNS, line.split("\t"))) for line in lines if line.strip()]


def best_bpb(rows):
    kept = [float(r["val_bpb"]) for r in rows if r["status"] == "keep"]
    return min(kept) if kept else None


def load_train_module():
    # Load train.py fresh each time (a new module name avoids stale imports).
    if HERE not in sys.path:
        sys.path.insert(0, HERE)
    spec = importlib.util.spec_from_file_location(f"train_{time.time_ns()}", TRAIN)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_experiment(description):
    description = " ".join(description.split()) or "no description"
    rows = read_results()
    exp = f"{len(rows):04d}"
    os.makedirs(HISTORY, exist_ok=True)
    shutil.copy(TRAIN, os.path.join(HISTORY, f"{exp}.py"))
    print(f"=== experiment {exp}: {description}", flush=True)

    val_bpb, steps = None, 0
    try:
        result = load_train_module().main()
        val_bpb, steps = float(result["val_bpb"]), int(result["num_steps"])
    except Exception:
        traceback.print_exc()

    best = best_bpb(rows)
    if val_bpb is None or not math.isfinite(val_bpb):
        status = "crash"
    elif best is None or val_bpb < best:
        status = "keep"
    else:
        status = "discard"

    if status == "keep":
        os.makedirs(os.path.dirname(BEST), exist_ok=True)
        shutil.copy(TRAIN, BEST)
    elif os.path.exists(BEST):
        shutil.copy(BEST, TRAIN)

    if not os.path.exists(RESULTS):
        with open(RESULTS, "w") as f:
            f.write("\t".join(COLUMNS) + "\n")
    with open(RESULTS, "a") as f:
        bpb_str = f"{val_bpb:.6f}" if status != "crash" else "0.000000"
        f.write(f"{exp}\t{bpb_str}\t{steps}\t{status}\t{description}\n")

    best_str = f"{best:.6f}" if best is not None else "none"
    print(f"=== result {exp}: {status.upper()} | val_bpb {val_bpb} | previous best {best_str}")
    if status != "keep" and os.path.exists(BEST):
        print(f"=== train.py restored from best/ (attempt saved as history/{exp}.py)")
    return status, val_bpb


if __name__ == "__main__":
    run_experiment(" ".join(sys.argv[1:]))
