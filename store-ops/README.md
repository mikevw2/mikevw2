# store-ops

An AI-run SEO + Pinterest content pipeline for a small Shopify home-organization store. Claude drafts everything; humans approve; code enforces the caps. Nothing in this package publishes a page or a pin without an approved row in Postgres, and every external mutation is logged with an idempotency key so a retry can never double-post.

Status: scaffold. It compiles, the unit tests pass, and the pin renderer produces real 1000x1500 PNGs. Nothing has run against a live API yet, so the request shapes marked VERIFY in each client file need a check against the current docs before the first real call.

## What is in here

```
src/config.ts              env (zod) + CAPS constants, model ids, Shopify API version
src/db.ts                  pg pool, publish_log logger, job_runs, monthly task counter
src/guards/caps.ts         pure guard functions (daily caps, URL spacing, duplicate hashes, slots, auto-pause)
src/clients/shopify.ts     Admin GraphQL 2026-10: articleCreate (isPublished:false), metafieldsSet, productUpdate, reads
src/clients/pinterest.ts   API v5: boards, createPin, pin/account analytics, OAuth helper
src/clients/dataforseo.ts  Google Ads search volume (live), 1,000 keywords per task, monthly cap
src/clients/gsc.ts         Search Console searchanalytics.query with a service-account JWT (jose)
src/agents/llm.ts          the only file that calls the Claude API (structured outputs via output_config.format)
src/agents/contentDrafter.ts  keyword + facts + style guide -> content_drafts row, status=draft
src/agents/pinFactory.ts   approved page -> 3 pin variants -> rendered PNGs -> pin_queue, status=pending
src/prompts/styleGuide.md  voice, SEO conventions, and the hard "no invented facts" rules
src/render/renderPin.ts    Playwright chromium -> 1000x1500 PNG; templates in src/render/templates/
src/render/hash.ts, png.ts average hash for near-duplicate detection; tiny PNG codec, no native deps
src/jobs/drafter.ts        daily 06:00
src/jobs/pinFactoryJob.ts  daily 06:30
src/jobs/poster.ts         hourly 08:00–21:00; auto-pauses
src/jobs/weeklyReport.ts   Friday 07:00 -> reports/weekly/YYYY-MM-DD.md
src/approval-ui/           Express + one static HTML page; Approve / Reject
db/schema.sql              tables: keywords, content_drafts, pin_queue (+ pins_posted view), publish_log, metrics_daily, job_runs, api_task_counter
scripts/                   render-sample-pin.ts, migrate.ts, cron.example
```

## Setup, in order

Steps marked **(human)** cannot be automated: they need your login, a video, or a credit card.

1. **Node 20+ and Postgres.** Create a database (Supabase works: Project Settings -> Database -> connection string). **(human)**
2. `cp .env.example .env` and fill in `DATABASE_URL`. Then:
   ```bash
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install   # chromium is expected at $PLAYWRIGHT_BROWSERS_PATH; run `npx playwright install chromium` on a fresh machine
   npm run db:migrate
   npm run typecheck && npm test
   npm run render:sample                          # proves the renderer works: samples/sample-pin.png, 1000x1500
   ```
3. **Anthropic API key** -> `ANTHROPIC_API_KEY`. **(human)**
4. **Shopify custom app** **(human)**: Settings -> Apps and sales channels -> Develop apps -> Create app. Admin API scopes: `write_content`, `write_products`, `write_online_store_pages`, `read_orders`. Install it, copy the Admin API access token into `SHOPIFY_ADMIN_TOKEN`, set `SHOPIFY_STORE_DOMAIN` to the `*.myshopify.com` host and `STORE_PUBLIC_URL` to the public storefront URL.
5. **Pinterest developer app** **(human)**: create the app at developers.pinterest.com, note app id/secret, register `PINTEREST_REDIRECT_URI`. A new app is in Trial access (pins visible only to you). To reach Standard access you must submit a screen recording of the OAuth flow, even as the only user. Build the URL with `pinterestAuthorizationUrl()` and exchange the code with `exchangePinterestCode()` from `src/clients/pinterest.ts`; record that flow for the demo; store the resulting token in `PINTEREST_ACCESS_TOKEN`. Until Standard access is granted, keep Tailwind as the fallback (export approved rows to CSV by hand).
6. **DataForSEO** **(human)**: sign up, top up (pay as you go from $50), copy login/password from API Access into `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`.
7. **Google Search Console** **(human)**: verify the property; in Google Cloud create a service account and a JSON key; add the service-account email as a user on the property; put the JSON (one line, or a file path) in `GSC_SERVICE_ACCOUNT_JSON` and the property in `GSC_SITE_URL` (`sc-domain:example.com` or `https://example.com/`).
8. **Product facts**: copy `data/product-facts.example.json` to `data/product-facts.json` and fill in the verified facts (measurements, materials, what is in the box) for each page you want drafted. The drafter only writes what is in this file; the style guide forbids inventing the rest.
9. **Cron**: edit `scripts/cron.example` (paths, user) and install it. The jobs assume `TZ=America/Boise` so pin slots land 08:00–21:00 local.

## Running each job

| Job | Command | Reads | Writes |
|---|---|---|---|
| Drafter | `npm run job:drafter` | keywords, data/product-facts.json, style guide | content_drafts (status=draft) |
| Pin factory | `npm run job:pin-factory` | approved content_drafts, photos | PNGs in samples/pins/, pin_queue (status=pending) |
| Poster | `npm run job:poster` | pin_queue (status=approved) | Pinterest pins, publish_log, pin_queue.status |
| Weekly report | `npm run job:weekly-report` | GSC, Pinterest analytics, Shopify orders, publish_log | reports/weekly/YYYY-MM-DD.md, metrics_daily |
| Approval UI | `npm run approval-ui` | content_drafts, pin_queue | status changes only |

Every run writes a `job_runs` row (`ok`, `notes`). A job that throws exits non-zero. Jobs that need a secret you have not set fail fast with a message naming the variable.

Dry runs: `createShopifyClient({ dryRun: true, logger })` and `createPinterestClient({ dryRun: true })` log what they would send and send nothing. Use these for the first week.

## How approval works

1. Agents only ever insert `content_drafts.status = 'draft'` and `pin_queue.status = 'pending'`.
2. Open `http://127.0.0.1:3999` (`npm run approval-ui`; it binds to localhost only). Each card shows the rendered body / the pin image and the character counts for meta fields. Approve or Reject, with optional notes.
3. **Drafts:** Approve marks the draft as fact-checked. Publishing a guide to Shopify is still a deliberate call to `createArticleDraft()` (which creates it with `isPublished: false`) followed by you pressing Publish in Shopify admin. The scaffold does not include a "push approved drafts" job on purpose; add one when you trust the output.
4. **Pins:** the poster reads only `status = 'approved'`, assigns slots across 08:00–21:00 with `nextPinSlots()`, posts at most one pin per hourly run, and re-checks every cap at post time.
5. **Pausing:** on any Pinterest API error, or when account impressions fall more than 50% week over week, the poster writes a `PAUSED` file in the package root and a `job_runs` row with `ok=false`. It will not post again until a human deletes that file (there is a Clear button in the UI). Look at why it paused first.

## The caps (src/config.ts, enforced in src/guards/caps.ts)

| Cap | Value |
|---|---|
| Pins per day | 10 |
| Days between pins to the same URL | 7 |
| Duplicate image hashes | none (average hash, Hamming distance <= 4 counts as duplicate at post time) |
| Guides drafted per day | 1 |
| Page rewrites drafted per day | 10 |
| Internal-link edits per day | 20 |
| Outreach drafts per day | 5 |
| DataForSEO tasks per month | 400 |
| Auto-pause on impression drop | > 50% week over week |
| Posting window | 08:00–21:00 local |

The caps are constants, not prompt text. Changing them is a code change that shows up in git.

## Models

`claude-opus-5-5` drafts long-form copy and the five-line weekly narrative (server-side refusal fallbacks on). `claude-haiku-5-5` writes pin copy. Both go through `output_config.format` with zod schemas, so a draft that does not fit the schema is rejected before it reaches the database.

## What is NOT automated

- Choosing the niche, products, and which pages to make next.
- Fact-checking and editing every draft; publishing anything in Shopify admin.
- Measurements and photos: you take them, you type them into `data/product-facts.json`.
- Creating the Shopify custom app, the Pinterest app and its OAuth demo video, the DataForSEO top-up, the GSC service account, the database.
- Sending outreach emails (drafts only, and that job is not in this scaffold yet).
- Clearing a pause, answering platform appeals, and the kill/keep decisions at each dated gate.
- Keyword scouting, internal-link suggestions, Merchant Center audit and link prospecting jobs from the plan: the clients and caps exist; those jobs are not written yet.
