/**
 * ACTO III «Lo que está escrito» — every film of the act (pure: the sets load lazily). FILM-ACTO3, ronda 4.
 * ⚠️ SPOILERS. Guiones: docs/part-iii/historia-v2/guiones/acto-3/ · fichas: historia-v2/03-peliculas.md F18–F25.
 * The screen is an OPEN BOOK (kit BookFrame); every film breaks it its own way.
 *
 *   f18            PP  «La Encuadernadora»               (H83, L-5)        libro desplegable
 *   f19            PH  «Lo que se derrama, se termina»   (H84)             grabado de Doré con niebla
 *   f20            PP  «El índice»                       (H85)             expresionismo alemán
 *   h85_oscuridad  PH  «La oscuridad»                    (H85, después)    acuarela a oscuras → papel negro → ojos
 *   f21            PH  «El plan» + el regreso (R3)       (H86)             cuaderno de Leonardo
 *   f22            PP  «La corrección»                   (H87)             plano técnico blanco
 *   f23            PC  No wey «El expediente» + puente   (H87, cierra)     noir de tinta con un solo color
 *   f24            PP  «Señal pirata»                    (H88, L-9)        la presentación hackeada
 *   f25            PC  DISTOR «Datamosh» (c25 → fin)     (H88, cierra)     datamosh sobre la acuarela
 *   f25_bisagra    PC  la misma, sin el mapa (Bisagra)   (H88, cierra)
 *   + the Library's skin for the generic briefings (FILM-ACTO1's template: registerBriefingSkin('p3d_libros'))
 */
import type { FilmDef } from '../../types';
import { registerBriefingSkin } from '../plantilla';
import { F18 } from './f18';
import { F19 } from './f19';
import { F20 } from './f20';
import { F21 } from './f21';
import { F22 } from './f22';
import { H85_OSCURIDAD } from './h85';
import { F23 } from './f23';
import { F24 } from './f24';
import { F25, F25_BISAGRA } from './f25';

export const ACTO3_FILMS: FilmDef[] = [F18, F19, F20, H85_OSCURIDAD, F21, F22, F23, F24, F25, F25_BISAGRA];

// the generic briefings of the Library (L-1 … L-4, L-6 … L-8): FILM-ACTO1's template, dressed as a storybook plate
registerBriefingSkin('p3d_libros', {
  style: 'libros',
  aspect: 16 / 9,
  tv: false,
  type: 'davinci',
  track: { normal: 'no_wey.melodia', elite: 'fut.fosa.niebla', boss: 'distor.senal' },
  caption: 'PRESENTACIÓN · LA BIBLIOTECA',
  pal: { ink: 0x2a1a0e, plate: 0x7a3a22, accent: 0xc8a050, paper: 0xf2e8d2, text: 0xf6efe0 },
  backdrop: () => import('./plantillaFondo'),
  rain: 0,
});
