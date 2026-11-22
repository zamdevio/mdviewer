/**
 * Service Worker for MDViewer PWA
 *
 * Source template — Vite emits /sw.js with CACHE_VERSION from package.json.
 * Do not serve this file directly.
 *
 * Strategy (standard update-friendly):
 * - Navigations / HTML: network-only when online (never serve stale shell)
 * - Hashed assets: network-first, cache on success (Ctrl+R gets new deploy)
 * - Other GETs: stale-while-revalidate
 * - install: skipWaiting; activate: clear old caches + clients.claim
 */

const CACHE_VERSION = '__MDVIEWER_CACHE_VERSION__';
const CACHE_NAME = `mdviewer-${CACHE_VERSION}`;

// Only offline fallback — do NOT precache SPA routes (stale HTML traps updates)
const PRECACHE = ['/offline.html', '/favicon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE).catch((err) => {
        console.warn('[SW] Precache partial failure', err);
      })
    )
  );
  self.skipWaiting();
});

const LEGACY_CACHE_PREFIXES = ['mdviewer-', 'workbox-precache', 'workbox-runtime', 'next-'];

function shouldDeleteCache(name) {
  if (name === CACHE_NAME) return false;
  return LEGACY_CACHE_PREFIXES.some((prefix) => name === prefix || name.startsWith(prefix));
}

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', CACHE_VERSION);
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => shouldDeleteCache(n)).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

function isNavigation(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // Never cache the service worker script itself
  if (url.pathname === '/sw.js') {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML / SPA navigations: always hit network when possible
  if (isNavigation(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() =>
          caches.match('/offline.html').then(
            (offline) =>
              offline ||
              new Response('Offline', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' },
              })
          )
        )
    );
    return;
  }

  const isHashedAsset =
    url.pathname.startsWith('/assets/') ||
    /\.(js|css|woff2?)$/i.test(url.pathname);

  if (isHashedAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) =>
              cached ||
              new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
          )
        )
    );
    return;
  }

  // Other static: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }

  if (event.data.type === 'UNREGISTER_SW') {
    event.waitUntil(
      caches
        .keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .then(() =>
          self.registration.unregister().then((success) => {
            if (event.ports && event.ports[0]) {
              event.ports[0].postMessage({ success });
            }
          })
        )
    );
  }
});
