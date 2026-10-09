/**
 * Element biomes: what makes a fire habitat FEEL like fire (basalt + lava rivers + embers), ice like
 * ice (translucent monoliths, icicles, aurora), light like light (cathedral spires, god-rays, a
 * rainbow)… Each element draws, scaled to the yard (N×N tiles) and growing with the tier stage
 * (0: T1–3, 1: T4–6, 2: T7–9, 3: T10):
 *   ground    floor materials + flat features (rivers, pools, inlays, cracks) under the cats
 *   backdrop  structures standing behind the two back edges (behind the fence: never hide cats)
 *   crown     tall pieces rising behind/above the house (canopies, auroras, planets, rifts, rays)
 *   front     low props on the front edges
 *   ambient   particles + breathing glows (island/habitats/ambient.ts)
 * Concept references (outside the repo): fuego, hielo, luz, magia, sombra, agua, tiempo.
 * Parte II: cristal (NÁCAR PRISMÁTICO — mother-of-pearl floor, geodes, a prism that splits the light).
 */
import { Container, Graphics } from 'pixi.js';
import { C } from '../../ui/theme';
import { Ambient } from './ambient';
import {
  HAIR,
  INK,
  P,
  Pal,
  Pt,
  THIN,
  Tick,
  candle,
  capRock,
  crystal,
  crystals,
  diamond,
  fern,
  flower,
  glowSprite,
  groundEllipse,
  groundPoly,
  icicles,
  lerp,
  pillar,
  monolith,
  rock,
  ribbon,
  shade,
  spire,
  standingStone,
  stepped,
  tree,
  tuft,
} from './kit';

export interface BiomeCtx {
  el: string;
  tier: number;
  stage: 0 | 1 | 2 | 3;
  N: number;
  pal: Pal;
  r: () => number;
  /** static layers */
  gnd: Graphics;
  bk: Graphics;
  crown: Graphics;
  fr: Graphics;
  /** animated holders: ground (under cats), back (behind the fence), crown (over the house), front */
  gFx: Container;
  bFx: Container;
  cFx: Container;
  fFx: Container;
  amb: Ambient;
  ticks: Tick[];
  /** house base + roof (px) */
  house: Pt;
  roofY: number;
}

// ------------------------------------------------------------------ yard geometry helpers
/** point on the back-right edge (u: 0 = back corner → 1 = right corner), `out` tiles behind it */
const BR = (c: BiomeCtx, u: number, out = 0.15) => P(-0.5 + u * c.N, -0.5 - out);
/** point on the back-left edge (u: 0 = back corner → 1 = left corner) */
const BL = (c: BiomeCtx, u: number, out = 0.15) => P(-0.5 - out, -0.5 + u * c.N);
/** point on the front-right edge (u: 0 = right corner → 1 = front corner) */
const FR = (c: BiomeCtx, u: number, inn = 0.2) => P(c.N - 0.5 - inn, -0.5 + u * c.N);
/** point on the front-left edge (u: 0 = left corner → 1 = front corner); the gate is near u≈0.3 */
const FL = (c: BiomeCtx, u: number, inn = 0.2) => P(-0.5 + u * c.N, c.N - 0.5 - inn);
/** a random point inside the yard (tile margins), px */
const inYard = (c: BiomeCtx, m = 0.6) => () => P(-0.5 + m + c.r() * (c.N - 2 * m), -0.5 + m + c.r() * (c.N - 2 * m));
/** size factor per stage */
const SZ = [0.8, 1, 1.25, 1.45];

/** draw the element's biome into the context */
export function drawBiome(c: BiomeCtx) {
  (BIOMES[c.el] ?? BIOMES.fire)(c);
}

// ------------------------------------------------------------------ shared bits
/** soil speckles + darker patches so no floor is flat */
function speckle(c: BiomeCtx, n: number, col: number, alpha = 0.35, rx = 10, ry = 4) {
  for (let i = 0; i < n; i++) {
    const p = inYard(c, 0.2)();
    c.gnd.ellipse(p.x, p.y, rx * (0.5 + c.r()), ry * (0.5 + c.r())).fill({ color: col, alpha });
  }
}
/** flicker an object's alpha (stepped, cheap) */
function flick(c: BiomeCtx, o: { alpha: number }, base: number, amt: number, f = 7) {
  const ph = c.r() * 9;
  c.ticks.push((t) => {
    const s = stepped(t);
    o.alpha = base + Math.sin(s * f + ph) * amt * 0.6 + Math.sin(s * f * 2.3 + ph) * amt * 0.4;
  });
}
/** cycle K pre-built frames (no redraw) */
function frames(c: BiomeCtx, list: Graphics[], fps = 4) {
  list.forEach((g, i) => (g.visible = i === 0));
  let last = -1;
  c.ticks.push((t) => {
    const f = Math.floor(t * fps) % list.length;
    if (f === last) return;
    last = f;
    list.forEach((g, i) => (g.visible = i === f));
  });
}
/** a candle flame (animated) at p */
function flame(c: BiomeCtx, parent: Container, p: Pt, s = 1, col = 0xffc94a) {
  const f = new Graphics();
  f.moveTo(0, -9 * s).quadraticCurveTo(4 * s, -2 * s, 0, 0).quadraticCurveTo(-4 * s, -2 * s, 0, -9 * s).fill(col).stroke({ width: 1, color: C.ink, alpha: 0.8 });
  f.ellipse(0, -2.5 * s, 1.3 * s, 2.2 * s).fill(0xffffff);
  f.position.set(p.x, p.y);
  parent.addChild(f);
  const gl = glowSprite(parent, p.x, p.y - 4 * s, col, 0.4, 0.22 * s);
  c.amb.glow(gl);
  const ph = c.r() * 6;
  c.ticks.push((t) => {
    const k = Math.floor(stepped(t) * 6 + ph * 3) % 3;
    f.scale.set(k === 1 ? 0.88 : 1, k === 2 ? 1.18 : 1);
  });
  return f;
}
/** a zig-zag bolt between a and b (frame variant v) */
function bolt(g: Graphics, a: Pt, b: Pt, v: number, col: number, w = 3) {
  const n = 6;
  const pts: number[] = [a.x, a.y];
  for (let k = 1; k < n; k++) {
    const f = k / n;
    const j = Math.sin(k * 7.1 + v * 3.3) * 10;
    pts.push(lerp(a.x, b.x, f) + j, lerp(a.y, b.y, f) + Math.cos(k * 5.3 + v) * 6);
  }
  pts.push(b.x, b.y);
  g.poly(pts, false).stroke({ width: w + 4, color: C.ink, join: 'miter', cap: 'round' });
  g.poly(pts, false).stroke({ width: w, color: col, join: 'miter', cap: 'round' });
  g.poly(pts, false).stroke({ width: Math.max(1, w * 0.35), color: 0xffffff, join: 'miter', cap: 'round' });
}

// =========================================================================================== FIRE
function fire(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  // basalt plates + glowing veins (the veins breathe)
  speckle(c, 6 + N * 2, pal.soil2, 0.8, 26, 10);
  for (let i = 0; i < 4 + N * 2 + stage * 3; i++) {
    const p = inYard(c, 0.3)();
    const w = 16 + c.r() * 22;
    c.gnd.poly([p.x - w, p.y, p.x - w * 0.4, p.y - w * 0.32, p.x + w * 0.6, p.y - w * 0.3, p.x + w, p.y + 2, p.x + w * 0.3, p.y + w * 0.34, p.x - w * 0.5, p.y + w * 0.3]).fill(c.r() < 0.5 ? pal.rock : pal.rockLit).stroke({ width: 1.5, color: C.ink, alpha: 0.5 });
  }
  const lava = new Graphics();
  c.gFx.addChild(lava);
  const veins = 2 + c.tier + stage * 2;
  for (let i = 0; i < veins; i++) {
    const a = inYard(c, 0.3)();
    let x = a.x;
    let y = a.y;
    const pts = [x, y];
    for (let k = 0; k < 4; k++) {
      x += (c.r() - 0.5) * 44;
      y += (c.r() - 0.3) * 18;
      pts.push(x, y);
    }
    lava.poly(pts, false).stroke({ width: 4.5, color: C.ink, alpha: 0.7, cap: 'round', join: 'round' });
    lava.poly(pts, false).stroke({ width: 3, color: pal.glow, cap: 'round', join: 'round' });
    lava.poly(pts, false).stroke({ width: 1.1, color: pal.glowHot, cap: 'round', join: 'round' });
  }
  c.amb.glow(lava, 0.85);
  // the lava river (T4+): back-right edge → front-left edge, with crust and stepping stones
  if (stage >= 1) {
    const path: [number, number][] = [
      [N * 0.72, -0.5],
      [N * 0.66, N * 0.3],
      [N * 0.48, N * 0.55],
      [N * 0.6, N * 0.8],
      [N * 0.62, N - 0.5],
    ];
    const W = 18 * s;
    ribbon(c.gnd, path, W + 10, C.ink);
    ribbon(c.gnd, path, W + 4, pal.rockDark);
    const hot = new Graphics();
    ribbon(hot, path, W, pal.glow);
    ribbon(hot, path, W * 0.45, pal.glowHot);
    c.gFx.addChild(hot);
    c.amb.glow(hot, 0.95);
    // crust plates floating on it
    for (let k = 1; k < 8; k++) {
      const f = k / 8;
      const i = Math.min(path.length - 2, Math.floor(f * (path.length - 1)));
      const ff = f * (path.length - 1) - i;
      const q = P(lerp(path[i][0], path[i + 1][0], ff), lerp(path[i][1], path[i + 1][1], ff));
      if (k % 3 === 0) {
        // stepping stone
        c.gnd.ellipse(q.x, q.y, 13 * s, 6 * s).fill(pal.rockLit);
        c.fr.ellipse(q.x, q.y - 2, 12 * s, 5.5 * s).fill(pal.rockLit).stroke(HAIR);
      } else hot.ellipse(q.x + (c.r() - 0.5) * 6, q.y, 5 * s, 2.4 * s).fill({ color: pal.rockDark, alpha: 0.8 });
    }
    // embers rise from the river
    c.amb.add('ember', pal.glow, 3 + stage * 2, () => {
      const i = Math.floor(c.r() * (path.length - 1));
      return P(lerp(path[i][0], path[i + 1][0], c.r()), lerp(path[i][1], path[i + 1][1], c.r()));
    }, { h: 90 * s, amp: 6, sp: 0.35 });
  }
  // backdrop: eroded basalt rocks with lava drips; T7+ an arch with lava falls; T10 a volcano
  const drip = (g: Graphics, x: number, y: number, h: number) => {
    g.moveTo(x, y).quadraticCurveTo(x + 2, y + h * 0.5, x - 1, y + h).stroke({ width: 5, color: C.ink, cap: 'round' });
    g.moveTo(x, y).quadraticCurveTo(x + 2, y + h * 0.5, x - 1, y + h).stroke({ width: 3, color: pal.glow, cap: 'round' });
    g.moveTo(x, y).quadraticCurveTo(x + 2, y + h * 0.5, x - 1, y + h).stroke({ width: 1, color: pal.glowHot, cap: 'round' });
  };
  const drips = new Graphics();
  c.bFx.addChild(drips);
  c.amb.glow(drips, 0.95);
  const formation = (p: Pt, w: number, h: number) => {
    capRock(c.bk, p.x, p.y, w, h, pal.rockLit, pal.rock, shade(pal.rockLit, 1.3));
    for (let k = 0; k < 3; k++) drip(drips, p.x - w * 0.12 + k * w * 0.1, p.y - h * 0.72, h * (0.3 + k * 0.12));
    glowSprite(c.bFx, p.x, p.y - h * 0.4, pal.glow, 0.25, 0.5 * s);
  };
  if (stage === 0) {
    rock(c.bk, BR(c, 0.72).x, BR(c, 0.72).y, 34, 22, pal.rock, pal.rockLit);
    rock(c.bk, BL(c, 0.7).x, BL(c, 0.7).y, 28, 18, pal.rock, pal.rockLit);
    // a little lava pool with a crust rim
    groundEllipse(c.gnd, N * 0.66, N * 0.6, 0.42).fill(pal.rockDark).stroke(INK);
    const pool = new Graphics();
    groundEllipse(pool, N * 0.66, N * 0.6, 0.32).fill(pal.glow);
    groundEllipse(pool, N * 0.64, N * 0.58, 0.16).fill(pal.glowHot);
    c.gFx.addChild(pool);
    c.amb.glow(pool, 0.95);
    const pp = P(N * 0.66, N * 0.6);
    c.amb.add('ember', pal.glowHot, 2, () => ({ x: pp.x + (c.r() - 0.5) * 30, y: pp.y }), { h: 60, amp: 5, sp: 0.35 });
  } else {
    formation(BL(c, 0.62), 70 * s, 90 * s);
    formation(BR(c, 0.88), 56 * s, 70 * s);
  }
  if (stage >= 2) {
    // the arch over the back-right edge (concept: lava pouring from the arch)
    const a = BR(c, 0.38, 0.25);
    const b = BR(c, 0.68, 0.25);
    const H = 150 * s;
    for (const p of [a, b]) {
      pillar(c.bk, p.x, p.y, 44, H, pal.rock, pal.rockDark, pal.rockLit);
      drip(drips, p.x - 6, p.y - H + 10, H * 0.45);
    }
    c.bk.moveTo(a.x - 30, a.y - H + 6).quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - H - 46, b.x + 30, b.y - H + 6).lineTo(b.x + 26, b.y - H + 30).quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - H - 12, a.x - 26, a.y - H + 30).closePath().fill(pal.rockLit).stroke(INK);
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const fall = new Graphics();
    for (const dx of [-14, 0, 12]) {
      fall.moveTo(m.x + dx, m.y - H - 10).bezierCurveTo(m.x + dx + 6, m.y - H * 0.6, m.x + dx - 4, m.y - H * 0.3, m.x + dx + 2, m.y).stroke({ width: 9, color: C.ink, cap: 'round' });
      fall.moveTo(m.x + dx, m.y - H - 10).bezierCurveTo(m.x + dx + 6, m.y - H * 0.6, m.x + dx - 4, m.y - H * 0.3, m.x + dx + 2, m.y).stroke({ width: 6, color: pal.glow, cap: 'round' });
      fall.moveTo(m.x + dx, m.y - H - 10).bezierCurveTo(m.x + dx + 6, m.y - H * 0.6, m.x + dx - 4, m.y - H * 0.3, m.x + dx + 2, m.y).stroke({ width: 2, color: pal.glowHot, cap: 'round' });
    }
    fall.ellipse(m.x, m.y + 4, 34, 11).fill(pal.glow).stroke(THIN);
    fall.ellipse(m.x, m.y + 3, 22, 6).fill(pal.glowHot);
    c.bFx.addChild(fall);
    c.amb.glow(fall, 1);
    c.amb.glow(glowSprite(c.bFx, m.x, m.y - H * 0.5, pal.glow, 0.45, 1.2 * s, true));
    c.amb.add('ember', pal.glowHot, 4, () => ({ x: m.x + (c.r() - 0.5) * 40, y: m.y - 10 }), { h: H * 1.2, amp: 10, sp: 0.3 });
  }
  if (stage >= 3) {
    // a volcano rising behind the back corner, its crater glowing
    const v = BR(c, 0.05, 1.2);
    const H = 300;
    c.crown.poly([v.x - 200, v.y, v.x - 120, v.y - H * 0.45, v.x - 46, v.y - H, v.x + 46, v.y - H, v.x + 130, v.y - H * 0.4, v.x + 200, v.y]).fill(pal.rock).stroke(INK);
    c.crown.poly([v.x + 6, v.y - H, v.x + 46, v.y - H, v.x + 130, v.y - H * 0.4, v.x + 200, v.y, v.x + 60, v.y]).fill(pal.rockDark);
    c.crown.poly([v.x - 40, v.y - H + 8, v.x - 110, v.y - H * 0.45, v.x - 150, v.y - H * 0.2, v.x - 90, v.y - H * 0.5]).fill(pal.rockLit);
    const crater = new Graphics();
    // lava streams down its flanks
    for (const [dx, len] of [
      [-22, 0.55],
      [14, 0.8],
      [36, 0.4],
    ]) drip(crater, v.x + dx, v.y - H + 8, H * len);
    crater.ellipse(v.x, v.y - H, 46, 12).fill(pal.glow).stroke(INK);
    crater.ellipse(v.x, v.y - H - 2, 30, 6).fill(pal.glowHot);
    c.cFx.addChild(crater);
    c.amb.glow(crater, 1);
    c.amb.glow(glowSprite(c.cFx, v.x, v.y - H - 10, pal.glow, 0.55, 1.6, true));
    c.amb.add('ember', pal.glowHot, 6, () => ({ x: v.x + (c.r() - 0.5) * 50, y: v.y - H }), { h: 160, amp: 18, sp: 0.22 });
  }
  // front: red-orange flowers (concept) + glowing rocks
  for (let i = 0; i < 2 + stage * 2; i++) {
    const p = i % 2 ? FR(c, 0.25 + c.r() * 0.5) : FL(c, 0.5 + c.r() * 0.4);
    for (let k = 0; k < 4; k++) flower(c.fr, p.x + (c.r() - 0.5) * 22, p.y - 4 - c.r() * 6, 0.8, k % 2 ? pal.bloom : pal.bloom2, 0x4e0000);
  }
  c.amb.add('ember', pal.glow, 1 + Math.ceil(c.tier / 2), inYard(c), { h: 60, amp: 5, sp: 0.3 });
}

// =========================================================================================== WATER
function water(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  speckle(c, 8 + N * 2, pal.soil2, 0.7, 22, 9);
  speckle(c, 4 + N, shade(pal.soil, 0.8), 0.45, 16, 6);
  // the stream (pond at T1–3): back-left edge → front-right edge, bioluminescent with caustics
  const path: [number, number][] = stage >= 1 ? [[-0.5, N * 0.62], [N * 0.3, N * 0.55], [N * 0.55, N * 0.72], [N * 0.8, N * 0.6], [N - 0.5, N * 0.66]] : [];
  const caus: Graphics[] = [new Graphics(), new Graphics(), new Graphics()];
  if (stage >= 1) {
    const W = 26 * s;
    ribbon(c.gnd, path, W + 10, C.ink);
    ribbon(c.gnd, path, W + 4, pal.rockDark);
    ribbon(c.gnd, path, W, 0x1f8aa8);
    ribbon(c.gnd, path, W * 0.55, pal.glow, 0.55);
    caus.forEach((g, v) => {
      for (let k = 0; k < 9; k++) {
        const f = (k + v / 3) / 9;
        const i = Math.min(path.length - 2, Math.floor(f * (path.length - 1)));
        const ff = f * (path.length - 1) - i;
        const q = P(lerp(path[i][0], path[i + 1][0], ff), lerp(path[i][1], path[i + 1][1], ff));
        g.moveTo(q.x - 7, q.y + ((k + v) % 3) - 1).quadraticCurveTo(q.x, q.y - 4, q.x + 7, q.y + ((k * 2 + v) % 3) - 1).stroke({ width: 1.8, color: pal.glowHot, alpha: 0.9, cap: 'round' });
      }
      c.gFx.addChild(g);
    });
    frames(c, caus, 3);
    // lily pads + glowing reeds on the banks
    for (let k = 0; k < 3 + stage; k++) {
      const i = Math.floor(c.r() * (path.length - 1));
      const q = P(lerp(path[i][0], path[i + 1][0], c.r()), lerp(path[i][1], path[i + 1][1], c.r()));
      c.gnd.ellipse(q.x + (c.r() - 0.5) * 12, q.y, 8, 3.5).fill(pal.leaf2).stroke(HAIR);
    }
    c.amb.add('bubble', pal.glow, 2 + stage * 2, () => {
      const i = Math.floor(c.r() * (path.length - 1));
      return P(lerp(path[i][0], path[i + 1][0], c.r()), lerp(path[i][1], path[i + 1][1], c.r()));
    }, { h: 40, amp: 3, sp: 0.4 });
  } else {
    const p = P(N * 0.62, N * 0.62);
    groundEllipse(c.gnd, N * 0.62, N * 0.62, 0.55).fill(0x1f8aa8).stroke(INK);
    groundEllipse(c.gnd, N * 0.6, N * 0.6, 0.38).fill({ color: pal.glow, alpha: 0.5 });
    const g = new Graphics().ellipse(p.x - 6, p.y - 2, 10, 3).stroke({ width: 1.6, color: pal.glowHot });
    c.gFx.addChild(g);
    c.amb.glow(g, 0.8);
    c.gnd.ellipse(p.x + 18, p.y + 4, 7, 3).fill(pal.leaf2).stroke(HAIR);
    c.amb.add('bubble', pal.glow, 2, () => ({ x: p.x + (c.r() - 0.5) * 30, y: p.y }), { h: 30, amp: 3, sp: 0.4 });
  }
  // backdrop: mossy rocks + jungle leaves; T7+ a cave arch with lianas and a waterfall
  const jungle = (p: Pt, k: number) => {
    rock(c.bk, p.x, p.y, 46 * s, 34 * s, pal.rock, pal.rockLit);
    c.bk.ellipse(p.x - 6, p.y - 30 * s, 16 * s, 5 * s).fill(pal.leaf2);
    fern(c.bk, p.x + 18 * s, p.y, 1.1 * s, pal.leaf, pal.leaf2);
    if (k) fern(c.bk, p.x - 22 * s, p.y + 2, 0.9 * s, pal.leaf2);
  };
  jungle(BL(c, 0.66), 1);
  jungle(BR(c, 0.82), 0);
  if (stage >= 1) {
    // glowing bioluminescent plants
    for (const p of [BL(c, 0.4), BR(c, 0.55)]) {
      c.bk.moveTo(p.x, p.y).quadraticCurveTo(p.x - 4, p.y - 24, p.x + 2, p.y - 40 * s).stroke({ width: 3, color: pal.leaf });
      const bulb = new Graphics().circle(p.x + 2, p.y - 42 * s, 6).fill(pal.bloom2).stroke(HAIR);
      c.bFx.addChild(bulb);
      c.amb.glow(glowSprite(c.bFx, p.x + 2, p.y - 42 * s, pal.bloom2, 0.4, 0.35));
    }
  }
  if (stage >= 2) {
    const a = BR(c, 0.3, 0.3);
    const b = BR(c, 0.66, 0.3);
    const H = 160 * s;
    for (const p of [a, b]) {
      pillar(c.bk, p.x, p.y, 52, H, pal.rock, pal.rockDark, pal.rockLit);
      c.bk.ellipse(p.x - 6, p.y - H * 0.4, 18, 7).fill({ color: pal.leaf2, alpha: 0.85 });
      c.bk.ellipse(p.x + 4, p.y - H * 0.75, 14, 5).fill({ color: pal.leaf, alpha: 0.85 });
    }
    c.bk.moveTo(a.x - 40, a.y - H + 4).quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - H - 60, b.x + 40, b.y - H + 4).lineTo(b.x + 34, b.y - H + 34).quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - H - 20, a.x - 34, a.y - H + 34).closePath().fill(pal.rockLit).stroke(INK);
    // lianas hanging from the arch
    for (let k = 0; k < 7; k++) {
      const f = 0.1 + k * 0.13;
      const x = lerp(a.x - 30, b.x + 30, f);
      const y = lerp(a.y, b.y, f) - H - 30 * Math.sin(f * Math.PI) + 14;
      const len = 50 + ((k * 31) % 50);
      c.bk.moveTo(x, y).quadraticCurveTo(x + 6, y + len * 0.5, x - 2, y + len).stroke({ width: 2.5, color: pal.leaf });
      for (let j = 1; j < 4; j++) c.bk.ellipse(x + (j % 2 ? 3 : -3), y + (len * j) / 4, 4, 2.2).fill(pal.leaf2);
    }
    // the waterfall (3 frames) into a glowing pool
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    c.bk.ellipse(m.x, m.y + 2, 46, 14).fill(0x1f8aa8).stroke(INK);
    const wf: Graphics[] = [];
    for (let v = 0; v < 3; v++) {
      const g = new Graphics();
      g.rect(m.x - 22, m.y - H - 6, 44, H + 8).fill({ color: pal.glow, alpha: 0.55 });
      for (let k = 0; k < 6; k++) {
        const x = m.x - 18 + k * 7;
        const y0 = m.y - H + ((k * 23 + v * 19) % 40);
        g.moveTo(x, y0).lineTo(x, y0 + 30).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
      }
      g.ellipse(m.x, m.y + 2, 30 + v * 4, 8).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
      c.bFx.addChild(g);
      wf.push(g);
    }
    frames(c, wf, 6);
    c.amb.glow(glowSprite(c.bFx, m.x, m.y - H * 0.4, pal.glow, 0.35, 1.2 * s, true));
    c.amb.add('firefly', pal.glow, 4, () => ({ x: lerp(a.x, b.x, c.r()), y: m.y - c.r() * H }), { amp: 10, sp: 0.12, h: 30 });
  }
  if (stage >= 3) {
    // a giant glowing tree of the deep behind the back corner
    const p = BR(c, 0.06, 0.6);
    tree(c.crown, p.x, p.y, 260, pal.rockDark, pal.leaf, pal.leaf2, c.r);
    for (let k = 0; k < 7; k++) {
      const q = { x: p.x + (c.r() - 0.5) * 150, y: p.y - 150 - c.r() * 90 };
      const b = new Graphics().circle(q.x, q.y, 5).fill(k % 2 ? pal.glow : pal.bloom2).stroke(HAIR);
      c.cFx.addChild(b);
      c.amb.glow(b, 1);
    }
    c.amb.glow(glowSprite(c.cFx, p.x, p.y - 190, pal.glow, 0.3, 1.8, true));
  }
  // front: ferns + glowing blue flowers
  for (let i = 0; i < 1 + stage; i++) {
    const p = i % 2 ? FR(c, 0.3 + c.r() * 0.4) : FL(c, 0.6 + c.r() * 0.3);
    fern(c.fr, p.x, p.y, 0.55 + stage * 0.08, i % 2 ? pal.leaf : pal.leaf2);
    flower(c.fr, p.x + 12, p.y - 6, 0.9, pal.bloom, 0xffffff);
  }
}

// =========================================================================================== NATURE
function nature(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  speckle(c, 8 + N * 3, pal.soil2, 0.8, 20, 8);
  for (let i = 0; i < 8 + N * 3 + stage * 4; i++) {
    const p = inYard(c, 0.25)();
    tuft(c.gnd, p.x, p.y, 1, c.r() < 0.5 ? pal.leaf : shade(pal.leaf2, 0.9));
  }
  // flower patches
  for (let i = 0; i < 2 + stage * 2; i++) {
    const p = inYard(c, 0.5)();
    const col = [pal.bloom, pal.bloom2, 0xffffff][i % 3];
    for (let k = 0; k < 5; k++) flower(c.gnd, p.x + (c.r() - 0.5) * 30, p.y + (c.r() - 0.5) * 12, 0.8, col);
  }
  // roots crossing the yard (T4+) from the big tree
  const treeAt = BL(c, 0.55, 0.35);
  if (stage >= 1) {
    for (let k = 0; k < 2 + stage; k++) {
      const end = P(-0.5 + N * (0.25 + c.r() * 0.4), -0.5 + N * (0.35 + c.r() * 0.5));
      c.gnd.moveTo(treeAt.x, treeAt.y).quadraticCurveTo((treeAt.x + end.x) / 2 + 20, (treeAt.y + end.y) / 2 - 10, end.x, end.y).stroke({ width: 9, color: C.ink, cap: 'round' });
      c.gnd.moveTo(treeAt.x, treeAt.y).quadraticCurveTo((treeAt.x + end.x) / 2 + 20, (treeAt.y + end.y) / 2 - 10, end.x, end.y).stroke({ width: 5, color: 0x8a5a2e, cap: 'round' });
    }
    // mushroom ring
    const m = P(N * 0.7, N * 0.35);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const x = m.x + Math.cos(a) * 26;
      const y = m.y + Math.sin(a) * 11;
      c.gnd.rect(x - 1.5, y - 6, 3, 6).fill(0xfff1d6);
      c.gnd.ellipse(x, y - 6, 5, 3).fill(k % 2 ? 0xc8102e : 0xff9a3a).stroke(HAIR);
    }
  }
  // backdrop: bushes → a tree → two big trees → the world tree
  const bush = (p: Pt, w: number) => {
    for (const [dx, dy, r] of [
      [-w * 0.3, -w * 0.2, w * 0.32],
      [w * 0.3, -w * 0.22, w * 0.3],
      [0, -w * 0.4, w * 0.36],
    ]) c.bk.circle(p.x + dx, p.y + dy, r).fill(pal.leaf).stroke(THIN);
    c.bk.circle(p.x - w * 0.08, p.y - w * 0.5, w * 0.14).fill(pal.leaf2);
    for (let k = 0; k < 4; k++) c.bk.circle(p.x + (c.r() - 0.5) * w * 0.8, p.y - w * (0.2 + c.r() * 0.4), 3).fill(k % 2 ? pal.bloom : pal.bloom2);
  };
  bush(BR(c, 0.78), 46 * s);
  if (stage === 0) bush(BL(c, 0.7), 40);
  else tree(c.bk, treeAt.x, treeAt.y, 150 * s, 0x7a4a2a, pal.leaf, pal.leaf2, c.r);
  if (stage >= 2) {
    const p = BR(c, 0.45, 0.3);
    tree(c.bk, p.x, p.y, 170 * s, 0x7a4a2a, shade(pal.leaf, 1.08), pal.leaf2, c.r);
    // flower garland between the trees
    const a = { x: treeAt.x + 20, y: treeAt.y - 110 * s };
    const b = { x: p.x - 20, y: p.y - 120 * s };
    c.crown.moveTo(a.x, a.y).quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + 40, b.x, b.y).stroke({ width: 2, color: C.ink });
    for (let k = 1; k < 10; k++) {
      const f = k / 10;
      const x = lerp(a.x, b.x, f);
      const y = lerp(a.y, b.y, f) + Math.sin(f * Math.PI) * 30;
      c.crown.circle(x, y + 3, 4).fill([pal.bloom, pal.bloom2, 0xffffff][k % 3]).stroke(HAIR);
    }
  }
  if (stage >= 3) {
    // the world tree behind the house: huge canopy, glowing fruits
    const p = BR(c, 0.04, 0.9);
    tree(c.crown, p.x, p.y, 360, 0x6a3f22, pal.leaf, pal.leaf2, c.r);
    for (let k = 0; k < 9; k++) {
      const q = { x: p.x + (c.r() - 0.5) * 200, y: p.y - 220 - c.r() * 120 };
      const f = new Graphics().circle(q.x, q.y, 6).fill(pal.bloom2).stroke(HAIR);
      c.cFx.addChild(f);
      c.amb.glow(glowSprite(c.cFx, q.x, q.y, pal.glow, 0.35, 0.3));
    }
  }
  // front: flower bushes + tufts
  for (let i = 0; i < 2 + stage; i++) {
    const p = i % 2 ? FR(c, 0.3 + c.r() * 0.5) : FL(c, 0.55 + c.r() * 0.35);
    for (let k = 0; k < 4; k++) flower(c.fr, p.x + (c.r() - 0.5) * 24, p.y - c.r() * 8, 0.95, [pal.bloom, pal.bloom2, 0xffffff][k % 3]);
    tuft(c.fr, p.x + 10, p.y + 2, 1.2, pal.leaf);
  }
  c.amb.add('petal', pal.bloom, 2 + stage * 2, inYard(c, 0.2), { h: 120, amp: 14, sp: 0.12 });
  if (stage >= 1) c.amb.add('leaf', pal.leaf2, 1 + stage, () => ({ x: treeAt.x + (c.r() - 0.2) * 120, y: treeAt.y + 40 }), { h: 150, amp: 18, sp: 0.1 });
  if (stage >= 2) c.amb.add('firefly', pal.glow, 3, inYard(c), { amp: 12, sp: 0.1, h: 60 });
}

// =========================================================================================== EARTH
function earth(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  // sandstone flagstones + pebbles + cracks
  for (let gy = 0; gy < N; gy++)
    for (let gx = 0; gx < N; gx++) {
      if (c.r() < 0.35) continue;
      const p = P(gx + (c.r() - 0.5) * 0.2, gy + (c.r() - 0.5) * 0.2);
      const w = 26 + c.r() * 10;
      c.gnd.poly([p.x - w, p.y, p.x - 4, p.y - w * 0.45, p.x + w, p.y - 2, p.x + 2, p.y + w * 0.45]).fill(c.r() < 0.5 ? pal.soil2 : shade(pal.soil, 0.94)).stroke({ width: 1.5, color: C.ink, alpha: 0.45 });
    }
  for (let i = 0; i < 6 + N * 2; i++) {
    const p = inYard(c, 0.3)();
    c.gnd.ellipse(p.x, p.y, 4 + c.r() * 4, 2 + c.r() * 2).fill(pal.rockLit).stroke({ width: 1, color: C.ink, alpha: 0.5 });
  }
  if (stage >= 1) {
    // golden mineral veins + amethyst points poking out
    const veins = new Graphics();
    for (let i = 0; i < 2 + stage * 2; i++) {
      const a = inYard(c, 0.3)();
      veins.moveTo(a.x, a.y).lineTo(a.x + 20 + c.r() * 20, a.y + (c.r() - 0.5) * 16).lineTo(a.x + 44, a.y + (c.r() - 0.5) * 22).stroke({ width: 2.4, color: pal.glow, cap: 'round' });
    }
    c.gFx.addChild(veins);
    c.amb.glow(veins, 0.9);
    for (let i = 0; i < 2 + stage; i++) {
      const p = inYard(c, 0.7)();
      crystal(c.gnd, p.x, p.y, 16, 4, pal.bloom, (c.r() - 0.5) * 6);
    }
  }
  // backdrop: rock stacks (strata) → natural bridge + geode → hoodoos + a giant geode
  const strata = (p: Pt, w: number, h: number) => {
    const bands = 4;
    for (let k = 0; k < bands; k++) {
      const y0 = p.y - (h / bands) * k;
      const ww = w * (1 - k * 0.12);
      c.bk.poly([p.x - ww / 2, y0, p.x - ww / 2 + 4, y0 - h / bands, p.x + ww / 2 - 6, y0 - h / bands, p.x + ww / 2, y0]).fill([pal.rock, pal.rockLit, shade(pal.rock, 0.88), pal.soil2][k]).stroke(THIN);
    }
    c.bk.poly([p.x + w * 0.1, p.y, p.x + w * 0.1, p.y - h, p.x + w * 0.3, p.y - h, p.x + w / 2, p.y]).fill({ color: pal.rockDark, alpha: 0.4 });
  };
  if (stage === 0) {
    rock(c.bk, BR(c, 0.75).x, BR(c, 0.75).y, 40, 28, pal.rock, pal.rockLit);
    crystals(c.bk, BL(c, 0.7).x, BL(c, 0.7).y, 0.7, pal.bloom, c.r);
  } else {
    strata(BL(c, 0.62), 70 * s, 100 * s);
    strata(BR(c, 0.85), 54 * s, 74 * s);
    crystals(c.bk, BR(c, 0.6).x, BR(c, 0.6).y, 0.9 * s, pal.bloom, c.r);
    c.amb.glow(glowSprite(c.bFx, BR(c, 0.6).x, BR(c, 0.6).y - 20, pal.bloom, 0.3, 0.5));
  }
  if (stage >= 2) {
    // geode: a split boulder full of amethyst behind the back-right edge
    const g = BR(c, 0.36, 0.4);
    c.bk.ellipse(g.x, g.y - 40 * s, 62 * s, 52 * s).fill(pal.rock).stroke(INK);
    c.bk.ellipse(g.x + 4, g.y - 40 * s, 44 * s, 36 * s).fill(0x3d2a5a).stroke(THIN);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      crystal(c.bk, g.x + 4 + Math.cos(a) * 24 * s, g.y - 40 * s + Math.sin(a) * 18 * s + 12, 20 * s, 5 * s, k % 2 ? pal.bloom : shade(pal.bloom, 1.2), Math.cos(a) * 6);
    }
    c.amb.glow(glowSprite(c.bFx, g.x + 4, g.y - 40 * s, pal.bloom, 0.45, 0.9 * s, true));
    c.amb.add('twinkle', 0xffffff, 3, () => ({ x: g.x + (c.r() - 0.5) * 60 * s, y: g.y - 40 * s + (c.r() - 0.5) * 40 * s }), { sp: 0.15 });
  }
  if (stage >= 3) {
    // hoodoos rising behind the house
    const p = BR(c, 0.06, 0.9);
    for (const [dx, h, w] of [
      [-90, 220, 46],
      [0, 300, 60],
      [96, 240, 50],
    ]) {
      strata({ x: p.x + dx, y: p.y }, w, h);
      capRock(c.crown, p.x + dx, p.y - h * 0.82, w * 1.4, h * 0.3, pal.rockLit, pal.rock, pal.soil2);
    }
    crystals(c.crown, p.x, p.y - 300 - 30, 1.6, pal.bloom2, c.r);
    c.amb.glow(glowSprite(c.cFx, p.x, p.y - 340, pal.bloom2, 0.4, 1, true));
  }
  // front: small crystals + rocks
  for (let i = 0; i < 1 + stage; i++) {
    const p = i % 2 ? FR(c, 0.3 + c.r() * 0.5) : FL(c, 0.6 + c.r() * 0.3);
    rock(c.fr, p.x, p.y, 22, 14, pal.rock, pal.rockLit);
    crystal(c.fr, p.x + 14, p.y + 2, 18, 4, i % 2 ? pal.bloom : pal.bloom2, 3);
  }
  c.amb.add('mote', pal.glowHot, 2 + c.tier, inYard(c), { amp: 10, sp: 0.08, h: 80 });
}

// =========================================================================================== STORM
function storm(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  // dark slate tiles (checker) + puddles
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) diamond(c.gnd, gx + 0.08, gy + 0.08, 0.84, 0.84).fill({ color: (gx + gy) % 2 ? pal.soil2 : shade(pal.soil, 0.92), alpha: 0.9 }).stroke({ width: 1.2, color: C.ink, alpha: 0.35 });
  for (let i = 0; i < 2 + stage; i++) {
    const p = inYard(c, 0.6)();
    c.gnd.ellipse(p.x, p.y, 20, 7).fill({ color: 0x9fb2d8, alpha: 0.55 });
    c.gnd.ellipse(p.x - 5, p.y - 1, 7, 2).fill({ color: 0xffffff, alpha: 0.6 });
  }
  // energy veins that flicker like a bad cable
  const veins = new Graphics();
  for (let i = 0; i < 2 + c.tier; i++) {
    const a = inYard(c, 0.3)();
    let x = a.x;
    let y = a.y;
    const pts = [x, y];
    for (let k = 0; k < 4; k++) {
      x += k % 2 ? 22 : 0;
      y += k % 2 ? 11 : -11 + (c.r() < 0.5 ? 22 : 0);
      pts.push(x, y);
    }
    veins.poly(pts, false).stroke({ width: 4, color: C.ink, alpha: 0.6, cap: 'round' });
    veins.poly(pts, false).stroke({ width: 2.2, color: pal.glow, cap: 'round' });
    veins.circle(x, y, 3).fill(pal.glowHot);
  }
  c.gFx.addChild(veins);
  flick(c, veins, 0.8, 0.25, 9);
  // coils
  const coil = (p: Pt, h: number) => {
    c.bk.ellipse(p.x, p.y, 16, 6).fill(pal.rockDark).stroke(THIN);
    c.bk.rect(p.x - 6, p.y - h, 12, h).fill(pal.rockLit).stroke(THIN);
    for (let y = p.y - h + 6; y < p.y - 4; y += 7) c.bk.moveTo(p.x - 9, y).lineTo(p.x + 9, y + 3).stroke({ width: 3, color: 0xb87333 });
    c.bk.circle(p.x, p.y - h - 8, 11).fill(0xd9d9d9).stroke(THIN);
    c.bk.circle(p.x - 3, p.y - h - 11, 3.5).fill(0xffffff);
    c.amb.glow(glowSprite(c.bFx, p.x, p.y - h - 8, pal.glow, 0.4, 0.45 * s, true));
    return { x: p.x, y: p.y - h - 8 };
  };
  const tL = coil(BL(c, 0.66), 70 * s);
  if (stage === 0) {
    crystals(c.bk, BR(c, 0.78).x, BR(c, 0.78).y, 0.7, pal.glow, c.r);
  } else {
    const tR = coil(BR(c, 0.8), 80 * s);
    crystals(c.bk, BR(c, 0.5).x, BR(c, 0.5).y, 1, pal.glow, c.r);
    c.amb.glow(glowSprite(c.bFx, BR(c, 0.5).x, BR(c, 0.5).y - 20, pal.glow, 0.35, 0.5));
    if (stage >= 2) {
      // an arc jumps between the two coils (3 frames, visible half the time)
      const arcs: Graphics[] = [];
      for (let v = 0; v < 4; v++) {
        const g = new Graphics();
        if (v < 3) bolt(g, tL, tR, v, pal.glow, 3);
        c.cFx.addChild(g);
        arcs.push(g);
      }
      frames(c, arcs, 7);
    }
  }
  // the storm cloud above the house (T4+): T10 strikes the lightning rod on the house
  if (stage >= 1) {
    const h = c.house;
    const cy = c.roofY - 50 - stage * 20;
    const cloud = new Container();
    const cg = new Graphics();
    const W = 70 + stage * 26;
    for (let k = 0; k < 6; k++) cg.circle(h.x - W / 2 + (k * W) / 5, cy + (k % 2 ? -10 : 0), 22 + stage * 4 + (k % 3) * 4).fill(0x4a5470).stroke(THIN);
    cg.rect(h.x - W / 2, cy - 4, W, 20).fill(0x4a5470);
    cg.moveTo(h.x - W / 2, cy + 16).lineTo(h.x + W / 2, cy + 16).stroke(THIN);
    cloud.addChild(cg);
    c.cFx.addChild(cloud);
    c.ticks.push((t) => (cloud.x = Math.sin(stepped(t) * 0.5) * 6));
    const strikes: Graphics[] = [];
    for (let v = 0; v < 6; v++) {
      const g = new Graphics();
      if (v < 2) bolt(g, { x: h.x - 20 + v * 40, y: cy + 16 }, { x: h.x - 10 + v * 20, y: c.roofY + 20 }, v, pal.bloom, 3 + stage);
      cloud.addChild(g);
      strikes.push(g);
    }
    frames(c, strikes, 5);
    c.amb.glow(glowSprite(c.cFx, h.x, cy, pal.glow, 0.25, 1.2, true));
  }
  if (stage >= 3) {
    // a floating energy core over the back corner
    const p = BR(c, 0.05, 0.9);
    const core = new Container();
    core.position.set(p.x, p.y - 260);
    const g = new Graphics();
    g.poly([0, -60, 34, 0, 0, 60, -34, 0]).fill(pal.glow).stroke(INK);
    g.poly([0, -60, 34, 0, 0, 0]).fill(pal.glowHot);
    g.poly([0, 60, -34, 0, 0, 0]).fill(shade(pal.glow, 0.7));
    g.ellipse(0, 0, 70, 18).stroke({ width: 6, color: C.ink }).ellipse(0, 0, 70, 18).stroke({ width: 3, color: pal.bloom });
    core.addChild(g);
    c.cFx.addChild(core);
    c.amb.glow(glowSprite(c.cFx, p.x, p.y - 260, pal.glow, 0.5, 1.6, true));
    c.ticks.push((t) => (core.y = p.y - 260 + Math.sin(stepped(t) * 1.4) * 8));
  }
  for (let i = 0; i < 1 + stage; i++) {
    const p = i % 2 ? FR(c, 0.3 + c.r() * 0.5) : FL(c, 0.6 + c.r() * 0.3);
    crystal(c.fr, p.x, p.y, 20, 5, pal.glow, (c.r() - 0.5) * 8);
  }
  c.amb.add('spark', pal.glow, 2 + c.tier, inYard(c, 0.3), { amp: 6 });
  if (stage >= 1) c.amb.add('spark', pal.bloom, 2 + stage, () => ({ x: tL.x + (c.r() - 0.5) * 20, y: tL.y + (c.r() - 0.5) * 20 }), { amp: 10 });
}

// =========================================================================================== MAGIC
function magic(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  speckle(c, 8 + N * 2, pal.soil2, 0.8, 22, 9);
  // violet flower carpets (concept)
  for (let i = 0; i < 3 + stage * 2; i++) {
    const p = inYard(c, 0.3)();
    for (let k = 0; k < 6; k++) flower(c.gnd, p.x + (c.r() - 0.5) * 34, p.y + (c.r() - 0.5) * 12, 0.9, k % 3 ? pal.bloom : pal.bloom2, 0xffe6a0);
  }
  // the turquoise pool with a stone rim (T4+), rune circle (T7+)
  const cx = N * 0.55;
  const cy = N * 0.55;
  const pc = P(cx, cy);
  const R = stage >= 1 ? 0.55 + stage * 0.12 : 0;
  if (stage >= 1) {
    groundEllipse(c.gnd, cx, cy, R + 0.12).fill(pal.rock).stroke(INK);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const q = { x: pc.x + Math.cos(a) * (R + 0.08) * 90, y: pc.y + Math.sin(a) * (R + 0.08) * 45 };
      c.gnd.ellipse(q.x, q.y, 10, 5).fill(k % 2 ? pal.rockLit : pal.rock).stroke(HAIR);
    }
    groundEllipse(c.gnd, cx, cy, R).fill(0x1f9a8a).stroke(THIN);
    const shine = new Graphics();
    groundEllipse(shine, cx - 0.05, cy - 0.05, R * 0.75).fill({ color: pal.glow, alpha: 0.55 });
    c.gFx.addChild(shine);
    c.amb.glow(shine, 0.7);
    for (let k = 0; k < 3 + stage; k++) {
      const a = c.r() * 6.28;
      const q = { x: pc.x + Math.cos(a) * R * 50, y: pc.y + Math.sin(a) * R * 24 };
      c.gnd.ellipse(q.x, q.y, 7, 3.2).fill(0x3a8a5a).stroke(HAIR);
      c.gnd.circle(q.x + 2, q.y - 2, 2.4).fill(pal.bloom2);
    }
  }
  if (stage >= 2) {
    const ring = new Graphics();
    groundEllipse(ring, cx, cy, R + 0.5).stroke({ width: 3, color: pal.glow });
    groundEllipse(ring, cx, cy, R + 0.38).stroke({ width: 1.5, color: pal.glow, alpha: 0.7 });
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const q = { x: pc.x + Math.cos(a) * (R + 0.44) * 90, y: pc.y + Math.sin(a) * (R + 0.44) * 45 };
      ring.poly([q.x, q.y - 4, q.x + 4, q.y + 2, q.x - 4, q.y + 2]).stroke({ width: 1.5, color: pal.glow });
    }
    c.gFx.addChild(ring);
    flick(c, ring, 0.75, 0.25, 2);
  }
  // standing stones along the back (and the front at T7+: a full circle)
  const stones = stage === 0 ? 2 : 3 + stage;
  for (let k = 0; k < stones; k++) {
    const left = k % 2 === 0;
    const u = 0.3 + (Math.floor(k / 2) / Math.max(1, Math.ceil(stones / 2))) * 0.65;
    const p = left ? BL(c, u) : BR(c, u);
    const h = (60 + ((k * 13) % 24)) * s;
    standingStone(c.bk, p.x, p.y, h * 0.5, h, pal.rock, pal.glow);
    c.amb.glow(glowSprite(c.bFx, p.x - h * 0.03, p.y - h * 0.52, pal.glow, 0.3, 0.3));
  }
  if (stage >= 2) {
    for (const u of [0.3, 0.75]) {
      const p = FR(c, u, 0.15);
      standingStone(c.fr, p.x, p.y, 20, 38, pal.rock, pal.glow);
      const q = FL(c, u + 0.05, 0.15);
      standingStone(c.fr, q.x, q.y, 20, 36, pal.rock, pal.glow);
    }
  }
  // candles around (animated flames)
  const cand = stage === 0 ? 2 : 4 + stage * 2;
  for (let k = 0; k < cand; k++) {
    const a = (k / cand) * Math.PI * 2 + 0.3;
    const rr = stage >= 1 ? R + 0.3 : 0.6;
    const q = { x: pc.x + Math.cos(a) * rr * 90, y: pc.y + Math.sin(a) * rr * 45 };
    candle(c.gnd, q.x, q.y, 1);
    flame(c, c.gFx, { x: q.x, y: q.y - 12 }, 1);
  }
  // mushrooms (orange, concept)
  for (let k = 0; k < 2 + stage; k++) {
    const p = k % 2 ? BL(c, 0.2 + c.r() * 0.6, -0.15) : BR(c, 0.3 + c.r() * 0.6, -0.15);
    c.bk.rect(p.x - 2, p.y - 8, 4, 8).fill(0xfff1d6).stroke(HAIR);
    c.bk.ellipse(p.x, p.y - 9, 8, 5).fill(0xff9a3a).stroke(HAIR);
  }
  if (stage >= 3) {
    // a dolmen portal behind the house, its doorway full of starlight
    const p = BR(c, 0.06, 0.8);
    const H = 230;
    standingStone(c.crown, p.x - 70, p.y, 60, H, pal.rock, pal.glow);
    standingStone(c.crown, p.x + 70, p.y, 60, H * 0.96, pal.rock, pal.glow);
    c.crown.poly([p.x - 120, p.y - H + 10, p.x + 120, p.y - H + 14, p.x + 110, p.y - H - 22, p.x - 110, p.y - H - 26]).fill(pal.rockLit).stroke(INK);
    const door = new Graphics().ellipse(p.x, p.y - H * 0.5, 40, H * 0.42).fill({ color: pal.bloom, alpha: 0.5 }).stroke({ width: 3, color: pal.glow });
    c.cFx.addChild(door);
    c.amb.glow(door, 0.6);
    c.amb.glow(glowSprite(c.cFx, p.x, p.y - H * 0.5, pal.bloom, 0.5, 1.4, true));
    c.amb.add('rune', pal.glow, 5, () => ({ x: p.x + (c.r() - 0.5) * 60, y: p.y - H * 0.2 }), { h: H, amp: 10, sp: 0.15 });
  }
  c.amb.add('firefly', 0xd8ff7a, 3 + c.tier, inYard(c, 0.2), { amp: 14, sp: 0.1, h: 70 });
  if (stage >= 1) c.amb.add('rune', pal.glow, 2 + stage, () => ({ x: pc.x + (c.r() - 0.5) * 40, y: pc.y }), { h: 110, amp: 8, sp: 0.15 });
}

// =========================================================================================== COSMIC
function cosmic(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  // deep-space floor: nebula smudges, star specks, constellations
  speckle(c, 5 + N, pal.soil2, 0.9, 30, 12);
  if (stage >= 1)
    for (let i = 0; i < 2 + stage; i++) {
      const p = inYard(c, 0.6)();
      c.gnd.ellipse(p.x, p.y, 46, 18).fill({ color: i % 2 ? pal.leaf : pal.leaf2, alpha: 0.22 });
      c.gnd.ellipse(p.x + 10, p.y - 2, 24, 8).fill({ color: pal.glow, alpha: 0.15 });
    }
  for (let i = 0; i < 18 + N * 6; i++) {
    const p = inYard(c, 0.15)();
    if (c.r() < 0.2) c.gnd.star(p.x, p.y, 4, 3.2, 1).fill(0xffffff);
    else c.gnd.circle(p.x, p.y, 0.8 + c.r()).fill({ color: 0xffffff, alpha: 0.8 });
  }
  const cons = new Graphics();
  for (let k = 0; k < 1 + stage; k++) {
    const pts: number[] = [];
    let p = inYard(c, 0.6)();
    for (let j = 0; j < 4; j++) {
      pts.push(p.x, p.y);
      cons.circle(p.x, p.y, 2.6).fill(pal.glowHot);
      p = { x: p.x + (c.r() - 0.4) * 50, y: p.y + (c.r() - 0.5) * 24 };
    }
    cons.poly(pts, false).stroke({ width: 1.2, color: pal.glow, alpha: 0.8 });
  }
  c.gFx.addChild(cons);
  flick(c, cons, 0.8, 0.2, 2);
  if (stage >= 2) {
    const ring = new Graphics();
    const ctr = P(N * 0.55, N * 0.55);
    for (const r of [0.9, 1.3]) ring.ellipse(ctr.x, ctr.y, r * 90, r * 45).stroke({ width: 1.5, color: pal.glow, alpha: 0.5 });
    c.gFx.addChild(ring);
  }
  // orb lamps on stalks
  const orb = (p: Pt, h: number, col: number) => {
    c.bk.moveTo(p.x, p.y).lineTo(p.x, p.y - h).stroke({ width: 4, color: C.ink });
    c.bk.moveTo(p.x, p.y).lineTo(p.x, p.y - h).stroke({ width: 2, color: pal.rockLit });
    c.bk.circle(p.x, p.y - h - 9, 10).fill(col).stroke(THIN);
    c.bk.circle(p.x - 3, p.y - h - 12, 3).fill({ color: 0xffffff, alpha: 0.7 });
    c.amb.glow(glowSprite(c.bFx, p.x, p.y - h - 9, col, 0.4, 0.35));
  };
  orb(BL(c, 0.7), 40 * s, pal.glow);
  orb(BR(c, 0.85), 34 * s, pal.leaf2);
  if (stage >= 1) {
    // crystal obelisk with a star on top
    const p = BL(c, 0.42, 0.3);
    c.bk.poly([p.x - 14, p.y, p.x - 9, p.y - 110 * s, p.x, p.y - 128 * s, p.x + 9, p.y - 110 * s, p.x + 14, p.y]).fill(pal.rock).stroke(INK);
    c.bk.poly([p.x, p.y, p.x, p.y - 128 * s, p.x + 9, p.y - 110 * s, p.x + 14, p.y]).fill(pal.rockDark);
    for (let k = 0; k < 3; k++) c.bk.star(p.x - 3, p.y - (30 + k * 26) * s, 4, 4, 1.6).fill(pal.glow);
    const st = new Graphics().star(p.x, p.y - 142 * s, 5, 11, 5).fill(pal.bloom2).stroke(THIN);
    c.bFx.addChild(st);
    c.amb.glow(glowSprite(c.bFx, p.x, p.y - 142 * s, pal.bloom2, 0.5, 0.6));
  }
  if (stage >= 2) {
    // an orrery: planets orbiting a little sun on the back-right edge
    const p = BR(c, 0.55, 0.35);
    const top = p.y - 120 * s;
    c.bk.moveTo(p.x, p.y).lineTo(p.x, top).stroke({ width: 6, color: C.ink }).moveTo(p.x, p.y).lineTo(p.x, top).stroke({ width: 3, color: 0xc9a04a });
    c.bk.ellipse(p.x, p.y, 22, 8).fill(0xc9a04a).stroke(THIN);
    const orr = new Container();
    orr.position.set(p.x, top);
    const sun = new Graphics().circle(0, 0, 14).fill(pal.bloom2).stroke(THIN);
    const ringG = new Graphics().ellipse(0, 0, 60, 18).stroke({ width: 1.5, color: pal.glow, alpha: 0.8 }).ellipse(0, 0, 38, 11).stroke({ width: 1.5, color: pal.leaf2, alpha: 0.8 });
    const p1 = new Graphics().circle(0, 0, 7).fill(pal.leaf).stroke(HAIR);
    const p2 = new Graphics().circle(0, 0, 5).fill(pal.glow).stroke(HAIR);
    orr.addChild(ringG, sun, p1, p2);
    c.bFx.addChild(orr);
    c.amb.glow(glowSprite(c.bFx, p.x, top, pal.bloom2, 0.5, 0.6));
    c.ticks.push((t) => {
      const a = stepped(t) * 0.8;
      p1.position.set(Math.cos(a) * 60, Math.sin(a) * 18);
      p2.position.set(Math.cos(-a * 1.6 + 2) * 38, Math.sin(-a * 1.6 + 2) * 11);
    });
  }
  if (stage >= 3) {
    // a giant ringed planet + a crescent moon hanging over the back corner
    const p = BR(c, 0.05, 1);
    const pl = new Container();
    pl.position.set(p.x, p.y - 290);
    const g = new Graphics();
    g.ellipse(0, 0, 150, 34).stroke({ width: 12, color: C.ink }).ellipse(0, 0, 150, 34).stroke({ width: 7, color: pal.glow });
    g.circle(0, 0, 70).fill(pal.leaf).stroke(INK);
    g.ellipse(-10, -24, 54, 14).fill({ color: pal.leaf2, alpha: 0.6 });
    g.ellipse(6, 12, 60, 10).fill({ color: pal.rockDark, alpha: 0.4 });
    g.circle(-26, -30, 14).fill({ color: 0xffffff, alpha: 0.35 });
    const fr = new Graphics().arc(0, 0, 150, 0.12, Math.PI - 0.12).stroke({ width: 12, color: C.ink }).arc(0, 0, 150, 0.12, Math.PI - 0.12).stroke({ width: 7, color: pal.glow });
    fr.scale.y = 34 / 150;
    pl.addChild(g, fr);
    c.cFx.addChild(pl);
    const moon = new Graphics().circle(150, -120, 26).fill(0xfff3c4).stroke(THIN).circle(162, -128, 22).fill(pal.soil);
    pl.addChild(moon);
    c.amb.glow(glowSprite(c.cFx, p.x, p.y - 290, pal.leaf, 0.4, 2.2, true));
    c.ticks.push((t) => (pl.y = p.y - 290 + Math.sin(stepped(t) * 0.7) * 6));
  }
  c.amb.add('twinkle', 0xffffff, 4 + c.tier, inYard(c, 0), { sp: 0.12 });
  if (stage >= 1) c.amb.add('twinkle', pal.glow, 2 + stage * 2, () => ({ x: c.house.x + (c.r() - 0.5) * 260, y: c.roofY - c.r() * 120 }), { sp: 0.1 });
}

// =========================================================================================== VOID
function voidB(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  speckle(c, 6 + N * 2, pal.soil2, 0.9, 24, 10);
  // "missing texture" patches (magenta / black checker)
  for (let i = 0; i < stage + 1; i++) {
    const gx = Math.floor(c.r() * (N - 1)) + 0.2;
    const gy = Math.floor(c.r() * (N - 1)) + 0.4;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) diamond(c.gnd, gx + x * 0.25, gy + y * 0.25, 0.25, 0.25).fill((x + y) % 2 ? pal.glow : C.ink);
  }
  // tears in reality: black jagged holes with pink rims and TV static inside (3 frames)
  const tears = 1 + stage + Math.floor(c.tier / 3);
  const stat: Graphics[] = [new Graphics(), new Graphics(), new Graphics()];
  for (let i = 0; i < tears; i++) {
    const p = inYard(c, 0.6)();
    const w = (26 + c.r() * 18) * s;
    const pts: number[] = [];
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const rr = (k % 2 ? 0.55 : 1) * (0.8 + c.r() * 0.4);
      pts.push(p.x + Math.cos(a) * w * rr, p.y + Math.sin(a) * w * 0.42 * rr);
    }
    c.gnd.poly(pts).fill(pal.rockDark).stroke({ width: 5, color: pal.glow, join: 'miter' });
    c.gnd.poly(pts).stroke({ width: 1.5, color: 0xffffff, join: 'miter' });
    stat.forEach((g, v) => {
      for (let k = 0; k < 8; k++) g.rect(p.x + (Math.sin(k * 9.1 + v * 4.7 + i) * w) / 2.2, p.y + (Math.cos(k * 5.3 + v * 2.1 + i) * w) / 6, 3 + ((k + v) % 3) * 2, 1.5).fill({ color: 0xffffff, alpha: 0.85 });
    });
  }
  stat.forEach((g) => c.gFx.addChild(g));
  frames(c, stat, 8);
  // negative-space cubes (outline only) hovering
  const cube = (g: Graphics, x: number, y: number, w: number) => {
    g.poly([x, y - w, x + w, y - w / 2, x, y, x - w, y - w / 2]).fill(pal.rockDark).stroke({ width: 2, color: 0xffffff });
    g.poly([x - w, y - w / 2, x, y, x, y + w, x - w, y + w / 2]).fill(pal.rockDark).stroke({ width: 2, color: 0xffffff });
    g.poly([x, y, x + w, y - w / 2, x + w, y + w / 2, x, y + w]).fill(pal.rockDark).stroke({ width: 2, color: pal.glow });
  };
  const cubes: { g: Graphics; y: number; ph: number }[] = [];
  for (let i = 0; i < 1 + stage; i++) {
    const p = i % 2 ? BL(c, 0.5 + c.r() * 0.4) : BR(c, 0.5 + c.r() * 0.4);
    const g = new Graphics();
    cube(g, 0, 0, 9 + stage * 2);
    g.position.set(p.x, p.y - 50 - c.r() * 30);
    c.bFx.addChild(g);
    cubes.push({ g, y: g.y, ph: c.r() * 6 });
  }
  c.ticks.push((t) => {
    const s2 = stepped(t);
    for (const q of cubes) {
      q.g.y = q.y + Math.sin(s2 * 1.3 + q.ph) * 6;
      q.g.rotation = Math.sin(s2 * 0.7 + q.ph) * 0.15;
    }
  });
  // the rift: a vertical tear standing at the back-right edge (T4+), a giant one behind the house (T7+)
  const rift = (parent: Graphics, fx: Container, x: number, y: number, w: number, h: number) => {
    const pts = [x, y - h, x + w * 0.35, y - h * 0.7, x + w * 0.2, y - h * 0.5, x + w * 0.5, y - h * 0.3, x, y, x - w * 0.4, y - h * 0.32, x - w * 0.15, y - h * 0.52, x - w * 0.45, y - h * 0.72];
    parent.poly(pts).fill(pal.rockDark).stroke({ width: 9, color: C.ink, join: 'miter' });
    parent.poly(pts).stroke({ width: 4, color: pal.glow, join: 'miter' });
    const inner: Graphics[] = [];
    for (let v = 0; v < 3; v++) {
      const g = new Graphics();
      for (let k = 0; k < 10; k++) g.rect(x + Math.sin(k * 3.7 + v * 2.2) * w * 0.15, y - h * 0.15 - ((k * 37 + v * 13) % 70) / 100 * h, 4 + (k % 3) * 3, 2).fill({ color: k % 4 ? 0xffffff : pal.bloom2, alpha: 0.9 });
      fx.addChild(g);
      inner.push(g);
    }
    frames(c, inner, 10);
    const gl = glowSprite(fx, x, y - h / 2, pal.glow, 0.35, (h / 140) * 0.9, true);
    c.amb.glow(gl);
    // glitch: the whole rift slips sideways for a frame now and then
    c.ticks.push((t) => {
      const f = Math.floor(t * 12);
      fx.x = f % 23 === 0 ? 4 : f % 31 === 0 ? -3 : 0;
    });
  };
  if (stage >= 1) {
    const p = BR(c, 0.7, 0.3);
    const fx = new Container();
    c.bFx.addChild(fx);
    rift(c.bk, fx, p.x, p.y, 40 * s, 120 * s);
    c.amb.add('shard', 0xffffff, 3 + stage, inYard(c, 0.5), { h: 120, amp: 6, sp: 0.18 });
  }
  if (stage >= 2) {
    const p = BR(c, 0.04, 0.9);
    const fx = new Container();
    c.cFx.addChild(fx);
    rift(c.crown, fx, p.x, p.y - 20, 110 * (stage >= 3 ? 1.3 : 1), stage >= 3 ? 360 : 260);
    // fragments of the island floating up into it
    const frags: { g: Graphics; y: number; ph: number }[] = [];
    for (let k = 0; k < 3 + stage; k++) {
      const g = new Graphics();
      const w = 14 + c.r() * 12;
      g.poly([-w, 0, 0, -w * 0.5, w, 0, 0, w * 0.5]).fill(pal.soil).stroke(THIN);
      g.poly([-w, 0, 0, w * 0.5, 0, w * 0.5 + 10, -w * 0.6, 8]).fill(pal.rock).stroke(HAIR);
      g.position.set(p.x + (c.r() - 0.5) * 220, p.y - 120 - c.r() * 160);
      c.cFx.addChild(g);
      frags.push({ g, y: g.y, ph: c.r() * 6 });
    }
    c.ticks.push((t) => {
      const s2 = stepped(t);
      for (const q of frags) q.g.y = q.y + Math.sin(s2 * 1.1 + q.ph) * 8;
    });
  }
  c.amb.add('static', 0xffffff, 3 + c.tier, inYard(c, 0.2), { amp: 10 });
  c.amb.add('static', pal.glow, 2 + stage, inYard(c, 0.2), { amp: 14 });
}

// =========================================================================================== ICE
function ice(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  // snow with ice sheets, cracks and little paw prints
  for (let i = 0; i < 3 + N * 2; i++) {
    const p = inYard(c, 0.4)();
    const w = 30 + c.r() * 26;
    c.gnd.poly([p.x - w, p.y, p.x - w * 0.2, p.y - w * 0.38, p.x + w, p.y - 4, p.x + w * 0.3, p.y + w * 0.36]).fill(pal.soil2).stroke({ width: 1.5, color: pal.rockDark, alpha: 0.6 });
    c.gnd.moveTo(p.x - w * 0.5, p.y - 4).lineTo(p.x + w * 0.2, p.y - 10).stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });
  }
  for (let i = 0; i < 4 + stage * 2; i++) {
    const p = inYard(c, 0.4)();
    c.gnd.ellipse(p.x, p.y, 3, 1.8).fill({ color: pal.rockDark, alpha: 0.5 });
    for (let k = 0; k < 3; k++) c.gnd.circle(p.x - 3 + k * 3, p.y - 3.5, 1.1).fill({ color: pal.rockDark, alpha: 0.5 });
  }
  if (stage >= 1) {
    const cx = N * 0.6;
    const cy = N * 0.62;
    groundEllipse(c.gnd, cx, cy, 0.55 + stage * 0.1).fill(pal.rock).stroke(INK);
    groundEllipse(c.gnd, cx - 0.05, cy - 0.05, 0.4 + stage * 0.08).fill({ color: 0xffffff, alpha: 0.5 });
    const p = P(cx, cy);
    c.gnd.moveTo(p.x - 30, p.y + 4).lineTo(p.x - 8, p.y - 4).lineTo(p.x + 6, p.y + 6).lineTo(p.x + 30, p.y - 2).stroke({ width: 1.5, color: pal.rockDark });
  }
  // backdrop: spikes → translucent monoliths with icicles → an ice arch + aurora
  const spikes = (p: Pt, k: number) => {
    for (let j = 0; j < 3; j++) crystal(c.bk, p.x - 14 + j * 14, p.y + (j % 2) * 3, (28 + ((j + k) % 3) * 12) * s, 6 * s, j % 2 ? pal.rock : pal.rockLit, (j - 1) * 5);
  };
  spikes(BR(c, 0.82), 0);
  spikes(BL(c, 0.74), 1);
  if (stage >= 1) {
    monolith(c.bk, BL(c, 0.48, 0.3).x, BL(c, 0.48, 0.3).y, 54 * s, 140 * s, pal.rock, pal.rockLit, pal.rockDark, -10);
    monolith(c.bk, BR(c, 0.62, 0.3).x, BR(c, 0.62, 0.3).y, 46 * s, 116 * s, pal.rock, pal.rockLit, pal.rockDark, 8);
    c.amb.glow(glowSprite(c.bFx, BL(c, 0.48).x, BL(c, 0.48).y - 70 * s, pal.glow, 0.25, 0.7 * s, true));
    // icicles along the back fence line
    icicles(c.bk, BR(c, 0.5, 0), BR(c, 0.95, 0), 6, 14, pal.rockLit);
    icicles(c.bk, BL(c, 0.5, 0), BL(c, 0.95, 0), 6, 14, pal.rockLit);
  }
  if (stage >= 2) {
    // ice arch behind the back corner
    const a = BL(c, 0.18, 0.6);
    const b = BR(c, 0.18, 0.6);
    const H = 190 * s;
    monolith(c.bk, a.x, a.y, 60, H, pal.rock, pal.rockLit, pal.rockDark, 18);
    monolith(c.bk, b.x, b.y, 60, H * 0.95, pal.rock, pal.rockLit, pal.rockDark, -18);
    c.bk.moveTo(a.x - 20, a.y - H + 10).quadraticCurveTo((a.x + b.x) / 2, a.y - H - 70, b.x + 20, b.y - H + 14).lineTo(b.x + 14, b.y - H + 40).quadraticCurveTo((a.x + b.x) / 2, a.y - H - 30, a.x - 14, a.y - H + 36).closePath().fill({ color: pal.rockLit, alpha: 0.95 }).stroke(INK);
    icicles(c.bk, { x: a.x - 10, y: a.y - H + 34 }, { x: b.x + 10, y: b.y - H + 38 }, 10, 26, pal.rock);
  }
  // the aurora (T4+ small, T7+ big curtain, T10 the whole sky): a wavy curtain, bright at the top, fading down
  if (stage >= 1) {
    const aur = new Container();
    const g = new Graphics();
    const W = 180 + stage * 110;
    const n = 26 + stage * 8;
    const cols = [pal.glow, 0x5fffb0, 0x9fe8ff, pal.bloom2];
    for (let k = 0; k < n; k++) {
      const f = k / (n - 1);
      const x = -W / 2 + f * W;
      const y0 = Math.sin(f * Math.PI * 2.2) * 18 - Math.sin(f * Math.PI) * 20;
      const h = 34 + stage * 14 + Math.sin(k * 0.9) * 10;
      const col = cols[Math.floor(f * 3.99)];
      const bw = W / n + 1.2;
      g.rect(x, y0, bw, h * 0.35).fill({ color: col, alpha: 0.65 });
      g.rect(x, y0 + h * 0.35, bw, h * 0.35).fill({ color: col, alpha: 0.32 });
      g.rect(x, y0 + h * 0.7, bw, h * 0.5).fill({ color: col, alpha: 0.12 });
    }
    aur.addChild(g);
    aur.position.set(c.house.x + 30, c.roofY - 40 - stage * 25);
    c.cFx.addChild(aur);
    c.ticks.push((t) => {
      const s2 = stepped(t);
      aur.skew.x = Math.sin(s2 * 0.9) * 0.22;
      aur.scale.y = 1 + Math.sin(s2 * 1.4) * 0.1;
    });
    c.amb.glow(aur as unknown as Graphics, 0.85);
  }
  if (stage >= 3) {
    // a floating snowflake crystal above it all
    const p = { x: c.house.x, y: c.roofY - 230 };
    const sf = new Graphics();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      sf.moveTo(0, 0).lineTo(Math.cos(a) * 44, Math.sin(a) * 44).stroke({ width: 9, color: C.ink, cap: 'round' });
      sf.moveTo(0, 0).lineTo(Math.cos(a) * 44, Math.sin(a) * 44).stroke({ width: 5, color: pal.rockLit, cap: 'round' });
      sf.moveTo(Math.cos(a) * 26, Math.sin(a) * 26).lineTo(Math.cos(a + 0.5) * 36, Math.sin(a + 0.5) * 36).stroke({ width: 3, color: pal.rockLit, cap: 'round' });
    }
    sf.circle(0, 0, 10).fill(pal.glow).stroke(THIN);
    sf.position.set(p.x, p.y);
    c.cFx.addChild(sf);
    c.amb.glow(glowSprite(c.cFx, p.x, p.y, pal.glow, 0.5, 1.1, true));
    c.ticks.push((t) => (sf.rotation = stepped(t) * 0.3));
  }
  for (let i = 0; i < 1 + stage; i++) {
    const p = i % 2 ? FR(c, 0.3 + c.r() * 0.5) : FL(c, 0.6 + c.r() * 0.3);
    c.fr.ellipse(p.x, p.y, 16, 6).fill(0xffffff).stroke(HAIR);
    crystal(c.fr, p.x + 8, p.y + 1, 18, 4, pal.rock, 3);
  }
  c.amb.add('snow', 0xffffff, 4 + c.tier, inYard(c, 0), { h: 200, amp: 12, sp: 0.09 });
  if (stage >= 1) c.amb.add('twinkle', pal.glowHot, 2 + stage, inYard(c, 0.3), { sp: 0.15 });
}

// =========================================================================================== SOUND
function sound(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  speckle(c, 5 + N, pal.soil2, 0.9, 26, 10);
  // the dancefloor (T4+): 3 groups of tiles light up on the beat
  const groups = [new Graphics(), new Graphics(), new Graphics()];
  const cols = [pal.glow, pal.leaf, pal.glowHot];
  const span = stage >= 1 ? Math.min(N - 1, 2 + stage) : 1;
  const ox = (N - span) / 2 + 0.2;
  for (let y = 0; y < span * 2; y++)
    for (let x = 0; x < span * 2; x++) {
      const k = (x * 2 + y) % 3;
      diamond(groups[k], ox + x * 0.5 + 0.03, ox + y * 0.5 + 0.03, 0.44, 0.44).fill(cols[k]).stroke({ width: 1.2, color: C.ink, alpha: 0.6 });
    }
  if (stage >= 1) {
    diamond(c.gnd, ox - 0.05, ox - 0.05, span + 0.1, span + 0.1).fill(pal.rockDark).stroke(THIN);
    groups.forEach((g) => c.gFx.addChild(g));
    c.ticks.push((t) => {
      const b = Math.floor(t * 4);
      groups.forEach((g, i) => (g.alpha = (b + i) % 3 === 0 ? 0.95 : 0.25));
    });
  }
  // cables
  for (let k = 0; k < 2 + stage; k++) {
    const a = inYard(c, 0.3)();
    const b = inYard(c, 0.3)();
    c.gnd.moveTo(a.x, a.y).bezierCurveTo(a.x + 30, a.y + 20, b.x - 30, b.y - 20, b.x, b.y).stroke({ width: 2.5, color: C.ink, alpha: 0.85 });
  }
  // speakers with woofers that thump
  const woofers: Graphics[] = [];
  const speaker = (g: Graphics, fx: Container, x: number, y: number, w: number, h: number) => {
    g.rect(x - w / 2 + 4, y - h + 4, w, h).fill(C.ink);
    g.rect(x - w / 2, y - h, w, h).fill(pal.rock).stroke(THIN);
    g.rect(x - w / 2, y - h, w, 4).fill(pal.glow);
    g.circle(x, y - h + w * 0.28, w * 0.14).fill(pal.leaf).stroke(HAIR);
    const wf = new Graphics().circle(0, 0, w * 0.32).fill(pal.glow).stroke(THIN).circle(0, 0, w * 0.12).fill(C.ink);
    wf.position.set(x, y - h + h * 0.62);
    fx.addChild(wf);
    woofers.push(wf);
  };
  speaker(c.bk, c.bFx, BL(c, 0.72).x, BL(c, 0.72).y, 34 * s, 48 * s);
  if (stage >= 1) {
    speaker(c.bk, c.bFx, BR(c, 0.82).x, BR(c, 0.82).y, 30 * s, 40 * s);
    speaker(c.bk, c.bFx, BL(c, 0.52).x, BL(c, 0.52).y, 40 * s, 80 * s);
    speaker(c.bk, c.bFx, BL(c, 0.52).x, BL(c, 0.52).y - 80 * s, 30 * s, 36 * s);
  }
  if (stage >= 2) {
    speaker(c.bk, c.bFx, BR(c, 0.58).x, BR(c, 0.58).y, 44 * s, 100 * s);
    speaker(c.bk, c.bFx, BR(c, 0.58).x, BR(c, 0.58).y - 100 * s, 34 * s, 40 * s);
    // the light rig: a truss over the back with sweeping spotlights
    const a = BL(c, 0.5, 0.4);
    const b = BR(c, 0.5, 0.4);
    const H = 210 * s;
    for (const p of [a, b]) c.bk.rect(p.x - 4, p.y - H, 8, H).fill(0x9aa0aa).stroke(THIN);
    c.bk.moveTo(a.x, a.y - H).lineTo(b.x, b.y - H).stroke({ width: 10, color: C.ink }).moveTo(a.x, a.y - H).lineTo(b.x, b.y - H).stroke({ width: 6, color: 0x9aa0aa });
    for (let k = 0; k < 4; k++) {
      const f = (k + 0.5) / 4;
      const p = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) - H + 8 };
      const beam = new Graphics().poly([0, 0, -36, 190, 36, 190]).fill({ color: [pal.glow, pal.leaf, pal.glowHot, pal.glow][k], alpha: 0.22 });
      beam.position.set(p.x, p.y);
      beam.blendMode = 'add';
      c.bFx.addChild(beam);
      c.bk.rect(p.x - 7, p.y - 4, 14, 12).fill(C.ink);
      const ph = k * 1.3;
      c.ticks.push((t) => (beam.rotation = Math.sin(stepped(t) * 0.9 + ph) * 0.45));
    }
  }
  if (stage >= 3) {
    // a giant equalizer billboard behind the house
    const p = BR(c, 0.05, 0.9);
    const W = 260;
    const H = 150;
    c.crown.rect(p.x - W / 2 + 6, p.y - 200 - H + 6, W, H).fill(C.ink);
    c.crown.rect(p.x - W / 2, p.y - 200 - H, W, H).fill(pal.rockDark).stroke(INK);
    c.crown.rect(p.x - 4, p.y - 200, 8, 200).fill(0x9aa0aa).stroke(THIN);
    const eq = new Graphics();
    c.cFx.addChild(eq);
    let last = -1;
    c.ticks.push((t) => {
      const f = Math.floor(t * 8);
      if (f === last) return;
      last = f;
      eq.clear();
      for (let k = 0; k < 14; k++) {
        const h = 16 + Math.abs(Math.sin(f * 0.8 + k * 1.3)) * (H - 40);
        eq.rect(p.x - W / 2 + 12 + k * 17.5, p.y - 212 - h, 13, h).fill([pal.glow, pal.leaf, pal.glowHot][k % 3]);
      }
    });
    c.amb.glow(glowSprite(c.cFx, p.x, p.y - 270, pal.glow, 0.35, 2, true));
  }
  c.ticks.push((t) => {
    const b = Math.floor(t * 4) % 2 ? 1.14 : 1;
    for (const w of woofers) w.scale.set(b);
  });
  // front: wedge monitors
  for (let i = 0; i < stage; i++) {
    const p = i % 2 ? FR(c, 0.4 + c.r() * 0.3) : FL(c, 0.6 + c.r() * 0.3);
    c.fr.poly([p.x - 16, p.y, p.x + 16, p.y, p.x + 12, p.y - 14, p.x - 14, p.y - 8]).fill(pal.rock).stroke(THIN);
    c.fr.circle(p.x, p.y - 6, 4).fill(pal.glow);
  }
  c.amb.add('note', pal.glowHot, 2 + c.tier, inYard(c, 0.4), { h: 110, amp: 10, sp: 0.2 });
  if (stage >= 1) c.amb.add('note', pal.leaf, 1 + stage, inYard(c, 0.4), { h: 130, amp: 12, sp: 0.18 });
}

// =========================================================================================== SHADOW
function shadow(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  speckle(c, 6 + N * 2, pal.soil2, 0.9, 28, 11);
  // pink light pools + neon sprouts
  const pools = new Graphics();
  for (let i = 0; i < 2 + stage; i++) {
    const p = inYard(c, 0.5)();
    pools.ellipse(p.x, p.y, 40, 15).fill({ color: pal.glow, alpha: 0.18 });
    pools.ellipse(p.x, p.y, 22, 8).fill({ color: pal.glow, alpha: 0.2 });
  }
  c.gFx.addChild(pools);
  c.amb.glow(pools, 1);
  for (let i = 0; i < 4 + stage * 3; i++) {
    const p = inYard(c, 0.3)();
    fern(c.gnd, p.x, p.y, 0.35, i % 2 ? pal.glow : pal.bloom2);
  }
  // mist banks drifting
  if (stage >= 1) {
    const mist = new Graphics();
    for (let i = 0; i < 2 + stage; i++) {
      const p = inYard(c, 0.4)();
      mist.ellipse(p.x, p.y, 60, 14).fill({ color: 0x8a7ab8, alpha: 0.16 });
    }
    c.gFx.addChild(mist);
    c.ticks.push((t) => (mist.x = Math.sin(stepped(t) * 0.4) * 10));
  }
  // dark silhouette trees + neon ferns; eyes in the dark that blink
  const silTree = (g: Graphics, x: number, y: number, h: number) => {
    tree(g, x, y, h, pal.rock, pal.leaf, pal.leaf2, c.r);
    // hanging vines with neon tips
    for (let k = 0; k < 5; k++) {
      const vx = x - h * 0.3 + k * h * 0.15;
      const vy = y - h * 0.58;
      const len = h * (0.18 + ((k * 7) % 4) * 0.05);
      g.moveTo(vx, vy).quadraticCurveTo(vx + 4, vy + len * 0.5, vx, vy + len).stroke({ width: 2, color: pal.leaf2 });
      if (k % 2) g.circle(vx, vy + len + 2, 2.5).fill(pal.glow);
    }
  };
  const eyes: Graphics[] = [];
  const eye = (x: number, y: number) => {
    const e = new Graphics().ellipse(-5, 0, 3.2, 2).fill(pal.glowHot).ellipse(5, 0, 3.2, 2).fill(pal.glowHot);
    e.position.set(x, y);
    c.bFx.addChild(e);
    eyes.push(e);
  };
  for (const [u, side] of [
    [0.72, 0],
    [0.86, 1],
  ] as const) {
    const p = side ? BR(c, u) : BL(c, u);
    fern(c.bk, p.x, p.y, 0.8 * s, pal.leaf2, pal.glow);
    fern(c.bk, p.x + 18, p.y + 3, 0.6 * s, pal.leaf, pal.bloom2);
  }
  if (stage >= 1) {
    silTree(c.bk, BL(c, 0.5, 0.35).x, BL(c, 0.5, 0.35).y, 150 * s);
    silTree(c.bk, BR(c, 0.62, 0.35).x, BR(c, 0.62, 0.35).y, 130 * s);
    eye(BL(c, 0.5).x + 4, BL(c, 0.5).y - 40);
    // tall neon fronds
    for (const p of [BL(c, 0.32), BR(c, 0.45)]) fern(c.bk, p.x, p.y, 1.1 * s, pal.glow, pal.glowHot);
    c.amb.glow(glowSprite(c.bFx, BL(c, 0.32).x, BL(c, 0.32).y - 20, pal.glow, 0.35, 0.6, true));
  }
  if (stage >= 2) {
    // the canopy arch over the back corner
    const a = BL(c, 0.2, 0.5);
    const b = BR(c, 0.2, 0.5);
    const H = 220 * s;
    for (const p of [a, b]) c.bk.poly([p.x - 14, p.y, p.x - 6, p.y - H, p.x + 8, p.y - H, p.x + 16, p.y]).fill(pal.rock).stroke(INK);
    for (let k = 0; k < 9; k++) {
      const f = k / 8;
      const x = lerp(a.x - 40, b.x + 40, f);
      const y = lerp(a.y, b.y, f) - H - Math.sin(f * Math.PI) * 50;
      c.bk.circle(x, y, 40 + ((k * 17) % 20)).fill(k % 2 ? pal.leaf : pal.leaf2).stroke(THIN);
    }
    for (let k = 0; k < 8; k++) {
      const f = (k + 0.5) / 8;
      const x = lerp(a.x, b.x, f);
      const y = lerp(a.y, b.y, f) - H + 20 - Math.sin(f * Math.PI) * 40;
      c.bk.moveTo(x, y).quadraticCurveTo(x + 5, y + 30, x, y + 50 + (k % 3) * 14).stroke({ width: 2.4, color: pal.leaf2 });
      if (k % 2) c.bk.circle(x, y + 52 + (k % 3) * 14, 3).fill(pal.glow);
    }
    eye(b.x - 20, b.y - H * 0.5);
    eye(a.x + 24, a.y - H * 0.4);
    c.amb.add('firefly', pal.glow, 4, () => ({ x: lerp(a.x, b.x, c.r()), y: a.y - c.r() * H }), { amp: 12, sp: 0.08, h: 40 });
  }
  if (stage >= 3) {
    // neon blossoms on the canopy
    const p = BR(c, 0.05, 0.9);
    for (let k = 0; k < 10; k++) {
      const q = { x: p.x + (c.r() - 0.5) * 300, y: p.y - 200 - c.r() * 140 };
      const b = new Graphics();
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI * 2;
        b.ellipse(q.x + Math.cos(a) * 6, q.y + Math.sin(a) * 6, 5, 3).fill(k % 2 ? pal.glow : pal.bloom2);
      }
      b.circle(q.x, q.y, 3).fill(0xffffff);
      c.cFx.addChild(b);
      c.amb.glow(b, 1);
    }
    c.amb.glow(glowSprite(c.cFx, p.x, p.y - 260, pal.glow, 0.35, 2.4, true));
  }
  // blink: eyes close for a frame every few seconds
  c.ticks.push((t) => {
    const f = Math.floor(t * 12);
    eyes.forEach((e, i) => (e.scale.y = (f + i * 17) % 50 < 2 ? 0.1 : 1));
  });
  for (let i = 0; i < 1 + stage; i++) {
    const p = i % 2 ? FR(c, 0.3 + c.r() * 0.5) : FL(c, 0.6 + c.r() * 0.3);
    fern(c.fr, p.x, p.y, 0.5, pal.glow, pal.glowHot);
    c.fr.rect(p.x + 12, p.y - 8, 3, 8).fill(0xd9c6ff);
    c.fr.ellipse(p.x + 13.5, p.y - 9, 7, 4).fill(pal.bloom2).stroke(HAIR);
  }
  c.amb.add('spore', pal.glow, 3 + c.tier, inYard(c, 0.2), { amp: 14, sp: 0.07, h: 70 });
}

// =========================================================================================== TIME
function time(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  // sepia flagstones
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) diamond(c.gnd, gx + 0.06, gy + 0.06, 0.88, 0.88).fill({ color: (gx * 3 + gy) % 4 ? pal.soil2 : shade(pal.soil, 0.95), alpha: 0.9 }).stroke({ width: 1.2, color: C.ink, alpha: 0.35 });
  // the clock face inlaid in the yard (T4+); spiral motion rings turning (T7+)
  const cx = N * 0.56;
  const cy = N * 0.56;
  const pc = P(cx, cy);
  if (stage >= 1) {
    const R = 0.7 + stage * 0.15;
    groundEllipse(c.gnd, cx, cy, R + 0.08).fill(pal.rockDark).stroke(INK);
    groundEllipse(c.gnd, cx, cy, R).fill(pal.glass).stroke(THIN);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const r0 = R * (k % 3 ? 0.86 : 0.76);
      c.gnd.moveTo(pc.x + Math.cos(a) * r0 * 90, pc.y + Math.sin(a) * r0 * 45).lineTo(pc.x + Math.cos(a) * R * 0.96 * 90, pc.y + Math.sin(a) * R * 0.96 * 45).stroke({ width: k % 3 ? 2 : 4, color: C.ink });
    }
    const hands = new Graphics();
    c.gFx.addChild(hands);
    let last = -1;
    c.ticks.push((t) => {
      const f = Math.floor(t * 2);
      if (f === last) return;
      last = f;
      hands.clear();
      const am = (f / 60) * Math.PI * 2 - Math.PI / 2;
      const ah = (f / 720) * Math.PI * 2 - Math.PI / 2 + 1;
      hands.moveTo(pc.x, pc.y).lineTo(pc.x + Math.cos(am) * R * 80, pc.y + Math.sin(am) * R * 40).stroke({ width: 3.5, color: C.ink, cap: 'round' });
      hands.moveTo(pc.x, pc.y).lineTo(pc.x + Math.cos(ah) * R * 52, pc.y + Math.sin(ah) * R * 26).stroke({ width: 5, color: C.ink, cap: 'round' });
      hands.circle(pc.x, pc.y, 4).fill(pal.bloom).stroke(HAIR);
    });
  }
  // gears half-buried
  const gear = (g: Graphics, x: number, y: number, r: number, col: number) => {
    const pts: number[] = [];
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      const rr = k % 2 ? r : r * 0.8;
      pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.poly(pts).fill(col).stroke(THIN);
    g.circle(x, y, r * 0.35).fill(pal.rockDark).stroke(HAIR);
  };
  for (let i = 0; i < 1 + stage; i++) {
    const p = inYard(c, 0.4)();
    gear(c.gnd, p.x, p.y, 10 + c.r() * 6, i % 2 ? pal.bloom : 0x9a9a8a);
  }
  // spiral motion blur (concept): concentric arcs that turn, faster near the center
  if (stage >= 2) {
    const sp = new Container();
    sp.position.set(pc.x, pc.y);
    sp.scale.y = 0.5;
    const rings: Graphics[] = [];
    for (let k = 0; k < 3 + stage; k++) {
      const g = new Graphics();
      const r = 60 + k * 26;
      for (let j = 0; j < 3; j++) g.arc(0, 0, r, j * 2.1, j * 2.1 + 1.2).stroke({ width: 3, color: k % 2 ? 0xffffff : 0x6b6b6b, alpha: 0.5 - k * 0.05, cap: 'round' });
      sp.addChild(g);
      rings.push(g);
    }
    c.gFx.addChild(sp);
    c.ticks.push((t) => rings.forEach((g, k) => (g.rotation = stepped(t) * (1.2 / (k + 1)) * (k % 2 ? -1 : 1))));
  }
  // backdrop: hourglass → a station clock post (concept) → a clock tower → a giant floating clock
  const stationClock = (g: Graphics, fx: Container, x: number, y: number, h: number, r: number) => {
    g.rect(x - 4, y - h, 8, h).fill(pal.rockDark).stroke(THIN);
    g.ellipse(x, y, 14, 5).fill(pal.rockDark).stroke(THIN);
    g.circle(x, y - h - r, r + 4).fill(pal.rockDark).stroke(INK);
    g.circle(x, y - h - r, r).fill(pal.glass).stroke(THIN);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.moveTo(x + Math.cos(a) * r * 0.78, y - h - r + Math.sin(a) * r * 0.78).lineTo(x + Math.cos(a) * r * 0.92, y - h - r + Math.sin(a) * r * 0.92).stroke({ width: k % 3 ? 1.2 : 2.4, color: C.ink });
    }
    const hand = new Graphics().moveTo(0, 0).lineTo(0, -r * 0.75).stroke({ width: 2.4, color: C.ink, cap: 'round' });
    const hand2 = new Graphics().moveTo(0, 0).lineTo(r * 0.5, 0).stroke({ width: 3.2, color: C.ink, cap: 'round' });
    hand.position.set(x, y - h - r);
    hand2.position.set(x, y - h - r);
    fx.addChild(hand2, hand);
    c.ticks.push((t) => {
      hand.rotation = Math.floor(t) * ((Math.PI * 2) / 60);
      hand2.rotation = t * 0.01;
    });
  };
  stationClock(c.bk, c.bFx, BR(c, 0.8).x, BR(c, 0.8).y, 50 * s, 14 * s);
  if (stage >= 1) {
    gear(c.bk, BL(c, 0.7).x, BL(c, 0.7).y - 22, 24 * s, pal.bloom);
    gear(c.bk, BL(c, 0.7).x + 26 * s, BL(c, 0.7).y - 8, 16 * s, 0x9a9a8a);
  }
  if (stage >= 2) {
    // clock tower on the back-left edge
    const p = BL(c, 0.42, 0.35);
    const H = 170 * s;
    c.bk.rect(p.x - 26, p.y - H, 52, H).fill(pal.rock).stroke(INK);
    c.bk.rect(p.x + 6, p.y - H, 20, H).fill(pal.rockDark);
    c.bk.poly([p.x - 32, p.y - H, p.x, p.y - H - 46, p.x + 32, p.y - H]).fill(pal.roof).stroke(INK);
    c.bk.rect(p.x - 8, p.y - 40, 16, 40).fill(C.ink);
    stationClock(c.bk, c.bFx, p.x, p.y - H + 6, 0, 22);
  }
  if (stage >= 3) {
    // the giant clock floating above the house, the world swirling around it (concept)
    const p = { x: c.house.x, y: c.roofY - 200 };
    const ck = new Container();
    ck.position.set(p.x, p.y);
    const sw = new Container();
    for (let k = 0; k < 6; k++) {
      const g = new Graphics();
      const r = 90 + k * 22;
      for (let j = 0; j < 4; j++) g.arc(0, 0, r, j * 1.57 + k * 0.4, j * 1.57 + k * 0.4 + 0.9).stroke({ width: 4, color: k % 2 ? 0xffffff : 0x8a8a8a, alpha: 0.55 - k * 0.06, cap: 'round' });
      sw.addChild(g);
    }
    ck.addChild(sw);
    const face = new Graphics();
    face.circle(0, 0, 66).fill(pal.rockDark).stroke(INK);
    face.circle(0, 0, 58).fill(0xffffff).stroke(THIN);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      face.moveTo(Math.cos(a) * 46, Math.sin(a) * 46).lineTo(Math.cos(a) * 54, Math.sin(a) * 54).stroke({ width: k % 3 ? 2 : 4, color: C.ink });
    }
    ck.addChild(face);
    const mh = new Graphics().moveTo(0, 6).lineTo(0, -48).stroke({ width: 4, color: C.ink, cap: 'round' });
    const hh2 = new Graphics().moveTo(0, 4).lineTo(0, -32).stroke({ width: 6, color: C.ink, cap: 'round' });
    const sec = new Graphics().moveTo(0, 10).lineTo(0, -52).stroke({ width: 1.5, color: C.red });
    ck.addChild(hh2, mh, sec, new Graphics().circle(0, 0, 5).fill(C.red).stroke(HAIR));
    c.cFx.addChild(ck);
    c.amb.glow(glowSprite(c.cFx, p.x, p.y, 0xffffff, 0.35, 1.8, true));
    c.ticks.push((t) => {
      const s2 = stepped(t);
      sw.rotation = s2 * 0.6;
      sec.rotation = Math.floor(t) * ((Math.PI * 2) / 60);
      mh.rotation = t * 0.02;
      hh2.rotation = t * 0.002 + 1.2;
      ck.y = p.y + Math.sin(s2 * 0.8) * 5;
    });
  }
  for (let i = 0; i < stage; i++) {
    const p = i % 2 ? FR(c, 0.3 + c.r() * 0.5) : FL(c, 0.6 + c.r() * 0.3);
    gear(c.fr, p.x, p.y - 8, 9, pal.bloom);
  }
  c.amb.add('sand', pal.bloom, 3 + c.tier, () => pc, { h: 90, amp: 20 + stage * 10, sp: 0.12 });
  c.amb.add('mote', 0xffffff, 2 + stage, inYard(c), { amp: 10, sp: 0.06, h: 60 });
}

// =========================================================================================== LIGHT
function light(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  // golden-white marble with gold inlay, meadow edges
  for (let gy = 0; gy < N; gy++)
    for (let gx = 0; gx < N; gx++) {
      diamond(c.gnd, gx + 0.05, gy + 0.05, 0.9, 0.9).fill({ color: (gx + gy) % 2 ? pal.soil : pal.soil2, alpha: 0.95 }).stroke({ width: 1.5, color: pal.trim, alpha: 0.7 });
      if (stage >= 1 && (gx + gy) % 2 === 0) {
        const p = P(gx, gy);
        c.gnd.star(p.x, p.y, 4, 7, 2.5).fill({ color: pal.glow, alpha: 0.8 });
      }
    }
  for (let i = 0; i < 6 + N * 2; i++) {
    const p = i % 2 ? FR(c, c.r(), 0.15) : FL(c, c.r() * 0.9, 0.15);
    tuft(c.gnd, p.x, p.y, 1, pal.leaf);
    if (i % 3 === 0) flower(c.gnd, p.x + 6, p.y - 4, 0.8, i % 2 ? 0xffffff : pal.bloom2);
  }
  // a golden path to the gate (T4+) + a light pool
  if (stage >= 1) {
    ribbon(c.gnd, [[0.9, N - 0.5], [1.2, N * 0.6], [N * 0.4, N * 0.4]], 22, pal.trim, 0.8);
    ribbon(c.gnd, [[0.9, N - 0.5], [1.2, N * 0.6], [N * 0.4, N * 0.4]], 14, pal.glow);
    const pool = new Graphics();
    groundEllipse(pool, N * 0.62, N * 0.6, 0.8).fill({ color: pal.glow, alpha: 0.35 });
    c.gFx.addChild(pool);
    c.amb.glow(pool, 0.8);
  }
  // spires: one crystal spire → two cathedral spires → a cathedral gate → a grand cathedral
  const cs = (p: Pt, h: number) => crystal(c.bk, p.x, p.y, h, 9, 0xfff3c4, 0);
  if (stage === 0) {
    cs(BR(c, 0.78), 56);
    cs(BL(c, 0.72), 44);
    c.amb.glow(glowSprite(c.bFx, BR(c, 0.78).x, BR(c, 0.78).y - 30, pal.glow, 0.35, 0.5));
  } else {
    spire(c.bk, BL(c, 0.66).x, BL(c, 0.66).y, 130 * s, 26 * s, pal.wall, pal.glass, pal.roof);
    spire(c.bk, BR(c, 0.82).x, BR(c, 0.82).y, 110 * s, 22 * s, pal.wall, pal.glass, pal.roof);
    spire(c.bk, BL(c, 0.84).x, BL(c, 0.84).y, 80 * s, 18 * s, pal.wall, pal.glass, pal.roof);
  }
  if (stage >= 2) {
    // the cathedral gate behind the back-right edge: a glowing doorway
    const p = BR(c, 0.48, 0.45);
    const H = 150 * s;
    const W = 120 * s;
    c.bk.rect(p.x - W / 2, p.y - H, W, H).fill(pal.wall).stroke(INK);
    c.bk.rect(p.x - W / 2, p.y - H, W * 0.2, H).fill(shade(pal.wall, 0.9));
    for (const dx of [-W / 2, W / 2]) spire(c.bk, p.x + dx, p.y, H + 50, 24, pal.wall, pal.glass, pal.roof);
    const door = new Graphics();
    door.moveTo(p.x - 22, p.y).lineTo(p.x - 22, p.y - H * 0.55).quadraticCurveTo(p.x, p.y - H * 0.85, p.x + 22, p.y - H * 0.55).lineTo(p.x + 22, p.y).closePath().fill(0xffffff).stroke(INK);
    c.bFx.addChild(door);
    c.amb.glow(glowSprite(c.bFx, p.x, p.y - H * 0.45, pal.glow, 0.6, 1.2 * s, true));
    c.bk.circle(p.x, p.y - H * 0.88, 14).fill(pal.glass).stroke(THIN);
  }
  if (stage >= 2) {
    // god-rays: soft warm shafts falling from the sky behind the house (they breathe slowly)
    const rays = new Container();
    const top = { x: c.house.x + 40, y: c.roofY - 220 - stage * 40 };
    rays.position.set(top.x, top.y);
    const n = 4 + stage * 2;
    for (let k = 0; k < n; k++) {
      const a = Math.PI / 2 + (k - (n - 1) / 2) * 0.16;
      const L = 300 + stage * 70 + (k % 2) * 40;
      const w = 0.035 + (k % 3) * 0.015;
      const g = new Graphics().poly([Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a - w) * L, Math.sin(a - w) * L, Math.cos(a + w) * L, Math.sin(a + w) * L]).fill({ color: 0xfff3c0, alpha: 0.2 });
      rays.addChild(g);
      const ph = k * 0.9;
      c.ticks.push((t) => (g.alpha = 0.55 + Math.sin(stepped(t) * 0.6 + ph) * 0.45));
    }
    c.cFx.addChild(rays);
    c.amb.glow(glowSprite(c.cFx, top.x, top.y + 20, 0xfff3c0, 0.5, 1.2));
  }
  if (stage >= 3) {
    // the grand cathedral rising behind the back corner + a rainbow over everything
    const p = BR(c, 0.04, 1);
    for (const [dx, h, w] of [
      [-120, 240, 30],
      [-60, 320, 36],
      [0, 400, 44],
      [60, 320, 36],
      [120, 240, 30],
    ]) spire(c.crown, p.x + dx, p.y, h, w, pal.wall, pal.glass, pal.roof);
    const rb = new Graphics();
    const cols = [0xff5a5a, 0xffa84a, 0xffe14a, 0x6ad86a, 0x5ab0ff, 0x9a6ad0];
    cols.forEach((col, k) => rb.arc(p.x, p.y - 160, 330 - k * 10, Math.PI * 1.08, Math.PI * 1.92).stroke({ width: 10, color: col, alpha: 0.55 }));
    c.cFx.addChildAt(rb, 0);
    c.amb.glow(rb, 0.75);
  }
  c.amb.add('twinkle', 0xffffff, 3 + c.tier, inYard(c, 0), { sp: 0.14 });
  c.amb.add('mote', pal.glow, 2 + stage * 2, inYard(c), { amp: 10, sp: 0.07, h: 100 });
}

// =========================================================================================== CRYSTAL
function crystalB(c: BiomeCtx) {
  const { pal, N, stage } = c;
  const s = SZ[stage];
  const sheen = [pal.glow, pal.rock, pal.leaf, pal.bloom];
  // mother-of-pearl floor: pearly tiles with an iridescent sheen band each, sea-glass pebbles in the joints
  for (let gy = 0; gy < N; gy++)
    for (let gx = 0; gx < N; gx++) {
      diamond(c.gnd, gx + 0.04, gy + 0.04, 0.92, 0.92).fill({ color: (gx + gy) % 2 ? pal.soil : pal.soil2, alpha: 0.96 }).stroke({ width: 1.5, color: pal.rock, alpha: 0.55 });
      const p = P(gx, gy);
      c.gnd.ellipse(p.x - 4, p.y - 2, 16, 4).fill({ color: sheen[(gx * 3 + gy) % 4], alpha: 0.28 });
    }
  for (let i = 0; i < 4 + N * 2; i++) {
    const p = inYard(c, 0.3)();
    const w = 3 + c.r() * 3;
    c.gnd.poly([p.x - w, p.y, p.x - w * 0.3, p.y - w * 0.7, p.x + w, p.y - 1, p.x + w * 0.4, p.y + w * 0.6]).fill(sheen[i % 4]).stroke({ width: 1, color: pal.rockDark, alpha: 0.6 });
  }
  // an open giant shell with a glowing pearl (T4+)
  if (stage >= 1) {
    const p = P(N * 0.62, N * 0.6);
    const R = 30 + stage * 6;
    c.gnd.ellipse(p.x, p.y, R, R * 0.42).fill(pal.rockLit).stroke(INK);
    for (let k = -3; k <= 3; k++) c.gnd.moveTo(p.x, p.y + R * 0.3).lineTo(p.x + k * R * 0.28, p.y - R * 0.3).stroke({ width: 1.5, color: pal.rock, alpha: 0.7 });
    c.gnd.ellipse(p.x, p.y - 2, R * 0.6, R * 0.22).fill({ color: pal.glow, alpha: 0.35 });
    const pearl = new Graphics().circle(0, 0, 7 + stage * 1.5).fill(0xffffff).stroke(THIN);
    pearl.circle(-2.5, -2.5, 2.2).fill(pal.bloom);
    pearl.position.set(p.x, p.y - 6);
    c.gFx.addChild(pearl);
    c.amb.glow(glowSprite(c.gFx, p.x, p.y - 6, pal.glow, 0.45, 0.45 * s, true));
  }
  // backdrop: crystal clusters → lilac prisms → a split geode behind the back corner
  crystals(c.bk, BR(c, 0.8).x, BR(c, 0.8).y, 0.9 * s, pal.rock, c.r);
  crystals(c.bk, BL(c, 0.74).x, BL(c, 0.74).y, 0.8 * s, pal.glow, c.r);
  if (stage >= 1) {
    for (const [u, h, col, lean] of [
      [0.5, 110, pal.rock, -8],
      [0.62, 80, pal.leaf, 6],
    ] as const) {
      const p = BL(c, u, 0.3);
      crystal(c.bk, p.x, p.y, h * s, 12 * s, col, lean);
    }
    const q = BR(c, 0.58, 0.3);
    crystal(c.bk, q.x, q.y, 96 * s, 11 * s, pal.glow, 5);
    c.amb.glow(glowSprite(c.bFx, q.x, q.y - 50 * s, pal.glow, 0.25, 0.6 * s, true));
  }
  if (stage >= 2) {
    // the geode: a half-open rock shell, crystals growing inside it
    const p = BR(c, 0.16, 0.7);
    const R = 92 * s;
    c.bk.moveTo(p.x - R, p.y).quadraticCurveTo(p.x - R * 1.05, p.y - R * 1.5, p.x, p.y - R * 1.55).quadraticCurveTo(p.x + R * 1.05, p.y - R * 1.5, p.x + R, p.y).closePath().fill(pal.rockDark).stroke(INK);
    c.bk.moveTo(p.x - R * 0.78, p.y).quadraticCurveTo(p.x - R * 0.8, p.y - R * 1.22, p.x, p.y - R * 1.26).quadraticCurveTo(p.x + R * 0.8, p.y - R * 1.22, p.x + R * 0.78, p.y).closePath().fill(pal.rockLit).stroke(THIN);
    for (let k = 0; k < 7; k++) {
      const f = (k + 0.5) / 7;
      const a = Math.PI * (1.08 + f * 0.84);
      crystal(c.bk, p.x + Math.cos(a) * R * 0.55, p.y + 4 + Math.sin(a) * R * 0.25, (34 + (k % 3) * 14) * s, 7 * s, sheen[k % 4], Math.cos(a) * 10);
    }
    c.amb.glow(glowSprite(c.bFx, p.x, p.y - R * 0.6, pal.rock, 0.4, 1.1 * s, true));
  }
  // crown: a floating prism over the house splits a white beam into colours (T7+); T10 a giant pearl joins it
  if (stage >= 2) {
    const top = { x: c.house.x + 70, y: c.roofY - 70 - stage * 15 };
    const prism = new Container();
    prism.position.set(top.x, top.y);
    const rays = new Graphics();
    rays.moveTo(-170, 26).lineTo(0, 0).stroke({ width: 7, color: 0xffffff, alpha: 0.75 });
    [0xff8fb1, 0xffd77a, pal.leaf, pal.glow, pal.rock].forEach((col, k) => rays.moveTo(0, 0).lineTo(190, -60 + k * 30).stroke({ width: 6, color: col, alpha: 0.6 }));
    const tri = new Graphics().poly([-26, 18, 0, -28, 26, 18]).fill({ color: 0xffffff, alpha: 0.9 }).stroke(INK);
    tri.moveTo(-12, 8).lineTo(-2, -12).stroke({ width: 3, color: pal.glow, cap: 'round' });
    prism.addChild(rays, tri);
    c.cFx.addChild(prism);
    c.amb.glow(rays, 0.7);
    c.ticks.push((t) => {
      const st = stepped(t);
      prism.y = top.y + Math.sin(st * 1.3) * 5;
      tri.rotation = Math.sin(st * 0.7) * 0.08;
      rays.alpha = 0.6 + Math.sin(st * 1.1) * 0.25;
    });
  }
  if (stage >= 3) {
    const p = { x: c.house.x - 95, y: c.roofY - 120 };
    const pearl = new Graphics().circle(0, 0, 34).fill(pal.wall).stroke(INK);
    pearl.ellipse(-8, -6, 22, 14).fill({ color: pal.bloom, alpha: 0.5 });
    pearl.ellipse(10, 10, 16, 8).fill({ color: pal.glow, alpha: 0.45 });
    pearl.circle(-12, -12, 6).fill(0xffffff);
    pearl.position.set(p.x, p.y);
    c.cFx.addChild(pearl);
    const orbit = [0, 1, 2].map((k) => {
      const g = new Graphics().poly([0, -7, 5, 0, 0, 7, -5, 0]).fill(sheen[k]).stroke(HAIR);
      c.cFx.addChild(g);
      return g;
    });
    c.amb.glow(glowSprite(c.cFx, p.x, p.y, pal.glow, 0.5, 1.2, true));
    c.ticks.push((t) => {
      const st = stepped(t);
      pearl.y = p.y + Math.sin(st * 0.9) * 6;
      orbit.forEach((g, k) => {
        const a = st * 0.8 + (k / 3) * Math.PI * 2;
        g.position.set(p.x + Math.cos(a) * 56, pearl.y + Math.sin(a) * 18);
      });
    });
  }
  // front: sea-glass pieces and little shells
  for (let i = 0; i < 2 + stage; i++) {
    const p = i % 2 ? FR(c, 0.3 + c.r() * 0.5) : FL(c, 0.6 + c.r() * 0.3);
    c.fr.moveTo(p.x - 8, p.y + 2).quadraticCurveTo(p.x, p.y - 10, p.x + 8, p.y + 2).closePath().fill(pal.bloom).stroke(HAIR);
    crystal(c.fr, p.x + 10, p.y + 2, 14, 3.5, sheen[i % 4], 2);
  }
  c.amb.add('twinkle', 0xffffff, 3 + c.tier, inYard(c, 0), { sp: 0.14 });
  c.amb.add('shard', pal.rock, 2 + stage * 2, inYard(c), { amp: 10, sp: 0.08, h: 90 });
  if (stage >= 1) c.amb.add('shard', pal.leaf, 1 + stage, inYard(c, 0.3), { amp: 8, sp: 0.1, h: 70 });
}

const BIOMES: Record<string, (c: BiomeCtx) => void> = { fire, water, nature, earth, storm, magic, cosmic, void: voidB, ice, sound, shadow, time, light, crystal: crystalB };
