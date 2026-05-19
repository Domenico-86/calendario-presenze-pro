const CACHE_NAME = 'presenze-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installazione: metti in cache i file principali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Attivazione: rimuovi cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first per le API, cache-first per gli asset
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Le chiamate all'API Google Scripts vanno sempre in rete
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({error: 'offline'}), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Per gli asset: cache-first con fallback network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Salva nella cache solo risposte valide
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
