/**
 * DECORACIÓN: catalog (filters + cards) on the left, live diorama preview on the right.
 * Buy → place on the island (placement mode: the ghost follows your pointer over the real island),
 * or buy to the chest; stored pieces can be placed or sold from here; placed ones are tapped on the island.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { toast } from '../../../ui/modal';
import { icon } from '../../../ui/icons';
import { sfx } from '../../../core/audio';
import { fmt } from '../../../core/format';
import { G } from '../../../state/game';
import { BIOMES } from '../../../island/terrain';
import { decorArt, DecorArt } from '../../../island/decor/decorArt';
import { islandDecorMounted, requestPlacement } from '../../../island/decor/DecorLayer';
import { regionsUnlocked } from '../../../state/sys/island';
import { EXPANSIONS } from '../../../data/content';
import {
  DECOR,
  DECOR_SETS,
  DecorDef,
  DecorSet,
  buyDecor,
  canAfford,
  decorDef,
  decorPrice,
  decorUnlocked,
  placedCount,
  sellDecor,
  sellPrice,
  setComplete,
  setPieces,
  setProgress,
  stored,
  storedTotal,
  unlockText,
} from '../../../state/sys/decor';
import { isNew, markSeen } from '../../../state/sys/shop';
import type { ShopCtx } from '../ctx';
import { block, Btn, chip, fit, halftoneRect, newSeal, para, Scroller, t } from '../ui';
import { buying, celebrate } from '../buy';

type Filter = 'todo' | DecorSet | 'unicos' | 'baul';
let filter: Filter = 'todo';
let biomeIdx = 0;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todo', label: 'TODO' },
  { id: 'cozy', label: 'COZY' },
  { id: 'pirata', label: 'PIRATA' },
  { id: 'neon', label: 'NEÓN' },
  { id: 'museo', label: 'MUSEO' },
  { id: 'unicos', label: 'ÚNICOS' },
  { id: 'baul', label: 'BAÚL' },
];

function listFor(f: Filter): DecorDef[] {
  if (f === 'todo') return DECOR;
  if (f === 'unicos') return DECOR.filter((d) => !d.set);
  if (f === 'baul') return DECOR.filter((d) => stored(d.id) > 0);
  return DECOR.filter((d) => d.set === f);
}

export function renderDecor(ctx: ShopCtx) {
  const root = ctx.root;
  const unlockedIds = DECOR.filter(decorUnlocked).map((d) => `dec:${d.id}`);
  const fresh = new Set(unlockedIds.filter(isNew));
  markSeen(...unlockedIds);
  let sel = ctx.focus && DECOR.some((d) => d.id === ctx.focus) ? ctx.focus : (listFor(filter)[0] ?? DECOR[0]).id;
  if (ctx.focus && filter !== 'todo' && !listFor(filter).some((d) => d.id === ctx.focus)) filter = 'todo';

  const leftW = 1120;
  const rightX = leftW + 30;
  const rightW = ctx.w - rightX;

  // ------------------------------------------------------------------ filters
  const fbar = new Container();
  let fx = 0;
  for (const f of FILTERS) {
    const n = f.id === 'baul' ? storedTotal() : 0;
    const on = filter === f.id;
    const label = f.id === 'baul' ? `BAÚL · ${n}` : f.label;
    const setCol = f.id !== 'todo' && f.id !== 'unicos' && f.id !== 'baul' ? DECOR_SETS[f.id as DecorSet].color : C.ink;
    const c = chip(label, on ? setCol : C.paper, on ? (setCol === C.gold || setCol === C.orange ? C.ink : C.paper) : C.ink, 30, F.bebas);

    if (f.id !== 'todo' && f.id !== 'unicos' && f.id !== 'baul' && setComplete(f.id as DecorSet)) {
      const st = icon('star', 22);
      st.position.set(c.width + 12, c.height / 2);
      c.addChild(st);

    }
    c.position.set(fx, on ? 0 : 4);
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => {
      sfx('paper');
      filter = f.id;
      const l = listFor(filter);
      ctx.refresh(l.some((d) => d.id === sel) ? sel : l[0]?.id ?? sel);
    });
    fbar.addChild(c);
    fx += c.width + 10;
  }
  root.addChild(fbar);

  // ------------------------------------------------------------------ catalog
  const list = listFor(filter);
  const area = new Scroller(leftW - 14, ctx.h - 64);
  area.position.set(0, 62);
  root.addChild(area);
  const cols = 5;
  const gap = 18;
  const cw = Math.floor((leftW - 14 - gap * (cols - 1)) / cols);
  const ch = 262;
  const arts: DecorArt[] = [];
  const cards = new Map<string, Container>();
  if (!list.length) {
    const e = para(filter === 'baul' ? 'Tu baúl está vacío. Todo lo que compras sin colocar (o guardas desde la isla) espera aquí.' : 'Nada por aquí.', leftW - 80, 20);
    e.position.set(20, 30);
    area.content.addChild(e);
  }
  list.forEach((d, i) => {
    const card = new Container();
    const face = new Container();
    card.addChild(face);
    card.position.set((i % cols) * (cw + gap), Math.floor(i / cols) * (ch + gap) + 8);
    const unlocked = decorUnlocked(d);
    const on = d.id === sel;
    face.addChild(block(cw, ch, on ? 0xfff6e8 : C.paper, on ? 10 : 6, on ? 6 : 3));
    const band = new Graphics().rect(0, 0, cw, 8).fill(d.color);
    face.addChild(band);
    if (on) face.addChild(new Graphics().rect(-4, -4, cw + 8, ch + 8).stroke({ width: 4, color: C.pinkHot }));
    const stage = new Graphics().ellipse(cw / 2, 168, cw * 0.36, 18).fill({ color: d.color, alpha: 0.35 });
    face.addChild(stage);
    const a = decorArt(d.id);
    const b = a.c.getLocalBounds();
    const s = Math.min(1.1, 140 / Math.max(1, b.height), (cw - 30) / Math.max(1, b.width));
    a.c.scale.set(s);
    a.c.position.set(cw / 2, 170);
    if (!unlocked) {
      a.c.alpha = 0.18;
      a.c.tint = C.ink;
    }
    face.addChild(a.c);
    arts.push(a);
    const nm = t(d.name, 17, C.ink, F.bebas, { letterSpacing: 1, wordWrap: true, wordWrapWidth: cw - 16, lineHeight: 18 });
    nm.position.set(10, 186);
    face.addChild(nm);
    if (unlocked) {
      const pt = new Container();
      const ic = icon(d.cur === 'gems' ? 'gem' : 'gold', 22);
      ic.position.set(11, 11);
      const pv = t(fmt(decorPrice(d)), 19, canAfford(d) ? C.ink : C.red, F.heavy);
      pv.position.set(26, -1);
      pt.addChild(ic, pv);
      pt.position.set(10, ch - 32);
      face.addChild(pt);
    } else {
      const lk = chip(unlockText(d), C.ink, C.yellow, 16);
      const li = icon('lock', 16);
      li.position.set(-12, 12);
      lk.addChild(li);
      lk.position.set(24, ch - 36);
      face.addChild(lk);
    }
    const have = stored(d.id) + placedCount(d.id);
    if (have) {
      const hb = chip(`×${have}`, C.ink, C.paper, 16);
      hb.position.set(cw - hb.width - 8, 14);
      face.addChild(hb);
    }
    if (d.set && setComplete(d.set)) {
      const st = icon('star', 22);
      st.position.set(18, 24);
      face.addChild(st);
    }
    if (fresh.has(`dec:${d.id}`)) {
      const seal = newSeal(30);
      seal.position.set(cw - 22, have ? 52 : 22);
      face.addChild(seal);
    }
    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointerover', () => gsap.to(face, { y: -5, duration: 0.1 }));
    card.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.12 }));
    card.on('pointertap', () => {
      if (area.wasDrag) return;
      sfx('click');
      ctx.refresh(d.id);
    });
    cards.set(d.id, card);
    area.content.addChild(card);
  });
  area.setContentHeight(Math.ceil(list.length / cols) * (ch + gap) + 20);
  // keep the selection visible
  const selCard = cards.get(sel);
  if (selCard) area.scrollTo(Math.max(0, selCard.y - (area.bh - ch) / 2), false);

  // ------------------------------------------------------------------ preview
  const d = decorDef(sel);
  const pv = new Container();
  pv.position.set(rightX, 0);
  root.addChild(pv);
  pv.addChild(block(rightW, ctx.h - 6, C.paper, 8));
  const dioH = 268;
  const dio = new Container();
  const dioBg = new Graphics().rect(0, 0, rightW, dioH).fill(0x9fd3e6).stroke({ width: 4, color: C.ink, alignment: 1 });
  dio.addChild(dioBg);
  const ht = halftoneRect(rightW, dioH, 0x3569a3, 12, 2.4, 0.28);
  dio.addChild(ht);
  // biome ground (cycle through unlocked regions)
  const regions = regionsUnlocked();
  const biomes = regions.map((r) => (r === 'home' ? 'home' : EXPANSIONS.find((e) => e.id === r)?.biome ?? 'home'));
  biomeIdx = biomeIdx % Math.max(1, biomes.length);
  const bio = BIOMES[biomes[biomeIdx]] ?? BIOMES.home;
  const tiles = new Graphics();
  const TW2 = 64 * 1.25;
  const TH2 = 32 * 1.25;
  const cx = rightW / 2;
  const cy = 176;
  const tile = (gx: number, gy: number, col: number) => {
    const x = cx + (gx - gy) * TW2;
    const y = cy + (gx + gy) * TH2;
    tiles.poly([x, y - TH2, x + TW2, y, x, y + TH2, x - TW2, y]).fill(col).stroke({ width: 1.5, color: C.ink, alpha: 0.25 });
  };
  // cliff sides of the 3×3 patch
  const L = cx - TW2 * 3;
  const R = cx + TW2 * 3;
  const B = cy + TH2 * 2;
  tiles.poly([L, cy, cx, B + TH2, cx, B + TH2 + 34, L, cy + 34]).fill(bio.side).stroke({ width: 3, color: C.ink });
  tiles.poly([cx, B + TH2, R, cy, R, cy + 34, cx, B + TH2 + 34]).fill(bio.sideDark).stroke({ width: 3, color: C.ink });
  for (let gy = -1; gy <= 1; gy++) for (let gx = -1; gx <= 1; gx++) tile(gx, gy, (gx + gy) % 2 ? bio.topAlt : bio.top);
  tiles.poly([L, cy, cx, cy - TH2 * 3, R, cy, cx, B + TH2]).stroke({ width: 3, color: C.ink });
  if (d.size === 2) {
    tiles.poly([cx, cy - TH2 * 2, cx + TW2 * 2, cy, cx, cy + TH2 * 2, cx - TW2 * 2, cy]).fill({ color: 0xffffff, alpha: 0.18 });
  } else tiles.poly([cx, cy - TH2, cx + TW2, cy, cx, cy + TH2, cx - TW2, cy]).fill({ color: 0xffffff, alpha: 0.22 });
  dio.addChild(tiles);
  const big = decorArt(d.id);
  big.c.scale.set(d.size === 2 ? 0.95 : 1.45);
  big.c.position.set(cx, cy + (d.size === 2 ? 0 : 0));
  dio.addChild(big.c);
  if (!decorUnlocked(d)) big.c.alpha = 0.25;
  const pvTag = chip('VISTA PREVIA', C.ink, C.paper, 16);
  pvTag.position.set(14, 14);
  dio.addChild(pvTag);
  if (biomes.length > 1) {
    const bt = chip(`SUELO: ${biomeLabel(biomes[biomeIdx])}  ›`, C.paper, C.ink, 16);
    bt.position.set(rightW - bt.width - 14, 14);
    bt.eventMode = 'static';
    bt.cursor = 'pointer';
    bt.on('pointertap', () => {
      sfx('pop');
      biomeIdx = (biomeIdx + 1) % biomes.length;
      ctx.refresh(sel);
    });
    dio.addChild(bt);
  }
  const dm = new Graphics().rect(0, 0, rightW, dioH).fill(0xffffff);
  dio.addChild(dm);
  dio.mask = dm;
  pv.addChild(dio);

  let y = dioH + 14;
  const name = t(d.name.toUpperCase(), 38, C.ink, F.poster);
  name.position.set(20, y);
  fit(name, rightW - 40);
  pv.addChild(name);
  y += 48;
  const chips: Container[] = [chip(d.dim, d.color, [0x171317, 0x1f2b4a, 0x204a7a, 0x3569a3, 0x5c3d5b, 0x8a5cff, 0xc8102e, 0xb3202a, 0xff2e88].includes(d.color) ? C.paper : C.ink, 16)];
  if (d.set) chips.push(chip(`SET ${DECOR_SETS[d.set].name}`, C.ink, C.paper, 16));
  if (d.size === 2) chips.push(chip('2×2 CASILLAS', C.paper, C.ink, 16));
  let cxp = 20;
  for (const c of chips) {
    c.position.set(cxp, y);
    cxp += c.width + 8;
    pv.addChild(c);
  }
  y += 34;
  const blurb = para(`«${d.blurb}»`, rightW - 40, 16, C.inkBlue, { fontStyle: 'italic' });
  blurb.position.set(20, y);
  pv.addChild(blurb);
  y += blurb.height + 10;
  // set progress
  if (d.set) {
    const sp = setProgress(d.set);
    const info = DECOR_SETS[d.set];
    const done = setComplete(d.set);
    const box = new Container();
    const bh = 116;
    box.addChild(new Graphics().rect(0, 0, rightW - 40, bh).fill(done ? C.mint : C.paperDark).stroke({ width: 3, color: C.ink }));
    const tt = t(`${info.name} · ${sp.have}/${sp.total} COLOCADAS`, 20, C.ink, F.bebas, { letterSpacing: 1 });
    tt.position.set(12, 6);
    const bt = t(done ? `ACTIVO: ${info.bonus}` : `Bono al colocar las ${sp.total}: ${info.bonus}`, 15, done ? C.ink : C.inkBlue);
    bt.position.set(12, 32);
    fit(bt, rightW - 70);
    box.addChild(tt, bt);
    setPieces(d.set).forEach((p, k) => {
      const slot = new Graphics().rect(12 + k * 66, 58, 58, 50).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ width: 2, color: C.ink, alpha: 0.4 });
      box.addChild(slot);
      const mini = decorArt(p.id);
      const mb = mini.c.getLocalBounds();
      mini.c.scale.set(Math.min(0.42, 42 / Math.max(1, mb.height), 50 / Math.max(1, mb.width)));
      mini.c.position.set(41 + k * 66, 104);
      const ok = placedCount(p.id) > 0;
      if (!ok) mini.c.alpha = 0.28;
      box.addChild(mini.c);
      if (ok) {
        const ck = new Graphics().circle(64 + k * 66, 62, 9).fill(C.green).stroke({ width: 2, color: C.ink });
        ck.moveTo(59 + k * 66, 62).lineTo(63 + k * 66, 66).lineTo(69 + k * 66, 58).stroke({ width: 2.5, color: C.paper });
        box.addChild(ck);
      }
    });
    box.position.set(20, y);
    pv.addChild(box);
    y += bh + 12;
  }
  // stock
  const st = stored(d.id);
  const pl = placedCount(d.id);
  const stock = t(`Baúl: ${st} · En la isla: ${pl} · +XP de Reino al comprar el primero`, 15, C.ink);
  fit(stock, rightW - 40);
  stock.position.set(20, y);
  pv.addChild(stock);

  // buttons
  const bw = rightW - 40;
  const price = decorPrice(d);
  const ok = canAfford(d);
  const unlocked = decorUnlocked(d);
  const btns: Btn[] = [];
  const bottom = ctx.h - 20;
  if (!unlocked) {
    const lb = new Btn(`SE DESBLOQUEA EN ${unlockText(d)}`, () => undefined, { w: bw, h: 64, color: C.ink, fg: C.yellow, disabled: true, size: 26 });
    btns.push(lb);
  } else {
    const onIsland = islandDecorMounted();
    const main = new Btn(onIsland ? 'COMPRAR Y COLOCAR' : 'COMPRAR', () => {
      if (buying()) return;
      if (!canAfford(d)) {
        sfx('error');
        toast(d.cur === 'gems' ? 'Te faltan Ojos de Gato' : 'Te faltan Doblones', { sub: d.cur === 'gems' ? 'Las gemas se ganan con jefes, Catdex, hitos y secretos.' : 'Recolecta tus hábitats o gana batallas.', color: C.paper });
        return;
      }
      if (onIsland) {
        ctx.close();
        requestPlacement({ kind: 'decor', id: d.id, buy: true }, () => void import('../Shop').then((m) => m.openShop('decoracion', d.id)));
        return;
      }
      buyToChest(ctx, d, big.c);
    }, { w: bw, h: 70, color: C.pinkHot, fg: C.paper, size: 32, price: { cur: d.cur, v: price, ok } });
    btns.push(main);
    const n = (onIsland ? 1 : 0) + (st > 0 ? 2 : 0);
    const ew = n ? Math.floor((bw - 12 * (n - 1)) / n) : bw;
    if (onIsland) {
      const chest = new Btn(st > 0 ? 'AL BAÚL' : 'COMPRAR AL BAÚL', () => {
        if (buying()) return;
        buyToChest(ctx, d, big.c);
      }, { w: ew, h: 54, color: C.paper, fg: C.ink, size: 24 });
      btns.push(chest);
    }
    if (st > 0) {
      const place = new Btn(`COLOCAR (${st})`, () => {
        if (!islandDecorMounted()) {
          toast('Ve a la isla para colocarlo', { sub: 'La decoración se coloca sobre tu isla.', color: C.paper });
          return;
        }
        ctx.close();
        requestPlacement({ kind: 'decor', id: d.id }, () => void import('../Shop').then((m) => m.openShop('decoracion', d.id)));
      }, { w: ew, h: 54, color: C.mint, fg: C.ink, size: 24 });
      const sell = new Btn(`VENDER +${fmt(sellPrice(d))}`, () => {
        const got = sellDecor({ id: d.id });
        if (got > 0) {
          sfx('coin', 1.2);
          toast(`Vendido: ${d.name}`, { sub: `+${fmt(got)} ${d.cur === 'gems' ? 'Ojos de Gato' : 'Doblones'} (50% del precio).`, icon: d.cur === 'gems' ? 'gem' : 'gold' });
          ctx.refresh(d.id);
        }
      }, { w: ew, h: 54, color: C.yellow, fg: C.ink, size: 22 });
      btns.push(place, sell);
    }
  }
  // main button at the bottom, the extras in one row above it
  const main = btns[0];
  main.position.set(20, bottom - main.bh);
  pv.addChild(main);
  let ex = 20;
  for (const b of btns.slice(1)) {
    b.position.set(ex, bottom - main.bh - 16 - 54);
    pv.addChild(b);
    ex += b.bw + 12;
  }

  let time = 0;
  const tick = (tk: Ticker) => {
    time += tk.deltaMS / 1000;
    big.tick?.(time);
    for (const a of arts) a.tick?.(time);
  };
  Ticker.shared.add(tick);
  gsap.from(big.c.scale, { x: big.c.scale.x * 0.6, y: big.c.scale.y * 1.3, duration: 0.45, ease: 'elastic.out(1.1,0.45)' });
  void G;
  return () => Ticker.shared.remove(tick);
}

function buyToChest(ctx: ShopCtx, d: DecorDef, target: Container) {
  const price = decorPrice(d);
  const r = buyDecor(d.id);
  if (!r.ok) {
    sfx('error');
    toast(d.cur === 'gems' ? 'Te faltan Ojos de Gato' : 'Te faltan Doblones', { color: C.paper });
    return;
  }
  celebrate(ctx, target, d.cur, price, d.name, () => {
    if (r.xp > 0) toast('+XP DE REINO', { sub: `Primer ${d.name}: tu Reino lo celebra.`, icon: 'crown', color: C.mint });
    ctx.refresh(d.id);
  }, { stamp: '¡AL BAÚL!' });
}

function biomeLabel(b: string) {
  return (
    { home: 'CASA', forest: 'BOSQUE', cliff: 'ACANTILADO', volcano: 'VOLCÁN', ghost: 'PUERTO', ice: 'GLACIAR', ruins: 'RUINAS', reef: 'ARRECIFE', cosmic: 'ATOLÓN' } as Record<string, string>
  )[b] ?? b.toUpperCase();
}
