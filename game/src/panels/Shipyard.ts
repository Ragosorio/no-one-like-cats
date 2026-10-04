/**
 * Astillero (GDD 2.8 / 6.9 — plano técnico azul sobre editorial suizo):
 * fleet (buy / set active), blueprint of the active ship with callouts, Mk families (cost, green time,
 * why-not, upgrade + Ronronear on the running job), crew cabins, big Ship Power with "+X%" per upgrade.
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../ui/modal';
import { C, F } from '../ui/theme';
import { txt, Button, Bar } from '../ui/widgets';
import { icon } from '../ui/icons';
import { fmt, fmtDuration, fmtTime } from '../core/format';
import { sfx } from '../core/audio';
import { sparkles } from '../fx/juice';
import { G } from '../state/game';
import { BAL, FamilyId, modulePower } from '../state/econ';
import { SHIP_BY_ID } from '../data/content';
import {
  FAMILY_NAME,
  HULL_BY_MK,
  balanceShip,
  buyShip,
  canUpgrade,
  crew,
  crewSize,
  mk,
  mkUnlocked,
  playerBlueprint,
  roman,
  shipPower,
  shipUnlocked,
  upgrade,
  upgradeCost,
  yardBusy,
  yardQueues,
} from '../state/sys/ship';
import { cat as getCat } from '../state/sys/cats';
import { CELL } from '../battle/ship';
import { P, ensureCats, label, resChip, stamp, clearChildren } from './campaign/common';
import { shipPreview } from './campaign/shipArt';
import { CrewPicker } from './campaign/CrewPicker';

const ROWS: FamilyId[] = ['hull', 'weapon', 'engine', 'shield'];
const FAMILY_BLURB: Record<FamilyId, string> = {
  hull: 'Material y vida de cada celda del casco',
  weapon: 'Daño de los cañones en cada andanada',
  engine: 'Combustible de maniobra por turno',
  shield: 'Escudo Burbuja: anula 1 impacto por turno',
  core: 'Medidor de ultimate para la tripulación',
};
const MAT_ES: Record<string, string> = { wood: 'MADERA', iron: 'HIERRO', crystal: 'CORAL' };

let current: ShipyardPanel | null = null;

export function openShipyard(..._args: unknown[]) {
  if (current && !current.m.closed) return;
  current = new ShipyardPanel();
}

class ShipyardPanel {
  m: Modal;
  private fleet = new Container();
  private center = new Container();
  private right = new Container();
  private picker: CrewPicker;
  private sig = '';
  private acc = 0;
  private progress: { f: FamilyId; bar: Bar; t: Text; purr: Button }[] = [];
  private unsub: (() => void)[] = [];
  private previewKey = '';

  constructor() {
    this.m = new Modal('ASTILLERO', 1840, 1000, { color: 0xe9e4d8, subtitle: 'PLANO TÉCNICO · FAMILIAS MK · TRIPULACIÓN' });
    this.m.open();
    const b = this.m.body;
    this.picker = new CrewPicker(G.s.ship.active, { width: 840, slotH: 138, rosterSize: 58, rosterRows: 1, onChange: () => this.refreshPower() });
    this.picker.position.set(350, 604);
    b.addChild(this.fleet, this.center, this.right, this.picker);
    void ensureCats(G.s.cats.map((c) => c.species)).then(() => {
      if (this.m.closed) return;
      this.picker.rebuild();
    });
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
  }

  private buildAll() {
    this.buildFleet();
    this.buildCenter();
    this.buildRight();
  }

  // ------------------------------------------------------------------ fleet
  private buildFleet() {
    const f = this.fleet;
    clearChildren(f);
    const t = label('FLOTA', 14, P.blue, { letterSpacing: 3 });
    f.addChild(t);
    const ships = BAL.ship.ships;
    const cardH = 150;
    ships.forEach((bs, i) => {
      const def = SHIP_BY_ID.get(bs.id);
      const owned = G.s.ship.owned.includes(bs.id);
      const active = G.s.ship.active === bs.id;
      const unlocked = shipUnlocked(bs.id);
      const c = new Container();
      c.position.set(0, 24 + i * (cardH + 12));
      const fill = active ? C.ink : owned ? C.paper : unlocked ? 0xf3e7c8 : 0xcfc8b8;
      const fg = active ? C.paper : C.ink;
      const g = new Graphics().rect(5, 5, 330, cardH).fill(C.ink).rect(0, 0, 330, cardH).fill(fill).stroke({ width: 3, color: C.ink });
      c.addChild(g);
      const nm = txt((def?.name ?? bs.name).toUpperCase(), { fontFamily: F.poster, fontSize: 30, fill: fg });
      nm.position.set(14, 6);
      const st = label(`Tripulación ${bs.crew} · Poder ×${bs.mult.toFixed(2)}`, 14, active ? C.mint : P.blue);
      st.position.set(14, 46);
      const sl = bs.slots as Record<string, number>;
      const slots = label(`Armas ${sl.weapon} · Escudo ${sl.shield} · Motor ${sl.engine} · Núcleo ${sl.core}`, 13, fg);
      slots.position.set(14, 68);
      const perk = label(bs.perk === 'ninguno' ? 'Sin perk: puro corazón.' : bs.perk, 12, fg, { wordWrap: true, wordWrapWidth: 300, fontWeight: '400' });
      perk.position.set(14, 88);
      c.addChild(nm, st, slots, perk);
      if (active) {
        const a = stamp('ACTIVO', C.pink, 20, -0.08);
        a.position.set(270, 26);
        c.addChild(a);
      } else if (owned) {
        const btn = new Button('ACTIVAR', () => this.setActive(bs.id), { w: 130, h: 40, size: 22, color: C.mint });
        btn.position.set(186, cardH - 52);
        c.addChild(btn);
      } else if (unlocked) {
        const can = G.s.gold >= bs.cost;
        const btn = new Button(`COMPRAR ${fmt(bs.cost)}`, () => this.buy(bs.id), { w: 200, h: 42, size: 22, color: C.yellow, disabled: !can });
        btn.position.set(116, cardH - 54);
        const gi = icon('gold', 26);
        gi.position.set(96, cardH - 33);
        c.addChild(btn, gi);
      } else {
        const [k, v] = (bs.unlock ?? '').split(':');
        const why = k === 'kl' ? `REINO ${v}` : k === 'boss' ? `JEFE ${v}` : '???';
        const lk = icon('lock', 26);
        lk.position.set(220, cardH - 32);
        const lt = label(why, 18, C.ink);
        lt.position.set(240, cardH - 44);
        c.addChild(lk, lt);
        c.alpha = 0.75;
      }
      f.addChild(c);
    });
  }

  private setActive(id: string) {
    G.s.ship.active = id;
    G.recalc();
    sfx('pop');
    this.buildAll();
    this.picker.setShip(id);
  }

  private buy(id: string) {
    if (!buyShip(id)) {
      sfx('error');
      toast('Faltan Doblones', { color: C.pink });
      return;
    }
    G.s.ship.active = id;
    G.recalc();
    G.save();
    sfx('fanfare');
    this.buildAll();
    this.picker.setShip(id);
    const st = stamp(`¡${(SHIP_BY_ID.get(id)?.name ?? id).toUpperCase()} ES TUYO!`, C.pinkHot, 54, -0.08);
    st.position.set(350 + 420, 300);
    this.m.body.addChild(st);
    gsap.from(st.scale, { x: 2.6, y: 2.6, duration: 0.2, ease: 'power3.in' });
    gsap.to(st, { alpha: 0, delay: 1.8, duration: 0.4, onComplete: () => st.destroy({ children: true }) });
    sparkles(this.m.body, 770, 300, C.yellow, 24, 320);
    toast('¡Barco nuevo! Asígnale tripulación', { icon: 'paw', sub: `${crewSize(id)} camarotes esperando gatos` });
  }

  // ------------------------------------------------------------------ center: power + blueprint
  private buildCenter() {
    const c = this.center;
    const key = `${G.s.ship.active}|${mk('hull')}`;
    if (key === this.previewKey && c.children.length) {
      this.refreshPower();
      return;
    }
    this.previewKey = key;
    clearChildren(c);
    const x0 = 350;
    const bw = 840;
    const bh = 470;
    const by = 110;
    const shipId = G.s.ship.active;
    const def = SHIP_BY_ID.get(shipId);
    // blueprint sheet
    const sheet = new Container();
    sheet.position.set(x0, by);
    const bg = new Graphics().rect(6, 6, bw, bh).fill(C.ink).rect(0, 0, bw, bh).fill(P.bp);
    const grid = new Graphics();
    for (let x = 0; x <= bw; x += 20) grid.moveTo(x, 0).lineTo(x, bh);
    for (let y = 0; y <= bh; y += 20) grid.moveTo(0, y).lineTo(bw, y);
    grid.stroke({ width: 1, color: P.bpLine, alpha: 0.13 });
    const grid2 = new Graphics();
    for (let x = 0; x <= bw; x += 100) grid2.moveTo(x, 0).lineTo(x, bh);
    for (let y = 0; y <= bh; y += 100) grid2.moveTo(0, y).lineTo(bw, y);
    grid2.stroke({ width: 1.5, color: P.bpLine, alpha: 0.3 });
    const border = new Graphics().rect(10, 10, bw - 20, bh - 20).stroke({ width: 2, color: 0xffffff, alpha: 0.8 }).rect(0, 0, bw, bh).stroke({ width: 4, color: C.ink });
    sheet.addChild(bg, grid, grid2, border);
    // ship
    const { bp } = playerBlueprint(shipId);
    const pv = shipPreview(bp, { maxW: 560, maxH: 330, style: 'pirate' });
    const pw = (bp.cols * CELL + 60) * pv.k;
    pv.position.set((bw - pw) / 2 - 10, 50);
    sheet.addChild(pv);
    const toSheet = (gx: number, gy: number) => ({ x: pv.x + pv.ox + gx * CELL * pv.k, y: pv.y + pv.oy + gy * CELL * pv.k });
    // dimension lines
    const dim = new Graphics();
    const a = toSheet(0, bp.rows);
    const b = toSheet(bp.cols, bp.rows);
    const yy = a.y + 26;
    dim.moveTo(a.x, yy).lineTo(b.x, yy).moveTo(a.x, yy - 8).lineTo(a.x, yy + 8).moveTo(b.x, yy - 8).lineTo(b.x, yy + 8);
    dim.stroke({ width: 2, color: 0xffffff, alpha: 0.85 });
    const dl = txt(`${bp.cols} × ${bp.rows} CELDAS`, { fontFamily: F.bebas, fontSize: 20, fill: 0xffffff, letterSpacing: 2 });
    dl.anchor.set(0.5, 0);
    dl.position.set((a.x + b.x) / 2, yy + 4);
    sheet.addChild(dim, dl);
    // callouts
    const crewU = crew(shipId);
    const callouts: { x: number; y: number; text: string }[] = [];
    const hc = HULL_BY_MK[Math.max(0, Math.min(6, mk('hull') - 1))];
    let cannonN = 0;
    for (const m of bp.modules) {
      const p = toSheet(m.x + m.w / 2, m.y + m.h / 2);
      let text = '';
      if (m.kind === 'cannon') text = `CAÑÓN ${++cannonN} · ARMAS MK ${roman(mk('weapon'))}`;
      else if (m.kind === 'core') text = 'NÚCLEO (CORAZÓN)';
      else if (m.kind === 'catroom') {
        const u = crewU[m.slot ?? 0];
        const cc = u ? getCat(u) : undefined;
        text = `CAMAROTE ${(m.slot ?? 0) + 1} · ${cc ? cc.name.toUpperCase() : 'VACÍO'}`;
      } else if (m.kind === 'mast') text = 'MÁSTIL / COFA';
      else if (m.kind === 'engine') text = `MOTOR MK ${roman(mk('engine'))}`;
      else if (m.kind === 'powder') text = 'SANTABÁRBARA';
      else if (m.kind === 'shield') text = 'ESCUDO';
      else if (m.kind === 'arcane') text = 'SALA DE INVOCACIÓN';
      if (text) callouts.push({ x: p.x, y: p.y, text });
    }
    const cxMid = pv.x + pv.ox + (bp.cols * CELL * pv.k) / 2;
    const leftC = callouts.filter((q) => q.x < cxMid).sort((p1, p2) => p1.y - p2.y);
    const rightC = callouts.filter((q) => q.x >= cxMid).sort((p1, p2) => p1.y - p2.y);
    const lines = new Graphics();
    const place = (list: typeof callouts, side: -1 | 1) => {
      let lastY = -999;
      for (const q of list) {
        const ly = Math.max(lastY + 30, Math.min(bh - 40, q.y - 10));
        lastY = ly;
        const lx = side < 0 ? 24 : bw - 24;
        const t = txt(q.text, { fontFamily: F.bebas, fontSize: 19, fill: 0xffffff, letterSpacing: 1 });
        t.anchor.set(side < 0 ? 0 : 1, 0.5);
        t.position.set(lx, ly);
        const ex = side < 0 ? lx + t.width + 8 : lx - t.width - 8;
        lines.moveTo(ex, ly).lineTo(ex + side * 18, ly).lineTo(q.x, q.y);
        lines.circle(q.x, q.y, 4);
        sheet.addChild(t);
      }
    };
    place(leftC, -1);
    place(rightC, 1);
    lines.stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });
    sheet.addChild(lines);
    // title block
    const tb = new Container();
    const tbw = 330;
    const tbh = 76;
    tb.position.set(bw - tbw - 18, bh - tbh - 18);
    const tbg = new Graphics().rect(0, 0, tbw, tbh).fill({ color: P.bpDark, alpha: 0.9 }).stroke({ width: 2, color: 0xffffff }).moveTo(0, 30).lineTo(tbw, 30).stroke({ width: 1, color: 0xffffff });
    const tn = txt((def?.name ?? shipId).toUpperCase(), { fontFamily: F.poster, fontSize: 22, fill: 0xffffff });
    tn.position.set(10, 2);
    const ti = txt(`CASCO MK ${roman(mk('hull'))} · ${hc.name.toUpperCase()} · ${MAT_ES[hc.mat] ?? hc.mat} ${hc.cellHp}/CELDA`, { fontFamily: F.bebas, fontSize: 17, fill: 0xffffff, letterSpacing: 1 });
    ti.position.set(10, 34);
    const ts = txt(`PLANO Nº ${String(G.s.ship.owned.indexOf(shipId) + 1).padStart(3, '0')} · ESC. 1:40 · NO ONE LIKE CATS`, { fontFamily: F.bebas, fontSize: 14, fill: P.bpLine });
    ts.position.set(10, 54);
    tb.addChild(tbg, tn, ti, ts);
    sheet.addChild(tb);
    c.addChild(sheet);
    // power header
    const ph = new Container();
    ph.position.set(x0, 0);
    ph.label = 'power';
    c.addChild(ph);
    this.refreshPower();
  }

  private refreshPower() {
    const ph = this.center.children.find((x) => x.label === 'power') as Container | undefined;
    if (!ph) return;
    clearChildren(ph);
    const shipId = G.s.ship.active;
    const bs = balanceShip(shipId);
    const sp = shipPower();
    const l = label('PODER DE BARCO', 14, P.blue, { letterSpacing: 3 });
    const v = txt(fmt(sp), { fontFamily: F.poster, fontSize: 86, fill: C.ink });
    v.position.set(0, 10);
    const crewPow = sp / bs.mult - this.slotPower(shipId);
    const det = label(`= ×${bs.mult.toFixed(2)} · (módulos ${fmt(this.slotPower(shipId))} + tripulación ${fmt(Math.max(0, crewPow))})`, 16, C.ink);
    det.position.set(v.width + 22, 58);
    const q = label(`Astillero: ${yardBusy()}/${yardQueues()} obras · Tope Mk ${roman(Math.min(BAL.ship.mk.max, G.s.campaign.bossesDefeated + 2))}`, 16, P.blue);
    q.position.set(v.width + 22, 30);
    ph.addChild(l, v, det, q);
  }

  private slotPower(shipId: string) {
    const b = balanceShip(shipId);
    let s = 0;
    for (const f of ['hull', 'weapon', 'shield', 'engine', 'core'] as FamilyId[]) {
      const n = (b.slots as Record<string, number>)[f] ?? 0;
      if (n > 0 && mk(f) > 0) s += n * modulePower(f, mk(f));
    }
    return s;
  }

  /** "+X%" Ship Power a family upgrade would give on the active ship */
  private deltaPct(f: FamilyId) {
    const b = balanceShip(G.s.ship.active);
    const n = (b.slots as Record<string, number>)[f] ?? 0;
    if (!n) return 0;
    const d = b.mult * n * (modulePower(f, mk(f) + 1) - modulePower(f, mk(f)));
    return (d / Math.max(1e-9, shipPower())) * 100;
  }

  // ------------------------------------------------------------------ right: Mk families
  private buildRight() {
    const r = this.right;
    clearChildren(r);
    this.progress = [];
    const x0 = 1210;
    const w = 574;
    // resources
    const crystals = Object.values(G.s.crystals).reduce((a, b) => a + b, 0);
    const res = [resChip('gold', fmt(G.s.gold), true, 28), resChip('scrap', fmt(G.s.scrap), true, 28), resChip('blueprint', fmt(G.s.blueprint), true, 28), resChip('crystal', fmt(crystals), true, 28), resChip('clock', `${G.s.purr.toFixed(1)}m`, true, 28)];
    this.resTexts = res.map((c) => c.children[1] as Text);
    const slotW = [130, 90, 80, 80, 110];
    let rx = x0;
    res.forEach((c, i) => {
      c.position.set(rx, 0);
      r.addChild(c);
      rx += slotW[i] + 18;
    });
    ROWS.forEach((f, i) => {
      const row = new Container();
      row.position.set(x0, 48 + i * 204);
      r.addChild(row);
      this.buildFamilyRow(row, f, w);
    });
    this.sig = this.signature();
  }

  private buildFamilyRow(row: Container, f: FamilyId, w: number) {
    const h = 192;
    const unlocked = mkUnlocked(f);
    const cur = mk(f);
    const job = G.timerFor('yard', f);
    const bg = new Graphics().rect(5, 5, w, h).fill(C.ink).rect(0, 0, w, h).fill(unlocked ? C.paper : 0xd2ccbe).stroke({ width: 3, color: C.ink });
    row.addChild(bg);
    // Mk badge
    const badge = new Graphics().circle(w - 52, 52, 40).fill(job ? C.green : C.ink).stroke({ width: 3, color: C.ink });
    const bt = txt(cur > 0 ? roman(cur) : '—', { fontFamily: F.poster, fontSize: 40, fill: C.paper });
    bt.anchor.set(0.5);
    bt.position.set(w - 52, 50);
    const bm = label('MK', 12, C.paper);
    bm.anchor.set(0.5);
    bm.position.set(w - 52, 80);
    row.addChild(badge, bt, bm);
    const nm = txt(FAMILY_NAME[f].toUpperCase(), { fontFamily: F.poster, fontSize: 40, fill: C.ink });
    nm.position.set(16, 4);
    row.addChild(nm);
    const c = upgradeCost(f);
    let sub = FAMILY_BLURB[f];
    if (f === 'hull') {
      const a = HULL_BY_MK[Math.max(0, cur - 1)];
      const b = HULL_BY_MK[Math.min(6, cur)];
      sub = cur >= BAL.ship.mk.max ? a.name : `${a.name} → ${b.name} (${MAT_ES[b.mat] ?? b.mat} ${b.cellHp}/celda)`;
    }
    const sb = label(sub, 15, P.blue, { wordWrap: true, wordWrapWidth: w - 120 });
    sb.position.set(16, 52);
    row.addChild(sb);
    if (!unlocked) {
      const lk = icon('lock', 40);
      lk.position.set(40, 130);
      const why = label(canUpgrade(f).why, 20, C.ink);
      why.position.set(70, 118);
      row.addChild(lk, why);
      row.alpha = 0.8;
      return;
    }
    if (job) {
      const bar = new Bar(w - 32, 26, C.green, 0xcfe8d6);
      bar.position.set(16, 92);
      bar.set(1 - job.leftMs / job.totalMs, false);
      const t = label(`EN OBRA → MK ${roman(cur + 1)} · faltan ${fmtTime(job.leftMs)}`, 17, C.ink);
      t.position.set(16, 124);
      const purr = new Button(`RONRONEAR  ${G.s.purr.toFixed(1)} min`, () => {
        const used = G.spendPurrOn(job);
        if (used > 0) {
          sfx('purr');
          sparkles(row, w / 2, 110, C.mint, 12, 120);
        } else {
          sfx('error');
          toast('Tu reserva de Ronroneo está vacía', { color: C.pink, sub: 'Gana batallas para ronronear más' });
        }
      }, { w: 290, h: 44, size: 22, color: C.mint, disabled: G.s.purr <= 0.01 });
      purr.position.set(w - 306, 140);
      row.addChild(bar, t, purr);
      this.progress.push({ f, bar, t, purr });
      return;
    }
    if (cur >= BAL.ship.mk.max) {
      const mx = stamp('MK MÁXIMO', C.gold, 30, -0.05);
      mx.position.set(w / 2, 130);
      row.addChild(mx);
      return;
    }
    // cost chips
    const crystalsTotal = Object.values(G.s.crystals).reduce((a, b) => a + b, 0);
    const chips: Container[] = [resChip('gold', fmt(c.gold), G.s.gold >= c.gold, 26)];
    if (c.scrap) chips.push(resChip('scrap', fmt(c.scrap), G.s.scrap >= c.scrap, 26));
    if (c.blueprint) chips.push(resChip('blueprint', fmt(c.blueprint), G.s.blueprint >= c.blueprint, 26));
    if (c.crystals) chips.push(resChip('crystal', fmt(c.crystals), crystalsTotal >= c.crystals, 26));
    chips.push(resChip('clock', fmtDuration(c.timeMs), true, 26));
    let cx = 16;
    for (const ch of chips) {
      ch.position.set(cx, 92);
      row.addChild(ch);
      cx += ch.width + 16;
    }
    const pct = this.deltaPct(f);
    const pl = label(pct > 0 ? `+${pct < 10 ? pct.toFixed(1) : Math.round(pct)}% PODER` : `+0% en este barco (sirve a toda la flota)`, pct > 0 ? 22 : 15, pct > 0 ? 0x2e8a52 : P.blue);
    pl.position.set(16, pct > 0 ? 148 : 156);
    row.addChild(pl);
    const can = canUpgrade(f);
    const btn = new Button(`MEJORAR → MK ${roman(c.next)}`, () => this.doUpgrade(f, row), { w: 250, h: 52, size: 24, color: C.pink, disabled: !can.ok });
    btn.position.set(w - 266, 128);
    row.addChild(btn);
    if (!can.ok) {
      const why = label(`✖ ${can.why}`, 14, C.red);
      why.position.set(16, 124);
      row.addChild(why);
    }
  }

  private doUpgrade(f: FamilyId, row: Container) {
    if (!upgrade(f)) {
      sfx('error');
      return;
    }
    sfx('levelup');
    G.save();
    const st = stamp('¡EN OBRA!', C.green, 34, -0.1);
    st.position.set(row.x + 280, row.y + 100);
    this.right.addChild(st);
    gsap.from(st.scale, { x: 2.2, y: 2.2, duration: 0.16, ease: 'power3.in', onComplete: () => sfx('hit', 1.2) });
    gsap.to(st, { alpha: 0, delay: 1.0, duration: 0.3, onComplete: () => st.destroy({ children: true }) });
    this.buildRight();
    this.refreshPower();
  }

  private celebrateMk(f: FamilyId, n: number) {
    if (this.m.closed) return;
    sfx('fanfare');
    this.buildAll();
    const st = stamp(`¡${FAMILY_NAME[f].toUpperCase()} MK ${roman(n)}!`, C.pinkHot, 60, -0.08);
    st.position.set(350 + 420, 340);
    this.m.body.addChild(st);
    gsap.from(st.scale, { x: 2.8, y: 2.8, duration: 0.2, ease: 'power3.in' });
    gsap.to(st, { alpha: 0, delay: 1.6, duration: 0.4, onComplete: () => st.destroy({ children: true }) });
    sparkles(this.m.body, 770, 340, C.yellow, 26, 360);
    if (f === 'hull') toast(`Nuevo casco: ${HULL_BY_MK[Math.max(0, n - 1)].name}`, { icon: 'star' });
  }

  /** what the UI depends on (affordability, jobs, ownership) — NOT raw amounts, those update in place */
  private signature() {
    const jobs = G.s.timers.filter((t) => t.kind === 'yard').map((t) => t.ref).join(',');
    const fam = ROWS.map((f) => {
      const c = canUpgrade(f);
      return `${f}:${c.ok ? 1 : 0}:${c.why}`;
    }).join(',');
    const ships = BAL.ship.ships.map((b) => `${b.id}:${shipUnlocked(b.id) ? 1 : 0}:${G.s.gold >= b.cost ? 1 : 0}`).join(',');
    return `${fam}|${ships}|${jobs}|${G.s.purr > 0.01 ? 1 : 0}|${G.s.ship.owned.join(',')}|${G.s.ship.active}|${JSON.stringify(G.s.ship.mk)}`;
  }

  private resTexts: Text[] = [];
  private updateResTexts() {
    const t = this.resTexts;
    if (t.length < 5 || t[0].destroyed) return;
    const crystals = Object.values(G.s.crystals).reduce((a, b) => a + b, 0);
    t[0].text = fmt(G.s.gold);
    t[1].text = fmt(G.s.scrap);
    t[2].text = fmt(G.s.blueprint);
    t[3].text = fmt(crystals);
    t[4].text = `${G.s.purr.toFixed(1)}m`;
  }

  private tick(t: Ticker) {
    if (this.m.closed) return;
    for (const p of this.progress) {
      const job = G.timerFor('yard', p.f);
      if (!job) continue;
      p.bar.set(1 - job.leftMs / job.totalMs, false);
      p.t.text = `EN OBRA → MK ${roman(mk(p.f) + 1)} · faltan ${fmtTime(job.leftMs)}`;
    }
    this.acc += t.deltaMS;
    if (this.acc < 300) return;
    this.acc = 0;
    this.updateResTexts();
    for (const p of this.progress) if (!p.purr.destroyed) p.purr.setText(`RONRONEAR  ${G.s.purr.toFixed(1)} min`);
    const s = this.signature();
    if (s !== this.sig) {
      this.buildRight();
      this.buildFleet();
      this.buildCenter();
    }
  }
}

