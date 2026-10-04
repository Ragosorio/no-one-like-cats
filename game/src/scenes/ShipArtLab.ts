import { Container, FederatedPointerEvent, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { Sea } from '../battle/sea';
import { CELL, Cell, ShipBlueprint, ShipModel } from '../battle/ship';
import { BLUEPRINTS } from '../battle/blueprints';
import { AnimeShipView, ShipStyleId } from '../battle/anime';
import { ANIME_BLUEPRINTS } from '../battle/anime/blueprintsAnime';
import { Button, poster, txt } from '../ui/widgets';
import { C, F } from '../ui/theme';
import type { StatusId } from '../battle/types';
import { BattleCat, preloadCats } from '../art/catArt';

const CREWS: [string, string][][] = [
  [['canelo_cozy_cat', 'fire'], ['jelly_aquatic_cat', 'water'], ['mecha_neon_cat', 'electric']],
  [['fossilstone_guardian_cat', 'earth'], ['selene_moonlit_cat', 'ice'], ['neon_glitch_cat', 'magic']],
  [['mecha_neon_cat', 'electric'], ['selene_moonlit_cat', 'ice'], ['neon_glitch_cat', 'magic']],
];

const WATER_Y = 830;

interface Slot {
  style: ShipStyleId;
  bp: ShipBlueprint;
  flip: boolean;
  x: number;
  scale: number;
  model: ShipModel;
  view: AnimeShipView;
}

/** ?scene=shiplab — the three anime ship skins on a sea, with buttons to break them. */
export class ShipArtLab extends Scene {
  world = new Container();
  shipsLayer = new Container();
  debris = new Container();
  fx = new Container();
  ui = new Container();
  sea!: Sea;
  slots: Slot[] = [];
  useAnime = true;
  auto = false;
  autoAcc = 0;
  focus = -1;
  /** dev: ignore pointer input (automated captures) */
  locked = false;
  showCats = true;
  catsReady = false;
  info = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink });

  override enter() {
    this.sea = new Sea(WATER_Y, { skyTop: 0x1f8fe0, skyBottom: 0x9ee3ff, sea: 0x1a8bd0, seaDark: 0x0e5d9c });
    this.addChild(this.world, this.ui);
    this.world.addChild(this.sea, this.shipsLayer, this.debris, this.sea.frontLayer(), this.fx);
    this.buildShips();
    this.buildUi();
    preloadCats([...new Set(CREWS.flat().map((c) => c[0]))])
      .then(() => {
        this.catsReady = true;
        this.addCats();
      })
      .catch(() => undefined);
    this.eventMode = 'static';
    this.hitArea = { contains: () => true };
    this.on('pointerdown', this.click, this);
    (window as unknown as { __lab: ShipArtLab }).__lab = this;
  }

  private plan(): { style: ShipStyleId; bp: ShipBlueprint; flip: boolean }[] {
    if (this.useAnime)
      return [
        { style: 'pirate', bp: ANIME_BLUEPRINTS.galleon, flip: false },
        { style: 'rat', bp: ANIME_BLUEPRINTS.ratship, flip: true },
        { style: 'cosmic', bp: ANIME_BLUEPRINTS.celestial, flip: false },
      ];
    return [
      { style: 'pirate', bp: BLUEPRINTS.sparrow, flip: false },
      { style: 'rat', bp: BLUEPRINTS.balsa, flip: true },
      { style: 'cosmic', bp: BLUEPRINTS.sparrow, flip: true },
    ];
  }

  private buildShips() {
    for (const s of this.slots) s.view.destroy({ children: true });
    this.slots = [];
    const plan = this.plan();
    const scale = 0.8;
    const gap = 40;
    const total = plan.reduce((a, p) => a + p.bp.cols * CELL * scale, 0) + gap * (plan.length - 1);
    let x = (W - total) / 2;
    for (const p of plan) {
      const model = new ShipModel(p.bp, 1);
      model.snapshotMax();
      const view = new AnimeShipView(model, p.flip, p.style);
      view.scale.set(scale);
      view.position.set(x, WATER_Y - view.waterLocalY * scale);
      view.baseY = view.y;
      this.shipsLayer.addChild(view);
      this.slots.push({ ...p, x, scale, model, view });
      x += p.bp.cols * CELL * scale + gap;
    }
    this.addCats();
  }

  /** same placement as BattleScene: cat feet at the bottom of its catroom, inside view.decor */
  private addCats() {
    if (!this.catsReady || !this.showCats) return;
    this.slots.forEach((s, i) => {
      if (s.view.decor.children.length) return;
      const rooms = s.model.modules.filter((m) => m.kind === 'catroom').sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
      rooms.forEach((m, k) => {
        const [slug, el] = CREWS[i % CREWS.length][k % 3];
        const bc = new BattleCat(slug, el, CELL * 3.1, s.flip);
        const p = s.view.cellPos(s.flip ? m.x + m.w - 1 : m.x, m.y);
        bc.position.set(p.x + CELL, p.y + m.h * CELL + 2);
        s.view.decor.addChild(bc);
      });
    });
  }

  private buildUi() {
    const title = poster('SHIP ART LAB · ANIME', 54, C.paper, { stroke: { color: C.ink, width: 8 } });
    title.position.set(36, 18);
    this.ui.addChild(title);
    const sub = txt('clic = romper celda · shift+clic = dañar · los botones afectan a los 3 barcos', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.paper, stroke: { color: C.ink, width: 4 } });
    sub.position.set(40, 84);
    this.ui.addChild(sub);
    const acts: [string, () => void, number?][] = [
      ['ROMPER x3', () => this.each((s) => this.breakRandom(s, 3))],
      ['EXPLOSIÓN', () => this.each((s) => this.explodeRandom(s))],
      ['DAÑAR', () => this.each((s) => this.damageRandom(s, 6))],
      ['FUEGO', () => this.each((s) => this.statusRandom(s, 'burning', 4)), C.orange],
      ['MOJAR', () => this.each((s) => this.statusRandom(s, 'wet', 4)), 0x6fb8ff],
      ['CONGELAR', () => this.each((s) => this.statusRandom(s, 'frozen', 4)), C.mintLight],
      ['RAYO', () => this.each((s) => this.statusRandom(s, 'charged', 4)), C.yellow],
      ['RAÍCES', () => this.each((s) => this.statusRandom(s, 'rooted', 3)), 0x7ed957],
      ['MALDICIÓN', () => this.each((s) => this.statusRandom(s, 'cursed', 3)), C.lilac],
      ['MÓDULO', () => this.each((s) => this.killModule(s))],
      ['DESPRENDER', () => this.each((s) => this.detachChunk(s))],
      ['DISPARAR', () => this.each((s) => s.view.fireCannon())],
      ['AUTO', () => (this.auto = !this.auto), C.pinkHot],
      ['PLANOS', () => ((this.useAnime = !this.useAnime), this.buildShips())],
      ['RESET', () => this.buildShips(), C.paper],
      ['FOCO', () => this.cycleFocus(), C.yellow],
      ['GATOS', () => this.toggleCats(), C.paper],
    ];
    const bw = 100;
    const bh = 44;
    acts.forEach(([label, fn, color], i) => {
      const b = new Button(label, fn, { w: bw, h: bh, size: 19, color: color ?? C.pink, sound: false });
      b.position.set(36 + i * (bw + 6), H - 70);
      this.ui.addChild(b);
    });
    this.info.position.set(40, H - 104);
    this.ui.addChild(this.info);
  }

  /** zoom the camera onto one ship (inspection) */
  cycleFocus(i?: number) {
    this.focus = i ?? (this.focus + 2) % (this.slots.length + 1) - 1;
    const s = this.slots[this.focus];
    if (!s) {
      gsap.to(this.world, { x: 0, y: 0, duration: 0.3 });
      gsap.to(this.world.scale, { x: 1, y: 1, duration: 0.3 });
      return;
    }
    const z = 2.1;
    const cx = s.x + (s.bp.cols * CELL * s.scale) / 2;
    const cy = s.view.y + (s.bp.rows * CELL * s.scale) / 2 - 30;
    gsap.to(this.world, { x: W / 2 - cx * z, y: H / 2 - cy * z, duration: 0.3 });
    gsap.to(this.world.scale, { x: z, y: z, duration: 0.3 });
  }

  private each(fn: (s: Slot) => void) {
    for (const s of this.slots) fn(s);
  }

  private worldOfCell(s: Slot, c: Cell) {
    const p = s.view.cellPos(c.x, c.y);
    return this.debris.toLocal(s.view.toGlobal({ x: p.x + CELL / 2, y: p.y + CELL / 2 }));
  }

  private destroy1(s: Slot, c: Cell, from: { x: number; y: number }, impulse = 1) {
    if (!s.model.destroyCell(c.x, c.y)) return;
    s.view.knockOff(c, this.debris, from, impulse);
  }

  private settle(s: Slot) {
    for (const chunk of s.model.collapse()) s.view.sinkChunk(chunk, this.debris, () => this.boom(0, 0, 0));
    s.view.updateModuleDecor();
  }

  private boom(x: number, y: number, r: number) {
    if (!r) return;
    const g = new Graphics();
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const a2 = a + Math.PI / n;
      const R0 = r * (0.9 + Math.random() * 0.4);
      i ? g.lineTo(Math.cos(a) * R0, Math.sin(a) * R0) : g.moveTo(Math.cos(a) * R0, Math.sin(a) * R0);
      g.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
    }
    g.closePath().fill(C.yellow).stroke({ width: 5, color: C.ink, join: 'miter' });
    g.circle(0, 0, r * 0.32).fill(0xffffff);
    g.position.set(x, y);
    this.fx.addChild(g);
    g.scale.set(0.3);
    gsap.to(g.scale, { x: 1.1, y: 1.1, duration: 0.12, ease: 'back.out(3)' });
    gsap.to(g, { alpha: 0, duration: 0.18, delay: 0.12, onComplete: () => g.destroy() });
  }

  private breakRandom(s: Slot, n: number) {
    const cells = s.model.cells();
    for (let i = 0; i < n && cells.length; i++) {
      const c = cells.splice(Math.floor(Math.random() * cells.length), 1)[0];
      const w = this.worldOfCell(s, c);
      this.destroy1(s, c, { x: w.x + (Math.random() - 0.5) * 60, y: w.y + 30 });
      s.view.hitReact(this.toGlobal(w).x, this.toGlobal(w).y, 0.6);
    }
    this.settle(s);
  }

  private explodeAt(s: Slot, cx: number, cy: number, radius = 62, dmg = 90) {
    const center = this.worldOfCell(s, s.model.get(cx, cy) ?? { x: cx, y: cy, hp: 0, maxHp: 1, material: 'wood', status: {} });
    this.boom(center.x, center.y, radius * 0.9);
    const g = this.toGlobal(center);
    s.view.hitReact(g.x, g.y, 1);
    for (const c of s.model.cells()) {
      const w = this.worldOfCell(s, c);
      const d = Math.hypot(w.x - center.x, w.y - center.y) / s.scale;
      if (d > radius + CELL * 0.35) continue;
      const fall = Math.max(0.3, 1 - d / (radius + CELL * 0.35));
      c.hp -= dmg * fall * (c.material === 'iron' ? 0.6 : 1);
      if (c.hp <= 0) this.destroy1(s, c, center, 1.1);
      else s.view.refreshCell(c);
    }
    this.settle(s);
  }

  private explodeRandom(s: Slot) {
    const cells = s.model.cells();
    if (!cells.length) return;
    const c = cells[Math.floor(Math.random() * cells.length)];
    this.explodeAt(s, c.x, c.y);
  }

  private damageRandom(s: Slot, n: number) {
    const cells = s.model.cells();
    for (let i = 0; i < n && cells.length; i++) {
      const c = cells[Math.floor(Math.random() * cells.length)];
      c.hp = Math.max(1, c.hp - c.maxHp * (0.2 + Math.random() * 0.35));
      s.view.refreshCell(c);
    }
  }

  private statusRandom(s: Slot, id: StatusId, n: number) {
    const cells = s.model.cells();
    if (!cells.length) return;
    // a small cluster
    const seed = cells[Math.floor(Math.random() * cells.length)];
    const near = cells.filter((c) => Math.abs(c.x - seed.x) <= 1 && Math.abs(c.y - seed.y) <= 1).slice(0, n);
    for (const c of near) {
      c.status[id] = 3;
      s.view.refreshCell(c);
    }
  }

  private killModule(s: Slot) {
    const alive = s.model.modules.filter((m) => m.alive);
    if (!alive.length) return;
    const m = alive[Math.floor(Math.random() * alive.length)];
    const cells = s.model.moduleCells(m.id);
    // damage the module heavily and kill one cell so it dies
    for (const c of cells) {
      c.hp = Math.max(1, c.hp * 0.25);
      s.view.refreshCell(c);
    }
    m.alive = false;
    const c = cells[cells.length - 1];
    const w = this.worldOfCell(s, c);
    this.boom(w.x, w.y, 40);
    s.view.hitReact(this.toGlobal(w).x, this.toGlobal(w).y, 0.8);
    s.view.updateModuleDecor();
    this.info.text = `módulo roto: ${m.kind}`;
  }

  /** cut a vertical line through the ship above the deck so a big piece sinks */
  private detachChunk(s: Slot) {
    const mast = s.model.modules.find((m) => m.kind === 'mast' && s.model.moduleCells(m.id).length > 1);
    if (mast) {
      // snap the mast at its base
      const base = s.model.get(mast.x, mast.y + mast.h - 1);
      if (base) {
        const w = this.worldOfCell(s, base);
        this.boom(w.x, w.y, 36);
        this.destroy1(s, base, { x: w.x - 30, y: w.y + 20 }, 0.7);
      }
      this.settle(s);
      return;
    }
    // otherwise cut the bow off
    const col = Math.max(1, s.model.cols - 4);
    const lx = s.flip ? s.model.cols - 1 - col : col;
    for (let y = 0; y < s.model.rows; y++) {
      const c = s.model.get(lx, y);
      if (!c) continue;
      const w = this.worldOfCell(s, c);
      this.destroy1(s, c, { x: w.x, y: w.y + 20 }, 0.8);
    }
    // the bow side has no keel connection once cut only if bottom row is gone too
    for (let x = s.flip ? 0 : col; s.flip ? x < lx : x < s.model.cols; x++) {
      const c = s.model.get(x, s.model.rows - 1);
      if (c) this.destroy1(s, c, this.worldOfCell(s, c), 0.5);
    }
    this.settle(s);
  }

  toggleCats() {
    this.showCats = !this.showCats;
    if (this.showCats) this.addCats();
    else for (const s of this.slots) for (const c of [...s.view.decor.children]) c.destroy({ children: true });
  }

  lock(v = true) {
    this.locked = v;
    this.ui.eventMode = v ? 'none' : 'passive';
  }

  private click(e: FederatedPointerEvent) {
    if (this.locked) return;
    const p = this.toLocal(e.global);
    if (p.y > H - 120) return;
    for (const s of this.slots) {
      const lp = s.view.toLocal(e.global);
      const g = s.view.toGrid(lp.x, lp.y);
      const c = s.model.get(g.x, g.y);
      if (!c) continue;
      if (e.shiftKey) {
        c.hp = Math.max(1, c.hp - c.maxHp * 0.3);
        s.view.refreshCell(c);
        s.view.hitReact(e.global.x, e.global.y, 0.4);
      } else this.explodeAt(s, c.x, c.y, 50, 75);
      this.info.text = `celda ${c.x},${c.y} · ${c.material} · hp ${Math.max(0, Math.round(c.hp))}/${c.maxHp}`;
      return;
    }
  }

  override update(dt: number) {
    for (const s of this.slots) s.view.bob(dt);
    if (this.auto) {
      this.autoAcc += dt;
      if (this.autoAcc > 0.9) {
        this.autoAcc = 0;
        const s = this.slots[Math.floor(Math.random() * this.slots.length)];
        const r = Math.random();
        if (r < 0.55) this.explodeRandom(s);
        else if (r < 0.75) this.statusRandom(s, (['burning', 'wet', 'frozen', 'charged', 'cursed', 'rooted'] as StatusId[])[Math.floor(Math.random() * 6)], 3);
        else if (r < 0.85) s.view.fireCannon();
        else this.damageRandom(s, 4);
      }
    }
  }
}
