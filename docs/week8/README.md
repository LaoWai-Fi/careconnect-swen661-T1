# Week 8 Submission Index: Electron Desktop Implementation and Testing

Branch: `feat/electron-buiild-wk8`. App folder: [desktop-electron/](../../desktop-electron/). Repository: https://github.com/LaoWai-Fi/careconnect-swen661-T1

Target platform: macOS (Intel and Apple Silicon), with Windows secondary and Linux tertiary. Status values: Done means finished and verified in the cloud container (tsc, lint, 222 Jest tests, 5 Electron e2e tests, macOS app folder and Linux AppImage assembled). Needs Dom means it must be done on his Intel Mac or by the team.

## Rubric mapping

| Criterion (points) | Where it is satisfied | Status |
|---|---|---|
| Functionality and Desktop Features (30) | Part 1 Platform-Specific Features for macOS: native menus including the macOS app menu (About, Settings, Hide, Quit), Window and Help menus (`electron/menu.cjs`), `.dmg` installer, plus Dock badge for unread messages, menu bar extra (template icon, `tray.cjs`) and native notifications. Touch Bar is optional and not implemented. Also: Cmd and Ctrl accelerators (Alt mnemonics on Windows and Linux), keyboard shortcuts, window state persistence (`windowState.cjs`), file system: autosave plus Export and Import with native dialogs (`careStore.cjs`, `ipc.cjs`), system tray (`tray.cjs`), native notifications, single instance, unread count in title and badge. UI features: dashboard, medications, appointments, activity, messages, settings, Left-Hand Mode, high contrast. See [desktop-electron/README.md](../../desktop-electron/README.md). | Done |
| Electron Architecture and IPC (20) | Main / preload / renderer separation, `contextBridge` API, validated IPC handlers with sender checks and `{ ok }` results. See [ARCHITECTURE.md](ARCHITECTURE.md) (process model, module responsibilities, IPC table, data flows). | Done |
| Code Quality (15) | TypeScript with `tsc --noEmit` clean, ESLint 9 with zero warnings, pure logic separated in `src/state/careLogic.ts`, small single-purpose main process modules, tests for each. | Done |
| Test Coverage (20) | 222 Jest tests, 97.61% statements, 92.57% branches, 97.11% functions, 98.42% lines; 5 Playwright Electron e2e tests; IPC and window management integration tests; jest-axe. See [TEST_REPORT.md](TEST_REPORT.md). | Done |
| Deployment and Packaging (10) | electron-builder config in `desktop-electron/package.json` (macOS dmg and zip for x64 and arm64 primary, Windows NSIS, Linux AppImage and deb), entitlements file, fuses, GitHub publish config, and a GitHub Actions workflow that builds macOS Intel, macOS Apple Silicon and Windows installers. The macOS app folder and the Linux AppImage were assembled in the cloud container to prove the config. The macOS installer is `release/CareConnect-0.8.0-mac-x64.dmg` from `npm run dist:mac:intel`. The build is ad-hoc signed, not notarized, and auto-update needs a published GitHub Release. | macOS installer: Needs Dom (config Done) |
| Security and Documentation (5) | Security checklist in [ARCHITECTURE.md](ARCHITECTURE.md), security summary and setup docs in the [desktop README](../../desktop-electron/README.md), this index, the test report. | Done |
| Part 3: Accessibility | Automated: jest-axe on every screen and dialog, keyboard and focus trap tests. Manual VoiceOver, macOS Increase contrast, Full Keyboard Access, zoom and Left-Hand Mode checklist in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md); NVDA and Windows contrast themes are a secondary section. | Automated Done; manual checks Needs Dom |

## Submission list

| Item | Where | Status |
|---|---|---|
| Repository link | https://github.com/LaoWai-Fi/careconnect-swen661-T1 (branch `feat/electron-buiild-wk8`, push and open a PR to main) | Needs Dom (push) |
| Installer | `desktop-electron/release/CareConnect-0.8.0-mac-x64.dmg`, built on Dom's Intel Mac with `npm run dist:mac:intel`, or downloaded from the GitHub Actions run (Artifacts: `CareConnect-macOS-Intel`, `CareConnect-macOS-AppleSilicon`, `CareConnect-Windows`) | Needs Dom (Intel Mac or CI) |
| Coverage screenshot | [evidence/coverage-summary.png](evidence/coverage-summary.png) (from `coverage/lcov-report/index.html`) | Done |
| Keyboard and screen reader video (2 to 3 min) | VoiceOver script in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md), section 3; recorded by the team | Needs Dom |
| README | [desktop-electron/README.md](../../desktop-electron/README.md) | Done |
| 10 to 15 minute walkthrough video | Outline in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md), section 4; recorded by the team | Needs Dom |

## Documents in this folder

- [ARCHITECTURE.md](ARCHITECTURE.md): process model, modules, IPC channels, data flows, security checklist, packaging
- [TEST_REPORT.md](TEST_REPORT.md): how to run, coverage, test inventory, mapping to the earlier test plan
- [MAC_TEST_CHECKLIST.md](MAC_TEST_CHECKLIST.md): step by step test run for Dom's Intel Mac
- [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md): automated checks, manual checklist (VoiceOver first), video scripts

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

1. Work through [MAC_TEST_CHECKLIST.md](MAC_TEST_CHECKLIST.md) on the Intel Mac: `npm ci`, lint, coverage, e2e, `npm start`, then `npm run dist:mac:intel` and install the dmg (first launch: Control-click > Open).
2. Complete the manual accessibility checklist (VoiceOver, Increase contrast, Full Keyboard Access) and add notes to the Result column.
3. Record the two videos (VoiceOver for the screen reader video).
4. Push the branch and open a pull request to main. The GitHub Actions run then produces the Intel, Apple Silicon and Windows installers as artifacts. Optionally publish a GitHub Release with the installers and `latest-mac.yml` to demonstrate auto-update.
