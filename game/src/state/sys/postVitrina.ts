/**
 * DESPUÉS DE LA PARTE III · LAS VITRINAS (docs/post-p3/03-obtencion.md §4, approved 2026-10-28; ⚠️ spoilers).
 * The seven tables that pay only coins (Plinko, Dados, Mayor o Menor, Bingo, Rasca, Cajas, Ruleta) each get a showcase
 * of 8 post cats (`post.vitrina: <table>`; every one of them ALSO lives in its big table: `post.source`). Rules and
 * numbers: data/postp3/reglas.ts POST_VITRINA. Before the gate, or with an empty showcase, nothing here draws a number.
 *
 *   MOMENTO     a bet that counts (≥ 25 fichas, or gold ≥ ¼ of that table's cap; never gems) has POST_VITRINA.chance to
 *               open the showcase, rolled apart when the bet settles (casino/common.ts settle, casino.ts spinRoulette):
 *               the table's odds and RTP never move. A Bingo card is a bet; a Roulette spin is one bet. Never inside a
 *               MODO ETERNO session (its speed would turn it into a tap).
 *   TIRO        consolation (orbs of a showcase cat you have, by weight; fichas if you have none) or its legendary, a
 *               mythic or a Multidimensional — only cats you DON'T have (a completed rarity falls to the next one you
 *               lack: Multidimensional → mythic → legendary). A complete showcase pays orbs ×3.
 *   GARANTÍAS   per showcase, in the casino's pity map (no new save field): `post:vit:<t>:c` a cat at the latest every 5
 *               throws, `post:vit:<t>:md` a Multidimensional every 15, `post:vit:<t>:s` the spark: at 25 throws you pick
 *               any cat of it you lack (and it goes back down by 25).
 *   SELLOS      `post:sellos`: LA CASA TE DEBE pays one more (casino.ts recordBet); 5 = a throw in the showcase you pick.
 * Everything is resolved and saved BEFORE any animation shows it, like every casino prize.
 */
import { G } from '../game';
import { type CatDef } from '../../data/content';
import { POST_VITRINA, VITRINA_TABLES, type VitrinaTable } from '../../data/postp3/reglas';
import { postCats, postP3Unlocked } from './postp3';
import { addChips, cs, grantPrize, persist, rand, type Cur, type Granted, type PrizeTier } from './casino';

export const isVitrinaTable = (t: unknown): t is VitrinaTable => typeof t === 'string' && Object.prototype.hasOwnProperty.call(VITRINA_TABLES, t);
export const VITRINAS = Object.keys(VITRINA_TABLES) as VitrinaTable[];
const owns = (id: string) => G.s.catdex[id] === 'registered';
const weightOf = (c: CatDef) => Math.max(0, Number(c.post?.weight) || 0);

/** a showcase's cats right now: after the gate, `post.vitrina === t`, every element of it discovered (the house rule) */
export function vitrinaPool(t: VitrinaTable): CatDef[] {
  if (!G.s || !postP3Unlocked()) return [];
  return postCats().filter((c) => c.post?.vitrina === t && !c.secret && weightOf(c) > 0 && c.elements.every((e) => G.s.elements.includes(e)));
}
export const vitrinaLive = (t: VitrinaTable) => vitrinaPool(t).length > 0;
/** any showcase open (the Sellos only count then) */
export const anyVitrinaLive = () => VITRINAS.some(vitrinaLive);

// ------------------------------------------------------------------ counters (the casino's pity map)
const KEY = { c: (t: VitrinaTable) => `post:vit:${t}:c`, md: (t: VitrinaTable) => `post:vit:${t}:md`, s: (t: VitrinaTable) => `post:vit:${t}:s`, sellos: 'post:sellos' } as const;
const get = (k: string) => Math.max(0, Math.floor(Number(G.s?.casino?.pity?.[k]) || 0));
const set = (k: string, v: number) => {
  cs().pity[k] = Math.max(0, Math.floor(v));
};
export interface VitrinaCounters {
  /** throws until the cat guarantee (1 = the next throw gives a cat) */
  catLeft: number;
  /** throws until the Multidimensional guarantee */
  mdLeft: number;
  /** throws toward the spark, and what it takes */
  spark: number;
  sparkNeed: number;
  /** Sellos, and how many a throw takes */
  sellos: number;
  sellosNeed: number;
}
export function vitrinaCounters(t: VitrinaTable): VitrinaCounters {
  const P = POST_VITRINA.pity;
  return {
    catLeft: Math.max(1, P.cat - get(KEY.c(t))),
    mdLeft: Math.max(1, P.md - get(KEY.md(t))),
    spark: get(KEY.s(t)),
    sparkNeed: P.spark,
    sellos: get(KEY.sellos),
    sellosNeed: POST_VITRINA.sellos.perThrow,
  };
}
export const sellos = () => get(KEY.sellos);

// ------------------------------------------------------------------ the Momento (a bet that counts)
/** does this bet count? fichas ≥ minChips; gold ≥ `goldMin` (¼ of the table's cap, the caller's own stake list); never gems */
export function vitrinaQualifies(cur: Cur, stake: number, goldMin: number): boolean {
  if (cur === 'chips') return stake >= POST_VITRINA.minChips;
  if (cur === 'gold') return stake >= goldMin;
  return false;
}
/** a MODO ETERNO session is running (casino/eterno.ts keeps it in the casino state): no Momento there */
const inEterno = () => !!(G.s?.casino?.eterno as { open?: unknown } | undefined)?.open;

/** a throw marked for the views (MiniGame.candy / RouletteView): which showcase, and why */
export interface VitrinaGranted extends Granted {
  vitrina: VitrinaTable;
  /** what opened it: a Momento, the Sellos, the spark */
  via: 'momento' | 'sellos' | 'chispa';
}
/**
 * A bet settled on table `t` (`n` bets at once: Bingo's cards). Each one that counts rolls the Momento apart; each hit is
 * a throw, already applied. Returns the throws (empty before the gate, on a table without a showcase, in the ETERNO).
 */
export function vitrinaOnBet(t: string, cur: Cur, qualifies: boolean, n = 1, rnd: () => number = rand): VitrinaGranted[] {
  if (!isVitrinaTable(t) || !qualifies || inEterno() || !vitrinaLive(t)) return [];
  const out: VitrinaGranted[] = [];
  for (let i = 0; i < n; i++) if (rnd() < POST_VITRINA.chance) out.push(vitrinaThrow(t, 'momento', rnd));
  return out;
}

// ------------------------------------------------------------------ a throw
type CatRarity = 'legendary' | 'mythic' | 'multidimensional';
const CAT_RARITIES: CatRarity[] = ['legendary', 'mythic', 'multidimensional'];
const tierOf = (r: string): PrizeTier => (r === 'legendary' ? 'legendary' : 'mythic');
function pickBy<T>(list: T[], w: (x: T) => number, rnd: () => number): T {
  const tot = list.reduce((s, x) => s + w(x), 0);
  let r = rnd() * tot;
  for (const x of list) {
    r -= w(x);
    if (r <= 0) return x;
  }
  return list[list.length - 1];
}
/** consolation: orbs of a showcase cat you have (by weight; ×3 once it's complete), or fichas when you have none */
function consolation(pool: CatDef[], complete: boolean, rnd: () => number): Granted {
  const mine = pool.filter((c) => owns(c.id));
  const C = POST_VITRINA.consolation;
  if (!mine.length) return grantPrize({ kind: 'chips', n: C.chipsIfNone, tier: 'common' });
  const c = pickBy(mine, weightOf, rnd);
  return grantPrize({ kind: 'orbs', n: C.orbs * (complete ? C.completeOrbsMult : 1), ref: c.id, tier: complete ? 'rare' : 'common' });
}
/**
 * One throw of showcase `t` (a Momento, 5 Sellos). Applies it and moves its three counters. Exported for the tests and
 * the Sellos; a Momento comes through vitrinaOnBet.
 */
export function vitrinaThrow(t: VitrinaTable, via: VitrinaGranted['via'], rnd: () => number = rand): VitrinaGranted {
  const pool = vitrinaPool(t);
  const lack = pool.filter((c) => !owns(c.id));
  const lackOf = (r: CatRarity) => lack.filter((c) => c.rarity === r);
  const R = POST_VITRINA.roll;
  const P = POST_VITRINA.pity;
  const cN = get(KEY.c(t));
  const mdN = get(KEY.md(t));
  let rarity: CatRarity | 'consolation';
  if (lackOf('multidimensional').length && mdN + 1 >= P.md) rarity = 'multidimensional';
  else {
    rarity = pickBy(['consolation', ...CAT_RARITIES] as const, (k) => R[k], rnd);
    // the cat guarantee: the consolation is not on the table this throw
    if (rarity === 'consolation' && lack.length && cN + 1 >= P.cat) rarity = pickBy(CAT_RARITIES, (k) => R[k], rnd);
  }
  let g: Granted;
  let gotCat = false;
  let gotMd = false;
  if (rarity === 'consolation') g = consolation(pool, !lack.length, rnd);
  else {
    // never a repeat: a completed rarity falls to the next one you lack (Multidimensional → mythic → legendary)
    const order = [rarity, ...(POST_VITRINA.fallback as readonly CatRarity[]).filter((x) => x !== rarity)];
    const r = order.find((x) => lackOf(x).length);
    if (!r) g = consolation(pool, true, rnd);
    else {
      const c = pickBy(lackOf(r), weightOf, rnd);
      g = grantPrize({ kind: 'cat', n: 1, ref: c.id, tier: tierOf(c.rarity) });
      gotCat = true;
      gotMd = c.rarity === 'multidimensional';
    }
  }
  set(KEY.c(t), gotCat ? 0 : cN + 1);
  set(KEY.md(t), gotMd ? 0 : mdN + 1);
  set(KEY.s(t), get(KEY.s(t)) + 1);
  const st = cs().stats;
  st.vitrina_throws = (st.vitrina_throws ?? 0) + 1;
  G.count('casino_vitrina_throws');
  persist();
  return { ...g, vitrina: t, via };
}

// ------------------------------------------------------------------ the spark and the Sellos
/** the spark is ready: 25 throws in this showcase and a cat of it you still lack */
export function vitrinaSparkReady(t: VitrinaTable): boolean {
  return get(KEY.s(t)) >= POST_VITRINA.pity.spark && vitrinaPool(t).some((c) => !owns(c.id));
}
/** pick a cat of the showcase you lack with the spark (the counter goes down by 25); null if it can't */
export function vitrinaSparkPick(t: VitrinaTable, species: string): VitrinaGranted | null {
  if (!vitrinaSparkReady(t)) return null;
  const c = vitrinaPool(t).find((x) => x.id === species && !owns(x.id));
  if (!c) return null;
  set(KEY.s(t), get(KEY.s(t)) - POST_VITRINA.pity.spark);
  const g = grantPrize({ kind: 'cat', n: 1, ref: c.id, tier: tierOf(c.rarity) });
  if (c.rarity === 'multidimensional') set(KEY.md(t), 0);
  set(KEY.c(t), 0);
  persist();
  return { ...g, vitrina: t, via: 'chispa' };
}
/** LA CASA TE DEBE just paid (casino.ts recordBet): one more Sello, while a showcase is open. Returns how many it gave */
export function vitrinaSelloOnCandy(): number {
  if (!G.s || !anyVitrinaLive()) return 0;
  const n = POST_VITRINA.sellos.perCandy;
  set(KEY.sellos, get(KEY.sellos) + n);
  return n;
}
/** spend 5 Sellos on a throw of the showcase you pick; null if you can't */
export function vitrinaRedeemSellos(t: VitrinaTable, rnd: () => number = rand): VitrinaGranted | null {
  const need = POST_VITRINA.sellos.perThrow;
  if (!vitrinaLive(t) || get(KEY.sellos) < need) return null;
  set(KEY.sellos, get(KEY.sellos) - need);
  return vitrinaThrow(t, 'sellos', rnd);
}

// ------------------------------------------------------------------ what the VITRINA tab prints
export interface VitrinaOdds {
  table: VitrinaTable;
  name: string;
  golden: string;
  chance: number;
  minChips: number;
  goldCapFraction: number;
  roll: typeof POST_VITRINA.roll;
  cats: { id: string; name: string; rarity: string; weight: number; owned: boolean; star: boolean }[];
  counters: VitrinaCounters;
  sparkReady: boolean;
}
export function vitrinaOdds(t: VitrinaTable): VitrinaOdds | null {
  const pool = vitrinaPool(t);
  if (!pool.length) return null;
  const order: Record<string, number> = { legendary: 0, mythic: 1, multidimensional: 2 };
  return {
    table: t,
    ...VITRINA_TABLES[t],
    chance: POST_VITRINA.chance,
    minChips: POST_VITRINA.minChips,
    goldCapFraction: POST_VITRINA.goldCapFraction,
    roll: POST_VITRINA.roll,
    cats: [...pool]
      .sort((a, b) => (order[a.rarity] ?? 9) - (order[b.rarity] ?? 9))
      .map((c) => ({ id: c.id, name: c.name, rarity: c.rarity, weight: weightOf(c), owned: owns(c.id), star: !!c.post?.star })),
    counters: vitrinaCounters(t),
    sparkReady: vitrinaSparkReady(t),
  };
}
/** the chance that a throw gives a cat of each rarity right now (after the guarantees and the fallback), for the tab */
export function vitrinaThrowOdds(t: VitrinaTable): Record<'consolation' | CatRarity, number> {
  const pool = vitrinaPool(t);
  const lack = pool.filter((c) => !owns(c.id));
  const has = (r: CatRarity) => lack.some((c) => c.rarity === r);
  const R = POST_VITRINA.roll;
  const out = { consolation: 0, legendary: 0, mythic: 0, multidimensional: 0 };
  const P = POST_VITRINA.pity;
  const route = (r: CatRarity, p: number) => {
    const order = [r, ...(POST_VITRINA.fallback as readonly CatRarity[]).filter((x) => x !== r)];
    const to = order.find(has);
    if (to) out[to] += p;
    else out.consolation += p;
  };
  if (has('multidimensional') && get(KEY.md(t)) + 1 >= P.md) {
    out.multidimensional = 1;
    return out;
  }
  const catW = R.legendary + R.mythic + R.multidimensional;
  const forced = lack.length > 0 && get(KEY.c(t)) + 1 >= P.cat;
  if (!forced) out.consolation += R.consolation;
  for (const r of CAT_RARITIES) route(r, forced ? R[r] / catW : R[r]);
  return out;
}
