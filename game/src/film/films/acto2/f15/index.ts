/**
 * F15 · PP «Itō» (H81, before the final against Itō, A-9; guion: historia-v2/guiones/acto-2/h81-ito.md).
 *
 * STYLE: an UKIYO-E SCROLL (makimono) that unrolls from right to left under a lateral travelling — woodblock lines,
 * flat colour, a bokashi sky from indigo to pink, rice paper, vertical cartouches read right to left. Itō is the
 * Titiritero of threads and of honour: his presentation is a scroll you read slowly. 40 s · 0 clicks · daria.piano
 * slow («Piano de vinilo»: Daria's piano alone at ×1.5; it loops in bars under the film, filmEdit).
 *
 *   0–6      LA FINAL: the stone arena in woodblock, banners, rows of heads                         [P] dónde
 *   6–12     ITŌ, kneeling, threads on his back like a sword's sheath — breathes, opens his eyes
 *            · ITŌ · TITIRITERO · PELEA DE FRENTE                                                    [P] rival
 *   12–18    the arena's gatera chained in gold · EL CAMPEÓN CRUZA · LOS DEMÁS SE QUEDAN            qué pasa / por qué
 *   18–28    THE RULE «Duelo limpio»: two figures throw ONE stroke each, by turns (the simulator's real flight,
 *            painted as a plate line); a third throws two — and its aura goes out
 *            · DUELO LIMPIO · UN GOLPE CADA UNO                                                     [M] la regla
 *   28–31    in a corner of the scroll, by the arena's tear: Canelo drawn small, his flame goes down  señal de Canelo
 *   31–35    Luzterna, real, in front of the scroll: she bows to the drawing of Itō — and it bows back  [C] Luzterna
 *   35–40    the Bitácora unrolls over the scroll: LO QUE ARRIESGAMOS                              [A] → batalla
 */
import type { FilmDef } from '../../../types';
import { at, v } from '../../../../momentos/score';
import { MUSIC } from '../music';
import { AT } from './sets.anchors';

const S = () => import('./sets');

export const F15: FilmDef = {
  id: 'f15',
  title: 'Itō',
  kind: 'briefing',
  track: MUSIC.f15,
  loader: { style: 'ukiyoe', caption: 'PRESENTACIÓN · MAR SHŌNEN' },
  scenes: [
    {
      id: 'rollo',
      dur: 31.4,
      style: 'ukiyoe',
      set: () => S().then((m) => m.rollo),
      in: { kind: 'fade', dur: 0.8, color: 0x000000 },
      weather: [{ kind: 'wind', particle: 'petal', amount: 0.35, color: 0xf2b8c0, seed: 4 }],
      cam: [
        { t: 0, x: 1150, y: 540, fov: 0.95 },
        { t: 5.3, x: 820, fov: 0.97, ease: 'linear' },
        { t: 6.6, x: AT.ito, fov: 1.0, ease: 'inOut' },
        { t: 11.6, x: AT.ito - 100, ease: 'linear' },
        { t: 12.9, x: AT.gatera, ease: 'inOut' },
        { t: 17.8, x: AT.gatera - 100, ease: 'linear' },
        { t: 19.1, x: AT.regla, fov: 0.9, ease: 'inOut' },
        { t: 27.8, x: AT.regla + 60, ease: 'linear' },
        { t: 29.0, x: AT.canelo, fov: 1.15, ease: 'inOut' },
        { t: 31.4, x: AT.canelo - 40, ease: 'linear' },
      ],
      camRm: [
        { t: 0, x: 1000, y: 540, fov: 0.95, ease: 'hold' },
        { t: 6.0, x: AT.ito, fov: 1.0, ease: 'hold' },
        { t: 12.3, x: AT.gatera, ease: 'hold' },
        { t: 18.5, x: AT.regla, fov: 0.9, ease: 'hold' },
        { t: 28.4, x: AT.canelo, fov: 1.15, ease: 'hold' },
      ],
    },
    {
      id: 'reverencia',
      dur: 9.6,
      style: 'ukiyoe',
      set: () => S().then((m) => m.reverencia),
      in: { kind: 'dissolve', dur: 0.6 },
      cam: [
        { t: 0, x: 960, y: 560, fov: 1.0 },
        { t: 3.8, x: 1000, y: 560, fov: 1.06, ease: 'sine' },
        { t: 9.6, x: 980, y: 540, fov: 1.0, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 960, y: 560, fov: 1.0 }],
    },
  ],
  score: [
    at(0.4, v('sound', { name: 'paper', pitch: 0.7 })),
    at(6.0, v('sound', { name: 'paper', pitch: 0.7 })),
    at(12.3, v('sound', { name: 'paper', pitch: 0.7 })),
    at(20.2, v('sound', { name: 'whoosh', pitch: 0.7 })),
    at(22.0, v('sound', { name: 'whoosh', pitch: 0.75 })),
    at(25.4, v('sound', { name: 'tick', pitch: 0.6 })),
    at(35.0, v('sound', { name: 'paper', pitch: 0.7 })),
    at(35.4, v('sound', { name: 'nib' })),
  ],
  close: { kind: 'fade', dur: 0.8, color: 0x000000 },
};
