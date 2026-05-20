// Service Worker for Algebra Assault PWA
// Provides offline support via cache-first strategy for app shell assets

const CACHE_VERSION = 'algebra-assault-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png'
];

// Install event: precache app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        // If precaching fails (e.g., quota exceeded), skip waiting anyway
        // so the SW can still activate and serve whatever is already cached
        console.warn('[SW] Precache failed, continuing with available assets:', err);
        return self.skipWaiting();
      })
  );
});

// Activate event: clean old caches and notify clients of update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_VERSION)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all clients that a new SW version is available
        return self.clients.matchAll({ type: 'window' });
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
        });
      })
  );
});

// Fetch event: cache-first for same-origin, network-first for cross-origin
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Same-origin requests: cache-first strategy
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Not in cache — fetch from network and cache the response
          return fetch(event.request)
            .then((networkResponse) => {
              // Only cache successful responses
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }

              const responseToCache = networkResponse.clone();

              // Cache the fetched resource, handle quota exceeded gracefully
              caches.open(CACHE_VERSION)
                .then((cache) => {
                  return cache.put(event.request, responseToCache);
                })
                .catch((err) => {
                  // Quota exceeded or cache open failed — continue without caching
                  console.warn('[SW] Cache write failed (quota exceeded?):', err);
                });

              return networkResponse;
            })
            .catch(() => {
              // Network failed and not in cache — return offline fallback if available
              return caches.match('/index.html');
            });
        })
    );
  } else {
    // Cross-origin requests: network-first strategy
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          // Network failed for cross-origin — try cache as fallback
          return caches.match(event.request);
        })
    );
  }
});
