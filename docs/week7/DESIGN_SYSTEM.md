# CareConnect desktop design system

**Design source:** [Figma Make — Desktop UI Build](https://www.figma.com/make/qqSJqhacYy5eD8nomjAqnL/Desktop-UI-Build), provided by a teammate. The source link is private. The copied export in `Desktop UI Build/` was the implementation reference; this document describes the desktop system visible in that export and the Week 7 Electron prototype.

## Desktop principles

- Keep the care context visible while working: patient/care-plan identity in the title/side rail, current section in the workspace header, and status in the footer.
- Use desktop affordances: menu bar for grouped commands, toolbar for frequent actions, persistent sidebar for section switching, dialogs for settings/help, and a context menu for local actions.
- Use width for parallel scanning, not simply larger mobile cards. Dashboard summary spans three status cards, alerts form a multi-column area, medications form a two-column grid, and messages occupy the wider content region.
- Allow a resizable window (1440 × 900 starting size; 900 × 600 minimum). The layout becomes compact near 960 px effective width or at higher zoom.

## Tokens and states

| Role | Light | Dark | Usage |
| --- | --- | --- | --- |
| Primary | `#1b6e7a` | `#4cc8d8` | Buttons, links, selected navigation, focus context |
| Page background | `#f0f4f7` | `#0f1e25` | Main canvas |
| Text | `#1a2b35` | `#e6eff4` | Primary reading text |
| Surface/card | `#ffffff` | `#162630` | Dialogs and content cards |
| Muted text | `#4a6270` | `#8fb2bf` | Secondary labels |
| Border | `#7c848a` | `#547e9a` | Control and card boundaries |
| Destructive | `#b91c1c` | `#f87171` | Destructive actions and emergency affordance |
| Focus ring | `#1b6e7a` | `#4cc8d8` | Keyboard focus |

The source uses 16 px normal text, 19 px large text, and 22 px extra-large text. Interface zoom steps range from 80% to 200%; the responsive compact state is based on effective width after zoom. Rounded cards use a 0.75 rem base radius. Light, dark, and system appearance are exposed in Settings.

## Component inventory

| Component | Desktop-specific behavior |
| --- | --- |
| Window title bar | CareConnect branding, care context, and functional minimize/maximize/close controls in Electron. |
| Menu bar | File, Edit, View, Help; supports Tab, arrows, Enter/Space, Escape, and Alt+menu access. |
| Toolbar | New message, medication/appointment shortcuts, demo sync status, Find, Settings, Emergency information. |
| Sidebar | Persistent patient context, five primary workspaces, counts, and shortcut hints. |
| Workspace header/status bar | Current section and explicit prototype status; no false claim of live data. |
| Cards and lists | Dashboard summaries, medication cards, appointment and activity views, message list/detail. |
| Dialogs | Settings, keyboard reference, search, confirmations, emergency information. |

## Large-display screen set

- [`01-welcome-1440x900.png`](evidence/01-welcome-1440x900.png): desktop entry with split editorial copy and workspace preview.
- [`02-overview-1440x900.png`](evidence/02-overview-1440x900.png): care dashboard, three-column status, alerts, sidebar, toolbar.
- [`03-medications-1440x900.png`](evidence/03-medications-1440x900.png): two-column medication work area.
- [`04-messages-1440x900.png`](evidence/04-messages-1440x900.png): large-screen messaging workflow.
- [`05-shortcuts-1440x900.png`](evidence/05-shortcuts-1440x900.png): keyboard reference dialog.
- [`06-overview-light-1440x900.png`](evidence/06-overview-light-1440x900.png): light appearance of the same desktop workspace.

These are screenshots from the Electron implementation based on the teammate's Figma Make export, not screenshots of the private Figma editor. The design owner should include a Figma-page export if a grader requires original canvas evidence.
