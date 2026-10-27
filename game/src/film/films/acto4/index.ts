/**
 * ACTO IV «La gira» (POP: H89–H92) — every film of the act (pure: the sets load lazily). FILM-ACTO4, ronda 4.
 * Guiones: docs/part-iii/historia-v2/guiones/acto-4/ · fichas: historia-v2/03-peliculas.md F26–F30.
 * ⚠️ SPOILERS. Act IV rules: the dread is CANELO's (his flame); of Luzterna, nothing about her mortality — ever.
 *
 *   f26  PP  «El mánager»           (H89, P-5 élite — stages[].film 'F26')   festival poster + backstage pass, LED wall
 *   f27  PH  «Karaoke»              (H90)                                     photo booth: a vertical strip of 4 photos
 *   f28  PP  «Firma»                (H91, P-9 jefe — stages[].film 'F28')     magazine cover → music-video teaser
 *   f29  PC  NO G@ME NO LIF€ «El show» (H91, closes the battle; complete)     videoclip → videogame, bar by bar
 *   f30  PC  xti es amor «La noche estrellada» (H92; complete)                Van Gogh, bar by bar
 *   + the POP skin of FILM-ACTO1's briefing template (every other stage of La Gira: P-1…P-4, P-6…P-8)
 */
import type { FilmDef } from '../../types';
import { registerBriefingSkin } from '../plantilla';
import { POP } from '../../styles/pop';
import { F26 } from './f26';
import { F27 } from './f27';
import { F28 } from './f28';
import { F29 } from './f29';
import { F30 } from './f30';
import { GIRA, START } from './music';

/** La Gira's skin for the data-driven briefings (the stage's LED marquee, the POP look, derived music) */
registerBriefingSkin('p3d_pop', {
  style: 'pop',
  aspect: 16 / 9,
  tv: false,
  type: 'bass',
  track: { normal: GIRA, elite: GIRA, boss: START },
  caption: 'PRESENTACIÓN · LA GIRA',
  pal: { ink: POP.ink, plate: POP.violet, accent: POP.pink, paper: POP.white, text: POP.white },
  backdrop: () => import('./kit/backdrop'),
  rain: 0,
});

export const ACTO4_FILMS: FilmDef[] = [F26, F27, F28, F29, F30];
