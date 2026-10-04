/**
 * DECORACIÓN de la isla (agente tienda). Estado persistente en `G.s.decor`:
 *   owned[id]  = cuántos tienes GUARDADOS en el baúl (sin colocar)
 *   placed[]   = los colocados en la isla { uid, id, region, x, y } (x,y = casilla iso de origen)
 *
 * Precios (ver también state/sys/shop.ts):
 *   · oro  → `incomePrice(min, floor)`: minutos de ingreso de la isla (sin Momentum), piso en múltiplos
 *            de `BAL.habitats.new_habitat_cost_base`. Escala con tu isla y no se vuelve gratis.
 *   · gemas → dentro de `BAL.gems.sinks.cosmetics.cost_range` (20–80): el sumidero infinito de gemas.
 *   · vender devuelve SELL_BACK (50%) en la misma moneda. Comprar de nuevo NO repite la XP.
 * Bonos (pequeños a propósito, la decoración es sobre todo cosmética — GDD 2.1):
 *   · XP de Reino al comprar el PRIMER ejemplar de cada adorno (`build_done` × xp del adorno).
 *   · Sets: con TODAS sus piezas COLOCADAS en la isla → +3% en una sola palanca:
 *       Puerto Pirata  +3% oro de hábitats (se suma al búfer/banco, respeta el tope LLENO)
 *       Rincón Cozy    +3% velocidad de pesca (relojes de cultivo)
 *       Noche de Neón  +3% velocidad de obras (construcción, mejoras, muelle, expansiones)
 *       Museo Felino   +3% velocidad de Resonancia
 */
import { G, TimerKind } from '../game';
import { BAL } from '../econ';
import { Emitter } from '../../core/events';
import { bankOfflineHours, bankUnlocked, habitatCap, habitatRate } from './island';
import { incomePrice, shopState } from './shop';

export type DecorSet = 'pirata' | 'cozy' | 'neon' | 'museo';
export type DecorCurrency = 'gold' | 'gems';

export interface DecorDef {
  id: string;
  name: string;
  /** one-line pitch (shop card) */
  blurb: string;
  /** style dimension (art direction 10 §2) */
  dim: string;
  /** dimension accent color for the card */
  color: number;
  /** footprint in tiles (1 or 2) */
  size: 1 | 2;
  cur: DecorCurrency;
  /** gold: minutes of income · gems: flat price */
  price: number;
  /** gold only: floor as a multiple of new_habitat_cost_base */
  floor?: number;
  set?: DecorSet;
  /** Reino level to unlock (or boss count) */
  kl?: number;
  bosses?: number;
  /** Reino XP multiplier on first purchase (× build_done) */
  xp: number;
}

export const SELL_BACK = 0.5;

export const DECOR_SETS: Record<DecorSet, { name: string; bonus: string; color: number; value: number }> = {
  pirata: { name: 'PUERTO PIRATA', bonus: '+3% oro de hábitats', color: 0x1f2b4a, value: 0.03 },
  cozy: { name: 'RINCÓN COZY', bonus: '+3% velocidad de pesca', color: 0xff6a1a, value: 0.03 },
  neon: { name: 'NOCHE DE NEÓN', bonus: '+3% velocidad de obras', color: 0xff2e88, value: 0.03 },
  museo: { name: 'MUSEO FELINO', bonus: '+3% velocidad de Resonancia', color: 0xb89558, value: 0.03 },
};

export const DECOR: DecorDef[] = [
  // ---- RINCÓN COZY
  { id: 'caja_legendaria', name: 'Caja Legendaria', blurb: 'Si quepo, me siento. Ley universal. Viene con inquilino.', dim: 'COZY ISLA', color: 0xd9a066, size: 1, cur: 'gold', price: 2, floor: 1, set: 'cozy', kl: 1, xp: 0.5 },
  { id: 'ovillo_gigante', name: 'Ovillo Gigante', blurb: 'Tres toneladas de estambre. Nadie sale vivo de esta siesta.', dim: 'COZY ISLA', color: 0xff7ab8, size: 1, cur: 'gold', price: 3, floor: 2, set: 'cozy', kl: 3, xp: 0.6 },
  { id: 'fogata', name: 'Fogata de Sardinas', blurb: 'Cuentos de miedo, malvaviscos de atún y mucho ronroneo.', dim: 'COZY ISLA', color: 0xff6a1a, size: 1, cur: 'gold', price: 3, floor: 2, set: 'cozy', kl: 3, xp: 0.6 },
  { id: 'rascador_gigante', name: 'Rascador Gigante', blurb: 'Cuatro pisos de soga. Tus sillones te lo agradecerán.', dim: 'COZY ISLA', color: 0xc6f0e4, size: 1, cur: 'gold', price: 5, floor: 4, set: 'cozy', kl: 5, xp: 0.8 },
  // ---- PUERTO PIRATA
  { id: 'barril_sardinas', name: 'Barril de Sardinas', blurb: 'Huele a victoria. Bueno, a sardina. Es lo mismo.', dim: 'DIARIO DEL MAR', color: 0xb98348, size: 1, cur: 'gold', price: 2, floor: 1, set: 'pirata', kl: 2, xp: 0.5 },
  { id: 'ancla_oxidada', name: 'Ancla Oxidada', blurb: 'De un barco que perdió contra un gato. Clásico.', dim: 'NOIR OCEÁNICO', color: 0x3569a3, size: 1, cur: 'gold', price: 3, floor: 2, set: 'pirata', kl: 4, xp: 0.6 },
  { id: 'bandera_pirata', name: 'Bandera Michi-Pirata', blurb: 'Calavera de gato y espinas de pescado. Que tiemblen.', dim: 'PÓSTER RETRO', color: 0xc8102e, size: 1, cur: 'gold', price: 4, floor: 3, set: 'pirata', kl: 4, xp: 0.7 },
  { id: 'cofre_tesoro', name: 'Cofre del Tesoro', blurb: 'Brilla. Mucho. Las urracas del Primer Mar lo saben.', dim: 'DIARIO DEL MAR', color: 0xffc94a, size: 1, cur: 'gold', price: 6, floor: 5, set: 'pirata', kl: 6, xp: 0.9 },
  // ---- NOCHE DE NEÓN
  { id: 'farol_noir', name: 'Farol Noir', blurb: 'Para que tus gatos posen como detectives a medianoche.', dim: 'NOIR OCEÁNICO', color: 0x204a7a, size: 1, cur: 'gold', price: 2, floor: 1, set: 'neon', kl: 1, xp: 0.5 },
  { id: 'letrero_neon', name: 'Letrero «MIAU 24H»', blurb: 'Abierto toda la noche. Cerrado si hay siesta.', dim: 'NEÓN GLITCH', color: 0xff2e88, size: 1, cur: 'gold', price: 8, floor: 6, set: 'neon', kl: 6, xp: 0.9 },
  { id: 'holo_pez', name: 'Holo-Pez', blurb: 'Un pez de luz que nadie puede comerse. Tortura premium.', dim: 'NEÓN GLITCH', color: 0x00e5ff, size: 1, cur: 'gold', price: 6, floor: 8, set: 'neon', kl: 9, xp: 1 },
  { id: 'arcade', name: 'Arcade «Catstle Busters»', blurb: 'Récord actual: Canelo, 3 puntos. Se durmió en el nivel 1.', dim: 'NEÓN GLITCH', color: 0x8a5cff, size: 1, cur: 'gold', price: 10, floor: 12, set: 'neon', kl: 10, xp: 1.1 },
  // ---- MUSEO FELINO (gatos famosos, versión michi)
  { id: 'schrodinger', name: 'La Caja de Schrödinger', blurb: '¿Hay un gato? ¿No hay gato? Ábrela y arruinas la ciencia.', dim: 'MANGA TINTA', color: 0x171317, size: 1, cur: 'gold', price: 10, floor: 10, set: 'museo', kl: 8, xp: 1 },
  { id: 'bastet', name: 'Bastet de Bolsillo', blurb: 'Diosa egipcia. Exige ofrendas de atún. No negocia.', dim: 'ORQUÍDEA REAL', color: 0x5c3d5b, size: 1, cur: 'gold', price: 12, floor: 12, set: 'museo', kl: 7, xp: 1.1 },
  { id: 'gato_botas', name: 'Gato con Botas (estatua)', blurb: 'Sombrero, pluma, espada y cero humildad. De cuento.', dim: 'PÓSTER RETRO', color: 0xb3202a, size: 1, cur: 'gems', price: 25, set: 'museo', kl: 8, xp: 1.2 },
  { id: 'pensador_michi', name: 'El Pensador Michi', blurb: '¿Ser o no ser? No: ¿comer o dormir? Mármol del bueno.', dim: 'EDITORIAL SUIZO', color: 0xd9cdb8, size: 1, cur: 'gems', price: 40, set: 'museo', kl: 12, xp: 1.4 },
  // ---- PIEZAS ÚNICAS
  { id: 'buzon_gato', name: 'Buzón Gatuno', blurb: 'Solo recibe cartas de fans. Y facturas de pescado.', dim: 'COZY ISLA', color: 0xe8879a, size: 1, cur: 'gold', price: 1, floor: 1, kl: 1, xp: 0.4 },
  { id: 'cartel_se_busca', name: 'Cartel «SE BUSCA»', blurb: 'Capitán Bigotes Rotos. Recompensa: una lata. Ya lo cazaste.', dim: 'DIARIO DEL MAR', color: 0xe9dcc1, size: 1, cur: 'gold', price: 5, floor: 4, bosses: 1, xp: 0.8 },
  { id: 'torii_gatuno', name: 'Torii Gatuno', blurb: 'Portal ceremonial con orejitas. Entra un gato, sale un ninja.', dim: 'ANIME INFERNO', color: 0xc8102e, size: 1, cur: 'gems', price: 30, kl: 5, xp: 1.2 },
  { id: 'estatua_canelo', name: 'Estatua de Canelo', blurb: '«El Primero». Dorada, enorme y un poco impaciente.', dim: 'ORQUÍDEA REAL', color: 0xb89558, size: 1, cur: 'gems', price: 60, kl: 15, xp: 1.5 },
  { id: 'fuente_atun', name: 'Fuente de Atún', blurb: 'Un atún de bronce escupe agua 24/7. El sueño húmedo felino.', dim: 'COZY ISLA', color: 0x7fd8ff, size: 2, cur: 'gems', price: 80, kl: 10, xp: 1.5 },
];
export const DECOR_BY_ID = new Map(DECOR.map((d) => [d.id, d]));
export function decorDef(id: string) {
  return DECOR_BY_ID.get(id)!;
}

/** scene notifications (island layer re-syncs on 'changed') */
export const decorBus = new Emitter<{ changed: undefined }>();

// ---------------------------------------------------------------- state
export interface PlacedDecor {
  uid: string;
  id: string;
  region: string;
  x: number;
  y: number;
}
export function decorState() {
  G.s.decor ??= { owned: {}, placed: [] };
  G.s.decor.owned ??= {};
  G.s.decor.placed ??= [];
  return G.s.decor;
}
export function stored(id: string) {
  return decorState().owned[id] ?? 0;
}
export function placedCount(id: string) {
  return decorState().placed.filter((p) => p.id === id).length;
}
export function ownedTotal(id: string) {
  return stored(id) + placedCount(id);
}
export function storedTotal() {
  return Object.values(decorState().owned).reduce((a, b) => a + b, 0);
}

// ---------------------------------------------------------------- prices / unlocks
export function decorPrice(d: DecorDef) {
  return d.cur === 'gems' ? d.price : incomePrice(d.price, d.floor ?? 1);
}
export function sellPrice(d: DecorDef) {
  return Math.floor(decorPrice(d) * SELL_BACK);
}
export function decorUnlocked(d: DecorDef) {
  if (d.kl && G.s.kl < d.kl) return false;
  if (d.bosses && G.s.campaign.bossesDefeated < d.bosses) return false;
  return true;
}
export function unlockText(d: DecorDef) {
  if (d.bosses && G.s.campaign.bossesDefeated < d.bosses) return `JEFE ${d.bosses}`;
  return `REINO ${d.kl ?? 1}`;
}
export function canAfford(d: DecorDef) {
  return d.cur === 'gems' ? G.s.gems >= decorPrice(d) : G.s.gold >= decorPrice(d);
}

// ---------------------------------------------------------------- actions
/** buy one copy into the storage chest. Returns the Reino XP multiplier granted (0 = repeat) */
export function buyDecor(id: string): { ok: boolean; xp: number; price: number } {
  const d = decorDef(id);
  if (!d || !decorUnlocked(d)) return { ok: false, xp: 0, price: 0 };
  const price = decorPrice(d);
  if (!G.spend(d.cur === 'gems' ? { gems: price } : { gold: price })) return { ok: false, xp: 0, price };
  const st = decorState();
  st.owned[id] = (st.owned[id] ?? 0) + 1;
  const ss = shopState();
  let xp = 0;
  if (!ss.xpGiven.includes(id)) {
    ss.xpGiven.push(id);
    xp = d.xp;
    G.xp('build_done', undefined, d.xp);
  }
  G.count('shop_buy');
  G.count('decor_bought');
  decorBus.emit('changed', undefined);
  return { ok: true, xp, price };
}
/** move one copy from the chest to the island */
export function placeDecor(id: string, region: string, x: number, y: number): PlacedDecor | null {
  const st = decorState();
  if ((st.owned[id] ?? 0) <= 0) return null;
  st.owned[id]--;
  if (st.owned[id] <= 0) delete st.owned[id];
  const p: PlacedDecor = { uid: G.uid('d'), id, region, x, y };
  st.placed.push(p);
  G.count('decor_placed');
  decorBus.emit('changed', undefined);
  return p;
}
export function moveDecor(uid: string, region: string, x: number, y: number) {
  const p = decorState().placed.find((q) => q.uid === uid);
  if (!p) return false;
  p.region = region;
  p.x = x;
  p.y = y;
  decorBus.emit('changed', undefined);
  return true;
}
/** back to the chest */
export function storeDecor(uid: string) {
  const st = decorState();
  const p = st.placed.find((q) => q.uid === uid);
  if (!p) return false;
  st.placed = st.placed.filter((q) => q !== p);
  st.owned[p.id] = (st.owned[p.id] ?? 0) + 1;
  decorBus.emit('changed', undefined);
  return true;
}
/** sell a placed copy (uid) or a stored one (id) for SELL_BACK of the current price */
export function sellDecor(ref: { uid?: string; id?: string }): number {
  const st = decorState();
  let id: string | undefined;
  if (ref.uid) {
    const p = st.placed.find((q) => q.uid === ref.uid);
    if (!p) return 0;
    st.placed = st.placed.filter((q) => q !== p);
    id = p.id;
  } else if (ref.id && (st.owned[ref.id] ?? 0) > 0) {
    id = ref.id;
    st.owned[id]--;
    if (st.owned[id] <= 0) delete st.owned[id];
  }
  if (!id) return 0;
  const d = decorDef(id);
  const back = sellPrice(d);
  G.add(d.cur === 'gems' ? 'gems' : 'gold', back, 'decor_sell');
  G.count('decor_sold');
  decorBus.emit('changed', undefined);
  return back;
}

// ---------------------------------------------------------------- sets
export function setPieces(set: DecorSet) {
  return DECOR.filter((d) => d.set === set);
}
export function setComplete(set: DecorSet) {
  const placed = new Set(decorState().placed.map((p) => p.id));
  return setPieces(set).every((d) => placed.has(d.id));
}
export function setProgress(set: DecorSet) {
  const placed = new Set(decorState().placed.map((p) => p.id));
  const pieces = setPieces(set);
  return { have: pieces.filter((d) => placed.has(d.id)).length, total: pieces.length };
}
export function activeSets(): DecorSet[] {
  return (Object.keys(DECOR_SETS) as DecorSet[]).filter(setComplete);
}

// ---------------------------------------------------------------- bonus runtime (tiny, see header)
const SPEED_KINDS: Record<Exclude<DecorSet, 'pirata'>, TimerKind[]> = {
  cozy: ['crop'],
  neon: ['build', 'habitat_upgrade', 'farm_upgrade', 'expansion'],
  museo: ['resonance'],
};
let cacheAcc = 1e9;
let cached: DecorSet[] = [];
function sets() {
  if (cacheAcc > 1000) {
    cacheAcc = 0;
    cached = G.s.decor ? activeSets() : [];
  }
  return cached;
}
decorBus.on('changed', () => (cacheAcc = 1e9));

function speedUp(ms: number, list: DecorSet[]) {
  for (const s of list) {
    if (s === 'pirata') continue;
    const kinds = SPEED_KINDS[s];
    const extra = ms * DECOR_SETS[s].value;
    for (const t of G.s.timers) if (kinds.includes(t.kind) && t.leftMs > 0) t.leftMs -= extra;
  }
}
G.tickers.push((dt) => {
  cacheAcc += dt;
  const list = sets();
  if (!list.length) return;
  speedUp(dt, list);
  if (list.includes('pirata')) {
    const k = DECOR_SETS.pirata.value * (dt / 1000);
    for (const h of G.s.habitats) {
      const r = habitatRate(h);
      if (r > 0) h.buffer = bankUnlocked() ? h.buffer + r * k : Math.min(habitatCap(h), h.buffer + r * k);
    }
  }
});
G.offliners.push((ms) => {
  cacheAcc = 1e9;
  const list = sets();
  if (!list.length) return;
  speedUp(ms, list);
  if (list.includes('pirata')) {
    const k = DECOR_SETS.pirata.value;
    const bankMs = bankOfflineHours() * 3600 * 1000;
    let dep = 0;
    for (const h of G.s.habitats) {
      const r = habitatRate(h);
      if (r <= 0) continue;
      if (bankUnlocked()) dep += r * k * (Math.min(ms, bankMs) / 1000);
      else h.buffer = Math.min(habitatCap(h), h.buffer + r * k * (ms / 1000));
    }
    if (dep > 0) G.add('gold', Math.floor(dep), 'decor_set');
  }
});

/** gold value (for UI) of the gem range in balance */
export const COSMETIC_RANGE = BAL.gems.sinks.cosmetics.cost_range;
