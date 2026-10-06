# Week 8 Submission Index: Electron Desktop Implementation and Testing

Branch: `main` (Week 8 work merged in PR #10). App folder: [desktop-electron/](../../desktop-electron/). Repository: https://github.com/LaoWai-Fi/careconnect-swen661-T1

Target platform: macOS (Intel and Apple Silicon), with Windows secondary and Linux tertiary.

## Rubric mapping

| Criterion (points) | Where it is satisfied | Status |
|---|---|---|
| Functionality and Desktop Features (30) | Part 1 Platform-Specific Features for macOS: native menus including the macOS app menu (About, Settings, Hide, Quit), Window and Help menus (`electron/menu.cjs`), `.dmg` installer, plus Dock badge for unread messages, menu bar extra (template icon, `tray.cjs`) and native notifications (implemented; macOS only displays them for a code-signed build, and this build is not signed). Touch Bar is optional and not implemented. Also: Cmd and Ctrl accelerators (Alt mnemonics on Windows and Linux), keyboard shortcuts, window state persistence (`windowState.cjs`), file system: autosave plus Export and Import with native dialogs (`careStore.cjs`, `ipc.cjs`), system tray (`tray.cjs`), native notifications (implemented; macOS only displays them for a code-signed build, and this build is not signed), single instance, unread count in title and badge. UI features: dashboard, medications, appointments, activity, messages, settings, Left-Hand Mode, high contrast. See [desktop-electron/README.md](../../desktop-electron/README.md). | Done |
| Electron Architecture and IPC (20) | Main / preload / renderer separation, `contextBridge` API, validated IPC handlers with sender checks and `{ ok }` results. See [ARCHITECTURE.md](ARCHITECTURE.md) (process model, module responsibilities, IPC table, data flows). | Done |
| Code Quality (15) | TypeScript with `tsc --noEmit` clean, ESLint 9 with zero warnings, pure logic separated in `src/state/careLogic.ts`, small single-purpose main process modules, tests for each. | Done |
| Test Coverage (20) | 224 Jest tests, 97.69% statements, 92.57% branches, 97.29% functions, 98.50% lines; 5 Playwright Electron e2e tests; IPC and window management integration tests; jest-axe. See [TEST_REPORT.md](TEST_REPORT.md). | Done |
| Deployment and Packaging (10) | electron-builder config in `desktop-electron/package.json` (macOS dmg and zip for x64 and arm64 primary, Windows NSIS, Linux AppImage and deb), entitlements file, fuses, GitHub publish config, and a GitHub Actions workflow that builds macOS Intel, macOS Apple Silicon and Windows installers. The macOS installer is `release/CareConnect-0.8.0-mac-x64.dmg` from `npm run dist:mac:intel`. The build is not code signed or notarized, and auto-update needs a published GitHub Release. | Done |
| Security and Documentation (5) | Security checklist in [ARCHITECTURE.md](ARCHITECTURE.md), security summary and setup docs in the [desktop README](../../desktop-electron/README.md), this index, the test report. | Done |
| Part 3: Accessibility | Automated: jest-axe on every screen and dialog, keyboard and focus trap tests. Manual checks on an Intel Mac (10/05/2026): keyboard-only operation of every feature with Full Keyboard Access, visible focus, VoiceOver, macOS Increase contrast, in-app high contrast, 200% zoom, text size and Left-Hand Mode, all passed. Results in [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md). NVDA and Windows contrast themes were not tested. | Done |

## Submission list

| Item | Where | Status |
|---|---|---|
| Repository link | https://github.com/LaoWai-Fi/careconnect-swen661-T1 (Week 8 merged into `main` through PR #10) | Done |
| Installer | `CareConnect-0.8.0-mac-x64.dmg` (Intel), built with `npm run dist:mac:intel` and submitted with the assignment. Intel, Apple Silicon and Windows installers are also produced by the GitHub Actions build (artifacts `CareConnect-macOS-Intel`, `CareConnect-macOS-AppleSilicon`, `CareConnect-Windows`). | Done |
| Coverage screenshot | [evidence/coverage-summary.png](evidence/coverage-summary.png) (from `coverage/lcov-report/index.html`) | Done |
| Keyboard and screen reader video | Submitted with the assignment as a separate file. | Done |
| README | [desktop-electron/README.md](../../desktop-electron/README.md) | Done |

## Documents in this folder

- [ARCHITECTURE.md](ARCHITECTURE.md): process model, modules, IPC channels, data flows, security checklist, packaging
- [TEST_REPORT.md](TEST_REPORT.md): how to run, coverage, test inventory, mapping to the earlier test plan
- [MAC_TEST_CHECKLIST.md](MAC_TEST_CHECKLIST.md): macOS test run on an Intel Mac, with results
- [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md): automated checks and manual accessibility results (VoiceOver first)

## Evidence screenshots (`docs/week8/evidence/`)

| File | Shows |
|---|---|
| `01-landing.png` | Landing page captured from the real Electron window |
| `02-dashboard.png` | Dashboard after sign in |
| `03-medications.png` | Medications page |
| `04-settings-dialog.png` | Settings dialog |
| `05-keyboard-shortcuts.png` | Keyboard shortcuts dialog |
| `coverage-summary.png` | Jest coverage report summary (HTML report rendered at 1280x900) |
