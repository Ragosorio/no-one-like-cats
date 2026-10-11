/**
 * Parte II · Oleada 1 «La Marea Imposible» (H31–H41, docs/part-ii/12-puente-oleada-1.md): WHEN each beat
 * plays and the small texts that live on surfaces that already exist (the faro, the Catdex, the crew
 * profile, the Diario, the casino chat). The beats' lines are data: src/data/rupturas/historia.json.
 * The battles and the 3D islands' map flags are state/sys/rupturas.ts. app/story.ts merges RUPTURAS_ON_NEW /
 * RUPTURAS_ON_DONE into its own tables, so this file stays pure (no Pixi, no G): tests and tools can read it.
 */

/** same shape as app/story.ts BeatRef (the subset Parte II uses) */
export interface RupturaBeatRef {
  beat: string;
  lines?: number[];
  part?: string;
  effect?: 'darkSky';
  delay?: number;
  /** 'region' = only inside a 3D region (RegionScene) */
  onlyOn?: 'map' | 'island' | 'region';
  /** may also play inside a 3D region (the island / the map otherwise): arrival beats */
  inRegion?: boolean;
  /** `special: 'region'`: no lines, it TRAVELS to that 3D region (a cinematic returns to the island by itself) ·
   *  `special: 'cine'`: a CINE scene on this screen (src/cine) that speaks this beat's `lines` itself */
  special?: 'region' | 'cine';
  region?: string;
  cine?: string;
  /** a cine that must play at home: if the story is waiting on the CARTA, it takes you home for it */
  travel?: boolean;
  /** a scene about a moment that can be overtaken: once this mission is done, it is skipped (marked seen) */
  until?: string;
}

const part = (beat: string, p: string, lines: number[], o: Partial<RupturaBeatRef> = {}): RupturaBeatRef => ({ beat, part: p, lines, ...o });

/** H31: the sea at night reflects an island that isn't there (regions/reflejo.ts). Its beat id plays it ONCE. */
export const REFLEJO_CINEMATIC: RupturaBeatRef = { beat: 'b31_reflejo', special: 'region', region: 'reflejo', onlyOn: 'island', delay: 1.2 };

/**
 * Beats that open when a mission APPEARS (max 4 visible lines each: 05 §5.6).
 * Order: a mission's ON_DONE and the next one's ON_NEW are queued together and the first READY plays first,
 * so every ON_NEW waits longer than the ON_DONE parts before it (tests/rupturasStory.test.ts checks it).
 */
export const RUPTURAS_ON_NEW: Record<string, RupturaBeatRef[]> = {
  // after «Fin»: a breath (the world is already in 'presagio': now and then a star rises in daylight), then the
  // OPENING — a cine on the island (src/cine/scenes/opening.ts): the sky really goes dark and stays dark
  // (world state 'noche_astral', src/state/sys/worldState.ts). It persists this part at its climax.
  H31: [part('b31_estrellas', 'a', [0, 1, 2, 3], { special: 'cine', cine: 'h31_opening', onlyOn: 'island', delay: 20 })],
  // back from «el reflejo», still at night: silence, the picture tears, a card nobody wrote slips into the Catdex
  // (cine h32_registro; the Catdex itself glitches the first time you open it: panels/collection/registro000.ts)
  H32: [part('b32_registro', 'a', [0, 1], { delay: 2, special: 'cine', cine: 'h32_registro', onlyOn: 'island', travel: true })],
  // «Amanece» for real: the night ends on screen (cine h33_amanecer persists the part when the sun is up) and the
  // island of books shows on the horizon; it shows up on the CARTA too (flag region:paginas, state/sys/rupturas.ts)
  H33: [part('b33_paginas', 'a', [0, 1, 2], { delay: 2, special: 'cine', cine: 'h33_amanecer', onlyOn: 'island', travel: true, until: 'H33' })],
  // you just landed (H33 done inside the region): the Archivista greets you there, AFTER the arrival beat
  // (both are queued at once; the first one ready plays first, so this one waits a little longer)
  H34: [part('b34_biblioteca', 'a', [0, 1], { delay: 2, inRegion: true })],
  H35: [part('b35_shhh', 'a', [0, 1, 2, 3], { delay: 2 })],
  H36: [part('b36_pagina_canelo', 'a', [0, 1], { delay: 3 })],
  // back on deck: Canelo took the page AND the wheel
  H37: [part('b37_timon', 'a', [0, 1, 2], { delay: 2 })],
  H38: [part('b38_a_babor', 'a', [0, 1], { delay: 3 })],
  // Canelo Almirante's reveal (app/formsFlow.ts) needs a calm moment first: Isla Nácar waits a bit
  H39: [part('b39_nacar', 'a', [0, 1, 2, 3], { delay: 25 })],
  H40: [part('b40_madrenacar', 'a', [0, 1, 2], { delay: 2 })],
  H41: [part('b41_corrector', 'a', [0, 1, 2, 3], { delay: 2 })],
};

/** beats that play when a mission is COMPLETED (the battle's cat / element reveal already played) */
export const RUPTURAS_ON_DONE: Record<string, RupturaBeatRef[]> = {
  // …and then the camera flies over the night sea: the 3D cinematic «el reflejo» (once)
  // (the island is still at night: the world state shows it). Part b is a cine on the faro (h31_faro): the beam
  // stops sweeping and points where the Primer Mar's faro points
  H31: [part('b31_estrellas', 'b', [4, 5, 6], { delay: 0.6, special: 'cine', cine: 'h31_faro', onlyOn: 'island' }), REFLEJO_CINEMATIC],
  // read over the Catdex: the static on the card develops into FOLIO with the caption (cine/lineHooks.ts)
  H32: [part('b32_registro', 'b', [2, 3, 4, 5], { delay: 0.8 })],
  // arrival on the Isla de las Páginas Hundidas (entering the region completes H33): the island rises out of the
  // sea as you land (cine h33_llegada, 3D; regions/paginas.ts drives the rise)
  H33: [part('b33_paginas', 'b', [3, 4], { delay: 0, inRegion: true, onlyOn: 'region', special: 'cine', cine: 'h33_llegada' })],
  H34: [part('b34_biblioteca', 'b', [2, 3, 4], { delay: 1.5 })],
  // the Bibliotecario explains at home, and someone else's handwriting shows up in the margins (cine h35_margen)
  H35: [part('b35_shhh', 'b', [4, 5, 6, 7], { delay: 1.5, special: 'cine', cine: 'h35_margen', onlyOn: 'island', travel: true }), part('b35_shhh', 'c', [8, 9, 10], { delay: 2.5 })],
  // Canelo's page, read inside the region (its activity completes H36): his Eco in a music box (cine h36_eco)
  H36: [part('b36_pagina_canelo', 'b', [2, 3, 4], { delay: 0.8, inRegion: true, onlyOn: 'region', special: 'cine', cine: 'h36_eco' })],
  H37: [part('b37_timon', 'b', [3, 4], { delay: 2 })],
  // «La página se completa»: Canelo becomes the admiral of his Eco (the form reveal follows: formsFlow)
  // the transformation at home (cine h38_almirante): the page falls, writes its last line, wraps him… and on the
  // song's climax he's wearing the hat. The form reveal card closes the scene (app/formsFlow.ts waits for it)
  H38: [part('b38_a_babor', 'b', [2, 3, 4], { delay: 1.5, special: 'cine', cine: 'h38_almirante', onlyOn: 'island', travel: true })],
  H39: [part('b39_nacar', 'b', [4, 5, 6, 7], { delay: 1.5 })],
  // what the crystal remembers, shown on YOUR island: a cat on the rocks, then nobody at all (cine h40_cristal)
  H40: [part('b40_madrenacar', 'b', [3, 4, 5], { delay: 1.5, special: 'cine', cine: 'h40_cristal', onlyOn: 'island', travel: true })],
  // the island gets «corrected» for a moment, the signature, and CONTINUARÁ (cine h41_correccion plays both parts;
  // h41_continuara is part c alone, if part b was cut short after its point of no return)
  H41: [
    part('b41_corrector', 'b', [4, 5, 6], { delay: 1.5, special: 'cine', cine: 'h41_correccion', onlyOn: 'island', travel: true }),
    part('b41_corrector', 'c', [7, 8], { delay: 2.5, special: 'cine', cine: 'h41_continuara', onlyOn: 'island', travel: true }),
  ],
};

/** missions whose «new mission» tip is already said by their beat */
export const RUPTURAS_COVERED = ['H31', 'H32', 'H33', 'H34', 'H35', 'H36', 'H37', 'H38', 'H39', 'H40', 'H41'];

// ------------------------------------------------------------------ the island's faro (IslandScene)
/** Part I (before «Fin»): the lighthouse only looks at the sea */
export const FARO_PART_I = 'El faro mira al Primer Mar…';
/** H31 active: Luzterna is waiting up there */
export const FARO_CALL = '«¡Capi! ¡Aquí arriba! Mira el mar…»';
/** after «Fin»: Luzterna lives in your faro now (H30 FINAL_OUTRO: she hung her lantern there) */
export const FARO_LUZTERNA = [
  'Luzterna está de guardia. Dice que no la molestes.',
  '«Renta gratis. Ventaja de estar muerta.» —Luzterna',
  'La linterna alumbra hacia afuera. Muy hacia afuera.',
  '«No toques el vidrio, que lo acabo de limpiar.»',
  'Luzterna cuenta estrellas. Van para arriba. Otra vez.',
];

// ------------------------------------------------------------------ REGISTRO 000 (03 §4 · 05 §5.3)
/** the Catdex card before Nº01 (panels/collection/registro000.ts). It is NOT a species. */
export const REGISTRO_000 = {
  serial: 'Nº 000',
  title: 'REGISTRO 000',
  fields: [
    ['ESPECIE', 'desconocida'],
    ['ELEMENTO', 'ninguno'],
    ['RAREZA', 'no aplicable'],
    ['ESTADO', 'observando'],
  ] as [string, string][],
  /** the static word of the Barco del Vacío, readable at last */
  stamp: 'FOLIO',
  note: 'Esta ficha no la escribió nadie de tu isla. La letra no coincide con ningún registro.',
  /** the secret 12 flag (story:capitulo2): it was already watching */
  watching: 'Observando desde antes de que llegaras.',
  author: 'AUTOR: —',
};

/** crew profile (ui/story/profile.ts), from H32 on */
export const FOLIO_000 = { label: 'FOLIO 000 —', struck: 'vacante' };

/** the Diario's victory photo caption (ResultsScene), 2% from H32 on */
export const REGISTRO_CAPTION = 'FOTO: archivo. Nadie recuerda al cuarto gato.';
export const REGISTRO_CAPTION_CHANCE = 0.02;

/** casino chat (panels/casino/lines.ts): one odd line per session, from H32 on */
export const REGISTRO_CHAT_USER = 'registro_000';
export const REGISTRO_CHAT_COLOR = 0xe8e8e8;
export const REGISTRO_CHAT_CHANCE = 0.05;
export const REGISTRO_CHAT: string[] = ['…', 'sigo aquí', 'no aposté. observé.', 'folio 000. presente.', '¿ustedes también ven el mar al revés?', 'no me busquen en el catdex. ya estoy.', 'el cuarto gato de la foto les manda saludos'];
