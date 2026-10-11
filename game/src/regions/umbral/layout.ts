/**
 * El Umbral — the edge of the chart, where the paper ends (pure, deterministic).
 *
 * Units: 1 ≈ one cat-length. Sea level y = 0. +x east, +z south (toward the default camera, which looks NORTH:
 * at the edge).
 *
 *   ░░░░░░░░░░░░ the blank page: no sea, nothing. Yet. ░░░░░░░░░░░░
 *   ~~~~~~~~~~~~~~~~~~~~~~ torn edge (z = EDGE_Z) ~~~~~~~~~~~~~~~~~~~~
 *                         [  THE DOOR  ]  ← ajar, a cat-flap at its foot; Bisagra at the hinge
 *   ⛵⛵⛵▲⛵⛵⛵ the white fleet          |              ✎ graffiti on torn rocks · the rift ship (E)
 *   (W, perfectly aligned)       causeway
 *     · · · · · the Correctores' cats in a row on the beach
 *                          the promontory
 *                          beach · arrival · your ship (S)
 */
import * as THREE from 'three';
import { fbm, lerp, smoothstep } from '../../engine/core/noise';

export const HALF = 64;
/** where the paper ends */
export const EDGE_Z = -50;
/** the door's ground point (it faces +z) and its size */
export const DOOR = { x: 0, z: -42, w: 12, h: 22, y: 3.2 };
export const ARRIVAL: [number, number, number] = [3, 1, 22];
export const SHIP = { x: 13, z: 33, ry: 0.4 };
/** the white fleet: a perfect row, west of the promontory (the flagship in the middle) */
export const FLEET = { x0: -74, z: -30, step: 8, n: 7 };
export const FLAGSHIP = { x: FLEET.x0 + FLEET.step * 3, z: FLEET.z };
/** the Correctores' cats on the west beach, in a row */
export const ROW = { x: -10, z0: -6, step: 2.6, n: 5 };
/** the Disruptores' rift ship, east, and their torn floating rocks */
export const RIFT = { x: 46, z: -26, ry: -1.9 };

export function height(x: number, z: number): number {
  // an elongated promontory from the beach (S) to the door (N), narrowing toward the edge
  const t = smoothstep(30, -44, z); // 0 south … 1 north
  const halfW = lerp(24, 9, t) * (1 + 0.12 * Math.sin(z * 0.11 + 1.3) + 0.08 * fbm(x * 0.05, z * 0.05, 2, 5));
  const along = z > 26 ? 1 - smoothstep(26, 36, z) : z < -46 ? 1 - smoothstep(-46, -49, z) : 1;
  const across = 1 - smoothstep(halfW * 0.65, halfW, Math.abs(x));
  const m = along * across;
  if (m <= 0) return -5 - 3 * smoothstep(0, 30, Math.abs(x) - halfW);
  let h = m * (1.9 + 1.4 * (fbm(x * 0.06, z * 0.06, 3, 41) * 0.5 + 0.5) + t * 1.6);
  // a ridge of ink-dark rock along the east side
  h += m * 2.6 * Math.exp(-((x - 9 + t * 4) ** 2) / 18) * smoothstep(10, -20, z);
  h = lerp(-1.8, h, smoothstep(0, 0.25, m));
  // the causeway to the door, flat
  const cw = 1 - smoothstep(3, 5, Math.abs(x - DOOR.x));
  if (z < -20 && z > -46) h = lerp(h, DOOR.y, cw * smoothstep(-20, -26, z));
  // the door's platform
  const dp = 1 - smoothstep(7, 10, Math.hypot(x - DOOR.x, (z - DOOR.z) * 1.3));
  h = lerp(h, DOOR.y, dp);
  // the beach and arrival
  const ap = 1 - smoothstep(4, 6.5, Math.hypot(x - ARRIVAL[0], z - ARRIVAL[2]));
  h = lerp(h, 1.0, ap);
  return h;
}

export function walkable(x: number, z: number) {
  if (z < EDGE_Z + 3) return false;
  const h = height(x, z);
  if (h < 0.45) return false;
  const e = 0.6;
  const sl = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
  return sl < 1.15;
}

const ca = new THREE.Color();
const cb = new THREE.Color();
/** TINTA EN EL BORDE: paper-white sand, ink-wash stone, and ink that bleeds the closer you get to the edge */
export function paint(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  if (h < 0.5) {
    out.set('#e2ded6').lerp(ca.set('#7a80a0'), smoothstep(0.5, -2, h));
    return;
  }
  if (h < 1.25) {
    out.set('#f4f0e6');
    return;
  }
  const n = fbm(x * 0.06, z * 0.06, 3, 3) * 0.5 + 0.5;
  ca.set('#dcd8e2').lerp(cb.set('#b4aecc'), smoothstep(0.4, 0.7, n));
  // grass, a little, gray-green, on the southern half
  ca.lerp(cb.set('#a8b89c'), smoothstep(0.55, 0.75, fbm(x * 0.11 + 7, z * 0.11, 2, 4) * 0.5 + 0.5) * smoothstep(-10, 15, z) * 0.7);
  // ink bleeding in from the edge, in patches (like a page left in the rain)
  const ink = smoothstep(-20, -46, z) * smoothstep(0.55, 0.8, fbm(x * 0.09, z * 0.09, 3, 17) * 0.5 + 0.5);
  ca.lerp(cb.set('#2a2444'), ink * 0.85);
  if (slope > 0.85) ca.lerp(cb.set('#6a6488'), smoothstep(0.85, 1.4, slope));
  // the causeway: pale flagstones with ink joints
  if (z < -20 && Math.abs(x - DOOR.x) < 3.4) {
    const j = Math.min(Math.abs(((z % 2.2) + 2.2) % 2.2 - 1.1), Math.abs(x - DOOR.x));
    ca.set(j < 0.08 ? '#6a6488' : '#f2eee4');
  }
  out.copy(ca);
}
