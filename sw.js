/* Les Clochers de Paris — service worker
   Principe : le site change souvent, donc on essaie TOUJOURS le réseau d'abord
   et on ne se rabat sur la copie du téléphone que si le réseau échoue.
   Google Maps et les API externes ne sont jamais mises en cache. */
const VERSION = 'v1';
const CACHE = 'clochers-' + VERSION;
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k.indexOf('clochers-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // tout ce qui est externe passe tel quel
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { var copie = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copie); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()); });
    })
  );
});
