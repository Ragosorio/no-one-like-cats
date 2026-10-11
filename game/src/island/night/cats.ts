/**
 * How each cat takes a sky that misbehaves (by personality, data/content.json `trait`):
 *   curioso / chismoso / presumido / leal / callejero → gaze      (stands tall, head turned to the light)
 *   miedoso                                            → cower     (crouched, ears back)
 *   dormilón / perezoso                                → sleep     (nope: keeps sleeping, Zzz)
 *   travieso / impaciente / glotón                     → chase     (hops at the stars)
 *   bravucón / rencoroso / pirómano                    → challenge (hisses at the sky)
 *   Canelo                                             → chase, and he's the first one to jump
 * `look.cats` (0..1) says how many react: a stable order (by uid) so they join one by one in a cinematic.
 */
import { catDef } from '../../data/content';
import type { CatActor, NightReaction } from '../catActor';

const BY_TRAIT: Record<string, NightReaction> = {
  curioso: 'gaze',
  chismoso: 'gaze',
  presumido: 'gaze',
  leal: 'gaze',
  callejero: 'gaze',
  miedoso: 'cower',
  dormilon: 'sleep',
  perezoso: 'sleep',
  travieso: 'chase',
  impaciente: 'chase',
  gloton: 'chase',
  bravucon: 'challenge',
  rencoroso: 'challenge',
  piromano: 'challenge',
};

export function reactionFor(species: string): NightReaction {
  if (species === 'c_canelo') return 'chase';
  let trait = '';
  try {
    trait = catDef(species)?.trait ?? '';
  } catch {
    /* unknown species */
  }
  return BY_TRAIT[trait] ?? 'gaze';
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** react order: the curious first, the sleepy last; ties by uid hash (stable across frames and reloads) */
const ORDER: Record<NightReaction, number> = { gaze: 0, chase: 0.15, challenge: 0.3, cower: 0.45, sleep: 0.9 };
export function reactOrder(a: { catUid: string; species: string }) {
  return ORDER[reactionFor(a.species)] + hash(a.catUid) * 0.5;
}

/** apply `frac` of the cats' reactions (others: normal life), all looking toward `skyAt` (global) */
export function applyCatNight(actors: CatActor[], frac: number, skyAt: { x: number; y: number } | null) {
  if (frac <= 0.001) {
    for (const a of actors) a.night = null;
    return;
  }
  const sorted = [...actors].sort((a, b) => reactOrder(a) - reactOrder(b));
  const n = Math.round(sorted.length * Math.min(1, frac));
  sorted.forEach((a, i) => {
    a.night = i < n ? reactionFor(a.species) : null;
    a.skyAt = skyAt;
  });
}
