/** ORBES: Soul Orbs for species you own (gold: steep, growing · gems: shares the Prisma cap) + Prisma. */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { toast } from '../../../ui/modal';
import { icon } from '../../../ui/icons';
import { sfx } from '../../../core/audio';
import { fmt } from '../../../core/format';
import { G } from '../../../state/game';
import { BAL } from '../../../state/econ';
import { catDef } from '../../../data/content';
import { elementFx } from '../../../art/catArt';
import { glowTexture } from '../../../art/textures';
import { buyPrisma, prismaPrice, prismaShopLeft, starMax } from '../../../state/sys/cats';
import { ORB_PACK, ORB_PACK_GEMS, buyOrbsGems, buyOrbsGold, isNew, markSeen, orbGemsLeft, orbOffer, orbSpecies } from '../../../state/sys/shop';
import { catPortrait, mix } from '../../island/ui';
import type { ShopCtx } from '../ctx';
import { block, Btn, chip, fit, newSeal, para, Scroller, t } from '../ui';
import { buying, celebrate } from '../buy';

export function renderOrbs(ctx: ShopCtx) {
  const root = ctx.root;
  const species = orbSpecies();
  const ids = species.map((s) => `orb:${s}`);
  const fresh = new Set(ids.filter(isNew));
  markSeen(...ids);

  // ------------------------------------------------------------------ header strip: rules + prisma
  const head = new Container();
  head.addChild(block(ctx.w, 150, C.lilac, 6, 4));
  const ht = t('ORBES DE ALMA', 54, C.ink, F.poster);
  ht.position.set(22, 4);
  const hp = para(
    `Uno por especie: suben estrellas en el Altar. Con oro son una comodidad CARA (sube +${Math.round(15)}% por orbe comprado de esa especie); con gemas, paquetes de ${ORB_PACK} por ${ORB_PACK_GEMS} que comparten el tope de compras de la Prisma (${BAL.orbs.prisma_gem_purchases_per_boss} por jefe derrotado). Lo normal sigue siendo jugar: duplicados, victorias, jefes y expediciones.`,
    880,
    16,
  );
  hp.position.set(24, 70);
  head.addChild(ht, hp);
  // prisma window
  const pw = new Container();
  pw.addChild(block(520, 118, C.paper, 6, 3));
  const gl = new Sprite(glowTexture());
  gl.anchor.set(0.5);
  gl.tint = C.cyan;
  gl.alpha = 0.6;
  gl.scale.set(0.9);
  gl.blendMode = 'add';
  gl.position.set(62, 59);
  const prism = new Graphics();
  const rainbow = [C.pinkHot, C.yellow, C.mint, C.cyan, C.violet];
  rainbow.forEach((col, i) => prism.arc(62, 59, 34, -Math.PI / 2 + (i * Math.PI * 2) / 5, -Math.PI / 2 + ((i + 1) * Math.PI * 2) / 5).lineTo(62, 59).fill(col));
  prism.circle(62, 59, 34).stroke({ width: 3, color: C.ink });
  prism.circle(52, 48, 9).fill({ color: 0xffffff, alpha: 0.6 });
  pw.addChild(gl, prism);
  const pt = t('ORBE PRISMA', 30, C.ink, F.poster);
  pt.position.set(112, 6);
  const pd = t(`Comodín: 1 Prisma = 1 orbe de CUALQUIER gato · tienes ${G.s.prisma}`, 14, C.ink);
  fit(pd, 390);
  pd.position.set(114, 46);
  pw.addChild(pt, pd);
  const left = prismaShopLeft();
  const pb = new Btn(left > 0 ? '+1 PRISMA' : 'TOPE ALCANZADO', (b) => {
    if (buying()) return;
    if (buyPrisma(1) <= 0) {
      sfx('error');
      toast(G.s.gems < prismaPrice() ? 'Te faltan Ojos de Gato' : 'Tope de compras con gemas', { sub: 'Derrota al siguiente jefe para comprar más.', color: C.paper });
      return;
    }
    b.disabled = true;
    celebrate(ctx, prism, 'gems', prismaPrice(), 'Orbe Prisma', () => ctx.refresh());
  }, { w: 380, h: 50, color: C.violet, fg: C.paper, size: 24, price: left > 0 ? { cur: 'gems', v: prismaPrice(), ok: G.s.gems >= prismaPrice() } : undefined, disabled: left <= 0 });
  pb.position.set(114, 66);
  pw.addChild(pb);
  const lt = chip(`QUEDAN ${orbGemsLeft()} CON GEMAS`, C.ink, C.paper, 15);
  lt.position.set(520 - lt.width - 10, -14);
  pw.addChild(lt);
  pw.position.set(ctx.w - 540, 16);
  head.addChild(pw);
  root.addChild(head);

  // ------------------------------------------------------------------ species
  const top = 172;
  const area = new Scroller(ctx.w - 16, ctx.h - top);
  area.position.set(0, top);
  root.addChild(area);
  if (!species.length) {
    const e = para('Aún no tienes gatos. (¿Cómo llegaste aquí?)', 600, 20);
    area.content.addChild(e);
  }
  const cols = 4;
  const gap = 22;
  const cw = Math.floor((ctx.w - 16 - gap * (cols - 1)) / cols);
  const ch = 270;
  const orbsG: { g: Container; base: number }[] = [];
  species.forEach((sp, i) => {
    const def = catDef(sp);
    const fx = elementFx(def.elements[0]);
    const o = orbOffer(sp);
    const best = G.s.cats.filter((c) => c.species === sp).sort((a, b) => b.stars - a.stars)[0];
    const card = new Container();
    const face = new Container();
    card.addChild(face);
    card.position.set((i % cols) * (cw + gap), Math.floor(i / cols) * (ch + gap) + 8);
    face.addChild(block(cw, ch, mix(fx.main, C.paper, 0.82), 6, 3));
    const por = catPortrait(best, 130, { name: false });
    por.position.set(14, 14);
    face.addChild(por);
    const nm = t(def.name.toUpperCase(), 26, C.ink, F.poster);
    nm.position.set(160, 10);
    fit(nm, cw - 176);
    face.addChild(nm);
    // stars
    for (let s = 0; s < starMax(); s++) {
      const st = icon('star', 22, s < best.stars ? C.yellow : C.paperDark);
      st.position.set(172 + s * 26, 58);
      face.addChild(st);
    }
    // orb + bar
    const orb = icon('orb', 34, fx.main);
    orb.position.set(176, 100);
    face.addChild(orb);
    orbsG.push({ g: orb, base: 100 });
    const need = o.need;
    const bw = cw - 222;
    const bar = new Graphics();
    bar.rect(4, 4, bw, 20).fill(C.ink).rect(0, 0, bw, 20).fill(C.paperDark).stroke({ width: 2.5, color: C.ink, alignment: 1 });
    if (need) bar.rect(0, 0, bw * Math.min(1, o.have / need), 20).fill(fx.main === 0xffffff ? C.violet : fx.main);
    bar.position.set(200, 90);
    face.addChild(bar);
    const bl = t(need ? `${o.have}/${need} para ${best.stars + 1} estrellas` : `${o.have} · ESTRELLAS AL MÁXIMO`, 15, C.ink);
    bl.position.set(200, 114);
    fit(bl, bw);
    face.addChild(bl);
    if (need && o.have >= need) {
      const rd = chip('¡LISTO PARA EL ALTAR!', C.green, C.paper, 14);
      rd.position.set(160, 138);
      face.addChild(rd);
    }
    // buttons
    const bww = Math.floor((cw - 40) / 2);
    const goldOk = G.s.gold >= o.gold;
    const bg = new Btn(`+${ORB_PACK}`, (b) => {
      if (buying()) return;
      const before = o.gold;
      if (!buyOrbsGold(sp)) {
        sfx('error');
        toast('Te faltan Doblones', { sub: `${ORB_PACK} orbes de ${def.name} cuestan ${fmt(before)}.`, color: C.paper });
        return;
      }
      b.disabled = true;
      celebrate(ctx, orb, 'gold', before, `${ORB_PACK} orbes ${def.name}`, () => ctx.refresh(), { stamp: `+${ORB_PACK} ORBES` });
    }, { w: bww, h: 56, color: C.yellow, fg: C.ink, size: 26, price: { cur: 'gold', v: o.gold, ok: goldOk } });
    bg.position.set(14, ch - 74);
    const gemOk = G.s.gems >= ORB_PACK_GEMS && o.gemsLeft >= ORB_PACK;
    const bgm = new Btn(`+${ORB_PACK}`, (b) => {
      if (buying()) return;
      if (!buyOrbsGems(sp)) {
        sfx('error');
        toast(o.gemsLeft < ORB_PACK ? 'Tope de compras con gemas' : 'Te faltan Ojos de Gato', { sub: o.gemsLeft < ORB_PACK ? 'Comparte tope con la Prisma: derrota al siguiente jefe.' : 'Las gemas se ganan jugando.', color: C.paper });
        return;
      }
      b.disabled = true;
      celebrate(ctx, orb, 'gems', ORB_PACK_GEMS, `${ORB_PACK} orbes ${def.name}`, () => ctx.refresh(), { stamp: `+${ORB_PACK} ORBES` });
    }, { w: bww, h: 56, color: C.violet, fg: C.paper, size: 26, price: { cur: 'gems', v: ORB_PACK_GEMS, ok: gemOk }, disabled: o.gemsLeft < ORB_PACK });
    bgm.position.set(26 + bww, ch - 74);
    face.addChild(bg, bgm);
    if (!need) {
      bg.disabled = true;
      bgm.disabled = true;
    }
    if (fresh.has(`orb:${sp}`)) {
      const seal = newSeal(28);
      seal.position.set(cw - 24, 22);
      face.addChild(seal);
    }
    card.eventMode = 'static';
    card.on('pointerover', () => gsap.to(face, { y: -5, duration: 0.1 }));
    card.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.12 }));
    area.content.addChild(card);
    gsap.from(face, { alpha: 0, y: 30, duration: 0.25, delay: Math.min(0.5, 0.03 * i), ease: 'back.out(1.6)' });
  });
  area.setContentHeight(Math.ceil(species.length / cols) * (ch + gap) + 20);
  let time = 0;
  const tick = (tk: Ticker) => {
    time += tk.deltaMS / 1000;
    orbsG.forEach((o, i) => (o.g.y = o.base + Math.sin(time * 2.2 + i) * 3));
    prism.rotation = 0;
    gl.alpha = 0.5 + Math.sin(time * 2) * 0.15;
  };
  Ticker.shared.add(tick);
  return () => Ticker.shared.remove(tick);
}
