/**
 * "Rareza = calidad de impresión" (research/07 §3.16): card faces baked on a 2D canvas.
 *   common     periódico a 1 tinta (halftone gris)
 *   rare       risografía 2 tintas azul + rosa, misregistro leve, grano
 *   epic       CMYK con rosa neón, misregistro fuerte
 *   legendary  foil dorado (el brillo animado lo pone CatCard)
 *   mythic     holográfico + glitch
 *   primordial negro con ruido de otra dimensión + color del elemento
 *   neutral    ficha sin rareza conocida (silueta)
 *   back       carta sellada
 */
import { Texture } from 'pixi.js';

export type PrintStyle = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'primordial' | 'neutral' | 'back' | 'backSecret';

export interface CardLayout {
  b: number;
  win: { x: number; y: number; w: number; h: number };
  plate: { x: number; y: number; w: number; h: number };
}

export function cardLayout(w: number, h: number): CardLayout {
  const b = Math.max(6, Math.round(w * 0.055));
  const winH = Math.round(h * 0.68) - b;
  const win = { x: b, y: b, w: w - 2 * b, h: winH };
  const py = win.y + win.h + Math.max(3, Math.round(b * 0.5));
  const plate = { x: b, y: py, w: w - 2 * b, h: h - py - b };
  return { b, win, plate };
}

const cache = new Map<string, Texture>();
const SS = 2; // supersample

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
function rgba(n: number, a: number) {
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

type Ctx = CanvasRenderingContext2D;

function grain(g: Ctx, w: number, h: number, amt: number, color = false) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (color) {
      d[i] += (Math.random() - 0.5) * amt;
      d[i + 1] += (Math.random() - 0.5) * amt;
      d[i + 2] += (Math.random() - 0.5) * amt;
    } else {
      const n = (Math.random() - 0.5) * amt;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
  }
  g.putImageData(img, 0, 0);
}

/** rotated halftone grid; r(u,v) returns dot radius as fraction of the cell (0..0.75) */
function halftone(g: Ctx, x: number, y: number, w: number, h: number, cell: number, color: string, angleDeg: number, r: (u: number, v: number) => number, dx = 0, dy = 0) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.translate(x + w / 2 + dx, y + h / 2 + dy);
  const a = (angleDeg * Math.PI) / 180;
  g.rotate(a);
  const c = Math.cos(a);
  const s = Math.sin(a);
  const R = Math.hypot(w, h) / 2 + cell;
  g.fillStyle = color;
  for (let gy = -R; gy < R; gy += cell)
    for (let gx = -R; gx < R; gx += cell) {
      const sx = gx * c - gy * s;
      const sy = gx * s + gy * c;
      const u = (sx + w / 2) / w;
      const v = (sy + h / 2) / h;
      if (u < -0.05 || u > 1.05 || v < -0.05 || v > 1.05) continue;
      const rr = r(Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v))) * cell;
      if (rr < 0.35) continue;
      g.beginPath();
      g.arc(gx, gy, rr, 0, Math.PI * 2);
      g.fill();
    }
  g.restore();
}

/** border ring (outer rect minus inner rect) */
function ring(g: Ctx, w: number, h: number, b: number, fill: string | CanvasGradient, dx = 0, dy = 0) {
  g.save();
  g.translate(dx, dy);
  g.beginPath();
  g.rect(0, 0, w, h);
  g.rect(b, b, w - 2 * b, h - 2 * b);
  g.fillStyle = fill;
  g.fill('evenodd');
  g.restore();
}

function strokeRect(g: Ctx, x: number, y: number, w: number, h: number, width: number, color: string) {
  g.lineWidth = width;
  g.strokeStyle = color;
  g.strokeRect(x + width / 2, y + width / 2, w - width, h - width);
}

/** card face texture (w×h logical; baked at 2×). `accent` = element color for primordial */
export function cardFace(style: PrintStyle, w: number, h: number, accent = 0xff2e88): Texture {
  const key = `${style}|${w}|${h}|${style === 'primordial' ? accent : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = Math.round(w * SS);
  const H = Math.round(h * SS);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  const L = cardLayout(w, h);
  const b = L.b * SS;
  const win = { x: L.win.x * SS, y: L.win.y * SS, w: L.win.w * SS, h: L.win.h * SS };
  const pl = { x: L.plate.x * SS, y: L.plate.y * SS, w: L.plate.w * SS, h: L.plate.h * SS };
  const s = SS * Math.max(0.7, w / 170);

  switch (style) {
    case 'common': {
      g.fillStyle = '#EAE1D3';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#F2ECE1';
      g.fillRect(win.x, win.y, win.w, win.h);
      halftone(g, win.x, win.y, win.w, win.h, 7 * s, rgba(0x171317, 0.34), 45, (_u, v) => 0.08 + 0.42 * v * v);
      grain(g, W, H, 16);
      strokeRect(g, 0, 0, W, H, 3 * s, '#171317');
      strokeRect(g, 5 * s, 5 * s, W - 10 * s, H - 10 * s, 1 * s, '#171317');
      strokeRect(g, win.x, win.y, win.w, win.h, 2 * s, '#171317');
      g.fillStyle = '#171317';
      g.fillRect(pl.x, pl.y, pl.w, 2.5 * s);
      g.fillRect(pl.x, pl.y + 4.5 * s, pl.w, 1 * s);
      break;
    }
    case 'rare': {
      g.fillStyle = '#F1EADD';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#F7F2E8';
      g.fillRect(win.x, win.y, win.w, win.h);
      g.globalCompositeOperation = 'multiply';
      halftone(g, win.x, win.y, win.w, win.h, 9 * s, rgba(0x3569a3, 0.55), 15, (u, v) => 0.12 + 0.4 * (1 - v) * (0.6 + 0.4 * u));
      halftone(g, win.x, win.y, win.w, win.h, 9 * s, rgba(0xff5fa2, 0.45), 75, (_u, v) => 0.06 + 0.32 * v, 2 * s, 1.5 * s);
      ring(g, W, H, b, rgba(0xff5fa2, 0.85), 3 * s, 2 * s);
      ring(g, W, H, b, rgba(0x3569a3, 0.97));
      g.globalCompositeOperation = 'source-over';
      // riso dropouts in the ink band
      g.fillStyle = 'rgba(241,234,221,0.55)';
      for (let i = 0; i < (W * H) / (900 * SS); i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const inBand = x < b || x > W - b || y < b || y > H - b;
        if (inBand) g.fillRect(x, y, 1.6 * SS, 1.6 * SS);
      }
      grain(g, W, H, 26);
      strokeRect(g, win.x, win.y, win.w, win.h, 2 * s, '#3569A3');
      g.fillStyle = '#3569A3';
      g.fillRect(pl.x, pl.y, pl.w, 3 * s);
      break;
    }
    case 'epic': {
      g.fillStyle = '#FCF8F2';
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'multiply';
      halftone(g, win.x, win.y, win.w, win.h, 8 * s, rgba(0x00b8e6, 0.55), 15, (u) => 0.1 + 0.35 * u);
      halftone(g, win.x, win.y, win.w, win.h, 8 * s, rgba(0xff2e88, 0.55), 75, (_u, v) => 0.1 + 0.38 * (1 - v));
      halftone(g, win.x, win.y, win.w, win.h, 8 * s, rgba(0xffd400, 0.65), 0, (_u, v) => 0.12 + 0.35 * v);
      ring(g, W, H, b, rgba(0x00e5ff, 0.95), -4 * s, 3 * s);
      ring(g, W, H, b, rgba(0xffd400, 0.95), 4 * s, -3 * s);
      ring(g, W, H, b, '#FF2E88');
      g.globalCompositeOperation = 'source-over';
      grain(g, W, H, 14);
      strokeRect(g, 0, 0, W, H, 2.5 * s, '#171317');
      strokeRect(g, win.x, win.y, win.w, win.h, 2.5 * s, '#171317');
      g.fillStyle = '#FF2E88';
      g.fillRect(pl.x, pl.y, pl.w, 3 * s);
      break;
    }
    case 'legendary': {
      g.fillStyle = '#231626';
      g.fillRect(0, 0, W, H);
      const rg = g.createRadialGradient(win.x + win.w / 2, win.y, 0, win.x + win.w / 2, win.y, win.h * 1.2);
      rg.addColorStop(0, '#7a5a7a');
      rg.addColorStop(1, '#231626');
      g.fillStyle = rg;
      g.fillRect(win.x, win.y, win.w, win.h);
      // godrays
      g.save();
      g.beginPath();
      g.rect(win.x, win.y, win.w, win.h);
      g.clip();
      g.translate(win.x + win.w / 2, win.y - win.h * 0.15);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI + 0.08;
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, win.h * 1.6, a, a + 0.07);
        g.closePath();
        g.fillStyle = `rgba(255,215,122,${i % 2 ? 0.1 : 0.18})`;
        g.fill();
      }
      g.restore();
      const lg = g.createLinearGradient(0, 0, W, H);
      const stops: [number, string][] = [
        [0, '#7a5a26'],
        [0.18, '#f6e3a1'],
        [0.32, '#b89558'],
        [0.5, '#fff4c8'],
        [0.66, '#a07a3c'],
        [0.82, '#f0d78a'],
        [1, '#6e5022'],
      ];
      for (const [o, c] of stops) lg.addColorStop(o, c);
      ring(g, W, H, b, lg);
      g.fillStyle = lg;
      g.fillRect(pl.x, pl.y, pl.w, 3 * s);
      strokeRect(g, 1.5 * s, 1.5 * s, W - 3 * s, H - 3 * s, 1.2 * s, 'rgba(255,244,200,0.9)');
      strokeRect(g, b - 2 * s, b - 2 * s, W - 2 * b + 4 * s, H - 2 * b + 4 * s, 1.5 * s, '#4a3416');
      // art nouveau corners
      g.strokeStyle = '#4a3416';
      g.lineWidth = 1.6 * s;
      const cr = b * 1.8;
      for (const [cx, cy, a0] of [
        [0, 0, 0],
        [W, 0, Math.PI / 2],
        [W, H, Math.PI],
        [0, H, -Math.PI / 2],
      ] as const) {
        g.beginPath();
        g.arc(cx, cy, cr, a0, a0 + Math.PI / 2);
        g.stroke();
        g.beginPath();
        g.arc(cx, cy, cr * 0.6, a0, a0 + Math.PI / 2);
        g.stroke();
      }
      grain(g, W, H, 10);
      break;
    }
    case 'mythic': {
      g.fillStyle = '#0D110F';
      g.fillRect(0, 0, W, H);
      const ig = g.createLinearGradient(win.x, win.y, win.x + win.w, win.y + win.h);
      ['#ff2e88', '#ffd400', '#3fffb0', '#00e5ff', '#8a5cff', '#ff2e88'].forEach((c, i, a) => ig.addColorStop(i / (a.length - 1), c));
      g.globalAlpha = 0.32;
      g.fillStyle = ig;
      g.fillRect(win.x, win.y, win.w, win.h);
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,0.22)';
      for (let y = win.y; y < win.y + win.h; y += 3 * SS) g.fillRect(win.x, y, win.w, 1 * SS);
      // glitch bars
      for (let i = 0; i < 5; i++) {
        const y = win.y + Math.random() * win.h;
        g.fillStyle = i % 2 ? 'rgba(0,229,255,0.35)' : 'rgba(255,46,136,0.35)';
        g.fillRect(win.x + Math.random() * win.w * 0.3, y, win.w * (0.3 + Math.random() * 0.6), (2 + Math.random() * 5) * SS);
      }
      const rg2 = g.createLinearGradient(0, 0, W, H * 0.6);
      ['#ff5fa2', '#ffe14a', '#5fffc0', '#59d8ff', '#a77cff', '#ff5fa2'].forEach((c, i, a) => rg2.addColorStop(i / (a.length - 1), c));
      ring(g, W, H, b, rg2);
      g.fillStyle = rg2;
      g.fillRect(pl.x, pl.y, pl.w, 3 * s);
      strokeRect(g, b - 1.5 * s, b - 1.5 * s, W - 2 * b + 3 * s, H - 2 * b + 3 * s, 1.5 * s, '#ffffff');
      strokeRect(g, 0, 0, W, H, 2 * s, '#0D110F');
      break;
    }
    case 'primordial': {
      g.fillStyle = '#070708';
      g.fillRect(0, 0, W, H);
      const rg = g.createRadialGradient(win.x + win.w / 2, win.y + win.h * 0.75, 0, win.x + win.w / 2, win.y + win.h * 0.75, win.w * 0.85);
      rg.addColorStop(0, rgba(accent, 0.75));
      rg.addColorStop(0.6, rgba(accent, 0.18));
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(win.x, win.y, win.w, win.h);
      grain(g, W, H, 60, true);
      g.strokeStyle = hex(accent);
      g.lineWidth = 1.6 * s;
      g.strokeRect(2.5 * s, 2.5 * s, W - 5 * s, H - 5 * s);
      g.lineWidth = 1 * s;
      g.strokeRect(b - 2.5 * s, b - 2.5 * s, W - 2 * b + 5 * s, H - 2 * b + 5 * s);
      // rift ticks
      g.fillStyle = hex(accent);
      for (let i = 0; i < 14; i++) {
        const t = Math.random();
        const side = i % 4;
        const len = (4 + Math.random() * 10) * s;
        if (side === 0) g.fillRect(t * W, 0, len, 1.2 * s);
        else if (side === 1) g.fillRect(W - 1.2 * s, t * H, 1.2 * s, len);
        else if (side === 2) g.fillRect(t * W, H - 1.2 * s, len, 1.2 * s);
        else g.fillRect(0, t * H, 1.2 * s, len);
      }
      g.fillRect(pl.x, pl.y, pl.w, 2 * s);
      break;
    }
    case 'neutral': {
      g.fillStyle = '#E4DACA';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#D9CDB8';
      g.fillRect(win.x, win.y, win.w, win.h);
      halftone(g, win.x, win.y, win.w, win.h, 6 * s, rgba(0x171317, 0.12), 45, () => 0.22);
      grain(g, W, H, 14);
      g.setLineDash([6 * s, 4 * s]);
      strokeRect(g, 2 * s, 2 * s, W - 4 * s, H - 4 * s, 2 * s, '#171317');
      g.setLineDash([]);
      strokeRect(g, win.x, win.y, win.w, win.h, 1.5 * s, 'rgba(23,19,23,0.6)');
      break;
    }
    case 'back':
    case 'backSecret': {
      const sec = style === 'backSecret';
      g.fillStyle = sec ? '#0D110F' : '#171317';
      g.fillRect(0, 0, W, H);
      g.strokeStyle = sec ? 'rgba(138,92,255,0.25)' : 'rgba(232,135,154,0.16)';
      g.lineWidth = 1.2 * s;
      for (let i = -H; i < W; i += 7 * s) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + H, H);
        g.stroke();
      }
      g.beginPath();
      g.arc(W / 2, H * 0.46, W * 0.3, 0, Math.PI * 2);
      g.fillStyle = sec ? '#8A5CFF' : '#E8879A';
      g.fill();
      g.beginPath();
      g.arc(W / 2, H * 0.46, W * 0.3, 0, Math.PI * 2);
      g.lineWidth = 3 * s;
      g.strokeStyle = '#EDE4D6';
      g.stroke();
      strokeRect(g, 5 * s, 5 * s, W - 10 * s, H - 10 * s, 1.2 * s, 'rgba(237,228,214,0.8)');
      strokeRect(g, 0, 0, W, H, 2 * s, '#000000');
      grain(g, W, H, 18);
      break;
    }
  }
  const tex = Texture.from(cv);
  cache.set(key, tex);
  return tex;
}

/** tileable noise (for primordial / glitch overlays) */
export function noiseTile(): Texture {
  const key = 'noise-tile';
  const hit = cache.get(key);
  if (hit) return hit;
  const n = 128;
  const cv = document.createElement('canvas');
  cv.width = n;
  cv.height = n;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() < 0.18 ? 255 : 0;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = v ? Math.floor(80 + Math.random() * 175) : 0;
  }
  g.putImageData(img, 0, 0);
  const t = Texture.from(cv);
  t.source.addressMode = 'repeat';
  cache.set(key, t);
  return t;
}

/** horizontally tileable rainbow (holo foil) */
export function rainbowTile(): Texture {
  const key = 'rainbow-tile';
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 16;
  const g = cv.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, 256, 0);
  ['#ff5fa2', '#ffe14a', '#5fffc0', '#59d8ff', '#a77cff', '#ff5fa2'].forEach((c, i, a) => lg.addColorStop(i / (a.length - 1), c));
  g.fillStyle = lg;
  g.fillRect(0, 0, 256, 16);
  const t = Texture.from(cv);
  t.source.addressMode = 'repeat';
  cache.set(key, t);
  return t;
}

/** soft white diagonal band for the foil sheen */
export function sheenTexture(): Texture {
  const key = 'sheen';
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 8;
  const g = cv.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, 128, 0);
  lg.addColorStop(0, 'rgba(255,255,255,0)');
  lg.addColorStop(0.42, 'rgba(255,250,220,0.55)');
  lg.addColorStop(0.5, 'rgba(255,255,255,0.95)');
  lg.addColorStop(0.58, 'rgba(255,250,220,0.55)');
  lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg;
  g.fillRect(0, 0, 128, 8);
  const t = Texture.from(cv);
  cache.set(key, t);
  return t;
}

/** full-screen print layer used by the reveal "reprint" (tileable) */
export function printTile(style: 'common' | 'rare' | 'epic' | 'mythic'): Texture {
  const key = `tile-${style}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const n = 192;
  const cv = document.createElement('canvas');
  cv.width = n;
  cv.height = n;
  const g = cv.getContext('2d')!;
  const dots = (cell: number, color: string, r: number, ox = 0, oy = 0) => {
    g.fillStyle = color;
    for (let y = 0; y < n / cell; y++)
      for (let x = 0; x < n / cell; x++) {
        g.beginPath();
        g.arc(x * cell + (y % 2 ? cell / 2 : 0) + ox, y * cell + cell / 2 + oy, r, 0, Math.PI * 2);
        g.fill();
      }
  };
  if (style === 'common') dots(12, 'rgba(23,19,23,0.5)', 2.6);
  if (style === 'rare') {
    dots(16, 'rgba(53,105,163,0.6)', 4.2);
    dots(16, 'rgba(255,95,162,0.45)', 3.2, 3, 2);
  }
  if (style === 'epic') {
    dots(12, 'rgba(0,184,230,0.5)', 3.4);
    dots(12, 'rgba(255,46,136,0.5)', 3.4, 4, 3);
    dots(12, 'rgba(255,212,0,0.6)', 3.4, -3, 5);
  }
  if (style === 'mythic') {
    for (let y = 0; y < n; y += 4) {
      g.fillStyle = `hsla(${(y / n) * 360},100%,65%,0.35)`;
      g.fillRect(0, y, n, 2);
    }
  }
  const t = Texture.from(cv);
  t.source.addressMode = 'repeat';
  cache.set(key, t);
  return t;
}
