/**
 * Cat accessories (casino agent). Small, capped bonuses — never a power spike.
 *   G.s.accessories = { owned: { [id]: count }, equipped: { [catUid]: id } }   (one accessory per cat)
 *
 * CONTRACT for other systems (island gold, battle power/hp):
 *   accessoryMods(cat) → { goldMul, powMul, hpMul }  (neutral = 1,1,1)
 * It ALSO folds in the gacha "Holo" foil bonus (OwnedCat.holo) so a single call covers everything
 * the casino adds to a cat. Multiply your existing numbers by these factors.
 */
import { G, OwnedCat } from '../game';

export type AccSlot = 'head' | 'eye' | 'neck' | 'back';
export type AccRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AccessoryDef {
  id: string;
  name: string;
  slot: AccSlot;
  rarity: AccRarity;
  /** fractional bonuses (0.05 = +5%) */
  gold?: number;
  pow?: number;
  hp?: number;
  desc: string;
}

/** Not simulated by the economy model (GDD §9 #24): bonuses are deliberately tiny (≤ +10% per stat). */
export const ACCESSORIES: AccessoryDef[] = [
  { id: 'gorro_lana', name: 'Gorro de Lana', slot: 'head', rarity: 'common', gold: 0.03, desc: 'Calientito. En el trópico no sirve de nada, pero se ve bien.' },
  { id: 'collar_cascabel', name: 'Collar de Cascabel', slot: 'neck', rarity: 'common', gold: 0.03, desc: 'Suena cada vez que roba algo. O sea, siempre.' },
  { id: 'mono', name: 'Moño de Gala', slot: 'neck', rarity: 'common', hp: 0.03, desc: 'Para cenas elegantes y para huir de ellas.' },
  { id: 'paliacate', name: 'Paliacate', slot: 'neck', rarity: 'common', pow: 0.03, desc: 'Estilo bandido de rancho. Huele a aventura.' },
  { id: 'gorro_fiesta', name: 'Gorrito de Fiesta', slot: 'head', rarity: 'common', hp: 0.03, desc: 'Nadie sabe de quién era el cumpleaños.' },
  { id: 'lentes_sol', name: 'Lentes de Sol', slot: 'eye', rarity: 'rare', pow: 0.05, desc: 'Lidia con ello. Llegan pixel por pixel.' },
  { id: 'parche', name: 'Parche Pirata', slot: 'eye', rarity: 'rare', pow: 0.03, hp: 0.03, desc: 'Debajo no hay nada. Es puro estilo.' },
  { id: 'tricornio', name: 'Tricornio', slot: 'head', rarity: 'rare', gold: 0.05, desc: '¿Por qué se acabó el atún?' },
  { id: 'bufanda', name: 'Bufanda Infinita', slot: 'neck', rarity: 'rare', hp: 0.05, desc: 'Mide tres metros. El gato mide cuarenta centímetros.' },
  { id: 'monoculo', name: 'Monóculo', slot: 'eye', rarity: 'rare', gold: 0.03, pow: 0.03, desc: 'Muy bien, muy bien. Excelente, de hecho.' },
  { id: 'sombrerote', name: 'Sombrerote de Mariachi', slot: 'head', rarity: 'rare', hp: 0.05, desc: 'Le da sombra a medio barco.' },
  { id: 'chistera', name: 'Chistera de Mago', slot: 'head', rarity: 'epic', gold: 0.06, pow: 0.03, desc: 'Saca conejos. Los conejos no están contentos.' },
  { id: 'capa_heroe', name: 'Capa de Héroe', slot: 'back', rarity: 'epic', pow: 0.06, hp: 0.04, desc: '"Nada de capas", dijeron. No le importó.' },
  { id: 'lentes_3d', name: 'Lentes 3D', slot: 'eye', rarity: 'epic', gold: 0.04, pow: 0.04, desc: 'Ve el multiverso en tres dimensiones. Mareo incluido.' },
  { id: 'sombrero_bruja', name: 'Sombrero de Bruja', slot: 'head', rarity: 'epic', pow: 0.05, hp: 0.04, desc: 'Diez puntos para tu casa. La que sea.' },
  { id: 'cadena_oro', name: 'Cadena de Oro', slot: 'neck', rarity: 'epic', gold: 0.08, desc: 'Bling. Literal. Pesa más que el gato.' },
  { id: 'corona', name: 'Corona del Rey Michi', slot: 'head', rarity: 'legendary', gold: 0.08, pow: 0.06, hp: 0.06, desc: 'Larga vida al rey. Él ya lo sabía.' },
  { id: 'capa_cosmica', name: 'Capa Cósmica', slot: 'back', rarity: 'legendary', gold: 0.06, pow: 0.08, hp: 0.06, desc: 'Tiene galaxias adentro. Una se llama Atún.' },
  { id: 'aureola_glitch', name: 'Aureola Glitch', slot: 'head', rarity: 'legendary', gold: 0.05, pow: 0.1, desc: 'Viene de otra dimensión y no paga renta.' },
];

export const ACC_BY_ID = new Map(ACCESSORIES.map((a) => [a.id, a]));

export const ACC_RARITY_NAME: Record<AccRarity, string> = { common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legendary: 'LEGENDARIO' };
export const ACC_SLOT_NAME: Record<AccSlot, string> = { head: 'Cabeza', eye: 'Ojos', neck: 'Cuello', back: 'Espalda' };

/** Holo ("gato súper roto"): the gacha-exclusive foil variant. */
export const HOLO_BONUS = { gold: 0.15, pow: 0.12, hp: 0.1 } as const;

type AccState = NonNullable<typeof G.s.accessories>;
export function accState(): AccState {
  G.s.accessories ??= { owned: {}, equipped: {} };
  G.s.accessories.owned ??= {};
  G.s.accessories.equipped ??= {};
  return G.s.accessories;
}

export function equippedOn(cat: OwnedCat | string): AccessoryDef | null {
  const uid = typeof cat === 'string' ? cat : cat.uid;
  const id = G.s.accessories?.equipped?.[uid];
  return id ? (ACC_BY_ID.get(id) ?? null) : null;
}

/** CONTRACT: multiplicative modifiers from the cat's accessory + Holo foil (neutral 1,1,1). */
export function accessoryMods(cat: OwnedCat): { goldMul: number; powMul: number; hpMul: number } {
  let goldMul = 1;
  let powMul = 1;
  let hpMul = 1;
  const a = cat ? equippedOn(cat) : null;
  if (a) {
    goldMul += a.gold ?? 0;
    powMul += a.pow ?? 0;
    hpMul += a.hp ?? 0;
  }
  if (cat?.holo) {
    goldMul *= 1 + HOLO_BONUS.gold;
    powMul *= 1 + HOLO_BONUS.pow;
    hpMul *= 1 + HOLO_BONUS.hp;
  }
  return { goldMul, powMul, hpMul };
}

export function ownedCount(id: string): number {
  return G.s.accessories?.owned?.[id] ?? 0;
}
/** how many copies are currently worn */
export function equippedCount(id: string): number {
  return Object.values(G.s.accessories?.equipped ?? {}).filter((x) => x === id).length;
}
export function freeCount(id: string): number {
  return Math.max(0, ownedCount(id) - equippedCount(id));
}

export function addAccessory(id: string, n = 1) {
  if (!ACC_BY_ID.has(id)) return;
  const st = accState();
  st.owned[id] = (st.owned[id] ?? 0) + n;
  G.count('accessories_got', n);
  G.emit('res', { key: 'accessory', delta: n, source: id });
}

/** equip `id` on a cat (moves it from another cat if all copies are in use is NOT allowed: needs a free copy) */
export function equip(catUid: string, id: string): boolean {
  const st = accState();
  if (st.equipped[catUid] === id) return true;
  if (freeCount(id) <= 0) return false;
  st.equipped[catUid] = id;
  G.count('accessories_equipped');
  G.recalc();
  G.emit('changed', undefined);
  return true;
}

export function unequip(catUid: string) {
  const st = accState();
  if (!st.equipped[catUid]) return;
  delete st.equipped[catUid];
  G.recalc();
  G.emit('changed', undefined);
}

/** human summary of a bonus: "+5% oro · +3% poder" */
export function bonusText(a: Pick<AccessoryDef, 'gold' | 'pow' | 'hp'>): string {
  const p: string[] = [];
  if (a.gold) p.push(`+${Math.round(a.gold * 100)}% oro`);
  if (a.pow) p.push(`+${Math.round(a.pow * 100)}% poder`);
  if (a.hp) p.push(`+${Math.round(a.hp * 100)}% vida`);
  return p.join(' · ');
}

export function accessoriesOf(r: AccRarity): AccessoryDef[] {
  return ACCESSORIES.filter((a) => a.rarity === r);
}

/** pick a random accessory of a rarity (uniform) */
export function rollAccessory(r: AccRarity, rand: () => number = Math.random): AccessoryDef {
  const list = accessoriesOf(r);
  return list[Math.floor(rand() * list.length)] ?? ACCESSORIES[0];
}
