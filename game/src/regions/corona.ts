/**
 * CORONA CELESTE (Parte II · Oleada 2 «El Cielo Despierta», capa celeste) — docs/part-ii/05 §4.
 *
 * «The safest city in the world: nobody cries, nobody chooses.» A white-and-gold city on a bank of
 * clouds, mirrored left/right down to the last topiary: a crown tower whose crown floats and turns, a
 * ring colonnade around a tiered fountain whose jets fire on the beat, canals that pour two identical
 * waterfalls off the rim, an embassy with one door and no windows, a market of identical stalls, piers
 * where airships moor and three more circle the city in formation, forever. Its citizens purr ALWAYS
 * — and they do everything together (corona/residents.ts). Lens (art bible §7): luminous illustration,
 * clean outlines; pastel days, deep-blue nights lit gold.
 *
 * Activities (POIs, docs/part-ii/14):
 *  - battle marker at the embassy's steps (RegionScene's generic marker, `battleSpot`)
 *  - «Reglas de la Ciudad» (the noticeboard at the plaza's south entrance): counter
 *    `feature_reglas_corona`, flag `corona_reglas` the first time
 *  - «Buzón de quejas» by the embassy: drop a complaint and the whole city stops purring and turns to
 *    look… then carries on as if nothing happened. Counter `feature_queja_corona`, flag `corona_queja`
 *  - tap any citizen: all of them react. Together.
 *  - lore: the embassy's door (when no battle waits there), the flight timetable at the south pier
 */
import * as THREE from 'three';
import type { POI, RegionDef } from './types';
import type { SkyKey } from '../engine/world/sky';
import type { LocalLight } from '../engine/world/paperCat';
import type { Activity } from '../engine/life/director';
import { paperLighting } from '../engine/world/paperCat';
import { ParticlePool } from '../engine/fx/particles';
import { MISSION_BY_ID } from '../data/content';
import { G } from '../state/game';
import { sfx } from '../core/audio';
import { audioApi } from '../audio/api';
import { REGION_INFO } from './index';
import { Bin, canvasTexture } from './paginas/kit';
import { Halos, Mesher, devParams, mat, skyToon } from './cielo/kit';
import { cluster, type Puff } from './cielo/clouds';
import { arcStream, type Stream } from './cielo/wind';
import { mainUnderside, noSwimming, skyLayer } from './cielo/layer';
import { WATER_CORONA, fallSheet, flowStrip, pond } from './cielo/water';
import { AIRSHIP_CORONA, aerialShip, airship } from './cielo/craft';
import { tube } from './cielo/rock';
import { ACRO, ARRIVAL, BOARD, BUZON, CANAL, CANAL_W, CUT, EMBASSY, HALF, PIERS, R, SATELLITES, SEA_Y, SHIP, Y_RING, height, paint, rimR, walkable } from './corona/layout';
import { C, MARBLE, city } from './corona/city';
import { citizens } from './corona/residents';

/** luminous pastel days (peach dawn, pearl noon, rose-gold dusk); deep-blue nights lit by the city's gold */
const SKY: SkyKey[] = [
  { h: 0, zenith: '#0c1240', horizon: '#2a3274', sun: '#9aaaff', sunI: 0, hemiSky: '#4a58aa', hemiGround: '#3a3050', hemiI: 0.66, fog: '#252c66', deep: '#0e1c4a', shallow: '#22406e', grade: '#aeb0e6', night: 1 },
  { h: 4.8, zenith: '#121a4c', horizon: '#3c3c80', sun: '#9aaaff', sunI: 0, hemiSky: '#4c58a8', hemiGround: '#3c3252', hemiI: 0.64, fog: '#323872', deep: '#10204e', shallow: '#244470', grade: '#b2b2e6', night: 1 },
  { h: 6.0, zenith: '#7486d6', horizon: '#ffd0b0', sun: '#ffc898', sunI: 1.25, hemiSky: '#e4dcf6', hemiGround: '#f2d0b0', hemiI: 0.92, fog: '#f4ccb8', deep: '#3a5c9a', shallow: '#7ab8d0', grade: '#ffe6d6', night: 0.2 },
  { h: 8.0, zenith: '#6ea6f0', horizon: '#fbecd8', sun: '#fff4e2', sunI: 2.3, hemiSky: '#e2ecfc', hemiGround: '#f0e0c6', hemiI: 0.94, fog: '#eee4d6', deep: '#2a6aa8', shallow: '#62c0d8', grade: '#fffaf2', night: 0 },
  { h: 12.5, zenith: '#62a2f2', horizon: '#e6eefc', sun: '#ffffff', sunI: 2.5, hemiSky: '#eaf2ff', hemiGround: '#f4e6cc', hemiI: 0.98, fog: '#e2eaf8', deep: '#2468aa', shallow: '#5cc4dc', grade: '#ffffff', night: 0 },
  { h: 16.5, zenith: '#7298e6', horizon: '#ffeac8', sun: '#ffe0aa', sunI: 2.3, hemiSky: '#e0e4f8', hemiGround: '#f6dcb8', hemiI: 0.92, fog: '#f6e4c8', deep: '#2a5c98', shallow: '#5ab4cc', grade: '#fff4e0', night: 0 },
  { h: 18.3, zenith: '#6466c4', horizon: '#ffb494', sun: '#ffa676', sunI: 1.45, hemiSky: '#dcc4e6', hemiGround: '#e8b49a', hemiI: 0.92, fog: '#f2b4a4', deep: '#30487e', shallow: '#5a8cb0', grade: '#ffd6c2', night: 0.15 },
  { h: 19.6, zenith: '#28286e', horizon: '#a0749e', sun: '#d6a0b6', sunI: 0.35, hemiSky: '#6a62a8', hemiGround: '#5a4458', hemiI: 0.68, fog: '#5c5090', deep: '#182a5e', shallow: '#2e4c84', grade: '#c2b4e2', night: 0.65 },
  { h: 21, zenith: '#0d1442', horizon: '#262e6c', sun: '#9aaaff', sunI: 0, hemiSky: '#4a58aa', hemiGround: '#3a3050', hemiI: 0.66, fog: '#232a62', deep: '#0e1c4a', shallow: '#22406e', grade: '#aeb0e6', night: 1 },
  { h: 24, zenith: '#0c1240', horizon: '#2a3274', sun: '#9aaaff', sunI: 0, hemiSky: '#4a58aa', hemiGround: '#3a3050', hemiI: 0.66, fog: '#252c66', deep: '#0e1c4a', shallow: '#22406e', grade: '#aeb0e6', night: 1 },
];

const dev = devParams();

/** a story battle of this city is the active story mission's goal right now */
function battleHere() {
  for (const m of G.s.missions.active) {
    const b = (MISSION_BY_ID.get(m)?.goal as { battle?: string } | undefined)?.battle;
    if (b && REGION_INFO.corona.battles.includes(b)) return b;
  }
  return null;
}

const RULES = [
  'REGLAS DE LA CIUDAD',
  '(vigentes desde siempre)',
  '1. Aquí se ronronea. Si a usted no le sale,',
  '    se le asignará un ronroneo.',
  '2. Prohibido llorar. Tampoco hace falta.',
  '3. Elegir cansa: ya se eligió todo por usted.',
  '4. La siesta es a las 14:00. La de todos.',
  '5. Prohibido caerse de la ciudad.',
  '6. Las quejas, en el buzón. Gracias.',
  '7. Bienvenido. Ya nos cae bien.',
];

export const region: RegionDef = {
  id: 'corona',
  name: 'Corona Celeste',
  subtitle: 'La ciudad más segura del mundo.',
  half: HALF,
  height,
  paint,
  walkable,
  skyKeys: SKY,
  rupture: 0.35,
  fog: { near: 120, far: 480 },
  hour: dev.hour,
  weather: dev.weather,
  camera: { target: [0, 6, -4], yaw: 0, pitch: 0.47, dist: 84, minDist: 8, maxDist: 140, bound: 66 },
  arrival: ARRIVAL,
  battleSpot: [EMBASSY.x - EMBASSY.w / 2 - 3.2, Y_RING + 6.4, EMBASSY.z],
  async build(ctx) {
    const w = ctx.world;
    const rng = ctx.rng;
    const bin = new Bin();
    const uNight = { value: 0 };
    const uTime = { value: 0 };
    const root = new THREE.Group();
    root.name = 'corona';
    noSwimming(w);

    // ── the sky layer: the city sits on a bank of clouds ──
    const puffs: Puff[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + rng() * 0.1;
      const r = rimR(a) * (0.86 + rng() * 0.16);
      cluster(puffs, rng, Math.cos(a) * r, -2.5 - rng() * 6, Math.sin(a) * r, 5.5 + rng() * 3, 4, 0.7);
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      cluster(puffs, rng, Math.cos(a) * 20, -14 - rng() * 6, Math.sin(a) * 20, 7 + rng() * 3, 4, 0.7);
    }
    for (const s of SATELLITES) cluster(puffs, rng, s.x, s.y - 3, s.z, s.r * 0.9, 5, 0.65);
    for (let i = 0; i < 18; i++) {
      const a = rng() * Math.PI * 2;
      const r = 120 + rng() * 220;
      cluster(puffs, rng, Math.cos(a) * r, SEA_Y + 4, Math.sin(a) * r, 18 + rng() * 28, 6, 0.8);
    }
    for (let i = 0; i < 30; i++) {
      const a = rng() * Math.PI * 2;
      const r = 55 + rng() * 110;
      cluster(puffs, rng, Math.cos(a) * r, SEA_Y + 2 + rng() * 3, Math.sin(a) * r, 7 + rng() * 8, 3, 0.5);
    }
    const streams: Stream[] = [];
    for (let i = 0; i < 4; i++) streams.push(arcStream(0, 0, 50 + i * 5, 6 + i * 4, i * 1.57, i * 1.57 + 2.4, rng, 0.32, 0.7 + rng() * 0.5));
    for (let i = 0; i < 3; i++) streams.push(arcStream(0, 0, 85 + i * 14, -2 + i * 8, 1 + i * 2.1, 1 + i * 2.1 + 1.8, rng, 0.5, 0.6));
    const sky = skyLayer(w, bin, {
      cut: CUT,
      seaY: SEA_Y,
      depth: 480,
      gap: 0.44,
      drift: [0.9, 0.3],
      palette: { lit: '#fffaf0', shade: '#b9c2e6', litNight: '#7a84c8', shadeNight: '#283068', rim: '#ffe9c0' },
      puffs,
      streams,
      windColor: '#fff6e0',
    });
    root.add(sky.group);

    // ── the city's underside: white stone with gold strata, golden chains with lanterns ──
    const RM = new Mesher(true);
    mainUnderside(RM, height, { cut: CUT, rMax: R * 1.3, depth: 30, seed: 5, pal: MARBLE, grass: '#efe6d2', tip: [0, 0], belly: 0.1, jag: 0.08, rings: 12, inset: 2.0 });
    const chainEnds: THREE.Vector3[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const r = rimR(a) * 0.72;
      const top = new THREE.Vector3(Math.cos(a) * r, CUT - 5, Math.sin(a) * r);
      const L = 10 + (i % 2) * 4;
      const pts = Array.from({ length: 6 }, (_, k) => top.clone().add(new THREE.Vector3(0, -(k / 5) * L, 0)));
      tube(RM, pts, 0.12, 0.12, C.gold, 0.25, 5);
      const end = pts[5];
      RM.add(new THREE.OctahedronGeometry(0.55, 0), C.glass, mat(end.x, end.y - 0.6, end.z), 0.3, 1.1);
      RM.add(new THREE.ConeGeometry(0.5, 0.5, 6), C.gold, mat(end.x, end.y, end.z), 0.3);
      chainEnds.push(end.clone().add(new THREE.Vector3(0, -0.6, 0)));
    }
    const under = new THREE.Mesh(bin.add(RM.build()), skyToon(bin, { uNight, key: 'cor-rock', bright: 0.18 }));
    under.receiveShadow = true;
    root.add(under);

    // the marble streets: a little self-lift so white reads white at dawn and dusk (eased off at night)
    const ground = w.terrain.material;
    ground.emissive.set('#3a342a');
    // ── the city ──
    const CM = new Mesher(false);
    const cty = city(CM, rng);
    const cityMesh = new THREE.Mesh(bin.add(CM.build()), skyToon(bin, { uNight, key: 'cor', bright: 0.3 }));
    cityMesh.castShadow = true;
    cityMesh.receiveShadow = true;
    cityMesh.name = 'corona-city';
    root.add(cityMesh);
    // obstacles the residents walk around
    for (const p of [cty.fountain.pool]) w.obstacles.push({ x: p.x, z: p.z, r: 4.6 });
    w.obstacles.push({ x: BOARD.x, z: BOARD.z, r: 2.4 }, { x: BUZON.x, z: BUZON.z, r: 0.8 });

    // the floating crown and its rings (they turn)
    const crownM = new Mesher(false);
    crownM.add(new THREE.TorusGeometry(2.4, 0.32, 10, 40), C.gold2, undefined, 0, 0.35);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      crownM.add(new THREE.ConeGeometry(0.34, 1.6, 8), C.gold2, mat(Math.cos(a) * 2.4, 0.9, Math.sin(a) * 2.4), 0, 0.35);
      crownM.add(new THREE.OctahedronGeometry(0.26, 0), i % 2 ? '#9fdcd2' : '#ffffff', mat(Math.cos(a) * 2.4, 1.85, Math.sin(a) * 2.4), 0, 1);
    }
    const crown = new THREE.Mesh(bin.add(crownM.build()), skyToon(bin, { uNight, key: 'cor', bright: 0.3 }));
    const crownY = cty.crownTop + 4.6;
    crown.position.set(ACRO.x, crownY, ACRO.z);
    root.add(crown);
    const ringM = new Mesher(false);
    ringM.add(new THREE.TorusGeometry(5.2, 0.12, 6, 64), C.gold, undefined, 0, 0.3);
    ringM.add(new THREE.TorusGeometry(6.6, 0.09, 6, 64), C.gold2, mat(0, 0, 0, 0.4, 0, 0.2), 0, 0.3);
    const rings = new THREE.Mesh(bin.add(ringM.build()), skyToon(bin, { uNight, key: 'cor', bright: 0.3 }));
    rings.position.set(ACRO.x, cty.crownTop - 6, ACRO.z);
    root.add(rings);

    // the noticeboard's sheet (printed rules)
    const boardTex = canvasTexture(bin, 512, 340, (g, cw, ch) => {
      g.fillStyle = '#fffdf6';
      g.fillRect(0, 0, cw, ch);
      g.strokeStyle = '#e2b046';
      g.lineWidth = 8;
      g.strokeRect(10, 10, cw - 20, ch - 20);
      g.fillStyle = '#4a3a1a';
      g.textAlign = 'center';
      g.font = 'bold 40px Georgia, serif';
      g.fillText(RULES[0], cw / 2, 62);
      g.font = 'italic 20px Georgia, serif';
      g.fillText(RULES[1], cw / 2, 90);
      g.textAlign = 'left';
      g.font = '19px Georgia, serif';
      RULES.slice(2).forEach((l, i) => g.fillText(l, 34, 128 + i * 25));
    });
    const sheet = new THREE.Mesh(bin.add(new THREE.PlaneGeometry(3.7, 2.45)), bin.add(new THREE.MeshToonMaterial({ map: boardTex })));
    sheet.position.copy(cty.board).add(new THREE.Vector3(0, 0, 0.06));
    root.add(sheet);

    // ── water: fountain pools, the canals, two identical waterfalls off the rim ──
    root.add(pond(bin, cty.fountain.pool.x, cty.fountain.pool.y, cty.fountain.pool.z, 4.05, WATER_CORONA, uTime, uNight));
    root.add(pond(bin, cty.fountain.mid.x, cty.fountain.mid.y, cty.fountain.mid.z, 1.85, WATER_CORONA, uTime, uNight));
    const falls: { lip: THREE.Vector3; out: THREE.Vector3; curve: THREE.CatmullRomCurve3 }[] = [];
    for (const sx of [-1, 1]) {
      const line = CANAL.map(([x, z]) => [sx * x, z] as [number, number]);
      // extend to the rim and a little over it
      const last = line[line.length - 1];
      const dir = new THREE.Vector2(last[0], last[1]).normalize();
      root.add(flowStrip(bin, line, () => Y_RING - 0.3, CANAL_W * 0.9, WATER_CORONA, uTime, uNight, 2.0));
      const lip = new THREE.Vector3(last[0], Y_RING - 0.3, last[1]);
      const out = new THREE.Vector3(dir.x, 0, dir.y);
      const P = (k: number, y: number) => lip.clone().addScaledVector(out, k).add(new THREE.Vector3(0, y, 0));
      const f = fallSheet(bin, [P(0, 0), P(2.0, -0.4), P(3.2, -3), P(3.8, -12), P(4.0, -26), P(4.2, -40)], new THREE.Vector3(-out.z, 0, out.x), (t) => 1.4 + t * 1.0, WATER_CORONA, uTime, uNight, { speed: 8 });
      root.add(f.mesh);
      falls.push({ lip, out, curve: f.curve });
    }

    // ── airships: two moored at the masts, three circling the city in perfect formation ──
    const docked = cty.masts.map((m, i) => {
      const a = airship(bin, uNight, AIRSHIP_CORONA, 1.0);
      const p = PIERS[i];
      a.group.position.set(m.x + Math.cos(p.ang) * 6.2, m.y - 0.5, m.z + Math.sin(p.ang) * 6.2);
      a.group.rotation.y = Math.atan2(-Math.cos(p.ang), -Math.sin(p.ang));
      root.add(a.group);
      return { a, base: a.group.position.clone(), ph: i * Math.PI };
    });
    const circling = [0, 1, 2].map(() => {
      const a = airship(bin, uNight, AIRSHIP_CORONA, 1.25);
      root.add(a.group);
      return a;
    });
    // your ship, at the south pier
    const boat = aerialShip(bin, uNight);
    boat.group.position.set(SHIP.x, SHIP.y, SHIP.z);
    boat.group.rotation.y = SHIP.ry;
    boat.group.scale.setScalar(1.15);
    root.add(boat.group);

    // fountain jets (they fire on the city's beat)
    const jets = new ParticlePool(900, { additive: false, gravity: 9.5, wobble: 0.05 });
    root.add(jets.points);
    const halos = new Halos(bin, 80);
    root.add(halos.mesh);

    // ── residents ──
    const town = await citizens(ctx);

    // ── light for the cats: the nearest lamps, the windows, the crown ──
    const lampLights: LocalLight[] = cty.L.lamps.map((p) => ({ pos: p, color: new THREE.Color('#ffe2a0'), range: 7, intensity: 0 }));
    const crownLight: LocalLight = { pos: new THREE.Vector3(ACRO.x, Y_RING + 6, ACRO.z + 6), color: new THREE.Color('#fff0c0'), range: 14, intensity: 0 };
    const fountainLight: LocalLight = { pos: cty.fountain.top.clone(), color: new THREE.Color('#bff2ff'), range: 9, intensity: 0 };

    // ── activities ──
    let busy = false;
    let alive = true;
    const say = async (lines: Parameters<typeof ctx.say>[0]) => {
      busy = true;
      try {
        await ctx.say(lines);
      } finally {
        busy = false;
      }
    };
    const readRules = async () => {
      if (busy) return;
      ctx.feature('reglas_corona');
      const first = !ctx.has('corona_reglas');
      ctx.flag('corona_reglas');
      w.rig.follow = null;
      w.rig.focus(cty.board.clone(), 14, 0.18, 0);
      await say([
        ['CAPTION', 'REGLAS DE LA CIUDAD (vigentes desde siempre). 1. Aquí se ronronea; si a usted no le sale, se le asignará un ronroneo. 2. Prohibido llorar. Tampoco hace falta: aquí nadie tiene motivos.'],
        ['CAPTION', '3. Elegir cansa: para su comodidad, ya se eligió todo. 4. La siesta es a las 14:00. Todas las siestas. De todos.'],
        ['CAPTION', '5. Prohibido caerse de la ciudad (nadie se ha caído nunca; revise el punto 3). 6. Las quejas van en el buzón. Gracias por no quejarse. 7. Bienvenido. Usted ya nos cae bien.'],
        first ? ['LUZTERNA', '«Ya se eligió todo». ¿Quién eligió? ¿Cuándo? ¿Y por qué tengo ganas de irme sin haber terminado de llegar?'] : ['LUZTERNA', 'Siguen igual. Las reglas, digo. Aquí nada cambia. Esa es la regla cero, supongo.'],
      ]);
    };
    const complain = async () => {
      if (busy) return;
      const first = !ctx.has('corona_queja');
      w.rig.follow = null;
      w.rig.focus(new THREE.Vector3(BUZON.x - 6, Y_RING + 2, BUZON.z - 2), 34, 0.32, -Math.PI / 2 + 0.35);
      await say(
        first
          ? [
              ['CAPTION', 'BUZÓN DE QUEJAS. Vacío. Tiene polvo de nube por dentro y una tarjetita pegada: «Gracias por no quejarse».'],
              ['LUZTERNA', 'Capi, ¿cuándo has visto a un gato que no se queje? Exacto: nunca. Echa una. Por la ciencia.'],
            ]
          : [['CAPTION', 'Echas otra queja al buzón. Cae sin hacer ruido.']],
      );
      if (!alive) return;
      ctx.feature('queja_corona');
      ctx.flag('corona_queja');
      sfx('paper');
      ctx.floatText(cty.box.clone().add(new THREE.Vector3(0, 1.2, 0)), '*queja depositada*');
      town.hush(cty.box, 3.4);
      audioApi.duck(true, 0.8);
      busy = true;
      await new Promise((r) => setTimeout(r, 3600));
      audioApi.duck(false);
      busy = false;
      if (!alive) return;
      sfx('purr');
      await say(
        first
          ? [
              ['LUZTERNA', '¿Viste eso? Dejaron de ronronear. TODOS. Al mismo tiempo. Y voltearon al buzón.'],
              ['LUZTERNA', '…Y ya volvieron. Como si nada. Me encanta esta ciudad, Capi. Me encanta tanto que ya me quiero ir.'],
            ]
          : [['LUZTERNA', 'Otra vez el silencio. Otra vez «como si nada». Deja de hacer eso, me pones la llama de punta.']],
      );
    };
    const embassyLore = () =>
      say([
        ['CAPTION', 'LA EMBAJADA. Una puerta enorme sin manija, y ni una sola ventana. Un letrero dorado: «ABRIMOS CUANDO USTED LO NECESITE. YA SABEMOS CUÁNDO».'],
        ['LUZTERNA', 'No me gusta un edificio que se sabe mi agenda.'],
      ]);
    const timetable = () =>
      say([
        ['CAPTION', 'HORARIO DE VUELOS. Salidas: todas. Destino: aquí. Los aerobarcos le dan una vuelta a la ciudad y regresan, «para que nadie se pierda».'],
        ['LUZTERNA', 'Nuestro barco, en cambio, se pierde con muchísimo estilo. Por eso lo quiero.'],
      ]);

    // taps on residents: the citizens all react to any of them
    const prevClick = w.rig.onClick;
    w.rig.onClick = (x, y) => {
      if (busy) return;
      const hit = w.pickResident(x, y);
      if (hit && town.isCitizen(hit.id)) {
        town.chorusHappy();
        sfx('purr');
      }
      const s = w.project(cty.box);
      if (!hit && s && Math.hypot(s.x - x, s.y - y) < 50) return void complain();
      prevClick?.(x, y);
    };

    // ── every frame ──
    let jetT = 0;
    let mistT = 0;
    const sails = boat.sails.uniforms;
    const tmp = new THREE.Vector3();
    // the cats read only the lamps near the camera (refreshed twice a second): ~40 lamps × every cat ×
    // every frame was a garbage-collector party
    const nearLights: LocalLight[] = [crownLight, fountainLight, boat.lantern];
    let pickT = 0;
    const camT = w.rig.cur.target;
    w.addProp({
      group: root,
      lights: nearLights,
      update(dt, t, night) {
        uTime.value = t;
        uNight.value = night;
        ground.emissiveIntensity = 1 - night * 0.85;
        sky.update(t);
        jets.budget = w.pools.motes.budget;
        jets.update(dt, w.renderer.domElement.height);
        halos.begin();
        // the crown turns, the rings counter-turn (slowly, evenly)
        crown.rotation.y = t * 0.25;
        crown.position.y = crownY + Math.sin(t * 0.8) * 0.25;
        rings.rotation.y = -t * 0.15;
        rings.rotation.x = Math.sin(t * 0.3) * 0.05;
        halos.add(crown.position, 9, '#fff0c0', 0.12 + night * 0.4);
        // lamps at night (the city is never dark)
        for (const l of lampLights) l.intensity = night * 0.95;
        pickT -= dt;
        if (pickT <= 0) {
          pickT = 0.5;
          nearLights.length = 3;
          if (night > 0.05) nearLights.push(...lampLights.filter((l) => Math.abs(l.pos.x - camT.x) < 30 && Math.abs(l.pos.z - camT.z) < 30).slice(0, 10));
        }
        for (const p of cty.L.lamps) halos.add(p, 2.6, '#ffe2a0', night * 0.55);
        for (const p of chainEnds) halos.add(p, 3.2, '#ffe2a0', 0.05 + night * 0.6);
        crownLight.intensity = 0.2 + night * 0.7;
        fountainLight.intensity = 0.1 + night * 0.5;
        // fountain: all the jets fire at once, on the same beat as the purring (when it purrs)
        jetT -= dt;
        if (jetT <= 0) {
          jetT = 1.4;
          if (town.purring()) {
            const f = cty.fountain;
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              jets.emit({ pos: { x: f.mid.x + Math.cos(a) * 1.75, y: f.mid.y + 0.1, z: f.mid.z + Math.sin(a) * 1.75 }, vel: { x: Math.cos(a) * 1.4, y: 5.2, z: Math.sin(a) * 1.4 }, velJitter: { x: 0.12, y: 0.25, z: 0.12 }, life: 1.25, size: 0.26, color: '#ffffff', color2: '#bff2ff', count: 14 });
            }
            jets.emit({ pos: f.top, vel: { x: 0, y: 7.5, z: 0 }, velJitter: { x: 0.6, y: 0.4, z: 0.6 }, life: 1.7, size: 0.3, color: '#ffffff', color2: '#bff2ff', count: 30 });
          }
        }
        halos.add(cty.fountain.top, 3.5, '#bff2ff', night * 0.35);
        // the falls: mist where they meet the clouds
        mistT -= dt;
        if (mistT <= 0) {
          mistT = 0.3;
          for (const f of falls) {
            w.pools.smoke.emit({ pos: f.curve.getPointAt(0.85 + Math.random() * 0.1), spread: { x: 2, y: 1.5, z: 2 }, vel: { x: 0, y: -0.6, z: 0 }, velJitter: { x: 0.5, y: 0.3, z: 0.5 }, life: 3.5, size: 3.2, color: '#ffffff', color2: '#e8f4ff', count: 1 });
            w.pools.smoke.emit({ pos: f.lip, spread: { x: 0.6, y: 0.1, z: 0.6 }, vel: { x: f.out.x * 0.6, y: 0.3, z: f.out.z * 0.6 }, life: 1.2, size: 1.0, color: '#ffffff', color2: '#e8f4ff', count: 1 });
          }
          // cloud jars at the market breathe little puffs
          const j = cty.jars[Math.floor(Math.random() * cty.jars.length)];
          if (j) w.pools.motes.emit({ pos: j, vel: { x: 0, y: 0.35, z: 0 }, life: 1.6, size: 0.3, color: '#ffffff', color2: '#e8f4ff', count: 1 });
        }
        // airships: the docked ones bob at their masts; three more circle, 120° apart, in step
        for (const d of docked) {
          d.a.group.position.y = d.base.y + Math.sin(t * 0.7 + d.ph) * 0.3;
          d.a.prop.rotation.z = t * 2;
        }
        circling.forEach((a, i) => {
          const ang = t * 0.045 + (i * Math.PI * 2) / 3;
          a.group.position.set(Math.cos(ang) * 82, 20 + Math.sin(t * 0.5) * 0.8, Math.sin(ang) * 82);
          a.group.rotation.y = -ang;
          a.prop.rotation.z = t * 9;
          if (night > 0.3) halos.add(tmp.copy(a.group.position).add(new THREE.Vector3(0, -5.4, 0)), 4, '#ffe2a0', night * 0.4);
        });
        // your ship floats at the pier
        boat.group.position.y = SHIP.y + Math.sin(t * 0.8) * 0.3;
        boat.group.rotation.z = Math.sin(t * 0.6) * 0.03;
        boat.update(t);
        sails.uTime.value = t;
        (sails.uGrade.value as THREE.Color).copy(paperLighting.grade);
        boat.lantern.pos.set(SHIP.x, boat.group.position.y + 1.8, SHIP.z - 3.6);
        boat.lantern.intensity = 0.15 + night * 0.9;
        town.update(dt, t, night);
        halos.end();
      },
    });

    // ── points of interest ──
    const pois: POI[] = [
      {
        id: 'reglas',
        pos: cty.board.clone().add(new THREE.Vector3(0, 2.6, 0)),
        label: 'REGLAS DE LA CIUDAD',
        kind: 'lore',
        visible: () => !busy,
        onTap: () => readRules(),
      },
      {
        id: 'buzon',
        pos: cty.box.clone().add(new THREE.Vector3(0, 1.6, 0)),
        label: 'BUZÓN DE QUEJAS',
        kind: 'activity',
        visible: () => !busy && w.camera.position.distanceTo(cty.box) < 70,
        onTap: () => complain(),
      },
      {
        id: 'embajada',
        pos: new THREE.Vector3(EMBASSY.x - EMBASSY.w / 2, Y_RING + EMBASSY.h + 1.5, EMBASSY.z),
        label: 'LA EMBAJADA',
        kind: 'lore',
        visible: () => !busy && !battleHere() && w.camera.position.distanceTo(cty.embassyDoor) < 60,
        onTap: () => embassyLore(),
      },
      {
        id: 'horario',
        pos: cty.south.end.clone().add(new THREE.Vector3(-2.5, 3.2, -4)),
        label: 'HORARIO DE VUELOS',
        kind: 'lore',
        visible: () => !busy && w.camera.position.distanceTo(cty.south.end) < 55,
        onTap: () => timetable(),
      },
    ];

    audioApi.ambience('wind', { fade: 2, level: 0.55 });
    audioApi.setState('explore_mystery', { fade: 2, context: 'corona' });

    // dev hooks (headless shots, perf, the activities)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__corona = {
        ready: true,
        world: w,
        setHour(h: number) {
          region.hour = Math.max(0.01, h);
          w.hour = region.hour;
        },
        rules: readRules,
        complain,
        hush: () => town.hush(cty.box, 3.4),
        happy: () => town.chorusHappy(),
        info: () => ({ calls: w.renderer.info.render.calls, tris: w.renderer.info.render.triangles, fps: Math.round(w.stats.fps), p95: w.stats.pct(95), tier: w.tier, geos: w.renderer.info.memory.geometries, tex: w.renderer.info.memory.textures }),
        cam(target: [number, number, number], dist: number, pitch: number, yaw: number) {
          w.rig.follow = null;
          w.rig.focus(new THREE.Vector3(...target), dist, pitch, yaw);
          w.rig.cut();
        },
      };
    }
    // what the city lends a CINE scene (ui/story/o2Cines.ts: h45_ciudad, h45_registro, h46_embajada)
    const heliceAt = () => w.residents.get('cor_helice')?.cat.root.position.clone().add(new THREE.Vector3(0, 1.3, 0)) ?? cty.south.end.clone().add(new THREE.Vector3(0, 1.5, 0));
    const cine = {
      points: {
        avenue: new THREE.Vector3(0, Y_RING + 1.2, 35),
        fountain: new THREE.Vector3(0, Y_RING + 2.2, 0),
        ring: new THREE.Vector3(0, Y_RING + 1.4, 5.5),
        embassy: new THREE.Vector3(EMBASSY.x, Y_RING + EMBASSY.h * 0.55, EMBASSY.z),
        door: cty.embassyDoor.clone().add(new THREE.Vector3(0, 1.2, 0)),
        pier: cty.south.end.clone().add(new THREE.Vector3(0, 1.5, 0)),
        center: new THREE.Vector3(0, 4, 0),
      } as Record<string, THREE.Vector3>,
      fx(cmd: { id: string; [k: string]: unknown }) {
        switch (cmd.id) {
          case 'hush':
            town.hush(cty.embassyDoor, Number(cmd.secs ?? 6));
            return null;
          case 'bow': {
            // the guards at the one door bow in unison: perfect, and a little too long
            for (const sz of [-1, 1]) w.residents.get(`cor_vitral_${sz}`)?.cat.brain.emote('sleepy', 0.9);
            ctx.floatText(cty.embassyDoor.clone().add(new THREE.Vector3(0, 3.2, 0)), '*reverencia perfecta*');
            return null;
          }
          case 'heliceHold': {
            // she waits at her basement door for the shot (the scene's camera finds her there, not wherever her
            // wandering took her), and goes back to her day when the scene ends
            const r = w.residents.get('cor_helice');
            const a = r?.agent;
            if (!r || !a || !w.director) return null;
            const hold: Activity = { id: 'cine_hold', stickiness: 99, interruptible: false, score: () => 0, start: (ag) => void (ag.target = null), update: () => false };
            w.director.switchTo(a, hold);
            a.claimed = true;
            a.pos.copy(r.opts.home);
            a.vel.set(0, 0, 0);
            r.cat.root.position.copy(a.pos);
            return () => {
              if (a.activity === hold) a.activity = null;
              a.claimed = false;
            };
          }
          case 'helicePack': {
            // out of the basement: the wrench in her paw and a backpack already packed
            const r = w.residents.get('cor_helice');
            if (!r) return null;
            r.cat.brain.emote('happy', 1);
            const pack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.5), new THREE.MeshLambertMaterial({ color: '#b0567a' }));
            // on the ground at her side, toward screen-right (on her back it hid her face from the scene's camera)
            const right = new THREE.Vector3().setFromMatrixColumn(w.camera.matrixWorld, 0).setY(0);
            if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
            right.normalize();
            pack.position.copy(r.cat.root.position).addScaledVector(right, 1.25).add(new THREE.Vector3(0, 0.45, 0));
            pack.rotation.y = Math.atan2(right.x, right.z) + 0.3;
            w.scene.add(pack);
            ctx.floatText(r.cat.root.position.clone().add(new THREE.Vector3(0, 3.4, 0)), '¡ME VOY!');
            return () => {
              pack.removeFromParent();
              pack.geometry.dispose();
              (pack.material as THREE.Material).dispose();
            };
          }
        }
        return undefined;
      },
    };
    Object.defineProperty(cine.points, 'helice', { get: heliceAt, enumerable: true });
    return {
      pois,
      cine,
      dispose() {
        alive = false;
        busy = false;
        audioApi.ambience('none', { fade: 1.5 });
        jets.dispose();
        bin.dispose();
        if (import.meta.env.DEV) delete (window as unknown as Record<string, unknown>).__corona;
      },
    };
  },
};
