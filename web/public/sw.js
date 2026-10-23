/* Build template: scripts/build-pwa.mjs injects a release ID and exact static files. */
const BUILD_ID = '__CC_BUILD_ID__';
const PRECACHE = /*__CC_PRECACHE__*/[];
const PREFIX = 'careconnect-web-';
const CACHE_NAME = PREFIX + BUILD_ID;
// The app can live under a sub-path (for example GitHub Pages project sites), so all
// paths are resolved against the worker's scope instead of assuming the origin root.
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const toPath = (file) => new URL(file, self.registration.scope).pathname;
const PRECACHE_PATHS = PRECACHE.map(toPath);
const STATIC_PATHS = new Set(PRECACHE_PATHS);
const LEGACY_CACHES = new Set(['careconnect-shell-v1', 'careconnect-runtime-v1', 'careconnect-fonts-v1']);

self.addEventListener('install', (event) => {
  // An incomplete download must not replace a working offline release.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_PATHS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => (key.startsWith(PREFIX) && key !== CACHE_NAME) || LEGACY_CACHES.has(key))
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  // A waiting update activates only after the user chooses Reload to update.
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE_PATH)) return;
  // Route path relative to the app base, always starting with "/".
  const appPath = url.pathname.slice(SCOPE_PATH.length - 1);
  const isAppRoute = /^\/(?:$|signin\/?$|signup\/?$|role\/?$|app(?:\/|$)|schedule\/?$|medications\/?$|memories\/?$|contacts\/?$|caregiver\/?$)/.test(appPath);
  if (request.mode === 'navigate' && isAppRoute) {
    // Serve one coherent release of the SPA, including direct nested routes.
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
      (await cache.match(toPath('index.html'))) || fetch(request)));
  } else if (!url.search && STATIC_PATHS.has(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
      (await cache.match(url.pathname)) || fetch(request)));
  }
  // API/auth requests, unlisted paths, external requests and all mutations stay network-only.
});
