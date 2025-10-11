const CACHE_NAME = 'sadcore-' + import.meta.env.PACKAGE_VERSION;
const API_CACHE_NAME = 'sadcore-api-' + import.meta.env.PACKAGE_VERSION;

// resources to cache during installation
const PRECACHE_RESOURCES = [
    '/',
    '/index.html',
    '/assets/index.css',
    '/assets/index.js',
    '/manifest.json'
];

// caching strategy: network first, cache later (for HTML)
const networkFirst = async (request) => {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || Response.error();
    }
};

// caching strategy: cache first, network later (for static resources)
const cacheFirst = async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return Response.error();
    }
};

// setup service worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(PRECACHE_RESOURCES);
            })
            .then(() => self.skipWaiting())
    );
});

// activate service worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // delete old caches
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if(request.destination === 'document'){
        event.respondWith(networkFirst(request));
        return;
    }

    // (CSS, JS, IMAGES)
    if (request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font') {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(networkFirst(request));
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: import.meta.env.PACKAGE_VERSION || '0.0.0',
            cacheName: CACHE_NAME
        });
    }
});