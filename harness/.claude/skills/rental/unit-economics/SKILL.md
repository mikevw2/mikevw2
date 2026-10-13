---
name: unit-economics
description: Run and explain rental unit economics (NOI, cap rate, cash-on-cash, DSCR, break-even rent/occupancy, RevPAR) from data/properties/*.yaml via scripts/econ.js. Use for "is this a good deal", rent-raise questions, refinance questions, or acquisition analysis.
---

# unit-economics

1. Confirm the property YAML exists and validates: `npm run validate -- data/properties/<id>.yaml`.
   For a prospective acquisition, create `data/properties/<id>.yaml` from `_template.yaml` first.
2. Run `npm run econ -- data/properties/<id>.yaml --json` (or the directory for a portfolio rollup).
3. Explain the result in plain terms: what the cash flow is after reserves and debt, what the
   margin of safety is (break-even rent or occupancy vs current), and which single input moves
   the result most. Offer one sensitivity: rerun with that input changed and show both.
4. Never compute these figures in prose. If a figure isn't produced by the script, add it to
   `lib/unit-economics.js` with a test, then use it.

Conventions: percentages are percents (5 = 5%). Reserves (maintenance, capex) are always
included; a deal that only works without reserves doesn't work.
