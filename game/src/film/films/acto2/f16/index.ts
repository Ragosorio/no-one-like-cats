/**
 * F16 · PC Daria «Una sola línea» (H81, closes the battle against Itō; guion: historia-v2/guiones/acto-2/h81-ito.md, compás
 * por compás). FRAGMENT c25 → end (1:43.4), one single cut (MÚSICA, musica-v2/daria.md §1): it OPENS in the stop of
 * c25, goes through the drum gap of c41, and ends on the DRY CUT of c81.
 *
 * STYLE: CONTINUOUS THREAD — the world is one white thread on indigo (stands, rings, banners, the spectators drawn as a
 * contour), the fighters in cel. When someone cuts, the drawing is cut; the 16:9 frays from its edges. Daria's volume
 * hardly moves (LRA 0.8), so the picture hangs on the BRIGHTNESS and the voice: hats in at c33 and c65 (the thread
 * lights up), out at c49 (calmer). 103 s · 2 optional clicks (CORTA at c25.5, ¡FIN! at c80 — without them, it all
 * happens anyway) · daria (original, song film).
 *
 *   c25        the stop: everything taut; Esquirla leaps at Canelo's back with her glitch shard
 *   c25.5      the 808 returns: ITŌ, WITHOUT LOOKING, throws a thread back and cuts the shard      [CORTA]
 *   c26–29     «Al gato no. Así no.» (Esquirla limps off through the stands) · «Perdón. Sigamos.»   v2-h
 *   c29–33     the exchanges: «Fuego de pescado» vs a thread, one per bar; every cut stays in the drawing
 *   c33–41     the edge (hats in, the thread lights up): among flying threads; the crew holds; HER LIGHT marks
 *              the paths; Itō's flurry; Canelo cornered, small flame; Itō turns to the stands: «¡Cru—»
 *   c41        THE GAP (1.5 beats): the name erases letter by letter; Cruceta's figure in the stands unravels.
 *              «…¿A quién llamabas?» «No sé.»                                                         la revelación
 *   c43–49     on: slower, his gaze lost; a hole in the stands where the figure was
 *   c49–65     the second round (calmer): he kicks Esquirla's shard away from Canelo; the stage's thread draws his
 *              bow; eyes; the crew pushes, Itō retreats
 *   c65–81     the last exchange (everything lit): the circle run, the frame frays; Canelo gathers ALL his fire,
 *              Luzterna raises the lantern and her light marks the path; c80 the crossing          [¡FIN!]
 *   c81        DRY CUT: his own thread turns GREY; Itō falls to his knees; the whole stage lets go and falls like snow  [TEMP-S4]
 */
import type { FilmDef, CamKey, FilmSceneDef } from '../../../types';
import { tap, v } from '../../../../momentos/score';
import { MUSIC } from '../music';

const S = () => import('./sets');
const BAR = 240 / 134;
const c = (bar: number) => (bar - 25) * BAR;
/** the song's end after the dry cut (146.363 s − c81 at 143.284 s: the master's room) */
const TAIL = 146.363 - (42.985 + c(81));
const sc = (id: string, a: number, b: number, cam: CamKey[], camRm?: CamKey[], extra: Partial<FilmSceneDef> = {}): FilmSceneDef => ({
  id,
  dur: b - a,
  style: 'hilo',
  aspect: 16 / 9,
  set: () => S().then((m) => (m as unknown as Record<string, unknown>)[id]),
  in: { kind: 'cut', dur: 0 },
  cam,
  camRm,
  ...extra,
});
const hold = (t: number, x: number, y: number, fov: number, hand = 0): CamKey => ({ t, x, y, fov, hand, ease: 'hold' });

export const F16: FilmDef = {
  id: 'f16',
  title: 'Una sola línea',
  kind: 'song',
  track: MUSIC.f16,
  from: '#24',
  cutDry: true,
  loader: { style: 'ukiyoe', caption: 'DARIA' },
  scenes: [
    sc('stop', c(25), c(26), [hold(0, 960, 560, 1.0)], undefined, { in: { kind: 'fade', dur: 0.15, color: 0x060a2a } }),
    sc('honor', c(26), c(29), [hold(0, 1100, 600, 1.08), { t: 3.4, x: 1080, y: 600, fov: 1.1, ease: 'linear' }, hold(c(28) - c(26), 640, 600, 1.85), { t: c(29) - c(26), x: 640, y: 590, fov: 1.9, ease: 'linear' }]),
    sc('intercambio', c(29), c(33), [{ t: 0, x: 900, y: 580, fov: 1.0 }, { t: c(33) - c(29), x: 1020, y: 580, fov: 1.02, ease: 'linear' }]),
    sc(
      'filo',
      c(33),
      c(41),
      [
        { t: 0, x: 820, y: 560, fov: 1.0, z: -100, hand: 2 },
        { t: BAR - 0.01, x: 900, y: 560, z: 380, ease: 'in' },
        hold(BAR, 250, 600, 1.9, 2),
        hold(BAR * 2, 620, 560, 1.25),
        hold(BAR * 3, 900, 600, 1.7, 4),
        hold(BAR * 4, 1520, 640, 1.9, 2),
        { t: BAR * 7 - 0.01, x: 1520, y: 630, fov: 2.0, ease: 'linear' },
        hold(BAR * 7, 880, 560, 1.8),
        { t: BAR * 8, x: 880, y: 550, fov: 1.86, ease: 'linear' },
      ],
      [hold(0, 820, 560, 1.0), hold(BAR, 250, 600, 1.9), hold(BAR * 2, 620, 560, 1.25), hold(BAR * 3, 900, 600, 1.7), hold(BAR * 4, 1520, 640, 1.9), hold(BAR * 7, 880, 560, 1.8)],
      { look: { expo: 1.1 } },
    ),
    sc('hueco', c(41), c(43), [hold(0, 980, 540, 1.32), hold(BAR * 0.375 + 0.25, 1220, 600, 1.1)]),
    sc('seguir', c(43), c(49), [{ t: 0, x: 960, y: 580, fov: 1.0 }, { t: c(49) - c(43), x: 900, y: 580, fov: 1.04, ease: 'linear' }]),
    sc(
      'vuelta',
      c(49),
      c(65),
      [
        { t: 0, x: 960, y: 600, fov: 0.98 },
        hold(2.0, 1000, 820, 2.2),
        { t: BAR * 4 - 0.01, x: 960, y: 820, fov: 2.1, ease: 'linear' },
        hold(BAR * 4, 960, 560, 1.0),
        hold(BAR * 8, 780, 545, 3.0),
        hold(BAR * 8.5, 1330, 615, 3.0),
        hold(BAR * 9, 780, 545, 3.2),
        hold(BAR * 9.5, 1330, 615, 3.2),
        hold(BAR * 10, 960, 580, 1.0, 1.5),
        { t: BAR * 16, x: 860, y: 580, fov: 1.04, ease: 'linear' },
      ],
      [hold(0, 960, 600, 0.98), hold(2.0, 1000, 820, 2.2), hold(BAR * 4, 960, 560, 1.0), hold(BAR * 8, 780, 545, 3.0), hold(BAR * 9, 1330, 615, 3.0), hold(BAR * 10, 960, 580, 1.0)],
    ),
    sc(
      'final',
      c(65),
      c(81),
      [
        { t: 0, x: 900, y: 600, fov: 1.0, hand: 2 },
        { t: BAR * 8 - 0.01, x: 1020, y: 590, fov: 1.02, ease: 'linear' },
        hold(BAR * 8, 880, 600, 1.06, 1),
        { t: BAR * 14, x: 960, y: 600, fov: 1.2, ease: 'in' },
        hold(BAR * 15, 960, 600, 1.0, 3),
        { t: BAR * 16, x: 960, y: 600, fov: 1.05, ease: 'linear' },
      ],
      [hold(0, 960, 600, 1.0), hold(BAR * 8, 880, 600, 1.06), hold(BAR * 15, 960, 600, 1.0)],
      { look: { expo: 1.15 } },
    ),
    sc('cola', c(81), c(81) + TAIL, [hold(0, 960, 580, 1.0)]),
  ],
  score: [
    // CORTA: Itō's thread cuts the shard (without a tap it cuts anyway) — a tap adds a spark on the cut
    tap(c(25.5), { id: 'corta', label: 'CORTA', lead: 0.45, anchor: [1300, 600] }, { great: [v('sparkle', { at: [1520, 600], n: 8, spread: 90 })], hit: [v('sparkle', { at: [1520, 600], n: 5, spread: 70 })] }),
    // ¡FIN!: the last crossing (it comes on its own)
    tap(c(80), { id: 'fin', label: '¡FIN!', lead: 0.6, anchor: [960, 420] }, { great: [v('flash', { amount: 0.35 }), v('sparkle', { at: [960, 620], n: 10, spread: 160 })], hit: [v('sparkle', { at: [960, 620], n: 6, spread: 120 })] }),
  ],
  close: { kind: 'cut', dur: 0 },
};
