/**
 * Ink pictograms for the Reino panel (no emojis): drawn with Graphics, centered at (0,0), ~`s` px.
 * Falls back to ui/icons for the shared resource icons.
 */
import { Container, Graphics } from 'pixi.js';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';

export type GlyphKind =
  | 'gear'
  | 'island'
  | 'house'
  | 'fish'
  | 'anchor'
  | 'flame'
  | 'gem'
  | 'star'
  | 'bolt'
  | 'scroll'
  | 'sword'
  | 'lens'
  | 'clock'
  | 'coin'
  | 'repeat'
  | 'x10'
  | 'bank'
  | 'heart'
  | 'wave'
  | 'wrench'
  | 'bowl'
  | 'compass'
  | 'robot'
  | 'pin'
  | 'dot';

export function glyph(kind: GlyphKind, s = 28, ink: number = C.ink, fill: number = C.paper): Container {
  const c = new Container();
  const g = new Graphics();
  const k = s / 28;
  const line = { width: Math.max(1.6, 2.6 * k), color: ink, cap: 'round' as const, join: 'round' as const };
  switch (kind) {
    case 'gear': {
      const n = 8;
      const pts: number[] = [];
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const r = (i % 2 ? 10 : 13) * k;
        pts.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.poly(pts).fill(fill).stroke(line);
      g.circle(0, 0, 4 * k).fill(ink);
      break;
    }
    case 'island':
      g.moveTo(-13 * k, 7 * k).quadraticCurveTo(0, -3 * k, 13 * k, 7 * k).closePath().fill(0xe1cfa5).stroke(line);
      g.moveTo(-1 * k, 4 * k).quadraticCurveTo(1 * k, -6 * k, -1 * k, -11 * k).stroke(line);
      g.moveTo(-1 * k, -11 * k).quadraticCurveTo(-8 * k, -12 * k, -11 * k, -6 * k).moveTo(-1 * k, -11 * k).quadraticCurveTo(6 * k, -13 * k, 9 * k, -7 * k).stroke(line);
      g.moveTo(-14 * k, 11 * k).quadraticCurveTo(-10 * k, 9 * k, -6 * k, 11 * k).quadraticCurveTo(-2 * k, 13 * k, 2 * k, 11 * k).stroke({ ...line, width: line.width * 0.7 });
      break;
    case 'house':
      g.poly([-11 * k, -1 * k, 0, -11 * k, 11 * k, -1 * k]).fill(C.red).stroke(line);
      g.rect(-8 * k, -1 * k, 16 * k, 12 * k).fill(fill).stroke(line);
      g.rect(-2.5 * k, 4 * k, 5 * k, 7 * k).fill(ink);
      break;
    case 'fish':
      g.ellipse(-2 * k, 0, 9 * k, 6 * k).fill(0x7fd8ff).stroke(line);
      g.poly([6 * k, 0, 13 * k, -6 * k, 13 * k, 6 * k]).fill(0x7fd8ff).stroke(line);
      g.circle(-6 * k, -1.5 * k, 1.6 * k).fill(ink);
      break;
    case 'anchor':
      g.circle(0, -9 * k, 3 * k).stroke(line);
      g.moveTo(0, -6 * k).lineTo(0, 11 * k).moveTo(-6 * k, -2 * k).lineTo(6 * k, -2 * k).stroke(line);
      g.moveTo(-10 * k, 4 * k).quadraticCurveTo(-8 * k, 11 * k, 0, 11 * k).quadraticCurveTo(8 * k, 11 * k, 10 * k, 4 * k).stroke(line);
      break;
    case 'flame':
      c.addChild(icon('flame', s));
      return c;
    case 'gem':
      c.addChild(icon('gem', s));
      return c;
    case 'clock':
      c.addChild(icon('clock', s));
      return c;
    case 'coin':
      c.addChild(icon('gold', s));
      return c;
    case 'star':
      g.star(0, 0, 5, 13 * k, 5.5 * k).fill(C.yellow).stroke(line);
      break;
    case 'bolt':
      g.poly([3 * k, -13 * k, -7 * k, 2 * k, 0, 2 * k, -3 * k, 13 * k, 8 * k, -3 * k, 1 * k, -3 * k]).fill(C.yellow).stroke(line);
      break;
    case 'scroll':
      g.rect(-9 * k, -10 * k, 18 * k, 20 * k).fill(fill).stroke(line);
      g.moveTo(-5 * k, -4 * k).lineTo(5 * k, -4 * k).moveTo(-5 * k, 1 * k).lineTo(5 * k, 1 * k).moveTo(-5 * k, 6 * k).lineTo(2 * k, 6 * k).stroke({ ...line, width: line.width * 0.6 });
      break;
    case 'sword':
      g.moveTo(-10 * k, 10 * k).lineTo(9 * k, -9 * k).stroke({ ...line, width: line.width * 1.3 });
      g.moveTo(-9 * k, 3 * k).lineTo(-3 * k, 9 * k).stroke(line);
      g.moveTo(10 * k, 10 * k).lineTo(-9 * k, -9 * k).stroke({ ...line, width: line.width * 1.3 });
      g.moveTo(9 * k, 3 * k).lineTo(3 * k, 9 * k).stroke(line);
      break;
    case 'lens':
      g.circle(-3 * k, -3 * k, 8 * k).fill(0xd8ecff).stroke(line);
      g.moveTo(3 * k, 3 * k).lineTo(11 * k, 11 * k).stroke({ ...line, width: line.width * 1.6 });
      break;
    case 'repeat':
      g.arc(0, 0, 10 * k, -2.6, 0.6).stroke(line);
      g.poly([9.5 * k, 2 * k, 5 * k, 7 * k, 12 * k, 7.5 * k]).fill(ink);
      g.arc(0, 0, 6 * k, 0.6, 3.7).stroke({ ...line, width: line.width * 0.8 });
      break;
    case 'x10': {
      const t = txt('×10', { fontFamily: F.poster, fontSize: s * 0.8, fill: ink });
      t.anchor.set(0.5);
      c.addChild(t);
      return c;
    }
    case 'bank':
      g.poly([-12 * k, -4 * k, 0, -12 * k, 12 * k, -4 * k]).fill(C.yellow).stroke(line);
      for (const x of [-8, -2.7, 2.7, 8]) g.rect((x - 1.5) * k, -3 * k, 3 * k, 11 * k).fill(fill).stroke({ ...line, width: line.width * 0.6 });
      g.rect(-12 * k, 8 * k, 24 * k, 3 * k).fill(ink);
      break;
    case 'heart':
      g.moveTo(0, 10 * k)
        .bezierCurveTo(-14 * k, 0, -10 * k, -12 * k, 0, -5 * k)
        .bezierCurveTo(10 * k, -12 * k, 14 * k, 0, 0, 10 * k)
        .fill(C.pinkHot)
        .stroke(line);
      break;
    case 'wave':
      for (const yy of [-5, 2, 9]) {
        g.moveTo(-12 * k, yy * k);
        for (let i = 0; i < 3; i++) g.quadraticCurveTo((-12 + i * 8 + 4) * k, (yy - 5) * k, (-12 + (i + 1) * 8) * k, yy * k);
      }
      g.stroke(line);
      break;
    case 'wrench':
      g.moveTo(-9 * k, 9 * k).lineTo(4 * k, -4 * k).stroke({ ...line, width: line.width * 1.8 });
      g.circle(6 * k, -6 * k, 6 * k).fill(fill).stroke(line);
      g.rect(5 * k, -12 * k, 5 * k, 6 * k).fill(fill);
      break;
    case 'bowl':
      g.moveTo(-12 * k, -1 * k).quadraticCurveTo(0, 18 * k, 12 * k, -1 * k).closePath().fill(fill).stroke(line);
      g.moveTo(-4 * k, -3 * k).quadraticCurveTo(-2 * k, -9 * k, -4 * k, -12 * k).moveTo(3 * k, -3 * k).quadraticCurveTo(5 * k, -9 * k, 3 * k, -12 * k).stroke({ ...line, width: line.width * 0.7 });
      break;
    case 'compass':
      g.circle(0, 0, 12 * k).fill(fill).stroke(line);
      g.poly([0, -10 * k, 3 * k, 0, 0, 10 * k, -3 * k, 0]).fill(C.red);
      g.poly([0, 10 * k, 3 * k, 0, -3 * k, 0]).fill(ink);
      break;
    case 'robot':
      g.rect(-10 * k, -7 * k, 20 * k, 15 * k).fill(fill).stroke(line);
      g.circle(-4 * k, 0, 2.4 * k).circle(4 * k, 0, 2.4 * k).fill(ink);
      g.moveTo(0, -7 * k).lineTo(0, -12 * k).stroke(line);
      g.circle(0, -12 * k, 2 * k).fill(C.red);
      break;
    case 'pin':
      g.moveTo(0, 2 * k).lineTo(-4 * k, 12 * k).stroke(line);
      g.circle(1 * k, -4 * k, 7 * k).fill(C.red).stroke(line);
      break;
    default:
      g.circle(0, 0, 4 * k).fill(ink);
  }
  c.addChild(g);
  return c;
}
