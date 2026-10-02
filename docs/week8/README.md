# Week 8 Submission Index: Electron Desktop Implementation and Testing

Branch: `feat/electron-buiild-wk8`. App folder: [desktop-electron/](../../desktop-electron/). Repository: https://github.com/LaoWai-Fi/careconnect-swen661-T1

Status values: Done means finished and verified in the cloud container (tsc, lint, 204 Jest tests, 5 Electron e2e tests, Linux AppImage). Needs Dom means it must be done on Windows or by the team.

## Rubric mapping

| Criterion (points) | Where it is satisfied | Status |
|---|---|---|
| Functionality and Desktop Features (30) | Native menu with accelerators and Alt mnemonics (`electron/menu.cjs`), keyboard shortcuts, window state persistence (`windowState.cjs`), file system: autosave plus Export and Import with native dialogs (`careStore.cjs`, `ipc.cjs`), system tray (`tray.cjs`), native notifications, single instance, unread count in title and badge. UI features: dashboard, medications, appointments, activity, messages, settings, Left-Hand Mode, high contrast. See [desktop-electron/README.md](../../desktop-electron/README.md). | Done |
| Electron Architecture and IPC (20) | Main / preload / renderer separation, `contextBridge` API, validated IPC handlers with sender checks and `{ ok }` results. See [ARCHITECTURE.md](ARCHITECTURE.md) (process model, module responsibilities, IPC table, data flows). | Done |
| Code Quality (15) | TypeScript with `tsc --noEmit` clean, ESLint 9 with zero warnings, pure logic separated in `src/state/careLogic.ts`, small single-purpose main process modules, tests for each. | Done |
| Test Coverage (20) | 204 Jest tests, 97.52% statements, 92.54% branches, 96.86% functions, 98.35% lines; 5 Playwright Electron e2e tests; IPC and window management integration tests; jest-axe. See [TEST_REPORT.md](TEST_REPORT.md). | Done |
| Deployment and Packaging (10) | electron-builder config in `desktop-electron/package.json` (NSIS Windows x64 primary, Linux AppImage and deb, mac dmg), fuses, GitHub publish config. Linux AppImage built and launched headless to prove the config. Windows installer `release/CareConnect-Setup-0.8.0.exe` is built with `npm run dist:win` on Windows. The build is unsigned and auto-update needs a published GitHub Release. | Windows installer: Needs Dom (config Done) |
| Security and Documentation (5) | Security checklist in [ARCHITECTURE.md](ARCHITECTURE.md), security summary and setup docs in the [desktop README](../../desktop-electron/README.md), this index, the test report. | Done |
| Part 3: Accessibility | Automated: jest-axe on every screen and dialog, keyboard and focus trap tests. Manual NVDA, Windows contrast themes, zoom and Left-Hand Mode checklist in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md). | Automated Done; manual checks Needs Dom |

## Submission list

| Item | Where | Status |
|---|---|---|
| Repository link | https://github.com/LaoWai-Fi/careconnect-swen661-T1 (branch `feat/electron-buiild-wk8`, push and open a PR to main) | Needs Dom (push) |
| Installer | `desktop-electron/release/CareConnect-Setup-0.8.0.exe` from `npm run dist:win` | Needs Dom on Windows |
| Coverage screenshot | [evidence/coverage-summary.png](evidence/coverage-summary.png) (from `coverage/lcov-report/index.html`) | Done |
| Keyboard and screen reader video (2 to 3 min) | Script in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md), section 3; recorded by the team | Needs Dom |
| README | [desktop-electron/README.md](../../desktop-electron/README.md) | Done |
| 10 to 15 minute walkthrough video | Outline in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md), section 4; recorded by the team | Needs Dom |

## Documents in this folder

- [ARCHITECTURE.md](ARCHITECTURE.md): process model, modules, IPC channels, data flows, security checklist, packaging
- [TEST_REPORT.md](TEST_REPORT.md): how to run, coverage, test inventory, mapping to the earlier test plan
- [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md): automated checks, manual checklist, video scripts

## Evidence screenshots (`docs/week8/evidence/`)

| File | Shows |
|---|---|
| `01-landing.png` | Landing page captured from the real Electron window |
| `02-dashboard.png` | Dashboard after sign in |
| `03-medications.png` | Medications page |
| `04-settings-dialog.png` | Settings dialog |
| `05-keyboard-shortcuts.png` | Keyboard shortcuts dialog |
| `coverage-summary.png` | Jest coverage report summary (HTML report rendered at 1280x900) |

## Still to do by Dom

1. Run `npm ci` and `npm run dist:win` on Windows and test the installer (SmartScreen: More info, Run anyway).
2. Complete the manual accessibility checklist and add notes to the Result column.
3. Record the two videos.
4. Push the branch and open a pull request to main. Optionally publish a GitHub Release with the installer and `latest.yml` to demonstrate auto-update.
