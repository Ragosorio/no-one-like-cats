/**
 * F14 · PH «Entrenamiento» (H80 ♥; guion: historia-v2/guiones/acto-2/h80-entrenamiento.md) — THREE strips, one before
 * each training arc (MECÁNICAS plays f14_1 / f14_2 / f14_3 at the start of its arc).
 *
 * STYLE: YONKOMA — a vertical strip of four panels in manga screentone, black and white with ONE colour: the blue of
 * her lantern. The panels open one by one, top to bottom, on the piano's phrases; the punch line is always the fourth;
 * at the end the camera pulls back and the whole strip is there, like the page of a magazine. ~20 s each · 0 clicks ·
 * daria.piano («Piano de vinilo»).
 *
 *   TIRA 1 · Pirata (puntería): «Lección uno: apunta con el corazón.» → Canelo, paw on his chest, solemn → ¡BUM!, the
 *            bullet leaves for anywhere → Super Siamés with the bullet in his ramen, noodles on his head:
 *            «…Con el corazón de OTRO.» (she whistles at the back; nothing goes through her [TEMP-P3])
 *   TIRA 2 · Ninja (sigilo): «Lección dos: el ninja es invisible.» (lantern ON) → the bush glows blue like a neon sign →
 *            a ninja cat taps their shoulders → both hanging upside down: «Esa lección era para ti.»
 *   TIRA 3 · El nombre del ataque: Canelo with HER sensei headband: «Aquí los ataques se gritan…» → «…rayo…» in tiny
 *            letters → «¡MÁS FUERTE!» → «¡RAYO DE… LUZ… TERNA!»; the whole sea turns to look, the boats too
 */
import type { FilmDef, CamKey } from '../../../types';
import { at, v } from '../../../../momentos/score';
import { MUSIC } from '../music';

const S = () => import('./sets');
const DUR = 20;
const OPEN = [0.4, 4.4, 9.4, 14.2];
/** the camera reads the strip panel by panel, then pulls back to the whole strip */
const CAM: CamKey[] = [
  { t: 0, x: 960, y: 380, fov: 1.38 },
  { t: 3.9, x: 960, y: 400, fov: 1.4, ease: 'linear' },
  { t: 4.4, x: 960, y: 790, fov: 1.45, ease: 'expoOut' },
  { t: 8.9, x: 960, y: 800, fov: 1.46, ease: 'linear' },
  { t: 9.4, x: 960, y: 1240, fov: 1.45, ease: 'expoOut' },
  { t: 13.7, x: 960, y: 1250, fov: 1.46, ease: 'linear' },
  { t: 14.2, x: 960, y: 1690, fov: 1.42, ease: 'expoOut' },
  { t: 18.0, x: 960, y: 1700, fov: 1.44, ease: 'linear' },
  { t: 19.4, x: 960, y: 1010, fov: 0.53, ease: 'inOut' },
];
const CAM_RM: CamKey[] = [
  { t: 0, x: 960, y: 380, fov: 1.38, ease: 'hold' },
  { t: 4.4, x: 960, y: 790, fov: 1.45, ease: 'hold' },
  { t: 9.4, x: 960, y: 1240, fov: 1.45, ease: 'hold' },
  { t: 14.2, x: 960, y: 1690, fov: 1.42, ease: 'hold' },
  { t: 18.6, x: 960, y: 1010, fov: 0.53, ease: 'hold' },
];
function tira(n: 1 | 2 | 3, title: string): FilmDef {
  return {
    id: `f14_${n}`,
    title: `Entrenamiento · ${title}`,
    kind: 'interlude',
    track: MUSIC.f14,
    loader: { style: 'ukiyoe', caption: 'MAR SHŌNEN' },
    scenes: [
      {
        id: 'tira',
        dur: DUR,
        style: 'manga',
        set: () => S().then((m) => (n === 1 ? m.tira1Set : n === 2 ? m.tira2Set : m.tira3Set)),
        in: { kind: 'fade', dur: 0.4, color: 0xffffff },
        cam: CAM,
        camRm: CAM_RM,
      },
    ],
    score: [...OPEN.map((t) => at(t, v('sound', { name: 'paper', pitch: 1.4 }))), at(OPEN[3] + 0.4, v('sound', { name: n === 1 ? 'splash' : n === 2 ? 'whoosh' : 'boom', pitch: 1.2 }))],
    close: { kind: 'fade', dur: 0.6, color: 0xffffff },
  };
}
export const F14_FILMS: FilmDef[] = [tira(1, 'Puntería'), tira(2, 'Sigilo'), tira(3, 'El grito')];
