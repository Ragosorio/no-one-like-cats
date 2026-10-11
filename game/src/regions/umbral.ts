/**
 * EL UMBRAL (Parte II · Oleada 4 «El Umbral», las fronteras) — guion 13 H62/H63, biblia 05 §4 y §5.2, concepto
 * 11 (sin héroe humano: la puerta es una gatera). «El borde de la página. Del otro lado no hay mar. No hay nada.
 * Todavía.»
 *
 * The edge of the chart, literally: the sea runs up to a torn edge of paper and stops; beyond it lies the blank
 * page, as big as the world, glowing white (no sun lights it: it just is). On the last rock before the edge stands
 * the DOOR — ajar, with giant brass hinges and a cat-flap at its foot — and by its hinge, Bisagra. The three forces
 * are all here, and none is entirely right (biblia 05 §5.2):
 *  - Los Correctores: a fleet of identical white ships in a PERFECT row (H62's battle), gulls flying in
 *    formation, five of their cats lined up on the beach purring in unison. After H62: ink stains that won't
 *    come off. After H63: gone.
 *  - Los Disruptores (H63): graffiti that drips glitch on torn floating rocks and over the door, their rift ship,
 *    a cat spraying the sky. After H63: the tags drain away.
 *  - Los Titiriteros: threads of light that come down from the sky to the ships, the door and the sea (a few in
 *    H62, all of them in H63). After H63 they go back up, like reins someone let go.
 * The seam in the sky is wide open; at the night of the story (H62–H63) the hour is fixed at night. Lens: TINTA EN
 * EL BORDE — ink creeping in from the frame's corners, paper grain.
 *
 * POIs: «¡A PELEAR!» at the flagship (H62 `umbral_correctores`) and at the door (H63 `umbral_final`) · «La
 * puerta» · «El borde» (counter `feature_borde_umbral`) · «La flota blanca» · «Los grafitis» (H63).
 * Music: state `explore_mystery` + context `umbral` (director.json: `amb.umbral` when recorded, else te ODIO's
 * bare voice → CIRCUS MALUS's music box).
 */
import * as THREE from 'three';
import type { POI, RegionBuild, RegionDef } from './types';
import type { SkyKey } from '../engine/world/sky';
import type { LocalLight } from '../engine/world/paperCat';
import { paperLighting } from '../engine/world/paperCat';
import { G } from '../state/game';
import { sfx } from '../core/audio';
import { audioApi } from '../audio/api';
import { motif } from '../cine/sound';
import { Bin } from './paginas/kit';
import { Halos, Mesher, devParams, mat, skyToon } from './cielo/kit';
import { LENS_NOISE, battleNow, devHook, ease, lensQuad, mergeInto, propTaps, quietSay, skyShell, storyBattle } from './fronteras/kit';
import { ARRIVAL, DOOR, EDGE_Z, FLAGSHIP, FLEET, HALF, RIFT, SHIP, height, paint, walkable } from './umbral/layout';
import { blankSheet, catFlap, door, doorLeaf, graffiti, gull, inkBlots, pencil, riftShip, threads, tornRock, whiteShip } from './umbral/props';
import { residents } from './umbral/residents';
import { ship } from '../rupturas/props';

/** a paper-white horizon by day (the blank shows through the haze), deep indigo nights with ink-blue water */
const SKY: SkyKey[] = [
  { h: 0, zenith: '#07071e', horizon: '#3a3470', sun: '#a8b4ff', sunI: 0, hemiSky: '#4a4c9a', hemiGround: '#1c1a34', hemiI: 0.66, fog: '#24224c', deep: '#080c2c', shallow: '#1a2658', grade: '#b2b6ee', night: 1 },
  { h: 4.8, zenith: '#0b0a26', horizon: '#4a3e7c', sun: '#a8b4ff', sunI: 0, hemiSky: '#4e4e9c', hemiGround: '#1e1c36', hemiI: 0.66, fog: '#2c2856', deep: '#0a0e30', shallow: '#1c2a5c', grade: '#b6b8ee', night: 1 },
  { h: 6.0, zenith: '#5a64a8', horizon: '#f2dcd0', sun: '#ffd8c0', sunI: 1.1, hemiSky: '#c8c4e4', hemiGround: '#5a5068', hemiI: 0.82, fog: '#e6d8d4', deep: '#2a3a6c', shallow: '#5a7aa4', grade: '#fff0ec', night: 0.25 },
  { h: 8.0, zenith: '#5a6cb8', horizon: '#ece8e4', sun: '#fff6ee', sunI: 1.8, hemiSky: '#e0e0f0', hemiGround: '#6a6478', hemiI: 0.9, fog: '#ece8e2', deep: '#2c3e72', shallow: '#5e80ac', grade: '#fffaf8', night: 0 },
  { h: 12.5, zenith: '#5870c0', horizon: '#eeebe6', sun: '#ffffff', sunI: 2.0, hemiSky: '#e6e6f4', hemiGround: '#6e687c', hemiI: 0.92, fog: '#f0ede8', deep: '#2e4076', shallow: '#6084b0', grade: '#ffffff', night: 0 },
  { h: 16.5, zenith: '#5a68b6', horizon: '#ece4dc', sun: '#ffeedc', sunI: 1.8, hemiSky: '#e2deee', hemiGround: '#6c6474', hemiI: 0.9, fog: '#eee6de', deep: '#2c3c70', shallow: '#5c7ca8', grade: '#fff6f0', night: 0 },
  { h: 18.3, zenith: '#4c4a94', horizon: '#ecc4b8', sun: '#ffb49a', sunI: 1.2, hemiSky: '#b8a8d8', hemiGround: '#4c3e5c', hemiI: 0.84, fog: '#d8b8b4', deep: '#22305e', shallow: '#4a6494', grade: '#ffdcd4', night: 0.15 },
  { h: 19.6, zenith: '#1c1a4c', horizon: '#7a5c94', sun: '#c49ad8', sunI: 0.35, hemiSky: '#6a62b0', hemiGround: '#2a2440', hemiI: 0.72, fog: '#4a4078', deep: '#121c4a', shallow: '#2e4278', grade: '#c4b6ea', night: 0.7 },
  { h: 21, zenith: '#08081f', horizon: '#3c3672', sun: '#a8b4ff', sunI: 0, hemiSky: '#4a4c9a', hemiGround: '#1c1a34', hemiI: 0.66, fog: '#26244e', deep: '#080c2c', shallow: '#1a2658', grade: '#b2b6ee', night: 1 },
  { h: 24, zenith: '#07071e', horizon: '#3a3470', sun: '#a8b4ff', sunI: 0, hemiSky: '#4a4c9a', hemiGround: '#1c1a34', hemiI: 0.66, fog: '#24224c', deep: '#080c2c', shallow: '#1a2658', grade: '#b2b6ee', night: 1 },
];

/** the sky at the edge: the blank glowing over the north horizon, the seam (stitched) across it, an aurora */
const SKY_BODY = /* glsl */ `
  float up = d.y;
  // the white of the blank page, over the edge (north = -z)
  float north = smoothstep(0.1, 0.95, -d.z) ;
  float blank = north * (1.0 - smoothstep(-0.02, 0.32, up));
  vec3 col = vec3(1.0, 0.99, 0.96);
  float a = blank * mix(0.6, 0.95, uNight);
  // the seam: a torn line across the sky, stitched, glowing a little
  vec2 sp = vec2(atan(d.x, -d.z), up);
  float line = 0.42 + 0.08 * sin(sp.x * 2.2 + 0.6) + 0.03 * sin(sp.x * 9.0);
  float ds = abs(sp.y - line);
  float tear = smoothstep(0.012, 0.0, ds) * smoothstep(0.0, 0.3, up) * uOpen;
  float stitch = smoothstep(0.004, 0.0, abs(fract(sp.x * 18.0) - 0.5) * 0.06 - 0.0) * smoothstep(0.03, 0.0, ds) * step(ds, 0.026) * uOpen;
  vec3 seamC = mix(vec3(1.0, 0.95, 0.85), vec3(0.85, 0.75, 1.0), 0.5 + 0.5 * sin(uTime * 0.4));
  col = mix(col, seamC, max(tear, stitch * 0.7));
  a = max(a, (tear * 0.9 + stitch * 0.6) * (0.5 + uNight * 0.5));
  // aurora curtains (night): violet and teal bands that breathe
  float band = lfbm(vec2(sp.x * 1.6 + uTime * 0.02, up * 3.0 - uTime * 0.03));
  float cur = smoothstep(0.55, 0.85, band) * smoothstep(0.12, 0.35, up) * (1.0 - smoothstep(0.55, 0.9, up));
  vec3 aur = mix(vec3(0.45, 0.35, 1.0), vec3(0.3, 0.95, 0.85), smoothstep(0.3, 0.7, lfbm(vec2(sp.x * 3.0, uTime * 0.05))));
  col = mix(col, aur, cur * (1.0 - blank));
  a = max(a, cur * 0.35 * uNight * uOpen);
  gl_FragColor = vec4(col, a);`;

/** TINTA EN EL BORDE: ink creeping in from the corners, paper grain */
const LENS = /* glsl */ `
  uniform float uTime; uniform float uK; uniform float uAspect; varying vec2 vUv;
  ${LENS_NOISE}
  void main(){
    vec2 p = vUv * vec2(uAspect, 1.0);
    float grain = lvn(p * 380.0);
    vec2 c = vUv - 0.5;
    float r = length(c * vec2(1.0, 0.85));
    float bleed = lfbm(p * 3.0 + uTime * 0.01);
    float ink = smoothstep(0.5, 0.78, r + (bleed - 0.5) * 0.22);
    vec3 f = vec3(1.0) * (1.0 - (grain - 0.5) * 0.06);
    f *= mix(vec3(1.0), vec3(0.28, 0.24, 0.42), ink * 0.85);
    gl_FragColor = vec4(mix(vec3(1.0), f, uK), 1.0);
  }`;

const dev = devParams();
const active = (id: string) => !!G.s?.missions?.active.includes(id);
const done = (id: string) => !!G.s?.missions?.done.includes(id);

export const region: RegionDef = {
  id: 'umbral',
  name: 'El Umbral',
  subtitle: 'Aquí se acaba el papel.',
  half: HALF,
  height,
  paint,
  walkable,
  skyKeys: SKY,
  rupture: 1,
  fog: { near: 110, far: 460 },
  // the night of the story at the edge (H62–H63: world state o4_umbral); after that, the player's own hour
  get hour() {
    return dev.hour ?? (active('H62') || active('H63') ? 22.6 : undefined);
  },
  set hour(h: number | undefined) {
    dev.hour = h;
  },
  weather: dev.weather ?? 'despejado',
  camera: { target: [-6, 8, -20], yaw: 0.12, pitch: 0.3, dist: 104, minDist: 8, maxDist: 160, bound: 74 },
  arrival: ARRIVAL,
  async build(ctx): Promise<RegionBuild> {
    const w = ctx.world;
    const rng = ctx.rng;
    const bin = new Bin();
    const uNight = { value: 0 };
    const uTime = { value: 0 };
    const root = new THREE.Group();
    root.name = 'umbral';
    // the three forces, as the story says (derived from missions: same after a reload)
    const h63 = active('H63');
    const over = done('H63');
    let forces = over ? 0 : 1;
    const stained = done('H62');
    const uGraf = { value: h63 ? 1 : 0 };
    const uThreadK = { value: over ? 0 : h63 ? 1 : 0.5 };
    const uRise = { value: over ? 1 : 0 };
    const uOpen = { value: 1 };
    // amb.umbral has one in-sync layer per force (docs/part-ii/30): who is still at the edge is what you hear
    const forceMix = (k: number) => {
      const m = h63 ? { correctores: 1, disruptores: 1, titiriteros: 1 } : stained ? { correctores: 0.7, disruptores: 0, titiriteros: 0.6 } : { correctores: 1, disruptores: 0, titiriteros: 0.5 };
      return { correctores: m.correctores * k, disruptores: m.disruptores * k, titiriteros: m.titiriteros * k };
    };

    // ── the sky, the blank, the lens ──
    const shell = skyShell(bin, SKY_BODY, { uOpen });
    root.add(shell.mesh);
    root.add(blankSheet(bin, uTime, uNight));
    const lens = lensQuad(bin, LENS);
    root.add(lens.mesh);
    const ground = w.terrain.material;
    ground.emissive.set('#3a3458');

    // ── the door: frame (static), leaf (swings), cat-flap (swings) ──
    const toon = skyToon(bin, { uNight, key: 'umb', bright: 0.14 });
    const DM = new Mesher(true);
    const d = door(DM);
    // floating torn rocks (east) for the graffiti, a few by the edge
    const rocks: THREE.Vector3[] = [];
    rocks.push(tornRock(DM, 30, 9, -30, 1.2, -0.7));
    rocks.push(tornRock(DM, 40, 14, -40, 1, -0.4));
    rocks.push(tornRock(DM, 22, 16, -46, 0.9, -0.2));
    rocks.push(tornRock(DM, -26, 13, -44, 0.9, 0.5));
    // the ink-stone ridge's spires
    for (let i = 0; i < 9; i++) {
      const x = 10 + rng() * 8;
      const z = -10 - i * 3.6;
      DM.add(new THREE.ConeGeometry(0.9 + rng() * 0.8, 3 + rng() * 5, 5), '#2a2640', mat(x, height(x, z) + 1.5, z, (rng() - 0.5) * 0.3, rng() * 3, (rng() - 0.5) * 0.3));
    }
    // the Titiriteros' giant pencils, stuck in the promontory as if they'd been thrown from above
    pencil(DM, -7, height(-7, -14) - 0.6, -14, 9, 0.25, 0.32);
    pencil(DM, 6, height(6, -30) - 0.6, -30, 12, -0.18, -0.28);
    pencil(DM, -4, height(-4, 6) - 0.6, 6, 6, 0.1, -0.45);
    // stacks of blank paper by the causeway (nobody has written on them yet)
    for (let i = 0; i < 5; i++) {
      const x = (i % 2 ? 4.6 : -4.6) + (rng() - 0.5);
      const z = -24 - i * 3.4;
      const y0 = height(x, z);
      for (let k = 0; k < 3 + (i % 3); k++) DM.add(new THREE.BoxGeometry(1.6, 0.18, 2.1), k % 2 ? '#fbf8f0' : '#f0ebe0', mat(x, y0 + 0.1 + k * 0.19, z, 0, rng() * 0.5, 0));
    }
    const doorMesh = new THREE.Mesh(bin.add(DM.build()), skyToon(bin, { uNight, key: 'umb-door', bright: 0.3 }));
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    root.add(doorMesh);
    const leafG = new THREE.Group();
    leafG.position.copy(d.hinge);
    const LM = new Mesher(true);
    doorLeaf(LM);
    const leaf = new THREE.Mesh(bin.add(LM.build()), skyToon(bin, { uNight, key: 'umb-door', bright: 0.3 }));
    leaf.castShadow = true;
    leafG.add(leaf);
    const flapG = new THREE.Group();
    flapG.position.set(DOOR.w / 2, 1.35, 0.42);
    const FM = new Mesher(true);
    catFlap(FM);
    flapG.add(new THREE.Mesh(bin.add(FM.build()), toon));
    leafG.add(flapG);
    root.add(leafG);
    let doorOpen = over ? 0.62 : 0.42;
    const gapC = new THREE.Vector3(DOOR.x + DOOR.w * 0.18, DOOR.y + DOOR.h * 0.5, DOOR.z - 0.5);

    // ── the white fleet: identical ships in a perfect row (they bob in unison) ──
    const fleetMat = skyToon(bin, { uNight, key: 'umb-fleet', bright: 0.32 });
    const FL = new Mesher(true);
    const stainM = new Mesher(true);
    const masts: THREE.Vector3[] = [];
    for (let i = 0; i < FLEET.n; i++) {
      const s = i === 3 ? 1.35 : 1;
      const x = FLEET.x0 + i * FLEET.step;
      // bows at the edge (north), side by side: perfectly parallel, perfectly spaced
      const B = mat(x, 0, FLEET.z, 0, 0, 0);
      const sh = new Mesher(true);
      whiteShip(sh, s);
      mergeInto(FL, sh.build(), B);
      const bl = new Mesher(true);
      inkBlots(bl, rng, s);
      mergeInto(stainM, bl.build(), B);
      masts.push(new THREE.Vector3(x, 12.5 * s, FLEET.z + 2.2 * s));
    }
    const fleetG = new THREE.Group();
    const fleet = new THREE.Mesh(bin.add(FL.build()), fleetMat);
    fleet.castShadow = true;
    fleetG.add(fleet);
    const stains = new THREE.Mesh(bin.add(stainM.build()), skyToon(bin, { uNight, key: 'umb-ink', bright: 0 }));
    stains.visible = stained;
    fleetG.add(stains);
    root.add(fleetG);
    // gulls in formation, back and forth over the fleet
    const GM = new Mesher(true);
    for (let i = 0; i < 9; i++) {
      const gm = new Mesher(true);
      gull(gm);
      mergeInto(GM, gm.build(), mat(i * 3 - 12, 0, 0, 0, Math.PI / 2, 0));
    }
    const gulls = new THREE.Mesh(bin.add(GM.build()), skyToon(bin, { uNight, key: 'umb-gull', bright: 0.4 }));
    root.add(gulls);

    // ── the Disruptores: graffiti on the rocks and over the door, the rift ship ──
    const tags: THREE.Mesh[] = [];
    rocks.forEach((r, i) => {
      const t = graffiti(bin, uTime, uGraf, i);
      t.position.copy(r).add(new THREE.Vector3(0, 0, 0.9));
      t.rotation.y = i === 3 ? 0.5 : i === 0 ? -0.7 : i === 1 ? -0.4 : -0.2;
      t.position.add(new THREE.Vector3(Math.sin(t.rotation.y) * 0.8, 0, Math.cos(t.rotation.y) * 0.8 - 0.8));
      tags.push(t);
      root.add(t);
    });
    const doorTag = graffiti(bin, uTime, uGraf, 4);
    doorTag.position.set(DOOR.x + DOOR.w / 2 + 1.4, DOOR.y + DOOR.h * 0.62, DOOR.z + 1.4);
    doorTag.scale.setScalar(0.9);
    doorTag.rotation.z = Math.PI / 2;
    root.add(doorTag);
    tags.push(doorTag);
    const skyTag = graffiti(bin, uTime, uGraf, 5);
    skyTag.position.set(-30, 60, -120);
    skyTag.scale.setScalar(6);
    skyTag.lookAt(0, 20, 40);
    root.add(skyTag);
    tags.push(skyTag);
    const RM = new Mesher(true);
    riftShip(RM);
    const rift = new THREE.Mesh(bin.add(RM.build()), skyToon(bin, { uNight, key: 'umb-rift', bright: 0.05 }));
    rift.position.set(RIFT.x, 0, RIFT.z);
    rift.rotation.y = RIFT.ry;
    rift.visible = h63;
    root.add(rift);

    // ── the Titiriteros' threads ──
    const anchors = [...masts.map((m) => m.clone().setY(m.y + 0.5)), gapC.clone().setY(DOOR.y + DOOR.h + 2), new THREE.Vector3(DOOR.x + 4, DOOR.y + DOOR.h + 2, DOOR.z), new THREE.Vector3(-8, 0.3, -36), new THREE.Vector3(18, 0.3, -20), new THREE.Vector3(-30, 0.3, -12), new THREE.Vector3(26, 0.3, 4), new THREE.Vector3(RIFT.x, 12.4, RIFT.z)];
    root.add(threads(bin, anchors, uTime, uRise, uThreadK));

    // ── your ship, the halos ──
    const boat = ship();
    boat.group.position.set(SHIP.x, 0.1, SHIP.z);
    boat.group.rotation.y = SHIP.ry;
    boat.group.scale.setScalar(1.2);
    root.add(boat.group);
    boat.lantern.pos.set(SHIP.x, 2.2, SHIP.z);
    const halos = new Halos(bin, 64);
    root.add(halos.mesh);

    // ── residents ──
    const town = await residents(ctx, { bisagra: !over, correctores: !over, disruptores: h63 });

    // ── lights for the cats ──
    const gapLight: LocalLight = { pos: gapC.clone().add(new THREE.Vector3(0, -6, 4)), color: new THREE.Color('#fff6e0'), range: 18, intensity: 0 };
    const neonLight: LocalLight = { pos: new THREE.Vector3(RIFT.x - 18, 4, RIFT.z + 14), color: new THREE.Color('#ff5ce1'), range: 10, intensity: 0 };

    // ── activities ──
    const { st, say } = quietSay(ctx);
    const anims: { t: number; dur: number; fn: (k: number) => void; done?: () => void }[] = [];
    const anim = (dur: number, fn: (k: number) => void) => new Promise<void>((res) => anims.push({ t: 0, dur, fn, done: res }));
    const creak = () => {
      sfx('whoosh');
      w.rig.shake(0.08);
      town.bisagra?.brain.emote('surprise', 0.6);
    };
    const doorLore = async () => {
      if (st.busy) return;
      w.rig.follow = null;
      w.rig.focus(new THREE.Vector3(DOOR.x, DOOR.y + 8, DOOR.z + 2), 40, 0.16, 0);
      creak();
      await say(
        over
          ? [
              ['CAPTION', 'LA PUERTA. Sigue entreabierta. Ya nadie la cuida; se cuida sola. A veces rechina por costumbre.'],
              ['LUZTERNA', 'Del otro lado sigue sin haber nada, Capi. Todavía. Me gusta ese «todavía».'],
            ]
          : [
              ['BISAGRA', 'Aquí no se pasa. Ni se escribe. Ni se borra. Aquí se ESPERA.'],
              ['LUZTERNA', 'Una gata con forma de puerta, Capi. O una puerta con forma de gata. No le preguntes cuál: se ofende las dos veces.'],
            ],
      );
    };
    const edgeLore = async () => {
      if (st.busy) return;
      ctx.feature('borde_umbral');
      const first = !ctx.has('umbral_borde');
      ctx.flag('umbral_borde');
      w.rig.follow = null;
      w.rig.focus(new THREE.Vector3(14, 2, EDGE_Z + 4), 28, 0.12, Math.PI * 0.04);
      motif('arco_pregunta');
      await say(
        first
          ? [
              ['CAPTION', 'EL BORDE. El mar llega hasta aquí y se acaba, como se acaba una hoja. Del otro lado no hay mar. No hay nada. Todavía.'],
              ['LUZTERNA', 'No te asomes mucho, Capi. Si te caes de la página, ¿en qué capítulo te busco?'],
            ]
          : [['CAPTION', 'El papel en blanco sigue ahí, esperando. Huele a cuaderno nuevo.']],
      );
    };
    const fleetLore = async () => {
      if (st.busy) return;
      await say(
        stained
          ? [
              ['CAPTION', 'La flota blanca, quieta. Cada barco tiene una mancha de tinta que no se quita. Ya intentaron con goma. Con más goma. Con mucha goma.'],
              ['LUZTERNA', 'Les queda bien, Capi. Por fin se ven como alguien.'],
            ]
          : [
              ['CAPTION', 'Siete barcos blancos, iguales, en fila perfecta. Hasta las gaviotas van en fila. Hasta las olas parecen pedir permiso.'],
              ['LUZTERNA', 'A mí me da más miedo esto que una tormenta. Una tormenta por lo menos improvisa.'],
            ],
      );
    };
    const grafLore = async () => {
      if (st.busy) return;
      await say([
        ['CAPTION', '«ROMPE LA CAJA». «NO HAY MANO». «¿Y SI NO?». Los grafitis chorrean y se reacomodan solos, como si no se decidieran a quedarse.'],
        ['LUZTERNA', 'Los Disruptores tienen razón en algo: nadie debería vivir de una mano invisible. Pero romperlo todo tampoco es libertad, Capi. Es nomás desorden con aerosol.'],
      ]);
    };
    propTaps(w, () => st.busy, (near) => {
      if (near(gapC, 80)) {
        creak();
        return true;
      }
      return false;
    });

    // ── every frame ──
    let gullT = 0;
    const tmp = new THREE.Vector3();
    const sails = boat.sails.uniforms;
    w.addProp({
      group: root,
      lights: [gapLight, neonLight, boat.lantern],
      update(dt, t, night) {
        uNight.value = night;
        uTime.value = t;
        shell.u.uTime.value = t;
        shell.u.uNight.value = night;
        lens.update(w, t);
        ground.emissiveIntensity = 0.25 + night * 0.5;
        for (let i = anims.length - 1; i >= 0; i--) {
          const a = anims[i];
          a.t = Math.min(a.dur, a.t + dt);
          a.fn(a.t / a.dur);
          if (a.t >= a.dur) {
            anims.splice(i, 1);
            a.done?.();
          }
        }
        halos.begin();
        // the door breathes on its hinges; the flap swings as if something small just went through
        leafG.rotation.y = -(doorOpen + Math.sin(t * 0.5) * 0.015) * 1.0;
        flapG.rotation.x = Math.sin(t * 1.7) * 0.25 * (0.5 + 0.5 * Math.sin(t * 0.23));
        halos.add(gapC, 9, '#fff8e8', 0.2 + night * 0.3);
        halos.add(tmp.copy(gapC).add(new THREE.Vector3(0, -8, 2)), 6, '#fff2d8', 0.12 + night * 0.25);
        gapLight.intensity = 0.4 + night * 1.0;
        // the fleet: all at once, the same bob (perfect, and wrong); the forces leave by sailing off
        const away = 1 - forces;
        fleetG.position.set(-away * 160, Math.sin(t * 0.8) * 0.18 - away * 3, -away * 40);
        fleetG.visible = forces > 0.01;
        gulls.visible = forces > 0.01;
        // the gulls fly in a perfect line, back and forth over the fleet (they turn all at once)
        gullT = Math.sin(t * 0.12);
        gulls.position.set(FLEET.x0 + 24 + gullT * 26 - away * 160, 17 + Math.sin(t * 0.9) * 0.4, FLEET.z - 4);
        gulls.rotation.y = Math.cos(t * 0.12) >= 0 ? Math.PI : 0;
        // graffiti, the rift's neon, the threads
        rift.visible = uGraf.value > 0.02 && forces > 0.01;
        rift.position.y = Math.sin(t * 0.7) * 0.2 - (1 - forces) * 4;
        neonLight.intensity = rift.visible ? 0.4 + night * 0.8 : 0;
        if (rift.visible) halos.add(tmp.set(RIFT.x, 12.4, RIFT.z), 2.8, '#ff3ad0', 0.4 + night * 0.4);
        for (const tg of tags) tg.visible = uGraf.value > 0.01;
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
    const fleetAt = new THREE.Vector3(FLAGSHIP.x, 15, FLAGSHIP.z);
    const doorAt = new THREE.Vector3(DOOR.x, DOOR.y + DOOR.h + 6, DOOR.z + 1);
    const pois: POI[] = [
      storyBattle('umbral_correctores', fleetAt),
      storyBattle('umbral_final', doorAt),
      {
        id: 'puerta',
        pos: new THREE.Vector3(DOOR.x - 4, DOOR.y + 12, DOOR.z + 3),
        label: 'LA PUERTA',
        kind: 'lore',
        visible: () => !st.busy && battleNow(['umbral_final']) === null && w.camera.position.distanceTo(gapC) < 120,
        onTap: () => doorLore(),
      },
      {
        id: 'borde',
        pos: new THREE.Vector3(16, 4, EDGE_Z + 3),
        label: 'EL BORDE',
        kind: 'lore',
        visible: () => !st.busy && w.camera.position.distanceTo(gapC) < 110,
        onTap: () => edgeLore(),
      },
      {
        id: 'flota',
        pos: new THREE.Vector3(FLEET.x0 + FLEET.step, 11, FLEET.z),
        label: 'LA FLOTA BLANCA',
        kind: 'lore',
        visible: () => !st.busy && forces > 0.5 && battleNow(['umbral_correctores']) === null,
        onTap: () => fleetLore(),
      },
      {
        id: 'grafitis',
        pos: rocks[0].clone().add(new THREE.Vector3(0, 4.5, 1)),
        label: 'LOS GRAFITIS',
        kind: 'lore',
        visible: () => !st.busy && uGraf.value > 0.5,
        onTap: () => grafLore(),
      },
    ];

    // the edge's sound (doc 18 §5.4: `amb.umbral` when recorded) and the wind that comes from nowhere
    audioApi.setState('explore_mystery', { fade: 2.5, context: 'umbral' });
    audioApi.setLayers('amb.umbral', forceMix(forces), { fade: 3 });
    audioApi.ambience('wind', { fade: 2, level: 0.55 });

    const offDev = devHook(
      'umbral',
      w,
      {
        door: doorLore,
        edge: edgeLore,
        forces: (k: number) => (forces = k),
        graf: (k: number) => (uGraf.value = k),
        threads: (k: number, rise = 0) => {
          uThreadK.value = k;
          uRise.value = rise;
        },
        stains: (on: boolean) => (stains.visible = on),
      },
      (h) => {
        dev.hour = Math.max(0.01, h);
        w.hour = dev.hour;
      },
    );

    return {
      pois,
      cine: {
        points: {
          llegada: new THREE.Vector3(ARRIVAL[0], 2.5, ARRIVAL[2]),
          puerta: new THREE.Vector3(DOOR.x, DOOR.y + 9, DOOR.z),
          bisagra: new THREE.Vector3(DOOR.x - DOOR.w / 2 - 3.2, DOOR.y + 3, DOOR.z + 2.4),
          flota: new THREE.Vector3(FLEET.x0 + FLEET.step * 3, 6, FLEET.z),
          insignia: new THREE.Vector3(FLAGSHIP.x, 8, FLAGSHIP.z),
          borde: new THREE.Vector3(10, 2, EDGE_Z + 2),
          grafitis: rocks[0].clone(),
          hilos: new THREE.Vector3(0, 60, -40),
          cielo: new THREE.Vector3(0, 80, -120),
        },
        fx: (cmd) => {
          if (cmd.id === 'manchas') {
            stains.visible = true;
            w.pools.dust.emit({ pos: { x: FLAGSHIP.x, y: 3, z: FLAGSHIP.z }, spread: { x: 26, y: 1, z: 2 }, vel: { x: 0, y: 3, z: 0 }, velJitter: { x: 1, y: 1, z: 1 }, life: 1, size: 0.6, color: '#15122a', color2: '#3a2a5a', count: 50 });
            return null;
          }
          if (cmd.id === 'retirada') {
            // the ships turn and go, the graffiti drains, the threads go up like reins let go (b63 part b)
            const dur = Number(cmd.dur ?? 6);
            const f0 = forces;
            const g0 = uGraf.value;
            const r0 = uRise.value;
            audioApi.setLayers('amb.umbral', forceMix(0), { fade: dur });
            void anim(dur, (k) => {
              const e = ease(k);
              forces = f0 * (1 - e);
              uGraf.value = g0 * (1 - Math.min(1, e * 1.4));
              uRise.value = r0 + (1 - r0) * e;
            });
            return null;
          }
          if (cmd.id === 'chirrido') {
            creak();
            return null;
          }
          return undefined;
        },
        drive: (id, k) => {
          const v = Math.max(0, Math.min(1, k));
          if (id === 'fuerzas') {
            forces = v;
            audioApi.setLayers('amb.umbral', forceMix(v), { fade: 0.5 });
            uGraf.value = v;
            uThreadK.value = v;
            uRise.value = 1 - v;
          }
          if (id === 'puerta') doorOpen = 0.2 + v * 0.9;
        },
        driveGet: (id) => (id === 'fuerzas' ? forces : id === 'puerta' ? (doorOpen - 0.2) / 0.9 : undefined),
      },
      dispose() {
        anims.length = 0;
        audioApi.setLayers('amb.umbral', null, { fade: 4 });
        audioApi.ambience('none', { fade: 1.5 });
        bin.dispose();
        offDev();
      },
    };
  },
};
