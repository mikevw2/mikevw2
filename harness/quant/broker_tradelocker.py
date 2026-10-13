"""TradeLocker adapter. Demo-first by construction.

Credentials come from environment variables, never from files in the repo or from chat:
  TL_ENV       https://demo.tradelocker.com   (live URLs are refused unless risk.yaml live_enabled)
  TL_USERNAME  account email
  TL_PASSWORD  account password
  TL_SERVER    server name shown in the TradeLocker login dialog

Usage:
  python -m quant.broker_tradelocker status      # auth + account snapshot (read-only)
  python -m quant.broker_tradelocker instruments BTC  # search instruments
"""
from __future__ import annotations
import json
import os
import sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]


def _risk():
    return yaml.safe_load((ROOT / "data" / "risk.yaml").read_text())


def connect():
    env, user, pw, server = (os.environ.get(k) for k in ("TL_ENV", "TL_USERNAME", "TL_PASSWORD", "TL_SERVER"))
    missing = [k for k, v in zip(("TL_ENV", "TL_USERNAME", "TL_PASSWORD", "TL_SERVER"), (env, user, pw, server)) if not v]
    if missing:
        raise SystemExit(f"TradeLocker credentials not set in the environment: {', '.join(missing)}. "
                         "Add them under the cloud environment's secrets/variables; a new session picks them up.")
    if "demo" not in env and not _risk().get("live_enabled"):
        raise SystemExit(f"TL_ENV={env} is not a demo environment and data/risk.yaml live_enabled is false. Refusing.")
    from tradelocker import TLAPI  # imported lazily so the rest of quant works without it
    return TLAPI(environment=env, username=user, password=pw, server=server)


def status(tl):
    out = {"environment": os.environ.get("TL_ENV")}
    for name in ("get_account_state", "get_all_accounts", "get_all_positions", "get_all_orders"):
        fn = getattr(tl, name, None)
        if fn is None:
            continue
        try:
            v = fn()
            out[name] = v.to_dict(orient="records") if hasattr(v, "to_dict") else v
        except Exception as e:  # report, don't crash: this is a read-only probe
            out[name] = f"error: {type(e).__name__}: {e}"
    return out


def instruments(tl, query=""):
    df = tl.get_all_instruments()
    if query:
        df = df[df.apply(lambda r: query.lower() in str(r.to_dict()).lower(), axis=1)]
    cols = [c for c in ("tradableInstrumentId", "name", "type", "tradingExchange") if c in df.columns]
    return df[cols].head(50).to_dict(orient="records")


def main(argv):
    cmd = argv[0] if argv else "status"
    tl = connect()
    if cmd == "status":
        print(json.dumps(status(tl), indent=2, default=str))
    elif cmd == "instruments":
        print(json.dumps(instruments(tl, argv[1] if len(argv) > 1 else ""), indent=2, default=str))
    else:
        raise SystemExit("commands: status | instruments [query]")


if __name__ == "__main__":
    main(sys.argv[1:])
