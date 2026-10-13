# Trade journal

One markdown file per thesis: `YYYY-MM-DD-TICKER.md`, copied from `_template.md`.

Lifecycle: `draft` → `approved` (size computed, risk checked) → `open` → `closed` (review written),
or `draft` → `passed` (decided not to take it; say why).

Validation runs automatically when Claude writes or edits a file here (thesis-gate hook) and on
`npm run validate -- data/journal`. The rules come from `../risk.yaml`.

`.broker-log.jsonl` (gitignored) is the append-only log of every broker-shaped tool call and
whether it was allowed.
