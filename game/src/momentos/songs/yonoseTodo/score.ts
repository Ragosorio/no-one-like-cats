/**
 * YONOSE TODO — the choreography of the Parte II finale (H64 «Mentira» → H65 «Continuará»), THE WHOLE SONG (0 → 208.6).
 * Style «ANIMATIC»: a pencil storyboard that warms into watercolor and ends in the game's own paint (docs/part-ii/29 §18).
 *
 * The stage reacts to every onset all the time (stage.ts): each 808 kick redraws the drawing (the line «boils» on the
 * kick), punches the camera and bobs the cats; each accent ticks the timing strip and twinkles a star / flecks paint;
 * each bass note swells the sea by its pitch and breathes the sky wash; each keys note draws a star, a letter or a breath.
 * The score adds the story:
 *
 *  intro      the game's frame un-paints into a pencil sketch · the night draws itself, one star per keys note ·
 *             the page waits by the faro · TAP: Luzterna's lantern, the first speck of color
 *  verse      every cat of the island hops in on the kicks · «¿Qué vas a escribir?» · THREE THUMBNAILS (the save's
 *             cosmetic choice) · the pencil comes down
 *  bridge     before it touches the paper, Canelo climbs on: TAP his three turns · he lies down (H64's point of no return)
 *  break      the pencil can't write under him · Luzterna pokes him · naked keys: «nobody can write under a sleeping
 *             cat» · HOLD: his warmth spreads as watercolor… and let go ON the chorus hit
 *  chorus     the color floods the island · his dream rises into the sky as storyboard panels (TAP: each lights up)
 *  break2     the color recedes · far away, a hand of light writes on the page's margin, one letter per keys note
 *  prechorus  the cats open one eye per bass note · HOLD: they breathe in…
 *  climax     …«MENTIRA.» ON the hit — and the credits ride the climax as watercolor pages (TAP: paint)
 *  outro      dawn: the watercolor dries into the game's own paint; Canelo still asleep on the page
 *  fade_tail  REGISTRO 000's card on the tick-tock: «observando» struck, «despertando» written, CONTINUARÁ
 */
import type { EditSegment, MomentoDef, ScoreEntry } from '../../types';
import { at, hold, key, on, tap, v } from '../../score';
import { ARRIVE, ASLEEP_T, BIG1, CALOR, CREDITS, CUT, FAROL, GATOS, MENTIRA_HOLD, MENTIRA_T, P, PICA, PICK, PINTA, RESUME, SEC, SUENOS, VUELTAS, bar } from './times';

/** camera framings (world px) */
const WIDE = { 'cam.x': 960, 'cam.y': 540, 'cam.zoom': 1 };
const FARO = { 'cam.x': 840, 'cam.y': 470, 'cam.zoom': 1.18 };
const PAGE = { 'cam.x': P.page[0] + 40, 'cam.y': P.page[1] - 70, 'cam.zoom': 1.45 };
const CLOSE = { 'cam.x': P.page[0], 'cam.y': P.page[1] - 40, 'cam.zoom': 2.25 };
const MARGIN = { 'cam.x': P.margin[0] + 40, 'cam.y': P.margin[1] - 40, 'cam.zoom': 2.6 };
const SKY = { 'cam.x': 960, 'cam.y': 300, 'cam.zoom': 0.94 };
const ROW = { 'cam.x': 960, 'cam.y': 650, 'cam.zoom': 1.42 };

const cap = (when: number, beat: 'b64_mentira' | 'b65_continuara', idx: number, beats: number) => at(when, v('caption', { beat, idx, beats }));

// ================================================================ FIRST PART (0 → prechorus): «Mentira» until he sleeps
const FIRST: ScoreEntry[] = [
  // ---------------------------------------------------------------- INTRO: the night draws itself
  at(0, 'coldOpen', v('frameIn'), v('punch', { z: 0.03, dur: 0.4 })),
  key(0, { ...FARO, 'cam.zoom': 1.06, warm: 0, night: 1, dawn: 0, frame: 1, pencil: 0, crowd: 0 }),
  key(0, { 'cam.zoom': 1.18, 'cam.x': 820 }, { beats: 28, ease: 'sineInOut' }),
  // the page glows on the keys (stage), the beam sweeps once per two bars; the lantern waits
  tap(
    FAROL,
    { id: 'farol', anchor: 'luz', lead: 1 },
    {
      great: [v('drop', { at: 'lantern', r: 170, color: 0xffc94a, n: 2 }), v('flecks', { at: 'lantern', n: 14, color: 0xffb23a, spread: 220 })],
      hit: [v('drop', { at: 'lantern', r: 120, color: 0xffc94a })],
      miss: [v('note', { at: 'lantern', text: '¿…?', dy: -90 })],
    },
  ),

  // ---------------------------------------------------------------- VERSE: every cat comes to look
  at(SEC.verse, v('punch', { z: 0.025, dur: 0.3 })),
  key(SEC.verse, WIDE, { beats: 6, ease: 'out' }),
  ...GATOS.map((t, i) =>
    tap(
      t,
      { id: `gato${i}`, optional: true, lead: 0.5, anchor: `gato${ARRIVE.indexOf(t)}` },
      {
        great: [v('arc', { who: `gato${ARRIVE.indexOf(t)}` }), v('drop', { at: `gato${ARRIVE.indexOf(t)}`, r: 80, color: 0xf0a060 })],
        hit: [v('arc', { who: `gato${ARRIVE.indexOf(t)}` })],
        miss: [v('note', { at: `gato${ARRIVE.indexOf(t)}`, text: '¡uy!', dy: -110 })],
      },
    ),
  ),
  at(BIG1, v('punch', { z: 0.03 }), v('note', { at: 'lamp', text: '¡!', dy: -70, size: 64 })),
  cap(bar(12), 'b64_mentira', 2, 7),
  key(bar(12), PAGE, { beats: 6, ease: 'inOut' }),
  key(bar(13), { pencil: 0.15 }, { beats: 4, ease: 'out' }),
  // «¿Qué escribes?»: three storyboard thumbnails (stage: ui.ts) — the pick only changes the drawing; no pick = «nada»
  key(PICK.open, { thumbs: 1 }, { beats: 2, ease: 'outBack' }),
  at(PICK.decide, v('pickStamp')),
  key(PICK.close, { thumbs: 0 }, { beats: 2, ease: 'in' }),
  at(bar(17), v('caption', { reply: true, beats: 8 })),
  key(bar(17), { pencil: 0.55 }, { beats: 12, ease: 'inOut' }),

  // ---------------------------------------------------------------- BRIDGE: before the pencil touches the paper…
  key(SEC.bridge, { ...PAGE, 'cam.zoom': 1.7, 'cam.x': P.page[0] - 40 }, { beats: 6, ease: 'inOut' }),
  key(SEC.bridge, { pencil: 0.8 }, { beats: 14, ease: 'in' }),
  ...VUELTAS.map((t, i) =>
    tap(
      t,
      { id: `vuelta${i}`, lead: 0.5, anchor: 'canelo', label: `${i + 1}` },
      {
        great: [v('turnFx', { n: i, clean: true }), v('note', { at: 'canelo', text: `${i + 1}`, dy: -150, size: 70 })],
        hit: [v('turnFx', { n: i }), v('note', { at: 'canelo', text: `${i + 1}`, dy: -150, size: 54 })],
        miss: [v('turnFx', { n: i, dizzy: true }), v('note', { at: 'canelo', text: '¿?', dy: -150, size: 50 })],
      },
    ),
  ),
  at(ASLEEP_T, v('zzz', { at: 'canelo', beats: 8 })),
  key(ASLEEP_T, { pencil: 0.72 }, { beats: 1, ease: 'out' }),
  key(ASLEEP_T, CLOSE, { beats: 4, ease: 'inOut' }),

  // ---------------------------------------------------------------- BREAK: nobody can write under a sleeping cat
  cap(SEC.brk, 'b64_mentira', 4, 9),
  key(SEC.brk, { ...PAGE, 'cam.zoom': 1.8 }, { beats: 4, ease: 'inOut' }),
  ...PICA.map((t, i) =>
    tap(
      t,
      { id: `pica${i}`, optional: true, lead: 0.5, anchor: 'luz' },
      {
        great: [v('poke', { good: true }), v('note', { at: 'canelo', text: '…zzz', dy: -130 })],
        hit: [v('poke', {})],
        miss: [v('poke', { miss: true })],
      },
    ),
  ),
  key(SEC.naked, { ...CLOSE, 'cam.zoom': 2.5, pencil: 0 }, { beats: 10, ease: 'inOut' }),
  cap(bar(28, 2), 'b64_mentira', 5, 9),
  hold(
    CALOR,
    SEC.chorus,
    { id: 'calor', release: true, anchor: 'canelo', label: 'CALOR' },
    {
      great: [v('flood', { great: true })],
      hit: [v('flood', {})],
      miss: [v('flood', { late: true })],
    },
  ),
  key(SEC.chorus - 0.02, { warmR: 0 }),

  // ---------------------------------------------------------------- CHORUS: the color floods the island; the dream
  at(SEC.chorus, v('punch', { z: 0.05, dur: 0.4 }), v('shake', { amp: 8, dur: 0.5 })),
  key(SEC.chorus, { warmR: 3400, frame: 0 }, { beats: 3, ease: 'out' }),
  key(SEC.chorus + 3 * (2 / 3), { warm: 1, warmR: 0 }),
  key(SEC.chorus, WIDE, { beats: 4, ease: 'out' }),
  key(bar(34), SKY, { beats: 10, ease: 'inOut' }),
  ...SUENOS.map((t, i) =>
    tap(
      t,
      { id: `sueno${i}`, lead: 1, anchor: `sueno${i}` },
      {
        great: [v('drop', { at: `sueno${i}`, r: 230, panel: i, n: 2 }), v('flecks', { at: `sueno${i}`, n: 16, panel: i, spread: 260 })],
        hit: [v('drop', { at: `sueno${i}`, r: 160, panel: i })],
        miss: [v('note', { at: `sueno${i}`, text: '…', dy: -150 })],
      },
    ),
  ),
  key(bar(40), { ...WIDE, 'cam.y': 420, 'cam.zoom': 0.96 }, { beats: 12, ease: 'inOut' }),

  // ---------------------------------------------------------------- BREAK2: far away, someone writes on the margin
  key(SEC.break2, { warm: 0.42, frame: 1 }, { beats: 8, ease: 'inOut' }),
  key(SEC.break2, PAGE, { beats: 6, ease: 'inOut' }),
  cap(bar(44, 2), 'b64_mentira', 6, 9),
  key(bar(45, 2), { hand: 1 }, { beats: 4, ease: 'out' }),
  key(bar(46), MARGIN, { beats: 4, ease: 'inOut' }),
  key(bar(49, 2), { hand: 0 }, { beats: 4, ease: 'in' }),
  key(bar(50), ROW, { beats: 6, ease: 'inOut' }),
];

// ================================================================ THE END (prechorus → cut): «…Mentira», the credits, REGISTRO 000
/** the state at the prechorus (the resume point): every prop the first part leaves keyed, set at once */
const RESUME_KEYS = key(RESUME, { ...ROW, warm: 0.42, warmR: 0, night: 1, dawn: 0, frame: 1, pencil: 0, hand: 0, thumbs: 0, crowd: 0 });

const LAST: ScoreEntry[] = [
  RESUME_KEYS,
  // ---------------------------------------------------------------- PRECHORUS: one eye open per bass note
  key(bar(54), { ...ROW, 'cam.zoom': 1.75, 'cam.y': 680 }, { beats: 7, ease: 'in' }),
  hold(
    MENTIRA_HOLD,
    SEC.climax,
    { id: 'mentira', release: true, anchor: 'crowd', label: 'RESPIRA' },
    {
      great: [v('mentira', { big: true })],
      hit: [v('mentira', {})],
      miss: [v('mentira', { sleepy: true })],
    },
  ),

  // ---------------------------------------------------------------- CLIMAX: MENTIRA, and the credits ride it
  at(MENTIRA_T, v('punch', { z: 0.07, dur: 0.45 }), v('shake', { amp: 12, dur: 0.6 })),
  key(MENTIRA_T, { warm: 1.25, frame: 0 }, { dur: 0.25, ease: 'out' }),
  key(MENTIRA_T, { ...WIDE, 'cam.zoom': 0.94 }, { beats: 4, ease: 'expoOut' }),
  key(CREDITS.title, { 'cam.x': 900, 'cam.y': 500, 'cam.zoom': 0.9 }, { beats: 30, ease: 'sineInOut' }),
  key(bar(62), { dawn: 0.45, night: 0.6 }, { beats: 32, ease: 'inOut' }),
  ...PINTA.map((t, i) =>
    tap(
      t,
      { id: `pinta${i}`, lead: 1, anchor: 'credit' },
      {
        great: [v('drop', { at: 'credit', r: 240, n: 3, credit: true }), v('flecks', { at: 'credit', n: 22, spread: 340, credit: true })],
        hit: [v('drop', { at: 'credit', r: 160, credit: true })],
        miss: [v('flecks', { at: 'credit', n: 6, spread: 120, credit: true })],
      },
    ),
  ),

  // ---------------------------------------------------------------- OUTRO: dawn; the watercolor dries into the game's paint
  key(SEC.outro, { dawn: 1, night: 0.15 }, { beats: 10, ease: 'inOut' }),
  key(SEC.outro, { warm: 2 }, { beats: 16, ease: 'inOut' }),
  key(CREDITS.dawn, { ...PAGE, 'cam.zoom': 1.5 }, { beats: 8, ease: 'inOut' }),
  cap(CREDITS.dawn, 'b64_mentira', 9, 8),
  cap(CREDITS.bye, 'b65_continuara', 1, 4),

  // ---------------------------------------------------------------- FADE_TAIL: REGISTRO 000 on the tick-tock
  key(SEC.fadeTail, { card: 1 }, { beats: 1, ease: 'outBack' }),
];

// ---------------------------------------------------------------- always (both parts)
const ALWAYS: ScoreEntry[] = [
  // no sound: the frame carries the beat
  on({ beats: { in: [0, CUT] } }, 'beat'),
];

export const SCORE: ScoreEntry[] = [...FIRST, ...LAST, ...ALWAYS];

export const YONOSE_TODO: MomentoDef = {
  id: 'yonose_todo',
  track: 'yonose_todo',
  title: 'YONOSE TODO',
  mission: 'H64',
  cut: CUT,
  tail: 'release',
  // the toolkit's grade stays neutral (the look is the stage's own: paper.ts)
  palettes: { intro: 'lapiz', verse: 'lapiz', chorus: 'acuarela', break2: 'lapiz', climax: 'acuarela', outro: 'pintura' },
  score: SCORE,
  stage: () => import('./stage').then((m) => m.default as unknown as (h: unknown) => unknown),
  unlocks: ['yonose_todo'],
  source: 'Mentira',
};

/** the finale resumed at the credits: the song from the prechorus (a bar line) to the end, the LAST part only */
export const RESUME_EDIT: EditSegment[] = [{ from: RESUME, to: 208.961 }];
export const RESUME_DEF: Partial<MomentoDef> = { edit: RESUME_EDIT, score: [...LAST, ...ALWAYS.map((e) => (e.kind === 'each' ? { ...e, each: { beats: { in: [RESUME, CUT] as [number, number] } } } : e))] };
