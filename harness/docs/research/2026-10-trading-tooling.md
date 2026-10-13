# Trading tooling survey — 2026-10-13

What exists for the trading track, by layer, from this session's registry/catalog searches and the
container. "Connector" = claude.ai MCP connector (authorize in claude.ai). "Plugin" = Anthropic
directory plugin (enable in claude.ai). "pip" = installable here, verified with `pip download`.

## 1. Brokers and execution
| Name | Kind | Notes |
|---|---|---|
| Interactive Brokers (IBKR) | connector | Balances, positions, orders, price history/snapshots. Real broker, paper accounts supported by IBKR. |
| Webull | connector | 70+ tools: accounts, positions, watchlists, analyst data, quotes. |
| Alpaca (`alpaca-py`) | pip + REST | Commission-free US equities/options/crypto, first-class **paper trading API**. Best fit for our own `market-data` MCP + trade-guard. |
| `ib_async` | pip | Python client for IBKR Gateway/TWS; needs a running gateway (not in this container). |
| `ccxt` | pip / npm | Unified API to 100+ crypto exchanges incl. Coinbase, Kraken, Binance; sandbox modes on several. |
| Coinversa Pulse | connector | Hyperliquid perps data: whale/leaderboard flows, fills, orders. Data, not execution. |

## 2. Market data
| Name | Kind | Notes |
|---|---|---|
| Alpha Vantage | connector | 120+ tools: OHLCV, options, fundamentals, earnings, news, 50+ indicators. Free key has rate limits. |
| Financial Datasets | connector | Prices, fundamentals, filings, insider/ownership. |
| FMP (Financial Modeling Prep) | connector | Charts, calendars, COT, commodities, analyst data. |
| Bigdata.com | connector | Filings, earnings-call transcripts, sentiment, premium news, cited. |
| FactSet | connector | Institutional; paid. |
| Aiera | connector | Live events, transcripts, filings. |
| CoinDesk / CoinMarketCap | connector | Crypto spot/index OHLCV, order books, on-chain metrics. |
| `yfinance` | pip | Free daily/intraday OHLCV, options chains, fundamentals; good enough for research/backtests. |
| `polygon-api-client`, `fredapi` | pip | Polygon (paid tiers) for clean intraday; FRED for macro series. |

## 3. Deterministic math and backtesting
| Name | Kind | Notes |
|---|---|---|
| TradingCalc | plugin (MCP) | 75 deterministic tools: Black-Scholes/greeks, payoff, position size, pip value, VaR, Sharpe, futures PnL/liquidation. Pairs with our `size` skill. |
| QuanterLab | plugin (MCP) | Backtest a rule, walk-forward check, scan for candidates, saved strategies. Hosted; needs account. |
| TEXT TO QUANT | connector | Plain-English backtests with "honesty flagged" reports, scan alerts, portfolio sweeps. |
| Keel | connector | Build and backtest Hyperliquid strategies. |
| pyvar-portfolio-analytics | plugin | Markowitz/Black-Litterman/risk-parity, Sharpe/Sortino, Brinson, FF5, PCA, HMM. |
| `vectorbt`, `backtrader`, `pandas-ta` | pip | Local backtesting + 130 indicators. Runs in this container; results stay in the repo. |

## 4. Research and analysis skills
| Name | Kind | Notes |
|---|---|---|
| StockPortfolio.pro | plugin (MCP) | SEC-filing-grounded financials; nothing estimated. |
| Crypto Spot Futures Analyzer | plugin | Setup/entry/stop/leverage/liquidation analysis from charts or text. |
| Crypto & Bitcoin Analyst | plugin | Commands: /coin /chart /compare /market /news. |
| Finance (Anthropic) | plugin | Statements, variance, reconciliation; useful for P&L bookkeeping of the trading account. |
| deep-research, dataviz, xlsx, Artifacts | built in | Thesis research, dashboards, journals, reports. |

## 5. Already in the harness
`lib/position-size.js`, `scripts/size.js`, `data/risk.yaml`, `data/journal/_template.md`,
`thesis-gate` and `trade-guard` hooks, `thesis` and `size` skills, `risk-reviewer` agent.

## Recommended stack (pending Mike's answers on instruments, broker, style)
- **Execution**: Alpaca paper via our own `market-data` MCP (Python FastMCP) so trade-guard sees
  every call. IBKR connector if that is the live broker; ccxt if crypto.
- **Data**: `yfinance` + FRED for research and backtests (free); Alpha Vantage connector for
  live quotes/news/indicators in-session; upgrade to Polygon only if intraday systematic.
- **Math**: TradingCalc plugin for options/VaR/greeks; our `lib/` for sizing and journal stats.
- **Backtesting**: `vectorbt` locally, standard report with out-of-sample first; QuanterLab or
  TEXT TO QUANT as a second opinion when wanted.
- **Research**: StockPortfolio.pro for filing-grounded fundamentals; Bigdata.com if transcripts
  and sentiment matter.

## Build order (trading)
1. Enable TradingCalc; authorize Alpha Vantage. Add `data/watchlist.yaml`.
2. `mcp/market-data`: quote, ohlcv, calendar, indicators, paper_order (guarded), positions.
3. `market-brief` routine (weekday pre-market Artifact + push).
4. `backtest` skill + `scripts/backtest.py` (vectorbt) + report template.
5. `journal-review` skill: expectancy, R distribution, rule violations, weekly routine.
6. `screener` with YAML scan definitions; Claude writes commentary only.
