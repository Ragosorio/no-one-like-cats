/**
 * F01 · PP «Oficial Dona» (H69, before B-5; guion: historia-v2/guiones/acto-1/h69-pp-oficial-dona.md).
 *
 * STYLE: the opening titles of a 1970s cop show — yellow block titles with a hard shadow, crash zooms, a split screen
 * in three, a freeze frame with the name over it, the turret painting everything red and blue. La Borracha is the TV:
 * the 4:3 screen with its scanlines. 25 s · 0 clicks · `drunck.barra` (the bass rumble of the song, from the street).
 *
 *   0–3     LA DONERÍA · MEDIANOCHE            wide street, drizzle, the pink neon donut — crash zoom on the patrol car
 *   3–7     split screen ×3                   Cerito's blurry footprints · the patrol · Canelo + Luzterna at the corner
 *   7–10    crash zoom on Canelo              he hides behind his scarf, SE BUSCA behind him: «Me buscan a mí.»
 *   10–15   OFICIAL DONA · LA LEY DE LA CAJA   out of the car, the turn — FREEZE FRAME, the name over it
 *   15–19   THE RULE, SHOWN (battle/demo.ts)   a shot at the hull: his bar drops · a shot on the donut: he eats it, the
 *                                              bar refills with sparkles — «La primera regla: no toquen mis donas.»
 *   19–22   Luzterna blows the turret out     the street goes dark: only her blue lantern; he sulks in the dark
 *   22–25   LO QUE ARRIESGAMOS                «Las huellas. Y la paciencia del gordo.»
 */
import type { FilmDef } from '../../../types';
import { moves, shot } from '../../../camera';

const TV43 = 4 / 3;

export const F01: FilmDef = {
  id: 'f01',
  title: 'Oficial Dona',
  kind: 'briefing',
  track: 'drunck.barra',
  loader: { style: 'tv', caption: 'PRESENTACIÓN · LA BORRACHA' },
  look: { grain: 0.06, warm: 0.1, lift: 0.025, sat: 1.12 },
  scenes: [
    {
      id: 'calle',
      dur: 3,
      style: 'tv',
      set: () => import('./sets').then((m) => m.calle),
      aspect: TV43,
      in: { kind: 'fade', dur: 0.5, color: 0x000000 },
      weather: [{ kind: 'rain', amount: 0.35, angle: 0.12, ground: 930, color: 0xbfd6ff, seed: 3 }],
      // a held wide shot, then the 70s crash zoom onto the patrol
      cam: [
        { t: 0, x: 960, y: 540, fov: 1 },
        { t: 2.2, fov: 1.04, ease: 'linear' },
        { t: 2.55, x: 1240, y: 640, fov: 2.1, ease: 'expoOut' },
      ],
      camRm: [
        { t: 0, x: 960, y: 540, fov: 1 },
        { t: 3, x: 1080, y: 590, fov: 1.25, ease: 'sine' },
      ],
    },
    {
      id: 'partida',
      dur: 4,
      style: 'tv',
      set: () => import('./sets').then((m) => m.partida),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
    },
    {
      id: 'canelo',
      dur: 3,
      style: 'tv',
      set: () => import('./sets').then((m) => m.canelo),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 960, y: 560, fov: 1 }], [{ t: 0.22, fov: 1.32, y: 520, ease: 'expoOut' }], [{ t: 0, hand: 3 }]),
      camRm: [{ t: 0, x: 960, y: 540, fov: 1.15 }],
    },
    {
      id: 'oficial',
      dur: 9,
      style: 'tv',
      set: () => import('./sets').then((m) => m.oficial),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 1000, y: 560, fov: 1.05 }], moves.dolly(0, 1.6, 0, 120, 'out'), [{ t: 4.9, z: 0, fov: 1, x: 960, y: 540, ease: 'hold' }]),
      camRm: [{ t: 0, x: 960, y: 540, fov: 1 }],
    },
    {
      id: 'luz',
      dur: 6,
      style: 'tv',
      set: () => import('./sets').then((m) => m.luz),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      weather: [{ kind: 'rain', amount: 0.3, angle: 0.12, ground: 930, color: 0xbfd6ff, seed: 5 }],
      cam: [
        { t: 0, x: 1100, y: 560, fov: 1.3 },
        { t: 2.6, x: 1120, y: 560, fov: 1.36, ease: 'sine' },
        { t: 3.2, x: 960, y: 540, fov: 1, ease: 'inOut' },
      ],
      camRm: [{ t: 0, x: 960, y: 540, fov: 1.05 }],
    },
  ],
  close: { kind: 'fade', dur: 0.6, color: 0x000000 },
};
