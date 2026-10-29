/**
 * Shared helpers for the post-Parte III «cartoons and comic strips» universes (UNIVERSOS-F: El Michipulín Colorado,
 * Condorgato, Miauby-Doo, Blumiau, Michi Esponja, Rick Michez, Gatogro, Grrrú, Miaunion). The base kit is kit.ts;
 * kitA–kitD hold the earlier waves' helpers (imported, never edited). This file adds:
 * - coarse polygon shapes (rounded rects, rotations, hand-cut jitter, puffs, halftone dots): Pixi pools one batcher per
 *   Graphics over ~400 vertices and the pool never shrinks, so every Graphics here stays far under ~25k vertices — a
 *   10-sided poly() costs 10, a circle() or a stroked curve costs hundreds;
 * - PREBUILT words: a big stroked Text costs a 100–170 ms frame when it's created mid-shot, so every title of a takeover is
 *   built at open() (alpha ≈ 0, already uploaded) and only shown on its beat (`pre` + `pop`), and the payoff's big line +
 *   its aside are built at open() too (`payline`);
 * - borrowing the silhouette for a hop or a tremble, given back whole at the end and again at the payoff (a skipped
 *   reveal reaches the payoff early: the takeover's beats go through kitC's `beat`, which drops them once it landed).
 */
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { destroyTree } from '../../../panels/collection/ui';
import { type SigCtx, CHEER, alive, later } from './kit';
import { beat, borrowPose, paid } from './kitC';

export const TAU = Math.PI * 2;

// --- shapes -----------------------------------------------------------------------------------
/** a rounded rectangle as one polygon (`n` segments per corner: 4 sides + 4·n points, never radius-dependent) */
export function rrect(x: number, y: number, w: number, h: number, r: number, n = 3): number[] {
  const p: number[] = [];
  const rr = Math.min(r, w / 2, h / 2);
  const corners: [number, number, number][] = [
    [x + w - rr, y + rr, -Math.PI / 2],
    [x + w - rr, y + h - rr, 0],
    [x + rr, y + h - rr, Math.PI / 2],
    [x + rr, y + rr, Math.PI],
  ];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((Math.PI / 2) * i) / n;
      p.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
  return p;
}

/** points rotated by `a` around (cx, cy) */
export function rot(pts: number[], cx: number, cy: number, a: number): number[] {
  const cs = Math.cos(a);
  const sn = Math.sin(a);
  const out: number[] = [];
  for (let i = 0; i < pts.length; i += 2) {
    const dx = pts[i] - cx;
    const dy = pts[i + 1] - cy;
    out.push(cx + dx * cs - dy * sn, cy + dx * sn + dy * cs);
  }
  return out;
}

/** points moved by (dx, dy) and scaled by (sx, sy) around the origin first */
export function xf(pts: number[], dx: number, dy: number, sx = 1, sy = sx): number[] {
  const out: number[] = [];
  for (let i = 0; i < pts.length; i += 2) out.push(pts[i] * sx + dx, pts[i + 1] * sy + dy);
  return out;
}

/** a seeded random in [0,1) (mulberry32) */
export function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** hand-cut paper: every point nudged by up to `amp` (seeded, so the same cut every time) */
export function jitter(pts: number[], amp: number, seed: number): number[] {
  const r = rand(seed);
  return pts.map((v) => v + (r() - 0.5) * 2 * amp);
}

/** an ellipse as a polygon (n sides) */
export function oval(x: number, y: number, rx: number, ry = rx, n = 16, a0 = 0): number[] {
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU;
    p.push(x + Math.cos(a) * rx, y + Math.sin(a) * ry);
  }
  return p;
}

/** a cloud / dust puff: overlapping ovals filled in one go (`k` lobes along a flat base) */
export function puffs(g: Graphics, x: number, y: number, w: number, h: number, k: number, color: number, alpha = 1, seed = 1) {
  const r = rand(seed);
  for (let i = 0; i < k; i++) {
    const u = k === 1 ? 0.5 : i / (k - 1);
    const rx = (w / k) * (0.75 + r() * 0.5);
    const ry = h * (0.45 + r() * 0.4) * (1 - Math.abs(u - 0.5) * 0.7);
    g.poly(oval(x - w / 2 + u * w, y - ry * 0.4, rx, ry, 12));
  }
  return g.fill({ color, alpha });
}

/** halftone print: a grid of little diamonds over (x, y, w, h), bigger toward `dir` ('down' | 'up' | 'none'); one fill */
export function halftone(g: Graphics, x: number, y: number, w: number, h: number, gap: number, r: number, color: number, alpha = 1, dir: 'down' | 'up' | 'none' = 'none') {
  let row = 0;
  for (let yy = y + gap / 2; yy < y + h; yy += gap, row++) {
    const k = dir === 'none' ? 1 : dir === 'down' ? 0.25 + 0.75 * ((yy - y) / h) : 1 - 0.75 * ((yy - y) / h);
    const rr = r * k;
    if (rr < 0.6) continue;
    for (let xx = x + (row % 2 ? gap / 2 : 0); xx < x + w; xx += gap) g.poly([xx, yy - rr, xx + rr, yy, xx, yy + rr, xx - rr, yy]);
  }
  return g.fill({ color, alpha });
}

/** a tapered quad from (x0,y0) to (x1,y1), half-widths w0 → w1 (beams, speed lines, sticks) */
export function bar(x0: number, y0: number, x1: number, y1: number, w0: number, w1 = w0): number[] {
  const d = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = (-(y1 - y0) / d) * 1;
  const ny = (x1 - x0) / d;
  return [x0 + nx * w0, y0 + ny * w0, x1 + nx * w1, y1 + ny * w1, x1 - nx * w1, y1 - ny * w1, x0 - nx * w0, y0 - ny * w0];
}

/** an n-pointed star polygon (outer r, inner ri) */
export function star(x: number, y: number, r: number, ri: number, n = 5, a0 = -Math.PI / 2): number[] {
  const p: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = a0 + (i / (n * 2)) * TAU;
    const rr = i % 2 ? ri : r;
    p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  return p;
}

/** soft light: concentric polygon discs, additive-friendly (the same few vertices at any size) */
export function glow(r: number, color: number, alpha = 0.5, steps = 7, n = 24, ry = r, g = new Graphics()) {
  for (let i = steps; i >= 1; i--) g.poly(oval(0, 0, (r * i) / steps, (ry * i) / steps, n)).fill({ color, alpha: alpha / steps });
  return g;
}

// --- words ------------------------------------------------------------------------------------
/** one big Text: fill, an ink outline and a hard drop shadow (ONE texture: build it at open(), show it later) */
export function title(text: string, o: { size: number; fill: number; ink?: number; inkW?: number; shadow?: number | null; font?: string; align?: 'left' | 'center' | 'right'; spacing?: number; style?: TextStyleOptions }): Text {
  const ink = o.ink ?? C.ink;
  const t = txt(text, {
    fontFamily: o.font ?? F.comic,
    fontSize: o.size,
    fill: o.fill,
    align: o.align ?? 'center',
    letterSpacing: o.spacing ?? 2,
    lineHeight: o.size * 1.02,
    stroke: { color: ink, width: o.inkW ?? o.size / 8, join: 'round' },
    ...(o.shadow === null ? {} : { dropShadow: { color: o.shadow ?? ink, distance: o.size / 14, angle: Math.PI / 3, blur: 0, alpha: 1 } }),
    ...o.style,
  });
  t.anchor.set(0.5);
  return t;
}

/**
 * put a prebuilt node on `layer` at (x, y), invisible but uploaded (alpha ≈ 0); show it with pop(). A burst of pre() calls
 * (an open() parking ten stroked words) is staggered two frames apart: each Text rasterizes when it's first drawn, and
 * all of them in one frame cost a 60 ms hitch. pop() shows a word at once even if its turn hasn't come yet.
 */
let preN = 0;
let preT = 0;
export function pre<T extends Container>(layer: Container, node: T, x: number, y: number, rotation = 0): T {
  node.position.set(x, y);
  node.rotation = rotation;
  node.alpha = 0.001;
  layer.addChild(node);
  const now = performance.now();
  if (now - preT > 500) preN = 0;
  preT = now;
  const k = preN++;
  if (k > 0) {
    node.visible = false;
    gsap.delayedCall(k * 0.034, () => {
      if (!node.destroyed) node.visible = true;
    });
  }
  return node;
}

/**
 * show a prebuilt node on its beat (`at` s, dropped if the payoff already landed): it slams in from `from`× (still with
 * Reducir movimiento), holds `hold` s and fades away (destroyed). onShow runs as it appears (sfx, shake).
 */
export function pop(c: SigCtx, node: Container, at: number, hold: number, o: { from?: number; out?: number; onShow?: () => void; keep?: boolean } = {}) {
  beat(c, at, () => {
    if (node.destroyed) return;
    node.alpha = 1;
    node.visible = true;
    o.onShow?.();
    const sx = node.scale.x;
    const sy = node.scale.y;
    if (!c.reduce) gsap.fromTo(node.scale, { x: sx * (o.from ?? 2.2), y: sy * (o.from ?? 2.2) }, { x: sx, y: sy, duration: 0.16, ease: 'back.out(3)' });
    if (!o.keep) gsap.to(node, { alpha: 0, delay: hold, duration: o.out ?? 0.25, onComplete: () => destroyTree(node) });
  });
  // whatever happens, it never outlives the takeover once the payoff lands (a skip)
  return node;
}

/** drop every prebuilt takeover word still waiting (the payoff landed early: a skip) */
export function sweep(nodes: Container[]) {
  for (const n of nodes) if (!n.destroyed && n.alpha < 0.01) destroyTree(n);
}

/**
 * the payoff's big line + the little aside under it: BUILT DURING THE TAKEOVER (at `buildAt` s, invisible at the CHEER
 * spot — or on the spot if a skip brings the payoff first) and landed by payoff(): the line slams in, the aside fades in a
 * beat later, both leave after `dur`. Fits `maxW`.
 */
export function payline(c: SigCtx, makeMain: () => Text, makeAside: (() => Text) | null, o: { maxW?: number; rot?: number; at?: [number, number]; asideDy?: number; buildAt?: number } = {}) {
  const k = new Container();
  let built = false;
  let aside: Text | null = null;
  const build = () => {
    if (built || k.destroyed) return;
    built = true;
    const main = makeMain();
    const fit = Math.min(1, (o.maxW ?? 760) / Math.max(1, main.width));
    main.scale.set(fit);
    k.addChild(main);
    if (makeAside) {
      aside = makeAside();
      const af = Math.min(1, 700 / Math.max(1, aside.width));
      aside.scale.set(af);
      aside.position.set(30, (main.height * fit) / 2 + (aside.height * af) / 2 + (o.asideDy ?? 6));
      aside.alpha = 0;
      k.addChild(aside);
    }
    const at = o.at ?? CHEER;
    pre(c.fg, k, at[0], at[1], o.rot ?? -0.05);
  };
  if (c.short) build();
  else later(c, o.buildAt ?? 0.25, build);
  let landed = false;
  return {
    k,
    land(dur = 2.2, asideDelay = 0.5) {
      if (landed || k.destroyed) return;
      build();
      landed = true;
      k.alpha = 1;
      k.visible = true;
      c.fg.addChild(k); // on top of whatever the payoff added
      if (!c.reduce) gsap.fromTo(k.scale, { x: 1.7, y: 1.7 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
      const as = aside as Text | null;
      if (as) {
        if (c.reduce) gsap.to(as, { alpha: 1, duration: 0.2, delay: 0.2 });
        else {
          gsap.to(as, { alpha: 1, duration: 0.25, delay: asideDelay });
          gsap.fromTo(as, { x: as.x - 40 }, { x: as.x, duration: 0.3, delay: asideDelay, ease: 'power3.out' });
        }
      }
      gsap.to(k, { alpha: 0, delay: dur, duration: 0.4, onComplete: () => destroyTree(k) });
    },
  };
}

/** the aside's look: a small italic-ish line in the universe's colors */
export function asideText(text: string, fill: number, ink: number = C.ink, size = 46, font: string = F.comic) {
  const t = txt(text, { fontFamily: font, fontSize: size, fill, letterSpacing: 1, stroke: { color: ink, width: size / 6, join: 'round' } });
  t.anchor.set(0.5);
  return t;
}

/** a small flat word that floats up and fades (canned laughs, sobs, beeps) — cheap enough to build mid-shot */
export function floaty(c: SigCtx, layer: Container, x: number, y: number, text: string, style: TextStyleOptions, rise = 70, dur = 0.9) {
  const t = txt(text, style);
  t.anchor.set(0.5);
  t.position.set(x, y);
  t.rotation = (Math.random() - 0.5) * 0.25;
  layer.addChild(t);
  if (c.reduce) {
    gsap.to(t, { alpha: 0, delay: dur * 0.8, duration: 0.2, onComplete: () => destroyTree(t) });
    return t;
  }
  gsap.fromTo(t.scale, { x: 0.3, y: 0.3 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
  gsap.to(t, { y: y - rise, duration: dur, ease: 'power1.out' });
  gsap.to(t, { alpha: 0, delay: dur * 0.6, duration: dur * 0.4, onComplete: () => destroyTree(t) });
  return t;
}

// --- the silhouette ---------------------------------------------------------------------------
/**
 * borrow the silhouette for a hop / tremble / lean during the takeover; it's given back (x, y, rotation, alpha — never
 * the scale, the reveal squashes it) at the end of the move and again when the payoff lands. Returns give().
 */
export function borrowFor(c: SigCtx, at: number, dur: number, move: (cat: Container, x0: number, y0: number, u: number) => void) {
  const b = borrowPose(c);
  if (c.reduce || c.short) return () => b.give();
  beat(c, at, () => {
    if (b.given) return;
    const p = { u: 0 };
    gsap.to(p, {
      u: 1,
      duration: dur,
      ease: 'none',
      onUpdate: () => {
        if (b.given || paid(c)) return b.give();
        move(c.cat, b.x0, b.y0, p.u);
      },
      onComplete: () => b.give(),
    });
  });
  later(c, at + dur + 0.05, () => b.give());
  return () => b.give();
}

export const isOpen = alive;

// --- the yellow helpers (Grrrú's lair, Miaunion's stampede) -----------------------------------
/**
 * a yellow capsule helper with cat ears, silver goggles (1 or 2 eyes) and blue overalls; origin at its feet. Its legs
 * and the waving arm are their own Graphics: run(t) swings the legs, the arm can wave. ~200 vertices.
 */
export function capsule(s: number, o: { eyes?: 1 | 2; tall?: number; look?: number; flat?: boolean } = {}) {
  const k = new Container();
  const hgt = 150 * s * (o.tall ?? 1);
  const wd = 84 * s;
  const ink = { width: 4 * s, color: 0x1a1a2a, join: 'round' as const };
  // flat = a still (a Catdex grid card): legs, body and arm in ONE Graphics
  const body = new Graphics();
  const legs = o.flat ? [body, body] : [new Graphics(), new Graphics()];
  legs.forEach((g, i) => {
    const dx = o.flat ? (i ? 16 : -16) * s : 0;
    const dy = o.flat ? -30 * s : 0;
    g.poly([dx - 9 * s, dy, dx + 9 * s, dy, dx + 9 * s, dy + 26 * s, dx - 9 * s, dy + 26 * s]).fill(0x2f5fb0).poly(oval(dx + (i ? 6 * s : -6 * s), dy + 28 * s, 14 * s, 7 * s, 8)).fill(0x1a1a2a);
    if (!o.flat) g.position.set((i ? 16 : -16) * s, -30 * s);
  });
  body.poly(rrect(-wd / 2, -hgt, wd, hgt - 22 * s, wd / 2, 5)).fill(0xffd93a).stroke(ink);
  body.poly([-24 * s, -hgt * 0.06 - 22 * s, -30 * s, -hgt + 6 * s, -14 * s, -hgt + 16 * s]).fill(0xffd93a);
  // cat ears
  body.poly([-wd * 0.36, -hgt + 20 * s, -wd * 0.3, -hgt - 18 * s, -wd * 0.08, -hgt + 6 * s]).fill(0xffd93a).stroke(ink);
  body.poly([wd * 0.36, -hgt + 20 * s, wd * 0.3, -hgt - 18 * s, wd * 0.08, -hgt + 6 * s]).fill(0xffd93a).stroke(ink);
  // overalls
  body.poly([-wd / 2 + 2 * s, -hgt * 0.42, wd / 2 - 2 * s, -hgt * 0.42, wd / 2 - 2 * s, -36 * s, wd * 0.3, -22 * s, -wd * 0.3, -22 * s, -wd / 2 + 2 * s, -36 * s]).fill(0x2f5fb0).stroke(ink);
  body.rect(-wd * 0.22, -hgt * 0.42, wd * 0.44, 22 * s).fill(0x2f5fb0).poly(oval(0, -hgt * 0.32, 10 * s, 8 * s, 8)).fill(0x1a1a2a);
  // goggles on their strap
  const gy = -hgt * 0.68;
  body.rect(-wd / 2, gy - 6 * s, wd, 12 * s).fill(0x2a2a2a);
  const eyes = o.eyes ?? 2;
  const look = (o.look ?? 0) * 4 * s;
  const ex = eyes === 1 ? [0] : [-16 * s, 16 * s];
  for (const x of ex) {
    body.poly(oval(x, gy, 20 * s, 20 * s, 14)).fill(0xc0c6cc).stroke(ink);
    body.poly(oval(x, gy, 13 * s, 13 * s, 12)).fill(0xffffff);
    body.poly(oval(x + look, gy + 1 * s, 6 * s, 7 * s, 10)).fill(0x6a4020).poly(oval(x + look + 1 * s, gy, 3 * s, 4 * s, 8)).fill(0x111111);
  }
  body.poly([-12 * s, -hgt * 0.5, 0, -hgt * 0.47, 12 * s, -hgt * 0.5, 0, -hgt * 0.44]).fill(0x5a2a1a);
  // arms: the left hangs, the right can wave
  body.poly(bar(-wd / 2 + 2 * s, -hgt * 0.45, -wd / 2 - 14 * s, -hgt * 0.25, 6 * s)).fill(0xffd93a).stroke(ink);
  const arm = o.flat ? body : new Graphics();
  const ax = o.flat ? wd / 2 - 2 * s : 0;
  const ay = o.flat ? -hgt * 0.45 : 0;
  arm.poly(bar(ax, ay, ax + 18 * s, ay + 22 * s, 6 * s)).fill(0xffd93a).stroke(ink);
  arm.poly(oval(ax + 20 * s, ay + 26 * s, 8 * s, 8 * s, 8)).fill(0x1a1a2a);
  if (o.flat) {
    k.addChild(body);
    return { k, arm, run(_t: number) {} };
  }
  arm.position.set(wd / 2 - 2 * s, -hgt * 0.45);
  k.addChild(legs[0], legs[1], body, arm);
  return {
    k,
    arm,
    run(t: number) {
      legs[0].rotation = Math.sin(t * 18) * 0.6;
      legs[1].rotation = -Math.sin(t * 18) * 0.6;
      body.y = -Math.abs(Math.sin(t * 18)) * 6 * s;
      arm.y = body.y - hgt * 0.45;
    },
  };
}

/** a banana (crescent, peel tips), origin at its middle */
export function banana(s: number, into?: Graphics, x = 0, y = 0) {
  const g = into ?? new Graphics();
  const outer: number[] = [];
  const inner: number[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.15 + (i / 10) * Math.PI * 0.7;
    outer.push(x + Math.cos(a) * 60 * s, y + Math.sin(a) * 60 * s - 40 * s);
    inner.push(x + Math.cos(a) * 40 * s, y + Math.sin(a) * 34 * s - 32 * s);
  }
  const pts = [...outer];
  for (let i = inner.length - 2; i >= 0; i -= 2) pts.push(inner[i], inner[i + 1]);
  g.poly(pts).fill(0xffe14d).stroke({ width: 4 * s, color: 0x6a4a10, join: 'round' });
  g.poly(bar(outer[0], outer[1], outer[0] + 10 * s, outer[1] - 8 * s, 4 * s)).fill(0x6a4a10);
  g.poly(oval(outer[20], outer[21], 5 * s, 5 * s, 6)).fill(0x3a2a10);
  return g;
}
