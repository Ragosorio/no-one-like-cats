/**
 * El Podio (system): unlock, ladder progress, per-cat podio XP/levels, fighters, rewards.
 * Save: GameState.podio (podio/types.ts; defaulted by defaultState + normalize).
 *
 * Unlock: after Boss 1 (flag `podio_unlocked`). Old saves past it get it through the patch below.
 * Rewards per win: gold + food (income-scaled), orbs of THAT cat, Ronroneo (G.purr: half to the
 * vault, half rushes the running timers), podio XP for that cat, rare gems; first win over each
 * league champion pays extra.
 */
import { G, OwnedCat } from '../game';
import { RarityId, catPower } from '../econ';
import { CAT_BY_ID, ROLE_BY_ID, affinityMult, catDef } from '../../data/content';
import PB from '../../data/podio.json';
import { registerPatch } from '../patches';
import { accessoryMods } from './accessories';
import { rankDmgBonus } from './ranks';
import { defaultPodio, PodioCatState, PodioState } from '../../podio/types';
import { powerLevels, powersOf } from '../../podio/powers';
import { RivalDef, league, rival } from '../../podio/ladder';
import type { FighterInit } from '../../podio/engine';

export const PODIO_FLAG = 'podio_unlocked';
export const SPEEDS = [0.5, 1, 2, 4] as const;

export function ps(): PodioState {
  G.s.podio ??= defaultPodio();
  const p = G.s.podio;
  p.cats ??= {};
  p.champions ??= [];
  p.stats ??= { wins: 0, losses: 0, perfects: 0 };
  if (!SPEEDS.includes(p.speed as (typeof SPEEDS)[number])) p.speed = 1;
  p.league = Math.max(1, Math.floor(p.league || 1));
  p.bout = Math.max(0, Math.min(PB.ladder.bouts_per_league - 1, Math.floor(p.bout || 0)));
  return p;
}

export function podioUnlocked() {
  return G.has(PODIO_FLAG) || G.s.campaign.bossesDefeated >= PB.unlock.boss;
}

// ------------------------------------------------------------------ per-cat podio level
export function catState(uid: string): PodioCatState {
  const p = ps();
  return (p.cats[uid] ??= { xp: 0, lvl: 1, wins: 0, losses: 0 });
}
/** read-only view (doesn't create an entry for cats that never fought) */
export function peekCat(uid: string): PodioCatState {
  return ps().cats[uid] ?? { xp: 0, lvl: 1, wins: 0, losses: 0 };
}
export function peekLevel(uid: string) {
  return ps().cats[uid]?.lvl ?? 1;
}
export function xpNeed(lvl: number) {
  return Math.round(PB.levels.xp_base * Math.pow(PB.levels.xp_growth, lvl - 1));
}
/** podio level cap: island/ship progress (cat level + stars) opens room to grow on the podio */
export function levelCap(c: OwnedCat) {
  const L = PB.levels;
  return Math.max(1, Math.min(L.max, 1 + Math.floor(c.level / L.cap_per_cat_levels) + (c.stars - 1) * L.cap_per_star));
}
/** cat level needed for the next cap step */
export function nextCapLevel(c: OwnedCat) {
  return (Math.floor(c.level / PB.levels.cap_per_cat_levels) + 1) * PB.levels.cap_per_cat_levels;
}

export interface XpGain {
  before: number;
  after: number;
  xpBefore: number;
  xpAfter: number;
  gained: number;
  /** slots whose level went up (0..3) */
  powerUps: number[];
  /** slots unlocked by this gain */
  unlocked: number[];
  capped: boolean;
}

export function addPodioXp(c: OwnedCat, n: number): XpGain {
  const st = catState(c.uid);
  const before = st.lvl;
  const xpBefore = st.xp;
  const lvBefore = powerLevels(before);
  const cap = levelCap(c);
  st.xp += Math.round(n);
  while (st.lvl < cap && st.xp >= xpNeed(st.lvl)) {
    st.xp -= xpNeed(st.lvl);
    st.lvl++;
  }
  // at the cap the bar fills but doesn't overflow (feed the cat on the island to raise the cap)
  const capped = st.lvl >= cap && st.lvl < PB.levels.max;
  if (st.lvl >= cap) st.xp = Math.min(st.xp, xpNeed(st.lvl) - 1);
  if (st.lvl >= PB.levels.max) st.xp = 0;
  const lvAfter = powerLevels(st.lvl);
  const powerUps = [0, 1, 2, 3].filter((i) => lvAfter[i] > lvBefore[i] && lvBefore[i] > 0);
  const unlocked = [0, 1, 2, 3].filter((i) => lvAfter[i] > 0 && lvBefore[i] === 0);
  if (st.lvl > before) G.recalc(); // island gold bonus changed
  return { before, after: st.lvl, xpBefore, xpAfter: st.xp, gained: Math.round(n), powerUps, unlocked, capped };
}

// ------------------------------------------------------------------ fighters
/** podio combat power of an owned cat: the same power as on the ship (level, stars) + accessories + K.O. rank */
export function catPodioPower(c: OwnedCat) {
  const def = catDef(c.species);
  const acc = accessoryMods(c);
  return catPower(def.rarity, c.level, c.stars) * acc.powMul * (1 + rankDmgBonus(c.kos ?? 0));
}
/** role shapes the duel stats: tanks get more HP and hit softer, snipers the opposite (dampened from the ship roles) */
export function roleHp(role: string) {
  return Math.pow((ROLE_BY_ID.get(role)?.hp ?? 100) / 100, PB.stats.role_hp_exp);
}
export function roleAtk(role: string) {
  return Math.pow(100 / (ROLE_BY_ID.get(role)?.hp ?? 100), PB.stats.role_atk_exp);
}
export function catPodioHp(c: OwnedCat) {
  const def = catDef(c.species);
  const acc = accessoryMods(c);
  return catPodioPower(c) * PB.stats.hp_per_power * roleHp(def.role) * acc.hpMul * (c.mutation === 'fosilizado' ? 1.2 : 1);
}

export function playerFighter(c: OwnedCat): FighterInit {
  const def = catDef(c.species);
  return {
    side: 0,
    species: c.species,
    name: c.name,
    owner: (G.s.player?.name || 'TÚ').toUpperCase(),
    slug: def.art.slug,
    elements: [...def.elements],
    rarity: def.rarity,
    role: def.role,
    level: c.level,
    stars: c.stars,
    podioLvl: peekLevel(c.uid),
    power: catPodioPower(c) * roleAtk(def.role),
    hp: catPodioHp(c),
    powers: powersOf(c.species),
    trait: c.trait,
    mutation: c.mutation,
  };
}

export function rivalFighter(r: RivalDef): FighterInit {
  const def = r.def;
  return {
    side: 1,
    species: r.species,
    name: def.name,
    owner: r.trainer,
    slug: def.art.slug,
    elements: [...def.elements],
    rarity: def.rarity,
    role: def.role,
    level: r.level,
    stars: r.stars,
    podioLvl: r.podioLvl,
    power: r.power * roleAtk(def.role),
    hp: r.power * PB.stats.hp_per_power * roleHp(def.role) * (r.champion ? 1.1 : 1),
    powers: powersOf(r.species),
    trait: def.trait,
    mutation: null,
  };
}

// ------------------------------------------------------------------ ladder
function islandSeed() {
  return Math.floor(G.s.createdAt / 1000) % 1_000_000_007;
}
export function rivalAt(lg: number, bout: number): RivalDef {
  const owned = new Set(Object.entries(G.s.catdex).filter(([, v]) => v === 'registered').map(([k]) => k));
  return rival(lg, bout, islandSeed(), G.s.elements, owned);
}
export function currentRival() {
  const p = ps();
  return rivalAt(p.league, p.bout);
}
export { league };

/** a bout already beaten (replays pay less) */
export function isReplay(lg: number, bout: number) {
  const p = ps();
  return lg < p.league || (lg === p.league && bout < p.bout);
}

/** AI sharpness grows with the league */
export function aiSkill(lg: number, champion: boolean) {
  return Math.min(0.97, 0.55 + lg * 0.06 + (champion ? 0.12 : 0));
}

// ------------------------------------------------------------------ rewards
export interface PodioLoot {
  won: boolean;
  replay: boolean;
  champion: boolean;
  firstChampion: boolean;
  leagueUp: boolean;
  gold: number;
  food: number;
  gems: number;
  orbs: { species: string; n: number } | null;
  /** Ronroneo minutes: total, banked to the vault, applied to running timers, overflowed into gold */
  purr: { total: number; vault: number; timers: number; gold: number };
  xp: XpGain;
  league: number;
  bout: number;
}

export function applyDuel(c: OwnedCat, lg: number, bout: number, won: boolean, perfect: boolean): PodioLoot {
  const p = ps();
  const R = PB.rewards;
  const replay = isReplay(lg, bout);
  const champion = bout >= PB.ladder.bouts_per_league - 1;
  const firstChampion = won && champion && !replay && !p.champions.includes(lg);
  const m = G.s.momentum;
  const mult = !won ? R.loss_mult : replay ? R.replay_mult : 1;
  const growth = Math.pow(R.gold_league_growth, lg - 1);
  const gold = Math.round(Math.max(R.gold_min * growth, G.goldPerSec * R.gold_income_seconds) * m * mult * (firstChampion ? 2 : 1));
  const food = Math.round(Math.max(R.food_min * growth, G.foodPerSec * R.food_income_seconds) * mult * (firstChampion ? 2 : 1));
  let gems = 0;
  if (won && !replay && Math.random() < R.gem_chance_frontier) gems += 1;
  if (firstChampion) gems += R.champion_gems;
  const orbN = !won ? 0 : firstChampion ? R.orbs_champion : replay ? R.orbs_replay : R.orbs_win;
  // Ronroneo: half to your vault, half rushes the running clocks (G.purr does the split; a full
  // vault with no clocks running overflows into gold, like everywhere else)
  let vault = 0;
  let timers = 0;
  const off = G.on('purr', (e) => {
    for (const a of e.applied) {
      if (a.timer) timers += a.minutes;
      else vault += a.minutes;
    }
  });
  let total = 0;
  try {
    total += G.purr(won && !replay ? 'victory' : 'defeat', 'combat');
    if (won && perfect && !replay) total += G.purr('perfect_extra', 'combat');
    if (firstChampion) total += G.purr('catdex_set', 'combat');
  } finally {
    off();
  }
  // xp for the cat (+ kingdom xp)
  const X = PB.xp;
  const xpN = won ? (X.win + X.win_per_league * (lg - 1)) * (replay ? X.replay_mult : 1) : X.loss;
  const xp = addPodioXp(c, xpN);
  G.xp(won ? 'victory' : 'defeat', undefined, R.kingdom_xp_mult * (replay ? 0.5 : 1));
  if (won) G.bump('victory');
  if (gold) G.add('gold', gold, 'podio');
  if (food) G.add('food', food, 'podio');
  if (gems) G.add('gems', gems, 'podio');
  if (orbN) G.addOrbs(c.species, orbN);
  // ladder
  const st = catState(c.uid);
  let leagueUp = false;
  if (won) {
    st.wins++;
    p.stats.wins++;
    if (perfect) p.stats.perfects++;
    G.count('feature_podio_win');
    if (!replay) {
      if (champion) {
        if (!p.champions.includes(lg)) p.champions.push(lg);
        p.league = lg + 1;
        p.bout = 0;
        leagueUp = true;
      } else p.bout = bout + 1;
    }
  } else {
    st.losses++;
    p.stats.losses++;
  }
  G.count('podio_duels');
  G.save();
  return {
    won,
    replay,
    champion,
    firstChampion,
    leagueUp,
    gold,
    food,
    gems,
    orbs: orbN ? { species: c.species, n: orbN } : null,
    purr: { total, vault, timers, gold: Math.max(0, total - vault - timers) },
    xp,
    league: lg,
    bout,
  };
}

/** the player's best candidates for a rival: element advantage first, then power */
export function suggestCats(r: RivalDef): OwnedCat[] {
  return [...G.s.cats].sort((a, b) => score(b) - score(a));
  function score(c: OwnedCat) {
    const d = CAT_BY_ID.get(c.species);
    if (!d) return 0;
    let adv = 1;
    for (const e of d.elements) for (const re of r.def.elements) adv = Math.max(adv, affinityMult(e, re));
    return catPodioPower(c) * adv * (1 + 0.04 * peekLevel(c.uid));
  }
}

export function rarityOf(species: string): RarityId {
  return catDef(species).rarity;
}

// ------------------------------------------------------------------ unlock (new games: after Boss 1)
let acc = 0;
G.tickers.push((dt) => {
  acc += dt;
  if (acc < 1000) return;
  acc = 0;
  if (!G.has(PODIO_FLAG) && G.s.campaign.bossesDefeated >= PB.unlock.boss && G.s.cats.length) G.flag('podio_unlocked');
});

// ------------------------------------------------------------------ retro patch (old saves)
registerPatch({
  id: '2026-10-podio-desbloqueo',
  why: 'El Podio (duelos 1 vs 1) se abre al vencer al Jefe 1; las partidas que ya lo vencieron no vieron la presentación ni tienen el botón.',
  run() {
    if (G.s.campaign.bossesDefeated < PB.unlock.boss || !G.s.cats.length) return;
    G.flag('podio_unlocked');
    ps();
    return 'Se abrió EL PODIO: duelos 1 contra 1 entre gatos, con cuatro poderes. Botón PODIO abajo en tu isla.';
  },
});

