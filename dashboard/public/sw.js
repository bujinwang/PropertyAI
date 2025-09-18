// Service Worker for PropertyAI Mobile Optimization
// Caches key API responses for offline access

const CACHE_NAME = 'propertyAI-cache-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js', // Adjust for actual bundle
  '/api/predictive-maintenance',
  '/api/properties'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Fetch event - serve from cache or fetch and cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch new
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(networkResponse => {
            // Cache successful responses (except redirects)
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return networkResponse;
          });
      })
      .catch(() => {
        // Offline fallback for API requests
        if (event.request.url.includes('/api/')) {
          return caches.match('/'); // Or custom offline page
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});