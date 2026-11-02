# Fresh checkout and presentation recording guide

This is a reproducible technical script. It does not claim a recording has been produced. The professor's supplied email requires a final team presentation; Dom's notes additionally mention a separate 30-45 minute fresh-checkout recording to confirm against the course page.

## Prepare

Clone the repository and check out `feat/wiliss-wk12-integration-delivery` (or the approved merge commit). Use fictional data throughout. Show the source revision and actual test output on screen. Keep credentials and tokens out of recordings.

- Web/desktop: Node 22.12+ and npm.
- Flutter: the final CI uses Flutter 3.47.8, Java 17 and Android tooling.
- React Native: Node 22, Java 17 and Android tooling; Expo generates the native project.

## Web

From `web`:

```sh
npm ci
npm run lint
npm run test:coverage -- --runInBand
npm run build
npm run test:e2e
npm run preview
```

The E2E suite starts its own preview, so free port 4173 before running it. On Windows the Chromium project defaults to installed Edge; other hosts need `npx playwright install chromium firefox webkit` for all configured engines. The final local contribution reran the Chromium/Edge project; the earlier three-engine CI result is separate evidence.

## Electron

From `desktop-electron`:

```sh
npm ci
npm run typecheck
npm run lint
npm run test:coverage -- --runInBand
npm run test:e2e
npm run dist:win
```

Mac builders use `npm run dist:mac:arm` or `npm run dist:mac:intel`. The desktop workflow builds both architectures and Windows after tests pass.

## Mobile

From `mobile-flutter` run `flutter pub get`, `flutter test --coverage` and `flutter build apk --release`. From `mobile-rn` run `npm ci`, `npm run coverage -- --runInBand`, `npx expo prebuild --platform android --no-install`, then the Android Gradle release task. The final mobile workflow retains commands, source SHA and APK checksums.

Install the two release APKs on an emulator/device, then run:

```sh
maestro test --format junit --output results.xml --test-output-dir maestro-output maestro/
```

## Wiliss's presentation segments

- Mobile demonstration, about two minutes: launch the React Native APK, sign in, mark a medication taken, show left-hand mode/larger text, and demonstrate genuine TalkBack names/states. Never activate the emergency call.
- Architecture, about one minute: explain the separate Flutter, Expo/RN, Electron and React/Vite implementations and their local data behavior.
- Integration, about thirty seconds: explain the repaired persistence selectors, every-control keyboard check and added mobile navigation/compose tests.
- Coverage: use final line figures, not historical values: Flutter 93.89%, React Native 85.90%, Electron 98.44%, web 94.56%. State other metrics separately when asked.

All members should speak in the final team presentation. Dom supplies genuine Mac/VoiceOver evidence. Teammates complete their rationale, reflection, AI-use estimate and any remaining presentation placeholders truthfully.
