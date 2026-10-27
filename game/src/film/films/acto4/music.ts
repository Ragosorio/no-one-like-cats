/**
 * ACTO IV — the music of each film (pure). Originals only in the song films (F29 `no_game`, F30 `xti`); the briefings
 * and the karaoke use DERIVED pieces (musica-v2/10-produccion-oleada3.md §6: F26/F27 `xti.gira`, F28 `no_game.start`).
 */
/** NO G@ME NO LIF€: 90 BPM, 4/4, c1 = 0 s, 1 bar = 8/3 s (musica-v2/no-game-no-life.md) */
export const NG_BAR = 8 / 3;
export const NG = (bar: number) => (bar - 1) * NG_BAR;
/** xti es amor: 140 BPM, 4/4, c1 = 0 s, 1 bar = 12/7 s (musica-v2/xti-es-amor.md) */
export const XT_BAR = 12 / 7;
export const XT = (bar: number) => (bar - 1) * XT_BAR;
/** a beat of xti (and of its derived `xti.gira`) */
export const XT_BEAT = XT_BAR / 4;
/** a beat of NO G@ME (and of `no_game.start`) */
export const NG_BEAT = NG_BAR / 4;
/** `xti.gira` «De gira» (xti c49–56, the tutti): 1 bar of intro, then its loop — F26 and the karaoke of F27 */
export const GIRA = 'xti.gira';
/** `no_game.start` «PRESS START» (NO G@ME c1–2 ×2 + c53–56, without the distorted synth) — F28 */
export const START = 'no_game.start';
