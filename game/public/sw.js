/* NO ONE LIKE CATS — service worker (PWA): instant reloads and offline play once things were seen.
 * - navigations: network first (always the newest build), cached copy when offline
 * - /assets/* (Vite hashed bundles + fonts): cache first (immutable)
 * - cats-svg/, story/, icons/: stale-while-revalidate (vector art, updated in the background)
 * Nothing is precached beyond the shell: the 32 full-detail cats are big, they're cached on first view.
 */
const VERSION = 'nolc-v3';
const SHELL = ['./', './manifest.webmanifest', './icon.svg', './favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }
  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetchAndCache(req)));
    return;
  }
  if (/\/(cats-svg|story|icons)\//.test(url.pathname) || url.pathname.endsWith('.svg')) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetchAndCache(req).catch(() => hit);
        return hit || net;
      }),
    );
  }
});

function fetchAndCache(req) {
  return fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
    }
    return res;
  });
}
