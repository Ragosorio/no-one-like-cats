/**
 * CIRCUS MALUS — the drawing kit of «FUNCIÓN DE FERIA 1930» (vector only, Pixi Graphics).
 *
 * A rubber-hose cartoon on a fairground stage, in PERFECT SYMMETRY: every set piece is drawn once for the left half and
 * mirrored around the axis x = 960. Thick black ink, flat fills, round shapes, white four-finger gloves, a velvet
 * proscenium with chasing marquee bulbs, a big-top backdrop, a clock stopped at 10:10, twin calliopes, a checkerboard
 * floor in one-point perspective. The colors are true colors chosen to read in BOTH films (the post filter turns them into
 * black-and-white nitrate or two-strip Technicolor): every pair of neighbours differs in luminance.
 */
import { Graphics, type TextStyleOptions } from 'pixi.js';

export const AXIS = 960;
export const INK = 0x161214;
export const CREAM = 0xf3e7cf;
export const PAPER = 0xfff8ea;
export const RED = 0xc8322a;
export const RED_D = 0x7e1a18;
export const GOLD = 0xe0ad4a;
export const GOLD_D = 0x8f5f1e;
export const TEAL = 0x3a9a8f;
export const TEAL_D = 0x1d5650;
export const WOOD = 0x7a4a2a;
export const WOOD_D = 0x3e2516;
export const GRAY = 0x9a9086;
export const WHITE = 0xffffff;
export const LW = 6;

/** the stage opening (world px) */
export const OPEN = { x0: 330, x1: 1590, top: 215, floor: 860 };
/** the floor: back line y and its half width, front edge y and half width */
export const FLOOR = { backY: 600, backHalf: 330, frontY: 860, frontHalf: 640 };

/** mirror a list of x,y points around the axis (and reverse, so a closed polygon stays wound the same way) */
export function mirrorPts(pts: number[]): number[] {
  const out: number[] = [];
  for (let i = pts.length - 2; i >= 0; i -= 2) out.push(2 * AXIS - pts[i], pts[i + 1]);
  return out;
}
/** draw `f(g, side)` for the left (side = -1, as authored) and the mirrored right (side = 1) */
export function both(f: (sx: (x: number) => number, side: -1 | 1) => void) {
  f((x) => x, -1);
  f((x) => 2 * AXIS - x, 1);
}

// ------------------------------------------------------------------ poster lettering
/** circus poster caps: condensed, cream, a fat black outline (the block shadow is stacked by `cartel`) */
export const POSTER = (size: number, fill: number = CREAM, ink: number = INK): TextStyleOptions => ({
  fontFamily: 'Anton',
  fontSize: size,
  fill,
  stroke: { color: ink, width: Math.max(4, Math.round(size * 0.1)), join: 'round' },
  letterSpacing: Math.round(size * 0.04),
});
/** the title cards' serif (1930s main titles) */
export const TITLE = (size: number, fill: number = CREAM, ink: number = INK): TextStyleOptions => ({
  fontFamily: 'Playfair Display',
  fontWeight: '700',
  fontSize: size,
  fill,
  stroke: { color: ink, width: Math.max(3, Math.round(size * 0.08)), join: 'round' },
  letterSpacing: Math.round(size * 0.1),
});
export const SMALL = (size: number, fill: number = CREAM, ink: number = INK): TextStyleOptions => ({
  fontFamily: 'Bebas Neue',
  fontSize: size,
  fill,
  stroke: { color: ink, width: Math.max(3, Math.round(size * 0.12)), join: 'round' },
  letterSpacing: Math.round(size * 0.3),
});

// ------------------------------------------------------------------ shapes
/** a sunburst: n wedges alternating two colors around (cx, cy) */
export function sunburst(g: Graphics, cx: number, cy: number, r: number, n: number, rot: number, c1: number, c2: number) {
  g.circle(cx, cy, r).fill(c2);
  for (let i = 0; i < n; i += 2) {
    const a0 = rot + (i / n) * Math.PI * 2;
    const a1 = rot + ((i + 1) / n) * Math.PI * 2;
    g.poly([cx, cy, cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r]).fill(c1);
  }
}
/** a gear: teeth around a ring, a hub, spokes (rotation in radians) */
export function gear(g: Graphics, cx: number, cy: number, r: number, teeth: number, rot: number, fill: number, ink = INK, lw = LW) {
  const pts: number[] = [];
  const tooth = Math.PI / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = rot + i * 2 * tooth;
    for (const [da, rr] of [
      [-tooth * 0.5, r * 0.86],
      [-tooth * 0.32, r],
      [tooth * 0.32, r],
      [tooth * 0.5, r * 0.86],
    ] as const)
      pts.push(cx + Math.cos(a + da) * rr, cy + Math.sin(a + da) * rr);
  }
  g.poly(pts).fill(fill).stroke({ width: lw, color: ink, join: 'round' });
  g.circle(cx, cy, r * 0.62).fill(fill === GOLD ? GOLD_D : WOOD_D).stroke({ width: lw * 0.7, color: ink });
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2;
    g.moveTo(cx + Math.cos(a) * r * 0.16, cy + Math.sin(a) * r * 0.16).lineTo(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6).stroke({ width: r * 0.14, color: fill, cap: 'round' });
  }
  g.circle(cx, cy, r * 0.18).fill(CREAM).stroke({ width: lw * 0.7, color: ink });
}
/**
 * A white cartoon glove (four fingers, three stitches on the back), palm-down, centred on its knuckles. `grip` 0..1
 * curls the fingers around a handle. Drawn around (x, y), scale s, rotation-free (rotate the container).
 */
export function glove(g: Graphics, x: number, y: number, s: number, grip = 1, flip = 1) {
  const f = (dx: number) => x + dx * s * flip;
  const yy = (dy: number) => y + dy * s;
  // cuff
  g.roundRect(Math.min(f(-58), f(58)), yy(-150), 116 * s, 46 * s, 18 * s).fill(WHITE).stroke({ width: LW, color: INK });
  g.moveTo(f(-50), yy(-120)).lineTo(f(50), yy(-120)).stroke({ width: 3, color: INK });
  // the hand
  g.roundRect(Math.min(f(-62), f(62)), yy(-108), 124 * s, 110 * s, 42 * s).fill(WHITE).stroke({ width: LW, color: INK });
  // fingers: four round sausages (curled = short)
  for (let i = 0; i < 4; i++) {
    const fx = -45 + i * 30;
    const len = 46 + (1 - grip) * 30 - (i === 0 || i === 3 ? 8 : 0);
    g.roundRect(Math.min(f(fx - 15), f(fx + 15)), yy(-6), 30 * s, len * s, 15 * s).fill(WHITE).stroke({ width: LW, color: INK });
  }
  // thumb
  g.ellipse(f(-70), yy(-40), 22 * s, 34 * s).fill(WHITE).stroke({ width: LW, color: INK });
  // stitches
  for (let i = -1; i <= 1; i++) g.moveTo(f(i * 22), yy(-90)).lineTo(f(i * 22), yy(-40)).stroke({ width: 4, color: INK, cap: 'round' });
}
/** a rubber stamp: a wooden knob + neck + block, rubber face down at (x, y) */
export function stamp(g: Graphics, x: number, y: number, s: number) {
  g.roundRect(x - 120 * s, y - 70 * s, 240 * s, 70 * s, 10 * s).fill(WOOD).stroke({ width: LW, color: INK });
  g.rect(x - 128 * s, y - 14 * s, 256 * s, 14 * s).fill(RED_D).stroke({ width: LW * 0.7, color: INK });
  g.roundRect(x - 26 * s, y - 170 * s, 52 * s, 110 * s, 14 * s).fill(WOOD_D).stroke({ width: LW, color: INK });
  g.circle(x, y - 190 * s, 52 * s).fill(WOOD).stroke({ width: LW, color: INK });
  g.circle(x - 16 * s, y - 206 * s, 14 * s).fill({ color: CREAM, alpha: 0.7 });
}
/** a round marquee bulb: dark socket, glass lit 0..1 */
export function bulb(g: Graphics, x: number, y: number, r: number, lit: number) {
  g.circle(x, y, r + 4).fill(INK);
  g.circle(x, y, r).fill(lit > 0.5 ? PAPER : lit > 0.15 ? GOLD : GOLD_D);
  if (lit > 0.5) g.circle(x - r * 0.3, y - r * 0.3, r * 0.3).fill(WHITE);
}

// ------------------------------------------------------------------ the set (static, drawn once)
/** the backdrop inside the opening: big-top stripes converging to the top centre, a valance of pennants */
export function drawBackdrop(g: Graphics) {
  const { x0, x1, top, floor } = OPEN;
  g.rect(x0, top, x1 - x0, floor - top).fill(CREAM);
  // big-top stripes: wedges from the apex (960, top - 380) down to the floor line
  const ax = AXIS;
  const ay = top - 420;
  const n = 14;
  for (let i = 0; i < n; i++) {
    if (i % 2) continue;
    const xa = x0 - 260 + ((x1 - x0 + 520) * i) / n;
    const xb = x0 - 260 + ((x1 - x0 + 520) * (i + 1)) / n;
    g.poly([ax, ay, xa, floor, xb, floor]).fill(RED);
  }
  // the tent's hem: scallops just above the floor
  for (let x = x0; x < x1; x += 70) g.circle(x + 35, FLOOR.backY - 6, 35).fill(TEAL_D);
  g.rect(x0, FLOOR.backY - 6, x1 - x0, 20).fill(TEAL_D);
  g.rect(x0, top, x1 - x0, floor - top).stroke({ width: LW, color: INK });
}
/** the checkerboard floor in one-point perspective (vanishing point on the axis) */
export function drawFloor(g: Graphics) {
  const { backY, backHalf, frontY, frontHalf } = FLOOR;
  g.poly([AXIS - backHalf, backY, AXIS + backHalf, backY, AXIS + frontHalf, frontY, AXIS - frontHalf, frontY]).fill(CREAM);
  const cols = 12;
  const rows = 7;
  // rows get deeper toward the front (perspective: y spacing grows)
  const yAt = (r: number) => backY + (frontY - backY) * Math.pow(r / rows, 1.35);
  const half = (y: number) => backHalf + ((frontHalf - backHalf) * (y - backY)) / (frontY - backY);
  for (let r = 0; r < rows; r++) {
    const ya = yAt(r);
    const yb = yAt(r + 1);
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2) continue;
      const xa = (y: number) => AXIS - half(y) + (2 * half(y) * c) / cols;
      const xb = (y: number) => AXIS - half(y) + (2 * half(y) * (c + 1)) / cols;
      g.poly([xa(ya), ya, xb(ya), ya, xb(yb), yb, xa(yb), yb]).fill(RED_D);
    }
  }
  g.poly([AXIS - backHalf, backY, AXIS + backHalf, backY, AXIS + frontHalf, frontY, AXIS - frontHalf, frontY]).stroke({ width: LW, color: INK });
  // the apron (front of the stage) with its trim
  g.poly([AXIS - frontHalf, frontY, AXIS + frontHalf, frontY, AXIS + frontHalf + 40, frontY + 70, AXIS - frontHalf - 40, frontY + 70]).fill(WOOD).stroke({ width: LW, color: INK });
  g.rect(AXIS - frontHalf - 40, frontY + 70, 2 * frontHalf + 80, 220).fill(WOOD_D).stroke({ width: LW, color: INK });
  for (let i = -6; i <= 6; i++) g.circle(AXIS + i * 100, frontY + 150, 16).fill(GOLD).stroke({ width: 4, color: INK });
}
/** the round podium in the middle of the stage (a striped circus drum), top at (AXIS, y) */
export function drawPodium(g: Graphics, y: number) {
  const w = 190;
  const h = 120;
  g.ellipse(AXIS, y + h, w, 34).fill(WOOD_D).stroke({ width: LW, color: INK });
  g.rect(AXIS - w, y, 2 * w, h).fill(CREAM);
  for (let i = 0; i < 8; i++) {
    if (i % 2) continue;
    const xa = AXIS - w + (2 * w * i) / 8;
    g.rect(xa, y, (2 * w) / 8, h).fill(RED);
  }
  g.rect(AXIS - w, y, 2 * w, h).stroke({ width: LW, color: INK });
  g.ellipse(AXIS, y, w, 34).fill(GOLD).stroke({ width: LW, color: INK });
  g.ellipse(AXIS, y + h, w, 34).stroke({ width: LW, color: INK });
}
/** the proscenium: columns, the arch with its crest, the velvet valance and the tied curtains (returns bulb spots) */
export function drawProscenium(g: Graphics): [number, number][] {
  const { x0, x1, top } = OPEN;
  const bulbs: [number, number][] = [];
  // the wall around the opening (dark wood), with a cutout for the opening
  g.rect(-1400, -1400, 4720, 4000).fill(WOOD_D);
  g.rect(x0, top, x1 - x0, 1100).cut();
  both((sx, side) => {
    // columns
    const cx = side < 0 ? x0 - 95 : x1 + 95;
    g.rect(cx - 75, top - 40, 150, 1000).fill(GOLD).stroke({ width: LW, color: INK });
    for (let i = 0; i < 4; i++) g.rect(cx - 55 + i * 30, top + 10, 14, 880).fill(GOLD_D);
    g.rect(cx - 95, top - 70, 190, 50).fill(GOLD).stroke({ width: LW, color: INK });
    g.rect(cx - 95, top + 900, 190, 60).fill(GOLD).stroke({ width: LW, color: INK });
    void sx;
  });
  // the arch: a band over the opening with a crest in the middle
  g.poly([x0 - 180, top - 40, x1 + 180, top - 40, x1 + 180, top - 150, AXIS + 300, top - 190, AXIS, top - 230, AXIS - 300, top - 190, x0 - 180, top - 150]).fill(RED).stroke({ width: LW, color: INK });
  g.poly([x0 - 150, top - 62, x1 + 150, top - 62, x1 + 150, top - 128, AXIS + 290, top - 165, AXIS, top - 200, AXIS - 290, top - 165, x0 - 150, top - 128]).stroke({ width: 4, color: GOLD });
  // bulbs along the arch band
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const x = x0 - 165 + (x1 - x0 + 330) * u;
    const y = top - 95 - Math.sin(u * Math.PI) * 70;
    bulbs.push([x, y]);
  }
  // bulbs down the columns (symmetric)
  for (let j = 1; j <= 9; j++) {
    const y = top - 20 + j * 90;
    bulbs.push([x0 - 95, y], [x1 + 95, y]);
  }
  // the crest: the Correctores' seal (a perfect circle crossed out with a perfectly straight line)
  g.circle(AXIS, top - 250, 92).fill(CREAM).stroke({ width: LW + 2, color: INK });
  g.circle(AXIS, top - 250, 70).stroke({ width: 5, color: RED });
  g.moveTo(AXIS - 62, top - 250).lineTo(AXIS + 62, top - 250).stroke({ width: 14, color: INK, cap: 'round' });
  return bulbs;
}
/** the velvet valance across the top of the opening + the curtains tied at the sides (static, over the stage) */
export function drawValance(g: Graphics) {
  const { x0, x1, top } = OPEN;
  g.rect(x0 - 10, top - 10, x1 - x0 + 20, 70).fill(RED_D);
  for (let x = x0; x < x1; x += 90) {
    g.moveTo(x, top + 60).quadraticCurveTo(x + 45, top + 120, x + 90, top + 60).lineTo(x + 90, top + 55).lineTo(x, top + 55).fill(RED_D);
    g.moveTo(x, top + 60).quadraticCurveTo(x + 45, top + 120, x + 90, top + 60).stroke({ width: LW, color: INK });
    g.circle(x + 45, top + 108, 9).fill(GOLD).stroke({ width: 3, color: INK });
  }
  g.rect(x0 - 10, top - 10, x1 - x0 + 20, 70).stroke({ width: LW, color: INK });
  both((sx) => {
    // a tied curtain: a fold that narrows at the tie and flares to the floor
    const xa = sx(x0 - 10);
    const xb = sx(x0 + 120);
    const xt = sx(x0 + 40);
    g.poly([xa, top + 50, xb, top + 50, sx(x0 + 70), top + 380, xt, top + 430, sx(x0 + 150), OPEN.floor + 10, xa, OPEN.floor + 10]).fill(RED).stroke({ width: LW, color: INK });
    for (const f of [30, 70]) g.moveTo(sx(x0 + f * 0.5), top + 70).quadraticCurveTo(sx(x0 + 40), top + 380, sx(x0 + f + 20), OPEN.floor).stroke({ width: 4, color: RED_D });
    g.roundRect(Math.min(sx(x0 + 10), sx(x0 + 95)), top + 395, 85, 30, 12).fill(GOLD).stroke({ width: 4, color: INK });
  });
}
/** the closed curtain (two halves meeting on the axis, deep folds), drawn over the opening; `lift` raises it */
export function drawCurtain(g: Graphics, lift: number, sway: number) {
  const { x0, x1, top, floor } = OPEN;
  const h = (floor - top + 40) * (1 - lift);
  if (h <= 2) return;
  const y0 = top - 10;
  g.rect(x0, y0, x1 - x0, h).fill(RED);
  const folds = 16;
  for (let i = 0; i < folds; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / folds + Math.sin(i * 1.7 + sway) * 4;
    g.moveTo(x, y0).lineTo(x + Math.sin(sway + i) * 6, y0 + h).stroke({ width: 10, color: RED_D });
  }
  // the hem: scallops + a gold fringe
  for (let x = x0; x < x1; x += 60) g.moveTo(x, y0 + h).quadraticCurveTo(x + 30, y0 + h + 34, x + 60, y0 + h).fill(RED);
  g.rect(x0, y0 + h - 8, x1 - x0, 14).fill(GOLD);
  g.moveTo(AXIS, y0).lineTo(AXIS, y0 + h).stroke({ width: 5, color: INK });
  g.rect(x0, y0, x1 - x0, h + 6).stroke({ width: LW, color: INK });
  // the seal embroidered on each half (mirrored, of course)
  if (h > 300) {
    both((sx) => {
      const cx = sx(AXIS - 300);
      const cy = y0 + h * 0.45;
      g.circle(cx, cy, 70).fill(RED_D).stroke({ width: 5, color: GOLD });
      g.moveTo(cx - 46, cy).lineTo(cx + 46, cy).stroke({ width: 10, color: GOLD, cap: 'round' });
    });
  }
}
/** the clock: face, ticks, hands at 10:10 — the minute hand mirrors the hour hand (`skew` crooks it: 10:11) */
export function drawClock(g: Graphics, cx: number, cy: number, r: number, tick: number, skew: number) {
  g.circle(cx, cy, r + 26).fill(GOLD).stroke({ width: LW, color: INK });
  g.circle(cx, cy, r).fill(PAPER).stroke({ width: LW, color: INK });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 ? r * 0.82 : r * 0.72;
    g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0).lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92).stroke({ width: i % 3 ? 5 : 10, color: INK, cap: 'round' });
  }
  // 10:10 → the hands make a perfect V (a smile); each tick nudges both the same way and back
  const base = Math.PI * 0.5 + Math.PI / 3 + 0.04;
  const aL = -base - tick * 0.05;
  const aR = base + tick * 0.05 + skew;
  for (const [a, len, w] of [
    [aL, r * 0.62, 16],
    [aR, r * 0.82, 10],
  ] as const) {
    const ax = cx + Math.sin(a) * len;
    const ay = cy - Math.cos(a) * len;
    g.moveTo(cx, cy).lineTo(ax, ay).stroke({ width: w + 6, color: INK, cap: 'round' });
    g.moveTo(cx, cy).lineTo(ax, ay).stroke({ width: w - 2, color: RED, cap: 'round' });
  }
  g.circle(cx, cy, 16).fill(INK);
}
/** a calliope: a bank of pipes on a wagon box; heights 0..1 per pipe, puff 0..1 at the mouths */
export function drawCalliope(g: Graphics, cx: number, by: number, heights: number[], side: -1 | 1, bent = 0) {
  const n = heights.length;
  const pw = 34;
  const w = n * pw + 30;
  g.roundRect(cx - w / 2, by - 120, w, 120, 14).fill(TEAL).stroke({ width: LW, color: INK });
  g.rect(cx - w / 2 + 14, by - 96, w - 28, 22).fill(GOLD).stroke({ width: 4, color: INK });
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + 15 + i * pw + pw / 2;
    // pipes stand in a symmetric organ shape (tall in the middle) + the bass
    const shape = 1 - Math.abs(i - (n - 1) / 2) / n;
    const h = 120 + 160 * shape + 110 * heights[i];
    const lean = bent * (i - (n - 1) / 2) * 0.06 * side;
    const top = by - 120 - h;
    g.poly([x - 12, by - 120, x + 12, by - 120, x + 12 + lean * h, top, x - 12 + lean * h, top]).fill(GOLD).stroke({ width: 4, color: INK });
    g.rect(x - 9 + lean * h * 0.85, top + h * 0.12, 18, 14).fill(INK);
    g.ellipse(x + lean * h, top, 13, 5).fill(GOLD_D).stroke({ width: 3, color: INK });
  }
}
/** a pennant garland (triangles alternating red / cream) on a sagging line between two points */
export function bunting(g: Graphics, xa: number, ya: number, xb: number, yb: number, n: number, sag: number, flip: number) {
  const pt = (u: number) => [xa + (xb - xa) * u, ya + (yb - ya) * u + Math.sin(u * Math.PI) * sag] as const;
  g.moveTo(xa, ya);
  for (let i = 1; i <= 20; i++) {
    const [x, y] = pt(i / 20);
    g.lineTo(x, y);
  }
  g.stroke({ width: 4, color: INK });
  for (let i = 0; i < n; i++) {
    const [x, y] = pt((i + 0.5) / n);
    const s = 26;
    const tip = 46 * (0.85 + 0.15 * flip * (i % 2 ? 1 : -1));
    g.poly([x - s, y, x + s, y, x, y + tip]).fill(i % 2 ? CREAM : RED).stroke({ width: 3, color: INK });
  }
}
/** a ribbon banner (the title card's): a band with folded tails */
export function ribbon(g: Graphics, cx: number, cy: number, w: number, h: number, color = RED) {
  both((sx) => {
    const xo = sx(cx - w / 2);
    const xi = sx(cx - w / 2 - 90);
    g.poly([xo, cy - h / 2 + 22, xi, cy - h / 2 + 22, sx(cx - w / 2 - 50), cy + 22, xi, cy + h / 2 + 22, xo, cy + h / 2 + 22]).fill(RED_D).stroke({ width: LW, color: INK });
  });
  g.roundRect(cx - w / 2, cy - h / 2, w, h, 8).fill(color).stroke({ width: LW, color: INK });
}
/** an art-deco frame: double border, fan corners (title card) */
export function decoFrame(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).stroke({ width: 14, color: INK });
  g.rect(x + 22, y + 22, w - 44, h - 44).stroke({ width: 5, color: GOLD });
  g.rect(x + 34, y + 34, w - 68, h - 68).stroke({ width: 3, color: INK });
  for (const [cx, cy, a0] of [
    [x + 22, y + 22, 0],
    [x + w - 22, y + 22, Math.PI / 2],
    [x + w - 22, y + h - 22, Math.PI],
    [x + 22, y + h - 22, Math.PI * 1.5],
  ] as const) {
    for (let i = 0; i < 5; i++) {
      const a = a0 + (i / 4) * (Math.PI / 2);
      g.moveTo(cx, cy).lineTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 90).stroke({ width: 4, color: GOLD });
    }
    g.arc(cx, cy, 90, a0, a0 + Math.PI / 2).stroke({ width: 5, color: INK });
  }
}
