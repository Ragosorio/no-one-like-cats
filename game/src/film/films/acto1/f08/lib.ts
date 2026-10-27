/**
 * F08 OH SHIT — shared pieces of the multiverse fall (Pixi). The film's clock, the trio that falls through every
 * universe (Canelo held by the scarf, Luzterna, Hipólito asleep), Canelo's flame that drops a step at every crack, the
 * glass of the TV (its crack web and the shards it breaks into), the white page RIFT between universes, the frames and
 * the censored «OH SH—».
 */
import { Container, Graphics, Sprite, Ticker, type Texture } from 'pixi.js';
import type { FrameInfo, SceneCtx } from '../../../stage';
import type { Actor } from '../../../../momentos/anime/actor';
import { CERITO, TV, flame, kitTex, lanternAt, luzOf, rnd, seg, sm, tailTip, word, type LuzRig } from '../kit';
import { BAR, T } from './time';
import { STANDINS } from '../../../standins';

export { BAR, T };

// ------------------------------------------------------------------ the flame: a step down at every crack
const STEPS: [number, number][] = [
  [T(57), 0.86],
  [T(72), 0.74],
  [T(87), 0.64],
  [T(100), 0.56],
  [T(115), 0.48],
];
/** Canelo's flame at film time m (1 = normal … 0.48 = chica), with a short flicker-dip at each step */
export function flameK(m: number): number {
  let k = 1;
  for (const [t, v] of STEPS) {
    if (m < t) break;
    const p = (m - t) / 0.45;
    k = p < 1 ? v - 0.22 * Math.sin(p * Math.PI) : v;
  }
  return Math.max(0.15, k);
}

// ------------------------------------------------------------------ rig points on an actor
export function rigPoint(a: Actor | null, which: 'neck' | 'head' | 'nose'): [number, number] | null {
  const p = a?.puppet;
  const rig = p?.brain.model?.rig;
  if (!p || !rig) return null;
  let x: number;
  let y: number;
  if (which === 'neck' && rig.neck) [x, y] = rig.neck;
  else if (which === 'nose') {
    x = rig.head[0];
    y = rig.head[1] + rig.head[3] * 0.45;
  } else [x, y] = [rig.head[0], rig.head[1]];
  const lx = (x - p.anchor.x * p.W) * p.scale.x * a!.scale.x;
  const ly = (y - p.anchor.y * p.H) * p.scale.y * a!.scale.y;
  const c = Math.cos(a!.rotation);
  const s = Math.sin(a!.rotation);
  return [a!.x + lx * c - ly * s, a!.y + lx * s + ly * c];
}

// ------------------------------------------------------------------ puppets that only breathe while their scene is on
/**
 * A film this long builds ~70 puppets (the trio in every universe), and every CatPuppet ticks on the shared ticker —
 * deforms and uploads its mesh — even while its scene is hidden (measured: 25 ms frames in the first universes). A
 * Drive takes its puppets off the shared ticker and ticks them from the set's own update (only the scene on screen).
 */
export class Drive {
  private list: { p: { destroyed: boolean; tick(t: { deltaMS: number }): void }; last: number }[] = [];
  add<T extends Actor | null>(a: T): T {
    const p = a?.puppet as unknown as { destroyed: boolean; tick(t: { deltaMS: number }): void } | undefined;
    if (!p) return a;
    Ticker.shared.remove(p.tick, p);
    this.list.push({ p, last: NaN });
    return a;
  }
  /** call once per frame with the scene-local time (f.lt) */
  tick(lt: number) {
    for (const e of this.list) {
      let dt = Number.isNaN(e.last) ? 1 / 60 : lt - e.last;
      if (dt <= 0 || dt > 0.1) dt = 1 / 60;
      e.last = lt;
      if (!e.p.destroyed) e.p.tick({ deltaMS: dt * 1000 });
    }
  }
}

// ------------------------------------------------------------------ the trio that falls
export interface FallOpts {
  /** Canelo's place and size */
  x: number;
  y: number;
  s?: number;
  /** 0..1: Luzterna holds him by the scarf (from c57) */
  hold?: number;
  /** 0..1 tumbling (rotation) */
  tumble?: number;
  /** where she floats relative to him (×s) */
  luz?: [number, number] | null;
  hipo?: [number, number] | null;
  /** flip Canelo (faces left) */
  flipC?: boolean;
  /** a scarf colour for the universe */
  scarf?: number;
  /** strap outline */
  ink?: number;
  /** hide her / him */
  noLuz?: boolean;
  noHipo?: boolean;
  /** override Canelo's rotation */
  rotC?: number;
  /** extra squash on Canelo */
  sqC?: number;
}
/**
 * Canelo, Luzterna and Hipólito falling. Mount `root` in a plane; call update every frame. The strap (her hand → his
 * scarf), the snore bubble, the tail flame are small per-frame redraws.
 */
export class Trio {
  readonly root = new Container();
  readonly canelo: Actor | null;
  readonly luz: LuzRig;
  readonly hipo: Actor | null;
  private back = new Graphics();
  private front = new Graphics();
  private lglow: Sprite;
  private drive = new Drive();
  constructor(
    private ctx: SceneCtx,
    size = 360,
  ) {
    this.canelo = this.drive.add(ctx.actor(ctx.canelo, size));
    this.luz = luzOf(ctx, size * 0.95);
    this.drive.add(this.luz.actor);
    this.hipo = this.drive.add(ctx.actor('hipolito_tavern_cat', size * 0.92));
    this.lglow = new Sprite(kitTex(ctx, 'glow'));
    this.lglow.anchor.set(0.5);
    this.lglow.tint = TV.lantern;
    this.lglow.blendMode = 'add';
    this.root.addChild(this.back);
    if (this.hipo) this.root.addChild(this.hipo);
    if (this.luz.actor) this.root.addChild(this.luz.actor);
    if (this.canelo) this.root.addChild(this.canelo);
    this.root.addChild(this.front, this.lglow);
  }
  update(lt: number, f: FrameInfo, o: FallOpts) {
    this.drive.tick(f.lt);
    const rm = this.ctx.rm;
    const s = o.s ?? 1;
    const tum = (o.tumble ?? 0.6) * (rm ? 0.15 : 1);
    const sway = rm ? 0.35 : 1;
    const cx = o.x + Math.sin(lt * 1.3) * 18 * sway;
    const cy = o.y + Math.sin(lt * 2.1) * 10 * sway;
    const sq = o.sqC ?? 0;
    this.canelo?.pose(lt, cx, cy, { rot: o.rotC ?? Math.sin(lt * 1.1) * 0.32 * tum, flip: !!o.flipC, sx: s * (1 + sq), sy: s * (1 - sq) });
    const L = o.luz === undefined ? [250, -230] : o.luz;
    const la = this.luz.actor;
    if (la) {
      la.visible = !o.noLuz && !!L;
      if (L) la.pose(lt, cx + L[0] * s + Math.sin(lt * 1.7 + 1) * 8 * sway, cy + L[1] * s + Math.sin(lt * 1.6) * 10 * sway, { rot: Math.sin(lt * 0.9) * 0.08 * tum, flip: L[0] > 0, sx: s, sy: s });
    }
    const H = o.hipo === undefined ? [-300, -60] : o.hipo;
    if (this.hipo) {
      this.hipo.visible = !o.noHipo && !!H;
      if (H) this.hipo.pose(lt, cx + H[0] * s + Math.sin(lt * 0.8) * 14 * sway, cy + H[1] * s, { rot: lt * 0.5 * tum + 0.3, sx: s, sy: s });
    }
    // the strap: her hand (near the lantern side, a little in) → his scarf
    const b = this.back.clear();
    const fr = this.front.clear();
    const hold = o.hold ?? 0;
    const neck = rigPoint(this.canelo, 'neck');
    if (hold > 0.01 && la?.visible && neck) {
      const hx = la.x + (la.scale.x < 0 ? 0.18 : -0.18) * 330 * s;
      const hy = la.y - 0.42 * 330 * s;
      const ex = neck[0] + (hx - neck[0]) * hold;
      const ey = neck[1] + (hy - neck[1]) * hold;
      const mx = (neck[0] + ex) / 2 + Math.sin(lt * 7) * 10 * sway;
      const my = Math.max(neck[1], ey) + 40 * s;
      const col = o.scarf ?? 0xd0453a;
      b.moveTo(neck[0], neck[1]).quadraticCurveTo(mx, my, ex, ey).stroke({ width: 26 * s, color: o.ink ?? TV.line, cap: 'round' });
      b.moveTo(neck[0], neck[1]).quadraticCurveTo(mx, my, ex, ey).stroke({ width: 16 * s, color: col, cap: 'round' });
      fr.circle(ex, ey, 13 * s).fill(col).stroke({ width: 4, color: o.ink ?? TV.line });
    }
    // the snore bubble
    const nose = rigPoint(this.hipo, 'nose');
    if (this.hipo?.visible && nose) {
      const ph = (lt % 2.4) / 2.4;
      const r = (8 + 34 * Math.sin(ph * Math.PI * 0.95)) * s;
      fr.circle(nose[0] + 30 * s, nose[1] + 4, r).fill({ color: 0xcfe9ff, alpha: 0.45 }).stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
      fr.circle(nose[0] + 30 * s - r * 0.35, nose[1] + 4 - r * 0.35, r * 0.18).fill({ color: 0xffffff, alpha: 0.9 });
    }
    // the tail flame (steps down at every crack)
    const tip = tailTip(this.canelo);
    if (tip && this.canelo?.visible !== false) flame(fr, tip[0], tip[1], flameK(f.m), lt, { rm, scale: s * 0.9 });
    if (la?.visible) {
      const [lx, ly] = lanternAt(this.luz);
      this.lglow.visible = true;
      this.lglow.position.set(lx, ly);
      this.lglow.scale.set(0.9 * s);
      this.lglow.alpha = 0.55;
    } else this.lglow.visible = false;
  }
}

// ------------------------------------------------------------------ Cerito in the trace of each universe
/**
 * Cerito tries on every universe: his kitten painting baked by THAT style (ctx.still), crawling with a little static,
 * eyes lit. `clear` = no static at all (El Grito). Needs CERITO in the set's `cats`.
 */
export class Cerito extends Container {
  private still: Sprite | null;
  private noise: Sprite[] = [];
  private eyes: Sprite[] = [];
  private eyeAt: [number, number][] = [];
  constructor(
    private ctx: SceneCtx,
    size: number,
    o: { tint?: number; flip?: boolean } = {},
  ) {
    super();
    this.still = ctx.still(CERITO);
    const sil = ctx.silhouette(CERITO);
    if (this.still) {
      const sc = size / this.still.texture.height;
      this.still.scale.set(o.flip ? -sc : sc, sc);
      if (o.tint !== undefined) this.still.tint = o.tint;
      this.addChild(this.still);
      if (sil) {
        sil.scale.copyFrom(this.still.scale);
        sil.tint = 0xdfe6ff;
        sil.blendMode = 'add';
        this.noise.push(sil);
        this.addChild(sil);
      }
      const p = ctx.studio.puppet(CERITO);
      const rig = p?.brain.model?.rig;
      if (p && rig?.eyes?.length)
        for (const e of rig.eyes) this.eyeAt.push([((e[0] + e[2]) / 2 - p.anchor.x * p.W) * (size / p.H) * (o.flip ? -1 : 1), ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * (size / p.H)]);
      p?.destroy();
    }
    for (const pt of this.eyeAt) {
      const e = new Sprite(kitTex(ctx, 'glow'));
      e.anchor.set(0.5);
      e.tint = 0x9fe8ff;
      e.blendMode = 'add';
      e.position.set(pt[0], pt[1]);
      this.eyes.push(e);
      this.addChild(e);
    }
  }
  update(lt: number, o: { clear?: number; stare?: number } = {}) {
    const clear = o.clear ?? 0;
    const st = Math.floor(lt * 12);
    // the static: the silhouette flickers in light on twos (softer with «Reducir destellos»)
    for (const n of this.noise) n.alpha = (1 - clear) * (this.ctx.rf ? 0.18 : 0.12 + 0.3 * rnd(st));
    const stare = o.stare ?? 0.5;
    for (const e of this.eyes) {
      e.scale.set(0.12 + stare * 0.1);
      e.alpha = 0.5 + stare * 0.5;
    }
  }
}

// ------------------------------------------------------------------ the glass of the TV: the crack web and its shards
/** the 4:3 picture rect of the TV in design px */
export const TVR = { x: 240, y: 0, w: 1440, h: 1080 };
const GX = 5;
const GY = 4;
/** a jittered grid over the TV glass (the same seed draws the cracks and cuts the shards) */
export function glassGrid(): [number, number][][] {
  const pts: [number, number][][] = [];
  for (let j = 0; j <= GY; j++) {
    const row: [number, number][] = [];
    for (let i = 0; i <= GX; i++) {
      const edgeX = i === 0 || i === GX;
      const edgeY = j === 0 || j === GY;
      const x = TVR.x + (TVR.w * i) / GX + (edgeX ? 0 : (rnd(i * 13 + j * 7) - 0.5) * 180);
      const y = TVR.y + (TVR.h * j) / GY + (edgeY ? 0 : (rnd(i * 5 + j * 17 + 3) - 0.5) * 150);
      row.push([x, y]);
    }
    pts.push(row);
  }
  return pts;
}
/** the crack segments of the web, ordered from the impact point outward (draw the first n) */
export function crackSegments(): [number, number, number, number][] {
  const g = glassGrid();
  const segs: [number, number, number, number, number][] = [];
  const cx = 1010;
  const cy = 470;
  for (let j = 0; j <= GY; j++)
    for (let i = 0; i <= GX; i++) {
      const [x, y] = g[j][i];
      if (i < GX && j > 0 && j < GY) segs.push([x, y, g[j][i + 1][0], g[j][i + 1][1], 0]);
      if (j < GY && i > 0 && i < GX) segs.push([x, y, g[j + 1][i][0], g[j + 1][i][1], 0]);
    }
  for (const s of segs) s[4] = Math.hypot((s[0] + s[2]) / 2 - cx, (s[1] + s[3]) / 2 - cy);
  segs.sort((a, b) => a[4] - b[4]);
  // a few radial cracks from the impact
  const rad: [number, number, number, number][] = [];
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9 + 0.3;
    rad.push([cx, cy, cx + Math.cos(a) * (220 + rnd(k) * 260), cy + Math.sin(a) * (200 + rnd(k + 3) * 240)]);
  }
  return [...rad, ...segs.map((s) => [s[0], s[1], s[2], s[3]] as [number, number, number, number])];
}
/** draw the first `n` (fractional) crack segments, white glass lines with a darker edge */
export function drawCracks(g: Graphics, n: number, alpha = 1) {
  const segs = crackSegments();
  const whole = Math.floor(n);
  for (let i = 0; i < Math.min(segs.length, Math.ceil(n)); i++) {
    const [x0, y0, x1, y1] = segs[i];
    const p = i < whole ? 1 : n - whole;
    const ex = x0 + (x1 - x0) * p;
    const ey = y0 + (y1 - y0) * p;
    // a jagged line: 3 kinks
    const pts: number[] = [x0, y0];
    for (let k = 1; k < 4; k++) {
      const q = (k / 4) * p;
      const nx = -(y1 - y0);
      const ny = x1 - x0;
      const l = Math.hypot(nx, ny) || 1;
      const j = (rnd(i * 11 + k) - 0.5) * 18;
      pts.push(x0 + (x1 - x0) * q + (nx / l) * j, y0 + (y1 - y0) * q + (ny / l) * j);
    }
    pts.push(ex, ey);
    g.poly(pts, false).stroke({ width: 7, color: 0x1a1a2a, alpha: 0.5 * alpha, join: 'round' });
    g.poly(pts, false).stroke({ width: 3, color: 0xffffff, alpha: 0.95 * alpha, join: 'round' });
  }
}
/**
 * The TV glass breaking toward the camera: one Graphics per cell of the glass grid, filled with the static texture
 * (drawn once), flying outward, growing (toward us), turning, fading. `update(k)` with k = 0 (whole) … 1 (gone).
 */
export class Shards extends Container {
  private parts: { g: Graphics; cx: number; cy: number; dx: number; dy: number; rot: number; delay: number }[] = [];
  constructor(ctx: SceneCtx, tex?: Texture) {
    super();
    const grid = glassGrid();
    const t = tex ?? kitTex(ctx, 'static');
    for (let j = 0; j < GY; j++)
      for (let i = 0; i < GX; i++) {
        const q = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]];
        const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
        const cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
        const g = new Graphics();
        const pts = q.flatMap(([x, y]) => [x - cx, y - cy]);
        g.poly(pts).fill({ texture: t, color: 0x8a90c8 });
        g.poly(pts).fill({ color: 0x2a2f6a, alpha: 0.35 });
        g.poly(pts).stroke({ width: 5, color: 0xffffff, alpha: 0.9, join: 'round' });
        // a glint
        g.moveTo(pts[0] * 0.6, pts[1] * 0.6).lineTo(pts[2] * 0.5, pts[3] * 0.5).stroke({ width: 3, color: 0xffffff, alpha: 0.6 });
        g.position.set(cx, cy);
        const d = Math.hypot(cx - 1010, cy - 470);
        this.parts.push({ g, cx, cy, dx: (cx - 960) / 700, dy: (cy - 540) / 700 + 0.2, rot: (rnd(i * 3 + j * 7) - 0.5) * 2.4, delay: d / 2600 });
        this.addChild(g);
      }
  }
  update(k: number, rm: boolean) {
    for (const p of this.parts) {
      const q = Math.max(0, Math.min(1, (k - p.delay) / 0.75));
      if (rm) {
        p.g.position.set(p.cx, p.cy);
        p.g.scale.set(1);
        p.g.rotation = 0;
        p.g.alpha = 1 - sm(k);
        continue;
      }
      const e = q * q;
      p.g.position.set(p.cx + p.dx * 1400 * e, p.cy + p.dy * 1400 * e + 600 * e * e);
      p.g.scale.set(1 + 2.2 * e);
      p.g.rotation = p.rot * e;
      p.g.alpha = 1 - sm((q - 0.55) / 0.45);
    }
  }
}

// ------------------------------------------------------------------ the white page rift between universes
/**
 * The «grieta»: a jagged white crack across the picture that opens into a blank page (the universe tears), and in the
 * next scene the page tears open onto the new world. «Reducir movimiento»: a fade to white / from white.
 */
export class Rift extends Graphics {
  private pts: [number, number][] = [];
  constructor(
    private seed: number,
    private view: { x: number; y: number; w: number; h: number },
  ) {
    super();
    const n = 14;
    const x0 = view.x - 60;
    const x1 = view.x + view.w + 60;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = 540 + Math.sin(i * 0.9 + seed) * 70 + (rnd(seed * 31 + i) - 0.5) * 120;
      this.pts.push([x, y]);
    }
  }
  /** c = crack growth 0..1 (from the centre outward), o = how open the white page is 0..1 */
  crack(c: number, o: number, rm: boolean) {
    const g = this.clear();
    const v = this.view;
    if (rm) {
      if (c > 0 || o > 0) g.rect(v.x - 10, v.y - 10, v.w + 20, v.h + 20).fill({ color: 0xfbf8f0, alpha: Math.max(c * 0.25, o) });
      return;
    }
    if (o > 0) {
      const up = o * 720;
      const pts: number[] = [];
      this.pts.forEach(([x, y], i) => pts.push(x, y - up * (0.8 + 0.2 * rnd(this.seed + i))));
      for (let i = this.pts.length - 1; i >= 0; i--) pts.push(this.pts[i][0], this.pts[i][1] + up * (0.8 + 0.2 * rnd(this.seed + i + 40)));
      g.poly(pts).fill(0xfbf8f0);
    }
    if (c > 0) {
      const mid = this.pts.length / 2;
      const span = c * mid;
      const seg: number[] = [];
      this.pts.forEach(([x, y], i) => {
        if (Math.abs(i - mid) <= span + 0.5) seg.push(x, y);
      });
      if (seg.length >= 4) {
        g.poly(seg, false).stroke({ width: 22, color: 0xffffff, alpha: 0.35, join: 'round' });
        g.poly(seg, false).stroke({ width: 7, color: 0xffffff, alpha: 1, join: 'round' });
      }
    }
  }
  /** the next world tearing out of the white page: r = 0 (all white) … 1 (open) */
  reveal(r: number, rm: boolean) {
    const g = this.clear();
    const v = this.view;
    if (r >= 1) return;
    if (rm) {
      g.rect(v.x - 10, v.y - 10, v.w + 20, v.h + 20).fill({ color: 0xfbf8f0, alpha: 1 - sm(r) });
      return;
    }
    const e = sm(r);
    const top: number[] = [v.x - 80, v.y - 80];
    this.pts.forEach(([x, y], i) => top.push(x, y - e * (900 + 200 * rnd(this.seed + i))));
    top.push(v.x + v.w + 80, v.y - 80);
    const bot: number[] = [v.x - 80, v.y + v.h + 80];
    this.pts.forEach(([x, y], i) => bot.push(x, y + e * (900 + 200 * rnd(this.seed + i + 9))));
    bot.push(v.x + v.w + 80, v.y + v.h + 80);
    g.poly(top).fill(0xfbf8f0).poly(bot).fill(0xfbf8f0);
  }
}

// ------------------------------------------------------------------ text helpers
/** comic grawlix / impact lettering (built once) */
export const impact = (ctx: SceneCtx, text: string, size: number, fill: number, stroke: number = TV.line, font = 'Bangers') =>
  word(ctx.k, text, { fontFamily: font, fontSize: size, fill, stroke: { color: stroke, width: Math.max(6, size * 0.1), join: 'round' }, letterSpacing: size * 0.04 });

/** speed lines (radial or vertical), drawn once into a Graphics */
export function speedLines(g: Graphics, cx: number, cy: number, n: number, r0: number, r1: number, color: number, seed = 1) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(i + seed) * 0.05;
    const w = 6 + rnd(i * 3 + seed) * 22;
    const ri = r0 + rnd(i * 7 + seed) * (r1 - r0) * 0.3;
    const x0 = cx + Math.cos(a) * ri;
    const y0 = cy + Math.sin(a) * ri;
    const x1 = cx + Math.cos(a - w / 2600) * r1;
    const y1 = cy + Math.sin(a - w / 2600) * r1;
    const x2 = cx + Math.cos(a + w / 2600) * r1;
    const y2 = cy + Math.sin(a + w / 2600) * r1;
    g.poly([x0, y0, x1, y1, x2, y2]).fill(color);
  }
}
/** a vertical streak field (falling): `n` streaks in a tall strip, drawn once; scroll it per frame */
export function fallStreaks(g: Graphics, w: number, h: number, n: number, color: number, alpha: number, seed = 1) {
  for (let i = 0; i < n; i++) {
    const x = rnd(i + seed) * w;
    const y = rnd(i * 7 + seed) * h;
    const l = 60 + rnd(i * 3 + seed) * 220;
    g.roundRect(x, y, 4 + rnd(i * 5 + seed) * 6, l, 3).fill({ color, alpha: alpha * (0.4 + 0.6 * rnd(i * 11 + seed)) });
  }
}
/** wrap a scroll value into [-h, 0) for a strip drawn twice */
export const wrapScroll = (v: number, h: number) => -(((v % h) + h) % h);

// ------------------------------------------------------------------ the multiverse's own cats (their paintings)
/** the approved paintings of the universes they fall through (film/standins.ts) */
export const MULTI = {
  murciegato: STANDINS.murciegato,
  aranya: STANDINS.aranya,
  aranyaNoir: STANDINS.aranyaNoir,
  aranyaBlanca: STANDINS.aranyaBlanca,
  aranya2099: STANDINS.aranya2099,
  homiau: STANDINS.homiau,
  gatzilla: 'gatzilla_kaiju_cat',
  comecroquetas: 'comecroquetas_pellet_cat',
  gritito: 'gritito_scream_cat',
} as const;
/**
 * A cat of another universe HANGING UPSIDE DOWN from its thread (the spider family): a Container whose origin is the
 * thread's end (his feet); the puppet hangs below it. `size` = the painting's height.
 */
export function hanging(ctx: SceneCtx, slug: string, size: number): { root: Container; actor: Actor | null } {
  const root = new Container();
  const actor = ctx.actor(slug, size);
  if (actor) {
    actor.rotation = Math.PI;
    root.addChild(actor);
  }
  return { root, actor };
}
export { seg, sm, rnd };
