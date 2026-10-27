/**
 * LA ÚLTIMA RONDA — the drawing kit of the bar's polish pass (docs/part-iii/13 §3.2, §3.4): the things Canelo and Espuma
 * USE while he tells the story, drawn in code in the Borracha's TV style (tv.ts: flat colors, one uniform plum line, at
 * most one hard shadow). Pure drawing on a Graphics, no state: scenes/caja/barDirector.ts and barInsertos.ts call them.
 *
 * Canelo's arms and paws are drawn here (his painting has no arm rig): an orange mitten with three toe bumps and claws
 * that pop out one by one — the same palette as his painting through the TV lens, so they read as HIS paws.
 */
import type { Graphics } from 'pixi.js';
import { LW, TV } from '../../momentos/songs/drunck/tv';

/** Canelo's fur through the TV lens (sampled from the baked painting) and his scarf */
export const FUR = { base: 0xf29a45, light: 0xf8bd6c, stripe: 0xd8662b, cream: 0xfadcae, pad: 0xf0a0a8 } as const;
export const SCARF = { base: 0xc8572a, dark: 0xa8431f, stripe: 0xf3d2a0 } as const;
/** Espuma (calico: white, black and orange patches) and her pencil (the one she keeps in her bun) */
export const CALICO = { white: 0xfdf7ee, black: 0x2b2230, orange: 0xe58a3a } as const;
export const PENCIL = { wood: 0xf6c84a, woodD: 0xd9a22e, tip: 0xf5deb3, lead: 0x3a3442, eraser: 0xff8fb0, band: 0xc9d3e6 } as const;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** rotate a local point (lx, ly) by `a` and place it at (x, y) */
function rot(x: number, y: number, a: number, lx: number, ly: number): [number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x + lx * c - ly * s, y + lx * s + ly * c];
}

/**
 * A furry forearm from `a` (the elbow) to `b` (the wrist), bowed by `bow`: tapered (wider at the elbow), with a fluffy
 * scalloped edge, one flat light tone on its lit side and a cream «sock» toward the paw — his painting's tones, so it
 * reads as HIS arm and not a tube.
 */
export function arm(g: Graphics, ax: number, ay: number, bx: number, by: number, w: number, o: { bow?: number; color?: number; stripe?: number; elbow?: boolean; sock?: number } = {}) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const bow = o.bow ?? 0.18;
  const cx = (ax + bx) / 2 - (dy / len) * len * bow;
  const cy = (ay + by) / 2 + (dx / len) * len * bow;
  const col = o.color ?? FUR.base;
  const N = 12;
  const L: number[] = [];
  const R: number[] = [];
  const HL: number[] = [];
  const HR: number[] = [];
  const at = (k: number): [number, number, number, number] => {
    const x = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * cx + k * k * bx;
    const y = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * cy + k * k * by;
    const tx = 2 * (1 - k) * (cx - ax) + 2 * k * (bx - cx);
    const ty = 2 * (1 - k) * (cy - ay) + 2 * k * (by - cy);
    const tl = Math.hypot(tx, ty) || 1;
    return [x, y, -ty / tl, tx / tl];
  };
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const [x, y, nx, ny] = at(k);
    // tapered: the elbow is the widest; a little fluff on the outer edge
    const hw = (w / 2) * (1.15 - 0.3 * k) * (o.elbow && k < 0.15 ? 1.12 : 1);
    const fl = i % 2 ? w * 0.07 : 0;
    L.push(x + nx * (hw + fl), y + ny * (hw + fl));
    R.push(x - nx * hw, y - ny * hw);
    HL.push(x + nx * hw * 0.75, y + ny * hw * 0.75);
    HR.push(x + nx * hw * 0.15, y + ny * hw * 0.15);
  }
  const poly = [...L];
  for (let i = N; i >= 0; i--) poly.push(R[i * 2], R[i * 2 + 1]);
  g.poly(poly).fill(col).stroke({ width: LW, color: TV.line, join: 'round' });
  // the lit side (one flat light tone)
  const hp: number[] = [];
  for (let i = 1; i < N - 2; i++) hp.push(HL[i * 2], HL[i * 2 + 1]);
  for (let i = N - 3; i >= 1; i--) hp.push(HR[i * 2], HR[i * 2 + 1]);
  g.poly(hp).fill({ color: o.color === undefined ? FUR.light : mixLight(col), alpha: 0.9 });
  // the cream sock toward the paw
  const sock = o.sock ?? (o.color === undefined ? 0.3 : 0);
  if (sock > 0) {
    const s0 = Math.floor(N * (1 - sock));
    const sp: number[] = [];
    for (let i = s0; i <= N; i++) sp.push(L[i * 2], L[i * 2 + 1]);
    for (let i = N; i >= s0; i--) sp.push(R[i * 2], R[i * 2 + 1]);
    g.poly(sp).fill(FUR.cream).stroke({ width: LW * 0.8, color: TV.line, join: 'round' });
  }
  // a few fur strokes (not stripes: short hairs along the lit edge)
  if (o.stripe !== 0) {
    for (const k of [0.25, 0.45]) {
      const [x, y, nx, ny] = at(k);
      g.moveTo(x + nx * w * 0.42, y + ny * w * 0.42).lineTo(x + nx * w * 0.18 + (dx / len) * w * 0.2, y + ny * w * 0.18 + (dy / len) * w * 0.2).stroke({ width: 4, color: o.stripe ?? FUR.stripe, cap: 'round' });
    }
  }
}

/**
 * A cat paw (mitten) at (x, y), radius r, pointing along angle `a` (0 = right): three toe bumps on the leading edge;
 * `claws` 0..4 claws out (fractional = the last one popping), `spread` opens the toes (0..1).
 */
export function paw(g: Graphics, x: number, y: number, r: number, a: number, o: { claws?: number; color?: number; light?: number; spread?: number; line?: number } = {}) {
  const col = o.color ?? FUR.cream;
  const lt = o.light ?? 0xfff3dc;
  const line = o.line ?? TV.line;
  const sp = o.spread ?? 0;
  // claws first (they stick out from under the toes)
  const n = o.claws ?? 0;
  for (let i = 0; i < 4; i++) {
    const k = clamp(n - i, 0, 1);
    if (k <= 0) continue;
    const off = (i - 1.5) * (0.42 + sp * 0.18);
    const [bx, by] = rot(x, y, a, r * 0.95 * Math.cos(off), r * 0.95 * Math.sin(off));
    const [tx, ty] = rot(x, y, a, (r * 0.95 + r * 0.75 * k) * Math.cos(off * 1.1), (r * 0.95 + r * 0.75 * k) * Math.sin(off * 1.1));
    const [s1x, s1y] = rot(bx, by, a + off, 0, -r * 0.12);
    const [s2x, s2y] = rot(bx, by, a + off, 0, r * 0.12);
    g.poly([s1x, s1y, tx, ty, s2x, s2y]).fill(TV.white).stroke({ width: LW * 0.55, color: line, join: 'round' });
  }
  g.ellipse(x, y, r, r * 0.86).fill(col);
  // three toe bumps on the leading edge
  for (let i = 0; i < 3; i++) {
    const off = (i - 1) * (0.62 + sp * 0.3);
    const [tx, ty] = rot(x, y, a, r * 0.78 * Math.cos(off), r * 0.78 * Math.sin(off));
    g.circle(tx, ty, r * 0.36).fill(col).stroke({ width: LW * 0.7, color: line });
  }
  g.ellipse(x, y, r, r * 0.86).stroke({ width: LW, color: line });
  // a light patch on top (one tone of «shadow» only: the TV rule)
  const [hx, hy] = rot(x, y, a, -r * 0.15, -r * 0.25);
  g.ellipse(hx, hy, r * 0.45, r * 0.3).fill({ color: lt, alpha: 0.9 });
}

/** the napkin = «esa hoja»: a flat white quad on the counter (world) with its fold cross */
export function napkin(g: Graphics, pts: number[], o: { alpha?: number; folds?: boolean; tint?: number } = {}) {
  const a = o.alpha ?? 1;
  g.poly(pts).fill({ color: o.tint ?? TV.white, alpha: a }).stroke({ width: LW * 0.8, color: TV.line, alpha: a, join: 'round' });
  if (o.folds !== false) {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = pts;
    g.moveTo((x0 + x1) / 2, (y0 + y1) / 2).lineTo((x3 + x2) / 2, (y3 + y2) / 2).stroke({ width: 2, color: TV.chrome, alpha: a });
    g.moveTo((x0 + x3) / 2, (y0 + y3) / 2).lineTo((x1 + x2) / 2, (y1 + y2) / 2).stroke({ width: 2, color: TV.chrome, alpha: a });
  }
}

/** a sugar cube (three faces). `white` 0..1 = polished into the Correctores' perfect white; `glint` a sparkle */
export function sugarCube(g: Graphics, x: number, y: number, s: number, white = 0, glint = 0) {
  const top = mix(0xf4ead2, 0xffffff, white);
  const left = mix(0xe2d2ae, 0xf3f6ff, white);
  const right = mix(0xcdb98e, 0xe2e8f6, white);
  g.poly([x - s, y - s * 0.5, x, y - s, x + s, y - s * 0.5, x, y]).fill(top).stroke({ width: LW * 0.7, color: TV.line, join: 'round' });
  g.poly([x - s, y - s * 0.5, x, y, x, y + s, x - s, y + s * 0.5]).fill(left).stroke({ width: LW * 0.7, color: TV.line, join: 'round' });
  g.poly([x, y, x + s, y - s * 0.5, x + s, y + s * 0.5, x, y + s]).fill(right).stroke({ width: LW * 0.7, color: TV.line, join: 'round' });
  if (white < 0.6) for (let i = 0; i < 5; i++) g.circle(x - s * 0.5 + ((i * 37) % 10) * s * 0.1, y - s * 0.55 + ((i * 53) % 7) * s * 0.06, 2).fill({ color: 0xb8a37a, alpha: 1 - white });
  if (glint > 0.01) star(g, x + s * 0.6, y - s * 0.9, s * 0.7 * glint, TV.white);
}

/** a four-point sparkle */
export function star(g: Graphics, x: number, y: number, r: number, color: number, alpha = 1) {
  if (r <= 0.5) return;
  g.poly([x, y - r, x + r * 0.22, y - r * 0.22, x + r, y, x + r * 0.22, y + r * 0.22, x, y + r, x - r * 0.22, y + r * 0.22, x - r, y, x - r * 0.22, y - r * 0.22]).fill({ color, alpha }).stroke({ width: 2, color: TV.line, alpha });
}

/** the ketchup bottle (squeeze: 0..1 squashes it) */
export function ketchup(g: Graphics, x: number, y: number, s: number, squeeze = 0) {
  const w = s * (0.55 + squeeze * 0.12);
  const h = s * (1.3 - squeeze * 0.18);
  g.roundRect(x - w / 2, y - h, w, h, w * 0.35).fill(0xd8262c).stroke({ width: LW * 0.8, color: TV.line });
  g.roundRect(x - w * 0.32, y - h * 0.62, w * 0.64, h * 0.3, 6).fill(TV.cream).stroke({ width: 3, color: TV.line });
  g.moveTo(x - w * 0.2, y - h * 0.5).lineTo(x + w * 0.2, y - h * 0.5).stroke({ width: 4, color: 0xd8262c });
  g.roundRect(x - w * 0.22, y - h - s * 0.22, w * 0.44, s * 0.24, 5).fill(TV.green).stroke({ width: LW * 0.7, color: TV.line });
  g.poly([x - w * 0.08, y - h - s * 0.22, x, y - h - s * 0.36, x + w * 0.08, y - h - s * 0.22]).fill(TV.green).stroke({ width: 3, color: TV.line });
  g.rect(x - w * 0.36, y - h + h * 0.1, w * 0.1, h * 0.55).fill({ color: 0xff7a7a, alpha: 0.8 });
}

/** a fry standing up (the Capi, with a tiny paper captain's hat); `look` -1..1 moves its eyes (1 = up at Canelo) */
export function fryCapi(g: Graphics, x: number, y: number, s: number, o: { look?: number; hat?: boolean; tilt?: number; blink?: boolean } = {}) {
  const t = o.tilt ?? 0;
  const w = s * 0.32;
  const h = s * 1.3;
  const P = (lx: number, ly: number) => rot(x, y, t, lx, ly);
  const c = [P(-w / 2, 0), P(-w / 2, -h), P(w / 2, -h), P(w / 2, 0)].flat();
  g.poly(c).fill(TV.amberL).stroke({ width: LW * 0.8, color: TV.line, join: 'round' });
  const sh = [P(w * 0.12, -h * 0.05), P(w * 0.12, -h * 0.95), P(w / 2, -h * 0.95), P(w / 2, -h * 0.05)].flat();
  g.poly(sh).fill({ color: TV.amber, alpha: 0.9 });
  // eyes (two dots) — the Capi looks
  const lk = o.look ?? 0;
  const [ex, ey] = P(0, -h * 0.72 - lk * s * 0.06);
  if (o.blink) {
    g.moveTo(ex - w * 0.32, ey).lineTo(ex - w * 0.08, ey).stroke({ width: 3, color: TV.line });
    g.moveTo(ex + w * 0.08, ey).lineTo(ex + w * 0.32, ey).stroke({ width: 3, color: TV.line });
  } else {
    g.circle(ex - w * 0.2, ey, s * 0.05).fill(TV.line);
    g.circle(ex + w * 0.2, ey, s * 0.05).fill(TV.line);
  }
  if (o.hat !== false) {
    // a folded-paper captain's hat (bicorne)
    const hat = [P(-w * 1.05, -h - s * 0.02), P(0, -h - s * 0.4), P(w * 1.05, -h - s * 0.02), P(0, -h + s * 0.06)].flat();
    g.poly(hat).fill(TV.white).stroke({ width: LW * 0.7, color: TV.line, join: 'round' });
    const [ax, ay] = P(0, -h - s * 0.2);
    g.circle(ax, ay, s * 0.05).fill(TV.pink);
  }
}

/** a toothpick quill (a feather on a stick) held at (x, y) pointing down at `a` (rad from vertical) */
export function quill(g: Graphics, x: number, y: number, s: number, a: number) {
  const [tx, ty] = rot(x, y, a, 0, s * 0.55);
  const [bx, by] = rot(x, y, a, 0, -s * 0.9);
  g.moveTo(tx, ty).lineTo(bx, by).stroke({ width: 5, color: TV.line, cap: 'round' });
  g.moveTo(tx, ty).lineTo(bx, by).stroke({ width: 2.5, color: 0xe9cf9a, cap: 'round' });
  const f = [rot(x, y, a, 0, -s * 0.2), rot(x, y, a, -s * 0.22, -s * 0.7), rot(x, y, a, 0, -s * 1.15), rot(x, y, a, s * 0.16, -s * 0.6)].flat();
  g.poly(f).fill(TV.white).stroke({ width: 3, color: TV.line, join: 'round' });
}

/** Espuma's pencil from (x, y) (the eraser end) to its tip, `len` long, angle `a`; `bend` curls it like rubber */
export function pencil(g: Graphics, x: number, y: number, len: number, a: number, o: { bend?: number; broken?: boolean } = {}) {
  const b = o.bend ?? 0;
  const n = 8;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const ang = a + b * k * k * 1.6;
    // integrate the bent spine
    if (i === 0) pts.push([x, y]);
    else {
      const [px, py] = pts[i - 1];
      pts.push([px + Math.cos(ang) * (len / n), py + Math.sin(ang) * (len / n)]);
    }
  }
  const w = len * 0.11;
  // body: a thick stroke along the spine (outline + wood)
  const path = (gg: Graphics) => {
    gg.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) gg.lineTo(pts[i][0], pts[i][1]);
  };
  path(g);
  g.stroke({ width: w + LW * 1.6, color: TV.line, cap: 'round', join: 'round' });
  path(g);
  g.stroke({ width: w, color: PENCIL.wood, cap: 'round', join: 'round' });
  // eraser + metal band
  g.circle(pts[0][0], pts[0][1], w * 0.55).fill(PENCIL.eraser).stroke({ width: 3, color: TV.line });
  // the sharpened tip
  const [ax, ay] = pts[n - 2];
  const [bx, by] = pts[n];
  const ang = Math.atan2(by - ay, bx - ax);
  const side = (k: number, d: number): [number, number] => [ax + Math.cos(ang) * d + Math.cos(ang + Math.PI / 2) * k, ay + Math.sin(ang) * d + Math.sin(ang + Math.PI / 2) * k];
  const L = Math.hypot(bx - ax, by - ay);
  g.poly([...side(-w / 2, 0), ...side(w / 2, 0), ...(o.broken ? side(w * 0.18, L * 0.7) : side(0, L)), ...(o.broken ? side(-w * 0.18, L * 0.7) : side(0, L))]).fill(PENCIL.tip).stroke({ width: 3, color: TV.line, join: 'round' });
  if (!o.broken) g.poly([...side(-w * 0.16, L * 0.72), ...side(w * 0.16, L * 0.72), ...side(0, L)]).fill(PENCIL.lead);
}

/** the fog eraser: a fluffy grey cloud-shaped board eraser (Distraxia's way of erasing), with a felt strip */
export function fogEraser(g: Graphics, x: number, y: number, s: number, alpha = 1) {
  if (alpha <= 0.01) return;
  const puffs: [number, number, number][] = [[-0.55, 0.05, 0.42], [-0.2, -0.22, 0.5], [0.22, -0.2, 0.46], [0.58, 0.04, 0.4], [0, 0.12, 0.5]];
  for (const [px, py, r] of puffs) g.circle(x + px * s, y + py * s, r * s).fill({ color: 0xc7cfe0, alpha }).stroke({ width: LW * 0.7, color: TV.line, alpha });
  for (const [px, py, r] of puffs) g.circle(x + px * s, y + py * s, r * s * 0.82).fill({ color: 0xc7cfe0, alpha });
  g.roundRect(x - s * 0.95, y + s * 0.3, s * 1.9, s * 0.32, 8).fill({ color: 0x8a93ad, alpha }).stroke({ width: LW * 0.7, color: TV.line, alpha });
  g.circle(x - s * 0.25, y - s * 0.12, s * 0.07).fill({ color: TV.line, alpha: alpha * 0.8 });
  g.circle(x + s * 0.18, y - s * 0.12, s * 0.07).fill({ color: TV.line, alpha: alpha * 0.8 });
}

/** a small hand of light (the Titiriteros' «manos de luz»): palm + four fingers, glowing */
export function lightHand(g: Graphics, x: number, y: number, s: number, a: number, alpha = 1) {
  if (alpha <= 0.01) return;
  g.circle(x, y, s * 1.4).fill({ color: TV.lantern, alpha: 0.18 * alpha });
  g.ellipse(x, y, s * 0.55, s * 0.48).fill({ color: 0xeafcff, alpha });
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * 0.32;
    const [fx, fy] = rot(x, y, a + off, 0, s * 0.95);
    const [bx, by] = rot(x, y, a + off, 0, s * 0.35);
    g.moveTo(bx, by).lineTo(fx, fy).stroke({ width: s * 0.22, color: 0xeafcff, alpha, cap: 'round' });
  }
}

/** «Zzz»: three growing letters drawn as strokes (no Text), drifting with `t` */
export function zzz(g: Graphics, x: number, y: number, s: number, t: number, alpha = 1) {
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.6 + i / 3) % 1;
    const zs = s * (0.4 + i * 0.25) * (0.6 + k * 0.6);
    const zx = x + i * s * 0.55 + Math.sin(t * 2 + i) * s * 0.1;
    const zy = y - i * s * 0.6 - k * s * 0.5;
    const al = alpha * Math.min(1, (1 - k) * 2.2);
    g.moveTo(zx - zs / 2, zy - zs / 2).lineTo(zx + zs / 2, zy - zs / 2).lineTo(zx - zs / 2, zy + zs / 2).lineTo(zx + zs / 2, zy + zs / 2).stroke({ width: Math.max(3, zs * 0.18), color: TV.line, alpha: al, join: 'round', cap: 'round' });
    g.moveTo(zx - zs / 2, zy - zs / 2).lineTo(zx + zs / 2, zy - zs / 2).lineTo(zx - zs / 2, zy + zs / 2).lineTo(zx + zs / 2, zy + zs / 2).stroke({ width: Math.max(1.5, zs * 0.08), color: TV.cream, alpha: al, join: 'round', cap: 'round' });
  }
}

/** a cartoon «eye roll» mark: a curved arrow around a point (emanata) */
export function rollMark(g: Graphics, x: number, y: number, r: number, k: number, alpha = 1) {
  if (alpha <= 0.01 || k <= 0.01) return;
  const a0 = -Math.PI * 0.9;
  const a1 = a0 + Math.PI * 1.5 * k;
  g.arc(x, y, r, a0, a1).stroke({ width: 9, color: TV.line, alpha, cap: 'round' });
  g.arc(x, y, r, a0, a1).stroke({ width: 4, color: TV.cream, alpha, cap: 'round' });
  const hx = x + Math.cos(a1) * r;
  const hy = y + Math.sin(a1) * r;
  const ta = a1 + Math.PI / 2;
  g.poly([hx + Math.cos(ta) * 14, hy + Math.sin(ta) * 14, hx + Math.cos(ta - 2.4) * 11, hy + Math.sin(ta - 2.4) * 11, hx + Math.cos(ta + 2.4) * 11, hy + Math.sin(ta + 2.4) * 11]).fill({ color: TV.cream, alpha }).stroke({ width: 3, color: TV.line, alpha });
}

/** speed lines (a whip / a crash): `n` streaks across a rect, direction `a` */
export function speedLines(g: Graphics, x: number, y: number, w: number, h: number, a: number, k: number, seed = 1) {
  if (k <= 0.01) return;
  const c = Math.cos(a);
  const s = Math.sin(a);
  for (let i = 0; i < 14; i++) {
    const r1 = frac(Math.sin((i + seed) * 91.7) * 4371.3);
    const r2 = frac(Math.sin((i + seed) * 17.3) * 9127.1);
    const px = x + r1 * w;
    const py = y + r2 * h;
    const L = (120 + r1 * 260) * k;
    g.moveTo(px, py).lineTo(px + c * L, py + s * L).stroke({ width: 3 + r2 * 4, color: TV.cream, alpha: 0.5 * k, cap: 'round' });
  }
}

const frac = (v: number) => v - Math.floor(v);
const mixLight = (c: number) => mix(c, 0xffffff, 0.35);
/** mix two colors */
export function mix(a: number, b: number, k: number) {
  const kk = clamp(k, 0, 1);
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * kk);
  const gg = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * kk);
  const bb = Math.round((a & 255) + ((b & 255) - (a & 255)) * kk);
  return (r << 16) | (gg << 8) | bb;
}

/** a tally group like the board's (four strokes + one across), drawn in chalk */
export function tally(g: Graphics, x: number, y: number, n: number, h: number, color: number = TV.cream, alpha = 1, w = 4) {
  for (let i = 0; i < Math.min(4, n); i++) g.moveTo(x + i * h * 0.22, y).lineTo(x + i * h * 0.22, y + h).stroke({ width: w, color, alpha, cap: 'round' });
  if (n >= 5) g.moveTo(x - h * 0.12, y + h * 0.88).lineTo(x + h * 0.78, y + h * 0.08).stroke({ width: w, color, alpha, cap: 'round' });
}
