/**
 * ARCHIPIÉLAGO DE LOS SUEÑOS (Parte II · Oleada 4 «El Umbral», las fronteras) — guion 13 H58, biblia 05 §4,
 * conceptos 5 y 15. «Las islas cambian según qué gatos duermen en tu isla.»
 *
 * Every cat that sleeps on YOUR island tonight (state/sys/suenosDream.ts, the same reading the H58 battle draws
 * its dream rules from) dreams a floating islet here, curled on a pillow on top of it, and the islet is painted
 * by what it dreams: a cotton-candy volcano for fire, a floating ball of sea for water, giant flowers for nature,
 * a private rain cloud for storm, flying books for magic… Different sleepers, a different archipelago. Bubbles
 * the color of each dream rise from the sleepers; paper lanterns drift up between the islets; a whale with
 * butterfly fins circles the sky, snoring; the moon wears a party hat. Duermevela's galleon — a ship that only
 * exists while somebody dreams it — is sunk to the waist in a cloud bank west of the island, where the H58
 * battle waits. Lens (art bible §7): ACUARELA — pastel washes that bleed, pigment pooling at the edges, paper
 * grain over the whole frame; the dream residents are painted in watercolor too.
 *
 * POIs: the story battle (H58 `umbral_suenos`, RegionScene's generic marker at the galleon) · «La veleta de los
 * sueños» (lore: who dreams tonight and which dream rules are likeliest; counter `feature_veleta_suenos`) ·
 * «La capitana» (after H58) · «La ballena que ronca» (a marker that flies with her).
 * Music: state `explore` + context `suenos` (director.json: `amb.suenos` when it exists, else the arc's bare keys).
 */
import * as THREE from 'three';
import type { POI, RegionDef, RegionBuild } from './types';
import type { SkyKey } from '../engine/world/sky';
import type { LocalLight } from '../engine/world/paperCat';
import type { Placement } from '../engine/world/flora';
import { ParticlePool } from '../engine/fx/particles';
import { G } from '../state/game';
import { sfx } from '../core/audio';
import { audioApi } from '../audio/api';
import { motif } from '../cine/sound';
import { ELEMENT_NAME } from '../data/elementsMeta';
import { dreamCfgFor, likelyDreams } from '../state/sys/rupturasO4Battles';
import { dreamInfo } from '../battle/suenos';
import { dreamElements, dreamLayers } from '../state/sys/suenosDream';
import { Bin } from './paginas/kit';
import { Halos, Mesher, devParams, mat, skyToon } from './cielo/kit';
import { CloudPuffs, cluster, type Puff } from './cielo/clouds';
import { tree } from './cielo/rock';
import { LENS_NOISE, devHook, elLook, lensQuad, quietSay, skyShell } from './fronteras/kit';
import { ARRIVAL, GALLEON, HALF, PLAZA, SHIP, dreamIsles, height, paint, vaneTarget, walkable } from './suenos/layout';
import { Bubbles, dreamIslet, galleon, lanterns, partyMoon, vane, vaneArrow, whale } from './suenos/props';
import { residents } from './suenos/residents';
import { ship } from '../rupturas/props';
import { paperLighting } from '../engine/world/paperCat';

/**
 * Pastel all day (peach dawns, a milky-lilac noon, rose dusks), and nights that never go dark: lilac and
 * periwinkle, because a dream is lit from inside. The cat grade stays warm and light (watercolor paper).
 */
const SKY: SkyKey[] = [
  { h: 0, zenith: '#2a2466', horizon: '#7a68b8', sun: '#b8b4ff', sunI: 0, hemiSky: '#9a92e4', hemiGround: '#5a4a84', hemiI: 0.9, fog: '#6a5ea2', deep: '#46489a', shallow: '#7a8ed0', grade: '#d0c6f4', night: 1 },
  { h: 4.8, zenith: '#30296c', horizon: '#8e72bc', sun: '#b8b4ff', sunI: 0, hemiSky: '#9c92e4', hemiGround: '#5c4a86', hemiI: 0.9, fog: '#7262a6', deep: '#4a4c9c', shallow: '#7e90d0', grade: '#d2c6f4', night: 1 },
  { h: 6.0, zenith: '#8a8ad8', horizon: '#ffc8c0', sun: '#ffc6b0', sunI: 1.15, hemiSky: '#d6c8f2', hemiGround: '#8a6c8a', hemiI: 0.86, fog: '#f2cfd2', deep: '#5a72b8', shallow: '#9ad8d0', grade: '#ffe6ea', night: 0.25 },
  { h: 8.0, zenith: '#9ab2ec', horizon: '#fbe2ea', sun: '#fff2e8', sunI: 1.9, hemiSky: '#e4ddf8', hemiGround: '#a088a8', hemiI: 0.94, fog: '#f4e4ee', deep: '#6a88cc', shallow: '#a6e4d8', grade: '#fff8fa', night: 0 },
  { h: 12.5, zenith: '#a0b6f0', horizon: '#f6e8f4', sun: '#ffffff', sunI: 2.05, hemiSky: '#ece6fc', hemiGround: '#a892b2', hemiI: 0.98, fog: '#f2e8f4', deep: '#6c8cd0', shallow: '#a8e8dc', grade: '#ffffff', night: 0 },
  { h: 16.5, zenith: '#9aa8e8', horizon: '#ffdfe0', sun: '#ffe6d6', sunI: 1.9, hemiSky: '#e6dcf6', hemiGround: '#a68aa0', hemiI: 0.94, fog: '#f8e0e4', deep: '#6680c4', shallow: '#a0dcd4', grade: '#fff2f2', night: 0 },
  { h: 18.3, zenith: '#7a70c8', horizon: '#ffb4bc', sun: '#ffaaa0', sunI: 1.3, hemiSky: '#cdb4ec', hemiGround: '#8a5c84', hemiI: 0.9, fog: '#eab0c4', deep: '#5462ac', shallow: '#8ab8cc', grade: '#ffd8e4', night: 0.15 },
  { h: 19.6, zenith: '#4a3c94', horizon: '#c48ac8', sun: '#d8a0e0', sunI: 0.4, hemiSky: '#ac98e8', hemiGround: '#6a548e', hemiI: 0.9, fog: '#8a6cb4', deep: '#40489c', shallow: '#6c84c0', grade: '#d8c6f4', night: 0.65 },
  { h: 21, zenith: '#2c2568', horizon: '#7c66b6', sun: '#b8b4ff', sunI: 0, hemiSky: '#9a92e4', hemiGround: '#5a4a84', hemiI: 0.9, fog: '#685ca0', deep: '#46489a', shallow: '#7a8ed0', grade: '#d0c6f4', night: 1 },
  { h: 24, zenith: '#2a2466', horizon: '#7a68b8', sun: '#b8b4ff', sunI: 0, hemiSky: '#9a92e4', hemiGround: '#5a4a84', hemiI: 0.9, fog: '#6a5ea2', deep: '#46489a', shallow: '#7a8ed0', grade: '#d0c6f4', night: 1 },
];

/** ACUARELA over the frame: paper grain, wet blooms, pigment pooling in a soft lilac bleed at the edges */
const LENS = /* glsl */ `
  uniform float uTime; uniform float uK; uniform float uAspect; varying vec2 vUv;
  ${LENS_NOISE}
  void main(){
    vec2 p = vUv * vec2(uAspect, 1.0);
    float grain = lvn(p * 420.0) * 0.55 + lvn(p * 160.0) * 0.45;
    float bloom = lfbm(p * 2.6 + vec2(uTime * 0.004, 0.0));
    vec2 c = vUv - 0.5;
    float r = length(c * vec2(1.0, 0.82));
    float edge = smoothstep(0.38, 0.78, r + (bloom - 0.5) * 0.18);
    vec3 f = vec3(1.0);
    f *= 1.0 - (grain - 0.5) * 0.07;
    f *= mix(vec3(1.0), vec3(0.97, 0.95, 1.0), smoothstep(0.45, 0.7, bloom));
    f *= mix(vec3(1.0), vec3(0.8, 0.74, 0.92), edge * 0.55);
    gl_FragColor = vec4(mix(vec3(1.0), f, uK), 1.0);
  }`;

/** the sky's watercolor: washes of peach, lilac and mint drifting across, thinner at night (stars show) */
const SKY_BODY = /* glsl */ `
  float up = clamp(d.y, -0.1, 1.0);
  vec2 q = d.xz / max(0.18, d.y + 0.35) * 1.4 + vec2(uTime * 0.006, uTime * 0.002);
  float n = lfbm(q);
  float n2 = lfbm(q * 1.7 + 9.0);
  vec3 c = mix(vec3(1.0, 0.82, 0.78), vec3(0.8, 0.72, 0.98), smoothstep(0.35, 0.65, n));
  c = mix(c, vec3(0.72, 0.92, 0.86), smoothstep(0.6, 0.78, n2) * 0.6);
  float wash = smoothstep(0.42, 0.7, n) * smoothstep(-0.05, 0.25, up) * (1.0 - smoothstep(0.55, 0.95, up));
  float rim = smoothstep(0.02, 0.0, abs(n - 0.56)) * 0.35;
  float a = (wash * 0.42 + rim * wash) * mix(1.0, 0.35, uNight);
  c = mix(c, c * vec3(0.55, 0.5, 0.85), uNight * 0.8);
  gl_FragColor = vec4(c, a);`;

const dev = devParams();

const VANE_LINES = (who: string[], likely: string[], el: string) => [
  ['CAPTION', `LA VELETA DE LOS SUEÑOS. Gira sola y apunta a lo que más se sueña esta noche: ${ELEMENT_NAME[el] ?? el.toUpperCase()}.`] as [string, string],
  who.length
    ? (['LUZTERNA', `Esta noche sueñan ${who.slice(0, 3).join(', ')}${who.length > 3 ? ' y más' : ''}. Cada isla de allá arriba es el sueño de uno de tus gatos, Capi.`] as [string, string])
    : (['LUZTERNA', 'Esta noche no sueña nadie de los tuyos. Las islas están vacías, como nubes esperando inquilino.'] as [string, string]),
  ['LUZTERNA', `Y si se pelea aquí, el mar sueña reglas: lo más seguro es ${likely.join(', ')}. Cambia quién duerme en tu isla y cambia el sueño.`] as [string, string],
];

const WHALE_LINES: [string, string][][] = [
  [
    ['CAPTION', 'Una ballena con aletas de mariposa pasa ronroneando. No: roncando. Cada ronquido suelta una burbuja del tamaño de una casa.'],
    ['LUZTERNA', 'No la señales, Capi. Es de mala educación señalar a una ballena dormida. Y además vuela.'],
  ],
  [['CAPTION', 'La ballena da otra vuelta al archipiélago. Dicen que es el sueño de un sueño. Ella no opina: está dormida.']],
  [['LUZTERNA', 'Si un día se despierta, ¿se cae? …Mejor no averiguarlo. Nadie haga ruido.']],
];

export const region: RegionDef = {
  id: 'suenos',
  name: 'Archipiélago de los Sueños',
  subtitle: 'Cambia según quién duerma en tu isla.',
  half: HALF,
  height,
  paint,
  walkable,
  skyKeys: SKY,
  rupture: 0.5,
  fog: { near: 120, far: 420 },
  hour: dev.hour,
  // in a dream it never rains for real (storm cats bring their own little cloud)
  weather: dev.weather ?? 'despejado',
  camera: { target: [0, 7, -8], yaw: 0.3, pitch: 0.34, dist: 96, minDist: 8, maxDist: 150, bound: 74 },
  arrival: ARRIVAL,
  battleSpot: [GALLEON.x, 15, GALLEON.z],
  async build(ctx): Promise<RegionBuild> {
    const w = ctx.world;
    const rng = ctx.rng;
    const bin = new Bin();
    const uNight = { value: 0 };
    const root = new THREE.Group();
    root.name = 'suenos';
    const h58Done = ctx.missionDone('H58');
    const isles = dreamIsles(G.s);
    const domEl = dreamElements(G.s, 1)[0] ?? 'cosmic';

    // ── the sky: watercolor washes + the moon in a party hat ──
    const shell = skyShell(bin, SKY_BODY);
    root.add(shell.mesh);
    const moonM = new Mesher(false);
    partyMoon(moonM);
    const moonMat = skyToon(bin, { uNight, key: 'sue-moon', bright: 0.5 });
    moonMat.fog = false;
    const moon = new THREE.Mesh(bin.add(moonM.build()), moonMat);
    moon.position.set(150, 210, -560);
    moon.lookAt(0, 30, 0);
    root.add(moon);
    const lens = lensQuad(bin, LENS);
    root.add(lens.mesh);
    const ground = w.terrain.material;
    ground.emissive.set('#4a3c6a');

    // ── the island: the vane on the plaza, your ship, Duermevela's galleon in its cloud ──
    const toon = skyToon(bin, { uNight, key: 'sue', bright: 0.12 });
    const SM = new Mesher(true);
    const vaneBase = new THREE.Vector3(PLAZA.x, height(PLAZA.x, PLAZA.z), PLAZA.z);
    const vM = new Mesher(true);
    vane(vM);
    const vaneMesh = new THREE.Mesh(bin.add(vM.build()), toon);
    vaneMesh.position.copy(vaneBase);
    vaneMesh.castShadow = true;
    root.add(vaneMesh);
    const aM = new Mesher(true);
    vaneArrow(aM);
    const arrow = new THREE.Mesh(bin.add(aM.build()), toon);
    arrow.position.copy(vaneBase).add(new THREE.Vector3(0, 6.8, 0));
    root.add(arrow);
    // little bridges of stepping-pillows from the beach toward the galleon, and pastel rocks on the shore
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      const x = -20 - k * 8;
      const z = -4 - k * 3;
      SM.add(new THREE.SphereGeometry(1, 10, 6).scale(1.6, 0.4, 1.1), i % 2 ? '#f7e8f0' : '#d8ccf0', mat(x, 0.25 + Math.sin(k * 3) * 0.2, z, 0, k, 0));
    }
    for (let i = 0; i < 14; i++) {
      const a = rng() * Math.PI * 2;
      const d = 22 + rng() * 6;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (Math.hypot(x - ARRIVAL[0], z - ARRIVAL[2]) < 7) continue;
      SM.add(new THREE.DodecahedronGeometry(0.8 + rng() * 1.2, 0).scale(1, 0.7, 1), ['#c8b8e8', '#e8c6d8', '#b8d8d0'][i % 3], mat(x, height(x, z) + 0.2, z, rng(), rng(), rng()));
    }
    // lollipop trees in the dream's pastels, and pillows somebody left on the grass
    for (let i = 0, n = 0; i < 80 && n < 12; i++) {
      const x = (rng() - 0.5) * 44;
      const z = (rng() - 0.5) * 40 - 2;
      const h = height(x, z);
      if (!walkable(x, z) || h < 1.4 || Math.hypot(x - PLAZA.x, z - PLAZA.z) < 7 || Math.hypot(x - ARRIVAL[0], z - ARRIVAL[2]) < 6) continue;
      tree(SM, x, h - 0.1, z, 0.7 + rng() * 0.45, rng, { canopy: ['#ffc8dc', '#d8c8ff', '#bfe9d8', '#ffe2b8'], trunk: '#b49ac0', lumps: 3, glow: 0.25 });
      n++;
    }
    for (let i = 0, n = 0; i < 60 && n < 7; i++) {
      const x = (rng() - 0.5) * 40;
      const z = (rng() - 0.5) * 36;
      const h = height(x, z);
      if (!walkable(x, z) || h < 1.3 || Math.hypot(x - PLAZA.x, z - PLAZA.z) < 6) continue;
      SM.add(new THREE.SphereGeometry(1, 12, 8).scale(1.5, 0.42, 1.05), (v, out) => out.set(Math.floor((v.x + 2) * 2.4) % 2 ? '#fff4f6' : ['#c9b9e8', '#ffd0dc', '#bfe9d8'][n % 3]), mat(x, h + 0.25, z, 0, rng() * 3, (rng() - 0.5) * 0.2));
      n++;
    }
    const shore = new THREE.Mesh(bin.add(SM.build()), toon);
    shore.castShadow = true;
    shore.receiveShadow = true;
    root.add(shore);

    const gM = new Mesher(true);
    const gal = galleon(gM);
    const galleonG = new THREE.Group();
    const galMesh = new THREE.Mesh(bin.add(gM.build()), skyToon(bin, { uNight, key: 'sue-gal', bright: 0.1 }));
    galMesh.castShadow = true;
    galleonG.add(galMesh);
    galleonG.position.set(GALLEON.x, 0.7, GALLEON.z);
    galleonG.scale.setScalar(1.35);
    galleonG.rotation.y = GALLEON.ry;
    galleonG.rotation.z = 0.08;
    root.add(galleonG);
    const deckPos = new THREE.Vector3();
    const deck = () => deckPos.set(0, 1.55, -5.4).applyMatrix4(galleonG.matrixWorld);
    galleonG.updateMatrixWorld();
    const galLantern = new THREE.Vector3();

    const boat = ship();
    boat.group.position.set(SHIP.x, 0.1, SHIP.z);
    boat.group.rotation.y = SHIP.ry;
    boat.group.scale.setScalar(1.2);
    root.add(boat.group);
    boat.lantern.pos.set(SHIP.x, 2.2, SHIP.z);

    // ── the cloud bank (the galleon sinks in it) and the pillow-clouds under every islet ──
    const puffs: Puff[] = [];
    // the bank hugs the galleon's hull up to its waist (along both sides), never over the deck
    const gAx = new THREE.Vector3(-Math.sin(GALLEON.ry), 0, -Math.cos(GALLEON.ry));
    const gSide = new THREE.Vector3(gAx.z, 0, -gAx.x);
    for (let k = -2; k <= 2; k++)
      for (const sd of [-1, 1]) {
        const c = new THREE.Vector3(GALLEON.x, 0, GALLEON.z).addScaledVector(gAx, k * 4.2).addScaledVector(gSide, sd * (5.2 + Math.abs(k) * 0.4));
        cluster(puffs, rng, c.x, -1.4, c.z, 3.8 + rng() * 1.0, 3, 0.4);
      }
    cluster(puffs, rng, GALLEON.x - gAx.x * 13, -0.8, GALLEON.z - gAx.z * 13, 5, 4, 0.4);
    cluster(puffs, rng, GALLEON.x + gAx.x * 13, -0.8, GALLEON.z + gAx.z * 13, 5, 4, 0.4);
    for (const s of isles) cluster(puffs, rng, s.x, s.y - s.r * 1.3, s.z, s.r * 0.9, 4, 0.55);
    for (let i = 0; i < 10; i++) {
      const a = rng() * Math.PI * 2;
      const d = 90 + rng() * 140;
      cluster(puffs, rng, Math.cos(a) * d, 2 + rng() * 6, Math.sin(a) * d, 14 + rng() * 14, 5, 0.55);
    }
    const clouds = new CloudPuffs(bin, puffs);
    root.add(clouds.mesh);

    // ── the dream islets: one per sleeper (each its own mesh: they bob on their own) ──
    const isleMat = skyToon(bin, { uNight, key: 'sue-isle', bright: 0.14 });
    const built = isles.map((s) => {
      const M = new Mesher(true);
      const r = dreamIslet(M, s, rng);
      const mesh = new THREE.Mesh(bin.add(M.build()), isleMat);
      mesh.castShadow = true;
      mesh.position.set(s.x, s.y, s.z);
      mesh.rotation.y = s.seed;
      root.add(mesh);
      // a thought-bubble chain from the bed to a big bubble that shows the dream's color
      return { isle: s, mesh, bed: r.bed, glow: r.glow, base: new THREE.Vector3(s.x, s.y, s.z), dz: 0, bedW: new THREE.Vector3(), glowW: r.glow.map(() => new THREE.Vector3()) };
    });

    // ── the whale, the bubbles, the lanterns, the halos, a pool of petals and notes ──
    const wh = whale(bin, uNight);
    root.add(wh.group);
    const whalePos = new THREE.Vector3();
    const bubbles = new Bubbles(bin, 90);
    root.add(bubbles.mesh);
    const lamps = lanterns(bin, 22, rng, uNight);
    root.add(lamps.mesh);
    const halos = new Halos(bin, 96);
    root.add(halos.mesh);
    const petals = new ParticlePool(500, { additive: false, wobble: 0.8, gravity: 0.5 });
    root.add(petals.points);
    const rain = new ParticlePool(400, { additive: false, gravity: 14, wobble: 0.02, shape: 'streak' });
    root.add(rain.points);

    // flowers and soft grass on the meadow (the engine's flora)
    const flowers: Placement[] = [];
    const grass: Placement[] = [];
    for (let i = 0; i < 500 && (flowers.length < 140 || grass.length < 180); i++) {
      const x = (rng() - 0.5) * 56;
      const z = (rng() - 0.5) * 56;
      const h = height(x, z);
      if (!walkable(x, z) || h < 1.3) continue;
      if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < 5) continue;
      if (flowers.length < 140 && rng() < 0.5) flowers.push({ x, y: h, z, s: 1 + rng() * 0.7, r: rng() * 6.3 });
      else if (grass.length < 180) grass.push({ x, y: h, z, s: 0.8 + rng() * 0.5, r: rng() * 6.3 });
    }
    w.setFlora({ flowers, grass });

    // ── residents ──
    const town = await residents(ctx, isles, deck, h58Done);
    const sleeperOf = new Map(town.sleepers.map((s) => [s.isle, s]));

    // ── lights for the cats ──
    const galLight: LocalLight = { pos: new THREE.Vector3(), color: new THREE.Color('#ffd27a'), range: 10, intensity: 0 };
    const vaneLight: LocalLight = { pos: vaneBase.clone().add(new THREE.Vector3(0, 4, 0)), color: new THREE.Color('#ffd2e6'), range: 9, intensity: 0 };
    const isleLights: LocalLight[] = built.filter((b) => b.isle.who).map((b) => ({ pos: new THREE.Vector3(), color: new THREE.Color(elLook(b.isle.el).glow), range: 7, intensity: 0 }));

    // ── activities ──
    const { st, say } = quietSay(ctx);
    let dreamK = 1;
    const vaneLore = async () => {
      if (st.busy) return;
      ctx.feature('veleta_suenos');
      ctx.flag('suenos_veleta');
      const cfg = dreamCfgFor(G.s);
      const likely = likelyDreams(cfg, 3).map((id) => dreamInfo(id, cfg.el).name.replace(/[¡!]/g, '').toLowerCase());
      w.rig.follow = null;
      w.rig.focus(vaneBase.clone().add(new THREE.Vector3(0, 5, 0)), 22, 0.22, w.rig.goal.yaw);
      motif('arco_pregunta');
      await say(VANE_LINES(cfg.who ?? [], likely, domEl));
    };
    // each of her lines once, across visits (G.s.counters.suenos_ballena_lineas); then she only snores
    const whaleLore = async () => {
      if (st.busy) return;
      ctx.feature('ballena_suenos');
      snore(1.6);
      const n = Math.max(0, Math.floor(Number(G.s.counters.suenos_ballena_lineas ?? 0)) || 0);
      if (n >= WHALE_LINES.length) return;
      G.count('suenos_ballena_lineas');
      await say(WHALE_LINES[n]);
    };
    const capitanaLore = async () => {
      if (st.busy) return;
      town.duermevela?.brain.emote('sleepy', 1);
      await say([
        ['DUERMEVELA', '…¿Otra vez tú? Ganaste limpio. Bueno, ganaste despierto, que aquí es casi trampa.'],
        ['DUERMEVELA', 'Tu Almohadón ronca en tu barco, ¿verdad? Bien. Que alguien duerma tranquilo en esta historia.'],
        ['LUZTERNA', 'Capi, si bosteza otra vez me voy a dormir yo. Y yo ya no duermo. Así de fuerte bosteza.'],
      ]);
    };
    let snoreK = 0;
    const snore = (k = 1) => {
      snoreK = k;
      bubbles.spawn(whalePos.clone().add(new THREE.Vector3(0, 4, 0)), { r: 2.2 * k, up: 1.4, life: 6, color: '#e6dcff', drift: 0.6 });
      w.life.fx.zzz(whalePos.clone().add(new THREE.Vector3(0, 3, 0)));
      sfx('pop');
    };

    // ── every frame ──
    let moteT = 0;
    let bubT = 0;
    let snoreT = 6;
    const tmp = new THREE.Vector3();
    const target = vaneTarget(isles, domEl);
    const vaneYaw = Math.atan2(target.x - vaneBase.x, target.z - vaneBase.z) + Math.PI;
    const sails = boat.sails.uniforms;
    const emitDream = (el: string, p: THREE.Vector3, r: number) => {
      const L = elLook(el);
      switch (el) {
        case 'fire':
          w.pools.embers.emit({ pos: p, spread: { x: 0.5, y: 0.2, z: 0.5 }, vel: { x: 0, y: 1.6, z: 0 }, velJitter: { x: 0.6, y: 0.4, z: 0.6 }, life: 2.2, size: 0.35, color: '#ffd0e0', color2: '#ff8ab8', count: 2 });
          break;
        case 'storm':
          rain.emit({ pos: { x: p.x, y: p.y + 5.6, z: p.z }, spread: { x: 1.8, y: 0.2, z: 1.2 }, vel: { x: 0, y: -2, z: 0 }, life: 0.5, size: 0.35, color: '#e8f0ff', color2: '#a8c0ff', count: 3 });
          break;
        case 'ice':
          w.pools.snow.emit({ pos: { x: p.x, y: p.y + 6, z: p.z }, spread: { x: r * 0.7, y: 0.5, z: r * 0.7 }, vel: { x: 0, y: -0.6, z: 0 }, life: 5, size: 0.3, color: '#ffffff', color2: '#e8f6ff', count: 1 });
          break;
        case 'nature':
          petals.emit({ pos: { x: p.x, y: p.y + 4, z: p.z }, spread: { x: r * 0.6, y: 0.5, z: r * 0.6 }, vel: { x: 0.3, y: 0.2, z: 0 }, life: 6, size: 0.4, color: '#ffb4d0', color2: '#ffffff', count: 1 });
          break;
        case 'sound':
        case 'light':
        case 'crystal':
          w.pools.stars.emit({ pos: { x: p.x, y: p.y + 2, z: p.z }, spread: { x: r * 0.5, y: 1, z: r * 0.5 }, vel: { x: 0, y: 0.6, z: 0 }, life: 2.6, size: 0.45, color: L.light, color2: L.glow, count: 1 });
          break;
        default:
          w.pools.motes.emit({ pos: { x: p.x, y: p.y + 1.5, z: p.z }, spread: { x: r * 0.5, y: 0.6, z: r * 0.5 }, vel: { x: 0, y: 0.5, z: 0 }, life: 3.4, size: 0.32, color: L.light, color2: L.glow, count: 1 });
      }
    };

    w.addProp({
      group: root,
      lights: [galLight, vaneLight, boat.lantern, ...isleLights],
      update(dt, t, night) {
        uNight.value = night;
        shell.u.uTime.value = t;
        shell.u.uNight.value = night;
        lens.update(w, t);
        lens.u.uK.value = dreamK;
        ground.emissiveIntensity = 0.35 + night * 0.55;
        const s = w.cycle.s;
        // clouds take the sky's colors (pastel by day, lilac by night)
        const cu = clouds.u;
        (cu.uLit.value as THREE.Color).set('#fff6fa').lerp(tmpC.set('#d8ccff'), night);
        (cu.uShade.value as THREE.Color).set('#c8b8e8').lerp(tmpC.set('#6a5aa8'), night);
        (cu.uRim.value as THREE.Color).copy(s.horizon);
        (cu.uSunDir.value as THREE.Vector3).copy(night > 0.55 ? s.moonDir : s.sunDir);
        cu.uTime.value = t;
        petals.budget = rain.budget = w.pools.motes.budget;
        const vh = w.renderer.domElement.height;
        petals.update(dt, vh);
        rain.update(dt, vh);
        halos.begin();

        // the islets float and turn very slowly; their sleepers ride them
        for (const b of built) {
          const k = dreamK;
          b.dz = Math.sin(t * 0.35 + b.isle.seed) * 0.9 * k;
          b.mesh.position.set(b.base.x, b.base.y + b.dz, b.base.z);
          b.mesh.rotation.y = b.isle.seed + Math.sin(t * 0.07 + b.isle.seed) * 0.3;
          b.mesh.updateMatrixWorld();
          b.bedW.copy(b.bed).applyMatrix4(b.mesh.matrixWorld);
          b.glow.forEach((g, i) => b.glowW[i].copy(g).applyMatrix4(b.mesh.matrixWorld));
          const sl = sleeperOf.get(b.isle);
          if (sl) {
            sl.cat.root.position.copy(b.bedW);
            sl.cat.ground = b.bedW.y;
          }
          const L = elLook(b.isle.el);
          for (const g of b.glowW) halos.add(g, 3.2, L.glow, 0.12 + night * 0.45);
          if (b.isle.who) halos.add(b.bedW, 4.5, L.light, 0.05 + night * 0.18);
        }
        isleLights.forEach((l, i) => {
          const b = built.filter((x) => x.isle.who)[i];
          if (!b) return;
          l.pos.copy(b.bedW).add(tmp.set(0, 2.5, 0));
          l.intensity = 0.25 + night * 0.8;
        });
        // dream bubbles rise from every sleeper (its dream's color), and from the sea now and then
        bubT -= dt;
        if (bubT <= 0) {
          bubT = 0.7 / Math.max(0.2, dreamK);
          const withWho = built.filter((b) => b.isle.who);
          const b = withWho[Math.floor(Math.random() * withWho.length)];
          if (b) bubbles.spawn(tmp.copy(b.bedW).add(tmpV.set(0, 1.4, 0)), { r: 0.35 + Math.random() * 0.5, up: 0.9, life: 9, color: elLook(b.isle.el).light });
          if (Math.random() < 0.4) {
            const a = Math.random() * Math.PI * 2;
            const d = 30 + Math.random() * 30;
            bubbles.spawn({ x: Math.cos(a) * d, y: 0.4, z: Math.sin(a) * d }, { r: 0.6 + Math.random() * 0.8, up: 1.1, life: 12, color: '#e8e0ff' });
          }
        }
        bubbles.update(dt, t);
        // each dream's weather over its islet
        moteT -= dt;
        if (moteT <= 0) {
          moteT = 0.08;
          const b = built[Math.floor(Math.random() * built.length)];
          if (b?.isle.who) emitDream(b.isle.el, b.glowW[0] ?? b.bedW, b.isle.r);
          if (Math.random() < 0.25) {
            const sl = town.sleepers[Math.floor(Math.random() * town.sleepers.length)];
            if (sl) w.life.fx.zzz(sl.cat.root.position);
          }
        }
        // storm islets: a lightning flicker inside their little cloud
        for (const b of built) if (b.isle.el === 'storm' && b.isle.who && Math.sin(t * 7 + b.isle.seed) > 0.985) halos.add(tmp.copy(b.bedW).add(tmpV.set(0, 6, 0)), 6, '#fff7c0', 0.8);

        // the whale circles the archipelago, high, snoring
        const wa = t * 0.045;
        whalePos.set(Math.cos(wa) * 70, 30 + Math.sin(t * 0.3) * 2.5, Math.sin(wa) * 58 - 10);
        wh.group.position.copy(whalePos);
        wh.group.rotation.y = -wa + Math.PI;
        wh.update(t);
        snoreT -= dt;
        if (snoreT <= 0) {
          snoreT = 7 + Math.random() * 5;
          snore(1);
        }
        snoreK = Math.max(0, snoreK - dt);
        // lanterns
        lamps.update(t);
        for (let i = 0; i < lamps.pts.length; i += 2) halos.add(lamps.pts[i], 2.2, '#ffd8a8', 0.04 + night * 0.3);
        // the galleon rocks in its cloud; its lantern
        galleonG.rotation.z = 0.08 + Math.sin(t * 0.5) * 0.04;
        galleonG.position.y = 0.7 + Math.sin(t * 0.4) * 0.2;
        galleonG.updateMatrixWorld();
        galLantern.copy(gal.lantern).applyMatrix4(galleonG.matrixWorld);
        halos.add(galLantern, 3, '#ffd27a', 0.2 + night * 0.5);
        galLight.pos.copy(galLantern);
        galLight.intensity = 0.3 + night * 0.8;
        // the vane turns toward the strongest dream (wobbling like it's half asleep)
        arrow.rotation.y = vaneYaw + Math.sin(t * 0.6) * 0.18;
        halos.add(tmp.copy(arrow.position).add(tmpV.set(0, -0.2, 0)), 2.4, elLook(domEl).glow, 0.08 + night * 0.35);
        vaneLight.intensity = 0.15 + night * 0.6;
        // your ship
        boat.group.position.y = 0.1 + Math.sin(t * 0.9) * 0.12;
        boat.group.rotation.z = Math.sin(t * 0.7) * 0.03;
        sails.uTime.value = t;
        (sails.uGrade.value as THREE.Color).copy(paperLighting.grade);
        boat.lantern.intensity = night * 0.9;
        town.update(dt, t, night);
        halos.end();
      },
    });

    // ── points of interest ──
    const vanePOI = vaneBase.clone().add(new THREE.Vector3(0, 9.5, 0));
    const whalePOI = new THREE.Vector3();
    const pois: POI[] = [
      {
        id: 'veleta',
        pos: vanePOI,
        label: 'LA VELETA DE LOS SUEÑOS',
        kind: 'lore',
        visible: () => !st.busy && w.camera.position.distanceTo(vaneBase) < 110,
        onTap: () => vaneLore(),
      },
      {
        id: 'capitana',
        pos: new THREE.Vector3(GALLEON.x, 7.5, GALLEON.z),
        label: 'LA CAPITANA',
        kind: 'lore',
        visible: () => !st.busy && ctx.missionDone('H58') && !ctx.activeStory()?.startsWith('H58'),
        onTap: () => capitanaLore(),
      },
      {
        id: 'ballena',
        pos: whalePOI,
        label: 'LA BALLENA QUE RONCA',
        kind: 'lore',
        visible: () => {
          whalePOI.copy(whalePos).add(tmpV.set(0, 6, 0));
          const d = w.camera.position.distanceTo(whalePos);
          return !st.busy && d < 95 && d > 20;
        },
        onTap: () => whaleLore(),
      },
    ];

    // the dream's sound: the island's bed (doc 18 §5.4: `amb.suenos` when it's recorded) and a soft night shimmer
    audioApi.setState('explore', { fade: 2.5, context: 'suenos' });
    // one layer of amb.suenos per kind of cat that sleeps on your island tonight (docs/part-ii/30)
    audioApi.setLayers('amb.suenos', dreamLayers(G.s), { fade: 3 });
    audioApi.ambience('night_astral', { fade: 2, level: 0.45 });

    const offDev = devHook('suenos', w, { vane: vaneLore, whale: whaleLore, snore: () => snore(1.5), isles: () => isles.map((s) => ({ el: s.el, who: s.who?.name ?? null })), dream: (k: number) => (dreamK = k) }, (h) => {
      region.hour = Math.max(0.01, h);
      w.hour = region.hour;
    });

    return {
      pois,
      cine: {
        points: {
          llegada: new THREE.Vector3(ARRIVAL[0], 2, ARRIVAL[2]),
          centro: new THREE.Vector3(0, 6, -10),
          veleta: vaneBase.clone().add(new THREE.Vector3(0, 5, 0)),
          galeon: new THREE.Vector3(GALLEON.x, 4, GALLEON.z),
          duermevela: deck().clone(),
          cielo: new THREE.Vector3(0, 30, -40),
          ...Object.fromEntries(built.map((b, i) => [`isla_${i}`, b.base.clone().add(new THREE.Vector3(0, 2, 0))])),
          get ballena() {
            return whalePos.clone();
          },
        },
        fx: (cmd) => {
          if (cmd.id === 'burbujas') {
            for (const b of built) if (b.isle.who) for (let i = 0; i < 6; i++) bubbles.spawn(b.bedW.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 1, (Math.random() - 0.5) * 2)), { r: 0.4 + Math.random() * 0.6, up: 1.2, life: 8, color: elLook(b.isle.el).light });
            return null;
          }
          if (cmd.id === 'bostezo') {
            town.duermevela?.brain.emote('sleepy', 1);
            return null;
          }
          if (cmd.id === 'ronquido') {
            snore(Number(cmd.k ?? 1.6));
            return null;
          }
          return undefined;
        },
        drive: (id, k) => {
          if (id === 'sueno') dreamK = Math.max(0, Math.min(1, k));
        },
        driveGet: (id) => (id === 'sueno' ? dreamK : undefined),
      },
      dispose() {
        audioApi.setLayers('amb.suenos', null, { fade: 4 });
        audioApi.ambience('none', { fade: 1.5 });
        petals.dispose();
        rain.dispose();
        bin.dispose();
        offDev();
      },
    };
  },
};

const tmpC = new THREE.Color();
const tmpV = new THREE.Vector3();
