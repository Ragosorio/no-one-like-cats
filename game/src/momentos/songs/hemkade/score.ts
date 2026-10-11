/**
 * HEMKADE — the choreography (H57 · El Leviatán Invertido, the layer change sea → sky), THE WHOLE SONG (219.6 s).
 * 160 BPM, bar = 1.5 s, '#n' = bar n. Full sheet + style guide: docs/part-ii/29 §16.
 *
 * Four near-identical drops, each a bigger escalation of the same climb, and three melodic breaks drawn as copperplate
 * PLATES (the same 3D world in GRABADO style, drawn in line by line on the melody):
 *
 *   intro    the deep: our hull up at the surface, a shape passing beneath; the eye opens (TAP: hold its gaze)
 *   build    the chains come out of the sea, taut; the swell rises (MASH: open the wings)
 *   drop     THE BREACH — belly-up out of the sea in chains; shoot the order seals on the accents (TAP ×9, CHOICE)
 *   build2   hauled up in jerks on the stutter kicks, the sea pouring off it (HOLD → RELEASE: take off after it)
 *   break    LÁM. I — the plate: the eye, the orders, the crew watching (bonus taps); the roar cracks the plate
 *   drop2    THE STORM — lightning on the accents, rain, seals (TAP ×7, MASH the broadside, CHOICE)
 *   build3   out of the storm top (HOLD → RELEASE on big_hit_3: the starfire; the first chain snaps)
 *   break2   LÁM. II — it sings; NO CANTES on the seals (bonus taps)
 *   build4   the cloud sea below, gold (HOLD → RELEASE into the drop)
 *   drop3    THE SKY — the whole crew gives everything: a cut-in per shot (TAP ×11)
 *   build5   leaving the air; the roars (CHOICE), big_hit_5 (TAP: the second chain)
 *   break3   LÁM. III — a celestial atlas, gold on indigo (HOLD → RELEASE into the climax)
 *   climax   THE STARS — the rift tears open; the drill run around the body (TAP ×9), everyone (MASH): THE LINE cracks,
 *            three chains snap at once on the triple accent
 *   outro    the last chains yank it back down on the stutter kicks, into the sea of clouds — where the fight goes on
 */
import type { MomentoDef, ScoreEntry } from '../../types';
import { at, choice, hold, key, mash, on, tap, v } from '../../score';

const BAR = 1.5;
const LEAD = 0.5;
const X = { dur: 0 };

/** tap targets: measured ACCENT onsets (snare / crash / stab, strength ≥ 0.6) — beatmaps/hemkade.onsets.json */
export const DROP1 = [26.25, 28.125, 29.812, 31.5, 33.75, 35.625, 38.25, 41.812, 47.25];
export const DROP2 = [73.125, 74.625, 76.125, 77.625, 78.75, 81.375, 82.875, 89.625, 91.5];
export const DROP3 = [136.125, 137.812, 139.5, 141.0, 143.625, 145.125, 147.75, 149.25, 150.75, 153.375, 154.875];
export const CLIMAX = [181.5, 182.625, 184.5, 185.625, 188.25, 191.25, 193.5, 194.625, 195.75];

/** prompt id → the seal it shoots (stage.ts derives the seals' state from the judgements) */
export const SEAL_OF: Record<string, number> = {};

const WORDS: [string, string][] = [
  ['¡CRAC!', 'バキッ'],
  ['¡ZAS!', 'ザン'],
  ['¡FUERA!', 'ドケ'],
  ['¡ROTO!', 'パリン'],
  ['¡TOMA!', 'ドーン'],
  ['¡LIBRE!', 'ジユウ'],
];
const CREW = ['canelo', 'luzterna', '$crew0', '$crew1'];

/** one shot at a seal: cut to it as the prompt appears, the beam on the beat, a sweep shot after */
function sealTap(id: string, t: number, n: number, seal: number, o: { shot?: string; after?: Record<string, number | string>; cutin?: string; side?: 'left' | 'right'; slamY?: number } = {}): ScoreEntry[] {
  SEAL_OF[id] = seal;
  const [w, kt] = WORDS[n % WORDS.length];
  const out: ScoreEntry[] = [
    key(t - LEAD * BAR, { shot: o.shot ?? 'deck', 'sh.s': seal }, X),
    tap(
      t,
      { id, lead: LEAD, anchor: `seal${seal}` },
      {
        great: [v('fire', { seal, r: 'great' }), v('impact', { dur: 0.06, invert: n % 2 === 0, at: `seal${seal}`, inner: 230 }), v('slam', { text: w, kata: kt, size: 150, x: n % 2 ? 1380 : 560, y: o.slamY ?? 300, rot: n % 2 ? 0.07 : -0.09, dur: 0.75 })],
        hit: [v('fire', { seal, r: 'hit' }), v('slam', { text: '¡TOC!', size: 96, x: n % 2 ? 1400 : 540, y: 320, dur: 0.5, color: 'accent2' })],
        miss: [v('fire', { seal, r: 'miss' }), v('slam', { text: '¡CLANK!', size: 86, x: 960, y: 760, dur: 0.6, color: 'shadow', fill: 0xd8d4e8 }), v('emote', { who: 'canelo', e: 'hurt', dur: 0.8 })],
      },
    ),
  ];
  if (o.cutin) out.push(at(t - LEAD * BAR, v('cutin', { who: o.cutin, side: o.side ?? 'left', dur: LEAD * BAR - 0.05, emote: 'attack', lines: 'speed', y: o.side === 'right' ? 300 : 790, h: 300, color: 'accent' })));
  if (o.after) out.push(key(t + 0.36, o.after, X));
  return out;
}

/** the stutter hauls: each kick jerks the body (and its line) up by `dy` */
function hauls(times: number[], y0: number, dy: number): ScoreEntry[] {
  return times.map((t, i) => key(t, { 'lev.y': y0 + dy * (i + 1) }, { dur: 0.16, ease: 'expoOut' }));
}

// shot shorthands (after-shots between the taps)
const ORBIT = (a: number, d = 640, h = 90) => ({ shot: 'orbit', 'sh.a': a, 'sh.d': d, 'sh.h': h });
const FLANK = (d = 90, h = 20) => ({ shot: 'flank', 'sh.d': d, 'sh.h': h, 'sh.p': 0 });

const score: ScoreEntry[] = [
  // ================================================================ INTRO (0–12) — the deep
  at(0, v('coldOpen', { dur: 1.6 })),
  key(0, { shot: 'abyss', 'lev.y': -95, 'lev.x': -520, 'lev.eye': 0, 'ship.dx': 560, 'ship.dz': 140, 'ship.sea': 1, 'ship.yaw': 0.25, 'line.dy': 980, strain: 0.15, swell: 0.8, chop: 0.7, storm: 1, 'sun.el': 0.12, 'sun.az': 0.9, 'fog.near': 300, 'fog.far': 4200, 'fog.max': 0.85 }, X),
  // the shape slides beneath our hull (the ship stays: dx is relative, so it counts down as the body passes)
  key(0, { 'lev.x': -60, 'ship.dx': 100 }, { dur: 9, ease: 'sineInOut' }),
  key('#4', { shot: 'eye', 'sh.d': 125, 'sh.f': 40, 'sh.p': 1 }, X),
  key('shout_1', { 'sh.p': 0 }, X),
  key('#4', { 'lev.eye': 0.08 }, X),
  key('shout_1', { 'lev.eye': 1 }, { dur: 0.18, ease: 'expoOut' }),
  at('shout_1', v('roar', { dur: 0.9 }), v('burst', { kind: 'mist', at: 'head', n: 2, scale: 2 })),
  tap('shout_1', { id: 'mirada', anchor: 'eye', label: 'MÍRALO' }, {
    great: [v('look', { x: 0.6, y: 0.2, dur: 3 }), v('wash', { color: 'accent', amount: 0.2, dur: 0.9 })],
    hit: [v('look', { x: 0.35, y: 0.1, dur: 2 })],
    miss: [v('look', { x: -0.3, y: -0.2, dur: 1.2 })],
  }),
  key('#6', { shot: 'surface', 'sh.h': 6 }, X),
  key('#6', { 'sun.el': 0.18 }, { dur: 3 }),
  key('#7', { shot: 'chain', 'sh.s': 0 }, X),
  key('#7', { strain: 0.5 }, { beats: 4, ease: 'in' }),

  // ================================================================ BUILD (12–24) — the chains come out taut, the swell rises
  key('build', { shot: 'rise', 'sh.s': 1, 'sh.a': 0.6, 'sh.d': 170 }, X),
  key('build', { 'lev.y': -70, swell: 1.4, chop: 1.2, breach: 0.25, strain: 0.7 }, { beats: 28, ease: 'in' }),
  at('shout_2', v('roar', { dur: 1 }), v('slam', { text: 'GRRRM', kata: 'ゴゴゴ', size: 110, x: 1440, y: 820, rot: 0.05, dur: 1, color: 'accent2' })),
  key('#9', { shot: 'surface', 'sh.h': 4 }, X),
  key('#10', { shot: 'deck', 'sh.s': 3 }, X),
  at('#10', v('emote', { who: 'canelo', e: 'surprise', beats: 4 })),
  key('#11', { shot: 'eye', 'sh.d': 70, 'sh.f': 38 }, X),
  at('shout_3', v('roar', { dur: 0.8 })),
  key('#11:2', { shot: 'orbit', 'sh.a': 1.9, 'sh.d': 520, 'sh.h': 40 }, X),
  mash('#12', 'first_drop', { id: 'alas', need: [10, 22], label: '¡ALAS!', anchor: 'ship' }, {
    great: [v('burst', { kind: 'star', at: 'ship', scale: 3, n: 2 }), v('slam', { text: '¡ALAS!', kata: 'ツバサ', size: 120, x: 1450, y: 830, rot: 0.06, dur: 0.8, color: 'accent2' })],
    hit: [v('burst', { kind: 'star', at: 'ship', scale: 2 })],
    miss: [v('jolt', { amt: 2.6, dur: 0.9 }), v('slam', { text: '¿ALAS?', size: 90, x: 640, y: 320, dur: 0.6, color: 'shadow' })],
  }),
  at('#12', v('wingsMash', { prompt: 'alas', beats: 16 })),
  key('#12', { shot: 'hero', 'sh.h': 0 }, X),
  key('#13', { shot: 'chase', 'sh.h': 4 }, X),
  key('#14', { shot: 'deck', 'sh.s': 1 }, X),
  at('#14', v('cutin', { who: 'canelo', side: 'left', beats: 4, emote: 'attack', lines: 'speed', y: 820, h: 280, color: 'accent' })),
  at('#14:2', v('cutin', { who: 'luzterna', side: 'right', beats: 2, emote: 'surprise', lines: 'speed', y: 600, h: 260, color: 'accent2' })),
  at('#15', v('cutin', { who: '$crew0', side: 'left', beats: 1, emote: 'attack', lines: 'speed', y: 380, h: 240, color: 'accent' })),
  at('#15:1', v('cutin', { who: '$crew1', side: 'right', beats: 1, emote: 'attack', lines: 'speed', y: 170, h: 240, color: 'accent2' })),
  key('#15:2', { shot: 'breach', 'sh.a': 0 }, X),
  key('#15:2', { breach: 1, 'lev.y': -40 }, { beats: 2, ease: 'in' }),

  // ================================================================ DROP (24–48) — THE BREACH
  at('first_drop', v('impact', { invert: true, dur: 0.08 }), v('slam', { text: '¡LEVIATÁN!', kata: 'リヴァイアサン', size: 210, y: 300, dur: 1.4 }), v('speed', { beats: 6, ang: -Math.PI / 2, n: 80, alpha: 0.7 }), v('burst', { kind: 'spray', at: 'sea', n: 4, scale: 4.5, dur: 3 }), v('burst', { kind: 'mist', at: 'sea', n: 3, scale: 4, dur: 3 }), v('shake', { amp: 26, dur: 0.9 })),
  key('first_drop', { 'lev.y': 60, 'lev.pitch': 0.34, cascade: 1, 'lev.wet': 1, 'sun.el': 0.62, 'sun.az': 0.5, 'fog.near': 700, 'fog.far': 7000, 'fog.max': 0.65, storm: 0.25, strain: 0.85, 'line.dy': 820 }, { beats: 6, ease: 'outBack' }),
  key('first_drop', { breach: 0.15, swell: 1.6 }, { beats: 8, ease: 'out' }),
  key('first_drop', { 'ship.wings': 1, 'ship.thrust': 0.5, 'ship.dz': 230 }, { beats: 2, ease: 'outBack' }),
  key('#17', FLANK(110, 16), X),
  key('#17', { 'sh.p': 1 }, { beats: 4, ease: 'linear' }),
  ...sealTap('s1a', DROP1[0], 0, 0, { after: ORBIT(0.4, 760, 120) }),
  ...sealTap('s1b', DROP1[1], 1, 6, { shot: 'chain', after: { shot: 'under', 'sh.a': 0.4, 'sh.h': 0 } }),
  ...sealTap('s1c', DROP1[2], 2, 1, { shot: 'top', after: { shot: 'hero', 'sh.h': 4 } }),
  at('big_hit_1', v('shake', { amp: 20, dur: 0.5 })),
  ...sealTap('s1d', DROP1[3], 3, 7, { after: FLANK(140, 30) }),
  key(31.9, { 'sh.p': 1 }, { beats: 4 }),
  at('#21', v('burst', { kind: 'spray', at: 'sea', n: 3, scale: 4 })),
  ...sealTap('s1e', DROP1[4], 4, 2, { shot: 'chain', after: ORBIT(2.2, 600, 60) }),
  // the main line enters (36.0): it SINGS — rings of light run along it (stage), a slow orbit in the light
  ...sealTap('s1f', DROP1[5], 5, 8, { after: { ...ORBIT(2.9, 560, 110) } }),
  key(36.0, { 'sh.a': 4.4 }, { beats: 8, ease: 'inOut' }),
  ...sealTap('s1g', DROP1[6], 6, 3, { shot: 'top', after: { shot: 'eye', 'sh.d': 60, 'sh.f': 34 } }),
  at(38.7, v('look', { x: 0.5, y: 0.3, dur: 2.4 })),
  key('#26', { shot: 'flank', 'sh.d': 70, 'sh.h': 6, 'sh.p': 0.2 }, X),
  key('#26', { 'sh.p': 0.9 }, { beats: 6 }),
  ...sealTap('s1h', DROP1[7], 7, 9, { shot: 'deck', after: { shot: 'tail' } }),
  // the flukes sweep at us: over or under?
  choice('#29:2', { id: 'cola', fallback: 'left', lead: LEAD, label: '¿ARRIBA?' }, {
    left: [v('dodge', { side: 'up' }), v('slam', { text: '¡ARRIBA!', kata: 'ウエ', size: 130, x: 700, y: 300, dur: 0.7 })],
    right: [v('dodge', { side: 'down' }), v('slam', { text: '¡ABAJO!', kata: 'シタ', size: 130, x: 1220, y: 760, dur: 0.7 })],
  }),
  key('#30', { shot: 'chase', 'sh.h': 6 }, X),
  key('#31', { shot: 'breach', 'sh.a': 1 }, X),
  key('#31', { 'lev.y': 110 }, { beats: 4, ease: 'inOut' }),
  ...sealTap('s1i', DROP1[8], 8, 4, { shot: 'top', after: { shot: 'top', 'sh.d': 900 } }),

  // ================================================================ BUILD2 (48–60) — hauled up in jerks, the sea pouring off it
  key('build2', { shot: 'under', 'sh.a': 1.2, 'sh.h': 40 }, X),
  key('build2', { breach: 0, swell: 1.1, cascade: 0.8, strain: 1 }, { beats: 8 }),
  ...hauls([50.625, 50.906, 51.188, 54.0, 57.0, 57.188, 57.375], 110, 22),
  at(50.625, v('snapShake', {})),
  at(54.0, v('snapShake', {})),
  key('#34', { shot: 'top', 'sh.d': 700 }, X),
  key('#35', { shot: 'deck', 'sh.s': 4 }, X),
  hold('#34', '#38', { id: 'despegue', release: true, label: '¡SUELTA!', anchor: 'ship' }, {
    great: [v('burst', { kind: 'star', at: 'ship', scale: 4, n: 3 }), v('slam', { text: '¡DESPEGUE!', kata: 'ハッシン', size: 170, y: 320, dur: 1.1 }), v('impact', { dur: 0.07 })],
    hit: [v('burst', { kind: 'star', at: 'ship', scale: 3, n: 2 }), v('slam', { text: '¡ARRIBA!', size: 120, y: 320, dur: 0.8 })],
    miss: [v('jolt', { amt: 3, dur: 1 }), v('burst', { kind: 'mist', at: 'ship', scale: 2 }), v('slam', { text: 'PFFF…', size: 90, y: 760, dur: 0.8, color: 'shadow' })],
  }),
  at('#34', v('charge', { prompt: 'despegue', beats: 16 })),
  key('#36', { shot: 'hero', 'sh.h': -2 }, X),
  key('#37', { shot: 'chase', 'sh.h': 8 }, X),
  // the launch (always): off the sea, after it
  key('#38', { 'ship.sea': 0, 'ship.dy': 70, 'ship.thrust': 1, 'ship.pitch': 0.25, speed: 0.8 }, { beats: 4, ease: 'expoOut' }),
  key('#38', { shot: 'chase', 'sh.h': 2 }, X),
  key('#39', { 'ship.pitch': 0.05, speed: 0.3 }, { beats: 3 }),
  key('#39', { shot: 'orbit', 'sh.a': 5.6, 'sh.d': 900, 'sh.h': 120 }, X),

  // ================================================================ BREAK (60–72) — LÁM. I, the plate
  key('break', { wipe: 1 }, { beats: 1, ease: 'in' }),
  key('break+0:1', { style: 1, wipe: 0, plate: 'sepia' }, X),
  key('break', { shot: 'plate', 'sh.a': 1.35, 'sh.d': 1100, 'sh.h': 60, 'sh.f': 40, speed: 0, 'ship.thrust': 0.4, cascade: 0.4, strain: 0.7 }, X),
  key('break', { 'lev.y': 320, 'ship.dy': 60, 'ship.dz': 260 }, { beats: 48, ease: 'sineInOut' }),
  at('break', v('plate', { title: 'LÁM. I', sub: 'EL LEVIATÁN INVERTIDO', beats: 31.6 })),
  key('#43', { shot: 'eye', 'sh.d': 84, 'sh.f': 30 }, X),
  at('#43', v('look', { x: 0.55, y: 0.25, dur: 4.4 })),
  key('#46', { shot: 'deck', 'sh.s': 5 }, X),
  key('#45', { shot: 'chain', 'sh.s': 5 }, X),
  ...[62.625, 64.875, 68.625].map((t, i) => tap(t, { id: `canto${i}`, optional: true, anchor: 'eye' }, { great: [v('burst', { kind: 'ink', at: 'heart', n: 2, scale: 3 }), v('look', { x: 0.6, y: 0.3, dur: 1 })], hit: [v('burst', { kind: 'ink', at: 'heart', scale: 2 })] })),
  // shout_4: the roar cracks the plate (2 bars before the storm)
  key('shout_4', { shot: 'eye', 'sh.d': 40, 'sh.f': 44 }, X),
  at('shout_4', v('roar', { dur: 1.4 })),

  // ================================================================ DROP2 (72–96) — THE STORM
  key('drop_2', { style: 0 }, X),
  at('drop_2', v('smash', { x: 960, y: 540 }), v('impact', { dur: 0.08, invert: true }), v('slam', { text: '¡TORMENTA!', kata: 'アラシ', size: 200, y: 300, dur: 1.3 }), v('shake', { amp: 24, dur: 0.8 })),
  key('drop_2', { shot: 'flank', 'sh.d': 130, 'sh.h': 30, 'sh.p': 0.1, rain: 1, storm: 1, cascade: 0, 'lev.wet': 0.5, 'fog.near': 60, 'fog.far': 1500, 'fog.max': 0.93, 'sun.el': 0.4, speed: 0.6, 'ship.thrust': 0.9 }, X),
  key('drop_2', { 'lev.y': 640, 'ship.dy': 50 }, { beats: 64, ease: 'linear' }),
  on({ onsets: { track: 'snare', in: 'drop2', min: 0.6, minGap: 0.6 } }, 'bolt'),
  ...sealTap('s2a', DROP2[0], 9, 10, { shot: 'deck', after: { shot: 'chase', 'sh.h': 4 } }),
  ...sealTap('s2b', DROP2[1], 10, 5, { shot: 'chain', after: FLANK(120, 26) }),
  ...sealTap('s2c', DROP2[2], 11, 11, { shot: 'deck', after: { shot: 'eye', 'sh.d': 64, 'sh.f': 36 } }),
  ...sealTap('s2d', DROP2[3], 12, 0, { shot: 'top', after: { shot: 'under', 'sh.a': 3.1, 'sh.h': 20 } }),
  ...sealTap('s2e', DROP2[4], 13, 6, { shot: 'chain', after: ORBIT(3.5, 420, 30) }),
  key(79.5, { 'sh.a': 4.6 }, { beats: 5, ease: 'inOut' }),
  ...sealTap('s2f', DROP2[5], 14, 1, { shot: 'deck', after: { shot: 'hero', 'sh.h': 2 } }),
  ...sealTap('s2g', DROP2[6], 15, 7, { shot: 'chain', after: { shot: 'chase', 'sh.h': 2 } }),
  // the broadside: everyone on the guns at the wrap chain
  mash('#56', '#59', { id: 'andanada', need: [10, 22], lead: LEAD, label: '¡FUEGO!', anchor: 'heart' }, {
    great: [v('volley', { n: 9 }), v('slam', { text: '¡ANDANADA!', kata: 'イッセイ', size: 170, y: 300, dur: 1 }), v('impact', { dur: 0.07 })],
    hit: [v('volley', { n: 5 }), v('slam', { text: '¡FUEGO!', size: 130, y: 300, dur: 0.8 })],
    miss: [v('volley', { n: 2 }), v('slam', { text: '¿fuego?', size: 80, y: 760, dur: 0.6, color: 'shadow' })],
  }),
  at('#56', v('charge', { prompt: 'andanada', beats: 18 })),
  key('#56', { shot: 'hero', 'sh.h': 0 }, X),
  key('#57', { shot: 'deck', 'sh.s': -1 }, X),
  key('#57:2', ORBIT(5.2, 380, 20), X),
  key('#58', { shot: 'chase', 'sh.h': 10 }, X),
  key('#58:2', { shot: 'under', 'sh.a': 5.5, 'sh.h': 0 }, X),
  ...sealTap('s2h', DROP2[7], 16, 2, { shot: 'top', after: FLANK(80, 10) }),
  key(90.0, { 'sh.p': 0.8 }, { beats: 4 }),
  ...sealTap('s2i', DROP2[8], 17, 8, { shot: 'deck', after: { shot: 'tail' } }),
  // a link the size of a house falls at us
  choice(93.75, { id: 'eslabon', fallback: 'right', lead: LEAD, label: '¿LADO?' }, {
    left: [v('dodge', { side: 'left' }), v('slam', { text: '¡IZQUIERDA!', size: 110, x: 640, y: 300, dur: 0.7 })],
    right: [v('dodge', { side: 'right' }), v('slam', { text: '¡DERECHA!', size: 110, x: 1280, y: 300, dur: 0.7 })],
  }),
  at(93.75, v('bigLink', { dur: 1.6 })),
  key(94.2, { shot: 'chase', 'sh.h': 14 }, X),

  // ================================================================ BUILD3 (96–106.5) — out of the storm top
  key('build3', { shot: 'orbit', 'sh.a': 0.2, 'sh.d': 470, 'sh.h': 110, rain: 0, speed: 0.2 }, X),
  key('build3', { 'lev.y': 860, storm: 0.15, 'fog.near': 900, 'fog.far': 9000, 'fog.max': 0.55, 'sun.el': 0.3, 'sun.az': 0.8 }, { beats: 28, ease: 'inOut' }),
  key('#67', { pal: 'hGilt' }, { beats: 4 }),
  hold('#66', 'big_hit_3', { id: 'carga', release: true, label: '¡CARGA!', anchor: 'bow' }, {
    great: [v('mega', { power: 1 }), v('slam', { text: '¡ROMPE!', kata: 'コワセ', size: 190, y: 300, dur: 1.2 }), v('impact', { dur: 0.08, invert: true })],
    hit: [v('mega', { power: 0.7 }), v('slam', { text: '¡ROMPE!', size: 140, y: 300, dur: 0.9 })],
    miss: [v('mega', { power: 0.4 }), v('jolt', { amt: 2.4, dur: 0.9 })],
  }),
  at('#66', v('charge', { prompt: 'carga', beats: 23 })),
  key('#66', { shot: 'deck', 'sh.s': -1 }, X),
  key('#68', { shot: 'hero', 'sh.h': 4 }, X),
  key('#69', { shot: 'chase', 'sh.h': 2 }, X),
  key(103.9, { shot: 'top', 'sh.d': 640 }, X),
  at('big_hit_3', v('snap', { c: 1 })),
  key(104.95, { shot: 'under', 'sh.a': 0.6, 'sh.h': 30 }, X),

  // ================================================================ BREAK2 (106.5–120) — LÁM. II, it sings
  key('breakdown_2', { wipe: 1 }, { beats: 1, ease: 'in' }),
  key('breakdown_2+0:1', { style: 1, wipe: 0, plate: 'gilt' }, X),
  key('breakdown_2', { shot: 'plate', 'sh.a': 2.2, 'sh.d': 980, 'sh.h': 30, 'sh.f': 42, speed: 0, 'lev.maw': 0.4 }, X),
  key('breakdown_2', { 'lev.y': 930 }, { beats: 54, ease: 'sineInOut' }),
  at('breakdown_2', v('plate', { title: 'LÁM. II', sub: 'LA CANCIÓN', beats: 35.6 })),
  key('#74', { shot: 'chain', 'sh.s': 3 }, X),
  key('#76', { shot: 'eye', 'sh.d': 90, 'sh.f': 32 }, X),
  at('#76', v('look', { x: 0.4, y: 0.35, dur: 3 })),
  key('#78', { shot: 'deck', 'sh.s': -1 }, X),
  ...[107.625, 112.5, 115.5].map((t, i) => tap(t, { id: `canto${i + 3}`, optional: true, anchor: 'heart' }, { great: [v('burst', { kind: 'ink', at: 'heart', n: 3, scale: 3 })], hit: [v('burst', { kind: 'ink', at: 'heart', scale: 2 })] })),
  key('#80', { 'lev.maw': 0 }, { beats: 2 }),

  // ================================================================ BUILD4 (120–132) — above the clouds, gold
  key('build4', { style: 0 }, X),
  at('build4', v('smash', { x: 1300, y: 420, paper: 0xf6ead0, ink: 0x3a2410 })),
  key('build4', { shot: 'hero', 'sh.h': 6, 'ship.thrust': 0.8, speed: 0.4, 'sun.el': 0.24, 'sun.az': 0.7, 'sun.size': 0.006 }, X),
  key('build4', { 'lev.y': 1100, 'ship.dy': 70 }, { beats: 48, ease: 'in' }),
  key('#82', ORBIT(0.9, 760, 140), X),
  key('#82', { 'sh.a': 2 }, { beats: 8 }),
  hold('#84', 'drop_3', { id: 'maquina', release: true, label: '¡Y SUELTA!', anchor: 'ship' }, {
    great: [v('burst', { kind: 'star', at: 'ship', scale: 5, n: 3 }), v('impact', { dur: 0.07 })],
    hit: [v('burst', { kind: 'star', at: 'ship', scale: 3 })],
    miss: [v('jolt', { amt: 2, dur: 0.8 })],
  }),
  at('#84', v('charge', { prompt: 'maquina', beats: 24 })),
  key('#84', { shot: 'chase', 'sh.h': 6 }, X),
  key('#86', { shot: 'deck', 'sh.s': -1 }, X),
  at('#86', v('cutin', { who: 'canelo', side: 'left', beats: 4, emote: 'attack', lines: 'speed', y: 540, h: 420, color: 'accent', kata: 'イクゾ' })),

  // ================================================================ DROP3 (132–156) — THE SKY: the whole crew
  at('drop_3', v('impact', { invert: true, dur: 0.08 }), v('slam', { text: '¡AL CIELO!', kata: 'ソラヘ', size: 210, y: 300, dur: 1.3 }), v('speed', { beats: 8, ang: Math.PI, n: 90, alpha: 0.7 }), v('shake', { amp: 22, dur: 0.7 })),
  key('drop_3', { shot: 'hero', 'sh.h': 4, speed: 0.8, 'ship.thrust': 1 }, X),
  key('drop_3', { 'lev.y': 1800, 'ship.dy': 60 }, { beats: 96, ease: 'linear' }),
  ...DROP3.flatMap((t, i) =>
    sealTap(`s3${String.fromCharCode(97 + i)}`, t, 18 + i, (i * 5 + 3) % 12, {
      shot: ['deck', 'chain', 'top'][i % 3],
      cutin: CREW[i % 4],
      side: i % 2 ? 'right' : 'left',
      after: [ORBIT(1 + i * 0.7, 700, 120), FLANK(100, 20), { shot: 'hero', 'sh.h': 4 }, { shot: 'chase', 'sh.h': 6 }][i % 4],
    }),
  ),
  at('big_hit_4', v('shake', { amp: 18, dur: 0.5 })),

  // ================================================================ BUILD5 (156–168) — leaving the air
  key('build5', { shot: 'orbit', 'sh.a': 3.2, 'sh.d': 820, 'sh.h': 260, speed: 0.3 }, X),
  key('build5', { 'lev.y': 2400, stars: 0.6, 'fog.max': 0.2, 'sun.el': 0.1, 'sun.size': 0.003 }, { beats: 48, ease: 'in' }),
  choice('shout_5', { id: 'rugido', fallback: 'left', lead: LEAD, label: '¿POR DÓNDE?' }, {
    left: [v('dodge', { side: 'up' }), v('slam', { text: '¡POR ARRIBA!', size: 110, x: 700, y: 300, dur: 0.7 })],
    right: [v('dodge', { side: 'down' }), v('slam', { text: '¡POR ABAJO!', size: 110, x: 1220, y: 760, dur: 0.7 })],
  }),
  key('shout_5', { shot: 'flank', 'sh.d': 150, 'sh.h': 40, 'sh.p': 0.05 }, X),
  at('shout_5', v('roar', { dur: 1.4 })),
  key(160.8, { shot: 'chase', 'sh.h': 8 }, X),
  key('shout_6', { shot: 'eye', 'sh.d': 44, 'sh.f': 30 }, X),
  at('shout_6', v('roar', { dur: 1.2 }), v('look', { x: 0.5, y: 0.4, dur: 1.8 })),
  ...sealTap('s5', 164.625, 30, 9, { shot: 'deck', after: { shot: 'under', 'sh.a': 0.3, 'sh.h': 60 } }),
  at('big_hit_5', v('snap', { c: 4 })),
  key(166.0, { shot: 'top', 'sh.d': 900 }, X),

  // ================================================================ BREAK3 (168–180) — LÁM. III, the celestial atlas
  key('breakdown_3', { wipe: 1 }, { beats: 1, ease: 'in' }),
  key('breakdown_3+0:1', { style: 1, wipe: 0, plate: 'atlas' }, X),
  key('breakdown_3', { shot: 'plate', 'sh.a': 3.6, 'sh.d': 1200, 'sh.h': -80, 'sh.f': 44, speed: 0, stars: 1 }, X),
  key('breakdown_3', { 'lev.y': 2550 }, { beats: 48, ease: 'sineInOut' }),
  at('breakdown_3', v('plate', { title: 'LÁM. III', sub: 'ENTRE LAS ESTRELLAS', beats: 31.6, ink: 0xffd27a, paper: 0x0e1238 })),
  key('#114', { shot: 'eye', 'sh.d': 70, 'sh.f': 34 }, X),
  at('#114', v('look', { x: 0.5, y: 0.3, dur: 3 })),
  ...[170.625, 172.875].map((t, i) => tap(t, { id: `canto${i + 6}`, optional: true, anchor: 'eye' }, { great: [v('burst', { kind: 'ink', at: 'heart', n: 3, scale: 3 })], hit: [v('burst', { kind: 'ink', at: 'heart', scale: 2 })] })),
  hold('#116', 'climax', { id: 'todo', release: true, label: '¡CON TODO!', anchor: 'bow' }, {
    great: [v('mega', { power: 1.2 }), v('impact', { dur: 0.08, invert: true })],
    hit: [v('mega', { power: 0.8 })],
    miss: [v('mega', { power: 0.45 }), v('jolt', { amt: 2.6, dur: 0.9 })],
  }),
  at('#116', v('charge', { prompt: 'todo', beats: 24 })),
  key('#116', { shot: 'deck', 'sh.s': -1 }, X),
  key('#118', { shot: 'hero', 'sh.h': 2 }, X),

  // ================================================================ CLIMAX (180–204) — THE STARS: the rift, the drill run, THE LINE
  key('climax', { style: 0, reform: 0 }, X),
  at('climax', v('smash', { x: 960, y: 380, paper: 0x0e1238, ink: 0xffd27a }), v('slam', { text: '¡MÁS ALLÁ!', kata: 'ソノサキヘ', size: 210, y: 300, dur: 1.4 }), v('spiral', { beats: 12, alpha: 0.5 }), v('shake', { amp: 26, dur: 0.9 })),
  key('climax', { shot: 'spiral', 'sh.a': 0, 'sh.p': 0, stars: 1, nebula: 1, speed: 1, 'ship.thrust': 1, 'fog.max': 0, 'line.dy': 640 }, X),
  key('climax', { rift: 1 }, { beats: 16, ease: 'out' }),
  key('climax', { 'lev.y': 3400, 'ship.dy': 50 }, { beats: 96, ease: 'linear' }),
  ...CLIMAX.flatMap((t, i) => sealTap(`sc${i}`, t, 40 + i, (i * 7 + 2) % 12, { shot: ['top', 'deck', 'chain'][i % 3], after: { shot: 'spiral', 'sh.a': i * 1.3, 'sh.p': (i * 0.17) % 0.8 } })),
  at('shout_7', v('roar', { dur: 1.6 }), v('look', { x: 0.6, y: 0.3, dur: 2 })),
  key('shout_7', { shot: 'eye', 'sh.d': 170, 'sh.f': 52 }, X),
  key(187.0, { shot: 'spiral', 'sh.a': 2 }, X),
  at(189.0, v('spiral', { beats: 6, alpha: 0.45 })),
  // everyone, at THE LINE
  mash('#132', '#135', { id: 'todos', need: [12, 26], lead: LEAD, label: '¡TODOS!', anchor: 'bow' }, {
    great: [v('mega', { power: 1.4, line: true }), v('slam', { text: '¡JUNTOS!', kata: 'イッショニ', size: 200, y: 300, dur: 1.2 }), v('impact', { dur: 0.08 })],
    hit: [v('mega', { power: 1, line: true }), v('slam', { text: '¡JUNTOS!', size: 150, y: 300, dur: 1 })],
    miss: [v('mega', { power: 0.6, line: true })],
  }),
  at('#132', v('charge', { prompt: 'todos', beats: 12 })),
  key('#132', { shot: 'deck', 'sh.s': -1 }, X),
  at('#132', v('cutin', { who: 'canelo', side: 'left', beats: 3, emote: 'attack', lines: 'speed', y: 820, h: 260, color: 'accent' })),
  at('#132:3', v('cutin', { who: 'luzterna', side: 'right', beats: 3, emote: 'attack', lines: 'speed', y: 620, h: 260, color: 'accent2' })),
  at('#133:2', v('cutin', { who: '$crew0', side: 'left', beats: 3, emote: 'attack', lines: 'speed', y: 420, h: 260, color: 'accent' })),
  at('#134:1', v('cutin', { who: '$crew1', side: 'right', beats: 3, emote: 'attack', lines: 'speed', y: 220, h: 260, color: 'accent2' })),
  key('#134', { shot: 'top', 'sh.d': 520 }, X),
  key('#135', { lineCrack: 0.7 }, { beats: 2, ease: 'expoOut' }),
  key('#135', { shot: 'under', 'sh.a': 1.8, 'sh.h': 120 }, X),
  // the triple accent: three chains at once
  at(203.625, v('snap', { c: 0 }), v('impact', { dur: 0.06, invert: true })),
  at(203.719, v('snap', { c: 3 })),
  at(203.812, v('snap', { c: 5 }), v('shake', { amp: 30, dur: 1 })),

  // ================================================================ OUTRO (204–219.6) — yanked back down into the sea of clouds
  key('outro', { shot: 'fall', speed: 0.5, rift: 0.7, nebula: 0.3, strain: 1, 'line.dy': 900 }, X),
  key('outro', { stars: 0.2, 'fog.max': 0.5, 'sun.el': 0.08, 'sun.az': 1.2, 'sun.size': 0.008 }, { beats: 24, ease: 'inOut' }),
  ...[207.188, 209.531, 210.188, 213.188, 213.375].map((t, i) => key(t, { 'lev.y': 3400 - (i + 1) * 380 }, { dur: 0.35, ease: 'expoOut' })),
  key(213.375, { 'lev.y': 1280 }, { dur: 2.2, ease: 'out' }),
  at(207.188, v('roar', { dur: 0.8 })),
  key(208.0, { shot: 'eye', 'sh.d': 120, 'sh.f': 46 }, X),
  at(208.0, v('look', { x: 0.55, y: 0.35, dur: 3.5 })),
  key(211.5, { shot: 'chase', 'sh.h': 10 }, X),
  key(214.5, { shot: 'hero', 'sh.h': 6, speed: 0 }, X),
  tap('big_hit_6', { id: 'final', label: '¡VAMOS!', anchor: 'ship' }, {
    great: [v('slam', { text: '¡VAMOS!', kata: 'イクゾ', size: 190, y: 300, dur: 1.6 }), v('burst', { kind: 'star', at: 'ship', scale: 4, n: 2 }), v('emote', { who: 'canelo', e: 'attack', dur: 2 })],
    hit: [v('slam', { text: '¡VAMOS!', size: 140, y: 300, dur: 1.3 })],
    miss: [v('emote', { who: 'canelo', e: 'surprise', dur: 1.5 })],
  }),
  at(214.6, v('gradeCard', { dur: 3.9 })),

  // ================================================================ everywhere: with no sound the frame keeps the beat
  on({ beats: { in: [0, 218.6] } }, 'beat'),
];

export const HEMKADE: MomentoDef = {
  id: 'hemkade',
  track: 'hemkade',
  title: 'HEMKADE',
  mission: 'H57',
  // the battle hook is FasesFx's interlude (fases.ts registerFaseInterlude, see ./index.ts), not BattleScene's own:
  // no `battle` field here, so the Momento plays exactly once at the sea → sky change
  // THE WHOLE SONG; the cut is its last breath (silence from 217.93, the map's `end` 218.65)
  cut: 'end',
  tail: 'release',
  palettes: {
    intro: 'hAbyss', build: 'hSwell', drop: 'hBreach', build2: 'hBreach', break: 'hPlate', drop2: 'hStorm', build3: 'hStorm',
    break2: 'hPlate', build4: 'hGilt', drop3: 'hGilt', build5: 'hHigh', break3: 'hAtlas', climax: 'hAstral', outro: 'hFall',
  },
  score,
  stage: () => import('./stage').then((m) => m.default as unknown as (h: unknown) => unknown),
  unlocks: ['hemkade'],
};
