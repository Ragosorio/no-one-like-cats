/**
 * Habitat panel: the tier's yard (animated, at its real size), cats (one slot per place — the next
 * tier's extra places show as locked slots), gold/s, buffer bar, upgrade (what grows: capacity, gold,
 * buffer, LAND — cost, time, Reino, crystals — a preview of the next tier and of the extra ground it
 * needs), and MOVER / VENDER (free placement). No room to grow in place → "MOVER Y MEJORAR" (placement
 * mode with the bigger ghost on the nearest free spot) or, with no land left, a pointer to expansions.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { Button, dotGrid, txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { G, Habitat } from '../../state/game';
import { BAL, habitatTier } from '../../state/econ';
import {
  builders,
  buildersBusy,
  canSellHabitat,
  canUpgradeHabitat,
  collectHabitat,
  upgradeBlocker,
  habitat,
  habitatCap,
  habitatCapacity,
  habitatRate,
  habitatSellValue,
  house,
  sellHabitat,
  upgradeHabitat,
  habitatFishRate,
  fishBuffer,
  fishCap,
  catFish,
  isFisher,
  bankUnlocked,
} from '../../state/sys/island';
import { checkMissions } from '../../state/sys/missions';
import { habitatFull, movableCats } from '../../state/ext/island';
import { catGold } from '../../state/sys/cats';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementFx } from '../../art/catArt';
import { fmt, fmtDuration, fmtTime } from '../../core/format';
import { sfx } from '../../core/audio';
import { habitatHouse, habitatParts } from '../../island/buildingArt';
import type { Tick } from '../../island/habitatTiers';
import { requestPlacement } from '../../island/decor/DecorLayer';
import { habitatSize, isCompact, upgradeRoom } from '../../island/placement';
import { centerOf } from '../../island/buildingArt';
import { islandHooks } from '../../island/hooks';
import { bar, catPortrait, costTag, elementChip, heading, mix, wrapText } from './ui';
import { openCatPanel } from '../CatPanel';
import { openPopMenu } from './PopMenu';
import { floatText } from '../../fx/juice';

export function openHabitatPanel(hid: string) {
  const h0 = habitat(hid);
  if (!h0) return;
  const W0 = 1400;
  const H0 = 860;
  const t = habitatTier(h0.tier);
  const m = new Modal(`Hábitat de ${cap(ELEMENT_NAME[h0.element] ?? h0.element)}`, W0, H0, { subtitle: `TIER ${h0.tier} · ${t.name.toUpperCase()} · ${t.capacity} GATOS`, band: elementFx(h0.element).dark });
  const content = new Container();
  m.body.addChild(content);
  let live: (() => void) | null = null;
  let artTicks: Tick[] = [];
  let yardReact: (() => void) | null = null;
  let clock = 0;

  const render = () => {
    content.removeChildren().forEach((c) => c.destroy({ children: true }));
    artTicks = [];
    const h = habitat(hid);
    if (!h) return;
    const fx = elementFx(h.element);
    const tier = habitatTier(h.tier);
    const next = BAL.habitats.tiers[h.tier] as (typeof BAL.habitats.tiers)[number] | undefined;
    const capNow = habitatCapacity(h);
    // ------------------------------------------------ left column: the yard + income + buffer
    const left = new Container();
    const lbg = new Graphics().rect(0, 0, 420, m.innerH - 10).fill(mix(fx.main, C.paper, 0.8)).stroke({ width: 3, color: C.ink, alignment: 1 });
    left.addChild(lbg);
    const yard = new Container();
    // the yard at its real size (3×3 → 4×4 → 5×5), fitted to the column
    const N = habitatSize(h);
    const parts = habitatParts(h.element, Math.max(1, h.tier), N, N, false);
    yard.addChild(parts.ground, parts.back, parts.front);
    if (parts.tick) artTicks.push(parts.tick);
    yardReact = parts.react ?? null;
    const ys = 0.86 * (3 / N) ** 0.75;
    yard.scale.set(ys);
    yard.position.set(210, 168 + 64 * 0.86 - centerOf(N, N).y * ys + (N - 3) * 22);
    const ym = new Graphics().rect(0, 0, 420, m.innerH - 10).fill(0xffffff);
    left.addChild(ym, yard);
    yard.mask = ym;
    left.addChild(new Graphics().rect(6, 6, 408, 106).fill({ color: C.paper, alpha: 0.82 }));
    left.addChild(elementChip(h.element, 20)).position.set(14, 14);
    const tierTag = txt(tier.name.toUpperCase(), { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    tierTag.position.set(14, 50);
    left.addChild(tierTag);
    const capTag = txt(`x${tier.mult} oro · ${tier.capacity} gatos · búfer ${tier.buffer_min} min · terreno ${N}×${N}${isCompact(h) ? ' (compacto)' : ''}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: isCompact(h) ? C.red : C.ink });
    if (capTag.width > 396) capTag.scale.set(396 / capTag.width);
    capTag.position.set(14, 88);
    left.addChild(capTag);
    const rateL = txt('ORO/S', { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 2 });
    rateL.position.set(14, 384);
    const ri = icon('gold', 40);
    ri.position.set(34, 440);
    const rv = txt(`+${fmt(habitatRate(h))}/s`, { fontFamily: F.heavy, fontSize: 40, fill: C.ink });
    rv.position.set(62, 416);
    const rbg = new Graphics().rect(6, 376, 408, 100).fill({ color: C.paper, alpha: 0.85 });
    left.addChild(rbg, rateL, ri, rv);
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
    const bufBg = new Graphics().rect(6, 476, 408, 98).fill({ color: C.paper, alpha: 0.85 });
    left.addChild(bufBg);
    const bufL = txt(bankUnlocked() ? 'BÚFER · el Banco lo deposita solo' : 'BÚFER', { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 1 });
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
        yardReact?.();
        sfx('coin', 1.2);
        if (got.gold > 0) floatText(m.panel, 14 + 120 + 28, 108 + 600, `+${fmt(got.gold)}`, { color: C.yellow, size: 44 });
        if (got.food > 0) {
          sfx('splash', 1.3);
          floatText(m.panel, 14 + 300 + 28, 108 + 590, `+${fmt(got.food)}`, { color: 0x7fd8ff, size: 40 });
        }
      } else sfx('error');
      refreshLive();
    }, { w: 392, h: 60, color: C.yellow, size: 30 });
    col.position.set(14, 582);
    left.addChild(col);
    // free placement: move it anywhere / sell it
    const mv = new Button('MOVER', () => {
      m.close();
      if (!requestPlacement({ kind: 'habitat', element: h.element, moveId: hid }, () => openHabitatPanel(hid))) toast('Ve a tu isla para moverlo', { color: C.paper });
    }, { w: 190, h: 54, color: C.mint, size: 26 });
    mv.position.set(14, 656);
    const sellWhy = canSellHabitat(h);
    const sv = habitatSellValue(h);
    const sl = new Button(sellWhy ? 'VENDER' : `VENDER +${fmt(sv)}`, () => {
      const hh = habitat(hid);
      if (!hh) return;
      const why = canSellHabitat(hh);
      if (why) {
        sfx('error');
        toast(why, { color: C.paper });
        return;
      }
      const g = sl.getGlobalPosition();
      const n = hh.cats.length;
      openPopMenu({ x: g.x + 95, y: g.y - 10 }, `¿VENDER POR ${fmt(habitatSellValue(hh))}?`, [
        {
          label: `SÍ · +${fmt(habitatSellValue(hh))}`,
          color: C.pinkHot,
          textColor: C.paper,
          onTap: () => {
            const r = sellHabitat(hid);
            if (!r) {
              sfx('error');
              return;
            }
            checkMissions();
            sfx('coin', 1.1);
            toast(`Vendiste el hábitat · +${fmt(r.gold)}`, {
              icon: 'gold',
              sub: r.homeless.length ? `${r.homeless.length} gato(s) se quedaron sin casa: dales otro hábitat de su elemento.` : n ? 'Sus gatos se mudaron a otro hábitat con espacio.' : 'Terreno libre para lo que quieras.',
              color: r.homeless.length ? 0xffd7d0 : C.mint,
            });
            islandHooks.sync?.();
            m.close();
          },
        },
        { label: 'NO', color: C.paper, onTap: () => undefined },
      ]);
    }, { w: 190, h: 54, color: sellWhy ? C.paperDark : C.paper, size: 22 });
    sl.position.set(216, 650);
    mv.position.set(14, 650);
    left.addChild(mv, sl);
    content.addChild(left);
    const refreshLive = () => {
      const hh = habitat(hid);
      if (!hh || barC.destroyed) return;
      const cp = habitatCap(hh);
      const full = habitatFull(hh);
      barC.removeChildren().forEach((c) => c.destroy());
      const fc = fishCap(hh);
      const fish = fc > 0;
      barC.addChild(bar(fish ? 190 : 392, 26, cp > 0 ? hh.buffer / cp : 0, full ? C.red : C.yellow));
      if (fish) {
        const fb = bar(190, 26, fishBuffer(hh) / fc, fishBuffer(hh) >= fc - 0.01 ? C.red : 0x7fd8ff);
        fb.x = 202;
        barC.addChild(fb);
      }
      const goldTxt = full ? `¡LLENO! ${fmt(hh.buffer)} / ${fmt(cp)}` : `${fmt(hh.buffer)} / ${fmt(cp)}`;
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
    // ------------------------------------------------ cats: one slot per place (+ the next tier's extra places, locked)
    const x0 = 450;
    const catsH = heading(`Gatos (${h.cats.length}/${capNow})`, 28);
    catsH.position.set(x0, 0);
    content.addChild(catsH);
    const extra = next ? Math.max(0, next.capacity - capNow) : 0;
    const slots = capNow + extra;
    const perRow = slots <= 5 ? 5 : 7;
    const ps = slots <= 5 ? 150 : 100;
    const gapX = slots <= 5 ? 172 : 124;
    const rowH = ps + (slots <= 5 ? 44 : 30);
    for (let i = 0; i < slots; i++) {
      const uid = h.cats[i];
      const c = uid ? G.s.cats.find((x) => x.uid === uid) : null;
      const slot = new Container();
      if (i >= capNow) {
        // a place this habitat gets at the next tier
        const g = new Graphics().rect(0, 0, ps, ps).fill({ color: C.paper, alpha: 0.5 });
        dashedRect(g, ps, ps);
        const l1 = txt(`+1`, { fontFamily: F.poster, fontSize: ps * 0.3, fill: C.ink });
        l1.alpha = 0.55;
        l1.anchor.set(0.5);
        l1.position.set(ps / 2, ps * 0.4);
        const l2 = txt(`AL MEJORAR`, { fontFamily: F.bebas, fontSize: ps * 0.15, fill: C.ink, letterSpacing: 1 });
        l2.alpha = 0.6;
        l2.anchor.set(0.5);
        l2.position.set(ps / 2, ps * 0.72);
        slot.addChild(g, l1, l2);
      } else if (c) {
        const p = catPortrait(c, ps, { name: ps >= 150 });
        slot.addChild(p);
        const fishy = isFisher(c.species);
        const g = txt(`+${fmt(catGold(c))}/s${fishy && ps >= 150 ? `  ·  +${fmt(catFish(c.uid))} pesca/s` : ''}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.green });
        g.anchor.set(0.5, 0);
        g.position.set(ps / 2, ps >= 150 ? 186 : ps + 4);
        if (g.width > gapX - 6) g.scale.set((gapX - 6) / g.width);
        slot.addChild(g);
        if (fishy && ps >= 150) {
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
        const g = new Graphics().rect(0, 0, ps, ps).fill({ color: C.paperDark, alpha: 0.6 }).stroke({ width: 3, color: C.ink, alpha: 0.5 });
        const plus = txt('LIBRE', { fontFamily: F.bebas, fontSize: ps * 0.17, fill: C.ink, letterSpacing: 2 });
        plus.alpha = 0.5;
        plus.anchor.set(0.5);
        plus.position.set(ps / 2, ps / 2);
        slot.addChild(g, plus);
      }
      slot.position.set(x0 + (i % perRow) * gapX, 48 + Math.floor(i / perRow) * rowH);
      content.addChild(slot);
    }
    const catsBottom = 48 + Math.ceil(slots / perRow) * rowH;
    // move-in candidates
    const uy = 500;
    const movers = movableCats(h).filter((c) => h.cats.length < capNow || !c.habitat);
    const mvY = Math.max(catsBottom + 4, 250);
    const mvH = heading('Mudar aquí', 24);
    mvH.position.set(x0, mvY);
    content.addChild(mvH);
    if (!movers.length) {
      const n = wrapText(`Ningún otro gato de ${ELEMENT_NAME[h.element]?.toLowerCase()} disponible. Consigue más en el Santuario de Resonancia.`, 820, 17);
      n.position.set(x0, mvY + 38);
      content.addChild(n);
    }
    const rowsFit = Math.max(1, Math.floor((uy - 8 - (mvY + 38)) / 84));
    movers.slice(0, rowsFit * 2).forEach((c, i) => {
      const row = new Container();
      const p = catPortrait(c, 70, { name: false });
      const nm = txt(c.name, { fontFamily: F.poster, fontSize: 22, fill: C.ink });
      nm.position.set(82, 2);
      const where = txt(c.habitat ? 'vive en otro hábitat' : 'SIN CASA (no produce)', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: c.habitat ? C.ink : C.red });
      where.position.set(82, 32);
      const full = h.cats.length >= capNow;
      const b = new Button(full ? 'LLENO' : 'MUDAR', () => {
        const hh = habitat(hid);
        if (hh && house(c.uid, hh)) {
          sfx('pop', 1.2);
          toast(`${c.name} se mudó`, { sub: `Ahora vive en el hábitat de ${ELEMENT_NAME[hh.element]?.toLowerCase()}.`, icon: 'paw' });
          render();
        } else sfx('error');
      }, { w: 120, h: 46, size: 24, color: C.mint, disabled: full });
      b.position.set(290, 12);
      row.addChild(p, nm, where, b);
      row.position.set(x0 + (i % 2) * 450, mvY + 38 + Math.floor(i / 2) * 84);
      content.addChild(row);
    });

    // ------------------------------------------------ upgrade
    const ux = 450;
    const ubox = new Graphics().rect(6, 6, m.innerW - ux, m.innerH - uy - 14).fill(C.ink).rect(0, 0, m.innerW - ux, m.innerH - uy - 14).fill(C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
    ubox.position.set(ux, uy);
    content.addChild(ubox);
    const timer = h.busy ? (G.timerFor('habitat_upgrade', h.id) ?? G.timerFor('build', h.id)) : null;
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
      if (timer.kind === 'habitat_upgrade' && next) {
        const gain = txt(`Al terminar: ${next.capacity} gatos (+${Math.max(0, next.capacity - tier.capacity)}) · x${next.mult} oro`, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.green });
        gain.position.set(ux + 20, uy + 148);
        content.addChild(gain);
      }
      live = () => {
        if (tb.destroyed) return;
        tb.removeChildren().forEach((c) => c.destroy());
        tb.addChild(bar(560, 24, 1 - timer.leftMs / timer.totalMs, C.green));
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
      content.addChild(nl);
      // what grows (before → after), capacity first and loudest
      let gx = ux + 20;
      const room = upgradeRoom(h);
      const grows = room.to > room.from;
      const grow = (label: string, from: string, to: string, hot: boolean, bad = false) => {
        const c = new Container();
        const w = grows ? 118 : 150;
        const g = new Graphics().rect(4, 4, w, 70).fill(C.ink).rect(0, 0, w, 70).fill(bad ? 0xffc2c2 : hot ? C.mint : 0xf6efe2).stroke({ width: 3, color: C.ink });
        const l = txt(label, { fontFamily: F.bebas, fontSize: 18, fill: C.ink, letterSpacing: 1 });
        l.position.set(10, 4);
        const v = txt(`${from} → ${to}`, { fontFamily: F.heavy, fontSize: 24, fill: C.ink });
        v.position.set(10, 30);
        if (v.width > w - 16) v.scale.set((w - 16) / v.width);
        if (l.width > w - 14) l.scale.set((w - 14) / l.width);
        c.addChild(g, l, v);
        c.position.set(gx, uy + 56);
        content.addChild(c);
        gx += w + 8;
      };
      const more = next.capacity - tier.capacity;
      grow(more > 0 ? `CAPACIDAD (+${more} GATO${more > 1 ? 'S' : ''})` : 'CAPACIDAD', `${tier.capacity}`, `${next.capacity}`, more > 0);
      grow('ORO', `x${tier.mult}`, `x${next.mult}`, false);
      grow('BÚFER', `${tier.buffer_min}m`, `${next.buffer_min}m`, false);
      // the yard grows at some tiers: the land it needs (green = fits here, red = no room around it)
      if (grows) grow(room.at ? 'TERRENO (CRECE)' : 'TERRENO (NO CABE)', `${room.from}×${room.from}`, `${room.to}×${room.to}`, true, !room.at);
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
      // the land it needs: current yard + the extra ring (green = fits in place, red = no room around it)
      if (room.to > room.from || isCompact(h)) costs.push(landDiagram(room.from, room.to, !!room.at));
      for (const c of costs) {
        c.position.set(cx, uy + 146);
        content.addChild(c);
        cx += c.width + 30;
      }
      // next tier preview
      const pv = new Container();
      const pbg = new Graphics().circle(0, 0, 60).fill(mix(fx.main, C.paper, 0.7)).stroke({ width: 3, color: C.ink });
      if (grows) pv.scale.set(0.8);
      const nh = habitatHouse(h.element, next.tier).c;
      nh.scale.set(next.tier >= 9 ? 0.34 : next.tier >= 6 ? 0.42 : 0.5);
      nh.position.set(0, 38);
      const pm = new Graphics().circle(0, 0, 58).fill(0xffffff);
      nh.mask = pm;
      const pl = txt('ASÍ QUEDA', { fontFamily: F.bebas, fontSize: 18, fill: C.paper, letterSpacing: 1 });
      const plb = new Graphics().rect(-48, 50, 96, 24).fill(C.ink);
      pl.anchor.set(0.5, 0);
      pl.position.set(0, 52);
      pv.addChild(pbg, pm, nh, plb, pl);
      pv.position.set(m.innerW - (grows ? 316 : 334), uy + 96);
      content.addChild(pv);
      let reason: string | null = null;
      // room for the bigger yard: in place (any direction) or MOVER Y MEJORAR (or no land left)
      const noRoom = !upgradeBlocker(h) && !room.at;
      if (G.s.kl < next.kl) reason = `Necesitas Reino ${next.kl}`;
      else if ((G.s.crystals[h.element] ?? 0) < next.crystals) {
        // where they really come from: Parte 2 elements have no campaign zone (expeditions + casino)
        const parte2 = ['ice', 'light', 'shadow', 'sound', 'time', 'void', 'crystal'].includes(h.element);
        reason = `Faltan cristales de ${ELEMENT_NAME[h.element]?.toLowerCase()}: ${parte2 ? 'expediciones con un gato de ese elemento o el casino' : 'batallas de su zona y expediciones'}`;
      }
      else if (G.s.gold < next.cost) reason = `Te faltan ${fmt(next.cost - G.s.gold)} Doblones`;
      else if (buildersBusy() >= builders()) reason = 'Tus constructores están ocupados';
      if (noRoom) {
        const mvUp = new Button(room.elsewhere ? 'MOVER Y MEJORAR' : 'SIN TERRENO', () => {
          if (!room.elsewhere) {
            sfx('error');
            toast(`No hay ${room.to}×${room.to} libre en tu isla`, { sub: 'Limpia una expansión (Tienda › Edificios), o vende/mueve un hábitat o decoración.', color: C.paper });
            return;
          }
          m.close();
          if (!requestPlacement({ kind: 'habitat', element: h.element, moveId: hid, upgrade: true }, () => openHabitatPanel(hid))) toast('Ve a tu isla para moverlo', { color: C.paper });
        }, { w: 250, h: 70, size: room.elsewhere ? 26 : 30, color: room.elsewhere ? C.mint : C.paperDark });
        mvUp.position.set(m.innerW - 262, uy + 60);
        content.addChild(mvUp);
        const why = txt(
          room.elsewhere
            ? `No cabe aquí (${room.to}×${room.to}): ${(room.reason ?? '').replace(/ \(.*\)$/, '').toLowerCase()} alrededor. MOVER Y MEJORAR lo lleva al lugar libre más cercano.`
            : `No hay ${room.to}×${room.to} libre: limpia una expansión, o vende/mueve un hábitat o decoración.`,
          { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.red, wordWrap: true, wordWrapWidth: m.innerW - ux - 300, lineHeight: 17 },
        );
        why.position.set(ux + 20, uy + 180);
        content.addChild(why);
        if (!room.elsewhere) {
          const ex = new Button('EXPANSIONES', () => {
            m.close();
            void import('../shop/Shop').then((mm) => mm.openShop('edificios'));
          }, { w: 250, h: 46, size: 22, color: C.yellow });
          ex.position.set(m.innerW - 262, uy + 140);
          content.addChild(ex);
        }
        live = refreshLive;
        return;
      }
      if (!reason && room.to > room.from) {
        const grows = txt(`Su terreno crece a ${room.to}×${room.to} aquí mismo (se reserva durante la obra)`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.green });
        grows.position.set(ux + 20, uy + 190);
        content.addChild(grows);
      }
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
        toast(`¡Obra en marcha! ${next.name}`, { icon: 'clock', sub: `${fmtDuration(next.build_s * 1000)} · al terminar caben ${next.capacity} gatos · reloj verde (Ronroneo lo acelera)` });
        render();
      }, { w: 250, h: 70, size: 34, color: reason ? C.paperDark : C.pinkHot, textColor: reason ? C.ink : C.paper, disabled: !!reason });
      b.position.set(m.innerW - 262, uy + 60);
      content.addChild(b);
      if (reason) {
        const r = txt(reason, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.red });
        r.position.set(ux + 20, uy + 190);
        content.addChild(r);
      }
      live = refreshLive;
    }
  };
  render();
  // a cat of this habitat was fed / starred / renamed / moved in another panel on top: redraw now
  // (once per frame, however many bites a "hold to feed" chain fires)
  let dirty = false;
  const touch = (uid: string, force = false) => {
    const h = habitat(hid);
    if (!h || dirty || !(force || h.cats.includes(uid) || G.s.cats.some((c) => c.uid === uid && c.habitat === hid))) return;
    dirty = true;
    requestAnimationFrame(() => {
      dirty = false;
      if (!m.closed && !content.destroyed) render();
    });
  };
  m.listen(G.on('cat', (e) => (e.why === 'home' ? touch(habitat(hid)?.cats[0] ?? e.uid, true) : touch(e.uid))));
  m.listen(G.on('catAdded', (e) => e.cat && touch(e.cat.uid)));
  let acc = 0;
  const tick = (tk: Ticker) => {
    if (content.destroyed) {
      Ticker.shared.remove(tick);
      return;
    }
    clock += tk.deltaMS / 1000;
    if (!m.closed) for (const f of artTicks) f(clock);
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

/** tiny iso diagram of the land an upgrade needs: the yard now (filled) + the extra ring */
function landDiagram(from: number, to: number, fits: boolean): Container {
  const c = new Container();
  const t = 9; // half tile width (px)
  const P = (x: number, y: number) => ({ x: 14 + (x - y) * t + to * t, y: 2 + (x + y) * t * 0.5 });
  const g = new Graphics();
  const off = Math.floor((to - from) / 2);
  for (let y = 0; y < to; y++)
    for (let x = 0; x < to; x++) {
      const inner = x >= off && y >= off && x < off + from && y < off + from;
      const a = P(x, y);
      const b = P(x + 1, y);
      const cc = P(x + 1, y + 1);
      const d = P(x, y + 1);
      g.poly([a.x, a.y, b.x, b.y, cc.x, cc.y, d.x, d.y]).fill(inner ? C.paperDark : fits ? C.mint : 0xffb3b3).stroke({ width: 1.2, color: C.ink, alpha: inner ? 0.5 : 0.9 });
    }
  const l = txt(to > from ? `+${to * to - from * from} casillas` : `${to}×${to}`, { fontFamily: F.heavy, fontSize: 17, fill: fits ? C.ink : C.red });
  l.position.set(28 + to * t * 2, 4);
  const l2 = txt(fits ? 'TERRENO NUEVO' : 'NO CABE AQUÍ', { fontFamily: F.bebas, fontSize: 15, fill: C.ink, letterSpacing: 1 });
  l2.position.set(28 + to * t * 2, -12);
  c.addChild(g, l, l2);
  return c;
}

function dashedRect(g: Graphics, w: number, h: number) {
  const pts = [
    [0, 0, w, 0],
    [w, 0, w, h],
    [w, h, 0, h],
    [0, h, 0, 0],
  ];
  for (const [x0, y0, x1, y1] of pts) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let d = 0; d < len; d += 18) {
      const e = Math.min(len, d + 10);
      g.moveTo(x0 + ((x1 - x0) * d) / len, y0 + ((y1 - y0) * d) / len).lineTo(x0 + ((x1 - x0) * e) / len, y0 + ((y1 - y0) * e) / len);
    }
  }
  g.stroke({ width: 3, color: C.ink, alpha: 0.55 });
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export type { Habitat };
