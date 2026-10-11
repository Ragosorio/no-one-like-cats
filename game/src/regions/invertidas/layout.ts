/**
 * Islas Invertidas — the shape of the main island and where everything floats (pure, deterministic).
 *
 * Units: 1 ≈ one cat-length. The heightfield is the TOP of the main floating island; everything under
 * CUT is not drawn (the region hangs its own upside-down mountain there). +x east, +z south (camera).
 *
 *        G2 islet (inverted)            ↑ the river climbs into the sky (up-fall, NE rim)
 *          ·  [G2 stone]          ~~~~/
 *   G1 islet · [G1]   pond ~~~ river
 *      (inv)     arena (ring of hanging columns)      [G3] · G3 islet (inverted, Lunita under it)
 *                    meadow
 *                  arrival ── pier ── aerial ship (S)
 */
import * as THREE from 'three';
import { clamp, fbm, lerp, smoothstep } from '../../engine/core/noise';

export const HALF = 64;
export const R = 33;
/** the ground under this world y is not drawn */
export const CUT = 0.7;
/** the sea of clouds and the Primer Mar far below it */
export const SEA_Y = -46;

export const POND = { x: -7, z: -3, r: 4.6, floor: 1.55, surface: 2.15 };
/** the river: pond → north-east rim, where it falls UP */
export const RIVER: [number, number][] = [
  [-4.5, -6.5],
  [1, -11],
  [7, -15.5],
  [12.5, -21],
  [17, -26.5],
  [20.5, -31.5],
];
export const RIVER_W = 2.1;
/** where the river leaves the island (the up-fall's lip) */
export const MOUTH = { x: 20.2, z: -30.6, y: 1.55 };
export const ARRIVAL: [number, number, number] = [-1.5, 0, 22];
/** the pier: from inside the island out over the void, toward the south-east */
export const PIER = { x: 13.5, z: 22.5, ang: 1.0, len: 15, y: 2.75 };
const PD = [Math.cos(PIER.ang), Math.sin(PIER.ang)];
export const SHIP = { x: PIER.x + PD[0] * 11 + PD[1] * 4.8, y: 3.6, z: PIER.z + PD[1] * 11 - PD[0] * 4.8, ry: Math.atan2(-PD[0], -PD[1]) };
/** the arena: a ring of columns hanging from floating lintels (the story battle's marker floats here) */
export const ARENA = { x: -15, z: 7.5, r: 6.2 };
/** three gravity stones on the island, each tied to an inverted islet out in the air */
export const STONES: { x: number; z: number; islet: [number, number, number]; r: number; seed: number }[] = [
  { x: -27, z: -6, islet: [-48, 9, -10], r: 5.6, seed: 3 },
  { x: -10, z: -24, islet: [-22, 14, -49], r: 6.4, seed: 7 },
  { x: 25.5, z: 9, islet: [47, 6.5, 14], r: 5.2, seed: 11 },
];
/** Globito's rock (he floats tied to it) */
export const ANCHOR = { x: 2.5, z: 6.5 };
/** REGISTRO 000's perch: the up-pointing tip of a far inverted islet (NW) */
export const PERCH = { x: -64, z: -58, y: 20, r: 7 };

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const L = dx * dx + dz * dz || 1;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
export function riverDist(x: number, z: number) {
  let d = Math.hypot(x - POND.x, z - POND.z) - POND.r;
  for (let i = 0; i < RIVER.length - 1; i++) d = Math.min(d, segDist(x, z, ...RIVER[i], ...RIVER[i + 1]));
  return d;
}
/** 0 at the river's start → 1 at the mouth (for the water's flow) */
export function riverT(x: number, z: number) {
  let best = Infinity;
  let bt = 0;
  let acc = 0;
  const lens = RIVER.slice(1).map((p, i) => Math.hypot(p[0] - RIVER[i][0], p[1] - RIVER[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az] = RIVER[i];
    const [bx, bz] = RIVER[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const L2 = dx * dx + dz * dz || 1;
    const k = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1);
    const d = Math.hypot(x - (ax + dx * k), z - (az + dz * k));
    if (d < best) {
      best = d;
      bt = (acc + lens[i] * k) / total;
    }
    acc += lens[i];
  }
  return bt;
}

function pathDist(x: number, z: number) {
  return Math.min(segDist(x, z, ARRIVAL[0], ARRIVAL[2], ARENA.x, ARENA.z), segDist(x, z, ARRIVAL[0], ARRIVAL[2], 0, -2), segDist(x, z, 0, -2, STONES[1].x, STONES[1].z), segDist(x, z, ARRIVAL[0], ARRIVAL[2], STONES[2].x, STONES[2].z), segDist(x, z, ARRIVAL[0], ARRIVAL[2], PIER.x, PIER.z));
}
/** on a worn path (no grass grows there) */
export function onPath(x: number, z: number) {
  return pathDist(x, z) < 1.4;
}

/** 0 inland → 1 at the rim (the warped island radius) */
export function coastR(x: number, z: number) {
  const a = Math.atan2(z, x);
  const warp = 1 + 0.13 * Math.sin(a * 3 + 2.2) + 0.07 * Math.sin(a * 5 - 0.7) + 0.09 * fbm(x * 0.03, z * 0.03, 3, 61);
  return Math.hypot(x, z) / (R * warp);
}

const flatten = (h: number, to: number, d: number, r0: number, r1: number) => lerp(h, to, 1 - smoothstep(r0, r1, d));

export function height(x: number, z: number) {
  const r = coastR(x, z);
  if (r > 1.0) return -60;
  const m = 1 - smoothstep(0.93, 1.0, r);
  let h = 2.6 + 1.1 * fbm(x * 0.05, z * 0.05, 4, 67);
  // a lilac knoll in the west (the arena sits on its shoulder) and a soft rise in the north
  h += 3.2 * Math.exp(-((x + 21) ** 2 + (z - 2) ** 2) / 90);
  h += 1.6 * Math.exp(-((x - 3) ** 2 + (z + 22) ** 2) / 70);
  // the pond and the river bed (the river runs downhill to the lip… then keeps going, up)
  const rd = riverDist(x, z);
  const bed = lerp(POND.floor, MOUTH.y - 0.4, riverT(x, z));
  h = lerp(h, Math.min(h, bed), 1 - smoothstep(0.2, 2.2, rd));
  const pd = Math.hypot(x - POND.x, z - POND.z);
  h = lerp(h, POND.floor, 1 - smoothstep(POND.r * 0.55, POND.r * 1.05, pd));
  // flat pads: the arrival meadow, the arena, the stones
  h = flatten(h, 2.7, Math.hypot(x - ARRIVAL[0], z - ARRIVAL[2]), 4, 8);
  h = flatten(h, 4.1, Math.hypot(x - ARENA.x, z - ARENA.z), ARENA.r + 0.5, ARENA.r + 4);
  for (const s of STONES) h = flatten(h, height0(s.x, s.z), Math.hypot(x - s.x, z - s.z), 1.6, 3.4);
  // the rim: a short, steep soil cliff that the underside continues
  return lerp(CUT - 2.6, h, smoothstep(0.0, 0.4, m));
}
/** the gently rolling ground without carving (stone pads keep their own height) */
function height0(x: number, z: number) {
  return 2.6 + 1.1 * fbm(x * 0.05, z * 0.05, 4, 67) + 3.2 * Math.exp(-((x + 21) ** 2 + (z - 2) ** 2) / 90);
}

export function walkable(x: number, z: number) {
  if (coastR(x, z) > 0.9) return false;
  const h = height(x, z);
  if (h < 1.0) return false;
  if (riverDist(x, z) < 1.1) return false;
  if (Math.hypot(x - ARENA.x, z - ARENA.z) < 1.3) return false;
  for (const s of STONES) if (Math.hypot(x - s.x, z - s.z) < 1.5) return false;
  if (Math.hypot(x - ANCHOR.x, z - ANCHOR.z) < 1.1) return false;
  const e = 0.6;
  const sl = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
  return sl < 1.0;
}

/** sRGB components 0..1 (painted with setRGB(..., SRGBColorSpace)) */
const hex = (s: string) => {
  const n = parseInt(s.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};
const MINT = hex('#86dcc4');
const MINT2 = hex('#a9ead2');
const LILAC = hex('#b9a6ec');
const LILAC2 = hex('#cdbcf4');
const SOIL = hex('#6e5486');
const ROCK = hex('#8a76bc');
const BED = hex('#c9e8f0');
const PATH = hex('#efe4d2');

/** mint meadows with lilac drifts, violet cliffs, a pale river bed (vertex colors under the toon ramp) */
export function paint(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  const n = fbm(x * 0.09, z * 0.09, 3, 71);
  const mix3 = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  let c = mix3(MINT, MINT2, smoothstep(-0.3, 0.4, n));
  // lilac drifts (the island's «snow»: petals of the hanging trees, blown up and settled)
  c = mix3(c, mix3(LILAC, LILAC2, n * 0.5 + 0.5), smoothstep(0.26, 0.34, fbm(x * 0.045 + 3, z * 0.045, 3, 9)) * 0.85);
  // a worn path: arrival → arena and → the stones
  c = mix3(c, PATH, (1 - smoothstep(0.7, 1.2, pathDist(x, z) + n * 0.4)) * 0.75);
  if (riverDist(x, z) < 1.6) c = mix3(c, BED, 1 - smoothstep(0.6, 1.6, riverDist(x, z)));
  if (slope > 0.8) c = mix3(c, ROCK, smoothstep(0.8, 1.4, slope));
  if (h < 1.0) c = mix3(c, SOIL, smoothstep(1.0, -0.5, h));
  out.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
}
