/** Habitat panel: tier, cats (portraits, move-in), gold/s, buffer bar, upgrade (cost/time/Reino/crystals). */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { Button, dotGrid, txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { G, Habitat } from '../../state/game';
import { BAL, habitatTier } from '../../state/econ';
import { builders, buildersBusy, canUpgradeHabitat, collectHabitat, habitat, habitatCap, habitatCapacity, habitatRate, house, upgradeHabitat, habitatFishRate, fishBuffer, fishCap, catFish, isFisher, bankUnlocked } from '../../state/sys/island';
import { checkMissions } from '../../state/sys/missions';
import { habitatFull, movableCats } from '../../state/ext/island';
import { catGold } from '../../state/sys/cats';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementFx } from '../../art/catArt';
import { fmt, fmtDuration, fmtTime } from '../../core/format';
import { sfx } from '../../core/audio';
import { habitatHouse } from '../../island/buildingArt';
import { bar, catPortrait, costTag, elementChip, heading, mix, wrapText } from './ui';
import { openCatPanel } from '../CatPanel';
import { floatText } from '../../fx/juice';

export function openHabitatPanel(hid: string) {
  const h0 = habitat(hid);
  if (!h0) return;
  const W0 = 1400;
  const H0 = 860;
  const t = habitatTier(h0.tier);
  const m = new Modal(`Hábitat de ${cap(ELEMENT_NAME[h0.element] ?? h0.element)}`, W0, H0, { subtitle: `TIER ${h0.tier} · ${t.name.toUpperCase()}`, band: elementFx(h0.element).dark });
  const content = new Container();
  m.body.addChild(content);
  let live: (() => void) | null = null;

  const render = () => {
    content.removeChildren().forEach((c) => c.destroy({ children: true }));
    const h = habitat(hid);
    if (!h) return;
    const fx = elementFx(h.element);
    const tier = habitatTier(h.tier);
    // ------------------------------------------------ left column: art + income + buffer
    const left = new Container();
    const lbg = new Graphics().rect(0, 0, 420, m.innerH - 10).fill(mix(fx.main, C.paper, 0.8)).stroke({ width: 3, color: C.ink, alignment: 1 });
    left.addChild(lbg);
    const disc = new Graphics().ellipse(210, 318, 170, 60).fill(mix(fx.main, C.paper, 0.55)).stroke({ width: 3, color: C.ink });
    left.addChild(disc);
    const art = habitatHouse(h.element, Math.max(1, h.tier)).c;
    art.position.set(210, 318);
    art.scale.set(1.65);
    left.addChild(art);
    left.addChild(elementChip(h.element, 20)).position.set(14, 14);
    const tierTag = txt(tier.name.toUpperCase(), { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    tierTag.position.set(14, 50);
    left.addChild(tierTag);
    const capTag = txt(`x${tier.mult} oro · cap. ${tier.capacity} gatos · búfer ${tier.buffer_min} min`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
    capTag.position.set(14, 88);
    left.addChild(capTag);
    const rateL = txt('ORO/S', { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 2 });
    rateL.position.set(14, 384);
    const ri = icon('gold', 40);
    ri.position.set(34, 440);
    const rv = txt(`+${fmt(habitatRate(h))}/s`, { fontFamily: F.heavy, fontSize: 40, fill: C.ink });
    rv.position.set(62, 416);
    left.addChild(rateL, ri, rv);
    const fr = habitatFishRate(h);
    if (fr > 0) {
      const fi = icon('food', 34);
      fi.position.set(rv.x + rv.width + 40, 440);
      const fv = txt(`+${fmt(fr)}/s`, { fontFamily: F.heavy, fontSize: 30, fill: 0x2c6f9f });
      fv.position.set(rv.x + rv.width + 62, 422);
      left.addChild(fi, fv);
      if (fv.x + fv.width > 410) {
        const k = (410 - rv.x) / (fv.x + fv.width - rv.x);
        for (const n of [rv, fi, fv]) n.scale.set(k);
        fi.x = rv.x + rv.width + 26;
        fv.x = fi.x + 18;
      }
    }
    const bufL = txt(bankUnlocked() ? 'BÚFER · el Banco del Reino deposita el oro solo' : 'BÚFER', { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 2 });
    bufL.position.set(14, 480);
    left.addChild(bufL);
    const barC = new Container();
    barC.position.set(14, 512);
    left.addChild(barC);
    const bufT = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink });
    bufT.position.set(14, 548);
    left.addChild(bufT);
    const col = new Button('RECOLECTAR', () => {
      const hh = habitat(hid);
      if (!hh) return;
      const got = collectHabitat(hh);
      if (got.gold > 0 || got.food > 0) {
        checkMissions();
        sfx('coin', 1.2);
        if (got.gold > 0) floatText(m.panel, 14 + 120 + 28, 108 + 600, `+${fmt(got.gold)}`, { color: C.yellow, size: 44 });
        if (got.food > 0) {
          sfx('splash', 1.3);
          floatText(m.panel, 14 + 300 + 28, 108 + 590, `+${fmt(got.food)}`, { color: 0x7fd8ff, size: 40 });
        }
      } else sfx('error');
      refreshLive();
    }, { w: 392, h: 66, color: C.yellow, size: 32 });
    col.position.set(14, 580);
    left.addChild(col);
    content.addChild(left);
    const refreshLive = () => {
      const hh = habitat(hid);
      if (!hh || barC.destroyed) return;
      const cap = habitatCap(hh);
      const full = habitatFull(hh);
      barC.removeChildren().forEach((c) => c.destroy());
      const fc = fishCap(hh);
      const fish = fc > 0;
      barC.addChild(bar(fish ? 190 : 392, 26, cap > 0 ? hh.buffer / cap : 0, full ? C.red : C.yellow));
      if (fish) {
        const fb = bar(190, 26, fishBuffer(hh) / fc, fishBuffer(hh) >= fc - 0.01 ? C.red : 0x7fd8ff);
        fb.x = 202;
        barC.addChild(fb);
      }
      const goldTxt = full ? `¡LLENO! ${fmt(hh.buffer)} / ${fmt(cap)}` : `${fmt(hh.buffer)} / ${fmt(cap)}`;
      bufT.text = fish ? `${goldTxt}   ·   pesca ${fmt(fishBuffer(hh))} / ${fmt(fc)}` : full ? `${goldTxt} — recolecta o se desperdicia` : goldTxt;
      bufT.style.fill = full ? C.red : C.ink;
    };
    refreshLive();

    // swiss decoration: giant tier numeral + dot grid
    const big = txt(String(h.tier).padStart(2, '0'), { fontFamily: F.poster, fontSize: 300, fill: fx.main });
    big.alpha = 0.12;
    big.anchor.set(1, 0);
    big.position.set(m.innerW + 10, -70);
    const dg = dotGrid(3, 6, 18, 3, C.ink);
    dg.alpha = 0.5;
    dg.position.set(m.innerW - 50, 300);
    content.addChild(big, dg);
    // ------------------------------------------------ cats
    const x0 = 450;
    const catsH = heading(`Gatos (${h.cats.length}/${habitatCapacity(h)})`, 28);
    catsH.position.set(x0, 0);
    content.addChild(catsH);
    const cap = habitatCapacity(h);
    for (let i = 0; i < cap; i++) {
      const uid = h.cats[i];
      const c = uid ? G.s.cats.find((x) => x.uid === uid) : null;
      const slot = new Container();
      if (c) {
        const p = catPortrait(c, 150);
        slot.addChild(p);
        const fishy = isFisher(c.species);
        const g = txt(`+${fmt(catGold(c))}/s${fishy ? `  ·  +${fmt(catFish(c.uid))} pesca/s` : ''}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.green });
        g.anchor.set(0.5, 0);
        g.position.set(75, 186);
        if (g.width > 166) g.scale.set(166 / g.width);
        slot.addChild(g);
        if (fishy) {
          const tag = new Graphics().rect(0, 0, 96, 24).fill(0x7fd8ff).stroke({ width: 2.5, color: C.ink });
          tag.position.set(52, 4);
          const tt = txt('PESCADOR', { fontFamily: F.bebas, fontSize: 18, fill: C.ink, letterSpacing: 1 });
          tt.position.set(60, 6);
          slot.addChild(tag, tt);
        }
        slot.eventMode = 'static';
        slot.cursor = 'pointer';
        slot.on('pointertap', () => {
          sfx('meow', 1);
          openCatPanel(c.uid);
        });
        slot.on('pointerover', () => gsap.to(p, { y: -5, duration: 0.1 }));
        slot.on('pointerout', () => gsap.to(p, { y: 0, duration: 0.12 }));
      } else {
        const g = new Graphics().rect(0, 0, 150, 150).fill({ color: C.paperDark, alpha: 0.6 }).stroke({ width: 3, color: C.ink, alpha: 0.5 });
        const plus = txt('LIBRE', { fontFamily: F.bebas, fontSize: 26, fill: C.ink, letterSpacing: 2 });
        plus.alpha = 0.5;
        plus.anchor.set(0.5);
        plus.position.set(75, 75);
        slot.addChild(g, plus);
      }
      slot.position.set(x0 + i * 172, 48);
      content.addChild(slot);
    }
    // move-in candidates
    const movers = movableCats(h).filter((c) => h.cats.length < cap || !c.habitat);
    const mvH = heading('Mudar aquí', 24);
    mvH.position.set(x0, 272);
    content.addChild(mvH);
    if (!movers.length) {
      const n = wrapText(`Ningún otro gato de ${ELEMENT_NAME[h.element]?.toLowerCase()} disponible. Consigue más en el Santuario de Resonancia.`, 480, 17);
      n.position.set(x0, 312);
      content.addChild(n);
    }
    movers.slice(0, 4).forEach((c, i) => {
      const row = new Container();
      const p = catPortrait(c, 74, { name: false });
      const nm = txt(c.name, { fontFamily: F.poster, fontSize: 22, fill: C.ink });
      nm.position.set(86, 4);
      const where = txt(c.habitat ? 'vive en otro hábitat' : 'SIN CASA (no produce)', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: c.habitat ? C.ink : C.red });
      where.position.set(86, 34);
      const full = h.cats.length >= cap;
      const b = new Button(full ? 'LLENO' : 'MUDAR', () => {
        const hh = habitat(hid);
        if (hh && house(c.uid, hh)) {
          sfx('pop', 1.2);
          toast(`${c.name} se mudó`, { sub: `Ahora vive en el hábitat de ${ELEMENT_NAME[hh.element]?.toLowerCase()}.`, icon: 'paw' });
          render();
        } else sfx('error');
      }, { w: 120, h: 48, size: 24, color: C.mint, disabled: full });
      b.position.set(290, 14);
      row.addChild(p, nm, where, b);
      row.position.set(x0 + (i % 2) * 450, 312 + Math.floor(i / 2) * 92);
      content.addChild(row);
    });

    // ------------------------------------------------ upgrade
    const next = BAL.habitats.tiers[h.tier];
    const ux = 450;
    const uy = 520;
    const ubox = new Graphics().rect(6, 6, m.innerW - ux, m.innerH - uy - 14).fill(C.ink).rect(0, 0, m.innerW - ux, m.innerH - uy - 14).fill(C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
    ubox.position.set(ux, uy);
    content.addChild(ubox);
    const timer = h.busy ? G.timerFor('habitat_upgrade', h.id) ?? G.timerFor('build', h.id) : null;
    if (timer) {
      const tl = heading(timer.kind === 'build' ? 'En obra' : `Mejorando a ${next?.name ?? ''}`, 24);
      tl.position.set(ux + 20, uy + 14);
      const tb = new Container();
      tb.position.set(ux + 20, uy + 64);
      const tt = txt('', { fontFamily: F.heavy, fontSize: 28, fill: C.ink });
      tt.position.set(ux + 20, uy + 104);
      const purr = new Button('RONRONEAR', () => {
        const used = G.spendPurrOn(timer);
        if (used > 0) sfx('purr');
        else {
          sfx('error');
          toast('Sin Ronroneo en la reserva', { sub: 'Se gana jugando: batallas, misiones, especies nuevas…' });
        }
      }, { w: 220, h: 56, size: 26, color: C.lilac });
      purr.position.set(m.innerW - 250, uy + 70);
      content.addChild(tl, tb, tt, purr);
      live = () => {
        if (tb.destroyed) return;
        tb.removeChildren().forEach((c) => c.destroy());
        tb.addChild(bar(600, 24, 1 - timer.leftMs / timer.totalMs, C.green));
        tt.text = timer.leftMs > 0 ? fmtTime(timer.leftMs) : '¡Listo!';
        if (timer.leftMs <= 0 || !G.s.timers.includes(timer)) render();
        refreshLive();
      };
    } else if (!next) {
      const done = txt('TIER MÁXIMO. Este hábitat ya es leyenda.', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
      done.position.set(ux + 20, uy + 50);
      content.addChild(done);
      live = refreshLive;
    } else {
      const nl = heading(`Mejorar a ${next.name}`, 26);
      nl.position.set(ux + 20, uy + 14);
      const perks = txt(`x${next.mult} oro (antes x${tier.mult}) · ${next.capacity} gatos · búfer ${next.buffer_min} min`, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.ink });
      perks.position.set(ux + 20, uy + 58);
      content.addChild(nl, perks);
      let cx = ux + 20;
      const costs: Container[] = [];
      costs.push(costTag('gold', next.cost, G.s.gold >= next.cost, 26));
      if (next.crystals) costs.push(costTag('crystal', next.crystals, (G.s.crystals[h.element] ?? 0) >= next.crystals, 26, elementFx(h.element).main));
      const tm = new Container();
      const ti = icon('clock', 30);
      ti.position.set(15, 15);
      const tv = txt(fmtDuration(next.build_s * 1000), { fontFamily: F.heavy, fontSize: 26, fill: C.ink });
      tv.position.set(36, 0);
      tm.addChild(ti, tv);
      costs.push(tm);
      for (const c of costs) {
        c.position.set(cx, uy + 96);
        content.addChild(c);
        cx += c.width + 30;
      }
      let reason: string | null = null;
      if (G.s.kl < next.kl) reason = `Necesitas Reino ${next.kl}`;
      else if ((G.s.crystals[h.element] ?? 0) < next.crystals) reason = `Faltan cristales de ${ELEMENT_NAME[h.element]?.toLowerCase()} (solo en combate)`;
      else if (G.s.gold < next.cost) reason = `Te faltan ${fmt(next.cost - G.s.gold)} Doblones`;
      else if (buildersBusy() >= builders()) reason = 'Tus constructores están ocupados';
      const b = new Button(reason ? 'MEJORAR' : '¡MEJORAR!', () => {
        const hh = habitat(hid);
        if (!hh || !canUpgradeHabitat(hh)) {
          sfx('error');
          if (reason) toast(reason, { color: C.paper });
          return;
        }
        upgradeHabitat(hh);
        checkMissions();
        sfx('whoosh');
        toast(`¡Obra en marcha! ${next.name}`, { icon: 'clock', sub: `${fmtDuration(next.build_s * 1000)} · reloj verde (Ronroneo lo acelera)` });
        render();
      }, { w: 260, h: 70, size: 34, color: reason ? C.paperDark : C.pinkHot, textColor: reason ? C.ink : C.paper, disabled: !!reason });
      b.position.set(m.innerW - 290, uy + 44);
      content.addChild(b);
      if (reason) {
        const r = txt(reason, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.red });
        r.position.set(ux + 20, uy + 140);
        content.addChild(r);
      }
      live = refreshLive;
    }
  };
  render();
  let acc = 0;
  const tick = (tk: Ticker) => {
    acc += tk.deltaMS;
    if (acc < 250) return;
    acc = 0;
    if (m.closed) return;
    live?.();
  };
  Ticker.shared.add(tick);
  m.onClose = () => Ticker.shared.remove(tick);
  m.open();
  return m;
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export type { Habitat };
