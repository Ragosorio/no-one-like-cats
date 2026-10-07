/**
 * Parte 2 — GRIETAS DEL MULTIVERSO (post-story discovery of Hielo, Sonido, Sombra, Tiempo, Luz y Vacío).
 *
 * When the Leviatán sank (Capítulo 1) the Primer Mar cracked. Each crack (grieta) is a story battle
 * against a ship crewed by cats of a new element; winning it brings the element, its primordial and
 * 20 crystals of the element (habitat tiers 5+ ask for them). They open after the credits (H22):
 *
 *   ice     Grieta Boreal              right after the credits (H23, trigger mission:H22)
 *   sound   Grieta del Escenario       champion of any Podio league
 *   shadow  Grieta de los Faroles      Jardín Sakura cleared (expansion 9)
 *   time    Grieta del Reloj de Arena  Oasis Dorado cleared (expansion 10)
 *   light   Grieta del Faro            Reino 36 + Atolón Estelar cleared (expansion 8)
 *   void    Grieta del Abismo          Abismo del Ronroneo cleared (expansion 12) or 10 Fragmentos del Vacío
 *
 * Every grieta but the first also needs the first one won (H23 done): that's where Luzterna explains them.
 * A ticker raises the flag `grieta:<el>` when its condition holds; missions H24–H28 trigger on it, so OLD
 * saves that already meet a condition get the grieta the moment they load (no patch needed for that).
 */
import { G } from '../game';
import { registerPatch } from '../patches';
import { STORY_BATTLES, StoryBattleDef, voidFragments } from './storyBattles';

export const GRIETA_ELEMENTS = ['ice', 'sound', 'shadow', 'time', 'light', 'void'] as const;
export type GrietaEl = (typeof GRIETA_ELEMENTS)[number];
/** first-win crystals of the element (enough for the habitat tiers 5–8 of one house) */
export const GRIETA_CRYSTALS = 20;

const chapterDone = () => G.s.missions.done.includes('H22');
const firstDone = () => G.s.missions.done.includes('H23');
const cleared = (n: number) => G.s.expansions.cleared.includes(n);

/** is this grieta open (its mission can appear)? */
export function grietaOpen(el: GrietaEl): boolean {
  if (!chapterDone()) return false;
  if (el === 'ice') return true;
  if (!firstDone()) return false;
  switch (el) {
    case 'sound':
      return (G.s.podio?.champions?.length ?? 0) > 0;
    case 'shadow':
      return cleared(9);
    case 'time':
      return cleared(10);
    case 'light':
      return G.s.kl >= 36 && cleared(8);
    case 'void':
      return cleared(12) || voidFragments() >= 10;
  }
  return false;
}
/** what's missing, in words (glossary / hints) */
export const GRIETA_WHEN: Record<GrietaEl, string> = {
  ice: 'Se abre al terminar el Capítulo 1 (después de los créditos).',
  sound: 'Se abre cuando te coronas campeón de una liga del PODIO.',
  shadow: 'Se abre al limpiar el Jardín Sakura.',
  time: 'Se abre al limpiar el Oasis Dorado.',
  light: 'Se abre con Reino 36 y el Atolón Estelar limpio.',
  void: 'Se abre al limpiar el Abismo del Ronroneo o al juntar los 10 Fragmentos del Vacío.',
};

// ------------------------------------------------------------------ the six battles
interface GrietaSpec {
  el: GrietaEl;
  mission: string;
  title: string;
  enemy: string;
  captain: string;
  line: string;
  archetype: string;
  enemyCats: string[];
  powerMul: number;
  color: number;
  intro: string[];
  cat: string;
}
const SPECS: GrietaSpec[] = [
  {
    el: 'ice',
    mission: 'H23',
    title: 'GRIETA BOREAL',
    enemy: 'La Ballena de Escarcha',
    captain: 'Bóreas',
    line: '¿Quién rompió el Primer Mar? Hace un frío horrible de este lado. Y el frío soy yo.',
    archetype: 'fortin_piedra',
    enemyCats: ['l_boreas', 'e_tempano', 'r_escarcha', 'c_copito'],
    powerMul: 0.9,
    color: 0x9fe8ff,
    intro: ['Sus carámbanos de {ice} hielo congelan: lo que tocan no dispara su próximo turno.', 'Lleva {fire} Fuego: les pega ×1.5. Y ojo: ellos le pegan ×1.5 a tu {water} Agua.'],
    cat: 'l_boreas',
  },
  {
    el: 'sound',
    mission: 'H24',
    title: 'GRIETA DEL ESCENARIO',
    enemy: 'La Gira Interminable',
    captain: 'Headliner',
    line: '¿Este es el público que gritó tan fuerte? Me rompieron el cielo. Vengo a cobrar la entrada.',
    archetype: 'torre_barco',
    enemyCats: ['l_headliner', 'e_diva', 'r_djbigotes', 'c_tamborin'],
    powerMul: 0.95,
    color: 0xff2e88,
    intro: ['Sus ondas de {sound} sonido atraviesan paredes y aturden a cada gato que cruzan.', '{water} Agua y {void} Vacío les pegan ×1.5. Tu cristal sufre ×1.5.'],
    cat: 'l_headliner',
  },
  {
    el: 'shadow',
    mission: 'H25',
    title: 'GRIETA DE LOS FAROLES',
    enemy: 'El Biombo Negro',
    captain: 'Medianoche',
    line: 'Llevas toda la tarde viendo mis sombras. Ahora ellas te van a ver a ti.',
    archetype: 'galeon_niebla',
    enemyCats: ['l_medianoche', 'e_titiritera', 'r_kage', 'c_sombrita'],
    powerMul: 1,
    color: 0xc8102e,
    intro: ['Sus tiros de {shadow} sombra no se ven volar: mira dónde caen.', 'Cada impacto apuñala por la espalda a tu gato más cercano. {storm} Tormenta y {light} Luz les pegan ×1.5.'],
    cat: 'l_medianoche',
  },
  {
    el: 'time',
    mission: 'H26',
    title: 'GRIETA DEL RELOJ DE ARENA',
    enemy: 'El Galeón de Ayer',
    captain: 'Cronos',
    line: 'Ya peleamos. Ganaste tú. Bueno, ganas. Bueno… a ver qué pasa.',
    archetype: 'fortaleza_relojera',
    enemyCats: ['l_cronos', 'e_pendulo', 'r_arenita', 'c_tic'],
    powerMul: 1,
    color: 0xe0b77a,
    intro: ['Sus relojes de {time} tiempo reparan su barco con cada golpe y atrasan la recarga de tus gatos.', 'Ojo con TIME STOP: tus gatos pierden un turno. {cosmic} Cósmico y {ice} Hielo les pegan ×1.5.'],
    cat: 'l_cronos',
  },
  {
    el: 'light',
    mission: 'H27',
    title: 'GRIETA DEL FARO',
    enemy: 'El Vitral Errante',
    captain: 'Áurea',
    line: 'Este faro llevaba siglos apagado. Lo prendiste tú. Ahora aguántate la luz.',
    archetype: 'templo_flotante',
    enemyCats: ['l_aurea', 'e_faro', 'r_vitral', 'c_destello'],
    powerMul: 1.05,
    color: 0xffd77a,
    intro: ['Su {light} luz atraviesa celdas en línea y te deja CEGADO: tu vista previa se encoge al 30%.', '{earth} Tierra y {shadow} Sombra les pegan ×1.5.'],
    cat: 'l_aurea',
  },
  {
    el: 'void',
    mission: 'H28',
    title: 'GRIETA DEL ABISMO',
    enemy: 'El Canal Muerto',
    captain: 'Nadie',
    line: 'Dicen que a NADIE le gustan los gatos. Vine a ver si era cierto.',
    archetype: 'barco_hueso',
    enemyCats: ['l_nadie', 'e_devoradora', 'r_ecomudo', 'c_hueco'],
    powerMul: 1.1,
    color: 0xff2e88,
    intro: ['Lo que el {void} Vacío toca queda BORRADO: no se repara en toda la batalla.', 'Se come tus escudos y burbujas. {magic} Magia y {time} Tiempo le pegan ×1.5.'],
    cat: 'l_nadie',
  },
];

export const GRIETA_BATTLE_ID = (el: string) => `grieta_${el}`;
for (const s of SPECS) {
  const def: StoryBattleDef = {
    id: GRIETA_BATTLE_ID(s.el),
    mission: s.mission,
    // post-story rewards and the Marea Sin Nombre's sky
    zone: 6,
    stage: 8,
    title: s.title,
    enemy: s.enemy,
    captain: s.captain,
    line: s.line,
    archetype: s.archetype,
    enemyCats: s.enemyCats,
    // a real fight: a post-story crew wins in ~5–8 turns instead of one volley (tuned with the headless sims)
    powerMul: s.powerMul + 0.25,
    hpMulX: 2.5,
    intro: s.intro,
    color: s.color,
    reward: { element: s.el, cat: s.cat, gems: 2, crystals: GRIETA_CRYSTALS },
  };
  STORY_BATTLES[def.id] = def;
}
export function grietaOfBattle(id: string): GrietaEl | null {
  const s = SPECS.find((x) => GRIETA_BATTLE_ID(x.el) === id);
  return s ? s.el : null;
}

// ------------------------------------------------------------------ flags (missions H24–H28 read them)
let acc = 0;
function checkGrietas() {
  for (const el of GRIETA_ELEMENTS) {
    if (G.has(`grieta:${el}`)) continue;
    if (grietaOpen(el)) G.flag(`grieta:${el}`);
  }
}
G.tickers.push((dt) => {
  acc += dt;
  if (acc < 1000) return;
  acc = 0;
  checkGrietas();
});

// crystals of the new elements: first win (+20) and expeditions with a cat of the element (workforce.ts)

// ------------------------------------------------------------------ old saves
registerPatch({
  id: '2026-10-grietas-multiverso',
  why: 'Parte 2: las Grietas del Multiverso abren después del Capítulo 1; quien ya lo terminó debe enterarse.',
  run() {
    if (!chapterDone()) return;
    checkGrietas();
    const open = GRIETA_ELEMENTS.filter((e) => e === 'ice' || G.has(`grieta:${e}`)).length;
    return `Se abrieron las GRIETAS DEL MULTIVERSO: seis elementos nuevos esperan del otro lado. Toca la misión «Grietas del Multiverso» para empezar${open > 1 ? ` (ya cumples lo que piden ${open - 1} grietas más)` : ''}.`;
  },
});
