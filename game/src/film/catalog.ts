/**
 * PELÍCULAS — the catalog (pure): every style, weather, transition and typography the engine knows, with the bake
 * jobs each one needs BEFORE the clock. validateFilm checks names against it, bakeManifest(def) lists the jobs a film
 * needs, and the stage refuses to start the clock while any of them is missing (zero first-use stalls).
 *
 * The Pixi implementations register under the same ids (film/styles/index.ts, film/weather.ts, film/transitions.ts);
 * tests/filmEngine.test.ts checks that both sides agree.
 */
import type { TransitionKind, TypeStyle, WeatherKind } from './types';
import { GRAFICO_STYLES } from './styles/grafico.catalog';
import { LIBROS_STYLES } from './styles/libros.catalog';
import { POP_STYLES } from './styles/pop.catalog';
import { VINETA_STYLES } from './styles/vineta.catalog';

export interface StyleInfo {
  id: string;
  label: string;
  /** what the style bakes at load (job names, `<style>:<what>`) */
  bakes: string[];
  /** default typography of its cards */
  type: TypeStyle;
  /** «implementado» = a module with a set kit + bakes; «preset» = a post look + a cat bake over the shared kit */
  status: 'implementado' | 'preset';
}

export const STYLES: Record<string, StyleInfo> = {
  vangogh: {
    id: 'vangogh',
    label: 'Van Gogh: pinceladas que fluyen',
    bakes: ['vangogh:canvas', 'vangogh:strokes', 'vangogh:impasto-cats'],
    type: 'vangogh',
    status: 'implementado',
  },
  davinci: {
    id: 'davinci',
    label: 'Da Vinci: cuaderno de estudios',
    bakes: ['davinci:parchment', 'davinci:sketch-cats', 'davinci:hatch'],
    type: 'davinci',
    status: 'implementado',
  },
  noir: {
    id: 'noir',
    label: 'Noir realista: lluvia y neón',
    bakes: ['noir:cats', 'noir:planes', 'noir:light'],
    type: 'noir',
    status: 'implementado',
  },
  acuarela: {
    id: 'acuarela',
    label: 'Acuarela que sangra',
    bakes: ['acuarela:paper', 'acuarela:cats'],
    type: 'default',
    status: 'preset',
  },
  ukiyoe: {
    id: 'ukiyoe',
    label: 'Ukiyo-e: grabado en madera',
    bakes: ['ukiyoe:paper', 'ukiyoe:cats'],
    type: 'ukiyoe',
    status: 'preset',
  },
  linterna: {
    id: 'linterna',
    label: 'Linterna mágica: placas de vidrio pintado',
    bakes: ['linterna:plates', 'linterna:cats'],
    type: 'silent',
    status: 'implementado',
  },
  klimt: {
    id: 'klimt',
    label: 'Klimt: pan de oro',
    bakes: ['klimt:leaf', 'klimt:cats'],
    type: 'davinci',
    status: 'implementado',
  },
  posada: {
    id: 'posada',
    label: 'Posada: linograbado',
    bakes: ['posada:paper', 'posada:cats'],
    type: 'bass',
    status: 'implementado',
  },
  realismo: {
    id: 'realismo',
    label: 'Realismo: tormenta y madrugada',
    bakes: ['realismo:cats'],
    type: 'default',
    status: 'implementado',
  },
  pintura: {
    id: 'pintura',
    label: 'La pintura del juego, sin filtros (casa)',
    bakes: ['pintura:cats'],
    type: 'default',
    status: 'implementado',
  },
  borracha: {
    id: 'borracha',
    label: 'Caricatura de la Borracha, lavada (sin risas)',
    bakes: ['borracha:cats'],
    type: 'tv',
    status: 'implementado',
  },
  gato: {
    id: 'gato',
    label: 'Visión de gato (dos colores, lo oscuro se ve claro)',
    bakes: ['gato:cats'],
    type: 'noir',
    status: 'implementado',
  },
  mudo: {
    id: 'mudo',
    label: 'Cine mudo: grano, parpadeo y rayas',
    bakes: ['mudo:cats'],
    type: 'silent',
    status: 'preset',
  },
  // the graphic styles (FILM-ACTO1: tv, sombras, estencil, fotocopia, vhs, cartel, comic, anime, pixel, plastilina)
  ...GRAFICO_STYLES,
  // the POP style (FILM-ACTO4: videoclip frames, era posters, LED walls)
  ...POP_STYLES,
  // the page & panel styles (FILM-ACTO2: aracnido, periodico, edadplata, nocturna, manga, hilo, caravaggio)
  ...VINETA_STYLES,
  // the book styles (FILM-ACTO3: libros, popup, dore, expresionismo, tecnico, tinta, pirata, datamosh)
  ...LIBROS_STYLES,
};

export const WEATHER: Record<WeatherKind, { bakes: string[]; label: string }> = {
  rain: { bakes: ['weather:streaks', 'weather:splash', 'weather:ripple'], label: 'Lluvia con salpicaduras y reflejos mojados' },
  fog: { bakes: ['weather:fog'], label: 'Niebla en capas' },
  wind: { bakes: ['weather:particles'], label: 'Partículas al viento (hojas, pétalos, brasas, polvo, luciérnagas, pinceladas)' },
  snow: { bakes: ['weather:particles'], label: 'Nieve con bokeh cercano' },
  lightning: { bakes: ['weather:bolts'], label: 'Relámpago (pasa por la guardia de destellos)' },
  heat: { bakes: [], label: 'Calima (ondas de calor en el post)' },
  rays: { bakes: ['weather:rays'], label: 'Rayos de luz (god rays)' },
};

export const TRANSITIONS: Record<TransitionKind, { label: string; /** what «Reducir movimiento» plays instead */ reduced: TransitionKind }> = {
  cut: { label: 'Corte', reduced: 'cut' },
  fade: { label: 'Fundido a un color', reduced: 'fade' },
  dissolve: { label: 'Disolvencia', reduced: 'dissolve' },
  iris: { label: 'Iris (abre o cierra en un punto)', reduced: 'dissolve' },
  door: { label: 'Puerta que se abre', reduced: 'dissolve' },
  pageTurn: { label: 'Vuelta de página', reduced: 'dissolve' },
  inkBleed: { label: 'Tinta que se extiende', reduced: 'dissolve' },
  paintSmear: { label: 'Brochazo de pintura', reduced: 'dissolve' },
  glitch: { label: 'Falla de señal', reduced: 'dissolve' },
  objectToSet: { label: 'Un objeto se vuelve el escenario', reduced: 'dissolve' },
  match: { label: 'Corte por forma (match cut)', reduced: 'dissolve' },
  whip: { label: 'Barrido (whip pan)', reduced: 'dissolve' },
  lightLeak: { label: 'Fuga de luz', reduced: 'dissolve' },
};

export const TYPE_STYLES: TypeStyle[] = ['vangogh', 'davinci', 'noir', 'tv', 'silent', 'ukiyoe', 'bass', 'default'];

/** shared jobs every film bakes (the post tile, the transition program, the presentation fonts) */
export const CORE_BAKES = ['core:tile', 'core:post', 'core:transition', 'core:type'];
