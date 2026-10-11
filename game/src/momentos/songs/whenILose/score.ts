/**
 * WHEN I LOSE — the choreography (H35, «Shhh»: the Bibliotecario Ahogado). docs/part-ii/29 §14.
 *
 * 140 BPM grid (felt at 70), bar 1.714 s, E pedal. The WHOLE song, 0 → 219.5 (its last breath), no edit.
 * The arc follows the song's own voices (measured on the vocal stem): they sing 0–41, vanish for 55 s (break,
 * prechorus, the first chorus WITHOUT voice, break2), come back at 96.0, carry the bridge, drop out in the valley
 * (164.6–178.3) and return after the last hit (180–218).
 *
 *   intro    SHHH: the battle frame drains into ink from his side; the page turns onto the drowned hall; the colossus
 *            rises; the voices write gold letters that he snuffs out
 *   verse    the duel in ink — scrolls unroll the two captains; HIS WAVE (tap)
 *   break    the voices are gone: his reign, seals, pages flung at us (3 taps)
 *   pre      the hall floods; hold OUR LIGHT against the silence (hold)
 *   chorus   THE HIT: the book slams, the camera plunges under the water; the lantern sinks, lighting the drowned memory
 *   break2   the memory, in ink (plates: a scribe, an old duel, the loser bows) · listen or sing (choice)
 *   chorus2  THE VOICES BREAK THROUGH (96.0): gold spreads from the lantern and the world is REDRAWN illuminated;
 *            the choir of the Archive; we light his ship (3 taps)
 *   bridge   the Archive in its glory (plates), he listens · bow to him (hold)
 *   chorus3  the illuminated duel (3 taps)
 *   break3   his last silence: the ink closes in from the edges, the choir holds (2 bonus taps)
 *   build    the valley: the page empties; one drop of gold swells at a brush (hold… release on the hit)
 *   climax   THE LAST HIT: ink AND gold at once; the final exchanges (3 taps)
 *   outro    the primordial bows — to lose with dignity — and the duel becomes a page: «ÚLTIMO CAPÍTULO»
 *
 * Always on (stage.ts): kick = ink drop rings + punch · 808 swell = the camera sinks · accent = a page tears off ·
 * bass = lamps / water · voices = gold letters · melody = the gold leaf glints.
 */
import type { MomentoDef } from '../../types';
import { at, choice, hold, key, on, tap, v } from '../../score';

/** measured kick onsets the big inputs sit on (when_i_lose.onsets.json, strength ≥ 0.7) */
export const BREAK_PAGES = [44.571, 48.0, 51.429];
export const ILUMINA = [97.714, 102.857, 111.429];
export const FUEGO = [133.714, 137.143, 140.571];
export const FINAL = [181.714, 190.286, 196.286];

const big = (text: string, o: Record<string, unknown> = {}) => v('word', { text, size: 120, ...o });

export const WHEN_I_LOSE: MomentoDef = {
  id: 'when_i_lose',
  track: 'when_i_lose',
  title: 'WHEN I LOSE',
  mission: 'H35',
  cut: 'end',
  tail: 'release',
  unlocks: ['when_i_lose'],
  palettes: {
    intro: 'sumi',
    verse: 'sumi',
    break: 'sello',
    prechorus: 'sumi',
    chorus: 'abismo',
    break2: 'abismo',
    chorus2: 'oro',
    bridge: 'vitral',
    chorus3: 'duelo',
    break3: 'oro',
    build: 'valle',
    climax: 'gloria',
    outro: 'ocaso',
  },
  props: { 'style.in': 0, 'style.out': 1, 'front.r': 0, 'front.x': 1500, 'front.y': 420 },
  stage: () => import('./stage').then((m) => m.default as unknown as import('../../types').StageFactory),
  score: [
    // ================================================================ INTRO (0–17.1): SHHH
    // the silent beat (no sound: the page edge carries the pulse)
    on({ beats: { in: [0, 'end'], every: 2 } }, 'pulse'),
    at(0, 'coldOpen', v('shhh', { at: [1100, 420], size: 250, dur: 1.5 }, { dt: 0.08 }), v('heavy', { at: [1500, 380], r: 380, sink: 160 })),
    // the ink eats the battle frame from his side (the front grows; then the whole page is ink)
    key(0, { 'front.r': 2900 }, { dur: 1.6, ease: 'inOut' }),
    key('#1', { 'style.out': 0, 'front.r': -1 }),
    // the page turns onto the hall: a wide shot under the vault, then a slow descent toward the water
    key(0, { 'cam.x': 960, 'cam.y': 140, 'cam.zoom': 0.6, rays: 0.6, pages: 0.25, lantern: 0.55 }),
    key('#1', { 'cam.y': 380, 'cam.zoom': 0.78 }, { beats: 28, ease: 'sineInOut' }),
    // the colossus rises behind his ship, the great book open in his paws
    key('#2', { giant: 1, book: 1 }, { beats: 16, ease: 'inOut' }),
    at('#2', v('pose', { who: 'giant', name: 'loom', beats: 16 })),
    // the voices write their first letters (and he will snuff them)
    key('voices_in', { glyphs: 1 }, { beats: 2 }),
    at('#4', v('pose', { who: 'biblio', name: 'shhh', beats: 4 })),
    // a close-up: his own «shhh» (a sumi portrait in an ensō)
    at('#8', v('plate', { kind: 'portrait', who: 'biblio', beats: 7, h: 1150, flip: true, style: 0 })),
    at('#8:1', v('shhh', { at: [1340, 300], size: 170, dur: 2.2, seal: false })),
    key('#9', { 'cam.x': 960, 'cam.y': 470, 'cam.zoom': 0.92, rays: 0.35 }, { beats: 4, ease: 'inOut' }),

    // ================================================================ VERSE (17.1–41.1): the duel in ink
    at('verse', v('scroll', { who: 'canelo', side: 'left', beats: 7 })),
    at('#12', v('scroll', { who: 'biblio', side: 'right', beats: 7 })),
    at('#10', v('pose', { who: 'canelo', name: 'proud', beats: 6 })),
    key('#14', { 'cam.x': 1060, 'cam.y': 500, 'cam.zoom': 1.02 }, { beats: 8, ease: 'inOut' }),
    // HIS WAVE (beat_in: the drums are complete) — the wall of ink is on its way a bar before
    at('beat_in', v('inkWave', { prompt: 'ola', dur: 1.5 })),
    tap(
      'beat_in',
      { id: 'ola', anchor: 'caneloP', label: '¡CORTA!' },
      {
        great: [big('¡ZAS!', { at: 'canelo', dy: -170 }), v('streaks', { ang: -0.35, dur: 0.4 }), v('shake', { amp: 10, dur: 0.3 })],
        hit: [big('¡UF!', { at: 'canelo', dy: -160, size: 90 })],
        miss: [big('¡PLAF!', { at: 'canelo', dy: -150, size: 80 }), v('shake', { amp: 14, dur: 0.4 })],
      },
    ),
    // the exchange: his ink shots on the strong accents, ours on the strong kicks
    on({ onsets: { track: 'snare', in: ['#17', '#23'], min: 0.95, minGap: 2.4 } }, v('stroke', { from: 'B', result: 'great' })),
    on({ onsets: { track: 'kick', in: ['#18', '#23'], min: 0.95, minGap: 3 } }, v('stroke', { from: 'A', result: 'hit' })),
    // the exchange is cut like a duel: a push on our bow, a counter on his deck, back to the hall
    key('#17', { 'cam.x': 760, 'cam.y': 540, 'cam.zoom': 1.28, 'cam.rot': -0.025 }, { beats: 3, ease: 'out' }),
    key('#19', { 'cam.x': 1260, 'cam.y': 470, 'cam.zoom': 1.22, 'cam.rot': 0.025 }, { beats: 3, ease: 'out' }),
    key('#21', { 'cam.x': 1000, 'cam.y': 480, 'cam.zoom': 1.0, 'cam.rot': 0 }, { beats: 4, ease: 'inOut' }),
    at('#20', v('pose', { who: 'giant', name: 'lean', beats: 12 })),
    key('#22', { 'book.y': -90, 'cam.zoom': 0.95, 'cam.y': 430 }, { beats: 8, ease: 'inOut' }),

    // ================================================================ BREAK (41.1–54.9): the voices are gone — his reign
    key('break', { glyphs: 0 }, { beats: 1 }),
    at('break', v('heavy', { at: 'book', r: 300, sink: 90 }), v('pose', { who: 'biblio', name: 'slam', dur: 1 }), v('seal', { at: [1500, 230], size: 130, text: '静', dur: 3.2 })),
    key('break', { 'cam.x': 900, 'cam.y': 520, 'cam.zoom': 1.08, 'cam.rot': -0.035, pages: 0.6 }, { beats: 2, ease: 'out' }),
    at('big_hit_1', v('inkBurst', { at: 'water', dx: -300, r: 220 })),
    at('big_hit_2', v('inkBurst', { at: 'water', dx: 260, r: 240 })),
    ...BREAK_PAGES.flatMap((t, i) => [
      at(t, v('pageShot', { prompt: `p${i}`, i, dur: 0.6 })),
      tap(
        t,
        { id: `p${i}`, anchor: 'caneloP', label: '¡CORTA!' },
        {
          great: [big('¡ZAS!', { at: 'canelo', dy: -180, size: 100 }), v('enso', { at: 'canelo', r: 170, dur: 0.6 })],
          hit: [big('¡FIU!', { at: 'canelo', dy: -170, size: 80 })],
          miss: [big('¡PAF!', { at: 'canelo', dy: -160, size: 80 })],
        },
      ),
    ]),
    key('#28', { 'cam.rot': 0.03, 'cam.x': 1000 }, { beats: 8, ease: 'inOut' }),
    at('#30', v('seal', { at: [1700, 300], size: 110, text: '黙', dur: 3 })),

    // ================================================================ PRECHORUS (54.9–68.6): the hall floods; hold our light
    key('prechorus', { flood: 1, 'cam.rot': 0, 'cam.x': 700, 'cam.y': 560, 'cam.zoom': 1.15 }, { beats: 30, ease: 'inOut' }),
    at('prechorus', v('pose', { who: 'giant', name: 'lean', beats: 30 })),
    at('#34', v('pose', { who: 'luzterna', name: 'raise', beats: 22 })),
    hold(
      '#36',
      'chorus',
      { id: 'luz', anchor: 'lantern', label: 'SOSTÉN LA LUZ' },
      {
        great: [big('LUZ', { font: 'serif', gold: true, size: 150, at: [960, 300], dur: 1.6 })],
        hit: [big('luz', { font: 'serif', gold: true, size: 90, at: [960, 300] })],
        miss: [big('…', { font: 'serif', size: 90, at: [960, 300] })],
      },
    ),

    // ================================================================ CHORUS (68.6–82.3): THE HIT — under the water
    at('first_drop', v('heavy', { at: 'book', r: 620, sink: 240 }), v('pose', { who: 'biblio', name: 'slam', dur: 1.2 }), v('streaks', { ang: Math.PI / 2, dur: 0.6, n: 30 })),
    key('first_drop', { book: 0 }, { dur: 0.12, ease: 'out' }),
    key('first_drop', { lfall: 1 }, { beats: 16, ease: 'out' }),
    key('first_drop', { 'cam.y': 1240, 'cam.x': 900, 'cam.zoom': 1, pages: 0, rays: 0, flood: 0.4 }, { beats: 2, ease: 'expoOut' }),
    key('#42', { 'cam.y': 1320, 'cam.x': 960 }, { beats: 22, ease: 'sineInOut' }),
    ...[75.429, 78.857].map((t, i) =>
      tap(t, { id: `memo${i}`, anchor: 'lantern', label: '¡MIRA!', optional: true }, { great: [v('gild', { at: 'lantern', r: 150, dy: -40 }), v('bloom', { at: 'lantern', dur: 1.2 })], hit: [v('gild', { at: 'lantern', r: 110 })] }),
    ),

    // ================================================================ BREAK2 (82.3–96.0): the memory, in ink
    at('break2', v('plate', { kind: 'writer', beats: 8, style: 0 })),
    at('#50', v('plate', { kind: 'duel', beats: 8, style: 0 })),
    at('#52', v('plate', { kind: 'bow', beats: 8, style: 0, left: 'tintero', right: 'archivista' })),
    key('#53', { 'cam.y': 1180, 'cam.zoom': 1.15 }, { beats: 8, ease: 'inOut' }),
    choice(
      '#54',
      { id: 'voz', fallback: 'left', label: 'ESCUCHA · CANTA', until: '#55:2' },
      {
        left: [v('pose', { who: 'canelo', name: 'listen', beats: 8 }), big('escucha…', { font: 'serif', size: 70, at: [960, 260], dur: 2 })],
        right: [v('pose', { who: 'canelo', name: 'sing', beats: 8 }), v('bloom', { at: 'lantern', dur: 1.4 }), big('¡MIAU!', { font: 'serif', gold: true, size: 90, at: [960, 260], dur: 1.6 })],
      },
    ),

    // ================================================================ CHORUS2 (96.0): THE VOICES BREAK THROUGH — redrawn in gold
    at('chorus2', v('bloom', { at: 'lantern', dur: 3.4 }), v('heavy', { at: 'lantern', r: 300, sink: -120, gold: true }), big('MEMORIA', { font: 'fraktur', gold: true, size: 170, at: [960, 250], dur: 2.6 })),
    key('chorus2', { 'front.r': 0, 'style.in': 1, 'style.out': 0, 'front.at': 'lantern', 'front.soft': 160 }),
    key('chorus2', { 'front.r': 3000 }, { beats: 8, ease: 'out' }),
    key('#58', { 'style.out': 1, 'front.r': -1, 'front.at': '' }),
    key('chorus2', { mist: 0.16, lantern: 0.45 }, { beats: 8 }),
    key('chorus2', { 'cam.y': 480, 'cam.x': 960, 'cam.zoom': 0.86, lfall: 0, flood: 0, rays: 0.7, pages: 0.35, choir: 1, glyphs: 1, hush: 0, book: 1 }, { beats: 8, ease: 'out' }),
    at('chorus2', v('pose', { who: 'biblio', name: 'stunned', beats: 8 }), v('pose', { who: 'giant', name: 'loom', beats: 8 })),
    ...ILUMINA.map((t, i) =>
      tap(
        t,
        // the first one shows while the camera is still rising out of the water: it sits on the lantern
        { id: `ilu${i}`, anchor: i === 0 ? 'lantern' : 'A', label: '¡ILUMINA!' },
        {
          great: [v('stroke', { from: 'A', gold: true, result: 'great' }), v('gild', { at: 'B', r: 200, result: 'great' }, { dt: 0.42 }), v('pose', { who: 'canelo', name: 'fire', dur: 0.6 })],
          hit: [v('stroke', { from: 'A', gold: true, result: 'hit' }), v('gild', { at: 'B', r: 150, result: 'hit' }, { dt: 0.42 })],
          miss: [v('stroke', { from: 'A', gold: true, result: 'miss' }), v('pose', { who: 'canelo', name: 'shock', dur: 0.6 })],
        },
      ),
    ),
    // shots: push on his ship, a low dutch on ours, back to the hall
    key('#59:2', { 'cam.x': 1320, 'cam.y': 420, 'cam.zoom': 1.3 }, { beats: 2, ease: 'out' }),
    key('#61', { 'cam.x': 760, 'cam.y': 540, 'cam.zoom': 1.2, 'cam.rot': 0.03 }, { beats: 6, ease: 'inOut' }),
    key('#64:2', { 'cam.x': 1000, 'cam.y': 470, 'cam.zoom': 0.95, 'cam.rot': 0 }, { beats: 2, ease: 'out' }),

    // ================================================================ BRIDGE (116.6–130.3): the Archive in its glory
    at('bridge', v('plate', { kind: 'archive', beats: 8, style: 1 })),
    at('#70', v('plate', { kind: 'choir', beats: 8, style: 1 })),
    at('#72', v('plate', { kind: 'portrait', who: 'biblio', beats: 8, h: 1150, flip: true, style: 1 })),
    key('#73', { 'cam.x': 960, 'cam.y': 470, 'cam.zoom': 0.9 }),
    at('#74', v('pose', { who: 'biblio', name: 'listen', beats: 8 })),
    hold(
      '#74',
      'chorus3',
      { id: 'reverencia', anchor: 'caneloP', label: 'INCLÍNATE' },
      {
        great: [v('pose', { who: 'canelo', name: 'bowDeep', beats: 4 }), v('pose', { who: 'biblio', name: 'bow', beats: 4 }, { beats: 1 }), v('pose', { who: 'giant', name: 'giantBow', beats: 6 }, { beats: 1 }), v('seal', { at: [1500, 240], size: 110, text: '礼', dur: 2.2 })],
        hit: [v('pose', { who: 'canelo', name: 'bow', beats: 4 }), v('pose', { who: 'biblio', name: 'bow', beats: 4 }, { beats: 1 })],
        miss: [v('pose', { who: 'canelo', name: 'tumble', dur: 0.6 }), v('pose', { who: 'canelo', name: 'bow', beats: 3 }, { dt: 0.6 }), v('pose', { who: 'biblio', name: 'bow', beats: 4 }, { beats: 1 })],
      },
    ),

    // ================================================================ CHORUS3 (130.3–144.0): the illuminated duel
    key('chorus3', { 'cam.x': 960, 'cam.y': 520, 'cam.zoom': 1.02, pages: 0.5 }, { beats: 2, ease: 'out' }),
    at('chorus3', v('bloom', { at: 'B', dur: 1.5 })),
    on({ onsets: { track: 'snare', in: ['#76:2', '#84'], min: 0.97, minGap: 3 }, }, v('stroke', { from: 'B', result: 'great' })),
    ...FUEGO.map((t, i) =>
      tap(
        t,
        { id: `fuego${i}`, anchor: 'A', label: '¡FUEGO!' },
        {
          great: [v('stroke', { from: 'A', gold: true, result: 'great' }), v('gild', { at: 'Bhull', r: 230, result: 'great' }, { dt: 0.42 }), v('pose', { who: 'canelo', name: 'fire', dur: 0.6 }), big('¡FUEGO!', { gold: true, size: 110, at: [960, 190], rot: -0.03 })],
          hit: [v('stroke', { from: 'A', gold: true, result: 'hit' }), v('gild', { at: 'Bhull', r: 160, result: 'hit' }, { dt: 0.42 })],
          miss: [v('stroke', { from: 'A', gold: true, result: 'miss' }), v('pose', { who: 'canelo', name: 'shock', dur: 0.6 })],
        },
      ),
    ),
    key('#77:2', { 'cam.x': 640, 'cam.y': 520, 'cam.zoom': 1.35, 'cam.rot': -0.03 }, { beats: 2, ease: 'out' }),
    key('#79:2', { 'cam.x': 1340, 'cam.y': 430, 'cam.zoom': 1.3, 'cam.rot': 0.03 }, { beats: 2, ease: 'out' }),
    key('#81:2', { 'cam.x': 960, 'cam.y': 500, 'cam.zoom': 0.95, 'cam.rot': 0 }, { beats: 2, ease: 'out' }),
    at(142.286, v('heavy', { at: 'Ahull', r: 260, sink: 80 }), v('pose', { who: 'canelo', name: 'brace', dur: 1 })),

    // ================================================================ BREAK3 (144.0–164.6): his last silence
    key('break3', { 'style.in': 1, 'style.out': 0, 'front.at': 'lantern', 'front.r': 3000, 'front.soft': 200 }),
    key('break3', { 'front.r': 560 }, { beats: 30, ease: 'inOut' }),
    at('break3', v('pose', { who: 'giant', name: 'loom', beats: 30 }), v('shhh', { at: [1420, 260], size: 150, dur: 2, seal: false })),
    at('#88', v('shhh', { at: [420, 300], size: 130, dur: 2, seal: false })),
    key('break3', { 'cam.zoom': 0.92, 'cam.y': 470, 'book.y': -160 }, { beats: 16, ease: 'inOut' }),
    ...[145.714, 152.571].map((t, i) =>
      tap(t, { id: `canta${i}`, anchor: 'lantern', label: '¡CANTA!', optional: true }, { great: [v('bloom', { at: 'lantern', dur: 1.6 }), v('gild', { at: 'lantern', r: 140 })], hit: [v('bloom', { at: 'lantern', dur: 1 })] }),
    ),
    at('#92', v('plate', { kind: 'split', beats: 8, style: 'split' })),

    // ================================================================ BUILD (164.6–178.3): the valley — the page empties
    key('build', { 'style.out': 1, 'front.r': -1, 'front.at': '' }),
    key('break3', { mist: 0.3 }, { beats: 16 }),
    key('build', { lantern: 0, blank: 1, choir: 0, glyphs: 0, giant: 0.25, pages: 0, rays: 0, lamps: 0 }, { beats: 14, ease: 'inOut' }),
    key('build', { 'cam.zoom': 1.2, 'cam.y': 420, 'cam.x': 960 }, { beats: 30, ease: 'sineInOut' }),
    at('valley', v('drop', { prompt: 'gota', until: 10.286 })),
    hold(
      'valley',
      'climax',
      { id: 'gota', anchor: [960, 760], label: 'MANTÉN · ¡SUELTA!', release: true },
      {
        great: [v('heavy', { at: [960, 640], r: 760, sink: 280, gold: true }), big('¡AHORA!', { font: 'serif', gold: true, size: 170, at: [960, 250], dur: 1.8 })],
        hit: [v('heavy', { at: [960, 640], r: 560, sink: 220, gold: true })],
        miss: [v('heavy', { at: [960, 640], r: 420, sink: 160, gold: true })],
      },
    ),
    at('#103', v('streaks', { ang: Math.PI / 2, dur: 1.6, n: 16 })),

    // ================================================================ CLIMAX (178.3–205.7): ink AND gold
    key('climax', { lantern: 0.45, blank: 0, mist: 0.12, line: 3.2, choir: 1, giant: 1, pages: 0.6, rays: 0.8, lamps: 1, glyphs: 1, 'cam.zoom': 0.85, 'cam.y': 470 }, { dur: 0.35, ease: 'out' }),
    at('climax', v('pageBlast', { at: 'mid', n: 40, power: 1.8, dur: 3 }), v('pose', { who: 'giant', name: 'loom', beats: 16 })),
    key('#106', { 'cam.zoom': 1.0, 'cam.x': 1000 }, { beats: 6, ease: 'inOut' }),
    key('#108', { 'cam.x': 620, 'cam.y': 520, 'cam.zoom': 1.3, 'cam.rot': -0.05 }, { beats: 4, ease: 'out' }),
    key('#110', { 'cam.x': 960, 'cam.y': 470, 'cam.zoom': 0.9, 'cam.rot': 0 }, { beats: 4, ease: 'out' }),
    at('#112', v('plate', { kind: 'portrait', who: 'canelo', beats: 6, h: 1000, style: 1, turnOut: 0.35 })),
    key('#113:2', { 'cam.x': 1360, 'cam.y': 440, 'cam.zoom': 1.25, 'cam.rot': 0.04 }),
    on({ onsets: { track: 'snare', in: ['#105', '#116'], min: 0.9, minGap: 3.4 } }, v('stroke', { from: 'B', result: 'great' })),
    ...FINAL.map((t, i) =>
      tap(
        t,
        { id: `fin${i}`, anchor: 'A', label: '¡AHORA!' },
        {
          great: [v('stroke', { from: 'A', gold: true, result: 'great' }), v('gild', { at: 'B', r: 260, result: 'great' }, { dt: 0.42 }), v('pose', { who: 'canelo', name: 'fire', dur: 0.6 }), v('enso', { at: 'B', r: 220, gold: true, dur: 1 }, { dt: 0.42 })],
          hit: [v('stroke', { from: 'A', gold: true, result: 'hit' }), v('gild', { at: 'B', r: 170, result: 'hit' }, { dt: 0.42 })],
          miss: [v('stroke', { from: 'A', gold: true, result: 'miss' }), v('pose', { who: 'canelo', name: 'shock', dur: 0.6 })],
        },
      ),
    ),
    // the faceoff: he raises his book in salute
    key('#116', { 'cam.zoom': 1.12, 'cam.x': 960, 'cam.y': 500 }, { beats: 14, ease: 'inOut' }),
    at('#116', v('pose', { who: 'biblio', name: 'proud', beats: 14 }), v('pose', { who: 'canelo', name: 'proud', beats: 14 })),
    key('#116', { 'book.y': -240 }, { beats: 6, ease: 'inOut' }),

    // ================================================================ OUTRO (205.7–219.5): to lose with dignity
    at('outro', v('pose', { who: 'giant', name: 'giantBow', beats: 16 }), v('pose', { who: 'biblio', name: 'bowDeep', beats: 16 }), v('pose', { who: 'canelo', name: 'bow', beats: 16 }, { beats: 2 })),
    key('outro', { 'cam.zoom': 0.8, 'cam.y': 420, pages: 0.3, line: 2.4 }, { beats: 16, ease: 'sineInOut' }),
    at('outro+1', big('CON DIGNIDAD', { font: 'serif', gold: true, size: 96, at: [960, 200], dur: 4 })),
    at('#124', v('plate', { kind: 'manuscript', dur: 219.5 - 212.571 + 0.2, style: 1, turnOut: 0.01, cut: true })),
    at('#125', big('ÚLTIMO CAPÍTULO', { font: 'serif', color: 0x3a2414, stroke: 0xf6ead0, size: 104, at: [1110, 900], dur: 5.2, rot: 0 })),
  ],
};
