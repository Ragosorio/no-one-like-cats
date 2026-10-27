/**
 * THE CROSS without a freeze (docs/part-iii/13 §3.2; QA 2026-10-14): the bar's paintings are rasterized BEFORE we go
 * through the cat flap. Rasterizing a full-detail SVG is main-thread work (100–450 ms per painting the first time in a
 * session; production keeps a raster cache, art/rasterCache.ts, but a first session pays it). Asked here while H66
 * waits on your island (and again when p3_pelo starts), it streams in through the art pipeline's own idle-time queue
 * (art/catArt.ts requestCatSvg: requestIdleCallback, two at a time), so when the bar scene is built only the TV bakes
 * remain — and CajaScene.enter does those one per frame. A tiny module on purpose: the island imports it at boot.
 */
import { Assets, Texture, type Renderer } from 'pixi.js';
import { artSlug, loadCatTexture, onCatArt, requestCatSvg } from '../../art/catArt';
import { game } from '../../core/App';
import type { Studio } from '../../momentos/anime/actor';
import { catRig } from '../../art/puppetCore';
import { G } from '../../state/game';
import { catSlug } from '../../state/sys/forms';
import { CAST, STAND_IN, bakePlain, bakeTv } from '../../momentos/songs/drunck/tv';
import { LUZTERNA_URL } from '../../ui/story/portrait';

/** A1's patron (caja/barCliente.ts): Guijarro, a common cat of this box's roster */
export const PATRON = 'guijarro_pebble_cat';

/** the paintings the bar needs (Canelo as the player has him, the two natives, the patron) */
export function barPaintings(): string[] {
  let can = 'canelo_cozy_cat';
  try {
    const c = G.s?.cats?.find((x) => x.species === 'c_canelo');
    if (c) can = catSlug(c);
  } catch {
    /* no save */
  }
  const cast = (who: keyof typeof CAST) => (catRig(CAST[who]) ? CAST[who] : STAND_IN[who]);
  return [can, cast('espuma'), cast('hipolito'), PATRON];
}

const ric = (fn: () => void, timeout = 2500) => {
  const r = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (r) r(fn, { timeout });
  else setTimeout(fn, 400);
};
/** the raster goes up to the GPU in idle time too (its upload is a burst of its own) */
function uploadSoon(t: Texture) {
  ric(() => {
    try {
      if (!t.destroyed) game.pixi.renderer.texture.initSource(t.source);
    } catch {
      /* no renderer (tests) */
    }
  });
}
let asked = false;
/** ask once per session (idempotent; never blocks: the art queue runs in idle time) */
export function prewarmBar() {
  if (asked) return;
  asked = true;
  for (const s of barPaintings()) {
    const slug = artSlug(s);
    // the lite one first (the Studio waits for it), then the full detail, uploaded when it arrives
    void loadCatTexture(slug).catch(() => undefined);
    requestCatSvg(slug);
    const off = onCatArt(slug, (t) => {
      queueMicrotask(() => off());
      uploadSoon(t);
    });
  }
  // Luzterna's painting (the alley; the Studio loads it at this resolution)
  ric(() => void Assets.load<Texture>({ alias: LUZTERNA_URL, src: LUZTERNA_URL, data: { resolution: 1.5 } }).then((t) => t && uploadSoon(t)).catch(() => undefined));
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
/** the full-detail raster of a painting if it is already in memory (null otherwise) */
function rasterOf(raw: string): Texture | null {
  if (raw === 'luzterna') return (Assets.get(LUZTERNA_URL) as Texture | undefined) ?? null;
  let t: Texture | null = null;
  onCatArt(artSlug(raw), (x) => (t = x))();
  return t;
}
/**
 * Bake the scene's paintings ONE STEP PER FRAME, so no frame carries more than one burst: first the bake programs are
 * compiled on a 1×1 texture, then for each painting its raster goes up to the GPU in one frame and its TV bake runs in
 * the next. What is on screen meanwhile (the cross's living light) keeps moving.
 */
export async function bakeOneByOne(renderer: Renderer, queue: [Studio, string][], alive: () => boolean) {
  prewarmBar();
  for (const bake of [bakeTv, bakePlain]) {
    const w = bake(renderer, Texture.WHITE);
    w.tex.destroy(true);
    w.sil.destroy(true);
    await nextFrame();
    if (!alive()) return;
  }
  for (const [studio, slug] of queue) {
    const r = rasterOf(slug);
    if (r && !r.destroyed) {
      renderer.texture.initSource(r.source);
      await nextFrame();
      if (!alive()) return;
    }
    await studio.load(slug);
    await nextFrame();
    if (!alive()) return;
  }
}
