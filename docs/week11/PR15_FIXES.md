# PR 15 regression fixes

Contributor: Wiliss Tako. Verified 26 October 2026.

- Normalized persisted `med_skipped` and `schedule_done` activity into the supported kinds. Unknown valid records retain their label as generic activity; malformed records cannot crash the dashboard/timeline. Both renderers also have defensive fallbacks.
- Replaced module-load UTC daily keys with a current local-calendar helper for medication/check-in reads and writes. Daily tracking resets across midnight without reloading; appointment day labels use the same local calendar.
- Added unit/component regressions for legacy/unknown records and local midnight, plus real-browser tests for both previously reproduced failures.

Validation: production build, TypeScript and ESLint passed. Jest/RTL: 107 tests in 16 suites passed. Coverage: statements 88.67%, branches 80.00%, functions 90.74%, lines 92.45%. Playwright: 37 tests passed, including the two new regression tests. No new manual screen-reader or physical-device test is claimed.

These fixes resolve the two blocking review findings. Remaining Part 1 implementation will be submitted in a separate PR after this foundation is merged. Live GitHub Pages setup remains with the repository owner.
