/**
 * Accessory drawings (code only). drawAccessory(id, size) → Container centered at (0,0).
 * Exported so other views (island cats, cat panel) can overlay a cat's accessory if they want.
 */
import { Container, Graphics } from 'pixi.js';
import { C } from '../../ui/theme';

const INK = (s: number) => ({ width: Math.max(2, s / 26), color: C.ink, join: 'round' as const, cap: 'round' as const });

export function drawAccessory(id: string, s = 80): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const r = s / 2;
  const ink = INK(s);
  switch (id) {
    case 'gorro_lana':
      g.moveTo(-r * 0.75, r * 0.3).quadraticCurveTo(-r * 0.7, -r * 0.65, 0, -r * 0.7).quadraticCurveTo(r * 0.7, -r * 0.65, r * 0.75, r * 0.3).closePath().fill(0x3569a3).stroke(ink);
      g.rect(-r * 0.82, r * 0.18, r * 1.64, r * 0.32).fill(0xede4d6).stroke(ink);
      for (let i = -3; i <= 3; i++) g.moveTo(i * r * 0.2, r * 0.2).lineTo(i * r * 0.2, r * 0.48).stroke({ width: 2, color: C.ink, alpha: 0.4 });
      g.circle(0, -r * 0.78, r * 0.2).fill(0xede4d6).stroke(ink);
      break;
    case 'collar_cascabel':
      g.ellipse(0, -r * 0.1, r * 0.85, r * 0.32).stroke({ width: s / 9, color: C.red });
      g.ellipse(0, -r * 0.1, r * 0.85, r * 0.32).stroke({ width: 2, color: C.ink });
      g.circle(0, r * 0.32, r * 0.26).fill(0xffc94a).stroke(ink);
      g.moveTo(-r * 0.2, r * 0.32).lineTo(r * 0.2, r * 0.32).stroke({ width: 2, color: C.ink });
      g.circle(0, r * 0.42, r * 0.05).fill(C.ink);
      break;
    case 'mono':
      g.poly([0, 0, -r * 0.8, -r * 0.45, -r * 0.8, r * 0.45]).fill(C.pinkHot).stroke(ink);
      g.poly([0, 0, r * 0.8, -r * 0.45, r * 0.8, r * 0.45]).fill(C.pinkHot).stroke(ink);
      g.roundRect(-r * 0.18, -r * 0.22, r * 0.36, r * 0.44, 4).fill(0xff7ab8).stroke(ink);
      break;
    case 'paliacate':
      g.poly([-r * 0.9, -r * 0.4, r * 0.9, -r * 0.4, 0, r * 0.7]).fill(C.red).stroke(ink);
      for (const [x, y] of [
        [-0.4, -0.2],
        [0.3, -0.25],
        [0, 0.15],
        [-0.15, -0.05],
        [0.45, -0.1],
      ])
        g.circle(x * r, y * r, r * 0.06).fill(0xffffff);
      g.moveTo(-r * 0.6, -r * 0.4).quadraticCurveTo(-r * 0.4, -r * 0.6, -r * 0.2, -r * 0.4).stroke({ width: 2, color: 0xffffff });
      break;
    case 'gorro_fiesta':
      g.poly([0, -r * 0.9, r * 0.55, r * 0.55, -r * 0.55, r * 0.55]).fill(0xffc94a).stroke(ink);
      g.moveTo(-r * 0.32, r * 0.0).lineTo(r * 0.22, -r * 0.25).stroke({ width: s / 14, color: C.pinkHot });
      g.moveTo(-r * 0.45, r * 0.35).lineTo(r * 0.4, r * 0.08).stroke({ width: s / 14, color: C.cyan });
      g.star(0, -r * 0.92, 5, r * 0.22, r * 0.1).fill(C.pinkHot).stroke({ width: 2, color: C.ink });
      break;
    case 'lentes_sol': {
      // pixel shades
      const px = r * 0.16;
      const rows = ['XXXXXXX.XXXXXXX', '.XWWXX...XWWXX.', '.XXWWX...XXWWX.', '..XXX.....XXX..'];
      rows.forEach((row, yi) =>
        [...row].forEach((ch, xi) => {
          if (ch === '.') return;
          g.rect((xi - 7.5) * px, (yi - 2) * px, px, px).fill(ch === 'W' ? 0xffffff : C.ink);
        }),
      );
      break;
    }
    case 'parche':
      g.moveTo(-r * 0.9, -r * 0.5).lineTo(r * 0.9, r * 0.2).stroke({ width: s / 16, color: C.ink });
      g.ellipse(-r * 0.15, -r * 0.05, r * 0.38, r * 0.32).fill(C.ink);
      g.circle(-r * 0.15, -r * 0.05, r * 0.12).stroke({ width: 2, color: 0xede4d6, alpha: 0.6 });
      break;
    case 'tricornio':
      g.poly([-r * 0.95, r * 0.25, -r * 0.5, -r * 0.45, 0, -r * 0.62, r * 0.5, -r * 0.45, r * 0.95, r * 0.25, 0, r * 0.05]).fill(0x2b1f1a).stroke(ink);
      g.moveTo(-r * 0.85, r * 0.18).lineTo(0, -r * 0.02).lineTo(r * 0.85, r * 0.18).stroke({ width: s / 20, color: 0xffc94a });
      g.circle(0, -r * 0.2, r * 0.12).fill(0xede4d6).stroke({ width: 2, color: C.ink });
      break;
    case 'bufanda':
      g.roundRect(-r * 0.85, -r * 0.35, r * 1.7, r * 0.42, r * 0.2).fill(0x3fae6a).stroke(ink);
      g.roundRect(r * 0.15, -r * 0.1, r * 0.36, r * 0.9, 6).fill(0x3fae6a).stroke(ink);
      for (let i = 0; i < 4; i++) g.rect(-r * 0.7 + i * r * 0.4, -r * 0.35, r * 0.14, r * 0.42).fill(C.red);
      g.rect(r * 0.15, r * 0.35, r * 0.36, r * 0.14).fill(C.red);
      break;
    case 'monoculo':
      g.circle(0, 0, r * 0.45).fill({ color: 0xc6f0e4, alpha: 0.5 }).stroke({ width: s / 12, color: 0xffc94a });
      g.circle(0, 0, r * 0.45).stroke({ width: 2, color: C.ink });
      g.moveTo(r * 0.3, r * 0.35).bezierCurveTo(r * 0.5, r * 0.8, r * 0.1, r * 0.9, r * 0.35, r * 1.0).stroke({ width: 2, color: 0xffc94a });
      g.moveTo(-r * 0.2, -r * 0.2).lineTo(-r * 0.05, -r * 0.3).stroke({ width: 3, color: 0xffffff });
      break;
    case 'sombrerote':
      g.ellipse(0, r * 0.25, r * 0.98, r * 0.3).fill(0xb89558).stroke(ink);
      g.moveTo(-r * 0.4, r * 0.2).quadraticCurveTo(-r * 0.38, -r * 0.7, 0, -r * 0.72).quadraticCurveTo(r * 0.38, -r * 0.7, r * 0.4, r * 0.2).closePath().fill(0xb89558).stroke(ink);
      g.moveTo(-r * 0.4, r * 0.05).lineTo(r * 0.4, r * 0.05).stroke({ width: s / 12, color: C.red });
      for (let i = 0; i < 7; i++) g.circle(-r * 0.75 + i * r * 0.25, r * 0.3, r * 0.04).fill(0xffc94a);
      break;
    case 'chistera':
      g.rect(-r * 0.42, -r * 0.8, r * 0.84, r * 0.95).fill(C.ink).stroke({ width: 2, color: 0xede4d6, alpha: 0.4 });
      g.rect(-r * 0.42, -r * 0.05, r * 0.84, r * 0.18).fill(C.pinkHot);
      g.ellipse(0, r * 0.2, r * 0.75, r * 0.16).fill(C.ink).stroke({ width: 2, color: 0xede4d6, alpha: 0.4 });
      g.star(r * 0.55, -r * 0.7, 4, r * 0.18, r * 0.06).fill(0xffc94a);
      break;
    case 'capa_heroe':
      g.moveTo(-r * 0.35, -r * 0.8).lineTo(r * 0.35, -r * 0.8).lineTo(r * 0.8, r * 0.85).quadraticCurveTo(0, r * 0.6, -r * 0.8, r * 0.85).closePath().fill(C.red).stroke(ink);
      g.moveTo(-r * 0.1, -r * 0.6).lineTo(-r * 0.3, r * 0.6).stroke({ width: 2, color: 0x7a0a1a });
      g.moveTo(r * 0.1, -r * 0.6).lineTo(r * 0.3, r * 0.6).stroke({ width: 2, color: 0x7a0a1a });
      g.circle(0, -r * 0.78, r * 0.13).fill(0xffc94a).stroke({ width: 2, color: C.ink });
      break;
    case 'lentes_3d':
      g.roundRect(-r * 0.92, -r * 0.3, r * 1.84, r * 0.6, 6).fill(0xede4d6).stroke(ink);
      g.rect(-r * 0.78, -r * 0.2, r * 0.66, r * 0.4).fill(C.red);
      g.rect(r * 0.12, -r * 0.2, r * 0.66, r * 0.4).fill(C.cyan);
      g.moveTo(-r * 0.12, -r * 0.05).lineTo(r * 0.12, -r * 0.05).stroke({ width: 3, color: C.ink });
      break;
    case 'sombrero_bruja':
      g.ellipse(0, r * 0.5, r * 0.95, r * 0.22).fill(0x231626).stroke(ink);
      g.moveTo(-r * 0.5, r * 0.45).lineTo(r * 0.1, -r * 0.95).quadraticCurveTo(r * 0.25, -r * 0.6, r * 0.5, r * 0.45).closePath().fill(0x231626).stroke(ink);
      g.moveTo(-r * 0.42, r * 0.28).lineTo(r * 0.45, r * 0.28).stroke({ width: s / 12, color: C.violet });
      g.rect(-r * 0.1, r * 0.18, r * 0.2, r * 0.2).stroke({ width: 3, color: 0xffc94a });
      break;
    case 'cadena_oro':
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * 0.1 + (i / 8) * Math.PI * 0.8;
        g.ellipse(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.55 - r * 0.25, r * 0.12, r * 0.08).stroke({ width: s / 18, color: 0xffc94a });
      }
      g.circle(0, r * 0.45, r * 0.26).fill(0xffc94a).stroke(ink);
      g.star(0, r * 0.45, 5, r * 0.16, r * 0.07).fill(0xb8862a);
      break;
    case 'corona':
      g.poly([-r * 0.85, r * 0.45, -r * 0.85, -r * 0.35, -r * 0.42, r * 0.02, 0, -r * 0.65, r * 0.42, r * 0.02, r * 0.85, -r * 0.35, r * 0.85, r * 0.45]).fill(0xffc94a).stroke(ink);
      g.rect(-r * 0.85, r * 0.25, r * 1.7, r * 0.2).fill(0xe0a020);
      for (const [x, col] of [
        [-0.5, C.red],
        [0, C.cyan],
        [0.5, C.pinkHot],
      ] as const)
        g.circle(x * r, r * 0.35, r * 0.09).fill(col).stroke({ width: 2, color: C.ink });
      g.circle(0, -r * 0.68, r * 0.09).fill(C.pinkHot).stroke({ width: 2, color: C.ink });
      break;
    case 'capa_cosmica':
      g.moveTo(-r * 0.35, -r * 0.8).lineTo(r * 0.35, -r * 0.8).lineTo(r * 0.85, r * 0.85).quadraticCurveTo(0, r * 0.6, -r * 0.85, r * 0.85).closePath().fill(0x1f2b4a).stroke(ink);
      for (const [x, y, k] of [
        [-0.3, 0.1, 1],
        [0.25, 0.35, 0.7],
        [0.05, -0.35, 0.8],
        [-0.45, 0.55, 0.6],
        [0.5, 0.65, 0.9],
      ])
        g.star(x * r, y * r, 4, r * 0.12 * k, r * 0.04).fill(0xffffff);
      g.circle(r * 0.15, r * 0.1, r * 0.16).fill(C.violet).stroke({ width: 2, color: C.cyan });
      break;
    case 'aureola_glitch':
      g.ellipse(4, -2, r * 0.8, r * 0.28).stroke({ width: s / 10, color: C.cyan, alpha: 0.8 });
      g.ellipse(-4, 2, r * 0.8, r * 0.28).stroke({ width: s / 10, color: C.pinkHot, alpha: 0.8 });
      g.ellipse(0, 0, r * 0.8, r * 0.28).stroke({ width: s / 14, color: 0xffffff });
      for (let i = 0; i < 4; i++) g.rect(-r * 0.9 + i * r * 0.5, -r * 0.42 + (i % 2) * r * 0.7, r * 0.3, r * 0.08).fill(i % 2 ? C.cyan : C.pinkHot);
      break;
    default:
      g.circle(0, 0, r * 0.6).fill(C.paperDark).stroke(ink);
  }
  return c;
}
