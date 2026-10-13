---
name: quote
description: Produce a rental quote (items, dates, delivery miles, add-ons) deterministically via scripts/quote.js, and check availability. Use whenever someone asks what a rental costs, for a booking request, or "is X available on date Y". Never price in prose.
---

# quote

1. Identify items by id from `data/inventory/` (list them if the user names them loosely).
2. Run `npm run quote -- --items a,b --start YYYY-MM-DD --end YYYY-MM-DD [--city Name | --miles n] [--addons x,y]`.
   Pass `--city` first: flat delivery zones match by city. Otherwise miles are one-way from Twin
   Falls; if unknown, ask for the venue city and estimate, saying it's an estimate.
3. Present the lines, bundle and seasonal discounts, delivery, tax, total, the retainer due to
   reserve, the balance and its due date, and the refundable damage deposit, verbatim.
   If `manualReview` is true, give `manualReviewReason` and say Mike will confirm by hand.
4. Availability: until the Airtable bookings table is wired, ask the user to confirm the calendar.
   Once wired, call the availability tool and report remaining units per item.
5. If any item's `base_rate` is 0, stop and say rates aren't set yet rather than quoting $0.

Draft the customer-facing reply in the voice from `CLAUDE.md`: warm, specific, short, with the
next step (deposit link or "reply to hold the date").
