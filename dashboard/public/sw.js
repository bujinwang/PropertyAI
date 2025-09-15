/**
 * Service Worker for PropertyAI Dashboard
 * Enables PWA features and offline functionality
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

const CACHE_NAME = 'propertyai-v1.0.0';
const STATIC_CACHE = 'propertyai-static-v1.0.0';
const DYNAMIC_CACHE = 'propertyai-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API endpoints to cache for offline use
const API_CACHE_PATTERNS = [
  /\/api\/properties/,
  /\/api\/tenants/,
  /\/api\/maintenance/,
  /\/api\/analytics/,
  /\/api\/dashboard/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default fetch for other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (!event.data) {
    console.log('[SW] Push notification has no data');
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type || 'general'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/logo192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PropertyAI Alert', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Helper functions
function isApiRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/static/') ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/i)
  );
}

async function handleApiRequest(request) {
  // Try cache first for GET requests
  if (request.method === 'GET') {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Return cached response and update in background
      fetch(request).then(response => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, response));
        }
      }).catch(() => {
        // Network failed, keep cached response
      });
      return cachedResponse;
    }
  }

  // Try network
  try {
    const response = await fetch(request);

    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed for API request:', request.url);

    // Return offline response for critical endpoints
    if (request.url.includes('/api/maintenance') ||
        request.url.includes('/api/properties')) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'You are currently offline. Data will sync when connection is restored.',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

async function handleNavigationRequest(request) {
  const cachedResponse = await caches.match('/index.html');
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    return await fetch(request);
  } catch (error) {
    // Return cached index.html as fallback
    const fallbackResponse = await caches.match('/index.html');
    if (fallbackResponse) {
      return fallbackResponse;
    }

    // Ultimate fallback
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PropertyAI - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div style="padding: 20px; text-align: center;">
            <h1>PropertyAI</h1>
            <p>You are currently offline.</p>
            <p>Please check your internet connection and try again.</p>
          </div>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

async function syncOfflineData() {
  console.log('[SW] Syncing offline data');

  try {
    // Enhanced sync using IndexedDB sync queue
    if (typeof indexedDB !== 'undefined') {
      // Use IndexedDB sync queue if available
      const syncQueue = await getSyncQueueFromIndexedDB();

      const syncPromises = syncQueue.map(async (item) => {
        try {
          const response = await attemptSyncFromQueue(item);
          if (response.success) {
            await removeFromSyncQueue(item.id);
            console.log('[SW] Successfully synced from queue:', item.id);
          } else {
            await updateSyncQueueRetry(item.id, response.error);
          }
        } catch (error) {
          console.log('[SW] Failed to sync from queue:', item.id, error);
          await updateSyncQueueRetry(item.id, error.message);
        }
      });

      await Promise.all(syncPromises);
    } else {
      // Fallback to cache-based sync
      const cache = await caches.open(DYNAMIC_CACHE);
      const keys = await cache.keys();

      const syncPromises = keys
        .filter(request => {
          // Only sync POST/PUT/PATCH requests that failed
          return ['POST', 'PUT', 'PATCH'].includes(request.method);
        })
        .map(async (request) => {
          try {
            const response = await cache.match(request);
            if (response) {
              // Retry the request
              const retryResponse = await fetch(request);
              if (retryResponse.ok) {
                // Remove from cache on success
                await cache.delete(request);
                console.log('[SW] Successfully synced:', request.url);
              }
            }
          } catch (error) {
            console.log('[SW] Failed to sync:', request.url, error);
          }
        });

      await Promise.all(syncPromises);
    }

    console.log('[SW] Offline data sync completed');
  } catch (error) {
    console.error('[SW] Offline data sync failed:', error);
  }
}

// IndexedDB sync helpers
async function getSyncQueueFromIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('PropertyAI_Offline', 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => {
        resolve([]);
      };
    };
    request.onerror = () => resolve([]);
  });
}

async function attemptSyncFromQueue(item) {
  try {
    const options = {
      method: item.method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (item.method !== 'DELETE' && item.data) {
      options.body = JSON.stringify(item.data);
    }

    const response = await fetch(item.url, options);
    return {
      success: response.ok,
      error: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function removeFromSyncQueue(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('PropertyAI_Offline', 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
}

async function updateSyncQueueRetry(id, error) {
  return new Promise((resolve) => {
    const request = indexedDB.open('PropertyAI_Offline', 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = error;
          store.put(item);
        }
        resolve();
      };

      getRequest.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
}

// Cache management utilities
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    caches.keys().then(cacheNames => {
      event.ports[0].postMessage({
        type: 'CACHE_INFO',
        caches: cacheNames
      });
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      ).then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEARED'
        });
      });
    });
  }
});

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();

    // Remove old entries (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    const cleanupPromises = keys
      .filter(request => {
        // Only clean up GET requests
        return request.method === 'GET';
      })
      .map(async (request) => {
        const response = await cache.match(request);
        if (response) {
          const date = response.headers.get('date');
          if (date && new Date(date).getTime() < oneHourAgo) {
            return cache.delete(request);
          }
        }
      });

    await Promise.all(cleanupPromises);
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}, 30 * 60 * 1000); // Run every 30 minutes