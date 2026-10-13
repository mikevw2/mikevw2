# Inventory

One YAML per rentable item, from `_template.yaml`. `data/business.yaml` holds the business-wide
facts (contact, service area, tax, bundle discount, policies).

Everything derives from these files: the website catalog, quotes (`npm run quote`), booking
request emails, and listing copy. Fields marked `TODO` are waiting on real values; Claude does
not invent them.

- `npm run validate -- data/inventory` checks shape.
- `npm run quote -- --items guestbook-phone,flower-wall-white --start 2026-06-12 --end 2026-06-14 --miles 40`
