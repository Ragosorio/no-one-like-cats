/** Ship weapon types (GDD 2.8): sidegrades chosen per weapon slot; power comes from the Arma Mk. */
import { ShotDef } from './types';
import { CELL } from './ship';

export interface WeaponType {
  id: string;
  name: string;
  /** flag in G.s.flags that unlocks it ('start' = always) */
  unlock: string;
  desc: string;
  /** internal damage (cannon = 40) */
  dmg: number;
  shot: Omit<ShotDef, 'power'>;
  oncePerBattle?: boolean;
}

export const WEAPON_TYPES: WeaponType[] = [
  {
    id: 'canon',
    name: 'Cañón',
    unlock: 'start',
    desc: 'Bala parabólica fiable en cada andanada. Santabárbara +25%.',
    dmg: 40,
    shot: { id: 'canon', name: 'Cañonazo', element: 'neutral', trajectory: 'ballistic', radius: CELL * 1.2, catMul: 0.4 },
  },
  {
    id: 'mortero',
    name: 'Mortero de Magma',
    unlock: 'weapon:mortero',
    desc: 'Tiro muy bombeado que cae desde arriba, perfora 1 y deja Ardiendo.',
    dmg: 45,
    shot: { id: 'mortero', name: 'Mortero', element: 'fire', trajectory: 'heavy', gravityScale: 1.3, pierce: 1, radius: CELL * 1.5, statuses: [{ id: 'burning', turns: 2 }] },
  },
  {
    id: 'tesla',
    name: 'Bobina Tesla',
    unlock: 'element:storm',
    desc: 'Rayo recto que Carga; con Mojado provoca Conducción.',
    dmg: 30,
    shot: { id: 'tesla', name: 'Descarga Tesla', element: 'electric', trajectory: 'beam', radius: CELL * 1.0, statuses: [{ id: 'charged', turns: 1 }], catMul: 0.7 },
  },
  {
    id: 'escarcha',
    name: 'Lanzaescarcha',
    unlock: 'weapon:escarcha',
    desc: '3 esquirlas en abanico: Moja lo seco y Congela lo Mojado.',
    dmg: 15,
    shot: { id: 'escarcha', name: 'Escarcha', element: 'ice', trajectory: 'spread', projectiles: 3, spreadDeg: 5, radius: CELL * 0.9, statuses: [{ id: 'wet', turns: 2 }] },
  },
  {
    id: 'arpon',
    name: 'Arpón del Leviatán',
    unlock: 'weapon:arpon',
    desc: 'Arpón recto que se clava y arrastra; rompe soportes.',
    dmg: 35,
    shot: { id: 'arpon', name: 'Arpón', element: 'neutral', trajectory: 'beam', pierce: 1, radius: CELL * 0.8 },
  },
  {
    id: 'riel',
    name: 'Riel Arcano',
    unlock: 'weapon:riel',
    desc: 'Runa recta perforante (3 capas) que Maldice.',
    dmg: 30,
    shot: { id: 'riel', name: 'Riel', element: 'magic', trajectory: 'beam', pierce: 3, radius: CELL * 0.9, statuses: [{ id: 'cursed', turns: 1 }] },
  },
  {
    id: 'starbreaker',
    name: 'Starbreaker',
    unlock: 'weapon:starbreaker',
    desc: 'UNA vez por batalla: atraviesa el casco completo. 120 de daño.',
    dmg: 120,
    oncePerBattle: true,
    shot: { id: 'starbreaker', name: 'STARBREAKER', element: 'cosmic', trajectory: 'phase', pierce: 30, radius: CELL * 1.2 },
  },
];

export const WEAPON_BY_ID = new Map(WEAPON_TYPES.map((w) => [w.id, w]));

/** sim ShotDef for a weapon type (power relative to the side's cannonAtk which equals the canon's 40) */
export function weaponShot(id: string): ShotDef {
  const w = WEAPON_BY_ID.get(id) ?? WEAPON_TYPES[0];
  return { ...w.shot, power: w.dmg / 40, preview: 0.45 } as ShotDef;
}
