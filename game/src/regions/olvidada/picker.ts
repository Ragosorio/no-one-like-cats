/**
 * «¿Quién la levanta?» — choose one of your cats to raise a ruin (H60). Your cats of the ruin's element first
 * (state/sys/olvidada.ts repairersFor); a cat who already raised one rests. Resolves the cat's uid, or null when
 * the card is closed.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../../ui/modal';
import { txt } from '../../ui/widgets';
import { fitLine } from '../../ui/fit';
import { C, F } from '../../ui/theme';
import { sfx } from '../../core/audio';
import { catPortrait, ensureCats } from '../../panels/campaign/common';
import { catSlug } from '../../state/sys/forms';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import type { OwnedCat } from '../../state/game';

export async function pickRepairer(o: { title: string; element: string; cats: OwnedCat[]; kind: string }): Promise<string | null> {
  const cats = o.cats.slice(0, 12);
  await ensureCats([...new Set(cats.map((c) => c.species))]);
  return new Promise((resolve) => {
    let done = false;
    const m = new Modal('¿QUIÉN LA LEVANTA?', 1240, 720, { subtitle: o.title });
    const intro = txt(
      o.kind === 'habitat'
        ? `Aquí vivían gatos de ${ELEMENT_NAME[o.element] ?? o.element}. Elige a uno de los tuyos: pone la primera piedra y las demás se acuerdan solas.`
        : 'Elige a uno de los tuyos. Pone la primera piedra; las demás se acuerdan solas.',
      { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink, wordWrap: true, wordWrapWidth: m.innerW - 20, lineHeight: 30 },
    );
    m.body.addChild(intro);
    const cols = 6;
    const cw = (m.innerW - 10) / cols;
    cats.forEach((c, i) => {
      const card = new Container();
      const bg = new Graphics().roundRect(4, 6, cw - 14, 232, 14).fill({ color: C.ink, alpha: 0.85 }).roundRect(0, 0, cw - 14, 232, 14).fill(C.paper).stroke({ width: 3, color: C.ink });
      const pic = catPortrait(c.species, 132, { slug: catSlug(c) });
      pic.position.set((cw - 14) / 2, 86);
      // the whole name, scaled to the card (a hard cut read «EL BIBLIOTEC»)
      const nm = fitLine(txt(c.name.toUpperCase(), { fontFamily: F.poster, fontSize: 24, fill: C.ink }), cw - 34);
      nm.anchor.set(0.5, 0);
      nm.position.set((cw - 14) / 2, 164);
      const lv = txt(`NV ${c.level}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink });
      lv.anchor.set(0.5, 0);
      lv.position.set((cw - 14) / 2, 196);
      card.addChild(bg, pic, nm, lv);
      card.position.set((i % cols) * cw, 84 + Math.floor(i / cols) * 252);
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointerover', () => gsap.to(card.scale, { x: 1.04, y: 1.04, duration: 0.12 }));
      card.on('pointerout', () => gsap.to(card.scale, { x: 1, y: 1, duration: 0.12 }));
      card.on('pointertap', () => {
        if (done) return;
        done = true;
        sfx('levelup');
        resolve(c.uid);
        m.close();
      });
      m.body.addChild(card);
      gsap.from(card, { alpha: 0, y: card.y + 30, duration: 0.25, delay: 0.05 + i * 0.03, ease: 'back.out(2)' });
    });
    if (!cats.length) {
      const none = txt('No hay quién. (Esto no debería pasar: avísale a Luzterna.)', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink });
      none.position.set(0, 90);
      m.body.addChild(none);
    }
    m.onClose = () => {
      if (!done) {
        done = true;
        resolve(null);
      }
    };
    m.open();
  });
}
