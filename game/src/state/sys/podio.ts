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
import { adopt } from './cats';
import { defaultPodio, PodioCatState, PodioState } from '../../podio/types';
import { powerLevels, powersOf } from '../../podio/powers';
import { RivalDef, league, rival } from '../../podio/ladder';
import type { FighterInit } from '../../podio/engine';

export const PODIO_FLAG = 'podio_unlocked';
export const SPEEDS = [0.5, 1, 2, 4] as const;

/** PodioState objects whose cats already got their first-win ledger (old saves derive it once per load) */
const ledgersReady = new WeakSet<PodioState>();

export function ps(): PodioState {
  G.s.podio ??= defaultPodio();
  const p = G.s.podio;
  p.cats ??= {};
  p.champions ??= [];
  p.stats ??= { wins: 0, losses: 0, perfects: 0 };
  if (!SPEEDS.includes(p.speed as (typeof SPEEDS)[number])) p.speed = 1;
  p.league = Math.max(1, Math.floor(p.league || 1));
  p.bout = Math.max(0, Math.min(PB.ladder.bouts_per_league - 1, Math.floor(p.bout || 0)));
  if (!ledgersReady.has(p)) {
    ledgersReady.add(p);
    for (const st of Object.values(p.cats)) if (st && typeof st === 'object') normalizeCat(st, p);
  }
  return p;
}

export function podioUnlocked() {
  return G.has(PODIO_FLAG) || G.s.campaign.bossesDefeated >= PB.unlock.boss;
}

// ------------------------------------------------------------------ per-cat podio level
export function catState(uid: string): PodioCatState {
  const p = ps();
  return (p.cats[uid] ??= { xp: 0, lvl: 1, wins: 0, losses: 0, beaten: {}, bank: 0 });
}
/** read-only view (doesn't create an entry for cats that never fought) */
export function peekCat(uid: string): PodioCatState {
  return ps().cats[uid] ?? { xp: 0, lvl: 1, wins: 0, losses: 0, beaten: {}, bank: 0 };
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
  /** XP waiting in the cat's bank after this gain (first-win XP over the cap) */
  banked: number;
  /** of `gained`, how much went to the bank instead of the bar */
  toBank: number;
}

/**
 * Give podio XP to a cat. At the level cap the bar fills but doesn't overflow; the overflow is LOST unless
 * `keep` (first-win XP: a cat must never burn its one-time catch-up XP because it was capped), which goes
 * to `bank` and flows in when the cap rises. Whatever was already banked is always kept.
 */
export function addPodioXp(c: OwnedCat, n: number, keep = false): XpGain {
  const st = catState(c.uid);
  const before = st.lvl;
  const xpBefore = st.xp;
  const lvBefore = powerLevels(before);
  const cap = levelCap(c);
  const gained = Math.max(0, Math.round(n));
  const bankBefore = Math.max(0, Math.floor(st.bank ?? 0));
  st.xp += gained + bankBefore;
  st.bank = 0;
  while (st.lvl < cap && st.xp >= xpNeed(st.lvl)) {
    st.xp -= xpNeed(st.lvl);
    st.lvl++;
  }
  // at the cap the bar fills but doesn't overflow (feed the cat on the island to raise the cap)
  const capped = st.lvl >= cap && st.lvl < PB.levels.max;
  let over = 0;
  if (st.lvl >= PB.levels.max) st.xp = 0;
  else if (st.lvl >= cap && st.xp > xpNeed(st.lvl) - 1) {
    over = st.xp - (xpNeed(st.lvl) - 1);
    st.xp = xpNeed(st.lvl) - 1;
  }
  st.bank = Math.min(over, bankBefore + (keep ? gained : 0));
  const lvAfter = powerLevels(st.lvl);
  const powerUps = [0, 1, 2, 3].filter((i) => lvAfter[i] > lvBefore[i] && lvBefore[i] > 0);
  const unlocked = [0, 1, 2, 3].filter((i) => lvAfter[i] > 0 && lvBefore[i] === 0);
  if (st.lvl > before) G.recalc(); // island gold bonus changed
  return { before, after: st.lvl, xpBefore, xpAfter: st.xp, gained, powerUps, unlocked, capped, banked: st.bank, toBank: Math.max(0, st.bank - bankBefore) };
}

/** a cat whose cap rose (fed / starred on the island) takes its banked XP. True if it changed anything. */
export function settleBank(c: OwnedCat): boolean {
  const st = ps().cats[c.uid];
  if (!st || !(st.bank! > 0) || st.lvl >= levelCap(c)) return false;
  const lvl = st.lvl;
  const bank = st.bank;
  addPodioXp(c, 0);
  return st.lvl !== lvl || st.bank !== bank;
}

// ------------------------------------------------------------------ per-cat first wins (catch-up)
const BOUTS = PB.ladder.bouts_per_league;
/** XP a win over (lg) pays before multipliers */
export function winXp(lg: number) {
  return PB.xp.win + PB.xp.win_per_league * (lg - 1);
}
/** did THIS cat already beat that rival? */
export function catBeat(uid: string, lg: number, bout: number) {
  const m = ps().cats[uid]?.beaten?.[String(lg)] ?? 0;
  return (m & (1 << bout)) !== 0;
}
function markBeat(st: PodioCatState, lg: number, bout: number) {
  st.beaten ??= {};
  st.beaten[String(lg)] = (st.beaten[String(lg)] ?? 0) | (1 << bout);
}
/** a rival you can pick in the lobby: anything already beaten by the account, plus the frontier */
export function reachable(lg: number, bout: number) {
  const p = ps();
  return lg >= 1 && bout >= 0 && bout < BOUTS && (lg < p.league || (lg === p.league && bout <= p.bout));
}
/** rivals this cat can still beat for the first time (full XP + orbs), easiest first */
export function pendingFor(uid: string): { lg: number; bout: number }[] {
  const p = ps();
  const out: { lg: number; bout: number }[] = [];
  for (let lg = 1; lg <= p.league; lg++) for (let b = 0; b < BOUTS; b++) if (reachable(lg, b) && !catBeat(uid, lg, b)) out.push({ lg, bout: b });
  return out;
}
/** the rival after this one in its league (then the next league); never past the frontier */
export function nextBout(lg: number, bout: number): { lg: number; bout: number } {
  const n = bout + 1 < BOUTS ? { lg, bout: bout + 1 } : { lg: lg + 1, bout: 0 };
  if (reachable(n.lg, n.bout)) return n;
  const p = ps();
  return { lg: p.league, bout: p.bout };
}

/**
 * Old saves have no ledger: credit the cat with the rivals its XP already paid for, easiest first
 * (all its lifetime XP counted as first-win XP). Conservative for the economy (no double first-win XP for
 * the cats that climbed the ladder) and never worse than the old rules (every rival was a replay before).
 */
function normalizeCat(st: PodioCatState, p: PodioState) {
  st.bank = Math.max(0, Math.floor(Number(st.bank) || 0));
  if (st.beaten && typeof st.beaten === 'object') return;
  st.beaten = {};
  let budget = Math.max(0, Number(st.xp) || 0);
  for (let l = 1; l < Math.max(1, Math.floor(st.lvl || 1)); l++) budget += xpNeed(l);
  if (budget <= 0) return;
  for (let lg = 1; lg <= p.league; lg++) {
    for (let b = 0; b < BOUTS; b++) {
      if (lg === p.league && b >= p.bout) return; // never beaten by anyone
      const cost = winXp(lg);
      if (budget < cost) return;
      budget -= cost;
      markBeat(st, lg, b);
    }
  }
}

/** catch-up: a cat far below your best Podio cat learns faster (x1 for the best, up to catchup_max) */
export function catchupMult(uid: string) {
  const p = ps();
  const owned = new Set(G.s.cats.map((c) => c.uid));
  let best = 1;
  for (const [u, st] of Object.entries(p.cats)) if (owned.has(u)) best = Math.max(best, st.lvl || 1);
  const gap = Math.max(0, best - (p.cats[uid]?.lvl ?? 1));
  return Math.min(PB.xp.catchup_max, 1 + PB.xp.catchup_per_level * gap);
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
  settleBank(c);
  const def = catDef(c.species);
  // Catdex sets of the Podio's prizes: Salón de la Fama (+10% damage) · Los Rotos del Cielo (ULTI meter at half)
  const S = PB.sets;
  return {
    dmgMul: G.has('set_podio') ? S.set_podio_dmg : undefined,
    meterStart: G.has('set_divinos') ? S.set_divinos_meter : undefined,
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
/**
 * What a win means: `frontier` = the account's next unbeaten rival (ladder advances, gems, prizes);
 * `first` = already beaten by the account but never by THIS cat (full XP + first-win orbs);
 * `repeat` = this cat already beat it (reduced XP, orbs only near the frontier).
 */
export type WinKind = 'frontier' | 'first' | 'repeat';

export interface PodioLoot {
  won: boolean;
  /** what a win over this rival meant for this cat (set for losses too: what it would have been) */
  kind: WinKind;
  /** XP multiplier from catch-up (1 = none) */
  catchup: number;
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
  /** the champion's prize cat (first win over a VACÍO league champion): a Heroico or a Divino */
  prize: { species: string; isNew: boolean; orbs: number } | null;
}

// ------------------------------------------------------------------ champion prizes (Heroicos / Divinos)
const PRIZES = PB.champion_prizes as unknown as Record<string, string>;
/** the cat a league's champion pays the first time you beat it (null: none) */
export function championPrize(lg: number): string | null {
  const id = PRIZES[String(lg)];
  return id && CAT_BY_ID.has(id) ? id : null;
}
/** every prize league, in order */
export function prizeLeagues(): { league: number; species: string }[] {
  return Object.keys(PRIZES)
    .filter((k) => /^\d+$/.test(k) && championPrize(Number(k)))
    .map((k) => ({ league: Number(k), species: PRIZES[k] }))
    .sort((a, b) => a.league - b.league);
}
/** the next prize the player can still win (a league whose champion they haven't beaten) */
export function nextPrize(): { league: number; species: string } | null {
  const p = ps();
  return prizeLeagues().find((x) => !p.champions.includes(x.league)) ?? null;
}
/** give a champion's prize cat (a duplicate becomes orbs, like everywhere else) */
function grantPrize(species: string) {
  const r = adopt(species);
  G.count('podio_prizes');
  G.count(`podio_prize_${catDef(species).rarity}`);
  return { species, isNew: r.isNew, orbs: r.orbs };
}

export function winKind(uid: string, lg: number, bout: number): WinKind {
  return !isReplay(lg, bout) ? 'frontier' : catBeat(uid, lg, bout) ? 'repeat' : 'first';
}

/** the rewards of a duel, without rolling or applying anything (the lobby shows exactly this) */
export interface DuelOutlook {
  kind: WinKind;
  champion: boolean;
  firstChampion: boolean;
  gold: number;
  food: number;
  /** guaranteed gems (first champion win) */
  gems: number;
  /** chance of +1 gem (frontier wins only) */
  gemChance: number;
  orbs: number;
  xp: number;
  /** first-win XP is kept in the bank when the cat is capped */
  keepXp: boolean;
  catchup: number;
  prize: string | null;
  /** the cat can't grow right now (level cap) */
  capped: boolean;
}

export function duelOutlook(c: OwnedCat, lg: number, bout: number, won = true): DuelOutlook {
  const p = ps();
  const R = PB.rewards;
  const X = PB.xp;
  const kind = winKind(c.uid, lg, bout);
  const champion = bout >= BOUTS - 1;
  const firstChampion = won && champion && kind === 'frontier' && !p.champions.includes(lg);
  const mult = !won ? R.loss_mult : kind === 'frontier' ? 1 : R.replay_mult;
  // rematches of old leagues pay a shrinking slice of your income (no farming League 1 for frontier money)
  const stale = kind === 'frontier' ? 1 : Math.pow(R.replay_league_decay, Math.max(0, p.league - lg));
  const growth = Math.pow(R.gold_league_growth, lg - 1);
  const dbl = firstChampion ? 2 : 1;
  const gold = Math.round(Math.max(R.gold_min * growth, G.goldPerSec * R.gold_income_seconds * stale) * G.s.momentum * mult * dbl);
  const food = Math.round(Math.max(R.food_min * growth, G.foodPerSec * R.food_income_seconds * stale) * mult * dbl);
  const orbs = !won
    ? 0
    : firstChampion
      ? R.orbs_champion
      : kind !== 'repeat'
        ? R.orbs_win // frontier, or this cat's first win over a rival the account already beat
        : lg >= p.league - R.replay_orb_window
          ? R.orbs_replay
          : 0;
  const catchup = won ? catchupMult(c.uid) : 1;
  const xp = Math.round(won ? winXp(lg) * (kind === 'repeat' ? X.replay_mult : 1) * catchup : X.loss);
  const st = peekCat(c.uid);
  return {
    kind,
    champion,
    firstChampion,
    gold,
    food,
    gems: firstChampion ? R.champion_gems : 0,
    gemChance: won && kind === 'frontier' ? R.gem_chance_frontier : 0,
    orbs,
    xp,
    keepXp: won && kind !== 'repeat',
    catchup,
    prize: firstChampion ? championPrize(lg) : null,
    capped: st.lvl >= levelCap(c) && st.lvl < PB.levels.max,
  };
}

export function applyDuel(c: OwnedCat, lg: number, bout: number, won: boolean, perfect: boolean): PodioLoot {
  const p = ps();
  const R = PB.rewards;
  const o = duelOutlook(c, lg, bout, won);
  const replay = o.kind !== 'frontier';
  const { champion, firstChampion, gold, food } = o;
  let gems = o.gems;
  if (o.gemChance && Math.random() < o.gemChance) gems += 1;
  const orbN = o.orbs;
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
  // xp for the cat (+ kingdom xp); first-win XP over the cap waits in the bank
  const xp = addPodioXp(c, o.xp, o.keepXp);
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
    markBeat(st, lg, bout);
    p.stats.wins++;
    if (perfect) p.stats.perfects++;
    G.count('feature_podio_win');
    if (!replay) {
      if (champion) {
        if (!p.champions.includes(lg)) p.champions.push(lg);
        p.league = lg + 1;
        p.bout = 0;
        leagueUp = true;
        G.flag(`podio_league_${p.league}`);
      } else p.bout = bout + 1;
    }
  } else {
    st.losses++;
    p.stats.losses++;
  }
  G.count('podio_duels');
  const prize = o.prize ? grantPrize(o.prize) : null;
  G.save();
  return {
    prize,
    won,
    kind: o.kind,
    catchup: o.catchup,
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
  // banked first-win XP flows in as soon as the island raises a cat's cap
  const cats = G.s.podio?.cats;
  if (cats) for (const [uid, st] of Object.entries(cats)) if (st?.bank && st.bank > 0) {
    const c = G.s.cats.find((x) => x.uid === uid);
    if (c) settleBank(c);
  }
});

// ------------------------------------------------------------------ Heroicos / Divinos for saves that already crowned those champions
registerPatch({
  id: '2026-10-podio-heroicos-divinos',
  why: 'Los campeones de las ligas del Vacío ahora pagan un gato Heroico o Divino la primera vez; quien ya los venció antes de esta versión no lo recibió. También marca las ligas alcanzadas (misiones P02/P03).',
  run() {
    const p = G.s.podio;
    if (!p) return;
    for (let n = 2; n <= Math.max(1, Math.floor(p.league || 1)); n++) G.flag(`podio_league_${n}`);
    const got: string[] = [];
    for (const lg of [...(p.champions ?? [])].sort((a, b) => a - b)) {
      const sp = championPrize(lg);
      if (!sp || G.s.catdex[sp] === 'registered') continue;
      grantPrize(sp);
      got.push(catDef(sp).name);
    }
    if (!got.length) return;
    return `Los campeones del Vacío que ya venciste te mandaron su premio: ${got.join(', ')}. Búscalos en tu isla y en la Catdex.`;
  },
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

