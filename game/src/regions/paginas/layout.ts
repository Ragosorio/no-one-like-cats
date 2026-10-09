/**
 * Isla de las Páginas Hundidas — the ground plan. Pure and deterministic (tests and the heightfield
 * sample it): a warped round island whose heart is a GIANT OPEN BOOK lying on a plateau. The book's
 * pages ARE terrain (cats walk on page 212/213); a ramp of book spines climbs to it from the beach.
 *
 * Top view (camera starts south-east, looking north-west; +z = south = the beach):
 *
 *        (north) cliffs of stacked giant books · REGISTRO's sea stack far west-north-west
 *                         lighthouse on a plinth of books (head of the spine)
 *   reading-room ruin ─┐   ┌──────── open book ────────┐   ink tide pool ← ink runs off page 213
 *   + drowned dock (W) │   │  212   gutter   213       │
 *                          └────── spine stairs ───────┘
 *                                beach + rowboat (arrival)
 */
import * as THREE from 'three';
import { fbm, lerp, smoothstep } from '../../engine/core/noise';
import { islandHeight } from '../shapes';

/** the open book. The terrain's page area is PAGE; the visual page block is 1.1 u larger on every
 *  side so the heightfield's one-cell smear at the cliff always hides under the paper. */
export const BOOK = {
  /** half width of the terrain page area (pages run |x| ≤ W, the spine is x = 0) */
  W: 12,
  /** head (north, lighthouse) and tail (south, stairs) of the terrain page area */
  zHead: -15.5,
  zTail: 9.5,
  /** visual margin beyond the terrain page rect (≥ one terrain cell at the lowest tier) */
  M: 1.1,
  /** height of the gutter and how much the pages bulge */
  gutter: 3.1,
  bulge: 2.0,
  /** top of the cover board (terrain under the cover's rim sits a hair below it) */
  coverTop: 2.9,
  /** the plateau the book lies on */
  plateau: 2.4,
};

/** page profile across a page: 0 in the gutter, rises fast, flattens toward the fore-edge */
export function pageProfile(u: number) {
  const k = Math.min(1, Math.max(0, u));
  return Math.sqrt(k) * (1.15 - 0.55 * k);
}

/** height of the paper at (x, z), valid anywhere over the (visual) page block */
export function pageHeight(x: number, z: number) {
  const u = Math.abs(x) / BOOK.W;
  // a soft paper ripple, stronger toward the fore-edge (wet pages never lie perfectly flat)
  const rip = 0.1 * Math.sin(z * 0.45 + x * 0.12) * Math.min(1, u);
  return BOOK.gutter + BOOK.bulge * pageProfile(u) + rip;
}

/** rectangles (x0, x1, z0, z1) */
export const PAGE_RECT = { x0: -BOOK.W, x1: BOOK.W, z0: BOOK.zHead, z1: BOOK.zTail };
export const BLOCK_RECT = { x0: -BOOK.W - BOOK.M, x1: BOOK.W + BOOK.M, z0: BOOK.zHead - BOOK.M, z1: BOOK.zTail + BOOK.M };
export const COVER_T_RECT = { x0: BLOCK_RECT.x0 - 0.7, x1: BLOCK_RECT.x1 + 0.7, z0: BLOCK_RECT.z0 - 0.7, z1: BLOCK_RECT.z1 + 0.7 };
export const COVER_RECT = { x0: COVER_T_RECT.x0 - BOOK.M, x1: COVER_T_RECT.x1 + BOOK.M, z0: COVER_T_RECT.z0 - BOOK.M, z1: COVER_T_RECT.z1 + BOOK.M };

const inRect = (r: { x0: number; x1: number; z0: number; z1: number }, x: number, z: number, pad = 0) => x >= r.x0 - pad && x <= r.x1 + pad && z >= r.z0 - pad && z <= r.z1 + pad;

/** where things are */
export const SPOT = {
  lighthouse: { x: 0, z: -23 },
  arrival: { x: 7, z: 27 },
  beach: { x: 6, z: 26, r: 9 },
  /** spine stairs: centre line x, from the book's tail down to the beach */
  ramp: { x: 4.6, z0: BOOK.zTail, zFlat: 11.4, z1: 22.5, half: 2.2 },
  /** reading-room ruin (upper floor east, sunken flooded floor west) */
  room: { x: -27, z: 3, r: 6.5, floor: 0.8 },
  roomSunk: { x: -33.5, z: 3.5 },
  /** drowned-library dock: from the room's south-west into the sea */
  dock: { x0: -31.5, z0: 8.5, x1: -42.5, z1: 11.5, y: 0.85 },
  /** the ink tide pool, fed by a trickle that runs off page 213 */
  pool: { x: 21, z: 6.5, r: 4.4, rim: 1.45, surface: 1.12 },
  ink: [
    [BLOCK_RECT.x1 + 0.6, 1.2],
    [15.5, 2.6],
    [17.6, 4.4],
  ] as [number, number][],
  /** REGISTRO 000's lone sea stack */
  seaStack: { x: -47, z: -19 },
};

const island = islandHeight({
  radius: 41,
  seed: 23,
  base: 1.7,
  hills: 1.0,
  pads: [
    { x: SPOT.beach.x, z: SPOT.beach.z, r: SPOT.beach.r, h: 0.85 },
    { x: SPOT.room.x, z: SPOT.room.z, r: SPOT.room.r, h: SPOT.room.floor - 0.05 },
    { x: SPOT.pool.x, z: SPOT.pool.z, r: SPOT.pool.r + 2.4, h: SPOT.pool.rim },
  ],
  bumps: [
    { x: -14, z: -30, r: 7, h: 1.6 },
    { x: 15, z: -30, r: 8, h: 1.8 },
    { x: 30, z: -14, r: 6, h: 1.2 },
    { x: -30, z: -16, r: 6, h: 1.3 },
  ],
});

function distSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const vx = bx - ax;
  const vz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(px - (ax + vx * t), pz - (az + vz * t));
}

/** distance to the ink trickle polyline */
export function inkDist(x: number, z: number) {
  let d = Infinity;
  const p = SPOT.ink;
  for (let i = 0; i < p.length - 1; i++) d = Math.min(d, distSeg(x, z, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]));
  return d;
}

/** rounded-rectangle plateau the book lies on (falls off smoothly into the island) */
function plateauW(x: number, z: number) {
  const dx = Math.max(Math.abs(x) - 15.5, 0);
  const dz = Math.max(-27 - z, z - 13.5, 0);
  return 1 - smoothstep(0, 5.5, Math.hypot(dx, dz));
}

/** spine stairs: page height at the tail, then down to the beach */
function rampH(z: number) {
  const r = SPOT.ramp;
  const top = pageHeight(r.x, BOOK.zTail);
  if (z <= r.zFlat) return top;
  return lerp(top, 0.85, smoothstep(r.zFlat, r.z1, z) * 0.35 + ((z - r.zFlat) / (r.z1 - r.zFlat)) * 0.65);
}

export function height(x: number, z: number) {
  // the book itself (pages are terrain; the cover rim a hair under the cover board)
  if (inRect(PAGE_RECT, x, z)) return pageHeight(x, z);
  if (inRect(COVER_T_RECT, x, z)) {
    // spine stairs climb over the cover rim onto the tail of the page
    const r = SPOT.ramp;
    if (z > BOOK.zTail && Math.abs(x - r.x) < r.half) return pageHeight(r.x, BOOK.zTail);
    return BOOK.coverTop - 0.06;
  }
  let h = island(x, z);
  // plateau
  const pw = plateauW(x, z);
  if (pw > 0) h = lerp(h, BOOK.plateau, pw);
  // ramp of spines (blends into the plateau and the beach at its sides)
  const r = SPOT.ramp;
  if (z > BOOK.zTail && z < r.z1 + 1.5) {
    const w = (1 - smoothstep(r.half - 0.2, r.half + 1.4, Math.abs(x - r.x))) * (1 - smoothstep(r.z1 - 0.5, r.z1 + 1.5, z));
    if (w > 0) h = lerp(h, Math.max(h, rampH(z)), w);
  }
  // ink tide pool: a bowl under the ink surface
  const dp = Math.hypot(x - SPOT.pool.x, z - SPOT.pool.z);
  if (dp < SPOT.pool.r + 0.8) h = lerp(h, 0.45, 1 - smoothstep(SPOT.pool.r - 0.9, SPOT.pool.r + 0.6, dp));
  // the trickle cuts a shallow channel
  const di = inkDist(x, z);
  if (di < 1.0 && !inRect(COVER_T_RECT, x, z)) h -= 0.12 * (1 - di);
  // drowned half of the reading room: below the waves
  const ds = Math.hypot((x - SPOT.roomSunk.x) * 0.8, z - SPOT.roomSunk.z);
  if (ds < 6) h = lerp(h, -0.35, 1 - smoothstep(3.6, 6, ds));
  return h;
}

/** cats walk on sand, moss, the plateau, the stairs and the pages (not into the gutter or the ink) */
export function walkable(x: number, z: number) {
  const h = height(x, z);
  if (h < 0.5) return false;
  if (Math.hypot(x - SPOT.pool.x, z - SPOT.pool.z) < SPOT.pool.r + 0.3) return false;
  const e = 0.6;
  const sl = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
  return sl < 1.1;
}

const col = (s: string) => new THREE.Color(s);
const C = {
  paper: col('#efe4c6'),
  wetSand: col('#a99a74'),
  sand: col('#e2d1a2'),
  sandWet: col('#c8b688'),
  moss: col('#8c9a68'),
  moss2: col('#a4a46f'),
  dirt: col('#c9b38c'),
  rock: col('#857a86'),
  rock2: col('#6f6777'),
  ink: col('#25223c'),
  pulp: col('#e9dec4'),
  cover: col('#5a2a28'),
};

/** terrain painter: sepia beach, mossy rock, paper pulp drifts, an ink stain that leads to the pool */
export function paint(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  const mix = (a: THREE.Color, b: THREE.Color, t: number) => void out.lerpColors(a, b, Math.min(1, Math.max(0, t)));
  if (inRect(BLOCK_RECT, x, z, 0.3)) return void out.copy(C.paper);
  if (inRect(COVER_T_RECT, x, z, 0.3)) return void out.copy(C.cover);
  const n = fbm(x * 0.13, z * 0.13, 3, 41);
  if (h < 0.12) mix(C.wetSand, C.sandWet, smoothstep(-1.5, 0.1, h));
  else if (slope > 0.95) mix(C.rock, C.rock2, smoothstep(0.95, 1.8, slope));
  else if (h < 0.95) mix(C.sandWet, C.sand, smoothstep(0.15, 0.55, h));
  else if (plateauW(x, z) > 0.6) {
    if (n > 0.18) out.copy(C.pulp);
    else mix(C.dirt, C.pulp, smoothstep(-0.2, 0.18, n) * 0.5);
  } else if (h < 1.25) mix(C.sand, C.moss, smoothstep(0.95, 1.25, h));
  else if (n > 0.32) out.copy(C.pulp); // drifts of soggy paper over the moss
  else mix(C.moss, C.moss2, smoothstep(-0.4, 0.5, fbm(x * 0.3, z * 0.3, 2, 7)));
  // the ink: a soft stain around the pool and along the trickle from page 213
  const dp = Math.hypot(x - SPOT.pool.x, z - SPOT.pool.z);
  const di = inkDist(x, z);
  const k = Math.max(1 - smoothstep(SPOT.pool.r - 0.6, SPOT.pool.r + 1.6 + n * 0.8, dp), (1 - smoothstep(0.15, 0.95 + n * 0.3, di)) * 0.95);
  if (k > 0) out.lerp(C.ink, k);
}
