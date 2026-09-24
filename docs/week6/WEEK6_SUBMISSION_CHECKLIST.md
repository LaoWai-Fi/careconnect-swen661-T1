# CareConnect Week 6 Submission Checklist

## Included in this branch

- Flutter and React Native accessibility corrections and automated tests
- Flutter integration test and Flutter accessibility guideline test
- Six Maestro workflow definitions in `maestro/`, with run instructions in
  [`maestro/README.md`](../../maestro/README.md) and the evidence record in
  [`MAESTRO_EVIDENCE.md`](MAESTRO_EVIDENCE.md)
- Accessibility test report
- Updated app build/test instructions

## Complete before submitting

- [x] Run `flutter test --coverage`: passed with 93.90% line coverage.
- [x] Run `npm ci` then `npm run coverage -- --runInBand`: 15 suites / 131 tests passed, with 82.08% line coverage.
- [x] Install each build on an Android device and execute the matching Maestro flows; save output/screenshots: all six flows passed on 2026-09-24, evidence recorded in [`MAESTRO_EVIDENCE.md`](MAESTRO_EVIDENCE.md).
- [x] Record TalkBack walkthroughs of both apps (September 21, 2026). The recordings are submitted separately and linked in the Week 6 submission document. VoiceOver not tested: no iOS builds.
- [x] Build Android APKs: `artifacts/week6/CareConnect-Flutter-Week6-release.apk` and `artifacts/week6/CareConnect-ReactNative-Week6-release.apk` (release build with the JS bundle embedded).
- [ ] Complete the individual Week 6 feedback/evaluation truthfully for each teammate.
- [x] Update the VPAT statuses from the TalkBack and Maestro results. The VPAT now lives in the Week 6 submission document, not in this repository.
