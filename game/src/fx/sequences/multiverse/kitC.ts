/**
 * Helpers shared by the post-Parte III reference universes of UNIVERSOS-C (Ahabigotes, Frankengato, Gatoñeta, Gatote,
 * Gatula, Pinomichi, Sherlock, el Michito del Barril, Gatoleone). The base kit is kit.ts; kitA/kitB hold the first two
 * waves' helpers. This file adds:
 * - coarse polygon shapes: Pixi tessellates circle()/ellipse()/arc() by radius, and every Graphics over 400 vertices
 *   keeps a pooled batcher that grows and never shrinks, so the big scenes (and the full-page Catdex cards) draw their
 *   round things as polygons with a fixed number of sides;
 * - engraving line shading (horizontal rules, thick to thin) for the book-plate universes;
 * - a comic speech balloon and a payoff headline with an aside;
 * - a «the payoff landed» flag: a skipped reveal plays its timeline ×6, so the payoff can arrive while the takeover's own
 *   beats (a cape that blacks out the screen, a string that gets cut) are still pending — `beat()` drops them.
 */
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { destroyTree } from '../../../panels/collection/ui';
import { type SigCtx, CHEER, alive, later } from './kit';

export const TAU = Math.PI * 2;

// --- shapes -----------------------------------------------------------------------------------
/** an ellipse as a polygon with `n` sides (a circle when ry is omitted) */
export function ell(x: number, y: number, rx: number, ry = rx, n = 24, a0 = 0): number[] {
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU;
    p.push(x + Math.cos(a) * rx, y + Math.sin(a) * ry);
  }
  return p;
}

/** the points of an elliptic arc from a0 to a1 (both ends included) */
export function arcPts(x: number, y: number, rx: number, ry: number, a0: number, a1: number, n: number): number[] {
  const p: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    p.push(x + Math.cos(a) * rx, y + Math.sin(a) * ry);
  }
  return p;
}

/** a smooth curve through `pts` (Catmull-Rom, `seg` points per span), closed by default: organic outlines as polygons */
export function smooth(pts: number[], seg = 6, closed = true): number[] {
  const n = pts.length / 2;
  const out: number[] = [];
  const P = (i: number) => {
    const j = closed ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i));
    return [pts[j * 2], pts[j * 2 + 1]];
  };
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const [x0, y0] = P(i - 1);
    const [x1, y1] = P(i);
    const [x2, y2] = P(i + 1);
    const [x3, y3] = P(i + 2);
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(
        0.5 * (2 * x1 + (-x0 + x2) * t + (2 * x0 - 5 * x1 + 4 * x2 - x3) * t2 + (-x0 + 3 * x1 - 3 * x2 + x3) * t3),
        0.5 * (2 * y1 + (-y0 + y2) * t + (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 + (-y0 + 3 * y1 - 3 * y2 + y3) * t3),
      );
    }
  }
  if (!closed) out.push(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1]);
  return out;
}

/** a soft glow: concentric polygon discs (the same few vertices at any size) */
export function glowDisc(r: number, color: number, alpha = 0.5, steps = 7, n = 28, g = new Graphics()) {
  for (let i = steps; i >= 1; i--) g.poly(ell(0, 0, (r * i) / steps, (r * i) / steps, n)).fill({ color, alpha: alpha / steps });
  return g;
}

/** a band whose top edge is a wave (amplitude `amp`, wavelength `len`, phase `ph`), filled down to `bottom` */
export function wavePts(x0: number, x1: number, y: number, amp: number, len: number, ph: number, bottom: number, step = len / 8): number[] {
  const p: number[] = [x0, bottom];
  for (let x = x0; x <= x1 + step; x += step) p.push(x, y + Math.sin((x / len) * TAU + ph) * amp);
  p.push(x1 + step, bottom);
  return p;
}

/**
 * engraving line shading: horizontal rules across (x, y, w, h) every `gap`, their thickness going from `w0` at the top
 * to `w1` at the bottom (a book-plate sky). One fill for all the rules.
 */
export function engrave(g: Graphics, x: number, y: number, w: number, h: number, gap: number, w0: number, w1: number, color: number, alpha = 1) {
  for (let yy = y; yy < y + h; yy += gap) {
    const t = w0 + ((w1 - w0) * (yy - y)) / h;
    if (t > 0.25) g.rect(x, yy - t / 2, w, t);
  }
  return g.fill({ color, alpha });
}

/** a soft bank of fog: overlapping flat ellipses along y (polygons; `r` is a seeded random) */
export function fogBank(g: Graphics, x0: number, w: number, y: number, h: number, color: number, alpha: number, r: () => number, n = 10) {
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + r() * 0.6) * (w / n);
    const rx = (w / n) * (0.9 + r() * 0.8);
    const ry = h * (0.5 + r() * 0.5);
    g.poly(ell(x, y + (r() - 0.5) * h * 0.5, rx, ry, 18)).fill({ color, alpha });
  }
  return g;
}

/** a five-pad paw print (polygons), centered at (x, y), `s` = pad scale, turned by `rot` */
export function pawPrint(g: Graphics, x: number, y: number, s: number, rot: number, color: number, alpha = 1) {
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  const at = (dx: number, dy: number): [number, number] => [x + dx * cs - dy * sn, y + dx * sn + dy * cs];
  const [px, py] = at(0, 4 * s);
  g.poly(ell(px, py, 9 * s, 7.5 * s, 10, rot)).fill({ color, alpha });
  for (const [dx, dy] of [
    [-10, -6],
    [-4, -12],
    [4, -12],
    [10, -6],
  ]) {
    const [tx, ty] = at(dx * s, dy * s);
    g.poly(ell(tx, ty, 3.4 * s, 4.2 * s, 8, rot)).fill({ color, alpha });
  }
  return g;
}

// --- the payoff flag --------------------------------------------------------------------------
const PAID = new WeakSet<Container>();
/** the payoff landed (call it first thing in payoff()) */
export const pay = (c: SigCtx) => PAID.add(c.root);
export const paid = (c: SigCtx) => PAID.has(c.root);
/** a takeover beat: fn after `s` seconds, unless the reveal closed or the payoff already landed (a skipped reveal) */
export function beat(c: SigCtx, s: number, fn: () => void) {
  later(c, s, () => !paid(c) && fn());
}

/**
 * Borrow the cat's pose for the takeover (x, y, rotation, alpha — never its scale: the reveal squashes it) and give it
 * back exactly as it was; give() runs at the end of the takeover and again at the payoff.
 */
export function borrowPose(c: SigCtx) {
  const cat = c.cat;
  const x0 = cat.x;
  const y0 = cat.y;
  const r0 = cat.rotation;
  const a0 = cat.alpha;
  let given = false;
  return {
    x0,
    y0,
    get given() {
      return given || cat.destroyed || !alive(c);
    },
    give() {
      if (given) return;
      given = true;
      if (cat.destroyed) return;
      cat.position.set(x0, y0);
      cat.rotation = r0;
      cat.alpha = a0;
    },
  };
}

// --- words ------------------------------------------------------------------------------------
/** a comic speech balloon (origin at its center) with its tail pointing down-left or down-right */
export function bubble(text: string, o: { size?: number; fill?: number; ink?: number; color?: number; tail?: 'left' | 'right'; font?: string } = {}) {
  const size = o.size ?? 44;
  const ink = o.ink ?? C.ink;
  const fill = o.fill ?? C.paper;
  const k = new Container();
  const t = txt(text, { fontFamily: o.font ?? F.comic, fontSize: size, fill: o.color ?? C.ink, align: 'center', letterSpacing: 1 });
  t.anchor.set(0.5);
  const w = t.width + size * 1.3;
  const h = t.height + size * 0.8;
  const side = (o.tail ?? 'left') === 'left' ? -1 : 1;
  const tx = side * w * 0.22;
  const tail = [tx - size * 0.4, h * 0.36, tx + size * 0.3, h * 0.4, tx + side * size * 1.2, h / 2 + size * 1.0];
  const body = ell(0, 0, w / 2, h / 2, 36);
  const sw = Math.max(3, size / 9);
  const g = new Graphics();
  g.poly(body).stroke({ width: sw * 2, color: ink, join: 'round' });
  g.poly(tail).stroke({ width: sw * 2, color: ink, join: 'round' });
  g.poly(body).fill(fill);
  g.poly(tail).fill(fill);
  k.addChild(g, t);
  return k;
}

/** a balloon that pops in at (x, y) on `layer`, holds and goes */
export function say(c: SigCtx, layer: Container, x: number, y: number, text: string, hold = 1.1, o: Parameters<typeof bubble>[1] = {}) {
  const b = bubble(text, o);
  b.position.set(x, y);
  b.rotation = (o.tail === 'right' ? 1 : -1) * 0.03;
  layer.addChild(b);
  if (!c.reduce) gsap.fromTo(b.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.22, ease: 'back.out(2.6)' });
  gsap.to(b, { alpha: 0, delay: hold, duration: 0.25, onComplete: () => destroyTree(b) });
  return b;
}

/**
 * the payoff's words at the CHEER spot (lower left): a main line that scales in (an optional soft halo of `glow` behind
 * it) and an optional aside under it that fades in after. Fits `maxW`. Fades out after `dur`.
 */
export function headline(
  c: SigCtx,
  text: string,
  style: TextStyleOptions,
  o: { aside?: string; asideStyle?: TextStyleOptions; dur?: number; maxW?: number; rot?: number; glow?: number; at?: [number, number]; slow?: boolean } = {},
) {
  const k = new Container();
  const main = txt(text, { align: 'center', ...style });
  main.anchor.set(0.5);
  let halo: Text | null = null;
  if (o.glow !== undefined) {
    const fs = Number(style.fontSize ?? 100);
    halo = txt(text, { align: 'center', ...style, fill: o.glow, stroke: { color: o.glow, width: fs / 3, join: 'round' } });
    halo.anchor.set(0.5);
    halo.alpha = 0.32;
    k.addChild(halo);
  }
  k.addChild(main);
  const fit = Math.min(1, (o.maxW ?? 760) / Math.max(1, main.width));
  main.scale.set(fit);
  halo?.scale.set(fit);
  let aside: Text | null = null;
  if (o.aside) {
    aside = txt(o.aside, { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 46, fill: C.paper, stroke: { color: C.ink, width: 8, join: 'round' }, ...o.asideStyle });
    aside.anchor.set(0.5);
    aside.position.set(main.width * 0.12, main.height / 2 + aside.height / 2 + 2);
    aside.alpha = 0;
    k.addChild(aside);
  }
  const at = o.at ?? CHEER;
  k.position.set(at[0], at[1]);
  k.rotation = o.rot ?? -0.05;
  c.fg.addChild(k);
  if (!c.reduce) {
    if (o.slow) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.6, ease: 'power1.out' });
      gsap.fromTo(k.scale, { x: 1.12, y: 1.12 }, { x: 1, y: 1, duration: 1.2, ease: 'power2.out' });
    } else gsap.fromTo(k.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
  }
  if (aside) gsap.to(aside, { alpha: 1, duration: 0.35, delay: c.reduce ? 0.2 : 0.75 });
  gsap.to(k, { alpha: 0, delay: o.dur ?? 2.5, duration: 0.5, onComplete: () => destroyTree(k) });
  return { k, main, aside };
}

/** a small flat word that floats up and fades (laughs, howls, sound effects without the comic ghosts) */
export function floatWord(c: SigCtx, layer: Container, x: number, y: number, text: string, style: TextStyleOptions, rise = 60, dur = 1) {
  const t = txt(text, style);
  t.anchor.set(0.5);
  t.position.set(x, y);
  t.rotation = (Math.random() - 0.5) * 0.2;
  layer.addChild(t);
  if (c.reduce) {
    gsap.to(t, { alpha: 0, delay: dur * 0.8, duration: 0.2, onComplete: () => destroyTree(t) });
    return t;
  }
  gsap.fromTo(t.scale, { x: 0.3, y: 0.3 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' });
  gsap.to(t, { y: y - rise, duration: dur, ease: 'power1.out' });
  gsap.to(t, { alpha: 0, delay: dur * 0.6, duration: dur * 0.4, onComplete: () => destroyTree(t) });
  return t;
}
