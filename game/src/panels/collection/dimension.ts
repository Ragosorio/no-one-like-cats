/**
 * "Multiverso de estilos" (research/10 §2): each element drags its own dimension onto the
 * screen — palette, type, background pattern and the look of its projectile. Shared by the
 * Altar sequences (★4 attack preview, ★5 full-screen mastery), the mutation reveal and the
 * Catdex set posters.
 */
import { Container, Graphics } from 'pixi.js';
import { C, F } from '../../ui/theme';
import { ELEMENT_BY_ID } from '../../data/content';

export type Pattern = 'flames' | 'waves' | 'watercolor' | 'woodcut' | 'krackle' | 'tarot' | 'glitch' | 'aurora' | 'riso' | 'kagee' | 'sepia' | 'vitral' | 'static' | 'nacar';
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
  // Parte 2 — the six rift elements, each with its own print style
  ice: { name: 'AURORA', bg: 0x1f2b4a, mid: 0x4fa3d9, accent: 0x7cffc4, hi: 0xeaf6ff, ink: 0xeaf6ff, font: F.bebas, pattern: 'aurora', word: '氷' },
  sound: { name: 'PÓSTER DE CONCIERTO', bg: 0xffd400, mid: 0x231626, accent: 0xff2e88, hi: 0x2ec4e6, ink: 0xffffff, font: F.poster, pattern: 'riso', word: '音' },
  shadow: { name: 'TEATRO DE SOMBRAS', bg: 0xeae1d3, mid: 0x2a2433, accent: 0xc8102e, hi: 0xfff3d6, ink: 0x0d110f, font: F.brush, pattern: 'kagee', word: '影' },
  time: { name: 'DAGUERROTIPO', bg: 0x3a2a16, mid: 0x6b4f2a, accent: 0xe0b77a, hi: 0xd9c29a, ink: 0xf4e6c6, font: F.serif, pattern: 'sepia', word: '時' },
  light: { name: 'VITRAL', bg: 0xfff8e1, mid: 0xffd77a, accent: 0xe8879a, hi: 0x7fd8ff, ink: 0xffffff, font: F.heavy, pattern: 'vitral', word: '光' },
  void: { name: 'NOIR INVERTIDO', bg: 0xf2f2f0, mid: 0x231626, accent: 0xff2e88, hi: 0xffffff, ink: 0x0d110f, font: F.glitch, pattern: 'static', word: '虚' },
  // Parte II · Oleada 1
  crystal: { name: 'NÁCAR PRISMÁTICO', bg: 0xf7f2ff, mid: 0xb79cff, accent: 0x8fd3ff, hi: 0x6fe0c8, ink: 0x2e2450, font: F.serif, pattern: 'nacar', word: '晶' },
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
    case 'aurora': {
      // stars, aurora curtains (thin vertical strokes riding a sine), ukiyo-e glacier peaks + floes
      for (let i = 0; i < 90; i++) p.circle(r() * w, r() * h * 0.6, 0.8 + r() * 1.8).fill({ color: dim.hi, alpha: 0.4 + r() * 0.5 });
      const curtains = [dim.accent, 0xb59cff, 0x9fe8ff];
      for (let band = 0; band < 3; band++) {
        const col = curtains[band];
        const base = h * (0.18 + band * 0.09);
        const amp = 30 + r() * 40;
        const ph = r() * 6;
        const fq = 2 + r() * 2;
        for (let x = 0; x < w; x += 7) {
          const y0 = base + Math.sin((x / w) * Math.PI * fq + ph) * amp;
          const len = 80 + Math.sin((x / w) * Math.PI * 7 + ph * 2) * 40 + r() * 30;
          p.rect(x, y0, 4, len).fill({ color: col, alpha: 0.16 });
          p.rect(x, y0, 4, len * 0.35).fill({ color: col, alpha: 0.2 });
        }
      }
      // glacier mountains (flat woodblock fill + carved highlight lines)
      const peaks = 7;
      for (let layer = 0; layer < 2; layer++) {
        const by = h * (0.7 + layer * 0.12);
        const col = layer === 0 ? dim.mid : 0xcfe9ff;
        const pts: number[] = [0, h];
        for (let i = 0; i <= peaks; i++) {
          const x = (i / peaks) * w;
          pts.push(x - w / peaks / 2, by + 10, x, by - (60 + r() * 120) * (1 - layer * 0.4));
        }
        pts.push(w, by + 10, w, h);
        p.poly(pts).fill(col).stroke({ width: 4, color: C.ink, join: 'round' });
        for (let i = 2; i < pts.length - 4; i += 4) {
          const tx = pts[i + 2];
          const ty = pts[i + 3];
          p.moveTo(tx, ty).lineTo(tx - 14, ty + 34).moveTo(tx, ty).lineTo(tx + 8, ty + 46).stroke({ width: 3, color: dim.hi, alpha: layer ? 0.9 : 0.7 });
        }
      }
      for (let i = 0; i < 70; i++) p.circle(r() * w, r() * h, 1.5 + r() * 2.5).fill({ color: 0xffffff, alpha: 0.75 });
      break;
    }
    case 'riso': {
      // city-pop sunset disc printed twice slightly off-register + halftone + equalizer bars
      const cx = w * 0.68;
      const cy = h * 0.42;
      const R = Math.min(w, h) * 0.32;
      p.circle(cx - 12, cy - 9, R).fill({ color: dim.hi, alpha: 0.85 });
      p.circle(cx, cy, R).fill({ color: dim.accent, alpha: 0.92 });
      for (let k = 0; k < 6; k++) p.rect(cx - R - 20, cy + R * 0.1 + k * R * 0.16, R * 2 + 40, 6 + k * 3).fill(dim.bg);
      const step = 26;
      for (let y = 0; y < h; y += step) {
        for (let x = (y / step) % 2 ? step / 2 : 0; x < w; x += step) {
          const rad = 1 + (y / h) * 6;
          p.circle(x, y, rad).fill({ color: dim.mid, alpha: 0.22 });
        }
      }
      for (let i = 0; i < 8; i++) {
        const y = r() * h * 0.5;
        p.rect(-20, y, w * (0.15 + r() * 0.35), 10 + r() * 16).fill({ color: i % 2 ? dim.accent : dim.hi, alpha: 0.75 });
      }
      const bars = 26;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const bh = (0.08 + r() * 0.28) * h;
        p.rect(i * bw + 6, h - bh + 6, bw - 8, bh).fill({ color: dim.hi, alpha: 0.9 });
        p.rect(i * bw + 2, h - bh, bw - 8, bh).fill({ color: dim.accent, alpha: 0.9 });
      }
      p.rect(14, 14, w - 28, h - 28).stroke({ width: 6, color: dim.mid, alpha: 0.85 });
      break;
    }
    case 'kagee': {
      // lit paper screen: warm lamp glow, shoji lattice, cat + grass silhouettes, a red seal
      const cx = w * 0.5;
      const cy = h * 0.42;
      for (let k = 8; k > 0; k--) p.circle(cx, cy, k * Math.max(w, h) * 0.07).fill({ color: dim.hi, alpha: 0.12 });
      for (let x = 0; x <= w; x += w / 8) p.rect(x - 4, 0, 8, h).fill({ color: dim.mid, alpha: 0.45 });
      for (let y = 0; y <= h; y += h / 5) p.rect(0, y - 3, w, 6).fill({ color: dim.mid, alpha: 0.4 });
      const shadow = 0x0d110f;
      const cat = (x: number, y: number, s: number, flip: number) => {
        p.ellipse(x, y, 70 * s, 42 * s).fill({ color: shadow, alpha: 0.88 });
        p.circle(x + flip * 64 * s, y - 40 * s, 30 * s).fill({ color: shadow, alpha: 0.88 });
        p.poly([x + flip * 44 * s, y - 56 * s, x + flip * 48 * s, y - 92 * s, x + flip * 64 * s, y - 66 * s]).fill({ color: shadow, alpha: 0.88 });
        p.poly([x + flip * 70 * s, y - 66 * s, x + flip * 88 * s, y - 92 * s, x + flip * 90 * s, y - 52 * s]).fill({ color: shadow, alpha: 0.88 });
        p.moveTo(x - flip * 64 * s, y)
          .bezierCurveTo(x - flip * 130 * s, y - 10 * s, x - flip * 120 * s, y - 110 * s, x - flip * 80 * s, y - 120 * s)
          .stroke({ width: 16 * s, color: shadow, alpha: 0.88, cap: 'round' });
      };
      cat(w * 0.26, h * 0.8, 1.3, 1);
      cat(w * 0.78, h * 0.72, 0.8, -1);
      for (let i = 0; i < 40; i++) {
        const x = r() * w;
        const gh = 40 + r() * 110;
        p.moveTo(x, h).quadraticCurveTo(x + (r() - 0.5) * 40, h - gh * 0.6, x + (r() - 0.5) * 60, h - gh).stroke({ width: 3 + r() * 3, color: shadow, alpha: 0.85, cap: 'round' });
      }
      p.circle(w * 0.84, h * 0.2, Math.min(w, h) * 0.09).fill({ color: dim.accent, alpha: 0.95 });
      p.rect(18, 18, w - 36, h - 36).stroke({ width: 10, color: dim.mid, alpha: 0.9 });
      break;
    }
    case 'sepia': {
      // daguerreotype plate: soft sepia oval, astrolabe rings, scratches, dust, tarnished rim
      const cx = w / 2;
      const cy = h / 2;
      for (let k = 12; k > 0; k--) p.ellipse(cx, cy, w * 0.04 * k, h * 0.045 * k).fill({ color: dim.hi, alpha: 0.07 });
      const R = Math.min(w, h) * 0.36;
      for (const rr of [R, R * 0.82, R * 0.5]) p.circle(cx, cy, rr).stroke({ width: rr === R ? 5 : 2, color: dim.mid, alpha: 0.5 });
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const l = i % 4 ? 0.92 : 0.84;
        p.moveTo(cx + Math.cos(a) * R * l, cy + Math.sin(a) * R * l).lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      }
      p.stroke({ width: 2, color: dim.mid, alpha: 0.5 });
      p.ellipse(cx, cy - R * 0.1, R * 0.82, R * 0.3).stroke({ width: 2, color: dim.mid, alpha: 0.4 });
      p.moveTo(cx - R, cy).lineTo(cx + R, cy).moveTo(cx, cy - R).lineTo(cx, cy + R).stroke({ width: 2, color: dim.mid, alpha: 0.4 });
      for (let i = 0; i < 26; i++) {
        const x = r() * w;
        const y = r() * h;
        const a = r() * Math.PI;
        const l = 40 + r() * 220;
        p.moveTo(x, y).lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l).stroke({ width: 1, color: 0xfff4dc, alpha: 0.25 + r() * 0.2 });
      }
      for (let i = 0; i < 90; i++) p.circle(r() * w, r() * h, 0.8 + r() * 2).fill({ color: r() < 0.5 ? 0xfff4dc : 0x1c1208, alpha: 0.4 });
      p.rect(0, 0, w, h).stroke({ width: 70, color: 0x1c3a51, alpha: 0.35 });
      p.rect(26, 26, w - 52, h - 52).stroke({ width: 4, color: dim.accent, alpha: 0.85 });
      p.roundRect(40, 40, w - 80, h - 80, 60).stroke({ width: 2, color: dim.accent, alpha: 0.6 });
      break;
    }
    case 'vitral': {
      // leaded cathedral glass (jittered grid cells) + an art-deco golden fan
      const cols = [dim.accent, dim.hi, dim.mid, 0xffffff, 0xb59cff, 0xffe9b0];
      const nx = 9;
      const ny = 6;
      const pts: { x: number; y: number }[][] = [];
      const diag: number[] = [];
      for (let j = 0; j <= ny; j++) {
        pts.push([]);
        for (let i = 0; i <= nx; i++) {
          const edge = i === 0 || j === 0 || i === nx || j === ny;
          pts[j].push({ x: (i / nx) * w + (edge ? 0 : (r() - 0.5) * (w / nx) * 0.6), y: (j / ny) * h + (edge ? 0 : (r() - 0.5) * (h / ny) * 0.6) });
        }
      }
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = pts[j][i];
          const b = pts[j][i + 1];
          const cc = pts[j + 1][i + 1];
          const d = pts[j + 1][i];
          const col = cols[Math.floor(r() * cols.length)];
          if ((i + j) % 3 === 0) {
            p.poly([a.x, a.y, b.x, b.y, cc.x, cc.y]).fill({ color: col, alpha: 0.7 });
            p.poly([a.x, a.y, cc.x, cc.y, d.x, d.y]).fill({ color: cols[Math.floor(r() * cols.length)], alpha: 0.7 });
            diag.push(a.x, a.y, cc.x, cc.y);
          } else p.poly([a.x, a.y, b.x, b.y, cc.x, cc.y, d.x, d.y]).fill({ color: col, alpha: 0.7 });
          p.ellipse((a.x + cc.x) / 2 - 8, (a.y + cc.y) / 2 - 8, 10, 4).fill({ color: 0xffffff, alpha: 0.35 });
        }
      }
      for (const row of pts) {
        p.moveTo(row[0].x, row[0].y);
        for (const q of row) p.lineTo(q.x, q.y);
      }
      for (let i = 0; i <= nx; i++) {
        p.moveTo(pts[0][i].x, pts[0][i].y);
        for (let j = 1; j <= ny; j++) p.lineTo(pts[j][i].x, pts[j][i].y);
      }
      for (let k = 0; k < diag.length; k += 4) p.moveTo(diag[k], diag[k + 1]).lineTo(diag[k + 2], diag[k + 3]);
      p.stroke({ width: 7, color: C.ink, alpha: 0.85, join: 'round' });
      const fx0 = w / 2;
      const fy0 = h + 20;
      const FR = h * 0.42;
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        p.moveTo(fx0, fy0).lineTo(fx0 + Math.cos(a) * FR, fy0 + Math.sin(a) * FR);
      }
      p.stroke({ width: 6, color: 0xb89558, alpha: 0.9 });
      for (const k of [0.4, 0.7, 1]) p.arc(fx0, fy0, FR * k, Math.PI, 0).stroke({ width: 8, color: 0xb89558, alpha: 0.9 });
      p.rect(16, 16, w - 32, h - 32).stroke({ width: 10, color: 0xb89558 }).rect(32, 32, w - 64, h - 64).stroke({ width: 3, color: 0xb89558 });
      break;
    }
    case 'static': {
      // inverted noir: TV snow in ink on white, tear bands, a hole that eats the picture
      for (let i = 0; i < 1400; i++) {
        const sz = 1 + Math.floor(r() * 3);
        p.rect(r() * w, r() * h, sz * 2, sz).fill({ color: 0x0d110f, alpha: 0.15 + r() * 0.5 });
      }
      for (let i = 0; i < 14; i++) {
        const y = r() * h;
        const bh = 3 + r() * 22;
        p.rect(r() * w * 0.3 - 40, y, w * (0.5 + r() * 0.7), bh).fill({ color: i % 4 === 0 ? dim.accent : dim.mid, alpha: i % 4 === 0 ? 0.55 : 0.3 });
      }
      for (let y = 0; y < h; y += 5) p.rect(0, y, w, 1.5).fill({ color: 0x0d110f, alpha: 0.08 });
      const cx = w * 0.5;
      const cy = h * 0.46;
      const R = Math.min(w, h) * 0.26;
      p.circle(cx, cy, R + 18).stroke({ width: 10, color: dim.accent, alpha: 0.9 });
      p.circle(cx, cy, R).fill(0x0d110f).stroke({ width: 5, color: 0xffffff });
      for (let i = 0; i < 260; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * R * 0.92;
        p.rect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + r() * 4, 1.5).fill({ color: 0xffffff, alpha: 0.3 + r() * 0.6 });
      }
      p.rect(20, 20, w - 40, h - 40).stroke({ width: 6, color: 0x0d110f, alpha: 0.9 });
      break;
    }
    case 'nacar': {
      // mother-of-pearl: wavy iridescent strata, a prism splitting a white beam, cut-gem glints (all inside w×h)
      const cols = [0xf7f2ff, 0x8fd3ff, 0xb79cff, 0x6fe0c8, 0xffd6f0];
      const bands = 22;
      for (let i = 0; i < bands; i++) {
        const y = (i + 0.5) * (h / bands);
        const amp = 6 + r() * 14;
        const ph = r() * 6;
        const fq = 1.5 + r() * 2;
        const pts: number[] = [];
        for (let x = 0; x <= w; x += 20) pts.push(x, Math.max(12, Math.min(h - 12, y + Math.sin((x / w) * Math.PI * fq + ph) * amp)));
        p.poly(pts, false).stroke({ width: 8 + r() * 10, color: cols[i % cols.length], alpha: 0.3 + r() * 0.25, join: 'round' });
      }
      const px = w * 0.55;
      const py = h * 0.38;
      p.moveTo(24, py + 50).lineTo(px, py).stroke({ width: 12, color: 0xffffff, alpha: 0.85 });
      [0xff8fb1, 0xffd77a, 0x6fe0c8, 0x8fd3ff, 0xb79cff].forEach((col, k) => p.moveTo(px, py).lineTo(w - 24, Math.max(24, Math.min(h - 24, py - 120 + k * 60))).stroke({ width: 9, color: col, alpha: 0.75 }));
      p.poly([px - 56, py + 44, px, py - 56, px + 56, py + 44]).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 5, color: dim.ink, join: 'round' });
      p.moveTo(px - 26, py + 18).lineTo(px - 6, py - 22).stroke({ width: 4, color: dim.accent, cap: 'round' });
      for (let i = 0; i < 44; i++) {
        const x = 24 + r() * (w - 48);
        const y = 24 + r() * (h - 48);
        const s = 3 + r() * 7;
        p.poly([x, y - s * 1.4, x + s, y, x, y + s * 1.4, x - s, y]).fill({ color: cols[i % cols.length], alpha: 0.9 });
      }
      p.rect(18, 18, w - 36, h - 36).stroke({ width: 6, color: dim.mid }).rect(30, 30, w - 60, h - 60).stroke({ width: 2, color: dim.accent });
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
    case 'ice':
      // carambano: a faceted icicle
      g.poly([s * 1.6, 0, -s * 0.9, -s * 0.5, -s * 1.3, 0, -s * 0.9, s * 0.5]).fill(dim.hi).stroke({ width: 4, color: C.ink, join: 'round' });
      g.poly([s * 1.6, 0, -s * 0.9, -s * 0.5, -s * 0.4, 0]).fill(0x9fe8ff);
      g.moveTo(-s * 0.9, 0).lineTo(s * 1.2, 0).stroke({ width: 2, color: dim.mid });
      g.star(-s * 1.1, -s * 0.5, 4, s * 0.35, s * 0.1).fill(dim.accent);
      break;
    case 'sound':
      // onda: three stacked sound arcs
      for (let k = 0; k < 3; k++) {
        const rr = s * (0.5 + k * 0.45);
        g.arc(-s * 0.7, 0, rr, -0.85, 0.85).stroke({ width: 9, color: C.ink, cap: 'round' });
        g.arc(-s * 0.7, 0, rr, -0.85, 0.85).stroke({ width: 4.5, color: k === 1 ? dim.hi : dim.accent, cap: 'round' });
      }
      g.circle(-s * 0.7, 0, s * 0.22).fill(dim.bg).stroke({ width: 3, color: C.ink });
      break;
    case 'shadow':
      // sombra: an ink wisp with two red eyes
      g.moveTo(s, 0)
        .bezierCurveTo(s, -s * 0.8, -s * 0.6, -s * 0.9, -s * 1.8, -s * 0.3)
        .bezierCurveTo(-s * 1.1, -s * 0.1, -s * 1.3, s * 0.4, -s * 1.9, s * 0.5)
        .bezierCurveTo(-s * 0.6, s * 0.9, s, s * 0.7, s, 0)
        .fill(0x0d110f)
        .stroke({ width: 3, color: dim.mid });
      g.poly([s * 0.15, -s * 0.3, s * 0.55, -s * 0.18, s * 0.2, -s * 0.08]).fill(dim.accent);
      g.poly([s * 0.15, s * 0.05, s * 0.55, s * 0.1, s * 0.2, s * 0.24]).fill(dim.accent);
      break;
    case 'time':
      // reloj: a pocket watch with its chain trailing
      g.moveTo(-s, 0).quadraticCurveTo(-s * 1.5, s * 0.5, -s * 2, 0).stroke({ width: 3, color: dim.accent });
      g.rect(-s * 0.2, -s * 1.25, s * 0.4, s * 0.3).fill(dim.accent).stroke({ width: 2.5, color: C.ink });
      g.circle(0, 0, s).fill(dim.accent).stroke({ width: 4, color: C.ink });
      g.circle(0, 0, s * 0.78).fill(0xf4e6c6).stroke({ width: 2, color: dim.mid });
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        g.moveTo(Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6).lineTo(Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.72);
      }
      g.stroke({ width: 1.5, color: dim.mid });
      g.moveTo(0, 0).lineTo(0, -s * 0.55).moveTo(0, 0).lineTo(s * 0.38, s * 0.12).stroke({ width: 2.5, color: C.ink, cap: 'round' });
      break;
    case 'light':
      // haz: a hard white beam with a prism glint at its tip
      g.ellipse(-s * 0.4, 0, s * 2.2, s * 0.55).fill({ color: dim.hi, alpha: 0.55 });
      g.ellipse(-s * 0.3, 0, s * 1.9, s * 0.32).fill(0xffffff).stroke({ width: 3, color: dim.mid });
      g.star(s * 1.4, 0, 4, s * 0.9, s * 0.22).fill(0xffffff).stroke({ width: 2.5, color: C.ink });
      g.circle(s * 1.4, 0, s * 0.18).fill(dim.accent);
      break;
    case 'void':
      // borrado: a black hole with a pink rim and snow inside
      g.circle(0, 0, s * 1.25).stroke({ width: 4, color: dim.accent });
      g.circle(0, 0, s).fill(0x0d110f).stroke({ width: 3, color: 0xffffff });
      for (let k = 0; k < 7; k++) g.rect((Math.random() - 0.5) * s * 1.2, (Math.random() - 0.5) * s * 1.2, s * 0.3, 2).fill({ color: 0xffffff, alpha: 0.8 });
      break;
    case 'crystal':
      // a cut nacre marble: pearl body, sky / lilac / sea-glass facets
      g.poly([0, -s * 1.1, s * 0.9, -s * 0.45, s * 0.9, s * 0.5, 0, s * 1.1, -s * 0.9, s * 0.5, -s * 0.9, -s * 0.45]).fill(dim.bg).stroke({ width: 4, color: C.ink, join: 'miter' });
      g.poly([0, -s * 1.1, s * 0.9, -s * 0.45, 0, 0]).fill(dim.accent);
      g.poly([-s * 0.9, s * 0.5, 0, s * 1.1, 0, 0]).fill(dim.mid);
      g.poly([s * 0.9, s * 0.5, 0, s * 1.1, 0, 0]).fill(dim.hi);
      g.moveTo(-s * 0.45, -s * 0.6).lineTo(-s * 0.15, -s * 0.82).stroke({ width: 2.5, color: 0xffffff, cap: 'round' });
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
    case 'ice':
      g.star(0, 0, 6, s, s * 0.3).fill(Math.random() < 0.6 ? 0xffffff : dim.accent);
      g.rotation = Math.random() * 6;
      break;
    case 'sound':
      // a little eighth note
      g.ellipse(0, 0, s * 0.6, s * 0.45).fill(Math.random() < 0.5 ? dim.accent : dim.hi).stroke({ width: 1.5, color: C.ink });
      g.rect(s * 0.4, -s * 1.6, 2.5, s * 1.6).fill(C.ink);
      g.poly([s * 0.4, -s * 1.6, s * 1.1, -s * 1.1, s * 0.4, -s * 1.2]).fill(C.ink);
      break;
    case 'shadow':
      g.circle(0, 0, s).fill({ color: 0x0d110f, alpha: 0.75 });
      if (Math.random() < 0.15) g.circle(s * 0.3, -s * 0.2, s * 0.25).fill(dim.accent);
      break;
    case 'time':
      // sand grains
      g.poly([0, -s * 0.7, s * 0.45, 0, 0, s * 0.7, -s * 0.45, 0]).fill(Math.random() < 0.5 ? dim.accent : dim.hi);
      break;
    case 'light':
      g.star(0, 0, 4, s * 1.1, s * 0.25).fill(Math.random() < 0.6 ? 0xffffff : dim.mid);
      break;
    case 'void': {
      const k = Math.random();
      g.rect(-s * 0.5, -s * 0.3, s, s * 0.6).fill(k < 0.45 ? 0x0d110f : k < 0.8 ? 0xffffff : dim.accent);
      break;
    }
    case 'crystal': {
      // nacre chips: a tiny diamond in one of the four nacre colours
      const k = Math.random();
      g.poly([0, -s * 0.8, s * 0.5, 0, 0, s * 0.8, -s * 0.5, 0]).fill(k < 0.3 ? dim.bg : k < 0.55 ? dim.accent : k < 0.8 ? dim.mid : dim.hi);
      g.rotation = Math.random() * 6;
      break;
    }
    default:
      g.circle(0, 0, s).fill(Math.random() < 0.5 ? dim.accent : dim.hi);
  }
  return g;
}
