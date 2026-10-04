/** Small editorial UI pieces shared by the island panels. */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F, RARITY } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon, IconKind } from '../../ui/icons';
import { fmt } from '../../core/format';
import { catTexture } from '../../art/catArt';
import { applyCatTint, slugOf } from '../../art/tint';
import { catDef } from '../../data/content';
import { ELEMENT_ICON, ELEMENT_NAME } from '../../data/elementsMeta';
import { elementFx } from '../../art/catArt';
import { OwnedCat } from '../../state/game';
import { sfx } from '../../core/audio';

export function heading(text: string, size = 26, color: number = C.ink): Container {
  const c = new Container();
  const t = txt(text.toUpperCase(), { fontFamily: F.bebas, fontSize: size, fill: color, letterSpacing: 2 });
  const line = new Graphics().rect(0, t.height + 2, Math.max(60, t.width), 3).fill(color);
  c.addChild(t, line);
  return c;
}

export function chip(text: string, bg: number, fg: number = C.ink, size = 18): Container {
  const c = new Container();
  const t = txt(text, { fontFamily: F.bebas, fontSize: size, fill: fg, letterSpacing: 1 });
  t.position.set(10, 3);
  const g = new Graphics().rect(0, 0, t.width + 20, t.height + 6).fill(bg).stroke({ width: 2.5, color: C.ink });
  c.addChild(g, t);
  return c;
}

export function elementChip(el: string, size = 18) {
  const fx = elementFx(el);
  const light = [0xffe14a, 0xa7e8d7, 0xc6f0e4, 0xfff3b0, 0xffffff, 0xb7a4c7, 0xff7ab8, 0xd4f27a, 0x00e5ff].includes(fx.main);
  return chip(`${ELEMENT_ICON[el] ?? ''} ${ELEMENT_NAME[el] ?? el}`, fx.main, light ? C.ink : C.paper, size);
}

export function rarityChip(r: keyof typeof RARITY, size = 18) {
  const m = RARITY[r];
  return chip(m.name, m.color, r === 'common' || r === 'legendary' ? C.ink : C.paper, size);
}

/** icon + number (red when you can't afford it) */
export function costTag(kind: IconKind, value: number, ok = true, size = 24, tint?: number): Container {
  const c = new Container();
  const ic = icon(kind, size + 6, tint);
  ic.position.set((size + 6) / 2, size / 2 + 2);
  const t = txt(fmt(value), { fontFamily: F.heavy, fontSize: size, fill: ok ? C.ink : C.red });
  t.position.set(size + 12, 0);
  c.addChild(ic, t);
  return c;
}

/** square cat portrait with rarity frame (print quality) */
export function catPortrait(c: OwnedCat, size = 150, opts: { name?: boolean; level?: boolean } = {}): Container {
  const def = catDef(c.species);
  const rar = RARITY[def.rarity] ?? RARITY.common;
  const box = new Container();
  const bg = new Graphics();
  bg.rect(6, 6, size, size).fill(C.ink);
  bg.rect(0, 0, size, size).fill(mix(elementFx(def.elements[0]).main, C.paper, 0.72)).stroke({ width: 4, color: rar.color, alignment: 1 });
  bg.rect(0, 0, size, size).stroke({ width: 2, color: C.ink, alignment: 0 });
  box.addChild(bg);
  const sp = new Sprite(catTexture(slugOf(c.species)));
  sp.anchor.set(0.5, 0.92);
  const s = (size * 0.86) / Math.max(1, sp.texture.width);
  sp.scale.set(s);
  applyCatTint(sp, c.species);
  sp.position.set(size / 2, size * 0.97);
  const mask = new Graphics().rect(2, 2, size - 4, size - 4).fill(0xffffff);
  sp.mask = mask;
  box.addChild(mask, sp);
  if (opts.level !== false) {
    const lv = txt(`NV ${c.level}`, { fontFamily: F.poster, fontSize: Math.round(size * 0.15), fill: C.paper });
    const lb = new Graphics().rect(0, 0, lv.width + 12, lv.height + 2).fill(C.ink);
    lv.position.set(6, 1);
    const lc = new Container();
    lc.addChild(lb, lv);
    box.addChild(lc);
  }
  if (opts.name !== false) {
    const n = txt(c.name, { fontFamily: F.poster, fontSize: Math.round(size * 0.14), fill: C.ink });
    n.anchor.set(0.5, 0);
    n.position.set(size / 2, size + 8);
    if (n.width > size) n.scale.set(size / n.width);
    box.addChild(n);
  }
  return box;
}

export function mix(a: number, b: number, t: number) {
  const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t;
  const g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t;
  const bl = (a & 255) * (1 - t) + (b & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}

/** tap behaviour for arbitrary containers inside panels */
export function tappable(c: Container, onTap: () => void, sound = true) {
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointerover', () => gsap.to(c, { y: (c as Container & { baseY?: number }).baseY! - 3, duration: 0.1 }));
  c.on('pointerout', () => gsap.to(c, { y: (c as Container & { baseY?: number }).baseY!, duration: 0.12 }));
  (c as Container & { baseY?: number }).baseY = c.y;
  c.on('pointertap', () => {
    if (sound) sfx('click');
    onTap();
  });
}
export function setBaseY(c: Container, y: number) {
  c.y = y;
  (c as Container & { baseY?: number }).baseY = y;
}

export function wrapText(text: string, width: number, size = 18, font: string = F.ui, color: number = C.ink, extra: Record<string, unknown> = {}): Text {
  return txt(text, { fontFamily: font, fontSize: size, fill: color, wordWrap: true, wordWrapWidth: width, lineHeight: Math.round(size * 1.3), ...extra });
}

/** progress bar (paper back, ink border) */
export function bar(w: number, h: number, p: number, color: number, back: number = C.paperDark) {
  const g = new Graphics();
  g.rect(4, 4, w, h).fill(C.ink);
  g.rect(0, 0, w, h).fill(back).stroke({ width: 3, color: C.ink, alignment: 1 });
  g.rect(0, 0, w * Math.max(0, Math.min(1, p)), h).fill(color);
  return g;
}
