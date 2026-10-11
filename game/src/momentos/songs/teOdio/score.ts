/**
 * te ODIO — the choreography (H55 · Los Disruptores, the switch into their glitch phase), THE WHOLE SONG (214 s).
 * Song time; 120 BPM, a bar is 2.000 s, '#n' = bar n (= 2n s). Full sheet: docs/part-ii/29 §17.
 *
 * Style: «GRAFITI Y SEÑAL ROTA». Two arts fight over the same world — the box's clean COMIC (panels, Ben-Day, black
 * line) and the Disruptores' STREET spray (stencils, tags, torn posters, overspray, drips) — and when the song's filter
 * closes, everything degrades into a BROKEN TRANSMISSION seen through a crack, then reassembles.
 *
 * Every sound has a purpose (the stage reads the onset tracks every frame): each KICK is a spray burst from la Lata's
 * cannons + a camera punch + the hulls dip; the 808 makes the wall breathe and its low notes hit like wall impacts
 * (shake + chroma); CLAPS splat paint on the wall (and leave tags in the verse); HATS are spray mist; the MELODY makes
 * the tags glow / the comic stars twinkle; the VOICE makes Brecha shout along and spells TE ODIO on the hooks.
 *
 *  intro      the battle's frozen frame is a pane of glass: Grafitera tags it on the hats · ¡RASGA! tears it off
 *  chorus     la Lata de Pintura, Brecha hanging from her spray-can mast · posters of the crew · TE ODIO on the hook
 *  verse      the duel of two arts (the front between the ships): paint cans batted back on the claps · the comic page
 *             gets torn · NEON TAG! against the lantern (hold) · Grafitera tosses Canelo a can
 *  chorus2    the four STOPS are stencil slams: we spray their grievance with them (box · hand · cat in a box · open door)
 *  verse2     Brecha boards us (BOX BREAKER!): paw vs crowbar inside the box's panel grid · dodge · shove · a war of posters
 *  chorus3    the hand of light redraws everything clean, its eraser after our tags · the box closes in · ¡Y SUELTA!
 *  climax     everything at once: the duel in close-ups, panels breaking and redrawn, the crowbar into the box's edge
 *  break      the filter closes: through a crack, a broken tape — a little world, a hand that draws a box around it
 *  build      four on the floor: every kick pries the crack wider · ¡SINTONIZA! · ¿ABRIR? · ¡ROMPE!
 *  drop       reassembled: the RIFTS open (windows of the other art): what crosses changes owner
 *  outro      four stencil slams, the grade — hard cut into the glitch phase
 */
import type { MomentoDef, ScoreEntry } from '../../types';
import { at, choice, hold, key, mash, on, tap, v } from '../../score';
import { FLUO } from './spray';

/** paint cans thrown at us: flams on beat 3 and the backbeat claps (measured accents, drums stem) */
export const BOMBS = [7.5, 17.0, 23.5, 27.0, 31.5, 34.25, 47.25, 50.25];
/** chorus2: the stops — the 808 drops out (≈ x.75) and comes back with the kick (x.5): spray through the plate */
export const STOPS = [54.5, 58.5, 62.5, 66.5];
const STOP_IMG = ['box', 'hand', 'catbox', 'open'] as const;
const STOP_WORD = ['NO ABRIR', '¿QUIÉN DECIDE?', 'NADIE PREGUNTÓ', '¡ABRAN!'];
const STOP_EXTRA = ['¿POR QUÉ?', 'SUÉLTALA', 'TE ODIO', 'LIBRES'];
const STOP_COL = [FLUO.pink, FLUO.cyan, FLUO.green, FLUO.orange];
/** verse2: paw vs crowbar on the backbeat claps and the big flam */
export const CLASHES = [71.0, 75.0, 77.0, 79.5, 81.0, 85.0];
/** chorus3: our tags against the eraser, on the voice's strongest syllables */
export const TAGS = [103.25, 107.25, 111.25, 116.75, 119.25, 121.25];
const TAG_WORD = ['¡NO!', 'ES NUESTRA', 'DÉJALA', 'TE ODIO', 'LIBRE', '¡ABRAN!'];
const TAG_AT: [number, number][] = [
  [520, 300],
  [1380, 360],
  [700, 640],
  [1250, 700],
  [560, 420],
  [1300, 300],
];
/** climax: the duel in close-ups, on the strongest accents */
export const DUELS = [135.5, 139.0, 143.5, 147.0, 151.5, 159.5];
/** break: optional — tune the broken tape on the «te odio» chops */
export const TUNES = [167.5, 171.5, 175.5];
/** build: tune it in on the four-on-the-floor kicks */
export const SIGNALS = [184.0, 186.0, 188.0, 190.0];
/** drop: shots through the rifts, on the backbeat kicks */
export const RIFTS = [203.0, 205.0, 207.0, 209.0];

const WIDE = { 'cam.x': 960, 'cam.y': 480, 'cam.zoom': 1.06, 'cam.rot': 0 };
const ON_LATA = { 'cam.x': 1330, 'cam.y': 470, 'cam.zoom': 1.3, 'cam.rot': -0.03 };
const ON_US = { 'cam.x': 640, 'cam.y': 540, 'cam.zoom': 1.3, 'cam.rot': 0.03 };
const ON_BRECHA = { 'cam.x': 1420, 'cam.y': 360, 'cam.zoom': 1.6, 'cam.rot': 0.05 };

const score: ScoreEntry[] = [
  // ================================================================ INTRO — the pane of glass
  key(0, { style: 0, pal: 'tvoid', ...WIDE }),
  at(0, v('coldOpen', { dur: 4.1 })),
  tap(
    'first_drop',
    { id: 'rasga', label: '¡RASGA!' },
    {
      great: [v('rip', { r: 'great' }), v('slam', { dur: 0.08, color: 'accent' }), v('tag', { text: '¡RAAAS!', kind: 'tag', size: 190, x: 960, y: 420, dur: 0.9, color: 'accent2' }), v('glitch', { dur: 0.25, amount: 0.7 })],
      hit: [v('rip', { r: 'hit' }), v('tag', { text: '¡RAS!', kind: 'tag', size: 150, x: 960, y: 420, dur: 0.8, color: 'accent2' })],
      miss: [v('rip', { r: 'miss' }), v('tag', { text: 'rip…', kind: 'marker', size: 90, x: 1300, y: 300, dur: 0.8, color: 0xffffff })],
    },
  ),
  key('first_drop', { style: 1, pal: 'street' }, { dur: 0.01 }),

  // ================================================================ CHORUS — la Lata de Pintura, the crew, TE ODIO
  key('first_drop', { 'cam.x': 1100, 'cam.y': 480, 'cam.zoom': 1.05 }, { dur: 0.01 }),
  key(4.05, WIDE, { beats: 3, ease: 'out' }),
  at(4.0, v('spray', { at: 'shipB', n: 40, spread: 260, dur: 0.7, color: 'accent' }), v('punch', { z: 0.06, dur: 0.3 })),
  at(4.5, v('poster', { who: 'brecha', title: 'BRECHA', sub: 'ROMPECAJAS', side: 'right', x: 1420, y: 520, beats: 3.5, color: FLUO.pink })),
  key('#3', ON_BRECHA, { beats: 2, ease: 'expoOut' }),
  at('#3', v('pose', { who: 'brecha', p: 'hang', beats: 4 }), v('tag', { text: '¡EY!', kind: 'tag', size: 120, at: 'brecha', dur: 0.8, color: 'accent' })),
  key('#3:3', ON_US, { dur: 0.25, ease: 'expoOut' }),
  // the cans start flying (the first two in the chorus)
  ...BOMBS.flatMap((t, i): ScoreEntry[] => [
    at(t, v('bomb', { i, prompt: `lata${i}`, flight: 1 })),
    tap(t, { id: `lata${i}`, lead: 0.5, anchor: 'canelo', label: i === 0 ? '¡BATEA!' : undefined }, { great: [v('bat', { great: true, i })], hit: [v('bat', { great: false, i })], miss: [v('splatHit', { i })] }),
  ]),
  at('#4', v('poster', { who: 'grafitera', title: 'GRAFITERA', sub: 'NEON TAG!', side: 'left', x: 470, y: 520, beats: 3.5, color: FLUO.green })),
  key('#4', WIDE, { beats: 2, ease: 'inOut' }),
  at('#5', v('poster', { who: 'hueco', title: 'HUECO', side: 'left', x: 420, y: 540, h: 620, beats: 3, color: FLUO.violet })),
  at('#5:2', v('poster', { who: 'ecomudo', title: 'ECO MUDO', side: 'right', x: 1480, y: 540, h: 620, beats: 3, color: 0xd8d8e0 }), v('glitch', { dur: 0.3, amount: 0.6 })),
  key('#6', { 'cam.x': 1000, 'cam.y': 470, 'cam.zoom': 1.0 }, { beats: 4, ease: 'inOut' }),
  // the hook: TE ODIO sprayed letter by letter on the voice (13.45–14.5), then again, bigger (15.7–16.55)
  at(13.45, v('tag', { text: 'TE ODIO', kind: 'tag', size: 220, x: 900, y: 300, reveal: 1.0, dur: 2.2, color: 'accent', rot: -0.08 }), v('pose', { who: 'brecha', p: 'shout', dur: 1.1 })),
  at(15.7, v('tag', { text: 'TE ODIO', kind: 'stencil', size: 260, x: 1060, y: 640, reveal: 0.8, dur: 2.0, color: FLUO.green, halo: FLUO.green }), v('slam', { dur: 0.07, color: 'accent2' })),
  at(18.75, v('pose', { who: 'brecha', p: 'shout', dur: 1.2 }), v('tag', { text: '¡JA!', kind: 'tag', size: 110, at: 'brecha', dur: 0.7, color: 'accent' })),
  key('#9', ON_LATA, { beats: 4, ease: 'inOut' }),

  // ================================================================ VERSE — the duel of two arts
  // the box answers: our half snaps back into a clean comic (the front between the ships)
  key('verse', { style: 0.5, ...WIDE, 'cam.zoom': 0.98 }, { dur: 0.3, ease: 'expoOut' }),
  at('verse', v('pow', { text: '¡ZAP!', x: 520, y: 330, size: 110, dur: 0.6 }), v('whip', { dx: -380, dur: 0.22 })),
  // claps leave tags on the street wall (persistent)
  on({ onsets: { track: 'snare', in: ['verse', 'chorus2'], min: 0.72, minGap: 2.4, limit: 9, except: BOMBS } }, 'wallTag'),
  key(23.6, ON_US, { dur: 0.3, ease: 'expoOut' }),
  key(24.2, WIDE, { beats: 3, ease: 'inOut' }),
  key(27.1, { 'cam.x': 760, 'cam.y': 520, 'cam.zoom': 1.15, 'cam.rot': 0.04 }, { dur: 0.25, ease: 'expoOut' }),
  // the box's comic page: our crew in panels — a tag tears across it on the clap
  at('#14', v('comicPage', { beats: 4.8, tear: 1.0, tag: 'SIN CAJAS', cells: [{ who: 'canelo', cap: '¿QUIÉNES SON?', emote: 'surprise' }, { who: 'luzterna', emote: 'hurt' }, { who: 'brecha', art: 'street', cap: '¡HOLA!', emote: 'happy', flip: true }] })),
  key(30.4, WIDE, { dur: 0.01 }),
  key(31.6, ON_LATA, { dur: 0.25, ease: 'expoOut' }),
  key(32.4, WIDE, { beats: 3, ease: 'inOut' }),
  // NEON TAG!: Grafitera paints a giant tag at us; Luzterna's lantern against it (HOLD)
  key('#18', { 'cam.x': 1250, 'cam.y': 440, 'cam.zoom': 1.35, 'cam.rot': -0.04 }, { beats: 2, ease: 'inOut' }),
  at('big_hit_3', v('tag', { text: 'NEON TAG!', kind: 'tag', size: 200, x: 1180, y: 260, dur: 1.4, color: 'accent2' }), v('slam', { dur: 0.08, color: 'accent2' }), v('neonTag', { prompt: 'escudo', dur: 6.5 })),
  key('#19:2', { 'cam.x': 900, 'cam.y': 480, 'cam.zoom': 0.95, 'cam.rot': 0 }, { beats: 4, ease: 'inOut' }),
  hold('#20', '#22', { id: 'escudo', label: '¡ESCUDO!', anchor: 'luzterna' }, { great: [v('shield', { r: 'great' })], hit: [v('shield', { r: 'hit' })], miss: [v('shield', { r: 'miss' })] }),
  key('#21', ON_US, { beats: 4, ease: 'in' }),
  key('#22', WIDE, { dur: 0.3, ease: 'expoOut' }),
  // Eco Mudo crackles: the first taste of the broken signal
  // (a close-up: his face through the static)
  at('#22:2', v('face', { who: 'ecomudo', art: 'street', light: 0xd8d8e0, head: 620, x: 1060, dur: 0.95, bg: 0x1c1a21, flip: true, look: -0.3 }), v('glitch', { dur: 0.9, amount: 0.8, block: 0.5 }), v('tag', { text: 'KSSHH', kind: 'glitch', size: 150, x: 1380, y: 250, dur: 0.9, color: 0xd8d8e0, rot: -0.06 })),
  key('#23', WIDE, { beats: 2, ease: 'inOut' }),
  // Grafitera tosses Canelo a can of his own
  at(51.0, v('bomb', { i: 1, flight: 0.9, catch: true }), v('tag', { text: '¿PINTAS?', kind: 'marker', size: 100, at: 'grafitera', dur: 1.0, color: 'accent2' })),
  at(51.9, v('pose', { who: 'canelo', p: 'cheer', dur: 0.6 })),

  // ================================================================ CHORUS2 — the stops are stencil slams
  key('chorus2', { style: 1, pal: 'stencil', ...WIDE }, { dur: 0.4, ease: 'inOut' }),
  at('chorus2', v('spray', { at: [960, 540], n: 60, spread: 700, dur: 0.6, color: 'accent' })),
  ...STOPS.flatMap((t, i): ScoreEntry[] => [
    at(t - 2.5, v('pose', { who: 'canelo', p: 'spray', dur: 1.7 }), v('pose', { who: 'grafitera', p: 'spray', dur: 1.7 })),
    key(t - 2.5, i % 2 ? { 'cam.x': 1200, 'cam.y': 460, 'cam.zoom': 1.2, 'cam.rot': -0.03 } : { 'cam.x': 720, 'cam.y': 500, 'cam.zoom': 1.2, 'cam.rot': 0.03 }, { dur: 0.01 }),
    key(t - 2.49, { 'cam.zoom': 1.05, 'cam.rot': 0 }, { dur: 1.7, ease: 'out' }),
    at(t - 0.75, v('freeze', { dur: 0.75 }), v('plate', { img: STOP_IMG[i], dur: 0.76 })),
    tap(
      t,
      { id: `plantilla${i}`, label: i === 0 ? '¡PINTA!' : undefined },
      {
        great: [v('stencilShot', { img: STOP_IMG[i], word: STOP_WORD[i], extra: STOP_EXTRA[i], r: 'great', color: STOP_COL[i], dur: 1.5 }), v('slam', { dur: 0.08, mid: STOP_COL[i] })],
        hit: [v('stencilShot', { img: STOP_IMG[i], word: STOP_WORD[i], r: 'hit', color: STOP_COL[i], dur: 1.5 })],
        miss: [v('stencilShot', { img: STOP_IMG[i], word: STOP_WORD[i], r: 'miss', color: STOP_COL[i], dur: 1.35 })],
      },
    ),
  ]),

  // ================================================================ VERSE2 — Brecha boards us
  key('verse2', { pal: 'night', style: 0.24, grid: 1, 'art.brecha': 'street', ...WIDE }, { dur: 0.3, ease: 'expoOut' }),
  at('verse2', v('poster', { who: 'brecha', title: 'BOX BREAKER!', side: 'right', x: 1400, y: 520, beats: 3, color: FLUO.pink }), v('slam', { dur: 0.08, color: 'accent' })),
  at(69.5, v('leapOver', { dur: 1.0 }), v('tag', { text: '¡AHÍ VOY!', kind: 'tag', size: 110, at: 'brecha', dur: 0.8, color: 'accent' })),
  key(70.5, { brecha: 'ours' }),
  key(70.5, { 'cam.x': 770, 'cam.y': 520, 'cam.zoom': 1.35, 'cam.rot': 0.04 }, { dur: 0.2, ease: 'expoOut' }),
  // she breaks the box's panel borders on the kicks
  ...[
    [72.0, 0],
    [76.75, 1],
    [82.5, 2],
  ].map(([t, i]) => at(t, v('gridBreak', { i }))),
  ...CLASHES.flatMap((t, i): ScoreEntry[] => [
    tap(t, { id: `choque${i}`, anchor: 'canelo', label: i === 0 ? '¡PARA!' : undefined }, { great: [v('clash', { win: true })], hit: [v('clash', { win: true, small: true })], miss: [v('clash', { win: false })] }),
    key(t + 0.5, i % 2 ? { 'cam.x': 800, 'cam.y': 500, 'cam.zoom': 1.45, 'cam.rot': -0.06 } : { 'cam.x': 740, 'cam.y': 540, 'cam.zoom': 1.25, 'cam.rot': 0.05 }, { dur: 0.2, ease: 'expoOut' }),
  ]),
  choice('#44', { id: 'esquiva', fallback: 'left' }, { left: [v('dodge', { side: 'left' })], right: [v('dodge', { side: 'right' })] }),
  key('#43:2', { 'cam.x': 760, 'cam.y': 520, 'cam.zoom': 1.2, 'cam.rot': 0 }, { beats: 2, ease: 'inOut' }),
  at('#44', v('tag', { text: 'BOX BREAKER!', kind: 'stencil', size: 150, x: 1100, y: 250, dur: 1.2, color: FLUO.pink, halo: FLUO.pink })),
  mash('#46', '#48', { id: 'empuja', need: [10, 20], label: '¡EMPUJA!', anchor: 'canelo' }, { great: [v('shove', { r: 'great' })], hit: [v('shove', { r: 'hit' })], miss: [v('shove', { r: 'miss' })] }),
  at('#46', v('pushLive', { prompt: 'empuja', beats: 8 })),
  key('#46', { 'cam.x': 790, 'cam.y': 470, 'cam.zoom': 1.55, 'cam.rot': 0.03 }, { beats: 8, ease: 'in' }),
  key('#48', { brecha: 'hang', ...WIDE }),
  // the war of posters: their argument, slapped one over the other on the kicks
  at('#48', v('poster', { who: 'luzterna', title: 'SE DERRAMA', art: 'comic', side: 'left', x: 560, y: 540, beats: 8, color: 0x2ec4e8, off: 'cut' })),
  at('#48:2', v('poster', { who: 'brecha', title: 'QUE RESPIRE', side: 'right', x: 1360, y: 520, beats: 6, color: FLUO.pink, off: 'cut' })),
  at('#49', v('poster', { who: 'luzterna', title: 'MIS GATOS', art: 'comic', side: 'left', x: 700, y: 560, rot: 0.06, beats: 4, color: 0xe8368f, off: 'cut' })),
  at('#49:2', v('poster', { who: 'brecha', title: '¿QUIÉN DECIDE?', side: 'right', x: 1220, y: 540, rot: -0.07, beats: 2, color: FLUO.orange, off: 'cut' })),

  // ================================================================ CHORUS3 — the hand of light redraws everything
  key('chorus3', { pal: 'hand', grid: 1, 'art.brecha': 'auto', ...WIDE }, { dur: 0.3 }),
  at('chorus3', v('handDraw', { beats: 6, x0: 2100, y0: 560, x1: -200, y1: 860, s: 1.0 }), v('slam', { dur: 0.08, mid: 0xbcd6ff })),
  key('chorus3', { style: 0 }, { beats: 6, ease: 'inOut' }),
  ...[100.6, 101.2, 101.8].map((t, i) => at(t, v('gridFix', { i }))),
  ...TAGS.flatMap((t, i): ScoreEntry[] => [
    tap(t, { id: `tag${i}`, anchor: TAG_AT[i], label: i === 0 ? '¡TAGUEA!' : undefined }, { great: [v('eraseTag', { r: 'great', word: TAG_WORD[i], at: TAG_AT[i], color: [FLUO.pink, FLUO.green, FLUO.orange][i % 3] })], hit: [v('eraseTag', { r: 'hit', word: TAG_WORD[i], at: TAG_AT[i], color: [FLUO.pink, FLUO.green, FLUO.orange][i % 3] })], miss: [v('eraseTag', { r: 'miss', word: TAG_WORD[i], at: TAG_AT[i], color: [FLUO.pink, FLUO.green, FLUO.orange][i % 3] })] }),
    at(t + 0.35, v('handDraw', { dur: 1.0, x0: TAG_AT[i][0] + 520, y0: TAG_AT[i][1] + 40, x1: TAG_AT[i][0] - 420, y1: TAG_AT[i][1] + 120, s: 0.7 })),
  ]),
  at(104.0, v('pose', { who: 'brecha', p: 'shout', beats: 3 })),
  // between our tags the hand keeps sweeping, redrawing the world clean
  at(108.5, v('handDraw', { beats: 4, x0: -200, y0: 900, x1: 2100, y1: 640, s: 0.9 })),
  at(113.0, v('handDraw', { beats: 3, x0: 2100, y0: 820, x1: 300, y1: 980, s: 1.1 })),
  key(105.0, ON_LATA, { beats: 4, ease: 'inOut' }),
  key(109.0, WIDE, { beats: 4, ease: 'inOut' }),
  at(112.5, v('pose', { who: 'grafitera', p: 'spray', beats: 4 })),
  key(113.0, ON_US, { beats: 4, ease: 'inOut' }),
  key(117.5, WIDE, { beats: 4, ease: 'inOut' }),
  // the faces under the light (the voice's longest phrase)
  at(123.0, v('face', { who: 'brecha', art: 'street', light: 0xbcd6ff, head: 600, beats: 4, look: 0.3, flip: true })),
  at(125.0, v('face', { who: 'luzterna', art: 'comic', light: 0xbcd6ff, head: 520, beats: 2.5, bg: 0x14213a })),
  at(126.25, v('face', { who: 'canelo', art: 'comic', light: 0xbcd6ff, head: 560, beats: 3.5, bg: 0x14213a })),
  // the box closes in on everyone; Brecha's crowbar (HOLD and RELEASE into the climax)
  at('predrop_dip', v('boxClose', { beats: 8 }), v('handDraw', { beats: 8, x0: 1800, y0: 160, x1: 1500, y1: 200, s: 1.2 })),
  key('predrop_dip', { ...WIDE, 'cam.zoom': 1.0 }, { beats: 8, ease: 'in' }),
  hold('predrop_dip', 'climax', { id: 'palanca', release: true, label: '¡Y SUELTA!', anchor: 'brecha' }, { great: [v('crowbar', { power: 1.2 })], hit: [v('crowbar', { power: 0.9 })], miss: [v('crowbar', { power: 0.6, clumsy: true })] }),
  at('predrop_dip', v('pose', { who: 'brecha', p: 'brace', beats: 8 })),

  // ================================================================ CLIMAX — everything at once
  key('climax', { pal: 'riot', style: 1, grid: 1, burst: 1.6, ...WIDE, 'cam.zoom': 1.05 }, { dur: 0.01 }),
  // Brecha everywhere: she leaps between the ships on the phrase turns, fighting on our deck in between
  ...[132.5, 141.0, 149.0].flatMap((t): ScoreEntry[] => [at(t, v('leapOver', { dur: 0.9 }), v('tag', { text: '¡VOY!', kind: 'tag', size: 100, at: 'brecha', dur: 0.6, color: 'accent' })), key(t + 0.9, { brecha: 'ours' })]),
  ...[137.25, 145.25, 155.0].flatMap((t): ScoreEntry[] => [at(t, v('leapOver', { back: true, dur: 0.8 })), key(t + 0.8, { brecha: 'deck' })]),
  on({ onsets: { track: 'kick', in: [133.5, 137.0], min: 0.6, minGap: 0.9, except: DUELS } }, v('clash', { win: true, small: true })),
  on({ onsets: { track: 'kick', in: [142.0, 145.0], min: 0.6, minGap: 0.9, except: DUELS } }, v('clash', { win: true, small: true })),
  // the camera never rests: a new angle every bar
  ...Array.from({ length: 13 }, (_, i) => key(`#${66 + i}:0.1`, [ON_US, ON_LATA, { 'cam.x': 960, 'cam.y': 420, 'cam.zoom': 1.2, 'cam.rot': -0.07 }, ON_BRECHA, { 'cam.x': 820, 'cam.y': 560, 'cam.zoom': 1.45, 'cam.rot': 0.08 }][i % 5], { beats: 0.5, ease: 'expoOut' })),
  // Grafitera's second NEON TAG across the sky, the hand redrawing behind it
  at(140.0, v('neonTag', { prompt: 'none', dur: 4 }), v('tag', { text: 'NEON TAG!', kind: 'tag', size: 170, x: 1300, y: 220, dur: 1.2, color: 'accent2' })),
  at(144.0, v('handDraw', { beats: 6, x0: 2100, y0: 700, x1: -200, y1: 940, s: 1.0 })),
  ...[132.0, 133.0, 134.0].map((t, i) => at(t, v('gridBreak', { i }))),
  ...DUELS.flatMap((t, i): ScoreEntry[] => [
    at(t, v('duel', { prompt: `duelo${i}`, dur: 0.9 })),
    tap(t, { id: `duelo${i}`, anchor: [960, 860], label: i === 0 ? '¡CHOQUE!' : undefined }, { great: [v('slam', { dur: 0.07, color: i % 2 ? 'accent' : 'accent2' }), v('pow', { text: ['¡KLANG!', '¡CLANK!', '¡ZAS!'][i % 3], x: 960, y: 260, size: 110, dur: 0.6 })], hit: [v('pow', { text: 'tink', x: 960, y: 260, size: 70, dur: 0.45, fill: 0xfff6e6 })], miss: [v('tag', { text: '¡AUCH!', kind: 'tag', size: 120, x: 960, y: 260, dur: 0.6, color: 'accent' })] }),
    key(t + 0.9, i % 2 ? { 'cam.x': 1250, 'cam.y': 460, 'cam.zoom': 1.3, 'cam.rot': -0.06 } : { 'cam.x': 680, 'cam.y': 520, 'cam.zoom': 1.3, 'cam.rot': 0.06 }, { dur: 0.01 }),
    key(t + 0.91, { 'cam.zoom': 1.08, 'cam.rot': 0 }, { beats: 2, ease: 'out' }),
  ]),
  // the hand keeps redrawing the borders, she keeps breaking them (melody vs kicks)
  ...[137.0, 141.0, 145.0, 149.0].map((t, i) => at(t, v('gridFix', { i: i % 3 }))),
  ...[138.0, 142.0, 146.0, 150.0].map((t, i) => at(t, v('gridBreak', { i: i % 3 }))),
  on({ onsets: { track: 'snare', in: ['climax', 'break'], min: 0.6, minGap: 1.2, except: DUELS } }, v('spray', { at: 'shipB', n: 18, spread: 140, dur: 0.4, color: 'accent2' })),
  // the posters of their anger, on the voice
  at(152.0, v('poster', { who: 'brecha', title: 'TE ODIO', side: 'left', x: 520, y: 520, beats: 4, color: FLUO.pink })),
  at(154.0, v('poster', { who: 'grafitera', title: '¡FUERA!', side: 'right', x: 1400, y: 520, beats: 3, color: FLUO.green })),
  at(156.0, v('poster', { who: 'ecomudo', title: '…', side: 'left', x: 760, y: 560, h: 600, beats: 2, color: 0xd8d8e0 }), v('glitch', { dur: 0.5, amount: 0.7 })),
  // the crowbar into the box's very edge
  // the crowbar into the box's very wall: a hairline… ¡CRAC! — and through it, from here to the drop, a broken tape
  at('#80', v('crack', { dur: 42, burst: 196.0, hand: 7.5, box: 10, stamp: 13.5, cat: 15.5 })),
  key('#80', { crack: 0 }),
  key(162.0, { crack: 0.3 }, { dur: 0.15, ease: 'outBack' }),
  at(162.0, v('slam', { dur: 0.08, color: 'accent' }), v('tag', { text: '¡CRAC!', kind: 'stencil', size: 220, x: 960, y: 420, dur: 1.0, color: FLUO.pink, halo: FLUO.pink }), v('glitch', { dur: 1.8, amount: 0.8 })),

  // ================================================================ BREAK — through the crack: a broken transmission
  key('break', { pal: 'signal', sig: 0.35, phos: 0.35, grid: 0 }, { dur: 0.3 }),
  key('break', { crack: 0.42 }, { beats: 32, ease: 'linear' }),
  // the voice's chops: TE ODIO through the static
  // (during the close-ups the chop drops under the chin: never across a face)
  ...(
    [
      [164, 169, false],
      [169, 170.9, true],
      [170.9, 191, false],
      [191, 192.6, true],
      [192.6, 202, false],
    ] as [number, number, boolean][]
  ).map(([a, b, low]) =>
    on({ onsets: { track: 'vox', in: [a, b], min: 0.95, minGap: 1.5 } }, v('tag', { text: 'TE ODIO', kind: 'glitch', size: low ? 110 : 150, x: 960, y: low ? 990 : 220, scatter: low ? 120 : 300, dur: 0.55, color: 0x9effd9 }), v('glitch', { dur: 0.3, amount: 0.6, block: 0.4 })),
  ),
  ...TUNES.map((t, i) => tap(t, { id: `sintonia${i}`, optional: true, anchor: [960, 900] }, { great: [v('tune', { dur: 1.2 })], hit: [v('tune', { dur: 0.8 })] })),
  at(169.0, v('face', { who: 'luzterna', art: 'comic', light: 0x9effd9, head: 520, dur: 1.8, bg: 0x061410, look: 0.4 })),
  at(178.0, v('face', { who: 'brecha', art: 'street', light: 0x9effd9, head: 560, dur: 1.8, bg: 0x061410, flip: true })),

  // ================================================================ BUILD — every kick pries it wider
  key('build', { pal: 'build', sig: 0.25, phos: 0.2 }, { dur: 0.3 }),
  ...SIGNALS.map((t, i) => tap(t, { id: `senal${i}`, anchor: [960, 900], label: i === 0 ? '¡SINTONIZA!' : undefined }, { great: [v('tune', { dur: 1.4 })], hit: [v('tune', { dur: 0.9 })], miss: [v('glitch', { dur: 0.5, amount: 1 })] })),
  at(191.0, v('face', { who: 'canelo', art: 'comic', light: 0xffc28a, head: 560, dur: 1.5, bg: 0x0b0716 })),
  choice('filter_open', { id: 'abrir', fallback: 'right', label: '¿ABRIR?' }, { left: [v('open', { side: 'left' })], right: [v('open', { side: 'right' })] }),
  key('filter_open', { sig: 0.1, phos: 0 }, { beats: 4 }),
  at('filter_open', v('glitch', { dur: 0.6, amount: 1, block: 0.9 })),
  hold('big_hit_5', 'final_drop', { id: 'quiebre', release: true, label: '¡ROMPE!' }, { great: [v('shatter', { power: 1.2 })], hit: [v('shatter', { power: 0.9 })], miss: [v('shatter', { power: 0.6, clumsy: true })] }),

  // ================================================================ DROP — reassembled: the rifts
  key('final_drop', { pal: 'fusion', sig: 0, style: 1, grid: 0, brecha: 'hang', burst: 1.2, ...WIDE }, { dur: 0.01 }),
  key('final_drop', { rifts: 1 }, { beats: 1, ease: 'outBack' }),
  at('final_drop', v('riftRing', { which: 'A', dur: 0.6 }), v('riftRing', { which: 'B', dur: 0.6 }, { beats: 0.5 }), v('tag', { text: '¡GRIETAS!', kind: 'stencil', size: 170, x: 960, y: 200, dur: 1.0, color: FLUO.green, halo: FLUO.green })),
  ...RIFTS.flatMap((t, i): ScoreEntry[] => [
    tap(t, { id: `grieta${i}`, anchor: 'riftARim', label: i === 0 ? '¡DISPARA!' : undefined }, { great: [v('riftShot', { r: 'great', i })], hit: [v('riftShot', { r: 'hit', i })], miss: [v('riftShot', { r: 'miss', i })] }),
    key(t + 0.1, i % 2 ? { 'cam.x': 1100, 'cam.y': 480, 'cam.zoom': 1.12, 'cam.rot': -0.04 } : { 'cam.x': 860, 'cam.y': 500, 'cam.zoom': 1.12, 'cam.rot': 0.04 }, { dur: 0.2, ease: 'expoOut' }),
  ]),
  at(210.0, v('hero', { dur: 2.0 })),

  // ================================================================ OUTRO — four stencil slams, the grade, the cut
  ...[
    ['brecha', 'street', true],
    ['grafitera', 'street', true],
    ['canelo', 'comic', false],
    ['luzterna', 'comic', false],
  ].map(([who, art, flip], i) => at(212 + i * 0.5, v('face', { who, art, flip, head: 640, dur: 0.5, bg: 0x1c1a21, light: STOP_COL[i] }), v('slam', { dur: 0.1, mid: STOP_COL[i] }))),
  at(212.0, v('grade', { dur: 2.1 })),

  // ================================================================ everywhere: with no sound the frame keeps the beat
  on({ beats: { in: [0, 213.9] } }, 'beat'),
];

export const TE_ODIO: MomentoDef = {
  id: 'te_odio',
  track: 'te_odio',
  title: 'te ODIO',
  mission: 'H55',
  // the switch into the Disruptores' glitch phase (BattleScene: momentoForFase → runBattleMomento)
  battle: { id: 'ruptura_disruptores', fase: 'glitch' },
  // THE WHOLE SONG; the cut is its last hit's tail
  cut: 214.0,
  // the battle music (te ODIO remix, its glitch state) takes the next bar
  tail: 'keep',
  score,
  stage: () => import('./stage').then((m) => m.default as unknown as (h: unknown) => unknown),
  unlocks: ['te_odio'],
  source: 'Los Disruptores',
};
