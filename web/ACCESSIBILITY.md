# CareConnect web accessibility

The current Week 10 documentation is [Part 2 - Web Accessibility](../docs/week10/PART2_WEB_ACCESSIBILITY.md). It covers the actual semantic structure, ARIA landmarks, global skip link, form validation, keyboard/dialog focus and screen-reader support patterns.

## Implementation map

| Pattern | Source |
| --- | --- |
| Header, navigation, sidebar, main and footer | `src/components/Layout.tsx` |
| Single global skip link, route heading focus and document title | `src/components/RouteAccessibility.tsx` |
| Labels, required state and associated helper/errors | `src/components/Field.tsx` |
| First-invalid-field focus and account error summary | `src/pages/SignIn.tsx`, `SignUp.tsx` |
| Native modal, inert background, Tab wrapping, Escape and restoration | `src/components/Modal.tsx`, `ConfirmDialog.tsx` |
| Prescription articles, form summary and action announcements | `src/pages/ManageMedications.tsx` |
| Offline, update and install feedback | `src/components/PwaStatus.tsx`, `InstallPrompt.tsx` |
| Reflow, focus outlines and reduced motion | `src/index.css` |

Run `npm run build`, then `npm run test:e2e`. The suite starts its own production preview and writes rendered axe results and native screenshots to `../docs/week10/evidence/`. It uses browser-computed styles, including color contrast, and does not disable failing accessibility rules.

[TEST_RESULTS.md](../docs/week10/TEST_RESULTS.md) is the record of the actual test scope. The three core pages are checked at 320, 390, 767, 768, 1023, 1024 and 1440 CSS pixels, with additional form, keyboard and PWA states. Remaining `incomplete` axe items are kept for human inspection.

No new NVDA/VoiceOver session or full WCAG conformance certification is claimed. For manual testing, check headings, landmarks, field names/errors, current-page state, live status and modal focus using the checklist in the Part 2 report.
