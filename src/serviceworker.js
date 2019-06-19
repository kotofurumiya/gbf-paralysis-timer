const CACHE_KEY = 'GbfParalysisTimer-Cache-v1';

self.addEventListener('install', (event) => {
  const urlsToCache = [
      './',
      'index.html',
      'style.css',
      'config.js',
      'modules.js',
      'main.js',
      'favicon.png',
      'img/paralysis.svg'
  ];

  event.waitUntil(
      caches.open(CACHE_KEY)
          .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
      caches.match(event.request)
          .then((response) => {
            if(response) {
              return response
            }

            return fetch(event.request);
          })
  );
});