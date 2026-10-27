/**
 * ACTO IV — the stadium of POP («un estadio que no se acaba, con escenarios dentro de escenarios»), code-drawn:
 *
 *   arenaBack     the far bowl: tiers of cat-eared silhouettes, haze, far lamps (static: bake it)
 *   PhoneSea      the crowd's phone lights (sprites): off · on (the «¡LUCES!» moment) · twinkling, swaying
 *   crowdFront    the front rows: big cat-eared heads against the stage light, a few raised phones (static)
 *   stageDeck     the stage: neon edge, runway toward us, the trapdoor, monitors and stairs (static)
 *   Truss         the light rig across the top with its lamp heads; `fall(p)` brings it down (H91, c57)
 *   LedWall       the main screen + two side screens + the strip below (styles/pop.ts LedPanel)
 *   GlassCube     Firma's glass cube with Cerito inside (StaticKitten): lid, cracks, the shine
 *   flightCases   black equipment cases with silver corners and STAFF stencils (where the crew hides)
 *   bokeh         out-of-focus stadium lights behind a close shot (static)
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { SceneCtx } from '../../../stage';
import { LedPanel, POP, Spots } from '../../../styles/pop';
import { StaticKitten, rnd } from '../../acto1/kit';

const tx = (ctx: SceneCtx) => (n: string) => ctx.tex(n);

/** a cat-eared head silhouette */
export function catHead(g: Graphics, x: number, y: number, s: number) {
  g.circle(x, y, s);
  g.poly([x - s * 0.95, y - s * 0.2, x - s * 0.75, y - s * 1.35, x - s * 0.2, y - s * 0.85]);
  g.poly([x + s * 0.95, y - s * 0.2, x + s * 0.75, y - s * 1.35, x + s * 0.2, y - s * 0.85]);
}

/** the far bowl (draw once; plane it with bake 'static' or 'dof') */
export function arenaBack(o: { w?: number; h?: number; seed?: number; top?: number; tint?: number } = {}): Container {
  const W = o.w ?? 2600;
  const H = o.h ?? 1500;
  const c = new Container();
  const g = new Graphics();
  // night violet, lighter toward the haze over the stage
  const bands = 40;
  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const col = mix(0x07040f, o.tint ?? 0x2a1450, Math.min(1, t * 1.25));
    g.rect(-W / 2 + 960, -260 + (H * i) / bands, W, H / bands + 1).fill(col);
  }
  // the roof truss far away: a lattice line with tiny lamps
  const top = o.top ?? -140;
  g.rect(-W / 2 + 960, top, W, 10).fill(0x1a1230);
  for (let x = -W / 2 + 960; x < W / 2 + 960; x += 90) g.moveTo(x, top).lineTo(x + 45, top + 40).lineTo(x + 90, top).stroke({ width: 3, color: 0x1a1230 });
  for (let x = -W / 2 + 990; x < W / 2 + 960; x += 180) g.circle(x, top + 44, 6).fill({ color: 0xfff0d8, alpha: 0.8 });
  // tiers: rows of heads rising to both sides, darker far away
  const seed = o.seed ?? 3;
  for (let row = 0; row < 11; row++) {
    const y = 120 + row * 52;
    const s = 9 + row * 1.6;
    const col = mix(0x0c0718, 0x241040, row / 11);
    for (let x = -W / 2 + 960; x < W / 2 + 960; x += s * 2.4) {
      // the middle is the stage (no seats there above row 6)
      if (Math.abs(x - 960) < 520 - row * 22 && row < 7) continue;
      catHead(g, x + (rnd(row * 97 + x + seed) - 0.5) * s, y + (rnd(x * 3 + row + seed) - 0.5) * 8, s);
    }
    g.fill(col);
  }
  c.addChild(g);
  return c;
}

/** the crowd's phones: little glows over the tiers (they come on with «¡LUCES!») */
export class PhoneSea extends Container {
  private dots: { sp: Sprite; ph: number; sp2: number; x: number; y: number }[] = [];
  constructor(ctx: SceneCtx, o: { n?: number; area?: [number, number, number, number]; seed?: number; colors?: number[] } = {}) {
    super();
    const glow = ctx.tex('pop:glow');
    const [x0, y0, x1, y1] = o.area ?? [-300, 150, 2220, 760];
    const n = Math.round((o.n ?? 260) * Math.max(0.5, ctx.density));
    const cols = o.colors ?? [0xfff6e0, 0xdff4ff, 0xfff0c0, 0xffd8f0];
    for (let i = 0; i < n && glow; i++) {
      const sp = new Sprite(glow);
      sp.anchor.set(0.5);
      sp.blendMode = 'add';
      const x = x0 + (x1 - x0) * rnd(i * 7 + (o.seed ?? 0));
      const y = y0 + (y1 - y0) * Math.pow(rnd(i * 13 + 5 + (o.seed ?? 0)), 0.8);
      // the middle (the stage) has no crowd
      if (Math.abs(x - 960) < 380 && y < 600) continue;
      const s = 0.05 + (y - y0) / (y1 - y0) * 0.09;
      sp.scale.set(s);
      sp.tint = cols[i % cols.length];
      sp.position.set(x, y);
      this.addChild(sp);
      this.dots.push({ sp, ph: rnd(i + 31) * 6.28, sp2: 0.6 + rnd(i + 3) * 0.8, x, y });
    }
  }
  /** on 0..1 (they light up from the front rows backwards as `on` rises), sway with the beat */
  update(t: number, on: number, rm = false) {
    for (const d of this.dots) {
      const front = (d.y - 150) / 610;
      const k = Math.max(0, Math.min(1, on * 1.6 - (1 - front) * 0.6));
      d.sp.visible = k > 0.01;
      if (!d.sp.visible) continue;
      d.sp.alpha = k * (0.7 + 0.3 * Math.sin(t * 3 * d.sp2 + d.ph));
      d.sp.position.set(d.x + (rm ? 0 : Math.sin(t * 1.6 + d.ph) * 6), d.y);
    }
  }
}

/** the front rows: heads against the light, raised phones (static) */
export function crowdFront(o: { y?: number; seed?: number; color?: number; phones?: boolean } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  const y = o.y ?? 1040;
  const seed = o.seed ?? 1;
  for (let i = 0; i < 26; i++) {
    const x = -200 + i * 92 + (rnd(i + seed) - 0.5) * 40;
    const s = 46 + rnd(i * 3 + seed) * 22;
    catHead(g, x, y - rnd(i * 5 + seed) * 40, s);
    g.rect(x - s * 0.9, y - rnd(i * 5 + seed) * 40, s * 1.8, 300);
  }
  g.fill(o.color ?? 0x0a0614);
  // a few raised paws with phones (their screens glow)
  if (o.phones !== false)
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 330 + rnd(i * 11 + seed) * 120;
      const yy = y - 150 - rnd(i * 7 + seed) * 70;
      g.roundRect(x - 14, yy, 28, 120, 14).fill(o.color ?? 0x0a0614);
      g.roundRect(x - 26, yy - 50, 52, 86, 8).fill(0x14101c).stroke({ width: 3, color: 0x2a2436 });
      g.roundRect(x - 21, yy - 45, 42, 76, 5).fill({ color: 0xbfe6ff, alpha: 0.85 });
    }
  c.addChild(g);
  return c;
}

/** the stage seen from the audience (static): deck, neon edge, runway, trapdoor, monitors */
export function stageDeck(o: { y?: number; edge?: number; runway?: boolean } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  const y = o.y ?? 720;
  const edge = o.edge ?? POP.pink;
  // back wall under the screens (dark)
  g.rect(-400, y - 60, 2720, 60).fill(0x120a22);
  // the deck (a wide trapezoid in perspective)
  g.poly([-200, y + 140, 2120, y + 140, 1640, y, 280, y]).fill(0x1e1236).stroke({ width: 4, color: 0x0a0614 });
  for (let i = 0; i < 9; i++) g.moveTo(280 + i * 170, y).lineTo(-200 + i * 290, y + 140).stroke({ width: 2, color: 0x2a1c48 });
  // the neon front edge
  g.rect(-200, y + 136, 2320, 10).fill(edge);
  // the trapdoor in the centre
  g.poly([860, y + 70, 1060, y + 70, 1040, y + 30, 880, y + 30]).fill(0x140c26).stroke({ width: 3, color: 0x3a2a5a });
  // the runway toward us
  if (o.runway !== false) {
    g.poly([880, y + 146, 1040, y + 146, 1180, 1200, 740, 1200]).fill(0x24183e).stroke({ width: 3, color: 0x0a0614 });
    g.moveTo(880, y + 146).lineTo(740, 1200).stroke({ width: 6, color: POP.cyan });
    g.moveTo(1040, y + 146).lineTo(1180, 1200).stroke({ width: 6, color: POP.cyan });
  }
  // wedge monitors on the deck
  for (const x of [420, 660, 1260, 1500]) g.poly([x - 50, y + 120, x + 50, y + 120, x + 36, y + 84, x - 36, y + 84]).fill(0x0c0818).stroke({ width: 2, color: 0x2a2040 });
  // the stairs at the sides
  for (let i = 0; i < 4; i++) {
    g.rect(150 - i * 30, y + 20 + i * 30, 140, 30).fill(0x170e2c).stroke({ width: 2, color: 0x2a1c48 });
    g.rect(1630 + i * 30, y + 20 + i * 30, 140, 30).fill(0x170e2c).stroke({ width: 2, color: 0x2a1c48 });
  }
  c.addChild(g);
  return c;
}

/** the light rig across the top: a box truss with lamp heads hanging; it can fall (rotate around one end + drop) */
export class Truss extends Container {
  readonly lamps: [number, number][] = [];
  private g = new Graphics();
  private glows: Sprite[] = [];
  constructor(
    ctx: SceneCtx,
    readonly x0: number,
    readonly x1: number,
    readonly ty: number,
    o: { lamps?: number; color?: number } = {},
  ) {
    super();
    const y = ty;
    const g = this.g;
    const h = 46;
    const col = o.color ?? 0x8a8aa0;
    g.rect(x0, y, x1 - x0, 6).fill(col).rect(x0, y + h, x1 - x0, 6).fill(col);
    for (let x = x0; x < x1; x += h) g.moveTo(x, y + 3).lineTo(x + h / 2, y + h + 3).lineTo(x + h, y + 3).stroke({ width: 3, color: col });
    const n = o.lamps ?? 8;
    const glow = ctx.tex('pop:glow');
    for (let i = 0; i < n; i++) {
      const lx = x0 + ((i + 0.5) / n) * (x1 - x0);
      const ly = y + h + 30;
      g.rect(lx - 3, y + h, 6, 16).fill(0x2a2a36);
      g.roundRect(lx - 22, ly - 18, 44, 40, 8).fill(0x1a1a24).stroke({ width: 2, color: 0x4a4a5a });
      g.circle(lx, ly + 16, 12).fill(0xfff2d8);
      this.lamps.push([lx, ly + 16]);
      if (glow) {
        const s = new Sprite(glow);
        s.anchor.set(0.5);
        s.blendMode = 'add';
        s.scale.set(0.4);
        s.position.set(lx, ly + 16);
        s.tint = [POP.pink, POP.cyan, POP.yellow, POP.lilac][i % 4];
        this.glows.push(s);
      }
    }
    this.addChild(g, ...this.glows);
    this.pivot.set(x0, y);
    this.position.set(x0, y);
  }
  /** lamps on (0..1) */
  light(k: number) {
    for (const s of this.glows) s.alpha = k;
  }
  /** fall progress 0..1 (hinged at the left end; it swings down and drops) · hold = held by the beam (0..1) */
  fall(p: number, hold = 0) {
    const k = Math.max(0, Math.min(1, p));
    const drop = k * k;
    this.rotation = drop * 0.42 * (1 - hold * 0.15);
    this.position.set(this.x0, this.ty + drop * 380 * (1 - hold * 0.35));
  }
}

/** the four screens of the stage: main (16:9), two side screens (portrait), the strip under the main one. `s` = world
 * scale (2: the stadium is drawn at 2× so a screen can fill the frame at fov 1 with crisp text). Positions are in the
 * 1920 layout × s around the centre (960, 540). */
export class LedWall extends Container {
  readonly main: LedPanel;
  readonly left: LedPanel;
  readonly right: LedPanel;
  readonly strip: LedPanel;
  constructor(ctx: SceneCtx, o: { y?: number; dots?: number; s?: number } = {}) {
    super();
    const s = o.s ?? 1;
    const y = o.y ?? 110;
    const t = tx(ctx);
    const d = o.dots ?? 0.5;
    const W = (x: number) => 960 + (x - 960) * s;
    const Y = (yy: number) => 540 + (yy - 540) * s;
    this.main = new LedPanel(t, 800 * s, 450 * s, { dots: d, bw: 14 * s, dotScale: 1 });
    this.main.position.set(W(560), Y(y));
    this.left = new LedPanel(t, 300 * s, 440 * s, { dots: d, bw: 14 * s });
    this.left.position.set(W(170), Y(y + 20));
    this.right = new LedPanel(t, 300 * s, 440 * s, { dots: d, bw: 14 * s });
    this.right.position.set(W(1450), Y(y + 20));
    this.strip = new LedPanel(t, 1100 * s, 64 * s, { dots: d, bw: 8 * s });
    this.strip.position.set(W(410), Y(y + 474));
    this.addChild(this.left, this.right, this.main, this.strip);
  }
  get panels() {
    return [this.left, this.main, this.right, this.strip];
  }
}
/** scale a container drawn in the 1920 layout to the s× stadium world (around the centre) */
export function world<T extends Container>(c: T, s = 2): T {
  c.scale.set(s);
  c.position.set(960 - 960 * s, 540 - 540 * s);
  return c;
}

/** Firma's glass cube (w × w, local 0,0 = bottom centre) with Cerito inside */
export class GlassCube extends Container {
  readonly cerito: StaticKitten;
  private glass = new Graphics();
  private lid = new Graphics();
  private cracks = new Graphics();
  private shine: Sprite | null;
  private crackPts: [number, number][][] = [];
  constructor(
    ctx: SceneCtx,
    readonly w = 260,
  ) {
    super();
    const h = w;
    const back = new Graphics().rect(-w / 2, -h, w, h).fill({ color: 0xbfe8ff, alpha: 0.08 });
    this.cerito = new StaticKitten(ctx, w * 0.62);
    this.cerito.position.set(0, -6);
    const g = this.glass;
    // the glass: faint fill, bright edges, a depth offset (a box seen from the front, a little from above)
    const d = w * 0.16;
    g.poly([-w / 2, -h, -w / 2 + d, -h - d, w / 2 + d, -h - d, w / 2, -h]).fill({ color: 0xdff4ff, alpha: 0.12 });
    g.poly([w / 2, -h, w / 2 + d, -h - d, w / 2 + d, -d, w / 2, 0]).fill({ color: 0xdff4ff, alpha: 0.1 });
    g.rect(-w / 2, -h, w, h).stroke({ width: 4, color: 0xe8f8ff, alpha: 0.9 });
    g.moveTo(-w / 2, -h).lineTo(-w / 2 + d, -h - d).lineTo(w / 2 + d, -h - d).lineTo(w / 2 + d, -d).lineTo(w / 2, 0).stroke({ width: 3, color: 0xe8f8ff, alpha: 0.7 });
    g.moveTo(w / 2, -h).lineTo(w / 2 + d, -h - d).stroke({ width: 3, color: 0xe8f8ff, alpha: 0.7 });
    g.rect(-w / 2 - 10, -4, w + d + 20, 12).fill(0x2a2a3a).stroke({ width: 2, color: 0x6a6a80 });
    // the lid (separate: it opens)
    this.lid.rect(-w / 2 - 6, -10, w + d + 12, 14).fill({ color: 0xe8f8ff, alpha: 0.5 }).stroke({ width: 3, color: 0xffffff });
    this.lid.position.set(0, -h);
    const glow = ctx.tex('pop:flare');
    this.shine = glow ? new Sprite(glow) : null;
    if (this.shine) {
      this.shine.anchor.set(0.5);
      this.shine.blendMode = 'add';
      this.shine.rotation = -0.9;
      this.shine.scale.set(0.5, 1.2);
      this.shine.alpha = 0.25;
      this.shine.position.set(-w * 0.15, -h * 0.6);
    }
    // crack lines from one impact point (they appear progressively)
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + rnd(k) * 0.5;
      const pts: [number, number][] = [[w * 0.12, -h * 0.55]];
      let x = w * 0.12;
      let y = -h * 0.55;
      for (let s = 0; s < 4; s++) {
        x += Math.cos(a + (rnd(k * 5 + s) - 0.5) * 0.8) * w * 0.13;
        y += Math.sin(a + (rnd(k * 7 + s) - 0.5) * 0.8) * w * 0.13;
        pts.push([Math.max(-w / 2, Math.min(w / 2, x)), Math.max(-h, Math.min(0, y))]);
      }
      this.crackPts.push(pts);
    }
    this.addChild(back, this.cerito, g, this.cracks, this.lid);
    if (this.shine) this.addChild(this.shine);
  }
  update(lt: number, o: { lid?: number; crack?: number; stare?: number; clear?: number; shine?: number; empty?: boolean } = {}) {
    this.cerito.visible = !o.empty;
    this.cerito.update(lt, { stare: o.stare ?? 0.7, clear: o.clear ?? 0 });
    const lid = o.lid ?? 0;
    this.lid.rotation = -lid * 1.2;
    this.lid.position.set(-this.w / 2 + lid * 10, -this.w - lid * 30);
    this.lid.pivot.set(-this.w / 2, 0);
    const c = this.cracks.clear();
    const k = o.crack ?? 0;
    if (k > 0)
      for (const pts of this.crackPts) {
        const n = Math.max(1, Math.floor(pts.length * Math.min(1, k * 1.4)));
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < n; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
      }
    if (this.shine) this.shine.alpha = Math.min(0.3, o.shine ?? 0.25);
  }
}

/** black flight cases with silver corners and STAFF stencils (the crew hides behind them) */
export function flightCases(o: { x?: number; y?: number; n?: number; scale?: number } = {}): Graphics {
  const g = new Graphics();
  const x0 = o.x ?? 0;
  const y0 = o.y ?? 0;
  const s = o.scale ?? 1;
  const sizes: [number, number, number, number][] = [
    [0, 0, 300, 180],
    [280, -40, 240, 220],
    [500, 10, 340, 170],
    [60, -180, 220, 180],
    [600, -150, 200, 160],
  ];
  for (const [dx, dy, w, h] of sizes.slice(0, o.n ?? 5)) {
    const x = x0 + dx * s;
    const y = y0 + dy * s;
    const W = w * s;
    const H = h * s;
    g.roundRect(x, y - H, W, H, 6).fill(0x17151d).stroke({ width: 3, color: 0x050408 });
    g.rect(x, y - H * 0.55, W, 5 * s).fill(0x2c2a34);
    for (const [cx, cy] of [
      [x, y - H],
      [x + W - 22 * s, y - H],
      [x, y - 22 * s],
      [x + W - 22 * s, y - 22 * s],
    ])
      g.rect(cx, cy, 22 * s, 22 * s).fill(0xb8bcc8).stroke({ width: 1.5, color: 0x5a5c68 });
    g.roundRect(x + W * 0.38, y - H * 0.62, W * 0.24, 14 * s, 4).fill(0x8a8c98);
    // a stencil «STAFF» made of blocks (no font): five little rectangles
    for (let i = 0; i < 5; i++) g.rect(x + W * 0.2 + i * W * 0.12, y - H * 0.3, W * 0.08, H * 0.12).fill({ color: 0xe8e2c8, alpha: 0.55 });
  }
  return g;
}

/** out-of-focus stadium lights behind a close shot (static; plane it far, maybe 'dof') */
export function bokeh(ctx: SceneCtx, o: { n?: number; colors?: number[]; seed?: number; w?: number; h?: number; base?: number } = {}): Container {
  const c = new Container();
  const w = o.w ?? 2400;
  const h = o.h ?? 1400;
  const bg = new Graphics();
  for (let i = 0; i < 24; i++) bg.rect(-240, -160 + (h * i) / 24, w, h / 24 + 1).fill(mix(o.base ?? 0x0c0620, 0x2a1050, i / 24));
  c.addChild(bg);
  const glow = ctx.tex('pop:glow');
  const cols = o.colors ?? [POP.pink, POP.cyan, POP.yellow, POP.lilac, 0xffffff];
  for (let i = 0; i < (o.n ?? 70) && glow; i++) {
    const s = new Sprite(glow);
    s.anchor.set(0.5);
    s.blendMode = 'add';
    s.tint = cols[i % cols.length];
    s.position.set(-240 + rnd(i * 3 + (o.seed ?? 0)) * w, -160 + rnd(i * 7 + 2 + (o.seed ?? 0)) * h * 0.8);
    s.scale.set(0.3 + rnd(i + 9) * 0.9);
    s.alpha = 0.25 + rnd(i + 4) * 0.4;
    c.addChild(s);
  }
  return c;
}

/** a soft additive glow sprite (tinted) */
export function glowAt(ctx: SceneCtx, x: number, y: number, s: number, color: number, alpha = 0.6): Sprite | null {
  const t: Texture | undefined = ctx.tex('pop:glow');
  if (!t) return null;
  const sp = new Sprite(t);
  sp.anchor.set(0.5);
  sp.blendMode = 'add';
  sp.position.set(x, y);
  sp.scale.set(s);
  sp.tint = color;
  sp.alpha = alpha;
  return sp;
}

export function mix(a: number, b: number, k: number) {
  const c = Math.max(0, Math.min(1, k));
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - c) + ((b >> s) & 255) * c) << s;
  return ch(16) | ch(8) | ch(0);
}

/**
 * The whole stadium for a wide shot (2× world): the bowl + phones (z 1400), the stage + rig + beams (z 1000), the LED
 * wall (z 1000, panels at 2× so their type is crisp at fov 1), the front rows (z 700). Returns the parts and a
 * per-frame `update`. The camera: (960, 540, fov 0.5) frames the 1920 layout; (960, 130, fov 1) fills the frame with
 * the main screen; the side screens sit at x 960 ± 1130 · y ≈ 170, the strip at y ≈ 470.
 */
export interface Stadium {
  wall: LedWall;
  phones: PhoneSea;
  truss: Truss;
  spots: Spots;
  deck: Container;
  front: Container | null;
  /** a container in the 1920 layout (2×) at z 1000, in front of the stage (the cube, Firma…) */
  stage: Container;
  update(lt: number, o: { phones?: number; beams?: number; lamps?: number; rm: boolean; aim?: (i: number) => number | null }): void;
}
export function stadium(ctx: SceneCtx, o: { seed?: number; front?: boolean; beams?: number; into?: Container } = {}): Stadium {
  const place = (c: Container, z: number) => (o.into ? o.into.addChild(c) : ctx.plane(c, { z }));
  const far = world(new Container());
  far.addChild(arenaBack({ seed: o.seed ?? 3 }));
  const phones = new PhoneSea(ctx, { n: 240, seed: o.seed ?? 3 });
  far.addChild(phones);
  place(far, 1400);
  const wall = new LedWall(ctx, { s: 2, dots: 0.42 });
  const wp = new Container();
  wp.addChild(wall);
  place(wp, 1000);
  const near = world(new Container());
  const deck = stageDeck({ y: 720 });
  near.addChild(deck);
  const truss = new Truss(ctx, 60, 1860, 30, { lamps: 9 });
  near.addChild(truss);
  const spots = new Spots(
    tx(ctx),
    truss.lamps.slice(1, 8).map(([x, y], i) => ({ x, y, len: 900, half: 120, color: [POP.pink, POP.cyan, POP.yellow, POP.lilac, POP.mint, POP.pink, POP.cyan][i], a: Math.PI / 2 + (i - 3) * 0.12, amp: 0.32, w: 0.9 + i * 0.07, ph: i * 1.3, alpha: 0.32 })).slice(0, o.beams ?? 7),
  );
  near.addChild(spots);
  const stage = new Container();
  near.addChild(stage);
  place(near, 1000);
  let front: Container | null = null;
  if (o.front !== false) {
    front = world(new Container());
    front.addChild(crowdFront({ y: 1110, seed: (o.seed ?? 3) + 1 }));
    place(front, 1000);
  }
  return {
    wall,
    phones,
    truss,
    spots,
    deck,
    front,
    stage,
    update(lt, u) {
      phones.update(lt, u.phones ?? 0.35, u.rm);
      truss.light(u.lamps ?? 0.8);
      spots.update(lt, u.beams ?? 0.9, u.rm, u.aim);
    },
  };
}
