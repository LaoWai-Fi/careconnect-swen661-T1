# CareConnect Desktop: Accessibility Testing (Week 8)

The team accessibility constraint is Left-Hand Mode (one-handed operation) with a target of WCAG 2.2 AA. This document lists what is verified automatically and the results of the manual checks on a Mac with a screen reader. VoiceOver on macOS is the primary screen reader; NVDA on Windows is a secondary check (section 2b).

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

## 2. Manual checks (Intel MacBook Pro, macOS 26.6, 10/05/2026)

Setup: the installed Mac build (`CareConnect-0.8.0-mac-x64.dmg`) or `npm start`, signed in with the demo account.

Three macOS settings are used below:

- VoiceOver: Cmd+F5 turns it on and off. The VO key is Ctrl+Option. VO+Right Arrow moves to the next item, VO+Space activates, VO+M moves to the menu bar, VO+U opens the rotor (headings, landmarks, links, form controls).
- Increase contrast: System Settings > Accessibility > Display > Increase contrast.
- Full Keyboard Access: System Settings > Keyboard > Keyboard navigation on (or Ctrl+F7), so Tab reaches every control, not only text fields.

| # | Check | How | Expected | Result | Notes |
|---|---|---|---|---|---|
| 1 | Full Keyboard Access on | Turn on Keyboard navigation (System Settings > Keyboard) | Tab reaches every button, link and control in the app | Pass | |
| 2 | Keyboard only: sign in | Tab through the landing and sign in pages, Return to submit | Every control reachable, order is logical | Pass | |
| 3 | Keyboard only: dashboard | Tab across widgets, check-in, medication toggles, customize | All actions work without a mouse | Pass | |
| 4 | Keyboard only: medications | Add, edit, mark taken, delete (with confirmation) | Dialogs trap focus, Escape closes, focus returns to the trigger | Pass | Retested after the schedule time field was changed to a list; Tab now moves through every field to Add medication, and Return saves. |
| 5 | Keyboard only: appointments | Add, edit, delete | Same as above | Pass | |
| 6 | Keyboard only: activity | Use the filter and refresh | Filter changes the list, focus not lost | Pass | |
| 7 | Keyboard only: messages | Read, mark unread, archive, compose, reply, delete | All reachable and operable | Pass | |
| 8 | Keyboard only: settings | Cmd+, then theme, text size, high contrast, Left-Hand Mode | All controls reachable, Escape closes | Pass | |
| 9 | Native menu by keyboard | Ctrl+F2 (or VO+M) to reach the menu bar, arrows, Return. Then Cmd+1 to 5, Cmd+N, Cmd+S, Cmd+E, Cmd+O, Cmd+P, F1, Ctrl+Cmd+F | Menus open and items run; every shortcut works; Help has the search field | Pass | Menus work with and without VoiceOver. |
| 10 | Visible focus | Tab through every screen | A clear focus indicator is visible on every control, in light and dark themes | Pass | |
| 11 | VoiceOver: launch and sign in | Cmd+F5, open CareConnect, VO+Right Arrow through the sign in form | Labels, required fields and errors are announced | Pass | |
| 12 | VoiceOver: navigation | VO+Right Arrow, VO+U rotor (headings and landmarks), VO+M for the menu bar | Landmarks, headings and the status line are announced; menu items are announced with their shortcuts | Pass | |
| 13 | VoiceOver: dialogs | Open Settings, Add medication, Emergency (VO+Space on the buttons) | Dialog name announced on open; focus stays inside; closing returns focus | Pass | |
| 14 | VoiceOver: live updates | Mark a medication taken, record a check-in, save | Status message is announced without moving focus | Pass | |
| 15 | macOS Increase contrast | System Settings > Accessibility > Display > Increase contrast on | Text, borders, buttons and focus rings stay visible and readable | Pass | |
| 16 | In-app High contrast | Shift+Cmd+H or Settings | Colors change to the high contrast palette; all text readable; toggles back | Pass | |
| 17 | Dark mode | System Settings > Appearance > Dark, then Light | App follows the system appearance; contrast holds in both | Pass | A Light or Dark choice in CareConnect Settings overrides the system appearance until Settings is set back to System. |
| 18 | 200% zoom | Cmd+= until 200%; also try Display scaling set to a larger text size | No loss of content or function, no horizontal scroll trap; Cmd+0 resets | Pass | Layout scales well at 200%. |
| 19 | Text size setting | Settings, increase text size | Layout holds, nothing clipped | Pass | |
| 20 | Left-Hand Mode | Shift+Cmd+L, then complete a check-in, mark a medication taken and open Messages using one hand | Controls move to the left side and tasks are reachable with the left hand only | Pass | |
| 21 | Menu bar icon | Close the window (app stays running), then use the menu bar icon menu | Menu bar menu works from the keyboard (VO+M) and its items are announced. Notifications are not tested on macOS: they only display for a code-signed build, and this build is not signed. | Pass | Menu bar icon reached with the VoiceOver shortcut. |

### 2b. Secondary: NVDA and Windows contrast themes (not tested this week)

Install the Windows build (`CareConnect-Setup-0.8.0.exe`) or run `npm start`.

| # | Check | How | Expected | Result | Notes |
|---|---|---|---|---|---|
| W1 | NVDA: launch and sign in | Start NVDA (nvaccess.org), open CareConnect, Tab through the sign in form | Labels, required fields and errors are announced | Not tested | Windows not tested this week. |
| W2 | NVDA: navigation and menu | Tab and arrow keys; NVDA+Space toggles focus and browse mode; Alt, then F/E/V/H for the menus | Landmarks, headings and the status line are announced; menu items are announced with their shortcuts | Not tested | Windows not tested this week. |
| W3 | NVDA: dialogs and live updates | Open Settings, Add medication, Emergency; mark a medication taken | Dialog name announced; status message announced without moving focus | Not tested | Windows not tested this week. |
| W4 | Windows Contrast themes | Windows Settings > Accessibility > Contrast themes, pick one (for example Aquatic and Night sky) | Text, borders, buttons and focus rings stay visible and readable | Not tested | Windows not tested this week. |
| W5 | Tray | Minimize, use the tray menu (Windows key + B to reach it) | Tray menu works from the keyboard | Not tested | Windows not tested this week. |

## 3. Screen reader video

A recording of keyboard navigation and VoiceOver is submitted with the assignment as a separate file.
