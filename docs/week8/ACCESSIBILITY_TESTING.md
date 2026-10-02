# CareConnect Desktop: Accessibility Testing (Week 8)

The team accessibility constraint is Left-Hand Mode (one-handed operation) with a target of WCAG 2.2 AA. This document lists what is verified automatically and gives Dom a manual checklist and video scripts for the parts that need a real Windows machine and a screen reader. The Result column is left blank on purpose.

## 1. Automated checks (already passing)

| Check | Where | What it proves |
|---|---|---|
| jest-axe on every screen and dialog | `test/renderer/accessibility.test.tsx` (8 tests) | No axe violations on landing, sign in, dashboard and the other pages, settings, keyboard shortcuts and emergency dialogs, and the medication and appointment forms. Earlier runs found three real issues (nested status role, unlabeled progress bar, heading order) that were fixed. |
| Keyboard operation of menus | `test/renderer/appShell.test.tsx` | In-app menus open and navigate with the keyboard; Escape closes; skip link targets main content. |
| Keyboard shortcuts | `appShell.test.tsx`, `App.test.tsx`, `menu.test.cjs` | F1, Ctrl+, Ctrl+F, Ctrl+N, zoom keys, Ctrl+1 to 5 and the native accelerators. |
| Focus trap in dialogs | `test/renderer/workflows.test.tsx` | Tab and Shift+Tab wrap inside an open dialog. |
| Dialog dismissal | `pages.test.tsx` | Forms close with Escape, Cancel and Close. |
| Native menu labels and mnemonics | `menu.test.cjs`, e2e test 1 | The real menu exposes File, Edit, View and Help with Alt mnemonics. |

Automated tools cannot judge screen reader announcements, real focus visibility, or Windows contrast themes. Those are the manual steps below.

## 2. Manual checklist (to be completed by Dom on Windows)

Setup: install the Windows build (`release/CareConnect-Setup-0.8.0.exe`) or run `npm start`. Sign in with any password. Record the date, Windows version and NVDA version in the notes.

| # | Check | How | Expected | Result | Notes |
|---|---|---|---|---|---|
| 1 | Keyboard only: sign in | Tab through the landing and sign in pages, Enter to submit | Every control reachable, order is logical | | |
| 2 | Keyboard only: dashboard | Tab across widgets, check-in, medication toggles, customize | All actions work without a mouse | | |
| 3 | Keyboard only: medications | Add, edit, mark taken, delete (with confirmation) | Dialogs trap focus, Escape closes, focus returns to the trigger | | |
| 4 | Keyboard only: appointments | Add, edit, delete | Same as above | | |
| 5 | Keyboard only: activity | Use the filter and refresh | Filter changes the list, focus not lost | | |
| 6 | Keyboard only: messages | Read, mark unread, archive, compose, reply, delete | All reachable and operable | | |
| 7 | Keyboard only: settings | Ctrl+, then theme, text size, high contrast, Left-Hand Mode | All controls reachable, Escape closes | | |
| 8 | Native menu by keyboard | Alt+F, Alt+E, Alt+V, Alt+H, arrows, Enter | Menus open and items run; Ctrl+1 to 5, Ctrl+N, Ctrl+S, Ctrl+E, Ctrl+O, Ctrl+P, F1, F11 work | | |
| 9 | Visible focus | Tab through every screen | A clear focus indicator is visible on every control, in light and dark themes | | |
| 10 | NVDA: launch and sign in | Start NVDA (nvaccess.org), open CareConnect, Tab through the sign in form | Labels, required fields and errors are announced | | |
| 11 | NVDA: navigation | Tab and arrow keys; NVDA+Space toggles focus and browse mode; Alt for the menu bar | Landmarks, headings and the status line are announced; menu items are announced with their shortcuts | | |
| 12 | NVDA: dialogs | Open Settings, Add medication, Emergency | Dialog name announced on open; focus stays inside; closing returns focus | | |
| 13 | NVDA: live updates | Mark a medication taken, record a check-in, save | Status message is announced without moving focus | | |
| 14 | Windows Contrast themes | Windows Settings > Accessibility > Contrast themes, pick one (for example Aquatic and Night sky) | Text, borders, buttons and focus rings stay visible and readable | | |
| 15 | In-app High contrast | Ctrl+Shift+H or Settings | Colors change to the high contrast palette; all text readable; toggles back | | |
| 16 | 200% zoom | Ctrl+= until 200% (and the Windows display scale at 200%) | No loss of content or function, no horizontal scroll trap; Ctrl+0 resets | | |
| 17 | Text size setting | Settings, increase text size | Layout holds, nothing clipped | | |
| 18 | Left-Hand Mode | Ctrl+Shift+L, then complete a check-in, mark a medication taken and open Messages using one hand | Controls move to the left side and tasks are reachable with the left hand only | | |
| 19 | Tray and notifications | Minimize, use the tray menu, trigger a check-in | Tray menu works from keyboard (Windows key + B), notification text is readable | | |

## 3. Script: keyboard and screen reader video (2 to 3 minutes)

The team records the video. Suggested script:

1. (0:00) Say who you are and that this is CareConnect desktop, Week 8. Start NVDA and show it is running.
2. (0:15) Launch the app. With NVDA speaking, Tab through the landing page, activate Sign in, type an email and any password, press Enter.
3. (0:45) On the dashboard press Alt+V, open the View menu, choose Medications (or press Ctrl+2). Show NVDA reading the page heading.
4. (1:10) Tab to a medication, press Enter on Mark as taken and let NVDA read the status message.
5. (1:30) Press Ctrl+N to open a new message, type a short message, press Escape to cancel. Show focus returning.
6. (1:50) Press Ctrl+, to open Settings. Toggle High contrast (Ctrl+Shift+H) and Left-Hand Mode (Ctrl+Shift+L). Show the visible focus ring.
7. (2:25) Press F1 to show the shortcuts list. Close it with Escape. Say what was demonstrated and stop.

## 4. Outline: 10 to 15 minute walkthrough video

The team records the video. Suggested outline:

1. (0:00 to 1:00) Introduction: project, team, what Week 8 delivers.
2. (1:00 to 2:30) Checkout and setup: `git clone`, `git checkout feat/electron-buiild-wk8` (or main after merge), `cd desktop-electron`, `npm ci`.
3. (2:30 to 4:30) Run `npm run lint`, `npx tsc --noEmit`, `npm test` and show the passing results.
4. (4:30 to 6:00) Run `npm run test:coverage`, open `coverage/lcov-report/index.html`, point out totals and the per-folder view. Optionally run `npm run test:e2e`.
5. (6:00 to 11:00) Run the app with `npm start` and walk through features against the rubric: native menu and shortcuts, sign in, dashboard check-in, medications, appointments, activity, messages, settings and Left-Hand Mode, window state (resize, close, reopen), autosave then Export and Import with native dialogs, tray, notifications, single instance.
6. (11:00 to 12:30) Packaging: show `npm run dist:win` output, run the installer (mention the SmartScreen warning because the build is unsigned), launch the installed app. Mention auto-update needs a GitHub Release.
7. (12:30 to 14:00) Docs review: desktop-electron README, ARCHITECTURE.md (process model, IPC table, security checklist), TEST_REPORT.md, this accessibility document.
8. (14:00 to 15:00) Wrap up: limitations and next steps.
