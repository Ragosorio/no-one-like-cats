/**
 * Geometry derived from a ShipModel's logical grid:
 *  - which cells are "hull body" vs superstructure,
 *  - the smoothed (curvy) hull outline,
 *  - heightfields (top / bottom of hull per x),
 *  - the jittered lattice that gives each cell an irregular polygon whose vertices are
 *    shared with its neighbours (pieces fit perfectly when intact, show jagged rips when broken).
 *
 * "Ship space": x grows toward the bow (unflipped). "Local space": the view's own coords
 * (x mirrored when flip). The painter works in ship space, pieces in local space.
 */
import { CELL, ModuleInst, ShipModel, Material } from '../ship';
import { Pt, hash, shash, roundPoly } from './util';

export interface ModuleInfo {
  m: ModuleInst;
  /** sits inside the hull (true) or stands on deck as superstructure (false) */
  embedded: boolean;
}

export interface ShipLayout {
  cols: number;
  rows: number;
  flip: boolean;
  wPx: number;
  hPx: number;
  filled: boolean[][];
  body: boolean[][];
  modules: ModuleInfo[];
  moduleAt: (ModuleInfo | null)[][];
  dominant: Material;
  /** smoothed outline loops of the hull body, ship space */
  outline: Pt[][];
  /** per ship-space x (integer px 0..wPx): top / bottom of body, NaN where no hull */
  topY: Float32Array;
  botY: Float32Array;
  /** heavily smoothed versions (for planks) */
  topS: Float32Array;
  botS: Float32Array;
  /** ship-space x extent of the body */
  minX: number;
  maxX: number;
}

/** margin the outer cell polygons are pushed out by, so ink outlines/railings are covered */
export const EDGE_MARGIN = 20;
const CORNER_JIT = 4.5;
const EDGE_JIT = 4.2;
/** intermediate points per lattice edge */
export const EDGE_SUB = 5;

const BODY_KINDS = new Set(['core', 'powder', 'engine', 'arcane', 'shield', 'catroom']);

export function buildLayout(model: ShipModel, flip: boolean, waterY = model.rows * CELL - 70): ShipLayout {
  const { cols, rows } = model;
  const filled: boolean[][] = [];
  for (let y = 0; y < rows; y++) {
    filled.push([]);
    for (let x = 0; x < cols; x++) filled[y].push(!!model.grid[y][x]);
  }
  const moduleAt: (ModuleInfo | null)[][] = filled.map((r) => r.map(() => null));
  const isPlainHull = (x: number, y: number) => {
    const c = model.get(x, y);
    return !!c && c.module === undefined;
  };
  const modules: ModuleInfo[] = model.modules.map((m) => {
    let embedded = false;
    if (BODY_KINDS.has(m.kind)) {
      // embedded if hull cells flank it on at least half its rows
      let flank = 0;
      for (let y = m.y; y < m.y + m.h; y++) {
        const l = isPlainHull(m.x - 1, y) || bodyModuleCell(model, m.x - 1, y, m.id);
        const r = isPlainHull(m.x + m.w, y) || bodyModuleCell(model, m.x + m.w, y, m.id);
        if (l || r) flank++;
      }
      // something under the bottom row that is hull too (so it is not floating on top)
      let below = 0;
      for (let x = m.x; x < m.x + m.w; x++) if (isPlainHull(x, m.y + m.h)) below++;
      embedded = flank >= Math.ceil(m.h / 2) && (below > 0 || m.y + m.h >= rows);
      if (m.kind === 'core' || m.kind === 'powder') embedded = embedded || flank > 0;
      if (m.kind === 'shield' || m.kind === 'arcane') {
        // needs hull on BOTH sides, otherwise it is a deck generator / pylon
        let both = 0;
        for (let y = m.y; y < m.y + m.h; y++) if (isPlainHull(m.x - 1, y) && isPlainHull(m.x + m.w, y)) both++;
        embedded = both >= Math.ceil(m.h / 2);
      }
    } else if (m.kind === 'cannon') {
      let flank = 0;
      for (let y = m.y; y < m.y + m.h; y++) if (isPlainHull(m.x - 1, y) && isPlainHull(m.x + m.w, y)) flank++;
      // a cannon fully enclosed left & right inside the hull becomes a gun port
      embedded = flank >= m.h && isPlainHull(m.x, m.y - 1);
    }
    const info = { m, embedded };
    for (let y = m.y; y < m.y + m.h; y++) for (let x = m.x; x < m.x + m.w; x++) if (y >= 0 && y < rows && x >= 0 && x < cols) moduleAt[y][x] = info;
    return info;
  });
  const body: boolean[][] = filled.map((r, y) =>
    r.map((f, x) => {
      if (!f) return false;
      const mi = moduleAt[y][x];
      if (!mi) return true;
      return mi.embedded;
    }),
  );
  // dominant material of plain hull cells
  const count: Partial<Record<Material, number>> = {};
  for (const c of model.cells()) if (c.module === undefined) count[c.material] = (count[c.material] ?? 0) + 1;
  let dominant: Material = 'wood';
  let best = -1;
  for (const k of Object.keys(count) as Material[]) if ((count[k] ?? 0) > best) ((best = count[k] ?? 0), (dominant = k));

  const wPx = cols * CELL;
  const hPx = rows * CELL;
  const raw = traceOutline(body, cols, rows);
  let rx0 = wPx;
  let rx1 = 0;
  for (const l of raw) for (const p of l) ((rx0 = Math.min(rx0, p[0])), (rx1 = Math.max(rx1, p[0])));
  // rake the stem forward and the stern back above the waterline (stays inside the 20px cell margin)
  const rake = (p: Pt): Pt => {
    const up = Math.max(0, Math.min(1, (waterY - p[1]) / 130));
    const bowT = Math.max(0, Math.min(1, (p[0] - (rx1 - 60)) / 60));
    const sternT = Math.max(0, Math.min(1, (rx0 + 50 - p[0]) / 50));
    const e = (t: number) => t * t * (3 - 2 * t);
    return [p[0] + 15 * up * e(bowT) - 7 * up * e(sternT), p[1]];
  };
  const outline = raw.map((loop) => roundPoly(loop, [26, 13, 7, 3]).map(rake));
  const { topY, botY } = heightfields(outline, wPx, hPx);
  const topS = smoothField(topY, 46);
  const botS = smoothField(botY, 70);
  let minX = wPx;
  let maxX = 0;
  for (let x = 0; x <= wPx; x++) if (!Number.isNaN(topY[x])) ((minX = Math.min(minX, x)), (maxX = Math.max(maxX, x)));
  return { cols, rows, flip, wPx, hPx, filled, body, modules, moduleAt, dominant, outline, topY, botY, topS, botS, minX, maxX };
}

function bodyModuleCell(model: ShipModel, x: number, y: number, self: number) {
  const c = model.get(x, y);
  if (!c || c.module === undefined || c.module === self) return false;
  const k = model.modules[c.module].kind;
  return k === 'core' || k === 'powder' || k === 'engine';
}

/** Rectilinear boundary loops of a cell set (clockwise, y down). */
function traceOutline(set: boolean[][], cols: number, rows: number): Pt[][] {
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && set[y][x];
  type E = { a: Pt; b: Pt; used: boolean };
  const edges: E[] = [];
  const byStart = new Map<string, E[]>();
  const key = (p: Pt) => p[0] + ',' + p[1];
  const add = (a: Pt, b: Pt) => {
    const e = { a, b, used: false };
    edges.push(e);
    const k = key(a);
    const l = byStart.get(k);
    if (l) l.push(e);
    else byStart.set(k, [e]);
  };
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      if (!on(x, y)) continue;
      const X = x * CELL, Y = y * CELL, X1 = X + CELL, Y1 = Y + CELL;
      if (!on(x, y - 1)) add([X, Y], [X1, Y]);
      if (!on(x + 1, y)) add([X1, Y], [X1, Y1]);
      if (!on(x, y + 1)) add([X1, Y1], [X, Y1]);
      if (!on(x - 1, y)) add([X, Y1], [X, Y]);
    }
  const loops: Pt[][] = [];
  for (const e0 of edges) {
    if (e0.used) continue;
    const loop: Pt[] = [];
    let e: E | undefined = e0;
    let guard = 0;
    while (e && !e.used && guard++ < 10000) {
      e.used = true;
      loop.push(e.a);
      const cand: E[] = (byStart.get(key(e.b)) ?? []).filter((n) => !n.used);
      if (cand.length > 1) {
        // prefer turning right (keeps diagonal-touching cells as separate lobes)
        const dx = e.b[0] - e.a[0];
        const dy = e.b[1] - e.a[1];
        cand.sort((p, q) => turn(dx, dy, p) - turn(dx, dy, q));
      }
      e = cand[0];
    }
    // drop collinear points
    const simp: Pt[] = [];
    for (let i = 0; i < loop.length; i++) {
      const p0 = loop[(i - 1 + loop.length) % loop.length];
      const p1 = loop[i];
      const p2 = loop[(i + 1) % loop.length];
      const cross = (p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0]);
      if (Math.abs(cross) > 1e-6) simp.push(p1);
    }
    if (simp.length >= 3) loops.push(simp);
  }
  return loops;
  function turn(dx: number, dy: number, n: E) {
    const ex = n.b[0] - n.a[0];
    const ey = n.b[1] - n.a[1];
    const cross = dx * ey - dy * ex; // >0 right turn (y down)
    return -cross;
  }
}

function heightfields(outline: Pt[][], wPx: number, hPx: number) {
  const topY = new Float32Array(wPx + 1).fill(NaN);
  const botY = new Float32Array(wPx + 1).fill(NaN);
  const pad = 30;
  const cv = document.createElement('canvas');
  cv.width = wPx + 1;
  cv.height = hPx + pad;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#fff';
  g.beginPath();
  for (const loop of outline) {
    loop.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.closePath();
  }
  g.fill('evenodd');
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  for (let x = 0; x <= wPx; x++) {
    for (let y = 0; y < cv.height; y++)
      if (d[(y * cv.width + x) * 4 + 3] > 127) {
        topY[x] = y;
        break;
      }
    for (let y = cv.height - 1; y >= 0; y--)
      if (d[(y * cv.width + x) * 4 + 3] > 127) {
        botY[x] = y;
        break;
      }
  }
  return { topY, botY };
}

function smoothField(f: Float32Array, win: number) {
  const out = new Float32Array(f.length).fill(NaN);
  for (let x = 0; x < f.length; x++) {
    if (Number.isNaN(f[x])) continue;
    let s = 0;
    let n = 0;
    for (let k = -win; k <= win; k++) {
      const v = f[x + k];
      if (v !== undefined && !Number.isNaN(v)) {
        const w = 1 - Math.abs(k) / (win + 1);
        s += v * w;
        n += w;
      }
    }
    out[x] = s / n;
  }
  return out;
}

// ---------------------------------------------------------------- lattice (local space)

export class Lattice {
  constructor(public L: ShipLayout) {}

  private filled(x: number, y: number) {
    const L = this.L;
    return x >= 0 && y >= 0 && x < L.cols && y < L.rows && L.filled[y][x];
  }

  /** ship-space x → local x */
  lx(sx: number) {
    return this.L.flip ? this.L.wPx - sx : sx;
  }

  /** exposure normal of a horizontal lattice edge (i,j)-(i+1,j) in ship space; 0 if interior/void */
  private hNormal(i: number, j: number): number {
    const below = this.filled(i, j);
    const above = this.filled(i, j - 1);
    if (below && !above) return -1;
    if (above && !below) return 1;
    return 0;
  }
  private vNormal(i: number, j: number): number {
    const right = this.filled(i, j);
    const left = this.filled(i - 1, j);
    if (right && !left) return -1;
    if (left && !right) return 1;
    return 0;
  }

  /** corner (i,j) in ship space */
  corner(i: number, j: number): Pt {
    const hl = this.hNormal(i - 1, j);
    const hr = this.hNormal(i, j);
    const vu = this.vNormal(i, j - 1);
    const vd = this.vNormal(i, j);
    let dy = 0;
    if (hl < 0 || hr < 0) dy -= EDGE_MARGIN;
    if (hl > 0 || hr > 0) dy += EDGE_MARGIN;
    let dx = 0;
    if (vu < 0 || vd < 0) dx -= EDGE_MARGIN;
    if (vu > 0 || vd > 0) dx += EDGE_MARGIN;
    const exposed = hl || hr || vu || vd;
    const jx = exposed ? 0 : shash(i, j, 11) * CORNER_JIT;
    const jy = exposed ? 0 : shash(i, j, 23) * CORNER_JIT;
    return [i * CELL + dx + jx, j * CELL + dy + jy];
  }

  /** interior points of horizontal edge (i,j)->(i+1,j), ship space, left→right */
  hEdge(i: number, j: number): Pt[] {
    const n = this.hNormal(i, j);
    const a = this.corner(i, j);
    const b = this.corner(i + 1, j);
    const out: Pt[] = [];
    for (let k = 1; k <= EDGE_SUB; k++) {
      const t = k / (EDGE_SUB + 1);
      const x = a[0] + (b[0] - a[0]) * t;
      let y = a[1] + (b[1] - a[1]) * t;
      if (n !== 0) y = j * CELL + n * EDGE_MARGIN;
      else {
        const taper = Math.min(1, Math.min(k, EDGE_SUB + 1 - k) / 1.6);
        y += (k % 2 ? 1 : -1) * (0.35 + 0.65 * hash(i, j, 31 + k)) * EDGE_JIT * taper * (hash(i, j, 7) > 0.5 ? 1 : -1);
      }
      out.push([x, y]);
    }
    return out;
  }

  /** interior points of vertical edge (i,j)->(i,j+1), ship space, top→bottom */
  vEdge(i: number, j: number): Pt[] {
    const n = this.vNormal(i, j);
    const a = this.corner(i, j);
    const b = this.corner(i, j + 1);
    const out: Pt[] = [];
    for (let k = 1; k <= EDGE_SUB; k++) {
      const t = k / (EDGE_SUB + 1);
      let x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      if (n !== 0) x = i * CELL + n * EDGE_MARGIN;
      else {
        const taper = Math.min(1, Math.min(k, EDGE_SUB + 1 - k) / 1.6);
        x += (k % 2 ? 1 : -1) * (0.35 + 0.65 * hash(i, j, 57 + k)) * EDGE_JIT * taper * (hash(i, j, 9) > 0.5 ? 1 : -1);
      }
      out.push([x, y]);
    }
    return out;
  }

  /** closed ring for cell (x,y) in ship space, clockwise (y down) */
  ringShip(x: number, y: number): Pt[] {
    const ring: Pt[] = [];
    ring.push(this.corner(x, y), ...this.hEdge(x, y));
    ring.push(this.corner(x + 1, y), ...this.vEdge(x + 1, y));
    ring.push(this.corner(x + 1, y + 1), ...this.hEdge(x, y + 1).reverse());
    ring.push(this.corner(x, y + 1), ...this.vEdge(x, y).reverse());
    return ring;
  }

  /** ring in local space */
  ring(x: number, y: number): Pt[] {
    return this.ringShip(x, y).map((p) => [this.lx(p[0]), p[1]] as Pt);
  }

  /**
   * Shared edge between cell (x,y) and its neighbour in direction (dx,dy), local space, including corners.
   */
  sharedEdge(x: number, y: number, dx: number, dy: number): Pt[] {
    let pts: Pt[];
    if (dy === -1) pts = [this.corner(x, y), ...this.hEdge(x, y), this.corner(x + 1, y)];
    else if (dy === 1) pts = [this.corner(x, y + 1), ...this.hEdge(x, y + 1), this.corner(x + 1, y + 1)];
    else if (dx === -1) pts = [this.corner(x, y), ...this.vEdge(x, y), this.corner(x, y + 1)];
    else pts = [this.corner(x + 1, y), ...this.vEdge(x + 1, y), this.corner(x + 1, y + 1)];
    return pts.map((p) => [this.lx(p[0]), p[1]] as Pt);
  }
}
