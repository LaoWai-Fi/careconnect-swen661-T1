# CareConnect Desktop: Dom's Intel Mac Test Run (Week 8)

Run this on the Intel Mac. The Result column is blank on purpose: write Pass, Fail or a note. Prerequisites: Node.js 22.12 or newer (`node -v`), git, and Terminal.

Record: date ______  macOS version ______  Mac model ______  Node version ______

## A. Get the code and run the automated checks

| # | Step | Command or action | Expected | Result |
|---|---|---|---|---|
| 1 | Get the branch | `git pull` on `feat/electron-buiild-wk8` (or `git clone`, then `git checkout feat/electron-buiild-wk8`), then `cd desktop-electron` | Branch is up to date | |
| 2 | Install | `npm ci` | Finishes without errors | |
| 3 | Lint | `npm run lint` | Zero warnings | |
| 4 | Unit and component tests | `npm run test:coverage` | 211 tests pass, coverage above 75 percent (about 97 percent statements) | |
| 5 | Coverage screenshot | Open `coverage/lcov-report/index.html` in a browser and take a screenshot (Shift+Cmd+4). Save it as `docs/week8/evidence/coverage-summary.png` | Screenshot shows the totals | |
| 6 | End to end tests | `npm run test:e2e` | 5 pass (a real Electron window flashes on screen) | |

## B. Run the app and try everything

| # | Step | Expected | Result |
|---|---|---|---|
| 7 | `npm start` | CareConnect opens with the landing page; the menu bar shows CareConnect, File, Edit, View, Window, Help | |
| 8 | Sign in with any password | Dashboard appears; the File, Edit and View care plan items become enabled | |
| 9 | CareConnect menu | About CareConnect shows the native About panel (version 0.8.0, copyright, sample data note); Settings... (Cmd+,) opens Settings; Hide, Hide Others and Quit work | |
| 10 | File menu | Messages Menu (Cmd+N), Save care plan (Cmd+S), Export (Cmd+E, native save dialog), Import (Cmd+O, native open dialog), Print (Cmd+P), Sign out, Close Window (Cmd+W) | |
| 11 | Edit menu | Undo, Redo, Cut, Copy, Paste, Select All in a text field; Find in CareConnect (Cmd+F) | |
| 12 | View menu | Overview to Messages with Cmd+1 to Cmd+5; zoom with Cmd+=, Cmd+- and Cmd+0; Left-hand mode (Shift+Cmd+L); High contrast (Shift+Cmd+H); full screen with Ctrl+Cmd+F | |
| 13 | Window menu | Minimize (Cmd+M), Zoom, Bring All to Front | |
| 14 | Help menu | A search field is at the top; type "shortcuts" and the menu item is found; Keyboard shortcuts (F1) opens the dialog showing the Mac keys and the "Move to the menu bar" row; CareConnect help; Report an issue opens the browser | |
| 15 | Menu bar icon | A small heart icon appears in the menu bar and adapts to light and dark; its menu shows the next medication and unread count; Open CareConnect and Quit CareConnect work | |
| 16 | Close the window with the red button | The app keeps running (menu bar and Dock); clicking the Dock icon or Open CareConnect in the menu bar icon brings the window back | |
| 17 | Dock badge | Receive or mark messages unread so the unread count changes | The Dock icon badge shows the unread count and clears at zero | |
| 18 | Notifications | System Settings > Notifications > CareConnect > Allow. Record a check-in or export the care plan | A native notification appears | |
| 19 | Persistence | Move and resize the window, add a medication, then quit with Cmd+Q and relaunch with `npm start` | Window opens at the same position and size; the medication is still there | |
| 20 | Dark mode | Switch System Settings > Appearance between Light and Dark | The app follows the system appearance | |

## C. Build and install the Intel installer

| # | Step | Command or action | Expected | Result |
|---|---|---|---|---|
| 21 | Build | `npm run dist:mac:intel` | `release/CareConnect-0.8.0-mac-x64.dmg` and `.zip` are created | |
| 22 | Install | Open the dmg and drag CareConnect onto Applications | Copy completes | |
| 23 | First launch | Control-click CareConnect in Applications > Open > Open. If blocked: System Settings > Privacy & Security > Open Anyway, or `xattr -dr com.apple.quarantine /Applications/CareConnect.app` | App opens and works as in section B | |
| 24 | Spot check the installed app | Sign in, Cmd+, for Settings, menu bar icon, Dock badge, quit and relaunch | Same behavior as `npm start` | |

## D. Optional

| # | Step | Expected | Result |
|---|---|---|---|
| 25 | Push the branch and open the GitHub Actions run | `CareConnect-macOS-Intel`, `CareConnect-macOS-AppleSilicon` and `CareConnect-Windows` artifacts are listed; download the Intel one and compare to your own build | |
| 26 | Work through the VoiceOver checks in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md) | Results filled in | |

If a step fails, copy the Terminal output or take a screenshot and note the step number.
