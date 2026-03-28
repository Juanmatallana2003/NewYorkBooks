const CACHE_NAME = 'nyt-books-v2'; // Cambiamos a v2 para forzar la actualización
const ASSETS_TO_CACHE =[
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Obliga al nuevo Service Worker a instalarse inmediatamente
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Guardando interfaz base en Caché');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Este evento borra la caché vieja (donde se quedó atascado el error 404)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Borrando caché antigua:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // REGLA 1: Si es una petición a la API, SIEMPRE buscar en internet (NO USAR CACHÉ)
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Solo si no hay internet devolvemos un mensaje de error
                return new Response(
                    JSON.stringify({ error: "Estás sin conexión a internet o el servidor falló." }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            })
        );
        return; // Detenemos la ejecución aquí
    }

    // REGLA 2: Para los demás archivos (HTML, CSS, imágenes), usar caché primero
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});