---
name: thesis
description: Write or update a trade thesis in data/journal/ from a setup the user describes. Use when the user mentions a trade idea, a ticker setup, "thesis", or wants to log/plan a trade. Produces a validated markdown file; never places orders.
---

# thesis

Turn a trade idea into a `data/journal/YYYY-MM-DD-TICKER.md` file that passes the thesis gate.

## Steps
1. Read `data/journal/_template.md` and `data/risk.yaml`.
2. Ask only for what the template requires and the user hasn't given: direction, entry, stop,
   first target, catalyst, invalidation. Don't pad with questions you can answer from context.
3. Run `npm run size -- --entry E --stop S --targets T1,T2 [--risk R] [--mult M]` and quote the JSON.
   Never compute units, risk dollars, or R multiples yourself.
4. Write the file. Status is `draft` unless the user explicitly approves, in which case set
   `status: approved` and `size: <units from step 3>`.
5. If the gate rejects it, report the exact errors. Offer "smaller" or "pass". Never suggest
   changing `risk.yaml`.

## Body quality bar
- Thesis: edge, why it exists now, who is on the other side.
- Invalidation: a condition, not just a price. "Close below 95 on volume" beats "95".
- Plan: trigger, scaling, target management, time stop.

## Don'ts
- No order placement. No "I'd buy here". You document and check; the user decides.
- No predictions of outcome. Confidence lives in the `confidence` field if the user wants it.
