/**
 * F18 · PP «La Encuadernadora» (H83) — a POP-UP BOOK: the cover swings open and paper engineering raises the Library
 * floor by floor from the gutter; a pull-tab slides La Mano's black silhouette into the INDEX; a needle stitches
 * Cerito's pawprint to the page; La Encuadernadora rises, huge, and sews a fairy tale to a pirate book with red thread;
 * three pop-up pages turn — the rule CAPÍTULOS (rain, calm, roots, three turns each, over a real shot from the battle
 * simulator); then the real Library: Canelo stuck in the fold (his flame's shadow trembles on the paper) and her beam
 * lifting him out; the Bitácora. Guion: historia-v2/guiones/acto-3/h83-ex-libris.md (F18-1…F18-7).
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import { Beam, Bitacora, BookFrame, demoShot, fitField, flame, FLAME, kitTex, LB, lanternAt, luzOf, bob, partial, Printed, rnd, seg, sm, springIn, STAND, tailTip, word, env, inkLine, glowSprite, prewarm } from '../kit';
import { RIESGO } from '../textos';

const CARD = 0xf5efe2;
const SHADOW = 0x2a1a0c;

/** a pop-up piece: art standing on its hinge (local y = 0), a die-cut white border, a cast shadow on the page */
class PopCard extends Container {
  readonly art = new Container();
  private shadow = new Container();
  constructor(
    art: Container,
    private w: number,
    private h: number,
    shadowArt?: Container,
  ) {
    super();
    this.art.addChild(art);
    if (shadowArt) {
      this.shadow.addChild(shadowArt);
      shadowArt.tint = SHADOW;
    }
    this.shadow.alpha = 0.32;
    this.addChild(this.shadow, this.art);
  }
  /** k: 0 flat on the page … 1 standing (overshoot allowed) */
  raise(k: number, rm = false) {
    const kk = rm ? Math.min(1, Math.max(0, k)) : k;
    this.visible = kk > 0.01;
    this.art.scale.y = Math.max(0.02, kk);
    this.art.skew.x = (1 - Math.min(1, kk)) * 0.25;
    // the shadow lies on the page, behind: long when the card is low, short when it stands
    this.shadow.scale.set(1, -0.28 * Math.max(0.05, Math.min(1.2, kk)));
    this.shadow.skew.x = -0.9;
    this.shadow.alpha = 0.3 * Math.min(1, kk);
  }
}
/** a card cut from shapes: the shape twice, white and fat (the die-cut border), then the art */
function cutout(draw: (g: Graphics) => void, border = 7): { card: Container; shadow: Container } {
  const card = new Container();
  const edge = new Graphics();
  draw(edge);
  edge.stroke({ width: border * 2, color: 0xffffff, join: 'round' });
  const art = new Graphics();
  draw(art);
  card.addChild(edge, art);
  const sh = new Graphics();
  draw(sh);
  sh.stroke({ width: border * 2, color: 0xffffff, join: 'round' });
  return { card, shadow: sh };
}
/** a cat cut-out: its white silhouette, fattened (die-cut), then the recorte painting; anchor at the feet */
function catCard(ctx: SceneCtx, slug: string, size: number): { card: Container; shadow: Container } | null {
  const st = ctx.still(slug, 0.5, 1);
  const s1 = ctx.silhouette(slug, 0.5, 1);
  const s2 = ctx.silhouette(slug, 0.5, 1);
  if (!st || !s1 || !s2) return null;
  const k = size / st.texture.height;
  st.scale.set(k);
  s1.scale.set(k * 1.045, k * 1.03);
  s2.scale.set(k * 1.045, k * 1.03);
  const card = new Container();
  card.addChild(s1, st);
  return { card, shadow: s2 };
}

/** a bookshelf tier: arches, shelves, book spines in muted watercolours */
function shelfTier(w: number, h: number, seed: number) {
  return (g: Graphics) => {
    const x0 = -w / 2;
    g.moveTo(x0, 0).lineTo(x0, -h * 0.8);
    const arches = Math.max(2, Math.round(w / 220));
    const aw = w / arches;
    for (let i = 0; i < arches; i++) g.arc(x0 + aw * (i + 0.5), -h * 0.8, aw / 2, Math.PI, 0);
    g.lineTo(-x0, 0).closePath().fill(0xe9dcc2);
    // shelves + spines
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      const y = -h * 0.1 - r * h * 0.24;
      for (let i = 0; i < arches; i++) {
        let x = x0 + aw * i + 14;
        while (x < x0 + aw * (i + 1) - 18) {
          const bw = 10 + rnd(x * 0.3 + seed + r) * 14;
          const bh = h * 0.16 + rnd(x + r * 7 + seed) * h * 0.05;
          const cols = [0x8a3a2a, 0x2f4f6a, 0x5a6a3a, 0x9a7a3a, 0x6a3a5a, 0x3a5a5a];
          g.rect(x, y - bh, bw, bh).fill(cols[Math.floor(rnd(x * 1.7 + seed + r * 3) * cols.length)]);
          x += bw + 2;
        }
      }
      g.rect(x0 + 6, y, w - 12, 6).fill(0x7a5232);
    }
    for (let i = 0; i <= arches; i++) g.rect(x0 + aw * i - 5, -h * 0.8, 10, h * 0.8).fill(0x9a7448);
  };
}

/** the open pop-up book seen from a low three-quarter angle: the two pages as the floor, the fold receding */
function bookFloor(ctx: SceneCtx): Container {
  const c = new Container();
  const g = new Graphics();
  // the desk
  g.rect(-400, -300, 2720, 1700).fill(0x2a1a10);
  for (let i = 0; i < 26; i++) g.rect(-400, -300 + i * 66, 2720, 3).fill({ color: 0x1a0e06, alpha: 0.5 });
  // the boards (leather) under the pages
  g.poly([-180, 1180, 2100, 1180, 1620, 540, 300, 540]).fill(0x5a2418);
  // the pages: two trapezoids meeting at the fold
  g.poly([-120, 1160, 960, 1180, 960, 560, 340, 572]).fill(CARD);
  g.poly([960, 1180, 2040, 1160, 1580, 572, 960, 560]).fill(0xf0e8d8);
  // page stack edges
  for (let i = 1; i < 5; i++) {
    g.moveTo(340 - i * 6, 572 + i * 4).lineTo(-120 - i * 8, 1160 + i * 4).stroke({ width: 1.5, color: 0xbfae8a });
    g.moveTo(1580 + i * 6, 572 + i * 4).lineTo(2040 + i * 8, 1160 + i * 4).stroke({ width: 1.5, color: 0xbfae8a });
  }
  // the fold's shadow
  g.poly([930, 1180, 990, 1180, 966, 560, 954, 560]).fill({ color: 0x5a4020, alpha: 0.25 });
  c.addChild(g);
  const t = ctx.tex('pp:card');
  if (t) {
    const f = new TilingSprite({ texture: t, width: 2200, height: 640 });
    f.position.set(-140, 556);
    f.blendMode = 'multiply';
    f.alpha = 0.7;
    const m = new Graphics().poly([-120, 1160, 960, 1180, 2040, 1160, 1580, 572, 960, 560, 340, 572]).fill(0xffffff);
    f.mask = m;
    c.addChild(f, m);
  }
  return c;
}

/** a banner card with a title (the pop-up's own captions) */
function banner(ctx: SceneCtx, text: string, o: { size?: number; w?: number; cap?: boolean; color?: number } = {}): Container {
  const c = new Container();
  const size = o.size ?? 46;
  const t = word(ctx.k, text, { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: size, fill: o.color ?? LB.sepia, letterSpacing: 3, align: 'center', wordWrap: true, wordWrapWidth: o.w ?? 1300, lineHeight: size * 1.15 });
  const w = Math.max(t.width + 90, 300);
  const h = t.height + 46;
  const g = new Graphics();
  g.roundRect(-w / 2 + 6, -h / 2 + 8, w, h, 10).fill({ color: 0x000000, alpha: 0.28 });
  g.roundRect(-w / 2, -h / 2, w, h, 10).fill(0xfbf6ea).roundRect(-w / 2, -h / 2, w, h, 10).stroke({ width: 3, color: LB.sepia });
  g.roundRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 6).stroke({ width: 1.5, color: LB.sepiaL });
  // two little paper tabs (the pull-tab look)
  g.poly([-w / 2 - 30, -12, -w / 2, -22, -w / 2, 22, -w / 2 - 30, 12]).fill(0xe8d8b8).stroke({ width: 2, color: LB.sepiaL });
  g.poly([w / 2 + 30, -12, w / 2, -22, w / 2, 22, w / 2 + 30, 12]).fill(0xe8d8b8).stroke({ width: 2, color: LB.sepiaL });
  c.addChild(g, t);
  return c;
}

/** the illuminated capital title: a blackletter initial + the rest in caps */
function capitular(ctx: SceneCtx, text: string, sub?: string): Container {
  const c = new Container();
  const ini = word(ctx.k, text[0], { fontFamily: 'UnifrakturMaguntia', fontSize: 150, fill: 0x8a2a1a, stroke: { color: 0xf0d080, width: 4 } });
  const rest = word(ctx.k, text.slice(1), { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 74, fill: 0xf0d080, letterSpacing: 10, stroke: { color: 0x2a1a0e, width: 6 } }, 0);
  rest.anchor.set(0, 0.5);
  const bw = ini.width + rest.width + 30;
  const box = new Graphics();
  box.rect(-ini.width / 2 - 14, -86, ini.width + 28, 160).fill(0xf0d080).stroke({ width: 3, color: 0x8a2a1a });
  ini.position.set(0, -4);
  rest.position.set(ini.width / 2 + 24, 6);
  const row = new Container();
  row.addChild(box, ini, rest);
  row.position.set(-bw / 2 + ini.width / 2, 0);
  c.addChild(row);
  if (sub) {
    const s = word(ctx.k, sub, { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 42, fill: 0xf2e8d2, letterSpacing: 4, stroke: { color: 0x2a1a0e, width: 5 } });
    s.position.set(0, 96);
    c.addChild(s);
  }
  return c;
}

// ------------------------------------------------------------------ the scenes
const mod: SetModule = {
  cats: ({ canelo, scene }) => {
    if (scene === 'libro') return [{ slug: STAND.mano, bake: 'recorte' }];
    if (scene === 'aguja') return [STAND.cerito];
    if (scene === 'rival') return [STAND.encuadernadora];
    if (scene === 'pliegue') return [{ slug: canelo, bake: 'libros' }, { slug: 'luzterna', bake: 'libros' }];
    return [];
  },
  async build(ctx: SceneCtx): Promise<FilmSet> {
    switch (ctx.scene.id) {
      case 'libro':
        return libro(ctx);
      case 'aguja':
        return aguja(ctx);
      case 'rival':
        return rival(ctx);
      case 'cap1':
      case 'cap2':
      case 'cap3':
        return capitulo(ctx, ctx.scene.id === 'cap1' ? 0 : ctx.scene.id === 'cap2' ? 1 : 2);
      default:
        return pliegue(ctx);
    }
  },
};
export default mod;

/** F18-1 + F18-2: the cover opens; the Library rises; a tab slides La Mano into the index */
function libro(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  ctx.plane(bookFloor(ctx), { z: 1150, bake: 'static' });
  // the tiers (back → front), each a pop-up card standing on the fold line at its depth
  const back = new Container();
  const mid = new Container();
  const front = new Container();
  // the great window at the back (light of a stained glass from very high)
  const win = cutout((g) => {
    g.moveTo(-170, 0).lineTo(-170, -330).arc(0, -330, 170, Math.PI, 0).lineTo(170, 0).closePath().fill(0xcfe0e8);
    for (let i = -2; i <= 2; i++) g.rect(i * 62 - 3, -480, 6, 480).fill(0x6a5a4a);
    g.rect(-170, -200, 340, 6).fill(0x6a5a4a);
  });
  const winC = new PopCard(win.card, 340, 500, win.shadow);
  winC.position.set(960, 600);
  winC.scale.set(0.62);
  back.addChild(winC);
  const tiers: PopCard[] = [];
  const T = [
    { y: 612, w: 900, h: 300, s: 0.6 },
    { y: 700, w: 1000, h: 320, s: 0.78 },
    { y: 820, w: 1080, h: 340, s: 0.96 },
  ];
  // the index's little door, on the middle tier
  T.forEach((t, i) => {
    const cc = cutout(shelfTier(t.w, t.h, i * 31 + 4));
    const pc = new PopCard(cc.card, t.w, t.h, cc.shadow);
    pc.position.set(960, t.y);
    pc.scale.set(t.s);
    (i === 0 ? back : i === 1 ? mid : front).addChild(pc);
    tiers.push(pc);
  });
  // the door to the INDEX at the back, between the shelves
  const door = cutout((g) => {
    g.moveTo(-70, 0).lineTo(-70, -150).arc(0, -150, 70, Math.PI, 0).lineTo(70, 0).closePath().fill(0x1a120c);
  });
  const doorC = new PopCard(door.card, 140, 220, door.shadow);
  doorC.position.set(1650, 860);
  doorC.scale.set(1.05);
  const doorLabel = word(ctx.k, 'ÍNDICE', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 30, fill: 0xf0d080, letterSpacing: 6, stroke: { color: 0x2a1a0e, width: 5 } });
  doorLabel.position.set(1650, 580);
  // La Mano in black cut paper riding a slot toward the door
  const manoSil = ctx.stillAs('recorte', STAND.mano, 0.5, 1);
  const manoC = new Container();
  if (manoSil) {
    manoSil.scale.set(150 / manoSil.texture.height);
    manoSil.tint = 0x0c0a0a;
    manoC.addChild(manoSil);
  }
  const slot = new Graphics().roundRect(1380, 856, 300, 10, 5).fill({ color: 0x3a2a1a, alpha: 0.7 });
  // the pull-tab on the right page's edge (TIRE →)
  const tab = new Container();
  const tg = new Graphics().roundRect(-10, -34, 190, 68, 10).fill(0xe8d4a8).stroke({ width: 3, color: LB.sepia });
  tg.poly([150, -18, 178, 0, 150, 18]).fill(LB.sepia);
  const tt = word(ctx.k, 'TIRE', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 30, fill: LB.sepia, letterSpacing: 4 });
  tt.position.set(70, 0);
  tab.addChild(tg, tt);
  tab.position.set(1660, 1000);
  front.addChild(slot, manoC, doorC, doorLabel, tab);
  ctx.plane(back, { z: 1500 });
  ctx.plane(mid, { z: 1250 });
  ctx.plane(front, { z: 1000 });
  // the title (printed on the book's own page) and the captions
  const title = capitular(ctx, 'EX LIBRIS', 'el taller de encuadernación');
  title.position.set(960, 210);
  const cap = new Printed(ctx.k, 'print', 'LA MANO SE ESCONDE DONDE LA TINTA OBEDECE', { size: 40, align: 0.5, w: 1500, plate: 0xfbf6ea });
  cap.position.set(960, 120);
  const ui = new Container();
  ui.addChild(title, cap);
  ctx.plane(ui, { z: 0, screen: true });
  // the cover: a leather board with the gold title that swings open toward the camera
  const cover = new Container();
  const cg = new Graphics();
  cg.rect(0, -100, 1920, 1280).fill(0x5a2418);
  cg.roundRect(140, 90, 1640, 900, 18).stroke({ width: 8, color: 0xc8a050 });
  cg.roundRect(170, 120, 1580, 840, 12).stroke({ width: 3, color: 0xc8a050 });
  for (let i = 0; i < 60; i++) cg.circle(rnd(i) * 1920, rnd(i + 9) * 1080, 30 + rnd(i + 3) * 60).fill({ color: 0x3a140c, alpha: 0.12 });
  const ct = word(ctx.k, 'EX LIBRIS', { fontFamily: 'UnifrakturMaguntia', fontSize: 190, fill: 0xe8c060, stroke: { color: 0x6a4010, width: 6 } });
  ct.position.set(960, 520);
  cover.addChild(cg, ct);
  ctx.plane(cover, { z: 0, screen: true });
  prewarm(ctx, back, mid, front, ui, cover);
  return {
    update(lt) {
      // the cover swings (0.25 → 1.5 s): its far edge folds toward the left as it lifts
      const cp = rm ? sm(seg(lt, 0.3, 1.2)) : sm(seg(lt, 0.25, 1.5));
      cover.visible = cp < 0.999;
      if (rm) {
        cover.alpha = 1 - cp;
        cover.scale.set(1);
      } else {
        cover.scale.x = 1 - cp;
        cover.skew.y = -cp * 0.25;
        cover.alpha = 1 - sm(seg(cp, 0.75, 1));
      }
      // floor by floor (1.0 → 3.6 s), each with a paper spring
      const at = [0.95, 1.6, 2.25];
      winC.raise(springIn(seg(lt, 0.7, 1.7)), rm);
      tiers.forEach((t, i) => t.raise(springIn(seg(lt, at[i], at[i] + 1.1)), rm));
      doorC.raise(springIn(seg(lt, 1.3, 2.2)), rm);
      doorLabel.alpha = sm(seg(lt, 2.0, 2.6));
      // the title, then the caption (F18-2)
      title.alpha = env(lt, 1.4, 4.6, 0.5, 0.6);
      title.scale.set(1 + (rm ? 0 : 0.03 * seg(lt, 1.4, 4.6)));
      cap.update(seg(lt, 5.1, 6.6), env(lt, 5.0, 9.6, 0.3, 0.5));
      // the tab pulls itself (4.6 → 6.2) and the slot carries her into the index (4.8 → 8.0)
      const tp = sm(seg(lt, 4.6, 6.2));
      tab.x = 1660 + tp * 90;
      const mp = sm(seg(lt, 4.9, 8.2));
      manoC.visible = lt > 4.5 && mp < 0.995;
      manoC.position.set(1400 + mp * 250, 858);
      manoC.alpha = sm(seg(mp, 0, 0.12)) * (1 - sm(seg(mp, 0.82, 1)));
      manoC.scale.set(1.5 - mp * 0.35);
    },
    anchor: (n) => (n === 'door' ? [1210, 560] : null),
  };
}

/** F18-3: a detail of the fold — Cerito's pawprint tries to hop across; a needle stitches it down with red thread */
function aguja(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const page = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 1180, 1480).fill(CARD).rect(960, -200, 1160, 1480).fill(0xf0e8d8);
  g.rect(900, -200, 120, 1480).fill({ color: 0x5a4020, alpha: 0.12 });
  g.rect(944, -200, 32, 1480).fill({ color: 0x5a4020, alpha: 0.18 });
  // faint printed lines of text on the pages (a book)
  for (let i = 0; i < 14; i++) {
    g.rect(140, 120 + i * 62, 660 - (i % 4 === 3 ? 260 : 0), 6).fill({ color: LB.sepia, alpha: 0.12 });
    g.rect(1120, 120 + i * 62, 660 - (i % 5 === 4 ? 300 : 0), 6).fill({ color: LB.sepia, alpha: 0.12 });
  }
  page.addChild(g);
  const t = ctx.tex('pp:card');
  if (t) {
    const f = new TilingSprite({ texture: t, width: 2320, height: 1480 });
    f.position.set(-200, -200);
    f.blendMode = 'multiply';
    page.addChild(f);
  }
  ctx.plane(page, { z: 1000, bake: 'static' });
  // the pawprint (a little card of static: four toes and a pad) — Cerito's
  const paw = new Container();
  const pg = new Graphics();
  const pawShape = (q: Graphics) => {
    q.ellipse(0, 0, 46, 38);
    for (const [x, y] of [
      [-44, -50],
      [-15, -68],
      [17, -68],
      [45, -50],
    ] as const)
      q.ellipse(x, y, 16, 20);
  };
  pawShape(pg);
  pg.fill(0xffffff).stroke({ width: 12, color: 0xffffff });
  const noise = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 260, height: 240 });
  noise.position.set(-130, -120);
  const nm = new Graphics();
  pawShape(nm);
  nm.fill(0xffffff);
  noise.mask = nm;
  noise.tint = 0xb8bcd0;
  paw.addChild(pg, noise, nm);
  const pawShadow = new Graphics();
  pawShape(pawShadow);
  pawShadow.fill({ color: SHADOW, alpha: 0.25 });
  const thread = new Graphics();
  const needle = new Container();
  const ng = new Graphics();
  ng.poly([0, 0, 7, -10, 7, -360, -7, -360, -7, -10]).fill(0xd8dce4).stroke({ width: 2, color: 0x6a707a });
  ng.ellipse(0, -330, 3, 14).fill(CARD);
  needle.addChild(ng);
  const live = new Container();
  live.addChild(pawShadow, paw, thread, needle);
  ctx.plane(live, { z: 1000 });
  const cap = new Printed(ctx.k, 'print', 'SI ESCRIBE, PUEDE ATRAPARLO', { size: 46, align: 0.5, w: 1500, plate: 0xfbf6ea });
  cap.position.set(960, 110);
  ctx.plane(cap, { z: 0, screen: true });
  prewarm(ctx, live, cap);
  return {
    update(lt) {
      // hop (0.2 → 1.6 s): from the left page toward the fold … the needle comes down (1.5) and stitches (1.8 → 3.4)
      const hop = seg(lt, 0.2, 1.6);
      const x = 640 + hop * 220;
      const h = rm ? 0 : Math.sin(hop * Math.PI) * 120;
      const stopped = lt > 1.6;
      const wig = stopped && !rm ? Math.sin(lt * 30) * 3 * env(lt, 1.6, 3.6, 0.1, 0.3) : 0;
      paw.position.set(x + wig, 640 - h);
      paw.rotation = rm ? 0 : -0.15 + hop * 0.3;
      pawShadow.position.set(x + 8, 652);
      pawShadow.scale.set(1 - h / 400);
      noise.tilePosition.set(rnd(Math.floor(lt * 12)) * 200, rnd(Math.floor(lt * 12) + 3) * 200);
      // the needle: down, up, down, up (two cross stitches)
      const ns = seg(lt, 1.5, 3.4);
      const phase = ns * 4;
      const dip = Math.abs(Math.sin(phase * Math.PI));
      const nx = x - 40 + Math.floor(phase) * 26;
      needle.visible = lt > 1.4 && lt < 3.8;
      needle.position.set(nx + 60, 560 + (rm ? 0.5 : dip) * 110 - (1 - sm(seg(lt, 1.4, 1.7))) * 300);
      needle.rotation = 0.35;
      // the red thread: an X over the paw, drawn as the needle goes
      const th = thread.clear();
      const k = sm(ns);
      if (k > 0) {
        const pts1: [number, number][] = [
          [x - 70, 560],
          [x + 70, 700],
        ];
        const pts2: [number, number][] = [
          [x + 70, 560],
          [x - 70, 700],
        ];
        inkLine(th, partial(pts1, Math.min(1, k * 2)), { width: 7, color: LB.red, amp: 1 });
        if (k > 0.5) inkLine(th, partial(pts2, (k - 0.5) * 2), { width: 7, color: LB.red, amp: 1 });
      }
      cap.update(seg(lt, 0.6, 2.0), env(lt, 0.5, 4.2, 0.3, 0.4));
    },
  };
}

/** F18-4: La Encuadernadora rises from the fold and sews two tales together with red thread */
function rival(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  ctx.plane(bookFloor(ctx), { z: 1150, bake: 'static' });
  const st = new Container();
  const enc = catCard(ctx, STAND.encuadernadora, 620);
  const encC = enc ? new PopCard(enc.card, 600, 620, enc.shadow) : null;
  // (her painting carries her own needle and red thread: the stand-in's code-drawn needles and spool are gone)
  const extra = new Graphics();
  if (encC) {
    encC.art.addChild(extra);
    encC.position.set(960, 860);
    st.addChild(encC);
  }
  // the two tales: a fairy tale (castle, pink and blue) and a pirate book (black flag), sewn by a red zig-zag
  const tales = new Container();
  const fairy = cutout((g) => {
    g.rect(-160, -220, 320, 220).fill(0xe8b8c8);
    g.rect(-120, -320, 60, 110).fill(0xb8c8e8).rect(60, -320, 60, 110).fill(0xb8c8e8).rect(-50, -380, 100, 170).fill(0xc8d4ec);
    g.poly([-130, -320, -90, -380, -50, -320]).fill(0x6a7ab8).poly([50, -320, 90, -380, 130, -320]).fill(0x6a7ab8).poly([-60, -380, 0, -460, 60, -380]).fill(0x6a7ab8);
  });
  const pirate = cutout((g) => {
    g.rect(-160, -220, 320, 220).fill(0x3a3430);
    g.rect(-8, -420, 12, 220).fill(0x6a4a2a);
    g.poly([4, -420, 150, -400, 140, -320, 4, -330]).fill(0x101010);
    g.circle(70, -372, 18).fill(0xf0f0f0).rect(52, -352, 36, 10).fill(0xf0f0f0);
  });
  const fC = new PopCard(fairy.card, 320, 460, fairy.shadow);
  const pC = new PopCard(pirate.card, 320, 460, pirate.shadow);
  fC.position.set(560, 940);
  pC.position.set(1360, 940);
  fC.scale.set(0.8);
  pC.scale.set(0.8);
  const thread = new Graphics();
  tales.addChild(fC, pC, thread);
  ctx.plane(tales, { z: 960 });
  ctx.plane(st, { z: 1100 });
  const name = banner(ctx, 'LA ENCUADERNADORA', { size: 64 });
  name.position.set(960, 150);
  const sub = new Printed(ctx.k, 'print', 'cose historias a la fuerza', { size: 38, align: 0.5, fill: LB.sepiaL });
  sub.position.set(960, 238);
  const ui = new Container();
  ui.addChild(name, sub);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, st, tales, ui);
  return {
    update(lt) {
      encC?.raise(springIn(seg(lt, 0.15, 1.5), 1.8, 4.5), rm);
      fC.raise(springIn(seg(lt, 0.6, 1.5)), rm);
      pC.raise(springIn(seg(lt, 0.8, 1.7)), rm);
      // the tales are pulled together while she sews
      const pull = sm(seg(lt, 2.0, 4.8));
      fC.x = 560 + pull * 150;
      pC.x = 1360 - pull * 150;
      const g = thread.clear();
      const k = seg(lt, 1.8, 4.8);
      if (k > 0) {
        const pts: [number, number][] = [];
        const n = 9;
        for (let i = 0; i <= n; i++) pts.push([fC.x + 110 + (pC.x - fC.x - 220) * (i % 2), 790 + i * 16]);
        inkLine(g, partial(pts, k), { width: 6, color: LB.red, amp: 0.8 });
      }
      if (encC) encC.art.rotation = rm ? 0 : Math.sin(lt * 5) * 0.02 * env(lt, 1.8, 4.8, 0.3, 0.3);
      name.alpha = env(lt, 0.9, 5.6, 0.3, 0.4);
      name.scale.set(rm ? 1 : 0.92 + 0.08 * springIn(seg(lt, 0.9, 1.6)));
      sub.update(seg(lt, 1.6, 2.6), env(lt, 1.5, 5.6, 0.2, 0.4));
    },
  };
}

/** F18-5: one pop-up page per chapter — Lluvia / Calma / Raíz, three turns each, over a real shot */
async function capitulo(ctx: SceneCtx, which: 0 | 1 | 2): Promise<FilmSet> {
  const rm = ctx.rm;
  const demo = await demoShot();
  const page = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 2320, 1480).fill(which === 1 ? 0xf3ecdc : CARD);
  g.rect(930, -200, 60, 1480).fill({ color: 0x5a4020, alpha: 0.14 });
  page.addChild(g);
  const t = ctx.tex('pp:card');
  if (t) {
    const f = new TilingSprite({ texture: t, width: 2320, height: 1480 });
    f.position.set(-200, -200);
    f.blendMode = 'multiply';
    page.addChild(f);
  }
  ctx.plane(page, { z: 1000, bake: 'static' });
  const titles = ['Capítulo I: Lluvia', 'Capítulo II: Calma', 'Capítulo III: Raíz'];
  const head = banner(ctx, titles[which], { size: 56 });
  head.position.set(960, 150);
  // the little battle on the page: two paper ships and the sea, and the real shot as a red dotted thread
  const field = new Container();
  const R: [number, number, number, number] = [250, 300, 1420, 700];
  const pts = demo ? fitField(demo.pts, R) : ([] as [number, number][]);
  const waterY = demo ? fitField([[0, demo.field.waterY]], R)[0][1] : 780;
  const sx = (x: number) => (demo ? fitField([[x, 0]], R)[0][0] : x);
  const shipCard = (x0: number, x1: number, flip: boolean) =>
    cutout((q) => {
      const w = x1 - x0;
      q.poly([0, 0, w, 0, w - 30, 60, 30, 60]).fill(flip ? 0x8a4a3a : 0x3a5a7a);
      q.rect(w / 2 - 5, -170, 10, 170).fill(0x6a4a2a);
      q.poly([w / 2 + 5, -160, w / 2 + 5 + (flip ? -1 : 1) * 90, -60, w / 2 + 5, -40]).fill(0xf6f0e0);
    });
  const P = demo ? demo.field.player : { x0: 260, x1: 620 };
  const E = demo ? demo.field.enemy : { x0: 1300, x1: 1660 };
  const s1 = shipCard(sx(P.x0), sx(P.x1), false);
  const s2 = shipCard(sx(E.x0), sx(E.x1), true);
  const ship1 = new PopCard(s1.card, 0, 0, s1.shadow);
  const ship2 = new PopCard(s2.card, 0, 0, s2.shadow);
  ship1.position.set(sx(P.x0), waterY - 30);
  ship2.position.set(sx(E.x0), waterY - 30);
  // the sea: strips of paper waves (Calma lays them down)
  const waves: PopCard[] = [];
  for (let i = 0; i < 6; i++) {
    const wv = cutout((q) => {
      q.moveTo(-200, 0);
      for (let j = 0; j <= 8; j++) q.quadraticCurveTo(-200 + j * 50 - 25, -40 - (j % 2) * 20, -200 + j * 50, 0);
      q.lineTo(200, 30).lineTo(-200, 30).closePath().fill(i % 2 ? 0x6a9ab8 : 0x5a8aa8);
    }, 5);
    const wc = new PopCard(wv.card, 400, 60, wv.shadow);
    wc.position.set(380 + i * 240, waterY + 10 + (i % 2) * 30);
    waves.push(wc);
  }
  const shot = new Graphics();
  field.addChild(ship1, ship2, ...waves, shot);
  // the chapter's own thing: raindrops / roots
  const drops: Graphics[] = [];
  const roots = new Graphics();
  const cloud = new Container();
  if (which === 0) {
    const cl = cutout((q) => {
      for (const [x, y, r] of [
        [-120, 0, 70],
        [-30, -40, 90],
        [80, -10, 75],
        [160, 10, 55],
      ] as const)
        q.circle(x, y, r);
      q.fill(0xc8ccd4);
    });
    cloud.addChild(cl.card);
    cloud.position.set(960, 360);
    for (let i = 0; i < 14; i++) {
      const d = new Graphics().poly([0, -26, 13, 4, 0, 16, -13, 4]).fill(0x6a9ac8).stroke({ width: 5, color: 0xffffff });
      drops.push(d);
      field.addChild(d);
    }
    field.addChild(cloud);
  }
  if (which === 2) field.addChild(roots);
  ctx.plane(field, { z: 1000 });
  // the turn counter: 3 notches that fill (●●●), then the page turns
  const counter = new Container();
  const cg = new Graphics();
  const ct = word(ctx.k, '3 TURNOS', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 34, fill: LB.sepia, letterSpacing: 4 });
  ct.position.set(0, -52);
  counter.addChild(ct, cg);
  counter.position.set(1640, 960);
  const sign = which === 2 ? banner(ctx, 'CAPÍTULOS: CADA 3 TURNOS, OTRA REGLA', { size: 40, color: LB.red }) : null;
  const ui = new Container();
  ui.addChild(head, counter);
  if (sign) {
    sign.position.set(820, 980);
    ui.addChild(sign);
  }
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, field, ui);
  const D = ctx.dur;
  return {
    update(lt) {
      for (const [i, w] of waves.entries()) {
        const up = springIn(seg(lt, 0.05 + i * 0.05, 0.7 + i * 0.05));
        // Calma: the waves lie down flat after rising
        const flat = which === 1 ? 1 - 0.85 * sm(seg(lt, 0.9, 1.8)) : 1;
        w.raise(up * flat, rm);
        w.y = waterY + 10 + (i % 2) * 30 + (which === 1 || rm ? 0 : Math.sin(lt * 3 + i) * 4);
      }
      ship1.raise(springIn(seg(lt, 0.15, 0.8)), rm);
      ship2.raise(springIn(seg(lt, 0.25, 0.9)), rm);
      const sway = which === 1 || rm ? 0 : Math.sin(lt * 2.6) * 0.04;
      ship1.rotation = sway;
      ship2.rotation = -sway;
      // the real shot, drawn as it flies (red dotted thread)
      const sg = shot.clear();
      const k = seg(lt, 0.6, 1.8);
      if (k > 0 && pts.length > 1) {
        const pp = partial(pts, k);
        for (let i = 0; i < pp.length; i += 2) sg.circle(pp[i][0], pp[i][1], 4).fill(LB.red);
        const e = pp[pp.length - 1];
        sg.circle(e[0], e[1], 12).fill({ color: LB.red, alpha: 0.9 });
      }
      if (which === 0) {
        cloud.visible = true;
        cloud.scale.set(rm ? 1 : springIn(seg(lt, 0.0, 0.6)));
        drops.forEach((d, i) => {
          const ph = (lt * 1.6 + rnd(i) * 1.0) % 1;
          d.position.set(760 + rnd(i * 3) * 420, 420 + ph * (waterY - 440));
          d.alpha = lt > 0.4 ? 1 - ph * 0.3 : 0;
          d.scale.set(rm ? 1 : 1 + Math.sin(ph * Math.PI) * 0.15);
        });
      }
      if (which === 2) {
        const rg = roots.clear();
        const gk = sm(seg(lt, 0.5, 2.0));
        for (let r = 0; r < 5; r++) {
          const bx = 300 + r * 280;
          const pts2: [number, number][] = [];
          for (let j = 0; j <= 10; j++) pts2.push([bx + Math.sin(j * 0.9 + r) * 50, waterY + 40 - j * 18 + (j > 6 ? (j - 6) * 22 : 0)]);
          inkLine(rg, partial(pts2, gk), { width: 16 - r % 2 * 4, color: 0x6a4a28, amp: 2, seed: r });
        }
      }
      // ●○○ → ●●○ → ●●● across the page
      const n = Math.min(3, Math.floor(seg(lt, 0.3, D - 0.6) * 3.0001) + (lt > 0.3 ? 1 : 0));
      cg.clear();
      for (let i = 0; i < 3; i++) {
        cg.circle(-50 + i * 50, 0, 17).stroke({ width: 4, color: LB.sepia });
        if (i < n) cg.circle(-50 + i * 50, 0, 11).fill(LB.red);
      }
      head.alpha = sm(seg(lt, 0.1, 0.4));
      if (sign) sign.alpha = sm(seg(lt, 0.3, 0.8));
    },
  };
}

/** F18-6 + F18-7: the real Library — Canelo stuck in the fold, his flame's shadow on the paper, her beam lifts him;
 * the Bitácora */
function pliegue(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const bg = new Container();
  const g = new Graphics();
  // the Library's watercolour: a warm wall of shelves far away, the giant pop-up book on the floor
  g.rect(-300, -300, 2520, 900).fill(0xb89a6a);
  for (let i = 0; i < 9; i++) {
    const x = -260 + i * 280;
    g.rect(x, -200, 240, 760).fill({ color: 0x8a6a42, alpha: 0.55 });
    for (let r = 0; r < 5; r++) for (let j = 0; j < 9; j++) g.rect(x + 12 + j * 25, -150 + r * 140, 18, 110).fill({ color: [0x8a3a2a, 0x3a5a6a, 0x6a6a3a, 0x9a7a3a][(i + r + j) % 4], alpha: 0.5 });
  }
  g.rect(-300, 560, 2520, 800).fill(0x9a7a52);
  // the open giant book lying on the floor (its fold right where Canelo is)
  g.poly([200, 1140, 960, 1180, 960, 700, 480, 690]).fill(LB.paper).poly([960, 1180, 1720, 1140, 1440, 690, 960, 700]).fill(0xece2c8);
  g.poly([930, 1180, 990, 1180, 972, 700, 948, 700]).fill({ color: 0x5a4020, alpha: 0.3 });
  bg.addChild(g);
  ctx.plane(bg, { z: 1200, bake: 'static' });
  const stage = new Container();
  const flameShadow = new Graphics();
  const can = ctx.actorAs('libros', ctx.canelo, 260);
  const luz = luzOf(ctx, 300, 'libros');
  const beam = new Beam(ctx);
  const fl = new Graphics();
  // the fold's near lip, in front of Canelo (he's stuck in it)
  const lip = new Graphics().poly([880, 1080, 1040, 1080, 990, 930, 930, 930]).fill(0xe8dcc0).stroke({ width: 3, color: LB.sepiaL });
  stage.addChild(flameShadow);
  if (can) stage.addChild(can);
  stage.addChild(lip);
  if (luz.actor) stage.addChild(luz.actor);
  stage.addChild(beam, fl);
  ctx.plane(stage, { z: 1000 });
  const bit = new Bitacora(ctx, RIESGO.f18, { size: 42 });
  ctx.plane(bit, { z: 0, screen: true });
  const BIT = 4.0;
  prewarm(ctx, stage, bit);
  return {
    update(lt, f: FrameInfo) {
      // he trips into the fold (0 → 0.8), stuck, wriggling; her beam lifts him out (2.0 → 3.6), sets him down
      const lift = sm(seg(lt, 1.3, 2.9));
      const stuckY = 1010;
      const cx = 960 + lift * 260;
      const cy = stuckY - (rm ? lift * 60 : Math.sin(lift * Math.PI) * 180 + lift * 40) + (1 - sm(seg(lt, 0, 0.6))) * -120;
      const wig = lift < 0.05 && !rm ? Math.sin(lt * 18) * 0.06 : 0;
      can?.pose(lt, cx, cy, { rot: wig - lift * 0.15 * (1 - lift) });
      if (can?.puppet) can.puppet.brain.crouch = lift < 0.05 ? 0.4 : 0;
      const lx = 1420 + bob(lt, rm);
      const ly = 760 + bob(lt + 1, rm, 8);
      luz.actor?.pose(lt, lx, ly, { flip: true });
      const L = lanternAt(luz);
      const beamOn = env(lt, 0.9, 3.6, 0.4, 0.6);
      beam.set(L, [cx, cy - 120], 110, beamOn * 0.9);
      // his flame and its trembling shadow on the paper behind him
      const tip = tailTip(can) ?? [cx - 90, cy - 80];
      const k = FLAME.baja;
      fl.clear();
      flame(fl, tip[0], tip[1], k, lt, { rm, line: 0x6a2a0a });
      const fs = flameShadow.clear();
      const tr = rm ? 0 : Math.sin(lt * 23) * 10 + Math.sin(lt * 37) * 6;
      fs.ellipse(cx - 60 + tr, cy - 170, 150 + tr * 2, 210 - tr).fill({ color: 0x3a2410, alpha: 0.22 * (1 - lift) });
      bit.update(lt - BIT, rm);
      void f;
    },
  };
}
