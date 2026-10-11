/**
 * Residents of the sky regions. Oleada 2's own species (data/rupturas/especies-o2.json) may not have
 * their paintings yet: they are drawn with their STAND-IN painting (art/catArt.ts artSlug), tinted the
 * way the 2D game tints it, until the real art + rig land — then the same call draws the real cat.
 */
import * as THREE from 'three';
import type { RegionCtx } from '../types';
import type { PaperCat } from '../../engine/world/paperCat';
import { artSlug, catLiteUrl, standInTint } from '../../art/catArt';
import { CAT_BY_ID } from '../../data/content';

const EL: Record<string, string> = {
  fire: 'Fuego',
  water: 'Agua',
  nature: 'Naturaleza',
  earth: 'Tierra',
  storm: 'Tormenta',
  magic: 'Magia',
  cosmic: 'Cósmico',
  void: 'Vacío',
  ice: 'Hielo',
  sound: 'Sonido',
  shadow: 'Sombra',
  time: 'Tiempo',
  light: 'Luz',
  crystal: 'Cristal',
  gravity: 'Gravedad',
};
const RARITY_H: Record<string, number> = { common: 2.4, rare: 2.5, epic: 2.7, legendary: 3.1, mythic: 3.2, heroic: 3.0, divine: 3.3 };
const TRAITS: Record<string, Record<string, number>> = {
  perezoso: { playful: 0.2, curious: 0.25 },
  dormilon: { playful: 0.2, curious: 0.4 },
  travieso: { playful: 0.9, curious: 0.7 },
  curioso: { playful: 0.5, curious: 0.95 },
  impaciente: { playful: 0.85, curious: 0.9 },
  bravucon: { playful: 0.8, curious: 0.5 },
  leal: { playful: 0.45, curious: 0.5 },
  gloton: { playful: 0.4, curious: 0.6 },
  miedoso: { playful: 0.3, curious: 0.3 },
};

export interface SkyCat {
  id: string;
  species: string;
  home: THREE.Vector3;
  /** what it does HERE (the card's middle line) */
  here: string;
  h?: number;
  acts?: 'all' | 'calm' | 'battle' | 'none';
  alive?: boolean;
  tags?: string[];
  /** card title override (e.g. «Ciudadano ejemplar») */
  title?: string;
}

/** add a resident by species id (stand-in painting while its art isn't in) and its info card */
export async function addSkyCat(ctx: RegionCtx, o: SkyCat): Promise<PaperCat | null> {
  const def = CAT_BY_ID.get(o.species);
  const slug = def?.art.slug ?? o.species;
  const drawn = artSlug(slug);
  const cat = await ctx.world.addResident({
    id: o.id,
    name: def?.name ?? o.species,
    slug: drawn,
    url: catLiteUrl(drawn),
    height: o.h ?? RARITY_H[def?.rarity ?? 'common'] ?? 2.5,
    home: o.home,
    tags: [...(def?.elements ?? []), ...(o.tags ?? [])],
    traits: TRAITS[def?.trait ?? ''] ?? { playful: 0.5, curious: 0.5 },
    acts: o.acts,
    alive: o.alive,
  });
  const tint = standInTint(slug);
  if (cat && tint !== undefined) cat.flash(tint, 0.22);
  const els = (def?.elements ?? []).map((e) => EL[e] ?? e).join(' + ');
  ctx.describe.set(o.id, {
    title: o.title ?? (def ? `${def.name} · ${els}` : o.species),
    text: def ? `${def.epithet ? def.epithet.charAt(0).toUpperCase() + def.epithet.slice(1) + '. ' : ''}${o.here}\n\nCÓMO: ${def.obtain?.how ?? '???'}` : o.here,
  });
  return cat;
}
