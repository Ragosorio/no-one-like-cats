/**
 * Print helpers shared by the three printed briefings (F03 stencil posters, F05 photocopied flyer, F07 lucha-libre
 * poster): tape, staples, a poster that slaps onto a wall, sprayed reveals, stencil type with bridges, ransom-note
 * cut-out letters, a frame that lets posters overlap the TV's bezel. Everything is built once; per frame only
 * transforms and small mask redraws.
 */
import { Container, Graphics, Sprite, type TextStyleOptions } from 'pixi.js';
import type { SceneCtx } from '../../../stage';
import { TvScreen, rnd, seg, sm, outBack, word } from '../kit';

/** translucent masking tape */
export function tape(g: Graphics, x: number, y: number, w: number, rot: number, color = 0xe9e0b8, alpha = 0.8) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const h = 34;
  const p = (dx: number, dy: number) => [x + dx * c - dy * s, y + dx * s + dy * c];
  const pts: number[] = [];
  // torn ends: a little zig-zag
  for (let i = 0; i <= 4; i++) pts.push(...p(-w / 2 + (i % 2 ? 6 : 0), -h / 2 + (h * i) / 4));
  for (let i = 0; i <= 4; i++) pts.push(...p(w / 2 - (i % 2 ? 6 : 0), h / 2 - (h * i) / 4));
  g.poly(pts).fill({ color, alpha });
}
/** a staple (two short legs, a bar), a little shadow */
export function staple(g: Graphics, x: number, y: number, rot = 0, color = 0x9aa0a8) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const L = 26;
  g.moveTo(x - L * c + 2, y - L * s + 3).lineTo(x + L * c + 2, y + L * s + 3).stroke({ width: 6, color: 0x000000, alpha: 0.3, cap: 'round' });
  g.moveTo(x - L * c, y - L * s).lineTo(x + L * c, y + L * s).stroke({ width: 5, color, cap: 'round' });
}

/** a poster slaps onto the wall: from a little bigger and turned, a quick settle (rm: a fade) */
export function slap(c: Container, lt: number, t0: number, rm: boolean, rot = 0, base = 1) {
  const p = seg(lt, t0, t0 + 0.22);
  c.visible = lt >= t0;
  if (!c.visible) return;
  if (rm) {
    c.alpha = sm(p * 1.6);
    c.rotation = rot;
    c.scale.set(base);
    return;
  }
  c.alpha = Math.min(1, p * 4);
  const k = outBack(p, 2.2);
  c.scale.set(base * (1.18 - 0.18 * k));
  c.rotation = rot + (1 - k) * 0.08;
}

/** spray reveal: discs that cover a rect as p goes 0 → 1 (redraw on twos) */
const SPRAYED = new WeakMap<Graphics, string>();
export function spray(m: Graphics, x: number, y: number, w: number, h: number, p: number, seed: number, r = 70) {
  // redraw only when the coverage changes (callers pass p on twos): no geometry garbage on the other frames
  const key = `${x},${y},${w},${h},${p.toFixed(4)},${seed},${r}`;
  if (SPRAYED.get(m) === key) return;
  SPRAYED.set(m, key);
  m.clear();
  if (p <= 0) return;
  if (p >= 1) {
    m.rect(x - r, y - r, w + r * 2, h + r * 2).fill(0xffffff);
    return;
  }
  const n = Math.ceil(((w * h) / (r * r)) * 1.6);
  const k = Math.floor(n * p);
  for (let i = 0; i < k; i++) {
    // a sweep left → right with scatter (the hand moves across)
    const u = i / n;
    const cx = x + (u * 1.15 - 0.075 + (rnd(i + seed) - 0.5) * 0.18) * w;
    const cy = y + rnd(i * 3 + seed) * h;
    m.circle(cx, cy, r * (0.6 + rnd(i * 7 + seed) * 0.7)).fill(0xffffff);
  }
}
/** overspray droplets around a rect (drawn once) */
export function overspray(g: Graphics, x: number, y: number, w: number, h: number, color: number, seed: number, n = 160) {
  for (let i = 0; i < n; i++) {
    const side = i % 4;
    const u = rnd(i + seed);
    const d = Math.pow(rnd(i * 5 + seed), 2) * 60;
    const px = side === 0 ? x + u * w : side === 1 ? x + w + d : side === 2 ? x + u * w : x - d;
    const py = side === 0 ? y - d : side === 1 ? y + u * h : side === 2 ? y + h + d : y + u * h;
    g.circle(px, py, 1.5 + rnd(i * 9 + seed) * 3.5).fill({ color, alpha: 0.75 });
  }
}

/** stencil type: block letters with the paper ties (bridges) a stencil leaves, plus an overspray halo */
export function stencilText(ctx: SceneCtx, text: string, size: number, color: number, paper: number, o: { font?: string; spacing?: number; bridges?: boolean; halo?: boolean } = {}): Container {
  const c = new Container();
  const t = word(ctx.k, text, { fontFamily: o.font ?? 'Bebas Neue', fontSize: size, fill: color, letterSpacing: o.spacing ?? size * 0.08 });
  c.addChild(t);
  const g = new Graphics();
  const w = t.width;
  const h = t.height;
  if (o.halo !== false) overspray(g, -w / 2, -h * 0.36, w, h * 0.72, color, size + text.length, Math.round(w / 6));
  c.addChildAt(g, 0);
  if (o.bridges !== false) {
    // horizontal ties at ~40 % height, broken per letter
    const b = new Graphics();
    const n = text.length;
    for (let i = 0; i < n; i++) {
      if (text[i] === ' ') continue;
      const x = -w / 2 + ((i + 0.5) / n) * w;
      b.rect(x - size * 0.06, -h * 0.06 + (i % 2 ? h * 0.12 : -h * 0.1), size * 0.12, size * 0.07).fill(paper);
    }
    c.addChild(b);
  }
  return c;
}

/** ransom-note cut-out letters: each letter on its own scrap, its own font and grey; returns the scraps in order */
const RANSOM_FONTS = ['Anton', 'Bebas Neue', 'Bangers', 'Playfair Display', 'Dela Gothic One', 'Permanent Marker', 'Space Grotesk'];
export function ransom(ctx: SceneCtx, text: string, size: number, seed: number, o: { greys?: number[]; gap?: number } = {}): { root: Container; letters: Container[]; width: number } {
  const root = new Container();
  const letters: Container[] = [];
  const greys = o.greys ?? [0xf4f4f0, 0xd8d8d2, 0xbcbcb4, 0x2a2a2a, 0x8a8a84];
  let x = 0;
  const parts: { c: Container; w: number }[] = [];
  [...text].forEach((ch, i) => {
    if (ch === ' ') {
      x += size * 0.45;
      return;
    }
    const r = rnd(i * 13 + seed);
    const font = RANSOM_FONTS[Math.floor(r * RANSOM_FONTS.length)];
    const bg = greys[Math.floor(rnd(i * 7 + seed) * greys.length)];
    const dark = bg < 0x808080;
    const st: TextStyleOptions = { fontFamily: font, fontSize: size * (0.82 + rnd(i * 3 + seed) * 0.36), fill: dark ? 0xf4f4f0 : 0x111111, fontWeight: font === 'Space Grotesk' ? '700' : 'normal' };
    const t = word(ctx.k, ch, st);
    const lc = new Container();
    const pw = t.width + size * 0.22;
    const ph = t.height * 0.92;
    const g = new Graphics();
    // a scrap with uneven scissor cuts
    const jag = (k: number) => (rnd(i * 31 + k + seed) - 0.5) * size * 0.08;
    g.poly([-pw / 2 + jag(1), -ph / 2 + jag(2), pw / 2 + jag(3), -ph / 2 + jag(4), pw / 2 + jag(5), ph / 2 + jag(6), -pw / 2 + jag(7), ph / 2 + jag(8)]).fill(bg);
    lc.addChild(g, t);
    lc.rotation = (rnd(i * 5 + seed) - 0.5) * 0.22;
    lc.y = (rnd(i * 11 + seed) - 0.5) * size * 0.14;
    root.addChild(lc);
    letters.push(lc);
    parts.push({ c: lc, w: pw });
    lc.x = x + pw / 2;
    x += pw + (o.gap ?? size * 0.04);
  });
  for (const p of parts) p.c.x -= x / 2;
  return { root, letters, width: x };
}
/** paste letters one by one between a and b (each lands with a tiny pop) */
export function pasteLetters(letters: Container[], lt: number, a: number, b: number, rm: boolean) {
  const n = letters.length;
  letters.forEach((l, i) => {
    const t0 = a + ((b - a) * i) / Math.max(1, n);
    const p = seg(lt, t0, t0 + 0.12);
    l.visible = lt >= t0;
    const s = rm ? 1 : 1 + (1 - outBack(p, 2.5)) * 0.6;
    l.scale.set(s);
    l.alpha = rm ? sm(p * 2) : 1;
  });
}

/**
 * The TV at full 16:9: black outside the 4:3 picture (where the letterbox would be) so posters can be pasted OVER the
 * bezel; a few old poster scraps with tape stay stuck on it. Mount with ctx.plane(frame, { z: 0, screen: true })
 * before the posters plane.
 */
export class BezelFrame extends Container {
  readonly tv: TvScreen;
  private black = new Graphics();
  private key = '';
  readonly scraps = new Graphics();
  constructor(
    private ctx: SceneCtx,
    o: { scraps?: number; scrapColor?: number[] } = {},
  ) {
    super();
    this.tv = new TvScreen(ctx);
    this.addChild(this.tv, this.black, this.scraps);
    const cols = o.scrapColor ?? [0xc9a77a, 0xb32a20, 0x1a1414];
    const n = o.scraps ?? 5;
    // scraps on the bezel edges: torn bits of earlier posters
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0;
      const x = left ? 240 - 40 + rnd(i) * 70 : 1680 - 30 + rnd(i) * 70;
      const y = 80 + rnd(i + 4) * 900;
      const w = 90 + rnd(i + 8) * 110;
      const h = 70 + rnd(i + 12) * 120;
      const rot = (rnd(i + 2) - 0.5) * 0.5;
      const cc = Math.cos(rot);
      const ss = Math.sin(rot);
      const P = (dx: number, dy: number) => [x + dx * cc - dy * ss, y + dx * ss + dy * cc];
      this.scraps.poly([...P(-w / 2, -h / 2), ...P(w / 2, -h / 2 + 8), ...P(w / 2 - 12, h / 2), ...P(-w / 2 + 6, h / 2 - 10)]).fill(cols[i % cols.length]);
      tape(this.scraps, x, y - h / 2 + 4, w * 0.7, rot + 0.1);
    }
  }
  update(f?: unknown) {
    void f;
    this.tv.update();
    const r = this.tv.rect();
    const v = this.ctx.k.view;
    const key = `${r.x},${r.w},${v.x},${v.w},${v.h}`;
    if (key === this.key) return;
    this.key = key;
    const g = this.black.clear();
    g.rect(v.x - 20, v.y - 20, r.x - v.x + 20, v.h + 40).fill(0x000000);
    g.rect(r.x + r.w, v.y - 20, v.x + v.w - (r.x + r.w) + 20, v.h + 40).fill(0x000000);
  }
}

/** a soft drop shadow under a rectangle poster (drawn into g) */
export function posterShadow(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x + 14, y + 18, w, h).fill({ color: 0x000000, alpha: 0.35 });
}
export { Sprite };
