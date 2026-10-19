/* Build template: scripts/build-pwa.mjs injects a release ID and exact static files. */
const BUILD_ID = '__CC_BUILD_ID__';
const PRECACHE = /*__CC_PRECACHE__*/[];
const PREFIX = 'careconnect-web-';
const CACHE_NAME = PREFIX + BUILD_ID;
const STATIC_PATHS = new Set(PRECACHE);
const LEGACY_CACHES = new Set(['careconnect-shell-v1', 'careconnect-runtime-v1', 'careconnect-fonts-v1']);

self.addEventListener('install', (event) => {
  // An incomplete download must not replace a working offline release.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
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
  const isAppRoute = /^\/(?:$|signin\/?$|signup\/?$|role\/?$|app(?:\/|$)|schedule\/?$|medications\/?$|memories\/?$|contacts\/?$|caregiver\/?$)/.test(url.pathname);
  if (request.mode === 'navigate' && isAppRoute) {
    // Serve one coherent release of the SPA, including direct nested routes.
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
      (await cache.match('/index.html')) || fetch(request)));
  } else if (!url.search && STATIC_PATHS.has(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
      (await cache.match(url.pathname)) || fetch(request)));
  }
  // API/auth requests, unlisted paths, external requests and all mutations stay network-only.
});
