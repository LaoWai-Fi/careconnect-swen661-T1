# Week 6 Maestro evidence record

This file is the packaging checklist for the six Maestro flows in
[`../../maestro/`](../../maestro/). It intentionally records device evidence
separately from the committed flow definitions. The rows below record the completed device runs.

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

All six flows were run on 2026-09-24 (ET) by Dom Puller against the release
APKs below and passed with every step reported `COMPLETED` in Maestro's
`commands.json`. Each evidence folder holds the two named screenshots,
`commands.json` (per-step results) and `maestro.log`.

| Flow | Expected screenshots | Device / OS | APK build | Result | Evidence path / link | Tester / date |
| --- | --- | --- | --- | --- | --- | --- |
| `flutter-sign-in-check-in.yaml` | `flutter-dashboard-signed-in`, `flutter-check-in-recorded` | Android emulator `sdk_gphone16k_x86_64`, Android 17, 1080x2424 | `CareConnect-Flutter-Week6-release.apk` | Pass (19/19 steps) | `artifacts/week6/maestro/flutter-sign-in-check-in/` | Dom Puller / 2026-09-24 00:09 ET |
| `flutter-medication-workflow.yaml` | `flutter-medications-before-add`, `flutter-medication-added` | Android emulator `sdk_gphone16k_x86_64`, Android 17, 1080x2424 | `CareConnect-Flutter-Week6-release.apk` | Pass (33/33 steps) | `artifacts/week6/maestro/flutter-medication-workflow/` | Dom Puller / 2026-09-24 00:15 ET |
| `flutter-message-workflow.yaml` | `flutter-messages-before-compose`, `flutter-message-sent` | Android emulator `sdk_gphone16k_x86_64`, Android 17, 1080x2424 | `CareConnect-Flutter-Week6-release.apk` | Pass (31/31 steps) | `artifacts/week6/maestro/flutter-message-workflow/` | Dom Puller / 2026-09-24 00:17 ET |
| `rn-sign-in-check-in.yaml` | `rn-dashboard-signed-in`, `rn-check-in-recorded` | Android emulator `sdk_gphone16k_x86_64`, Android 17, 1080x2424 | `CareConnect-ReactNative-Week6-release.apk` | Pass (19/19 steps) | `artifacts/week6/maestro/rn-sign-in-check-in/` | Dom Puller / 2026-09-24 00:41 ET |
| `rn-medication-workflow.yaml` | `rn-medications-before-add`, `rn-medication-added` | Android emulator `sdk_gphone16k_x86_64`, Android 17, 1080x2424 | `CareConnect-ReactNative-Week6-release.apk` | Pass (31/31 steps) | `artifacts/week6/maestro/rn-medication-workflow/` | Dom Puller / 2026-09-24 00:42 ET |
| `rn-message-workflow.yaml` | `rn-messages-before-compose`, `rn-message-sent` | Android emulator `sdk_gphone16k_x86_64`, Android 17, 1080x2424 | `CareConnect-ReactNative-Week6-release.apk` | Pass (29/29 steps) | `artifacts/week6/maestro/rn-message-workflow/` | Dom Puller / 2026-09-24 00:43 ET |

Copies of the evidence folders and both APKs are also in the team's shared
course folder under `SWEN 661/Week 6/artifacts/`.

## Where Maestro saves screenshots

This Maestro version writes `takeScreenshot` images to
`%USERPROFILE%\.maestro\tests\<run timestamp>\<flow name>\takeScreenshot\`,
not to the directory the command is run from. Copy them from there into the
evidence folder after each passing run.
