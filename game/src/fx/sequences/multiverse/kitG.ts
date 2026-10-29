/**
 * Helpers shared by the post-Parte III universes of UNIVERSOS-G («superhéroes y pantalla»: Garritas, Supermichi,
 * Hierro Michi, Capitán Michimérica, Doctor Doomiau, Michi-Wan, Heisenmiau, Miaufalda). The base kit is kit.ts;
 * kitA…kitD hold the earlier waves' helpers (this file imports from them, never edits them).
 *
 * Everything here draws COARSE POLYGONS: Pixi pools one batcher per Graphics over ~400 vertices and those pooled buffers
 * grow to the biggest Graphics and never shrink. Keep every single Graphics well under ~25k vertices — above all in
 * card(…, live), which the Catdex draws full-page (≈3200×950).
 *
 * The payoff's words are built at open() (alpha ≈ 0) and only shown at the payoff: a big stroked Text rasterized
 * mid-shot costs a 100–170 ms frame (UNIVERSOS-D's finding).
 */
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { destroyTree } from '../../../panels/collection/ui';
import { type SigCtx, CHEER, alive, later } from './kit';
import { streak } from './kitD';

export const TAU = Math.PI * 2;

// --- patterns ---------------------------------------------------------------------------------
/**
 * comic halftone: diamond dots (4 vertices each) on a staggered grid over (x, y, w, h); `shade(u, v)` (0..1 across the
 * box) scales each dot. The grid widens itself until it holds at most `max` dots (≤ 4 × max vertices in one fill).
 */
export function halftone(g: Graphics, x: number, y: number, w: number, h: number, gap: number, r: number, color: number, alpha = 1, shade?: (u: number, v: number) => number, max = 3800) {
  // dots under a pixel don't read (a small Catdex card): skip them, they'd only cost vertices
  if (r < 0.9) return g;
  let gp = gap;
  let rr0 = r;
  while ((w / gp) * (h / gp) > max) {
    gp *= 1.15;
    rr0 *= 1.15;
  }
  let row = 0;
  for (let yy = y + gp / 2; yy < y + h; yy += gp * 0.87, row++) {
    const off = row % 2 ? gp / 2 : 0;
    for (let xx = x + gp / 2 + off; xx < x + w; xx += gp) {
      const k = shade ? shade((xx - x) / w, (yy - y) / h) : 1;
      const rr = rr0 * k;
      if (rr < 0.5) continue;
      g.poly([xx, yy - rr, xx + rr, yy, xx, yy + rr, xx - rr, yy]);
    }
  }
  return g.fill({ color, alpha });
}

/** sun rays: `n` wedges out of (x, y) to radius r, each `fill` (0..1) of its slot wide, turned by `rot` (one fill) */
export function sunRays(g: Graphics, x: number, y: number, r: number, n: number, color: number, alpha = 0.2, rot = 0, fill = 0.5) {
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU;
    const a1 = a0 + (TAU / n) * fill;
    g.poly([x, y, x + Math.cos(a0) * r, y + Math.sin(a0) * r, x + Math.cos(a1) * r, y + Math.sin(a1) * r]);
  }
  return g.fill({ color, alpha });
}

/** a ring as one polygon band (outer arc + inner arc back): `n` sides, cheap at any radius */
export function ringPts(x: number, y: number, r0: number, r1: number, n = 32, ry = 1): number[] {
  const p: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    p.push(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * ry);
  }
  for (let i = n; i >= 0; i--) {
    const a = (i / n) * TAU;
    p.push(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * ry);
  }
  return p;
}

// --- moments ----------------------------------------------------------------------------------
/** metal sparks: short hot streaks flying out of (x, y) and falling (a third of them with Reducir movimiento) */
export function sparks(c: SigCtx, layer: Container, x: number, y: number, n = 10, color = 0xffe14d, dist = 170, dur = 0.45, a0 = 0, spread = TAU) {
  const k = c.reduce ? Math.ceil(n / 3) : n;
  for (let i = 0; i < k; i++) {
    const a = a0 - spread / 2 + Math.random() * spread;
    const len = 14 + Math.random() * 22;
    const g = new Graphics().poly(streak(0, 0, -len, 0, 2.6, 0.4)).fill(color).poly(streak(0, 0, -len * 0.5, 0, 1.2, 0.2)).fill(0xffffff);
    g.position.set(x, y);
    g.rotation = a;
    layer.addChild(g);
    const d = dist * (0.5 + Math.random() * 0.7);
    const tx = x + Math.cos(a) * d;
    const ty = y + Math.sin(a) * d;
    if (c.reduce) {
      g.position.set(x + Math.cos(a) * d * 0.4, y + Math.sin(a) * d * 0.4);
      gsap.to(g, { alpha: 0, delay: 0.25, duration: 0.2, onComplete: () => destroyTree(g) });
      continue;
    }
    gsap.to(g, { x: tx, duration: dur, ease: 'power2.out' });
    gsap.to(g, { y: ty + 60, duration: dur, ease: 'power1.in' });
    gsap.to(g, { alpha: 0, delay: dur * 0.55, duration: dur * 0.45, onComplete: () => destroyTree(g) });
  }
}

/** a polygon ring that grows and fades from (x, y) (cheap: one band of `n` sides) */
export function pulse(c: SigCtx, layer: Container, x: number, y: number, color: number, r = 80, to = 5, width = 12, dur = 0.6, ry = 1) {
  const g = new Graphics().poly(ringPts(0, 0, r - width / 2, r + width / 2, 28, ry)).fill(color);
  g.position.set(x, y);
  layer.addChild(g);
  if (c.reduce) {
    gsap.to(g, { alpha: 0, delay: 0.3, duration: 0.2, onComplete: () => destroyTree(g) });
    return g;
  }
  gsap.fromTo(g.scale, { x: 0.3, y: 0.3 }, { x: to, y: to, duration: dur, ease: 'power2.out' });
  gsap.to(g, { alpha: 0, duration: dur, ease: 'power1.in', onComplete: () => destroyTree(g) });
  return g;
}

/** a node that pops in (scale from `from`), holds `hold` s and fades away (built earlier: show it, don't build it) */
export function popShow(c: SigCtx, node: Container, hold = 0.9, from = 2, fade = 0.25) {
  node.alpha = 1;
  if (!c.reduce) gsap.fromTo(node.scale, { x: from * node.scale.x, y: from * node.scale.y }, { x: node.scale.x, y: node.scale.y, duration: 0.16, ease: 'back.out(3)' });
  gsap.to(node, { alpha: 0, delay: hold, duration: fade, onComplete: () => destroyTree(node) });
}

/** build a node now, hidden (alpha ≈ 0, so its texture is made at open() and not mid-shot) */
export function hidden<T extends Container>(layer: Container, node: T, x: number, y: number, rot = 0): T {
  node.position.set(x, y);
  node.rotation = rot;
  node.alpha = 0.001;
  layer.addChild(node);
  return node;
}

/**
 * build something heavy (a title, a stroked word) a little later instead of at open(): `at` seconds into the takeover,
 * or at once on a duplicate; get() builds it right away if it's needed sooner (a skipped reveal reaches the payoff early)
 */
export function lazy<T>(c: SigCtx, at: number, make: () => T): () => T {
  let v: T | undefined;
  const get = () => (v ??= make());
  if (c.short) get();
  else later(c, at, get);
  return get;
}

// --- words ------------------------------------------------------------------------------------
/** a comic narration box (a yellow caption with an ink border and offset shadow); origin at its top-left */
export function caption(text: string, o: { size?: number; fill?: number; ink?: number; color?: number; font?: string; pad?: number } = {}) {
  const size = o.size ?? 34;
  const ink = o.ink ?? C.ink;
  const pad = o.pad ?? size * 0.5;
  const k = new Container();
  const t = txt(text, { fontFamily: o.font ?? F.comic, fontSize: size, fill: o.color ?? ink, letterSpacing: 1, lineHeight: size * 1.1 });
  t.position.set(pad, pad * 0.7);
  const w = t.width + pad * 2;
  const h = t.height + pad * 1.4;
  const g = new Graphics().rect(7, 7, w, h).fill(ink).rect(0, 0, w, h).fill(o.fill ?? 0xffe14d).stroke({ width: 4, color: ink });
  k.addChild(g, t);
  return k;
}

/**
 * the payoff's words, built at open() and shown at the payoff: a main line (an optional soft halo of `glow` behind it)
 * and an optional little aside under it, at the CHEER spot (lower left), fitted to `maxW`.
 * show(dur) pops it in (or eases it in with `slow`), the aside a beat later, and fades it all after `dur`.
 */
export function prepTitle(
  c: SigCtx,
  text: string,
  style: TextStyleOptions,
  o: { aside?: string; asideStyle?: TextStyleOptions; maxW?: number; rot?: number; glow?: number; at?: [number, number] } = {},
) {
  const k = new Container();
  // a big title is ≥100 px: 1.5× is sharp enough and rasterizes a lot faster than the default 2×
  const main = txt(text, { align: 'center', ...style });
  main.resolution = 1.5;
  main.anchor.set(0.5);
  k.addChild(main);
  const fit = Math.min(1, (o.maxW ?? 760) / Math.max(1, main.width));
  main.scale.set(fit);
  let side: Text | null = null;
  let shown = false;
  // the soft halo and the aside come a few frames later (three big rasterizations in one frame is a hitch)
  if (o.glow !== undefined) {
    const glow = o.glow;
    later(c, 0.08, () => {
      if (k.destroyed) return;
      const fs = Number(style.fontSize ?? 100);
      const halo = txt(text, { align: 'center', ...style, fill: glow, stroke: { color: glow, width: fs / 3, join: 'round' }, dropShadow: undefined });
      halo.resolution = 0.5;
      halo.anchor.set(0.5);
      halo.alpha = 0.3;
      halo.scale.set(fit);
      k.addChildAt(halo, 0);
    });
  }
  if (o.aside) {
    const text2 = o.aside;
    later(c, 0.16, () => {
      if (k.destroyed) return;
      side = txt(text2, { fontFamily: F.comic, fontSize: 46, fill: C.paper, letterSpacing: 1, stroke: { color: C.ink, width: 8, join: 'round' }, ...o.asideStyle });
      side.anchor.set(0.5);
      if (side.width > 700) side.scale.set(700 / side.width);
      side.position.set(main.width * 0.08, main.height / 2 + side.height / 2 + 6);
      side.alpha = 0.001;
      k.addChild(side);
      if (shown) gsap.to(side, { alpha: 1, duration: 0.3, delay: c.reduce ? 0.1 : 0.45 });
    });
  }
  const at = o.at ?? CHEER;
  k.position.set(at[0], at[1]);
  k.rotation = o.rot ?? -0.05;
  k.alpha = 0.001;
  c.fg.addChild(k);
  return {
    k,
    main,
    show(dur = 2.6, slow = false) {
      if (shown || k.destroyed || !alive(c)) return;
      shown = true;
      // over everything the takeover left behind
      if (k.parent) k.parent.addChild(k);
      k.alpha = 1;
      if (!c.reduce) {
        if (slow) {
          k.alpha = 0;
          gsap.to(k, { alpha: 1, duration: 0.5, ease: 'power1.out' });
          gsap.fromTo(k.scale, { x: 1.14, y: 1.14 }, { x: 1, y: 1, duration: 1.1, ease: 'power2.out' });
        } else gsap.fromTo(k.scale, { x: 1.7, y: 1.7 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
      }
      if (side) gsap.to(side, { alpha: 1, duration: 0.3, delay: c.reduce ? 0.15 : 0.6 });
      gsap.to(k, { alpha: 0, delay: dur, duration: 0.45, onComplete: () => destroyTree(k) });
    },
  };
}
export type Prepped = ReturnType<typeof prepTitle>;

/**
 * a word with CMYK ghosts (the comic onomatopoeia) built hidden now, shown later with show(): one call to build it at
 * open(), one to slam it at its beat
 */
export function prepWord(c: SigCtx, layer: Container, x: number, y: number, text: string, color: number, size = 110, rot = -0.08, font: string = F.comic) {
  const k = new Container();
  const mk = (fill: number, dx: number, dy: number, alpha = 1) => {
    const t = txt(text, { fontFamily: font, fontSize: size, fill, stroke: { color: C.ink, width: size / 9, join: 'round' }, letterSpacing: 2 });
    t.resolution = alpha < 1 ? 1 : 1.5;
    t.anchor.set(0.5);
    t.position.set(dx, dy);
    t.alpha = alpha;
    return t;
  };
  k.addChild(mk(color, 0, 0));
  // the two CMYK ghosts a frame or two later (three stroked rasterizations in one frame is a hitch)
  ([
    [C.cyan, -6, 3, 0.04],
    [C.pinkHot, 6, -3, 0.08],
  ] as const).forEach(([col, dx, dy, d]) =>
    later(c, d, () => {
      if (k.destroyed) return;
      const g = mk(col, dx, dy, 0.85);
      g.blendMode = 'multiply';
      k.addChildAt(g, 0);
    }),
  );
  hidden(layer, k, x, y, rot);
  return {
    k,
    show(hold = 0.7) {
      if (k.destroyed || !alive(c)) return;
      if (k.parent) k.parent.addChild(k);
      popShow(c, k, hold, 2.3, 0.22);
    },
  };
}

export { C, F };
