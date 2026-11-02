# Final integration and polish

Contributor: Wiliss Tako. Baseline: merged main `e8ced111f506605ac9bf6703223110d2b4fa8bf0`.

## Corrections

| Finding | Final change | Verification |
| --- | --- | --- |
| Web keyboard tests accepted three focus stops even on pages with more controls. | Compare the full set of expected sequentially focusable controls with the controls actually reached through Tab. Stable test-only identifiers avoid collisions between identical labels. | All 12 route checks and the complete 162-test Edge suite pass. |
| Desktop save/relaunch tests retained the old medication button name after its accessibility improvement. | Update the three stale selectors to the current state-aware accessible name, retaining the real file-save and relaunch assertions. | All five Electron E2E tests pass on Windows; CI also verifies the Mac builds. |
| React Native lacked integration coverage of message validation/cancellation and detail navigation through the real navigator. | Add four meaningful workflows covering required fields, canceled drafts, shared medication state, message details and archive/back routes. | 135 tests pass; line coverage increases from 82.08% to 85.90%. |
| Flutter device flow asserted a banner that disappears after three seconds. | Verify the durable merged Check-in/Done/Completed semantic state. | Corrected flow passes on the release APK. |
| React Native compose flow scrolled its recipient field behind the keyboard. | Fill fields top-to-bottom and dismiss the keyboard immediately after typing in the multiline field. | Corrected flow verifies the resulting message in the inbox. |

The first fresh Android run passed four flows and failed two; the final corrected run passes all six against the **same release APKs**. Both raw runs remain in their GitHub workflow history. The final report is copied into `evidence/maestro-results.xml`.

## Platform verification

- Flutter and React Native: release APK installation, sign-in/check-in, medication management, message composition and fresh unit/widget/component coverage.
- Electron: type checking, lint, 224 Jest tests, five real Electron E2E tests, native menu command handlers, file persistence and relaunch. A locally packaged Windows app was also launched with isolated demo data; sign-in, medication save and Tab focus passed. The OS installer was built, but this pass did not execute the installer UI or claim physical native accelerator keystrokes.
- Web: lint/type checking/build, 135 Jest/RTL tests and 162 Edge browser checks. Production captures cover 375/768/1440 pixels; a dedicated browser profile verifies a real worker-controlled offline reload and manifest/installability diagnostics.
- Mac: both architectures built successfully; the existing workflow ran the five Electron checks on each Mac runner. Manual Mac/VoiceOver testing remains with Dom.

## Source and build provenance

| Evidence | Source / run |
| --- | --- |
| Production web | merged main `e8ced111` |
| Both Android APKs | source `6f1b661`, [build 41395085788](https://github.com/LaoWai-Fi/careconnect-swen661-T1/actions/runs/41395085788) |
| Corrected six Android device flows | [run 41397222921](https://github.com/LaoWai-Fi/careconnect-swen661-T1/actions/runs/41397222921) |
| Fresh React Native integration tests | source `f572434`, [run 41395640556](https://github.com/LaoWai-Fi/careconnect-swen661-T1/actions/runs/41395640556) |
| Desktop installers | source `9d94fde`, [run 41395328030](https://github.com/LaoWai-Fi/careconnect-swen661-T1/actions/runs/41395328030) |

Later branch commits change tests, CI and documentation. Application feature source remains unchanged from the reviewed baseline; the tests do not imply shared data between the independent apps. See the package manifest and SHA256SUMS for exact delivered files.

## Honest limits

No additional instructor grading comments were supplied, so this pass applies the Week 12 requirements and reproduced defects rather than inventing feedback. The known VoiceOver/Safari appointment-delete announcement issue remains. Automated scans do not establish full WCAG conformance or replace genuine TalkBack/VoiceOver sessions. Existing mobile in-memory data behavior is documented rather than described as cross-device persistence.
