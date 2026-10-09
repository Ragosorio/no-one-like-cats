/**
 * Astillero (GDD 2.8 / 6.9 — plano técnico azul sobre editorial suizo).
 *  - left: FLOTA (buy / switch the ship that sails; role + "recomendado para")
 *  - center: Poder de Barco + plano técnico (callouts, armas por ranura, Escudo Burbuja, punto débil,
 *    obra con chispas) + EDITAR PLANO / PROBAR + tripulación del barco
 *  - right: tabs MEJORAS (familias Mk I–VII con requisitos de jefe) · ARMAS (tipo por ranura) ·
 *    EQUIPO (reliquias de flota + artefactos por barco + escudos)
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../ui/modal';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { icon, IconKind } from '../ui/icons';
import { fmt } from '../core/format';
import { sfx } from '../core/audio';
import { sparkles, flash } from '../fx/juice';
import { G } from '../state/game';
import { BAL, FamilyId, mkCap } from '../state/econ';
import {
  FAMILY_NAME,
  HULL_BY_MK,
  balanceShip,
  buyShip,
  canUpgrade,
  crew,
  crewSize,
  layoutOf,
  layoutSig,
  mk,
  roman,
  setActiveShip,
  shipName,
  shipPower,
  combatWeight,
  shipUnlocked,
  slotPower,
  totalCrystals,
  upgrade,
  weaponsOf,
  yardBusy,
  yardQueues,
} from '../state/sys/ship';
import { equippedArtifacts, newGearCount, syncGear, gear } from '../state/sys/gear';
import { P, ensureCats, label, stamp, clearChildren } from './campaign/common';
import { CrewPicker } from './campaign/CrewPicker';
import { banner } from './shipyard/art';
import { buildFleet } from './shipyard/Fleet';
import { PlanView } from './shipyard/Plan';
import { MkTab, MK_ROWS } from './shipyard/MkTab';
import { WeaponsTab } from './shipyard/WeaponsTab';
import { GearTab } from './shipyard/GearTab';
import type { TrialReport } from './shipyard/trial';

type TabId = 'mk' | 'weapons' | 'gear';
export interface ShipyardOpts {
  tab?: TabId;
  /** cannon slot to preselect in ARMAS */
  slot?: number;
  /** highlight a ship in the fleet (e.g. an Encargo asks for it) */
  ship?: string;
  /** shown after a PROBAR battle */
  report?: TrialReport;
  /** a new layout was just saved: sweep the plan */
  wiped?: boolean;
}

const FLEET_W = 372;
const CX = 394;
const CW = 816;
const RX = 1230;
const RW = 554;
const PLAN_Y = 96;
const PLAN_H = 472;

let current: ShipyardPanel | null = null;

export function openShipyard(arg?: unknown) {
  const opts: ShipyardOpts = arg && typeof arg === 'object' ? (arg as ShipyardOpts) : {};
  if (current && !current.m.closed) {
    current.apply(opts);
    return;
  }
  current = new ShipyardPanel(opts);
}

class ShipyardPanel {
  m: Modal;
  private fleet = new Container();
  private power = new Container();
  private plan: PlanView;
  private picker: CrewPicker;
  private tabsBar = new Container();
  private tabBody = new Container();
  private fx = new Container();
  private tab: TabId = 'mk';
  private slot = 0;
  private mkTab: MkTab | null = null;
  private weaponsTab: WeaponsTab | null = null;
  private resTexts: Text[] = [];
  private sig = '';
  private acc = 0;
  private unsub: (() => void)[] = [];

  constructor(opts: ShipyardOpts) {
    syncGear();
    this.m = new Modal('ASTILLERO', 1840, 1000, { color: 0xe9e4d8, subtitle: 'PLANO TÉCNICO · FLOTA · MK · ARMAS · EQUIPO' });
    this.m.open();
    const b = this.m.body;
    this.fleet.position.set(0, 0);
    this.power.position.set(CX, 0);
    this.plan = new PlanView({
      w: CW,
      h: PLAN_H,
      onEdit: () => this.openEditor(),
      onTest: () => this.test(),
      onCannon: (slot) => this.showTab('weapons', slot),
    });
    this.plan.position.set(CX, PLAN_Y);
    this.picker = new CrewPicker(G.s.ship.active, { width: CW, slotH: 128, rosterSize: 56, rosterRows: 1, onChange: () => this.onCrew() });
    this.picker.position.set(CX, PLAN_Y + PLAN_H + 34);
    this.tabsBar.position.set(RX, 0);
    this.tabBody.position.set(RX, 64);
    b.addChild(this.fleet, this.power, this.plan, this.picker, this.tabsBar, this.tabBody, this.fx);
    this.buildResources();
    void ensureCats(G.s.cats.map((c) => c.species)).then(() => {
      if (this.m.closed) return;
      this.picker.rebuild();
    });
    this.tab = opts.tab ?? 'mk';
    this.slot = opts.slot ?? 0;
    this.buildAll();
    Ticker.shared.add(this.tick, this);
    this.unsub.push(
      G.on('timerDone', (t) => {
        if (t.kind !== 'yard') return;
        this.celebrateMk(t.ref as FamilyId, Number(t.data?.mk ?? mk(t.ref as FamilyId)));
      }),
    );
    this.m.onClose = () => {
      Ticker.shared.remove(this.tick, this);
      this.unsub.forEach((u) => u());
      current = null;
    };
    if (opts.report) gsap.delayedCall(0.35, () => this.showReport(opts.report!));
    if (opts.wiped) gsap.delayedCall(0.25, () => !this.m.closed && this.plan.wipe());
    if (opts.ship) gsap.delayedCall(0.3, () => this.focusShip(opts.ship!));
  }

  apply(opts: ShipyardOpts) {
    if (opts.tab) this.showTab(opts.tab, opts.slot);
    if (opts.ship) this.focusShip(opts.ship);
    if (opts.report) this.showReport(opts.report);
  }

  private buildAll() {
    this.buildFleet();
    this.plan.refresh();
    this.buildPower();
    this.buildTabs();
    this.sig = this.signature();
  }

  // ------------------------------------------------------------------ band: resources
  private buildResources() {
    const kinds: IconKind[] = ['gold', 'scrap', 'blueprint', 'crystal', 'clock'];
    const widths = [168, 150, 112, 118, 128];
    let x = 1748 - widths.reduce((a, b) => a + b, 0);
    kinds.forEach((k, i) => {
      const c = new Container();
      const ic = icon(k, 30);
      ic.position.set(15, 15);
      const t = txt('0', { fontFamily: F.heavy, fontSize: 22, fill: C.paper });
      t.position.set(36, 15 - t.height / 2);
      c.addChild(ic, t);
      this.resTexts.push(t);
      c.position.set(x, 28);
      x += widths[i];
      this.m.panel.addChild(c);
    });
    this.updateRes();
  }
  private updateRes() {
    const t = this.resTexts;
    if (t.length < 5 || t[0].destroyed) return;
    t[0].text = fmt(G.s.gold);
    t[1].text = fmt(G.s.scrap);
    t[2].text = fmt(G.s.blueprint);
    t[3].text = fmt(totalCrystals());
    t[4].text = `${G.s.purr.toFixed(1)}m`;
  }

  // ------------------------------------------------------------------ fleet
  private buildFleet() {
    buildFleet(this.fleet, {
      w: FLEET_W - 8,
      cardH: 156,
      onActivate: (id) => this.switchTo(id),
      onBuy: (id) => this.buy(id),
    });
  }

  private focusShip(id: string) {
    const idx = BAL.ship.ships.findIndex((s) => s.id === id);
    if (idx < 0 || this.m.closed) return;
    const y = 26 + idx * 166;
    const g = new Graphics().rect(-8, y - 8, FLEET_W + 8, 172).stroke({ width: 5, color: C.pinkHot });
    this.fx.addChild(g);
    gsap.fromTo(g, { alpha: 1 }, { alpha: 0.2, duration: 0.35, yoyo: true, repeat: 5, onComplete: () => g.destroy() });
    const note = txt(G.s.ship.owned.includes(id) ? '¡usa este!' : 'te lo piden', { fontFamily: F.brush, fontSize: 24, fill: C.pinkHot });
    note.rotation = -0.08;
    note.position.set(FLEET_W - 150, y - 30);
    this.fx.addChild(note);
    gsap.to(note, { alpha: 0, delay: 3, duration: 0.4, onComplete: () => note.destroy() });
  }

  private switchTo(id: string) {
    if (!setActiveShip(id)) return;
    G.save();
    sfx('whoosh');
    this.picker.setShip(id);
    this.buildAll();
    this.plan.wipe();
    const st = banner(`¡ZARPA EL ${shipName(id).toUpperCase()}!`, C.pinkHot, 38, -0.05);
    st.position.set(CX + CW / 2, PLAN_Y + 70);
    this.fx.addChild(st);
    gsap.from(st.scale, { x: 2.2, y: 2.2, duration: 0.18, ease: 'power3.in', onComplete: () => sfx('hit', 1.2) });
    gsap.to(st, { alpha: 0, delay: 1.1, duration: 0.3, onComplete: () => st.destroy({ children: true }) });
    toast(`Barco activo: ${shipName(id)}`, { icon: 'paw', sub: `${crew(id).length}/${crewSize(id)} gatos a bordo · este es el que pelea` });
  }

  private buy(id: string) {
    if (!buyShip(id)) {
      sfx('error');
      toast(shipUnlocked(id) ? 'Faltan Doblones' : 'Todavía no se puede comprar', { color: C.pink });
      return;
    }
    setActiveShip(id);
    G.save();
    sfx('fanfare');
    this.picker.setShip(id);
    this.buildAll();
    this.plan.emerge();
    // T3: the ship rises from the sea + stamp + ink burst
    flash(this.fx, 0xffffff, 0.35, 0.3);
    gsap.fromTo(this.m.panel, { x: this.m.panel.x - 8 }, { x: this.m.panel.x, duration: 0.5, ease: 'elastic.out(1,0.3)' });
    const st = banner(`¡${shipName(id).toUpperCase()} ES TUYO!`, C.pinkHot, 56, -0.06, 'Un barco para cada pleito: este ya zarpa con tripulación sugerida');
    st.position.set(CX + CW / 2, PLAN_Y + PLAN_H / 2 - 40);
    st.visible = false;
    this.fx.addChild(st);
    gsap.delayedCall(0.6, () => {
      if (st.destroyed) return;
      st.visible = true;
      gsap.from(st.scale, { x: 2.6, y: 2.6, duration: 0.22, ease: 'power3.in', onComplete: () => sfx('hit', 1) });
    });
    gsap.to(st, { alpha: 0, delay: 2.8, duration: 0.4, onComplete: () => st.destroy({ children: true }) });
    gsap.delayedCall(0.55, () => !this.m.closed && sparkles(this.fx, CX + CW / 2, PLAN_Y + PLAN_H / 2 - 40, C.yellow, 30, 380));
    toast('¡Barco nuevo! Ya zarpa con tripulación sugerida', { icon: 'paw', sub: `${crewSize(id)} camarotes · edita su plano y pruébalo` });
  }

  // ------------------------------------------------------------------ power header
  private buildPower() {
    const ph = this.power;
    clearChildren(ph);
    const shipId = G.s.ship.active;
    const bs = balanceShip(shipId);
    const sp = shipPower();
    const l = label('PODER DE BARCO', 13, P.blue, { letterSpacing: 3 });
    const v = txt(fmt(sp), { fontFamily: F.poster, fontSize: 80, fill: C.ink });
    v.position.set(0, 8);
    const crewPow = sp / bs.mult - slotPower(shipId);
    const x = v.width + 22;
    const cap = mkCap(G.s.campaign.bossesDefeated);
    const capNext = cap < BAL.ship.mk.max ? ` · Mk ${roman(cap + 1)} con el Jefe ${cap - 1}` : '';
    const q = label(`Obras ${yardBusy()}/${yardQueues()} · Tope Mk ${roman(cap)}${capNext}`, 15, P.blue);
    q.position.set(x, 24);
    const cw = combatWeight(shipId);
    const det = label(`= ×${bs.mult.toFixed(2)} · (módulos ${fmt(slotPower(shipId))} + tripulación ${fmt(Math.max(0, crewPow))})${cw !== 1 ? ` · en combate ×${cw}: su casco gigante ya pelea solo` : ''}`, 15, C.ink);
    det.position.set(x, 48);
    // never under the right column: wrap to the header's width (2 lines at most, then shrink)
    det.style.wordWrap = true;
    det.style.wordWrapWidth = CW - x;
    if (det.height > 40) det.scale.set(40 / det.height);
    ph.addChild(l, v, q, det);
    // ship name, right-aligned, as a poster word
    const nm = txt(shipName(shipId).toUpperCase(), { fontFamily: F.poster, fontSize: 34, fill: C.ink });
    nm.anchor.set(1, 0);
    nm.position.set(CW, 6);
    const hl = new Graphics().rect(CW - nm.width - 8, 30, nm.width + 12, 16).fill(C.yellow);
    hl.rotation = -0.01;
    ph.addChild(hl, nm);
    if (nm.x - nm.width < x + Math.max(q.width, det.width) + 12) {
      nm.visible = false;
      hl.visible = false;
    }
  }

  private onCrew() {
    this.buildPower();
    this.plan.refresh();
    this.buildFleet();
    if (this.tab === 'mk') this.mkTab?.build();
  }

  // ------------------------------------------------------------------ tabs
  private buildTabs() {
    clearChildren(this.tabsBar);
    const tabs: [TabId, string][] = [
      ['mk', 'MEJORAS'],
      ['weapons', 'ARMAS'],
      ['gear', 'EQUIPO'],
    ];
    const tw = (RW - 16) / 3;
    tabs.forEach(([id, name], i) => {
      const c = new Container();
      c.position.set(i * (tw + 8), 0);
      const on = id === this.tab;
      c.addChild(new Graphics().rect(5, 5, tw, 50).fill(C.ink).rect(0, on ? -4 : 0, tw, on ? 54 : 50).fill(on ? C.ink : C.paper).stroke({ width: 3, color: C.ink }));
      const t = txt(name, { fontFamily: F.poster, fontSize: 26, fill: on ? C.paper : C.ink });
      t.anchor.set(0.5);
      t.position.set(tw / 2, 24);
      c.addChild(t);
      const badge = id === 'gear' ? newGearCount() : id === 'mk' ? MK_ROWS.filter((f) => canUpgrade(f).ok).length : 0;
      if (badge > 0) {
        const bg = new Graphics().circle(tw - 12, 4, 13).fill(id === 'gear' ? C.pinkHot : C.green).stroke({ width: 2.5, color: C.ink });
        const bt = txt(String(badge), { fontFamily: F.poster, fontSize: 16, fill: C.paper });
        bt.anchor.set(0.5);
        bt.position.set(tw - 12, 4);
        c.addChild(bg, bt);
      }
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointertap', () => {
        if (this.tab === id) return;
        sfx('paper');
        this.showTab(id);
      });
      this.tabsBar.addChild(c);
    });
    this.buildTabBody();
  }

  private showTab(id: TabId, slot?: number) {
    this.tab = id;
    if (slot !== undefined) this.slot = slot;
    this.buildTabs();
    if (id === 'weapons' && slot !== undefined) this.plan.highlightCannon(slot);
  }

  private buildTabBody() {
    clearChildren(this.tabBody);
    this.mkTab = null;
    this.weaponsTab = null;
    if (this.tab === 'mk') {
      this.mkTab = new MkTab(RW, 150, (f, at) => this.doUpgrade(f, at));
      this.tabBody.addChild(this.mkTab);
    } else if (this.tab === 'weapons') {
      this.weaponsTab = new WeaponsTab({
        w: RW,
        h: 800,
        slot: this.slot,
        onHover: (s) => this.plan.highlightCannon(s),
        onChange: () => {
          this.plan.refresh();
          this.slot = this.weaponsTab?.slot ?? this.slot;
        },
      });
      this.tabBody.addChild(this.weaponsTab);
    } else {
      this.tabBody.addChild(
        new GearTab(RW, () => {
          this.plan.refresh();
          this.buildPower();
          this.buildFleet();
        }),
      );
    }
    for (const ch of this.tabBody.children) gsap.from(ch, { alpha: 0, x: 14, duration: 0.18, ease: 'power2.out' });
  }

  // ------------------------------------------------------------------ actions
  private doUpgrade(f: FamilyId, at: { x: number; y: number }) {
    if (!upgrade(f)) {
      sfx('error');
      return;
    }
    sfx('levelup');
    G.save();
    const p = this.m.body.toLocal(at);
    const st = stamp('¡EN OBRA!', C.green, 34, -0.1);
    st.position.set(p.x - 60, p.y);
    this.fx.addChild(st);
    gsap.from(st.scale, { x: 2.2, y: 2.2, duration: 0.16, ease: 'power3.in', onComplete: () => sfx('hit', 1.2) });
    gsap.to(st, { alpha: 0, delay: 1.0, duration: 0.3, onComplete: () => st.destroy({ children: true }) });
    this.buildTabs();
    this.buildPower();
    this.plan.refresh();
  }

  private celebrateMk(f: FamilyId, n: number) {
    if (this.m.closed) return;
    G.save();
    sfx('fanfare');
    this.buildAll();
    if (f === 'hull') {
      this.plan.refresh(true);
      this.plan.wipe();
    }
    this.plan.celebrate(f);
    const cx = CX + CW / 2;
    const cy = PLAN_Y + PLAN_H / 2 - 30;
    const sub = f === 'hull' ? `Nuevo casco: ${HULL_BY_MK[Math.max(0, n - 1)].name} (todos tus barcos)` : f === 'weapon' ? 'Todas tus andanadas pegan más fuerte' : f === 'shield' ? 'Escudo Burbuja en línea: anula 1 impacto por turno' : f === 'engine' ? 'Más combustible para maniobrar' : 'Más ultimate para toda la tripulación';
    const st = banner(`¡${FAMILY_NAME[f].toUpperCase()} MK ${roman(n)}!`, C.pinkHot, 60, -0.06, sub);
    st.position.set(cx, cy);
    this.fx.addChild(st);
    gsap.from(st.scale, { x: 2.8, y: 2.8, duration: 0.2, ease: 'power3.in', onComplete: () => sfx('hit', 1) });
    gsap.to(st, { alpha: 0, delay: 2.0, duration: 0.4, onComplete: () => st.destroy({ children: true }) });
    sparkles(this.fx, cx, cy, C.yellow, 28, 380);
  }

  /** the editor is its own full-screen modal: the Astillero steps aside (one Esc = one modal) and comes back after */
  private async openEditor() {
    const { openLayoutEditor } = await import('./shipyard/LayoutEditor');
    const shipId = G.s.ship.active;
    const tab = this.tab;
    this.m.close();
    openLayoutEditor(shipId, (r) => {
      if (r.test) {
        void import('./shipyard/trial').then((t) => t.startTrial());
        return;
      }
      openShipyard({ tab, wiped: r.saved });
    });
  }

  private async test() {
    if (!crew().length) {
      toast('Asigna al menos un gato antes de probar', { color: C.pink, icon: 'paw' });
      sfx('error');
      return;
    }
    const { startTrial } = await import('./shipyard/trial');
    this.m.close();
    void startTrial();
  }

  private showReport(r: TrialReport) {
    if (this.m.closed) return;
    const c = new Container();
    const w = 470;
    const h = 210;
    c.position.set(CX + CW / 2 - w / 2, PLAN_Y + 120);
    c.addChild(new Graphics().rect(8, 8, w, h).fill(C.ink).rect(0, 0, w, h).fill(C.paper).stroke({ width: 4, color: C.ink }));
    const t = txt('REPORTE DE PRUEBA', { fontFamily: F.poster, fontSize: 36, fill: C.ink });
    t.position.set(20, 8);
    const lines = [`Barco: ${shipName(r.ship)}`, `Turnos: ${r.turns}`, `Daño total: ${fmt(r.damage)}`, `Módulos rotos al Costal: ${r.modules}`];
    lines.forEach((s, i) => {
      const l = label(s, 18, C.ink);
      l.position.set(22, 60 + i * 28);
      c.addChild(l);
    });
    const st = stamp(r.won ? '¡HUNDIDO!' : 'EL COSTAL AGUANTÓ', r.won ? C.red : C.inkBlue, 26, -0.12);
    st.position.set(w - 110, h - 46);
    const hint = label('clic para cerrar · sin botín ni Ronroneo', 12, P.blue);
    hint.position.set(22, h - 24);
    c.addChild(t, st, hint);
    this.fx.addChild(c);
    sfx('paper');
    gsap.from(c, { y: c.y + 40, alpha: 0, duration: 0.3, ease: 'back.out(1.6)' });
    c.eventMode = 'static';
    c.cursor = 'pointer';
    const close = () => {
      if (c.destroyed) return;
      gsap.to(c, { alpha: 0, y: c.y - 20, duration: 0.2, onComplete: () => c.destroy({ children: true }) });
    };
    c.on('pointertap', close);
    gsap.delayedCall(7, close);
  }

  // ------------------------------------------------------------------ live refresh
  /** what the UI depends on (affordability, jobs, ownership, gear, layout) — NOT raw amounts */
  private signature() {
    const jobs = G.s.timers.filter((t) => t.kind === 'yard').map((t) => t.ref).join(',');
    const fam = MK_ROWS.map((f) => `${f}:${canUpgrade(f).ok ? 1 : 0}:${canUpgrade(f).why}`).join(',');
    const ships = BAL.ship.ships.map((b) => `${b.id}:${shipUnlocked(b.id) ? 1 : 0}:${G.s.gold >= b.cost ? 1 : 0}`).join(',');
    const g = gear();
    return [
      fam,
      ships,
      jobs,
      G.s.purr > 0.01 ? 1 : 0,
      G.s.ship.owned.join(','),
      G.s.ship.active,
      JSON.stringify(G.s.ship.mk),
      weaponsOf().join(','),
      g.relics.length,
      g.artifacts.length,
      equippedArtifacts(G.s.ship.active).join(','),
      layoutSig(layoutOf()),
      G.s.campaign.bossesDefeated,
    ].join('|');
  }

  private tick(t: Ticker) {
    if (this.m.closed) return;
    this.mkTab?.tick(t.deltaMS);
    this.acc += t.deltaMS;
    if (this.acc < 300) return;
    this.acc = 0;
    this.updateRes();
    this.mkTab?.slowTick();
    const s = this.signature();
    if (s !== this.sig) {
      this.sig = s;
      this.buildFleet();
      this.buildPower();
      this.buildTabs();
      this.plan.refresh();
    }
  }
}
