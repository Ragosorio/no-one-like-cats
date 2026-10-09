/**
 * Economy formulas — single source of truth is src/data/balance.json
 * (from research/economy-sim, validated by simulation). Pure functions only.
 */
import B from '../data/balance.json';

export type RarityId = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'heroic' | 'divine';
export type FamilyId = 'hull' | 'weapon' | 'shield' | 'engine' | 'core';
export type PurrAction = keyof typeof B.ronroneo.base_min;
export type MomentumEvent = keyof typeof B.momentum.gain;
export type XpAction = Exclude<keyof typeof B.kingdom.xp_rewards_pct_of_bar, 'hatch'>;

export const BAL = B;

// ---------------------------------------------------------------- cats
/**
 * Levels 51–100 (balance cats.beyond_50, docs/part-ii/16-niveles-100.md). Up to Nv50 every curve below is the
 * original one — same expression, same floats — so a save that never passes Nv50 keeps its exact numbers.
 * Past Nv50 the per-level growth is softer (gold ×1.04, power ×1.03; feed jumps once, then ×1.13 per level).
 */
const X = B.cats.beyond_50;
/** a per-level multiplier: `lo`^(level−1) up to Nv50, then ×`hi` per level above it */
function levelCurve(lo: number, hi: number, level: number) {
  if (level <= X.from) return Math.pow(lo, level - 1);
  return Math.pow(lo, X.from - 1) * Math.pow(hi, level - X.from);
}
export function catGoldPerSec(r: RarityId, level: number, stars: number) {
  return B.rarities.gold_base_per_s[r] * levelCurve(B.cats.gold_per_level, X.gold_per_level, level) * starMult(stars);
}
export function catPower(r: RarityId, level: number, stars: number) {
  return B.rarities.power_base[r] * levelCurve(B.cats.power_per_level, X.power_per_level, level) * starMult(stars);
}
/**
 * The inverse of catPower: the (fractional) level at which a cat of that rarity and stars reaches `power`.
 * Below the Nv50 power it is the original 1.07 curve; above it, the softer one. Not clamped (callers round
 * and clamp: the Podio ladder shows rivals between Nv1 and Nv100).
 */
export function catLevelForPower(r: RarityId, stars: number, power: number) {
  const at50 = catPower(r, X.from, stars);
  if (power <= at50) return 1 + Math.log(power / catPower(r, 1, stars)) / Math.log(B.cats.power_per_level);
  return X.from + Math.log(power / at50) / Math.log(X.power_per_level);
}
export function starMult(stars: number) {
  return B.cats.stars.mult[Math.max(0, Math.min(5, stars - 1))];
}
/** food to go from level → level+1 (below Nv50: the original curve; from 50→51 on: a feast, then ×1.13 per level) */
export function feedCost(level: number, r: RarityId) {
  if (level < X.from) return Math.ceil(B.cats.feed_cost_base * Math.pow(B.cats.feed_cost_growth, level - 1) * B.rarities.food_mult[r]);
  return Math.ceil(B.cats.feed_cost_base * Math.pow(B.cats.feed_cost_growth, X.from - 1) * X.feed_wall * Math.pow(X.feed_cost_growth, level - X.from) * B.rarities.food_mult[r]);
}
/** the Reino part of the level cap, the same for every cat: Reino + 5, up to 50 (the early gate) */
export function catLevelCap(kl: number) {
  return Math.min(B.kingdom.level_cap_cats, kl + 5);
}
/**
 * A cat's own level cap. While the Reino gate is below 50 it is the whole story (Reino + 5); once it reaches 50,
 * each star from ★2 opens 10 more levels: ★1 50 · ★2 60 · ★3 70 · ★4 80 · ★5 90 · ★6 100 (never past max_level).
 */
export function catLevelCapFor(kl: number, stars: number) {
  const reino = catLevelCap(kl);
  if (reino < B.kingdom.level_cap_cats) return reino;
  const s = Math.max(1, Math.min(B.cats.stars.max, Math.floor(stars) || 1));
  return Math.min(X.max_level, reino + X.cap_per_star * (s - 1));
}
/** the highest level any cat can reach (★max, Reino gate open) */
export function catLevelMax() {
  return X.max_level;
}
/** total food to feed a cat from level `from` to level `to` (whole levels, paid as 4 bites like cats.feed) */
export function feedCostRange(from: number, to: number, r: RarityId) {
  let sum = 0;
  for (let l = Math.max(1, from); l < to; l++) sum += 4 * Math.ceil(feedCost(l, r) / 4);
  return sum;
}
/** orbs needed to go from `stars` to stars+1 */
export function starOrbs(r: RarityId, stars: number) {
  return B.rarities.star_orbs_base[r] * (B.cats.stars.orb_steps[stars - 1] ?? 99);
}
export function starMinLevel(stars: number) {
  return B.cats.stars.min_level[stars - 1] ?? 99;
}
export function duplicateOrbs(r: RarityId) {
  return B.rarities.duplicate_orbs[r];
}
export function discoveryGems(r: RarityId) {
  return B.rarities.discovery_gems[r];
}

// ---------------------------------------------------------------- island
export function habitatTier(t: number) {
  return B.habitats.tiers[Math.max(0, Math.min(B.habitats.tiers.length - 1, t - 1))];
}
/**
 * Price of one more habitat (free placement, balance habitats.placement): grows with how many you own
 * (steep at first, gentler after `late_from` so a big island stays reachable) and with copies of the
 * same element.
 */
export function newHabitatCost(owned: number, sameElement = 0) {
  const P = B.habitats.placement;
  const n = Math.max(1, owned);
  return Math.round(P.cost_base * Math.pow(P.growth, Math.min(n, P.late_from) - 1) * Math.pow(P.growth_late, Math.max(0, n - P.late_from)) * Math.pow(P.element_copy, Math.max(0, sameElement)));
}
/** what the n-th habitat cost before free placement (refund patch only) */
export function legacyHabitatCost(n: number) {
  const L = B.habitats.legacy;
  return Math.round(L.new_habitat_cost_base * Math.pow(L.new_habitat_cost_growth, n - 1));
}
export function islandGoldMult(species: number, catdexBonus: number, expansionGold: number, momentum: number) {
  return (1 + (0.02 + catdexBonus) * species) * (1 + expansionGold) * (1 + 0.5 * (momentum - 1));
}
export function crop(id: string) {
  return B.farms.crops.find((c) => c.id === id)!;
}
export function farmYield(cropId: string, farmLevel: number, foodBonus: number) {
  return Math.round(crop(cropId).food * Math.pow(B.farms.upgrade.yield_growth, farmLevel - 1) * (1 + foodBonus));
}
export function cropTimeMs(cropId: string, momentum: number) {
  return (crop(cropId).time_s * 1000) / (1 + 0.5 * (momentum - 1));
}
export function farmUpgradeCost(toLevel: number) {
  return Math.round(B.farms.upgrade.cost_base * Math.pow(B.farms.upgrade.cost_growth, toLevel - 2));
}
export function farmUpgradeTimeMs(toLevel: number) {
  return B.farms.upgrade.time_base_s * Math.pow(B.farms.upgrade.time_growth, toLevel - 2) * 1000;
}

// ---------------------------------------------------------------- ship
export function moduleCost(f: FamilyId, mk: number) {
  const fam = B.ship.families[f];
  return Math.round(fam.cost_base * Math.pow(fam.cost_growth, mk - 1));
}
export function modulePower(f: FamilyId, mk: number) {
  if (mk <= 0) return 0;
  return B.ship.families[f].power * Math.pow(B.ship.mk.power_growth, mk - 1);
}
export function mkCap(bossesDefeated: number) {
  return Math.min(B.ship.mk.max, bossesDefeated + 2);
}
export function mkMaterials(mk: number) {
  const i = mk - 1;
  return {
    scrap: B.ship.mk.scrap[i] ?? 0,
    blueprints: B.ship.mk.blueprints[i] ?? 0,
    crystals: B.ship.mk.crystals_weapon_shield_core[i] ?? 0,
    timeMs: (B.ship.mk.time_s[i] ?? 0) * 1000,
  };
}

// ---------------------------------------------------------------- combat
export function enemyPower(zone: number, stage: number) {
  const z = B.combat.zones[zone - 1];
  if (stage >= B.combat.stages_per_zone) return z.boss_power;
  const last = z.boss_power / B.combat.boss_over_last_stage;
  return z.stage1_power * Math.pow(last / z.stage1_power, (stage - 1) / 7);
}
/** absolute stage index (1..54) for rewards */
export function absStage(zone: number, stage: number) {
  return (zone - 1) * B.combat.stages_per_zone + stage;
}
export function battleGold(abs: number, goldPerSec: number, frontier: boolean, perfect: boolean, momentum: number, flash = false) {
  const R = B.combat.reward;
  const base = Math.max(R.gold_base * Math.pow(R.gold_growth, abs - 1), R.gold_income_seconds * goldPerSec);
  return base * (frontier ? 1 : R.farm_stage_mult) * (perfect ? R.perfect_mult : 1) * momentum * (flash ? 1.5 : 1);
}
export function battleScrap(abs: number, perfect: boolean, momentum: number, scrapMult = 1) {
  const R = B.combat.reward;
  return Math.max(1, Math.round((R.scrap_base + R.scrap_per_stage * abs) * (perfect ? 1.5 : 1) * momentum * scrapMult));
}
export function battleCrystals(zone: number) {
  const R = B.combat.reward;
  return Math.round(R.crystal_base + R.crystal_per_zone * zone);
}
export function blueprintAmount(zone: number) {
  return 1 + Math.floor((zone - 1) / 2);
}

/**
 * Map ship power vs enemy power to in-battle multipliers so the physics battle *feels* the
 * advantage while time-to-kill stays readable. Damage numbers shown are scaled by `display`.
 */
export function battleScaling(SP: number, EP: number) {
  const ratio = Math.max(0.25, Math.min(4, SP / Math.max(1, EP)));
  return {
    playerAtk: Math.pow(ratio, 0.5),
    playerHp: Math.pow(ratio, 0.35),
    enemyAtk: Math.pow(1 / ratio, 0.5),
    enemyHp: Math.pow(1 / ratio, 0.35),
    display: Math.max(1, EP / 20),
  };
}

// ---------------------------------------------------------------- time & tempo
export function purrMinutes(action: PurrAction, kl: number, momentum: number, affinity = false) {
  return B.ronroneo.base_min[action] * (1 + B.ronroneo.kl_scale * (kl - 1)) * (1 + 0.5 * (momentum - 1)) * (affinity ? 1 + B.ronroneo.affinity_bonus : 1);
}
export function purrPoolCapMin(kl: number, bigHourglass: boolean) {
  return (B.ronroneo.pool_cap_min_base + B.ronroneo.pool_cap_min_per_kl * kl) * (bigHourglass ? 1.5 : 1);
}
export function momentumDecay(m: number, dtSec: number) {
  return 1 + (m - 1) * Math.pow(0.5, dtSec / B.momentum.half_life_s);
}
export function momentumAdd(m: number, ev: MomentumEvent) {
  return Math.min(B.momentum.max, m + B.momentum.gain[ev]);
}

// ---------------------------------------------------------------- kingdom
export function xpBar(kl: number) {
  return B.kingdom.xp_bar_base * Math.pow(B.kingdom.xp_bar_growth, kl - 1);
}
/** fraction of the current bar gained by an action */
export function xpFrac(pct: number, kl: number) {
  const k = B.kingdom;
  return (pct * (1 + k.xp_early_boost * Math.max(0, 1 - (kl - 1) / k.xp_early_levels))) / (1 + k.xp_drag_per_level * (kl - 1));
}
export function xpPct(action: XpAction | 'hatch', rarity?: RarityId): number {
  const t = B.kingdom.xp_rewards_pct_of_bar;
  if (action === 'hatch') return t.hatch[rarity ?? 'common'];
  return t[action] as number;
}
export function gemSkipMinutes(kl: number) {
  return B.gems.sinks.skip_productive_timer.minutes_per_gem * (1 + B.ronroneo.kl_scale * (kl - 1));
}
