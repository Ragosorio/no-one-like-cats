/** Build a habitat on an empty plot: pick one of the discovered elements. */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { G } from '../../state/game';
import { habitatTier } from '../../state/econ';
import { nextHabitatCost } from '../../state/sys/island';
import { buildBlocker, buildHabitatAt, homelessFor } from '../../state/ext/island';
import { ELEMENT_ICON, ELEMENT_NAME } from '../../data/elementsMeta';
import { elementFx } from '../../art/catArt';
import { fmt, fmtDuration } from '../../core/format';
import { sfx } from '../../core/audio';
import { catPortrait, mix, wrapText } from './ui';
import { habitatHouse } from '../../island/buildingArt';

export function openBuildMenu(region: string, plot: number) {
  const els = G.s.elements;
  const cols = Math.min(4, Math.max(3, els.length));
  const cardW = 300;
  const w = Math.max(1100, cols * (cardW + 24) + 56 + 10);
  const rows = Math.ceil(els.length / cols);
  const h = 250 + rows * 430;
  const cost = nextHabitatCost();
  const m = new Modal('Construir hábitat', w, Math.min(1000, h), { subtitle: `Caja de Cartón · obra ${fmtDuration(habitatTier(1).build_s * 1000)}` });
  const blocker = buildBlocker();
  // intro line
  const intro = wrapText('Un gato solo vive en un hábitat de uno de sus elementos. Gato sin casa = gato que no produce (y que te mira feo).', m.innerW - 330, 19);
  m.body.addChild(intro);
  const ct = new Container();
  const cbg = new Graphics().rect(6, 6, 300, 58).fill(C.ink).rect(0, 0, 300, 58).fill(G.s.gold >= cost ? C.yellow : C.paperDark).stroke({ width: 3, color: C.ink });
  const cl = txt('COSTO', { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 2 });
  cl.position.set(14, 16);
  const ci = icon('gold', 36);
  ci.position.set(110, 29);
  const cv = txt(fmt(cost), { fontFamily: F.heavy, fontSize: 30, fill: G.s.gold >= cost ? C.ink : C.red });
  cv.position.set(134, 9);
  ct.addChild(cbg, cl, ci, cv);
  ct.position.set(m.innerW - 306, -6);
  m.body.addChild(ct);
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
    const em = txt(ELEMENT_ICON[el] ?? '', { fontSize: 34 });
    em.position.set(12, 10);
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
    const btn = new Graphics().rect(5, 5, cardW - 24, 62).fill(C.ink).rect(0, 0, cardW - 24, 62).fill(blocker ? C.paperDark : C.pinkHot).stroke({ width: 3, color: C.ink });
    btn.position.set(12, ch - 82);
    const bt = txt('CONSTRUIR', { fontFamily: F.poster, fontSize: 34, fill: blocker ? C.ink : C.paper });
    bt.anchor.set(0.5);
    bt.position.set(cardW / 2, ch - 51);
    face.addChild(btn, bt);
    card.addChild(face);
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    card.position.set(cx * (cardW + 24), 92 + cy * (ch + 26));
    card.eventMode = 'static';
    card.cursor = blocker ? 'not-allowed' : 'pointer';
    card.on('pointerover', () => gsap.to(face, { y: -6, duration: 0.12 }));
    card.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.15 }));
    card.on('pointertap', () => {
      const b = buildBlocker();
      if (b) {
        sfx('error');
        gsap.fromTo(face, { x: -8 }, { x: 0, duration: 0.35, ease: 'elastic.out(1,0.3)' });
        toast(b, { color: C.paper });
        return;
      }
      const hab = buildHabitatAt(el, region, plot);
      if (!hab) {
        sfx('error');
        return;
      }
      sfx('whoosh');
      sfx('coin', 0.7);
      toast(`¡A construir! Hábitat de ${ELEMENT_NAME[el]}`, { sub: 'Los gatos se mudan solos al terminar la obra.', icon: 'clock' });
      m.close();
    });
    m.body.addChild(card);
  });
  m.open();
  return m;
}
