/**
 * F06 · PC EM%EN «Cuadra 8» (H73, closes the battle; guion: historia-v2/guiones/acto-1/h73-batalla-de-gatos.md F06).
 *
 * STYLE: a home-video VHS tape — handheld, washed and smeared colour, tracking lines, «NOV 14 2:47 AM», REC ● — with
 * KINETIC TYPE for the bars: the song has no lyrics, so the battle's bars are written on screen, big words dropping on
 * the song's own kicks and snares (emen.onsets.json), always over a calm band. EMIAU comes from La Cuadra 8: when he
 * walks in, the Borracha's cartoon washes out like an old tape; when Canelo confesses, the colour comes back FROM HIM.
 * In the break the only light — the only saturated colour — is Luzterna's lantern.
 *
 * The whole song (3:07,8, 103 BPM, 1 bar = 2,330 s). Three OPTIONAL taps that never change the outcome:
 *   «¡UUUH!» (c24,56: the crowd's wave is bigger) · «LUZ» (c37: she lifts the lantern now; else alone at c37,5) ·
 *   «¡MIC!» (c73,25, shown half a bar ahead so it never covers «pago yo»: the mic drop; else it falls by itself).
 *
 *   tele       c1          the battle's last cartoon frame; tracking lines climb: the tape takes over (E1)
 *   entrada    c1–9        between heads · Oficial Dona hosts «¡EL CAMPEÓN!» · EMIAU walks in «¡SLIM!» · Canelo, small (E1–E4)
 *   ataque     c9–24       the champion's verse: bars, a burst of his night, the crash zoom on the scratch, the shark,
 *                          the blank page by the lighthouse, nose to nose (E5–E11)
 *   remate     c24–25      «…llorándole al hielo.» alone in the silence → «¡UUUUUH!» (E12–E13)
 *   cierre     c25–33      the neighbours nod, the nights they remember, his flame drops at «de vela», the mic flies (E14–E18)
 *   quiebre    c33–41      alone; the exit glows; her lantern finds him — «Sí. Me fui. Vine a olvidar.» (E19–E24)
 *   subida     c41–49      Homiau lowers his donut; the colour comes back from Canelo: flame, fur, floor (E25–E28)
 *   respuesta  c49–64      his answer; «¡Del cumpleaños de mi hija!»; the good memories, in colour (E29–E34)
 *   golpe      c64–65      «Lo bueno también se queda… …no nomás la cruda fija.» (E35–E36)
 *   gana       c65–73      face to face; «Si esto lo rompí yo, lo arreglo yo; y si alguien paga… …pago yo.» —
 *                          Hipólito wakes up: «¿Y luego?» (E37–E42)
 *   salida     c73–81      the mic drop in slow motion, the fist bump, on their shoulders; Doña Espuma: «Empieza por las
 *                          catorce rondas.» — Luzterna, at the back, smiles and says NOTHING [TEMP-Q4]; REC ■ STOP (E43–E46)
 */
import type { FilmDef, FilmSceneDef } from '../../../types';
import { tap, v } from '../../../../momentos/score';
import emenMap from '../../../../data/music/beatmaps/emen.json';
import { T } from './lot';

const TV43 = 4 / 3;
const sc = (name: string) => () => import('./scenes').then((m) => (m as unknown as Record<string, unknown>)[name]);
const END = 187.787;
/** scene spans on bar lines: [id, from (s), to (s), style] — cuts between them (the tape cuts like a camcorder) */
const SPANS: [string, number, number][] = [
  ['tele', 0, 2.9],
  ['entrada', 2.1, T(9)],
  ['ataque', T(9), T(24)],
  ['remate', T(24), T(25)],
  ['cierre', T(25), T(33)],
  ['quiebre', T(33), T(41)],
  ['subida', T(41), T(49)],
  ['respuesta', T(49), T(64)],
  ['golpe', T(64), T(65)],
  ['gana', T(65), T(73)],
  ['salida', T(73), END],
];
// handheld everywhere, a breath; the camera settles for the first time in the confession (E24) and in «pago yo» (E40)
const CAMS: Record<string, FilmSceneDef['cam']> = {
  tele: [{ t: 0, x: 960, y: 560, fov: 1.04 }],
  entrada: [
    { t: 0, x: 860, y: 620, fov: 1.15, hand: 7 },
    { t: T(3) - 2.1, x: 1100, ease: 'linear' },
    { t: T(3) - 2.1 + 0.001, x: 960, y: 540, fov: 1.05, ease: 'hold' },
    { t: T(5) - 2.1, fov: 1.12, ease: 'linear' },
    { t: T(5) - 2.1 + 0.001, x: 1000, y: 640, fov: 1.18, ease: 'hold' },
    { t: T(7) - 2.1, x: 930, ease: 'linear' },
    { t: T(7) - 2.1 + 0.001, x: 960, y: 560, fov: 1.02, ease: 'hold' },
    { t: T(9) - 2.1, x: 920, fov: 1.06, ease: 'linear' },
  ],
  ataque: [
    { t: 0, x: 900, y: 600, fov: 1.08, roll: -0.02, hand: 5 },
    { t: T(11) - T(9), x: 1060, roll: 0.02, ease: 'linear' },
    { t: T(13) - T(9), x: 980, y: 600, fov: 1.1, roll: 0, ease: 'hold' },
    { t: T(15) - T(9), x: 1040, ease: 'linear' },
    { t: T(15) - T(9) + 0.001, x: 900, y: 620, fov: 1.05, ease: 'hold' },
    { t: T(16.5625) - T(9), fov: 1.08, ease: 'linear' },
    { t: T(16.5625) - T(9) + 0.2, fov: 1.38, y: 560, ease: 'expoOut' },
    { t: T(17) - T(9), x: 960, y: 560, fov: 1, ease: 'hold' },
    { t: T(19) - T(9), fov: 1.04, ease: 'linear' },
    { t: T(21) - T(9), x: 960, y: 640, fov: 1.15, ease: 'hold' },
    { t: T(24) - T(9), fov: 1.24, ease: 'linear' },
  ],
  remate: [
    { t: 0, x: 1000, y: 640, fov: 1.25, hand: 1 },
    { t: T(24.5625) - T(24), fov: 1.27, ease: 'linear' },
    { t: T(24.5625) - T(24) + 0.001, x: 960, y: 600, fov: 1.05, hand: 9, ease: 'hold' },
  ],
  cierre: [
    { t: 0, x: 960, y: 620, fov: 1.06, hand: 5 },
    { t: T(29) - T(25), x: 1000, ease: 'linear' },
    { t: T(29) - T(25) + 0.001, x: 1180, y: 960, fov: 1.3, ease: 'hold' },
    { t: T(31) - T(25), fov: 1.36, ease: 'linear' },
    { t: T(31) - T(25) + 0.001, x: 1000, y: 600, fov: 1.08, ease: 'hold' },
    { t: T(32.5) - T(25), x: 860, ease: 'inOut' },
  ],
  quiebre: [
    { t: 0, x: 960, y: 600, fov: 1.02, hand: 3, focus: 1000 },
    { t: T(34) - T(33), x: 900, y: 640, fov: 1.12, ease: 'hold' },
    // the autofocus hunts for her (E21)
    { t: T(35) - T(33), x: 1200, y: 640, fov: 1.2, focus: 1400, ease: 'hold' },
    { t: T(35.6) - T(33), focus: 900 },
    { t: T(36.2) - T(33), focus: 1500 },
    { t: T(36.8) - T(33), focus: 1000 },
    { t: T(37.5) - T(33), x: 960, y: 580, fov: 1, hand: 2, ease: 'hold' },
    // E23–E24: the camera stays still for the first time
    { t: T(38.4) - T(33), x: 900, y: 660, fov: 1.18, hand: 0, ease: 'hold' },
    { t: T(41) - T(33), fov: 1.2, ease: 'linear' },
  ],
  subida: [
    { t: 0, x: 900, y: 700, fov: 1.2, hand: 3 },
    { t: T(43) - T(41), x: 960, y: 580, fov: 1, ease: 'hold' },
    { t: T(45) - T(41), x: 900, y: 640, fov: 1.05, ease: 'hold' },
    { t: T(47) - T(41), fov: 1.22, ease: 'inOut' },
    { t: T(49) - T(41), fov: 1.24, ease: 'linear' },
  ],
  respuesta: [
    { t: 0, x: 860, y: 640, fov: 1.1, roll: 0.02, hand: 5 },
    { t: T(53) - T(49), x: 1040, roll: -0.02, ease: 'linear' },
    { t: T(53) - T(49) + 0.001, x: 960, y: 600, fov: 1.04, roll: 0, ease: 'hold' },
    { t: T(57) - T(49), x: 980, ease: 'linear' },
    { t: T(57) - T(49) + 0.001, x: 1000, y: 640, fov: 1.08, ease: 'hold' },
    { t: T(59) - T(49), x: 960, y: 660, fov: 1.14, ease: 'hold' },
    { t: T(63) - T(49), x: 960, y: 580, fov: 1.02, ease: 'hold' },
  ],
  golpe: [
    { t: 0, x: 960, y: 580, fov: 1.04, hand: 1 },
    { t: T(64.5625) - T(64), fov: 1.05, ease: 'linear' },
    { t: T(64.5625) - T(64) + 0.001, hand: 9, ease: 'hold' },
  ],
  gana: [
    { t: 0, x: 960, y: 640, fov: 1.12, hand: 4 },
    { t: T(69) - T(65), fov: 1.2, ease: 'inOut' },
    { t: T(69) - T(65) + 0.001, x: 1000, y: 700, fov: 1.15, ease: 'hold' },
    { t: T(69.5) - T(65), x: 900, y: 640, fov: 1.1, ease: 'hold' },
    { t: T(71) - T(65), x: 920, y: 660, fov: 1.22, hand: 0, ease: 'hold' },
    { t: T(72.5625) - T(65), x: 1000, y: 640, fov: 1.15, hand: 8, ease: 'hold' },
  ],
  salida: [
    { t: 0, x: 900, y: 660, fov: 1.15, hand: 2 },
    { t: T(75) - T(73), fov: 1.22, ease: 'linear' },
    { t: T(75) - T(73) + 0.001, x: 960, y: 600, fov: 1.06, ease: 'hold' },
    { t: T(77) - T(73), x: 960, y: 620, fov: 1.1, hand: 1, ease: 'hold' },
    { t: T(79) - T(73), x: 960, y: 560, fov: 1.04, ease: 'hold' },
  ],
};
// «Reducir movimiento»: the same framings without handheld and without the crash zoom
const calm = (keys: FilmSceneDef['cam']) => keys?.map((k) => ({ ...k, hand: 0, roll: 0, fov: k.fov !== undefined ? Math.min(k.fov, 1.2) : undefined, ease: k.ease === 'expoOut' ? ('inOut' as const) : k.ease }));

export const F06: FilmDef = {
  id: 'f06',
  title: 'Cuadra 8',
  kind: 'song',
  track: 'emen',
  map: emenMap,
  loader: { style: 'tv', caption: 'PELÍCULA · LA BORRACHA' },
  scenes: SPANS.map(([id, a, b], i) => ({
    id,
    dur: b - a,
    style: id === 'tele' ? 'tv' : 'vhs',
    aspect: TV43,
    set: sc(id),
    in: i === 0 ? { kind: 'fade' as const, dur: 0.4 } : id === 'entrada' ? { kind: 'glitch' as const, dur: 0.8, seed: 7 } : { kind: 'cut' as const, dur: 0 },
    cam: CAMS[id],
    camRm: calm(CAMS[id]),
  })),
  score: [
    // the three optional taps (a flourish each; without them, the same moment happens on its own)
    tap(T(24.5625), { id: 'uuuh', label: '¡UUUH!', anchor: [960, 860], lead: 0.5 }, { great: [v('burst', { at: [960, 700], n: 26 })], hit: [v('burst', { at: [960, 700], n: 14 })] }),
    tap(T(37), { id: 'luz', label: 'LUZ', anchor: [1300, 640] }, { great: [v('sparkle', { at: [1300, 600] })], hit: [] }),
    tap(T(73.25), { id: 'mic', label: '¡MIC!', anchor: [1100, 720], lead: 0.5 }, { great: [v('impact', { amt: 0.4 })], hit: [] }),
  ],
  close: { kind: 'fade', dur: 1.0, color: 0x000000 },
};
