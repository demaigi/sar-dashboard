const VERSION = 'sar-dashboard-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // The page and the (encrypted) data file: network first, last copy when offline.
  if (req.mode === 'navigate' || url.pathname.endsWith('/data.json')) {
    const cacheKey = req.mode === 'navigate' ? './index.html' : './data.json';
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(cacheKey, copy));
          }
          return res;
        })
        .catch(() => caches.match(cacheKey))
    );
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
