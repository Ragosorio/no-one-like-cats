/**
 * NO ONE LIKE CATS · PARTE II — LA ERA DE LAS RUPTURAS · vertical slice (rupturas.html).
 *
 * A small, real piece of the 2.5D home island built on AgentGameEngine (src/engine):
 * terrain + ocean + sky with a day/night cycle and weather, Luzterna's lighthouse finally lit,
 * three living habitats, eight MAI cats with ambient life, the player's ship, the COLAPSO ESTELAR
 * ability, and REGISTRO 000 watching from the rocks at night.
 *
 * Isolation: this page never imports the game state and never reads or writes a save.
 */
import '@fontsource/bangers';
import '@fontsource/space-grotesk';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/permanent-marker';
import * as THREE from 'three';
import { Heightfield } from '../engine/world/heightfield';
import { Ocean } from '../engine/world/ocean';
import { DayCycle, SkyDome } from '../engine/world/sky';
import { Flora, wind, type Placement } from '../engine/world/flora';
import { PaperCat, loadPaperArt, paperLighting, type LocalLight } from '../engine/world/paperCat';
import { ParticlePool } from '../engine/fx/particles';
import { Weather, type Sky } from '../engine/world/weather';
import { CameraRig } from '../engine/camera/rig';
import { AutoQuality, FrameStats, QUALITY, TIERS, heapMB, type Tier } from '../engine/core/perf';
import { LifeDirector, type Agent, type LifeWorld } from '../engine/life/director';
import { rng, smoothstep } from '../engine/core/noise';
import { ISLAND_R, PADS, POI, TERRAIN_HALF, heightAt, slopeAt, walkable } from './island';
import { cosmicHabitat, dock, fireHabitat, iceHabitat, lighthouse, ship as makeShip } from './props';
import { activities, type Spots } from './life';
import { PracticeRaft, StellarCollapse } from './collapse';
import { CAST, LUZTERNA, REGISTRO } from './cast';
import { IslandViews } from './views';
import { parseIsland, pickCast, readSaveReadOnly, type BridgeIsland, type SpeciesInfo } from './bridge';
import type { CastDef } from './cast';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ───────────────────────────── settings (per-viewer convenience only) ─────────────────────────────
const LS = 'nolc-rupturas-settings';
interface Settings {
  tier: Tier;
  auto: boolean;
  reduced: boolean;
  fx: number;
  hud: boolean;
}
function loadSettings(): Settings {
  const def: Settings = { tier: 'alto', auto: true, reduced: prefersReduced, fx: 1, hud: true };
  try {
    return { ...def, ...JSON.parse(localStorage.getItem(LS) ?? '{}') };
  } catch {
    return def;
  }
}
const settings = loadSettings();
const saveSettings = () => {
  try {
    localStorage.setItem(LS, JSON.stringify(settings));
  } catch {
    /* private mode */
  }
};
const urlTier = new URLSearchParams(location.search).get('q') as Tier | null;
if (urlTier && TIERS.includes(urlTier)) settings.tier = urlTier;
const BOOT_TIER = settings.tier;
const Q = () => QUALITY[settings.tier];

// ───────────────────────────── renderer / scene ─────────────────────────────
const canvas = $<HTMLCanvasElement>('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: QUALITY[BOOT_TIER].msaa, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false; // refreshed every Q().shadowEvery frames (frame())
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#cfe6f5', 80, 300);
const camera = new THREE.PerspectiveCamera(42, 1, 0.3, 2000);

function resize() {
  const q = Q();
  const dpr = Math.min(devicePixelRatio || 1, q.dprCap) * q.scale;
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ───────────────────────────── world ─────────────────────────────
const cycle = new DayCycle();
const sky = new SkyDome();
scene.add(sky.mesh);

const terrain = new Heightfield({
  half: TERRAIN_HALF,
  segments: QUALITY[BOOT_TIER].terrainSeg,
  height: heightAt,
  texSize: 160,
  paint(x, z, h, slope, out) {
    // sand → grass → moss/rock, with element tints near the habitats
    if (h < 0.15) out.set('#d9c48e');
    else if (h < 0.75) out.set('#f2dfa6').lerp(new THREE.Color('#e8d394'), Math.min(1, slope));
    else if (slope > 0.95) out.set('#8d8a86').lerp(new THREE.Color('#6f6a70'), smoothstep(0.95, 1.6, slope));
    else out.set('#6cc45a').lerp(new THREE.Color('#4f9f4a'), smoothstep(1.5, 5, h)).lerp(new THREE.Color('#9ccf5d'), 0.25 * Math.sin(x * 0.3) * Math.cos(z * 0.27) + 0.1);
    const near = (p: { x: number; z: number; r: number }, c: string, k: number) => {
      const d = Math.hypot(x - p.x, z - p.z) / (p.r * 1.25);
      if (d < 1) out.lerp(new THREE.Color(c), (1 - d * d) * k);
    };
    // dirt paths between the places cats actually go
    const seg = (a: { x: number; z: number }, b: { x: number; z: number }) => {
      const vx = b.x - a.x;
      const vz = b.z - a.z;
      const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz)));
      return Math.hypot(x - (a.x + vx * t), z - (a.z + vz * t));
    };
    const P = PADS;
    const dPath = Math.min(seg(P.dock, P.palm), seg(P.palm, P.fire), seg(P.palm, P.cosmic), seg(P.fire, P.ice), seg(P.palm, P.lighthouse), seg(P.palm, P.sanctuary));
    const wob = 0.35 * Math.sin(x * 0.7 + z * 0.4);
    if (h > 0.6 && dPath < 1.4 + wob) out.lerp(new THREE.Color('#d9bf8c'), 0.85 * (1 - smoothstep(0.9 + wob, 1.4 + wob, dPath)));
    near(PADS.fire, '#5b3a30', 0.75);
    near(PADS.ice, '#e9f4ff', 0.8);
    near(PADS.cosmic, '#3b3460', 0.55);
    near(PADS.lighthouse, '#b8ab98', 0.5);
    near(PADS.sanctuary, '#cdb7e8', 0.35);
    if (h < -0.3) out.multiplyScalar(0.85);
  },
});
scene.add(terrain.mesh);

const ocean = new Ocean({ size: 900, segments: QUALITY[BOOT_TIER].waterSeg, heightTex: terrain.heightTex, terrainHalf: TERRAIN_HALF });
scene.add(ocean.mesh);

// lights
const hemi = new THREE.HemisphereLight('#cfe8ff', '#6b5a40', 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 2.4);
sun.castShadow = QUALITY[BOOT_TIER].shadows;
sun.shadow.mapSize.setScalar(QUALITY[BOOT_TIER].shadowMap);
const sc = sun.shadow.camera;
sc.left = sc.bottom = -60;
sc.right = sc.top = 60;
sc.near = 1;
sc.far = 260;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.12;
scene.add(sun, sun.target);

// flora scattering (deterministic)
const R = rng(42);
const padClear = (x: number, z: number, m = 1) => Object.values(PADS).every((p) => Math.hypot(x - p.x, z - p.z) > p.r * m);
const palms: Placement[] = [{ x: PADS.palm.x, y: PADS.palm.h, z: PADS.palm.z, s: 1.3, r: 2.2 }];
for (let k = 0; k < 400 && palms.length < 22; k++) {
  const a = R() * Math.PI * 2;
  const d = 12 + R() * (ISLAND_R - 12);
  const x = Math.cos(a) * d;
  const z = Math.sin(a) * d;
  const h = heightAt(x, z);
  if (h < 0.5 || h > 4 || slopeAt(x, z) > 0.8 || !padClear(x, z, 1.15)) continue;
  if (palms.some((p) => Math.hypot(p.x - x, p.z - z) < 4)) continue;
  palms.push({ x, y: h - 0.1, z, s: 0.8 + R() * 0.45, r: R() * Math.PI * 2 });
}
const rocks: Placement[] = [];
for (let k = 0; k < 600 && rocks.length < 46; k++) {
  const x = (R() * 2 - 1) * ISLAND_R;
  const z = (R() * 2 - 1) * ISLAND_R;
  const h = heightAt(x, z);
  if (h < -0.6 || !padClear(x, z, 1.1)) continue;
  if (slopeAt(x, z) < 0.6 && R() > 0.25 && h > 0.2) continue;
  rocks.push({ x, y: h - 0.1, z, s: 0.5 + R() * 1.4, r: R() * 6 });
}
function onPath(x: number, z: number) {
  const P = PADS;
  const seg = (a: { x: number; z: number }, b: { x: number; z: number }) => {
    const vx = b.x - a.x;
    const vz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz)));
    return Math.hypot(x - (a.x + vx * t), z - (a.z + vz * t));
  };
  return Math.min(seg(P.dock, P.palm), seg(P.palm, P.fire), seg(P.palm, P.cosmic), seg(P.fire, P.ice), seg(P.palm, P.lighthouse), seg(P.palm, P.sanctuary)) < 1.7;
}
const grass: Placement[] = [];
const flowers: Placement[] = [];
const gN = Math.round(2600 * QUALITY[BOOT_TIER].grass);
for (let k = 0; k < gN * 4 && grass.length < gN; k++) {
  const x = (R() * 2 - 1) * ISLAND_R;
  const z = (R() * 2 - 1) * ISLAND_R;
  const h = heightAt(x, z);
  if (h < 0.8 || slopeAt(x, z) > 0.9 || !padClear(x, z, 0.85) || onPath(x, z)) continue;
  grass.push({ x, y: h - 0.05, z, s: 0.55 + R() * 0.6, r: R() * 6 });
  if (R() < 0.22) flowers.push({ x: x + 0.3, y: h - 0.02, z: z + 0.2, s: 0.8 + R() * 0.6, r: R() * 6 });
}
const flora = new Flora({ palms, rocks, grass, flowers });
scene.add(flora.group);

// particles
const embers = new ParticlePool(900, { gravity: -0.4, wobble: 0.35 });
const smoke = new ParticlePool(160, { additive: false, wobble: 0.3 });
const snow = new ParticlePool(700, { additive: false, wobble: 0.5, shape: 'flake' });
const stardust = new ParticlePool(500, { wobble: 0.25, shape: 'star' });
const sparks = new ParticlePool(1600, { wobble: 0.1, shape: 'star' });
const dust = new ParticlePool(1400, { additive: false, gravity: 9, wobble: 0.1 });
const motes = new ParticlePool(400, { wobble: 0.6, shape: 'star' });
const pools = [embers, smoke, snow, stardust, sparks, dust, motes];
pools.forEach((p) => scene.add(p.points));
function applyBudget() {
  pools.forEach((p) => (p.budget = Q().particles * settings.fx));
}
applyBudget();

// props
const lh = lighthouse();
const dk = dock();
const fire = fireHabitat(embers, smoke);
const ice = iceHabitat(snow);
const cosmic = cosmicHabitat(stardust);
const props = [lh, dk, fire, ice, cosmic];
props.forEach((p) => scene.add(p.group));
const boat = makeShip();
boat.group.scale.setScalar(1.7);
scene.add(boat.group);
const raft = new PracticeRaft(new THREE.Vector3(POI.arena.x, 0, POI.arena.z));
scene.add(raft.group);

// a lone sea stack off the west coast: REGISTRO 000 sits there at night, watching the island
const SEA_STACK = { x: -54, z: -24, top: 3.4 };
let seaStack: THREE.Mesh | null = null;
{
  const geo = new THREE.CylinderGeometry(1.6, 3.4, 10, 7, 3);
  const pp = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pp.count; i++) {
    const k = 1 + 0.18 * Math.sin(pp.getY(i) * 1.3 + i) * Math.cos(i * 2.7);
    pp.setX(i, pp.getX(i) * k);
    pp.setZ(i, pp.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const stack = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: '#6f6a78', gradientMap: terrain.material.gradientMap }));
  stack.position.set(SEA_STACK.x, SEA_STACK.top - 5, SEA_STACK.z);
  stack.castShadow = stack.receiveShadow = true;
  scene.add(stack);
  seaStack = stack;
}

// weather
const weather = new Weather(Math.round(9000 * Math.min(1, Q().particles + 0.3)));
weather.reducedFlashes = settings.reduced;
scene.add(weather.mesh);

// ───────────────────────────── las dos caras: PÁGINA ⇄ MUNDO ─────────────────────────────
const views = new IslandViews();
const PAPER = new THREE.Color('#efe4cf');
/** props: rest y (they ride the flattened terrain) */
const propRestY = new Map<THREE.Object3D, number>();
function registerViews() {
  views.add(terrain.mesh, new THREE.Vector3(terrain.mesh.position.x, 0, terrain.mesh.position.z));
  views.add(flora.group, new THREE.Vector3(0, 0, 0));
  for (const o of [lh.group, dk.group, fire.group, ice.group, cosmic.group, boat.group, raft.group, ...(seaStack ? [seaStack] : [])]) {
    views.add(o);
    propRestY.set(o, o.position.y);
  }
}
let savedCam: { x: number; y: number; z: number; yaw: number; pitch: number; dist: number } | null = null;
let seenPage = false;
views.onChange = (m) => {
  $('viewBtn').textContent = m === 'pagina' ? 'VER EL MUNDO' : 'VER LA PÁGINA';
  document.body.classList.toggle('page', m === 'pagina');
  rig.follow = null;
  if (m === 'pagina') {
    const g = rig.goal;
    savedCam = { x: g.target.x, y: g.target.y, z: g.target.z, yaw: g.yaw, pitch: g.pitch, dist: g.dist };
    rig.lockOrbit = true;
    rig.focus(new THREE.Vector3(0, 0, 6), 175, 0.62, Math.PI / 4);
    selected = null;
    $('card').classList.remove('open');
    if (!seenPage) {
      seenPage = true;
      toast('LUZTERNA: «Así te la enseñé el primer día, ¿te acuerdas? Una isla en una página. Ahí es donde se construye.»');
      setTimeout(() => toast('LUZTERNA: «…y alguien anda escribiendo en los márgenes. Esa no es mi letra.»'), 4200);
    }
  } else {
    rig.lockOrbit = false;
    if (savedCam) rig.focus(new THREE.Vector3(savedCam.x, savedCam.y, savedCam.z), savedCam.dist, savedCam.pitch, savedCam.yaw);
    else rig.focus(new THREE.Vector3(-2, 2, 4), 40, 0.5, 0.35);
  }
};

/** margin notes: only legible on the PAGE (the Titiriteros write in the margins) */
const NOTES: { text: string; at: THREE.Vector3; rot: number }[] = [
  { text: '¿y el 000? ↘', at: new THREE.Vector3(-46, 0, -30), rot: -6 },
  { text: 'la luz sale de la caja.\n¿quién la está viendo?', at: new THREE.Vector3(44, 0, 14), rot: 4 },
  { text: 'propiedad de Canelo\n(según Canelo)', at: new THREE.Vector3(10, 0, -9), rot: -3 },
  { text: 'FOLIO 001 — tu isla.\nFOLIO 000 — ~~vacante~~', at: new THREE.Vector3(-36, 0, 34), rot: 5 },
];
const noteEls = NOTES.map((n) => {
  const el = document.createElement('div');
  el.className = 'margin-note';
  el.innerHTML = n.text.replace(/~~(.+?)~~/g, '<s>$1</s>').replace(/\n/g, '<br>');
  el.style.setProperty('--rot', `${n.rot}deg`);
  document.body.appendChild(el);
  return el;
});
const tmpN = new THREE.Vector3();
function updateNotes(lens: number) {
  NOTES.forEach((n, i) => {
    const el = noteEls[i];
    if (lens < 0.02) {
      el.style.opacity = '0';
      return;
    }
    tmpN.copy(n.at).project(camera);
    el.style.opacity = String(Math.max(0, (lens - 0.6) / 0.4));
    // notes live in the margins: keep them on the sheet even when their anchor is off-frame
    const x = Math.min(innerWidth - 150, Math.max(150, (tmpN.x * 0.5 + 0.5) * innerWidth));
    const y = Math.min(innerHeight - 150, Math.max(130, (-tmpN.y * 0.5 + 0.5) * innerHeight));
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) rotate(var(--rot))`;
  });
}
const NOON = new DayCycle().evaluate(12.5);

// ── H31 · "La página se dobla": the story beat that justifies the new way of seeing ──
const INTRO_KEY = 'nolc-rupturas-h31';
let introActive = false;
const crease = document.createElement('button');
crease.className = 'crease';
crease.setAttribute('aria-label', 'Tocar el pliegue de la página');
crease.innerHTML = '<svg viewBox="0 0 120 60"><path d="M4 40 L30 22 L46 34 L70 10 L88 26 L116 6" /></svg><span>¿un pliegue?</span>';
document.body.appendChild(crease);
const creaseAt = new THREE.Vector3(PADS.lighthouse.x - 6, 0, PADS.lighthouse.z + 6);
function startIntro() {
  introActive = true;
  views.set('pagina', true);
  rig.lockOrbit = true;
  rig.focus(new THREE.Vector3(0, 0, 6), 175, 0.62, Math.PI / 4);
  rig.cut();
  hour = 21.5;
  crease.classList.add('show');
  setTimeout(() => toast('LUZTERNA: «Capi… ¿tu página siempre tuvo ese doblez junto al faro?»'), 1500);
}
crease.addEventListener('click', () => {
  if (!introActive) return;
  introActive = false;
  crease.classList.remove('show');
  try {
    localStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* per-viewer convenience only */
  }
  views.setDuration(3.2);
  views.set('mundo');
  rig.lockOrbit = false;
  rig.focus(new THREE.Vector3(PADS.lighthouse.x - 8, PADS.lighthouse.h, PADS.lighthouse.z + 10), 38, 0.32, 0.9);
  rig.shake(0.2);
  toast('LUZTERNA: «¡Agárrate de Canelo!»');
  setTimeout(() => toast('LUZTERNA: «Capi, no te asustes. La isla siempre fue así de gorda; nomás la estábamos viendo desde arriba… del papel.»'), 3400);
  setTimeout(() => toast('LUZTERNA: «Mi linterna alumbra para afuera de la caja. Y algo, allá afuera, acaba de abrir los ojos.»'), 8200);
  setTimeout(() => views.setDuration(1.8), 3400);
});
function updateCrease() {
  if (!crease.classList.contains('show')) return;
  tmpN.copy(creaseAt).project(camera);
  crease.style.transform = `translate(${(tmpN.x * 0.5 + 0.5) * innerWidth}px, ${(-tmpN.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-50%)`;
}
registerViews();

// ───────────────────────────── camera ─────────────────────────────
const rig = new CameraRig(camera, canvas, { target: new THREE.Vector3(-2, 2, 4), yaw: 0.35, pitch: 0.5, dist: 40 });
rig.reducedMotion = settings.reduced;
const groundOrSea = (x: number, z: number) => Math.max(heightAt(x, z), 0);

// ───────────────────────────── cats ─────────────────────────────
const spots: Spots = {
  home: {
    canelo: new THREE.Vector3(PADS.palm.x + 1.6, PADS.palm.h, PADS.palm.z + 1.2),
    chispa: fire.spot.clone().add(new THREE.Vector3(1.5, 0, 2)),
    gelatino: new THREE.Vector3(PADS.dock.x - 4, 0, PADS.dock.z - 3),
    copito: ice.spot.clone(),
    cometin: cosmic.spot.clone(),
    nimbo: new THREE.Vector3(-4, 0, -6),
    ignis: fire.spot.clone(),
  },
  shelters: [
    new THREE.Vector3(PADS.palm.x + 1.6, PADS.palm.h, PADS.palm.z + 1.2),
    new THREE.Vector3(PADS.lighthouse.x - 4.2, PADS.lighthouse.h, PADS.lighthouse.z + 2.5),
    ice.spot.clone(),
    ...palms.slice(1, 6).map((p) => new THREE.Vector3(p.x + 1.2, p.y, p.z + 0.6)),
  ],
  shore: [],
  iceCenter: ice.center.clone(),
  cosmic: cosmic.spot.clone(),
  lava: fire.spot.clone(),
};
for (const s of Object.values(spots.home)) s.y = heightAt(s.x, s.z);
for (let k = 0; k < 28; k++) {
  const a = (k / 28) * Math.PI * 2;
  let last: THREE.Vector3 | null = null;
  for (let d = 14; d < ISLAND_R + 12; d += 0.6) {
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (walkable(x, z)) last = new THREE.Vector3(x, heightAt(x, z), z);
    else if (last && heightAt(x, z) < 0.2) break;
  }
  if (last && slopeAt(last.x, last.z) < 0.7) spots.shore.push(last);
}

const world: LifeWorld = {
  time: 0,
  hour: 17,
  night: 0,
  rain: 0,
  storm: 0,
  agents: [],
  obstacles: [
    { x: PADS.lighthouse.x, z: PADS.lighthouse.z, r: 3.6 },
    { x: PADS.fire.x, z: PADS.fire.z, r: 3.5 },
    { x: PADS.fire.x - 3.2, z: PADS.fire.z - 3, r: 2.4 },
    { x: PADS.cosmic.x, z: PADS.cosmic.z, r: 4.4 },
    { x: PADS.ice.x - 1.6, z: PADS.ice.z - 1.2, r: 1.8 },
    ...palms.map((p) => ({ x: p.x, z: p.z, r: 0.55 * p.s })),
  ],
  groundAt: (x, z) => heightAt(x, z),
  walkable,
  camera,
  fx: {
    zzz: (p) => motes.emit({ pos: { x: p.x, y: p.y + 1.6, z: p.z }, vel: { x: 0.2, y: 0.5, z: 0 }, life: 2.2, size: 0.3, color: '#cfd8ff', color2: '#ffffff', count: 1 }),
    dust: (p) => dust.emit({ pos: { x: p.x, y: p.y + 0.2, z: p.z }, spread: { x: 0.4, y: 0, z: 0.4 }, vel: { x: 0, y: 2, z: 0 }, velJitter: { x: 1.4, y: 0.8, z: 1.4 }, life: 0.7, size: 0.35, color: '#f2e2b8', color2: '#d8c39a', count: 10 }),
    steam: (p) => smoke.emit({ pos: { x: p.x, y: p.y + 0.3, z: p.z }, spread: { x: 0.6, y: 0.1, z: 0.6 }, vel: { x: 0, y: 1.6, z: 0 }, velJitter: { x: 0.4, y: 0.4, z: 0.4 }, life: 1.6, size: 1.1, color: '#ffffff', color2: '#d8e8ff', count: 2 }),
    starmote: (p) => stardust.emit({ pos: { x: p.x, y: p.y + 1.8, z: p.z }, spread: { x: 1, y: 0.6, z: 1 }, vel: { x: 0, y: 0.4, z: 0 }, life: 2.5, size: 0.3, color: '#fff6c8', color2: '#9fd8ff', count: 1 }),
    spark: (p) => sparks.emit({ pos: { x: p.x, y: p.y + 1, z: p.z }, velJitter: { x: 3, y: 3, z: 3 }, life: 0.4, size: 0.35, color: '#fff7a0', color2: '#7fd0ff', count: 14 }),
    splash: (p) => dust.emit({ pos: { x: p.x, y: 0.2, z: p.z }, vel: { x: 0, y: 3.5, z: 0 }, velJitter: { x: 1.5, y: 1.2, z: 1.5 }, life: 0.8, size: 0.35, color: '#ffffff', color2: '#9fd8ff', count: 14 }),
    heart: (p) => sparks.emit({ pos: { x: p.x, y: p.y + 2, z: p.z }, vel: { x: 0, y: 0.8, z: 0 }, velJitter: { x: 0.4, y: 0.2, z: 0.4 }, life: 1.2, size: 0.5, color: '#ff7ab8', color2: '#ffd1e6', count: 4 }),
  },
};
const director = new LifeDirector(world, activities(spots));
const cats: { agent?: Agent; cat: PaperCat; def: (typeof CAST)[number] | typeof LUZTERNA | typeof REGISTRO }[] = [];

let astraprima: PaperCat | null = null;
let luzterna: PaperCat | null = null;
let registro: PaperCat | null = null;
let registroSeen = false;

/** max living cats by tier (each one is a deforming mesh + an AI agent) */
const MAX_CATS: Record<Tier, number> = { bajo: 8, medio: 12, alto: 16, ultra: 24 };
let island: BridgeIsland | null = null;

/**
 * Who lives here: YOUR cats (read-only bridge to the real save) or the demo cast.
 * ?save=<fixture> (dev only) reads game/test-saves/<fixture>.json; ?demo=1 forces the demo cast.
 */
async function chooseCast(): Promise<CastDef[]> {
  const q = new URLSearchParams(location.search);
  if (q.get('demo') === '1') return CAST;
  let env: unknown = null;
  let source: BridgeIsland['source'] = 'partida';
  const fixture = q.get('save');
  if (fixture && import.meta.env.DEV && /^[\w-]+$/.test(fixture)) {
    source = 'fixture';
    env = await fetch(`/test-saves/${fixture}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  } else env = readSaveReadOnly(localStorage);
  if (!env) return CAST;
  const content = (await import('../data/content.json')).default as unknown as { cats: { id: string; name: string; art: { slug: string }; elements: string[]; rarity: string; primordial?: boolean; role?: string }[] };
  const species = new Map<string, SpeciesInfo>(content.cats.map((c) => [c.id, { id: c.id, name: c.name, slug: c.art.slug, elements: c.elements, rarity: c.rarity, primordial: c.primordial, role: c.role }]));
  island = parseIsland(env, species, source);
  if (!island || !island.cats.length) return CAST;
  const lite = (slug: string) => CAST[0].url.replace(CAST[0].slug, slug);
  const mine = pickCast(island, MAX_CATS[settings.tier], lite);
  const crew = CAST.find((c) => c.id === 'astraprima')!;
  return [...mine, crew];
}

/** where a cat of the player's collection lives: by its first element (deterministic per uid) */
function homeFor(d: CastDef): THREE.Vector3 {
  if (spots.home[d.id]) return spots.home[d.id];
  let n = 0;
  for (let i = 0; i < d.id.length; i++) n = (n * 31 + d.id.charCodeAt(i)) >>> 0;
  const jitter = (k: number) => (((n >>> k) % 1000) / 1000 - 0.5) * 5;
  const el = d.tags[0];
  let base: THREE.Vector3;
  if (d.tags.includes('canelo')) base = spots.home.canelo;
  else if (d.tags.includes('lava')) base = fire.spot;
  else if (el === 'fire') base = spots.home.chispa;
  else if (el === 'ice') base = ice.spot;
  else if (el === 'cosmic' || el === 'void') base = cosmic.spot;
  else if (el === 'water') base = spots.home.gelatino;
  else {
    const a = ((n % 360) / 360) * Math.PI * 2;
    base = new THREE.Vector3(Math.cos(a) * 14, 0, Math.sin(a) * 14);
  }
  const p = base.clone().add(new THREE.Vector3(jitter(3), 0, jitter(13)));
  if (!walkable(p.x, p.z)) p.copy(base);
  p.y = heightAt(p.x, p.z);
  spots.home[d.id] = p;
  return p;
}

async function loadCats() {
  const roster = await chooseCast();
  if (island) {
    $('islandInfo').textContent = `Tu isla${island.source === 'fixture' ? ' (partida de prueba)' : ''}: Reino ${island.kl} · ${island.catCount} gatos · viven aquí ${roster.length - 1}. Solo lectura: nada se guarda.`;
  }
  const total = roster.length + 2;
  let done = 0;
  const tick = () => ($('loadbar').style.width = `${(++done / total) * 100}%`);
  const make = async (def: { slug: string; url: string; height: number; acts?: 'all' | 'calm' | 'battle' | 'none' }) => {
    const art = await loadPaperArt(def.url, 512);
    tick();
    return new PaperCat({ slug: def.slug, url: def.url, height: def.height, acts: def.acts }, art);
  };
  // decode the paintings in parallel (they are independent)
  const made = await Promise.all(roster.map((d) => make(d).then((cat) => ({ d, cat }))));
  for (const { d, cat } of made) {
    cat.shadowAllowed = Q().catShadows;
    cat.shadow.visible = Q().catShadows;
    scene.add(cat.root);
    if (d.id === 'astraprima') {
      astraprima = cat;
      cats.push({ cat, def: d });
      continue;
    }
    const home = homeFor(d);
    const start = home.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3));
    start.y = heightAt(start.x, start.z);
    const agent = director.add({
      id: d.id,
      name: d.name,
      cat,
      pos: start,
      needs: { energy: d.tags.includes('canelo') ? 0.35 : 0.5 + Math.random() * 0.4, play: Math.random() * 0.6, social: Math.random() * 0.5 },
      traits: d.traits,
      tags: new Set(d.tags),
    });
    cats.push({ agent, cat, def: d });
  }
  luzterna = await make(LUZTERNA);
  luzterna.shadowAllowed = false;
  luzterna.shadow.visible = false;
  scene.add(luzterna.root);
  cats.push({ cat: luzterna, def: LUZTERNA });
  registro = await make(REGISTRO);
  registro.ghost = 1;
  registro.shadowAllowed = false;
  registro.shadow.visible = false;
  registro.root.position.set(SEA_STACK.x, SEA_STACK.top, SEA_STACK.z);
  registro.ground = SEA_STACK.top;
  scene.add(registro.root);
  cats.push({ cat: registro, def: REGISTRO });
}

// ───────────────────────────── ship ─────────────────────────────
type ShipMode = 'moored' | 'sailing' | 'toArena' | 'arena' | 'home';
let shipMode: ShipMode = 'moored';
const shipPos = new THREE.Vector3(POI.shipMoor.x, 0, POI.shipMoor.z);
let shipYaw = -0.4;
let shipSpeed = 0;
let shipAngle = Math.atan2(POI.shipMoor.z, POI.shipMoor.x);
const SAIL_R = 60;
const arenaStop = new THREE.Vector3(POI.arena.x - 18, 0, POI.arena.z - 20);

function steerShipTo(goal: THREE.Vector3, dt: number, maxSpeed: number) {
  const dx = goal.x - shipPos.x;
  const dz = goal.z - shipPos.z;
  const d = Math.hypot(dx, dz);
  const want = Math.atan2(dx, dz);
  let dy = want - shipYaw;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  shipYaw += dy * (1 - Math.exp(-dt * 1.2));
  const target = d < 3 ? 0 : Math.min(maxSpeed, d * 0.6);
  shipSpeed += (target - shipSpeed) * (1 - Math.exp(-dt * 0.8));
  shipPos.x += Math.sin(shipYaw) * shipSpeed * dt;
  shipPos.z += Math.cos(shipYaw) * shipSpeed * dt;
  return d;
}

function updateShip(dt: number) {
  if (shipMode === 'sailing') {
    shipAngle += dt * 0.085;
    const goal = new THREE.Vector3(Math.cos(shipAngle) * SAIL_R, 0, Math.sin(shipAngle) * SAIL_R);
    steerShipTo(goal, dt, 7);
  } else if (shipMode === 'toArena') {
    if (steerShipTo(arenaStop, dt, 8) < 4) {
      shipMode = 'arena';
      collapse.start();
    }
  } else if (shipMode === 'arena') {
    // face the raft
    const want = Math.atan2(POI.arena.x - shipPos.x, POI.arena.z - shipPos.z) + Math.PI / 2;
    let dy = want - shipYaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    shipYaw += dy * (1 - Math.exp(-dt * 1.0));
    shipSpeed *= Math.exp(-dt);
    if (!collapse.running) shipMode = 'sailing';
  } else if (shipMode === 'home') {
    if (steerShipTo(new THREE.Vector3(POI.shipMoor.x, 0, POI.shipMoor.z), dt, 7) < 3) shipMode = 'moored';
  } else {
    shipSpeed *= Math.exp(-dt * 2);
  }
  const s = ocean.sample(shipPos.x, shipPos.z);
  boat.group.position.set(shipPos.x, s.y + 0.1, shipPos.z);
  boat.group.rotation.set(s.tiltZ * 0.6, shipYaw + Math.PI, -s.tiltX * 0.6 - shipSpeed * 0.01);
  boat.lantern.pos.copy(boat.group.localToWorld(new THREE.Vector3(0, 1.4, -3.2)));
  if (shipSpeed > 1.5 && Math.random() < dt * 30) {
    const stern = boat.group.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 2, 0, 3.4));
    dust.emit({ pos: { x: stern.x, y: 0.2, z: stern.z }, vel: { x: 0, y: 1.2, z: 0 }, velJitter: { x: 0.6, y: 0.4, z: 0.6 }, life: 0.9, size: 0.45, color: '#ffffff', color2: '#bfe4ff', count: 2 });
  }
  if (astraprima) {
    const deck = boat.group.localToWorld(new THREE.Vector3(0, 0.82, 0.6));
    astraprima.root.position.copy(deck);
    astraprima.ground = deck.y;
    astraprima.brain.walk = 0;
  }
}

// ───────────────────────────── ability ─────────────────────────────
const flashEl = $('flash');
let hitstop = 0;
const collapse = new StellarCollapse(scene, raft, sparks, dust, {
  flash(s) {
    const k = settings.reduced ? s * 0.3 : s;
    flashEl.style.transition = 'none';
    flashEl.style.opacity = String(k);
    requestAnimationFrame(() => {
      flashEl.style.transition = 'opacity .5s ease-out';
      flashEl.style.opacity = '0';
    });
  },
  shake: (a) => rig.shake(a),
  hitstop: (ms) => (hitstop = ms / 1000),
  damage: (p, text, big) => floatText(p, text, big),
  focus: (p, d, pitch) => {
    rig.follow = null;
    rig.focus(p, d, pitch);
  },
  caster: () => ({
    pos: astraprima ? astraprima.root.position.clone() : shipPos.clone(),
    emote: (k) => astraprima?.brain.emote(k),
    crouch: (v) => astraprima && (astraprima.brain.crouch = v),
  }),
  say: (t) => toast(t),
});
collapse.reducedMotion = settings.reduced;

// ───────────────────────────── UI ─────────────────────────────
let hour = 17;
let dayLen = 300; // seconds per 24 h
let timeRunning = true;
const hourEl = $<HTMLInputElement>('hour');
const clockEl = $('clock');
function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
hourEl.addEventListener('input', () => {
  hour = parseFloat(hourEl.value);
});
$('timeplay').addEventListener('click', () => {
  timeRunning = !timeRunning;
  $('timeplay').textContent = timeRunning ? '❚❚' : '▶';
});
$<HTMLSelectElement>('speed').addEventListener('change', (e) => (dayLen = parseFloat((e.target as HTMLSelectElement).value)));
document.querySelectorAll<HTMLButtonElement>('[data-sky]').forEach((b) =>
  b.addEventListener('click', () => {
    weather.set(b.dataset.sky as Sky);
    document.querySelectorAll('[data-sky]').forEach((x) => x.classList.toggle('on', x === b));
  }),
);
$('sail').addEventListener('click', () => {
  if (shipMode === 'moored' || shipMode === 'home') {
    shipMode = 'sailing';
    shipAngle = Math.atan2(shipPos.z, shipPos.x);
    $('sail').textContent = 'VOLVER AL MUELLE';
    rig.follow = () => boat.group.position.clone().add(new THREE.Vector3(0, 2, 0));
    rig.focus(boat.group.position, 26, 0.4);
    toast('¡ZARPAMOS! El mar de siempre… ¿por qué el horizonte se ve más alto?');
  } else {
    shipMode = 'home';
    $('sail').textContent = 'ZARPAR';
  }
});
$('ability').addEventListener('click', () => {
  if (collapse.running) return;
  if (shipMode === 'moored') toast('Astraprima sube al barco. El blanco de práctica está mar adentro.');
  shipMode = 'toArena';
  $('sail').textContent = 'VOLVER AL MUELLE';
  rig.follow = () => boat.group.position.clone().add(new THREE.Vector3(0, 2, 0));
  rig.focus(boat.group.position, 30, 0.45);
});
$('viewBtn').addEventListener('click', () => views.toggle());
$('home').addEventListener('click', () => {
  rig.follow = null;
  rig.focus(new THREE.Vector3(-2, 2, 4), 40, 0.5, 0.35);
});

const quality = $<HTMLSelectElement>('quality');
quality.value = settings.tier;
const auto = new AutoQuality(settings.tier, (t) => {
  settings.tier = t;
  quality.value = t;
  applyTier();
  toast(`Rendimiento: bajé la calidad a ${t.toUpperCase()} para mantener la fluidez.`);
});
auto.enabled = settings.auto;
quality.addEventListener('change', () => {
  settings.tier = quality.value as Tier;
  auto.tier = settings.tier;
  applyTier();
  saveSettings();
});
const autoEl = $<HTMLInputElement>('autoq');
autoEl.checked = settings.auto;
autoEl.addEventListener('change', () => {
  settings.auto = auto.enabled = autoEl.checked;
  saveSettings();
});
const redEl = $<HTMLInputElement>('reduced');
redEl.checked = settings.reduced;
redEl.addEventListener('change', () => {
  settings.reduced = redEl.checked;
  rig.reducedMotion = collapse.reducedMotion = weather.reducedFlashes = settings.reduced;
  saveSettings();
});
const fxEl = $<HTMLInputElement>('fxamt');
fxEl.value = String(settings.fx);
fxEl.addEventListener('input', () => {
  settings.fx = parseFloat(fxEl.value);
  applyBudget();
  saveSettings();
});
function applyTier() {
  resize();
  applyBudget();
  sun.shadow.mapSize.setScalar(Q().shadowMap);
  if (sun.castShadow !== Q().shadows) {
    sun.castShadow = Q().shadows; // light-state change: three recompiles the affected programs itself
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m) m.needsUpdate = true;
    });
  }
  sun.shadow.map?.dispose();
  sun.shadow.map = null as unknown as THREE.WebGLRenderTarget;
  renderer.shadowMap.needsUpdate = true; // recreate now: the throttled refresh must never sample an empty map
  for (const c of cats)
    if (c.def !== LUZTERNA && c.def !== REGISTRO) {
      c.cat.shadowAllowed = Q().catShadows;
      c.cat.flat = views.k;
    }
  $('tierNote').textContent = settings.tier !== BOOT_TIER ? 'detalle de agua/terreno se aplica al recargar' : '';
}
$('settingsBtn').addEventListener('click', () => $('settings').classList.toggle('open'));
addEventListener('keydown', (e) => {
  if (e.key === 'F3' || e.key === '`') {
    e.preventDefault();
    settings.hud = !settings.hud;
    $('hud').style.display = settings.hud ? '' : 'none';
    saveSettings();
  }
  if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('photo');
  if ((e.key === 'v' || e.key === 'V') && (e.target as HTMLElement)?.tagName !== 'INPUT') views.toggle();
});
$('hud').style.display = settings.hud ? '' : 'none';

function toast(text: string) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  $('toasts').prepend(el);
  setTimeout(() => el.classList.add('out'), 4200);
  setTimeout(() => el.remove(), 5000);
  while ($('toasts').children.length > 4) $('toasts').lastElementChild?.remove();
}

const floating: { el: HTMLElement; p: THREE.Vector3; t: number }[] = [];
function floatText(p: THREE.Vector3, text: string, big = false) {
  const el = document.createElement('div');
  el.className = 'dmg' + (big ? ' big' : '');
  el.textContent = text;
  document.body.appendChild(el);
  floating.push({ el, p: p.clone(), t: 0 });
}

// selection / info card
let selected: (typeof cats)[number] | null = null;
const tmpV = new THREE.Vector3();
rig.onClick = (x, y) => {
  let best: (typeof cats)[number] | null = null;
  let bd = 70;
  for (const c of cats) {
    if (!c.cat.root.visible) continue;
    tmpV.copy(c.cat.root.position);
    tmpV.y += c.cat.lift + c.cat.height * 0.5;
    tmpV.project(camera);
    if (tmpV.z > 1) continue;
    const sx = (tmpV.x * 0.5 + 0.5) * innerWidth;
    const sy = (-tmpV.y * 0.5 + 0.5) * innerHeight;
    const d = Math.hypot(sx - x, sy - y);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  if (best?.def === REGISTRO) return revealRegistro();
  selected = best;
  syncLensButtons();
  $('card').classList.toggle('open', !!best);
  if (best) {
    best.cat.brain.emote('surprise', 0.5);
    rig.follow = () => best!.cat.root.position.clone().add(new THREE.Vector3(0, best!.cat.lift + 1.2, 0));
    rig.focus(best.cat.root.position, 11, 0.32);
  }
};
document.querySelectorAll<HTMLButtonElement>('[data-lens]').forEach((b) =>
  b.addEventListener('click', () => {
    if (!selected) return;
    selected.cat.lens = Number(b.dataset.lens) as 0 | 1 | 2 | 3 | 4 | 5;
    syncLensButtons();
    if (selected.cat.lens) selected.cat.brain.emote('happy');
  }),
);
function syncLensButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-lens]').forEach((x) => x.classList.toggle('on', Number(x.dataset.lens) === (selected?.cat.lens ?? 0)));
}
$('cardClose').addEventListener('click', () => {
  selected = null;
  $('card').classList.remove('open');
  rig.follow = null;
});
function updateCard() {
  if (!selected) return;
  const d = selected.def;
  $('cardName').textContent = d.name;
  $('cardMeta').textContent = d.meta;
  $('cardDoing').textContent = selected.agent ? `${d.name} ${selected.agent.label}` : d.id === 'astraprima' ? 'vigila desde la cubierta' : d.id === 'luzterna' ? (world.night > 0.4 ? 'cuida la luz del faro' : 'duerme en el faro (de día no hay nada que alumbrar)') : '';
  const n = selected.agent?.needs;
  $('cardNeeds').innerHTML = n
    ? (['energy', 'play', 'social'] as const)
        .map((k) => `<div class="need"><span>${{ energy: 'energía', play: 'ganas de jugar', social: 'ganas de compañía' }[k]}</span><i style="width:${Math.round(n[k] * 100)}%"></i></div>`)
        .join('')
    : '';
}

function revealRegistro() {
  if (!registro || registroSeen) return;
  registroSeen = true;
  const start = performance.now();
  const glitch = () => {
    const k = (performance.now() - start) / 900;
    if (!registro) return;
    registro.root.visible = Math.random() > k;
    if (k < 1) requestAnimationFrame(glitch);
    else registro.root.visible = false;
  };
  glitch();
  $('registro').classList.add('open');
}
$('registroClose').addEventListener('click', () => $('registro').classList.remove('open'));

// ───────────────────────────── perf HUD ─────────────────────────────
const stats = new FrameStats(240);
let hudT = 0;
let autoT = 0;
let slowAtFloor = 0;
let frameN = 0;
const lastShadowAt = new THREE.Vector3();
function updateHud(dt: number) {
  hudT += dt;
  autoT += dt;
  if (autoT > 1) {
    autoT = 0;
    if (performance.now() - bootAt > 6000) {
      const p95 = stats.pct(95);
      auto.sample(p95);
      // last resort: a machine that can't hold 30 fps even on BAJO reads the island on the PAGE (light, Part I look)
      slowAtFloor = settings.auto && settings.tier === 'bajo' && views.mode === 'mundo' && p95 > 33.4 ? slowAtFloor + 1 : 0;
      if (slowAtFloor >= 5) {
        slowAtFloor = 0;
        views.set('pagina');
        toast('Tu compu sufre con el MUNDO. Te dejo la PÁGINA (la vista de siempre); puedes volver con la tecla V.');
      }
    }
  }
  if (hudT < 0.5 || !settings.hud) return;
  hudT = 0;
  const info = renderer.info;
  const heap = heapMB();
  $('hud').textContent = [
    `FPS ${stats.fps.toFixed(0)}  ·  cuadro p50 ${stats.pct(50).toFixed(1)} / p95 ${stats.pct(95).toFixed(1)} / p99 ${stats.pct(99).toFixed(1)} ms  ·  largos ${stats.long}`,
    `draw ${info.render.calls}  ·  tris ${(info.render.triangles / 1000).toFixed(0)}k  ·  geo ${info.memory.geometries}  ·  tex ${info.memory.textures}${heap ? `  ·  heap ${heap.toFixed(0)} MB` : ''}`,
    `calidad ${settings.tier.toUpperCase()}${settings.auto ? ' (auto)' : ''}  ·  dpr ${renderer.getPixelRatio().toFixed(2)}  ·  ${renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1'}  ·  gatos ${cats.length}`,
  ].join('\n');
}

// ───────────────────────────── frame ─────────────────────────────
const allLights = (): LocalLight[] => [...props.flatMap((p) => p.lights), boat.lantern];
let last = performance.now();
let time = 0;
let bootAt = performance.now();
let ready = false;

function frame(now: number) {
  requestAnimationFrame(frame);
  const raw = Math.min(0.1, (now - last) / 1000);
  stats.push(now - last);
  last = now;
  let dt = raw;
  if (hitstop > 0) {
    hitstop -= raw;
    dt = 0;
  }
  time += dt;

  // time of day + weather
  if (timeRunning) hour = (hour + (dt * 24) / dayLen) % 24;
  if (document.activeElement !== hourEl) hourEl.value = hour.toFixed(2);
  clockEl.textContent = fmtHour(hour);
  weather.update(dt, camera.position, cycle.s.night);
  cycle.overcast = Math.min(1, weather.rain * 0.55 + weather.storm * 0.45);
  const s = cycle.evaluate(hour);
  // PAGE lens: the page is always read in plain daylight (like Part I)
  const vw = views.update(raw, settings.reduced);
  const lens = vw.lens;
  if (lens > 0) {
    for (const key of ['zenith', 'horizon', 'sun', 'hemiSky', 'hemiGround', 'fog', 'deep', 'shallow', 'grade'] as const) s[key].lerp(NOON[key], lens);
    s.sunI += (NOON.sunI - s.sunI) * lens;
    s.hemiI += (NOON.hemiI - s.hemiI) * lens;
    s.night *= 1 - lens;
    s.sunDir.lerp(NOON.sunDir, lens).normalize();
  }
  const tS = terrain.mesh.scale.y;
  for (const [o, y] of propRestY) o.position.y = y * tS;
  terrain.page = lens;
  if (lens > 0.5) weather.mesh.visible = false;
  ocean.uniforms.uPage.value = lens;
  ocean.mesh.position.y = -0.35 * lens;
  sky.mesh.visible = lens < 0.999;
  scene.background = lens > 0.999 ? PAPER : null;
  camera.fov = 42 + (16 - 42) * lens;
  camera.updateProjectionMatrix();
  updateNotes(lens);
  updateCrease();
  sky.apply(s, time, cycle.overcast);
  if (weather.flash > 0) sky.u.uHorizon.value.lerp(new THREE.Color('#e8f0ff'), weather.flash * 0.7);
  hemi.color.copy(s.hemiSky);
  hemi.groundColor.copy(s.hemiGround);
  hemi.intensity = s.hemiI + weather.flash * 2.5;
  const useMoon = s.night > 0.55;
  const dir = useMoon ? s.moonDir : s.sunDir;
  sun.color.copy(useMoon ? new THREE.Color('#9fb4ff') : s.sun);
  sun.intensity = useMoon ? 0.55 * (1 - cycle.overcast * 0.7) : s.sunI;
  sun.target.position.set(rig.cur.target.x, 0, rig.cur.target.z);
  sun.position.copy(sun.target.position).addScaledVector(dir, 120);
  (scene.fog as THREE.Fog).color.copy(s.fog);
  (scene.fog as THREE.Fog).far = (300 - cycle.overcast * 130) + lens * 2000;
  const ou = ocean.uniforms;
  ou.uDeep.value.copy(s.deep);
  ou.uShallow.value.copy(s.shallow);
  ou.uSky.value.copy(s.horizon);
  ou.uSunDir.value.copy(s.sunDir);
  ou.uSunCol.value.copy(s.sun).multiplyScalar(Math.min(1.2, s.sunI));
  ou.uMoonDir.value.copy(s.moonDir);
  ou.uNight.value = s.night;
  ou.uRain.value = weather.rain;
  ocean.amp = (1 + weather.storm * 1.2) * (1 - lens);
  ocean.update(dt);
  terrain.wetness = weather.rain;
  wind.value = 0.35 + weather.rain * 0.4 + weather.storm * 0.9;
  wind.time.value = time;
  boat.sails.uniforms.uTime.value = time;
  boat.sails.uniforms.uWind.value = 0.4 + weather.storm * 0.6 + shipSpeed * 0.05;
  boat.sails.uniforms.uGrade.value.copy(s.grade);
  boat.lantern.intensity = s.night * 0.9;

  // paper-cat lighting
  const L = paperLighting;
  L.sunDir.copy(s.sunDir);
  L.sunCol.copy(s.sun);
  L.sunI = s.sunI * (1 - cycle.overcast * 0.6);
  L.moonDir.copy(s.moonDir);
  L.hemiSky.copy(s.hemiSky).multiplyScalar(s.hemiI + weather.flash * 1.5);
  L.hemiGround.copy(s.hemiGround).multiplyScalar(s.hemiI);
  L.grade.copy(s.grade).lerp(new THREE.Color('#ffffff'), weather.flash * 0.8);
  L.night = s.night;
  L.wet = weather.rain;
  L.lights = allLights();

  for (const p of props) p.update(dt, time, s.night);

  if (ready) {
    world.time = time;
    world.hour = hour;
    world.night = s.night;
    world.rain = weather.rain;
    world.storm = weather.storm;
    director.update(dt);
    for (const a of director.agents) {
      if (a.swimming) {
        const w = ocean.sample(a.pos.x, a.pos.z, heightAt(a.pos.x, a.pos.z));
        a.cat.lift = w.y - a.cat.height * 0.42;
        a.cat.ground = 0.05;
      }
    }
    updateShip(dt);
    if (luzterna) {
      luzterna.root.position.copy(lh.gallery);
      luzterna.ground = lh.gallery.y;
      luzterna.root.visible = s.night > 0.25 || hour > 17.5 || hour < 7;
      luzterna.brain.sleeping = s.night < 0.3;
    }
    if (registro && !registroSeen) {
      // REGISTRO 000 only exists in the WORLD: the page has no entry for it
      const show = s.night > 0.7 && weather.rain < 0.4 && lens < 0.05;
      const dCam = camera.position.distanceTo(registro.root.position);
      // it is never there when you walk up to it
      registro.root.visible = show && dCam > 22;
      registro.brain.look = Math.sign(camera.position.x - registro.root.position.x);
    }
    for (const c of cats) {
      if (lens > 0 && c.def !== REGISTRO && c.def !== LUZTERNA && c.def.id !== 'astraprima') {
        c.cat.root.position.y *= tS;
        c.cat.ground *= tS;
      }
      c.cat.flat = lens;
      // on the page cats read like Part I stickers: bigger than life
      c.cat.root.scale.setScalar(1 + lens * 0.9);
      c.cat.update(dt, camera, time);
    }
    if (luzterna) {
      luzterna.root.position.y = lh.gallery.y * tS;
      luzterna.root.scale.y = Math.max(0.02, lh.group.scale.y);
    }
  }
  raft.float(ocean);
  collapse.update(dt, time, camera);
  for (const p of pools) p.update(dt, renderer.domElement.height);
  rig.update(raw, groundOrSea);

  // floating damage numbers
  for (let i = floating.length - 1; i >= 0; i--) {
    const f = floating[i];
    f.t += raw;
    f.p.y += raw * 1.2;
    tmpV.copy(f.p).project(camera);
    f.el.style.transform = `translate(${(tmpV.x * 0.5 + 0.5) * innerWidth}px, ${(-tmpV.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-50%) scale(${1 + Math.max(0, 0.25 - f.t) * 2})`;
    f.el.style.opacity = String(Math.min(1, 2.6 - f.t));
    if (f.t > 2.6) {
      f.el.remove();
      floating.splice(i, 1);
    }
  }
  updateCard();
  const every = Q().shadowEvery;
  // throttled shadow map; forced when the shadow frustum (follows the camera target) moved noticeably
  const moved = sun.position.distanceToSquared(lastShadowAt) > 0.25;
  if (every > 0 && sun.castShadow && (frameN++ % every === 0 || moved)) {
    renderer.shadowMap.needsUpdate = true;
    lastShadowAt.copy(sun.position);
  }
  renderer.render(scene, camera);
  updateHud(raw);
}

weather.onBolt = () => {
  rig.shake(0.15);
  for (const a of director.agents) if (!a.tags.has('storm')) a.cat.brain.emote('surprise', 0.7);
};

// boot
(async () => {
  requestAnimationFrame(frame);
  try {
    await loadCats();
  } catch (e) {
    console.error(e);
    toast('No pude cargar el arte de algún gato. Revisa la consola.');
  }
  // warm up every program the ability and the page lens use (first cast/switch must not hitch)
  collapse.group.visible = true;
  renderer.compile(scene, camera);
  collapse.group.visible = false;
  ready = true;
  bootAt = performance.now();
  stats.reset();
  $('loading').classList.add('done');
  const qs = new URLSearchParams(location.search);
  let seen = false;
  try {
    seen = localStorage.getItem(INTRO_KEY) === '1';
  } catch {
    /* private mode: just show it */
  }
  if (qs.get('intro') === '1' || (!seen && qs.get('intro') !== '0')) startIntro();
  else setTimeout(() => toast('Canelo te ignora. Como siempre. Todo está bien.'), 1200);
  setTimeout(() => toast('Hace frío para ser octubre… y el mar refleja una isla que no está.'), 9000);
})();

// dev handle for headless verification
(window as unknown as Record<string, unknown>).__rupturas = {
  setHour: (h: number) => (hour = h),
  setSky: (s: Sky) => weather.set(s),
  cast: () => director.agents.map((a) => ({ id: a.id, act: a.activity?.id, label: a.label, x: +a.pos.x.toFixed(1), z: +a.pos.z.toFixed(1), swim: a.swimming })),
  stats: () => ({ fps: stats.fps, p50: stats.pct(50), p95: stats.pct(95), p99: stats.pct(99), long: stats.long, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, tier: settings.tier }),
  ability: () => $('ability').click(),
  focus: (id: string) => {
    const c = cats.find((x) => x.def.id === id);
    if (c) {
      rig.follow = null;
      rig.focus(c.cat.root.position, 11, 0.3);
      rig.cut();
    }
  },
  view: (x: number, z: number, dist: number, pitch: number, yaw: number) => {
    rig.follow = null;
    rig.focus(new THREE.Vector3(x, heightAt(x, z) + 1, z), dist, pitch, yaw);
    rig.cut();
  },
  ready: () => ready,
  scene,
  setView: (m: 'mundo' | 'pagina') => views.set(m),
  crease: () => crease.click(),
  lens: (id: string, l: 0 | 1 | 2 | 3 | 4 | 5) => {
    const c = cats.find((x) => x.def.id === id);
    if (c) c.cat.lens = l;
  },
  /** screen px of a cat (for click tests) */
  screenOf: (id: string) => {
    const c = cats.find((x) => x.def.id === id);
    if (!c) return null;
    const v = c.cat.root.position.clone();
    v.y += c.cat.lift + c.cat.height * 0.5;
    v.project(camera);
    return [Math.round((v.x * 0.5 + 0.5) * innerWidth), Math.round((-v.y * 0.5 + 0.5) * innerHeight)];
  },
};
