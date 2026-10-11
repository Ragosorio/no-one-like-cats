/**
 * te ODIO — the set, drawn TWICE: the same things in the box's clean COMIC and in the Disruptores' STREET spray.
 *
 *  our ship     the player's aerobarco in the void (Kit Astral: comet fins + thruster), bow to the right
 *  la Lata      «La Lata de Pintura»: paint cans lashed into a hull, a giant spray can for a mast, a drop-cloth sail,
 *               spray-can cannons, the open-door-box flag — bow to the left
 *  the void     COMIC: print-blue space, Ben-Day dots, comic stars, a ringed planet, Kirby crackle, the panel border
 *               STREET: the same space as a wall: concrete, spray stars, a stencil planet, old posters and tags
 *  debris       two rocks (the battle's), both arts
 *  the hand     a hand of light holding a pencil (the one that draws the boxes)
 *
 * Local coordinates: a ship's origin is the bottom-centre of its hull; deck at y ≈ −125.
 */
import { Graphics } from 'pixi.js';
import { rng } from '../../anime/draw';
import { COMIC_INK, FLUO, INK, PRINT, WALL, benDay, drips, openBox, sprayLine, sprayPoly, sprayStar, tornRect } from './spray';

export type Art = 'comic' | 'street';

// ------------------------------------------------------------------ geometry (shared by both arts)
const HULL_A = [-272, -126, 250, -126, 312, -170, 296, -122, 238, -44, 126, -2, -168, -2, -248, -52];
const SAIL_A = [-6, -500, 196, -462, 176, -214, -6, -226];
const JIB_A = [10, -490, 10, -246, -128, -262];
const FINS = [
  [-250, -96, -372, -150, -330, -84],
  [-246, -58, -392, -64, -318, -28],
  [-236, -30, -350, 14, -300, -6],
];

/** our ship. `deck` items are drawn by the caller (actors) */
export function drawOurShip(g: Graphics, art: Art, seed = 11) {
  const R = rng(seed);
  if (art === 'comic') {
    const L = 6;
    // comet fins (Kit Astral) behind the hull
    for (const f of FINS) g.poly(f).fill(PRINT.cyan).stroke({ width: L, color: COMIC_INK, join: 'round' });
    for (const f of FINS) g.poly([f[0], f[1], (f[2] + f[0]) / 2, (f[3] + f[1]) / 2, f[4], f[5]]).fill({ color: 0xffffff, alpha: 0.6 });
    // mast, sails
    g.rect(-14, -526, 22, 410).fill(0x8a5a32).stroke({ width: L, color: COMIC_INK });
    g.poly(JIB_A).fill(0xf6efe0).stroke({ width: L, color: COMIC_INK, join: 'round' });
    g.poly(SAIL_A).fill(0xfff8ec).stroke({ width: L, color: COMIC_INK, join: 'round' });
    benDay(g, 6, -300, 160, 80, 14, 0.5, 4, PRINT.cyan, 0.9);
    g.poly(SAIL_A).stroke({ width: L, color: COMIC_INK, join: 'round' });
    // a paw emblem on the sail
    pawMark(g, 90, -350, 46, PRINT.magenta, COMIC_INK);
    g.poly([8, -530, 70, -514, 8, -498]).fill(PRINT.magenta).stroke({ width: 4, color: COMIC_INK, join: 'round' });
    // hull
    g.poly(HULL_A).fill(0xc07a40).stroke({ width: L, color: COMIC_INK, join: 'round' });
    benDay(g, -200, -40, 400, 36, 12, 1, 5, 0x5a2f14, 0.55);
    g.poly(HULL_A).stroke({ width: L, color: COMIC_INK, join: 'round' });
    for (const y of [-92, -62]) g.moveTo(-250, y).lineTo(268, y).stroke({ width: 3, color: COMIC_INK, alpha: 0.7 });
    g.rect(-272, -138, 524, 16).fill(PRINT.cyan).stroke({ width: 5, color: COMIC_INK });
    for (let i = 0; i < 3; i++) g.circle(-120 + i * 120, -78, 15).fill(0xbff3ff).stroke({ width: 5, color: COMIC_INK });
    for (let i = 0; i < 3; i++) g.circle(-126 + i * 120, -84, 5).fill(0xffffff);
    // rail posts
    for (let x = -250; x <= 230; x += 48) g.rect(x, -170, 6, 34).fill(COMIC_INK);
    g.rect(-262, -176, 500, 8).fill(0x8a5a32).stroke({ width: 3, color: COMIC_INK });
    // thruster
    g.poly([-262, -86, -300, -100, -300, -50, -262, -64]).fill(0x8790a6).stroke({ width: 5, color: COMIC_INK, join: 'round' });
    return g;
  }
  // STREET: the same ship, sprayed: patchy fills, fat wobbly outlines with overspray, drips, tags
  for (const f of FINS) sprayPoly(g, f, FLUO.cyan, seed + 1, 10, 0.95);
  sprayPoly(g, [-14, -526, 8, -526, 8, -116, -14, -116], 0x6b4a2e, seed + 2, 6);
  sprayPoly(g, JIB_A, 0xe9e3d4, seed + 3, 10);
  sprayPoly(g, SAIL_A, 0xf2eee4, seed + 4, 10);
  sprayLine(g, [...SAIL_A, SAIL_A[0], SAIL_A[1]], 8, INK, seed + 5, { speck: 0.6 });
  // the sail got tagged
  sprayLine(g, [30, -280, 60, -330, 90, -290, 120, -345, 150, -300], 9, FLUO.pink, seed + 6);
  pawMark(g, 96, -400, 40, FLUO.green, INK);
  sprayPoly(g, HULL_A, 0xb4642a, seed + 7, 14);
  // coverage holes (spray patchiness) + darker belly
  for (let i = 0; i < 40; i++) g.circle(-240 + R() * 500, -110 + R() * 100, 2 + R() * 6).fill({ color: 0x6a3414, alpha: 0.35 });
  sprayLine(g, [-230, -26, -100, -8, 100, -8, 200, -36], 16, 0x6a3414, seed + 8, { alpha: 0.7 });
  sprayLine(g, [...HULL_A, HULL_A[0], HULL_A[1]], 9, INK, seed + 9, { speck: 0.7 });
  sprayLine(g, [-268, -132, 250, -132], 12, FLUO.cyan, seed + 10);
  for (let i = 0; i < 3; i++) {
    g.circle(-120 + i * 120, -78, 17).fill(INK);
    g.circle(-120 + i * 120, -78, 11).fill(FLUO.cyan);
  }
  sprayLine(g, [-262, -172, 238, -172], 7, 0x6b4a2e, seed + 11);
  drips(g, -60, -2, 280, 7, 0.8, 0xb4642a, seed + 12, INK);
  sprayPoly(g, [-262, -86, -300, -100, -300, -50, -262, -64], 0x7d8496, seed + 13, 6);
  return g;
}

/** the paint cans of la Lata: [x, width, color, label] (hull, side view) */
const CANS: [number, number, number, number][] = [
  [-232, 128, 0xd8dbe2, FLUO.pink],
  [-98, 132, 0xc9ccd4, FLUO.green],
  [40, 128, 0xd8dbe2, FLUO.cyan],
  [172, 124, 0xc9ccd4, FLUO.yellow],
];
const CLOTH = [-196, -446, 150, -446, 150, -224, 110, -206, 60, -230, 10, -198, -40, -226, -100, -204, -150, -232, -196, -214];

/** La Lata de Pintura (bow to the LEFT) */
export function drawLata(g: Graphics, art: Art, seed = 23) {
  const R = rng(seed);
  const comic = art === 'comic';
  const ink = comic ? COMIC_INK : INK;
  const L = comic ? 6 : 8;
  const poly = (pts: number[], fill: number, s: number) => (comic ? g.poly(pts).fill(fill).stroke({ width: L, color: ink, join: 'round' }) : sprayPoly(g, pts, fill, s, 10));
  const outline = (pts: number[], s: number) => (comic ? g.poly(pts).stroke({ width: L, color: ink, join: 'round' }) : sprayLine(g, [...pts, pts[0], pts[1]], 7, ink, s, { speck: 0.5 }));
  // the giant spray can (mast)
  poly([4, -470, 76, -470, 76, -138, 4, -138], comic ? 0xe8e9ee : 0xd5d7de, seed + 1);
  g.rect(4, -400, 72, 70).fill(comic ? PRINT.magenta : FLUO.pink);
  if (comic) benDay(g, 8, -330, 64, 180, 12, 0.5, 3.5, 0x8a8f9e, 0.6);
  outline([4, -470, 76, -470, 76, -138, 4, -138], seed + 2);
  poly([14, -500, 66, -500, 76, -470, 4, -470], comic ? 0xb5b8c2 : 0xa9adb8, seed + 3);
  poly([30, -528, 50, -528, 50, -500, 30, -500], comic ? COMIC_INK : INK, seed + 4);
  poly([22, -522, 30, -522, 30, -508, 22, -508], 0xffffff, seed + 5);
  // flag: the open-door box on black
  poly([50, -540, 196, -560, 186, -486, 50, -500], ink, seed + 6);
  openBox(g, 118, -522, 34, comic ? 0xffffff : FLUO.green, { line: 5 });
  // the drop-cloth sail on a yard
  g.rect(-206, -456, 368, 12).fill(0x6b4a2e).stroke({ width: comic ? 4 : 0, color: ink });
  poly(CLOTH, comic ? 0xf2ead8 : 0xe6dfcf, seed + 7);
  // splatters on the cloth
  const cols = [FLUO.pink, FLUO.green, FLUO.cyan, FLUO.orange];
  for (let i = 0; i < 7; i++) {
    const x = -170 + R() * 290;
    const y = -420 + R() * 170;
    const r = 10 + R() * 22;
    const c = comic ? [PRINT.magenta, PRINT.cyan, PRINT.yellow][i % 3] : cols[i % 4];
    if (comic) g.circle(x, y, r).fill(c).stroke({ width: 4, color: ink });
    else {
      sprayPoly(g, circlePts(x, y, r, 9, seed + 20 + i), c, seed + 30 + i, 6);
      drips(g, x, y + r * 0.6, r, 2, 0.7, c, seed + 40 + i);
    }
  }
  if (!comic) sprayLine(g, [-160, -300, -110, -360, -60, -290, -10, -370, 40, -300], 10, FLUO.pink, seed + 8);
  // deck planks
  poly([-300, -150, 250, -150, 250, -122, -300, -122], 0x7a5534, seed + 9);
  // spray-can cannons on deck (nozzles left)
  for (const cx of [-218, -86, 168]) {
    poly([cx - 34, -186, cx + 34, -186, cx + 34, -150, cx - 34, -150], comic ? 0xe8e9ee : 0xd5d7de, seed + cx);
    poly([cx - 52, -178, cx - 34, -178, cx - 34, -158, cx - 52, -158], ink, seed + cx + 1);
    g.rect(cx - 10, -186, 18, 36).fill(comic ? PRINT.cyan : FLUO.cyan);
  }
  // the cans (hull)
  for (const [x, w, body, label] of CANS) {
    const pts = [x - w / 2, -122, x + w / 2, -122, x + w / 2, 0, x - w / 2, 0];
    poly(pts, body, seed + x);
    g.rect(x - w / 2 + 4, -86, w - 8, 52).fill(comic ? [PRINT.magenta, PRINT.cyan, PRINT.yellow, PRINT.red][CANS.findIndex((c) => c[0] === x)] : label);
    if (comic) {
      benDay(g, x - w / 2 + 6, -30, w - 12, 26, 10, 0.5, 3.5, 0x6d7180, 0.7);
      g.rect(x - w / 2 + 4, -86, w - 8, 52).stroke({ width: 4, color: ink });
    } else {
      drips(g, x, -122, w * 0.7, 3, 0.9, label, seed + x + 3);
      for (let i = 0; i < 14; i++) g.circle(x - w / 2 + R() * w, -120 + R() * 118, 1.5 + R() * 3).fill({ color: 0x55596a, alpha: 0.4 });
    }
    outline(pts, seed + x + 9);
    // rims
    g.moveTo(x - w / 2, -116).lineTo(x + w / 2, -116).stroke({ width: comic ? 4 : 5, color: ink, alpha: 0.8 });
    g.moveTo(x - w / 2, -8).lineTo(x + w / 2, -8).stroke({ width: comic ? 4 : 5, color: ink, alpha: 0.8 });
  }
  // the bow can's lid (an ellipse: the can seen end-on, facing forward)
  const bx = CANS[0][0] - CANS[0][1] / 2;
  if (comic) g.ellipse(bx, -61, 24, 61).fill(0xb5b8c2).stroke({ width: L, color: ink });
  else sprayPoly(g, circlePts(bx, -61, 24, 14, seed + 50, 61 / 24), 0xa9adb8, seed + 51, 8);
  g.ellipse(bx, -61, 12, 40).stroke({ width: 4, color: ink });
  // rope lashings
  for (const x of [-166, -32, 106]) g.moveTo(x, -126).lineTo(x + 8, 2).stroke({ width: 6, color: comic ? 0xd9b77a : 0xe0c27e }).moveTo(x, -126).lineTo(x + 8, 2).stroke({ width: 2, color: ink, alpha: 0.7 });
  if (!comic) {
    // tags all over the hull
    sprayLine(g, [-280, -40, -250, -70, -220, -30, -190, -76], 8, FLUO.orange, seed + 60);
    sprayLine(g, [120, -40, 150, -90, 175, -40, 205, -95, 230, -44], 8, FLUO.violet, seed + 61);
  }
  return g;
}

function circlePts(x: number, y: number, r: number, n: number, seed: number, sy = 1) {
  const R = rng(seed);
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.88 + R() * 0.24);
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * sy);
  }
  return pts;
}

/** a cat paw print */
export function pawMark(g: Graphics, x: number, y: number, s: number, color: number, ink: number) {
  g.ellipse(x, y + s * 0.2, s * 0.42, s * 0.34).fill(color).stroke({ width: 4, color: ink });
  for (const [dx, dy] of [
    [-0.42, -0.25],
    [-0.15, -0.48],
    [0.15, -0.48],
    [0.42, -0.25],
  ])
    g.circle(x + dx * s, y + dy * s, s * 0.15).fill(color).stroke({ width: 3, color: ink });
}

// ------------------------------------------------------------------ the void
export interface BgGeom {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** the clean box: print-blue space (screen space) */
/** `top`: draw what sits above the big dot screen there (the caller puts `benDayLayer` between `g` and `top`) */
export function drawVoidComic(g: Graphics, v: BgGeom, seed = 5, top?: Graphics) {
  const R = rng(seed);
  const { x, y, w, h } = v;
  g.rect(x - 40, y - 40, w + 80, h + 80).fill(PRINT.blue);
  g.rect(x - 40, y + h * 0.55, w + 80, h * 0.5).fill(0x24387f);
  if (top) g = top;
  else benDay(g, x - 20, y + h * 0.5, w + 40, h * 0.55, 22, 0.5, 7, 0x2e4aa0, 1);
  // the ringed planet
  const px = x + w * 0.8;
  const py = y + h * 0.2;
  g.ellipse(px, py, 230, 52).stroke({ width: 18, color: COMIC_INK });
  g.circle(px, py, 120).fill(PRINT.yellow).stroke({ width: 7, color: COMIC_INK });
  benDay(g, px - 30, py - 20, 150, 140, 12, 1, 5, 0xd9902a, 1);
  g.circle(px, py, 120).stroke({ width: 7, color: COMIC_INK });
  g.ellipse(px, py, 230, 52).stroke({ width: 10, color: PRINT.magenta });
  // comic stars
  for (let i = 0; i < 46; i++) {
    const sx = x + R() * w;
    const sy = y + R() * h * 0.75;
    const r = 4 + R() * 12;
    comicStar(g, sx, sy, r);
  }
  // Kirby crackle (cosmic energy dots)
  for (let c = 0; c < 4; c++) {
    const cx = x + w * (0.15 + R() * 0.7);
    const cy = y + h * (0.12 + R() * 0.5);
    for (let i = 0; i < 9; i++) {
      const a = R() * Math.PI * 2;
      const d = R() * 90;
      const r = 6 + R() * 16;
      g.circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r + 4).fill(0x9fe8ff);
      g.circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r).fill(COMIC_INK);
    }
  }
  return g;
}
export function comicStar(g: Graphics, x: number, y: number, r: number) {
  const pts = [x, y - r, x + r * 0.22, y - r * 0.22, x + r, y, x + r * 0.22, y + r * 0.22, x, y + r, x - r * 0.22, y + r * 0.22, x - r, y, x - r * 0.22, y - r * 0.22];
  g.poly(pts).fill(0xffffff).stroke({ width: Math.max(2, r * 0.25), color: COMIC_INK, join: 'miter' });
}
/** the same space as a WALL: concrete, spray stars, a stencil planet, old posters and tags (screen space) */
export function drawVoidStreet(g: Graphics, v: BgGeom, seed = 7) {
  const R = rng(seed);
  const { x, y, w, h } = v;
  g.rect(x - 40, y - 40, w + 80, h + 80).fill(0x17151d);
  g.rect(x - 40, y + h * 0.62, w + 80, h * 0.5).fill({ color: 0x221f2a, alpha: 0.7 });
  // concrete: big faint slabs + speckle
  for (let i = 0; i < 9; i++) g.rect(x - 40 + (i * (w + 80)) / 9, y - 40, 3, h + 80).fill({ color: 0x0f0e13, alpha: 0.6 });
  for (let i = 0; i < 700; i++) g.circle(x + R() * w, y + R() * h, 0.8 + R() * 2.2).fill({ color: R() < 0.5 ? 0x34313b : 0x111015, alpha: 0.7 });
  // old wheatpaste posters, faded and torn: a color field, a stencil shape, drips
  const faded = [FLUO.pink, FLUO.cyan, FLUO.green, FLUO.orange, FLUO.violet];
  for (let i = 0; i < 6; i++) {
    const pw = 150 + R() * 170;
    const ph = 190 + R() * 170;
    const px = x + w * (0.05 + (i / 6) * 0.9 + (R() - 0.5) * 0.08);
    const py = y + h * (0.18 + R() * 0.55);
    const pts = tornRect(pw, ph, seed + i * 5, 14).map((vv, j) => vv + (j % 2 ? py : px));
    const col = faded[i % faded.length];
    g.poly(pts).fill({ color: 0xd9d2c0, alpha: 0.13 });
    g.poly(pts).fill({ color: col, alpha: 0.1 });
    // what was printed on it: a stencil face / box / star
    const k = i % 3;
    if (k === 0) g.circle(px, py - ph * 0.08, pw * 0.28).fill({ color: 0x0c0b10, alpha: 0.4 });
    else if (k === 1) g.rect(px - pw * 0.25, py - ph * 0.25, pw * 0.5, pw * 0.5).stroke({ width: 10, color: 0x0c0b10, alpha: 0.4 });
    else g.poly([px, py - ph * 0.3, px + pw * 0.12, py - ph * 0.05, px + pw * 0.32, py, px + pw * 0.12, py + ph * 0.06, px, py + ph * 0.3, px - pw * 0.12, py + ph * 0.06, px - pw * 0.32, py, px - pw * 0.12, py - ph * 0.05]).fill({ color: 0x0c0b10, alpha: 0.4 });
    g.rect(px - pw * 0.35, py + ph * 0.28, pw * 0.7, ph * 0.08).fill({ color: col, alpha: 0.28 });
    drips(g, px, py + ph * 0.4, pw * 0.6, 3, 0.7, col, seed + 200 + i);
  }
  // the stencil planet (sprayed outline + drips)
  const px = x + w * 0.8;
  const py = y + h * 0.2;
  sprayPoly(g, circlePts(px, py, 120, 28, seed + 90), FLUO.yellow, seed + 91, 14, 0.85);
  sprayLine(g, [px - 240, py + 30, px - 120, py + 52, px, py + 58, px + 120, py + 48, px + 240, py + 20], 14, FLUO.pink, seed + 92);
  drips(g, px, py + 110, 160, 6, 0.9, FLUO.yellow, seed + 93);
  // spray stars
  const sc = [FLUO.cyan, FLUO.pink, FLUO.green, 0xffffff];
  for (let i = 0; i < 70; i++) sprayStar(g, x + R() * w, y + R() * h * 0.78, 1.5 + R() * 3.5, sc[i % 4], 0.6 + R() * 0.4);
  // old tags (faded)
  for (let i = 0; i < 6; i++) {
    const tx = x + R() * w;
    const ty = y + h * (0.55 + R() * 0.4);
    const pts: number[] = [];
    for (let k = 0; k < 7; k++) pts.push(tx + k * 34 + (R() - 0.5) * 20, ty + (R() - 0.5) * 70);
    sprayLine(g, pts, 7, sc[(i + 1) % 4], seed + 100 + i, { alpha: 0.32, speck: 0.4 });
  }
  return g;
}

// ------------------------------------------------------------------ debris
export function drawRock(g: Graphics, r: number, art: Art, seed: number) {
  const pts = circlePts(0, 0, r, 9, seed, 0.8);
  if (art === 'comic') {
    g.poly(pts).fill(0x8b8fa3).stroke({ width: 6, color: COMIC_INK, join: 'round' });
    benDay(g, -r * 0.3, r * 0.05, r * 1.1, r * 0.6, 10, 0.5, 4, 0x4a4e60, 0.8);
    g.poly(pts).stroke({ width: 6, color: COMIC_INK, join: 'round' });
    g.circle(-r * 0.3, -r * 0.25, r * 0.18).stroke({ width: 4, color: COMIC_INK });
  } else {
    sprayPoly(g, pts, 0x6d6a80, seed + 1, 10);
    sprayLine(g, [...pts, pts[0], pts[1]], 6, INK, seed + 2, { speck: 0.5 });
    sprayLine(g, [-r * 0.5, -r * 0.1, r * 0.4, r * 0.2], 6, FLUO.green, seed + 3, { alpha: 0.8 });
  }
  return g;
}

// ------------------------------------------------------------------ the hand that draws the boxes
/**
 * A hand of light holding a pencil like someone writing, the pencil pointing DOWN-LEFT (local origin = the pencil tip).
 * `s` scales it (1 ≈ 800 px tall with the sleeve). Fingers are capsules (round-capped strokes): a readable silhouette.
 * `mode`: 'light' (glowing, the real thing) · 'stencil' (one flat color + ink cuts, for the stops) · 'ghost' (outline).
 */
export function drawHand(g: Graphics, s: number, mode: 'light' | 'stencil' | 'ghost', color = 0xffffff, ink = INK) {
  const P = (x: number, y: number): [number, number] => [x * s, y * s];
  type Cap = { pts: [number, number][]; w: number };
  const sleeve: Cap = { pts: [P(560, -760), P(360, -470)], w: 190 * s };
  const fingers: Cap[] = [
    { pts: [P(392, -300), P(330, -236)], w: 40 * s },
    { pts: [P(372, -322), P(282, -230)], w: 46 * s },
    { pts: [P(346, -350), P(228, -232), P(246, -200)], w: 50 * s },
    { pts: [P(318, -372), P(170, -238)], w: 52 * s },
  ];
  const thumb: Cap = { pts: [P(250, -440), P(178, -350), P(132, -300)], w: 54 * s };
  const palm: [number, number, number, number] = [310 * s, -392 * s, 120 * s, 96 * s];
  // pencil: tip at 0,0 along (0.6, −0.8)
  const ux = 0.6;
  const uy = -0.8;
  const nx = 0.8;
  const ny = 0.6;
  const at = (t: number, o: number): [number, number] => [(ux * t + nx * o) * s, (uy * t + ny * o) * s];
  const pw = 17;
  const body = [...at(60, -pw), ...at(520, -pw), ...at(520, pw), ...at(60, pw)];
  const cone = [0, 0, ...at(60, -pw), ...at(60, pw)];
  const lead = [0, 0, ...at(22, -6), ...at(22, 6)];
  const band = [...at(520, -pw), ...at(548, -pw), ...at(548, pw), ...at(520, pw)];
  const eraser = [...at(548, -pw), ...at(600, -pw * 0.9), ...at(604, 0), ...at(600, pw * 0.9), ...at(548, pw)];
  const cap = (c: Cap, w: number, col: number, alpha = 1) => {
    g.moveTo(c.pts[0][0], c.pts[0][1]);
    for (const p of c.pts.slice(1)) g.lineTo(p[0], p[1]);
    g.stroke({ width: w, color: col, alpha, cap: 'round', join: 'round' });
  };
  const all = [sleeve, thumb, ...fingers];
  if (mode === 'light') {
    // glow halos
    for (const [k, al] of [
      [70, 0.07],
      [36, 0.14],
      [16, 0.3],
    ] as const) {
      for (const c of all) cap(c, c.w + k * s, color, al);
      g.ellipse(palm[0], palm[1], palm[2] + k * s * 0.5, palm[3] + k * s * 0.5).fill({ color, alpha: al });
    }
    g.poly(body).fill(0xffd23f).stroke({ width: 4 * s, color: 0x7a5a1a, join: 'round' });
    g.poly(cone).fill(0xf6dcb0).stroke({ width: 4 * s, color: 0x7a5a1a, join: 'round' });
    g.poly(lead).fill(0x3a3640);
    g.poly(band).fill(0xc9ccd4).stroke({ width: 3 * s, color: 0x7a5a1a });
    g.poly(eraser).fill(0xff8fb8).stroke({ width: 4 * s, color: 0x7a5a1a, join: 'round' });
    cap(sleeve, sleeve.w, 0xffffff);
    g.ellipse(palm[0], palm[1], palm[2], palm[3]).fill(0xffffff);
    for (const c of [thumb, ...fingers]) cap(c, c.w + 6 * s, color, 0.9);
    for (const c of [thumb, ...fingers]) cap(c, c.w, 0xffffff);
    // knuckle creases in the light color
    for (const c of fingers) g.circle(c.pts[0][0], c.pts[0][1], 4 * s).fill({ color, alpha: 0.8 });
    // the cuff of the sleeve
    g.moveTo(...P(470, -560)).lineTo(...P(310, -500)).stroke({ width: 10 * s, color, cap: 'round' });
    return g;
  }
  if (mode === 'stencil') {
    cap(sleeve, sleeve.w, color);
    g.poly(body).fill(color);
    g.poly(cone).fill(color);
    g.poly(eraser).fill(color);
    g.poly(band).fill(ink);
    g.poly(lead).fill(ink);
    g.ellipse(palm[0], palm[1], palm[2], palm[3]).fill(color);
    // each finger: an ink cut around it, then the color — the stencil bridges between fingers
    for (const c of [thumb, ...fingers]) {
      cap(c, c.w + 9 * s, ink);
      cap(c, c.w, color);
    }
    g.moveTo(...P(470, -560)).lineTo(...P(310, -500)).stroke({ width: 9 * s, color: ink, cap: 'round' });
    return g;
  }
  for (const c of all) cap(c, 4 * s, color);
  g.poly(body).stroke({ width: 4 * s, color });
  return g;
}
