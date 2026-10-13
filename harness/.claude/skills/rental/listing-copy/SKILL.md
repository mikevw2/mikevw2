---
name: listing-copy
description: Write or refresh rental listing copy (Zillow, Facebook Marketplace, Airbnb, VRBO, direct site) from a property YAML in data/properties/. Use when the user asks for a listing, ad, description, headline, or to refresh/seasonalize existing copy.
---

# listing-copy

Source of truth is `data/properties/<id>.yaml`. Never introduce a fact that isn't in it; if the
copy needs one, add it to the YAML (ask the user) and then write.

## Output per platform
- **Zillow / long-term**: headline (<= 70 chars), 120-180 word description, bullets for specs,
  pet/parking/utilities lines, application steps. Plain, specific, no hype adjectives.
- **Facebook Marketplace**: 60-100 words, first line carries rent + beds/baths + area, then 4-6
  bullets, then "message for a showing".
- **Airbnb / VRBO (str)**: title (<= 50 chars), summary (first 400 chars matter), "the space",
  "guest access", "other things to note", house rules from YAML.
- **Direct site**: hero line, 3 proof bullets, CTA.

## Rules
- Fair housing: describe the property, never the ideal tenant. No "perfect for families",
  "young professionals", "quiet Christian neighborhood", "no kids", etc.
- Use `nearby` items as concrete drive/walk times, not "close to everything".
- Produce two headline variants and say which to test first and why.
- Save output to `data/properties/<id>.listing.md` so it can be diffed next refresh.
