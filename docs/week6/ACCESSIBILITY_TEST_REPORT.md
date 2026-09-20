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

## Coverage commands

```powershell
cd mobile-flutter
flutter test --coverage
flutter test integration_test

cd ..\mobile-rn
npm ci
npm run coverage
```

The previous React Native evidence reported 82.03% statements and 84.31% lines. Run the commands above after dependencies and a device/emulator are available to regenerate final Week 6 coverage evidence; this checkout does not contain installed Flutter or Node dependencies.

## Manual screen-reader protocol

Complete the checks in `SCREEN_READER_TEST_LOG.md` on a real Android device/emulator with TalkBack and an iOS device/simulator with VoiceOver. Record the tester, device/OS, build identifier, date, outcome, defects, and a 2–3 minute capture per app. Automated tests cannot prove a screen reader's spoken order or announcements on an actual platform.

## Maestro execution

Build/install each app, then run the relevant flow:

```powershell
maestro test maestro/flutter-sign-in-check-in.yaml
maestro test maestro/flutter-medication-workflow.yaml
maestro test maestro/rn-sign-in-check-in.yaml
maestro test maestro/rn-medication-workflow.yaml
```

Use the Flutter Android package `com.example.careconnect` and the Expo Android package `com.careconnect.mobile`. Capture the successful Maestro output and screenshots/video as final submission evidence.
