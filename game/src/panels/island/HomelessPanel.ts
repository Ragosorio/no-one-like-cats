/**
 * "SIN CASA": every homeless cat with the ONE best next step (move in / build / upgrade / buy land).
 * Opened from the cat's sad bubble on the island and from the HUD notice. Cozy + editorial.
 */
import { Container, Graphics } from 'pixi.js';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { Button, txt } from '../../ui/widgets';
import { G } from '../../state/game';
import { EXPANSIONS, catDef } from '../../data/content';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementFx } from '../../art/catArt';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import { house } from '../../state/sys/island';
import { checkMissions } from '../../state/sys/missions';
import { homeFixFor, homeless } from '../../state/ext/islandM2';
import { catPortrait, elementChip, mix, wrapText } from './ui';
import { islandHooks } from '../../island/hooks';
import { openHabitatPanel } from './HabitatPanel';
import { openExpansionPanel } from './ExpansionPanel';
import { emptyBoxArt } from '../../island/buildingArt';

export function openHomeless(focusUid?: string) {
  const list = homeless().sort((a, b) => (a.uid === focusUid ? -1 : b.uid === focusUid ? 1 : 0));
  if (!list.length) {
    toast('¡Todos tienen casa!', { icon: 'paw', sub: 'Gato con casa = gato que produce.' });
    return null;
  }
  const rows = Math.min(4, list.length);
  const m = new Modal('Sin casa', 1300, 236 + rows * 170, { band: C.red, subtitle: 'Gato sin casa = gato que no produce (y que te mira feo)' });
  const content = new Container();
  m.body.addChild(content);
  const box = emptyBoxArt();
  box.scale.set(2.2);
  box.position.set(m.innerW - 90, 110);
  content.addChild(box);
  list.slice(0, 4).forEach((c, i) => {
    const row = new Container();
    row.position.set(0, i * 170);
    const fix = homeFixFor(c);
    const def = catDef(c.species);
    const bg = new Graphics();
    bg.rect(6, 6, m.innerW - 200, 150).fill(C.ink);
    bg.rect(0, 0, m.innerW - 200, 150).fill(mix(elementFx(def.elements[0]).main, C.paper, 0.82)).stroke({ width: 3, color: C.ink, alignment: 1 });
    row.addChild(bg);
    const p = catPortrait(c, 126, { name: false });
    p.position.set(12, 12);
    row.addChild(p);
    const nm = txt(c.name, { fontFamily: F.poster, fontSize: 38, fill: C.ink });
    nm.position.set(156, 6);
    row.addChild(nm);
    let cx = 156;
    for (const el of def.elements) {
      const ch = elementChip(el, 17);
      ch.position.set(cx, 56);
      row.addChild(ch);
      cx += ch.width + 8;
    }
    const why = wrapText(explain(fix, def.elements), 520, 17, F.ui, C.ink, { fontWeight: '700' });
    why.position.set(156, 92);
    row.addChild(why);
    const action = actionFor(fix, c.uid, m);
    if (action) {
      action.position.set(m.innerW - 200 - action.width - 18, 40);
      row.addChild(action);
    }
    content.addChild(row);
  });
  if (list.length > 4) {
    const more = txt(`+${list.length - 4} gatos más esperan casa`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.red });
    more.position.set(0, rows * 170);
    content.addChild(more);
  }
  m.open();
  return m;
}

function explain(fix: ReturnType<typeof homeFixFor>, els: string[]) {
  const names = els.map((e) => (ELEMENT_NAME[e] ?? e).toLowerCase()).join(' o ');
  switch (fix.kind) {
    case 'move':
      return `Cabe en tu hábitat de ${(ELEMENT_NAME[fix.element] ?? '').toLowerCase()}. Un toque y se muda.`;
    case 'build':
      return `Solo vive en hábitats de ${names}. Te cabe uno más en la isla: cómpralo y ponlo donde quieras (${fmt(fix.cost)} Doblones).`;
    case 'upgrade':
      return `Tu hábitat de ${(ELEMENT_NAME[fix.element] ?? '').toLowerCase()} está lleno. Mejóralo: el siguiente tier tiene más espacio.`;
    case 'expand':
      return `Solo vive en hábitats de ${names} y ya no cabe nada en tu isla. ${EXPANSIONS[fix.n - 1].name} trae terreno nuevo.`;
    case 'wait':
      return `Solo vive en hábitats de ${names}. ${fix.text}`;
  }
}

function actionFor(fix: ReturnType<typeof homeFixFor>, uid: string, m: Modal): Button | null {
  switch (fix.kind) {
    case 'move':
      return new Button('¡MUDARSE!', () => {
        const c = G.s.cats.find((x) => x.uid === uid);
        if (c && house(c.uid, fix.habitat)) {
          sfx('pop', 1.2);
          checkMissions();
          toast(`${c.name} ya tiene casa`, { icon: 'paw', sub: 'Ahora sí produce oro (y ronronea).' });
          islandHooks.sync?.();
          m.close();
        } else sfx('error');
      }, { w: 300, h: 76, size: 36, color: C.mint });
    case 'build':
      return new Button(`CONSTRUIR`, () => {
        m.close();
        if (!islandHooks.buildOnFreePlot?.(fix.element)) toast('Ya no cabe otro hábitat', { sub: 'Mueve o vende uno, o compra una expansión.', color: C.paper });
      }, { w: 300, h: 76, size: 36, color: fix.affordable && fix.builderFree ? C.pinkHot : C.paperDark, textColor: fix.affordable && fix.builderFree ? C.paper : C.ink });
    case 'upgrade':
      return new Button('MEJORAR', () => {
        m.close();
        openHabitatPanel(fix.habitat.id);
      }, { w: 300, h: 76, size: 36, color: C.yellow });
    case 'expand':
      return new Button(`TERRENO · ${fmt(fix.cost)}`, () => {
        m.close();
        islandHooks.focusRegion?.(fix.n);
        openExpansionPanel(fix.n, () => islandHooks.focusRegion?.(fix.n));
      }, { w: 300, h: 76, size: 30, color: fix.affordable ? C.pinkHot : C.paperDark, textColor: fix.affordable ? C.paper : C.ink });
    case 'wait':
      return null;
  }
}
