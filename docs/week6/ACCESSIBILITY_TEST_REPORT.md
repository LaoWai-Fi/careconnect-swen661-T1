# CareConnect Week 6 Accessibility and UI Test Report

## Scope

This report covers the Flutter and React Native CareConnect mobile apps. The review targeted labels, roles, controls, focus order, text scaling, contrast tokens, target sizes, validation feedback, destructive-action confirmation, and keyboard/touch alternatives.

## Implemented corrections

- React Native `FormField` now propagates its visible label and current validation message to `TextInput` through `accessibilityLabel` and `accessibilityHint`; examples remain placeholders rather than the field's accessible name.
- Form validation feedback is announced politely in React Native and emitted from a live semantic region in Flutter.
- Both apps expose a 200% in-app text-size option. Pages use scrollable content and wrapping/large touch controls so enlarged text remains reachable.
- Both apps retain semantic roles and state for buttons, switches, tabs, message state, navigation, and emergency actions; icon-only controls have meaningful names.
- Both apps retain tap alternatives for dashboard reordering and confirmation before destructive actions or emergency dialing.

## Automated test evidence

| App | Test type | Evidence |
| --- | --- | --- |
| Flutter | Widget accessibility | `test/accessibility/accessibility_guidelines_test.dart` runs Flutter's `androidTapTargetGuideline` and `labeledTapTargetGuideline` against the shared primary control. |
| Flutter | Integration | `integration_test/critical_workflows_test.dart` signs in and records a check-in through the rendered application. |
| React Native | Component and integration | Jest/RNTL tests cover accessibility roles, disabled state, form labels/hints/errors, app navigation, forms, medication and message workflows. |
| Both | E2E | `maestro/` contains sign-in/check-in, medication-management, and message-composition flows for each application. |

## Completed automated verification

| App | Result | Coverage evidence |
| --- | --- | --- |
| Flutter | `flutter test --coverage` passed, including the accessibility guideline test. | 93.90% line coverage (2,033/2,165 lines). |
| React Native | `npm run coverage -- --runInBand` passed: 15 suites / 131 tests. | 79.97% statements, 77.93% branches, 69.01% functions, and 82.08% lines (495/603). |

Both reported line-coverage results exceed the course's 75% requirement. Generated evidence is stored locally under `artifacts/week6/coverage/` for submission packaging; the source folders' normal build/coverage outputs remain ignored by Git.

## Reproduction commands

```powershell
cd mobile-flutter
flutter test --coverage
flutter test integration_test

cd ..\mobile-rn
npm ci
npm run coverage
```

The commands above were run successfully on September 21, 2026 with Flutter 3.47.5, Android SDK 36, and the lockfile-pinned React Native dependencies. The coverage results above are current automated evidence.

## Screen-reader testing

Both apps were walked through with TalkBack on an Android emulator on September 21, 2026, and each session was recorded. The recordings, the updated VPAT statuses, and the known limitations are in the team's Week 6 submission document rather than in this repository. No iOS builds were produced, so VoiceOver was not tested.

## Maestro execution

Build/install each app, then run the relevant flow:

```powershell
maestro test maestro/flutter-sign-in-check-in.yaml
maestro test maestro/flutter-medication-workflow.yaml
maestro test maestro/flutter-message-workflow.yaml
maestro test maestro/rn-sign-in-check-in.yaml
maestro test maestro/rn-medication-workflow.yaml
maestro test maestro/rn-message-workflow.yaml
```

Use the Flutter Android package `com.example.careconnect` and the Expo Android package `com.careconnect.mobile`. The build artifacts are `artifacts/week6/CareConnect-Flutter-Week6-release.apk` and `artifacts/week6/CareConnect-ReactNative-Week6-release.apk`. Capture the successful Maestro output and screenshots/video as final submission evidence.
