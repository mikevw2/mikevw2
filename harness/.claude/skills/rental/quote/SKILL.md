---
name: quote
description: Produce a rental quote (items, dates, delivery miles, add-ons) deterministically via scripts/quote.js, and check availability. Use whenever someone asks what a rental costs, for a booking request, or "is X available on date Y". Never price in prose.
---

# quote

1. Identify items by id from `data/inventory/` (list them if the user names them loosely).
2. Run `npm run quote -- --items a,b --start YYYY-MM-DD --end YYYY-MM-DD [--miles n] [--addons x,y]`.
   Miles are one-way from the base city in `data/business.yaml`. If unknown, ask for the venue
   city and estimate, saying it's an estimate.
3. Present the lines, bundle discount, delivery, tax, total, and the refundable deposit, verbatim.
   If `manualReview` is true, say the venue is outside the delivery radius and needs a manual quote.
4. Availability: until the Airtable bookings table is wired, ask the user to confirm the calendar.
   Once wired, call the availability tool and report remaining units per item.
5. If any item's `base_rate` is 0, stop and say rates aren't set yet rather than quoting $0.

Draft the customer-facing reply in the voice from `CLAUDE.md`: warm, specific, short, with the
next step (deposit link or "reply to hold the date").
