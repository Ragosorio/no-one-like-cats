/**
 * Isla Nácar — the shape of the island and where everything stands (pure, deterministic: the engine
 * samples `height`, the beam puzzle marches over it, tests can call it too).
 *
 * Units: 1 ≈ one cat-length. Sea level y = 0. +x east, +z south (toward the default camera).
 *
 *            N (−z)
 *        ░░▲▲▲▲░░        the crystal mountain (crown of giant crystals)
 *        ░ [door] ░      «corazón de cristal»: a crystal door in a rock arch, facing south
 *            │
 *     C ─────┼──── B     the beam: prism (east knoll) → A → B → C → door
 *            │     │
 *   pools    │     A ──── PRISM
 *            ·
 *   shells ~ beach ~ ship  (arrival, south)
 */
import * as THREE from 'three';
import { clamp, fbm, lerp, smoothstep } from '../../engine/core/noise';

export const R = 40;
export const HALF = 64;
/** the flat nacre terrace every mirror and the door stand on */
export const TERRACE = 2.0;
/** height of the beam over the terrace (mirror centers) */
export const BEAM_Y = TERRACE + 1.8;

export const MOUNT = { x: -2, z: -24, r: 18, h: 21 };
/** the door's ground point (it faces +z) and its size */
export const DOOR = { x: 0, z: -7, w: 5.0, h: 6.6 };
/** where the cave's tunnel goes (flattened ground under it) */
export const CAVE_DEPTH = 6.5;
export const PRISM = { x: 31, z: 0, knoll: 4.6 };
/** the three mirrors, in beam order */
export const MIRRORS: { x: number; z: number }[] = [
  { x: 20, z: 0 },
  { x: 20, z: 13 },
  { x: 0, z: 13 },
];
/** mirror angle in 45° steps (the mirror line's angle on the XZ plane); 4 states (a mirror is 2-sided) */
export const SOLUTION = [3, 3, 1];
/** scrambled start: 1 + 2 + 2 taps (each tap shows a bit more of the path) */
export const START = [2, 1, 3];
/** a geode outcrop that catches the beam when the first mirror lets it pass straight */
export const GEODE = { x: 9.5, z: 0, r: 2.1 };
export const ARRIVAL: [number, number, number] = [5, 0.8, 29];
export const SHIP = { x: 13, z: 41.5, ry: 0.5 };
/** REGISTRO 000's far crystal spire, out at sea (NW) */
export const SPIRE = { x: -47, z: -33, top: 10.4 };

/** crystal clusters out on the meadow and the beach (two of them throw rainbows) */
export const CLUSTERS: { x: number; z: number; h: number }[] = [
  { x: -15, z: 1, h: 3.6 },
  { x: 27, z: 21, h: 2.8 },
  { x: -24, z: -9, h: 3.2 },
  { x: 9, z: 25, h: 2.4 },
  { x: -6, z: 20, h: 2.0 },
];

/** pearl tide pools on a rock shelf (SW) */
export const SHELF = { x: -23, z: 18, r: 8.5, h: 1.35 };
export const POOLS: { x: number; z: number; r: number }[] = [
  { x: -25.5, z: 15.5, r: 2.3 },
  { x: -20.5, z: 20.5, r: 1.9 },
  { x: -27, z: 21.5, r: 1.6 },
  { x: -19.5, z: 14.5, r: 1.3 },
];
export const POOL_Y = 1.12;

/** giant mother-of-pearl shells on the beaches: kind 0 = open clam (with a pearl), 1 = scallop */
export const SHELLS: { x: number; z: number; s: number; ry: number; kind: 0 | 1 }[] = [
  { x: -11, z: 31, s: 3.4, ry: 0.4, kind: 0 },
  { x: 22, z: 27, s: 2.8, ry: -0.9, kind: 1 },
  { x: -32, z: 4, s: 3.0, ry: 1.9, kind: 1 },
  { x: 31, z: 17, s: 2.5, ry: -1.6, kind: 0 },
  { x: -3, z: 34.5, s: 1.9, ry: 2.6, kind: 1 },
  { x: -30, z: -12, s: 2.2, ry: 1.2, kind: 0 },
];

/** the beam's corridor (flattened so the terrace reads as one level) */
const CORRIDOR: [number, number][] = [
  [MIRRORS[0].x, MIRRORS[0].z],
  [MIRRORS[1].x, MIRRORS[1].z],
  [MIRRORS[2].x, MIRRORS[2].z],
  [DOOR.x, DOOR.z],
];

export { CORRIDOR };
export function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const L = dx * dx + dz * dz || 1;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

function corridorDist(x: number, z: number) {
  let d = Infinity;
  for (let i = 0; i < CORRIDOR.length - 1; i++) d = Math.min(d, segDist(x, z, ...CORRIDOR[i], ...CORRIDOR[i + 1]));
  return d;
}

const flatten = (h: number, to: number, d: number, r0: number, r1: number) => lerp(h, to, 1 - smoothstep(r0, r1, d));

/** 0 inland → 1 at the coast (the warped island radius) */
export function coastR(x: number, z: number) {
  const a = Math.atan2(z, x);
  const warp = 1 + 0.12 * Math.sin(a * 3 + 1.3) + 0.06 * Math.sin(a * 5 - 2.1) + 0.08 * fbm(x * 0.03, z * 0.03, 3, 17);
  return Math.hypot(x, z) / (R * warp);
}

export function height(x: number, z: number) {
  const d = Math.hypot(x, z);
  const r = coastR(x, z);
  const m = 1 - smoothstep(0.62, 1.0, r);
  if (m <= 0) {
    // the spire's rock foot (so the sea floor rises a little under it)
    const sd = Math.hypot(x - SPIRE.x, z - SPIRE.z);
    return -6 - 3 * smoothstep(0, 30, d - R) + 3.5 * Math.exp(-(sd * sd) / 30);
  }
  // meadow inland, a wide pearl beach ring
  const ring = smoothstep(0.6, 0.84, r);
  let h = lerp(1.9 + 1.1 * (fbm(x * 0.055, z * 0.055, 4, 23) - 0.5), 0.75 + 0.3 * fbm(x * 0.12, z * 0.12, 2, 5), ring);
  // the crystal mountain: a steep cone with faceted buttresses
  const mx = x - MOUNT.x;
  const mz = z - MOUNT.z;
  const dm = Math.hypot(mx, mz);
  const am = Math.atan2(mz, mx);
  const butt = 1 + 0.16 * Math.abs(Math.sin(am * 2.5 + 0.6)) + 0.08 * Math.sin(am * 7 + 1.1);
  const t = clamp(1 - dm / (MOUNT.r * butt), 0, 1);
  h += MOUNT.h * Math.pow(t, 1.15) * (0.82 + 0.18 * fbm(x * 0.2, z * 0.2, 2, 31));
  // east knoll under the prism, and a low saddle tying it to the mountain
  const kd = Math.hypot(x - PRISM.x, z - PRISM.z);
  h += PRISM.knoll * Math.exp(-(kd * kd) / 26);
  // rock shelf of the tide pools
  const sd = Math.hypot(x - SHELF.x, z - SHELF.z);
  h = lerp(h, SHELF.h + 0.25 * fbm(x * 0.4, z * 0.4, 2, 9), (1 - smoothstep(SHELF.r * 0.6, SHELF.r, sd)) * 0.9);
  for (const p of POOLS) {
    const pd = Math.hypot(x - p.x, z - p.z);
    h -= 0.6 * (1 - smoothstep(p.r * 0.55, p.r * 1.08, pd));
  }
  // the terrace: the beam's corridor, the plaza before the door and the tunnel floor
  h = flatten(h, TERRACE, corridorDist(x, z), 2.4, 6.0);
  const inCave = Math.max(Math.abs(x - DOOR.x) - DOOR.w * 0.5 - 0.6, DOOR.z - CAVE_DEPTH - 0.5 - z, z - (DOOR.z + 1));
  h = flatten(h, TERRACE, Math.max(0, inCave), 0, 1.6);
  for (const p of MIRRORS) h = flatten(h, TERRACE, Math.hypot(x - p.x, z - p.z), 1.6, 3.2);
  h = flatten(h, PRISM.knoll + 1.6, kd, 1.4, 3.0);
  // coast: ease into the sea over a few units (gentle beaches)
  return lerp(-1.5, h, smoothstep(0.0, 0.45, m));
}

export function walkable(x: number, z: number) {
  const h = height(x, z);
  if (h < 0.45) return false;
  // the door (closed or not) and the tunnel belong to Madre Nácar
  if (Math.abs(x - DOOR.x) < DOOR.w * 0.5 + 1.2 && z < DOOR.z + 1.2 && z > DOOR.z - CAVE_DEPTH - 2) return false;
  for (const p of MIRRORS) if (Math.hypot(x - p.x, z - p.z) < 1.6) return false;
  if (Math.hypot(x - GEODE.x, z - GEODE.z) < GEODE.r + 0.4) return false;
  for (const p of POOLS) if (Math.hypot(x - p.x, z - p.z) < p.r) return false;
  for (const s of SHELLS) if (Math.hypot(x - s.x, z - s.z) < s.s * 0.75) return false;
  for (const c of CLUSTERS) if (Math.hypot(x - c.x, z - c.z) < 1.4) return false;
  const e = 0.6;
  const sl = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
  return sl < 1.05;
}

const hex = (s: string) => {
  const n = parseInt(s.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};
const SAND = hex('#efdbe9');
const SAND2 = hex('#ddd0ee');
const WET = hex('#b9bfe2');
const MEADOW = hex('#86cfb6');
const MEADOW2 = hex('#a8dcc6');
const MOSS = hex('#9d92d6');
const ROCK = hex('#8a7fae');
const ROCK2 = hex('#b8acd6');
const PEARL = hex('#efe9f8');
const SHELFC = hex('#a99fc4');

/** pearl beaches, mint meadow, lilac rock, nacre terrace (vertex colors; the toon ramp shades them) */
export function paint(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  const n = fbm(x * 0.18, z * 0.18, 2, 41);
  const mix3 = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  let c: [number, number, number];
  const sand = mix3(SAND, SAND2, n);
  const meadow = mix3(MEADOW, MEADOW2, n * 0.8);
  // a soft shoreline between the pearl sand and the meadow (no stair-steps)
  const toMeadow = coastR(x, z) > 0.45 ? smoothstep(1.0, 1.55, h + (n - 0.5) * 0.3) : 1;
  c = mix3(sand, meadow, toMeadow);
  if (h < 0.35) c = mix3(WET, SAND2, smoothstep(-0.6, 0.35, h));
  if (h > 3.2 && slope < 0.9) c = mix3(c, MOSS, smoothstep(3.2, 6, h) * 0.6);
  // the shelf's rock and the mountain's lilac stone
  const sd = Math.hypot(x - SHELF.x, z - SHELF.z);
  if (sd < SHELF.r * 0.75) c = mix3(c, SHELFC, smoothstep(SHELF.r * 0.75, SHELF.r * 0.5, sd) * 0.85);
  if (slope > 0.75) c = mix3(c, ROCK, smoothstep(0.75, 1.25, slope));
  if (h > 6) c = mix3(c, ROCK2, smoothstep(6, 11, h) * 0.8);
  // the terrace under the paths: a pale pearl dust
  const cd = corridorDist(x, z);
  c = mix3(c, PEARL, (1 - smoothstep(1.5, 4.0, cd)) * 0.45);
  out.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
}
