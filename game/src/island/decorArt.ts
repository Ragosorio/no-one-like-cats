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
  }
  return c;
}
