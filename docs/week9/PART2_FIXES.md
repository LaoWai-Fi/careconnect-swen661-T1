# Week 9 Part 2 — Accessibility Fixes and Coverage

This document records the Part 2 implementation on `feat/wiliss-wk9-part2-accessibility` against the findings in [`ACCESSIBILITY_TESTING.md`](ACCESSIBILITY_TESTING.md). It covers code changes and automated test evidence; it does not claim that browser-extension screenshots or new manual screen-reader recordings were captured.

## Findings and fixes

| Finding | Change | WCAG 2.1 AA relationship | Regression evidence |
| --- | --- | --- | --- |
| Appointment assignee text was 4.26:1 | Removed reduced opacity from the text. | 1.4.3 Contrast (Minimum) | Post-fix Chrome axe DevTools scans of the appointments screen in dark and light themes each reported zero issues; screenshots are in `evidence/`. |
| Emergency dialog description was 4.47:1 | Changed the description to white on the dark-red emergency panel. | 1.4.3 Contrast (Minimum) | The rendered light-theme emergency dialog reported zero issues in Chrome axe DevTools; screenshot is in `evidence/`. The SOS action was not activated. |
| Hidden attachment input was flagged as a scrollable region | Removed the off-screen `sr-only` input from layout/accessibility navigation using `display: none`; the visible, named Attach button continues to open it. | 2.1.1 Keyboard; 4.1.2 Name, Role, Value | Messages screen and compose form accessibility checks; existing attach workflow tests. |
| Inbox/archive count text lost contrast through opacity | Removed the opacity reduction from both count labels. | 1.4.3 Contrast (Minimum) | Post-fix Chrome axe DevTools scans of the messages screen in dark and light themes each reported zero issues; screenshots are in `evidence/`. |
| Landing page had no level-one heading | Promoted its main title to the page's `h1`. | 1.3.1 Info and Relationships; 2.4.6 Headings and Labels | Landing page axe check. |
| Shell controls and title bar were outside landmarks; sidebar label implied the wrong navigation landmark | Grouped shell chrome in a named banner landmark and renamed the complementary sidebar landmark “Care plan controls.” The landing page title bar was also named as a banner. | 1.3.1 Info and Relationships; 2.4.1 Bypass Blocks | Axe `region` rule is enabled and runs against the landing and signed-in screens. |
| Failed sign-in left focus on Submit | Added first-invalid-field focus behavior and connected field hints/errors with `aria-describedby`; invalid fields expose `aria-invalid`. | 2.4.3 Focus Order; 3.3.1 Error Identification; 3.3.2 Labels or Instructions | Sign-in tests verify focus order, invalid state, and error association. |
| Cmd+N navigated to Messages without opening compose | Routed the shortcut/menu action through the New Message handler and focused the recipient input when compose opens. | 2.1.1 Keyboard; 4.1.2 Name, Role, Value | App-shell shortcut/menu tests verify the compose form opens. |
| Activity Refresh invented a completed check-in | Removed the fabricated activity record; refresh now announces completion without changing activity data. This is a functional data-integrity correction, not a WCAG failure by itself. | No direct WCAG success criterion claimed | Page and workflow tests verify the refresh status and absence of the fake event. |
| Medication toggle did not identify the medication or new state | Added a medication-specific accessible name, pressed state, and live status announcement including the medication and resulting taken/not-taken state. | 4.1.2 Name, Role, Value; 4.1.3 Status Messages | Medication tests verify the accessible name, state, and announcement. |

## Automated verification

Executed from `desktop-electron`:

- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run test:coverage -- --runInBand` — 20 suites and 224 tests passed.
- Coverage: 98.44% lines (1,389/1,411), 97.70% statements, 97.29% functions, and 92.60% branches.
- Automated `jest-axe` checks cover major rendered screens and dialogs with the `region` rule enabled. The `color-contrast` rule is disabled in jsdom because jsdom does not compute rendered styles; this is not evidence of a passing visual contrast scan.

## Still required for complete submission evidence

1. The post-fix axe DevTools scans and screenshots listed in `ACCESSIBILITY_TESTING.md` are complete for the stated screens/themes. They are targeted browser evidence, not a claim that every dialog was scanned in both themes.
2. Keep the real keyboard-only and NVDA/VoiceOver results and recordings in the team's testing evidence. These browser scans do not create or substitute for hands-on device testing.

## AI-use disclosure

An AI assistant helped draft accessibility code changes, regression tests, and this documentation. A team member should review the changes and this statement before submission and remain responsible for the final work.
