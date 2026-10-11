/**
 * Parte II · Oleada 4 · H58 «El Archipiélago de los Sueños»: the islands change with WHO SLEEPS ON YOUR ISLAND
 * (guion 13 · biblia 05 §4 «Las fronteras»). Pure reading of the save — no clocks, no randomness — so the region
 * (regions/suenos.ts paints the dream) and the battle (battle/suenos.ts draws its dream rules) always agree.
 *
 *   dreamersOf(save)   the cats that dream tonight: sleepy personalities first (dormilón, perezoso), then whoever
 *                      lives in a habitat, in a stable order; never more than DREAMERS_MAX
 *   dreamWeights(save) element → weight of the dream (each dreamer's elements; the first element counts double)
 *   dreamSeed(save)    a stable number from the dreamers (same island → same dream)
 */
import { CAT_BY_ID } from '../../data/content';
import type { GameState, OwnedCat } from '../game';

export const DREAMERS_MAX = 6;
/** personalities that are asleep whenever they can (island/night/cats.ts makes them sleep under the astral sky too) */
export const SLEEPY_TRAITS = ['dormilon', 'perezoso'];

export interface Dreamer {
  uid: string;
  species: string;
  name: string;
  elements: string[];
  /** a sleepy personality (the strongest dreams) */
  sleepy: boolean;
}

type DreamSave = Pick<GameState, 'cats'> & Partial<Pick<GameState, 'habitats'>>;

function elementsOf(c: OwnedCat): string[] {
  return [...(CAT_BY_ID.get(c.species)?.elements ?? [])];
}

/** who dreams tonight (stable: same save → same list) */
export function dreamersOf(save: DreamSave | null | undefined): Dreamer[] {
  const cats = save?.cats ?? [];
  if (!cats.length) return [];
  const housed = new Set((save?.habitats ?? []).flatMap((h) => h.cats ?? []));
  const rank = (c: OwnedCat) => (SLEEPY_TRAITS.includes(c.trait) ? 0 : housed.has(c.uid) ? 1 : 2);
  const sorted = [...cats].sort((a, b) => rank(a) - rank(b) || (a.bornAtMs ?? 0) - (b.bornAtMs ?? 0) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  return sorted.slice(0, DREAMERS_MAX).map((c) => ({ uid: c.uid, species: c.species, name: c.name, elements: elementsOf(c), sleepy: SLEEPY_TRAITS.includes(c.trait) }));
}

/** element → weight (a sleepy dreamer weighs ×2; the cat's first element counts double) */
export function dreamWeights(save: DreamSave | null | undefined): Record<string, number> {
  const w: Record<string, number> = {};
  for (const d of dreamersOf(save)) {
    const k = d.sleepy ? 2 : 1;
    d.elements.forEach((e, i) => (w[e] = (w[e] ?? 0) + k * (i === 0 ? 2 : 1)));
  }
  return w;
}

/** the dream's dominant elements, strongest first (ties: alphabetical, stable) */
export function dreamElements(save: DreamSave | null | undefined, n = 3): string[] {
  const w = dreamWeights(save);
  return Object.keys(w)
    .sort((a, b) => w[b] - w[a] || (a < b ? -1 : 1))
    .slice(0, n);
}

/** a stable 31-bit number from the dreamers (FNV-1a over their species) */
export function dreamSeed(save: DreamSave | null | undefined): number {
  let h = 0x811c9dc5;
  for (const d of dreamersOf(save)) for (let i = 0; i < d.species.length; i++) h = Math.imul(h ^ d.species.charCodeAt(i), 0x01000193);
  return (h >>> 1) || 1;
}

/**
 * (ext) the dream's MUSIC: amb.suenos has one in-sync layer per KIND of sleeper (src/audio/layers.ts, docs/part-ii/30):
 * calido (kalimba) · agua (glass, droplets) · magia (celesta, choir: the arc cell falling) · hondo (reversed piano, a
 * low music box). Each element belongs to one kind; a kind that dreams tonight sounds at 0.45–1 (the strongest at 1),
 * the others are silent. No dreamers → only the base (the lullaby).
 */
export type DreamLayer = 'calido' | 'agua' | 'magia' | 'hondo';
export const DREAM_LAYER_OF: Record<string, DreamLayer> = {
  fire: 'calido', earth: 'calido', nature: 'calido', light: 'calido',
  water: 'agua', ice: 'agua', wind: 'agua', storm: 'agua', electric: 'agua',
  magic: 'magia', spirit: 'magia', cosmic: 'magia', time: 'magia', sound: 'magia', crystal: 'magia',
  shadow: 'hondo', void: 'hondo', gravity: 'hondo', tech: 'hondo',
};
export function dreamLayers(save: DreamSave | null | undefined): Record<DreamLayer, number> {
  const fam: Record<DreamLayer, number> = { calido: 0, agua: 0, magia: 0, hondo: 0 };
  for (const [el, v] of Object.entries(dreamWeights(save))) {
    const k = DREAM_LAYER_OF[el];
    if (k) fam[k] += v;
  }
  const max = Math.max(...Object.values(fam));
  for (const k of Object.keys(fam) as DreamLayer[]) fam[k] = max > 0 && fam[k] > 0 ? Math.round((0.45 + (0.55 * fam[k]) / max) * 100) / 100 : 0;
  return fam;
}
