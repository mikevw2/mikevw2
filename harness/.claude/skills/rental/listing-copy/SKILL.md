---
name: listing-copy
description: Write or refresh copy for a rental item (website card and detail page, Facebook Marketplace, Instagram caption, wedding-vendor directory profile) from data/inventory/<id>.yaml and data/business.yaml. Use when the user asks for a description, listing, caption, headline, or profile text.
---

# listing-copy

Source of truth is `data/inventory/<id>.yaml` plus `data/business.yaml`. Never introduce a fact
(size, material, what's included, price, radius) that isn't in them. If the copy needs one, ask,
add it to the YAML, then write.

## Outputs
- **Site card**: headline (<= 60 chars), one proof line, "from $X" using `pricing.base_rate`.
- **Site detail page**: 90-140 word description, "what's included" bullets, specs table rows,
  add-ons with prices, delivery and deposit lines pulled from business policies, one CTA.
- **Facebook Marketplace / groups**: 60-100 words, first line = item + area + "from $X", then
  4-6 bullets, then "message to check your date".
- **Instagram caption**: 1-2 sentences, 3-5 relevant local hashtags (Twin Falls, Magic Valley,
  Idaho wedding), no hashtag walls.
- **Vendor directory profile** (The Knot, Zola, WeddingWire): 150-200 words about the business
  using `business.yaml`, then one line per item.

## Rules
- Plain and specific. No "stunning", "perfect for", "elevate".
- Two headline variants; say which to test first and why.
- Save to `data/inventory/<id>.copy.md` so the next refresh can diff.
