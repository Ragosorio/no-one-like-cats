/**
 * ISLA DE LAS PÁGINAS HUNDIDAS (Parte II · Oleada 1) — the Archive's ruins, half-sunk.
 *
 * The island's heart is a giant OPEN BOOK (pages 212–213, terrain you can walk on) with the Archive's
 * little lighthouse on a plinth of books at the head of its spine. Cliffs of stacked giant books ring
 * the north; bookcases stick out of the sea; ink runs off page 213 into a tide pool where letters drift;
 * the reading-room ruin is half flooded and El Bibliotecario Ahogado sleeps there until you beat him.
 * Loose pages fly in flocks; at night paper lanterns light the paths and the page keeps writing itself.
 *
 * Activities (POIs, docs/part-ii/14):
 *  - battle marker at the drowned-library dock (RegionScene's generic marker, `battleSpot`)
 *  - «Pescar párrafos»: 2–3 glowing pages float around; tap one → a page of the DIARIO PERDIDO
 *    (flags `pagina_leida:<n>`, counter feature_pagina, a little gold the first time)
 *  - Canelo's golden page while the active story mission asks for `use_feature pagina_canelo` (H36):
 *    tap → the page lands on the book, Canelo sits on it, `feature_pagina_canelo` (the story beat
 *    b36 part b plays the lines inside the region)
 *  - REGISTRO 000 at night on a sea stack of books; never there when the camera gets close
 */
import * as THREE from 'three';
import type { POI, RegionBuild, RegionCtx, RegionDef } from './types';
import type { SkyKey } from '../engine/world/sky';
import type { LocalLight } from '../engine/world/paperCat';
import type { Activity, Agent } from '../engine/life/director';
import type { Placement } from '../engine/world/flora';
import { catLiteUrl } from '../art/catArt';
import { CAT_BY_ID, MISSION_BY_ID } from '../data/content';
import { G } from '../state/game';
import { BOOK, COVER_RECT, height, pageHeight, paint, SPOT, walkable } from './paginas/layout';
import { Bin, Merger, canvasTexture, mat, toon } from './paginas/kit';
import { bookMesh, COVERS, stack, type BookPlacement } from './paginas/books';
import {
  bookStatics,
  dock,
  emissiveMaterial,
  festoon,
  glowPageMaterial,
  haloMesh,
  inkPool,
  inkStream,
  LANTERN_COLORS,
  lanternPost,
  lighthouse,
  openBookPages,
  pageBlockWalls,
  pageFlock,
  readingRoom,
  rowboat,
  shelfFrame,
  signBoard,
  type Halo,
} from './paginas/props';
import { drawGoldenPage } from './paginas/pageArt';
import { BIOS, DIARIO, HOW, LOOSE, REGISTRO_CARD, REGISTRO_LINES } from './paginas/lore';

/** the region's lens: warm paper days, sepia haze, ink-blue nights (never black: cats must read) */
const SKY: SkyKey[] = [
  { h: 0, zenith: '#080d2a', horizon: '#1f2a58', sun: '#8aa4ff', sunI: 0, hemiSky: '#3e4c94', hemiGround: '#181a2e', hemiI: 0.6, fog: '#1b2350', deep: '#0a1c38', shallow: '#1d566a', grade: '#8a92d0', night: 1 },
  { h: 4.8, zenith: '#0e1636', horizon: '#3a3a66', sun: '#8aa4ff', sunI: 0, hemiSky: '#404c90', hemiGround: '#1a1b30', hemiI: 0.6, fog: '#262c58', deep: '#0b2242', shallow: '#1f6274', grade: '#8f92cf', night: 1 },
  { h: 6.0, zenith: '#5d6aa2', horizon: '#f2c497', sun: '#ffc48a', sunI: 1.2, hemiSky: '#c4b6d6', hemiGround: '#6a5440', hemiI: 0.72, fog: '#e6c6a2', deep: '#2a4a68', shallow: '#5fb0a4', grade: '#ffdcc2', night: 0.25 },
  { h: 8.0, zenith: '#7f9cc2', horizon: '#efe0c0', sun: '#fff0d0', sunI: 2.2, hemiSky: '#e8dcc2', hemiGround: '#7a6446', hemiI: 0.88, fog: '#e9dcbf', deep: '#285a76', shallow: '#5cc2b0', grade: '#fff3e0', night: 0 },
  { h: 12.5, zenith: '#78a0cc', horizon: '#f1e6cc', sun: '#fff6e4', sunI: 2.4, hemiSky: '#ece2cc', hemiGround: '#7f6a4a', hemiI: 0.9, fog: '#ece0c6', deep: '#235c7e', shallow: '#4fc8b6', grade: '#fff9ee', night: 0 },
  { h: 16.5, zenith: '#8a92b8', horizon: '#f4d4a0', sun: '#ffd290', sunI: 2.2, hemiSky: '#e4d0b0', hemiGround: '#7a5838', hemiI: 0.86, fog: '#eed0a4', deep: '#2a4f6e', shallow: '#4ab2a2', grade: '#ffecd0', night: 0 },
  { h: 18.3, zenith: '#4b4f88', horizon: '#ef8a5a', sun: '#ff8f50', sunI: 1.4, hemiSky: '#b08ab6', hemiGround: '#5a3a30', hemiI: 0.75, fog: '#d8907a', deep: '#22406a', shallow: '#3a8a9a', grade: '#ffc2a4', night: 0.15 },
  { h: 19.6, zenith: '#151a48', horizon: '#5c4070', sun: '#b07aa0', sunI: 0.35, hemiSky: '#5a5aa0', hemiGround: '#251d33', hemiI: 0.62, fog: '#3a3060', deep: '#0c2450', shallow: '#245c7c', grade: '#a39ad8', night: 0.7 },
  { h: 21, zenith: '#090f2e', horizon: '#1d2858', sun: '#8aa4ff', sunI: 0, hemiSky: '#3e4c94', hemiGround: '#181a2e', hemiI: 0.6, fog: '#1c254f', deep: '#0a1c38', shallow: '#1d566a', grade: '#8a92d2', night: 1 },
  { h: 24, zenith: '#080d2a', horizon: '#1f2a58', sun: '#8aa4ff', sunI: 0, hemiSky: '#3e4c94', hemiGround: '#181a2e', hemiI: 0.6, fog: '#1b2350', deep: '#0a1c38', shallow: '#1d566a', grade: '#8a92d0', night: 1 },
];

// dev only: ?hour=23 fixes the hour, ?weather=despejado|lluvia|tormenta fixes the sky
const qs = import.meta.env.DEV && typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
const devHour = qs?.get('hour') ? Math.max(0.01, Number(qs.get('hour'))) : undefined;
const devWeather = (qs?.get('weather') ?? undefined) as RegionDef['weather'];

const DOCK_END = new THREE.Vector3(SPOT.dock.x1, SPOT.dock.y, SPOT.dock.z1);
/** where Canelo's page lands (page 213, on the line of the spine stairs) */
const REST = new THREE.Vector3(SPOT.ramp.x, pageHeight(SPOT.ramp.x, 3.2), 3.2);
const RARITY_H: Record<string, number> = { common: 2.4, rare: 2.5, epic: 2.7, legendary: 3.1 };
const TRAITS: Record<string, Record<string, number>> = {
  perezoso: { playful: 0.2, curious: 0.25 },
  travieso: { playful: 0.9, curious: 0.7 },
  dormilon: { playful: 0.2, curious: 0.5 },
  rencoroso: { playful: 0.1, curious: 0.3 },
  impaciente: { playful: 0.85, curious: 0.9 },
};

export const region: RegionDef = {
  id: 'paginas',
  name: 'Isla de las Páginas Hundidas',
  subtitle: 'Siempre estuvo aquí. Eso dicen.',
  half: 64,
  height,
  paint,
  walkable,
  skyKeys: SKY,
  fog: { near: 55, far: 250 },
  camera: { target: [1, 3.5, -1], yaw: 0.55, pitch: 0.5, dist: 60, minDist: 8, maxDist: 105 },
  arrival: [SPOT.arrival.x, 0, SPOT.arrival.z],
  battleSpot: [DOCK_END.x, DOCK_END.y + 2.6, DOCK_END.z],
  hour: devHour,
  weather: devWeather,
  async build(ctx) {
    return buildPaginas(ctx);
  },
};

const canelosTurn = (ctx: RegionCtx) => {
  const m = ctx.activeStory();
  const goal = m ? (MISSION_BY_ID.get(m)?.goal as { type?: string; feature?: string } | undefined) : undefined;
  return goal?.type === 'use_feature' && goal.feature === 'pagina_canelo';
};

async function buildPaginas(ctx: RegionCtx): Promise<RegionBuild> {
  const w = ctx.world;
  const rnd = ctx.rng;
  const bin = new Bin();
  const root = new THREE.Group();
  root.name = 'paginas';
  const uNight = { value: 0 };
  const uTime = { value: 0 };
  const uHalo = { value: 0 };
  const uPageHalo = { value: 1 };
  const uTint = { value: new THREE.Color(1, 1, 1) };
  const lights: LocalLight[] = [];
  const M = new Merger();
  const E = new Merger('aGlow');
  const books: BookPlacement[] = [];
  const halos: Halo[] = [];
  const lanternLights: LocalLight[] = [];
  const obstacle = (x: number, z: number, r: number) => w.obstacles.push({ x, z, r });

  // ---------------------------------------------------------------- the open book
  const pages = openBookPages(bin, uNight);
  root.add(pages.mesh, pageBlockWalls(bin));
  bookStatics(M);

  // ---------------------------------------------------------------- books: plinth, cliffs, stairs, piles
  const L = SPOT.lighthouse;
  const plinthTop = stack(books, rnd, L.x, L.z, BOOK.plateau - 0.05, 4, 0, 2.75);
  obstacle(L.x, L.z, 3.4);
  // north cliffs: stacks rising from the surf, spines (titles) facing the sea
  for (let i = 0; i < 11; i++) {
    const th = (-168 + i * 15.5 + (rnd() - 0.5) * 6) * (Math.PI / 180);
    const R = 37 + rnd() * 4;
    const x = Math.cos(th) * R;
    const z = Math.sin(th) * R;
    const face = Math.atan2(Math.cos(th), Math.sin(th));
    stack(books, rnd, x, z, Math.min(height(x, z), 0) - 2.6, 6 + Math.floor(rnd() * 5), face, 2.3 + rnd() * 0.7, (rnd() - 0.5) * 0.12);
    obstacle(x, z, 3.2);
  }
  // inland towers flanking the lighthouse (on the ridges) and a leaning one to the east
  for (const [x, z, n, lean] of [
    [-14, -30, 6, 0.05],
    [15, -30.5, 7, -0.04],
    [-8.5, -33, 4, 0],
    [31, -15, 6, 0.1],
    [-31, -16, 5, -0.06],
    [34, 8, 5, 0],
    [-36, -4, 4, 0.04],
  ] as [number, number, number, number][]) {
    stack(books, rnd, x, z, height(x, z) - 0.4, n, Math.atan2(x, z), 2.3 + rnd() * 0.5, lean);
    obstacle(x, z, 3.0);
  }
  // REGISTRO 000's sea stack, alone in the west-north-west
  const S = SPOT.seaStack;
  const stackTop = stack(books, rnd, S.x, S.z, -4.2, 10, 0.9, 1.9, 0.03);
  // spine stairs from the beach up onto the tail of the book
  for (let i = 0; i < 8; i++) {
    const z = SPOT.ramp.zFlat + 0.5 + i * 1.45;
    const y = height(SPOT.ramp.x, z);
    const s = 2.15;
    const sy = 0.95;
    books.push({
      m: new THREE.Matrix4().compose(new THREE.Vector3(SPOT.ramp.x + (rnd() - 0.5) * 0.3, y - (0.5 * sy) / 2 + 0.12, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (rnd() - 0.5) * 0.12, 0)), new THREE.Vector3(s, sy, s)),
      color: COVERS[(i * 5) % COVERS.length],
    });
  }
  // piles on the plateau and fallen books on the beach (half in the sand)
  for (const [x, z, n] of [
    [-16.8, 9, 3],
    [16.4, -9.5, 2],
    [-16.6, -13, 4],
    [-5.5, -21.5, 2],
    [6, -21, 3],
  ] as [number, number, number][]) {
    stack(books, rnd, x, z, height(x, z) - 0.05, n, rnd() * 6.28, 1.4 + rnd() * 0.4);
    obstacle(x, z, 1.6);
  }
  for (const [x, z, rx, rz] of [
    [16, 22, 0.35, 0.1],
    [-6, 24.5, -0.2, 0.3],
    [20, 15.5, 0.15, -0.35],
    [-13, 19, 0.4, -0.1],
    [24, 21, -0.3, 0.2],
  ] as [number, number, number, number][]) {
    books.push({
      m: new THREE.Matrix4().compose(new THREE.Vector3(x, height(x, z) + 0.1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, rnd() * 6.28, rz)), new THREE.Vector3(1.7, 1.2, 1.7)),
      color: COVERS[Math.floor(rnd() * COVERS.length)],
    });
  }

  // ---------------------------------------------------------------- lighthouse
  const lh = lighthouse(bin, M, E, new THREE.Vector3(L.x, plinthTop, L.z));
  root.add(lh.group);
  halos.push({ p: lh.lamp, size: 7, color: '#ffd98a' });
  lights.push({ pos: lh.lamp, color: new THREE.Color('#ffe7a8'), range: 18, intensity: 0 });

  // ---------------------------------------------------------------- reading room + dock + sign
  const room = readingRoom(M, E);
  root.add(signBoard(bin, room.sign));
  halos.push({ p: room.lamp, size: 2.2, color: '#b8ffb0' });
  const deskLight: LocalLight = { pos: room.lamp, color: new THREE.Color('#ffe2a0'), range: 7, intensity: 0 };
  lights.push(deskLight);
  const deskPL = new THREE.PointLight('#ffd890', 0, 11, 1.6);
  deskPL.position.copy(room.lamp).add(new THREE.Vector3(0, 0.3, 0));
  root.add(deskPL);
  for (const [x, z, r] of [
    [SPOT.room.x + 1.8, SPOT.room.z + 0.6, 1.5],
    [SPOT.room.x + 2.4, SPOT.room.z + 4.9, 1.2],
  ] as [number, number, number][])
    obstacle(x, z, r);
  // the bookcase in the north wall: upright books on four shelves
  for (let s = 0; s < 4; s++) {
    let x = SPOT.room.x + 0.3 - 2.6;
    const top = SPOT.room.floor + 0.56 + s * 1.15;
    while (x < SPOT.room.x + 0.3 + 2.5) {
      const sc = 0.42 + rnd() * 0.12;
      const sy = 0.45 + rnd() * 0.35;
      const thick = 0.5 * sy;
      if (rnd() < 0.08) {
        x += thick * 1.5;
        continue;
      }
      const lean = rnd() < 0.1 ? 0.25 : 0;
      books.push({
        m: new THREE.Matrix4().compose(new THREE.Vector3(x + thick / 2, top + sc, room.wallZ + 0.55), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 + lean)), new THREE.Vector3(sc, sy, sc)),
        color: COVERS[Math.floor(rnd() * COVERS.length)],
      });
      x += thick + 0.02;
    }
  }
  // the Bibliotecario's bed: a pile of drowned books by the desk
  const bedTop = stack(books, rnd, SPOT.room.x - 1.2, SPOT.room.z - 1.6, SPOT.room.floor, 3, 0.3, 1.25);
  for (let i = 0; i < 7; i++) {
    const a = rnd() * 6.28;
    const r = 1.5 + rnd() * 3.5;
    const x = SPOT.room.x - 1 + Math.cos(a) * r;
    const z = SPOT.room.z + Math.sin(a) * r;
    const y = x < SPOT.room.x - 4.2 ? -0.08 : SPOT.room.floor + 0.12;
    books.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.3, a, (rnd() - 0.5) * 0.3)), new THREE.Vector3(0.9, 0.9, 0.9)), color: COVERS[Math.floor(rnd() * COVERS.length)] });
  }
  dock(M);
  rowboat(M, new THREE.Vector3(SPOT.arrival.x + 5.5, 0.15, SPOT.arrival.z + 3.5), 0.6);

  // ---------------------------------------------------------------- drowned bookcases offshore
  const shelves: [number, number, number, number, number, number][] = [
    [-47, 3, 1.25, 0.24, 0.1, 1.1],
    [-45, 21, 0.7, -0.3, 0.05, 1.0],
    [40, 27, -0.6, 0.05, 0.34, 1.15],
    [50, -7, -1.4, 0.18, -0.1, 1.05],
    [27, -45, 0.3, -0.06, -0.26, 1.2],
    [-22, -47, 2.6, -0.34, 0.12, 1.0],
  ];
  for (const [x, z, yaw, rz, rx, sc] of shelves) {
    const m = mat(x, -4.6, z, rx, yaw, rz, sc);
    shelfFrame(M, m);
    const up = new THREE.Vector3();
    for (let s = 0; s < 5; s++) {
      const sy0 = 0.3 + s * 1.85 + 0.07;
      // only shelves that clear the waves get books
      up.set(0, sy0 + 0.6, 0).applyMatrix4(m);
      if (up.y < -0.3) continue;
      let bx = -2.15;
      while (bx < 2.1) {
        const bs = 0.62 + rnd() * 0.18;
        const bsy = 0.5 + rnd() * 0.4;
        const thick = 0.5 * bsy;
        if (rnd() < 0.12) {
          bx += thick * 2;
          continue;
        }
        const lean = rnd() < 0.15 ? -0.3 : 0;
        const local = new THREE.Matrix4().compose(new THREE.Vector3(bx + thick / 2, sy0 + bs, 0.05), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 + lean)), new THREE.Vector3(bs, bsy, bs * 0.95));
        books.push({ m: new THREE.Matrix4().multiplyMatrices(m, local), color: COVERS[Math.floor(rnd() * COVERS.length)] });
        bx += thick + 0.03;
      }
    }
  }
  // floating books drift by the shelves (own instanced mesh, bobbing on the real waves)
  const floaters = Array.from({ length: 8 }, (_, i) => {
    const sh = shelves[i % shelves.length];
    const a = rnd() * 6.28;
    return { x: sh[0] + Math.cos(a) * (3 + rnd() * 4), z: sh[1] + Math.sin(a) * (3 + rnd() * 4), yaw: rnd() * 6.28, ph: rnd() * 6.28, s: 0.9 + rnd() * 0.5 };
  });
  const floatMesh = bookMesh(
    bin,
    floaters.map((f) => ({ m: new THREE.Matrix4(), color: COVERS[Math.floor(rnd() * COVERS.length)] })),
  );
  floatMesh.castShadow = false;
  floatMesh.frustumCulled = false;
  root.add(floatMesh);

  // ---------------------------------------------------------------- paper lanterns
  const posts: { x: number; z: number; yaw: number; y?: number }[] = [
    { x: 1.6, z: 21.2, yaw: Math.PI },
    { x: 7.6, z: 21, yaw: 0 },
    { x: 12.5, z: 25, yaw: 0.3 },
    { x: -1.5, z: 25.5, yaw: 2.8 },
    { x: -16, z: 13.2, yaw: 2.4 },
    { x: 16.3, z: 13.2, yaw: 0.7 },
    { x: -21.4, z: 8.8, yaw: 0.6 },
    { x: -21.6, z: -3.4, yaw: -0.5 },
    { x: 16.2, z: 10.6, yaw: 2.6 },
    { x: 25.6, z: 2.4, yaw: -0.4 },
    { x: -4.4, z: -18.6, yaw: Math.PI },
    { x: 4.4, z: -18.6, yaw: 0 },
  ];
  const d = SPOT.dock;
  for (const t of [0.42, 1]) {
    const ang = Math.atan2(d.z1 - d.z0, d.x1 - d.x0);
    posts.push({ x: d.x0 + (d.x1 - d.x0) * t - Math.sin(ang) * 1.05, z: d.z0 + (d.z1 - d.z0) * t + Math.cos(ang) * 1.05, yaw: ang + Math.PI / 2, y: d.y + 0.07 });
  }
  const tops: THREE.Vector3[] = [];
  posts.forEach((p, i) => {
    const y = p.y ?? height(p.x, p.z) - 0.05;
    const color = LANTERN_COLORS[i % LANTERN_COLORS.length];
    const c = lanternPost(M, E, p.x, y, p.z, p.yaw, color);
    tops.push(new THREE.Vector3(p.x, y + 2.62, p.z));
    halos.push({ p: c, size: 3.2, color });
    const ll: LocalLight = { pos: c, color: new THREE.Color(color), range: 7.5, intensity: 0 };
    lanternLights.push(ll);
    lights.push(ll);
    obstacle(p.x, p.z, 0.45);
  });
  // festoons: the stair gateway, the beach, the reading room, the ink pool
  for (const [a, b, n, sag] of [
    [0, 1, 5, 0.7],
    [3, 2, 7, 0.9],
    [6, 7, 7, 0.9],
    [8, 9, 6, 0.8],
  ] as [number, number, number, number][])
    for (const p of festoon(M, E, tops[a], tops[b], n, sag, rnd)) halos.push({ p, size: 1.3, color: LANTERN_COLORS[Math.floor(rnd() * LANTERN_COLORS.length)] });

  // ---------------------------------------------------------------- ink tide pool
  const pool = inkPool(bin, uNight, uTime);
  root.add(pool.mesh, inkStream(bin, uTime, uNight));
  const poolLight: LocalLight = { pos: new THREE.Vector3(SPOT.pool.x, SPOT.pool.surface + 0.8, SPOT.pool.z), color: new THREE.Color('#8a7cff'), range: 8, intensity: 0 };
  lights.push(poolLight);
  const poolPL = new THREE.PointLight('#7a6cff', 0, 12, 1.6);
  poolPL.position.set(SPOT.pool.x, SPOT.pool.surface + 1.2, SPOT.pool.z);
  root.add(poolPL);

  // ---------------------------------------------------------------- loose pages in flight
  const flock = pageFlock(bin, 34, rnd, [new THREE.Vector3(L.x, plinthTop + 3, L.z), new THREE.Vector3(0, 6, -2), new THREE.Vector3(-30, 3, 6)], uTime, uTint);
  root.add(flock);

  // ---------------------------------------------------------------- merge the static world
  const staticMesh = new THREE.Mesh(bin.add(M.build()), toon(bin, { vertexColors: true }));
  staticMesh.castShadow = true;
  staticMesh.receiveShadow = true;
  const emissive = new THREE.Mesh(bin.add(E.build()), emissiveMaterial(bin, uNight));
  const bookInst = bookMesh(bin, books);
  const haloInst = haloMesh(bin, halos, uHalo, uTime);
  root.add(staticMesh, emissive, bookInst, haloInst);

  // ---------------------------------------------------------------- flora (moss tufts, rocks, a few pale flowers)
  const grass: Placement[] = [];
  const rocks: Placement[] = [];
  const flowers: Placement[] = [];
  const inBook = (x: number, z: number) => x > COVER_RECT.x0 - 1 && x < COVER_RECT.x1 + 1 && z > COVER_RECT.z0 - 1 && z < COVER_RECT.z1 + 1;
  for (let i = 0; i < 2600 && grass.length < 420; i++) {
    const x = (rnd() - 0.5) * 84;
    const z = (rnd() - 0.5) * 84;
    const h = height(x, z);
    if (h < 1.2 || inBook(x, z) || Math.hypot(x - SPOT.pool.x, z - SPOT.pool.z) < SPOT.pool.r + 1.5 || Math.hypot(x - SPOT.room.x, z - SPOT.room.z) < 7.5) continue;
    if (Math.abs(x - SPOT.ramp.x) < 3.4 && z > BOOK.zTail && z < SPOT.ramp.z1) continue;
    if (!walkable(x, z)) continue;
    if (rnd() < 0.86) grass.push({ x, y: h - 0.05, z, s: 0.8 + rnd() * 0.7, r: rnd() * 6.28 });
    else if (flowers.length < 70) flowers.push({ x, y: h - 0.02, z, s: 0.8 + rnd() * 0.5, r: rnd() * 6.28 });
  }
  for (let i = 0; i < 900 && rocks.length < 46; i++) {
    const a = rnd() * 6.28;
    const r = 30 + rnd() * 14;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = height(x, z);
    if (h < -1.2 || h > 1.6 || (z > 14 && Math.abs(x - 6) < 14)) continue;
    rocks.push({ x, y: h - 0.2, z, s: 0.8 + rnd() * 1.6, r: rnd() * 6.28 });
  }
  w.setFlora({ grass, rocks, flowers });

  // ---------------------------------------------------------------- residents (Lote D lives here)
  const owned = (id: string) => G.s.cats.some((c) => c.species === id);
  const card = (id: string, bio: string) => {
    const def = CAT_BY_ID.get(id);
    const how = def?.obtain?.how || HOW[id] || '';
    return `${bio}\n\nCÓMO SE CONSIGUE: ${how}${owned(id) ? '\n(Ya tienes uno en casa. Este es su primo.)' : ''}`;
  };
  const awake = ctx.has('won_ruptura_bibliotecario');
  const res: { id: string; species: string; slug: string; home: [number, number]; bio: string; alive?: boolean; y?: number }[] = [
    { id: 'p_marcapaginas', species: 'c_marcapaginas', slug: 'marcapaginas_bookmark_cat', home: [5.5, -1.5], bio: BIOS.c_marcapaginas },
    { id: 'p_tintero', species: 'r_tintero', slug: 'tintero_ink_cat', home: [18.5, 10.5], bio: BIOS.r_tintero },
    { id: 'p_archivista', species: 'e_archivista', slug: 'archivista_scholar_cat', home: [-21, 5.5], bio: BIOS.e_archivista },
    awake
      ? { id: 'p_bibliotecario', species: 'l_bibliotecario', slug: 'bibliotecario_drowned_cat', home: [-24, 1], bio: BIOS.l_bibliotecario_awake }
      : { id: 'p_bibliotecario', species: 'l_bibliotecario', slug: 'bibliotecario_drowned_cat', home: [SPOT.room.x - 1.2, SPOT.room.z - 1.6], bio: BIOS.l_bibliotecario_sleep, alive: false, y: bedTop },
    { id: 'p_espumita_a', species: 'c_espumita', slug: 'espumita_foam_cat', home: [11, 25.5], bio: BIOS.c_espumita },
    { id: 'p_espumita_b', species: 'c_espumita', slug: 'espumita_foam_cat', home: [-1, 27], bio: BIOS.c_espumita },
  ];
  const added = await Promise.all(
    res.map(async (r) => {
      const def = CAT_BY_ID.get(r.species);
      const home = new THREE.Vector3(r.home[0], r.y ?? height(r.home[0], r.home[1]), r.home[1]);
      const cat = await w.addResident({
        id: r.id,
        name: def?.name ?? r.species,
        slug: r.slug,
        url: catLiteUrl(r.slug),
        height: RARITY_H[def?.rarity ?? 'common'] ?? 2.5,
        home,
        tags: [...(def?.elements ?? []), 'paginas'],
        traits: TRAITS[def?.trait ?? ''] ?? { playful: 0.5, curious: 0.5 },
        acts: r.alive === false ? 'calm' : 'all',
        alive: r.alive,
      });
      ctx.describe.set(r.id, { title: def?.name ?? r.species, text: card(r.species, r.bio) });
      return cat;
    }),
  );
  const biblio = added[3];
  if (biblio && !awake) {
    biblio.brain.sleeping = true;
    biblio.facing = -1;
  }
  const agentOf = (id: string) => w.residents.get(id)?.agent;

  // ---------------------------------------------------------------- REGISTRO 000
  const regHome = new THREE.Vector3(S.x, stackTop, S.z);
  const registro = await w.addResident({ id: 'registro000', name: 'REGISTRO 000', slug: 'nadie_static_cat', url: catLiteUrl('nadie_static_cat'), height: 2.6, home: regHome, tags: [], acts: 'none', alive: false });
  if (registro) {
    registro.ghost = 1;
    registro.shadowAllowed = false;
    registro.shadow.visible = false;
    registro.blob.visible = false;
    registro.root.visible = false;
  }
  ctx.describe.set('registro000', { title: 'REGISTRO 000', text: REGISTRO_CARD });
  let regGone = false;
  let regGlitch = -1;

  // ---------------------------------------------------------------- «Pescar párrafos»
  const SPAWNS = [
    [13, 21],
    [-11, 18],
    [24, -1],
    [-20, -9],
    [8, -10],
    [-7, 4],
    [30, 15],
    [-35, 15],
    [18, -21],
    [-3, 30],
    [-26, 11],
    [36, -4],
  ].map(([x, z]) => new THREE.Vector3(x, Math.max(height(x, z), 0.3) + 2.8, z));
  const pageGeo = bin.add(new THREE.PlaneGeometry(1.7, 2.2, 6, 6));
  const fishMat = glowPageMaterial(bin, uTime, uTint, null, 0);
  type Fish = { mesh: THREE.Mesh; pos: THREE.Vector3; mark: THREE.Vector3; base: THREE.Vector3; state: 'idle' | 'caught' | 'gone'; t: number; spot: number; respawn: number; ph: number };
  const fish: Fish[] = [];
  const used = new Set<number>();
  const pickSpot = () => {
    const free = SPAWNS.map((_, i) => i).filter((i) => !used.has(i));
    return free[Math.floor(Math.random() * free.length)];
  };
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(pageGeo, fishMat);
    mesh.frustumCulled = false;
    root.add(mesh);
    const spot = pickSpot();
    used.add(spot);
    fish.push({ mesh, pos: SPAWNS[spot].clone(), mark: SPAWNS[spot].clone(), base: SPAWNS[spot].clone(), state: 'idle', t: 0, spot, respawn: 0, ph: Math.random() * 6.28 });
  }
  const fishLights: LocalLight[] = fish.map((f) => ({ pos: f.pos, color: new THREE.Color('#ffd27a'), range: 4.5, intensity: 0.9 }));
  lights.push(...fishLights);
  const pageHalos = haloMesh(
    bin,
    [...fish.map((f) => ({ p: f.pos, size: 4, color: '#ffd98a' })), { p: new THREE.Vector3(0, -50, 0), size: 0.01, color: '#ffc040' }],
    uPageHalo,
    uTime,
  );
  root.add(pageHalos);

  let busy = false;
  let alive = true;
  const nextLore = () => DIARIO.find((p) => !ctx.has(`pagina_leida:${p.n}`)) ?? null;
  const catchPage = async (f: Fish) => {
    if (busy || f.state !== 'idle') return;
    busy = true;
    f.state = 'caught';
    f.t = 0;
    w.pools.sparks.emit({ pos: f.pos, velJitter: { x: 2.5, y: 2.5, z: 2.5 }, life: 0.7, size: 0.35, color: '#fff3b0', color2: '#ffb347', count: 18 });
    ctx.feature('pagina');
    const lore = nextLore();
    if (lore) {
      ctx.flag(`pagina_leida:${lore.n}`);
      // a little gold the first time each page is read: about a minute of the island's production
      const gold = Math.round(Math.max(150, G.goldPerSec * 60));
      G.add('gold', gold, 'pagina');
      ctx.floatText(f.pos.clone(), `+${gold.toLocaleString('es-MX')} oro`);
      await ctx.say([
        ['CAPTION', lore.page],
        ['LUZTERNA', lore.luz],
      ]);
      const left = DIARIO.filter((p) => !ctx.has(`pagina_leida:${p.n}`)).length;
      if (alive) ctx.toast(left ? `DIARIO PERDIDO: ${8 - left}/8` : '¡DIARIO PERDIDO COMPLETO!', left ? 'Sigue pescando párrafos: flotan por toda la isla.' : 'Luzterna ya no quiere leer más. Tú sí, ¿verdad?');
    } else {
      await ctx.say(LOOSE[Math.floor(Math.random() * LOOSE.length)]);
    }
    busy = false;
  };

  // ---------------------------------------------------------------- Canelo's golden page (H36)
  let gold: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; pos: THREE.Vector3; state: 'float' | 'landing' | 'rest'; t: number; from: THREE.Vector3 } | null = null;
  let goldLoading = false;
  const GOLD_FLOAT = new THREE.Vector3(1.2, 9.2, -1.5);
  const goldLight: LocalLight = { pos: GOLD_FLOAT.clone(), color: new THREE.Color('#ffc040'), range: 5, intensity: 0 };
  lights.push(goldLight);
  const ensureGold = async (rest: boolean) => {
    if (gold || goldLoading) return;
    goldLoading = true;
    let img: HTMLImageElement | null = new Image();
    try {
      img.src = catLiteUrl('canelo_admiral_cat');
      await img.decode();
    } catch {
      img = null;
    }
    if (!alive) return;
    const tex = canvasTexture(bin, 512, 660, (g, cw, ch) => drawGoldenPage(g, cw, ch, img));
    const m = glowPageMaterial(bin, uTime, uTint, tex, 1);
    const mesh = new THREE.Mesh(bin.add(new THREE.PlaneGeometry(2.3, 2.96, 8, 8)), m);
    mesh.frustumCulled = false;
    root.add(mesh);
    const pos = rest ? REST.clone().add(new THREE.Vector3(0, 0.14, 0)) : GOLD_FLOAT.clone();
    gold = { mesh, mat: m, pos, state: rest ? 'rest' : 'float', t: 0, from: pos.clone() };
    goldLoading = false;
  };
  if (ctx.has('pagina_canelo_vista')) await ensureGold(true);
  else if (canelosTurn(ctx)) await ensureGold(false);

  /** Canelo walks up the spine stairs to the page and sits on it (his first free decision: a nap) */
  const sitOnPage: Activity = {
    id: 'pagina_canelo',
    stickiness: 9,
    interruptible: false,
    score: () => 0,
    start(a) {
      a.claimed = true;
      a.mem.wp = 0;
      a.label = 'va a sentarse en SU página';
    },
    update(a, _w, dt) {
      const wps = [new THREE.Vector3(SPOT.ramp.x, 0, SPOT.ramp.z1 - 0.5), new THREE.Vector3(SPOT.ramp.x, 0, BOOK.zTail - 1), REST];
      let i = a.mem.wp as number;
      if (i < wps.length) {
        // skip waypoints already behind him
        while (i < wps.length - 1 && a.pos.z < wps[i].z + 0.5) i++;
        a.target = wps[i].clone();
        a.speed = 2.6;
        if (Math.hypot(a.pos.x - wps[i].x, a.pos.z - wps[i].z) < 0.6) i++;
        a.mem.wp = i;
        if (((a.mem.blocked as number) ?? 0) > 2) {
          // cats are liquid: he finds a way (a puff of dust, and he is on the stairs)
          w.life.fx.dust?.(a.pos, a);
          a.pos.set(SPOT.ramp.x, height(SPOT.ramp.x, BOOK.zTail + 0.6), BOOK.zTail + 0.6);
          a.mem.blocked = 0;
        }
        return false;
      }
      a.target = null;
      a.cat.brain.crouch = 0.3;
      a.mem.t = ((a.mem.t as number) ?? 0) + dt;
      if ((a.mem.t as number) > 1.6) {
        a.cat.brain.sleeping = true;
        if (Math.random() < dt * 0.3) w.life.fx.zzz?.(a.pos, a);
      }
      return (a.mem.t as number) > 90;
    },
    stop(a) {
      a.claimed = false;
      a.cat.brain.sleeping = false;
      a.cat.brain.crouch = 0;
    },
  };
  const canelo = (): Agent | undefined => [...w.residents.values()].find((r) => r.opts.tags.includes('canelo'))?.agent;
  const playCanelo = async () => {
    if (busy || !gold || gold.state !== 'float') return;
    busy = true;
    gold.state = 'landing';
    gold.t = 0;
    gold.from.copy(gold.pos);
    w.rig.follow = null;
    w.rig.focus(REST.clone().add(new THREE.Vector3(0, 1, 0)), 15, 0.62);
    const a = canelo();
    if (a && w.director) {
      // far away (or swimming)? he shows up at the foot of the stairs, the way cats do
      if (a.swimming || a.pos.distanceTo(REST) > 26) {
        w.life.fx.dust?.(a.pos, a);
        a.swimming = false;
        a.cat.lift = 0;
        a.pos.set(SPOT.ramp.x + 0.6, 0, SPOT.ramp.z1 - 3);
        a.pos.y = height(a.pos.x, a.pos.z);
      }
      w.director.switchTo(a, sitOnPage);
    }
    await new Promise((r) => setTimeout(r, 1900));
    if (!alive) return;
    // the story beat (b36 part b) plays inside the region once the mission sees this counter
    ctx.feature('pagina_canelo');
    ctx.flag('pagina_canelo_vista');
    busy = false;
  };

  // ---------------------------------------------------------------- taps on things that are not residents
  const prevClick = w.rig.onClick;
  const near = (p: THREE.Vector3, x: number, y: number, r: number) => {
    const s = w.project(p);
    return !!s && Math.hypot(s.x - x, s.y - y) < r;
  };
  const registroTap = async () => {
    if (!registro || regGone) return;
    regGone = true;
    regGlitch = 0;
    w.rig.follow = null;
    w.rig.focus(regHome.clone().add(new THREE.Vector3(0, 1.3, 0)), 14, 0.3);
    await new Promise((r) => setTimeout(r, 1200));
    if (!alive) return;
    const k = (G.s.counters.registro_region_seen ?? 0) % REGISTRO_LINES.length;
    G.count('registro_region_seen');
    await ctx.say(REGISTRO_LINES[k]);
  };
  w.rig.onClick = (x, y) => {
    if (busy) return;
    if (registro?.root.visible && !regGone && near(registro.root.position.clone().add(new THREE.Vector3(0, 1.3, 0)), x, y, 60)) return void registroTap();
    if (gold?.state === 'float' && near(gold.pos, x, y, 80)) return void playCanelo();
    for (const f of fish) if (f.state === 'idle' && near(f.pos, x, y, 64)) return void catchPage(f);
    prevClick?.(x, y);
  };

  // ---------------------------------------------------------------- the living part (every frame)
  const tmpO = new THREE.Object3D();
  let pageT = 0;
  let bitT = 0;
  let shhT = 6;
  let inkT = 0;
  let bubT = 0;
  const camPos = w.camera.position;
  w.addProp({
    group: root,
    lights,
    update(dt, t, night) {
      uTime.value = t;
      uNight.value = night;
      const s = w.cycle.s;
      uTint.value.copy(s.grade).multiplyScalar(0.6 + 0.4 * Math.min(1, s.sunI / 2.2) + night * 0.15);
      uHalo.value = Math.pow(night, 1.3) * 1.15;
      uPageHalo.value = 0.8 + night * 0.5;
      pool.sky.copy(s.horizon);
      pages.update(dt);
      lh.update(dt, t, night);
      // lamps
      lights[0].intensity = 0.3 + night * 1.2;
      deskLight.intensity = 0.2 + night * 1.1;
      deskPL.intensity = night * 7;
      poolLight.intensity = 0.15 + night * 0.9;
      poolPL.intensity = night * 5;
      for (let i = 0; i < lanternLights.length; i++) lanternLights[i].intensity = night * (1.0 + 0.12 * Math.sin(t * 6.3 + i * 1.7) * Math.sin(t * 2.1 + i));
      // floating books bob on the real waves
      floaters.forEach((f, i) => {
        const sw = w.ocean.sample(f.x, f.z, height(f.x, f.z));
        tmpO.position.set(f.x, sw.y + 0.08, f.z);
        tmpO.rotation.set(sw.tiltX * 0.8 + Math.sin(t * 0.7 + f.ph) * 0.05, f.yaw + Math.sin(t * 0.2 + f.ph) * 0.3, sw.tiltZ * 0.8);
        tmpO.scale.set(f.s, f.s * 0.8, f.s);
        tmpO.updateMatrix();
        floatMesh.setMatrixAt(i, tmpO.matrix);
      });
      floatMesh.instanceMatrix.needsUpdate = true;
      // fishing pages
      fish.forEach((f, i) => {
        f.t += dt;
        if (f.state === 'idle') {
          f.pos.set(f.base.x + Math.cos(t * 0.35 + f.ph) * 1.2, f.base.y + Math.sin(t * 1.3 + f.ph) * 0.35, f.base.z + Math.sin(t * 0.35 + f.ph) * 1.2);
          f.mesh.visible = true;
          f.mesh.position.copy(f.pos);
          // it shows you its face (more or less: it is paper, it flutters)
          f.mesh.rotation.set(Math.sin(t * 0.9 + f.ph) * 0.25, Math.atan2(camPos.x - f.pos.x, camPos.z - f.pos.z) + Math.sin(t * 0.7 + f.ph) * 0.7, Math.sin(t * 1.1 + f.ph) * 0.2);
          f.mesh.scale.setScalar(1);
          fishLights[i].intensity = 0.9;
          if (Math.random() < dt * 2.5) w.pools.stars.emit({ pos: f.pos, spread: { x: 0.7, y: 0.9, z: 0.7 }, vel: { x: 0, y: 0.5, z: 0 }, life: 1.6, size: 0.22, color: '#fff3b0', color2: '#ffb347', count: 1 });
        } else if (f.state === 'caught') {
          const k = Math.min(1, f.t / 0.8);
          f.mesh.position.set(f.pos.x, f.pos.y + k * 3, f.pos.z);
          f.mesh.rotation.y += dt * 14;
          f.mesh.scale.setScalar(Math.max(0.001, 1 - k));
          fishLights[i].intensity = 0.9 * (1 - k);
          if (k >= 1) {
            f.state = 'gone';
            f.t = 0;
            f.respawn = 16 + Math.random() * 18;
            f.mesh.visible = false;
            used.delete(f.spot);
          }
        } else if (f.t > f.respawn) {
          const spot = pickSpot();
          // never pop in right in front of the camera
          if (spot !== undefined && SPAWNS[spot].distanceTo(camPos) > 14) {
            used.add(spot);
            f.spot = spot;
            f.base.copy(SPAWNS[spot]);
            f.state = 'idle';
            f.t = 0;
            w.pools.sparks.emit({ pos: f.base, velJitter: { x: 1.5, y: 1.5, z: 1.5 }, life: 0.6, size: 0.3, color: '#fff3b0', color2: '#ffd27a', count: 10 });
          }
        }
        f.mark.copy(f.pos).y += 1.9;
        tmpO.position.copy(f.mesh.visible ? f.mesh.position : new THREE.Vector3(0, -50, 0));
        tmpO.rotation.set(0, 0, 0);
        tmpO.scale.setScalar(4 * (f.mesh.visible ? f.mesh.scale.x : 0.001));
        tmpO.updateMatrix();
        pageHalos.setMatrixAt(i, tmpO.matrix);
      });
      // the golden page
      if (!gold && !goldLoading && canelosTurn(ctx) && !ctx.has('pagina_canelo_vista')) void ensureGold(false);
      if (gold) {
        const gp = gold;
        gp.t += dt;
        if (gp.state === 'float') {
          gp.pos.set(GOLD_FLOAT.x + Math.sin(t * 0.5) * 0.6, GOLD_FLOAT.y + Math.sin(t * 1.1) * 0.4, GOLD_FLOAT.z);
          gp.mesh.position.copy(gp.pos);
          gp.mesh.rotation.set(Math.sin(t * 0.8) * 0.15, Math.sin(t * 0.4) * 0.6, Math.sin(t * 0.9) * 0.1);
          gp.mesh.visible = canelosTurn(ctx);
          if (gp.mesh.visible && Math.random() < dt * 5) w.pools.stars.emit({ pos: gp.pos, spread: { x: 1.1, y: 1.4, z: 0.4 }, vel: { x: 0, y: 0.4, z: 0 }, life: 1.8, size: 0.3, color: '#fff3b0', color2: '#ffb020', count: 1 });
        } else if (gp.state === 'landing') {
          const k = Math.min(1, gp.t / 1.8);
          const e = k * k * (3 - 2 * k);
          const restP = REST.clone().add(new THREE.Vector3(0, 0.14, 0));
          gp.pos.lerpVectors(gp.from, restP, e);
          gp.pos.y += Math.sin(k * Math.PI) * 0.8;
          gp.mesh.position.copy(gp.pos);
          gp.mesh.rotation.set(-Math.PI / 2 * e + Math.sin(k * 9) * 0.2 * (1 - k), (1 - e) * 2, 0);
          if (k >= 1) {
            gp.state = 'rest';
            w.pools.sparks.emit({ pos: restP, spread: { x: 1, y: 0.1, z: 1.3 }, velJitter: { x: 2, y: 2.5, z: 2 }, life: 0.9, size: 0.35, color: '#fff3b0', color2: '#ffb020', count: 26 });
          }
        } else {
          gp.mesh.position.copy(REST).add(new THREE.Vector3(0, 0.14, 0));
          gp.mesh.rotation.set(-Math.PI / 2, 0, 0.2);
          gp.mesh.visible = true;
        }
        gp.mat.uniforms.uGlow.value = gp.state === 'rest' ? 0.35 : 1;
        goldLight.pos.copy(gp.mesh.position);
        goldLight.intensity = gp.mesh.visible ? (gp.state === 'rest' ? 0.4 : 1.1) : 0;
        tmpO.position.copy(gp.mesh.visible ? gp.mesh.position : new THREE.Vector3(0, -50, 0));
        tmpO.scale.setScalar(gp.state === 'rest' ? 2.6 : 5);
      } else {
        tmpO.position.set(0, -50, 0);
        tmpO.scale.setScalar(0.001);
      }
      tmpO.rotation.set(0, 0, 0);
      tmpO.updateMatrix();
      pageHalos.setMatrixAt(3, tmpO.matrix);
      pageHalos.instanceMatrix.needsUpdate = true;
      // REGISTRO 000: night, no heavy rain, and never when you get close
      if (registro) {
        if (regGlitch >= 0) {
          regGlitch += dt;
          const k = regGlitch / 0.9;
          registro.root.visible = k < 1 && Math.random() > k;
          if (k >= 1) regGlitch = -1;
        } else {
          const show = !regGone && night > 0.7 && w.weather.rain < 0.35;
          registro.root.visible = show && camPos.distanceTo(registro.root.position) > 22;
        }
        registro.shadow.visible = false;
        registro.brain.look = Math.sign(camPos.x - registro.root.position.x);
      }
      // loose paper bits always in the air
      pageT -= dt;
      if (pageT <= 0) {
        pageT = 0.14;
        const a = Math.random() * 6.28;
        const r = Math.random() * 30;
        w.pools.pages.emit({ pos: { x: Math.cos(a) * r, y: 4 + Math.random() * 6, z: Math.sin(a) * r - 4 }, vel: { x: 0.6, y: 1.1, z: 0.2 }, velJitter: { x: 0.6, y: 0.4, z: 0.6 }, life: 7, size: 0.32, color: '#f4ecd6', color2: '#d9c9a2', count: 1 });
      }
      // ink: Tintero signs the ground he walks on; the pool breathes letters at night
      inkT -= dt;
      const tin = agentOf('p_tintero');
      if (tin && inkT <= 0 && Math.hypot(tin.vel.x, tin.vel.z) > 0.6 && !tin.swimming) {
        inkT = 0.28;
        w.pools.smoke.emit({ pos: { x: tin.pos.x, y: tin.pos.y + 0.06, z: tin.pos.z }, life: 3.5, size: 0.42, color: '#1d1a33', color2: '#2a2550', count: 1 });
      }
      bitT -= dt;
      if (bitT <= 0) {
        bitT = 0.5;
        if (night > 0.4) w.pools.motes.emit({ pos: { x: SPOT.pool.x, y: SPOT.pool.surface + 0.2, z: SPOT.pool.z }, spread: { x: 3, y: 0, z: 3 }, vel: { x: 0, y: 0.6, z: 0 }, life: 3, size: 0.26, color: '#9fc8ff', color2: '#8a7cff', count: 1 });
      }
      // the Bibliotecario: bubbles in his sleep; awake, he shushes anyone who runs
      bubT -= dt;
      if (biblio && bubT <= 0) {
        bubT = 0.45;
        if (!awake) w.pools.snow.emit({ pos: { x: biblio.root.position.x, y: biblio.root.position.y + 1.6, z: biblio.root.position.z }, spread: { x: 0.4, y: 0.2, z: 0.4 }, vel: { x: 0, y: 0.7, z: 0 }, velJitter: { x: 0.1, y: 0.2, z: 0.1 }, life: 2.4, size: 0.18, color: '#e8fbff', color2: '#9fd8ff', count: 1 });
      }
      shhT -= dt;
      if (biblio && shhT <= 0) {
        const bp = biblio.root.position;
        if (!awake && camPos.distanceTo(bp) < 15) {
          shhT = 22;
          ctx.floatText(bp.clone().add(new THREE.Vector3(0, 3.2, 0)), 'Shhh…');
        } else if (awake) {
          const loud = w.director?.agents.find((o) => o.cat !== biblio && o.pos.distanceTo(bp) < 4.5 && Math.hypot(o.vel.x, o.vel.z) > 2.6);
          if (loud) {
            shhT = 14;
            biblio.brain.emote('attack', 0.6);
            ctx.floatText(bp.clone().add(new THREE.Vector3(0, 3.6, 0)), 'SHHH.');
          }
        }
      }
    },
  });

  // ---------------------------------------------------------------- points of interest
  const pois: POI[] = fish.map((f, i) => ({
    id: `pagina_${i}`,
    pos: f.mark,
    label: 'PESCAR PÁRRAFO',
    kind: 'activity' as const,
    visible: () => f.state === 'idle' && !busy,
    onTap: () => catchPage(f),
  }));
  pois.push({
    id: 'pagina_canelo',
    pos: GOLD_FLOAT.clone().add(new THREE.Vector3(0, 2.4, 0)),
    label: 'LA PÁGINA DE CANELO',
    kind: 'activity',
    visible: () => !!gold && gold.state === 'float' && canelosTurn(ctx) && !busy,
    onTap: () => playCanelo(),
  });

  // dev hooks (headless shots, perf, the activities)
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__paginas = {
      ready: true,
      world: w,
      fish,
      setHour(h: number) {
        region.hour = Math.max(0.01, h);
        w.hour = region.hour;
      },
      catchPage: (i = 0) => catchPage(fish[i]),
      playCanelo: async () => {
        await ensureGold(false);
        return playCanelo();
      },
      registroTap,
      registro: () => ({ visible: registro?.root.visible, pos: registro?.root.position.toArray() }),
      info: () => ({ calls: w.renderer.info.render.calls, tris: w.renderer.info.render.triangles, fps: Math.round(w.stats.fps), p95: w.stats.pct(95), tier: w.tier, geos: w.renderer.info.memory.geometries, tex: w.renderer.info.memory.textures }),
      cam(target: [number, number, number], dist: number, pitch: number, yaw: number) {
        w.rig.follow = null;
        w.rig.focus(new THREE.Vector3(...target), dist, pitch, yaw);
        w.rig.cut();
      },
    };
  }

  return {
    pois,
    dispose() {
      alive = false;
      busy = false;
      bin.dispose();
      if (import.meta.env.DEV) delete (window as unknown as Record<string, unknown>).__paginas;
    },
  };
}
