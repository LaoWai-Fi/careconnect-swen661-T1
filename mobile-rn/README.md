# CareConnect — React Native (Mobile)

The React Native / Expo implementation of CareConnect (Android + iOS), covering **LO1: Design and build a mobile user interface**. This is a port of the Flutter app in [`mobile-flutter/`](../mobile-flutter/) — same features, same seed data, same accessibility constraints — rebuilt on React Native so the team could compare the two toolchains directly (see [docs/rn-vs-flutter-comparison.md](../docs/rn-vs-flutter-comparison.md)).

## Stack

- **Expo SDK 57** (managed workflow) + **React Native 0.86** + **TypeScript**
- State: React Context + `useReducer` (mirrors Flutter's `AppState`/`ChangeNotifier` — keeps the comparison honest)
- Navigation: **React Navigation** — native-stack root (landing → auth → main) + bottom-tabs for the 5-tab shell, with typed param lists
- Testing: **Jest** (via `jest-expo`) + **@testing-library/react-native v14**
- Lint: **ESLint 9** flat config with `eslint-config-expo`
- Coverage: `jest --coverage` with lcov + text-summary reporters

## Setup

```bash
cd mobile-rn
npm install
npx expo start          # then press a (Android) / i (iOS) or scan the QR code
```

## Test & lint

```bash
npm test                # all suites
npm run coverage        # jest --coverage (writes coverage/ + prints summary)
npm run lint            # eslint . — zero errors, zero warnings
```

Current status: **117 tests, 117 passing, 82.03% statement / 84.31% line coverage** (gate: ≥60%). The saved evidence from the last full run is in [coverage-summary.txt](coverage-summary.txt); the browsable HTML report lands in `coverage/lcov-report/index.html`.

## Building an APK

The app builds through EAS (requires an Expo account):

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview    # produces an installable .apk
```

Add a `build.preview` profile to `app.json` (`android.buildType: "apk"`) if it isn't configured yet; EAS prints a download URL when the build finishes.

## Features

All screens ported from the Flutter build:

- **Landing → Sign up / Sign in** — client-side validation with inline errors, fake 700 ms network delay, name derived from email local-part
- **Dashboard** — task counter ("X of Y tasks done") with progress bar, widget sections rendered in user-defined order, three seeded alerts with dismiss buttons, check-in card with "✓ Check-in recorded!" feedback, Customize sheet with tap-based Move Up/Move Down reordering (WCAG 2.5.7 — no drag gestures)
- **Medications** — list with taken toggle + "✓ Taken!" feedback, add-medication form sheet with validation, delete confirmation dialog
- **Appointments** — list with assignee chip ("✓ {assignee} is assigned"), add form with validation, delete confirmation
- **Activity** — filter pills (All / Medication / Task / Check-in), refresh button with checked-at timestamp
- **Messages** — inbox with read/unread dot toggle, archive entry point, compose sheet with reply prefill ("Re: subject" + quoted body)
- **Detail screens** — medication/appointment/message detail with stale-item guard (pops back if the item was deleted), archive/unarchive/delete with confirmation
- **AppShell** — header with greeting bar, 5-tab bottom nav with unread badge, SOS button with confirm-then-dial (`tel:911` via `expo-linking`), settings sheet (theme / hand mode / text size / sign out)

## Accessibility

Carried over from the Flutter build's constraints:

- All touch targets ≥ 44×44 (SOS FAB is 64×64)
- Tap-based alternatives to every drag action (WCAG 2.5.7 Dragging Movements)
- Destructive actions always confirm first (delete, SOS dial)
- `accessibilityRole` / `accessibilityLabel` / `accessibilityState` on every interactive element
- Left-hand mode reverses the tab bar and FAB placement

## Project structure

```
mobile-rn/
├── src/
│   ├── models/types.ts        # Medication, Appointment, Message, ActivityEntry, DashboardWidget
│   ├── state/AppState.tsx     # Context + reducer — all business logic ported from app_state.dart
│   ├── state/seed.ts          # Seed data ported from main.dart's _seededAppState
│   ├── theme/tokens.ts        # CCTokens ported 1:1 from tokens.dart
│   ├── hooks/useAppTheme.ts   # theme hook
│   ├── utils/format.ts         # formatClockTime
│   ├── utils/counts.ts         # unreadMessageCount
│   ├── navigation/             # RootNavigator (native stack + bottom tabs), typed param lists
│   ├── components/             # TapButton, FormField/Input, Cards, MessageRow, AppShell, SettingsSheet
│   └── screens/                # 11 screens + detail screens
└── __tests__/
    ├── state/AppState.test.ts     # unit tests — port of app_state_test.dart
    ├── components/                # TapButton, FormField, Cards, MessageRow, AppShell, SettingsSheet
    └── screens/                    # all screens + App routing
```

See the root [README.md](../README.md) for overall project context and the [team charter](../docs/team-charter.md) for who owns mobile work.
