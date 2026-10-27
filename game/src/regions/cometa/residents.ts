/**
 * Who lives (and works) in Puerto Cometa. Neighbors from the Primer Mar who came up for the jobs —
 * welders at the drydocks, a fuel taster at the refinery, a stargazer on the bench — plus the owner
 * of the workshop behind his counter in his fishbowl helmet, and the Oleada 3 species of
 * data/rupturas/especies-o3.json as soon as they exist (drawn with their stand-in painting until their
 * own art lands: cielo/cats.ts does that). At night only, REGISTRO 000 on a loose rock off the crest —
 * gone when you come close.
 *
 * LOW GRAVITY: every cat that walks hops higher and slower here, and now and then one of them jumps
 * just because it can (a slow, floaty parabola), kicking up dust that drifts UP.
 */
import * as THREE from 'three';
import type { RegionCtx } from '../types';
import type { PaperCat } from '../../engine/world/paperCat';
import type { World3D } from '../../engine/world/World3D';
import { catLiteUrl } from '../../art/catArt';
import { CAT_BY_ID } from '../../data/content';
import especiesO3 from '../../data/rupturas/especies-o3.json';
import { addSkyCat, type SkyCat } from '../cielo/cats';
import { CRATER, DOCKS, PERCH, PLAZA, RAIL, REFINERY, TELESCOPE, height } from './layout';
import { withRegistroEstado } from '../../state/sys/gaterasWorld';

const at = (x: number, z: number) => new THREE.Vector3(x, height(x, z), z);

/** the owner's stand-in until his own species exists (a mechanic, at least) */
const OWNER_STANDIN = 'r_iman';

/** Oleada 3 species (data/rupturas/especies-o3.json) that exist in the merged content */
function o3Species(): { id: string; name: string }[] {
  const cats = (especiesO3 as unknown as { cats?: { id?: unknown; name?: unknown }[] }).cats;
  if (!Array.isArray(cats)) return [];
  return cats
    .filter((c) => typeof c?.id === 'string' && CAT_BY_ID.has(c.id as string))
    .map((c) => ({ id: c.id as string, name: String(c.name ?? '') }));
}

export interface CometaResidents {
  owner: PaperCat | null;
  ownerHead: THREE.Vector3;
  registro: PaperCat | null;
  welders: (PaperCat | null)[];
  update(dt: number, t: number, night: number): void;
}

export async function residents(ctx: RegionCtx, counter: THREE.Vector3): Promise<CometaResidents> {
  const w = ctx.world;
  const d1 = DOCKS[0];
  const d2 = DOCKS[1];
  const list: SkyCat[] = [
    { id: 'com_cometin', species: 'c_cometin', home: at(CRATER.x + 2, CRATER.z + CRATER.r + 2.5), here: 'Llegó pegado al cometa. Nadie sabe si vino de pasajero o de equipaje, y él tampoco quiere averiguarlo.' },
    { id: 'com_meteoro', species: 'e_meteoro', home: at(RAIL.x + 5, RAIL.z + 5), here: 'Jura que ella hizo el cráter. Cobra por contarlo. Cada vez el cráter es más grande.' },
    { id: 'com_plasmin', species: 'r_plasmin', home: at(REFINERY.x - 7, REFINERY.z + 8), here: 'Catador oficial de Combustible Astral. Lo prueba con la lengua «para medir el octanaje». Tiene los bigotes de punta desde 1998.' },
    { id: 'com_nebulosa', species: 'e_nebulosa', home: at(PLAZA.x - 3, PLAZA.z + 1), here: 'Turista. Le saca fotos a todo con una cámara que no tiene rollo. Dice que se le olvidó en otra galaxia.' },
    { id: 'com_lunita', species: 'c_lunita', home: at(PLAZA.x + 6, PLAZA.z + 7), here: 'Aquí arriba la noche nunca se va del todo. Para ella es perfecto: puede dormir las 24 horas sin culpa.' },
    { id: 'com_solar', species: 'r_solar', home: at(PLAZA.x + 4, PLAZA.z - 3), here: 'Vino a tomar el sol. Aquí el sol está más cerca, así que lo toma más rápido. Ya va por su tercer bronceado del día.' },
  ];
  await Promise.all(list.map((c) => addSkyCat(ctx, { ...c, tags: ['cometa'] })));

  // welders at the drydocks (they stay at their spot; the sparks are theirs)
  const weldSpot = (d: { x: number; z: number; ang: number }, lx: number, lz: number) => {
    const ca = Math.cos(-d.ang);
    const sa = Math.sin(-d.ang);
    const x = d.x + lx * ca + lz * sa;
    const z = d.z - lx * sa + lz * ca;
    return at(x, z);
  };
  const welders = await Promise.all([
    addSkyCat(ctx, { id: 'com_voltio', species: 'c_voltio', home: weldSpot(d1, 0.6, 4.4), acts: 'calm', alive: false, tags: ['cometa'], here: 'Soldador del Dique 1. Suelda sin careta porque «la chispa es él». La chispa le da la razón cada cinco segundos.' }),
    addSkyCat(ctx, { id: 'com_magmito', species: 'r_magmito', home: weldSpot(d2, 1.2, 4.4), acts: 'calm', alive: false, tags: ['cometa'], here: 'Soldador del Dique 2. Le está poniendo aletas a un barco que nunca pidió aletas. El barco ya se resignó.' }),
  ]);
  for (const c of welders) if (c) c.facing = -1;
  // the stargazer on the observatory bench
  const astral = await addSkyCat(ctx, { id: 'com_astral', species: 'r_astral', home: at(TELESCOPE.x + 3.2, TELESCOPE.z + 2.2).add(new THREE.Vector3(0, 0.2, 0)), acts: 'calm', alive: false, tags: ['cometa'], here: 'Lee el futuro en las estrellas. Aquí arriba se ven tantas que el futuro le sale con spoilers. No te los cuenta.' });
  if (astral) astral.brain.look = 0.5;

  // Oleada 3 species (stand-ins until their art lands); the one with the helmet minds the counter
  const o3 = o3Species();
  const ownerSp = o3.find((s) => s.id === 'r_escafandra') ?? o3.find((s) => /pecera|casco|helmet/i.test(`${s.id} ${s.name}`));
  const spots = [at(-10, 4), at(13, 10), at(-4, 18), at(20, -2), at(-18, -6), at(2, -17), at(-12, 22), at(26, 18)];
  await Promise.all(
    o3
      .filter((s) => s !== ownerSp)
      .slice(0, spots.length)
      .map((s, i) => addSkyCat(ctx, { id: `com_o3_${s.id}`, species: s.id, home: spots[i], tags: ['cometa'], here: 'Vive en Puerto Cometa. Aquí todos tienen trabajo, o fingen muy bien.' })),
  );

  // the owner, behind his counter, in his fishbowl
  const owner = await addSkyCat(ctx, {
    id: 'com_dueno',
    species: ownerSp?.id ?? OWNER_STANDIN,
    home: counter.clone(),
    acts: 'calm',
    alive: false,
    tags: ['cometa'],
    title: 'El dueño del Taller · casco de pecera',
    here: 'Dueño del Taller del Casco de Pecera. Lleva una pecera en la cabeza; no tiene pez, pero dice que «por si acaso». Cobra en Combustible Astral y en nada más. Ni en abrazos.',
  });
  const ownerHead = counter.clone().add(new THREE.Vector3(0, (owner?.height ?? 2.5) * 0.78, 0));
  if (owner) owner.facing = -1;

  // REGISTRO 000: night only, on a loose rock off the crest
  const registro = await w.addResident({ id: 'registro000', name: 'REGISTRO 000', slug: 'nadie_static_cat', url: catLiteUrl('nadie_static_cat'), height: 2.4, home: PERCH.clone(), tags: [], acts: 'none', alive: false });
  if (registro) {
    registro.ghost = 1;
    registro.shadowAllowed = false;
    registro.shadow.visible = false;
    registro.blob.visible = false;
    registro.root.visible = false;
    registro.facing = 1;
  }
  ctx.describe.set('registro000', { title: 'REGISTRO 000 · FOLIO 000', text: withRegistroEstado('Especie: desconocida · Elemento: ninguno · Rareza: no aplica · Estado: observando.\n\nSentado en una piedra suelta que se va quedando atrás del cometa. Mira hacia abajo, muy abajo. Cuando te acercas, ya no está.') });

  let flick = 0;
  let weldT = 0;
  return {
    owner,
    ownerHead,
    registro,
    welders,
    update(dt, t, night) {
      // the welders lean into the work now and then
      weldT -= dt;
      if (weldT <= 0) {
        weldT = 1.6;
        for (const c of welders) if (c) c.brain.crouch = Math.random() < 0.5 ? 0.25 : 0;
      }
      // REGISTRO 000: vanishes when the camera gets close (a short static flicker on the way)
      if (registro) {
        const far = w.camera.position.distanceTo(PERCH) > 22;
        const want = night > 0.6 && far;
        if (want !== registro.root.visible) {
          flick += dt;
          if (!want || flick > 0.3) {
            registro.root.visible = want;
            flick = 0;
          } else registro.root.visible = Math.sin(t * 60) > 0;
        }
        registro.shadow.visible = false;
        registro.brain.look = -0.6;
        // the rock drifts a little behind the comet: so does he
        registro.root.position.set(PERCH.x + Math.sin(t * 0.21) * 0.6, PERCH.y + Math.sin(t * 0.37) * 0.35, PERCH.z);
      }
    },
  };
}

/**
 * Low gravity for every cat that walks here (visitors included, they arrive after the region is
 * built): the director leaves its usual tiny hop in `lift`, then this wrapper (it runs right before
 * the cat draws) turns it into a big, slow, floaty one — and sometimes a standing cat jumps on its own.
 */
export function lowGravity(w: World3D, skip: (c: PaperCat) => boolean, dust: (p: THREE.Vector3, big: boolean) => void) {
  const done = new WeakSet<PaperCat>();
  const wrap = (c: PaperCat) => {
    done.add(c);
    if (skip(c)) return;
    const s = { ph: Math.random() * 3, wasUp: false, jt: -1, dur: 2.2, hgt: 2.4, next: 3 + Math.random() * 12 };
    const orig = c.update.bind(c);
    const foot = new THREE.Vector3();
    c.update = (dt: number, cam: THREE.Camera, time: number) => {
      const walk = c.brain.walkS.target;
      const asleep = c.brain.sleepS.target > 0.5;
      let lift = c.lift;
      if (s.jt >= 0) {
        // a moon jump: a slow parabola (it takes its time coming down)
        s.jt += dt;
        const u = s.jt / s.dur;
        if (u >= 1) {
          s.jt = -1;
          c.brain.crouch = 0.35;
          dust(foot.copy(c.root.position), true);
          setTimeout(() => (c.brain.crouch = 0), 180);
        } else {
          const k = u < 0.5 ? u * 2 : 1 - (u - 0.5) * 2;
          lift = Math.max(lift, s.hgt * (1 - Math.pow(1 - k, 2)));
        }
      } else if (walk > 0.25) {
        // walking hops: higher and slower than down on the sea
        s.ph += dt * (2.4 + walk * 1.1);
        const b = Math.abs(Math.sin(s.ph));
        lift = Math.max(lift * 1.8, Math.pow(b, 0.8) * (0.3 + walk * 0.7));
        const up = b > 0.15;
        if (!up && s.wasUp && Math.random() < 0.4) dust(foot.copy(c.root.position), false);
        s.wasUp = up;
      } else if (!asleep) {
        s.next -= dt;
        if (s.next <= 0) {
          s.next = 8 + Math.random() * 18;
          if (Math.random() < 0.55) {
            s.jt = 0;
            s.dur = 1.9 + Math.random() * 0.9;
            s.hgt = 1.6 + Math.random() * 1.6;
            c.brain.emote('happy', 0.6);
            dust(foot.copy(c.root.position), false);
          }
        }
      }
      c.lift = lift;
      orig(dt, cam, time);
    };
  };
  return {
    /** wrap any cat that arrived since the last call */
    update() {
      for (const c of w.cats) if (!done.has(c)) wrap(c);
    },
  };
}
