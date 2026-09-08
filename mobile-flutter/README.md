# CareConnect - Flutter (Mobile)

The CareConnect mobile app (Android + iOS), implementing the team's Figma
design system with a **Left-Hand Mode** accessibility focus. Covers
**LO1: Design and build a mobile user interface**.

## What's implemented (Week 4)

- **12 functional screens**: Landing (with assistant chat), Sign In, Sign Up,
  Dashboard, Medications, Appointments, Activity, Messages, a Message detail
  screen, a Medication detail screen, an Appointment detail screen, and an
  Archived messages screen. 
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
  - Tapping a medication or appointment card (outside its Edit/Delete
    buttons) does the same: `pushNamed('/medications/detail', ...)` /
    `pushNamed('/appointments/detail', ...)`, opening a detail screen for
    that specific item with its own Edit and Delete actions, backed by the
    same form sheet and (for medications) delete-confirmation dialog the
    list card uses.
  - The Messages screen's header has an Archived-messages button (a plain
    archive icon, deliberately without a count badge -- unlike an unread
    count, an archived count can't be cleared by the user, so a persistent
    number there would just be a permanent, meaningless notification) that
    does `pushNamed('/messages/archived')`, opening a list of just the
    messages that have been archived -- they're hidden from the main inbox, not
    deleted, and this is the one place they're still visible.
  - Sign in / sign up / sign out use `pushNamedAndRemoveUntil` so the auth
    screens and the authenticated app never end up on the same back stack.
- **State management**: a single `AppState` (`ChangeNotifier`) holds all
  app data (medications, appointments, activity log, messages, and
  settings). It is created once in `main.dart` and published through a
  `ChangeNotifierProvider` (the `provider` package); the app's root widget
  reads it with `context.watch<AppState>()`, and that rebuild is what
  propagates a change through every currently-active screen. Screens still
  receive `AppState` through their own constructors (a plain, ordinary
  Provider usage pattern - only the root needed to reach for `context.watch`
  directly), and call its methods directly rather than duplicating data in
  local `setState`. Local, screen-only UI state (a form's in-progress text,
  whether a sheet is open) stays in each screen's own `State` with
  `setState`, per the assignment's guidance that `setState` is fine for
  small local state but not for state shared across the app. Navigation
  state itself is not stored on `AppState` at all, it is owned entirely by
  the `Navigator`.
- **Messages**: read/unread state with its own tap target (a toggle button,
  not a swipe gesture, per the team's "No Drag-Only Actions" constraint,
  WCAG 2.5.7), an unread-count badge on the Messages nav item that stays in
  sync with the Dashboard's "Unread messages" widget, and compose/reply,
  archive, and delete flows. Archiving a message hides it from the main
  inbox without deleting it; the Archived messages screen lists just those,
  and its detail view offers Unarchive in place of Archive to bring one
  back.
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
  - Visible focus states on all interactive elements (2.4.7): TapButton
    draws a 3px focus ring offset 2px (in `--ring`, or `--destructive` for
    the destructive variant), per the design system's component library.
  - Semantic labels on icon-only buttons and on custom tappable rows (the
    message list's read/unread toggle, the dashboard's medication and
    message tiles, the nav items) for TalkBack/VoiceOver.
- **Full TapButton interaction states** (per the Assignment 3 component
  library, §6.3.1): every variant has hover (`--*-hover`) and press
  (`--*-active`) background tokens wired in, a disabled state at 40%
  opacity, and the keyboard focus ring above -- previously the button
  rendered identically in every state.
- **SOS dialog opens a real `tel:` link** (`url_launcher`), matching the
  design system's SOS confirmation spec (§3.3) instead of just closing
  the dialog.
- **Appointment deletion confirms first**, via the same confirm dialog
  pattern medications and messages already used -- previously it deleted
  immediately with no confirmation step.
- **"✓ Taken!" inline confirmation** on the medication card's mark-as-taken
  toggle, matching the design system's inline status feedback pattern
  (§6.3.8) already used by the Dashboard check-in and Activity refresh.
- **A real TextTheme** in `app_theme.dart` implementing the Assignment 3
  typography scale (§6.2: h1 32/800 ... caption 12/500, label 12/600
  uppercase), applied as the app-wide `ThemeData.textTheme` instead of
  screens each hand-rolling ad-hoc font sizes.
- **Tests** (`test/`): unit tests for `AppState`'s business logic
  (medications, appointments, activity logging, message read/unread/
  archive/delete, settings, sign-in/sign-out, and the injected-clock
  timestamp formatting) plus widget tests for every screen: Landing, Sign
  In/Sign Up (validation and successful sign-in/sign-up navigation),
  Dashboard (check-in, alerts, the medication tile toggle, Customize, and
  "View all" navigation), Medications and Appointments (add/edit/delete,
  including validation), Medication detail and Appointment detail
  (list-to-detail data hand-off, mark-as-taken, edit-in-place, and delete
  returning to the list), Activity (filtering and refresh), Messages and
  Message detail (compose, reply, archive, delete, the read/unread toggle,
  and list-to-detail data hand-off), Archived messages (the archive entry
  point's lack of a count badge, filtering to just archived messages, and
  unarchiving back to the inbox), the Settings sheet, and the shared
  `TapButton` / `CCFormField` / card components. `mocktail` mocks callback
  dependencies (e.g. verifying a button's `onPressed` fires exactly once)
  where that is a more direct check than inferring it from a side effect.
  TapButton's interaction states are covered directly: disabled 40%
  opacity, hover/press token colors, and the keyboard focus ring
  (including the destructive variant ringing in `--destructive`).

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
                                # Appointments, Activity, Messages, Message
                                # detail, Medication detail, Appointment
                                # detail, Archived messages

test/
├── models/
│   ├── app_state_test.dart            # Unit tests for AppState's business logic
│   └── medication_test.dart           # Unit tests for Medication.copyWith
├── support/test_app.dart              # Shared test harness: full named-route app + seed data
└── widget/
    ├── navigation_test.dart           # Nav, Left-Hand Mode, message detail data hand-off
    ├── dashboard_screen_test.dart
    ├── medications_screen_test.dart
    ├── appointments_screen_test.dart
    ├── medication_detail_screen_test.dart
    ├── appointment_detail_screen_test.dart
    ├── activity_screen_test.dart
    ├── messages_screen_test.dart
    ├── message_detail_screen_test.dart
    ├── archived_messages_screen_test.dart
    ├── auth_screens_test.dart
    ├── landing_screen_test.dart
    ├── settings_drawer_test.dart
    ├── tap_button_test.dart
    ├── form_field_test.dart
    └── cards_test.dart
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
cd mobile-flutter
flutter pub get
flutter test --coverage
```

This runs every file under `test/` and writes `coverage/lcov.info`.

### Generating the HTML coverage report

`lcov.info` is a plain-text summary, not the report the assignment asks
for. Turn it into an HTML page one of these ways:

- **VS Code, no install needed:** the "Coverage Gutters" extension reads
  `coverage/lcov.info` directly and shows a percentage plus inline
  highlighting in the editor. Fastest option if the team is on VS Code
  already.
- **Node (already installed for the `web/` project on this repo):**
  ```bash
  npx lcov-viewer lcov coverage/lcov.info -o coverage/html
  ```
  then open `coverage/html/index.html`. This works the same on Windows,
  macOS, and Linux without installing `lcov`/`genhtml` separately.
- **macOS/Linux with `lcov` installed** (`brew install lcov` or
  `apt install lcov`), or Windows via WSL:
  ```bash
  genhtml coverage/lcov.info -o coverage/html
  ```

Whichever method is used, take the coverage screenshot from the report's
summary page (it shows the overall line percentage) for the submission
package.

## Known issues and limitations

- **TalkBack/VoiceOver has not been tested on a physical device or
  emulator with a screen reader running**, only via the semantic
  properties (`Semantics`, `semanticLabel`, `tooltip`) set in the widget
  code and exercised by `find.bySemanticsLabel` in a couple of the widget
  tests. A manual screen-reader pass is still worth doing before the video
  walkthrough.
- **The assistant chat on the Landing screen is a scripted, canned-reply
  demo**, not a real chatbot integration and is really just a placeholder from the initial CareConnect design.

## Team contributions (Week 4)

Per the team charter's rotation for weeks 3 to 4, Wiliss Tako is Technical
Lead, Dom Puller is QA / Testing Lead, and Upneet Bir is Documentation
Lead for this cycle. Fill in the specifics below before submitting:

- **Dom Puller** -
- **Upneet Bir** -
- **Wiliss Tako** -

## AI Usage Disclosure

Claude and Figma Make was used as intial generative design and coding tools across this Flutter
implementation. All AI-assisted code was reviewed before being committed.

## Design source

Screens are ported from the team's Figma Make prototype
(`SWEN661-T1-MobileTabletUIImplementation`), which stays the source of
truth for design and feature changes; the Flutter build is kept in sync
with it by hand. See [docs/week3-design-notes.md](../docs/week3-design-notes.md)
for the original design decisions and persona mapping, and the root
[README.md](../README.md) for overall project context.
