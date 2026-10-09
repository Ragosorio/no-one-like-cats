/**
 * Parte II region registry (3D places that only exist after H30). Contract shared with the map and the
 * story (docs/part-ii/14-regiones-3d.md):
 *  - ids: 'paginas' (Isla de las Páginas Hundidas), 'nacar' (Isla Nácar), 'reflejo' (H31 cinematic)
 *  - entering a region emits G.count(`feature_region_<id>`)
 *  - a region shows a BATTLE marker when the active story mission's goal.battle is one of its battles
 *  - activities emit feature counters: 'feature_pagina_canelo' (Páginas), 'feature_haz_nacar' (Nácar)
 */
export const REGION_IDS = ['paginas', 'nacar', 'reflejo'] as const;
export type RegionId = (typeof REGION_IDS)[number];

export const REGION_INFO: Record<RegionId, { name: string; battles: string[]; mapFlag: string | null }> = {
  paginas: { name: 'Isla de las Páginas Hundidas', battles: ['ruptura_paginas', 'ruptura_bibliotecario'], mapFlag: 'region:paginas' },
  nacar: { name: 'Isla Nácar', battles: ['ruptura_nacar', 'ruptura_madrenacar'], mapFlag: 'region:nacar' },
  reflejo: { name: 'El reflejo', battles: [], mapFlag: null },
};
