/* ============================================================
   service-worker.js
   Caches the app shell so Explorar/Calcular keep working offline
   once visited. Three.js (loaded from a CDN) is cached too on
   first successful load; if the network is unavailable on a
   first-ever visit, the CDN script simply won't be cached yet.
   ============================================================ */

const CACHE_NAME = 'geom3d-shell-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './css/components.css',
  './css/responsive.css',
  './js/state.js',
  './js/navigation.js',
  './js/app.js',
  './js/geometry/solids.js',
  './js/geometry/prisms.js',
  './js/geometry/cylinders.js',
  './js/geometry/cones.js',
  './js/geometry/spheres.js',
  './js/geometry/pyramids.js',
  './js/geometry/polyhedra.js',
  './js/geometry/revolution.js',
  './js/calculations/formulas.js',
  './js/calculations/areas.js',
  './js/calculations/volumes.js',
  './js/ui/controls.js',
  './js/ui/panels.js',
  './js/ui/feedback.js',
  './js/ui/development.js',
  './js/experiments/measurement.js',
  './js/experiments/liquid.js',
  './js/experiments/displacement.js',
  './js/experiments/unit-cubes.js',
  './js/activities/predictions.js',
  './js/activities/challenges.js',
  './js/activities/evaluation.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache successful same-origin and CDN responses for offline reuse
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline & not cached: nothing more we can do
    })
  );
});
