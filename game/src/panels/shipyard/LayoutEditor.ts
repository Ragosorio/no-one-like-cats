/**
 * EDITOR DE PLANO (GDD 2.8 / M2): drag modules and cabins on the ship grid, add/remove utility
 * modules within the ship's utility budget, live connection check (everything must reach the keel,
 * same BFS as battle/ship.ts), collapse preview on hover ("si te rompen esto, se cae esto"),
 * live illustration, RESTABLECER / GUARDAR / GUARDAR Y PROBAR. Invalid ships can't be saved.
 */
import { Container, FederatedPointerEvent, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { sfx } from '../../core/audio';
import { pop } from '../../fx/juice';
import { G } from '../../state/game';
import { SHIP_BY_ID } from '../../data/content';
import { CELL } from '../../battle/ship';
import { AnimeShipView, hullStyleForMk } from '../../battle/anime';
import { ShipModel } from '../../battle/ship';
import {
  FIXED_KINDS,
  LayoutCheck,
  LayoutModule,
  MODULE_NAME,
  UTILITY,
  UTILITY_BY_KIND,
  blueprintFor,
  collapsePreview,
  crew,
  defaultLayout,
  layoutOf,
  layoutSig,
  mk,
  moduleLabel,
  saveLayout,
  shipName,
  utilityBudget,
  utilityCost,
  utilityUnlockText,
  utilityUnlocked,
  validateLayout,
  weaponsOf,
} from '../../state/sys/ship';
import { UTILITY_BATTLE } from '../../state/sys/gear';
import { cat as getCat } from '../../state/sys/cats';
import { P, catPortrait, ensureCats, label, stamp, clearChildren } from '../campaign/common';
import { BP, bpSheet, handNote, iconButton, moduleGlyph, sparkBurst, weaponGlyph } from './art';

const SHEET_W = 1190;
const SHEET_H = 790;
const RIGHT_X = 1214;
const RIGHT_W = 556;

const KIND_FILL: Record<string, number> = {
  core: 0xff2e88,
  cannon: 0x30344a,
  catroom: 0xe9dcc1,
  engine: 0x6d7699,
  shield: 0x00c8e8,
  mast: 0xa8683a,
  powder: 0xc8102e,
  arcane: 0x8a5cff,
  pantry: 0x3fae6a,
  pump: 0x3569a3,
  anchor: 0x5a6280,
  bridge: 0xb89558,
  tower: 0xff6a1a,
  bulkhead: 0x9a8f80,
};
const FIXED_DESC: Record<string, string> = {
  core: 'Si cae, pierdes. Va rodeado de casco (≥1 celda del borde).',
  cannon: 'Dispara SOLO en la andanada al final de tu turno. Su tipo se elige en ARMAS.',
  catroom: 'Aquí vive un gato. Tiene que tocar la cubierta o el casco.',
  engine: 'Combustible para maniobrar (A/D). Va abajo, sobre la quilla.',
  shield: 'Generador del Escudo Burbuja (desde el Jefe 3).',
};

let current: LayoutEditor | null = null;

export function openLayoutEditor(shipId: string, onDone: (r: { saved: boolean; test: boolean }) => void) {
  if (current && !current.m.closed) return;
  current = new LayoutEditor(shipId, onDone);
}

interface Drag {
  idx: number; // -1 = new from palette
  kind: string;
  w: number;
  h: number;
  block: Container;
  offX: number; // pointer offset inside the block (cells)
  offY: number;
  cell: [number, number] | null;
}

class LayoutEditor {
  m: Modal;
  private mods: LayoutModule[];
  private startSig: string;
  private def;
  private cs: number;
  private gx0: number;
  private gy0: number;
  private sheet = new Container();
  private cellsLayer = new Container();
  private modLayer = new Container();
  private fxLayer = new Container();
  private hoverG = new Graphics();
  private ghost = new Graphics();
  private dragLayer = new Container();
  private right = new Container();
  private status = new Container();
  private previewBox = new Container();
  private check!: LayoutCheck;
  private drag: Drag | null = null;
  private hoverKey = '';
  private previewTimer: gsap.core.Tween | null = null;
  private done = false;

  constructor(
    private shipId: string,
    private onDone: (r: { saved: boolean; test: boolean }) => void,
  ) {
    this.def = SHIP_BY_ID.get(shipId)!;
    this.mods = layoutOf(shipId).map((m) => ({ ...m }));
    this.startSig = layoutSig(this.mods);
    this.m = new Modal('EDITOR DE PLANO', 1840, 1000, { color: 0xe9e4d8, subtitle: `${shipName(shipId).toUpperCase()} · ARRASTRA MÓDULOS · TODO DEBE TOCAR LA QUILLA` });
    this.m.open();
    const { cols, rows } = this.def.grid;
    this.cs = Math.floor(Math.min(64, (SHEET_W - 140) / cols, (SHEET_H - 190) / rows));
    this.gx0 = Math.round((SHEET_W - cols * this.cs) / 2);
    this.gy0 = Math.round(96 + (SHEET_H - 96 - 60 - rows * this.cs) / 2);
    const b = this.m.body;
    this.sheet.addChild(bpSheet(SHEET_W, SHEET_H));
    b.addChild(this.sheet, this.cellsLayer, this.modLayer, this.hoverG, this.ghost, this.fxLayer, this.right, this.status, this.dragLayer);
    this.drawStatic();
    this.buildRight();
    this.refresh();
    void ensureCats(crew(shipId).map((u) => getCat(u)?.species ?? 'c_canelo')).then(() => !this.m.closed && this.refresh());
    // hover = collapse preview
    this.cellsLayer.eventMode = 'static';
    this.m.panel.eventMode = 'static';
    this.m.panel.on('globalpointermove', this.onMove, this);
    if (import.meta.env.DEV) (window as unknown as { __yardEditor: unknown }).__yardEditor = this;
    this.m.onClose = () => {
      this.m.panel.off('globalpointermove', this.onMove, this);
      this.previewTimer?.kill();
      current = null;
      if (!this.done) {
        if (layoutSig(this.mods) !== this.startSig) toast('Plano sin guardar: cambios descartados', { color: C.paper, icon: 'blueprint' });
        this.onDone({ saved: false, test: false });
      }
    };
  }

  // ---------------------------------------------------------------- static grid
  private drawStatic() {
    const { cols, rows, waterlineRow } = this.def.grid;
    const cs = this.cs;
    const g = new Graphics();
    const hull = this.def.hull;
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const px = this.gx0 + x * cs;
        const py = this.gy0 + y * cs;
        const ch = hull[y]?.[x] ?? '.';
        if (ch !== '.') {
          g.rect(px + 1, py + 1, cs - 2, cs - 2).fill({ color: ch === 'H' ? 0x6fa3e0 : ch === 'I' ? 0xb8c4d8 : 0xbfe8ff, alpha: ch === 'H' ? 0.55 : 0.7 });
          // plank lines
          g.moveTo(px + 3, py + cs * 0.33).lineTo(px + cs - 3, py + cs * 0.33).moveTo(px + 3, py + cs * 0.66).lineTo(px + cs - 3, py + cs * 0.66).stroke({ width: 1, color: BP.white, alpha: 0.22 });
        } else {
          g.circle(px + cs / 2, py + cs / 2, 1.6).fill({ color: BP.white, alpha: 0.35 });
        }
      }
    // grid lines
    for (let x = 0; x <= cols; x++) g.moveTo(this.gx0 + x * cs, this.gy0).lineTo(this.gx0 + x * cs, this.gy0 + rows * cs);
    for (let y = 0; y <= rows; y++) g.moveTo(this.gx0, this.gy0 + y * cs).lineTo(this.gx0 + cols * cs, this.gy0 + y * cs);
    g.stroke({ width: 1, color: BP.white, alpha: 0.16 });
    // hull silhouette outline (edges between hull and empty cells)
    const isH = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && (hull[y]?.[x] ?? '.') !== '.';
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        if (!isH(x, y)) continue;
        const px = this.gx0 + x * cs;
        const py = this.gy0 + y * cs;
        if (!isH(x, y - 1)) g.moveTo(px, py).lineTo(px + cs, py);
        if (!isH(x, y + 1)) g.moveTo(px, py + cs).lineTo(px + cs, py + cs);
        if (!isH(x - 1, y)) g.moveTo(px, py).lineTo(px, py + cs);
        if (!isH(x + 1, y)) g.moveTo(px + cs, py).lineTo(px + cs, py + cs);
      }
    g.stroke({ width: 3, color: BP.white, alpha: 0.9, cap: 'round' });
    // keel
    const ky = this.gy0 + (rows - 1) * cs;
    g.rect(this.gx0, ky, cols * cs, cs).stroke({ width: 2.5, color: BP.yellow, alpha: 0.75 });
    // waterline
    const wy = this.gy0 + waterlineRow * cs;
    for (let x = this.gx0 - 40; x < this.gx0 + cols * cs + 40; x += 16) g.moveTo(x, wy).lineTo(x + 8, wy);
    g.stroke({ width: 2, color: BP.cyan, alpha: 0.7 });
    this.cellsLayer.addChild(g);
    const kl = handNote('quilla: aquí se amarra todo', 18, BP.yellow, -0.02);
    kl.position.set(this.gx0 - 10, ky + cs + 8);
    const wl = txt('FLOTACIÓN', { fontFamily: F.bebas, fontSize: 15, fill: BP.cyan, letterSpacing: 2 });
    wl.position.set(this.gx0 + cols * cs + 8, wy - 18);
    this.cellsLayer.addChild(kl, wl);
    // rules strip
    const rules = ['todo conectado a la quilla', 'mástil sobre la cubierta', 'motor abajo', 'corazón rodeado de casco', 'camarotes tocan casco'];
    let rx = 26;
    const rt = txt('REGLAS:', { fontFamily: F.bebas, fontSize: 18, fill: BP.white, letterSpacing: 2 });
    rt.position.set(rx, 24);
    this.cellsLayer.addChild(rt);
    rx += rt.width + 10;
    for (const r of rules) {
      const t = handNote(r, 15, BP.chalk, 0);
      const bg = new Graphics().roundRect(rx - 6, 22, t.width + 12, 26, 13).stroke({ width: 1.5, color: BP.line, alpha: 0.8 });
      t.position.set(rx, 24);
      this.cellsLayer.addChild(bg, t);
      rx += t.width + 22;
    }
    const tip = label('Pasa el ratón por un módulo o celda: ves qué se cae si te lo rompen. Suelta utilería fuera del plano para quitarla.', 13, BP.line);
    tip.position.set(26, 56);
    this.cellsLayer.addChild(tip);
  }

  // ---------------------------------------------------------------- modules
  private refresh() {
    this.check = validateLayout(this.shipId, this.mods);
    clearChildren(this.modLayer);
    this.mods.forEach((m, i) => {
      if (this.drag?.idx === i) return;
      const b = this.block(m, i, this.check.bad.has(i));
      b.position.set(this.gx0 + m.x * this.cs, this.gy0 + m.y * this.cs);
      this.modLayer.addChild(b);
    });
    // floating cells (hull pieces that would sink)
    const fl = new Graphics();
    for (const k of this.check.floating) {
      const [x, y] = k.split(',').map(Number);
      const px = this.gx0 + x * this.cs;
      const py = this.gy0 + y * this.cs;
      fl.moveTo(px + 6, py + 6).lineTo(px + this.cs - 6, py + this.cs - 6).moveTo(px + this.cs - 6, py + 6).lineTo(px + 6, py + this.cs - 6);
    }
    fl.stroke({ width: 3, color: BP.red, cap: 'round' });
    this.modLayer.addChild(fl);
    this.buildStatus();
    this.buildBudget();
    this.schedulePreview();
  }

  private block(m: LayoutModule, i: number, bad: boolean): Container {
    const cs = this.cs;
    const c = new Container();
    const w = m.w * cs;
    const h = m.h * cs;
    const fill = KIND_FILL[m.kind] ?? 0x9a8f80;
    const g = new Graphics().rect(3, 3, w - 6, h - 6).fill({ color: fill, alpha: m.kind === 'catroom' ? 0.42 : 0.72 }).stroke({ width: bad ? 4 : 2.5, color: bad ? BP.red : BP.white });
    c.addChild(g);
    if (bad) {
      const hx = new Graphics().rect(3, 3, w - 6, h - 6).fill({ color: BP.red, alpha: 0.35 });
      hx.moveTo(8, 8).lineTo(w - 8, h - 8).moveTo(w - 8, 8).lineTo(8, h - 8).stroke({ width: 2, color: BP.red, alpha: 0.8 });
      c.addChild(hx);
    }
    const s = Math.min(w, h);
    if (m.kind === 'catroom') {
      const u = crew(this.shipId)[m.slot ?? 0];
      const cc = u ? getCat(u) : undefined;
      if (cc) {
        const p = catPortrait(cc.species, Math.min(s - 10, 84));
        p.position.set(w / 2, h / 2 - 4);
        c.addChild(p);
      } else {
        const gl = moduleGlyph('catroom', s * 0.5);
        gl.position.set(w / 2, h / 2 - 4);
        c.addChild(gl);
      }
    } else if (m.kind === 'cannon') {
      const n = this.mods.slice(0, i + 1).filter((x) => x.kind === 'cannon').length - 1;
      const gl = weaponGlyph(weaponsOf(this.shipId)[n] ?? 'canon', Math.min(s * 0.95, 46));
      gl.position.set(w / 2, h / 2);
      c.addChild(gl);
    } else {
      const gl = moduleGlyph(m.kind, Math.min(s * 0.7, 40));
      gl.position.set(w / 2, h / 2 - (h > cs ? 8 : 0));
      c.addChild(gl);
    }
    const lab = moduleLabel(this.mods, i).toUpperCase();
    const t = txt(lab, { fontFamily: F.bebas, fontSize: Math.max(11, Math.min(15, cs * 0.3)), fill: BP.white, letterSpacing: 1 });
    t.anchor.set(0.5, 1);
    t.position.set(w / 2, h - 4);
    if (t.width > w - 4) t.scale.set((w - 4) / t.width);
    if (h >= cs * 2 || w >= cs * 2) c.addChild(t);
    if (!FIXED_KINDS.has(m.kind)) {
      const pip = new Graphics().circle(w - 9, 9, 7).fill(BP.yellow).stroke({ width: 1.5, color: C.ink });
      const pt = txt(String(utilityCost(m.kind)), { fontFamily: F.poster, fontSize: 11, fill: C.ink });
      pt.anchor.set(0.5);
      pt.position.set(w - 9, 9);
      c.addChild(pip, pt);
    }
    c.eventMode = 'static';
    c.cursor = 'grab';
    c.on('pointerdown', (e: FederatedPointerEvent) => this.startDrag(e, i, m.kind, m.w, m.h, c));
    return c;
  }

  // ---------------------------------------------------------------- drag & drop
  private local(e: FederatedPointerEvent) {
    return this.m.body.toLocal(e.global);
  }
  private cellAt(px: number, py: number): [number, number] {
    return [Math.floor((px - this.gx0) / this.cs), Math.floor((py - this.gy0) / this.cs)];
  }

  private startDrag(e: FederatedPointerEvent, idx: number, kind: string, w: number, h: number, block: Container | null) {
    if (this.drag) return;
    const p = this.local(e);
    let offX = 0;
    let offY = 0;
    if (idx >= 0) {
      const m = this.mods[idx];
      offX = (p.x - (this.gx0 + m.x * this.cs)) / this.cs;
      offY = (p.y - (this.gy0 + m.y * this.cs)) / this.cs;
    } else {
      offX = w / 2;
      offY = h / 2;
    }
    const b = block ?? this.block({ kind, x: 0, y: 0, w, h }, -1, false);
    this.dragLayer.addChild(b);
    b.cursor = 'grabbing';
    b.alpha = 0.9;
    gsap.to(b.scale, { x: 1.06, y: 1.06, duration: 0.1 });
    this.drag = { idx, kind, w, h, block: b, offX, offY, cell: null };
    this.hoverG.clear();
    sfx('pop', 1.3);
    b.on('globalpointermove', this.dragMove, this);
    b.on('pointerup', this.dragEnd, this);
    b.on('pointerupoutside', this.dragEnd, this);
    this.dragMove(e);
  }

  private fits(x: number, y: number, w: number, h: number, skip: number) {
    const { cols, rows } = this.def.grid;
    if (x < 0 || y < 0 || x + w > cols || y + h > rows) return false;
    return this.mods.every((m, i) => i === skip || x + w <= m.x || m.x + m.w <= x || y + h <= m.y || m.y + m.h <= y);
  }

  private dragMove(e: FederatedPointerEvent) {
    const d = this.drag;
    if (!d) return;
    const p = this.local(e);
    d.block.position.set(p.x - d.offX * this.cs, p.y - d.offY * this.cs);
    const cx = Math.round((p.x - d.offX * this.cs - this.gx0) / this.cs);
    const cy = Math.round((p.y - d.offY * this.cs - this.gy0) / this.cs);
    const inside = p.x > this.gx0 - this.cs && p.x < this.gx0 + (this.def.grid.cols + 1) * this.cs && p.y > this.gy0 - this.cs * 2 && p.y < this.gy0 + (this.def.grid.rows + 1) * this.cs;
    const key = inside ? `${cx},${cy}` : 'out';
    if (key === (d.cell ? `${d.cell[0]},${d.cell[1]}` : 'out')) return;
    d.cell = inside ? [cx, cy] : null;
    this.ghost.clear();
    if (!inside) {
      if (!FIXED_KINDS.has(d.kind)) this.statusLine('SUELTA PARA QUITAR ESTE MÓDULO (devuelve sus puntos)', BP.yellow);
      else this.statusLine('Este módulo es estructural: no se puede tirar al mar', BP.red);
      return;
    }
    const ok = this.fits(cx, cy, d.w, d.h, d.idx);
    const gx = this.gx0 + cx * this.cs;
    const gy = this.gy0 + cy * this.cs;
    this.ghost.rect(gx, gy, d.w * this.cs, d.h * this.cs).fill({ color: ok ? BP.green : BP.red, alpha: 0.18 }).stroke({ width: 3, color: ok ? BP.green : BP.red });
    if (ok) {
      // live connectivity of the candidate ship
      const cand = this.candidate(cx, cy);
      const chk = validateLayout(this.shipId, cand);
      for (const k of chk.floating) {
        const [x, y] = k.split(',').map(Number);
        this.ghost.rect(this.gx0 + x * this.cs + 4, this.gy0 + y * this.cs + 4, this.cs - 8, this.cs - 8).fill({ color: BP.red, alpha: 0.45 });
      }
      const idx = d.idx >= 0 ? d.idx : cand.length - 1;
      const mine = chk.issues.find((q) => q.module === idx) ?? chk.issues.find((q) => q.code === 'floating' || q.code === 'budget');
      this.statusLine(mine ? mine.msg : 'Aquí queda bien amarrado', mine ? BP.red : BP.green);
    } else this.statusLine('Ahí no cabe: se encima con otro módulo o se sale del plano', BP.red);
  }

  private candidate(x: number, y: number): LayoutModule[] {
    const d = this.drag!;
    if (d.idx >= 0) return this.mods.map((m, i) => (i === d.idx ? { ...m, x, y } : m));
    return [...this.mods, { kind: d.kind, x, y, w: d.w, h: d.h }];
  }

  private dragEnd() {
    const d = this.drag;
    if (!d) return;
    d.block.off('globalpointermove', this.dragMove, this);
    d.block.off('pointerup', this.dragEnd, this);
    d.block.off('pointerupoutside', this.dragEnd, this);
    this.drag = null;
    this.ghost.clear();
    const fixed = FIXED_KINDS.has(d.kind);
    if (!d.cell) {
      if (d.idx >= 0 && !fixed) {
        // remove utility → poof
        const m = this.mods[d.idx];
        this.mods.splice(d.idx, 1);
        sparkBurst(this.fxLayer, d.block.x + (m.w * this.cs) / 2, d.block.y + (m.h * this.cs) / 2, 14, [0xffffff, BP.cyan]);
        sfx('whoosh');
        toast(`${MODULE_NAME[m.kind] ?? m.kind} desmontado: +${utilityCost(m.kind)} de utilería`, { color: C.mint, icon: 'blueprint' });
      } else if (fixed) {
        sfx('error');
        toast('Los módulos estructurales no se tiran al mar', { color: C.pink, sub: 'Muévelos a otra parte del plano' });
      }
      d.block.destroy({ children: true });
      this.refresh();
      return;
    }
    const [x, y] = d.cell;
    if (!this.fits(x, y, d.w, d.h, d.idx)) {
      sfx('error');
      d.block.destroy({ children: true });
      this.refresh();
      return;
    }
    if (d.idx >= 0) {
      const m = this.mods[d.idx];
      m.x = x;
      m.y = y;
    } else this.mods.push({ kind: d.kind, x, y, w: d.w, h: d.h });
    d.block.destroy({ children: true });
    sfx('hit', 1.4);
    this.refresh();
    // thump the dropped block
    const idx = d.idx >= 0 ? d.idx : this.mods.length - 1;
    const nb = this.modLayer.children[idx] as Container | undefined;
    if (nb) pop(nb, 0.15);
    if (!this.check.ok) sfx('error', 0.8);
  }

  // ---------------------------------------------------------------- hover = collapse preview
  private onMove(e: FederatedPointerEvent) {
    if (this.drag || this.m.closed) return;
    const p = this.local(e);
    const [x, y] = this.cellAt(p.x, p.y);
    const { cols, rows } = this.def.grid;
    if (x < 0 || y < 0 || x >= cols || y >= rows) {
      if (this.hoverKey) {
        this.hoverKey = '';
        this.hoverG.clear();
        this.buildStatus();
      }
      return;
    }
    const mi = this.mods.findIndex((m) => x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h);
    const isHull = (this.def.hull[y]?.[x] ?? '.') !== '.';
    const key = mi >= 0 ? `m${mi}` : isHull ? `c${x},${y}` : '';
    if (key === this.hoverKey) return;
    this.hoverKey = key;
    this.hoverG.clear();
    if (!key) {
      this.buildStatus();
      return;
    }
    const cp = collapsePreview(this.shipId, this.mods, mi >= 0 ? { module: mi } : { cell: [x, y] });
    const cs = this.cs;
    if (mi >= 0) {
      const m = this.mods[mi];
      this.hoverG.rect(this.gx0 + m.x * cs - 3, this.gy0 + m.y * cs - 3, m.w * cs + 6, m.h * cs + 6).stroke({ width: 3, color: BP.yellow });
    } else this.hoverG.rect(this.gx0 + x * cs - 2, this.gy0 + y * cs - 2, cs + 4, cs + 4).stroke({ width: 3, color: BP.yellow });
    for (const [cx, cy] of cp.cells) {
      const px = this.gx0 + cx * cs;
      const py = this.gy0 + cy * cs;
      this.hoverG.rect(px + 2, py + 2, cs - 4, cs - 4).fill({ color: BP.red, alpha: 0.5 });
    }
    const what = mi >= 0 ? moduleLabel(this.mods, mi).toUpperCase() : 'ESTA CELDA';
    let line: string;
    if (!cp.cells.length) line = `SI TE ROMPEN ${what}: no se cae nada más. Bien amarrado.`;
    else {
      const names = cp.modules.map((i) => moduleLabel(this.mods, i));
      line = `SI TE ROMPEN ${what}: CAEN ${cp.cells.length} CELDAS${names.length ? `, INCLUIDO ${names.slice(0, 3).join(', ').toUpperCase()}` : ''}`;
    }
    const m = mi >= 0 ? this.mods[mi] : null;
    const u = m ? UTILITY_BY_KIND.get(m.kind) : undefined;
    const ub = m ? UTILITY_BATTLE[m.kind] : undefined;
    const desc = m ? (ub ? `${u?.name ?? ''} · en batalla: ${ub.effect}` : u ? `Vivo: ${u.alive}  ·  Destruido: ${u.destroyed}` : FIXED_DESC[m.kind] ?? '') : 'Casco: une todo con la quilla.';
    this.statusLine(line, cp.cells.length ? BP.red : BP.green, desc);
  }

  // ---------------------------------------------------------------- status strip (below the sheet)
  private buildStatus() {
    if (this.check.ok) this.statusLine('BARCO VÁLIDO: todo conectado a la quilla. Listo para zarpar.', 0x2e8a52, 'Pasa el ratón por un módulo para ver qué se cae si te lo rompen.');
    else {
      const first = this.check.issues.slice(0, 2).map((q) => q.msg);
      this.statusLine(`NO ZARPA: ${first[0]}`, C.red, first[1] ?? `${this.check.issues.length} problema(s): corrige lo marcado en rojo.`);
    }
  }
  private statusLine(text: string, color: number, sub?: string) {
    clearChildren(this.status);
    this.status.position.set(0, SHEET_H + 18);
    const ok = this.check?.ok;
    const seal = stamp(ok ? 'VÁLIDO' : 'NO ZARPA', ok ? 0x2e8a52 : C.red, 22, -0.06);
    seal.position.set(70, 26);
    const t = txt(text, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: color === BP.red ? C.red : color === BP.green ? 0x2e8a52 : color === BP.yellow ? 0x9a6a00 : color, wordWrap: true, wordWrapWidth: SHEET_W - 170 });
    t.position.set(150, 2);
    this.status.addChild(seal, t);
    if (sub) {
      const s = label(sub, 13, P.blue, { wordWrap: true, wordWrapWidth: SHEET_W - 170 });
      s.position.set(150, 6 + t.height);
      this.status.addChild(s);
    }
  }

  // ---------------------------------------------------------------- right: preview, budget, palette, buttons
  private budgetBox = new Container();
  private buildRight() {
    const r = this.right;
    clearChildren(r);
    r.position.set(RIGHT_X, 0);
    // live illustration
    this.previewBox.position.set(0, 0);
    r.addChild(this.previewBox);
    this.budgetBox.position.set(0, 204);
    r.addChild(this.budgetBox);
    const pl = label('UTILERÍA · arrastra al plano (no suma poder: es táctica)', 13, P.blue, { letterSpacing: 1 });
    pl.position.set(0, 254);
    r.addChild(pl);
    const cw = (RIGHT_W - 12) / 2;
    const ch = 92;
    UTILITY.forEach((u, i) => {
      const c = new Container();
      c.position.set((i % 2) * (cw + 12), 276 + Math.floor(i / 2) * (ch + 8));
      r.addChild(c);
      this.paletteCard(c, u.kind, cw, ch);
    });
    // buttons
    const by = SHEET_H + 14;
    const reset = iconButton('FÁBRICA', 'reset', () => {
      this.mods = defaultLayout(this.shipId);
      sfx('whoosh');
      this.refresh();
      toast('Plano de fábrica restablecido', { icon: 'blueprint' });
    }, { w: 160, h: 56, size: 22, color: C.paper });
    reset.position.set(0, by);
    const save = iconButton('GUARDAR', 'save', () => this.save(false), { w: 176, h: 56, size: 24, color: C.yellow });
    save.position.set(172, by);
    const test = iconButton('GUARDAR Y PROBAR', 'play', () => this.save(true), { w: 196, h: 56, size: 19, color: C.mint });
    test.position.set(360, by);
    r.addChild(reset, save, test);
  }

  private paletteCard(c: Container, kind: string, w: number, h: number) {
    const u = UTILITY_BY_KIND.get(kind)!;
    const factory = defaultLayout(this.shipId).filter((m) => m.kind === kind).length;
    const unlocked = utilityUnlocked(kind) || factory > 0;
    c.addChild(new Graphics().rect(4, 4, w, h).fill(C.ink).rect(0, 0, w, h).fill(unlocked ? C.paper : 0xd2ccbe).stroke({ width: 2.5, color: C.ink }));
    const sw = new Graphics().roundRect(8, 8, 46, 46, 6).fill(unlocked ? BP.sheet : 0x6f6a5e).stroke({ width: 2, color: C.ink });
    const gl = moduleGlyph(kind, 32, unlocked ? BP.white : 0xb9b2a0);
    gl.position.set(31, 31);
    c.addChild(sw, gl);
    const n = txt(u.name.toUpperCase(), { fontFamily: F.bebas, fontSize: 18, fill: unlocked ? C.ink : 0x6f6a5e, letterSpacing: 1 });
    n.position.set(62, 4);
    c.addChild(n);
    // cost pips + footprint
    for (let i = 0; i < Math.max(1, u.cost); i++) {
      const pip = new Graphics().circle(68 + i * 14, 34, 5.5);
      if (u.cost) pip.fill(C.yellow).stroke({ width: 1.5, color: C.ink });
      else pip.stroke({ width: 1.5, color: C.ink });
      c.addChild(pip);
    }
    const fp = txt(`${u.cost ? `${u.cost} PT` : 'GRATIS'} · ${u.footprint[0]}×${u.footprint[1]}`, { fontFamily: F.bebas, fontSize: 14, fill: P.blue });
    fp.position.set(68 + Math.max(1, u.cost) * 14, 26);
    c.addChild(fp);
    // what it does in battle in this build (sim-modelled kinds: GDD text; others: their gear effect)
    const eff = UTILITY_BATTLE[kind]?.effect;
    const short = (s: string, n = 84) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
    const d = label(unlocked ? short(eff ? `En batalla: ${eff}` : u.alive) : `Se desbloquea: ${utilityUnlockText(kind)}`, 10.5, unlocked ? (eff ? 0x2e8a52 : C.ink) : C.red, {
      wordWrap: true,
      wordWrapWidth: w - 14,
      lineHeight: 12,
    });
    d.position.set(8, 60);
    c.addChild(d);
    if (!unlocked) {
      const lk = icon('lock', 20);
      lk.position.set(w - 18, 18);
      c.addChild(lk);
    }
    c.eventMode = 'static';
    c.cursor = unlocked ? 'grab' : 'not-allowed';
    c.on('pointerdown', (e: FederatedPointerEvent) => {
      if (!this.canAdd(kind)) return;
      const [fw, fh] = u.footprint;
      this.startDrag(e, -1, kind, fw, fh, null);
    });
  }

  private canAdd(kind: string) {
    const u = UTILITY_BY_KIND.get(kind)!;
    const factory = defaultLayout(this.shipId).filter((m) => m.kind === kind).length;
    const have = this.mods.filter((m) => m.kind === kind).length;
    if (!utilityUnlocked(kind) && have >= factory) {
      sfx('error');
      toast(`${u.name}: ${utilityUnlockText(kind)}`, { icon: 'lock', color: C.paper });
      return false;
    }
    const used = this.mods.filter((m) => !FIXED_KINDS.has(m.kind)).reduce((a, m) => a + utilityCost(m.kind), 0);
    if (used + u.cost > utilityBudget(this.shipId)) {
      sfx('error');
      toast(`Sin presupuesto de utilería (${used}/${utilityBudget(this.shipId)})`, { color: C.pink, sub: 'Quita un módulo (suéltalo fuera del plano) para liberar puntos' });
      pop(this.budgetBox, 0.2);
      return false;
    }
    return true;
  }

  private buildBudget() {
    const b = this.budgetBox;
    clearChildren(b);
    const used = this.check.utilityUsed;
    const max = this.check.budget;
    const over = used > max;
    b.addChild(new Graphics().rect(4, 4, RIGHT_W, 40).fill(C.ink).rect(0, 0, RIGHT_W, 40).fill(over ? 0xffd0d6 : 0xf6e7bf).stroke({ width: 3, color: C.ink }));
    const t = txt(`PRESUPUESTO DE UTILERÍA  ${used}/${max}`, { fontFamily: F.poster, fontSize: 22, fill: over ? C.red : C.ink });
    t.position.set(12, 4);
    b.addChild(t);
    for (let i = 0; i < Math.max(max, used); i++) {
      const pip = new Graphics().roundRect(RIGHT_W - 20 - (Math.max(max, used) - i) * 30, 9, 24, 22, 4);
      if (i < used) pip.fill(i < max ? C.yellow : C.red).stroke({ width: 2, color: C.ink });
      else pip.fill(C.paper).stroke({ width: 2, color: C.ink });
      b.addChild(pip);
    }
  }

  private schedulePreview() {
    this.previewTimer?.kill();
    this.previewTimer = gsap.delayedCall(0.12, () => this.buildPreview());
  }
  private buildPreview() {
    if (this.m.closed) return;
    const box = this.previewBox;
    clearChildren(box);
    const w = RIGHT_W;
    const h = 192;
    box.addChild(bpSheet(w, h, { grain: false }));
    const t = txt('ASÍ QUEDA', { fontFamily: F.bebas, fontSize: 18, fill: BP.white, letterSpacing: 2 });
    t.position.set(38, 12);
    box.addChild(t);
    try {
      const { bp } = blueprintFor(this.shipId, this.mods);
      const model = new ShipModel(bp, 1);
      const v = new AnimeShipView(model, false, hullStyleForMk(mk('hull')), { waterLocalY: bp.rows * CELL - 70, resolution: 1 });
      const k = Math.min((w - 40) / (bp.cols * CELL), (h - 40) / (bp.rows * CELL + 30));
      v.scale.set(k);
      v.position.set((w - bp.cols * CELL * k) / 2, 30 + (h - 40 - bp.rows * CELL * k) / 2 + 6);
      box.addChild(v);
      if (!this.check.ok) {
        const st = stamp('NO ZARPA', C.red, 26, -0.1);
        st.position.set(w - 100, h - 36);
        box.addChild(st);
      }
    } catch (e) {
      console.warn('[editor] preview failed', e);
    }
  }

  // ---------------------------------------------------------------- save
  private save(test: boolean) {
    this.check = validateLayout(this.shipId, this.mods);
    if (!this.check.ok) {
      sfx('error');
      toast('Este barco no zarpa así', { color: C.pink, sub: this.check.issues[0]?.msg });
      gsap.fromTo(this.status, { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)' });
      return;
    }
    const changed = layoutSig(this.mods) !== layoutSig(layoutOf(this.shipId));
    if (!saveLayout(this.shipId, this.mods)) {
      sfx('error');
      return;
    }
    if (changed || layoutSig(this.mods) !== this.startSig) {
      const yard = ((G.s.ext ??= {}).yard ??= {}) as { editedSinceTrial?: boolean };
      yard.editedSinceTrial = true;
      G.count('layout_saved');
    }
    G.save();
    this.done = true;
    sfx('fanfare');
    const st = stamp('¡PLANO APROBADO!', 0x2e8a52, 54, -0.08);
    st.position.set(SHEET_W / 2, SHEET_H / 2);
    this.fxLayer.addChild(st);
    gsap.from(st.scale, { x: 2.6, y: 2.6, duration: 0.2, ease: 'power3.in', onComplete: () => sfx('hit', 1.1) });
    sparkBurst(this.fxLayer, SHEET_W / 2, SHEET_H / 2, 30);
    gsap.delayedCall(0.75, () => {
      this.m.close();
      this.onDone({ saved: true, test });
    });
  }
}

