/**
 * F09 · PP «Ciudad Mayúscula» (H75, before La Pandilla del Ovillo, S-5; guion: historia-v2/guiones/acto-2/h75-la-gato-senal.md).
 *
 * STYLE: the modern «spider-verse» comic — flat inks printed off their line, two-ink halftone, a thick line, everything
 * that moves on TWOS, caption boxes in different colours, onomatopoeia you can hide behind. The screen IS a comic page
 * (the camera reads it panel by panel) and every new page lands on the music's crash (fut.vineta: one every 4 bars).
 * 40 s · 0 clicks · fut.vineta.
 *
 *   0–5      CIUDAD MAYÚSCULA: the letters ARE the buildings; the camera flies between them        [P] dónde
 *   5–15     page 2 — V1 the heroes of other versions look up at a signal nobody lit (blue box)     [M] qué pasa
 *            V2 Cerito's prints, halftone at the edges now, go down to the dock (green box)         [P] por qué
 *            V3 Canelo passes a tear in an alley: his tail flame goes down; he scratches, goes on   señal de Canelo
 *   15–30    page 3 — V1 LA PANDILLA DEL OVILLO, knuckles cracking                                  [P] rival
 *            V2 THE RULE: a punch leaves a solid «¡KRAK!» on the deck; a real shot (the simulator's
 *            flight, battle/demo.ts) bounces off the K · AQUÍ EL RUIDO SE QUEDA. ÚSALO.             [M] la regla
 *   30–35    Luzterna, real, tilts the lantern so the Gato-señal «looks prettier»: the ears straighten [C] Luzterna
 *   35–40    the Bitácora slaps onto the page: LO QUE ARRIESGAMOS                                   [A] → batalla
 */
import type { FilmDef } from '../../../types';
import { at, v } from '../../../../momentos/score';
import { MUSIC, VINETA } from '../music';

const S = () => import('./sets');
const PG = [VINETA.page(0), VINETA.page(1), VINETA.page(2), VINETA.page(3)]; // 5.05 · 15.16 · 25.26 · 35.37
const TURN = 0.6;
/** page 4 (Luzterna) lands two bars after the rule's crash */
const LUZ = PG[2] + VINETA.bar * 2;

export const F09: FilmDef = {
  id: 'f09',
  title: 'Ciudad Mayúscula',
  kind: 'briefing',
  track: MUSIC.f09,
  loader: { style: 'tv', caption: 'PRESENTACIÓN · CIUDAD MAYÚSCULA' },
  scenes: [
    {
      id: 'ciudad',
      dur: PG[0] + TURN,
      style: 'aracnido',
      set: () => S().then((m) => m.ciudad),
      in: { kind: 'fade', dur: 0.4, color: 0x000000 },
      // fly between the letters: a dolly that accelerates, a little hand
      cam: [
        { t: 0, x: 960, y: 560, z: -520, hand: 2 },
        { t: PG[0] + TURN, y: 700, z: 840, ease: 'in' },
      ],
      camRm: [
        { t: 0, x: 960, y: 520, z: 0 },
        { t: PG[0] + TURN, z: 220, ease: 'linear' },
      ],
    },
    {
      id: 'senal',
      dur: PG[1] + TURN - PG[0],
      style: 'aracnido',
      set: () => S().then((m) => m.senal),
      in: { kind: 'pageTurn', dur: TURN, dir: -1, tint: 0xfff8e8 },
      cam: [
        { t: 0, x: 960, y: 320, fov: 1.16 },
        { t: 4.6, x: 960, y: 320, fov: 1.18, ease: 'linear' },
        { t: 5.1, x: 495, y: 820, fov: 1.78, ease: 'expoOut' },
        { t: 7.6, x: 520, y: 820, fov: 1.8, ease: 'linear' },
        { t: 8.1, x: 1405, y: 820, fov: 1.74, ease: 'expoOut' },
        { t: 10.7, x: 1390, y: 810, fov: 1.7, ease: 'linear' },
      ],
      camRm: [
        { t: 0, x: 960, y: 320, fov: 1.16, ease: 'hold' },
        { t: 4.9, x: 495, y: 820, fov: 1.78, ease: 'hold' },
        { t: 7.9, x: 1405, y: 820, fov: 1.74, ease: 'hold' },
      ],
    },
    {
      id: 'pandilla',
      dur: LUZ + TURN - PG[1],
      style: 'aracnido',
      set: () => S().then((m) => m.pandilla),
      in: { kind: 'pageTurn', dur: TURN, dir: -1, tint: 0xfff8e8 },
      cam: [
        { t: 0, x: 520, y: 540, fov: 1.1 },
        { t: 4.6, x: 540, y: 540, fov: 1.12, ease: 'linear' },
        { t: 5.1, x: 1400, y: 540, fov: 1.1, ease: 'expoOut' },
        { t: 9.9, x: 1400, y: 560, fov: 1.14, ease: 'linear' },
        { t: 10.2, x: 1390, y: 540, fov: 1.2, ease: 'expoOut' },
        { t: 13.0, x: 1380, y: 560, fov: 1.18, ease: 'linear' },
        { t: 15.7, x: 960, y: 540, fov: 1.0, ease: 'inOut' },
      ],
      camRm: [
        { t: 0, x: 520, y: 540, fov: 1.1, ease: 'hold' },
        { t: 4.9, x: 1400, y: 540, fov: 1.1, ease: 'hold' },
        { t: 13.5, x: 960, y: 540, fov: 1.0, ease: 'hold' },
      ],
    },
    {
      id: 'luz',
      dur: PG[3] + 5 - LUZ,
      style: 'aracnido',
      set: () => S().then((m) => m.luz),
      in: { kind: 'pageTurn', dur: TURN, dir: -1, tint: 0xfff8e8 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.02 },
        { t: 5, x: 820, y: 600, fov: 1.14, ease: 'sine' },
        { t: 10, x: 800, y: 610, fov: 1.16, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 880, y: 580, fov: 1.08 }],
    },
  ],
  score: [
    at(PG[0], v('sound', { name: 'paper' })),
    at(PG[0] + 9.0, v('sound', { name: 'glitch', pitch: 1.4 })),
    at(PG[1], v('sound', { name: 'paper' })),
    at(PG[1] + 6.3, v('sound', { name: 'boom' })),
    at(PG[2], v('sound', { name: 'tick', pitch: 1.6 })),
    at(LUZ, v('sound', { name: 'paper' })),
    at(PG[3] + 0.3, v('sound', { name: 'nib' })),
  ],
  close: { kind: 'fade', dur: 0.6, color: 0x000000 },
};
