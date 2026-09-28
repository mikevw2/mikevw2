"""Renders marketplace listing images (2000x1600 PNG) from the sample workbooks.

Each shot builds a sample workbook with only one sheet visible and a print area set,
converts it to PDF with LibreOffice, rasterises page 1 and frames it with a headline.
"""
import os
import subprocess
import sys
import tempfile

import fitz  # pymupdf
from PIL import Image, ImageDraw, ImageFont

import budget_planner
import food_safety_kit
import side_hustle_tracker

W, H = 2000, 1600
BG = (31, 78, 61)
CREAM = (250, 247, 240)
GOLD = (242, 201, 76)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

SHOTS = [
    (budget_planner, "budget", "Monthly Dashboard", "A1:M46", "Budget vs. actual — every month", "Pick a month, see exactly where your money went"),
    (budget_planner, "budget", "Debt Payoff", "A1:J34", "Know your debt-free date", "Snowball or Avalanche — up to 8 debts"),
    (budget_planner, "budget", "Annual Overview", "A1:P30", "Your whole year at a glance", "Every category x 12 months, auto-calculated"),
    (budget_planner, "budget", "Savings Goals", "A1:I15", "Hit every savings goal", "Monthly amount needed, calculated for you"),
    (side_hustle_tracker, "hustle", "Dashboard", "A1:K38", "Know your REAL side-hustle profit", "Income, fees, expenses & mileage in one place"),
    (side_hustle_tracker, "hustle", "Quarterly Taxes", "A1:H12", "No more surprise tax bills", "Quarterly set-aside estimates, done for you"),
    (side_hustle_tracker, "hustle", "Expenses", "A1:J30", "Schedule C–ready expense log", "Business-use %, receipts check & 50% meals rule built in"),
]


FSK_SHOTS = [
    (food_safety_kit, "fsk", "Dashboard", "A1:L40", "Your whole food safety program, one dashboard", "Readiness, CAPAs, sanitation, CIP, suppliers, training, EMP"),
    (food_safety_kit, "fsk", "Hazard Analysis", "A1:Q12", "Hazard analysis with a built-in CCP decision tree", "Risk scoring + Codex decision tree, calculated for you"),
    (food_safety_kit, "fsk", "CIP Verification", "A1:M26", "CIP records that check themselves", "Every cycle checked against your limits, with the failed parameter named"),
    (food_safety_kit, "fsk", "Sanitation Schedule", "A1:J16", "Master sanitation schedule on autopilot", "Next due dates and OVERDUE flags, calculated for you"),
    (food_safety_kit, "fsk", "CAPA Register", "A1:O10", "CAPA register auditors love", "Root cause, owner, due date, days open, overdue flags"),
    (food_safety_kit, "fsk", "Supplier Approval", "A1:L12", "Never miss an expired supplier cert", "GFSI cert expiry and risk-based review dates"),
    (food_safety_kit, "fsk", "Training Matrix", "A1:L14", "Training matrix with expiry alerts", "Red = expired, amber = due soon, % current per person"),
    (food_safety_kit, "fsk", "Audit Readiness", "A1:G32", "Walk into your audit ready", "A 57-point self-assessment across 14 program areas"),
]


def render(module, sheet, area, pdf_dir):
    def hook(wb):
        for ws in wb.worksheets:
            if ws.title != sheet:
                ws.sheet_state = "hidden"
        ws = wb[sheet]
        wb.active = wb.worksheets.index(ws)
        ws.print_area = area
        ws.page_setup.orientation = "landscape"
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 1
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.print_options.gridLines = False
        if sheet == "Hazard Analysis":  # too wide to read in one image; hide the free-text columns
            for c in ("D", "I", "J", "K"):
                ws.column_dimensions[c].hidden = True
            for r in range(5, 13):
                ws.row_dimensions[r].height = 22
    xlsx = os.path.join(pdf_dir, f"{sheet.replace(' ', '_')}.xlsx")
    module.build(xlsx, sample=True, year=2026, hook=hook)
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", pdf_dir, xlsx],
                   check=True, capture_output=True, timeout=300)
    doc = fitz.open(xlsx[:-5] + ".pdf")
    page = doc[0]
    # crop to content bounding box
    rect = fitz.Rect()
    for b in page.get_text("blocks"):
        rect |= fitz.Rect(b[:4])
    for d in page.get_drawings():
        rect |= d["rect"]
    for img in page.get_images():
        for r in page.get_image_rects(img[0]):
            rect |= r
    rect = (rect + (-6, -6, 6, 6)) & page.rect
    pix = page.get_pixmap(dpi=220, clip=rect)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def frame(shot, headline, sub, out):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    size = 78
    while d.textlength(headline, font=ImageFont.truetype(FONT, size)) > W - 120:
        size -= 2
    d.text((W // 2, 110), headline, font=ImageFont.truetype(FONT, size), fill=CREAM, anchor="mm")
    d.text((W // 2, 200), sub, font=ImageFont.truetype(FONT_R, 44), fill=GOLD, anchor="mm")
    box_w, box_h = W - 160, H - 330
    shot.thumbnail((box_w - 40, box_h - 40), Image.LANCZOS)
    card = Image.new("RGB", (shot.width + 40, shot.height + 40), (255, 255, 255))
    card.paste(shot, (20, 20))
    x = (W - card.width) // 2
    y = 260 + (box_h - card.height) // 2
    d.rectangle([x + 14, y + 14, x + card.width + 14, y + card.height + 14], fill=(20, 52, 40))
    img.paste(card, (x, y))
    d.text((W // 2, H - 40), "Excel  •  Google Sheets  •  Instant download", font=ImageFont.truetype(FONT_R, 34), fill=CREAM, anchor="mm")
    img.save(out, optimize=True)


def cover(out, title_lines, bullets, shots):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    y = 140
    size = 104
    while max(d.textlength(t, font=ImageFont.truetype(FONT, size)) for t in title_lines) > 820:
        size -= 4
    for line in title_lines:
        d.text((90, y), line, font=ImageFont.truetype(FONT, size), fill=CREAM)
        y += int(size * 1.2)
    y += 30
    for b in bullets:
        d.text((100, y), "✓  " + b, font=ImageFont.truetype(FONT_R, 46), fill=GOLD)
        y += 72
    # stacked screenshot cards on the right; first shot ends up on top
    spots = [(1000, 1010, -3), (940, 580, 3), (980, 150, -2)]
    for s, (x, y, angle) in reversed(list(zip(shots[:3], spots))):
        s = s.copy()
        s.thumbnail((940, 520), Image.LANCZOS)
        card = Image.new("RGB", (s.width + 24, s.height + 24), (255, 255, 255))
        card.paste(s, (12, 12))
        card = card.rotate(angle, expand=True, fillcolor=BG, resample=Image.BICUBIC)
        img.paste(card, (x, y))
    d.rectangle([90, H - 170, 780, H - 80], fill=GOLD)
    d.text((435, H - 125), "INSTANT DOWNLOAD", font=ImageFont.truetype(FONT, 50), fill=BG, anchor="mm")
    img.save(out, optimize=True)


def main_fsk(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    shots = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, (mod, key, sheet, area, head, sub) in enumerate(FSK_SHOTS):
            img = render(mod, sheet, area, tmp)
            shots.append(img)
            frame(img.copy(), head, sub, os.path.join(out_dir, f"fsk-{i + 1:02d}-{sheet.replace(' ', '-').lower()}.png"))
            print("rendered", sheet)
    cover(os.path.join(out_dir, "fsk-00-cover.png"), ["Food Safety", "Audit-Readiness Kit"],
          ["Hazard analysis + CCP tree", "Sanitation & CIP records", "CAPA, suppliers, training", "SQF · BRCGS · FSSC · FSMA"],
          [shots[0], shots[2], shots[4]])


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    shots = {"budget": [], "hustle": []}
    with tempfile.TemporaryDirectory() as tmp:
        for i, (mod, key, sheet, area, head, sub) in enumerate(SHOTS):
            img = render(mod, sheet, area, tmp)
            shots[key].append(img)
            frame(img.copy(), head, sub, os.path.join(out_dir, f"{key}-{i + 1:02d}-{sheet.replace(' ', '-').lower()}.png"))
            print("rendered", sheet)
    cover(os.path.join(out_dir, "budget-00-cover.png"), ["Budget & Debt", "Payoff Planner"],
          ["Monthly + annual budget", "Debt snowball / avalanche", "Savings goal tracker", "Excel & Google Sheets"], shots["budget"])
    cover(os.path.join(out_dir, "hustle-00-cover.png"), ["Side Hustle Profit", "& Tax Tracker"],
          ["Income, fees & expenses", "Mileage log", "Quarterly tax estimates", "Excel & Google Sheets"], shots["hustle"])
    cover(os.path.join(out_dir, "bundle-00-cover.png"), ["Money Bundle:", "Budget + Side Hustle"],
          ["Both planners, one price", "Debt payoff calculator", "Quarterly tax estimates", "Save 35% vs. separately"],
          [shots["budget"][0], shots["hustle"][0], shots["budget"][1]])


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "../listing-images"
    if len(sys.argv) > 2 and sys.argv[2] == "fsk":
        main_fsk(out)
    else:
        main(out)
