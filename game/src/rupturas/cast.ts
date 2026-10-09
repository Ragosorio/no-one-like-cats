/**
 * Who lives on the slice's island. Slugs/ids come from content.json (stable save ids are never
 * renamed); traits and tags are Rupturas-only personality knobs read by rupturas/life.ts.
 */
import { artUrl } from '../art/artBase';

const lite = (slug: string) => artUrl(`cats-svg/lite/${slug}.svg`);

export interface CastDef {
  id: string;
  /** content.json species id (for the future bridge to the player's real collection) */
  species: string;
  name: string;
  slug: string;
  url: string;
  height: number;
  tags: string[];
  traits: Record<string, number>;
  meta: string;
  acts?: 'all' | 'calm' | 'battle' | 'none';
}

const c = (d: Omit<CastDef, 'url'>): CastDef => ({ ...d, url: lite(d.slug) });

export const CAST: CastDef[] = [
  c({ id: 'canelo', species: 'c_canelo', name: 'Canelo', slug: 'canelo_cozy_cat', height: 2.6, tags: ['fire', 'canelo'], traits: { playful: 0.55, curious: 0.3 }, meta: 'Fuego · Común · el Impaciente. Primer gato de la isla. Dueño legal (según él) de la palmera grande.' }),
  c({ id: 'chispa', species: 'c_chispa', name: 'Chispa', slug: 'chispa_sparkler_cat', height: 2.4, tags: ['fire'], traits: { playful: 0.95, curious: 0.8 }, meta: 'Fuego · Común. Cree que la nieve es un juguete que hace "fssss".' }),
  c({ id: 'gelatino', species: 'c_gelatino', name: 'Gelatino', slug: 'jelly_aquatic_cat', height: 2.4, tags: ['water'], traits: { playful: 0.7, curious: 0.5 }, meta: 'Agua · Común. Prueba viviente de que los gatos son líquidos.' }),
  c({ id: 'copito', species: 'c_copito', name: 'Copito', slug: 'copito_snowball_cat', height: 2.3, tags: ['ice'], traits: { playful: 0.4, curious: 0.3 }, meta: 'Hielo · Común. Odia a Chispa. Lo extraña cuando no viene.' }),
  c({ id: 'cometin', species: 'c_cometin', name: 'Cometín', slug: 'cometin_stardust_cat', height: 2.4, tags: ['cosmic'], traits: { playful: 0.7, curious: 0.9 }, meta: 'Cósmico · Común. Lleva tres noches viendo estrellas que suben.' }),
  c({ id: 'nimbo', species: 'c_nimbo', name: 'Nimbo', slug: 'nube_dream_cat', height: 2.5, tags: ['storm'], traits: { playful: 0.85, curious: 0.6 }, meta: 'Tormenta · Común. Las tormentas le dan cafeína.' }),
  c({ id: 'ignis', species: 'l_ignis', name: 'Ignis', slug: 'molten_ember_cat', height: 3.4, tags: ['fire', 'primordial', 'lava'], traits: { playful: 0.2, curious: 0.2 }, meta: 'Fuego · Legendario · Primordial. Usa el hábitat como jacuzzi.', acts: 'calm' }),
  c({ id: 'astraprima', species: 'l_astraprima', name: 'Astraprima', slug: 'regal_cosmic_cat', height: 3.1, tags: ['cosmic', 'primordial'], traits: {}, meta: 'Cósmico · Legendario · Primordial. Tripulante. Lanza COLAPSO ESTELAR.', acts: 'calm' }),
];

export const LUZTERNA = {
  id: 'luzterna',
  name: 'Luzterna',
  slug: 'luzterna',
  url: artUrl('story/lite/luzterna.svg'),
  height: 2.5,
  acts: 'calm' as const,
  meta: 'La farera. La Parte I prometió que su linterna encontraría casa en tu faro: aquí está.',
};

/** REGISTRO 000: a cat-shaped absence. Never there when you walk up to it. */
export const REGISTRO = {
  id: 'registro000',
  name: 'REGISTRO 000',
  slug: 'nadie_static_cat',
  url: lite('nadie_static_cat'),
  height: 2.6,
  acts: 'none' as const,
  meta: 'Especie: desconocida · Elemento: ninguno · Rareza: no aplicable · Estado: observando',
};
