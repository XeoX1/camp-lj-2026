/* Service worker du site camp L/J 2026 — permet d'OUVRIR le site HORS-LIGNE
 * (zone blanche à St Gondon) une fois qu'il a été visité au moins une fois.
 * Stratégie : cache d'abord, puis rafraîchissement en arrière-plan quand il y a
 * du réseau (la prochaine ouverture sert la version fraîche).
 * Ne cache que les GET même-origine (index.html chiffré + sw.js) — jamais les
 * appels au backend Apps Script (script.google.com = autre origine).
 * Publié tel quel dans le dépôt : ne contient AUCUNE donnée sensible. */
var CACHE = 'camp-lj-2026-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(['./', './index.html']).catch(function () {});
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   // backend Apps Script etc. : réseau direct
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var refresh = fetch(e.request).then(function (resp) {
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () { return hit; });
      return hit || refresh;
    })
  );
});
