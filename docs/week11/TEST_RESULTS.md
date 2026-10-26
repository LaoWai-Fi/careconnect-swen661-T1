# Week 11 Part 1 verification results

Verified 26 October 2026. Contributor: Wiliss Tako. Branch: `feat/wiliss-wk11-part1-responsive-pwa`, based on merged main `11450a4c7aabee1e653254795716d40d2068194f`. Results describe the Part 1 changes on that base, not the unchanged base.

| Check | Actual result |
| --- | --- |
| TypeScript, ESLint and production build | Passed |
| Jest and React Testing Library | 114 passed, 0 failed; 18 suites |
| Statements | 88.04% (1016/1154) |
| Branches | 80.24% (654/815) |
| Functions | 86.17% (324/376) |
| Lines | 92.14% (880/955) |
| Playwright | 81 passed, 0 failed/skipped/flaky; 80.82 seconds |
| Rendered axe-core reports | 68 reports, 0 violations under selected WCAG 2 A/AA, WCAG 2.1 A/AA and best-practice tags; no rules disabled |
| Browser installability | 0 manifest errors and 0 installability errors in a dedicated non-private profile |
| Production worker | Release `199351b1b8eaade7`; 10 precached files |

## Tested workflows

Eight main screens are checked at exact 375/768/1440px widths, with additional core-route boundaries from 320 to 1440px. Dark Dashboard, Medications, Messages and Settings are checked at all three required widths. Tests cover persisted extra-large text/right-hand reach, stronger borders/focus, restored defaults, dashboard widget visibility and actual DOM reordering.

Message tests cover read/detail/reply, draft reload, required-field validation, local save, archive/restore, confirmation before delete and offline persistence. Existing mock authentication, medication management, caregiver check-in and activity flows remain covered. Legacy activity and local-midnight regressions are included.

Keyboard tests cover the skip link, native modal Tab/Shift+Tab containment, Escape, Enter/Space activation, route title/heading focus and resize recovery. Real PWA tests cover service-worker readiness, offline nested reload, static-only caching, a waiting-worker update after consent and unrelated cache preservation. Chromium install-event handling is simulated in its dedicated test; real browser protocol installability is checked separately.

## Coverage and complete evidence

The generated report is committed in `web/coverage/lcov-report/index.html`, with `coverage-summary.json` and `lcov.info`. Its denominator includes components, pages, state, stores and PWA registration. Declaration/test files and the mount entry point `main.tsx` are excluded in `jest.config.cjs`; feature pages are not excluded to inflate coverage. Browser test count is not a coverage percentage.

Raw runs: `evidence/jest-results.json` and `evidence/playwright-results.json`. Original axe results: `evidence/*-axe.json`. Native captures: `wk11-*-<width>.png` and `viewport-*-<width>.png`. Additional state evidence includes dark settings, keyboard help, offline messages and worker updates.

`coverage-summary.png` is an unedited capture of the real Jest HTML report. `measured-results.html` and `.png` are explicitly labeled generated summaries of the raw test/installability JSON, not terminal or operating-system installation screenshots.

## Limits and human review

Five reports retain one `color-contrast` incomplete finding each: delete confirmation, mobile navigation, and Landing at 375/768/1440px. Axe cannot fully resolve native-dialog overlap or the gradient in those states. Incomplete records are retained, not suppressed or relabeled as axe passes. The delete description has supporting computed contrast in `modal-contrast.json`. Human review remains appropriate for all incomplete nodes and actual assistive-technology use.

Zero detected violations is not full WCAG certification. No new physical Android/iOS installation, manual NVDA/VoiceOver session, live production deployment or Safari/Firefox certification is claimed. Browser diagnostics provide installability evidence when an OS install prompt cannot be exercised in headless testing.

The run used production preview in installed Edge on Windows. Linux CI uses Playwright Chromium. Local passing results do not prove the new GitHub Actions run passed; check the PR workflow separately. Pages setup, the live URL and production verification remain with the deployment owner. Word preparation was explicitly deferred: use [PART1_IMPLEMENTATION.md](PART1_IMPLEMENTATION.md) and [PART1_SCREENSHOTS.md](PART1_SCREENSHOTS.md) in the team's single six-section Word submission.
