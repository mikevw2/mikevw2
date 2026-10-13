---
name: visual-qa
description: Run Playwright-based visual and structural QA on a URL or local HTML file (three viewports, screenshots, title/meta/h1/alt/overflow/console checks) via scripts/visual-qa.js. Use before any page ships, after any layout change, and for "does this look right on mobile".
---

# visual-qa

Run `npm run qa -- <url-or-file> [more...]`. Output: `qa/report.json` and `qa/screenshots/*.png`.

1. Run it. Paste the check list verbatim.
2. Open the three screenshots (Read tool) and look: alignment, spacing rhythm, truncated text,
   contrast, tap-target size on mobile, hero above the fold, CTA visible without scrolling.
3. For each failed check or visual problem, fix the source, rerun, and show before/after.
4. Report only remaining issues with a reason you didn't fix them.

A page is not done until all checks pass and you have looked at the mobile screenshot.
