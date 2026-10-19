"""Build the Week 10 PDF and a deliberately scoped handoff ZIP.

Requires reportlab and pypdf; run from any directory. Does not modify app sources.
"""
from pathlib import Path
import html
import json
import re
import shutil
import zipfile

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    Preformatted, Image, KeepTogether,
)
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs" / "week10"
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / "Week10_WilissTako_Parts2_4.pdf"
WIDTH = 510
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="ReportBody", fontName="Helvetica", fontSize=9.5,
                          leading=12.5, spaceAfter=6, textColor=colors.HexColor("#243346")))
styles.add(ParagraphStyle(name="ReportSmall", parent=styles["ReportBody"], fontSize=8.3, leading=10))
styles.add(ParagraphStyle(name="ReportH1", parent=styles["Heading1"], fontSize=21, leading=25,
                          textColor=colors.HexColor("#146a8b"), spaceAfter=14, keepWithNext=True))
styles.add(ParagraphStyle(name="ReportH2", parent=styles["Heading2"], fontSize=13, leading=17,
                          textColor=colors.HexColor("#146a8b"), spaceBefore=13, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name="ReportCode", fontName="Courier", fontSize=7.5, leading=10,
                          backColor=colors.HexColor("#eef3f6"), borderPadding=7, spaceAfter=9))


def plain(value):
    return (value.replace("\u2014", " - ").replace("\u2013", "-")
            .replace("\u2019", "'").replace("\u2018", "'")
            .replace("\u201c", '"').replace("\u201d", '"')
            .replace("\u2192", " > ").replace("\u00b7", " | ")
            .replace("\u2265", ">=").replace("\u00d7", " x ")
            .replace("\u00a0", " "))


def inline(value):
    value = html.escape(plain(value))
    def link(match):
        label, url = match.groups()
        if url.startswith("https://"):
            return f'<link href="{url}" color="#146a8b">{label}</link>'
        return label
    value = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, value)
    value = re.sub(r"`([^`]+)`", r'<font name="Courier" size="8">\1</font>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    return value


def paragraph(value, small=False):
    return Paragraph(inline(value), styles["ReportSmall" if small else "ReportBody"])


def markdown(text):
    flow = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith("```"):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(plain(lines[i]))
                i += 1
            # Wrap long code lines without clipping the printed page.
            wrapped = []
            for row in code:
                while len(row) > 105:
                    split = row.rfind(" ", 0, 105)
                    split = split if split > 40 else 105
                    wrapped.append(row[:split])
                    row = "  " + row[split:].lstrip()
                wrapped.append(row)
            flow.append(KeepTogether([Preformatted("\n".join(wrapped), styles["ReportCode"])]))
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r"[:\- ]+", cell) for cell in cells):
                    rows.append(cells)
                i += 1
            count = max(map(len, rows))
            ratios = [0.33, 0.67] if count == 2 else [0.29, 0.28, 0.43]
            widths = [WIDTH * (ratios[j] if count in (2, 3) else 1 / count) for j in range(count)]
            data = [[paragraph(cell, small=True) for cell in row] for row in rows]
            table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0eef4")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f6f8fa")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.HexColor("#b4cdd9")),
            ]))
            flow.extend([table, Spacer(1, 9)])
            continue
        if line.startswith("# "):
            flow.append(Paragraph(inline(line[2:]), styles["ReportH1"]))
        elif line.startswith("## "):
            flow.append(Paragraph(inline(line[3:]), styles["ReportH2"]))
        elif line.startswith("- "):
            flow.append(Paragraph("&#8226; " + inline(line[2:]), styles["ReportBody"]))
        else:
            flow.append(paragraph(line))
        i += 1
    return flow


def furniture(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#cbd8e0"))
    canvas.line(42, 758, 552, 758)
    canvas.setFillColor(colors.HexColor("#526579"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(42, 769, "CARECONNECT / SWEN 661 / WEEK 10")
    canvas.drawString(42, 28, "Wiliss Tako | Parts 2 and 4 + PWA | 20 October 2026")
    canvas.drawRightString(552, 28, str(doc.page))
    canvas.restoreState()


story = []
for index, name in enumerate([
    "PART2_WEB_ACCESSIBILITY.md", "PART4_IMPLEMENTATION.md",
    "PWA_IMPLEMENTATION.md", "TEST_RESULTS.md", "SUBMISSION_CHECKLIST.md",
]):
    if index:
        story.append(PageBreak())
    story.extend(markdown((DOCS / name).read_text(encoding="utf-8")))
doc = SimpleDocTemplate(str(PDF), pagesize=(594, 792), leftMargin=42,
                        rightMargin=42, topMargin=49, bottomMargin=43,
                        title="CareConnect Week 10 - Parts 2 and 4 with PWA",
                        author="Wiliss Tako")
doc.build(story, onFirstPage=furniture, onLaterPages=furniture)
reader = PdfReader(str(PDF))
assert all(page.extract_text().strip() for page in reader.pages)

handoff = ROOT.parent / "Week10_WilissTako_Parts2_4"
handoff.mkdir(exist_ok=True)
# The fixed output directory belongs to this script; no recursive removal is used.
shutil.copy2(PDF, handoff / PDF.name)
shutil.copytree(DOCS, handoff / "docs" / "week10", dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("__pycache__"))
shutil.copytree(ROOT / "web", handoff / "web", dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("node_modules", "dist", "test-results", "playwright-report", ".shots", ".vscode", ".env", ".env.local"))
shutil.copytree(ROOT / "web" / "dist", handoff / "production-web", dirs_exist_ok=True)
start = """# CareConnect Week 10 - Wiliss Tako

This package supplies Parts 2 and 4 plus the working PWA. It is not the team's complete assignment: teammates must add Part 1 (Figma) and Part 3 (performance/SEO).

- Week10_WilissTako_Parts2_4.pdf: readable report, including all Part 2 topics and testing limits.
- docs/week10/: editable reports, raw test results and unedited screenshots.
- web/: React/Vite application source, tests and dependency lockfile. Dependencies are deliberately excluded.
- production-web/: ready-to-host production build. Use HTTPS at the domain root with SPA fallback; do not open index.html as a file.

Run locally with Node 22.12+ or another Vite 8-supported version: open a terminal in web, run npm ci, npm run build, then npm run preview. Use fictional details to create a local demo account, select Caregiver, and try Dashboard and Medications. This is not real clinical software or production authentication.

For reproducible verification, stop preview and run npm run lint and npm run test:e2e. Tests use installed Edge by default and require port 4173. See the reports for other browser instructions.

34 browser tests passed; 27 axe reports contain zero violations and two retained contrast-incomplete findings with additional measured evidence. No manual screen-reader session, real device run or OS-level install is claimed. Review the package before submission and retain the tool-assistance disclosure.

Branch: feat/wiliss-wk10-web-a11y-pwa. Refer to the repository pull request for the current review status. Verification results describe the tested Week 10 implementation snapshot.
"""
(handoff / "START_HERE.md").write_text(start, encoding="utf-8")
archive = ROOT.parent / "Week10_WilissTako_Parts2_4.zip"
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as output:
    for file in sorted(handoff.rglob("*")):
        if file.is_file():
            output.write(file, Path(handoff.name) / file.relative_to(handoff))
print(json.dumps({"pdf": str(PDF), "pages": len(reader.pages), "handoff": str(handoff),
                  "zip": str(archive), "zip_bytes": archive.stat().st_size}, indent=2))
