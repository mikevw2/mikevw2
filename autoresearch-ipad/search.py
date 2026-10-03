"""
Agent-free research loop for running on-device (e.g. an iPad in a-Shell).
Without an AI agent there is no one to invent new ideas, so this does the
dumbest useful thing: mutate one hyperparameter in train.py at random, run the
experiment via run.py, keep it if val_bpb improved, otherwise revert. Repeat.

Usage: python search.py        # loop until stopped (Ctrl-C)
       python search.py 20     # run 20 experiments
"""

import ast
import os
import random
import re
import sys

from prepare import CTX_MAX
from run import TRAIN, read_results, run_experiment

BLOCK = re.compile(r"# --- hyperparameters.*?\n(.*?)# --- end hyperparameters ---", re.S)
LINE = re.compile(r"^([A-Z_]+)\s*=\s*([^#\n]+?)(\s*#.*)?$", re.M)

CHOICES = {
    "ACTIVATION": ["tanh", "relu"],
    "WEIGHT_DECAY": [0.0, 0.01, 0.03, 0.1],
    "WARMDOWN_RATIO": [0.0, 0.2, 0.4, 0.6, 0.8],
    "N_LAYERS": [1, 2, 3],
}
LIMITS = {"CONTEXT": (1, CTX_MAX), "BATCH_SIZE": (8, 4096), "HIDDEN": (8, 4096), "EMB_DIM": (2, 256)}
FACTORS = [0.5, 0.7, 1.4, 2.0]


def read_hyperparams(src):
    block = BLOCK.search(src).group(1)
    return {m.group(1): ast.literal_eval(m.group(2).strip()) for m in LINE.finditer(block)}


def mutate(name, value):
    if name in CHOICES:
        options = [c for c in CHOICES[name] if c != value]
        return random.choice(options)
    new = value * random.choice(FACTORS)
    if isinstance(value, int):
        new = int(round(new))
        lo, hi = LIMITS.get(name, (1, 10**9))
        new = min(max(new, lo), hi)
        if new == value:
            new = min(max(value + random.choice([-1, 1]), lo), hi)
    else:
        new = float(f"{new:.3g}")
    return new


def write_hyperparam(src, name, value):
    pattern = re.compile(rf"^({name}\s*=\s*)([^#\n]+?)(\s*#.*)?$", re.M)
    return pattern.sub(lambda m: f"{m.group(1)}{value!r}{m.group(3) or ''}", src, count=1)


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else None
    if not read_results():
        run_experiment("baseline")
    i = 0
    while n is None or i < n:
        with open(TRAIN) as f:
            src = f.read()
        hps = {k: v for k, v in read_hyperparams(src).items() if isinstance(v, (int, float, str))}
        name = random.choice(sorted(hps))
        old, new = hps[name], mutate(name, hps[name])
        if new == old:
            continue
        with open(TRAIN, "w") as f:
            f.write(write_hyperparam(src, name, new))
        run_experiment(f"search: {name} {old!r} -> {new!r}")
        i += 1


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
