/**
 * Center of the Astillero: the active ship drawn on a blueprint sheet with technical callouts,
 * weapon badges per cannon, utility badges, Escudo Burbuja, hand notes ("punto débil"),
 * welding sparks while a family is "en obra", and the EDITAR PLANO / PROBAR buttons.
 */
import { Container, Graphics, Sprite, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { G } from '../../state/game';
import type { FamilyId } from '../../state/econ';
import { AnimeShipView, hullStyleForMk } from '../../battle/anime';
import { CELL, ShipModel } from '../../battle/ship';
import { WEAPON_BY_ID } from '../../battle/weapons';
import {
  FAMILY_NAME,
  collapsePreview,
  crew,
  hullClass,
  isCustomLayout,
  layoutOf,
  mk,
  moduleLabel,
  playerBlueprint,
  roman,
  shieldSlots,
  shipName,
  weaponsOf,
  LayoutModule,
} from '../../state/sys/ship';
import { equippedArtifacts, ARTIFACT_BY_ID } from '../../state/sys/gear';
import { glowTexture } from '../../art/textures';
import { cat as getCat } from '../../state/sys/cats';
import { clearChildren } from '../campaign/common';
import { BP, bpSheet, bubbleShield, handArrow, handCircle, handNote, iconButton, moduleGlyph, sparkBurst, weaponGlyph, weldSparks } from './art';

const MAT_ES: Record<string, string> = { wood: 'MADERA', iron: 'HIERRO', crystal: 'CORAL' };

export interface PlanOpts {
  w: number;
  h: number;
  onEdit: () => void;
  onTest: () => void;
  onCannon: (slot: number) => void;
}

export class PlanView extends Container {
  private sheet = new Container();
  private art = new Container();
  private over = new Container();
  private fx = new Container();
  private view: AnimeShipView | null = null;
  private k = 1;
  private sx = 0;
  private sy = 0;
  private mods: LayoutModule[] = [];
  private cannonPts: { x: number; y: number }[] = [];
  private ring: Graphics | null = null;
  private stops: (() => void)[] = [];
  private jobsSig = '';
  private key = '';

  constructor(private o: PlanOpts) {
    super();
    this.addChild(this.sheet, this.art, this.over, this.fx);
    Ticker.shared.add(this.tick, this);
    this.on('destroyed', () => Ticker.shared.remove(this.tick, this));
  }

  /** full rebuild only when the ship, its layout, the hull Mk or the weapons changed */
  refresh(force = false) {
    const shipId = G.s.ship.active;
    const key = `${shipId}|${mk('hull')}|${mk('shield')}|${JSON.stringify(layoutOf(shipId))}|${weaponsOf(shipId).join(',')}|${crew(shipId).join(',')}|${equippedArtifacts(shipId).join(',')}`;
    if (!force && key === this.key) {
      this.updateSparks();
      return;
    }
    this.key = key;
    this.build();
  }

  private build() {
    const { w, h } = this.o;
    for (const s of this.stops) s();
    this.stops = [];
    this.jobsSig = '';
    clearChildren(this.sheet);
    clearChildren(this.art);
    clearChildren(this.over);
    this.ring = null;
    this.view = null;
    const shipId = G.s.ship.active;
    this.sheet.addChild(bpSheet(w, h));
    const { bp } = playerBlueprint(shipId);
    this.mods = layoutOf(shipId);
    // fit the ship between the callout columns
    const maxW = w - 330;
    const maxH = h - 150;
    const hullW = bp.cols * CELL;
    const hullH = bp.rows * CELL;
    this.k = Math.min(maxW / hullW, maxH / (hullH + 40), 0.95);
    this.sx = (w - hullW * this.k) / 2;
    this.sy = 66 + (maxH - hullH * this.k) / 2 + 10;
    // waterline (technical)
    const wl = new Graphics();
    const wy = this.sy + (hullH - 70) * this.k;
    for (let x = 30; x < w - 30; x += 18) wl.moveTo(x, wy).lineTo(x + 9, wy);
    wl.stroke({ width: 1.5, color: BP.cyan, alpha: 0.6 });
    this.sheet.addChild(wl);
    const shieldOn = mk('shield') >= 1 && shieldSlots(shipId) > 0;
    try {
      const model = new ShipModel(bp, 1);
      const v = new AnimeShipView(model, false, hullStyleForMk(mk('hull')), { waterLocalY: hullH - 70 });
      v.scale.set(this.k);
      v.position.set(this.sx, this.sy);
      this.art.addChild(v);
      this.view = v;
    } catch (e) {
      console.warn('[shipyard] plan art failed', e);
    }
    // Escudo Burbuja: translucent dome over the ship (it is a bubble, you see through it)
    if (shieldOn) {
      const dome = bubbleShield((hullW * this.k) / 2 + 40, (hullH * this.k) / 2 + 34);
      dome.position.set(this.sx + (hullW * this.k) / 2, this.sy + (hullH * this.k) / 2 - 10);
      this.art.addChild(dome);
    }
    this.buildCallouts(shieldOn);
    // waterline label where no callout sits
    const wlt = txt('LÍNEA DE FLOTACIÓN', { fontFamily: F.bebas, fontSize: 14, fill: BP.cyan, letterSpacing: 2 });
    wlt.alpha = 0.8;
    const busy = (x0: number, x1: number) =>
      this.over.children.some((ch) => {
        if (!(ch instanceof Text)) return false;
        const b = ch.getLocalBounds();
        const cx0 = ch.x + b.x;
        return Math.abs(ch.y + b.y + b.height / 2 - (wy - 10)) < 18 && cx0 < x1 && cx0 + b.width > x0;
      });
    if (!busy(30, 30 + wlt.width)) {
      wlt.position.set(34, wy - 18);
      this.sheet.addChild(wlt);
    } else if (!busy(w - 34 - wlt.width, w - 30)) {
      wlt.position.set(w - 34 - wlt.width, wy - 18);
      this.sheet.addChild(wlt);
    } else wlt.destroy();
    this.buildNotes();
    this.buildTitleBlock();
    this.buildButtons();
    this.updateSparks();
    // ink-in: callouts fade/slide in
    let i = 0;
    for (const ch of this.over.children) {
      gsap.from(ch, { alpha: 0, duration: 0.25, delay: 0.02 * i++, ease: 'power1.out' });
    }
  }

  /** grid → sheet coordinates */
  toSheet(gx: number, gy: number) {
    return { x: this.sx + gx * CELL * this.k, y: this.sy + gy * CELL * this.k };
  }

  private buildCallouts(shieldOn: boolean) {
    const { w, h } = this.o;
    const shipId = G.s.ship.active;
    const crewU = crew(shipId);
    const weapons = weaponsOf(shipId);
    const callouts: { x: number; y: number; text: string; color: number; cannon?: number; glyph?: string }[] = [];
    let cannonN = 0;
    this.cannonPts = [];
    this.mods.forEach((m, i) => {
      const p = this.toSheet(m.x + m.w / 2, m.y + m.h / 2);
      let text = '';
      let color: number = BP.white;
      let cannon: number | undefined;
      if (m.kind === 'cannon') {
        const slot = cannonN++;
        const wt = WEAPON_BY_ID.get(weapons[slot] ?? 'canon');
        text = `CAÑÓN ${slot + 1} · ${(wt?.name ?? 'Cañón').toUpperCase()}`;
        color = weapons[slot] && weapons[slot] !== 'canon' ? BP.yellow : BP.white;
        cannon = slot;
        this.cannonPts.push(p);
      } else if (m.kind === 'core') text = 'CORAZÓN (NÚCLEO)';
      else if (m.kind === 'catroom') {
        const u = crewU[m.slot ?? 0];
        const cc = u ? getCat(u) : undefined;
        text = `CAMAROTE ${(m.slot ?? 0) + 1} · ${cc ? cc.name.toUpperCase() : 'VACÍO'}`;
        if (!cc) color = BP.red;
      } else if (m.kind === 'engine') text = `MOTOR MK ${roman(mk('engine'))}`;
      else if (m.kind === 'shield') {
        if (this.mods.findIndex((x) => x.kind === 'shield') !== i) return;
        text = shieldOn ? `ESCUDO BURBUJA ×${this.mods.filter((x) => x.kind === 'shield').length}` : 'GENERADOR DE ESCUDO (APAGADO)';
        color = shieldOn ? BP.cyan : BP.line;
      } else text = moduleLabel(this.mods, i).toUpperCase();
      callouts.push({ x: p.x, y: p.y, text, color, cannon });
    });
    // big ships: cannon badges already say "1·Mortero", and the crew is listed below → keep the plan legible
    const crowded = callouts.length > 12;
    for (let i = callouts.length - 1; i >= 0; i--) {
      const q = callouts[i];
      const isCannon = q.cannon !== undefined;
      const isRoom = q.text.startsWith('CAMAROTE');
      if (crowded && isCannon && weapons.length > 2) callouts.splice(i, 1);
      else if (crowded && isRoom && q.color !== BP.red) callouts.splice(i, 1);
    }
    const mid = this.sx + (this.view ? (this.view.model.cols * CELL * this.k) / 2 : w / 2);
    const leftC = callouts.filter((q) => q.x < mid).sort((a, b) => a.y - b.y);
    const rightC = callouts.filter((q) => q.x >= mid).sort((a, b) => a.y - b.y);
    const lines = new Graphics();
    const place = (list: typeof callouts, side: -1 | 1) => {
      const gap = Math.min(30, (h - 170) / Math.max(1, list.length));
      let lastY = 62;
      for (const q of list) {
        const ly = Math.max(lastY + gap, Math.min(h - 104, q.y - 8));
        lastY = ly;
        const lx = side < 0 ? 26 : w - 26;
        const t = txt(q.text, { fontFamily: F.bebas, fontSize: 19, fill: q.color, letterSpacing: 1 });
        t.anchor.set(side < 0 ? 0 : 1, 0.5);
        t.position.set(lx, ly);
        const ex = side < 0 ? lx + t.width + 8 : lx - t.width - 8;
        lines.moveTo(ex, ly).lineTo(ex + side * 16, ly).lineTo(q.x, q.y);
        lines.circle(q.x, q.y, 3.5);
        this.over.addChild(t);
        if (q.cannon !== undefined) {
          const slot = q.cannon;
          t.eventMode = 'static';
          t.cursor = 'pointer';
          t.on('pointerover', () => this.highlightCannon(slot));
          t.on('pointerout', () => this.highlightCannon(null));
          t.on('pointertap', () => this.o.onCannon(slot));
        }
      }
    };
    place(leftC, -1);
    place(rightC, 1);
    lines.stroke({ width: 1.4, color: BP.white, alpha: 0.85 });
    this.over.addChildAt(lines, 0);
    // weapon badges on the cannons + utility badges
    let n = 0;
    this.mods.forEach((m) => {
      const c = this.toSheet(m.x + m.w / 2, m.y + m.h / 2);
      if (m.kind === 'cannon') {
        const slot = n++;
        const b = new Container();
        b.position.set(c.x, c.y - 26 * Math.max(0.8, this.k));
        const disc = new Graphics().circle(0, 0, 17).fill({ color: BP.deep, alpha: 0.9 }).stroke({ width: 2, color: BP.white });
        const gl = weaponGlyph(weapons[slot] ?? 'canon', 26);
        const num = txt(String(slot + 1), { fontFamily: F.poster, fontSize: 13, fill: C.ink });
        num.anchor.set(0.5);
        const nb = new Graphics().circle(13, -13, 8).fill(BP.yellow).stroke({ width: 1.5, color: C.ink });
        num.position.set(13, -13);
        b.addChild(disc, gl, nb, num);
        b.eventMode = 'static';
        b.cursor = 'pointer';
        b.on('pointerover', () => this.highlightCannon(slot));
        b.on('pointerout', () => this.highlightCannon(null));
        b.on('pointertap', () => this.o.onCannon(slot));
        this.over.addChild(b);
      } else if (!['core', 'catroom', 'engine', 'shield', 'mast', 'powder', 'arcane'].includes(m.kind)) {
        const b = new Container();
        b.position.set(c.x, c.y);
        b.addChild(new Graphics().circle(0, 0, 15).fill({ color: BP.deep, alpha: 0.85 }).stroke({ width: 2, color: BP.yellow }));
        b.addChild(moduleGlyph(m.kind, 22, BP.yellow));
        this.over.addChild(b);
      }
    });
  }

  private buildNotes() {
    const { w } = this.o;
    const shipId = G.s.ship.active;
    // weakest point: the module whose loss drops the most cells
    let best = -1;
    let bestN = 0;
    let bestMods: number[] = [];
    this.mods.forEach((_m, i) => {
      const cp = collapsePreview(shipId, this.mods, { module: i });
      if (cp.cells.length > bestN) {
        bestN = cp.cells.length;
        best = i;
        bestMods = cp.modules;
      }
    });
    if (best >= 0 && bestN >= 2) {
      const m = this.mods[best];
      const c = this.toSheet(m.x + m.w / 2, m.y + m.h / 2);
      this.over.addChild(handCircle(c.x, c.y, (m.w * CELL * this.k) / 2 + 12, (m.h * CELL * this.k) / 2 + 10, BP.yellow, 2.2));
      const falls = bestMods.length ? ` y se va ${moduleLabel(this.mods, bestMods[0])}` : '';
      const note = handNote(`¡punto débil! si cae, caen ${bestN} celdas${falls}`, 17, BP.yellow, -0.04, { wordWrap: true, wordWrapWidth: 250 });
      note.position.set(Math.min(w - 280, Math.max(30, c.x - 120)), 28);
      this.over.addChild(note, handArrow(note.x + 80, note.y + note.height + 2, c.x, c.y - (m.h * CELL * this.k) / 2 - 12, BP.yellow, 2.2, best));
    } else if (!this.mods.some((m) => m.kind === 'mast')) {
      const note = handNote('sin mástil = apuntas a ciegas (45%)', 18, BP.yellow, -0.03);
      note.position.set(w / 2 - 150, 28);
      this.over.addChild(note);
    } else {
      const note = handNote(isCustomLayout(shipId) ? 'plano propio · todo amarrado a la quilla' : 'de fábrica · todo amarrado a la quilla', 17, BP.green, -0.02);
      note.position.set(w - note.width - 36, 26);
      this.over.addChild(note);
    }
  }

  private buildTitleBlock() {
    const { w, h } = this.o;
    const shipId = G.s.ship.active;
    const hc = hullClass();
    // dimensions line
    const a = this.toSheet(0, this.view?.model.rows ?? 9);
    const b = this.toSheet(this.view?.model.cols ?? 12, this.view?.model.rows ?? 9);
    const yy = Math.min(h - 104, a.y + 16);
    const dim = new Graphics();
    dim.moveTo(a.x, yy).lineTo(b.x, yy).moveTo(a.x, yy - 7).lineTo(a.x, yy + 7).moveTo(b.x, yy - 7).lineTo(b.x, yy + 7).stroke({ width: 1.6, color: BP.white, alpha: 0.85 });
    const dl = txt(`${this.view?.model.cols ?? '?'} × ${this.view?.model.rows ?? '?'} CELDAS`, { fontFamily: F.bebas, fontSize: 17, fill: BP.white, letterSpacing: 2 });
    dl.anchor.set(0.5, 1);
    dl.position.set(Math.min((a.x + b.x) / 2, w - 380 - dl.width / 2), yy - 2);
    this.over.addChild(dim, dl);
    const tb = new Container();
    const tbw = 344;
    const tbh = 82;
    tb.position.set(w - tbw - 18, h - tbh - 18);
    const g = new Graphics().rect(0, 0, tbw, tbh).fill({ color: BP.deep, alpha: 0.92 }).stroke({ width: 2, color: BP.white });
    g.moveTo(0, 30).lineTo(tbw, 30).moveTo(0, 56).lineTo(tbw, 56).stroke({ width: 1, color: BP.white, alpha: 0.8 });
    const tn = txt(shipName(shipId).toUpperCase(), { fontFamily: F.poster, fontSize: 22, fill: BP.white });
    tn.position.set(10, 1);
    const ti = txt(`CASCO MK ${roman(mk('hull'))} · ${hc.name.toUpperCase()} · ${MAT_ES[hc.mat] ?? hc.mat} ${hc.cellHp}/CELDA`, { fontFamily: F.bebas, fontSize: 15, fill: BP.white, letterSpacing: 1 });
    ti.position.set(10, 34);
    const arts = equippedArtifacts(shipId).map((id) => ARTIFACT_BY_ID.get(id)?.name ?? id);
    const ts = txt(arts.length ? `ARTEFACTOS: ${arts.join(' · ').toUpperCase()}` : `PLANO Nº ${String(G.s.ship.owned.indexOf(shipId) + 1).padStart(3, '0')} · ESC. 1:40 · NO ONE LIKE CATS`, {
      fontFamily: F.bebas,
      fontSize: 14,
      fill: arts.length ? BP.yellow : BP.line,
      letterSpacing: 1,
    });
    ts.position.set(10, 60);
    tb.addChild(g, tn, ti, ts);
    this.over.addChild(tb);
  }

  private buildButtons() {
    const { h } = this.o;
    const edit = iconButton('EDITAR PLANO', 'pencil', () => this.o.onEdit(), { w: 206, h: 44, size: 22, color: C.paper });
    edit.position.set(22, h - 66);
    const test = iconButton('PROBAR', 'play', () => this.o.onTest(), { w: 150, h: 44, size: 22, color: C.mint });
    test.position.set(242, h - 66);
    this.over.addChild(edit, test);
  }

  // ---------------------------------------------------------------- live bits
  highlightCannon(slot: number | null) {
    if (this.ring) {
      this.ring.destroy();
      this.ring = null;
    }
    if (slot === null) return;
    const p = this.cannonPts[slot];
    if (!p) return;
    const r = new Graphics().circle(0, 0, 30).stroke({ width: 3, color: BP.yellow }).circle(0, 0, 38).stroke({ width: 1.5, color: BP.yellow, alpha: 0.6 });
    r.position.set(p.x, p.y);
    this.fx.addChild(r);
    gsap.fromTo(r.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' });
    gsap.to(r, { rotation: Math.PI, duration: 3, repeat: -1, ease: 'none' });
    this.ring = r;
  }

  /** points where a family is being worked on */
  private familyPoints(f: FamilyId) {
    const pts: { x: number; y: number }[] = [];
    const kinds: Record<FamilyId, string[]> = { hull: [], weapon: ['cannon'], engine: ['engine'], shield: ['shield'], core: ['core'] };
    for (const m of this.mods)
      if (kinds[f].includes(m.kind)) for (let i = 0; i < m.w; i++) pts.push(this.toSheet(m.x + i + 0.5, m.y + m.h / 2));
    if (f === 'hull' && this.view) {
      const rows = this.view.model.rows;
      const cols = this.view.model.cols;
      for (let x = 1; x < cols - 1; x += 2) pts.push(this.toSheet(x + 0.5, rows - 2.5));
    }
    if (!pts.length) pts.push(this.toSheet((this.view?.model.cols ?? 10) / 2, (this.view?.model.rows ?? 8) - 2));
    return pts;
  }

  private obra = new Container();
  private updateSparks() {
    const jobs = G.s.timers.filter((t) => t.kind === 'yard').map((t) => t.ref as FamilyId);
    const sig = jobs.join(',');
    if (sig === this.jobsSig) return;
    this.jobsSig = sig;
    for (const s of this.stops) s();
    if (this.obra.parent !== this.fx) this.fx.addChild(this.obra);
    clearChildren(this.obra);
    this.stops = jobs.map((f) => {
      const pts = this.familyPoints(f);
      // welding glow that flickers like an arc torch on each worked spot
      for (const p of pts.slice(0, 6)) {
        const g = new Sprite(glowTexture());
        g.anchor.set(0.5);
        g.tint = 0xffd8a0;
        g.blendMode = 'add';
        g.scale.set(0.35);
        g.position.set(p.x, p.y);
        this.obra.addChild(g);
        gsap.to(g, { alpha: 0.25, duration: 0.07 + Math.random() * 0.08, yoyo: true, repeat: -1, ease: 'steps(2)' });
      }
      // hand note: what is being built
      const p0 = pts[0];
      const note = handNote(`en obra: ${FAMILY_NAME[f].toLowerCase()} → mk ${roman(mk(f) + 1).toLowerCase()}`, 18, BP.yellow, -0.05);
      const nx = Math.max(30, Math.min(this.o.w - note.width - 30, p0.x - note.width / 2));
      const ny = Math.min(this.o.h - 120, p0.y + 46);
      note.position.set(nx, ny);
      this.obra.addChild(note, handArrow(nx + note.width / 2, ny - 2, p0.x, p0.y + 12, BP.yellow, 2, 3));
      return weldSparks(this.fx, pts, { rate: f === 'hull' ? 34 : 22 });
    });
  }

  /** Mk finished: flash the modules of that family + big spark bursts */
  celebrate(f: FamilyId) {
    const pts = this.familyPoints(f);
    const pick = pts.filter((_p, i) => i % Math.max(1, Math.floor(pts.length / 4)) === 0).slice(0, 5);
    pick.forEach((p, i) => gsap.delayedCall(i * 0.08, () => !this.destroyed && sparkBurst(this.fx, p.x, p.y, 18)));
    if (this.view) {
      gsap.fromTo(this.view, { alpha: 0.3 }, { alpha: 1, duration: 0.5, ease: 'power2.out' });
    }
  }

  /** scan-line wipe across the sheet (used after a hull Mk or ship switch) */
  wipe() {
    const { w, h } = this.o;
    const bar = new Graphics().rect(-6, 0, 12, h).fill({ color: 0xffffff, alpha: 0.9 }).rect(-40, 0, 34, h).fill({ color: BP.cyan, alpha: 0.25 });
    this.fx.addChild(bar);
    const mask = new Graphics().rect(0, 0, w, h).fill(0xffffff);
    this.art.mask = mask;
    this.addChild(mask);
    mask.scale.x = 0;
    sfx('whoosh');
    gsap.to(bar, { x: w, duration: 0.55, ease: 'power2.inOut', onComplete: () => bar.destroy() });
    gsap.to(mask.scale, {
      x: 1,
      duration: 0.55,
      ease: 'power2.inOut',
      onComplete: () => {
        if (!this.art.destroyed) this.art.mask = null;
        mask.destroy();
      },
    });
  }

  /** new ship: it rises from the waterline with a splash (T3 "el barco emerge del agua") */
  emerge() {
    if (!this.view) return;
    const v = this.view;
    const y0 = v.y;
    const { w, h } = this.o;
    const mask = new Graphics().rect(0, 0, w, this.sy + (v.model.rows * CELL - 60) * this.k).fill(0xffffff);
    this.addChild(mask);
    v.mask = mask;
    v.y = y0 + v.model.rows * CELL * this.k * 0.9;
    gsap.to(v, {
      y: y0,
      duration: 0.9,
      ease: 'back.out(1.4)',
      delay: 0.15,
      onComplete: () => {
        if (!v.destroyed) v.mask = null;
        mask.destroy();
      },
    });
    const wy = this.sy + (v.model.rows * CELL - 70) * this.k;
    gsap.delayedCall(0.25, () => {
      if (this.destroyed) return;
      sfx('splash');
      for (let i = 0; i < 4; i++) sparkBurst(this.fx, w / 2 + (i - 1.5) * 120, wy, 14, [0xffffff, BP.cyan, 0x9cc3f0]);
    });
    void h;
  }

  private tick(t: Ticker) {
    if (this.view && !this.view.destroyed) this.view.bob(Math.min(0.05, t.deltaMS / 1000));
  }
}

