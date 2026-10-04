/** Owned cats: adoption, duplicates→orbs, feeding (4 ÑAM per level), stars, catdex. */
import { G, OwnedCat } from '../game';
import { CATS, CONTENT, catDef, ROLE_BY_ID } from '../../data/content';
import {
  catGoldPerSec,
  catLevelCap,
  catPower,
  discoveryGems,
  duplicateOrbs,
  feedCost,
  starMinLevel,
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
export function adopt(species: string, opts: { name?: string; level?: number; free?: boolean; mutation?: string | null } = {}): { cat: OwnedCat | null; isNew: boolean; orbs: number } {
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
    trait: def.trait,
    mutation: opts.mutation ?? null,
    bornAtMs: G.s.playMs,
    moments: [],
  };
  G.s.cats.push(c);
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
  return catGoldPerSec(def.rarity, c.level, c.stars) * (def.economy.goldMod ?? 1);
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
export function canStarUp(c: OwnedCat) {
  if (c.stars >= 6) return false;
  if (c.level < starMinLevel(c.stars)) return false;
  return (G.s.orbs[c.species] ?? 0) + G.s.prisma >= starNeed(c);
}
export function starUp(c: OwnedCat) {
  if (!canStarUp(c)) return false;
  let need = starNeed(c);
  const own = Math.min(need, G.s.orbs[c.species] ?? 0);
  G.s.orbs[c.species] = (G.s.orbs[c.species] ?? 0) - own;
  need -= own;
  if (need > 0) G.add('prisma', -need);
  c.stars++;
  G.xp('star_up');
  G.count('star_ups');
  G.recalc();
  return true;
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

export { CATS };
