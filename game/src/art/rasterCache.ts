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
/** relative art paths keep today's key; an absolute art URL (VITE_ART_BASE) drops its "scheme://" */
export const rasterKeyPath = (url: string) => url.replace(/^(?:[a-z][a-z0-9+.-]*:)?\/\//i, '');
const keyOf = (url: string, res: number) => new Request(`/__raster__/${encodeURIComponent(__BUILD_ID__)}/${res}/${rasterKeyPath(url)}`);

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

/**
 * PERF (Parte III): the WebP encode used to run on the main thread right when a cat was rasterized — `toBlob` cost
 * 373 ms of main-thread time while a first session entered the island (40 ms entering a battle), all of it inside the
 * entry's frames. Now the canvas is snapshotted (createImageBitmap: copy-on-write, cheap) and a small worker encodes
 * and stores it, two at a time. Where a worker / OffscreenCanvas can't do it, the old encode runs in idle time, one
 * at a time. Same bytes in the cache either way (WebP 0.92 of the same pixels).
 */
const WORKER_SRC = `self.onmessage = async (e) => {
  const { key, bmp, cache } = e.data;
  let ok = false;
  try {
    const oc = new OffscreenCanvas(bmp.width, bmp.height);
    oc.getContext('2d').drawImage(bmp, 0, 0);
    bmp.close();
    const blob = await oc.convertToBlob({ type: 'image/webp', quality: 0.92 });
    const c = await caches.open(cache);
    await c.put(key, new Response(blob, { headers: { 'content-type': 'image/webp' } }));
    ok = true;
  } catch {
    /* unsupported here: the page encodes it itself */
  }
  self.postMessage({ key, ok });
};`;
interface StoreJob {
  key: Request;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  bmp: ImageBitmap | null;
}
let worker: Worker | null | false = null;
const queue: StoreJob[] = [];
const inFlight = new Map<string, StoreJob>();
const putBlob = (key: Request, blob: Blob | null) => {
  if (!blob) return;
  void caches
    .open(CACHE)
    .then((c) => c.put(key, new Response(blob, { headers: { 'content-type': 'image/webp' } })))
    .catch(() => undefined);
};
/** the old way, in idle time (no worker / OffscreenCanvas): one encode per idle slot */
let idleBusy = false;
const idleQueue: StoreJob[] = [];
function encodeOnPage(job: StoreJob) {
  job.bmp?.close();
  job.bmp = null;
  idleQueue.push(job);
  pumpIdle();
}
function pumpIdle() {
  if (idleBusy || !idleQueue.length) return;
  idleBusy = true;
  const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  const run = () => {
    const job = idleQueue.shift()!;
    const done = () => {
      idleBusy = false;
      pumpIdle();
    };
    try {
      const r = job.canvas;
      if (typeof HTMLCanvasElement !== 'undefined' && r instanceof HTMLCanvasElement)
        r.toBlob((b) => {
          putBlob(job.key, b);
          done();
        }, 'image/webp', 0.92);
      else
        void (r as OffscreenCanvas)
          .convertToBlob({ type: 'image/webp', quality: 0.92 })
          .then((b) => putBlob(job.key, b), () => undefined)
          .finally(done);
    } catch {
      done(); // tainted / unsupported: no cache for this one
    }
  };
  if (ric) ric(run, { timeout: 4000 });
  else setTimeout(run, 50);
}
function getWorker(): Worker | null {
  if (worker !== null) return worker || null;
  try {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || !('convertToBlob' in OffscreenCanvas.prototype)) throw new Error('no worker encode');
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const w = new Worker(url);
    w.onmessage = (e: MessageEvent<{ key: string; ok: boolean }>) => {
      const job = inFlight.get(e.data.key);
      inFlight.delete(e.data.key);
      // the worker couldn't (no 2D OffscreenCanvas / Cache in workers here): this one and every next on the page
      if (!e.data.ok && job) {
        worker = false;
        w.terminate();
        encodeOnPage(job);
        for (const j of inFlight.values()) encodeOnPage(j);
        inFlight.clear();
        while (queue.length) encodeOnPage(queue.shift()!);
        return;
      }
      pump();
    };
    w.onerror = () => {
      worker = false;
      w.terminate();
      for (const j of inFlight.values()) encodeOnPage(j);
      inFlight.clear();
      while (queue.length) encodeOnPage(queue.shift()!);
    };
    worker = w;
  } catch {
    worker = false;
  }
  return worker || null;
}
function pump() {
  const w = getWorker();
  while (queue.length && inFlight.size < 2) {
    const job = queue.shift()!;
    if (!w || !job.bmp) {
      encodeOnPage(job);
      continue;
    }
    inFlight.set(job.key.url, job);
    const bmp = job.bmp;
    job.bmp = null;
    w.postMessage({ key: job.key.url, bmp, cache: CACHE }, [bmp]);
  }
}

/** keep the raster a freshly loaded SVG texture produced (fire and forget) */
export function storeRaster(url: string, res: number, tex: Texture) {
  if (!enabled) return;
  const r = tex.source.resource as unknown;
  const canvas =
    typeof HTMLCanvasElement !== 'undefined' && r instanceof HTMLCanvasElement ? r : typeof OffscreenCanvas !== 'undefined' && r instanceof OffscreenCanvas ? r : null;
  if (!canvas) return;
  const job: StoreJob = { key: keyOf(url, res), canvas, bmp: null };
  if (!getWorker() || typeof createImageBitmap === 'undefined') return encodeOnPage(job);
  // the snapshot is taken now (the pixels as rasterized), the encode happens later, off the main thread
  createImageBitmap(canvas).then(
    (bmp) => {
      job.bmp = bmp;
      queue.push(job);
      pump();
    },
    () => encodeOnPage(job),
  );
}
