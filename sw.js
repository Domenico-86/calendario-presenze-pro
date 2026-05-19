// Aggiorna questo numero ad ogni deploy per forzare il refresh
const CACHE_NAME = 'presenze-v5';
const ASSETS = [
  '/calendario-presenze-pro/',
  '/calendario-presenze-pro/index.html',
  '/calendario-presenze-pro/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API Google Scripts: sempre rete, mai cache
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request, {cache: 'no-store'}).catch(() =>
        new Response(JSON.stringify({error: 'offline'}), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // index.html: sempre rete prima, cache come fallback
  if (url.pathname.includes('index.html') || url.pathname.endsWith('/calendario-presenze-pro/')) {
    event.respondWith(
      fetch(event.request, {cache: 'no-store'}).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Altri asset: cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
