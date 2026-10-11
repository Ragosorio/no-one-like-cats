/**
 * The people of Corona Celeste. The citizens (eight Ronrón around the fountain, two Maneki at the
 * market, two Vitral at the embassy's door) are not driven by the ambient-life director: the CITY
 * drives them, and it drives them all at once. They breathe in unison, blink in unison, turn their
 * heads in unison, flick their tails on the same beat, take the same three steps around the fountain
 * every forty seconds, and purr. Always. Nothing chases anything here.
 *
 * Hélice, down at the south pier by your ship, is the exception: the director runs her like any cat.
 */
import * as THREE from 'three';
import type { RegionCtx } from '../types';
import type { PaperCat } from '../../engine/world/paperCat';
import { addSkyCat } from '../cielo/cats';
import { EMBASSY, FOUNTAIN, MARKET, PIER_S, Y_PLAZA, height } from './layout';

const RING = 7.6;
const N = 8;
/** a promenade every PERIOD seconds: the ring turns one place (45°) in STEP seconds */
const PERIOD = 40;
const STEP = 6;

interface Citizen {
  id: string;
  cat: PaperCat;
  /** ring index (citizens of the fountain) or a fixed post */
  ring?: number;
  post?: THREE.Vector3;
}

export interface CoronaCitizens {
  /** all of them stop purring and look at a point for a few seconds (then: as if nothing happened) */
  hush(at: THREE.Vector3, seconds?: number): void;
  /** one of them was tapped: they all react, together */
  chorusHappy(): void;
  isCitizen(id: string): boolean;
  update(dt: number, t: number, night: number): void;
  /** how many are purring right now (0 during a hush) */
  purring(): boolean;
}

const LINES = [
  'Ciudadano ejemplar. Ronronea. Siempre. Le preguntaste cómo está: «Excelente». Le preguntaste otra vez: «Excelente».',
];

export async function citizens(ctx: RegionCtx): Promise<CoronaCitizens> {
  const w = ctx.world;
  const list: Citizen[] = [];
  const add = async (id: string, species: string, home: THREE.Vector3, here: string, title?: string, ring?: number) => {
    const cat = await addSkyCat(ctx, { id, species, home, here, title, acts: 'none', alive: false, tags: ['corona'] });
    if (cat) list.push({ id, cat, ring, post: ring === undefined ? home.clone() : undefined });
  };
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + Math.PI / N;
    jobs.push(add(`cor_ronron_${i}`, 'r_ronron', new THREE.Vector3(Math.cos(a) * RING, Y_PLAZA, Math.sin(a) * RING), LINES[0], 'Ciudadano ejemplar · Ronrón', i));
  }
  // the market's two vendors (mirrored ends of the stalls) and the embassy's two door guards
  for (const sz of [-1, 1]) {
    const mx = MARKET.x + 2.2;
    const mz = MARKET.z + sz * 5.2;
    jobs.push(add(`cor_maneki_${sz}`, 's_maneki', new THREE.Vector3(mx, height(mx, mz), mz), 'Vende nubes en frasco. Todas cuestan lo mismo: «una sonrisa». Si no sonríes, te la presta.', 'Vendedor ejemplar · Mochi Maneki'));
    const gx = EMBASSY.x - EMBASSY.w / 2 - 2.6;
    const gz = EMBASSY.z + sz * 3.6;
    jobs.push(add(`cor_vitral_${sz}`, 'r_vitral', new THREE.Vector3(gx, height(gx, gz) + 0.66, gz), 'Cuida la puerta de la embajada. No sabe qué hay adentro. Dice que no hace falta saber: «adentro está todo bien».', 'Guardia ejemplar · Vitral'));
  }
  await Promise.all(jobs);
  // Hélice: the mechanic, down at the pier. She is alive the way cats are alive.
  const hp = new THREE.Vector3(PIER_S.x - 1.5, 0, PIER_S.z0 - 3);
  hp.y = height(hp.x, hp.z);
  await addSkyCat(ctx, { id: 'cor_helice', species: 'r_helice', home: hp, tags: ['corona'], here: 'La mecánica del sótano. Le está apretando tuercas a tu barco que nadie le pidió apretar. Es la única gata de la ciudad que no ronronea todo el tiempo. Dice que es alergia.' });

  const ids = new Set(list.map((c) => c.id));
  const right = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let hushT = 0;
  let hushAt = new THREE.Vector3();
  let blinkT = 0;
  let flickT = 7;
  let lookT = 19;
  let purrT = 0;
  let chorusT = 12;
  let happyQ = false;
  // the city's own clock: everybody shares it
  const silenceRandomness = (c: PaperCat, t: number) => {
    const b = c.brain as unknown as { blinkT: number; earT: number[]; walkPh: number };
    b.blinkT = 9;
    for (let i = 0; i < b.earT.length; i++) b.earT[i] = 9;
    // even their steps are in step
    b.walkPh = t * 11;
  };

  return {
    isCitizen: (id) => ids.has(id),
    purring: () => hushT <= 0,
    hush(at, seconds = 3.2) {
      hushT = seconds;
      hushAt = at.clone();
    },
    chorusHappy() {
      happyQ = true;
    },
    update(dt, t, night) {
      right.setFromMatrixColumn(w.camera.matrixWorld, 0);
      // the promenade: the ring advances one place every PERIOD seconds, all in step
      const cyc = t % PERIOD;
      const stepK = Math.min(1, Math.max(0, (cyc - (PERIOD - STEP)) / STEP));
      const turns = Math.floor(t / PERIOD);
      const rot = (turns + stepK * stepK * (3 - 2 * stepK)) * ((Math.PI * 2) / N);
      const walking = stepK > 0 && stepK < 1 && hushT <= 0;
      const hushed = hushT > 0;
      if (hushT > 0) {
        hushT -= dt;
        if (hushT <= 0) happyQ = true;
      }
      blinkT -= dt;
      flickT -= dt;
      lookT -= dt;
      const blinkNow = blinkT <= 0;
      if (blinkNow) blinkT = 3.7;
      const flickNow = flickT <= 0 && !hushed;
      if (flickNow) flickT = 13;
      const lookNow = lookT <= 0 && !hushed;
      if (lookNow) lookT = 31;
      const headTurn = 0.45 * Math.sin(t * 0.35);
      for (const c of list) {
        const cat = c.cat;
        const b = cat.brain;
        silenceRandomness(cat, t);
        // unison breathing: one shared clock for every chest in the city
        b.t = t;
        if (c.ring !== undefined) {
          const a = (c.ring / N) * Math.PI * 2 + Math.PI / N + (hushed ? 0 : rot);
          const x = FOUNTAIN.x + Math.cos(a) * RING;
          const z = FOUNTAIN.z + Math.sin(a) * RING;
          cat.root.position.set(x, Y_PLAZA, z);
          cat.ground = Y_PLAZA;
          b.walk = walking ? 1 : 0;
          if (walking) {
            // tangent of the circle, seen from the camera
            tmp.set(-Math.sin(a), 0, Math.cos(a));
            cat.facing = tmp.dot(right) >= 0 ? 1 : -1;
          }
        }
        if (hushed) {
          b.energy = Math.max(0, b.energy - dt * 3);
          tmp.copy(hushAt).sub(cat.root.position);
          cat.facing = tmp.dot(right) >= 0 ? 1 : -1;
          b.look = cat.facing * 0.6;
        } else {
          b.energy = Math.min(1, b.energy + dt * 2);
          if (!walking) cat.facing = 1;
          b.look = headTurn;
        }
        if (blinkNow) b.blink();
        if (flickNow) b.doAct('flick');
        if (lookNow) b.doAct('look');
        if (happyQ) b.emote('happy', 1);
      }
      happyQ = false;
      // the purr: a soft gold shimmer off every chest on the same beat
      purrT -= dt;
      if (purrT <= 0 && !hushed) {
        purrT = 1.4;
        for (const c of list) {
          const p = c.cat.root.position;
          w.pools.motes.emit({ pos: { x: p.x, y: p.y + c.cat.height * 0.55, z: p.z }, spread: { x: 0.3, y: 0.2, z: 0.3 }, vel: { x: 0, y: 0.5, z: 0 }, velJitter: { x: 0.25, y: 0.1, z: 0.25 }, life: 1.6, size: 0.22, color: night > 0.5 ? '#ffe7a8' : '#fff2c8', color2: '#ffd27a', count: 1 });
        }
      }
      // every so often the chorus is loud enough to read (only when you're near)
      chorusT -= dt;
      if (chorusT <= 0 && !hushed) {
        chorusT = 18;
        const near = list
          .map((c) => ({ c, d: c.cat.root.position.distanceTo(w.camera.position) }))
          .filter((x) => x.d < 48)
          .sort((p, q) => p.d - q.d)
          .slice(0, 2);
        for (const { c } of near) ctx.floatText(c.cat.root.position.clone().add(new THREE.Vector3(0, c.cat.height + 0.6, 0)), 'rrrrrrr…');
      }
    },
  };
}
