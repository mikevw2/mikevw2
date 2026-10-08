# Pinterest + SEO store: execution plan

**Decision (Oct 8, 2026):** go organic-first. Pinterest + Google SEO on a Shopify store, with an Etsy print-on-demand shop as the fast-demand channel. No paid Meta ads. US-fulfilled supply only.

**Targets (from the research model, base case):** first signal by Jan 31, 2027; first operating-profit month ~April 2027; cumulative cash-positive ~August 2027; first real season Q4 2027. Cash ceiling ~$1,500 before the April gate. Founder hours: 8–12/week through January, then 5–8.

Full evidence: `reports/Dropshipping SEO and Pinterest route.md` and `reports/Low risk dropshipping launch plan.md`.

---

## Who does what

| Bucket | Examples | Owner |
|---|---|---|
| Identity, money, legal | LLC, EIN, bank, Shopify Payments KYC, Etsy ID verification, Pinterest/Google account creation, API app approvals, tax filings, any platform appeal | **Mike only** |
| Judgment | Niche and product picks, design originality, sample inspection, pricing, the kill/keep call at each gate | **Mike** (Claude drafts options) |
| Review | Approve/reject every drafted page, guide, pin, outreach email (10–30 min/day in the approval UI) | **Mike** |
| Drafting and ops | Keyword research, collection/product/guide copy, pin images and copy, posting approved pins, internal-link suggestions, Merchant Center audits, link prospecting, weekly report, bookkeeping sync | **Claude pipeline** (`store-ops/`) |
| Build | Theme JSON-LD, robots tweaks, approval UI, cron jobs, API clients | **Claude Code sessions** (this repo) |

---

## Phase 0 — Accounts and access (Oct 9 – Oct 24)

Everything in this phase needs you. Nothing downstream can start without it. Estimated 4–6 hours total, spread over two weeks because of approval lags.

### Your checklist (do in this order)

- [ ] **Idaho LLC** at sosbiz.idaho.gov ($100 online, ~1 week). Use your home address or a registered-agent service if you don't want it public.
- [ ] **EIN** at irs.gov (free, instant, needs the LLC name).
- [ ] **Idaho seller's permit** at tax.idaho.gov/ibr (free). Call Twin Falls P&Z (208-735-7267) to ask whether a home-occupation permit applies.
- [ ] **Business checking account** in the LLC name (ACH-eligible; not a fintech/savings account, Shopify Payments rejects those).
- [ ] **Domain**: pick a brand name (Claude will propose 10 options once you say the niche is final). Buy on Cloudflare or Porkbun (~$10).
- [ ] **Shopify**: start the trial around Oct 19–22 so the $1/month promo covers through late January. Basic plan, Shopify Payments, complete KYC (SSN, ID photo, EIN letter, bank).
- [ ] **Shopify custom app** (Settings → Apps → Develop apps): scopes `write_content`, `write_products`, `write_online_store_pages`, `read_orders`, `read_analytics`. Paste the Admin token into `store-ops/.env`.
- [ ] **Google**: Search Console property (domain verification via DNS), Merchant Center via Shopify's Google & YouTube app with free listings on, a service account with Search Console read access. Save the JSON key to `store-ops/.env`.
- [ ] **Pinterest**: business account, claim the domain, create the boards in `plan/pinterest-boards.md`. Create a developer app at developers.pinterest.com. Record the 1–2 minute OAuth demo video and submit for **Standard access** (Trial access can't post public pins). If approval stalls past Nov 15, subscribe to Tailwind ($17.99/mo annual) as the fallback.
- [ ] **Etsy** shop (POD items only): $15–29 setup fee, photo ID verification, connect Printful.
- [ ] **Printful** account connected to both Shopify and Etsy. Order one sample of each POD base (planner, desk mat, throw) — ~$60–90.
- [ ] **CJdropshipping** account (free) for US-warehouse organizer SKUs. Place 2 timed test orders to your own address.
- [ ] **DataForSEO** account, $50 top-up. **Keywords Everywhere** $10 credits (optional).
- [ ] **Supabase** project (free tier) or any Postgres. Run `store-ops/db/schema.sql`.
- [ ] **Anthropic API key** for the pipeline (separate from your Claude Code subscription).
- [ ] **Featured.com** free tier + **Source of Sources** signup for link building.

### What Claude does meanwhile
- Pipeline code (`store-ops/`), approval UI, pin templates, cron.
- Keyword seed list (`plan/keyword-seeds.csv`) ready for the paid pull the day DataForSEO is funded.
- Board plan, first 60 pin concepts, POD design briefs (`plan/pod-design-briefs.md`).
- Store policies (shipping, returns, privacy, terms) drafted for your review; FTC 30-day rule baked into the shipping policy.

---

## Phase 1 — Build the store (Oct 25 – Nov 15)

- **Keyword map**: run the DataForSEO pull on the seed list, keep 40–80 terms with KD ≤ 20 and clear buying intent. You approve the content plan.
- **Collections**: 10–15 modifier-targeted collection pages with original copy + FAQ (drafted by pipeline, approved by you).
- **Products**: 30–60 SKUs. CJ US-stock organizers (rewritten descriptions, your own photos where possible) + Printful originals. No supplier copy anywhere.
- **Theme**: Dawn-family theme, JSON-LD Product/Offer in initial HTML, robots rules for tag/filter paths, ≤2 apps.
- **Merchant Center**: custom policies, full contact footer, GTINs where assigned. Submit by Nov 8 so any misrepresentation review finishes before January.
- **Pinterest organic warm-up**: from the day the domain is claimed, 3–5 manual-ish pins/day from the approval queue. Do **not** connect the Shopify catalog app yet.
- **Etsy**: 30–60 original-design POD listings live by Dec 1 (that's the only Q1 demand source).
- **Email**: capture popup + welcome flow (Shopify Email or Klaviyo free tier).

## Phase 2 — Run the pipeline (Nov 16 – Jan 31)

Daily, automated: content drafter (≤1 guide/day, ≤10 page rewrites), pin factory (≤10 pins/day, ≥7 days per URL), poster (3–10 approved pins/day spread 8am–9pm), link-prospect drafts (≤5/day).
Weekly, automated: keyword scout, internal-link check, Merchant Center audit, Friday report.
You: ~15–30 min/day approving, ~1 hr/week reading the report and sending outreach.
Connect the Pinterest catalog only after ~4 weeks of clean organic history and only if the account shows no warnings.
Seed New-Year "get organized" pins from mid-November; Valentine's gift pins from early January; spring-cleaning pins from mid-January.

## Gates (kill or keep)

| Gate | Date | Keep if | Kill/pivot if |
|---|---|---|---|
| 0 Setup | Nov 30, 2026 | Merchant Center approved, Pinterest Standard access or Tailwind, 10+ collections + 30+ products live, 30+ Etsy listings, keyword map done, GSC + Pinterest analytics flowing | Merchant Center suspended twice or Pinterest account suspended: stop publishing until fixed |
| 1 First signal | Jan 31, 2027 | ≥5 Etsy orders, ≥300 January site visits, GSC impressions on 20+ queries, Pinterest outbound clicks rising WoW | 0 Etsy orders and <100 visits: swap niche to contingency (pet enrichment) before spring |
| 2 Compounding | Apr 30, 2027 | ≥1,000 visits/mo, ≥10 Shopify orders/mo, ≥3 top-10 pages, a profitable month in Mar/Apr | <300 visits and <5 orders/mo: stop, keep domain + Etsy + list |
| 3 Season ready | Jul 31, 2027 | ≥2,000 visits/mo, list ≥300, holiday collections + gift pins live | Below base case: run Q4 on existing assets only |
| 4 Verdict | Dec 31, 2027 | Cumulatively cash-positive, Nov–Dec >$2,500/mo revenue, no channel >50% | Still cash-negative: thesis failed, close or sell |

## Budget (Oct 2026 – Apr 2027)

| Item | Amount |
|---|---|
| LLC + domain | ~$110 |
| Shopify (promo then $29–39/mo) | ~$90 |
| Etsy setup + listing fees | ~$40 |
| Samples + test orders | ~$150 |
| DataForSEO + keyword credits | ~$60 |
| Anthropic API (pipeline) | ~$10–40/mo |
| Image gen + misc tooling | ~$10–30/mo |
| Tailwind (only if Pinterest API approval stalls) | $0–108 |
| Reserve | ~$500 |
| **Total through April** | **~$1,200–1,500** |

## Things that are NOT automated, ever
Platform appeals, chargeback responses, tax filings, supplier payments, pricing changes, publishing without approval, outreach sends, catalog bulk-sync to Pinterest.
