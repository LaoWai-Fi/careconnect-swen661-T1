# Week 3 — Mobile Design & Early Implementation Notes

**Team:** Team 1 — Dom Puller, Upneet Bir, Wiliss Tako
**Week:** 3 (Mobile Design and Early Implementation)
**Project:** CareConnect — Left-Handed User Focused UI

## 1. What we did this week

| Area | Work |
|---|---|
| Mobile design system | Full token set defined in Figma (colors, type scale, radii, tap-target sizes) with light and dark themes |
| Figma + AI | Screens drafted with Figma Make; the generated design was refined by the team into the final component library |
| Phone design | 8 touch-optimized screens: Landing, Sign In, Sign Up, Role Chooser, Dashboard, Medications, Appointments, Activity |
| Tablet design | Sidebar navigation replaces the bottom bar at ≥768dp; content grids go multi-column |
| Navigation | Bottom thumb-zone bar (Dashboard, Medications, Appointments, Activity) that anchors to the **left edge** in Left-Hand Mode |
| Flutter implementation | The full design ported to Flutter in `mobile-flutter/` — see its README |
| Accessibility | One-Handed Mode (Off/Left/Right), 44dp+ targets, tap-based reorder, visible focus, semantic labels |

## 2. How the design adapts to our user persona

Our assigned constraint is the **Left-Handed User Constraints** (WCAG 2.2 AA).
Our primary persona from Week 2's mock user interviews is a left-hand-dominant
caregiver (Renata Alvarez) who operates the phone one-handed with her left
hand while physically assisting the care recipient. Every major design
decision traces back to her needs:

| Persona need | Design response |
|---|---|
| Operate one-handed while assisting the care recipient | One-Handed Mode setting shifts navigation toward the active thumb; all core actions are single-tap |
| Left-thumb reach for frequent actions | In Left mode the bottom nav anchors to the left edge and the SOS button moves to the bottom-left corner |
| Fast medication confirmation mid-task | Dashboard medication tiles are single-tap mark-as-taken with instant visual feedback |
| No drag-based reordering | Dashboard customization offers Move Up / Move Down buttons as the primary reorder path (WCAG 2.5.7); drag is optional only |
| Small buttons cause mis-taps | Minimum 44dp tap targets everywhere; primary buttons 52–60dp (WCAG 2.5.8) |
| End-of-day joint discomfort | Text Size setting (Default / Large / X-Large) scales the whole app without digging into OS settings |

## 3. Design system summary

Tokens are defined once in Figma and mirrored 1:1 in Flutter
(`mobile-flutter/lib/theme/tokens.dart`), so the two stay in sync:

- **Primary:** `#1B6E7A` (light) / `#4CC8D8` (dark), contrast-checked against
  both foregrounds
- **Type scale:** Inter — h1 32/800 through caption 12/500
- **Radius:** 12dp base, 16dp cards, 24dp sheets
- **Status surfaces:** success / warning / info background-border-text trios
  in both themes; status is never conveyed by color alone (icon + label always
  accompany it)
- **Tap targets:** sm 44dp / md 52dp / lg 60dp button heights

## 4. Accessibility requirements (mobile-specific)

This extends the Week 2 accessibility plan to mobile:

1. **Left-Hand Mode** — Settings → One-Handed Mode → Left mirrors navigation
   and key actions to the left edge (bottom bar anchors left; SOS moves to
   bottom-left; tablet sidebar stays left-anchored).
2. **Large tap targets** — every interactive element ≥44dp; core actions
   (nav, medication confirm, SOS, message send) ≥52dp (WCAG 2.5.8).
3. **No drag-only actions** — dashboard reordering has Move Up / Move Down /
   toggle controls; drag is a convenience, never a requirement (WCAG 2.5.7).
4. **Controls easy to reach** — frequent actions sit in the bottom thumb zone;
   in Left mode they cluster at the left edge.
5. **Visible focus** — 3px focus outlines on all interactive elements,
   contrast-checked in light and dark themes (WCAG 2.4.7).

Screen reader support: all icon-only buttons carry semantic labels
(e.g. "Mark as taken", "Dismiss alert"); status changes announce politely;
planned testing with TalkBack (Android) and VoiceOver (iOS).

## 5. Flutter implementation notes

- State management: a single `AppState` model (`ChangeNotifier`) mirrors the
  Figma prototype's state shape, so behavior matches the design exactly.
- Layouts are responsive: `MediaQuery.sizeOf(context).width >= 768` switches
  between phone (bottom nav, single column) and tablet (sidebar, multi-column)
  presentations.
- Demo data is seeded on launch so every screen is reviewable immediately.

## 6. Open items for team review

- Wire real persistence (currently in-memory demo state)
- Sign-in/role flows are demo-only (any credentials work)
- Keyboard-focus validation pass on the Flutter build once running on device
- Upneet's and Dom's mock user interviews still pending fold-in from Week 2
