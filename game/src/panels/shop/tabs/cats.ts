/** GATOS: adopt Commons of discovered elements you don't own yet (expensive on purpose; Resonance rules). */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { toast } from '../../../ui/modal';
import { sfx } from '../../../core/audio';
import { G } from '../../../state/game';
import { CatDef } from '../../../data/content';
import { ELEMENT_NAME } from '../../../data/elementsMeta';
import { catTexture, elementFx, preloadCats } from '../../../art/catArt';
import { applyCatTint, slugOf } from '../../../art/tint';
import { elementIcon } from '../../../ui/elementIcon';
import { buyCat, catOffers, catPrice, isNew, markSeen } from '../../../state/sys/shop';
import { mix } from '../../island/ui';
import type { ShopCtx } from '../ctx';
import { block, Btn, chip, dotCircle, fit, newSeal, para, Scroller, stamp, t } from '../ui';
import { buying, celebrate } from '../buy';

export function renderCats(ctx: ShopCtx) {
  const root = ctx.root;
  const offers = catOffers();
  const ids = offers.filter((o) => !o.owned).map((o) => `cat:${o.def.id}`);
  const fresh = new Set(ids.filter(isNew));
  markSeen(...ids);
  const price = catPrice();

  // ------------------------------------------------------------------ side poster (the Resonance is the real way)
  const sideW = 430;
  const side = new Container();
  side.position.set(ctx.w - sideW, 0);
  side.addChild(block(sideW, ctx.h - 6, C.plum, 8));
  const circ = dotCircle(150, C.orchid, C.lilac, 0.4);
  circ.position.set(sideW - 60, 150);
  const cm = new Graphics().rect(0, 0, sideW, ctx.h - 6).fill(0xffffff);
  circ.mask = cm;
  side.addChild(circ, cm);
  const st = t('¿RAROS?\n¿ÉPICOS?\n¿LEGENDARIOS?', 52, C.paper, F.poster, { lineHeight: 52 });
  st.position.set(24, 24);
  side.addChild(st);
  const sp = para('No se venden. Nacen en el Santuario de Resonancia cuando dos de tus gatos se juntan… y los Comunes también salen ahí (55% de las veces). La tienda solo adopta Comunes que te falten, a precio de capricho.', sideW - 48, 18, C.paper);
  sp.position.set(24, 210);
  side.addChild(sp);
  const sb = new Btn('IR AL SANTUARIO', () => {
    ctx.close();
    void import('../../Sanctuary').then((m) => m.openSanctuary());
  }, { w: sideW - 48, h: 64, color: C.mint, fg: C.ink, size: 30 });
  sb.position.set(24, ctx.h - 100);
  side.addChild(sb);
  const rule = para('Adoptar registra al gato en tu Catdex, pero NO da los Ojos de Gato de especie nueva: comprar no es descubrir.', sideW - 48, 15, C.lilac);
  rule.position.set(24, ctx.h - 110 - rule.height - 12);
  side.addChild(rule);
  root.addChild(side);

  // ------------------------------------------------------------------ adoption cards
  const areaW = ctx.w - sideW - 30;
  const area = new Scroller(areaW - 14, ctx.h);
  root.addChild(area);
  const cols = 4;
  const gap = 20;
  const cw = Math.floor((areaW - 14 - gap * (cols - 1)) / cols);
  const ch = 380;
  const sprites: Sprite[] = [];
  const slugs = [...new Set(offers.map((o) => slugOf(o.def.id)))];
  const holders: { h: Container; def: CatDef }[] = [];
  offers.forEach((o, i) => {
    const def = o.def;
    const fx = elementFx(def.elements[0]);
    const card = new Container();
    const face = new Container();
    card.addChild(face);
    card.position.set((i % cols) * (cw + gap), Math.floor(i / cols) * (ch + gap) + 8);
    face.addChild(block(cw, ch, mix(fx.main, C.paper, 0.78), 7, 3));
    const win = new Graphics().rect(12, 12, cw - 24, 200).fill(mix(fx.main, C.paper, 0.5)).stroke({ width: 3, color: C.ink });
    face.addChild(win);
    const holder = new Container();
    face.addChild(holder);
    holders.push({ h: holder, def });
    const badge = elementIcon(def.elements[0], 34);
    badge.position.set(32, 32);
    face.addChild(badge);
    const nm = t(def.name.toUpperCase(), 28, C.ink, F.poster);
    nm.position.set(14, 220);
    fit(nm, cw - 28);
    const ep = t(def.epithet, 15, C.inkBlue, F.serif, { fontStyle: 'italic' });
    ep.position.set(14, 256);
    fit(ep, cw - 28);
    face.addChild(nm, ep);
    const el = chip(`COMÚN · ${ELEMENT_NAME[def.elements[0]] ?? def.elements[0]}`, C.paper, C.ink, 15);
    el.position.set(14, 282);
    face.addChild(el);
    if (o.owned) {
      const s = stamp('ADOPTADO', C.green, 30, -0.14);
      s.position.set(cw / 2, 120);
      face.addChild(s);
      const b = new Btn('YA ES TUYO', () => undefined, { w: cw - 28, h: 54, color: C.paperDark, fg: C.ink, size: 24, disabled: true });
      b.position.set(14, ch - 68);
      face.addChild(b);
    } else {
      const b = new Btn('ADOPTAR', (bb) => {
        if (buying()) return;
        const c = buyCat(def.id);
        if (!c) {
          sfx('error');
          toast('Te faltan Doblones', { sub: 'Adoptar en tienda es caro a propósito: la Resonancia es gratis.', color: C.paper });
          return;
        }
        bb.disabled = true;
        celebrate(ctx, holder, 'gold', price, `Adopción ${def.name}`, () => {
          sfx('meow');
          if (!c.habitat) toast(`${def.name} no tiene casa todavía`, { sub: `Construye un hábitat de ${(ELEMENT_NAME[def.elements[0]] ?? '').toLowerCase()} (Tienda › Hábitats).`, color: C.yellow });
          else toast(`¡${def.name} se mudó a su hábitat!`, { sub: 'Ya está produciendo oro.', icon: 'paw', color: C.mint });
          ctx.refresh();
        }, { word: '¡MIAU!', stamp: '¡ADOPTADO!' });
      }, { w: cw - 28, h: 58, color: C.orange, fg: C.ink, size: 28, price: { cur: 'gold', v: price, ok: G.s.gold >= price } });
      b.position.set(14, ch - 72);
      face.addChild(b);
      if (fresh.has(`cat:${def.id}`)) {
        const seal = newSeal(30);
        seal.position.set(cw - 26, 26);
        face.addChild(seal);
      }
    }
    card.eventMode = 'static';
    card.on('pointerover', () => gsap.to(face, { y: -5, duration: 0.1 }));
    card.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.12 }));
    area.content.addChild(card);
    gsap.from(face, { alpha: 0, y: 30, duration: 0.25, delay: 0.04 * i, ease: 'back.out(1.6)' });
  });
  area.setContentHeight(Math.ceil(offers.length / cols) * (ch + gap) + 20);
  void preloadCats(slugs).then(() => {
    for (const { h, def } of holders) {
      if (h.destroyed) continue;
      const s = new Sprite(catTexture(slugOf(def.id)));
      s.anchor.set(0.5, 0.95);
      s.scale.set(Math.min(170 / Math.max(1, s.texture.height), (cw - 40) / Math.max(1, s.texture.width)));
      applyCatTint(s, def.id);
      s.position.set(cw / 2, 206);
      const m = new Graphics().rect(14, 14, cw - 28, 196).fill(0xffffff);
      s.mask = m;
      h.addChild(m, s);
      sprites.push(s);
    }
  });
  let time = 0;
  const tick = (tk: Ticker) => {
    time += tk.deltaMS / 1000;
    const k = Math.floor(time * 12) / 12;
    sprites.forEach((s, i) => {
      if (s.destroyed) return;
      s.scale.y = s.scale.x * (1 + Math.sin(k * 3 + i) * 0.015);
    });
  };
  Ticker.shared.add(tick);
  return () => Ticker.shared.remove(tick);
}
