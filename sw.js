/* Orbita service worker: offline, always the newest version when online, push notifications. */
const CACHE = 'orbita-v3';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Spotify, Supabase, CDN: always network
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
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
