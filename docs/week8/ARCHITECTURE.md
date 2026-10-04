# CareConnect Desktop: Architecture (Week 8)

This document describes how the Electron build is put together: processes, modules, IPC, data flow, security and packaging. Source lives in `desktop-electron/`.

## 1. Process model

```
+--------------------------------------------------------------+
| Main process (Node.js, electron/main.cjs)                    |
|                                                              |
|  menu.cjs   tray.cjs   windowState.cjs   careStore.cjs       |
|  security.cjs   updater.cjs   ipc.cjs   channels.cjs         |
|                                                              |
|  owns: BrowserWindow, native menu, tray, notifications,      |
|        dialogs, file system, auto-update                     |
+------------------+-------------------------------------------+
                   ^  ipcMain.handle / ipcMain.on  (validated)
                   |  webContents.send('menu:command')
+------------------+-------------------------------------------+
| Preload script (electron/preload.cjs, sandboxed)             |
|  contextBridge.exposeInMainWorld('careConnect', {...})       |
+------------------+-------------------------------------------+
                   ^  window.careConnect (frozen object)
                   |
+------------------+-------------------------------------------+
| Renderer process (Chromium, sandboxed, no Node)              |
|  React 19 + TypeScript: src/App.tsx, pages, components       |
|  pure logic: src/state/careLogic.ts                          |
|  typed bridge access: src/lib/desktop.ts                     |
+--------------------------------------------------------------+
```

The renderer never receives `ipcRenderer` or any Node API. If `window.careConnect` is missing (plain browser, Jest), `getDesktop()` returns null and the UI falls back to browser-only behaviour.

## 2. Module responsibilities

| Module | Responsibility |
|---|---|
| `electron/main.cjs` | Composition root. `bootstrap(electron)` takes the Electron module as a parameter so Jest can start the whole main process against a fake. Creates the window, wires menu, tray, IPC, updater, single-instance lock, window title and badge updates. On macOS it also sets the native About panel text, uses the template icon for the menu bar item and keeps the app running after the last window closes. |
| `electron/channels.cjs` | The IPC channel names and the list of menu actions the renderer accepts. |
| `electron/ipc.cjs` | Registers all IPC handlers. Each one checks the sender, validates its arguments and returns `{ ok, ... }` instead of throwing. |
| `electron/preload.cjs` | Builds the `window.careConnect` API with `contextBridge`. Keeps its own copy of the channel names (a sandboxed preload cannot require local files); a unit test keeps the copies identical. |
| `electron/menu.cjs` | `buildMenuTemplate()` is a pure function that produces the native menu with accelerators: File / Edit / View / Help with Alt mnemonics on Windows and Linux, and on macOS an app menu (native About role, Settings, Hide, Quit), a Window menu and a Help menu with the `help` role so macOS adds its search field. Care plan items are disabled until sign-in. |
| `electron/windowState.cjs` | Saves and restores window size, position and maximized state (`window-state.json`), and rejects bounds that would be off-screen. |
| `electron/careStore.cjs` | Reads and writes `care-data.json` in userData. Atomic write (temp file then rename), 5 MB limit, corrupt files set aside as `.corrupt`. |
| `electron/tray.cjs` | Tray icon, tooltip and context menu (next medication, unread count, quick actions). |
| `electron/security.cjs` | Secure `webPreferences`, trusted-sender check, navigation and `window.open` blocking, permission lockdown, external link allowlist. |
| `electron/updater.cjs` | `electron-updater` against GitHub Releases. Packaged builds only. Errors are logged, never shown. |
| `src/lib/desktop.ts` | Typed `CareConnectBridge` interface and `getDesktop()`. |
| `src/state/careLogic.ts` | Pure functions for the care plan (sign in, medications, appointments, messages, check-in, import/export parsing). No React, no Electron. |
| `src/App.tsx` | Holds app state, loads the saved care plan, autosaves, reports the session, handles menu commands, shows status messages. |
| `src/components`, `src/pages` | UI: AppShell (toolbar, sidebar, dialogs, settings), dashboard, medications, appointments, activity, messages, sign in / up. |

## 3. IPC channels

| Channel | Direction | Payload | Validation and result |
|---|---|---|---|
| `menu:command` | main to renderer | action string | Sent only if the action is in `MENU_ACTIONS`; the preload forwards only strings. |
| `session:update` | renderer to main (send) | `{ signedIn, userName, unread, nextMedication }` | Sender checked; `parseSession` coerces types, strips control characters, caps lengths and the unread count (999). Updates menu, tray, title, badge. |
| `care:load` | renderer to main (invoke) | none | Sender checked. Returns `{ ok, data }` (data is null when no file exists), or an error if the file is too large, unreadable or damaged. |
| `care:save` | renderer to main (invoke) | care plan object | Sender checked; must be a plain object, JSON serializable, at most 5 MB. Atomic write. Returns `{ ok, savedAt }`. |
| `care:export` | renderer to main (invoke) | care plan object | Same payload validation, then a native Save dialog. Returns `{ ok, filePath }` or `{ ok: false, canceled: true }`. |
| `care:import` | renderer to main (invoke) | none | Native Open dialog (json filter), 5 MB limit, JSON parse. The renderer then validates the shape with `parseCareData`. |
| `care:clear` | renderer to main (invoke) | none | Sender checked. Removes `care-data.json`. |
| `app:notify` | renderer to main (invoke) | `title, body` | Sender checked; text cleaned and length capped; empty title rejected. Shows a native notification. |
| `app:info` | renderer to main (invoke) | none | Sender checked. Returns name, version, platform, Electron version. |

All handlers reject callers other than the main window's own page with `{ ok: false, error: 'Request rejected' }`.

## 4. Data flow

### Autosave

1. A user action (for example marking a medication taken) changes React state in `App.tsx`.
2. `toCareData()` serializes the care plan to JSON. When it differs from the last saved JSON, an effect starts a short debounce timer (only on desktop, after sign-in, after the initial load).
3. When the timer fires, the renderer calls `window.careConnect.saveCareData(data)`.
4. The preload sends `care:save` with `ipcRenderer.invoke`.
5. `ipc.cjs` verifies the sender, then `careStore.save()` validates the payload, writes `care-data.json.tmp` and renames it over `care-data.json`.
6. The `{ ok, savedAt }` result returns to the renderer, which updates the status line. On startup `care:load` reads the file back and `applyCareData()` restores it.

### Menu command (for example Ctrl+2)

1. The accelerator or a click on View > Medications triggers the menu item's `click`, built in `menu.cjs`.
2. `sendCommand('medications')` in `main.cjs` checks the action against `MENU_ACTIONS` and calls `webContents.send('menu:command', 'medications')`.
3. The preload's `onMenuCommand` listener receives the string and passes it to the renderer callback.
4. `App.tsx` maps the action to a state change (navigate to the Medications page, open a dialog, zoom, toggle a mode). The same path serves tray quick actions.
5. After sign-in or sign-out the renderer sends `session:update`, and the main process rebuilds the menu so care plan items are enabled or disabled.

## 5. Security checklist

Mapped to the Electron security tutorial (https://www.electronjs.org/docs/latest/tutorial/security).

| Item | Status | Where |
|---|---|---|
| 1. Only load secure content | Done. The app loads from a local file; external links are https only. | `security.cjs` |
| 2. Do not enable Node.js integration for remote content | Done (`nodeIntegration: false`, also in workers). | `secureWebPreferences` |
| 3. Enable context isolation | Done. | `secureWebPreferences` |
| 4. Enable process sandboxing | Done (`sandbox: true`). | `secureWebPreferences` |
| 5. Handle session permission requests | Done. All requests and checks are denied. | `lockDownSession` |
| 6. Do not disable webSecurity | Done (`webSecurity: true`). | `secureWebPreferences` |
| 7. Define a Content Security Policy | Done. `default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`. | `index.html` |
| 8. Do not enable allowRunningInsecureContent | Done (false). | `secureWebPreferences` |
| 9. Do not enable experimental features | Done. None set. | |
| 10. Do not use enableBlinkFeatures | Done. Not used. | |
| 11. Do not use allowpopups for WebViews / verify WebView options | Done. `webviewTag: false` and `will-attach-webview` is prevented. | `security.cjs`, `main.cjs` |
| 12. Verify WebView options before creation | Not applicable (no webviews). | |
| 13. Disable or limit navigation | Done. `will-navigate` allows only the app's own page. | `hardenWebContents` |
| 14. Disable or limit creation of new windows | Done. `window.open` is denied; allowlisted https links open in the default browser. | `hardenWebContents` |
| 15. Do not use shell.openExternal with untrusted content | Done. Only the allowlist (github.com, www.nvaccess.org, www.electronjs.org) over https, plus the fixed issues URL. | `isAllowedExternalUrl` |
| 16. Use a current version of Electron | Done. Electron 44.x per `package.json`. | `package.json` |
| 17. Validate the sender of all IPC messages | Done. `isTrustedSender` checks the window and frame URL. | `security.cjs`, `ipc.cjs` |
| 18. Avoid usage of the file protocol and prefer custom protocols | Partly. The packaged app loads `file://` content; navigation is locked to the single index page. A custom protocol is a possible future improvement. | |
| 19. Check which fuses you can change | Done. `runAsNode` off, cookie encryption on, NODE_OPTIONS and inspect arguments off, embedded ASAR integrity on, `onlyLoadAppFromAsar` on. | `package.json` build |
| 20. Do not expose Electron APIs to untrusted web content | Done. `contextBridge` exposes a frozen, narrow API; `ipcRenderer` is never exposed. | `preload.cjs` |

Additional measures: payload validation with a 5 MB limit, control-character stripping on text sent to notifications and the tray, and atomic file writes.

## 6. Packaging and auto-update

Packaging uses electron-builder with the `build` section of `desktop-electron/package.json`.

- Files packed: `dist/`, `electron/`, `assets/`, `package.json`, inside an ASAR archive. Output goes to `release/`.
- macOS (primary target, Intel x64 and Apple Silicon arm64): `.dmg` and `.zip` per architecture, named `CareConnect-<version>-mac-<arch>.<ext>`. `npm run dist:mac:intel` (Intel), `dist:mac:arm` (Apple Silicon) or `dist:mac` (both). The zip is required by `electron-updater` on macOS. The icon is `assets/icon.png` (1024 px), the menu bar icon is the template image `assets/trayTemplate.png` (with `@2x`), and `assets/entitlements.mac.plist` is wired in for later hardened runtime and notarization. Dmg files are built on a Mac or on the GitHub macOS runners (`.github/workflows/desktop-electron.yml`); the app folder was also assembled from Linux to validate the config.
- Windows (secondary): NSIS x64 installer `CareConnect-Setup-0.8.0.exe`, per-user, choose install directory, Desktop and Start Menu shortcuts (`npm run dist:win`, built on Windows or the CI Windows runner).
- Linux (tertiary): AppImage and deb (`npm run dist:linux`). The AppImage was built and launched headless in a container to prove the configuration.
- Fuses are flipped at package time (`electronFuses`).
- Auto-update: `electron-updater` reads the `publish` entry (GitHub, `LaoWai-Fi/careconnect-swen661-T1`). It runs only in packaged builds and can be disabled with `CARECONNECT_DISABLE_UPDATES=1`. A GitHub Release containing the installer and `latest.yml` must exist for updates to be found; until then the check fails quietly.
- Code signing: none with a Developer ID or certificate. macOS builds are ad-hoc signed (needed on Apple Silicon) and not notarized, so Gatekeeper warns on first launch (Control-click > Open); Windows SmartScreen warns on first run; update packages are not verified by a publisher certificate. The README explains how someone with an Apple Developer ID can turn on hardened runtime and notarization.
- CI: GitHub Actions runs typecheck, lint, Jest and the e2e tests on Ubuntu, then builds installers on macOS Intel, macOS Apple Silicon and Windows runners and uploads them as artifacts.
