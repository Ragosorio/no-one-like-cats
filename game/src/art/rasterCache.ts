/**
 * Persistent raster cache for the cat paintings (browser Cache Storage, never the repo).
 *
 * The art ships as SVG only. Turning one into a texture means rasterizing it on the main thread:
 * ~15–25 ms for a lite cat, far more for a full one — every session, for every cat on screen.
 * The first time a painting is rasterized we keep a lossless-enough WebP of the result; next
 * sessions decode that with createImageBitmap (off the main thread) and skip the SVG raster.
 *
 * Keyed by build id + url + resolution, so a deploy with new art invalidates everything. In dev
 * (`BUILD_ID === 'dev'`) it is off unless `?rastercache=1` (the SVGs change under you while you work).
 * Any failure (no Cache API, quota, private mode) silently falls back to the plain SVG path.
 */
import { ImageSource, Texture } from 'pixi.js';

const CACHE = 'nolc-cat-raster-v1';
const enabled = (() => {
  try {
    if (typeof caches === 'undefined' || typeof createImageBitmap === 'undefined') return false;
    if (__BUILD_ID__ !== 'dev') return true;
    return new URLSearchParams(location.search).has('rastercache');
  } catch {
    return false;
  }
})();
const keyOf = (url: string, res: number) => new Request(`/__raster__/${encodeURIComponent(__BUILD_ID__)}/${res}/${url}`);

let pruned = false;
/** old builds' entries go (once per session, in the background) */
async function prune(c: Cache) {
  if (pruned) return;
  pruned = true;
  const prefix = `/__raster__/${encodeURIComponent(__BUILD_ID__)}/`;
  for (const r of await c.keys()) if (!new URL(r.url).pathname.startsWith(prefix)) void c.delete(r);
}

/** a cached raster as a texture, or null (miss / disabled / error) */
export async function cachedRaster(url: string, res: number): Promise<Texture | null> {
  if (!enabled) return null;
  try {
    const c = await caches.open(CACHE);
    void prune(c);
    const hit = await c.match(keyOf(url, res));
    if (!hit) return null;
    const bmp = await createImageBitmap(await hit.blob());
    return new Texture({ source: new ImageSource({ resource: bmp, resolution: res }) });
  } catch {
    return null;
  }
}

/** keep the raster a freshly loaded SVG texture produced (fire and forget) */
export function storeRaster(url: string, res: number, tex: Texture) {
  if (!enabled) return;
  const put = (blob: Blob | null) => {
    if (!blob) return;
    void caches
      .open(CACHE)
      .then((c) => c.put(keyOf(url, res), new Response(blob, { headers: { 'content-type': 'image/webp' } })))
      .catch(() => undefined);
  };
  const r = tex.source.resource as unknown;
  try {
    if (typeof HTMLCanvasElement !== 'undefined' && r instanceof HTMLCanvasElement) r.toBlob(put, 'image/webp', 0.92);
    else if (typeof OffscreenCanvas !== 'undefined' && r instanceof OffscreenCanvas) void r.convertToBlob({ type: 'image/webp', quality: 0.92 }).then(put, () => undefined);
  } catch {
    /* tainted / unsupported: no cache for this one */
  }
}
