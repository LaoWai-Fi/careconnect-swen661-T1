# CareConnect Desktop — Week 7 prototype

This is the first runnable Electron implementation of the teammate's [Figma Make desktop design](https://www.figma.com/make/qqSJqhacYy5eD8nomjAqnL/Desktop-UI-Build). The renderer is React, TypeScript, Vite, and Tailwind. The Week 7 submission index is in [`../docs/week7/README.md`](../docs/week7/README.md).

## Run on Windows

Requires Node.js 22.12+ or 24+ and npm. From this folder:

```powershell
npm ci
npm run build
npm run desktop
```

For renderer development, run `npm run dev` in one terminal and set `CARECONNECT_DEV_URL=http://127.0.0.1:5173` before `npm run desktop` in a second terminal. The standard `npm run desktop` command loads the local production build, so it works without a development server.

`npm run smoke` rebuilds the renderer, launches an offscreen Electron window, exercises sign-in, navigation, menu/shortcut access, and theme selection, and writes screenshots plus a JSON result to `../docs/week7/evidence/`.

## Scope and safety

- This is an early UI prototype with sample data. Sign-in accepts any nonempty password; it is **not authentication**.
- Care data changes are temporary. The selected workspace view and theme can be saved locally, but there is no backend, live synchronization, message delivery, or emergency calling. The interface labels these limitations.
- The Electron renderer has `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`. The preload exposes only three window-control actions; navigation and pop-up windows are restricted.
- The Figma export was adapted into a standalone desktop app. Source files under `src/` are the working implementation; the separate `Desktop UI Build` folder remains the original reference.

## Next implementation stage

Replace demo state with an authenticated service, persist data securely, connect real messaging/sync, and test with Windows NVDA and macOS VoiceOver before using this for actual care work. This Week 7 deliverable demonstrates desktop layout and interaction direction, not a production medical application.
