/**
 * DESPUÉS DE LA PARTE III — the cats that only exist once the Parte III is over (docs/post-p3/; ⚠️ spoilers).
 * The plumbing, not the cats: the data is data/postp3/especies.json (each cat's `post`: its table and weight), the rules
 * are data/postp3/reglas.ts (each table's share and guarantee, the Podio's new champions). Shipped empty, it changes
 * nothing; before the gate, nothing here draws a number, moves a counter or shows a card.
 *
 *   THE GATE    postP3Unlocked(): «Continuará» was written (b96_continuara, the end of the mourning), or H96 is done, or
 *               the story is past it (H97 «La última ronda» or any later mission). A pure function of the save (missions
 *               and beats), like gaterasWorld.ts: no flag of its own, so an old save, a save that skipped the films
 *               (their lines mark the same beats) or a save past H96 without the beat all answer the same.
 *   CASINO      the tables that give cats (Portal, Tragamichis, La Caja, Modo Eterno) roll their cats as always; when one
 *               of them rolls a LEGENDARY or MYTHIC cat, `share` of those come from its Multiverse pool instead, and
 *               `pity` legendary / mythic cats in a row without one make the next one certain (casino.ts rollCatDef,
 *               withPostTable). Its odds panel prints all of it (panels/casino/postOdds.ts). The counters live in
 *               the casino's pity map (`post:<game>[:<sub>]`): no new save field, no migration.
 *   CATALOG     a post cat is invisible before the gate (cats.ts dexVisible); after it, a RUMOR while its table names it
 *               (the house rule of the Resonancia: what a table shows becomes a rumor), else a sealed card.
 *   VITRINAS    the seven coin tables: a bet that counts may open the table's showcase (state/sys/postVitrina.ts).
 *   PODIO       the Copa Fuera de la Caja: eight challenges in order, anchored to your frontier league, each pays its
 *               Heroico once (state/sys/podio.ts copa*); the save remembers it with the flag `postchamp_<id>`.
 *   Never the generic pools: Resonancia, the cat shop, the Podio's rivals, the gacha's featured cat (multidim.ts poolableCat).
 */
import { G } from '../game';
import { CATS, CAT_BY_ID, MISSION_BY_ID, type CatDef } from '../../data/content';
import { POST_CASINO, POST_CHAMPIONS, VITRINA_TABLES, parsePostSource, type PostChampion, type PostGame, type PostSourceParsed, type VitrinaTable } from '../../data/postp3/reglas';
import { isAfterPart2Mission, missionNum } from './rupturasLedger';
import { isPostCat } from './multidim';
import type { WorldSave } from './worldState';

// ------------------------------------------------------------------ the gate
/** «Continuará» (gaterasWorld.CONTINUARA_BEAT; not imported: that module registers world states when it loads) */
export const POST_GATE_BEAT = 'b96_continuara';
/** H96 «El recado»: the credits and «Continuará» */
export const POST_GATE_MISSION = 96;
/**
 * The Parte III is over in this save: «Continuará» was written, H96 is done, or the story is already past it (H97 or any
 * later mission met). H96 still active is not enough — the credits haven't rolled. The mourning (dueloActivo) is
 * always before this, so a prize never lands in it.
 */
export function postP3Unlocked(s: WorldSave | null | undefined = G.s): boolean {
  if (!s?.missions) return false;
  const m = s.missions;
  if (s.beatsSeen?.includes(POST_GATE_BEAT)) return true;
  if ((m.done ?? []).some((id) => isAfterPart2Mission(id) && missionNum(id) >= POST_GATE_MISSION)) return true;
  // an active mission past H96 counts only if this build knows it (H97 «La última ronda») or it's H100+: a save carrying a
  // stray H97–H99 id (the rupturas-raro fixture's phantom H99) must not open the post content in the middle of the Parte II
  return (m.active ?? []).some((id) => isAfterPart2Mission(id) && missionNum(id) > POST_GATE_MISSION && (MISSION_BY_ID.has(id) || missionNum(id) >= 100));
}

// ------------------------------------------------------------------ the data
let cache: { n: number; list: CatDef[] } | null = null;
/** every post cat, in Catdex order (re-read when CATS changes: the tests inject stubs) */
export function postCats(): CatDef[] {
  if (!cache || cache.n !== CATS.length || cache.list.some((c) => CAT_BY_ID.get(c.id) !== c)) cache = { n: CATS.length, list: CATS.filter((c) => isPostCat(c)) };
  return cache.list;
}
export const postSource = (def: CatDef | undefined | null): PostSourceParsed | null => parsePostSource(def?.post?.source);

// ------------------------------------------------------------------ casino: the Multiverse pools
/** a table that rolls cats: the game and, for the Portal, its banner */
export interface PostTable {
  game: PostGame;
  sub?: string;
}
/** cats you don't own weigh ×3 (the same as casino.ts UNOWNED_WEIGHT: tests keep them equal) */
export const POST_UNOWNED = 3;
const owns = (id: string) => G.s.catdex[id] === 'registered';

/** the cats of a table's Multiverse pool right now: after the gate, its source, every element of it discovered */
export function postPool(game: PostGame, sub?: string): CatDef[] {
  if (!G.s || !postP3Unlocked()) return [];
  return postCats().filter((c) => {
    const src = postSource(c);
    if (src?.kind !== 'casino' || src.game !== game || (src.sub !== undefined && src.sub !== sub)) return false;
    if (c.secret || !(Number(c.post?.weight) > 0)) return false;
    return c.elements.every((e) => G.s.elements.includes(e));
  });
}
/** a cat's weight in its pool now: its `post.weight`, ×3 while you don't have it */
export function postWeight(def: CatDef): number {
  return Number(def.post?.weight ?? 0) * (owns(def.id) ? 1 : POST_UNOWNED);
}
/** each table (each banner of the Portal) keeps its own guarantee, in the casino's pity map */
export function postPityKey(t: PostTable): string {
  const subs = POST_CASINO[t.game].subs;
  return subs && t.sub !== undefined ? `post:${t.game}:${t.sub}` : `post:${t.game}`;
}
function pityMap(): Record<string, number> {
  const c = (G.s.casino ??= { tickets: 0, pity: {}, stats: {} });
  return (c.pity ??= {});
}
/** legendary / mythic cats of this table since its last post cat */
export function postPityCount(t: PostTable): number {
  return Math.max(0, Math.floor(Number(G.s?.casino?.pity?.[postPityKey(t)]) || 0));
}
/** legendary / mythic cats until the guarantee (1 = the next one is certain); 0 = this table has no guarantee */
export function postPityLeft(t: PostTable): number {
  const n = POST_CASINO[t.game].pity;
  return n > 0 ? Math.max(1, n - postPityCount(t)) : 0;
}
function pickWeighted(list: CatDef[], rnd: () => number): CatDef {
  const tot = list.reduce((s, c) => s + postWeight(c), 0);
  let r = rnd() * tot;
  for (const c of list) {
    r -= postWeight(c);
    if (r <= 0) return c;
  }
  return list[list.length - 1];
}
/**
 * A table just rolled a LEGENDARY or MYTHIC cat: does it come from its Multiverse pool? (casino.ts rollCatDef). With an
 * empty pool — before the gate, or a table nobody was assigned to — it returns null without drawing or counting.
 */
export function rollPostCat(t: PostTable, rnd: () => number): CatDef | null {
  const pool = postPool(t.game, t.sub);
  if (!pool.length) return null;
  const rule = POST_CASINO[t.game];
  const p = pityMap();
  const k = postPityKey(t);
  const n = postPityCount(t);
  const forced = rule.pity > 0 && n + 1 >= rule.pity;
  if (!forced && !(rnd() < rule.share)) {
    p[k] = n + 1;
    return null;
  }
  p[k] = 0;
  return pickWeighted(pool, rnd);
}

// ------------------------------------------------------------------ the Portal's MULTIVERSO banner (state/sys/gacha.ts)
/**
 * The MULTIVERSO DESBORDADO banner (owner 2026-10-29): every LEGENDARY / MYTHIC result of it is a post MULTIDIMENSIONAL.
 * Its pool is every post Multidimensional in the game (whatever its table: the banner is where they all meet), after the
 * gate, with a weight, every element of it discovered — a new wave of them joins it by itself (postCats()).
 */
export function multiversoPool(): CatDef[] {
  if (!G.s || !postP3Unlocked()) return [];
  return postCats().filter((c) => c.rarity === 'multidimensional' && !c.secret && Number(c.post?.weight) > 0 && c.elements.every((e) => G.s.elements.includes(e)));
}
/** one of them by weight (×3 the ones you don't have); `missing` = only the ones you don't have (all of them once you do) */
export function rollMultiverso(rnd: () => number, missing = false): CatDef | null {
  const pool = multiversoPool();
  if (!pool.length) return null;
  const lack = missing ? pool.filter((c) => !owns(c.id)) : pool;
  return pickWeighted(lack.length ? lack : pool, rnd);
}
export interface MultiversoOdds {
  /** P(MULTIDIMENSIONAL line) and P(MD QUE TE FALTA line) of the next pull */
  pLine: number;
  pMissing: number;
  cats: {
    id: string;
    name: string;
    weight: number;
    owned: boolean;
    /** given the MULTIDIMENSIONAL line: its chance (weight, ×3 if you don't have it) */
    inLine: number;
    /** given the MD QUE TE FALTA line: its chance (0 if you have it, unless you have them all) */
    inMissing: number;
    /** this cat on your next pull */
    next: number;
  }[];
}
/** the MULTIVERSO's pool table (the odds panel): `p` = the next pull's tier odds (legendary, mythic) */
export function multiversoOdds(p: { legendary: number; mythic: number }): MultiversoOdds | null {
  const pool = multiversoPool();
  if (!pool.length) return null;
  const lack = pool.filter((c) => !owns(c.id));
  const miss = lack.length ? lack : pool;
  const tot = pool.reduce((s, c) => s + postWeight(c), 0) || 1;
  const totM = miss.reduce((s, c) => s + postWeight(c), 0) || 1;
  return {
    pLine: p.legendary,
    pMissing: p.mythic,
    cats: pool.map((c) => {
      const inLine = postWeight(c) / tot;
      const inMissing = miss.includes(c) ? postWeight(c) / totM : 0;
      return { id: c.id, name: c.name, weight: Number(c.post?.weight), owned: owns(c.id), inLine, inMissing, next: p.legendary * inLine + p.mythic * inMissing };
    }),
  };
}

export interface PostOdds {
  table: PostTable;
  /** «el Portal del Multiverso» (+ the banner) */
  place: string;
  share: number;
  /** the guarantee: legendary / mythic cats in a row (0 = none) */
  pity: number;
  /** legendary / mythic cats until it (1 = the next one; 0 = no guarantee) */
  left: number;
  /** the chance that this table's NEXT legendary / mythic cat is a post cat (1 when the guarantee is due) */
  next: number;
  cats: {
    id: string;
    name: string;
    rarity: string;
    weight: number;
    owned: boolean;
    /** given a post cat: its chance (weight, ×3 if you don't have it) */
    inPool: number;
    /** the next legendary / mythic cat of this table is this one */
    next: number;
  }[];
}
/** what a table's odds panel prints (null: no pool here, nothing to print) */
export function postOdds(t: PostTable): PostOdds | null {
  const pool = postPool(t.game, t.sub);
  if (!pool.length) return null;
  const rule = POST_CASINO[t.game];
  const left = postPityLeft(t);
  const next = left === 1 ? 1 : rule.share;
  const tot = pool.reduce((s, c) => s + postWeight(c), 0) || 1;
  const sub = t.sub !== undefined ? rule.subs?.[t.sub] : undefined;
  return {
    table: t,
    place: sub ? `${rule.place} · ${sub}` : rule.place,
    share: rule.share,
    pity: rule.pity,
    left,
    next,
    cats: pool.map((c) => {
      const inPool = postWeight(c) / tot;
      return { id: c.id, name: c.name, rarity: c.rarity, weight: Number(c.post?.weight), owned: owns(c.id), inPool, next: next * inPool };
    }),
  };
}
/** «1 de cada 4» when it reads cleanly, else «25 %» */
export function shareText(p: number): string {
  const k = 1 / p;
  return p > 0 && Math.abs(k - Math.round(k)) < 1e-9 && Math.round(k) > 1 ? `1 de cada ${Math.round(k)}` : `${Math.round(p * 1000) / 10} %`;
}
/** «1 de cada 4 gatos legendarios o míticos» · «el 25 % de los gatos legendarios o míticos» (a sentence's subject) */
export function postShareText(p: number): string {
  const s = shareText(p);
  return s.startsWith('1 de cada') ? `${s} gatos legendarios o míticos` : `el ${s} de los gatos legendarios o míticos`;
}

// ------------------------------------------------------------------ the Podio: the Copa Fuera de la Caja (state/sys/podio.ts copa*)
export const postChampionKey = (id: string) => `postchamp_${id}`;
/** the post cat a champion fights with and pays (null until its cat is in the game) */
export function postChampionCat(ch: PostChampion): string | null {
  return postCats().find((c) => {
    const s = postSource(c);
    return s?.kind === 'podio' && s.champion === ch.id;
  })?.id ?? null;
}
export const postChampionPaid = (id: string) => !!G.s && G.has(postChampionKey(id));
/** a champion's prize was just paid: remember it (podio.ts grantPrize) */
export function markPostChampionPaid(species: string) {
  for (const ch of POST_CHAMPIONS) if (postChampionCat(ch) === species) G.flag(postChampionKey(ch.id));
}
export interface CopaChallenge {
  champion: PostChampion;
  species: string;
  /** its Heroico was already paid (a rematch now pays the replay rewards) */
  paid: boolean;
  /** 'paid' (open, rematch) · 'next' (the one to beat) · 'sealed' (after the next one) */
  state: 'paid' | 'next' | 'sealed';
}
/**
 * The Copa right now, in order: after the gate, every champion whose cat is in the game (a champion whose Heroico hasn't
 * landed yet is skipped, so an art wave never blocks the row). The first unpaid one is the next; the ones after it sealed.
 */
export function copaChallenges(): CopaChallenge[] {
  if (!G.s || !postP3Unlocked()) return [];
  let next = false;
  return [...POST_CHAMPIONS]
    .sort((a, b) => a.order - b.order)
    .map((champion) => ({ champion, species: postChampionCat(champion) }))
    .filter((x): x is { champion: PostChampion; species: string } => !!x.species)
    .map((x) => {
      const paid = postChampionPaid(x.champion.id);
      const state: CopaChallenge['state'] = paid ? 'paid' : next ? 'sealed' : 'next';
      if (!paid) next = true;
      return { ...x, paid, state };
    });
}
/** every champion that fights now (in Copa order) */
export const activePostChampions = () => copaChallenges().map(({ champion, species }) => ({ champion, species }));

// ------------------------------------------------------------------ the Catdex
/** its table names it right now (its odds are on view): after the gate, a pool it's in, or a champion that fights */
export function postSourceLive(def: CatDef): boolean {
  if (!G.s || !postP3Unlocked()) return false;
  const src = postSource(def);
  if (src?.kind === 'casino') return postPool(src.game, src.sub).some((c) => c.id === def.id);
  if (src?.kind === 'podio') return activePostChampions().some((x) => x.species === def.id);
  return false;
}
/** a post cat the Catdex doesn't have yet: a RUMOR while a table names it, else a sealed card */
export const postDexStatus = (def: CatDef): 'rumor' | 'unknown' => (postSourceLive(def) ? 'rumor' : 'unknown');
/** where it comes from, in the player's words (the Catdex's rumor) */
export function postWhereText(def: CatDef): string {
  const src = postSource(def);
  if (src?.kind === 'casino') {
    const r = POST_CASINO[src.game];
    const sub = src.sub !== undefined ? ` (${r.subs?.[src.sub] ?? src.sub})` : '';
    const pity = r.pity > 0 ? ` Si salen ${r.pity} seguidos sin uno, el siguiente lo es.` : '';
    const v = def.post?.vitrina && def.post.vitrina in VITRINA_TABLES ? ` También está en la VITRINA de ${VITRINA_TABLES[def.post.vitrina as VitrinaTable].name}.` : '';
    return `Sale en ${r.place}${sub}: ${postShareText(r.share)} de ahí viene del Multiverso.${pity}${v} Su tabla de probabilidades dice cuánto pesa cada uno.`;
  }
  if (src?.kind === 'podio') {
    const ch = POST_CHAMPIONS.find((c) => c.id === src.champion);
    if (ch) return `Lo trae ${ch.trainer ?? 'un campeón'} en la COPA FUERA DE LA CAJA del Podio (reto ${ch.order} de ${POST_CHAMPIONS.length}). Es tuyo la primera vez que le ganas.`;
  }
  return 'Todavía no sale en ninguna mesa.';
}
