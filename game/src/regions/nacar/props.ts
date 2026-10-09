/**
 * Isla Nácar's built world: the crystal crown of the mountain, lilac rock, mother-of-pearl shells,
 * pearl tide pools, the ground light layer, the «corazón de cristal» (rock portal, crystal door,
 * tunnel) and REGISTRO 000's far spire. Repeated things are instanced (one draw call per kind).
 */
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { toonGradient } from '../../engine/world/heightfield';
import {
  CAVE_DEPTH,
  DOOR,
  GEODE,
  MIRRORS,
  MOUNT,
  POOLS,
  POOL_Y,
  PRISM,
  SHELLS,
  SPIRE,
  TERRACE,
  CLUSTERS,
  CORRIDOR,
  coastR,
  height,
} from './layout';
import { caveMaterial, pathMaterial, crystalMaterial, doorMaterial, groundLightMaterial, haloMaterial, nacreMaterial, poolMaterial, type Lit } from './materials';

type Rng = () => number;

export const PAL = {
  pearl: new THREE.Color('#F7F2FF'),
  sky: new THREE.Color('#8FD3FF'),
  lilac: new THREE.Color('#B79CFF'),
  teal: new THREE.Color('#6FE0C8'),
  deep: new THREE.Color('#7f6cf0'),
  rose: new THREE.Color('#f3b8e6'),
};

// ───────────────────────────── geometry ─────────────────────────────
/** a faceted crystal of unit height (base sunk a little), `sides` facets, pointed tip */
function crystalGeo(rng: Rng, sides: number, tip: number, shoulder: number, irregular: number, tipOff = 0) {
  const ring: [number, number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + (rng() - 0.5) * irregular;
    const r = 1 + (rng() - 0.5) * irregular;
    ring.push([Math.cos(a) * r, Math.sin(a) * r, 1]);
  }
  const y0 = -0.1;
  const y1 = 1 - tip;
  const T = [tipOff, 1, tipOff * 0.4];
  const p: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % sides];
    const a0 = [a[0], y0, a[1]];
    const b0 = [b[0], y0, b[1]];
    const a1 = [a[0] * shoulder, y1, a[1] * shoulder];
    const b1 = [b[0] * shoulder, y1, b[1] * shoulder];
    p.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0, ...a1, ...T, ...b1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.computeVertexNormals();
  return g;
}

/** a lumpy faceted boulder (jitter on welded vertices so it stays closed) */
function rockGeo(rng: Rng) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 1);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const k = 0.82 + rng() * 0.36;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.9, p.getZ(i) * k);
  }
  g = g.toNonIndexed();
  g.computeVertexNormals();
  return g;
}

/** half a scallop: a ribbed dome on its rim, hinge at the origin, opening toward +z (uv: radial, angular) */
function shellGeo() {
  const NU = 14;
  const NV = 40;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= NU; i++) {
    const u = i / NU;
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      const th = (v - 0.5) * 2.4;
      const rib = Math.abs(Math.sin(v * Math.PI * 9));
      const rr = u * (1 + 0.06 * rib * u);
      const y = 0.42 * Math.pow(Math.sin(Math.PI * Math.min(u, 1)), 0.85) * Math.pow(Math.cos(th * 0.55), 0.6) + 0.035 * rib * u * (1 - u * 0.6);
      pos.push(Math.sin(th) * rr, y, Math.cos(th) * rr * 0.95);
      uv.push(u, v);
    }
  }
  for (let i = 0; i < NU; i++)
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j;
      const b = a + NV + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** the door's pointed arch (CCW polygon, local XY, base at y = 0) */
export function archOutline(W = DOOR.w) {
  const s = 2.9;
  const c = W * 0.3;
  const rho = W / 2 + c;
  const aPeak = Math.acos(-c / rho);
  const pts: THREE.Vector2[] = [new THREE.Vector2(-W / 2, 0), new THREE.Vector2(-W / 2, 1), new THREE.Vector2(-W / 2, 2), new THREE.Vector2(-W / 2, s)];
  for (let k = 1; k <= 6; k++) {
    const a = Math.PI - ((Math.PI - aPeak) * k) / 6;
    pts.push(new THREE.Vector2(c + rho * Math.cos(a), s + rho * Math.sin(a)));
  }
  for (let k = 1; k <= 6; k++) {
    const a = (Math.PI - aPeak) * (1 - k / 6);
    pts.push(new THREE.Vector2(-c + rho * Math.cos(a), s + rho * Math.sin(a)));
  }
  pts.push(new THREE.Vector2(W / 2, 2), new THREE.Vector2(W / 2, 1), new THREE.Vector2(W / 2, 0), new THREE.Vector2(W / 4, 0), new THREE.Vector2(0, 0), new THREE.Vector2(-W / 4, 0));
  return pts.reverse(); // built clockwise → CCW
}

// ───────────────────────────── placement helpers ─────────────────────────────
export interface CrystalSpot {
  x: number;
  z: number;
  /** base y (defaults to the terrain) */
  y?: number;
  h: number;
  r: number;
  color: THREE.Color;
  /** lean (radians) and the direction it leans to (yaw) */
  lean?: number;
  leanTo?: number;
  variant?: 0 | 1;
}

const o3 = new THREE.Object3D();
const up = new THREE.Vector3(0, 1, 0);

/** every crystal of the island in two instanced meshes (two facet variants), plus their tips (glints) */
export function crystalMeshesFor(L: Lit, rng: Rng) {
  const spots = crystalSpots(rng);
  const geos = [crystalGeo(rng, 6, 0.24, 0.9, 0.25), crystalGeo(rng, 5, 0.38, 0.82, 0.45, 0.22)];
  const mat = crystalMaterial(L, { glow: 1 });
  const tips: THREE.Vector3[] = [];
  const lists: CrystalSpot[][] = [[], []];
  for (const s of spots) lists[s.variant ?? (rng() < 0.6 ? 0 : 1)].push(s);
  const meshes = lists.map((list, v) => {
    const m = new THREE.InstancedMesh(geos[v], mat, Math.max(1, list.length));
    const seed = new Float32Array(Math.max(1, list.length));
    list.forEach((s, i) => {
      const y = s.y ?? height(s.x, s.z) - 0.15;
      o3.position.set(s.x, y, s.z);
      const lean = s.lean ?? 0;
      const to = s.leanTo ?? rng() * Math.PI * 2;
      o3.quaternion.setFromAxisAngle(new THREE.Vector3(Math.sin(to), 0, -Math.cos(to)).normalize(), lean);
      o3.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(up, rng() * Math.PI * 2));
      o3.scale.set(s.r, s.h, s.r);
      o3.updateMatrix();
      m.setMatrixAt(i, o3.matrix);
      m.setColorAt(i, s.color);
      seed[i] = rng();
      if (s.h > 2.5) tips.push(new THREE.Vector3(0, 0.92, 0).applyMatrix4(o3.matrix));
    });
    m.count = list.length;
    m.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
    m.castShadow = true;
    m.receiveShadow = false;
    m.computeBoundingSphere();
    return m;
  });
  return { meshes, mat, tips };
}

const tint = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, t);

/** every crystal on the island (mountain crown, buttresses, portal, geode, knoll, spire, shards) */
export function crystalSpots(rng: Rng): CrystalSpot[] {
  const S: CrystalSpot[] = [];
  const pick = () => [PAL.sky, PAL.lilac, PAL.pearl, PAL.teal, PAL.deep][Math.floor(rng() * 5)];
  const peakY = height(MOUNT.x, MOUNT.z);
  // the crown: giant spires leaning out from the summit (concept 4)
  const crown = [
    { a: 0, d: 0, h: 22, r: 2.6, c: PAL.sky },
    { a: 0.6, d: 3.0, h: 16, r: 2.1, c: PAL.lilac },
    { a: 2.0, d: 3.3, h: 15, r: 2.0, c: PAL.pearl },
    { a: 3.1, d: 3.0, h: 17, r: 2.2, c: PAL.deep },
    { a: 4.2, d: 3.4, h: 13, r: 1.8, c: PAL.teal },
    { a: 5.2, d: 3.1, h: 14, r: 1.9, c: PAL.sky },
    { a: 1.3, d: 5.2, h: 10, r: 1.5, c: PAL.lilac },
    { a: 3.8, d: 5.5, h: 9, r: 1.4, c: PAL.sky },
    { a: 5.8, d: 5.4, h: 9.5, r: 1.4, c: PAL.lilac },
    { a: 2.6, d: 5.8, h: 8, r: 1.3, c: PAL.pearl },
  ];
  for (const c of crown) {
    const x = MOUNT.x + Math.cos(c.a) * c.d;
    const z = MOUNT.z + Math.sin(c.a) * c.d;
    S.push({ x, z, y: peakY - 2.5 - c.d * 0.6, h: c.h, r: c.r, color: c.c, lean: c.d ? 0.18 + c.d * 0.035 : 0.04, leanTo: c.a + Math.PI / 2, variant: c.d > 4 ? 1 : 0 });
  }
  // buttresses: clusters climbing the slopes
  for (let i = 0; i < 46; i++) {
    const a = rng() * Math.PI * 2;
    const d = 6 + rng() * 9;
    const x = MOUNT.x + Math.cos(a) * d;
    const z = MOUNT.z + Math.sin(a) * d;
    if (z > DOOR.z - 4 && Math.abs(x - DOOR.x) < 7) continue; // keep the portal readable
    const hgt = height(x, z);
    if (hgt < 2.5) continue;
    const k = 1 - (d - 6) / 9;
    S.push({ x, z, h: 2 + k * 5 + rng() * 2.5, r: 0.45 + k * 0.6 + rng() * 0.3, color: pick(), lean: 0.25 + rng() * 0.35, leanTo: a + Math.PI / 2 + (rng() - 0.5) * 0.6 });
  }
  // the portal: tall crystals flanking the door, leaning away from it
  const px = DOOR.x;
  const pz = DOOR.z - 1.2;
  const flank = [
    { dx: -4.2, dz: 0.4, h: 9.5, r: 1.15, c: PAL.lilac, lean: 0.32, to: -1 },
    { dx: -5.6, dz: -0.6, h: 6.5, r: 0.9, c: PAL.sky, lean: 0.5, to: -1 },
    { dx: -3.6, dz: 1.6, h: 3.4, r: 0.6, c: PAL.pearl, lean: 0.55, to: -1 },
    { dx: 4.3, dz: 0.3, h: 10.5, r: 1.2, c: PAL.sky, lean: 0.3, to: 1 },
    { dx: 5.9, dz: -0.8, h: 7, r: 0.95, c: PAL.deep, lean: 0.48, to: 1 },
    { dx: 3.7, dz: 1.7, h: 3.0, r: 0.55, c: PAL.teal, lean: 0.6, to: 1 },
    { dx: 0.4, dz: -2.6, h: 6, r: 1.0, c: PAL.pearl, lean: 0.1, to: 1 },
    { dx: -1.8, dz: -3.0, h: 4.5, r: 0.8, c: PAL.lilac, lean: 0.2, to: -1 },
  ];
  for (const f of flank) {
    const x = px + f.dx;
    const z = pz + f.dz;
    const y = f.dz < -2 ? TERRACE + 7.2 : TERRACE - 0.3;
    S.push({ x, z, y, h: f.h, r: f.r, color: f.c, lean: f.lean, leanTo: f.to > 0 ? Math.PI / 2 : -Math.PI / 2, variant: 0 });
  }
  // the geode outcrop (catches the beam when the first mirror lets it pass)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rng() * 0.4;
    const d = i === 0 ? 0 : 0.9 + rng() * 0.5;
    S.push({ x: GEODE.x + Math.cos(a) * d, z: GEODE.z + Math.sin(a) * d, y: TERRACE - 0.2, h: i === 0 ? 4.2 : 1.8 + rng() * 1.6, r: i === 0 ? 0.8 : 0.4 + rng() * 0.25, color: i % 2 ? PAL.deep : PAL.lilac, lean: i === 0 ? 0.05 : 0.45, leanTo: a + Math.PI / 2, variant: 1 });
  }
  // clusters on the meadow and the beach
  for (const c of CLUSTERS) {
    const n = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng() * 0.5;
      const d = i === 0 ? 0 : 0.5 + rng() * 0.6;
      S.push({ x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d, h: i === 0 ? c.h : c.h * (0.35 + rng() * 0.4), r: i === 0 ? 0.5 + c.h * 0.08 : 0.25 + rng() * 0.15, color: pick(), lean: i === 0 ? 0.08 : 0.4 + rng() * 0.3, leanTo: a + Math.PI / 2, variant: i % 2 ? 1 : 0 });
    }
  }
  // the knoll: a ring of small crystals around the prism's pedestal
  const ky = height(PRISM.x, PRISM.z);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    S.push({ x: PRISM.x + Math.cos(a) * 2.6, z: PRISM.z + Math.sin(a) * 2.6, y: ky - 0.3, h: 1.2 + (i % 3) * 0.6, r: 0.3, color: i % 2 ? PAL.sky : PAL.pearl, lean: 0.4, leanTo: a + Math.PI / 2, variant: 0 });
  }
  // REGISTRO 000's spire top
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    S.push({ x: SPIRE.x + Math.cos(a) * 1.3, z: SPIRE.z + Math.sin(a) * 1.3, y: SPIRE.top - 1.4, h: 2.6 + (i % 2) * 1.6, r: 0.42, color: i % 2 ? PAL.lilac : PAL.sky, lean: 0.5, leanTo: a + Math.PI / 2, variant: 1 });
  }
  // shards: tiny crystals sprouting from the meadow and the beach
  for (let i = 0; i < 90; i++) {
    const x = (rng() - 0.5) * 76;
    const z = (rng() - 0.5) * 76;
    const cr = coastR(x, z);
    if (cr > 0.86 || cr < 0.1) continue;
    const h = height(x, z);
    if (h < 0.7) continue;
    if (Math.abs(x - DOOR.x) < 7 && z < DOOR.z + 6 && z > DOOR.z - 10) continue;
    if (MIRRORS.some((m) => Math.hypot(x - m.x, z - m.z) < 3.5)) continue;
    const n = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < n; k++) S.push({ x: x + (rng() - 0.5) * 0.9, z: z + (rng() - 0.5) * 0.9, h: 0.5 + rng() * 0.9, r: 0.14 + rng() * 0.1, color: tint(pick(), PAL.pearl, 0.3), lean: 0.2 + rng() * 0.5 });
  }
  return S;
}

type RockSpot = { x: number; y: number; z: number; s: [number, number, number]; c: THREE.Color; kind: 0 | 1; lean?: number; leanTo?: number };

/** where the stone goes: boulders (kind 0) and pointed stone spires (kind 1, the concept's grey spikes) */
function rockSpots(rng: Rng) {
  const R: RockSpot[] = [];
  const stone = (t: number) => new THREE.Color('#9488b8').lerp(new THREE.Color('#cbc1e6'), t);
  const dz = DOOR.z;
  // the portal: boulders that tie the stone arch into the mountain (and roof the tunnel)
  const portal: [number, number, number, number, number, number][] = [
    // x, y (above the terrace), z offset from the door, sx, sy, sz
    [-6.6, 1.0, -2.6, 2.6, 3.2, 3.0],
    [6.8, 0.8, -2.8, 2.6, 3.2, 3.0],
    [-6.0, 5.6, -4.4, 2.6, 3.0, 3.2],
    [6.2, 5.4, -4.6, 2.6, 3.0, 3.2],
    [0, 10.6, -5.4, 4.2, 2.4, 3.8],
    [-4.6, 8.2, -8.2, 3.4, 4.0, 3.6],
    [4.8, 8.0, -8.4, 3.4, 4.0, 3.6],
    [0, 9.8, -10.4, 4.4, 3.4, 4.0],
    [-8.6, 0.4, -0.4, 1.5, 1.2, 1.4],
    [8.8, 0.3, -0.6, 1.4, 1.1, 1.3],
  ];
  for (const p of portal) R.push({ x: DOOR.x + p[0], y: TERRACE + p[1], z: dz + p[2], s: [p[3], p[4], p[5]], c: stone(0.15 + rng() * 0.4), kind: 0 });
  // stone spires crowning the arch
  const archSp: [number, number, number, number, number][] = [
    // x, y, z off, height, lean
    [-3.9, 8.0, -2.0, 4.2, -0.35],
    [3.8, 8.2, -2.2, 4.8, 0.32],
    [-1.4, 11.4, -3.6, 3.6, -0.15],
    [1.6, 11.6, -3.8, 4.4, 0.2],
  ];
  for (const [x, y, z, h, lean] of archSp) R.push({ x: DOOR.x + x, y: TERRACE + y, z: dz + z, s: [0.9, h, 0.9], c: stone(0.35 + rng() * 0.3), kind: 1, lean: Math.abs(lean), leanTo: lean > 0 ? Math.PI / 2 : -Math.PI / 2 });
  // the mountain's grey spires, between the crown's crystals and down the buttresses
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + rng() * 0.25;
    const d = i % 2 ? 4.5 + rng() * 3 : 8 + rng() * 6;
    const x = MOUNT.x + Math.cos(a) * d;
    const z = MOUNT.z + Math.sin(a) * d;
    if (z > DOOR.z - 7 && Math.abs(x - DOOR.x) < 7) continue;
    const hh = height(x, z);
    const k = 1 - Math.min(1, (d - 4.5) / 10);
    R.push({ x, y: hh - 0.6, z, s: [1.0 + k * 0.9, 4 + k * 8 + rng() * 3, 1.0 + k * 0.9], c: stone(0.2 + rng() * 0.5), kind: 1, lean: 0.12 + (1 - k) * 0.3, leanTo: a + Math.PI / 2 });
  }
  // REGISTRO 000's perch: a lone basalt column at sea, with stones at its foot
  R.push({ x: SPIRE.x, y: SPIRE.top - 7.4, z: SPIRE.z, s: [1.9, 8.2, 1.9], c: stone(0.25), kind: 0 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    R.push({ x: SPIRE.x + Math.cos(a) * 2.2, y: -0.6 - (i % 2) * 0.4, z: SPIRE.z + Math.sin(a) * 2.2, s: [1.3, 1.6 + (i % 2), 1.2], c: stone(0.1 + i * 0.1), kind: 0 });
  }
  R.push({ x: SPIRE.x - 2.6, y: -1, z: SPIRE.z + 1.4, s: [0.8, 6, 0.8], c: stone(0.3), kind: 1, lean: 0.25, leanTo: 2 });
  // tide pool shelf: rocks around the rims
  for (const p of POOLS) {
    const n = Math.round(p.r * 2.4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng();
      const x = p.x + Math.cos(a) * (p.r + 0.25);
      const z = p.z + Math.sin(a) * (p.r + 0.25);
      const sz = 0.35 + rng() * 0.4;
      R.push({ x, y: height(x, z) + 0.05, z, s: [sz * 1.3, sz * 0.8, sz], c: stone(0.3 + rng() * 0.4), kind: 0 });
    }
  }
  // a few boulders on the meadow
  for (let i = 0; i < 16; i++) {
    const x = (rng() - 0.5) * 60;
    const z = (rng() - 0.5) * 60 + 4;
    if (coastR(x, z) > 0.78 || height(x, z) < 0.8) continue;
    if (Math.abs(x - DOOR.x) < 9 && z > DOOR.z - 4 && z < DOOR.z + 6) continue;
    if (MIRRORS.some((m) => Math.hypot(x - m.x, z - m.z) < 4)) continue;
    if (Math.abs(z - MIRRORS[1].z) < 2.5 && x > -2 && x < 22) continue; // keep the beam's corridor clear
    if (Math.abs(x - MIRRORS[0].x) < 2.5 && z > -2 && z < 15) continue;
    if (Math.abs(x - DOOR.x) < 2.5 && z > DOOR.z && z < 15) continue;
    const sz = 0.5 + rng() * 0.8;
    R.push({ x, y: height(x, z) + sz * 0.1, z, s: [sz * 1.2, sz, sz * 1.1], c: stone(rng() * 0.6), kind: 0 });
  }
  return R;
}

export function rocks(rng: Rng) {
  const spots = rockSpots(rng);
  const mat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonGradient() });
  const geos = [rockGeo(rng), crystalGeo(rng, 5, 0.42, 0.6, 0.35, 0.12)];
  return geos.map((geo, kind) => {
    const list = spots.filter((s) => s.kind === kind);
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((s, i) => {
      o3.position.set(s.x, s.y, s.z);
      if (kind === 1) {
        o3.quaternion.setFromAxisAngle(new THREE.Vector3(Math.sin(s.leanTo ?? 0), 0, -Math.cos(s.leanTo ?? 0)).normalize(), s.lean ?? 0);
        o3.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(up, rng() * Math.PI * 2));
      } else o3.quaternion.setFromEuler(new THREE.Euler(rng() * 0.3, rng() * Math.PI * 2, rng() * 0.3));
      o3.scale.set(...s.s);
      o3.updateMatrix();
      m.setMatrixAt(i, o3.matrix);
      m.setColorAt(i, s.c);
    });
    m.count = list.length;
    m.castShadow = true;
    m.receiveShadow = true;
    m.computeBoundingSphere();
    return m;
  });
}

/** the stone arch around the crystal door (hewn faces, flat-shaded) */
function stoneArch() {
  const inner = archOutline(DOOR.w + 0.5);
  const outer = archOutline(DOOR.w + 4.2).map((p) => new THREE.Vector2(p.x, p.y * 1.22));
  // both outlines share the same vertex order (CCW from the bottom-right corner…)
  const pos: number[] = [];
  const jz = (i: number, k: number) => 0.55 + 0.35 * Math.sin(i * 2.3 + k * 1.7);
  const n = inner.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = inner[i];
    const b = inner[j];
    const c = outer[i];
    const d = outer[j];
    if (a.y < 0.01 && b.y < 0.01) continue; // no bottom edge
    const za = jz(i, 0);
    const zb = jz(j, 0);
    const zc = jz(i, 1) - 0.2;
    const zd = jz(j, 1) - 0.2;
    // front face (+z): inner ring → outer ring
    pos.push(a.x, a.y, za, d.x, d.y, zd, c.x, c.y, zc, a.x, a.y, za, b.x, b.y, zb, d.x, d.y, zd);
    // inner reveal (toward the tunnel)
    pos.push(a.x, a.y, za, a.x, a.y, -1.2, b.x, b.y, -1.2, a.x, a.y, za, b.x, b.y, -1.2, b.x, b.y, zb);
    // outer side (into the mountain)
    pos.push(c.x, c.y, zc, d.x, d.y, -3.5, c.x, c.y, -3.5, c.x, c.y, zc, d.x, d.y, zd, d.x, d.y, -3.5);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshToonMaterial({ color: '#b3a8d6', gradientMap: toonGradient(), side: THREE.DoubleSide }));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ───────────────────────────── shells & pearls ─────────────────────────────
export function shellsAndPearls(L: Lit, rng: Rng) {
  const shellM: THREE.Matrix4[] = [];
  const pearlM: THREE.Matrix4[] = [];
  const pearlPos: THREE.Vector3[] = [];
  const mk = (p: THREE.Vector3, q: THREE.Quaternion, s: THREE.Vector3) => new THREE.Matrix4().compose(p, q, s);
  for (const sh of SHELLS) {
    const y = height(sh.x, sh.z);
    const base = new THREE.Quaternion().setFromAxisAngle(up, sh.ry);
    const S = new THREE.Vector3(sh.s, sh.s, sh.s);
    const at = new THREE.Vector3(sh.x, y - 0.08, sh.z);
    if (sh.kind === 0) {
      // open clam: a bowl (upside-down dome) and a lid hinged open, a pearl in the middle
      const bowl = base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI));
      shellM.push(mk(at.clone().add(new THREE.Vector3(0, 0.42 * sh.s, 0)), bowl, S));
      const lid = base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.95));
      shellM.push(mk(at.clone().add(new THREE.Vector3(0, 0.44 * sh.s, 0)), lid, S));
      const pp = new THREE.Vector3(0, 0.36 * sh.s, 0.45 * sh.s).applyQuaternion(base).add(at);
      pearlPos.push(pp);
      pearlM.push(mk(pp, new THREE.Quaternion(), new THREE.Vector3().setScalar(0.24 * sh.s)));
    } else {
      // a scallop resting on its rim, tipped a little
      const q = base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.12));
      shellM.push(mk(at, q, S));
    }
  }
  // little shells scattered along the beaches
  for (let i = 0; i < 60 && shellM.length < 34; i++) {
    const a = rng() * Math.PI * 2;
    const r = 0.72 + rng() * 0.14;
    const x = Math.cos(a) * 40 * r;
    const z = Math.sin(a) * 40 * r;
    const cr = coastR(x, z);
    if (cr < 0.66 || cr > 0.86) continue;
    const y = height(x, z);
    if (y < 0.35) continue;
    const s = 0.35 + rng() * 0.45;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.15 + rng() * 0.3, rng() * Math.PI * 2, (rng() - 0.5) * 0.3));
    shellM.push(mk(new THREE.Vector3(x, y - 0.03, z), q, new THREE.Vector3(s, s, s)));
  }
  // pearls in the tide pools
  for (const p of POOLS) {
    const n = 1 + Math.round(p.r);
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2;
      const d = rng() * p.r * 0.55;
      const x = p.x + Math.cos(a) * d;
      const z = p.z + Math.sin(a) * d;
      const s = 0.13 + rng() * 0.12;
      const v = new THREE.Vector3(x, Math.min(height(x, z) + s * 0.7, POOL_Y - 0.08), z);
      pearlPos.push(v);
      pearlM.push(mk(v, new THREE.Quaternion(), new THREE.Vector3().setScalar(s)));
    }
  }
  const shells = new THREE.InstancedMesh(shellGeo(), nacreMaterial(L), shellM.length);
  shellM.forEach((m, i) => shells.setMatrixAt(i, m));
  shells.castShadow = true;
  shells.computeBoundingSphere();
  const pearls = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), nacreMaterial(L, true), pearlM.length);
  pearlM.forEach((m, i) => pearls.setMatrixAt(i, m));
  pearls.computeBoundingSphere();
  return { shells, pearls, pearlPos };
}

// ───────────────────────────── tide pools ─────────────────────────────
export function tidePools(L: Lit, sky: { uZenith: THREE.IUniform; uHorizon: THREE.IUniform }) {
  const pos: number[] = [];
  const rr: number[] = [];
  const idx: number[] = [];
  const N = 28;
  for (const p of POOLS) {
    const base = pos.length / 3;
    pos.push(p.x, POOL_Y, p.z);
    rr.push(0);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const w = 1 + 0.08 * Math.sin(a * 3 + p.x) + 0.05 * Math.sin(a * 5 + p.z);
      pos.push(p.x + Math.cos(a) * p.r * w, POOL_Y, p.z + Math.sin(a) * p.r * w);
      rr.push(1);
    }
    for (let i = 0; i < N; i++) idx.push(base, base + 1 + ((i + 1) % N), base + 1 + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(rr, 1));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, poolMaterial(L, sky));
  m.renderOrder = 3;
  return m;
}

// ───────────────────────────── ground light ─────────────────────────────
/** terrain-draped patches where the beam's caustics and the prism rainbows land */
export function groundLight(L: Lit) {
  const boxes: [number, number, number, number][] = [
    [-7, 26, -9.5, 17],
    [23, 40, -10, 10],
    [CLUSTERS[0].x - 8, -7, CLUSTERS[0].z - 7, CLUSTERS[0].z + 8],
    [CLUSTERS[2].x - 8, CLUSTERS[2].x + 8, CLUSTERS[2].z - 7, CLUSTERS[2].z + 8],
  ];
  const step = 0.7;
  const pos: number[] = [];
  const idx: number[] = [];
  for (const [x0, x1, z0, z1] of boxes) {
    const nx = Math.ceil((x1 - x0) / step);
    const nz = Math.ceil((z1 - z0) / step);
    const base = pos.length / 3;
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i / nx) * (x1 - x0);
        const z = z0 + (j / nz) * (z1 - z0);
        pos.push(x, height(x, z) + 0.07, z);
      }
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const a = base + j * (nx + 1) + i;
        const b = a + nx + 1;
        if (pos[a * 3 + 1] < 0.3 && pos[(b + 1) * 3 + 1] < 0.3) continue;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const mat = groundLightMaterial(L);
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 3;
  m.frustumCulled = false;
  return { mesh: m, mat };
}

// ───────────────────────────── the nacre path ─────────────────────────────
/** hex-tiled pearl paths along the beam's corridor + round plinths under the mirrors and the plaza */
export function nacrePath(L: Lit) {
  const pos: number[] = [];
  const idx: number[] = [];
  const quadStrip = (pts: [number, number][], rows: number) => {
    const base = pos.length / 3;
    for (const [x, z] of pts) pos.push(x, height(x, z) + 0.05, z);
    const cols = pts.length / rows;
    for (let r = 0; r < rows - 1; r++)
      for (let c = 0; c < cols - 1; c++) {
        const a = base + r * cols + c;
        const b = a + cols;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
  };
  const W = 1.15;
  for (let i = 0; i < CORRIDOR.length - 1; i++) {
    const [ax, az] = CORRIDOR[i];
    const [bx, bz] = CORRIDOR[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / len;
    const uz = (bz - az) / len;
    const n = Math.ceil(len / 0.6);
    const pts: [number, number][] = [];
    for (let r = 0; r <= 4; r++) {
      const s = -W + (r / 4) * 2 * W;
      for (let k = 0; k <= n; k++) pts.push([ax + ux * (k / n) * len - uz * s, az + uz * (k / n) * len + ux * s]);
    }
    quadStrip(pts, 5);
  }
  const disc = (cx: number, cz: number, R: number) => {
    const rings = 6;
    const seg = 40;
    const pts: [number, number][] = [];
    for (let r = 0; r <= rings; r++)
      for (let k = 0; k <= seg; k++) {
        const a = (k / seg) * Math.PI * 2;
        const rr = (r / rings) * R;
        pts.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]);
      }
    quadStrip(pts, rings + 1);
  };
  for (const m of MIRRORS) disc(m.x, m.z, 2.3);
  disc(DOOR.x, DOOR.z + 2.6, 3.4);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, pathMaterial(L));
  m.receiveShadow = true;
  return m;
}

// ───────────────────────────── halos (soft bloom) ─────────────────────────────
export class Halos {
  readonly mesh: THREE.InstancedMesh;
  private n = 0;
  private c = new THREE.Color();
  constructor(readonly max = 64) {
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMaterial(), max);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 8;
  }
  begin() {
    this.n = 0;
  }
  add(p: THREE.Vector3, size: number, color: THREE.ColorRepresentation, k = 1) {
    if (this.n >= this.max || k <= 0.003 || size <= 0) return;
    o3.position.copy(p);
    o3.quaternion.identity();
    o3.scale.setScalar(size);
    o3.updateMatrix();
    this.mesh.setMatrixAt(this.n, o3.matrix);
    this.mesh.setColorAt(this.n, this.c.set(color).multiplyScalar(k));
    this.n++;
  }
  end() {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

// ───────────────────────────── the corazón de cristal ─────────────────────────────
interface ShardBuf {
  pos: number[];
  center: number[];
  dir: number[];
  axis: number[];
  rnd: number[];
  edge: number[];
}

function pushShard(b: ShardBuf, poly: THREE.Vector2[], rng: Rng, th: number) {
  const c = poly.reduce((a, p) => a.add(p), new THREE.Vector2()).multiplyScalar(1 / poly.length);
  const P = poly.map((p) => c.clone().add(p.clone().sub(c).multiplyScalar(0.965)));
  const tx = (rng() - 0.5) * 0.14;
  const ty = (rng() - 0.5) * 0.14;
  const zf = (p: THREE.Vector2) => th / 2 + (p.x - c.x) * tx + (p.y - c.y) * ty + 0.04;
  const zb = -th / 2;
  const cz = 0;
  const dir = new THREE.Vector3(c.x * 0.32 + (rng() - 0.5) * 0.4, (c.y - 2.9) * 0.18 + 0.55 + rng() * 0.3, 1 + rng() * 0.7).normalize();
  const axis = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
  const r = rng();
  const v = (x: number, y: number, z: number, e: number) => {
    b.pos.push(x, y, z);
    b.center.push(c.x, c.y, cz);
    b.dir.push(dir.x, dir.y, dir.z);
    b.axis.push(axis.x, axis.y, axis.z);
    b.rnd.push(r);
    b.edge.push(e);
  };
  const cf = zf(c);
  for (let k = 0; k < P.length; k++) {
    const p = P[k];
    const q = P[(k + 1) % P.length];
    // front (faces +z)
    v(c.x, c.y, cf, 0);
    v(p.x, p.y, zf(p), 1);
    v(q.x, q.y, zf(q), 1);
    // back
    v(c.x, c.y, zb, 0);
    v(q.x, q.y, zb, 1);
    v(p.x, p.y, zb, 1);
    // side
    v(p.x, p.y, zf(p), 1);
    v(p.x, p.y, zb, 1);
    v(q.x, q.y, zb, 1);
    v(p.x, p.y, zf(p), 1);
    v(q.x, q.y, zb, 1);
    v(q.x, q.y, zf(q), 1);
  }
}

/** the crystal door: ~44 shards in one mesh */
function doorMesh(L: Lit, rng: Rng) {
  const out = archOutline();
  const O = new THREE.Vector2(0, 2.9);
  const inner = out.map((p) => O.clone().add(p.clone().sub(O).multiplyScalar(0.38 + rng() * 0.2)));
  const b: ShardBuf = { pos: [], center: [], dir: [], axis: [], rnd: [], edge: [] };
  const th = 0.34;
  for (let i = 0; i < out.length; i++) {
    const j = (i + 1) % out.length;
    pushShard(b, [O, inner[i], inner[j]], rng, th);
    pushShard(b, [inner[i], out[i], out[j], inner[j]], rng, th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
  g.setAttribute('aCenter', new THREE.Float32BufferAttribute(b.center, 3));
  g.setAttribute('aDir', new THREE.Float32BufferAttribute(b.dir, 3));
  g.setAttribute('aAxis', new THREE.Float32BufferAttribute(b.axis, 3));
  g.setAttribute('aRnd', new THREE.Float32BufferAttribute(b.rnd, 1));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(b.edge, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  g.boundingSphere!.radius += 30; // shards fly
  const mat = doorMaterial(L);
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 4;
  return { mesh: m, mat };
}

/** the tunnel (an arch extruded into the mountain) and its far wall */
function tunnelMesh(L: Lit) {
  const out = archOutline(DOOR.w + 0.3);
  const D = CAVE_DEPTH;
  const pos: number[] = [];
  for (let i = 0; i < out.length; i++) {
    const p = out[i];
    const q = out[(i + 1) % out.length];
    if (p.y < 0.01 && q.y < 0.01) continue; // the floor is the terrace
    pos.push(p.x, p.y, 0.1, q.x, q.y, 0.1, q.x, q.y, -D, p.x, p.y, 0.1, q.x, q.y, -D, p.x, p.y, -D);
  }
  const walls = new THREE.BufferGeometry();
  walls.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  walls.computeVertexNormals();
  const cap = new THREE.ShapeGeometry(new THREE.Shape(out));
  cap.translate(0, 0, -D);
  const floor = new THREE.PlaneGeometry(DOOR.w + 0.3, D);
  floor.rotateX(-Math.PI / 2);
  floor.translate(0, 0.02, -D / 2);
  const mat = caveMaterial(L);
  mat.uniforms.uDepth.value = D;
  const g = new THREE.Group();
  g.add(new THREE.Mesh(walls, mat), new THREE.Mesh(cap, mat), new THREE.Mesh(floor, mat));
  return { group: g, mat };
}

export function portal(L: Lit, rng: Rng) {
  const g = new THREE.Group();
  g.position.set(DOOR.x, TERRACE, DOOR.z);
  const door = doorMesh(L, rng);
  const tunnel = tunnelMesh(L);
  g.add(tunnel.group, door.mesh, stoneArch());
  // a pearl threshold
  const step = new THREE.Mesh(new THREE.BoxGeometry(DOOR.w + 1.6, 0.3, 1.6), new THREE.MeshToonMaterial({ color: '#efe6fb', gradientMap: toonGradient() }));
  step.position.set(0, 0.05, 0.9);
  step.receiveShadow = true;
  g.add(step);
  return { group: g, door, tunnel };
}
