/**
 * F05 · PP «La Batalla de Gatos» (H73, before EMIAU's battle; guion: historia-v2/guiones/acto-1/h73-batalla-de-gatos.md).
 *
 * STYLE: a photocopied neighbourhood flyer — copier black & white, toner grain and speckle, ransom-note letters cut out
 * of magazines, staples and tape, photos with burnt contrast. How a street rap battle announces itself. The flyer fills
 * the 4:3 and the camera is a document camera drifting down it in hand while each new thing is PASTED ON ON THE BEAT.
 * One cutaway in colour-less TV where the only saturated thing is Luzterna's blue. 30 s · 0 clicks · «El público
 * espera» (EM%EN c1–9, derived; until MÚSICA registers it, the Borracha's battle loop).
 *
 *   0–4    BATALLA DE GATOS · ESTA NOCHE · KARAOKE «EL ÚLTIMO TRAGO»   letters land one by one          [P] dónde
 *   4–9    a burnt photo of the mob with its signs, STAPLED on the beat · EL BARRIO SE ACUERDA DE TODO  [M] qué pasa
 *   9–13   Canelo cut out, scared, with marker ¿¿?? · RETADOR: ¿¿EL GATO NARANJA??                    [P] por qué
 *   13–18  EMIAU, arms crossed, the INVICTO stamp falls on the beat · CAMPEÓN: EMIAU «SLIM BIGOTES»    [P] rival
 *   18–24  two photocopied comic strips: repeat the element → boos, tomatoes, a weak hit · alternate → ¡OOOH! and a
 *          COMBO · REGLA: RIMA                                                                          [M] la regla
 *   24–27  the karaoke, grey; at the back Luzterna writes ¡VAMOS, GORDO! in the air with her lantern like a
 *          sparkler — the light runs out halfway through the last O                                  [C] Luzterna
 *   27–30  back on the flyer: LO QUE ARRIESGAMOS                                                       [A] → batalla
 */
import type { FilmDef } from '../../../types';
import { PUBLICO } from '../music';

const TV43 = 4 / 3;
/** the document camera's stops (world px of the flyer plane) */
export const STOP = {
  A: { x: 960, y: 380, fov: 1.05 },
  B: { x: 960, y: 1030, fov: 1.1 },
  C: { x: 960, y: 1700, fov: 1.1 },
  D: { x: 900, y: 2390, fov: 1.1 },
  E: { x: 960, y: 3060, fov: 1.04 },
} as const;
type Stop = { x: number; y: number; fov: number };
/** stay on `a` until t0, then travel to `b` by t1 */
const go = (t0: number, t1: number, a: Stop, b: Stop) => [
  { t: t0, x: a.x, y: a.y, fov: a.fov, ease: 'linear' as const },
  { t: t1, x: b.x, y: b.y, fov: b.fov, ease: 'inOut' as const },
];
const jump = (t: number, s: Stop) => ({ t, x: s.x, y: s.y, fov: s.fov, ease: 'hold' as const });

export const F05: FilmDef = {
  id: 'f05',
  title: 'La Batalla de Gatos',
  kind: 'briefing',
  track: PUBLICO,
  loader: { style: 'noir', caption: 'PRESENTACIÓN · LA BORRACHA' },
  scenes: [
    {
      id: 'flyer',
      dur: 24,
      style: 'fotocopia',
      set: () => import('./sets').then((m) => m.flyer),
      aspect: TV43,
      in: { kind: 'fade', dur: 0.4, color: 0xffffff },
      cam: [
        { t: 0, x: STOP.A.x, y: STOP.A.y, fov: STOP.A.fov, hand: 2.2 },
        ...go(3.65, 4.05, STOP.A, STOP.B),
        ...go(8.6, 9.05, STOP.B, STOP.C),
        ...go(12.6, 13.05, STOP.C, STOP.D),
        ...go(17.55, 18.0, STOP.D, STOP.E),
      ],
      // «Reducir movimiento»: no travel, a cut to each stop
      camRm: [jump(0, STOP.A), jump(4, STOP.B), jump(9, STOP.C), jump(13, STOP.D), jump(18, STOP.E)],
    },
    {
      id: 'luz',
      dur: 3,
      style: 'tv',
      set: () => import('./sets').then((m) => m.luz),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      // grey TV: only her blue is kept
      look: { mono: 0.95, accHue: 0.56, accW: 0.13, contrast: 1.08, grain: 0.07 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.04 },
        { t: 3, fov: 1.1, ease: 'sine' },
      ],
    },
    {
      id: 'riesgo',
      dur: 3,
      style: 'fotocopia',
      set: () => import('./sets').then((m) => m.riesgo),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: [{ t: 0, x: STOP.A.x, y: STOP.A.y, fov: 1 }],
    },
  ],
  close: { kind: 'fade', dur: 0.5, color: 0x000000 },
};
