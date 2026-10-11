/**
 * The ruins of La Isla que Nadie Recuerda, ALL in one merged mesh (one draw call): every ruin carries both of its
 * states — BROKEN (walls knocked down, a fallen roof, its element gone cold) and WHOLE (walls, roof, the element
 * glowing again) — tagged per vertex (aRuin, memory.ts), so raising a ruin is a uniform tween: the rubble sinks
 * and the habitat grows back out of the ground. Plus the scenery that is always there: the dark lighthouse, the
 * prologue's raft with its palm and its box, barrels adrift, dry palms.
 */
import * as THREE from 'three';
import { Mesher, mat } from '../cielo/kit';
import { elLook } from '../fronteras/kit';
import type { RuinSpot } from './layout';

const STONE = '#d6c8a8';
const tmpC = new THREE.Color();
const STONE_OLD = '#b4a688';
const WOOD = '#8a5a3a';

/** a Mesher that also tags every vertex it adds with its ruin and state */
export class RuinMesher {
  readonly M = new Mesher(true);
  private tags: number[] = [];
  add(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation | ((p: THREE.Vector3, out: THREE.Color) => void), m: THREE.Matrix4, tag = -1, glow = 0) {
    const a = this.M.count;
    this.M.add(geo, color, m, 0, glow);
    for (let i = a; i < this.M.count; i++) this.tags.push(tag);
  }
  build() {
    const g = this.M.build();
    g.setAttribute('aRuin', new THREE.Float32BufferAttribute(this.tags, 1));
    this.tags = [];
    return g;
  }
}

const T_ALWAYS = 0;
const T_BROKEN = 1;
const T_WHOLE = 2;
const tag = (i: number, st: number) => i + 16 * st;

/** the element's centerpiece, whole (glowing) or broken (cold) */
function centerpiece(R: RuinMesher, el: string, x: number, y: number, z: number, s: number, tw: number, tb: number, rng: () => number) {
  const L = elLook(el);
  switch (el) {
    case 'fire':
      R.add(new THREE.ConeGeometry(1.3 * s, 2.4 * s, 9), (v, out) => out.set(v.y > 0.6 * s ? L.glow : L.main), mat(x, y + 1.2 * s, z), tw, 0.6);
      R.add(new THREE.ConeGeometry(1.3 * s, 1.3 * s, 9), '#3a3230', mat(x, y + 0.6 * s, z, 0.2, 0, 0.3), tb);
      break;
    case 'water':
      R.add(new THREE.CylinderGeometry(1.6 * s, 1.7 * s, 0.25, 14), L.main, mat(x, y + 0.35, z), tw, 0.3);
      R.add(new THREE.CylinderGeometry(0.22 * s, 0.32 * s, 1.8 * s, 8), L.light, mat(x, y + 1.2 * s, z), tw, 0.6);
      R.add(new THREE.CylinderGeometry(1.6 * s, 1.7 * s, 0.2, 14), '#9a8a6a', mat(x, y + 0.3, z), tb);
      break;
    case 'nature': {
      R.add(new THREE.CylinderGeometry(0.25 * s, 0.4 * s, 2.6 * s, 6), WOOD, mat(x, y + 1.3 * s, z), tw);
      for (let i = 0; i < 3; i++) R.add(new THREE.IcosahedronGeometry((1.1 + rng() * 0.4) * s, 1), i ? L.light : L.main, mat(x + (rng() - 0.5) * 1.2 * s, y + (2.8 + rng() * 0.8) * s, z + (rng() - 0.5) * 1.2 * s), tw, 0.15);
      R.add(new THREE.CylinderGeometry(0.3 * s, 0.42 * s, 0.9 * s, 6), '#5a4634', mat(x, y + 0.45 * s, z), tb);
      R.add(new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 1.4 * s, 4), '#5a4634', mat(x + 0.4 * s, y + 0.9 * s, z, 0, 0, -0.9), tb);
      break;
    }
    case 'ice':
      for (let i = 0; i < 4; i++) R.add(new THREE.OctahedronGeometry((0.6 + rng() * 0.5) * s, 0).scale(0.6, 1.8, 0.6), L.light, mat(x + (rng() - 0.5) * 1.6 * s, y + 1.1 * s, z + (rng() - 0.5) * 1.6 * s, 0, rng() * 3, (rng() - 0.5) * 0.4), tw, 0.6);
      R.add(new THREE.CylinderGeometry(1.3 * s, 1.3 * s, 0.08, 12), '#a8b8c0', mat(x, y + 0.32, z), tb);
      R.add(new THREE.OctahedronGeometry(0.5 * s, 0).scale(0.6, 1.4, 0.6), '#c8d0d0', mat(x + 0.6 * s, y + 0.3, z, 1.3, 0, 0.4), tb);
      break;
    case 'cosmic':
    case 'void':
    case 'gravity':
      R.add(new THREE.SphereGeometry(1.4 * s, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), L.main, mat(x, y + 0.3, z), tw, 0.45);
      R.add(new THREE.IcosahedronGeometry(0.4 * s, 1), L.light, mat(x, y + 2.4 * s, z), tw, 1);
      R.add(new THREE.SphereGeometry(1.4 * s, 10, 6, 0, Math.PI, 0, Math.PI / 2), '#4a4458', mat(x, y + 0.3, z, 0.4, 0.6, 0), tb);
      break;
    case 'magic':
      for (let i = 0; i < 5; i++) R.add(new THREE.BoxGeometry(1.1 * s, 0.26 * s, 0.8 * s), ['#c27aff', '#ff7ab8', '#7fd0ff'][i % 3], mat(x, y + 0.5 + i * 0.3 * s, z, 0, i * 0.4, 0), tw, 0.35);
      R.add(new THREE.BoxGeometry(1.1 * s, 0.26 * s, 0.8 * s), '#8a7a6a', mat(x + 0.5, y + 0.3, z, 0, 0.7, 0.2), tb);
      R.add(new THREE.BoxGeometry(1.1 * s, 0.26 * s, 0.8 * s), '#9a8a7a', mat(x - 0.6, y + 0.3, z + 0.5, 0.1, 1.9, -0.15), tb);
      break;
    default: {
      // an obelisk in the element's color: standing and lit, or toppled
      R.add(new THREE.CylinderGeometry(0.35 * s, 0.6 * s, 3 * s, 4), L.main, mat(x, y + 1.5 * s, z, 0, Math.PI / 4, 0), tw, 0.25);
      R.add(new THREE.OctahedronGeometry(0.45 * s, 0), L.glow, mat(x, y + 3.4 * s, z), tw, 1);
      R.add(new THREE.CylinderGeometry(0.35 * s, 0.6 * s, 3 * s, 4), L.dark, mat(x + 1.3 * s, y + 0.5, z + 0.3, 0, 0.4, Math.PI / 2 - 0.08), tb);
    }
  }
}

/** one habitat-ruin: yard (always), whole walls + roof + centerpiece, or rubble */
function habitatRuin(R: RuinMesher, sp: RuinSpot, rng: () => number) {
  const { x, y, z, r, i } = sp;
  const el = sp.ruin.element;
  const L = elLook(el);
  const tw = tag(i, T_WHOLE);
  const tb = tag(i, T_BROKEN);
  const ta = tag(i, T_ALWAYS);
  const s = Math.max(0.8, r / 3.4);
  // the yard
  R.add(new THREE.CylinderGeometry(r, r * 1.06, 0.34, 16), STONE, mat(x, y + 0.02, z), ta);
  // walls: a ring of segments, an open door facing the camera (+z)
  const n = 9;
  const wr = r * 0.82;
  const hh = (1.8 + Math.min(4, sp.ruin.tier) * 0.35) * s;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + Math.PI / 2;
    if (k === 0) continue; // the door
    const wx = x + Math.cos(a) * wr;
    const wz = z + Math.sin(a) * wr;
    const segW = ((Math.PI * 2 * wr) / n) * 1.02;
    R.add(new THREE.BoxGeometry(segW, hh, 0.42 * s), (v, out) => out.set(v.y > hh * 0.42 ? L.light : STONE), mat(wx, y + hh / 2 + 0.15, wz, 0, -a + Math.PI / 2, 0), tw);
    // windows glow at night (every other segment)
    if (k % 2) R.add(new THREE.PlaneGeometry(segW * 0.32, hh * 0.3), '#ffd27a', mat(wx + Math.cos(a) * 0.23 * s, y + hh * 0.62, wz + Math.sin(a) * 0.23 * s, 0, -a + Math.PI / 2 + Math.PI, 0), tw, 1);
    // broken: some stubs, leaning
    if (rng() < 0.62) {
      const bh = hh * (0.25 + rng() * 0.45);
      R.add(new THREE.BoxGeometry(segW * (0.6 + rng() * 0.4), bh, 0.42 * s), STONE_OLD, mat(wx, y + bh / 2 + 0.1, wz, (rng() - 0.5) * 0.25, -a + Math.PI / 2, (rng() - 0.5) * 0.3), tb);
    }
  }
  // the roof: a cone (or a dome for ice / cosmic), the element's color
  const dome = el === 'ice' || el === 'cosmic' || el === 'void';
  if (dome) R.add(new THREE.SphereGeometry(wr * 1.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), L.main, mat(x, y + hh + 0.1, z, 0, 0, 0, 1, 0.6, 1), tw, 0.08);
  else R.add(new THREE.ConeGeometry(wr * 1.22, hh * 0.95, 10), L.main, mat(x, y + hh + 0.15 + hh * 0.47, z), tw, 0.05);
  // a flag on top
  R.add(new THREE.CylinderGeometry(0.05, 0.05, 1.6 * s, 4), WOOD, mat(x, y + hh * 2.1 + 0.6, z), tw);
  R.add(new THREE.PlaneGeometry(0.9 * s, 0.55 * s), L.glow, mat(x + 0.45 * s, y + hh * 2.1 + 1.1, z, 0, 0, 0), tw, 0.6);
  // the fallen roof, lying on its side, and rubble everywhere
  R.add(new THREE.ConeGeometry(wr * 0.5, hh * 0.45, 7, 1, true), '#' + tmpC.set(L.main).lerp(new THREE.Color(STONE_OLD), 0.45).getHexString(), mat(x + wr * 0.95, y + 0.45, z - wr * 0.35, 0.3, rng() * 3, 1.45), tb);
  for (let k = 0; k < 9; k++) {
    const a = rng() * Math.PI * 2;
    const d = r * (0.4 + rng() * 0.8);
    const bs = (0.25 + rng() * 0.45) * s;
    R.add(new THREE.BoxGeometry(bs * 1.4, bs, bs), STONE_OLD, mat(x + Math.cos(a) * d, y + bs * 0.4, z + Math.sin(a) * d, rng(), rng() * 3, rng()), tb);
  }
  centerpiece(R, el, x, y + 0.15, z, s * 0.85, tw, tb, rng);
}

function lighthouseRuin(R: RuinMesher, p: THREE.Vector3, i: number, rng: () => number) {
  const tw = tag(i, T_WHOLE);
  const tb = tag(i, T_BROKEN);
  R.add(new THREE.CylinderGeometry(2.6, 2.8, 0.4, 14), STONE, mat(p.x, p.y + 0.05, p.z), tag(i, T_ALWAYS));
  R.add(new THREE.CylinderGeometry(1.1, 1.7, 9, 12), (v, out) => out.set(Math.floor((v.y + 10) / 1.5) % 2 ? '#f2ece0' : '#d8443a'), mat(p.x, p.y + 4.7, p.z), tw);
  R.add(new THREE.CylinderGeometry(1.2, 1.2, 1.4, 10), '#ffe7a8', mat(p.x, p.y + 9.9, p.z), tw, 1);
  R.add(new THREE.ConeGeometry(1.5, 1.6, 10), '#3a3440', mat(p.x, p.y + 11.4, p.z), tw);
  R.add(new THREE.CylinderGeometry(1.4, 1.7, 3.6, 12), (v, out) => out.set(Math.floor((v.y + 10) / 1.5) % 2 ? '#c8c0b0' : '#8a5a50'), mat(p.x, p.y + 1.9, p.z, 0.04, 0, 0.05), tb);
  for (let k = 0; k < 6; k++) R.add(new THREE.BoxGeometry(0.6, 0.4, 0.5), '#b0a898', mat(p.x + (rng() - 0.5) * 5, p.y + 0.3, p.z + (rng() - 0.5) * 5, rng(), rng(), rng()), tb);
}

function pierRuin(R: RuinMesher, p: THREE.Vector3, i: number, dir: THREE.Vector3, rng: () => number) {
  const tw = tag(i, T_WHOLE);
  const tb = tag(i, T_BROKEN);
  const yaw = Math.atan2(dir.x, dir.z);
  for (let k = 0; k < 8; k++) {
    const q = p.clone().addScaledVector(dir, k * 1.1);
    R.add(new THREE.BoxGeometry(3, 0.18, 0.9), WOOD, mat(q.x, Math.max(p.y, 0.4) + 0.4, q.z, 0, yaw, 0), tw);
    if (rng() < 0.55) R.add(new THREE.BoxGeometry(3 * (0.5 + rng() * 0.4), 0.16, 0.8), '#6a4a34', mat(q.x + (rng() - 0.5), Math.max(p.y, 0.3) + 0.1 + rng() * 0.3, q.z, (rng() - 0.5) * 0.4, yaw + (rng() - 0.5) * 0.5, (rng() - 0.5) * 0.3), tb);
    if (k % 2 === 0)
      for (const sd of [-1.3, 1.3]) {
        const px = q.x + Math.cos(yaw) * sd;
        const pz = q.z - Math.sin(yaw) * sd;
        R.add(new THREE.CylinderGeometry(0.16, 0.16, 3, 5), '#5a3e2a', mat(px, -0.6, pz), tag(i, T_ALWAYS));
      }
  }
}

function houseRuin(R: RuinMesher, p: THREE.Vector3, i: number, rng: () => number) {
  const tw = tag(i, T_WHOLE);
  const tb = tag(i, T_BROKEN);
  R.add(new THREE.CylinderGeometry(3.2, 3.3, 0.3, 14), STONE, mat(p.x, p.y + 0.05, p.z), tag(i, T_ALWAYS));
  R.add(new THREE.BoxGeometry(4.2, 2.8, 3.6), '#f2e2c4', mat(p.x, p.y + 1.6, p.z), tw);
  R.add(new THREE.ConeGeometry(3.6, 2.2, 4), '#c8564a', mat(p.x, p.y + 4.1, p.z, 0, Math.PI / 4, 0), tw);
  R.add(new THREE.PlaneGeometry(0.9, 0.9), '#ffd27a', mat(p.x + 1, p.y + 1.8, p.z + 1.81), tw, 1);
  R.add(new THREE.BoxGeometry(4.2, 1.1, 0.3), '#c8b49a', mat(p.x, p.y + 0.6, p.z - 1.7, 0.1, 0, 0.05), tb);
  R.add(new THREE.BoxGeometry(0.3, 1.6, 3.4), '#c8b49a', mat(p.x - 2, p.y + 0.8, p.z, 0, 0, 0.1), tb);
  for (let k = 0; k < 6; k++) R.add(new THREE.BoxGeometry(0.7, 0.3, 0.5), '#a8907a', mat(p.x + (rng() - 0.5) * 4, p.y + 0.25, p.z + (rng() - 0.5) * 4, rng(), rng(), rng()), tb);
}

export function buildRuins(R: RuinMesher, spots: RuinSpot[], rng: () => number, seaDir: (p: THREE.Vector3) => THREE.Vector3) {
  for (const sp of spots) {
    const p = new THREE.Vector3(sp.x, sp.y, sp.z);
    if (sp.ruin.kind === 'faro') lighthouseRuin(R, p, sp.i, rng);
    else if (sp.ruin.kind === 'muelle') pierRuin(R, p, sp.i, seaDir(p), rng);
    else if (sp.ruin.kind === 'casa') houseRuin(R, p, sp.i, rng);
    else habitatRuin(R, sp, rng);
  }
}

/** the scenery that is always there (aRuin −1): the dark lighthouse, the prologue's raft, barrels, dry palms */
export function scenery(R: RuinMesher, o: { lighthouse: THREE.Vector3 | null; raft: THREE.Vector3; palms: THREE.Vector3[]; barrels: THREE.Vector3[]; decor: { x: number; z: number; kind: string; v: number }[]; groundAt: (x: number, z: number) => number }, rng: () => number) {
  const lamp: THREE.Vector3[] = [];
  if (o.lighthouse) {
    const p = o.lighthouse;
    R.add(new THREE.CylinderGeometry(2.4, 2.6, 0.4, 14), STONE, mat(p.x, p.y + 0.05, p.z));
    R.add(new THREE.CylinderGeometry(1.0, 1.6, 9, 12), (v, out) => out.set(Math.floor((v.y + 10) / 1.5) % 2 ? '#ece4d4' : '#b85048'), mat(p.x, p.y + 4.7, p.z));
    R.add(new THREE.CylinderGeometry(1.1, 1.1, 1.4, 10), '#5a6470', mat(p.x, p.y + 9.9, p.z));
    R.add(new THREE.ConeGeometry(1.4, 1.6, 10), '#3a3440', mat(p.x, p.y + 11.4, p.z));
    lamp.push(new THREE.Vector3(p.x, p.y + 9.9, p.z));
  }
  // the raft of the prologue: logs, a little palm, a wooden box
  const r = o.raft;
  for (let k = 0; k < 5; k++) R.add(new THREE.CylinderGeometry(0.28, 0.28, 3.4, 6), '#9a6a42', mat(r.x - 1.1 + k * 0.55, 0.32, r.z, Math.PI / 2, 0, 0));
  R.add(new THREE.CylinderGeometry(0.1, 0.16, 2.6, 5), '#8a6040', mat(r.x - 0.6, 1.6, r.z - 0.6, 0, 0, 0.12));
  for (let k = 0; k < 5; k++) R.add(new THREE.ConeGeometry(0.35, 1.9, 3).rotateX(Math.PI / 2), '#7aa85a', mat(r.x - 0.75, 2.9, r.z - 0.6, 0.6, (k / 5) * Math.PI * 2, 0));
  R.add(new THREE.BoxGeometry(0.9, 0.8, 0.9), '#b8864a', mat(r.x + 0.7, 0.85, r.z + 0.3, 0, 0.3, 0));
  // dry palms
  for (const p of o.palms) {
    const hgt = 3.6 + rng() * 1.6;
    const lean = (rng() - 0.5) * 0.4;
    R.add(new THREE.CylinderGeometry(0.16, 0.26, hgt, 5), '#8a7056', mat(p.x, p.y + hgt / 2, p.z, 0, 0, lean));
    for (let k = 0; k < 5; k++) R.add(new THREE.ConeGeometry(0.32, 2.2, 3).rotateX(Math.PI / 2), k % 2 ? '#a8a060' : '#8a9a5a', mat(p.x - Math.sin(lean) * hgt, p.y + hgt, p.z, 0.75, (k / 5) * Math.PI * 2 + rng(), 0));
  }
  // your island's own decor, where the page has it (abandoned: nobody watered anything)
  for (const d of o.decor) {
    const y = o.groundAt(d.x, d.z);
    const s = 0.8 + d.v * 0.4;
    switch (d.kind) {
      case 'palm': {
        const hgt = 3.4 + d.v * 1.4;
        R.add(new THREE.CylinderGeometry(0.15 * s, 0.24 * s, hgt, 5), '#8a7056', mat(d.x, y + hgt / 2, d.z, 0, 0, (d.v - 0.5) * 0.4));
        for (let k = 0; k < 5; k++) R.add(new THREE.ConeGeometry(0.3, 2, 3).rotateX(Math.PI / 2), k % 2 ? '#7aa060' : '#9aa060', mat(d.x - Math.sin((d.v - 0.5) * 0.4) * hgt, y + hgt, d.z, 0.75, (k / 5) * Math.PI * 2 + d.v * 3, 0));
        break;
      }
      case 'tree':
      case 'pine':
      case 'sakura':
      case 'lollipop': {
        const col = d.kind === 'pine' ? '#3f7a4a' : d.kind === 'sakura' ? '#f2a8c0' : d.kind === 'lollipop' ? '#ff8ab8' : '#5f9e4a';
        R.add(new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 1.6 * s, 5), '#7a5a3a', mat(d.x, y + 0.8 * s, d.z));
        if (d.kind === 'pine') R.add(new THREE.ConeGeometry(1 * s, 2.6 * s, 7), col, mat(d.x, y + 2.6 * s, d.z));
        else R.add(new THREE.IcosahedronGeometry(1.05 * s, 1), col, mat(d.x, y + 2.2 * s, d.z, 0, d.v * 3, 0, 1, 0.85, 1));
        break;
      }
      case 'bush':
        R.add(new THREE.IcosahedronGeometry(0.7 * s, 1), '#6a9a4a', mat(d.x, y + 0.45 * s, d.z, 0, d.v * 3, 0, 1, 0.7, 1));
        break;
      case 'flower':
        R.add(new THREE.SphereGeometry(0.22, 5, 3), ['#ff8ab8', '#ffd26a', '#c8a8ff'][Math.floor(d.v * 3)], mat(d.x, y + 0.35, d.z));
        break;
      case 'rock':
      case 'boulder':
        R.add(new THREE.DodecahedronGeometry((d.kind === 'boulder' ? 1.1 : 0.6) * s, 0).scale(1, 0.7, 1), '#9a9284', mat(d.x, y + 0.25, d.z, d.v, d.v * 5, 0));
        break;
      case 'column':
        R.add(new THREE.CylinderGeometry(0.35, 0.4, 1.4 + d.v * 1.6, 7), '#d8ccb4', mat(d.x, y + 0.7, d.z, 0, 0, (d.v - 0.5) * 0.3));
        break;
      case 'mushroom':
        R.add(new THREE.CylinderGeometry(0.12, 0.16, 0.6, 5), '#f2e8d8', mat(d.x, y + 0.3, d.z));
        R.add(new THREE.SphereGeometry(0.5, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#e8566a', mat(d.x, y + 0.55, d.z));
        break;
      case 'crystal':
        R.add(new THREE.OctahedronGeometry(0.5 * s, 0).scale(0.6, 1.6, 0.6), '#a8d8ff', mat(d.x, y + 0.6 * s, d.z, 0, d.v * 3, 0.2));
        break;
      default:
        R.add(new THREE.DodecahedronGeometry(0.5, 0), '#a8a090', mat(d.x, y + 0.2, d.z));
    }
  }
  // barrels adrift (concept 10)
  for (const b of o.barrels) R.add(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 9), (v, out) => out.set(Math.abs(v.y) > 0.38 && Math.abs(v.y) < 0.48 ? '#4a4a50' : '#8a5a38'), mat(b.x, 0.1, b.z, rng() * 0.6 + 0.9, rng() * 3, 0));
  return { lamp };
}
