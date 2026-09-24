# CareConnect Maestro evidence

This directory contains the six Week 6 Android end-to-end flows owned by the
mobile QA/evidence work:

| App | Flow | Package |
| --- | --- | --- |
| Flutter | `flutter-sign-in-check-in.yaml` | `com.example.careconnect` |
| Flutter | `flutter-medication-workflow.yaml` | `com.example.careconnect` |
| Flutter | `flutter-message-workflow.yaml` | `com.example.careconnect` |
| React Native | `rn-sign-in-check-in.yaml` | `com.careconnect.mobile` |
| React Native | `rn-medication-workflow.yaml` | `com.careconnect.mobile` |
| React Native | `rn-message-workflow.yaml` | `com.careconnect.mobile` |

## Run on an Android device or emulator

Install the matching APK first, confirm the device is visible, and run from
the repository root:

```powershell
adb devices
adb install -r artifacts/week6/CareConnect-Flutter-Week6-release.apk
maestro test maestro/flutter-sign-in-check-in.yaml
maestro test maestro/flutter-medication-workflow.yaml
maestro test maestro/flutter-message-workflow.yaml

adb install -r artifacts/week6/CareConnect-ReactNative-Week6-release.apk
maestro test maestro/rn-sign-in-check-in.yaml
maestro test maestro/rn-medication-workflow.yaml
maestro test maestro/rn-message-workflow.yaml
```

The demo credentials used by every flow are `wiliss@example.com` and
`secure-demo-password`. Run the Flutter and React Native groups against their
own installed package; do not run a flow while the other APK is installed.

Each flow writes named screenshots at its key checkpoints. Maestro's run
output identifies the result directory; copy the screenshots and the
successful console output into the evidence location described in
`docs/week6/MAESTRO_EVIDENCE.md`. Do not mark a flow passed from YAML review
alone: a connected device run is required.

## Notes for maintaining the flows

- Flutter flows target elements by `id:`. The ids come from
  `Semantics.identifier` (exposed as the Android resource-id) via the
  `semanticsId` parameter on `TapButton`, `CCFormField` and `StatCard`, and on
  the bottom-nav buttons (`nav-<tab>`). Screen readers do not announce them.
  Text matching does not work for the obscured password field or for widgets
  that merge several lines of text into one accessibility node.
- Do not use `hideKeyboard`. On Android it sends BACK, which leaves the
  current screen when no soft keyboard is open. Use `pressKey: Enter` on a
  single-line field instead; it closes the keyboard in both apps.
- Maestro text selectors are regular expressions: escape `( ) . +` or use
  `.*` to match part of a merged label.
- Build the React Native APK as a release build. The `android/` folder is
  not committed, so generate it first with
  `npx expo prebuild --platform android`, then run
  `./gradlew assembleRelease` inside `mobile-rn/android`. A debug build does not include the
  JavaScript bundle and shows a red "Unable to load script" screen without
  Metro running. On Windows, build from a short `subst` drive to stay under
  the 260-character path limit.
- Screenshots are saved under `%USERPROFILE%\.maestro\tests\<run>\`,
  not the current directory. See `docs/week6/MAESTRO_EVIDENCE.md`.
