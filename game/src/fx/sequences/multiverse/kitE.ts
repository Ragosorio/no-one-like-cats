/**
 * Helpers for the post-Parte III «anime y píxel» universes (UNIVERSOS-E: Gatojo, Michimpostor, Gomitas D. Michi,
 * Kagebunyan, Miaang, Ryumiau, Yugi Miauto, Ssssmichi, Zoomic). The base kit is kit.ts; kitC/kitD hold the other post
 * waves' helpers (polygon shapes, balloons, the payoff flag `pay`/`beat`), which these universes import directly.
 *
 * Same rules as kitD: everything is COARSE POLYGONS (Pixi pools one batcher per Graphics over ~400 vertices and the pool
 * never shrinks; keep every Graphics well under ~25k vertices, above all in card(…, live) at the Catdex's full page), and
 * big texts are built at open() with alpha ≈ 0 and only shown later (a big stroked Text rasterized mid-shot costs a
 * 100–170 ms frame). This file adds:
 * - `prep`/`show`: prepared texts and onomatopoeias (the three CMYK copies of kit's word(), built ahead);
 * - `prepHead`/`showHead`: the payoff's big line + its small aside, prepared at open();
 * - `glyphGo`: the manga ゴ drawn as polygons (no font: a kana subset loading late would fall back to a system font);
 * - `rays`: focus lines as thin wedges; `diamonds`: screentone as a few hundred 4-point dots;
 * - `copyOf`: the cat's own painting as a still copy (clones, twins, a blinking overlay), optionally a silhouette.
 */
import { Container, Graphics, type Text, type TextStyleOptions } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { destroyTree } from '../../../panels/collection/ui';
import { variantSprite } from '../../../panels/collection/art';
import { SilhouetteFilter } from '../../filters';
import { type SigCtx, CHEER } from './kit';
import { rnd, streak } from './kitD';

export const TAU = Math.PI * 2;

// --- prepared words ---------------------------------------------------------------------------
/** a Text built now (anchor centered, alpha ≈ 0) on `layer` at (x, y): show it later with show() */
export function prep(layer: Container, text: string, style: TextStyleOptions, x: number, y: number, rot = 0, maxW = 0): Text {
  const t = txt(text, { align: 'center', ...style });
  t.anchor.set(0.5);
  t.position.set(x, y);
  t.rotation = rot;
  if (maxW && t.width > maxW) t.scale.set(maxW / t.width);
  t.alpha = 0.001;
  layer.addChild(t);
  return t;
}

/**
 * a comic onomatopoeia built now: kit's word() look (a cyan and a pink ghost under the colored word, ink outline), alpha
 * ≈ 0 until show()
 */
export function prepWord(layer: Container, x: number, y: number, text: string, color: number, size = 110, rot = -0.08, font: string = F.comic) {
  const k = new Container();
  const mk = (fill: number, dx: number, dy: number, alpha = 1) => {
    const t = txt(text, { fontFamily: font, fontSize: size, fill, stroke: { color: C.ink, width: size / 9, join: 'round' }, letterSpacing: 2 });
    t.anchor.set(0.5);
    t.position.set(dx, dy);
    t.alpha = alpha;
    return t;
  };
  const a = mk(C.cyan, -6, 3, 0.85);
  const b = mk(C.pinkHot, 6, -3, 0.85);
  a.blendMode = 'multiply';
  b.blendMode = 'multiply';
  k.addChild(a, b, mk(color, 0, 0));
  k.position.set(x, y);
  k.rotation = rot;
  k.alpha = 0.001;
  layer.addChild(k);
  return k;
}

/**
 * show a prepared node: it slams in (scale ×`from` → its own scale), holds `hold` seconds, fades and is destroyed.
 * `hold` < 0 keeps it.
 */
export function show(c: SigCtx, node: Container, hold = 0.8, o: { from?: number; dur?: number; fade?: number; ease?: string; drift?: number } = {}) {
  if (node.destroyed) return node;
  node.alpha = 1;
  const sx = node.scale.x;
  const sy = node.scale.y;
  if (!c.reduce) {
    const f = o.from ?? 2.2;
    gsap.fromTo(node.scale, { x: sx * f, y: sy * f }, { x: sx, y: sy, duration: o.dur ?? 0.16, ease: o.ease ?? 'back.out(3)' });
    if (o.drift) gsap.to(node, { y: node.y - o.drift, duration: hold + 0.3, ease: 'power1.out' });
  }
  if (hold >= 0) gsap.to(node, { alpha: 0, delay: hold, duration: o.fade ?? 0.25, onComplete: () => destroyTree(node) });
  return node;
}

// --- the payoff's words -----------------------------------------------------------------------
export interface Head {
  k: Container;
  main: Text;
  aside: Text | null;
}

/**
 * the payoff's big line (+ an optional soft halo of `glow`) and its small aside under it, built at open() and hidden:
 * showHead() at the payoff. Lands at the CHEER spot (lower left), fitted to `maxW`.
 */
export function prepHead(
  c: SigCtx,
  text: string,
  style: TextStyleOptions,
  o: { aside?: string; asideStyle?: TextStyleOptions; maxW?: number; rot?: number; at?: [number, number]; glow?: number } = {},
): Head {
  const k = new Container();
  const main = txt(text, { align: 'center', ...style });
  main.anchor.set(0.5);
  const fit = Math.min(1, (o.maxW ?? 760) / Math.max(1, main.width));
  if (o.glow !== undefined) {
    const fs = Number(style.fontSize ?? 100);
    const halo = txt(text, { align: 'center', ...style, fill: o.glow, stroke: { color: o.glow, width: fs / 3, join: 'round' } });
    halo.anchor.set(0.5);
    halo.alpha = 0.32;
    halo.scale.set(fit);
    k.addChild(halo);
  }
  main.scale.set(fit);
  k.addChild(main);
  let aside: Text | null = null;
  if (o.aside) {
    aside = txt(o.aside, { fontFamily: F.comic, fontSize: 46, fill: C.paper, letterSpacing: 1, stroke: { color: C.ink, width: 8, join: 'round' }, ...o.asideStyle });
    aside.anchor.set(0.5);
    if (aside.width > 680) aside.scale.set(680 / aside.width);
    aside.position.set(main.width * 0.1, main.height / 2 + aside.height / 2 + 4);
    aside.alpha = 0;
    k.addChild(aside);
  }
  const at = o.at ?? CHEER;
  k.position.set(at[0], at[1]);
  k.rotation = o.rot ?? -0.05;
  k.alpha = 0;
  k.visible = false;
  c.fg.addChild(k);
  return { k, main, aside };
}

/** the prepared payoff line lands (scale-in, or a slow swell), its aside a beat later; all fade after `dur` */
export function showHead(c: SigCtx, h: Head | undefined, o: { dur?: number; slow?: boolean; asideDelay?: number } = {}) {
  if (!h || h.k.destroyed) return;
  const k = h.k;
  k.visible = true;
  k.alpha = 1;
  if (!c.reduce) {
    if (o.slow) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.5, ease: 'power1.out' });
      gsap.fromTo(k.scale, { x: 1.12, y: 1.12 }, { x: 1, y: 1, duration: 1.1, ease: 'power2.out' });
    } else gsap.fromTo(k.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
  }
  if (h.aside) gsap.to(h.aside, { alpha: 1, duration: 0.3, delay: c.reduce ? 0.2 : (o.asideDelay ?? 0.6) });
  gsap.to(k, { alpha: 0, delay: o.dur ?? 2.4, duration: 0.45, onComplete: () => destroyTree(k) });
}

// --- shapes -----------------------------------------------------------------------------------
/**
 * the manga ゴ (a menacing rumble): the コ stroke and the two dakuten ticks as polygons, italic, with an ink extrusion.
 * (x, y) = its center; `s` = its height in px.
 */
export function glyphGo(g: Graphics, x: number, y: number, s: number, rot: number, fill: number, ink: number = C.ink, depth = 0.07) {
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  // unit box (0..1) → italic → centered → rotated → placed
  const P = (pts: number[], dx = 0, dy = 0) => {
    const o: number[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      const u = pts[i] + (1 - pts[i + 1]) * 0.2 - 0.55;
      const v = pts[i + 1] - 0.5;
      const px = u * s + dx;
      const py = v * s + dy;
      o.push(x + px * cs - py * sn, y + px * sn + py * cs);
    }
    return o;
  };
  const ko = [0.04, 0.14, 0.86, 0.14, 0.86, 0.94, 0.04, 0.94, 0.04, 0.73, 0.64, 0.73, 0.64, 0.35, 0.04, 0.35];
  const d1 = streak(0.8, -0.16, 0.88, 0.05, 0.055, 0.05);
  const d2 = streak(0.97, -0.2, 1.05, 0.01, 0.055, 0.05);
  const e = depth * s;
  for (const p of [ko, d1, d2]) g.poly(P(p, e, e)).fill(ink);
  const sw = Math.max(2, s * 0.045);
  for (const p of [ko, d1, d2]) g.poly(P(p)).fill(fill).stroke({ width: sw, color: ink, join: 'miter' });
  return g;
}

/** focus lines: `n` thin wedges pointing at (cx, cy), from radius r0 (their tips) out to r1 (seeded widths) */
export function rays(g: Graphics, cx: number, cy: number, n: number, r0: number, r1: number, w: number, color: number, alpha = 1, seed = 1) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (r() - 0.5) * (TAU / n) * 0.8;
    const ww = w * (0.4 + r() * 1.1);
    const a0 = r0 * (0.85 + r() * 0.4);
    const x0 = cx + Math.cos(a) * a0;
    const y0 = cy + Math.sin(a) * a0;
    const x1 = cx + Math.cos(a) * r1;
    const y1 = cy + Math.sin(a) * r1;
    g.poly(streak(x0, y0, x1, y1, 0.3, ww));
  }
  return g.fill({ color, alpha });
}

/**
 * screentone: rows of 4-point dots over (x, y, w, h), every `step` px, their radius going from r0 (top) to r1 (bottom)
 * (one fill; ~(w/step)·(h/step) dots — keep step generous)
 */
export function diamonds(g: Graphics, x: number, y: number, w: number, h: number, step: number, r0: number, r1: number, color: number, alpha = 1) {
  let row = 0;
  for (let yy = y; yy <= y + h; yy += step, row++) {
    const r = r0 + ((r1 - r0) * (yy - y)) / Math.max(1, h);
    if (r < 0.6) continue;
    for (let xx = x + (row % 2 ? step / 2 : 0); xx <= x + w; xx += step) g.poly([xx, yy - r, xx + r, yy, xx, yy + r, xx - r, yy]);
  }
  return g.fill({ color, alpha });
}

/** a rounded rectangle as a polygon (corners of `n` segments): cheap at any size */
export function rrect(x: number, y: number, w: number, h: number, r: number, n = 3): number[] {
  const p: number[] = [];
  const rr = Math.min(r, w / 2, h / 2);
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      p.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
  };
  corner(x + w - rr, y + rr, -Math.PI / 2);
  corner(x + w - rr, y + h - rr, 0);
  corner(x + rr, y + h - rr, Math.PI / 2);
  corner(x + rr, y + rr, Math.PI);
  return p;
}

/** a spiral as an open polyline (r from r0 to r1 over `turns`), for poly(…, false).stroke() or thick bands */
export function spiralPts(cx: number, cy: number, r0: number, r1: number, turns: number, n: number, a0 = 0, ry = 1): number[] {
  const p: number[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const a = a0 + k * turns * TAU;
    const r = r0 + (r1 - r0) * k;
    p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r * ry);
  }
  return p;
}

/** a thick open line (polyline `pts`, half-width w0 → w1 along it) as ONE polygon: a band, a tail, a stretchy arm */
export function band(pts: number[], w0: number, w1 = w0): number[] {
  const n = pts.length / 2;
  const L: number[] = [];
  const R: number[] = [];
  for (let i = 0; i < n; i++) {
    const j0 = Math.max(0, i - 1);
    const j1 = Math.min(n - 1, i + 1);
    const dx = pts[j1 * 2] - pts[j0 * 2];
    const dy = pts[j1 * 2 + 1] - pts[j0 * 2 + 1];
    const d = Math.hypot(dx, dy) || 1;
    const w = w0 + ((w1 - w0) * i) / Math.max(1, n - 1);
    const nx = (-dy / d) * w;
    const ny = (dx / d) * w;
    L.push(pts[i * 2] + nx, pts[i * 2 + 1] + ny);
    R.unshift(pts[i * 2] - nx, pts[i * 2 + 1] - ny);
  }
  return [...L, ...R];
}

/** an anime cumulus (stacked puffs over a shaded base; polygons, ~120 vertices) centered at (x, y), `s` = its size */
export function cumulus(g: Graphics, x: number, y: number, s: number, shade = 0xbad8f2, top = 0xffffff) {
  const puffs: [number, number, number][] = [
    [-0.5, 0.05, 0.32],
    [-0.18, -0.18, 0.42],
    [0.22, -0.26, 0.48],
    [0.58, -0.04, 0.34],
    [0.05, 0.08, 0.4],
  ];
  for (const [px, py, pr] of puffs) g.poly(ngonE(x + px * s, y + py * s + s * 0.08, pr * s, pr * s * 0.9, 14)).fill(shade);
  for (const [px, py, pr] of puffs) g.poly(ngonE(x + px * s, y + py * s, pr * s, pr * s * 0.9, 14)).fill(top);
  g.rect(x - s * 0.85, y + s * 0.12, s * 1.6, s * 0.28).fill(shade);
  return g;
}
function ngonE(x: number, y: number, rx: number, ry: number, n: number): number[] {
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    p.push(x + Math.cos(a) * rx, y + Math.sin(a) * ry);
  }
  return p;
}

/** a seagull: a flat «m» of two wing arcs (one polygon), centered at (x, y), wingspan 2·s, `flap` −1..1 */
export function gull(g: Graphics, x: number, y: number, s: number, flap: number, color: number = C.ink) {
  const f = flap * 0.35 * s;
  g.poly([x - s, y - f, x - s * 0.5, y - s * 0.32 - f * 0.5, x, y, x + s * 0.5, y - s * 0.32 - f * 0.5, x + s, y - f, x + s * 0.5, y - s * 0.18 - f * 0.5, x, y + s * 0.14, x - s * 0.5, y - s * 0.18 - f * 0.5]).fill(color);
  return g;
}

// --- the painting -----------------------------------------------------------------------------
/**
 * the cat's own painting as a still copy (`size` px box, centered on its origin): clones, twins, a blinking overlay.
 * `sil` 0..1 = how much of an ink silhouette it is (the filter's mix), or null for none.
 */
export function copyOf(species: string, size: number, sil: number | null = null, color: number = C.ink) {
  let root: Container;
  try {
    root = variantSprite(species, size, { live: false }).root;
  } catch {
    root = new Container();
  }
  let f: SilhouetteFilter | null = null;
  if (sil !== null) {
    f = new SilhouetteFilter(color, sil);
    root.filters = [f];
  }
  return { root, sil: f };
}

export { C, F };
