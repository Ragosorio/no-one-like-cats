/**
 * Parte II · Oleada 4 «El Umbral» — WHEN each beat plays (same contract as rupturasScript.ts; app/story.ts merges these
 * tables). Beat lines are data in src/data/rupturas/historia-o4.json (each beat carries a `$scene` note). Pure: no Pixi,
 * no G — tests and tools read it.
 *
 * The beats that happen on YOUR island are CINE scenes (ui/story/o4Cines.ts, docs/part-ii/27 §Escenas): b58 a, b59 a,
 * b62 a, b64 (a: the page comes down to the faro · b: tap the faro → the choice, Canelo, «Mentira») and b65 (the
 * Parte II credits). b60 b, b61 a and b61 c are CINE scenes inside La Isla que Nadie Recuerda (ui/story/o4RegionCines.ts,
 * MENORES 2026-10-10). The rest are dialog where they happen (after a battle, inside a 3D region).
 *  - b61_distraxia part b: the blank page «speaks» in strikethroughs (ui/story/o4Tachones.ts, app/oleada4Flow.ts)
 *  - b64_mentira part b and b65_continuara are NOT queued here: tapping the faro (or the page by it) plays the finale
 *    (app/o4Finale.ts playFinale: «Mentira» → the Parte II credits); the world invites «TOCA EL FARO» meanwhile
 *    (world state o4_mentira)
 *
 * Order rule (like Oleada 1/2): a mission's ON_DONE and the next one's ON_NEW are queued together and the first READY
 * plays first, so every ON_NEW waits longer than the ON_DONE parts before it (tests/rupturasO4.test.ts checks it).
 */
import type { RupturaBeatRef } from './rupturasScript';

const part = (beat: string, p: string, lines: number[], o: Partial<RupturaBeatRef> = {}): RupturaBeatRef => ({ beat, part: p, lines, ...o });

/** beats that open when a mission APPEARS (max 4 visible lines each: 05 §5.6) */
export const O4_ON_NEW: Record<string, RupturaBeatRef[]> = {
  // after the Oleada 3 ending: let it breathe, then the island dozes and dreams (cine h58_suenos · world o4_suenos)
  H58: [part('b58_suenos', 'a', [0, 1, 2, 3], { delay: 20, special: 'cine', cine: 'h58_suenos', onlyOn: 'island', travel: true, until: 'H58' })],
  // after Almohadón's reveal: morning on the island, the cats wake up with another life (cine h59_ecos · world o4_eco)
  H59: [part('b59_ecos', 'a', [0, 1, 2, 3], { delay: 6, special: 'cine', cine: 'h59_ecos', onlyOn: 'island', travel: true, until: 'H59' })],
  H60: [part('b60_olvidada', 'a', [0, 1, 2], { delay: 3.5 })],
  // you're still on the repaired island: the page is there (cine h61_pagina, in the region: ui/story/o4RegionCines.ts)
  H61: [part('b61_distraxia', 'a', [0, 1, 2], { delay: 4, inRegion: true, onlyOn: 'region', special: 'cine', cine: 'h61_pagina', until: 'H61' })],
  // back home from the island nobody remembers: the Correctores' «perfect» reaches YOUR island (cine h62_correctores)
  H62: [part('b62_correctores', 'a', [0, 1, 2, 3], { delay: 4, special: 'cine', cine: 'h62_correctores', onlyOn: 'island', travel: true, until: 'H62' })],
  H63: [part('b63_umbral', 'a', [0, 1, 2, 3], { delay: 4 })],
  // the night of the page: it comes down to YOUR faro (cine h64_pagina) and stays there; tapping the faro plays the
  // rest (cine h64_mentira: the choice, Canelo, «Mentira»), which persists b64_mentira#b and b64_mentira itself
  H64: [part('b64_mentira', 'a', [0], { delay: 6, special: 'cine', cine: 'h64_pagina', onlyOn: 'island', travel: true, until: 'H64' })],
  // H65 is not queued: the finale (app/o4Finale.ts playFinale — MOMENTO: yonose_todo (H64→H65)) carries «Mentira»
  // straight into the Parte II credits; a reload in between resumes them at home (app/oleada4Flow.ts)
};

/** beats that play when a mission is COMPLETED (the battle's cat reveal already played) */
export const O4_ON_DONE: Record<string, RupturaBeatRef[]> = {
  H58: [part('b58_suenos', 'b', [4, 5, 6, 7], { delay: 1.5 })],
  H59: [part('b59_ecos', 'b', [4, 5, 6], { delay: 1.2 })],
  // the last ruin stands (H60 completes inside the region): the island in color, Polvillo (cine h60_color; the region
  // holds the story while its own last wave runs)
  H60: [part('b60_olvidada', 'b', [3, 4, 5], { delay: 1.2, inRegion: true, onlyOn: 'region', special: 'cine', cine: 'h60_color', until: 'H61' })],
  // part b (the strikethroughs) is a custom overlay (app/oleada4Flow); part c follows it: the line of ink (cine h61_linea)
  H61: [part('b61_distraxia', 'c', [7, 8], { delay: 2.5, inRegion: true, onlyOn: 'region', special: 'cine', cine: 'h61_linea', until: 'H62' })],
  H62: [part('b62_correctores', 'b', [4, 5, 6, 7], { delay: 1.5 })],
  H63: [part('b63_umbral', 'b', [4, 5, 6, 7], { delay: 1.5 })],
};

/** missions whose «new mission» tip is already said by their beat */
export const O4_COVERED: string[] = ['H58', 'H59', 'H60', 'H61', 'H62', 'H63', 'H64', 'H65'];

// ------------------------------------------------------------------ the beats the director doesn't play as dialog
/** b61 part b: Distraxia's strikethroughs (indexes into b61_distraxia.lines) */
export const DISTRAXIA_TACHONES = { beat: 'b61_distraxia', part: 'b', lines: [3, 4, 5], reply: [6] };
/** b64_mentira, line by line (the cine reads these indexes) */
export const MENTIRA_LINES = { arrive: [0], ask: [1, 2], climb: [3, 4], law: [5, 6], border: [7], mentira: [8], end: [9] };
/** b65_continuara (the cine reads these indexes) */
export const CREDITS_LINES = { dawn: [0, 1], registro: [2], fin: [3] };

// ------------------------------------------------------------------ H64: what you were going to write
export const MENTIRA_OPTIONS: { id: 'perfecto' | 'romper' | 'nada'; label: string }[] = [
  { id: 'perfecto', label: 'UN MUNDO PERFECTO' },
  { id: 'romper', label: 'ROMPER TODAS LAS CAJAS' },
  { id: 'nada', label: 'NADA. QUE SE QUEDE ASÍ' },
];
/** what Luzterna says right after you choose (then Canelo climbs onto the page anyway) */
export const MENTIRA_REPLY: Record<'perfecto' | 'romper' | 'nada', string> = {
  perfecto: 'Perfecto, ¿eh? Ok. Tú sabrás. Agarra el lápiz…',
  romper: '¿Romperlas todas? Qué rebelde me saliste. Agarra el lápiz…',
  nada: 'Nada. Me gusta. Igual agarra el lápiz, por si te arrepientes…',
};

// ------------------------------------------------------------------ surfaces
/** REGISTRO 000's card (panels/collection/registro000.ts) after the Parte II credits */
export const REGISTRO_DESPERTANDO = 'despertando';
/** the Parte II credits (ui/story/creditsParteII.ts) */
export const PARTE_II_TITLE = 'PARTE II — LA ERA DE LAS RUPTURAS';
export const PARTE_II_WAVES = 'LA MAREA IMPOSIBLE · EL CIELO DESPIERTA · LA ERA ASTRAL · EL UMBRAL';
