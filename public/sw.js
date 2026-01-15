/**
 * Service Worker for MD Viewer PWA
 * 
 * Implements a network-first strategy for HTML pages (fresh content)
 * and cache-first for static assets (performance).
 * 
 * Cache versioning ensures updates are detected and applied.
 * 
 * ⚠️ IMPORTANT: This file is automatically updated by scripts/inject-sw-version.js
 * The CACHE_VERSION below is injected from src/lib/config.ts during build.
 * Do NOT manually edit CACHE_VERSION - update it in config.ts instead!
 */

// Cache version - automatically injected from src/lib/config.ts during build
// This will be replaced by the build script - do not edit manually!
const CACHE_VERSION = 'v3.2';
const CACHE_NAME = `mdviewer-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/editor',
  '/files',
  '/search',
  '/settings',
  '/favicon.svg',
  '/manifest.json',
  '/offline.html', // Cache offline page
];

// Check if we're on localhost (for smart clearing in dev)
const isLocalhost = self.location.hostname === 'localhost' || 
                    self.location.hostname === '127.0.0.1' ||
                    self.location.hostname.startsWith('192.168.') ||
                    self.location.hostname.startsWith('10.0.');

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker, cache version:', CACHE_VERSION);
  console.log('[SW] Localhost detected:', isLocalhost);
  
  // On localhost, clear old caches immediately for easier development
  if (isLocalhost) {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('mdviewer-'))
            .map((name) => {
              console.log('[SW] [DEV] Clearing cache:', name);
              return caches.delete(name);
            })
        );
      }).then(() => {
        // Then cache new assets
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll(STATIC_ASSETS).catch((err) => {
            console.warn('[SW] Some assets failed to cache', err);
          });
        });
      })
    );
  } else {
    // Production: normal caching
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Some assets failed to cache', err);
        });
      })
    );
  }
  
  // Activate immediately, don't wait for other tabs to close
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker, cleaning old caches');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('mdviewer-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first for HTML, cache-first for static assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const isHTML = event.request.headers.get('accept')?.includes('text/html') || 
                 url.pathname === '/' || 
                 !url.pathname.includes('.');

  if (isHTML) {
    // Network-first strategy for HTML pages (always try to get fresh content)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network succeeds, cache and return
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cache, return offline HTML page
            return caches.match('/offline.html').then((offlinePage) => {
              if (offlinePage) {
                return offlinePage;
              }
              // Fallback if offline.html not cached
              return new Response('Offline - Content not available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' },
              });
            });
          });
        })
    );
  } else {
    // Cache-first strategy for static assets (JS, CSS, images, etc.)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response (stream can only be consumed once)
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Network failed and no cache
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
      })
    );
  }
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating immediately');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    console.log('[SW] Claiming clients');
    self.clients.claim();
  }
  
  // Handle clear cache request
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Received CLEAR_CACHE message');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Deleting cache:', name);
            return caches.delete(name);
          })
        );
      }).then(() => {
        // Send confirmation back to client
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, message: 'All caches cleared' });
        }
      })
    );
  }
  
  // Handle unregister request
  if (event.data && event.data.type === 'UNREGISTER_SW') {
    console.log('[SW] Received UNREGISTER_SW message');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        // Unregister this service worker
        return self.registration.unregister().then((success) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ 
              success, 
              message: success ? 'Service worker unregistered' : 'Failed to unregister' 
            });
          }
        });
      })
    );
  }
});
