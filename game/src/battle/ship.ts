/**
 * Ship model: a grid of cells. Each filled cell is a hull block or part of a module.
 * Pure logic (no rendering). Structural integrity: every block must connect (4-neighbour)
 * to the keel (bottom row). Disconnected chunks detach and sink.
 */
export type Material = 'wood' | 'iron' | 'crystal' | 'bone' | 'void' | 'stone' | 'canvas';

export type ModuleKind =
  | 'core'
  | 'cannon'
  | 'catroom'
  | 'mast'
  | 'shield'
  | 'engine'
  | 'powder'
  | 'arcane';

import type { StatusId } from './types';
export type CellStatus = StatusId;

export interface Cell {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  material: Material;
  /** module instance id if this cell belongs to a module */
  module?: number;
  status: Partial<Record<CellStatus, number>>; // turns remaining
}

export interface ModuleInst {
  id: number;
  kind: ModuleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  /** cat slot index for catrooms */
  slot?: number;
  /** level of the module (from shipyard) */
  level: number;
  /** turns disabled (overload) */
  disabled: number;
}

export interface ShipBlueprint {
  cols: number;
  rows: number;
  /** rows of chars, top to bottom. '.' empty, 'W' wood, 'I' iron, 'C' crystal, 'B' bone */
  hull: string[];
  modules: { kind: ModuleKind; x: number; y: number; w: number; h: number; slot?: number; level?: number }[];
}

export const MATERIAL_HP: Record<Material, number> = { wood: 60, iron: 140, crystal: 90, bone: 110, void: 200, stone: 120, canvas: 30 };

export const CELL = 40; // logical px per cell

export class ShipModel {
  cols: number;
  rows: number;
  grid: (Cell | null)[][];
  modules: ModuleInst[] = [];
  hpMul: number;

  constructor(bp: ShipBlueprint, hpMul = 1) {
    this.cols = bp.cols;
    this.rows = bp.rows;
    this.hpMul = hpMul;
    this.grid = [];
    for (let y = 0; y < bp.rows; y++) {
      const row: (Cell | null)[] = [];
      const line = bp.hull[y] ?? '';
      for (let x = 0; x < bp.cols; x++) {
        const ch = line[x] ?? '.';
        const mat: Material | null =
          ch === 'W' ? 'wood' : ch === 'I' ? 'iron' : ch === 'C' ? 'crystal' : ch === 'B' ? 'bone' : ch === 'V' ? 'void' : ch === 'S' ? 'stone' : ch === 'L' ? 'canvas' : null;
        row.push(mat ? this.mkCell(x, y, mat) : null);
      }
      this.grid.push(row);
    }
    bp.modules.forEach((m, i) => {
      const inst: ModuleInst = { id: i, kind: m.kind, x: m.x, y: m.y, w: m.w, h: m.h, alive: true, slot: m.slot, level: m.level ?? 1, disabled: 0 };
      this.modules.push(inst);
      for (let yy = m.y; yy < m.y + m.h; yy++)
        for (let xx = m.x; xx < m.x + m.w; xx++) {
          const mat: Material = m.kind === 'core' || m.kind === 'engine' ? 'iron' : m.kind === 'arcane' || m.kind === 'shield' ? 'crystal' : 'wood';
          const c = this.mkCell(xx, yy, mat);
          c.module = i;
          const modMul = m.kind === 'core' ? 2.2 : m.kind === 'catroom' ? 1.4 : 1;
          c.maxHp = c.hp = Math.round(c.hp * modMul);
          this.grid[yy][xx] = c;
        }
    });
  }

  private mkCell(x: number, y: number, material: Material): Cell {
    const hp = Math.round(MATERIAL_HP[material] * this.hpMul);
    return { x, y, hp, maxHp: hp, material, status: {} };
  }

  get(x: number, y: number): Cell | null {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    return this.grid[y][x];
  }

  cells(): Cell[] {
    const out: Cell[] = [];
    for (const row of this.grid) for (const c of row) if (c) out.push(c);
    return out;
  }

  moduleCells(id: number): Cell[] {
    return this.cells().filter((c) => c.module === id);
  }

  /** Remove a cell; returns true if it existed. Updates module alive state. */
  destroyCell(x: number, y: number): Cell | null {
    const c = this.get(x, y);
    if (!c) return null;
    this.grid[y][x] = null;
    if (c.module !== undefined) this.refreshModule(c.module);
    return c;
  }

  refreshModule(id: number) {
    const m = this.modules[id];
    if (!m || !m.alive) return;
    const remaining = this.moduleCells(id).length;
    const total = m.w * m.h;
    // a module dies when more than half its cells are gone
    if (remaining <= total / 2) m.alive = false;
  }

  /**
   * Flood fill from keel (bottom row cells). Returns disconnected chunks (groups of cells)
   * which the caller should detach (sink) — they are removed from the grid here.
   */
  collapse(): Cell[][] {
    const seen = new Set<Cell>();
    const stack: Cell[] = [];
    for (let x = 0; x < this.cols; x++) {
      const c = this.get(x, this.rows - 1);
      if (c) {
        seen.add(c);
        stack.push(c);
      }
    }
    while (stack.length) {
      const c = stack.pop()!;
      for (const [dx, dy] of DIRS) {
        const n = this.get(c.x + dx, c.y + dy);
        if (n && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    const loose = this.cells().filter((c) => !seen.has(c));
    if (!loose.length) return [];
    // group loose cells into chunks
    const chunks: Cell[][] = [];
    const inChunk = new Set<Cell>();
    for (const c of loose) {
      if (inChunk.has(c)) continue;
      const chunk: Cell[] = [];
      const st = [c];
      inChunk.add(c);
      while (st.length) {
        const k = st.pop()!;
        chunk.push(k);
        for (const [dx, dy] of DIRS) {
          const n = this.get(k.x + dx, k.y + dy);
          if (n && !seen.has(n) && !inChunk.has(n)) {
            inChunk.add(n);
            st.push(n);
          }
        }
      }
      chunks.push(chunk);
    }
    for (const chunk of chunks) for (const c of chunk) this.destroyCell(c.x, c.y);
    return chunks;
  }

  integrity(): number {
    let hp = 0;
    let max = 0;
    for (const c of this.cells()) {
      hp += c.hp;
    }
    for (const row of this.initialMax ?? []) max += row;
    return max ? hp / max : 1;
  }

  initialMax?: number[];
  snapshotMax() {
    this.initialMax = [this.cells().reduce((a, c) => a + c.maxHp, 0)];
  }
}

export const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;
