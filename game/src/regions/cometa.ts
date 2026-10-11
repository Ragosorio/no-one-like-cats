/**
 * PUERTO COMETA (Parte II · Oleada 3 «La Era Astral», the edge of the astral layer) — docs/part-ii/05 §4.
 *
 * «The retro-futurist shipyard where ships learn to be starships.» A chip of a comet drifting at the very
 * top of the sky layer, where the air thins into space: the stars never switch off (not even at noon),
 * a ringed giant hangs in the north-west, the comet's two tails stream away behind the island, and the
 * clouds are a floor far, far below. Somebody paved half of it and opened a yard: two drydocks turning
 * wooden hulls into chrome (gantries, glowing rivets, welding sparks), cranes, a refinery of Combustible
 * Astral pumped from the comet's crystal heart, a launch rail over the void, an observatory, and the
 * googie workshop of an owner in a fishbowl helmet. Gravity is low: cats hop high and slow, dust floats
 * up. Lens (art bible §7): RETROFUTURO — soft scanlines, neon, metallic paint.
 *
 * Activities (POIs, docs/part-ii/14):
 *  - battle marker on the plaza (RegionScene's generic marker, `battleSpot`)
 *  - «Taller del Casco de Pecera»: counter `feature_taller_cometa` (+ flag `cometa_taller` the first time);
 *    opens the Oleada 3 shop when state/sys/rupturasO3.ts exports it (openTallerCometa)
 *  - «Rampa de lanzamiento»: launch the test rocket (countdown, rail, an arc over the island, parachute);
 *    counter `feature_lanzamiento_cometa`; the first launch pays once per save (ledger `cometa:lanzamiento`)
 *  - «Telescopio» (lore): counter `feature_telescopio_cometa`, flag `cometa_telescopio`
 */
import * as THREE from 'three';
import type { POI, RegionBuild, RegionDef } from './types';
import gsap from 'gsap';
import { motif } from '../cine/sound';
import type { SkyKey } from '../engine/world/sky';
import type { LocalLight } from '../engine/world/paperCat';
import { paperLighting } from '../engine/world/paperCat';
import { ParticlePool } from '../engine/fx/particles';
import { G } from '../state/game';
import { claimReward, rewardClaimed } from '../state/sys/rupturasLedger';
import { sfx } from '../core/audio';
import { audioApi } from '../audio/api';
import { Bin } from './paginas/kit';
import { Halos, Mesher, devParams, mat, skyToon } from './cielo/kit';
import { cluster, type Puff } from './cielo/clouds';
import { arcStream, type Stream } from './cielo/wind';
import { mainUnderside, noSwimming, skyLayer } from './cielo/layer';
import type { RockPalette } from './cielo/rock';
import { tube } from './cielo/rock';
import { ARRIVAL, CRANES, CUT, HALF, PIER, PLAZA, RAIL_PTS, SEA_Y, SHIP, Y, height, paint, walkable } from './cometa/layout';
import { P, metalToon } from './cometa/kit';
import { AstralSky, CometTail, PLANET_DIR } from './cometa/space';
import { buildPort } from './cometa/port';
import { fontsReady, neonSigns } from './cometa/neon';
import { astralShip, rocket } from './cometa/hulls';
import { craneTop, debris, fishbowl, fuelTubes, radar, shieldDome, telescope, veins } from './cometa/props';
import { lowGravity, residents } from './cometa/residents';

/**
 * Deep indigo all day long (the stars never leave: cometa/space.ts draws them); «day» is a long
 * sunrise — the comet's glow on the horizon, peach and pink — and night belongs to the neon.
 */
const SKY: SkyKey[] = [
  { h: 0, zenith: '#03041a', horizon: '#2a1d5c', sun: '#a8b4ff', sunI: 0, hemiSky: '#5a5ac0', hemiGround: '#2a2050', hemiI: 0.78, fog: '#1a1544', deep: '#060a2a', shallow: '#1a2a5a', grade: '#b2b0f2', night: 1 },
  { h: 4.8, zenith: '#05061f', horizon: '#3a2260', sun: '#a8b4ff', sunI: 0, hemiSky: '#5c5ac0', hemiGround: '#2c2252', hemiI: 0.78, fog: '#22184c', deep: '#070c2c', shallow: '#1c2c5c', grade: '#b6b2f2', night: 1 },
  { h: 6.0, zenith: '#16134a', horizon: '#ff8f7a', sun: '#ffc0a0', sunI: 1.35, hemiSky: '#c6a8f0', hemiGround: '#4a3060', hemiI: 0.86, fog: '#46306c', deep: '#141a4a', shallow: '#3a4a8a', grade: '#ffd8d0', night: 0.3 },
  { h: 8.0, zenith: '#151650', horizon: '#c07ab0', sun: '#fff0ea', sunI: 2.1, hemiSky: '#cdbdf6', hemiGround: '#55406e', hemiI: 0.92, fog: '#433a80', deep: '#16205a', shallow: '#4a62a8', grade: '#fff0f4', night: 0.12 },
  { h: 12.5, zenith: '#141a58', horizon: '#b47abc', sun: '#ffffff', sunI: 2.35, hemiSky: '#d6cdfa', hemiGround: '#5a4a74', hemiI: 0.96, fog: '#463e88', deep: '#18265e', shallow: '#506cb0', grade: '#fffaff', night: 0.08 },
  { h: 16.5, zenith: '#161650', horizon: '#c47aa8', sun: '#ffe8de', sunI: 2.1, hemiSky: '#d0c0f4', hemiGround: '#5a426c', hemiI: 0.92, fog: '#46387e', deep: '#16205a', shallow: '#4a60a4', grade: '#fff2ee', night: 0.12 },
  { h: 18.3, zenith: '#1a124a', horizon: '#ff8a6e', sun: '#ffb08a', sunI: 1.4, hemiSky: '#c4a2e6', hemiGround: '#4c2e58', hemiI: 0.86, fog: '#462c64', deep: '#141a48', shallow: '#3a4688', grade: '#ffd2c6', night: 0.3 },
  { h: 19.6, zenith: '#0c0a30', horizon: '#7a3a82', sun: '#d090c0', sunI: 0.35, hemiSky: '#7a6ac8', hemiGround: '#342454', hemiI: 0.8, fog: '#36245e', deep: '#0a1036', shallow: '#22306a', grade: '#c6b4ec', night: 0.75 },
  { h: 21, zenith: '#04051c', horizon: '#2c1e5e', sun: '#a8b4ff', sunI: 0, hemiSky: '#5a5ac0', hemiGround: '#2a2050', hemiI: 0.78, fog: '#1c1646', deep: '#060a2a', shallow: '#1a2a5a', grade: '#b2b0f2', night: 1 },
  { h: 24, zenith: '#03041a', horizon: '#2a1d5c', sun: '#a8b4ff', sunI: 0, hemiSky: '#5a5ac0', hemiGround: '#2a2050', hemiI: 0.78, fog: '#1a1544', deep: '#060a2a', shallow: '#1a2a5a', grade: '#b2b0f2', night: 1 },
];

/** the comet's rock: violet strata with ice between them, a frost lip, crystals in the deep */
const COMET_ROCK: RockPalette = { soil: '#2e2a52', rock: ['#3b3670', '#2a2650', '#4a4486', '#24204a', '#5a5296', '#8fd8ff'], moss: '#bfe6ff', dark: '#120f2a', root: '#7fdcff' };

const dev = devParams();
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** a shower of shooting stars on some days (seeded by the date, like the weather) */
function showerToday() {
  const d = new Date();
  const n = Math.sin((d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate()) * 12.9898) * 43758.5453;
  return n - Math.floor(n) < 0.2;
}

const TELESCOPE_LINES: [string, string][][] = [
  [
    ['CAPTION', 'EL TELESCOPIO. Latón, polvo de estrellas y una etiqueta: «PROPIEDAD DEL TALLER. SI LO ROMPES, LO PAGAS EN COMBUSTIBLE».'],
    ['LUZTERNA', 'Capi, desde aquí se ve TODO. El Primer Mar, las islas, tu isla… Se ve chiquita. Y desordenada. Muy tuya.'],
  ],
  [
    ['CAPTION', 'Apuntas al planeta de los anillos. Uno de los anillos parece guiñarte. Seguramente es un reflejo.'],
    ['LUZTERNA', 'Seguramente. Yo no le devolvería el guiño, por si acaso.'],
  ],
  [
    ['CAPTION', 'Hay una constelación con forma de gato estirándose. No estaba en ningún mapa. Ahora está en este.'],
    ['LUZTERNA', 'Hasta las estrellas se suben a donde no deben. Es contagioso.'],
  ],
  [
    ['CAPTION', 'Esperas una estrella fugaz para pedir un deseo. Pasan tres. Canelo ya pidió las tres: «comida», «más comida» y «la comida de ellos».'],
  ],
];

const LAUNCH_LINES = ['¡Despegue! (y aterrizaje, más o menos)', 'Volvió. Le faltan dos tornillos. Nadie los extraña.', 'Récord: 4 segundos sin explotar.', 'El paracaídas es la mejor parte. Que no se entere el cohete.'];

export const region: RegionDef = {
  id: 'cometa',
  name: 'Puerto Cometa',
  subtitle: 'Donde los barcos aprenden a ser naves.',
  half: HALF,
  height,
  paint,
  walkable,
  skyKeys: SKY,
  rupture: 0.6,
  fog: { near: 150, far: 620 },
  hour: dev.hour,
  // up here there is no rain (no air to rain from): the sky's mood is the shooting stars
  weather: dev.weather ?? 'despejado',
  camera: { target: [2, 6, -4], yaw: 0.22, pitch: 0.36, dist: 96, minDist: 8, maxDist: 150, bound: 64 },
  arrival: ARRIVAL,
  battleSpot: [PLAZA.x, Y + 5.6, PLAZA.z],
  async build(ctx) {
    const w = ctx.world;
    const rng = ctx.rng;
    const bin = new Bin();
    const uNight = { value: 0 };
    const uNeon = { value: 0 };
    const uTime = { value: 0 };
    const root = new THREE.Group();
    root.name = 'cometa';
    noSwimming(w);
    await fontsReady();

    // ── the sky: our own astral vault replaces the dome (hidden; World3D disposes it) ──
    w.sky.mesh.visible = false;
    const astral = new AstralSky(bin);
    astral.u.uMeteors.value = showerToday() ? 0.95 : 0.3;
    root.add(astral.mesh);
    // the cloud floor far below, a few towering clouds down there, cosmic currents around the rock
    const puffs: Puff[] = [];
    for (let i = 0; i < 14; i++) {
      const a = rng() * Math.PI * 2;
      const r = 160 + rng() * 260;
      cluster(puffs, rng, Math.cos(a) * r, SEA_Y + 6, Math.sin(a) * r, 26 + rng() * 34, 6, 0.85);
    }
    const streams: Stream[] = [];
    for (let i = 0; i < 4; i++) streams.push(arcStream(0, -2, 56 + i * 7, -4 + i * 6, i * 1.6, i * 1.6 + 2.2, rng, 0.3, 0.6 + rng() * 0.4));
    const sky = skyLayer(w, bin, {
      cut: CUT,
      seaY: SEA_Y,
      depth: 900,
      gap: 0.3,
      drift: [0.6, 0.2],
      palette: { lit: '#7464bc', shade: '#1e1a56', litNight: '#262466', shadeNight: '#0b0a28', rim: '#ff8ad0' },
      puffs,
      streams,
      windColor: '#c9b6ff',
    });
    root.add(sky.group);

    // ── the rock's underside: violet strata, frost, crystals hanging in the deep ──
    const RM = new Mesher(true);
    const und = mainUnderside(RM, height, { cut: CUT, rMax: 64, depth: 36, seed: 11, pal: COMET_ROCK, grass: '#8fb4e6', tip: [6, -4], belly: 0.16, jag: 0.16, rings: 12, inset: 1.4 });
    for (let i = 0; i < 26; i++) {
      const p = und.surf[Math.floor(rng() * und.surf.length)];
      if (!p || p.y > CUT - 3) continue;
      const h = 1.6 + rng() * 3.8;
      const g = new THREE.CylinderGeometry(0.5 + rng() * 0.6, 0, h, 5);
      RM.add(g, rng() < 0.35 ? '#ff9ad6' : '#9feeff', mat(p.x, p.y - h / 2 + 0.3, p.z, (rng() - 0.5) * 0.4, rng() * 3, (rng() - 0.5) * 0.4), 0, 1);
    }
    // icicle «roots» of frozen gas from the rim
    for (let i = 0; i < 18; i++) {
      const p = und.surf[Math.floor(rng() * und.surf.length)];
      if (!p) continue;
      const L = 3 + rng() * 6;
      tube(RM, [p.clone(), p.clone().add(new THREE.Vector3(0, -L * 0.5, 0)), p.clone().add(new THREE.Vector3(rng() - 0.5, -L, rng() - 0.5))], 0.35, 0.02, '#bfefff', 0.0, 5);
    }
    const under = new THREE.Mesh(bin.add(RM.build()), skyToon(bin, { uNight, key: 'com-rock', bright: 0.06 }));
    under.receiveShadow = true;
    root.add(under);
    const ground = w.terrain.material;
    ground.emissive.set('#1a1430');

    // ── the yard ──
    const port = metalToon(bin, { uNight, uNeon, key: 'port', bright: 0.1 });
    const PM = new Mesher(true);
    const A = buildPort(PM, rng);
    const portMesh = new THREE.Mesh(bin.add(PM.build()), port);
    portMesh.castShadow = true;
    portMesh.receiveShadow = true;
    portMesh.name = 'cometa-port';
    root.add(portMesh);
    const neon = neonSigns(bin, A.signs, uNeon, uTime);
    root.add(neon);

    // moving parts
    const cranes = CRANES.map((c, i) => {
      const cr = craneTop(bin, port, new THREE.Vector3(c.x, height(c.x, c.z) + c.h, c.z), c.jib, i === 0 ? 'fin' : 'crate', i === 0 ? -0.6 : 2.4);
      root.add(cr.group);
      return cr;
    });
    const scope = telescope(bin, port, A.telePivot);
    root.add(scope.group);
    const dish = radar(bin, port, A.radar);
    root.add(dish);
    const bowl = fishbowl(bin, 1.15, uNight);
    bowl.position.copy(A.helmetTop).add(new THREE.Vector3(0, -0.9, 0));
    root.add(bowl);
    const shield = shieldDome(bin, uTime, uNight);
    root.add(shield);
    const tubes = fuelTubes(bin, A.fuelRuns, uTime, uNeon);
    root.add(tubes);
    root.add(veins(bin, rng, uTime, uNeon));
    const rocks = debris(bin, rng, uNight, uNeon, COMET_ROCK);
    rocks.material = skyToon(bin, { uNight, key: 'com-rock', bright: 0.06 });
    root.add(rocks);
    // REGISTRO 000's rock
    const perchM = new Mesher(true);
    perchM.add(new THREE.DodecahedronGeometry(1.8, 0).scale(1.3, 0.7, 1.1), '#3b3670', mat(0, -0.9, 0), 0);
    perchM.add(new THREE.ConeGeometry(0.4, 1.4, 5), '#9feeff', mat(0.6, -2.2, 0.3, Math.PI, 0, 0), 0, 1);
    const perch = new THREE.Mesh(bin.add(perchM.build()), skyToon(bin, { uNight, key: 'com-rock', bright: 0.06 }));
    root.add(perch);

    // the comet's tails, the coma, the stream of dust they shed
    const tailStart = new THREE.Vector3(-34, 3, -10);
    const tailDir = new THREE.Vector3(-1, 0.14, -0.42).normalize();
    const tail = new CometTail(bin, { start: tailStart, dir: tailDir });
    root.add(tail.mesh);
    const stream = new ParticlePool(1600, { additive: true, wobble: 0.5, shape: 'star' });
    root.add(stream.points);
    // things that float UP (low gravity): dust, fuel motes, ice glitter
    const floaty = new ParticlePool(900, { additive: false, gravity: -0.35, wobble: 0.4 });
    root.add(floaty.points);
    const glitter = new ParticlePool(700, { additive: true, gravity: -0.25, wobble: 0.6, shape: 'star' });
    root.add(glitter.points);
    // welding sparks: they DO fall, slowly (low gravity), as streaks
    const sparks = new ParticlePool(900, { additive: true, gravity: 3.2, wobble: 0.05, shape: 'streak' });
    root.add(sparks.points);
    const halos = new Halos(bin, 110);
    root.add(halos.mesh);

    // your ship, moored at the clamp, in its astral look
    const boat = astralShip(bin, uNight, uNeon);
    boat.group.position.set(SHIP.x, SHIP.y, SHIP.z);
    boat.group.rotation.y = SHIP.ry;
    boat.group.scale.setScalar(1.2);
    root.add(boat.group);

    // the test rocket on the rail (and its parachute)
    const rk = rocket(bin, uNight, uNeon);
    root.add(rk.group);
    const chuteM = new Mesher(false);
    chuteM.add(new THREE.SphereGeometry(2.4, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), (p, out) => void out.set(Math.floor(((Math.atan2(p.z, p.x) + Math.PI) / (Math.PI * 2)) * 10) & 1 ? P.coral : P.cream), mat(0, 0, 0), 0.1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const top = new THREE.Vector3(Math.cos(a) * 2.2, 0.9, Math.sin(a) * 2.2);
      const bot = new THREE.Vector3(0, -3.2, 0);
      const c = new THREE.CylinderGeometry(0.02, 0.02, top.distanceTo(bot), 3);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
      chuteM.add(c, P.cream2, new THREE.Matrix4().compose(top.clone().add(bot).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
    }
    const chute = new THREE.Mesh(bin.add(chuteM.build()), metalToon(bin, { uNight, uNeon, key: 'chute', bright: 0.12 }));
    chute.visible = false;
    root.add(chute);
    const railCurve = new THREE.CatmullRomCurve3(RAIL_PTS.map(([x, y, z]) => new THREE.Vector3(x, y + 0.9, z)));
    const parkRocket = () => {
      const p = railCurve.getPointAt(0.02);
      const tg = railCurve.getTangentAt(0.02);
      rk.group.position.copy(p);
      rk.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg);
      rk.flame.visible = false;
      rk.flameU.uK.value = 0;
      chute.visible = false;
    };
    parkRocket();

    // ── residents ──
    const town = await residents(ctx, A.counter);
    const helmet = fishbowl(bin, (town.owner?.height ?? 2.5) * 0.36, uNight);
    helmet.position.copy(town.ownerHead).add(new THREE.Vector3(0, -(town.owner?.height ?? 2.5) * 0.3, 0));
    root.add(helmet);
    const collarM = new Mesher(false);
    collarM.add(new THREE.TorusGeometry((town.owner?.height ?? 2.5) * 0.3, 0.09, 8, 24), P.chrome, mat(0, 0, 0, Math.PI / 2, 0, 0), 0.9);
    const collar = new THREE.Mesh(bin.add(collarM.build()), port);
    collar.position.copy(helmet.position).add(new THREE.Vector3(0, 0.05, 0));
    root.add(collar);
    const resOf = (c: unknown) => [...w.residents.values()].find((r) => r.cat === c);
    const gravity = lowGravity(
      w,
      (c) => !resOf(c)?.agent,
      (p, big) => floaty.emit({ pos: { x: p.x, y: p.y + 0.15, z: p.z }, spread: { x: 0.5, y: 0.05, z: 0.5 }, vel: { x: 0, y: big ? 0.9 : 0.5, z: 0 }, velJitter: { x: 0.9, y: 0.3, z: 0.9 }, life: big ? 3.2 : 2.2, size: big ? 0.55 : 0.4, color: '#c9c2ee', color2: '#8d86c4', count: big ? 14 : 5 }),
    );

    // ── light for the cats ──
    const heartLight: LocalLight = { pos: A.heart.clone(), color: new THREE.Color('#8ff1ff'), range: 14, intensity: 0 };
    const tallerLight: LocalLight = { pos: A.windows[0].clone(), color: new THREE.Color('#ffd88a'), range: 10, intensity: 0 };
    const counterLight: LocalLight = { pos: A.counter.clone().add(new THREE.Vector3(0, 2.5, 1.5)), color: new THREE.Color('#ff9ad6'), range: 6, intensity: 0 };
    const tankLight: LocalLight = { pos: A.tank.clone().add(new THREE.Vector3(0, -3, 5)), color: new THREE.Color('#ff5ce1'), range: 12, intensity: 0 };
    const floodLights: LocalLight[] = A.floods.map((p) => ({ pos: p.clone().add(new THREE.Vector3(0, -3, 0)), color: new THREE.Color('#fff2d6'), range: 13, intensity: 0 }));
    const lampLights: LocalLight[] = A.lamps.map((p) => ({ pos: p, color: new THREE.Color('#ffd88a'), range: 7, intensity: 0 }));
    const rocketLight: LocalLight = { pos: new THREE.Vector3(), color: new THREE.Color('#ff7ae6'), range: 16, intensity: 0 };
    const nearLights: LocalLight[] = [heartLight, tallerLight, counterLight, tankLight, rocketLight, boat.lantern];
    const fixedN = nearLights.length;

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

    const openTaller = async () => {
      if (busy) return;
      ctx.feature('taller_cometa');
      const first = !ctx.has('cometa_taller');
      ctx.flag('cometa_taller');
      w.rig.follow = null;
      w.rig.focus(A.counter.clone().add(new THREE.Vector3(-2, 2.2, 2)), 16, 0.22, 0.25);
      town.owner?.brain.emote('happy');
      sfx('purr');
      // the Oleada 3 shop (state/sys/rupturasO3.ts) when it exists; until then the owner talks
      let open: (() => unknown) | null = null;
      try {
        const m = (await import('../state/sys/rupturasO3')) as unknown as Record<string, unknown>;
        const fn = m.openTallerCometa ?? m.openTaller ?? m.openCometaShop;
        if (typeof fn === 'function') open = fn as () => unknown;
      } catch {
        open = null;
      }
      if (!alive) return;
      if (open) {
        busy = true;
        try {
          await open();
        } finally {
          busy = false;
        }
        return;
      }
      await say([
        ['CAPTION', 'TALLER DEL CASCO DE PECERA. El dueño te mira a través de su pecera. La pecera se empaña tantito: está emocionado. O es el aliento.'],
        ['CAPTION', '«¡Bienvenido! Aquí los barcos aprenden a ser naves. Se paga en Combustible Astral. ¿Doblones? Ay, qué tierno.»'],
        ['CAPTION', '«Hoy estamos cerrados por inventario. El inventario soy yo. Vuelva pronto: la órbita está incluida.»'],
        first ? ['LUZTERNA', 'Capi, el señor lleva una pecera en la cabeza. Sin pez. ¿Le preguntamos o seguimos fingiendo que es normal?'] : ['LUZTERNA', 'Sigue cerrado. Sigue con la pecera. Ya me cae bien.'],
      ]);
    };

    let lookN = 0;
    const lookTelescope = async () => {
      if (busy) return;
      ctx.feature('telescopio_cometa');
      const first = !ctx.has('cometa_telescopio');
      ctx.flag('cometa_telescopio');
      const lines = first ? TELESCOPE_LINES[0] : TELESCOPE_LINES[1 + (lookN++ % (TELESCOPE_LINES.length - 1))];
      // the telescope swings to the giant planet and the camera looks where it looks
      scope.aimAt(Math.atan2(PLANET_DIR.x, PLANET_DIR.z) + Math.PI, 0.5);
      w.rig.follow = null;
      w.rig.focus(A.telePivot.clone().add(new THREE.Vector3(0, 6, 0)), 30, 0.14, Math.atan2(-PLANET_DIR.x, -PLANET_DIR.z));
      sfx('whoosh');
      await say(lines);
      scope.aimAt(null);
    };

    // the launch: countdown → rail → an arc over the island → fireworks → parachute → back on the sled
    type Phase = 'idle' | 'count' | 'rail' | 'fly' | 'chute' | 'landed';
    let phase: Phase = 'idle';
    let pt = 0;
    const exitP = railCurve.getPointAt(1);
    const land = new THREE.Vector3(27, Y + 0.9, 5);
    const flight = new THREE.CatmullRomCurve3([
      exitP.clone(),
      exitP.clone().add(new THREE.Vector3(-12, 16, -4)),
      new THREE.Vector3(-34, 44, -14),
      new THREE.Vector3(-4, 58, -10),
      new THREE.Vector3(22, 46, 2),
    ]);
    const FLY_T = 4.2;
    const CHUTE_T = 4.0;
    const chuteFrom = new THREE.Vector3();
    const rocketPos = new THREE.Vector3();
    let lastTick = -1;
    const launch = () => {
      if (busy || phase !== 'idle') return;
      busy = true;
      phase = 'count';
      pt = 0;
      lastTick = -1;
      ctx.feature('lanzamiento_cometa');
      w.rig.follow = null;
      w.rig.focus(rk.group.position.clone().add(new THREE.Vector3(-6, 4, 0)), 34, 0.28, -0.9);
    };
    const landed = async () => {
      phase = 'landed';
      w.rig.follow = null;
      sfx('pop');
      floaty.emit({ pos: land, spread: { x: 1.2, y: 0.1, z: 1.2 }, vel: { x: 0, y: 1.2, z: 0 }, velJitter: { x: 1.5, y: 0.5, z: 1.5 }, life: 3, size: 0.8, color: '#d8d2f4', color2: '#8d86c4', count: 30 });
      const first = !rewardClaimed('cometa:lanzamiento');
      if (first) {
        claimReward('cometa:lanzamiento');
        ctx.flag('cometa_lanzamiento');
        const gold = Math.round(Math.max(200, G.goldPerSec * 60));
        G.add('gold', gold, 'cometa');
        G.save();
        sfx('coin');
        ctx.floatText(land.clone().add(new THREE.Vector3(0, 3, 0)), `+${gold.toLocaleString('es-MX')} oro`);
        audioApi.stinger('discovery_sol', { gain: 0.7 }); // G minor: LIKY's key (recipe fallback: discovery)
        await say([
          ['CAPTION', 'El cohete de prueba aterriza en el patio. Con paracaídas, de pie y casi entero. El taller lo anota como «vuelo exitoso» y te paga por haberlo visto.'],
          ['LUZTERNA', '¡Nos pagaron por mirar, Capi! Aquí arriba hasta la gravedad trabaja a medio tiempo.'],
        ]);
      } else {
        const n = (G.s.counters.feature_lanzamiento_cometa ?? 0) as number;
        ctx.floatText(land.clone().add(new THREE.Vector3(0, 3, 0)), LAUNCH_LINES[n % LAUNCH_LINES.length]);
        await new Promise((r) => setTimeout(r, 1600));
      }
      if (!alive) return;
      // back to the sled (somebody wheels it over: nobody asks how)
      floaty.emit({ pos: rk.group.position, spread: { x: 1, y: 1, z: 1 }, vel: { x: 0, y: 0.8, z: 0 }, velJitter: { x: 1, y: 0.5, z: 1 }, life: 2, size: 0.9, color: '#ffffff', color2: '#c9c2ee', count: 20 });
      parkRocket();
      phase = 'idle';
      busy = false;
    };

    // taps on things that are not residents: the counter, the rocket, the telescope
    const prevClick = w.rig.onClick;
    w.rig.onClick = (x, y) => {
      if (busy) return prevClick?.(x, y);
      const hit = w.pickResident(x, y);
      if (!hit) {
        const near = (p: THREE.Vector3, r: number) => {
          const s = w.project(p);
          return !!s && Math.hypot(s.x - x, s.y - y) < r;
        };
        if (near(rk.group.position.clone().add(new THREE.Vector3(0, 2, 0)), 46)) return void launch();
        if (near(A.telePivot.clone().add(new THREE.Vector3(0, 2.5, 0)), 46)) return void lookTelescope();
      }
      prevClick?.(x, y);
    };

    // ── every frame ──
    let tailT = 0;
    let moteT = 0;
    let weldT = 0;
    let weldAt = -1;
    let weldFlash = 0;
    let flareT = 0;
    let pickT = 0;
    const camT = w.rig.cur.target;
    const tmp = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();
    const sails = boat.sails.uniforms;
    w.addProp({
      group: root,
      lights: nearLights,
      update(dt, t, night) {
        uTime.value = t;
        uNight.value = night;
        // the neon is always on (it is always a little night up here), stronger after dark
        uNeon.value = 0.25 + night * 0.75;
        ground.emissiveIntensity = 0.6 + night * 0.6;
        const s = w.cycle.s;
        astral.update(s, t);
        sky.update(t);
        tail.update(t, night);
        stream.budget = w.pools.motes.budget;
        floaty.budget = w.pools.motes.budget;
        glitter.budget = w.pools.motes.budget;
        sparks.budget = w.pools.sparks.budget;
        const vh = w.renderer.domElement.height;
        stream.update(dt, vh);
        floaty.update(dt, vh);
        glitter.update(dt, vh);
        sparks.update(dt, vh);
        gravity.update();
        halos.begin();

        // the tail sheds a stream of glowing dust off the north rim
        tailT -= dt;
        while (tailT <= 0) {
          tailT += 0.05;
          const a = Math.PI * (0.7 + Math.random() * 0.65);
          const r = 28 + Math.random() * 9;
          const sp = 7 + Math.random() * 9;
          stream.emit({
            pos: { x: Math.cos(a) * r * 1.2, y: 1 + Math.random() * 8, z: Math.sin(a) * r * 0.85 - 4 },
            spread: { x: 2, y: 2, z: 2 },
            vel: { x: tailDir.x * sp, y: tailDir.y * sp, z: tailDir.z * sp },
            velJitter: { x: 1.2, y: 0.8, z: 1.2 },
            life: 9 + Math.random() * 6,
            size: 0.5 + Math.random() * 0.7,
            color: Math.random() < 0.5 ? '#bff6ff' : '#ffc6ec',
            color2: '#6a4cff',
            count: 2,
          });
        }
        // the coma: a soft glow wrapped around the comet's back
        halos.add(tmp.set(-40, 5, -12), 64, '#9ad8ff', 0.1 + night * 0.08);
        halos.add(tmp.set(-80, 12, -30), 120, '#d79aff', 0.07 + night * 0.06);
        // motes off the heart, fuel motes off the refinery, ice glitter on the crest (all drift UP)
        moteT -= dt;
        if (moteT <= 0) {
          moteT = 0.12;
          const c = A.crystals[Math.floor(Math.random() * A.crystals.length)];
          if (c) glitter.emit({ pos: c, spread: { x: 0.6, y: 0.6, z: 0.6 }, vel: { x: 0, y: 0.5, z: 0 }, velJitter: { x: 0.3, y: 0.2, z: 0.3 }, life: 4, size: 0.32, color: Math.random() < 0.5 ? '#bff6ff' : '#ffb2ea', color2: '#7a5cff', count: 1 });
          glitter.emit({ pos: { x: (Math.random() - 0.5) * 70, y: Y + 4 + Math.random() * 4, z: -14 - Math.random() * 16 }, spread: { x: 2, y: 1, z: 2 }, vel: { x: 0, y: 0.3, z: 0 }, life: 5, size: 0.25, color: '#e8fbff', color2: '#9ad8ff', count: 1 });
          if (Math.random() < 0.5) floaty.emit({ pos: tmp.copy(A.tank).add(tmp2.set((Math.random() - 0.5) * 6, -4, 4.5)), vel: { x: 0, y: 0.35, z: 0 }, velJitter: { x: 0.2, y: 0.1, z: 0.2 }, life: 4, size: 0.3, color: '#ff8ae8', color2: '#a35bff', count: 1 });
        }
        // the refinery's flare: a little violet flame on top of the column
        flareT -= dt;
        if (flareT <= 0) {
          flareT = 0.06;
          glitter.emit({ pos: A.flare, spread: { x: 0.15, y: 0.05, z: 0.15 }, vel: { x: 0.2, y: 2.2, z: 0 }, velJitter: { x: 0.3, y: 0.5, z: 0.3 }, life: 0.9, size: 0.7, color: '#ffe0ff', color2: '#a35bff', count: 2 });
        }
        halos.add(A.flare, 3.2, '#ff7ae6', 0.35 + night * 0.4);
        // welders at work: a burst of sparks and a white-blue flash, now here, now there
        weldT -= dt;
        if (weldT <= 0) {
          weldT = 0.35 + Math.random() * 0.9;
          weldAt = Math.floor(Math.random() * A.weld.length);
          weldFlash = 0.25;
          const p = A.weld[weldAt];
          sparks.emit({ pos: p, vel: { x: 0, y: 1.5, z: 0 }, velJitter: { x: 3, y: 2.5, z: 3 }, life: 1.4, size: 0.22, color: '#fff7c0', color2: '#ff9a3c', count: 18 });
        }
        if (weldFlash > 0 && weldAt >= 0) {
          weldFlash -= dt;
          const fl = Math.random() * 0.6 + 0.4;
          halos.add(A.weld[weldAt], 3.6, '#cfe6ff', fl * (0.5 + night * 0.4));
        }
        // the heart and its shield
        halos.add(A.heart, 9, '#8ff1ff', 0.25 + night * 0.35 + Math.sin(t * 1.7) * 0.05);
        heartLight.intensity = 0.5 + night * 0.9;
        // beacons blink (red, out of step), lamps and floods at night, the ship's thrusters idle
        A.beacons.forEach((b, i) => {
          const on = Math.sin(t * 2.4 + i * 1.7) > 0.55;
          if (on) halos.add(b, 1.8, '#ff3b3b', 0.6 + night * 0.4);
        });
        for (const cr of cranes) if (Math.sin(t * 2.4 + 3) > 0.55) halos.add(cr.tip(), 1.8, '#ff3b3b', 0.6 + night * 0.4);
        for (const p of A.lamps) halos.add(p, 1.7, '#ffc070', 0.05 + night * 0.28);
        for (const p of A.floods) halos.add(p, 3.2, '#ffe6b0', 0.05 + night * 0.24);
        for (const p of A.bells) halos.add(p, 2.6, '#ff5ce1', 0.18 + night * 0.4);
        for (const p of A.windows) halos.add(p, 2.4, '#ffc070', night * 0.22);
        tallerLight.intensity = 0.2 + night * 0.8;
        counterLight.intensity = 0.3 + night * 0.7;
        tankLight.intensity = 0.2 + night * 0.7;
        for (const l of floodLights) l.intensity = 0.15 + night * 0.85;
        for (const l of lampLights) l.intensity = night * 0.9;
        pickT -= dt;
        if (pickT <= 0) {
          pickT = 0.5;
          nearLights.length = fixedN;
          const near = (l: LocalLight) => Math.abs(l.pos.x - camT.x) < 34 && Math.abs(l.pos.z - camT.z) < 34;
          nearLights.push(...floodLights.filter(near));
          if (night > 0.05) nearLights.push(...lampLights.filter(near).slice(0, 8));
        }
        // moving machinery
        for (const cr of cranes) cr.update(t);
        scope.update(t, dt);
        dish.rotation.y = t * 0.6;
        rocks.rotation.y = t * 0.012;
        perch.position.set(town.registro?.root.position.x ?? -49, (town.registro?.root.position.y ?? 7.2), town.registro?.root.position.z ?? -40);
        bowl.rotation.y = t * 0.3;
        // your ship floats at the clamp; thrusters idle
        boat.group.position.y = SHIP.y + Math.sin(t * 0.7) * 0.25;
        boat.group.rotation.z = Math.sin(t * 0.5) * 0.02;
        sails.uTime.value = t;
        (sails.uGrade.value as THREE.Color).copy(paperLighting.grade);
        boat.lantern.pos.set(SHIP.x, boat.group.position.y + 1.8, SHIP.z - 3.6);
        boat.lantern.intensity = 0.15 + night * 0.9;
        for (const e of boat.exhaust) {
          tmp.copy(e).applyMatrix4(boat.group.matrixWorld);
          halos.add(tmp, 1.6 + Math.sin(t * 9 + e.x) * 0.15, '#ff5ce1', 0.35 + night * 0.35);
        }

        // ── the launch ──
        rk.flameU.uTime.value = t;
        if (phase === 'count') {
          pt += dt;
          const k = Math.floor(pt / 0.8);
          if (k !== lastTick && k < 3) {
            lastTick = k;
            sfx('tick');
            ctx.floatText(rk.group.position.clone().add(new THREE.Vector3(0, 6, 0)), String(3 - k));
          }
          for (let i = 0; i < 3; i++) if (k >= i) halos.add(A.countdown[i], 1.6, i === 2 ? '#5bff8a' : i === 1 ? '#ffd23f' : '#ff3b3b', 1);
          rk.flame.visible = pt > 1.6;
          rk.flameU.uK.value = Math.max(0, (pt - 1.6) / 0.8) * 0.6;
          if (pt > 1.6) w.pools.smoke.emit({ pos: tmp.copy(rk.group.position), spread: { x: 0.6, y: 0.2, z: 0.6 }, vel: { x: 1.5, y: 0.6, z: 0 }, velJitter: { x: 1, y: 0.4, z: 1 }, life: 2.4, size: 2.2, color: '#ffffff', color2: '#d8d2f4', count: 1 });
          if (pt >= 2.4) {
            phase = 'rail';
            pt = 0;
            sfx('whoosh');
            sfx('charge');
            w.rig.shake(0.3);
            w.rig.follow = () => rocketPos;
            w.rig.focus(rk.group.position.clone(), 46, 0.25, -0.6);
          }
        } else if (phase === 'rail') {
          pt += dt;
          // accelerate along the rail
          const u = Math.min(1, (pt * pt) / (1.25 * 1.25));
          railCurve.getPointAt(u, rk.group.position);
          rk.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), railCurve.getTangentAt(u, tmp));
          rk.flameU.uK.value = 1;
          rocketPos.copy(rk.group.position);
          sparks.emit({ pos: rk.group.position, vel: { x: 3, y: -0.5, z: 0 }, velJitter: { x: 2, y: 1.5, z: 2 }, life: 0.8, size: 0.2, color: '#fff2c0', color2: '#ff7ae6', count: 4 });
          if (u >= 1) {
            phase = 'fly';
            pt = 0;
          }
        } else if (phase === 'fly') {
          pt += dt;
          const u = Math.min(1, pt / FLY_T);
          const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          const k = 0.35 * u + 0.65 * e;
          flight.getPointAt(k, rk.group.position);
          rk.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), flight.getTangentAt(k, tmp));
          rocketPos.copy(rk.group.position);
          rk.flameU.uK.value = 1 - u * 0.3;
          glitter.emit({ pos: tmp.copy(rk.group.position).addScaledVector(flight.getTangentAt(k, tmp2), -2.2), spread: { x: 0.3, y: 0.3, z: 0.3 }, vel: { x: 0, y: 0, z: 0 }, velJitter: { x: 0.5, y: 0.5, z: 0.5 }, life: 1.6, size: 0.9, color: '#ffe0ff', color2: '#7a5cff', count: 3 });
          if (u >= 1) {
            // fireworks at the top, then the chute pops
            phase = 'chute';
            pt = 0;
            sfx('boom');
            w.rig.shake(0.15);
            for (const col of ['#ff3d8b', '#4ff2ff', '#ffd23f']) sparks.emit({ pos: rk.group.position, velJitter: { x: 9, y: 9, z: 9 }, life: 2.2, size: 0.45, color: '#ffffff', color2: col, count: 40 });
            chuteFrom.copy(rk.group.position);
            rk.flame.visible = false;
            rk.flameU.uK.value = 0;
            chute.visible = true;
            sfx('pop');
          }
        } else if (phase === 'chute') {
          pt += dt;
          const u = Math.min(1, pt / CHUTE_T);
          rk.group.position.lerpVectors(chuteFrom, land, 1 - Math.pow(1 - u, 1.6));
          rk.group.position.x += Math.sin(pt * 1.6) * 0.8 * (1 - u);
          // swing upright under the canopy
          rk.group.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(pt * 2) * 0.12 * (1 - u), 0, Math.sin(pt * 1.6) * 0.1 * (1 - u))), Math.min(1, dt * 3));
          chute.position.copy(rk.group.position).add(new THREE.Vector3(0, 8.6, 0));
          chute.rotation.z = Math.sin(pt * 1.6) * 0.1 * (1 - u);
          rocketPos.copy(rk.group.position);
          if (u >= 1) void landed();
        }
        rocketLight.pos.copy(rk.group.position);
        rocketLight.intensity = rk.flame.visible ? rk.flameU.uK.value * 1.6 : 0;
        if (rk.flame.visible) halos.add(tmp.copy(rk.group.position).add(tmp2.set(0, -1, 0).applyQuaternion(rk.group.quaternion)), 5, '#ff7ae6', rk.flameU.uK.value * 0.9);

        town.update(dt, t, night);
        halos.end();
      },
    });

    // ── points of interest ──
    const pois: POI[] = [
      {
        id: 'taller',
        pos: A.counter.clone().add(new THREE.Vector3(0.6, 6.6, 0.5)),
        label: 'TALLER DEL CASCO DE PECERA',
        kind: 'activity',
        visible: () => !busy && w.camera.position.distanceTo(A.counter) < 95,
        onTap: () => openTaller(),
      },
      {
        id: 'lanzamiento',
        pos: new THREE.Vector3(RAIL_PTS[0][0] - 2.5, Y + 7.5, RAIL_PTS[0][2]),
        label: 'LANZAR COHETE',
        kind: 'activity',
        visible: () => !busy && phase === 'idle' && w.camera.position.distanceTo(rk.group.position) < 90,
        onTap: () => launch(),
      },
      {
        id: 'telescopio',
        pos: A.telePivot.clone().add(new THREE.Vector3(0, 6.2, 0)),
        label: 'TELESCOPIO',
        kind: 'lore',
        visible: () => !busy && w.camera.position.distanceTo(A.telePivot) < 80,
        onTap: () => lookTelescope(),
      },
    ];

    // ── the arrival scene (cine h50_llegada, ui/story/o3Cines.ts): Escafandra hops over to your ship with a wrench and
    //    sticks a COMBUSTIBLE decal on its hull — the decal stays there from then on (H50 done)
    const decalTex = (() => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 112;
      const g = c.getContext('2d')!;
      g.fillStyle = '#171317';
      g.beginPath();
      g.roundRect(6, 10, 244, 96, 18);
      g.fill();
      g.fillStyle = '#ffc94a';
      g.beginPath();
      g.roundRect(0, 0, 244, 96, 18);
      g.fill();
      g.lineWidth = 6;
      g.strokeStyle = '#171317';
      g.stroke();
      g.fillStyle = '#ff2e88';
      g.beginPath();
      g.moveTo(34, 78);
      g.quadraticCurveTo(14, 52, 36, 18);
      g.quadraticCurveTo(40, 40, 52, 42);
      g.quadraticCurveTo(62, 60, 34, 78);
      g.fill();
      g.fillStyle = '#171317';
      g.font = 'bold 30px "Anton", "Bebas Neue", sans-serif';
      g.textBaseline = 'middle';
      g.fillText('COMBUSTIBLE', 66, 50);
      const t = bin.add(new THREE.CanvasTexture(c));
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const decalMat = bin.add(new THREE.MeshBasicMaterial({ map: decalTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    const decals = [1, -1].map((side) => {
      const m = new THREE.Mesh(bin.add(new THREE.PlaneGeometry(1.5, 0.66)), decalMat);
      m.position.set(side * 1.36, 0.42, 0.5);
      m.rotation.set(0, side * Math.PI * 0.5, side * -0.08);
      boat.group.add(m);
      return m;
    });
    let decalForced: boolean | null = null;
    const syncDecal = () => {
      const on = decalForced ?? ctx.missionDone('H50');
      for (const d of decals) d.visible = on;
    };
    syncDecal();
    const ownerHome = town.owner ? town.owner.root.position.clone() : null;
    const clank = (p: THREE.Vector3) => {
      sparks.emit({ pos: p, vel: { x: 0, y: 1.5, z: 0 }, velJitter: { x: 3.5, y: 2.5, z: 3.5 }, life: 1.1, size: 0.3, color: '#fff7c0', color2: '#ff9a3c', count: 26 });
      ctx.floatText(p.clone().add(new THREE.Vector3(0, 2.6, 0)), '¡CLANK!');
    };
    const cineFx: NonNullable<RegionBuild['cine']>['fx'] = (cmd, cctx) => {
      const owner = town.owner;
      const hullAt = new THREE.Vector3(SHIP.x + 1.9, SHIP.y + 1.0, SHIP.z + 0.6);
      switch (cmd.id) {
        case 'cometa:decal':
          decalForced = cmd.on === false ? false : true;
          syncDecal();
          if (cmd.on !== false && !cctx.skipping) {
            floaty.emit({ pos: hullAt, spread: { x: 0.6, y: 0.4, z: 0.6 }, vel: { x: 0, y: 0.8, z: 0 }, velJitter: { x: 1, y: 0.4, z: 1 }, life: 1.8, size: 0.5, color: '#ffe8a0', color2: '#ff2e88', count: 18 });
            sfx('paper');
          }
          return () => {
            decalForced = null;
            syncDecal();
          };
        case 'cometa:hop': {
          // Escafandra jumps from his counter to your ship: a slow, low-gravity arc (it takes its time coming down)
          if (!owner || !ownerHome) return null;
          const to = new THREE.Vector3(SHIP.x + 3.2, Y + 0.2, SHIP.z - 1.2);
          const from = owner.root.position.clone();
          const st = { u: 0 };
          const dur = cctx.reduceMotion ? 0.01 : 2.1;
          owner.brain.emote('happy', 0.9);
          const tw = gsap.to(st, {
            u: 1,
            duration: dur,
            ease: 'none',
            onUpdate: () => {
              const u = st.u;
              owner.root.position.lerpVectors(from, to, u);
              owner.root.position.y += Math.sin(Math.PI * u) * 9;
              owner.ground = lerp(from.y, to.y, u);
            },
            onComplete: () => {
              owner.brain.crouch = 0.35;
              floaty.emit({ pos: to, spread: { x: 0.6, y: 0.05, z: 0.6 }, vel: { x: 0, y: 1, z: 0 }, velJitter: { x: 1.4, y: 0.4, z: 1.4 }, life: 3, size: 0.6, color: '#c9c2ee', color2: '#8d86c4', count: 16 });
              setTimeout(() => (owner.brain.crouch = 0), 200);
            },
          });
          owner.facing = -1;
          return () => {
            tw.kill();
            owner.root.position.copy(ownerHome);
            owner.ground = ownerHome.y;
            owner.facing = -1;
          };
        }
        case 'cometa:clank':
          if (!cctx.skipping) {
            clank(hullAt);
            motif('clank');
            owner?.brain.emote('attack', 0.8);
          }
          return null;
      }
      return undefined;
    };

    audioApi.ambience('night_astral', { fade: 2, level: 0.6 });
    // doc 18 §5.4: Puerto Cometa explores to LIKY FIGHT's «Puerto de fiesta» (a variation; director context explore:cometa)
    audioApi.setState('explore', { fade: 2, context: 'cometa' });

    // dev hooks (headless shots, perf, the activities)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__cometa = {
        ready: true,
        world: w,
        setHour(h: number) {
          region.hour = Math.max(0.01, h);
          w.hour = region.hour;
        },
        launch,
        taller: openTaller,
        telescope: lookTelescope,
        phase: () => phase,
        info: () => ({ calls: w.renderer.info.render.calls, tris: w.renderer.info.render.triangles, fps: Math.round(w.stats.fps), p95: w.stats.pct(95), tier: w.tier, geos: w.renderer.info.memory.geometries, tex: w.renderer.info.memory.textures, cats: w.cats.length }),
        cam(target: [number, number, number], dist: number, pitch: number, yaw: number) {
          w.rig.follow = null;
          w.rig.focus(new THREE.Vector3(...target), dist, pitch, yaw);
          w.rig.cut();
        },
      };
    }
    return {
      pois,
      // what a CINE scene played here may use (regions/cineStage.ts): named camera points and its own flourishes
      cine: {
        points: {
          tail: new THREE.Vector3(-40, 6, -16),
          yard: new THREE.Vector3(PLAZA.x, Y + 2, PLAZA.z),
          ship: new THREE.Vector3(SHIP.x, SHIP.y + 1.6, SHIP.z),
          pier: new THREE.Vector3(PIER.x, PIER.y + 1, PIER.z1),
          counter: A.counter.clone().add(new THREE.Vector3(0, 2, 0)),
        },
        fx: cineFx,
      },
      dispose() {
        alive = false;
        busy = false;
        audioApi.ambience('none', { fade: 1.5 });
        stream.dispose();
        floaty.dispose();
        glitter.dispose();
        sparks.dispose();
        bin.dispose();
        if (import.meta.env.DEV) delete (window as unknown as Record<string, unknown>).__cometa;
      },
    };
  },
};
