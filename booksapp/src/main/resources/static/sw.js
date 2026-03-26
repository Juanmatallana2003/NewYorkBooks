const CACHE_NAME = 'nyt-books-v1';
const ASSETS_TO_CACHE =[
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Guardando interfaz base en Caché (Offline Mode Ready)');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {

            if (cachedResponse) {
                return cachedResponse;
            }
            
            return fetch(event.request).then((networkResponse) => {

                if (event.request.url.includes('/api/')) {

                    const responseClone = networkResponse.clone();
                    caches.open('nyt-api-cache-v1').then((cache) => {

                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {

                return caches.match(event.request);
            });
        })
    );
});