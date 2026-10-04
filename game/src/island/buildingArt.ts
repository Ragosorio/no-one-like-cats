/**
 * Island building art (code-drawn, poster flat colors + ink). Every function returns containers whose
 * origin is the CENTER of the building's anchor tile (isoToScreen(gx, gy) of its top-left tile).
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { TW, TH } from './iso';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { elementFx } from '../art/catArt';
import { glowTexture } from '../art/textures';
import { elementIcon } from '../ui/elementIcon';
import { DROP, shade, mixColor } from './terrain';

const INK = { width: 3, color: C.ink, join: 'round' as const, cap: 'round' as const };
const THIN = { width: 2, color: C.ink, join: 'round' as const, cap: 'round' as const };
const hw = TW / 2;
const hh = TH / 2;

/** tile coords (relative to anchor tile center) → local px */
export const P = (gx: number, gy: number) => ({ x: (gx - gy) * hw, y: (gx + gy) * hh });

export function centerOf(fw: number, fh: number) {
  return P(fw / 2 - 0.5, fh / 2 - 0.5);
}

/** iso box occupying [ox, ox+fw]×[oy, oy+fh] (tile units, corners at -0.5) */
export function isoBoxAt(g: Graphics, ox: number, oy: number, fw: number, fh: number, height: number, color: number, inset = 0.12, lift = 0) {
  const i = inset;
  const top = P(ox + i - 0.5, oy + i - 0.5);
  const right = P(ox + fw - 0.5 - i, oy + i - 0.5);
  const bottom = P(ox + fw - 0.5 - i, oy + fh - 0.5 - i);
  const left = P(ox + i - 0.5, oy + fh - 0.5 - i);
  for (const p of [top, right, bottom, left]) p.y -= lift;
  const up = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - height });
  const tT = up(top);
  const tR = up(right);
  const tB = up(bottom);
  const tL = up(left);
  g.poly([tL.x, tL.y, tB.x, tB.y, bottom.x, bottom.y, left.x, left.y]).fill(shade(color, 0.8)).stroke(INK);
  g.poly([tB.x, tB.y, tR.x, tR.y, right.x, right.y, bottom.x, bottom.y]).fill(shade(color, 0.62)).stroke(INK);
  g.poly([tT.x, tT.y, tR.x, tR.y, tB.x, tB.y, tL.x, tL.y]).fill(color).stroke(INK);
  return { tT, tR, tB, tL, top, right, bottom, left };
}
export function isoBox(g: Graphics, fw: number, fh: number, height: number, color: number, inset = 0.12) {
  return isoBoxAt(g, 0, 0, fw, fh, height, color, inset);
}

/** Diamond footprint fill (ground decal) */
export function footprint(g: Graphics, fw: number, fh: number, color: number, alpha = 1, inset = 0.05, stroke = true) {
  const a = P(inset - 0.5, inset - 0.5);
  const b = P(fw - 0.5 - inset, inset - 0.5);
  const c = P(fw - 0.5 - inset, fh - 0.5 - inset);
  const d = P(inset - 0.5, fh - 0.5 - inset);
  g.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).fill({ color, alpha });
  if (stroke) g.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).stroke({ width: 3, color: C.ink, alpha: 0.7, join: 'round' });
  return { a, b, c, d };
}

function dashedPoly(g: Graphics, pts: { x: number; y: number }[], dash = 14, gap = 10, style = { width: 3, color: C.ink, alpha: 0.6 }) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    for (let d = 0; d < len; d += dash + gap) {
      const e = Math.min(len, d + dash);
      g.moveTo(a.x + ux * d, a.y + uy * d).lineTo(a.x + ux * e, a.y + uy * e);
    }
  }
  g.stroke({ ...style, cap: 'round' });
}

// =====================================================================================  HABITAT
export interface HabitatParts {
  ground: Container;
  back: Container;
  front: Container;
  /** local point above the house roof (for bubbles) */
  roof: { x: number; y: number };
}

const TIER_FENCE = [0xf2e6cf, 0xf2e6cf, 0xd9b07a, 0xd9b07a, 0xff9fb4, 0xffd77a, 0xffd77a, 0xb7a4c7, 0x8a5cff];

function fenceEdge(g: Graphics, a: { gx: number; gy: number }, b: { gx: number; gy: number }, color: number, gapAt = -1) {
  const n = Math.round(Math.hypot(b.gx - a.gx, b.gy - a.gy) * 3);
  const pts: { x: number; y: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    pts.push(P(a.gx + (b.gx - a.gx) * f, a.gy + (b.gy - a.gy) * f));
  }
  const skip = (k: number) => gapAt >= 0 && Math.abs(k - gapAt) <= 1;
  // rails
  for (const h of [9, 18]) {
    for (let k = 0; k < n; k++) {
      if (skip(k) || skip(k + 1)) continue;
      g.moveTo(pts[k].x, pts[k].y - h).lineTo(pts[k + 1].x, pts[k + 1].y - h);
    }
    g.stroke({ width: 5, color: C.ink, cap: 'round' });
    for (let k = 0; k < n; k++) {
      if (skip(k) || skip(k + 1)) continue;
      g.moveTo(pts[k].x, pts[k].y - h).lineTo(pts[k + 1].x, pts[k + 1].y - h);
    }
    g.stroke({ width: 2.2, color, cap: 'round' });
  }
  for (let k = 0; k <= n; k++) {
    if (skip(k) && k !== gapAt - 2 && k !== gapAt + 2) continue;
    const p = pts[k];
    g.poly([p.x - 3.5, p.y, p.x - 3.5, p.y - 22, p.x, p.y - 26, p.x + 3.5, p.y - 22, p.x + 3.5, p.y]).fill(color).stroke(THIN);
  }
}

export function habitatParts(element: string, tier: number, fw = 3, fh = 3, building = false): HabitatParts {
  const fx = elementFx(element);
  const ground = new Container();
  const back = new Container();
  const front = new Container();
  // ---- ground: soft tinted soil + inner path
  const gg = new Graphics();
  const soil = mixColor(fx.main, 0xede4d6, 0.62);
  footprint(gg, fw, fh, soil, 0.95, 0.04);
  const inner = mixColor(fx.main, 0xffffff, 0.75);
  const a = P(0.25, 0.25);
  const b = P(fw - 1.25, 0.25);
  const c = P(fw - 1.25, fh - 1.25);
  const d = P(0.25, fh - 1.25);
  gg.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).fill({ color: inner, alpha: 0.55 });
  // stepping stones to the gate
  for (let k = 0; k < 3; k++) {
    const p = P(0.6 + k * 0.45, fh - 0.9 + k * 0.18);
    gg.ellipse(p.x, p.y, 10, 5).fill(0xf7f0e2).stroke({ width: 2, color: C.ink, alpha: 0.6 });
  }
  ground.addChild(gg);
  // a yarn ball to chase
  if (!building) {
    const yb = new Graphics();
    const yp = P(fw - 1.6, fh - 1.3);
    const col = [0xff7ab8, 0xe8879a, 0xa7e8d7, 0xffc94a][(element.length + tier) % 4];
    yb.moveTo(yp.x + 8, yp.y + 2).quadraticCurveTo(yp.x + 30, yp.y + 14, yp.x + 46, yp.y + 2).stroke({ width: 2, color: col });
    yb.circle(yp.x, yp.y - 6, 9).fill(col).stroke({ width: 2.5, color: C.ink });
    yb.moveTo(yp.x - 6, yp.y - 10).quadraticCurveTo(yp.x, yp.y - 2, yp.x + 6, yp.y - 11).stroke({ width: 1.5, color: C.ink, alpha: 0.6 });
    yb.moveTo(yp.x - 7, yp.y - 4).quadraticCurveTo(yp.x + 1, yp.y + 2, yp.x + 7, yp.y - 5).stroke({ width: 1.5, color: C.ink, alpha: 0.6 });
    ground.addChild(yb);
    // food bowl
    const bw = new Graphics();
    const bp = P(0.9, fh - 1.1);
    bw.ellipse(bp.x, bp.y, 14, 6).fill(C.red).stroke({ width: 2.5, color: C.ink });
    bw.ellipse(bp.x, bp.y - 2, 10, 3.5).fill(0x7fd8ff);
    ground.addChild(bw);
  }
  if (building) {
    const dg = new Graphics();
    dashedPoly(dg, [P(-0.45, -0.45), P(fw - 0.55, -0.45), P(fw - 0.55, fh - 0.55), P(-0.45, fh - 0.55)]);
    ground.addChild(dg);
  }
  // ---- fences
  const fcol = TIER_FENCE[Math.min(TIER_FENCE.length - 1, tier)];
  const fb = new Graphics();
  fenceEdge(fb, { gx: -0.45, gy: -0.45 }, { gx: fw - 0.55, gy: -0.45 }, fcol);
  fenceEdge(fb, { gx: -0.45, gy: -0.45 }, { gx: -0.45, gy: fh - 0.55 }, fcol);
  back.addChild(fb);
  const ff = new Graphics();
  fenceEdge(ff, { gx: fw - 0.55, gy: -0.45 }, { gx: fw - 0.55, gy: fh - 0.55 }, fcol);
  fenceEdge(ff, { gx: -0.45, gy: fh - 0.55 }, { gx: fw - 0.55, gy: fh - 0.55 }, fcol, 4);
  front.addChild(ff);
  // element sign on the front fence
  const sp = P(fw - 0.55, fh * 0.55);
  const sign = new Container();
  const sg = new Graphics().rect(-17, -40, 34, 30).fill(C.ink).rect(-19, -43, 34, 30).fill(C.paper).stroke(THIN);
  sg.rect(-2, -14, 4, 14).fill(0x8a5a2e).stroke(THIN);
  const em = elementIcon(element, 24);
  em.position.set(-2, -28);
  sign.addChild(sg, em);
  sign.position.set(sp.x + 4, sp.y);
  front.addChild(sign);
  // ---- house at the back corner
  const house = habitatHouse(element, Math.max(1, tier));
  const hp = P(0.15, 0.15);
  house.c.position.set(hp.x, hp.y);
  back.addChild(house.c);
  // element prop on the right corner
  const prop = elementProp(element);
  const pp = P(fw - 1.1, 0.1);
  prop.position.set(pp.x, pp.y);
  back.addChild(prop);
  return { ground, back, front, roof: { x: hp.x, y: hp.y + house.top } };
}

/** element-flavored yard prop */
function elementProp(el: string): Container {
  const c = new Container();
  const g = new Graphics();
  const fx = elementFx(el);
  c.addChild(g);
  g.ellipse(0, 2, 16, 6).fill({ color: C.ink, alpha: 0.15 });
  switch (el) {
    case 'fire': {
      g.poly([-12, 0, -9, -14, 9, -14, 12, 0]).fill(0x6b6b6b).stroke(THIN);
      g.moveTo(-8, -14).bezierCurveTo(-10, -30, 0, -28, 0, -40).bezierCurveTo(4, -28, 12, -30, 8, -14).closePath().fill(C.orange).stroke(THIN);
      g.moveTo(-3, -14).bezierCurveTo(-4, -22, 0, -22, 0, -28).bezierCurveTo(2, -22, 5, -22, 3, -14).closePath().fill(C.yellow);
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = C.orange;
      gl.alpha = 0.5;
      gl.scale.set(0.6);
      gl.y = -22;
      c.addChildAt(gl, 0);
      break;
    }
    case 'water':
      g.ellipse(0, 0, 22, 10).fill(0x7fd8ff).stroke(INK);
      g.ellipse(-4, -1, 8, 3).fill({ color: 0xffffff, alpha: 0.6 });
      g.ellipse(14, -4, 5, 3).fill(0x5fbf4a).stroke({ width: 1.5, color: C.ink });
      break;
    case 'nature':
      for (const [x, col] of [
        [-10, 0xff7ab8],
        [0, C.yellow],
        [10, 0xffffff],
      ] as const) {
        g.moveTo(x, 0).lineTo(x, -16).stroke({ width: 2.5, color: 0x3f7a3a });
        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * Math.PI * 2;
          g.circle(x + Math.cos(ang) * 5, -18 + Math.sin(ang) * 4, 3.4).fill(col).stroke({ width: 1, color: C.ink });
        }
        g.circle(x, -18, 2.5).fill(C.orange);
      }
      break;
    case 'earth': {
      // rock cairn + a fossil bone sticking out (Gea approves)
      g.poly([-16, 0, -14, -10, -4, -14, 6, -12, 14, -4, 12, 2]).fill(0x9a8f80).stroke(THIN);
      g.poly([-10, -12, -8, -22, 0, -26, 8, -20, 6, -12]).fill(0xb7a99a).stroke(THIN);
      g.poly([-4, -24, -2, -32, 4, -32, 4, -24]).fill(0x8d8676).stroke(THIN);
      g.moveTo(8, -6).lineTo(22, -14).stroke({ width: 5, color: C.ink, cap: 'round' });
      g.moveTo(8, -6).lineTo(22, -14).stroke({ width: 2.5, color: 0xf2e6cf, cap: 'round' });
      g.circle(23, -16, 3).fill(0xf2e6cf).stroke({ width: 1.5, color: C.ink });
      g.circle(21, -12, 3).fill(0xf2e6cf).stroke({ width: 1.5, color: C.ink });
      const cr = new Graphics();
      cr.poly([-18, -2, -22, -12, -16, -20, -13, -8]).fill(fx.accent).stroke(THIN);
      c.addChild(cr);
      break;
    }
    case 'storm': {
      // tesla coil with a tiny grumpy cloud
      g.rect(-5, -30, 10, 30).fill(0x6b6b6b).stroke(THIN);
      for (let y = -26; y < 0; y += 6) g.moveTo(-7, y).lineTo(7, y + 2).stroke({ width: 2, color: 0xb87333 });
      g.circle(0, -36, 8).fill(0xd9d9d9).stroke(THIN);
      const cloud = new Graphics();
      for (const [x, y, r] of [
        [-12, -58, 9],
        [0, -62, 11],
        [12, -58, 9],
      ])
        cloud.circle(x, y, r).fill(0x5a6476).stroke(THIN);
      cloud.rect(-12, -58, 24, 8).fill(0x5a6476);
      cloud.poly([2, -50, -4, -42, 1, -42, -3, -34, 6, -44, 1, -44, 5, -50]).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = fx.accent;
      gl.alpha = 0.45;
      gl.scale.set(0.5);
      gl.y = -38;
      c.addChildAt(gl, 0);
      c.addChild(cloud);
      break;
    }
    case 'magic': {
      g.rect(-8, -14, 16, 14).fill(0x5c3d5b).stroke(THIN);
      const book = new Graphics();
      book.poly([-16, -34, 0, -30, 16, -34, 16, -24, 0, -20, -16, -24]).fill(C.paper).stroke(THIN);
      book.moveTo(0, -30).lineTo(0, -20).stroke({ width: 2, color: C.ink });
      book.star(0, -46, 4, 6, 2.5).fill(fx.accent).stroke({ width: 1.5, color: C.ink });
      c.addChild(book);
      break;
    }
    case 'cosmic': {
      g.circle(0, -20, 12).fill(0x372347).stroke(THIN);
      g.ellipse(0, -20, 22, 6).stroke({ width: 3, color: fx.accent });
      g.circle(-4, -24, 3).fill({ color: 0xffffff, alpha: 0.6 });
      g.star(14, -38, 4, 5, 2).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
      break;
    }
    default: {
      g.poly([-8, 0, -11, -18, -4, -30, 0, -14]).fill(fx.main).stroke(THIN);
      g.poly([0, 0, 3, -34, 9, -40, 12, -18, 8, 0]).fill(fx.accent).stroke(THIN);
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = fx.main;
      gl.alpha = 0.4;
      gl.scale.set(0.5);
      gl.y = -18;
      c.addChildAt(gl, 0);
    }
  }
  return c;
}

/** the little house per tier. Returns container + local y of its top. */
export function habitatHouse(element: string, tier: number): { c: Container; top: number } {
  const fx = elementFx(element);
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = fx.accent;
  glow.alpha = 0.22;
  glow.scale.set(1.5);
  c.addChildAt(glow, 0);
  let top = -60;
  const flag = (x: number, y: number) => {
    g.moveTo(x, y).lineTo(x, y - 30).stroke({ width: 3, color: C.ink });
    g.poly([x, y - 30, x + 22, y - 25, x, y - 18]).fill(fx.main).stroke(THIN);
  };
  switch (tier) {
    case 1: {
      // Caja de Cartón: open box with flaps
      const box = isoBoxAt(g, -0.5, -0.5, 1.1, 1.1, 38, 0xc99a62, 0.1);
      g.poly([box.tL.x, box.tL.y, box.tT.x, box.tT.y, box.tT.x - 18, box.tT.y - 22, box.tL.x - 18, box.tL.y - 22]).fill(0xd9ad75).stroke(INK);
      g.poly([box.tT.x, box.tT.y, box.tR.x, box.tR.y, box.tR.x + 16, box.tR.y - 24, box.tT.x + 16, box.tT.y - 24]).fill(0xd9ad75).stroke(INK);
      g.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, box.tB.x - 10, box.tB.y + 16, box.tL.x - 14, box.tL.y + 12]).fill(0xb8864e).stroke(INK);
      // tape + paw
      const mx = (box.left.x + box.bottom.x) / 2;
      const my = (box.left.y + box.bottom.y) / 2 - 18;
      g.circle(mx, my + 3, 5).fill(0x8a5a2e);
      for (const [dx, dy] of [
        [-6, -4],
        [-2, -8],
        [3, -8],
        [7, -4],
      ])
        g.circle(mx + dx, my + dy, 2).fill(0x8a5a2e);
      g.moveTo(box.tB.x, box.tB.y).lineTo(box.bottom.x, box.bottom.y).stroke({ width: 4, color: fx.main });
      flag(box.tR.x - 4, box.tR.y - 18);
      top = box.tT.y - 40;
      break;
    }
    case 2: {
      // Cesta de Mimbre
      const y0 = 4;
      g.ellipse(0, y0, 54, 26).fill(0xb8864e).stroke(INK);
      g.rect(-54, y0 - 34, 108, 34).fill(0xc99a62);
      g.ellipse(0, y0 - 34, 54, 24).fill(0xd9ad75).stroke(INK);
      g.moveTo(-54, y0 - 34).lineTo(-54, y0).moveTo(54, y0 - 34).lineTo(54, y0).stroke(INK);
      for (let k = -4; k <= 4; k++) g.moveTo(k * 12, y0 - 10 - Math.abs(k) * 0.5).lineTo(k * 12, y0 + 22 - Math.abs(k) * 1.8).stroke({ width: 2, color: 0x8a5a2e });
      for (let r = 0; r < 3; r++) g.moveTo(-52, y0 - 26 + r * 10).quadraticCurveTo(0, y0 - 6 + r * 10, 52, y0 - 26 + r * 10).stroke({ width: 2, color: 0x8a5a2e });
      g.ellipse(0, y0 - 36, 42, 17).fill(fx.main).stroke(THIN);
      g.ellipse(-8, y0 - 40, 14, 5).fill({ color: 0xffffff, alpha: 0.35 });
      g.moveTo(-40, y0 - 40).bezierCurveTo(-40, y0 - 100, 40, y0 - 100, 40, y0 - 40).stroke({ width: 8, color: C.ink });
      g.moveTo(-40, y0 - 40).bezierCurveTo(-40, y0 - 100, 40, y0 - 100, 40, y0 - 40).stroke({ width: 4, color: 0xc99a62 });
      top = y0 - 96;
      break;
    }
    case 3: {
      // Torre Rascadora
      g.ellipse(0, 6, 46, 20).fill(shade(fx.main, 0.8)).stroke(INK);
      for (const x of [-22, 18]) {
        g.rect(x - 7, -110, 14, 114).fill(0xe0c497).stroke(INK);
        for (let y = -104; y < 0; y += 9) g.moveTo(x - 7, y).lineTo(x + 7, y + 5).stroke({ width: 1.5, color: 0x8a5a2e });
      }
      g.ellipse(18, -54, 34, 13).fill(fx.main).stroke(INK);
      g.ellipse(-22, -82, 32, 12).fill(fx.main).stroke(INK);
      g.ellipse(-2, -116, 40, 15).fill(shade(fx.main, 1.15)).stroke(INK);
      // little box on top
      g.poly([-22, -122, -2, -132, 18, -122, 18, -140, -2, -150, -22, -140]).fill(fx.dark === 0x000000 ? 0x333333 : shade(fx.main, 0.7)).stroke(INK);
      g.ellipse(-4, -132, 7, 9).fill(C.ink);
      g.circle(30, -40, 6).fill(C.red).stroke(THIN);
      g.moveTo(30, -46).lineTo(30, -54).stroke(THIN);
      top = -156;
      break;
    }
    case 4: {
      top = casitaCoral(g, c, element);
      break;
    }
    case 5: {
      top = palacioCojines(g, c, element);
      break;
    }
    case 6: {
      top = temploRonroneo(g, c, element);
      break;
    }
    default: {
      // tiers 5–8: palace / temple / arcane / celestial — stacked and taller, element trims
      const lvl = tier - 4;
      const base = tier >= 8 ? 0x231626 : tier >= 7 ? 0x5c3d5b : tier >= 6 ? 0xede4d6 : 0xffd2dc;
      const box = isoBoxAt(g, -0.6, -0.6, 1.3, 1.3, 46 + lvl * 8, base, 0.06);
      const roofH = 30 + lvl * 8;
      const roof = tier === 6 ? 0xc8102e : tier === 5 ? fx.main : tier === 7 ? C.violet : 0x0d110f;
      const apexY = box.tT.y + (box.tB.y - box.tT.y) / 2 - roofH;
      if (tier === 6) {
        // pagoda: two eaves
        for (const k of [0, 1]) {
          const lift = k * 26;
          const e = 18 - k * 8;
          g.poly([box.tL.x - e, box.tL.y - lift + 6, box.tB.x, box.tB.y + e * 0.5 - lift + 6, box.tR.x + e, box.tR.y - lift + 6, box.tT.x, box.tT.y - e * 0.5 - lift + 6, box.tL.x - e, box.tL.y - lift + 6])
            .fill(roof)
            .stroke(INK);
        }
        g.poly([box.tL.x + 14, box.tL.y - 40, box.tB.x, box.tB.y - 40, box.tR.x - 14, box.tR.y - 40, box.tT.x, apexY - 30]).fill(shade(roof, 0.8)).stroke(INK);
        top = apexY - 40;
      } else if (tier === 8) {
        g.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, box.tR.x, box.tR.y, box.tT.x, box.tT.y]).fill(0x372347).stroke(INK);
        const orb = new Graphics();
        orb.circle(0, apexY - 20, 26).fill(C.cyan).stroke(INK);
        orb.circle(-8, apexY - 28, 8).fill({ color: 0xffffff, alpha: 0.6 });
        orb.ellipse(0, apexY - 20, 46, 12).stroke({ width: 3, color: C.pinkHot });
        c.addChild(orb);
        top = apexY - 56;
      } else {
        g.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, box.tB.x, box.tB.y, box.tT.x, apexY]).fill(shade(roof, 1.1)).stroke(INK);
        g.poly([box.tB.x, box.tB.y, box.tR.x, box.tR.y, box.tT.x, apexY]).fill(shade(roof, 0.8)).stroke(INK);
        g.circle(box.tT.x, apexY - 8, 7).fill(C.yellow).stroke(THIN);
        top = apexY - 20;
      }
      const dx = (box.left.x + box.bottom.x) / 2;
      const dy = (box.left.y + box.bottom.y) / 2;
      g.moveTo(dx - 10, dy).bezierCurveTo(dx - 10, dy - 30, dx + 10, dy - 30, dx + 10, dy + 4).closePath().fill(C.ink);
      g.moveTo(box.left.x, box.left.y - 10).lineTo(box.bottom.x, box.bottom.y - 10).stroke({ width: 4, color: tier >= 5 ? C.gold : fx.main });
      if (tier === 7) {
        for (let k = 0; k < 3; k++) g.star(-40 + k * 40, apexY + 10 - (k % 2) * 16, 4, 7, 3).fill(C.mint).stroke(THIN);
      }
      flag(box.tR.x - 4, box.tR.y);
    }
  }
  return { c, top };
}

// ------------------------------------------------------------------ tiers 4–6 (M2): each tier its own silhouette, each element its own trims
/** element trims used by tiers 4–6 */
function trims(el: string) {
  const fx = elementFx(el);
  const map: Record<string, { roof: number; glass: number; stone: number; banner: number }> = {
    fire: { roof: 0xc8102e, glass: C.yellow, stone: 0xd9b07a, banner: C.orange },
    water: { roof: 0x3569a3, glass: 0x7fd8ff, stone: 0xcfe3ea, banner: 0x7fd8ff },
    nature: { roof: 0x3f8a3f, glass: 0xd4f27a, stone: 0xd9cdb8, banner: 0x5fbf4a },
    earth: { roof: 0x8a5a2e, glass: 0xe0b77a, stone: 0xb7a99a, banner: 0xa8743f },
    storm: { roof: 0x1f2b4a, glass: C.cyan, stone: 0xc9ccd6, banner: C.yellow },
    magic: { roof: 0x5c3d5b, glass: 0xff7ab8, stone: 0xb7a4c7, banner: 0x8a5cff },
    cosmic: { roof: 0x231626, glass: C.cyan, stone: 0x6d5a80, banner: 0x8a5cff },
  };
  return { fx, ...(map[el] ?? map.fire) };
}

/** little element "topper" on finials (flame, drop, leaf, rock, bolt, star, planet) */
function topper(g: Graphics, x: number, y: number, el: string, s = 1) {
  const fx = elementFx(el);
  switch (el) {
    case 'fire':
      g.moveTo(x, y - 18 * s).bezierCurveTo(x + 10 * s, y - 8 * s, x + 8 * s, y, x, y).bezierCurveTo(x - 8 * s, y, x - 10 * s, y - 8 * s, x, y - 18 * s).fill(C.orange).stroke(THIN);
      g.ellipse(x, y - 5 * s, 3.5 * s, 5 * s).fill(C.yellow);
      break;
    case 'water':
      g.moveTo(x, y - 18 * s).quadraticCurveTo(x + 9 * s, y - 4 * s, x, y).quadraticCurveTo(x - 9 * s, y - 4 * s, x, y - 18 * s).fill(0x7fd8ff).stroke(THIN);
      g.circle(x - 2 * s, y - 6 * s, 2 * s).fill({ color: 0xffffff, alpha: 0.7 });
      break;
    case 'nature':
      g.moveTo(x, y).quadraticCurveTo(x - 12 * s, y - 10 * s, x, y - 20 * s).quadraticCurveTo(x + 12 * s, y - 10 * s, x, y).fill(0x5fbf4a).stroke(THIN);
      g.moveTo(x, y).lineTo(x, y - 16 * s).stroke({ width: 1.5, color: C.ink });
      break;
    case 'earth':
      g.poly([x - 8 * s, y, x - 6 * s, y - 12 * s, x + 2 * s, y - 18 * s, x + 8 * s, y - 8 * s, x + 6 * s, y]).fill(fx.accent).stroke(THIN);
      break;
    case 'storm':
      g.poly([x + 2 * s, y - 20 * s, x - 7 * s, y - 6 * s, x, y - 7 * s, x - 4 * s, y + 2 * s, x + 8 * s, y - 11 * s, x + 1 * s, y - 10 * s]).fill(C.yellow).stroke(THIN);
      break;
    case 'cosmic':
      g.circle(x, y - 9 * s, 7 * s).fill(0x8a5cff).stroke(THIN);
      g.ellipse(x, y - 9 * s, 13 * s, 3.5 * s).stroke({ width: 2, color: C.cyan });
      break;
    default:
      g.star(x, y - 9 * s, 5, 9 * s, 4 * s).fill(fx.accent).stroke(THIN);
  }
}

function glowAt(c: Container, x: number, y: number, tint: number, alpha = 0.4, scale = 0.6) {
  const gl = new Sprite(glowTexture());
  gl.anchor.set(0.5);
  gl.tint = tint;
  gl.alpha = alpha;
  gl.scale.set(scale);
  gl.position.set(x, y);
  c.addChildAt(gl, 0);
  return gl;
}

/** Tier 4 · Casita de Coral: bulbous coral dome + side bulb + turret, sea-weed, element turret/topper */
function casitaCoral(g: Graphics, c: Container, el: string) {
  const t = trims(el);
  const coral = el === 'earth' ? 0xf2b48a : el === 'storm' ? 0xc9b6e8 : 0xff9fb4;
  const coralD = shade(coral, 0.82);
  g.ellipse(0, 8, 62, 22).fill(0xf2dca8).stroke(INK);
  // seaweed
  for (const [x, h, col] of [
    [-54, 30, 0x3f8a3f],
    [-44, 22, 0x5fbf4a],
    [50, 26, 0x3f8a3f],
  ] as const)
    g.moveTo(x, 6).bezierCurveTo(x - 8, -h * 0.4, x + 8, -h * 0.7, x, -h).stroke({ width: 4, color: col, cap: 'round' });
  // side bulb
  g.moveTo(14, 6).bezierCurveTo(14, -40, 66, -40, 62, 6).closePath().fill(coralD).stroke(INK);
  // main dome
  g.moveTo(-50, 6).bezierCurveTo(-58, -92, 46, -92, 40, 6).closePath().fill(coral).stroke(INK);
  for (const [x, y, r] of [
    [-28, -36, 7],
    [-6, -62, 5],
    [16, -40, 6],
    [-36, -12, 5],
    [46, -14, 4],
    [30, -20, 3],
  ])
    g.circle(x, y, r).fill(shade(coral, 1.12)).stroke({ width: 1.5, color: C.ink });
  // door with element frame + porthole
  g.moveTo(-18, 6).bezierCurveTo(-18, -32, 8, -32, 8, 6).closePath().fill(t.roof).stroke(INK);
  g.moveTo(-12, 6).bezierCurveTo(-12, -24, 2, -24, 2, 6).closePath().fill(C.ink);
  g.circle(24, -58, 10).fill(t.glass).stroke(INK);
  g.circle(21, -61, 3).fill({ color: 0xffffff, alpha: 0.7 });
  // turret
  g.rect(-44, -96, 18, 44).fill(coralD).stroke(INK);
  g.poly([-50, -96, -35, -122, -20, -96]).fill(t.roof).stroke(INK);
  topper(g, -35, -122, el, 0.9);
  // shells
  g.moveTo(-58, 2).quadraticCurveTo(-52, -10, -46, 2).closePath().fill(0xfff1e0).stroke(THIN);
  glowAt(c, 24, -58, t.glass, 0.35, 0.4);
  return -140;
}

/** Tier 5 · Palacio de Cojines: tower of fat cushions with tassels, onion dome, element banners */
function palacioCojines(g: Graphics, c: Container, el: string) {
  const t = trims(el);
  const fx = t.fx;
  const box = isoBoxAt(g, -0.62, -0.62, 1.34, 1.34, 14, t.stone, 0.04);
  void box;
  const cushion = (y: number, rx: number, col: number) => {
    const ry = rx * 0.42;
    g.ellipse(0, y + 12, rx, ry).fill(shade(col, 0.7)).stroke(INK);
    g.rect(-rx, y, rx * 2, 12).fill(shade(col, 0.7));
    g.moveTo(-rx, y).lineTo(-rx, y + 12).moveTo(rx, y).lineTo(rx, y + 12).stroke(INK);
    g.ellipse(0, y, rx, ry).fill(col).stroke(INK);
    // button + stitch
    g.circle(0, y, 4).fill(shade(col, 0.6)).stroke({ width: 1.5, color: C.ink });
    g.moveTo(-rx * 0.55, y - ry * 0.3).quadraticCurveTo(0, y + ry * 0.35, rx * 0.55, y - ry * 0.3).stroke({ width: 1.5, color: shade(col, 0.6) });
    // tassels at the 2 visible corners
    for (const sx of [-1, 1]) {
      const tx = sx * rx * 0.96;
      g.moveTo(tx, y + 6).lineTo(tx, y + 20).stroke({ width: 2, color: C.ink });
      g.poly([tx - 4, y + 18, tx + 4, y + 18, tx + 2, y + 28, tx - 2, y + 28]).fill(C.gold).stroke({ width: 1.5, color: C.ink });
    }
  };
  const cols = [fx.main, 0xff9fb4, t.banner === fx.main ? 0xffd77a : t.banner];
  cushion(-34, 60, cols[0]);
  cushion(-66, 48, cols[1]);
  cushion(-94, 36, cols[2]);
  // arched door in the bottom cushion
  g.moveTo(-14, -16).bezierCurveTo(-14, -42, 14, -42, 14, -16).closePath().fill(C.ink).stroke(INK);
  g.rect(-16, -18, 32, 4).fill(C.gold).stroke({ width: 1.5, color: C.ink });
  // onion dome
  const dy = -112;
  g.moveTo(-20, dy).bezierCurveTo(-30, dy - 26, -6, dy - 36, 0, dy - 52).bezierCurveTo(6, dy - 36, 30, dy - 26, 20, dy).closePath().fill(t.roof).stroke(INK);
  g.moveTo(-8, dy - 8).quadraticCurveTo(-12, dy - 26, -2, dy - 40).stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
  g.rect(-22, dy - 2, 44, 6).fill(C.gold).stroke(THIN);
  g.moveTo(0, dy - 52).lineTo(0, dy - 64).stroke({ width: 3, color: C.ink });
  topper(g, 0, dy - 62, el, 0.8);
  // hanging banners
  for (const sx of [-1, 1]) {
    const bx = sx * 44;
    g.moveTo(bx, -60).lineTo(bx, -30).lineTo(bx + sx * 8, -24).lineTo(bx + sx * 16, -30).lineTo(bx + sx * 16, -62).closePath().fill(t.banner).stroke(THIN);
    g.circle(bx + sx * 8, -46, 3.5).fill(C.paper).stroke({ width: 1, color: C.ink });
  }
  glowAt(c, 0, -80, fx.accent, 0.25, 1.4);
  return dy - 80;
}

/** Tier 6 · Templo del Ronroneo: stepped plinth, three upturned eaves, golden bell + paw emblem, element lanterns */
function temploRonroneo(g: Graphics, c: Container, el: string) {
  const t = trims(el);
  const fx = t.fx;
  isoBoxAt(g, -0.7, -0.7, 1.5, 1.5, 10, 0xb7a99a, 0.02);
  isoBoxAt(g, -0.6, -0.6, 1.3, 1.3, 10, t.stone, 0.04, 10);
  const body = isoBoxAt(g, -0.42, -0.42, 0.96, 0.96, 46, 0xede4d6, 0.04, 20);
  // red pillars on the two visible faces
  for (const f of [0.15, 0.85]) {
    const a = { x: body.left.x + (body.bottom.x - body.left.x) * f, y: body.left.y + (body.bottom.y - body.left.y) * f };
    const b = { x: body.bottom.x + (body.right.x - body.bottom.x) * f, y: body.bottom.y + (body.right.y - body.bottom.y) * f };
    for (const p of [a, b]) g.rect(p.x - 3.5, p.y - 46, 7, 46).fill(C.red).stroke(THIN);
  }
  // door (left face) + paw emblem (right face)
  const dl = { x: (body.left.x + body.bottom.x) / 2, y: (body.left.y + body.bottom.y) / 2 };
  g.poly([dl.x - 10, dl.y, dl.x - 10, dl.y - 26, dl.x + 10, dl.y - 32, dl.x + 10, dl.y - 6]).fill(C.ink);
  const dr = { x: (body.bottom.x + body.right.x) / 2, y: (body.bottom.y + body.right.y) / 2 - 24 };
  g.circle(dr.x, dr.y, 11).fill(C.gold).stroke(THIN);
  g.ellipse(dr.x, dr.y + 3, 4.5, 3.5).fill(C.ink);
  for (const [dx, dy] of [
    [-5, -3],
    [-2, -6],
    [2, -6],
    [5, -3],
  ])
    g.circle(dr.x + dx, dr.y + dy, 1.8).fill(C.ink);
  glowAt(c, dr.x, dr.y, C.yellow, 0.4, 0.45);
  // three eaves with upturned tips
  const roof = t.roof === 0x231626 ? 0x5c3d5b : el === 'fire' || el === 'nature' ? 0xc8102e : t.roof;
  const eave = (y: number, half: number, depth: number) => {
    const L = { x: -half, y }, R = { x: half, y }, T = { x: 0, y: y - depth }, B = { x: 0, y: y + depth };
    g.poly([L.x, L.y, T.x, T.y, R.x, R.y, B.x, B.y]).fill(shade(roof, 0.75)).stroke(INK);
    g.poly([L.x - 8, L.y - 8, L.x, L.y, B.x, B.y + 4, R.x, R.y, R.x + 8, R.y - 8, R.x - 4, R.y + 6, B.x, B.y + 12, L.x + 4, L.y + 6]).fill(roof).stroke(INK);
    g.moveTo(L.x + 4, L.y + 6).lineTo(B.x, B.y + 12).lineTo(R.x - 4, R.y + 6).stroke({ width: 2.5, color: C.gold });
  };
  eave(-62, 66, 26);
  g.rect(-24, -96, 48, 26).fill(0xede4d6).stroke(INK);
  for (const x of [-18, 12]) g.rect(x, -96, 6, 26).fill(C.red).stroke({ width: 1.5, color: C.ink });
  eave(-98, 48, 19);
  g.rect(-14, -124, 28, 20).fill(0xede4d6).stroke(INK);
  eave(-126, 32, 13);
  // bell under the first eave
  g.moveTo(-40, -50).lineTo(-40, -42).stroke({ width: 2, color: C.ink });
  g.moveTo(-47, -30).bezierCurveTo(-47, -46, -33, -46, -33, -30).closePath().fill(C.gold).stroke(THIN);
  g.circle(-40, -29, 2.5).fill(C.ink);
  // finial
  g.rect(-2, -160, 4, 26).fill(C.gold).stroke({ width: 1.5, color: C.ink });
  for (const y of [-146, -138]) g.circle(0, y, 5).fill(C.gold).stroke({ width: 1.5, color: C.ink });
  topper(g, 0, -160, el, 0.9);
  // element lanterns on poles
  for (const sx of [-1, 1]) {
    const lx = sx * 60;
    const ly = 18;
    g.rect(lx - 2, ly - 46, 4, 46).fill(0x6a4325).stroke({ width: 1.5, color: C.ink });
    g.roundRect(lx - 8, ly - 62, 16, 18, 4).fill(fx.accent).stroke(THIN);
    g.poly([lx - 10, ly - 62, lx, ly - 70, lx + 10, ly - 62]).fill(roof).stroke({ width: 1.5, color: C.ink });
    glowAt(c, lx, ly - 54, fx.accent, 0.5, 0.35);
  }
  glowAt(c, 0, -90, fx.main, 0.18, 1.6);
  return -186;
}

/** scaffolding drawn over a plot while it's being built/upgraded */
export function scaffoldArt(fw = 1.3, fh = 1.3): Container {
  const c = new Container();
  const g = new Graphics();
  const pts = [P(-0.55, -0.55), P(fw - 0.55, -0.55), P(fw - 0.55, fh - 0.55), P(-0.55, fh - 0.55)];
  const H = 96;
  for (const p of pts) g.rect(p.x - 3, p.y - H, 6, H).fill(0xc99358).stroke(THIN);
  for (const h of [H * 0.45, H * 0.9]) {
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      g.moveTo(a.x, a.y - h).lineTo(b.x, b.y - h);
    }
    g.stroke({ width: 6, color: C.ink, cap: 'round' });
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      g.moveTo(a.x, a.y - h).lineTo(b.x, b.y - h);
    }
    g.stroke({ width: 3, color: 0xe0b77a, cap: 'round' });
  }
  // diagonal brace + hazard plank
  g.moveTo(pts[3].x, pts[3].y).lineTo(pts[2].x, pts[2].y - H * 0.45).stroke({ width: 3, color: 0xc99358 });
  const m = { x: (pts[3].x + pts[2].x) / 2, y: (pts[3].y + pts[2].y) / 2 - 12 };
  g.poly([m.x - 34, m.y - 6, m.x + 34, m.y + 10, m.x + 34, m.y + 22, m.x - 34, m.y + 6]).fill(C.yellow).stroke(THIN);
  for (let k = -2; k <= 2; k++) g.poly([m.x + k * 14 - 4, m.y + k * 3.5 - 2, m.x + k * 14 + 4, m.y + k * 3.5, m.x + k * 14 - 2, m.y + k * 3.5 + 13, m.x + k * 14 - 10, m.y + k * 3.5 + 11]).fill(C.ink);
  c.addChild(g);
  return c;
}

/** empty plot: dashed outline + signpost with a "+" */
export function emptyPlotArt(fw = 3, fh = 3): { ground: Container; sign: Container } {
  const ground = new Container();
  const g = new Graphics();
  footprint(g, fw, fh, 0xfff3d6, 0.35, 0.06, false);
  dashedPoly(g, [P(-0.42, -0.42), P(fw - 0.58, -0.42), P(fw - 0.58, fh - 0.58), P(-0.42, fh - 0.58)], 16, 10, { width: 4, color: C.ink, alpha: 0.55 });
  ground.addChild(g);
  const sign = new Container();
  const s = new Graphics();
  s.rect(-3, -46, 6, 46).fill(0x8a5a2e).stroke(THIN);
  s.rect(-22 + 4, -78 + 4, 44, 36).fill(C.ink);
  s.rect(-22, -78, 44, 36).fill(C.pink).stroke(INK);
  s.rect(-3, -72, 6, 24).fill(C.ink);
  s.rect(-12, -63, 24, 6).fill(C.ink);
  sign.addChild(s);
  return { ground, sign };
}

/** empty cardboard box (homeless cats sit next to it, sad) */
export function emptyBoxArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 4, 30, 10).fill({ color: C.ink, alpha: 0.18 });
  const box = isoBoxAt(g, -0.32, -0.32, 0.55, 0.55, 26, 0xc99a62, 0.02);
  g.poly([box.tL.x, box.tL.y, box.tT.x, box.tT.y, box.tT.x - 10, box.tT.y - 14, box.tL.x - 10, box.tL.y - 14]).fill(0xd9ad75).stroke(THIN);
  g.poly([box.tT.x, box.tT.y, box.tR.x, box.tR.y, box.tR.x + 10, box.tR.y - 14, box.tT.x + 10, box.tT.y - 14]).fill(0xd9ad75).stroke(THIN);
  c.addChild(g);
  return c;
}

// =====================================================================================  FIXED BUILDINGS
/** Santuario de Resonancia (ORQUÍDEA REAL): stone platform, torii, swirling portal, cushions */
export function sanctuaryParts(fw = 3, fh = 3): { c: Container; portal: Container; top: number } {
  const c = new Container();
  const g = new Graphics();
  isoBoxAt(g, 0, 0, fw, fh, 12, 0xb7a4c7, 0.08);
  const plat = new Graphics();
  isoBoxAt(plat, 0.6, 0.6, fw - 1.2, fh - 1.2, 10, 0x8f6b93, 0.05, 12);
  c.addChild(g, plat);
  const ctr = centerOf(fw, fh);
  const portal = new Container();
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = C.pinkHot;
  glow.alpha = 0.7;
  glow.scale.set(1.3, 1.7);
  const ring = new Graphics();
  for (let k = 0; k < 3; k++) ring.arc(0, 0, 34 + k * 9, k, k + Math.PI * 1.2).stroke({ width: 3, color: k === 1 ? C.mint : 0xffffff, alpha: 0.85, cap: 'round' });
  const disc = new Graphics().ellipse(0, 0, 36, 50).fill({ color: C.plumInk, alpha: 0.9 }).stroke({ width: 3, color: C.gold });
  disc.ellipse(0, 0, 22, 34).fill({ color: C.pinkHot, alpha: 0.55 });
  ring.label = 'ring';
  portal.addChild(glow, disc, ring);
  portal.position.set(ctr.x, ctr.y - 92);
  const gate = new Graphics();
  const y0 = ctr.y - 6;
  gate.rect(ctr.x - 78, y0 - 160, 14, 160).fill(C.red).stroke(INK);
  gate.rect(ctr.x + 64, y0 - 160, 14, 160).fill(C.red).stroke(INK);
  gate.poly([ctr.x - 104, y0 - 172, ctr.x + 104, y0 - 172, ctr.x + 96, y0 - 186, ctr.x - 96, y0 - 186]).fill(C.ink);
  gate.rect(ctr.x - 92, y0 - 172, 184, 12).fill(C.gold).stroke(THIN);
  gate.rect(ctr.x - 86, y0 - 144, 172, 12).fill(C.red).stroke(INK);
  gate.rect(ctr.x - 18, y0 - 172, 36, 30).fill(C.plumInk).stroke(THIN);
  // lanterns
  for (const sx of [-1, 1]) {
    const lp = P(sx > 0 ? fw - 0.7 : 0.3, sx > 0 ? 0.3 : fh - 0.7);
    gate.rect(lp.x - 6, lp.y - 40, 12, 40).fill(0xd9cdb8).stroke(THIN);
    gate.rect(lp.x - 12, lp.y - 58, 24, 18).fill(C.yellow).stroke(INK);
    gate.poly([lp.x - 16, lp.y - 58, lp.x, lp.y - 70, lp.x + 16, lp.y - 58]).fill(0xd9cdb8).stroke(THIN);
  }
  // two cushions in front
  for (const [ox, col] of [
    [-0.5, C.pink],
    [0.5, C.mint],
  ] as const) {
    const p = P(fw / 2 - 0.5 + ox + 0.4, fh / 2 - 0.5 - ox + 0.4);
    gate.ellipse(p.x, p.y - 4, 22, 10).fill(col).stroke(INK);
    gate.ellipse(p.x - 5, p.y - 7, 7, 3).fill({ color: 0xffffff, alpha: 0.5 });
  }
  c.addChild(portal, gate);
  return { c, portal, top: y0 - 200 };
}

/** Port / shipyard: wooden deck, warehouse, crane, barrels and a pier into the sea */
export function portArt(facing: 'x' | 'y', fw = 3, fh = 3): { c: Container; top: number } {
  const c = new Container();
  const g = new Graphics();
  // deck planks
  isoBoxAt(g, 0, 0, fw, fh, 8, 0xc99358, 0.04);
  for (let k = 1; k < fw * 3; k++) {
    const a = P(-0.46 + k / 3, -0.46);
    const b = P(-0.46 + k / 3, fh - 0.54);
    g.moveTo(a.x, a.y - 8).lineTo(b.x, b.y - 8).stroke({ width: 1.5, color: 0x8a5a2e, alpha: 0.6 });
  }
  // pier
  const pier = new Graphics();
  const len = 2.2;
  const w = 0.9;
  const ox = facing === 'x' ? fw - 0.5 : fw / 2 - w / 2 - 0.5 + 0.5;
  const oy = facing === 'x' ? fh / 2 - w / 2 - 0.5 + 0.5 : fh - 0.5;
  const q = (dx: number, dy: number) => (facing === 'x' ? P(ox + dx - 0.5, oy + dy - 0.5) : P(ox + dy - 0.5, oy + dx - 0.5));
  const A = q(0, 0);
  const B = q(len, 0);
  const Cc = q(len, w);
  const D = q(0, w);
  for (const p of [B, Cc, q(len * 0.5, 0), q(len * 0.5, w)]) pier.rect(p.x - 4, p.y - 6, 8, DROP + 6).fill(0x6a4325).stroke(THIN);
  pier.poly([A.x, A.y - 6, B.x, B.y - 6, Cc.x, Cc.y - 6, D.x, D.y - 6]).fill(0xb98348).stroke(INK);
  for (let k = 1; k < 7; k++) {
    const f = k / 7;
    const a = { x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f };
    const b = { x: D.x + (Cc.x - D.x) * f, y: D.y + (Cc.y - D.y) * f };
    pier.moveTo(a.x, a.y - 6).lineTo(b.x, b.y - 6).stroke({ width: 1.5, color: 0x6a4325 });
  }
  // warehouse at back
  const hut = new Graphics();
  const box = isoBoxAt(hut, 0, 0, 1.6, 1.4, 60, 0xede4d6, 0.08, 8);
  const apexY = box.tT.y + (box.tB.y - box.tT.y) / 2 - 34;
  const mid = { x: (box.tT.x + box.tR.x) / 2, y: (box.tT.y + box.tR.y) / 2 - 34 };
  const mid2 = { x: (box.tL.x + box.tB.x) / 2, y: (box.tL.y + box.tB.y) / 2 - 34 };
  hut.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, mid2.x + (box.tB.x - box.tL.x) * 0.5, mid2.y + (box.tB.y - box.tL.y) * 0.5, mid2.x - (box.tB.x - box.tL.x) * 0.5, mid2.y - (box.tB.y - box.tL.y) * 0.5]).fill(C.red).stroke(INK);
  hut.poly([box.tB.x, box.tB.y, box.tR.x, box.tR.y, mid.x + (box.tR.x - box.tT.x) * 0.5, mid.y + (box.tR.y - box.tT.y) * 0.5, mid2.x + (box.tB.x - box.tL.x) * 0.5, mid2.y + (box.tB.y - box.tL.y) * 0.5]).fill(shade(C.red, 0.75)).stroke(INK);
  void apexY;
  const dx = (box.left.x + box.bottom.x) / 2;
  const dy = (box.left.y + box.bottom.y) / 2;
  hut.rect(dx - 14, dy - 38, 28, 34).fill(0x8a5a2e).stroke(THIN);
  hut.moveTo(dx - 14, dy - 38).lineTo(dx + 14, dy - 4).moveTo(dx + 14, dy - 38).lineTo(dx - 14, dy - 4).stroke({ width: 1.5, color: C.ink });
  // anchor emblem on the wall
  const ax = (box.bottom.x + box.right.x) / 2;
  const ay = (box.bottom.y + box.right.y) / 2 - 34;
  hut.circle(ax, ay - 10, 4).stroke({ width: 3, color: C.ink });
  hut.moveTo(ax, ay - 6).lineTo(ax, ay + 12).moveTo(ax - 9, ay + 6).quadraticCurveTo(ax, ay + 16, ax + 9, ay + 6).stroke({ width: 3, color: C.ink });
  // crane
  const cr = new Graphics();
  const cp = P(fw - 1, 0.2);
  cr.moveTo(cp.x - 14, cp.y).lineTo(cp.x, cp.y - 120).lineTo(cp.x + 14, cp.y).stroke({ width: 6, color: C.ink });
  cr.moveTo(cp.x - 14, cp.y).lineTo(cp.x, cp.y - 120).lineTo(cp.x + 14, cp.y).stroke({ width: 3, color: C.yellow });
  cr.moveTo(cp.x, cp.y - 116).lineTo(cp.x + 64, cp.y - 100).stroke({ width: 6, color: C.ink });
  cr.moveTo(cp.x, cp.y - 116).lineTo(cp.x + 64, cp.y - 100).stroke({ width: 3, color: C.yellow });
  cr.moveTo(cp.x + 60, cp.y - 100).lineTo(cp.x + 60, cp.y - 56).stroke({ width: 2, color: C.ink });
  const crate = new Graphics();
  crate.rect(cp.x + 48, cp.y - 58, 24, 20).fill(0xb98348).stroke(THIN);
  crate.moveTo(cp.x + 48, cp.y - 58).lineTo(cp.x + 72, cp.y - 38).stroke({ width: 1.5, color: C.ink });
  // barrels
  const br = new Graphics();
  for (const [bx, by] of [
    [0.3, fh - 0.8],
    [0.75, fh - 0.6],
  ]) {
    const p = P(bx, by);
    br.ellipse(p.x, p.y - 2, 12, 6).fill(0x6a4325).stroke(THIN);
    br.rect(p.x - 12, p.y - 26, 24, 24).fill(0x8a5a2e);
    br.ellipse(p.x, p.y - 26, 12, 6).fill(0xb98348).stroke(THIN);
    br.moveTo(p.x - 12, p.y - 26).lineTo(p.x - 12, p.y - 2).moveTo(p.x + 12, p.y - 26).lineTo(p.x + 12, p.y - 2).stroke(THIN);
    br.moveTo(p.x - 12, p.y - 10).quadraticCurveTo(p.x, p.y - 4, p.x + 12, p.y - 10).stroke({ width: 2, color: C.ink });
  }
  // flag pole with paw flag
  const fl = new Graphics();
  const fp = P(0.1, fh - 1.4);
  fl.moveTo(fp.x, fp.y).lineTo(fp.x, fp.y - 120).stroke({ width: 4, color: C.ink });
  fl.poly([fp.x, fp.y - 120, fp.x + 46, fp.y - 110, fp.x, fp.y - 96]).fill(C.ink);
  fl.circle(fp.x + 15, fp.y - 108, 4).fill(C.paper);
  c.addChild(pier, g, hut, br, cr, crate, fl);
  return { c, top: box.tT.y - 60 };
}

/** the Balsa Bigotuda (raft with palm + sail). Origin at its center, at SEA level. */
export function boatArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 6, 70, 22).fill({ color: 0x1c3a51, alpha: 0.25 });
  const logs = 5;
  for (let i = 0; i < logs; i++) {
    const t = (i - (logs - 1) / 2) * 13;
    const a = { x: -50 + t * 0.9, y: -8 + t * 0.55 };
    const b = { x: 34 + t * 0.9, y: 22 + t * 0.55 };
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 16, color: C.ink, cap: 'round' });
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 11, color: i % 2 ? 0xc99358 : 0xb98348, cap: 'round' });
  }
  g.moveTo(-40, 14).lineTo(10, -16).moveTo(30, 30).lineTo(70, 6).stroke({ width: 3, color: 0x6a4325 });
  // mast + sail
  g.moveTo(-2, 4).lineTo(-2, -110).stroke({ width: 5, color: C.ink });
  g.moveTo(-2, -104).quadraticCurveTo(34, -78, 40, -36).lineTo(-2, -26).closePath().fill(C.paper).stroke(INK);
  g.circle(14, -56, 6).fill(C.ink);
  for (const [dx, dy] of [
    [-6, -6],
    [-2, -10],
    [3, -10],
    [7, -6],
  ])
    g.circle(14 + dx * 0.9, -56 + dy * 0.9, 2.4).fill(C.ink);
  // little palm in a pot + box
  g.rect(-40, -10, 16, 14).fill(0xc8102e).stroke(THIN);
  g.moveTo(-32, -10).quadraticCurveTo(-30, -30, -26, -42).stroke({ width: 4, color: 0x8a5a2e });
  for (const a of [3.4, 4.2, 5.2, 6.0]) g.moveTo(-26, -42).quadraticCurveTo(-26 + Math.cos(a) * 12, -50, -26 + Math.cos(a) * 22, -42 + Math.sin(a) * 4 + 6).stroke({ width: 4, color: 0x4f9a4a, cap: 'round' });
  const box = new Graphics();
  isoBoxAt(box, 0.15, 0.05, 0.3, 0.3, 16, 0xc99a62, 0);
  c.addChild(g, box);
  return c;
}

/** Altar de Almas: stepped stone + bowl; floating orbs are animated by the view */
export function altarArt(): { c: Container; orbAnchor: { x: number; y: number } } {
  const c = new Container();
  const g = new Graphics();
  isoBoxAt(g, 0, 0, 2, 2, 10, 0x9a8fa8, 0.1);
  isoBoxAt(g, 0.4, 0.4, 1.2, 1.2, 22, 0xb7a4c7, 0.05, 10);
  const ctr = centerOf(2, 2);
  g.rect(ctr.x - 10, ctr.y - 70, 20, 40).fill(0xd9cdb8).stroke(INK);
  g.ellipse(ctr.x, ctr.y - 72, 28, 10).fill(C.plumInk).stroke(INK);
  g.ellipse(ctr.x, ctr.y - 74, 20, 6).fill(C.violet);
  for (const [x, y] of [
    [-30, -24],
    [26, -20],
  ])
    g.star(ctr.x + x, ctr.y + y, 4, 6, 2).fill(C.mint);
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = C.violet;
  glow.alpha = 0.5;
  glow.position.set(ctr.x, ctr.y - 92);
  glow.scale.set(1.1);
  c.addChild(glow, g);
  return { c, orbAnchor: { x: ctr.x, y: ctr.y - 100 } };
}

/** Mesa del Gato (PÓSTER RETRO): round table, cloth, three cups, striped parasol */
export function mesaArt(): Container {
  const c = new Container();
  const g = new Graphics();
  const ctr = centerOf(2, 2);
  g.ellipse(ctr.x, ctr.y + 4, 66, 26).fill({ color: C.ink, alpha: 0.18 });
  g.rect(ctr.x - 6, ctr.y - 36, 12, 36).fill(C.ink);
  g.ellipse(ctr.x, ctr.y - 40, 64, 24).fill(0xb3202a).stroke(INK);
  g.ellipse(ctr.x, ctr.y - 44, 58, 20).fill(C.paper).stroke(THIN);
  for (let k = -1; k <= 1; k++) {
    const x = ctr.x + k * 30;
    const y = ctr.y - 48 + Math.abs(k) * 4;
    g.poly([x - 10, y, x - 7, y - 20, x + 7, y - 20, x + 10, y]).fill(k === 0 ? 0x4f5a45 : 0xb3202a).stroke(THIN);
  }
  g.moveTo(ctr.x + 50, ctr.y - 30).lineTo(ctr.x + 50, ctr.y - 140).stroke({ width: 4, color: C.ink });
  const n = 6;
  for (let k = 0; k < n; k++) {
    const a0 = Math.PI + (k / n) * Math.PI;
    const a1 = Math.PI + ((k + 1) / n) * Math.PI;
    g.poly([ctr.x + 50, ctr.y - 150, ctr.x + 50 + Math.cos(a0) * 70, ctr.y - 120 + Math.sin(a0) * 10, ctr.x + 50 + Math.cos(a1) * 70, ctr.y - 120 + Math.sin(a1) * 10])
      .fill(k % 2 ? C.paper : 0xb3202a)
      .stroke(THIN);
  }
  c.addChild(g);
  return c;
}

/** Faro: striped tower; rotating beam animated by the view */
export function lighthouseArt(): { c: Container; lamp: { x: number; y: number } } {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 4, 34, 12).fill({ color: C.ink, alpha: 0.2 });
  g.ellipse(0, 0, 30, 12).fill(0x9a8f80).stroke(INK);
  const H = 150;
  const bands = 5;
  for (let k = 0; k < bands; k++) {
    const y0 = -k * (H / bands);
    const y1 = -(k + 1) * (H / bands);
    const w0 = 24 - (k / bands) * 9;
    const w1 = 24 - ((k + 1) / bands) * 9;
    g.poly([-w0, y0, w0, y0, w1, y1, -w1, y1]).fill(k % 2 ? C.paper : C.red);
  }
  g.poly([-24, 0, 24, 0, 15, -H, -15, -H]).stroke(INK);
  g.rect(-20, -H - 6, 40, 8).fill(C.ink);
  g.rect(-13, -H - 36, 26, 30).fill(C.yellow).stroke(INK);
  g.moveTo(-13, -H - 21).lineTo(13, -H - 21).stroke(THIN);
  g.poly([-18, -H - 36, 0, -H - 56, 18, -H - 36]).fill(C.ink);
  g.rect(-5, -30, 10, 18).fill(C.ink);
  c.addChild(g);
  return { c, lamp: { x: 0, y: -H - 22 } };
}

/** Fishing pen at sea level (origin = anchor tile center at LAND level; drawn DROP lower) */
export function penArt(level: number, fw = 2, fh = 2, auto = false): Container {
  const c = new Container();
  const g = new Graphics();
  c.y = DROP;
  const a = P(-0.42, -0.42);
  const b = P(fw - 0.58, -0.42);
  const d = P(-0.42, fh - 0.58);
  const e = P(fw - 0.58, fh - 0.58);
  const water = level >= 10 ? 0x1c3a51 : level >= 5 ? 0x2c5f8f : 0x3a7fb1;
  g.poly([a.x, a.y, b.x, b.y, e.x, e.y, d.x, d.y]).fill(water);
  // net pattern
  for (let k = 1; k < 6; k++) {
    const f = k / 6;
    g.moveTo(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f).lineTo(d.x + (e.x - d.x) * f, d.y + (e.y - d.y) * f);
    g.moveTo(a.x + (d.x - a.x) * f, a.y + (d.y - a.y) * f).lineTo(b.x + (e.x - b.x) * f, b.y + (e.y - b.y) * f);
  }
  g.stroke({ width: 1.2, color: 0xffffff, alpha: 0.18 });
  // wooden frame (thick planks)
  const frameCol = level >= 10 ? 0xffd77a : 0xc99358;
  const plank = (p: { x: number; y: number }, q: { x: number; y: number }) => {
    g.moveTo(p.x, p.y).lineTo(q.x, q.y).stroke({ width: 13, color: C.ink, cap: 'round' });
    g.moveTo(p.x, p.y - 1).lineTo(q.x, q.y - 1).stroke({ width: 8, color: frameCol, cap: 'round' });
  };
  plank(a, b);
  plank(a, d);
  plank(b, e);
  plank(d, e);
  for (const p of [a, b, d, e]) {
    g.rect(p.x - 5, p.y - 22, 10, 24).fill(0x6a4325).stroke(THIN);
    g.circle(p.x, p.y - 22, 5).fill(0x8a5a2e).stroke(THIN);
  }
  // buoys
  for (const [p, q] of [
    [a, b],
    [d, e],
  ]) {
    const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    g.circle(m.x, m.y - 6, 7).fill(C.red).stroke(THIN);
    g.rect(m.x - 7, m.y - 8, 14, 3).fill(0xffffff);
  }
  // level badge: little hut from level 5
  if (level >= 5) {
    const hut = new Graphics();
    const hp = { x: (a.x + b.x) / 2 + 10, y: (a.y + b.y) / 2 - 4 };
    hut.rect(hp.x - 14, hp.y - 26, 28, 22).fill(0xede4d6).stroke(THIN);
    hut.poly([hp.x - 18, hp.y - 26, hp.x, hp.y - 40, hp.x + 18, hp.y - 26]).fill(C.megaBlue).stroke(THIN);
    c.addChild(hut);
  }
  // KL21 · Mar de Pescados Automático: a little silo + conveyor arm on the back corner
  if (auto) {
    const rig = new Graphics();
    const sp = { x: d.x + 14, y: d.y - 4 };
    rig.ellipse(sp.x, sp.y + 2, 16, 6).fill({ color: C.ink, alpha: 0.25 });
    rig.rect(sp.x - 13, sp.y - 46, 26, 46).fill(0xd9dde2).stroke(THIN);
    rig.ellipse(sp.x, sp.y - 46, 13, 5).fill(0xeef1f4).stroke(THIN);
    rig.poly([sp.x - 15, sp.y - 46, sp.x, sp.y - 60, sp.x + 15, sp.y - 46]).fill(C.megaBlue).stroke(THIN);
    for (const y of [-14, -28]) rig.moveTo(sp.x - 13, sp.y + y).lineTo(sp.x + 13, sp.y + y).stroke({ width: 1.5, color: C.ink, alpha: 0.5 });
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    rig.moveTo(sp.x + 10, sp.y - 30).lineTo(cx, cy - 34).stroke({ width: 5, color: C.ink, cap: 'round' });
    rig.moveTo(sp.x + 10, sp.y - 30).lineTo(cx, cy - 34).stroke({ width: 2.5, color: C.yellow, cap: 'round' });
    rig.moveTo(cx, cy - 34).lineTo(cx, cy - 6).stroke({ width: 2, color: C.ink });
    rig.poly([cx - 8, cy - 8, cx + 8, cy - 8, cx + 5, cy, cx - 5, cy]).fill(0x8a95a3).stroke({ width: 1.5, color: C.ink });
    // AUTO pennant
    rig.moveTo(sp.x, sp.y - 60).lineTo(sp.x, sp.y - 78).stroke({ width: 2, color: C.ink });
    rig.poly([sp.x, sp.y - 78, sp.x + 18, sp.y - 74, sp.x, sp.y - 70]).fill(C.green).stroke({ width: 1.5, color: C.ink });
    c.addChild(rig);
  }
  c.addChildAt(g, 0);
  return c;
}

/** Simple label plate above buildings */
export function plate(text: string, color: number = C.paper, size = 22): Container {
  const c = new Container();
  const t: Text = txt(text, { fontFamily: F.poster, fontSize: size, fill: C.ink });
  t.anchor.set(0.5);
  const w = t.width + 22;
  const h = size + 10;
  const bg = new Graphics()
    .rect(-w / 2 + 4, -h / 2 + 4, w, h)
    .fill(C.ink)
    .rect(-w / 2, -h / 2, w, h)
    .fill(color)
    .stroke({ width: 3, color: C.ink });
  c.addChild(bg, t);
  return c;
}

// ------------------------------------------------------------------ legacy helpers (IslandSandbox)
export function habitatArt(element: string, fw = 3, fh = 3, level = 1): Container {
  const p = habitatParts(element, level, fw, fh);
  const c = new Container();
  c.addChild(p.ground, p.back, p.front);
  return c;
}
export function sanctuaryArt(fw = 3, fh = 3): Container {
  return sanctuaryParts(fw, fh).c;
}
export function farmArt(fw = 2, fh = 2, tier = 1): Container {
  const c = penArt(tier * 3, fw, fh);
  c.y = 0;
  return c;
}
