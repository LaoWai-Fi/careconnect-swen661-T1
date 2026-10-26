# Week 11 Part 1 completed responsive application

Contributor: Wiliss Tako. Implementation date: 26 October 2026. Branch: `feat/wiliss-wk11-part1-responsive-pwa`. This contribution starts from merged PR #15 (`11450a4c7aabee1e653254795716d40d2068194f`) and retains Dom's caregiver-only routing, Jest/RTL foundation and Pages support.

## Revised design implementation

Design reference: [WebUIBuild-Revised at 0d88315](https://github.com/LaoWai-Fi/WebUIBuild-Revised/tree/0d883152ef52ac8c58da44ebc6d57804a6f9c000). The existing React 18/Vite/Tailwind 3 application is retained; the reference's React 19 scaffold, fake installation/update switches and simulated synchronization are not copied.

| Feature | Working implementation |
| --- | --- |
| Caregiver overview | Daily status, medication taken/undo, check-in, alerts and activity |
| Medications and appointments | Existing accessible add/edit/delete workflows and local persistence |
| Messages | Inbox/archive, read/unread, detail/reply, compose with separate saved reply drafts, confirmation before delete, metadata-only attachment names |
| Display settings | Persisted system/light/dark theme, normal/large/extra-large text, stronger borders/focus and left/right/off one-handed reach |
| Dashboard customization | Show/hide widgets and reorder using keyboard-operable Up/Down buttons; actual DOM follows the chosen order; saved across reloads |
| Navigation | Mobile drawer and reachable quick navigation, collapsible tablet sidebar, desktop sidebar, page search and keyboard help |

Messages are explicitly a local course demonstration. Saving a message never contacts a remote recipient. Attachments store filenames only, not content. Real authentication, cross-device collaboration, notifications and clinical synchronization remain outside the prototype. No fake online/offline/install state controls are shown to users.

## Required responsive evidence

The browser suite exercises Landing, Sign in, Dashboard, Medications, Appointments, Activity, Messages and Settings at exactly 375, 768 and 1440 CSS px. Core routes also retain the 320/390/767/1023/1024 boundary checks. Full-page screenshots are `evidence/wk11-*-<width>.png`; native 900px-high captures for embedding in Word are `evidence/viewport-*-<width>.png`.

Mobile uses a single content column and modal navigation. Tablet uses a collapsed/expandable rail and container-aware content columns. Desktop uses full navigation and multi-column cards where space permits. Source/keyboard order remains logical; one-handed reach does not reverse DOM order. The landing header now reflows instead of overflowing at 375px.

## PWA functionality and evidence

The production manifest, normal/maskable icons, build-generated service worker and explicit user-consent update mechanism remain active. The static shell loads nested routes offline after the first online visit, and local care-plan/messages/settings data persists on the same device. APIs, authentication endpoints, mutations and external resources are not cached by the static worker.

Real browser tests verify offline reload, local changes, a waiting-worker update, unrelated cache preservation and saved messages offline. `evidence/pwa-installability.json` reports zero manifest/installability errors in a dedicated non-private browser profile. The measured-results image explains that this is browser diagnostic evidence rather than an OS installation screenshot. No newly performed Android/iOS install or manual screen-reader session is claimed. For a physical Android check, use a stable HTTPS host or an explicitly enabled temporary tunnel and follow `../week10/PHONE_TESTING.md`, skipping the obsolete role selection because sign-up now opens the caregiver dashboard directly.

## Verification and reproduction

See [TEST_RESULTS.md](TEST_RESULTS.md), the raw JSON and unedited screenshots in `evidence/`, and the complete generated Jest report at [web/coverage/lcov-report/index.html](../../web/coverage/lcov-report/index.html). Exclusions remain declaration/test files and the browser mount entry point; feature code is not excluded to meet the threshold. The browser test is not a test-coverage percentage.

From `web/`, with Node 22.12+ or another Vite 8-supported version:

```sh
npm ci
npm run lint
npm run test:coverage -- --runInBand
npm run build
npm run test:e2e
npm run preview
```

Tests start their own preview and require port 4173 to be free. Windows defaults to installed Edge; elsewhere install Chromium with `npx playwright install chromium`. `PLAYWRIGHT_CHANNEL` overrides that choice. The PR workflow runs lint, Jest/coverage, build and Playwright and saves artifacts; its remote result must be checked separately. A Pages build sets `VITE_BASE=/careconnect-swen661-T1/`. Do not open the production HTML as a file for PWA testing.

## Team handoff

This report and the screenshots are supplied for incorporation into the team's single six-section Assignment 11 Word document. Word preparation was deferred at the contributor's request; no submission-ready Word document is included in this PR. Dom/Rehman's deployment work still needs the actual live HTTPS URL, owner-enabled Pages, a successful production workflow and production installation/offline checks. Parts 2-6 should use the final reviewed revision and current evidence, rather than unchanged Week 10 screenshots or test counts.

Tool assistance: ChatGPT supported implementation, test drafting and documentation. The output was checked with TypeScript, ESLint, Jest/React Testing Library, browser regression tests and rendered screenshots. The team remains responsible for reviewing and understanding the work.
