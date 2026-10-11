/**
 * Who is in the Archipiélago de los Sueños:
 *  - YOUR sleepers: every cat that sleeps on your island tonight dreams here, curled on a pillow on its own
 *    islet (painted in watercolor: the ACUARELA lens of PaperCat). Tap one: it's dreaming — don't wake it.
 *  - Duermevela on her galleon's deck, yawning orders; Almohadón asleep on a pillow-cloud by the galleon
 *    until you win H58 (then he's on your ship); Sonámbulo wandering the beach with his eyes shut.
 *  - a few locals who fell asleep here once and never quite left (Nimbo, Lunita).
 */
import * as THREE from 'three';
import type { RegionCtx } from '../types';
import type { PaperCat } from '../../engine/world/paperCat';
import { artSlug, catLiteUrl, standInTint } from '../../art/catArt';
import { CAT_BY_ID } from '../../data/content';
import { G } from '../../state/game';
import { catSlug } from '../../state/sys/forms';
import { addSkyCat } from '../cielo/cats';
import { elLook } from '../fronteras/kit';
import type { DreamIsle } from './layout';
import { GALLEON, PLAZA, height } from './layout';

const RARITY_H: Record<string, number> = { common: 2.4, rare: 2.5, epic: 2.7, legendary: 3.1, mythic: 3.2, heroic: 3.0, divine: 3.3 };
const at = (x: number, z: number) => new THREE.Vector3(x, height(x, z), z);

const DREAMS: Record<string, string> = {
  fire: 'un volcán de algodón de azúcar que echa humo rosa',
  water: 'una bola de mar que flota y no se cae',
  nature: 'flores más altas que un faro y un hongo para la siesta',
  earth: 'piedras que se acomodan solas, una encima de otra',
  storm: 'su propia nube, lloviéndole encima nomás a ella',
  ice: 'cristales de hielo que no se derriten ni con abrazos',
  magic: 'libros que vuelan solos y se leen en voz alta',
  cosmic: 'planetas chiquitos que le dan vueltas a la cabeza',
  void: 'un hoyo que no refleja nada, y planetas que lo esquivan',
  sound: 'trompetas que suenan nomás cuando nadie escucha',
  shadow: 'una sombra que se acuesta para el otro lado',
  time: 'un reloj de arena donde la arena sube',
  light: 'cristales que guardan el sol para la noche',
  crystal: 'cristales que cantan cuando nadie los ve',
  gravity: 'piedras que flotan y agua que se va para arriba',
};
export const dreamText = (el: string) => DREAMS[el] ?? 'algo que todavía no tiene nombre';

export interface Sleeper {
  cat: PaperCat;
  isle: DreamIsle;
  id: string;
}

export interface SuenosResidents {
  sleepers: Sleeper[];
  duermevela: PaperCat | null;
  almohadon: PaperCat | null;
  update(dt: number, t: number, night: number): void;
}

export async function residents(ctx: RegionCtx, isles: DreamIsle[], deck: () => THREE.Vector3, h58Done: boolean): Promise<SuenosResidents> {
  const w = ctx.world;
  // ── your sleepers, each on its islet (static: the islet carries them) ──
  const sleepers: Sleeper[] = [];
  await Promise.all(
    isles.map(async (isle) => {
      const d = isle.who;
      if (!d) return;
      const own = G.s.cats.find((c) => c.uid === d.uid);
      const def = CAT_BY_ID.get(d.species);
      const slug = own ? catSlug(own) : def?.art.slug ?? d.species;
      const drawn = artSlug(slug);
      const id = `sueno_${d.uid}`;
      const cat = await w.addResident({ id, name: d.name, slug: drawn, url: catLiteUrl(drawn), height: (RARITY_H[def?.rarity ?? 'common'] ?? 2.5) * 0.92, home: new THREE.Vector3(isle.x, isle.y, isle.z), tags: [...d.elements, 'dreamer'], acts: 'none', alive: false });
      if (!cat) return;
      const tint = standInTint(slug);
      if (tint !== undefined) cat.flash(tint, 0.22);
      cat.brain.sleeping = true;
      cat.lens = 4;
      cat.shadowAllowed = false;
      cat.shadow.visible = false;
      cat.facing = Math.random() < 0.5 ? -1 : 1;
      sleepers.push({ cat, isle, id });
      ctx.describe.set(id, {
        title: `${d.name} · soñando`,
        text: `En tu isla está dormido${d.sleepy ? ' (como siempre)' : ''}. Aquí está soñando ${dreamText(isle.el)}.\n\nLuzterna: «No lo despiertes. Es de mala suerte. Y se pone de malas.»`,
      });
    }),
  );

  // ── Duermevela on her deck ──
  const duermevela = await addSkyCat(ctx, {
    id: 'sue_duermevela',
    species: 'e_duermevela',
    home: deck(),
    acts: 'calm',
    alive: false,
    tags: ['suenos'],
    title: 'Duermevela · capitana del Archipiélago',
    here: h58Done
      ? 'Te ganó el sueño, no la pelea: eso dice ella. Sigue en su cubierta, bostezando órdenes a una tripulación que ronca.'
      : 'Capitanea un barco que solo existe mientras alguien lo sueña. Por eso no deja dormir a nadie… menos a ella.',
  });
  if (duermevela) {
    duermevela.facing = -1;
    duermevela.lens = 4;
  }

  // ── Almohadón, asleep on a pillow-cloud by the galleon (yours after H58) ──
  let almohadon: PaperCat | null = null;
  if (!h58Done) {
    almohadon = await addSkyCat(ctx, {
      id: 'sue_almohadon',
      species: 'c_almohadon',
      home: new THREE.Vector3(GALLEON.x + 7, 3.4, GALLEON.z + 6),
      acts: 'none',
      alive: false,
      tags: ['suenos'],
      here: 'Flota a medio metro de todo y ronca en acuarela. Nadie sabe si es un gato dormido en una almohada o una almohada que sueña que es gato.',
    });
    if (almohadon) {
      almohadon.brain.sleeping = true;
      almohadon.lens = 4;
      almohadon.shadowAllowed = false;
      almohadon.shadow.visible = false;
    }
  }

  // ── Sonámbulo and the locals who stayed ──
  const sonambulo = await addSkyCat(ctx, { id: 'sue_sonambulo', species: 'r_sonambulo', home: at(PLAZA.x - 8, PLAZA.z + 9), tags: ['suenos'], here: 'Se durmió aquí hace mucho y nunca terminó de despertar. Camina con los ojos cerrados y no se tropieza con nada. Tú sí te tropiezas con él.' });
  if (sonambulo) sonambulo.lens = 4;
  await Promise.all([
    addSkyCat(ctx, { id: 'sue_nimbo', species: 'c_nimbo', home: at(PLAZA.x + 9, PLAZA.z - 4), tags: ['suenos'], here: 'Una nube que se quedó dormida aquí arriba. Sigue lloviendo dormida, pero solo un poquito y solo sobre sí misma.' }),
    addSkyCat(ctx, { id: 'sue_lunita', species: 'c_lunita', home: at(PLAZA.x - 12, PLAZA.z - 9), tags: ['suenos'], here: 'Vino porque aquí siempre es hora de dormir. Lleva tres días en la misma siesta y dice que apenas va a la mitad.' }),
  ]).then((cs) => cs.forEach((c) => c && (c.lens = 4)));

  let yawnT = 3;
  let sonT = 5;
  const base = duermevela ? duermevela.root.position.clone() : null;
  return {
    sleepers,
    duermevela,
    almohadon,
    update(dt, t) {
      // the sleepers ride their islets (positions set by the region) and breathe slowly
      for (const s of sleepers) s.cat.brain.crouch = 0.12 + Math.sin(t * 0.9 + s.isle.seed) * 0.08;
      // Duermevela: yawns an order every few seconds, the deck rocks her
      if (duermevela && base) {
        const d = deck();
        duermevela.root.position.copy(d);
        duermevela.ground = d.y;
        yawnT -= dt;
        if (yawnT <= 0) {
          yawnT = 4 + Math.random() * 4;
          duermevela.brain.emote('sleepy', 1);
          ctx.world.pools.motes.emit({ pos: { x: d.x, y: d.y + 3, z: d.z }, vel: { x: 0.2, y: 0.6, z: 0 }, life: 2.4, size: 0.4, color: '#e6dcff', color2: '#ffffff', count: 3 });
        }
      }
      if (almohadon) {
        almohadon.lift = Math.sin(t * 0.8) * 0.3;
        if (Math.random() < dt * 0.6) ctx.world.life.fx.zzz(almohadon.root.position);
      }
      if (sonambulo) {
        sonT -= dt;
        if (sonT <= 0) {
          sonT = 3 + Math.random() * 3;
          sonambulo.brain.emote('sleepy', 0.8);
          ctx.world.life.fx.zzz(sonambulo.root.position);
        }
      }
    },
  };
}

/** the sleeper's islet glow color (its element) */
export const sleeperGlow = (el: string) => elLook(el).glow;
