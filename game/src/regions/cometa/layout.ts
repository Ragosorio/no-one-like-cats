/**
 * Puerto Cometa — the shape of the rock and where everything stands (pure, deterministic).
 *
 * A fragment of a comet, drifting at the very top of the sky layer, where the air runs out and the
 * stars stay on all day. Somebody paved half of it and opened a shipyard. +x east, +z south (the
 * default camera looks north, so the comet's tail streams away behind the island, into the sky).
 *
 *            «PUERTO COMETA» pylon on the icy crest            ~~~ the TAIL streams north ~~~
 *     OBSERVATORIO (knoll)        ( CRATER · the comet's heart )        REFINERÍA (Combustible Astral)
 *  RAMPA DE ⟵ rocket           plaza                                  crane     DIQUE 1 ⟶ space
 *  LANZAMIENTO                                                                   DIQUE 2 ⟶
 *              your ship at the pier       TALLER DEL CASCO DE PECERA (googie, faces you)
 */
import * as THREE from 'three';
import { clamp, fbm, lerp, smoothstep } from '../../engine/core/noise';

export const HALF = 72;
/** the island's rim radii (an asteroid chip: longer east–west) */
export const RX = 45;
export const RZ = 35;
export const Y = 2.0;
export const CUT = -1.6;
/** the cloud floor of the sky layer, far, far below (we are at its ceiling) */
export const SEA_Y = -150;

export const CRATER = { x: -3, z: -7, r: 8.2 };
export const REFINERY = { x: 23, z: -16 };
export const DOCKS = [
  { x: 31, z: -1.5, ang: 0 },
  { x: 28.5, z: 13.5, ang: -0.42 },
];
export const CRANES = [
  { x: 21.5, z: 5.5, h: 15, jib: 13 },
  { x: -1.5, z: 25.5, h: 12, jib: 10 },
];
export const RAIL = { x: -23, z: 7 };
/** the launch rail's centerline (base → the lip over the void), y absolute */
export const RAIL_PTS: [number, number, number][] = [
  [-19.5, Y + 0.9, 7],
  [-25, Y + 0.9, 7],
  [-31, Y + 1.5, 7],
  [-37, Y + 3.6, 7],
  [-42.5, Y + 7.6, 7],
  [-47, Y + 13.2, 7],
];
export const TALLER = { x: 9, z: 19.5, w: 12, d: 7 };
export const PIER = { x: -12, z0: 27, z1: 46, y: Y + 0.15 };
export const SHIP = { x: -17.6, y: Y - 0.6, z: 41, ry: 0 };
export const ARRIVAL: [number, number, number] = [-7, 0, 26];
export const TELESCOPE = { x: -26, z: -18, r: 6.5, top: Y + 2.4 };
export const PYLON = { x: 9, z: -27 };
export const PLAZA = { x: 2, z: 9 };
/** REGISTRO 000's perch: a loose rock off the north-west rim (night only) */
export const PERCH = new THREE.Vector3(-49, 7.2, -40);

/** rim radius along angle a (an asteroid chip: lumpy, longer east–west) */
export function rimR(a: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const ell = 1 / Math.sqrt((c * c) / (RX * RX) + (s * s) / (RZ * RZ));
  return ell * (1 + 0.07 * Math.sin(a * 3 + 1.1) + 0.045 * Math.sin(a * 7 - 0.4) + 0.03 * Math.sin(a * 13 + 2));
}
export function coastR(x: number, z: number) {
  return Math.hypot(x, z) / rimR(Math.atan2(z, x));
}

const pad = (h: number, to: number, d: number, r0: number, r1: number) => lerp(h, to, 1 - smoothstep(r0, r1, d));

/** paved aprons (flat, steel deck): the yard, the taller, the rail, the pier root, the refinery */
export const APRONS = [
  { x: 27, z: 5, r: 13 },
  { x: TALLER.x, z: TALLER.z - 1, r: 9.5 },
  { x: RAIL.x, z: RAIL.z, r: 7.5 },
  { x: PIER.x, z: PIER.z0 - 1, r: 6 },
  { x: REFINERY.x, z: REFINERY.z, r: 9 },
  { x: PLAZA.x, z: PLAZA.z, r: 8 },
];

export function height(x: number, z: number) {
  const r = coastR(x, z);
  if (r > 1.0) return -60;
  // the rock: a lumpy plateau, higher and craggier toward the north (the icy crest of the old comet)
  const north = smoothstep(-6, -30, z);
  let h = Y + fbm(x * 0.06, z * 0.06, 3, 9) * 0.9 - 0.3;
  const crag = Math.max(0, fbm(x * 0.11 + 3, z * 0.11, 4, 21) + 0.12) * 9;
  h += north * crag * smoothstep(0.55, 0.8, r);
  // the impact crater: a raised lip and a glassy bowl
  const dc = Math.hypot(x - CRATER.x, z - CRATER.z);
  h += 1.1 * Math.exp(-((dc - CRATER.r) ** 2) / 5);
  h -= 2.4 * (1 - smoothstep(0, CRATER.r * 0.95, dc)) ** 1.6;
  // the observatory knoll
  const dt = Math.hypot(x - TELESCOPE.x, z - TELESCOPE.z);
  h = Math.max(h, lerp(h, TELESCOPE.top, 1 - smoothstep(TELESCOPE.r * 0.6, TELESCOPE.r * 1.7, dt)));
  // aprons: paved flat
  for (const a of APRONS) h = pad(h, Y, Math.hypot(x - a.x, z - a.z), a.r * 0.75, a.r * 1.2);
  // the rim: a broken edge (the underside takes it from there)
  const m = 1 - smoothstep(0.9, 1.0, r);
  return lerp(CUT - 3, h, smoothstep(0.0, 0.3, m));
}

/** circles the cats walk around (buildings, tanks, cradles) */
export const BLOCKS: { x: number; z: number; r: number }[] = [
  { x: REFINERY.x, z: REFINERY.z, r: 5.4 },
  { x: REFINERY.x - 6.5, z: REFINERY.z - 3.5, r: 2.4 },
  { x: REFINERY.x + 6.5, z: REFINERY.z + 2, r: 2.2 },
  { x: TALLER.x - 3, z: TALLER.z - 1.4, r: 4.2 },
  { x: TALLER.x + 3, z: TALLER.z - 1.4, r: 4.2 },
  { x: TELESCOPE.x, z: TELESCOPE.z, r: 2.6 },
  { x: TELESCOPE.x - 4.5, z: TELESCOPE.z - 2, r: 2.8 },
  { x: CRANES[0].x, z: CRANES[0].z, r: 1.6 },
  { x: CRANES[1].x, z: CRANES[1].z, r: 1.4 },
  { x: PYLON.x - 7, z: PYLON.z, r: 1.4 },
  { x: PYLON.x + 7, z: PYLON.z, r: 1.4 },
];

export function walkable(x: number, z: number) {
  if (coastR(x, z) > 0.88) return false;
  if (Math.hypot(x - CRATER.x, z - CRATER.z) < CRATER.r * 0.72) return false;
  for (const b of BLOCKS) if (Math.hypot(x - b.x, z - b.z) < b.r) return false;
  // the drydocks' cradles
  for (const d of DOCKS) {
    const ca = Math.cos(d.ang);
    const sa = Math.sin(d.ang);
    const lx = (x - d.x) * ca + (z - d.z) * sa;
    const lz = -(x - d.x) * sa + (z - d.z) * ca;
    if (Math.abs(lx) < 7.5 && Math.abs(lz) < 3.4) return false;
  }
  // the rail's base and the rocket
  if (Math.abs(z - RAIL.z) < 1.8 && x < RAIL.x + 4) return false;
  const e = 0.6;
  const sl = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
  return sl < 1.05;
}

const hex = (s: string) => {
  const n = parseInt(s.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};
const ROCK = hex('#5b5592');
const ROCK2 = hex('#736caf');
const ROCK3 = hex('#47417a');
const FROST = hex('#c9e8ff');
const DECK = hex('#a3aac0');
const DECK2 = hex('#8f97ae');
const GLASS = hex('#1d1638');
const GLOWC = hex('#7a3fb0');

export function apronAt(x: number, z: number) {
  let k = 0;
  for (const a of APRONS) k = Math.max(k, 1 - smoothstep(a.r * 0.78, a.r * 1.05, Math.hypot(x - a.x, z - a.z)));
  return k;
}

/**
 * Painted ground: violet comet rock with frost in the cracks, steel deck plates on the aprons
 * (checker of two greys, hazard stripes at their borders, landing circles), and the crater's glassy
 * bowl going violet toward the heart.
 */
export function paint(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  const mix3 = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const n = fbm(x * 0.09, z * 0.09, 3, 4);
  const n2 = fbm(x * 0.33, z * 0.33, 2, 7);
  let c = mix3(ROCK3, ROCK, clamp(n * 1.4 + 0.55, 0, 1));
  c = mix3(c, ROCK2, clamp(n2 * 1.2 + 0.1, 0, 0.6));
  // frost on the high crest and on steep faces (soft, no speckle)
  const frost = clamp((h - Y - 1.0) * 0.28, 0, 1) * 0.75 + clamp(slope - 0.55, 0, 1) * 0.4;
  c = mix3(c, FROST, clamp(frost, 0, 0.85));
  // the crater: black glass going violet toward the heart
  const dc = Math.hypot(x - CRATER.x, z - CRATER.z);
  const bowl = 1 - smoothstep(CRATER.r * 0.82, CRATER.r * 0.98, dc);
  if (bowl > 0) c = mix3(c, mix3(GLASS, GLOWC, clamp(1 - dc / (CRATER.r * 0.8), 0, 1) * 0.7), bowl);
  // the aprons: steel deck (the crisp markings are geometry: port.ts)
  const ap = apronAt(x, z);
  if (ap > 0) c = mix3(c, mix3(DECK, DECK2, clamp(n2 + 0.5, 0, 1)), clamp(ap * 1.4, 0, 1));
  out.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
}
