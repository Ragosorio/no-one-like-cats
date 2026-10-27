/**
 * NOIR — the kit: a realistic rainy night. Mono stock with the neon (and Canelo's cinnamon) kept in colour, light
 * that has a SHAPE (a lamp cone, rays, a halo), wet asphalt that mirrors everything stretched and trembling, drops on
 * the lens.
 *
 *  - prepNoir: the light textures (cone, halo, a soft dot) and the sky clouds ('noir:light', 'noir:planes').
 *  - building(): a facade into a Graphics (windows lit or dark, a fire escape, a cornice) — sets rasterize them.
 *  - neon(): a sign as text + its glow (baked blurred copy, additive) — flicker it with `flickerAt`.
 *  - makeWet(): the reflection filter (ripples + the vertical smear of wet asphalt) for a FULL-SCREEN host only.
 *  - LensDrops: drops that sit on the lens, swell and slide (closed-form, seeded) — bokeh of the lights behind.
 *
 * References: film noir lighting (Hollywood 1940s), «Nighthawks» (Hopper, 1942: not public domain — a reference of
 * light only), Brassaï's «Paris de nuit» (photography), Sin City (2005) for the kept colour.
 */
import { Container, Graphics, Sprite, type Filter, type RenderTexture, type Texture, type TextStyleOptions } from 'pixi.js';
import type { Baker } from '../bake';
import { BAKE_UV } from '../bake';
import { glFilter, NOISE, uni } from '../gl';
import type { TextCache } from '../../momentos/anime/kit';
import type { StylePrep } from './index';

export const NR = {
  night: 0x07090d,
  slate: 0x161b24,
  wall: 0x232a35,
  wallL: 0x323b48,
  sodium: 0xffc27a,
  neon: 0xff3d8b,
  neonB: 0x58d0ff,
  window: 0xffd28a,
  blue: 0x6fa8ff,
};

export function prepNoir(p: StylePrep) {
  p.baker.add('noir:light', 'luz de farol', () => {
    p.tex.set('nr:cone', cone(p.baker));
    p.tex.set('nr:halo', softDot(p.baker, 256, 2.2));
    p.tex.set('nr:dot', softDot(p.baker, 64, 6));
  });
  p.baker.add('noir:planes', 'nubes de lluvia', () => {
    p.tex.set('nr:clouds', clouds(p.baker, 1024, 512));
  });
}

/** a lamp's light cone (apex at the top centre), with the rain caught in it */
export function cone(b: Baker): RenderTexture {
  return b.shade(
    'nr-cone',
    512,
    768,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  float hw = mix(0.03, 0.5, uv.y);
  float x = abs(uv.x - 0.5);
  float inside = 1.0 - smoothstep(hw * 0.7, hw, x);
  float fall = pow(1.0 - uv.y, 1.3) * smoothstep(0.0, 0.05, uv.y);
  float streaks = 0.75 + 0.25 * vnoise(vec2(uv.x * 40.0, uv.y * 3.0));
  float a = inside * fall * streaks * 0.85;
  finalColor = vec4(vec3(1.0, 0.85, 0.62) * a, a);
}`,
    {},
    {},
    { res: 1 },
  );
}
/** a soft round glow (white; tint it), falloff exponent k */
export function softDot(b: Baker, size: number, k: number): RenderTexture {
  return b.shade(
    `nr-dot-${size}-${k}`,
    size,
    size,
    `${BAKE_UV}
void main() {
  float d = length(bakeUV() - 0.5) * 2.0;
  float a = exp(-d * d * uK) * (1.0 - smoothstep(0.9, 1.0, d));
  finalColor = vec4(vec3(a), a);
}`,
    { uK: { value: k, type: 'f32' } },
    {},
    { res: 1 },
  );
}
/** low rain clouds (grey on near-black), tileable horizontally */
export function clouds(b: Baker, w: number, h: number): RenderTexture {
  return b.shade(
    'nr-clouds',
    w,
    h,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  float n = pfbm(vec2(uv.x * 4.0, uv.y * 2.0), 4.0);
  float m = smoothstep(0.35, 0.8, n) * (0.4 + 0.6 * uv.y);
  vec3 c = mix(vec3(0.03, 0.035, 0.05), vec3(0.2, 0.21, 0.24), m);
  c += vec3(0.05, 0.04, 0.03) * smoothstep(0.6, 1.0, uv.y);
  finalColor = vec4(c, 1.0);
}`,
    {},
    {},
    { res: 1 },
  );
}

/** a facade: body + windows (lit ones warm, a few with blinds) + a cornice + an optional fire escape */
export function building(g: Graphics, x: number, y: number, w: number, h: number, o: { seed?: number; color?: number; lit?: number; cols?: number; rows?: number; escape?: boolean; blinds?: boolean } = {}) {
  let s = ((o.seed ?? 1) * 2654435761) >>> 0 || 1;
  const r = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  const col = o.color ?? NR.wall;
  g.rect(x, y, w, h).fill(col);
  g.rect(x - 6, y - 14, w + 12, 16).fill(NR.wallL);
  const cols = o.cols ?? Math.max(2, Math.floor(w / 70));
  const rows = o.rows ?? Math.max(2, Math.floor(h / 95));
  const cw = w / cols;
  const rh = h / rows;
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const wx = x + i * cw + cw * 0.22;
      const wy = y + j * rh + rh * 0.2;
      const ww = cw * 0.56;
      const wh = rh * 0.52;
      const lit = r() < (o.lit ?? 0.18);
      g.rect(wx - 3, wy - 3, ww + 6, wh + 6).fill(0x0c0f15);
      if (lit) {
        g.rect(wx, wy, ww, wh).fill(r() < 0.3 ? 0xffe2b0 : NR.window);
        if (o.blinds && r() < 0.6) for (let k = 0; k < wh; k += 7) g.rect(wx, wy + k, ww, 3).fill({ color: 0x3a2a18, alpha: 0.55 });
      } else g.rect(wx, wy, ww, wh).fill(r() < 0.5 ? 0x10141c : 0x161c26);
    }
  if (o.escape) {
    const ex = x + w * 0.18;
    const ew = w * 0.5;
    for (let j = 1; j < rows; j++) {
      const ey = y + j * rh - 6;
      g.rect(ex, ey, ew, 5).fill(0x0a0c10);
      for (let k = 0; k <= 8; k++) g.rect(ex + (ew * k) / 8, ey - 34, 2, 34).fill(0x0a0c10);
      g.rect(ex, ey - 34, ew, 3).fill(0x0a0c10);
      g.moveTo(ex + ew * 0.1, ey).lineTo(ex + ew * 0.7, ey + rh - 6).stroke({ width: 4, color: 0x0a0c10 });
    }
  }
}

/** a neon sign: crisp tube text + a baked blurred copy (glow), both additive */
export function neon(b: Baker, text: TextCache, s: string, o: { size?: number; color?: number; vertical?: boolean } = {}): { root: Container; tube: Sprite; glow: Sprite } {
  const size = o.size ?? 90;
  const style: TextStyleOptions = { fontFamily: 'Bebas Neue', fontSize: size, fill: 0xffffff, letterSpacing: size * 0.1, stroke: { color: o.color ?? NR.neon, width: size * 0.08 } };
  const txt = o.vertical ? s.split('').join('\n') : s;
  const tex = text.get(txt, { ...style, align: 'center', lineHeight: size * 0.95 });
  const glowT = b.blurred(tex, 22, 0.5);
  const root = new Container();
  const glow = new Sprite(glowT);
  glow.anchor.set(0.5);
  glow.tint = o.color ?? NR.neon;
  glow.blendMode = 'add';
  glow.scale.set(tex.width / (glowT.width - 88) || 1);
  const tube = new Sprite(tex);
  tube.anchor.set(0.5);
  tube.tint = 0xffe6f2;
  root.addChild(glow, tube);
  return { root, tube, glow };
}
/** a neon's buzz: mostly on, a stutter now and then (deterministic in t) */
export function flickerAt(t: number, seed = 1) {
  const k = Math.floor(t * 14);
  const h = Math.abs(Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453) % 1;
  const burst = Math.floor(t / 3.7 + seed) % 3 === 0 && t % 3.7 < 0.5;
  return burst ? (h < 0.5 ? 0.15 : 1) : 0.88 + 0.12 * h;
}

// ------------------------------------------------------------------ wet reflections
const WET = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform float uT;
uniform float uAmt;
uniform float uSmear;
uniform float uPx;
${NOISE}
vec4 tex(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
void main() {
  vec2 uv = vTextureCoord;
  vec2 q = uv / max(uInputClamp.zw, vec2(1e-4));
  // ripples: rings of drops + a slow swell
  float n = vnoise(vec2(q.x * 60.0, q.y * 18.0 + uT * 1.5)) - 0.5;
  float sw = sin(q.y * 140.0 + uT * 6.0 + n * 4.0);
  vec2 off = vec2(sw * 2.2 + n * 6.0, n * 2.0) * uAmt * uInputSize.zw * uPx;
  // the wet smear: light pulled down into vertical streaks
  vec4 c = vec4(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 7; i++) {
    float k = float(i) / 6.0;
    float w = 1.0 - k * 0.7;
    c += tex(uv + off + vec2(0.0, k * uSmear * uInputSize.w * uPx)) * w;
    wsum += w;
  }
  c /= wsum;
  finalColor = c;
}`;
export function makeWet(): Filter {
  return glFilter('film-wet', WET, {
    uT: { value: 0, type: 'f32' },
    uAmt: { value: 1, type: 'f32' },
    uSmear: { value: 26, type: 'f32' },
    uPx: { value: 1, type: 'f32' },
  });
}
export function setWet(f: Filter, t: number, amt: number, smear: number, px: number) {
  const u = uni(f);
  u.uT = t;
  u.uAmt = amt;
  u.uSmear = smear;
  u.uPx = px;
}

// ------------------------------------------------------------------ drops on the lens
/**
 * Drops that land on the lens, swell, and slide down (each a soft dot with a lit rim, tinted by the light behind).
 * Closed form in t: drop i lives from its birth for `life` s; seeded.
 */
export class LensDrops {
  readonly root = new Container();
  private drops: { sp: Sprite; x: number; y: number; born: number; life: number; size: number; slide: number }[] = [];
  constructor(dot: Texture | undefined, n: number, seed = 5) {
    let s = seed * 9973;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const sp = new Sprite(dot);
      sp.anchor.set(0.5);
      sp.blendMode = 'add';
      this.root.addChild(sp);
      this.drops.push({ sp, x: r() * 1920, y: r() * 900, born: r() * 6, life: 2.5 + r() * 4, size: 0.12 + r() * 0.34, slide: r() < 0.4 ? 40 + r() * 160 : 0 });
    }
  }
  update(t: number, amount: number, tint: (x: number, y: number) => number, rm: boolean) {
    for (const d of this.drops) {
      const age = (((t - d.born) % (d.life + 1.5)) + d.life + 1.5) % (d.life + 1.5);
      const on = age < d.life;
      d.sp.visible = on && amount > 0.01;
      if (!d.sp.visible) continue;
      const k = age / d.life;
      const grow = Math.min(1, age / 0.25);
      const y = d.y + (rm ? 0 : d.slide * Math.max(0, k - 0.5) ** 2 * 4);
      d.sp.position.set(d.x, y);
      d.sp.scale.set(d.size * (0.5 + 0.5 * grow));
      d.sp.alpha = amount * 0.35 * grow * (1 - Math.max(0, k - 0.85) / 0.15);
      d.sp.tint = tint(d.x, y);
    }
  }
}
