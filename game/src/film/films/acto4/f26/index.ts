/**
 * F26 · PP «El mánager» (H89, the Carta's P-5 élite — `stages[].film: 'F26'`; guion:
 * historia-v2/guiones/acto-4/h89-backstage.md §F26 · ficha: 03-peliculas.md F26).
 *
 * STYLE: a FESTIVAL POSTER on the stadium's LED wall (the names drop into the line-up one by one, each in its own
 * type) and a laminated BACKSTAGE PASS that spins in front and catches the light. In POP everything is presented as a
 * line-up; El mánager is the one who decides who gets in. 32.5 s · 0 clicks · `xti.gira` (derived; loops).
 *
 *   0–1.6    the stadium in the dark, the LED wall glowing — the camera rises into the main screen          [P] dónde
 *   1.6–5.5  the poster: LA GIRA · FIRMA · GATO MALO · TAILOR SWIFT · EMIAU (telonero) drop on the beat;
 *            small, below: «y un invitado sin forma»                                                     [P] qué pasa
 *   5.5–9    slow zoom to the last line: «sin forma» flickers with static; a fan's phone (9:16) catches
 *            Esquirla crossing the crowd with her hood up, a trail of pixels                              [M] por qué
 *   9–14     the pass spins in front of the poster and stops: EL MÁNAGER · SIN PASE NO HAY PASO           [P] rival
 *   14–20    on a side screen, THE RULE: two cats of the same element fire ON THE BEAT and their shots
 *            join into one (SINCRO) — after one shot off the beat that comes out small                    [M] la regla
 *   20–24    the dressing room through the mirror: Luzterna fixes everyone's hair with her beam (Hipólito
 *            gets a quiff)                                                                                [C] su acción muda
 *   24–27    wider: all excited at the mirror — and in a corner Canelo sits a moment, his flame small.
 *            Nobody notices; he gets up and goes on (Act IV: the joy and the low flame in one shot)
 *   27–32.5  the Bitácora covers the screen: LO QUE ARRIESGAMOS                                          [A] → batalla
 */
import type { FilmDef } from '../../../types';
import { GIRA } from '../music';

const sets = () => import('./sets');
export const F26: FilmDef = {
  id: 'f26',
  title: 'El mánager',
  kind: 'briefing',
  track: GIRA,
  loader: { style: 'bass', caption: 'PRESENTACIÓN · LA GIRA' },
  scenes: [
    {
      id: 'cartel',
      dur: 14,
      style: 'pop',
      set: () => sets().then((m) => m.cartel),
      in: { kind: 'fade', dur: 0.5, color: 0x000000 },
      cam: [
        { t: 0, x: 960, y: 600, fov: 0.5, hand: 1.5 },
        { t: 1.6, x: 960, y: 130, fov: 1, ease: 'inOut' },
        { t: 5.4, x: 960, y: 140, fov: 1.02, ease: 'linear' },
        { t: 9.0, x: 960, y: 390, fov: 1.7, ease: 'sine' },
        { t: 9.7, x: 1070, y: 250, fov: 0.8, ease: 'inOut' },
        { t: 14, x: 1050, y: 240, fov: 0.84, ease: 'linear' },
      ],
      camRm: [
        { t: 0, x: 960, y: 130, fov: 1 },
        { t: 5.4, x: 960, y: 140, fov: 1 },
        { t: 9.0, x: 960, y: 390, fov: 1.4, ease: 'sine' },
        { t: 9.7, x: 1070, y: 250, fov: 0.82, ease: 'hold' },
      ],
    },
    {
      id: 'regla',
      dur: 6,
      style: 'pop',
      set: () => sets().then((m) => m.regla),
      in: { kind: 'glitch', dur: 0.4, seed: 26 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.04 },
        { t: 6, fov: 1, ease: 'sine' },
      ],
    },
    {
      id: 'camerino',
      dur: 7,
      style: 'pop',
      set: () => sets().then((m) => m.camerino),
      in: { kind: 'whip', dur: 0.45, dir: 1 },
      look: { warm: 0.16, hal: 0.4 },
      cam: [
        { t: 0, x: 1000, y: 640, fov: 1.3, hand: 1.2 },
        { t: 3.9, x: 1030, y: 650, fov: 1.36, ease: 'linear' },
        { t: 4.4, x: 960, y: 610, fov: 1.0, ease: 'inOut' },
        { t: 7, x: 940, y: 615, fov: 1.03, ease: 'linear' },
      ],
      camRm: [
        { t: 0, x: 1000, y: 640, fov: 1.3 },
        { t: 4.2, x: 960, y: 610, fov: 1.0, ease: 'hold' },
      ],
    },
    {
      id: 'riesgo',
      dur: 5.5,
      style: 'pop',
      set: () => sets().then((m) => m.riesgo),
      in: { kind: 'cut', dur: 0 },
      look: { warm: 0.12 },
    },
  ],
  close: { kind: 'fade', dur: 0.6, color: 0x000000 },
};
