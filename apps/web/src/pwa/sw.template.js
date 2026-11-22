/**
 * Service Worker for MDViewer PWA
 *
 * Source template — Vite emits /sw.js with CACHE_VERSION from package.json.
 * Do not serve this file directly.
 *
 * Update strategy: HTML network-first; static assets stale-while-revalidate
 * so a normal reload (Ctrl+R) picks up new hashed bundles without hard refresh.
 */

const CACHE_VERSION = '__MDVIEWER_CACHE_VERSION__';
const CACHE_NAME = `mdviewer-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/editor',
  '/files',
  '/search',
  '/settings',
  '/favicon.svg',
  '/manifest.json',
  '/offline.html',
];

const isLocalhost =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.startsWith('192.168.') ||
  self.location.hostname.startsWith('10.0.');

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker, cache version:', CACHE_VERSION);

  if (isLocalhost) {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter((name) => name.startsWith('mdviewer-'))
              .map((name) => caches.delete(name))
          )
        )
        .then(() =>
          caches.open(CACHE_NAME).then((cache) =>
            cache.addAll(STATIC_ASSETS).catch((err) => {
              console.warn('[SW] Some assets failed to cache', err);
            })
          )
        )
    );
  } else {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) =>
        cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Some assets failed to cache', err);
        })
      )
    );
  }

  self.skipWaiting();
});

const LEGACY_CACHE_PREFIXES = ['mdviewer-', 'workbox-precache', 'workbox-runtime', 'next-'];

function shouldDeleteCache(name) {
  if (name === CACHE_NAME) return false;
  return LEGACY_CACHE_PREFIXES.some((prefix) => name === prefix || name.startsWith(prefix));
}

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker, cleaning old caches');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.filter((name) => shouldDeleteCache(name)).map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return caches.match('/offline.html').then(
          (offline) =>
            offline ||
            new Response('Offline - Content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' },
            })
        );
      })
    );
}

/** Prefer network when online; fall back to cache; update cache in background. */
function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(request).then((cached) => {
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      // Online path: race — if network is fast, use it; else cached then refresh
      return cached
        ? Promise.race([
            networkPromise,
            new Promise((resolve) => {
              // Return cache immediately; network updates cache for next load
              resolve(cached);
              networkPromise.catch(() => undefined);
            }),
          ]).then((result) => result || networkPromise)
        : networkPromise;
    })
  );
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);
  const accept = event.request.headers.get('accept') || '';
  const isHTML =
    accept.includes('text/html') ||
    url.pathname === '/' ||
    (!url.pathname.includes('.') && !url.pathname.startsWith('/assets'));

  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    /\.(js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname);

  if (isHTML) {
    event.respondWith(networkFirst(event.request));
  } else if (isStaticAsset) {
    // Network-first for hashed assets so Ctrl+R gets new deploy; cache on success
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
              new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
              })
          )
        )
    );
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name)))).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, message: 'All caches cleared' });
        }
      })
    );
  }

  if (event.data && event.data.type === 'UNREGISTER_SW') {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))))
        .then(() =>
          self.registration.unregister().then((success) => {
            if (event.ports && event.ports[0]) {
              event.ports[0].postMessage({
                success,
                message: success ? 'Service worker unregistered' : 'Failed to unregister',
              });
            }
          })
        )
    );
  }
});
