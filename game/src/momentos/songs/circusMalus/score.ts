/**
 * CIRCUS MALUS — the choreography (H62 · the Correctores' plan), THE WHOLE SONG (125 s). Song time; 100 BPM, a bar is
 * 2.4 s, '#n' = bar n. Full sheet: docs/part-ii/29 §15.
 *
 * A mechanical riff that never changes → a perfectly symmetric show where everything moves in unison ON the beat; the
 * player's hits are the only asymmetric things (Canelo's own moves, true-color stains on the film, crooked stamps,
 * dancers out of step). The song's weird final (four «perfect» chords, the fourth one crooked) is the picture's: the
 * world freezes into perfect symmetry chord by chord, holds its breath, and the crooked chord TEARS the film.
 *
 *  verse    0–24     cold open stamped «CORREGIDO» · iris · title card · the curtain rises · Canelo drops in (TAP) ·
 *                    the chorus line shows the step, Canelo answers his own way (TAP ×2)
 *  chorus   24–48    TWO-STRIP COLOR wipes in from the axis · the gloves stamp the backbeat · dodge them (TAP ×6)
 *  break    48–57.6  black-and-white: the piano roll (the plan, punched) · ¿LEFT or RIGHT? (CHOICE) → corrected anyway ·
 *                    the big stamp (TAP)
 *  verse2   57.6–67.2  the mirror: Canelo vs his corrected reflection (TAP ×4)
 *  build    67.2–76.8  the theatre is a music box: gears, the wind-up key · HOLD on and release into…
 *  chorus2  76.8–115.2  THE PLAN: the full show · bat the stamps (TAP ×4) · bang the calliope (MASH) · ¿LEFT or RIGHT?
 *                    (CHOICE) · Tachón's mega stamp (TAP) · knock the dancers out of step (TAP ×5) · ¡ORDEN!
 *  outro    115.2–125  stillness · chords 1–3 make the world perfectly symmetric · the breath · chord 4 TEARS it (TAP)
 */
import type { MomentoDef, ScoreEntry } from '../../types';
import { at, choice, hold, key, mash, on, tap, v } from '../../score';

/** verse: Canelo's answers to the chorus line (kick onsets on the downbeats of bars 7 and 9) */
export const PASOS = [16.8, 21.6];
/** chorus: the stamps he dodges (snare onsets on the backbeat) */
export const SELLOS = [29.4, 31.8, 34.2, 39.0, 41.4, 43.8];
/** verse2: the mirror (the «2-and» kick of every bar) */
export const ESPEJO = [58.5, 60.9, 63.3, 65.7];
/** chorus2: the stamps he bats away (snare onsets) */
export const GOLPES = [79.8, 82.2, 84.6, 91.8];
/** chorus2: the dancers he knocks out of step (snare onsets on the backbeat of bars 42–46) */
export const KNOCK_T = [101.4, 103.8, 106.2, 108.6, 111.0];
/** dancer n (0..5: pairs inner → outer, left then right) → the prompt that knocks it out of step */
export const KNOCKS = ['knock0', 'knock1', 'knock2', 'knock3', 'knock4', 'knock4'];
/** big_hit_6: ¡ORDEN! — everything the player bent snaps back */
export const ORDER_T = 113.7;
/** the four chords of the weird final, and the breath before the last */
export const CHORDS = [115.2, 117.6, 120.0, 122.4];
export const BREATH = 121.998;

const WIDE = { 'cam.x': 960, 'cam.y': 500, 'cam.zoom': 0.9, 'cam.rot': 0 };
const TACHON = { 'cam.x': 960, 'cam.y': 470, 'cam.zoom': 1.45, 'cam.rot': 0 };
const LINE = { 'cam.x': 960, 'cam.y': 640, 'cam.zoom': 1.2, 'cam.rot': 0 };
const CUT = { dur: 0.01 };

/** a symmetric color wipe from the axis out: the new film mode spreads from the centre in `beats` */
function wipe(t: number, mode: number, beats = 2): ScoreEntry[] {
  // (a key that cuts and a key that tweens the same prop need different instants: the tween starts 20 ms later)
  return [key(t - 0.02, { film1: mode, wipe: 0 }, CUT), key(t, { wipe: 1.05 }, { beats, ease: 'out' }), key(t, { film0: mode }, { beats: beats + 0.01, ease: 'step' })];
}
/** a hard cut to another film (mechanical: no blend) */
function cutTo(when: number, mode: number): ScoreEntry[] {
  return [key(when, { film0: mode, film1: mode, wipe: 0 }, CUT)];
}
const stain = (color: number, size = 1) => v('stain', { at: 'caneloHead', color, size });

const score: ScoreEntry[] = [
  // ================================================================ VERSE — the cold open, the title, the curtain
  at(0, v('coldOpen', { dur: 3.3 }), v('impact', { dur: 0.07, invert: true, lines: false })),
  key(0, { iris: 2, grain: 1 }),
  key('#1', { iris: 1.15 }, CUT),
  key(2.42, { iris: 0 }, { dur: 0.88, ease: 'in' }),
  // big_hit_1: the iris opens on the title card
  at('big_hit_1', v('titleCard', { dur: 6.3 })),
  key('big_hit_1', { iris: 1.25 }, { dur: 1.2, ease: 'out' }),
  key(4.55, { iris: 2 }, CUT),
  // bar 4: the theatre, curtain down; it rises in four mechanical steps, one per beat
  key('#4', { ...WIDE, curtain: 0 }, CUT),
  ...[0, 1, 2, 3].map((b) => key(`#4:${b}`, { curtain: (b + 1) / 4 }, { beats: 0.5, ease: 'outBack' })),
  at('#4', v('cartel', { text: '¡FUNCIÓN!', at: [960, 300], size: 120, beats: 3, banner: true })),
  // big_hit_2: Canelo drops in from the flies — off the axis (the only thing on stage that isn't symmetric)
  key(11.7, { can: 1, luz: 1 }, CUT),
  at(11.7, v('fall', { dur: 1.2 })),
  tap(
    'big_hit_2',
    { id: 'aterriza', label: '¡ATERRIZA!', anchor: 'canelo' },
    {
      great: [v('pose', { p: 'cool', dur: 1.4 }), v('cartel', { text: '¡TA-DÁ!', at: 'caneloHead', dy: -190, size: 110, dur: 1.1 }), stain(0xff6a3d), v('dust', { n: 10 })],
      hit: [v('pose', { p: 'surprise', dur: 1 }), v('cartel', { text: '¡PUM!', at: 'caneloHead', dy: -190, size: 90, dur: 0.9 }), v('dust', { n: 6 })],
      miss: [v('pose', { p: 'flat', dur: 1.2 }), v('cartel', { text: '¡PLAF!', at: 'caneloHead', dy: -150, size: 90, dur: 0.9, crooked: true }), v('dust', { n: 8 })],
    },
  ),
  key('big_hit_2', { 'cam.x': 840, 'cam.y': 720, 'cam.zoom': 1.35 }, CUT),
  // everyone on stage freezes a beat and stares (in unison, of course)
  key('big_hit_2', { still: 1 }, CUT),
  key(13.5, { still: 0 }, CUT),
  at(13.5, v('stare', { beats: 1.5 })),
  key('#6', WIDE, CUT),
  // bars 6–9: the chorus line shows the step; Canelo answers — his own way
  at('#6', v('lineStep', { beats: 4 }), v('cartel', { text: '¡ASÍ!', at: [960, 260], size: 100, beats: 2 })),
  ...PASOS.flatMap((t, n): ScoreEntry[] => [
    key(t - 0.6, { 'cam.x': 860, 'cam.y': 700, 'cam.zoom': 1.25, 'cam.rot': 0 }, CUT),
    tap(
      t,
      { id: `paso${n}`, label: '¡TU PASO!', anchor: 'canelo' },
      {
        great: [v('pose', { p: 'twirl', dur: 1.1 }), v('cartel', { text: n ? '¡OLÉ!' : '¡JA!', at: 'caneloHead', dy: -200, size: 110, dur: 1, crooked: true }), stain(n ? 0x4ad0ff : 0xffd23a), v('roll', { r: 0.05, dur: 0.6 })],
        hit: [v('pose', { p: 'cool', dur: 0.9 }), v('cartel', { text: '¡HOP!', at: 'caneloHead', dy: -190, size: 90, dur: 0.8 })],
        miss: [v('pose', { p: 'trip', dur: 1 }), v('cartel', { text: '¿eh?', at: 'caneloHead', dy: -170, size: 80, dur: 0.8, plain: true })],
      },
    ),
    key(t + 1.8, WIDE, CUT),
  ]),
  at('#8', v('lineStep', { beats: 4 })),

  // ================================================================ CHORUS — two-strip color, the gloves stamp the backbeat
  ...wipe(24.0, 1, 2),
  key('chorus', { rows: 0.6 }, CUT),
  at('chorus', v('cartel', { text: '¡EN COLOR!', at: [960, 280], size: 130, beats: 4, banner: true }), v('confetti2', { n: 40 })),
  // mechanical cuts on the bar lines: wide · Tachón · wide · the line
  ...[11, 13, 15, 17, 19].map((b, i) => key(`#${b}`, i % 2 ? LINE : TACHON, CUT)),
  ...[12, 14, 16, 18].map((b) => key(`#${b}`, WIDE, CUT)),
  at('#11', v('baton', { beats: 4 })),
  ...SELLOS.flatMap((t, n): ScoreEntry[] => [
    at(t - 0.5, v('stampShot', { prompt: `sello${n}`, dur: 0.95, side: n % 2 ? 1 : -1 })),
    tap(
      t,
      { id: `sello${n}`, lead: 0.5, anchor: 'canelo', label: n === 0 ? '¡ESQUIVA!' : undefined },
      {
        great: [v('pose', { p: 'stretch', dur: 0.6 }), v('cartel', { text: '¡ZAS!', at: 'caneloHead', dy: -200, size: 100, dur: 0.7, crooked: true }), stain([0xff6a3d, 0x4ad0ff, 0xffd23a][n % 3], 0.8)],
        hit: [v('pose', { p: 'duck', dur: 0.5 }), v('cartel', { text: '¡UF!', at: 'caneloHead', dy: -190, size: 80, dur: 0.6 })],
        miss: [v('pose', { p: 'flat', dur: 1 }), v('sello', { at: 'caneloHead', dur: 1 })],
      },
    ),
  ]),
  at(36.0, v('lineShot', { beats: 4 })),
  at(45.6, v('lineShot', { beats: 4, tachon: true })),

  // ================================================================ BREAK — black-and-white: the plan, punched in a piano roll
  ...cutTo(48.0, 0),
  at('break', v('rollShot', { beats: 8 })),
  key('break', { rows: 0 }, CUT),
  key('#22', { ...WIDE, 'cam.zoom': 1.05, 'cam.y': 600 }, CUT),
  choice(
    53.4,
    { id: 'cual', fallback: 'left', label: '¿CUÁL?' },
    { left: [v('run', { side: -1, dur: 1.2 }), v('signs', { pick: -1, dur: 2.7 })], right: [v('run', { side: 1, dur: 1.2 }), v('signs', { pick: 1, dur: 2.7 })] },
  ),
  at(50.4, v('signs', { dur: 3 })),
  // the glove picks him up and puts him back EXACTLY on the axis, whatever he chose
  at(54.6, v('correct', { prompt: 'cual', dur: 1.2 })),
  key(55.8, { 'can.x': 960 }, CUT),
  at(55.8, v('cartel', { text: 'CORREGIDO', at: [960, 250], size: 96, beats: 1.5, seal: true })),
  at(55.8, v('bigStamp', { prompt: 'gran_sello', dur: 1.8 })),
  tap(
    'big_hit_3',
    { id: 'gran_sello', label: '¡ARRIBA!', anchor: 'canelo' },
    {
      great: [v('pose', { p: 'stretch', dur: 0.7 }), v('cartel', { text: '¡FALLÓ!', at: 'caneloHead', dy: -230, size: 110, dur: 1, crooked: true }), stain(0xff6a3d, 1.2)],
      hit: [v('pose', { p: 'duck', dur: 0.6 })],
      miss: [v('pose', { p: 'flat', dur: 1.4 }), v('sello', { at: 'caneloHead', dur: 1.3 })],
    },
  ),

  // ================================================================ VERSE2 — the mirror
  ...wipe(57.6, 1, 1),
  at('verse2', v('mirrorShot', { dur: 9.6 })),
  ...ESPEJO.map((t, n) =>
    tap(
      t,
      { id: `espejo${n}`, lead: 0.5, anchor: 'espejo', label: n === 0 ? '¡MUÉVETE!' : undefined },
      { great: [v('cartel', { text: ['¡NO!', '¡JE!', '¡BU!', '¡TOMA!'][n], at: [560, 300], size: 100, dur: 0.8, crooked: true }), stain([0xffd23a, 0x4ad0ff, 0xff6a3d, 0x9dff6a][n], 0.7)], hit: [], miss: [] },
    ),
  ),

  // ================================================================ BUILD — the theatre is a music box: wind it up, hold on
  ...cutTo(67.2, 0),
  at('build', v('gearsShot', { beats: 4 }), v('cartel', { text: '¡CRAC!', at: [960, 420], size: 140, dur: 0.8, crooked: true })),
  key('#29', { gears: 1, key: 1, 'cam.x': 960, 'cam.y': 330, 'cam.zoom': 0.62, 'cam.rot': 0 }, { beats: 4, ease: 'inOut' }),
  key('#29', { 'can.x': 860 }, CUT),
  at('big_hit_4', v('cartel', { text: '¡CLANK!', at: [960, 200], size: 120, dur: 0.9 }), v('punch', { z: 0.05, dur: 0.3 })),
  hold(
    '#29',
    'climax',
    { id: 'cuerda', release: true, label: '¡AGUANTA!', anchor: 'canelo' },
    {
      great: [v('release', { r: 'great' }), v('impact', { dur: 0.07 })],
      hit: [v('release', { r: 'hit' })],
      miss: [v('release', { r: 'miss' }), v('pose', { p: 'trip', dur: 1 })],
    },
  ),
  at('#29', v('windUp', { prompt: 'cuerda', beats: 12 })),
  key('#31', { 'cam.y': 520, 'cam.zoom': 0.95 }, { beats: 4, ease: 'in' }),

  // ================================================================ CHORUS2 — THE PLAN: the full show
  ...wipe(76.8, 1, 1),
  key('climax', { pal: 'plan', gears: 0, key: 0, rows: 1, crew: 1, charge: 0, ...WIDE }, CUT),
  at('climax', v('cartel', { text: '¡EL PLAN!', at: [960, 270], size: 150, beats: 4, banner: true }), v('confetti2', { n: 70 })),
  on({ onsets: { track: 'kick', in: ['climax', '#47'], min: 0.85, minGap: 4.5 } }, v('fireworks', { dur: 1.4 })),
  // the cuts keep their mechanical bar grid
  ...[33, 35, 39, 41, 43, 45].map((b, i) => key(`#${b}`, i % 2 ? LINE : TACHON, CUT)),
  ...[34, 38, 40, 42, 44, 46].map((b) => key(`#${b}`, WIDE, CUT)),
  ...GOLPES.flatMap((t, n): ScoreEntry[] => [
    ...(n % 2 === 0 ? [at(t - 0.5, v('stampShot', { prompt: `golpe${n}`, dur: 0.95, bat: true, side: n % 4 ? 1 : -1 }))] : []),
    tap(
      t,
      { id: `golpe${n}`, lead: 0.5, anchor: 'canelo', label: n === 0 ? '¡BATEA!' : undefined },
      {
        great: [v('pose', { p: 'attack', dur: 0.5 }), v('batAway', { r: 'great', n }), v('crookedSeal', { n }), stain([0xff6a3d, 0x4ad0ff, 0xffd23a, 0x9dff6a, 0xff8ad8][n], 0.9)],
        hit: [v('pose', { p: 'attack', dur: 0.4 }), v('batAway', { r: 'hit', n })],
        miss: [v('pose', { p: 'flat', dur: 0.9 }), v('sello', { at: 'caneloHead', dur: 0.9 })],
      },
    ),
  ]),
  // the calliope: Canelo jumps on the left organ and bangs it out of tune
  key('#36', { 'cam.x': 560, 'cam.y': 520, 'cam.zoom': 1.35, 'cam.rot': -0.05 }, CUT),
  at('#36', v('organ', { prompt: 'organillo', beats: 9 })),
  mash(
    '#36',
    '#37:2',
    { id: 'organillo', need: [8, 18], lead: 0.5, label: '¡DESAFINA!', anchor: 'canelo' },
    {
      great: [v('cartel', { text: '¡PLUAAA!', at: [600, 260], size: 130, dur: 1.1, crooked: true }), v('impact', { dur: 0.07 }), stain(0x9dff6a, 1.3)],
      hit: [v('cartel', { text: '¡PLUA!', at: [600, 280], size: 100, dur: 0.9, crooked: true }), stain(0x9dff6a, 0.8)],
      miss: [v('cartel', { text: 'pli…', at: [600, 300], size: 80, dur: 0.8, plain: true })],
    },
  ),
  key('#37:2', WIDE, CUT),
  key('#37:2', { 'can.x': 760 }, CUT),
  choice(
    94.2,
    { id: 'cual2', fallback: 'right', lead: 0.5, label: '¿CUÁL?' },
    { left: [v('run', { side: -1, dur: 1.2 })], right: [v('run', { side: 1, dur: 1.2 })] },
  ),
  // this time the correcting glove grabs thin air
  at(95.4, v('correct', { prompt: 'cual2', dur: 1.2, miss: true })),
  at(96.0, v('megaStamp', { prompt: 'megasello', dur: 2.6 })),
  tap(
    'big_hit_5',
    { id: 'megasello', label: '¡AHÍ VIENE!', anchor: 'canelo' },
    {
      great: [v('impact', { dur: 0.08, invert: true }), v('cartel', { text: '¡TORCIDO!', at: [960, 230], size: 130, dur: 1.2, crooked: true }), stain(0xff6a3d, 1.4)],
      hit: [v('pose', { p: 'duck', dur: 0.7 })],
      miss: [v('pose', { p: 'flat', dur: 1.6 }), v('sello', { at: 'caneloHead', dur: 1.5 })],
    },
  ),
  key('#40:2', WIDE, CUT),
  ...KNOCK_T.map((t, n) =>
    tap(
      t,
      { id: `knock${n}`, lead: 0.5, anchor: 'canelo', label: n === 0 ? '¡DESCOMPÁS!' : undefined },
      {
        great: [v('knock', { n, r: 'great' }), v('cartel', { text: '¡BOING!', at: [960 + (n % 2 ? 420 : -420), 420], size: 100, dur: 0.8, crooked: true })],
        hit: [v('knock', { n, r: 'hit' })],
        miss: [v('pose', { p: 'dizzy', dur: 1 })],
      },
    ),
  ),
  // big_hit_6: ¡ORDEN! — everything snaps back into line
  at(ORDER_T, v('order', { dur: 1.2 }), v('impact', { dur: 0.08 }), v('cartel', { text: '¡ORDEN!', at: [960, 300], size: 160, dur: 1.3, seal: true })),
  key(ORDER_T, { ...WIDE, 'can.x': 960, crew: 0 }, CUT),

  // ================================================================ OUTRO — the weird final: perfect, perfect, perfect… crooked
  key('outro', { still: 1, pal: 'final' }, CUT),
  key('outro', { 'cam.x': 960, 'cam.y': 640, 'cam.zoom': 1.0, 'cam.rot': 0 }, { beats: 4, ease: 'inOut' }),
  ...CHORDS.slice(0, 3).flatMap((t, i): ScoreEntry[] => [
    // each chord swells ~0.5 s after its attack: the symmetry spreads with the swell, the grain and the stains go
    key(t, { sym: (i + 1) / 3, grain: [0.5, 0.2, 0][i], fade: (i + 1) / 3, film0: [0.6, 0.3, 0][i], film1: [0.6, 0.3, 0][i] }, { dur: 0.7, ease: 'out' }),
    at(t, v('swell', { dur: 2.2, i })),
  ]),
  key('final_chord_2', { 'cam.zoom': 1.12, 'cam.y': 660 }, { beats: 4, ease: 'inOut' }),
  key('final_chord_3', { canSym: 1, 'cam.zoom': 1.25, 'cam.y': 700 }, { beats: 3, ease: 'inOut' }),
  // the breath (0.29 s of silence): nothing moves at all
  at(BREATH, v('freeze', { dur: 0.29 })),
  tap(
    'final_chord_4',
    { id: 'ultimo', label: '¡AHORA!', anchor: 'center' },
    {
      great: [v('tearOpen', { r: 'great' }), v('impact', { dur: 0.08 }), v('cartel', { text: '¡RAS!', at: [960, 260], size: 150, dur: 1.4, crooked: true })],
      hit: [v('tearOpen', { r: 'hit' }), v('cartel', { text: '¡RAS!', at: [960, 270], size: 120, dur: 1.2, crooked: true })],
      miss: [v('tearOpen', { r: 'miss' }), v('cartel', { text: 'ras…', at: [960, 290], size: 90, dur: 1.2, plain: true })],
    },
  ),
  key('final_chord_4', { sym: 0, canSym: 0, 'cam.rot': 0.035, film0: 0, film1: 0 }, CUT),
  key(123.0, { slip: 0.12 }, { dur: 0.25, ease: 'in' }),
  key(123.25, { slip: 0.0 }, { dur: 0.35, ease: 'outBack' }),
  at(123.1, v('grade', { dur: 1.9 })),

  // ================================================================ everywhere: with no sound the frame keeps the beat
  on({ beats: { in: [0, 115.2] } }, 'beat'),
];

export const CIRCUS_MALUS: MomentoDef = {
  id: 'circus_malus',
  track: 'circus_malus',
  title: 'CIRCUS MALUS',
  mission: 'H62',
  // THE WHOLE SONG; the cut is its end marker (the chord's tail has died, the file is silent from 124.84)
  cut: 'end',
  tail: 'release',
  palettes: { verse: 'malus', chorus: 'malus', break: 'malus', verse2: 'malus', build: 'malus', chorus2: 'plan', outro: 'final' },
  score,
  stage: () => import('./stage').then((m) => m.default as unknown as (h: unknown) => unknown),
  unlocks: ['circus_malus'],
  source: 'El Umbral',
};
