// that auto generated sw
const BASE_URL = '/sadcore/';
const PACKAGE_VERSION = '0.1.1-alpha';
const BUILD_TIME = '2025-10-18T13:29:42.252Z';
const CACHE_NAME = `sadcore-${PACKAGE_VERSION}`;

// Resources to cache during installation
const PRECACHE_RESOURCES = [
    BASE_URL,
    BASE_URL + 'index.html',
    BASE_URL + 'assets/index.css',
    BASE_URL + 'assets/index.js',
    BASE_URL + 'manifest.json'
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
    console.log('service worker: installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('service worker: caching app shell');
                return cache.addAll(PRECACHE_RESOURCES);
            })
            .then(() => self.skipWaiting())
    );
    if('registerProtocolHandler' in navigator) {
        // navigator.registerProtocolHandler(
        //     'web+sadcore',
        //     `${BASE_URL}?authtg=%s`,
        //     'Sadcore Dating App'
        // );
    }
});

// activate service worker
self.addEventListener('activate', (event) => {
    console.log('service worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('service worker: deleting old cache', cacheName);
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

    // no cache API requests
    if(url.pathname.startsWith('/api/')){
        return;
    }

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
        console.log('background sync triggered');
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: PACKAGE_VERSION || 'none',
            cacheName: CACHE_NAME
        });
    }
});