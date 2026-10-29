/**
 * Shared helpers for the post-Parte III universes (UNIVERSOS-D: Michi Atom, Michi de Pegaso, Un Zarpazo, Mazingato Z,
 * Miaunya, Daft Miau, Gemichi, Mr. Miaubody). The base kit is kit.ts; kitA.ts / kitB.ts hold the earlier waves' helpers.
 *
 * Everything here draws COARSE POLYGONS: Pixi pools one batcher per Graphics over ~400 vertices and those pooled buffers
 * grow to the biggest Graphics and never shrink (the 2026-10-28 leak). Keep every single Graphics well under ~25k
 * vertices, above all in card(…, live), which the Catdex draws full-page (≈3300×1000): a stroked curve or a big circle()
 * costs hundreds of vertices, a 10-sided poly() costs 10.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { type SigCtx, CHEER, alive, later } from './kit';
import { destroyTree } from '../../../panels/collection/ui';

/** the painting's box in the reveal (variantSprite at 520 px, centered on (W/2, catY)) */
export const ART = 520;

/** a point of the painting (fx, fy in 0..1 of its square box) → the reveal's screen */
export function onCat(c: SigCtx, fx: number, fy: number): [number, number] {
  return [W / 2 + (fx - 0.5) * ART, c.catY + (fy - 0.5) * ART];
}

/** a regular n-gon / ellipse as points (poly() it: n vertices instead of circle()'s radius-dependent fan) */
export function ngon(x: number, y: number, rx: number, ry = rx, n = 12, rot = 0): number[] {
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    p.push(x + Math.cos(a) * rx, y + Math.sin(a) * ry);
  }
  return p;
}

/** points along an arc (a0 → a1, n segments): for open poly() strokes and wedges */
export function arcPts(x: number, y: number, r: number, a0: number, a1: number, n: number, ry = r): number[] {
  const p: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    p.push(x + Math.cos(a) * r, y + Math.sin(a) * ry);
  }
  return p;
}

/** a band between two radii (a ring sector) as one polygon */
export function bandPts(x: number, y: number, r0: number, r1: number, a0: number, a1: number, n: number): number[] {
  const outer = arcPts(x, y, r1, a0, a1, n);
  const inner = arcPts(x, y, r0, a1, a0, n);
  return [...outer, ...inner];
}

/** a tapered streak from (x0,y0) (half-width w0) to (x1,y1) (half-width w1): 4 points (a meteor, a speed line, a beam) */
export function streak(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number): number[] {
  const d = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / d;
  const ny = (x1 - x0) / d;
  return [x0 + nx * w0, y0 + ny * w0, x1 + nx * w1, y1 + ny * w1, x1 - nx * w1, y1 - ny * w1, x0 - nx * w0, y0 - ny * w0];
}

/** a 4-point star (a twinkle) */
export function twinkle(x: number, y: number, r: number, k = 0.24): number[] {
  const q = r * k;
  return [x, y - r, x + q, y - q, x + r, y, x + q, y + q, x, y + r, x - q, y + q, x - r, y, x - q, y - q];
}

/** a seeded random in [0,1) (mulberry32) */
export function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** a starfield in one Graphics: `n` small squares and a few twinkles (seeded; cheap: 4–8 vertices each) */
export function starfield(g: Graphics, x: number, y: number, w: number, h: number, n: number, seed: number, color = 0xffffff, size = 2.4) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const sx = x + r() * w;
    const sy = y + r() * h;
    const s = size * (0.5 + r() * r() * 1.6);
    if (i % 9 === 0) g.poly(twinkle(sx, sy, s * 2.6)).fill({ color, alpha: 0.95 });
    else g.rect(sx - s / 2, sy - s / 2, s, s).fill({ color, alpha: 0.35 + r() * 0.6 });
  }
  return g;
}

/**
 * a comic speech balloon: rounded (or `jag`ged, a shout) with a tail toward (tx, ty) relative to its center.
 * Returns a Container centered on the balloon.
 */
export function balloon(text: string, o: { size?: number; fill?: number; ink?: number; color?: number; tx?: number; ty?: number; jag?: boolean; font?: string; maxW?: number } = {}) {
  const size = o.size ?? 40;
  const fill = o.fill ?? 0xffffff;
  const ink = o.ink ?? C.ink;
  const k = new Container();
  const t = txt(text, { fontFamily: o.font ?? F.comic, fontSize: size, fill: o.color ?? ink, align: 'center', wordWrap: !!o.maxW, wordWrapWidth: o.maxW ?? 1000, lineHeight: size * 1.05 });
  t.anchor.set(0.5);
  const rx = t.width / 2 + size * 0.9;
  const ry = t.height / 2 + size * 0.55;
  const g = new Graphics();
  const tx = o.tx ?? -rx * 0.4;
  const ty = o.ty ?? ry * 1.7;
  // the tail: a wedge from inside the balloon to (tx, ty)
  const bx = Math.max(-rx * 0.6, Math.min(rx * 0.6, tx * 0.35));
  const by = Math.sign(ty || 1) * ry * 0.6;
  const tail = [bx - size * 0.45, by, bx + size * 0.45, by, tx, ty];
  const shape = o.jag
    ? (() => {
        const p: number[] = [];
        const n = 22;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const rr = i % 2 ? 0.8 : 1.12;
          p.push(Math.cos(a) * rx * rr, Math.sin(a) * ry * rr);
        }
        return p;
      })()
    : ngon(0, 0, rx, ry, 20);
  const lw = Math.max(3, size / 9);
  g.poly(tail).fill(fill).stroke({ width: lw, color: ink, join: 'round' });
  g.poly(shape).fill(fill).stroke({ width: lw, color: ink, join: 'round' });
  // hide the tail's base line inside the balloon
  g.poly(ngon(0, 0, rx - lw, ry - lw, 20)).fill(fill);
  k.addChild(g, t);
  return k;
}

/** a balloon that pops in (scale), holds and fades; returns it */
export function say(c: SigCtx, layer: Container, node: Container, x: number, y: number, hold = 1, rot = 0) {
  node.position.set(x, y);
  node.rotation = rot;
  layer.addChild(node);
  if (!c.reduce) gsap.fromTo(node.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2.5)' });
  gsap.to(node, { alpha: 0, delay: hold, duration: 0.25, onComplete: () => destroyTree(node) });
  return node;
}

/**
 * the little line under the payoff word («…en el capítulo que sigue.»): it lands a beat after cheer(), under it, and
 * leaves with it
 */
export function aside(c: SigCtx, text: string, color: number, o: { dy?: number; size?: number; delay?: number; dur?: number; ink?: number; font?: string } = {}) {
  const delay = o.delay ?? 0.45;
  later(c, delay, () => {
    const t = txt(text, { fontFamily: o.font ?? F.comic, fontSize: o.size ?? 44, fill: color, stroke: { color: o.ink ?? C.ink, width: (o.size ?? 44) / 6, join: 'round' } });
    t.anchor.set(0.5);
    if (t.width > 700) t.scale.set(700 / t.width);
    t.position.set(CHEER[0] + 20, CHEER[1] + (o.dy ?? 100));
    t.rotation = -0.05;
    c.fg.addChild(t);
    if (!c.reduce) gsap.from(t, { alpha: 0, duration: 0.2 });
    gsap.to(t, { alpha: 0, delay: (o.dur ?? 1.9) - delay, duration: 0.3, onComplete: () => destroyTree(t) });
  });
}

/** fn(i) on each of `n` beats at `bpm`, starting at `t0` (while the reveal is open) */
export function beats(c: SigCtx, bpm: number, n: number, fn: (i: number) => void, t0 = 0) {
  const b = 60 / bpm;
  for (let i = 0; i < n; i++) later(c, t0 + i * b, () => fn(i));
}

/** slide a node in from (dx, dy) away, easing; still with Reducir movimiento */
export function slideIn(c: SigCtx, node: Container, dx: number, dy: number, dur = 0.4, delay = 0, ease = 'power3.out') {
  if (c.reduce || c.short) return;
  const x = node.x;
  const y = node.y;
  node.position.set(x + dx, y + dy);
  gsap.to(node, { x, y, duration: dur, delay, ease });
}

/** a layer-safe tween on a plain number: fn(v) each tick while `node` lives (gsap proxies are not killed with the tree) */
export function drive(node: Container, from: number, to: number, dur: number, fn: (v: number) => void, o: { delay?: number; ease?: string } = {}) {
  const p = { v: from };
  return gsap.to(p, { v: to, duration: dur, delay: o.delay ?? 0, ease: o.ease ?? 'power2.out', onUpdate: () => !node.destroyed && fn(p.v) });
}

/** true while the reveal is open and `node` lives */
export const live = (c: SigCtx, node: Container) => alive(c) && !node.destroyed;

export { C, F };

/** an HSV color (h in 0..1, s and v in 0..1) as 0xRRGGBB (light shows, rainbows) */
export function hsv(h: number, s = 1, v = 1) {
  const i = Math.floor(((h % 1) + 1) % 1 * 6);
  const f = (((h % 1) + 1) % 1) * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const [r, g, b] = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ][i % 6];
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}
