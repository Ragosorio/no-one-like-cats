/**
 * Parte III · the MULTIDIMENSIONAL reveals: each of the 9 cats with art brings its own universe into the reveal
 * (fx/sequences/catReveal.ts). The seal breaks, the universe takes the screen for SIG_LEN seconds around the
 * silhouette (donuts, webs, a bat-signal…), the rarity reprints, and the color fill is the universe's payoff.
 * Everything is drawn here (no raster). `reduce` = Reducir movimiento (the universe arrives still);
 * `flashes` false = Reducir destellos (no strobes, no white flashes).
 *
 * ── FULL SCREEN, ANY ASPECT (rule since 2026-10-29) ──────────────────────────────────────────────────────────────
 * The reveal covers the WHOLE real screen (16:9, 3:2, 4:3, 21:9, phones), not just the 1920×1080 design box. How:
 *  • `c.back` (your scenery) is COVER-SCALED by the host: draw the background to the box — (0, 0, W, H), `cover()`,
 *    `vgrad(g, 0, 0, W, H, …)`, `starfield(g, 0, 0, W, H, …)` — and it fills any screen. The box's edges may be cropped
 *    (up to ~240 px left/right on 4:3, ~130 px top/bottom on 21:9), so in `back` keep the important bits (a moon, a
 *    sign, a skyline's hero building) away from the edges, and a floor that must show stays above y ≈ H − 140.
 *    You may move / rotate / scale `c.back` itself (a dutch tilt): the host scales a wrapper around it.
 *    Since `back` scales and `fg` doesn't, a prop that must stand ON a floor goes in the same layer as that floor.
 *  • `c.behind`, `c.fg` and the cat are NOT scaled: they live in the design box, which always shows whole (the payoff
 *    word `cheer()`, `aside()`, `title()`, balloons, captions: anything readable goes here and stays visible).
 *    Anything there that must cover the whole screen (a flash, a tint, an iris, a vignette, rain) must NOT use
 *    `rect(0, 0, W, H)`: use `cover()` / `flashOf()` (they paint the real screen), or `viewIn(c, layer)` for the real
 *    screen's rect in that layer (`fall()` and `drizzle()` already spread over it).
 *  • Check a new universe at 21:9 (2100×900) and 4:3 (1600×1200) too, not only 16:9 (UI-FIX's headless harness,
 *    session scratchpad `ui-fix/reveal.mjs <out> <tag> <WxH> <species…>`).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H, game } from '../../../core/App';
import { followView } from '../../../ui/screen';
import { C, F } from '../../../ui/theme';
import { poster } from '../../../ui/widgets';
import { onomatopoeia, type Shaker } from '../../juice';
import { sfx, type SfxName } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';

/** how long the universe holds the screen before the rarity reprints (the reveal shifts by this) */
export const SIG_LEN = 2.2;

export interface SigCtx {
  /** the reveal (destroyed when it closes) */
  root: Container;
  /** the universe: over the paper and the side blocks, under the big MULTIDIMENSIONAL */
  back: Container;
  /** between the pink disc and the cat (auras, webs) */
  behind: Container;
  /** over the cat (rain, bursts, words) */
  fg: Container;
  /** the pink disc behind the cat */
  circle: Graphics;
  /** the cat (a silhouette until the color fill) */
  cat: Container;
  /** center of the disc; the cat rests at (W/2, catY) */
  CY: number;
  catY: number;
  shaker: Shaker;
  reduce: boolean;
  flashes: boolean;
  /** a duplicate: the universe is simply there, no takeover */
  short: boolean;
}

export interface Signature {
  /** a dark universe: the name and the texts go light */
  dark: boolean;
  /** the card's frame */
  frame: number;
  /** the plate stamped over MULTIDIMENSIONAL */
  tag: string;
  /** at the seal's break: the universe takes the screen (SIG_LEN s); `short`: it's already there */
  open(c: SigCtx): void;
  /** at the color fill: the universe's payoff */
  payoff(c: SigCtx): void;
  /**
   * the Catdex card's universe (its own art behind the painting): a Container sized to the art window (w×h, origin at its
   * top-left; the card clips it). `live` = the detail page (it may animate itself, cleaning up when destroyed); otherwise
   * static (the grid draws up to 155 cards — keep it cheap: a few Graphics, no tickers).
   */
  card?(w: number, h: number, live: boolean): Container;
}

export const alive = (c: SigCtx) => !c.root.destroyed;

/** fn after `s` seconds, if the reveal is still open */
export function later(c: SigCtx, s: number, fn: () => void) {
  gsap.delayedCall(s, () => alive(c) && fn());
}

/** fn(t) every frame-ish at `fps` while the reveal is open (t = seconds since start) */
export function every(c: SigCtx, fps: number, fn: (t: number) => void) {
  const t0 = performance.now();
  const iv = window.setInterval(() => {
    if (!alive(c)) return window.clearInterval(iv);
    fn((performance.now() - t0) / 1000);
  }, 1000 / fps);
  return () => window.clearInterval(iv);
}

/** sfx at each [seconds, name, pitch] while the reveal is open */
export function score(c: SigCtx, notes: [number, SfxName, number?][]) {
  for (const [t, n, p] of notes) later(c, t, () => sfx(n, p ?? 1));
}

/** how far full-screen paint runs past the screen's edge (the reveal's shake moves and tilts the root a little) */
const BLEED = 80;

/**
 * a full-screen rectangle: the REAL screen (game.view, any aspect) plus the design box, with a bleed; it repaints
 * itself on resize. Safe in any layer (in the cover-scaled `back` it simply overshoots).
 */
export function cover(color: number, alpha = 1) {
  const g = new Graphics();
  followView(g, (v) => {
    const x0 = Math.min(0, v.x) - BLEED;
    const y0 = Math.min(0, v.y) - BLEED;
    const x1 = Math.max(W, v.x + v.w) + BLEED;
    const y1 = Math.max(H, v.y + v.h) + BLEED;
    g.clear().rect(x0, y0, x1 - x0, y1 - y0).fill({ color, alpha });
  });
  return g;
}

/**
 * the real screen's rectangle in `layer`'s own coordinates: in `c.fg` / `c.behind` it's game.view (wider or taller
 * than the box off 16:9); in the cover-scaled `c.back` it's the part of the box that shows. `bleed` grows it.
 */
export function viewIn(c: SigCtx, layer: Container = c.fg, bleed = 0) {
  const v = game.view;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of [
    [v.x - bleed, v.y - bleed],
    [v.x + v.w + bleed, v.y - bleed],
    [v.x - bleed, v.y + v.h + bleed],
    [v.x + v.w + bleed, v.y + v.h + bleed],
  ]) {
    const p = layer.destroyed ? { x, y } : layer.toLocal({ x, y }, game.root);
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** the universe arrives: fades in (or is there at once on a duplicate / reduced motion) */
export function arrive(c: SigCtx, node: Container, dur = 0.35) {
  if (c.short || c.reduce) return;
  node.alpha = 0;
  gsap.to(node, { alpha: 1, duration: dur });
}

/** a comic word with CMYK ghosts */
export function word(c: SigCtx, x: number, y: number, text: string, color: number, size = 110, dur = 1.2, font: string = F.comic) {
  return onomatopoeia(c.fg, x, y, text, { color, size, dur, font });
}

/** where the payoff's word lands: lower left, clear of the lore box (upper right), the element stamp (upper left) and the name */
export const CHEER: [number, number] = [430, 700];

/** the payoff's big word, sized to fit the lower-left corner */
export function cheer(c: SigCtx, text: string, color: number, size = 120, dur = 1.8, font: string = F.comic) {
  const fit = Math.min(size, 760 / Math.max(1, text.length * 0.52));
  return onomatopoeia(c.fg, CHEER[0], CHEER[1], text, { color, size: fit, dur, font });
}

/** a stamped plate: poster text on a colored, inked box */
export function plate(text: string, fill: number, ink: number = C.ink, size = 40, color: number = C.paper) {
  const p = new Container();
  // dark text gets a light outline (an ink outline on ink text is a blot)
  const t = poster(text, size, color, { stroke: { color: color === ink ? C.paper : ink, width: size / 6 } });
  t.anchor.set(0.5);
  const b = new Graphics()
    .rect(-t.width / 2 - 22 + 6, -t.height / 2 - 4 + 6, t.width + 44, t.height + 8)
    .fill(ink)
    .rect(-t.width / 2 - 22, -t.height / 2 - 4, t.width + 44, t.height + 8)
    .fill(fill)
    .stroke({ width: 5, color: ink });
  p.addChild(b, t);
  return p;
}

/** a plate that slams in (scale 2.4 → 1) */
export function slam(layer: Container, node: Container, x: number, y: number, rot = -0.06) {
  node.position.set(x, y);
  node.rotation = rot;
  layer.addChild(node);
  gsap.fromTo(node.scale, { x: 2.4, y: 2.4 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
  return node;
}

/** a comic starburst polygon (KA-POW!) */
export function starburst(g: Graphics, r: number, spikes: number, fill: number, ink: number = C.ink, jag = 0.62) {
  const pts: number[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * jag * (0.9 + ((i * 37) % 10) / 50) : r * (0.92 + ((i * 53) % 10) / 60);
    pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return g.poly(pts).fill(fill).stroke({ width: Math.max(4, r / 14), color: ink, join: 'round' });
}

/** objects falling from the top (rotating; `bounce` lands them on the floor with a hop, then they roll away) */
export function fall(
  c: SigCtx,
  layer: Container,
  make: (i: number) => Container,
  o: { n: number; over: number; dur?: number; spread?: number; bounce?: boolean; spin?: number },
) {
  if (c.reduce) return;
  for (let i = 0; i < o.n; i++) {
    later(c, (i / o.n) * o.over + Math.random() * 0.08, () => {
      const p = make(i);
      // over the real screen (viewIn): the spread grows with it, the drop starts above its top and lands on its floor
      const v = viewIn(c, layer);
      const x = v.x + v.w / 2 + (Math.random() - 0.5) * (o.spread ?? W * 1.1) * (v.w / W);
      p.position.set(x, v.y - 80 - Math.random() * 60);
      p.rotation = Math.random() * Math.PI * 2;
      layer.addChild(p);
      const dur = (o.dur ?? 1.4) * (0.8 + Math.random() * 0.4);
      const spin = (o.spin ?? 4) * (Math.random() < 0.5 ? -1 : 1);
      if (o.bounce) {
        const floor = v.y + v.h - 40 - Math.random() * 60;
        gsap.to(p, { y: floor, duration: dur, ease: 'bounce.out' });
        gsap.to(p, { rotation: p.rotation + spin, duration: dur });
        gsap.to(p, { x: x + (Math.random() - 0.5) * 500, alpha: 0, delay: dur, duration: 0.6, ease: 'power1.in', onComplete: () => destroyTree(p) });
      } else {
        gsap.to(p, { y: v.y + v.h + 120, x: x + (Math.random() - 0.5) * 240, rotation: p.rotation + spin, duration: dur, ease: 'power1.in', onComplete: () => destroyTree(p) });
      }
    });
  }
}

/** objects bursting out of a point */
export function burst(c: SigCtx, layer: Container, make: (i: number) => Container, n: number, x: number, y: number, dist = 700, dur = 1.1) {
  const k = c.reduce ? Math.ceil(n / 3) : n;
  for (let i = 0; i < k; i++) {
    const p = make(i);
    p.position.set(x, y);
    layer.addChild(p);
    const a = (i / k) * Math.PI * 2 + Math.random() * 0.3;
    const d = dist * (0.7 + Math.random() * 0.5);
    gsap.fromTo(p.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' });
    gsap.to(p, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.75 + 120, rotation: (Math.random() - 0.5) * 8, duration: dur, ease: 'power2.out' });
    gsap.to(p, { alpha: 0, delay: dur * 0.7, duration: dur * 0.4, onComplete: () => destroyTree(p) });
  }
}

/** a slow drizzle of `make` every `gap` seconds while the card is up (the universe keeps living) */
export function drizzle(c: SigCtx, layer: Container, make: () => Container, gap: number, dur = 3) {
  if (c.reduce) return;
  const iv = window.setInterval(() => {
    if (!alive(c) || layer.destroyed) return window.clearInterval(iv);
    const p = make();
    // the side bands of the real screen (viewIn), wider when the screen is
    const v = viewIn(c, layer);
    const band = 520 * Math.max(1, v.w / W);
    const x = Math.random() < 0.5 ? v.x + 60 + Math.random() * band : v.x + v.w - 60 - Math.random() * band;
    p.position.set(x, v.y - 60);
    p.rotation = Math.random() * 6;
    layer.addChild(p);
    gsap.to(p, { y: v.y + v.h + 80, rotation: p.rotation + 3, duration: dur * (0.8 + Math.random() * 0.4), ease: 'none', onComplete: () => destroyTree(p) });
  }, gap * 1000);
}

/** a soft light behind the silhouette (concentric discs, a fake radial gradient): dark universes need it to read the shape */
export function backlight(color: number, r = 360, alpha = 0.5) {
  const g = new Graphics();
  for (let i = 8; i >= 1; i--) g.circle(0, 0, (r * i) / 8).fill({ color, alpha: alpha / 8 });
  return g;
}

/** a white (or colored) flash, only when flashes are allowed */
export function flashOf(c: SigCtx, color = 0xffffff, alpha = 0.85, dur = 0.5) {
  if (!c.flashes) return;
  const f = cover(color, alpha);
  c.fg.addChild(f);
  gsap.to(f, { alpha: 0, duration: dur, ease: 'power2.out', onComplete: () => f.destroy() });
}

/** a jagged lightning bolt from (x0,y0) to (x1,y1) */
export function bolt(g: Graphics, x0: number, y0: number, x1: number, y1: number, color: number, width = 8, seg = 9, jit = 40) {
  g.moveTo(x0, y0);
  for (let i = 1; i < seg; i++) {
    const k = i / seg;
    g.lineTo(x0 + (x1 - x0) * k + (Math.random() - 0.5) * jit, y0 + (y1 - y0) * k + (Math.random() - 0.5) * jit * 0.4);
  }
  g.lineTo(x1, y1);
  return g.stroke({ width, color, cap: 'round', join: 'round' });
}
