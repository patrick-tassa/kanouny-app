const CACHE = 'kanouny-v25';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data/lectionnaire-2026.json',
  '/data/synaxaire-2026.json',
  '/data/agpeya-fr.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/assets/tabler-icons.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first pour index.html → toujours la dernière version
// Cache-first pour les assets statiques (JSON, icônes, fonts)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname === '/' || url.pathname.endsWith('.html');
  
  if (isHTML) {
    // Network-first : essaie le réseau, fallback cache
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first pour les assets
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request))
    );
  }
});

// Notifier les clients qu'une mise à jour est disponible
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
