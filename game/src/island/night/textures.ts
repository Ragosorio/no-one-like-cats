/**
 * Baked textures for the island's narrative nights (src/island/night). Drawn once on a canvas (halftone +
 * ink, like the dimension skies) and reused: nothing is drawn per frame.
 */
import type { Texture } from 'pixi.js';
import { bake, rgba, rng } from '../dimensions/bake';

type G2 = CanvasRenderingContext2D;

/** the astral void: indigo zenith → violet → a teal-blue glow far below (never black) */
export function nightGradTex(): Texture {
  return bake(
    'night-grad',
    8,
    512,
    (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, rgba(0x0b0b2c));
      grd.addColorStop(0.38, rgba(0x231a5c));
      grd.addColorStop(0.72, rgba(0x18306a));
      grd.addColorStop(1, rgba(0x2f5d9a));
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    },
    false,
  );
}

/** a tileable star field (seeded): pin-prick dots, soft medium stars and a few ink crosses */
export function starTileTex(seed: number, dense: number): Texture {
  return bake(
    `night-stars-${seed}-${dense}`,
    512,
    512,
    (g, w, h) => {
      const r = rng(seed);
      const cols = [0xffffff, 0xdfe8ff, 0xfff1c8, 0xc9d8ff, 0xffd6ec];
      const dot = (x: number, y: number, rad: number, a: number, c: number) => {
        // wrap around the tile edges so it tiles seamlessly
        for (const dx of [0, -w, w])
          for (const dy of [0, -h, h]) {
            const px = x + dx;
            const py = y + dy;
            if (px < -rad * 6 || px > w + rad * 6 || py < -rad * 6 || py > h + rad * 6) continue;
            g.fillStyle = rgba(c, a);
            g.beginPath();
            g.arc(px, py, rad, 0, Math.PI * 2);
            g.fill();
          }
      };
      for (let i = 0; i < 260 * dense; i++) dot(r() * w, r() * h, 0.55 + r() * 0.9, 0.35 + r() * 0.6, cols[Math.floor(r() * cols.length)]);
      for (let i = 0; i < 26 * dense; i++) {
        const x = r() * w;
        const y = r() * h;
        const c = cols[Math.floor(r() * cols.length)];
        const rad = 1.4 + r() * 1.4;
        const grd = g.createRadialGradient(x, y, 0, x, y, rad * 5);
        grd.addColorStop(0, rgba(c, 0.55));
        grd.addColorStop(1, rgba(c, 0));
        g.fillStyle = grd;
        g.fillRect(x - rad * 5, y - rad * 5, rad * 10, rad * 10);
        dot(x, y, rad, 1, 0xffffff);
      }
      // ink-print crosses (the comic sky)
      g.lineCap = 'round';
      for (let i = 0; i < 7 * dense; i++) {
        const x = 20 + r() * (w - 40);
        const y = 20 + r() * (h - 40);
        const L = 5 + r() * 7;
        g.strokeStyle = rgba(0xffffff, 0.9);
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(x - L, y);
        g.lineTo(x + L, y);
        g.moveTo(x, y - L);
        g.lineTo(x, y + L);
        g.stroke();
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x - L * 0.45, y - L * 0.45);
        g.lineTo(x + L * 0.45, y + L * 0.45);
        g.moveTo(x - L * 0.45, y + L * 0.45);
        g.lineTo(x + L * 0.45, y - L * 0.45);
        g.stroke();
      }
    },
    true,
  );
}

/**
 * Aurora / nebula band in halftone ink: a wavy ribbon whose edges dissolve into Ben-Day dots.
 * Tiles horizontally (x wraps).
 */
export function auroraTex(variant: number): Texture {
  return bake(
    `night-aurora-${variant}`,
    1024,
    256,
    (g, w, h) => {
      const r = rng(77 + variant * 13);
      const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
      const center = (x: number) => {
        const u = (x / w) * Math.PI * 2;
        return h * (0.5 + 0.18 * Math.sin(u * 2 + ph[0]) + 0.09 * Math.sin(u * 5 + ph[1]));
      };
      const width = (x: number) => {
        const u = (x / w) * Math.PI * 2;
        return h * (0.16 + 0.07 * Math.sin(u * 3 + ph[2]));
      };
      const A = variant % 2 ? 0x8f7bff : 0x58f0cf;
      const B = variant % 2 ? 0xff7ad0 : 0x7aa8ff;
      // soft glow body
      for (let x = 0; x < w; x += 2) {
        const c = center(x);
        const wd = width(x);
        const grd = g.createLinearGradient(0, c - wd * 2.2, 0, c + wd * 2.2);
        const col = mix(A, B, 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 4 + ph[1]));
        grd.addColorStop(0, rgba(col, 0));
        grd.addColorStop(0.42, rgba(col, 0.22));
        grd.addColorStop(0.5, rgba(col, 0.34));
        grd.addColorStop(0.58, rgba(col, 0.22));
        grd.addColorStop(1, rgba(col, 0));
        g.fillStyle = grd;
        g.fillRect(x, c - wd * 2.2, 2, wd * 4.4);
      }
      // vertical curtain streaks
      for (let i = 0; i < 90; i++) {
        const x = r() * w;
        const c = center(x);
        const wd = width(x);
        const col = mix(A, B, r());
        const grd = g.createLinearGradient(0, c - wd * 2.6, 0, c + wd * 0.8);
        grd.addColorStop(0, rgba(col, 0));
        grd.addColorStop(0.7, rgba(col, 0.16 + r() * 0.14));
        grd.addColorStop(1, rgba(col, 0));
        g.fillStyle = grd;
        g.fillRect(x, c - wd * 2.6, 1.5 + r() * 2.5, wd * 3.4);
      }
      // halftone dissolve: dots shrink away from the ribbon's heart
      const cell = 9;
      let row = 0;
      for (let y = cell / 2; y < h; y += cell * 0.866, row++)
        for (let x = (row & 1 ? cell / 2 : 0) + cell / 2; x < w; x += cell) {
          const c = center(x);
          const wd = width(x);
          const d = Math.abs(y - c) / (wd * 2.4);
          if (d > 1) continue;
          const rr = cell * 0.4 * (1 - d) ** 1.2;
          if (rr < 0.5) continue;
          g.fillStyle = rgba(mix(A, B, x / w), 0.5 * (1 - d * 0.6));
          g.beginPath();
          g.arc(x, y, rr, 0, Math.PI * 2);
          g.fill();
        }
    },
    true,
  );
}

/**
 * The seam in the sky: a torn line that was sewn back — glowing crack, stitches across it, halftone bleed.
 * Transparent; meant to be stretched across the upper sky.
 */
export function seamTex(kind: 'night' | 'day' = 'night'): Texture {
  const day = kind === 'day';
  return bake(
    `night-seam-${kind}`,
    1024,
    256,
    (g, w, h) => {
      const r = rng(4242);
      const pts: [number, number][] = [];
      let y = h * 0.62;
      for (let x = -10; x <= w + 10; x += 22 + r() * 18) {
        y += (r() - 0.5) * 26 - (x / w) * 1.6;
        y = Math.max(h * 0.25, Math.min(h * 0.8, y));
        pts.push([x, y]);
      }
      const path = () => {
        g.beginPath();
        pts.forEach(([x, yy], i) => (i ? g.lineTo(x, yy) : g.moveTo(x, yy)));
      };
      g.lineJoin = 'round';
      g.lineCap = 'round';
      const passes: [number, number, number][] = day
        ? [
            [22, 0.08, 0x7a5cff],
            [10, 0.22, 0x6a4cff],
            [5, 0.9, 0x2a1d63],
            [2, 1, 0xfff6ff],
          ]
        : [
            [26, 0.05, 0x9a7bff],
            [16, 0.09, 0x9a7bff],
            [9, 0.18, 0xc7b4ff],
            [4, 0.5, 0xf2ecff],
            [1.6, 0.95, 0xffffff],
          ];
      for (const [wd, a, c] of passes) {
        g.strokeStyle = rgba(c, a);
        g.lineWidth = wd;
        path();
        g.stroke();
      }
      // stitches: little ink-and-light crosses holding the page together
      for (let i = 1; i < pts.length - 1; i += 2) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        const ang = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2 + (r() - 0.5) * 0.4;
        const L = 9 + r() * 5;
        g.strokeStyle = day ? rgba(0x231626, 0.85) : rgba(0xe8e0ff, 0.75);
        g.lineWidth = day ? 3 : 2;
        g.beginPath();
        g.moveTo(mx - Math.cos(ang) * L, my - Math.sin(ang) * L);
        g.lineTo(mx + Math.cos(ang) * L, my + Math.sin(ang) * L);
        g.stroke();
      }
      // halftone bleed along the seam
      for (let i = 0; i < 520; i++) {
        const k = Math.floor(r() * (pts.length - 1));
        const [x0, y0] = pts[k];
        const [x1, y1] = pts[k + 1];
        const f = r();
        const off = (r() - 0.5) * 60;
        const px = x0 + (x1 - x0) * f;
        const py = y0 + (y1 - y0) * f + off;
        const rr = 2.2 * (1 - Math.abs(off) / 30);
        if (rr < 0.4) continue;
        g.fillStyle = day ? rgba(0x5a3ccf, 0.45) : rgba(0xb9a6ff, 0.4);
        g.beginPath();
        g.arc(px, py, rr, 0, Math.PI * 2);
        g.fill();
      }
    },
    false,
  );
}

/** a rising star's trail: bright head on TOP, tail fading DOWN (it falls upward) */
export function streakTex(): Texture {
  return bake(
    'night-streak',
    48,
    320,
    (g, w, h) => {
      const cx = w / 2;
      const head = 16;
      // tail
      const grd = g.createLinearGradient(0, head, 0, h);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)');
      grd.addColorStop(0.25, 'rgba(210,220,255,0.5)');
      grd.addColorStop(1, 'rgba(160,140,255,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(cx - 5, head);
      g.quadraticCurveTo(cx, h * 0.6, cx, h);
      g.quadraticCurveTo(cx, h * 0.6, cx + 5, head);
      g.closePath();
      g.fill();
      // head glow
      const hg = g.createRadialGradient(cx, head, 0, cx, head, 20);
      hg.addColorStop(0, 'rgba(255,255,255,1)');
      hg.addColorStop(0.3, 'rgba(255,255,255,0.65)');
      hg.addColorStop(1, 'rgba(200,190,255,0)');
      g.fillStyle = hg;
      g.fillRect(cx - 22, head - 22, 44, 44);
    },
    false,
  );
}

/** the lighthouse beam: apex on the LEFT edge, opening and fading to the right, soft sides */
export function beamTex(): Texture {
  return bake(
    'night-beam',
    512,
    256,
    (g, w, h) => {
      const img = g.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const u = x / w;
          const half = 0.04 + u * 0.46; // cone half-height (fraction of h)
          const v = Math.abs(y / h - 0.5) / half;
          if (v > 1) continue;
          const side = (1 - v * v) ** 1.6;
          const along = Math.min(1, u * 9) * (1 - u) ** 1.25;
          const a = side * along;
          const i = (y * w + x) * 4;
          d[i] = 255;
          d[i + 1] = 246;
          d[i + 2] = 214;
          d[i + 3] = Math.round(a * 255);
        }
      g.putImageData(img, 0, 0);
    },
    false,
  );
}

/** screen vignette: clear centre, dark edges (tint it) */
export function vignetteTex(): Texture {
  return bake(
    'night-vignette',
    512,
    512,
    (g, w, h) => {
      const grd = g.createRadialGradient(w / 2, h / 2, w * 0.22, w / 2, h / 2, w * 0.72);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(0.6, 'rgba(255,255,255,0.35)');
      grd.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    },
    false,
  );
}

/** a flat ellipse glow for light pools on the ground / water reflections */
export function poolTex(): Texture {
  return bake(
    'night-pool',
    256,
    128,
    (g, w, h) => {
      g.save();
      g.scale(1, h / w);
      const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      grd.addColorStop(0, 'rgba(255,255,255,0.9)');
      grd.addColorStop(0.45, 'rgba(255,255,255,0.32)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, w);
      g.restore();
    },
    false,
  );
}

function mix(a: number, b: number, k: number) {
  const t = Math.max(0, Math.min(1, k));
  const r = ((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * t);
  const gg = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * t);
  const bl = (a & 255) + (((b & 255) - (a & 255)) * t);
  return (Math.round(r) << 16) | (Math.round(gg) << 8) | Math.round(bl);
}

export type { G2 };
