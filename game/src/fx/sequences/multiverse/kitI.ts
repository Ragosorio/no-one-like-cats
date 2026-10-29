/**
 * Helpers shared by the post-Parte III «escenario y estadio» universes (UNIVERSOS-I: Romiau Santos, El Miauki,
 * Miautentación, Party Michi, The Miauknd, Miaussi, Gatistiano Ronaldo, Miaupé, Lamiau Yamal). The base kit is kit.ts;
 * kitA–kitD hold the earlier waves' helpers (imported, never edited). This file adds:
 * - prebuilt words: a big stroked Text costs a 100–170 ms frame to rasterize mid-takeover, so every word of the
 *   takeover is built at open() (alpha ≈ 0, it rasterizes under the seal's break) and only shown on its beat; the payoff
 *   drops the ones a skipped reveal never reached (`wrap()`);
 * - coarse polygon props for stages and stadiums (roses, petals, notes, hearts, the ball, a trophy, floodlights, crowds,
 *   flags), all fixed-vertex polygons: Pixi pools one batcher per Graphics over ~400 vertices and those buffers never
 *   shrink, so every single Graphics stays well under ~25k vertices, above all in the full-page Catdex card.
 * Every person these universes evoke is a cat: no faces, no names, no lyrics, no catchphrases, no crests, no brands.
 */
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { destroyTree } from '../../../panels/collection/ui';
import { type SigCtx, alive, later } from './kit';
import { pay, paid } from './kitC';
import { ngon, rnd, streak } from './kitD';

export const TAU = Math.PI * 2;

// --- prebuilt words ---------------------------------------------------------------------------
const PENDING = new WeakMap<Container, Set<Container>>();

/**
 * Build a word now (at open), invisible, on `layer` (default c.fg) at (x, y); returns pop(hold): it shows on its beat,
 * slams in (scale 2.2 → 1, unless Reducir movimiento), holds `hold` s and fades. A popped word is no longer pending.
 */
export function pre(c: SigCtx, node: Container, x: number, y: number, rot = 0, layer: Container = c.fg) {
  node.position.set(x, y);
  node.rotation = rot;
  node.alpha = 0.001;
  layer.addChild(node);
  let set = PENDING.get(c.root);
  if (!set) PENDING.set(c.root, (set = new Set()));
  set.add(node);
  return (hold = 0.9, o: { from?: number; fade?: number } = {}) => {
    if (node.destroyed || !alive(c)) return;
    set!.delete(node);
    node.alpha = 1;
    if (!c.reduce) gsap.fromTo(node.scale, { x: o.from ?? 2.2, y: o.from ?? 2.2 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
    gsap.to(node, { alpha: 0, delay: hold, duration: o.fade ?? 0.25, onComplete: () => destroyTree(node) });
  };
}

/** the payoff landed: takeover beats stop (kitC's beat()) and any word still waiting for its beat goes */
export function wrap(c: SigCtx) {
  pay(c);
  const set = PENDING.get(c.root);
  if (!set) return;
  for (const n of set) destroyTree(n);
  set.clear();
}

const PARKED = new WeakMap<Container, Map<string, Container>>();
/**
 * Build the payoff's heavy headline at open() (a wide glowing stroke costs a 50+ ms frame at the color fill): it waits
 * invisible in c.fg; take() hands it to the payoff (or builds it then, if open() never parked it).
 */
export function park(c: SigCtx, key: string, node: Container) {
  node.alpha = 0.001;
  node.position.set(-2000, -2000);
  c.fg.addChild(node);
  let m = PARKED.get(c.root);
  if (!m) PARKED.set(c.root, (m = new Map()));
  m.set(key, node);
  return node;
}
export function take<T extends Container>(c: SigCtx, key: string, make: () => T): T {
  const n = PARKED.get(c.root)?.get(key) as T | undefined;
  PARKED.get(c.root)?.delete(key);
  const out = n && !n.destroyed ? n : make();
  out.alpha = 1;
  out.position.set(0, 0);
  return out;
}

/** a takeover beat: fn after `s` seconds, unless the reveal closed or the payoff already landed */
export function at(c: SigCtx, s: number, fn: () => void) {
  later(c, s, () => !paid(c) && fn());
}

/** a comic word with the CMYK ghosts (like juice.onomatopoeia, but static: build it with pre()) */
export function comic(text: string, color: number, size = 110, font: string = F.comic, ink: number = C.ink) {
  const k = new Container();
  const mk = (fill: number, dx: number, dy: number, alpha: number) => {
    const t = txt(text, { fontFamily: font, fontSize: size, fill, align: 'center', stroke: { color: ink, width: size / 9, join: 'round' }, letterSpacing: 2, lineHeight: size * 0.98 });
    t.anchor.set(0.5);
    t.position.set(dx, dy);
    t.alpha = alpha;
    return t;
  };
  const a = mk(C.cyan, -6, 3, 0.85);
  const b = mk(C.pinkHot, 6, -3, 0.85);
  a.blendMode = 'multiply';
  b.blendMode = 'multiply';
  k.addChild(a, b, mk(color, 0, 0, 1));
  return k;
}

/** one flat Text (no ghosts) centered on its anchor: neon signs, chalk, soft words */
export function flat(text: string, style: TextStyleOptions) {
  const t = txt(text, { align: 'center', ...style });
  t.anchor.set(0.5);
  return t;
}

/** a glowing word: a wide faint halo of `glow` behind the letters (one Container, two Texts) */
export function neonWord(text: string, size: number, fill: number, glow: number, font: string = F.heavy) {
  const k = new Container();
  const halo = txt(text, { fontFamily: font, fontSize: size, fill: glow, align: 'center', stroke: { color: glow, width: size / 3, join: 'round' } });
  halo.alpha = 0.35;
  const t = txt(text, { fontFamily: font, fontSize: size, fill, align: 'center', stroke: { color: glow, width: size / 14, join: 'round' } });
  for (const x of [halo, t]) x.anchor.set(0.5);
  k.addChild(halo, t);
  return k;
}

/**
 * the payoff's words at (x, y): a main line that scales in (fit to `maxW`) and an aside under it that fades in a beat
 * later; both leave after `dur`. Built here at the payoff (one Text each: cheap enough at the color fill).
 */
export function payline(
  c: SigCtx,
  main: Text | Container,
  aside: string | null,
  o: { x?: number; y?: number; maxW?: number; dur?: number; rot?: number; asideStyle?: TextStyleOptions; slow?: boolean; dy?: number } = {},
) {
  const k = new Container();
  const fit = Math.min(1, (o.maxW ?? 760) / Math.max(1, main.width));
  main.scale.set(fit);
  k.addChild(main);
  let a: Text | null = null;
  if (aside) {
    a = txt(aside, { fontFamily: F.comic, fontSize: 46, fill: C.paper, stroke: { color: C.ink, width: 8, join: 'round' }, letterSpacing: 1, ...o.asideStyle });
    a.anchor.set(0.5);
    if (a.width > 720) a.scale.set(720 / a.width);
    a.position.set(30, main.height / 2 + a.height / 2 + (o.dy ?? 6));
    a.alpha = 0;
    k.addChild(a);
  }
  k.position.set(o.x ?? 430, o.y ?? 700);
  k.rotation = o.rot ?? -0.05;
  c.fg.addChild(k);
  if (!c.reduce) {
    if (o.slow) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.6, ease: 'power1.out' });
      gsap.fromTo(k.scale, { x: 1.1, y: 1.1 }, { x: 1, y: 1, duration: 1.2, ease: 'power2.out' });
    } else gsap.fromTo(k.scale, { x: 1.7, y: 1.7 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
  }
  if (a) gsap.to(a, { alpha: 1, duration: 0.3, delay: c.reduce ? 0.2 : 0.6 });
  gsap.to(k, { alpha: 0, delay: o.dur ?? 2.3, duration: 0.45, onComplete: () => destroyTree(k) });
  return k;
}

// --- shapes -----------------------------------------------------------------------------------
/** a heart as a polygon (n points; center at (x, y), half-width s) */
export function heartPts(x: number, y: number, s: number, n = 22): number[] {
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    p.push(x + (hx / 16) * s, y - (hy / 16) * s);
  }
  return p;
}

/** a petal (a teardrop, tip up), length s */
export function petalPts(s: number): number[] {
  return [0, -s * 0.55, s * 0.3, -s * 0.2, s * 0.34, s * 0.15, s * 0.16, s * 0.42, 0, s * 0.46, -s * 0.16, s * 0.42, -s * 0.34, s * 0.15, -s * 0.3, -s * 0.2];
}

/** a red rose seen from above-front (r = radius): outer petals, a darker cup, the spiral; optional leaves. ~90 vertices */
export function rose(g: Graphics, x: number, y: number, r: number, rot = 0, col = 0xc8102e, leaves = true, ink: number | null = null) {
  const dark = 0x7a0a1c;
  const lite = 0xe8394b;
  if (leaves) {
    for (const s of [-1, 1]) {
      const a = rot + Math.PI / 2 + s * 0.9;
      const lx = x + Math.cos(a) * r * 0.95;
      const ly = y + Math.sin(a) * r * 0.95;
      g.poly(ngon(lx, ly, r * 0.62, r * 0.28, 8, a)).fill(0x2e7a3a);
      g.poly(streak(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4, lx + Math.cos(a) * r * 0.5, ly + Math.sin(a) * r * 0.5, r * 0.04, r * 0.02)).fill(0x1d5428);
    }
  }
  for (let i = 0; i < 5; i++) {
    const a = rot + (i / 5) * TAU;
    g.poly(ngon(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.6, r * 0.5, 9, a)).fill(i % 2 ? col : lite);
  }
  if (ink !== null) g.poly(ngon(x, y, r * 1.0, r * 0.96, 14, rot)).stroke({ width: Math.max(1.5, r * 0.07), color: ink, alpha: 0.5 });
  g.poly(ngon(x, y, r * 0.6, r * 0.56, 10, rot)).fill(dark);
  g.poly(ngon(x + r * 0.06, y - r * 0.04, r * 0.44, r * 0.4, 10, rot)).fill(col);
  g.poly(ngon(x + r * 0.1, y - r * 0.02, r * 0.26, r * 0.22, 8, rot + 0.6)).fill(dark);
  g.poly(ngon(x + r * 0.14, y - r * 0.06, r * 0.13, r * 0.11, 6, rot)).fill(lite);
  return g;
}

/** an eighth note (or two beamed when `pair`), height s, origin at the head */
export function note(g: Graphics, x: number, y: number, s: number, color: number, pair = false) {
  const hw = s * 0.22;
  g.poly(ngon(x, y, hw, hw * 0.72, 10, -0.4)).fill(color);
  g.rect(x + hw * 0.8, y - s, s * 0.07, s).fill(color);
  if (pair) {
    const dx = s * 0.55;
    g.poly(ngon(x + dx, y - s * 0.12, hw, hw * 0.72, 10, -0.4)).fill(color);
    g.rect(x + dx + hw * 0.8, y - s * 1.12, s * 0.07, s).fill(color);
    g.poly([x + hw * 0.8, y - s, x + dx + hw * 0.8 + s * 0.07, y - s * 1.12, x + dx + hw * 0.8 + s * 0.07, y - s * 0.94, x + hw * 0.8, y - s * 0.82]).fill(color);
  } else g.poly([x + hw * 0.8 + s * 0.07, y - s, x + hw * 0.8 + s * 0.42, y - s * 0.62, x + hw * 0.8 + s * 0.3, y - s * 0.5, x + hw * 0.8 + s * 0.07, y - s * 0.74]).fill(color);
  return g;
}

/** the soccer ball: white, black pentagons, seams, a shine (r = radius; one Graphics, ~80 vertices) */
export function ball(r: number, g = new Graphics()) {
  g.poly(ngon(0, 0, r, r, 22)).fill(0xffffff).stroke({ width: Math.max(2, r * 0.09), color: C.ink, join: 'round' });
  g.poly(ngon(0, 0, r * 0.3, r * 0.3, 5, -Math.PI / 2)).fill(C.ink);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + Math.PI / 5 + (i * TAU) / 5;
    g.poly(ngon(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74, r * 0.2, r * 0.13, 5, a + Math.PI / 2)).fill(C.ink);
    const b = -Math.PI / 2 + (i * TAU) / 5;
    g.poly(streak(Math.cos(b) * r * 0.3, Math.sin(b) * r * 0.3, Math.cos(b) * r * 0.62, Math.sin(b) * r * 0.62, r * 0.03, r * 0.03)).fill(C.ink);
  }
  g.poly(ngon(-r * 0.38, -r * 0.42, r * 0.2, r * 0.1, 8, -0.7)).fill({ color: 0xffffff, alpha: 0.9 });
  return g;
}

/**
 * a generic golden cup (two handles, a deep bowl, a stem and a two-step base, a paw on the bowl — no real trophy's
 * shape), origin at the base's bottom center, height ≈ 2.4·s
 */
export function cup(g: Graphics, x: number, y: number, s: number, gold = 0xe6c34a, ink: number = C.ink) {
  const dk = 0x9c7a1e;
  const lt = 0xfff0a8;
  const lw = Math.max(2, s * 0.06);
  // handles
  for (const d of [-1, 1]) {
    const pts: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * Math.PI;
      pts.push(x + d * (s * 0.62 + Math.cos(a) * s * 0.42), y - s * 1.95 + Math.sin(a) * s * 0.42);
    }
    for (let i = 8; i >= 0; i--) {
      const a = -Math.PI / 2 + (i / 8) * Math.PI;
      pts.push(x + d * (s * 0.62 + Math.cos(a) * s * 0.26), y - s * 1.95 + Math.sin(a) * s * 0.26);
    }
    g.poly(pts).fill(gold).stroke({ width: lw, color: ink, join: 'round' });
  }
  // base
  g.poly([x - s * 0.62, y, x + s * 0.62, y, x + s * 0.54, y - s * 0.22, x - s * 0.54, y - s * 0.22]).fill(dk).stroke({ width: lw, color: ink, join: 'round' });
  g.poly([x - s * 0.44, y - s * 0.22, x + s * 0.44, y - s * 0.22, x + s * 0.34, y - s * 0.44, x - s * 0.34, y - s * 0.44]).fill(gold).stroke({ width: lw, color: ink, join: 'round' });
  // stem
  g.poly([x - s * 0.12, y - s * 0.44, x + s * 0.12, y - s * 0.44, x + s * 0.18, y - s * 1.2, x - s * 0.18, y - s * 1.2]).fill(gold).stroke({ width: lw, color: ink, join: 'round' });
  g.poly(ngon(x, y - s * 0.86, s * 0.2, s * 0.08, 10)).fill(dk);
  // the bowl
  const bowl: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    bowl.push(x + Math.cos(a) * s * 0.7, y - s * 2.3 + Math.sin(a) * s * 1.1);
  }
  g.poly(bowl).fill(gold).stroke({ width: lw, color: ink, join: 'round' });
  g.poly(ngon(x, y - s * 2.3, s * 0.7, s * 0.14, 16)).fill(dk).stroke({ width: lw, color: ink, join: 'round' });
  // a shine and the paw
  g.poly([x - s * 0.5, y - s * 2.18, x - s * 0.36, y - s * 2.18, x - s * 0.16, y - s * 1.4, x - s * 0.26, y - s * 1.42]).fill({ color: lt, alpha: 0.85 });
  g.poly(ngon(x + s * 0.12, y - s * 1.72, s * 0.15, s * 0.12, 8)).fill(dk);
  for (const [dx, dy] of [
    [-0.12, -0.18],
    [0.02, -0.26],
    [0.2, -0.25],
    [0.34, -0.16],
  ])
    g.poly(ngon(x + s * 0.12 + dx * s * 0.7, y - s * 1.72 + dy * s * 0.7, s * 0.055, s * 0.065, 6)).fill(dk);
  return g;
}

/** a stadium floodlight tower: a lattice pole and a tilted rack of lamps (origin at the pole's foot) */
export function floodlight(g: Graphics, x: number, y: number, s: number, lit = 1, steel = 0x2a3346) {
  g.poly([x - s * 0.08, y, x + s * 0.08, y, x + s * 0.03, y - s * 3.2, x - s * 0.03, y - s * 3.2]).fill(steel);
  for (let i = 0; i < 6; i++) {
    const y0 = y - (i * s * 3.2) / 6;
    g.poly(streak(x - s * 0.07 + i * s * 0.007, y0, x + s * 0.06 - i * s * 0.007, y0 - s * 0.5, s * 0.012, s * 0.012)).fill(steel);
  }
  g.poly([x - s * 0.62, y - s * 3.3, x + s * 0.62, y - s * 3.42, x + s * 0.6, y - s * 3.9, x - s * 0.6, y - s * 3.78]).fill(steel);
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 6; i++) {
      const lx = x - s * 0.5 + i * s * 0.2;
      const ly = y - s * 3.42 - r * s * 0.15 - i * s * 0.02;
      g.rect(lx - s * 0.07, ly - s * 0.06, s * 0.14, s * 0.12).fill({ color: lit > 0.5 ? 0xfffbe6 : 0x8a8f9c, alpha: 0.6 + 0.4 * lit });
    }
  return g;
}

/** a light cone from (x, y) toward angle `a` (length L, half-angle `spread`): one 3-point poly, fill it */
export function cone(x: number, y: number, a: number, L: number, spread: number): number[] {
  return [x, y, x + Math.cos(a - spread) * L, y + Math.sin(a - spread) * L, x + Math.cos(a + spread) * L, y + Math.sin(a + spread) * L];
}

/** a cat's head (ears included) as one 8-point polygon */
export function head(g: Graphics, x: number, y: number, s: number, col: number, alpha = 1) {
  return g
    .poly([x - s, y - s * 0.1, x - s * 0.9, y - s * 1.2, x - s * 0.3, y - s * 0.7, x + s * 0.3, y - s * 0.7, x + s * 0.9, y - s * 1.2, x + s, y - s * 0.1, x + s * 0.7, y + s * 0.65, x - s * 0.7, y + s * 0.65])
    .fill({ color: col, alpha });
}

/**
 * a crowd of cats seen from behind along the bottom (heads + shoulders), in `rows` Graphics (each can sway or jump on
 * its own). `cols` colors the fur/shirts; `paws` raises a few paws (a light on top when `lights`). (x0..x0+w, y0 = the
 * back row's head line, rows step down by `dy`.)
 */
export function crowdBack(
  w: number,
  y0: number,
  o: { rows?: number; dy?: number; s?: number; cols: number[]; seed?: number; paws?: number; light?: number; x0?: number; alpha?: number },
) {
  const r = rnd(o.seed ?? 3);
  const rows: Graphics[] = [];
  const lights: [number, number][][] = [];
  const n = o.rows ?? 3;
  for (let j = 0; j < n; j++) {
    const g = new Graphics();
    const L: [number, number][] = [];
    const s = (o.s ?? 30) * (1 + j * 0.28);
    const y = y0 + j * (o.dy ?? 46);
    for (let x = (o.x0 ?? 0) - s + r() * s; x < (o.x0 ?? 0) + w + s; x += s * (1.7 + r() * 0.5)) {
      const col = o.cols[Math.floor(r() * o.cols.length)];
      const yy = y + (r() - 0.5) * s * 0.3;
      if (r() < (o.paws ?? 0)) {
        const px = x + (r() < 0.5 ? -1 : 1) * s * 0.6;
        g.poly(streak(px, yy + s * 0.6, px + (r() - 0.5) * s * 0.4, yy - s * 1.9, s * 0.2, s * 0.17)).fill({ color: col, alpha: o.alpha ?? 1 });
        if (o.light !== undefined) L.push([px, yy - s * 2.05]);
      }
      g.poly([x - s * 1.1, yy + s * 2.4, x - s * 0.95, yy + s * 0.75, x - s * 0.4, yy + s * 0.5, x + s * 0.4, yy + s * 0.5, x + s * 0.95, yy + s * 0.75, x + s * 1.1, yy + s * 2.4]).fill({ color: col, alpha: o.alpha ?? 1 });
      head(g, x, yy, s * 0.62, col, o.alpha ?? 1);
    }
    rows.push(g);
    lights.push(L);
  }
  return { rows, lights };
}

/**
 * the stands seen from the pitch: seat bands from `top` down to the horizon `hz` under a roof edge, packed with cats in
 * `cols`, a front wall of plain panels in `wall` colors (no brands), a few little flags in `flag` stripes. Returns the
 * static tier and the crowd rows (each its own Graphics so a row can jump). `k` scales the people (1 at 1920×1080).
 */
export function standsFront(
  w: number,
  top: number,
  hz: number,
  o: { k: number; seed: number; cols: number[]; seat: [number, number]; wall: number[]; roof?: number; rows?: number; flag?: number[] },
) {
  const tier = new Graphics();
  const r = rnd(o.seed);
  const k = o.k;
  const roof = o.roof ?? 0x10131f;
  const NB = 8;
  for (let i = 0; i < NB; i++) tier.rect(0, top + ((hz - top) * i) / NB, w, (hz - top) / NB + 1).fill(i % 2 ? o.seat[0] : o.seat[1]);
  for (let x = 150 * k + r() * 100 * k; x < w; x += 380 * k) tier.poly([x - 7 * k, top, x + 7 * k, top, x + 13 * k, hz, x - 13 * k, hz]).fill({ color: 0x000000, alpha: 0.28 });
  tier.rect(0, top - 34 * k, w, 34 * k).fill(roof);
  for (let x = 60 * k; x < w; x += 240 * k) tier.poly(streak(x, top - 6 * k, x + 34 * k, top + 34 * k, 3 * k, 3 * k)).fill(roof);
  tier.rect(0, hz - 22 * k, w, 24 * k).fill(0xffffff);
  const pw = 160 * k;
  for (let i = 0; i < Math.ceil(w / pw); i++) tier.rect(i * pw + 4 * k, hz - 19 * k, pw - 8 * k, 17 * k).fill(o.wall[i % o.wall.length]);
  const rows: Graphics[] = [];
  const NR = o.rows ?? 8;
  for (let j = 0; j < NR; j++) {
    const g = new Graphics();
    const u = (j + 0.75) / NR;
    const y = top + (hz - 26 * k - top) * u;
    const s = (6 + u * 11) * k;
    for (let x = r() * s * 2; x < w + s; x += s * (2 + r() * 0.4)) {
      const yy = y + (r() - 0.5) * s * 0.4;
      head(g, x, yy, s, o.cols[Math.floor(r() * o.cols.length)]);
      if (o.flag && r() < 0.03) {
        g.poly(streak(x + s * 0.6, yy, x + s * 0.6, yy - s * 3.6, s * 0.1, s * 0.1)).fill(0xdddddd);
        const n = o.flag.length;
        for (let i = 0; i < n; i++) g.rect(x + s * 0.6, yy - s * 3.6 + (i * s * 1.6) / n, s * 2.4, (s * 1.6) / n + 0.5).fill(o.flag[i]);
      }
    }
    rows.push(g);
  }
  return { tier, rows };
}

/** the pitch seen from the touchline: mowed bands in perspective from `hz` down, touchlines, the center circle */
export function pitchFront(g: Graphics, w: number, h: number, hz: number, cols: [number, number], k: number, lines = true, phase = 0) {
  g.rect(0, hz, w, h - hz).fill(cols[0]);
  const N = 9;
  for (let j = 0; j < N + 1; j++) {
    const a = Math.max(0, (j - (phase % 2)) / N);
    const b = Math.max(0, (j + 1 - (phase % 2)) / N);
    if (j % 2 === 0) continue;
    g.rect(0, hz + (h - hz) * a * a, w, (h - hz) * (b * b - a * a) + 0.5).fill(cols[1]);
  }
  if (!lines) return g;
  const lw = Math.max(1.5, 3 * k);
  g.poly(streak(w * 0.5, hz, w * 0.5, h, lw * 0.4, lw * 1.4)).fill({ color: 0xffffff, alpha: 0.75 });
  g.rect(0, hz + 6 * k, w, lw * 0.8).fill({ color: 0xffffff, alpha: 0.7 });
  g.poly(ngon(w * 0.5, hz + (h - hz) * 0.62, Math.min(w * 0.3, 380 * k), (h - hz) * 0.2, 30)).stroke({ width: lw * 1.2, color: 0xffffff, alpha: 0.75 });
  return g;
}

/** a giant cat footballer in shadow (a defender twice his size), origin at the feet; `s` = a tenth of its height */
export function giant(s: number, col = 0x161b2e, rim = 0x75aadb, eye = 0xffe14d, kit = 0x2b3150, shorts = 0x1b2036) {
  const g = new Graphics();
  for (const d of [-1, 1]) {
    // leg (fur), sock with a band, boot
    g.poly([d * 0.4 * s, -3.6 * s, d * 1.3 * s, -3.6 * s, d * 1.22 * s, -0.5 * s, d * 0.48 * s, -0.5 * s]).fill(col);
    g.poly([d * 0.44 * s, -1.9 * s, d * 1.26 * s, -1.9 * s, d * 1.22 * s, -0.4 * s, d * 0.48 * s, -0.4 * s]).fill(kit);
    g.rect(d > 0 ? 0.45 * s : -1.27 * s, -1.75 * s, 0.82 * s, 0.18 * s).fill({ color: rim, alpha: 0.55 });
    g.poly([d * 0.42 * s, -0.5 * s, d * 1.3 * s, -0.5 * s, d * 1.62 * s, -0.1 * s, d * 1.58 * s, 0, d * 0.4 * s, 0]).fill(0x0c0e16);
    // arm akimbo: sleeve, then the furry forearm to the hip
    g.poly([d * 1.75 * s, -7.45 * s, d * 2.45 * s, -6.95 * s, d * 2.65 * s, -6.15 * s, d * 2.0 * s, -6.0 * s, d * 1.7 * s, -6.6 * s]).fill(kit);
    g.poly([d * 2.65 * s, -6.2 * s, d * 2.95 * s, -5.55 * s, d * 1.75 * s, -4.45 * s, d * 1.45 * s, -4.95 * s, d * 2.25 * s, -5.6 * s, d * 2.05 * s, -6.05 * s]).fill(col);
    // ear
    g.poly([d * 0.32 * s, -9.0 * s, d * 0.78 * s, -10.15 * s, d * 1.08 * s, -8.65 * s]).fill(col);
  }
  // shorts, then the jersey with rounded shoulders
  g.poly([-1.6 * s, -4.5 * s, 1.6 * s, -4.5 * s, 1.45 * s, -3.2 * s, 0.1 * s, -3.0 * s, -0.1 * s, -3.0 * s, -1.45 * s, -3.2 * s]).fill(shorts);
  g.poly([-1.98 * s, -6.9 * s, -1.75 * s, -7.45 * s, -1.0 * s, -7.65 * s, 1.0 * s, -7.65 * s, 1.75 * s, -7.45 * s, 1.98 * s, -6.9 * s, 1.6 * s, -4.3 * s, -1.6 * s, -4.3 * s]).fill(kit);
  g.poly([-0.5 * s, -7.62 * s, 0.5 * s, -7.62 * s, 0, -7.0 * s]).fill(col);
  g.poly(ngon(0, -8.35 * s, 1.15 * s, 1.0 * s, 14)).fill(col);
  g.poly(streak(1.92 * s, -7.0 * s, 1.55 * s, -4.4 * s, 0.07 * s, 0.05 * s)).fill({ color: rim, alpha: 0.85 });
  g.poly(streak(1.22 * s, -8.9 * s, 1.02 * s, -7.75 * s, 0.06 * s, 0.04 * s)).fill({ color: rim, alpha: 0.85 });
  g.poly(streak(1.25 * s, -3.5 * s, 1.2 * s, -0.6 * s, 0.05 * s, 0.05 * s)).fill({ color: rim, alpha: 0.6 });
  for (const d of [-1, 1]) g.poly([d * 0.15 * s, -8.5 * s, d * 0.62 * s, -8.66 * s, d * 0.55 * s, -8.36 * s]).fill(eye);
  return g;
}

/** flag stripes in a rect (vertical stripes when `vertical`), one fill per color */
export function stripes(g: Graphics, x: number, y: number, w: number, h: number, cols: number[], n: number, vertical = true) {
  for (let i = 0; i < n; i++) {
    const col = cols[i % cols.length];
    if (vertical) g.rect(x + (i * w) / n, y, w / n + 0.5, h).fill(col);
    else g.rect(x, y + (i * h) / n, w, h / n + 0.5).fill(col);
  }
  return g;
}

/** a flag on a pole that waves (redraw with t): pole from (x, y) up `h`, cloth w×ch with stripes `cols` */
export function wavingFlag(g: Graphics, x: number, y: number, h: number, w: number, ch: number, cols: number[], t: number, dir = 1, vertical = true) {
  g.poly(streak(x, y, x, y - h, 2.5, 2)).fill(0xd8d8d8);
  const n = cols.length * (vertical ? 1 : 1);
  const seg = 6;
  for (let i = 0; i < n; i++) {
    const pts: number[] = [];
    if (vertical) {
      // stripes across the flag's length (each a band from u0 to u1 of the width)
      const u0 = i / n;
      const u1 = (i + 1) / n;
      const wy = (u: number) => Math.sin(u * 5 - t * 6) * ch * 0.08 * u;
      pts.push(x + dir * u0 * w, y - h + wy(u0), x + dir * u1 * w, y - h + wy(u1), x + dir * u1 * w, y - h + ch + wy(u1), x + dir * u0 * w, y - h + ch + wy(u0));
    } else {
      const v0 = i / n;
      const v1 = (i + 1) / n;
      for (let k = 0; k <= seg; k++) {
        const u = k / seg;
        pts.push(x + dir * u * w, y - h + v0 * ch + Math.sin(u * 5 - t * 6) * ch * 0.08 * u);
      }
      for (let k = seg; k >= 0; k--) {
        const u = k / seg;
        pts.push(x + dir * u * w, y - h + v1 * ch + Math.sin(u * 5 - t * 6) * ch * 0.08 * u);
      }
    }
    g.poly(pts).fill(cols[i]);
  }
  return g;
}

/** radial speed lines around (cx, cy): `n` thin wedges from r0 to r1 (one fill) */
export function speedLines(g: Graphics, cx: number, cy: number, n: number, r0: number, r1: number, color: number, alpha: number, seed = 1, wid = 0.012) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.05;
    const w = wid * (0.5 + r());
    const ra = r0 * (0.8 + r() * 0.5);
    g.poly([cx + Math.cos(a) * ra, cy + Math.sin(a) * ra, cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1, cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1]);
  }
  return g.fill({ color, alpha });
}

/** a lightning bolt as one thick polygon from (x0, y0) to (x1, y1) (seeded zigzag, width w) */
export function boltPts(x0: number, y0: number, x1: number, y1: number, w: number, seed: number, seg = 7): number[] {
  const r = rnd(seed);
  const L: number[] = [];
  const R: number[] = [];
  const d = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / d;
  const ny = (x1 - x0) / d;
  for (let i = 0; i <= seg; i++) {
    const k = i / seg;
    const j = i === 0 || i === seg ? 0 : (r() - 0.5) * d * 0.18;
    const cx = x0 + (x1 - x0) * k + nx * j;
    const cy = y0 + (y1 - y0) * k + ny * j;
    const ww = w * (1 - k * 0.75);
    L.push(cx + nx * ww, cy + ny * ww);
    R.unshift(cx - nx * ww, cy - ny * ww);
  }
  return [...L, ...R];
}

/** confetti rectangles in `cols` bursting from (x, y) (kit.burst with flat bits) */
export function bits(cols: number[], s = 1) {
  return (i: number) => new Graphics().rect(-11 * s, -6 * s, 22 * s, 12 * s).fill(cols[i % cols.length]);
}

/** a layer-safe number tween on a plain object while `node` lives (kitD.drive, re-exported for the I files) */
export { drive, onCat, ngon, rnd, streak, twinkle, arcPts, hsv, beats } from './kitD';
export { C, F };
