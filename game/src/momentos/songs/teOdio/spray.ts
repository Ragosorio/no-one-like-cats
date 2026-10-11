/**
 * te ODIO — spray paint, stencils, torn paper, comic print: the drawing vocabulary of «GRAFITI Y SEÑAL ROTA».
 *
 *  STREET   spray strokes = a hard core + two soft overspray passes + speckle; drips; splats; torn-paper edges;
 *           TAGS (Permanent Marker) and STENCIL words (Bebas Neue with cut bridges) baked ONCE with a blurred
 *           overspray halo and drips (SprayBook) — nothing is rasterized at the hit
 *  COMIC    flat fills, a near-black ink line, Ben-Day dot screens, starburst balloons, Bangers captions
 *
 * All vector (Pixi Graphics) or baked at load from vector + text; seeded so a redraw is identical.
 */
import { BlurFilter, Container, Graphics, Rectangle, Sprite, Text, TextStyle, TilingSprite, type Renderer, type Texture } from 'pixi.js';
import { rng } from '../../anime/draw';

export const INK = 0x141218;
export const WALL = 0xf2eee4;
export const COMIC_INK = 0x17141d;
export const PAPER = 0xfff6e6;
/** the Disruptores' spray cans */
export const FLUO = { pink: 0xff2e88, green: 0x39ff14, cyan: 0x29e6ff, orange: 0xff7a1a, yellow: 0xffe600, violet: 0xb04dff };
/** the box's print inks (comic) */
export const PRINT = { cyan: 0x2ec4e8, magenta: 0xe8368f, yellow: 0xffd23f, blue: 0x1b2a6b, red: 0xe23b3b, paper: PAPER };

// ------------------------------------------------------------------ street strokes (Graphics, live)
/** a spray stroke along a polyline: overspray (2 soft passes) + core + speckle */
export function sprayLine(g: Graphics, pts: number[], w: number, color: number, seed: number, o: { core?: number; speck?: number; alpha?: number } = {}) {
  if (pts.length < 4) return g;
  const al = o.alpha ?? 1;
  const path = () => {
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  };
  path();
  g.stroke({ width: w * 2.6, color, alpha: 0.09 * al, cap: 'round', join: 'round' });
  path();
  g.stroke({ width: w * 1.6, color, alpha: 0.2 * al, cap: 'round', join: 'round' });
  path();
  g.stroke({ width: w * (o.core ?? 1), color, alpha: al, cap: 'round', join: 'round' });
  const n = Math.round((o.speck ?? 1) * (pts.length / 2) * 3);
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const j = Math.floor(R() * (pts.length / 2 - 1)) * 2;
    const t = R();
    const x = pts[j] + (pts[j + 2] - pts[j]) * t + (R() - 0.5) * w * 3.2;
    const y = pts[j + 1] + (pts[j + 3] - pts[j + 1]) * t + (R() - 0.5) * w * 3.2;
    g.circle(x, y, 0.8 + R() * w * 0.12).fill({ color, alpha: (0.35 + R() * 0.5) * al });
  }
  return g;
}
/** a filled spray blob (a polygon with overspray) */
export function sprayPoly(g: Graphics, pts: number[], color: number, seed: number, w = 14, alpha = 1) {
  g.poly(pts).stroke({ width: w * 2.4, color, alpha: 0.1 * alpha, join: 'round' });
  g.poly(pts).stroke({ width: w * 1.2, color, alpha: 0.22 * alpha, join: 'round' });
  g.poly(pts).fill({ color, alpha });
  const R = rng(seed);
  const xs = pts.filter((_, i) => i % 2 === 0);
  const ys = pts.filter((_, i) => i % 2 === 1);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  for (let i = 0; i < 26; i++) g.circle(x0 - w + R() * (x1 - x0 + 2 * w), y0 - w + R() * (y1 - y0 + 2 * w), 1 + R() * 2.4).fill({ color, alpha: 0.3 * alpha });
  return g;
}
/** paint drips hanging from (x, y): `len` 0..1 grows them */
export function drips(g: Graphics, x: number, y: number, w: number, n: number, len: number, color: number, seed: number, ink = -1) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const dx = (R() - 0.5) * w;
    const L = (18 + R() * 70) * len * (0.4 + R() * 0.8);
    const dw = 3 + R() * 5;
    if (L < 2) continue;
    if (ink >= 0) g.roundRect(x + dx - dw / 2 - 2, y - 2, dw + 4, L + 4, (dw + 4) / 2).fill(ink);
    g.roundRect(x + dx - dw / 2, y, dw, L, dw / 2).fill(color);
    g.circle(x + dx, y + L, dw * 0.75).fill(color);
  }
  return g;
}
/** a paint splat (radial blobs + flung droplets) */
export function splat(g: Graphics, x: number, y: number, r: number, color: number, seed: number, o: { ink?: number; s?: number } = {}) {
  const R = rng(seed);
  const s = o.s ?? 1;
  const pts: number[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (R() - 0.5) * 0.3;
    const rr = r * s * (i % 2 ? 0.55 + R() * 0.25 : 0.85 + R() * 0.45);
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  if (o.ink !== undefined) g.poly(pts).stroke({ width: 6, color: o.ink, join: 'round' });
  g.poly(pts).fill(color);
  for (let i = 0; i < 9; i++) {
    const a = R() * Math.PI * 2;
    const d = r * s * (1.1 + R() * 0.9);
    const rr = r * s * (0.06 + R() * 0.12);
    g.circle(x + Math.cos(a) * d, y + Math.sin(a) * d, rr).fill(color);
  }
  return g;
}
/** a torn-paper edge from (x0,y0) to (x1,y1): returns the jagged points (for polygons) */
export function tornEdge(x0: number, y0: number, x1: number, y1: number, seed: number, jag = 14, step = 22): number[] {
  const R = rng(seed);
  const L = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(2, Math.round(L / step));
  const nx = -(y1 - y0) / L;
  const ny = (x1 - x0) / L;
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const o = i === 0 || i === n ? 0 : (R() - 0.5) * jag * 2;
    out.push(x0 + (x1 - x0) * t + nx * o, y0 + (y1 - y0) * t + ny * o);
  }
  return out;
}
/** a torn paper rectangle (poster) w×h centered at 0,0 */
export function tornRect(w: number, h: number, seed: number, jag = 12): number[] {
  const x0 = -w / 2;
  const y0 = -h / 2;
  return [...tornEdge(x0, y0, x0 + w, y0, seed, jag), ...tornEdge(x0 + w, y0, x0 + w, y0 + h, seed + 1, jag).slice(2), ...tornEdge(x0 + w, y0 + h, x0, y0 + h, seed + 2, jag).slice(2), ...tornEdge(x0, y0 + h, x0, y0, seed + 3, jag).slice(2, -2)];
}
/** spray-painted star: white core, colored soft halo */
export function sprayStar(g: Graphics, x: number, y: number, r: number, color: number, a = 1) {
  g.circle(x, y, r * 4.2).fill({ color, alpha: 0.06 * a });
  g.circle(x, y, r * 2.3).fill({ color, alpha: 0.16 * a });
  g.circle(x, y, r).fill({ color: 0xffffff, alpha: a });
}

// ------------------------------------------------------------------ comic print
/** Ben-Day dots filling a rect, radius from r0 (top) to r1 (bottom) */
export function benDay(g: Graphics, x: number, y: number, w: number, h: number, step: number, r0: number, r1: number, color: number, alpha = 1) {
  for (let yy = 0; yy <= h; yy += step) {
    const r = r0 + (r1 - r0) * (yy / Math.max(1, h));
    if (r < 0.4) continue;
    const off = (Math.round(yy / step) % 2) * step * 0.5;
    for (let xx = off; xx <= w; xx += step) g.circle(x + xx, y + yy, r);
  }
  g.fill({ color, alpha });
  return g;
}
/**
 * A BIG Ben-Day screen as tiling sprites (one white tile per dot size, tinted): a full-frame screen drawn as circles is
 * ~100 k vertices, and Pixi's pooled batchers keep growing to the largest geometry they ever served (the heap grew
 * every play). The tiles (a few px each) are baked once per session and kept; the layer itself is a handful of quads.
 * Same pattern as `benDay` (rows offset by half a step, the dot radius going r0 → r1 down the area).
 */
const DOT_TILES = new Map<string, Texture>();
function dotTile(renderer: Renderer, step: number, r: number): Texture {
  const key = `${step}|${r}`;
  let t = DOT_TILES.get(key);
  if (!t || t.destroyed) {
    const g = new Graphics();
    g.rect(0, 0, step, step * 2).fill({ color: 0xffffff, alpha: 0 });
    for (const [x, y] of [
      [0, 0],
      [step, 0],
      [0, step * 2],
      [step, step * 2],
      [step / 2, step],
    ])
      g.circle(x, y, r);
    g.fill(0xffffff);
    t = renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, step, step * 2), resolution: 1, antialias: true });
    g.destroy();
    DOT_TILES.set(key, t);
  }
  return t;
}
export function benDayLayer(renderer: Renderer, x: number, y: number, w: number, h: number, step: number, r0: number, r1: number, color: number, alpha = 1, bands = 6): Container {
  const c = new Container();
  const bh = Math.ceil(h / bands / (step * 2)) * step * 2;
  for (let yy = 0; yy < h; yy += bh) {
    const r = Math.round((r0 + (r1 - r0) * ((yy + bh / 2) / Math.max(1, h))) * 2) / 2;
    if (r < 0.5) continue;
    const ts = new TilingSprite({ texture: dotTile(renderer, step, Math.min(r, step * 0.5)), width: w, height: Math.min(bh, h - yy) });
    ts.position.set(x, y + yy);
    ts.tint = color;
    ts.alpha = alpha;
    c.addChild(ts);
  }
  return c;
}
/** a comic starburst balloon (POW) */
export function starburst(g: Graphics, x: number, y: number, r: number, spikes: number, fill: number, seed: number, ink = COMIC_INK) {
  const R = rng(seed);
  const pts: number[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 + (R() - 0.5) * 0.12;
    const rr = i % 2 ? r * (0.62 + R() * 0.1) : r * (0.95 + R() * 0.3);
    pts.push(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr);
  }
  g.poly(pts).stroke({ width: 8, color: ink, join: 'miter' }).poly(pts).fill(fill);
  return g;
}
/** the Disruptores' emblem: a box with its door swung open (stencil-friendly, centered, size = box side) */
export function openBox(g: Graphics, x: number, y: number, s: number, color: number, o: { ink?: number; line?: number } = {}) {
  const lw = o.line ?? s * 0.09;
  const h = s / 2;
  // the box (front face) and its open door hanging on the left hinge
  g.rect(x - h, y - h, s, s).stroke({ width: lw, color, join: 'miter' });
  g.poly([x - h, y - h, x - h - s * 0.55, y - h + s * 0.18, x - h - s * 0.55, y + h + s * 0.06, x - h, y + h]).stroke({ width: lw, color, join: 'miter' });
  // light pouring out of the door
  g.poly([x - h + lw, y - h + lw, x + h - lw, y - h + lw, x + h - lw, y + h - lw, x - h + lw, y + h - lw]).fill({ color, alpha: 0.18 });
  for (let i = 0; i < 3; i++) g.moveTo(x - h - s * 0.1, y - h * 0.5 + i * h * 0.5).lineTo(x - h - s * (0.4 + i * 0.05), y - h * 0.6 + i * h * 0.6).stroke({ width: lw * 0.55, color, cap: 'round' });
  return g;
}

// ------------------------------------------------------------------ baked words (no Text at the hit)
export type WordKind = 'tag' | 'stencil' | 'comic' | 'glitch' | 'marker';
export interface WordOpts {
  kind: WordKind;
  size: number;
  color: number;
  ink?: number;
  /** overspray halo color (tag / stencil) */
  halo?: number;
  drips?: number;
  seed?: number;
}
const FONT: Record<WordKind, string> = { tag: 'Permanent Marker', stencil: 'Bebas Neue', comic: 'Bangers', glitch: 'Rubik Glitch', marker: 'Permanent Marker' };

/** the fonts this Momento draws with (load before baking) */
export function loadFonts() {
  return Promise.all(['80px "Permanent Marker"', '80px "Bebas Neue"', '80px "Bangers"', '80px "Rubik Glitch"', '700 22px "Space Grotesk"'].map((f) => document.fonts.load(f).catch(() => undefined)));
}

/**
 * A word baked once into a texture: TAG (marker with a fat ink outline, a blurred overspray halo and drips), STENCIL
 * (condensed caps with the stencil's cut bridges and overspray), COMIC (Bangers with a black outline and a drop
 * shadow), GLITCH (Rubik Glitch, for the broken signal).
 */
export class SprayBook {
  private map = new Map<string, Texture>();
  constructor(private renderer: Renderer) {}
  get(text: string, o: WordOpts): Texture {
    const key = `${text}\u0000${JSON.stringify(o)}`;
    let t = this.map.get(key);
    if (!t) {
      t = this.bake(text, o);
      this.map.set(key, t);
    }
    return t;
  }
  sprite(text: string, o: WordOpts, ax = 0.5, ay = 0.5): Sprite {
    const s = new Sprite(this.get(text, o));
    s.anchor.set(ax, ay);
    return s;
  }
  private bake(text: string, o: WordOpts): Texture {
    const c = new Container();
    const ink = o.ink ?? INK;
    const size = o.size;
    const seed = o.seed ?? text.length * 31;
    const R = rng(seed);
    const style = new TextStyle({
      fontFamily: FONT[o.kind],
      fontSize: size,
      fill: o.color,
      stroke: o.kind === 'stencil' || o.kind === 'glitch' ? undefined : { color: ink, width: Math.max(6, size * (o.kind === 'comic' ? 0.14 : 0.1)), join: 'round' },
      letterSpacing: o.kind === 'stencil' ? size * 0.04 : o.kind === 'comic' ? 2 : 0,
      padding: size * 0.3,
    });
    const pad = size * 0.6;
    const main = new Text({ text, style, resolution: 1 });
    main.position.set(pad, pad);
    if (o.kind === 'tag' || o.kind === 'stencil' || o.kind === 'marker') {
      // overspray: a blurred, fattened copy in the halo color
      const haloStyle = style.clone();
      haloStyle.fill = o.halo ?? o.color;
      haloStyle.stroke = { color: o.halo ?? o.color, width: Math.max(8, size * 0.22), join: 'round' };
      const halo = new Text({ text, style: haloStyle, resolution: 1 });
      halo.position.set(pad, pad);
      halo.alpha = o.kind === 'stencil' ? 0.45 : 0.55;
      halo.filters = [new BlurFilter({ strength: Math.max(4, size * 0.1), quality: 3 })];
      c.addChild(halo);
    }
    if (o.kind === 'comic') {
      const sh = new Text({ text, style: style.clone(), resolution: 1 });
      sh.style.fill = ink;
      sh.position.set(pad + size * 0.06, pad + size * 0.07);
      c.addChild(sh);
    }
    if (o.kind === 'glitch') {
      // the broken signal: two chroma ghosts
      for (const [dx, col] of [
        [-size * 0.05, 0x29e6ff],
        [size * 0.05, 0xff2e88],
      ] as const) {
        const gst = style.clone();
        gst.fill = col;
        const t2 = new Text({ text, style: gst, resolution: 1 });
        t2.position.set(pad + dx, pad);
        t2.alpha = 0.8;
        c.addChild(t2);
      }
    }
    c.addChild(main);
    const w = main.width;
    const h = main.height;
    if (o.kind === 'stencil') {
      // the stencil's bridges: thin vertical cuts through every letter
      const cut = new Graphics();
      const n = Math.max(2, text.length);
      for (let i = 0; i < n; i++) cut.rect(pad + (w * (i + 0.5)) / n - size * 0.025, pad + h * 0.28, size * 0.05, h * 0.26).fill(0xffffff);
      cut.blendMode = 'erase';
      c.addChild(cut);
    }
    const nd = o.drips ?? (o.kind === 'tag' || o.kind === 'marker' ? 5 : o.kind === 'stencil' ? 3 : 0);
    if (nd > 0) {
      const d = new Graphics();
      for (let i = 0; i < nd; i++) {
        const x = pad + w * (0.08 + R() * 0.84);
        const y = pad + h * (0.62 + R() * 0.12);
        const L = size * (0.18 + R() * 0.55);
        const dw = Math.max(3, size * (0.03 + R() * 0.035));
        d.roundRect(x - dw / 2 - 2, y - 2, dw + 4, L + 4, dw).fill(ink);
        d.roundRect(x - dw / 2, y, dw, L, dw / 2).fill(o.color);
        d.circle(x, y + L, dw * 0.8).fill(o.color);
      }
      c.addChildAt(d, Math.max(0, c.children.length - 1));
    }
    // the texture's frame: the word + room for the overspray and the drips (filters don't widen bounds)
    c.addChildAt(new Graphics().rect(0, 0, w + pad * 2, h + pad * 2 + size * 0.4).fill({ color: 0x000000, alpha: 0.002 }), 0);
    const tex = this.renderer.generateTexture({ target: c, resolution: 1, antialias: true });
    c.destroy({ children: true });
    return tex;
  }
  get size() {
    return this.map.size;
  }
  dispose() {
    for (const t of this.map.values()) t.destroy(true);
    this.map.clear();
  }
}
