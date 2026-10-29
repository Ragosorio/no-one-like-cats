/**
 * Helpers shared by the post-Parte III «leyendas, mitos e historia» universes (UNIVERSOS-J, tanda 2: El Sombreronrón,
 * El Gatejo, La Maullorona, Quetzalgatl, Bastet, Cleogatra, Napoleón Bonapata, Leonardo da Michi). The base kit is
 * kit.ts; kitA–kitI hold the earlier waves' helpers (imported, never edited). This file adds:
 * - night props (a moon, fireflies, reeds, fog, ripples, tears), the codex's feathers, step-frets and wind scrolls,
 *   invented temple glyphs and a sitting temple cat, an oil-paint dab, a sketched gear, a torch;
 * - a few beat helpers (a guitar strum out of the SFX, a twinkle, a borrowed cat that always comes back).
 * Everything draws COARSE POLYGONS: Pixi pools one batcher per Graphics over ~400 vertices and those buffers never
 * shrink, so every single Graphics stays well under ~25k vertices, above all in the full-page Catdex card (≈3200×950).
 * Full screen (kit.ts, top): backgrounds go in `c.back` drawn to the box (cover-scaled, edges may crop), words go in
 * `c.fg` inside the box; anything in `fg` / `behind` that must cover the screen uses cover() / viewIn().
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { sfx, type SfxName } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type SigCtx, later } from './kit';
import { ngon, rnd, streak, twinkle } from './kitD';

export const TAU = Math.PI * 2;

export { pre, wrap, park, take, at, comic, flat, payline, note } from './kitI';
export { onCat, ngon, arcPts, bandPts, streak, twinkle, rnd, drive, aside, hsv } from './kitD';
export { ell, smooth, glowDisc, fogBank, pay, paid } from './kitC';
export { vgrad, mix, stash, fadeKill, borrowCat } from './kitB';
export { hideDisc, cardLoop } from './kitA';
export { band } from './kitE';
export { C, F };

// --- beats ------------------------------------------------------------------------------------
/** sfx notes in quick succession (a strum, a rattle, a clink run): [name, pitch] every `gap` s from `t0` */
export function run(c: SigCtx, t0: number, gap: number, notes: [SfxName, number][]) {
  notes.forEach(([n, p], i) => later(c, t0 + i * gap, () => sfx(n, p)));
}

/** a little guitar strum made of the plucky SFX (no music track): five rising notes */
export function strum(c: SigCtx, t0: number, base = 0.62) {
  run(c, t0, 0.045, [
    ['gem', base],
    ['gem', base * 1.26],
    ['gem', base * 1.5],
    ['gem', base * 2],
    ['pop', base * 1.6],
  ]);
}

/** a 4-point twinkle that pops at (x, y) on `layer` and fades (a glint on a pearl, an eye, a gem) */
export function glint(c: SigCtx, layer: Container, x: number, y: number, r = 40, color = 0xffffff, dur = 0.45) {
  const g = new Graphics().poly(twinkle(0, 0, r, 0.18)).fill(color).poly(twinkle(0, 0, r * 0.55, 0.3)).fill({ color: 0xffffff, alpha: 0.9 });
  g.position.set(x, y);
  layer.addChild(g);
  if (c.reduce) {
    gsap.to(g, { alpha: 0, delay: dur, duration: 0.2, onComplete: () => destroyTree(g) });
    return g;
  }
  gsap.fromTo(g.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: dur * 0.4, ease: 'back.out(3)' });
  gsap.to(g, { rotation: 0.8, duration: dur, ease: 'power1.out' });
  gsap.to(g, { alpha: 0, delay: dur * 0.6, duration: dur * 0.4, onComplete: () => destroyTree(g) });
  return g;
}

/** a node that's there now and leaves at `t` (fade), if the reveal is still open */
export function leaveAt(c: SigCtx, node: Container, t: number, dur = 0.3) {
  later(c, t, () => {
    if (node.destroyed) return;
    gsap.to(node, { alpha: 0, duration: dur, onComplete: () => destroyTree(node) });
  });
}

// --- night ------------------------------------------------------------------------------------
/** a full moon with soft seas and a glow (Container; `r` = radius) */
export function moon(r: number, body = 0xf4efd8, glow = 0xbfd4ff, seas = 0xd8d0b4, glowA = 0.4) {
  const k = new Container();
  const halo = new Graphics();
  for (let i = 7; i >= 1; i--) halo.poly(ngon(0, 0, r * (1 + i * 0.22), r * (1 + i * 0.22), 36)).fill({ color: glow, alpha: glowA / 7 });
  const g = new Graphics().poly(ngon(0, 0, r, r, 44)).fill(body);
  for (const [x, y, rr] of [
    [-0.32, -0.22, 0.24],
    [0.22, 0.12, 0.3],
    [-0.08, 0.44, 0.16],
    [0.44, -0.34, 0.12],
    [-0.46, 0.2, 0.1],
  ])
    g.poly(ngon(x * r, y * r, rr * r, rr * r * 0.9, 16)).fill({ color: seas, alpha: 0.55 });
  k.addChild(halo, g);
  return k;
}

/** fireflies: `n` soft dots drifting in a box; returns the Graphics and draw(t) (one Graphics, ~12 vertices each) */
export function fireflies(n: number, x: number, y: number, w: number, h: number, seed: number, color = 0xfff2a0, size = 5) {
  const g = new Graphics();
  const r = rnd(seed);
  const pts = Array.from({ length: n }, () => ({ x: r() * w, y: r() * h, a: r() * TAU, b: r() * TAU, s: 0.6 + r() * 0.8, f: 0.5 + r() }));
  const draw = (t: number) => {
    g.clear();
    for (const p of pts) {
      const px = x + p.x + Math.sin(t * 0.6 * p.f + p.a) * 30;
      const py = y + p.y + Math.cos(t * 0.5 * p.f + p.b) * 18;
      const on = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 * p.f + p.a * 3));
      const s = size * p.s;
      g.poly(ngon(px, py, s * 3, s * 3, 8)).fill({ color, alpha: 0.12 * on });
      g.poly(ngon(px, py, s, s, 6)).fill({ color, alpha: 0.9 * on });
    }
  };
  draw(0);
  return { g, draw };
}

/** reeds along y0 (blades and cattails) from x0 to x1; `sway` bends their tips (one fill per call) */
export function reeds(g: Graphics, x0: number, x1: number, y0: number, h: number, color: number, seed: number, sway = 0, top = 0x5a3a22, step = 26) {
  const r = rnd(seed);
  const tips: [number, number][] = [];
  for (let x = x0; x < x1; x += step * (0.6 + r() * 0.8)) {
    const hh = h * (0.55 + r() * 0.6);
    const lean = (r() - 0.5) * 0.5 + sway * (0.6 + r() * 0.6);
    const tx = x + lean * hh * 0.4;
    const ty = y0 - hh;
    g.poly(streak(x, y0, tx, ty, 4 + r() * 3, 0.5));
    if (r() < 0.35) tips.push([x + lean * hh * 0.3, y0 - hh * 0.82]);
  }
  g.fill(color);
  for (const [tx, ty] of tips) g.poly(ngon(tx, ty, 6, 20, 8)).fill(top);
  return g;
}

/** a ripple on water: an ellipse ring that grows and fades at (x, y) on `layer` */
export function ripple(c: SigCtx, layer: Container, x: number, y: number, color = 0xdfeeff, r = 40, to = 4, dur = 1.1, width = 4) {
  const g = new Graphics().poly(ngon(0, 0, r, r * 0.28, 28)).stroke({ width, color, alpha: 0.9 });
  g.position.set(x, y);
  layer.addChild(g);
  if (c.reduce) {
    gsap.to(g, { alpha: 0, delay: 0.5, duration: 0.3, onComplete: () => destroyTree(g) });
    return g;
  }
  gsap.fromTo(g.scale, { x: 0.3, y: 0.3 }, { x: to, y: to, duration: dur, ease: 'power2.out' });
  gsap.to(g, { alpha: 0, duration: dur, ease: 'power1.in', onComplete: () => destroyTree(g) });
  return g;
}

/** a teardrop (point up), `s` = its half-width */
export function tearPts(x: number, y: number, s: number): number[] {
  const p: number[] = [x, y - s * 2.1];
  for (let i = 0; i <= 10; i++) {
    const a = -0.25 * Math.PI + (i / 10) * 1.5 * Math.PI;
    p.push(x + Math.cos(a) * s, y + Math.sin(a) * s);
  }
  return p;
}

// --- codex ------------------------------------------------------------------------------------
/** a quetzal feather (origin at its quill, pointing +x, `len` long): vane, inner eye and rachis, 3 polygons */
export function feather(g: Graphics, x: number, y: number, len: number, rot: number, vane = 0x1f8a5b, inner = 0x37c27f, rach = 0xe6c34a, ink: number | null = C.ink) {
  const ca = Math.cos(rot);
  const sa = Math.sin(rot);
  const T = (u: number, v: number): [number, number] => [x + ca * u * len - sa * v * len, y + sa * u * len + ca * v * len];
  const out: number[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const u = 0.08 + (i / steps) * 0.92;
    const w = 0.17 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (u < 0.3 ? u / 0.3 : 1);
    out.push(...T(u, -w));
  }
  for (let i = steps; i >= 0; i--) {
    const u = 0.08 + (i / steps) * 0.92;
    const w = 0.17 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (u < 0.3 ? u / 0.3 : 1);
    out.push(...T(u, w));
  }
  g.poly(out).fill(vane);
  if (ink !== null) g.stroke({ width: Math.max(1.2, len * 0.025), color: ink, join: 'round' });
  g.poly([...T(0.45, 0), ...T(0.62, -0.08), ...T(0.82, 0), ...T(0.62, 0.08)]).fill(inner);
  g.poly([...T(0, -0.012), ...T(0.95, -0.006), ...T(0.95, 0.006), ...T(0, 0.012)]).fill(rach);
  return g;
}

/** a step-fret (xicalcoliuhqui) unit: a stepped hook, `s` tall, facing `dir` (one polygon) */
export function fretPts(x: number, y: number, s: number, dir = 1): number[] {
  const u = s / 5;
  const P = [0, 5, 0, 0, 4, 0, 4, 3, 2, 3, 2, 2, 3, 2, 3, 1, 1, 1, 1, 4, 5, 4, 5, 5];
  const out: number[] = [];
  for (let i = 0; i < P.length; i += 2) out.push(x + (dir > 0 ? P[i] : 5 - P[i]) * u, y + P[i + 1] * u - s);
  return out;
}

/** a codex wind/speech scroll (a volute): a curling band, `s` across, turning `dir` */
export function volute(g: Graphics, x: number, y: number, s: number, rot: number, color: number, ink: number | null = C.ink, dir = 1) {
  const n = 22;
  const L: number[] = [];
  const R: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = rot + dir * u * TAU * 1.15;
    const rr = s * (0.5 - u * 0.36);
    const w = s * (0.11 - u * 0.07);
    L.push(x + Math.cos(a) * (rr + w), y + Math.sin(a) * (rr + w));
    R.unshift(x + Math.cos(a) * (rr - w), y + Math.sin(a) * (rr - w));
  }
  g.poly([...L, ...R]).fill(color);
  if (ink !== null) g.stroke({ width: Math.max(1.5, s * 0.03), color: ink, join: 'round' });
  return g;
}

// --- temples ----------------------------------------------------------------------------------
/** a temple cat sitting in profile (facing +x; origin at its feet, `s` ≈ its height): one polygon, ear and tail */
export function sittingCatPts(x: number, y: number, s: number, dir = 1): number[] {
  const P = [
    -0.18, 0, -0.24, -0.18, -0.2, -0.42, -0.1, -0.62, -0.04, -0.74, -0.06, -0.86, -0.02, -0.98, 0.04, -0.88, 0.1, -0.9, 0.14, -1.0, 0.16, -0.86, 0.2, -0.78, 0.16, -0.7, 0.08, -0.66,
    0.06, -0.5, 0.12, -0.2, 0.14, 0, 0.3, 0.02, 0.36, -0.06, 0.28, -0.04, 0.16, 0.04,
  ];
  const out: number[] = [];
  for (let i = 0; i < P.length; i += 2) out.push(x + P[i] * s * dir, y + P[i + 1] * s);
  return out;
}

/**
 * a row of invented temple glyphs (not real hieroglyphs: a sitting cat, an eye, waves, a sun, a looped cross, a reed,
 * a bird, a fish) in cells of `cell`, from (x, y) for `n` cells; seeded. One fill.
 */
export function glyphRow(g: Graphics, x: number, y: number, n: number, cell: number, color: number, seed: number, alpha = 1, vertical = false) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const cx = vertical ? x : x + i * cell + cell / 2;
    const cy = vertical ? y + i * cell + cell / 2 : y;
    const s = cell * 0.4;
    switch (Math.floor(r() * 8)) {
      case 0:
        g.poly(sittingCatPts(cx, cy + s, s * 2, r() < 0.5 ? 1 : -1));
        break;
      case 1:
        g.poly([cx - s, cy, cx - s * 0.3, cy - s * 0.45, cx + s * 0.4, cy - s * 0.4, cx + s, cy, cx + s * 0.4, cy + s * 0.32, cx - s * 0.3, cy + s * 0.3]);
        g.poly([cx - s * 0.1, cy + s * 0.25, cx + s * 0.05, cy + s * 0.9, cx + s * 0.2, cy + s * 0.9, cx + s * 0.1, cy + s * 0.25]);
        break;
      case 2:
        for (let k = 0; k < 3; k++) {
          const yy = cy - s * 0.6 + k * s * 0.6;
          const z: number[] = [];
          for (let j = 0; j <= 6; j++) z.push(cx - s + (j * s * 2) / 6, yy + (j % 2 ? -s * 0.18 : s * 0.18));
          for (let j = 6; j >= 0; j--) z.push(cx - s + (j * s * 2) / 6, yy + (j % 2 ? -s * 0.18 : s * 0.18) + s * 0.16);
          g.poly(z);
        }
        break;
      case 3:
        g.poly(ngon(cx, cy - s * 0.2, s * 0.62, s * 0.62, 14));
        g.poly([cx - s, cy + s * 0.6, cx + s, cy + s * 0.6, cx + s * 0.7, cy + s * 0.85, cx - s * 0.7, cy + s * 0.85]);
        break;
      case 4:
        g.poly([...ngon(cx, cy - s * 0.55, s * 0.36, s * 0.48, 12)]);
        g.poly([cx - s * 0.12, cy - s * 0.1, cx + s * 0.12, cy - s * 0.1, cx + s * 0.12, cy + s, cx - s * 0.12, cy + s]);
        g.poly([cx - s * 0.7, cy - s * 0.02, cx + s * 0.7, cy - s * 0.02, cx + s * 0.7, cy + s * 0.2, cx - s * 0.7, cy + s * 0.2]);
        break;
      case 5:
        g.poly(streak(cx, cy + s, cx + s * 0.1, cy - s, s * 0.14, s * 0.05));
        g.poly([cx + s * 0.08, cy - s, cx + s * 0.6, cy - s * 0.5, cx + s * 0.12, cy - s * 0.3]);
        break;
      case 6:
        g.poly([cx - s, cy + s * 0.1, cx - s * 0.3, cy - s * 0.3, cx + s * 0.2, cy - s * 0.9, cx + s * 0.5, cy - s * 0.7, cx + s * 0.3, cy - s * 0.3, cx + s * 0.8, cy + s * 0.1, cx + s * 0.3, cy + s * 0.3, cx + s * 0.2, cy + s, cx, cy + s, cx, cy + s * 0.35]);
        break;
      default:
        g.poly([cx - s, cy, cx - s * 0.2, cy - s * 0.42, cx + s * 0.5, cy - s * 0.1, cx + s, cy - s * 0.4, cx + s, cy + s * 0.4, cx + s * 0.5, cy + s * 0.1, cx - s * 0.2, cy + s * 0.42]);
    }
  }
  return g.fill({ color, alpha });
}

/** a torch: a bowl on a stand and a flame that flickers with `t` (draws into g; ~30 vertices) */
export function torch(g: Graphics, x: number, y: number, s: number, t: number, stand = 0x3a2a1a, gold = 0xe6c34a) {
  g.poly([x - s * 0.08, y, x + s * 0.08, y, x + s * 0.05, y - s * 1.0, x - s * 0.05, y - s * 1.0]).fill(stand);
  g.poly([x - s * 0.3, y - s * 1.0, x + s * 0.3, y - s * 1.0, x + s * 0.18, y - s * 1.16, x - s * 0.18, y - s * 1.16]).fill(gold);
  const f = 1 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 29 + 1);
  const lean = Math.sin(t * 7) * s * 0.06;
  g.poly([x - s * 0.24, y - s * 1.12, x + s * 0.24, y - s * 1.12, x + s * 0.16 + lean, y - s * (1.4 + 0.2 * f), x + lean * 1.5, y - s * (1.6 + 0.42 * f), x - s * 0.14 + lean, y - s * (1.38 + 0.18 * f)]).fill(0xff7a1a);
  g.poly([x - s * 0.12, y - s * 1.12, x + s * 0.12, y - s * 1.12, x + lean, y - s * (1.38 + 0.2 * f)]).fill(0xffe27a);
  return g;
}

// --- paint ------------------------------------------------------------------------------------
/** an oil-paint brush dab: a curved, tapered stroke (x0,y0)→(x1,y1) bent through (mx,my), half-width hw */
export function dab(x0: number, y0: number, mx: number, my: number, x1: number, y1: number, hw: number): number[] {
  const N = 5;
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const cc = t * t;
    const px = a * x0 + b * mx + cc * x1;
    const py = a * y0 + b * my + cc * y1;
    const tx = 2 * (1 - t) * (mx - x0) + 2 * t * (x1 - mx);
    const ty = 2 * (1 - t) * (my - y0) + 2 * t * (y1 - my);
    const tl = Math.hypot(tx, ty) || 1;
    const w = hw * (0.35 + 0.65 * Math.sin(Math.PI * t));
    left.push(px - (ty / tl) * w, py + (tx / tl) * w);
    right.unshift(px + (ty / tl) * w, py - (tx / tl) * w);
  }
  return [...left, ...right];
}

/** a field of brush dabs over (x, y, w, h) in `colors`, roughly horizontal (an oil sky, a painted field); seeded */
export function dabField(g: Graphics, x: number, y: number, w: number, h: number, colors: number[], n: number, seed: number, len = 90, hw = 14, alpha = 0.55, tilt = 0) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const cx = x + r() * w;
    const cy = y + r() * h;
    const L = len * (0.6 + r() * 0.8);
    const a = tilt + (r() - 0.5) * 0.5;
    const bx = Math.cos(a) * L * 0.5;
    const by = Math.sin(a) * L * 0.5;
    g.poly(dab(cx - bx, cy - by, cx + (r() - 0.5) * L * 0.2, cy - L * 0.08 * (r() - 0.3), cx + bx, cy + by, hw * (0.6 + r() * 0.8))).fill({ color: colors[Math.floor(r() * colors.length)], alpha });
  }
  return g;
}

/** a gear's outline as points (`teeth` teeth, outer r, root r·0.8) */
export function gearPts(x: number, y: number, r: number, teeth: number, rot = 0): number[] {
  const p: number[] = [];
  const r0 = r * 0.8;
  for (let i = 0; i < teeth; i++) {
    const a = rot + (i / teeth) * TAU;
    const d = TAU / teeth;
    p.push(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    p.push(x + Math.cos(a + d * 0.18) * r, y + Math.sin(a + d * 0.18) * r);
    p.push(x + Math.cos(a + d * 0.5) * r, y + Math.sin(a + d * 0.5) * r);
    p.push(x + Math.cos(a + d * 0.68) * r0, y + Math.sin(a + d * 0.68) * r0);
  }
  return p;
}

/** a sketched gear (sepia lines: outline, hub, spokes) into g */
export function sketchGear(g: Graphics, x: number, y: number, r: number, teeth: number, rot: number, color: number, width = 3, alpha = 1) {
  g.poly(gearPts(x, y, r, teeth, rot), true).stroke({ width, color, alpha, join: 'round' });
  g.poly(ngon(x, y, r * 0.2, r * 0.2, 10), true).stroke({ width, color, alpha });
  for (let i = 0; i < 4; i++) {
    const a = rot + (i / 4) * TAU;
    g.moveTo(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2).lineTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72);
  }
  g.stroke({ width: width * 0.8, color, alpha, cap: 'round' });
  return g;
}

/** the first `u` (0..1) of a polyline's length, as points (a line that draws itself) */
export function partial(pts: number[], u: number): number[] {
  if (u >= 1) return pts;
  const n = pts.length / 2;
  let total = 0;
  for (let i = 1; i < n; i++) total += Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
  let left = total * Math.max(0, u);
  const out = [pts[0], pts[1]];
  for (let i = 1; i < n && left > 0; i++) {
    const d = Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
    if (d <= left) {
      out.push(pts[i * 2], pts[i * 2 + 1]);
      left -= d;
    } else {
      const k = left / d;
      out.push(pts[i * 2 - 2] + (pts[i * 2] - pts[i * 2 - 2]) * k, pts[i * 2 - 1] + (pts[i * 2 + 1] - pts[i * 2 - 1]) * k);
      left = 0;
    }
  }
  return out;
}

/** a floating pop word on `layer` (flat, no ghosts): rises a little and fades — sounds that aren't shouts */
export function puffWord(c: SigCtx, layer: Container, node: Container, x: number, y: number, hold = 0.7, rise = 40) {
  node.position.set(x, y);
  layer.addChild(node);
  if (c.reduce) {
    gsap.to(node, { alpha: 0, delay: hold, duration: 0.2, onComplete: () => destroyTree(node) });
    return node;
  }
  gsap.fromTo(node.scale, { x: 0.4, y: 0.4 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2.5)' });
  gsap.to(node, { y: y - rise, duration: hold + 0.25, ease: 'power1.out' });
  gsap.to(node, { alpha: 0, delay: hold, duration: 0.25, onComplete: () => destroyTree(node) });
  return node;
}

