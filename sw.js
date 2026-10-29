const CACHE = 'gl-multitienda-v8';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './assets/dashboard-hero.png', './assets/app-resumen.png', './assets/app-inventario.png', './assets/app-vender.png', './assets/app-notas.png', './assets/app-movil.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  let u;
  try { u = new URL(r.url); } catch (_) { return; }
  if (u.origin !== location.origin) return; // Firebase y CDNs siempre van a la red

  // Navegaciones: primero red (para que siempre reciba actualizaciones), caché solo como respaldo offline
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r)
        .then(res => {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(r, cp)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(r).then(m => m || caches.match('./index.html')))
    );
    return;
  }

  // Estáticos: caché primero, red como respaldo
  e.respondWith(
    caches.match(r).then(m => m || fetch(r).then(res => {
      const cp = res.clone();
      caches.open(CACHE).then(c => c.put(r, cp)).catch(() => {});
      return res;
    }))
  );
});
