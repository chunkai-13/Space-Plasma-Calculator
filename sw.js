const CACHE_NAME = 'plasma-calc-v3.2';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=3.2',
  './css/base.css?v=3.2',
  './css/layout.css?v=3.2',
  './css/components.css?v=3.2',
  './css/builder.css?v=3.2',
  './css/builder-cards.css?v=3.2',
  './css/lookup-equations.css?v=3.2',
  './css/responsive.css?v=3.2',
  './constants.js?v=3.2',
  './js/i18n.js?v=3.2',
  './js/equations-particle.js?v=3.2',
  './js/equations-mhd-waves.js?v=3.2',
  './js/equations-kinetic-shocks.js?v=3.2',
  './equations.js?v=3.2',
  './js/calculator-core.js?v=3.2',
  './js/calculator-evaluator.js?v=3.2',
  './js/calculator-formatter.js?v=3.2',
  './calculator.js?v=3.2',
  './js/builder-cards-items.js?v=3.2',
  './js/builder-cards-list.js?v=3.2',
  './js/builder-preview.js?v=3.2',
  './js/tab-builder.js?v=3.2',
  './js/tab-lookup.js?v=3.2',
  './js/tab-equations.js?v=3.2',
  './app.js?v=3.2',
  './katex/katex.min.js?v=3.2',
  './katex/katex.min.css?v=3.2',
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
