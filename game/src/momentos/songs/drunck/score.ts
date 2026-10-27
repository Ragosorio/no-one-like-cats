/**
 * «DRUNCK» — the choreography of the Parte III prologue (H66, La Última Ronda): Canelo tells the Partes I and II as a
 * drunk remembers them, in 70 seconds of hardstyle. THE WHOLE SONG (0 → the dry cut of c49), untouched. Song time; 165
 * BPM, a bar is 1.4545 s; c<n> in the comments = bar n of the script (1-based, docs/part-iii/04 §3).
 *
 * Round 3 (docs/part-iii/13 §3.3): THE BAR IS THE STAGE OF MEMORY. Every memory comes OUT of an object of the bar (the
 * camera pushes in, the object opens into the set: `door()`) and the story keeps coming back to Canelo at the bar.
 * TWO RHYTHMS: the ideas that must be UNDERSTOOD get ≥ 2 bars and go present → show → consequence (a readable reaction);
 * the flurries (to FEEL) go fast, between two readable shots, and the bosses' styles INVADE the bar.
 *
 * Every anchor below is a MEASURED onset or marker of agent D's beat map (data/music/beatmaps/drunck.json,
 * drunck.onsets.json — from the exported mix): the loose kicks of the intro, the rolls, the breaths, the kick cut, the
 * filter opening and the dry cut. The 14 inputs sit where they always did.
 *
 *  c1–9    «El trago»          the bar (¡HIC!) → he drinks: the glass bends the bar, the MUG opens into a sea of beer
 *                              (scale: a tiny raft, his giant eye beyond the glass) · LEGIBLE «Yo dormía. En una caja.»
 *                              (the baby asleep in his box, held) · c9 ¡SALUD! back at the bar
 *  c9–17   «Parte I»           he slaps the counter's NEWSPAPER: it opens into the front pages, his cut-out jumping from
 *                              photo to photo (¡EXTRA! ×5) · LEGIBLE c16 Nadie's lie: the shadow comes in from the page's
 *                              edge, rises, his paw stamps MENTIRA and it tears — a blank page (the OYENTE)
 *  c17–25  «Oleadas 1–2»       the page slaps on the TALLY BOARD (LEGIBLE: REGISTRO 000, «antes del uno»: the board
 *                              opens into the card, 000 before the Capi's 001) · FLURRY in 3 hits: the INK invades the
 *                              bar («¡Shhh!») · the Admiral, ¿CUÁNTOS?, the correction white floods the fleet · the
 *                              window NEON bends into the galleon, up to the white city · c24.6 FREEZE: the bar's TV shows
 *                              your lighthouse, its beam goes OUT of the screen (LEGIBLE: «La luz…»)
 *  c25–33  «Oleada 3»          SINCRO (¡OTRA!) · the tug · LEGIBLE c27–28 the static kitten only he sees (Maneki looks:
 *                              nothing) · the GRAFFITI invades the bar from the bathroom door · the BOARD opens into the
 *                              logbook (the same hand) and the hospital chart · the chain he breaks · c32 the OYENTE
 *  c33–41  «El borde»          the mug's wet RING bleeds into watercolor (four memories) · 1930: his burp, color breaks
 *                              out in a wave · LEGIBLE c39 «Tres bandos.» (one per beat, named) · c40 the page comes down
 *                              by your lighthouse · c40.75 everyone turns to look at him (¡HIC-HIC-HIC!)
 *  c41–49  «La página»         he slumps on the NAPKIN: it opens into the page · LEGIBLE «Todos miran. Todos esperan. A
 *                              mí.» (the nights, every side in a bubble with its eyes, the bottom of the glass, HIS FACE
 *                              held) · the spiral, the flap, the slide · c48 «Me fui.» · c49 ¡PUM! and silence
 */
import type { MomentoDef, ScoreEntry } from '../../types';
import { at, key, mash, on, tap, v } from '../../score';

/** bar length (s) and bar n of the script (1-based, as 04 §3 counts) */
export const BAR = 60 / 165 * 4;
export const c = (n: number) => Math.round((n - 1) * BAR * 1000) / 1000;

/** the four hiccups: c1 (a bonus on the very first frame), c3, c5, c7 — the intro's loose kicks */
export const HICS = [0, 2.909, 5.818, 8.727];
/** ¡SALUD!: c9, the first drop (the continuous kick comes in) */
export const SALUD = 11.636;
/** ¡EXTRA! ×5: the downbeats of c11–c15 (kicks) */
export const EXTRAS = [14.546, 16.0, 17.454, 18.909, 20.364];
/** ¡OTRA!: c25 = the kick comes back after the cut */
export const OTRA = 34.909;
/** ¡HIC-HIC-HIC!: from half a bar before the roll (c40.5, an accent) to c41 (the climax downbeat) */
export const MASH = [57.455, 58.182] as const;
/** ¡PUM!: c49 — the song's dry cut (marker `cut`) */
export const PUM = 69.818;
/** the Momento's last frame: one beat after the slam (the song's tail rings on under the bar's silence, released) */
export const CUT = 70.18;
/** the choice «¿CUÁNTOS?» (own UI, ungraded like YONOSE's thumbnails): open on the page's cut (c21), decided on c21.75 */
export const CHOICE = { open: 29.091, decide: 30.909 } as const;
/** the kick cut (c24.649) → back (c25): the freeze frame of the lighthouse */
export const KICK_CUT = [34.399, 34.909] as const;
/** the c16 breath (Nadie's lie) */
export const LIE = 21.818;

/**
 * THE IDEA MAP (docs/part-iii/13 §3.3) as data, for the tests and the status report: what must be understood, from
 * which bar to which bar (≥ 2 bars, or the measured stop it lives in), and which object of the bar it comes out of.
 */
export const IDEAS: { id: string; from: number; to: number; obj?: string }[] = [
  { id: 'dormia', from: c(5), to: c(9) },
  { id: 'mentira', from: c(15) + BAR * 0.75, to: c(17) },
  { id: 'ficha', from: c(17) + BAR * 0.5, to: c(19) + BAR * 0.5, obj: 'board' },
  { id: 'luz', from: KICK_CUT[0], to: KICK_CUT[1], obj: 'tv' },
  { id: 'gatito', from: c(27), to: c(29) },
  { id: 'bandos', from: c(38) + BAR * 0.75, to: c(40) + BAR * 0.75 },
  { id: 'pagina', from: 58.6, to: c(46) + BAR * 0.42, obj: 'napkin' },
];

/** a scene switch (a hard cut: TV editing) */
const scn = (t: number, name: string, extra: Record<string, number | string> = {}): ScoreEntry => key(t, { scn: name, ...extra }, { dur: 0 });
/**
 * THE DOORWAY: an object of the bar opens into a memory. The bar camera is already on the object; from t0 to t1 the
 * object's quad grows to the frame with the memory growing out of it (stage.ts door()); at t1 the memory is the scene.
 */
const door = (t0: number, t1: number, obj: string, memory: string, extra: Record<string, number | string> = {}): ScoreEntry[] => [
  key(t0, { in: memory, obj, inP: 0 }, { dur: 0 }),
  key(t0 + 0.001, { inP: 1 }, { dur: t1 - t0 - 0.001, ease: 'linear' }),
  scn(t1, memory, { in: '', inP: 0, ...extra }),
];
/** the bar's camera (bar world px; the listener rule clamps it) */
const bcam = (x: number, y: number, z: number, r = 0) => ({ 'b.x': x, 'b.y': y, 'b.z': z, 'b.r': r });
const BCAM = {
  open: bcam(923, 470, 1.45),
  canelo: bcam(1130, 500, 1.9),
  mug: bcam(1267, 547, 4.6, -0.04),
  paper: bcam(893, 705, 3.4),
  board: bcam(250, 140, 3.0),
  ink: bcam(900, 520, 1.5),
  inkIn: bcam(980, 480, 1.8, 0.03),
  neon: bcam(90, 355, 3.2),
  tv: bcam(1080, 300, 1.9),
  doorClose: bcam(-350, 420, 1.6),
  doorWide: bcam(456, 470, 0.85),
  ring: bcam(1303, 770, 3.4),
  napkin: bcam(1216, 620, 2.6, 0.04),
};
/** Canelo's balloon (1–4 words, on the strong beat) */
const globo = (t: number, text: string, o: Record<string, unknown> = {}) => at(t, v('globo', { text, ...o }));
/** the OYENTE's balloon: from the right edge, no name, no portrait, another typeface each time */
const oyente = (t: number) => at(t, v('oyente', { text: '¿Y luego?' }));
const CAM0 = { 'cam.x': 960, 'cam.y': 540, 'cam.zoom': 1, 'cam.rot': 0 };

const score: ScoreEntry[] = [
  // ================================================================ INTRO c1–9 «El trago»
  // c1 ¡HIC! — the whole bar jumps a frame; the labels of the bottles turn into blank pages
  scn(0, 'bar', { ...CAM0, ...BCAM.open, blank: 0, sweep: 0, can: 'idle', paper: 1, soak: 0, bend: 0 }),
  at(0, v('hic', { big: 1 }), v('pow', { text: '¡HIC!', at: [1180, 250], size: 150, dur: 0.9 })),
  key(0.06, { blank: 1 }, { dur: 0.3, ease: 'step' }),
  tap(HICS[0], { id: 'hic0', label: '¡HIC!', anchor: 'canelo', optional: true, lead: 0.5 }, { great: [v('hicCatch', { n: 0 })], hit: [v('hicCatch', { n: 0 })] }),
  // c2 the trago: the mug up to his mouth; the camera pushes INTO it and the glass bends the bar around it
  key(c(2), { can: 'drink' }, { dur: 0 }),
  key(1.6, BCAM.mug, { dur: 0.85, ease: 'in' }),
  key(1.6, { bend: 1 }, { dur: 0.85, ease: 'in' }),
  // c2.875 (the kick, big hit): the mug opens into a sea of beer — amber, dim; the bubbles rise like stars
  ...door(2.45, 2.727, 'tarro', 'pint'),
  at(2.727, v('hic', {}), v('bubbleBurst', { n: 16 })),
  // the filter opening (238 Hz → 9 kHz) is the camera falling into the beer and clearing
  key(2.727, { sweep: 0.05 }, { dur: 0.01 }),
  key(2.8, { sweep: 1 }, { dur: 3.2, ease: 'out' }),
  tap(HICS[1], { id: 'hic1', label: '¡HIC!', anchor: 'canelo' }, { great: [v('hicCatch', { n: 1 }), v('punch', { z: 0.05 })], hit: [v('hicCatch', { n: 1 })], miss: [v('hicMiss', {})] }),
  // c4.75 (roll) → c5: up to the surface: the foam curls into waves; a TINY raft in a giant mug, his eye beyond the glass
  key(5.455, { foamWave: 1 }, { dur: 0.36, ease: 'out' }),
  key(5.818, { raft: 1 }, { dur: 0.3, ease: 'outBack' }),
  globo(5.818, 'Yo dormía.', { pos: [470, 640] }),
  tap(HICS[2], { id: 'hic2', label: '¡HIC!', anchor: 'canelo' }, { great: [v('hicCatch', { n: 2 }), v('punch', { z: 0.05 })], hit: [v('hicCatch', { n: 2 })], miss: [v('hicMiss', {})] }),
  // c6.875–c7: a palm and a box sprout; LEGIBLE: the camera comes to the box — baby Canelo asleep in it, held
  key(8.546, { palm: 1 }, { dur: 0.35, ease: 'outBack' }),
  globo(8.727, 'En una caja.', { dur: 2.2, pos: [560, 330] }),
  tap(HICS[3], { id: 'hic3', label: '¡HIC!', anchor: 'canelo' }, { great: [v('hicCatch', { n: 3 }), v('punch', { z: 0.05 })], hit: [v('hicCatch', { n: 3 })], miss: [v('hicMiss', {})] }),
  // c8.75 (roll): the camera dives into the box (the pint's own camera) …
  // c9 ¡SALUD! — … and the foam BURSTS out of the mug, back at the bar: he toasts toward whoever is on his right
  tap(
    SALUD,
    { id: 'salud', label: '¡SALUD!', anchor: 'center' },
    {
      great: [v('clink', {}), v('foamWave', { big: 1 }), v('impact', { dur: 0.07, lines: true }), v('pow', { text: '¡SALUD!', at: [560, 220], size: 160, dur: 1 })],
      hit: [v('clink', {}), v('foamWave', { big: 0.6 }), v('pow', { text: '¡SALUD!', at: [560, 220], size: 120, dur: 0.9 })],
      miss: [v('foamSpill', {})],
    },
  ),
  at(SALUD, v('foamBurst', { dur: 0.6 })),
  // ================================================================ DROP c9–17 «La Parte I, en primera plana»
  scn(SALUD, 'bar', { ...BCAM.canelo, can: 'toast', sweep: 1, bend: 0 }),
  // he slaps the counter's NEWSPAPER (the foam soaks it); the camera dives in; it opens into the front pages
  key(12.0, { can: 'slap' }, { dur: 0 }),
  key(12.0, BCAM.paper, { dur: 0.36, ease: 'in' }),
  key(12.12, { soak: 1 }, { dur: 0.2, ease: 'out' }),
  ...door(12.182, 12.545, 'diario', 'diario', { pal: 'diario' }),
  at(12.364, v('portada', { n: 0 })),
  globo(12.6, 'Una muerta me despertó.', { pos: [250, 470] }),
  at(c(10), v('portada', { n: 1 })),
  globo(c(10) + BAR * 0.5, '¡Un pato!', { pos: [240, 520] }),
  // c11–c15: the front page falls on the downbeat whatever you do; his cut-out jumps into it; a good tap: his paw
  // stamps it «¡VISTO!» in a puff of dust; a miss leaves it crooked
  ...EXTRAS.flatMap((t, i): ScoreEntry[] => [
    at(t, v('portada', { n: i + 2 })),
    tap(
      t,
      { id: `extra${i}`, label: '¡EXTRA!', anchor: 'page', lead: i === 0 ? 1 : 0.75 },
      {
        great: [v('stamp', { n: i + 2, good: 1 }), v('punch', { z: 0.04 })],
        hit: [v('stamp', { n: i + 2, good: 1 })],
        miss: [v('stamp', { n: i + 2, good: 0 })],
      },
    ),
  ]),
  globo(c(11) + BAR * 0.5, '¡Pirata!', { pos: [240, 470] }),
  globo(c(12) + BAR * 0.5, '¡Piedra! ¡Pulpo!', { pos: [240, 520] }),
  globo(c(13) + BAR * 0.5, '¡Ratero!', { pos: [240, 470] }),
  globo(c(14) + BAR * 0.5, '¡Estrella!', { pos: [240, 520] }),
  globo(c(15) + BAR * 0.5, '¡Niebla!', { dur: 0.5, pos: [240, 470] }),
  // c15.75 → c16 (the breath, the kick drops out): the lamp swings, the ink creeps in, Nadie's shadow with it; NO ONE
  // LIKES CATS. — his paw stamps MENTIRA (c16.5), the page tears, a blank page is left (scenes.ts diario)
  oyente(LIE + BAR * 0.25),
  globo(LIE + BAR * 0.625, 'La hoja.', { dur: 0.5 }),
  // ================================================================ DROP2 c17–25 «Oleadas 1 y 2»
  // c17 · CONSEQUENCE of the lie, at the bar (half a bar): the blank page floats down onto the counter in front of him;
  // he leans over it and stares
  scn(c(17), 'bar', { ...BCAM.canelo, can: 'stare', paper: 0, soak: 0, pageDrop: 0, pal: 'tv' }),
  key(c(17) + 0.01, { pageDrop: 1 }, { dur: 0.4, ease: 'out' }),
  // c17.5 LEGIBLE · the page goes up on the TALLY BOARD: his rubber arm stretches across the bar to pin it; the chalk
  // writes REGISTRO 000; the hats write F·O·L·I·O
  key(24.0, { ...BCAM.board, board: 'page', can: 'point', pageDrop: 0 }, { dur: 0 }),
  at(24.0, v('whip', { dx: -520, dur: 0.22 })),
  globo(24.364, 'Ficha: antes del uno.', { dur: 0.85 }),
  // c18 the board opens into the card; 000 comes BEFORE the Capi's 001 (he taps it)
  ...door(24.9, 25.27, 'board', 'astral'),
  at(25.27, v('glitch', { dur: 0.3 })),
  // c19.5–20 FLURRY 1 · the INK invades the bar: the spilled beer turns to sumi-e, the Bibliotecario rises out of it
  // (prep: a drop of the card's ink falls into his spilled beer · develop: sumi-e strokes · exit: they draw back)
  scn(26.909, 'bar', { ...BCAM.ink, board: 'tally', can: 'idle', ink: 0 }),
  key(26.929, { ink: 0.2 }, { dur: 0.33, ease: 'linear' }),
  key(27.26, { ink: 1 }, { dur: 1.1, ease: 'out' }),
  key(28.8, { ink: 0 }, { dur: 0.28, ease: 'in' }),
  key(26.929, BCAM.inkIn, { dur: BAR * 1.5 - 0.05, ease: 'inOut' }),
  key(27.3, { can: 'hush' }, { dur: 0 }),
  globo(27.45, '¡Shhh!'),
  // c21–22 FLURRY 2 · the page out of the ink: CANELO, ALMIRANTE · ¿CUÁNTOS? (3 / 40 / 1000: own UI, cosmetic) · the
  // correction white floods the fleet and reaches his hat
  scn(c(21), 'almirante', { ink: 0, can: 'idle' }),
  at(c(21), v('pageFlip', { dur: 0.35 })),
  at(CHOICE.open, v('cuantos', { until: CHOICE.decide })),
  globo(c(21), '¡HUNDÍ CUARENTA BARCOS!'),
  globo(CHOICE.decide - 0.2, '…Más o menos.', { dur: 0.5 }),
  key(c(22), { white: 1 }, { dur: 0.9, ease: 'out' }),
  globo(c(22) + BAR * 0.5, '¡Normal! ¡Guácala!'),
  // c23 FLURRY 3 · the window NEON bends into the galleon and opens into the party in the sky; c24 the white city
  scn(c(23), 'bar', { ...BCAM.neon, neon: 0 }),
  key(c(23) + 0.01, { neon: 1 }, { dur: 0.36, ease: 'outBack' }),
  ...door(32.36, 32.62, 'neon', 'neon'),
  globo(32.73, '¡Fiesta en el cielo!'),
  scn(c(24), 'corona', { neon: 0 }),
  at(33.818, v('tear', {})),
  globo(c(24) + BAR * 0.1, '¿¡Corregirme A MÍ!?', { dur: 0.85 }),
  // c24.649 → c25 (the kick stops, 0.5 s) LEGIBLE · FREEZE: the bar dark, the TV shows your lighthouse at night; its
  // beam goes OUT of the screen, out of the bar, past the sky (a signal out of the box); his face in its light
  scn(KICK_CUT[0], 'bar', { ...BCAM.tv, tv: 'faro', dark: 1, can: 'shock' }),
  at(KICK_CUT[0], v('freeze', { dur: KICK_CUT[1] - KICK_CUT[0] }), v('beam', {})),
  globo(KICK_CUT[0] + 0.05, 'La luz…', { quiet: 1 }),
  // ================================================================ DROP3 c25–33 «Oleada 3: la más llena»
  scn(OTRA, 'cometa', { tv: '', dark: 0, can: 'idle', tug: 0 }),
  globo(OTRA, '¡SINCRO!'),
  tap(
    OTRA,
    { id: 'otra', label: '¡OTRA!', anchor: 'center' },
    {
      great: [v('pawSlide', { good: 1 }), v('pow', { text: '¡OTRA!', at: [1300, 300], size: 130, dur: 0.8 }), v('impact', { dur: 0.07 })],
      hit: [v('pawSlide', { good: 1 })],
      miss: [v('pawSlide', { good: 0 })],
    },
  ),
  key(c(26), { tug: 1 }, { dur: BAR, ease: 'inOut' }),
  globo(c(26) + BAR * 0.125, 'La empujaron. Por otros.'),
  // c27–28 LEGIBLE · Canelo Astral breaks the seal: a kitten of static on the rock — only he sees it (Maneki looks:
  // nothing; she turns away: it's back, looking at us). Planted for the awakening.
  scn(c(27), 'kitten'),
  globo(c(27) + 0.38, 'Solo yo lo veo.', { dur: 1.5 }),
  // c29 · the GRAFFITI invades the bar: the bathroom door, sprayed; the dots spread; a Disruptor leans out
  scn(c(29), 'bar', { ...BCAM.doorClose, graf: 0, can: 'pointL' }),
  at(c(29), v('glitch', { dur: 0.22 })),
  key(c(29) + 0.01, { graf: 1 }, { dur: BAR * 0.9, ease: 'linear' }),
  key(c(29) + 0.55, BCAM.doorWide, { dur: 0.4, ease: 'inOut' }),
  globo(c(29) + BAR * 0.6, '¡Grafiteros!', { dur: 0.55 }),
  // c30 · the BOARD again: its tallies line up into the logbook (your signature, the same hand in the margin); c30.5
  // the page turns: the chart of a hospital
  scn(c(30), 'bar', { ...BCAM.board, board: 'log', graf: 0, can: 'idle' }),
  ...door(42.2, 42.42, 'board', 'bitacora'),
  globo(42.45, 'El Capi escribe bonito…', { quiet: 1, dur: 0.6 }),
  globo(43.08, 'Es un hospital.', { dur: 0.5 }),
  // c31 COLOSO / GRABADO: the Leviathan upside down in chains of orders; Canelo breaks ONE chain (on his own)
  scn(c(31), 'coloso', { board: 'tally', free: 0 }),
  at(44.364, v('chainBreak', {}), v('impact', { dur: 0.06 }), v('shake', { amp: 14, dur: 0.3 })),
  globo(44.4, '¡Yo solito!'),
  // c32 (breath): the Leviathan swims away free; the astral crack breathes; the edge of a page through it
  key(c(32), { free: 1 }, { dur: BAR, ease: 'inOut' }),
  oyente(c(32) + BAR * 0.2),
  globo(c(32) + BAR * 0.6, 'Luego… se puso raro.', { quiet: 1 }),
  // ================================================================ BREAK c33–41 «Oleada 4: el borde» (no synths)
  // c33 back at the bar, drowsy: the mug's wet RING on the counter bleeds into watercolor — four memories
  scn(c(33), 'bar', { ...BCAM.ring, can: 'drowsy', ring: 0, sub: 0 }),
  key(c(33) + 0.01, { ring: 1 }, { dur: 0.5, ease: 'out' }),
  ...door(46.8, 47.15, 'ring', 'acuarela', { pal: 'acuarela' }),
  globo(47.3, 'Soñábamos lo mismo.', { quiet: 1 }),
  key(c(34), { sub: 1 }, { dur: 0 }),
  globo(c(34) + BAR * 0.5, 'Otras vidas.', { quiet: 1, pos: [520, 260] }),
  key(c(35), { sub: 2 }, { dur: 0 }),
  globo(c(35) + BAR * 0.5, 'Esa me dio miedo.', { quiet: 1, pos: [480, 200] }),
  key(c(36), { sub: 3 }, { dur: 0 }),
  globo(c(36) + BAR * 0.5, 'Ella sabía.', { quiet: 1, pos: [400, 220] }),
  // c37–38 FUNCIÓN DE FERIA 1930: the symmetric fair in black and white; Canelo, rubber-hose, burps the symmetry apart
  // — and COLOR breaks out of his mouth in a wave (the stage's post)
  scn(c(37), 'feria', { ring: 0, pal: 'tv' }),
  at(c(38), v('burp', {}), v('shake', { amp: 18, dur: 0.4 })),
  globo(c(38), '¡BUURP!'),
  // c38.75 LEGIBLE · the Threshold: «Tres bandos.» — said first, then one per beat of c39, each in its style and named;
  // he counts them on his claws
  scn(c(38) + BAR * 0.75, 'umbral'),
  globo(c(38) + BAR * 0.75 + 0.05, 'Tres bandos.', { dur: 1.2 }),
  // c40 (breath) LEGIBLE · the blank page comes down from the sky and lands by YOUR lighthouse; everyone follows it
  scn(c(40), 'baja'),
  globo(c(40) + 0.3, 'Junto a mi faro.', { quiet: 1, dur: 0.75, pos: [400, 300] }),
  // c40.75 → c41 (roll): EVERYONE turns to look at Canelo. Eyes, eyes, eyes
  scn(57.818, 'ojos'),
  mash(
    MASH[0],
    MASH[1],
    { id: 'hichichic', label: '¡HIC-HIC-HIC!', need: [3, 6], anchor: 'center', lead: 0.75 },
    {
      great: [v('pow', { text: '¡HIC-HIC-HIC!', at: [960, 200], size: 120, dur: 0.9 }), v('blinkAll', {})],
      hit: [v('pow', { text: '¡HIC!', at: [960, 200], size: 100, dur: 0.7 })],
      miss: [v('pow', { text: '…hic', at: [960, 200], size: 70, dur: 0.6, plain: 1 })],
    },
  ),
  // ================================================================ CLIMAX c41–49 «La página»
  // c41: at the bar he slumps over the counter, his paw on the NAPKIN — it opens into the page by your lighthouse
  scn(c(41), 'bar', { ...BCAM.napkin, can: 'slump', napkin: 1, dark: 0.35, bubbles: 0, kaleido: 0 }),
  ...door(58.6, 59.0, 'napkin', 'pagina', { dark: 0 }),
  // c42–43 the thought bubbles of every side, each with its eyes on him; then the Capi's (H64's mentira:*)
  key(c(42), { bubbles: 1 }, { dur: BAR * 0.5, ease: 'out' }),
  globo(c(42) + BAR * 0.5, 'Todos miran.', { pos: [760, 470] }),
  key(c(43), { bubbles: 2 }, { dur: BAR * 0.5, ease: 'outBack' }),
  // c44–45 the bottom of the glass: the eyes multiply; the page grows heavy and sinks
  key(c(44), { kaleido: 1 }, { dur: BAR * 2, ease: 'in' }),
  globo(c(45), 'Todos esperan.', { pos: [760, 470] }),
  // c46 LEGIBLE: his face, held (the camera comes to it inside the scene)
  globo(c(46) + BAR * 0.125, 'A mí.', { dur: 0.42 }),
  // c46.4 → c47 (the filter opens: measured, it is fully open on c47): the spiral; he springs up from the page (the
  // warm mark stays) and jumps through a cat flap · c47 → c48: he falls down it like a slide of colors
  scn(66.065, 'espiral', { kaleido: 0, slide: 0, napkin: 0 }),
  key(66.909, { slide: 1 }, { dur: 68.364 - 66.909, ease: 'linear' }),
  // c48 (breath, no kick): slow motion — he lands on the bar stool, in cartoon
  scn(c(48), 'bar', { ...BCAM.open, blank: 1, land: 0, can: 'empty', dark: 0 }),
  key(c(48), { land: 1 }, { dur: BAR * 0.9, ease: 'out' }),
  globo(c(48) + 0.2, 'Me fui.', { quiet: 1, dur: 0.6, left: 1 }),
  // c49 (the dry cut): ¡PUM! — the empty mug on the counter. Total silence. The bar, normal.
  tap(
    PUM,
    { id: 'pum', label: '¡PUM!', anchor: 'canelo' },
    {
      great: [v('slam', { good: 1 }), v('pow', { text: '¡PUM!', at: [1100, 300], size: 170, dur: 0.6 }), v('impact', { dur: 0.06, invert: false })],
      hit: [v('slam', { good: 1 }), v('pow', { text: '¡PUM!', at: [1100, 300], size: 130, dur: 0.6 })],
      miss: [v('slam', { good: 0 })],
    },
  ),
  at(PUM, v('silence', {})),
  // ================================================================ ALWAYS ON (every sound has a purpose)
  // the loose kicks of the intro are hiccups; the drops' kicks pump the picture (the stage reads the onset tracks)
  on({ onsets: { track: 'kick', in: [0.5, SALUD - 0.1], min: 0.6, except: [2.727, 2.909, 5.818, 8.727] } }, v('hic', { small: 1 })),
  // the hats write F·O·L·I·O over the board's page and the card (c17–18)
  on({ onsets: { track: 'perc', in: [23.6, 26.1], min: 0.3, minGap: 0.3, limit: 5 } }, v('folio', {})),
];

export const DRUNCK: MomentoDef = {
  id: 'drunck',
  track: 'drunck',
  title: 'DRUNCK',
  mission: 'H66',
  source: 'La Última Ronda',
  cut: CUT,
  tail: 'release',
  palettes: { intro: 'tv', drop: 'tv', drop2: 'tv', drop3: 'tv', break: 'tv', climax: 'tv' },
  score,
  stage: () => import('./stage').then((m) => m.default as unknown as (h: unknown) => unknown),
  unlocks: ['drunck'],
  props: { 'cam.x': 960, 'cam.y': 540, 'cam.zoom': 1 },
};
