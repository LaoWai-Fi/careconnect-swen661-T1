"""Generate Week 12 VPAT sources/Word exports using the existing DOCX formatter."""

from pathlib import Path
import importlib.util
import re
import zipfile
from xml.etree import ElementTree as ET


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
spec = importlib.util.spec_from_file_location(
    "vpat_formatter", ROOT / "docs/week9/generate_vpat_docx.py"
)
formatter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(formatter)


def main():
    historical = (ROOT / "docs/week9/CARECONNECT_DESKTOP_VPAT.md").read_text(
        encoding="utf-8"
    )
    body = historical[historical.index("## Accessibility and UI Testing"): ]
    body = body[:body.index("Editable source:")]
    body = body.replace(
        "This Assignment 9 conformance report",
        "This Week 12 Part 3 conformance report",
    )
    body = re.sub(
        r"(?<!\!)\[([^\]]+)\]\(([^)]+)\)",
        lambda m: (
            m.group(0)
            if m.group(2).startswith(("http:", "https:", "#"))
            else f"[{m.group(1)}](../week9/{m.group(2)})"
        ),
        body,
    )
    desktop = (
        "# Week 12 Part 3 - CareConnect Desktop VPAT\n\n"
        "**SWEN 661 - User Interface Implementation**\n\n"
        "**Assignment 12: Final Project - Complete Documentation**\n\n"
        "**Project:** CareConnect - Electron Desktop\n\n"
        "**Prepared for:** Team 1 Week 12 submission\n\n"
        "**Report revision date:** 2026-11-02\n\n"
        "This Week 12 edition retains the original desktop evaluation baseline. "
        "Week 8/9 references below identify historical evidence, not the current "
        "assignment number. No new manual testing is claimed.\n\n"
        + body
        + "\nEditable source: `docs/week12/DESKTOP_VPAT.md`. "
        "Regenerate all Week 12 Word reports with "
        "`python docs\\week12\\generate_vpats.py`.\n"
    )
    (HERE / "DESKTOP_VPAT.md").write_text(desktop, encoding="utf-8")
    for platform in ("Mobile", "Desktop", "Web"):
        source = HERE / f"{platform.upper()}_VPAT.md"
        text = source.read_text(encoding="utf-8")
        xml, count = formatter.parse_markdown(text)
        assert count == 50, (source, count)
        output = HERE / f"CareConnect_Week12_{platform}_VPAT.docx"
        output.write_bytes(formatter.make_document(xml))
        with zipfile.ZipFile(output) as package:
            assert package.testzip() is None
            document = ET.fromstring(package.read("word/document.xml"))
            content = "".join(document.itertext())
            assert "Week 12" in content
            assert "Assignment 9:" not in content
            for criterion in formatter.CRITERIA:
                assert criterion in content, (output, criterion)
        print(f"Validated {output.name}: Week 12 label, 50 WCAG criteria")


if __name__ == "__main__":
    main()
