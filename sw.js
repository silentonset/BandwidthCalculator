const CACHE_NAME = 'staging-calc-v1';
const ASSETS = [
    './',
    './index.html'
];

// 1. Install Event: Force the browser to cache the core HTML shell immediately
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// 2. Activate Event: Wipe old cache versions if you ever publish code updates
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch Event: Intercept network requests and handle offline routing
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // If network fetch succeeds, clone the response and save to offline cache
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => {
                // If network fails (Airplane Mode), serve the saved file from cache
                return caches.match(event.request).then(cachedResponse => {
                    return cachedResponse || caches.match('./index.html');
                });
            })
    );
});