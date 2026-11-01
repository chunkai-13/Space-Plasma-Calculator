const CACHE_NAME = 'plasma-calc-v2.9';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=2.9',
  './css/base.css?v=2.9',
  './css/layout.css?v=2.9',
  './css/builder.css?v=2.9',
  './css/components.css?v=2.9',
  './constants.js?v=2.9',
  './js/i18n.js?v=2.9',
  './js/equations-particle.js?v=2.9',
  './js/equations-mhd-waves.js?v=2.9',
  './js/equations-kinetic-shocks.js?v=2.9',
  './equations.js?v=2.9',
  './js/calculator-core.js?v=2.9',
  './js/calculator-evaluator.js?v=2.9',
  './js/calculator-formatter.js?v=2.9',
  './calculator.js?v=2.9',
  './js/builder-cards-items.js?v=2.9',
  './js/builder-cards-list.js?v=2.9',
  './js/builder-preview.js?v=2.9',
  './js/tab-builder.js?v=2.9',
  './js/tab-lookup.js?v=2.9',
  './js/tab-equations.js?v=2.9',
  './app.js?v=2.9',
  './katex/katex.min.js?v=2.9',
  './katex/katex.min.css?v=2.9',
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
