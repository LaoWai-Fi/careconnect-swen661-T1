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

adb install -r artifacts/week6/CareConnect-ReactNative-Week6-debug.apk
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
