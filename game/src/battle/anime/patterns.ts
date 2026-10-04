/**
 * Hull surface patterns per skin (GDD §2.8 "relleno por material"): planks, plates, lashed logs,
 * varnished wood with rope bands, masonry with moss, rubber (duck wing), bookshelves, bone ribs,
 * black lacquer, arcane coral (+ gold-foil runes), static.
 * Called inside paintHull with the context clipped to the hull body, in ship space.
 */
import { CELL } from '../ship';
import { ShipLayout } from './layout';
import { ShipStyle } from './styles';
import { css, hash, mix } from './util';

export interface PatternCtx {
  ctx: CanvasRenderingContext2D;
  L: ShipLayout;
  st: ShipStyle;
  plankY: (x: number, k: number) => number;
  nPl: number;
  R: () => number;
  waterY: number;
  /** device px per ship px (for shadowBlur) */
  res: number;
}

/** returns true when the pattern covered the cel shading and wants a re-shade pass */
export function paintPattern(p: PatternCtx): boolean {
  switch (p.st.feat.pattern) {
    case 'planks':
      planks(p, 1.9, 74);
      grain(p);
      return false;
    case 'panels':
      planks(p, 1.9, 46, true);
      return false;
    case 'logs':
      logs(p);
      return false;
    case 'varnish':
      planks(p, 1.5, 80);
      grain(p);
      varnish(p);
      return false;
    case 'stone':
      stone(p);
      return false;
    case 'rubber':
      rubber(p);
      return false;
    case 'bookshelf':
      bookshelf(p);
      return true;
    case 'ribs':
      ribs(p);
      return true;
    case 'lacquer':
      lacquer(p);
      return false;
    case 'coral':
      coral(p);
      return false;
    case 'static':
      staticNoise(p);
      return false;
  }
  return false;
}

function curve(p: PatternCtx, k: number, a = 0, b = 1) {
  const { ctx, L } = p;
  const len = L.maxX - L.minX;
  ctx.beginPath();
  let on = false;
  for (let x = Math.round(L.minX + len * a); x <= L.minX + len * b; x += 3) {
    if (Number.isNaN(L.topS[x])) {
      on = false;
      continue;
    }
    const y = p.plankY(x, k);
    on ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    on = true;
  }
}

function planks(p: PatternCtx, w: number, seam: number, rivets = false) {
  const { ctx, L, st, nPl } = p;
  ctx.strokeStyle = css(st.hull.plank, 0.85);
  ctx.lineWidth = w;
  for (let k = 1; k < nPl; k++) {
    curve(p, k);
    ctx.stroke();
  }
  ctx.lineWidth = 1.5;
  for (let k = 0; k < nPl; k++) {
    for (let x0 = L.minX + ((k * 37) % seam) + 10; x0 < L.maxX - 6; x0 += seam) {
      const x = Math.round(x0);
      if (Number.isNaN(L.topS[x])) continue;
      const y0 = p.plankY(x, k);
      const y1 = p.plankY(x, k + 1);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x + 1, y1);
      ctx.stroke();
      if (rivets) {
        ctx.fillStyle = css(st.hull.light, 0.8);
        ctx.beginPath();
        ctx.arc(x + 4, y0 + 3.5, 1.3, 0, Math.PI * 2);
        ctx.arc(x + 4, y1 - 3.5, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function grain(p: PatternCtx) {
  const { ctx, L, st, nPl, R } = p;
  const len = L.maxX - L.minX;
  ctx.strokeStyle = css(st.hull.light, 0.3);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < len / 9; i++) {
    const x = Math.round(L.minX + R() * len);
    if (Number.isNaN(L.topS[x])) continue;
    const k = Math.floor(R() * nPl);
    const y = (p.plankY(x, k) + p.plankY(x, k + 1)) / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6 + R() * 10, y + (R() - 0.5) * 1.5);
    ctx.stroke();
  }
}

function rope(p: PatternCtx, path: () => void, w = 5) {
  const { ctx, st } = p;
  path();
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = w + 2.6;
  ctx.stroke();
  path();
  ctx.strokeStyle = css(st.accent.base);
  ctx.lineWidth = w;
  ctx.stroke();
  path();
  ctx.setLineDash([2, 4]);
  ctx.strokeStyle = css(st.accent.shadow);
  ctx.lineWidth = w * 0.8;
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Mk1 raft: chunky boards with bevels + vertical rope lashings */
function logs(p: PatternCtx) {
  const { ctx, L, st, nPl, R } = p;
  for (let k = 0; k < nPl; k++) {
    // board tint variation
    ctx.fillStyle = css(k % 2 ? st.hull.light : st.hull.shadow, 0.18);
    ctx.beginPath();
    let first = true;
    for (let x = L.minX; x <= L.maxX; x += 4) {
      if (Number.isNaN(L.topS[x])) continue;
      first ? ctx.moveTo(x, p.plankY(x, k)) : ctx.lineTo(x, p.plankY(x, k));
      first = false;
    }
    for (let x = L.maxX; x >= L.minX; x -= 4) {
      if (Number.isNaN(L.topS[x])) continue;
      ctx.lineTo(x, p.plankY(x, k + 1));
    }
    ctx.closePath();
    ctx.fill();
  }
  for (let k = 1; k < nPl; k++) {
    curve(p, k);
    ctx.strokeStyle = css(st.ink, 0.8);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.save();
    ctx.translate(0, 2.4);
    curve(p, k);
    ctx.strokeStyle = css(st.hull.light, 0.6);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
  }
  grain(p);
  // knots
  ctx.strokeStyle = css(st.hull.plank, 0.8);
  ctx.lineWidth = 1.3;
  for (let i = 0; i < (L.maxX - L.minX) / 50; i++) {
    const x = Math.round(L.minX + R() * (L.maxX - L.minX));
    if (Number.isNaN(L.topS[x])) continue;
    const k = Math.floor(R() * nPl);
    const y = (p.plankY(x, k) + p.plankY(x, k + 1)) / 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 3.2, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // rope lashings
  for (let x = L.minX + 46; x < L.maxX - 30; x += 92) {
    const t = L.topS[Math.round(x)];
    if (Number.isNaN(t)) continue;
    rope(p, () => {
      ctx.beginPath();
      ctx.moveTo(x - 4, t + 6);
      ctx.quadraticCurveTo(x + 3, (t + p.waterY) / 2, x - 2, p.waterY + 4);
    }, 4.5);
  }
}

/** Mk2 sloop: cream sheer stripe + rope bands */
function varnish(p: PatternCtx) {
  const { ctx, L, st, nPl } = p;
  // cream stripe under the gunwale
  ctx.beginPath();
  let first = true;
  for (let x = L.minX; x <= L.maxX; x += 3) {
    if (Number.isNaN(L.topS[x])) continue;
    first ? ctx.moveTo(x, p.plankY(x, 0.45)) : ctx.lineTo(x, p.plankY(x, 0.45));
    first = false;
  }
  for (let x = L.maxX; x >= L.minX; x -= 3) {
    if (Number.isNaN(L.topS[x])) continue;
    ctx.lineTo(x, p.plankY(x, 1.05));
  }
  ctx.closePath();
  ctx.fillStyle = css(st.stripe);
  ctx.fill();
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 1.8;
  ctx.stroke();
  rope(p, () => curve(p, Math.max(2, nPl - 2.2)), 4);
}

/** Guardia de Piedra: level masonry rows, mortar, chips, moss */
function stone(p: PatternCtx) {
  const { ctx, L, st, waterY } = p;
  const rowH = 17;
  let top = Infinity;
  for (let x = L.minX; x <= L.maxX; x++) if (!Number.isNaN(L.topY[x])) top = Math.min(top, L.topY[x]);
  for (let r = 0, y = top + 13; y < waterY + 30; r++, y += rowH) {
    let x = L.minX - 30 + (r % 2) * 17;
    let i = 0;
    while (x < L.maxX + 30) {
      const w = 26 + hash(r, i, 3) * 18;
      const v = hash(r, i, 5);
      ctx.fillStyle = css(v > 0.5 ? st.hull.light : st.hull.deep, 0.08 + (v % 0.25) * 0.5);
      ctx.beginPath();
      ctx.roundRect(x + 1.5, y + 1.5, w - 3, rowH - 3, 3);
      ctx.fill();
      ctx.strokeStyle = css(st.ink, 0.6);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // bevel highlight
      ctx.strokeStyle = css(st.hull.light, 0.55);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + rowH - 4);
      ctx.lineTo(x + 4, y + 3.5);
      ctx.lineTo(x + w - 5, y + 3.5);
      ctx.stroke();
      if (hash(r, i, 9) > 0.82) {
        ctx.strokeStyle = css(st.ink, 0.7);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.4, y + 2);
        ctx.lineTo(x + w * 0.5, y + rowH * 0.5);
        ctx.lineTo(x + w * 0.42, y + rowH - 2);
        ctx.stroke();
      }
      x += w;
      i++;
    }
  }
  moss(p, top);
}

function moss(p: PatternCtx, top: number) {
  const { ctx, L, st, waterY } = p;
  const blob = (x: number, y: number, r: number, drip: boolean) => {
    ctx.fillStyle = css(st.accent.base);
    ctx.beginPath();
    for (let k = 0; k < 4; k++) ctx.ellipse(x + (k - 1.5) * r * 0.7, y + Math.sin(k * 2.1) * r * 0.25, r * 0.65, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    if (drip) {
      ctx.beginPath();
      ctx.moveTo(x - 2, y);
      ctx.quadraticCurveTo(x - 2.5, y + r * 1.4, x, y + r * 1.9);
      ctx.quadraticCurveTo(x + 2.5, y + r * 1.4, x + 2, y);
      ctx.fill();
    }
    ctx.fillStyle = css(st.accent.light, 0.8);
    ctx.beginPath();
    ctx.ellipse(x - r * 0.4, y - r * 0.15, r * 0.3, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let x = L.minX + 10; x < L.maxX; x += 22 + hash(x, 3) * 30) {
    const t = L.topY[Math.round(x)];
    if (Number.isNaN(t)) continue;
    if (hash(x, 7) > 0.35) blob(x, t + 15, 7 + hash(x, 8) * 5, hash(x, 9) > 0.5);
  }
  for (let x = L.minX + 6; x < L.maxX; x += 16) blob(x, waterY - 4, 5 + hash(x, 11) * 3, false);
  void top;
}

/** El Patito: glossy rubber with a big cartoon wing */
function rubber(p: PatternCtx) {
  const { ctx, L, st, waterY } = p;
  const len = L.maxX - L.minX;
  const cx = L.minX + len * 0.42;
  const t = L.topS[Math.round(cx)];
  if (!Number.isNaN(t)) {
    const cy = t + (waterY - t) * 0.45;
    const w = Math.min(130, len * 0.34);
    const h = Math.min(46, (waterY - t) * 0.55);
    const wing = new Path2D();
    wing.moveTo(cx + w * 0.5, cy - h * 0.45);
    wing.quadraticCurveTo(cx, cy - h * 0.75, cx - w * 0.5, cy - h * 0.1);
    // scalloped feather tips toward the stern
    for (let i = 0; i < 4; i++) {
      const x0 = cx - w * 0.5 + i * w * 0.16;
      wing.quadraticCurveTo(x0 + w * 0.02, cy + h * 0.55, x0 + w * 0.16, cy + h * (0.25 - i * 0.04));
    }
    wing.quadraticCurveTo(cx + w * 0.42, cy + h * 0.25, cx + w * 0.5, cy - h * 0.45);
    wing.closePath();
    ctx.fillStyle = css(st.accent.base);
    ctx.fill(wing);
    ctx.save();
    ctx.clip(wing);
    ctx.fillStyle = css(st.accent.shadow);
    ctx.fillRect(cx - w, cy + h * 0.1, w * 2, h);
    ctx.restore();
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke(wing);
    ctx.strokeStyle = css(st.accent.shadow);
    ctx.lineWidth = 1.6;
    for (let i = 1; i < 4; i++) {
      const x0 = cx - w * 0.5 + i * w * 0.16;
      ctx.beginPath();
      ctx.moveTo(x0 + w * 0.06, cy + h * 0.15);
      ctx.quadraticCurveTo(x0 + w * 0.2, cy - h * 0.2, x0 + w * 0.42, cy - h * 0.35);
      ctx.stroke();
    }
  }
  // mold seam
  ctx.strokeStyle = css(st.hull.light, 0.6);
  ctx.lineWidth = 1.5;
  curve(p, p.nPl * 0.62);
  ctx.stroke();
}

/** Biblioteca Hundida: hull built from bookshelves + crystal clusters */
function bookshelf(p: PatternCtx) {
  const { ctx, L, st, waterY, R } = p;
  const colors = [0xb89558, 0x8f6b93, 0x3f7a7a, 0xa8433f, 0xd9cdb8, 0x5a6fb0, 0x6a8f3f, 0xc49bff];
  const rowH = 24;
  let top = Infinity;
  for (let x = L.minX; x <= L.maxX; x++) if (!Number.isNaN(L.topY[x])) top = Math.min(top, L.topY[x]);
  for (let y = top + 16; y < waterY + 30; y += rowH) {
    let x = L.minX - 10 + R() * 6;
    while (x < L.maxX + 10) {
      const bw = 4 + R() * 6;
      const bh = 14 + R() * 6;
      if (R() < 0.08) {
        x += 6;
        continue;
      }
      const lean = R() < 0.1 ? (R() - 0.5) * 0.4 : 0;
      ctx.save();
      ctx.translate(x, y + rowH - 4);
      ctx.rotate(lean);
      const c = colors[Math.floor(R() * colors.length)];
      ctx.fillStyle = css(c);
      ctx.fillRect(0, -bh, bw, bh);
      ctx.fillStyle = css(mix(c, 0x000000, 0.35));
      ctx.fillRect(bw * 0.6, -bh, bw * 0.4, bh);
      ctx.fillStyle = css(0xe6c98a, 0.85);
      ctx.fillRect(0, -bh + 3, bw, 1.4);
      ctx.fillRect(0, -4, bw, 1.4);
      ctx.strokeStyle = css(st.ink, 0.85);
      ctx.lineWidth = 1;
      ctx.strokeRect(0, -bh, bw, bh);
      ctx.restore();
      x += bw + 0.6;
    }
    // shelf board
    ctx.fillStyle = css(st.wood.base);
    ctx.fillRect(L.minX - 20, y + rowH - 4, L.maxX - L.minX + 40, 4.5);
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(L.minX - 20, y + rowH - 4, L.maxX - L.minX + 40, 4.5);
    ctx.fillStyle = css(st.wood.light, 0.7);
    ctx.fillRect(L.minX - 20, y + rowH - 3.5, L.maxX - L.minX + 40, 1.2);
  }
  // crystal clusters (bow and stern, above the water)
  for (const fx of [0.1, 0.86]) {
    const cx = L.minX + (L.maxX - L.minX) * fx;
    crystalCluster(p, cx, waterY - 10, 1);
  }
}

export function crystalCluster(p: PatternCtx, cx: number, by: number, s: number) {
  const { ctx, st } = p;
  const shards: [number, number, number, number][] = [
    [-9, 18, 0.35, 6],
    [0, 28, -0.05, 8],
    [9, 20, -0.4, 6],
    [-3, 14, 0.7, 4.5],
  ];
  ctx.save();
  ctx.shadowColor = css(st.accent.base);
  ctx.shadowBlur = 10 * p.res;
  for (const [dx, h, a, w] of shards) {
    ctx.save();
    ctx.translate(cx + dx * s, by);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-w * s, 0);
    ctx.lineTo(-w * 0.8 * s, -h * 0.7 * s);
    ctx.lineTo(0, -h * s);
    ctx.lineTo(w * 0.8 * s, -h * 0.7 * s);
    ctx.lineTo(w * s, 0);
    ctx.closePath();
    ctx.fillStyle = css(st.accent.base);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = css(st.accent.shadow);
    ctx.beginPath();
    ctx.moveTo(0, -h * s);
    ctx.lineTo(w * 0.8 * s, -h * 0.7 * s);
    ctx.lineTo(w * s, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-w * s, 0);
    ctx.lineTo(-w * 0.8 * s, -h * 0.7 * s);
    ctx.lineTo(0, -h * s);
    ctx.lineTo(w * 0.8 * s, -h * 0.7 * s);
    ctx.lineTo(w * s, 0);
    ctx.stroke();
    ctx.strokeStyle = css(st.accent.light);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5 * s, -h * 0.15 * s);
    ctx.lineTo(-w * 0.45 * s, -h * 0.6 * s);
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 10 * p.res;
  }
  ctx.restore();
}

/** La Marea Sin Nombre: bone rib cage over rotten planks, vertebrae keel */
function ribs(p: PatternCtx) {
  const { ctx, L, st, waterY } = p;
  planks(p, 1.6, 60);
  const bone = st.accent;
  for (let x = L.minX + 22; x < L.maxX - 12; x += 34) {
    const xi = Math.round(x);
    const t = L.topS[xi];
    if (Number.isNaN(t)) continue;
    const b = Math.min(L.botS[xi], waterY + 26);
    const bend = ((x - (L.minX + L.maxX) / 2) / (L.maxX - L.minX)) * 18;
    const rib = new Path2D();
    rib.moveTo(x - 5, t + 8);
    rib.quadraticCurveTo(x - 5 + bend, (t + b) / 2, x - 3, b);
    rib.lineTo(x + 3, b);
    rib.quadraticCurveTo(x + 4 + bend, (t + b) / 2, x + 5, t + 8);
    rib.closePath();
    ctx.fillStyle = css(bone.base);
    ctx.fill(rib);
    ctx.save();
    ctx.clip(rib);
    ctx.fillStyle = css(bone.shadow);
    ctx.fillRect(x + 1 + bend * 0.5, t, 8, b - t);
    ctx.restore();
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 2.2;
    ctx.stroke(rib);
    // knob joint
    ctx.beginPath();
    ctx.ellipse(x, t + 9, 6.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = css(bone.light);
    ctx.fill();
    ctx.stroke();
  }
  // vertebrae keel at the waterline
  for (let x = L.minX + 8; x < L.maxX - 6; x += 15) {
    ctx.beginPath();
    ctx.roundRect(x, waterY - 15, 12, 10, 4);
    ctx.fillStyle = css(bone.base);
    ctx.fill();
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 6, waterY - 15);
    ctx.lineTo(x + 6, waterY - 21);
    ctx.stroke();
  }
}

/** Bandera Negra: black lacquer with gold pinstripes and a faint damask */
function lacquer(p: PatternCtx) {
  const { ctx, L, st, nPl, waterY } = p;
  ctx.strokeStyle = css(st.hull.light, 0.28);
  ctx.lineWidth = 1.2;
  for (let k = 1; k < nPl; k++) {
    curve(p, k);
    ctx.stroke();
  }
  // damask motifs
  ctx.fillStyle = css(st.accent.shadow, 0.35);
  let top = Infinity;
  for (let x = L.minX; x <= L.maxX; x++) if (!Number.isNaN(L.topY[x])) top = Math.min(top, L.topY[x]);
  for (let y = top + 30, r = 0; y < waterY - 10; y += 26, r++) {
    for (let x = L.minX + (r % 2) * 18; x < L.maxX; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.quadraticCurveTo(x + 5, y - 2, x, y + 7);
      ctx.quadraticCurveTo(x - 5, y - 2, x, y - 7);
      ctx.moveTo(x - 7, y);
      ctx.quadraticCurveTo(x, y + 2.5, x + 7, y);
      ctx.quadraticCurveTo(x, y - 2.5, x - 7, y);
      ctx.fill();
    }
  }
  for (const k of [0.9, nPl - 1.7]) {
    curve(p, k);
    ctx.strokeStyle = css(st.trim.base);
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  // lace band hanging from the gunwale
  for (let x = L.minX + 6; x < L.maxX - 4; x += 9) {
    const t = L.topY[Math.round(x)];
    if (Number.isNaN(t)) continue;
    ctx.beginPath();
    ctx.arc(x, t + 14, 4.6, 0, Math.PI);
    ctx.fillStyle = css(st.accent.base);
    ctx.fill();
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = css(st.hull.base);
    ctx.beginPath();
    ctx.arc(x, t + 15.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Mk5-6 coral: pores, turquoise branches, glowing veins, optional gold-foil runes */
function coral(p: PatternCtx) {
  const { ctx, L, st, R, waterY, nPl } = p;
  const len = L.maxX - L.minX;
  // pores / bumps
  for (let i = 0; i < len / 3; i++) {
    const x = L.minX + R() * len;
    const xi = Math.round(x);
    const t = L.topS[xi];
    if (Number.isNaN(t)) continue;
    const y = t + 16 + R() * (Math.min(L.botS[xi], waterY + 20) - t - 16);
    const r = 1.5 + R() * 3.5;
    ctx.fillStyle = css(st.hull.light, 0.55);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = css(st.hull.deep, 0.45);
    ctx.beginPath();
    ctx.arc(x + r * 0.25, y + r * 0.3, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  // glowing veins
  const glow = st.feat.glow ?? st.accent.base;
  ctx.save();
  ctx.shadowColor = css(glow);
  ctx.shadowBlur = 10 * p.res;
  ctx.strokeStyle = css(mix(glow, 0xffffff, 0.35));
  ctx.lineWidth = 2.2;
  for (const k of [1.4, nPl - 2.4]) {
    ctx.beginPath();
    let on = false;
    for (let x = L.minX + 10; x <= L.maxX - 10; x += 4) {
      if (Number.isNaN(L.topS[x])) {
        on = false;
        continue;
      }
      const y = p.plankY(x, k) + Math.sin(x * 0.05 + k) * 4;
      on ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      on = true;
    }
    ctx.stroke();
  }
  ctx.restore();
  // turquoise branching coral along the lower hull
  const branch = (x: number, y: number, a: number, l: number, depth: number) => {
    const x2 = x + Math.cos(a) * l;
    const y2 = y + Math.sin(a) * l;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = css(st.ink);
    ctx.lineWidth = 3 + depth * 2 + 2.4;
    ctx.stroke();
    ctx.strokeStyle = css(st.accent.base);
    ctx.lineWidth = 3 + depth * 2;
    ctx.stroke();
    if (depth > 0) {
      branch(x2, y2, a - 0.5, l * 0.7, depth - 1);
      branch(x2, y2, a + 0.45, l * 0.65, depth - 1);
    }
  };
  for (let x = L.minX + 30; x < L.maxX - 20; x += 60 + hash(x, 2) * 40) branch(x, waterY + 8, -Math.PI / 2 + (hash(x, 3) - 0.5) * 0.5, 17, 2);
  if (st.feat.runes) {
    const k = nPl * 0.42;
    for (let x = L.minX + 40, i = 0; x < L.maxX - 30; x += 44, i++) {
      const xi = Math.round(x);
      if (Number.isNaN(L.topS[xi])) continue;
      rune(p, x, p.plankY(xi, k), i);
    }
  }
}

function rune(p: PatternCtx, x: number, y: number, i: number) {
  const { ctx, st } = p;
  const g = new Path2D();
  const kind = i % 4;
  if (kind === 0) {
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.moveTo(x, y - 9);
    g.lineTo(x, y + 9);
  } else if (kind === 1) {
    g.moveTo(x - 7, y + 6);
    g.lineTo(x, y - 8);
    g.lineTo(x + 7, y + 6);
    g.moveTo(x - 4, y + 1);
    g.lineTo(x + 4, y + 1);
  } else if (kind === 2) {
    g.moveTo(x - 6, y - 7);
    g.lineTo(x + 6, y + 7);
    g.moveTo(x + 6, y - 7);
    g.lineTo(x - 6, y + 7);
    g.moveTo(x - 8, y);
    g.lineTo(x + 8, y);
  } else {
    g.moveTo(x, y - 8);
    g.quadraticCurveTo(x + 9, y, x, y + 8);
    g.quadraticCurveTo(x - 9, y, x, y - 8);
    g.arc(x, y, 2, 0, Math.PI * 2);
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(st.ink);
  ctx.lineWidth = 4.6;
  ctx.stroke(g);
  ctx.strokeStyle = css(st.trim.base);
  ctx.lineWidth = 2.4;
  ctx.stroke(g);
  ctx.strokeStyle = css(st.trim.light);
  ctx.lineWidth = 0.9;
  ctx.stroke(g);
}

/** ???: static noise, scanlines and glitch bars */
function staticNoise(p: PatternCtx) {
  const { ctx, L, st, R, waterY } = p;
  let top = Infinity;
  for (let x = L.minX; x <= L.maxX; x++) if (!Number.isNaN(L.topY[x])) top = Math.min(top, L.topY[x]);
  const h = waterY + 60 - top;
  const len = L.maxX - L.minX;
  for (let i = 0; i < (len * h) / 26; i++) {
    const x = L.minX + R() * len;
    const y = top + R() * h;
    const v = R();
    ctx.fillStyle = v > 0.7 ? 'rgba(255,255,255,0.75)' : v > 0.35 ? 'rgba(160,160,170,0.5)' : 'rgba(60,60,70,0.6)';
    ctx.fillRect(x, y, 1 + R() * 1.5, 1 + R());
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = top; y < top + h; y += 4) ctx.fillRect(L.minX - 20, y, len + 40, 1.4);
  for (let i = 0; i < 9; i++) {
    const y = top + R() * h;
    const x = L.minX + R() * len;
    ctx.fillStyle = css(i % 3 ? st.accent.base : 0x00e5ff, 0.75);
    ctx.fillRect(x, y, 20 + R() * 110, 1.5 + R() * 3.5);
  }
  void CELL;
}
