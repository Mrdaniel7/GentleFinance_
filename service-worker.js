// ============================================
// GENTLEFINANCES - Service Worker
// PWA Offline Support & Caching
// ============================================

const CACHE_NAME = 'gentlefinances-v8';
const STATIC_CACHE = 'gentlefinances-static-v6';
const DYNAMIC_CACHE = 'gentlefinances-dynamic-v6';

// Relative paths for assets (compatible with GitHub Pages subdirectory)
const STATIC_ASSETS_RELATIVE = [
    './',
    './index.html',
    './css/styles.css',
    './css/mobile.css',
    './js/app.js',
    './js/api.js',
    './js/auth-ui.js',
    './js/budget.js',
    './js/budgets.js',
    './js/crypto.js',
    './js/crypto-service.js',
    './js/dashboard.js',
    './js/firebase-sdk.js',
    './js/goals.js',
    './js/help.js',
    './js/i18n.js',
    './js/import.js',
    './js/investment-modal.js',
    './js/investments.js',
    './js/modal.js',
    './js/navigation.js',
    './js/portfolio.js',
    './js/realestate.js',
    './js/reports.js',
    './js/security.js',
    './js/settings.js',
    './js/sidebar.js',
    './js/spain-map.js',
    './js/spain-paths.js',
    './js/subscriptions.js',
    './js/transactions.js',
    './js/ux.js',
    './js/cache-db.js',
    './manifest.json',
    './assets/logo.svg',
    './assets/icons/icon.svg',
    './assets/icons/icon-512.png',
    './assets/icons/icon-192.png'
];

// Build absolute URLs from relative paths using SW scope
const STATIC_ASSETS = STATIC_ASSETS_RELATIVE.map(path => {
    return new URL(path, self.registration?.scope || self.location.href).href;
});

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Static assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Failed to cache:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== STATIC_CACHE &&
                                cacheName !== DYNAMIC_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - network-first for JS/CSS, cache-first for images/fonts
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Network-first for JS and CSS files (code changes should always be fresh)
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request).then(cached => {
                        return cached || new Response('Offline', { status: 503 });
                    });
                })
        );
        return;
    }

    // Cache-first for everything else (images, fonts, etc.)
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[ServiceWorker] Fetch failed:', error);

                        if (request.mode === 'navigate') {
                            const indexUrl = new URL('./index.html', self.registration?.scope || self.location.href).href;
                            return caches.match(indexUrl) || caches.match('./index.html');
                        }

                        if (request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#1A1A1A" width="100" height="100"/></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }

                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Background sync for transactions
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync:', event.tag);

    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncTransactions());
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');

    const options = {
        body: event.data ? event.data.text() : 'Nueva notificación de GentleFinances',
        icon: '/assets/icons/icon.svg',
        badge: '/assets/icons/icon.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'explore', title: 'Ver detalles' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('GentleFinances', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification clicked');

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/index.html')
        );
    }
});

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        console.log('[ServiceWorker] Skip waiting requested');
        self.skipWaiting();
    }
});

// Helper function to sync pending transactions
async function syncTransactions() {
    try {
        // Get pending transactions from IndexedDB
        // This would be implemented with actual IndexedDB logic
        console.log('[ServiceWorker] Syncing transactions...');
        return Promise.resolve();
    } catch (error) {
        console.error('[ServiceWorker] Sync failed:', error);
        throw error;
    }
}
