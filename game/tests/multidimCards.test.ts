/**
 * Parte III · the MULTIDIMENSIONAL cards of the Catdex (panels/collection/multidimCard.ts, 2026-10-28 «que se note como
 * tarjetas únicas»): every Multidimensional resolves to a card skin — its universe's own card art (Signature.card) or the
 * generic tunnel of boxes — every other rarity to none; the art builds at the grid's and the detail's sizes; a live card
 * stops animating the moment it is destroyed.
 */
import { describe, expect, it, vi } from 'vitest';
import { Container, Texture, Ticker } from 'pixi.js';

// the halftone tile is baked on a <canvas>: node has none (the art around it is plain Graphics)
vi.mock(import('../src/art/textures'), async (orig) => ({ ...(await orig()), halftoneTexture: () => Texture.WHITE }));

const ESP = (await import('../src/data/gateras/especies.json')).default as { cats: { id: string; rarity: string }[] };
const { SIGNATURES } = await import('../src/fx/sequences/multiverse');
const { cardSkin, boxTunnel, isMultidimSpecies } = await import('../src/panels/collection/multidimCard');
const { liveLoop } = await import('../src/panels/collection/cardArt');
const { settings } = await import('../src/core/settings');
const { CATS } = await import('../src/data/content');

const multi = ESP.cats.filter((c) => c.rarity === 'multidimensional').map((c) => c.id);
/** a universe whose card art needs a browser (a canvas, the window) can't be built here: that alone is not a failure */
const needsDom = (e: unknown) => /document|window|HTMLCanvas|OffscreenCanvas|navigator/.test(String((e as Error)?.message ?? e));
const nodes = (c: Container): number => 1 + c.children.reduce((n, ch) => n + nodes(ch as Container), 0);

describe('every Multidimensional card is special', () => {
  it('every Multidimensional resolves to a skin (its universe or the generic one); no other rarity does', () => {
    expect(multi.length).toBeGreaterThanOrEqual(25);
    for (const id of multi) {
      expect(isMultidimSpecies(id), id).toBe(true);
      const s = cardSkin(id);
      expect(s, id).not.toBeNull();
      expect(typeof s!.frame, id).toBe('number');
      expect(s!.tag.length, id).toBeGreaterThan(4);
      expect(s!.tag, id).toBe(s!.tag.toUpperCase());
      expect(s!.own, id).toBe(!!SIGNATURES[id]?.card);
      if (SIGNATURES[id]) expect(s!.frame, id).toBe(SIGNATURES[id].frame);
    }
    for (const c of CATS.filter((x) => x.rarity !== 'multidimensional').slice(0, 40)) expect(cardSkin(c.id), c.id).toBeNull();
  });

  it('the 9 first universes draw their own card', () => {
    for (const id of ['x_homiau', 'x_gatarana', 'x_murciegato', 'x_supersiames', 'x_harrygatter', 'x_gatomalo', 'x_tailorswift', 'x_billiebigotish', 'x_vangato']) expect(typeof SIGNATURES[id]?.card, id).toBe('function');
  });

  it("each universe's card art builds still at the grid's, the big card's and the page's sizes", () => {
    for (const [id, sig] of Object.entries(SIGNATURES)) {
      if (!sig.card) continue;
      for (const [w, h] of [
        [134, 124],
        [356, 345],
        [3184, 950],
      ]) {
        let k: Container;
        try {
          k = sig.card(w, h, false);
        } catch (e) {
          if (needsDom(e)) continue;
          throw new Error(`${id} card(${w}, ${h}) failed: ${String(e)}`);
        }
        expect(k, id).toBeInstanceOf(Container);
        expect(nodes(k), `${id} ${w}×${h}`).toBeGreaterThan(1);
        k.destroy({ children: true });
      }
    }
  });

  it('the generic universe builds for any species, still', () => {
    for (const id of multi) {
      const k = boxTunnel(id, 0xff2e88, 134, 124, false);
      expect(k.children.length, id).toBeGreaterThan(2);
      k.destroy({ children: true });
    }
  });
});

describe('a live card cleans up after itself', () => {
  it('liveLoop draws a first frame and leaves the ticker when its node is destroyed', () => {
    const g = globalThis as { requestAnimationFrame?: unknown; cancelAnimationFrame?: unknown };
    const raf = g.requestAnimationFrame;
    const caf = g.cancelAnimationFrame;
    g.requestAnimationFrame = () => 0;
    g.cancelAnimationFrame = () => undefined;
    try {
      settings.reduceMotion = false;
      const before = Ticker.shared.count;
      const k = new Container();
      const fn = vi.fn();
      liveLoop(k, fn);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(Ticker.shared.count).toBe(before + 1);
      k.destroy();
      expect(Ticker.shared.count).toBe(before);
      // Reducir movimiento: one still frame, no ticker at all
      settings.reduceMotion = true;
      const k2 = new Container();
      const fn2 = vi.fn();
      liveLoop(k2, fn2);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(Ticker.shared.count).toBe(before);
      k2.destroy();
    } finally {
      settings.reduceMotion = false;
      g.requestAnimationFrame = raf;
      g.cancelAnimationFrame = caf;
    }
  });
});
