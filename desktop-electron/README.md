# CareConnect Desktop (Electron)

CareConnect is a caregiver coordination app built by SWEN 661 Team 1. This folder holds the Week 8 desktop build: a React 19 + TypeScript user interface running inside Electron, with a native menu, keyboard shortcuts, window state persistence, file system access, a system tray, native notifications and auto-update support.

All data in the app is sample data. Sign-in is a demo (any password works). The Emergency dialog states clearly that the app cannot place real emergency calls.

The team accessibility constraint is Left-Hand Mode (one-handed operation, aiming for WCAG 2.2 AA). It is available from View > Left-hand mode (Ctrl+Shift+L) and in Settings.

## Requirements

- Node.js 22.12 or newer and npm
- Windows 10/11, macOS or Linux (Linux needs `xvfb-run` only for the Electron end-to-end tests on a machine with no display)

## Quick start

```bash
cd desktop-electron
npm ci
npm start        # builds the UI with Vite, then launches Electron
```

## Development mode

Run the Vite dev server in one terminal and Electron in another.

Bash:

```bash
npm run dev
CARECONNECT_DEV_URL=http://127.0.0.1:5173 npm run desktop
```

PowerShell:

```powershell
npm run dev
$env:CARECONNECT_DEV_URL = "http://127.0.0.1:5173"; npm run desktop
```

When `CARECONNECT_DEV_URL` is set, the app loads from the dev server and the View menu gains Reload and Developer Tools. The Content Security Policy in `index.html` allows the dev server only for `connect-src`; the dev server relaxes `script-src` only while running under `vite serve`.

## Testing, linting and type checking

```bash
npm test                 # Jest: main process and renderer projects
npm run test:coverage    # same, with coverage (text table + HTML report)
npm run test:e2e         # builds the UI, then runs Playwright against real Electron
npm run lint             # ESLint 9, zero warnings allowed
npm run typecheck        # tsc --noEmit
```

- The HTML coverage report is written to `coverage/lcov-report/index.html`.
- On Linux without a display, run the end-to-end tests as `xvfb-run -a npm run test:e2e`.
- Current results: 204 Jest tests pass (18 suites), 97.52% statements / 92.54% branches / 96.86% functions / 98.35% lines, and 5 Electron end-to-end tests pass. See [docs/week8/TEST_REPORT.md](../docs/week8/TEST_REPORT.md).

## Packaging

Installers are written to `release/`.

```bash
npm run dist:win      # Windows NSIS installer: release/CareConnect-Setup-0.8.0.exe
npm run dist:linux    # AppImage and deb: release/CareConnect-0.8.0.AppImage
npm run dist:mac      # dmg (must be run on a Mac)
npm run pack          # unpacked app folder only, fast check of the config
```

Build the Windows installer on a Windows machine. The Linux AppImage was built and launched headless in a container to prove the electron-builder configuration. The macOS dmg has not been built.

### Installing the Windows build

The installer is not code-signed (the team has no certificate), so Windows SmartScreen shows a warning the first time. Choose More info, then Run anyway. The installer is per-user, lets you choose the install folder and creates Desktop and Start Menu shortcuts.

### Auto-update

`electron-updater` checks GitHub Releases (`LaoWai-Fi/careconnect-swen661-T1`) in packaged builds only. It needs a published GitHub Release that contains the installer and `latest.yml`. Without one, the check fails quietly and the failure is only logged. Because the build is unsigned, updates are not verified by a publisher certificate.

## Project structure

```
desktop-electron/
  electron/            main process (CommonJS)
    main.cjs           composition root: windows, menu, tray, IPC wiring
    channels.cjs       IPC channel names and allowed menu actions
    ipc.cjs            IPC handlers (sender check, validation, {ok} results)
    preload.cjs        contextBridge API exposed as window.careConnect
    menu.cjs           native File / Edit / View / Help menu
    windowState.cjs    saves and restores window bounds
    careStore.cjs      atomic JSON storage in userData
    tray.cjs           system tray menu
    security.cjs       web preferences, navigation and permission lockdown
    updater.cjs        electron-updater (packaged builds only)
  src/                 renderer (React + TypeScript)
    App.tsx            app state, menu command handling, autosave
    lib/desktop.ts     typed access to window.careConnect
    state/             careLogic.ts (pure logic), seed.ts (sample data)
    components/        AppShell, dialogs, form fields
    pages/             Landing, SignIn, SignUp, Dashboard, Medications,
                       Appointments, Activity, Messages
  test/
    main/              Jest tests for the main process
    renderer/          Jest + React Testing Library + jest-axe
    e2e/               Playwright tests that drive real Electron
  assets/              app and tray icons
  index.html           entry page with the Content Security Policy
  package.json         scripts and the electron-builder "build" config
```

## Architecture overview

The main process owns everything that touches the operating system. The React UI runs in a sandboxed renderer and can only reach the main process through a small preload bridge (`window.careConnect`) that forwards to validated IPC handlers. Menu and tray commands travel the other way as a single `menu:command` message. The renderer works without the bridge too (plain browser or Jest), so the UI logic is testable without Electron.

Full details, the IPC channel table and data flows: [docs/week8/ARCHITECTURE.md](../docs/week8/ARCHITECTURE.md).

## Security notes

- `contextIsolation` on, `nodeIntegration` off, `sandbox` on, `webSecurity` on, no `<webview>`.
- Content Security Policy in `index.html`.
- Navigation and `window.open` are blocked. Only allowlisted https links open, and only in the default browser.
- Every permission request (camera, microphone, geolocation and so on) is denied.
- IPC calls are accepted only from the main window's own page, payloads are validated, and care plan data is limited to 5 MB.
- Electron fuses: `runAsNode` off, embedded ASAR integrity validation on, `onlyLoadAppFromAsar` on.
- The care plan is stored in `care-data.json` in the userData folder (written atomically; an unreadable file is set aside as `.corrupt`). The theme preference is kept in localStorage.

## Desktop features

Native menu with Alt mnemonics, keyboard shortcuts, window size/position/maximized persistence, autosave plus Export and Import through native file dialogs, system tray (next medication, unread count, quick actions), native notifications (check-in and export), single-instance lock, and the unread count in the window title and app badge.

## Keyboard shortcuts

Ctrl is Cmd on macOS.

| Shortcut | Action |
|---|---|
| Ctrl+1 to Ctrl+5 | Overview, Medications, Appointments, Activity, Messages |
| Ctrl+N | New message |
| Ctrl+S | Save care plan |
| Ctrl+E | Export care plan |
| Ctrl+O | Import care plan |
| Ctrl+P | Print |
| Ctrl+, | Settings |
| Ctrl+F | Find in CareConnect |
| Ctrl+= / Ctrl+- / Ctrl+0 | Zoom in / out / actual size |
| Ctrl+Shift+L | Toggle Left-Hand Mode |
| Ctrl+Shift+H | Toggle high contrast |
| F11 | Full screen |
| F1 | Keyboard shortcuts |
| Alt+F / Alt+E / Alt+V / Alt+H | Open the File / Edit / View / Help menu |

Care plan commands are disabled until you sign in.

## Limitations

- Sample data only; sign-in is a demo and there is no server or real account system.
- No real emergency calling.
- The app is not code-signed, so Windows SmartScreen warns on first run.
- Auto-update works only after a GitHub Release is published.
- The Windows installer must be built on Windows; the macOS dmg has not been built or tested.
- Screen reader testing with NVDA and the Windows contrast themes is a manual check (see [docs/week8/ACCESSIBILITY_TESTING.md](../docs/week8/ACCESSIBILITY_TESTING.md)).
