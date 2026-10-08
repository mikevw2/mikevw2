# Business fit assessment for Mike Van Wagenen

Date: 2026-10-08. Basis: this repository's README, five research tracks (compliance-software market, 2026 regulatory calendar, Magic Valley plant cluster and live job postings, AI adoption evidence, solo-founder business models). Research notes with sources are in `research_notes/Mike business fit analysis/`.

## 1. The honest read on you

**You are a builder who has never sold anything.** The README lists five products across three industries. Not one has a customer, a price, a public URL, or a revenue figure. The README ends with "open to roles." That is a resume, not a business. Every founder story in your niche that worked (Limble, Vegam, FoodDocs, Safefood 360, SafetyCulture) went practitioner → paid service → software, over years. You have been running that sequence backwards.

**You spread a rare edge across unrelated bets.** Your real asset is the combination: six years on regulated dairy floors, multi-site CI at Darigold, and the ability to ship full-stack software alone. BookkeeperOS and Almsly use none of that. They prove you can build anything, which is exactly the problem. A plant manager does not care that you built a bookkeeping SaaS.

**Your flagship work may not be yours.** Plant Operations Hub was built for your employer's plant. Idaho has no employee-invention statute, so your IP assignment clause governs side-project software that relates to the employer's business. You list it publicly as "your" work and offer live walkthroughs. Read your signed agreement before you do anything else. The same applies to selling to dairy competitors while employed: the duty of loyalty makes that the single riskiest move available to you.

**Your AI positioning is pointed at the most crowded square on the board.** ProcedureIQ is an AI SOP generator. In 2025 to 2026, FoodReady, IONI, PinkPepper, Allera and SystemPath all shipped AI HACCP/SOP generation, and Mitti, Poka, Augmentir, Tulip and Redzone bundled it into platforms plants already pay for. Standalone AI SOP tools on Product Hunt got 0 to 2 upvotes; QuickSOP launched at $0 revenue. MIT's 2025 enterprise study found buyers in regulated workflows ignore startup pitches and that 95% of custom tools never reach production. EU meat processors reported an AI HACCP tool that missed three CCPs. Nobody will pay for the generation. They will pay for the signed, validated, product-specific result.

**Credentials gap.** The README shows domain knowledge but no PCQI, HACCP or SQF Practitioner certification, and your title is Processing Lead, not QA Manager. A plant will not let you sign a food safety plan without PCQI. TechHelp runs FSPCA PCQI in Twin Falls on Oct 27 and 29, 2026. That is the cheapest, fastest fix to the biggest credibility hole.

**What is genuinely rare about you.** Floor credibility plus code. Bilingual product instinct in a workforce that is 30% Hispanic. Residence inside the #3 milk state's processing cluster with ~30 plants in an hour's drive and no local independent food-safety consultancy. A Darigold network that reaches Boise, Caldwell and the Pacific Northwest. None of this is in question. What is in question is whether you will point it at one paying customer.

## 2. Where AI is over-used and where a human still wins

| Over-used (do not build) | Evidence |
|---|---|
| AI SOP / HACCP generators | 5+ launches 2025-26; incumbents bundle it; near-zero traction |
| "Chat with your SOPs" / compliance copilots | MIT: brittle, no learning, 9:1 human preference for high-stakes work |
| AI judgment at CCPs / deviations | EU plants reverted to less automation after AI approved a miscalibrated sensor for 5 hours |
| Generic checklist / forms apps | Mitti: 80,000 orgs, free up to 10 users, $24/seat |
| Floor-level chat for operators | 36-45% annual turnover, 25% limited-English in meat; needs one-tap bilingual pass/fail, not prompts |

| Under-served (a human with your background wins) | Evidence |
|---|---|
| The signed deliverable: validated plans, SQF practitioner oversight, CAPA closure | SQF requires site-employed practitioner; 21 CFR 117.305 requires signatures; auditors test validation, not prose |
| SQF Edition 10 conversion before Jan 2027 audits | Full renumbering, new change-management clause 2.3.5, food-safety-culture plan, tighter EMP; no one sells a fixed-price package |
| Continuous audit readiness | Costco V3.0 (Sep 2025): annual unannounced audit, 60 days of records or auto-fail, re-audit within 60 days |
| Deterministic record system with enforced escalation and audit export | 86% of EM programs on paper/spreadsheet; 3.4% of plants fully digital; spreadsheets fail at enforcement, chat fails at state |
| Dairy/PMO/aseptic workflow layer | No vendor productizes Appendix N review, FDV/seal tests, CIP verification, aseptic validation logs |
| Spanish-first floor tools and training | Native-language training scored 96.6%; vendor Spanish support is marketing claims only |
| FSMA 204 lot-code consistency drills | FDA tabletop: only 40% of firms kept a consistent lot code across CTEs; enforcement July 20, 2028 |

AI belongs inside your delivery, not on the box: clerical drafting behind deterministic rules, COA-vs-spec checks, document expiry, first-draft CAPA, EN/ES translation, with your name on the output.

## 3. Business models ranked for your situation

Constraints that drive the ranking: employed full time at a dairy plant, no outside capital, a cluster you can drive to, a documented tendency to build instead of sell.

**Model A. Audit-readiness practice with your software inside. Recommended.**
Fixed-fee SQF Edition 10 conversion plus monthly readiness retainers, sold to the 10 to 12 locally owned mid-tier plants that post QA jobs with Excel and logbooks in the description and show no named QMS. Start with non-dairy to avoid the employer conflict: potato (Mart Frozen Foods, Rite Stuff), trout (Riverence, Idaho Trout Processors), feed (Rangen), meat (Independent Meat), bakery (Bare Beans), 1000 Springs Mill, breweries. Add dairy (Idaho Milk Products' new ice-cream plant, High Desert Milk, MVQMP, Commercial Creamery, Actus Jerome) after you leave or with written clearance.

| Offer | Price anchor from research | Your edge |
|---|---|---|
| Edition 10 conversion (crosswalk, renumber, culture plan, change-management SOP, EMP review, mock audit) | $8k to $15k per site (SQF builds run $20k to $35k; gap assessments $6k to $12k) | ProcedureIQ generates the crosswalk and drafts; you validate and sign |
| Audit-readiness retainer | $3k to $6k per month (fractional QA benchmark $4.4k to $9.1k) | Continuous readiness for unannounced audits; deterministic tracker you already built |
| On-site day rate | $1,200 to $1,600 (CB audit day is $1,300 to $2,000; on-site carries a 40% premium over remote) | You live here |

Year-one arithmetic, part-time while employed: two conversions and one retainer is roughly $70k. Full-time: four conversions and three retainers is roughly $150k, before you sell any software.

Prerequisites: PCQI (Oct 27/29 at TechHelp Twin Falls), SQF Practitioner course, HACCP cert, read your employment agreement, LLC and E&O insurance, one signed LOI with a price before writing another line of product code.

**Model B. The deterministic "audit binder" system, sold only to Model A clients.**
Per-site, unlimited users, $300 to $800 per month, implementation included, offline-first, EN/ES. Not a forms builder. It enforces CAPA due dates, supplier document expiry, EMP trending, internal audit schedules, and exports evidence for any date range in one click. Price white space is real: QTRACA and Smart Food Safe are the only occupants and both are non-US. You have most of it in Plant Ops Hub and SafeOps, which is exactly why you must settle the IP question first. If the employer owns it, rebuild clean-room from your retainer clients' needs. Do not launch this cold: the median bootstrapped SaaS sits at $145 MRR and Limble took 2.5 years to its first $12 customer.

**Model C. Forward-deployed plant builder. Fastest to cash, lowest ceiling.**
Two to three days a week embedded at one corporate site, building the thing between SAP and the floor, or between Kleanz and the validation binder. $1,000 to $1,500 per day or $8k to $15k per month. Vegam built one plant's software for seven years, then productized to $10M revenue with no outside capital. Contract must separate background IP (your libraries) from foreground deliverables with a license-back, or you can never productize. Risk: it is a job with extra steps and one-client dependency.

**Model D. Spanish-first frontline compliance training and tooling. A wedge, not a company.**
Bilingual GMP/SQF/sanitation training and one-tap floor checks. Strong differentiator inside A and B. Standalone, training businesses sell for $125k to $675k in revenue, which tells you the ceiling.

**Model E. FSMA 204 and mock-recall readiness. Add-on to A for 2027-28.**
A 24-hour sortable-spreadsheet drill and lot-code consistency across CTEs is a process deliverable, not a software purchase. Retailers pull the requirement forward.

**Not recommended now.** Cold-start vertical SaaS while employed. Any AI-generation product as the headline. Buying a consultancy (requires leaving the job and $20k to $50k liquid; key-person discounts of 20 to 40% exist because clients follow the founder). Content or newsletter as a revenue model; use it as the single traffic channel instead.

## 4. What to stop

- Stop building. No new apps, no 31st SafeOps module, until a plant has signed an LOI with a dollar figure.
- Shelve BookkeeperOS and Almsly. Remove them from the pitch to plants.
- Stop presenting ProcedureIQ as a product. It is your delivery engine.
- Stop listing employer-built software as a portfolio item until your agreement says you can.
- Stop treating "open to roles" and "building a business" as compatible on the same page. Pick one.

## 5. The 90-day sequence

1. This week: read employment agreement (IP assignment, non-compete, outside work). Register for PCQI Oct 27/29.
2. Weeks 1 to 2: write one page: "SQF Edition 10 conversion, fixed fee, done before your first 2027 audit." Price it.
3. Weeks 2 to 6: ten in-person conversations with QA managers at non-dairy plants in the cluster. Ask what their Edition 10 plan is. Ask for the LOI.
4. Weeks 6 to 10: deliver the first conversion using ProcedureIQ internally. Record the hours. Price the next one higher.
5. Week 10 onward: convert one client to a monthly readiness retainer. Join MaintainX, Redzone and Mitti referral tracks to monetize relationships you already have. Ask Janna Hamlett at TechHelp to let you guest-present at the Nov 4 environmental-monitoring course.
6. Only after two retainers: build the audit-binder system for them, under a design-partner agreement with IP assignment and a stated price.

Decision rule: if no plant in the Magic Valley signs for a conversion by the end of Q1 2027, the problem is not the product and software will not fix it.

## 6. What this assessment cannot verify

- Your actual certifications, savings, and employment agreement terms.
- Consulting rates are forum self-reports from 2016 to 2026, not a dataset.
- No churn or sales-cycle data exists for QA-manager buyers of software.
- No analyst sizing of the US small-plant food-safety software market was accessible.
- Suntado and Darigold outside-work policies were not found online.

## Sources

Key sources, all cited inline in the research notes:
- SQFI Edition 10 FAQ and Jan 22, 2026 blog; FSSC 22000 v7 timeline (ASC Food Safety)
- CRS R48925 on FSMA 204; FDA Food Traceability page; Trustwell summary of FDA tabletop
- Costco Food Safety & Quality Audit Expectations V3.0 (Sep 2025)
- MIT NANDA "The GenAI Divide" (July 2025); Gartner agentic AI release (June 2025); EFSA/CLITRAVI deck (June 2026); University of Idaho BUL 1130 (Feb 2026)
- Food Safety Tech Research Digital Maturity Benchmark (Oct 2026); bioMérieux digitization survey; Trustwell 2025 tech-stack survey
- Capterra/G2/IFSQN pricing and reviews for SafetyChain, Redzone, Mitti, QTRACA, Smart Food Safe, FoodReady, IONI
- IFSQN consultant-fee threads; Go Fractional QA benchmarks; Allera SQF consultant guide
- Idaho Code 44-2704; Holland & Hart on Idaho restrictive covenants; NH Business Review on contractor copyright
- ISDA Guide to Idaho's Dairy Processors (2023) and Ingredient Brochure (2025); SIEDO major employers; Indeed and ZipRecruiter postings pulled Oct 8, 2026
- TechHelp Idaho event calendar (Oct to Nov 2026); Limble, Vegam, FoodDocs founder interviews; MicroConf Stair Step; BigIdeasDB indie SaaS revenue 2026
