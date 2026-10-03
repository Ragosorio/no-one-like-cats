import { Container, Graphics } from 'pixi.js';
import { C } from './theme';

export type IconKind =
  | 'gold'
  | 'food'
  | 'gem'
  | 'orb'
  | 'scrap'
  | 'crystal'
  | 'blueprint'
  | 'crown'
  | 'flame'
  | 'clock'
  | 'clockRed'
  | 'paw'
  | 'star'
  | 'chip'
  | 'lock'
  | 'essence';

const INK = { width: 3, color: C.ink, join: 'round' as const };

/** Procedural poster-style icons, centered at (0,0), roughly `s` px wide. */
export function icon(kind: IconKind, s = 40, tint?: number): Container {
  const c = new Container();
  const g = new Graphics();
  const r = s / 2;
  switch (kind) {
    case 'gold':
      g.circle(0, 0, r).fill(0xffc94a).stroke(INK);
      g.circle(0, 0, r * 0.7).stroke({ width: 2, color: 0xb8862a });
      paw(g, 0, 2, r * 0.42, 0xb8862a);
      break;
    case 'food': {
      const w = r * 1.0;
      g.ellipse(-r * 0.15, 0, w, r * 0.55).fill(0x7fd8ff).stroke(INK);
      g.poly([r * 0.7, 0, r * 1.05, -r * 0.5, r * 1.05, r * 0.5]).fill(0x7fd8ff).stroke(INK);
      g.circle(-r * 0.6, -r * 0.12, r * 0.12).fill(C.ink);
      g.moveTo(-r * 0.25, -r * 0.35).quadraticCurveTo(-r * 0.1, 0, -r * 0.25, r * 0.35).stroke({ width: 2, color: C.ink });
      break;
    }
    case 'gem':
      g.poly([0, -r, r * 0.85, -r * 0.25, 0, r, -r * 0.85, -r * 0.25]).fill(C.pinkHot).stroke(INK);
      g.poly([0, -r, r * 0.35, -r * 0.25, 0, r * 0.5, -r * 0.35, -r * 0.25]).fill({ color: 0xffffff, alpha: 0.35 });
      break;
    case 'orb':
      g.circle(0, 0, r * 0.9).fill(tint ?? C.violet).stroke(INK);
      g.circle(-r * 0.3, -r * 0.3, r * 0.25).fill({ color: 0xffffff, alpha: 0.6 });
      break;
    case 'scrap': {
      const n = 8;
      const pts: number[] = [];
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const rr = i % 2 ? r * 0.72 : r;
        pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.poly(pts).fill(0x8a95a3).stroke(INK);
      g.circle(0, 0, r * 0.32).fill(C.ink);
      break;
    }
    case 'crystal':
      g.poly([0, -r, r * 0.5, -r * 0.2, r * 0.3, r, -r * 0.3, r, -r * 0.5, -r * 0.2]).fill(tint ?? C.mint).stroke(INK);
      g.moveTo(0, -r).lineTo(0, r).stroke({ width: 2, color: C.ink, alpha: 0.5 });
      break;
    case 'blueprint':
      g.rect(-r, -r * 0.7, r * 2, r * 1.4).fill(0x3569a3).stroke(INK);
      g.rect(-r * 0.6, -r * 0.35, r * 1.2, r * 0.7).stroke({ width: 2, color: 0xffffff });
      g.moveTo(-r * 0.6, 0).lineTo(r * 0.6, 0).stroke({ width: 2, color: 0xffffff });
      break;
    case 'crown':
      g.poly([-r, r * 0.6, -r, -r * 0.4, -r * 0.45, r * 0.05, 0, -r * 0.7, r * 0.45, r * 0.05, r, -r * 0.4, r, r * 0.6]).fill(C.yellow).stroke(INK);
      break;
    case 'flame':
      g.moveTo(0, -r)
        .bezierCurveTo(r * 0.9, -r * 0.2, r * 0.8, r, 0, r)
        .bezierCurveTo(-r * 0.8, r, -r * 0.9, -r * 0.1, -r * 0.2, -r * 0.4)
        .bezierCurveTo(-r * 0.1, -r * 0.1, r * 0.1, -r * 0.2, 0, -r)
        .fill(C.orange)
        .stroke(INK);
      g.ellipse(0, r * 0.4, r * 0.35, r * 0.45).fill(C.yellow);
      break;
    case 'clock':
    case 'clockRed':
      g.circle(0, 0, r * 0.9).fill(kind === 'clock' ? C.green : C.red).stroke(INK);
      g.moveTo(0, 0).lineTo(0, -r * 0.55).moveTo(0, 0).lineTo(r * 0.4, 0).stroke({ width: 3, color: C.paper, cap: 'round' });
      break;
    case 'paw':
      paw(g, 0, 0, r, tint ?? C.ink);
      break;
    case 'star':
      g.star(0, 0, 5, r, r * 0.45).fill(tint ?? C.yellow).stroke(INK);
      break;
    case 'chip':
      g.circle(0, 0, r * 0.9).fill(C.red).stroke(INK);
      g.circle(0, 0, r * 0.6).stroke({ width: 3, color: C.paper });
      paw(g, 0, 1, r * 0.35, C.paper);
      break;
    case 'lock':
      g.roundRect(-r * 0.7, -r * 0.1, r * 1.4, r * 1.0, 4).fill(C.ink);
      g.arc(0, -r * 0.1, r * 0.45, Math.PI, 0).stroke({ width: 4, color: C.ink });
      break;
    case 'essence':
      g.circle(0, 0, r * 0.8).fill(C.lilac).stroke(INK);
      g.star(0, 0, 4, r * 0.6, r * 0.2).fill(0xffffff);
      break;
  }
  c.addChild(g);
  return c;
}

function paw(g: Graphics, x: number, y: number, r: number, color: number) {
  g.ellipse(x, y + r * 0.35, r * 0.5, r * 0.42).fill(color);
  for (const [dx, dy] of [
    [-0.55, -0.2],
    [-0.2, -0.55],
    [0.2, -0.55],
    [0.55, -0.2],
  ])
    g.circle(x + dx * r, y + dy * r, r * 0.2).fill(color);
}
