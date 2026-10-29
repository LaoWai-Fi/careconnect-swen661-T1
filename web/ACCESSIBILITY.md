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

Full WCAG conformance certification is not claimed. The Week 12 work below adds one manual VoiceOver session. NVDA and JAWS were not tested.

## Week 12 manual screen reader session (VoiceOver)

| Item | Detail |
| --- | --- |
| Tester | Dom Puller (Team 1) |
| Date | October 28, 2026 |
| Screen reader and browser | VoiceOver with Safari 26.6.2 (21624.5.1.11.3) |
| Operating system | macOS 26.6.2 (25G83), MacBook Pro 13 inch with Touch Bar |
| Site tested | https://laowai-fi.github.io/careconnect-swen661-T1 |

Tasks covered: landmarks and headings, sign in and form errors, navigation, the Contacts page, appointment add, edit and delete, medication add and remove, Settings (theme, text size, one-handed mode), and the CareConnect Assistant chat dialog.

Results and fixes from the session:

| Finding | Result | Fix |
| --- | --- | --- |
| Chat assistant: speaker not announced, focus lost while waiting, duplicate input name | Fixed and passed on retest | Messages start with "You:" or "Assistant:", focus stays in the field while waiting (`aria-busy`), one accessible name |
| One-handed mode did not move the header buttons | Fixed and passed on retest | `Layout.tsx` renders the menu button first in left mode and last in right mode, with settings, help and sign out on the chosen side |
| Appointment delete gave no spoken result | Fixed in code, retest needed | A polite status region (`role="status"`) announces the result, now through `useAnnouncement` (`src/hooks/useAnnouncement.ts`), which waits 600 ms so the message is not lost when the dialog closes and focus returns to the page |
| Dark mode text contrast (avatars, landing page hero, required asterisk) | Fixed, verified by axe, HTML_CodeSniffer and Playwright | Dark theme overrides in `src/index.css` |

Known limits: the Emergency contact call button is not part of the web version because a browser cannot place a call, so it was not tested. Status messages for appointments and medications rely on `aria-live` timing, which differs between screen readers, so each should be rechecked when the screen reader or browser version changes. WAVE and axe DevTools browser extensions are run manually by the team and recorded in the Week 12 document.
