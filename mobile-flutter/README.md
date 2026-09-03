# CareConnect - Flutter (Mobile)

The CareConnect mobile app (Android + iOS), implementing the team's Figma
design system with a **Left-Hand Mode** accessibility focus. Covers
**LO1: Design and build a mobile user interface**.

## What's implemented (Week 4)

- **9 functional screens**: Landing (with assistant chat), Sign In, Sign Up,
  Dashboard, Medications, Appointments, Activity, Messages, and a Message
  detail screen. (The Week 3 Role Chooser screen was removed once the team
  scoped the app to the caregiver role only.)
- **Real navigation** via the Flutter `Navigator` and named routes
  (`MaterialApp(initialRoute:, onGenerateRoute:)` in `lib/main.dart`), not a
  hand-rolled page switch:
  - The bottom nav bar / tablet sidebar use `pushReplacementNamed` between
    the five main tabs, so the back stack does not grow on every tab tap
    (matching standard bottom-nav behavior).
  - Selecting a message in the Messages list or in the Dashboard's unread
    widget does a real `pushNamed('/messages/detail', arguments: message)`,
    handing that specific `Message` object to the detail screen and giving
    it a genuine back stack: opening a message and tapping Back returns to
    the list, not to the previous tab.
  - Sign in / sign up / sign out use `pushNamedAndRemoveUntil` so the auth
    screens and the authenticated app never end up on the same back stack.
- **State management**: a single `AppState` (`ChangeNotifier`) holds all
  app data (medications, appointments, activity log, messages, and
  settings) and is threaded through the widget tree via constructor
  injection; screens call its methods and rebuild through `notifyListeners`.
  Navigation state itself is not stored here, it is owned entirely by the
  `Navigator`.
- **Messages**: read/unread state with its own tap target (a toggle button,
  not a swipe gesture, per the team's "No Drag-Only Actions" constraint,
  WCAG 2.5.7), an unread-count badge on the Messages nav item that stays in
  sync with the Dashboard's "Unread messages" widget, and compose/reply,
  archive, and delete flows.
- **One-Handed Mode** (Settings, One-Handed Mode): Left mode anchors the
  bottom navigation (or the sidebar, on tablets) to the left edge and moves
  the SOS button to the bottom-left corner, keeping frequent actions in the
  left thumb zone.
- **Tablet layouts**: sidebar navigation replaces the bottom bar at >=768dp;
  content grids switch from single-column to multi-column.
- **WCAG 2.2 AA behaviors**:
  - Tap targets >=48dp everywhere (WCAG 2.5.8 baseline used for this
    assignment); primary buttons 52-60dp.
  - Dashboard reordering works with Move Up / Move Down buttons, no drag
    required (2.5.7); long-press drag is offered only as an optional extra.
  - Visible focus states on all interactive elements (2.4.7).
  - Semantic labels on icon-only buttons and on custom tappable rows (the
    message list's read/unread toggle, the dashboard's medication and
    message tiles, the nav items) for TalkBack/VoiceOver.
- **Tests** (`test/`): unit tests for `AppState`'s business logic
  (medications, appointments, activity logging, message read/unread/
  archive/delete, settings, sign-in/sign-out) and widget tests covering tab
  navigation, the Left-Hand Mode FAB placement, and the messages-to-detail
  navigation flow, including that the tapped message's own data (not just
  a generic re-render) appears on the detail screen and that Back returns
  to the list.

## Project structure

```
lib/
├── main.dart                  # App entry, named-route navigation, demo seed data
├── models/app_state.dart      # State model (meds, appointments, activity, messages)
├── theme/
│   ├── tokens.dart            # Design tokens from the Figma system
│   └── app_theme.dart         # Light/dark ThemeData builders
├── widgets/
│   ├── tap_button.dart        # Primary button component (5 variants, 3 sizes)
│   ├── form_field.dart        # Labelled fields + inputs
│   ├── cards.dart             # Logo, StatCard, AlertCard
│   ├── app_shell.dart         # Header, nav (phone/tablet), SOS, AppTab enum
│   └── settings_drawer.dart   # Settings sheet (hand mode, theme, text size)
└── screens/                   # Landing, auth, Dashboard, Medications,
                                # Appointments, Activity, Messages, Message detail

test/
├── models/app_state_test.dart     # Unit tests for AppState
└── widget/navigation_test.dart    # Widget tests: nav, Left-Hand Mode, message detail
```

## Running the app

Requires the [Flutter SDK](https://docs.flutter.dev/get-started/install)
(3.27+ / Dart 3.6+).

```bash
cd mobile-flutter
flutter create . --platforms=android,ios --project-name careconnect   # one-time: generates android/ + ios/ shells
flutter pub get
flutter run                    # or: flutter run -d chrome for a quick web preview
```

> `flutter create .` generates the native `android/` and `ios/` folders
> (not checked in until you run it). Run it once after cloning, then commit
> the generated folders so teammates don't need to regenerate them.

## Running the tests

```bash
flutter test --coverage
```

`coverage/lcov.info` is written after the run; a local `lcov`/`genhtml`
install, or the Coverage Gutters VS Code extension, can turn that into a
line-by-line report against the Week 4 60% coverage target.

## Design source

Screens are ported from the team's Figma Make prototype
(`SWEN661-T1-MobileTabletUIImplementation`), which stays the source of
truth for design and feature changes; the Flutter build is kept in sync
with it by hand. See [docs/week3-design-notes.md](../docs/week3-design-notes.md)
for the original design decisions and persona mapping, and the root
[README.md](../README.md) for overall project context.
