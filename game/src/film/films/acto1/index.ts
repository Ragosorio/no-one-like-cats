/**
 * ACTO I «La noche que no se reinicia» — every film of the act (pure: the sets load lazily). FILM-ACTO1, ronda 4.
 * Guiones: docs/part-iii/historia-v2/guiones/acto-1/ · fichas: historia-v2/03-peliculas.md F01–F08.
 *
 *   f01  PP  «Oficial Dona»                 (B-5, stages[].film 'F01')   intro policiaca de los 70
 *   f02  PH  «El precio de bajar»           (H70)                        teatro de sombras de manos
 *   f03  PP  «NINGUNA CAJA ES HOGAR»        (H71, Brecha)                esténcil y cartel de propaganda
 *   f04_*PH  «La mañana en blanco y negro»  (H72: prólogo, 4 viñetas, epílogo) cine mudo
 *   f05  PP  «La Batalla de Gatos»          (H73, EMIAU)                 flyer fotocopiado
 *   f06  PC  EM%EN «Cuadra 8»               (H73, cierra la batalla)     VHS de cámara + tipografía cinética
 *   f07  PP  «El Cadenero»                  (B-9, stages[].film 'F07')   cartel de lucha libre
 *   f08  PC  OH SHIT «Caída por el multiverso» (H74, fragmento c37→fin)  collage de 11 universos
 *   + the briefing TEMPLATE for every other Carta stage (./plantilla, registerBriefingTemplate)
 */
import type { FilmDef } from '../../types';
import { F01 } from './f01';
import { F02 } from './f02';
import { F03 } from './f03';
import { F04_FILMS } from './f04';
import { F05 } from './f05';
import { F06 } from './f06';
import { F07 } from './f07';
import { F08 } from './f08';

export const ACTO1_FILMS: FilmDef[] = [F01, F02, F03, ...F04_FILMS, F05, F06, F07, F08];
