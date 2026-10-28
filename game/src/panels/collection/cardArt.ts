/**
 * Helpers for a Multidimensional card's universe art (Signature.card in fx/sequences/multiverse/, see kit.ts): small,
 * dependency-free pieces every universe can share. Everything is drawn (no raster).
 *
 *   card(w, h, live) {
 *     const k = new Container();
 *     const g = new Graphics();
 *     bands(g, 0, 0, w, h, [0x1d3f9a, 0x6a9be6]);      // a stepped vertical gradient
 *     k.addChild(g);
 *     if (live) liveLoop(k, (t) => (star.alpha = 0.6 + 0.4 * Math.sin(t * 3)));   // dies with k
 *     return k;
 *   }
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import { settings } from '../../core/settings';

/**
 * Run fn(t, dt) at ~`fps` while `node` lives (t = seconds since start). It stops by itself when the node is destroyed
 * (any destroy path), so a live card can't leak. With Reducir movimiento it runs once (t = 0) and stops: a still frame.
 * Returns stop().
 */
export function liveLoop(node: Container, fn: (t: number, dt: number) => void, fps = 30): () => void {
  if (settings.reduceMotion) {
    fn(0, 0);
    return () => {};
  }
  let t = 0;
  let acc = 0;
  const step = 1000 / fps;
  const tick = (tk: Ticker) => {
    if (node.destroyed) return stop();
    acc += tk.deltaMS;
    if (acc < step) return;
    const dt = Math.min(0.25, acc / 1000);
    acc = 0;
    t += dt;
    fn(t, dt);
  };
  const stop = () => {
    Ticker.shared.remove(tick);
    node.off('destroyed', stop);
  };
  Ticker.shared.add(tick);
  node.once('destroyed', stop);
  fn(0, 0);
  return stop;
}

/** a seeded random in [0,1) (the same card always looks the same) */
export function seeded(seed: number) {
  let a = (seed | 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** a string → a seed */
export function seedOf(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** mix two colors (k = 0 → a, 1 → b) */
export function mix(a: number, b: number, k: number) {
  const r = ((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * k);
  const g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * k);
  const bl = (a & 255) + (((b & 255) - (a & 255)) * k);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}
/** a color's perceived brightness 0..255 */
export function lum(c: number) {
  return ((c >> 16) & 255) * 0.299 + ((c >> 8) & 255) * 0.587 + (c & 255) * 0.114;
}

/** a stepped vertical gradient through `colors` (top → bottom), `n` bands */
export function bands(g: Graphics, x: number, y: number, w: number, h: number, colors: number[], n = 24) {
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const p = k * (colors.length - 1);
    const j = Math.min(colors.length - 2, Math.floor(p));
    g.rect(x, y + (i * h) / n, w, h / n + 1).fill(colors.length > 1 ? mix(colors[j], colors[j + 1], p - j) : colors[0]);
  }
  return g;
}

/** a soft glow (concentric discs, a fake radial gradient) */
export function glow(g: Graphics, x: number, y: number, r: number, color: number, alpha = 0.5, steps = 8) {
  for (let i = steps; i >= 1; i--) g.circle(x, y, (r * i) / steps).fill({ color, alpha: alpha / steps });
  return g;
}

/** sun rays from (x,y): `n` alternating wedges out to radius r */
export function rays(g: Graphics, x: number, y: number, r: number, n: number, color: number, alpha = 0.18, rot = 0) {
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const b = a + Math.PI / n;
    g.poly([x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(b) * r, y + Math.sin(b) * r]).fill({ color, alpha });
  }
  return g;
}

/** a 4-point sparkle */
export function sparkle(g: Graphics, x: number, y: number, r: number, color = 0xffffff, alpha = 1) {
  const k = r * 0.22;
  return g.poly([x, y - r, x + k, y - k, x + r, y, x + k, y + k, x, y + r, x - k, y + k, x - r, y, x - k, y - k]).fill({ color, alpha });
}

/** halftone dots over a rect (comic print), radius growing toward `dir` ('down' | 'up' | 'flat') */
export function dots(g: Graphics, x: number, y: number, w: number, h: number, cell: number, color: number, alpha = 0.2, dir: 'down' | 'up' | 'flat' = 'down') {
  for (let yy = y + cell / 2, row = 0; yy < y + h; yy += cell, row++)
    for (let xx = x + (row % 2 ? cell / 2 : 0); xx < x + w; xx += cell) {
      const v = (yy - y) / h;
      const k = dir === 'down' ? v : dir === 'up' ? 1 - v : 0.6;
      const r = cell * 0.42 * (0.15 + 0.85 * k);
      if (r > 0.4) g.circle(xx, yy, r);
    }
  return g.fill({ color, alpha });
}
