/**
 * Built pieces of the Islas Invertidas: palettes, the island's static mesh (underside, roots, hanging
 * and standing trees, the arena of hanging columns, the pier, the stones' pedestals), the gravity
 * stones, the archipelago of islets (some upside down, some with water falling up off them) and the
 * far silhouettes. The hanging forest's canopies glow softly at night (aGlow).
 */
import * as THREE from 'three';
import type { Bin } from '../paginas/kit';
import { Mesher, mat, skyToon, type U } from '../cielo/kit';
import { hangingRoots, floatingRocks, islet, tree, tube, type RockPalette, type TreeOpts } from '../cielo/rock';
import { mainUnderside } from '../cielo/layer';
import { ANCHOR, ARENA, CUT, PIER, R, STONES, height, walkable } from './layout';

export const ROCK: RockPalette = {
  soil: '#7a5a8a',
  rock: ['#a28cd2', '#c4b0ea', '#8d7ac0', '#d0a8d8', '#a6b8e4', '#b49ade'],
  moss: '#86dcc4',
  dark: '#4a3c78',
  root: '#6a4e78',
};
export const GRASS = ['#86dcc4', '#9fe6cf', '#b9a6ec', '#a4e0c0'];
export const TREE: TreeOpts = { canopy: ['#ff9cc8', '#7fe2d2', '#b8f0a4', '#c6a8ff', '#ffd27a', '#ff8fb0'], trunk: '#6a4a72', lumps: 3, glow: 0.2 };
const RUNE = '#7ff7e6';
const STONE = '#4a3c78';

/** the pier's frame: start, direction, side */
export function pierFrame() {
  const d = new THREE.Vector3(Math.cos(PIER.ang), 0, Math.sin(PIER.ang));
  const s = new THREE.Vector3(-d.z, 0, d.x);
  const at = (k: number, side = 0, y = PIER.y) => new THREE.Vector3(PIER.x, y, PIER.z).addScaledVector(d, k).addScaledVector(s, side);
  return { d, s, at, yaw: Math.atan2(d.x, d.z) };
}

/** the main island: underside + roots + trees (standing on top, hanging under the rim) + arena + pier */
export function islandStatic(bin: Bin, uNight: U<number>, rng: () => number) {
  const M = new Mesher(true);
  const u = mainUnderside(M, height, { cut: CUT, rMax: R * 1.4, depth: 42, seed: 31, pal: ROCK, grass: '#93e0c8', tip: [5, -3], belly: 0.04, jag: 0.18, rings: 15 });
  // roots and vines
  const anchors = u.surf.filter((p) => p.y > CUT - 22 && rng() < 0.2);
  hangingRoots(M, anchors, rng, ROCK.root, { len: [3, 12], r: 0.24, vine: '#6fcfb0' });
  // the upside-down forest under the rim (they glow at night: the archipelago's lamps)
  let hung = 0;
  for (let i = 0; i < 200 && hung < 18; i++) {
    const p = u.surf[Math.floor(rng() * u.surf.length)];
    if (p.y > CUT - 1.5 || p.y < CUT - 12) continue;
    tree(M, p.x, p.y + 0.4, p.z, 0.75 + rng() * 0.45, rng, { ...TREE, inverted: true });
    hung++;
  }
  floatingRocks(M, 10, new THREE.Vector3(4, CUT - 40, -2), 18, rng, ROCK, 1.7);
  // standing trees in three groves (not on paths, the pond, the arena or the pier)
  const groves: [number, number, number, number][] = [
    [8, 6, 7, 6],
    [-4, -17, 6, 5],
    [-22, 15, 5, 4],
  ];
  for (const [gx, gz, gr, n] of groves) {
    let placed = 0;
    for (let i = 0; i < 80 && placed < n; i++) {
      const a = rng() * 6.28;
      const d = Math.sqrt(rng()) * gr;
      const x = gx + Math.cos(a) * d;
      const z = gz + Math.sin(a) * d;
      if (!walkable(x, z) || Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r + 2.5) continue;
      if (STONES.some((s) => Math.hypot(x - s.x, z - s.z) < 4) || Math.hypot(x - ANCHOR.x, z - ANCHOR.z) < 3.5) continue;
      tree(M, x, height(x, z) - 0.1, z, 0.6 + rng() * 0.35, rng, TREE);
      placed++;
    }
  }
  // the ARENA: lintel stones float in a ring, each with a column hanging from it (gravity points up
  // here, so columns are built from the top down); a rune disc on the ground
  const ay = height(ARENA.x, ARENA.z);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const x = ARENA.x + Math.cos(a) * ARENA.r;
    const z = ARENA.z + Math.sin(a) * ARENA.r;
    const top = ay + 9.2 + Math.sin(i * 2.1) * 0.6;
    M.add(new THREE.BoxGeometry(2.6, 0.7, 1.4), '#e4dcf6', mat(x, top, z, 0, -a, 0));
    M.add(new THREE.BoxGeometry(2.9, 0.22, 1.6), '#b9aae4', mat(x, top + 0.42, z, 0, -a, 0));
    const len = 2.2 + (i % 3) * 0.7;
    const col = new THREE.CylinderGeometry(0.46, 0.4, len, 8);
    M.add(col, (v, out) => out.set(Math.floor((v.y + len) * 1.4) % 2 ? '#efe9fb' : '#d6cbef'), mat(x, top - 0.35 - len / 2, z));
    M.add(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 8), '#b9aae4', mat(x, top - 0.35 - len, z));
    // the column's own drums, fallen UP onto the lintel; and a lost drum drifting under it
    if (i % 3 === 1) M.add(new THREE.CylinderGeometry(0.42, 0.42, 0.6, 8), '#d6cbef', mat(x + 0.6, top + 0.95, z, 0.3, 0, 0.4));
    if (i % 2 === 0) M.add(new THREE.CylinderGeometry(0.4, 0.4, 0.55, 8), '#e4dcf6', mat(x * 0.98 + ARENA.x * 0.02, top - len - 2.6, z, 0.5, 0, 0.3), 0.5);
  }
  M.add(new THREE.CylinderGeometry(ARENA.r - 1.2, ARENA.r - 1.0, 0.24, 32), '#d6cbef', mat(ARENA.x, ay + 0.05, ARENA.z));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    M.add(new THREE.BoxGeometry(0.3, 0.06, 2.2), RUNE, mat(ARENA.x + Math.cos(a) * 2.6, ay + 0.2, ARENA.z + Math.sin(a) * 2.6, 0, -a, 0), 0, 0.7);
  }
  M.add(new THREE.TorusGeometry(1.4, 0.12, 4, 24), RUNE, mat(ARENA.x, ay + 0.2, ARENA.z, Math.PI / 2), 0, 0.8);
  // the PIER: planks over the void, posts, struts, a rope rail
  const pf = pierFrame();
  const plankN = Math.round(PIER.len / 0.62);
  for (let i = 0; i < plankN; i++) {
    const p = pf.at(i * 0.62 + 0.3);
    p.y = Math.max(PIER.y, height(p.x, p.z) + 0.05);
    M.add(new THREE.BoxGeometry(2.3, 0.14, 0.56), i % 3 ? '#a77a52' : '#93683f', mat(p.x, p.y, p.z, 0, pf.yaw + (rng() - 0.5) * 0.04, 0));
  }
  const rails: THREE.Vector3[][] = [[], []];
  for (let i = 0; i <= 4; i++)
    [-1, 1].forEach((sx, k) => {
      const p = pf.at(1 + i * ((PIER.len - 1.5) / 4), sx * 1.15);
      M.add(new THREE.CylinderGeometry(0.11, 0.13, 1.5, 5), '#6e4a30', mat(p.x, PIER.y + 0.55, p.z));
      M.add(new THREE.CylinderGeometry(0.09, 0.09, 3.6, 4), '#5d3f29', mat(p.x, PIER.y - 1.8, p.z, 0.2, 0, sx * 0.2));
      rails[k].push(new THREE.Vector3(p.x, PIER.y + 1.25, p.z));
    });
  for (const line of rails)
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i];
      const b = line[i + 1];
      tube(M, Array.from({ length: 6 }, (_, k) => a.clone().lerp(b, k / 5).add(new THREE.Vector3(0, -Math.sin((k / 5) * Math.PI) * 0.3, 0))), 0.045, 0.045, '#e0cc9e', 0.15, 3);
    }
  // the lamp post at the end of the pier
  const lampP = pf.at(PIER.len - 0.6, 1.15);
  M.add(new THREE.CylinderGeometry(0.1, 0.12, 3, 5), '#6e4a30', mat(lampP.x, PIER.y + 1.5, lampP.z));
  M.add(new THREE.OctahedronGeometry(0.34, 0), '#ffd9a0', mat(lampP.x, PIER.y + 3.1, lampP.z), 0, 1);
  // Globito's rock (with a ring for his rope)
  const ah = height(ANCHOR.x, ANCHOR.z);
  const rock = new THREE.DodecahedronGeometry(0.85, 0);
  rock.scale(1, 0.7, 0.9);
  M.add(rock, '#8f7cc0', mat(ANCHOR.x, ah + 0.35, ANCHOR.z, 0.2, 0.5, 0.1));
  M.add(new THREE.TorusGeometry(0.2, 0.06, 3, 8), '#e0cc9e', mat(ANCHOR.x, ah + 0.92, ANCHOR.z));
  // pedestals of the gravity stones
  for (const s of STONES) pedestal(M, s.x, height(s.x, s.z), s.z);
  const mesh = new THREE.Mesh(bin.add(M.build()), skyToon(bin, { uNight, key: 'inv' }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'invertidas-static';
  return { mesh, rimSurf: u.surf, lamp: new THREE.Vector3(lampP.x, PIER.y + 3.1, lampP.z), arenaY: ay };
}

/** a gravity stone: a rune monolith floating over its pedestal with pebbles in orbit (one mesh) */
export function gravityStone(bin: Bin, uNight: U<number>, rng: () => number) {
  const M = new Mesher(true);
  const slab = new THREE.OctahedronGeometry(1, 0);
  slab.scale(0.8, 1.7, 0.55);
  M.add(slab, STONE);
  for (const y of [-0.6, 0, 0.6]) M.add(new THREE.BoxGeometry(0.9, 0.08, 0.62), RUNE, mat(0, y, 0, 0, 0, y * 0.4), 0, 1);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const r = 1.6 + (i % 2) * 0.35;
    M.add(new THREE.IcosahedronGeometry(0.2 + rng() * 0.12, 0), i % 2 ? '#9481c2' : RUNE, mat(Math.cos(a) * r, Math.sin(i * 1.7) * 0.6, Math.sin(a) * r), 0, i % 2 ? 0 : 0.6);
  }
  const geo = bin.add(M.build());
  return { geo, mat: skyToon(bin, { uNight, key: 'inv' }) };
}

/** the pedestal under each stone */
export function pedestal(M: Mesher, x: number, y: number, z: number) {
  M.add(new THREE.CylinderGeometry(1.1, 1.35, 0.6, 7), '#b3a5e0', mat(x, y + 0.2, z));
  M.add(new THREE.CylinderGeometry(0.75, 0.95, 0.35, 7), '#d8cff0', mat(x, y + 0.65, z));
  M.add(new THREE.TorusGeometry(0.85, 0.06, 3, 14), RUNE, mat(x, y + 0.84, z, Math.PI / 2), 0, 0.8);
}

export interface Isle {
  group: THREE.Group;
  base: THREE.Vector3;
  ph: number;
  bob: number;
  spin: number;
  r: number;
}

/** a decorative islet (own mesh so it can bob); inverted ones show their hanging forest */
export function isle(bin: Bin, uNight: U<number>, rng: () => number, o: { x: number; y: number; z: number; r: number; seed: number; inverted?: boolean; trees?: number; hanging?: number }): Isle {
  const M = new Mesher(true);
  islet(M, rng, { r: o.r, seed: o.seed, pal: ROCK, grass: GRASS, trees: o.trees ?? Math.round(o.r / 2.2), hanging: o.hanging ?? Math.round(o.r / 3), tree: TREE, roots: Math.round(o.r * 1.2), rocks: o.r > 5 ? 3 : 0, deep: 1.25 + rng() * 0.4 });
  const mesh = new THREE.Mesh(bin.add(M.build()), skyToon(bin, { uNight, key: 'inv' }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const group = new THREE.Group();
  group.add(mesh);
  group.position.set(o.x, o.y, o.z);
  if (o.inverted) group.rotation.x = Math.PI;
  return { group, base: new THREE.Vector3(o.x, o.y, o.z), ph: rng() * 6.28, bob: 0.4 + rng() * 0.5, spin: (rng() - 0.5) * 0.04, r: o.r };
}

/** far islands (fog silhouettes): one merged static mesh, no bob */
export function farIsles(bin: Bin, uNight: U<number>, rng: () => number, list: { x: number; y: number; z: number; r: number; inverted?: boolean }[]) {
  const M = new Mesher(true);
  list.forEach((f, i) => {
    const L = new Mesher(true);
    islet(L, rng, { r: f.r, seed: 100 + i * 7, pal: ROCK, grass: GRASS, trees: Math.round(f.r / 3), hanging: Math.round(f.r / 4), tree: TREE, roots: Math.round(f.r * 0.8), deep: 1.3 + rng() * 0.5 });
    const g = L.build();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(f.x, f.y, f.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(f.inverted ? Math.PI : 0, rng() * 6.28, 0)), new THREE.Vector3(1, 1, 1)));
    M.tris(Array.from(g.attributes.position.array as Float32Array), Array.from(g.attributes.color.array as Float32Array), Array.from(g.attributes.aSway.array as Float32Array), Array.from(g.attributes.aGlow.array as Float32Array));
    g.dispose();
  });
  const mesh = new THREE.Mesh(bin.add(M.build()), skyToon(bin, { uNight, key: 'inv' }));
  mesh.name = 'far-isles';
  return mesh;
}
