# Property fact sheets

One YAML per unit, copied from `_template.yaml`. Everything downstream derives from these files:
listing copy, site pages, tenant comms, and `npm run econ`.

Rules:
- `id` is kebab-case and never changes once used in a listing or page.
- Facts only. If you don't know it, leave it blank; don't guess. Claude is told not to invent.
- `npm run validate -- data/properties` checks shape. `npm run econ` prints the numbers.
- `example-duplex.yaml` is illustrative; delete it when a real unit exists.
