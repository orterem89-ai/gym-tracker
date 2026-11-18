const CACHE = 'gym-log-v6';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version is never installed from stale files
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(CORE.map(u => fetch(u, { cache: 'reload' }).then(r => { if (!r.ok) throw new Error(u); return c.put(u, r); }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// the app sends the list of files it loaded, so everything works offline right after the first visit
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'cache') e.waitUntil(caches.open(CACHE).then(c => c.addAll(e.data.urls)).catch(() => {}));
});

const fromCache = req => caches.match(req, { ignoreSearch: true });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // hashed files in /assets/ never change under the same name: cache first
  if (new URL(req.url).pathname.includes('/assets/')) {
    e.respondWith(fromCache(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    })));
    return;
  }
  // everything else (index.html, manifest...): network first, so updates arrive when online; cache when offline or slow
  e.respondWith(Promise.race([
    fetch(req, { cache: 'no-store' }),
    new Promise((_, rej) => setTimeout(rej, 3500))
  ]).then(r => {
    if (!r.ok) throw new Error('bad response');
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r;
  }).catch(() => fromCache(req).then(hit => hit || fromCache('./index.html'))));
});
