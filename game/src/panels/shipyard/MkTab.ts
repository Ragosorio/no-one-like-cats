/**
 * MEJORAS tab: the 5 Mk families (global for the whole fleet). Each row shows the Mk ladder I–VII
 * with the boss each step needs, cost (Doblones + chatarra + planos + cristales + obra verde),
 * the "+X% PODER" it gives on this ship, and the live obra (striped bar + RONRONEAR).
 */
import { Container, Graphics, Text } from 'pixi.js';
import { C, F } from '../../ui/theme';
import { txt, Button } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { fmt, fmtDuration, fmtTime } from '../../core/format';
import { sfx } from '../../core/audio';
import { toast } from '../../ui/modal';
import { sparkles } from '../../fx/juice';
import { G } from '../../state/game';
import { BAL, FamilyId, mkCap, modulePower } from '../../state/econ';
import { FAMILY_NAME, HULL_BY_MK, balanceShip, bossForMk, canUpgrade, mk, mkUnlocked, roman, shipPower, totalCrystals, upgradeCost } from '../../state/sys/ship';
import { P, label, resChip, stamp } from '../campaign/common';

export const MK_ROWS: FamilyId[] = ['hull', 'weapon', 'engine', 'shield', 'core'];
const MAT_ES: Record<string, string> = { wood: 'MADERA', iron: 'HIERRO', crystal: 'CORAL' };

function sigma(m: number) {
  return Math.max(0.8, 5 - 0.6 * m);
}
function coreMeter(m: number) {
  return m <= 0 ? 0 : m <= 3 ? 5 : m <= 5 ? 10 : 15;
}
function blurb(f: FamilyId): string {
  const cur = mk(f);
  const max = cur >= BAL.ship.mk.max;
  switch (f) {
    case 'hull': {
      const a = HULL_BY_MK[Math.max(0, cur - 1)];
      const b = HULL_BY_MK[Math.min(6, cur)];
      return max ? `${a.name} · ${MAT_ES[a.mat]} ${a.cellHp}/celda` : `${a.name} → ${b.name} (${MAT_ES[b.mat] ?? b.mat} ${b.cellHp}/celda)`;
    }
    case 'weapon':
      return max ? `Andanada al máximo · dispersión ±${sigma(cur).toFixed(1)}°` : `Daño de la andanada · dispersión ±${sigma(cur).toFixed(1)}° → ±${sigma(cur + 1).toFixed(1)}°`;
    case 'engine': {
      const fuel = (m: number) => 2 + Math.floor(m / 2);
      return max ? `Maniobra ${fuel(cur)} celdas por turno` : `Maniobra ${fuel(cur)} → ${fuel(cur + 1)} celdas por turno (A/D)`;
    }
    case 'shield':
      return 'Escudo Burbuja: anula 1 impacto completo por turno (Bastión, Bajel)';
    case 'core':
      return max ? `Núcleo Arcano: +${coreMeter(cur)} de ultimate por turno` : `Núcleo Arcano: +${coreMeter(cur)} → +${coreMeter(cur + 1)} de ultimate por turno`;
  }
}

/** "+X%" Ship Power a family upgrade would give on the active ship */
export function deltaPct(f: FamilyId) {
  const b = balanceShip(G.s.ship.active);
  const n = (b.slots as Record<string, number>)[f] ?? 0;
  if (!n) return 0;
  const d = b.mult * n * (modulePower(f, mk(f) + 1) - modulePower(f, mk(f)));
  return (d / Math.max(1e-9, shipPower())) * 100;
}

interface Live {
  f: FamilyId;
  bar: Graphics;
  stripes: Graphics;
  barW: number;
  t: Text;
  purr: Button;
}

export class MkTab extends Container {
  private live: Live[] = [];
  private phase = 0;
  constructor(
    private w: number,
    private rowH: number,
    private onUpgrade: (f: FamilyId, at: { x: number; y: number }) => void,
  ) {
    super();
    this.build();
  }

  build() {
    for (const ch of this.removeChildren()) ch.destroy({ children: true });
    this.live = [];
    MK_ROWS.forEach((f, i) => {
      const row = new Container();
      row.position.set(0, i * (this.rowH + 10));
      this.addChild(row);
      this.buildRow(row, f);
    });
  }

  private buildRow(row: Container, f: FamilyId) {
    const w = this.w;
    const h = this.rowH;
    const unlocked = mkUnlocked(f);
    const cur = mk(f);
    const job = G.timerFor('yard', f);
    const cap = mkCap(G.s.campaign.bossesDefeated);
    row.addChild(new Graphics().rect(5, 5, w, h).fill(C.ink).rect(0, 0, w, h).fill(unlocked ? C.paper : 0xd2ccbe).stroke({ width: 3, color: C.ink }));
    if (job) row.addChild(new Graphics().rect(0, 0, 8, h).fill(C.green));
    // Mk badge
    const bx = w - 50;
    row.addChild(new Graphics().circle(bx + 3, 50, 36).fill(C.ink).circle(bx, 47, 36).fill(job ? C.green : cur > 0 ? C.ink : 0x8a8478).stroke({ width: 3, color: C.ink }));
    const bt = txt(cur > 0 ? roman(cur) : '—', { fontFamily: F.poster, fontSize: 38, fill: C.paper });
    bt.anchor.set(0.5);
    bt.position.set(bx, 43);
    const bm = label('MK', 11, C.paper, { letterSpacing: 2 });
    bm.anchor.set(0.5);
    bm.position.set(bx, 71);
    row.addChild(bt, bm);
    const nm = txt(FAMILY_NAME[f].toUpperCase(), { fontFamily: F.poster, fontSize: 32, fill: C.ink });
    nm.position.set(16, 2);
    row.addChild(nm);
    const sb = label(blurb(f), 13, P.blue, { wordWrap: true, wordWrapWidth: w - 120, lineHeight: 15 });
    sb.position.set(16, 44);
    row.addChild(sb);
    // ladder I..VII
    const ly = 66;
    for (let n = 1; n <= BAL.ship.mk.max; n++) {
      const x = 16 + (n - 1) * 36;
      const done = n <= cur;
      const next = n === cur + 1;
      const allowed = n <= cap;
      const g = new Graphics().roundRect(x, ly, 32, 20, 3);
      if (done) g.fill(C.ink);
      else if (next && job) g.fill(C.green);
      else if (allowed) g.fill(C.paper).stroke({ width: 2, color: C.ink });
      else g.fill(0xbdb6a8).stroke({ width: 2, color: 0x8a8478 });
      if (next && !job && allowed && unlocked) g.stroke({ width: 3, color: C.pinkHot });
      const t = txt(roman(n), { fontFamily: F.bebas, fontSize: 16, fill: done ? C.paper : allowed ? C.ink : 0x6f6a5e });
      t.anchor.set(0.5);
      t.position.set(x + 16, ly + 10);
      row.addChild(g, t);
      if (!allowed) {
        const j = txt(`J${bossForMk(n)}`, { fontFamily: F.bebas, fontSize: 11, fill: C.red });
        j.anchor.set(0.5, 0);
        j.position.set(x + 16, ly + 21);
        row.addChild(j);
      }
    }
    if (!unlocked) {
      const lk = icon('lock', 34);
      lk.position.set(36, 118);
      const why = txt('SE DESBLOQUEA CON EL JEFE 3', { fontFamily: F.poster, fontSize: 24, fill: C.ink });
      why.position.set(62, 103);
      row.addChild(lk, why);
      row.alpha = 0.85;
      return;
    }
    if (job) {
      const bw = w - 250;
      const back = new Graphics().rect(16, 100, bw, 22).fill(0xcfe8d6).stroke({ width: 3, color: C.ink });
      const bar = new Graphics().rect(16, 100, bw, 22).fill(C.green);
      const stripes = new Graphics();
      for (let x = -40; x < bw + 40; x += 16) stripes.poly([16 + x, 122, 24 + x, 122, 34 + x, 100, 26 + x, 100]);
      stripes.fill({ color: 0xffffff, alpha: 0.28 });
      const m = new Graphics().rect(16, 100, bw, 22).fill(0xffffff);
      stripes.mask = m;
      const frac = 1 - job.leftMs / job.totalMs;
      bar.scale.x = Math.max(0.001, frac);
      bar.pivot.x = 0;
      bar.x = 16 - 16 * bar.scale.x;
      const t = label(`EN OBRA → MK ${roman(cur + 1)} · faltan ${fmtTime(job.leftMs)}`, 15, C.ink);
      t.position.set(16, 126);
      const purr = new Button(`RONRONEAR ${G.s.purr.toFixed(1)}m`, () => {
        const j = G.timerFor('yard', f);
        if (!j) return;
        const used = G.spendPurrOn(j);
        if (used > 0) {
          sfx('purr');
          sparkles(row, w - 120, 120, C.mint, 12, 100);
        } else {
          sfx('error');
          toast('Tu reserva de Ronroneo está vacía', { color: C.pink, sub: 'Gana batallas para ronronear más' });
        }
      }, { w: 210, h: 44, size: 20, color: C.mint, disabled: G.s.purr <= 0.01 });
      purr.position.set(w - 222, 96);
      row.addChild(back, bar, stripes, m, t, purr);
      this.live.push({ f, bar, stripes, barW: bw, t, purr });
      return;
    }
    if (cur >= BAL.ship.mk.max) {
      const mx = stamp('MK MÁXIMO', C.gold, 28, -0.05);
      mx.position.set(w / 2 - 40, 118);
      row.addChild(mx);
      return;
    }
    const c = upgradeCost(f);
    const can = canUpgrade(f);
    const capped = c.next > cap;
    if (capped) {
      const st = stamp(`MK ${roman(c.next)} REQUIERE VENCER AL JEFE ${bossForMk(c.next)}`, C.red, 19, -0.03);
      st.position.set(16 + st.width / 2, 120);
      row.addChild(st);
      return;
    }
    const many = [c.scrap, c.blueprint, c.crystals].filter(Boolean).length >= 3;
    const cs = many ? 18 : 22;
    const chips: Container[] = [resChip('gold', fmt(c.gold), G.s.gold >= c.gold, cs)];
    if (c.scrap) chips.push(resChip('scrap', fmt(c.scrap), G.s.scrap >= c.scrap, cs));
    if (c.blueprint) chips.push(resChip('blueprint', fmt(c.blueprint), G.s.blueprint >= c.blueprint, cs));
    if (c.crystals) chips.push(resChip('crystal', fmt(c.crystals), totalCrystals() >= c.crystals, cs));
    chips.push(resChip('clock', fmtDuration(c.timeMs), true, cs));
    let cx = 16;
    for (const ch of chips) {
      ch.position.set(cx, many ? 106 : 103);
      row.addChild(ch);
      cx += ch.width + (many ? 8 : 12);
    }
    const pct = deltaPct(f);
    if (!can.ok) {
      const why = label(can.why.toUpperCase(), 13, C.red);
      why.position.set(16, 130);
      row.addChild(why);
    } else {
      const pl = label(pct > 0 ? `+${pct < 10 ? pct.toFixed(1) : Math.round(pct)}% PODER EN ESTE BARCO` : '+0% aquí · sirve a toda la flota', pct > 0 ? 15 : 13, pct > 0 ? 0x2e8a52 : P.blue);
      pl.position.set(16, 130);
      row.addChild(pl);
    }
    const btn = new Button(`MEJORAR → MK ${roman(c.next)}`, () => {
      const gp = row.getGlobalPosition();
      this.onUpgrade(f, { x: gp.x + w - 120, y: gp.y + 70 });
    }, { w: 198, h: 46, size: 21, color: C.pink, disabled: !can.ok });
    btn.position.set(w - 210, 98);
    row.addChild(btn);
  }

  /** live update of running jobs (bars, timers, purr label) */
  tick(dtMs: number) {
    this.phase = (this.phase + dtMs * 0.04) % 16;
    for (const l of this.live) {
      if (l.bar.destroyed) continue;
      const job = G.timerFor('yard', l.f);
      if (!job) continue;
      const frac = Math.max(0.001, 1 - job.leftMs / job.totalMs);
      l.bar.scale.x = frac;
      l.bar.x = 16 - 16 * frac;
      l.stripes.x = this.phase;
      l.t.text = `EN OBRA → MK ${roman(mk(l.f) + 1)} · faltan ${fmtTime(job.leftMs)}`;
    }
  }
  slowTick() {
    for (const l of this.live) if (!l.purr.destroyed) l.purr.setText(`RONRONEAR ${G.s.purr.toFixed(1)}m`);
  }
}
