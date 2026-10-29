/** Static island decoration (poster flat colors + ink). Origin = ground point at tile center. */
import { Container, Graphics, Sprite } from 'pixi.js';
import { C } from '../ui/theme';
import { glowTexture } from '../art/textures';
import type { DecorKind } from './layout';

const INK = { width: 3, color: C.ink, join: 'round' as const, cap: 'round' as const };
const THIN = { width: 2, color: C.ink, join: 'round' as const, cap: 'round' as const };

function shadow(g: Graphics, rx: number, ry = rx * 0.4) {
  g.ellipse(0, 2, rx, ry).fill({ color: C.ink, alpha: 0.18 });
}

export function decorArt(kind: DecorKind, v: number): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const s = 0.85 + v * 0.35;
  switch (kind) {
    case 'palm': {
      shadow(g, 22);
      const lean = (v - 0.5) * 24;
      g.moveTo(-4, 0).quadraticCurveTo(lean * 0.3, -40, lean, -78 * s).lineTo(lean + 8, -76 * s).quadraticCurveTo(lean * 0.3 + 8, -40, 6, 0).closePath().fill(0xb98348).stroke(INK);
      for (let i = 1; i < 5; i++) g.moveTo(lean * (i / 5) * 0.8 - 3, -i * 15 * s).lineTo(lean * (i / 5) * 0.8 + 7, -i * 15 * s - 2).stroke(THIN);
      const tx = lean + 4;
      const ty = -78 * s;
      const leaf = (a: number, len: number, col: number) => {
        const ex = tx + Math.cos(a) * len;
        const ey = ty + Math.sin(a) * len * 0.6 + 8;
        const mx = tx + Math.cos(a) * len * 0.5;
        const my = ty + Math.sin(a) * len * 0.3 - 14;
        g.moveTo(tx, ty).quadraticCurveTo(mx, my - 8, ex, ey).quadraticCurveTo(mx, my + 10, tx, ty).fill(col).stroke(THIN);
      };
      const cols = [0x4f9a4a, 0x5fb35a, 0x3f8a3f];
      [Math.PI * 1.05, Math.PI * 1.35, Math.PI * 1.7, Math.PI * 1.95, Math.PI * 0.2, Math.PI * 0.75].forEach((a, i) => leaf(a, 40 + (i % 2) * 8, cols[i % 3]));
      g.circle(tx - 4, ty + 4, 5).fill(0x8a5a2e).stroke(THIN);
      g.circle(tx + 5, ty + 5, 5).fill(0x8a5a2e).stroke(THIN);
      break;
    }
    case 'tree': {
      shadow(g, 26);
      g.rect(-5, -30 * s, 10, 30 * s).fill(0x8a5a2e).stroke(INK);
      const col = v < 0.5 ? 0x6fb35a : 0x88c46a;
      g.circle(0, -48 * s, 26 * s).fill(col).stroke(INK);
      g.circle(-16 * s, -38 * s, 16 * s).fill(col).stroke(INK);
      g.circle(15 * s, -40 * s, 17 * s).fill(col).stroke(INK);
      g.circle(-6 * s, -56 * s, 9 * s).fill({ color: 0xffffff, alpha: 0.25 });
      if (v > 0.6) for (const [x, y] of [[-8, -46], [10, -52], [2, -36]]) g.circle(x * s, y * s, 3.5).fill(C.red).stroke({ width: 1.5, color: C.ink });
      break;
    }
    case 'sakura': {
      // cherry tree (Jardín Sakura): bent trunk, pink puffs, a couple of falling petals
      shadow(g, 28);
      const lean = (v - 0.5) * 14;
      g.moveTo(-5, 0).quadraticCurveTo(lean - 6, -20 * s, lean, -38 * s).lineTo(lean + 9, -38 * s).quadraticCurveTo(lean + 4, -18 * s, 6, 0).closePath().fill(0x6a3b3b).stroke(INK);
      const pink = v < 0.5 ? 0xffb7d2 : 0xffc9de;
      const deep = 0xff8fbf;
      for (const [x, y, r, col] of [
        [lean - 18, -46, 17, deep],
        [lean + 20, -48, 18, deep],
        [lean, -60, 24, pink],
        [lean - 14, -54, 15, pink],
        [lean + 14, -58, 15, pink],
      ] as const)
        g.circle(x * s, y * s, r * s).fill(col).stroke(INK);
      g.circle((lean - 6) * s, -68 * s, 6 * s).fill({ color: 0xffffff, alpha: 0.45 });
      for (const [x, y] of [
        [-22, -14],
        [18, -8],
        [30, -24],
      ])
        g.ellipse(x, y, 4, 2.4).fill(pink).stroke({ width: 1, color: C.ink, alpha: 0.6 });
      break;
    }
    case 'cactus': {
      shadow(g, 16);
      const col = v < 0.5 ? 0x5f9e4a : 0x6fb35a;
      g.roundRect(-8, -54 * s, 16, 54 * s, 8).fill(col).stroke(INK);
      g.moveTo(-8, -26 * s).lineTo(-18, -26 * s).lineTo(-18, -42 * s).stroke({ width: 9, color: C.ink, cap: 'round' });
      g.moveTo(-8, -26 * s).lineTo(-18, -26 * s).lineTo(-18, -42 * s).stroke({ width: 5, color: col, cap: 'round' });
      g.moveTo(8, -34 * s).lineTo(17, -34 * s).lineTo(17, -46 * s).stroke({ width: 9, color: C.ink, cap: 'round' });
      g.moveTo(8, -34 * s).lineTo(17, -34 * s).lineTo(17, -46 * s).stroke({ width: 5, color: col, cap: 'round' });
      for (let k = 0; k < 4; k++) g.moveTo(-2 + (k % 2) * 4, -10 - k * 11 * s).lineTo(-2 + (k % 2) * 4, -14 - k * 11 * s).stroke({ width: 1.5, color: 0xf2e6cf });
      if (v > 0.55) g.circle(0, -56 * s, 5).fill(0xff7ab8).stroke({ width: 1.5, color: C.ink });
      break;
    }
    case 'lollipop': {
      shadow(g, 14);
      g.rect(-2.5, -46 * s, 5, 46 * s).fill(0xffffff).stroke(THIN);
      const cy = -58 * s;
      const r = 15 * s;
      const cols = v < 0.5 ? [0xff7ab8, 0xffffff] : [0x7fe0c8, 0xffffff];
      g.circle(0, cy, r).fill(cols[0]).stroke(INK);
      for (let k = 0; k < 3; k++) g.arc(0, cy, r * (0.75 - k * 0.22), k, k + Math.PI * 1.2).stroke({ width: 3, color: cols[1] });
      g.circle(-r * 0.4, cy - r * 0.4, 3).fill({ color: 0xffffff, alpha: 0.7 });
      break;
    }
    case 'pine': {
      shadow(g, 22);
      g.rect(-4, -14, 8, 14).fill(0x6a4325).stroke(INK);
      const col = v < 0.5 ? 0x2f6f3f : 0x3d7f48;
      for (let i = 0; i < 3; i++) {
        const y = -14 - i * 20 * s;
        const w = (26 - i * 6) * s;
        g.poly([-w, y, 0, y - 32 * s, w, y]).fill(col).stroke(INK);
      }
      break;
    }
    case 'bush': {
      shadow(g, 20);
      const col = v < 0.5 ? 0x5fa64f : 0x74b85e;
      g.circle(-10, -12, 13).fill(col).stroke(INK);
      g.circle(10, -12, 13).fill(col).stroke(INK);
      g.circle(0, -20, 14).fill(col).stroke(INK);
      if (v > 0.5) for (const [x, y] of [[-8, -18], [6, -24], [10, -10]]) g.circle(x, y, 3).fill(0xff7ab8).stroke({ width: 1, color: C.ink });
      break;
    }
    case 'flower': {
      const cols = [0xff7ab8, 0xffc94a, 0xffffff, 0xe8879a];
      for (let i = 0; i < 4; i++) {
        const x = (i - 1.5) * 12 + (v - 0.5) * 8;
        const y = ((i * 7) % 3) * 4 - 6;
        g.moveTo(x, y + 6).lineTo(x, y - 6).stroke({ width: 2, color: 0x3f7a3a });
        const col = cols[(i + Math.floor(v * 4)) % 4];
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          g.circle(x + Math.cos(a) * 4, y - 8 + Math.sin(a) * 3, 3).fill(col);
        }
        g.circle(x, y - 8, 2.2).fill(C.yellow).stroke({ width: 1, color: C.ink });
      }
      break;
    }
    case 'grass': {
      const col = 0x5f9c4a;
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * 6;
        g.moveTo(x, 0).quadraticCurveTo(x + 2, -10, x + (i - 2) * 3, -18 - (i % 2) * 6).stroke({ width: 3, color: col, cap: 'round' });
      }
      break;
    }
    case 'rock': {
      shadow(g, 18);
      const col = v < 0.5 ? 0xa59d8c : 0x8d8676;
      g.poly([-18, 0, -14, -14, -2, -20, 12, -16, 18, -4, 10, 2, -8, 3]).fill(col).stroke(INK);
      g.poly([-2, -20, 12, -16, 4, -8, -8, -10]).fill({ color: 0xffffff, alpha: 0.25 });
      break;
    }
    case 'boulder': {
      shadow(g, 28);
      g.poly([-28, 0, -24, -26, -6, -40, 18, -34, 28, -12, 20, 4, -10, 6]).fill(0x8f8778).stroke(INK);
      g.moveTo(-6, -40).lineTo(0, -16).lineTo(20, 4).stroke({ width: 2, color: C.ink, alpha: 0.4 });
      g.poly([-24, -26, -6, -40, 0, -16, -18, -12]).fill({ color: 0xffffff, alpha: 0.2 });
      break;
    }
    case 'mushroom': {
      shadow(g, 16);
      for (const [x, sc, col] of [
        [-8, 1, C.red],
        [10, 0.7, 0xff6a1a],
      ] as const) {
        g.rect(x - 4 * sc, -16 * sc, 8 * sc, 16 * sc).fill(C.paper).stroke(THIN);
        g.ellipse(x, -18 * sc, 16 * sc, 11 * sc).fill(col).stroke(INK);
        g.circle(x - 5 * sc, -21 * sc, 2.5 * sc).fill(0xffffff);
        g.circle(x + 5 * sc, -18 * sc, 2 * sc).fill(0xffffff);
      }
      break;
    }
    case 'crystal': {
      shadow(g, 18);
      const col = v < 0.33 ? C.cyan : v < 0.66 ? C.violet : C.mint;
      const glow = new Sprite(glowTexture());
      glow.anchor.set(0.5);
      glow.tint = col;
      glow.alpha = 0.45;
      glow.scale.set(0.7);
      glow.y = -18;
      c.addChildAt(glow, 0);
      g.poly([-14, 0, -18, -20, -10, -36, -4, -18, -2, 0]).fill(col).stroke(INK);
      g.poly([-2, 0, 2, -40, 10, -48, 16, -26, 12, 0]).fill(col).stroke(INK);
      g.poly([2, -40, 10, -48, 8, -20]).fill({ color: 0xffffff, alpha: 0.4 });
      break;
    }
    case 'lava': {
      const glow = new Sprite(glowTexture());
      glow.anchor.set(0.5);
      glow.tint = C.orange;
      glow.alpha = 0.6;
      glow.scale.set(0.9, 0.5);
      c.addChildAt(glow, 0);
      g.ellipse(0, 0, 30, 13).fill(0x2a1a1a).stroke(INK);
      g.ellipse(0, 0, 22, 8).fill(C.orange);
      g.ellipse(-4, -1, 10, 4).fill(C.yellow);
      break;
    }
    case 'snow': {
      shadow(g, 20);
      if (v > 0.55) {
        // tiny snow-cat
        g.circle(0, -12, 13).fill(0xffffff).stroke(INK);
        g.circle(0, -32, 10).fill(0xffffff).stroke(INK);
        g.poly([-8, -38, -6, -48, -1, -40]).fill(0xffffff).stroke(THIN);
        g.poly([8, -38, 6, -48, 1, -40]).fill(0xffffff).stroke(THIN);
        g.circle(-3, -33, 1.5).fill(C.ink);
        g.circle(3, -33, 1.5).fill(C.ink);
        g.poly([0, -30, 6, -29, 0, -28]).fill(C.orange);
      } else {
        g.ellipse(0, -6, 22, 10).fill(0xffffff).stroke(INK);
        g.ellipse(-6, -12, 12, 7).fill(0xffffff).stroke(THIN);
      }
      break;
    }
    case 'column': {
      shadow(g, 16);
      const h = 34 + v * 30;
      const broken = v < 0.45;
      g.rect(-12, -6, 24, 6).fill(0xd9cdb8).stroke(INK);
      g.rect(-9, -h, 18, h - 6).fill(0xe9e1d0).stroke(INK);
      for (const x of [-4, 2]) g.moveTo(x, -h + 4).lineTo(x, -8).stroke({ width: 1.5, color: C.ink, alpha: 0.35 });
      if (broken) g.poly([-9, -h, -2, -h - 8, 4, -h - 2, 9, -h - 10, 9, -h]).fill(0xe9e1d0).stroke(INK);
      else g.rect(-13, -h - 8, 26, 8).fill(0xd9cdb8).stroke(INK);
      if (v > 0.7) g.circle(0, -h * 0.5, 4).fill(C.violet);
      break;
    }
    case 'coral': {
      const col = v < 0.5 ? 0xff7ab8 : 0xffa94a;
      const branch = (x: number, y: number, a: number, len: number, d: number) => {
        const ex = x + Math.cos(a) * len;
        const ey = y + Math.sin(a) * len;
        g.moveTo(x, y).lineTo(ex, ey).stroke({ width: 9 - d * 2.5, color: C.ink, cap: 'round' });
        g.moveTo(x, y).lineTo(ex, ey).stroke({ width: 5 - d * 1.5, color: col, cap: 'round' });
        if (d < 2) {
          branch(ex, ey, a - 0.5, len * 0.7, d + 1);
          branch(ex, ey, a + 0.5, len * 0.7, d + 1);
        }
      };
      shadow(g, 16);
      branch(0, 0, -Math.PI / 2, 18, 0);
      break;
    }
    case 'lamp': {
      shadow(g, 10);
      const glow = new Sprite(glowTexture());
      glow.anchor.set(0.5);
      glow.tint = C.yellow;
      glow.alpha = 0.55;
      glow.scale.set(0.8);
      glow.y = -54;
      g.rect(-3, -50, 6, 50).fill(C.ink);
      g.rect(-9, -64, 18, 16).fill(C.yellow).stroke(INK);
      g.poly([-12, -64, 0, -74, 12, -64]).fill(C.ink);
      c.addChild(glow);
      break;
    }
    case 'star': {
      const glow = new Sprite(glowTexture());
      glow.anchor.set(0.5);
      glow.tint = v < 0.5 ? C.cyan : C.yellow;
      glow.alpha = 0.5;
      glow.scale.set(0.5);
      glow.y = -6;
      c.addChildAt(glow, 0);
      g.star(0, -6, 5, 12, 5).fill(v < 0.5 ? 0xffa94a : C.yellow).stroke(INK);
      break;
    }
    default:
      postDecor(g, kind, v, s);
  }
  return c;
}

/** an iso box (cardboard, dice, cushion): footprint half-width `hw`, height `ht`, base at y0 */
function isoBox(g: Graphics, hw: number, ht: number, y0: number, top: number, left: number, right: number) {
  const hh = hw / 2;
  g.poly([-hw, y0 - hh, 0, y0, 0, y0 - ht, -hw, y0 - hh - ht]).fill(left).stroke(INK);
  g.poly([hw, y0 - hh, 0, y0, 0, y0 - ht, hw, y0 - hh - ht]).fill(right).stroke(INK);
  g.poly([0, y0 - ht - hw, hw, y0 - hh - ht, 0, y0 - ht, -hw, y0 - hh - ht]).fill(top).stroke(INK);
}

/** after the Parte III (data/postp3/islas.json): CARTÓN, TAPETE, TALAVERA, TEJIDO, SIESTA */
function postDecor(g: Graphics, kind: DecorKind, v: number, s: number) {
  switch (kind) {
    case 'box': {
      shadow(g, 26);
      const K = 0xd9a868;
      const L = 0xb07a42;
      const R = 0x8f5c2e;
      const hw = 20 * s;
      if (v < 0.36) {
        isoBox(g, hw, 22 * s, 0, K, L, R);
        // tape along the top seam + a red arrow on the side
        g.moveTo(-hw * 0.5, -22 * s - hw * 0.75).lineTo(hw * 0.5, -22 * s - hw * 0.25).stroke({ width: 5, color: 0xc89a5a });
        g.moveTo(hw * 0.5, -6 * s).lineTo(hw * 0.5, -16 * s).stroke({ width: 2, color: 0xe8402e });
        g.poly([hw * 0.5 - 4, -14 * s, hw * 0.5, -20 * s, hw * 0.5 + 4, -14 * s]).fill(0xe8402e);
      } else if (v < 0.7) {
        // open box, flaps up (a cat's favourite)
        isoBox(g, hw, 20 * s, 0, 0x4a2e14, L, R);
        const y = -20 * s;
        g.poly([-hw, y - hw / 2, -hw * 1.5, y - hw * 1.2, -hw * 0.6, y - hw * 1.5, 0, y - hw]).fill(K).stroke(THIN);
        g.poly([hw, y - hw / 2, hw * 1.5, y - hw * 1.2, hw * 0.6, y - hw * 1.5, 0, y - hw]).fill(0xc8955a).stroke(THIN);
      } else {
        // a stack: big box, a smaller one on top, a bit turned
        isoBox(g, hw, 18 * s, 0, K, L, R);
        isoBox(g, hw * 0.7, 14 * s, -18 * s - hw * 0.12, K, L, R);
        g.moveTo(-hw * 0.35, -32 * s - hw * 0.6).lineTo(hw * 0.35, -32 * s - hw * 0.25).stroke({ width: 4, color: 0xc89a5a });
      }
      break;
    }
    case 'tape': {
      shadow(g, 16);
      // the roll: side band + top ring in one outline (kept light: few curves, no stacked strokes)
      g.rect(-16, -10, 32, 4).fill(0xc89a5a);
      g.ellipse(0, -6, 16, 8).fill(0xc89a5a).stroke(THIN);
      g.ellipse(0, -10, 16, 8).fill(0xd9ae6e).stroke(THIN);
      g.ellipse(0, -10, 7, 3.5).fill(0x8f5c2e);
      g.poly([14, -9, 27, -3, 25, 1, 13, -5]).fill(0xd9ae6e);
      break;
    }
    case 'chips': {
      shadow(g, 18);
      const cols = [0xc8102e, 0x1f5fbf, 0x171317, 0x2fa860, 0xffc94a];
      const n = 3 + Math.floor(v * 3);
      const h = n * 5;
      // the stack as one body (side stripes per chip) + the top chip's face: a few shapes, not one per chip
      g.rect(-14, -4 - h, 28, h).fill(cols[Math.floor(v * 10) % cols.length]);
      for (let i = 0; i < n; i++) g.rect(-14, -4 - h + i * 5 + 2, 28, 1.6).fill({ color: i % 2 ? 0xffffff : cols[(i + 2) % cols.length], alpha: 0.85 });
      g.ellipse(0, -4, 14, 6).fill(cols[Math.floor(v * 10) % cols.length]);
      g.moveTo(-14, -4).lineTo(-14, -4 - h).moveTo(14, -4).lineTo(14, -4 - h).stroke(THIN);
      g.ellipse(0, -4 - h, 14, 6).fill(cols[(Math.floor(v * 10) + 1) % cols.length]).stroke(THIN);
      g.ellipse(0, -4 - h, 8, 3.4).fill({ color: 0xffffff, alpha: 0.35 });
      if (v > 0.6) {
        // a second, shorter gold stack
        g.rect(12, -6, 20, 8).fill(0xffc94a);
        g.ellipse(22, 2, 10, 4.5).fill(0xffc94a);
        g.ellipse(22, -6, 10, 4.5).fill(0xffd77a).stroke(THIN);
      }
      break;
    }
    case 'dice': {
      shadow(g, 18);
      const hw = 15 * s;
      isoBox(g, hw, 22 * s, 0, 0xfffaf0, 0xe8e0d0, 0xd8cfbd);
      const top = -22 * s - hw / 2;
      const pip = (x: number, y: number) => g.circle(x, y, 2.4).fill(v < 0.5 ? C.ink : 0xc8102e);
      // five on top, two and three on the sides
      pip(0, top);
      pip(-hw * 0.45, top - hw * 0.12);
      pip(hw * 0.45, top + hw * 0.12);
      pip(-hw * 0.05, top - hw * 0.32);
      pip(hw * 0.05, top + hw * 0.32);
      pip(-hw * 0.65, -12 * s);
      pip(-hw * 0.35, -6 * s);
      for (const k of [0, 1, 2]) pip(hw * (0.3 + k * 0.2), -16 * s + k * 5 - hw * 0.1);
      break;
    }
    case 'card': {
      shadow(g, 14, 5);
      const tilt = (v - 0.5) * 0.5;
      const red = v < 0.5;
      const w2 = 15;
      const h2 = 42 * s;
      g.poly([-w2, 0, w2, 3, w2, -h2 + 3, -w2, -h2]).fill(0xfffaf0).stroke(INK);
      g.poly([-w2 + 4, -3, w2 - 4, 0, w2 - 4, -h2 + 6, -w2 + 4, -h2 + 3]).stroke({ width: 1.5, color: red ? 0xc8102e : C.ink, alpha: 0.6 });
      const cy = -h2 / 2;
      if (red) g.poly([0, cy - 9, 7, cy, 0, cy + 9, -7, cy]).fill(0xc8102e);
      else g.poly([0, cy - 9, 8, cy + 2, 3, cy + 4, 4, cy + 9, -4, cy + 9, -3, cy + 4, -8, cy + 2]).fill(C.ink);
      g.rotation = tilt;
      break;
    }
    case 'pot': {
      shadow(g, 18);
      // the plant first (behind the rim): an agave or a round cactus
      if (v < 0.5) for (const a of [-1.2, -0.6, 0, 0.6, 1.2]) g.poly([0, -28, Math.sin(a) * 22, -28 - Math.cos(a) * 30, Math.sin(a) * 6, -30]).fill(0x5f9e7a).stroke(THIN);
      else {
        g.circle(0, -38, 14).fill(0x6fb35a).stroke(INK);
        g.circle(0, -54, 5).fill(0xff4f8b).stroke(THIN);
      }
      // glazed pot: white with a cobalt band and dots
      g.poly([-16, -30, 16, -30, 12, 0, -12, 0]).fill(0xf5f0e2).stroke(INK);
      g.ellipse(0, -30, 17, 6).fill(0xf5f0e2).stroke(INK);
      g.ellipse(0, -30, 12, 4).fill(0x6a3b2a);
      g.poly([-15, -22, 15, -22, 14, -15, -14, -15]).fill(0x2a52b8);
      for (const x of [-9, 0, 9]) g.circle(x, -8, 2.4).fill(0xf2c14e).stroke({ width: 1, color: 0x2a52b8 });
      break;
    }
    case 'marigold': {
      shadow(g, 20);
      // the bush as one leafy blob, then three pompom flowers (cempasúchil orange) with a lighter heart
      g.ellipse(0, -11, 19, 11).fill(0x4f9a4a).stroke(THIN);
      const cols = [0xff8a1a, 0xffb02e, 0xff6a1a];
      for (const [x, y, r, i] of [
        [-9, -18, 7, 0],
        [9, -19, 7.5, 1],
        [0, -26, 8, 2],
      ] as const) {
        g.circle(x, y, r).fill(cols[i]).stroke(THIN);
        g.circle(x, y, r * 0.45).fill(0xffd36a);
      }
      break;
    }
    case 'picado': {
      shadow(g, 12);
      g.rect(-2.5, -70, 5, 70).fill(0x8a5a2e).stroke(INK);
      g.moveTo(0, -66).quadraticCurveTo(22, -56, 44, -64).stroke({ width: 1.5, color: C.ink });
      const cols = [0xff4f8b, 0xffc94a, 0x2fbf8a, 0x8a5cff];
      for (let i = 0; i < 3; i++) {
        const x = 8 + i * 13;
        const y = -64 + Math.sin(((i + 0.5) / 3) * Math.PI) * 6;
        g.poly([x - 6, y, x + 6, y, x + 6, y + 14, x + 3, y + 12, x, y + 14, x - 3, y + 12, x - 6, y + 14]).fill(cols[(i + Math.floor(v * 4)) % 4]).stroke({ width: 1.2, color: C.ink });
        g.circle(x, y + 6, 1.8).fill(0xffffff);
      }
      break;
    }
    case 'yarn': {
      shadow(g, 20);
      const col = [0xe8a2b2, 0xf2c14e, 0x8fb8a8, 0xf4e6d4][Math.floor(v * 4)];
      const R = 16 * s;
      // needles behind
      g.moveTo(-R * 1.3, -R * 2.2).lineTo(R * 0.6, -R * 0.4).stroke({ width: 3, color: 0xc8a070, cap: 'round' });
      g.moveTo(R * 1.3, -R * 2.1).lineTo(-R * 0.5, -R * 0.4).stroke({ width: 3, color: 0xc8a070, cap: 'round' });
      g.circle(-R * 1.3, -R * 2.2, 3).fill(0xc8102e);
      g.circle(R * 1.3, -R * 2.1, 3).fill(0xc8102e);
      g.circle(0, -R, R).fill(col).stroke(INK);
      for (let k = 0; k < 4; k++) g.arc(0, -R, R * (0.9 - k * 0.12), 0.4 + k * 0.7, 2.4 + k * 0.7).stroke({ width: 1.6, color: C.ink, alpha: 0.35 });
      // a loose end
      g.moveTo(R * 0.8, -R * 0.4).quadraticCurveTo(R * 1.6, 2, R * 2.2, -2).stroke({ width: 2.4, color: col, cap: 'round' });
      break;
    }
    case 'button': {
      shadow(g, 18, 7);
      const col = [0xf2c14e, 0xe8a2b2, 0x8fb8a8, 0x8a5cff][Math.floor(v * 4)];
      g.ellipse(0, -3, 17, 8).fill(col).stroke(INK);
      g.ellipse(0, -4, 12, 5.5).stroke({ width: 1.5, color: C.ink, alpha: 0.4 });
      for (const [x, y] of [
        [-4, -6],
        [4, -6],
        [-4, -2],
        [4, -2],
      ])
        g.ellipse(x, y, 1.8, 1.1).fill(C.ink);
      break;
    }
    case 'spool': {
      shadow(g, 14);
      const col = [0xe8a2b2, 0xf2c14e, 0x8fb8a8][Math.floor(v * 3)];
      g.ellipse(0, -2, 13, 5).fill(0xc8a070).stroke(INK);
      g.rect(-9, -30, 18, 28).fill(col).stroke(INK);
      for (let k = 0; k < 5; k++) g.moveTo(-9, -26 + k * 5).lineTo(9, -24 + k * 5).stroke({ width: 1, color: C.ink, alpha: 0.3 });
      g.ellipse(0, -30, 13, 5).fill(0xd8b080).stroke(INK);
      g.ellipse(0, -30, 3, 1.5).fill(0x6a3b2a);
      break;
    }
    case 'cushion': {
      shadow(g, 22);
      const col = [0xd8cff4, 0xf4c9d2, 0xfff4c8, 0xc8e0f4][Math.floor(v * 4)];
      const hw = 22 * s;
      const y = -6;
      // a puffy diamond: curved edges, a tuft button in the middle, corner tassels
      g.moveTo(0, y - hw * 0.62)
        .quadraticCurveTo(hw * 0.6, y - hw * 0.5, hw, y)
        .quadraticCurveTo(hw * 0.6, y + hw * 0.18, 0, y + hw * 0.5)
        .quadraticCurveTo(-hw * 0.6, y + hw * 0.18, -hw, y)
        .quadraticCurveTo(-hw * 0.6, y - hw * 0.5, 0, y - hw * 0.62)
        .closePath()
        .fill(col)
        .stroke(INK);
      g.ellipse(0, y + hw * 0.5 - 2, hw * 0.55, 4).fill({ color: 0x7464b0, alpha: 0.25 });
      g.circle(0, y - 2, 3).fill(0xffe9a8).stroke(THIN);
      for (const x of [-hw, hw]) g.circle(x, y + 2, 3).fill(0xffe066).stroke({ width: 1, color: C.ink });
      break;
    }
    case 'cloudpuff': {
      shadow(g, 22);
      for (const [x, y, r] of [
        [-12, -12, 11],
        [10, -12, 12],
        [0, -20, 13],
      ] as const)
        g.circle(x * s, y * s, r * s).fill(0xffffff).stroke(INK);
      g.rect(-14 * s, -12 * s, 26 * s, 10 * s).fill(0xffffff);
      g.moveTo(-22 * s, -3).lineTo(22 * s, -3).stroke({ width: 3, color: C.ink });
      g.ellipse(-4 * s, -24 * s, 4 * s, 2.5 * s).fill({ color: 0xd8cff4, alpha: 0.8 });
      break;
    }
  }
}
