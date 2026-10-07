/**
 * El Podio → the rest of the game ("mejorar en un modo te mejora en el otro").
 * A cat's podio level gives it small, real bonuses OUTSIDE the Podio:
 *  - ship battles (state/sys/campaign.ts buildSiege): +dmg per power level, + initial ultimate meter per ULTI level
 *  - island (state/sys/cats.ts catGold): + gold per podio level
 * Neutral for cats that never stepped on the podio. Kept import-light (no system imports) to avoid cycles.
 */
import { G, OwnedCat } from '../state/game';
import PB from '../data/podio.json';
import { powerLevels } from './powers';

export interface PodioCatMods {
  dmgMul: number;
  ultStart: number;
  goldMul: number;
  hpMul: number;
}
const NEUTRAL: PodioCatMods = { dmgMul: 1, ultStart: 0, goldMul: 1, hpMul: 1 };

export function podioLevelOf(uid: string): number {
  return G.s.podio?.cats?.[uid]?.lvl ?? 0;
}

export function podioCatMods(c: OwnedCat | undefined | null): PodioCatMods {
  const lvl = c ? podioLevelOf(c.uid) : 0;
  if (lvl < 1) return NEUTRAL;
  const X = PB.cross_mode;
  const lv = powerLevels(lvl);
  const sum = lv[0] + lv[1] + lv[2] + lv[3];
  return {
    dmgMul: 1 + X.ship_dmg_per_power_level * Math.max(0, sum - 2),
    ultStart: X.ship_ult_start_per_ult_level * lv[3],
    goldMul: 1 + X.island_gold_per_podio_level * (lvl - 1),
    hpMul: 1,
  };
}
