/**
 * F13 · PP «El Gran Torneo» (H79, before El rival que no te conoce, A-5; guion: historia-v2/guiones/acto-2/h79-el-gran-torneo.md).
 *
 * STYLE: a TV anime's «NEXT EPISODE» preview — cel bake, flat skies in bands, focus lines, an eyecatch, giant slanted
 * letters that slam in on every cut (no narrator's voice: the voice is the text). Every cut lands on a beat of «Calle
 * fría» (Daria c9–16 without drums or voice, 134 BPM: the piece loops in bars under the 30 s, filmEdit).
 * 30 s · 0 clicks · daria.calle.
 *
 *   0–3.6    eyecatch: Canelo and Super Siamés back to back, spinning · ¡EN EL PRÓXIMO EPISODIO…!     [P]
 *   3.6–7.6  the stone arena from the air; the bracket fills, OUR name on the first line
 *            · ¡EL GRAN TORNEO DEL MAR SHŌNEN!                                                       [P] dónde / qué pasa
 *   7.6–10.8 the arena's gatera chained in gold — Cerito's prints go in under it · ¡SOLO EL CAMPEÓN CRUZA!  por qué
 *   10.8–14.8 THE RIVAL WHO DOESN'T KNOW YOU, headband, pointing, tears · «¡POR FIN NOS VOLVEMOS A VER, MI RIVAL
 *            DE LA INFANCIA!» (NUNCA LO HABÍAMOS VISTO)                                              [P] rival
 *   14.8–21  THE RULE «Poder»: his HP drops under 50 %, he screams, the aura, his next shot comes out ENORMOUS
 *            (the simulator's real flight, scaled) · ¡PODER! · BAJO EL 50 %: UN GOLPE CON AURA. UNA VEZ.  [M] la regla
 *   21–22    half a second: Canelo panting, his flame tiny                                          señal de Canelo
 *   22–24.6  Luzterna tries the poster's anime pose — the eyecatch FREEZES her mid-wobble             [C] Luzterna
 *   24.6–30  the episode card: LO QUE ARRIESGAMOS (her handwriting) · ¡NO TE LO PIERDAS!            [A] → batalla
 */
import type { FilmDef, FilmSceneDef } from '../../../types';
import { at, v } from '../../../../momentos/score';
import { MUSIC } from '../music';

const S = () => import('./sets');
const B = 60 / 134;
/** the cuts, on beats of Calle fría */
const T = { torneo: 8 * B, rival: 24 * B, regla: 33 * B, jadeo: 47 * B, pose: 49 * B, riesgo: 55 * B, end: 55 * B + 5.6 };
const sc = (id: string, a: number, b: number, extra: Partial<FilmSceneDef>): FilmSceneDef => ({
  id,
  dur: b - a,
  style: 'anime',
  set: () => S().then((m) => (m as unknown as Record<string, unknown>)[id]),
  in: { kind: 'cut', dur: 0 },
  ...extra,
});

export const F13: FilmDef = {
  id: 'f13',
  title: 'El Gran Torneo',
  kind: 'briefing',
  track: MUSIC.f13,
  loader: { style: 'ukiyoe', caption: 'PRESENTACIÓN · MAR SHŌNEN' },
  scenes: [
    sc('eyecatch', 0, T.torneo, { in: { kind: 'fade', dur: 0.3, color: 0xffffff }, cam: [{ t: 0, x: 960, y: 540, fov: 1.0 }] }),
    sc('torneo', T.torneo, T.rival, {
      cam: [
        { t: 0, x: 960, y: 380, fov: 0.92 },
        { t: 1.3, x: 960, y: 540, fov: 1.0, ease: 'expoOut' },
        { t: 4.45, x: 960, y: 540, fov: 1.0, ease: 'hold' },
        { t: 7.1, x: 960, y: 560, fov: 1.14, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 960, y: 540, fov: 1.0 }],
    }),
    sc('rival', T.rival, T.regla, {
      cam: [
        { t: 0, x: 960, y: 520, fov: 1.0, hand: 3 },
        { t: 4, x: 960, y: 480, fov: 1.2, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 960, y: 520, fov: 1.05 }],
    }),
    sc('regla', T.regla, T.jadeo, {
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.0 },
        { t: 1.3, x: 860, y: 560, fov: 1.0, ease: 'linear' },
        { t: 2.0, x: 820, y: 580, fov: 1.14, ease: 'expoOut' },
        { t: 2.9, x: 860, y: 570, fov: 1.12, ease: 'linear' },
        { t: 3.2, x: 1100, y: 560, fov: 1.0, ease: 'expoOut' },
      ],
      camRm: [{ t: 0, x: 960, y: 540, fov: 1.0 }],
    }),
    sc('jadeo', T.jadeo, T.pose, { cam: [{ t: 0, x: 900, y: 560, fov: 1.3, hand: 4 }], camRm: [{ t: 0, x: 900, y: 560, fov: 1.3 }] }),
    sc('pose', T.pose, T.riesgo, { cam: [{ t: 0, x: 960, y: 520, fov: 1.05 }] }),
    sc('riesgo', T.riesgo, T.end, { in: { kind: 'whip', dur: 0.36, dir: -1 }, cam: [{ t: 0, x: 960, y: 540, fov: 1.0 }] }),
  ],
  score: [
    at(1.35, v('sound', { name: 'boom', pitch: 1.4 })),
    at(T.torneo + 0.25, v('sound', { name: 'whoosh' })),
    at(T.torneo + 4.9, v('sound', { name: 'boom', pitch: 1.2 })),
    at(T.rival + 0.5, v('sound', { name: 'whoosh', pitch: 1.3 })),
    at(T.regla + 0.25, v('sound', { name: 'boom', pitch: 1.6 })),
    at(T.regla + 2.9, v('sound', { name: 'whoosh', pitch: 0.8 })),
    at(T.regla + 3.7, v('sound', { name: 'boom' })),
    at(T.pose + 1.25, v('sound', { name: 'tick', pitch: 0.8 })),
    at(T.riesgo + 0.5, v('sound', { name: 'nib' })),
    at(T.riesgo + 3.7, v('sound', { name: 'boom', pitch: 1.3 })),
  ],
  close: { kind: 'fade', dur: 0.5, color: 0x000000 },
};
