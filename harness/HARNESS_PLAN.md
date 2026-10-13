# Harness Engineering Plan — Rental/Web + Trading

Date: 2026-10-13. Author: Claude, for Mike Van Wagenen.

Principle: the model supplies judgment and language; the harness supplies memory, enforcement,
deterministic math, schedules, and verification. Same hybrid-AI + deterministic pattern as
ProcedureIQ and BookkeeperOS, applied to how I work for you.

---

## 1. Inventory: what exists today

### Runtime (this cloud session)
- Node 22, pnpm 10, Python 3.13 with pandas/numpy/openpyxl/requests.
- Playwright + Chromium preinstalled. Headless screenshots, visual regression, scraping comps.
- git + GitHub MCP server (scoped to mikevw2/mikevw2; other repos via add_repo).
- gcloud / bq CLIs (BigQuery available if you ever want a warehouse).
- Outbound HTTPS through a proxy. Secrets come from the environment config, not the repo.

### Harness primitives
| Primitive | What it gives you |
|---|---|
| CLAUDE.md | Durable project rules: brand tokens, risk limits, voice, conventions. |
| Skills (`.claude/skills/*/SKILL.md`) | Procedural playbooks I load on demand. Measurable with skill-creator evals. |
| Hooks (settings.json) | Hard gates the harness enforces, not me: pre-push visual QA, broker-write blocker, formatters. |
| Subagents / Workflow | Parallel specialists (design critic, a11y, SEO, risk reviewer) with isolated context. |
| Routines (cron triggers) | Scheduled sessions: morning market brief, weekly owner report, nightly site check. |
| Artifacts | Published HTML pages with a shared database, live data, "ask Claude" hooks. Instant internal tools and client previews. |
| Claude Docs | Living shared documents (briefs, SOPs, lease checklists). |
| MCP servers (mcp-builder) | Typed deterministic tools I call: your own rental-data and market-data servers. |
| Plugins | Packaging unit for all of the above. Also the sellable unit. |

### Skills already enabled
web-artifacts-builder, artifact-design, dataviz, canvas-design, skill-creator, mcp-builder,
deep-research, xlsx, docx, pptx, pdf, docs, google-workspace, morning, browser/computer-use
(desktop app only), session-start-hook, update-config, code-review, security-review, loop.

### Connectors
- Connected: Indeed, ZipRecruiter (job search, not relevant here).
- Needs reconnect: Intuit Mailchimp, MailerLite (relevant: guest/tenant email sequences).
- Incomplete: Canva (relevant: listing graphics, social posts).
- Available, not installed, relevant:
  - Web: Figma, Vercel, Netlify, Cloudflare Developer Platform, Webflow, WordPress.com.
  - Business: Stripe, Intuit QuickBooks, Meridian QuickBooks, Airtable, Notion, Google Sheets.
  - Trading: Financial Datasets, Interactive Brokers, Bigdata.com, FactSet, Coinversa Pulse (Hyperliquid), viaNexus.

### Plugins in your catalog (none enabled yet)
- frontend-design (Anthropic) — UI/UX implementation skill.
- Property Management Operator — resident requests, maintenance triage, vendors, renewals, delinquencies.
- TradingCalc — 75 deterministic tools (Black-Scholes, position size, VaR, Sharpe, futures PnL/liquidation) as an MCP server.
- Crypto Spot Futures Analyzer, Crypto & Bitcoin Analyst — chart/setup analysis skills.
- Finance (Anthropic) — close, reconciliation, variance analysis, financial statements.
- mana — multi-reviewer code review, PR monitoring, ticket workflows.

---

## 2. Proposed structure

One repo: `mikevw2/harness` (private).

```
harness/
  CLAUDE.md                     global rules: brand, voice, risk limits, "never auto-execute"
  .claude/
    settings.json               hooks + permissions
    hooks/                      shell/python gate scripts
    skills/
      web/      site-brief, design-system, site-build, visual-qa, seo-local, deploy
      rental/   listing-copy, guest-comms, maintenance-triage, unit-economics,
                owner-report, lease-docs, market-watch
      trading/  market-brief, thesis, size, backtest, screener, journal-review
    agents/     design-critic, a11y-reviewer, seo-reviewer, risk-reviewer
  mcp/
    rental-data/                Python FastMCP over Sheets/Airtable + property YAML
    market-data/                Python FastMCP over data provider + paper broker
  data/
    properties/*.yaml           one fact sheet per unit (source of truth for copy, site, P&L)
    risk.yaml                   trading rules the hooks enforce
    journal/                    one markdown file per trade thesis
  plugins/                      packaged, versioned copies for install/sale
  evals/                        skill-creator eval suites
```

---

## 3. Track A: Web design + rental business

### Web skills
1. **site-brief** — intake conversation to a structured brief (audience, pages, CTAs, brand tokens,
   content inventory). Output: `brief.md` + `tokens.json`. Everything downstream reads these.
2. **design-system** — tokens to `tokens.css` / Tailwind config / component primitives.
   Builds on artifact-design + frontend-design plugin. A hook lints new pages for off-token colors.
3. **site-build** — scaffolds the site in your preferred style (self-contained static HTML/PWA,
   or Astro when a CMS is needed). Prototype as an Artifact for an instant preview link, then
   promote to repo + deploy.
4. **visual-qa** — Playwright screenshots at mobile/tablet/desktop, Lighthouse scores, axe a11y,
   broken-link check, pixel diff vs baseline. Runs as a PreToolUse hook on `git push` and as a
   nightly routine against the live site. This is the single highest-leverage piece: the harness
   verifies what I produced instead of trusting it.
5. **seo-local** — schema.org (LodgingBusiness / VacationRental / Apartment), meta, sitemap,
   Google Business Profile checklist, local citation list for Twin Falls / Magic Valley.
6. **deploy** — Netlify or Cloudflare Pages connector + GitHub Actions. Preview URL per PR.

### Rental skills (event rentals: guestbook phone, white flower wall, white flower arch)
1. **quote** — deterministic pricing via `lib/pricing.js`: day/weekend rates, bundle discount,
   delivery mileage, tax, refundable deposit, availability with turnaround buffer.
2. **listing-copy** — site cards/pages, Marketplace, Instagram, vendor-directory copy from
   `data/inventory/*.yaml` and `data/business.yaml`.
3. **booking-intake** — Netlify form submission to Airtable row to confirmation email, with a
   Stripe deposit link; a hold expires per `booking.hold_hours`.
4. **customer-comms** — inquiry reply, quote, hold, deposit received, week-of logistics,
   day-after thank-you + review ask, deposit return notice.
5. **ops-checklists** — delivery/setup/teardown checklists per item, damage inspection log.
6. **monthly-report** — bookings, revenue, utilization per item, lead sources; dashboard Artifact.
7. **market-watch** — quarterly competitor rate scan appended to a sheet.

### Products from this track
- **Event Rental Ops plugin** for small rental businesses: quote engine + skills + Airtable schema.
- **Rental site kit**: static Netlify template with catalog, availability, booking form, Stripe
  deposit flow, and the visual-qa harness bundled.
- **Owner dashboard** as a hosted Artifact with a shared database: a multi-tenant product.

---

## 4. Track B: Trading

Hard rules baked into the harness, not left to the model:
- Deterministic math only (TradingCalc MCP + your own Python). I never compute size or risk in prose.
- Paper first. Live execution never happens from a session without an explicit per-order confirm.
- Every trade starts as a thesis file with required fields. No thesis, no size, no order.

### Skills
1. **market-brief** — weekday pre-market routine: macro calendar, watchlist moves, earnings,
   open-position risk, overnight news. Delivered as an Artifact dashboard + push notification.
   Data from Financial Datasets / Bigdata / IBKR connector or your own market-data MCP.
2. **thesis** — structured template: instrument, setup, catalyst, entry, invalidation, targets,
   R:R, horizon, confidence. Saved to `data/journal/YYYY-MM-DD-TICKER.md`. The journal is git.
3. **size** — calls TradingCalc for fixed-fractional / ATR stop / Kelly fraction / VaR. A hook
   refuses to mark a thesis "approved" if it violates `risk.yaml` (max % risk per trade, max
   open risk, max correlated exposure, daily loss stop).
4. **backtest** — pandas engine in the container (add vectorbt if wanted), walk-forward,
   standardized report with dataviz. Skill encodes an anti-overfitting checklist and forces
   out-of-sample results to be reported first.
5. **screener** — scan definitions in YAML, executed by the MCP server, ranked list returned.
   I write commentary only; I do not pick the list.
6. **journal-review** — weekly routine: expectancy, win rate, avg R, drawdown, rule violations,
   behavior tags. Dashboard + three concrete adjustments.

### Hooks
- **trade-guard**: PreToolUse hook that blocks any MCP write to a broker unless `PAPER=1` or a
  one-time confirmation token is present. Logs every broker call to an append-only file.
- **thesis-gate**: PreToolUse on file writes under `data/journal/` validates required fields.

### Products from this track
- **Trading Discipline plugin**: thesis + size + journal + guards. Sells on process, not signals.
- **Backtest report generator**: drop a CSV of trades or a strategy spec, get the standard report.

---

## 5. Cross-cutting

- **Routines**: market-brief (weekdays 06:30 MT), owner-report (1st of month), market-watch
  (Mondays), journal-review (Fridays), visual-qa on live site (nightly).
- **Subagent reviews**: Workflow fans out design-critic + a11y + SEO on a site PR; risk-reviewer
  on any thesis. Each returns findings; I merge.
- **Evals**: skill-creator eval suites for listing-copy, thesis, size. Measure before shipping a plugin.
- **Memory**: CLAUDE.md for rules, `docs/decisions/` ADRs for why.
- **Existing hook**: a Stop hook already runs a git check in this environment. Keep it.

---

## 6. Phased rollout

**Phase 0 (this week): foundation**
- Create `mikevw2/harness`, CLAUDE.md, settings.json with the two guard hooks, SessionStart hook
  for deps.
- Enable plugins: frontend-design, TradingCalc, Property Management Operator.
- Connect: Netlify or Cloudflare, Google Sheets or Airtable, one market-data connector.
  Reconnect MailerLite or Mailchimp.
- Write `data/properties/*.yaml` and `data/risk.yaml`.

**Phase 1 (weeks 1-2): first loops**
- Rental: listing-copy, unit-economics xlsx, site-brief + site-build for one property page,
  visual-qa hook.
- Trading: thesis, size, journal-review, market-brief routine. Paper only.

**Phase 2 (weeks 3-6): deterministic backbone**
- rental-data MCP and market-data MCP (mcp-builder).
- Routines live. Owner dashboard Artifact. Backtest engine.

**Phase 3 (weeks 6+): package and sell**
- Plugins versioned under `plugins/`, evals passing, README + demo per plugin.
- Site kit + owner dashboard as products.

---

## 7. Open questions (answer whenever; nothing above blocks on them)

1. Rentals: ANSWERED 2026-10-13. Event rentals (guestbook phone, white flower wall, white flower
   arch). Host Netlify, payments Stripe, bookings Airtable. Rates, photos, policies still needed.
2. Web: current site and host, if any? Preferred stack: self-contained static like SafeOps, or
   Astro/Next with a CMS?
3. Trading: instruments (equities, options, futures, crypto)? Broker? Discretionary or systematic?
   Data provider you already pay for?
4. Email: MailerLite or Mailchimp as the one to keep?
