# SWEN 661 — Week 7 team submission package

Project: CareConnect desktop experience.

Week 7 focus: desktop-specific design and beginning Electron implementation.

Working branch: `week-7`.

## Assignment requirements and evidence

| Required item | Included evidence |
| --- | --- |
| Desktop-specific design system created with Figma AI | [Teammate's Figma Make design](https://www.figma.com/make/qqSJqhacYy5eD8nomjAqnL/Desktop-UI-Build) and [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). The original link is access-restricted; the design owner must grant the instructor access or export the Figma pages. |
| Desktop screen designs for large displays | 1440 × 900 captures in [`evidence/`](evidence/): welcome, overview, medications, messages, shortcut dialog, and light overview. |
| Keyboard-first navigation with menus and toolbars | Implemented menu bar, primary toolbar, sidebar, shortcuts, dialogs, and window controls in [`desktop-electron/src/`](../../desktop-electron/src/); verified in the Electron smoke test. |
| Shortcut and desktop accessibility documentation | [`KEYBOARD_ACCESSIBILITY.md`](KEYBOARD_ACCESSIBILITY.md). |
| Evidence Electron implementation has started | Runnable [`desktop-electron/`](../../desktop-electron/), [`ELECTRON_PROGRESS.md`](ELECTRON_PROGRESS.md), and the 17-check [`electron-smoke-results.json`](evidence/electron-smoke-results.json). |

This is a desktop workflow, not a stretched mobile screen: it uses a persistent navigation rail, menu bar, toolbar, multi-column dashboard/cards, wide medication grid, message workspace, status bar, and resizable 1440 × 900 window. The full design remains in the Figma Make link; these repository screenshots show the implemented prototype.

## Files to hand in

Submit this Week 7 package as **one team assignment**. Include the Figma Make link above, this documentation folder with evidence images, and the `desktop-electron` source (or link to the Week 7 Git branch). If the course system accepts a single archive, use `CareConnect_Week7_Submission.zip` generated beside the repository.

## Human handoff before final submission

1. The Figma design owner should verify that the instructor can open the private Figma Make link, or add exported Figma pages to the submission. A copied code export alone does not prove the instructor can inspect Figma AI history.
2. A teammate should review the design/system wording against the original Figma canvas and confirm the team attribution. I could inspect the copied export but not the private Chrome tab from this environment.
3. Do not describe this prototype as live care software. Authentication, real sync, message delivery, emergency calling, and device screen-reader validation are future implementation work, not Week 7 evidence claimed here.
