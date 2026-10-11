/**
 * Parte II region registry (3D places that only exist after H30). Contract shared with the map and the
 * story (docs/part-ii/14-regiones-3d.md):
 *  - ids: 'paginas' (Isla de las Páginas Hundidas), 'nacar' (Isla Nácar), 'reflejo' (H31 cinematic)
 *  - entering a region emits G.count(`feature_region_<id>`)
 *  - a region shows a BATTLE marker when the active story mission's goal.battle is one of its battles
 *  - activities emit feature counters: 'feature_pagina_canelo' (Páginas), 'feature_haz_nacar' (Nácar)
 */
export const REGION_IDS = ['paginas', 'nacar', 'reflejo', 'invertidas', 'corona', 'cometa', 'suenos', 'olvidada', 'umbral'] as const;
export type RegionId = (typeof REGION_IDS)[number];

export const REGION_INFO: Record<RegionId, { name: string; battles: string[]; mapFlag: string | null }> = {
  paginas: { name: 'Isla de las Páginas Hundidas', battles: ['ruptura_paginas', 'ruptura_bibliotecario'], mapFlag: 'region:paginas' },
  nacar: { name: 'Isla Nácar', battles: ['ruptura_nacar', 'ruptura_madrenacar'], mapFlag: 'region:nacar' },
  reflejo: { name: 'El reflejo', battles: [], mapFlag: null },
  // Oleada 2 «El Cielo Despierta» (capa celeste)
  invertidas: { name: 'Islas Invertidas', battles: ['cielo_invertidas', 'cielo_almirante'], mapFlag: 'region:invertidas' },
  corona: { name: 'Corona Celeste', battles: ['cielo_embajada', 'cielo_masamadre'], mapFlag: 'region:corona' },
  // Oleada 3 «La Era Astral»
  cometa: { name: 'Puerto Cometa', battles: ['ruptura_sincronia', 'ruptura_estrella', 'ruptura_disruptores', 'ruptura_leviatan'], mapFlag: 'region:cometa' },
  // Oleada 4 «El Umbral»
  suenos: { name: 'Archipiélago de los Sueños', battles: ['umbral_suenos'], mapFlag: 'region:suenos' },
  olvidada: { name: 'La Isla que Nadie Recuerda', battles: [], mapFlag: 'region:olvidada' },
  umbral: { name: 'El Umbral', battles: ['umbral_correctores', 'umbral_final'], mapFlag: 'region:umbral' },
};
