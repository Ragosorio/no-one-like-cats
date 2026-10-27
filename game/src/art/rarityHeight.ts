/**
 * How tall a cat stands in the 3D regions, by rarity — ONE table for every region (there were six copies; the one in
 * regions/paginas.ts had no mythic / heroic / divine and fell to 2.5 for them — no Páginas resident is of those today,
 * so unifying changes nothing on screen). Exhaustive over RarityId: a new rarity can't be forgotten (the compiler and
 * tests/rarityFinite.test.ts say so). Unknown strings (old data) still get 2.5.
 */
import type { RarityId } from '../state/econ';

export const RARITY_H: Record<RarityId, number> = { common: 2.4, rare: 2.5, epic: 2.7, legendary: 3.1, multidimensional: 3.1, mythic: 3.2, heroic: 3.0, divine: 3.3 };
export const rarityHeight = (r: string | undefined | null): number => RARITY_H[(r ?? 'common') as RarityId] ?? 2.5;
