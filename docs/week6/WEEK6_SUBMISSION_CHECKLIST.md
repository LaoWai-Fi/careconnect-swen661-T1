# CareConnect Week 6 Submission Checklist

## Included in this branch

- Flutter and React Native accessibility corrections and automated tests
- Flutter integration test and Flutter accessibility guideline test
- Six Maestro workflow definitions in `maestro/`
- VPAT Word document
- Accessibility test report and screen-reader test log
- Updated app build/test instructions

## Complete before submitting

- [x] Run `flutter test --coverage`: passed with 93.90% line coverage.
- [x] Run `npm ci` then `npm run coverage -- --runInBand`: 15 suites / 131 tests passed, with 82.08% line coverage.
- [ ] Install each build on the intended Android/iOS test device and execute the matching Maestro flows; save output/screenshots.
- [ ] Complete all four TalkBack/VoiceOver rows in `SCREEN_READER_TEST_LOG.md` and record the two screen-reader demonstrations.
- [x] Build Android APKs: `artifacts/week6/CareConnect-Flutter-Week6-release.apk` and `artifacts/week6/CareConnect-ReactNative-Week6-debug.apk` (both signature-verified).
- [ ] Complete the individual Week 6 feedback/evaluation truthfully for each teammate.
- [ ] Review the VPAT status notes and update any item where device testing finds a defect.
