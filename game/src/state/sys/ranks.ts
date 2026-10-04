/**
 * Rangos por K.O. (GDD 2.9.11): por gato, cuentan aunque pierdas (módulos destruidos + gatos noqueados).
 * Bronce I-III (5/15/30) · Plata I-III (50/80/120) · Oro I-III (170/230/300).
 * Cada rango: +2 orbes de ese gato y una insignia; bono de daño acumulado máx. +10% (solo combate).
 * Contrato: Colección muestra la insignia (CatPanel) con koRank(); Combate suma OwnedCat.kos al final de cada batalla.
 */
export interface KoRankDef {
  id: string;
  name: string;
  tier: number;
  /** K.O. needed to reach this rank */
  min: number;
  /** badge metal */
  metal: 'none' | 'bronze' | 'silver' | 'gold';
  color: number;
}

export const KO_RANKS: KoRankDef[] = [
  { id: 'none', name: 'Sin rango', tier: 0, min: 0, metal: 'none', color: 0x8a8378 },
  { id: 'bronce_1', name: 'Bronce I', tier: 1, min: 5, metal: 'bronze', color: 0xc77b3a },
  { id: 'bronce_2', name: 'Bronce II', tier: 2, min: 15, metal: 'bronze', color: 0xc77b3a },
  { id: 'bronce_3', name: 'Bronce III', tier: 3, min: 30, metal: 'bronze', color: 0xc77b3a },
  { id: 'plata_1', name: 'Plata I', tier: 4, min: 50, metal: 'silver', color: 0xc9d3dc },
  { id: 'plata_2', name: 'Plata II', tier: 5, min: 80, metal: 'silver', color: 0xc9d3dc },
  { id: 'plata_3', name: 'Plata III', tier: 6, min: 120, metal: 'silver', color: 0xc9d3dc },
  { id: 'oro_1', name: 'Oro I', tier: 7, min: 170, metal: 'gold', color: 0xffd23f },
  { id: 'oro_2', name: 'Oro II', tier: 8, min: 230, metal: 'gold', color: 0xffd23f },
  { id: 'oro_3', name: 'Oro III', tier: 9, min: 300, metal: 'gold', color: 0xffd23f },
];

/** orbs of that cat granted each time it reaches a new rank */
export const RANK_ORBS = 2;
/** max cumulative combat damage bonus at the top rank */
export const RANK_DMG_MAX = 0.1;

/** rank for a K.O. count; `next` = K.O. needed for the following rank (null at Oro III) */
export function koRank(kos: number): { id: string; name: string; tier: number; next: number | null } {
  const k = Math.max(0, Math.floor(kos || 0));
  let r = KO_RANKS[0];
  for (const x of KO_RANKS) if (k >= x.min) r = x;
  const nxt = KO_RANKS[r.tier + 1];
  return { id: r.id, name: r.name, tier: r.tier, next: nxt ? nxt.min : null };
}

export function rankDef(kos: number): KoRankDef {
  return KO_RANKS[koRank(kos).tier];
}

/** combat-only damage bonus from the rank (+10% at Oro III, linear per tier) */
export function rankDmgBonus(kos: number) {
  return (RANK_DMG_MAX * koRank(kos).tier) / (KO_RANKS.length - 1);
}

/** progress 0..1 towards the next rank */
export function rankProgress(kos: number) {
  const r = koRank(kos);
  if (r.next === null) return 1;
  const cur = KO_RANKS[r.tier].min;
  return Math.max(0, Math.min(1, (kos - cur) / (r.next - cur)));
}
