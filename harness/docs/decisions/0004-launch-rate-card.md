# 0004 — Launch rate card and policies

Date: 2026-10-13. Approved by Mike.

## Context
No Twin Falls / Magic Valley vendor publishes prices for a guestbook phone, flower wall, or
flower arch; national vendors serve Idaho by shipping. See `docs/research/2026-10-rate-research.md`.

## Decision
Rates live in `data/inventory/*.yaml`; policies, bundles, delivery zones, and seasonal discount in
`data/business.yaml`. Summary: phone $225 / $275 weekend, wall $250 / $300, arch $325 / $375,
all three $699 / $799; 25% retainer, balance 14 days out, $100 damage hold on wall and arch,
$15 waiver on phone; free delivery within 25 mi, $1.50/mi beyond, flat $175 Boise/Pocatello/
Idaho Falls, flat $250 Logan/SLC with $600 minimum; 15% off Nov–Apr.

Bundle weekend price applies only when the items themselves priced at the weekend rate.
Seasonal discount applies after the bundle discount, to the rental amount only.

## Consequences
- Changing a number is a commit to a YAML file plus a note here; the site and quotes follow.
- Weekend is Fri–Mon (up to 4 days) to match the "weekend rental" norm in the research.
