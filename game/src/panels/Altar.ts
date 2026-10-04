/**
 * Altar de Almas: elige gato → orbes propios + Prisma vs requeridos, nivel mínimo,
 * qué desbloquea la siguiente estrella y ¡SUBIR! → storyboard (g).
 */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../ui/modal';
import { C, F } from '../ui/theme';
import { Button, txt, poster, dotGrid, crosses } from '../ui/widgets';
import { sfx } from '../core/audio';
import { scenes } from '../core/scenes';
import { glowTexture } from '../art/textures';
import { catDef } from '../data/content';
import { G, OwnedCat } from '../state/game';
import { buyPrisma, cat as getCat, collState, prismaPrice, prismaShopLeft, starPerks, starUp } from '../state/sys/cats';
import { checkMissions } from '../state/sys/missions';
import { BAL } from '../state/econ';
import { elColor, printRarity, rarityRank, starCapNote, starInfo, StarInfo, starMissing, starRoadmap, starTitle, starUnlockText } from '../state/ext/collection';
import { CatCard, fitText } from './collection/CatCard';
import { ensureCatArt, portrait } from './collection/art';
import { ScrollBox, chip, clearChildren, guardModal, okMark, prismaGem } from './collection/ui';
import { icon } from '../ui/icons';
import { playStarUp } from '../fx/sequences/starUp';

const MW = 1720;
const MH = 980;
const IW = MW - 56;
const IH = MH - 130;

let current: AltarView | null = null;

/** Open the Altar of Souls (optionally preselecting a cat uid). */
export async function openAltar(uid?: string) {
  await ensureCatArt();
  if (current && !current.modal.closed) current.modal.close();
  current = new AltarView(typeof uid === 'string' ? uid : undefined);
  return current;
}

class AltarView {
  modal: Modal;
  private list!: ScrollBox;
  private center = new Container();
  private right = new Container();
  private selected: string;
  private candles: Graphics[] = [];
  private acc = 0;
  /** roadmap tile being previewed (null = next star) */
  private preview: number | null = null;
  private get usePrisma() {
    return collState().usePrisma !== false;
  }
  private set usePrisma(v: boolean) {
    collState().usePrisma = v;
  }
  private si(c: OwnedCat) {
    return starInfo(c, this.usePrisma);
  }

  constructor(uid?: string) {
    this.modal = new Modal('ALTAR DE ALMAS', MW, MH, { subtitle: 'LOS ORBES NO SE PIERDEN. SE ACUMULAN. COMO EL RENCOR.' });
    guardModal(this.modal);
    const deco = new Container();
    const dg = dotGrid(3, 6, 18, 2.5, C.ink);
    dg.position.set(MW - 110, 130);
    const cr = crosses(C.ink);
    cr.position.set(MW - 170, MH - 70);
    deco.addChild(dg, cr);
    this.modal.panel.addChildAt(deco, 4);
    const sorted = this.sortedCats();
    this.selected = uid && getCat(uid) ? uid : (sorted.find((c) => this.si(c).can) ?? sorted[0])?.uid ?? '';
    this.buildList();
    this.modal.body.addChild(this.center, this.right);
    this.refresh();
    this.modal.open();
    Ticker.shared.add(this.tick, this);
    this.modal.onClose = () => {
      Ticker.shared.remove(this.tick, this);
      if (current === this) current = null;
    };
  }

  private sortedCats() {
    return [...G.s.cats].sort((a, b) => Number(this.si(b).can) - Number(this.si(a).can) || rarityRank(printRarity(b.species)) - rarityRank(printRarity(a.species)) || b.level - a.level);
  }

  private buildList() {
    const b = this.modal.body;
    const h = poster('TUS GATOS', 34, C.ink);
    h.position.set(0, -12);
    b.addChild(h);
    this.list = new ScrollBox(400, IH - 40, C.ink);
    this.list.y = 40;
    b.addChild(this.list);
  }

  private refreshList() {
    const box = this.list;
    clearChildren(box.content);
    const cats = this.sortedCats();
    cats.forEach((c, i) => {
      const si = this.si(c);
      const r = new Container();
      r.y = i * 96;
      const sel = c.uid === this.selected;
      const g = new Graphics()
        .rect(4, 4, 388, 86)
        .fill(C.ink)
        .rect(0, 0, 388, 86)
        .fill(sel ? C.pink : C.paper)
        .stroke({ width: 3, color: C.ink });
      r.addChild(g);
      const fr = new Graphics().rect(8, 8, 70, 70).fill(0xffffff).stroke({ width: 2, color: C.ink });
      const pm = new Graphics().rect(9, 9, 68, 68).fill(0xffffff);
      const p = portrait(c.species, 78, 'color');
      p.position.set(43, 46);
      p.mask = pm;
      r.addChild(fr, p, pm);
      const nm = poster(c.name.toUpperCase(), 26, C.ink);
      nm.position.set(90, 2);
      fitText(nm, 200);
      r.addChild(nm);
      for (let k = 0; k < BAL.cats.stars.max; k++) {
        const s = new Graphics().star(98 + k * 20, 48, 5, 8, 3.6);
        if (k < c.stars) s.fill(C.yellow).stroke({ width: 2, color: C.ink });
        else s.stroke({ width: 1.5, color: C.ink, alpha: 0.35 });
        r.addChild(s);
      }
      // orb mini bar
      const bw = 150;
      const k = si.max ? 1 : Math.min(1, (si.own + si.prisma) / Math.max(1, si.need));
      const bar = new Graphics().rect(90, 62, bw, 12).fill(C.paperDark).rect(90, 62, bw * Math.min(1, si.own / Math.max(1, si.need)), 12).fill(C.violet);
      if (!si.max && si.prismaUse > 0) bar.rect(90 + bw * Math.min(1, si.own / si.need), 62, bw * (k - Math.min(1, si.own / si.need)), 12).fill(C.cyan);
      bar.rect(90, 62, bw, 12).stroke({ width: 2, color: C.ink });
      const bt = txt(si.max ? 'MÁX' : `${si.own}/${si.need}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.ink });
      bt.position.set(90 + bw + 8, 58);
      const lv = txt(`Nv ${c.level}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink });
      lv.anchor.set(1, 0);
      lv.position.set(380, 8);
      r.addChild(bar, bt, lv);
      if (si.can) {
        const ch = chip('¡LISTO!', { bg: C.pinkHot, fg: C.paper, size: 16, font: F.poster });
        ch.position.set(380 - ch.width, 50);
        ch.rotation = -0.06;
        r.addChild(ch);
        gsap.to(ch.scale, { x: 1.08, y: 1.08, yoyo: true, repeat: -1, duration: 0.5 });
      } else if (!si.max && !si.levelOk) {
        const ch = chip(`NV ${si.minLevel}`, { bg: C.paperDark, fg: C.ink, size: 13 });
        ch.position.set(380 - ch.width, 52);
        r.addChild(ch);
      }
      r.eventMode = 'static';
      r.cursor = 'pointer';
      r.on('pointerover', () => gsap.to(r, { x: 6, duration: 0.1 }));
      r.on('pointerout', () => gsap.to(r, { x: 0, duration: 0.1 }));
      r.on('pointertap', () => {
        if (box.wasDrag) return;
        sfx('paper');
        this.selected = c.uid;
        this.preview = null;
        this.refresh();
      });
      box.content.addChild(r);
    });
    box.setContentHeight(cats.length * 96);
  }

  refresh() {
    this.refreshList();
    const c = getCat(this.selected);
    clearChildren(this.center);
    clearChildren(this.right);
    this.candles = [];
    if (!c) return;
    const si = this.si(c);
    this.buildCenter(c, si);
    this.buildRight(c, si);
  }

  private buildCenter(c: OwnedCat, si: StarInfo) {
    const X = 430;
    const w = 600;
    const cx = X + w / 2;
    const ct = this.center;
    // the altar: ink arch + red circle
    const arch = new Graphics();
    arch.moveTo(X, IH).lineTo(X, 280).arc(cx, 280, w / 2, Math.PI, 0).lineTo(X + w, IH).closePath().fill(C.ink);
    arch.moveTo(X + 18, IH).lineTo(X + 18, 280).arc(cx, 280, w / 2 - 18, Math.PI, 0).lineTo(X + w - 18, IH).stroke({ width: 2, color: C.gold, alpha: 0.8 });
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = C.violet;
    glow.alpha = 0.6;
    glow.scale.set(5.5);
    glow.position.set(cx, 380);
    glow.blendMode = 'add';
    const circle = new Graphics().circle(cx, 380, 225).fill(C.red);
    ct.addChild(arch, glow, circle);
    // stars row
    for (let k = 0; k < BAL.cats.stars.max; k++) {
      const s = new Graphics().star(cx - 150 + k * 60, 116, 5, 22, 9.5);
      if (k < c.stars) s.fill(C.yellow).stroke({ width: 3, color: C.paper });
      else s.stroke({ width: 2.5, color: C.paper, alpha: k === c.stars ? 0.95 : 0.3 });
      ct.addChild(s);
      if (k === c.stars && !si.max) gsap.to(s, { alpha: 0.4, yoyo: true, repeat: -1, duration: 0.6 });
    }
    const card = new CatCard(c.species, { w: 330, h: 444, hires: true, stars: c.stars, level: c.level, status: 'registered', mutation: c.mutation, holo: !!c.holo });
    card.position.set(cx - 165, 168);
    card.rotation = -0.02;
    ct.addChild(card);
    gsap.from(card, { y: 200, alpha: 0, duration: 0.3, ease: 'back.out(1.6)' });
    const nm = poster(c.name.toUpperCase(), 48, C.paper);
    nm.anchor.set(0.5, 0);
    nm.position.set(cx, 640);
    fitText(nm, w - 60);
    const sub = txt(si.max ? 'MAESTRÍA TOTAL' : `★${c.stars} → ★${si.next}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.yellow, letterSpacing: 3 });
    sub.anchor.set(0.5, 0);
    sub.position.set(cx, 706);
    ct.addChild(nm, sub);
    // candles
    for (const x of [X + 50, X + w - 50]) {
      const body = new Graphics().rect(x - 16, IH - 120, 32, 110).fill(C.paper).stroke({ width: 3, color: C.ink });
      const flame = new Graphics();
      flame.position.set(x, IH - 128);
      ct.addChild(body, flame);
      this.candles.push(flame);
    }
    this.drawFlames();
  }

  private drawFlames() {
    for (const f of this.candles) {
      const s = 0.85 + Math.random() * 0.3;
      f.clear()
        .moveTo(0, -38 * s)
        .bezierCurveTo(16, -14, 12, 6, 0, 8)
        .bezierCurveTo(-12, 6, -16, -14, 0, -38 * s)
        .fill(C.orange)
        .moveTo(0, -20 * s)
        .bezierCurveTo(7, -8, 6, 4, 0, 5)
        .bezierCurveTo(-6, 4, -7, -8, 0, -20 * s)
        .fill(C.yellow);
      f.skew.x = (Math.random() - 0.5) * 0.2;
    }
  }

  private buildRight(c: OwnedCat, si: StarInfo) {
    const X = 1070;
    const w = IW - X;
    const r = this.right;
    const def = catDef(c.species);
    // ---- roadmap (bottom): ★2…★6, tap to preview
    const road = starRoadmap(c);
    const tileGap = 10;
    const tw = (w - tileGap * (road.length - 1)) / road.length;
    const th = 116;
    const ry = IH - th - 4;
    const rl = txt('LO QUE DA CADA ESTRELLA · toca para ver', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.ink, letterSpacing: 2 });
    rl.position.set(X, ry - 24);
    r.addChild(rl);
    road.forEach((st, i) => {
      const t = new Container();
      t.position.set(X + i * (tw + tileGap), ry);
      const sel = (this.preview ?? si.next) === st.star;
      const bg = st.state === 'done' ? C.yellow : st.state === 'next' ? C.paper : C.paperDark;
      const g = new Graphics().rect(4, 4, tw, th).fill(C.ink).rect(0, 0, tw, th).fill(bg).stroke({ width: sel ? 5 : 3, color: sel ? C.pinkHot : C.ink });
      const big = poster(`★${st.star}`, 40, st.state === 'locked' ? 0x8a8070 : C.ink);
      big.position.set(10, 0);
      const lv = txt(st.state === 'done' ? 'ACTIVA' : `NV ${st.minLevel}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: st.state === 'done' ? C.green : st.state === 'next' ? C.pinkHot : C.ink });
      lv.anchor.set(1, 0);
      lv.position.set(tw - 8, 10);
      const tt = txt(st.title, { fontFamily: F.poster, fontSize: 17, fill: C.ink, wordWrap: true, wordWrapWidth: tw - 16, lineHeight: 19 });
      tt.position.set(10, 54);
      fitText(tt, tw - 16);
      t.addChild(g, big, lv, tt);
      if (st.state === 'locked') t.alpha = 0.8;
      if (st.state === 'next') gsap.to(g, { alpha: 0.75, yoyo: true, repeat: -1, duration: 0.6 });
      t.eventMode = 'static';
      t.cursor = 'pointer';
      t.on('pointertap', () => {
        sfx('paper');
        this.preview = st.star === si.next ? null : st.star;
        this.refresh();
      });
      r.addChild(t);
    });

    if (si.max) {
      const t = poster('MAESTRÍA TOTAL', 80, C.ink);
      t.position.set(X, -10);
      const s = txt(`${c.name} ya tiene las ${BAL.cats.stars.max} estrellas. No hay más altar. Solo gloria.`, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink, wordWrap: true, wordWrapWidth: w });
      s.position.set(X, 110);
      r.addChild(t, s);
      this.unlockCard(def, this.preview ?? BAL.cats.stars.max, X, 200, w, true);
      return;
    }
    const t = poster(`SIGUIENTE: ★${si.next}`, 70, C.ink);
    t.position.set(X, -22);
    const tsub = txt(starTitle(si.next), { fontFamily: F.poster, fontSize: 26, fill: C.pinkHot });
    tsub.position.set(X + t.width + 16, 22);
    fitText(tsub, w - t.width - 20);
    r.addChild(t, tsub);
    let y = 78;
    // ---- orbs (own violet + prisma cyan)
    const lab = (s: string, yy: number, ok: boolean | null) => {
      const l = txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, letterSpacing: 3 });
      l.position.set(X, yy);
      r.addChild(l);
      if (ok !== null) {
        const m = okMark(ok, 13);
        m.position.set(X + w - 16, yy + 8);
        r.addChild(m);
      }
    };
    lab(`ORBES DE ${def.name.toUpperCase()}`, y, si.orbsOk);
    const bw = w;
    const bh = 46;
    const ownK = Math.min(1, si.own / si.need);
    const prK = Math.min(1 - ownK, si.prismaUse / si.need);
    const bar = new Graphics()
      .rect(6, 6, bw, bh)
      .fill(C.ink)
      .rect(0, 0, bw, bh)
      .fill(C.paperDark)
      .rect(0, 0, bw * ownK, bh)
      .fill(C.violet);
    if (prK > 0) {
      bar.rect(bw * ownK, 0, bw * prK, bh).fill(C.cyan);
      for (let k = 0; k < 6; k++) bar.moveTo(bw * ownK + ((k + 0.5) / 6) * bw * prK - 6, bh - 4).lineTo(bw * ownK + ((k + 0.5) / 6) * bw * prK + 6, 4).stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
    }
    bar.rect(0, 0, bw, bh).stroke({ width: 3, color: C.ink });
    bar.position.set(X, y + 24);
    const bt = poster(`${Math.min(si.own, si.need)}${si.prismaUse ? ` + ${si.prismaUse} PRISMA` : ''} / ${si.need}`, 30, C.ink, { stroke: { color: C.paper, width: 5 } });
    bt.anchor.set(0.5);
    bt.position.set(X + bw / 2, y + 24 + bh / 2);
    r.addChild(bar, bt);
    y += 84;
    // ---- prisma row: toggle + count + shop
    const pr = new Container();
    pr.position.set(X, y);
    const gem = prismaGem(28);
    gem.position.set(13, 18);
    const pt = txt(`PRISMA: ${si.prisma}`, { fontFamily: F.poster, fontSize: 24, fill: 0x1e7f93 });
    pt.position.set(32, 2);
    const ph = txt('comodín: 1 Prisma = 1 orbe de cualquier gato', { fontFamily: F.ui, fontSize: 13, fill: C.ink });
    ph.position.set(32, 32);
    fitText(ph, w - 150 - (prismaShopLeft() > 0 ? 166 : 0) - 44);
    pr.addChild(gem, pt, ph);
    const tog = new Container();
    const on = this.usePrisma;
    const tg = new Graphics().roundRect(0, 0, 150, 40, 20).fill(on ? C.cyan : C.paperDark).stroke({ width: 3, color: C.ink });
    const knob = new Graphics().circle(on ? 130 : 20, 20, 14).fill(C.paper).stroke({ width: 3, color: C.ink });
    const tl = txt(on ? 'USAR: SÍ' : 'USAR: NO', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink });
    tl.anchor.set(0.5);
    tl.position.set(on ? 62 : 88, 20);
    tog.addChild(tg, knob, tl);
    tog.position.set(w - 150 - (prismaShopLeft() > 0 ? 166 : 0), 0);
    tog.eventMode = 'static';
    tog.cursor = 'pointer';
    tog.on('pointertap', () => {
      sfx('click');
      this.usePrisma = !this.usePrisma;
      this.refresh();
    });
    pr.addChild(tog);
    if (prismaShopLeft() > 0) {
      const buy = new Button(`+1 · ${prismaPrice()}`, () => {
        if (buyPrisma(1)) {
          sfx('gem');
          toast('+1 Prisma', { sub: `Te quedan ${prismaShopLeft()} compras (se recargan con cada jefe).`, color: C.cyan });
          this.refresh();
        } else {
          sfx('error');
          toast('Te faltan Ojos de Gato', { sub: `Cada Prisma cuesta ${prismaPrice()} Ojos de Gato.`, color: C.pink, icon: 'gem' });
        }
      }, { w: 156, h: 40, size: 20, color: C.mint });
      buy.position.set(w - 156, 0);
      buy.caption.x = 156 / 2 - 4;
      const bg1 = prismaGem(18);
      bg1.position.set(22, 20);
      const bg2 = icon('gem', 20);
      bg2.position.set(134, 20);
      buy.face.addChild(bg1, bg2);
      pr.addChild(buy);
    }
    r.addChild(pr);
    y += 66;
    // ---- level
    lab('NIVEL MÍNIMO', y, si.levelOk);
    const lvT = poster(`NV ${c.level} / ${si.minLevel}`, 40, si.levelOk ? C.ink : C.red);
    lvT.position.set(X, y + 14);
    r.addChild(lvT);
    if (!si.levelOk) {
      const cap = starCapNote(si);
      const hint = txt(cap ?? `Faltan ${si.minLevel - c.level} niveles. Dale de comer en su ficha (¡ÑAM!).`, {
        fontFamily: F.ui,
        fontSize: 15,
        fill: C.ink,
        wordWrap: true,
        wordWrapWidth: w - lvT.width - 30,
        lineHeight: 18,
      });
      hint.position.set(X + lvT.width + 18, y + 22);
      r.addChild(hint);
    }
    y += 76;
    // ---- unlock card (next star, or the previewed tile)
    y = this.unlockCard(def, this.preview ?? si.next, X, y, w, c.stars >= (this.preview ?? si.next));
    y += 16;
    // ---- stats preview (only ★ multiplier stats)
    const stats: [string, string, string][] = [
      ['PODER', si.powerNow.toFixed(1), si.powerNext.toFixed(1)],
      ['ORO/S', si.goldNow.toFixed(2), si.goldNext.toFixed(2)],
    ];
    stats.forEach(([k, a, b], i) => {
      const sx = X + i * (w / 2);
      const kt = txt(k, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink, letterSpacing: 3 });
      kt.position.set(sx, y);
      const vt = poster(`${a} → ${b}`, 34, C.ink);
      vt.position.set(sx, y + 16);
      r.addChild(kt, vt);
    });
    y += 70;
    // ---- button (+ what's missing)
    const can = si.can;
    const btn = new Container();
    const bw2 = w;
    const bH = 84;
    const by = Math.min(y, ry - 40 - bH);
    const sh = new Graphics().rect(8, 8, bw2, bH).fill(C.ink);
    const face = new Container();
    const fg = new Graphics().rect(0, 0, bw2, bH).fill(can ? C.pinkHot : C.paperDark).stroke({ width: 4, color: C.ink });
    const ft = poster(can ? `¡SUBIR A ★${si.next}!` : starMissing(si).toUpperCase(), can ? 50 : 34, can ? C.paper : 0x6d6356);
    ft.anchor.set(0.5);
    ft.position.set(bw2 / 2, bH / 2 - (can && si.prismaUse ? 8 : 0));
    fitText(ft, bw2 - 30);
    face.addChild(fg, ft);
    if (can && si.prismaUse) {
      const pu = txt(`usa ${si.prismaUse} Prisma`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.paper });
      pu.anchor.set(0.5);
      pu.position.set(bw2 / 2, bH - 14);
      face.addChild(pu);
    }
    btn.addChild(sh, face);
    btn.position.set(X, by);
    btn.eventMode = 'static';
    btn.cursor = can ? 'pointer' : 'not-allowed';
    btn.on('pointerover', () => can && gsap.to(face, { x: -3, y: -3, duration: 0.1 }));
    btn.on('pointerout', () => gsap.to(face, { x: 0, y: 0, duration: 0.12 }));
    btn.on('pointertap', () => this.doStarUp(c));
    if (can) gsap.to(ft.scale, { x: ft.scale.x * 1.05, y: ft.scale.y * 1.05, yoyo: true, repeat: -1, duration: 0.5 });
    r.addChild(btn);
  }

  /** yellow card: what star N gives (returns the y below it) */
  private unlockCard(def: ReturnType<typeof catDef>, star: number, X: number, y: number, w: number, active: boolean) {
    const r = this.right;
    const uc = new Container();
    uc.position.set(X, y);
    const ut = poster(`★${star} · ${starTitle(star)}`, 28, C.ink);
    const st = txt(active ? 'YA LA TIENE' : '', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.green });
    const ux = txt(starUnlockText(def, star), { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink, wordWrap: true, wordWrapWidth: w - 36, lineHeight: 23 });
    ut.position.set(18, 6);
    fitText(ut, w - 150);
    st.anchor.set(1, 0);
    st.position.set(w - 14, 14);
    ux.position.set(18, 46);
    const uh = Math.max(104, ux.height + 62);
    const col = active ? C.mint : star === 5 || star === 6 ? 0xffd77a : C.yellow;
    const ug = new Graphics().rect(6, 6, w, uh).fill(C.ink).rect(0, 0, w, uh).fill(col).stroke({ width: 3, color: C.ink });
    uc.addChild(ug, ut, st, ux);
    uc.rotation = -0.01;
    r.addChild(uc);
    return y + uh;
  }

  private async doStarUp(c: OwnedCat) {
    const si = this.si(c);
    if (!si.can) {
      sfx('error');
      toast('Todavía no', { sub: starCapNote(si) ?? `${starMissing(si)}.`, color: C.pink });
      return;
    }
    const def = catDef(c.species);
    const ownBefore = si.own;
    const from = c.stars;
    if (!starUp(c, this.usePrisma)) {
      sfx('error');
      return;
    }
    checkMissions();
    const perks = starPerks(c);
    await playStarUp(scenes.overlayLayer, {
      species: c.species,
      name: c.name,
      level: c.level,
      fromStars: from,
      toStars: c.stars,
      ownBefore,
      need: si.need,
      prismaUsed: si.prismaUse,
      element: def.elements[0],
      mutation: c.mutation,
      stats: [
        { label: 'PODER', from: si.powerNow, to: si.powerNext, digits: 1 },
        { label: 'ORO / S', from: si.goldNow, to: si.goldNext, digits: 2 },
      ],
      unlockTitle: `★${c.stars} · ${starTitle(c.stars)}`,
      unlockText: si.unlockText,
      shotName: def.combat.shot.name,
      shotCry: def.combat.shot.cry ?? def.battleForm.cry,
      perkLines: [perks.star3 ? `★3 · ${perks.star3}` : null, perks.star4 ? `★4 · ${def.combat.shot.name} versión nueva` : null, perks.star5 ? `★5 · ${perks.star5}` : null].filter((x): x is string => !!x),
    });
    this.preview = null;
    if (!this.modal.closed) this.refresh();
  }

  private tick(t: Ticker) {
    this.acc += t.deltaMS;
    if (this.acc < 1000 / 12) return;
    this.acc = 0;
    this.drawFlames();
  }
}


