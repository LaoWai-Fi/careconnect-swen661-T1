# CareConnect — Flutter (Mobile)

The CareConnect mobile app (Android + iOS), implementing the team's Week 3
Figma design system with a **Left-Hand Mode** accessibility focus. Covers
**LO1: Design and build a mobile user interface**.

## What's implemented (Week 3)

- **Design system as code** — all Figma tokens (colors, type scale, radii,
  tap-target sizes) ported to `lib/theme/tokens.dart` and applied through
  `lib/theme/app_theme.dart` with full light/dark theme support.
- **8 screens** — Landing (with assistant chat), Sign In, Sign Up, Role
  Chooser, Dashboard, Medications, Appointments, Activity.
- **One-Handed Mode** (Settings → One-Handed Mode): Left mode anchors the
  bottom navigation to the left edge and moves the SOS button to the
  bottom-left corner, keeping frequent actions in the left thumb zone.
- **Tablet layouts** — sidebar navigation replaces the bottom bar at ≥768dp;
  content grids switch from single-column to multi-column.
- **WCAG 2.2 AA behaviors**:
  - Tap targets ≥44dp everywhere; primary buttons 52–60dp (2.5.8)
  - Dashboard reordering works with Move Up / Move Down buttons — no drag
    required (2.5.7); long-press drag is offered only as an optional extra
  - Visible focus states on all interactive elements (2.4.7)
  - Semantic labels on all icon-only buttons for TalkBack/VoiceOver

## Project structure

```
lib/
├── main.dart                  # App entry, routing, demo seed data
├── models/app_state.dart      # State model (meds, appointments, activity)
├── theme/
│   ├── tokens.dart            # Design tokens from the Figma system
│   └── app_theme.dart         # Light/dark ThemeData builders
├── widgets/
│   ├── tap_button.dart        # Primary button component (5 variants, 3 sizes)
│   ├── form_field.dart        # Labelled fields + inputs
│   ├── cards.dart             # Logo, StatCard, AlertCard
│   ├── app_shell.dart         # Header, nav (phone/tablet), SOS
│   └── settings_drawer.dart   # Settings sheet (hand mode, theme, text size)
└── screens/                   # 8 screens ported 1:1 from the Figma design
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

## Design source

Screens are ported from the team's Week 3 Figma file (Figma Make export).
See [docs/week3-design-notes.md](../docs/week3-design-notes.md) for the
design decisions and persona mapping, and the root
[README.md](../README.md) for overall project context.
