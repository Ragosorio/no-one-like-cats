/**
 * "Multiverso de estilos" (research/10 §2): each element drags its own dimension onto the
 * screen — palette, type, background pattern and the look of its projectile. Shared by the
 * Altar sequences (★4 attack preview, ★5 full-screen mastery), the mutation reveal and the
 * Catdex set posters.
 */
import { Container, Graphics } from 'pixi.js';
import { C, F } from '../../ui/theme';
import { ELEMENT_BY_ID } from '../../data/content';

export type Pattern = 'flames' | 'waves' | 'watercolor' | 'woodcut' | 'krackle' | 'tarot' | 'glitch';
export interface Dimension {
  id: string;
  name: string;
  /** background */
  bg: number;
  /** mid tone (pattern) */
  mid: number;
  accent: number;
  hi: number;
  /** text color over bg */
  ink: number;
  font: string;
  pattern: Pattern;
  /** big CJK-ish word for the mastery poster */
  word: string;
  /** onomatopoeia of the element */
  sound: string[];
}

const D: Record<string, Omit<Dimension, 'id' | 'sound'>> = {
  fire: { name: 'ANIME INFERNO', bg: C.inferno, mid: C.red, accent: C.orange, hi: C.yellow, ink: C.paper, font: F.heavy, pattern: 'flames', word: '業火' },
  water: { name: 'NOIR OCEÁNICO', bg: C.chaos, mid: C.river, accent: C.megaBlue, hi: C.mint, ink: C.paper, font: F.bebas, pattern: 'waves', word: '大波' },
  nature: { name: 'ACUARELA', bg: 0xf4ecd9, mid: 0xa9d98f, accent: 0x3f8f3a, hi: 0xff9fc0, ink: C.ink, font: F.brush, pattern: 'watercolor', word: '開花' },
  earth: { name: 'DIARIO DEL MAR', bg: 0xe9dcc0, mid: 0xa8743f, accent: C.inkBlue, hi: C.ink, ink: C.ink, font: F.news, pattern: 'woodcut', word: '岩' },
  storm: { name: 'CÓMIC SILVER AGE', bg: C.inkBlue, mid: 0xffd400, accent: C.pinkHot, hi: C.cyan, ink: C.paper, font: F.comic, pattern: 'krackle', word: '雷' },
  magic: { name: 'ORQUÍDEA REAL', bg: C.plumInk, mid: C.plum, accent: C.gold, hi: 0xf0d78a, ink: 0xf0d78a, font: F.serif, pattern: 'tarot', word: '魔' },
  cosmic: { name: 'NEÓN GLITCH', bg: C.chaos, mid: C.violet, accent: C.pinkHot, hi: C.cyan, ink: C.paper, font: F.glitch, pattern: 'glitch', word: '宇宙' },
};

export function dimensionOf(el: string): Dimension {
  const d = D[el] ?? D.fire;
  return { id: el, ...d, sound: ELEMENT_BY_ID.get(el)?.onomatopoeia ?? ['¡BOOM!'] };
}

function rnd(seed: number) {
  let a = seed | 0 || 7;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Full background in the dimension's style (w×h, origin top-left). */
export function dimensionBackground(dim: Dimension, w: number, h: number, seed = 3): Container {
  const c = new Container();
  const r = rnd(seed);
  const g = new Graphics().rect(0, 0, w, h).fill(dim.bg);
  c.addChild(g);
  const p = new Graphics();
  c.addChild(p);
  switch (dim.pattern) {
    case 'flames': {
      // rows of flame tongues rising from the bottom (Demon Slayer brush)
      for (let row = 0; row < 3; row++) {
        const col = row === 0 ? dim.mid : row === 1 ? dim.accent : dim.hi;
        const base = h - row * h * 0.08;
        const n = 9 + row * 2;
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) * w + (r() - 0.5) * 60;
          const hh = (0.45 + r() * 0.55) * h * (1 - row * 0.18);
          const ww = 90 + r() * 80;
          p.moveTo(x - ww, base + 40)
            .bezierCurveTo(x - ww * 0.8, base - hh * 0.4, x + ww * 0.3, base - hh * 0.5, x + (r() - 0.5) * 40, base - hh)
            .bezierCurveTo(x + ww * 0.2, base - hh * 0.55, x + ww, base - hh * 0.3, x + ww, base + 40)
            .closePath()
            .fill({ color: col, alpha: 0.85 - row * 0.15 });
        }
      }
      break;
    }
    case 'waves': {
      // ukiyo-e wave scallops + noir horizon lines
      const rr = 70;
      for (let row = 0; row < Math.ceil(h / (rr * 0.8)); row++) {
        const y = h - row * rr * 0.8;
        if (y < h * 0.35) break;
        for (let i = -1; i < w / (rr * 1.6) + 1; i++) {
          const x = i * rr * 1.6 + (row % 2) * rr * 0.8;
          for (let k = 0; k < 4; k++) p.arc(x, y, rr - k * 16, Math.PI, 0).stroke({ width: 4, color: k % 2 ? dim.mid : dim.accent, alpha: 0.9 });
        }
      }
      for (let i = 0; i < 14; i++) p.rect(0, h * 0.08 + i * 18, w, 2).fill({ color: dim.hi, alpha: 0.08 });
      break;
    }
    case 'watercolor': {
      for (let i = 0; i < 26; i++) {
        const x = r() * w;
        const y = r() * h;
        const s = 80 + r() * 240;
        const col = [dim.mid, dim.hi, 0xbfe3ff, dim.mid][i % 4];
        for (let k = 0; k < 3; k++) p.circle(x + (r() - 0.5) * 30, y + (r() - 0.5) * 30, s * (1 - k * 0.22)).fill({ color: col, alpha: 0.12 });
      }
      for (let i = 0; i < 40; i++) {
        const x = r() * w;
        const y = r() * h;
        p.ellipse(x, y, 9 + r() * 8, 5 + r() * 4).fill({ color: dim.hi, alpha: 0.5 });
      }
      break;
    }
    case 'woodcut': {
      // engraved hatching + a sun-burst like a newspaper woodcut
      for (let i = -h; i < w; i += 14) p.moveTo(i, h).lineTo(i + h, 0);
      p.stroke({ width: 2, color: dim.mid, alpha: 0.35 });
      const cx = w * 0.72;
      const cy = h * 0.38;
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        p.moveTo(cx, cy).lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * w);
      }
      p.stroke({ width: 3, color: dim.accent, alpha: 0.18 });
      p.rect(18, 18, w - 36, h - 36).stroke({ width: 6, color: dim.hi, alpha: 0.8 });
      break;
    }
    case 'krackle': {
      // Kirby krackle: clusters of black blobs + bursting rays
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        p.poly([cx, cy, cx + Math.cos(a - 0.04) * w, cy + Math.sin(a - 0.04) * w, cx + Math.cos(a + 0.04) * w, cy + Math.sin(a + 0.04) * w]).fill({ color: i % 2 ? dim.mid : dim.accent, alpha: 0.35 });
      }
      for (let i = 0; i < 70; i++) {
        const x = r() * w;
        const y = r() * h;
        const s = 6 + r() * 26;
        p.circle(x, y, s).fill(C.ink);
        p.circle(x + s * 1.3, y + s * 0.4, s * 0.5).fill(C.ink);
        p.circle(x - s * 0.9, y + s * 0.8, s * 0.35).fill(C.ink);
      }
      break;
    }
    case 'tarot': {
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < 6; i++) p.circle(cx, cy, 160 + i * 90).stroke({ width: i % 2 ? 1.5 : 3, color: dim.accent, alpha: 0.5 });
      p.star(cx, cy, 8, 420, 200).stroke({ width: 2, color: dim.hi, alpha: 0.4 });
      for (let i = 0; i < 40; i++) {
        const x = r() * w;
        const y = r() * h;
        const s = 3 + r() * 7;
        p.star(x, y, 4, s, s * 0.3).fill({ color: i % 3 ? 0xb7a4c7 : dim.hi, alpha: 0.6 });
      }
      p.rect(24, 24, w - 48, h - 48).stroke({ width: 3, color: dim.accent, alpha: 0.8 });
      p.rect(36, 36, w - 72, h - 72).stroke({ width: 1, color: dim.accent, alpha: 0.6 });
      break;
    }
    case 'glitch': {
      for (let i = 0; i < 26; i++) {
        const y = r() * h;
        p.rect(r() * w * 0.5, y, w * (0.2 + r() * 0.7), 3 + r() * 28).fill({ color: i % 3 === 0 ? dim.hi : i % 3 === 1 ? dim.accent : dim.mid, alpha: 0.28 });
      }
      for (let y = 0; y < h; y += 6) p.rect(0, y, w, 2).fill({ color: 0x000000, alpha: 0.25 });
      for (let i = 0; i < 60; i++) p.rect(r() * w, r() * h, 2, 2).fill({ color: 0xffffff, alpha: 0.7 });
      break;
    }
  }
  return c;
}

/** a projectile drawn in the element's style (centered, pointing +x) */
export function projectileArt(el: string, size = 28, upgraded = false): Graphics {
  const dim = dimensionOf(el);
  const g = new Graphics();
  const s = size * (upgraded ? 1.35 : 1);
  switch (el) {
    case 'water':
      g.ellipse(0, 0, s * 1.3, s * 0.5).fill(dim.accent).stroke({ width: 4, color: C.ink });
      g.poly([-s * 1.3, 0, -s * 1.8, -s * 0.5, -s * 1.8, s * 0.5]).fill(dim.mid).stroke({ width: 3, color: C.ink });
      g.ellipse(s * 0.3, -s * 0.15, s * 0.5, s * 0.15).fill({ color: 0xffffff, alpha: 0.6 });
      break;
    case 'nature':
      g.ellipse(0, 0, s * 0.8, s * 0.55).fill(0x7a5230).stroke({ width: 4, color: C.ink });
      g.moveTo(-s * 0.2, -s * 0.5).bezierCurveTo(-s * 0.6, -s * 1.3, s * 0.4, -s * 1.3, s * 0.1, -s * 0.5).fill(dim.accent).stroke({ width: 3, color: C.ink });
      break;
    case 'earth':
      g.poly([-s, -s * 0.4, -s * 0.3, -s, s * 0.7, -s * 0.7, s, s * 0.1, s * 0.4, s * 0.9, -s * 0.6, s * 0.8]).fill(dim.mid).stroke({ width: 4, color: C.ink });
      g.moveTo(-s * 0.3, -s * 0.2).lineTo(s * 0.3, s * 0.3).stroke({ width: 3, color: C.ink, alpha: 0.6 });
      break;
    case 'storm':
      g.poly([-s * 1.4, -s * 0.2, -s * 0.2, -s * 0.6, -s * 0.1, -s * 0.15, s * 1.4, -s * 0.5, s * 0.2, s * 0.6, s * 0.1, s * 0.15, -s * 1.4, s * 0.5]).fill(0xffd400).stroke({ width: 4, color: C.ink });
      break;
    case 'magic':
      g.circle(0, 0, s).fill({ color: dim.mid, alpha: 0.9 }).stroke({ width: 4, color: dim.accent });
      g.moveTo(-s * 0.6, s * 0.5).lineTo(0, -s * 0.7).lineTo(s * 0.6, s * 0.5).moveTo(-s * 0.4, 0).lineTo(s * 0.4, 0).stroke({ width: 4, color: dim.hi, cap: 'round' });
      break;
    case 'cosmic':
      g.circle(0, 0, s).fill(C.chaos).stroke({ width: 4, color: dim.hi });
      g.ellipse(0, 0, s * 1.7, s * 0.45).stroke({ width: 4, color: dim.accent });
      g.circle(-s * 0.3, -s * 0.3, s * 0.2).fill(0xffffff);
      break;
    default:
      g.circle(0, 0, s).fill(dim.accent).stroke({ width: 4, color: C.ink });
      g.circle(s * 0.15, -s * 0.1, s * 0.55).fill(dim.hi);
      g.circle(s * 0.3, -s * 0.3, s * 0.18).fill(0xffffff);
  }
  return g;
}

/** trail particle for a projectile */
export function trailBit(el: string, upgraded = false): Graphics {
  const dim = dimensionOf(el);
  const g = new Graphics();
  const s = (upgraded ? 9 : 6) + Math.random() * 6;
  switch (el) {
    case 'water':
      g.circle(0, 0, s * 0.8).stroke({ width: 2.5, color: 0xffffff, alpha: 0.9 });
      break;
    case 'nature':
      g.ellipse(0, 0, s, s * 0.45).fill(dim.accent);
      g.rotation = Math.random() * 6;
      break;
    case 'storm':
      g.rect(-s, -1.5, s * 2, 3).fill(C.cyan);
      g.rotation = Math.random() * 6;
      break;
    case 'magic':
      g.star(0, 0, 4, s, s * 0.3).fill(dim.hi);
      break;
    case 'cosmic':
      g.rect(-s, -2, s * 2, 4).fill(Math.random() < 0.5 ? dim.accent : dim.hi);
      break;
    case 'earth':
      g.rect(-s * 0.5, -s * 0.5, s, s).fill(dim.mid).stroke({ width: 1.5, color: C.ink });
      g.rotation = Math.random() * 6;
      break;
    default:
      g.circle(0, 0, s).fill(Math.random() < 0.5 ? dim.accent : dim.hi);
  }
  return g;
}
