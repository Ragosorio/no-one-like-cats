/**
 * EL FINAL · clocks shared by a film's def (index.ts, eager) and its set (lazy module): plain numbers, no pixi.
 */

/** F34 (1/3) «regreso», scene seconds: the flame catches on the theme's entry (4.5 s); pasada 7 adds the pane and the joke */
export const REGRESO = { catchAt: 4.5, paneAt: 4.9, wakeAt: 9, jokeAt: 11, scarfAt: 16, dur: 20 } as const;

/**
 * F39 (3/3) «Continuará.» (h96-el-recado.md R12–R13): black, in silence · her Carta comes up, dim · the Capi's hand
 * writes the word in its bottom margin with a pencil (the only sound) · it holds · black. Scene seconds.
 */
export const CONTINUAR = {
  dur: 9.4,
  mapIn: 1.4,
  mapDur: 1.6,
  /** how dark the map stays (the black sheet's alpha) */
  dim: 0.62,
  write: 3.2,
  writeDur: 2.6,
  out: 7.8,
  outDur: 0.6,
  /** where the word goes: the bottom margin, under the boxes she drew */
  x: 1120,
  y: 940,
  /** the pencil strokes (scene s), irregular like a hand: the word's letters, then the period */
  strokes: [3.24, 3.5, 3.71, 3.98, 4.26, 4.47, 4.79, 5.05, 5.33, 5.74],
} as const;
