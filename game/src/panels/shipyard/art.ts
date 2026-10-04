/**
 * Astillero art kit: blueprint sheet (plano técnico azul), hand annotations (tinta/marcador),
 * weapon / gear / module glyphs, bubble shield, welding sparks and cached ship thumbnails.
 */
import { Container, Graphics, Sprite, Text, Texture, Ticker, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt, Button } from '../../ui/widgets';
import { paperTexture, hatchTexture, sparkTexture, glowTexture } from '../../art/textures';
import { game } from '../../core/App';
import { AnimeShipView, hullStyleForMk } from '../../battle/anime';
import { CELL, ShipBlueprint, ShipModel } from '../../battle/ship';
import { SilhouetteFilter } from '../../fx/filters';

/** blueprint palette */
export const BP = {
  sheet: 0x1d4f91,
  sheetDark: 0x143a6e,
  deep: 0x0e2c57,
  line: 0x9cc3f0,
  white: 0xffffff,
  chalk: 0xeaf4ff,
  red: 0xff5a6e,
  green: 0x7cf2b0,
  yellow: 0xffd84a,
  cyan: 0x7fe3ff,
} as const;

// ---------------------------------------------------------------- sheet
/** blueprint sheet with fine + major grid, inner frame, registration marks and print grain */
export function bpSheet(w: number, h: number, o: { shadow?: boolean; grain?: boolean; frame?: boolean } = {}): Container {
  const c = new Container();
  if (o.shadow !== false) c.addChild(new Graphics().rect(8, 8, w, h).fill(C.ink));
  c.addChild(new Graphics().rect(0, 0, w, h).fill(BP.sheet));
  // vignette (darker edges)
  const vig = new Graphics();
  for (let i = 0; i < 6; i++) vig.rect(i * 6, i * 6, w - i * 12, h - i * 12).stroke({ width: 6, color: BP.deep, alpha: 0.14 - i * 0.02 });
  c.addChild(vig);
  const g1 = new Graphics();
  for (let x = 0; x <= w; x += 20) g1.moveTo(x, 0).lineTo(x, h);
  for (let y = 0; y <= h; y += 20) g1.moveTo(0, y).lineTo(w, y);
  g1.stroke({ width: 1, color: BP.line, alpha: 0.12 });
  const g2 = new Graphics();
  for (let x = 0; x <= w; x += 100) g2.moveTo(x, 0).lineTo(x, h);
  for (let y = 0; y <= h; y += 100) g2.moveTo(0, y).lineTo(w, y);
  g2.stroke({ width: 1.5, color: BP.line, alpha: 0.26 });
  c.addChild(g1, g2);
  if (o.grain !== false) {
    const grain = new TilingSprite({ texture: paperTexture(0x8fb4e6, 256, 2.2), width: w, height: h });
    grain.alpha = 0.1;
    grain.blendMode = 'screen';
    c.addChild(grain);
  }
  if (o.frame !== false) {
    const fr = new Graphics().rect(10, 10, w - 20, h - 20).stroke({ width: 2, color: BP.white, alpha: 0.75 });
    // registration crosses in the corners
    const cross = (x: number, y: number) => fr.moveTo(x - 9, y).lineTo(x + 9, y).moveTo(x, y - 9).lineTo(x, y + 9).circle(x, y, 5);
    cross(22, 22);
    cross(w - 22, 22);
    cross(22, h - 22);
    cross(w - 22, h - 22);
    fr.stroke({ width: 1.5, color: BP.white, alpha: 0.7 });
    c.addChild(fr);
  }
  c.addChild(new Graphics().rect(0, 0, w, h).stroke({ width: 4, color: C.ink }));
  return c;
}

/** handwritten note (Permanent Marker) */
export function handNote(text: string, size = 22, color: number = BP.yellow, rot = -0.03, extra: Record<string, unknown> = {}): Text {
  const t = txt(text, { fontFamily: F.brush, fontSize: size, fill: color, ...extra });
  t.rotation = rot;
  return t;
}

/** wobbly hand-drawn arrow from (x0,y0) to (x1,y1) */
export function handArrow(x0: number, y0: number, x1: number, y1: number, color: number = BP.yellow, width = 2.5, seed = 1): Graphics {
  const g = new Graphics();
  const n = 10;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bow = Math.min(40, len * 0.18) * (seed % 2 ? 1 : -1);
  g.moveTo(x0, y0);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const b = Math.sin(t * Math.PI) * bow + Math.sin(t * 17 + seed) * 1.2;
    g.lineTo(x0 + dx * t + nx * b, y0 + dy * t + ny * b);
  }
  const a = Math.atan2(y1 - (y0 + dy * 0.9 + ny * Math.sin(0.9 * Math.PI) * bow), x1 - (x0 + dx * 0.9 + nx * Math.sin(0.9 * Math.PI) * bow));
  g.moveTo(x1, y1).lineTo(x1 - Math.cos(a - 0.45) * 13, y1 - Math.sin(a - 0.45) * 13);
  g.moveTo(x1, y1).lineTo(x1 - Math.cos(a + 0.45) * 13, y1 - Math.sin(a + 0.45) * 13);
  g.stroke({ width, color, cap: 'round', join: 'round' });
  return g;
}

/** hand-drawn circle (double loop, slightly open) around a point */
export function handCircle(x: number, y: number, rx: number, ry: number, color: number = BP.yellow, width = 2.5): Graphics {
  const g = new Graphics();
  const steps = 40;
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2 * 0.96 + k * 0.4;
      const wob = 1 + Math.sin(t * 3 + k) * 0.04;
      const px = x + Math.cos(t) * rx * wob * (1 + k * 0.05);
      const py = y + Math.sin(t) * ry * wob * (1 + k * 0.05);
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
  }
  g.stroke({ width, color, cap: 'round', alpha: 0.95 });
  return g;
}

// ---------------------------------------------------------------- glyphs
const INK = (w = 3) => ({ width: w, color: C.ink, join: 'round' as const, cap: 'round' as const });

/** weapon type glyph centred at 0,0 (~s px) */
export function weaponGlyph(id: string, s = 48, o: { mono?: number } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  const k = s / 48;
  const col = (v: number) => o.mono ?? v;
  const sw = Math.max(2, 3 * k);
  switch (id) {
    case 'canon': {
      // barrel on a carriage + ball
      g.roundRect(-18 * k, -6 * k, 30 * k, 12 * k, 5 * k).fill(col(0x3a3f55)).stroke(INK(sw));
      g.rect(10 * k, -8 * k, 6 * k, 16 * k).fill(col(0x2a2d3e)).stroke(INK(sw));
      g.roundRect(-16 * k, 5 * k, 22 * k, 8 * k, 2 * k).fill(col(0xa8683a)).stroke(INK(sw));
      g.circle(-11 * k, 15 * k, 5 * k).fill(col(0x6e3f22)).stroke(INK(sw));
      g.circle(2 * k, 15 * k, 5 * k).fill(col(0x6e3f22)).stroke(INK(sw));
      g.circle(21 * k, -14 * k, 5 * k).fill(col(0x171317));
      break;
    }
    case 'mortero': {
      g.poly([-14 * k, 16 * k, 14 * k, 16 * k, 10 * k, -4 * k, -10 * k, -4 * k]).fill(col(0x4a3a3a)).stroke(INK(sw));
      g.ellipse(0, -5 * k, 11 * k, 4 * k).fill(col(0x171317)).stroke(INK(sw));
      // magma blob arcing up
      g.circle(6 * k, -20 * k, 6 * k).fill(col(0xff6a1a)).stroke(INK(sw * 0.8));
      g.circle(4 * k, -22 * k, 2.5 * k).fill(col(0xffd84a));
      g.moveTo(-2 * k, -9 * k).quadraticCurveTo(0, -18 * k, 2 * k, -16 * k).stroke({ width: 2 * k, color: col(0xff6a1a) });
      g.rect(-18 * k, 15 * k, 36 * k, 5 * k).fill(col(0x6e3f22)).stroke(INK(sw * 0.8));
      break;
    }
    case 'tesla': {
      g.rect(-4 * k, -6 * k, 8 * k, 24 * k).fill(col(0x30344a)).stroke(INK(sw));
      for (let i = 0; i < 4; i++) g.ellipse(0, (12 - i * 6) * k, 10 * k, 3 * k).fill(col(0xb87333)).stroke(INK(sw * 0.7));
      g.circle(0, -12 * k, 7 * k).fill(col(0x7fe3ff)).stroke(INK(sw));
      g.moveTo(4 * k, -16 * k).lineTo(20 * k, -22 * k).lineTo(12 * k, -12 * k).lineTo(22 * k, -6 * k);
      g.moveTo(-4 * k, -16 * k).lineTo(-18 * k, -24 * k).lineTo(-12 * k, -14 * k).lineTo(-22 * k, -10 * k);
      g.stroke({ width: 3 * k, color: col(0xffd84a), join: 'round', cap: 'round' });
      break;
    }
    case 'escarcha': {
      for (const a of [-0.45, 0, 0.45]) {
        const x = Math.sin(a) * 22 * k;
        const y = -Math.cos(a) * 22 * k;
        g.poly([0, 4 * k, x - 4 * k * Math.cos(a), y - 4 * k * Math.sin(a), x, y - 3 * k, x + 4 * k * Math.cos(a), y + 4 * k * Math.sin(a)]).fill(col(0xc6f0ff)).stroke(INK(sw * 0.8));
      }
      g.roundRect(-10 * k, 4 * k, 20 * k, 14 * k, 4 * k).fill(col(0x3569a3)).stroke(INK(sw));
      break;
    }
    case 'arpon': {
      g.moveTo(-20 * k, 14 * k).lineTo(14 * k, -12 * k).stroke({ width: 4 * k, color: col(0x6e3f22), cap: 'round' });
      g.poly([20 * k, -18 * k, 8 * k, -14 * k, 12 * k, -8 * k]).fill(col(0xd9d4de)).stroke(INK(sw * 0.8));
      g.poly([10 * k, -10 * k, 4 * k, -16 * k, 6 * k, -6 * k]).fill(col(0xd9d4de)).stroke(INK(sw * 0.7));
      g.moveTo(-20 * k, 14 * k).bezierCurveTo(-26 * k, 20 * k, -10 * k, 22 * k, -18 * k, 26 * k).stroke({ width: 1.5 * k, color: col(0xede4d6) });
      break;
    }
    case 'riel': {
      g.rect(-20 * k, -9 * k, 40 * k, 5 * k).fill(col(0x8f6b93)).stroke(INK(sw * 0.8));
      g.rect(-20 * k, 4 * k, 40 * k, 5 * k).fill(col(0x8f6b93)).stroke(INK(sw * 0.8));
      g.poly([0, -12 * k, 9 * k, 0, 0, 12 * k, -9 * k, 0]).fill(col(0xff7ab8)).stroke(INK(sw));
      g.circle(0, 0, 2.5 * k).fill(col(0xffffff));
      break;
    }
    case 'starbreaker': {
      g.star(0, 0, 5, 18 * k, 8 * k).fill(col(0x00e5ff)).stroke(INK(sw));
      g.rect(10 * k, -2 * k, 18 * k, 4 * k).fill(col(0xff2e88));
      g.circle(0, 0, 4 * k).fill(col(0xffffff));
      break;
    }
    default:
      g.circle(0, 0, 14 * k).fill(col(0x9a8f80)).stroke(INK(sw));
  }
  c.addChild(g);
  return c;
}

/** relic/artifact glyph centred at 0,0 */
export function gearGlyph(glyph: string, s = 48, color: number = C.yellow, o: { mono?: number } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  const k = s / 48;
  const col = (v: number) => o.mono ?? v;
  const sw = Math.max(2, 2.6 * k);
  switch (glyph) {
    case 'whisker':
      for (const sx of [-1, 1])
        for (let i = 0; i < 3; i++) {
          const droop = i === 2 && sx > 0 ? 8 * k : 0;
          g.moveTo(0, (i - 1) * 5 * k).bezierCurveTo(8 * k * sx, (i - 1) * 7 * k - 4 * k, 16 * k * sx, (i - 1) * 9 * k, 22 * k * sx, (i - 1) * 11 * k + droop);
        }
      g.stroke({ width: 3 * k, color: col(C.ink), cap: 'round' });
      g.circle(0, 0, 5 * k).fill(col(color)).stroke(INK(sw * 0.8));
      // the broken one
      g.moveTo(14 * k, 10 * k).lineTo(18 * k, 18 * k).stroke({ width: 2 * k, color: col(C.red) });
      break;
    case 'eye':
      g.poly([-22 * k, 0, -8 * k, -12 * k, 8 * k, -12 * k, 22 * k, 0, 8 * k, 12 * k, -8 * k, 12 * k]).fill(col(0xede4d6)).stroke(INK(sw));
      g.circle(0, 0, 9 * k).fill(col(color)).stroke(INK(sw * 0.8));
      g.ellipse(0, 0, 2.5 * k, 8 * k).fill(col(C.ink));
      g.moveTo(-14 * k, -18 * k).lineTo(-8 * k, -12 * k).moveTo(14 * k, -18 * k).lineTo(8 * k, -12 * k).stroke({ width: 2 * k, color: col(C.ink) });
      break;
    case 'mask':
      g.poly([-22 * k, -6 * k, -6 * k, -10 * k, 0, -4 * k, 6 * k, -10 * k, 22 * k, -6 * k, 18 * k, 8 * k, 6 * k, 10 * k, 0, 4 * k, -6 * k, 10 * k, -18 * k, 8 * k]).fill(col(color)).stroke(INK(sw));
      g.ellipse(-9 * k, 0, 5 * k, 3.5 * k).fill(col(C.ink));
      g.ellipse(9 * k, 0, 5 * k, 3.5 * k).fill(col(C.ink));
      g.moveTo(22 * k, -6 * k).bezierCurveTo(28 * k, -14 * k, 22 * k, -22 * k, 16 * k, -20 * k).stroke({ width: 2 * k, color: col(0xd296ff) });
      break;
    case 'crown':
      g.poly([-18 * k, 12 * k, -20 * k, -10 * k, -9 * k, 0, 0, -16 * k, 9 * k, 0, 20 * k, -10 * k, 18 * k, 12 * k]).fill(col(color)).stroke(INK(sw));
      g.poly([-2 * k, -6 * k, 4 * k, -6 * k, 0, 2 * k, 5 * k, 2 * k, -3 * k, 12 * k, -1 * k, 4 * k, -5 * k, 4 * k]).fill(col(0x00e5ff)).stroke(INK(sw * 0.6));
      break;
    case 'sucker':
      g.circle(0, 0, 18 * k).fill(col(color)).stroke(INK(sw));
      g.circle(0, 0, 11 * k).fill(col(0x172b35)).stroke(INK(sw * 0.7));
      g.circle(0, 0, 5 * k).fill(col(0xffd400));
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.circle(Math.cos(a) * 15 * k, Math.sin(a) * 15 * k, 1.5 * k).fill(col(0xede4d6));
      }
      break;
    case 'book':
      g.roundRect(-16 * k, -18 * k, 32 * k, 36 * k, 3 * k).fill(col(color)).stroke(INK(sw));
      g.rect(-16 * k, -18 * k, 6 * k, 36 * k).fill(col(0x231626));
      g.star(3 * k, 0, 5, 8 * k, 3.5 * k).fill(col(0xb89558));
      break;
    case 'dust':
      g.star(0, 0, 4, 14 * k, 4 * k).fill(col(color)).stroke(INK(sw * 0.7));
      g.star(14 * k, -12 * k, 4, 7 * k, 2 * k).fill(col(0xff2e88));
      g.star(-14 * k, 12 * k, 4, 6 * k, 2 * k).fill(col(0x8a5cff));
      break;
    case 'tooth':
      g.poly([-12 * k, -18 * k, 12 * k, -18 * k, 14 * k, -4 * k, 4 * k, 20 * k, 0, 6 * k, -4 * k, 20 * k, -14 * k, -4 * k]).fill(col(color)).stroke(INK(sw));
      break;
    case 'wrench':
      g.roundRect(-4 * k, -6 * k, 8 * k, 28 * k, 3 * k).fill(col(0x6d7699)).stroke(INK(sw));
      g.circle(0, -12 * k, 10 * k).fill(col(0x6d7699)).stroke(INK(sw));
      g.rect(-4 * k, -24 * k, 8 * k, 10 * k).fill(col(0x1d4f91));
      g.roundRect(8 * k, 2 * k, 14 * k, 16 * k, 3 * k).fill(col(color)).stroke(INK(sw * 0.8));
      break;
    case 'bubble':
      g.circle(0, 0, 19 * k).fill({ color: col(color), alpha: 0.55 }).stroke(INK(sw));
      g.ellipse(-7 * k, -8 * k, 6 * k, 4 * k).fill(col(0xffffff));
      g.circle(8 * k, 9 * k, 2 * k).fill(col(0xffffff));
      break;
    case 'smoke':
      g.circle(-8 * k, 4 * k, 11 * k).fill(col(color)).stroke(INK(sw));
      g.circle(8 * k, 2 * k, 12 * k).fill(col(color)).stroke(INK(sw));
      g.circle(0, -9 * k, 11 * k).fill(col(0xb9b2a0)).stroke(INK(sw));
      g.circle(10 * k, 18 * k, 5 * k).fill(col(C.ink));
      g.moveTo(10 * k, 13 * k).lineTo(14 * k, 6 * k).stroke({ width: 2 * k, color: col(C.orange) });
      break;
    case 'anchor':
      g.circle(0, -16 * k, 5 * k).stroke(INK(sw));
      g.moveTo(0, -11 * k).lineTo(0, 18 * k).moveTo(-10 * k, -4 * k).lineTo(10 * k, -4 * k).stroke({ width: 4 * k, color: col(color), cap: 'round' });
      g.moveTo(-16 * k, 6 * k).quadraticCurveTo(-12 * k, 20 * k, 0, 18 * k).quadraticCurveTo(12 * k, 20 * k, 16 * k, 6 * k).stroke({ width: 4 * k, color: col(color), cap: 'round' });
      break;
    case 'leaf':
      g.moveTo(0, 20 * k).bezierCurveTo(-22 * k, 4 * k, -14 * k, -18 * k, 0, -20 * k).bezierCurveTo(14 * k, -18 * k, 22 * k, 4 * k, 0, 20 * k).fill(col(color)).stroke(INK(sw));
      g.moveTo(0, 18 * k).lineTo(0, -14 * k).stroke({ width: 2 * k, color: col(0x1d5a36) });
      for (let i = 0; i < 3; i++) g.moveTo(0, (8 - i * 8) * k).lineTo(-8 * k, (2 - i * 8) * k).moveTo(0, (8 - i * 8) * k).lineTo(8 * k, (2 - i * 8) * k);
      g.stroke({ width: 1.5 * k, color: col(0x1d5a36) });
      break;
    case 'flare':
      g.roundRect(-6 * k, -2 * k, 12 * k, 22 * k, 3 * k).fill(col(0xc8102e)).stroke(INK(sw));
      g.star(0, -12 * k, 8, 12 * k, 5 * k).fill(col(color)).stroke(INK(sw * 0.6));
      g.circle(0, -12 * k, 4 * k).fill(col(0xfff2a8));
      break;
    default:
      g.circle(0, 0, 16 * k).fill(col(color)).stroke(INK(sw));
  }
  c.addChild(g);
  return c;
}

/** round medal with a glyph (relics/artifacts) */
export function medal(glyph: string, color: number, r = 34, o: { locked?: boolean; ring?: number } = {}): Container {
  const c = new Container();
  const g = new Graphics()
    .circle(3, 4, r)
    .fill(C.ink)
    .circle(0, 0, r)
    .fill(o.locked ? 0x2a2a35 : 0xede4d6)
    .stroke({ width: 4, color: o.ring ?? C.ink });
  if (!o.locked) {
    const teeth = new Graphics();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      teeth.circle(Math.cos(a) * (r - 7), Math.sin(a) * (r - 7), 1.6);
    }
    teeth.fill({ color, alpha: 0.9 });
    c.addChild(g, teeth);
  } else c.addChild(g);
  const gl = gearGlyph(glyph, r * 1.15, color, o.locked ? { mono: 0x45455a } : {});
  c.addChild(gl);
  if (o.locked) {
    const q = txt('?', { fontFamily: F.poster, fontSize: r * 0.9, fill: 0x9a9ab0 });
    q.anchor.set(0.5);
    c.addChild(q);
  }
  return c;
}

/** utility / structural module glyph (editor palette & plan) */
export function moduleGlyph(kind: string, s = 36, color: number = BP.white): Container {
  const c = new Container();
  const g = new Graphics();
  const k = s / 36;
  const st = { width: Math.max(1.6, 2.2 * k), color, cap: 'round' as const, join: 'round' as const };
  switch (kind) {
    case 'mast':
      g.moveTo(0, 16 * k).lineTo(0, -16 * k).stroke(st);
      g.poly([2 * k, -14 * k, 14 * k, -4 * k, 2 * k, 6 * k]).stroke(st);
      g.rect(-5 * k, -18 * k, 10 * k, 4 * k).stroke(st);
      break;
    case 'powder':
      g.roundRect(-10 * k, -12 * k, 20 * k, 26 * k, 6 * k).stroke(st);
      g.moveTo(-10 * k, -4 * k).lineTo(10 * k, -4 * k).moveTo(-10 * k, 6 * k).lineTo(10 * k, 6 * k).stroke(st);
      g.moveTo(4 * k, -12 * k).quadraticCurveTo(8 * k, -20 * k, 13 * k, -18 * k).stroke(st);
      g.star(14 * k, -18 * k, 5, 4 * k, 1.5 * k).fill(BP.yellow);
      break;
    case 'arcane':
      g.circle(0, 0, 13 * k).stroke(st);
      g.star(0, 0, 6, 9 * k, 4 * k).stroke(st);
      break;
    case 'pantry':
      g.moveTo(-14 * k, 0).bezierCurveTo(-6 * k, -10 * k, 6 * k, -10 * k, 10 * k, 0).bezierCurveTo(6 * k, 10 * k, -6 * k, 10 * k, -14 * k, 0).stroke(st);
      g.poly([10 * k, 0, 16 * k, -6 * k, 16 * k, 6 * k]).stroke(st);
      g.circle(-6 * k, -2 * k, 1.6 * k).fill(color);
      break;
    case 'pump':
      g.circle(0, 2 * k, 10 * k).stroke(st);
      g.moveTo(0, -8 * k).lineTo(0, -16 * k).lineTo(10 * k, -16 * k).stroke(st);
      g.moveTo(-4 * k, 2 * k).bezierCurveTo(-2 * k, -4 * k, 2 * k, -4 * k, 4 * k, 2 * k).stroke(st);
      break;
    case 'anchor':
      g.circle(0, -12 * k, 3.5 * k).stroke(st);
      g.moveTo(0, -8 * k).lineTo(0, 14 * k).moveTo(-7 * k, -3 * k).lineTo(7 * k, -3 * k).stroke(st);
      g.moveTo(-12 * k, 4 * k).quadraticCurveTo(-9 * k, 15 * k, 0, 14 * k).quadraticCurveTo(9 * k, 15 * k, 12 * k, 4 * k).stroke(st);
      break;
    case 'bridge':
      g.circle(0, 0, 11 * k).stroke(st);
      g.circle(0, 0, 3 * k).stroke(st);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.moveTo(Math.cos(a) * 3 * k, Math.sin(a) * 3 * k).lineTo(Math.cos(a) * 16 * k, Math.sin(a) * 16 * k);
      }
      g.stroke(st);
      break;
    case 'tower':
      g.poly([-8 * k, 16 * k, -5 * k, -10 * k, 5 * k, -10 * k, 8 * k, 16 * k]).stroke(st);
      g.circle(0, -14 * k, 5 * k).stroke(st);
      break;
    case 'bulkhead':
      g.rect(-10 * k, -14 * k, 20 * k, 28 * k).stroke(st);
      g.moveTo(-10 * k, -14 * k).lineTo(10 * k, 14 * k).moveTo(10 * k, -14 * k).lineTo(-10 * k, 14 * k).stroke({ ...st, width: st.width * 0.7 });
      break;
    case 'cannon':
      g.roundRect(-14 * k, -5 * k, 24 * k, 10 * k, 4 * k).stroke(st);
      g.rect(10 * k, -7 * k, 5 * k, 14 * k).stroke(st);
      g.circle(-8 * k, 9 * k, 4 * k).stroke(st);
      break;
    case 'core':
      g.moveTo(0, 14 * k).bezierCurveTo(-18 * k, 2 * k, -12 * k, -14 * k, 0, -6 * k).bezierCurveTo(12 * k, -14 * k, 18 * k, 2 * k, 0, 14 * k).stroke(st);
      break;
    case 'catroom':
      g.poly([-12 * k, 12 * k, -12 * k, -4 * k, -8 * k, -14 * k, -4 * k, -6 * k, 4 * k, -6 * k, 8 * k, -14 * k, 12 * k, -4 * k, 12 * k, 12 * k]).stroke(st);
      g.circle(-5 * k, 2 * k, 1.8 * k).circle(5 * k, 2 * k, 1.8 * k).fill(color);
      break;
    case 'engine':
      g.circle(0, 0, 12 * k).stroke(st);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.moveTo(Math.cos(a) * 12 * k, Math.sin(a) * 12 * k).lineTo(Math.cos(a) * 16 * k, Math.sin(a) * 16 * k);
      }
      g.stroke(st);
      g.circle(0, 0, 4 * k).fill(color);
      break;
    case 'shield':
      g.moveTo(0, -15 * k).lineTo(12 * k, -9 * k).lineTo(10 * k, 6 * k).lineTo(0, 15 * k).lineTo(-10 * k, 6 * k).lineTo(-12 * k, -9 * k).closePath().stroke(st);
      g.ellipse(-3 * k, -5 * k, 3 * k, 2 * k).fill(color);
      break;
    default:
      g.rect(-10 * k, -10 * k, 20 * k, 20 * k).stroke(st);
  }
  c.addChild(g);
  return c;
}

// ---------------------------------------------------------------- bubble shield
/** translucent dome with a hex lattice and specular highlights (local origin = centre) */
export function bubbleShield(rx: number, ry: number): Container {
  const c = new Container();
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.width = rx * 2.6;
  glow.height = ry * 2.6;
  glow.tint = BP.cyan;
  glow.alpha = 0.35;
  glow.blendMode = 'add';
  const dome = new Graphics().ellipse(0, 0, rx, ry).fill({ color: BP.cyan, alpha: 0.12 }).stroke({ width: 3, color: BP.cyan, alpha: 0.9 });
  dome.ellipse(0, 0, rx - 8, ry - 8).stroke({ width: 1.5, color: 0xffffff, alpha: 0.45 });
  const hex = new Graphics();
  const hs = 26;
  for (let y = -ry; y <= ry; y += hs * 0.87) {
    const row = Math.round((y + ry) / (hs * 0.87));
    for (let x = -rx; x <= rx; x += hs * 1.5) {
      const cx = x + (row % 2 ? hs * 0.75 : 0);
      if ((cx * cx) / (rx * rx) + (y * y) / (ry * ry) > 0.86) continue;
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = cx + Math.cos(a) * hs * 0.5;
        const py = y + Math.sin(a) * hs * 0.5;
        if (i === 0) hex.moveTo(px, py);
        else hex.lineTo(px, py);
      }
    }
  }
  hex.stroke({ width: 1, color: BP.cyan, alpha: 0.22 });
  const spec = new Graphics().ellipse(-rx * 0.45, -ry * 0.55, rx * 0.22, ry * 0.1).fill({ color: 0xffffff, alpha: 0.5 });
  spec.rotation = -0.35;
  const spec2 = new Graphics().circle(rx * 0.55, -ry * 0.35, 6).fill({ color: 0xffffff, alpha: 0.6 });
  c.addChild(glow, dome, hex, spec, spec2);
  // gentle "breathing"
  gsap.to(c.scale, { x: 1.015, y: 0.985, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to(hex, { alpha: 0.55, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  return c;
}

// ---------------------------------------------------------------- welding sparks ("en obra")
/** continuous welding sparks at the given local points; returns a stop function. Self-cleans on destroy. */
export function weldSparks(layer: Container, pts: { x: number; y: number }[], o: { rate?: number; color?: number } = {}) {
  if (!pts.length) return () => undefined;
  const tex: Texture = sparkTexture();
  const live: { s: Sprite; vx: number; vy: number; life: number; max: number }[] = [];
  let acc = 0;
  let stopped = false;
  const rate = o.rate ?? 22;
  const tick = (t: Ticker) => {
    if (layer.destroyed) {
      Ticker.shared.remove(tick);
      return;
    }
    const dt = Math.min(0.05, t.deltaMS / 1000);
    if (!stopped) {
      acc += dt * rate;
      while (acc >= 1) {
        acc -= 1;
        const p = pts[Math.floor(Math.random() * pts.length)];
        const s = new Sprite(tex);
        s.anchor.set(0.5);
        s.tint = Math.random() < 0.3 ? 0xffffff : (o.color ?? 0xffb347);
        s.blendMode = 'add';
        s.scale.set(0.22 + Math.random() * 0.3);
        s.position.set(p.x + (Math.random() - 0.5) * 8, p.y + (Math.random() - 0.5) * 8);
        layer.addChild(s);
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 90 + Math.random() * 220;
        live.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.35 + Math.random() * 0.4, max: 0.75 });
      }
    }
    for (let i = live.length - 1; i >= 0; i--) {
      const q = live[i];
      q.life -= dt;
      if (q.life <= 0 || q.s.destroyed) {
        if (!q.s.destroyed) q.s.destroy();
        live.splice(i, 1);
        continue;
      }
      q.vy += 700 * dt;
      q.s.x += q.vx * dt;
      q.s.y += q.vy * dt;
      q.s.alpha = Math.min(1, q.life * 3);
    }
    if (stopped && !live.length) Ticker.shared.remove(tick);
  };
  Ticker.shared.add(tick);
  layer.on('destroyed', () => Ticker.shared.remove(tick));
  return () => {
    stopped = true;
  };
}

/** one-shot burst of sparks (celebrations) */
export function sparkBurst(layer: Container, x: number, y: number, n = 26, colors: number[] = [0xffd84a, 0xffffff, 0xff6a1a]) {
  const tex = sparkTexture();
  for (let i = 0; i < n; i++) {
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    s.tint = colors[i % colors.length];
    s.blendMode = 'add';
    s.position.set(x, y);
    s.scale.set(0.2 + Math.random() * 0.35);
    layer.addChild(s);
    const a = Math.random() * Math.PI * 2;
    const r = 60 + Math.random() * 180;
    gsap
      .timeline({ onComplete: () => s.destroy() })
      .to(s, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r + 40, duration: 0.6 + Math.random() * 0.3, ease: 'power3.out' }, 0)
      .to(s, { alpha: 0, duration: 0.3 }, 0.45);
  }
}

// ---------------------------------------------------------------- ship thumbnails (cached textures)
const thumbCache = new Map<string, { tex: Texture; ox: number; oy: number; w: number; h: number }>();

/**
 * Bake the anime illustration of a blueprint into a texture (cached by key).
 * Returns the texture and the grid origin inside it (so callers can align overlays).
 */
export function bakeShip(key: string, bp: ShipBlueprint, hullMk: number) {
  const hit = thumbCache.get(key);
  if (hit && !hit.tex.destroyed) return hit;
  let res: { tex: Texture; ox: number; oy: number; w: number; h: number };
  try {
    const model = new ShipModel(bp, 1);
    const v = new AnimeShipView(model, false, hullStyleForMk(hullMk), { waterLocalY: bp.rows * CELL - 70, resolution: 1.25 });
    const b = v.getLocalBounds();
    const tex = game.pixi.renderer.generateTexture({ target: v, resolution: 1 });
    res = { tex, ox: -b.x, oy: -b.y, w: b.width, h: b.height };
    v.destroy({ children: true });
  } catch (e) {
    console.warn('[shipyard] bake failed', e);
    const g = new Graphics();
    for (let y = 0; y < bp.rows; y++) for (let x = 0; x < bp.cols; x++) if ((bp.hull[y]?.[x] ?? '.') !== '.') g.rect(x * CELL, y * CELL, CELL, CELL);
    for (const m of bp.modules) g.rect(m.x * CELL, m.y * CELL, m.w * CELL, m.h * CELL);
    g.fill(0x8a5a2e).stroke({ width: 3, color: C.ink });
    const tex = game.pixi.renderer.generateTexture({ target: g, resolution: 1 });
    res = { tex, ox: 0, oy: 0, w: bp.cols * CELL, h: bp.rows * CELL };
    g.destroy();
  }
  if (thumbCache.size > 24) {
    const first = thumbCache.keys().next().value as string;
    thumbCache.get(first)?.tex.destroy(true);
    thumbCache.delete(first);
  }
  thumbCache.set(key, res);
  return res;
}

/** sprite of a baked ship fitted in (maxW × maxH), centred at the bottom; `silhouette` = solid colour */
export function shipThumb(key: string, bp: ShipBlueprint, hullMk: number, maxW: number, maxH: number, o: { silhouette?: number } = {}): Container {
  const c = new Container();
  const b = bakeShip(key, bp, hullMk);
  const sp = new Sprite(b.tex);
  const k = Math.min(maxW / b.w, maxH / b.h);
  sp.scale.set(k);
  sp.position.set((maxW - b.w * k) / 2, maxH - b.h * k);
  if (o.silhouette !== undefined) sp.filters = [new SilhouetteFilter(o.silhouette, 1)];
  c.addChild(sp);
  return c;
}

/** diagonal hatch fill rectangle (blueprint "section" style) */
export function hatchRect(w: number, h: number, color: number = BP.line, alpha = 0.5): Container {
  const c = new Container();
  const t = new TilingSprite({ texture: hatchTexture(color, 7, 1.4), width: w, height: h });
  t.alpha = alpha;
  c.addChild(t);
  return c;
}

// ---------------------------------------------------------------- buttons with drawn glyphs (no emojis)
export type BtnGlyph = 'pencil' | 'play' | 'save' | 'reset' | 'trash' | 'check';
function btnGlyph(kind: BtnGlyph, s = 22): Graphics {
  const g = new Graphics();
  const k = s / 22;
  const st = { width: 2.6 * k, color: C.ink, cap: 'round' as const, join: 'round' as const };
  switch (kind) {
    case 'pencil':
      g.poly([-8 * k, 8 * k, -9 * k, 11 * k, -6 * k, 10 * k]).fill(C.ink);
      g.poly([-8 * k, 8 * k, 6 * k, -6 * k, 9 * k, -3 * k, -5 * k, 11 * k]).fill(C.yellow).stroke(st);
      g.moveTo(4 * k, -4 * k).lineTo(7 * k, -1 * k).stroke(st);
      break;
    case 'play':
      g.poly([-6 * k, -9 * k, 9 * k, 0, -6 * k, 9 * k]).fill(C.ink);
      break;
    case 'save':
      g.roundRect(-9 * k, -9 * k, 18 * k, 18 * k, 2 * k).stroke(st);
      g.rect(-5 * k, -9 * k, 10 * k, 6 * k).fill(C.ink);
      g.rect(-5 * k, 2 * k, 10 * k, 7 * k).stroke({ ...st, width: 2 * k });
      break;
    case 'reset':
      g.arc(0, 0, 8 * k, -2.6, 2.2).stroke(st);
      g.poly([-9 * k, -9 * k, -2 * k, -8 * k, -7 * k, -2 * k]).fill(C.ink);
      break;
    case 'trash':
      g.rect(-7 * k, -5 * k, 14 * k, 14 * k).stroke(st);
      g.moveTo(-9 * k, -7 * k).lineTo(9 * k, -7 * k).moveTo(-3 * k, -10 * k).lineTo(3 * k, -10 * k).stroke(st);
      break;
    case 'check':
      g.moveTo(-8 * k, 0).lineTo(-2 * k, 7 * k).lineTo(9 * k, -7 * k).stroke({ ...st, width: 3.4 * k });
      break;
  }
  return g;
}
/** poster Button with a drawn glyph left of the caption */
export function iconButton(text: string, glyph: BtnGlyph, onTap: () => void, o: import('../../ui/widgets').ButtonOpts = {}) {
  const b = new Button(text, onTap, o);
  const gs = (o.size ?? 34) * 0.85;
  const g = btnGlyph(glyph, gs);
  const shift = gs * 0.65;
  b.caption.x += shift;
  g.position.set(b.caption.x - b.caption.width / 2 - gs * 0.75, b.bh / 2);
  b.face.addChild(g);
  return b;
}

/** celebration banner: paper card with block shadow + big stamp lettering (legible over the busy plan) */
export function banner(text: string, color: number = C.pinkHot, size = 56, rot = -0.06, sub?: string): Container {
  const c = new Container();
  const t = txt(text, { fontFamily: F.poster, fontSize: size, fill: color, letterSpacing: 2 });
  t.anchor.set(0.5);
  const st = sub ? txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: Math.round(size * 0.36), fill: C.ink }) : null;
  const w = Math.max(t.width, st?.width ?? 0) + size * 1.1;
  const h = t.height + size * 0.5 + (st ? st.height + 6 : 0);
  const top = -h / 2;
  const g = new Graphics()
    .rect(-w / 2 + 10, top + 10, w, h)
    .fill(C.ink)
    .rect(-w / 2, top, w, h)
    .fill(C.paper)
    .stroke({ width: 4, color: C.ink })
    .rect(-w / 2 + 8, top + 8, w - 16, h - 16)
    .stroke({ width: 3, color });
  t.y = top + size * 0.25 + t.height / 2;
  c.addChild(g, t);
  if (st) {
    st.anchor.set(0.5, 0);
    st.y = t.y + t.height / 2 + 2;
    c.addChild(st);
  }
  c.rotation = rot;
  return c;
}
