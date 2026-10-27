/**
 * F03 · PP «NINGUNA CAJA ES HOGAR» (H71, before the Brecha battle; guion: historia-v2/guiones/acto-1/h71-ninguna-caja.md).
 *
 * STYLE: stencil & propaganda poster — red, black and kraft paper, block letters with their bridges, overspray past the
 * edges. The Disruptors speak in graffiti: their presentation is their manifesto PASTED OVER THE TV — the picture stays
 * the Borracha's 4:3, but the posters slap on crooked, with tape, over the bezel (the scene is full frame and draws its
 * own black bezel so they can overlap it). The stencil animates on twos. 35 s · 0 clicks · `drunck.battle`.
 *
 *   0–4     LA ÚLTIMA RONDA · OTRA VEZ    the bar's facade in colour; a stencil sheet drops on it, the can sweeps: the bar
 *                                        turns into a red-and-black poster                                   [P] dónde
 *   4–10    poster: the BAÑO door cracks  flat red silhouettes jump out of the crack, two poses per step  [M] qué pasa
 *   10–15   poster: LA LLAVE              a kitten of static with a keyhole in its chest, sunburst; sprayed word [P] por qué
 *   15–17   Canelo, in colour             peeks from behind a table, gulps: «¿La llave de qué?»          [C]
 *   17–22   poster: BRECHA                three-quarters, two stencil layers, the poster breathes on the beat [P] rival
 *   22–27   SILLAS VOLADORAS              the bar in stencil; a chair rises on the Mareo's sway, floats side to side and
 *                                        lands in front of your ship: the enemy's shot breaks on it — cover  [M] la regla
 *   27–35   «NINGUNA CAJA ES OGAR»        Luzterna corrects the spelling with her beam (the missing H); the stencil cats
 *                                        glare at her — LO QUE ARRIESGAMOS on the logbook                  [C] → [A]
 */
import type { FilmDef } from '../../../types';

const W = 16 / 9;

export const F03: FilmDef = {
  id: 'f03',
  title: 'Ninguna caja es hogar',
  kind: 'briefing',
  track: 'drunck.battle',
  loader: { style: 'bass', caption: 'PRESENTACIÓN · LA BORRACHA' },
  look: { grain: 0.05 },
  scenes: [
    {
      id: 'fachada',
      dur: 4,
      style: 'estencil',
      set: () => import('./sets').then((m) => m.fachada),
      aspect: W,
      in: { kind: 'fade', dur: 0.4, color: 0x000000 },
      weather: [{ kind: 'rain', amount: 0.25, angle: 0.1, color: 0xd8c8a8, seed: 7 }],
      cam: [{ t: 0, x: 960, y: 540, hand: 1.5 }],
      camRm: [{ t: 0, x: 960, y: 540 }],
    },
    {
      id: 'grieta',
      dur: 6,
      style: 'estencil',
      set: () => import('./sets').then((m) => m.grieta),
      aspect: W,
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1 },
        { t: 6, fov: 1.06, y: 560, ease: 'sine' },
      ],
    },
    {
      id: 'llave',
      dur: 5,
      style: 'estencil',
      set: () => import('./sets').then((m) => m.llave),
      aspect: W,
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.04 },
        { t: 5, fov: 1.12, ease: 'sine' },
      ],
    },
    {
      id: 'canelo',
      dur: 2,
      style: 'tv',
      set: () => import('./sets').then((m) => m.canelo),
      aspect: W,
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 560, fov: 1, hand: 2.5 },
        { t: 0.18, fov: 1.22, y: 600, ease: 'expoOut' },
      ],
      camRm: [{ t: 0, x: 960, y: 580, fov: 1.1 }],
    },
    {
      id: 'brecha',
      dur: 5,
      style: 'estencil',
      set: () => import('./sets').then((m) => m.brecha),
      aspect: W,
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 540, z: 0 },
        { t: 5, z: 90, ease: 'sine' },
      ],
    },
    {
      id: 'regla',
      dur: 5.6,
      style: 'estencil',
      set: () => import('./sets').then((m) => m.regla),
      aspect: W,
      in: { kind: 'paintSmear', dur: 0.6, dir: 1, tint: 0xb8221c, seed: 5 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1 },
        { t: 5.6, x: 990, fov: 1.05, ease: 'sine' },
      ],
    },
    {
      id: 'ogar',
      dur: 8,
      style: 'tv',
      set: () => import('./sets').then((m) => m.ogar),
      aspect: W,
      in: { kind: 'cut', dur: 0 },
      weather: [{ kind: 'rain', amount: 0.2, angle: 0.1, color: 0xbfd6ff, seed: 9 }],
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.08 },
        { t: 3.6, fov: 1.02, ease: 'sine' },
      ],
    },
  ],
  close: { kind: 'fade', dur: 0.5, color: 0x000000 },
};
