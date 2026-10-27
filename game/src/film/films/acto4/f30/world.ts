/**
 * F30 · «La noche estrellada» — THE PAINTED ISLAND: your island as «La noche estrellada» (1889), every surface brush
 * strokes laid along flow fields (styles/vangogh.ts), baked ONCE per film (a cache on the baker: every scene shares the
 * paint) — and the whole night CHOREOGRAPHED IN SONG TIME. Every scene of the film is a camera on this one world and
 * calls `update(m)` with the song's time, so every cut lands on the same instant of the same night.
 *
 *   sky (z 1800)      underpainting + coat + strokes along wind and three vortices, 3 variants that BOIL at 8 fps
 *                     (one with «Reducir movimiento»); vortex halos and star halos that TURN; a crescent moon
 *   sea (z 1250)      horizontal strokes, the moon's broken reflection
 *   village (z 1400)  the houses on the far hill with yellow windows (the village of the painting)
 *   island (z 1000)   the mound and the beach (strokes along the ground), the lighthouse, ITS BEAM — painted as one
 *                     more swirl that turns slowly —, the dock, two rocks, the blanket, the bonfire (3 flame variants)
 *   cypress (z 640)   Canelo's palm painted as the cypress of the painting, in front, on the left
 *   the cats          impasto paintings, alive (CatPuppet), each with a PAINTED SHADOW from the moon and the fire —
 *                     except LUZTERNA: she never had a shadow («Yo no tengo sombra», Parte I)
 *
 * Choreography (guiones/acto-4/h92-la-noche-estrellada.md N1–N33, xti 140 BPM, 1 bar = 12/7 s).
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FrameInfo, SceneCtx } from '../../../stage';
import type { Actor } from '../../../../momentos/anime/actor';
import { contour, gradient, halo, mixHex, paintField, ramp, swirl, VG, wind } from '../../../styles/vangogh';
import { G } from '../../../../state/game';
import { catSlug } from '../../../../state/sys/forms';
import { catRig } from '../../../../art/puppetCore';
import { XT } from '../music';
import { BAKE_UV } from '../../../bake';
import { FLAME, SLUG, StaticKitten, caneloFlame, kitTex, lanternAt, luzOf, rnd, seg, sm, type LuzRig } from '../kit';

// ------------------------------------------------------------------ layout (world px at z 1000)
export const HORIZON = 740;
/** the lighthouse: its painted tower scaled ×1.75 (370 painted px of body above the base) */
const TS = 1.75;
export const LIGHT = { x: 1360, base: 820, top: 820 - 370 * TS };
export const LAMP: [number, number] = [LIGHT.x, LIGHT.top - 24];
export const BALCONY: [number, number] = [LIGHT.x + 86, LIGHT.top + 40];
export const STEP: [number, number] = [LIGHT.x - 10, LIGHT.base + 4];
export const FIRE: [number, number] = [960, 958];
export const BLANKET: [number, number] = [1240, 966];
export const DOCK = { x0: 1760, x1: 2380, y: 950 };
/** the ground line of the beach (feet y at x): a mound under the lighthouse; at the right it goes into the water */
export const ground = (x: number) => 965 - 150 * Math.exp(-(((x - LIGHT.x) / 280) ** 2)) - 8 * Math.sin(x / 90) + (x > 1720 ? (x - 1720) * 0.9 : 0);
export const SKY = { x: -560, y: -980, w: 3200, h: 2080 };
const VORTICES = [
  { x: 980, y: -40, r: 300, s: 1 },
  { x: 380, y: -260, r: 210, s: -0.85 },
  { x: 1720, y: -180, r: 230, s: 0.75 },
];
const STARS: [number, number, number][] = [
  [140, 120, 46],
  [420, 300, 36],
  [700, -120, 52],
  [820, 380, 32],
  [1180, 330, 40],
  [1540, 180, 50],
  [1820, 120, 38],
  [2020, 360, 34],
  [-80, -60, 40],
  [1100, -520, 46],
  [1960, -560, 44],
  [520, -620, 40],
  [240, -420, 30],
  [1420, -760, 38],
];
export const MOON: [number, number] = [1900, -380];

// ------------------------------------------------------------------ the paint, baked once per film
const CACHE = new WeakMap<object, Map<string, Texture[]>>();
function cached(ctx: SceneCtx, key: string, fn: () => Texture[]): Texture[] {
  let m = CACHE.get(ctx.baker);
  if (!m) CACHE.set(ctx.baker, (m = new Map()));
  let t = m.get(key);
  if (!t) m.set(key, (t = fn()));
  return t;
}
function paints(ctx: SceneCtx) {
  const b = ctx.baker;
  const hi = ctx.quality === 'high';
  const sky = cached(ctx, 'sky', () => {
    const flow = swirl(wind(0.26, 0.0035, 1.3), VORTICES.map((v) => ({ x: v.x - SKY.x, y: v.y - SKY.y, r: v.r, s: v.s })));
    const grad = gradient([0x0c1840, VG.prussian, VG.ultramarine, 0x22388e, VG.cobalt, 0x3f6cc8]);
    const color = (x: number, y: number, r: number) => {
      const wx = x + SKY.x;
      const wy = y + SKY.y;
      let near = 0;
      for (const v of VORTICES) near = Math.max(near, Math.exp(-(((Math.hypot(wx - v.x, wy - v.y) - v.r * 0.55) / (v.r * 0.38)) ** 2)));
      for (const [sx, sy, sr] of STARS) near = Math.max(near, 0.65 * Math.exp(-((Math.hypot(wx - sx, wy - sy) / (sr * 2.4)) ** 2)));
      const t = Math.min(1, Math.max(0, (wy + 980) / 1760) * 0.75 + near * 0.6);
      return ramp([VG.prussian, VG.ultramarine, 0x22388e, VG.cobalt, 0x3f6cc8, VG.cerulean, VG.pale], t, r, 0.24);
    };
    const n = ctx.rm ? 1 : 3;
    return Array.from({ length: n }, (_, i) =>
      paintField(b, { w: SKY.w, h: SKY.h, flow, color, under: (y) => grad(y / SKY.h), coat: { density: 4, width: [18, 26], len: [40, 70] }, density: hi ? 13 : 9, len: [26, 50], width: [11, 17], segs: 3, seed: 11 + i * 101, res: 0.8 }),
    );
  });
  const vort = cached(ctx, 'vortex', () => VORTICES.map((v) => halo(b, { r: v.r, rings: [0xdfe9f2, 0xb4ccec, VG.pale, VG.cerulean, 0x3f6cc8, VG.cobalt], seed: Math.round(v.x + 900), width: 11, res: 0.9 })));
  const stars = cached(ctx, 'stars', () => STARS.map(([x, y, r]) => halo(b, { r, rings: [0xfffbe6, VG.lemon, VG.chrome, VG.lemon, 0x9fb8e0, VG.cerulean], core: 0xfffbe6, seed: Math.round(x + y + 2000), width: 6, res: 1.3 })));
  const moon = cached(ctx, 'moon', () => [
    halo(b, { r: 150, rings: [VG.lemon, VG.chrome, VG.lemon, 0xe8d890, 0x9fb8e0, VG.cerulean], seed: 77, width: 8, res: 1.6 }),
    paintField(b, { w: 170, h: 170, density: 70, len: [16, 30], width: [6, 10], segs: 3, res: 1.8, flow: (x, y) => Math.atan2(y - 85, x - 85) + Math.PI / 2, inside: (x, y) => Math.hypot(x - 85, y - 85) < 66 && Math.hypot(x - 114, y - 66) > 56, color: (x, y, r) => (r < 0.3 ? VG.orange : r < 0.8 ? VG.chrome : VG.lemon), seed: 5 }),
  ]);
  const sea = cached(ctx, 'sea', () => [
    paintField(b, { w: 3400, h: 520, flow: wind(0.07, 0.01, 2), color: (x, y, r) => (r < 0.06 ? VG.pale : ramp([0x2d68b8, 0x2558a8, 0x1f4a98, 0x1b3f88, 0x163a7a], y / 520, r, 0.25)), under: (y) => gradient([0x2558a8, 0x1b3f88, 0x12306e])(y / 520), coat: { density: 5, width: [16, 22], len: [44, 70] }, density: 12, len: [30, 56], width: [8, 12], seed: 41, res: 0.8 }),
    paintField(b, { w: 240, h: 420, flow: () => 0, inside: (x, y) => Math.abs(x - 120) < 26 + y * 0.17 && (Math.floor(y / 24) % 2 === 0 || x % 3 < 2), color: (x, y, r) => (r < 0.5 ? VG.chrome : VG.lemon), density: 44, len: [18, 34], width: [6, 9], seed: 43 }),
  ]);
  const village = cached(ctx, 'village', () => {
    const farY = (x: number) => 520 - 34 * Math.sin(x / 210 + 1) - 22 * Math.sin(x / 83);
    return [
      paintField(b, { w: 1700, h: 200, flow: contour((x) => farY(x - 500)), inside: (x, y) => y + 420 > farY(x - 500) && x < 1500 - y * 0.6, color: (x, y, r) => ramp([0x2c4a6e, 0x243a6a, 0x1f3060, 0x1a2350], (y + 420 - farY(x - 500)) / 120, r, 0.3), coat: { density: 6, width: [16, 22], len: [30, 50] }, density: 14, len: [22, 40], width: [8, 13], seed: 23, res: 0.9 }),
      paintField(b, { w: 760, h: 120, flow: () => -Math.PI / 2, inside: (x, y) => { const i = Math.floor(x / 54); const top = 40 + ((i * 37) % 44); return y > top && x % 54 < 44; }, color: (x, y, r) => (r < 0.18 && (Math.floor(y / 16) + Math.floor(x / 13)) % 3 === 0 ? VG.lemon : r < 0.6 ? 0x1c2a58 : 0x2a3c70), density: 80, len: [10, 18], width: [5, 8], seed: 31 }),
    ];
  });
  const isl = cached(ctx, 'island', () => [
    paintField(b, {
      w: 3000,
      h: 460,
      flow: contour((x) => ground(x - 500)),
      inside: (x, y) => y + 660 > ground(x - 500) - 10,
      color: (x, y, r) => {
        const wx = x - 500;
        const d = (y + 660 - ground(wx)) / 200;
        const sand = Math.abs(wx - LIGHT.x) > 360 && y + 660 > 930;
        if (sand) return r < 0.1 ? VG.lemon : ramp([0xc8a454, 0xb08c44, 0x8a6c3a, 0x5a4a34], d, r, 0.3);
        return r < 0.07 ? VG.ochre : ramp([0x7a8a3a, 0x5c7438, 0x3c6238, 0x2a4a34, 0x1a3030], d, r, 0.3);
      },
      coat: { density: 6, width: [16, 24], len: [36, 60] },
      density: hi ? 16 : 11,
      len: [24, 44],
      width: [9, 14],
      seed: 53,
      res: 1.15,
    }),
  ]);
  const tower = cached(ctx, 'tower', () => [
    paintField(b, {
      w: 170,
      h: 430,
      flow: () => -Math.PI / 2 + 0.05,
      inside: (x, y) => Math.abs(x - 85) < 32 + (y / 430) * 30 && y > 60,
      color: (x, y, r) => ((y > 180 && y < 222) || (y > 300 && y < 342) ? (r < 0.6 ? 0xc0442e : 0x9a3424) : x < 72 ? 0xd8ccb0 : r < 0.7 ? 0xeee6c8 : 0xf6f0dc),
      coat: { density: 30, width: [12, 16], len: [20, 30] },
      density: 70,
      len: [14, 26],
      width: [6, 9],
      seed: 61,
      res: 1.6,
    }),
    halo(b, { r: 56, rings: [0xfffbe6, VG.lemon, VG.chrome, VG.orange], core: 0xfffbe6, seed: 63, width: 5, res: 1.5 }),
    // the beam: a long fan of strokes that curl — a swirl among the swirls
    paintField(b, { w: 1100, h: 300, flow: (x, y) => Math.atan2(y - 150, x) * 0.6 + Math.sin(x / 120) * 0.25, inside: (x, y) => Math.abs(y - 150) < 10 + x * 0.12, color: (x, y, r) => (r < 0.5 ? VG.lemon : r < 0.85 ? VG.chrome : 0xfff3b0), density: 16, len: [30, 60], width: [7, 12], seed: 67, res: 1.0 }),
  ]);
  const cyp = cached(ctx, 'cypress', () => [
    paintField(b, {
      w: 380,
      h: 1500,
      flow: (x, y) => -Math.PI / 2 + Math.sin(y / 90 + x / 60) * 0.35,
      inside: (x, y) => {
        const t = y / 1500;
        const hw = 170 * Math.sin(Math.min(1, t * 1.12) * Math.PI * 0.5) ** 0.8 * (0.85 + 0.15 * Math.sin(y / 40));
        return Math.abs(x - 190) < hw;
      },
      color: (x, y, r) => ramp([0x2a4a3a, 0x1c3a2c, 0x14301e, 0x0d1830, 0x0b1a14], (Math.abs(x - 190) / 170) * 0.6 + r * 0.4, r, 0.2),
      coat: { density: 8, width: [16, 24], len: [40, 70] },
      density: 22,
      len: [30, 60],
      width: [9, 15],
      segs: 3,
      seed: 71,
      res: 1.0,
    }),
  ]);
  const props = cached(ctx, 'props', () => [
    // the dock (planks along it, posts)
    paintField(b, { w: 680, h: 120, flow: () => 0, inside: (x, y) => (y > 40 && y < 74) || (y >= 74 && x % 110 < 22), color: (x, y, r) => ramp([0x8a6a3a, 0x6a4a2a, 0x4a3420], (y - 40) / 80, r, 0.3), density: 60, len: [20, 40], width: [6, 10], seed: 81, res: 1.2 }),
    // a rock
    paintField(b, { w: 260, h: 150, flow: (x, y) => Math.atan2(y - 150, x - 130) + Math.PI / 2, inside: (x, y) => ((x - 130) / 125) ** 2 + ((y - 150) / 140) ** 2 < 1, color: (x, y, r) => ramp([0x6a7a9a, 0x4a5a7a, 0x34405a, 0x222a40], (y / 150) * 0.7 + r * 0.3, r, 0.2), density: 50, len: [14, 26], width: [6, 10], seed: 83, res: 1.3 }),
    // the blanket (a little quilt, painted)
    paintField(b, { w: 150, h: 50, flow: () => 0.1, inside: (x, y) => y > 8 && y < 46, color: (x, y, r) => ((Math.floor(x / 30) + Math.floor(y / 19)) % 2 ? (r < 0.5 ? 0x5a6ab8 : 0x4a5aa8) : r < 0.5 ? 0xe8c86a : 0xd8b85a), density: 120, len: [10, 18], width: [5, 7], seed: 85, res: 1.6 }),
    // a shadow (a dark oval of strokes, blue-black; tinted per use)
    paintField(b, { w: 200, h: 60, flow: () => 0, inside: (x, y) => ((x - 100) / 98) ** 2 + ((y - 30) / 28) ** 2 < 1, color: (x, y, r) => (r < 0.5 ? 0x0d1838 : 0x14204a), density: 60, len: [16, 30], width: [6, 9], seed: 87, res: 1.2 }),
    // NADIE (stand-in: nadie_static_cat is not used) — a pale sitting cat made of strokes, a pink rim
    paintField(b, {
      w: 160,
      h: 220,
      flow: (x, y) => -Math.PI / 2 + (x - 80) * 0.01,
      inside: (x, y) => {
        const body = ((x - 80) / 62) ** 2 + ((y - 160) / 60) ** 2 < 1;
        const head = Math.hypot(x - 84, y - 78) < 42;
        const ear = (y > 22 && y < 60 && ((x > 48 && x < 70 && y > 22 + (70 - x) * 0.6) || (x > 96 && x < 120 && y > 22 + (x - 96) * 0.6)));
        return body || head || ear;
      },
      color: (x, y, r) => (r < 0.15 ? 0xff7fb8 : r < 0.6 ? 0xe8ecf6 : 0xc8d0e8),
      density: 120,
      len: [10, 20],
      width: [5, 8],
      seed: 89,
      res: 1.6,
    }),
  ]);
  const fire = cached(ctx, 'fire', () => {
    const n = ctx.rm ? 2 : 3;
    return Array.from({ length: n }, (_, i) =>
      paintField(b, {
        w: 200,
        h: 260,
        flow: (x, y) => -Math.PI / 2 + Math.sin(y / 30 + i * 2) * 0.4 + (x - 100) * 0.004,
        inside: (x, y) => {
          const t = 1 - y / 260;
          // three tongues of different heights that lean and lick
          for (const [cx, h, w] of [
            [64, 0.62, 44],
            [100, 1.0, 56],
            [138, 0.74, 42],
          ] as const) {
            if (t > h) continue;
            const k = t / h;
            const hw = w * Math.sin(Math.min(1, (1 - k) * 1.5) * Math.PI * 0.5) * (1 - k * 0.92) + 3;
            if (Math.abs(x - cx + Math.sin(y / 22 + i * 2 + cx) * 12 * k) < hw) return true;
          }
          return false;
        },
        color: (x, y, r) => ramp([0xfff0a0, 0xffc020, 0xff8a1a, 0xf05a1a, 0xd8301a], 0.2 + (1 - y / 260) * 0.75 + (r - 0.5) * 0.3, r, 0.12),
        density: 110,
        len: [16, 30],
        width: [6, 10],
        segs: 3,
        seed: 91 + i * 13,
        res: 1.4,
      }),
    );
  });
  return { sky, vort, stars, moon, sea, village, isl, tower, cyp, props, fire };
}

// ------------------------------------------------------------------ who lives on the island (the conditional slots)
/** Homiau and Borrón only if they're on YOUR island; otherwise their shots go to cats of your save (or stand-ins) */
export function islandSlots(): [string, string] {
  const main = new Set<string>(['ecomudo_static_cat', SLUG.hipo, SLUG.cronos, SLUG.maneki, SLUG.grafitera, SLUG.noctis, SLUG.cerito, 'luzterna', 'canelo_cozy_cat', 'canelo_admiral_cat', 'canelo_astral_cat', 'nadie_static_cat']);
  const out: string[] = [];
  try {
    const cats = G.s?.cats ?? [];
    // Homiau / Borrón by their species, when the save has them (H75 chain, Borrón's desertion)
    for (const want of ['homiau', 'borron']) {
      const c = cats.find((x) => x.species.toLowerCase().includes(want));
      if (c) out.push(catSlug(c));
    }
    for (const c of cats) {
      if (out.length >= 2) break;
      const s = catSlug(c);
      if (!main.has(s) && !out.includes(s) && catRig(s)) out.push(s);
    }
  } catch {
    /* no save (dev route) */
  }
  if (out.length < 1) out.push(SLUG.homiau);
  if (out.length < 2) out.push(out[0] === SLUG.borron ? SLUG.homiau : SLUG.borron);
  return [out[0], out[1]];
}
/** NADIE's stand-in (nadie_static_cat is not used): a pale static cat */
export const NADIE = 'ecomudo_static_cat';
export const F30_CATS = (canelo: string) => [canelo, 'luzterna', SLUG.hipo, SLUG.cronos, SLUG.maneki, SLUG.grafitera, SLUG.noctis, SLUG.cerito, NADIE, ...islandSlots()];

// ------------------------------------------------------------------ the world
export interface World {
  update(m: number, f: FrameInfo): void;
  /** named points on screen (subtitle, the faro for a gate…) */
  anchor(name: string, f: FrameInfo): [number, number] | null;
  skyPlane: ReturnType<SceneCtx['plane']>;
}
interface Cat {
  a: Actor | null;
  sh: Sprite | null;
}
/** the time helpers in BARS of xti */
const B = (bar: number) => XT(bar);

export function vgWorld(ctx: SceneCtx, o: { cypress?: boolean } = {}): World {
  const P = paints(ctx);
  const rm = ctx.rm;
  // ---- the sky
  const skyN = new Container();
  const sky = new Sprite(P.sky[0]);
  sky.position.set(SKY.x, SKY.y);
  sky.setSize(SKY.w, SKY.h);
  skyN.addChild(sky);
  const turning: { sp: Sprite; w: number; ph: number; pulse: number }[] = [];
  VORTICES.forEach((v, i) => {
    const sp = new Sprite(P.vort[i]);
    sp.anchor.set(0.5);
    sp.position.set(v.x, v.y);
    sp.alpha = 0.78;
    skyN.addChild(sp);
    turning.push({ sp, w: 0.05 * v.s, ph: v.x, pulse: 0 });
  });
  STARS.forEach(([x, y], i) => {
    const sp = new Sprite(P.stars[i]);
    sp.anchor.set(0.5);
    sp.position.set(x, y);
    skyN.addChild(sp);
    turning.push({ sp, w: 0.12 + ((x * 7) % 10) / 60, ph: x * 0.01, pulse: 0.06 });
  });
  const moonH = new Sprite(P.moon[0]);
  moonH.anchor.set(0.5);
  moonH.position.set(...MOON);
  const moonC = new Sprite(P.moon[1]);
  moonC.anchor.set(0.5);
  moonC.position.set(...MOON);
  skyN.addChild(moonH, moonC);
  turning.push({ sp: moonH, w: -0.06, ph: 0, pulse: 0.025 });
  const skyPlane = ctx.plane(skyN, { z: 1800 });
  // ---- the village on the far hill
  const vil = new Container();
  vil.addChild(Object.assign(new Sprite(P.village[0]), { x: -500, y: HORIZON - 140 }));
  vil.addChild(Object.assign(new Sprite(P.village[1]), { x: 40, y: HORIZON - 116 }));
  ctx.plane(vil, { z: 1400, bake: 'static' });
  // ---- the sea + the moon's reflection
  const seaN = new Container();
  seaN.addChild(Object.assign(new Sprite(P.sea[0]), { x: -700, y: HORIZON }));
  const refl = new Sprite(P.sea[1]);
  refl.anchor.set(0.5, 0);
  refl.position.set(1900, HORIZON + 4);
  refl.blendMode = 'add';
  seaN.addChild(refl);
  ctx.plane(seaN, { z: 1250 });
  // ---- the island
  const isl = new Container();
  isl.addChild(Object.assign(new Sprite(P.isl[0]), { x: -500, y: 660 }));
  const dock = new Sprite(P.props[0]);
  dock.position.set(DOCK.x0, DOCK.y - 40);
  const rockA = new Sprite(P.props[1]);
  rockA.anchor.set(0.5, 1);
  rockA.position.set(200, ground(200) + 20);
  const rockB = new Sprite(P.props[1]);
  rockB.anchor.set(0.5, 1);
  rockB.position.set(660, ground(660) + 26);
  rockB.scale.set(0.8);
  const tower = new Sprite(P.tower[0]);
  tower.anchor.set(0.5, 1);
  tower.position.set(LIGHT.x, LIGHT.base);
  tower.scale.set(TS);
  const lamp = new Sprite(P.tower[1]);
  lamp.anchor.set(0.5);
  lamp.position.set(...LAMP);
  lamp.blendMode = 'add';
  lamp.scale.set(1.4);
  const beam = new Sprite(P.tower[2]);
  beam.anchor.set(0, 0.5);
  beam.position.set(...LAMP);
  beam.blendMode = 'add';
  const blanket = new Sprite(P.props[2]);
  blanket.anchor.set(0.5, 0.5);
  blanket.position.set(...BLANKET);
  // a little sun drawn in the sand (Canelo's «for tomorrow»), painted as it's drawn
  const sun = new Graphics();
  // the lantern room and the cap on top of the painted tower (strokes would be too thin up there: flat shapes)
  const room = new Graphics();
  const ty0 = LIGHT.top;
  room.rect(LIGHT.x - 62, ty0 - 8, 124, 14).fill(0x1a2240);
  room.rect(LIGHT.x - 40, ty0 - 58, 80, 50).fill({ color: 0xfff0b0, alpha: 0.9 }).stroke({ width: 6, color: 0x1a2240 });
  room.poly([LIGHT.x - 52, ty0 - 58, LIGHT.x + 52, ty0 - 58, LIGHT.x, ty0 - 104]).fill(0x1a2240);
  room.rect(LIGHT.x + 40, ty0 + 34, 90, 8).fill(0x1a2240);
  isl.addChild(dock, rockA, rockB, tower, room, beam, lamp, blanket, sun);
  // the bonfire
  const fireS = new Sprite(P.fire[0]);
  fireS.anchor.set(0.5, 1);
  fireS.position.set(FIRE[0], FIRE[1] - 4);
  const FS = 0.58;
  const fireGlow = new Sprite(kitTex(ctx, 'glow'));
  fireGlow.anchor.set(0.5);
  fireGlow.blendMode = 'add';
  fireGlow.tint = 0xffa040;
  fireGlow.position.set(FIRE[0], FIRE[1] - 70);
  const logs = new Graphics();
  for (let i = 0; i < 4; i++) logs.roundRect(FIRE[0] - 70 + i * 22, FIRE[1] - 14 - (i % 2) * 6, 70, 16, 8).fill(0x4a2a14).stroke({ width: 3, color: 0x2a1408 });
  isl.addChild(fireGlow, logs, fireS);
  // the cats
  const [slotA, slotB] = islandSlots();
  const mk = (slug: string, size: number): Cat => {
    const a = ctx.actor(slug, size);
    const sh = new Sprite(P.props[3]);
    sh.anchor.set(0.5);
    sh.alpha = 0.55;
    sh.scale.set(size / 300, 0.6);
    return { a, sh };
  };
  const can = mk(ctx.canelo, 230);
  const hip = mk(SLUG.hipo, 230);
  const cro = mk(SLUG.cronos, 250);
  const man = mk(SLUG.maneki, 210);
  const gra = mk(SLUG.grafitera, 215);
  const noc = mk(SLUG.noctis, 210);
  const sA = mk(slotA, 205);
  const sB = mk(slotB, 205);
  // NADIE — stand-in painting (nadie_static_cat is not used): ecomudo_static_cat, on the far-left rock
  const nad = mk(NADIE, 200);
  const cer = new StaticKitten(ctx, 120);
  const luz: LuzRig = luzOf(ctx, 240);
  const cats = [nad, cro, sA, sB, can, gra, noc, man, hip];
  for (const c of cats) if (c.sh) isl.addChild(c.sh);
    for (const c of cats) if (c.a) isl.addChild(c.a);
  isl.addChild(cer);
  const fl = new Graphics();
  isl.addChild(fl);
  // the swirl of light she lays on the sand for Cerito (a ring of strokes) and her beam
  const ring = new Sprite(P.moon[0]);
  ring.anchor.set(0.5);
  ring.scale.set(0.9, 0.32);
  ring.tint = 0x9fd8ff;
  ring.blendMode = 'add';
  const notes = new Graphics();
  const art = new Graphics();
  const fish = new Graphics();
  const brush = new Graphics();
  const snore = new Graphics();
  const flies = new Graphics();
  isl.addChild(ring);
  if (luz.actor) isl.addChild(luz.actor);
  const lbeam = new Graphics();
  lbeam.blendMode = 'add';
  isl.addChild(art, lbeam, fish, brush, notes, snore, flies);
  ctx.plane(isl, { z: 1000 });
  // ---- the cypress in front
  // the cypress (Canelo's palm) in front: only in the wide frames — in a close one it would cover the cats
  let cypPlane: ReturnType<SceneCtx['plane']> | null = null;
  if (o.cypress !== false) {
    const cyp = new Container();
    cyp.addChild(Object.assign(new Sprite(P.cyp[0]), { x: -40, y: -380 }));
    cypPlane = ctx.plane(cyp, { z: 640, bake: 'static' });
  }
  // ---- the varnish / craquelure at the end (screen plane)
  const crack = new TilingSprite({ texture: cracks(ctx), width: 1920, height: 1080 });
  crack.alpha = 0;
  const cm = new Graphics();
  crack.mask = cm;
  const varnish = new Sprite(kitTex(ctx, 'glow'));
  varnish.anchor.set(0.5);
  varnish.blendMode = 'add';
  varnish.alpha = 0;
  const cc = new Container();
  cc.addChild(crack, cm, varnish);
  ctx.plane(cc, { z: 0, screen: true });

  // the conditional pose helper: a cat at (x on the ground), its shadow away from the fire, sleeping or not
  const put = (c: Cat, m: number, x: number, o: { y?: number; flip?: boolean; sleep?: boolean; rot?: number; sx?: number; sy?: number } = {}) => {
    const y = o.y ?? ground(x) + 4;
    c.a?.pose(m, x, y, { flip: o.flip, rot: o.rot, sx: o.sx, sy: o.sy });
    if (c.a?.puppet) c.a.puppet.sleeping = !!o.sleep;
    if (c.sh) {
      const away = Math.sign(x - FIRE[0]) || 1;
      c.sh.position.set(x + away * 30, y + 2);
      c.sh.skew.x = away * 0.5;
    }
  };
  return {
    skyPlane,
    anchor(name, f) {
      if (name === 'subtitle') return [960, 1000];
      return null;
    },
    update(m, f) {
      if (cypPlane && f.cam.state.fov > 1.3) cypPlane.holder.visible = false;
      const boil = f.boil;
      sky.texture = P.sky[boil % P.sky.length];
      const sp = rm ? 0.5 : 1;
      // «mira las estrellas» (c89–97): the swirl brightens (with the tap, more)
      const j = ctx.k.judged('estrellas');
      const look = m > B(89) && m < B(98) ? sm(seg(m, B(89), B(90))) * (1 - sm(seg(m, B(96), B(98)))) : 0;
      const bright = look * (j && j.r !== 'miss' ? 1 : 0.55);
      for (const t of turning) {
        t.sp.rotation = t.ph + m * t.w * sp;
        if (t.pulse) t.sp.scale.set(1 + Math.sin(m * 1.7 + t.ph * 3) * t.pulse * (rm ? 0.3 : 1) + bright * 0.12);
      }
      // the cronos fill (c65–73): the sky turns a little faster and calms
      const rush = m > B(65) && m < B(73) ? Math.sin(seg(m, B(65), B(73)) * Math.PI) : 0;
      for (let i = 0; i < 3; i++) turning[i].sp.rotation += rush * 0.4 * turning[i].w * 10 * sp;
      for (let i = 0; i < 3; i++) turning[i].sp.alpha = 0.78 + bright * 0.22;
      refl.alpha = 0.75 + 0.25 * Math.sin(m * 2.3);
      // the beam: one more swirl, turning slowly (its length breathes as it comes toward us)
      const ph = m * 0.32 * sp;
      beam.rotation = Math.PI * 0.92 + Math.sin(ph) * 0.55;
      beam.scale.set(0.45 + 0.55 * Math.abs(Math.cos(ph * 0.5)), 1);
      beam.alpha = 0.32 + 0.14 * Math.abs(Math.cos(ph * 0.5));
      lamp.scale.set(1 + Math.sin(m * 3.1) * 0.06);
      // the fire: the painted flames boil on 8 fps, and from c65 it crackles in the fill
      fireS.texture = P.fire[boil % P.fire.length];
      const crackle = m > B(65) && m < B(73) ? 0.08 * Math.abs(Math.sin(m * 9)) : 0;
      const fk = (ctx.rf ? 0.25 : 1) * 0.06;
      fireS.scale.set(FS * (1 + Math.sin(m * 7) * fk + crackle), FS * (1 + Math.sin(m * 5.3) * fk * 1.4 + crackle));
      fireGlow.scale.set(2.2 + Math.sin(m * 6) * 0.15 * (ctx.rf ? 0.25 : 1));
      fireGlow.alpha = 0.55 + crackle;

      // ---- THE CHOREOGRAPHY (song time) ----
      // Luzterna: the balcony (c1–33) → floats down to the sand with Cerito (c33–41) → by the fire (c41–57) → the step
      const bobY = (rm ? 4 : 10) * Math.sin(m * 1.7);
      let lx: number;
      let ly: number;
      let lflip = true;
      if (m < B(33)) {
        lx = BALCONY[0];
        ly = BALCONY[1] + 150 + bobY;
      } else if (m < B(35)) {
        const k = sm(seg(m, B(33), B(35)));
        lx = BALCONY[0] + (1170 - BALCONY[0]) * k;
        ly = BALCONY[1] + 150 + (ground(1170) - 30 - BALCONY[1] - 150) * k + bobY;
      } else if (m < B(41)) {
        lx = 1170;
        ly = ground(1170) - 30 + bobY;
      } else if (m < B(57)) {
        lx = 1330;
        ly = ground(1330) - 34 + bobY;
      } else {
        lx = STEP[0];
        ly = STEP[1] - 10 + bobY;
        lflip = true;
      }
      luz.actor?.pose(m, lx, ly, { flip: lflip });
      if (luz.actor?.puppet) {
        luz.actor.puppet.crouch = m < B(33) || m > B(57) ? 0.55 : 0.1;
        // N25 · she looks at him; N28 · up at the stars, then down at her crew; N30 · she watches over them
        luz.actor.puppet.look = m > B(89) && m < B(93) ? -0.6 : m > B(73) ? 0.5 : 0.2;
      }
      // Canelo: arrives eating a fish (c17), shares it (c41–45), hides the rest under the blanket and draws a sun
      // (c49–53), leans on the palm (c53), scratches the base of his tail (c61), falls asleep IN HER BEAM (c73)
      const cx = m < B(17) ? -200 : m < B(19) ? -200 + sm(seg(m, B(17), B(19))) * 1280 : m < B(49) ? 1080 : m < B(53) ? 1080 + sm(seg(m, B(49), B(50))) * 70 : 1150 - sm(seg(m, B(53), B(54))) * 20;
      const asleep = m > B(74);
      const waddle = m >= B(17) && m < B(19);
      put(can, m, cx, { flip: m < B(49) ? false : m < B(53) ? false : true, sleep: asleep, rot: waddle ? Math.sin(m * 9) * 0.06 * (rm ? 0.3 : 1) : m > B(54) && m < B(73) ? -0.08 : 0 });
      if (can.a?.puppet) can.a.puppet.walk = waddle || (m > B(49) && m < B(50)) ? 1 : 0;
      // the tap «toca a Canelo» (c77–81): he turns over in his sleep and settles better (default: he turns at c79)
      const jc = ctx.k.judged('canelo');
      const turnAt = jc && jc.r !== 'miss' ? jc.at : B(79.5);
      if (can.a && asleep) can.a.scale.x = Math.abs(can.a.scale.x) * (m > turnAt ? -1 : 1);
      if (can.a && m > B(61) && m < B(61) + 0.1) can.a.emote('sleepy');
      // his flame: 60 % (Act IV); chica when tired; drops BY ITSELF while he sleeps (c73–77, v2-i) and comes back halfway
      let fk2: number = FLAME.act4;
      if (m > B(61) && m < B(65)) fk2 = FLAME.chica;
      if (m > B(73)) {
        const x = seg(m, B(74.5), B(77));
        fk2 = x <= 0 ? FLAME.chica : x < 0.55 ? FLAME.chica + (FLAME.baja - FLAME.chica) * Math.sin((x / 0.55) * Math.PI * 0.5) : FLAME.baja + ((FLAME.chica + FLAME.baja) / 2 - FLAME.baja) * sm((x - 0.55) / 0.45);
      }
      fl.clear();
      if (cx > -100) caneloFlame(fl, can.a, fk2, m, rm);
      // the fish: in his paw until he shares it; the pieces; what's left goes under the blanket (c49)
      const fg = fish.clear();
      if (can.a && m >= B(17) && m < B(49.6)) {
        const [hx, hy] = can.a.head();
        const fx = can.a.x + hx * Math.sign(can.a.scale.x) + 40;
        const fy = can.a.y + hy + 60;
        fishShape(fg, fx, fy, m < B(41) ? 1 : 0.6);
      }
      if (m >= B(41.5) && m < B(57)) fishShape(fg, BLANKET[0] - 50, BLANKET[1] - 14, 0.35);
      // the other piece: to her (c42.5) — she can't eat it: she SMELLS it with her eyes closed (H72's sweet bread)
      // and hands it back (c44.3)
      if (m > B(42.5) && m < B(45) && can.a && luz.actor) {
        const go = sm(seg(m, B(42.5), B(43.2)));
        const back = sm(seg(m, B(44.2), B(44.9)));
        const [hx, hy] = luz.actor.head();
        const tx = luz.actor.x - hx * 0.5 - 40;
        const ty = luz.actor.y + hy + 40;
        const fx0 = can.a.x + 60;
        const fy0 = can.a.y - 110;
        const k = go * (1 - back);
        fishShape(fg, fx0 + (tx - fx0) * k, fy0 + (ty - fy0) * k - Math.sin(k * Math.PI) * 30, 0.4);
      }
      if (luz.actor && m > B(43.2) && m < B(43.3)) luz.actor.emote('happy');
      // the sun in the sand, drawn with the claw (c49.5–51) next to the blanket: «para mañana»
      const sg = sun.clear();
      const sk = seg(m, B(50), B(51.5));
      if (sk > 0) {
        const sx = BLANKET[0] - 96;
        const sy = BLANKET[1] + 14;
        const n = Math.floor(sk * 9);
        sg.circle(sx, sy, 16).stroke({ width: 5, color: 0xf4c430, alpha: Math.min(1, sk * 3) });
        for (let i = 0; i < n; i++) {
          const a = (i / 8) * Math.PI * 2;
          sg.moveTo(sx + Math.cos(a) * 22, sy + Math.sin(a) * 9).lineTo(sx + Math.cos(a) * 38, sy + Math.sin(a) * 15).stroke({ width: 4, color: 0xf4c430 });
        }
      }
      // Cerito: chases the beam's swirl on the sand (c19–33), comes into her light (c33–41), sleeps in it (c39 →)
      const jt = ctx.k.judged('cerito');
      const sleepAt = jt && jt.r !== 'miss' ? Math.min(B(40), jt.at + 0.6) : B(39.5);
      let ex: number;
      let ey: number;
      if (m < B(19)) {
        ex = -200;
        ey = 900;
      } else if (m < B(33)) {
        const t = m - B(19);
        ex = 1000 + Math.sin(t * 1.3) * 260;
        ey = ground(ex) + 2 - Math.abs(Math.sin(t * 5)) * 18 * (rm ? 0.3 : 1);
      } else if (m < sleepAt) {
        // in, out, in again (the tap gives him the last step sooner)
        const t = seg(m, B(33.5), sleepAt);
        ex = BLANKET[0] - (1 - Math.abs(Math.cos(t * Math.PI * 2.5))) * 120 * (1 - t);
        ey = ground(ex) + 2;
      } else {
        ex = BLANKET[0];
        ey = BLANKET[1] + 4;
      }
      cer.position.set(ex, ey);
      const calm = sm(seg(m, sleepAt, sleepAt + 2.5));
      cer.update(m, { stare: m > sleepAt ? 0.15 : 0.7, clear: 0.35 * calm });
      cer.scale.set(ex < 1060 && m < B(33) ? -1 : 1, m > sleepAt ? 0.8 : 1);
      // the swirl of light she leaves on the sand (c34–41), then it stays under Cerito (in the beam, not on her)
      const rk = m > B(34) ? sm(seg(m, B(34), B(35))) : 0;
      ring.visible = rk > 0;
      ring.position.set(BLANKET[0], BLANKET[1] + 2);
      ring.alpha = rk * (m > B(73) ? 0.55 : 0.7);
      ring.rotation = m * 0.3 * sp;
      // her beam: on Cerito (c35 →); from the step across the sand to where Canelo sleeps (c73 →)
      const lb = lbeam.clear();
      const [qx, qy] = lanternAt(luz);
      if (m > B(34.5)) {
        const tx = m > B(73) ? 1140 : m > B(41) && m < B(57) ? BLANKET[0] : ring.x;
        const ty = m > B(73) ? ground(1140) - 30 : ring.y;
        const w = 46;
        lb.poly([qx, qy - 6, qx, qy + 6, tx + w, ty, tx - w, ty]).fill({ color: 0xffe9a8, alpha: 0.16 });
        lb.poly([qx, qy - 3, qx, qy + 3, tx + w * 0.4, ty, tx - w * 0.4, ty]).fill({ color: 0xfff6d0, alpha: 0.18 });
      }
      // Cronos by the fire from c41 (his line at c57); Hipólito on the dock railing (c29 →), then by the fire (c45–49)
      put(cro, m, 800, { flip: false });
      if (cro.a) cro.a.visible = m > B(40);
      if (cro.sh) cro.sh.visible = m > B(40);
      const hipDance = m > B(45) && m < B(49);
      const hipLate = m >= B(49);
      put(hip, m, hipDance ? 1000 + Math.sin(m * 3) * 120 : hipLate ? 1520 : 2150, { y: hipDance || hipLate ? undefined : DOCK.y - 4, sleep: (!hipDance && m > B(28) && !hipLate) || m > B(81), flip: hipDance ? Math.cos(m * 3) > 0 : true, rot: hipDance ? Math.sin(m * 6) * 0.08 : hipLate ? 0 : 0.12 });
      // Maneki sweeps the stars' reflection off the dock (c25 →), claps (c45–49); asleep hugging the broom (c87 →)
      const manX = 1920 + Math.sin(m * 2.2) * 50;
      put(man, m, m > B(41) && m < B(57) ? 700 : manX, { y: m > B(41) && m < B(57) ? undefined : DOCK.y - 4, flip: true, sleep: m > B(87), rot: m < B(41) ? Math.sin(m * 6.6) * 0.06 : 0 });
      const bg = brush.clear();
      if (man.a && (m < B(41) || m > B(57)) && m > B(24)) {
        const bxp = man.a.x - 60 + Math.sin(m * 6.6) * 40;
        bg.moveTo(man.a.x - 10, man.a.y - 110).lineTo(bxp, man.a.y).stroke({ width: 6, color: 0x8a6a3a });
        bg.poly([bxp - 24, man.a.y + 2, bxp + 24, man.a.y + 2, bxp + 14, man.a.y - 26, bxp - 14, man.a.y - 26]).fill(0xd8b85a).stroke({ width: 3, color: 0x6a4a2a });
        // the swept starlight (little yellow dabs flying off the planks)
        if (m < B(41)) for (let i = 0; i < 6; i++) {
          const t = (m * 1.2 + i / 6) % 1;
          bg.circle(bxp - 30 - t * 120, man.a.y - t * 40, 5 * (1 - t)).fill({ color: VG.lemon, alpha: 1 - t });
        }
      }
      // Grafitera paints a swirl on the rock (c27 →), then paints Canelo (c45–49); asleep (c85 →)
      put(gra, m, m > B(45) && m < B(49) ? 940 : 600, { flip: false, sleep: m > B(85) });
      // her swirl on the rock: the same swirl as the sky, painted stroke by stroke (c27–29), and it stays
      const ag = art.clear();
      const ak = seg(m, B(27), B(29));
      if (ak > 0) {
        const n = Math.floor(ak * 26);
        const ox = 660;
        const oy = ground(660) - 62;
        for (let i = 1; i < n; i++) {
          const a0 = (i - 1) * 0.55;
          const a1 = i * 0.55;
          const r0 = 4 + (i - 1) * 2.2;
          const r1 = 4 + i * 2.2;
          ag.moveTo(ox + Math.cos(a0) * r0, oy + Math.sin(a0) * r0 * 0.7).lineTo(ox + Math.cos(a1) * r1, oy + Math.sin(a1) * r1 * 0.7).stroke({ width: 6, color: i % 3 ? VG.chrome : VG.lemon, cap: 'round' });
        }
      }
      // Noctis licks a paw (c23 →), asleep (c95 →)
      put(noc, m, 1580, { flip: true, sleep: m > B(95), rot: m > B(23) && m < B(95) ? Math.sin(m * 4) * 0.04 : 0 });
      // the two slots (Homiau → Borrón, a donut; or two of your cats): c31 →; asleep (c83 →)
      // (N4) the first ones walk to the fire while she watches from the balcony (c13–17)
      const walkIn = sm(seg(m, B(13), B(17)));
      put(sA, m, -150 + walkIn * 650, { sleep: m > B(83) });
      put(sB, m, -260 + walkIn * 640, { flip: m > B(17), sleep: m > B(84) });
      for (const c of [sA, sB]) if (c.a?.puppet) c.a.puppet.walk = m > B(13) && m < B(17) ? 1 : 0;
      for (const c of [sA, sB]) if (c.a) c.a.visible = m > B(12.5);
      for (const c of [gra, noc]) if (c.a) c.a.visible = m > B(20);
      // the donut Homiau passes to Borrón (or one of your cats to the other) at c31
      const dn = fish;
      if (m > B(31) && m < B(33)) {
        const k = sm(seg(m, B(31.3), B(32.3)));
        const dx = 500 + (380 - 500) * k;
        const dy = ground(dx) - 120 - Math.sin(k * Math.PI) * 30;
        dn.circle(dx, dy, 18).fill(0xf0b45e).stroke({ width: 3, color: 0x6a3a1a }).circle(dx, dy, 13).fill(0xff7fb0).circle(dx, dy, 5).fill(0x6a3a1a);
      }
      // Nadie on the rock, still, looking at the stars (c21 →); asleep (c93)
      put(nad, m, 200, { y: ground(200) - 104, flip: true, sleep: m > B(93) });
      if (nad.a) nad.a.visible = m > B(20);
      if (nad.sh) nad.sh.visible = false;
      if (nad.a?.puppet && m < B(93)) nad.a.puppet.look = -0.8;
      // she hums (c79–81): painted notes rising from her mouth become stars
      const ng = notes.clear();
      if (m > B(78.5) && m < B(81.5) && luz.actor) {
        const [hx, hy] = luz.actor.head();
        for (let i = 0; i < 5; i++) {
          const t = ((m - B(78.5)) * 0.5 + i / 5) % 1;
          const x = luz.actor.x - hx + Math.sin(t * 6 + i) * 20;
          const y = luz.actor.y + hy - 40 - t * 260;
          if (t < 0.6) ng.circle(x, y, 7).fill({ color: VG.lemon, alpha: 1 - t }).rect(x + 5, y - 22, 3, 22).fill({ color: VG.lemon, alpha: 1 - t });
          else ng.star(x, y, 4, 9, 4).fill({ color: 0xfffbe6, alpha: (1 - t) * 2 });
        }
      }
      // Hipólito's snore bubble (a tiny swirl) at c89–97
      const sn = snore.clear();
      if (m > B(89) && hip.a) {
        const s = 10 + ((m * 0.8) % 1) * 22;
        sn.circle(hip.a.x - 70, hip.a.y - 220, s).stroke({ width: 3, color: 0xdfe9f2, alpha: 0.8 }).circle(hip.a.x - 70 + s * 0.3, hip.a.y - 220, s * 0.5).stroke({ width: 2, color: 0xdfe9f2, alpha: 0.6 });
      }
      // fireflies: points of yellow (c81 →)
      const ff = flies.clear();
      if (m > B(81)) for (let i = 0; i < 24; i++) {
        const t = m * 0.2 + rnd(i) * 10;
        const x = 300 + rnd(i * 3) * 1700 + Math.sin(t * 1.3 + i) * 40;
        const y = 640 + rnd(i * 5) * 260 + Math.cos(t + i) * 30;
        const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
        ff.circle(x, y, 4).fill({ color: VG.lemon, alpha: a * sm(seg(m, B(81), B(82))) });
      }
      // ---- the end (c113 →): the painting becomes a real canvas — craquelure from the corners, varnish — and fades
      const ck = sm(seg(m, B(113), B(115)));
      crack.alpha = ck * 0.55;
      const cg = cm.clear();
      if (ck > 0) {
        const r = ck * 1300;
        for (const [x, y] of [
          [0, 0],
          [1920, 0],
          [0, 1080],
          [1920, 1080],
        ])
          cg.circle(x, y, r);
        cg.fill(0xffffff);
      }
      varnish.alpha = ck * 0.18;
      varnish.position.set(560 + ck * 500, 300);
      varnish.scale.set(9, 4);
    },
  };
}

/** a fish in a paw (or on the sand), size k */
function fishShape(g: Graphics, x: number, y: number, k: number) {
  const s = 46 * k;
  g.ellipse(x, y, s, s * 0.42).fill(0x9fb8d8).stroke({ width: 3, color: 0x2a3a5a });
  g.poly([x + s * 0.9, y, x + s * 1.5, y - s * 0.4, x + s * 1.5, y + s * 0.4]).fill(0x9fb8d8).stroke({ width: 3, color: 0x2a3a5a });
  g.circle(x - s * 0.55, y - s * 0.08, s * 0.08).fill(0x1a2a4a);
}

/** the craquelure of an old canvas (a voronoi crack network), baked once */
function cracks(ctx: SceneCtx): Texture {
  const t = cached(ctx, 'cracks', () => [
    ctx.baker.shade(
      'vg-cracks',
      512,
      512,
      `${BAKE_UV}
void main() {
  vec2 uv = bakeUV() * 9.0;
  vec2 i = floor(uv); vec2 f = fract(uv);
  float d1 = 9.0; float d2 = 9.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = hash22(mod(i + g, 9.0));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  float line = 1.0 - smoothstep(0.0, 0.05, d2 - d1);
  finalColor = vec4(vec3(0.12, 0.09, 0.05) * line, line * 0.9);
}`,
      {},
      {},
      { res: 1 },
    ),
  ]);
  return t[0];
}
void mixHex;
