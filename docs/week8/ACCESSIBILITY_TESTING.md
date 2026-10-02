# CareConnect Desktop: Accessibility Testing (Week 8)

The team accessibility constraint is Left-Hand Mode (one-handed operation) with a target of WCAG 2.2 AA. This document lists what is verified automatically and gives Dom a manual checklist and video scripts for the parts that need a real Mac and a screen reader. VoiceOver on macOS is the primary screen reader; NVDA on Windows is a secondary check (section 2b). The Result column is left blank on purpose.

## 1. Automated checks (already passing)

| Check | Where | What it proves |
|---|---|---|
| jest-axe on every screen and dialog | `test/renderer/accessibility.test.tsx` (8 tests) | No axe violations on landing, sign in, dashboard and the other pages, settings, keyboard shortcuts and emergency dialogs, and the medication and appointment forms. Earlier runs found three real issues (nested status role, unlabeled progress bar, heading order) that were fixed. |
| Keyboard operation of menus | `test/renderer/appShell.test.tsx` | In-app menus open and navigate with the keyboard; Escape closes; skip link targets main content. |
| Keyboard shortcuts | `appShell.test.tsx`, `App.test.tsx`, `menu.test.cjs` | F1, Ctrl+, Ctrl+F, Ctrl+N, zoom keys, Ctrl+1 to 5 and the native accelerators. |
| Focus trap in dialogs | `test/renderer/workflows.test.tsx` | Tab and Shift+Tab wrap inside an open dialog. |
| Dialog dismissal | `pages.test.tsx` | Forms close with Escape, Cancel and Close. |
| Native menu labels and mnemonics | `menu.test.cjs`, e2e test 1 | The real menu exposes File, Edit, View and Help (Alt mnemonics on Windows and Linux; app menu, Window menu and Help search on macOS). |
| macOS variant of the UI | `test/renderer/macPlatform.test.tsx` | Command-key hints and the "Move to the menu bar" shortcut row on a Mac. |

Automated tools cannot judge screen reader announcements, real focus visibility, or the system contrast settings. Those are the manual steps below.

## 2. Manual checklist (to be completed by Dom on the Intel Mac)

Setup: install the Mac build (`release/CareConnect-0.8.0-mac-x64.dmg`, first launch Control-click > Open) or run `npm start`. Sign in with any password. Record the date, macOS version and Mac model in the notes.

Three macOS settings are used below:

- VoiceOver: Cmd+F5 turns it on and off. The VO key is Ctrl+Option. VO+Right Arrow moves to the next item, VO+Space activates, VO+M moves to the menu bar, VO+U opens the rotor (headings, landmarks, links, form controls).
- Increase contrast: System Settings > Accessibility > Display > Increase contrast.
- Full Keyboard Access: System Settings > Keyboard > Keyboard navigation on (or Ctrl+F7), so Tab reaches every control, not only text fields.

| # | Check | How | Expected | Result | Notes |
|---|---|---|---|---|---|
| 1 | Full Keyboard Access on | Turn on Keyboard navigation (System Settings > Keyboard) | Tab reaches every button, link and control in the app | | |
| 2 | Keyboard only: sign in | Tab through the landing and sign in pages, Return to submit | Every control reachable, order is logical | | |
| 3 | Keyboard only: dashboard | Tab across widgets, check-in, medication toggles, customize | All actions work without a mouse | | |
| 4 | Keyboard only: medications | Add, edit, mark taken, delete (with confirmation) | Dialogs trap focus, Escape closes, focus returns to the trigger | | |
| 5 | Keyboard only: appointments | Add, edit, delete | Same as above | | |
| 6 | Keyboard only: activity | Use the filter and refresh | Filter changes the list, focus not lost | | |
| 7 | Keyboard only: messages | Read, mark unread, archive, compose, reply, delete | All reachable and operable | | |
| 8 | Keyboard only: settings | Cmd+, then theme, text size, high contrast, Left-Hand Mode | All controls reachable, Escape closes | | |
| 9 | Native menu by keyboard | Ctrl+F2 (or VO+M) to reach the menu bar, arrows, Return. Then Cmd+1 to 5, Cmd+N, Cmd+S, Cmd+E, Cmd+O, Cmd+P, F1, Ctrl+Cmd+F | Menus open and items run; every shortcut works; Help has the search field | | |
| 10 | Visible focus | Tab through every screen | A clear focus indicator is visible on every control, in light and dark themes | | |
| 11 | VoiceOver: launch and sign in | Cmd+F5, open CareConnect, VO+Right Arrow through the sign in form | Labels, required fields and errors are announced | | |
| 12 | VoiceOver: navigation | VO+Right Arrow, VO+U rotor (headings and landmarks), VO+M for the menu bar | Landmarks, headings and the status line are announced; menu items are announced with their shortcuts | | |
| 13 | VoiceOver: dialogs | Open Settings, Add medication, Emergency (VO+Space on the buttons) | Dialog name announced on open; focus stays inside; closing returns focus | | |
| 14 | VoiceOver: live updates | Mark a medication taken, record a check-in, save | Status message is announced without moving focus | | |
| 15 | macOS Increase contrast | System Settings > Accessibility > Display > Increase contrast on | Text, borders, buttons and focus rings stay visible and readable | | |
| 16 | In-app High contrast | Shift+Cmd+H or Settings | Colors change to the high contrast palette; all text readable; toggles back | | |
| 17 | Dark mode | System Settings > Appearance > Dark, then Light | App follows the system appearance; contrast holds in both | | |
| 18 | 200% zoom | Cmd+= until 200%; also try Display scaling set to a larger text size | No loss of content or function, no horizontal scroll trap; Cmd+0 resets | | |
| 19 | Text size setting | Settings, increase text size | Layout holds, nothing clipped | | |
| 20 | Left-Hand Mode | Shift+Cmd+L, then complete a check-in, mark a medication taken and open Messages using one hand | Controls move to the left side and tasks are reachable with the left hand only | | |
| 21 | Menu bar icon and notifications | Close the window (app stays running), use the menu bar icon menu, trigger a check-in | Menu bar menu works from the keyboard (VO+M), notification text is readable | | |

### 2b. Secondary: NVDA and Windows contrast themes (only if a Windows PC is available)

Install the Windows build (`CareConnect-Setup-0.8.0.exe`) or run `npm start`.

| # | Check | How | Expected | Result | Notes |
|---|---|---|---|---|---|
| W1 | NVDA: launch and sign in | Start NVDA (nvaccess.org), open CareConnect, Tab through the sign in form | Labels, required fields and errors are announced | | |
| W2 | NVDA: navigation and menu | Tab and arrow keys; NVDA+Space toggles focus and browse mode; Alt, then F/E/V/H for the menus | Landmarks, headings and the status line are announced; menu items are announced with their shortcuts | | |
| W3 | NVDA: dialogs and live updates | Open Settings, Add medication, Emergency; mark a medication taken | Dialog name announced; status message announced without moving focus | | |
| W4 | Windows Contrast themes | Windows Settings > Accessibility > Contrast themes, pick one (for example Aquatic and Night sky) | Text, borders, buttons and focus rings stay visible and readable | | |
| W5 | Tray | Minimize, use the tray menu (Windows key + B to reach it) | Tray menu works from the keyboard | | |

## 3. Script: keyboard and screen reader video (2 to 3 minutes)

The team records the video (QuickTime Player > File > New Screen Recording, with system audio so VoiceOver is heard, or a screen recorder that captures it). Suggested script:

1. (0:00) Say who you are and that this is CareConnect desktop on macOS, Week 8. Press Cmd+F5 to start VoiceOver and show it is running.
2. (0:15) Launch the app. With VoiceOver speaking, press VO+Right Arrow through the landing page, activate Sign in with VO+Space, type an email and any password, press Return.
3. (0:45) On the dashboard press Ctrl+F2 (or VO+M) to reach the menu bar, open the View menu and choose Medications (or press Cmd+2). Show VoiceOver reading the page heading.
4. (1:10) Move to a medication, press VO+Space on Mark as taken and let VoiceOver read the status message.
5. (1:30) Press Cmd+N to open a new message, type a short message, press Escape to cancel. Show focus returning.
6. (1:50) Press Cmd+, to open Settings. Toggle High contrast (Shift+Cmd+H) and Left-Hand Mode (Shift+Cmd+L). Show the visible focus ring. Optionally open VO+U to show headings and landmarks.
7. (2:25) Press F1 to show the shortcuts list. Close it with Escape. Say what was demonstrated, press Cmd+F5 to stop VoiceOver and end.

## 4. Outline: 10 to 15 minute walkthrough video

The team records the video. Suggested outline:

1. (0:00 to 1:00) Introduction: project, team, what Week 8 delivers.
2. (1:00 to 2:30) Checkout and setup: `git clone`, `git checkout feat/electron-buiild-wk8` (or main after merge), `cd desktop-electron`, `npm ci`.
3. (2:30 to 4:30) Run `npm run lint`, `npx tsc --noEmit`, `npm test` and show the passing results.
4. (4:30 to 6:00) Run `npm run test:coverage`, open `coverage/lcov-report/index.html`, point out totals and the per-folder view. Optionally run `npm run test:e2e`.
5. (6:00 to 11:00) Run the app with `npm start` and walk through features against the rubric: native menu and shortcuts, sign in, dashboard check-in, medications, appointments, activity, messages, settings and Left-Hand Mode, window state (resize, close, reopen), autosave then Export and Import with native dialogs, tray, notifications, single instance.
6. (11:00 to 12:30) Packaging: show `npm run dist:mac:intel` output, open the dmg, drag the app to Applications, launch it with Control-click > Open (mention the Gatekeeper warning because the build is not notarized). Show the GitHub Actions artifacts for Apple Silicon and Windows. Mention auto-update needs a GitHub Release.
7. (12:30 to 14:00) Docs review: desktop-electron README, ARCHITECTURE.md (process model, IPC table, security checklist), TEST_REPORT.md, this accessibility document.
8. (14:00 to 15:00) Wrap up: limitations and next steps.
