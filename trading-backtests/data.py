"""Download and cache daily price data (crypto: Binance, forex: Yahoo) and interest rates (FRED)."""
import io, os, time
import pandas as pd, requests

DATA = os.path.join(os.path.dirname(__file__), "data")
CRYPTO = ["BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOGE", "LTC", "LINK", "TRX", "AVAX", "DOT", "BCH", "XLM", "ETC"]
# Yahoo tickers -> (pair name). USD-base pairs are inverted later so every series is XXX/USD.
FX = {"EURUSD=X": "EURUSD", "GBPUSD=X": "GBPUSD", "AUDUSD=X": "AUDUSD", "NZDUSD=X": "NZDUSD",
      "JPY=X": "USDJPY", "CAD=X": "USDCAD", "CHF=X": "USDCHF",
      "EURGBP=X": "EURGBP", "AUDNZD=X": "AUDNZD", "EURCHF=X": "EURCHF"}
RATES = {"USD": "US", "EUR": "EZ", "JPY": "JP", "GBP": "GB", "AUD": "AU", "CAD": "CA", "CHF": "CH", "NZD": "NZ"}


def _cached(name, fn):
    path = os.path.join(DATA, name + ".csv")
    if not os.path.exists(path):
        fn().to_csv(path)
    return pd.read_csv(path, index_col=0, parse_dates=True)


def _binance(sym, interval="1d"):
    rows, start = [], 0
    while True:
        r = requests.get("https://data-api.binance.vision/api/v3/klines",
                         params={"symbol": sym + "USDT", "interval": interval, "startTime": start, "limit": 1000}, timeout=30)
        r.raise_for_status()
        k = r.json()
        if not k:
            break
        rows += k
        start = k[-1][0] + 1
        if len(k) < 1000:
            break
        time.sleep(0.2)
    df = pd.DataFrame(rows).iloc[:, :6]
    df.columns = ["time", "open", "high", "low", "close", "volume"]
    df.index = pd.to_datetime(df.pop("time"), unit="ms")
    return df.astype(float)


def crypto_hourly(sym):
    return _cached(f"crypto_{sym}_1h", lambda: _binance(sym, "1h"))


def fx_hourly(ticker, name):
    """~2 years of hourly OHLC (Yahoo's intraday limit), UTC timestamps."""
    import yfinance as yf
    def get():
        df = yf.download(ticker, period="729d", interval="1h", progress=False, auto_adjust=False).droplevel(1, axis=1)
        df.index = df.index.tz_convert("UTC").tz_localize(None)
        return df[["Open", "High", "Low", "Close"]]
    return _cached(f"fx_{name}_1h", get)


def crypto_closes():
    return pd.DataFrame({c: _cached("crypto_" + c, lambda c=c: _binance(c))["close"] for c in CRYPTO})


def fx_closes():
    import yfinance as yf
    out = {}
    for tk, name in FX.items():
        df = _cached("fx_" + name, lambda tk=tk: yf.download(tk, start="2009-01-01", progress=False,
                                                              auto_adjust=False).droplevel(1, axis=1))
        out[name] = df["Close"]
    px = pd.DataFrame(out)
    px = px[px.index.dayofweek < 5].ffill()
    for name in ["USDJPY", "USDCAD", "USDCHF"]:  # express as foreign-currency / USD
        px[name[3:] + "USD"] = 1 / px.pop(name)
    return px


def rates():
    """Monthly 3-month interbank rates (% p.a.)."""
    def get(code):
        r = requests.get(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id=IR3TIB01{code}M156N", timeout=30)
        df = pd.read_csv(io.StringIO(r.text), index_col=0, parse_dates=True)
        return df.iloc[:, 0]
    return _cached("rates", lambda: pd.DataFrame({ccy: get(code) for ccy, code in RATES.items()}))


if __name__ == "__main__":
    print(crypto_closes().apply(lambda s: s.first_valid_index()))
    print(fx_closes().tail(2))
    print(rates().tail(3))
