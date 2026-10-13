# CLAUDE.md — harness

You are working inside Mike Van Wagenen's operations harness. Two tracks: (A) web design and
rental business, (B) trading. Read `HARNESS_PLAN.md` once per session if you need the big picture.

## How to work here

- Deterministic math lives in `lib/` with tests. Call `scripts/*.js` for numbers. Never compute
  position size, risk, P&L, cap rate, or occupancy figures in prose.
- Prefer small, composable skills in `.claude/skills/<track>/<name>/`. One job per skill.
- When you add a rule a hook enforces, also document it in this file in plain English.
- Record non-obvious decisions as an ADR in `docs/decisions/`.
- Run `npm test` before committing changes under `lib/` or `scripts/`.
- Source of truth for an item is its YAML in `data/inventory/`; for the business, `data/business.yaml`.
  Site pages, quotes, and copy all derive from them. If a fact is missing, add it to the YAML, don't invent it.

## Track A rules: web + event rentals

- The business rents event items (guestbook phone, white flower wall, white flower arch; see
  `data/inventory/`). Business facts and policies are in `data/business.yaml`. Fields marked
  `TODO` are unknown: ask, don't invent.
- Prices, delivery fees, tax, deposits, and availability come from `npm run quote` and
  `lib/pricing.js`. Never quote a number in prose that the script didn't produce.
- Design from tokens. If `sites/<slug>/tokens.json` exists, use only those colors, type scales,
  and spacing. Flag deviations rather than improvising.
- Every page you ship passes `npm run qa -- <url>`: title, meta description, one h1, alt text,
  no console errors, no horizontal overflow at 390px. Look at the mobile screenshot.
- Customer messages: warm, specific, short, with a clear next step. No legal claims.
- Policy or contract text you draft (rental agreement, damage terms) is marked
  `[NEEDS REVIEW]` until Mike approves it; then it moves into `data/business.yaml` policies.
- Local market: Twin Falls / Magic Valley, Idaho, with delivery per `service_area`.

## Track B rules: trading

- Paper by default. `data/risk.yaml: live_enabled` is false. Hooks block broker write calls
  unless `PAPER=1` or a live confirmation is present. Do not try to work around a blocked call.
- No thesis, no size, no order. A trade starts as `data/journal/YYYY-MM-DD-TICKER.md` using
  `data/journal/_template.md`. The thesis-gate hook validates required fields and risk limits.
- Risk limits in `data/risk.yaml` are not suggestions. If a setup doesn't fit, the answer is
  "pass" or "smaller", never "adjust the limit for this one".
- You are not a signal source. Screeners and backtests produce candidates; you write the
  reasoning, the invalidation, and the review. Report out-of-sample results before in-sample.
- Journal review is about behavior and process (rule violations, R-multiples, expectancy),
  not about predicting the next trade.
- Systematic work runs through `quant/` (Python, `.venv`). Backtests report out-of-sample
  walk-forward results first; the in-sample "best grid point" is never quoted as performance.
- Broker is TradeLocker, demo environment, credentials only from env vars (`TL_*`).
  `quant/broker_tradelocker.py` refuses non-demo URLs while `live_enabled` is false.
- Market data for research comes from Coinbase Exchange public candles cached in `data/cache/`
  (gitignored). Binance is geo-blocked from this container; ccxt needs `verify=` set to the
  proxy CA bundle, so prefer `quant/data.py`.

## Things to avoid

- Don't add dependencies without a line in `README.md` saying why.
- Don't write secrets into the repo. Broker keys, data-provider keys, and host tokens come from
  environment variables (see `.claude/hooks/session-start.sh`).
- Don't disable or soften a hook to get unblocked. Explain what blocked and stop.
