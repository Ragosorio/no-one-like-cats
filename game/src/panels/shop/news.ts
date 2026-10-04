/** ¡NUEVO! bookkeeping: which shop items the player hasn't seen yet (ids live in G.s.ext.shop.seen). */
import { G } from '../../state/game';
import { isNew } from '../../state/sys/shop';
import { catOffers, orbSpecies } from '../../state/sys/shop';
import { DECOR, decorUnlocked } from '../../state/sys/decor';
import type { ShopPage } from './ctx';

export const NEWS_IDS = {
  habitats: () => G.s.elements.map((e) => `hab:${e}`),
  edificios: () => ['bld:builder', 'bld:res_slot', 'bld:hourglass', ...(G.s.kl >= 15 ? ['bld:bank'] : [])],
  decoracion: () => DECOR.filter(decorUnlocked).map((d) => `dec:${d.id}`),
  orbes: () => orbSpecies().map((s) => `orb:${s}`),
  gatos: () => catOffers().filter((o) => !o.owned).map((o) => `cat:${o.def.id}`),
  cofres: () => ['chest:gacha'],
} as const;

export function tabNews(): Partial<Record<ShopPage, number>> {
  const out: Partial<Record<ShopPage, number>> = {};
  for (const [k, f] of Object.entries(NEWS_IDS)) out[k as ShopPage] = f().filter(isNew).length;
  return out;
}
