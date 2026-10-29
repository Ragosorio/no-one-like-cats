/**
 * Sky bubbles of the post-Parte III islands (data/postp3/islas.json), plugged into sky.ts's PAINT table. Each one is
 * baked once into the island's 1024² backdrop like the older dimensions (the edge dissolve and the paper seal for a
 * locked island come from sky.ts). Shapes only — no text, so the bake never depends on a web font being loaded.
 */
import { rgba, rng } from './bake';

type G2 = CanvasRenderingContext2D;

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
function star(g: G2, x: number, y: number, ro: number, ri: number, n = 5, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const rr = i % 2 ? ri : ro;
    if (i) g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
}
/** a flat iso box (top + two sides) with an ink rim */
function box(g: G2, x: number, y: number, s: number, top: number, left: number, right: number, ink: number, open = false) {
  const hw = s;
  const hh = s * 0.5;
  const d = s * 0.95;
  g.lineJoin = 'round';
  g.strokeStyle = rgba(ink, 0.85);
  g.lineWidth = Math.max(2, s * 0.06);
  // left side
  g.fillStyle = rgba(left, 1);
  g.beginPath();
  g.moveTo(x - hw, y);
  g.lineTo(x, y + hh);
  g.lineTo(x, y + hh + d);
  g.lineTo(x - hw, y + d);
  g.closePath();
  g.fill();
  g.stroke();
  // right side
  g.fillStyle = rgba(right, 1);
  g.beginPath();
  g.moveTo(x + hw, y);
  g.lineTo(x, y + hh);
  g.lineTo(x, y + hh + d);
  g.lineTo(x + hw, y + d);
  g.closePath();
  g.fill();
  g.stroke();
  // top (or the open flaps)
  g.fillStyle = rgba(open ? 0x4a2e14 : top, 1);
  g.beginPath();
  g.moveTo(x, y - hh);
  g.lineTo(x + hw, y);
  g.lineTo(x, y + hh);
  g.lineTo(x - hw, y);
  g.closePath();
  g.fill();
  g.stroke();
  if (open) {
    g.fillStyle = rgba(top, 1);
    for (const sgn of [-1, 1]) {
      g.beginPath();
      g.moveTo(x + sgn * hw, y);
      g.lineTo(x + sgn * hw * 1.6, y - hh * 1.4);
      g.lineTo(x + sgn * hw * 0.6, y - hh * 2.4);
      g.lineTo(x, y - hh);
      g.closePath();
      g.fill();
      g.stroke();
    }
  } else {
    // the tape across the top
    g.strokeStyle = rgba(0xc89a5a, 0.9);
    g.lineWidth = s * 0.16;
    g.beginPath();
    g.moveTo(x - hw * 0.5, y - hh * 0.5);
    g.lineTo(x + hw * 0.5, y + hh * 0.5);
    g.stroke();
  }
}

export const PAINT_POST: Record<string, (g: G2, w: number, h: number, f: number) => void> = {
  /** CARTÓN: the inside of a huge box — kraft walls, a tape seam across the sky, arrows, a stack of boxes */
  carton: (g, w, h) => {
    const r = rng(61);
    vgrad(g, w, h, [
      [0, 0xf2d6a2],
      [0.55, 0xe2b878],
      [1, 0xc89458],
    ]);
    // corrugation ghosts
    g.strokeStyle = rgba(0x8a5a2e, 0.12);
    g.lineWidth = 6;
    for (let x = -h; x < w; x += 28) {
      g.beginPath();
      g.moveTo(x, h);
      g.lineTo(x + h * 0.5, 0);
      g.stroke();
    }
    // a warm lamp coming in through the open flaps
    glow(g, w * 0.5, h * 0.12, w * 0.5, 0xfff4d6, 0.7);
    // the tape seam across the sky
    g.fillStyle = rgba(0xc89a5a, 0.6);
    g.save();
    g.translate(w * 0.5, h * 0.36);
    g.rotate(-0.12);
    g.fillRect(-w, -40, w * 2, 80);
    g.fillStyle = rgba(0xfff0d0, 0.35);
    g.fillRect(-w, -40, w * 2, 8);
    g.restore();
    // «this side up» arrows (red stamps)
    g.fillStyle = rgba(0xe8402e, 0.55);
    for (const [x, y, s] of [
      [0.18, 0.62, 1],
      [0.82, 0.58, 0.8],
    ]) {
      const bx = w * x;
      const by = h * y;
      for (const dx of [-26, 26]) {
        g.fillRect(bx + dx * s - 7 * s, by - 10 * s, 14 * s, 60 * s);
        g.beginPath();
        g.moveTo(bx + dx * s - 22 * s, by - 8 * s);
        g.lineTo(bx + dx * s, by - 44 * s);
        g.lineTo(bx + dx * s + 22 * s, by - 8 * s);
        g.closePath();
        g.fill();
      }
      g.fillRect(bx - 50 * s, by + 58 * s, 100 * s, 8 * s);
    }
    // stacks of boxes on the horizon
    const K = 0xd9a868;
    const L = 0xb07a42;
    const R = 0x8a5a2e;
    for (const [x, y, s, open] of [
      [0.12, 0.86, 70, false],
      [0.26, 0.9, 54, true],
      [0.12, 0.74, 50, false],
      [0.74, 0.88, 64, false],
      [0.88, 0.84, 80, true],
      [0.8, 0.72, 46, false],
    ] as [number, number, number, boolean][])
      box(g, w * x, h * y, s, K, L, R, 0x2a1a0e, open);
    // floating dust in the lamp light
    for (let i = 0; i < 80; i++) {
      g.fillStyle = rgba(0xfff4d6, 0.4 + r() * 0.5);
      g.beginPath();
      g.arc(r() * w, r() * h * 0.7, 1 + r() * 2, 0, Math.PI * 2);
      g.fill();
    }
  },
  /** TAPETE: the casino at night — dark green room, a spotlight, a marquee of bulbs, cards and chips in the air */
  felt: (g, w, h) => {
    const r = rng(67);
    vgrad(g, w, h, [
      [0, 0x06140d],
      [0.5, 0x0d3a24],
      [1, 0x1f6a40],
    ]);
    // spotlight cone
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, rgba(0xfff4c8, 0.35));
    grd.addColorStop(1, rgba(0xfff4c8, 0));
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(w * 0.46, 0);
    g.lineTo(w * 0.54, 0);
    g.lineTo(w * 0.8, h);
    g.lineTo(w * 0.2, h);
    g.closePath();
    g.fill();
    // marquee arc of bulbs
    for (let i = 0; i <= 26; i++) {
      const a = Math.PI * (1 + i / 26);
      const x = w * 0.5 + Math.cos(a) * w * 0.42;
      const y = h * 0.42 + Math.sin(a) * h * 0.3;
      glow(g, x, y, 22, 0xffc94a, 0.5);
      g.fillStyle = rgba(i % 2 ? 0xfff4c8 : 0xffc94a, 1);
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
    }
    // flying cards
    for (let i = 0; i < 9; i++) {
      const x = r() * w;
      const y = h * 0.2 + r() * h * 0.6;
      g.save();
      g.translate(x, y);
      g.rotate((r() - 0.5) * 1.4);
      g.fillStyle = rgba(0xfffaf0, 0.95);
      g.strokeStyle = rgba(0x0c1a12, 0.8);
      g.lineWidth = 2.5;
      g.beginPath();
      g.roundRect(-20, -28, 40, 56, 5);
      g.fill();
      g.stroke();
      g.fillStyle = rgba(i % 2 ? 0xc8102e : 0x171317, 1);
      star(g, 0, 0, 10, 4, 4, 0);
      g.fill();
      g.restore();
    }
    // chips
    for (let i = 0; i < 12; i++) {
      const x = r() * w;
      const y = h * 0.15 + r() * h * 0.75;
      const s = 10 + r() * 8;
      g.save();
      g.translate(x, y);
      g.scale(1, 0.5 + r() * 0.5);
      g.fillStyle = rgba([0xc8102e, 0x1f5fbf, 0x2fa860, 0xffc94a][i % 4], 1);
      g.beginPath();
      g.arc(0, 0, s, 0, Math.PI * 2);
      g.fill();
      g.setLineDash([4, 4]);
      g.strokeStyle = rgba(0xffffff, 0.9);
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 0, s - 3, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.restore();
    }
    // gold glints
    g.fillStyle = rgba(0xffd77a, 0.85);
    for (let i = 0; i < 40; i++) {
      star(g, r() * w, r() * h, 2 + r() * 4, 1, 4, 0);
      g.fill();
    }
  },
  /** TALAVERA: a turquoise afternoon, a sun with cobalt-and-yellow rays, papel picado across the sky */
  talavera: (g, w, h) => {
    const r = rng(71);
    vgrad(g, w, h, [
      [0, 0x3ab0d8],
      [0.6, 0x9ee4f0],
      [1, 0xfff0d0],
    ]);
    // the sun: a hand-painted talavera plate
    const sx = w * 0.5;
    const sy = h * 0.5;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.fillStyle = rgba(i % 2 ? 0x2a52b8 : 0xf2c14e, 0.9);
      g.beginPath();
      g.moveTo(sx + Math.cos(a - 0.12) * 96, sy + Math.sin(a - 0.12) * 96);
      g.lineTo(sx + Math.cos(a) * 150, sy + Math.sin(a) * 150);
      g.lineTo(sx + Math.cos(a + 0.12) * 96, sy + Math.sin(a + 0.12) * 96);
      g.closePath();
      g.fill();
    }
    g.fillStyle = rgba(0xf5f0e2, 1);
    g.strokeStyle = rgba(0x1a2440, 0.9);
    g.lineWidth = 5;
    g.beginPath();
    g.arc(sx, sy, 96, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.strokeStyle = rgba(0x2a52b8, 1);
    g.lineWidth = 6;
    g.beginPath();
    g.arc(sx, sy, 78, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = rgba(0x2a52b8, 0.95);
    for (let p = 0; p < 8; p++) {
      g.save();
      g.translate(sx, sy);
      g.rotate((p * Math.PI) / 4);
      g.beginPath();
      g.ellipse(0, -36, 11, 24, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.fillStyle = rgba(0xf2c14e, 1);
    g.beginPath();
    g.arc(sx, sy, 16, 0, Math.PI * 2);
    g.fill();
    // papel picado: three garlands of cut-paper flags
    const cols = [0xff4f8b, 0xffc94a, 0x2fbf8a, 0x8a5cff, 0xff7a2e, 0x2a9ae8];
    for (let row = 0; row < 3; row++) {
      const y0 = h * (0.12 + row * 0.12);
      const sag = 40 + row * 14;
      const n = 9;
      g.strokeStyle = rgba(0x1a2440, 0.7);
      g.lineWidth = 2;
      g.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = w * 0.08 + t * w * 0.84;
        const y = y0 + Math.sin(t * Math.PI) * sag;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const x = w * 0.08 + t * w * 0.84;
        const y = y0 + Math.sin(t * Math.PI) * sag;
        const fw = 34;
        const fh = 44;
        g.fillStyle = rgba(cols[(i + row * 2) % cols.length], 0.95);
        g.beginPath();
        g.moveTo(x - fw / 2, y);
        g.lineTo(x + fw / 2, y);
        g.lineTo(x + fw / 2, y + fh);
        for (let k = 4; k >= 0; k--) g.lineTo(x - fw / 2 + (k * fw) / 4, y + fh - (k % 2 ? 6 : 0));
        g.closePath();
        g.fill();
        // the cut-outs
        g.fillStyle = rgba(0x9ee4f0, 0.9);
        g.beginPath();
        g.arc(x, y + fh * 0.45, 6, 0, Math.PI * 2);
        g.fill();
        for (const dx of [-9, 9]) {
          g.beginPath();
          g.moveTo(x + dx, y + 8);
          g.lineTo(x + dx + 3, y + 14);
          g.lineTo(x + dx - 3, y + 14);
          g.closePath();
          g.fill();
        }
      }
    }
    // a few soft clouds low
    g.fillStyle = rgba(0xffffff, 0.8);
    for (let i = 0; i < 6; i++) {
      const x = r() * w;
      const y = h * 0.7 + r() * h * 0.2;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(x + (k - 1.5) * 26, y + Math.sin(k * 2) * 6, 22 + r() * 10, 0, Math.PI * 2);
        g.fill();
      }
    }
  },
  /** TEJIDO: a patchwork quilt sky, stitched squares, a crochet sun and threads hanging down */
  yarn: (g, w, h) => {
    const r = rng(73);
    const cols = [0xf4c9d2, 0xf4e6d4, 0xcfe4da, 0xf6dca0, 0xe8b8c8, 0xd8e8f0];
    const S = 128;
    for (let y = 0; y < h; y += S)
      for (let x = 0; x < w; x += S) {
        g.fillStyle = rgba(cols[Math.floor(r() * cols.length)], 1);
        g.fillRect(x, y, S, S);
        // a little motif per patch
        const m = Math.floor(r() * 3);
        g.fillStyle = rgba(0xffffff, 0.45);
        if (m === 0)
          for (let k = 0; k < 9; k++) {
            g.beginPath();
            g.arc(x + 20 + (k % 3) * 44, y + 20 + Math.floor(k / 3) * 44, 6, 0, Math.PI * 2);
            g.fill();
          }
        else if (m === 1)
          for (let k = 0; k < 4; k++) g.fillRect(x, y + 12 + k * 30, S, 10);
        else {
          g.beginPath();
          g.moveTo(x + S / 2, y + 22);
          g.lineTo(x + S - 22, y + S / 2);
          g.lineTo(x + S / 2, y + S - 22);
          g.lineTo(x + 22, y + S / 2);
          g.closePath();
          g.fill();
        }
        // stitching
        g.setLineDash([8, 6]);
        g.strokeStyle = rgba(0x3a2430, 0.35);
        g.lineWidth = 2;
        g.strokeRect(x + 6, y + 6, S - 12, S - 12);
        g.setLineDash([]);
      }
    // crochet sun (granny circle)
    const sx = w * 0.62;
    const sy = h * 0.3;
    for (let ring = 5; ring >= 0; ring--) {
      g.fillStyle = rgba([0xf2c14e, 0xf4e6d4, 0xe8a2b2, 0xf2c14e, 0xf4e6d4, 0xe8a2b2][ring], 1);
      g.beginPath();
      g.arc(sx, sy, 24 + ring * 18, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = rgba(0x3a2430, 0.35);
      g.lineWidth = 2;
      g.setLineDash([5, 5]);
      g.stroke();
      g.setLineDash([]);
    }
    // threads hanging from the top, each with a pompom
    for (let i = 0; i < 7; i++) {
      const x = w * (0.08 + i * 0.14) + (r() - 0.5) * 30;
      const l = h * (0.25 + r() * 0.35);
      const c = [0xe8a2b2, 0xf2c14e, 0x8fb8a8, 0xf4e6d4][i % 4];
      g.strokeStyle = rgba(c, 1);
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x, 0);
      g.bezierCurveTo(x + 20, l * 0.3, x - 20, l * 0.7, x, l);
      g.stroke();
      g.fillStyle = rgba(c, 1);
      g.beginPath();
      g.arc(x, l + 10, 14, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = rgba(0x3a2430, 0.4);
      g.lineWidth = 2;
      g.stroke();
    }
  },
  /** SIESTA: a deep blue night, a night-light crescent moon, a star mobile, sleepy clouds and floating Zs (drawn) */
  pillow: (g, w, h) => {
    const r = rng(79);
    vgrad(g, w, h, [
      [0, 0x1c1c54],
      [0.55, 0x3a3a8a],
      [1, 0x8a7cc8],
    ]);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = rgba(r() < 0.8 ? 0xffffff : 0xfff4c8, 0.4 + r() * 0.6);
      g.beginPath();
      g.arc(r() * w, r() * h * 0.75, 0.6 + r() * r() * 2.4, 0, Math.PI * 2);
      g.fill();
    }
    // the moon (a night-light: warm glow, soft crescent)
    const mx = w * 0.7;
    const my = h * 0.3;
    glow(g, mx, my, 220, 0xffe9a8, 0.45);
    g.fillStyle = rgba(0xfff4c8, 1);
    g.beginPath();
    g.arc(mx, my, 84, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.arc(mx + 40, my - 26, 76, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    // the moon's sleeping face (closed eye + a nightcap tip)
    g.strokeStyle = rgba(0x2a2050, 0.8);
    g.lineWidth = 4;
    g.beginPath();
    g.arc(mx - 44, my + 4, 10, 0.2, Math.PI - 0.2);
    g.stroke();
    // the mobile: a bar with hanging stars
    const bx = w * 0.3;
    const by = h * 0.14;
    g.strokeStyle = rgba(0xf4f0ff, 0.8);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(bx, 0);
    g.lineTo(bx, by);
    g.moveTo(bx - 140, by);
    g.lineTo(bx + 140, by);
    g.stroke();
    for (let i = 0; i < 5; i++) {
      const x = bx - 140 + i * 70;
      const l = 60 + ((i * 37) % 70);
      g.strokeStyle = rgba(0xf4f0ff, 0.6);
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, by);
      g.lineTo(x, by + l);
      g.stroke();
      g.fillStyle = rgba(i % 2 ? 0xffe066 : 0xfff4c8, 1);
      star(g, x, by + l + 18, 20, 9);
      g.fill();
      g.strokeStyle = rgba(0x2a2050, 0.7);
      g.lineWidth = 2.5;
      g.stroke();
    }
    // sleepy clouds low
    for (let i = 0; i < 7; i++) {
      const x = r() * w;
      const y = h * 0.68 + r() * h * 0.25;
      g.fillStyle = rgba(0xe7e1f7, 0.85);
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        g.arc(x + (k - 2) * 28, y + Math.sin(k * 1.9) * 8, 26 + r() * 12, 0, Math.PI * 2);
        g.fill();
      }
    }
    // floating Zs (strokes)
    g.strokeStyle = rgba(0xf4f0ff, 0.7);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const [x, y, s] of [
      [0.16, 0.5, 26],
      [0.22, 0.42, 18],
      [0.26, 0.36, 12],
    ]) {
      g.lineWidth = s * 0.22;
      g.beginPath();
      g.moveTo(w * x - s / 2, h * y - s / 2);
      g.lineTo(w * x + s / 2, h * y - s / 2);
      g.lineTo(w * x - s / 2, h * y + s / 2);
      g.lineTo(w * x + s / 2, h * y + s / 2);
      g.stroke();
    }
  },
};
