"""
Byte-level neural language model in pure NumPy. This is the file that gets
edited and iterated on by the research loop -- everything here is fair game.
Usage: python train.py   (or let run.py run it and keep/discard the result)
"""

import time

import numpy as np

from prepare import CTX_MAX, TIME_BUDGET, VOCAB_SIZE, evaluate_bpb, load_splits

# --- hyperparameters (search.py edits these) ---
CONTEXT = 8             # bytes of context the model looks at (<= CTX_MAX)
EMB_DIM = 16            # embedding size per byte
HIDDEN = 512            # hidden layer width
N_LAYERS = 2            # number of hidden layers
ACTIVATION = "relu"     # "tanh" or "relu"
BATCH_SIZE = 512        # examples per optimizer step
LR = 0.004              # peak learning rate (AdamW)
WEIGHT_DECAY = 0.02     # decoupled weight decay on matrices
WARMDOWN_RATIO = 0.5    # fraction of the time budget spent decaying LR to 0
# --- end hyperparameters ---

ADAM_BETAS = (0.9, 0.999)
SEED = 1337

# ---------------------------------------------------------------------------
# Model: embed CONTEXT bytes -> concat -> MLP -> logits over 256 bytes
# ---------------------------------------------------------------------------

def init_params(rng):
    p = {"emb": rng.randn(VOCAB_SIZE, EMB_DIM)}
    fan_in = CONTEXT * EMB_DIM
    for i in range(N_LAYERS):
        p[f"W{i}"] = rng.randn(fan_in, HIDDEN) / np.sqrt(fan_in)
        p[f"b{i}"] = np.zeros(HIDDEN)
        fan_in = HIDDEN
    p["Wout"] = rng.randn(fan_in, VOCAB_SIZE) / np.sqrt(fan_in) * 0.1
    p["bout"] = np.zeros(VOCAB_SIZE)
    return {k: v.astype(np.float32) for k, v in p.items()}


def act(z):
    return np.tanh(z) if ACTIVATION == "tanh" else np.maximum(z, 0)


def act_grad(z, a):
    return 1 - a * a if ACTIVATION == "tanh" else (z > 0).astype(z.dtype)


def forward(p, X):
    """X: int array [B, CONTEXT]. Returns logits [B, 256] and a cache for backward."""
    h = p["emb"][X].reshape(len(X), -1)
    hs, zs = [h], []
    for i in range(N_LAYERS):
        z = h @ p[f"W{i}"] + p[f"b{i}"]
        h = act(z)
        zs.append(z)
        hs.append(h)
    logits = h @ p["Wout"] + p["bout"]
    return logits, (X, hs, zs)


def loss_and_grads(p, X, Y):
    logits, (X, hs, zs) = forward(p, X)
    B = len(X)
    logits = logits - logits.max(axis=1, keepdims=True)
    probs = np.exp(logits)
    probs /= probs.sum(axis=1, keepdims=True)
    loss = -np.log(probs[np.arange(B), Y] + 1e-12).mean()

    g = {}
    dlogits = probs
    dlogits[np.arange(B), Y] -= 1
    dlogits /= B
    g["Wout"] = hs[-1].T @ dlogits
    g["bout"] = dlogits.sum(axis=0)
    dh = dlogits @ p["Wout"].T
    for i in reversed(range(N_LAYERS)):
        dz = dh * act_grad(zs[i], hs[i + 1])
        g[f"W{i}"] = hs[i].T @ dz
        g[f"b{i}"] = dz.sum(axis=0)
        dh = dz @ p[f"W{i}"].T
    Xf, dhf = X.reshape(-1), dh.reshape(-1, EMB_DIM)
    g["emb"] = np.stack([np.bincount(Xf, weights=dhf[:, j], minlength=VOCAB_SIZE)
                         for j in range(EMB_DIM)], axis=1).astype(np.float32)
    return loss, g

# ---------------------------------------------------------------------------
# Optimizer
# ---------------------------------------------------------------------------

class AdamW:
    def __init__(self, params, betas=ADAM_BETAS, eps=1e-8):
        self.b1, self.b2 = betas
        self.eps = eps
        self.t = 0
        self.m = {k: np.zeros_like(v) for k, v in params.items()}
        self.v = {k: np.zeros_like(v) for k, v in params.items()}

    def step(self, params, grads, lr):
        self.t += 1
        c1 = 1 - self.b1 ** self.t
        c2 = 1 - self.b2 ** self.t
        for k in params:
            g = grads[k]
            self.m[k] = self.b1 * self.m[k] + (1 - self.b1) * g
            self.v[k] = self.b2 * self.v[k] + (1 - self.b2) * g * g
            update = (self.m[k] / c1) / (np.sqrt(self.v[k] / c2) + self.eps)
            if params[k].ndim >= 2:
                update = update + WEIGHT_DECAY * params[k]
            params[k] -= (lr * update).astype(np.float32)


def lr_at(progress):
    if WARMDOWN_RATIO > 0 and progress > 1 - WARMDOWN_RATIO:
        return LR * (1 - progress) / WARMDOWN_RATIO
    return LR

# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def main():
    t0 = time.time()
    assert 1 <= CONTEXT <= CTX_MAX, "CONTEXT must be between 1 and CTX_MAX"
    train, _ = load_splits()
    rng = np.random.RandomState(SEED)
    params = init_params(rng)
    opt = AdamW(params)
    num_params = sum(v.size for v in params.values())
    offsets = np.arange(-CONTEXT, 0)

    steps, loss, next_report = 0, float("nan"), 0.1
    t_train = time.time()
    while True:
        progress = (time.time() - t_train) / TIME_BUDGET
        if progress >= 1:
            break
        ix = rng.randint(CONTEXT, len(train), BATCH_SIZE)
        X = train[ix[:, None] + offsets].astype(np.int64)
        Y = train[ix]
        loss, grads = loss_and_grads(params, X, Y)
        if not np.isfinite(loss):
            raise FloatingPointError(f"loss diverged at step {steps}")
        opt.step(params, grads, lr_at(progress))
        steps += 1
        if progress >= next_report:
            print(f"step {steps:6d} | {progress:4.0%} | loss {loss:.4f}", flush=True)
            next_report += 0.1
    training_seconds = time.time() - t_train

    val_bpb = evaluate_bpb(lambda ctx: forward(params, ctx[:, -CONTEXT:])[0])
    result = {
        "val_bpb": val_bpb,
        "training_seconds": training_seconds,
        "total_seconds": time.time() - t0,
        "num_steps": steps,
        "num_params_K": num_params / 1e3,
        "final_train_loss": float(loss),
    }
    print("---")
    for k, v in result.items():
        print(f"{k + ':':18s}{v:.6f}" if isinstance(v, float) else f"{k + ':':18s}{v}")
    return result


if __name__ == "__main__":
    main()
