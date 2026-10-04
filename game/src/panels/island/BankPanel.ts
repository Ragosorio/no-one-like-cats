/**
 * BANCO DEL REINO (KL15 · GDD 2.1 / 2.15 / 2.20). "Billete grabado": engraved-banknote dimension —
 * green/gold guilloche, serif numbers. Shows the automation honestly: every habitat deposits straight
 * into the wallet (no LLENO cap), offline window 2 h (+2 h with the Puerto de las Mareas).
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { Button, txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { G } from '../../state/game';
import { habitatTier } from '../../state/econ';
import { EXPANSIONS } from '../../data/content';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementIcon } from '../../ui/elementIcon';
import { elementFx } from '../../art/catArt';
import { fmt, fmtDuration } from '../../core/format';
import { sfx } from '../../core/audio';
import { bankKl, bankOfflineHours, bankState, bankUnlocked, expansionBonus, habitatRate } from '../../state/sys/island';
import { workers, workersUnlocked } from '../../state/sys/workforce';
import { chip, wrapText } from './ui';
import { islandHooks } from '../../island/hooks';

const NOTE = 0xdfe9d2; // banknote paper
const INKG = 0x1e4a3a; // engraving green
const GOLD = 0xc9a24a;

/** guilloche rosette (engraved banknote ornament) */
export function guilloche(r: number, color = INKG, alpha = 0.35) {
  const g = new Graphics();
  for (let k = 0; k < 18; k++) {
    const a0 = (k / 18) * Math.PI * 2;
    g.ellipse(Math.cos(a0) * r * 0.32, Math.sin(a0) * r * 0.32, r * 0.68, r * 0.3).stroke({ width: 1.2, color, alpha });
  }
  g.circle(0, 0, r).stroke({ width: 2, color, alpha: alpha + 0.2 });
  g.circle(0, 0, r * 0.94).stroke({ width: 1, color, alpha });
  return g;
}

/** the round vault door (also used in the island building) */
export function vaultDoor(r: number, open = 0) {
  const c = new Container();
  const g = new Graphics();
  g.circle(6, 6, r).fill(C.ink);
  g.circle(0, 0, r).fill(0x9aa3a8).stroke({ width: 5, color: C.ink });
  g.circle(0, 0, r * 0.82).fill(0xb9c2c7).stroke({ width: 3, color: C.ink });
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    g.circle(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, r * 0.04).fill(C.ink);
  }
  const wheel = new Graphics();
  wheel.circle(0, 0, r * 0.18).fill(GOLD).stroke({ width: 3, color: C.ink });
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI;
    wheel.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55).lineTo(-Math.cos(a) * r * 0.55, -Math.sin(a) * r * 0.55).stroke({ width: r * 0.07, color: C.ink, cap: 'round' });
    wheel.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55).lineTo(-Math.cos(a) * r * 0.55, -Math.sin(a) * r * 0.55).stroke({ width: r * 0.04, color: GOLD, cap: 'round' });
  }
  // paw on the hub
  wheel.ellipse(0, r * 0.03, r * 0.06, r * 0.05).fill(C.ink);
  wheel.label = 'wheel';
  c.addChild(g, wheel);
  void open;
  return c;
}

export function openBankPanel() {
  const m = new Modal('Banco del Reino', 1480, 860, { band: INKG, color: NOTE, subtitle: bankUnlocked() ? 'Depósito automático · sin tope "LLENO"' : `Abre en Reino ${bankKl()}` });
  const content = new Container();
  m.body.addChild(content);
  let live: (() => void) | null = null;
  const unlocked = bankUnlocked();
  // ---- banknote frame
  const frame = new Graphics();
  frame.rect(0, 0, m.innerW, m.innerH - 10).stroke({ width: 3, color: INKG });
  frame.rect(10, 10, m.innerW - 20, m.innerH - 30).stroke({ width: 1.5, color: INKG, alpha: 0.6 });
  for (let x = 24; x < m.innerW - 24; x += 18) frame.moveTo(x, 4).lineTo(x + 9, 4).stroke({ width: 2, color: GOLD });
  content.addChild(frame);
  // ---- left: vault + total
  const left = new Container();
  left.position.set(40, 30);
  content.addChild(left);
  const ros = guilloche(230);
  ros.position.set(250, 250);
  left.addChild(ros);
  const door = vaultDoor(170);
  door.position.set(250, 250);
  left.addChild(door);
  const wheel = door.children.find((c) => c.label === 'wheel')!;
  const tot = txt('TOTAL DEPOSITADO', { fontFamily: F.bebas, fontSize: 26, fill: INKG, letterSpacing: 4 });
  tot.anchor.set(0.5, 0);
  tot.position.set(250, 452);
  const totV = txt('0', { fontFamily: F.serif, fontWeight: '700', fontSize: 66, fill: C.ink });
  totV.anchor.set(0.5, 0);
  totV.position.set(250, 484);
  left.addChild(tot, totV);
  const ic = icon('gold', 54);
  left.addChild(ic);
  const motto = txt('"El banco no cobra comisión. Los gatos cobran en croquetas."', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, fill: INKG });
  motto.anchor.set(0.5, 0);
  motto.position.set(250, 574);
  left.addChild(motto);
  // ---- right: ledger
  const x0 = 560;
  const rw = m.innerW - x0 - 30;
  let y = 30;
  const head = (t: string) => {
    const h = txt(t.toUpperCase(), { fontFamily: F.bebas, fontSize: 28, fill: INKG, letterSpacing: 3 });
    h.position.set(x0, y);
    const line = new Graphics().rect(x0, y + 34, rw, 2).fill(INKG);
    content.addChild(h, line);
    y += 46;
  };
  if (!unlocked) {
    head('Cuando abra');
    const t = wrapText(
      `En Reino ${bankKl()} el oro de TODOS tus hábitats entra solo a la cartera: se acabó el "LLENO" y tocar monedas una por una. Mientras no juegas sigue depositando hasta ${bankOfflineHours()} h (+2 h con el Puerto de las Mareas). Te faltan ${bankKl() - G.s.kl} niveles de Reino.`,
      rw,
      21,
      F.ui,
      C.ink,
    );
    t.position.set(x0, y);
    content.addChild(t);
    y += t.height + 30;
    const st = new Container();
    const sb = new Graphics().rect(-180, -50, 360, 100).fill(C.red).stroke({ width: 5, color: C.ink });
    const stt = txt(`REINO ${bankKl()}`, { fontFamily: F.poster, fontSize: 64, fill: C.paper });
    stt.anchor.set(0.5);
    st.addChild(sb, stt);
    st.position.set(x0 + rw / 2, y + 70);
    st.rotation = -0.07;
    content.addChild(st);
    totV.text = '—';
    ic.visible = false;
  } else {
    head('Depósito automático');
    const rate = txt('', { fontFamily: F.serif, fontWeight: '700', fontSize: 46, fill: C.ink });
    rate.position.set(x0 + 56, y);
    const ri = icon('gold', 46);
    ri.position.set(x0 + 23, y + 30);
    content.addChild(ri, rate);
    const sub = txt('por segundo · todos los hábitats · ignora el tope "LLENO"', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: INKG });
    sub.position.set(x0, y + 58);
    content.addChild(sub);
    y += 96;
    head('Mientras no juegas');
    const port = expansionBonus('offline_bank_h') > 0;
    const off = wrapText(
      `Deposita hasta ${bankOfflineHours()} h${port ? ' (2 h + 2 h del Puerto de las Mareas)' : ` · +2 h con el Puerto de las Mareas (${EXPANSIONS[3].name})`}.` +
        (bankState().lastOfflineGold > 0 ? ` La última vez: +${fmt(bankState().lastOfflineGold)} en ${fmtDuration(Math.min(bankState().lastOfflineMs, bankOfflineHours() * 3600000))}.` : ''),
      rw,
      18,
    );
    off.position.set(x0, y);
    content.addChild(off);
    y += off.height + 18;
    head('Libro de cuentas');
    const rows = new Container();
    rows.position.set(x0, y);
    content.addChild(rows);
    const list = [...G.s.habitats].sort((a, b) => habitatRate(b) - habitatRate(a)).slice(0, 6);
    const total = Math.max(1e-9, list.reduce((a, h) => a + habitatRate(h), 0));
    list.forEach((h, i) => {
      const r = new Container();
      r.position.set(0, i * 40);
      const fx = elementFx(h.element);
      const ei = elementIcon(h.element, 22);
      ei.position.set(11, 11);
      const e = txt(`${cap(ELEMENT_NAME[h.element] ?? h.element)} · ${habitatTier(h.tier).name}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink });
      e.x = 28;
      r.addChild(ei, e);
      const bw = 220;
      const g = new Graphics().rect(rw - bw - 150, 6, bw, 14).fill({ color: INKG, alpha: 0.15 }).rect(rw - bw - 150, 6, (bw * habitatRate(h)) / total, 14).fill(fx.main).stroke({ width: 2, color: C.ink });
      r.addChild(g);
      const v = txt(`+${fmt(habitatRate(h))}/s`, { fontFamily: F.serif, fontWeight: '700', fontSize: 18, fill: C.ink });
      v.anchor.set(1, 0);
      v.position.set(rw, 0);
      r.addChild(v);
      const dots = new Graphics();
      for (let x = e.x + e.width + 10; x < rw - bw - 160; x += 8) dots.circle(x, 13, 1.2).fill({ color: INKG, alpha: 0.5 });
      r.addChild(dots);
      rows.addChild(r);
    });
    y += list.length * 40 + 12;
    const bankers = workers('banker');
    const bk = chip(workersUnlocked() ? `BANQUEROS: ${bankers.length} (+25% en su hábitat)` : 'BANQUEROS: Reino 24 (Oficios)', bankers.length ? GOLD : C.paperDark, C.ink, 18);
    bk.position.set(x0, y);
    content.addChild(bk);
    live = () => {
      if (rate.destroyed) return;
      rate.text = `+${fmt(G.goldPerSec)}/s`;
      totV.text = fmt(bankState().total);
      ic.position.set(250 - totV.width / 2 - 36, 522);
    };
    live();
    gsap.to(wheel, { rotation: Math.PI * 2, duration: 8, repeat: -1, ease: 'none' });
  }
  const b = new Button(unlocked ? 'VER EL BANCO' : 'CERRAR', () => {
    m.close();
    if (unlocked) islandHooks.focusBuilding?.('bank');
  }, { w: 300, h: 70, size: 32, color: unlocked ? GOLD : C.paperDark });
  b.position.set(m.innerW - 330, m.innerH - 100);
  content.addChild(b);
  let acc = 0;
  const tick = (tk: Ticker) => {
    acc += tk.deltaMS;
    if (acc < 200 || m.closed) return;
    acc = 0;
    live?.();
  };
  Ticker.shared.add(tick);
  m.onClose = () => {
    Ticker.shared.remove(tick);
    gsap.killTweensOf(wheel);
  };
  sfx('coin', 0.7);
  m.open();
  return m;
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
