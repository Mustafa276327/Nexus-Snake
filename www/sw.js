// Nexus Snake - Service Worker for Offline Support

const CACHE_NAME = 'nexus-snake-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/src/main.js',
  '/src/game/config.js',
  '/src/game/state.js',
  '/src/game/engine.js',
  '/src/game/renderer.js',
  '/src/game/input.js',
  '/src/game/storage.js',
  '/src/game/powerups.js',
  '/src/game/obstacles.js',
  '/src/game/modes/classic.js',
  '/src/game/modes/timed.js',
  '/src/game/modes/survival.js',
  '/src/game/modes/maze.js',
  '/src/ui/hud.js',
  '/src/ui/menu.js',
  '/src/ui/settings.js',
  '/src/ui/toast.js'
];

// Install - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;

        return fetch(event.request)
          .then((response) => {
            // Don't cache non-success responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone and cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));

            return response;
          })
          .catch(() => {
            // Offline fallback for HTML
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});