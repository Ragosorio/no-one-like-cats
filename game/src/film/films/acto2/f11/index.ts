/**
 * F11 · PP «Cruceta» (H77, before Cruceta, S-9; guion: historia-v2/guiones/acto-2/h77-cruceta.md).
 *
 * STYLE: a Silver Age comic DRAWN BY THE RIVAL — flat printer's inks, big Ben-Day dots, aged paper, melodramatic
 * letters with triple exclamation marks, energy crackle. In his own cover WE are the villains. The cover opens like a
 * magazine into his interior pages. 40 s · 0 clicks · fut.vineta.mono (the same theme, printed: mono, an old radio).
 *
 *   0–5      the cover: ¡CRUCETA! · ¡¡¡CRUCETA CONTRA LA BANDA DEL GATO QUE ROMPE CIUDADES!!! — the hero with
 *            his script-paper cape, ink mask, fist forward                                         [P] dónde / qué pasa
 *   5–15     the villains as he drew them: Canelo with a twisted moustache, «LA BRUJA DE LA LINTERNA», Gato Araña
 *            crossed out (¡TRAIDOR!) · «¡Esta ciudad no le teme a ninguna bruja!»                  [M] cómo nos ve
 *   15–19    inside: the rooftop with 000's mark and a tear · ¡EN ESTA AZOTEA CAYÓ EL GATO…!        [P] por qué importa
 *   19–22    Canelo's flame drops next to the tear · ¡EL GORDO PIERDE SU FUEGO!                     señal de Canelo
 *   22–30    THE RULE «Rescate»: he fires (the simulator's real flight) — stops, dives, saves a kitten —
 *            the battle frozen ONE TURN · ¡NI EN LA BATALLA OLVIDA A SU CIUDAD!                     [M] la regla
 *   30–35    the real cover in Luzterna's hand: she draws him a moustache with her beam and writes NO SOY BRUJA  [C]
 *   35–40    the Bitácora slaps on: LO QUE ARRIESGAMOS                                             [A] → batalla
 */
import type { FilmDef } from '../../../types';
import { at, v } from '../../../../momentos/score';
import { MUSIC, VINETA } from '../music';

const S = () => import('./sets');
const PG = [VINETA.page(0), VINETA.page(1), VINETA.page(2), VINETA.page(3)];
const TURN = 0.7;
const HAND = PG[2] + VINETA.bar * 2;

export const F11: FilmDef = {
  id: 'f11',
  title: 'Cruceta',
  kind: 'briefing',
  track: MUSIC.f11,
  loader: { style: 'tv', caption: 'PRESENTACIÓN · CIUDAD MAYÚSCULA' },
  look: { grain: 0.04 },
  scenes: [
    {
      id: 'portada',
      dur: PG[1] + TURN,
      style: 'edadplata',
      set: () => S().then((m) => m.portada),
      in: { kind: 'fade', dur: 0.5, color: 0x000000 },
      // a dolly toward the cover; on the crash, down to the villains; back out for the balloon
      cam: [
        { t: 0, x: 960, y: 540, fov: 0.84 },
        { t: PG[0] - 0.1, x: 960, y: 520, fov: 1.0, ease: 'inOut' },
        { t: PG[0] + 0.5, x: 1360, y: 800, fov: 1.72, ease: 'expoOut' },
        { t: 10.8, x: 1340, y: 790, fov: 1.78, ease: 'linear' },
        { t: 11.6, x: 1180, y: 560, fov: 1.18, ease: 'inOut' },
        { t: PG[1] + TURN, x: 1170, y: 560, fov: 1.2, ease: 'linear' },
      ],
      camRm: [
        { t: 0, x: 960, y: 540, fov: 0.92, ease: 'hold' },
        { t: PG[0], x: 1360, y: 800, fov: 1.72, ease: 'hold' },
        { t: 11.3, x: 1180, y: 560, fov: 1.18, ease: 'hold' },
      ],
    },
    {
      id: 'interior',
      dur: HAND + TURN - PG[1],
      style: 'edadplata',
      set: () => S().then((m) => m.interior),
      in: { kind: 'pageTurn', dur: TURN, dir: -1, tint: 0xf4e6c4 },
      cam: [
        { t: 0, x: 620, y: 290, fov: 1.55 },
        { t: 3.4, x: 640, y: 290, fov: 1.58, ease: 'linear' },
        { t: 3.9, x: 1520, y: 290, fov: 1.6, ease: 'expoOut' },
        { t: 6.6, x: 1510, y: 300, fov: 1.62, ease: 'linear' },
        { t: 7.1, x: 350, y: 800, fov: 1.75, ease: 'expoOut' },
        { t: 9.2, x: 360, y: 800, fov: 1.76, ease: 'linear' },
        { t: 9.6, x: 960, y: 800, fov: 1.75, ease: 'expoOut' },
        { t: 11.7, x: 970, y: 800, fov: 1.76, ease: 'linear' },
        { t: 12.1, x: 1570, y: 800, fov: 1.75, ease: 'expoOut' },
        { t: 14.2, x: 1560, y: 790, fov: 1.74, ease: 'linear' },
        { t: 15.2, x: 960, y: 540, fov: 1.0, ease: 'inOut' },
      ],
      camRm: [
        { t: 0, x: 620, y: 290, fov: 1.55, ease: 'hold' },
        { t: 3.7, x: 1520, y: 290, fov: 1.6, ease: 'hold' },
        { t: 6.9, x: 350, y: 800, fov: 1.75, ease: 'hold' },
        { t: 9.4, x: 960, y: 800, fov: 1.75, ease: 'hold' },
        { t: 11.9, x: 1570, y: 800, fov: 1.75, ease: 'hold' },
        { t: 14.8, x: 960, y: 540, fov: 1.0, ease: 'hold' },
      ],
    },
    {
      id: 'bruja',
      dur: PG[3] + 5.0 - HAND,
      style: 'edadplata',
      set: () => S().then((m) => m.bruja),
      in: { kind: 'pageTurn', dur: TURN, dir: -1, tint: 0xf4e6c4 },
      cam: [
        { t: 0, x: 1000, y: 560, fov: 1.0 },
        { t: 1.2, x: 1040, y: 520, fov: 1.25, ease: 'inOut' },
        { t: 3.8, x: 1080, y: 560, fov: 1.18, ease: 'linear' },
        { t: 5.0, x: 960, y: 560, fov: 1.0, ease: 'inOut' },
      ],
      camRm: [{ t: 0, x: 1000, y: 560, fov: 1.05 }],
    },
  ],
  score: [
    at(PG[0] + 0.1, v('sound', { name: 'whoosh', pitch: 0.9 })),
    at(PG[1], v('sound', { name: 'paper' })),
    at(PG[1] + 10.0, v('sound', { name: 'whoosh', pitch: 1.3 })),
    at(HAND, v('sound', { name: 'paper' })),
    at(HAND + 0.5, v('sound', { name: 'nib', pitch: 1.2 })),
    at(PG[3] + 0.4, v('sound', { name: 'nib' })),
  ],
  close: { kind: 'fade', dur: 0.6, color: 0x000000 },
};
