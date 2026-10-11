/**
 * BALANCE DE JEFES — how a Parte II story battle scales with your crew (docs/part-ii/27-oleada-4.md §Balance de jefes,
 * doc 16 §4b). Pure: it reads only the crew's cats (species / level / stars: the same stats the estimate's signature
 * reads) and the battle's band, so the BattleSpec the screen plays and the one the estimate worker sims are the same.
 *
 * Every story battle already fights at «your Poder × powerMul» (storyBattles.storyPower). A Parte II battle also has a
 * DIFFICULTY BAND (StoryBattleDef.band):
 *   · historia  regular story fights      — target ~85–95 % wins at the crew the story expects
 *   · jefe      the Oleadas' bosses       — ~70–85 %  (H49, H57, H62)
 *   · final     the saga's last boss      — ~55–70 %  (H63)
 * and the band adds two things on top of powerMul:
 *   1. its BASE bite (`base`), at every crew level: the floor, so a boss is never trivial — a Nv30 crew that reaches
 *      H63 faces the same ratio as a Nv50 one (it follows your fleet, it never walls you);
 *   2. past Nv50, a LEVEL term: crew level L (mean of the crew) → x = (min(L,100) − 50) / 50 ∈ [0, 1];
 *        enemy Poder × (1 + over · x)               (over = 0 today: measured, your ★ don't move a Poder-ratio fight)
 *        enemy level = min(100, L + lvl)            (was capped at 50; past Nv20 a level changes nothing in the sim)
 *        enemy ★ (jefe / final only) = the ★ that level needs (+1 per 10 levels past 50, like yours:
 *          econ.catLevelCapFor), at most ★5 → +8 % crew hp per ★ and ★5 double ults: a boss rises with you
 *      At L ≤ 50 the term is exactly 1 and the old level / ★1 (tests/storyScale.test.ts).
 * Tuning, per crew Nv30–100 (scripts/balance-jefes.ts): docs/part-ii/27-oleada-4.md §Balance de jefes.
 * Battles without a band (Parte I: grietas, final del archivo, H11–H20) never pass through here: identical forever.
 */
import { G } from '../game';
import { cat as getCat } from './cats';

export type StoryBand = 'historia' | 'jefe' | 'final';

export interface BandTune {
  /** enemy Poder × this at every level (the floor) */
  base: number;
  /** past Nv50: enemy Poder × (1 + over · x), x = 0 at Nv50 → 1 at Nv100 */
  over: number;
  /** past Nv50: the enemy shows (and fights at) your crew level + this */
  lvl: number;
  /** past Nv50: its cats also wear the ★ that level needs (+8 % crew hp per ★, ★5 double ults) — a boss rises with you */
  stars: boolean;
}

/** exported (mutable) for the balance scripts; `off` = the story battles as before the bands */
export const STORY_SCALE: { off: boolean; from: number; to: number; mirrorMaxStars: number; bands: Record<StoryBand, BandTune> } = {
  off: false,
  from: 50,
  to: 100,
  /** the ★ a boss copies stop at ★5: ★6 is yours alone (a maxed crew should feel strong — owner's call, 2026-10-10) */
  mirrorMaxStars: 5,
  bands: {
    historia: { base: 1, over: 0, lvl: 0, stars: false },
    jefe: { base: 1.1, over: 0, lvl: 2, stars: true },
    final: { base: 1.56, over: 0, lvl: 5, stars: true },
  },
};

export function storyBand(def: { band?: StoryBand } | undefined): StoryBand | undefined {
  return def?.band;
}

/** the crew level the scaling reads: the mean level of the crew's cats (0 for an empty crew) */
export function crewLevel(uids: string[], save = G.s): number {
  let n = 0;
  let sum = 0;
  for (const u of uids) {
    const c = save === G.s ? getCat(u) : save.cats.find((k) => k.uid === u);
    if (!c) continue;
    n++;
    sum += c.level;
  }
  return n ? sum / n : 0;
}

export interface StoryScale {
  band: StoryBand;
  /** crew level read */
  level: number;
  /** enemy Poder multiplier on top of powerMul */
  mul: number;
  /** enemy cats' level / stars past Nv50 (undefined at ≤ 50: the old level, ★1) */
  enemyLevel?: number;
  enemyStars?: number;
}

/** the minimum ★ a cat needs to stand at `level` (the inverse of econ.catLevelCapFor past 50) */
export function starsForLevel(level: number) {
  if (level <= STORY_SCALE.from) return 1;
  return Math.min(6, 1 + Math.ceil((level - STORY_SCALE.from) / 10));
}

/** pure: the scaling for a band at crew level L */
export function scaleFor(band: StoryBand, L: number): StoryScale {
  const t = STORY_SCALE.bands[band];
  const { from, to } = STORY_SCALE;
  const x = Math.max(0, Math.min(1, (Math.min(L, to) - from) / (to - from)));
  const s: StoryScale = { band, level: L, mul: t.base * (1 + t.over * x) };
  if (x > 0) {
    s.enemyLevel = Math.max(1, Math.min(to, Math.round(L + t.lvl)));
    if (t.stars) s.enemyStars = Math.min(STORY_SCALE.mirrorMaxStars, starsForLevel(s.enemyLevel));
  }
  return s;
}

/** the scaling of one story battle for this crew (null: a battle without a band, or the scaling switched off) */
export function storyScale(def: { band?: StoryBand }, crewUids: string[], save = G.s): StoryScale | null {
  const band = storyBand(def);
  if (!band || STORY_SCALE.off) return null;
  return scaleFor(band, crewLevel(crewUids, save));
}
