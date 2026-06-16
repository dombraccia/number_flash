const CACHE_NAME = 'numflash-v2';
const ASSETS = [
  'index.html',
  'styles.css',
  'app.js',
  'data.js',
  'storage.js',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept requests for our own assets (same origin)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});
