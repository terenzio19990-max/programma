/* Orbita service worker: fast start, offline, always the newest version, push notifications.
   — app.js?v=… (a new name at every update) comes straight from the cache: opening Orbita no longer
     waits for the 3 MB download;
   — the page itself is asked to the network first, with a short wait: if it's slow or offline the
     saved copy opens at once, and the new one is ready for next time. */
const CACHE = 'orbita-v6';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (req, r) => { if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; };
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Spotify, Supabase, CDN: always network
  /* versioned files never change: cache first (and keep only the latest app.js) */
  if (u.searchParams.has('v') || /\.(png|woff2?)$/.test(u.pathname)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok && /app\.js$/.test(u.pathname)) caches.open(CACHE).then(c => c.keys().then(ks => ks.filter(k => /app\.js/.test(k.url) && k.url !== e.request.url).forEach(k => c.delete(k)))); return put(e.request, r); })));
    return;
  }
  /* the page and the rest: network first, but don't wait more than 2.5 s for it */
  const net = fetch(e.request).then(r => put(e.request, r));
  e.respondWith(new Promise(res => { let done = false; const t = setTimeout(() => caches.match(e.request).then(hit => { if (hit && !done) { done = true; res(hit); } }), 2500);
    net.then(r => { if (!done) { done = true; clearTimeout(t); res(r); } }).catch(() => caches.match(e.request).then(hit => { if (!done) { done = true; clearTimeout(t); res(hit || caches.match('./index.html')); } })); }));
});
/* push from the Orbita server (Supabase): always show it (iOS requires it) */
self.addEventListener('push', e => {
  let m = {}; try { m = e.data ? e.data.json() : {}; } catch (_) { m = { title: 'Orbita', body: e.data ? e.data.text() : '' }; }
  const d = m.data || {}, snooze = !!(d.ev || d.task || d.open);
  e.waitUntil(self.registration.showNotification(m.title || 'Orbita', { body: m.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: m.tag || d.key || 'orbita', renotify: true, data: { ...d, title: m.title }, actions: snooze ? [{ action: 'snooze', title: 'Posticipa 10 min' }, { action: 'open', title: 'Apri' }] : [] }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const data = e.notification.data || null, act = e.action === 'snooze' ? 'snooze' : 'open';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    if (cs.length) { const c = cs[0]; if (data) c.postMessage({ type: act, data }); return c.focus ? c.focus() : null; }
    const q = data ? '?n=' + encodeURIComponent(JSON.stringify({ a: act, d: data })) : '';
    return self.clients.openWindow('./' + q);
  }));
});
