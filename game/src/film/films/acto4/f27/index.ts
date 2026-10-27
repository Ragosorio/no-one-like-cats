/**
 * F27 · PH «Karaoke» (H90, the breath of the act; guion: historia-v2/guiones/acto-4/h90-la-gira.md §F27 · ficha:
 * 03-peliculas.md F27).
 *
 * STYLE: a PHOTO BOOTH — the screen is a VERTICAL STRIP OF FOUR PHOTOS, the stadium out of focus around it. Each photo
 * is a live frame that freezes with a flash, and the strip moves down one frame; inside, the karaoke: the lines light
 * up syllable by syllable under a bouncing ball. The photo the player picks (after the film, on this same strip) comes
 * back as the last slide of SADIE: the film IS the strip. 70 s · 1 optional click (¡APLAUDE!) · the karaoke base is
 * `xti.gira` (derived, no melody: the ball «sings» the invented song); from photo 4 on, NO music (`quiet`).
 *
 *   0–3     the booth: a curtain, a coin, a little red light; the crew squeezes in, Luzterna pushes to the front  [P]
 *   3–15    PHOTO 1: Luzterna with a toy mic sings HORRIBLY, eyes closed, her own lantern as her spotlight         [M]
 *           «Gato gordo, gato naranja, / se comió mi pan y mi esperanza.» — flash (15)
 *   16–26   PHOTO 2: Canelo comes in with a fish and BOOS her, lovingly; she sings louder to beat him — flash (26)
 *   27–41   PHOTO 3: cheek to cheek. She passes him the mic; he hesitates… and sings the chorus with her, horrible too;
 *           Hipólito, asleep at the back, nods on the beat · ¡APLAUDE! (opt.) · in a corner, a stain of static: Cerito
 *           peeking — flash (41)
 *   42–60   PHOTO 4, no music: the edge of the empty stage after the show. She sits in the air on the edge; he eats the
 *           buffet with both paws below. She looks at him for a long time: «Algún día quiero oír a este gordo hablar en
 *           casa. Aunque sea para pedir pescado.» (a wish about the future, never about rest) · he raises the fish: ¿mm?
 *   60–62   flash: photo 4 freezes
 *   62–66   the dressing room, low light: Canelo asleep on an armchair, half a fish; HIS FLAME DROPS BY ITSELF, slowly,
 *           like a candle in a draught, and comes back halfway. Nobody sees it (v2-i)
 *   66–70   the booth's slot: the strip comes out and hangs — all four photos, ready to be picked               [A]
 *
 * Of Luzterna, nothing changes in the photos (same as always: no fading, no farewell).
 */
import type { FilmDef } from '../../../types';
import { tap, v } from '../../../../momentos/score';
import { GIRA } from '../music';

const sets = () => import('./sets');
export const F27_FLASH = [15, 26, 41, 60];
export const F27: FilmDef = {
  id: 'f27',
  title: 'Karaoke',
  kind: 'interlude',
  track: GIRA,
  loader: { style: 'bass', caption: 'PELÍCULA · LA GIRA' },
  quiet: [[42, 80]],
  scenes: [
    {
      id: 'tira',
      dur: 62,
      style: { id: 'pop', params: { warm: 0.06, hal: 0.35 } },
      set: () => sets().then((m) => m.tira),
      in: { kind: 'fade', dur: 0.6, color: 0x000000 },
      // the camera rides the strip: the booth, then each photo centred; after each flash the strip moves one frame
      cam: [
        { t: 0, x: 960, y: -330, fov: 1.0 },
        { t: 2.6, x: 960, y: -330, fov: 1.0 },
        { t: 3.3, x: 960, y: 300, fov: 1.38, ease: 'inOut' },
        { t: 15.4, x: 960, y: 300, fov: 1.42, ease: 'linear' },
        { t: 16.0, x: 960, y: 840, fov: 1.38, ease: 'inOut' },
        { t: 26.4, x: 960, y: 840, fov: 1.42, ease: 'linear' },
        { t: 27.0, x: 960, y: 1380, fov: 1.38, ease: 'inOut' },
        { t: 41.4, x: 960, y: 1380, fov: 1.42, ease: 'linear' },
        { t: 42.0, x: 960, y: 1920, fov: 1.38, ease: 'inOut' },
        { t: 62, x: 960, y: 1920, fov: 1.46, ease: 'linear' },
      ],
      subs: [{ t: 47.5, dur: 6.6, who: 'Luzterna', text: 'Algún día quiero oír a este gordo hablar en casa. Aunque sea para pedir pescado.' }],
    },
    {
      id: 'sillon',
      dur: 4,
      style: { id: 'pop', params: { warm: 0.12, expo: 0.8, sat: 0.85 } },
      set: () => sets().then((m) => m.sillon),
      in: { kind: 'cut', dur: 0 },
      cam: [{ t: 0, x: 960, y: 560, fov: 1.0 }],
    },
    {
      id: 'ranura',
      dur: 4.6,
      style: { id: 'pop', params: { warm: 0.06 } },
      set: () => sets().then((m) => m.ranura),
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: -60, fov: 1.4 },
        { t: 2.4, x: 960, y: 720, fov: 0.355, ease: 'inOut' },
        { t: 4.6, x: 960, y: 720, fov: 0.355 },
      ],
      camRm: [{ t: 0, x: 960, y: -60, fov: 1.4 }, { t: 2.0, x: 960, y: 720, fov: 0.355, ease: 'hold' }],
    },
  ],
  score: [tap(33.5, { id: 'aplaude', label: '¡APLAUDE!', anchor: [1520, 880] }, { great: [v('sparkle', { at: [960, 460], n: 12, spread: 360 })], hit: [v('sparkle', { at: [960, 500], n: 8, spread: 300 })] })],
  close: { kind: 'cut', dur: 0 },
};
