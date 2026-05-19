// Service Worker minimo - nessuna cache, sempre rete
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
    // Cancella TUTTE le cache esistenti
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Passa tutto alla rete, niente cache
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});
