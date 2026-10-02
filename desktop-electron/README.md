# CareConnect Desktop (Electron)

CareConnect is a caregiver coordination app built by SWEN 661 Team 1. This folder holds the Week 8 desktop build: a React 19 + TypeScript user interface running inside Electron, targeting macOS first (Intel and Apple Silicon), then Windows and Linux. It has a native menu, keyboard shortcuts, window state persistence, file system access, a menu bar / tray icon, native notifications and auto-update support.

All data in the app is sample data. Sign-in is a demo (any password works). The Emergency dialog states clearly that the app cannot place real emergency calls.

The team accessibility constraint is Left-Hand Mode (one-handed operation, aiming for WCAG 2.2 AA). It is available from View > Left-hand mode (Shift+Cmd+L on Mac, Ctrl+Shift+L elsewhere) and in Settings.

## Platforms

macOS is the primary target (Intel and Apple Silicon). Windows 10/11 is secondary and Linux is tertiary. Node.js 22.12 or newer and npm are needed on every platform. Linux needs `xvfb-run` only for the Electron end-to-end tests on a machine with no display.

## Quick start on a Mac

1. Install Node.js 22.12 or newer, either the LTS installer from https://nodejs.org or `brew install node@22`.
2. Run the app:

```bash
cd desktop-electron
npm ci
npm start        # builds the UI with Vite, then launches Electron
```

This works the same on Intel and Apple Silicon Macs.

## Quick start on Windows or Linux

```bash
cd desktop-electron
npm ci
npm start
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
- Current results: 211 Jest tests pass (19 suites), 97.53% statements / 92.70% branches / 96.86% functions / 98.36% lines, and 5 Electron end-to-end tests pass. See [docs/week8/TEST_REPORT.md](../docs/week8/TEST_REPORT.md).

## Packaging

Installers are written to `release/`. Every `dist` script passes `--publish never`, so nothing is uploaded.

```bash
npm run dist:mac:intel   # Intel Macs:   release/CareConnect-0.8.0-mac-x64.dmg (and .zip)
npm run dist:mac:arm     # Apple Silicon: release/CareConnect-0.8.0-mac-arm64.dmg (and .zip)
npm run dist:mac         # both architectures in one run
npm run dist:win         # Windows NSIS installer: release/CareConnect-Setup-0.8.0.exe
npm run dist:linux       # AppImage and deb
npm run dist             # installer for the current OS
npm run pack             # unpacked app folder only, fast check of the config
```

The macOS build produces a `.dmg` (the installer people open) and a `.zip` (required by `electron-updater` on macOS). electron-builder can assemble the macOS app folder from Linux for a config check (`npx electron-builder --mac dir --x64 --publish never`), but real dmg files must be built on a Mac or on the GitHub macOS runners.

### Installing the macOS build (unsigned)

The team has no Apple Developer ID, so the app is ad-hoc signed (which Apple Silicon requires to run at all) but not notarized. macOS Gatekeeper therefore warns on first launch.

1. Open `CareConnect-0.8.0-mac-x64.dmg` (Intel) or `CareConnect-0.8.0-mac-arm64.dmg` (Apple Silicon) and drag CareConnect onto the Applications link.
2. First launch, pick one of:
   - Control-click CareConnect in Applications, choose Open, then Open again.
   - System Settings > Privacy & Security, scroll down and click Open Anyway after a blocked launch.
   - Or clear the quarantine flag in Terminal: `xattr -dr com.apple.quarantine /Applications/CareConnect.app`
3. After the first launch it opens normally.

### Signing and notarization (needs an Apple Developer ID)

`package.json` ships with `hardenedRuntime`, `gatekeeperAssess` and `notarize` all set to false, and no `identity`, so electron-builder uses a Developer ID certificate if one is present and otherwise ad-hoc signs. `assets/entitlements.mac.plist` (JIT, unsigned executable memory, library validation off, as Electron needs) is already wired in as `mac.entitlements` and `mac.entitlementsInherit`. Someone with an Apple Developer account can ship a notarized build like this:

1. In `package.json` under `build.mac`, set `"hardenedRuntime": true` and `"notarize": true`.
2. Export the Developer ID Application certificate as a `.p12` and set these environment variables before building (and as GitHub secrets for CI):

```bash
export CSC_LINK=/path/to/DeveloperID.p12        # or a base64 string of it
export CSC_KEY_PASSWORD=...
export APPLE_ID=you@example.com
export APPLE_APP_SPECIFIC_PASSWORD=...          # from appleid.apple.com
export APPLE_TEAM_ID=ABCDE12345
npm run dist:mac
```

3. For CI, remove `CSC_IDENTITY_AUTO_DISCOVERY: "false"` from the workflow so the certificate is used.

### Installing the Windows build

The installer is not code-signed (the team has no certificate), so Windows SmartScreen shows a warning the first time. Choose More info, then Run anyway. The installer is per-user, lets you choose the install folder and creates Desktop and Start Menu shortcuts.

### Installing on Linux

Make the AppImage executable (`chmod +x CareConnect-0.8.0.AppImage`) and run it, or install the `.deb` with `sudo apt install ./release/*.deb`. The AppImage was built and launched headless in a container to prove the configuration.

### Auto-update

`electron-updater` checks GitHub Releases (`LaoWai-Fi/careconnect-swen661-T1`) in packaged builds only. It needs a published GitHub Release that contains the installer and `latest.yml`. Without one, the check fails quietly and the failure is only logged. Because the build is unsigned, updates are not verified by a publisher certificate.

## Continuous integration

`.github/workflows/desktop-electron.yml` runs on pushes and pull requests that touch `desktop-electron/`, and on demand (Actions tab > Desktop Electron > Run workflow).

- Job `test` (Ubuntu): typecheck, lint, Jest with coverage, then the Electron e2e tests under xvfb.
- Job `package` (needs `test`): on a macOS Intel runner (`macos-13`), a macOS Apple Silicon runner (`macos-latest`) and Windows. The macOS runners run the e2e tests first (verifies the app on the primary OS), then build the installers with `CSC_IDENTITY_AUTO_DISCOVERY` off.
- To download the results: Actions tab > latest run > Artifacts: `CareConnect-macOS-Intel` (dmg and zip), `CareConnect-macOS-AppleSilicon` (dmg and zip), `CareConnect-Windows` (exe) and `coverage-report`.
- `macos-13` is GitHub's Intel runner. If GitHub retires it, drop that matrix row and run `npm run dist:mac` on `macos-latest`, which cross-builds the x64 app as well.

## Project structure

```
desktop-electron/
  electron/            main process (CommonJS)
    main.cjs           composition root: windows, menu, tray, IPC wiring
    channels.cjs       IPC channel names and allowed menu actions
    ipc.cjs            IPC handlers (sender check, validation, {ok} results)
    preload.cjs        contextBridge API exposed as window.careConnect
    menu.cjs           native menu (macOS app menu, File, Edit, View, Window, Help)
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
  assets/              app icon (1024 px), tray icons (template images for the macOS menu bar), macOS entitlements
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

### macOS (primary)

- App menu with About CareConnect (native About panel), Settings (Cmd+,), Hide, Hide Others, Show All and Quit, then File, Edit, View, Window and Help.
- Window menu (minimize, zoom, bring all to front) and a Help menu that gets the standard macOS search field.
- Menu bar icon (a template image that adapts to light and dark menu bars) with next medication, unread count and quick actions.
- Dock badge showing the unread message count.
- Native notifications (allow them in System Settings > Notifications).
- Command-key shortcuts throughout, and native full screen with Ctrl+Cmd+F.
- The app stays open after the last window is closed; click the Dock icon or choose Open CareConnect from the menu bar icon to bring the window back.
- Dark mode support follows the system appearance.

### All platforms

Native menu, keyboard shortcuts, window size/position/maximized persistence, autosave plus Export and Import through native file dialogs, system tray (Windows and Linux) or menu bar icon (macOS), native notifications, single-instance lock, and the unread count in the window title and app badge.

## Keyboard shortcuts

On Mac the Command key is used. On Windows and Linux the same shortcuts use Ctrl.

| Mac | Windows / Linux | Action |
|---|---|---|
| ⌘1 to ⌘5 | Ctrl+1 to Ctrl+5 | Overview, Medications, Appointments, Activity, Messages |
| ⌘N | Ctrl+N | Messages Menu (opens Messages) |
| ⌘S | Ctrl+S | Save care plan |
| ⌘E | Ctrl+E | Export care plan |
| ⌘O | Ctrl+O | Import care plan |
| ⌘P | Ctrl+P | Print |
| ⌘, | Ctrl+, | Settings |
| ⌘F | Ctrl+F | Find in CareConnect |
| ⌘= / ⌘- / ⌘0 | Ctrl+= / Ctrl+- / Ctrl+0 | Zoom in / out / actual size |
| ⇧⌘L | Ctrl+Shift+L | Toggle Left-Hand Mode |
| ⇧⌘H | Ctrl+Shift+H | Toggle high contrast |
| Ctrl+⌘F | F11 | Full screen |
| F1 | F1 | Keyboard shortcuts |
| Ctrl+F2 (VoiceOver: VO+M) | Alt+F / Alt+E / Alt+V / Alt+H | Move to the menu bar (Mac) or open the File / Edit / View / Help menu (Windows and Linux) |

Care plan commands are disabled until you sign in. On a MacBook you may need to hold fn for F1 and Ctrl+F2 unless "Use F1, F2, etc. keys as standard function keys" is on.

## Limitations

- Sample data only; sign-in is a demo and there is no server or real account system.
- No real emergency calling.
- The app is not code-signed with a Developer ID or certificate, so macOS Gatekeeper (see Installing the macOS build) and Windows SmartScreen warn on first run.
- Auto-update works only after a GitHub Release is published (macOS also needs a signed and notarized build for updates to install).
- The macOS Touch Bar is not implemented (it is optional and most current Macs have none).
- Screen reader testing (VoiceOver on macOS, NVDA on Windows) and the contrast settings are manual checks (see [docs/week8/ACCESSIBILITY_TESTING.md](../docs/week8/ACCESSIBILITY_TESTING.md) and [docs/week8/MAC_TEST_CHECKLIST.md](../docs/week8/MAC_TEST_CHECKLIST.md)).
