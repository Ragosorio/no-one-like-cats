/**
 * TIENDA — precios y compras (agente tienda). Nada de dinero real: todo se paga con Doblones (gold)
 * o con Ojos de Gato (gems), que solo se ganan jugando. Ninguna compra crea gemas.
 *
 * ── CÓMO SE CALCULAN LOS PRECIOS ────────────────────────────────────────────────────────────────
 * Base de ingreso (`incomePerSec`): el oro/s real de la isla SIN el Momentum (para que el precio no
 * baile cuando acabas de ganar una batalla), con un piso de `BAL.habitats.new_habitat_cost_base`/60 s.
 * Un precio "en minutos de ingreso" = minutos × 60 × incomePerSec, redondeado a 2 cifras bonitas y
 * nunca menor que su piso (múltiplo de `new_habitat_cost_base`). Así la tienda escala con tu isla y
 * nunca se vuelve gratis ni imposible (GDD 08 §8: costos ≈ minutos de ingreso esperado).
 *
 *  HÁBITATS   `habitatCost(el)` de balance (habitats.placement): sube con los hábitats que ya tienes
 *             y con las copias del mismo elemento. Se colocan donde quepan (modo colocación libre,
 *             island/placement.ts); se mueven gratis y se venden por una parte de su valor.
 *  EDIFICIOS  sumideros de gemas de `BAL.gems.sinks`: Constructor extra 50 (máx 1, flag
 *             `extra_builder` que ya lee island.builders()), Reloj de arena grande 30 (máx 1, flag
 *             `big_hourglass` que ya lee G.purr), Ranura de Resonancia 40 → `buyGemSlot()` de
 *             resonance.ts (no se duplica lógica). Banco / Muelle / Expansiones / Astillero = enlaces.
 *  ORBES      · Gemas: paquete de ORB_PACK orbes de una especie tuya por ORB_PACK_GEMS (1.6/orbe, la
 *               Prisma comodín cuesta `BAL.orbs.prisma_gem_price`=2). Comparte el tope de compras con
 *               gemas de la Prisma (`prisma_gem_purchases_per_boss` por jefe) → no rompe la compuerta.
 *             · Oro: ORB_GOLD_MIN min de ingreso por orbe × ORB_GOLD_GROWTH^(orbes ya comprados con oro
 *               de esa especie). Sube rápido a propósito: es una comodidad cara, no una ruta (las
 *               compuertas viven en la escala chica, GDD 08 P3).
 *  GATOS      solo Comunes de elementos descubiertos que AÚN no tienes, a CAT_MIN min de ingreso
 *             (piso: 2 hábitats nuevos). Se adoptan con `free:true` → registran Catdex pero NO dan las
 *             gemas de especie nueva (comprar no es descubrir). Los duplicados siguen saliendo de la
 *             Resonancia (55% de peso Común), así que la Resonancia sigue siendo el camino.
 *  DECORACIÓN ver state/sys/decor.ts (oro en minutos de ingreso o gemas dentro de cosmetics.cost_range).
 */
import { G } from '../game';
import { BAL, newHabitatCost, purrPoolCapMin } from '../econ';
import { CATS, catDef } from '../../data/content';
import { builders, globalGoldMult, nextHabitatCost, expansionState } from './island';
import { hasHabitatSpace, roomForHabitats } from '../../island/placement';
import { adopt, collState, ownsSpecies, prismaShopLeft, starNeed, starMax } from './cats';
import { buyGemSlot, gemSlotInfo } from './resonance';
import { EXPANSIONS } from '../../data/content';

// ---------------------------------------------------------------- tunables (documented above)
export const ORB_PACK = 5;
export const ORB_PACK_GEMS = 8;
export const ORB_GOLD_MIN = 5;
export const ORB_GOLD_GROWTH = 1.15;
export const CAT_MIN = 45;

// ---------------------------------------------------------------- scratch state (G.s.ext.shop)
export interface ShopState {
  /** ids the player already saw in the shop (for the ¡NUEVO! stamps) */
  seen: string[];
  /** orbs bought with gold per species (price growth) */
  goldOrbs: Record<string, number>;
  /** decor ids that already paid their Reino XP (first purchase only) */
  xpGiven: string[];
  /** running receipt number (juice) */
  receipts: number;
}
export function shopState(): ShopState {
  const ext = (G.s.ext ??= {});
  const s = (ext.shop ??= { seen: [], goldOrbs: {}, xpGiven: [], receipts: 0 }) as ShopState;
  s.seen ??= [];
  s.goldOrbs ??= {};
  s.xpGiven ??= [];
  s.receipts ??= 0;
  return s;
}
export function isNew(id: string) {
  return !shopState().seen.includes(id);
}
export function markSeen(...ids: string[]) {
  const s = shopState();
  for (const id of ids) if (!s.seen.includes(id)) s.seen.push(id);
}
export function nextReceipt() {
  return ++shopState().receipts;
}

// ---------------------------------------------------------------- price index
/** island gold/s without the Momentum boost (stable price base) */
export function incomePerSec() {
  const mom = 1 + 0.5 * (G.s.momentum - 1);
  const floor = BAL.habitats.new_habitat_cost_base / 60;
  return Math.max(floor, G.goldPerSec / Math.max(1, mom));
}
/** 2 significant digits, the way price tags look ("1,200", "36K", "4.7M") */
export function nicePrice(n: number) {
  if (n < 100) return Math.max(1, Math.round(n / 5) * 5);
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
}
/** `minutes` of island income, never below `floorMult` × new_habitat_cost_base */
export function incomePrice(minutes: number, floorMult = 1) {
  return nicePrice(Math.max(BAL.habitats.new_habitat_cost_base * floorMult, incomePerSec() * 60 * minutes));
}

// ---------------------------------------------------------------- habitats
export function habitatPrice(element?: string) {
  return nextHabitatCost(element);
}
/** how many more habitats fit on the land you own (greedy estimate) */
export function freePlotCount() {
  return roomForHabitats();
}
/** habitats you own + the ones that still fit */
export function totalPlotCount() {
  return G.s.habitats.length + roomForHabitats();
}
export function hasFreePlot() {
  return hasHabitatSpace();
}
/** first expansion you could buy (or the next locked one) to get more plots */
export function nextExpansion() {
  for (const e of EXPANSIONS) {
    const st = expansionState(e.n);
    if (st === 'available' || st === 'clearing') return { e, st };
  }
  for (const e of EXPANSIONS) if (expansionState(e.n) === 'locked') return { e, st: 'locked' as const };
  return null;
}
/** gold/s a tier-1 habitat of `el` would make with up to `cap` of your homeless cats of that element */
export function habitatPreviewRate(el: string, homelessGold: number[]) {
  const t1 = BAL.habitats.tiers[0];
  const best = [...homelessGold].sort((a, b) => b - a).slice(0, t1.capacity);
  return best.reduce((a, b) => a + b, 0) * t1.mult * globalGoldMult();
}

// ---------------------------------------------------------------- buildings (gem sinks + links)
export type BuildingId = 'builder' | 'res_slot' | 'hourglass';
export interface BuildingOffer {
  id: BuildingId;
  cost: number;
  owned: number;
  max: number;
}
export function buildingOffer(id: BuildingId): BuildingOffer {
  const S = BAL.gems.sinks;
  if (id === 'builder') return { id, cost: S.builder.cost, max: S.builder.max, owned: G.has('extra_builder') ? 1 : 0 };
  if (id === 'hourglass') return { id, cost: S.purr_cap_plus50.cost, max: S.purr_cap_plus50.max, owned: G.has('big_hourglass') ? 1 : 0 };
  const g = gemSlotInfo();
  return { id, cost: g.cost, max: g.left + g.bought, owned: g.bought };
}
export function buyBuilding(id: BuildingId): boolean {
  const o = buildingOffer(id);
  if (o.owned >= o.max || G.s.gems < o.cost) return false;
  if (id === 'res_slot') {
    if (!buyGemSlot()) return false;
  } else {
    if (!G.spend({ gems: o.cost })) return false;
    G.flag(id === 'builder' ? 'extra_builder' : 'big_hourglass');
  }
  G.count('shop_buy');
  G.count(`shop_building_${id}`);
  G.recalc();
  return true;
}
export function purrCapNow() {
  return purrPoolCapMin(G.s.kl, G.has('big_hourglass'));
}
export function purrCapWithHourglass() {
  return purrPoolCapMin(G.s.kl, true);
}
export function buildersNow() {
  return builders();
}

// ---------------------------------------------------------------- orbs
export interface OrbOffer {
  species: string;
  /** current orbs / orbs for the next star (null at max stars) */
  have: number;
  need: number | null;
  gold: number;
  gemsLeft: number;
}
/** species you own (one card per species, best cat first) */
export function orbSpecies(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of [...G.s.cats].sort((a, b) => b.stars - a.stars || b.level - a.level)) {
    if (seen.has(c.species)) continue;
    seen.add(c.species);
    out.push(c.species);
  }
  return out;
}
export function orbGoldPrice(species: string, n = ORB_PACK) {
  const k = shopState().goldOrbs[species] ?? 0;
  const per = incomePerSec() * 60 * ORB_GOLD_MIN;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += per * Math.pow(ORB_GOLD_GROWTH, k + i);
  return nicePrice(Math.max(BAL.habitats.new_habitat_cost_base, sum));
}
/** gem orbs left (shared with the Altar's Prisma purchases: prisma_gem_purchases_per_boss per boss) */
export function orbGemsLeft() {
  return prismaShopLeft();
}
export function orbOffer(species: string): OrbOffer {
  const best = G.s.cats.filter((c) => c.species === species).sort((a, b) => b.stars - a.stars)[0];
  const need = best && best.stars < starMax() ? starNeed(best) : null;
  return { species, have: G.s.orbs[species] ?? 0, need, gold: orbGoldPrice(species), gemsLeft: orbGemsLeft() };
}
export function buyOrbsGold(species: string) {
  if (!ownsSpecies(species)) return 0;
  const price = orbGoldPrice(species);
  if (!G.spend({ gold: price })) return 0;
  const s = shopState();
  s.goldOrbs[species] = (s.goldOrbs[species] ?? 0) + ORB_PACK;
  G.addOrbs(species, ORB_PACK);
  G.count('shop_buy');
  G.count('shop_orbs', ORB_PACK);
  return ORB_PACK;
}
export function buyOrbsGems(species: string) {
  if (!ownsSpecies(species) || orbGemsLeft() < ORB_PACK) return 0;
  if (!G.spend({ gems: ORB_PACK_GEMS })) return 0;
  const cs = collState();
  cs.prismaBought = (cs.prismaBought ?? 0) + ORB_PACK;
  G.addOrbs(species, ORB_PACK);
  G.count('shop_buy');
  G.count('shop_orbs', ORB_PACK);
  return ORB_PACK;
}

// ---------------------------------------------------------------- cats (commons only)
/** commons of discovered elements, not secret; `owned` ones are shown but can't be bought */
export function catOffers() {
  return CATS.filter((c) => c.rarity === 'common' && !c.secret && c.elements.every((e) => G.s.elements.includes(e))).map((c) => ({
    def: c,
    owned: ownsSpecies(c.id),
  }));
}
export function catPrice() {
  return nicePrice(Math.max(newHabitatCost(Math.max(1, G.s.habitats.length)) * 2, incomePerSec() * 60 * CAT_MIN));
}
export function buyCat(species: string) {
  const def = catDef(species);
  if (def.rarity !== 'common' || def.secret || ownsSpecies(species)) return null;
  if (!def.elements.every((e) => G.s.elements.includes(e))) return null;
  if (!G.spend({ gold: catPrice() })) return null;
  const r = adopt(species, { free: true });
  G.count('shop_buy');
  G.count('shop_cats');
  return r.cat;
}
