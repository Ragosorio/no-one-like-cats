/**
 * Story text helpers: tone filter ("Sin filtro" vs "Familiar"), speaker registry and
 * humor-bank picks (research/09: loadingTips + systemMessages).
 */
import { settings } from '../../core/settings';
import { C } from '../theme';

// ------------------------------------------------------------------ tone filter
/** same joke, other vocabulary (09 §6.3). Order matters: longer phrases first. */
const SOFT: [RegExp, string][] = [
  [/¡¿\s*qué putas\s*\?!/gi, '¡¿QUÉEE?!'],
  [/qué putas/gi, 'qué rayos'],
  [/hijo de su madre/gi, 'malvado'],
  [/romperle la madre/gi, 'darle una paliza'],
  [/rompiendo madres/gi, 'repartiendo golpes'],
  [/romper madres/gi, 'repartir golpes'],
  [/partir la madre/gi, 'ganarle'],
  [/le parte la madre/gi, 'le gana'],
  [/le partiste la madre/gi, 'le ganaste'],
  [/a toda madre/gi, 'increíble'],
  [/a la mierda/gi, 'al diablo'],
  [/a la verga/gi, 'a volar'],
  [/ni de pedo/gi, 'ni loco'],
  [/ni pedo/gi, 'ni modo'],
  [/qué pedo/gi, 'qué onda'],
  [/no mames/gi, 'no manches'],
  [/a huevo/gi, 'sí señor'],
  [/chingaderas/gi, 'cosas'],
  [/chingadera/gi, 'cosa'],
  [/chingones/gi, 'geniales'],
  [/chingona/gi, 'genial'],
  [/chingón/gi, 'genial'],
  [/se lo chingaron/gi, 'lo vencieron'],
  [/chingar/gi, 'fastidiar'],
  [/pendejadas/gi, 'travesuras'],
  [/pendejo/gi, 'menso'],
  [/cabrones/gi, 'traviesos'],
  [/cabrón/gi, 'compa'],
  [/mierda/gi, 'porquería'],
  [/carajo/gi, 'caramba'],
  [/pinche /gi, ''],
  [/putas/gi, 'rayos'],
  [/puta/gi, 'rayos'],
  [/verga/gi, 'rayos'],
  [/\bwey\b/gi, 'amigo'],
  [/\bpedo\b/gi, 'lío'],
];

function matchCase(src: string, rep: string) {
  if (!rep) return rep;
  const letters = src.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
  if (letters.length > 1 && letters === letters.toUpperCase()) return rep.toUpperCase();
  const first = src.replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ]+/, '')[0];
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
    const i = rep.search(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/);
    if (i >= 0) return rep.slice(0, i) + rep[i].toUpperCase() + rep.slice(i + 1);
  }
  return rep;
}

/** Apply the player's tone setting. "Sin filtro" (default) leaves the text as written. */
export function clean(text: string): string {
  if (settings.sinFiltro) return text;
  let out = text;
  for (const [re, rep] of SOFT) out = out.replace(re, (m) => matchCase(m, rep));
  return out.replace(/\s{2,}/g, ' ');
}

/** pick sinFiltro/familiar variant */
export function tone(familiar: string, sinFiltro?: string) {
  return settings.sinFiltro && sinFiltro ? sinFiltro : clean(familiar);
}

// ------------------------------------------------------------------ speakers
export type SpeakerKind = 'luzterna' | 'cat' | 'caption' | 'system' | 'newspaper';

export interface Speaker {
  id: string;
  name: string;
  kind: SpeakerKind;
  /** cat art slug for portraits */
  slug?: string;
  /** name tag colors */
  band: number;
  bandText: number;
  /** speech box fill */
  box: number;
  /** typewriter blip pitch */
  pitch: number;
  /** portrait treatment */
  treat?: 'enemy' | 'rival' | 'duck' | 'ally' | 'boss';
}

const SPEAKERS: Record<string, Speaker> = {
  LUZTERNA: { id: 'luzterna', name: 'CAPITANA LUZTERNA', kind: 'luzterna', band: C.plumInk, bandText: C.yellow, box: C.yellow, pitch: 1 },
  CAPTION: { id: 'caption', name: '', kind: 'caption', band: C.ink, bandText: C.paper, box: C.yellow, pitch: 0.8 },
  SISTEMA: { id: 'system', name: 'SISTEMA', kind: 'system', band: C.pinkHot, bandText: C.ink, box: C.ink, pitch: 1.6 },
  PERIÓDICO: { id: 'news', name: 'EL DIARIO DEL MAR', kind: 'newspaper', band: C.ink, bandText: C.paper, box: C.paper, pitch: 0.9 },
  PATITO: { id: 'patito', name: 'EL PATITO PIRATA', kind: 'cat', slug: 'jelly_aquatic_cat', band: C.yellow, bandText: C.ink, box: 0xfff1b8, pitch: 1.7, treat: 'duck' },
  BIGOTES: { id: 'bigotes', name: 'CAPITÁN BIGOTES ROTOS', kind: 'cat', slug: 'arce_autumn_cat', band: C.red, bandText: C.paper, box: 0xf6d7c8, pitch: 0.65, treat: 'enemy' },
  NOCTIS: { id: 'noctis', name: 'VELO NOCTIS', kind: 'cat', slug: 'deepsea_sprite_cat', band: C.plumInk, bandText: C.mint, box: C.lilac, pitch: 1.15, treat: 'rival' },
  GÁRGOLA: { id: 'gargola', name: 'LA GÁRGOLA RONRONEANTE', kind: 'cat', slug: 'fossilstone_guardian_cat', band: C.olive, bandText: C.paper, box: 0xd9d4c4, pitch: 0.55, treat: 'boss' },
  KRAKEN: { id: 'kraken', name: 'CAPITÁN DEL KRAKEN', kind: 'cat', slug: 'mecha_neon_cat', band: C.cyan, bandText: C.ink, box: 0xd6f6ff, pitch: 1.8, treat: 'boss' },
  TRONADOR: { id: 'tronador', name: 'TRONADOR', kind: 'cat', slug: 'stormcloud_elemental_cat', band: C.yellow, bandText: C.ink, box: 0xfff6a8, pitch: 0.7, treat: 'ally' },
  RAIJIN: { id: 'raijin', name: 'RAIJIN', kind: 'cat', slug: 'mecha_neon_cat', band: C.yellow, bandText: C.ink, box: 0xfff6a8, pitch: 1.2, treat: 'ally' },
  HERALDO: { id: 'heraldo', name: 'EL HERALDO', kind: 'cat', slug: 'storybook_ink_cat', band: C.plum, bandText: C.gold, box: C.lilac, pitch: 0.9, treat: 'enemy' },
  ARCANISTA: { id: 'arcanista', name: 'EL ARCANISTA', kind: 'cat', slug: 'candy_alchemist_cat', band: C.plum, bandText: C.gold, box: C.lilac, pitch: 0.8, treat: 'boss' },
  ESTRELLA: { id: 'estrella', name: 'ESTRELLA ERRANTE', kind: 'cat', slug: 'regal_cosmic_cat', band: C.violet, bandText: C.cyan, box: 0xd8ccff, pitch: 1.3, treat: 'boss' },
  DISTRAXIA: { id: 'distraxia', name: 'DISTRAXIA', kind: 'system', band: C.violet, bandText: C.paper, box: C.plumInk, pitch: 0.5 },
  NADIE: { id: 'nadie', name: 'NADIE', kind: 'system', band: C.ink, bandText: C.paper, box: C.ink, pitch: 0.4 },
  '???': { id: 'unknown', name: '???', kind: 'system', band: C.ink, bandText: C.paper, box: C.ink, pitch: 0.4 },
  'TUS GATOS': { id: 'cats', name: 'TUS GATOS', kind: 'cat', slug: 'canelo_cozy_cat', band: C.pink, bandText: C.ink, box: C.paper, pitch: 1.1, treat: 'ally' },
};

export function speaker(id: string): Speaker {
  const k = id.toUpperCase();
  return SPEAKERS[k] ?? { id: k.toLowerCase(), name: k, kind: 'cat', slug: 'canelo_cozy_cat', band: C.ink, bandText: C.paper, box: C.paper, pitch: 1, treat: 'ally' };
}

/** stage directions like "(El cielo se oscurece…)" are performed, not shown */
export function isDirection(sp: string, text: string) {
  return sp.toUpperCase() === 'SISTEMA' && /^\(.*\)$/.test(text.trim());
}

// ------------------------------------------------------------------ humor bank (research/09, filtered to Cap. 1)
/** loadingTips from 09 that only mention things that exist in Chapter 1. */
const TIPS: { t: string; s?: string }[] = [
  { t: 'Tip: jugar acelera todo. Esperar también funciona. Pagar no existe.' },
  { t: 'Ahí está el detalle: un gato Común bien usado le gana a un Mítico mal usado.', s: 'Ahí está el detalle: un gato Común bien usado le parte la madre a un Mítico mal usado.' },
  { t: 'El aliento de mi gato huele a comida de gato.' },
  { t: 'Cargando... Han pasado 84 años...' },
  { t: 'Tip: un duplicado no es un fracaso. Son orbes con otra cara.' },
  { t: 'Es peligroso ir solo. Llévate un gato. O cinco.' },
  { t: 'Gracias, Michi, pero tu croqueta está en otro barco.' },
  { t: 'Tip: el reloj de los eventos es sagrado. Nada lo extiende. Ni las gemas. Ni llorar.' },
  { t: 'La vida es como una caja: nunca sabes qué gato te va a salir de la Resonancia.' },
  { t: 'En el planeta de Miller una hora son siete años. En tu isla, una siesta de gato son siete horas.' },
  { t: 'Uno no simplemente entra a la cocina. Primero hay que maullar 40 minutos.' },
  { t: 'Un mago nunca llega tarde. Un gato tampoco: llega exactamente cuando abres la lata.' },
  { t: 'Tip: perder también da botín. Nadie sale con las manos vacías de este juego.' },
  { t: "Tip: el 'Análisis de Jefe' sube aunque pierdas. Al 100% descubres su debilidad." },
  { t: 'Los amigos no mienten. Los gatos sí, sobre todo cuando dicen que no han comido.' },
  { t: 'No hay cuchara. Hay lata.' },
  { t: 'Se acerca el invierno. También se acerca la hora de comer. Una de las dos es más urgente.' },
  { t: 'Dato real: en 2017 unos científicos ganaron un premio Ig Nobel por estudiar si los gatos son líquidos. Sí lo son.' },
  { t: 'Ola k ase. ¿Invocando gatos o k ase?' },
  { t: 'El tiempo nunca te impide jugar. A veces, jugar es la forma de vencer al tiempo.' },
  { t: 'Ningún gato fue dañado en la creación de este juego. Varios vasos sí.' },
  { t: 'Cualquiera puede invocar. No cualquiera puede invocar bien.' },
  { t: "Tip: la Resonancia muestra probabilidades. Ese '???' de 1% es real. Y es peligroso." },
  { t: 'La chancla teledirigida no se esquiva. Se acepta.' },
  { t: 'Ningún barco es insumergible. Pregúntale al RMS Gatanic.' },
  { t: 'Tu gato no te ignora. Está procesando. Lleva tres años procesando.' },
  { t: "Ponle 'Michi' a un gato. Ponle 'Michi' a otro. Ya tienes un evento canónico." },
  { t: 'Su nivel de pelea es de más de 8,000. (Sí, ocho. Así lo dijo el doblaje y así se queda.)' },
  { t: 'Tip: las expansiones de terreno no sólo dan espacio: cada una cambia una regla de tu economía.' },
  { t: 'Tip: los jefes abren elementos nuevos. Cada elemento nuevo abre docenas de Resonancias.' },
  { t: 'Dato real: los gatos adultos son intolerantes a la lactosa. Todas las caricaturas te mintieron.' },
  { t: 'Tip: el momentum sube con cada victoria y baja despacito si te vas. No te castiga: te espera.' },
  { t: 'Ninguna gema se compra con dinero real. Si alguien te las vende, no es este juego.' },
  { t: 'Los gatos son como las cebollas: tienen capas. Capas de pelo. En todos tus suéteres.' },
  { t: 'Ahorita termina la Resonancia. (Ahorita puede significar 5 minutos o 3 días. Es un ahorita latino.)' },
  { t: 'Cuando un gato tira un vaso, en algún otro universo otro gato tira el mismo vaso. Es canon.' },
  { t: 'Uno... dos... dos y medio... (Cargando con la técnica de tu mamá.)' },
  { t: 'Nadie quiere a los gatos, dijo el perro. Todos los gatos lo ignoraron, que es la respuesta más gato posible.' },
];

export function loadingTip(): string {
  const p = TIPS[Math.floor(Math.random() * TIPS.length)];
  return tone(p.t, p.s);
}

/** systemMessages from 09 used by the story layer (familiar, sinFiltro). */
const SYS: Record<string, [string, string][]> = {
  mision_completa: [
    ['¡Misión completada! Recompensa, animación y una misión nueva. Así es esto.', '¡Misión completada! Toma, toma y toma. Sigue.'],
  ],
  regreso_jugador: [
    ['¡Volviste! Mientras no estabas, tus gatos produjeron {oro} de oro y tiraron {v} vasos.', '¡Volviste! Tus gatos hicieron {oro} de oro y rompieron {v} vasos. Cabrones.'],
  ],
  momentum_baja: [['Tu momentum bajó un poquito mientras no estabas. No pasa nada: te estaba esperando.', 'Tu momentum bajó un poco. Ni pedo, aquí sigue.']],
  guardar: [['Progreso guardado. La idea de tirar ese vaso te llena de GATTERMINACIÓN.', 'Guardado. Te llenas de GATTERMINACIÓN.']],
  salir_juego: [['¿Te vas? El mundo sigue. Tus gatos también. Vuelve cuando quieras.', '¿Ya te vas? Va. Tus gatos van a seguir haciendo pendejadas.']],
};

export function sysMsg(ctx: keyof typeof SYS | string, vars: Record<string, string | number> = {}): string {
  const list = SYS[ctx];
  if (!list) return '';
  const [f, s] = list[Math.floor(Math.random() * list.length)];
  let out = tone(f, s);
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

/** short Luzterna quips for mission-complete panels */
const DONE_QUIPS: [string, string?][] = [
  ['Eso. Así se hace.'],
  ['Toma, toma y toma. Sigue.'],
  ['Ni yo lo hubiera hecho mejor. Bueno, sí. Pero estoy muerta.'],
  ['Anotado en la bitácora. Con estrellitas.'],
  ['¿Ves? Nadie te regaló nada. Bueno, yo. Ahorita.'],
  ['Misión cumplida. Tus gatos ni se enteraron, pero bien.', 'Misión cumplida. Tus gatos ni se enteraron, cabrón, pero bien.'],
  ['Premio. Que no se te suba.'],
  ['Así empiezan los imperios. Con un clic.'],
];
export function doneQuip(i?: number): string {
  const q = DONE_QUIPS[(i ?? Math.floor(Math.random() * DONE_QUIPS.length)) % DONE_QUIPS.length];
  return tone(q[0], q[1]);
}
