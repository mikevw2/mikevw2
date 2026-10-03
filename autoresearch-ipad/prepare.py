"""
Fixed constants, one-time data download, data loading and the evaluation metric.
Do not modify -- this file is the ground truth every experiment is scored against.
Usage (one time): python prepare.py
"""

import math
import os
import urllib.request

import numpy as np

# ---------------------------------------------------------------------------
# Fixed constants
# ---------------------------------------------------------------------------

TIME_BUDGET = 60        # seconds of wall-clock training per experiment
CTX_MAX = 64            # max bytes of context the evaluator hands the model
EVAL_BYTES = 50_000     # number of validation bytes scored
VOCAB_SIZE = 256        # byte-level: every UTF-8 byte is a token
VAL_FRACTION = 0.1      # last 10% of the text is held out for validation

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")
DATA_FILE = os.path.join(DATA_DIR, "input.txt")
DATA_URL = "https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt"

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------

def download():
    if os.path.exists(DATA_FILE):
        print(f"data already present: {DATA_FILE}")
        return
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"downloading {DATA_URL}")
    try:
        with urllib.request.urlopen(DATA_URL, timeout=60) as r:
            raw = r.read()
    except Exception as e:
        raise SystemExit(
            f"download failed ({e}).\n"
            f"Put any plain-text file (1MB+ recommended) at {DATA_FILE} and re-run."
        )
    with open(DATA_FILE, "wb") as f:
        f.write(raw)
    print(f"saved {len(raw):,} bytes to {DATA_FILE}")


def load_splits():
    """Returns (train, val) as uint8 numpy arrays of raw bytes."""
    if not os.path.exists(DATA_FILE):
        raise SystemExit(f"missing {DATA_FILE} -- run `python prepare.py` first")
    with open(DATA_FILE, "rb") as f:
        data = np.frombuffer(f.read(), dtype=np.uint8)
    n_val = int(len(data) * VAL_FRACTION)
    assert n_val >= CTX_MAX + EVAL_BYTES, "dataset too small for EVAL_BYTES"
    return data[:-n_val], data[-n_val:]

# ---------------------------------------------------------------------------
# Evaluation (the metric)
# ---------------------------------------------------------------------------

def evaluate_bpb(logits_fn, batch_size=4096):
    """
    Validation bits per byte. Lower is better.

    logits_fn(ctx) receives an int array [B, CTX_MAX] holding the CTX_MAX bytes
    preceding each target byte (oldest first) and must return logits [B, 256]
    for the next byte. The model may use as much or as little of the context as
    it likes. Logits are normalized here, so they cannot be gamed.
    """
    _, val = load_splits()
    positions = np.arange(CTX_MAX, CTX_MAX + EVAL_BYTES)
    offsets = np.arange(-CTX_MAX, 0)
    total_nats = 0.0
    for s in range(0, len(positions), batch_size):
        pos = positions[s:s + batch_size]
        ctx = val[pos[:, None] + offsets].astype(np.int64)
        logits = np.asarray(logits_fn(ctx), dtype=np.float64)
        assert logits.shape == (len(pos), VOCAB_SIZE), f"bad logits shape {logits.shape}"
        logits = logits - logits.max(axis=1, keepdims=True)
        logp = logits - np.log(np.exp(logits).sum(axis=1, keepdims=True))
        total_nats -= logp[np.arange(len(pos)), val[pos]].sum()
    bpb = total_nats / len(positions) / math.log(2)
    if not math.isfinite(bpb):
        raise FloatingPointError("val_bpb is not finite")
    return bpb


if __name__ == "__main__":
    download()
    train, val = load_splits()
    print(f"train: {len(train):,} bytes | val: {len(val):,} bytes")
