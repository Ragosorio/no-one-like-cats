/** Misiones (EDITORIAL SUIZO + caption amarilla): 4 chains, current mission, progress, reward, pin (max 3). */
import '../island/safety';
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../ui/modal';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { icon, IconKind } from '../ui/icons';
import { G } from '../state/game';
import { BAL } from '../state/econ';
import { MISSIONS, MissionDef } from '../data/content';
import { evalGoal, pin } from '../state/sys/missions';
import { fmt } from '../core/format';
import { sfx } from '../core/audio';
import { CHAIN_META } from '../ui/hud/MissionPins';
import { bar, wrapText } from './island/ui';

const CHAINS: MissionDef['chain'][] = ['historia', 'capitan', 'criador', 'explorador'];

export function openMissions(..._args: unknown[]) {
  const m = new Modal('Misiones', 1720, 940, { subtitle: 'Sin diarias. Sin presión. Solo tu progreso.' });
  const content = new Container();
  m.body.addChild(content);
  const colW = (m.innerW - 3 * 22) / 4;
  const render = () => {
    content.removeChildren().forEach((c) => c.destroy({ children: true }));
    CHAINS.forEach((ch, i) => {
      const col = column(ch, colW, m.innerH - 6, render);
      col.position.set(i * (colW + 22), 0);
      content.addChild(col);
    });
  };
  render();
  m.open();
  return m;
}

function column(chain: MissionDef['chain'], w: number, h: number, rerender: () => void) {
  const meta = CHAIN_META[chain];
  const all = MISSIONS.filter((x) => x.chain === chain);
  const done = all.filter((x) => G.s.missions.done.includes(x.id));
  const active = all.filter((x) => G.s.missions.active.includes(x.id));
  const c = new Container();
  const bg = new Graphics().rect(8, 8, w, h).fill(C.ink).rect(0, 0, w, h).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
  bg.rect(0, 0, w, 74).fill(meta.color).stroke({ width: 4, color: C.ink, alignment: 1 });
  const t = txt(meta.name, { fontFamily: F.poster, fontSize: 40, fill: meta.text });
  t.position.set(16, 6);
  const n = txt(`${done.length}/${all.length}`, { fontFamily: F.heavy, fontSize: 22, fill: meta.text });
  n.anchor.set(1, 0);
  n.position.set(w - 14, 22);
  c.addChild(bg, t, n);
  // completion strip
  const strip = bar(w - 32, 10, done.length / Math.max(1, all.length), meta.color);
  strip.position.set(16, 88);
  c.addChild(strip);
  let y = 116;
  if (!active.length) {
    const msg = wrapText(done.length === all.length ? '¡Cadena completa! Leyenda.' : 'Sigue jugando: las misiones nuevas llegan con tu progreso (nunca con el calendario).', w - 32, 17, F.ui, C.ink, { fontStyle: 'italic' });
    msg.position.set(16, y);
    c.addChild(msg);
    y += msg.height + 20;
  }
  for (const mi of active.slice(0, 2)) {
    const card = missionCard(mi, w - 24, rerender);
    card.position.set(12, y);
    c.addChild(card);
    y += card.height + 16;
  }
  // history
  const room = Math.floor((h - y - 50) / 26);
  if (done.length && room > 0) {
    const nShow = Math.min(4, room, done.length);
    const hh = txt('HISTORIAL', { fontFamily: F.bebas, fontSize: 20, fill: C.ink, letterSpacing: 2 });
    hh.position.set(16, h - 20 - nShow * 26 - 30);
    c.addChild(hh);
    let hy = hh.y + 28;
    for (const d of done.slice(-nShow).reverse()) {
      const dt = txt(`✓ ${d.title}`, { fontFamily: F.ui, fontSize: 15, fill: C.ink });
      dt.alpha = 0.6;
      dt.position.set(16, hy);
      if (dt.width > w - 32) dt.scale.set((w - 32) / dt.width);
      const line = new Graphics().rect(16 + 18, hy + 10, Math.min(w - 52, dt.width - 18), 2).fill({ color: C.ink, alpha: 0.5 });
      c.addChild(dt, line);
      hy += 26;
    }
  }
  return c;
}

function missionCard(mi: MissionDef, w: number, rerender: () => void) {
  const meta = CHAIN_META[mi.chain];
  const card = new Container();
  const pinned = G.s.missions.pinned.includes(mi.id);
  const inner = new Container();
  const title = txt(mi.title, { fontFamily: F.poster, fontSize: 28, fill: C.ink, wordWrap: true, wordWrapWidth: w - 90 });
  title.position.set(16, 14);
  inner.addChild(title);
  let y = 14 + title.height + 6;
  const goal = wrapText(mi.goal.text, w - 32, 17);
  goal.position.set(16, y);
  inner.addChild(goal);
  y += goal.height + 12;
  const e = evalGoal(mi);
  const cur = Math.min(e.cur, e.need);
  const pb = bar(w - 120, 18, e.need ? cur / e.need : 0, meta.color);
  pb.position.set(16, y);
  const pt = txt(`${fmt(cur)} / ${fmt(e.need)}`, { fontFamily: F.heavy, fontSize: 18, fill: C.ink });
  pt.position.set(w - 96, y - 2);
  inner.addChild(pb, pt);
  y += 34;
  // reward
  const rl = txt('PREMIO', { fontFamily: F.bebas, fontSize: 18, fill: C.ink, letterSpacing: 2 });
  rl.position.set(16, y);
  inner.addChild(rl);
  y += 24;
  const items = rewardItems(mi);
  let rx = 16;
  for (const it of items) {
    const ic = icon(it.icon, 26, it.tint);
    ic.position.set(rx + 13, y + 13);
    const v = txt(it.text, { fontFamily: F.heavy, fontSize: 16, fill: C.ink });
    v.position.set(rx + 30, y + 3);
    if (rx + 34 + v.width > w - 10) {
      rx = 16;
      y += 32;
      ic.position.set(rx + 13, y + 13);
      v.position.set(rx + 30, y + 3);
    }
    inner.addChild(ic, v);
    rx += 40 + v.width + 8;
  }
  y += 40;
  if (mi.line) {
    const cap = new Graphics();
    const lt = wrapText(`«${mi.line}» — Luzterna`, w - 52, 15, F.ui, C.ink, { fontStyle: 'italic' });
    cap.rect(0, 0, w - 32, lt.height + 16).fill(C.yellow).stroke({ width: 2.5, color: C.ink });
    cap.position.set(16, y);
    lt.position.set(26, y + 8);
    inner.addChild(cap, lt);
    y += lt.height + 28;
  }
  const bg = new Graphics().rect(6, 6, w, y).fill(C.ink).rect(0, 0, w, y).fill(pinned ? 0xfff6dc : 0xf6efe2).stroke({ width: 3, color: C.ink, alignment: 1 });
  card.addChild(bg, inner);
  // pin toggle
  const pinB = new Container();
  const pg = new Graphics().rect(0, 0, 64, 40).fill(pinned ? C.yellow : C.paper).stroke({ width: 3, color: C.ink });
  // drawn push-pin (no emojis)
  const pp = new Graphics();
  const px = pinned ? 18 : 32;
  pp.moveTo(px, 22).lineTo(px - 6, 34).stroke({ width: 3, color: C.ink, cap: 'round' });
  pp.circle(px + 1, 15, 8).fill(pinned ? C.red : C.paperDark).stroke({ width: 2.5, color: C.ink });
  pp.circle(px - 2, 12, 2.4).fill({ color: 0xffffff, alpha: 0.8 });
  pinB.addChild(pg, pp);
  if (pinned) {
    const ptx = txt('SÍ', { fontFamily: F.bebas, fontSize: 22, fill: C.ink });
    ptx.anchor.set(0.5);
    ptx.position.set(44, 21);
    pinB.addChild(ptx);
  }
  pinB.position.set(w - 76, 12);
  pinB.eventMode = 'static';
  pinB.cursor = 'pointer';
  pinB.on('pointertap', () => {
    pin(mi.id);
    sfx('pop', pinned ? 0.9 : 1.3);
    gsap.fromTo(pinB.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
    rerender();
  });
  card.addChild(pinB);
  return card;
}

function rewardItems(mi: MissionDef): { icon: IconKind; text: string; tint?: number }[] {
  const r = mi.reward as Record<string, unknown> & { std: boolean };
  const out: { icon: IconKind; text: string; tint?: number }[] = [];
  let gold = Number(r.gold ?? 0);
  let food = Number(r.food ?? 0);
  if (r.std) {
    gold += Math.max(50, Math.round(G.goldPerSec * BAL.kingdom.mission_reward.gold_seconds_of_income));
    food += Math.max(20, Math.round(G.foodPerSec * BAL.kingdom.mission_reward.food_seconds_of_income));
  }
  if (gold) out.push({ icon: 'gold', text: `~${fmt(gold)}` });
  if (food) out.push({ icon: 'food', text: `~${fmt(food)}` });
  if (r.gems) out.push({ icon: 'gem', text: `${r.gems}` });
  if (r.std) out.push({ icon: 'clock', text: 'Ronroneo' });
  if (r.std || r.orbsOfFedCat) out.push({ icon: 'orb', text: `${r.orbsOfFedCat ?? BAL.kingdom.mission_reward.orbs} orbes` });
  if (r.boss) out.push({ icon: 'crown', text: 'Jefe' });
  return out;
}
