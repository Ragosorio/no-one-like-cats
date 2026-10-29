/**
 * MULTIVERSO — the odds of the post-Parte III cats on a casino table (state/sys/postp3.ts; ⚠️ spoilers of the Parte III).
 * Every table that can give them prints this: the share of its legendary / mythic cats that come from the Multiverse,
 * the guarantee and how far it is, and each cat's exact chance (its weight, ×3 while you don't have it). Nothing to show
 * before the Parte III is over, or on a table nobody was assigned to (postOdds → null).
 */
import { Container, Graphics } from 'pixi.js';
import { Modal } from '../../ui/modal';
import { C, F, RARITY, type Rarity } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { ScrollBox } from '../collection/ui';
import { POST_UNOWNED, multiversoOdds, postOdds, postShareText, type PostOdds, type PostTable } from '../../state/sys/postp3';

const T = (s: string, size = 18, fill: number = C.ink, extra: Record<string, unknown> = {}) => txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, ...extra });
const pct = (p: number) => (p >= 0.995 ? '100%' : p >= 0.1 ? `${(p * 100).toFixed(1)}%` : p >= 0.01 ? `${(p * 100).toFixed(2)}%` : `${(p * 100).toFixed(3)}%`);

/** one line for a table's status («AHORITA…»): null when this table has no Multiverse pool */
export function postNote(t: PostTable): string | null {
  const o = postOdds(t);
  if (!o) return null;
  const g = o.left ? ` · garantizado en ${o.left} ${o.left === 1 ? 'legendario o mítico' : 'legendarios o míticos'}` : '';
  return `MULTIVERSO: ${postShareText(o.share)} de aquí es del Multiverso${g}`;
}

/** the rules, in plain words (the odds panels and the house rules) */
export function postRuleLines(o: PostOdds): string[] {
  return [
    `Después de la Parte III, ${postShareText(o.share)} que da ${o.place} viene del Multiverso. Las probabilidades de la mesa no cambian: solo cuál gato sale. El gato destacado de un banner va aparte: no cuenta aquí.`,
    o.pity ? `GARANTÍA: si salen ${o.pity} gatos legendarios o míticos seguidos (sin contar al destacado) sin uno del Multiverso, el siguiente lo es. Te ${o.left === 1 ? 'falta 1: el próximo es seguro' : `faltan ${o.left}`}.` : 'Esta mesa no tiene garantía del Multiverso.',
    `Cada gato del Multiverso pesa lo que dice su tabla; los que NO tienes pesan x${POST_UNOWNED}. Repetido = Orbes de Alma de esa especie.`,
  ];
}

/** draw the table into `root` (w wide, h tall at most); returns the height used */
export function drawPostOdds(root: Container, t: PostTable, w = 1420, h = 640): number {
  const o = postOdds(t);
  if (!o) {
    const n = T('El Multiverso todavía no tiene gatos en esta mesa.', 20, C.inkBlue);
    root.addChild(n);
    return n.height;
  }
  let y = 0;
  const head = txt(`MULTIVERSO · ${o.place.toUpperCase()}`, { fontFamily: F.poster, fontSize: 30, fill: C.ink });
  root.addChild(head);
  y += 44;
  const now = T(`AHORITA: tu próximo legendario o mítico de aquí es del Multiverso con ${pct(o.next)}${o.left ? ` · garantía en ${o.left}` : ''}`, 18, C.pinkHot, { wordWrap: true, wordWrapWidth: w });
  now.position.set(0, y);
  root.addChild(now);
  y += now.height + 10;
  for (const line of postRuleLines(o)) {
    const l = T('·  ' + line, 15, C.ink, { wordWrap: true, wordWrapWidth: w, lineHeight: 20 });
    l.position.set(0, y);
    root.addChild(l);
    y += l.height + 4;
  }
  y += 10;
  const xs = [0, 470, 690, 800, 1080];
  ['GATO', 'RAREZA', 'PESO', 'SI ES DEL MULTIVERSO', 'TU PRÓXIMO LEG./MÍT.'].forEach((s, i) => {
    const c = T(s, 14, C.pinkHot, { letterSpacing: 2 });
    c.position.set(xs[i], y);
    root.addChild(c);
  });
  y += 24;
  const rowH = 34;
  const box = new ScrollBox(w, Math.max(rowH * 3, h - y), C.ink);
  box.position.set(0, y);
  root.addChild(box);
  o.cats.forEach((c, i) => {
    const ry = i * rowH;
    box.content.addChild(new Graphics().rect(0, ry, w - 16, rowH - 4).fill(i % 2 ? C.paper : 0xe6dccb));
    const rr = RARITY[c.rarity as Rarity];
    const cells = [
      txt(`${c.name}${c.owned ? '' : '  · NUEVO'}`, { fontFamily: F.poster, fontSize: 20, fill: C.ink }),
      T(rr?.name ?? c.rarity.toUpperCase(), 16, rr?.color ?? C.ink),
      T(`${c.weight}${c.owned ? '' : ` x${POST_UNOWNED}`}`, 16),
      T(pct(c.inPool), 16),
      T(pct(c.next), 16, C.pinkHot),
    ];
    cells.forEach((cell, k) => {
      cell.position.set(xs[k] + 8, ry + (k === 0 ? 2 : 6));
      box.content.addChild(cell);
    });
  });
  box.setContentHeight(o.cats.length * rowH);
  return Math.min(h, y + o.cats.length * rowH);
}

/** the MULTIVERSO odds of one table, in its own window */
export function openPostOdds(t: PostTable) {
  const m = new Modal('Multiverso', 1500, 900, { subtitle: 'TODO A LA VISTA · DESPUÉS DE LA PARTE III' });
  drawPostOdds(m.body, t, 1440, 760);
  m.open();
  return m;
}

/**
 * The MULTIVERSO DESBORDADO banner's cats (state/sys/gacha.ts MULTIVERSO): every post Multidimensional, its weight (×3 while
 * you don't have it), its chance in each of the banner's two lines, and on your NEXT pull (`p`: that pull's tier odds).
 */
export function openMultiversoOdds(p: { legendary: number; mythic: number }) {
  const m = new Modal('Multiverso Desbordado', 1500, 900, { subtitle: 'TODO A LA VISTA · CADA MULTIDIMENSIONAL' });
  const root = m.body;
  const o = multiversoOdds(p);
  if (!o) {
    root.addChild(T('El Multiverso todavía no tiene gatos para ti.', 20, C.inkBlue));
    m.open();
    return m;
  }
  const w = 1440;
  let y = 0;
  const head = txt('MULTIVERSO DESBORDADO · SUS MULTIDIMENSIONALES', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
  root.addChild(head);
  y += 44;
  const owned = o.cats.filter((c) => c.owned).length;
  const now = T(`AHORITA: MULTIDIMENSIONAL ${pct(o.pLine)} y MD QUE TE FALTA ${pct(o.pMissing)} en tu próximo tiro · tienes ${owned} de ${o.cats.length}`, 18, C.pinkHot, { wordWrap: true, wordWrapWidth: w });
  now.position.set(0, y);
  root.addChild(now);
  y += now.height + 8;
  for (const line of [
    `Cada gato pesa lo que dice su tabla; los que NO tienes pesan x${POST_UNOWNED}. La línea MD QUE TE FALTA solo da gatos que no tienes (con todos, cualquiera, por peso). Repetido = Orbes de Alma de esa especie.`,
  ]) {
    const l = T('·  ' + line, 15, C.ink, { wordWrap: true, wordWrapWidth: w, lineHeight: 20 });
    l.position.set(0, y);
    root.addChild(l);
    y += l.height + 10;
  }
  const xs = [0, 470, 640, 900, 1160];
  ['GATO', 'PESO', 'SI SALE MULTIDIMENSIONAL', 'SI SALE MD QUE TE FALTA', 'EN TU PRÓXIMO TIRO'].forEach((s, i) => {
    const c = T(s, 14, C.pinkHot, { letterSpacing: 2 });
    c.position.set(xs[i], y);
    root.addChild(c);
  });
  y += 24;
  const rowH = 34;
  const box = new ScrollBox(w, Math.max(rowH * 3, 760 - y), C.ink);
  box.position.set(0, y);
  root.addChild(box);
  const md = RARITY.multidimensional;
  o.cats.forEach((c, i) => {
    const ry = i * rowH;
    box.content.addChild(new Graphics().rect(0, ry, w - 16, rowH - 4).fill(i % 2 ? C.paper : 0xe6dccb));
    const cells = [
      txt(`${c.name}${c.owned ? '  ✓' : '  · NUEVO'}`, { fontFamily: F.poster, fontSize: 20, fill: c.owned ? C.ink : md.color }),
      T(`${c.weight}${c.owned ? '' : ` x${POST_UNOWNED}`}`, 16),
      T(pct(c.inLine), 16),
      T(c.inMissing ? pct(c.inMissing) : '—', 16),
      T(pct(c.next), 16, C.pinkHot),
    ];
    cells.forEach((cell, k) => {
      cell.position.set(xs[k] + 8, ry + (k === 0 ? 2 : 6));
      box.content.addChild(cell);
    });
  });
  box.setContentHeight(o.cats.length * rowH);
  m.open();
  return m;
}
