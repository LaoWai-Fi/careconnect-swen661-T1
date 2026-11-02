# Week 12 Wiliss Tako Parts 2 and 4

Prepared 2 November 2026. This contribution covers final integration/polish and final build/delivery preparation. It supplements Dom's Part 1 accessibility report and the team's remaining documentation/presentation work.

## Final verification

| Application | Automated tests | Final line coverage |
| --- | --- | --- |
| Flutter Android | 129 Flutter tests | 93.89% (2043/2176) |
| React Native Android | 135 Jest/RNTL tests | 85.90% (518/603) |
| Electron desktop | 224 Jest tests, 5 Windows Electron E2E tests | 98.44% (1389/1411) |
| React web | 135 Jest/RTL tests, 162 Edge browser tests | 94.56% (922/975) |

All six Maestro workflows pass on the actual release APKs installed on an Android API 35 Pixel 6 emulator. The [final JUnit report](evidence/maestro-results.xml) retains every flow and result. The two failing first-run flows were repaired and rerun; initial failures are not described as passing.

Four fresh Lighthouse audits of the deployed Landing and Dashboard pages (mobile/desktop) each score 100 for accessibility. A real production-worker offline reload passes, with zero browser manifest/installability errors. This does not claim a physical phone installation or a new full 24-route production audit.

- [Integration changes and evidence](INTEGRATION_REPORT.md)
- [Final build downloads and installation instructions](DELIVERY.md)
- [Fresh-checkout and recording guide](FRESH_CHECKOUT_GUIDE.md)
- [Measured metrics](evidence/final-metrics.json)
- [Flutter LCOV and generated HTML](coverage/flutter/index.html)
- [React Native generated HTML coverage](coverage/react-native/lcov-report/index.html)
- [Desktop generated HTML coverage](coverage/desktop/lcov-report/index.html)
- [Web generated HTML coverage](../../web/coverage/lcov-report/index.html)

The final coverage percentages above refer to **lines**. React Native reports 84.50% statements, 79.92% branches and 75.35% functions separately. Browser/E2E counts are not coverage percentages. No new exclusions were introduced to inflate coverage.

## Scope and remaining team work

The four applications use independent fictional local data. Mobile state is in memory; Electron persists a device-local care plan; web uses browser storage and a static service-worker cache. No real authentication, cross-device clinical sync or remote messaging is claimed.

The standalone Word contribution and revised presentation copy are delivered outside Git, following the repository's Office-file convention. Combine them with Dom's report and the platform VPATs into the one final team Word submission. The presentation copy updates Wiliss's mobile demo, architecture, final coverage and integration sections, while retaining teammates' remaining rationale/reflection and recording placeholders.

The team must still perform and record the final demonstrations, agree genuine personal reflections/AI-use estimates, and finish its other assigned sections. Dom's documented VoiceOver/Safari appointment-delete announcement limitation remains; do not describe it as resolved without a genuine retest. No unprovided instructor feedback or new manual screen-reader session is claimed.

Tool disclosure for the final course submission: ChatGPT assisted with integration tests, build automation and documentation. Actual test runs, binaries, raw reports, screenshots and production browser checks validate the contribution. The team remains responsible for reviewing the work.
