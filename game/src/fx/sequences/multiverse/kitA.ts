/**
 * Shared helpers for the 8 reference universes (Comecroquetas, Bigotón, Ovillo, Estambre, the three Arañas, Gatemson):
 * a 5×7 pixel font (arcade HUDs), 7-segment digits (the scouter), CRT scanlines, a typewriter caption, a plain
 * (no CMYK ghosts) payoff title, and a self-cleaning loop for the Catdex cards. Everything drawn, no raster.
 */
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type SigCtx, CHEER, alive, later } from './kit';
import { liveLoop } from '../../../panels/collection/cardArt';

// --- 5×7 pixel font ---------------------------------------------------------------------------
const G5: Record<string, string> = {
  A: '.###.#...##...#######...##...##...#',
  B: '####.#...##...#####.#...##...#####.',
  C: '.###.#...##....#....#....#...#.###.',
  D: '####.#...##...##...##...##...#####.',
  E: '######....#....####.#....#....#####',
  F: '######....#....####.#....#....#....',
  G: '.###.#...##....#.####...##...#.####',
  H: '#...##...##...#######...##...##...#',
  I: '.###...#....#....#....#....#...###.',
  J: '..###...#....#....#....#.#..#..##..',
  K: '#...##..#.#.#..##...#.#..#..#.#...#',
  L: '#....#....#....#....#....#....#####',
  M: '#...###.###.#.##.#.##...##...##...#',
  N: '#...##...###..##.#.##..###...##...#',
  O: '.###.#...##...##...##...##...#.###.',
  P: '####.#...##...#####.#....#....#....',
  Q: '.###.#...##...##...##.#.##..#..##.#',
  R: '####.#...##...#####.#.#..#..#.#...#',
  S: '.#####....#.....###.....#....#####.',
  T: '#####..#....#....#....#....#....#..',
  U: '#...##...##...##...##...##...#.###.',
  V: '#...##...##...##...##...#.#.#...#..',
  W: '#...##...##...##.#.##.#.##.#.#.#.#.',
  X: '#...##...#.#.#...#...#.#.#...##...#',
  Y: '#...##...#.#.#...#....#....#....#..',
  Z: '#####....#...#...#...#...#....#####',
  '0': '.###.#...##..###.#.###..##...#.###.',
  '1': '..#...##....#....#....#....#...###.',
  '2': '.###.#...#....#...#...#...#...#####',
  '3': '#####...#...#.....#.....##...#.###.',
  '4': '...#...##..#.#.#..#.#####...#....#.',
  '5': '######....####.....#....##...#.###.',
  '6': '..##..#...#....####.#...##...#.###.',
  '7': '#####....#...#...#...#....#....#...',
  '8': '.###.#...##...#.###.#...##...#.###.',
  '9': '.###.#...##...#.####....#...#..##..',
  '!': '..#....#....#....#....#.........#..',
  '¡': '..#.........#....#....#....#....#..',
  '?': '.###.#...#....#...#...#.........#..',
  '¿': '..#.........#...#...#...#....#.###.',
  '.': '................................#..',
  ',': '...........................#...#...',
  '-': '...............#####...............',
  ':': '.......#...................#.......',
  '/': '....#....#...#...#...#...#....#....',
  '+': '.......#....#..#####..#....#.......',
  "'": '..#....#...........................',
  ' ': '...................................',
};
const ACCENT: Record<string, string> = { Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ñ: 'N', Ü: 'U' };

/** width in pixels-units of `text` in the 5×7 font (6 per glyph incl. spacing) */
export function pixelWidth(text: string, px: number) {
  return Math.max(0, text.length * 6 - 1) * px;
}

/**
 * Draws `text` in the 5×7 pixel font into `g` (adds rects; doesn't clear). (x, y) = top-left of the first glyph
 * unless `align` says otherwise. Accented capitals get their mark two pixels above.
 */
export function pixelText(g: Graphics, text: string, x: number, y: number, px: number, color: number, align: 'left' | 'center' | 'right' = 'left', alpha = 1) {
  const s = text.toUpperCase();
  let x0 = x;
  if (align !== 'left') x0 -= pixelWidth(s, px) * (align === 'center' ? 0.5 : 1);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const base = ACCENT[ch] ?? ch;
    const bits = G5[base] ?? G5['?'];
    const gx = x0 + i * 6 * px;
    for (let k = 0; k < bits.length && k < 35; k++) if (bits[k] === '#') g.rect(gx + (k % 5) * px, y + Math.floor(k / 5) * px, px, px);
    if (ch !== base) {
      if (ch === 'Ñ') g.rect(gx, y - 2 * px, px * 2, px).rect(gx + 3 * px, y - 2 * px, px * 2, px);
      else if (ch === 'Ü') g.rect(gx + px, y - 2 * px, px, px).rect(gx + 3 * px, y - 2 * px, px, px);
      else g.rect(gx + 3 * px, y - 3 * px, px, px).rect(gx + 2 * px, y - 2 * px, px, px);
    }
  }
  return g.fill({ color, alpha });
}

// --- 7-segment digits -------------------------------------------------------------------------
const SEG: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
  ' ': '',
};

/** one 7-segment digit, top-left at (x,y), w×h, segments `t` thick; unlit segments ghosted when `ghost` */
export function segDigit(g: Graphics, ch: string, x: number, y: number, w: number, h: number, t: number, color: number, ghost = 0) {
  const on = SEG[ch] ?? '';
  const hh = h / 2;
  const hs = (x0: number, y0: number, L: number) => [x0, y0, x0 + t / 2, y0 - t / 2, x0 + L - t / 2, y0 - t / 2, x0 + L, y0, x0 + L - t / 2, y0 + t / 2, x0 + t / 2, y0 + t / 2];
  const vs = (x0: number, y0: number, L: number) => [x0, y0, x0 + t / 2, y0 + t / 2, x0 + t / 2, y0 + L - t / 2, x0, y0 + L, x0 - t / 2, y0 + L - t / 2, x0 - t / 2, y0 + t / 2];
  const segs: Record<string, number[]> = {
    a: hs(x + t / 2, y + t / 2, w - t),
    g: hs(x + t / 2, y + hh, w - t),
    d: hs(x + t / 2, y + h - t / 2, w - t),
    f: vs(x + t / 2, y + t / 2, hh - t / 2),
    b: vs(x + w - t / 2, y + t / 2, hh - t / 2),
    e: vs(x + t / 2, y + hh, hh - t / 2),
    c: vs(x + w - t / 2, y + hh, hh - t / 2),
  };
  for (const k of 'abcdefg') {
    const lit = on.includes(k);
    if (!lit && ghost <= 0) continue;
    g.poly(segs[k]).fill({ color, alpha: lit ? 1 : ghost });
  }
  return g;
}

/** a row of 7-segment digits (right-aligned when `right`), returns its width */
export function segText(g: Graphics, s: string, x: number, y: number, h: number, color: number, ghost = 0, right = false) {
  const w = h * 0.52;
  const gap = h * 0.16;
  const t = h * 0.13;
  const total = s.length * (w + gap) - gap;
  const x0 = right ? x - total : x;
  for (let i = 0; i < s.length; i++) segDigit(g, s[i], x0 + i * (w + gap) + i * 0, y, w, h, t, color, ghost);
  return total;
}

// --- screen texture ---------------------------------------------------------------------------
/** CRT scanlines over a w×h area (one Graphics) */
export function scanlines(w = W, h = H, gap = 4, alpha = 0.18, color = 0x000000) {
  const g = new Graphics();
  for (let y = 0; y < h; y += gap) g.rect(0, y, w, Math.max(1, gap / 2));
  return g.fill({ color, alpha });
}

/** a soft vignette: dark frames growing to the edges (one Graphics) */
export function vignette(w = W, h = H, color = 0x000000, alpha = 0.5, steps = 6) {
  const g = new Graphics();
  for (let i = 0; i < steps; i++) {
    const m = (i / steps) * Math.min(w, h) * 0.22;
    g.rect(0, 0, w, h)
      .fill({ color, alpha: alpha / steps })
      .rect(m, m, w - m * 2, h - m * 2)
      .cut();
  }
  return g;
}

/** the pink disc goes away (every universe brings its own motif) */
export function hideDisc(c: SigCtx, dur = 0.25) {
  gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : dur });
}

/** the silhouette's world rectangle (the painting is `520` wide, centered on the cat) */
export const CAT_R = 260;

// --- texts ------------------------------------------------------------------------------------
/**
 * a caption typed letter by letter (a typewriter): returns the Text; `cps` letters per second, a clack every few.
 * Reduced motion: it's simply there.
 */
export function typewriter(c: SigCtx, layer: Container, text: string, x: number, y: number, style: TextStyleOptions, cps = 28, clack: 'tick' | 'nib' | null = 'tick'): Text {
  const t = txt('', style);
  t.position.set(x, y);
  layer.addChild(t);
  if (c.reduce || c.short) {
    t.text = text;
    return t;
  }
  const n = { k: 0 };
  let last = 0;
  gsap.to(n, {
    k: text.length,
    duration: text.length / cps,
    ease: 'none',
    onUpdate: () => {
      if (t.destroyed) return;
      const k = Math.floor(n.k);
      if (k !== last) {
        t.text = text.slice(0, k);
        if (clack && k % 2 === 0 && text[k - 1] !== ' ' && alive(c)) sfx(clack, 1.6 + Math.random() * 0.5);
        last = k;
      }
    },
    onComplete: () => !t.destroyed && (t.text = text),
  });
  return t;
}

/**
 * the payoff's title without the comic CMYK ghosts (for universes where cyan/pink would break the look):
 * stamped at the CHEER spot, scales in, holds, fades. Returns the Text.
 */
export function title(c: SigCtx, text: string, style: TextStyleOptions, dur = 1.8, at: [number, number] = CHEER, maxW = 760): Text {
  const t = txt(text, style);
  t.anchor.set(0.5);
  t.position.set(at[0], at[1]);
  const fit = Math.min(1, maxW / Math.max(1, t.width));
  t.rotation = -0.05;
  c.fg.addChild(t);
  if (c.reduce) t.scale.set(fit);
  else gsap.fromTo(t.scale, { x: fit * 1.6, y: fit * 1.6 }, { x: fit, y: fit, duration: 0.18, ease: 'back.out(3)' });
  gsap.to(t, { alpha: 0, delay: dur - 0.3, duration: 0.3, onComplete: () => t.destroy() });
  return t;
}

// --- cards ------------------------------------------------------------------------------------
/**
 * a card's own loop: fn(t) at `fps` until the card is destroyed (CARTAS' liveLoop: it stops by itself on destroy, and
 * with Reducir movimiento it draws one still frame)
 */
export function cardLoop(k: Container, fps: number, fn: (t: number) => void) {
  return liveLoop(k, (t) => fn(t), fps);
}

/** a w×h rectangle (the card's art window) */
export function box(w: number, h: number, color: number, alpha = 1) {
  return new Graphics().rect(0, 0, w, h).fill({ color, alpha });
}

/** a quick ring that grows and fades from (x,y) in `layer` */
export function ring(c: SigCtx, layer: Container, x: number, y: number, color: number, r = 80, to = 6, width = 14, dur = 0.7) {
  const g = new Graphics().circle(0, 0, r).stroke({ width, color });
  g.position.set(x, y);
  layer.addChild(g);
  if (c.reduce) {
    later(c, 0.4, () => g.destroy());
    return g;
  }
  gsap.fromTo(g.scale, { x: 0.3, y: 0.3 }, { x: to, y: to, duration: dur, ease: 'power2.out' });
  gsap.to(g, { alpha: 0, duration: dur, ease: 'power1.in', onComplete: () => g.destroy() });
  return g;
}

export { C, W, H };
