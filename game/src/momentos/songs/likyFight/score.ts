/**
 * LIKY FIGHT — the choreography (H44 · Cascada, sea → sky), THE WHOLE SONG (237 s). Song time; bars are 1.832 s
 * (131 BPM), '#n' = bar n. Full sheet: docs/part-ii/29 §9.
 *
 * Every sound has a purpose (the stage reacts to the ONSET tracks all the time: each kick punches the camera, pulses the
 * light and dips the hulls; each accent fires a galleon cannon or splashes beside us; each bass note sways the ships,
 * swells the waves and tints the sky; strong melody attacks sparkle). The score adds the story on top:
 *
 *  first half (0–117)   the cold open · the party wakes on the kicks · the galleon lifts off · the brace · the BARRAGE
 *                       on the dembow accents · she recovers · the sky chase · the standoff · the leap · the fight cloud
 *  shout_1 (115.85)     she blasts Canelo back home: ¡OTRA VUELTA!
 *  intro2 / verse2      both ships climb into the night above the clouds · the moon dance · stops = comic panels
 *  shout_2 (145.95)     ¡AHORA! · prechorus2: the disco ball becomes a cannon while Canelo charges (MASH)
 *  chorus2              the COUNTERATTACK: Canelo fires on the accents (TAP) · break3: a DANCE-OFF under the disco ball
 *  drop3                the chase through the upside-down islands (TAP to bat the falling rocks)
 *  break4               dawn · the last standoff · HOLD and RELEASE into the climax
 *  climax (218.0)       both leap · the fight in the air (TAP) · fireworks · the hero shot · outro: the lights go out
 */
import type { MomentoDef, ScoreEntry } from '../../types';
import { at, choice, hold, key, mash, on, tap, v } from '../../score';

/**
 * Tap targets are ACCENT onsets (snare / güira / tambora on the dembow 16ths 3·6·11·14) measured on the drums stem
 * (beatmaps/liky_fight.onsets.json), ≥ 1.15 s apart. Kicks stay with the always-on reactions.
 */
export const BARRAGE = [46.145, 47.405, 49.237, 51.069, 52.557, 54.389, 56.723];
/** the barrage balls shown as full-frame shots (POV approach → the swing key poses); the others play in the set */
const SHOT_BALLS = new Set([0, 2, 3, 5, 6]);
/** the fight cloud (drop2): taps on accents */
export const FIGHT = [104.771, 106.603, 107.863, 110.267, 112.099];
/** chorus2: Canelo's counterattack, one fireball per accent */
export const COUNTER = [162.481, 164.198, 166.488, 168.321, 169.809, 171.641, 173.473];
const COUNTER_SHOT = new Set([0, 2, 4, 6]);
/** drop3: rocks falling from the upside-down islands, batted on accents */
export const ROCKS = [191.794, 194.542, 196.26, 199.122, 200.954, 202.786];
/** climax: the fight in the air, on accents */
export const CLIMAX = [222.023, 223.855, 225.572, 226.947, 228.435, 230.267];

const WIDE_SEA = { 'cam.x': 960, 'cam.y': 470, 'cam.zoom': 0.92 };

const score: ScoreEntry[] = [
  // ================================================================ INTRO — the party wakes up
  at(0, 'coldCut', v('impact', { invert: true, dur: 0.08, lines: false }), v('sfx', { text: '¡PUM!', kata: 'ドン', x: 1400, y: 300, size: 110, dur: 0.5 })),
  key(0, { 'cam.x': 1330, 'cam.y': 470, 'cam.zoom': 1.12 }, { beats: 16, ease: 'sineInOut' }),
  // the 9 party lights pop one per strong kick (stage derives the lit count from these cues)
  on({ onsets: { track: 'kick', in: ['#1:2', '#4:2'], min: 0.3, minGap: 0.4, limit: 9 } }, 'lightUp'),
  tap(
    'big_hit_1',
    { id: 'fiesta', label: '¡FIESTA!' },
    {
      great: [v('fiesta', { big: true }), v('impact', { dur: 0.07 }), v('sfx', { text: '¡FIESTA!', kata: 'パーティー', size: 150, dur: 0.9, x: 960, y: 420 })],
      hit: ['fiesta', v('sfx', { text: '¡FIESTA!', kata: 'パーティー', size: 130, dur: 0.8, x: 960, y: 420 })],
      miss: [v('fiesta', { late: true }), v('sfx', { text: 'fiesta…', size: 80, dur: 0.6, x: 960, y: 420, back: false }, { dt: 0.3 })],
    },
  ),
  key('big_hit_1', { pal: 'neon' }, { dur: 0.12 }),
  // the party's sun comes up with the lights (before that: night, no sun)
  key(0, { 'sun.y': 1.35 }),
  key('big_hit_1', { 'sun.y': 0.62 }, { beats: 3, ease: 'outBack' }),
  key('big_hit_1', { ...WIDE_SEA, party: 1, beams: 1 }, { dur: 0.4, ease: 'expoOut' }),
  at('big_hit_1', v('whip', { dx: 380, dur: 0.24 })),
  at('#5', v('party', { mode: 'dance', beats: 4 }), v('sfx', { text: '¡DJ!', kata: 'キャプテン', x: 1380, y: 260, size: 110, dur: 1.2 })),
  key('#6', { 'cam.x': 640, 'cam.y': 520, 'cam.zoom': 1.35 }, { beats: 1, ease: 'expoOut' }),
  at('#6:2', v('cutin', { who: 'canelo', side: 'left', beats: 2, emote: 'surprise', lines: 'focus', y: 760, h: 340, color: 'accent2', text: '¿¡EH!?' })),
  at('#7', v('notes', { at: 'canelo', n: 4, dur: 1.4 })),
  key('#7', WIDE_SEA, { beats: 3, ease: 'inOut' }),

  // ================================================================ VERSE — the galleon lifts off on upward waterfalls
  at('verse', v('splash', { dx: 0, n: 34, dur: 1.4 }), v('shake', { amp: 18, dur: 0.6 }), v('sfx', { text: '¡SPLASH!', kata: 'ザバーン', x: 1420, y: 640, size: 120, dur: 0.8 })),
  key('verse', { 'shipB.y': -300, falls: 1 }, { beats: 12, ease: 'inOut' }),
  key('verse', { 'cam.y': 420, 'cam.zoom': 0.86, 'cam.rot': -0.04 }, { beats: 4, ease: 'out' }),
  // STOP 1 (0.256 s): the world freezes, a comic panel shows Canelo's reaction — the tap picks which
  at('silence_1', v('freeze', { dur: 0.256 })),
  tap(
    'silence_1',
    { id: 'stop1' },
    {
      great: [v('panels', { layout: 'diag2', dur: 0.75, stagger: 0, cells: [{ who: 'canelo', emote: 'happy', sfx: '¡JA!' }, { who: 'cascada', emote: 'surprise', color: 'accent2' }] }), v('pose', { who: 'canelo', p: 'cool', dur: 1.6 })],
      hit: [v('panels', { layout: 'diag2', dur: 0.7, stagger: 0, cells: [{ who: 'canelo', emote: 'happy' }, { who: 'cascada', emote: 'happy', color: 'accent2' }] }), v('pose', { who: 'canelo', p: 'cool', dur: 1.2 })],
      miss: [v('panels', { layout: 'diag2', dur: 0.7, stagger: 0, cells: [{ who: 'canelo', emote: 'surprise', sfx: '¿¡EH!?' }, { who: 'cascada', emote: 'happy', color: 'accent2' }] }), v('pose', { who: 'canelo', p: 'trip', dur: 1 })],
    },
  ),
  at(16.4, v('lowAngle', { dur: 1.92 })),
  key('#9', { 'cam.y': 300, 'cam.x': 1180, 'cam.zoom': 0.95, 'cam.rot': 0 }, { beats: 12, ease: 'sineInOut' }),
  at('#9', v('pose', { who: 'cascada', p: 'dance', beats: 8 })),
  at('#10', v('cutin', { who: 'luzterna', side: 'left', beats: 3, emote: 'surprise', lines: 'speed', y: 280, h: 320, color: 'accent2', kata: 'ウエ' })),
  // STOP 2
  at('silence_2', v('freeze', { dur: 0.244 })),
  tap(
    'silence_2',
    { id: 'stop2' },
    {
      great: [v('panels', { layout: 'h2', dur: 0.75, stagger: 0, cells: [{ who: 'cascada', emote: 'happy', color: 'accent2' }, { who: 'canelo', emote: 'happy', sfx: '¡YEAH!' }] }), v('pose', { who: 'canelo', p: 'cool', dur: 1.2 })],
      hit: [v('panels', { layout: 'h2', dur: 0.7, stagger: 0, cells: [{ who: 'cascada', emote: 'happy', color: 'accent2' }, { who: 'canelo', emote: 'happy' }] })],
      miss: [v('panels', { layout: 'h2', dur: 0.7, stagger: 0, cells: [{ who: 'cascada', emote: 'happy', color: 'accent2' }, { who: 'canelo', emote: 'sleepy', sfx: '…' }] }), v('pose', { who: 'canelo', p: 'facepalm', dur: 1.2 })],
    },
  ),
  key('big_hit_2', { 'shipB.y': -560 }, { beats: 4, ease: 'outBack' }),
  at('big_hit_2', v('shake', { amp: 22, dur: 0.6 }), v('flash', { amount: 0.45, color: 'light', dur: 0.25 }), v('sfx', { text: '¡VUUUM!', kata: 'ブーン', x: 1380, y: 260, size: 130, dur: 0.9 })),
  key('#13', { 'cam.x': 1060, 'cam.y': 250, 'cam.zoom': 0.76 }, { beats: 8, ease: 'inOut' }),

  // ================================================================ PRECHORUS — she aims, we brace
  key('prechorus', { 'shipB.y': -400 }, { beats: 6, ease: 'inOut' }),
  at('prechorus', v('cutin', { who: 'cascada', side: 'right', beats: 4, emote: 'attack', lines: 'focus', text: '¡APUNTEN!', kata: 'ネラエ' }), v('pose', { who: 'cascada', p: 'point', beats: 8 })),
  key('#17', { 'cam.x': 1240, 'cam.y': 250, 'cam.zoom': 1.3 }, { beats: 2, ease: 'expoOut' }),
  at(31.145, v('cannonSwing', { i: 0 })),
  at('big_hit_3', v('cannonSwing', { i: 1 }), v('whip', { dx: -260, dur: 0.2 }), v('aberr', { amount: 1, dur: 0.25 })),
  at(34.809, v('cannonSwing', { i: 2 })),
  key('#19:2', { 'cam.x': 960, 'cam.y': 400, 'cam.zoom': 0.8 }, { beats: 4, ease: 'inOut' }),
  // our crew answers: cut-ins chaining upward, one per beat
  at('#19:2', v('cutin', { who: 'canelo', side: 'left', beats: 6, emote: 'attack', y: 880, h: 250, lines: 'speed', color: 'accent2' })),
  at('#20', v('cutin', { who: 'luzterna', side: 'right', beats: 4, emote: 'happy', y: 650, h: 250, lines: 'speed' })),
  at('#20:2', v('cutin', { who: '$crew0', side: 'left', beats: 2, emote: 'attack', y: 420, h: 250, lines: 'speed', color: 'accent2' })),
  at('#20:3', v('cutin', { who: '$crew1', side: 'right', beats: 1, emote: 'attack', y: 190, h: 250, lines: 'speed' })),
  hold(
    '#22',
    'first_drop',
    { id: 'brace', label: '¡FIRMES!', anchor: 'canelo' },
    { great: [v('brace', { r: 'great' })], hit: [v('brace', { r: 'hit' })], miss: [v('brace', { r: 'miss' })] },
  ),
  at('#22', v('charge', { prompt: 'brace', look: 'shield', beats: 8 })),
  key('#22', { 'cam.x': 660, 'cam.y': 470, 'cam.zoom': 1.32, 'cam.rot': 0.05 }, { beats: 8, ease: 'in' }),

  // ================================================================ CHORUS — the barrage (camera: top-down → POV/swing shots ↔ close set shots)
  at('first_drop', 'broadside', v('topDown', { dur: 1.25 }), v('impact', { invert: true, dur: 0.08 }), v('sfx', { text: '¡BOOM!', kata: 'ドーン', x: 1250, y: 260, size: 160, dur: 0.9 })),
  key('first_drop', { shards: 1 }, { dur: 0.3 }),

  ...BARRAGE.flatMap((t, n): ScoreEntry[] => [
    at(t, v('ball', { from: 'B', i: n % 3, to: `hull${n % 3}`, prompt: `ball${n}`, flight: 2 })),
    tap(
      t,
      { id: `ball${n}`, lead: 0.5, anchor: `ball${n}` },
      {
        great: [v('deflect', { i: n % 3, great: true }), v('impact', { dur: 0.07, invert: n % 2 === 0, at: 'canelo', inner: 260 })],
        hit: [v('deflect', { i: n % 3, great: false })],
        miss: [v('hullHit', { i: n % 3 })],
      },
    ),
    ...(SHOT_BALLS.has(n) ? [at(t, v('pov', { prompt: `ball${n}`, flight: 2 }), v('swing', { prompt: `ball${n}`, after: n === 6 ? 0.6 : 0.35 }))] : []),
  ]),
  // every other strong accent of the chorus is a ball splashing beside us (every «pum» is a bullet)
  on({ onsets: { track: 'snare', in: 'chorus', min: 0.3, minGap: 0.45, except: BARRAGE } }, v('ball', { from: 'B', i: 1, to: 'sea', flight: 1.5 })),
  // set shots between the swings: close on our deck (dutch), a whip to the galleon taking hits, the crew reacting
  key(46.495, { 'cam.x': 620, 'cam.y': 470, 'cam.zoom': 1.5, 'cam.rot': 0.07 }, { dur: 0.01 }),
  key(46.5, { 'cam.zoom': 1.35, 'cam.rot': 0.04 }, { dur: 1, ease: 'out' }),
  key(49.587, { 'cam.x': 1330, 'cam.y': 250, 'cam.zoom': 1.3, 'cam.rot': -0.09 }, { dur: 0.01 }),
  at(51.42, v('panels', { layout: 'grid4', dur: 0.55, stagger: 0.25, cells: [{ who: 'canelo', emote: 'happy', sfx: '¡JA!' }, { who: 'luzterna', emote: 'surprise', color: 'accent2' }, { who: '$crew0', emote: 'happy', color: 'accent2' }, { who: '$crew1', emote: 'surprise' }] })),
  key(51.97, { 'cam.x': 640, 'cam.y': 460, 'cam.zoom': 1.4, 'cam.rot': 0.06 }, { dur: 0.01 }),
  at(52.75, v('party', { mode: 'dance', dur: 0.72 }), v('sfx', { text: '¡JA, JA!', kata: 'アハハ', x: 1420, y: 420, size: 110, dur: 0.7 })),
  key(54.739, { 'cam.x': 1340, 'cam.y': 240, 'cam.zoom': 1.25, 'cam.rot': -0.06 }, { dur: 0.01 }),
  at(54.739, v('whip', { dx: -700, dur: 0.25 })),
  key(57.323, { 'cam.x': 960, 'cam.y': 410, 'cam.zoom': 0.95, 'cam.rot': 0.03 }, { dur: 0.01 }),
  key(57.33, { 'cam.zoom': 0.82, 'cam.rot': 0 }, { dur: 1.2, ease: 'out' }),

  // ================================================================ BREAK — she recovers
  key('break', { 'cam.x': 1330, 'cam.y': 150, 'cam.zoom': 1.45, 'cam.rot': 0, shards: 0, beams: 0.5, bars: 0.7 }, { beats: 2, ease: 'expoOut' }),
  at('break', v('recover', { dur: 2.4 })),
  at('#33', v('party', { mode: 'dance', beats: 4 })),
  at('#34', v('pose', { who: 'cascada', p: 'dance', beats: 4 })),
  at('#34', v('cutin', { who: 'cascada', side: 'right', beats: 5, emote: 'happy', lines: 'none', color: 'light', text: 'SLURP', kata: 'ズズッ', y: 560, h: 420 })),
  at('#35:1', v('party', { mode: 'wink', beats: 2 }), v('sfx', { text: '¡JA!', x: 1300, y: 300, size: 100, dur: 0.6, back: false })),
  at('#35:3', v('pose', { who: 'cascada', p: 'taunt', beats: 3 })),
  ...[60.458, 64.122, 65.954].map((t, n) => tap(t, { id: `confeti${n}`, optional: true, anchor: [330, 880] }, { great: ['throwConfetti'], hit: ['throwConfetti'] })),
  at(66.412, 'coconut'),
  key('#37', { 'cam.x': 640, 'cam.y': 420, 'cam.zoom': 1.0, bars: 0.4 }, { beats: 2, ease: 'inOut' }),
  key('#37', { kit: 1 }, { beats: 4, ease: 'outBack' }),
  at('#37', v('kitPuffs', { dur: 2 })),
  at('build_1', v('cutin', { who: 'canelo', side: 'left', beats: 4, emote: 'attack', lines: 'speed', text: '¡ARRIBA!', kata: 'アガレ' }), v('punch', { z: 0.06, dur: 0.3 })),
  key('build_1', { 'shipA.y': -640, bars: 0 }, { beats: 4, ease: 'in' }),

  // ================================================================ DROP — the sky chase (charge close-ups ↔ whip pans between the ships)
  at('drop', v('impact', { dur: 0.08 }), v('whip', { dx: 0, dy: -420, dur: 0.3 }), v('speed', { beats: 4, ang: -Math.PI / 2, n: 80, alpha: 0.8 }), v('sfx', { text: '¡VAMOS!', kata: 'ゴー', x: 960, y: 300, size: 150, dur: 0.9 })),
  key('drop', { 'shipB.y': -610, wind: 900, shards: 0.6, beams: 0, falls: 0, near: 1, floor: 1 }, { beats: 2, ease: 'out' }),
  // a dutch push-in under our hull as we lift
  key('drop', { 'cam.x': 640, 'cam.y': 120, 'cam.zoom': 1.35, 'cam.rot': 0.12 }, { dur: 0.01 }),
  key(71.46, { 'cam.zoom': 1.1, 'cam.rot': 0.04, 'cam.x': 900, 'cam.y': 60 }, { beats: 3, ease: 'out' }),
  mash('#40', '#43', { id: 'volley', need: [10, 22], label: '¡FUEGO!' }, {
    great: [v('volley', { n: 9, big: true }), v('impact', { dur: 0.08 }), v('sfx', { text: '¡FUEGO!', kata: 'ファイア', at: 'shipA', size: 150, dur: 0.8 })],
    hit: [v('volley', { n: 5 }), v('sfx', { text: '¡FUEGO!', kata: 'ファイア', at: 'shipA', size: 110, dur: 0.7 })],
    miss: [v('volley', { n: 2, weak: true }), v('sfx', { text: '¿fuego?', at: 'shipA', size: 70, dur: 0.6, back: false })],
  }),
  at('#40', v('chargeShot', { prompt: 'volley', beats: 4 })),
  at('#41', v('charge', { prompt: 'volley', look: 'fire', beats: 4 })),
  key('#41', { 'cam.x': 700, 'cam.y': 80, 'cam.zoom': 1.3, 'cam.rot': -0.08 }, { dur: 0.01 }),
  key('#41:2', { 'cam.x': 1250, 'cam.y': 40, 'cam.zoom': 1.2, 'cam.rot': 0.06 }, { dur: 0.16, ease: 'expoOut' }),
  at('#41:2', v('speed', { dur: 0.3, ang: 0, n: 60, alpha: 0.8 })),
  at('#42', v('chargeShot', { prompt: 'volley', beats: 4 })),
  key('#43', { 'cam.x': 900, 'cam.y': 60, 'cam.zoom': 0.95, 'cam.rot': 0 }, { dur: 0.01 }),
  // she barrel-rolls out of the volley and keeps flying UPSIDE DOWN (for her the sky is the floor)
  key('#43:1', { 'shipB.rot': Math.PI, 'shipB.y': -980, 'cam.x': 1100, 'cam.y': 40, 'cam.zoom': 0.95, 'cam.rot': -0.05 }, { beats: 2, ease: 'outBack' }),
  at(79.7, v('party', { mode: 'taunt', dur: 0.9 }), v('sfx', { text: '¡JA!', kata: 'ハハ', x: 1320, y: 260, size: 110, dur: 0.6 })),
  at(80.611, v('ball', { from: 'B', i: 0, to: 'miss', flight: 1.5 })),
  at(81.527, v('ball', { from: 'A', i: 0, to: 'B', flight: 1.2, apex: 120 })),
  at(82.901, v('ball', { from: 'A', i: 1, to: 'B', flight: 1.2, apex: 120 })),
  at(83.817, v('ball', { from: 'B', i: 2, to: 'miss', flight: 1.5 })),
  // the dogfight: whip pans between the ships on every other beat, the dutch flipping side
  ...[80.611, 81.527, 82.443, 83.359].map((t, i) => key(t, i % 2 ? { 'cam.x': 1250, 'cam.y': 30, 'cam.zoom': 1.15, 'cam.rot': -0.08 } : { 'cam.x': 680, 'cam.y': 70, 'cam.zoom': 1.15, 'cam.rot': 0.08 }, { dur: 0.17, ease: 'expoOut' })),
  ...[80.611, 81.527, 82.443, 83.359].map((t, i) => at(t, v('speed', { dur: 0.25, ang: i % 2 ? Math.PI : 0, n: 50, alpha: 0.7 }))),
  choice('#46', { id: 'dodge', fallback: 'left' }, { left: [v('dodge', { side: 'left' })], right: [v('dodge', { side: 'right' })] }),
  key('#45:3', { 'cam.x': 960, 'cam.y': 80, 'cam.zoom': 0.9, 'cam.rot': 0 }, { beats: 2, ease: 'inOut' }),
  at(86.106, v('panels', { layout: 'h2', beats: 4, stagger: 1, cells: [{ who: 'canelo', emote: 'attack', color: 'accent' }, { who: 'cascada', emote: 'happy', color: 'accent2' }] })),

  // ================================================================ BREAK2 — the standoff
  at('break2', v('panels', { layout: 'v3', beats: 12, stagger: 4, cells: [{ who: 'cascada', emote: 'happy' }, { who: 'canelo', emote: 'attack', color: 'accent2' }, { who: 'luzterna', emote: 'happy' }] })),
  key('break2', { 'shipB.rot': Math.PI * 2, 'shipB.y': -610, wind: 160, bars: 0.8, 'sun.y': 0.5, near: 0 }, { beats: 4, ease: 'inOut' }),
  key('#51', { 'cam.x': 960, 'cam.y': 110, 'cam.zoom': 0.78 }, { beats: 1, ease: 'expoOut' }),
  at('#51:2', v('coconut', { toss: true })),
  at('#52', v('cutin', { who: 'cascada', side: 'right', beats: 6, emote: 'attack', y: 300, h: 330, lines: 'speed', kata: 'カカッテキナ' }), v('cutin', { who: 'canelo', side: 'left', beats: 6, emote: 'attack', y: 780, h: 330, lines: 'speed', color: 'accent2', kata: 'イクゾ' })),
  hold('build_2', 'drop_3', { id: 'leap', release: true, label: '¡Y SUELTA!' }, {
    great: [v('leap', { power: 1.2 })],
    hit: [v('leap', { power: 0.9 })],
    miss: [v('leap', { power: 0.6, clumsy: true })],
  }),
  at('build_2', v('chargeShot', { prompt: 'leap', beats: 4 })),

  // ================================================================ DROP2 — the finale (the leap shot, clash close-ups, the hero shot)
  at('drop2', v('leapShot', { dur: 0.8 })),
  key('drop2', { shards: 1, beams: 1, wind: 500 }, { dur: 0.3 }),
  key(101.56, { 'cam.x': 1300, 'cam.y': 40, 'cam.zoom': 1.45, 'cam.rot': -0.1 }, { dur: 0.01 }),
  key(101.57, { 'cam.zoom': 1.15, 'cam.rot': -0.03 }, { beats: 4, ease: 'out' }),
  at('#55:2', v('fightCloud', { beats: 26 })),
  ...FIGHT.flatMap((t, n): ScoreEntry[] => [
    tap(t, { id: `pelea${n}`, anchor: 'cloud' }, { great: [v('clash', { win: true }), v('impact', { dur: 0.06, invert: n % 2 === 1, at: 'cloud', inner: 220 })], hit: [v('clash', { win: true, small: true })], miss: [v('clash', { win: false })] }),
    at(t, v('clashShot', { prompt: `pelea${n}`, dur: 0.55 })),
    // between the punches the camera keeps moving: alternate dutch push-ins on the cloud
    key(t + 0.55, n % 2 ? { 'cam.x': 1360, 'cam.y': 20, 'cam.zoom': 1.5, 'cam.rot': 0.09 } : { 'cam.x': 1240, 'cam.y': 60, 'cam.zoom': 1.05, 'cam.rot': -0.07 }, { dur: 0.01 }),
    key(t + 0.56, n % 2 ? { 'cam.zoom': 1.3, 'cam.rot': 0.05 } : { 'cam.zoom': 1.2, 'cam.rot': -0.03 }, { dur: 1, ease: 'out' }),
  ]),
  on({ onsets: { track: 'snare', in: ['#56', '#62'], min: 0.3, minGap: 0.4, except: FIGHT } }, v('burst', { at: 'cloud', r: 60, dur: 0.15, x: 0 })),
  at('#62', v('finale', { beats: 5 }), v('hero', { dur: 2.26 }), v('impact', { dur: 0.08 }), v('sfx', { text: '¡LIKY FIGHT!', kata: 'ファイト', x: 960, y: 230, size: 170, dur: 2.2 })),
  at(115.419, 'blast', v('punch', { z: 0.08, dur: 0.4 }), v('flash', { amount: 0.35, color: 'light', dur: 0.2 })),

  // ================================================================ SHOUT 1 — she blasts him home: round two
  at('shout_1', v('leap', { back: true, power: 1 }), v('impact', { dur: 0.08, invert: true }), v('sfx', { text: '¡OTRA VUELTA!', kata: 'ラウンド2', x: 960, y: 330, size: 150, dur: 1.3 })),
  key('shout_1', { 'cam.x': 960, 'cam.y': 70, 'cam.zoom': 0.86, 'cam.rot': 0.06 }, { dur: 0.01 }),
  key(115.86, { 'cam.rot': 0 }, { beats: 2, ease: 'out' }),

  // ================================================================ INTRO2 — up into the night above the clouds
  at('intro2', v('lowAngle', { dur: 1.1 }), v('speed', { beats: 8, ang: Math.PI / 2, n: 60, alpha: 0.55 })),
  key('intro2', { 'shipB.y': -1500, 'shipA.y': -1450, 'cam.y': -900, 'cam.x': 980, 'cam.zoom': 0.84, near: 0, wind: 300, beams: 1 }, { beats: 16, ease: 'inOut' }),
  at('silence_3', v('freeze', { dur: 0.256 })),
  tap(
    'silence_3',
    { id: 'stop3' },
    {
      great: [v('panels', { layout: 'diag2', dur: 0.7, stagger: 0, cells: [{ who: 'canelo', emote: 'attack', sfx: '¡SUBE!' }, { who: 'luzterna', emote: 'happy', color: 'accent2' }] })],
      hit: [v('panels', { layout: 'diag2', dur: 0.7, stagger: 0, cells: [{ who: 'canelo', emote: 'happy' }, { who: 'luzterna', emote: 'happy', color: 'accent2' }] })],
      miss: [v('panels', { layout: 'diag2', dur: 0.7, stagger: 0, cells: [{ who: 'canelo', emote: 'surprise', sfx: '¡¿EH?!' }, { who: 'luzterna', emote: 'surprise', color: 'accent2' }] }), v('pose', { who: 'canelo', p: 'trip', dur: 1 })],
    },
  ),
  at('big_hit_4', v('impact', { dur: 0.07 }), v('fireworks', { n: 4, dur: 1.6 }), v('sfx', { text: '¡MÁS ARRIBA!', kata: 'ウエヘ', x: 960, y: 300, size: 130, dur: 1 })),
  at('#66', v('party', { mode: 'dance', beats: 6 }), v('sfx', { text: '¡DJ!', kata: 'ミックス', x: 1420, y: 260, size: 100, dur: 1 })),
  key('#67:2', { 'cam.x': 1260, 'cam.y': -980, 'cam.zoom': 1.25, 'cam.rot': -0.07 }, { dur: 0.01 }),
  key('#67:3', { 'cam.zoom': 1.05, 'cam.rot': -0.02 }, { beats: 4, ease: 'out' }),
  at('#68:2', v('chargeShot', { beats: 4 })),
  at('big_hit_5', v('whip', { dx: 600, dur: 0.25 }), v('impact', { dur: 0.07 })),
  key('big_hit_5', { 'cam.x': 900, 'cam.y': -950, 'cam.zoom': 0.8, 'cam.rot': 0.05 }, { beats: 4, ease: 'out' }),
  at('#70', v('cutin', { who: 'cascada', side: 'right', beats: 4, emote: 'happy', lines: 'speed', y: 300, h: 330, kata: 'オドロウ' })),

  // ================================================================ VERSE2 — the moon dance (the bass leads: the ships sway around each other)
  key('verse2', { 'sun.y': 0.42, 'cam.x': 960, 'cam.y': -980, 'cam.zoom': 0.78, 'cam.rot': 0 }, { beats: 4, ease: 'inOut' }),
  key('verse2', { 'shipB.y': -1280, 'shipA.y': -1620, 'shipB.x': -140, 'shipA.x': 140 }, { beats: 8, ease: 'sineInOut' }),
  key('#76', { 'shipB.y': -1600, 'shipA.y': -1320, 'shipB.x': 0, 'shipA.x': 0 }, { beats: 8, ease: 'sineInOut' }),
  at('silence_4', v('freeze', { dur: 0.267 })),
  tap(
    'silence_4',
    { id: 'stop4' },
    {
      great: [v('panels', { layout: 'h2', dur: 0.75, stagger: 0, cells: [{ who: 'luzterna', emote: 'happy', color: 'accent2' }, { who: 'canelo', emote: 'happy', sfx: '¡OLÉ!' }] })],
      hit: [v('panels', { layout: 'h2', dur: 0.7, stagger: 0, cells: [{ who: 'luzterna', emote: 'happy', color: 'accent2' }, { who: 'canelo', emote: 'happy' }] })],
      miss: [v('panels', { layout: 'h2', dur: 0.7, stagger: 0, cells: [{ who: 'luzterna', emote: 'surprise', color: 'accent2' }, { who: 'canelo', emote: 'sleepy', sfx: '…' }] })],
    },
  ),
  at('#74', v('party', { mode: 'wink', beats: 3 })),
  key('#75', { 'cam.x': 700, 'cam.y': -960, 'cam.zoom': 1.3, 'cam.rot': 0.08 }, { dur: 0.01 }),
  key('#75:1', { 'cam.zoom': 1.1, 'cam.rot': 0.03, 'cam.x': 960 }, { beats: 6, ease: 'out' }),
  at('silence_5', v('freeze', { dur: 0.244 })),
  tap(
    'silence_5',
    { id: 'stop5' },
    {
      great: [v('panels', { layout: 'grid4', dur: 0.75, stagger: 0, cells: [{ who: 'canelo', emote: 'happy', sfx: '¡SÍ!' }, { who: 'cascada', emote: 'happy', color: 'accent2' }, { who: '$crew0', emote: 'happy', color: 'accent2' }, { who: '$crew1', emote: 'happy' }] })],
      hit: [v('panels', { layout: 'grid4', dur: 0.7, stagger: 0, cells: [{ who: 'canelo', emote: 'happy' }, { who: 'cascada', emote: 'happy', color: 'accent2' }, { who: '$crew0', emote: 'happy', color: 'accent2' }, { who: '$crew1', emote: 'happy' }] })],
      miss: [v('panels', { layout: 'grid4', dur: 0.7, stagger: 0, cells: [{ who: 'canelo', emote: 'surprise', sfx: '¡UY!' }, { who: 'cascada', emote: 'happy', color: 'accent2' }, { who: '$crew0', emote: 'surprise', color: 'accent2' }, { who: '$crew1', emote: 'surprise' }] })],
    },
  ),
  at('big_hit_6', v('impact', { dur: 0.07 }), v('fireworks', { n: 5, dur: 1.8 })),
  at('#78', v('cutin', { who: 'luzterna', side: 'left', beats: 4, emote: 'happy', lines: 'focus', y: 320, h: 330, color: 'accent2', kata: 'ヒカリ' })),
  at('shout_2', v('cutin', { who: 'cascada', side: 'right', beats: 2.5, emote: 'attack', lines: 'focus', text: '¡AHORA!', kata: 'イマ', textSize: 110 }), v('impact', { dur: 0.07, invert: true })),

  // ================================================================ PRECHORUS2 — the disco ball becomes a cannon · Canelo charges (MASH)
  key('prechorus2', { 'cam.x': 1300, 'cam.y': -1250, 'cam.zoom': 1.15, 'cam.rot': -0.06, shards: 0.6 }, { beats: 2, ease: 'expoOut' }),
  at('#82', v('discoCharge', { beats: 24 })),
  at('#82', v('pose', { who: 'cascada', p: 'point', beats: 12 })),
  key('#83', { 'cam.x': 960, 'cam.y': -1050, 'cam.zoom': 0.82, 'cam.rot': 0 }, { beats: 4, ease: 'inOut' }),
  at('#84', v('cutin', { who: 'canelo', side: 'left', beats: 4, emote: 'attack', y: 880, h: 250, lines: 'speed', color: 'accent2' })),
  at('#84:1', v('cutin', { who: 'luzterna', side: 'right', beats: 3, emote: 'happy', y: 650, h: 250, lines: 'speed' })),
  at('#84:2', v('cutin', { who: '$crew0', side: 'left', beats: 2, emote: 'attack', y: 420, h: 250, lines: 'speed', color: 'accent2' })),
  at('#84:3', v('cutin', { who: '$crew1', side: 'right', beats: 1, emote: 'attack', y: 190, h: 250, lines: 'speed' })),
  mash('#85', 'chorus2', { id: 'carga', need: [10, 22], label: '¡CARGA!' }, {
    great: [v('counter', { r: 'great' }), v('impact', { dur: 0.08 }), v('sfx', { text: '¡CHOQUE!', kata: 'ゲキトツ', x: 960, y: 300, size: 150, dur: 0.9 })],
    hit: [v('counter', { r: 'hit' }), v('sfx', { text: '¡CHOQUE!', kata: 'ゲキトツ', x: 960, y: 300, size: 120, dur: 0.8 })],
    miss: [v('counter', { r: 'miss' }), v('hullHit', { i: 1 })],
  }),
  at('#85', v('chargeShot', { prompt: 'carga', beats: 4 })),
  at('#86', v('charge', { prompt: 'carga', look: 'fire', beats: 4 })),
  key('#86', { 'cam.x': 700, 'cam.y': -1000, 'cam.zoom': 1.3, 'cam.rot': 0.07 }, { dur: 0.01 }),
  at('#87', v('chargeShot', { prompt: 'carga', beats: 4 })),

  // ================================================================ CHORUS2 — the counterattack: Canelo fires on every accent we tap
  key('chorus2', { 'cam.x': 960, 'cam.y': -1050, 'cam.zoom': 0.84, 'cam.rot': 0, shards: 1 }, { dur: 0.01 }),
  at('chorus2', v('speed', { beats: 4, ang: 0, n: 70, alpha: 0.75 })),
  ...COUNTER.flatMap((t, n): ScoreEntry[] => [
    tap(
      t,
      { id: `fuego${n}`, lead: 1, anchor: COUNTER_SHOT.has(n) ? `fuego${n}` : 'canelo' },
      {
        great: [v('counter', { r: 'great' }), v('impact', { dur: 0.06, invert: n % 2 === 1 })],
        hit: [v('counter', { r: 'hit' })],
        miss: [v('counter', { r: 'miss' })],
      },
    ),
    ...(COUNTER_SHOT.has(n) ? [at(t, v('swing', { prompt: `fuego${n}`, out: true, after: 0.4 }))] : []),
    key(t + 0.42, n % 2 ? { 'cam.x': 1300, 'cam.y': -1150, 'cam.zoom': 1.2, 'cam.rot': -0.08 } : { 'cam.x': 700, 'cam.y': -1000, 'cam.zoom': 1.15, 'cam.rot': 0.07 }, { dur: 0.01 }),
    key(t + 0.43, { 'cam.zoom': 0.95, 'cam.rot': 0 }, { dur: 0.9, ease: 'out' }),
  ]),

  // ================================================================ BREAK3 — a DANCE-OFF under the disco ball
  key('break3', { 'cam.x': 1300, 'cam.y': -1050, 'cam.zoom': 1.4, bars: 0.6, shards: 0 }, { beats: 2, ease: 'expoOut' }),
  at('break3', v('party', { mode: 'dance', beats: 6 })),
  at('#97:2', v('party', { who: 'canelo', mode: 'dance', beats: 6 }), v('sfx', { text: '¡TE COPIO!', kata: 'マネ', x: 1400, y: 300, size: 100, dur: 1 })),
  at('#99', v('party', { mode: 'wink', beats: 4 })),
  at('#100', v('party', { who: 'canelo', mode: 'taunt', beats: 4 })),
  ...[177.71, 181.374, 185.038].map((t, n) => tap(t, { id: `baile${n}`, optional: true, anchor: [330, 880] }, { great: [v('sfx', { text: '¡ESO!', x: 520, y: 760, size: 90, dur: 0.6 }), v('sparkle', { x: 520, y: 700, n: 6, r: 30 })], hit: [v('sfx', { text: '¡ESO!', x: 520, y: 760, size: 80, dur: 0.5 })] })),
  at('build_3', v('cutin', { who: 'cascada', side: 'right', beats: 4, emote: 'attack', y: 300, h: 330, lines: 'speed', kata: 'マダマダ' }), v('cutin', { who: 'canelo', side: 'left', beats: 4, emote: 'attack', y: 780, h: 330, lines: 'speed', color: 'accent2', kata: 'イクゾ' })),
  key('build_3', { bars: 0 }, { beats: 2 }),

  // ================================================================ DROP3 — through the upside-down islands (TAP: bat the falling rocks)
  at('drop3', v('impact', { dur: 0.08 }), v('whip', { dx: 0, dy: -380, dur: 0.3 }), v('speed', { beats: 8, ang: Math.PI, n: 80, alpha: 0.7 }), v('sfx', { text: '¡A LAS ISLAS!', kata: 'シマヘ', x: 960, y: 300, size: 130, dur: 1 })),
  key('drop3', { islandsNear: 1, near: 1, wind: 1300, 'cam.x': 960, 'cam.y': -1000, 'cam.zoom': 0.86, 'cam.rot': 0.05 }, { beats: 2, ease: 'out' }),
  ...ROCKS.flatMap((t, n): ScoreEntry[] => [
    tap(
      t,
      { id: `roca${n}`, lead: 1, anchor: `roca${n}` },
      {
        great: [v('impact', { dur: 0.06, invert: n % 2 === 0 }), v('sfx', { text: '¡CRAC!', kata: 'バキッ', x: 1400, y: 300, size: 120, dur: 0.6 })],
        hit: [v('sfx', { text: '¡TOC!', kata: 'コン', x: 1400, y: 320, size: 90, dur: 0.5 })],
        miss: [v('hullHit', { i: n % 3 })],
      },
    ),
    at(t, v('swing', { prompt: `roca${n}`, obj: 'rock', after: 0.38 })),
    key(t + 0.4, n % 2 ? { 'cam.x': 1250, 'cam.y': -1080, 'cam.zoom': 1.15, 'cam.rot': -0.07 } : { 'cam.x': 680, 'cam.y': -980, 'cam.zoom': 1.1, 'cam.rot': 0.07 }, { dur: 0.17, ease: 'expoOut' }),
  ]),
  at('#110:2', v('party', { mode: 'taunt', beats: 3 }), v('sfx', { text: '¡JA!', kata: 'ハハ', x: 1320, y: 260, size: 100, dur: 0.6 })),

  // ================================================================ BREAK4 — dawn: the last standoff
  key('break4', { islandsNear: 0, near: 0, wind: 160, 'sun.y': 0.85, bars: 0.8, 'cam.x': 960, 'cam.y': -1000, 'cam.zoom': 0.8, 'cam.rot': 0 }, { beats: 2, ease: 'inOut' }),
  key('break4', { 'sun.y': 0.48 }, { beats: 24, ease: 'out' }),
  at('break4', v('panels', { layout: 'v3', beats: 12, stagger: 4, cells: [{ who: 'cascada', emote: 'happy' }, { who: 'canelo', emote: 'happy', color: 'accent2' }, { who: 'luzterna', emote: 'happy' }] })),
  at('#115', v('cutin', { who: 'luzterna', side: 'left', beats: 4, emote: 'happy', lines: 'none', color: 'light', y: 540, h: 400, kata: 'アサ' })),
  hold('build_4', 'climax', { id: 'salto', release: true, label: '¡Y SUELTA!' }, {
    great: [v('leap', { power: 1.25 })],
    hit: [v('leap', { power: 0.95 })],
    miss: [v('leap', { power: 0.6, clumsy: true })],
  }),
  at('build_4', v('chargeShot', { prompt: 'salto', beats: 4 })),

  // ================================================================ CLIMAX — both leap, the fight in the air, fireworks, the hero shot
  at('climax', v('leapShot', { prompt: 'salto', dur: 0.8 }), v('leapShot', { who: 'cascada', dir: -1, power: 1.1, dur: 0.8 }, { dt: 0.81 })),
  key('climax', { shards: 1, beams: 1, wind: 600, bars: 0 }, { dur: 0.3 }),
  key(219.7, { 'cam.x': 1300, 'cam.y': -1170, 'cam.zoom': 1.4, 'cam.rot': -0.1 }, { dur: 0.01 }),
  key(219.71, { 'cam.zoom': 1.15, 'cam.rot': -0.03 }, { beats: 4, ease: 'out' }),
  at(219.7, v('fightCloud', { beats: 24 })),
  ...CLIMAX.flatMap((t, n): ScoreEntry[] => [
    tap(t, { id: `final${n}`, anchor: 'cloud' }, { great: [v('clash', { win: true }), v('impact', { dur: 0.06, invert: n % 2 === 0, at: 'cloud', inner: 220 })], hit: [v('clash', { win: true, small: true })], miss: [v('clash', { win: false })] }),
    at(t, v('clashShot', { prompt: `final${n}`, dur: 0.55 })),
    key(t + 0.55, n % 2 ? { 'cam.x': 1360, 'cam.y': -1190, 'cam.zoom': 1.5, 'cam.rot': 0.09 } : { 'cam.x': 1240, 'cam.y': -1150, 'cam.zoom': 1.05, 'cam.rot': -0.07 }, { dur: 0.01 }),
    key(t + 0.56, n % 2 ? { 'cam.zoom': 1.3, 'cam.rot': 0.05 } : { 'cam.zoom': 1.2, 'cam.rot': -0.03 }, { dur: 1, ease: 'out' }),
  ]),
  on({ onsets: { track: 'kick', in: ['#119', '#126'], min: 0.4, every: 4 } }, v('fireworks', { n: 2, dur: 1.4 })),
  at(230.84, v('finale', { beats: 8 }), v('hero', { dur: 3.66 }), v('impact', { dur: 0.08 }), v('sfx', { text: '¡LIKY FIGHT!', kata: 'ファイト', x: 960, y: 230, size: 180, dur: 3.4 })),
  on({ onsets: { track: 'kick', in: [230.84, 234.5], min: 0.3 } }, v('fireworks', { n: 2, dur: 1.2 })),
  at('last_bar', v('grade', { dur: 4.2 })),

  // ================================================================ OUTRO — the party goes out, one light at a time
  key('outro', { lightsOff: 9, beams: 0, shards: 0, 'cam.x': 1100, 'cam.y': -1000, 'cam.zoom': 0.86 }, { dur: 2.2, ease: 'linear' }),
  at('outro', v('sfx', { text: '¡QUÉ FIESTA!', kata: 'オワリ', x: 960, y: 360, size: 140, dur: 2.3 }), v('confetti', { x: 960, y: 200, n: 60, vy: -300, spread: 1600, dur: 2.4, g: 500 })),

  // ================================================================ everywhere: with no sound the frame keeps the beat
  on({ beats: { in: [0, 236.8] } }, 'beat'),
];

export const LIKY_FIGHT: MomentoDef = {
  id: 'liky_fight',
  track: 'liky_fight',
  title: 'LIKY FIGHT',
  mission: 'H44',
  battle: { id: 'cielo_invertidas', fase: 'cielo' },
  // THE WHOLE SONG (the owner: «la animación tiene que ocupar toda la canción»); the cut is the song's last breath
  cut: 236.9,
  // the battle music takes over after it
  tail: 'keep',
  palettes: {
    intro: 'noir', verse: 'dusk', prechorus: 'rise', chorus: 'drop', break: 'moon', drop: 'chase', break2: 'gold', drop2: 'finale',
    intro2: 'stratos', verse2: 'neon', prechorus2: 'rise', chorus2: 'drop', break3: 'neon', drop3: 'chase', break4: 'dawn', climax: 'finale', outro: 'dawn',
  },
  score,
  stage: () => import('./stage').then((m) => m.default as unknown as (h: unknown) => unknown),
  unlocks: ['liky_fight'],
};
