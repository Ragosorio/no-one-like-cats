/**
 * PELÍCULAS — every film of the game, registered (pure: the defs load their sets lazily).
 * Production films of Part III add one line here.
 */
import { registerFilm } from './registry';
import { DEMO } from './demo';

registerFilm(DEMO);

// EL FINAL (CINE, ronda 4 · oleada 3): F31–F40
import { FINAL_FILMS } from './films/final';
for (const f of FINAL_FILMS) registerFilm(f);

// EL ACTO I (FILM-ACTO1, ronda 4 · oleada 2): F01–F08
import { ACTO1_FILMS } from './films/acto1';
for (const f of ACTO1_FILMS) registerFilm(f);

// LA PLANTILLA DE PRESENTACIÓN (FILM-ACTO1): every Carta stage without its own film gets one built from its data
// (registerBriefingTemplate, app/stageIntro.ts). DEV: `?film=plantilla_b3` shows the template with B-3's real data.
import './films/plantilla';
import { registerSamples } from './films/plantilla/samples';
if (import.meta.env?.DEV && typeof window !== 'undefined') registerSamples();

// EL ACTO II (FILM-ACTO2, ronda 4 · oleada 2): F09–F17
import { ACTO2_FILMS } from './films/acto2';
for (const f of ACTO2_FILMS) registerFilm(f);

// EL ACTO IV «La gira» (FILM-ACTO4, ronda 4 · oleada 2): F26–F30
import { ACTO4_FILMS } from './films/acto4';
for (const f of ACTO4_FILMS) registerFilm(f);

// EL ACTO III (FILM-ACTO3, ronda 4 · oleada 2): F18–F25 + la oscuridad de H85 + la piel de la Biblioteca
import { ACTO3_FILMS } from './films/acto3';
for (const f of ACTO3_FILMS) registerFilm(f);
