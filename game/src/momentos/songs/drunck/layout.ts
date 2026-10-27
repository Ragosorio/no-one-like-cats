/**
 * LA ÚLTIMA RONDA — the layout of the bar and the alley (world px). Pure data (no Pixi): the cines and the tests import
 * it; bar.ts draws it. See bar.ts for what each place is.
 */
export const BAR = {
  left: -1100,
  right: 2700,
  top: -40,
  floor: 1120,
  /** the counter top: back edge / front edge (towards the camera) */
  counterBack: 690,
  counterFront: 760,
  /** patrons' bases (painting anchor bottom) — under the counter, hidden */
  canelo: { x: 1120, y: 860, h: 520 },
  hipolito: { x: 1760, y: 920, h: 520 },
  espuma: { x: 300, y: 905, h: 520 },
  /** Canelo's mug and the second mug (A3: «only the glass and the foam, no paw») */
  tarro: { x: 1262, y: 528, w: 118, h: 168 },
  tarro2: { x: 1462, y: 574, w: 96, h: 136 },
  /** the donut tower (R6) and Hipólito's donut (R1) */
  tower: { x: 1990, y: 700 },
  /** nothing right of this exists on screen before the reveal (world x) */
  hideX: 1585,
} as const;

export const CALLE = {
  left: -900,
  right: 4700,
  ground: 930,
  door: { x: 520, y: 930 },
  sign: { x: 520, y: 300 },
  posts: [1350, 2150, 2950, 3700],
  gatera: { x: 4060, y: 930 },
} as const;


/**
 * THE LISTENER RULE as geometry (pure; scenes/CajaScene.ts uses it every frame, tests prove it): the camera stays inside
 * the set and — in the bar, before the reveal — its RIGHT edge never passes BAR.hideX, on any screen (`view` = the
 * visible design-box rect, wider than 1920 on wide screens). Returns the camera that is actually used.
 */
export function frameCamera(
  x: number,
  y: number,
  zoom: number,
  view: { x: number; y: number; w: number; h: number },
  set: 'bar' | 'calle',
  revealed: boolean,
  /** the camera's roll (rad): a tilted frame's corner reaches further right (QA-PULIDO: c40 went 4–8 px past hideX) */
  rot = 0,
): { x: number; y: number; zoom: number } {
  const W = 1920;
  const H = 1080;
  const clamp = (v: number, a: number, b: number) => (a > b ? (a + b) / 2 : v < a ? a : v > b ? b : v);
  const z = Math.max(0.5, zoom);
  const halfL = (W / 2 - view.x) / z;
  const halfR = (view.x + view.w - W / 2) / z;
  const halfT = (H / 2 - view.y) / z;
  const halfB = (view.y + view.h - H / 2) / z;
  const b = set === 'bar' ? { l: BAR.left, r: BAR.right, t: BAR.top, b: BAR.floor } : { l: CALLE.left, r: CALLE.right, t: -380, b: 1320 };
  let cx = clamp(x, b.l + halfL, b.r - halfR);
  if (set === 'bar' && !revealed) cx = Math.min(cx, BAR.hideX - reach(halfR, halfT, halfB, rot));
  const cy = clamp(y, b.t + halfT, b.b - halfB);
  return { x: cx, y: cy, zoom: z };
}
/** how far right of its centre a (possibly rolled) frame reaches: the half-width, plus a rotated corner */
function reach(halfR: number, halfT: number, halfB: number, rot: number) {
  return halfR * Math.abs(Math.cos(rot)) + Math.max(halfT, halfB) * Math.abs(Math.sin(rot));
}
/** the right edge of what a camera shows (world x); `rot` = its roll, as in frameCamera */
export function rightEdge(cam: { x: number; zoom: number }, view: { x: number; w: number; y?: number; h?: number }, rot = 0) {
  const halfR = (view.x + view.w - 960) / cam.zoom;
  if (!rot) return cam.x + halfR;
  const vy = view.y ?? 0;
  const vh = view.h ?? 1080;
  return cam.x + reach(halfR, (540 - vy) / cam.zoom, (vy + vh - 540) / cam.zoom, rot);
}

/**
 * The bar's polish pass (docs/part-iii/13 §3.2, §3.4; scenes/caja/barDirector.ts): where the new props and effects
 * live (world px). Everything in the bar is LEFT of BAR.hideX (tests/p3BarPulido.test.ts proves it).
 */
export const BAR_PULIDO = {
  /** the window's glass (days and nights, the blue beam) */
  win: { x0: -166, y0: 84, x1: 466, y1: 436 },
  /** the beam rises from down in the city, outside */
  beam: { x: 60 },
  /** the tally board's face (CUENTAS: 14 marks = «Van catorce») */
  board: { x0: 106, y0: 88, x1: 394, y1: 186 },
  /** the TV's screen («pescado y pescado») */
  tv: { x0: 1196, y0: 86, x1: 1394, y1: 224 },
  /** the napkin = «esa hoja», flat on the counter left of the fries: far-left, far-right, near-right, near-left */
  napkin: [878, 700, 990, 700, 1004, 746, 864, 746] as number[],
  /** the PISAPAPELES placard's stand */
  placa: { x: 760, y: 690 },
  /** Espuma glides along the counter to here (the pencil gag) */
  espumaTo: 700,
  /** the alley: the trail of orange hairs from the door to the far end */
  pelos: { x0: CALLE.door.x + 150, x1: 3900, n: 26 },
} as const;
