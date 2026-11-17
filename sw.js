/* Diario Giappone: tiene l'app disponibile anche senza rete */
const V = 'diario-v2';
const SHELL = ['./', 'index.html', 'data.json', 'japan.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;600;700&family=Patrick+Hand+SC&family=Unbounded:wght@800&display=swap';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(SHELL);
    try { // font: il foglio di stile e i file che richiama
      const r = await fetch(FONT_CSS);
      if (r.ok) {
        const css = await r.clone().text();
        await c.put(FONT_CSS, r);
        const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
        await Promise.all(urls.map(u => fetch(u).then(x => x.ok && c.put(u, x)).catch(() => {})));
      }
    } catch (_) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname === 'api.github.com') return;
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (font) { // prima la copia salvata
    e.respondWith(caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req).then(r => {
      const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  // pagine e dati: prima la rete, se non c'è la copia salvata
  e.respondWith((async () => {
    try {
      const r = await fetch(req);
      if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req.mode === 'navigate' ? 'index.html' : (url.search ? url.origin + url.pathname : req), cp)); }
      return r;
    } catch (_) {
      const c = await caches.open(V);
      return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await c.match('index.html') : Response.error());
    }
  })());
});
