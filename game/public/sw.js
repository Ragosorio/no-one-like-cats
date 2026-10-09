/* NO ONE LIKE CATS — service worker (PWA): instant reloads and offline play once things were seen.
 * Registered as sw.js?v=<build id> (core/pwa.ts): every deploy is a new worker.
 * - navigations: network first (always the newest build), cached copy when offline
 * - /assets/* (Vite hashed bundles + fonts): cache first, in a per-build cache (old builds are dropped)
 * - cats-svg/, story/, icons/: stale-while-revalidate in a cache that survives deploys
 *   (vector art is big and rarely changes; a redrawn cat shows up on the next view)
 * - version.json: never cached (core/updates.ts asks it "is there a newer build?")
 * - remote art (only when the build sets VITE_ART_BASE*, see src/art/artBase.ts and
 *   docs/part-ii/09-hosting-arte.md): core/pwa.ts adds ?art=<absolute bases>&tiers=all|full.
 *   Those URLs (same origin or CORS) get the same stale-while-revalidate art cache, and the copies
 *   kept from the old location are dropped on activate. Without ?art= nothing changes.
 */
const Q = new URL(self.location.href).searchParams;
const BUILD = Q.get('v') || 'local';
/** absolute URL prefixes the cat art is served from ([] = next to the game, the default) */
const ART_BASES = (Q.get('art') || '').split(',').filter(Boolean);
/** which tiers left the game's own folder: 'all' (lite + full + story) or 'full' */
const ART_TIERS = Q.get('tiers') || '';
const isRemoteArt = (href) => ART_BASES.some((b) => href.startsWith(b));
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
      .then(() => self.clients.claim())
      .then(() => pruneArt().catch(() => undefined)),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const remoteArt = isRemoteArt(url.href);
  if (url.origin !== self.location.origin && !remoteArt) return;
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
  if (!remoteArt && url.pathname.includes('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetchAndCache(req, CODE)));
    return;
  }
  if (remoteArt || /\/(cats-svg|story|icons)\//.test(url.pathname) || url.pathname.endsWith('.svg')) {
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

/**
 * Art cache housekeeping (on activate). Drops entries the game no longer asks for:
 * - anything outside this worker's scope that is not a current remote art base (e.g. after a
 *   rollback from VITE_ART_BASE to local art; today's default never stores such entries)
 * - the local copies of the tiers that moved to the art site (?tiers=all|full)
 * Icons and everything else under the scope are never touched.
 */
async function pruneArt() {
  const c = await caches.open(ART);
  const scope = self.registration.scope;
  for (const req of await c.keys()) {
    const href = req.url;
    if (isRemoteArt(href)) continue;
    if (!href.startsWith(scope)) {
      await c.delete(req);
      continue;
    }
    const p = href.slice(scope.length).split('?')[0];
    const moved =
      ART_TIERS === 'all' ? /^(cats-svg\/.+|story\/.+)\.svg$/i.test(p) : ART_TIERS === 'full' ? /^cats-svg\/[^/]+\.svg$/i.test(p) : false;
    if (moved) await c.delete(req);
  }
}
