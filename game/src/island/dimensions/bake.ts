/**
 * Canvas bakers for the island dimensions. Everything is drawn once into small tileable textures
 * (iso-aligned 512×256 patterns, 256×256 rock, 64×256 falls) and reused — no per-frame drawing.
 */
import { Texture } from 'pixi.js';
import type { DimDef, FallKind, PatternKind } from './defs';

const cache = new Map<string, Texture>();
/** iso-aligned pattern size: 4×4 tiles of 128×64 (repeats on the tile lattice) */
export const PW = 512;
export const PH = 256;

export function rgba(c: number, a = 1) {
  return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
}
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type G2 = CanvasRenderingContext2D;

export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

export function bake(key: string, w: number, h: number, draw: (g: G2, w: number, h: number) => void, repeat = true): Texture {
  const hit = cache.get(key);
  if (hit && !hit.destroyed) return hit;
  const [c, g] = canvas(w, h);
  draw(g, w, h);
  const t = Texture.from(c);
  if (repeat) t.source.addressMode = 'repeat';
  cache.set(key, t);
  return t;
}
export function dropBaked(key: string) {
  const t = cache.get(key);
  if (t) {
    t.destroy(true);
    cache.delete(key);
  }
}

const OFF: [number, number][] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
];
/** draw an element at its 9 torus copies so the texture tiles seamlessly */
function tiled(w: number, h: number, fn: (ox: number, oy: number) => void) {
  for (const [a, b] of OFF) fn(a * w, b * h);
}
function pick<T>(r: () => number, a: T[]): T {
  return a[Math.floor(r() * a.length)];
}
function star4(g: G2, x: number, y: number, s: number) {
  g.beginPath();
  g.moveTo(x, y - s);
  g.quadraticCurveTo(x, y, x + s, y);
  g.quadraticCurveTo(x, y, x, y + s);
  g.quadraticCurveTo(x, y, x - s, y);
  g.quadraticCurveTo(x, y, x, y - s);
  g.fill();
}
/** iso tile-edge lattice: calls fn for each edge segment of the 4×4 diamond grid */
function isoEdges(fn: (x0: number, y0: number, x1: number, y1: number, i: number) => void) {
  let i = 0;
  // tile centres: rows every 32px, columns every 128px, odd rows offset by 64 (texture origin = tile (0,0) centre)
  for (let ty = 0; ty < PH / 32; ty++)
    for (let tx = 0; tx < PW / 128; tx++) {
      const cx = tx * 128 + (ty & 1 ? 64 : 0);
      const cy = ty * 32;
      // the two upper edges of each diamond (lower edges belong to the row below)
      fn(cx, cy - 32, cx + 64, cy, i++);
      fn(cx, cy - 32, cx - 64, cy, i++);
    }
}
function jag(g: G2, pts: [number, number][]) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
}
/** midpoint-displaced crack from a to b */
function crackPts(r: () => number, ax: number, ay: number, bx: number, by: number, rough: number, depth = 4): [number, number][] {
  let pts: [number, number][] = [
    [ax, ay],
    [bx, by],
  ];
  let amp = rough;
  for (let d = 0; d < depth; d++) {
    const n: [number, number][] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = -(y1 - y0) / len;
      const ny = (x1 - x0) / len;
      const o = (r() - 0.5) * amp;
      n.push([(x0 + x1) / 2 + nx * o, (y0 + y1) / 2 + ny * o], pts[i]);
    }
    pts = n;
    amp *= 0.55;
  }
  return pts;
}

// =====================================================================================  PATTERNS
export function patternTex(kind: PatternKind, frame = 0): Texture {
  return bake(`pat-${kind}-${frame}`, PW, PH, (g, w, h) => PAT[kind](g, w, h, frame));
}

const PAT: Record<PatternKind, (g: G2, w: number, h: number, f: number) => void> = {
  // ---- post-story ring
  petals: (g, w, h) => {
    const r = rng(303);
    // watercolour blooms
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const y = r() * h;
      const rx = 30 + r() * 46;
      const c = pick(r, [0xffc9de, 0xffffff, 0xd9f0c8]);
      tiled(w, h, (ox, oy) => {
        g.save();
        g.translate(ox + x, oy + y);
        g.scale(1, 0.5);
        const grd = g.createRadialGradient(0, 0, 0, 0, 0, rx);
        grd.addColorStop(0, rgba(c, 0.35));
        grd.addColorStop(1, rgba(c, 0));
        g.fillStyle = grd;
        g.beginPath();
        g.arc(0, 0, rx, 0, Math.PI * 2);
        g.fill();
        g.restore();
      });
    }
    // fallen petals
    for (let i = 0; i < 120; i++) {
      const x = r() * w;
      const y = r() * h;
      const a = r() * Math.PI;
      const c = pick(r, [0xff9ec4, 0xffc9de, 0xffffff, 0xff7ab8]);
      tiled(w, h, (ox, oy) => {
        g.save();
        g.translate(ox + x, oy + y);
        g.rotate(a);
        g.fillStyle = rgba(c, 0.9);
        g.beginPath();
        g.ellipse(0, 0, 3.6, 2, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      });
    }
  },
  dunes: (g, w, h) => {
    const r = rng(404);
    g.lineCap = 'round';
    // wind ripples (ink hatching, old comic)
    for (let i = 0; i < 46; i++) {
      const x = r() * w;
      const y = r() * h;
      const len = 26 + r() * 40;
      g.strokeStyle = rgba(0x7a5630, 0.45 + r() * 0.25);
      g.lineWidth = 1.4;
      tiled(w, h, (ox, oy) => {
        for (let k = 0; k < 3; k++) {
          g.beginPath();
          g.moveTo(ox + x, oy + y + k * 5);
          g.quadraticCurveTo(ox + x + len * 0.5, oy + y + k * 5 - 6, ox + x + len, oy + y + k * 5);
          g.stroke();
        }
      });
    }
    // pebbles
    for (let i = 0; i < 60; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(pick(r, [0x7a5630, 0xffe9a8, 0xb0844e]), 0.8);
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.arc(ox + x, oy + y, 1 + r() * 1.6, 0, Math.PI * 2);
        g.fill();
      });
    }
  },
  sprinkles: (g, w, h) => {
    const r = rng(505);
    g.lineCap = 'round';
    for (let i = 0; i < 160; i++) {
      const x = r() * w;
      const y = r() * h;
      const a = r() * Math.PI;
      const c = pick(r, [0xff2e88, 0x7fe0c8, 0xffe066, 0x8a5cff, 0xffffff, 0x7fd8ff]);
      g.strokeStyle = rgba(c, 1);
      g.lineWidth = 2.6;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x - Math.cos(a) * 3.5, oy + y - Math.sin(a) * 2);
        g.lineTo(ox + x + Math.cos(a) * 3.5, oy + y + Math.sin(a) * 2);
        g.stroke();
      });
    }
  },
  negative: (g, w, h) => {
    const r = rng(606);
    g.lineCap = 'round';
    // white scratches on black film
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h;
      const len = 10 + r() * 50;
      g.strokeStyle = rgba(0xf3eee3, 0.25 + r() * 0.35);
      g.lineWidth = 1 + r();
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x, oy + y);
        g.lineTo(ox + x + len, oy + y + len * 0.5 * (r() - 0.5));
        g.stroke();
      });
    }
    // film grain + a few red specks
    for (let i = 0; i < 200; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(i % 25 === 0 ? 0xff2e48 : 0xf3eee3, i % 25 === 0 ? 0.9 : 0.25);
      tiled(w, h, (ox, oy) => {
        g.fillRect(ox + x, oy + y, 1.6, 1.6);
      });
    }
  },
  grass: (g, w, h) => grassy(g, w, h, false),
  lush: (g, w, h) => grassy(g, w, h, true),
  hatch: (g, w, h, f) => {
    const r = rng(101);
    const j = rng(900 + f * 37);
    const J = (k: number) => (j() - 0.5) * k;
    g.lineCap = 'round';
    // technical-drawing tile edges: overshooting, doubled, broken
    isoEdges((x0, y0, x1, y1) => {
      if (r() < 0.35) return;
      const a = r() * 0.25;
      const b = 1 - r() * 0.2 + 0.12;
      g.strokeStyle = rgba(0x171317, 0.45 + r() * 0.4);
      g.lineWidth = 1.5 + r() * 1.2;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x0 + (x1 - x0) * a + J(2), oy + y0 + (y1 - y0) * a + J(2));
        g.lineTo(ox + x0 + (x1 - x0) * b + J(2), oy + y0 + (y1 - y0) * b + J(2));
        g.stroke();
      });
      if (r() < 0.4) {
        g.lineWidth = 0.8;
        tiled(w, h, (ox, oy) => {
          g.beginPath();
          g.moveTo(ox + x0 + 3 + J(2), oy + y0 + 2 + J(2));
          g.lineTo(ox + x0 + (x1 - x0) * 0.7 + 3 + J(2), oy + y0 + (y1 - y0) * 0.7 + 2 + J(2));
          g.stroke();
        });
      }
    });
    // hatch clusters (pencil)
    for (let i = 0; i < 46; i++) {
      const cx = r() * w;
      const cy = r() * h;
      const ang = pick(r, [-0.4636, 0.4636, -0.4636, 1.1, -1.1]);
      const n = 4 + Math.floor(r() * 6);
      const len = 12 + r() * 22;
      const gap = 3.2 + r() * 1.8;
      const alpha = 0.35 + r() * 0.45;
      const cross = r() < 0.35;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      g.strokeStyle = rgba(0x171317, Math.min(1, alpha + 0.15));
      g.lineWidth = 1.6 + r() * 1.1;
      const draw = (c: number, s: number) =>
        tiled(w, h, (ox, oy) => {
          for (let k = 0; k < n; k++) {
            const off = (k - n / 2) * gap;
            const px = cx + -s * off + ox;
            const py = cy + c * off + oy;
            const l = len * (0.7 + (k % 3) * 0.15);
            g.beginPath();
            g.moveTo(px - c * l * 0.5 + J(2.4), py - s * l * 0.5 + J(2.4));
            g.lineTo(px + c * l * 0.5 + J(2.4), py + s * l * 0.5 + J(2.4));
            g.stroke();
          }
        });
      draw(ca, sa);
      if (cross) draw(Math.cos(ang + 1.2), Math.sin(ang + 1.2));
    }
    // stipple + scribbles
    g.fillStyle = rgba(0x171317, 0.5);
    for (let i = 0; i < 90; i++) {
      const x = r() * w + J(1.5);
      const y = r() * h + J(1.5);
      tiled(w, h, (ox, oy) => g.fillRect(ox + x, oy + y, 1.6, 1.6));
    }
    for (let i = 0; i < 6; i++) {
      const x = r() * w;
      const y = r() * h;
      g.strokeStyle = rgba(0x171317, 0.3);
      g.lineWidth = 0.9;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x, oy + y);
        for (let k = 0; k < 6; k++) g.lineTo(ox + x + k * 6 + J(4), oy + y + Math.sin(k * 1.7) * 5 + J(3));
        g.stroke();
      });
    }
  },
  lava: (g, w, h) => lavaCracks(g, w, h, false),
  neon: (g, w, h) => {
    const r = rng(404);
    g.lineCap = 'round';
    // wet puddles with neon reflections
    for (let i = 0; i < 9; i++) {
      const x = r() * w;
      const y = r() * h;
      const rx = 22 + r() * 34;
      tiled(w, h, (ox, oy) => {
        g.fillStyle = rgba(0x0b0e18, 0.45);
        g.beginPath();
        g.ellipse(ox + x, oy + y, rx, rx * 0.45, 0, 0, Math.PI * 2);
        g.fill();
        for (let k = 0; k < 3; k++) {
          g.fillStyle = rgba(pick(r, [0xff2e88, 0x00e5ff, 0xffd76a]), 0.35);
          const sx = ox + x + (k - 1) * rx * 0.45;
          g.fillRect(sx - 2, oy + y - rx * 0.3, 4, rx * 0.6);
        }
      });
    }
    // iso grid in neon
    isoEdges((x0, y0, x1, y1) => {
      const hot = r() < 0.12;
      g.strokeStyle = hot ? rgba(pick(r, [0xff2e88, 0x00e5ff]), 0.75) : rgba(0x00e5ff, 0.16);
      g.lineWidth = hot ? 2.2 : 1.2;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x0, oy + y0);
        g.lineTo(ox + x1, oy + y1);
        g.stroke();
      });
      if (r() < 0.3) {
        g.fillStyle = rgba(0x7ff3ff, 0.6);
        tiled(w, h, (ox, oy) => g.fillRect(ox + x0 - 1.5, oy + y0 - 1.5, 3, 3));
      }
    });
    // floor lights
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const y = r() * h;
      const c = pick(r, [0xffd76a, 0xff2e88, 0x00e5ff]);
      tiled(w, h, (ox, oy) => {
        const grd = g.createRadialGradient(ox + x, oy + y, 0, ox + x, oy + y, 9);
        grd.addColorStop(0, rgba(c, 0.8));
        grd.addColorStop(1, rgba(c, 0));
        g.fillStyle = grd;
        g.fillRect(ox + x - 9, oy + y - 9, 18, 18);
      });
    }
  },
  crystal: (g, w, h) => {
    const r = rng(505);
    g.lineJoin = 'round';
    // snow drift arcs
    for (let i = 0; i < 18; i++) {
      const x = r() * w;
      const y = r() * h;
      const l = 20 + r() * 30;
      g.strokeStyle = rgba(0x9fc8dc, 0.45);
      g.lineWidth = 2;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x - l, oy + y);
        g.quadraticCurveTo(ox + x, oy + y - 6, ox + x + l, oy + y + 2);
        g.stroke();
      });
    }
    // facets
    for (let i = 0; i < 22; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 10 + r() * 16;
      const pts: [number, number][] = [];
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + r() * 1.2;
        pts.push([x + Math.cos(a) * s * 1.4, y + Math.sin(a) * s * 0.7]);
      }
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + pts[0][0], oy + pts[0][1]);
        g.lineTo(ox + pts[1][0], oy + pts[1][1]);
        g.lineTo(ox + pts[2][0], oy + pts[2][1]);
        g.closePath();
        g.fillStyle = rgba(r() < 0.5 ? 0xffffff : 0xbfe6f5, 0.45);
        g.fill();
        g.strokeStyle = rgba(0x6fb2d6, 0.55);
        g.lineWidth = 1.1;
        g.stroke();
        g.beginPath();
        g.moveTo(ox + x, oy + y);
        g.lineTo(ox + pts[0][0], oy + pts[0][1]);
        g.strokeStyle = rgba(0xffffff, 0.8);
        g.stroke();
      });
    }
    g.fillStyle = '#fff';
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 2 + r() * 4;
      tiled(w, h, (ox, oy) => star4(g, ox + x, oy + y, s));
    }
  },
  pixel: (g, w, h, f) => {
    const r = rng(606);
    const j = rng(77 + f * 13);
    // scanlines
    g.fillStyle = rgba(0x000000, 0.22);
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1.5);
    // glitch bands of pixel blocks
    const cols = [0x00e5ff, 0xff2e88, 0xffc94a, 0xffffff, 0x7cff6a, 0x8a5cff];
    for (let b = 0; b < 12; b++) {
      const by = r() * h;
      const bh = 3 + r() * 10;
      const shift = (j() - 0.5) * 60;
      let x = r() * w;
      const n = 3 + Math.floor(r() * 7);
      for (let k = 0; k < n; k++) {
        const bw = 4 + r() * 34;
        const c = pick(r, cols);
        const a = 0.25 + r() * 0.55;
        const xx = x + shift;
        tiled(w, h, (ox, oy) => {
          g.fillStyle = rgba(c, a);
          g.fillRect(ox + xx, oy + by, bw, bh);
        });
        x += bw + r() * 30;
      }
    }
    // RGB split edges
    for (let i = 0; i < 16; i++) {
      const x = r() * w + (j() - 0.5) * 20;
      const y = r() * h;
      const l = 10 + r() * 40;
      tiled(w, h, (ox, oy) => {
        g.fillStyle = rgba(0x00e5ff, 0.7);
        g.fillRect(ox + x - 2, oy + y, l, 1.6);
        g.fillStyle = rgba(0xff2e88, 0.7);
        g.fillRect(ox + x + 2, oy + y + 2, l, 1.6);
      });
    }
    // binary glyphs
    g.font = 'bold 9px monospace';
    for (let i = 0; i < 22; i++) {
      const x = r() * w;
      const y = r() * h;
      let s = '';
      const n = 3 + Math.floor(r() * 6);
      for (let k = 0; k < n; k++) s += j() < 0.5 ? '0' : '1';
      g.fillStyle = rgba(pick(r, [0x00e5ff, 0x7cff6a, 0xff2e88]), 0.55);
      tiled(w, h, (ox, oy) => g.fillText(s, ox + x, oy + y));
    }
  },
  caustic: (g, w, h, f) => {
    causticNet(g, w, h, f, 0.42);
    const r = rng(808);
    const rainbow = [0xff7ab8, 0xffc94a, 0x7cffc4, 0x7fd8ff, 0xb59cff];
    for (let i = 0; i < 28; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(pick(r, rainbow), 0.85);
      const s = 1.5 + r() * 3;
      tiled(w, h, (ox, oy) => star4(g, ox + x, oy + y, s));
    }
  },
  stars: (g, w, h) => {
    const r = rng(909);
    for (let i = 0; i < 9; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 30 + r() * 60;
      const c = pick(r, [0xff7ab8, 0x8a5cff, 0x00e5ff]);
      tiled(w, h, (ox, oy) => {
        const grd = g.createRadialGradient(ox + x, oy + y, 0, ox + x, oy + y, rad);
        grd.addColorStop(0, rgba(c, 0.22));
        grd.addColorStop(1, rgba(c, 0));
        g.fillStyle = grd;
        g.fillRect(ox + x - rad, oy + y - rad, rad * 2, rad * 2);
      });
    }
    const stars: [number, number][] = [];
    for (let i = 0; i < 150; i++) {
      const x = r() * w;
      const y = r() * h;
      stars.push([x, y]);
      const s = 0.7 + r() * r() * 2.4;
      g.fillStyle = rgba(pick(r, [0xffffff, 0xffffff, 0xc8b4ff, 0x9ff3ff]), 0.6 + r() * 0.4);
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.arc(ox + x, oy + y, s, 0, Math.PI * 2);
        g.fill();
      });
    }
    g.strokeStyle = rgba(0xc8b4ff, 0.4);
    g.lineWidth = 1;
    for (let c = 0; c < 6; c++) {
      let [x, y] = stars[Math.floor(r() * stars.length)];
      const n = 3 + Math.floor(r() * 3);
      const pts: [number, number][] = [[x, y]];
      for (let k = 0; k < n; k++) {
        x += (r() - 0.5) * 70;
        y += (r() - 0.5) * 36;
        pts.push([x, y]);
      }
      tiled(w, h, (ox, oy) => {
        jag(
          g,
          pts.map(([a, b]) => [a + ox, b + oy]),
        );
        g.stroke();
        g.fillStyle = '#fff';
        for (const [a, b] of pts) star4(g, a + ox, b + oy, 3);
      });
    }
  },
};

function grassy(g: G2, w: number, h: number, lush: boolean) {
  const r = rng(lush ? 11 : 7);
  g.lineCap = 'round';
  // sun dapples
  for (let i = 0; i < (lush ? 16 : 9); i++) {
    const x = r() * w;
    const y = r() * h;
    const rx = 26 + r() * 40;
    const c = lush ? 0xeaff9a : 0xf4ffc0;
    tiled(w, h, (ox, oy) => {
      g.save();
      g.translate(ox + x, oy + y);
      g.scale(1, 0.5);
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      grd.addColorStop(0, rgba(c, lush ? 0.26 : 0.2));
      grd.addColorStop(1, rgba(c, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, rx, 0, Math.PI * 2);
      g.fill();
      g.restore();
    });
  }
  // blades
  const cols = lush ? [0x2f8a34, 0x3f9c3a, 0x8fd46a, 0x1f6a2c] : [0x7fb35a, 0xbfe08e, 0x86b862, 0x6f9e4f];
  for (let i = 0; i < (lush ? 150 : 80); i++) {
    const x = r() * w;
    const y = r() * h;
    const c = pick(r, cols);
    const n = lush ? 3 : 2;
    const tall = (lush ? 8 : 6) + r() * 5;
    g.strokeStyle = rgba(c, lush ? 0.85 : 0.7);
    g.lineWidth = lush ? 2.2 : 1.8;
    tiled(w, h, (ox, oy) => {
      for (let k = 0; k < n; k++) {
        const bx = ox + x + (k - (n - 1) / 2) * 3.5;
        g.beginPath();
        g.moveTo(bx, oy + y);
        g.quadraticCurveTo(bx + (k - 1) * 2, oy + y - tall * 0.6, bx + (k - 1) * 3.5, oy + y - tall);
        g.stroke();
      }
    });
  }
  // flowers
  const fc = lush ? [0xffffff, 0xffe066, 0xff9ac8, 0xffffff] : [0xffffff, 0xff9ac8, 0xffc94a];
  for (let i = 0; i < (lush ? 30 : 18); i++) {
    const x = r() * w;
    const y = r() * h;
    const c = pick(r, fc);
    tiled(w, h, (ox, oy) => {
      g.fillStyle = rgba(c, 0.95);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        g.beginPath();
        g.arc(ox + x + Math.cos(a) * 2.4, oy + y + Math.sin(a) * 1.4, 1.8, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = rgba(c === 0xffe066 ? 0xff7a1a : 0xffc94a, 1);
      g.beginPath();
      g.arc(ox + x, oy + y, 1.2, 0, Math.PI * 2);
      g.fill();
    });
  }
}

function lavaCracks(g: G2, w: number, h: number, glowOnly: boolean) {
  const r = rng(303);
  const pts: [number, number][] = [];
  for (let i = 0; i < 15; i++) pts.push([r() * w, r() * h]);
  const segs: [number, number, number, number][] = [];
  for (const [x, y] of pts) {
    const near = pts
      .map(([a, b]) => {
        // torus nearest copy
        let dx = a - x;
        let dy = b - y;
        if (dx > w / 2) dx -= w;
        if (dx < -w / 2) dx += w;
        if (dy > h / 2) dy -= h;
        if (dy < -h / 2) dy += h;
        return { dx, dy, d: Math.hypot(dx, dy * 2) };
      })
      .filter((o) => o.d > 1)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const n of near) segs.push([x, y, x + n.dx, y + n.dy]);
  }
  const paths = segs.map(([a, b, c, d]) => crackPts(r, a, b, c, d, 22));
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const stroke = (width: number, color: string, blur = 0, shadow = '') => {
    g.lineWidth = width;
    g.strokeStyle = color;
    g.shadowBlur = blur;
    g.shadowColor = shadow;
    for (const p of paths)
      tiled(w, h, (ox, oy) => {
        jag(
          g,
          p.map(([x, y]) => [x + ox, y + oy]),
        );
        g.stroke();
      });
    g.shadowBlur = 0;
  };
  if (glowOnly) {
    stroke(14, rgba(0xff6a1a, 0.55), 22, rgba(0xff6a1a, 1));
    stroke(5, rgba(0xffd76a, 0.9), 8, rgba(0xffc94a, 1));
    return;
  }
  // basalt plate highlights
  for (let i = 0; i < 40; i++) {
    const x = r() * w;
    const y = r() * h;
    g.strokeStyle = rgba(0x6a4440, 0.5);
    g.lineWidth = 1.6;
    tiled(w, h, (ox, oy) => {
      g.beginPath();
      g.moveTo(ox + x - 8, oy + y);
      g.lineTo(ox + x + 8, oy + y - 3);
      g.stroke();
    });
  }
  stroke(7, rgba(0x120404, 0.7));
  stroke(3.4, rgba(0xff6a1a, 1), 10, rgba(0xff6a1a, 0.9));
  stroke(1.3, rgba(0xffe2a0, 1));
  // hot pools
  for (let i = 0; i < 6; i++) {
    const [x, y] = pts[i];
    tiled(w, h, (ox, oy) => {
      g.save();
      g.translate(ox + x, oy + y);
      g.scale(1, 0.5);
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, 14);
      grd.addColorStop(0, rgba(0xffe2a0, 1));
      grd.addColorStop(0.5, rgba(0xff6a1a, 0.9));
      grd.addColorStop(1, rgba(0xff6a1a, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, 14, 0, Math.PI * 2);
      g.fill();
      g.restore();
    });
  }
}
/** additive glow version of the lava cracks (pulsed by the region fx) */
export function lavaGlowTex(): Texture {
  return bake('pat-lava-glow', PW, PH, (g, w, h) => lavaCracks(g, w, h, true));
}

/** tileable wavy two-family net — reads as caustics */
function causticNet(g: G2, w: number, h: number, f: number, alpha: number) {
  const ph = f * 1.7;
  g.lineCap = 'round';
  g.strokeStyle = rgba(0xffffff, alpha);
  g.shadowColor = rgba(0xffffff, 0.8);
  g.shadowBlur = 4;
  for (let fam = 0; fam < 2; fam++) {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const y0 = (i / n) * h;
      g.lineWidth = 1.6 + ((i + fam) % 3) * 0.6;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const yy = y0 + Math.sin((x / w) * Math.PI * 2 * 3 + i * 1.3 + ph + fam * 2) * 9 + Math.sin((x / w) * Math.PI * 2 * 5 + i * 0.7 - ph * 1.3) * 5 + (fam ? (x / w) * h * 0.5 : -(x / w) * h * 0.5);
          if (x === 0) g.moveTo(ox + x, oy + yy);
          else g.lineTo(ox + x, oy + yy);
        }
        g.stroke();
      });
    }
  }
  g.shadowBlur = 0;
}

// =====================================================================================  ROCK (underside)
export function rockTex(d: DimDef, frame = 0): Texture {
  return bake(`rock-${d.id}-${frame}`, 256, 256, (g, w, h) => (ROCK[d.id] ?? ROCK.home)!(g, w, h, frame, d));
}

function strata(g: G2, w: number, h: number, r: () => number, color: number, alpha: number, gap = 24) {
  g.lineCap = 'round';
  for (let y = 8; y < h; y += gap * (0.75 + r() * 0.5)) {
    g.strokeStyle = rgba(color, alpha);
    g.lineWidth = 1.5 + r() * 1.5;
    const a = r() * 5;
    const ph = r() * 6;
    tiled(w, h, (ox, oy) => {
      g.beginPath();
      for (let x = 0; x <= w; x += 16) {
        const yy = y + Math.sin((x / w) * Math.PI * 4 + ph) * a;
        if (x === 0) g.moveTo(ox + x, oy + yy);
        else g.lineTo(ox + x, oy + yy);
      }
      g.stroke();
    });
  }
}
function cubeOutline(g: G2, x: number, y: number, s: number) {
  const hx = s;
  const hy = s * 0.5;
  g.beginPath();
  g.moveTo(x, y - hy);
  g.lineTo(x + hx, y);
  g.lineTo(x, y + hy);
  g.lineTo(x - hx, y);
  g.closePath();
  g.moveTo(x - hx, y);
  g.lineTo(x - hx, y + s);
  g.lineTo(x, y + hy + s);
  g.lineTo(x + hx, y + s);
  g.lineTo(x + hx, y);
  g.moveTo(x, y + hy);
  g.lineTo(x, y + hy + s);
  g.stroke();
}

const ROCK: Partial<Record<string, (g: G2, w: number, h: number, f: number, d: DimDef) => void>> = {
  home: (g, w, h, _f, d) => {
    const r = rng(21);
    strata(g, w, h, r, d.rock.line, 0.35);
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 2 + r() * 5;
      g.fillStyle = rgba(r() < 0.5 ? 0xe0ab70 : d.rock.line, r() < 0.5 ? 0.45 : 0.25);
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.ellipse(ox + x, oy + y, s, s * 0.6, 0, 0, Math.PI * 2);
        g.fill();
      });
    }
    for (let i = 0; i < 10; i++) {
      const x = r() * w;
      const y = r() * h;
      const p = crackPts(r, x, y, x + (r() - 0.5) * 12, y + 20 + r() * 26, 8, 3);
      g.strokeStyle = rgba(d.rock.line, 0.45);
      g.lineWidth = 1.6;
      tiled(w, h, (ox, oy) => {
        jag(
          g,
          p.map(([a, b]) => [a + ox, b + oy]),
        );
        g.stroke();
      });
    }
  },
  forest: (g, w, h, _f, d) => {
    const r = rng(22);
    strata(g, w, h, r, d.rock.line, 0.4, 20);
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      const l = 12 + r() * 40;
      tiled(w, h, (ox, oy) => {
        g.strokeStyle = rgba(r() < 0.5 ? 0x49a03e : 0x2f7a34, 0.85);
        g.lineWidth = 3;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(ox + x, oy + y);
        g.quadraticCurveTo(ox + x + 4, oy + y + l * 0.5, ox + x - 2, oy + y + l);
        g.stroke();
        g.fillStyle = rgba(0x6fc24e, 0.9);
        g.beginPath();
        g.ellipse(ox + x - 2, oy + y + l, 3, 2, 0.4, 0, Math.PI * 2);
        g.fill();
      });
    }
  },
  cliff: (g, w, h, f) => {
    const r = rng(23);
    const j = rng(300 + f * 17);
    const J = (k: number) => (j() - 0.5) * k;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // sketch strata in white
    for (let y = 10; y < h; y += 26 + r() * 12) {
      g.strokeStyle = rgba(0xf3eee3, 0.55);
      g.lineWidth = 1.2;
      const ph = r() * 6;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        for (let x = 0; x <= w; x += 22) {
          const yy = y + Math.sin(x * 0.03 + ph) * 3 + J(2.5);
          if (x === 0) g.moveTo(ox + x, oy + yy);
          else g.lineTo(ox + x, oy + yy);
        }
        g.stroke();
      });
    }
    // wireframe cubes (technical drawing)
    for (let i = 0; i < 9; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 9 + r() * 18;
      g.strokeStyle = rgba(0xf3eee3, 0.85);
      g.lineWidth = 1.4;
      tiled(w, h, (ox, oy) => cubeOutline(g, ox + x + J(2), oy + y + J(2), s));
    }
    // white hatching
    for (let i = 0; i < 18; i++) {
      const x = r() * w;
      const y = r() * h;
      const n = 4 + Math.floor(r() * 4);
      g.strokeStyle = rgba(0xf3eee3, 0.4);
      g.lineWidth = 1;
      tiled(w, h, (ox, oy) => {
        for (let k = 0; k < n; k++) {
          g.beginPath();
          g.moveTo(ox + x + k * 4 + J(2), oy + y + J(2));
          g.lineTo(ox + x + k * 4 - 10 + J(2), oy + y + 18 + J(2));
          g.stroke();
        }
      });
    }
  },
  volcano: (g, w, h, _f, d) => {
    const r = rng(24);
    strata(g, w, h, r, 0x000000, 0.45, 18);
    g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = r() * w;
      const y = r() * h;
      const p = crackPts(r, x, y, x + (r() - 0.5) * 50, y + 40 + r() * 60, 18, 4);
      tiled(w, h, (ox, oy) => {
        const pp = p.map(([a, b]) => [a + ox, b + oy] as [number, number]);
        g.shadowColor = rgba(0xff6a1a, 1);
        g.shadowBlur = 12;
        g.strokeStyle = rgba(d.rock.line, 0.95);
        g.lineWidth = 3;
        jag(g, pp);
        g.stroke();
        g.shadowBlur = 0;
        g.strokeStyle = rgba(0xffe2a0, 0.9);
        g.lineWidth = 1;
        jag(g, pp);
        g.stroke();
      });
    }
    for (let i = 0; i < 30; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(0xff9a3a, 0.7);
      tiled(w, h, (ox, oy) => g.fillRect(ox + x, oy + y, 2, 2));
    }
  },
  ghost: (g, w, h) => {
    const r = rng(25);
    // office-tower windows in rows
    for (let y = 4; y < h; y += 12) {
      for (let x = 2; x < w; x += 9) {
        const on = r() < 0.34;
        if (on) {
          const c = pick(r, [0xffd76a, 0xffd76a, 0x7ff3ff, 0xff7ab8, 0xffffff]);
          g.fillStyle = rgba(c, 0.95);
          g.shadowColor = rgba(c, 0.9);
          g.shadowBlur = 5;
        } else {
          g.fillStyle = rgba(0x2a3550, 0.65);
          g.shadowBlur = 0;
        }
        g.fillRect(x, y, 5, 6);
      }
    }
    g.shadowBlur = 0;
    // vertical neon strips
    for (let i = 0; i < 6; i++) {
      const x = r() * w;
      const y = r() * h;
      const l = 40 + r() * 100;
      const c = pick(r, [0xff2e88, 0x00e5ff, 0x8a5cff]);
      tiled(w, h, (ox, oy) => {
        g.shadowColor = rgba(c, 1);
        g.shadowBlur = 10;
        g.fillStyle = rgba(c, 0.95);
        g.fillRect(ox + x, oy + y, 2.5, l);
        g.shadowBlur = 0;
      });
    }
  },
  ice: (g, w, h) => {
    const r = rng(26);
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const grd = g.createLinearGradient(x, 0, x + 10, 0);
      grd.addColorStop(0, rgba(0xffffff, 0));
      grd.addColorStop(0.5, rgba(0xffffff, 0.3));
      grd.addColorStop(1, rgba(0xffffff, 0));
      g.fillStyle = grd;
      g.fillRect(x, 0, 10, h);
    }
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      const l = 14 + r() * 30;
      const a = pick(r, [0.9, -0.9, 1.3, -1.3]);
      g.strokeStyle = rgba(0xffffff, 0.55);
      g.lineWidth = 1.2;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x, oy + y);
        g.lineTo(ox + x + Math.cos(a) * l, oy + y + Math.sin(a) * l);
        g.stroke();
      });
    }
    g.fillStyle = '#fff';
    for (let i = 0; i < 16; i++) {
      const x = r() * w;
      const y = r() * h;
      tiled(w, h, (ox, oy) => star4(g, ox + x, oy + y, 2 + r() * 3));
    }
  },
  ruins: (g, w, h) => {
    const r = rng(27);
    g.fillStyle = rgba(0x000000, 0.25);
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1.5);
    const cols = [0x00e5ff, 0xff2e88, 0xffc94a, 0x7cff6a, 0x8a5cff, 0xffffff];
    for (let i = 0; i < 46; i++) {
      const x = Math.round(r() * w);
      const y = r() * h;
      const l = 14 + r() * 110;
      const c = pick(r, cols);
      const wd = r() < 0.7 ? 1.5 : 3;
      tiled(w, h, (ox, oy) => {
        g.fillStyle = rgba(c, 0.55 + r() * 0.35);
        g.fillRect(ox + x, oy + y, wd, l);
      });
    }
    for (let i = 0; i < 20; i++) {
      const x = Math.round(r() * w / 6) * 6;
      const y = Math.round(r() * h / 6) * 6;
      tiled(w, h, (ox, oy) => {
        g.fillStyle = rgba(pick(r, cols), 0.6);
        g.fillRect(ox + x, oy + y, 6, 6);
      });
    }
  },
  reef: (g, w, h, _f, d) => {
    const r = rng(28);
    strata(g, w, h, r, d.rock.dark, 0.35, 26);
    const cols = [0xff7ab8, 0xffb35c, 0xffe066, 0xc8a4ff, 0x7cffc4];
    for (let i = 0; i < 30; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 3 + r() * 7;
      const c = pick(r, cols);
      tiled(w, h, (ox, oy) => {
        g.fillStyle = rgba(c, 0.95);
        g.strokeStyle = rgba(0x10243a, 0.9);
        g.lineWidth = 1.4;
        for (let k = 0; k < 3; k++) {
          g.beginPath();
          g.arc(ox + x + (k - 1) * s * 0.9, oy + y - (k === 1 ? s * 0.4 : 0), s * (k === 1 ? 1 : 0.75), 0, Math.PI * 2);
          g.fill();
          g.stroke();
        }
        g.fillStyle = rgba(0x10243a, 0.6);
        g.beginPath();
        g.arc(ox + x, oy + y - s * 0.4, s * 0.25, 0, Math.PI * 2);
        g.fill();
      });
    }
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const y = r() * h;
      g.strokeStyle = rgba(0xffffff, 0.6);
      g.lineWidth = 1.2;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.arc(ox + x, oy + y, 2 + r() * 3, 0, Math.PI * 2);
        g.stroke();
      });
    }
  },
  cosmic: (g, w, h) => {
    const r = rng(29);
    for (let i = 0; i < 6; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 30 + r() * 50;
      const c = pick(r, [0xff7ab8, 0x8a5cff, 0x00e5ff]);
      tiled(w, h, (ox, oy) => {
        const grd = g.createRadialGradient(ox + x, oy + y, 0, ox + x, oy + y, rad);
        grd.addColorStop(0, rgba(c, 0.3));
        grd.addColorStop(1, rgba(c, 0));
        g.fillStyle = grd;
        g.fillRect(ox + x - rad, oy + y - rad, rad * 2, rad * 2);
      });
    }
    for (let i = 0; i < 110; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 0.5 + r() * r() * 1.6;
      g.fillStyle = rgba(pick(r, [0xffffff, 0xc8b4ff, 0x9ff3ff]), 0.5 + r() * 0.5);
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.arc(ox + x, oy + y, s, 0, Math.PI * 2);
        g.fill();
      });
    }
  },
};

// =====================================================================================  LAGOON
export function lagoonTex(d: DimDef, frame = 0): Texture {
  return bake(`lag-${d.id}-${frame}`, PW, PH, (g, w, h) => (LAG[d.id] ?? LAG.home)(g, w, h, frame, d));
}
export const LAGOON_FRAMES: Record<string, number> = { home: 2, forest: 2, cliff: 3, volcano: 2, ghost: 2, ice: 1, ruins: 2, reef: 2, cosmic: 1 };

function crests(g: G2, w: number, h: number, f: number, n: number, color: number, alpha: number) {
  const r = rng(51);
  const j = rng(61 + f * 7);
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * w + (j() - 0.5) * 6;
    const y = r() * h + (j() - 0.5) * 3;
    const l = 10 + r() * 16;
    g.strokeStyle = rgba(color, alpha);
    g.lineWidth = 2.6;
    tiled(w, h, (ox, oy) => {
      g.beginPath();
      g.moveTo(ox + x - l, oy + y);
      g.quadraticCurveTo(ox + x - l / 2, oy + y - 5, ox + x, oy + y);
      g.quadraticCurveTo(ox + x + l / 2, oy + y - 5, ox + x + l, oy + y);
      g.stroke();
    });
  }
  g.fillStyle = rgba(0xffffff, 0.9);
  for (let i = 0; i < 18; i++) {
    const x = r() * w + (j() - 0.5) * 4;
    const y = r() * h;
    tiled(w, h, (ox, oy) => star4(g, ox + x, oy + y, 2 + j() * 2.5));
  }
}

const LAG: Record<string, (g: G2, w: number, h: number, f: number, d: DimDef) => void> = {
  home: (g, w, h, f) => crests(g, w, h, f, 30, 0xffffff, 0.6),
  forest: (g, w, h, f) => crests(g, w, h, f, 36, 0xffffff, 0.7),
  cliff: (g, w, h, f) => {
    const j = rng(71 + f * 11);
    g.lineCap = 'round';
    // woodcut water: broken parallel wavy lines
    for (let y = 4; y < h; y += 9) {
      g.strokeStyle = rgba(0xf3eee3, 0.55 + ((y / 9) % 3) * 0.12);
      g.lineWidth = 1.3;
      let x = -20 + j() * 20;
      while (x < w + 20) {
        const l = 20 + j() * 60;
        const yy = y + (j() - 0.5) * 2;
        tiled(w, h, (ox, oy) => {
          g.beginPath();
          for (let k = 0; k <= l; k += 6) {
            const py = yy + Math.sin((x + k) * 0.08 + y) * 2.2;
            if (k === 0) g.moveTo(ox + x + k, oy + py);
            else g.lineTo(ox + x + k, oy + py);
          }
          g.stroke();
        });
        x += l + 6 + j() * 18;
      }
    }
  },
  volcano: (g, w, h, f) => {
    const r = rng(81);
    const j = rng(91 + f * 5);
    // hot spots
    for (let i = 0; i < 12; i++) {
      const x = r() * w + (j() - 0.5) * 30;
      const y = r() * h + (j() - 0.5) * 14;
      const rad = 16 + j() * 26;
      tiled(w, h, (ox, oy) => {
        g.save();
        g.translate(ox + x, oy + y);
        g.scale(1, 0.5);
        const grd = g.createRadialGradient(0, 0, 0, 0, 0, rad);
        grd.addColorStop(0, rgba(0xfff0b0, 0.95));
        grd.addColorStop(0.4, rgba(0xffc94a, 0.7));
        grd.addColorStop(1, rgba(0xffc94a, 0));
        g.fillStyle = grd;
        g.beginPath();
        g.arc(0, 0, rad, 0, Math.PI * 2);
        g.fill();
        g.restore();
      });
    }
    // crust plates
    for (let i = 0; i < 22; i++) {
      const x = r() * w + (j() - 0.5) * 8;
      const y = r() * h + (j() - 0.5) * 4;
      const s = 12 + r() * 22;
      const n = 6;
      const pts: [number, number][] = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const rr = s * (0.65 + r() * 0.5);
        pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.5]);
      }
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        pts.forEach(([a, b], k) => (k ? g.lineTo(a + ox, b + oy) : g.moveTo(a + ox, b + oy)));
        g.closePath();
        g.fillStyle = rgba(0x3a1410, 0.92);
        g.fill();
        g.strokeStyle = rgba(0x120404, 0.9);
        g.lineWidth = 2;
        g.stroke();
        g.strokeStyle = rgba(0xff9a3a, 0.6);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(pts[3][0] + ox, pts[3][1] + oy);
        g.lineTo(pts[4][0] + ox, pts[4][1] + oy);
        g.lineTo(pts[5][0] + ox, pts[5][1] + oy);
        g.stroke();
      });
    }
  },
  ghost: (g, w, h, f) => {
    const r = rng(101);
    const j = rng(111 + f * 3);
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      const l = 14 + r() * 40;
      const c = pick(r, [0xff2e88, 0x00e5ff, 0xffd76a, 0x8a5cff]);
      tiled(w, h, (ox, oy) => {
        for (let k = 0; k < l; k += 4) {
          const wob = Math.sin(k * 0.4 + f * 2 + i) * 2.5 + (j() - 0.5) * 1.5;
          g.fillStyle = rgba(c, 0.55 * (1 - k / l));
          g.fillRect(ox + x + wob - 2, oy + y + k, 4, 2.5);
        }
      });
    }
    g.strokeStyle = rgba(0xffffff, 0.14);
    g.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const x = r() * w;
      const y = r() * h;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x - 14, oy + y);
        g.lineTo(ox + x + 14, oy + y);
        g.stroke();
      });
    }
  },
  ice: (g, w, h) => {
    const r = rng(121);
    for (let i = 0; i < 16; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 10 + r() * 22;
      const n = 5 + Math.floor(r() * 3);
      const pts: [number, number][] = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + r() * 0.4;
        const rr = s * (0.6 + r() * 0.5);
        pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.5]);
      }
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        pts.forEach(([a, b], k) => (k ? g.lineTo(a + ox, b + oy) : g.moveTo(a + ox, b + oy)));
        g.closePath();
        g.fillStyle = rgba(0x5a9cc8, 0.5);
        g.save();
        g.translate(0, 3);
        g.fill();
        g.restore();
        g.fillStyle = rgba(0xffffff, 0.95);
        g.fill();
        g.strokeStyle = rgba(0x6fb2d6, 0.9);
        g.lineWidth = 1.5;
        g.stroke();
      });
    }
    crests(g, w, h, 0, 10, 0xffffff, 0.5);
  },
  ruins: (g, w, h, f) => {
    const cols = [0xff2e88, 0xffc94a, 0x7cff6a, 0x00e5ff, 0x8a5cff];
    g.lineWidth = 1.6;
    let i = 0;
    for (let y = 2; y < h; y += 7) {
      const c = cols[(i + f) % cols.length];
      g.strokeStyle = rgba(c, 0.62);
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const yy = y + Math.sin((x / w) * Math.PI * 2 * 2 + i * 0.35 + f * 0.8) * 5 + Math.sin((x / w) * Math.PI * 2 * 5 + i) * 1.6;
          if (x === 0) g.moveTo(ox + x, oy + yy);
          else g.lineTo(ox + x, oy + yy);
        }
        g.stroke();
      });
      i++;
    }
  },
  reef: (g, w, h, f) => {
    causticNet(g, w, h, f, 0.55);
    const r = rng(141);
    g.strokeStyle = rgba(0xffffff, 0.75);
    g.lineWidth = 1.3;
    for (let i = 0; i < 20; i++) {
      const x = r() * w;
      const y = r() * h + f * 6;
      const s = 2 + r() * 3.5;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.arc(ox + x, oy + y, s, 0, Math.PI * 2);
        g.stroke();
      });
    }
  },
  cosmic: (g, w, h) => PAT.stars(g, w, h, 0),
  sakura: (g, w, h) => PAT.petals(g, w, h, 0),
  desert: (g, w, h) => PAT.dunes(g, w, h, 0),
  candy: (g, w, h) => PAT.sprinkles(g, w, h, 0),
  void: (g, w, h) => PAT.negative(g, w, h, 0),
};

// =====================================================================================  FALLS
export function fallTex(kind: FallKind): Texture {
  return bake(`fall-${kind}`, 64, 256, (g, w, h) => FALL[kind](g, w, h));
}
function streaks(g: G2, w: number, h: number, seed: number, n: number, cols: number[], wMin: number, wMax: number, aMin: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = 4 + r() * (w - 8);
    const y = r() * h;
    const l = 30 + r() * 110;
    const wd = wMin + r() * (wMax - wMin);
    const c = pick(r, cols);
    const a = aMin + r() * (1 - aMin);
    for (const oy of [-h, 0, h]) {
      const grd = g.createLinearGradient(0, y + oy, 0, y + oy + l);
      grd.addColorStop(0, rgba(c, 0));
      grd.addColorStop(0.3, rgba(c, a));
      grd.addColorStop(1, rgba(c, 0));
      g.fillStyle = grd;
      g.fillRect(x - wd / 2, y + oy, wd, l);
    }
  }
}
const FALL: Record<FallKind, (g: G2, w: number, h: number) => void> = {
  water: (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, rgba(0x7fd8f0, 0));
    grd.addColorStop(0.2, rgba(0x9fe3f2, 0.75));
    grd.addColorStop(0.5, rgba(0xdff7ff, 0.85));
    grd.addColorStop(0.8, rgba(0x9fe3f2, 0.75));
    grd.addColorStop(1, rgba(0x7fd8f0, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    streaks(g, w, h, 1, 26, [0xffffff, 0xffffff, 0xc8f2ff], 2, 6, 0.6);
    streaks(g, w, h, 2, 10, [0x3f9ccc], 2, 4, 0.4);
  },
  lava: (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, rgba(0xc8102e, 0));
    grd.addColorStop(0.2, rgba(0xff4a1a, 0.9));
    grd.addColorStop(0.5, rgba(0xffb03a, 1));
    grd.addColorStop(0.8, rgba(0xff4a1a, 0.9));
    grd.addColorStop(1, rgba(0xc8102e, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    streaks(g, w, h, 3, 20, [0xffe2a0, 0xffd76a], 2, 5, 0.6);
    streaks(g, w, h, 4, 12, [0x3a1410, 0x5e1308], 3, 8, 0.6);
  },
  ink: (g, w, h) => {
    const r = rng(5);
    g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = 8 + r() * (w - 16);
      g.strokeStyle = rgba(0xf3eee3, 0.6 + r() * 0.4);
      g.lineWidth = 1.2 + r() * 1.6;
      let y = -h + r() * 40;
      while (y < h * 2) {
        const l = 14 + r() * 50;
        g.beginPath();
        g.moveTo(x + (r() - 0.5) * 2, y);
        g.lineTo(x + (r() - 0.5) * 2, y + l);
        g.stroke();
        y += l + 6 + r() * 20;
      }
    }
  },
  data: (g, w, h) => {
    const r = rng(6);
    const cols = [0x00e5ff, 0xff2e88, 0xffc94a, 0x7cff6a, 0x8a5cff, 0xffffff];
    for (let x = 6; x < w - 6; x += 4) {
      const c = pick(r, cols);
      let y = -h;
      while (y < h * 2) {
        const l = 6 + r() * 40;
        g.fillStyle = rgba(c, 0.5 + r() * 0.5);
        g.fillRect(x, y, 2.5, l);
        y += l + r() * 26;
      }
    }
    g.font = 'bold 9px monospace';
    for (let i = 0; i < 14; i++) {
      g.fillStyle = rgba(0xffffff, 0.8);
      g.fillText(r() < 0.5 ? '0' : '1', 10 + r() * (w - 20), r() * h);
    }
  },
  neon: (g, w, h) => {
    const r = rng(7);
    for (let i = 0; i < 7; i++) {
      const x = 8 + r() * (w - 16);
      const c = pick(r, [0x00e5ff, 0xff2e88, 0xffffff, 0x8a5cff]);
      let y = -h;
      while (y < h * 2) {
        const l = 20 + r() * 90;
        g.shadowColor = rgba(c, 1);
        g.shadowBlur = 6;
        g.fillStyle = rgba(c, 0.9);
        g.fillRect(x, y, 1.6, l);
        g.beginPath();
        g.arc(x + 0.8, y + l, 2.2, 0, Math.PI * 2);
        g.fill();
        y += l + 20 + r() * 60;
      }
    }
    g.shadowBlur = 0;
  },
  ice: (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, rgba(0xbfe6f5, 0));
    grd.addColorStop(0.2, rgba(0xbfe6f5, 0.85));
    grd.addColorStop(0.5, rgba(0xf2fbff, 0.95));
    grd.addColorStop(0.8, rgba(0x9fd2e8, 0.85));
    grd.addColorStop(1, rgba(0x9fd2e8, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    streaks(g, w, h, 8, 14, [0xffffff, 0x7fb8dc], 2, 4, 0.5);
  },
  prism: (g, w, h) => {
    const cols = [0xff7ab8, 0xffc94a, 0x7cffc4, 0x7fd8ff, 0xb59cff];
    const grd = g.createLinearGradient(0, 0, w, 0);
    cols.forEach((c, i) => grd.addColorStop((i + 0.5) / cols.length, rgba(c, 0.75)));
    g.fillStyle = grd;
    g.fillRect(4, 0, w - 8, h);
    streaks(g, w, h, 9, 22, [0xffffff], 2, 5, 0.6);
  },
  stars: (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, rgba(0x2a1650, 0));
    grd.addColorStop(0.5, rgba(0x5a3a9a, 0.7));
    grd.addColorStop(1, rgba(0x2a1650, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    const r = rng(10);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = rgba(pick(r, [0xffffff, 0xc8b4ff, 0x9ff3ff]), 0.9);
      const x = 8 + r() * (w - 16);
      const y = r() * h;
      star4(g, x, y, 1 + r() * 3);
    }
    streaks(g, w, h, 11, 8, [0xc8b4ff], 1, 2, 0.5);
  },
};

// =====================================================================================  CLOUDS + SPRITES
/** soft anime cumulus (white top, lilac belly, thin ink rim) — single sprite */
export function wispTex(variant = 0, tint = 0xffffff, belly = 0xc9d6ef): Texture {
  return bake(
    `wisp-${variant}-${tint}-${belly}`,
    320,
    128,
    (g, w, h) => {
      const r = rng(31 + variant * 7);
      const blobs: [number, number, number][] = [];
      const n = 5 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1);
        blobs.push([40 + f * (w - 80) + (r() - 0.5) * 16, h * 0.62 - Math.sin(f * Math.PI) * (h * 0.28) + (r() - 0.5) * 10, 18 + Math.sin(f * Math.PI) * 22 + r() * 8]);
      }
      const base = h * 0.7;
      const path = () => {
        g.beginPath();
        for (const [x, y, rr] of blobs) {
          g.moveTo(x + rr, y);
          g.arc(x, y, rr, 0, Math.PI * 2);
        }
        g.rect(blobs[0][0], base - 16, blobs[n - 1][0] - blobs[0][0], 22);
      };
      g.save();
      path();
      g.clip();
      g.fillStyle = rgba(tint, 1);
      g.fillRect(0, 0, w, h);
      g.fillStyle = rgba(belly, 1);
      g.beginPath();
      g.ellipse(w / 2, base + 6, w * 0.48, 18, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = rgba(0xffffff, 0.8);
      for (const [x, y, rr] of blobs) {
        g.beginPath();
        g.arc(x - rr * 0.25, y - rr * 0.3, rr * 0.45, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
      path();
      g.strokeStyle = rgba(0x1f2b4a, 0.18);
      g.lineWidth = 2;
      g.stroke();
    },
    false,
  );
}

/** tileable band of cumulus clouds for the void layers */
export function cloudFieldTex(variant: number): Texture {
  return bake(`cloudfield-${variant}`, 1024, 512, (g, w, h) => {
    const r = rng(41 + variant * 3);
    const n = variant ? 7 : 9;
    for (let i = 0; i < n; i++) {
      const cx = r() * w;
      const cy = r() * h;
      const sc = 0.7 + r() * 0.9;
      const belly = variant ? 0xc4d8f0 : 0xb7cdea;
      const k = 5 + Math.floor(r() * 4);
      const blobs: [number, number, number][] = [];
      for (let j = 0; j < k; j++) {
        const f = j / (k - 1);
        blobs.push([(f - 0.5) * 220 * sc, -Math.sin(f * Math.PI) * 40 * sc + (r() - 0.5) * 16, (22 + Math.sin(f * Math.PI) * 30 + r() * 10) * sc]);
      }
      for (const [ox, oy] of OFF.map(([a, b]) => [a * w, b * h])) {
        const X = cx + ox;
        const Y = cy + oy;
        if (X < -260 || X > w + 260 || Y < -140 || Y > h + 140) continue;
        g.save();
        g.beginPath();
        for (const [x, y, rr] of blobs) {
          g.moveTo(X + x + rr, Y + y);
          g.arc(X + x, Y + y, rr, 0, Math.PI * 2);
        }
        g.rect(X - 110 * sc, Y - 6, 220 * sc, 26 * sc);
        g.clip();
        g.fillStyle = '#ffffff';
        g.fillRect(X - 300, Y - 200, 600, 400);
        g.fillStyle = rgba(belly, 1);
        g.beginPath();
        g.ellipse(X, Y + 18 * sc, 140 * sc, 22 * sc, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }
  });
}

/** small particle textures */
export function particleTex(kind: 'leaf' | 'petal' | 'flake' | 'pixel' | 'bubble' | 'cube' | 'drop' | 'ember' | 'seed' | 'shard'): Texture {
  return bake(
    `pt-${kind}`,
    32,
    32,
    (g) => {
      g.lineCap = 'round';
      g.lineJoin = 'round';
      switch (kind) {
        case 'leaf':
          g.fillStyle = '#fff';
          g.beginPath();
          g.moveTo(4, 16);
          g.quadraticCurveTo(16, 2, 28, 16);
          g.quadraticCurveTo(16, 30, 4, 16);
          g.fill();
          g.strokeStyle = 'rgba(0,0,0,0.35)';
          g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(5, 16);
          g.lineTo(27, 16);
          g.stroke();
          break;
        case 'petal':
          g.fillStyle = '#fff';
          g.beginPath();
          g.ellipse(16, 16, 10, 6, 0.5, 0, Math.PI * 2);
          g.fill();
          break;
        case 'flake':
          g.strokeStyle = '#fff';
          g.lineWidth = 2.4;
          for (let k = 0; k < 3; k++) {
            const a = (k / 3) * Math.PI;
            g.beginPath();
            g.moveTo(16 - Math.cos(a) * 12, 16 - Math.sin(a) * 12);
            g.lineTo(16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12);
            g.stroke();
          }
          break;
        case 'pixel':
          g.fillStyle = '#fff';
          g.fillRect(8, 8, 16, 16);
          break;
        case 'bubble':
          g.strokeStyle = '#fff';
          g.lineWidth = 2.5;
          g.beginPath();
          g.arc(16, 16, 11, 0, Math.PI * 2);
          g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.8)';
          g.beginPath();
          g.arc(12, 12, 3, 0, Math.PI * 2);
          g.fill();
          break;
        case 'cube':
          g.strokeStyle = '#fff';
          g.lineWidth = 1.8;
          cubeOutline(g, 16, 10, 10);
          break;
        case 'drop':
          g.fillStyle = '#fff';
          g.beginPath();
          g.moveTo(16, 4);
          g.quadraticCurveTo(25, 18, 16, 26);
          g.quadraticCurveTo(7, 18, 16, 4);
          g.fill();
          break;
        case 'ember': {
          const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
          grd.addColorStop(0, 'rgba(255,255,255,1)');
          grd.addColorStop(0.25, 'rgba(255,255,255,0.9)');
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = grd;
          g.fillRect(0, 0, 32, 32);
          break;
        }
        case 'seed':
          g.strokeStyle = '#fff';
          g.lineWidth = 1.4;
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            g.beginPath();
            g.moveTo(16, 16);
            g.lineTo(16 + Math.cos(a) * 9, 16 + Math.sin(a) * 9);
            g.stroke();
          }
          g.fillStyle = '#fff';
          g.beginPath();
          g.arc(16, 16, 2.4, 0, Math.PI * 2);
          g.fill();
          break;
        case 'shard':
          g.fillStyle = '#fff';
          g.beginPath();
          g.moveTo(16, 2);
          g.lineTo(24, 16);
          g.lineTo(16, 30);
          g.lineTo(9, 16);
          g.closePath();
          g.fill();
          break;
      }
    },
    false,
  );
}
