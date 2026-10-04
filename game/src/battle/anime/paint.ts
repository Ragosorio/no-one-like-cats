/**
 * Canvas2D painter: bakes the whole ship as ONE continuous cartoon illustration
 * (curvy hull, cel-shading bands, planks, gold moldings, portholes, anchor, cabins, module art)
 * plus a dark "interior" plate (ribs/beams) shown through holes.
 *
 * All drawing happens in ship space (bow = +x) with a mirroring transform when the ship is flipped,
 * so lighting/details stay consistent and text is drawn upright with `upright()`.
 */
import { CELL, ShipModel } from '../ship';
import { ShipLayout, ModuleInfo } from './layout';
import { ShipStyle } from './styles';
import { css, hash, mix, rng, Pt } from './util';
import { paintPattern } from './patterns';

export interface PaintTarget {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** device px per local px */
  R: number;
  padX: number;
  padT: number;
  /** size in local px */
  texW: number;
  texH: number;
}

export const PAD_X = 34;
export const PAD_T = 34;
export const PAD_B = 34;

export function makeTarget(L: ShipLayout, R: number): PaintTarget {
  const texW = L.wPx + PAD_X * 2;
  const texH = L.hPx + PAD_T + PAD_B;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(texW * R);
  canvas.height = Math.ceil(texH * R);
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx, R, padX: PAD_X, padT: PAD_T, texW, texH };
}

/** ctx transform: ship space → canvas px */
export function shipXf(ctx: CanvasRenderingContext2D, T: PaintTarget, L: ShipLayout) {
  ctx.setTransform(T.R, 0, 0, T.R, T.padX * T.R, T.padT * T.R);
  if (L.flip) ctx.transform(-1, 0, 0, 1, L.wPx, 0);
}
/** ctx transform: local space → canvas px */
export function localXf(ctx: CanvasRenderingContext2D, T: PaintTarget) {
  ctx.setTransform(T.R, 0, 0, T.R, T.padX * T.R, T.padT * T.R);
}

// ---------------------------------------------------------------- scratch canvas for rim bands
let scratch: HTMLCanvasElement | null = null;
function getScratch(w: number, h: number) {
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width < w || scratch.height < h) {
    scratch.width = Math.max(scratch.width, w);
    scratch.height = Math.max(scratch.height, h);
  }
  const g = scratch.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.shadowBlur = 0;
  g.clearRect(0, 0, scratch.width, scratch.height);
  return { cv: scratch, g };
}

/** paints (path − path shifted by dx,dy) in `fill` : a cel band along the edges facing away from the shift */
function rim(T: PaintTarget, L: ShipLayout, path: Path2D, dx: number, dy: number, fill: string | CanvasPattern, alpha = 1) {
  const ctx = T.ctx;
  const { cv, g } = getScratch(T.canvas.width, T.canvas.height);
  shipXf(g, T, L);
  g.fillStyle = fill;
  g.fill(path, 'evenodd');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  g.translate(dx, dy);
  g.fill(path, 'evenodd');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.drawImage(cv, 0, 0, T.canvas.width, T.canvas.height, 0, 0, T.canvas.width, T.canvas.height);
  ctx.restore();
}

function loopsPath(loops: Pt[][], dx = 0, dy = 0) {
  const p = new Path2D();
  for (const loop of loops) {
    loop.forEach((q, i) => (i ? p.lineTo(q[0] + dx, q[1] + dy) : p.moveTo(q[0] + dx, q[1] + dy)));
    p.closePath();
  }
  return p;
}

function dotPattern(ctx: CanvasRenderingContext2D, color: number, R: number) {
  const c = document.createElement('canvas');
  const s = Math.round(7 * R);
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  g.fillStyle = css(color);
  g.beginPath();
  g.arc(s * 0.25, s * 0.25, 1.35 * R, 0, Math.PI * 2);
  g.arc(s * 0.75, s * 0.75, 1.35 * R, 0, Math.PI * 2);
  g.fill();
  const pat = ctx.createPattern(c, 'repeat')!;
  pat.setTransform(new DOMMatrix().scale(1 / R, 1 / R));
  return pat;
}

/** draw text upright even when the ship space is mirrored */
function upright(ctx: CanvasRenderingContext2D, L: ShipLayout, x: number, y: number, fn: () => void) {
  ctx.save();
  ctx.translate(x, y);
  if (L.flip) ctx.scale(-1, 1);
  fn();
  ctx.restore();
}

function inkStroke(ctx: CanvasRenderingContext2D, ink: number, w: number) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(ink);
  ctx.lineWidth = w;
  ctx.stroke();
}

// ---------------------------------------------------------------- main entry

export interface PaintInfo {
  waterY: number;
  /** ship-space anchor points for decor (bowsprit tip etc.) */
  bow: Pt;
  stern: Pt;
}

export function paintShip(T: PaintTarget, L: ShipLayout, model: ShipModel, st: ShipStyle, waterY: number): PaintInfo {
  const ctx = T.ctx;
  ctx.clearRect(0, 0, T.canvas.width, T.canvas.height);
  shipXf(ctx, T, L);
  const R = rng(L.cols * 131 + L.rows * 17 + (st.id.length * 7));

  // 1. masts (behind everything)
  for (const mi of L.modules) if (mi.m.kind === 'mast') paintMast(ctx, mi, st);
  // 2. superstructure standing on deck
  for (const mi of L.modules) if (!mi.embedded && mi.m.kind !== 'mast') paintDeckModule(ctx, L, mi, st);
  // 3. hull body
  const body = loopsPath(L.outline);
  paintHull(T, L, body, st, waterY, R);
  // 4. embedded modules (clipped to the hull so nothing pokes out of the curve)
  shipXf(ctx, T, L);
  ctx.save();
  ctx.clip(body, 'evenodd');
  for (const mi of L.modules) if (mi.embedded) paintEmbeddedModule(ctx, L, mi, st);
  ctx.restore();
  // 5. hull details (portholes, anchor, ornaments)
  shipXf(ctx, T, L);
  const info = paintDetails(ctx, L, model, st, waterY, R);
  // 6. outline (variable weight: heavier on the bottom/shadow side)
  shipXf(ctx, T, L);
  if (st.feat.outlineGlow !== null) {
    ctx.save();
    ctx.shadowColor = css(st.feat.outlineGlow);
    ctx.shadowBlur = 12 * T.R;
    ctx.strokeStyle = css(st.feat.outlineGlow);
    ctx.lineWidth = 7;
    ctx.stroke(body);
    ctx.restore();
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 5.5;
  ctx.stroke(body);
  ctx.save();
  ctx.translate(-1.2, 1.8);
  ctx.lineWidth = 4;
  ctx.stroke(body);
  ctx.restore();
  // 7. railing along the deck
  paintRailing(ctx, L, st);
  return info;
}

// ---------------------------------------------------------------- hull

function paintHull(T: PaintTarget, L: ShipLayout, body: Path2D, st: ShipStyle, waterY: number, R: () => number) {
  const ctx = T.ctx;
  shipXf(ctx, T, L);
  ctx.fillStyle = css(st.hull.base);
  ctx.fill(body, 'evenodd');

  let maxDepth = 0;
  for (let x = L.minX; x <= L.maxX; x++) if (!Number.isNaN(L.topS[x])) maxDepth = Math.max(maxDepth, L.botS[x] - L.topS[x]);
  const nPl = Math.max(4, Math.round(maxDepth / 14));
  const plankY = (x: number, k: number) => {
    const t = L.topS[x] + 12;
    const b = L.botS[x];
    return t + (b - t) * (k / nPl);
  };
  const len = L.maxX - L.minX;

  // below-waterline paint
  ctx.save();
  ctx.clip(body, 'evenodd');
  ctx.fillStyle = css(st.bottom);
  ctx.fillRect(-50, waterY + 5, L.wPx + 100, 400);
  ctx.restore();

  // halftone strip just above the core shadow (comic print), then cel bands
  const S1 = Math.max(18, Math.min(30, maxDepth * 0.2));
  rim(T, L, body, 0, -(S1 + 13), dotPattern(ctx, st.hull.shadow, T.R));
  rim(T, L, body, 0, -S1, css(st.hull.shadow));
  rim(T, L, body, 13, 0, css(st.hull.shadow));
  rim(T, L, body, 0, -9, css(st.hull.deep));
  rim(T, L, body, 5, 0, css(st.hull.deep));
  rim(T, L, body, 0, 24, css(st.hull.light));
  rim(T, L, body, -7, 0, css(st.hull.light), 0.75);

  // cel terminator above the waterline (the keel shadow is under the sea, so the lower hull carries the volume)
  {
    shipXf(ctx, T, L);
    ctx.save();
    ctx.clip(body, 'evenodd');
    const ys = (x: number) => Math.min(waterY - 24, L.topS[x] + (Math.min(L.botS[x], waterY + 20) - L.topS[x]) * 0.7);
    const band = (off: number) => {
      const p = new Path2D();
      let first = true;
      for (let x = L.minX - 30; x <= L.maxX + 30; x += 3) {
        const xi = Math.max(L.minX, Math.min(L.maxX, x));
        if (Number.isNaN(L.topS[xi])) continue;
        const y = ys(xi) - off + Math.sin(x * 0.045) * 1.5;
        first ? p.moveTo(x, y) : p.lineTo(x, y);
        first = false;
      }
      p.lineTo(L.maxX + 30, waterY + 400);
      p.lineTo(L.minX - 30, waterY + 400);
      p.closePath();
      return p;
    };
    ctx.fillStyle = dotPattern(ctx, st.hull.shadow, T.R);
    ctx.fill(band(13));
    ctx.fillStyle = css(st.hull.shadow);
    ctx.fill(band(0));
    // water reflection glint just above the boot stripe
    ctx.strokeStyle = css(st.hull.light, 0.55);
    ctx.lineWidth = 2;
    ctx.setLineDash([18, 7, 5, 9]);
    ctx.beginPath();
    ctx.moveTo(L.minX, waterY - 9);
    ctx.lineTo(L.maxX, waterY - 9);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  shipXf(ctx, T, L);
  ctx.save();
  ctx.clip(body, 'evenodd');
  // surface pattern per skin (planks, stone, books, ribs, coral…)
  const reshade = paintPattern({ ctx, L, st, plankY, nPl, R, waterY, res: T.R });
  ctx.restore();
  if (reshade) {
    // opaque patterns hid the cel bands: lay them again, translucent
    rim(T, L, body, 0, -S1, css(st.hull.deep), 0.45);
    rim(T, L, body, 13, 0, css(st.hull.deep), 0.4);
    rim(T, L, body, -7, 0, css(st.hull.light), 0.3);
  }
  shipXf(ctx, T, L);
  ctx.save();
  ctx.clip(body, 'evenodd');
  // boot stripe at waterline
  if (st.feat.waterStripe) {
    ctx.fillStyle = css(st.stripe);
    ctx.fillRect(-50, waterY - 3, L.wPx + 100, 8);
    ctx.strokeStyle = css(st.ink, 0.85);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-50, waterY - 3);
    ctx.lineTo(L.wPx + 50, waterY - 3);
    ctx.moveTo(-50, waterY + 5);
    ctx.lineTo(L.wPx + 50, waterY + 5);
    ctx.stroke();
  }
  ctx.restore();

  // gunwale molding
  rim(T, L, body, 0, 13, css(st.trim.base));
  rim(T, L, body, 0, 4, css(st.trim.light));
  shipXf(ctx, T, L);
  ctx.save();
  ctx.clip(body, 'evenodd');
  ctx.save();
  ctx.translate(0, 13);
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 2.6;
  ctx.stroke(body);
  ctx.translate(0, 3);
  ctx.strokeStyle = css(st.hull.deep, 0.55);
  ctx.lineWidth = 2.4;
  ctx.stroke(body);
  ctx.restore();
  // gold studs along the molding
  if (!st.neon.length && (st.feat.rail === 'rail' || st.feat.rail === 'rope' || st.feat.rail === 'lace')) {
    ctx.fillStyle = css(st.trim.shadow);
    for (let x = L.minX + 14; x < L.maxX - 8; x += 22) {
      const t = L.topY[x];
      if (Number.isNaN(t)) continue;
      ctx.beginPath();
      ctx.arc(x, t + 8, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // anime specular streaks on the bow bulge
  const streak = (a: number, b: number, k: number, w: number, alpha: number) => {
    ctx.beginPath();
    let on = false;
    for (let x = Math.round(L.minX + len * a); x <= L.minX + len * b; x += 3) {
      if (Number.isNaN(L.topS[x])) continue;
      const y = plankY(x, k);
      on ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      on = true;
    }
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  streak(0.64, 0.83, 0.62, 3.6, 0.85);
  streak(0.86, 0.89, 0.62, 3.6, 0.85);
  streak(0.7, 0.79, 1.15, 2.2, 0.5);
  streak(0.08, 0.16, 0.8, 2.4, 0.35);
  if (st.feat.gloss > 0) {
    const gl = st.feat.gloss;
    streak(0.2, 0.5, 0.5, 4.2, 0.55 * gl);
    streak(0.53, 0.56, 0.5, 4.2, 0.55 * gl);
    streak(0.3, 0.62, nPl * 0.55, 2.4, 0.4 * gl);
    streak(0.76, 0.86, nPl * 0.55, 2.4, 0.5 * gl);
  }

  // cosmic neon strips
  if (st.neon.length) {
    ctx.shadowBlur = 9 * T.R;
    const seg = (k: number, col: number, a: number, b: number) => {
      ctx.shadowColor = css(col);
      ctx.strokeStyle = css(mix(col, 0xffffff, 0.35));
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      let on = false;
      for (let x = Math.round(L.minX + len * a); x <= L.minX + len * b; x += 3) {
        if (Number.isNaN(L.topS[x])) continue;
        const y = plankY(x, k);
        on ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        on = true;
      }
      ctx.stroke();
    };
    seg(1.0, st.neon[0], 0.12, 0.47);
    seg(1.0, st.neon[0], 0.53, 0.92);
    seg(nPl - 2.2, st.neon[1], 0.18, 0.86);
    ctx.shadowBlur = 0;
  }

  // grime / patches (rat)
  if (st.grime > 0) {
    for (let y = 0; y < L.rows; y++)
      for (let x = 0; x < L.cols; x++) {
        if (!L.body[y][x] || L.moduleAt[y][x]) continue;
        const h = hash(x, y, 404);
        if (h < 0.24) {
          const cx = (x + 0.5) * CELL + (hash(x, y, 5) - 0.5) * 14;
          const cy = (y + 0.5) * CELL + (hash(x, y, 6) - 0.5) * 10;
          const w = 16 + hash(x, y, 7) * 14;
          const hh = 11 + hash(x, y, 8) * 9;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((hash(x, y, 9) - 0.5) * 0.35);
          ctx.fillStyle = css(h < 0.12 ? st.wood.light : mix(st.hull.base, st.hull.deep, 0.35));
          ctx.fillRect(-w / 2, -hh / 2, w, hh);
          ctx.fillStyle = css(st.hull.shadow, 0.6);
          ctx.fillRect(-w / 2, hh / 2 - 3, w, 3);
          ctx.strokeStyle = css(st.ink);
          ctx.lineWidth = 2;
          ctx.strokeRect(-w / 2, -hh / 2, w, hh);
          ctx.fillStyle = css(st.metal.light);
          for (const [nx, ny] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            ctx.beginPath();
            ctx.arc(nx * (w / 2 - 3), ny * (hh / 2 - 3), 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        if (h > 0.8) {
          const gx = (x + hash(x, y, 3)) * CELL;
          const gy = y * CELL + 6;
          const grd = ctx.createLinearGradient(0, gy, 0, gy + 34);
          grd.addColorStop(0, css(0x1a120a, 0.35));
          grd.addColorStop(1, css(0x1a120a, 0));
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(gx - 3, gy);
          ctx.quadraticCurveTo(gx - 4, gy + 22, gx, gy + 34);
          ctx.quadraticCurveTo(gx + 4, gy + 22, gx + 3, gy);
          ctx.fill();
        }
      }
    ctx.fillStyle = css(0x5f7a2c, 0.9);
    for (let x = L.minX; x < L.maxX; x += 7) {
      const hh = 3 + hash(x, 77) * 6;
      ctx.beginPath();
      ctx.moveTo(x, waterY - 2);
      ctx.quadraticCurveTo(x + 2, waterY - 2 - hh, x + 4, waterY - 2 - hh * 0.4);
      ctx.lineTo(x + 6, waterY - 2);
      ctx.fill();
    }
  }
  ctx.restore();

  shipXf(ctx, T, L);
  paintMaterialPatches(ctx, L, st);
}

function paintMaterialPatches(ctx: CanvasRenderingContext2D, L: ShipLayout, st: ShipStyle) {
  const model = currentModel!;
  for (let y = 0; y < L.rows; y++) {
    let x = 0;
    while (x < L.cols) {
      const c = model.get(x, y);
      if (!c || c.module !== undefined || !L.body[y][x] || c.material === L.dominant) {
        x++;
        continue;
      }
      // run of same material
      let x1 = x;
      while (x1 + 1 < L.cols) {
        const n = model.get(x1 + 1, y);
        if (!n || n.module !== undefined || n.material !== c.material || !L.body[y][x1 + 1]) break;
        x1++;
      }
      const X = x * CELL + 3;
      const W = (x1 - x + 1) * CELL - 6;
      const Y = y * CELL + 5;
      const H = CELL - 10;
      if (c.material === 'iron') {
        ctx.fillStyle = css(st.metal.base);
        roundRect(ctx, X, Y, W, H, 4);
        ctx.fill();
        ctx.fillStyle = css(st.metal.shadow);
        ctx.fillRect(X + 2, Y + H - 8, W - 4, 6);
        ctx.fillStyle = css(st.metal.light);
        ctx.fillRect(X + 4, Y + 3, W - 8, 3);
        roundRect(ctx, X, Y, W, H, 4);
        inkStroke(ctx, st.ink, 2.4);
        ctx.fillStyle = css(st.metal.light);
        for (let rx = X + 6; rx < X + W - 3; rx += 10) {
          for (const ry of [Y + 4.5, Y + H - 4.5]) {
            ctx.beginPath();
            ctx.arc(rx, ry, 1.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = css(st.ink, 0.8);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      } else if (c.material === 'crystal' || c.material === 'void') {
        for (let k = x; k <= x1; k++) {
          const cx = (k + 0.5) * CELL;
          const cy = (y + 0.5) * CELL;
          const isVoid = c.material === 'void';
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
            const r = i % 2 ? 13 : 15;
            i ? ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9) : ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9);
          }
          ctx.closePath();
          ctx.fillStyle = css(isVoid ? 0x150b1e : st.crystal.base);
          ctx.fill();
          ctx.save();
          ctx.clip();
          ctx.fillStyle = css(isVoid ? 0x3a1a52 : st.crystal.shadow);
          ctx.beginPath();
          ctx.moveTo(cx, cy - 16);
          ctx.lineTo(cx + 16, cy);
          ctx.lineTo(cx, cy + 16);
          ctx.fill();
          ctx.fillStyle = css(isVoid ? 0xff2e88 : st.crystal.light, isVoid ? 0.8 : 1);
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy - 9);
          ctx.lineTo(cx - 2, cy - 11);
          ctx.lineTo(cx - 9, cy - 1);
          ctx.fill();
          ctx.restore();
          inkStroke(ctx, st.ink, 2.4);
        }
      } else if (c.material === 'bone') {
        for (let k = x; k <= x1; k++) {
          const cx = (k + 0.5) * CELL;
          const cy = (y + 0.5) * CELL;
          for (const dy of [-7, 7]) {
            ctx.beginPath();
            ctx.moveTo(cx - 14, cy + dy);
            ctx.quadraticCurveTo(cx, cy + dy - 5, cx + 14, cy + dy);
            ctx.strokeStyle = css(st.ink);
            ctx.lineWidth = 7.5;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.strokeStyle = css(0xf2e8d0);
            ctx.lineWidth = 4.5;
            ctx.stroke();
          }
        }
      } else if (c.material === 'wood') {
        ctx.fillStyle = css(st.wood.base);
        roundRect(ctx, X, Y, W, H, 3);
        ctx.fill();
        ctx.strokeStyle = css(st.wood.shadow);
        ctx.lineWidth = 1.5;
        for (let yy = Y + 10; yy < Y + H; yy += 10) ((ctx.beginPath(), ctx.moveTo(X + 2, yy), ctx.lineTo(X + W - 2, yy)), ctx.stroke());
        roundRect(ctx, X, Y, W, H, 3);
        inkStroke(ctx, st.ink, 2.2);
      }
      x = x1 + 1;
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ---------------------------------------------------------------- details

let currentModel: ShipModel | null = null;
export function setPaintModel(m: ShipModel) {
  currentModel = m;
}

function moduleRectHit(L: ShipLayout, x: number, y: number, r: number) {
  for (const mi of L.modules) {
    const m = mi.m;
    if (x + r > m.x * CELL && x - r < (m.x + m.w) * CELL && y + r > m.y * CELL && y - r < (m.y + m.h) * CELL) return true;
  }
  return false;
}

function insideHull(L: ShipLayout, x: number, y: number, r: number, waterY: number) {
  for (const dx of [-r, 0, r]) {
    const xi = Math.round(x + dx);
    const t = L.topY[xi];
    const b = L.botY[xi];
    if (t === undefined || Number.isNaN(t)) return false;
    if (y - r < t + 16 || y + r > Math.min(b - 8, waterY - 6)) return false;
  }
  return true;
}

function paintDetails(ctx: CanvasRenderingContext2D, L: ShipLayout, model: ShipModel, st: ShipStyle, waterY: number, R: () => number): PaintInfo {
  const len = L.maxX - L.minX;
  // --- portholes
  const holes: Pt[] = [];
  for (let x = L.minX + 34; x < L.maxX - 30; x += 58) {
    const t = L.topS[Math.round(x)];
    if (Number.isNaN(t)) continue;
    const y = t + (waterY - t) * 0.5;
    if (!insideHull(L, x, y, 12, waterY) || moduleRectHit(L, x, y, 13)) continue;
    holes.push([x, y]);
  }
  // --- anchor near the bow
  let anchor: Pt | null = null;
  for (let x = L.maxX - 62; x > L.minX + len * 0.55; x -= 10) {
    const t = L.topY[Math.round(x)];
    if (Number.isNaN(t)) continue;
    const y = t + 18;
    if (y + 46 > waterY - 4) continue;
    if (moduleRectHit(L, x, y + 22, 22)) continue;
    if (!insideHull(L, x, y + 22, 18, waterY + 30)) continue;
    anchor = [x, y];
    break;
  }
  if (!st.feat.anchor) anchor = null;
  for (const p of holes) {
    if (anchor && Math.abs(p[0] - anchor[0]) < 34) continue;
    if (st.feat.portholes === 'none') continue;
    if (st.feat.portholes === 'slit') arrowSlit(ctx, p[0], p[1], st);
    else porthole(ctx, p[0], p[1], st);
  }
  if (anchor) drawAnchor(ctx, anchor[0], anchor[1], st, R);

  // --- life ring near the stern
  for (let x = L.minX + 40; st.feat.lifeRing && x < L.minX + len * 0.35; x += 8) {
    const t = L.topY[Math.round(x)];
    if (Number.isNaN(t)) continue;
    const y = t + 32;
    if (!insideHull(L, x, y, 15, waterY) || moduleRectHit(L, x, y, 15)) continue;
    if (holes.some((h) => Math.hypot(h[0] - x, h[1] - y) < 30)) continue;
    lifeRing(ctx, x, y, st);
    break;
  }

  // --- bow scroll ornament
  const bx = L.maxX - 9;
  const bt = L.topY[Math.round(bx)];
  const bow: Pt = [L.maxX, Number.isNaN(bt) ? L.hPx * 0.5 : bt + 8];
  if (!Number.isNaN(bt) && st.feat.scroll) {
    ctx.save();
    ctx.translate(bx - 6, bt + 22);
    const spiral = () => {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 3.2;
        const r = 2 + i * 0.28;
        const px = Math.cos(a + Math.PI) * r;
        const py = Math.sin(a + Math.PI) * r * 0.9;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
    };
    spiral();
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    spiral();
    ctx.strokeStyle = css(st.neon[1] ?? st.trim.base);
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.restore();
  }
  const sx = L.minX + 6;
  const stt = L.topY[Math.round(sx)];
  const stern: Pt = [L.minX, Number.isNaN(stt) ? L.hPx * 0.5 : stt + 10];
  void model;
  return { waterY, bow, stern };
}

function arrowSlit(ctx: CanvasRenderingContext2D, x: number, y: number, st: ShipStyle) {
  const p = new Path2D();
  p.roundRect(x - 3, y - 11, 6, 22, 3);
  p.roundRect(x - 8, y - 2.5, 16, 5, 2.5);
  ctx.fillStyle = css(st.trim.light);
  ctx.save();
  ctx.translate(-1.5, -1.5);
  ctx.fill(p);
  ctx.restore();
  ctx.fillStyle = css(st.interior.base);
  ctx.fill(p);
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 2;
  ctx.stroke(p);
  ctx.save();
  ctx.clip(p);
  ctx.fillStyle = css(st.window.glow, 0.55);
  ctx.fillRect(x - 8, y + 2, 16, 10);
  ctx.restore();
}

function porthole(ctx: CanvasRenderingContext2D, x: number, y: number, st: ShipStyle) {
  const r = 9.5;
  if (st.feat.portholes === 'glow') {
    const gc = st.neon[2] ?? st.window.glow;
    ctx.save();
    ctx.shadowColor = css(gc);
    ctx.shadowBlur = 14;
    ctx.fillStyle = css(mix(gc, 0xffffff, 0.3));
    ctx.beginPath();
    ctx.arc(x, y, r - 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = css(st.trim.shadow);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    inkStroke(ctx, st.ink, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x - 2.5, y - 2.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.arc(x, y, r + 2.5, 0, Math.PI * 2);
  ctx.fillStyle = css(st.ink);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = css(st.trim.base);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 0.8, y + 0.8, r, Math.PI * 0.1, Math.PI * 0.9);
  ctx.strokeStyle = css(st.trim.shadow);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 3.6, 0, Math.PI * 2);
  ctx.fillStyle = css(st.ink);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r - 4.6, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y + 2, 0, x, y, r - 4.6);
  g.addColorStop(0, css(mix(st.window.glass, st.window.glow, 0.45)));
  g.addColorStop(1, css(st.window.glass));
  ctx.fillStyle = g;
  ctx.fill();
  // anime glass glint
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r - 7, Math.PI * 1.05, Math.PI * 1.45);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + 2.2, y + 2, 1.1, 0, Math.PI * 2);
  ctx.fill();
  // bolts
  ctx.fillStyle = css(st.trim.shadow);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * (r - 1.6), y + Math.sin(a) * (r - 1.6), 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAnchor(ctx: CanvasRenderingContext2D, x: number, y: number, st: ShipStyle, R: () => number) {
  const col = st.neon.length ? st.metal.light : st.trim.base;
  const sh = st.neon.length ? st.metal.base : st.trim.shadow;
  const path = new Path2D();
  // ring
  path.arc(x, y + 4, 5.5, 0, Math.PI * 2);
  // shank
  path.roundRect(x - 3.5, y + 9, 7, 30, 2);
  // stock (crossbar)
  path.roundRect(x - 13, y + 13, 26, 5.5, 2.5);
  // arms
  const arms = new Path2D();
  arms.moveTo(x - 19, y + 30);
  arms.quadraticCurveTo(x - 17, y + 47, x, y + 47);
  arms.quadraticCurveTo(x + 17, y + 47, x + 19, y + 30);
  // flukes
  const fl = new Path2D();
  fl.moveTo(x - 25, y + 31);
  fl.lineTo(x - 16, y + 24);
  fl.lineTo(x - 14, y + 34);
  fl.closePath();
  fl.moveTo(x + 25, y + 31);
  fl.lineTo(x + 16, y + 24);
  fl.lineTo(x + 14, y + 34);
  fl.closePath();
  // chain up to the hawse
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x - 1 - i * 2, y - 3 - i * 6, 2.4, 3.6, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = css(sh);
    ctx.fill();
    ctx.stroke();
  }
  // ink under-layer
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 11;
  ctx.stroke(arms);
  ctx.lineWidth = 4;
  ctx.stroke(path);
  ctx.stroke(fl);
  ctx.fillStyle = css(col);
  ctx.fill(path, 'evenodd');
  ctx.fill(fl);
  ctx.strokeStyle = css(col);
  ctx.lineWidth = 6;
  ctx.stroke(arms);
  // shade (right/bottom)
  ctx.strokeStyle = css(sh);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x + 1.8, y + 12);
  ctx.lineTo(x + 1.8, y + 38);
  ctx.moveTo(x + 2, y + 46);
  ctx.quadraticCurveTo(x + 15, y + 45, x + 17, y + 32);
  ctx.stroke();
  // highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 1.5, y + 12);
  ctx.lineTo(x - 1.5, y + 22);
  ctx.stroke();
  // ring hole
  ctx.fillStyle = css(st.hull.shadow);
  ctx.beginPath();
  ctx.arc(x, y + 4, 2.3, 0, Math.PI * 2);
  ctx.fill();
  if (st.rust) {
    ctx.fillStyle = css(0x3b2414, 0.75);
    for (let i = 0; i < 9; i++) {
      const px = x + (R() - 0.5) * 30;
      const py = y + 10 + R() * 36;
      ctx.beginPath();
      ctx.ellipse(px, py, 1 + R() * 2.2, 0.8 + R() * 1.5, R() * 3, 0, Math.PI * 2);
      ctx.save();
      ctx.clip(path);
      ctx.fill();
      ctx.restore();
    }
  }
  if (st.neon.length) {
    ctx.save();
    ctx.shadowColor = css(st.neon[1]);
    ctx.shadowBlur = 10;
    ctx.strokeStyle = css(st.neon[1]);
    ctx.lineWidth = 1.4;
    ctx.stroke(arms);
    ctx.restore();
  }
}

function lifeRing(ctx: CanvasRenderingContext2D, x: number, y: number, st: ShipStyle) {
  const r = 12;
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, Math.PI * 2);
  ctx.arc(x, y, r - 7, 0, Math.PI * 2, true);
  ctx.fillStyle = css(st.ink);
  ctx.fill('evenodd');
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(x, y, r, (i / 8) * Math.PI * 2, ((i + 1) / 8) * Math.PI * 2);
    ctx.arc(x, y, r - 5, ((i + 1) / 8) * Math.PI * 2, (i / 8) * Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = css(i % 2 ? 0xf4f0e6 : st.neon[0] ?? 0xe8322e);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r - 2.5, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
}

// ---------------------------------------------------------------- railing

function paintRailing(ctx: CanvasRenderingContext2D, L: ShipLayout, st: ShipStyle) {
  const kind = st.feat.rail;
  if (kind === 'none') return;
  const posts: Pt[] = [];
  for (let x = L.minX + 10; x <= L.maxX - 10; x += 12) {
    const t = L.topY[Math.round(x)];
    if (Number.isNaN(t)) continue;
    // only on deck tops with air above (not under a cabin)
    const cx = Math.floor(x / CELL);
    const cy = Math.floor((t + 2) / CELL) - 1;
    if (cy >= 0 && L.filled[cy]?.[cx] && L.moduleAt[cy]?.[cx]?.m.kind === 'catroom') {
      posts.push([NaN, NaN]);
      continue;
    }
    posts.push([x, t]);
  }
  if (kind === 'crenel') return crenels(ctx, posts, st);
  if (kind === 'rope') return ropeRail(ctx, posts, st);
  if (kind === 'bone') return boneRail(ctx, posts, st);
  const col = st.neon.length ? st.trim.light : st.trim.base;
  // posts
  for (const [x, t] of posts) {
    if (Number.isNaN(x)) continue;
    ctx.beginPath();
    ctx.roundRect(x - 2, t - 13, 4, 15, 1.5);
    ctx.fillStyle = css(col);
    ctx.fill();
    inkStroke(ctx, st.ink, 1.6);
  }
  // rail segments
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i];
    const b = posts[i + 1];
    if (Number.isNaN(a[0]) || Number.isNaN(b[0]) || Math.abs(a[1] - b[1]) > 7) continue;
    ctx.beginPath();
    ctx.moveTo(a[0] - 3, a[1] - 13);
    ctx.lineTo(b[0] + 3, b[1] - 13);
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = css(col);
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }
  if (st.neon.length) {
    ctx.save();
    ctx.shadowColor = css(st.neon[0]);
    ctx.shadowBlur = 8;
    for (let i = 0; i < posts.length - 1; i++) {
      const a = posts[i];
      const b = posts[i + 1];
      if (Number.isNaN(a[0]) || Number.isNaN(b[0]) || Math.abs(a[1] - b[1]) > 7) continue;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1] - 13);
      ctx.lineTo(b[0], b[1] - 13);
      ctx.strokeStyle = css(st.neon[0]);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }
}


function segments(posts: Pt[], maxDy = 7) {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (const p of posts) {
    const last = cur[cur.length - 1];
    if (Number.isNaN(p[0]) || (last && Math.abs(last[1] - p[1]) > maxDy)) {
      if (cur.length) out.push(cur);
      cur = Number.isNaN(p[0]) ? [] : [p];
      continue;
    }
    cur.push(p);
  }
  if (cur.length) out.push(cur);
  return out;
}

/** stone battlements: merlons every other post */
function crenels(ctx: CanvasRenderingContext2D, posts: Pt[], st: ShipStyle) {
  for (const seg of segments(posts, 9)) {
    for (let i = 0; i < seg.length; i += 2) {
      const [x, t] = seg[i];
      ctx.beginPath();
      ctx.roundRect(x - 6.5, t - 14, 13, 16, 2);
      ctx.fillStyle = css(st.trim.base);
      ctx.fill();
      ctx.fillStyle = css(st.trim.shadow);
      ctx.fillRect(x + 1.5, t - 12, 4.5, 13);
      ctx.fillStyle = css(st.trim.light);
      ctx.fillRect(x - 5, t - 12.5, 9, 2.2);
      ctx.beginPath();
      ctx.roundRect(x - 6.5, t - 14, 13, 16, 2);
      inkStroke(ctx, st.ink, 2);
      if (hash(Math.round(x), 4) > 0.6) {
        ctx.fillStyle = css(st.accent.base);
        ctx.beginPath();
        ctx.ellipse(x - 2, t - 14, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** wooden stakes + sagging rope */
function ropeRail(ctx: CanvasRenderingContext2D, posts: Pt[], st: ShipStyle) {
  for (const seg of segments(posts, 8)) {
    const stakes = seg.filter((_, i) => i % 2 === 0);
    for (let i = 0; i < stakes.length - 1; i++) {
      const [x0, t0] = stakes[i];
      const [x1, t1] = stakes[i + 1];
      ctx.beginPath();
      ctx.moveTo(x0, t0 - 10);
      ctx.quadraticCurveTo((x0 + x1) / 2, (t0 + t1) / 2 - 4, x1, t1 - 10);
      ctx.strokeStyle = css(st.ink);
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = css(st.accent.base);
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    for (const [x, t] of stakes) {
      ctx.beginPath();
      ctx.moveTo(x - 2.5, t + 2);
      ctx.lineTo(x - 2.5, t - 11);
      ctx.lineTo(x, t - 14);
      ctx.lineTo(x + 2.5, t - 11);
      ctx.lineTo(x + 2.5, t + 2);
      ctx.closePath();
      ctx.fillStyle = css(st.wood.base);
      ctx.fill();
      inkStroke(ctx, st.ink, 1.6);
    }
  }
}

/** bone spikes */
function boneRail(ctx: CanvasRenderingContext2D, posts: Pt[], st: ShipStyle) {
  for (const seg of segments(posts, 8)) {
    for (const [x, t] of seg) {
      const h = 9 + hash(Math.round(x), 2) * 6;
      ctx.beginPath();
      ctx.moveTo(x - 2.5, t + 2);
      ctx.quadraticCurveTo(x - 2, t - h * 0.6, x + 1.5, t - h);
      ctx.quadraticCurveTo(x + 1.5, t - h * 0.5, x + 2.5, t + 2);
      ctx.closePath();
      ctx.fillStyle = css(st.accent.base);
      ctx.fill();
      inkStroke(ctx, st.ink, 1.5);
    }
  }
}

// ---------------------------------------------------------------- modules

function rectOf(mi: ModuleInfo) {
  const m = mi.m;
  return { x: m.x * CELL, y: m.y * CELL, w: m.w * CELL, h: m.h * CELL, cx: (m.x + m.w / 2) * CELL, cy: (m.y + m.h / 2) * CELL };
}

function paintMast(ctx: CanvasRenderingContext2D, mi: ModuleInfo, st: ShipStyle) {
  const r = rectOf(mi);
  const top = r.y + 4;
  const bottom = r.y + r.h + 14;
  const w = 13;
  const x0 = r.cx - w / 2;
  ctx.beginPath();
  ctx.roundRect(x0, top, w, bottom - top, 4);
  ctx.fillStyle = css(st.wood.base);
  ctx.fill();
  ctx.fillStyle = css(st.wood.shadow);
  ctx.fillRect(r.cx + 1.5, top + 2, w / 2 - 2, bottom - top - 4);
  ctx.fillStyle = css(st.wood.light);
  ctx.fillRect(r.cx - 4, top + 3, 2, bottom - top - 6);
  ctx.beginPath();
  ctx.roundRect(x0, top, w, bottom - top, 4);
  inkStroke(ctx, st.ink, 2.6);
  // iron bands
  for (let y = top + 50; y < bottom - 20; y += 38) {
    ctx.beginPath();
    ctx.roundRect(x0 - 1.5, y, w + 3, 5, 1.5);
    ctx.fillStyle = css(st.neon.length ? st.neon[1] : st.metal.base);
    ctx.fill();
    inkStroke(ctx, st.ink, 1.5);
  }
  // crow's nest
  const ny = top + 12;
  ctx.beginPath();
  ctx.moveTo(r.cx - 17, ny);
  ctx.lineTo(r.cx + 17, ny);
  ctx.lineTo(r.cx + 13, ny + 16);
  ctx.quadraticCurveTo(r.cx, ny + 20, r.cx - 13, ny + 16);
  ctx.closePath();
  ctx.fillStyle = css(st.wood.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = css(st.wood.shadow);
  ctx.fillRect(r.cx + 4, ny, 20, 22);
  ctx.strokeStyle = css(st.wood.shadow);
  ctx.lineWidth = 1.4;
  for (let x = r.cx - 12; x <= r.cx + 12; x += 6) ((ctx.beginPath(), ctx.moveTo(x, ny), ctx.lineTo(x, ny + 20)), ctx.stroke());
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(r.cx - 17, ny);
  ctx.lineTo(r.cx + 17, ny);
  ctx.lineTo(r.cx + 13, ny + 16);
  ctx.quadraticCurveTo(r.cx, ny + 20, r.cx - 13, ny + 16);
  ctx.closePath();
  inkStroke(ctx, st.ink, 2.6);
  ctx.beginPath();
  ctx.roundRect(r.cx - 19, ny - 3, 38, 6, 3);
  ctx.fillStyle = css(st.neon.length ? st.neon[0] : st.trim.base);
  ctx.fill();
  inkStroke(ctx, st.ink, 2);
}

function paintDeckModule(ctx: CanvasRenderingContext2D, L: ShipLayout, mi: ModuleInfo, st: ShipStyle) {
  const r = rectOf(mi);
  switch (mi.m.kind) {
    case 'catroom':
      return cabin(ctx, L, r, st);
    case 'cannon':
      return carriage(ctx, r, st, mi.embedded);
    case 'powder':
      return barrels(ctx, L, r, st, false);
    case 'core':
      pedestal(ctx, r, st);
      return coreWindow(ctx, r.cx, r.cy - 4, Math.min(r.w, r.h) * 0.36, st);
    case 'shield':
      return shieldGen(ctx, r, st);
    case 'engine':
      return engine(ctx, r, st, false);
    case 'arcane':
      pedestal(ctx, r, st);
      return runeWindow(ctx, r.cx, r.cy - 4, Math.min(r.w, r.h) * 0.34, st);
  }
}

function paintEmbeddedModule(ctx: CanvasRenderingContext2D, L: ShipLayout, mi: ModuleInfo, st: ShipStyle) {
  const r = rectOf(mi);
  switch (mi.m.kind) {
    case 'catroom':
      return niche(ctx, r, st);
    case 'core':
      return coreWindow(ctx, r.cx, r.cy, Math.min(r.w, r.h) * 0.4, st);
    case 'powder':
      return barrels(ctx, L, r, st, true);
    case 'shield':
      return shieldWindow(ctx, r, st);
    case 'engine':
      return engine(ctx, r, st, true);
    case 'arcane':
      return runeWindow(ctx, r.cx, r.cy, Math.min(r.w, r.h) * 0.38, st);
    case 'cannon':
      return gunport(ctx, r, st);
  }
}

function cabin(ctx: CanvasRenderingContext2D, L: ShipLayout, r: ReturnType<typeof rectOf>, st: ShipStyle) {
  const x0 = r.x + 5;
  const x1 = r.x + r.w - 5;
  const top = r.y + 20;
  const bottom = r.y + r.h + 10;
  // wall
  ctx.beginPath();
  ctx.rect(x0, top, x1 - x0, bottom - top);
  ctx.fillStyle = css(st.cabin.wall);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = css(st.cabin.wallShadow);
  ctx.fillRect(x0, top, 10, bottom - top);
  ctx.fillRect(x0, top, x1 - x0, 7);
  ctx.strokeStyle = css(st.cabin.wallShadow, 0.7);
  ctx.lineWidth = 1.3;
  if (st.feat.pattern === 'stone') {
    for (let y = top + 10, r2 = 0; y < bottom; y += 11, r2++) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      for (let x = x0 + (r2 % 2) * 9 + 9; x < x1; x += 18) {
        ctx.moveTo(x, y - 11);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (st.feat.pattern === 'bookshelf') {
    const cols = [0xb89558, 0x3f7a7a, 0xa8433f, 0xd9cdb8, 0x5a6fb0];
    for (let y = top + 12; y < bottom - 4; y += 16) {
      for (let x = x0 + 3, i = 0; x < x1 - 4; x += 5, i++) {
        ctx.fillStyle = css(cols[(i * 7 + Math.round(y)) % cols.length], 0.9);
        ctx.fillRect(x, y - 11 + (i % 3), 4, 11 - (i % 3));
      }
      ctx.fillStyle = css(st.wood.base);
      ctx.fillRect(x0, y, x1 - x0, 2.5);
    }
  } else for (let x = x0 + 13; x < x1; x += 12) ((ctx.beginPath(), ctx.moveTo(x, top), ctx.lineTo(x, bottom)), ctx.stroke());
  ctx.restore();
  ctx.beginPath();
  ctx.rect(x0, top, x1 - x0, bottom - top);
  inkStroke(ctx, st.ink, 3);
  // corner posts
  for (const px of [x0, x1 - 6]) {
    ctx.beginPath();
    ctx.rect(px, top, 6, bottom - top);
    ctx.fillStyle = css(st.trim.base);
    ctx.fill();
    inkStroke(ctx, st.ink, 1.8);
  }
  // door arch with warm light (the cat stands here)
  const dw = Math.min(46, (x1 - x0) * 0.58);
  const dh = (r.y + r.h - top) * 0.86;
  const by = r.y + r.h + 2;
  const arch = new Path2D();
  arch.moveTo(r.cx - dw / 2, by);
  arch.lineTo(r.cx - dw / 2, by - dh + dw / 2);
  arch.arc(r.cx, by - dh + dw / 2, dw / 2, Math.PI, 0);
  arch.lineTo(r.cx + dw / 2, by);
  arch.closePath();
  const g = ctx.createLinearGradient(0, by - dh, 0, by);
  g.addColorStop(0, css(st.window.glow));
  g.addColorStop(0.55, css(mix(st.window.glow, st.cabin.door, 0.55)));
  g.addColorStop(1, css(st.cabin.door));
  ctx.fillStyle = g;
  ctx.fill(arch);
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 8;
  ctx.stroke(arch);
  ctx.strokeStyle = css(st.trim.base);
  ctx.lineWidth = 4;
  ctx.stroke(arch);
  // tiny side windows
  if (x1 - x0 > 60) {
    for (const wx of [x0 + 13, x1 - 13]) {
      ctx.beginPath();
      ctx.arc(wx, top + 22, 5, 0, Math.PI * 2);
      ctx.fillStyle = css(st.window.glow);
      ctx.fill();
      inkStroke(ctx, st.ink, 2.2);
    }
  }
  // roof (per skin)
  const kind = st.feat.cabinRoof;
  if (kind === 'crenel') {
    // stone tower: battlement top
    ctx.beginPath();
    ctx.rect(r.x - 2, top - 6, r.w + 4, 12);
    ctx.fillStyle = css(st.trim.base);
    ctx.fill();
    inkStroke(ctx, st.ink, 2.6);
    for (let x = r.x - 2; x < r.x + r.w; x += 16) {
      ctx.beginPath();
      ctx.roundRect(x, top - 18, 10, 13, 1.5);
      ctx.fillStyle = css(st.trim.base);
      ctx.fill();
      ctx.fillStyle = css(st.trim.shadow);
      ctx.fillRect(x + 6, top - 16, 3, 10);
      ctx.beginPath();
      ctx.roundRect(x, top - 18, 10, 13, 1.5);
      inkStroke(ctx, st.ink, 2);
    }
    // a little banner
    ctx.beginPath();
    ctx.moveTo(r.cx, top - 18);
    ctx.lineTo(r.cx, top - 34);
    inkStroke(ctx, st.ink, 2);
    ctx.beginPath();
    ctx.moveTo(r.cx, top - 34);
    ctx.lineTo(r.cx - 13, top - 30);
    ctx.lineTo(r.cx, top - 26);
    ctx.closePath();
    ctx.fillStyle = css(st.flag.base);
    ctx.fill();
    inkStroke(ctx, st.ink, 1.6);
  } else if (kind === 'thatch') {
    const roof = new Path2D();
    roof.moveTo(r.x - 9, top + 6);
    roof.quadraticCurveTo(r.cx, r.y - 14, r.x + r.w + 9, top + 6);
    roof.closePath();
    ctx.fillStyle = css(st.cabin.roof);
    ctx.fill(roof);
    ctx.save();
    ctx.clip(roof);
    ctx.strokeStyle = css(st.cabin.roofShadow);
    ctx.lineWidth = 1.4;
    for (let x = r.x - 10; x < r.x + r.w + 10; x += 5) ((ctx.beginPath(), ctx.moveTo(x, top + 8), ctx.lineTo(x + (x - r.cx) * 0.25, r.y - 6)), ctx.stroke());
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 3;
    ctx.stroke(roof);
    // straw fringe
    ctx.strokeStyle = css(st.cabin.roofShadow);
    ctx.lineWidth = 1.6;
    for (let x = r.x - 7; x < r.x + r.w + 8; x += 4) ((ctx.beginPath(), ctx.moveTo(x, top + 5), ctx.lineTo(x + 1, top + 10 + (x % 3))), ctx.stroke());
  } else if (kind === 'dome') {
    const roof = new Path2D();
    roof.moveTo(r.x - 4, top + 5);
    roof.bezierCurveTo(r.x - 2, r.y - 10, r.x + r.w + 2, r.y - 10, r.x + r.w + 4, top + 5);
    roof.closePath();
    ctx.fillStyle = css(st.cabin.roof);
    ctx.fill(roof);
    ctx.save();
    ctx.clip(roof);
    ctx.fillStyle = css(st.cabin.roofShadow);
    ctx.fillRect(r.cx + 6, r.y - 12, r.w, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(r.cx - 12, r.y + 4, 7, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 3;
    ctx.stroke(roof);
    // finial
    ctx.beginPath();
    ctx.arc(r.cx, r.y - 6, 4, 0, Math.PI * 2);
    ctx.fillStyle = css(st.trim.base);
    ctx.fill();
    inkStroke(ctx, st.ink, 1.8);
    ctx.beginPath();
    ctx.rect(r.x - 4, top + 2, r.w + 8, 5);
    ctx.fillStyle = css(st.trim.base);
    ctx.fill();
    inkStroke(ctx, st.ink, 1.8);
  } else {
  // roof
    const roof = new Path2D();
    roof.moveTo(r.x - 7, top + 4);
    roof.lineTo(r.x + r.w + 7, top + 4);
    roof.lineTo(r.x + r.w - 3, r.y + 9);
    roof.quadraticCurveTo(r.cx, r.y - 1, r.x + 3, r.y + 9);
    roof.closePath();
    ctx.fillStyle = css(st.cabin.roof);
    ctx.fill(roof);
    ctx.save();
    ctx.clip(roof);
    ctx.fillStyle = css(st.cabin.roofShadow);
    ctx.fillRect(r.x - 10, top - 3, r.w + 20, 10);
    ctx.strokeStyle = css(st.cabin.roofShadow);
    ctx.lineWidth = 1.5;
    for (let x = r.x; x < r.x + r.w + 8; x += 9) ((ctx.beginPath(), ctx.moveTo(x, top + 4), ctx.lineTo(x + 3, r.y + 4)), ctx.stroke());
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(r.x + 8, r.y + 7, r.w * 0.45, 2.5);
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 3;
    ctx.stroke(roof);
    // scalloped trim under the eaves
    ctx.fillStyle = css(st.neon[0] ?? st.trim.base);
    for (let x = r.x - 4; x < r.x + r.w + 4; x += 9) {
      ctx.beginPath();
      ctx.arc(x + 4.5, top + 4, 4.2, 0, Math.PI);
      ctx.fill();
      inkStroke(ctx, st.ink, 1.4);
    }
  }
  // lantern on the bow-side corner
  const lx = x1 + 1;
  const ly = top + 14;
  ctx.beginPath();
  ctx.moveTo(lx, top + 5);
  ctx.lineTo(lx, ly - 5);
  inkStroke(ctx, st.ink, 1.5);
  ctx.beginPath();
  ctx.roundRect(lx - 4.5, ly - 5, 9, 12, 2.5);
  ctx.fillStyle = css(st.window.glow);
  ctx.fill();
  inkStroke(ctx, st.ink, 2);
  void L;
}

function niche(ctx: CanvasRenderingContext2D, r: ReturnType<typeof rectOf>, st: ShipStyle) {
  const w = r.w - 14;
  const h = r.h - 10;
  const x0 = r.cx - w / 2;
  const by = r.y + r.h - 3;
  const arch = new Path2D();
  arch.moveTo(x0, by);
  arch.lineTo(x0, by - h + w / 2);
  arch.arc(r.cx, by - h + w / 2, w / 2, Math.PI, 0);
  arch.lineTo(x0 + w, by);
  arch.closePath();
  const g = ctx.createRadialGradient(r.cx, by - h * 0.7, 2, r.cx, by - h * 0.4, h * 0.9);
  g.addColorStop(0, css(st.window.glow));
  g.addColorStop(0.35, css(mix(st.window.glow, st.interior.rib, 0.6)));
  g.addColorStop(1, css(st.interior.base));
  ctx.fillStyle = g;
  ctx.fill(arch);
  ctx.save();
  ctx.clip(arch);
  // inner back wall planks
  ctx.strokeStyle = css(st.interior.shade, 0.5);
  ctx.lineWidth = 1.4;
  for (let x = x0 + 9; x < x0 + w; x += 11) ((ctx.beginPath(), ctx.moveTo(x, by - h), ctx.lineTo(x, by)), ctx.stroke());
  // inner shadow under the arch
  ctx.strokeStyle = css(st.interior.shade, 0.55);
  ctx.lineWidth = 10;
  ctx.stroke(arch);
  // floor
  ctx.fillStyle = css(st.wood.shadow);
  ctx.fillRect(x0, by - 6, w, 6);
  ctx.restore();
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 9;
  ctx.stroke(arch);
  ctx.strokeStyle = css(st.neon[1] ?? st.trim.base);
  ctx.lineWidth = 4.5;
  ctx.stroke(arch);
  // keystone
  ctx.beginPath();
  ctx.moveTo(r.cx - 5, by - h - 4);
  ctx.lineTo(r.cx + 5, by - h - 4);
  ctx.lineTo(r.cx + 3.5, by - h + 6);
  ctx.lineTo(r.cx - 3.5, by - h + 6);
  ctx.closePath();
  ctx.fillStyle = css(st.trim.light);
  ctx.fill();
  inkStroke(ctx, st.ink, 2);
}

function coreWindow(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, st: ShipStyle) {
  // pipes
  ctx.lineCap = 'round';
  for (const [ax, ay] of [[-1, 0.9], [1, 0.9]]) {
    ctx.beginPath();
    ctx.moveTo(cx + ax * R * 0.6, cy + ay * R * 0.7);
    ctx.quadraticCurveTo(cx + ax * R * 1.1, cy + ay * R * 1.1, cx + ax * R * 1.25, cy + R * 1.2);
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = css(st.metal.base);
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, R + 4, 0, Math.PI * 2);
  ctx.fillStyle = css(st.ink);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = css(st.trim.base);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 1, cy + 1.5, R - 1.5, Math.PI * 0.05, Math.PI * 0.95);
  ctx.strokeStyle = css(st.trim.shadow);
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1.5, Math.PI * 1.1, Math.PI * 1.6);
  ctx.strokeStyle = css(st.trim.light);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 7, 0, Math.PI * 2);
  ctx.fillStyle = css(st.ink);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 9, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R - 9);
  g.addColorStop(0, css(mix(st.core.base, 0x000000, 0.35)));
  g.addColorStop(1, css(0x0c0814));
  ctx.fillStyle = g;
  ctx.fill();
  // bolts
  ctx.fillStyle = css(st.trim.shadow);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (R - 3.5), cy + Math.sin(a) * (R - 3.5), 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function runeWindow(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, st: ShipStyle) {
  coreWindow(ctx, cx, cy, R, { ...st, core: { ...st.core, base: 0x8a5cff } });
  ctx.save();
  ctx.strokeStyle = css(0xb79bff, 0.8);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function pedestal(ctx: CanvasRenderingContext2D, r: ReturnType<typeof rectOf>, st: ShipStyle) {
  ctx.beginPath();
  ctx.moveTo(r.x + 8, r.y + r.h + 10);
  ctx.lineTo(r.x + 13, r.y + r.h * 0.55);
  ctx.lineTo(r.x + r.w - 13, r.y + r.h * 0.55);
  ctx.lineTo(r.x + r.w - 8, r.y + r.h + 10);
  ctx.closePath();
  ctx.fillStyle = css(st.metal.base);
  ctx.fill();
  ctx.fillStyle = css(st.metal.shadow);
  ctx.fillRect(r.cx, r.y + r.h * 0.55, r.w / 2 - 13, r.h * 0.45 + 10);
  ctx.beginPath();
  ctx.moveTo(r.x + 8, r.y + r.h + 10);
  ctx.lineTo(r.x + 13, r.y + r.h * 0.55);
  ctx.lineTo(r.x + r.w - 13, r.y + r.h * 0.55);
  ctx.lineTo(r.x + r.w - 8, r.y + r.h + 10);
  ctx.closePath();
  inkStroke(ctx, st.ink, 2.6);
}

function barrels(ctx: CanvasRenderingContext2D, L: ShipLayout, r: ReturnType<typeof rectOf>, st: ShipStyle, embedded: boolean) {
  if (embedded) {
    ctx.beginPath();
    ctx.roundRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6, 5);
    ctx.fillStyle = css(st.interior.base);
    ctx.fill();
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = css(st.trim.shadow);
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  const cols = Math.max(1, Math.round(r.w / CELL));
  const rows = Math.max(1, Math.round(r.h / CELL));
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const bx = r.x + (i + 0.5) * CELL;
      const by = r.y + (j + 1) * CELL - (embedded ? 5 : 1);
      barrel(ctx, L, bx, by, 28, 32, st);
    }
}

function barrel(ctx: CanvasRenderingContext2D, L: ShipLayout, cx: number, by: number, w: number, h: number, st: ShipStyle) {
  const top = by - h;
  const p = new Path2D();
  p.moveTo(cx - w * 0.42, top);
  p.lineTo(cx + w * 0.42, top);
  p.quadraticCurveTo(cx + w * 0.62, by - h / 2, cx + w * 0.42, by);
  p.lineTo(cx - w * 0.42, by);
  p.quadraticCurveTo(cx - w * 0.62, by - h / 2, cx - w * 0.42, top);
  p.closePath();
  ctx.fillStyle = css(0x9c5a2c);
  ctx.fill(p);
  ctx.save();
  ctx.clip(p);
  ctx.fillStyle = css(0x6a3a1a);
  ctx.fillRect(cx + w * 0.1, top, w, h);
  ctx.fillStyle = css(0xc87a3e);
  ctx.fillRect(cx - w * 0.3, top, 3, h);
  // red danger band
  ctx.fillStyle = css(0xd8232e);
  ctx.fillRect(cx - w, by - h * 0.62, w * 2, h * 0.3);
  // hoops
  ctx.fillStyle = css(st.metal.base);
  ctx.fillRect(cx - w, top + 3, w * 2, 3.5);
  ctx.fillRect(cx - w, by - 6.5, w * 2, 3.5);
  ctx.restore();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 2.6;
  ctx.stroke(p);
  upright(ctx, L, cx, by - h * 0.47, () => {
    ctx.font = 'bold 9.5px Anton, "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = css(st.ink);
    ctx.strokeText('TNT', 0, 0.5);
    ctx.fillStyle = '#fff4d8';
    ctx.fillText('TNT', 0, 0.5);
  });
  // lid
  ctx.beginPath();
  ctx.ellipse(cx, top, w * 0.42, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = css(0xc87a3e);
  ctx.fill();
  inkStroke(ctx, st.ink, 2);
}

function carriage(ctx: CanvasRenderingContext2D, r: ReturnType<typeof rectOf>, st: ShipStyle, _emb: boolean) {
  const by = r.y + r.h + 6;
  const x0 = r.x + 6;
  const x1 = r.x + Math.min(r.w - 10, 54);
  const p = new Path2D();
  p.moveTo(x0, by);
  p.lineTo(x0 + 4, by - 17);
  p.lineTo(x1 - 6, by - 19);
  p.lineTo(x1, by);
  p.closePath();
  ctx.fillStyle = css(st.wood.base);
  ctx.fill(p);
  ctx.save();
  ctx.clip(p);
  ctx.fillStyle = css(st.wood.shadow);
  ctx.fillRect(x0, by - 7, x1 - x0, 8);
  ctx.restore();
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.stroke(p);
  for (const wx of [x0 + 9, x1 - 9]) {
    ctx.beginPath();
    ctx.arc(wx, by - 4, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = css(st.metal.base);
    ctx.fill();
    inkStroke(ctx, st.ink, 2.4);
    ctx.beginPath();
    ctx.arc(wx, by - 4, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = css(st.trim.base);
    ctx.fill();
  }
}

function gunport(ctx: CanvasRenderingContext2D, r: ReturnType<typeof rectOf>, st: ShipStyle) {
  const s = Math.min(r.h - 10, 28);
  const x = r.x + r.w - CELL / 2 - s / 2;
  const y = r.cy - s / 2;
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, 3);
  ctx.fillStyle = css(st.interior.base);
  ctx.fill();
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = css(st.trim.base);
  ctx.lineWidth = 3.5;
  ctx.stroke();
}

function shieldGen(ctx: CanvasRenderingContext2D, r: ReturnType<typeof rectOf>, st: ShipStyle) {
  const by = r.y + r.h + 8;
  const bw = Math.min(r.w - 6, 40);
  ctx.beginPath();
  ctx.roundRect(r.cx - bw / 2, by - 18, bw, 18, 3);
  ctx.fillStyle = css(st.metal.base);
  ctx.fill();
  ctx.fillStyle = css(st.metal.shadow);
  ctx.fillRect(r.cx, by - 16, bw / 2 - 2, 14);
  ctx.beginPath();
  ctx.roundRect(r.cx - bw / 2, by - 18, bw, 18, 3);
  inkStroke(ctx, st.ink, 2.4);
  const R = Math.min(bw / 2 - 2, (r.h - 20) * 0.7);
  ctx.beginPath();
  ctx.arc(r.cx, by - 18, R, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = css(0x00e5ff, 0.38);
  ctx.fill();
  inkStroke(ctx, st.ink, 2.4);
  ctx.beginPath();
  ctx.moveTo(r.cx, by - 18 - R * 0.75);
  ctx.lineTo(r.cx + 5, by - 22);
  ctx.lineTo(r.cx, by - 19);
  ctx.lineTo(r.cx - 5, by - 22);
  ctx.closePath();
  ctx.fillStyle = css(0x9ff6ff);
  ctx.fill();
  inkStroke(ctx, st.ink, 1.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(r.cx, by - 18, R - 4, Math.PI * 1.15, Math.PI * 1.4);
  ctx.stroke();
}

function shieldWindow(ctx: CanvasRenderingContext2D, r: ReturnType<typeof rectOf>, st: ShipStyle) {
  coreWindow(ctx, r.cx, r.cy, Math.min(r.w, r.h) * 0.38, { ...st, core: { ...st.core, base: 0x00e5ff } });
}

function engine(ctx: CanvasRenderingContext2D, r: ReturnType<typeof rectOf>, st: ShipStyle, embedded: boolean) {
  const x0 = r.x + 4;
  const y0 = r.y + (embedded ? 4 : 10);
  const w = r.w - 8;
  const h = r.h - (embedded ? 8 : 2);
  if (!embedded) {
    // smokestack
    ctx.beginPath();
    ctx.rect(r.x + r.w - 20, r.y - 6, 11, 22);
    ctx.fillStyle = css(st.metal.base);
    ctx.fill();
    inkStroke(ctx, st.ink, 2.2);
    ctx.beginPath();
    ctx.rect(r.x + r.w - 22, r.y - 9, 15, 5);
    ctx.fillStyle = css(st.neon[0] ?? 0xd8232e);
    ctx.fill();
    inkStroke(ctx, st.ink, 1.8);
  }
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 7);
  ctx.fillStyle = css(st.metal.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = css(st.metal.shadow);
  ctx.fillRect(x0, y0 + h - 9, w, 9);
  ctx.fillStyle = css(st.metal.light);
  ctx.fillRect(x0 + 4, y0 + 3, w - 8, 3);
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 7);
  inkStroke(ctx, st.ink, 2.6);
  // furnace hatch with glow
  const hr = Math.min(w, h) * 0.3;
  const hx = r.x + Math.min(r.w, 40) / 2 + 2;
  const hy = y0 + h / 2;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(hx, hy, 1, hx, hy, hr);
  g.addColorStop(0, '#fff2a8');
  g.addColorStop(0.5, css(0xff8a1a));
  g.addColorStop(1, css(0xb8300e));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 1.6;
  for (let k = -1; k <= 1; k++) ((ctx.beginPath(), ctx.moveTo(hx - hr * 0.8, hy + k * hr * 0.45), ctx.lineTo(hx + hr * 0.8, hy + k * hr * 0.45)), ctx.stroke());
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  inkStroke(ctx, st.ink, 3);
  // gauge
  if (w > 50) {
    const gx = x0 + w - 14;
    const gy = y0 + 13;
    ctx.beginPath();
    ctx.arc(gx, gy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f4ead8';
    ctx.fill();
    inkStroke(ctx, st.ink, 1.8);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 3.5, gy - 3);
    inkStroke(ctx, 0xd8232e, 1.5);
  }
  // rivets
  ctx.fillStyle = css(st.metal.light);
  for (let x = x0 + 6; x < x0 + w - 4; x += 9) ((ctx.beginPath(), ctx.arc(x, y0 + h - 4.5, 1.4, 0, Math.PI * 2)), ctx.fill());
}

// ---------------------------------------------------------------- interior plate

export function paintInterior(T: PaintTarget, L: ShipLayout, st: ShipStyle) {
  const ctx = T.ctx;
  ctx.clearRect(0, 0, T.canvas.width, T.canvas.height);
  if (st.feat.noInterior) return;
  shipXf(ctx, T, L);
  const shape = new Path2D();
  for (const loop of L.outline) {
    loop.forEach((q, i) => (i ? shape.lineTo(q[0], q[1]) : shape.moveTo(q[0], q[1])));
    shape.closePath();
  }
  for (const mi of L.modules) {
    if (mi.embedded || mi.m.kind === 'mast' || mi.m.kind === 'cannon') continue;
    const r = rectOf(mi);
    shape.rect(r.x + 5, r.y + 18, r.w - 10, r.h - 8);
  }
  ctx.fillStyle = css(st.interior.base);
  ctx.fill(shape, 'nonzero');
  ctx.save();
  ctx.clip(shape, 'nonzero');
  // horizontal deck beams every 2 rows
  for (let y = CELL * 2; y < L.hPx; y += CELL * 2) {
    ctx.fillStyle = css(st.interior.rib);
    ctx.fillRect(-10, y - 5, L.wPx + 20, 9);
    ctx.fillStyle = css(st.interior.shade);
    ctx.fillRect(-10, y + 4, L.wPx + 20, 4);
  }
  // ribs (costillas)
  for (let x = 14; x < L.wPx; x += CELL) {
    ctx.beginPath();
    ctx.moveTo(x - 4, -10);
    ctx.quadraticCurveTo(x + 3, L.hPx * 0.6, x - 2, L.hPx + 20);
    ctx.lineTo(x + 6, L.hPx + 20);
    ctx.quadraticCurveTo(x + 11, L.hPx * 0.6, x + 4, -10);
    ctx.closePath();
    ctx.fillStyle = css(st.interior.rib);
    ctx.fill();
    ctx.strokeStyle = css(st.interior.shade);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // shade from above
  const g = ctx.createLinearGradient(0, 0, 0, L.hPx);
  g.addColorStop(0, css(st.interior.shade, 0.5));
  g.addColorStop(0.4, css(st.interior.shade, 0));
  g.addColorStop(1, css(st.interior.shade, 0.6));
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, L.wPx + 40, L.hPx + 40);
  ctx.restore();
}
