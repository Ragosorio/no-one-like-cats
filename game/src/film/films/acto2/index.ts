/**
 * ACTO II «Se rompen las cajas» — every film of the act (pure: the sets load lazily). FILM-ACTO2, ronda 4.
 * Guiones: docs/part-iii/historia-v2/guiones/acto-2/ · fichas: historia-v2/03-peliculas.md F09–F17.
 *
 *   f09  PP  «Ciudad Mayúscula»     (H75, La Pandilla del Ovillo)   cómic moderno del «verso arácnido»
 *   f10  PP  «Villanos sueltos»     (H76, El Estambre)              periódico que gira
 *   f11  PP  «Cruceta»              (H77, Cruceta)                  cómic de la Edad de Plata dibujado por el rival
 *   f12  PH  «Cerito»               (H78, respiro)                  documental con visión nocturna (1 elección: la cobija)
 *   f13  PP  «El Gran Torneo»       (H79, El rival que no te conoce) avance del próximo episodio de anime
 *   f14_1..3 PH «Entrenamiento» (H80, una tira antes de cada arco) yonkoma en tramas
 *   f15  PP  «Itō»                  (H81, Itō)                      rollo de ukiyo-e
 *   f16  PC  Daria «Una sola línea» (H81, cierra la batalla)         hilo continuo · c25 → fin
 *   f17  PH  «La Vocación»          (H82, punto medio)              Caravaggio + La creación de Adán (1 elección)
 */
import type { FilmDef } from '../../types';
import { F09 } from './f09';
import { F10 } from './f10';
import { F11 } from './f11';
import { F12 } from './f12';
import { F13 } from './f13';
import { F14_FILMS } from './f14';
import { F15 } from './f15';
import { F16 } from './f16';
import { F17 } from './f17';

import { registerBriefingSkin } from '../plantilla';
import { registerActo2Samples } from './muestras';

/**
 * every OTHER Carta stage of the act's two boxes gets FILM-ACTO1's data-driven briefing (plantilla/), dressed in the
 * box's own language: the comic city and the shōnen sea (derived music only)
 */
registerBriefingSkin('p3d_superheroes', {
  style: 'aracnido',
  aspect: 16 / 9,
  tv: false,
  type: 'tv',
  track: { normal: 'fut.vineta', elite: 'fut.vineta', boss: 'fut.vineta.noticiero' },
  caption: 'PRESENTACIÓN · CIUDAD MAYÚSCULA',
  pal: { ink: 0x10081c, plate: 0x2a54c8, accent: 0xffd23a, paper: 0xfff8e8, text: 0xfff8e8 },
  backdrop: () => import('./fondos'),
  rain: 0,
});
registerBriefingSkin('p3d_anime', {
  style: 'anime',
  aspect: 16 / 9,
  tv: false,
  type: 'ukiyoe',
  track: { normal: 'daria.piano', elite: 'daria.calle', boss: 'daria.calle' },
  caption: 'PRESENTACIÓN · MAR SHŌNEN',
  pal: { ink: 0x14121e, plate: 0xe5322d, accent: 0xffd23a, paper: 0xfffaf0, text: 0xfffaf0 },
  backdrop: () => import('./fondoAnime'),
  rain: 0,
});

export const ACTO2_FILMS: FilmDef[] = [F09, F10, F11, F12, F13, ...F14_FILMS, F15, F16, F17];

// DEV: the template in the act's two skins (?film=plantilla_s1 · ?film=plantilla_a1)
if (import.meta.env?.DEV && typeof window !== 'undefined') registerActo2Samples();
