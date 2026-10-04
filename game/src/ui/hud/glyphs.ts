/** Small poster glyphs for HUD buttons and timer kinds (centered at 0,0, ~s px). */
import { Container, Graphics } from 'pixi.js';
import { C } from '../theme';

const INK = { width: 3, color: C.ink, join: 'round' as const, cap: 'round' as const };

export type GlyphKind =
  | 'torii'
  | 'book'
  | 'anchor'
  | 'ship'
  | 'scroll'
  | 'gear'
  | 'palm'
  | 'hammer'
  | 'fish'
  | 'swirl'
  | 'shovel'
  | 'wrench'
  | 'coins'
  | 'pin'
  | 'purr'
  | 'chevron'
  | 'cards';

export function glyph(kind: GlyphKind, s = 48, color: number = C.ink, accent: number = C.pink): Container {
  const c = new Container();
  const g = new Graphics();
  const k = s / 48;
  g.scale.set(k);
  switch (kind) {
    case 'torii':
      g.rect(-16, -10, 6, 30).fill(C.red).stroke(INK);
      g.rect(10, -10, 6, 30).fill(C.red).stroke(INK);
      g.poly([-24, -16, 24, -16, 21, -22, -21, -22]).fill(color);
      g.rect(-20, -6, 40, 5).fill(C.red).stroke(INK);
      g.circle(0, 6, 8).fill({ color: C.pinkHot, alpha: 0.8 }).stroke(INK);
      break;
    case 'book':
      g.roundRect(-18, -20, 36, 40, 3).fill(accent).stroke(INK);
      g.rect(-18, -20, 8, 40).fill(color);
      g.circle(4, -2, 8).stroke({ width: 3, color });
      g.circle(1, -4, 1.6).fill(color);
      g.circle(7, -4, 1.6).fill(color);
      g.poly([-2, -10, 0, -14, 2, -10]).fill(color);
      g.poly([6, -10, 8, -14, 10, -10]).fill(color);
      break;
    case 'anchor':
      g.circle(0, -16, 5).stroke({ width: 4, color });
      g.moveTo(0, -11).lineTo(0, 18).stroke({ width: 5, color, cap: 'round' });
      g.moveTo(-10, -4).lineTo(10, -4).stroke({ width: 4, color, cap: 'round' });
      g.moveTo(-17, 6).quadraticCurveTo(-14, 20, 0, 20).quadraticCurveTo(14, 20, 17, 6).stroke({ width: 5, color, cap: 'round' });
      break;
    case 'ship':
      g.poly([-24, 6, 24, 6, 16, 18, -16, 18]).fill(0xb98348).stroke(INK);
      g.moveTo(0, 6).lineTo(0, -24).stroke({ width: 3, color: C.ink });
      g.poly([2, -22, 20, 2, 2, 2]).fill(C.paper).stroke(INK);
      g.poly([-2, -16, -16, 2, -2, 2]).fill(accent).stroke(INK);
      g.poly([0, -24, 10, -21, 0, -18]).fill(C.ink);
      break;
    case 'scroll':
      g.roundRect(-16, -18, 32, 36, 3).fill(C.paper).stroke(INK);
      g.circle(-16, -18, 4).fill(color);
      g.circle(16, 18, 4).fill(color);
      for (const y of [-8, 0, 8]) g.moveTo(-9, y).lineTo(9, y).stroke({ width: 2.5, color, cap: 'round' });
      g.circle(10, 10, 6).fill(accent).stroke({ width: 2, color: C.ink });
      break;
    case 'gear': {
      const n = 8;
      const pts: number[] = [];
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const r = i % 2 ? 15 : 21;
        pts.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.poly(pts).fill(color);
      g.circle(0, 0, 7).fill(accent).stroke({ width: 2, color });
      break;
    }
    case 'palm':
      g.moveTo(-2, 22).quadraticCurveTo(0, 0, 6, -10).stroke({ width: 5, color: 0x8a5a2e, cap: 'round' });
      for (const a of [3.3, 4.1, 5.0, 5.9, 0.4]) g.moveTo(6, -10).quadraticCurveTo(6 + Math.cos(a) * 10, -20, 6 + Math.cos(a) * 20, -10 + Math.sin(a) * 8 + 4).stroke({ width: 5, color: C.green, cap: 'round' });
      break;
    case 'hammer':
      g.rect(-3, -6, 6, 26).fill(0xb98348).stroke(INK);
      g.rect(-14, -18, 28, 12).fill(color).stroke({ width: 2, color: C.ink });
      break;
    case 'fish':
      g.ellipse(-3, 0, 14, 8).fill(0x7fd8ff).stroke(INK);
      g.poly([9, 0, 18, -8, 18, 8]).fill(0x7fd8ff).stroke(INK);
      g.circle(-10, -2, 2).fill(C.ink);
      break;
    case 'swirl':
      g.circle(0, 0, 16).fill(C.plumInk).stroke(INK);
      g.arc(0, 0, 10, 0, Math.PI * 1.4).stroke({ width: 3, color: C.pinkHot, cap: 'round' });
      g.arc(0, 0, 5, Math.PI, Math.PI * 2.3).stroke({ width: 3, color: C.mint, cap: 'round' });
      break;
    case 'shovel':
      g.moveTo(-12, -16).lineTo(6, 6).stroke({ width: 4, color: 0x8a5a2e, cap: 'round' });
      g.poly([2, 4, 12, -2, 18, 12, 10, 18]).fill(0x9a9aa6).stroke(INK);
      break;
    case 'wrench':
      g.moveTo(-12, 12).lineTo(8, -8).stroke({ width: 6, color, cap: 'round' });
      g.circle(10, -10, 8).fill(color);
      g.circle(13, -13, 4).fill(accent);
      break;
    case 'coins':
      for (let i = 0; i < 3; i++) {
        g.ellipse(0, 10 - i * 8, 18, 7).fill(0xb8862a).stroke({ width: 2.5, color: C.ink });
        g.ellipse(0, 6 - i * 8, 18, 7).fill(C.yellow).stroke({ width: 2.5, color: C.ink });
      }
      break;
    case 'pin':
      g.moveTo(0, 4).lineTo(0, 18).stroke({ width: 3, color: C.ink, cap: 'round' });
      g.circle(0, -4, 10).fill(accent).stroke(INK);
      g.circle(-3, -7, 3).fill({ color: 0xffffff, alpha: 0.6 });
      break;
    case 'purr':
      g.poly([-12, -18, 12, -18, 0, 0, 12, 18, -12, 18, 0, 0]).fill(accent).stroke(INK);
      g.poly([-6, 12, 6, 12, 0, 4]).fill(C.yellow);
      break;
    case 'chevron':
      g.moveTo(-10, -6).lineTo(0, 6).lineTo(10, -6).stroke({ width: 5, color, cap: 'round', join: 'round' });
      break;
    case 'cards':
      g.roundRect(-18, -14, 22, 30, 3).fill(C.paper).stroke(INK);
      g.roundRect(-4, -18, 22, 30, 3).fill(0xb3202a).stroke(INK);
      g.circle(7, -3, 4).fill(C.paper);
      break;
  }
  c.addChild(g);
  return c;
}
