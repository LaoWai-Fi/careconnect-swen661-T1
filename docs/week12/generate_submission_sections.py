"""Export the Week 12 guides as editable Word submission sections."""

import importlib.util
from io import BytesIO
from pathlib import Path
import re
import struct
import argparse
import zipfile
from xml.etree import ElementTree as ET


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUTPUT = HERE / "CareConnect_Week12_User_Developer_Documentation.docx"
BASE_URL = (
    "https://github.com/LaoWai-Fi/careconnect-swen661-T1/"
    "blob/89uddinrt-week-9-desktop-vpat/"
)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--complete", action="store_true", help="Export updated guides and all three VPATs.")
    args = parser.parse_args()
    output_path = HERE / "CareConnect_Week12_Part3_Complete.docx" if args.complete else OUTPUT
    spec = importlib.util.spec_from_file_location(
        "formatter", ROOT / "docs" / "week9" / "generate_vpat_docx.py"
    )
    formatter = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(formatter)
    images = []

    def image(match):
        path = (HERE / match.group(2)).resolve()
        data = path.read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"Expected PNG screenshot: {path}")
        width, height = struct.unpack(">II", data[16:24])
        index = len(images) + 1
        images.append((data, width, height, match.group(1)))
        caption = "" if args.complete else f"\n\nFigure {index}. {match.group(1)} (historical project evidence)."
        return f"\nSCREENSHOT_{index}\n{caption}\n"

    def link(match):
        target = match.group(2)
        if not target.startswith(("https://", "http://", "#")):
            file_part, separator, anchor = target.partition("#")
            relative = (HERE / file_part).resolve().relative_to(ROOT)
            target = BASE_URL + relative.as_posix()
            if separator:
                target += "#" + anchor
        return f"{match.group(1)} ({target})"

    user = (HERE / "USER_GUIDE.md").read_text(encoding="utf-8")
    developer = (HERE / "DEVELOPER_GUIDE.md").read_text(encoding="utf-8")
    user = user.replace("# CareConnect — User Guide", "## 3.1 User Documentation", 1)
    developer = developer.replace(
        "# CareConnect — Developer Guide", "## 3.2 Developer Documentation", 1
    )
    diagram = """| Platform | Architecture / data flow |
|---|---|
| Web | User → React + Vite → Browser localStorage |
| Optional web assistant | React web → Supabase Edge Function → Anthropic Messages API |
| Flutter | User → Flutter → Provider / AppState |
| React Native | User → React Native + Expo → Context / useReducer |
| Electron | User → React renderer → Preload contextBridge → Validated IPC → Local JSON and OS services |

Figure D1. CareConnect platform architecture and data boundaries (editable flow table).
"""
    developer = re.sub(r"```mermaid\n.*?```", diagram, developer, flags=re.DOTALL)
    source = (
        "# Week 12 Part 3 - User and Developer Documentation\n\n"
        "SWEN 661 - Team 1\n\n"
        "Copy sections 3.1 and 3.2 into the team Word submission before the VPAT reports. "
        "Existing web and desktop screenshots are embedded below. Current Flutter and "
        "React Native screenshots still need to be added; no new testing is claimed.\n\n"
        + user + "\n\n" + developer
        + "\n\n## 3.3 Accessibility Conformance Reports\n\n"
        "Keep the existing Week 12 mobile and desktop VPAT reports in the submission. "
        "Add the complete Week 12 Web VPAT, including its 50-criterion matrix and limitations. "
        "This guide export does not duplicate the VPAT reports.\n\n"
        "Web VPAT Word file: "
        + BASE_URL + "docs/week12/CareConnect_Week12_Web_VPAT.docx\n\n"
        "Before submission, add actual final-build mobile screenshots. Preserve pending "
        "verification statuses and historical evidence dates.\n"
    )
    if args.complete:
        source = (HERE / "PART3_GUIDES.md").read_text(encoding="utf-8")
        for platform in ("DESKTOP", "MOBILE", "WEB"):
            vpat = (HERE / f"{platform}_VPAT.md").read_text(encoding="utf-8")
            vpat = vpat.replace(
                "Mobile screenshots are not included in this repository's current user-guide evidence",
                "Week 12 Flutter and React Native screenshots are included in section 3.1; screenshots are not screen-reader test evidence",
            )
            vpat = vpat.replace("capture current device screens from Flutter and React Native builds before final submission.", "retain their original evidence provenance.")
            vpat = vpat.replace("The latest merged-main CI", "The historical merged-main CI recorded for this evaluation")
            vpat = vpat.replace("Latest checked main run", "Historical main run checked for this evaluation")
            vpat = vpat.replace("Current CI status", "Historical CI status")
            vpat = vpat.replace(
                "This is the latest main-branch run checked for this report.",
                "This is the historical main-branch run checked for the original desktop evaluation, not the latest Week 12 result.",
            )
            vpat = vpat.replace("## Findings and fixes recorded for Week 9", "## Historical Desktop Accessibility Findings and Fixes (Week 9 Evidence)")
            vpat = vpat.replace("## Week 9 submission evidence", "## Historical Desktop Testing Evidence (Week 9)")
            vpat = vpat.replace(
                "the single live homepage Lighthouse report in docs/week11/evidence/",
                "historical homepage Lighthouse evidence and the Week 12 final Landing/Dashboard production records in docs/week12/evidence/",
            )
            vpat += (
                "\n\nWeek 12 supplemental evidence: "
                "https://github.com/LaoWai-Fi/careconnect-swen661-T1/blob/main/docs/week12/README.md. "
                "Final coverage and functional checks do not replace the historical "
                "assistive-technology evaluations or resolve pending WCAG checks. "
                "Four final Landing/Dashboard production Lighthouse accessibility audits "
                "scored 100; these are not new whole-site WAVE/axe scans.\n"
            )
            source += "\n\n" + vpat
    source = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", image, source)
    source = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, source)
    body, _ = formatter.parse_markdown(source)
    image_relationships = []
    for index, (_, width, height, caption) in enumerate(images, 1):
        scale = min(9.8 * 914400 / width, 4.8 * 914400 / height)
        cx, cy = int(width * scale), int(height * scale)
        drawing = (
            '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing>'
            '<wp:inline distT="0" distB="0" distL="0" distR="0">'
            f'<wp:extent cx="{cx}" cy="{cy}"/>'
            f'<wp:docPr id="{index}" name="Screenshot {index}" '
            f'descr="{formatter.xml_text(caption)}"/>'
            '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
            '<pic:pic><pic:nvPicPr>'
            f'<pic:cNvPr id="{index}" name="Screenshot {index}"/>'
            '<pic:cNvPicPr/></pic:nvPicPr><pic:blipFill>'
            f'<a:blip r:embed="image{index}"/>'
            '<a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
            '<pic:spPr><a:xfrm><a:off x="0" y="0"/>'
            f'<a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
            '</pic:pic></a:graphicData></a:graphic>'
            '</wp:inline></w:drawing></w:r></w:p>'
        )
        body = body.replace(formatter.paragraph(f"SCREENSHOT_{index}", size=19), drawing)
        image_relationships.append(
            f'<Relationship Id="image{index}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
            f'Target="media/screenshot{index}.png"/>'
        )
    namespaces = (
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
    )
    with zipfile.ZipFile(BytesIO(formatter.make_document(body))) as original:
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as output:
            for name in original.namelist():
                data = original.read(name)
                if name == "word/document.xml":
                    data = data.decode().replace("<w:document ", f"<w:document {namespaces} ").encode()
                elif name == "[Content_Types].xml":
                    data = data.decode().replace(
                        "</Types>", '<Default Extension="png" ContentType="image/png"/></Types>'
                    ).encode()
                elif name == "word/_rels/document.xml.rels":
                    data = data.decode().replace(
                        "</Relationships>",
                        '<Relationship Id="styles" '
                        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" '
                        'Target="styles.xml"/>'
                        + "".join(image_relationships) + "</Relationships>",
                    ).encode()
                output.writestr(name, data)
            for index, (data, _, _, _) in enumerate(images, 1):
                output.writestr(f"word/media/screenshot{index}.png", data)

    with zipfile.ZipFile(output_path) as package:
        if package.testzip() is not None:
            raise ValueError("Corrupt Word archive")
        for name in package.namelist():
            if name.endswith((".xml", ".rels")):
                ET.fromstring(package.read(name))
        document = ET.fromstring(package.read("word/document.xml"))
        text = "".join(document.itertext())
        required_text = (
            "3.1 User Documentation", "3.2 Developer Documentation",
            "Week 12", "CareConnect_Week12_Web_VPAT.docx",
        ) if not args.complete else (
            "3.1 User Documentation", "3.2 Developer Documentation",
            "3.3 VPAT Accessibility Conformance Reports",
            "93.89%", "85.90%", "98.44%", "94.56%",
        )
        for required in required_text:
            if required not in text:
                raise ValueError(f"Missing export content: {required}")
        drawings = document.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing")
        if len(drawings) != len(images) or "SCREENSHOT_" in text or "```mermaid" in text:
            raise ValueError("Unresolved image or diagram markup")
        if len(images) != 6:
            raise ValueError(f"Expected six existing screenshots, found {len(images)}")
        if args.complete:
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            matrices = [
                t for t in document.findall(".//w:tbl", ns)
                if "".join(t.find("w:tr", ns).itertext()).startswith("Criterion")
            ]
            if len(matrices) != 3 or any(len(t.findall("w:tr", ns)) != 51 for t in matrices):
                raise ValueError("Expected three complete 50-criterion VPAT matrices")
    print(f"Created {output_path.name}: editable headings/tables, six embedded images, valid DOCX XML.")


if __name__ == "__main__":
    main()
