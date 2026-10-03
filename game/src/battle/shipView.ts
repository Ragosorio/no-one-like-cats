import { Container, Graphics, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import { CELL, Cell, ModuleInst, ShipModel } from './ship';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';

const MAT_COLORS = {
  wood: { fill: 0xa8743f, dark: 0x6b4423, light: 0xc99358 },
  iron: { fill: 0x5d6673, dark: 0x343a42, light: 0x8a95a3 },
  crystal: { fill: 0x8f6b93, dark: 0x5c3d5b, light: 0xc9b3d6 },
  bone: { fill: 0xe6dcc6, dark: 0xa89a7c, light: 0xfff8e6 },
  void: { fill: 0x231626, dark: 0x0d110f, light: 0x8a5cff },
} as const;

const MODULE_STYLE: Record<ModuleInst['kind'], { color: number; label: string }> = {
  core: { color: C.pinkHot, label: 'NÚCLEO' },
  cannon: { color: C.ink, label: '' },
  catroom: { color: C.paper, label: '' },
  mast: { color: 0x6b4423, label: '' },
  shield: { color: C.cyan, label: '' },
  engine: { color: C.orange, label: '' },
  powder: { color: C.red, label: 'TNT' },
  arcane: { color: C.violet, label: '' },
};

/**
 * Renders a ShipModel. Each cell is its own Graphics so it can be knocked off individually.
 * `flip` mirrors the ship horizontally (enemy faces left).
 */
export class ShipView extends Container {
  cellViews = new Map<Cell, Graphics>();
  moduleDecor = new Map<number, Container>();
  hull = new Container();
  decor = new Container();
  statusLayer = new Container();
  bobT = Math.random() * 10;
  baseY = 0;
  baseX = NaN;
  kickRot = 0;
  kickX = 0;
  kickVr = 0;
  kickVx = 0;

  constructor(public model: ShipModel, public flip: boolean) {
    super();
    this.addChild(this.hull, this.decor, this.statusLayer);
    for (const c of model.cells()) this.addCell(c);
    for (const m of model.modules) this.addModuleDecor(m);
  }

  /** local px of cell top-left */
  cellPos(x: number, y: number) {
    const lx = this.flip ? (this.model.cols - 1 - x) * CELL : x * CELL;
    return { x: lx, y: y * CELL };
  }

  /** local px -> grid coords */
  toGrid(lx: number, ly: number) {
    let gx = Math.floor(lx / CELL);
    if (this.flip) gx = this.model.cols - 1 - gx;
    return { x: gx, y: Math.floor(ly / CELL) };
  }

  private addCell(c: Cell) {
    const g = new Graphics();
    this.drawCell(g, c);
    const p = this.cellPos(c.x, c.y);
    g.position.set(p.x, p.y);
    this.hull.addChild(g);
    this.cellViews.set(c, g);
  }

  drawCell(g: Graphics, c: Cell) {
    const col = MAT_COLORS[c.material];
    const s = CELL;
    const dmg = 1 - c.hp / c.maxHp;
    g.clear();
    let fill: number = col.fill;
    if (c.module !== undefined) {
      const m = this.model.modules[c.module];
      if (m.kind === 'catroom') fill = 0xd9cdb8;
      if (m.kind === 'core') fill = 0x3a2a3e;
      if (m.kind === 'powder') fill = 0x7a1a1a;
    }
    g.rect(0, 0, s, s).fill(fill);
    if (c.material === 'wood' && c.module === undefined) {
      g.moveTo(0, s * 0.5).lineTo(s, s * 0.5).stroke({ width: 2, color: col.dark, alpha: 0.6 });
      g.moveTo(s * 0.3, 0).lineTo(s * 0.3, s * 0.5).moveTo(s * 0.75, s * 0.5).lineTo(s * 0.75, s).stroke({ width: 2, color: col.dark, alpha: 0.5 });
    } else if (c.material === 'iron' && c.module === undefined) {
      for (const [rx, ry] of [
        [5, 5],
        [s - 5, 5],
        [5, s - 5],
        [s - 5, s - 5],
      ])
        g.circle(rx, ry, 2.5).fill(col.light);
    } else if (c.material === 'crystal' && c.module === undefined) {
      g.moveTo(4, s - 4).lineTo(s / 2, 4).lineTo(s - 4, s - 4).stroke({ width: 2, color: col.light, alpha: 0.8 });
    }
    // top highlight
    g.rect(0, 0, s, 4).fill({ color: 0xffffff, alpha: 0.12 });
    // cracks
    if (dmg > 0.25) {
      g.moveTo(s * 0.2, s * 0.1).lineTo(s * 0.45, s * 0.45).lineTo(s * 0.35, s * 0.8).stroke({ width: 2, color: C.ink });
    }
    if (dmg > 0.6) {
      g.moveTo(s * 0.8, s * 0.15).lineTo(s * 0.55, s * 0.5).lineTo(s * 0.85, s * 0.9).stroke({ width: 2, color: C.ink });
      g.rect(0, 0, s, s).fill({ color: C.ink, alpha: 0.25 });
    }
    // status tints
    if (c.status.wet) g.rect(0, 0, s, s).fill({ color: 0x3569a3, alpha: 0.35 });
    if (c.status.frozen) g.rect(0, 0, s, s).fill({ color: 0xc6f0e4, alpha: 0.55 });
    if (c.status.burning) g.rect(0, 0, s, s).fill({ color: 0xff6a1a, alpha: 0.4 });
    if (c.status.charged) g.rect(0, 0, s, s).fill({ color: 0xffe14a, alpha: 0.3 });
    g.rect(0, 0, s, s).stroke({ width: 2.5, color: C.ink, alignment: 0.5 });
  }

  refreshCell(c: Cell) {
    const g = this.cellViews.get(c);
    if (g) this.drawCell(g, c);
  }

  private addModuleDecor(m: ModuleInst) {
    const d = new Container();
    const p0 = this.cellPos(this.flip ? m.x + m.w - 1 : m.x, m.y);
    d.position.set(p0.x, p0.y);
    const w = m.w * CELL;
    const h = m.h * CELL;
    const st = MODULE_STYLE[m.kind];
    const g = new Graphics();
    switch (m.kind) {
      case 'core': {
        g.circle(w / 2, h / 2, Math.min(w, h) * 0.32).fill(C.pinkHot).stroke({ width: 4, color: C.ink });
        g.circle(w / 2, h / 2, Math.min(w, h) * 0.14).fill(C.yellow);
        break;
      }
      case 'cannon': {
        const dir = this.flip ? -1 : 1;
        const cx = w / 2;
        g.roundRect(cx - 14, h - 22, 28, 18, 4).fill(0x343a42).stroke({ width: 3, color: C.ink });
        g.rect(cx, h - 26, dir * (w * 0.6), 12).fill(0x22262c).stroke({ width: 3, color: C.ink });
        break;
      }
      case 'mast': {
        g.rect(w / 2 - 5, 0, 10, h).fill(0x6b4423).stroke({ width: 3, color: C.ink });
        const dir = this.flip ? -1 : 1;
        g.moveTo(w / 2, 8)
          .lineTo(w / 2 + dir * 70, h * 0.45)
          .lineTo(w / 2, h * 0.75)
          .closePath()
          .fill(C.paper)
          .stroke({ width: 3, color: C.ink });
        break;
      }
      case 'shield': {
        g.circle(w / 2, h / 2, Math.min(w, h) * 0.35).fill({ color: C.cyan, alpha: 0.6 }).stroke({ width: 3, color: C.ink });
        break;
      }
      case 'engine': {
        g.rect(6, 6, w - 12, h - 12).fill(C.orange).stroke({ width: 3, color: C.ink });
        g.circle(w / 2, h / 2, 9).fill(C.ink);
        break;
      }
      case 'powder': {
        g.rect(5, 5, w - 10, h - 10).fill(C.red).stroke({ width: 3, color: C.ink });
        break;
      }
      case 'arcane': {
        g.star(w / 2, h / 2, 5, Math.min(w, h) * 0.38, Math.min(w, h) * 0.16).fill(C.violet).stroke({ width: 3, color: C.ink });
        break;
      }
      case 'catroom':
        g.rect(4, 4, w - 8, h - 8).stroke({ width: 2, color: C.ink, alpha: 0.35 });
        break;
    }
    d.addChild(g);
    if (st.label) {
      const t: Text = txt(st.label, { fontFamily: F.poster, fontSize: 14, fill: C.paper });
      t.anchor.set(0.5);
      t.position.set(w / 2, h - 10);
      d.addChild(t);
    }
    this.decor.addChild(d);
    this.moduleDecor.set(m.id, d);
  }

  /** Remove the visual of a destroyed cell, spawning a falling chip. */
  knockOff(c: Cell, debrisLayer: Container, worldPos: { x: number; y: number }, impulse = 1) {
    const g = this.cellViews.get(c);
    if (!g) return;
    this.cellViews.delete(c);
    const gp = g.getGlobalPosition();
    const lp = debrisLayer.toLocal(gp);
    debrisLayer.addChild(g);
    g.position.copyFrom(lp);
    g.pivot.set(CELL / 2, CELL / 2);
    g.x += CELL / 2;
    g.y += CELL / 2;
    const dx = (g.x - worldPos.x) * 0.02 + (Math.random() - 0.5) * 3;
    const vx = dx * 120 * impulse;
    gsap.to(g, { x: g.x + vx, duration: 1.4, ease: 'power1.out' });
    gsap.to(g, { y: g.y - 80 * impulse - Math.random() * 60, duration: 0.35, ease: 'power2.out' });
    gsap.to(g, { y: 1200, duration: 1.1, delay: 0.35, ease: 'power2.in' });
    gsap.to(g, { rotation: (Math.random() - 0.5) * 12, duration: 1.4 });
    gsap.to(g, { alpha: 0, duration: 0.4, delay: 1.05, onComplete: () => g.destroy() });
  }

  /** Detach a whole chunk and let it sink as one rigid group. */
  sinkChunk(chunk: Cell[], debrisLayer: Container, onSplash?: (x: number) => void) {
    const group = new Container();
    debrisLayer.addChild(group);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const gs: Graphics[] = [];
    for (const c of chunk) {
      const g = this.cellViews.get(c);
      if (!g) continue;
      this.cellViews.delete(c);
      const gp = debrisLayer.toLocal(g.getGlobalPosition());
      gs.push(g);
      g.position.copyFrom(gp);
      minX = Math.min(minX, gp.x);
      maxX = Math.max(maxX, gp.x + CELL);
      minY = Math.min(minY, gp.y);
      maxY = Math.max(maxY, gp.y + CELL);
    }
    if (!gs.length) {
      group.destroy();
      return;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    group.position.set(cx, cy);
    for (const g of gs) {
      group.addChild(g);
      g.x -= cx;
      g.y -= cy;
    }
    // hide module decor whose cells all left
    for (const [id, d] of this.moduleDecor) {
      if (!this.model.modules[id].alive && this.model.moduleCells(id).length === 0) {
        const gp = debrisLayer.toLocal(d.getGlobalPosition());
        group.addChild(d);
        d.position.set(gp.x - cx, gp.y - cy);
        this.moduleDecor.delete(id);
      }
    }
    const dir = Math.random() < 0.5 ? -1 : 1;
    gsap
      .timeline({ onComplete: () => group.destroy({ children: true }) })
      .to(group, { rotation: dir * (0.3 + Math.random() * 0.6), duration: 1.6, ease: 'power1.in' }, 0)
      .to(group, { y: cy + 30, duration: 0.25, ease: 'power1.out' }, 0)
      .to(group, { y: 1300, duration: 1.4, ease: 'power2.in', onStart: () => window.setTimeout(() => onSplash?.(cx), 700) }, 0.25)
      .to(group, { alpha: 0, duration: 0.3 }, 1.4);
  }

  updateModuleDecor() {
    for (const [id, d] of this.moduleDecor) {
      const m = this.model.modules[id];
      if (!m.alive && d.alpha === 1) {
        gsap.to(d, { alpha: 0.25, duration: 0.3 });
      }
    }
  }

  /** impact reaction: tilt + shove with a spring (strength 0..1) */
  hitReact(localX: number, strength: number) {
    const dir = localX < this.model.cols * 20 ? -1 : 1;
    this.kickVr += dir * 0.9 * strength;
    this.kickVx += (this.flip ? 1 : -1) * 260 * strength;
  }

  bob(dt: number) {
    if (Number.isNaN(this.baseX)) this.baseX = this.x;
    this.bobT += dt;
    // damped springs for impact kicks
    this.kickVr += -this.kickRot * 90 * dt - this.kickVr * 7 * dt;
    this.kickRot += this.kickVr * dt;
    this.kickVx += -this.kickX * 60 * dt - this.kickVx * 6 * dt;
    this.kickX += this.kickVx * dt;
    this.y = this.baseY + Math.sin(this.bobT * 1.4) * 6;
    this.x = this.baseX + this.kickX;
    this.rotation = Math.sin(this.bobT * 0.9) * 0.015 + this.kickRot;
  }
}

export type { Sprite };
