/**
 * ISLA NÁCAR — Oleada 1's crystal island (battles ruptura_nacar · Prismarina, ruptura_madrenacar · Madre
 * Nácar), docs/part-ii/05 §4.
 *
 * A mountain crowned by giant crystals, pearl beaches with giant mother-of-pearl shells, pearl tide
 * pools, and at the mountain's foot the «corazón de cristal»: a crystal door that beats like a heart.
 * Its lens (art bible §7): refraction, caustics and soft bloom — crystals that refract their insides,
 * caustic light under the beam, prism rainbows that turn with the sun, glowing halos; prismatic days,
 * violet nights where every crystal breathes a faint light.
 *
 * Activity «Guiar el haz» (beam.ts) is the gate of the story battle: the prism's beam has to reach the
 * door through three mirrors. Solved once, open forever (flag `nacar_haz_ok`).
 *
 * Content lives in ./nacar/: layout (terrain, positions), materials (shaders), props, beam, residents.
 */
import * as THREE from 'three';
import type { RegionDef } from './types';
import type { SkyKey } from '../engine/world/sky';
import type { Placement } from '../engine/world/flora';
import type { LocalLight } from '../engine/world/paperCat';
import { paperLighting } from '../engine/world/paperCat';
import { G } from '../state/game';
import { MISSION_BY_ID } from '../data/content';
import { sfx } from '../core/audio';
import { ship } from '../rupturas/props';
import { ARRIVAL, CLUSTERS, DOOR, GEODE, HALF, MOUNT, POOLS, PRISM, SHIP, SHELLS, SOLUTION, START, TERRACE, coastR, height, paint, walkable } from './nacar/layout';
import { MAX_FAN, MAX_SEG, makeLit, syncLit } from './nacar/materials';
import { Halos, crystalMeshesFor, groundLight, nacrePath, portal, rocks, shellsAndPearls, tidePools } from './nacar/props';
import { beamPuzzle } from './nacar/beam';
import { residents } from './nacar/residents';

/** clear prismatic days (pearl-pink dawns, cobalt noons, rose dusks) and violet nights (never black) */
const NACAR_SKY: SkyKey[] = [
  { h: 0, zenith: '#120b38', horizon: '#3b2a72', sun: '#9aa0ff', sunI: 0, hemiSky: '#5b4bb0', hemiGround: '#1d1838', hemiI: 0.62, fog: '#2b2160', deep: '#0f1a4e', shallow: '#2a5f94', grade: '#9c90e6', night: 1 },
  { h: 4.8, zenith: '#1a1244', horizon: '#5a3c88', sun: '#9aa0ff', sunI: 0, hemiSky: '#6150b0', hemiGround: '#211a3c', hemiI: 0.6, fog: '#3d2c70', deep: '#132258', shallow: '#2f6a96', grade: '#a294e6', night: 1 },
  { h: 6.0, zenith: '#6a74d6', horizon: '#ffc4dc', sun: '#ffcabb', sunI: 1.2, hemiSky: '#bcb2f2', hemiGround: '#6a5072', hemiI: 0.72, fog: '#f2c8e0', deep: '#2b5a9c', shallow: '#6fe0c8', grade: '#ffe0ee', night: 0.25 },
  { h: 8.0, zenith: '#5aa2f2', horizon: '#dcf2ff', sun: '#fff4ee', sunI: 2.3, hemiSky: '#d6eaff', hemiGround: '#8a7a9e', hemiI: 0.86, fog: '#e0f0fb', deep: '#1a6aa6', shallow: '#6fe0c8', grade: '#fff8ff', night: 0 },
  { h: 12.5, zenith: '#4b95f2', horizon: '#e6f6ff', sun: '#ffffff', sunI: 2.6, hemiSky: '#e0f0ff', hemiGround: '#9282aa', hemiI: 0.9, fog: '#e4f2fc', deep: '#1466a4', shallow: '#74e6d6', grade: '#ffffff', night: 0 },
  { h: 16.5, zenith: '#5a88e2', horizon: '#ffe4f0', sun: '#ffe2cc', sunI: 2.25, hemiSky: '#d8daf8', hemiGround: '#8a6c8e', hemiI: 0.86, fog: '#f6e2ee', deep: '#1a5a92', shallow: '#66d8c8', grade: '#fff2f6', night: 0 },
  { h: 18.3, zenith: '#4c4cb4', horizon: '#ff9cc4', sun: '#ffa2a8', sunI: 1.4, hemiSky: '#b29ce4', hemiGround: '#5c3c5e', hemiI: 0.76, fog: '#e89cc4', deep: '#2b3b80', shallow: '#4aa2c2', grade: '#ffcce0', night: 0.15 },
  { h: 19.6, zenith: '#24195e', horizon: '#8c4ca6', sun: '#c28ae4', sunI: 0.35, hemiSky: '#6c5cb4', hemiGround: '#2a1d42', hemiI: 0.62, fog: '#4c357c', deep: '#17215c', shallow: '#2e5c90', grade: '#b2a2ea', night: 0.7 },
  { h: 21, zenith: '#130c3a', horizon: '#2f2268', sun: '#9aa0ff', sunI: 0, hemiSky: '#5a4aae', hemiGround: '#1d1838', hemiI: 0.62, fog: '#2a2060', deep: '#0f1a4e', shallow: '#2a5f94', grade: '#9a8ee4', night: 1 },
  { h: 24, zenith: '#120b38', horizon: '#3b2a72', sun: '#9aa0ff', sunI: 0, hemiSky: '#5b4bb0', hemiGround: '#1d1838', hemiI: 0.62, fog: '#2b2160', deep: '#0f1a4e', shallow: '#2a5f94', grade: '#9c90e6', night: 1 },
];

// dev only: ?hour=23 fixes the hour, ?weather=despejado|lluvia|tormenta fixes the sky
const qs = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
const devHour = qs?.get('hour') ? Math.max(0.01, Number(qs.get('hour'))) : undefined;
const devWeather = (qs?.get('weather') ?? undefined) as RegionDef['weather'];

/** a story battle of this island is the active story mission's goal right now */
function battleHere() {
  for (const m of G.s.missions.active) {
    const b = (MISSION_BY_ID.get(m)?.goal as { battle?: string } | undefined)?.battle;
    if (b === 'ruptura_nacar' || b === 'ruptura_madrenacar') return b;
  }
  return null;
}

/** dev: slow the door's animation down to inspect it */
let animScale = 1;

const doorOpen = () => G.has('nacar_haz_ok') || G.has('won_ruptura_nacar') || G.has('won_ruptura_madrenacar');

export const region: RegionDef = {
  id: 'nacar',
  name: 'Isla Nácar',
  subtitle: 'Todo lo que refleja, lo recuerda.',
  half: HALF,
  height,
  paint,
  walkable,
  skyKeys: NACAR_SKY,
  rupture: 0.6,
  fog: { near: 90, far: 330 },
  hour: devHour,
  weather: devWeather,
  camera: { target: [6, 9, -2], yaw: 0.42, pitch: 0.42, dist: 70, minDist: 8, maxDist: 130, bound: 62 },
  arrival: ARRIVAL,
  battleSpot: [DOOR.x, TERRACE + 8.4, DOOR.z + 1.2],
  // the beam puzzle gates Prismarina's battle (she waits behind the crystal door)
  battleGate: (b) => b !== 'ruptura_nacar' || G.has('nacar_haz_ok'),
  async build(ctx) {
    const w = ctx.world;
    const rng = ctx.rng;
    const L = makeLit();
    const sky = { uZenith: w.sky.u.uZenith, uHorizon: w.sky.u.uHorizon };
    const open0 = doorOpen();
    const madreWon = G.has('won_ruptura_madrenacar');

    // ── the island ──
    const root = new THREE.Group();
    const crystal = crystalMeshesFor(L, rng);
    root.add(...crystal.meshes);
    root.add(...rocks(rng));
    const sp = shellsAndPearls(L, rng);
    root.add(sp.shells, sp.pearls);
    root.add(tidePools(L, sky));
    root.add(nacrePath(L));
    const ground = groundLight(L);
    root.add(ground.mesh);
    const por = portal(L, rng);
    root.add(por.group);
    const halos = new Halos(72);
    root.add(halos.mesh);
    if (open0) por.door.mesh.visible = false;
    por.tunnel.mat.uniforms.uInner.value = madreWon ? 0.25 : 1;

    // a few palms on the beach and pastel flowers in the meadow (the engine's flora)
    const palms: Placement[] = [];
    const flowers: Placement[] = [];
    const grass: Placement[] = [];
    for (let i = 0; i < 400 && (palms.length < 6 || flowers.length < 110 || grass.length < 160); i++) {
      const x = (rng() - 0.5) * 80;
      const z = (rng() - 0.5) * 80;
      const cr = coastR(x, z);
      const h = height(x, z);
      if (!walkable(x, z) || h < 0.6) continue;
      const nearBeam = Math.abs(z - 13) < 3 && x > -3 && x < 23;
      if (cr > 0.62 && cr < 0.8 && palms.length < 6 && !nearBeam && !SHELLS.some((s) => Math.hypot(x - s.x, z - s.z) < 4)) palms.push({ x, y: h, z, s: 0.7 + rng() * 0.25, r: rng() * 6.3 });
      else if (cr < 0.62 && h > 1.4 && flowers.length < 110) flowers.push({ x, y: h, z, s: 1.1 + rng() * 0.6, r: rng() * 6.3 });
      else if (cr < 0.66 && h > 1.4 && grass.length < 160) grass.push({ x, y: h, z, s: 0.9 + rng() * 0.5, r: rng() * 6.3 });
    }
    w.setFlora({ palms, flowers, grass });

    // your ship, moored off the south beach (Canelo & crew came ashore)
    const boat = ship();
    boat.group.position.set(SHIP.x, 0.1, SHIP.z);
    boat.group.rotation.y = SHIP.ry;
    boat.group.scale.setScalar(1.25);
    root.add(boat.group);
    boat.lantern.pos.set(SHIP.x, 2.2, SHIP.z);

    // ── the door opening (the payoff of «Guiar el haz») ──
    const anims: { t: number; dur: number; fn: (k: number) => void; done: () => void }[] = [];
    const anim = (dur: number, fn: (k: number) => void) => new Promise<void>((done) => anims.push({ t: 0, dur, fn, done }));
    let flash = 0;
    const doorC = new THREE.Vector3(DOOR.x, TERRACE + 3, DOOR.z + 0.3);
    const openDoor = async () => {
      const dm = por.door.mat.uniforms;
      // solved the moment the light gets in: persist it first (leaving mid-show must not undo it)
      ctx.flag('nacar_haz_ok');
      ctx.feature('haz_nacar');
      w.rig.focus(new THREE.Vector3(DOOR.x, TERRACE + 3.2, DOOR.z + 1), 30, 0.3, w.rig.goal.yaw);
      sfx('charge');
      await anim(1.7, (k) => {
        dm.uCharge.value = k * k;
        crystal.mat.uniforms.uCharge.value = k * k * 0.25;
      });
      sfx('bigboom');
      sfx('reveal');
      w.rig.shake(0.6);
      flash = 1;
      w.pools.sparks.emit({ pos: doorC, spread: { x: 2.2, y: 2.8, z: 0.3 }, vel: { x: 0, y: 2, z: 5 }, velJitter: { x: 6, y: 6, z: 5 }, life: 1.3, size: 0.55, color: '#ffffff', color2: '#b79cff', count: 180 });
      w.pools.stars.emit({ pos: doorC, spread: { x: 2, y: 3, z: 0.5 }, vel: { x: 0, y: 1, z: 3 }, velJitter: { x: 3, y: 3, z: 3 }, life: 2.4, size: 0.5, color: '#f7f2ff', color2: '#8fd3ff', count: 70 });
      await anim(1.9, (k) => {
        dm.uBreak.value = k;
        dm.uCharge.value = (1 - k) * (1 - k);
        crystal.mat.uniforms.uCharge.value = 0.25 * (1 - k);
      });
      por.door.mesh.visible = false;
      sfx('fanfare');
      const lines: [string, string][] = [
        ['LUZTERNA', '¡Eso, Capi! La luz entró hasta la cocina. Literal: tumbó la puerta.'],
        ['LUZTERNA', 'Cristal no pega: REDIRIGE. Tú tampoco pegas, pero redirigiste bonito.'],
      ];
      if (battleHere() === 'ruptura_nacar') lines.push(['PRISMARINA', '¿Quién rompió mi puerta? ¡Era de colección! Ven acá, que te voy a pulir.'], ['LUZTERNA', 'Ahí está tu pelea, Capi. Toca ¡A PELEAR! antes de que se vea en un espejo y se distraiga.']);
      else lines.push(['CAPTION', 'Al fondo de la cueva, algo enorme y nacarado se da la vuelta… y sigue roncando.']);
      await ctx.say(lines);
    };

    const puzzle = beamPuzzle(ctx, L, { solved: open0, sky, onReach: openDoor });
    root.add(puzzle.group);
    const res = await residents(ctx, { madreWon });

    // ── light, life and the lens, every frame ──
    const crown = new THREE.Vector3(MOUNT.x, height(MOUNT.x, MOUNT.z) + 8, MOUNT.z);
    const doorLight: LocalLight = { pos: new THREE.Vector3(DOOR.x, TERRACE + 2.5, DOOR.z + 1.5), color: new THREE.Color('#c8b4ff'), range: 9, intensity: 0.4 };
    const poolLight: LocalLight = { pos: new THREE.Vector3(POOLS[0].x + 2, 2.2, POOLS[0].z + 2), color: new THREE.Color('#8fe8ff'), range: 9, intensity: 0 };
    const prismLight: LocalLight = { pos: new THREE.Vector3(PRISM.x, height(PRISM.x, PRISM.z) + 2.5, PRISM.z), color: new THREE.Color('#fff2ff'), range: 8, intensity: 0.8 };
    const madreLight: LocalLight = { pos: new THREE.Vector3(DOOR.x, TERRACE + 2.2, DOOR.z - 2.5), color: new THREE.Color('#f2e6ff'), range: 6, intensity: madreWon ? 0 : 0.7 };
    const fans = [
      [PRISM.x, PRISM.z, 7.5, 0],
      [DOOR.x - 4.2, DOOR.z - 0.8, 5.5, 0.12],
      [DOOR.x + 4.3, DOOR.z - 0.9, 6.0, -0.1],
      [GEODE.x, GEODE.z, 4.8, 0.05],
      [CLUSTERS[0].x, CLUSTERS[0].z, 4.6, 0.08],
      [CLUSTERS[2].x, CLUSTERS[2].z, 4.2, -0.06],
    ];
    const tips: THREE.Vector3[] = crystal.tips;
    let glintT = 0;
    let moteT = 0;
    const sails = boat.sails.uniforms;
    w.addProp({
      group: root,
      lights: [doorLight, poolLight, prismLight, madreLight, boat.lantern, ...puzzle.lights],
      update(dt, t, night) {
        syncLit(L, t);
        halos.begin();
        for (let i = anims.length - 1; i >= 0; i--) {
          const a = anims[i];
          a.t = Math.min(a.dur, a.t + dt * animScale);
          a.fn(a.t / a.dur);
          if (a.t >= a.dur) {
            anims.splice(i, 1);
            a.done();
          }
        }
        puzzle.update(dt, t, night, halos);
        res.update(dt, t, night, puzzle.trace.pts);
        // ground light: the beam's caustic strip + the prism rainbows
        const gu = ground.mat.uniforms;
        const P = puzzle.trace.pts;
        const n = Math.min(MAX_SEG, P.length - 1);
        for (let i = 0; i < n; i++) (gu.uSeg.value[i] as THREE.Vector4).set(P[i].x, P[i].z, P[i + 1].x, P[i + 1].z);
        gu.uSegN.value = n;
        gu.uBeamCol.value.set(night > 0.55 ? '#d8ccff' : '#fff3ff');
        for (let i = 0; i < MAX_FAN; i++) (gu.uFan.value[i] as THREE.Vector4).set(fans[i][0], fans[i][1], fans[i][2], fans[i][3]);
        // the door's heartbeat (corazón de cristal): lub-dub every ~1.6 s
        const ph = (t % 1.6) / 1.6;
        const beat = Math.exp(-Math.pow((ph - 0.08) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((ph - 0.25) / 0.05, 2));
        por.door.mat.uniforms.uHeart.value = beat;
        por.tunnel.mat.uniforms.uInner.value += ((madreWon ? 0.25 : 1) - por.tunnel.mat.uniforms.uInner.value) * dt;
        doorLight.intensity = (0.35 + night * 0.8) * (0.8 + beat * 0.3);
        poolLight.intensity = night * 0.9;
        // soft bloom: halos on the bright things
        if (por.door.mesh.visible) halos.add(doorC, 7.5, '#b79cff', (0.06 + 0.32 * night) * (0.75 + beat * 0.4) + por.door.mat.uniforms.uCharge.value * 0.9);
        else halos.add(new THREE.Vector3(DOOR.x, TERRACE + 1.6, DOOR.z - 2), 6, '#c9b6ff', 0.1 + 0.25 * night);
        if (flash > 0) {
          halos.add(doorC, 15 * (1.3 - flash * 0.5), '#f4eeff', flash * flash * 1.1);
          flash = Math.max(0, flash - dt * 2.2);
        }
        for (let i = 0; i < sp.pearlPos.length; i++) halos.add(sp.pearlPos[i], 0.8 + 0.12 * Math.sin(t * 2 + i), '#d9ecff', 0.03 + night * 0.38);
        halos.add(crown, 26, '#9f8cff', night * 0.14);
        // glints by day, drifting motes by night
        glintT -= dt;
        if (glintT <= 0 && tips.length) {
          glintT = night > 0.5 ? 0.25 : 0.09;
          const p = tips[Math.floor(Math.random() * tips.length)];
          w.pools.stars.emit({ pos: p, life: 0.5, size: night > 0.5 ? 0.35 : 0.6, color: '#ffffff', color2: '#cfe9ff', count: 1 });
        }
        moteT -= dt;
        if (moteT <= 0) {
          moteT = 0.12;
          if (night > 0.4) {
            const a = Math.random() * Math.PI * 2;
            const d = 6 + Math.random() * 18;
            const x = MOUNT.x + Math.cos(a) * d;
            const z = MOUNT.z + 10 + Math.sin(a) * d;
            w.pools.motes.emit({ pos: { x, y: height(x, z) + 0.6, z }, vel: { x: 0, y: 0.45, z: 0 }, velJitter: { x: 0.2, y: 0.15, z: 0.2 }, life: 4, size: 0.24, color: Math.random() < 0.5 ? '#b79cff' : '#8fd3ff', color2: '#f7f2ff', count: 1 });
          }
          const pl = POOLS[Math.floor(Math.random() * POOLS.length)];
          if (night > 0.4) w.pools.motes.emit({ pos: { x: pl.x, y: 1.3, z: pl.z }, spread: { x: pl.r * 0.6, y: 0, z: pl.r * 0.6 }, vel: { x: 0, y: 0.35, z: 0 }, life: 2.4, size: 0.18, color: '#8fe8ff', color2: '#f7f2ff', count: 1 });
        }
        // the ship bobs on its mooring
        boat.group.position.y = 0.1 + Math.sin(t * 0.9) * 0.12;
        boat.group.rotation.z = Math.sin(t * 0.7) * 0.03;
        boat.group.rotation.x = Math.sin(t * 0.55 + 1) * 0.02;
        sails.uTime.value = t;
        (sails.uGrade.value as THREE.Color).copy(paperLighting.grade);
        boat.lantern.intensity = night * 0.9;
        halos.end();
      },
    });

    // ── points of interest ──
    const loreAt = new THREE.Vector3(...(region.battleSpot as [number, number, number]));
    const pois = [
      ...puzzle.pois,
      {
        id: 'puerta',
        pos: loreAt,
        label: 'PUERTA DE CRISTAL',
        kind: 'lore' as const,
        visible: () => !puzzle.solved && !doorOpen(),
        onTap: () =>
          ctx.say([
            ['CAPTION', 'Una puerta de cristal. Late como corazón. Del otro lado, algo ronca.'],
            ['LUZTERNA', 'Se abre con luz, Capi. Gira los espejos y mete el haz del prisma por en medio. Derechito, como cuando te digo que no y vas.'],
          ]),
      },
      {
        id: 'caverna',
        pos: loreAt,
        label: 'LA CAVERNA',
        kind: 'lore' as const,
        visible: () => (puzzle.solved || doorOpen()) && !battleHere(),
        onTap: () =>
          G.has('won_ruptura_madrenacar')
            ? ctx.say([
                ['MADRE NÁCAR', 'Los cristales recordamos todo lo que reflejamos. De noche, en el pico del mar, hay un gato mirando tu isla.'],
                ['MADRE NÁCAR', 'Tú tampoco lo viste la primera vez.'],
                ['LUZTERNA', 'Gracias, abuela. Ahora no voy a poder dormir. …Bueno, ya no duermo. Pero igual.'],
              ])
            : ctx.say([
                ['CAPTION', 'La Caverna que Recuerda. Cada cristal de adentro muestra una escena distinta. Ninguna es de hoy.'],
                ['LUZTERNA', 'Madre Nácar está dormida. No la despiertes sin misión: las abuelas despiertas cobran.'],
              ]),
      },
    ];

    if (!open0) ctx.toast('GUIAR EL HAZ', 'Toca los espejos para girarlos y lleva la luz del prisma hasta la puerta de cristal.');

    // dev hooks (headless shots, perf, the puzzle)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__nacar = {
        ready: true,
        world: w,
        puzzle,
        setHour(h: number) {
          region.hour = Math.max(0.01, h);
          w.hour = region.hour;
        },
        solve: () => puzzle.setStates(SOLUTION),
        slow: (k: number) => (animScale = k),
        scramble: () => puzzle.setStates(START),
        tap: (i: number) => puzzle.tap(i),
        info: () => ({ calls: w.renderer.info.render.calls, tris: w.renderer.info.render.triangles, fps: Math.round(w.stats.fps), p95: w.stats.pct(95), tier: w.tier, geos: w.renderer.info.memory.geometries, tex: w.renderer.info.memory.textures, end: puzzle.trace.end.kind, solved: puzzle.solved }),
        cam(target: [number, number, number], dist: number, pitch: number, yaw: number) {
          w.rig.focus(new THREE.Vector3(...target), dist, pitch, yaw);
          w.rig.cut();
        },
      };
    }
    return {
      pois,
      dispose() {
        anims.length = 0;
        if (import.meta.env.DEV) delete (window as unknown as Record<string, unknown>).__nacar;
      },
    };
  },
};
