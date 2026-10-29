/**
 * Helpers shared by the «tanda 2» universes of UNIVERSOS-L («cine, series, telenovela, pop y deporte»: Mi Pobre Gatito,
 * Felinamente Rubia, Capitán Gorrimiau, Doc Miauwn, Pinkmiau, Miauty la Fea, Ricardo Garjona, Shakimiau, Miaucol
 * Yordan). The base kit is kit.ts; kitA–kitK hold the other waves' helpers (imported, never edited). This file adds a few
 * coarse polygon props the nine scenes share (snow, sheets of paper, coins, street lamps, storm clouds, palms, camera
 * flashes, shout lines, a glint) — every one a fixed-vertex polygon: Pixi pools one batcher per Graphics over ~400
 * vertices and those buffers never shrink, so every single Graphics stays well under ~25k vertices, above all in the
 * full-page Catdex card.
 * Every real person these universes evoke is a cat: no faces, no names, no lyrics, no catchphrases, no logos, no crests.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { destroyTree } from '../../../panels/collection/ui';
import { type SigCtx, CHEER, later } from './kit';
import { ngon, rnd, streak, twinkle } from './kitD';
import { comic } from './kitI';

export const TAU = Math.PI * 2;

/**
 * falling snow in one Graphics (redraw it with t): `n` flakes in (x, y, w, h), each a small square or a 6-point star,
 * drifting with `wind`; seeded, so the same t always draws the same sky. ~4–6 vertices a flake.
 */
export function snow(g: Graphics, x: number, y: number, w: number, h: number, t: number, n: number, seed: number, o: { wind?: number; speed?: number; size?: number; color?: number; alpha?: number } = {}) {
  const r = rnd(seed);
  const wind = o.wind ?? 30;
  const sp = o.speed ?? 70;
  const sz = o.size ?? 5;
  const col = o.color ?? 0xffffff;
  for (let i = 0; i < n; i++) {
    const depth = 0.4 + r() * 0.8;
    const fx = r() * w;
    const fy = r() * h;
    const ph = r() * TAU;
    const yy = y + ((fy + t * sp * depth) % h);
    const xx = x + ((((fx + t * wind * depth + Math.sin(t * 1.3 + ph) * 18 * depth) % w) + w) % w);
    const s = sz * depth;
    if (i % 7 === 0) g.poly(twinkle(xx, yy, s * 1.5, 0.3)).fill({ color: col, alpha: (o.alpha ?? 0.9) * depth });
    else g.rect(xx - s / 2, yy - s / 2, s, s).fill({ color: col, alpha: (o.alpha ?? 0.9) * (0.4 + depth * 0.5) });
  }
  return g;
}

/** a sheet of paper (w×h, centered) with typed lines; `fold` dog-ears a corner */
export function sheet(w: number, h: number, o: { fill?: number; line?: number; ink?: number; fold?: boolean; lines?: number } = {}) {
  const g = new Graphics();
  const ink = o.ink ?? 0x6a6070;
  const f = o.fold ? Math.min(w, h) * 0.22 : 0;
  g.poly([-w / 2, -h / 2, w / 2 - f, -h / 2, w / 2, -h / 2 + f, w / 2, h / 2, -w / 2, h / 2]).fill(o.fill ?? 0xffffff).stroke({ width: Math.max(1, w / 40), color: ink, alpha: 0.6 });
  if (f) g.poly([w / 2 - f, -h / 2, w / 2 - f, -h / 2 + f, w / 2, -h / 2 + f]).fill(0xd8d2c8);
  const n = o.lines ?? 6;
  for (let i = 0; i < n; i++) {
    const yy = -h / 2 + h * 0.18 + (i * h * 0.7) / n;
    const lw = w * (i === 0 ? 0.5 : 0.62 + ((i * 37) % 10) / 40);
    g.rect(-w / 2 + w * 0.12, yy, Math.min(lw, w * 0.76), Math.max(1, h / 60)).fill({ color: o.line ?? 0x9aa0b4, alpha: 0.8 });
  }
  return g;
}

/** a gold coin (r = radius) with a rim and a paw stamped on it (no real money); `tilt` squashes it (a coin spinning) */
export function coin(r: number, tilt = 1, g = new Graphics(), gold = 0xf2c94c) {
  const ry = r * Math.max(0.12, Math.abs(tilt));
  g.poly(ngon(0, 0, r, ry, 14)).fill(0xb8861e);
  g.poly(ngon(0, -ry * 0.06, r * 0.86, ry * 0.86, 14)).fill(gold);
  if (Math.abs(tilt) > 0.4) {
    g.poly(ngon(0, ry * 0.12, r * 0.26, ry * 0.22, 8)).fill(0xc99a2a);
    for (const [dx, dy] of [
      [-0.26, -0.16],
      [-0.09, -0.3],
      [0.09, -0.3],
      [0.26, -0.16],
    ])
      g.poly(ngon(dx * r, dy * ry, r * 0.08, ry * 0.09, 6)).fill(0xc99a2a);
  }
  g.poly(twinkle(-r * 0.4, -ry * 0.4, r * 0.32, 0.25)).fill({ color: 0xffffff, alpha: 0.85 });
  return g;
}

/** a cast-iron street lamp (origin at its foot, height ≈ 6·s) with its glass lit by `lit` 0..1 (a halo when lit) */
export function lamp(g: Graphics, x: number, y: number, s: number, lit = 1, iron = 0x14141a, light = 0xffd27a) {
  g.poly([x - s * 0.28, y, x + s * 0.28, y, x + s * 0.18, y - s * 0.5, x - s * 0.18, y - s * 0.5]).fill(iron);
  g.poly([x - s * 0.08, y - s * 0.5, x + s * 0.08, y - s * 0.5, x + s * 0.06, y - s * 4.6, x - s * 0.06, y - s * 4.6]).fill(iron);
  if (lit > 0.02) for (let i = 5; i >= 1; i--) g.poly(ngon(x, y - s * 5.2, s * 0.5 * i, s * 0.5 * i, 14)).fill({ color: light, alpha: 0.06 * lit });
  g.poly([x - s * 0.36, y - s * 4.6, x + s * 0.36, y - s * 4.6, x + s * 0.5, y - s * 5.6, x - s * 0.5, y - s * 5.6]).fill({ color: lit > 0.02 ? light : 0x4a4a50, alpha: 0.5 + 0.5 * lit });
  g.poly([x - s * 0.62, y - s * 5.6, x + s * 0.62, y - s * 5.6, x, y - s * 6.1]).fill(iron);
  g.rect(x - s * 0.04, y - s * 5.6, s * 0.08, s * 1.0).fill(iron);
  return g;
}

/** a bank of storm clouds along y (overlapping flat polygons, seeded): dark bellies under lit tops */
export function stormClouds(g: Graphics, x0: number, w: number, y: number, h: number, dark: number, lite: number, seed: number, n = 9, alpha = 1) {
  const r = rnd(seed);
  for (let pass = 0; pass < 2; pass++) {
    const rr = rnd(seed);
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + rr() * 0.6) * (w / n);
      const rx = (w / n) * (0.8 + rr() * 0.9);
      const ry = h * (0.45 + rr() * 0.55);
      const yy = y + (rr() - 0.5) * h * 0.6;
      if (pass === 0) g.poly(ngon(x, yy - ry * 0.18, rx, ry, 16)).fill({ color: lite, alpha });
      else g.poly(ngon(x, yy + ry * 0.12, rx * 0.94, ry * 0.8, 16)).fill({ color: dark, alpha });
    }
  }
  void r;
  return g;
}

/** a palm in silhouette (origin at its foot): a curved trunk and a crown of fronds leaning `lean`; `sway` bends the fronds */
export function palm(g: Graphics, x: number, y: number, s: number, lean: number, col: number, sway = 0) {
  const pts: number[] = [];
  const back: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const px = x + lean * s * 160 * u * u;
    const py = y - s * 420 * u;
    const wdt = s * (16 - 8 * u);
    pts.push(px - wdt, py);
    back.unshift(px + wdt, py);
  }
  g.poly([...pts, ...back]).fill(col);
  const tx = x + lean * s * 160;
  const ty = y - s * 420;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.48 + lean * 0.2 + sway * (0.5 + (i % 3) * 0.25);
    const L = s * (150 + (i % 2) * 40);
    const ex = tx + Math.cos(a) * L;
    const ey = ty + Math.sin(a) * L * 0.6 + L * 0.35;
    const mx = tx + Math.cos(a) * L * 0.5;
    const my = ty + Math.sin(a) * L * 0.5 - s * 10;
    g.poly([tx, ty, mx - Math.sin(a) * s * 22, my + Math.cos(a) * s * 14, ex, ey, mx + Math.sin(a) * s * 8, my - Math.cos(a) * s * 4]).fill(col);
  }
  g.poly(ngon(tx, ty + s * 10, s * 18, s * 14, 8)).fill(col);
  return g;
}

/**
 * camera flashes in a dark crowd (redraw with t): `n` seeded spots in (x, y, w, h); each pops for a moment now and
 * then (a 4-point star and a small glow). `rate` = pops per spot per second. Cheap: ≤ 20 vertices a lit spot.
 */
export function flashbulbs(g: Graphics, x: number, y: number, w: number, h: number, t: number, n: number, seed: number, o: { rate?: number; size?: number; boost?: number; color?: number } = {}) {
  const r = rnd(seed);
  const rate = o.rate ?? 0.5;
  const s0 = o.size ?? 16;
  for (let i = 0; i < n; i++) {
    const px = x + r() * w;
    const py = y + r() * h;
    const ph = r();
    const q = (t * rate + ph) % 1;
    const life = 0.12 * (1 + (o.boost ?? 0) * 2);
    if (q > life) continue;
    const v = 1 - q / life;
    const s = s0 * (0.6 + r() * 0.7) * (0.6 + v * 0.6);
    g.poly(ngon(px, py, s * 1.8, s * 1.8, 10)).fill({ color: o.color ?? 0xffffff, alpha: 0.18 * v });
    g.poly(twinkle(px, py, s * 1.4, 0.18)).fill({ color: o.color ?? 0xffffff, alpha: 0.95 * v });
  }
  return g;
}

/** shout lines bursting out of (x, y): `n` tapered wedges between r0 and r1 toward angles a0..a1 (one Graphics) */
export function shoutLines(x: number, y: number, n: number, r0: number, r1: number, color: number, a0 = 0, a1 = TAU, w = 7) {
  const g = new Graphics();
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5)) / n;
    g.poly(streak(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1, w, w * 0.25));
  }
  return g.fill(color);
}

/** a glint (a 4-point star with a soft disc) that pops and fades at (x, y) on `layer` */
export function glint(c: SigCtx, layer: Container, x: number, y: number, r = 34, color = 0xffffff, hold = 0.25) {
  const g = new Graphics().poly(ngon(0, 0, r * 0.9, r * 0.9, 12)).fill({ color, alpha: 0.25 }).poly(twinkle(0, 0, r, 0.16)).fill(color);
  g.position.set(x, y);
  layer.addChild(g);
  if (!c.reduce) {
    gsap.fromTo(g.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.14, ease: 'back.out(3)' });
    gsap.to(g, { rotation: 0.6, duration: hold + 0.3 });
  }
  gsap.to(g, { alpha: 0, delay: hold, duration: 0.3, onComplete: () => destroyTree(g) });
  return g;
}

/** a node that drifts down slowly turning (a paper in slow motion, a petal), then fades: on `layer` at (x, y) */
export function drift(c: SigCtx, layer: Container, node: Container, x: number, y: number, o: { dy?: number; dx?: number; dur?: number; spin?: number; delay?: number } = {}) {
  node.position.set(x, y);
  layer.addChild(node);
  const dur = o.dur ?? 2;
  if (c.reduce) {
    gsap.to(node, { alpha: 0, delay: 0.8 + (o.delay ?? 0), duration: 0.3, onComplete: () => destroyTree(node) });
    return node;
  }
  gsap.to(node, { y: y + (o.dy ?? 300), x: x + (o.dx ?? 0), rotation: node.rotation + (o.spin ?? 1.4), duration: dur, delay: o.delay ?? 0, ease: 'sine.inOut' });
  gsap.to(node, { alpha: 0, delay: (o.delay ?? 0) + dur * 0.75, duration: dur * 0.25, onComplete: () => destroyTree(node) });
  return node;
}

/**
 * the payoff's two-part word («¡AAAAH!…» then «¡JA!»): the first lands like cheer() at CHEER, the second slams in beside
 * it `gap` s later; both leave after `dur`. Built at the payoff (two comic words: the cost of one cheer()).
 */
export function cheer2(c: SigCtx, a: string, b: string, ca: number, cb: number, o: { size?: number; gap?: number; dur?: number; dx?: number; dy?: number } = {}) {
  const size = o.size ?? 120;
  const k = new Container();
  k.position.set(CHEER[0] - 40, CHEER[1]);
  k.rotation = -0.06;
  const wa = comic(a, ca, size);
  const fit = Math.min(1, 560 / Math.max(1, wa.width));
  wa.scale.set(fit);
  k.addChild(wa);
  c.fg.addChild(k);
  if (!c.reduce) gsap.fromTo(k.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
  later(c, o.gap ?? 0.55, () => {
    if (k.destroyed) return;
    const wb = comic(b, cb, size * 1.25, F.comic);
    wb.position.set(wa.width / 2 + (o.dx ?? 120), o.dy ?? -20);
    wb.rotation = 0.12;
    k.addChild(wb);
    if (!c.reduce) gsap.fromTo(wb.scale, { x: 2.6, y: 2.6 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3.5)' });
  });
  gsap.to(k, { alpha: 0, delay: o.dur ?? 2.3, duration: 0.4, onComplete: () => destroyTree(k) });
  return k;
}

export { C, F };
