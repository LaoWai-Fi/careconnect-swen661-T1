# CareConnect Desktop: macOS Test Run (Week 8)

Prerequisites: Node.js 22.12 or newer (`node -v`), git, and Terminal.

Tested on an Intel MacBook Pro running macOS 26.6, October 2 to 5, 2026.

## A. Get the code and run the automated checks

| # | Step | Command or action | Expected | Result |
|---|---|---|---|---|
| 1 | Get the code | `git pull` on `main` (or `git clone`), then `cd desktop-electron` | Code is up to date | Pass |
| 2 | Install | `npm ci` | Finishes without errors | Pass |
| 3 | Lint | `npm run lint` | Zero warnings | Pass (zero warnings) |
| 4 | Unit and component tests | `npm run test:coverage` | 224 tests pass, coverage above 75 percent (about 97.6 percent statements) | Pass (224 tests) |
| 5 | Coverage screenshot | Open `coverage/lcov-report/index.html` in a browser and take a screenshot (Shift+Cmd+4). Save it as `docs/week8/evidence/coverage-summary.png` | Screenshot shows the totals | Pass |
| 6 | End to end tests | `npm run test:e2e` | 5 pass (a real Electron window flashes on screen) | Pass (5 of 5) |

## B. Run the app and try everything

| # | Step | Expected | Result |
|---|---|---|---|
| 7 | `npm start` | CareConnect opens with the landing page; the menu bar shows CareConnect, File, Edit, View, Window, Help | Pass |
| 8 | Sign in with any password | Dashboard appears; the File, Edit and View care plan items become enabled | Pass |
| 9 | CareConnect menu | About CareConnect shows the native About panel (version 0.8.0, copyright, sample data note); Settings... (Cmd+,) opens Settings; Hide, Hide Others and Quit work | Pass |
| 10 | File menu | Messages Menu (Cmd+N), Save care plan (Cmd+S), Export (Cmd+E, native save dialog), Import (Cmd+O, native open dialog), Print (Cmd+P), Sign out, Close Window (Cmd+W) | Pass |
| 11 | Edit menu | Undo, Redo, Cut, Copy, Paste, Select All in a text field; Find in CareConnect (Cmd+F) | Pass |
| 12 | View menu | Overview to Messages with Cmd+1 to Cmd+5; zoom with Cmd+=, Cmd+- and Cmd+0; Left-hand mode (Shift+Cmd+L); High contrast (Shift+Cmd+H); full screen with Ctrl+Cmd+F | Pass |
| 13 | Window menu | Minimize (Cmd+M), Zoom, Bring All to Front | Pass. No keyboard shortcut restores a minimized window (standard macOS behavior); restore it from the Dock icon, the Window menu or the menu bar icon. |
| 14 | Help menu | A search field is at the top; type "shortcuts" and the menu item is found; Keyboard shortcuts (F1) opens the dialog showing the Mac keys and the "Move to the menu bar" row; CareConnect help; Report an issue opens the browser | Pass |
| 15 | Menu bar icon | A small heart icon appears in the menu bar and adapts to light and dark; its menu shows the next medication and unread count; Open CareConnect and Quit CareConnect work | Pass |
| 16 | Close the window with the red button | The app keeps running (menu bar and Dock); clicking the Dock icon or Open CareConnect in the menu bar icon brings the window back | Pass |
| 17 | Dock badge | Receive or mark messages unread so the unread count changes | The Dock icon badge shows the unread count and clears at zero | Pass |
| 18 | Notifications | System Settings > Notifications > CareConnect > Allow. Record a check-in or export the care plan | A native notification appears | Fail (known limitation). CareConnect does not appear in System Settings > Notifications. macOS only delivers notifications from code-signed apps, and this build is not signed with an Apple Developer ID. |
| 19 | Persistence | Move and resize the window, add a medication, then quit with Cmd+Q and relaunch with `npm run desktop` (same build, no rebuild) | Window opens at the same position and size; the medication is still there | Pass |
| 19b | Fresh plan per build | Quit, then run `npm start` (rebuilds) | The window keeps its position and size, but the care plan is back to the stock sample (the added medication is gone) | Pass |
| 20 | Dark mode | Switch System Settings > Appearance between Light and Dark | The app follows the system appearance | Pass. A Light or Dark choice in CareConnect Settings overrides the system appearance until Settings is set back to System. |

## C. Build and install the Intel installer

| # | Step | Command or action | Expected | Result |
|---|---|---|---|---|
| 21 | Build | `npm run dist:mac:intel` | `release/CareConnect-0.8.0-mac-x64.dmg` and `.zip` are created | Pass |
| 22 | Install | Open the dmg and drag CareConnect onto Applications | Copy completes | Pass |
| 23 | First launch | Control-click CareConnect in Applications > Open > Open. If blocked: System Settings > Privacy & Security > Open Anyway, or `xattr -dr com.apple.quarantine /Applications/CareConnect.app` | App opens and works as in section B | Pass. No security prompt on the Mac that built the app, because a locally built app is not quarantined. A downloaded copy shows the prompt and opens with Control-click > Open. |
| 24 | Spot check the installed app | Sign in, Cmd+, for Settings, menu bar icon, Dock badge, quit and relaunch | Same behavior as `npm start` | Pass |

## D. Optional

| # | Step | Expected | Result |
|---|---|---|---|
| 25 | GitHub Actions build for PR #10 | `CareConnect-macOS-Intel`, `CareConnect-macOS-AppleSilicon` and `CareConnect-Windows` artifacts are listed; the Intel installer matches the local build | Pass |
| 26 | Work through the VoiceOver checks in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md) | Results filled in | Pass |