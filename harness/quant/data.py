"""OHLCV data: Coinbase Exchange public candles with a local CSV cache, resampled on demand.

Coinbase granularities: 60, 300, 900, 3600, 21600, 86400 seconds, max 300 rows per request.
We fetch 1h (or 1d) and resample to 2h/4h/6h/12h locally so every timeframe shares one cache.
"""
from __future__ import annotations
import datetime as dt
import os
import time
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "cache"
BASE_URL = "https://api.exchange.coinbase.com"
GRAN = {"1m": 60, "5m": 300, "15m": 900, "1h": 3600, "6h": 21600, "1d": 86400}
RESAMPLE_FROM = {"2h": "1h", "4h": "1h", "12h": "1h", "1w": "1d"}
PANDAS_RULE = {"2h": "2h", "4h": "4h", "12h": "12h", "1w": "W-MON"}
COLS = ["open", "high", "low", "close", "volume"]


def _session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = "harness-quant/0.1"
    return s


def _utc(ts) -> dt.datetime:
    if isinstance(ts, str):
        ts = pd.Timestamp(ts)
    ts = pd.Timestamp(ts)
    return (ts.tz_localize("UTC") if ts.tzinfo is None else ts.tz_convert("UTC")).to_pydatetime()


def fetch_coinbase(product: str, timeframe: str, start, end=None, session=None, pause=0.15) -> pd.DataFrame:
    """Fetch raw candles for a native Coinbase timeframe, paging backwards in 290-row windows."""
    if timeframe not in GRAN:
        raise ValueError(f"not a native Coinbase timeframe: {timeframe}")
    gran = GRAN[timeframe]
    s = session or _session()
    start_dt = _utc(start)
    end_dt = _utc(end) if end else dt.datetime.now(dt.timezone.utc)
    window = dt.timedelta(seconds=gran * 290)
    rows: list[list] = []
    cursor = end_dt
    while cursor > start_dt:
        lo = max(start_dt, cursor - window)
        r = s.get(f"{BASE_URL}/products/{product}/candles",
                  params={"granularity": gran, "start": lo.strftime("%Y-%m-%dT%H:%M:%SZ"), "end": cursor.strftime("%Y-%m-%dT%H:%M:%SZ")},
                  timeout=30)
        if r.status_code == 429:
            time.sleep(1.0)
            continue
        r.raise_for_status()
        page = r.json()
        rows.extend(page)
        cursor = lo
        time.sleep(pause)
    if not rows:
        return pd.DataFrame(columns=COLS)
    df = pd.DataFrame(rows, columns=["t", "low", "high", "open", "close", "volume"])
    df["t"] = pd.to_datetime(df["t"], unit="s", utc=True)
    df = df.drop_duplicates("t").set_index("t").sort_index()[COLS].astype(float)
    return df


def cache_path(product: str, timeframe: str) -> Path:
    return CACHE / f"coinbase_{product}_{timeframe}.csv"


YF_NATIVE = {"1h": "1h", "1d": "1d"}


def fetch_yfinance(symbol: str, timeframe: str, start, end=None) -> pd.DataFrame:
    """Yahoo Finance via yfinance. 1h is limited to ~730 days; 1d goes back decades. FX symbols like EURUSD=X, futures like GC=F."""
    import yfinance as yf
    kw = dict(interval=YF_NATIVE[timeframe], progress=False, auto_adjust=True, threads=False)
    if timeframe == "1h":
        df = yf.download(symbol, period="730d", **kw)
    else:
        df = yf.download(symbol, start=pd.Timestamp(start).strftime("%Y-%m-%d"), end=(pd.Timestamp(end).strftime("%Y-%m-%d") if end else None), **kw)
    if df.empty:
        return pd.DataFrame(columns=COLS)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df.rename(columns=str.lower)[COLS].astype(float)
    df.index = pd.to_datetime(df.index, utc=True)
    df = df[(df[["open", "high", "low", "close"]] > 0).all(axis=1)]
    return df.sort_index()


def load_yfinance(symbol: str, timeframe: str, start="2005-01-01", end=None, refresh=True) -> pd.DataFrame:
    base_tf = RESAMPLE_FROM.get(timeframe, timeframe)
    if base_tf not in YF_NATIVE:
        raise ValueError(f"yfinance source supports 1h-derived and 1d-derived timeframes, not {timeframe}")
    path = CACHE / f"yfinance_{symbol.replace('=', '').replace('^', '')}_{base_tf}.csv"
    if path.exists() and not refresh:
        df = pd.read_csv(path, index_col=0, parse_dates=True); df.index = pd.to_datetime(df.index, utc=True)
    else:
        fresh = fetch_yfinance(symbol, base_tf, start, end)
        if path.exists():
            old = pd.read_csv(path, index_col=0, parse_dates=True); old.index = pd.to_datetime(old.index, utc=True)
            fresh = pd.concat([old, fresh]).sort_index(); fresh = fresh[~fresh.index.duplicated(keep="last")]
        path.parent.mkdir(parents=True, exist_ok=True); fresh.to_csv(path); df = fresh
    df = df[df.index >= pd.Timestamp(_utc(start))]
    if end:
        df = df[df.index <= pd.Timestamp(_utc(end))]
    if timeframe != base_tf:
        df = resample(df, PANDAS_RULE[timeframe])
    return df


def load_any(exchange: str, product: str, timeframe: str, start, end=None, refresh=True) -> pd.DataFrame:
    if exchange == "yfinance":
        return load_yfinance(product, timeframe, start, end, refresh)
    return load(product, timeframe, start, end, refresh)


def load(product: str, timeframe: str, start="2019-01-01", end=None, refresh=True) -> pd.DataFrame:
    """Load OHLCV for any supported timeframe, using and extending the cache.

    Native timeframes are cached as fetched. Derived timeframes (2h/4h/12h/1w) are resampled from
    their base cache so the numbers are reproducible from one source.
    """
    base_tf = RESAMPLE_FROM.get(timeframe, timeframe)
    if base_tf not in GRAN:
        raise ValueError(f"unsupported timeframe {timeframe}")
    path = cache_path(product, base_tf)
    cached = pd.DataFrame(columns=COLS)
    if path.exists():
        cached = pd.read_csv(path, index_col=0, parse_dates=True)
        cached.index = pd.to_datetime(cached.index, utc=True)
    need_start = _utc(start)
    frames = [cached]
    if refresh or cached.empty:
        if cached.empty or cached.index.min() > pd.Timestamp(need_start):
            frames.append(fetch_coinbase(product, base_tf, need_start, cached.index.min() if not cached.empty else end))
        if not cached.empty:
            frames.append(fetch_coinbase(product, base_tf, cached.index.max(), end))
        df = pd.concat([f for f in frames if not f.empty]).sort_index()
        df = df[~df.index.duplicated(keep="last")]
        path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(path)
    else:
        df = cached
    df = df[df.index >= pd.Timestamp(need_start)]
    if end:
        df = df[df.index <= pd.Timestamp(_utc(end))]
    if timeframe != base_tf:
        df = resample(df, PANDAS_RULE[timeframe])
    return df


def resample(df: pd.DataFrame, rule: str) -> pd.DataFrame:
    out = df.resample(rule, label="left", closed="left").agg(
        {"open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"})
    return out.dropna(subset=["open", "close"])
