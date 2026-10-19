# Week 10 — Working PWA Foundation

## Manifest and install experience

`web/public/manifest.webmanifest` defines CareConnect's name, stable ID, `/app` start URL, root scope, standalone display, theme/background colors, normal 192/512px icons, maskable icons and app shortcuts. Orientation is `any` for both portrait and landscape. `index.html` links the manifest and Apple touch icon.

Supported Chromium browsers can emit `beforeinstallprompt`. The application offers a keyboard-accessible, non-modal Install/Not now section only when that event is available. Rejected prompts show a recoverable message. Dismissal is remembered for 14 days when storage is available, and installed/standalone apps suppress the offer. The browser controls whether/when the event appears. In-app install controls do not imply installation on every browser.

The footer includes manual installation guidance. For iPhone/iPad, use the browser Share menu → Add to Home Screen, and enable Open as Web App if offered. Chrome/Edge users can use the browser Install app option. See [Apple's guide](https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iph42ab2f3a7/ios) and [web.dev installation guidance](https://web.dev/learn/pwa/installation).

## Offline behavior

| Operation | Offline behavior |
| --- | --- |
| First-ever visit | Requires a network connection to download the app. No uncached first-visit promise is made. |
| Reopen/reload an app route after the worker is ready | Cached app shell and bundled code load, including direct nested routes. |
| Demo dashboard, schedule and prescriptions | Read bundled/local demonstration data. |
| Add/edit/delete a demo medication | Saves in this browser's localStorage; persists across offline reloads. No server synchronization is claimed. |
| Optional remote assistant | Remote API requires connectivity; the existing scripted getting-started fallback can still answer locally. |
| Real authentication, clinical data or cross-device collaboration | Not provided by this course prototype. |

A polite connection notice explains that offline changes stay on the device. Browser storage can be cleared or evicted, and installed browser apps may have separate storage. Do not use real patient information.

## Service-worker strategy

1. `npm run build` builds the SPA, then `scripts/build-pwa.mjs` enumerates the actual output's index, manifest, icons and hashed JS/CSS files. It computes a release hash from the files and worker template and injects an exact precache list into `dist/sw.js`.
2. Installation uses `cache.addAll`. If a required file fails, the new worker does not replace the working release. The app does not silently accept a partial offline download.
3. Controlled app navigations use the cached index for a consistent release. Static resources are served only from the build's allowlist. A network fallback is available for an unexpectedly missing cached resource.
4. API/auth paths, non-GET mutations, unlisted resources and external URLs are not intercepted or added to the static cache. User/medication values are not stored in Cache Storage; demonstration values remain in existing localStorage.
5. Activation removes only obsolete `careconnect-web-*` release caches and the three explicitly known legacy CareConnect v1 caches. Other applications' cache names remain untouched.

The worker is registered only for production builds in secure contexts. Localhost/127.0.0.1 is suitable for local testing; a deployed site needs HTTPS. No service-worker interception occurs in development mode.

## Safe updates

New workers wait while the current application is in use. An update notice offers **Reload to update** or **Later** and warns the user to finish editing. Only the explicit Reload action sends `SKIP_WAITING`. A resulting controller change reloads the page. Normal first activation does not force a reload. A successful new release activates as a complete cache, and prior release caches are then cleaned up.

## Deployment and verification

Host the contents of `web/dist/` at the origin root over HTTPS. Configure the static host to serve `index.html` for client-side app routes while preserving real static-file and API responses. Serve `sw.js` with JavaScript content type and a revalidation/no-cache policy, and `manifest.webmanifest` with a valid manifest/JSON content type. Hashed assets can use a long immutable cache lifetime. Root deployment is required by the current absolute manifest/worker URLs; subdirectory hosting needs a coordinated base/scope change.

The browser tests exercise real service-worker registration, offline direct navigation/reload, persisted local edits, static-only caching, a real waiting-worker update and unrelated-cache preservation. The install-offer interaction test simulates the browser event and rejection, so it is not evidence of an OS-level install. A separate browser protocol check records the browser's installability diagnostics. Actual iOS/Android installation and new screen-reader sessions are not claimed by this run.

Actual results and native screenshots: [TEST_RESULTS.md](TEST_RESULTS.md), [evidence/](evidence/).
