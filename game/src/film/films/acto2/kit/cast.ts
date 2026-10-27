/**
 * ACTO II — the CAST: Luzterna and her beam, Canelo's tail flame, Cerito (a kitten of static), the act's new cats with
 * their approved paintings (Doctor Ovillo, El Estambre, Gato Araña, Super Siamés, Príncipe Bigotón, Itō — FILM-CAST,
 * 2026-10-27) and the STAND-INS of the ones still without art (Cruceta, Esquirla, La Mano), each with the code-drawn
 * traits that make them read at once (Cruceta's ink mask and paper cape, Esquirla's glitch shard, La Mano's white hand
 * and nib). Itō's thread sword is code-drawn on purpose (it is not in his painting).
 *
 * Rules: textures and big Graphics in build; per frame only transforms and tiny redraws (a flame, a beam).
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FrameInfo, SceneCtx } from '../../../stage';
import type { Baker } from '../../../bake';
import { BAKE_UV } from '../../../bake';
import type { Actor } from '../../../../momentos/anime/actor';
import { siluetaKeep } from '../../../../momentos/songs/drunck/silueta';
import { catRig } from '../../../../art/puppetCore';
import { INK, LANTERN } from './ink';
import { rnd } from './t';
import { STANDINS } from '../../../standins';

/**
 * The act's cast: the approved paintings (film/standins.ts for the ones who come back) and the STAND-INS (existing MAI
 * paintings) of the characters still without art, whose reference is carried by the code-drawn traits on top.
 */
export const SLUG = {
  canelo: 'canelo_cozy_cat',
  luz: 'luzterna',
  /** Cerito / REGISTRO 000: the shared stand-in of every act (film/standins.ts; never nadie_static_cat) */
  cerito: STANDINS.cerito,
  /** Cruceta (Titiritero of the comic city): STAND-IN, the ink-and-paper cat + ink domino mask + script-paper cape */
  cruceta: STANDINS.cruceta,
  /**
   * La Pandilla del Ovillo: DOCTOR OVILLO (his painting: the yarn-ball arms) leads; two street cats (stand-ins, the
   * same as the PANDILLERO portrait) with yarn balls on their belts
   */
  pandilla: ['ovillo_yarnarms_cat', 'sombrita_shadow_cat', 'medianoche_king_cat'] as const,
  /** El Estambre, the wool villain (his painting: striped shirt, yarn fists, the whirl of yarn instead of legs) */
  estambre: 'estambre_yarnstorm_cat',
  /** Gato Araña (his painting: the home-made web mask and the blue sweater) — on Cruceta's cover */
  aranya: STANDINS.aranya,
  /** the civilian kitten Cruceta rescues */
  gatito: 'ronron_purr_cat',
  /** heroes of other versions on the rooftops (silhouettes) */
  heroes: ['zarpa_pirate_cat', 'valquiria_lightning_cat', 'kage_ninja_cat', 'masquerade_phantom_cat'] as const,
  /** a Disruptor on the newspaper photo (the graffiti crew) */
  disruptor: 'grafitera_spray_cat',
  /** Super Siamés (his painting: golden spiky aura, the red sash) */
  siames: 'supersiames_aura_cat',
  /** the rival who doesn't know you: Príncipe Bigotón (his painting: spiky black hair, the armour) + tears of emotion */
  rival: 'bigoton_rival_cat',
  /** the ninja cat of the second yonkoma */
  ninja: 'kage_ninja_cat',
  /** Itō (his painting: long ink-white cat, paper kimono, red sash) + threads on his back like a sword's sheath */
  ito: STANDINS.ito,
  /** Esquirla: STAND-IN, the glitch cat + a shard of broken screen for a blade (the only cyan) */
  esquirla: STANDINS.esquirla,
  /** La Mano: STAND-IN, the pale quill cat (as CINE) + a white hand with a nib for a claw */
  mano: STANDINS.mano,
} as const;

// ------------------------------------------------------------------ shared textures (one bake per film)
const CACHE = new WeakMap<Baker, Map<string, Texture>>();
const SRC: Record<string, [number, number, string]> = {
  glow: [256, 256, `void main() { vec2 uv = bakeUV() - 0.5; float d = length(uv) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2); finalColor = vec4(vec3(a), a); }`],
  cone: [512, 256, `void main() { vec2 uv = bakeUV(); float x = uv.x; float y = abs(uv.y - 0.5) * 2.0; float w = mix(0.04, 1.0, x); float a = smoothstep(w, w * 0.55, y) * smoothstep(1.0, 0.55, x) * smoothstep(0.0, 0.06, x); finalColor = vec4(vec3(a), a); }`],
  static: [512, 512, `void main() { vec2 uv = bakeUV(); vec2 c = floor(uv * 256.0); float l = step(0.48, hash12(c)) * (0.55 + 0.45 * hash12(c + 7.0)); finalColor = vec4(vec3(l), 1.0); }`],
  // a soft vertical shaft from the top (alpha): spotlights, the cat-signal beam
  shaft: [256, 512, `void main() { vec2 uv = bakeUV(); float w = mix(0.1, 0.5, uv.y); float x = abs(uv.x - 0.5); float a = smoothstep(w, w * 0.2, x) * smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.7, uv.y); finalColor = vec4(vec3(a), a); }`],
};
export function castTex(ctx: SceneCtx, name: keyof typeof SRC): Texture {
  let m = CACHE.get(ctx.baker);
  if (!m) CACHE.set(ctx.baker, (m = new Map()));
  let t = m.get(name);
  if (!t) {
    const s = SRC[name];
    t = ctx.baker.shade(`a2-${name}`, s[0], s[1], `${BAKE_UV}\n${s[2]}`, {}, {}, { res: 1 });
    m.set(name, t);
  }
  return t;
}
/** an additive glow sprite (anchor centre) */
export function glow(ctx: SceneCtx, color: number, size: number, alpha = 1): Sprite {
  const s = new Sprite(castTex(ctx, 'glow'));
  s.anchor.set(0.5);
  s.tint = color;
  s.blendMode = 'add';
  s.setSize(size, size);
  s.alpha = alpha;
  return s;
}

// ------------------------------------------------------------------ Luzterna (always floating, the lantern)
export interface LuzRig {
  actor: Actor | null;
  /** the lantern in the actor's local px (before its flip) */
  lantern: [number, number];
}
export function luzOf(ctx: SceneCtx, size: number, bake?: string): LuzRig {
  const actor = bake ? ctx.actorAs(bake, SLUG.luz, size) : ctx.actor(SLUG.luz, size);
  let lantern: [number, number] = [-size * 0.22, -size * 0.5];
  const p = actor?.puppet;
  const r = siluetaKeep('luzterna')?.[0];
  if (p && r) lantern = [(r[0] - p.anchor.x * p.W) * p.scale.x, (r[1] - p.anchor.y * p.H) * p.scale.y];
  return { actor, lantern };
}
/** her float: a slow bob (px) — she never touches anything */
export const bob = (lt: number, rm: boolean, a = 12) => (rm ? a * 0.4 : a) * Math.sin(lt * 1.7);
/** where the lantern is in the actor's parent space */
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
  constructor(ctx: SceneCtx, color: number = LANTERN) {
    super();
    this.cone = new Sprite(castTex(ctx, 'cone'));
    this.cone.anchor.set(0, 0.5);
    this.core = new Sprite(castTex(ctx, 'cone'));
    this.core.anchor.set(0, 0.5);
    this.spot = new Sprite(castTex(ctx, 'glow'));
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

// ------------------------------------------------------------------ Canelo's tail flame (the act's visible signal)
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
/** a point of a rig (head centre / eyes) in the actor's parent space */
export function rigPoint(a: Actor | null, which: 'head' | 'eyeL' | 'eyeR' | 'nose'): [number, number] | null {
  const p = a?.puppet;
  const rig = p?.brain.model?.rig;
  if (!p || !rig) return null;
  let px: number;
  let py: number;
  if (which === 'head') [px, py] = [rig.head[0], rig.head[1]];
  else if (which === 'nose') [px, py] = [rig.head[0], rig.head[1] + rig.head[3] * 0.25];
  else {
    const e = rig.eyes?.[which === 'eyeL' ? 0 : 1] ?? rig.eyes?.[0];
    if (!e) return null;
    [px, py] = [(e[0] + e[2]) / 2, (e[1] + e[3]) / 2];
  }
  const lx = (px - p.anchor.x * p.W) * p.scale.x * a!.scale.x;
  const ly = (py - p.anchor.y * p.H) * p.scale.y * a!.scale.y;
  const c = Math.cos(a!.rotation);
  const s = Math.sin(a!.rotation);
  return [a!.x + lx * c - ly * s, a!.y + lx * s + ly * c];
}
/** the head size (rig box, px on screen) */
export function headSize(a: Actor | null): number {
  const p = a?.puppet;
  const rig = p?.brain.model?.rig;
  if (!p || !rig) return 80;
  return Math.max(rig.head[2], rig.head[3]) * p.scale.x * Math.abs(a!.scale.x);
}
/** a cartoon candle flame at (x, y), size k (1 = normal), flickering on twos */
export function flame(g: Graphics, x: number, y: number, k: number, lt: number, o: { rm?: boolean; color?: number; core?: number; scale?: number; ink?: number } = {}) {
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
    .stroke({ width: 4, color: o.ink ?? INK });
  g.moveTo(x - w * 0.5, y)
    .quadraticCurveTo(x - w * 0.4, y - h * 0.4, x + lean * 0.6, y - h * 0.62)
    .quadraticCurveTo(x + w * 0.45, y - h * 0.4, x + w * 0.5, y)
    .quadraticCurveTo(x, y + w * 0.5, x - w * 0.5, y)
    .fill(o.core ?? 0xffe27a);
}
/** the act's flame sizes (Canelo's flame went down with every broken wall in OH SHIT) */
export const FLAME = { normal: 1, chica: 0.55, baja: 0.36, minima: 0.24 } as const;

// ------------------------------------------------------------------ Cerito (REGISTRO 000): a kitten of static
export class StaticKitten extends Container {
  private base: Sprite | null;
  private noise: TilingSprite;
  private eyes: Sprite[] = [];
  private eyePts: [number, number][] = [];
  /** the code-drawn ring on his forehead (only when his painting isn't loaded: the painting has its own zero) */
  private ring = new Graphics();
  readonly size: number;
  /** the base is his painting (cerito_static_cat, in the style's bake); false = the tinted outline (not loaded) */
  private painted = false;
  constructor(
    private ctx: SceneCtx,
    size: number,
    slug: string = SLUG.cerito,
  ) {
    super();
    this.size = size;
    const paint = ctx.still(slug);
    const base = (this.base = paint ?? ctx.silhouette(slug));
    const mask = ctx.silhouette(slug);
    this.painted = !!paint;
    this.noise = new TilingSprite({ texture: castTex(ctx, 'static'), width: 900, height: 900 });
    if (base && mask) {
      const s = size / base.texture.height;
      base.scale.set(s);
      mask.scale.set(s);
      base.tint = this.painted ? 0xd8dbe6 : 0x9a9ab4;
      this.noise.position.set(-450, -880);
      this.noise.tileScale.set(1.4);
      this.noise.mask = mask;
      this.addChild(base, this.noise, mask);
      const p = ctx.studio.puppet(slug);
      const rig = p?.brain.model?.rig;
      if (p && rig?.eyes?.length) {
        const ps = size / p.H;
        for (const e of rig.eyes) this.eyePts.push([((e[0] + e[2]) / 2 - p.anchor.x * p.W) * ps, ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * ps]);
      }
      p?.destroy();
    }
    if (!this.eyePts.length) this.eyePts.push([-size * 0.16, -size * 0.66], [size * 0.08, -size * 0.62]);
    // the white ring on his forehead (seen once the static calms)
    const ex = (this.eyePts[0][0] + (this.eyePts[1]?.[0] ?? this.eyePts[0][0])) / 2;
    const ey = Math.min(...this.eyePts.map((e) => e[1])) - size * 0.13;
    if (!this.painted) this.ring.circle(ex, ey, size * 0.055).stroke({ width: size * 0.022, color: 0xffffff });
    this.addChild(this.ring);
    for (const _ of this.eyePts) {
      const e = new Sprite(castTex(ctx, 'glow'));
      e.anchor.set(0.5);
      e.tint = 0x9fe8ff;
      e.blendMode = 'add';
      this.eyes.push(e);
      this.addChild(e);
    }
    this.eyePts.forEach((pt, i) => this.eyes[i].position.set(pt[0], pt[1]));
  }
  /**
   * clear = 0 static … 1 a clear little cat (pearl grey, the ring shows) · erase = 0 drawn … 1 almost gone (the
   * contour loses its ink when Canelo stops looking) · bristle = the static stands on end (a scare)
   */
  update(lt: number, o: { stare?: number; clear?: number; tint?: number; erase?: number; bristle?: number } = {}) {
    const st = Math.floor(lt * 12);
    this.noise.tilePosition.set(rnd(st) * 300, rnd(st + 3) * 300);
    const clear = o.clear ?? 0;
    const erase = o.erase ?? 0;
    this.noise.alpha = (1 - clear) * (1 - erase * 0.5) * (this.painted ? 0.5 : 1);
    if (this.base) {
      this.base.tint = o.tint ?? (this.painted ? (clear > 0 ? 0xffffff : 0xd8dbe6) : clear > 0 ? 0xdfe2ea : 0x9a9ab4);
      this.base.alpha = 1 - erase * 0.9;
    }
    this.ring.alpha = clear * (1 - erase);
    const b = o.bristle ?? 0;
    this.scale.set(1 + b * 0.12 * (rnd(st) - 0.3), 1 + b * 0.18);
    const stare = o.stare ?? 0.6;
    for (const e of this.eyes) {
      e.scale.set((0.18 + stare * 0.12) * (this.ctx.rf ? 0.8 : 1));
      e.alpha = (0.6 + stare * 0.4) * (1 - erase * 0.7);
    }
  }
}

// ------------------------------------------------------------------ stand-in traits (code-drawn, built once)
/** Cruceta's ink domino mask (centred on the eyes; w = head width) */
export function inkMask(g: Graphics, cx: number, cy: number, w: number, color = INK) {
  const h = w * 0.3;
  g.moveTo(cx - w * 0.62, cy - h * 0.2)
    .quadraticCurveTo(cx - w * 0.3, cy - h * 1.1, cx, cy - h * 0.25)
    .quadraticCurveTo(cx + w * 0.3, cy - h * 1.1, cx + w * 0.62, cy - h * 0.2)
    .quadraticCurveTo(cx + w * 0.4, cy + h * 0.95, cx, cy + h * 0.25)
    .quadraticCurveTo(cx - w * 0.4, cy + h * 0.95, cx - w * 0.62, cy - h * 0.2)
    .fill(color);
  // eye holes
  g.ellipse(cx - w * 0.24, cy, w * 0.11, h * 0.36).fill(0xfff8e8);
  g.ellipse(cx + w * 0.24, cy, w * 0.11, h * 0.36).fill(0xfff8e8);
  // the ink drip off the mask
  g.moveTo(cx + w * 0.5, cy).quadraticCurveTo(cx + w * 0.56, cy + h * 1.4, cx + w * 0.5, cy + h * 1.9).stroke({ width: w * 0.04, color, cap: 'round' });
}
/** a cape of folded script paper (behind a figure; anchor at the shoulders) — the typed lines show */
export function paperCape(g: Graphics, x: number, y: number, w: number, h: number, wave = 0, o: { paper?: number; ink?: number; dir?: number } = {}) {
  const dir = o.dir ?? 1;
  const n = 6;
  for (let i = n - 1; i >= 0; i--) {
    const x0 = x - w / 2 + (i / n) * w;
    const x1 = x0 + w / n + 6;
    const dy = Math.sin(wave + i * 0.9) * 18;
    const sx = (x0 + x1) / 2 - x;
    const pts = [x0, y + (i % 2) * 6, x1, y + ((i + 1) % 2) * 6, x1 + sx * 0.6 * dir + 30 * dir, y + h + dy + (i % 2) * 24, x0 + sx * 0.6 * dir + 30 * dir, y + h + dy + ((i + 1) % 2) * 24];
    g.poly(pts).fill(i % 2 ? (o.paper ?? 0xf3ead2) : 0xe2d6b8).stroke({ width: 4, color: o.ink ?? INK, join: 'round' });
    for (let j = 1; j < 6; j++) {
      const t = j / 6;
      const lx0 = pts[0] + (pts[6] - pts[0]) * t + 10;
      const ly0 = pts[1] + (pts[7] - pts[1]) * t;
      const lx1 = pts[2] + (pts[4] - pts[2]) * t - 10;
      const ly1 = pts[3] + (pts[5] - pts[3]) * t;
      g.moveTo(lx0, ly0).lineTo(lx0 + (lx1 - lx0) * (0.5 + rnd(i * 9 + j) * 0.4), ly0 + (ly1 - ly0) * 0.7).stroke({ width: 2.5, color: 0x6a5a48, alpha: 0.7 });
    }
  }
}
/** a yarn ball (a gang member's belt weight, El Estambre's fist) */
export function yarnBall(g: Graphics, x: number, y: number, r: number, color = 0xd9483a, ink = INK) {
  g.circle(x, y, r).fill(color).stroke({ width: Math.max(3, r * 0.12), color: ink });
  for (let i = 0; i < 4; i++) {
    const a = i * 0.8 + 0.3;
    g.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9)
      .quadraticCurveTo(x + Math.cos(a + 1.6) * r * 0.2, y + Math.sin(a + 1.6) * r * 0.2, x + Math.cos(a + 3.1) * r * 0.9, y + Math.sin(a + 3.1) * r * 0.9)
      .stroke({ width: Math.max(2, r * 0.08), color: ink, alpha: 0.6 });
  }
  g.moveTo(x + r * 0.7, y + r * 0.6).quadraticCurveTo(x + r * 1.4, y + r * 1.3, x + r * 0.9, y + r * 2).stroke({ width: Math.max(2, r * 0.1), color, cap: 'round' });
}
/** a headband (hachimaki) across a head: centre, width, tilt; the knot's tails flap */
export function headband(g: Graphics, cx: number, cy: number, w: number, rot: number, flap: number, color = 0xe5322d) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (x: number, y: number): [number, number] => [cx + x * c - y * s, cy + x * s + y * c];
  const h = w * 0.13;
  const q = [P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2)];
  g.poly(q.flat()).fill(color).stroke({ width: 4, color: INK });
  const k = P(w / 2, 0);
  for (const [dy, len] of [
    [-1, 1],
    [1, 0.8],
  ] as const) {
    const e = P(w / 2 + w * 0.42 * len, dy * h + Math.sin(flap + dy) * h * 1.6);
    g.poly([k[0], k[1] - h * 0.4, e[0], e[1], e[0] + 6, e[1] + h * 0.7, k[0], k[1] + h * 0.4]).fill(color).stroke({ width: 4, color: INK, join: 'round' });
  }
}
/** Esquirla's blade: a shard of broken screen (cyan, with scanlines and a crack) pointing along `ang` */
export function glitchShard(g: Graphics, x: number, y: number, len: number, ang: number, color = 0x4fe3e8) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const P = (u: number, v: number): [number, number] => [x + u * c - v * s, y + u * s + v * c];
  const pts = [P(0, -len * 0.08), P(len * 0.62, -len * 0.16), P(len, 0), P(len * 0.48, len * 0.12), P(0, len * 0.07)];
  g.poly(pts.flat()).fill(color).stroke({ width: 4, color: INK, join: 'miter' });
  for (let i = 1; i < 5; i++) {
    const a = P(len * 0.08 * i + 8, -len * 0.07);
    const b = P(len * 0.12 * i + 30, len * 0.06);
    g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 2, color: 0x0b2a3a, alpha: 0.55 });
  }
  const k0 = P(len * 0.3, -len * 0.04);
  const k1 = P(len * 0.55, len * 0.05);
  const k2 = P(len * 0.72, -len * 0.06);
  g.moveTo(k0[0], k0[1]).lineTo(k1[0], k1[1]).lineTo(k2[0], k2[1]).stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
}
/** La Mano's hand: a long slender white paw whose pointing claw is a pen nib (along `ang`, length L) */
export function nibHand(g: Graphics, x: number, y: number, L: number, ang: number, o: { skin?: number; nib?: number; ink?: number; inkDrop?: boolean; shade?: number } = {}) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const P = (u: number, v: number): [number, number] => [x + u * c - v * s, y + u * s + v * c];
  const skin = o.skin ?? 0xf0eadc;
  const shade = o.shade ?? 0xb8ae9c;
  const ink = o.ink ?? 0x1a1420;
  const w = L * 0.13;
  // the forearm: a tapered, rounded stroke (outline first), a shadow along its underside
  const a0 = P(-L * 0.45, 0);
  const a1 = P(L * 0.45, 0);
  g.moveTo(a0[0], a0[1]).lineTo(a1[0], a1[1]).stroke({ width: w + 7, color: ink, cap: 'round' });
  g.moveTo(a0[0], a0[1]).lineTo(a1[0], a1[1]).stroke({ width: w, color: skin, cap: 'round' });
  const b0 = P(-L * 0.42, w * 0.28);
  const b1 = P(L * 0.42, w * 0.22);
  g.moveTo(b0[0], b0[1]).lineTo(b1[0], b1[1]).stroke({ width: w * 0.35, color: shade, cap: 'round', alpha: 0.7 });
  // the paw: a soft oval, three curled toes underneath, a little fur at the wrist
  const pc = P(L * 0.55, w * 0.1);
  g.ellipse(pc[0], pc[1], L * 0.11, L * 0.085).fill(skin).stroke({ width: 3.5, color: ink });
  for (let i = 0; i < 3; i++) {
    const t = P(L * (0.52 + i * 0.045), L * 0.07);
    g.circle(t[0], t[1], L * 0.032).fill(skin).stroke({ width: 3, color: ink });
  }
  for (let i = 0; i < 4; i++) {
    const f0 = P(L * 0.42, -w * 0.5 + i * w * 0.33);
    const f1 = P(L * 0.38, -w * 0.62 + i * w * 0.33);
    g.moveTo(f0[0], f0[1]).lineTo(f1[0], f1[1]).stroke({ width: 2, color: ink, alpha: 0.6 });
  }
  // the pointing toe and its claw: a steel pen nib with its slit and breather hole
  const t0 = P(L * 0.62, -L * 0.01);
  const t1 = P(L * 0.72, -L * 0.01);
  g.moveTo(t0[0], t0[1]).lineTo(t1[0], t1[1]).stroke({ width: L * 0.05, color: skin, cap: 'round' });
  const nb0 = P(L * 0.72, -L * 0.035);
  const nb1 = P(L * 0.72, L * 0.015);
  const tip = P(L * 0.98, -L * 0.01);
  g.poly([nb0[0], nb0[1], tip[0], tip[1], nb1[0], nb1[1]]).fill(o.nib ?? 0x9aa4b4).stroke({ width: 3, color: ink, join: 'miter' });
  const mid = P(L * 0.8, -L * 0.01);
  g.moveTo(mid[0], mid[1]).lineTo(tip[0], tip[1]).stroke({ width: 2, color: ink });
  const hole = P(L * 0.77, -L * 0.01);
  g.circle(hole[0], hole[1], L * 0.01).fill(ink);
  if (o.inkDrop) {
    const d = P(L * 1.0, L * 0.02);
    g.circle(d[0], d[1] + 6, L * 0.018).fill(ink);
  }
}
/** Itō's threads: a bundle of taut lines from the back of the shoulders, like a sword in its sheath */
export function threadBundle(g: Graphics, x: number, y: number, len: number, ang: number, color = 0xf4f1ff, n = 7) {
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * 3.2;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const x0 = x - s * o;
    const y0 = y + c * o;
    g.moveTo(x0, y0).lineTo(x0 + c * len, y0 + s * len).stroke({ width: 1.8, color, alpha: 0.85 });
  }
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  g.roundRect(x + c * len * 0.08 - 10, y + s * len * 0.08 - 10, 20, 20, 5).fill(0x3a2a6a).stroke({ width: 3, color: INK });
}
/** a waist sash (Super Siamés): a red band with hanging ends */
export function sash(g: Graphics, cx: number, cy: number, w: number, color = 0xe5322d) {
  g.roundRect(cx - w / 2, cy - w * 0.07, w, w * 0.14, 6).fill(color).stroke({ width: 4, color: INK });
  g.poly([cx + w * 0.3, cy, cx + w * 0.42, cy + w * 0.45, cx + w * 0.3, cy + w * 0.42, cx + w * 0.2, cy + w * 0.05]).fill(color).stroke({ width: 4, color: INK, join: 'round' });
}

/** a frame-info helper: is this frame past t (scene-local)? (for one-shot emotes on the puppet's own clock) */
export function crossed(f: FrameInfo, prev: { lt: number }, t: number): boolean {
  const hit = prev.lt < t && f.lt >= t;
  prev.lt = f.lt;
  return hit;
}

/**
 * points of a STILL of `slug` sized `size` (anchor 0.5, 0.97), relative to the sprite's position: head centre, head
 * radius, tail tip — from the rig alone (any treatment: the rig is in the painting's logical px)
 */
export function stillRig(slug: string, size: number): { head: [number, number]; headR: number; tail: [number, number] | null; w: number; eyes: [number, number] | null } | null {
  const rig = catRig(slug === 'luzterna' ? 'luzterna' : slug);
  if (!rig) return null;
  const [RW, RH] = rig.size ?? [700, 700];
  const s = size / RH;
  const L = (x: number, y: number): [number, number] => [(x - 0.5 * RW) * s, (y - 0.97 * RH) * s];
  const tp = rig.tail?.pts?.length ? rig.tail.pts[rig.tail.pts.length - 1] : null;
  const e = rig.eyes ?? [];
  const eyes = e.length ? L(e.reduce((a, q) => a + (q[0] + q[2]) / 2, 0) / e.length, e.reduce((a, q) => a + (q[1] + q[3]) / 2, 0) / e.length) : null;
  return { head: L(rig.head[0], rig.head[1]), headR: rig.head[2] * s, tail: tp ? L(tp[0], tp[1]) : null, w: RW * s, eyes };
}
