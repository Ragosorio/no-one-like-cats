/**
 * DIARIO DEL MAR — engraved nautical chart art, all procedural:
 * coastlines with water-lining, hatch shading, compass rose, rhumb lines, sea monsters,
 * zone-specific island vignettes, chart border with alternating degree bars.
 */
import { Container, Graphics, Texture } from 'pixi.js';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { P, hash1 } from './common';

export type Pt = [number, number];

/** blobby island polygon around (cx,cy) */
export function islandPoly(cx: number, cy: number, rx: number, ry: number, seed: number, n = 28, rough = 0.22): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (hash1(seed * 17 + i) - 0.5) * rough * 2 + Math.sin(a * 3 + seed) * rough * 0.5;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return chaikin(chaikin(pts));
}

export function chaikin(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
  }
  return out;
}

const flat = (pts: Pt[]) => pts.flatMap((p) => p);

function scalePoly(pts: Pt[], cx: number, cy: number, s: number): Pt[] {
  return pts.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]);
}

/**
 * Engraved island: water-lining rings (blue), land fill, hatch shadow on the south-east, ink coast.
 */
export function drawIsland(g: Graphics, pts: Pt[], cx: number, cy: number, o: { land?: number; rings?: number; ink?: number; hatch?: boolean } = {}) {
  const ink = o.ink ?? P.blue;
  const rings = o.rings ?? 4;
  for (let i = rings; i >= 1; i--) {
    g.poly(flat(scalePoly(pts, cx, cy, 1 + i * 0.075))).stroke({ width: 1.4, color: ink, alpha: 0.12 + (rings - i) * 0.07 });
  }
  g.poly(flat(pts)).fill(o.land ?? P.agedDark);
  if (o.hatch !== false) {
    // diagonal hatching clipped roughly to the lower-right half
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const [x, y] of pts) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const inner = scalePoly(pts, cx + (maxX - minX) * 0.12, cy + (maxY - minY) * 0.14, 0.86);
    for (let x = minX - (maxY - minY); x < maxX; x += 7) {
      // segment from (x, maxY) to (x + h, minY): keep only parts inside pts and outside inner
      const steps = 24;
      let drawing = false;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = x + (maxY - minY) * t;
        const py = maxY - (maxY - minY) * t;
        const inside = pip(px, py, pts) && !pip(px, py, inner);
        if (inside && !drawing) {
          g.moveTo(px, py);
          drawing = true;
        } else if (inside) g.lineTo(px, py);
        else if (drawing) drawing = false;
      }
    }
    g.stroke({ width: 1.2, color: ink, alpha: 0.45 });
  }
  g.poly(flat(pts)).stroke({ width: 3, color: ink, join: 'round' });
}

/** point in polygon */
export function pip(x: number, y: number, pts: Pt[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi) inside = !inside;
  }
  return inside;
}

export function palm(g: Graphics, x: number, y: number, s = 1, ink: number = P.blue) {
  g.moveTo(x, y).quadraticCurveTo(x + 6 * s, y - 18 * s, x + 2 * s, y - 34 * s).stroke({ width: 3 * s, color: ink, cap: 'round' });
  const tx = x + 2 * s;
  const ty = y - 34 * s;
  for (const a of [-2.6, -2.0, -1.2, -0.5, 0.1]) {
    g.moveTo(tx, ty).quadraticCurveTo(tx + Math.cos(a) * 14 * s, ty + Math.sin(a) * 14 * s - 6 * s, tx + Math.cos(a) * 22 * s, ty + Math.sin(a) * 18 * s + 6 * s);
  }
  g.stroke({ width: 2.4 * s, color: ink, cap: 'round' });
}

export function rocks(g: Graphics, x: number, y: number, s = 1, ink: number = P.blue) {
  g.poly([x - 18 * s, y, x - 10 * s, y - 22 * s, x - 2 * s, y - 14 * s, x + 6 * s, y - 30 * s, x + 18 * s, y]).fill(P.agedDark).stroke({ width: 2.5, color: ink, join: 'round' });
  g.moveTo(x + 6 * s, y - 30 * s).lineTo(x + 2 * s, y).moveTo(x - 10 * s, y - 22 * s).lineTo(x - 8 * s, y).stroke({ width: 1.2, color: ink, alpha: 0.6 });
}

export function tower(g: Graphics, x: number, y: number, s = 1, ink: number = P.blue) {
  g.rect(x - 8 * s, y - 34 * s, 16 * s, 34 * s).fill(P.aged).stroke({ width: 2.5, color: ink });
  for (let i = 0; i < 3; i++) g.rect(x - 8 * s + i * 6 * s, y - 40 * s, 4 * s, 6 * s).fill(P.aged).stroke({ width: 2, color: ink });
  g.rect(x - 2 * s, y - 24 * s, 4 * s, 7 * s).fill(ink);
}

export function column(g: Graphics, x: number, y: number, h: number, broken: boolean, ink: number = P.blue) {
  g.rect(x - 6, y - h, 12, h).fill(P.aged).stroke({ width: 2.5, color: ink });
  g.moveTo(x - 2, y - h + 4).lineTo(x - 2, y - 2).moveTo(x + 2, y - h + 4).lineTo(x + 2, y - 2).stroke({ width: 1, color: ink, alpha: 0.6 });
  if (!broken) g.rect(x - 10, y - h - 6, 20, 6).fill(P.aged).stroke({ width: 2.5, color: ink });
  else g.poly([x - 6, y - h, x - 1, y - h - 7, x + 3, y - h - 2, x + 6, y - h - 8, x + 6, y - h]).fill(P.aged).stroke({ width: 2, color: ink });
}

export function bolt(g: Graphics, x: number, y: number, s = 1, color: number = C.yellow) {
  g.poly([x, y, x + 10 * s, y, x + 3 * s, y + 14 * s, x + 12 * s, y + 14 * s, x - 6 * s, y + 38 * s, x + 1 * s, y + 20 * s, x - 8 * s, y + 20 * s]).fill(color).stroke({ width: 2.5, color: P.blue, join: 'round' });
}

export function cloud(g: Graphics, x: number, y: number, s = 1, fill: number = P.aged, ink: number = P.blue) {
  for (const [dx, dy, r] of [
    [-26, 4, 16],
    [-8, -8, 20],
    [14, -4, 17],
    [30, 6, 13],
    [2, 8, 16],
  ] as const)
    g.circle(x + dx * s, y + dy * s, r * s);
  g.fill(fill).stroke({ width: 2.5, color: ink });
  g.moveTo(x - 34 * s, y + 16 * s).lineTo(x + 38 * s, y + 16 * s).stroke({ width: 2, color: ink });
}

export function whirl(g: Graphics, x: number, y: number, s = 1, ink: number = P.blue) {
  for (let i = 0; i < 70; i++) {
    const a = i * 0.28;
    const r = (2 + i * 0.42) * s;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r * 0.55;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.stroke({ width: 1.6, color: ink, alpha: 0.7 });
}

export function star(g: Graphics, x: number, y: number, r: number, color: number = P.blue) {
  g.star(x, y, 4, r, r * 0.3).fill(color);
}

export function ribs(g: Graphics, x: number, y: number, s = 1, ink: number = P.blue) {
  g.moveTo(x - 40 * s, y).quadraticCurveTo(x, y - 10 * s, x + 46 * s, y - 2 * s).stroke({ width: 4 * s, color: ink, cap: 'round' });
  for (let i = 0; i < 6; i++) {
    const bx = x - 32 * s + i * 14 * s;
    g.moveTo(bx, y - 4 * s).quadraticCurveTo(bx - 8 * s, y - 30 * s, bx + 4 * s, y - 44 * s + Math.abs(i - 2.5) * 5 * s);
  }
  g.stroke({ width: 3 * s, color: ink, cap: 'round' });
  g.circle(x + 54 * s, y - 8 * s, 10 * s).fill(P.aged).stroke({ width: 3, color: ink });
  g.circle(x + 57 * s, y - 10 * s, 3 * s).fill(ink);
}

/** the ink "sardine" sea creature popping out of the waves */
export function seaSerpent(g: Graphics, x: number, y: number, s = 1, ink: number = P.blue) {
  // three humps
  for (let i = 0; i < 3; i++) {
    const hx = x + i * 34 * s;
    g.moveTo(hx - 14 * s, y).quadraticCurveTo(hx, y - 26 * s, hx + 14 * s, y);
  }
  g.stroke({ width: 4 * s, color: ink, cap: 'round' });
  // head
  g.moveTo(x - 30 * s, y).quadraticCurveTo(x - 34 * s, y - 34 * s, x - 18 * s, y - 40 * s).quadraticCurveTo(x - 6 * s, y - 42 * s, x - 4 * s, y - 32 * s).stroke({ width: 4 * s, color: ink, cap: 'round' });
  g.circle(x - 14 * s, y - 36 * s, 2.6 * s).fill(ink);
  // tail fin
  g.poly([x + 82 * s, y, x + 98 * s, y - 18 * s, x + 96 * s, y + 2 * s]).fill(P.aged).stroke({ width: 3, color: ink, join: 'round' });
  waves(g, x - 40 * s, y + 6 * s, 150 * s, ink);
}

/** a short row of engraved wave marks */
export function waves(g: Graphics, x: number, y: number, w: number, ink: number = P.blue, alpha = 0.6) {
  const n = Math.max(2, Math.round(w / 16));
  g.moveTo(x, y);
  for (let i = 0; i < n; i++) {
    const x0 = x + (i * w) / n;
    g.quadraticCurveTo(x0 + w / n / 2, y - 5, x0 + w / n, y);
  }
  g.stroke({ width: 1.5, color: ink, alpha });
}

/** classic 16-point compass rose */
export function compassRose(r: number, ink: number = P.blue, accent: number = C.red): Container {
  const c = new Container();
  const g = new Graphics();
  g.circle(0, 0, r * 1.05).stroke({ width: 2, color: ink });
  g.circle(0, 0, r * 0.98).stroke({ width: 1, color: ink });
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const l = i % 4 === 0 ? 0.1 : 0.05;
    g.moveTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98).lineTo(Math.cos(a) * r * (0.98 - l), Math.sin(a) * r * (0.98 - l));
  }
  g.stroke({ width: 1.2, color: ink });
  const point = (a: number, len: number, wd: number, fillA: number, fillB: number) => {
    const tip: Pt = [Math.cos(a) * len, Math.sin(a) * len];
    const l: Pt = [Math.cos(a - Math.PI / 2) * wd, Math.sin(a - Math.PI / 2) * wd];
    const rr: Pt = [Math.cos(a + Math.PI / 2) * wd, Math.sin(a + Math.PI / 2) * wd];
    g.poly([0, 0, tip[0], tip[1], l[0], l[1]]).fill(fillA).stroke({ width: 1.5, color: ink, join: 'round' });
    g.poly([0, 0, tip[0], tip[1], rr[0], rr[1]]).fill(fillB).stroke({ width: 1.5, color: ink, join: 'round' });
  };
  for (let i = 0; i < 8; i++) point((i / 8) * Math.PI * 2 + Math.PI / 8, r * 0.5, r * 0.07, P.aged, ink);
  for (let i = 0; i < 4; i++) point((i / 4) * Math.PI * 2 + Math.PI / 4, r * 0.66, r * 0.1, P.aged, ink);
  for (let i = 0; i < 4; i++) point((i / 4) * Math.PI * 2 - Math.PI / 2, r * 0.9, r * 0.13, i === 0 ? accent : P.aged, ink);
  g.circle(0, 0, r * 0.08).fill(P.aged).stroke({ width: 2, color: ink });
  c.addChild(g);
  const n = txt('N', { fontFamily: F.serif, fontWeight: '700', fontSize: r * 0.28, fill: ink });
  n.anchor.set(0.5, 1);
  n.position.set(0, -r * 1.08);
  c.addChild(n);
  return c;
}

/** rhumb lines radiating from a point across the chart (portolan look) */
export function rhumbLines(g: Graphics, x: number, y: number, len: number, ink: number = P.blue) {
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    g.moveTo(x, y).lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  g.stroke({ width: 1, color: ink, alpha: 0.09 });
}

/** chart frame with alternating degree bars + labels */
export function chartFrame(x: number, y: number, w: number, h: number, ink: number = P.blue): Container {
  const c = new Container();
  const g = new Graphics();
  const t = 10;
  g.rect(x, y, w, h).stroke({ width: 3, color: ink });
  g.rect(x + t, y + t, w - t * 2, h - t * 2).stroke({ width: 1.5, color: ink });
  const seg = 60;
  for (let i = 0; i * seg < w; i++) {
    if (i % 2) continue;
    const sx = x + i * seg;
    const sw = Math.min(seg, x + w - sx);
    g.rect(sx, y, sw, t).rect(sx, y + h - t, sw, t);
  }
  for (let i = 0; i * seg < h; i++) {
    if (i % 2) continue;
    const sy = y + i * seg;
    const sh = Math.min(seg, y + h - sy);
    g.rect(x, sy, t, sh).rect(x + w - t, sy, t, sh);
  }
  g.fill(ink);
  // faint lat/long grid
  for (let i = 1; i < w / 240; i++) g.moveTo(x + i * 240, y + t).lineTo(x + i * 240, y + h - t);
  for (let i = 1; i < h / 240; i++) g.moveTo(x + t, y + i * 240).lineTo(x + w - t, y + i * 240);
  g.stroke({ width: 1, color: ink, alpha: 0.13 });
  c.addChild(g);
  for (let i = 1; i < w / 240; i++) {
    const l = txt(`${12 + i * 4}°`, { fontFamily: F.serif, fontSize: 13, fill: ink });
    l.position.set(x + i * 240 + 4, y + t + 2);
    l.alpha = 0.7;
    c.addChild(l);
  }
  return c;
}

/** burned-edge vignette texture for aged paper */
let vignetteTex: Texture | null = null;
export function vignetteTexture(): Texture {
  if (vignetteTex) return vignetteTex;
  const cv = document.createElement('canvas');
  cv.width = 480;
  cv.height = 270;
  const g = cv.getContext('2d')!;
  const grd = g.createRadialGradient(240, 135, 90, 240, 135, 290);
  grd.addColorStop(0, 'rgba(90,60,25,0)');
  grd.addColorStop(0.62, 'rgba(90,60,25,0.05)');
  grd.addColorStop(0.86, 'rgba(90,55,20,0.28)');
  grd.addColorStop(1, 'rgba(60,35,10,0.62)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 480, 270);
  // foxing spots
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 480;
    const y = Math.random() * 270;
    const r = 1 + Math.random() * 6;
    const sg = g.createRadialGradient(x, y, 0, x, y, r);
    sg.addColorStop(0, 'rgba(120,80,30,0.22)');
    sg.addColorStop(1, 'rgba(120,80,30,0)');
    g.fillStyle = sg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  vignetteTex = Texture.from(cv);
  return vignetteTex;
}

/** skull + crossbones (boss node) centered at 0,0 */
export function skull(g: Graphics, r: number, fill: number, ink: number) {
  // crossbones
  const bones: [number, number, number, number][] = [
    [-r * 0.95, -r * 0.7, r * 0.95, r * 0.75],
    [-r * 0.95, r * 0.75, r * 0.95, -r * 0.7],
  ];
  for (const [x0, y0, x1, y1] of bones) {
    g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: r * 0.2, color: ink, cap: 'round' });
    for (const [bx, by] of [
      [x0, y0],
      [x1, y1],
    ])
      g.circle(bx, by - r * 0.08, r * 0.12).circle(bx, by + r * 0.08, r * 0.12).fill(ink);
  }
  g.circle(0, -r * 0.12, r * 0.55).fill(fill).stroke({ width: 3, color: ink });
  g.roundRect(-r * 0.3, r * 0.22, r * 0.6, r * 0.32, 3).fill(fill).stroke({ width: 3, color: ink });
  g.circle(-r * 0.2, -r * 0.14, r * 0.15).fill(ink).circle(r * 0.2, -r * 0.14, r * 0.15).fill(ink);
  g.poly([0, r * 0.03, -r * 0.07, r * 0.15, r * 0.07, r * 0.15]).fill(ink);
  g.moveTo(-r * 0.1, r * 0.3).lineTo(-r * 0.1, r * 0.52).moveTo(r * 0.1, r * 0.3).lineTo(r * 0.1, r * 0.52).stroke({ width: 2, color: ink });
}

/** heraldic shield (elite node) centered at 0,0 */
export function shield(g: Graphics, r: number, fill: number, ink: number) {
  g.poly([-r * 0.85, -r * 0.8, r * 0.85, -r * 0.8, r * 0.85, -r * 0.05, 0, r, -r * 0.85, -r * 0.05]).fill(fill).stroke({ width: 3.5, color: ink, join: 'round' });
  g.poly([-r * 0.62, -r * 0.6, r * 0.62, -r * 0.6, r * 0.62, -r * 0.08, 0, r * 0.7, -r * 0.62, -r * 0.08]).stroke({ width: 1.5, color: ink, join: 'round' });
}

/** a tiny boat marker (your ship) */
export function boat(sail: number = C.pink, ink: number = C.ink): Graphics {
  const g = new Graphics();
  g.poly([-26, 0, 26, 0, 18, 12, -18, 12]).fill(0x8a5a2e).stroke({ width: 3, color: ink, join: 'round' });
  g.moveTo(0, 0).lineTo(0, -40).stroke({ width: 3, color: ink });
  g.poly([2, -38, 24, -8, 2, -6]).fill(sail).stroke({ width: 2.5, color: ink, join: 'round' });
  g.poly([-2, -34, -18, -10, -2, -8]).fill(P.aged).stroke({ width: 2.5, color: ink, join: 'round' });
  g.poly([0, -40, 12, -44, 0, -48]).fill(C.ink);
  return g;
}

/** soft fog bank texture (feathered edges), tinted by the sprite */
const fogCache = new Map<number, Texture>();
export function fogTexture(seed: number, w = 640, h = 440): Texture {
  const hit = fogCache.get(seed);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d')!;
  for (let i = 0; i < 46; i++) {
    const x = 50 + hash1(seed * 13 + i) * (w - 100);
    const y = 50 + hash1(seed * 29 + i * 3) * (h - 100);
    const r = 50 + hash1(seed + i * 7) * 90;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(246,239,224,0.42)');
    grd.addColorStop(0.6, 'rgba(246,239,224,0.24)');
    grd.addColorStop(1, 'rgba(246,239,224,0)');
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // fine mist streaks
  g.globalAlpha = 0.18;
  g.strokeStyle = '#4a5a80';
  g.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) {
    const x = 60 + hash1(seed * 3 + i * 11) * (w - 160);
    const y = 60 + hash1(seed * 5 + i * 13) * (h - 120);
    const l = 40 + hash1(i) * 90;
    g.beginPath();
    g.moveTo(x, y);
    g.bezierCurveTo(x + l * 0.3, y - 6, x + l * 0.6, y + 6, x + l, y);
    g.stroke();
  }
  const t = Texture.from(cv);
  fogCache.set(seed, t);
  return t;
}

// ====================================================================== Zones 2–3 vignettes (Hito 2)

/** stratified sea cliff (zone 2): jagged top, horizontal strata, vertical shading, foam at the base */
export function cliffFace(g: Graphics, x: number, y: number, w: number, h: number, seed = 1, ink: number = P.blue, fill = 0xcdbf9f) {
  const top: number[] = [];
  const n = Math.max(5, Math.round(w / 12));
  const peak = 0.3 + hash1(seed * 13) * 0.4;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x + t * w;
    // a crag: tallest near `peak`, ragged teeth, shoulders lower at the ends
    const ridge = 1 - Math.min(1, Math.abs(t - peak) * 1.6);
    const tooth = i % 2 ? 0.12 * hash1(seed * 7 + i) : 0;
    const py = y - h * (0.42 + 0.58 * ridge - tooth);
    top.push(px, py);
  }
  const poly = [...top, x + w, y, x, y];
  g.poly(poly).fill(fill).stroke({ width: 2.6, color: ink, join: 'round' });
  // strata
  for (let k = 1; k <= 3; k++) {
    const sy = y - (h * k) / 4.2;
    g.moveTo(x + 4, sy + hash1(seed + k) * 4);
    for (let i = 1; i <= 6; i++) g.lineTo(x + (i / 6) * w - 2, sy + (hash1(seed * 3 + k * 11 + i) - 0.5) * 6);
  }
  g.stroke({ width: 1.3, color: ink, alpha: 0.55 });
  // vertical shading on the right third + crevices
  for (let sx = x + w * (0.55 + peak * 0.2); sx < x + w - 3; sx += 4.5) g.moveTo(sx, y - 3).lineTo(sx + 1, y - h * (0.3 + hash1(sx) * 0.25));
  g.stroke({ width: 1, color: ink, alpha: 0.45 });
  for (let k = 0; k < 3; k++) {
    const cx = x + w * (0.2 + hash1(seed * 5 + k) * 0.6);
    g.moveTo(cx, y - h * 0.38).lineTo(cx + 3, y - h * 0.22).lineTo(cx - 2, y - h * 0.08);
  }
  g.stroke({ width: 1.4, color: ink, alpha: 0.6 });
  // foam
  waves(g, x - 8, y + 5, w + 16, ink, 0.55);
}

/** perched gargoyle silhouette with bat wings (zone 2 landmark) */
export function gargoyle(g: Graphics, x: number, y: number, s = 1, ink: number = P.blue, eye: number = C.red) {
  // wings
  const wing = (dir: number) => {
    g.poly([
      x + 6 * dir * s, y - 22 * s,
      x + 34 * dir * s, y - 44 * s,
      x + 40 * dir * s, y - 30 * s,
      x + 33 * dir * s, y - 28 * s,
      x + 34 * dir * s, y - 18 * s,
      x + 26 * dir * s, y - 20 * s,
      x + 24 * dir * s, y - 10 * s,
      x + 8 * dir * s, y - 12 * s,
    ]).fill(ink);
  };
  wing(-1);
  wing(1);
  // body (hunched) + head with horns
  g.ellipse(x, y - 12 * s, 11 * s, 14 * s).fill(ink);
  g.circle(x, y - 30 * s, 8 * s).fill(ink);
  g.poly([x - 7 * s, y - 34 * s, x - 11 * s, y - 46 * s, x - 3 * s, y - 37 * s]).fill(ink);
  g.poly([x + 7 * s, y - 34 * s, x + 11 * s, y - 46 * s, x + 3 * s, y - 37 * s]).fill(ink);
  // ears (it's a cat, after all)
  g.poly([x - 6 * s, y - 36 * s, x - 2 * s, y - 40 * s, x - 1 * s, y - 35 * s]).fill(ink);
  // eyes
  g.circle(x - 3 * s, y - 31 * s, 1.8 * s).circle(x + 3 * s, y - 31 * s, 1.8 * s).fill(eye);
  // tail curling down the rock
  g.moveTo(x + 8 * s, y - 2 * s).quadraticCurveTo(x + 22 * s, y + 2 * s, x + 18 * s, y + 12 * s).stroke({ width: 2.6 * s, color: ink, cap: 'round' });
  // pedestal
  g.rect(x - 14 * s, y - 2 * s, 28 * s, 6 * s).fill(P.aged).stroke({ width: 2, color: ink });
}

/** thin waterfall streaks down a cliff */
export function waterfall(g: Graphics, x: number, y: number, h: number, ink: number = P.blue) {
  for (let i = 0; i < 4; i++) g.moveTo(x + i * 3, y).lineTo(x + i * 3 + (i % 2), y + h);
  g.stroke({ width: 1.4, color: ink, alpha: 0.7 });
  g.ellipse(x + 5, y + h + 2, 10, 3).stroke({ width: 1.4, color: ink, alpha: 0.6 });
}

/** dark storm cloud with rain hatching and an optional bolt (zone 3) */
export function stormCloud(g: Graphics, x: number, y: number, s = 1, ink: number = P.blue, boltColor: number = C.yellow, rain = 70) {
  // rain first (behind)
  for (let i = 0; i < 14; i++) {
    const rx = x - 36 * s + i * 6 * s;
    const ry = y + 14 * s + hash1(i * 3 + x) * 8 * s;
    g.moveTo(rx, ry).lineTo(rx - 8 * s, ry + rain * s * (0.6 + hash1(i + y) * 0.4));
  }
  g.stroke({ width: 1.2, color: ink, alpha: 0.5 });
  cloud(g, x, y, s * 1.1, 0x9aa6bf, ink);
  if (boltColor >= 0) bolt(g, x - 6 * s, y + 10 * s, 0.9 * s, boltColor);
}

/** a kraken tentacle rising from the water, curling at the tip, with suckers */
export function tentacle(g: Graphics, x: number, y: number, s = 1, dir = 1, ink: number = P.blue, fill = 0xc9a7c7) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const a = t * Math.PI * 1.35;
    pts.push([x + dir * (Math.sin(a) * 26 * s + t * 10 * s), y - t * 70 * s + (t > 0.75 ? (t - 0.75) * 50 * s : 0)]);
  }
  const left: number[] = [];
  const right: number[] = [];
  pts.forEach(([px, py], i) => {
    const wdt = (1 - i / pts.length) * 9 * s + 1.5 * s;
    left.push(px - wdt, py);
    right.unshift(px + wdt, py);
  });
  g.poly([...left, ...right]).fill(fill).stroke({ width: 2.4, color: ink, join: 'round' });
  for (let i = 2; i < 16; i += 2) {
    const [px, py] = pts[i];
    g.circle(px + dir * 3 * s, py, (2.4 - i * 0.1) * s).fill(P.aged).stroke({ width: 1, color: ink });
  }
  waves(g, x - 24 * s, y + 3, 48 * s, ink, 0.6);
}

/** boss node emblem per zone (1 skull · 2 gargoyle · 3 kraken eye · else skull), centered at 0,0 */
export function bossEmblem(g: Graphics, zone: number, r: number, fill: number, ink: number) {
  if (zone === 2) {
    // gargoyle head: wings behind, horned cat head, glowing eyes
    const w = (dir: number) =>
      g.poly([dir * r * 0.3, -r * 0.2, dir * r * 1.02, -r * 0.62, dir * r * 0.92, -r * 0.18, dir * r * 1.0, r * 0.05, dir * r * 0.62, r * 0.12, dir * r * 0.35, r * 0.3]).fill(ink);
    w(-1);
    w(1);
    g.circle(0, 0, r * 0.5).fill(fill).stroke({ width: 3, color: ink });
    g.poly([-r * 0.42, -r * 0.18, -r * 0.5, -r * 0.72, -r * 0.14, -r * 0.42]).fill(fill).stroke({ width: 2.5, color: ink, join: 'round' });
    g.poly([r * 0.42, -r * 0.18, r * 0.5, -r * 0.72, r * 0.14, -r * 0.42]).fill(fill).stroke({ width: 2.5, color: ink, join: 'round' });
    g.poly([-r * 0.3, -r * 0.08, -r * 0.08, -r * 0.02, -r * 0.3, r * 0.06]).fill(C.red);
    g.poly([r * 0.3, -r * 0.08, r * 0.08, -r * 0.02, r * 0.3, r * 0.06]).fill(C.red);
    g.moveTo(-r * 0.2, r * 0.26).lineTo(-r * 0.07, r * 0.18).lineTo(0, r * 0.28).lineTo(r * 0.07, r * 0.18).lineTo(r * 0.2, r * 0.26).stroke({ width: 2.5, color: ink, join: 'round' });
    return;
  }
  if (zone === 3) {
    // kraken: tentacles around a big eye
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * 0.9 + (i / 5) * Math.PI * 0.8 + (i > 2 ? Math.PI : 0) * 0;
      const ang = (i / 6) * Math.PI * 2 + 0.3;
      void a;
      const x0 = Math.cos(ang) * r * 0.42;
      const y0 = Math.sin(ang) * r * 0.42;
      const x1 = Math.cos(ang + 0.5) * r * 0.98;
      const y1 = Math.sin(ang + 0.5) * r * 0.98;
      g.moveTo(x0, y0).quadraticCurveTo(Math.cos(ang) * r * 0.95, Math.sin(ang) * r * 0.95, x1, y1).stroke({ width: r * 0.16, color: ink, cap: 'round' });
    }
    g.circle(0, 0, r * 0.52).fill(fill).stroke({ width: 3, color: ink });
    g.ellipse(0, 0, r * 0.4, r * 0.26).fill(0xffd400).stroke({ width: 2.5, color: ink });
    g.ellipse(0, 0, r * 0.08, r * 0.22).fill(ink);
    g.moveTo(-r * 0.46, -r * 0.18).quadraticCurveTo(0, -r * 0.5, r * 0.46, -r * 0.18).stroke({ width: 3, color: ink });
    return;
  }
  skull(g, r, fill, ink);
}

/** elite node emblem: heraldic shield + zone mark (1 star · 2 bricks · 3 cauldron & bolt) */
export function eliteEmblem(g: Graphics, zone: number, r: number, fill: number, ink: number, mark: number) {
  shield(g, r, fill, ink);
  if (zone === 2) {
    // bricks
    const bw = r * 0.42;
    const bh = r * 0.22;
    for (let row = 0; row < 3; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let col = -1; col <= 1; col++) {
        const bx = col * bw - bw / 2 + off;
        if (Math.abs(bx + bw / 2) > r * 0.62) continue;
        g.rect(bx, -r * 0.48 + row * bh, bw - 2, bh - 2).fill(mark).stroke({ width: 1.2, color: ink });
      }
    }
    return;
  }
  if (zone === 3) {
    // cauldron with a bolt
    g.moveTo(-r * 0.42, -r * 0.18).quadraticCurveTo(0, r * 0.62, r * 0.42, -r * 0.18).closePath().fill(mark).stroke({ width: 2, color: ink });
    g.rect(-r * 0.48, -r * 0.24, r * 0.96, r * 0.1).fill(ink);
    g.poly([r * 0.05, -r * 0.62, -r * 0.14, -r * 0.34, -r * 0.02, -r * 0.34, -r * 0.1, -r * 0.12, r * 0.14, -r * 0.42, r * 0.02, -r * 0.42]).fill(C.yellow).stroke({ width: 1.5, color: ink });
    return;
  }
  g.star(0, -r * 0.18, 5, r * 0.36, r * 0.16).fill(mark);
}

/** rolled "wanted" errand poster pin (map), centered at 0,0 */
export function errandPin(g: Graphics, s: number, fill: number, ink: number = C.ink, accent: number = C.red) {
  g.rect(-14 * s + 3, -18 * s + 4, 28 * s, 34 * s).fill({ color: ink, alpha: 0.85 });
  g.rect(-14 * s, -18 * s, 28 * s, 34 * s).fill(fill).stroke({ width: 2.5, color: ink });
  g.rect(-14 * s, -18 * s, 28 * s, 7 * s).fill(accent);
  g.moveTo(-8 * s, -4 * s).lineTo(8 * s, -4 * s).moveTo(-8 * s, 2 * s).lineTo(8 * s, 2 * s).moveTo(-8 * s, 8 * s).lineTo(3 * s, 8 * s).stroke({ width: 1.4, color: ink, alpha: 0.7 });
  g.circle(0, -18 * s, 3.2 * s).fill(accent).stroke({ width: 1.5, color: ink });
}
