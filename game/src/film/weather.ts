/**
 * PELÍCULAS — the weather and light library. Every particle is a CLOSED-FORM function of scene time (seeded): any
 * instant can be drawn, scrubbed or captured exactly. Textures are baked once (WEATHER bakes in catalog.ts).
 *
 *   rain       three layers of streaks (far / mid / near: thin → thick, slow → fast), slanted by the wind, lit where a
 *              light says so; splashes on the ground and rings in the puddles (`ground`, mounted by the set on its
 *              street plane); «Reducir movimiento»: 60 % of the drops, no camera-driven slant
 *   fog        two tiling sheets of baked noise drifting with the wind (put one between planes = aerial perspective)
 *   wind       leaves / petals / embers / dust / fireflies / paint strokes on a swaying path
 *   snow       flakes with sway, a few big out-of-focus ones near the lens
 *   lightning  bolts behind the clouds on `strikes`; the full-screen flash goes through the FlashGuard ('lightning'
 *              verb, stage.ts): «Reducir destellos» → a soft glow, never a white frame
 *   heat       a haze band (the film post)
 *   rays       god rays: a fan of light from a source, breathing slowly
 */
import { Container, Graphics, Rectangle, Sprite, Texture, TilingSprite } from 'pixi.js';
import type { Baker } from './bake';
import { BAKE_UV } from './bake';
import type { WeatherKind, WeatherSpec } from './types';

export interface WeatherTex {
  streak: Texture;
  streakSoft: Texture;
  splash: Texture[];
  ripple: Texture;
  fog: Texture;
  particles: Record<string, Texture>;
  bolts: Texture[];
  rays: Texture;
}
export interface WeatherFrame {
  amount: number;
  /** camera centre (design px) — near layers drift against it */
  cx: number;
  cy: number;
  rm: boolean;
  rf: boolean;
  /** light at a screen point 0..1 (rain caught in a lamp) */
  light?: (x: number, y: number) => number;
  /** lightning envelope (0..1) this frame */
  lit?: number;
  density: number;
}
export interface WeatherFx {
  kind: WeatherKind;
  spec: WeatherSpec;
  node: Container;
  /** rain: splashes + puddle rings (the set mounts it on its ground plane) */
  ground?: Container;
  update(lt: number, f: WeatherFrame): void;
  destroy(): void;
}

const fract = (x: number) => x - Math.floor(x);
const hash = (i: number, s = 0) => fract(Math.sin(i * 127.1 + s * 311.7) * 43758.5453123);

// ------------------------------------------------------------------ bakes
/** every bake job bakeWeather knows (catalog WEATHER bakes ⊆ this: tests/filmEngine.test.ts) */
export const WEATHER_JOBS = ['weather:streaks', 'weather:splash', 'weather:ripple', 'weather:fog', 'weather:particles', 'weather:bolts', 'weather:rays'];
/**
 * How a lightning strike may light the whole screen: through the FlashGuard (max 3 full-screen flashes a second,
 * momento time), and always 'soft' with «Reducir destellos».
 */
export function flashGrant(guard: { request(m: number, kind?: 'impact' | 'flash'): 'full' | 'soft' | 'none' }, m: number, reduceFlashes: boolean): 'full' | 'soft' | 'none' {
  return reduceFlashes ? 'soft' : guard.request(m, 'flash');
}
export function bakeWeather(b: Baker, kinds: Set<string>, out: Partial<WeatherTex>) {
  if (kinds.has('weather:streaks')) {
    out.streak = b.shade('w-streak', 6, 96, `${BAKE_UV}\nvoid main(){ vec2 uv = bakeUV(); float x = 1.0 - smoothstep(0.0, 0.5, abs(uv.x - 0.5)); float y = smoothstep(0.0, 0.7, uv.y) * (1.0 - smoothstep(0.9, 1.0, uv.y)); float a = x * y; finalColor = vec4(vec3(a), a); }`, {}, {}, { res: 1 });
    out.streakSoft = b.shade('w-streak-soft', 24, 160, `${BAKE_UV}\nvoid main(){ vec2 uv = bakeUV(); float x = exp(-pow((uv.x - 0.5) * 4.0, 2.0)); float y = smoothstep(0.0, 0.6, uv.y) * (1.0 - smoothstep(0.85, 1.0, uv.y)); float a = x * y * 0.8; finalColor = vec4(vec3(a), a); }`, {}, {}, { res: 1 });
  }
  if (kinds.has('weather:splash')) {
    const atlas = b.shade(
      'w-splash',
      256,
      40,
      `${BAKE_UV}
void main(){
  vec2 uv = bakeUV();
  float f = floor(uv.x * 4.0);
  vec2 q = vec2(fract(uv.x * 4.0), uv.y);
  float t = (f + 0.5) / 4.0;
  float a = 0.0;
  // the crown: droplets thrown out on an arc
  for (int i = 0; i < 7; i++) {
    float k = (float(i) - 3.0) / 3.0;
    float x = 0.5 + k * (0.12 + 0.3 * t);
    float h = (1.0 - k * k) * 0.8 * sin(t * 3.14159) + 0.08;
    float y = 0.92 - h;
    float r = 0.05 * (1.0 - t * 0.6);
    a += 1.0 - smoothstep(r * 0.4, r, length((q - vec2(x, y)) * vec2(1.0, 0.6)));
  }
  // the ring on the ground
  float ring = abs(length((q - vec2(0.5, 0.92)) * vec2(1.0, 4.0)) - (0.1 + 0.35 * t));
  a += (1.0 - smoothstep(0.0, 0.05, ring)) * (1.0 - t);
  a = clamp(a, 0.0, 1.0);
  finalColor = vec4(vec3(a), a);
}`,
      {},
      {},
      { res: 1 },
    );
    out.splash = [0, 1, 2, 3].map((i) => new Texture({ source: atlas.source, frame: new Rectangle(i * 64, 0, 64, 40) }));
  }
  if (kinds.has('weather:ripple')) {
    out.ripple = b.shade('w-ripple', 128, 44, `${BAKE_UV}\nvoid main(){ vec2 uv = bakeUV(); float d = length((uv - 0.5) * vec2(1.0, 2.9)); float a = (1.0 - smoothstep(0.0, 0.06, abs(d - 0.42))) * 0.9 + (1.0 - smoothstep(0.0, 0.05, abs(d - 0.3))) * 0.4; finalColor = vec4(vec3(a), a); }`, {}, {}, { res: 1 });
  }
  if (kinds.has('weather:fog')) {
    out.fog = b.shade('w-fog', 512, 512, `${BAKE_UV}\nvoid main(){ vec2 uv = bakeUV(); float n = pfbm(uv * 4.0, 4.0) * 0.7 + pfbm(uv * 9.0 + 3.0, 9.0) * 0.3; float a = smoothstep(0.3, 0.8, n); finalColor = vec4(vec3(a), a); }`, {}, {}, { res: 1 });
  }
  if (kinds.has('weather:particles')) {
    const atlas = b.shade(
      'w-particles',
      512,
      64,
      `${BAKE_UV}
void main(){
  vec2 uv = bakeUV();
  float cell = floor(uv.x * 8.0);
  vec2 q = vec2(fract(uv.x * 8.0), uv.y) - 0.5;
  float a = 0.0; vec3 c = vec3(1.0);
  if (cell < 0.5) { // leaf
    vec2 p = q * vec2(1.0, 2.2); a = 1.0 - smoothstep(0.32, 0.36, length(p) + abs(q.y) * 0.3); a *= 1.0 - (1.0 - smoothstep(0.0, 0.02, abs(q.y))) * 0.4; c = vec3(0.95, 0.75, 0.35);
  } else if (cell < 1.5) { // petal
    vec2 p = q * vec2(1.6, 2.4); a = 1.0 - smoothstep(0.3, 0.34, length(p - vec2(0.0, 0.05))); c = vec3(1.0, 0.82, 0.88);
  } else if (cell < 2.5) { // ember
    float d = length(q); a = exp(-d * d * 60.0); c = vec3(1.0, 0.6, 0.2);
  } else if (cell < 3.5) { // dust
    float d = length(q); a = exp(-d * d * 140.0) * 0.8;
  } else if (cell < 4.5) { // firefly
    float d = length(q); a = exp(-d * d * 30.0) + exp(-d * d * 400.0); c = vec3(0.9, 1.0, 0.55);
  } else if (cell < 5.5) { // snowflake (soft)
    float d = length(q); a = 1.0 - smoothstep(0.08, 0.22, d);
  } else if (cell < 6.5) { // a paint stroke
    a = (1.0 - smoothstep(0.08, 0.12, abs(q.y + sin(q.x * 6.0) * 0.03))) * (1.0 - smoothstep(0.32, 0.45, abs(q.x)));
  } else { // a drop
    float d = length(q * vec2(1.0, 0.8)); a = (1.0 - smoothstep(0.2, 0.26, d)) * (0.4 + 0.6 * smoothstep(0.0, 0.25, -q.y + 0.1));
  }
  a = clamp(a, 0.0, 1.0);
  finalColor = vec4(c * a, a);
}`,
      {},
      {},
      { res: 1 },
    );
    const names = ['leaf', 'petal', 'ember', 'dust', 'firefly', 'snow', 'stroke', 'drop'];
    out.particles = Object.fromEntries(names.map((n, i) => [n, new Texture({ source: atlas.source, frame: new Rectangle(i * 64, 0, 64, 64) })]));
  }
  if (kinds.has('weather:bolts')) {
    out.bolts = [1, 2, 3].map((seed) => bolt(b, seed));
  }
  if (kinds.has('weather:rays')) {
    out.rays = b.shade(
      'w-rays',
      1024,
      768,
      `${BAKE_UV}
void main(){
  vec2 uv = bakeUV();
  vec2 d = uv - vec2(0.5, 0.0);
  float ang = atan(d.x, d.y);
  float r = length(d * vec2(1.0, 1.0));
  float fan = 1.0 - smoothstep(0.35, 0.62, abs(ang));
  float shafts = smoothstep(0.35, 0.9, vnoise(vec2(ang * 18.0, 0.5)) * 0.7 + vnoise(vec2(ang * 47.0, 3.0)) * 0.3);
  float a = fan * shafts * exp(-r * 1.8) * smoothstep(0.0, 0.06, r) * 0.9;
  finalColor = vec4(vec3(a), a);
}`,
      {},
      {},
      { res: 0.75 },
    );
  }
}
/** a branching bolt (white core, soft glow), drawn once and rasterized */
function bolt(b: Baker, seed: number): Texture {
  let s = seed * 7919;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = new Graphics();
  const walk = (x: number, y: number, len: number, w: number, depth: number) => {
    const pts: [number, number][] = [[x, y]];
    let cx = x;
    let cy = y;
    const n = Math.floor(len / 26);
    for (let i = 0; i < n; i++) {
      cx += (r() - 0.5) * 44;
      cy += 18 + r() * 16;
      pts.push([cx, cy]);
      if (depth < 2 && r() < 0.13) walk(cx, cy, len * 0.4, w * 0.55, depth + 1);
    }
    for (const [wd, al] of [
      [w * 5, 0.12],
      [w * 2.4, 0.3],
      [w, 1],
    ] as [number, number][]) {
      g.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
      g.stroke({ width: wd, color: 0xe8eeff, alpha: al, cap: 'round', join: 'round' });
    }
  };
  walk(128, 0, 740, 4, 0);
  const holder = new Container();
  holder.addChild(g);
  return b.raster(holder, { frame: new Rectangle(0, 0, 256, 768), res: 0.75 }).tex;
}

// ------------------------------------------------------------------ the effects
export function makeWeather(spec: WeatherSpec, T: Partial<WeatherTex>, density: number): WeatherFx | null {
  switch (spec.kind) {
    case 'rain':
      return rain(spec, T, density);
    case 'fog':
      return fog(spec, T);
    case 'wind':
    case 'snow':
      return drift(spec, T, density);
    case 'lightning':
      return lightning(spec, T);
    case 'rays':
      return rays(spec, T);
    case 'heat':
      return { kind: 'heat', spec, node: new Container(), update: () => undefined, destroy: () => undefined };
    default:
      return null;
  }
}

function rain(spec: WeatherSpec, T: Partial<WeatherTex>, density: number): WeatherFx {
  const node = new Container();
  const ground = new Container();
  const seed = spec.seed ?? 11;
  const N = Math.round(520 * density);
  const layers = [
    { v: 1500, len: 0.55, a: 0.22, w: 0.7, par: 0.15, tex: T.streak },
    { v: 2200, len: 0.85, a: 0.32, w: 1, par: 0.4, tex: T.streak },
    { v: 3100, len: 1.5, a: 0.38, w: 1.1, par: 0.9, tex: T.streakSoft },
  ];
  const drops = Array.from({ length: N }, (_, i) => {
    const L = layers[i % 10 < 5 ? 0 : i % 10 < 9 ? 1 : 2];
    const sp = new Sprite(L.tex);
    sp.anchor.set(0.5, 1);
    sp.alpha = 0;
    node.addChild(sp);
    return { sp, L, x0: hash(i, seed) * 2600 - 340, ph: hash(i, seed + 1), vj: 0.85 + hash(i, seed + 2) * 0.3, on: hash(i, seed + 3) };
  });
  // splashes and puddle rings on the ground band
  const gy = spec.ground ?? 900;
  const splashes = Array.from({ length: Math.round(70 * density) }, (_, i) => {
    const sp = new Sprite(T.splash?.[0]);
    sp.anchor.set(0.5, 0.92);
    ground.addChild(sp);
    const y = gy + hash(i, seed + 9) ** 1.6 * 260;
    return { sp, x: hash(i, seed + 7) * 2400 - 240, y, per: 0.45 + hash(i, seed + 8) * 0.5, ph: hash(i, seed + 10), sc: 0.35 + ((y - gy) / 260) * 0.9 };
  });
  const rings = Array.from({ length: Math.round(24 * density) }, (_, i) => {
    const sp = new Sprite(T.ripple);
    sp.anchor.set(0.5);
    sp.blendMode = 'add';
    ground.addChild(sp);
    const y = gy + 40 + hash(i, seed + 19) * 200;
    return { sp, x: hash(i, seed + 17) * 2000 - 40, y, per: 0.9 + hash(i, seed + 18) * 0.8, ph: hash(i, seed + 20), sc: 0.4 + ((y - gy) / 240) * 0.8 };
  });
  const ang = spec.angle ?? 0.18;
  const tint = spec.color ?? 0xc8d4e6;
  return {
    kind: 'rain',
    spec,
    node,
    ground,
    update(lt, f) {
      const amt = f.amount;
      const keep = f.rm ? 0.6 : 1;
      const H = 1300;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const vis = amt > 0.01 && d.on < amt * keep;
        d.sp.visible = vis;
        if (!vis) continue;
        const L = d.L;
        const y = fract(d.ph + (lt * L.v * d.vj) / H) * H - 120;
        const par = f.rm ? 0 : L.par;
        let x = d.x0 + Math.tan(ang) * y - (f.cx - 960) * par;
        x = ((((x + 340) % 2600) + 2600) % 2600) - 340;
        d.sp.position.set(x, y);
        d.sp.rotation = -ang;
        const lit = f.light ? f.light(x, y) : 0;
        d.sp.scale.set(L.w, (L.len * (0.8 + d.vj * 0.4) * 96) / (L.tex?.height ?? 96) * 1.6);
        d.sp.alpha = L.a * (0.55 + lit * 1.6 + (f.lit ?? 0) * 1.2);
        d.sp.tint = lit > 0.15 ? 0xffe8c4 : tint;
      }
      for (const s of splashes) {
        const ph = fract(lt / s.per + s.ph);
        const fr = Math.floor(ph * 6);
        const vis = amt > 0.05 && fr < 4 && hash(Math.floor(lt / s.per + s.ph) * 31 + s.x, 3) < amt;
        s.sp.visible = vis;
        if (!vis) continue;
        s.sp.texture = T.splash?.[fr] ?? Texture.EMPTY;
        s.sp.position.set(s.x, s.y);
        s.sp.scale.set(s.sc);
        s.sp.alpha = 0.45 * amt;
        s.sp.tint = tint;
      }
      for (const r of rings) {
        const ph = fract(lt / r.per + r.ph);
        r.sp.visible = amt > 0.05;
        r.sp.position.set(r.x, r.y);
        r.sp.scale.set(r.sc * (0.3 + ph * 1.4));
        r.sp.alpha = (1 - ph) * 0.35 * amt;
      }
    },
    destroy() {
      node.destroy({ children: true });
      ground.destroy({ children: true });
    },
  };
}

function fog(spec: WeatherSpec, T: Partial<WeatherTex>): WeatherFx {
  const node = new Container();
  const mk = (sc: number) => {
    const ts = new TilingSprite({ texture: T.fog ?? Texture.WHITE, width: 3400, height: spec.band ? spec.band[1] - spec.band[0] : 1900 });
    ts.position.set(-740, spec.band ? spec.band[0] : -400);
    ts.tileScale.set(sc);
    ts.tint = spec.color ?? 0x9aa4b4;
    node.addChild(ts);
    return ts;
  };
  const a = mk(2.2);
  const b = mk(1.3);
  const ang = spec.angle ?? 0;
  return {
    kind: 'fog',
    spec,
    node,
    update(lt, f) {
      const v = f.rm ? 0.4 : 1;
      a.tilePosition.set(lt * 22 * v * Math.cos(ang), lt * 4 * v);
      b.tilePosition.set(lt * 41 * v * Math.cos(ang) + 300, -lt * 3 * v);
      a.alpha = 0.34 * f.amount;
      b.alpha = 0.22 * f.amount;
    },
    destroy: () => node.destroy({ children: true }),
  };
}

function drift(spec: WeatherSpec, T: Partial<WeatherTex>, density: number): WeatherFx {
  const node = new Container();
  const snow = spec.kind === 'snow';
  const kind = snow ? 'snow' : (spec.particle ?? 'leaf');
  const tex = T.particles?.[kind] ?? Texture.WHITE;
  const seed = spec.seed ?? 21;
  const N = Math.round((snow ? 260 : kind === 'dust' ? 160 : kind === 'firefly' ? 60 : 90) * density);
  const up = kind === 'ember' || kind === 'firefly';
  const ps = Array.from({ length: N }, (_, i) => {
    const sp = new Sprite(tex);
    sp.anchor.set(0.5);
    if (kind === 'ember' || kind === 'firefly') sp.blendMode = 'add';
    node.addChild(sp);
    const near = hash(i, seed + 5) < 0.12;
    return { sp, x0: hash(i, seed) * 2400 - 240, y0: hash(i, seed + 1) * 1300, v: 0.6 + hash(i, seed + 2) * 0.8, sw: hash(i, seed + 3) * 6.28, sz: (near ? 1.6 : 0.35 + hash(i, seed + 4) * 0.6) * (snow ? 0.7 : 0.6), near };
  });
  const ang = spec.angle ?? 0.3;
  return {
    kind: spec.kind,
    spec,
    node,
    update(lt, f) {
      const amt = f.amount;
      const rm = f.rm;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const vis = amt > 0.01 && hash(i, seed + 9) < amt * (rm ? 0.6 : 1);
        p.sp.visible = vis;
        if (!vis) continue;
        const fall = snow ? 90 : up ? -60 : 70;
        const side = snow ? 30 : 160;
        const vx = Math.cos(ang) * side * p.v;
        let x = p.x0 + vx * lt + Math.sin(lt * 1.3 + p.sw) * (rm ? 8 : 30) - (rm ? 0 : (f.cx - 960) * (p.near ? 0.9 : 0.3));
        let y = p.y0 + fall * p.v * lt + Math.sin(lt * 0.9 + p.sw * 2) * 12;
        x = ((((x + 240) % 2400) + 2400) % 2400) - 240;
        y = ((((y + 100) % 1300) + 1300) % 1300) - 100;
        p.sp.position.set(x, y);
        p.sp.rotation = rm ? 0 : lt * (0.6 + p.v) + p.sw;
        p.sp.scale.set(p.sz);
        const tw = kind === 'firefly' ? 0.5 + 0.5 * Math.sin(lt * 3 + p.sw * 3) : 1;
        p.sp.alpha = (p.near ? 0.35 : 0.8) * tw;
        if (spec.color !== undefined) p.sp.tint = spec.color;
      }
    },
    destroy: () => node.destroy({ children: true }),
  };
}

function lightning(spec: WeatherSpec, T: Partial<WeatherTex>): WeatherFx {
  const node = new Container();
  const strikes = spec.strikes ?? [];
  const bolts = strikes.map((_, i) => {
    const sp = new Sprite(T.bolts?.[i % (T.bolts?.length || 1)] ?? Texture.EMPTY);
    sp.anchor.set(0.5, 0);
    sp.blendMode = 'add';
    const from = spec.from ?? [700 + i * 380, -40];
    sp.position.set(from[0] + ((i * 211) % 300) - 150, from[1]);
    sp.scale.set(0.9 + (i % 2) * 0.4);
    node.addChild(sp);
    return sp;
  });
  return {
    kind: 'lightning',
    spec,
    node,
    update(lt, f) {
      bolts.forEach((sp, i) => {
        const age = lt - strikes[i];
        // a double strike: on for 70 ms, a gap, again 90 ms, then a fading after-image
        const e = age < 0 ? 0 : age < 0.07 ? 1 : age < 0.12 ? 0.25 : age < 0.21 ? 0.9 : Math.max(0, 0.5 - (age - 0.21) * 1.4);
        sp.visible = e > 0.01;
        sp.alpha = e * (f.rf ? 0.4 : 1);
      });
    },
    destroy: () => node.destroy({ children: true }),
  };
}
/** the lightning envelope at scene time t for a list of strikes (the flash / exposure the stage applies) */
export function strikeEnv(strikes: number[] | undefined, t: number): number {
  let e = 0;
  for (const s of strikes ?? []) {
    const age = t - s;
    if (age < 0 || age > 0.9) continue;
    e = Math.max(e, age < 0.07 ? 1 : age < 0.12 ? 0.2 : age < 0.21 ? 0.85 : Math.max(0, 0.45 - (age - 0.21) * 0.7));
  }
  return e;
}

function rays(spec: WeatherSpec, T: Partial<WeatherTex>): WeatherFx {
  const node = new Container();
  const sp = new Sprite(T.rays ?? Texture.EMPTY);
  sp.anchor.set(0.5, 0);
  sp.blendMode = 'add';
  const from = spec.from ?? [960, 0];
  sp.position.set(from[0], from[1]);
  sp.tint = spec.color ?? 0xfff0d0;
  node.addChild(sp);
  return {
    kind: 'rays',
    spec,
    node,
    update(lt, f) {
      sp.rotation = (spec.angle ?? 0) + (f.rm ? 0 : Math.sin(lt * 0.21) * 0.025);
      sp.alpha = f.amount * (0.75 + 0.25 * Math.sin(lt * 0.7 + 1.3));
      sp.scale.set(1.25);
    },
    destroy: () => node.destroy({ children: true }),
  };
}
