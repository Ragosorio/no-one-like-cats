/** Owned cats: adoption, duplicates→orbs, feeding (4 ÑAM per level), stars, catdex. */
import { G, OwnedCat } from '../game';
import { accessoryMods } from './accessories';
import { podioCatMods } from '../../podio/mods';
import { CATS, CONTENT, catDef, ROLE_BY_ID } from '../../data/content';
import {
  BAL,
  catGoldPerSec,
  catLevelCap,
  catPower,
  discoveryGems,
  duplicateOrbs,
  feedCost,
  starMinLevel,
  starMult,
  starOrbs,
} from '../econ';

export function catsOwned() {
  return G.s.cats;
}
export function cat(uid: string) {
  return G.s.cats.find((c) => c.uid === uid);
}
export function ownsSpecies(species: string) {
  return G.s.cats.some((c) => c.species === species);
}
export function speciesCount() {
  return Object.values(G.s.catdex).filter((v) => v === 'registered').length;
}

/**
 * Adopt a cat of a species. First of its species → new catdex entry (gems, purr, momentum, xp).
 * Duplicates are converted to orbs (never a loss).
 */
export function adopt(
  species: string,
  opts: { name?: string; level?: number; free?: boolean; mutation?: string | null; trait?: string } = {},
): { cat: OwnedCat | null; isNew: boolean; orbs: number } {
  const def = catDef(species);
  const isNew = G.s.catdex[species] !== 'registered';
  if (!isNew && !opts.free) {
    const orbs = duplicateOrbs(def.rarity);
    G.addOrbs(species, orbs);
    G.xp('hatch', def.rarity, 0.5);
    G.emit('catAdded', { cat: G.s.cats.find((c) => c.species === species)!, isNew: false, orbs });
    return { cat: null, isNew: false, orbs };
  }
  const c: OwnedCat = {
    uid: G.uid('c'),
    species,
    name: opts.name ?? def.name,
    level: opts.level ?? 1,
    bites: 0,
    stars: 1,
    habitat: null,
    trait: opts.trait ?? def.trait,
    mutation: opts.mutation ?? null,
    bornAtMs: G.s.playMs,
    moments: [],
  };
  G.s.cats.push(c);
  if (c.mutation) G.count('mutations_owned');
  if (isNew) {
    G.s.catdex[species] = 'registered';
    if (!opts.free) {
      G.add('gems', discoveryGems(def.rarity), 'catdex');
      G.purr('new_species', 'discovery');
      G.bump('new_species');
      G.xp('new_species');
    }
    G.count('species');
  }
  G.recalc();
  G.emit('catAdded', { cat: c, isNew, orbs: 0 });
  if (isNew) checkSets();
  return { cat: c, isNew, orbs: 0 };
}

export function levelCap() {
  return catLevelCap(G.s.kl);
}

/** cost in food of ONE bite (1/4 of the level cost) */
export function biteCost(c: OwnedCat) {
  return Math.ceil(feedCost(c.level, catDef(c.species).rarity) / 4);
}

/** Feed one bite. Returns 'bite' | 'level' | 'cap' | 'poor'. */
export function feed(c: OwnedCat): 'bite' | 'level' | 'cap' | 'poor' {
  if (c.level >= levelCap()) return 'cap';
  const cost = biteCost(c);
  if (G.s.food < cost) return 'poor';
  G.add('food', -cost, 'feed');
  c.bites++;
  if (c.bites >= 4) {
    c.bites = 0;
    c.level++;
    G.xp('cat_level_up');
    G.count('cat_levels');
    G.recalc();
    G.emit('catLevel', { cat: c, level: c.level });
    return 'level';
  }
  return 'bite';
}

/** feed until target level or out of food; returns levels gained */
export function feedTo(c: OwnedCat, target: number) {
  let gained = 0;
  let guard = 0;
  while (c.level < Math.min(target, levelCap()) && guard++ < 4000) {
    const r = feed(c);
    if (r === 'level') gained++;
    if (r === 'poor' || r === 'cap') break;
  }
  return gained;
}

export function catGold(c: OwnedCat) {
  const def = catDef(c.species);
  return catGoldPerSec(def.rarity, c.level, c.stars) * (def.economy.goldMod ?? 1) * accessoryMods(c).goldMul * podioCatMods(c).goldMul;
}
export function catPow(c: OwnedCat) {
  return catPower(catDef(c.species).rarity, c.level, c.stars);
}
export function catHpBase(c: OwnedCat) {
  const def = catDef(c.species);
  const role = ROLE_BY_ID.get(def.role);
  let hp = role?.hp ?? 100;
  if (c.mutation === 'fosilizado') hp *= 1.2;
  return hp;
}

// ---------------------------------------------------------------- stars
export function starNeed(c: OwnedCat) {
  return starOrbs(catDef(c.species).rarity, c.stars);
}
export function starMax() {
  return BAL.cats.stars.max;
}
/** Prisma = wildcard: 1 Prisma covers 1 missing Soul Orb of any species (balance.resources.prisma). */
export function canStarUp(c: OwnedCat, usePrisma = true) {
  if (c.stars >= starMax()) return false;
  if (c.level < starMinLevel(c.stars)) return false;
  return (G.s.orbs[c.species] ?? 0) + (usePrisma ? G.s.prisma : 0) >= starNeed(c);
}
export function starUp(c: OwnedCat, usePrisma = true) {
  if (!canStarUp(c, usePrisma)) return false;
  let need = starNeed(c);
  const own = Math.min(need, G.s.orbs[c.species] ?? 0);
  G.s.orbs[c.species] = (G.s.orbs[c.species] ?? 0) - own;
  need -= own;
  if (need > 0) G.add('prisma', -need, 'altar');
  c.stars++;
  c.moments.push(`★${c.stars} en el Altar de Almas (${Math.round(G.s.playMs / 60000)} min de juego)`);
  G.xp('star_up');
  G.count('star_ups');
  G.count(`star_up_${c.stars}`);
  G.recalc();
  return true;
}

// ---------------------------------------------------------------- Prisma shop (gems sink: balance.gems.sinks.prisma_orb)
/** total Prisma you may buy with gems: balance.orbs.prisma_gem_purchases_per_boss per boss defeated (min 1 boss worth) */
export function prismaShopLeft() {
  const cap = BAL.orbs.prisma_gem_purchases_per_boss * Math.max(1, G.s.campaign.bossesDefeated);
  return Math.max(0, cap - (collState().prismaBought ?? 0));
}
export function prismaPrice() {
  return BAL.orbs.prisma_gem_price;
}
export function buyPrisma(n = 1) {
  const k = Math.min(n, prismaShopLeft());
  if (k <= 0 || !G.spend({ gems: k * prismaPrice() })) return 0;
  G.add('prisma', k, 'gem_shop');
  const st = collState();
  st.prismaBought = (st.prismaBought ?? 0) + k;
  return k;
}

// ---------------------------------------------------------------- catdex
export type DexStatus = 'unknown' | 'silhouette' | 'rumor' | 'registered';
export function dexStatus(species: string): DexStatus {
  const s = G.s.catdex[species];
  if (s) return s;
  const def = catDef(species);
  if (def.secret) return 'unknown';
  return def.elements.every((e) => G.s.elements.includes(e)) ? 'silhouette' : 'unknown';
}
export function setsCompleted() {
  return CONTENT.catdexSets.filter((s) => s.cats.every((id) => G.s.catdex[id] === 'registered'));
}

/** next "threshold" (Nv10/20/30/40) the cat will reach and its upgrade text */
export function nextThreshold(c: OwnedCat) {
  const el = CONTENT.elements.find((e) => e.id === catDef(c.species).combat.shot.element);
  for (const lv of [10, 20, 30, 40]) if (c.level < lv) return { level: lv, up: el?.levelUpgrades[String(lv)] };
  return null;
}

// ---------------------------------------------------------------- collection scratch state (G.s.ext.collection)
export interface CollState {
  /** catdex sets whose reward (Prisma + Ronroneo + rule) was granted */
  setsClaimed: string[];
  /** set ids waiting for their T3 poster */
  celebrate: string[];
  /** duplicate WITH mutation: the player chooses orbs or transferring the mutation (GDD 2.6 rule 8) */
  mutChoices: { id: string; species: string; mutation: string; orbs: number }[];
  /** extra resonance slots bought with gems (balance.gems.sinks.resonance_slot) */
  gemSlots?: number;
  /** Prisma bought with gems (balance.orbs.prisma_gem_purchases_per_boss) */
  prismaBought?: number;
  /** Altar preference */
  usePrisma?: boolean;
  /** recent crosses (newest first) for REPETIR CRUCE */
  history?: { a: string; b: string; result: string; isNew: boolean; at: number }[];
}
export function collState(): CollState {
  const ext = (G.s.ext ??= {});
  const st = (ext.collection ??= { setsClaimed: [], celebrate: [], mutChoices: [] }) as CollState;
  st.setsClaimed ??= [];
  st.celebrate ??= [];
  st.mutChoices ??= [];
  return st;
}

// ---------------------------------------------------------------- catdex sets (GDD 2.7: Prisma + Ronroneo + one combat rule)
export type CatdexSet = (typeof CONTENT.catdexSets)[number];
/**
 * Grant the reward of every newly completed set (once). Each completed set also raises the flag
 * `<set.id>` (e.g. G.has('set_brasas')) so combat can apply its rule. Returns the sets just completed.
 */
export function checkSets(): CatdexSet[] {
  const st = collState();
  const fresh = setsCompleted().filter((s) => !st.setsClaimed.includes(s.id));
  for (const set of fresh) {
    st.setsClaimed.push(set.id);
    st.celebrate.push(set.id);
    G.add('prisma', BAL.orbs.prisma_from_catdex_set, 'catdex_set');
    G.purr('catdex_set', 'discovery');
    G.flag(set.id);
    G.count('catdex_sets');
  }
  return fresh;
}
/** true when the catdex set rule is active (combat reads this). */
export function setRuleActive(setId: string) {
  return collState().setsClaimed.includes(setId) || G.has(setId);
}
/** all active set rules (for combat / UI) */
export function activeSetRules(): { id: string; name: string; rule: string }[] {
  return CONTENT.catdexSets.filter((s) => setRuleActive(s.id)).map((s) => ({ id: s.id, name: s.name, rule: s.rule }));
}
/** pop the set posters waiting to be shown */
export function takeSetCelebrations(): CatdexSet[] {
  const st = collState();
  const ids = st.celebrate.splice(0);
  return ids.map((id) => CONTENT.catdexSets.find((s) => s.id === id)).filter((s): s is CatdexSet => !!s);
}

// ---------------------------------------------------------------- traits (GDD 2.5: combat-only)
export interface TraitInfo {
  id: string;
  name: string;
  effect: string;
}
export function traitInfoById(id: string | null | undefined): TraitInfo | null {
  if (!id) return null;
  return CONTENT.traits.find((t) => t.id === id) ?? null;
}
/** the cat's trait (combat applies the effect; see GDD 2.5 for each rule) */
export function traitOf(c: Pick<OwnedCat, 'trait'> | null | undefined): TraitInfo | null {
  return traitInfoById(c?.trait);
}
/** 70% species trait · 30% random (GDD 2.5); KL30 "Herencia": 50% inherits a parent's trait */
export function rollTrait(species: string, parents: (OwnedCat | undefined)[] = []): { trait: string; inherited: boolean } {
  const def = catDef(species);
  const ps = parents.filter((p): p is OwnedCat => !!p);
  if (G.s.kl >= 30 && ps.length && Math.random() < 0.5) {
    const p = ps[Math.floor(Math.random() * ps.length)];
    return { trait: p.trait, inherited: true };
  }
  if (Math.random() < 0.7) return { trait: def.trait, inherited: false };
  const pool = CONTENT.traits.filter((t) => t.id !== def.trait);
  return { trait: pool[Math.floor(Math.random() * pool.length)]?.id ?? def.trait, inherited: false };
}

// ---------------------------------------------------------------- mutations (GDD 2.5: combat-only, KL20)
export interface MutationDef {
  id: string;
  name: string;
  weight: number;
  habitatBias: string | null;
  effect: string;
}
export const MUTATIONS = ((CONTENT as unknown as { mutations?: MutationDef[] }).mutations ?? []) as MutationDef[];
export function mutationDef(id: string | null | undefined): MutationDef | null {
  if (!id) return null;
  return MUTATIONS.find((m) => m.id === id) ?? null;
}
/** the cat's mutation (combat applies it; Fosilizado is already inside catHpBase) */
export function mutationOf(c: Pick<OwnedCat, 'mutation'> | null | undefined): MutationDef | null {
  return mutationDef(c?.mutation);
}
/** resolve a duplicate-with-mutation: keep the orbs, or transfer the mutation to the owned cat */
export function resolveMutationChoice(id: string, choice: 'orbs' | 'transfer') {
  const st = collState();
  const i = st.mutChoices.findIndex((m) => m.id === id);
  if (i < 0) return null;
  const m = st.mutChoices.splice(i, 1)[0];
  const owned = G.s.cats.filter((c) => c.species === m.species).sort((a, b) => b.stars - a.stars || b.level - a.level)[0];
  if (choice === 'transfer' && owned) {
    owned.mutation = m.mutation;
    owned.moments.push(`Heredó la mutación ${mutationDef(m.mutation)?.name ?? m.mutation} de un duplicado`);
    G.count('mutations_owned');
    G.count('mutation_transfers');
    G.recalc();
    G.emit('catAdded', { cat: owned, isNew: false, orbs: 0 });
    return { choice, cat: owned, orbs: 0 };
  }
  G.addOrbs(m.species, m.orbs);
  if (owned) G.emit('catAdded', { cat: owned, isNew: false, orbs: m.orbs });
  return { choice: 'orbs' as const, cat: owned ?? null, orbs: m.orbs };
}

// ---------------------------------------------------------------- star perks (GDD 2.5: ★2 stats · ★3 secondary · ★4 visual · ★5 mastery · ★6 ascended)
export interface StarPerks {
  stars: number;
  /** stat multiplier vs ★1 (balance.cats.stars.mult) — already applied inside catPow/catGold */
  statMult: number;
  /** ★3 secondary effect, when active */
  star3: string | null;
  /** ★4: the attack looks different (bigger projectile, element trail, new impact) */
  star4: boolean;
  /** ★5 mastery passive, when active */
  star5: string | null;
  /** ★6 Forma Ascendida */
  star6: boolean;
  /** simple shot deltas parsed from the ACTIVE ★3/★5 texts — add them to the base shot */
  shot: { projectiles: number; bounces: number; pierce: number };
  /** active perks that need bespoke combat code: id = `<species>:star3` | `<species>:star5` */
  custom: { id: string; star: 3 | 5; text: string }[];
}
const clean = (s: string, n: number) => s.replace(new RegExp(`^★${n}:\\s*`), '').trim();
/** structured star perks for combat (Battle) + UI */
export function starPerks(c: Pick<OwnedCat, 'species' | 'stars'>): StarPerks {
  const def = catDef(c.species);
  const shotName = def.combat.shot.name.toLowerCase();
  const out: StarPerks = {
    stars: c.stars,
    statMult: starMult(c.stars),
    star3: c.stars >= 3 ? clean(def.combat.star3, 3) : null,
    star4: c.stars >= 4,
    star5: c.stars >= 5 ? clean(def.combat.star5, 5) : null,
    star6: c.stars >= 6,
    shot: { projectiles: 0, bounces: 0, pierce: 0 },
    custom: [],
  };
  const parse = (text: string, star: 3 | 5) => {
    const t = text.toLowerCase();
    const ultKey = def.combat.ultimate.name.split(/[!(]/)[0].trim().toLowerCase();
    const aboutUlt = /ultimate|\bult\b/.test(t) || (ultKey.length > 3 && t.includes(ultKey));
    const aboutShot = !aboutUlt && (t.startsWith('+') || t.startsWith('tercer') || t.includes(shotName));
    let m: RegExpExecArray | null;
    if (aboutShot && (m = /^\+(\d+) (hoja|grulla|semilla|bola|runa|proyectil|chispa|pétalo|rayo)/.exec(t))) out.shot.projectiles += Number(m[1]);
    else if (aboutShot && (m = /\+(\d+) rebote/.exec(t))) out.shot.bounces += Number(m[1]);
    else if (aboutShot && /tercer rebote/.test(t)) out.shot.bounces += 1;
    else if (aboutShot && (m = /(?:perfora \+?(\d+) capa|\+(\d+) capa de perforaci)/.exec(t))) out.shot.pierce += Number(m[1] ?? m[2]);
    else out.custom.push({ id: `${c.species}:star${star}`, star, text });
  };
  if (out.star3) parse(out.star3, 3);
  if (out.star5) parse(out.star5, 5);
  return out;
}

export { CATS };
