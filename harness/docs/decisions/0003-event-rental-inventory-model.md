# 0003 — Event-rental inventory model replaces the property model

Date: 2026-10-13

## Context
The first scaffold assumed real-estate units. The business actually rents event items (an
audio/video guestbook phone, a white flower wall, a white flower arch) with day/weekend rates,
delivery mileage, add-ons, and refundable deposits.

## Decision
Replace `data/properties/` and `lib/unit-economics.js` with `data/business.yaml` (business-wide
facts and policies) plus `data/inventory/*.yaml` (one item each), and `lib/pricing.js` for quotes
and availability. Hosting is Netlify, payments Stripe, bookings Airtable (chosen 2026-10-13).

## Consequences
- The website catalog, quotes, booking emails, and copy all read the same YAML files.
- Unit economics for real estate can come back as a separate module if that line of business
  appears; it is in git history at commit 578546d.
