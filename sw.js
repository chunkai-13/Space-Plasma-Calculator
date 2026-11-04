const CACHE_NAME = 'plasma-calc-v4.3';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=4.3',
  './css/base.css?v=4.3',
  './css/layout.css?v=4.3',
  './css/components.css?v=4.3',
  './css/builder.css?v=4.3',
  './css/builder-cards.css?v=4.3',
  './css/lookup-equations.css?v=4.3',
  './css/modern-ui.css?v=4.3',
  './css/responsive.css?v=4.3',
  './constants.js?v=4.3',
  './js/i18n.js?v=4.3',
  './js/plasma-core.js?v=4.3',
  './js/equations-particle.js?v=4.3',
  './js/equations-mhd-waves.js?v=4.3',
  './js/equations-kinetic-shocks.js?v=4.3',
  './equations.js?v=4.3',
  './js/calculator-core.js?v=4.3',
  './js/calculator-evaluator.js?v=4.3',
  './js/calculator-formatter.js?v=4.3',
  './calculator.js?v=4.3',
  './js/builder-cards-items.js?v=4.3',
  './js/builder-cards-list.js?v=4.3',
  './js/builder-preview.js?v=4.3',
  './js/tab-builder.js?v=4.3',
  './js/tab-lookup.js?v=4.3',
  './js/tab-equations.js?v=4.3',
  './js/app-ui.js?v=4.3',
  './app.js?v=4.3',
  './katex/katex.min.js?v=4.3',
  './katex/katex.min.css?v=4.3',
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

// Network-First (網路優先) 策略：在有網路時一律即時取得最新程式碼並更新快取，斷網時無縫降級至本機快取
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return networkRes;
      })
      .catch(() => caches.match(e.request))
  );
});
