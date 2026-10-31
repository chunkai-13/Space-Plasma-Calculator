const CACHE_NAME = 'plasma-calc-v2.2';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=2.2',
  './constants.js?v=2.2',
  './equations.js?v=2.2',
  './calculator.js?v=2.2',
  './app.js?v=2.2',
  './katex/katex.min.js?v=2.2',
  './katex/katex.min.css?v=2.2',
  './icon.png',
  './icon-192.png',
  './icon-512.png',
  './favicon.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((networkRes) => {
      if (networkRes && networkRes.status === 200) {
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
      }
      return networkRes;
    }).catch(() => caches.match(e.request))
  );
});
