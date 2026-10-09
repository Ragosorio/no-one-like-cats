/**
 * Who lives on Isla Nácar: the Facetada family (Brillito, Facetas, Espejito, Prismarina) living their
 * ambient lives; Madre Nácar, asleep at the back of the cave until you beat her (then she keeps watch
 * at its mouth); and, at night only, REGISTRO 000 on a far crystal spire — gone when you come close.
 */
import * as THREE from 'three';
import type { RegionCtx } from '../types';
import type { PaperCat } from '../../engine/world/paperCat';
import { catLiteUrl } from '../../art/catArt';
import { CAT_BY_ID } from '../../data/content';
import { CAVE_DEPTH, DOOR, SPIRE, TERRACE, height } from './layout';

interface ResidentDef {
  id: string;
  species: string;
  slug: string;
  tags: string[];
  traits: Record<string, number>;
  home: [number, number];
  h: number;
  /** a line about what they do here */
  here: string;
}

const RESIDENTS: ResidentDef[] = [
  { id: 'nacar_brillito', species: 'c_brillito', slug: 'brillito_crystal_cat', tags: ['crystal'], traits: { playful: 0.75, curious: 0.5 }, home: [-6, 26], h: 2.4, here: 'Aquí les cobra a las gaviotas por verse en las conchas.' },
  { id: 'nacar_facetas', species: 'r_facetas', slug: 'facetas_geode_cat', tags: ['crystal', 'earth'], traits: { playful: 0.3, curious: 0.3 }, home: [12, 4], h: 2.6, here: 'Vigila la geoda. Dice que es su prima. Le ha dado dos mordidas.' },
  { id: 'nacar_espejito', species: 'r_espejito', slug: 'espejito_mirror_cat', tags: ['crystal', 'light'], traits: { playful: 0.55, curious: 0.95 }, home: [13, 9], h: 2.5, here: 'Se mete en los espejos del haz para chismear lo que reflejan.' },
  { id: 'nacar_prismarina', species: 'e_prismarina', slug: 'prismarina_seaglass_cat', tags: ['crystal', 'water'], traits: { playful: 0.8, curious: 0.6 }, home: [-17, 22], h: 2.7, here: 'La capitana de la isla. Nada entre las pozas como si fueran suyas. Lo son.' },
];

const EL: Record<string, string> = { crystal: 'Cristal', earth: 'Tierra', light: 'Luz', water: 'Agua' };

function card(species: string, here: string) {
  const d = CAT_BY_ID.get(species);
  if (!d) return { title: species, text: here };
  const els = d.elements.map((e) => EL[e] ?? e).join(' + ');
  return { title: `${d.name} · ${els}`, text: `${d.epithet}. ${d.lore}\n${here}\n\nCÓMO: ${d.obtain?.how ?? '???'}` };
}

export interface ResidentsApi {
  update(dt: number, t: number, night: number, beam: THREE.Vector3[]): void;
  madre: PaperCat | null;
}

export async function residents(ctx: RegionCtx, o: { madreWon: boolean }): Promise<ResidentsApi> {
  const w = ctx.world;
  await Promise.all(
    RESIDENTS.map(async (r) => {
      const home = new THREE.Vector3(r.home[0], 0, r.home[1]);
      home.y = height(home.x, home.z);
      await w.addResident({ id: r.id, name: CAT_BY_ID.get(r.species)?.name ?? r.id, slug: r.slug, url: catLiteUrl(r.slug), height: r.h, home, tags: r.tags, traits: r.traits });
      ctx.describe.set(r.id, card(r.species, r.here));
    }),
  );
  // one of them wears the CRISTAL lens at night (they glow when the beam passes, too)
  const nightLens = Math.floor(ctx.rng() * RESIDENTS.length);

  // Madre Nácar: asleep deep in the cave, or keeping watch at its mouth once you beat her
  const madreHome = o.madreWon ? new THREE.Vector3(DOOR.x + 2.0, TERRACE, DOOR.z + 2.2) : new THREE.Vector3(DOOR.x + 0.4, TERRACE, DOOR.z - CAVE_DEPTH * 0.5);
  const madre = await w.addResident({ id: 'nacar_madre', name: 'Madre Nácar', slug: 'madrenacar_pearl_cat', url: catLiteUrl('madrenacar_pearl_cat'), height: 3.4, home: madreHome, tags: ['crystal'], acts: o.madreWon ? 'calm' : 'none', alive: false });
  if (madre) {
    madre.brain.sleeping = !o.madreWon;
    madre.facing = -1;
  }
  const md = CAT_BY_ID.get('l_madrenacar');
  ctx.describe.set(
    'nacar_madre',
    o.madreWon
      ? {
          title: 'Madre Nácar · Primordial del Cristal',
          text: `«Los cristales recordamos todo lo que reflejamos. De noche, en el pico de cristal del mar, hay un gato sentado mirando tu isla. Tú tampoco lo viste la primera vez.»\n\n${md?.lore ?? ''}`,
        }
      : {
          title: 'Madre Nácar · Primordial del Cristal',
          text: 'Duerme al fondo de la Caverna que Recuerda. Ronca en Do mayor y los cristales le hacen coro.\n\nCÓMO: guía el haz hasta la puerta de cristal, vence a Prismarina y luego a ella, en la caverna. Se queda contigo.',
        },
  );

  // REGISTRO 000: night only, on the far spire. Never there when you come close.
  const regHome = new THREE.Vector3(SPIRE.x, SPIRE.top, SPIRE.z);
  const reg = await w.addResident({ id: 'registro000', name: 'REGISTRO 000', slug: 'nadie_static_cat', url: catLiteUrl('nadie_static_cat'), height: 2.3, home: regHome, tags: [], acts: 'none', alive: false });
  if (reg) {
    reg.ghost = 1;
    reg.facing = 1;
    reg.root.visible = false;
  }
  ctx.describe.set('registro000', { title: 'REGISTRO 000 · FOLIO 000', text: 'Especie: desconocida · Elemento: ninguno · Rareza: no aplica · Estado: observando.\n\nSentado en el pico de cristal, mirando hacia tu isla. Cuando te acercas, ya no está.' });

  const lensHold = new Map<string, number>();
  let zzzT = 0;
  let flick = 0;
  const camD = new THREE.Vector3();
  return {
    madre,
    update(dt, t, night, beam) {
      // REGISTRO 000: vanishes when the camera gets close (with a short static flicker)
      if (reg) {
        const far = w.camera.position.distanceTo(camD.copy(regHome)) > 22;
        const want = night > 0.55 && far;
        if (want !== reg.root.visible) {
          flick += dt;
          if (!want || flick > 0.25) {
            reg.root.visible = want;
            flick = 0;
          } else reg.root.visible = Math.sin(t * 60) > 0;
        }
      }
      // Madre Nácar breathes pearls in her sleep
      if (madre && !o.madreWon) {
        madre.brain.sleeping = true;
        zzzT -= dt;
        if (zzzT <= 0) {
          zzzT = 1.6;
          w.pools.motes.emit({ pos: { x: madreHome.x, y: madreHome.y + 2.4, z: madreHome.z + 0.6 }, vel: { x: 0.1, y: 0.5, z: 0.25 }, life: 2.6, size: 0.32, color: '#f7f2ff', color2: '#b79cff', count: 1 });
        }
      }
      // the CRISTAL lens: whoever stands in the beam glows (and one resident wears it at night)
      for (const [id, r] of w.residents) {
        if (id === 'registro000' || id === 'nacar_madre') continue;
        const p = r.cat.root.position;
        let near = false;
        const mid = p.y + r.cat.lift + r.cat.height * 0.5;
        for (let i = 0; i < beam.length - 1 && !near; i++) {
          const a = beam[i];
          const b = beam[i + 1];
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const L2 = dx * dx + dz * dz || 1;
          const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L2));
          const by = a.y + (b.y - a.y) * k;
          near = Math.hypot(p.x - (a.x + dx * k), p.z - (a.z + dz * k)) < 1.5 && Math.abs(mid - by) < r.cat.height * 0.75;
        }
        const hold = Math.max(0, (lensHold.get(id) ?? 0) - dt);
        lensHold.set(id, near ? 1.4 : hold);
        const chosen = night > 0.5 && id === RESIDENTS[nightLens].id;
        r.cat.lens = near || hold > 0 || chosen ? 1 : 0;
      }
    },
  };
}
