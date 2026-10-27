/**
 * F07 · PP «El Cadenero» (H74, the Carta's B-9 boss — `stages[].film: 'F07'`; guion:
 * historia-v2/guiones/acto-1/h74-el-cadenero-y-oh-shit.md).
 *
 * STYLE: a lucha-libre poster — wood type, two inks (red halftone + black) on yellow paper, boxes for the fighters,
 * «A 2 DE 3 CAÍDAS». The poster UNROLLS over the bar's wall inside the 4:3 TV and the camera crash-zooms into each box
 * like a ringside photographer (flash). On the poster El Cadenero wears a luchador mask (posters exaggerate).
 * 30 s · 0 clicks · «Antes de caer» (OH SHIT c37–45, derived; until MÚSICA registers it, the Borracha's battle loop).
 *
 *   0–4    the poster unrolls · FUNCIÓN ESTELAR · LA ÚLTIMA RONDA · LA PUERTA DEL BAÑO · A 2 DE 3 CAÍDAS [P] dónde
 *   4–9    box: the bathroom door, static in halftone, the slit buzzes · DETRÁS: EL RASTRO DEL CHIQUITO   [M] qué pasa
 *   9–13   box: Canelo, brave (as the poster artist drew him; in real life, no) · ES LA ÚNICA PUERTA      [P] por qué
 *   13–18  the big box: EL CADENERO in his mask, a photo flash, ¡CA-DE-NE-RO! · EL MURO DE LA ÚLTIMA RONDA [P] rival
 *   18–24  comic panels: he checks the bracelet of your STRONGEST cat — «¡NO ESTÁS EN LA LISTA!» — and puts a hand in
 *          its face: that one doesn't shoot this turn · REGLA: LISTA VIP                               [M] la regla
 *   24–27  the real bar: Luzterna writes «VIP» on Canelo's paw with her beam; he shows it to the doorman, proud [C]
 *   27–30  the logbook covers the poster: LO QUE ARRIESGAMOS                                           [A] → batalla
 */
import type { FilmDef } from '../../../types';
import { ANTES_DE_CAER } from '../music';

const TV43 = 4 / 3;
type Stop = { x: number; y: number; fov: number };
export const STOP = {
  head: { x: 960, y: 330, fov: 1 },
  door: { x: 530, y: 700, fov: 1.65 },
  canelo: { x: 1405, y: 700, fov: 1.65 },
  cadenero: { x: 970, y: 830, fov: 1.12 },
  regla: { x: 960, y: 1560, fov: 1.12 },
} as const;
/** hold `a` until t0, then a crash zoom / pan to `b` (expoOut) by t1 */
const punch = (t0: number, t1: number, a: Stop, b: Stop, ease: 'expoOut' | 'inOut' = 'expoOut') => [
  { t: t0, x: a.x, y: a.y, fov: a.fov, ease: 'linear' as const },
  { t: t1, x: b.x, y: b.y, fov: b.fov, ease },
];
const jump = (t: number, s: Stop) => ({ t, x: s.x, y: s.y, fov: s.fov, ease: 'hold' as const });

export const F07: FilmDef = {
  id: 'f07',
  title: 'El Cadenero',
  kind: 'briefing',
  track: ANTES_DE_CAER,
  loader: { style: 'bass', caption: 'PRESENTACIÓN · LA BORRACHA' },
  scenes: [
    {
      id: 'cartel',
      dur: 24,
      style: 'cartel',
      set: () => import('./sets').then((m) => m.cartel),
      aspect: TV43,
      in: { kind: 'fade', dur: 0.4, color: 0x000000 },
      cam: [
        { t: 0, x: STOP.head.x, y: STOP.head.y, fov: STOP.head.fov, hand: 1.6 },
        ...punch(4.0, 4.28, STOP.head, STOP.door),
        ...punch(9.0, 9.28, STOP.door, STOP.canelo),
        ...punch(13.0, 13.4, STOP.canelo, STOP.cadenero, 'inOut'),
        ...punch(17.9, 18.5, STOP.cadenero, STOP.regla, 'inOut'),
      ],
      camRm: [jump(0, STOP.head), jump(4, STOP.door), jump(9, STOP.canelo), jump(13, STOP.cadenero), jump(18, STOP.regla)],
    },
    {
      id: 'vip',
      dur: 3,
      style: 'tv',
      set: () => import('./sets').then((m) => m.vip),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      weather: [],
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.06 },
        { t: 1.69, fov: 1.12, ease: 'sine' },
        { t: 1.7, fov: 1, ease: 'hold' },
        { t: 3, fov: 1.04, ease: 'sine' },
      ],
    },
    {
      id: 'riesgo',
      dur: 3,
      style: 'cartel',
      set: () => import('./sets').then((m) => m.riesgo),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: [{ t: 0, x: STOP.head.x, y: 560, fov: 0.78 }],
    },
  ],
  close: { kind: 'fade', dur: 0.5, color: 0x000000 },
};
