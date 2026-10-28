/**
 * Parte III · helpers shared by the second wave of MULTIDIMENSIONAL universes (UNIVERSOS-B: Gatzilla, EMIAU, El Gritito,
 * La Gatoconda, Sonrisa, Sir Simón, Garbancito, Maneki). The base kit is kit.ts; this file only adds what those eight need.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { W } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { destroyTree } from '../../../panels/collection/ui';
import { type SigCtx, alive } from './kit';

/** a seeded random in [0,1) (mulberry32): the same city, the same crowd, every time */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** blend two 0xRRGGBB colors */
export function mix(a: number, b: number, t: number) {
  const k = Math.max(0, Math.min(1, t));
  const r = ((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * k);
  const g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * k);
  const bl = (a & 255) + (((b & 255) - (a & 255)) * k);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}

/** a vertical gradient in `steps` bands through `colors` (top → bottom) */
export function vgrad(g: Graphics, x: number, y: number, w: number, h: number, colors: number[], steps = 24) {
  for (let i = 0; i < steps; i++) {
    const u = i / (steps - 1);
    const seg = u * (colors.length - 1);
    const j = Math.min(colors.length - 2, Math.floor(seg));
    g.rect(x, y + (i * h) / steps, w, h / steps + 1).fill(mix(colors[j], colors[j + 1], seg - j));
  }
  return g;
}

/** the Catdex card's live art: fn(t) at `fps` until the node is destroyed (the card owns the node) */
export function liveLoop(node: Container, fps: number, fn: (t: number) => void) {
  const t0 = performance.now();
  const iv = window.setInterval(() => {
    if (node.destroyed) return window.clearInterval(iv);
    fn((performance.now() - t0) / 1000);
  }, 1000 / fps);
  node.once('destroyed', () => window.clearInterval(iv));
}

/**
 * Borrow the cat for the takeover (a ghost's float, a tremor's wobble, a mask that reveals it by stripes) and give it
 * back exactly as it was. give() runs at the end of the takeover and again at the payoff (a skipped reveal reaches the
 * payoff early); after it, nothing touches the cat again.
 */
export function borrowCat(c: SigCtx) {
  const cat = c.cat;
  const y0 = cat.y;
  const a0 = cat.alpha;
  const sx = cat.skew.x;
  const sy = cat.skew.y;
  let given = false;
  let maskG: Graphics | null = null;
  return {
    get given() {
      return given || cat.destroyed || !alive(c);
    },
    /** a stencil mask (lives in c.behind, so it follows the shake) */
    mask() {
      if (given || cat.destroyed) return null;
      maskG = new Graphics();
      c.behind.addChild(maskG);
      cat.mask = maskG;
      return maskG;
    },
    give() {
      if (given) return;
      given = true;
      if (!cat.destroyed) {
        cat.y = y0;
        cat.alpha = a0;
        cat.skew.set(sx, sy);
        if (maskG) cat.mask = null;
      }
      if (maskG && !maskG.destroyed) maskG.destroy();
      maskG = null;
    },
  };
}

/** per-reveal state shared by open() and payoff() (a duplicate's payoff may find nothing: keep it optional) */
export function stash<T extends object>() {
  const m = new WeakMap<Container, T>();
  return {
    set: (c: SigCtx, v: T) => m.set(c.root, v),
    get: (c: SigCtx) => m.get(c.root),
  };
}

/** fade a node out after `delay` and destroy it (tweens and all) */
export function fadeKill(node: Container, delay: number, dur = 0.4) {
  gsap.to(node, { alpha: 0, delay, duration: dur, onComplete: () => destroyTree(node) });
}

/** a word drawn letter by letter (each letter its own Text, centered on the word): for waves, wobbles, vanishings */
export function letters(text: string, size: number, fill: number, font: string = F.comic, stroke: number = C.ink, strokeW = size / 9) {
  const k = new Container();
  const ts: Text[] = [];
  let x = 0;
  for (const ch of text) {
    const t = txt(ch, { fontFamily: font, fontSize: size, fill, stroke: { color: stroke, width: strokeW, join: 'round' }, letterSpacing: 0 });
    t.anchor.set(0.5);
    t.x = x + t.width / 2;
    x += t.width * 0.94;
    k.addChild(t);
    ts.push(t);
  }
  for (const t of ts) t.x -= x / 2;
  return { k, ts, width: x };
}

/** a word with a soft glow behind (a wide faint stroke under the real one) */
export function glowWord(text: string, size: number, fill: number, glow: number, font: string = F.poster, ink: number = C.ink) {
  const k = new Container();
  const halo = txt(text, { fontFamily: font, fontSize: size, fill: glow, stroke: { color: glow, width: size / 3, join: 'round' } });
  halo.alpha = 0.3;
  const t = txt(text, { fontFamily: font, fontSize: size, fill, stroke: { color: ink, width: size / 10, join: 'round' } });
  for (const x of [halo, t]) x.anchor.set(0.5);
  k.addChild(halo, t);
  return k;
}

/** fit a node to a max width (scales it down only) */
export function fitW(node: Container, max: number) {
  if (node.width > max) node.scale.set(max / node.width);
  return node;
}

/** heads and shoulders along the bottom (a crowd seen from behind) */
export function crowd(g: Graphics, y: number, n: number, color: number, seed: number, w = W, x0 = 0) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + (i / n) * w + r() * (w / n) * 0.6;
    const s = 0.8 + r() * 0.5;
    const yy = y + r() * 30;
    g.ellipse(x, yy + 70 * s, 70 * s, 50 * s).fill(color);
    g.circle(x, yy, 34 * s).fill(color);
  }
  return g;
}

/** a puff of dust / smoke: soft circles that swell and fade */
export function puff(c: SigCtx, layer: Container, x: number, y: number, color: number, n = 6, size = 60, rise = 80) {
  if (c.reduce) return;
  for (let i = 0; i < n; i++) {
    const r = size * (0.6 + Math.random() * 0.6);
    const p = new Graphics().circle(0, 0, r).fill({ color, alpha: 0.18 }).circle(0, 0, r * 0.75).fill({ color, alpha: 0.2 }).circle(0, 0, r * 0.45).fill({ color, alpha: 0.25 });
    p.position.set(x + (Math.random() - 0.5) * size * 2.4, y + (Math.random() - 0.5) * size * 0.4);
    p.scale.set(0.3);
    layer.addChild(p);
    gsap.to(p.scale, { x: 1.4, y: 1.4, duration: 0.9 + Math.random() * 0.4, ease: 'power2.out' });
    gsap.to(p, { y: p.y - rise * (0.5 + Math.random()), x: p.x + (Math.random() - 0.5) * 60, alpha: 0, duration: 1 + Math.random() * 0.5, ease: 'power1.out', onComplete: () => destroyTree(p) });
  }
}
