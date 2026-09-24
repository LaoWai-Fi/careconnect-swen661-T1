# Week 6 Maestro evidence record

This file is the packaging checklist for the six Maestro flows in
[`../../maestro/`](../../maestro/). It intentionally records device evidence
separately from the committed flow definitions. The current worktree does not
have an Android emulator/device attached, so the rows below remain pending
until a teammate runs the flows.

## Required evidence per flow

For each run, save:

1. The successful `maestro test` console output (or exported run report).
2. The named screenshots produced by the flow.
3. The device model, Android version, APK filename/build identifier, date, and
   tester.

Use a stable folder such as `artifacts/week6/maestro/<flow-name>/` when
assembling the submission package. `artifacts/` is intentionally ignored by
Git, so attach or upload the files separately rather than committing binaries.

## Run record

| Flow | Expected screenshots | Device / OS | APK build | Result | Evidence path / link | Tester / date |
| --- | --- | --- | --- | --- | --- | --- |
| `flutter-sign-in-check-in.yaml` | `flutter-dashboard-signed-in`, `flutter-check-in-recorded` | Pending device run | `CareConnect-Flutter-Week6-release.apk` | Pending | `artifacts/week6/maestro/flutter-sign-in-check-in/` | Pending |
| `flutter-medication-workflow.yaml` | `flutter-medications-before-add`, `flutter-medication-added` | Pending device run | `CareConnect-Flutter-Week6-release.apk` | Pending | `artifacts/week6/maestro/flutter-medication-workflow/` | Pending |
| `flutter-message-workflow.yaml` | `flutter-messages-before-compose`, `flutter-message-sent` | Pending device run | `CareConnect-Flutter-Week6-release.apk` | Pending | `artifacts/week6/maestro/flutter-message-workflow/` | Pending |
| `rn-sign-in-check-in.yaml` | `rn-dashboard-signed-in`, `rn-check-in-recorded` | Pending device run | `CareConnect-ReactNative-Week6-debug.apk` | Pending | `artifacts/week6/maestro/rn-sign-in-check-in/` | Pending |
| `rn-medication-workflow.yaml` | `rn-medications-before-add`, `rn-medication-added` | Pending device run | `CareConnect-ReactNative-Week6-debug.apk` | Pending | `artifacts/week6/maestro/rn-medication-workflow/` | Pending |
| `rn-message-workflow.yaml` | `rn-messages-before-compose`, `rn-message-sent` | Pending device run | `CareConnect-ReactNative-Week6-debug.apk` | Pending | `artifacts/week6/maestro/rn-message-workflow/` | Pending |

## Blockers and handoff

- A physical Android device or configured emulator is required to produce
  truthful Maestro results and screenshots.
- iOS screen-reader evidence is separate; Maestro Android screenshots do not
  replace the TalkBack/VoiceOver rows in
  [`SCREEN_READER_TEST_LOG.md`](SCREEN_READER_TEST_LOG.md).
- If a selector fails on device, record the exact device/build and failure
  output here, fix the flow or app, then rerun the affected flow. Do not
  replace a failed run with a manual screenshot.
