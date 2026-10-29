/** Muelle de Pesca (COZY + NOIR OCEÁNICO): plots, crop selector, harvest, upgrade, repeat recipe. */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { Button, txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { G, FarmPlot } from '../../state/game';
import { BAL, crop, cropTimeMs, farmUpgradeCost, farmUpgradeTimeMs, farmYield } from '../../state/econ';
import { canUpgradeFarm, cropsAvailable, farm, foodBonus, harvest, plant, regionsUnlocked, upgradeFarm, autoHarvestKl, autoHarvestOn } from '../../state/sys/island';
import { checkMissions } from '../../state/sys/missions';
import { featureKl, featureUnlocked } from '../../state/ext/island';
import { EXPANSIONS } from '../../data/content';
import { fmt, fmtDuration, fmtTime } from '../../core/format';
import { sfx } from '../../core/audio';
import { onomatopoeia, floatText } from '../../fx/juice';
import { penArt } from '../../island/buildingArt';
import { bar, costTag, heading, wrapText } from './ui';
import { ScrollBox } from '../collection/ui';
import { game } from '../../core/App';

function regionName(id: string) {
  return id === 'home' ? 'Isla' : (EXPANSIONS.find((e) => e.id === id)?.name ?? id);
}

/** a dock card at scale 1 (its art and text are laid out in this box; the grid scales it) */
const CARD_W = 330;
const CARD_H = 506;
/** gap between cards; the card's ink shadow (8) lives inside it */
const GAP = 22;

/**
 * The dock grid: how many columns and how big. The cards fill the panel's width; the scale aims at text that reads on
 * this screen (`eff` = real pixels per panel unit: small windows get bigger cards, big ones get more columns) and one
 * whole row always fits in `availH` (the rest scrolls). Few docks don't grow past 1.5×.
 */
export function dockGrid(n: number, availW: number, availH: number, eff: number) {
  const fit = (s: number) => Math.max(1, Math.min(Math.max(1, n), Math.floor((availW + GAP) / (CARD_W * s + GAP))));
  const target = Math.max(0.8, Math.min(1.5, 0.8 / Math.max(0.05, eff)));
  let cols = Math.max(1, Math.min(Math.max(1, n), Math.round((availW + GAP) / (CARD_W * target + GAP))));
  let s = Math.min(1.5, (availW - (cols - 1) * GAP) / (cols * CARD_W), (availH - 16) / (CARD_H + 8));
  s = Math.max(0.35, s);
  // the height capped the scale (short screens): more columns fit at that size
  cols = fit(s);
  return { cols, s, rows: Math.ceil(Math.max(1, n) / cols) };
}

export function openDock(focusId?: string) {
  const farms = G.s.farms.filter((f) => regionsUnlocked().includes(f.region));
  // the panel takes the real screen (game.view), not the 1920×1080 box; on phones it's laid out smaller so
  // Modal.fitToView can blow it up to its usual ≥ 0.5 real px per unit
  const v = game.view;
  const kp = Math.max(1, 0.5 / Math.max(0.01, game.scale));
  const maxW = Math.min(2400, Math.floor(v.w / kp - 60));
  const maxH = Math.floor(v.h / kp - 50);
  const stripsH = (G.s.momentum > 1.005 ? 60 : 0) + 64;
  const gutter = 16; // the scrollbar's lane
  const grid = dockGrid(farms.length, maxW - 56 - gutter, maxH - 130 - stripsH, game.scale * kp);
  const gridW = grid.cols * CARD_W * grid.s + (grid.cols - 1) * GAP;
  const gridH = grid.rows * (CARD_H * grid.s + GAP) + 8;
  const w = Math.max(1200, Math.min(maxW, Math.ceil(gridW + 56 + gutter + 8)));
  const h = Math.max(Math.min(640, maxH), Math.min(maxH, Math.ceil(130 + stripsH + gridH)));
  const m = new Modal('Muelle de Pesca', w, h, { band: C.oceanNoir, subtitle: 'La comida cuesta oro. Los gatos comen. Mucho.' });
  const content = new Container();
  m.body.addChild(content);
  const lives: (() => void)[] = [];
  let list: ScrollBox | null = null;
  let firstRender = true;

  const render = () => {
    const keepScroll = list?.scrollY ?? 0;
    content.removeChildren().forEach((c) => c.destroy({ children: true }));
    lives.length = 0;
    let y = 0;
    if (G.s.momentum > 1.005) {
      const b = new Container();
      const g = new Graphics().rect(0, 0, m.innerW, 46).fill(C.orange).stroke({ width: 3, color: C.ink });
      const t = txt(`BONUS DE COSECHA  ·  cultivos x${(1 + 0.5 * (G.s.momentum - 1)).toFixed(2)} más rápido (Momentum x${G.s.momentum.toFixed(2)})`, { fontFamily: F.bebas, fontSize: 26, fill: C.ink, letterSpacing: 1 });
      t.position.set(52, 8);
      const fl = icon('flame', 30);
      fl.position.set(28, 23);
      b.addChild(g, fl, t);
      content.addChild(b);
      y = 60;
    }
    // KL21 · Mar de Pescados Automático (auto-cosecha al Silo)
    {
      const kl = autoHarvestKl();
      const unlocked = G.s.kl >= kl;
      const on = autoHarvestOn();
      const b = new Container();
      const g = new Graphics().rect(5, 5, m.innerW, 50).fill(C.ink).rect(0, 0, m.innerW, 50).fill(on ? 0x7fd8ff : unlocked ? C.paper : C.paperDark).stroke({ width: 3, color: C.ink });
      const t = txt(unlocked ? 'MAR DE PESCADOS AUTOMÁTICO' : `MAR DE PESCADOS AUTOMÁTICO · REINO ${kl}`, { fontFamily: F.poster, fontSize: 26, fill: C.ink });
      t.position.set(16, 8);
      const sub = txt(unlocked ? (on ? 'Las cosechas listas (y la pesca de tus gatos) van solas al Silo.' : 'Apagado: cosechas a mano (¿nostalgia?).') : 'Ya aprendiste a pescar. Pronto lo hará la máquina.', { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.ink });
      sub.position.set(t.x + t.width + 18, 15);
      if (sub.x + sub.width > m.innerW - 100) sub.scale.set(Math.max(0.5, (m.innerW - 100 - sub.x) / sub.width));
      const tb = new Graphics().roundRect(0, 0, 70, 34, 17).fill(on ? C.green : C.paperDark).stroke({ width: 3, color: C.ink });
      tb.circle(on ? 53 : 17, 17, 12).fill(C.paper).stroke({ width: 2.5, color: C.ink });
      tb.position.set(m.innerW - 86, 8);
      b.addChild(g, t, sub, tb);
      b.alpha = unlocked ? 1 : 0.6;
      b.position.set(0, y);
      b.eventMode = 'static';
      b.cursor = unlocked ? 'pointer' : 'not-allowed';
      b.on('pointertap', () => {
        if (!unlocked) {
          sfx('error');
          toast(`Se desbloquea en Reino ${kl}`, { color: C.paper });
          return;
        }
        G.flag('auto_harvest_off', on);
        if (!on) {
          G.count('feature_auto_harvest');
          checkMissions();
          // ready pens empty themselves right away
          for (const f of G.s.farms) if (f.ready && !f.busy) harvest(f, 'auto_harvest');
        }
        sfx('pop', on ? 0.9 : 1.3);
        render();
      });
      content.addChild(b);
      y += 64;
    }
    // the docks: a grid sized to the panel (dockGrid); past the panel's height they scroll (wheel / drag / bar)
    const box = new ScrollBox(m.innerW, Math.max(80, m.innerH + 14 - y), C.ink);
    box.y = y;
    content.addChild(box);
    list = box;
    const { cols, s } = grid;
    const cw = CARD_W * s;
    const step = CARD_H * s + GAP;
    const perRow = Math.min(cols, farms.length);
    const x0 = Math.max(0, (m.innerW - gutter - (perRow * (cw + GAP) - GAP)) / 2);
    let focusY = -1;
    farms.forEach((f0, i) => {
      const card = plotCard(f0.id, CARD_W, render, lives, m, () => box.wasDrag);
      card.scale.set(s);
      card.position.set(x0 + (i % cols) * (cw + GAP), 8 + Math.floor(i / cols) * step);
      box.content.addChild(card);
      if (f0.id === focusId) {
        focusY = card.y;
        if (firstRender) {
          const ring = new Graphics().rect(-6, -6, CARD_W + 12, CARD_H + 16).stroke({ width: 5, color: C.pinkHot });
          card.addChild(ring);
          gsap.to(ring, { alpha: 0, duration: 0.5, yoyo: true, repeat: 3 });
        }
      }
    });
    box.setContentHeight(8 + Math.ceil(farms.length / cols) * step);
    box.scrollTo(firstRender && focusY >= 0 ? focusY - 8 : keepScroll, false);
    firstRender = false;
  };
  render();
  let acc = 0;
  const tick = (tk: Ticker) => {
    acc += tk.deltaMS;
    if (acc < 200 || m.closed) return;
    acc = 0;
    lives.forEach((f) => f());
  };
  Ticker.shared.add(tick);
  m.onClose = () => Ticker.shared.remove(tick);
  m.open();
  return m;
}

function plotCard(fid: string, cw: number, rerender: () => void, lives: (() => void)[], m: Modal, dragged: () => boolean): Container {
  const f = farm(fid)!;
  const idx = G.s.farms.filter((x) => x.region === f.region).indexOf(f) + 1;
  const card = new Container();
  const ch = CARD_H;
  const bg = new Graphics().rect(8, 8, cw, ch).fill(C.ink).rect(0, 0, cw, ch).fill(0xe6eef2).stroke({ width: 4, color: C.ink, alignment: 1 });
  bg.rect(0, 0, cw, 64).fill(C.river).stroke({ width: 4, color: C.ink, alignment: 1 });
  // title on top, the region on its own line under it (side by side, long names ran into the title)
  const title = txt(`PARCELA ${idx} · NV ${f.level}`, { fontFamily: F.poster, fontSize: 30, fill: C.paper });
  title.position.set(14, 0);
  if (title.width > cw - 28) title.scale.set((cw - 28) / title.width);
  const reg = txt(regionName(f.region).toUpperCase(), { fontFamily: F.bebas, fontSize: 18, fill: C.mint, letterSpacing: 2 });
  reg.position.set(15, 38);
  if (reg.width > cw - 28) reg.scale.set((cw - 28) / reg.width);
  card.addChild(bg, title, reg);
  // pen illustration
  const pen = penArt(f.level, 2, 2);
  pen.position.set(cw / 2, 100);
  pen.scale.set(0.76);
  card.addChild(pen);
  let y = 220;
  const tmr = f.busy ? G.timerFor('farm_upgrade', f.id) : f.crop && !f.ready ? G.timerFor('crop', f.id) : null;
  if (f.busy && tmr) {
    const h = heading(`Mejorando a Nv ${f.level + 1}`, 22);
    h.position.set(14, y);
    card.addChild(h);
    addTimer(card, tmr, 14, y + 40, cw - 28, lives, rerender);
  } else if (f.crop && f.ready) {
    const c = crop(f.crop);
    const food = farmYield(f.crop, f.level, foodBonus());
    const h = heading(`${c.name} · ¡listo!`, 22);
    h.position.set(14, y);
    const ft = costTag('food', food, true, 30);
    ft.position.set(14, y + 42);
    const b = new Button('¡COSECHAR!', () => {
      if (dragged()) return;
      const ff = farm(fid);
      if (!ff) return;
      const n = harvest(ff);
      if (n > 0) {
        checkMissions();
        sfx('splash');
        // the card is scaled and scrolled: where it sits on the panel
        const a = m.panel.toLocal(card.toGlobal({ x: cw / 2, y: 150 }));
        const b2 = m.panel.toLocal(card.toGlobal({ x: cw / 2, y: 260 }));
        onomatopoeia(m.panel, a.x, a.y, '¡SPLASH!', { size: 76, color: 0x7fd8ff });
        floatText(m.panel, b2.x, b2.y, `+${fmt(n)}`, { color: 0x7fd8ff, size: 46 });
      }
      rerender();
    }, { w: cw - 28, h: 72, size: 38, color: C.yellow });
    b.position.set(14, y + 96);
    card.addChild(h, ft, b);
  } else if (f.crop && tmr) {
    const c = crop(f.crop);
    const h = heading(c.name, 22);
    h.position.set(14, y);
    card.addChild(h);
    addTimer(card, tmr, 14, y + 40, cw - 28, lives, rerender);
    const ft = txt(`→ ${fmt(farmYield(f.crop, f.level, foodBonus()))} pescaditos`, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: C.ink });
    ft.position.set(14, y + 128);
    card.addChild(ft);
  } else {
    const h = heading('Vacía', 22);
    h.position.set(14, y);
    const last = f.lastCrop ? crop(f.lastCrop) : null;
    const tip = wrapText(last ? `Última receta: ${last.name}` : 'Elige qué pescar. Lo corto rinde si juegas, lo largo si te vas.', cw - 28, 16);
    tip.position.set(14, y + 36);
    const b = new Button('SEMBRAR', () => !dragged() && openCropPicker(fid, rerender), { w: cw - 28, h: 72, size: 38, color: C.mint });
    b.position.set(14, y + 96);
    card.addChild(h, tip, b);
  }
  // ---- bottom: upgrade + repeat
  const by = ch - 112;
  const sep = new Graphics().rect(14, by - 12, cw - 28, 2).fill({ color: C.ink, alpha: 0.3 });
  card.addChild(sep);
  if (f.level < BAL.farms.upgrade.max_level) {
    const cost = farmUpgradeCost(f.level + 1);
    const ub = new Button(`MEJORAR`, () => {
      if (dragged()) return;
      const ff = farm(fid);
      if (!ff || !canUpgradeFarm(ff)) {
        sfx('error');
        toast(ff?.busy ? 'Ya se está mejorando' : `Te faltan ${fmt(cost - G.s.gold)} Doblones`, { color: C.paper });
        return;
      }
      upgradeFarm(ff);
      sfx('whoosh');
      toast(`Muelle a Nv ${ff.level + 1}`, { icon: 'clock', sub: `x${BAL.farms.upgrade.yield_growth} rendimiento · ${fmtDuration(farmUpgradeTimeMs(ff.level + 1))}` });
      rerender();
    }, { w: 150, h: 50, size: 26, color: C.paper, disabled: f.busy || G.s.gold < cost });
    ub.position.set(14, by);
    const ct = costTag('gold', cost, G.s.gold >= cost, 20);
    ct.position.set(176, by + 2);
    const tt = txt(`${fmtDuration(farmUpgradeTimeMs(f.level + 1))} · +30% pesca`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
    tt.position.set(176, by + 30);
    if (tt.width > cw - 176 - 10) tt.scale.set((cw - 186) / tt.width);
    card.addChild(ub, ct, tt);
  }
  // repeat recipe toggle (Reino 9)
  const rk = featureKl('crop_repeat');
  const unlocked = featureUnlocked('crop_repeat');
  const tog = new Container();
  const tb = new Graphics();
  const draw = () => {
    const on = farm(fid)?.repeat ?? false;
    tb.clear().roundRect(0, 0, 64, 32, 16).fill(on ? C.green : C.paperDark).stroke({ width: 3, color: C.ink });
    tb.circle(on ? 48 : 16, 16, 11).fill(C.paper).stroke({ width: 2.5, color: C.ink });
  };
  draw();
  const tl = txt(unlocked ? 'REPETIR RECETA' : `REPETIR RECETA · REINO ${rk}`, { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 1 });
  tl.position.set(76, 3);
  if (tl.width > cw - 28 - 76) tl.scale.set((cw - 104) / tl.width);
  tog.addChild(tb, tl);
  tog.position.set(14, by + 58);
  tog.alpha = unlocked ? 1 : 0.45;
  tog.eventMode = 'static';
  tog.cursor = unlocked ? 'pointer' : 'not-allowed';
  tog.on('pointertap', () => {
    if (dragged()) return;
    const ff = farm(fid);
    if (!ff) return;
    if (!unlocked) {
      sfx('error');
      toast(`Se desbloquea en Reino ${rk}`, { sub: 'Primero aprende a pescar a mano. Luego, piloto automático.' });
      return;
    }
    ff.repeat = !ff.repeat;
    if (ff.repeat) {
      G.count('feature_crop_repeat');
      checkMissions();
    }
    sfx('pop', ff.repeat ? 1.3 : 0.9);
    draw();
  });
  card.addChild(tog);
  return card;
}

function addTimer(card: Container, t: { leftMs: number; totalMs: number; id: string }, x: number, y: number, w: number, lives: (() => void)[], rerender: () => void) {
  const bc = new Container();
  bc.position.set(x, y);
  const tt = txt('', { fontFamily: F.heavy, fontSize: 30, fill: C.ink });
  tt.position.set(x, y + 34);
  const ic = icon('clock', 30);
  ic.position.set(x + w - 16, y + 52);
  card.addChild(bc, tt, ic);
  let done = false;
  lives.push(() => {
    if (bc.destroyed || done) return;
    bc.removeChildren().forEach((c) => c.destroy());
    bc.addChild(bar(w - 4, 22, 1 - t.leftMs / t.totalMs, C.green));
    tt.text = fmtTime(Math.max(0, t.leftMs));
    if (!G.s.timers.some((x) => x.id === t.id)) {
      done = true;
      rerender();
    }
  });
  lives[lives.length - 1]();
}

/** crop selector: name, time, cost, food, food/min (decide active vs away) */
export function openCropPicker(fid: string, onDone: () => void) {
  const f = farm(fid);
  if (!f) return;
  const avail = cropsAvailable();
  const nextLocked = BAL.farms.crops.find((c) => G.s.kl < c.kl);
  const list = nextLocked ? [...avail, nextLocked] : avail;
  const h = Math.min(1000, 210 + list.length * 96);
  const m = new Modal('¿Qué pescamos?', 1100, h, { band: C.river, subtitle: `Parcela Nv ${f.level}` });
  const head = ['CULTIVO', 'TIEMPO', 'COSTO', 'PESCA', 'POR MIN'];
  const xs = [96, 470, 600, 750, 880];
  head.forEach((t, i) => {
    const l = txt(t, { fontFamily: F.bebas, fontSize: 20, fill: C.ink, letterSpacing: 2 });
    l.position.set(xs[i], 0);
    m.body.addChild(l);
  });
  const mom = G.s.momentum;
  list.forEach((c, i) => {
    const locked = G.s.kl < c.kl;
    const row = new Container();
    const face = new Container();
    const ok = G.s.gold >= c.cost;
    const bg = new Graphics().rect(5, 5, m.innerW, 82).fill(C.ink).rect(0, 0, m.innerW, 82).fill(locked ? C.paperDark : C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
    face.addChild(bg);
    const fish = icon('food', 46);
    fish.position.set(44, 41);
    face.addChild(fish);
    const nm = txt(locked ? '???' : c.name, { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    nm.position.set(96, 8);
    const sub = txt(locked ? `Se desbloquea en Reino ${c.kl}` : c.time_s >= 600 ? 'ideal para irte un rato' : 'ideal mientras juegas', { fontFamily: F.ui, fontSize: 14, fill: locked ? C.red : C.ink });
    sub.position.set(96, 50);
    face.addChild(nm, sub);
    if (!locked) {
      const tms = cropTimeMs(c.id, mom);
      const food = farmYield(c.id, f.level, foodBonus());
      const vals = [fmtDuration(tms), null, fmt(food), `${fmt((food / tms) * 60000)}`];
      const tv = txt(vals[0]!, { fontFamily: F.heavy, fontSize: 24, fill: mom > 1.005 ? C.orange : C.ink });
      tv.position.set(xs[1], 24);
      const cost = costTag('gold', c.cost, ok, 22);
      cost.position.set(xs[2], 24);
      const fv = costTag('food', food, true, 22);
      fv.position.set(xs[3], 24);
      const pm = txt(vals[3]!, { fontFamily: F.heavy, fontSize: 24, fill: C.green });
      pm.position.set(xs[4], 24);
      face.addChild(tv, cost, fv, pm);
    }
    row.addChild(face);
    row.position.set(0, 40 + i * 96);
    if (!locked) {
      row.eventMode = 'static';
      row.cursor = ok ? 'pointer' : 'not-allowed';
      row.on('pointerover', () => gsap.to(face, { x: -4, y: -4, duration: 0.1 }));
      row.on('pointerout', () => gsap.to(face, { x: 0, y: 0, duration: 0.12 }));
      row.on('pointertap', () => {
        const ff = farm(fid);
        if (!ff) return;
        if (!plant(ff, c.id)) {
          sfx('error');
          toast(`Te faltan ${fmt(c.cost - G.s.gold)} Doblones`, { color: C.paper });
          return;
        }
        checkMissions();
        sfx('splash', 1.4);
        sfx('coin', 0.8);
        toast(`¡A pescar ${c.name}!`, { icon: 'clock', sub: `Listo en ${fmtDuration(cropTimeMs(c.id, G.s.momentum))}` });
        m.close();
        onDone();
      });
    }
    m.body.addChild(row);
  });
  m.open();
  return m;
}

export type { FarmPlot };
