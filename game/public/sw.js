/* NO ONE LIKE CATS — service worker (PWA): instant reloads and offline play once things were seen.
 * Registered as sw.js?v=<build id> (core/pwa.ts): every deploy is a new worker.
 * - navigations: network first (always the newest build), cached copy when offline
 * - /assets/* (Vite hashed bundles + fonts): cache first, in a per-build cache (old builds are dropped)
 * - cats-svg/, story/, icons/: stale-while-revalidate in a cache that survives deploys
 *   (vector art is big and rarely changes; a redrawn cat shows up on the next view)
 * - version.json: never cached (core/updates.ts asks it "is there a newer build?")
 */
const BUILD = new URL(self.location.href).searchParams.get('v') || 'local';
const CODE = `nolc-code-${BUILD}`;
const ART = 'nolc-art';
const SHELL = ['./', './manifest.webmanifest', './icon.svg', './favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CODE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CODE && k !== ART).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CODE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }
  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetchAndCache(req, CODE)));
    return;
  }
  if (/\/(cats-svg|story|icons)\//.test(url.pathname) || url.pathname.endsWith('.svg')) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetchAndCache(req, ART).catch(() => hit);
        return hit || net;
      }),
    );
  }
});

function fetchAndCache(req, name) {
  return fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(name).then((c) => c.put(req, copy));
    }
    return res;
  });
}
