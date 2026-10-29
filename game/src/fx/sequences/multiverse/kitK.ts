/**
 * Helpers for the «tanda 2» universes of UNIVERSOS-K (museo, ciencia, clásica, anime, videojuegos y libros: La Michi de
 * la Perla, Isaac Miauton, Miauzart, Miausagi, Tanjimiau, Tetrimiau, Lara Croqueta, El Michíncipe). The base kit is
 * kit.ts; kitA–kitI hold the earlier waves' helpers (imported, never edited). This file adds:
 * - `headline()`: the payoff's big line + its small aside, BUILT AT open() (alpha ≈ 0, so the stroked Text rasterizes
 *   under the seal's break, not at the color fill) and landed at payoff();
 * - shapes as fixed-vertex polygons: `taper` (a polyline as a tapered strip: ribbons, scarves, a dragon, a braid),
 *   `blob` (an irregular soft shape: watercolor washes, clouds, foliage), `hgrad` (a horizontal gradient), `glow`
 *   (concentric n-gons, a fake radial gradient), `glint` (a 4-point star with a halo);
 * - `loop()`: an ambient redraw at `fps` while the reveal is open (one still frame with Reducir movimiento).
 * Same rules as kitD: everything is COARSE POLYGONS (Pixi pools one batcher per Graphics over ~400 vertices and the pool
 * never shrinks): every single Graphics stays well under ~25k vertices, above all in card(…, live) at the Catdex's full
 * page (3184×950).
 */
import { Container, Graphics, type Text, type TextStyleOptions } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { destroyTree } from '../../../panels/collection/ui';
import { type SigCtx, CHEER, alive } from './kit';
import { mix, rng } from './kitB';
import { ngon } from './kitD';

export const TAU = Math.PI * 2;

// --- the payoff's words -----------------------------------------------------------------------
/**
 * The payoff's big line (any node: a comic word, a serif title, a pixel word) and its small aside under it, built NOW
 * (at open) at the CHEER spot, nearly invisible; land() at the payoff scales it in, fades the aside in a beat later and
 * takes both away after `dur`. A duplicate / skipped reveal lands it the same way.
 */
export function headline(
  c: SigCtx,
  main: Container,
  aside: string | null,
  o: { at?: [number, number]; maxW?: number; rot?: number; asideStyle?: TextStyleOptions; asideDy?: number } = {},
) {
  const k = new Container();
  const fit = Math.min(1, (o.maxW ?? 760) / Math.max(1, main.width));
  main.scale.set(main.scale.x * fit, main.scale.y * fit);
  k.addChild(main);
  let a: Text | null = null;
  if (aside) {
    a = txt(aside, { fontFamily: F.comic, fontSize: 46, fill: C.paper, stroke: { color: C.ink, width: 8, join: 'round' }, letterSpacing: 1, ...o.asideStyle });
    a.anchor.set(0.5);
    if (a.width > 720) a.scale.set(720 / a.width);
    a.position.set(30, main.height / 2 + a.height / 2 + (o.asideDy ?? 6));
    a.alpha = 0.001;
    k.addChild(a);
  }
  const at = o.at ?? CHEER;
  k.position.set(at[0], at[1]);
  k.rotation = o.rot ?? -0.05;
  k.alpha = 0.001;
  c.fg.addChild(k);
  return (lo: { dur?: number; slow?: boolean; asideDelay?: number } = {}) => {
    if (k.destroyed || !alive(c)) return;
    k.alpha = 1;
    if (a) a.alpha = 0;
    if (!c.reduce) {
      if (lo.slow) {
        k.alpha = 0;
        gsap.to(k, { alpha: 1, duration: 0.55, ease: 'power1.out' });
        gsap.fromTo(k.scale, { x: 1.12, y: 1.12 }, { x: 1, y: 1, duration: 1.2, ease: 'power2.out' });
      } else gsap.fromTo(k.scale, { x: 1.7, y: 1.7 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
    }
    if (a) gsap.to(a, { alpha: 1, duration: 0.3, delay: c.reduce ? 0.2 : (lo.asideDelay ?? 0.6) });
    gsap.to(k, { alpha: 0, delay: lo.dur ?? 2.4, duration: 0.45, onComplete: () => destroyTree(k) });
  };
}

/** a single styled Text, centered on its anchor (a serif title, a pixel caption, a soft word) */
export function word1(text: string, style: TextStyleOptions) {
  const t = txt(text, { align: 'center', ...style });
  t.anchor.set(0.5);
  return t;
}

// --- shapes -----------------------------------------------------------------------------------
/** a polyline (x,y pairs) as one tapered strip polygon: half-width w0 at the start → w1 at the end */
export function taper(pts: number[], w0: number, w1 = w0): number[] {
  const n = pts.length / 2;
  const L: number[] = [];
  const R: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    const dx = pts[b * 2] - pts[a * 2];
    const dy = pts[b * 2 + 1] - pts[a * 2 + 1];
    const d = Math.hypot(dx, dy) || 1;
    const w = w0 + (w1 - w0) * (n > 1 ? i / (n - 1) : 0);
    L.push(pts[i * 2] - (dy / d) * w, pts[i * 2 + 1] + (dx / d) * w);
    R.push(pts[i * 2] + (dy / d) * w, pts[i * 2 + 1] - (dx / d) * w);
  }
  const out = L;
  for (let i = n - 1; i >= 0; i--) out.push(R[i * 2], R[i * 2 + 1]);
  return out;
}

/** an irregular round shape (a wash, a cloud, a bush): `n` points, radius wobbling by `wob` (seeded) */
export function blob(x: number, y: number, rx: number, ry: number, seed: number, n = 14, wob = 0.22): number[] {
  const r = rng(seed);
  const ph = r() * TAU;
  const k = 2 + Math.floor(r() * 3);
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const f = 1 + wob * (Math.sin(a * k + ph) * 0.6 + (r() - 0.5) * 0.8);
    p.push(x + Math.cos(a) * rx * f, y + Math.sin(a) * ry * f);
  }
  return p;
}

/** a horizontal gradient in `steps` vertical bands through `colors` (left → right) */
export function hgrad(g: Graphics, x: number, y: number, w: number, h: number, colors: number[], steps = 24) {
  for (let i = 0; i < steps; i++) {
    const u = i / (steps - 1);
    const seg = u * (colors.length - 1);
    const j = Math.min(colors.length - 2, Math.floor(seg));
    g.rect(x + (i * w) / steps, y, w / steps + 1, h).fill(mix(colors[j], colors[j + 1], seg - j));
  }
  return g;
}

/** a soft glow: `steps` concentric n-gons of `color`, faint at the rim (a fake radial gradient) */
export function glow(g: Graphics, x: number, y: number, r: number, color: number, alpha = 0.4, steps = 7, n = 24, ry = r) {
  for (let i = steps; i >= 1; i--) g.poly(ngon(x, y, (r * i) / steps, (ry * i) / steps, n)).fill({ color, alpha: alpha / steps });
  return g;
}

/** a glint: a long 4-point star (+ a short diagonal one and a halo), all polygons */
export function glint(g: Graphics, x: number, y: number, r: number, color = 0xffffff, alpha = 1) {
  const q = r * 0.12;
  glow(g, x, y, r * 0.55, color, 0.5 * alpha, 4, 14);
  g.poly([x, y - r, x + q, y - q, x + r, y, x + q, y + q, x, y + r, x - q, y + q, x - r, y, x - q, y - q]).fill({ color, alpha });
  const d = r * 0.42;
  const e = q * 0.8;
  g.poly([x - d, y - d, x, y - e, x + d, y - d, x + e, y, x + d, y + d, x, y + e, x - d, y + d, x - e, y]).fill({ color, alpha: alpha * 0.8 });
  return g;
}

/**
 * fn(t) at `fps` while the reveal is open and `node` lives; with Reducir movimiento it draws one frame at `still`.
 * Returns a redraw (one frame now): Reducir movimiento calls it after a beat changes the state.
 */
export function loop(c: SigCtx, node: Container, fps: number, fn: (t: number) => void, still = 0) {
  const redraw = () => !node.destroyed && alive(c) && fn(still);
  fn(c.reduce ? still : 0);
  if (c.reduce) return redraw;
  const t0 = performance.now();
  const iv = window.setInterval(() => {
    if (!alive(c) || node.destroyed) return window.clearInterval(iv);
    fn((performance.now() - t0) / 1000);
  }, 1000 / fps);
  return redraw;
}

/** a seeded pick from a list */
export function pick<T>(r: () => number, list: T[]): T {
  return list[Math.floor(r() * list.length) % list.length];
}

export { C, F };
