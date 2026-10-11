/**
 * Corona Celeste's architecture, generated in code and merged by material: white marble with gold
 * trims, pale-teal roofs, windows that glow gold at night (aGlow). Everything is placed in mirrored
 * pairs on the avenue's axis — the city is beautiful, and it is TOO tidy.
 *
 *  - crown tower on the acropolis (its floating crown and rings are separate: they turn)
 *  - flanking towers, gate towers and the gate, a ring colonnade around the plaza
 *  - the embassy (a facade with a door and no windows), the market (identical stalls, cloud jars)
 *  - the avenue's identical topiaries and lamps, mirrored parterres, canals with gold kerbs
 *  - piers with mooring masts, bridges to the twin garden islets, the tiered fountain
 */
import * as THREE from 'three';
import { Mesher, mat } from '../cielo/kit';
import { islet, tube, type RockPalette } from '../cielo/rock';
import { ACRO, AVENUE, BOARD, BUZON, CANAL, CANAL_W, EMBASSY, FOUNTAIN, GATE, MARKET, PIERS, PIER_S, PLAZA_R, SATELLITES, Y_ACRO, Y_PLAZA, Y_RING, height, rimR } from './layout';

export const C = {
  wall: '#f7f3ea',
  wall2: '#ebe3d1',
  shade: '#ddd2bb',
  gold: '#e2b046',
  gold2: '#f4d27a',
  roof: '#9fdcd2',
  roof2: '#7cc8c4',
  glass: '#ffe2a0',
  door: '#b8892e',
  hedge: '#7cc47e',
  hedge2: '#94d48e',
  wood: '#c9a77a',
  banner: '#fffdf6',
};

export const MARBLE: RockPalette = {
  soil: '#efe6d2',
  rock: ['#f6f1e6', '#e9dfca', '#f9f6ef', '#e2d4b8', '#f2e2b4'],
  moss: '#d8ecc8',
  dark: '#c8b894',
  root: '#e2b046',
};

/** the lamps and windows whose glow lights the cats at night */
export interface CityLights {
  lamps: THREE.Vector3[];
  windows: THREE.Vector3[];
}

function cyl(M: Mesher, x: number, y: number, z: number, r0: number, r1: number, h: number, color: string, seg = 16, glow = 0) {
  M.add(new THREE.CylinderGeometry(r1, r0, h, seg), color, mat(x, y + h / 2, z), 0, glow);
}

/** a round tower: plinth, shaft with gold rings and glowing windows, balcony, cap and finial */
export function tower(M: Mesher, L: CityLights, x: number, z: number, y0: number, o: { r: number; h: number; cap: 'dome' | 'cone' | 'flat'; rows?: number; capColor?: string }) {
  const { r, h } = o;
  cyl(M, x, y0, z, r * 1.3, r * 1.25, 0.7, C.wall2);
  cyl(M, x, y0 + 0.7, z, r, r * 0.96, h, C.wall);
  const rows = o.rows ?? Math.max(1, Math.floor(h / 4));
  for (let i = 1; i <= rows; i++) {
    const y = y0 + 0.7 + (h * i) / (rows + 1);
    cyl(M, x, y - 1.5, z, r * 1.06, r * 1.06, 0.22, C.gold, 16);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + (i % 2) * 0.39;
      const w = new THREE.BoxGeometry(0.42, 0.95, 0.12);
      M.add(w, C.glass, mat(x + Math.cos(a) * r * 0.99, y, z + Math.sin(a) * r * 0.99, 0, -a + Math.PI / 2, 0), 0, 0.9);
      if (k % 4 === 0) L.windows.push(new THREE.Vector3(x + Math.cos(a) * r * 1.3, y, z + Math.sin(a) * r * 1.3));
    }
  }
  const top = y0 + 0.7 + h;
  cyl(M, x, top, z, r * 1.32, r * 1.32, 0.35, C.wall2);
  cyl(M, x, top + 0.35, z, r * 1.32, r * 1.32, 0.12, C.gold, 20);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    M.add(new THREE.BoxGeometry(0.1, 0.6, 0.1), C.gold, mat(x + Math.cos(a) * r * 1.26, top + 0.65, z + Math.sin(a) * r * 1.26));
  }
  cyl(M, x, top + 0.35, z, r * 0.9, r * 0.85, 0.9, C.wall);
  const capY = top + 1.25;
  if (o.cap === 'dome') {
    const d = new THREE.SphereGeometry(r * 0.95, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    M.add(d, o.capColor ?? C.gold2, mat(x, capY, z));
    M.add(new THREE.ConeGeometry(0.16, r * 1.4, 6), C.gold, mat(x, capY + r * 0.95 + r * 0.6, z));
    M.add(new THREE.SphereGeometry(0.28, 8, 6), C.gold2, mat(x, capY + r * 0.95 + r * 1.35, z), 0, 0.6);
  } else if (o.cap === 'cone') {
    M.add(new THREE.ConeGeometry(r * 1.1, r * 2.4, 16), o.capColor ?? C.roof, mat(x, capY + r * 1.2, z));
    M.add(new THREE.SphereGeometry(0.22, 8, 6), C.gold2, mat(x, capY + r * 2.45, z), 0, 0.6);
  }
  return capY;
}

/** two piers and an arch between them (gates, arcades) */
export function archway(M: Mesher, a: THREE.Vector3, b: THREE.Vector3, h: number, w = 0.7) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const span = a.distanceTo(b);
  const dirYaw = Math.atan2(b.x - a.x, b.z - a.z);
  for (const p of [a, b]) {
    M.add(new THREE.BoxGeometry(w * 1.3, 0.4, w * 1.3), C.wall2, mat(p.x, p.y + 0.2, p.z, 0, dirYaw, 0));
    M.add(new THREE.BoxGeometry(w, h, w), C.wall, mat(p.x, p.y + h / 2, p.z, 0, dirYaw, 0));
    M.add(new THREE.BoxGeometry(w * 1.25, 0.3, w * 1.25), C.gold, mat(p.x, p.y + h, p.z, 0, dirYaw, 0));
  }
  // the arc spans local x: turn local x onto the a→b direction
  const arc = new THREE.TorusGeometry(span / 2, w * 0.36, 6, 18, Math.PI);
  M.add(arc, C.wall, mat(mid.x, mid.y + h, mid.z, 0, dirYaw - Math.PI / 2, 0));
  // the keystone, and a gold crest disc hanging in the arch
  M.add(new THREE.BoxGeometry(w * 0.9, 0.5, w * 0.9), C.gold, mat(mid.x, mid.y + h + span / 2 + w * 0.2, mid.z, 0, dirYaw, 0));
  M.add(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 24), C.gold2, mat(mid.x, mid.y + h + span / 2 - 1.3, mid.z, Math.PI / 2, dirYaw - Math.PI / 2, 0), 0, 0.4);
}

/** the plaza's ring colonnade: columns + architrave, open on the four axes */
export function colonnade(M: Mesher, r: number, y: number, h: number) {
  const N = 24;
  const cols: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + Math.PI / N;
    // gaps on the axes (the four entrances)
    const axis = Math.min(...[0, Math.PI / 2, Math.PI, -Math.PI / 2, (3 * Math.PI) / 2, 2 * Math.PI].map((q) => Math.abs(a - q)));
    if (axis < 0.2) {
      cols.push(new THREE.Vector3(NaN, 0, 0));
      continue;
    }
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    M.add(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), C.wall2, mat(x, y + 0.15, z));
    M.add(new THREE.CylinderGeometry(0.3, 0.34, h, 10), C.wall, mat(x, y + h / 2, z));
    M.add(new THREE.BoxGeometry(0.75, 0.24, 0.75), C.gold, mat(x, y + h + 0.1, z));
    cols.push(new THREE.Vector3(x, y, z));
  }
  for (let i = 0; i < N; i++) {
    const a = cols[i];
    const b = cols[(i + 1) % N];
    if (Number.isNaN(a.x) || Number.isNaN(b.x)) continue;
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const yaw = Math.atan2(b.x - a.x, b.z - a.z);
    const len = a.distanceTo(b) + 0.6;
    M.add(new THREE.BoxGeometry(0.7, 0.5, len), C.wall2, mat(mid.x, y + h + 0.45, mid.z, 0, yaw, 0));
    M.add(new THREE.BoxGeometry(0.76, 0.12, len), C.gold, mat(mid.x, y + h + 0.74, mid.z, 0, yaw, 0));
  }
}

/** the embassy: a symmetric facade with columns, a pediment, a giant door — and not one window */
export function embassy(M: Mesher, L: CityLights) {
  const { x, z, w, d, h } = EMBASSY;
  const y = Y_RING;
  M.add(new THREE.BoxGeometry(w, h, d), C.wall, mat(x + 0.6, y + h / 2, z));
  M.add(new THREE.BoxGeometry(w + 0.6, 0.5, d + 0.6), C.wall2, mat(x + 0.6, y + h + 0.25, z));
  M.add(new THREE.BoxGeometry(w + 0.7, 0.14, d + 0.7), C.gold, mat(x + 0.6, y + h + 0.55, z));
  // attic, drum and a flattened gold dome; pilasters down the sides
  M.add(new THREE.BoxGeometry(w - 2, 1.4, d - 2), C.wall, mat(x + 0.9, y + h + 1.3, z));
  M.add(new THREE.CylinderGeometry(3.0, 3.2, 1.2, 24), C.wall2, mat(x + 0.9, y + h + 2.6, z));
  M.add(new THREE.CylinderGeometry(3.25, 3.25, 0.14, 24), C.gold, mat(x + 0.9, y + h + 3.25, z));
  M.add(new THREE.SphereGeometry(3.0, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), C.gold2, mat(x + 0.9, y + h + 3.3, z, 0, 0, 0, 1, 0.62, 1));
  M.add(new THREE.SphereGeometry(0.35, 10, 8), C.banner, mat(x + 0.9, y + h + 5.3, z), 0, 0.6);
  for (const sz of [-1, 1])
    for (let i = 0; i < 4; i++) M.add(new THREE.BoxGeometry(0.5, h - 0.4, 0.3), C.wall2, mat(x - w / 2 + 2 + i * 2.4, y + h / 2, z + sz * (d / 2 + 0.1)));
  // the portico's platform and three steps up to it (west face)
  const fx = x - w / 2 + 0.6;
  const px = fx - 1.6;
  M.add(new THREE.BoxGeometry(fx - px + 1.1, 0.66, d + 0.2), C.wall2, mat((fx + px - 1.1) / 2, y + 0.33, z));
  for (let i = 0; i < 3; i++) M.add(new THREE.BoxGeometry(0.6 * (3 - i), 0.22, d - 0.6), C.wall2, mat(px - 1.1 - 0.3 * (3 - i), y + 0.11 + i * 0.22, z));
  // portico: six columns and the pediment
  for (let i = 0; i < 6; i++) {
    const cz = z - d / 2 + 1.1 + (i * (d - 2.2)) / 5;
    M.add(new THREE.CylinderGeometry(0.42, 0.46, 0.3, 10), C.wall2, mat(px, y + 0.66 + 0.15, cz));
    M.add(new THREE.CylinderGeometry(0.34, 0.38, h - 2.4, 12), C.wall, mat(px, y + 0.66 + (h - 2.4) / 2, cz));
    M.add(new THREE.BoxGeometry(0.85, 0.26, 0.85), C.gold, mat(px, y + h - 1.6, cz));
  }
  M.add(new THREE.BoxGeometry(2.6, 0.7, d + 0.2), C.wall2, mat(px + 0.9, y + h - 1.15, z));
  const hw = d / 2 + 0.1;
  const ped = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-hw, 0), new THREE.Vector2(hw, 0), new THREE.Vector2(0, 2.2)]), { depth: 2.7, bevelEnabled: false });
  ped.rotateY(Math.PI / 2);
  M.add(ped, C.wall, mat(px - 0.45, y + h - 0.8, z));
  // the door: tall, gold, shut
  M.add(new THREE.BoxGeometry(0.2, 5.2, 2.8), C.door, mat(fx - 0.02, y + 0.66 + 2.6, z));
  M.add(new THREE.BoxGeometry(0.28, 5.6, 0.2), C.gold, mat(fx - 0.06, y + 0.66 + 2.8, z - 1.5));
  M.add(new THREE.BoxGeometry(0.28, 5.6, 0.2), C.gold, mat(fx - 0.06, y + 0.66 + 2.8, z + 1.5));
  M.add(new THREE.BoxGeometry(0.28, 0.2, 3.2), C.gold, mat(fx - 0.06, y + 0.66 + 5.5, z));
  // the emblem above the door: a perfect circle (white, gold ring)
  M.add(new THREE.CylinderGeometry(1.0, 1.0, 0.14, 32), C.banner, mat(fx - 0.1, y + h - 3.0, z, 0, 0, Math.PI / 2), 0, 0.5);
  M.add(new THREE.TorusGeometry(1.08, 0.1, 6, 32), C.gold, mat(fx - 0.16, y + h - 3.0, z, 0, Math.PI / 2, 0), 0, 0.4);
  // two tall banners on the facade (they sway a little)
  for (const sz of [-1, 1]) {
    const bz = z + sz * (d / 2 - 0.9);
    const b = new THREE.PlaneGeometry(1.3, 5.2, 1, 6);
    M.add(b, (v, out) => out.set(Math.abs(v.y + 1.4) < 0.5 ? C.gold : C.banner), mat(fx - 0.12, y + h - 4.4, bz, 0, -Math.PI / 2, 0), (p) => Math.max(0, (-p.y + 2.6) / 5.2) * 0.35);
  }
  L.lamps.push(new THREE.Vector3(fx - 1.6, y + 3.5, z));
  return new THREE.Vector3(fx - 2.8, y + 0.2, z);
}

/** the market: identical stalls on a half circle (white/gold awnings, cloud jars on the counters) */
export function market(M: Mesher, L: CityLights, jars: THREE.Vector3[]) {
  const N = 7;
  for (let i = 0; i < N; i++) {
    const a = Math.PI / 2 + ((i + 0.5) / N) * Math.PI;
    const x = MARKET.x + Math.cos(a) * MARKET.r;
    const z = MARKET.z + Math.sin(a) * MARKET.r;
    const yaw = -a - Math.PI / 2;
    const y = height(x, z);
    const local = (lx: number, ly: number, lz: number) => new THREE.Vector3(lx, ly, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(new THREE.Vector3(x, y, z));
    const at = (lx: number, ly: number, lz: number, sx = 1, sy = 1, sz = 1) => {
      const p = local(lx, ly, lz);
      return mat(p.x, p.y, p.z, 0, yaw, 0, sx, sy, sz);
    };
    M.add(new THREE.BoxGeometry(2.6, 1.0, 1.0), C.wall2, at(0, 0.5, 0.2));
    M.add(new THREE.BoxGeometry(2.75, 0.1, 1.15), C.gold, at(0, 1.03, 0.2));
    for (const sx of [-1, 1]) for (const sz of [-0.3, 0.8]) M.add(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), C.gold, at(sx * 1.25, 1.3, sz));
    const aw = new THREE.BoxGeometry(3.0, 0.08, 1.7, 8, 1, 1);
    M.add(aw, (v, out) => out.set(Math.floor((v.x + 1.5) / 0.375) % 2 ? C.gold2 : C.banner), new THREE.Matrix4().multiplyMatrices(at(0, 2.7, 0.3), new THREE.Matrix4().makeRotationX(0.22)));
    for (let k = 0; k < 3; k++) {
      const p = local(-0.8 + k * 0.8, 1.35, 0.2);
      M.add(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8), '#e8f4f8', mat(p.x, p.y, p.z));
      jars.push(new THREE.Vector3(p.x, p.y + 0.05, p.z));
    }
    if (i === 3) L.lamps.push(local(0, 2.2, 1.2));
  }
}

/** a topiary: a perfect sphere or cone on a pot */
export function topiary(M: Mesher, x: number, y: number, z: number, kind: 0 | 1, s = 1) {
  M.add(new THREE.CylinderGeometry(0.45 * s, 0.35 * s, 0.55 * s, 10), C.wall2, mat(x, y + 0.27 * s, z));
  M.add(new THREE.CylinderGeometry(0.5 * s, 0.5 * s, 0.08 * s, 10), C.gold, mat(x, y + 0.56 * s, z));
  M.add(new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 0.6 * s, 5), '#7a5a3a', mat(x, y + 0.85 * s, z));
  if (kind === 0) M.add(new THREE.SphereGeometry(0.95 * s, 14, 10), (v, o) => o.set(v.y > 0.2 * s ? C.hedge2 : C.hedge), mat(x, y + 1.95 * s, z), 0.08);
  else M.add(new THREE.ConeGeometry(0.8 * s, 2.6 * s, 14), (v, o) => o.set(v.y > 0 ? C.hedge2 : C.hedge), mat(x, y + 2.4 * s, z), 0.06);
}

/** a lamp post (returns the lamp's position) */
export function lampPost(M: Mesher, x: number, y: number, z: number) {
  M.add(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 6), C.gold, mat(x, y + 1.6, z));
  M.add(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 8), C.gold, mat(x, y + 3.2, z));
  M.add(new THREE.SphereGeometry(0.3, 10, 8), C.glass, mat(x, y + 3.5, z), 0, 1.1);
  M.add(new THREE.ConeGeometry(0.3, 0.35, 8), C.gold, mat(x, y + 3.95, z));
  return new THREE.Vector3(x, y + 3.5, z);
}

/** a parterre: hedge squares around a round bed — the same in both halves of the city */
export function parterre(M: Mesher, cx: number, cz: number, s: number) {
  const y = Y_RING;
  const hedge = (x: number, z: number, w: number, d: number) => M.add(new THREE.BoxGeometry(w, 0.7, d), (v, o) => o.set(v.y > 0.1 ? C.hedge2 : C.hedge), mat(x, y + 0.35, z), 0.04);
  hedge(cx, cz - s, s * 2, 0.6);
  hedge(cx, cz + s, s * 2, 0.6);
  hedge(cx - s, cz, 0.6, s * 2);
  hedge(cx + s, cz, 0.6, s * 2);
  M.add(new THREE.TorusGeometry(s * 0.55, 0.3, 6, 24), C.hedge2, mat(cx, y + 0.25, cz, Math.PI / 2), 0.03);
  M.add(new THREE.CylinderGeometry(s * 0.35, s * 0.35, 0.3, 20), '#f2a6c4', mat(cx, y + 0.15, cz));
  topiary(M, cx, y, cz, 1, 0.8);
}

/** the tiered fountain (basins + column); the water surfaces and jets are added by the region */
export function fountain(M: Mesher) {
  const { x, z, r } = FOUNTAIN;
  const y = Y_PLAZA;
  cyl(M, x, y, z, r, r, 0.75, C.wall2, 32);
  cyl(M, x, y + 0.75, z, r + 0.12, r + 0.12, 0.12, C.gold, 32);
  cyl(M, x, y, z, 0.7, 0.55, 3.2, C.wall, 14);
  cyl(M, x, y + 2.0, z, 2.0, 1.4, 0.45, C.wall2, 24);
  cyl(M, x, y + 2.45, z, 2.06, 2.06, 0.08, C.gold, 24);
  cyl(M, x, y + 3.2, z, 1.0, 0.7, 0.35, C.wall2, 20);
  cyl(M, x, y + 3.55, z, 0.25, 0.3, 1.2, C.wall, 10);
  M.add(new THREE.SphereGeometry(0.5, 16, 12), C.gold2, mat(x, y + 5.0, z), 0, 0.5);
  return { pool: new THREE.Vector3(x, y + 0.62, z), mid: new THREE.Vector3(x, y + 2.42, z), top: new THREE.Vector3(x, y + 5.0, z) };
}

/** stone kerbs along the canals (mirrored), gold-capped */
export function canalKerbs(M: Mesher) {
  for (const sx of [-1, 1])
    for (let i = 0; i < CANAL.length - 1; i++) {
      const a = new THREE.Vector3(sx * CANAL[i][0], 0, CANAL[i][1]);
      const b = new THREE.Vector3(sx * CANAL[i + 1][0], 0, CANAL[i + 1][1]);
      const yaw = Math.atan2(b.x - a.x, b.z - a.z);
      const len = a.distanceTo(b) + 0.3;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const n = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      for (const k of [-1, 1]) {
        const p = mid.clone().addScaledVector(n, k * (CANAL_W + 0.25));
        M.add(new THREE.BoxGeometry(0.4, 0.4, len), C.wall2, mat(p.x, Y_RING + 0.1, p.z, 0, yaw, 0));
        M.add(new THREE.BoxGeometry(0.44, 0.06, len), C.gold, mat(p.x, Y_RING + 0.32, p.z, 0, yaw, 0));
      }
    }
}

/** a mooring mast for an airship (a slim tower with a ring) */
export function mast(M: Mesher, x: number, z: number, y: number) {
  cyl(M, x, y, z, 0.7, 0.35, 9, C.wall, 10);
  cyl(M, x, y + 9, z, 0.6, 0.6, 0.2, C.gold, 12);
  M.add(new THREE.TorusGeometry(0.75, 0.1, 6, 16), C.gold, mat(x, y + 9.4, z, Math.PI / 2));
  M.add(new THREE.SphereGeometry(0.25, 8, 6), C.glass, mat(x, y + 9.8, z), 0, 1);
  return new THREE.Vector3(x, y + 9.4, z);
}

/** a pier over the void (deck, posts, gold rail) from (x0,z0) along angle `ang` */
export function pier(M: Mesher, x0: number, z0: number, ang: number, len: number, y: number, w = 2.6) {
  const d = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
  const s = new THREE.Vector3(-d.z, 0, d.x);
  const yaw = Math.atan2(d.x, d.z);
  const mid = new THREE.Vector3(x0, y, z0).addScaledVector(d, len / 2);
  M.add(new THREE.BoxGeometry(w, 0.3, len), C.wall2, mat(mid.x, y - 0.15, mid.z, 0, yaw, 0));
  M.add(new THREE.BoxGeometry(w + 0.1, 0.08, len), C.wood, mat(mid.x, y + 0.02, mid.z, 0, yaw, 0));
  for (const k of [-1, 1]) {
    const p = mid.clone().addScaledVector(s, (k * w) / 2);
    M.add(new THREE.BoxGeometry(0.1, 0.1, len), C.gold, mat(p.x, y + 1.0, p.z, 0, yaw, 0));
    for (let i = 0; i <= 5; i++) {
      const q = new THREE.Vector3(x0, y, z0).addScaledVector(d, (i / 5) * len).addScaledVector(s, (k * w) / 2);
      M.add(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 5), C.gold, mat(q.x, y + 0.5, q.z));
    }
  }
  // gold brackets under the deck
  for (let i = 1; i <= 3; i++) {
    const q = new THREE.Vector3(x0, y, z0).addScaledVector(d, (i / 4) * len);
    M.add(new THREE.BoxGeometry(w * 0.9, 0.9, 0.2), C.gold, mat(q.x, y - 0.75, q.z, 0, yaw, 0));
  }
  return { end: new THREE.Vector3(x0, y, z0).addScaledVector(d, len), d, s };
}

/** a thin arched bridge from a to b (decorative: it leads to the twin garden islets) */
export function bridge(M: Mesher, a: THREE.Vector3, b: THREE.Vector3, rise: number) {
  const N = 14;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push(a.clone().lerp(b, t).add(new THREE.Vector3(0, Math.sin(t * Math.PI) * rise, 0)));
  }
  for (let i = 0; i < N; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    const mid = p.clone().add(q).multiplyScalar(0.5);
    const yaw = Math.atan2(q.x - p.x, q.z - p.z);
    const pitch = Math.atan2(q.y - p.y, Math.hypot(q.x - p.x, q.z - p.z));
    const len = p.distanceTo(q) + 0.05;
    M.add(new THREE.BoxGeometry(2.2, 0.3, len), C.wall2, mat(mid.x, mid.y, mid.z, -pitch, yaw, 0, 1, 1, 1));
    const sd = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    for (const k of [-1, 1]) {
      const r = mid.clone().addScaledVector(sd, k * 1.05);
      M.add(new THREE.BoxGeometry(0.1, 0.1, len), C.gold, mat(r.x, r.y + 0.9, r.z, -pitch, yaw, 0));
      if (i % 2 === 0) M.add(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 4), C.gold, mat(r.x, r.y + 0.45, r.z));
    }
  }
  // the arch underneath
  const under = pts.map((p, i) => p.clone().add(new THREE.Vector3(0, -0.3 - Math.sin((i / N) * Math.PI) * rise * 0.6 - 0.8, 0)));
  tube(M, under, 0.32, 0.32, C.wall, 0, 6);
}

/** the twin garden islets (E/W): a lawn, a gazebo with a gold dome, a perfect round tree */
export function satellites(M: Mesher, rng: () => number, L: CityLights) {
  for (const s of SATELLITES) {
    const loc = new Mesher(true);
    islet(loc, rng, { r: s.r, seed: 7, pal: MARBLE, grass: ['#a8dca0', '#b4e2a6'], trees: 0, roots: 8, deep: 1.1 });
    const g = loc.build();
    g.translate(s.x, s.y, s.z);
    M.tris(Array.from(g.attributes.position.array as Float32Array), Array.from(g.attributes.color.array as Float32Array), Array.from(g.attributes.aSway.array as Float32Array), Array.from(g.attributes.aGlow.array as Float32Array));
    g.dispose();
    const y = s.y + 0.3;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      M.add(new THREE.CylinderGeometry(0.16, 0.18, 3.0, 8), C.wall, mat(s.x + Math.cos(a) * 2.2, y + 1.5, s.z + Math.sin(a) * 2.2));
    }
    M.add(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 18), C.wall2, mat(s.x, y + 3.15, s.z));
    M.add(new THREE.SphereGeometry(2.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), C.gold2, mat(s.x, y + 3.3, s.z));
    M.add(new THREE.CylinderGeometry(2.4, 2.4, 0.2, 18), C.wall2, mat(s.x, y, s.z));
    topiary(M, s.x + Math.sign(s.x) * 4.5, y, s.z + 3, 0, 1.2);
    topiary(M, s.x + Math.sign(s.x) * 4.5, y, s.z - 3, 0, 1.2);
    L.lamps.push(new THREE.Vector3(s.x, y + 2.2, s.z));
  }
}

/** the noticeboard «Reglas de la Ciudad» frame (the text is a canvas texture added by the region) */
export function boardFrame(M: Mesher) {
  const { x, z } = BOARD;
  const y = height(x, z);
  for (const sx of [-1, 1]) M.add(new THREE.CylinderGeometry(0.14, 0.16, 3.6, 8), C.gold, mat(x + sx * 1.9, y + 1.8, z));
  M.add(new THREE.BoxGeometry(4.1, 2.7, 0.18), C.gold, mat(x, y + 2.35, z - 0.04));
  M.add(new THREE.SphereGeometry(0.22, 8, 6), C.gold2, mat(x - 1.9, y + 3.7, z));
  M.add(new THREE.SphereGeometry(0.22, 8, 6), C.gold2, mat(x + 1.9, y + 3.7, z));
  return new THREE.Vector3(x, y + 2.35, z + 0.06);
}

/** the complaints box: a little gold post box by the embassy (always empty) */
export function buzon(M: Mesher) {
  const { x, z } = BUZON;
  const y = height(x, z);
  M.add(new THREE.CylinderGeometry(0.12, 0.14, 1.1, 8), C.gold, mat(x, y + 0.55, z));
  M.add(new THREE.BoxGeometry(0.8, 0.9, 0.6), C.gold2, mat(x, y + 1.5, z));
  M.add(new THREE.BoxGeometry(0.5, 0.06, 0.05), '#6a4a1a', mat(x - 0.41, y + 1.7, z, 0, Math.PI / 2, 0));
  const roof = new THREE.CylinderGeometry(0.45, 0.45, 0.85, 12, 1, false, 0, Math.PI);
  M.add(roof, C.gold, mat(x, y + 1.95, z, 0, 0, Math.PI / 2));
  return new THREE.Vector3(x, y + 1.6, z);
}

/** everything static of the city in one mesher; returns key points the region needs */
export function city(M: Mesher, rng: () => number) {
  const L: CityLights = { lamps: [], windows: [] };
  const jars: THREE.Vector3[] = [];
  // crown tower (the crown itself is a separate, turning mesh) and its acropolis steps
  cyl(M, ACRO.x, Y_ACRO - 0.05, ACRO.z, 5.6, 5.4, 0.5, C.wall2, 8);
  const crownBase = tower(M, L, ACRO.x, ACRO.z, Y_ACRO + 0.45, { r: 3.5, h: 11, cap: 'flat', rows: 2 });
  const t2 = tower(M, L, ACRO.x, ACRO.z, crownBase - 0.2, { r: 2.6, h: 7, cap: 'flat', rows: 1 });
  const crownTop = tower(M, L, ACRO.x, ACRO.z, t2 - 0.2, { r: 1.8, h: 5, cap: 'dome', rows: 1, capColor: C.gold2 });
  // flanking towers, gate towers, gate
  for (const sx of [-1, 1]) {
    tower(M, L, sx * 12, -28.5, Y_RING, { r: 2.2, h: 13, cap: 'dome' });
    tower(M, L, sx * GATE.dx, GATE.z, Y_RING, { r: 1.5, h: 8, cap: 'cone' });
  }
  archway(M, new THREE.Vector3(-GATE.dx + 1.6, Y_RING, GATE.z), new THREE.Vector3(GATE.dx - 1.6, Y_RING, GATE.z), 5.5, 0.8);
  colonnade(M, PLAZA_R - 1.4, Y_PLAZA, 4.2);
  const embassyDoor = embassy(M, L);
  market(M, L, jars);
  const f = fountain(M);
  canalKerbs(M);
  // the avenue: identical topiaries and lamps, mirrored, at identical intervals
  for (let z = AVENUE.z0 + 2.5, i = 0; z < AVENUE.z1 - 9; z += 3.4, i++)
    for (const sx of [-1, 1]) {
      const x = sx * (AVENUE.w + 1.2);
      if (i % 2) L.lamps.push(lampPost(M, x, Y_RING, z));
      else topiary(M, x, Y_RING, z, (i / 2) % 2 ? 1 : 0);
    }
  // lamps around the plaza (on the axes' sides) and along the promenade
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    L.lamps.push(lampPost(M, Math.cos(a) * (PLAZA_R + 2.2), Y_RING, Math.sin(a) * (PLAZA_R + 2.2)));
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    const r = rimR(a) * 0.88;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 6 && z > 20) continue;
    if (i % 2) L.lamps.push(lampPost(M, x, Y_RING, z));
    else topiary(M, x, Y_RING, z, 0, 0.9);
  }
  // parterres (mirrored)
  for (const sx of [-1, 1]) {
    parterre(M, sx * 15, 21, 3.2);
    parterre(M, sx * 22.5, 14.5, 2.6);
  }
  // piers: south (your ship), SW and SE (the airships' masts)
  const south = pier(M, PIER_S.x, PIER_S.z0, Math.PI / 2, PIER_S.z1 - PIER_S.z0, PIER_S.y, 2.8);
  const masts: THREE.Vector3[] = [];
  for (const p of PIERS) {
    const r0 = rimR(p.ang) * 0.9;
    const pr = pier(M, Math.cos(p.ang) * r0, Math.sin(p.ang) * r0, p.ang, 12, Y_RING + 0.05, 2.4);
    masts.push(mast(M, pr.end.x + pr.d.x * 1.2, pr.end.z + pr.d.z * 1.2, Y_RING - 6));
  }
  // bridges to the twin islets
  for (const s of SATELLITES) {
    const sx = Math.sign(s.x);
    bridge(M, new THREE.Vector3(sx * (rimR(sx > 0 ? 0 : Math.PI) * 0.97), Y_RING, s.z), new THREE.Vector3(s.x - sx * s.r * 0.75, s.y + 0.4, s.z), 2.2);
  }
  satellites(M, rng, L);
  // crisp gold inlays (geometry: paint at vertex resolution would only give dotted lines)
  const ringAt = (r: number, y: number, x = 0, z = 0, tube = 0.09) => M.add(new THREE.TorusGeometry(r, tube, 3, 96), C.gold, mat(x, y, z, Math.PI / 2, 0, 0, 1, 1, 0.25));
  ringAt(PLAZA_R - 0.5, Y_PLAZA + 0.01);
  ringAt(9.6, Y_PLAZA + 0.01, 0, 0, 0.07);
  ringAt(ACRO.r - 0.7, Y_ACRO + 0.01, ACRO.x, ACRO.z);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r0 = FOUNTAIN.r + 1.2;
    const r1 = 9.4;
    M.add(new THREE.BoxGeometry(r1 - r0, 0.03, 0.12), C.gold, mat(Math.cos(a) * (r0 + r1) / 2, Y_PLAZA + 0.012, Math.sin(a) * (r0 + r1) / 2, 0, -a, 0));
  }
  for (const sx of [-1, 1]) M.add(new THREE.BoxGeometry(0.14, 0.03, AVENUE.z1 - AVENUE.z0 - 2), C.gold, mat(sx * AVENUE.w, Y_RING + 0.012, (AVENUE.z0 + AVENUE.z1) / 2 - 1));
  const board = boardFrame(M);
  const box = buzon(M);
  return { L, jars, fountain: f, crownTop, embassyDoor, south, masts, board, box };
}
