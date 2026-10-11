/**
 * Parte II · Oleada 3 «La Era Astral» — WHEN each beat plays (same contract as rupturasScript.ts; app/story.ts merges
 * these tables). Beat lines are data in src/data/rupturas/historia-o3.json (each beat also carries a `$scene` note: what
 * the cine pass should SHOW). Pure: no Pixi, no G — tests and tools read it.
 *
 * Order rule (like Oleadas 1–2): a mission's ON_DONE and the next one's ON_NEW are queued together and the first READY
 * plays first, so every ON_NEW waits longer than the ON_DONE parts before it (tests/rupturasO3.test.ts checks it).
 */
import type { RupturaBeatRef } from './rupturasScript';

const part = (beat: string, p: string, lines: number[], o: Partial<RupturaBeatRef> = {}): RupturaBeatRef => ({ beat, part: p, lines, ...o });

/**
 * Pasada de cine (2026-10-10, docs/part-ii/25 «Pasada de cine»): the beats that happen IN THE WORLD are CINE scenes
 * (ui/story/o3Cines.ts) — `special: 'cine'`. Island scenes take you home from the CARTA (`travel`); the arrival plays in
 * Puerto Cometa. The seal (H53) and the logbook (H56) are scenes played by their interactions (app/oleada3Flow.ts): they
 * persist their own parts (b53 b, b56 b/c) before completing the mission, so the refs below for those parts are only the
 * fallback when a mission got completed some other way. Lines the world now shows were cut from historia-o3.json.
 */
const cine = (id: string, o: Partial<RupturaBeatRef> = {}): Partial<RupturaBeatRef> => ({ special: 'cine', cine: id, onlyOn: 'island', travel: true, ...o });

/** beats that open when a mission APPEARS (max 4 visible lines each: 05 §5.6) */
export const O3_ON_NEW: Record<string, RupturaBeatRef[]> = {
  // after «CONTINUARÁ: LA ERA ASTRAL»: a breath, then the seam in your sky strains and opens a crack (neon, a sign)
  H50: [part('b50_cometa', 'a', [0, 1, 2], { delay: 20, ...cine('h50_costura') })],
  // you just arrived (H50 done inside Puerto Cometa): Escafandra's exam, AFTER the arrival scene. Luzterna draws it on a
  // chalkboard while she shouts (line hook: app/oleada3Flow.ts → ui/story/o3Screen.ts pizarra)
  H51: [part('b51_sincronia', 'a', [0, 1, 2, 3], { delay: 3, inRegion: true })],
  // the tug crosses YOUR sky dragging a planetoid on a cable of light (one second of the Estrella falling)
  H52: [part('b52_estrella', 'a', [0, 1, 2], { delay: 3, ...cine('h52_remolcadora') })],
  // violet dusk: Canelo by your faro staring at a seal of runes; the seal scene opens right after (app/oleada3Flow.ts)
  H53: [part('b53_canelo', 'a', [0, 1, 2], { delay: 3, ...cine('h53_sello') })],
  // a bell on the island: a cat with a broom sweeps star dust nobody else sees
  H54: [part('b54_maneki', 'a', [0, 1, 2], { delay: 3, ...cine('h54_maneki') })],
  // somebody painted the sky; a ship of paint cans crosses with Brecha hanging upside down
  H55: [part('b55_disruptores', 'a', [0, 1, 2], { delay: 3, ...cine('h55_grafiti') })],
  H56: [part('b56_nota', 'a', [0, 1, 2], { delay: 3, inRegion: true })],
  // let the margin note breathe (silence) before the sea turns over and the Leviathan rises through your sky
  H57: [part('b57_leviatan', 'a', [0, 1, 2], { delay: 25, ...cine('h57_leviatan') })],
};

/** beats that play when a mission is COMPLETED (the battle's cat reveal already played) */
export const O3_ON_DONE: Record<string, RupturaBeatRef[]> = {
  // arrival in Puerto Cometa (entering the region completes H50): the yard, Escafandra's wrench, the decal on your hull;
  // the Taller opens after it (app/oleada3Flow)
  H50: [part('b50_cometa', 'b', [3, 4, 5], { delay: 0.8, inRegion: true, onlyOn: 'region', special: 'cine', cine: 'h50_llegada' })],
  // the stamp comes down on your passport (line hook: ¡CHUNK!)
  H51: [part('b51_sincronia', 'b', [4, 5, 6], { delay: 1.5, inRegion: true })],
  // the tug's logbook: the order written in the margin, the doodle of a hand with a pencil
  H52: [part('b52_estrella', 'b', [3, 4], { delay: 1.5, ...cine('h52_bitacora') })],
  // b: said by the seal scene itself (fallback dialog) · c: that night, Canelo Astral and the rock (only he sees who)
  H53: [part('b53_canelo', 'b', [3], { delay: 1.2, inRegion: true }), part('b53_canelo', 'c', [4], { delay: 2, ...cine('h53_penasco') })],
  H54: [part('b54_maneki', 'b', [3, 4, 5, 6], { delay: 1.5, inRegion: true })],
  // Brecha leaves; Grafitera paints a box with its door open on your boat (it stays there)
  H55: [part('b55_disruptores', 'b', [3, 4, 5], { delay: 1.5, ...cine('h55_casco') })],
  // b and c are said by the logbook scene (the note in the margin, then Luzterna): fallback after a long silence
  H56: [part('b56_nota', 'c', [3, 4], { delay: 4, inRegion: true })],
  // the chains are gone: an eye the size of your island says thanks · the rift stays open, breathing · CONTINUARÁ
  H57: [part('b57_leviatan', 'b', [3, 4], { delay: 1.5, ...cine('h57_gracias') }), part('b57_leviatan', 'c', [5], { delay: 2.5, ...cine('h57_grieta') })],
};

/** missions whose «new mission» tip is already said by their beat */
export const O3_COVERED: string[] = ['H50', 'H51', 'H52', 'H53', 'H54', 'H55', 'H56', 'H57'];

// ------------------------------------------------------------------ surfaces (app/oleada3Flow.ts, panels/CometaShop.ts)
/** the Taller's toast when your aerobarco becomes a nave astral */
export const ASTRAL_TOAST = { title: '¡NAVE ASTRAL!', sub: 'Mismo barco, mismo nombre, mismos gatos. Ahora aguanta el vacío.' };
/** Escafandra's gift on arrival (H50) */
export const GIFT_TOAST = (fuel: number, ship: string | null) => ({
  title: 'REGALO DE ESCAFANDRA',
  sub: `${fuel ? `+${fuel} Combustible Astral` : ''}${fuel && ship ? ' · ' : ''}${ship ? `el Kit Astral va en tu ${ship}` : ''}`,
});
/** the void preflight (an astral battle and your ship can't go / the tank is short) */
export const VOID_GATE = {
  title: 'ESTA PELEA ES EN EL VACÍO',
  noKit: 'Tu barco no aguanta el vacío. Ponle el Kit Astral en el TALLER COMETA.',
  other: (active: string, kitted: string) => `Tu ${active} no es nave astral. ¿Zarpas con el ${kitted}, que sí?`,
  fuel: (have: number, need: number) => `El viaje cuesta ${need} de Combustible Astral y tienes ${have}.`,
  fia: 'Escafandra te fía el viaje. «Por esta vez. Y porque me caes bien. No le digas a nadie.»',
};
/** H53 · the seal (taps) — H54 · the Archivo's card (sweeps) — H56 · the logbook (signature) */
export const SELLO = { title: 'EL SELLO', sub: 'Canelo no le quita los ojos de encima. Tócalo para romperlo con él.', taps: 3, cracks: ['crac.', '¡CRAC!', '¡¡CRAAAC!!'] };
export const FICHA = {
  title: 'FICHA DEL ARCHIVO',
  sub: 'Polvo de estrellas encima. Bárrelo.',
  rows: [
    ['CAJA', 'Nº 7.311'],
    ['PACIENTE', 'un mundo con gatos'],
    ['DIAGNÓSTICO', 'olvido crónico (tratado)'],
    ['ESTADO', 'sanando'],
    ['NOTAS', 'no despertar al gato naranja'],
  ] as [string, string][],
};
export const BITACORA = {
  title: 'BITÁCORA DE PUERTO COMETA',
  sub: 'Firma para zarpar al vacío profundo. Puro trámite.',
  sign: 'FIRMAR',
  note: 'Que esta caja llegue lejos.',
};

/** REGISTRO 000's card gains this line once the seal broke (H53): only Canelo sees it — and he says nothing (guion 13) */
export const REGISTRO_O3_LINE = 'Visto por: un gato naranja. No dijo nada.';
