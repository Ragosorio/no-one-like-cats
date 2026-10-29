/**
 * Canvas painters for the post-Parte III islands (data/postp3/islas.json): CARTÓN, TAPETE, TALAVERA, TEJIDO and SIESTA.
 * Plugged into bake.ts's tables (patterns 512×256 iso-aligned, rock 256×256, lagoon 512×256, falls 64×256). Drawn once
 * into small tileable textures like every other dimension — no per-frame drawing. Self-contained (no import of bake.ts).
 */
type G2 = CanvasRenderingContext2D;

function rgba(c: number, a = 1) {
  return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
}
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
/** draw at the 9 torus copies so the texture tiles seamlessly */
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
/**
 * Iso lattice on the 512×256 torus: p = i·u + j·v with u = (64/k, 32/k) along gx and v = (−64/k, 32/k) along gy
 * (k = subdivisions per tile). Every point that lands near the canvas is visited (its torus twins come for free).
 */
function isoLattice(w: number, h: number, k: number, fn: (x: number, y: number, i: number, j: number) => void, pad = 24) {
  const ux = 64 / k;
  const uy = 32 / k;
  const n = Math.ceil((w + h * 2) / Math.min(ux, uy)) + 4;
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const x = (i - j) * ux;
      const y = (i + j) * uy;
      if (x < -pad || x > w + pad || y < -pad || y > h + pad) continue;
      fn(x, y, i, j);
    }
}
/** a straight line of slope ±1/2 across the torus (it wraps exactly: 512 wide rises 256) */
function isoLine(g: G2, w: number, h: number, c: number, slope: 1 | -1) {
  g.beginPath();
  if (slope === 1) {
    g.moveTo(-w, c - h);
    g.lineTo(w * 2, c + h * 2);
  } else {
    g.moveTo(-w, c + h);
    g.lineTo(w * 2, c - h * 2);
  }
  g.stroke();
}

// =====================================================================================  PATTERNS (land overlay)
export const PAT_POST = {
  /** CARTÓN: corrugated flutes, kraft fibres, a strip of tape, red «this side up» arrows and a FRÁGIL box stamp */
  corrugated: (g: G2, w: number, h: number) => {
    const r = rng(1313);
    g.lineCap = 'round';
    // flutes: thin light/dark pairs along gx
    for (let c = 0; c < h; c += 16) {
      g.strokeStyle = rgba(0x7a4e24, 0.16);
      g.lineWidth = 2;
      isoLine(g, w, h, c, 1);
      g.strokeStyle = rgba(0xf3dcae, 0.22);
      g.lineWidth = 1.4;
      isoLine(g, w, h, c + 4, 1);
    }
    // kraft fibres
    for (let i = 0; i < 160; i++) {
      const x = r() * w;
      const y = r() * h;
      const a = r() * Math.PI;
      const l = 2 + r() * 6;
      g.strokeStyle = rgba(r() < 0.5 ? 0x8a5a2e : 0xf0d8a8, 0.35);
      g.lineWidth = 1;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.moveTo(ox + x, oy + y);
        g.lineTo(ox + x + Math.cos(a) * l, oy + y + Math.sin(a) * l * 0.5);
        g.stroke();
      });
    }
    // packing tape along gy (translucent, with a glossy edge)
    g.strokeStyle = rgba(0xc89a5a, 0.55);
    g.lineWidth = 26;
    isoLine(g, w, h, 96, -1);
    g.strokeStyle = rgba(0xfff0d0, 0.35);
    g.lineWidth = 3;
    isoLine(g, w, h, 86, -1);
    g.strokeStyle = rgba(0x7a4e24, 0.3);
    g.lineWidth = 1.5;
    isoLine(g, w, h, 109, -1);
    // red stamps: ↑↑ arrows and a FRÁGIL box (squashed on the ground)
    const stamps: [number, number, number][] = [
      [120, 190, 0],
      [380, 60, 1],
      [300, 200, 0],
    ];
    for (const [x, y, kind] of stamps)
      tiled(w, h, (ox, oy) => {
        g.save();
        g.translate(ox + x, oy + y);
        g.scale(1, 0.5);
        g.rotate(-0.46);
        g.strokeStyle = rgba(0xe8402e, 0.55);
        g.fillStyle = rgba(0xe8402e, 0.55);
        g.lineWidth = 3;
        if (kind === 0) {
          for (const dx of [-12, 12]) {
            g.beginPath();
            g.moveTo(dx, 16);
            g.lineTo(dx, -6);
            g.stroke();
            g.beginPath();
            g.moveTo(dx - 9, -4);
            g.lineTo(dx, -18);
            g.lineTo(dx + 9, -4);
            g.closePath();
            g.fill();
          }
          g.fillRect(-24, 20, 48, 3);
        } else {
          g.strokeRect(-30, -16, 60, 32);
          g.strokeRect(-25, -11, 50, 22);
          // a glass with a crack (the international «fragile»)
          g.beginPath();
          g.moveTo(-8, -7);
          g.lineTo(8, -7);
          g.lineTo(5, 3);
          g.lineTo(-5, 3);
          g.closePath();
          g.moveTo(0, 3);
          g.lineTo(0, 8);
          g.moveTo(-5, 8);
          g.lineTo(5, 8);
          g.moveTo(-2, -7);
          g.lineTo(1, -2);
          g.lineTo(-1, 1);
          g.stroke();
        }
        g.restore();
      });
  },
  /** TAPETE: felt fuzz, a gold chalk betting grid, faint card suits and two chalk arcs */
  felt: (g: G2, w: number, h: number) => {
    const r = rng(1414);
    for (let i = 0; i < 700; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(r() < 0.5 ? 0x0f5a34 : 0x3aa86a, 0.35);
      tiled(w, h, (ox, oy) => g.fillRect(ox + x, oy + y, 1.4, 1.4));
    }
    // the betting grid (every 2 tiles), double gold chalk
    g.lineCap = 'round';
    for (const slope of [1, -1] as const)
      for (let c = 0; c < h; c += 64) {
        g.strokeStyle = rgba(0xffd77a, 0.42);
        g.lineWidth = 2.2;
        isoLine(g, w, h, c, slope);
        g.strokeStyle = rgba(0xffd77a, 0.18);
        g.lineWidth = 1.2;
        isoLine(g, w, h, c + 6, slope);
      }
    // suits, squashed on the felt
    const suit = (kind: number) => {
      g.beginPath();
      if (kind === 0) {
        // heart
        g.moveTo(0, 10);
        g.bezierCurveTo(-16, -2, -10, -14, 0, -6);
        g.bezierCurveTo(10, -14, 16, -2, 0, 10);
      } else if (kind === 1) {
        // diamond
        g.moveTo(0, -12);
        g.lineTo(9, 0);
        g.lineTo(0, 12);
        g.lineTo(-9, 0);
        g.closePath();
      } else if (kind === 2) {
        // spade
        g.moveTo(0, -12);
        g.bezierCurveTo(16, 0, 10, 12, 0, 4);
        g.bezierCurveTo(-10, 12, -16, 0, 0, -12);
        g.moveTo(-5, 12);
        g.lineTo(0, 2);
        g.lineTo(5, 12);
        g.closePath();
      } else {
        // club
        g.arc(0, -6, 5.5, 0, Math.PI * 2);
        g.moveTo(-5 + 5.5, 2);
        g.arc(-5, 2, 5.5, 0, Math.PI * 2);
        g.moveTo(5 + 5.5, 2);
        g.arc(5, 2, 5.5, 0, Math.PI * 2);
        g.moveTo(-3, 12);
        g.lineTo(0, 2);
        g.lineTo(3, 12);
        g.closePath();
      }
      g.fill();
    };
    // one suit per 2×2-tile cell, picked by the lattice parity so every torus twin agrees (no seams)
    isoLattice(w, h, 0.5, (x, y, i, j) => {
      const k = (((i % 2) + 2) % 2) * 2 + (((j % 2) + 2) % 2);
      g.save();
      g.translate(x, y + 32);
      g.scale(1.3, 0.65);
      g.fillStyle = rgba(k % 2 ? 0x3aa86a : 0x0f5a34, 0.4);
      suit(k);
      g.restore();
    });
    // chalk arcs
    g.strokeStyle = rgba(0xffffff, 0.22);
    g.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const x = r() * w;
      const y = r() * h;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.ellipse(ox + x, oy + y, 70, 35, 0, Math.PI * 0.1, Math.PI * 0.9);
        g.stroke();
      });
    }
  },
  /** TALAVERA: glazed quarter-tiles with grout, a cobalt four-petal flower each, yellow hearts, corner blooms */
  tiles: (g: G2, w: number, h: number) => {
    const r = rng(1515);
    // grout on the half-tile lattice
    g.lineCap = 'round';
    for (const slope of [1, -1] as const)
      for (let c = 0; c < h; c += 16) {
        g.strokeStyle = rgba(0xb8b0a0, 0.55);
        g.lineWidth = 1.6;
        isoLine(g, w, h, c, slope);
      }
    // a motif per quarter-tile (centres sit between the grout lines)
    isoLattice(w, h, 2, (x, y, i, j) => {
      const cx = x;
      const cy = y + 16;
      const alt = (i + j) & 1;
      g.save();
      g.translate(cx, cy);
      g.scale(1, 0.5);
      // corner blooms (meet the neighbours' into circles)
      g.fillStyle = rgba(0x2a52b8, 0.7);
      for (const [dx, dy] of [
        [0, -22],
        [22, 0],
        [0, 22],
        [-22, 0],
      ]) {
        g.beginPath();
        g.arc(dx, dy, 6, 0, Math.PI * 2);
        g.fill();
      }
      // the flower
      g.fillStyle = rgba(alt ? 0x2a52b8 : 0x1e3f94, 0.85);
      for (let p = 0; p < 4; p++) {
        g.save();
        g.rotate((p * Math.PI) / 2 + Math.PI / 4);
        g.beginPath();
        g.ellipse(0, -8, 4.5, 8, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      g.fillStyle = rgba(alt ? 0xf2c14e : 0xe8742e, 0.95);
      g.beginPath();
      g.arc(0, 0, 3.6, 0, Math.PI * 2);
      g.fill();
      g.restore();
    });
    // a few hand-painted wobbles of glaze
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(0xffffff, 0.35);
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.ellipse(ox + x, oy + y, 3 + r() * 4, 1.5, 0, 0, Math.PI * 2);
        g.fill();
      });
    }
  },
  /** TEJIDO: stockinette — columns of V stitches with cream and mustard stripes in the rose */
  knit: (g: G2, w: number, h: number) => {
    isoLattice(w, h, 4, (x, y, i, j) => {
      const band = ((i % 8) + 8) % 8;
      const col = band === 2 ? 0xf4e6d4 : band === 3 ? 0xf2c14e : band === 6 ? 0xf4e6d4 : 0xd98698;
      const a = band === 2 || band === 3 || band === 6 ? 0.85 : 0.55;
      g.fillStyle = rgba(col, a);
      g.strokeStyle = rgba(0x3a2430, 0.22);
      g.lineWidth = 0.8;
      for (const s of [-1, 1]) {
        g.save();
        g.translate(x + s * 3.6, y + 8);
        g.rotate(s * 0.55);
        g.beginPath();
        g.ellipse(0, 0, 3, 6, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.restore();
      }
    });
    // a little fluff
    const r = rng(1616);
    for (let i = 0; i < 70; i++) {
      const x = r() * w;
      const y = r() * h;
      g.strokeStyle = rgba(0xffffff, 0.35);
      g.lineWidth = 1;
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.arc(ox + x, oy + y, 2 + r() * 2, 0, Math.PI * 1.2);
        g.stroke();
      });
    }
  },
  /** SIESTA: diamond tufting — puffy cells, dashed stitching, a button at every crossing, a few embroidered stars */
  quilt: (g: G2, w: number, h: number) => {
    // puff highlight per cell (half-tile diamonds)
    isoLattice(w, h, 2, (x, y) => {
      const cy = y + 16;
      g.save();
      g.translate(x, cy);
      g.scale(1, 0.5);
      const grd = g.createRadialGradient(-4, -6, 0, 0, 0, 30);
      grd.addColorStop(0, rgba(0xffffff, 0.55));
      grd.addColorStop(0.7, rgba(0xffffff, 0.08));
      grd.addColorStop(1, rgba(0x7464b0, 0.16));
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(0, -32);
      g.lineTo(32, 0);
      g.lineTo(0, 32);
      g.lineTo(-32, 0);
      g.closePath();
      g.fill();
      g.restore();
    });
    // stitching
    g.setLineDash([5, 4]);
    g.lineCap = 'round';
    for (const slope of [1, -1] as const)
      for (let c = 0; c < h; c += 32) {
        g.strokeStyle = rgba(0x7464b0, 0.45);
        g.lineWidth = 1.4;
        isoLine(g, w, h, c, slope);
      }
    g.setLineDash([]);
    // buttons on the crossings
    isoLattice(w, h, 2, (x, y) => {
      g.fillStyle = rgba(0x7464b0, 0.35);
      g.beginPath();
      g.ellipse(x + 1, y + 1.5, 5, 3, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = rgba(0xfff4c8, 0.95);
      g.beginPath();
      g.ellipse(x, y, 4.2, 2.6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = rgba(0x7464b0, 0.6);
      g.fillRect(x - 1.8, y - 0.6, 1.2, 1.2);
      g.fillRect(x + 0.6, y - 0.6, 1.2, 1.2);
    });
    const r = rng(1717);
    for (let i = 0; i < 10; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(0xffe066, 0.7);
      tiled(w, h, (ox, oy) => star4(g, ox + x, oy + y, 3 + r() * 2));
    }
  },
};

// =====================================================================================  ROCK (underside)
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
export const ROCK_POST = {
  /** torn cardboard: the corrugated core shows as a wave between two liners */
  carton: (g: G2, w: number, h: number) => {
    g.lineCap = 'round';
    for (let y = 0; y < h; y += 32) {
      g.strokeStyle = rgba(0x4a2e14, 0.5);
      g.lineWidth = 2;
      for (const yy of [y + 4, y + 26]) {
        g.beginPath();
        g.moveTo(0, yy);
        g.lineTo(w, yy);
        g.stroke();
      }
      g.strokeStyle = rgba(0xf0d8a8, 0.55);
      g.lineWidth = 2.2;
      g.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const yy = y + 15 + Math.sin((x / w) * Math.PI * 2 * 16) * 9;
        if (x === 0) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.stroke();
    }
  },
  /** the table's mahogany: wood grain and brass rivets */
  felt: (g: G2, w: number, h: number) => {
    const r = rng(1818);
    strata(g, w, h, r, 0x2a0e06, 0.45, 12);
    strata(g, w, h, r, 0xa0603a, 0.25, 30);
    for (let i = 0; i < 8; i++) {
      const x = r() * w;
      const y = r() * h;
      tiled(w, h, (ox, oy) => {
        g.fillStyle = rgba(0xd8b25a, 0.9);
        g.beginPath();
        g.arc(ox + x, oy + y, 3.4, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = rgba(0xfff0c0, 0.8);
        g.beginPath();
        g.arc(ox + x - 1, oy + y - 1, 1.2, 0, Math.PI * 2);
        g.fill();
      });
    }
  },
  /** terracotta bricks with pale mortar */
  talavera: (g: G2, w: number, h: number) => {
    const r = rng(1919);
    g.strokeStyle = rgba(0xf3dcb4, 0.45);
    g.lineWidth = 2;
    for (let row = 0, y = 0; y < h; row++, y += 22) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
      for (let x = (row % 2) * 24; x < w; x += 48) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 22);
        g.stroke();
      }
    }
    for (let i = 0; i < 30; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(r() < 0.5 ? 0x5a2210 : 0xe08a5a, 0.3);
      tiled(w, h, (ox, oy) => g.fillRect(ox + x, oy + y, 4 + r() * 6, 2 + r() * 3));
    }
  },
  /** ribbing: vertical knit columns */
  yarn: (g: G2, w: number, h: number) => {
    for (let x = 0; x < w; x += 16) {
      g.fillStyle = rgba(0x3a2430, 0.18);
      g.fillRect(x + 12, 0, 4, h);
      for (let y = 0; y < h; y += 12)
        for (const s of [-1, 1]) {
          g.save();
          g.translate(x + 6 + s * 2.6, y + 6);
          g.rotate(s * 0.5);
          g.fillStyle = rgba(0xc8e0d4, 0.4);
          g.beginPath();
          g.ellipse(0, 0, 2.6, 5, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
        }
    }
  },
  /** a cloud underneath: soft puffs */
  pillow: (g: G2, w: number, h: number) => {
    const r = rng(2020);
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 14 + r() * 26;
      tiled(w, h, (ox, oy) => {
        const grd = g.createRadialGradient(ox + x - rad * 0.3, oy + y - rad * 0.4, 0, ox + x, oy + y, rad);
        grd.addColorStop(0, rgba(0xffffff, 0.75));
        grd.addColorStop(0.75, rgba(0xffffff, 0.15));
        grd.addColorStop(1, rgba(0x7464b0, 0.18));
        g.fillStyle = grd;
        g.beginPath();
        g.arc(ox + x, oy + y, rad, 0, Math.PI * 2);
        g.fill();
      });
    }
  },
};

// =====================================================================================  LAGOON overlays
function crests(g: G2, w: number, h: number, f: number, n: number, color: number, alpha: number, seed = 51) {
  const r = rng(seed);
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
}
export const LAG_POST = {
  carton: (g: G2, w: number, h: number, f: number) => {
    crests(g, w, h, f, 26, 0xffffff, 0.6, 52);
    // little paper boats
    const r = rng(2121);
    for (let i = 0; i < 4; i++) {
      const x = r() * w + f * 3;
      const y = r() * h;
      tiled(w, h, (ox, oy) => {
        g.fillStyle = rgba(0xf6ead2, 0.95);
        g.strokeStyle = rgba(0x2a1a0e, 0.6);
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(ox + x - 9, oy + y);
        g.lineTo(ox + x + 9, oy + y);
        g.lineTo(ox + x + 5, oy + y + 4);
        g.lineTo(ox + x - 5, oy + y + 4);
        g.closePath();
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(ox + x - 4, oy + y);
        g.lineTo(ox + x, oy + y - 9);
        g.lineTo(ox + x + 4, oy + y);
        g.closePath();
        g.fill();
        g.stroke();
      });
    }
  },
  felt: (g: G2, w: number, h: number, f: number) => {
    const r = rng(2222);
    const j = rng(31 + f * 5);
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = rgba(0xffd77a, 0.55 + j() * 0.4);
      tiled(w, h, (ox, oy) => star4(g, ox + x, oy + y, 1.5 + j() * 3));
    }
    crests(g, w, h, f, 12, 0x3aa86a, 0.5, 53);
  },
  talavera: (g: G2, w: number, h: number, f: number) => crests(g, w, h, f, 30, 0xffffff, 0.7, 54),
  yarn: (g: G2, w: number, h: number, f: number) => crests(g, w, h, f, 28, 0xf4e6d4, 0.75, 55),
  pillow: (g: G2, w: number, h: number) => {
    const r = rng(2323);
    for (let i = 0; i < 70; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 0.6 + r() * r() * 2.2;
      g.fillStyle = rgba(pick(r, [0xffffff, 0xfff4c8, 0xc8c0ff]), 0.6 + r() * 0.4);
      tiled(w, h, (ox, oy) => {
        g.beginPath();
        g.arc(ox + x, oy + y, s, 0, Math.PI * 2);
        g.fill();
      });
    }
    g.fillStyle = rgba(0xfff4c8, 0.9);
    for (let i = 0; i < 6; i++) {
      const x = r() * w;
      const y = r() * h;
      tiled(w, h, (ox, oy) => star4(g, ox + x, oy + y, 3));
    }
  },
};

// =====================================================================================  FALLS (64×256, tile vertically)
export const FALL_POST = {
  /** shredded kraft and packing paper, strip by strip */
  paper: (g: G2, w: number, h: number) => {
    const r = rng(2424);
    for (let i = 0; i < 26; i++) {
      const x = 8 + r() * (w - 16);
      const y = r() * h;
      const l = 14 + r() * 26;
      const wd = 4 + r() * 5;
      const rot = (r() - 0.5) * 0.4;
      const c = pick(r, [0xf0dcb4, 0xd9a868, 0xf6ead2, 0xead0a0]);
      for (const oy of [-h, 0, h]) {
        g.save();
        g.translate(x, y + oy);
        g.rotate(rot);
        g.fillStyle = rgba(c, 0.95);
        g.fillRect(-wd / 2, 0, wd, l);
        g.strokeStyle = rgba(0x2a1a0e, 0.45);
        g.lineWidth = 1;
        g.strokeRect(-wd / 2, 0, wd, l);
        g.restore();
      }
    }
  },
  /** chips and gold coins pouring off the table */
  chips: (g: G2, w: number, h: number) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, rgba(0xffd77a, 0));
    grd.addColorStop(0.5, rgba(0xffd77a, 0.22));
    grd.addColorStop(1, rgba(0xffd77a, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    const r = rng(2525);
    for (let i = 0; i < 22; i++) {
      const x = 10 + r() * (w - 20);
      const y = r() * h;
      const s = 5 + r() * 3;
      const chip = r() < 0.5;
      const c = chip ? pick(r, [0xc8102e, 0x1f5fbf, 0x171317, 0x2fa860]) : 0xffc94a;
      for (const oy of [-h, 0, h]) {
        g.save();
        g.translate(x, y + oy);
        g.scale(1, 0.45 + r() * 0.5);
        g.fillStyle = rgba(c, 1);
        g.beginPath();
        g.arc(0, 0, s, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = rgba(chip ? 0xffffff : 0x8a5a10, 0.9);
        g.lineWidth = chip ? 2 : 1.2;
        if (chip) g.setLineDash([2.5, 2.5]);
        g.beginPath();
        g.arc(0, 0, s - 1.6, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
        g.restore();
      }
    }
  },
  /** loose threads swinging down (each wave fits the 256 period, so it tiles) */
  yarn: (g: G2, w: number, h: number) => {
    const cols = [0xe8a2b2, 0xf4e6d4, 0xf2c14e, 0x8fb8a8];
    g.lineCap = 'round';
    cols.forEach((c, i) => {
      const x0 = 10 + (i * (w - 20)) / (cols.length - 1);
      const amp = 4 + i;
      g.strokeStyle = rgba(0x3a2430, 0.35);
      g.lineWidth = 4.4;
      const path = () => {
        g.beginPath();
        for (let y = -4; y <= h + 4; y += 4) {
          const x = x0 + Math.sin((y / h) * Math.PI * 2 * (2 + (i % 2)) + i) * amp;
          if (y === -4) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();
      };
      path();
      g.strokeStyle = rgba(c, 1);
      g.lineWidth = 2.6;
      path();
    });
  },
  /** feathers drifting down in a soft haze */
  feather: (g: G2, w: number, h: number) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, rgba(0xffffff, 0));
    grd.addColorStop(0.5, rgba(0xf4f0ff, 0.35));
    grd.addColorStop(1, rgba(0xffffff, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    const r = rng(2626);
    for (let i = 0; i < 12; i++) {
      const x = 12 + r() * (w - 24);
      const y = r() * h;
      const rot = (r() - 0.5) * 1.2;
      const s = 0.8 + r() * 0.5;
      for (const oy of [-h, 0, h]) {
        g.save();
        g.translate(x, y + oy);
        g.rotate(rot);
        g.scale(s, s);
        g.fillStyle = rgba(0xffffff, 0.95);
        g.strokeStyle = rgba(0x7464b0, 0.55);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(0, -11);
        g.quadraticCurveTo(7, -3, 1, 11);
        g.quadraticCurveTo(-6, -2, 0, -11);
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(0, -9);
        g.lineTo(0.6, 13);
        g.stroke();
        g.restore();
      }
    }
  },
};
