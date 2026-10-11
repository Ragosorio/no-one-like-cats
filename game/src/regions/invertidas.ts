/**
 * ISLAS INVERTIDAS (Parte II · Oleada 2 «El Cielo Despierta», capa celeste) — docs/part-ii/05 §4.
 *
 * An archipelago where gravity can't make up its mind: the main island floats over a sea of clouds
 * (the Primer Mar shows far below through the gaps), its river runs to the edge and then falls UP in a
 * column that climbs out of sight, islets hang upside down with their forests pointing at the clouds,
 * columns hang from floating lintels, roots and vines dangle under everything. Lens (art bible §7):
 * the light table turned over — violet and teal, the brightest light comes from BELOW (the cloud sea),
 * the sky above reads deep like water.
 *
 * Activities (POIs, docs/part-ii/14):
 *  - battle marker over the arena of hanging columns (RegionScene's generic marker, `battleSpot`)
 *  - «Piedras de gravedad»: three rune stones, each tied to an upside-down islet; tap one and its islet
 *    flips right side up. All three at once → flag `invertidas_voltear_ok` (first time: a little gold)
 *    and the counter `feature_voltear_islotes` (every time). They tire and flip back after a while.
 *  - «Pesca hacia arriba»: fish leap OUT of the up-fall and fall upward back into it; tap one mid-air
 *    → counter `feature_pesca_arriba` (first fish ever: flag `invertidas_pez` + a little gold)
 *  - Lunita clings under the third islet until you flip it
 *  - REGISTRO 000 at night on a far islet's tip; never there when the camera gets close
 *
 * Content lives in ./invertidas/ (layout, props, residents) and the shared sky kit ./cielo/.
 */
import * as THREE from 'three';
import type { POI, RegionDef } from './types';
import type { SkyKey } from '../engine/world/sky';
import type { LocalLight } from '../engine/world/paperCat';
import { paperLighting } from '../engine/world/paperCat';
import { ParticlePool } from '../engine/fx/particles';
import { G } from '../state/game';
import { sfx } from '../core/audio';
import { audioApi } from '../audio/api';
import { Bin } from './paginas/kit';
import { Halos, Mesher, devParams, skyToon } from './cielo/kit';
import { cluster, type Puff } from './cielo/clouds';
import { arcStream, type Stream } from './cielo/wind';
import { skyLayer, noSwimming } from './cielo/layer';
import { WATER_INV, fallSheet, flowStrip, pond } from './cielo/water';
import { AIRSHIP_PATCH, aerialShip, airship } from './cielo/craft';
import { ARENA, ARRIVAL, CUT, HALF, MOUTH, PERCH, POND, RIVER, RIVER_W, SEA_Y, SHIP, STONES, height, onPath, paint, walkable } from './invertidas/layout';
import type { Placement } from '../engine/world/flora';
import { farIsles, gravityStone, isle, islandStatic, type Isle } from './invertidas/props';
import { residents } from './invertidas/residents';
import { blueprint, umbrella, waterspout } from './cielo/tromba';
import { addSkyCat } from './cielo/cats';
import type { PaperCat } from '../engine/world/paperCat';
import { runningCine } from '../cine/registry';

/** violet/teal days, magenta dusks, deep violet nights; the ground light (cloud bounce) beats the sky */
const SKY: SkyKey[] = [
  { h: 0, zenith: '#0c0a2c', horizon: '#3a2468', sun: '#9a9cff', sunI: 0, hemiSky: '#3a3c88', hemiGround: '#6a4aa8', hemiI: 0.66, fog: '#2c1f5a', deep: '#141a52', shallow: '#2e3f88', grade: '#a69ce8', night: 1 },
  { h: 4.8, zenith: '#120d36', horizon: '#4c2c7c', sun: '#9a9cff', sunI: 0, hemiSky: '#3e3e8c', hemiGround: '#7050ac', hemiI: 0.64, fog: '#3a2770', deep: '#16205a', shallow: '#33498e', grade: '#ac9eea', night: 1 },
  { h: 6.0, zenith: '#4e58bc', horizon: '#ffb4cc', sun: '#ffb490', sunI: 1.2, hemiSky: '#b4b6ec', hemiGround: '#f0a8cc', hemiI: 0.88, fog: '#e6aed0', deep: '#2a4a8c', shallow: '#5ab4c8', grade: '#ffd8e8', night: 0.25 },
  { h: 8.0, zenith: '#5272dc', horizon: '#b4ecea', sun: '#fff0e2', sunI: 2.2, hemiSky: '#a6d6f2', hemiGround: '#dcc0f6', hemiI: 0.92, fog: '#bfe6ee', deep: '#2a5c9c', shallow: '#5cc8d0', grade: '#f8f4ff', night: 0 },
  { h: 12.5, zenith: '#4c6ee6', horizon: '#bcf0ec', sun: '#ffffff', sunI: 2.45, hemiSky: '#b0e0f6', hemiGround: '#e2c8fa', hemiI: 0.96, fog: '#c2e8f0', deep: '#2560a4', shallow: '#56d0d4', grade: '#ffffff', night: 0 },
  { h: 16.5, zenith: '#5a64d6', horizon: '#ffdcec', sun: '#ffe2cc', sunI: 2.2, hemiSky: '#c4cdf4', hemiGround: '#f0c4e4', hemiI: 0.9, fog: '#f2d8ea', deep: '#28528e', shallow: '#4cb8c8', grade: '#fff0f6', night: 0 },
  { h: 18.3, zenith: '#3c38a6', horizon: '#ff8cba', sun: '#ff9c8c', sunI: 1.4, hemiSky: '#c0a4ec', hemiGround: '#e090c4', hemiI: 0.94, fog: '#e690bc', deep: '#2a3a7c', shallow: '#4a8ab4', grade: '#ffc8de', night: 0.15 },
  { h: 19.6, zenith: '#1f165e', horizon: '#7e3aa0', sun: '#c88ae4', sunI: 0.35, hemiSky: '#6e5cbc', hemiGround: '#9a5cc0', hemiI: 0.74, fog: '#4c2c84', deep: '#1a2464', shallow: '#2e5494', grade: '#b6a2ea', night: 0.7 },
  { h: 21, zenith: '#0d0a2e', horizon: '#33215e', sun: '#9a9cff', sunI: 0, hemiSky: '#3a3c88', hemiGround: '#6a4aa8', hemiI: 0.66, fog: '#2a1d56', deep: '#141a52', shallow: '#2e3f88', grade: '#a69ce8', night: 1 },
  { h: 24, zenith: '#0c0a2c', horizon: '#3a2468', sun: '#9a9cff', sunI: 0, hemiSky: '#3a3c88', hemiGround: '#6a4aa8', hemiI: 0.66, fog: '#2c1f5a', deep: '#141a52', shallow: '#2e3f88', grade: '#a69ce8', night: 1 },
];

const dev = devParams();
const ease = (k: number) => k * k * (3 - 2 * k);

export const region: RegionDef = {
  id: 'invertidas',
  name: 'Islas Invertidas',
  subtitle: 'Aquí el agua no cae: se le ocurre otra cosa.',
  half: HALF,
  height,
  paint,
  walkable,
  skyKeys: SKY,
  rupture: 0.8,
  fog: { near: 110, far: 460 },
  hour: dev.hour,
  weather: dev.weather,
  camera: { target: [0, 3, -3], yaw: -0.2, pitch: 0.34, dist: 74, minDist: 8, maxDist: 135, bound: 64 },
  arrival: ARRIVAL,
  battleSpot: [ARENA.x, height(ARENA.x, ARENA.z) + 9.4, ARENA.z],
  async build(ctx) {
    const w = ctx.world;
    const rng = ctx.rng;
    const bin = new Bin();
    const uNight = { value: 0 };
    const uTime = { value: 0 };
    const root = new THREE.Group();
    root.name = 'invertidas';
    noSwimming(w);

    // ── the sky layer: cloud sea, puffs, wind ──
    const puffs: Puff[] = [];
    // a broken collar of cumulus around the island's underside
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + rng() * 0.3;
      const r = 20 + rng() * 9;
      cluster(puffs, rng, Math.cos(a) * r, -9 - rng() * 12, Math.sin(a) * r, 5.5 + rng() * 3, 5, 0.72);
    }
    for (let i = 0; i < 16; i++) {
      const a = rng() * Math.PI * 2;
      const r = 110 + rng() * 220;
      cluster(puffs, rng, Math.cos(a) * r, SEA_Y + 4, Math.sin(a) * r, 18 + rng() * 26, 6, 0.8);
    }
    for (let i = 0; i < 34; i++) {
      const a = rng() * Math.PI * 2;
      const r = 40 + rng() * 120;
      cluster(puffs, rng, Math.cos(a) * r, SEA_Y + 2 + rng() * 3, Math.sin(a) * r, 7 + rng() * 8, 3, 0.5);
    }
    const streams: Stream[] = [];
    for (let i = 0; i < 4; i++) streams.push(arcStream(0, 0, 41 + i * 4, 5 + i * 3, i * 1.6, i * 1.6 + 2.2, rng, 0.32, 0.8 + rng() * 0.6));
    for (let i = 0; i < 3; i++) streams.push(arcStream(0, 0, 75 + i * 12, -4 + i * 9, 2 + i * 2.1, 2 + i * 2.1 + 1.6, rng, 0.5, 0.7));
    // a current that climbs with the up-fall
    const dir = new THREE.Vector2(MOUTH.x, MOUTH.z).normalize();
    const fx = (k: number) => RIVER[RIVER.length - 1][0] + dir.x * k;
    const fz = (k: number) => RIVER[RIVER.length - 1][1] + dir.y * k;
    streams.push({ pts: [0, 1, 2, 3, 4, 5].map((i) => new THREE.Vector3(fx(8 + Math.sin(i) * 3), 4 + i * 11, fz(8 + Math.cos(i) * 3))), w: 0.3, speed: 1.6 });
    const sky = skyLayer(w, bin, {
      cut: CUT,
      seaY: SEA_Y,
      depth: 520,
      gap: 0.47,
      drift: [1.4, 0.5],
      palette: { lit: '#fff2fb', shade: '#8d7ed8', litNight: '#8a7ed0', shadeNight: '#2c2466', rim: '#ffd6f0' },
      puffs,
      streams,
      windColor: '#e8fffb',
    });
    root.add(sky.group);

    // ── the island ──
    const isl = islandStatic(bin, uNight, rng);
    root.add(isl.mesh);
    for (const s of STONES) w.obstacles.push({ x: s.x, z: s.z, r: 1.6 });
    w.obstacles.push({ x: ARENA.x, z: ARENA.z, r: 1.4 });

    // water: the pond, the river, and the up-fall at the north-east lip
    const riverY = (t: number) => 2.08 - t * 0.42;
    root.add(pond(bin, POND.x, 2.1, POND.z, POND.r * 0.86, WATER_INV, uTime, uNight));
    root.add(flowStrip(bin, RIVER, riverY, RIVER_W * 0.62, WATER_INV, uTime, uNight, 2.6));
    const lip = new THREE.Vector3(RIVER[RIVER.length - 1][0], riverY(1), RIVER[RIVER.length - 1][1]);
    const out = new THREE.Vector3(dir.x, 0, dir.y);
    const side = new THREE.Vector3(-dir.y, 0, dir.x);
    const P = (k: number, y: number, drift = 0) => lip.clone().addScaledVector(out, k).add(new THREE.Vector3(drift, y, drift * 0.3));
    const fall = fallSheet(bin, [P(0, 0), P(2.4, 0.25), P(4.1, 2.0), P(5.0, 7), P(5.4, 18, 1.4), P(5.9, 34, 3.4), P(6.6, 58, 6.5), P(7.2, 84, 10)], side, (t) => 2.3 + 0.9 * Math.sin(Math.min(1, t * 1.4) * Math.PI) - t * 0.8, WATER_INV, uTime, uNight, { speed: 7, up: true });
    root.add(fall.mesh);

    // ── the archipelago ──
    const flips = STONES.map((s, i) => {
      const it = isle(bin, uNight, rng, { x: s.islet[0], y: s.islet[1], z: s.islet[2], r: s.r, seed: s.seed, inverted: true, trees: 4 + i, hanging: 1 });
      root.add(it.group);
      return { isle: it, state: 'inv' as 'inv' | 'flip' | 'up' | 'back', t: 0, k: 0, upFor: 0 };
    });
    const isles: Isle[] = [];
    const deco: { x: number; y: number; z: number; r: number; inverted?: boolean; fall?: boolean }[] = [
      { x: -40, y: 18, z: 30, r: 4.2, fall: true },
      { x: 30, y: 22, z: -52, r: 5.6, inverted: true },
      { x: 62, y: 10, z: -18, r: 6.5, fall: true },
      { x: -70, y: 3, z: -22, r: 7.5, inverted: true },
      { x: 52, y: 26, z: 44, r: 4.8, inverted: true },
      { x: -18, y: 30, z: -72, r: 5.2, fall: true },
      { x: 18, y: -6, z: 62, r: 6.2 },
      { x: -56, y: -10, z: 52, r: 7 },
      { x: PERCH.x, y: PERCH.y, z: PERCH.z, r: PERCH.r, inverted: true },
    ];
    const smallFalls: { mesh: THREE.Mesh; it: Isle; top: THREE.Vector3 }[] = [];
    deco.forEach((d, i) => {
      const it = isle(bin, uNight, rng, { ...d, seed: 40 + i * 9, trees: d.inverted ? 2 : undefined, hanging: d.inverted ? Math.round(d.r / 1.6) : undefined });
      isles.push(it);
      root.add(it.group);
      if (d.fall) {
        // a thread of water leaves its rim and climbs (local space: it bobs with the islet)
        const a = rng() * 6.28;
        const o2 = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        const p0 = o2.clone().multiplyScalar(d.r * 0.92).setY(0.2);
        const sf = fallSheet(bin, [p0, p0.clone().addScaledVector(o2, 1.4).setY(0.6), p0.clone().addScaledVector(o2, 2.2).setY(4), p0.clone().addScaledVector(o2, 2.6).setY(14), p0.clone().addScaledVector(o2, 3.2).setY(30)], new THREE.Vector3(-o2.z, 0, o2.x), (t) => 0.75 - t * 0.35, WATER_INV, uTime, uNight, { speed: 5, up: true });
        it.group.add(sf.mesh);
        smallFalls.push({ mesh: sf.mesh, it, top: p0 });
      }
    });
    root.add(
      farIsles(bin, uNight, rng, [
        { x: -170, y: 30, z: -150, r: 26 },
        { x: 150, y: 46, z: -190, r: 22, inverted: true },
        { x: 230, y: 12, z: 40, r: 30 },
        { x: -240, y: 52, z: 70, r: 24, inverted: true },
        { x: 40, y: 62, z: -260, r: 18 },
      ]),
    );

    // grass tufts and pastel flowers on the meadows (the engine's swaying flora)
    const grass: Placement[] = [];
    const flowers: Placement[] = [];
    for (let i = 0; i < 2400 && (grass.length < 320 || flowers.length < 140); i++) {
      const x = (rng() - 0.5) * 64;
      const z = (rng() - 0.5) * 64;
      if (!walkable(x, z) || onPath(x, z) || Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r + 1) continue;
      const h = height(x, z);
      if (rng() < 0.7 && grass.length < 320) grass.push({ x, y: h - 0.05, z, s: 0.7 + rng() * 0.6, r: rng() * 6.28 });
      else if (flowers.length < 140) flowers.push({ x, y: h - 0.02, z, s: 0.9 + rng() * 0.6, r: rng() * 6.28 });
    }
    w.setFlora({ grass, flowers });

    // ── gravity stones ──
    const sg = gravityStone(bin, uNight, rng);
    const stones = STONES.map((s) => {
      const mesh = new THREE.Mesh(sg.geo, sg.mat);
      const y = height(s.x, s.z) + 2.9;
      mesh.position.set(s.x, y, s.z);
      mesh.castShadow = true;
      root.add(mesh);
      return { mesh, pos: new THREE.Vector3(s.x, y, s.z), flare: 0 };
    });

    // ── your ship (with the flight kit) and a patchwork airship far out ──
    const boat = aerialShip(bin, uNight);
    boat.group.position.set(SHIP.x, SHIP.y, SHIP.z);
    boat.group.rotation.y = SHIP.ry;
    boat.group.scale.setScalar(1.2);
    root.add(boat.group);
    const far = airship(bin, uNight, AIRSHIP_PATCH, 1.3);
    root.add(far.group);

    // ── the story's props (docs/part-ii/22 «Pasada de cine»): until your ship has the Kit de Vuelo, it's held up by
    // the waterspout that brought it (H42); the mechanic and her blueprint wait on deck while H43 asks for the kit ──
    const hasKit = () => {
      const fk = (G.s?.ext as { flightKit?: { ships?: unknown[] } } | undefined)?.flightKit;
      return (Array.isArray(fk?.ships) && fk!.ships!.length > 0) || ctx.missionDone('H43');
    };
    const spout = waterspout(bin, new THREE.Vector3(SHIP.x, SEA_Y + 2, SHIP.z), new THREE.Vector3(SHIP.x, SHIP.y - 0.9, SHIP.z), 2.3);
    root.add(spout.group);
    let spoutDrive: number | null = null;
    let wobble = 0;
    let wobbleDrive: number | null = null;
    const bp = blueprint(bin);
    bp.position.set(0.34, 3.3, -0.3);
    bp.rotation.y = Math.PI / 2;
    bp.visible = false;
    boat.group.add(bp);
    let bpShown = false;
    const umb = umbrella(bin);
    umb.group.visible = false;
    root.add(umb.group);
    const deckAt = () => boat.group.localToWorld(new THREE.Vector3(0, 1.05, 1.5));
    let helice: PaperCat | null = null;
    let heliceLoading = false;
    let descent: { t: number; dur: number } | null = null;
    const heliceHere = () => ctx.activeStory() === 'H43';
    const ensureHelice = () => {
      if (helice || heliceLoading) return;
      heliceLoading = true;
      void addSkyCat(ctx, { id: 'inv_helice', species: 'r_helice', home: deckAt(), acts: 'none', alive: false, here: 'Bajó por la tromba con una llave inglesa y un plano azul. Dice que tu barco es feísimo. Lo dice con cariño.' }).then((c) => {
        helice = c;
        if (c) {
          c.shadowAllowed = false;
          c.shadow.visible = false;
          c.root.visible = heliceHere() || !!descent;
        }
      });
    };
    if (heliceHere()) ensureHelice();

    // ── particles: water that rises, petals that fall up ──
    const drops = new ParticlePool(700, { gravity: -7, wobble: 0.25, shape: 'streak' });
    const petals = new ParticlePool(260, { additive: false, gravity: -0.5, wobble: 0.9, shape: 'flake' });
    root.add(drops.points, petals.points);

    const halos = new Halos(bin, 48);
    root.add(halos.mesh);

    // ── fish that fall up (pesca hacia arriba) ──
    const fishGeo = (() => {
      const M = new Mesher(true);
      const body = new THREE.IcosahedronGeometry(0.55, 0);
      body.scale(1.5, 0.75, 0.45);
      M.add(body, (v, o) => o.set(v.y > 0.05 ? '#ff8fb8' : '#ffe0ec'));
      const tail = new THREE.ConeGeometry(0.42, 0.7, 3);
      tail.rotateZ(Math.PI / 2);
      M.add(tail, '#7fe2d2', new THREE.Matrix4().makeTranslation(-1.05, 0, 0));
      return bin.add(M.build());
    })();
    const fishMat = skyToon(bin, { uNight, key: 'inv' });
    type Fish = { mesh: THREE.Mesh; t: number; dur: number; from: THREE.Vector3; to: THREE.Vector3; peak: number; state: 'wait' | 'jump' | 'caught'; wait: number };
    const fallPt = (k: number) => fall.curve.getPointAt(k);
    const fishes: Fish[] = Array.from({ length: 3 }, (_, i) => {
      const mesh = new THREE.Mesh(fishGeo, fishMat);
      mesh.visible = false;
      root.add(mesh);
      return { mesh, t: 0, dur: 2.2, from: new THREE.Vector3(), to: new THREE.Vector3(), peak: 0, state: 'wait' as const, wait: 1 + i * 2.2 };
    });

    // ── residents ──
    const res = await residents(ctx, new THREE.Vector3(PERCH.x + 0.4, PERCH.y + PERCH.r * 1.62, PERCH.z + 0.3));
    const ROPE_N = 12;
    const rope = new THREE.Line(bin.add(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(ROPE_N * 3), 3))), bin.add(new THREE.LineBasicMaterial({ color: '#e0cc9e' })));
    rope.frustumCulled = false;
    root.add(rope);

    // ── lights for the cats ──
    const pierLight: LocalLight = { pos: isl.lamp, color: new THREE.Color('#ffd9a0'), range: 9, intensity: 0 };
    const fallLight: LocalLight = { pos: lip.clone().add(new THREE.Vector3(0, 2, 0)), color: new THREE.Color('#8ff0e8'), range: 12, intensity: 0 };
    const arenaLight: LocalLight = { pos: new THREE.Vector3(ARENA.x, isl.arenaY + 1.5, ARENA.z), color: new THREE.Color('#7ff7e6'), range: 9, intensity: 0 };
    const stoneLights: LocalLight[] = stones.map((s) => ({ pos: s.pos, color: new THREE.Color('#7ff7e6'), range: 6, intensity: 0 }));

    // ── activities ──
    let busy = false;
    let alive = true;
    const flipsUp = () => flips.every((f) => f.state === 'up');
    const complete = async () => {
      ctx.feature('voltear_islotes');
      audioApi.stinger('discovery_fa'); // F minor: Hemkade's key (recipe fallback: discovery)
      const first = !ctx.has('invertidas_voltear_ok');
      ctx.flag('invertidas_voltear_ok');
      if (first) {
        const gold = Math.round(Math.max(150, G.goldPerSec * 60));
        G.add('gold', gold, 'invertidas');
        ctx.floatText(new THREE.Vector3(0, 8, 0), `+${gold.toLocaleString('es-MX')} oro`);
      }
      await ctx.say(
        first
          ? [
              ['LUZTERNA', '¡Listo, Capi! Los tres islotes al derecho. Ordenaste el cielo. Bueno, un pedacito.'],
              ['LUZTERNA', 'No te encariñes: la gravedad de aquí es como Canelo. Hace caso un ratito y luego hace lo que quiere.'],
            ]
          : [['LUZTERNA', 'Otra vez al derecho. Ellos otra vez se van a voltear. Esto es un trabajo, Capi, no un logro.']],
      );
    };
    const tapStone = async (i: number) => {
      const f = flips[i];
      if (busy || f.state !== 'inv') return;
      f.state = 'flip';
      f.t = 0;
      stones[i].flare = 1;
      sfx('charge');
      audioApi.stinger('unlock', { gain: 0.6 });
      w.pools.sparks.emit({ pos: stones[i].pos, velJitter: { x: 3, y: 3, z: 3 }, life: 0.8, size: 0.4, color: '#c8fff6', color2: '#a080ff', count: 26 });
      w.rig.follow = null;
      const ip = f.isle.base;
      const sp = stones[i].pos;
      w.rig.focus(new THREE.Vector3((ip.x + sp.x) / 2, (ip.y + sp.y) / 2 + 2, (ip.z + sp.z) / 2), 40, 0.3);
    };
    const onFlipDone = async (i: number) => {
      if (!alive) return;
      sfx('bigboom');
      w.rig.shake(0.25);
      const it = flips[i].isle;
      w.pools.dust.emit({ pos: it.group.position, spread: { x: it.r, y: 0.5, z: it.r }, vel: { x: 0, y: 2, z: 0 }, velJitter: { x: 2, y: 1, z: 2 }, life: 1.2, size: 0.6, color: '#f6e8ff', color2: '#b9a6ec', count: 30 });
      if (i === 2 && res.contrapeso) {
        res.contrapeso.brain.emote('surprise', 1.2);
        ctx.floatText(it.group.position.clone().add(new THREE.Vector3(0, 3.5, 0)), '¡Ese no era el lado correcto!');
      }
      if (flipsUp()) {
        busy = true;
        await complete();
        busy = false;
        for (const f of flips) f.upFor = 0;
      }
    };

    const fishTap = async (f: Fish) => {
      if (busy || f.state !== 'jump') return;
      f.state = 'caught';
      f.t = 0;
      sfx('coin');
      w.pools.sparks.emit({ pos: f.mesh.position, velJitter: { x: 2.5, y: 2.5, z: 2.5 }, life: 0.7, size: 0.35, color: '#ffe0ec', color2: '#7fe2d2', count: 18 });
      ctx.feature('pesca_arriba');
      const first = !ctx.has('invertidas_pez');
      const n = (G.s.counters.feature_pesca_arriba ?? 0) as number;
      if (first) {
        ctx.flag('invertidas_pez');
        const gold = Math.round(Math.max(120, G.goldPerSec * 45));
        G.add('gold', gold, 'invertidas');
        ctx.floatText(f.mesh.position.clone(), `+${gold.toLocaleString('es-MX')} oro`);
        busy = true;
        await ctx.say([
          ['CAPTION', 'Pescaste un pez hacia arriba. Te mira ofendido: él iba subiendo.'],
          ['LUZTERNA', 'Suéltalo, Capi. Aquí arriba los peces vuelan y los gatos no. No hagamos más enemigos.'],
        ]);
        busy = false;
      } else ctx.floatText(f.mesh.position.clone(), FISH_LINES[n % FISH_LINES.length]);
    };

    // taps on things that are not residents
    const prevClick = w.rig.onClick;
    const near = (p: THREE.Vector3, x: number, y: number, r: number) => {
      const s = w.project(p);
      return !!s && Math.hypot(s.x - x, s.y - y) < r;
    };
    w.rig.onClick = (x, y) => {
      if (busy) return;
      for (let i = 0; i < stones.length; i++) if (flips[i].state === 'inv' && near(stones[i].pos, x, y, 70)) return void tapStone(i);
      for (const f of fishes) if (f.state === 'jump' && near(f.mesh.position, x, y, 80)) return void fishTap(f);
      prevClick?.(x, y);
    };

    // ── every frame ──
    let dropT = 0;
    let petalT = 0;
    let mistT = 0;
    const tmp = new THREE.Vector3();
    const seat = new THREE.Vector3(0.6, 0.12, 0.9);
    const sails = boat.sails.uniforms;
    w.addProp({
      group: root,
      lights: [pierLight, fallLight, arenaLight, boat.lantern, ...stoneLights],
      update(dt, t, night) {
        uTime.value = t;
        uNight.value = night;
        sky.update(t);
        const budget = w.pools.motes.budget;
        drops.budget = petals.budget = budget;
        const vh = w.renderer.domElement.height;
        drops.update(dt, vh);
        petals.update(dt, vh);
        halos.begin();
        // islets bob and turn slowly
        for (const it of isles) {
          it.group.position.y = it.base.y + Math.sin(t * 0.35 + it.ph) * it.bob;
          it.group.rotation.y += it.spin * dt;
        }
        // the flipping islets
        flips.forEach((f, i) => {
          const it = f.isle;
          let lift = 0;
          if (f.state === 'flip' || f.state === 'back') {
            f.t += dt;
            const dur = f.state === 'flip' ? 2.4 : 3.2;
            const k = Math.min(1, f.t / dur);
            // anticipation wobble, then the turn
            const turn = ease(Math.max(0, (k - 0.15) / 0.85));
            f.k = f.state === 'flip' ? turn : 1 - turn;
            lift = Math.sin(turn * Math.PI) * 2.6;
            it.group.rotation.z = k < 0.15 ? Math.sin(k * 90) * 0.06 : 0;
            if (k >= 1) {
              const was = f.state;
              f.state = was === 'flip' ? 'up' : 'inv';
              f.t = 0;
              f.upFor = 0;
              if (was === 'flip') void onFlipDone(i);
            }
          } else if (f.state === 'up') {
            f.upFor += dt;
            // they tire: back upside down after a while (not while the camera is right on them)
            if (f.upFor > 55 + i * 6 && !busy && w.camera.position.distanceTo(it.group.position) > 25) {
              f.state = 'back';
              f.t = 0;
            }
          }
          it.group.position.y = it.base.y + Math.sin(t * 0.4 + it.ph) * it.bob + lift;
          it.group.rotation.x = Math.PI * (1 - f.k);
          // the stone: spins, bobs, flares when used
          const st = stones[i];
          st.mesh.rotation.y = t * (0.4 + i * 0.07) + st.flare * 6;
          st.mesh.position.y = st.pos.y + Math.sin(t * 1.1 + i) * 0.22;
          st.flare = Math.max(0, st.flare - dt * 0.6);
          halos.add(st.mesh.position, 3.4 + st.flare * 6, '#7ff7e6', 0.08 + night * 0.35 + st.flare * 0.9);
          stoneLights[i].intensity = 0.15 + night * 0.7 + st.flare * 1.2;
          if (f.state === 'flip' && Math.random() < dt * 30) {
            tmp.copy(st.mesh.position).lerp(it.group.position, Math.random());
            w.pools.motes.emit({ pos: tmp, spread: { x: 0.6, y: 0.6, z: 0.6 }, vel: { x: 0, y: 0.6, z: 0 }, life: 1.4, size: 0.35, color: '#c8fff6', color2: '#a080ff', count: 1 });
          }
        });
        // Contrapeso rides the third islet (upside down until it flips)
        const L3 = flips[2];
        const cp = res.contrapeso;
        if (cp) {
          const g = L3.isle.group;
          g.updateMatrixWorld();
          cp.root.position.copy(g.localToWorld(tmp.copy(seat)));
          cp.root.rotation.z = Math.PI * (1 - L3.k);
          cp.ground = cp.root.position.y;
          cp.shadow.visible = false;
          cp.brain.sleeping = L3.state === 'inv' && night > 0.5;
        }
        res.update(dt, t, night);
        // Globito's rope: from his rock up to his paws, sagging a little
        if (res.globito) {
          const top = res.globito.root.position.clone();
          top.y += res.globito.lift + 0.25;
          const rp = rope.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < ROPE_N; i++) {
            const k = i / (ROPE_N - 1);
            tmp.lerpVectors(res.anchor, top, k);
            tmp.x += Math.sin(k * Math.PI) * 0.35;
            rp.setXYZ(i, tmp.x, tmp.y, tmp.z);
          }
          rp.needsUpdate = true;
        }
        if (res.registro) res.registro.shadow.visible = false;
        // the up-fall: spray climbing, mist at the top, a glow at night
        dropT -= dt;
        if (dropT <= 0) {
          dropT = 0.03;
          const k = 0.05 + Math.random() * 0.4;
          const p = fallPt(k);
          drops.emit({ pos: p, spread: { x: 1.2, y: 0.5, z: 1.2 }, vel: { x: out.x * 0.6, y: 3.5, z: out.z * 0.6 }, velJitter: { x: 1.2, y: 1.5, z: 1.2 }, life: 2.2, size: 0.42, color: '#e8fffd', color2: '#8ff0e8', count: 2 });
        }
        mistT -= dt;
        if (mistT <= 0) {
          mistT = 0.25;
          w.pools.smoke.emit({ pos: fallPt(0.55 + Math.random() * 0.2), spread: { x: 2, y: 2, z: 2 }, vel: { x: 0.6, y: 1.2, z: 0.2 }, velJitter: { x: 0.4, y: 0.4, z: 0.4 }, life: 4, size: 3.5, color: '#f4fffd', color2: '#cfeff2', count: 1 });
          w.pools.smoke.emit({ pos: lip, spread: { x: 0.8, y: 0.2, z: 0.8 }, vel: { x: out.x, y: 0.8, z: out.z }, life: 1.6, size: 1.4, color: '#ffffff', color2: '#cfeff2', count: 1 });
          for (const sf of smallFalls) if (Math.random() < 0.3) drops.emit({ pos: sf.it.group.localToWorld(tmp.copy(sf.top)), spread: { x: 0.4, y: 0.4, z: 0.4 }, vel: { x: 0, y: 2.5, z: 0 }, velJitter: { x: 0.5, y: 0.6, z: 0.5 }, life: 2, size: 0.3, color: '#e8fffd', color2: '#8ff0e8', count: 1 });
        }
        fallLight.intensity = 0.2 + night * 0.8;
        halos.add(lip.clone().add(new THREE.Vector3(0, 1.4, 0)), 9, '#8ff0e8', 0.04 + night * 0.3);
        // petals from the hanging trees drift UP past the island
        petalT -= dt;
        if (petalT <= 0) {
          petalT = 0.09;
          const a = Math.random() * 6.28;
          const r = 10 + Math.random() * 28;
          petals.emit({ pos: { x: Math.cos(a) * r, y: CUT - 6 - Math.random() * 10, z: Math.sin(a) * r }, vel: { x: 0.8, y: 0.6, z: 0.3 }, velJitter: { x: 0.4, y: 0.3, z: 0.4 }, life: 9, size: 0.34, color: Math.random() < 0.5 ? '#ff9cc8' : '#c6a8ff', color2: '#ffe0ef', count: 1 });
          if (night > 0.4 && Math.random() < 0.5) w.pools.motes.emit({ pos: { x: Math.cos(a) * r * 0.8, y: 3 + Math.random() * 2, z: Math.sin(a) * r * 0.8 }, vel: { x: 0, y: 0.5, z: 0 }, life: 4, size: 0.24, color: '#7ff7e6', color2: '#c8a8ff', count: 1 });
        }
        // fish leap out of the column and fall back UP into it
        for (const f of fishes) {
          if (f.state === 'wait') {
            f.wait -= dt;
            if (f.wait <= 0) {
              const k0 = 0.08 + Math.random() * 0.12;
              f.from.copy(fallPt(k0));
              f.to.copy(fallPt(k0 + 0.06 + Math.random() * 0.05));
              f.peak = 4 + Math.random() * 2.5;
              f.dur = 2.2 + Math.random() * 0.8;
              f.t = 0;
              f.state = 'jump';
              f.mesh.visible = true;
            }
          } else if (f.state === 'jump') {
            f.t += dt;
            const k = f.t / f.dur;
            // out and away from the water, then «down» is up: it arcs back into the column higher
            tmp.lerpVectors(f.from, f.to, k).addScaledVector(out, Math.sin(k * Math.PI) * f.peak);
            const prev = f.mesh.position.clone();
            f.mesh.position.copy(tmp);
            f.mesh.lookAt(tmp.clone().add(tmp.clone().sub(prev).normalize()));
            f.mesh.rotateY(Math.PI / 2);
            f.mesh.rotation.z += Math.sin(t * 14) * 0.15;
            halos.add(f.mesh.position, 2.2, '#ffd0e4', 0.12 + night * 0.25);
            if (k >= 1) {
              f.state = 'wait';
              f.wait = 1.5 + Math.random() * 4;
              f.mesh.visible = false;
              drops.emit({ pos: f.to, velJitter: { x: 1.5, y: 1.5, z: 1.5 }, life: 0.7, size: 0.35, color: '#ffffff', color2: '#8ff0e8', count: 8 });
            }
          } else {
            f.t += dt;
            const k = Math.min(1, f.t / 0.8);
            f.mesh.position.y += dt * 4;
            f.mesh.rotation.y += dt * 12;
            f.mesh.scale.setScalar(Math.max(0.01, 1 - k));
            if (k >= 1) {
              f.mesh.scale.setScalar(1);
              f.mesh.visible = false;
              f.state = 'wait';
              f.wait = 3 + Math.random() * 3;
            }
          }
        }
        // the story's props: the kit (or the waterspout holding the ship up), the mechanic, her blueprint
        const kitNow = hasKit();
        for (const o of boat.kitParts) o.visible = kitNow;
        if (!runningCine()) {
          spoutDrive = null;
          wobbleDrive = null;
        }
        const wantSpout = spoutDrive ?? (kitNow ? 0 : 1);
        spout.set(spoutDrive !== null ? wantSpout : spout.k + (wantSpout - spout.k) * Math.min(1, dt * 0.8));
        if (spout.group.visible) spout.update(t, dt);
        wobble += ((wobbleDrive ?? (kitNow ? 0 : 0.35)) - wobble) * Math.min(1, dt * 2);
        bp.visible = bpShown || heliceHere();
        if (heliceHere() || descent) ensureHelice();
        if (helice) {
          const deck = deckAt();
          if (descent) {
            descent.t += dt;
            const k = Math.min(1, descent.t / descent.dur);
            const e = 1 - (1 - k) * (1 - k);
            helice.root.visible = true;
            helice.root.position.set(deck.x + Math.sin(t * 1.3) * 0.6 * (1 - k), deck.y + 28 * (1 - e), deck.z);
            umb.group.visible = k < 0.98;
            umb.group.position.set(helice.root.position.x, helice.root.position.y + 3.4, helice.root.position.z);
            umb.group.scale.setScalar(k < 0.85 ? 1 : Math.max(0.05, 1 - (k - 0.85) / 0.13));
            umb.blades.rotation.y = t * 14;
            if (k >= 1) descent = null;
          } else {
            helice.root.visible = heliceHere();
            helice.root.position.copy(deck);
            umb.group.visible = false;
          }
          helice.ground = deck.y;
        }
        // the ship floats at its mooring (it wobbles while only the waterspout holds it); the far airship makes its round
        const wob = 1 + wobble * 4;
        boat.group.position.y = SHIP.y + Math.sin(t * 0.8) * 0.35 * (1 + wobble);
        boat.group.rotation.z = Math.sin(t * 0.6 * (1 + wobble)) * 0.035 * wob;
        boat.group.rotation.x = Math.sin(t * 0.5 + 1) * 0.02 * wob;
        boat.update(t);
        sails.uTime.value = t;
        (sails.uGrade.value as THREE.Color).copy(paperLighting.grade);
        boat.lantern.pos.set(SHIP.x, boat.group.position.y + 1.8, SHIP.z - 3.6);
        boat.lantern.intensity = 0.2 + night * 0.9;
        const fa = t * 0.018 + 1.2;
        far.group.position.set(Math.cos(fa) * 125, 26 + Math.sin(t * 0.2) * 2, Math.sin(fa) * 125);
        far.group.rotation.y = -fa;
        far.prop.rotation.z = t * 8;
        pierLight.intensity = 0.1 + night * 1.0;
        arenaLight.intensity = 0.1 + night * 0.6;
        halos.add(isl.lamp, 3, '#ffd9a0', 0.05 + night * 0.6);
        halos.add(arenaLight.pos, 7, '#7ff7e6', night * 0.25);
        halos.end();
      },
    });

    // ── points of interest ──
    // one marker at a time: the closest stone still waiting (three yellow pills at once is a menu, not a sky)
    const nextStone = () => {
      let best = -1;
      let bd = Infinity;
      stones.forEach((s, i) => {
        const d = s.pos.distanceTo(w.camera.position);
        if (flips[i].state === 'inv' && d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    };
    const pois: POI[] = stones.map((s, i) => ({
      id: `piedra_${i}`,
      pos: s.pos.clone().add(new THREE.Vector3(0, 2.6, 0)),
      label: 'PIEDRA DE GRAVEDAD',
      kind: 'activity' as const,
      visible: () => !busy && nextStone() === i,
      onTap: () => tapStone(i),
    }));
    pois.push({
      id: 'cascada',
      pos: lip.clone().add(new THREE.Vector3(0, 6, 0)),
      label: 'PESCA HACIA ARRIBA',
      kind: 'lore',
      visible: () => !busy && !ctx.has('invertidas_pez'),
      onTap: async () => {
        w.rig.follow = null;
        w.rig.focus(fallPt(0.12), 26, 0.22);
        await ctx.say([
          ['CAPTION', 'La Cascada al Revés. El río llega a la orilla, lo piensa tantito… y se va para arriba.'],
          ['LUZTERNA', 'Y los peces saltan para AFUERA y caen para ARRIBA. Tócalos en el aire, Capi: pesca hacia arriba. Yo no pregunto, yo narro.'],
        ]);
      },
    });

    audioApi.ambience('wind', { fade: 2 });
    audioApi.setState('explore', { fade: 2, context: 'invertidas' });
    if (!ctx.has('invertidas_voltear_ok')) ctx.toast('PIEDRAS DE GRAVEDAD', 'Toca las piedras con runas: cada una voltea un islote. Los tres al derecho… y a ver qué pasa.');

    // dev hooks (headless shots, perf, the activities)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__invertidas = {
        ready: true,
        world: w,
        setHour(h: number) {
          region.hour = Math.max(0.01, h);
          w.hour = region.hour;
        },
        flip: (i: number) => tapStone(i),
        flipAll: () => flips.forEach((_, i) => void tapStone(i)),
        fish: () => fishes.map((f) => ({ state: f.state, pos: f.mesh.position.toArray() })),
        tapFish: () => {
          const f = fishes.find((x) => x.state === 'jump');
          return f ? fishTap(f) : null;
        },
        registro: () => ({ visible: res.registro?.root.visible, pos: res.registro?.root.position.toArray() }),
        flips: () => flips.map((f) => f.state),
        info: () => ({ calls: w.renderer.info.render.calls, tris: w.renderer.info.render.triangles, fps: Math.round(w.stats.fps), p95: w.stats.pct(95), tier: w.tier, geos: w.renderer.info.memory.geometries, tex: w.renderer.info.memory.textures }),
        cam(target: [number, number, number], dist: number, pitch: number, yaw: number) {
          w.rig.follow = null;
          w.rig.focus(new THREE.Vector3(...target), dist, pitch, yaw);
          w.rig.cut();
        },
      };
    }
    // what this island lends a CINE scene (ui/story/o2Cines.ts: h42_arriba, h43_helice)
    const shipPt = new THREE.Vector3(SHIP.x, SHIP.y + 1.6, SHIP.z);
    const cine = {
      points: {
        below: new THREE.Vector3(SHIP.x, SEA_Y + 10, SHIP.z),
        rise: new THREE.Vector3(SHIP.x, SHIP.y - 8, SHIP.z),
        vista: new THREE.Vector3(MOUTH.x * 0.45, 16, MOUTH.z * 0.45),
        ship: shipPt,
        deck: deckAt().add(new THREE.Vector3(0, 1.4, 0)),
        mast: boat.group.localToWorld(new THREE.Vector3(0.4, 3.3, -0.3)),
        arrival: new THREE.Vector3(...ARRIVAL),
        center: new THREE.Vector3(0, 3, 0),
      } as Record<string, THREE.Vector3>,
      fx(cmd: { id: string; [k: string]: unknown }) {
        switch (cmd.id) {
          case 'helice':
            ensureHelice();
            if (cmd.do === 'land') descent = null;
            else descent = { t: 0, dur: 4.6 };
            return null;
          case 'blueprint':
            bpShown = true;
            if (!cmd.instant) {
              bp.scale.setScalar(0.05);
              const t0 = performance.now();
              const grow = () => {
                if (!alive) return;
                const k = Math.min(1, (performance.now() - t0) / 450);
                bp.scale.setScalar(Math.max(0.05, 1 - (1 - k) * (1 - k)));
                if (k < 1) requestAnimationFrame(grow);
              };
              requestAnimationFrame(grow);
            } else bp.scale.setScalar(1);
            return null;
        }
        return undefined;
      },
      drive(id: string, k: number) {
        if (id === 'tromba') {
          spoutDrive = k;
          spout.set(k);
        } else if (id === 'wobble') wobbleDrive = k;
      },
      driveGet(id: string) {
        return id === 'tromba' ? spout.k : id === 'wobble' ? wobble : undefined;
      },
    };
    return {
      pois,
      cine,
      dispose() {
        alive = false;
        busy = false;
        audioApi.ambience('none', { fade: 1.5 });
        drops.dispose();
        petals.dispose();
        bin.dispose();
        if (import.meta.env.DEV) delete (window as unknown as Record<string, unknown>).__invertidas;
      },
    };
  },
};

const FISH_LINES = ['¡Otro pez hacia arriba!', 'Este pez opina que tú estás de cabeza.', '¡Pez volador! (Lo soltaste. Bien.)', 'Glub. (Hacia arriba.)', 'Pescado. Sorprendido. Soltado.'];
