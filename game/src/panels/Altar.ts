/**
 * Altar de Almas: elige gato → orbes propios + Prisma vs requeridos, nivel mínimo,
 * qué desbloquea la siguiente estrella y ¡SUBIR! → storyboard (g).
 */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../ui/modal';
import { C, F } from '../ui/theme';
import { txt, poster, dotGrid, crosses } from '../ui/widgets';
import { sfx } from '../core/audio';
import { scenes } from '../core/scenes';
import { glowTexture } from '../art/textures';
import { catDef } from '../data/content';
import { G, OwnedCat } from '../state/game';
import { cat as getCat, starUp } from '../state/sys/cats';
import { checkMissions } from '../state/sys/missions';
import { BAL } from '../state/econ';
import { printRarity, rarityRank, starInfo, StarInfo } from '../state/ext/collection';
import { CatCard, fitText } from './collection/CatCard';
import { ensureCatArt, portrait } from './collection/art';
import { ScrollBox, chip, clearChildren, guardModal } from './collection/ui';
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
    this.selected = uid && getCat(uid) ? uid : (sorted.find((c) => starInfo(c).can) ?? sorted[0])?.uid ?? '';
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
    return [...G.s.cats].sort((a, b) => Number(starInfo(b).can) - Number(starInfo(a).can) || rarityRank(printRarity(b.species)) - rarityRank(printRarity(a.species)) || b.level - a.level);
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
      const si = starInfo(c);
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
      }
      r.eventMode = 'static';
      r.cursor = 'pointer';
      r.on('pointerover', () => gsap.to(r, { x: 6, duration: 0.1 }));
      r.on('pointerout', () => gsap.to(r, { x: 0, duration: 0.1 }));
      r.on('pointertap', () => {
        if (box.wasDrag) return;
        sfx('paper');
        this.selected = c.uid;
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
    const si = starInfo(c);
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
    const card = new CatCard(c.species, { w: 330, h: 444, hires: true, stars: c.stars, level: c.level, status: 'registered' });
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
    if (si.max) {
      const t = poster('MAESTRÍA TOTAL', 80, C.ink);
      t.position.set(X, -10);
      const s = txt(`${c.name} ya tiene las ${BAL.cats.stars.max} estrellas. No hay más altar. Solo gloria.`, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink, wordWrap: true, wordWrapWidth: w });
      s.position.set(X, 110);
      r.addChild(t, s);
      return;
    }
    const t = poster(`SIGUIENTE: ★${si.next}`, 76, C.ink);
    t.position.set(X, -22);
    r.addChild(t);
    let y = 100;
    // orbs
    const lab = (s: string, yy: number, ok: boolean | null) => {
      const l = txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, letterSpacing: 3 });
      l.position.set(X, yy);
      r.addChild(l);
      if (ok !== null) {
        const m = new Graphics().circle(X + w - 16, yy + 8, 13).fill(ok ? C.green : C.red).stroke({ width: 2, color: C.ink });
        const mt = txt(ok ? '✓' : '✗', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.paper });
        mt.anchor.set(0.5);
        mt.position.set(X + w - 16, yy + 8);
        r.addChild(m, mt);
      }
    };
    lab(`ORBES DE ${def.name.toUpperCase()}`, y, si.orbsOk);
    const bw = w;
    const bh = 50;
    const ownK = Math.min(1, si.own / si.need);
    const prK = Math.min(1 - ownK, si.prismaUse / si.need);
    const bar = new Graphics()
      .rect(6, 6, bw, bh)
      .fill(C.ink)
      .rect(0, 0, bw, bh)
      .fill(C.paperDark)
      .rect(0, 0, bw * ownK, bh)
      .fill(C.violet);
    if (prK > 0) bar.rect(bw * ownK, 0, bw * prK, bh).fill(C.cyan);
    bar.rect(0, 0, bw, bh).stroke({ width: 3, color: C.ink });
    bar.position.set(X, y + 26);
    const bt = poster(`${si.own}${si.prismaUse ? ` + ${si.prismaUse} PRISMA` : ''} / ${si.need}`, 32, C.ink, { stroke: { color: C.paper, width: 5 } });
    bt.anchor.set(0.5);
    bt.position.set(X + bw / 2, y + 26 + bh / 2);
    r.addChild(bar, bt);
    y += 100;
    const pr = txt(`PRISMA (COMODÍN): ${si.prisma}  ·  cubre los orbes que te falten`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: 0x1e7f93 });
    pr.position.set(X, y);
    r.addChild(pr);
    y += 44;
    lab('NIVEL MÍNIMO', y, si.levelOk);
    const lvT = poster(`NV ${c.level} / ${si.minLevel}`, 44, si.levelOk ? C.ink : C.red);
    lvT.position.set(X, y + 14);
    r.addChild(lvT);
    if (!si.levelOk) {
      const hint = txt(`Faltan ${si.minLevel - c.level} niveles. Dale de comer en la isla (¡ÑAM!).`, { fontFamily: F.ui, fontSize: 16, fill: C.ink });
      hint.position.set(X + lvT.width + 18, y + 34);
      r.addChild(hint);
    }
    y += 96;
    // unlock card
    const uc = new Container();
    uc.position.set(X, y);
    const ut = poster(`★${si.next} · ${si.unlockKey.toUpperCase() || 'DESBLOQUEO'}`, 30, C.ink);
    const ux = txt(si.unlockText, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: C.ink, wordWrap: true, wordWrapWidth: w - 36, lineHeight: 24 });
    ut.position.set(18, 8);
    ux.position.set(18, 52);
    const uh = Math.max(120, ux.height + 70);
    const ug = new Graphics().rect(6, 6, w, uh).fill(C.ink).rect(0, 0, w, uh).fill(C.yellow).stroke({ width: 3, color: C.ink });
    uc.addChild(ug, ut, ux);
    uc.rotation = -0.01;
    r.addChild(uc);
    y += uh + 30;
    // stats preview
    const stats: [string, string, string][] = [
      ['PODER', si.powerNow.toFixed(1), si.powerNext.toFixed(1)],
      ['ORO/S', si.goldNow.toFixed(2), si.goldNext.toFixed(2)],
    ];
    stats.forEach(([k, a, b], i) => {
      const sx = X + i * (w / 2);
      const kt = txt(k, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, letterSpacing: 3 });
      kt.position.set(sx, y);
      const vt = poster(`${a} → ${b}`, 40, C.ink);
      vt.position.set(sx, y + 18);
      r.addChild(kt, vt);
    });
    y += 90;
    // button
    const can = si.can;
    const btn = new Container();
    const bw2 = w;
    const sh = new Graphics().rect(8, 8, bw2, 96).fill(C.ink);
    const face = new Container();
    const fg = new Graphics().rect(0, 0, bw2, 96).fill(can ? C.pinkHot : C.paperDark).stroke({ width: 4, color: C.ink });
    const ft = poster(`¡SUBIR A ★${si.next}!`, 56, can ? C.paper : 0x8a8070);
    ft.anchor.set(0.5);
    ft.position.set(bw2 / 2, 48);
    face.addChild(fg, ft);
    btn.addChild(sh, face);
    btn.position.set(X, Math.min(y, IH - 110));
    btn.eventMode = 'static';
    btn.cursor = can ? 'pointer' : 'not-allowed';
    btn.on('pointerover', () => can && gsap.to(face, { x: -3, y: -3, duration: 0.1 }));
    btn.on('pointerout', () => gsap.to(face, { x: 0, y: 0, duration: 0.12 }));
    btn.on('pointertap', () => this.doStarUp(c));
    if (can) gsap.to(ft.scale, { x: 1.05, y: 1.05, yoyo: true, repeat: -1, duration: 0.5 });
    r.addChild(btn);
  }

  private async doStarUp(c: OwnedCat) {
    const si = starInfo(c);
    if (!si.can) {
      sfx('error');
      const why = !si.levelOk ? `Necesita Nv ${si.minLevel} (tiene ${c.level}).` : `Faltan ${si.need - si.own - si.prisma} orbes.`;
      toast('Todavía no', { sub: why, color: C.pink });
      return;
    }
    const def = catDef(c.species);
    const ownBefore = si.own;
    const from = c.stars;
    if (!starUp(c)) {
      sfx('error');
      return;
    }
    checkMissions();
    await playStarUp(scenes.overlayLayer, {
      species: c.species,
      name: c.name,
      level: c.level,
      fromStars: from,
      toStars: c.stars,
      ownBefore,
      need: si.need,
      prismaUsed: si.prismaUse,
      stats: [
        { label: 'PODER', from: si.powerNow, to: si.powerNext, digits: 1 },
        { label: 'ORO / S', from: si.goldNow, to: si.goldNext, digits: 2 },
      ],
      unlockTitle: `★${c.stars} · ${si.unlockKey || 'desbloqueo'}`,
      unlockText: si.unlockText,
      shotName: def.combat.shot.name,
    });
    if (!this.modal.closed) this.refresh();
  }

  private tick(t: Ticker) {
    this.acc += t.deltaMS;
    if (this.acc < 1000 / 12) return;
    this.acc = 0;
    this.drawFlames();
  }
}


