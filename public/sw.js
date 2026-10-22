// Offline support: the whole game is static, so after the first visit everything is served from cache.
const CACHE = 'dots-and-boxes-v1'
const CORE = ['./', './index.html', './manifest.webmanifest', './favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
// The page sends the URLs it already loaded (hashed JS/CSS) so they are cached on the very first visit.
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'cache') {
    e.waitUntil(caches.open(CACHE).then((c) => Promise.all(e.data.urls.map((u) => c.add(u).catch(() => {})))))
  }
})
self.addEventListener('fetch', (e) => {
  const r = e.request
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return
  if (r.mode === 'navigate') { // pages: network first (gets updates), cache when offline
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return res }).catch(() => caches.match('./index.html')))
    return
  }
  e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)) } return res })))
})
