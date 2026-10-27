/**
 * F10 · PP «Villanos sueltos» (H76, before El Estambre; guion: historia-v2/guiones/acto-2/h76-villanos-sueltos.md).
 *
 * STYLE: a 1940s newsreel's SPINNING NEWSPAPER — «El Clarín Viñeta» front pages spin in from the dark of the press and
 * stop dead on the fanfare (fut.vineta.noticiero: open-fourth trumpets on every page), comic colour in halftone on
 * yellowed newsprint. Why: the city learns everything from the paper, and the paper is going to blame us.
 * 30 s · 0 clicks · fut.vineta.noticiero.
 *
 *   0–5      ¡FUGA EN LA CÁRCEL DE VILLANOS! — the jail wall with a hole, fresh graffiti             [P] dónde / qué pasa
 *   5–10     LOS DISRUPTORES: «QUE RESPIREN» — a Disruptor sprays the bars                          [M]
 *   10–15    ¡LA BARCAZA DEL MUELLE 9, ATRAPADA! — civilians run, the barge in a giant yarn knot     [P] por qué importa
 *   15–20    EL ESTAMBRE ANDA SUELTO · «Lo que toca, lo enreda» — the wool thug; THE RULE in a panel
 *            on the same page: his thread ties a cannon's muzzle, the real shot (dashed) never leaves [P][M] rival y regla
 *   20–22    ¿FORASTEROS O VILLANOS? — our ship from a guilty angle                                 [C]
 *   22–25    the real paper in Luzterna's hand: her beam crosses out VILLANOS and writes GUAPOS      [C] Luzterna
 *   25–27    the corner box: Canelo asleep standing on the deck, his flame small                    señal de Canelo
 *   27–30    the Bitácora rises: LO QUE ARRIESGAMOS                                                [A] → batalla
 */
import type { FilmDef } from '../../../types';
import { at, v } from '../../../../momentos/score';
import { MUSIC } from '../music';

const S = () => import('./sets');
const STOPS = [1.26, 5.05, 10.1, 15.16, 20.2];
const HAND = 22.0;

export const F10: FilmDef = {
  id: 'f10',
  title: 'Villanos sueltos',
  kind: 'briefing',
  track: MUSIC.f10,
  loader: { style: 'noir', caption: 'PRESENTACIÓN · CIUDAD MAYÚSCULA' },
  scenes: [
    {
      id: 'rotativa',
      dur: HAND,
      style: 'periodico',
      set: () => S().then((m) => m.rotativa),
      in: { kind: 'fade', dur: 0.3, color: 0x000000 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.0, hand: 1.5 },
        { t: 14.2, fov: 1.0, ease: 'linear' },
        { t: 15.16, fov: 1.04, ease: 'expoOut' },
        { t: HAND, fov: 1.1, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 960, y: 540, fov: 1.0 }],
    },
    {
      id: 'mano',
      dur: 8.4,
      style: 'periodico',
      set: () => S().then((m) => m.mano),
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 1020, y: 560, fov: 1.1 },
        { t: 0.5, x: 860, y: 600, fov: 0.92, ease: 'expoOut' },
        { t: 3.1, x: 900, y: 590, fov: 0.95, ease: 'linear' },
        { t: 3.35, x: 1600, y: 840, fov: 2.3, ease: 'expoOut' },
        { t: 4.9, x: 1590, y: 830, fov: 2.4, ease: 'linear' },
        { t: 5.4, x: 960, y: 560, fov: 0.98, ease: 'inOut' },
      ],
      camRm: [
        { t: 0, x: 880, y: 590, fov: 0.95, ease: 'hold' },
        { t: 3.26, x: 1600, y: 840, fov: 2.3, ease: 'hold' },
        { t: 5.0, x: 960, y: 560, fov: 0.98, ease: 'hold' },
      ],
    },
  ],
  score: [
    ...STOPS.map((t) => at(t - 0.55, v('sound', { name: 'whoosh', pitch: 1.2 }))),
    ...STOPS.map((t) => at(t, v('sound', { name: 'paper', pitch: 0.8 }))),
    at(HAND + 0.4, v('sound', { name: 'nib', pitch: 1.3 })),
    at(HAND + 3.26, v('sound', { name: 'tick' })),
    at(HAND + 5.4, v('sound', { name: 'nib' })),
  ],
  close: { kind: 'fade', dur: 0.6, color: 0x000000 },
};
