/**
 * Buy a habitat: pick one of the discovered elements (each shows its own price — copies of the same
 * element cost more), then place it anywhere it fits on the island (placement mode).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { G } from '../../state/game';
import { habitatTier } from '../../state/econ';
import { habitatCost } from '../../state/sys/island';
import { buildBlocker, buildHabitatAt, homelessFor } from '../../state/ext/island';
import { islandDecorMounted, requestPlacement } from '../../island/decor/DecorLayer';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementIcon } from '../../ui/elementIcon';
import { elementFx } from '../../art/catArt';
import { fmt, fmtDuration } from '../../core/format';
import { sfx } from '../../core/audio';
import { catPortrait, mix, wrapText } from './ui';
import { habitatHouse } from '../../island/buildingArt';

export function openBuildMenu() {
  const els = G.s.elements;
  const cols = Math.min(4, Math.max(3, els.length));
  const cardW = 300;
  const w = Math.max(1100, cols * (cardW + 24) + 56 + 10);
  const rows = Math.ceil(els.length / cols);
  const h = 250 + rows * 430;
  const m = new Modal('Construir hábitat', w, Math.min(1000, h), { subtitle: `Caja de Cartón · ${habitatTier(1).capacity} gatos · obra ${fmtDuration(habitatTier(1).build_s * 1000)}` });
  const blocker = buildBlocker();
  // intro line
  const intro = wrapText('Un gato solo vive en un hábitat de uno de sus elementos. Elige uno y colócalo donde quepa en tu isla. Cada hábitat extra cuesta más (y más si repites elemento).', m.innerW - 40, 19);
  m.body.addChild(intro);
  if (blocker) {
    const b = txt(blocker, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.red });
    b.position.set(0, intro.height + 8);
    m.body.addChild(b);
  }
  els.forEach((el, i) => {
    const fx = elementFx(el);
    const card = new Container();
    const face = new Container();
    const ch = 400;
    const bg = new Graphics();
    bg.rect(8, 8, cardW, ch).fill(C.ink);
    bg.rect(0, 0, cardW, ch).fill(mix(fx.main, C.paper, 0.78)).stroke({ width: 4, color: C.ink, alignment: 1 });
    bg.rect(0, 0, cardW, 64).fill(fx.main).stroke({ width: 4, color: C.ink, alignment: 1 });
    const em = elementIcon(el, 44);
    em.position.set(34, 32);
    const nm = txt(ELEMENT_NAME[el] ?? el, { fontFamily: F.poster, fontSize: 38, fill: [0xffe14a, 0xa7e8d7, 0xc6f0e4, 0xfff3b0].includes(fx.main) ? C.ink : C.paper });
    nm.position.set(60, 4);
    face.addChild(bg, em, nm);
    // the little box it will be
    const house = habitatHouse(el, 1).c;
    house.position.set(cardW / 2, 190);
    house.scale.set(1.15);
    face.addChild(house);
    const homeless = homelessFor(el);
    if (homeless.length) {
      const tag = new Graphics().rect(0, 0, cardW - 24, 36).fill(C.red).stroke({ width: 3, color: C.ink });
      tag.position.set(12, 222);
      const tt = txt(`¡${homeless.map((c) => c.name).join(', ')} necesita casa!`, { fontFamily: F.bebas, fontSize: 22, fill: C.paper, letterSpacing: 1 });
      tt.position.set(22, 227);
      if (tt.width > cardW - 44) tt.scale.set((cardW - 44) / tt.width);
      face.addChild(tag, tt);
      homeless.slice(0, 2).forEach((c, k) => {
        const p = catPortrait(c, 74, { name: false });
        p.position.set(cardW - 92 - k * 84, 78);
        face.addChild(p);
      });
    } else {
      const n = G.s.cats.filter((c) => c.habitat && G.s.habitats.find((h) => h.id === c.habitat)?.element === el).length;
      const tt = txt(n ? `${n} gato(s) de ${ELEMENT_NAME[el]?.toLowerCase()} ya tienen casa` : 'Aún no tienes gatos de este elemento', { fontFamily: F.ui, fontSize: 15, fill: C.ink, wordWrap: true, wordWrapWidth: cardW - 30 });
      tt.position.set(14, 228);
      face.addChild(tt);
    }
    const cost = habitatCost(el);
    const blk = buildBlocker(el);
    const pr = new Container();
    const pi = icon('gold', 30);
    pi.position.set(15, 15);
    const pv = txt(fmt(cost), { fontFamily: F.heavy, fontSize: 26, fill: G.s.gold >= cost ? C.ink : C.red });
    pv.position.set(34, 0);
    pr.addChild(pi, pv);
    pr.position.set(cardW / 2 - pr.width / 2, ch - 124);
    const btn = new Graphics().rect(5, 5, cardW - 24, 62).fill(C.ink).rect(0, 0, cardW - 24, 62).fill(blk ? C.paperDark : C.pinkHot).stroke({ width: 3, color: C.ink });
    btn.position.set(12, ch - 82);
    const bt = txt('COLOCAR', { fontFamily: F.poster, fontSize: 34, fill: blk ? C.ink : C.paper });
    bt.anchor.set(0.5);
    bt.position.set(cardW / 2, ch - 51);
    face.addChild(pr, btn, bt);
    card.addChild(face);
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    card.position.set(cx * (cardW + 24), 92 + cy * (ch + 26));
    card.eventMode = 'static';
    card.cursor = blk ? 'not-allowed' : 'pointer';
    card.on('pointerover', () => gsap.to(face, { y: -6, duration: 0.12 }));
    card.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.15 }));
    card.on('pointertap', () => {
      const b = buildBlocker(el);
      if (b) {
        sfx('error');
        gsap.fromTo(face, { x: -8 }, { x: 0, duration: 0.35, ease: 'elastic.out(1,0.3)' });
        toast(b, { color: C.paper });
        return;
      }
      m.close();
      // on the island: you choose where it goes; elsewhere: nearest free spot to the home center
      if (islandDecorMounted() && requestPlacement({ kind: 'habitat', element: el })) return;
      const hab = buildHabitatAt(el);
      if (!hab) {
        sfx('error');
        return;
      }
      sfx('whoosh');
      sfx('coin', 0.7);
      toast(`¡A construir! Hábitat de ${ELEMENT_NAME[el]}`, { sub: 'Los gatos se mudan solos al terminar la obra.', icon: 'clock' });
    });
    m.body.addChild(card);
  });
  m.open();
  return m;
}
