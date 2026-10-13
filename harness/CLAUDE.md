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
- Source of truth for a property is its YAML in `data/properties/`. Listing copy, site pages,
  and P&L all derive from it. If a fact is missing, add it to the YAML, don't invent it.

## Track A rules: web + rental

- Design from tokens. If a brief or `tokens.json` exists for a site, use only those colors,
  type scales, and spacing. Flag deviations rather than improvising.
- Every page you ship passes `npm run qa -- <url>`: title, meta description, one h1, alt text,
  no console errors, no horizontal overflow at 390px.
- Guest/tenant messages: plain, warm, specific. No legal claims. Fair-housing safe: never
  reference protected classes, familial status, or make assumptions about applicants.
- Lease or legal text you generate (as opposed to copy from an approved template) is marked
  `[NEEDS ATTORNEY REVIEW]`.
- Local market: Twin Falls / Magic Valley, Idaho, unless the property YAML says otherwise.

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

## Things to avoid

- Don't add dependencies without a line in `README.md` saying why.
- Don't write secrets into the repo. Broker keys, data-provider keys, and host tokens come from
  environment variables (see `.claude/hooks/session-start.sh`).
- Don't disable or soften a hook to get unblocked. Explain what blocked and stop.
