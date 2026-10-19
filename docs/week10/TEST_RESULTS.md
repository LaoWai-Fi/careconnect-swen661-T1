# Week 10 - Verification Results

Contributor: Wiliss Tako. Executed 20 October 2026, Asia/Kolkata (raw timestamps use UTC). Branch: `feat/wiliss-wk10-web-a11y-pwa`. Base: `dbbfc33880aa1e9b6881d93152cd9b2d1c4a06a9`. These results describe the uncommitted Week 10 working tree, not the unchanged base commit.

## Verified results

| Check | Actual result |
| --- | --- |
| Production build and TypeScript | Passed; Vite 8.3.4; generated coherent PWA release `3078833dfb97514a` with 10 precached files |
| ESLint | Passed, no warnings or errors |
| Browser regression suite | 34 passed; 0 failed, skipped or flaky; 71.52 seconds |
| Rendered accessibility scans | 27 axe-core 4.14.0 reports; zero violations under the selected WCAG 2 A/AA, WCAG 2.1 A/AA and best-practice tags; no rules disabled |
| Core responsive matrix | Sign in, Dashboard and Manage medications at 320, 390, 767, 768, 1023, 1024 and 1440 CSS px; no horizontal page overflow |
| Text enlargement | Dashboard reflow passed at 200% root text size; this is not a separate browser-zoom or device test |
| PWA installability | Dedicated non-private Edge test profile: no manifest errors and no browser installability errors |
| Runtime dependency audit | Registry audit returned 0 vulnerabilities for production dependencies; see `runtime-audit.json` |

Environment: Windows, Node.js 24.19.0, npm 11.17.0, Playwright 1.60.0 and installed Microsoft Edge (headless user agent reports Edg/155.0.0.0). Tests use production preview on `http://127.0.0.1:4173`; localhost is treated as a secure origin for service workers.

## What the browser tests exercised

- One main landmark, core heading, rendered accessibility rules and real document reflow across all seven widths.
- Skip-link keyboard activation; first-invalid sign-in focus; existing error-description targets.
- Mobile drawer keyboard containment, Escape, route navigation, title and heading focus; tablet expansion/collapse; resize-to-desktop focus recovery.
- Medication required-field validation, add/delete persistence across reload, confirmation focus, Escape and restoration. The existing edit implementation is retained, but no separate edit-specific automated assertion is claimed.
- Actual local-demo sign-up, caregiver selection and sign-out; shared-shell patient-route regression checks.
- Real service-worker activation, offline nested-route reload, local medication changes, allowlisted static caching and preservation of unrelated caches.
- A real waiting-worker update: an unsaved form survives before explicit consent; Reload to update activates the next worker. The temporary test worker change is restored after the test.
- Simulated install-prompt acceptance availability/rejection and dismissal behavior. This checks application handling, not a successful operating-system installation.

## Axe items requiring interpretation

Two reports retain one `color-contrast` incomplete finding each: `mobile-navigation-axe.json` and `delete-confirmation-axe.json`. Axe could not determine a background because a native dialog overlapped other elements. These are not suppressed or relabeled as axe passes.

Additional browser-computed foreground/background measurements provide supporting contrast evidence for those exact elements:

| Element | Foreground / background | Ratio |
| --- | --- | --- |
| Mobile navigation heading | rgb(30, 38, 49) / rgb(255, 255, 255) | 15.25:1 |
| Delete-confirmation description | rgb(48, 56, 69) / rgb(255, 255, 255) | 11.82:1 |

Both exceed 4.5:1. The raw measurements are `drawer-contrast.json` and `modal-contrast.json`. No opacity/image background is used for these dialog text surfaces. This supports the contrast assessment without changing axe's original incomplete records.

## Evidence inventory and reproduction

`evidence/playwright-results.json` contains the complete 34-test run. There are 27 `*-axe.json` reports, 12 unedited native browser screenshots (three core screens at three widths, mobile form, offline and update states), two contrast measurements, installability diagnostics and a runtime audit. The incognito diagnostic separately records the browser's expected private-mode installation restriction; the dedicated non-private installability check has no such error.

From `web/`, use Node 22.12+ or another Vite 8-supported version, then:

```sh
npm ci
npm run lint
npm run build
npm run test:e2e
```

Tests launch their own production preview; port 4173 must be available. Installed Edge is the default. For Chrome, set `PLAYWRIGHT_CHANNEL=chrome` in the environment first. Browser-test JSON may contain local reproduction paths; no real account or patient details are used.

## Boundaries and follow-up

This is implementation and targeted browser evidence, not a full WCAG certification or a test-coverage percentage. Week 10 Parts 2/4 do not specify a coverage threshold. No new manual NVDA/VoiceOver session, OS-level app install, real phone/tablet run, Safari/Firefox validation, or production HTTPS deployment was performed. The report does not claim them. The legacy app remains a local course prototype without production authentication or clinical synchronization.

The production-dependency audit is clean, but it excludes development tooling. Known development-tool advisories were not resolved through disruptive, unrelated major framework migrations. Team Parts 1 and 3 remain separate deliverables. Before submission, review this package and include the tool-assistance disclosure in the Part 2 document.
