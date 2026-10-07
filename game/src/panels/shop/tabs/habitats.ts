/**
 * HÁBITATS: one window per discovered element. Buying = island placement mode (put it anywhere it
 * fits, Dragon City style). Each window shows its own price: the more habitats you own (and the more
 * of that element), the more the next one costs — but there's no fixed number of plots.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { toast } from '../../../ui/modal';
import { elementIcon } from '../../../ui/elementIcon';
import { fmt, fmtDuration } from '../../../core/format';
import { sfx } from '../../../core/audio';
import { G } from '../../../state/game';
import { BAL } from '../../../state/econ';
import { catDef } from '../../../data/content';
import { ELEMENT_NAME } from '../../../data/elementsMeta';
import { elementFx } from '../../../art/catArt';
import { habitatHouse } from '../../../island/buildingArt';
import { builders, buildersBusy } from '../../../state/sys/island';
import { buildBlocker, buildHabitatAt, homelessFor } from '../../../state/ext/island';
import { catGold } from '../../../state/sys/cats';
import { freePlotCount, habitatPreviewRate, habitatPrice, isNew, markSeen, nextExpansion } from '../../../state/sys/shop';
import { islandDecorMounted, requestPlacement } from '../../../island/decor/DecorLayer';
import { catPortrait, mix } from '../../island/ui';
import type { ShopCtx } from '../ctx';
import { block, Btn, chip, fit, halftoneRect, newSeal, para, Scroller, t } from '../ui';

const LIGHT = [0xffe14a, 0xa7e8d7, 0xc6f0e4, 0xfff3b0, 0xffffff, 0xb7a4c7, 0xff7ab8, 0xd4f27a, 0x00e5ff];

export function renderHabitats(ctx: ShopCtx) {
  const root = ctx.root;
  const els = G.s.elements;
  const ids = els.map((e) => `hab:${e}`);
  const fresh = new Set(ids.filter(isNew));
  markSeen(...ids);

  // ------------------------------------------------------------------ space strip
  const free = freePlotCount();
  const owned = G.s.habitats.length;
  const strip = new Container();
  strip.addChild(block(ctx.w, 118, C.paper, 6, 4));
  const big = t(`${owned}`, 92, C.ink, F.poster);
  big.position.set(22, -6);
  const lbl = t(owned === 1 ? 'HÁBITAT' : 'HÁBITATS', 26, C.ink, F.bebas, { letterSpacing: 2 });
  lbl.position.set(32 + big.width, 18);
  const sub = t(`${free ? `caben ~${free} más en tu terreno` : 'tu terreno está lleno'} · ${builders() - buildersBusy()}/${builders()} constructores libres`, 17, free ? C.ink : C.red);
  sub.position.set(34 + big.width, 56);
  strip.addChild(big, lbl, sub);
  const rule = para('Colócalos donde quieras: tócalos en la isla para MOVER o VENDER. Un gato solo vive en un hábitat de uno de SUS elementos. Cada hábitat extra cuesta más (y más si repites elemento).', 600, 16);
  rule.position.set(Math.max(sub.x + sub.width + 30, 560), 14);
  strip.addChild(rule);
  const nx = nextExpansion();
  if (nx) {
    const e = nx.e;
    const label = nx.st === 'locked' ? `MÁS TERRENO: ${e.name.toUpperCase()} (REINO ${e.balance.kl})` : `MÁS TERRENO: ${e.name.toUpperCase()}`;
    const b = new Btn(nx.st === 'clearing' ? 'LIMPIANDO…' : 'EXPANSIÓN', () => {
      ctx.close();
      void import('../../island/ExpansionPanel').then((m) => m.openExpansionPanel(e.n));
      void import('../../../island/hooks').then((h) => h.islandHooks.focusRegion?.(e.n));
    }, { w: 270, h: 58, color: free ? C.paper : C.pinkHot, fg: free ? C.ink : C.paper, size: 26 });
    b.position.set(ctx.w - 296, 18);
    const bl = t(label, 13, C.ink, F.ui);
    fit(bl, 270);
    bl.position.set(ctx.w - 296, 86);
    strip.addChild(b, bl);
  }
  root.addChild(strip);

  // ------------------------------------------------------------------ element windows
  const top = 140;
  const area = new Scroller(ctx.w - 16, ctx.h - top);
  area.position.set(0, top);
  root.addChild(area);
  const perRow = els.length <= 4 ? Math.max(3, els.length) : 4;
  const gap = 24;
  const cw = Math.floor((ctx.w - 16 - gap * (perRow - 1)) / perRow);
  const ch = Math.min(ctx.h - top - 18, 600);
  const t1 = BAL.habitats.tiers[0];
  const tickers: Container[] = [];
  els.forEach((el, i) => {
    const price = habitatPrice(el);
    const blocker = buildBlocker(el);
    const fx = elementFx(el);
    const light = LIGHT.includes(fx.main);
    const card = new Container();
    const face = new Container();
    card.addChild(face);
    card.position.set((i % perRow) * (cw + gap), Math.floor(i / perRow) * (ch + gap));
    face.addChild(block(cw, ch, mix(fx.main, C.paper, 0.8), 8));
    const head = new Graphics().rect(0, 0, cw, 70).fill(fx.main).stroke({ width: 4, color: C.ink, alignment: 1 });
    const badge = elementIcon(el, 46);
    badge.position.set(36, 35);
    const nm = t(ELEMENT_NAME[el] ?? el.toUpperCase(), 44, light ? C.ink : C.paper, F.poster);
    nm.position.set(66, 4);
    fit(nm, cw - 90);
    face.addChild(head, badge, nm);
    // the house on a halftone floor
    const floor = halftoneRect(cw - 40, 150, fx.dark, 10, 2.2, 0.25);
    floor.position.set(20, 90);
    face.addChild(floor);
    const house = habitatHouse(el, 1).c;
    house.position.set(cw / 2, 205);
    house.scale.set(1.35);
    face.addChild(house);
    tickers.push(house);
    const owned = G.s.habitats.filter((h) => h.element === el).length;
    if (owned) {
      const oc = chip(`TIENES ${owned}`, C.paper, C.ink, 18);
      oc.position.set(cw - oc.width - 14, 84);
      face.addChild(oc);
    }
    // stats
    let y = 262;
    const tn = t(t1.name.toUpperCase(), 26, C.ink, F.poster);
    tn.position.set(18, y);
    face.addChild(tn);
    y += 40;
    const chips = [`CAP. ${t1.capacity} GATOS`, `×${t1.mult.toFixed(1)} ORO`, `BÚFER ${t1.buffer_min} MIN`, `OBRA ${fmtDuration(t1.build_s * 1000)}`];
    let cx = 18;
    let cy = y;
    for (const s of chips) {
      const c = chip(s, C.paper, C.ink, 16);
      if (cx + c.width > cw - 14) {
        cx = 18;
        cy += 32;
      }
      c.position.set(cx, cy);
      cx += c.width + 6;
      face.addChild(c);
    }
    y = cy + 40;
    // who would live here
    const homeless = homelessFor(el);
    if (homeless.length) {
      const rate = habitatPreviewRate(el, homeless.map((c) => catGold(c)));
      const pr = t(`+${fmt(rate)}/s con tus gatos sin casa`, 17, C.ink);
      pr.position.set(18, y);
      face.addChild(pr);
      homeless.slice(0, 3).forEach((c, k) => {
        const p = catPortrait(c, 62, { name: false });
        p.position.set(18 + k * 72, y + 28);
        face.addChild(p);
      });
      const alarm = chip('¡NECESITAN CASA!', C.red, C.paper, 16);
      alarm.position.set(Math.min(cw - alarm.width - 12, 18 + Math.min(3, homeless.length) * 72 + 6), y + 50);
      face.addChild(alarm);
    } else {
      const n = G.s.cats.filter((c) => catDef(c.species).elements.includes(el)).length;
      const msg = n
        ? `Tus ${n} gato(s) de ${(ELEMENT_NAME[el] ?? el).toLowerCase()} ya tienen casa. Otro hábitat = espacio para los que vengan de la Resonancia.`
        : `Aún no tienes gatos de ${(ELEMENT_NAME[el] ?? el).toLowerCase()}. Prepárales la casa antes de que lleguen.`;
      const p = para(msg, cw - 36, 15);
      p.position.set(18, y);
      face.addChild(p);
    }
    // where + button
    const where = para(free ? 'Lo pones donde quieras de tu isla (se puede mover después).' : 'Ya no cabe: mueve o vende uno, o compra una expansión.', cw - 36, 14, free ? C.ink : C.red);
    where.position.set(18, ch - 118);
    face.addChild(where);
    const btn = new Btn(free ? 'COLOCAR' : 'SIN ESPACIO', () => place(ctx, el), {
      w: cw - 36,
      h: 62,
      color: free ? C.pinkHot : C.paperDark,
      fg: free ? C.paper : C.ink,
      price: { cur: 'gold', v: price, ok: G.s.gold >= price },
      disabled: !!blocker,
    });
    btn.position.set(18, ch - 78);
    face.addChild(btn);
    if (fresh.has(`hab:${el}`)) {
      const seal = newSeal(40);
      seal.position.set(cw - 30, 20);
      face.addChild(seal);
    }
    card.eventMode = 'static';
    card.on('pointerover', () => gsap.to(face, { y: -6, duration: 0.12 }));
    card.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.15 }));
    area.content.addChild(card);
    gsap.from(face, { y: 40, alpha: 0, duration: 0.3, delay: 0.05 * i, ease: 'back.out(1.6)' });
  });
  area.setContentHeight(Math.ceil(els.length / perRow) * (ch + gap));
  let time = 0;
  const tick = (tk: Ticker) => {
    time += tk.deltaMS / 1000;
    const k = Math.floor(time * 12) / 12;
    tickers.forEach((h, i) => (h.y = 205 + Math.sin(k * 2 + i) * 4));
  };
  Ticker.shared.add(tick);
  return () => Ticker.shared.remove(tick);
}

function place(ctx: ShopCtx, el: string) {
  const blocker = buildBlocker(el);
  if (blocker) {
    sfx('error');
    toast(blocker, { color: C.paper });
    return;
  }
  if (islandDecorMounted()) {
    ctx.close();
    requestPlacement({ kind: 'habitat', element: el }, () => void import('../Shop').then((m) => m.openShop('habitats')));
    return;
  }
  // not on the island (e.g. opened from the map): build on the free spot nearest to the home center
  const h = buildHabitatAt(el);
  if (!h) {
    sfx('error');
    return;
  }
  sfx('coin');
  toast(`¡Hábitat de ${(ELEMENT_NAME[el] ?? el).toLowerCase()} en obra!`, { sub: 'Quedó cerca del centro de tu isla. Tócalo allá para moverlo.', icon: 'clock' });
  ctx.refresh();
}
