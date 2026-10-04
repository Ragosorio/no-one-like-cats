/** Prize art + the "loot fan" presentation shared by slots, La Caja and the gacha. */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { loadCatTexture, catTexture } from '../../art/catArt';
import { applyCatTint, slugOf } from '../../art/tint';
import { catDef } from '../../data/content';
import { elementIcon } from '../../ui/elementIcon';
import { sparkles } from '../../fx/juice';
import type { Granted, Prize } from '../../state/sys/casino';
import { HOLO_BONUS } from '../../state/sys/accessories';
import { CP, chipIcon, halftone, ticketIcon } from './kit';
import { drawAccessory } from './accessoryArt';
import { holoSheen } from '../../fx/sequences/gachaHolo';
import { csfx } from './sfx';
import type { CasinoCtx } from './ctx';

export const TIER_COL: Record<string, number> = { common: 0xd9cdb8, rare: 0x6fa8ff, epic: 0xff2e88, legendary: 0xffc94a, holo: 0x00e5ff };
export const TIER_LABEL: Record<string, string> = { common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legendary: 'LEGENDARIO', holo: 'HOLO' };

/** cat illustration (async texture load; draws when ready) */
export function catArt(species: string, size: number): Container {
  const c = new Container();
  const slug = slugOf(species);
  const put = () => {
    if (c.destroyed) return;
    const s = new Sprite(catTexture(slug));
    s.anchor.set(0.5);
    s.scale.set(size / Math.max(1, s.texture.width || 700));
    applyCatTint(s, species);
    c.addChild(s);
  };
  loadCatTexture(slug).then(put, put);
  return c;
}

/** art for any prize, centered at (0,0) */
export function prizeArt(p: Prize, size: number): Container {
  switch (p.kind) {
    case 'cat':
      return catArt(p.ref ?? 'c_canelo', size * 1.25);
    case 'accessory':
      return drawAccessory(p.ref ?? '', size * 0.85);
    case 'gold':
      return icon('gold', size * 0.7);
    case 'food':
      return icon('food', size * 0.8);
    case 'gems':
      return icon('gem', size * 0.7);
    case 'prisma': {
      const c = icon('orb', size * 0.7, 0xff7ab8);
      return c;
    }
    case 'orbs':
      return icon('orb', size * 0.7, CP.violet);
    case 'scrap':
      return icon('scrap', size * 0.7);
    case 'blueprint':
      return icon('blueprint', size * 0.7);
    case 'crystal': {
      const c = new Container();
      c.addChild(icon('crystal', size * 0.7));
      if (p.ref) {
        const e = elementIcon(p.ref, size * 0.36);
        e.position.set(size * 0.3, size * 0.28);
        c.addChild(e);
      }
      return c;
    }
    case 'tickets':
      return ticketIcon(size * 0.75);
    case 'chips':
      return chipIcon(size * 0.7);
  }
}

/** a printed prize card (w×h), anchor top-left */
export function prizeCard(g: Granted, w = 200, h = 260): Container {
  const c = new Container();
  const tier = g.holo ? 'holo' : (g.tier ?? 'common');
  const col = TIER_COL[tier] ?? CP.paperDark;
  const bg = new Graphics();
  bg.rect(7, 7, w, h).fill(CP.ink);
  bg.rect(0, 0, w, h).fill(CP.paper).stroke({ width: 4, color: CP.ink, alignment: 1 });
  // Swiss disc behind the art, in the tier colour, with a halftone print
  const k = Math.min(w, h);
  bg.circle(w / 2, h * 0.46, k * 0.36).fill(col);
  bg.rect(0, 0, w, 34).fill(col).stroke({ width: 4, color: CP.ink, alignment: 1 });
  const dots = halftone(w - 8, h - 98, CP.ink, 0.08, 9, 1.6);
  dots.position.set(4, 36);
  const tl = txt(TIER_LABEL[tier] ?? '', { fontFamily: F.poster, fontSize: 22, fill: CP.ink });
  tl.anchor.set(0.5, 0);
  tl.position.set(w / 2, 3);
  const art = prizeArt(g, g.kind === 'cat' ? k * 0.78 : k * 0.82);
  art.position.set(w / 2, h * (g.kind === 'cat' ? 0.5 : 0.46));
  const artMask = new Graphics().rect(4, 36, w - 8, h - 98).fill(0xffffff);
  art.mask = artMask;
  const nameBg = new Graphics().rect(0, h - 62, w, 62).fill(CP.ink);
  const name = txt(cardTitle(g), { fontFamily: F.poster, fontSize: 24, fill: CP.paper, align: 'center', wordWrap: true, wordWrapWidth: w - 16, lineHeight: 24 });
  name.anchor.set(0.5, 0.5);
  name.position.set(w / 2, h - 31);
  if (name.height > 52) name.scale.set(52 / name.height);
  c.addChild(bg, dots, tl, artMask, art, nameBg, name);
  if (g.kind === 'cat') {
    const def = catDef(g.ref!);
    def.elements.forEach((e, i) => {
      const ic = elementIcon(e, 26);
      ic.position.set(20 + i * 28, 52);
      c.addChild(ic);
    });
    if (g.isNew || g.upgraded) {
      const nb = new Container();
      const nbg = new Graphics().rect(0, 0, 70, 26).fill(CP.pink).stroke({ width: 3, color: CP.ink });
      const nt = txt(g.upgraded ? 'FOIL' : 'NUEVO', { fontFamily: F.poster, fontSize: 20, fill: CP.ink });
      nt.anchor.set(0.5);
      nt.position.set(35, 13);
      nb.addChild(nbg, nt);
      nb.position.set(w - 78, 42);
      nb.rotation = 0.08;
      c.addChild(nb);
    }
  }
  if (tier === 'holo') {
    const s = holoSheen(w - 8, h - 8, 0.8);
    s.position.set(4, 4);
    c.addChild(s);
  }
  return c;
}

export function cardTitle(g: Granted): string {
  if (g.kind === 'cat') {
    const n = catDef(g.ref!).name.toUpperCase();
    if (g.upgraded) return `${n} → HOLO`;
    if (!g.isNew && !g.holo) return `${n} · +${g.orbs ?? 0} ORBES`;
    return g.holo ? `${n} HOLO` : n;
  }
  return g.label;
}

function targetFor(g: Granted): 'gold' | 'gems' | 'chips' | 'tickets' | null {
  if (g.kind === 'gold') return 'gold';
  if (g.kind === 'gems') return 'gems';
  if (g.kind === 'chips') return 'chips';
  if (g.kind === 'tickets') return 'tickets';
  return null;
}

/** fan of prize cards popping out of a point, then flying to the HUD; then cat reveals for new cats */
export async function presentPrizes(ctx: CasinoCtx, granted: Granted[], from: { x: number; y: number }, o: { hold?: number } = {}) {
  if (!granted.length) return;
  const n = granted.length;
  const w = n > 4 ? 150 : 190;
  const h = n > 4 ? 200 : 250;
  const gap = 18;
  const total = n * w + (n - 1) * gap;
  const layer = new Container();
  ctx.fx.addChild(layer);
  const cards: Container[] = [];
  const x0 = Math.max(360, Math.min(1420 - total, from.x - total / 2));
  granted.forEach((g, i) => {
    const card = prizeCard(g, w, h);
    card.pivot.set(w / 2, h / 2);
    card.position.set(from.x, from.y);
    card.scale.set(0.1);
    card.rotation = (Math.random() - 0.5) * 0.5;
    layer.addChild(card);
    cards.push(card);
    gsap.to(card, { x: x0 + i * (w + gap) + w / 2, y: from.y - 40, rotation: (Math.random() - 0.5) * 0.08, duration: 0.45, delay: i * 0.08, ease: 'back.out(1.6)' });
    gsap.to(card.scale, { x: 1, y: 1, duration: 0.45, delay: i * 0.08, ease: 'back.out(2)' });
    window.setTimeout(() => {
      if (card.destroyed) return;
      csfx.flip(g.tier === 'legendary' || g.holo ? 3 : g.tier === 'epic' ? 2 : 0);
      sparkles(layer, card.x, card.y, TIER_COL[g.holo ? 'holo' : (g.tier ?? 'common')], 8, 120);
    }, 300 + i * 80);
  });
  await wait((o.hold ?? 1500) + n * 80);
  ctx.unfreeze();
  await Promise.all(
    cards.map(
      (card, i) =>
        new Promise<void>((res) => {
          const t = targetFor(granted[i]);
          const p = t ? ctx.pillPos(t) : { x: card.x, y: card.y - 160 };
          gsap.to(card, { x: p.x, y: p.y, rotation: 0.3, duration: 0.5, delay: i * 0.06, ease: 'power3.in' });
          gsap.to(card.scale, { x: 0.15, y: 0.15, duration: 0.5, delay: i * 0.06, ease: 'power3.in' });
          gsap.to(card, {
            alpha: t ? 1 : 0,
            duration: 0.5,
            delay: i * 0.06,
            onComplete: () => {
              if (t) csfx.coin();
              ctx.refresh();
              res();
            },
          });
        }),
    ),
  );
  layer.destroy({ children: true });
  await revealCats(ctx.top, granted);
}

/** full cat reveal (collection's storyboard a) for new cats and fresh HOLO foils */
export async function revealCats(layer: Container, granted: Granted[]) {
  const cats = granted.filter((g) => g.kind === 'cat' && (g.isNew || g.upgraded || g.holo));
  if (!cats.length) return;
  try {
    const { playCatReveal } = await import('../../fx/sequences/catReveal');
    const coll = await import('../../state/ext/collection');
    for (const g of cats) {
      const def = catDef(g.ref!);
      const info = coll.revealInfo(g.ref!, !!g.isNew, g.orbs ?? 0);
      const holoTxt = `VARIANTE HOLO: +${Math.round(HOLO_BONUS.gold * 100)}% oro · +${Math.round(HOLO_BONUS.pow * 100)}% poder · +${Math.round(HOLO_BONUS.hp * 100)}% vida`;
      await playCatReveal(layer, {
        slug: slugOf(g.ref!),
        species: g.ref!,
        name: g.holo ? `${def.name} HOLO` : def.name,
        elements: def.elements,
        rarity: info.rarity,
        caption: g.holo ? (g.upgraded ? `¡Tu ${def.name} ahora es HOLO! Está súper roto.` : `¡Salió del portal en versión HOLO! Esto es un evento canónico.`) : info.caption,
        subtitle: g.holo ? holoTxt : info.subtitle,
        chips: info.chips,
        serial: 777,
        dex: g.isNew ? info.dex : undefined,
        secret: def.secret,
      });
    }
  } catch (e) {
    console.warn('[casino] cat reveal unavailable', e);
  }
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}
export type { Text };
