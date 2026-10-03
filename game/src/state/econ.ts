/**
 * Economy formulas — single source of truth is src/data/balance.json
 * (from research/economy-sim, validated by simulation). Pure functions only.
 */
import B from '../data/balance.json';

export type RarityId = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type FamilyId = 'hull' | 'weapon' | 'shield' | 'engine' | 'core';
export type PurrAction = keyof typeof B.ronroneo.base_min;
export type MomentumEvent = keyof typeof B.momentum.gain;
export type XpAction = Exclude<keyof typeof B.kingdom.xp_rewards_pct_of_bar, 'hatch'>;

export const BAL = B;

// ---------------------------------------------------------------- cats
export function catGoldPerSec(r: RarityId, level: number, stars: number) {
  return B.rarities.gold_base_per_s[r] * Math.pow(B.cats.gold_per_level, level - 1) * starMult(stars);
}
export function catPower(r: RarityId, level: number, stars: number) {
  return B.rarities.power_base[r] * Math.pow(B.cats.power_per_level, level - 1) * starMult(stars);
}
export function starMult(stars: number) {
  return B.cats.stars.mult[Math.max(0, Math.min(5, stars - 1))];
}
/** food to go from level → level+1 */
export function feedCost(level: number, r: RarityId) {
  return Math.ceil(B.cats.feed_cost_base * Math.pow(B.cats.feed_cost_growth, level - 1) * B.rarities.food_mult[r]);
}
export function catLevelCap(kl: number) {
  return Math.min(B.kingdom.level_cap_cats, kl + 5);
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
export function newHabitatCost(n: number) {
  return Math.round(B.habitats.new_habitat_cost_base * Math.pow(B.habitats.new_habitat_cost_growth, n - 1));
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
