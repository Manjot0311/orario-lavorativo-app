/* ═══════════════════════════════════════════════════════════════
   sw.js — Service Worker
   • La versione viene letta da version.json (unica fonte di verità)
   • Aggiorna SOLO version.json ad ogni rilascio
   ═══════════════════════════════════════════════════════════════ */

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './version.json',
  './assets/icon.svg',
];

// ─── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    fetch('./version.json')
      .then(r => r.json())
      .then(({ version }) => caches.open(`worktime-v${version}`).then(cache => cache.addAll(PRECACHE)))
  );
});

// ─── ACTIVATE — pulizia cache vecchie ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    fetch('./version.json')
      .then(r => r.json())
      .then(({ version }) => {
        const CACHE_NAME = `worktime-v${version}`;
        return caches.keys().then(keys =>
          Promise.all(
            keys
              .filter(k => k.startsWith('worktime-') && k !== CACHE_NAME)
              .map(k => caches.delete(k))
          )
        ).then(() => {
          self.clients.matchAll({ type: 'window' }).then(clients =>
            clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version }))
          );
          return self.clients.claim();
        });
      })
  );
});

// ─── FETCH — cache-first con fallback network ─────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.keys().then(keys => {
            const active = keys.find(k => k.startsWith('worktime-'));
            if (active) caches.open(active).then(cache => cache.put(event.request, clone));
          });
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') return caches.match('./index.html');
      });
    })
  );
});