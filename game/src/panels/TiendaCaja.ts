/**
 * Parte III · LA TIENDA DE LA CAJA (Maneki) — mecanicas-v2/02-loop.md §4 and §5.4: ORBS (never the cat) of the box cats
 * you already have, for gold. Same price as the shop's orb packs (state/sys/shop.ts orbGoldPrice: minutes of island
 * income, cooled by a per-species heat): nothing new in the economy, only where she sells it. Opened from the Carta.
 */
import { Container, Graphics } from 'pixi.js';
import { Modal, toast } from '../ui/modal';
import { Button, poster, txt } from '../ui/widgets';
import { C, F, RARITY } from '../ui/theme';
import { sfx } from '../core/audio';
import { fmt } from '../core/format';
import { G } from '../state/game';
import { catDef } from '../data/content';
import { ORB_PACK, buyOrbsGold, orbOffer } from '../state/sys/shop';
import { P3_CATS } from '../state/sys/p3cats';
import { catPortrait } from './island/ui';
import { ScrollBox } from './collection/ui';

/** the box cats you have (one row per species, best cat first) */
export function tiendaCajaSpecies(): string[] {
  return P3_CATS.filter((d) => G.s.cats.some((c) => c.species === d.id)).map((d) => d.id);
}

export function openTiendaCaja() {
  const list = tiendaCajaSpecies();
  const ROW = 132;
  const h = Math.min(940, 250 + Math.max(1, list.length) * ROW);
  const m = new Modal('TIENDA DE LA CAJA', 1000, h, { band: 0xc8102e, bandText: C.paper, subtitle: 'Maneki · «Nada es gratis, pero todo es justo»' });
  const b = m.body;
  const W2 = m.innerW;
  const note = txt(`Orbes de los gatos de las cajas que ya están contigo: ${ORB_PACK} por paquete, al precio de la tienda. Los gatos no se venden: se conocen.`, {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 19,
    fill: C.ink,
    wordWrap: true,
    wordWrapWidth: W2,
  });
  b.addChild(note);
  if (!list.length) {
    const none = txt('Todavía no traes a nadie de las cajas. Maneki barre y espera.', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink });
    none.position.set(0, 70);
    b.addChild(none);
    return m.open();
  }
  const top = note.height + 18;
  const box = new ScrollBox(W2, Math.max(ROW, m.innerH - top - 8));
  box.position.set(0, top);
  b.addChild(box);
  const rows: { refresh: () => void }[] = [];
  list.forEach((sp, i) => {
    const def = catDef(sp);
    const best = G.s.cats.filter((c) => c.species === sp).sort((a, c) => c.stars - a.stars || c.level - a.level)[0];
    const row = new Container();
    row.position.set(0, i * ROW);
    const bg = new Graphics()
      .rect(5, 5, W2 - 5, ROW - 14)
      .fill(C.ink)
      .rect(0, 0, W2 - 5, ROW - 14)
      .fill(i % 2 ? C.paper : C.linen)
      .stroke({ width: 3, color: C.ink, alignment: 1 });
    const por = catPortrait(best, ROW - 34, { name: false });
    por.position.set(10, 8);
    const nm = poster(def.name.toUpperCase(), 32, C.ink);
    nm.position.set(ROW, 8);
    if (nm.width > W2 - ROW - 300) nm.scale.set((W2 - ROW - 300) / nm.width);
    const rar = txt((RARITY[def.rarity]?.name ?? def.rarity).toUpperCase(), { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: RARITY[def.rarity]?.color ?? C.ink, letterSpacing: 2 });
    rar.position.set(ROW, 50);
    const have = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink });
    have.position.set(ROW, 74);
    let btn: Button | null = null;
    const refresh = () => {
      const o = orbOffer(sp);
      have.text = o.need ? `${o.have}/${o.need} orbes para la siguiente estrella` : `${o.have} orbes · estrellas al máximo`;
      btn?.destroy({ children: true });
      btn = new Button(`+${ORB_PACK} · ${fmt(o.gold)}`, () => {
        const price = orbOffer(sp).gold;
        if (!buyOrbsGold(sp)) {
          sfx('error');
          toast('Te faltan Doblones', { sub: `${ORB_PACK} orbes de ${def.name} cuestan ${fmt(price)}. Tu isla junta el oro sola.`, color: C.paper });
          return;
        }
        sfx('coin');
        G.save();
        for (const r of rows) r.refresh();
      }, { w: 250, h: 64, size: 26, color: G.s.gold >= o.gold ? C.yellow : C.paperDark });
      btn.position.set(W2 - 270, (ROW - 14) / 2 - 32);
      row.addChild(btn);
    };
    row.addChild(bg, por, nm, rar, have);
    refresh();
    rows.push({ refresh });
    box.content.addChild(row);
  });
  box.setContentHeight(list.length * ROW + 10);
  return m.open();
}
