# Electron implementation progress and verification

## Implemented in Week 7

The teammate's Figma Make React export was adapted into a standalone Electron app under [`desktop-electron/`](../../desktop-electron/). It has a secure main process, a narrow preload bridge for window controls, the desktop renderer, and reproducible npm scripts. The app builds with TypeScript/Vite and launches from the local production bundle.

The renderer currently includes welcome, sign-in/sign-up demo, overview, medications, appointments, activity, messages, settings, search, shortcut reference, theme/zoom/high-contrast modes, and functional Electron window controls. There is no backend; this is design-to-implementation progress, not a finished care service.

## Verification recorded on 27 September 2026

`npm run build` passed. `npm run smoke` then launched Electron in offscreen mode at 1440 × 900 and passed **17 checks**. The machine-readable results are [`evidence/electron-smoke-results.json`](evidence/electron-smoke-results.json); six captured PNGs are in the same folder. The checks cover initial render, sign-in, menu/toolbar render, medication/message navigation, Ctrl+2, Ctrl+5, Ctrl+S, F1, Alt+H, Help-menu access, Settings, high contrast, and light theme.

This constitutes runnable-code and screenshot evidence that Electron implementation has started. The screenshots were captured from Electron's renderer, not generated from static design files.

## Reproduce

From `desktop-electron/`, run `npm ci`, `npm run build`, then `npm run desktop` to use the app. Run `npm run smoke` to regenerate the evidence locally. Node.js 22.12+ or 24+ is required. See the app [`README.md`](../../desktop-electron/README.md) for development notes.

## Honest limits

Sign-in is demo-only, changes are temporary, and no live backend, sync, message transport, or emergency dialing exists. No claim is made that NVDA/VoiceOver device testing has passed. The original Figma Make link is private and should be shared with the instructor by its owner.
