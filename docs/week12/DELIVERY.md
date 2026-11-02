# Final build delivery and testing

## Files supplied separately

- `CareConnect-Flutter-Week12.apk`: Flutter release-mode Android application.
- `CareConnect-ReactNative-Week12.apk`: standalone React Native Android release; no Metro server or Expo Go needed.
- `CareConnect-Setup-0.8.0.exe`: Windows x64 course installer.
- `CareConnect-Week12-Source.zip`: complete tracked source for all four applications, configuration, tests and documentation.
- `Week12_Wiliss_Parts2_4.docx`: Wiliss's integration, final coverage, build and delivery contribution for the team's one Word document.
- `Final_Presentation_T1_WK12_Wiliss_Contributions.pptx`: revised copy of Dom's outline. Other team members still need to finish their placeholders and recordings.

The ZIP package includes raw final coverage, JUnit/Jest/browser reports, genuine screenshots and SHA256SUMS. Development dependencies, SDKs, temporary browser profiles, signing secrets and local care-plan test folders are excluded.

## Android

Transfer the appropriate APK to an Android device and install it using the course's approved method. The React Native APK supports arm64 and x86_64; the emulator verification used Android API 35 x86_64. Both applications use separate Android package IDs and can coexist.

These release-mode course builds use development signing keys. If Android reports a signature conflict with an older course build, uninstalling the old app may be necessary; that removes its local demo data. The APKs are not store releases. Use fictional demo details, perform sign-in/check-in, add/edit a medication, compose a message, check left-hand settings and larger text. Do not place an emergency call during testing.

All six automated release-APK workflows passed on an emulator. The team still supplies genuine TalkBack narration and the final presentation recording.

## Windows

Verify the installer against `SHA256SUMS.txt`, run `CareConnect-Setup-0.8.0.exe`, complete setup and launch CareConnect. The course installer is not presented as a publicly signed commercial release.

1. Sign in with fictional details.
2. Use native menus to navigate to Medications.
3. Mark a medication taken, close the app and relaunch; confirm persistence after signing in again.
4. Use Tab/Shift+Tab, the native keyboard shortcuts and Escape in dialogs. Check the visible focus indicator.
5. Check settings, larger text, left-hand mode and the care-plan export/import using fictional data.

The verification pass launched a packaged executable and tested save/Tab behavior, in addition to the real Electron E2E suite. It did not execute the installer UI or perform a new NVDA listening session.

## Mac downloads for Dom

No Mac installers were downloaded to this laptop.

- [Apple Silicon M-series artifact](https://github.com/LaoWai-Fi/careconnect-swen661-T1/actions/runs/41395328030/artifacts/13119551065)
- [Intel artifact](https://github.com/LaoWai-Fi/careconnect-swen661-T1/actions/runs/41395328030/artifacts/13119770473)

Download the matching artifact, extract it and use its DMG to install the course app. Builds are unsigned/not notarized; the Mac owner should review them before opening. Test native menus, Command shortcuts, file persistence, text size/contrast, dialogs and VoiceOver. Record the actual device/OS/browser or application version and results. GitHub login may be needed for artifacts; retain the files before artifact expiration.

## Web and PWA

[Live app](https://laowai-fi.github.io/careconnect-swen661-T1/)

Open the HTTPS site in Chrome/Edge, sign up or sign in with fictional data, perform the same core care tasks, and inspect narrow/tablet/desktop layouts. Use the browser's Install app option when supported. After one online visit and service-worker readiness, launch/reload offline. Reconnect and verify the app remains usable. Updates require user consent before reload.

Actual production verification found no manifest/installability errors and passed an offline reload. Landing and Dashboard each score 100 in fresh mobile/desktop Lighthouse accessibility checks. This is browser evidence, not a claimed physical phone installation or new audit of every production route.
