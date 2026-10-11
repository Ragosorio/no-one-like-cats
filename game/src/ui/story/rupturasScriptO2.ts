/**
 * Parte II · Oleada 2 «El Cielo Despierta» — WHEN each beat plays (same contract as rupturasScript.ts; app/story.ts
 * merges these tables). Beat lines are data in src/data/rupturas/historia-o2.json (each beat also carries a `$scene`
 * note: what the cine pass should SHOW). Pure: no Pixi, no G — tests and tools read it.
 *
 * Order rule (like Oleada 1): a mission's ON_DONE and the next one's ON_NEW are queued together and the first READY
 * plays first, so every ON_NEW waits longer than the ON_DONE parts before it (tests/rupturasO2.test.ts checks it).
 */
import type { RupturaBeatRef } from './rupturasScript';

const part = (beat: string, p: string, lines: number[], o: Partial<RupturaBeatRef> = {}): RupturaBeatRef => ({ beat, part: p, lines, ...o });

/**
 * Beats that open when a mission APPEARS (max 4 visible lines each: 05 §5.6).
 *
 * Cine pass (2026-10-10, docs/part-ii/22-oleada-2.md «Pasada de cine»): almost every part is a CINE scene now
 * (ui/story/o2Cines.ts, registered at boot by app/oleada2Flow.ts) that speaks these same lines while the WORLD shows
 * what the cut captions used to tell (the waterspouts, the sky islands, Corona Celeste up there, the white galleon,
 * the lantern's signal, the seam). Island scenes are `onlyOn: 'island'` + `travel` (from the CARTA the story takes you
 * home); region scenes are `onlyOn: 'region'` (they play where the arrival happens). `until`: a scene about a moment
 * the player can overtake is skipped (marked seen) once its mission is done.
 */
export const O2_ON_NEW: Record<string, RupturaBeatRef[]> = {
  // after «CONTINUARÁ: EL CIELO DESPIERTA»: let the Oleada 1 ending breathe before the sea stands up (cine h42_trombas:
  // three waterspouts rise from the Primer Mar into the clouds; one stays there as the way up)
  H42: [part('b42_trombas', 'a', [0, 1, 2], { delay: 20, special: 'cine', cine: 'h42_trombas', onlyOn: 'island', travel: true, until: 'H42' })],
  // you just arrived up there (H42 done inside the region): the mechanic comes down the waterspout, AFTER the arrival
  // (cine h43_helice on the Islas Invertidas: she lands on your deck and tapes the blueprint to the mast)
  H43: [part('b43_kit', 'a', [0, 1, 2, 3], { delay: 2.5, special: 'cine', cine: 'h43_helice', onlyOn: 'region', until: 'H43' })],
  // from home, up in the sky: an island hanging upside down with a ship moored under it (cine h44_cascada)
  H44: [part('b44_invertidas', 'a', [0, 1, 2], { delay: 3, special: 'cine', cine: 'h44_cascada', onlyOn: 'island', travel: true, until: 'H44' })],
  // a white city shows up above the clouds, purring all at once (cine h45_corona; it stays in your sky)
  H45: [part('b45_corona', 'a', [0, 1], { delay: 3, special: 'cine', cine: 'h45_corona', onlyOn: 'island', travel: true, until: 'H45' })],
  // arrival in Corona Celeste (H45 done inside the region) → the embassy comes out (cine h46_embajada: the brochure)
  H46: [part('b46_embajada', 'a', [0, 1, 2], { delay: 3, special: 'cine', cine: 'h46_embajada', onlyOn: 'region', until: 'H46' })],
  // from home: a white galleon with a whale figurehead sails in between the hanging islands (cine h47_galeon)
  H47: [part('b47_almirante', 'a', [0, 1, 2], { delay: 3, special: 'cine', cine: 'h47_galeon', onlyOn: 'island', travel: true, until: 'H47' })],
  // at night, on YOUR island's faro: three short, one long (cine h48_senal; the choice opens at its end:
  // app/oleada2Flow.ts offerLinterna)
  H48: [part('b48_linterna', 'a', [0, 1, 2], { delay: 4, special: 'cine', cine: 'h48_senal', onlyOn: 'island', travel: true })],
  // let the choice breathe before the oven opens (cine h49_horno: Corona tilts, everything rolls to the oven)
  H49: [part('b49_masamadre', 'a', [0, 1, 2], { delay: 20, special: 'cine', cine: 'h49_horno', onlyOn: 'island', travel: true, until: 'H49' })],
};

/** beats that play when a mission is COMPLETED (the battle's cat / element reveal already played) */
export const O2_ON_DONE: Record<string, RupturaBeatRef[]> = {
  // the waterspout spits you out among the upside-down islands (entering the region completes H42): cine h42_arriba
  H42: [part('b42_trombas', 'b', [3, 4], { delay: 0.8, special: 'cine', cine: 'h42_arriba', onlyOn: 'region' })],
  // installed in the Astillero: your ship inflates a balloon at home and hops (cine h43_aerobarco)
  H43: [part('b43_kit', 'b', [4, 5, 6], { delay: 1.5, special: 'cine', cine: 'h43_aerobarco', onlyOn: 'island', travel: true })],
  // after the first sky battle: pebbles float around your cats, Plomito falls asleep (cine h44_gravedad)
  H44: [part('b44_invertidas', 'b', [3, 4, 5, 6], { delay: 1.5, special: 'cine', cine: 'h44_gravedad', onlyOn: 'island', travel: true })],
  // arrival in Corona Celeste: identical cats purring in a ring; Hélice packs her bag (her reveal: app/oleada2Flow
  // when you're back home) · REGISTRO 000 gets a new line (cines h45_ciudad, h45_registro)
  H45: [
    part('b45_corona', 'b', [2, 3, 4], { delay: 0.8, special: 'cine', cine: 'h45_ciudad', onlyOn: 'region' }),
    part('b45_corona', 'c', [5], { delay: 1.6, special: 'cine', cine: 'h45_registro', onlyOn: 'region' }),
  ],
  // the embassy drifts away; Canelo bares his teeth; Ronrón stops purring (cine h46_ronron)
  H46: [part('b46_embajada', 'b', [3, 4], { delay: 1.5, special: 'cine', cine: 'h46_ronron', onlyOn: 'island', travel: true })],
  // the orders, the Leviathan in chalk, the cold scale (cine h47_ordenes plays b + c; h47_escama = part c alone)
  H47: [
    part('b47_almirante', 'b', [3, 4, 5], { delay: 1.5, special: 'cine', cine: 'h47_ordenes', onlyOn: 'island', travel: true }),
    part('b47_almirante', 'c', [6, 7], { delay: 2.5, special: 'cine', cine: 'h47_escama', onlyOn: 'island', travel: true }),
  ],
  // whatever you answered, she leaves it on (the choice is remembered: rupturasO2.linternaChoice) · cine h48_encendida
  H48: [part('b48_linterna', 'b', [3, 4], { delay: 1, special: 'cine', cine: 'h48_encendida', onlyOn: 'island', travel: true })],
  // the sky without weight, the seam, the hand of light, CONTINUARÁ (cine h49_costura plays b + c; h49_continuara = c)
  H49: [
    part('b49_masamadre', 'b', [3], { delay: 1.5, special: 'cine', cine: 'h49_costura', onlyOn: 'island', travel: true }),
    part('b49_masamadre', 'c', [4, 5], { delay: 2.5, special: 'cine', cine: 'h49_continuara', onlyOn: 'island', travel: true }),
  ],
};

/** missions whose «new mission» tip is already said by their beat */
export const O2_COVERED: string[] = ['H42', 'H43', 'H44', 'H45', 'H46', 'H47', 'H48', 'H49'];

// ------------------------------------------------------------------ H48: the choice (app/oleada2Flow.ts)
export const LINTERNA_QUESTION = '¿Qué hago con la linterna?';
export const LINTERNA_OPTIONS: { id: 'apagar' | 'encendida'; label: string; sub: string }[] = [
  { id: 'apagar', label: 'APÁGALA', sub: 'Que nadie de afuera la vea.' },
  { id: 'encendida', label: 'DÉJALA ENCENDIDA', sub: 'Que la vea quien la tenga que ver.' },
];
/** her answer right after you choose (the beat's part b follows: she leaves it on either way) */
export const LINTERNA_REPLY: Record<'apagar' | 'encendida', [string, string][]> = {
  apagar: [
    ['LUZTERNA', '…Ok. Tienes razón. Es lo más seguro.'],
    ['CAPTION', 'Luzterna pone la mano sobre el vidrio. Se queda así un rato largo. No la apaga.'],
  ],
  encendida: [
    ['LUZTERNA', '¿En serio? ¿Aunque la vea quien sea?'],
    ['CAPTION', 'Luzterna limpia el vidrio con la manga. La luz sale más derecha que nunca.'],
  ],
};
/** what she remembers later (after Masa Madre, and wherever a later wave wants to read it) */
export const LINTERNA_LATER: Record<'apagar' | 'encendida', string> = {
  apagar: 'Me dijiste que la apagara y no te hice caso. Ya sabes cómo soy. …Gracias por preguntar primero.',
  encendida: 'Gracias por no pedirme que la apagara, Capi. Alguien allá afuera ya sabe dónde vivimos.',
};

// ------------------------------------------------------------------ surfaces
/** REGISTRO 000's card gains this line once Corona Celeste was visited (canon: 13 · Oleada 2) */
export const REGISTRO_O2_LINE = 'Visto: Corona Celeste.';
/** toast when your ship becomes an aerobarco */
export const KIT_TOAST = { title: '¡AEROBARCO!', sub: 'Mismo barco, mismo nombre, mismos gatos. Ahora flota.' };
/** the sky preflight (a sky battle and your active ship doesn't fly) */
export const SKY_GATE = {
  title: 'ESTA PELEA ES EN EL CIELO',
  noKit: 'Tu barco no vuela todavía. Instálale el Kit de Vuelo en el ASTILLERO › VUELO.',
  other: (active: string, kitted: string) => `Tu ${active} no vuela. ¿Zarpas con el ${kitted}, que sí?`,
};
