/**
 * ACTO I — the shared kit of the Act I films (La Borracha is a TV box: every film is a «programa» on its 4:3 screen).
 *
 *   kitTex(ctx, name)   build-time textures shared by a film (one bake per film): scan · static · glow · cone · edge
 *   TvScreen            the 4:3 TV over the picture: rounded corners, scanlines, curved-glass edge, glare (screen plane)
 *   Bitacora            «LO QUE ARRIESGAMOS»: the logbook page rises from below and her hand writes it (never her name)
 *   luzOf / Beam        Luzterna floating with her lantern, its point in the set, the blue beam she carries things with
 *   StaticKitten        Cerito / REGISTRO 000: a kitten made of static (a real outline), eyes lit
 *   Homiau              his painting (homiau_donut_cat) acting like the old code-drawn stand-in: chew, donut up, look, cry
 *   flame               Canelo's tail flame (normal / chica / mínima), drawn on his rig's tail tip
 *   word                a prebuilt text sprite (cached by the Momento text cache: never on the clock)
 *
 * Rules: everything is a function of lt; textures, texts and big Graphics are made in build; per frame only small
 * redraws (a mask rect, a flame, a beam).
 */
import { Container, Graphics, Sprite, Ticker, TilingSprite, type Texture, type TextStyleOptions } from 'pixi.js';
import { CanvasTextMetrics, TextStyle } from 'pixi.js';
import type { FrameInfo, SceneCtx } from '../../../stage';
import type { Baker } from '../../../bake';
import { BAKE_UV } from '../../../bake';
import type { Actor } from '../../../../momentos/anime/actor';
import type { Kit } from '../../../../momentos/anime/kit';
import { siluetaKeep } from '../../../../momentos/songs/drunck/silueta';
import { TV } from '../../../../momentos/songs/drunck/tv';
import { clamp01, rnd, seg, sm } from './t';
import { STANDINS } from '../../../standins';

export { TV, LW, box, disc, donut, mug, shape } from '../../../../momentos/songs/drunck/tv';
export * from './t';

// ------------------------------------------------------------------ build-time textures (one per film)
const CACHE = new WeakMap<Baker, Map<string, Texture>>();
const SRC: Record<string, [number, number, string]> = {
  scan: [8, 4, `void main() { vec2 uv = bakeUV(); float row = floor(uv.y * 4.0); finalColor = row > 2.5 ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(0.0); }`],
  static: [512, 512, `void main() { vec2 uv = bakeUV(); vec2 c = floor(uv * 256.0); float l = step(0.48, hash12(c)) * (0.55 + 0.45 * hash12(c + 7.0)); finalColor = vec4(vec3(l), 1.0); }`],
  glow: [256, 256, `void main() { vec2 uv = bakeUV() - 0.5; float d = length(uv) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2); finalColor = vec4(vec3(a), a); }`],
  // a soft wedge: apex on the left middle, opening to the right (the lantern beam, a spotlight)
  cone: [512, 256, `void main() { vec2 uv = bakeUV(); float x = uv.x; float y = abs(uv.y - 0.5) * 2.0; float w = mix(0.04, 1.0, x); float a = smoothstep(w, w * 0.55, y) * smoothstep(1.0, 0.55, x) * smoothstep(0.0, 0.06, x); finalColor = vec4(vec3(a), a); }`],
  // the curved-glass edge of a screen (dark at the rounded border, clear inside)
  edge: [512, 384, `void main() { vec2 uv = bakeUV(); vec2 d = abs(uv - 0.5) * 2.0; vec2 q = max(d - vec2(0.82, 0.76), 0.0); float r = length(q) + max(max(d.x - 0.82, d.y - 0.76), 0.0) * 0.0; float e = smoothstep(0.0, 0.24, length(max(d - vec2(0.7, 0.62), 0.0))) ; float a = clamp(e * 0.85 + pow(max(d.x, d.y), 8.0) * 0.35, 0.0, 1.0); finalColor = vec4(vec3(0.0), a); }`],
};
export function kitTex(ctx: SceneCtx, name: keyof typeof SRC | string): Texture {
  let m = CACHE.get(ctx.baker);
  if (!m) CACHE.set(ctx.baker, (m = new Map()));
  let t = m.get(name);
  if (!t) {
    const s = SRC[name];
    t = ctx.baker.shade(`a1-${name}`, s[0], s[1], `${BAKE_UV}\n${s[2]}`, {}, {}, { res: 1 });
    m.set(name, t);
  }
  return t;
}

// ------------------------------------------------------------------ text
/** a cached text sprite (anchor centre) — call in build only */
export const word = (k: Kit, text: string, style: TextStyleOptions, anchor = 0.5) => k.text.sprite(text, style, anchor);
/** the lines a wrapped style breaks a text into (for per-line reveals) */
export function wrapLines(text: string, style: TextStyleOptions): string[] {
  return CanvasTextMetrics.measureText(text, new TextStyle(style)).lines;
}

// ------------------------------------------------------------------ the TV screen (a screen plane)
export interface TvScreenOpts {
  aspect?: number;
  radius?: number;
  /** scanline strength (0..1) */
  scan?: number;
  glare?: number;
  /** the dark curved-glass edge */
  edge?: number;
}
/**
 * The Borracha's 4:3 TV: the stage's letterbox already blacks out the sides; this adds what makes it a TV — rounded
 * corners, scanlines, the dark curved edge and a soft glare. Mount it with `ctx.plane(screen, { z: 0, screen: true })`.
 */
export class TvScreen extends Container {
  private corners = new Graphics();
  private scan: TilingSprite;
  private edge: Sprite;
  private glare: Sprite;
  private key = '';
  constructor(
    private ctx: SceneCtx,
    private o: TvScreenOpts = {},
  ) {
    super();
    this.scan = new TilingSprite({ texture: kitTex(ctx, 'scan'), width: 10, height: 10 });
    this.scan.alpha = o.scan ?? 0.1;
    this.edge = new Sprite(kitTex(ctx, 'edge'));
    this.edge.alpha = o.edge ?? 0.55;
    this.glare = new Sprite(kitTex(ctx, 'glow'));
    this.glare.blendMode = 'add';
    this.glare.alpha = o.glare ?? 0.05;
    this.addChild(this.scan, this.edge, this.glare, this.corners);
    this.layout();
  }
  /** the picture rect of the 4:3 area this frame (design px) */
  rect(): { x: number; y: number; w: number; h: number } {
    const v = this.ctx.k.view;
    const a = this.o.aspect ?? 4 / 3;
    const h = Math.min(v.h, v.w / a);
    const w = h * a;
    return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
  }
  private layout() {
    const r = this.rect();
    const key = `${r.x},${r.y},${r.w},${r.h}`;
    if (key === this.key) return;
    this.key = key;
    this.scan.position.set(r.x, r.y);
    this.scan.width = r.w;
    this.scan.height = r.h;
    this.edge.position.set(r.x, r.y);
    this.edge.setSize(r.w, r.h);
    this.glare.position.set(r.x + r.w * 0.06, r.y + r.h * 0.02);
    this.glare.setSize(r.w * 0.5, r.h * 0.36);
    const R = this.o.radius ?? 54;
    const g = this.corners.clear();
    const corner = (cx: number, cy: number, sx: number, sy: number) => {
      const pts: number[] = [cx - sx * R, cy - sy * R];
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * (Math.PI / 2);
        pts.push(cx - sx * R + sx * (R - Math.cos(a) * R), cy - sy * R + sy * (R - Math.sin(a) * R));
      }
      return pts;
    };
    // each corner: the square outside the quarter circle
    for (const [cx, cy, sx, sy] of [
      [r.x + R, r.y + R, 1, 1],
      [r.x + r.w - R, r.y + R, -1, 1],
      [r.x + R, r.y + r.h - R, 1, -1],
      [r.x + r.w - R, r.y + r.h - R, -1, -1],
    ] as const) {
      const x0 = cx - sx * R;
      const y0 = cy - sy * R;
      const pts = [x0, y0, x0 + sx * R, y0];
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * (Math.PI / 2);
        pts.push(cx - sx * Math.sin(a) * R, cy - sy * Math.cos(a) * R);
      }
      pts.push(x0, y0 + sy * R);
      g.poly(pts).fill(0x000000);
    }
    void corner;
  }
  update(_f?: FrameInfo, o: { scan?: number; glare?: number } = {}) {
    this.layout();
    if (o.scan !== undefined) this.scan.alpha = o.scan;
    if (o.glare !== undefined) this.glare.alpha = o.glare;
  }
}

// ------------------------------------------------------------------ the logbook: LO QUE ARRIESGAMOS
export const NB = { paper: 0xf3ead2, rule: 0x9db8d9, margin: 0xd9786e, pencil: 0x55535e, pen: 0x2c3e6b, tape: 0xe9e0b8 } as const;
export interface BitacoraOpts {
  header?: string;
  /** page width (design px) */
  w?: number;
  /** body font size */
  size?: number;
  /** the page's resting top (design y) */
  top?: number;
  /** seconds the writing takes (default: by length) */
  write?: number;
}
/**
 * The Bitácora page: it rises from below and covers the lower half of the screen; her hand writes LO QUE ARRIESGAMOS
 * in pen-blue Permanent Marker, line by line, with a pencil that glows faintly blue (her light — never her name).
 * `update(t)` with t = seconds since the page started rising.
 */
export class Bitacora extends Container {
  private page = new Container();
  private lines: Sprite[] = [];
  private wmask = new Graphics();
  private pencil = new Graphics();
  private glow: Sprite;
  private header: Sprite;
  private widths: number[] = [];
  readonly dur: number;
  private W: number;
  private H: number;
  private top: number;
  constructor(ctx: SceneCtx, text: string, o: BitacoraOpts = {}) {
    super();
    const k = ctx.k;
    const W = (this.W = o.w ?? 1180);
    const size = o.size ?? 50;
    const style: TextStyleOptions = { fontFamily: 'Permanent Marker', fontSize: size, fill: NB.pen, wordWrap: true, wordWrapWidth: W - 220, lineHeight: size * 1.25 };
    const ls = wrapLines(text, style);
    const H = (this.H = 150 + ls.length * size * 1.25 + 80);
    this.top = o.top ?? 1080 - H + 30;
    // the page: paper, blue rules, red margin, two strips of tape, a coffee ring
    const g = new Graphics();
    g.roundRect(-W / 2 + 10, 14, W, H + 60, 10).fill({ color: 0x000000, alpha: 0.35 });
    g.roundRect(-W / 2, 0, W, H + 60, 8).fill(NB.paper);
    for (let y = 120; y < H + 40; y += size * 1.25) g.rect(-W / 2 + 20, y + size * 0.95, W - 40, 2).fill({ color: NB.rule, alpha: 0.8 });
    g.rect(-W / 2 + 120, 0, 3, H + 60).fill({ color: NB.margin, alpha: 0.85 });
    g.circle(W / 2 - 150, H - 30, 62).stroke({ width: 6, color: 0x9a6a3a, alpha: 0.18 });
    for (const [x, rot] of [
      [-W / 2 + 60, -0.12],
      [W / 2 - 70, 0.1],
    ] as const) {
      const t = new Graphics().rect(-70, -22, 140, 44).fill({ color: NB.tape, alpha: 0.75 });
      t.position.set(x, 4);
      t.rotation = rot;
      this.page.addChild(t);
    }
    this.page.addChildAt(g, 0);
    // a doodle in the corner: the gordo's face with his scarf (no names, ever)
    const d = new Graphics();
    const dx = W / 2 - 120;
    const dy = 70;
    d.circle(dx, dy, 30).stroke({ width: 3, color: NB.pen });
    d.poly([dx - 26, dy - 16, dx - 22, dy - 44, dx - 6, dy - 26]).stroke({ width: 3, color: NB.pen, join: 'round' });
    d.poly([dx + 26, dy - 16, dx + 22, dy - 44, dx + 6, dy - 26]).stroke({ width: 3, color: NB.pen, join: 'round' });
    d.circle(dx - 10, dy - 4, 3).fill(NB.pen).circle(dx + 10, dy - 4, 3).fill(NB.pen);
    d.moveTo(dx - 26, dy + 24).quadraticCurveTo(dx, dy + 36, dx + 26, dy + 24).stroke({ width: 7, color: 0xd9786e });
    this.page.addChild(d);
    this.header = word(k, o.header ?? 'LO QUE ARRIESGAMOS:', { fontFamily: 'Permanent Marker', fontSize: 34, fill: NB.pencil, letterSpacing: 2 }, 0);
    this.header.anchor.set(0, 0.5);
    this.header.position.set(-W / 2 + 150, 66);
    this.page.addChild(this.header);
    const body = new Container();
    ls.forEach((line, i) => {
      const sp = word(k, line, { ...style, wordWrap: false }, 0);
      sp.anchor.set(0, 0);
      sp.position.set(-W / 2 + 150, 120 + i * size * 1.25);
      body.addChild(sp);
      this.lines.push(sp);
      this.widths.push(sp.width);
    });
    body.mask = this.wmask;
    this.page.addChild(body, this.wmask);
    this.glow = new Sprite(kitTex(ctx, 'glow'));
    this.glow.anchor.set(0.5);
    this.glow.tint = TV.lantern;
    this.glow.blendMode = 'add';
    this.glow.scale.set(0.9);
    this.page.addChild(this.glow, this.pencil);
    this.addChild(this.page);
    const chars = text.length;
    this.dur = o.write ?? Math.max(1.6, Math.min(3.4, chars / 22));
  }
  /** t = seconds since the page started rising (rise 0.45 s, then write over `dur`) */
  update(t: number, rm = false) {
    const rise = sm(t / 0.45);
    this.page.position.set(960, rm ? this.top : this.top + (1 - rise) * (this.H + 160));
    this.page.alpha = rm ? rise : 1;
    const wp = clamp01((t - 0.5) / this.dur);
    const total = this.widths.reduce((a, b) => a + b, 0) || 1;
    let left = wp * total;
    const m = this.wmask.clear();
    let head: [number, number] = [-this.W / 2 + 150, 120];
    m.rect(-this.W / 2, 0, this.W, 112).fill(0xffffff);
    this.lines.forEach((sp, i) => {
      const w = Math.min(this.widths[i], Math.max(0, left));
      left -= this.widths[i];
      if (w > 0) {
        m.rect(sp.x - 6, sp.y - 8, w + 8, sp.height + 16).fill(0xffffff);
        head = [sp.x + w, sp.y + sp.height * 0.7];
      }
    });
    // the pencil rides the writing head, scribbling
    const p = this.pencil.clear();
    const writing = wp > 0 && wp < 1;
    const [hx, hy] = head;
    const wig = writing ? Math.sin(t * 40) * 4 : 0;
    const px = hx + 8;
    const py = hy - 6 + wig;
    p.poly([px, py, px + 16, py - 34, px + 128, py - 164, px + 112, py - 176, px, py]).fill(0xe8b84a).stroke({ width: 3, color: 0x3a2a14 });
    p.poly([px, py, px + 16, py - 34, px + 4, py - 30]).fill(0x3a2a14);
    p.rect(px + 110, py - 182, 20, 18).fill(0xd9786e);
    p.alpha = sm((t - 0.3) / 0.3) * (wp >= 1 ? 1 - sm((t - 0.5 - this.dur) / 0.6) : 1);
    this.glow.position.set(px, py);
    this.glow.alpha = p.alpha * (writing ? 0.35 : 0.15);
  }
}

// ------------------------------------------------------------------ Luzterna: always floating, the lantern, the beam
export interface LuzRig {
  actor: Actor | null;
  /** the lantern in the actor's local px (before its flip) */
  lantern: [number, number];
}
export function luzOf(ctx: SceneCtx, size: number): LuzRig {
  const actor = ctx.actor('luzterna', size);
  let lantern: [number, number] = [-size * 0.22, -size * 0.5];
  const p = actor?.puppet;
  const r = siluetaKeep('luzterna')?.[0];
  if (p && r) lantern = [(r[0] - p.anchor.x * p.W) * p.scale.x, (r[1] - p.anchor.y * p.H) * p.scale.y];
  return { actor, lantern };
}
/** her float: a slow bob (px) — she never touches anything */
export const bob = (lt: number, rm: boolean, a = 12) => (rm ? a * 0.4 : a) * Math.sin(lt * 1.7);
/** where the lantern is in the actor's parent space, given how the actor was posed */
export function lanternAt(rig: LuzRig): [number, number] {
  const a = rig.actor;
  if (!a) return [0, 0];
  const c = Math.cos(a.rotation);
  const s = Math.sin(a.rotation);
  const lx = rig.lantern[0] * a.scale.x;
  const ly = rig.lantern[1] * a.scale.y;
  return [a.x + lx * c - ly * s, a.y + lx * s + ly * c];
}
/** the blue beam (a soft additive cone): from → to, `spread` = half-width at the far end */
export class Beam extends Container {
  private cone: Sprite;
  private core: Sprite;
  private spot: Sprite;
  constructor(ctx: SceneCtx, color: number = TV.lantern) {
    super();
    this.cone = new Sprite(kitTex(ctx, 'cone'));
    this.cone.anchor.set(0, 0.5);
    this.core = new Sprite(kitTex(ctx, 'cone'));
    this.core.anchor.set(0, 0.5);
    this.spot = new Sprite(kitTex(ctx, 'glow'));
    this.spot.anchor.set(0.5);
    for (const s of [this.cone, this.core, this.spot]) {
      s.tint = color;
      s.blendMode = 'add';
    }
    this.addChild(this.cone, this.core, this.spot);
  }
  set(from: [number, number], to: [number, number], spread: number, alpha: number) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.max(1, Math.hypot(dx, dy));
    const rot = Math.atan2(dy, dx);
    this.visible = alpha > 0.003;
    if (!this.visible) return;
    for (const [s, w, a] of [
      [this.cone, spread, 0.55],
      [this.core, spread * 0.35, 0.6],
    ] as const) {
      s.position.set(from[0], from[1]);
      s.rotation = rot;
      s.scale.set(len / 512, (w * 2) / 256);
      s.alpha = alpha * a;
    }
    this.spot.position.set(to[0], to[1]);
    this.spot.scale.set((spread * 2.4) / 256, (spread * 1.2) / 256);
    this.spot.alpha = alpha * 0.7;
  }
}

// ------------------------------------------------------------------ Cerito (REGISTRO 000): a kitten of static
export const CERITO = STANDINS.cerito;
/** how much live static crawls over the static painting (it already is static: the eyes and the zero must read) */
export const CERITO_NOISE = 0.5;
export class StaticKitten extends Container {
  private base: Sprite | null;
  private noise: TilingSprite;
  private eyes: Sprite[] = [];
  private eyePts: [number, number][] = [];
  /** the base is his painting (cerito_static_cat, in the style's bake); false = the tinted outline (not loaded) */
  private painted = false;
  constructor(
    private ctx: SceneCtx,
    size: number,
    slug = CERITO,
  ) {
    super();
    const paint = ctx.still(slug);
    const base = (this.base = paint ?? ctx.silhouette(slug));
    const mask = ctx.silhouette(slug);
    this.painted = !!paint;
    this.noise = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 900, height: 900 });
    if (base && mask) {
      const s = size / base.texture.height;
      base.scale.set(s);
      mask.scale.set(s);
      base.tint = this.painted ? 0xd8dbe6 : 0x9a9ab4;
      this.noise.position.set(-450, -880);
      this.noise.tileScale.set(1.4);
      this.noise.mask = mask;
      this.addChild(base, this.noise, mask);
      // the eyes from the rig (eye rects in painting px)
      const p = ctx.studio.puppet(slug);
      const rig = p?.brain.model?.rig;
      if (p && rig?.eyes?.length) {
        const ps = size / p.H;
        for (const e of rig.eyes) this.eyePts.push([((e[0] + e[2]) / 2 - p.anchor.x * p.W) * ps, ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * ps]);
      } else
        this.eyePts.push(
          [-size * 0.16, -size * 0.66],
          [size * 0.08, -size * 0.62],
        );
      p?.destroy();
    }
    for (const _ of this.eyePts) {
      const e = new Sprite(kitTex(ctx, 'glow'));
      e.anchor.set(0.5);
      e.tint = 0x9fe8ff;
      e.blendMode = 'add';
      this.eyes.push(e);
      this.addChild(e);
    }
    this.eyePts.forEach((pt, i) => this.eyes[i].position.set(pt[0], pt[1]));
  }
  /** clear = 0 static … 1 a clear little cat (one second in El Grito: the live static stops, his painting stays) */
  update(lt: number, o: { stare?: number; clear?: number; tint?: number } = {}) {
    const st = Math.floor(lt * 12);
    this.noise.tilePosition.set(rnd(st) * 300, rnd(st + 3) * 300);
    const clear = o.clear ?? 0;
    this.noise.alpha = (1 - clear) * (this.painted ? CERITO_NOISE : 1);
    if (this.base) this.base.tint = o.tint ?? (this.painted ? (clear > 0 ? 0xffffff : 0xd8dbe6) : clear > 0 ? 0xe9eef8 : 0x9a9ab4);
    const stare = o.stare ?? 0.6;
    for (const e of this.eyes) {
      e.scale.set((0.18 + stare * 0.12) * (this.ctx.rf ? 0.8 : 1));
      e.alpha = 0.6 + stare * 0.4;
    }
  }
}

// ------------------------------------------------------------------ Canelo's tail flame
export type FlameSize = 'normal' | 'chica' | 'minima';
export const FLAME_K: Record<FlameSize, number> = { normal: 1, chica: 0.55, minima: 0.28 };
/** the tail tip of an actor in its parent space (from the rig), or null */
export function tailTip(a: Actor | null): [number, number] | null {
  const p = a?.puppet;
  const rig = p?.brain.model?.rig;
  const pts = rig?.tail?.pts;
  if (!p || !pts?.length) return null;
  const [tx, ty] = pts[pts.length - 1];
  const lx = (tx - p.anchor.x * p.W) * p.scale.x * a!.scale.x;
  const ly = (ty - p.anchor.y * p.H) * p.scale.y * a!.scale.y;
  const c = Math.cos(a!.rotation);
  const s = Math.sin(a!.rotation);
  return [a!.x + lx * c - ly * s, a!.y + lx * s + ly * c];
}
/** draw a cartoon candle flame at (x, y), size k (1 = normal), flickering on twos */
export function flame(g: Graphics, x: number, y: number, k: number, lt: number, o: { rm?: boolean; color?: number; core?: number; scale?: number } = {}) {
  if (k <= 0.01) return;
  const st = o.rm ? 0 : Math.floor(lt * 12);
  const s = (o.scale ?? 1) * 46 * k;
  const w = s * (0.55 + rnd(st) * 0.08);
  const h = s * (1.3 + rnd(st + 5) * 0.25);
  const lean = (rnd(st + 9) - 0.5) * s * 0.3;
  g.moveTo(x - w, y)
    .quadraticCurveTo(x - w * 0.9, y - h * 0.6, x + lean, y - h)
    .quadraticCurveTo(x + w * 0.9, y - h * 0.6, x + w, y)
    .quadraticCurveTo(x, y + w * 0.9, x - w, y)
    .fill(o.color ?? 0xff8a1e)
    .stroke({ width: 4, color: TV.line });
  g.moveTo(x - w * 0.5, y)
    .quadraticCurveTo(x - w * 0.4, y - h * 0.4, x + lean * 0.6, y - h * 0.62)
    .quadraticCurveTo(x + w * 0.45, y - h * 0.4, x + w * 0.5, y)
    .quadraticCurveTo(x, y + w * 0.5, x - w * 0.5, y)
    .fill(o.core ?? 0xffe27a);
}

// ------------------------------------------------------------------ Homiau (his painting)
export const HOMIAU = STANDINS.homiau;
/** the painting's height at scale 1 (world px): the old code-drawn stand-in stood ~500 px from his feet to his hairs */
export const HOMIAU_H = 560;
export type HomiauAct = { chew?: number; raise?: number; cry?: number; squash?: number; look?: number };
/**
 * HOMIAU — his approved painting (homiau_donut_cat: flat yellow, pink donut at his mouth, overbite with grey stubble,
 * two hairs, white shirt) as a puppet, with the SAME interface the code-drawn stand-in had: `new Homiau(ctx)` is a
 * Container whose origin is at his feet; `act()` chews (a bob on the bite), raises the donut (he leans back and lifts
 * his chin), looks (the rig turns the head), cries (tears from the rig's eyes) and squashes — and, like before, sets
 * this.scale to the squash. Needs HOMIAU in the set's `cats`; without it (not loaded) the old drawing stands in.
 * `face = -1` mirrors him (the painting looks to the left, toward his donut).
 */
export class Homiau extends Container {
  readonly actor: Actor | null;
  readonly tears = new Graphics();
  private drawn: HomiauDibujado | null = null;
  private eyePts: [number, number][] = [];
  face: 1 | -1 = 1;
  constructor(ctx: SceneCtx, o: { size?: number; face?: 1 | -1 } = {}) {
    super();
    this.face = o.face ?? 1;
    this.actor = ctx.actor(HOMIAU, o.size ?? HOMIAU_H);
    const p = this.actor?.puppet;
    if (this.actor && p) {
      this.addChild(this.actor);
      const rig = p.brain.model?.rig;
      for (const e of rig?.eyes ?? []) this.eyePts.push([((e[0] + e[2]) / 2 - p.anchor.x * p.W) * p.scale.x, ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * p.scale.y]);
    } else {
      this.drawn = new HomiauDibujado();
      this.addChild(this.drawn);
    }
    if (!this.eyePts.length) this.eyePts.push([-50, -380], [20, -390]);
    this.addChild(this.tears);
  }
  /** his head centre and radius in the PARENT's space (rag on his head, rays around it, balloons) */
  headAt(): [number, number, number] {
    const a = this.actor;
    let hx = 0;
    let hy = -300;
    let r = 110;
    if (a?.puppet) {
      const rig = a.puppet.brain.model?.rig;
      const p = a.puppet;
      if (rig?.head) {
        hx = (rig.head[0] - p.anchor.x * p.W) * p.scale.x;
        hy = (rig.head[1] - p.anchor.y * p.H) * p.scale.y;
        r = Math.max(rig.head[2], rig.head[3]) * p.scale.y;
      }
      // through the actor's own transform (the bob, the lean, the mirror)
      const c = Math.cos(a.rotation);
      const s = Math.sin(a.rotation);
      const lx = hx * a.scale.x;
      const ly = hy * a.scale.y;
      hx = a.x + lx * c - ly * s;
      hy = a.y + lx * s + ly * c;
    }
    const c = Math.cos(this.rotation);
    const s = Math.sin(this.rotation);
    const lx = hx * this.scale.x;
    const ly = hy * this.scale.y;
    return [this.x + lx * c - ly * s, this.y + lx * s + ly * c, r * Math.abs(this.scale.y)];
  }
  act(lt: number, o: HomiauAct = {}) {
    if (this.drawn) {
      this.drawn.act(lt, o);
      this.scale.copyFrom(this.drawn.scale);
      this.drawn.scale.set(1);
      return;
    }
    const a = this.actor!;
    const chew = o.chew ?? 0;
    const raise = o.raise ?? 0;
    const bite = chew > 0 ? Math.abs(Math.sin(lt * 9)) * chew : 0;
    // chewing: a bob on every bite; the donut up: he leans back and lifts his chin
    a.position.set(0, -bite * 7 - raise * 10);
    a.rotation = -raise * 0.07 * this.face;
    a.scale.set(this.face * (1 + bite * 0.012), 1 - bite * 0.02);
    if (a.puppet) a.puppet.look = Math.max(-1, Math.min(1, (o.look ?? 0) * 0.9)) * this.face;
    const sq = o.squash ?? 0;
    this.scale.set(1 + sq * 0.08, 1 - sq * 0.08);
    const t = this.tears.clear();
    const cry = o.cry ?? 0;
    if (cry > 0) {
      // from the rig's eyes, through the actor's own lean / bob / mirror, down the cheek (not past the chin)
      const c = Math.cos(a.rotation);
      const sn = Math.sin(a.rotation);
      for (const [ex, ey] of this.eyePts) {
        const lx = ex * a.scale.x;
        const ly = ey * a.scale.y;
        const x = a.x + lx * c - ly * sn;
        const y = a.y + lx * sn + ly * c + 14 + ((lt * 160) % 70);
        t.ellipse(x, y, 8, 12).fill({ color: 0x9fd8ff, alpha: cry }).stroke({ width: 3, color: TV.line, alpha: cry });
      }
    }
  }
}
/** the code-drawn stand-in (only when his painting isn't loaded) */
class HomiauDibujado extends Container {
  readonly body = new Graphics();
  readonly head = new Container();
  readonly jaw = new Graphics();
  readonly arm = new Container();
  readonly tears = new Graphics();
  readonly donutG = new Graphics();
  constructor(o: { yellow?: number; shirt?: number; mono?: boolean } = {}) {
    super();
    const Y = o.yellow ?? 0xf7d23e;
    const YD = 0xd9a91c;
    const L = TV.line;
    const b = this.body;
    // the shirt (white, collar) and the round body
    b.roundRect(-120, -250, 240, 250, 90).fill(o.shirt ?? 0xfafaf2).stroke({ width: 6, color: L });
    b.poly([-60, -250, 0, -200, 60, -250]).fill(0xe8e8de).stroke({ width: 5, color: L, join: 'round' });
    b.roundRect(-110, -30, 90, 40, 18).fill(Y).stroke({ width: 6, color: L });
    b.roundRect(20, -30, 90, 40, 18).fill(Y).stroke({ width: 6, color: L });
    // the head
    const h = new Graphics();
    h.poly([-104, -80, -120, -190, -50, -128]).fill(Y).stroke({ width: 6, color: L, join: 'round' });
    h.poly([104, -80, 120, -190, 50, -128]).fill(Y).stroke({ width: 6, color: L, join: 'round' });
    h.ellipse(0, -60, 118, 104).fill(Y).stroke({ width: 6, color: L });
    // stubble (grey, around the muzzle) and the muzzle
    h.ellipse(0, -10, 84, 56).fill(0xb9b4a6).stroke({ width: 5, color: L });
    for (let i = 0; i < 26; i++) h.circle(-60 + rnd(i) * 120, -30 + rnd(i + 9) * 52, 2.2).fill(0x8a8578);
    h.ellipse(0, -30, 18, 12).fill(0xc04a5a).stroke({ width: 4, color: L });
    // big eyes, two dots
    h.circle(-40, -82, 30).fill(0xffffff).stroke({ width: 5, color: L });
    h.circle(40, -82, 30).fill(0xffffff).stroke({ width: 5, color: L });
    h.circle(-34, -80, 6).fill(L).circle(34, -80, 6).fill(L);
    // the two hairs
    h.moveTo(-14, -162).quadraticCurveTo(-40, -230, -6, -244).stroke({ width: 6, color: L, cap: 'round' });
    h.moveTo(14, -162).quadraticCurveTo(-4, -226, 30, -236).stroke({ width: 6, color: L, cap: 'round' });
    // whiskers
    for (const s of [-1, 1]) for (const dy of [-6, 8]) h.moveTo(s * 70, -18 + dy).lineTo(s * 128, -26 + dy * 1.6).stroke({ width: 3, color: L });
    this.jaw.ellipse(0, 22, 46, 18).fill(0x7a2a34).stroke({ width: 5, color: L });
    this.head.addChild(h, this.jaw, this.tears);
    this.head.position.set(0, -250);
    // the arm with the donut
    const arm = new Graphics();
    arm.roundRect(-18, -10, 36, 120, 18).fill(Y).stroke({ width: 6, color: L });
    this.donutG.position.set(0, 128);
    const dg = this.donutG;
    dg.ellipse(0, 0, 58, 40).fill(0xf0b45e).stroke({ width: 6, color: L });
    dg.ellipse(0, -4, 50, 32).fill(TV.pink);
    dg.ellipse(0, -2, 18, 11).fill(0xc9771a).stroke({ width: 4, color: L });
    const cols = [0xfff6e0, 0x58d0ff, 0x2e9a5a, 0xf4a62a, 0xffffff];
    for (let i = 0; i < 12; i++) {
      const a = i * 0.52;
      const rr = 28 + (i % 3) * 7;
      dg.roundRect(Math.cos(a) * rr - 6, -4 + Math.sin(a) * rr * 0.6 - 2, 12, 4, 2).fill(cols[i % cols.length]);
    }
    this.arm.addChild(arm, this.donutG);
    this.arm.position.set(96, -200);
    this.addChild(this.body, this.arm, this.head);
    void YD;
  }
  /**
   * chew 0..1 (jaw), raise 0..1 (donut up to the mouth / in the air), cry 0..1 (tears), bounce (squash on the beat)
   */
  act(lt: number, o: { chew?: number; raise?: number; cry?: number; squash?: number; look?: number } = {}) {
    const chew = o.chew ?? 0;
    this.jaw.scale.y = 0.3 + (chew > 0 ? Math.abs(Math.sin(lt * 9)) * chew : 0);
    this.arm.rotation = -(o.raise ?? 0) * 2.3;
    this.head.rotation = (o.look ?? 0) * 0.18;
    const sq = o.squash ?? 0;
    this.scale.set(1 + sq * 0.08, 1 - sq * 0.08);
    const t = this.tears.clear();
    const cry = o.cry ?? 0;
    if (cry > 0) {
      for (const s of [-1, 1]) {
        const y = -60 + ((lt * 260) % 120);
        t.ellipse(s * 52, y, 9, 14).fill({ color: 0x9fd8ff, alpha: cry }).stroke({ width: 3, color: TV.line, alpha: cry });
      }
    }
  }
}

/** a soft round shadow under a character */
export function contact(g: Graphics, x: number, y: number, w: number, a = 0.3) {
  g.ellipse(x, y, w, w * 0.16).fill({ color: 0x000000, alpha: a });
}
export { seg as segT, sm as smT };

// ------------------------------------------------------------------ speech balloons (TV cartoon)
export interface BalloonOpts {
  size?: number;
  /** the tail's tip, relative to the balloon centre */
  tail?: [number, number];
  font?: string;
  fill?: number;
  ink?: number;
  /** max text width before wrapping */
  wrap?: number;
  /** a small «WHO» tag above */
  who?: string;
  /** shout: a spiky outline */
  shout?: boolean;
}
/** a speech balloon (built once): white, the Borracha's uniform line, a tail toward the speaker */
export function balloon(k: Kit, text: string, o: BalloonOpts = {}): Container {
  const c = new Container();
  const size = o.size ?? 46;
  const t = word(k, text, { fontFamily: o.font ?? 'Bangers', fontSize: size, fill: o.ink ?? TV.line, letterSpacing: 1.5, align: 'center', wordWrap: true, wordWrapWidth: o.wrap ?? 620, lineHeight: size * 1.1 });
  const w = t.width + size * 1.3;
  const h = t.height + size * 0.8;
  const g = new Graphics();
  const tail = o.tail ?? [-w * 0.25, h * 0.9];
  const bx = Math.max(-w / 2 + 30, Math.min(w / 2 - 70, tail[0] * 0.4));
  g.poly([bx, h / 2 - 8, bx + 46, h / 2 - 8, tail[0], tail[1]]).fill(o.fill ?? 0xffffff).stroke({ width: 6, color: TV.line, join: 'round' });
  if (o.shout) {
    const pts: number[] = [];
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = i % 2 ? 1 : 1.16;
      pts.push(Math.cos(a) * (w / 2) * r * 1.08, Math.sin(a) * (h / 2) * r * 1.12);
    }
    g.poly(pts).fill(o.fill ?? 0xffffff).stroke({ width: 6, color: TV.line, join: 'round' });
  } else g.roundRect(-w / 2, -h / 2, w, h, Math.min(h / 2, 46)).fill(o.fill ?? 0xffffff).stroke({ width: 6, color: TV.line });
  // re-cover the tail's root inside the balloon
  g.rect(bx + 3, h / 2 - 16, 40, 12).fill(o.fill ?? 0xffffff);
  c.addChild(g, t);
  if (o.who) {
    const tag = word(k, o.who, { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 22, fill: 0xfff6e0, letterSpacing: 3 });
    const tg = new Graphics().roundRect(-tag.width / 2 - 12, -16, tag.width + 24, 32, 10).fill(TV.line);
    const tc = new Container();
    tc.addChild(tg, tag);
    tc.position.set(-w / 2 + tag.width / 2 + 24, -h / 2 - 4);
    c.addChild(tc);
  }
  return c;
}
/** pop a balloon in / out over [a, b] (scale with a little overshoot; «Reducir movimiento»: a fade) */
export function popIn(c: Container, lt: number, a: number, b: number, rm = false, base = 1) {
  const on = lt >= a && lt < b;
  c.visible = on;
  if (!on) return;
  const p = (lt - a) / 0.18;
  const q = (b - lt) / 0.15;
  if (rm) {
    c.scale.set(base);
    c.alpha = Math.min(1, p, q);
    return;
  }
  const s = p < 1 ? 0.4 + 0.6 * (1 + Math.sin(Math.min(1, p) * Math.PI * 0.9) * 0.18) * Math.min(1, p) : q < 1 ? q : 1;
  c.scale.set(base * Math.max(0.01, s));
  c.alpha = 1;
}

// ------------------------------------------------------------------ rig points + puppet driving
/** a point of an actor's rig (painting px of the brain) in the actor's parent space, or null */
export function rigPt(a: Actor | null, x: number, y: number): [number, number] | null {
  const p = a?.puppet;
  if (!p || !a) return null;
  const lx = (x - p.anchor.x * p.W) * p.scale.x * a.scale.x;
  const ly = (y - p.anchor.y * p.H) * p.scale.y * a.scale.y;
  const c = Math.cos(a.rotation);
  const s = Math.sin(a.rotation);
  return [a.x + lx * c - ly * s, a.y + lx * s + ly * c];
}
/** the rig of an actor (head [cx, cy, rx, ry], neck, eyes, tail) in painting px, or null */
export const rigOf = (a: Actor | null) => a?.puppet?.brain.model?.rig ?? null;
/**
 * Puppets tick on the shared ticker even while their scene is hidden (F08 measured 25 ms frames with ~70 of them).
 * A Drive takes them off it and ticks them from the set's update — only the scene on screen pays (from F08's lib).
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
  tick(lt: number) {
    for (const e of this.list) {
      let dt = Number.isNaN(e.last) ? 1 / 60 : lt - e.last;
      if (dt <= 0 || dt > 0.1) dt = 1 / 60;
      e.last = lt;
      if (!e.p.destroyed) e.p.tick({ deltaMS: dt * 1000 });
    }
  }
}

// ------------------------------------------------------------------ warm everything (not only what shows at start / middle / end)
/**
 * The engine warms each scene at its start, middle and end; things that show only in between (an insert, a plate, a
 * word, a stamp) would tessellate / upload on their first frame on the clock. Call at the end of build: every subtree
 * is drawn once, all visible, then put back as it was.
 */
export function warmAll(ctx: SceneCtx, ...cs: Container[]) {
  for (const c of cs) {
    const was: [Container, boolean][] = [];
    const walk = (n: Container) => {
      for (const ch of n.children) {
        was.push([ch, ch.visible]);
        ch.visible = true;
        walk(ch);
      }
    };
    walk(c);
    ctx.baker.warm(c);
    for (const [n, v] of was) n.visible = v;
  }
}
