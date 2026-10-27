/**
 * F28 · PP «Firma» (H91, the Carta's P-9 boss — `stages[].film: 'F28'`; guion:
 * historia-v2/guiones/acto-4/h91-firma.md §F28 · ficha: 03-peliculas.md F28).
 *
 * STYLE: a glossy MAGAZINE COVER (coated paper, embossed headlines) that opens into a MUSIC-VIDEO TEASER (scope,
 * countdown, lens flares, cuts on the beat). Firma presents herself the way a star does: on a cover and with a teaser.
 * 35 s · 0 clicks · «PRESS START» (`no_game.start`, derived: NO G@ME c1–2 ×2 + c53–56, no distorted synth).
 *
 *   0–4     the cover falls onto the main LED screen: FIRMA: «EL SHOW MÁS GRANDE DEL ARCHIVO» · ESTA NOCHE   [P] dónde
 *   4–10    teaser, cuts on the beat: the sound check — the reflectors come on; a stain of static (Cerito) goes to
 *           the brightest light; a glass cube comes down from the ceiling and closes                      [M] qué pasa
 *   10–14   the cube up close, Cerito leaning on the glass, his static trembling · EL INVITADO SIN FORMA   [P] por qué
 *   14–20   THE RULE on a stage screen: a hit → she POSES → a shiny shield for one turn (the next shot bounces;
 *           the turn after, it's gone) · REGLA: POSE DE PORTADA                                          [M] rival y regla
 *   20–24   a giant countdown on the three screens: 3 · 2 · 1… and it freezes on «1»                     [C]
 *   24–29   backstage: the crew in STAFF caps among the flight cases, laughing low; Luzterna turns Hipólito's
 *           backwards cap around with her beam; in the same shot Canelo yawns, his flame small, rubs his eyes
 *   29–35   the Bitácora: LO QUE ARRIESGAMOS                                                             [A] → batalla
 */
import type { FilmDef } from '../../../types';
import { START } from '../music';

const sets = () => import('./sets');
export const F28: FilmDef = {
  id: 'f28',
  title: 'Firma',
  kind: 'briefing',
  track: START,
  loader: { style: 'bass', caption: 'PRESENTACIÓN · LA GIRA' },
  scenes: [
    {
      id: 'portada',
      dur: 4.4,
      style: 'pop',
      set: () => sets().then((m) => m.portada),
      in: { kind: 'fade', dur: 0.4, color: 0x000000 },
      cam: [
        { t: 0, x: 960, y: 480, fov: 0.55 },
        { t: 0.9, x: 960, y: 130, fov: 1.0, ease: 'expoOut' },
        { t: 4.4, x: 960, y: 140, fov: 1.06, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 960, y: 130, fov: 1 }],
    },
    {
      id: 'teaser',
      dur: 10,
      style: { id: 'pop', params: { aberr: 0.9, hal: 0.55, contrast: 1.12 } },
      set: () => sets().then((m) => m.teaser),
      aspect: 2.39,
      in: { kind: 'lightLeak', dur: 0.5, tint: 0xffd8a0 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.0, hand: 2 },
        { t: 6, x: 960, y: 540, fov: 1.0 },
        { t: 9.9, x: 960, y: 520, fov: 1.12, ease: 'linear' },
      ],
    },
    {
      id: 'pose',
      dur: 6.2,
      style: 'pop',
      set: () => sets().then((m) => m.pose),
      in: { kind: 'glitch', dur: 0.4, seed: 28 },
      cam: [{ t: 0, x: 960, y: 540, fov: 1.03 }, { t: 6.2, fov: 1, ease: 'sine' }],
    },
    {
      id: 'cuenta',
      dur: 4,
      style: 'pop',
      set: () => sets().then((m) => m.cuenta),
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 420, fov: 0.56 },
        { t: 4, x: 960, y: 400, fov: 0.62, ease: 'linear' },
      ],
    },
    {
      id: 'staff',
      dur: 5,
      style: 'pop',
      set: () => sets().then((m) => m.staff),
      in: { kind: 'cut', dur: 0 },
      look: { warm: -0.04, sat: 1.0 },
      cam: [
        { t: 0, x: 960, y: 640, fov: 1.12, hand: 1.4 },
        { t: 5, x: 1000, y: 640, fov: 1.16, ease: 'linear' },
      ],
    },
    {
      id: 'riesgo',
      dur: 6,
      style: 'pop',
      set: () => sets().then((m) => m.riesgo),
      in: { kind: 'cut', dur: 0 },
    },
  ],
  close: { kind: 'fade', dur: 0.6, color: 0x000000 },
};
