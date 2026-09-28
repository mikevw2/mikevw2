"""Builds the 'Food Safety Audit-Readiness Kit' workbook.

A connected set of food-safety program tools (hazard analysis with CCP decision tree,
CCP/PC plan, sanitation master schedule, CIP verification, EMP log, CAPA register,
supplier approval, training matrix, audit self-assessment) feeding one dashboard.
"""
import datetime as dt
import random

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import CellIsRule, DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Font
from openpyxl.worksheet.datavalidation import DataValidation

from common import (BOX, DARK, DATE, GREY, INPUT, LIGHT, MID, PCT, RED, WHITE,
                    col, fill, header, section, style_range, title, widths)

AMBER = "FFE8B3"
GREEN = "D4EDDA"
ROWS = 300

DEPARTMENTS = ["Receiving", "Raw Processing", "Pasteurization", "Filling / Packaging",
               "Warehouse", "Sanitation", "QA Lab", "Maintenance"]
FREQUENCIES = [("Daily", 1), ("Weekly", 7), ("Biweekly", 14), ("Monthly", 30),
               ("Quarterly", 91), ("Semiannual", 182), ("Annual", 365)]
COURSES = [("GMPs & personal hygiene", 12), ("Allergen awareness", 12), ("Food defense awareness", 12),
           ("HACCP / preventive controls basics", 36), ("Sanitation & chemical safety", 12),
           ("Lockout / tagout", 12), ("CIP operation", 24), ("Environmental monitoring sampling", 24)]
CIP_SPECS = [("Caustic concentration (%)", 1.0, 2.5), ("Caustic temperature (°F)", 160, None),
             ("Caustic contact time (min)", 10, None), ("Acid concentration (%)", 0.5, 1.5),
             ("Sanitizer concentration (ppm)", 150, 200)]
CAPA_SOURCES = ["Internal audit", "External audit", "Customer complaint", "Process deviation",
                "EMP positive", "Supplier issue", "Regulatory inspection", "Other"]
SCHEMES = ["SQF", "BRCGS", "FSSC 22000", "IFS", "PrimusGFS", "None"]

# Self-assessment items, written generically so they apply across GFSI-benchmarked schemes.
CHECKLIST = {
    "Management commitment & culture": [
        "A signed food safety policy is posted and communicated to all staff",
        "Food safety and quality objectives are defined, measured and reviewed",
        "Responsibilities and a trained backup are documented for every key food safety role",
        "A designated practitioner (e.g. PCQI / SQF practitioner) is appointed and qualified",
        "Management review is held at the required frequency with minutes and actions",
    ],
    "Document control & records": [
        "A master document list exists with current revision numbers and approval",
        "Obsolete documents are removed from use and retained per policy",
        "Records are legible, completed in real time, signed and verified",
        "Record retention periods are defined and met",
    ],
    "Specifications & product development": [
        "Specifications exist for all raw materials, packaging and finished products",
        "Labels are verified against formulation, including allergens, before release",
        "New products and process changes go through a documented food safety review",
    ],
    "Food safety plan (HACCP / PC)": [
        "The food safety team and its qualifications are documented",
        "Product descriptions and intended use are documented",
        "Process flow diagrams are current and verified on the floor",
        "The hazard analysis covers biological, chemical (incl. allergen) and physical hazards",
        "Every CCP/PC has critical limits, monitoring, corrective action and verification",
        "The plan was reanalyzed within the last 3 years or after any significant change",
    ],
    "Verification & validation": [
        "CCP/PC records are reviewed and signed by a qualified person within the required timeframe",
        "Critical limits and sanitation methods have documented validation evidence",
        "Monitoring and measuring equipment is calibrated with traceable records",
        "Product testing and environmental results are trended and reviewed",
    ],
    "Traceability, recall & crisis": [
        "Lots can be traced one step forward and one step back",
        "A written recall plan with current contact list exists",
        "A mock recall was completed in the last 12 months with results documented",
        "A crisis management / business continuity plan is in place and tested",
    ],
    "Food defense & food fraud": [
        "A food defense vulnerability assessment and plan are documented",
        "Site access, visitors and contractors are controlled and logged",
        "A food fraud vulnerability assessment covers raw materials",
    ],
    "Allergen management": [
        "An allergen map / matrix covers all ingredients, lines and products",
        "Allergen changeover cleaning is validated and verified",
        "Allergen-containing materials are segregated and identified in storage",
    ],
    "Supplier approval": [
        "An approved supplier list is maintained and used by purchasing",
        "Supplier risk assessments determine the level of monitoring",
        "Certificates, COAs and letters of guarantee are current and on file",
        "Receiving inspections are documented and non-conforming materials are held",
    ],
    "Sanitation & EMP": [
        "A master sanitation schedule covers all areas and equipment and is up to date",
        "SSOPs / cleaning procedures exist with chemicals, concentrations and methods",
        "Pre-operational inspections are completed and documented",
        "An environmental monitoring program defines zones, sites, frequency and responses",
        "Positive EMP results trigger documented investigation and corrective action",
    ],
    "Pest control": [
        "A licensed pest control provider or trained employee manages the program",
        "A current trap / device map exists and matches the floor",
        "Pest activity is trended and service reports are reviewed with actions",
    ],
    "Personnel practices & training": [
        "GMP and hygiene rules are posted and followed (jewelry, hair, handwashing, PPE)",
        "A training matrix defines required training per role",
        "Training records are current, including refresher training",
        "Employee illness reporting and return-to-work rules are documented",
    ],
    "Premises, equipment & maintenance": [
        "Buildings, floors, walls and ceilings are in good repair and cleanable",
        "Preventive maintenance is scheduled and completed on food contact equipment",
        "Food-grade lubricants are used where required and controlled",
        "Glass, brittle plastic and foreign-material controls are in place and audited",
        "Water, air and steam that contact product are tested and meet requirements",
    ],
    "Internal audit, CAPA & review": [
        "An internal audit schedule covers all elements at least annually",
        "Internal auditors are trained and independent of the area audited",
        "Non-conformities go into a CAPA system with root cause analysis",
        "CAPA effectiveness is verified before closure",
    ],
}


def _dv(ws, formula, rng):
    dv = DataValidation(type="list", formula1=formula, allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(rng)


def _log(ws, heading, subtitle, columns, first=5, n=ROWS):
    """Lay out a log sheet. columns: list of (header, width, formula_or_None, number_format)."""
    title(ws, heading, subtitle, len(columns) + 1)
    header(ws, first - 1, 1, [c[0] for c in columns])
    ws.row_dimensions[first - 1].height = 32
    ws.freeze_panes = ws.cell(row=first, column=2)
    for j, (_, w, formula, fmt) in enumerate(columns, start=1):
        ws.column_dimensions[col(j)].width = w
        for r in range(first, first + n):
            c = ws.cell(row=r, column=j)
            if formula:
                c.value = formula.format(r=r)
                c.font = Font(bold=True)
            elif r % 2 == 0:
                c.fill = fill(GREY)
            if fmt:
                c.number_format = fmt
            c.border = BOX
    return first + n - 1


def _put(ws, row, values, start_col=1):
    for j, v in enumerate(values):
        if v is not None:
            ws.cell(row=row, column=start_col + j, value=v)


def build(path, sample=False, hook=None, year=None):  # year unused; keeps a common signature
    today = dt.date.today()
    wb = Workbook()
    start = wb.active
    start.title = "Start Here"
    dash = wb.create_sheet("Dashboard")
    setup = wb.create_sheet("Setup")
    haz = wb.create_sheet("Hazard Analysis")
    plan = wb.create_sheet("CCP-PC Plan")
    san = wb.create_sheet("Sanitation Schedule")
    cip = wb.create_sheet("CIP Verification")
    emp = wb.create_sheet("EMP Log")
    capa = wb.create_sheet("CAPA Register")
    sup = wb.create_sheet("Supplier Approval")
    trn = wb.create_sheet("Training Matrix")
    aud = wb.create_sheet("Audit Readiness")

    # ---------------- Start Here ----------------
    title(start, "Food Safety Audit-Readiness Kit",
          "Your food safety program in one connected workbook. Built for SQF, BRCGS, FSSC 22000 and FSMA facilities.", 12)
    tabs = [
        ("Dashboard", "Live program health: audit readiness, open and overdue CAPAs, overdue sanitation, CIP pass rate, supplier and training status, EMP positives."),
        ("Setup", "Facility name, due-soon window, risk threshold, departments, sanitation frequencies, CIP limits and training courses. Set these first."),
        ("Hazard Analysis", "Score each hazard by likelihood × severity. Significant hazards run through the CCP decision tree automatically."),
        ("CCP-PC Plan", "Critical limits, monitoring (what, how, frequency, who), corrective actions, verification and records for each CCP / preventive control."),
        ("Sanitation Schedule", "Master sanitation schedule. Enter the last completed date and the next due date and status (OVERDUE / DUE SOON / OK) calculate. DUE SOON scales with frequency (a quarter of the interval, capped at the Setup window)."),
        ("CIP Verification", "Log each CIP cycle. Every parameter is checked against your limits: PASS, FAIL (naming the failed parameter) or INCOMPLETE."),
        ("EMP Log", "Environmental monitoring results by zone. Zone 1 positives are flagged red."),
        ("CAPA Register", "Corrective and preventive actions with root cause, owner, due date, days open and an OVERDUE flag."),
        ("Supplier Approval", "Approved supplier list with GFSI certificate expiry, document status and risk-based review dates."),
        ("Training Matrix", "Employees × required courses. Expired training turns red and expiring training turns amber, with a % current for each person."),
        ("Audit Readiness", f"{sum(len(v) for v in CHECKLIST.values())}-point self-assessment across 14 program areas, with a readiness score for each area and overall."),
    ]
    r = 4
    for h, b in tabs:
        start.cell(row=r, column=2, value=h).font = Font(bold=True, size=12, color=DARK)
        c = start.cell(row=r, column=3, value=b)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        start.row_dimensions[r].height = 32
        r += 1
    r += 1
    for t in ["Type only in the yellow input areas and plain log rows. Bold columns calculate automatically.",
              "Works in Microsoft Excel and Google Sheets (File → Import). No macros, so it's safe for locked-down plant PCs.",
              "Adapt every limit, frequency and checklist item to your own validated food safety plan.",
              "This kit organizes your program. It does not replace your scheme's official code, regulations or a qualified PCQI / practitioner."]:
        start.cell(row=r, column=3, value="• " + t).alignment = Alignment(wrap_text=True)
        r += 1
    widths(start, {"B": 22, "C": 110})

    # ---------------- Setup ----------------
    title(setup, "Setup", "Yellow cells are inputs. Every other tab reads from here.", 12)
    fields = [("Facility name", "Sample Creamery — Plant 1" if sample else "Your Facility"),
              ("'Due soon' window (days)", 14),
              ("Risk score that makes a hazard significant (L × S, 1–25)", 8),
              ("Supplier certificate warning window (days)", 60)]
    for i, (lab, v) in enumerate(fields):
        setup.cell(row=4 + i, column=2, value=lab).font = Font(bold=True)
        c = setup.cell(row=4 + i, column=3, value=v)
        c.fill = fill(INPUT)
        c.border = BOX
    FAC, WINDOW, THRESH, CERTWIN = "Setup!$C$4", "Setup!$C$5", "Setup!$C$6", "Setup!$C$7"

    section(setup, "B10", "Departments")
    for i in range(12):
        c = setup.cell(row=11 + i, column=2, value=DEPARTMENTS[i] if i < len(DEPARTMENTS) else None)
        c.fill = fill(INPUT)
        c.border = BOX
    DEPT_LIST = "=Setup!$B$11:$B$22"

    section(setup, "E10", "Sanitation frequencies")
    header(setup, 11, 5, ["Frequency", "Days"])
    for i, (f, d) in enumerate(FREQUENCIES):
        setup.cell(row=12 + i, column=5, value=f).border = BOX
        c = setup.cell(row=12 + i, column=6, value=d)
        c.fill = fill(INPUT)
        c.border = BOX
    FREQ_LIST, FREQ_TABLE = "=Setup!$E$12:$E$18", "Setup!$E$12:$F$18"

    section(setup, "H10", "CIP limits (set to YOUR validated values)")
    header(setup, 11, 8, ["Parameter", "Min", "Max"])
    for i, (p, lo, hi) in enumerate(CIP_SPECS):
        setup.cell(row=12 + i, column=8, value=p).border = BOX
        for j, v in enumerate((lo, hi)):
            c = setup.cell(row=12 + i, column=9 + j, value=v)
            c.fill = fill(INPUT)
            c.border = BOX
    setup["H18"] = "Leave Max blank when there is no upper limit."
    setup["H18"].font = Font(italic=True, color="777777")

    section(setup, "B25", "Training courses")
    header(setup, 26, 2, ["Course", "Refresher every (months)"])
    for i in range(8):
        cname, months = COURSES[i]
        a = setup.cell(row=27 + i, column=2, value=cname)
        b = setup.cell(row=27 + i, column=3, value=months)
        for c in (a, b):
            c.fill = fill(INPUT)
            c.border = BOX
    widths(setup, {"B": 52, "C": 26, "D": 3, "E": 14, "F": 8, "G": 3, "H": 32, "I": 9, "J": 9})

    # ---------------- Hazard Analysis ----------------
    hz_cols = [
        ("Step #", 7, None, None), ("Process step", 20, None, None), ("Hazard type", 12, None, None),
        ("Hazard description", 30, None, None), ("Likelihood (1–5)", 10, None, None), ("Severity (1–5)", 10, None, None),
        ("Risk score", 8, '=IF(OR(E{r}="",F{r}=""),"",E{r}*F{r})', None),
        ("Significant?", 11, f'=IF(G{{r}}="","",IF(G{{r}}>={THRESH},"YES","NO"))', None),
        ("Justification", 30, None, None), ("Control measure", 28, None, None), ("Control type", 14, None, None),
        ("Q1 Control measure exists?", 11, None, None), ("Q1a Control needed at this step?", 11, None, None),
        ("Q2 Step designed to eliminate / reduce?", 12, None, None), ("Q3 Could contamination reach unacceptable levels?", 13, None, None),
        ("Q4 Will a later step eliminate / reduce?", 12, None, None),
        ("Determination", 20,
         '=IF(H{r}="","",IF(H{r}="NO","Not significant (PRP)",IF(L{r}="","Answer Q1",IF(L{r}="No",IF(M{r}="Yes","MODIFY STEP","Not a CCP"),'
         'IF(N{r}="Yes","CCP",IF(O{r}="","Answer Q3",IF(O{r}="No","Not a CCP",IF(P{r}="","Answer Q4",IF(P{r}="Yes","Not a CCP","CCP")))))))))', None),
    ]
    hz_last = _log(haz, "Hazard Analysis & CCP Decision Tree",
                   "Significant hazards (score ≥ Setup threshold) run through the Codex decision tree. Answer Q1–Q4 with Yes/No.", hz_cols, n=150)
    haz.row_dimensions[4].height = 64
    _dv(haz, '"Biological,Chemical,Allergen,Physical,Radiological"', f"C5:C{hz_last}")
    _dv(haz, '"1,2,3,4,5"', f"E5:F{hz_last}")
    _dv(haz, '"Process,Allergen,Sanitation,Supply-chain,Other / PRP"', f"K5:K{hz_last}")
    _dv(haz, '"Yes,No"', f"L5:P{hz_last}")
    haz.conditional_formatting.add(f"Q5:Q{hz_last}", CellIsRule(operator="equal", formula=['"CCP"'], fill=fill(RED), font=Font(bold=True, color="9B1C1C")))
    haz.conditional_formatting.add(f"Q5:Q{hz_last}", CellIsRule(operator="equal", formula=['"MODIFY STEP"'], fill=fill(AMBER)))
    haz.conditional_formatting.add(f"H5:H{hz_last}", CellIsRule(operator="equal", formula=['"YES"'], fill=fill(AMBER)))

    # ---------------- CCP / PC Plan ----------------
    plan_cols = [("CCP / PC #", 10, None, None), ("Process step", 18, None, None), ("Hazard(s) controlled", 24, None, None),
                 ("Critical limit / parameter", 28, None, None), ("Monitoring: what", 20, None, None),
                 ("Monitoring: how", 22, None, None), ("Frequency", 14, None, None), ("Who", 14, None, None),
                 ("Corrective action", 30, None, None), ("Verification", 30, None, None), ("Records", 22, None, None)]
    plan_last = _log(plan, "CCP & Preventive Control Plan",
                     "One row per CCP or preventive control. Wrap text is on, so rows grow as you type.", plan_cols, n=40)
    for row in plan.iter_rows(min_row=5, max_row=plan_last):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")

    # ---------------- Sanitation Schedule ----------------
    san_cols = [("Department", 18, None, None), ("Equipment / area", 24, None, None), ("Task", 30, None, None),
                ("SSOP #", 9, None, None), ("Frequency", 12, None, None), ("Responsible", 14, None, None),
                ("Last completed", 13, None, DATE),
                ("Next due", 13, f'=IF(OR(G{{r}}="",E{{r}}=""),"",G{{r}}+VLOOKUP(E{{r}},{FREQ_TABLE},2,FALSE))', DATE),
                ("Days until due", 9, '=IF(H{r}="","",H{r}-TODAY())', "0"),
                ("Status", 13, f'=IF(C{{r}}="","",IF(G{{r}}="","NOT STARTED",IF(I{{r}}<0,"OVERDUE",IF(I{{r}}<=MIN({WINDOW},VLOOKUP(E{{r}},{FREQ_TABLE},2,FALSE)/4),"DUE SOON","OK"))))', None)]
    san_last = _log(san, "Master Sanitation Schedule",
                    "Enter the date each task was last completed. Next due date and status calculate automatically.", san_cols)
    _dv(san, DEPT_LIST, f"A5:A{san_last}")
    _dv(san, FREQ_LIST, f"E5:E{san_last}")
    _status_colors(san, f"J5:J{san_last}", bad=["OVERDUE"], warn=["DUE SOON", "NOT STARTED"], good=["OK"])

    # ---------------- CIP Verification ----------------
    lim = {k: (f"Setup!$I${12 + i}", f"Setup!$J${12 + i}") for i, k in enumerate(["caus", "ctemp", "ctime", "acid", "san"])}

    def within(cell, key):
        lo, hi = lim[key]
        return f'AND({cell}>={lo},OR({hi}="",{cell}<={hi}))'

    fails = "&".join([
        f'IF(D{{r}}<>"Yes","Pre-rinse; ","")',
        f'IF(NOT({within("E{r}", "caus")}),"Caustic %; ","")',
        f'IF(NOT({within("F{r}", "ctemp")}),"Caustic temp; ","")',
        f'IF(NOT({within("G{r}", "ctime")}),"Caustic time; ","")',
        f'IF(NOT({within("H{r}", "acid")}),"Acid %; ","")',
        f'IF(NOT({within("I{r}", "san")}),"Sanitizer ppm; ","")',
        'IF(J{r}<>"Pass","Visual; ","")'])
    cip_cols = [("Date", 12, None, DATE), ("Circuit / equipment", 20, None, None), ("Operator", 12, None, None),
                ("Pre-rinse clear?", 9, None, None), ("Caustic %", 9, None, "0.00"), ("Caustic temp °F", 9, None, "0"),
                ("Caustic time (min)", 9, None, "0"), ("Acid %", 8, None, "0.00"), ("Sanitizer ppm", 9, None, "0"),
                ("Visual inspection", 10, None, None),
                ("Result", 12, '=IF(A{r}="","",IF(COUNT(E{r}:I{r})<5,"INCOMPLETE",IF(LEN(L{r})=0,"PASS","FAIL")))', None),
                ("Failed parameter(s)", 26, '=IF(OR(A{r}="",COUNT(E{r}:I{r})<5),"",' + fails + ')', None),
                ("Verified by", 12, None, None)]
    cip_last = _log(cip, "CIP Verification Log",
                    "Each cycle is checked against the CIP limits on Setup. A FAIL names the parameter(s) out of spec.", cip_cols)
    _dv(cip, '"Yes,No"', f"D5:D{cip_last}")
    _dv(cip, '"Pass,Fail"', f"J5:J{cip_last}")
    _status_colors(cip, f"K5:K{cip_last}", bad=["FAIL"], warn=["INCOMPLETE"], good=["PASS"])

    # ---------------- EMP Log ----------------
    emp_cols = [("Date", 12, None, DATE), ("Zone", 7, None, None), ("Site ID", 10, None, None),
                ("Location description", 28, None, None), ("Test", 14, None, None), ("Result", 11, None, None),
                ("Vector swabs taken?", 10, None, None), ("CAPA #", 10, None, None), ("Retest date", 12, None, DATE),
                ("Retest result", 11, None, None),
                ("Flag", 16, '=IF(F{r}<>"Positive","",IF(B{r}=1,"ZONE 1 POSITIVE",IF(J{r}="Negative","Cleared","OPEN POSITIVE")))', None)]
    emp_last = _log(emp, "Environmental Monitoring Log",
                    "Zone 1 = food contact · 2 = near food contact · 3 = non-contact in processing area · 4 = outside processing area.", emp_cols)
    _dv(emp, '"1,2,3,4"', f"B5:B{emp_last}")
    _dv(emp, '"Listeria spp.,L. monocytogenes,Salmonella,APC,ATP,Other"', f"E5:E{emp_last}")
    _dv(emp, '"Negative,Positive"', f"F5:F{emp_last}")
    _dv(emp, '"Negative,Positive"', f"J5:J{emp_last}")
    _dv(emp, '"Yes,No"', f"G5:G{emp_last}")
    _status_colors(emp, f"K5:K{emp_last}", bad=["ZONE 1 POSITIVE", "OPEN POSITIVE"], warn=[], good=["Cleared"])
    emp.conditional_formatting.add(f"F5:F{emp_last}", CellIsRule(operator="equal", formula=['"Positive"'], fill=fill(RED)))

    # ---------------- CAPA Register ----------------
    capa_cols = [("CA #", 9, None, None), ("Opened", 12, None, DATE), ("Source", 18, None, None), ("Department", 16, None, None),
                 ("Non-conformance", 30, None, None), ("Root cause", 26, None, None), ("Correction / containment", 24, None, None),
                 ("Corrective action", 26, None, None), ("Preventive action", 24, None, None), ("Owner", 12, None, None),
                 ("Due date", 12, None, DATE), ("Closed", 12, None, DATE), ("Effective?", 10, None, None),
                 ("Status", 11, '=IF(A{r}="","",IF(L{r}<>"","CLOSED",IF(AND(K{r}<>"",K{r}<TODAY()),"OVERDUE","OPEN")))', None),
                 ("Days open", 8, '=IF(OR(A{r}="",B{r}=""),"",IF(L{r}<>"",L{r}-B{r},TODAY()-B{r}))', "0")]
    capa_last = _log(capa, "Corrective & Preventive Action Register",
                     "Every non-conformance from audits, deviations, complaints and EMP positives, tracked to verified closure.", capa_cols)
    _dv(capa, '"' + ",".join(CAPA_SOURCES) + '"', f"C5:C{capa_last}")
    _dv(capa, DEPT_LIST, f"D5:D{capa_last}")
    _dv(capa, '"Yes,No,Pending"', f"M5:M{capa_last}")
    _status_colors(capa, f"N5:N{capa_last}", bad=["OVERDUE"], warn=["OPEN"], good=["CLOSED"])

    # ---------------- Supplier Approval ----------------
    sup_cols = [("Supplier", 22, None, None), ("Material / service", 22, None, None), ("Risk", 9, None, None),
                ("Allergens", 14, None, None), ("GFSI scheme", 11, None, None), ("Cert expiry", 12, None, DATE),
                ("COA required?", 9, None, None), ("Letter of guarantee?", 10, None, None), ("Last review", 12, None, DATE),
                ("Review every (months)", 10, None, "0"),
                ("Next review", 12, '=IF(OR(I{r}="",J{r}=""),"",EDATE(I{r},J{r}))', DATE),
                ("Status", 15,
                 f'=IF(A{{r}}="","",IF(AND(E{{r}}<>"None",E{{r}}<>"",F{{r}}<>"",F{{r}}<TODAY()),"CERT EXPIRED",'
                 f'IF(E{{r}}="","MISSING CERT",IF(AND(K{{r}}<>"",K{{r}}<TODAY()),"REVIEW OVERDUE",'
                 f'IF(OR(AND(E{{r}}<>"None",F{{r}}<>"",F{{r}}-TODAY()<={CERTWIN}),AND(K{{r}}<>"",K{{r}}-TODAY()<={WINDOW})),"EXPIRING SOON","APPROVED")))))', None)]
    sup_last = _log(sup, "Approved Supplier List",
                    "Suggested review interval: High risk 12 months · Medium 24 · Low 36. Adjust to your supplier program.", sup_cols, n=150)
    _dv(sup, '"High,Medium,Low"', f"C5:C{sup_last}")
    _dv(sup, '"' + ",".join(SCHEMES) + '"', f"E5:E{sup_last}")
    _dv(sup, '"Yes,No"', f"G5:H{sup_last}")
    _status_colors(sup, f"L5:L{sup_last}", bad=["CERT EXPIRED", "REVIEW OVERDUE", "MISSING CERT"], warn=["EXPIRING SOON"], good=["APPROVED"])

    # ---------------- Training Matrix ----------------
    title(trn, "Training Matrix", "Enter the date each person completed each course. Red = expired · Amber = due within the window · Grey = not trained.", 14)
    trn["A3"] = "Refresher (months) →"
    trn["A3"].font = Font(italic=True, color="777777")
    header(trn, 4, 1, ["Employee", "Role", "Department", "% current"])
    for i in range(8):
        c = trn.cell(row=4, column=5 + i, value=f"=Setup!B{27 + i}")
        c.font = Font(bold=True, color=WHITE)
        c.fill = fill(MID)
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True, text_rotation=0)
        c.border = BOX
        trn.cell(row=3, column=5 + i, value=f"=Setup!C{27 + i}").alignment = Alignment(horizontal="center")
    trn.row_dimensions[4].height = 48
    trn.freeze_panes = "E5"
    N_EMP = 150
    for r in range(5, 5 + N_EMP):
        trn.cell(row=r, column=4,
                 value=f'=IF(A{r}="","",SUMPRODUCT(--(E{r}:L{r}<>""),--(E{r}:L{r}+$E$3:$L$3*30.44>=TODAY()))/COUNTA(Setup!$B$27:$B$34))').number_format = "0%"
        trn.cell(row=r, column=4).font = Font(bold=True)
        for c in range(1, 13):
            trn.cell(row=r, column=c).border = BOX
            if c >= 5:
                trn.cell(row=r, column=c).number_format = "mm/dd/yy"
                trn.cell(row=r, column=c).alignment = Alignment(horizontal="center")
    tl = 4 + N_EMP
    trn.conditional_formatting.add(f"E5:L{tl}", FormulaRule(formula=[f'AND($A5<>"",E5="")'], fill=fill("E5E7EB")))
    trn.conditional_formatting.add(f"E5:L{tl}", FormulaRule(formula=['AND(E5<>"",E5+E$3*30.44<TODAY())'], fill=fill(RED)))
    trn.conditional_formatting.add(f"E5:L{tl}", FormulaRule(formula=[f'AND(E5<>"",E5+E$3*30.44-TODAY()<={WINDOW}*2)'], fill=fill(AMBER)))
    trn.conditional_formatting.add(f"D5:D{tl}", DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="2E7D5B"))
    _dv(trn, DEPT_LIST, f"C5:C{tl}")
    widths(trn, {"A": 22, "B": 16, "C": 18, "D": 10, **{col(5 + i): 13 for i in range(8)}})

    # ---------------- Audit Readiness ----------------
    title(aud, "Audit Readiness Self-Assessment", "Answer Yes / Partial / No / N/A. Scores: Yes = 1, Partial = 0.5, No = 0. N/A is excluded.", 8)
    header(aud, 4, 1, ["#", "Requirement", "Answer", "Score", "Evidence / notes", "Owner", "Target date"])
    aud.freeze_panes = "C5"
    r = 5
    sec_rows = []
    for s_i, (sec, items) in enumerate(CHECKLIST.items(), start=1):
        c = aud.cell(row=r, column=1, value=s_i)
        c.font = Font(bold=True, color=WHITE)
        c.fill = fill(DARK)
        c = aud.cell(row=r, column=2, value=sec)
        c.font = Font(bold=True, color=WHITE)
        for cc in range(1, 8):
            aud.cell(row=r, column=cc).fill = fill(DARK)
        first = r + 1
        for k, item in enumerate(items, start=1):
            r += 1
            aud.cell(row=r, column=1, value=f"{s_i}.{k}")
            aud.cell(row=r, column=2, value=item).alignment = Alignment(wrap_text=True, vertical="top")
            aud.cell(row=r, column=3).fill = fill(INPUT)
            aud.cell(row=r, column=4, value=f'=IF(C{r}="Yes",1,IF(C{r}="Partial",0.5,IF(C{r}="No",0,"")))')
            aud.cell(row=r, column=7).number_format = DATE
            for cc in range(1, 8):
                aud.cell(row=r, column=cc).border = BOX
            aud.row_dimensions[r].height = 30
        sec_rows.append((sec, first, r))
        r += 2
    aud_last = r
    _dv(aud, '"Yes,Partial,No,N/A"', f"C5:C{aud_last}")
    aud.conditional_formatting.add(f"C5:C{aud_last}", CellIsRule(operator="equal", formula=['"No"'], fill=fill(RED)))
    aud.conditional_formatting.add(f"C5:C{aud_last}", CellIsRule(operator="equal", formula=['"Partial"'], fill=fill(AMBER)))
    aud.conditional_formatting.add(f"C5:C{aud_last}", CellIsRule(operator="equal", formula=['"Yes"'], fill=fill(GREEN)))
    widths(aud, {"A": 6, "B": 70, "C": 10, "D": 7, "E": 36, "F": 14, "G": 13})

    # ---------------- Dashboard ----------------
    title(dash, "Food Safety Program Dashboard", None, 12)
    dash["B2"] = f'={FAC}&"  ·  as of "&TEXT(TODAY(),"mmm d, yyyy")'
    dash["B2"].font = Font(italic=True, color="CFE3D8")
    all_scores = f"'Audit Readiness'!$D$5:$D${aud_last}"
    kpis = [
        ("Audit readiness", f'=IF(COUNT({all_scores})=0,"—",SUM({all_scores})/COUNT({all_scores}))', PCT),
        ("Open CAPAs", f"=COUNTIF('CAPA Register'!$N$5:$N${capa_last},\"OPEN\")+COUNTIF('CAPA Register'!$N$5:$N${capa_last},\"OVERDUE\")", "0"),
        ("Overdue CAPAs", f"=COUNTIF('CAPA Register'!$N$5:$N${capa_last},\"OVERDUE\")", "0"),
        ("Sanitation overdue", f"=COUNTIF('Sanitation Schedule'!$J$5:$J${san_last},\"OVERDUE\")", "0"),
        ("Sanitation due soon", f"=COUNTIF('Sanitation Schedule'!$J$5:$J${san_last},\"DUE SOON\")", "0"),
        ("CIP pass rate (30 days)",
         f"=IFERROR(COUNTIFS('CIP Verification'!$K$5:$K${cip_last},\"PASS\",'CIP Verification'!$A$5:$A${cip_last},\">=\"&(TODAY()-30))"
         f"/(COUNTIFS('CIP Verification'!$K$5:$K${cip_last},\"PASS\",'CIP Verification'!$A$5:$A${cip_last},\">=\"&(TODAY()-30))"
         f"+COUNTIFS('CIP Verification'!$K$5:$K${cip_last},\"FAIL\",'CIP Verification'!$A$5:$A${cip_last},\">=\"&(TODAY()-30))),\"—\")", PCT),
        ("Supplier issues",
         f"=COUNTIF('Supplier Approval'!$L$5:$L${sup_last},\"CERT EXPIRED\")+COUNTIF('Supplier Approval'!$L$5:$L${sup_last},\"REVIEW OVERDUE\")"
         f"+COUNTIF('Supplier Approval'!$L$5:$L${sup_last},\"MISSING CERT\")", "0"),
        ("Training current", f"=IFERROR(AVERAGE('Training Matrix'!$D$5:$D${tl}),\"—\")", PCT),
        ("EMP positives (90 days)",
         f"=COUNTIFS('EMP Log'!$F$5:$F${emp_last},\"Positive\",'EMP Log'!$A$5:$A${emp_last},\">=\"&(TODAY()-90))", "0"),
        ("Open EMP positives",
         f"=COUNTIF('EMP Log'!$K$5:$K${emp_last},\"OPEN POSITIVE\")+COUNTIF('EMP Log'!$K$5:$K${emp_last},\"ZONE 1 POSITIVE\")", "0"),
    ]
    for i, (lab, f, fmt) in enumerate(kpis):
        rr, cc = 4 + (i // 5) * 3, 2 + (i % 5) * 2
        dash.merge_cells(start_row=rr, start_column=cc, end_row=rr, end_column=cc + 1)
        dash.merge_cells(start_row=rr + 1, start_column=cc, end_row=rr + 1, end_column=cc + 1)
        c = dash.cell(row=rr, column=cc, value=lab)
        c.font = Font(bold=True, color=WHITE)
        c.fill = fill(MID)
        c.alignment = Alignment(horizontal="center")
        dash.cell(row=rr, column=cc + 1).fill = fill(MID)
        v = dash.cell(row=rr + 1, column=cc, value=f)
        v.number_format = fmt
        v.font = Font(bold=True, size=18, color=DARK)
        v.alignment = Alignment(horizontal="center", vertical="center")
        v.fill = fill(LIGHT)
        dash.cell(row=rr + 1, column=cc + 1).fill = fill(LIGHT)
        dash.row_dimensions[rr + 1].height = 34
    for rng in ("F5", "H5", "D8", "J8"):  # colour alarm tiles red when non-zero
        dash.conditional_formatting.add(rng, CellIsRule(operator="greaterThan", formula=["0"], fill=fill(RED), font=Font(bold=True, size=18, color="9B1C1C")))

    section(dash, "B11", "Audit readiness by program area")
    header(dash, 12, 2, ["Program area", "", "", "Answered", "Readiness"])
    dash.merge_cells("B12:D12")
    for i, (sec, a, b) in enumerate(sec_rows):
        rr = 13 + i
        dash.merge_cells(start_row=rr, start_column=2, end_row=rr, end_column=4)
        dash.cell(row=rr, column=2, value=sec)
        rng = f"'Audit Readiness'!$D${a}:$D${b}"
        crng = f"'Audit Readiness'!$C${a}:$C${b}"
        dash.cell(row=rr, column=5, value=f'=COUNTA({crng})&" / {b - a + 1}"').alignment = Alignment(horizontal="center")
        dash.cell(row=rr, column=6, value=f'=IF(COUNT({rng})=0,0,SUM({rng})/COUNT({rng}))').number_format = "0%"
        for cc in range(2, 7):
            dash.cell(row=rr, column=cc).border = BOX
    sl = 12 + len(sec_rows)
    dash.conditional_formatting.add(f"F13:F{sl}", DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="2E7D5B"))

    section(dash, "H11", "Action list")
    actions = [
        ("Overdue CAPAs", "CAPA Register", "OVERDUE"),
        ("Overdue sanitation", "Sanitation Schedule", "OVERDUE"),
        ("CIP failures", "CIP Verification", "FAIL"),
        ("Open EMP positives", "EMP Log", "Flag column"),
        ("Supplier documents", "Supplier Approval", "not APPROVED"),
        ("Expired training", "Training Matrix", "red cells"),
        ("Audit gaps", "Audit Readiness", "No / Partial"),
    ]
    header(dash, 12, 8, ["Item", "", "Where to look", "", ""])
    dash.merge_cells("H12:I12")
    dash.merge_cells("J12:L12")
    for i, (a, b, c_) in enumerate(actions):
        rr = 13 + i
        dash.merge_cells(start_row=rr, start_column=8, end_row=rr, end_column=9)
        dash.merge_cells(start_row=rr, start_column=10, end_row=rr, end_column=12)
        dash.cell(row=rr, column=8, value=a)
        dash.cell(row=rr, column=10, value=f"{b} → {c_}")
        for cc in range(8, 13):
            dash.cell(row=rr, column=cc).border = BOX

    ch = BarChart()
    ch.type = "bar"
    ch.title = "Readiness by program area"
    ch.legend = None
    ch.height = 9
    ch.width = 13.5
    ch.add_data(Reference(dash, min_col=6, min_row=13, max_row=sl), titles_from_data=False)
    ch.set_categories(Reference(dash, min_col=2, min_row=13, max_row=sl))
    ch.x_axis.scaling.orientation = "maxMin"
    ch.y_axis.scaling.min = 0
    ch.y_axis.scaling.max = 1
    ch.y_axis.number_format = "0%"
    dash.add_chart(ch, f"H{14 + len(actions)}")
    widths(dash, {"A": 3, **{col(c): 13 for c in range(2, 13)}})

    for ws in (setup,):
        ws.sheet_properties.tabColor = "F2C94C"
    dash.sheet_properties.tabColor = DARK
    for ws in (haz, plan, san, cip, emp, capa, sup, trn, aud):
        ws.sheet_properties.tabColor = MID

    if sample:
        _sample(today, haz, plan, san, cip, emp, capa, sup, trn, aud)
    wb.active = 0
    if hook:
        hook(wb)
    wb.save(path)


def _status_colors(ws, rng, bad, warn, good):
    for words, color in ((bad, RED), (warn, AMBER), (good, GREEN)):
        for w in words:
            ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=[f'"{w}"'], fill=fill(color)))


def _sample(today, haz, plan, san, cip, emp, capa, sup, trn, aud):
    rnd = random.Random(11)
    d = lambda n: today - dt.timedelta(days=n)  # noqa: E731
    hazards = [
        (1, "Raw milk receiving", "Biological", "Vegetative pathogens (Salmonella, E. coli O157:H7, L. mono)", 5, 5, "Pathogens are reasonably likely in raw milk", "HTST pasteurization (step 6)", "Process", "Yes", None, "No", "Yes", "Yes"),
        (1, "Raw milk receiving", "Chemical", "Beta-lactam drug residues", 3, 4, "PMO requires testing of every tanker", "Antibiotic screen before unloading", "Supply-chain", "Yes", None, "Yes", None, None),
        (3, "Raw storage silo", "Biological", "Pathogen growth from temperature abuse", 1, 4, "Held ≤ 45°F under the SSOP", "Silo temperature monitoring (PRP)", "Other / PRP", None, None, None, None, None),
        (6, "HTST pasteurization", "Biological", "Survival of vegetative pathogens", 5, 5, "Inadequate time/temperature leads to survival", "161°F / 15 s with flow diversion", "Process", "Yes", None, "Yes", None, None),
        (7, "Ingredient addition", "Allergen", "Undeclared allergen from cross-contact", 3, 4, "Shared line with nut-containing product", "Allergen changeover and label check", "Allergen", "Yes", None, "No", "Yes", "No"),
        (9, "Filling", "Biological", "Post-pasteurization contamination (L. mono)", 3, 5, "Exposed product in a RTE environment", "Sanitation controls + EMP", "Sanitation", "Yes", None, "No", "Yes", "No"),
        (10, "Metal detection", "Physical", "Metal fragments from equipment wear", 3, 4, "Pumps, valves and fillers upstream", "Metal detector with reject verification", "Process", "Yes", None, "Yes", None, None),
        (11, "Case packing", "Physical", "Glass / brittle plastic", 1, 3, "Glass policy; no glass in the area", "Glass & brittle plastic program", "Other / PRP", None, None, None, None, None),
    ]
    for i, h in enumerate(hazards):
        r = 5 + i
        _put(haz, r, h[:6])
        _put(haz, r, h[6:], start_col=9)
    ccps = [
        ("CCP 1B", "HTST pasteurization", "Vegetative pathogens", "≥ 161°F for ≥ 15 s (per PMO); FDD diverts below the setpoint",
         "Recorder chart temperature", "Recording thermometer + FDD", "Continuous", "HTST operator",
         "Divert, hold product, notify QA, determine disposition, CAPA", "Daily chart review; regulatory seal tests", "HTST charts, cut-in/cut-out log"),
        ("CCP 2P", "Metal detection", "Metal fragments", "Detects Fe 2.0 mm, NFe 2.5 mm, SS 3.0 mm test pieces; reject works",
         "Test piece detection", "Pass test wands through the aperture", "Start-up, every 2 h, changeover, end", "Line lead",
         "Hold product since last good check, re-screen, repair", "QA daily record review, annual validation", "MD check log"),
        ("PC-A1", "Ingredient addition", "Undeclared allergen", "Label matches formula; changeover sign-off completed",
         "Label and allergen changeover", "Visual label check vs. formula", "Each run / changeover", "QA tech",
         "Hold and relabel or destroy, investigate", "Weekly record review", "Label check sheet"),
    ]
    for i, c in enumerate(ccps):
        _put(plan, 5 + i, c)
    tasks = [("Pasteurization", "HTST plate heat exchanger", "CIP + inspect gaskets", "SSOP-12", "Daily", 0),
             ("Filling / Packaging", "Filler bowl & valves", "Disassemble, clean, sanitize", "SSOP-20", "Daily", 1),
             ("Filling / Packaging", "Overhead structures", "Foam clean and sanitize", "SSOP-31", "Weekly", 9),
             ("Raw Processing", "Silo exteriors & catwalks", "Wash down", "SSOP-08", "Weekly", 3),
             ("Warehouse", "Cooler floor drains", "Scrub, sanitize, quat block", "SSOP-40", "Weekly", 6),
             ("Warehouse", "Cooler evaporator coils", "Clean coils and drip pans", "SSOP-41", "Monthly", 34),
             ("Receiving", "Tanker bay", "Wash down, sanitize hoses", "SSOP-03", "Daily", 0),
             ("QA Lab", "Lab benches & incubators", "Clean and disinfect", "SSOP-50", "Weekly", 2),
             ("Filling / Packaging", "Case conveyors", "Detail clean", "SSOP-22", "Monthly", 20),
             ("Maintenance", "Maintenance shop", "Clean and organize", "SSOP-60", "Monthly", 40),
             ("Raw Processing", "Ceiling & lights", "High-level clean", "SSOP-70", "Quarterly", 70),
             ("Pasteurization", "Homogenizer", "Disassemble and inspect", "SSOP-14", "Weekly", 5)]
    for i, t in enumerate(tasks):
        _put(san, 5 + i, list(t[:5]) + [rnd.choice(["J. Ortiz", "M. Chen", "Sanitation crew"]), d(t[5])])
    r = 5
    for n in range(35, -1, -1):
        for circ in ("Raw silo 1", "HTST", "Filler 2"):
            vals = [d(n), circ, rnd.choice(["A. Diaz", "K. Lee", "R. Patel"]), "Yes",
                    round(rnd.uniform(1.2, 2.0), 2), rnd.randint(162, 172), rnd.randint(10, 15),
                    round(rnd.uniform(0.6, 1.2), 2), rnd.randint(155, 195), "Pass", None, None, "QA"]
            if rnd.random() < 0.04:
                vals[5] = 154  # low caustic temp
            if rnd.random() < 0.02:
                vals[4] = 0.8
            _put(cip, r, vals)
            r += 1
    emps = [(d(80), 3, "Z3-14", "Filler room floor drain", "Listeria spp.", "Positive", "Yes", "CA-104", d(76), "Negative"),
            (d(40), 2, "Z2-05", "Filler frame underside", "Listeria spp.", "Positive", "Yes", "CA-109", d(37), "Negative"),
            (d(12), 3, "Z3-02", "Cooler door threshold", "Listeria spp.", "Positive", "Yes", "CA-112", None, None)]
    r = 5
    for n in range(84, 0, -7):
        for site, zone, loc in (("Z1-01", 1, "Filler nozzle guard"), ("Z2-05", 2, "Filler frame underside"),
                                ("Z3-14", 3, "Filler room floor drain"), ("Z4-01", 4, "Warehouse forklift tires")):
            _put(emp, r, [d(n), zone, site, loc, "Listeria spp.", "Negative"])
            r += 1
    for e in emps:
        _put(emp, r, e)
        r += 1
    capas = [("CA-104", d(80), "EMP positive", "Filling / Packaging", "Zone 3 Listeria spp. positive, filler room drain", "Cracked drain grate harboring residue", "Intensified cleaning and vector swabs", "Replaced drain grate", "Added drain inspection to weekly PM", "J. Ortiz", d(60), d(58), "Yes"),
             ("CA-109", d(40), "EMP positive", "Filling / Packaging", "Zone 2 positive, filler frame", "Hollow frame tube not sealed", "Clean/sanitize, retest", "Sealed tube ends", "Hygienic design review for new equipment", "M. Chen", d(20), d(22), "Yes"),
             ("CA-110", d(33), "Internal audit", "Warehouse", "Two expired chemical titration logs", "No backup assigned during PTO", "Logs completed", "Named backup on the schedule", "Add backup column to roles matrix", "R. Patel", d(10), None, "Pending"),
             ("CA-111", d(21), "Customer complaint", "Filling / Packaging", "Leaking cap on half-gallon", "Capper torque drift", "Held 2 lots and inspected", "Recalibrated capper", "Torque check added to hourly checks", "K. Lee", d(-5), None, "Pending"),
             ("CA-112", d(12), "EMP positive", "Warehouse", "Zone 3 positive, cooler door threshold", "Under investigation", "Vector swabs taken, extra cleaning", None, None, "J. Ortiz", d(-2), None, None),
             ("CA-113", d(6), "Process deviation", "Pasteurization", "Diverted flow for 4 min on HTST", "Steam valve sticking", "Product reprocessed", "Valve rebuilt", None, "A. Diaz", d(-14), None, None)]
    for i, c in enumerate(capas):
        _put(capa, 5 + i, c)
    sups = [("Valley Dairy Co-op", "Raw milk", "High", "Milk", "None", None, "No", "Yes", d(200), 12),
            ("SweetCo", "Cane sugar", "Low", "", "FSSC 22000", today + dt.timedelta(days=210), "Yes", "Yes", d(300), 36),
            ("NutriFlavors", "Vanilla flavor", "Medium", "", "SQF", today + dt.timedelta(days=35), "Yes", "Yes", d(400), 24),
            ("PackRight", "HDPE jugs", "Medium", "", "BRCGS", d(15), "No", "Yes", d(500), 24),
            ("CocoaWorks", "Cocoa powder", "High", "Milk (shared line)", "SQF", today + dt.timedelta(days=150), "Yes", "Yes", d(390), 12),
            ("ChemClean", "Sanitation chemicals", "Medium", "", "None", None, "No", "Yes", d(100), 24),
            ("CapSource", "Closures", "Low", "", "IFS", today + dt.timedelta(days=320), "No", "Yes", d(90), 36),
            ("FruitPrep Inc", "Strawberry prep", "High", "", "SQF", today + dt.timedelta(days=260), "Yes", "Yes", d(100), 12)]
    for i, s in enumerate(sups):
        _put(sup, 5 + i, s)
    people = [("A. Diaz", "HTST operator", "Pasteurization"), ("K. Lee", "Filler operator", "Filling / Packaging"),
              ("R. Patel", "Warehouse lead", "Warehouse"), ("J. Ortiz", "Sanitation lead", "Sanitation"),
              ("M. Chen", "QA technician", "QA Lab"), ("S. Brooks", "Maintenance tech", "Maintenance"),
              ("T. Nguyen", "Receiving operator", "Receiving"), ("L. Garcia", "Filler operator", "Filling / Packaging"),
              ("D. Kim", "Sanitation tech", "Sanitation"), ("P. Walsh", "Processing lead", "Raw Processing")]
    for i, p in enumerate(people):
        r = 5 + i
        _put(trn, r, p)
        for j, (_, months) in enumerate(COURSES):
            if rnd.random() < 0.12:
                continue
            age = rnd.randint(10, int(months * 30.44 * 1.1))
            trn.cell(row=r, column=5 + j, value=d(age))
    answers = ["Yes"] * 12 + ["Partial"] * 3 + ["No"]
    for row in aud.iter_rows(min_row=5, max_row=aud.max_row):
        req, ans = row[1], row[2]
        if req.value and isinstance(row[0].value, str):
            ans.value = rnd.choice(answers)


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    build(f"{out}/Food-Safety-Audit-Readiness-Kit.xlsx", sample=False)
    build(f"{out}/Food-Safety-Audit-Readiness-Kit-SAMPLE.xlsx", sample=True)
