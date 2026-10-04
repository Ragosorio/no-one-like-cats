/**
 * Dimension "skies": one big baked bubble per island, drawn behind its floating rock. The edge
 * dissolves in halftone (Spider-Verse bleed). Sealed dimensions get a pencil/paper version with a
 * glowing tear that lets their real colours peek through.
 */
import { Texture } from 'pixi.js';
import { bake, canvas, rgba, rng, dropBaked } from './bake';
import type { DimDef, DimId } from './defs';

type G2 = CanvasRenderingContext2D;
export const SKY = 1024;

/** dimensions that own a backdrop (home lives in the base void) */
export const HAS_SKY: Record<DimId, boolean> = { home: false, forest: true, cliff: true, volcano: true, ghost: true, ice: true, ruins: true, reef: true, cosmic: true };
export const SKY_FRAMES: Partial<Record<DimId, number>> = { cliff: 2 };

export function skyTex(d: DimDef, sealed: boolean, frame = 0): Texture {
  const key = `sky-${d.id}-${sealed ? 's' : 'o'}-${frame}`;
  return bake(
    key,
    SKY,
    SKY,
    (g, w, h) => {
      const [c, sg] = canvas(w, h);
      PAINT[d.id]?.(sg, w, h, frame);
      if (!sealed) {
        g.drawImage(c, 0, 0);
        dissolve(g, w, h, 17 + d.id.length, 0.56);
      } else paperSeal(g, c, w, h, d);
    },
    false,
  );
}
/** free the other variant when a dimension opens/locks (keeps GPU memory low) */
export function dropSky(d: DimDef, sealed: boolean) {
  for (let f = 0; f < (SKY_FRAMES[d.id] ?? 1); f++) dropBaked(`sky-${d.id}-${sealed ? 's' : 'o'}-${f}`);
}

function blobRadius(seed: number, n = 11) {
  const r = rng(seed);
  const wob = Array.from({ length: n }, () => 0.86 + r() * 0.16);
  return (a: number) => {
    const idx = ((a + Math.PI) / (Math.PI * 2)) * n;
    const i0 = Math.floor(idx) % n;
    const i1 = (i0 + 1) % n;
    const f = idx - Math.floor(idx);
    const s = f * f * (3 - 2 * f);
    return wob[i0] * (1 - s) + wob[i1] * s;
  };
}

/** halftone-dissolve alpha mask (solid core → shrinking Ben-Day dots) */
function dissolve(g: G2, w: number, h: number, seed: number, inner: number) {
  const [mc, m] = canvas(w, h);
  const rad = blobRadius(seed);
  const R = w / 2 - 6;
  m.fillStyle = '#fff';
  m.beginPath();
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2 - Math.PI;
    const rr = rad(a) * R * inner;
    const x = w / 2 + Math.cos(a) * rr;
    const y = h / 2 + Math.sin(a) * rr;
    if (i) m.lineTo(x, y);
    else m.moveTo(x, y);
  }
  m.fill();
  const cell = 15;
  let row = 0;
  for (let y = cell / 2; y < h; y += cell * 0.866, row++)
    for (let x = cell / 2 + (row & 1 ? cell / 2 : 0); x < w; x += cell) {
      const dx = x - w / 2;
      const dy = y - h / 2;
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const Rr = rad(a) * R;
      const t = (d - Rr * inner) / (Rr * (1 - inner));
      if (t < -0.05 || t > 1) continue;
      const rr = cell * 0.62 * Math.pow(Math.max(0, 1 - Math.max(0, t)), 1.1);
      if (rr < 0.6) continue;
      m.beginPath();
      m.arc(x, y, rr, 0, Math.PI * 2);
      m.fill();
    }
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(mc, 0, 0);
  g.globalCompositeOperation = 'source-over';
}

/** sealed: sepia pencil version + hatch + torn edge + a glowing tear with the real colours */
function paperSeal(g: G2, src: HTMLCanvasElement, w: number, h: number, d: DimDef) {
  const [pc, p] = canvas(w, h);
  p.drawImage(src, 0, 0);
  const img = p.getImageData(0, 0, w, h);
  const px = img.data;
  const lo = [0xa8, 0x97, 0x7a];
  const hi = [0xf3, 0xec, 0xdc];
  for (let i = 0; i < px.length; i += 4) {
    const l = (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / 255;
    const t = Math.min(1, 0.35 + l * 0.75);
    px[i] = lo[0] + (hi[0] - lo[0]) * t;
    px[i + 1] = lo[1] + (hi[1] - lo[1]) * t;
    px[i + 2] = lo[2] + (hi[2] - lo[2]) * t;
  }
  p.putImageData(img, 0, 0);
  // pencil hatch
  const r = rng(77);
  p.strokeStyle = rgba(0x171317, 0.13);
  p.lineWidth = 1.4;
  for (let i = -h; i < w + h; i += 11) {
    p.beginPath();
    p.moveTo(i + (r() - 0.5) * 3, 0);
    p.lineTo(i - h * 0.6 + (r() - 0.5) * 3, h);
    p.stroke();
  }
  // tear: a jagged crack across the upper third (above the island), widest in the middle
  const pts: [number, number][] = [];
  let y = h * 0.2;
  for (let x = w * 0.1; x < w * 0.9; x += 22 + r() * 18) {
    pts.push([x, y]);
    y += (r() - 0.5) * 46;
    y = Math.max(h * 0.1, Math.min(h * 0.3, y));
  }
  const n = pts.length;
  const half = (i: number) => 3 + Math.sin((i / (n - 1)) * Math.PI) * (26 + (i % 3) * 7);
  const top = pts.map(([a, b], i) => [a, b - half(i)] as [number, number]);
  const bot = pts.map(([a, b], i) => [a + (i % 2 ? 6 : -4), b + half(i) * 0.8] as [number, number]).reverse();
  const tear = [...top, ...bot];
  const path = () => {
    p.beginPath();
    tear.forEach(([a, b], i) => (i ? p.lineTo(a, b) : p.moveTo(a, b)));
    p.closePath();
  };
  p.save();
  path();
  p.clip();
  p.drawImage(src, 0, 0);
  p.restore();
  p.save();
  p.shadowColor = rgba(d.accent, 1);
  p.shadowBlur = 34;
  path();
  p.strokeStyle = rgba(d.accent, 1);
  p.lineWidth = 8;
  p.stroke();
  p.restore();
  path();
  p.strokeStyle = rgba(0x171317, 1);
  p.lineWidth = 3;
  p.stroke();
  // torn paper edge mask + ink rim
  const rad = blobRadius(91, 15);
  const R = w / 2 - 10;
  const edge: [number, number][] = [];
  const rr = rng(5);
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2 - Math.PI;
    const k = rad(a) * R * 0.86 * (1 + (rr() - 0.5) * 0.035);
    edge.push([w / 2 + Math.cos(a) * k, h / 2 + Math.sin(a) * k]);
  }
  g.save();
  g.beginPath();
  edge.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
  g.closePath();
  g.fillStyle = rgba(0x171317, 1);
  g.save();
  g.translate(8, 10);
  g.fill();
  g.restore();
  g.clip();
  g.drawImage(pc, 0, 0);
  g.restore();
  g.beginPath();
  edge.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
  g.closePath();
  g.strokeStyle = rgba(0x171317, 1);
  g.lineWidth = 5;
  g.stroke();
}

// --------------------------------------------------------------------------------- helpers
function vgrad(g: G2, w: number, h: number, stops: [number, number][]) {
  const grd = g.createLinearGradient(0, 0, 0, h);
  for (const [t, c] of stops) grd.addColorStop(t, rgba(c, 1));
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
}
function glow(g: G2, x: number, y: number, r: number, c: number, a: number) {
  const grd = g.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, rgba(c, a));
  grd.addColorStop(1, rgba(c, 0));
  g.fillStyle = grd;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
function cumulus(g: G2, x: number, y: number, s: number, top: number, belly: number, r: () => number, ink = 0.18) {
  const k = 6;
  const blobs: [number, number, number][] = [];
  for (let j = 0; j < k; j++) {
    const f = j / (k - 1);
    blobs.push([x + (f - 0.5) * 230 * s, y - Math.sin(f * Math.PI) * 50 * s + (r() - 0.5) * 14 * s, (24 + Math.sin(f * Math.PI) * 34 + r() * 10) * s]);
  }
  const path = () => {
    g.beginPath();
    for (const [bx, by, br] of blobs) {
      g.moveTo(bx + br, by);
      g.arc(bx, by, br, 0, Math.PI * 2);
    }
    g.rect(x - 115 * s, y - 8 * s, 230 * s, 30 * s);
  };
  g.save();
  path();
  g.clip();
  g.fillStyle = rgba(top, 1);
  g.fillRect(x - 300 * s, y - 200 * s, 600 * s, 400 * s);
  g.fillStyle = rgba(belly, 1);
  g.beginPath();
  g.ellipse(x, y + 20 * s, 150 * s, 26 * s, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  if (ink > 0) {
    path();
    g.strokeStyle = rgba(0x1f2b4a, ink);
    g.lineWidth = 2.5;
    g.stroke();
  }
}
function stars(g: G2, w: number, h: number, n: number, seed: number, maxY = 1) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h * maxY;
    const s = 0.5 + r() * r() * 2;
    g.fillStyle = rgba(r() < 0.8 ? 0xffffff : 0xc8e8ff, 0.4 + r() * 0.6);
    g.beginPath();
    g.arc(x, y, s, 0, Math.PI * 2);
    g.fill();
  }
}
function spark(g: G2, x: number, y: number, s: number, c: number, a = 1) {
  g.fillStyle = rgba(c, a);
  g.beginPath();
  g.moveTo(x, y - s);
  g.quadraticCurveTo(x, y, x + s, y);
  g.quadraticCurveTo(x, y, x, y + s);
  g.quadraticCurveTo(x, y, x - s, y);
  g.quadraticCurveTo(x, y, x, y - s);
  g.fill();
}

// --------------------------------------------------------------------------------- painters
const PAINT: Partial<Record<DimId, (g: G2, w: number, h: number, f: number) => void>> = {
  forest: (g, w, h) => {
    const r = rng(3);
    vgrad(g, w, h, [
      [0, 0x1f7fd6],
      [0.45, 0x6cc0f2],
      [0.75, 0xc8ecff],
      [1, 0xe8f8ff],
    ]);
    // sun + flare
    glow(g, w * 0.5, h * 0.2, 260, 0xfff6c8, 0.9);
    glow(g, w * 0.5, h * 0.2, 90, 0xffffff, 1);
    g.save();
    g.translate(w * 0.5, h * 0.2);
    for (let i = 0; i < 28; i++) {
      g.rotate((Math.PI * 2) / 28);
      g.fillStyle = rgba(0xffffff, 0.12 + (i % 3) * 0.05);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(520, -6 - (i % 4) * 4);
      g.lineTo(520, 6 + (i % 4) * 4);
      g.closePath();
      g.fill();
    }
    g.restore();
    // rainbow
    const rb = [0xff4a5a, 0xff9a3a, 0xffe066, 0x7cff6a, 0x5fd0ff, 0x6a7cff, 0xb06aff];
    rb.forEach((c, i) => {
      g.strokeStyle = rgba(c, 0.42);
      g.lineWidth = 10;
      g.beginPath();
      g.arc(w * 0.5, h * 0.5, 330 - i * 10, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
    });
    // far mountains (two layers, snow caps)
    const ridge = (y0: number, amp: number, col: number, snow: boolean, seed: number) => {
      const rr = rng(seed);
      const pts: [number, number][] = [[0, h]];
      let x = 0;
      while (x <= w) {
        pts.push([x, y0 - rr() * amp]);
        x += 40 + rr() * 60;
        pts.push([x, y0 - rr() * amp * 0.3]);
        x += 30 + rr() * 40;
      }
      pts.push([w, h]);
      g.beginPath();
      pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
      g.closePath();
      g.fillStyle = rgba(col, 1);
      g.fill();
      if (snow)
        for (let i = 1; i < pts.length - 2; i += 2) {
          const [px, py] = pts[i];
          if (py > y0 - amp * 0.5) continue;
          g.fillStyle = rgba(0xffffff, 0.9);
          g.beginPath();
          g.moveTo(px, py);
          g.lineTo(px + 16, py + 22);
          g.lineTo(px + 4, py + 18);
          g.lineTo(px - 6, py + 26);
          g.lineTo(px - 16, py + 20);
          g.closePath();
          g.fill();
        }
    };
    ridge(h * 0.6, 150, 0x8fb2dc, true, 4);
    ridge(h * 0.7, 110, 0x5f8fc4, true, 5);
    ridge(h * 0.8, 70, 0x3f7a8a, false, 6);
    // clouds
    cumulus(g, w * 0.17, h * 0.42, 0.9, 0xffffff, 0xcfe0f4, r);
    cumulus(g, w * 0.84, h * 0.36, 1.05, 0xffffff, 0xcfe0f4, r);
    cumulus(g, w * 0.7, h * 0.7, 0.8, 0xffffff, 0xd8e6f4, r);
    cumulus(g, w * 0.28, h * 0.78, 0.7, 0xffffff, 0xd8e6f4, r);
    // birds
    g.strokeStyle = rgba(0x1f2b4a, 0.7);
    g.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = w * 0.25 + r() * w * 0.5;
      const y = h * 0.28 + r() * h * 0.12;
      g.beginPath();
      g.moveTo(x - 7, y - 3);
      g.quadraticCurveTo(x - 3, y - 5, x, y);
      g.quadraticCurveTo(x + 3, y - 5, x + 7, y - 3);
      g.stroke();
    }
  },
  cliff: (g, w, h, f) => {
    const r = rng(8);
    const j = rng(400 + f * 23);
    const J = (k: number) => (j() - 0.5) * k;
    g.fillStyle = '#0e0c0e';
    g.fillRect(0, 0, w, h);
    const vx = w * 0.62;
    const vy = h * 0.24;
    g.lineCap = 'round';
    // concentric arcs around the vanishing point
    for (let rad = 40; rad < 900; rad += 26 + r() * 30) {
      g.strokeStyle = rgba(0xf3eee3, 0.18 + r() * 0.25);
      g.lineWidth = 1 + r();
      const a0 = r() * Math.PI * 2;
      g.beginPath();
      g.arc(vx + J(3), vy + J(3), rad, a0, a0 + Math.PI * (0.6 + r() * 1.3));
      g.stroke();
    }
    // radial perspective lines
    for (let i = 0; i < 120; i++) {
      const a = r() * Math.PI * 2;
      const r0 = 20 + r() * 80;
      const r1 = 300 + r() * 700;
      g.strokeStyle = rgba(0xf3eee3, 0.25 + r() * 0.5);
      g.lineWidth = 0.8 + r() * 1.4;
      g.beginPath();
      g.moveTo(vx + Math.cos(a) * r0 + J(2), vy + Math.sin(a) * r0 + J(2));
      g.lineTo(vx + Math.cos(a + J(0.01)) * r1, vy + Math.sin(a + J(0.01)) * r1);
      g.stroke();
    }
    // ink burst at the VP
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2;
      const l = 10 + r() * 50;
      g.strokeStyle = rgba(0xffffff, 0.5 + r() * 0.5);
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(vx + Math.cos(a) * 6, vy + Math.sin(a) * 6);
      g.lineTo(vx + Math.cos(a) * l + J(2), vy + Math.sin(a) * l + J(2));
      g.stroke();
    }
    // wireframe city of cubes spiralling out of the vortex (ref: technical drawing)
    for (let i = 0; i < 90; i++) {
      const t = r();
      const a = -2.4 + t * 2.6 + (r() - 0.5) * 0.5;
      const dist = 120 + t * 520 + r() * 80;
      const cx = vx + Math.cos(a) * dist;
      const cy = vy + Math.sin(a) * dist * 0.9 + 120 * t;
      const s = 8 + t * 34 + r() * 10;
      const hgt = s * (0.6 + r() * 1.6);
      g.fillStyle = '#0e0c0e';
      g.strokeStyle = rgba(0xf3eee3, 0.85);
      g.lineWidth = 1.5;
      g.lineJoin = 'round';
      const X = cx + J(2.5);
      const Y = cy + J(2.5);
      g.beginPath();
      g.moveTo(X, Y - s * 0.5);
      g.lineTo(X + s, Y);
      g.lineTo(X + s, Y + hgt);
      g.lineTo(X, Y + hgt + s * 0.5);
      g.lineTo(X - s, Y + hgt);
      g.lineTo(X - s, Y);
      g.closePath();
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(X - s, Y);
      g.lineTo(X, Y + s * 0.5);
      g.lineTo(X + s, Y);
      g.moveTo(X, Y + s * 0.5);
      g.lineTo(X, Y + hgt + s * 0.5);
      g.stroke();
      if (r() < 0.5) {
        g.lineWidth = 0.8;
        for (let k = 1; k < 4; k++) {
          g.beginPath();
          g.moveTo(X - s, Y + (hgt * k) / 4);
          g.lineTo(X, Y + (hgt * k) / 4 + s * 0.5);
          g.stroke();
        }
      }
    }
  },
  volcano: (g, w, h) => {
    const r = rng(9);
    vgrad(g, w, h, [
      [0, 0x1c0000],
      [0.22, 0x4e0000],
      [0.55, 0xa00d24],
      [0.78, 0xe0401a],
      [1, 0xffa03a],
    ]);
    const sx = w * 0.5;
    const sy = h * 0.3;
    // smoke vortex around the sun
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2;
      const d = 200 + r() * 260;
      const x = sx + Math.cos(a) * d * 1.2;
      const y = sy + Math.sin(a) * d * 0.7;
      glow(g, x, y, 40 + r() * 60, r() < 0.6 ? 0x2a0000 : 0x6a0a10, 0.55);
    }
    glow(g, sx, sy, 380, 0xff6a1a, 0.7);
    // giant sun with bands
    const R = 175;
    g.save();
    g.beginPath();
    g.arc(sx, sy, R, 0, Math.PI * 2);
    g.clip();
    const sg = g.createRadialGradient(sx - 40, sy - 50, 10, sx, sy, R);
    sg.addColorStop(0, '#fff2b0');
    sg.addColorStop(0.45, '#ffb030');
    sg.addColorStop(1, '#e0401a');
    g.fillStyle = sg;
    g.fillRect(sx - R, sy - R, R * 2, R * 2);
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = rgba(0xa01010, 0.16 + r() * 0.14);
      g.lineWidth = 6 + r() * 12;
      g.beginPath();
      const yy = sy - R + (i + 0.5) * ((R * 2) / 9);
      g.moveTo(sx - R, yy);
      g.bezierCurveTo(sx - R / 2, yy - 14, sx + R / 2, yy + 14, sx + R, yy);
      g.stroke();
    }
    g.restore();
    g.strokeStyle = rgba(0x4e0000, 0.8);
    g.lineWidth = 4;
    g.beginPath();
    g.arc(sx, sy, R, 0, Math.PI * 2);
    g.stroke();
    // war banners on leaning poles (silhouettes)
    const banner = (x: number, lean: number, len: number, seed: number) => {
      const rr = rng(seed);
      const top = [x + Math.sin(lean) * len, h - Math.cos(lean) * len] as const;
      g.strokeStyle = rgba(0x1a0204, 1);
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(x, h + 20);
      g.lineTo(top[0], top[1]);
      g.stroke();
      g.fillStyle = rgba(0x1a0204, 1);
      g.beginPath();
      g.moveTo(top[0] - 7, top[1] + 6);
      g.lineTo(top[0] + Math.sin(lean) * 34, top[1] - Math.cos(lean) * 34);
      g.lineTo(top[0] + 7, top[1] + 6);
      g.fill();
      // tattered cloth hanging from a crossbar
      const bx = top[0] + Math.sin(lean) * -20;
      const by = top[1] + 30;
      const bw = 60 + rr() * 30;
      const bh = 120 + rr() * 90;
      g.fillStyle = rgba(rr() < 0.5 ? 0x22040a : 0x2e0612, 1);
      g.beginPath();
      g.moveTo(bx - 4, by);
      g.lineTo(bx + bw, by + 8);
      let yy = by + bh;
      g.lineTo(bx + bw + 8, yy * 0.98);
      for (let k = 0; k < 6; k++) {
        g.lineTo(bx + bw - (k + 0.5) * (bw / 6), yy + (rr() - 0.3) * 36);
        g.lineTo(bx + bw - (k + 1) * (bw / 6), yy - rr() * 22);
      }
      yy = by + bh * 0.6;
      g.closePath();
      g.fill();
      g.strokeStyle = rgba(0x1a0204, 1);
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(bx - 8, by);
      g.lineTo(bx + bw + 8, by + 8);
      g.stroke();
    };
    banner(w * 0.1, -0.22, 560, 1);
    banner(w * 0.2, 0.12, 470, 2);
    banner(w * 0.8, -0.1, 520, 3);
    banner(w * 0.9, 0.24, 600, 4);
    // spires (black silhouettes) along the horizon
    const spire = (x: number, hh: number, wd: number) => {
      g.fillStyle = rgba(0x140203, 1);
      g.beginPath();
      g.moveTo(x - wd, h);
      let y = h;
      let k = 0;
      while (y > h - hh) {
        y -= 20 + r() * 30;
        const ww = wd * (1 - (h - y) / hh);
        g.lineTo(x - ww - (k % 2 ? 6 : 0), y);
        k++;
      }
      g.lineTo(x, h - hh - 30);
      y = h - hh;
      while (y < h) {
        const ww = wd * (1 - (h - y) / hh);
        g.lineTo(x + ww + (k % 2 ? 6 : 0), y);
        y += 20 + r() * 30;
        k++;
      }
      g.lineTo(x + wd, h);
      g.closePath();
      g.fill();
    };
    for (let i = 0; i < 16; i++) spire(r() * w, 120 + r() * 300, 18 + r() * 30);
    // embers
    for (let i = 0; i < 120; i++) {
      g.fillStyle = rgba(r() < 0.5 ? 0xffc94a : 0xff6a1a, 0.5 + r() * 0.5);
      g.fillRect(r() * w, r() * h, 2 + r() * 2, 2 + r() * 2);
    }
  },
  ghost: (g, w, h) => {
    const r = rng(10);
    vgrad(g, w, h, [
      [0, 0x07081a],
      [0.4, 0x1e1640],
      [0.7, 0x3a2a6a],
      [1, 0x1c3a51],
    ]);
    stars(g, w, h, 120, 3, 0.5);
    // neon-rimmed moon
    glow(g, w * 0.74, h * 0.2, 160, 0xff2e88, 0.35);
    g.fillStyle = '#ece4ff';
    g.beginPath();
    g.arc(w * 0.74, h * 0.2, 62, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = rgba(0x00e5ff, 0.9);
    g.lineWidth = 3;
    g.beginPath();
    g.arc(w * 0.74, h * 0.2, 74, 0, Math.PI * 2);
    g.stroke();
    // skyline layers
    const skyline = (base: number, maxH: number, col: number, win: number, seed: number, signs: boolean) => {
      const rr = rng(seed);
      let x = -10;
      while (x < w) {
        const bw = 26 + rr() * 60;
        const bh = maxH * (0.35 + rr() * 0.65);
        const top = base - bh;
        g.fillStyle = rgba(col, 1);
        g.fillRect(x, top, bw, h - top);
        if (rr() < 0.4) {
          g.fillRect(x + bw * 0.4, top - 30 - rr() * 40, 3, 70);
          g.fillStyle = rgba(0xff3a3a, 1);
          g.beginPath();
          g.arc(x + bw * 0.4 + 1.5, top - 30 - 2, 3, 0, Math.PI * 2);
          g.fill();
        }
        for (let wy = top + 8; wy < h; wy += 10)
          for (let wx = x + 5; wx < x + bw - 6; wx += 8)
            if (rr() < win) {
              g.fillStyle = rgba(rr() < 0.7 ? 0xffd76a : rr() < 0.5 ? 0x7ff3ff : 0xff7ab8, 0.85);
              g.fillRect(wx, wy, 4, 5);
            }
        if (signs && rr() < 0.35) {
          const c = rr() < 0.5 ? 0xff2e88 : 0x00e5ff;
          const sw = bw * 0.7;
          const sy = top + 20 + rr() * 60;
          g.save();
          g.shadowColor = rgba(c, 1);
          g.shadowBlur = 16;
          g.strokeStyle = rgba(c, 1);
          g.lineWidth = 3;
          g.strokeRect(x + bw * 0.15, sy, sw, 24);
          g.fillStyle = rgba(c, 0.35);
          g.fillRect(x + bw * 0.15, sy, sw, 24);
          g.restore();
        }
        x += bw + 2 + rr() * 6;
      }
    };
    skyline(h * 0.66, 260, 0x2a2452, 0.12, 4, false);
    // fog band
    for (let i = 0; i < 6; i++) glow(g, r() * w, h * 0.66 + (r() - 0.5) * 60, 160, 0xc8d0ff, 0.15);
    skyline(h * 0.82, 300, 0x0f1324, 0.22, 5, true);
    // flying car light trails
    for (let i = 0; i < 9; i++) {
      const y = h * 0.3 + r() * h * 0.35;
      const x = r() * w;
      const l = 40 + r() * 120;
      const c = r() < 0.5 ? 0x00e5ff : 0xff2e88;
      g.save();
      g.shadowColor = rgba(c, 1);
      g.shadowBlur = 10;
      const grd = g.createLinearGradient(x, 0, x + l, 0);
      grd.addColorStop(0, rgba(c, 0));
      grd.addColorStop(1, rgba(c, 1));
      g.fillStyle = grd;
      g.fillRect(x, y, l, 2.5);
      g.restore();
    }
  },
  ice: (g, w, h) => {
    vgrad(g, w, h, [
      [0, 0x060e22],
      [0.45, 0x112850],
      [0.8, 0x23498a],
      [1, 0x4a7fb4],
    ]);
    stars(g, w, h, 220, 6, 0.75);
    paintAurora(g, w, h, 1);
    // ice peaks (faceted)
    const r = rng(12);
    for (let layer = 0; layer < 2; layer++) {
      let x = -40;
      const base = h * (layer ? 0.86 : 0.74);
      while (x < w + 40) {
        const pw = 60 + r() * 90;
        const ph = 100 + r() * 180 - layer * 40;
        const px = x + pw / 2;
        g.fillStyle = rgba(layer ? 0x8fc4e6 : 0x5f94c8, 1);
        g.beginPath();
        g.moveTo(x, h);
        g.lineTo(px, base - ph);
        g.lineTo(x + pw, h);
        g.closePath();
        g.fill();
        g.fillStyle = rgba(0xffffff, layer ? 0.55 : 0.35);
        g.beginPath();
        g.moveTo(px, base - ph);
        g.lineTo(px + pw * 0.18, base - ph * 0.5);
        g.lineTo(px - 4, base - ph * 0.4);
        g.closePath();
        g.fill();
        x += pw * 0.7;
      }
    }
  },
  ruins: (g, w, h) => {
    const r = rng(13);
    vgrad(g, w, h, [
      [0, 0x2020ff],
      [0.3, 0x00b8ff],
      [0.58, 0xff6ad8],
      [0.8, 0xffd060],
      [1, 0x60ffd0],
    ]);
    // psychedelic brush strokes swirling around the eye
    const ex = w * 0.5;
    const ey = h * 0.3;
    const cols = [0x00e5ff, 0xff2e88, 0xffe066, 0x7cff6a, 0x8a5cff, 0xffffff, 0x2020ff];
    g.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2;
      const d = 150 + r() * 360;
      const x = ex + Math.cos(a) * d * 1.3;
      const y = ey + Math.sin(a) * d * 0.75;
      const l = 30 + r() * 90;
      const ang = a + Math.PI / 2 + (r() - 0.5) * 0.8;
      g.strokeStyle = rgba(cols[Math.floor(r() * cols.length)], 0.55 + r() * 0.4);
      g.lineWidth = 4 + r() * 12;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(ang) * l * 0.5 + (r() - 0.5) * 20, y + Math.sin(ang) * l * 0.5, x + Math.cos(ang) * l, y + Math.sin(ang) * l);
      g.stroke();
    }
    // glowing clouds low
    for (let i = 0; i < 14; i++) glow(g, r() * w, h * 0.6 + r() * h * 0.35, 70 + r() * 80, r() < 0.5 ? 0xffc0f0 : 0xfff0a0, 0.55);
    // glitch slices (self-copy shifted)
    const [cc, c2] = canvas(w, h);
    c2.drawImage(g.canvas, 0, 0);
    for (let i = 0; i < 18; i++) {
      const y = r() * h;
      const sh = 4 + r() * 26;
      const dx = (r() - 0.5) * 70;
      g.drawImage(cc, 0, y, w, sh, dx, y, w, sh);
    }
    // scanlines
    g.fillStyle = rgba(0x000000, 0.12);
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1.5);
    // pixel confetti
    for (let i = 0; i < 160; i++) {
      g.fillStyle = rgba(cols[Math.floor(r() * cols.length)], 0.8);
      const s = Math.round(2 + r() * 6);
      g.fillRect(Math.round((r() * w) / s) * s, Math.round((r() * h) / s) * s, s, s);
    }
  },
  reef: (g, w, h) => {
    const r = rng(14);
    vgrad(g, w, h, [
      [0, 0x5fd6ff],
      [0.35, 0xb8f2ff],
      [0.7, 0xffd0ea],
      [1, 0xe0ccff],
    ]);
    // light rays
    g.save();
    g.translate(w * 0.5, -h * 0.1);
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * 0.5 + (i - 8) * 0.09 + (r() - 0.5) * 0.04;
      g.fillStyle = rgba(0xffffff, 0.14 + r() * 0.12);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a - 0.025) * h * 1.3, Math.sin(a - 0.025) * h * 1.3);
      g.lineTo(Math.cos(a + 0.025) * h * 1.3, Math.sin(a + 0.025) * h * 1.3);
      g.closePath();
      g.fill();
    }
    g.restore();
    // rainbow refraction bands
    const rb = [0xff7ab8, 0xffc94a, 0x7cffc4, 0x7fd8ff, 0xb59cff];
    rb.forEach((c, i) => {
      g.strokeStyle = rgba(c, 0.22);
      g.lineWidth = 26;
      g.beginPath();
      g.moveTo(-50, h * 0.55 + i * 26);
      g.bezierCurveTo(w * 0.3, h * 0.35 + i * 26, w * 0.7, h * 0.75 + i * 26, w + 50, h * 0.5 + i * 26);
      g.stroke();
    });
    // jellyfish
    for (let i = 0; i < 6; i++) {
      const x = w * 0.12 + r() * w * 0.76;
      const y = h * 0.12 + r() * h * 0.4;
      const s = 14 + r() * 18;
      const c = rb[Math.floor(r() * rb.length)];
      g.fillStyle = rgba(c, 0.6);
      g.strokeStyle = rgba(0x10243a, 0.5);
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y, s, Math.PI, 0);
      g.closePath();
      g.fill();
      g.stroke();
      g.strokeStyle = rgba(c, 0.7);
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.moveTo(x - s * 0.6 + k * s * 0.4, y);
        g.quadraticCurveTo(x - s * 0.6 + k * s * 0.4 + 6, y + s, x - s * 0.6 + k * s * 0.4, y + s * 2);
        g.stroke();
      }
    }
    // bubbles + sparkles
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = rgba(0xffffff, 0.5 + r() * 0.4);
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(r() * w, r() * h, 2 + r() * 9, 0, Math.PI * 2);
      g.stroke();
    }
    for (let i = 0; i < 30; i++) spark(g, r() * w, r() * h, 3 + r() * 6, rb[i % rb.length], 0.9);
  },
  cosmic: (g, w, h) => {
    const r = rng(15);
    vgrad(g, w, h, [
      [0, 0x05030c],
      [0.5, 0x140a2e],
      [1, 0x0b0618],
    ]);
    for (let i = 0; i < 26; i++) glow(g, r() * w, r() * h, 80 + r() * 160, [0xff2e88, 0x8a5cff, 0x00e5ff, 0x5a2aff][i % 4], 0.22 + r() * 0.18);
    stars(g, w, h, 420, 7);
    // spiral galaxy
    const gx = w * 0.3;
    const gy = h * 0.26;
    glow(g, gx, gy, 90, 0xfff0ff, 0.8);
    for (let arm = 0; arm < 2; arm++)
      for (let i = 0; i < 260; i++) {
        const t = i / 260;
        const a = arm * Math.PI + t * Math.PI * 3.2;
        const d = 8 + t * 150;
        const x = gx + Math.cos(a) * d + (r() - 0.5) * 14;
        const y = gy + Math.sin(a) * d * 0.45 + (r() - 0.5) * 8;
        g.fillStyle = rgba(r() < 0.5 ? 0xffffff : 0xc8b4ff, 0.8 * (1 - t) + 0.1);
        g.fillRect(x, y, 1.6, 1.6);
      }
    // ringed planet
    const px = w * 0.76;
    const py = h * 0.22;
    g.strokeStyle = rgba(0xffd0f0, 0.8);
    g.lineWidth = 5;
    g.beginPath();
    g.ellipse(px, py, 96, 22, -0.3, Math.PI, Math.PI * 2);
    g.stroke();
    const pg = g.createRadialGradient(px - 18, py - 18, 6, px, py, 56);
    pg.addColorStop(0, '#ffd0f0');
    pg.addColorStop(1, '#6a3ac8');
    g.fillStyle = pg;
    g.beginPath();
    g.arc(px, py, 54, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(px, py, 96, 22, -0.3, 0, Math.PI);
    g.stroke();
    g.fillStyle = '#9ff3ff';
    g.beginPath();
    g.arc(px - 130, py + 70, 12, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 28; i++) spark(g, r() * w, r() * h, 3 + r() * 6, 0xffffff, 0.9);
  },
};

function paintAurora(g: G2, w: number, h: number, alpha: number) {
  const ribbons: [number, number, number, number][] = [
    [h * 0.3, 0x7cffb2, 70, 0],
    [h * 0.24, 0x5ff0e0, 54, 1.7],
    [h * 0.38, 0xb08cff, 44, 3.1],
  ];
  for (const [base, col, amp, ph] of ribbons)
    for (let x = 0; x < w; x += 3) {
      const y = base + Math.sin(x * 0.006 + ph) * amp + Math.sin(x * 0.017 + ph * 2) * 18;
      const len = 90 + Math.sin(x * 0.02 + ph) * 50 + Math.sin(x * 0.05) * 20;
      const grd = g.createLinearGradient(0, y - len, 0, y);
      grd.addColorStop(0, rgba(col, 0));
      grd.addColorStop(0.75, rgba(col, 0.35 * alpha));
      grd.addColorStop(1, rgba(col, 0.6 * alpha));
      g.fillStyle = grd;
      g.fillRect(x, y - len, 3, len);
    }
}

/** standalone aurora ribbons (transparent) for the animated layer */
export function auroraTex(): Texture {
  return bake('aurora', 1024, 512, (g, w, h) => paintAurora(g, w, h * 1.6, 1), false);
}

/** rainbow brush iris for the glitch eye */
export function irisTex(): Texture {
  return bake(
    'glitch-iris',
    256,
    256,
    (g, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = rng(19);
      const cols = [0x00e5ff, 0x7cff6a, 0xffe066, 0xff9a3a, 0xff2e88, 0x8a5cff, 0x2020ff];
      for (let k = 0; k < 7; k++) {
        const rad = 124 - k * 13;
        g.fillStyle = rgba(cols[k], 1);
        g.beginPath();
        g.arc(cx, cy, rad, 0, Math.PI * 2);
        g.fill();
      }
      g.lineCap = 'round';
      for (let i = 0; i < 220; i++) {
        const a = r() * Math.PI * 2;
        const r0 = 30 + r() * 40;
        const r1 = r0 + 20 + r() * 70;
        g.strokeStyle = rgba(cols[Math.floor(r() * cols.length)], 0.8);
        g.lineWidth = 2 + r() * 4;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        g.lineTo(cx + Math.cos(a + 0.1) * r1, cy + Math.sin(a + 0.1) * r1);
        g.stroke();
      }
      g.fillStyle = '#05030a';
      g.beginPath();
      g.arc(cx, cy, 34, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath();
      g.arc(cx - 40, cy - 40, 12, 0, Math.PI * 2);
      g.fill();
      // clip to circle
      g.globalCompositeOperation = 'destination-in';
      g.beginPath();
      g.arc(cx, cy, 124, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = 'source-over';
    },
    false,
  );
}

/** cozy god-rays for home (additive) */
export function raysTex(): Texture {
  return bake(
    'sunrays',
    512,
    512,
    (g, w, h) => {
      const r = rng(23);
      g.translate(0, 0);
      for (let i = 0; i < 9; i++) {
        const a = 0.35 + i * 0.09 + (r() - 0.5) * 0.04;
        const wd = 0.02 + r() * 0.04;
        const grd = g.createLinearGradient(0, 0, Math.cos(a) * w, Math.sin(a) * h);
        grd.addColorStop(0, rgba(0xfff3c4, 0.5));
        grd.addColorStop(1, rgba(0xfff3c4, 0));
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a - wd) * w * 1.4, Math.sin(a - wd) * h * 1.4);
        g.lineTo(Math.cos(a + wd) * w * 1.4, Math.sin(a + wd) * h * 1.4);
        g.closePath();
        g.fill();
      }
    },
    false,
  );
}
