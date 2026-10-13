---
name: site-brief
description: Turn a conversation about a website or landing page into a structured brief (brief.md) and design tokens (tokens.json) that site-build and visual-qa read. Use at the start of any new site, page, or redesign.
---

# site-brief

Output two files in `sites/<slug>/`: `brief.md` and `tokens.json`.

## brief.md sections
1. Purpose and the one action a visitor should take.
2. Audience (who, device mix, what they already know).
3. Pages and the job of each. Content inventory: what exists, what's missing, who provides it.
4. Proof: reviews, photos, numbers, credentials available.
5. Constraints: host, domain, budget, deadline, integrations (booking, Stripe, forms, email).
6. Success metric and how it will be measured.

## tokens.json
```json
{ "color": { "bg": "", "surface": "", "text": "", "muted": "", "primary": "", "accent": "" },
  "font": { "heading": "", "body": "", "scale": [14, 16, 18, 22, 28, 36, 48] },
  "space": [4, 8, 12, 16, 24, 32, 48, 64], "radius": 8, "maxWidth": 1120 }
```
Pick colors with contrast >= 4.5:1 for text. If the user has a logo or photos, derive from them.

Ask at most five questions, grouped in one message. Default the rest and mark defaults clearly.
