/**
 * Corona Celeste — the shape of the city and where everything stands (pure, deterministic).
 *
 * The safest city in the world is also the most symmetric: an almost perfect octagonal disc of white
 * terraces on a bank of clouds, mirrored left/right on the avenue's axis (x = 0). +x east, +z south.
 *
 *                 [flanking tower]  ♛ CROWN TOWER  [flanking tower]
 *                   canal ↖           acropolis          ↗ canal      (waterfalls fall off the rim)
 *     bridge ── market (W)  ·····  ( plaza · fountain )  ·····  EMBASSY (E) ── bridge
 *                     parterre      «Reglas de la Ciudad»      parterre
 *          SW pier (airship)          avenue · topiaries           SE pier (airship)
 *                                  gate towers · S pier (your ship)
 */
import * as THREE from 'three';
import { clamp, fbm, lerp, smoothstep } from '../../engine/core/noise';

export const HALF = 64;
export const R = 40;
export const CUT = -1.4;
export const SEA_Y = -40;

export const Y_RING = 2.0;
export const Y_PLAZA = 2.6;
export const Y_ACRO = 3.6;
export const PLAZA_R = 13;
export const ACRO = { x: 0, z: -25, r: 9.5 };
export const FOUNTAIN = { x: 0, z: 0, r: 4.2 };
export const EMBASSY = { x: 25, z: 1.5, w: 9, d: 11, h: 11 };
export const MARKET = { x: -25, z: 1.5, r: 6.5 };
export const AVENUE = { z0: 13, z1: 39, w: 3.2 };
export const GATE = { z: 31.5, dx: 5.6 };
export const BOARD = { x: 0, z: 15.4 };
export const BUZON = { x: 19.2, z: 6.6 };
/** canals from the plaza to the rim (mirrored): water falls DOWN off the city, two identical falls */
export const CANAL: [number, number][] = [
  [6.8, -9.6],
  [12.5, -16],
  [18.5, -22.5],
  [25.5, -30.2],
];
export const CANAL_W = 1.5;
export const ARRIVAL: [number, number, number] = [-2.5, 0, 25];
export const PIER_S = { x: 0, z0: 37, z1: 50, y: 2.2 };
export const SHIP = { x: 12.5, y: 2.6, z: 46, ry: Math.atan2(-0.45, -0.89) };
/** the mirrored piers (SW / SE) where the city's airships moor */
export const PIERS = [
  { x: -30, z: 28, ang: Math.atan2(28, -30) },
  { x: 30, z: 28, ang: Math.atan2(28, 30) },
];
/** the twin garden islets (E / W), joined by thin bridges */
export const SATELLITES = [
  { x: -64, y: 1.2, z: -2, r: 9 },
  { x: 64, y: 1.2, z: -2, r: 9 },
];

const mirror = (x: number) => Math.abs(x);

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const L = dx * dx + dz * dz || 1;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
/** distance to the (mirrored) canal */
export function canalDist(x: number, z: number) {
  const mx = mirror(x);
  let d = Infinity;
  for (let i = 0; i < CANAL.length - 1; i++) d = Math.min(d, segDist(mx, z, ...CANAL[i], ...CANAL[i + 1]));
  return d;
}

/** the city's outline: an octagon softened just enough to look designed, not grown */
export function rimR(a: number) {
  return R * (1 + 0.045 * Math.cos(a * 8)) * (1 + 0.035 * Math.cos(a * 4 + Math.PI));
}
export function coastR(x: number, z: number) {
  return Math.hypot(x, z) / rimR(Math.atan2(z, x));
}

const terrace = (h: number, to: number, d: number, r0: number, r1: number) => lerp(h, to, 1 - smoothstep(r0, r1, d));

export function height(x: number, z: number) {
  const r = coastR(x, z);
  if (r > 1.0) return -60;
  let h = Y_RING;
  // the plaza disc, the acropolis, one crisp step each (still walkable: a ramp of ~0.8 u)
  h = terrace(h, Y_PLAZA, Math.hypot(x, z), PLAZA_R, PLAZA_R + 0.9);
  h = terrace(h, Y_ACRO, Math.hypot(x - ACRO.x, z - ACRO.z), ACRO.r, ACRO.r + 1.1);
  // the canals (a perfect stone channel)
  h = lerp(h, Y_RING - 0.7, 1 - smoothstep(CANAL_W * 0.7, CANAL_W * 1.05, canalDist(x, z)));
  // the rim: a clean marble edge (the clouds and the underside take it from there)
  const m = 1 - smoothstep(0.93, 1.0, r);
  return lerp(CUT - 2.6, h, smoothstep(0.0, 0.25, m));
}

export function walkable(x: number, z: number) {
  if (coastR(x, z) > 0.92) return false;
  if (canalDist(x, z) < CANAL_W * 1.25) return false;
  if (Math.hypot(x - FOUNTAIN.x, z - FOUNTAIN.z) < FOUNTAIN.r + 0.6) return false;
  // buildings (embassy, market stalls, towers) and the crown tower's base
  if (Math.abs(x - EMBASSY.x) < EMBASSY.w / 2 + 0.5 && Math.abs(z - EMBASSY.z) < EMBASSY.d / 2 + 0.5) return false;
  if (Math.hypot(x - ACRO.x, z - ACRO.z) < 5.2) return false;
  for (const sx of [-1, 1]) {
    if (Math.hypot(x - sx * 12, z + 28.5) < 3.4) return false;
    if (Math.hypot(x - sx * GATE.dx, z - GATE.z) < 2.0) return false;
  }
  if (Math.hypot(x - MARKET.x, z - MARKET.z) > MARKET.r - 1.2 && Math.hypot(x - MARKET.x, z - MARKET.z) < MARKET.r + 1.4 && x < MARKET.x + 2.5) return false;
  const e = 0.6;
  const sl = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
  return sl < 1.1;
}

const hex = (s: string) => {
  const n = parseInt(s.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};
const MARBLE = hex('#f4efe4');
const MARBLE2 = hex('#e9e1d0');
const LAWN = hex('#9ed69a');
const LAWN2 = hex('#b4e2a6');
const PATH = hex('#fbf7ee');
const CANALC = hex('#cfd8e2');

/**
 * Painted ground: marble everywhere people walk, with gold inlay lines that are exactly where you
 * expect them (rings, rays, the avenue's borders), and lawns cut with a ruler.
 */
export function paint(x: number, z: number, _h: number, _slope: number, out: THREE.Color) {
  const mix3 = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const d = Math.hypot(x, z);
  const a = Math.atan2(z, x);
  // marble tiles (a checker of two whites)
  const tile = (Math.floor(x / 2.2) + Math.floor(z / 2.2)) & 1;
  let c = mix3(MARBLE, MARBLE2, tile * 0.6 + fbm(x * 0.3, z * 0.3, 2, 5) * 0.15);
  // lawns: the four quadrants between the plaza ring and the promenade, perfectly trimmed
  const quad = d > PLAZA_R + 3 && d < 30 && Math.abs(x) > AVENUE.w + 2.5 && Math.abs(z - 1.5) > 2.5;
  const nearB = Math.abs(x - EMBASSY.x) < 8 || Math.abs(x - MARKET.x) < 9;
  if (quad && !nearB && canalDist(x, z) > 3) c = mix3(LAWN, LAWN2, (Math.floor(d / 1.6) & 1) * 0.5);
  // the avenue: paler, with gold borders
  if (Math.abs(x) < AVENUE.w && z > AVENUE.z0 - 1) c = mix3(c, PATH, 0.8);
  // the plaza: a paler disc with a faint star of eight rays (the crisp gold lines are geometry)
  if (d < PLAZA_R) c = mix3(c, PATH, 0.35 + 0.25 * (Math.abs(Math.sin(a * 4)) > 0.92 ? 1 : 0));
  if (canalDist(x, z) < CANAL_W * 1.15) c = mix3(c, CANALC, 0.8);
  out.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
}
