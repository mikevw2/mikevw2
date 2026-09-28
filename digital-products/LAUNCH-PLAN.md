# 30-Day Launch Plan: Digital Spreadsheet Shop

## Why this plan

- **The products are finished.** Two tested, sellable spreadsheet products and a bundle are in this folder: `products/`, `listing-images/` and `LISTINGS.md`.
- **Etsy spreadsheet templates are an established category.** Buyers already search for "budget spreadsheet", "debt snowball" and "side hustle tracker".
- **Low risk.** It costs about $0.20 per listing on Etsy and $0 on Gumroad. You never put capital at risk.
- **No work per sale.** The marketplace delivers the file on its own. The goods cost nothing to reproduce, so almost every sale is margin after fees.
- **It suits the timing.** In January, "budget planner" and "tax" searches peak each year. Listings launched now build reviews and search rank before that rush.

## Realistic expectations

A brand-new Etsy shop has no reviews and little search ranking, so most new shops sell slowly in the first month.

- **Month 1 (honest range):** $0–$300. Where you land depends mostly on whether you do the Pinterest and Reddit steps below.
- **Months 2–4:** each good listing can earn a steady $100–$1,000+ per month as reviews build, and the January budgeting season helps.

Treat anyone promising more from a standing start with suspicion.

---

## What only you can do (≈ 45 minutes total, one time)

I can't open accounts, verify your identity or connect a bank account for you. Those steps are yours:

### Step 1: Open the shop (≈ 20 min)
1. Go to **etsy.com/sell** and click "Get started".
2. Shop name: pick something like *TidyLedgerCo* or *MoneyMapStudio*. Check that it's available.
3. Add your bank account and tax info. Etsy asks for this and verifies your identity.
4. Etsy may charge a one-time shop setup fee (currently about $15 in many regions).

### Step 2: Create the 3 listings (≈ 20 min, all copy-paste)
For each listing in `LISTINGS.md`:
1. **Shop Manager → Listings → Add a listing.**
2. Upload the images from `listing-images/` in the order given in the table.
3. Paste the title, description and 13 tags.
4. Set the type to **Digital** and upload the matching `.zip` from `products/`.
5. Category: *Paper & Party Supplies → Paper → Calendars & Planners*, or search "spreadsheet".
6. About this listing: "I did" / "A finished product" / "Made to order: no". For the AI disclosure prompt, choose the option that says you designed it with AI tools.
7. Enter the price from the table and publish.

Then go to **Marketing → Sales and discounts** and create a **40% off, 30-day** sale on all listings. New shops convert better with a visible discount.

### Step 3 (optional, +10 min): Gumroad as a second storefront
Create a free account at **gumroad.com** and add each product with the same zip, images and description. Gumroad links are what you share on Reddit and social media, where Etsy links sometimes get removed.

---

## Traffic plan (optional but makes the biggest difference)

| When | Action | Time |
|---|---|---|
| Day 1 | Create a Pinterest Business account, claim your Etsy shop and post the 5 pins from `LISTINGS.md` | 20 min |
| Days 2–30 | Post 1–2 pins a day, reusing the listing images with new titles | 5 min/day |
| Week 1 | Share a *genuinely helpful* post (not an ad) in r/povertyfinance, r/personalfinance or r/Etsy about the debt snowball vs. avalanche result you got. Read each subreddit's self-promotion rules first. | 20 min |
| Week 2 | Ask friends or family who buy it to leave a review. The first 5 reviews matter most. | — |
| Week 3 | Check Etsy Stats. Swap the tags of the lowest-viewed listing for the phrases that brought visits. | 15 min |
| Day 30 | End the launch sale and set regular prices | 2 min |

**Etsy Ads:** start at $1/day on your best-viewed listing only after you have 1–2 reviews. Ads for a shop with no reviews rarely pay back.

---

## What I can keep doing for you with minimal input

Everything in this repo is generated from code in `build/`, so I can quickly:
- **Add more products to the shop.** More listings give you more search surface, which is the main growth lever on Etsy. Good next products: wedding budget planner, rental property tracker, small-business inventory tracker, baby budget, sinking-funds tracker and a 2027 bill calendar.
- Rewrite titles and tags based on your Etsy Stats. Paste a screenshot and I'll do the rest.
- Draft replies to customer messages.

Regenerate everything after edits:
```
pip install openpyxl pillow pymupdf        # plus LibreOffice for the images
cd digital-products/build
python3 budget_planner.py ../products
python3 side_hustle_tracker.py ../products
python3 food_safety_kit.py ../products
python3 listing_images.py ../listing-images        # consumer product images
python3 listing_images.py ../listing-images fsk    # food safety kit images
```
