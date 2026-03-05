/* ═══════════════════════════════════════════════════════════════
   sw.js — Service Worker
   • Cache offline di tutti i file dell'app
   • Al rilevamento di una nuova versione notifica la UI
   • Aggiorna APP_VERSION qui ogni volta che fai un rilascio
   ═══════════════════════════════════════════════════════════════ */

const APP_VERSION  = '0.0.7';
const CACHE_NAME   = `presenze-v${APP_VERSION}`;

// ─── FILE DA METTERE IN CACHE ─────────────────────────────────
// Aggiungi qui tutti i file statici della tua app.
// Se usi una CDN (Google Fonts, xlsx.js, ecc.) aggiungi quei URL.
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  // font Google (opzionale — richiede connessione al primo avvio)
  // './js/xlsx.min.js',  // decommentare se presente
];

// ─── INSTALL — pre-cache ──────────────────────────────────────
self.addEventListener('install', event => {
  // skipWaiting: il nuovo SW si attiva subito ma
  // NON sovrascrive i dati — notifica comunque la UI.
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
});

// ─── ACTIVATE — pulizia cache vecchie ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('presenze-') && k !== CACHE_NAME)
          .map(k  => caches.delete(k))
      )
    ).then(() => {
      // Informa tutte le schede aperte che c'è una nuova versione
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: APP_VERSION }));
      });
      return self.clients.claim();
    })
  );
});

// ─── FETCH — cache-first con fallback network ─────────────────
self.addEventListener('fetch', event => {
  // Ignora richieste non-GET e richieste cross-origin (es. Google Fonts live)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Metti in cache solo risposte valide dello stesso origin
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline e non in cache: ritorna index.html come fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});