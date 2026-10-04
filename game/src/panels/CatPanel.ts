/**
 * Cat panel (EDITORIAL SUIZO + the element's dimension in Battle Form):
 * big island art with rarity print-quality frame, Battle Form toggle, editable name, chips,
 * level + 4-bite ¡ÑAM! bar (tap = 1 bite, hold = accelerating chain, storyboard i), feed-to (Reino 6),
 * next threshold, stars + orbs (→ Altar), gold/s, combat sheet and lore.
 */
import '../island/safety';
import { Container, Graphics, Sprite, Text, Texture, Ticker, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../ui/modal';
import { scenes } from '../core/scenes';
import { game } from '../core/App';
import { C, F, RARITY } from '../ui/theme';
import { Button, txt } from '../ui/widgets';
import { icon } from '../ui/icons';
import { G, OwnedCat } from '../state/game';
import { catDef, ROLE_BY_ID, CONTENT, ELEMENT_BY_ID } from '../data/content';
import { ELEMENT_NAME } from '../data/elementsMeta';
import { biteCost, cat as getCat, catGold, feed, levelCap, nextThreshold, starNeed } from '../state/sys/cats';
import { globalGoldMult, habitat } from '../state/sys/island';
import { habitatTier } from '../state/econ';
import { checkMissions } from '../state/sys/missions';
import { catLevelScale, featureKl, featureUnlocked, hudUnlocks, missionActive, renameCat } from '../state/ext/island';
import { IslandCat, BattleCat, elementFx, catTexture, preloadCats } from '../art/catArt';
import { applyCatTint, slugOf } from '../art/tint';
import { halftoneTexture } from '../art/textures';
import { fmt } from '../core/format';
import { sfx } from '../core/audio';
import { onomatopoeia, sparkles, floatText, flash } from '../fx/juice';
import { chip, elementChip, mix, rarityChip, wrapText, heading } from './island/ui';
import { openAltar } from './Altar';
import { TweenBag } from '../ui/hud/tweenBag';

const NYAMS = ['¡ÑAM!', '¡ÑOM!', '¡ÑAM ÑAM!', '¡GULP!', '¡MMM!'];
const TRAIT = new Map(CONTENT.traits.map((t) => [t.id, t]));
const WORKER_NAME: Record<string, string> = { banker: 'Banquero', farmer: 'Granjero', builder: 'Constructor', voyager: 'Viajero' };

export function openCatPanel(uid: string) {
  const c0 = getCat(uid);
  if (!c0) {
    toast('Ese gato no está en tu isla');
    return null;
  }
  const slug = slugOf(c0.species);
  if (catTexture(slug) === Texture.WHITE) {
    preloadCats([slug]).then(() => new CatPanel(uid).open());
    return null;
  }
  return new CatPanel(uid).open();
}

class CatPanel {
  m: Modal;
  bag = new TweenBag();
  uid: string;
  // left
  frame = new Container();
  stage = new Container();
  islandCat: IslandCat | null = null;
  battleCat: BattleCat | null = null;
  battleMode = false;
  // live refs
  lvText!: Text;
  capText!: Text;
  segs: Graphics[] = [];
  costText!: Text;
  feedBtn = new Container();
  feedFace = new Container();
  thresholdText!: Text;
  goldText!: Text;
  feedToText!: Text;
  feedTarget = 0;
  starsBox = new Container();
  private holdTimer: number | null = null;
  private holdDelay = 250;
  private streak = 0;
  private lastBite = 0;
  private sheen: Graphics | null = null;
  private holo: Graphics | null = null;
  private feeding = false;
  private tick = (t: Ticker) => this.onTick(t);
  private tt = 0;

  constructor(uid: string) {
    this.uid = uid;
    const c = this.c;
    const def = catDef(c.species);
    this.m = new Modal(def.name === c.name ? c.name : `${c.name}`, 1600, 920, { subtitle: def.epithet.toUpperCase(), band: C.ink });
    this.build();
    (globalThis as unknown as { __catPanel: CatPanel }).__catPanel = this;
    Ticker.shared.add(this.tick);
    this.m.onClose = () => {
      Ticker.shared.remove(this.tick);
      this.stopHold();
      this.bag.killAll();
      removeInput();
    };
  }
  get c(): OwnedCat {
    return getCat(this.uid)!;
  }
  open() {
    this.m.open();
    return this.m;
  }

  // ================================================================== layout
  private build() {
    const c = this.c;
    const def = catDef(c.species);
    const fx = elementFx(def.elements[0]);
    const body = this.m.body;
    const IW = this.m.innerW;
    // rename button in the band
    const pen = new Container();
    const pb = new Graphics().rect(0, 0, 150, 44).fill(C.yellow).stroke({ width: 3, color: C.ink });
    const pt = txt('✎ RENOMBRAR', { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 1 });
    pt.position.set(12, 9);
    pen.addChild(pb, pt);
    pen.position.set(this.m.w - 250, 21);
    pen.eventMode = 'static';
    pen.cursor = 'pointer';
    pen.on('pointertap', () => this.editName());
    this.m.panel.addChild(pen);

    // ------------------------------------------------ left: art frame
    const FW = 540;
    const FH = 590;
    this.frame.position.set(0, 0);
    body.addChild(this.frame);
    this.drawFrame(FW, FH, def.rarity, fx);
    this.stage.position.set(FW / 2, FH - 120);
    this.frame.addChild(this.stage);
    this.showIsland();
    // toggle
    const tog = new Button('VER BATTLE FORM', () => this.toggleForm(tog), { w: 300, h: 56, size: 26, color: C.ink, textColor: C.paper });
    tog.position.set(FW / 2 - 150, FH - 76);
    this.frame.addChild(tog);
    // stars + orbs
    this.starsBox.position.set(0, FH + 22);
    body.addChild(this.starsBox);
    this.drawStars();

    // ------------------------------------------------ right column
    const x0 = FW + 40;
    const RW = IW - x0;
    let y = 0;
    const chips: Container[] = [...def.elements.map((e) => elementChip(e, 22)), rarityChip(def.rarity, 22)];
    const role = ROLE_BY_ID.get(def.role);
    if (role) chips.push(chip(role.name.toUpperCase(), C.paper, C.ink, 22));
    const tr = TRAIT.get(c.trait);
    if (tr) chips.push(chip(`RASGO: ${tr.name.toUpperCase()}`, C.lilac, C.ink, 22));
    if (def.worker) chips.push(chip(`OFICIO: ${(WORKER_NAME[def.worker] ?? def.worker).toUpperCase()}`, C.mint, C.ink, 22));
    if (c.mutation) chips.push(chip(`MUTACIÓN: ${c.mutation.toUpperCase()}`, C.pinkHot, C.paper, 22));
    let cx = x0;
    for (const ch of chips) {
      if (cx + ch.width > IW) {
        cx = x0;
        y += 42;
      }
      ch.position.set(cx, y);
      body.addChild(ch);
      cx += ch.width + 10;
    }
    y += 44;
    if (tr) {
      const te = txt(`${tr.name}: ${tr.effect}`, { fontFamily: F.ui, fontSize: 15, fill: C.ink, fontStyle: 'italic', wordWrap: true, wordWrapWidth: RW });
      te.position.set(x0, y);
      body.addChild(te);
      y += te.height + 10;
    }
    // H02 naming prompt
    if (missionActive('H02')) {
      const box = new Container();
      const g = new Graphics().rect(6, 6, RW, 64).fill(C.ink).rect(0, 0, RW, 64).fill(C.yellow).stroke({ width: 3, color: C.ink });
      const q = txt('¿Cómo se llama?', { fontFamily: F.poster, fontSize: 32, fill: C.ink });
      q.position.set(16, 10);
      const a = new Button('PONER NOMBRE', () => this.editName(), { w: 220, h: 46, size: 24, color: C.pinkHot, textColor: C.paper });
      a.position.set(RW - 470, 9);
      const b = new Button(`ASÍ: ${c.name.toUpperCase()}`, () => {
        renameCat(this.c, this.c.name);
        sfx('meow');
        toast(`${this.c.name} aprueba su nombre`, { icon: 'paw', sub: 'Si le pones "Michi" no te juzgo. Mucho.' });
        box.destroy({ children: true });
      }, { w: 230, h: 46, size: 22, color: C.paper });
      b.position.set(RW - 240, 9);
      box.addChild(g, q, a, b);
      box.position.set(x0, y);
      body.addChild(box);
      y += 84;
    }

    // ------------------------------------------------ level block
    const lb = new Container();
    lb.position.set(x0, y);
    body.addChild(lb);
    const lbg = new Graphics().rect(6, 6, RW, 222).fill(C.ink).rect(0, 0, RW, 222).fill(C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
    lb.addChild(lbg);
    const nvl = txt('NIVEL', { fontFamily: F.bebas, fontSize: 24, fill: C.ink, letterSpacing: 3 });
    nvl.position.set(20, 12);
    this.lvText = txt(String(c.level), { fontFamily: F.poster, fontSize: 96, fill: C.ink });
    this.lvText.position.set(18, 30);
    this.capText = txt('', { fontFamily: F.heavy, fontSize: 20, fill: C.ink });
    this.capText.position.set(20, 160);
    lb.addChild(nvl, this.lvText, this.capText);
    // ÑAM bar
    const barX = 180;
    const segW = 92;
    for (let i = 0; i < 4; i++) {
      const g = new Graphics();
      g.position.set(barX + i * (segW + 8), 52);
      lb.addChild(g);
      this.segs.push(g);
    }
    const nyl = txt('4 ¡ÑAM! = 1 NIVEL', { fontFamily: F.bebas, fontSize: 20, fill: C.ink, letterSpacing: 2 });
    nyl.position.set(barX, 18);
    lb.addChild(nyl);
    this.thresholdText = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.ink, wordWrap: true, wordWrapWidth: 4 * segW + 30 });
    this.thresholdText.position.set(barX, 116);
    lb.addChild(this.thresholdText);
    // feed button (tap / hold)
    const fb = this.feedBtn;
    const fw = RW - (barX + 4 * (segW + 8)) - 24;
    const fbg = new Graphics().rect(6, 6, fw, 130).fill(C.ink).rect(0, 0, fw, 130).fill(C.pinkHot).stroke({ width: 4, color: C.ink });
    const fish = icon('food', 54);
    fish.position.set(fw / 2, 40);
    const ft = txt('¡ÑAM!', { fontFamily: F.comic, fontSize: 42, fill: C.paper, stroke: { color: C.ink, width: 6, join: 'round' } });
    ft.anchor.set(0.5);
    ft.position.set(fw / 2, 84);
    this.costText = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.paper });
    this.costText.anchor.set(0.5);
    this.costText.position.set(fw / 2, 116);
    this.feedFace.addChild(fbg, fish, ft, this.costText);
    this.feedFace.pivot.set(fw / 2, 65);
    this.feedFace.position.set(fw / 2, 65);
    fb.addChild(this.feedFace);
    fb.position.set(barX + 4 * (segW + 8) + 10, 16);
    fb.eventMode = 'static';
    fb.cursor = 'pointer';
    fb.on('pointerdown', () => this.startHold());
    fb.on('pointerup', () => this.stopHold());
    fb.on('pointerupoutside', () => this.stopHold());
    fb.on('pointerleave', () => this.stopHold());
    lb.addChild(fb);
    const hint = txt('toca = 1 bocado · mantén = en cadena', { fontFamily: F.ui, fontSize: 13, fill: C.ink });
    hint.anchor.set(0.5, 0);
    hint.position.set(fb.x + fw / 2, 152);
    lb.addChild(hint);
    // feed-to (Reino 6)
    const ftC = new Container();
    ftC.position.set(barX, 170);
    lb.addChild(ftC);
    if (featureUnlocked('feed_bulk')) {
      const minus = smallBtn('−', () => this.setFeedTarget(this.feedTarget - 1));
      const plus = smallBtn('+', () => this.setFeedTarget(this.feedTarget + 1));
      this.feedToText = txt('', { fontFamily: F.poster, fontSize: 24, fill: C.ink });
      this.feedToText.position.set(52, 4);
      minus.position.set(0, 0);
      plus.position.set(210, 0);
      const go = new Button('¡A COMER!', () => this.feedTo(), { w: 150, h: 40, size: 22, color: C.yellow });
      go.position.set(262, 0);
      ftC.addChild(minus, this.feedToText, plus, go);
      this.feedTarget = Math.min(levelCap(), c.level + 5);
    } else {
      const lk = txt(`🔒 Alimentar hasta Nv X · Reino ${featureKl('feed_bulk')}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
      lk.alpha = 0.55;
      lk.position.set(0, 10);
      ftC.addChild(lk);
    }
    y += 244;

    // ------------------------------------------------ economy row
    const eco = new Container();
    eco.position.set(x0, y);
    body.addChild(eco);
    const gi = icon('gold', 34);
    gi.position.set(17, 18);
    this.goldText = txt('', { fontFamily: F.heavy, fontSize: 24, fill: C.ink });
    this.goldText.position.set(42, 2);
    eco.addChild(gi, this.goldText);
    y += 50;

    // ------------------------------------------------ combat sheet
    const cb = def.combat;
    const shotEl = ELEMENT_BY_ID.get(cb.shot.element);
    const cards: [string, string, string, number][] = [
      ['DISPARO', `${cb.shot.name}${cb.shot.cry ? ` — ${cb.shot.cry}` : ''}`, `${(shotEl as unknown as { shotRule?: string })?.shotRule ?? ''} Daño ${cb.shot.dmg}${cb.shot.status ? ` · ${cb.shot.status} ${cb.shot.statusTurns}t` : ''}.${cb.shot.special ? ' ' + cb.shot.special : ''}`, fx.main],
      ['ULTIMATE', cb.ultimate.name, cb.ultimate.effect, C.pinkHot],
      ['PASIVA', 'Siempre activa', cb.passive, C.mint],
      ['LIMITACIÓN', cb.limitation ? 'Ojo' : 'Ninguna', cb.limitation ?? 'Sin limitaciones. Disfrútalo.', C.paperDark],
    ];
    const cw = (RW - 16) / 2;
    const chh = 128;
    cards.forEach(([k, t, d, col], i) => {
      const cc = new Container();
      const g = new Graphics().rect(5, 5, cw, chh).fill(C.ink).rect(0, 0, cw, chh).fill(C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
      g.rect(0, 0, 12, chh).fill(col);
      const kt = txt(k, { fontFamily: F.bebas, fontSize: 18, fill: C.ink, letterSpacing: 2 });
      kt.position.set(24, 6);
      const tt = txt(t, { fontFamily: F.poster, fontSize: 20, fill: C.ink });
      tt.position.set(24, 28);
      if (tt.width > cw - 36) tt.scale.set((cw - 36) / tt.width);
      const dt = txt(d, { fontFamily: F.ui, fontSize: 13, fill: C.ink, wordWrap: true, wordWrapWidth: cw - 36, lineHeight: 16 });
      dt.position.set(24, 58);
      if (dt.height > chh - 64) dt.scale.set((chh - 64) / dt.height);
      cc.addChild(g, kt, tt, dt);
      cc.position.set(x0 + (i % 2) * (cw + 16), y + Math.floor(i / 2) * (chh + 12));
      body.addChild(cc);
    });
    y += 2 * (chh + 12);
    const stars = txt(`${c.stars >= 3 ? '★' : '☆'} ${cb.star3}    ${c.stars >= 5 ? '★' : '☆'} ${cb.star5}`, { fontFamily: F.ui, fontSize: 13, fill: C.ink, wordWrap: true, wordWrapWidth: RW });
    stars.alpha = 0.75;
    stars.position.set(x0, y);
    body.addChild(stars);
    y += stars.height + 8;
    const lore = wrapText(`“${def.lore}”`, RW, 17, F.serif, C.ink, { fontStyle: 'italic' });
    lore.position.set(x0, Math.min(y, this.m.innerH - lore.height - 4));
    body.addChild(lore);
    this.refresh(false);
  }

  private drawFrame(FW: number, FH: number, rarity: keyof typeof RARITY, fx: { main: number; accent: number; dark: number }) {
    const f = this.frame;
    const r = RARITY[rarity] ?? RARITY.common;
    const g = new Graphics();
    g.rect(10, 10, FW, FH).fill(C.ink);
    const bgCol = mix(fx.main, C.paper, 0.7);
    g.rect(0, 0, FW, FH).fill(bgCol);
    f.addChild(g);
    const dots = new TilingSprite({ texture: halftoneTexture(mix(fx.main, C.ink, 0.25), 14, 2.6), width: FW, height: FH * 0.55 });
    dots.alpha = 0.25;
    f.addChild(dots);
    // big accent circle (swiss)
    const circ = new Graphics().circle(FW * 0.68, FH * 0.3, 170).fill({ color: fx.accent, alpha: 0.55 });
    f.addChild(circ);
    // island base
    const base = new Graphics();
    base.ellipse(FW / 2, FH - 116, 200, 62).fill(0x9a6334).stroke({ width: 4, color: C.ink });
    base.ellipse(FW / 2, FH - 132, 200, 60).fill(0xa6cf7e).stroke({ width: 4, color: C.ink });
    base.ellipse(FW / 2 - 60, FH - 140, 40, 10).fill({ color: 0xffffff, alpha: 0.3 });
    for (const [x, y] of [
      [-140, -128],
      [120, -140],
      [150, -118],
    ])
      base.moveTo(FW / 2 + x - 5, FH + y).lineTo(FW / 2 + x - 2, FH + y - 10).moveTo(FW / 2 + x + 2, FH + y).lineTo(FW / 2 + x + 4, FH + y - 9).stroke({ width: 3, color: 0x6f9e4f, cap: 'round' });
    f.addChild(base);
    // print-quality frame by rarity (07 §3.16)
    const fr = new Graphics();
    if (rarity === 'common') {
      fr.rect(0, 0, FW, FH).stroke({ width: 12, color: 0x9a8f80, alignment: 1 });
    } else if (rarity === 'rare') {
      fr.rect(3, -3, FW, FH).stroke({ width: 10, color: C.pink, alignment: 1, alpha: 0.8 });
      fr.rect(0, 0, FW, FH).stroke({ width: 10, color: C.megaBlue, alignment: 1 });
    } else if (rarity === 'epic') {
      fr.rect(-4, 3, FW, FH).stroke({ width: 10, color: C.cyan, alignment: 1, alpha: 0.85 });
      fr.rect(4, -3, FW, FH).stroke({ width: 10, color: C.yellow, alignment: 1, alpha: 0.85 });
      fr.rect(0, 0, FW, FH).stroke({ width: 10, color: C.pinkHot, alignment: 1 });
    } else if (rarity === 'legendary') {
      fr.rect(0, 0, FW, FH).stroke({ width: 14, color: C.gold, alignment: 1 });
      fr.rect(8, 8, FW - 16, FH - 16).stroke({ width: 2, color: 0xffd77a, alignment: 1 });
      const sh = new Graphics().poly([0, 0, 60, 0, -140, FH, -200, FH]).fill({ color: 0xffffff, alpha: 0.28 });
      const mask = new Graphics().rect(0, 0, FW, FH).fill(0xffffff);
      sh.mask = mask;
      f.addChild(mask, sh);
      this.sheen = sh;
    } else {
      const holo = new Graphics();
      const cols = [C.cyan, C.pinkHot, C.yellow, C.violet, C.mint];
      for (let i = 0; i < 5; i++) holo.rect(i * 2, i * 2, FW - i * 4, FH - i * 4).stroke({ width: 3, color: cols[i], alignment: 1 });
      f.addChild(holo);
      this.holo = holo;
    }
    fr.rect(0, 0, FW, FH).stroke({ width: 3, color: C.ink, alignment: 0 });
    f.addChild(fr);
    // corner stamp: rarity name
    const st = new Container();
    const sb = new Graphics().rect(0, 0, 150, 40).fill(r.color).stroke({ width: 3, color: C.ink });
    const stt = txt(r.name, { fontFamily: F.poster, fontSize: 26, fill: rarity === 'common' || rarity === 'legendary' ? C.ink : C.paper });
    stt.anchor.set(0.5);
    stt.position.set(75, 20);
    st.addChild(sb, stt);
    st.position.set(FW - 170, 20);
    st.rotation = 0.06;
    f.addChild(st);
  }

  private showIsland() {
    this.stage.removeChildren().forEach((x) => x.destroy({ children: true }));
    const c = this.c;
    const ic = new IslandCat(slugOf(c.species), 400);
    applyCatTint(ic.sprite, c.species);
    const ts = catDef(c.species).art.tint?.scale;
    if (ts) ic.baseScale *= ts;
    ic.scale.set(catLevelScale(c.level));
    this.stage.addChild(ic);
    this.islandCat = ic;
    this.battleCat = null;
  }
  private toggleForm(btn: Button) {
    const c = this.c;
    const def = catDef(c.species);
    this.battleMode = !this.battleMode;
    sfx(this.battleMode ? 'charge' : 'pop');
    if (this.battleMode) {
      this.stage.removeChildren().forEach((x) => x.destroy({ children: true }));
      const bc = new BattleCat(slugOf(c.species), def.elements[0], 380);
      applyCatTint(bc.sprite, c.species);
      this.stage.addChild(bc);
      this.battleCat = bc;
      this.islandCat = null;
      const name = txt(def.battleForm.name, { fontFamily: F.heavy, fontSize: 26, fill: C.paper, stroke: { color: C.ink, width: 6, join: 'round' } });
      name.anchor.set(0, 0.5);
      name.position.set(-250, -438);
      if (name.width > 330) name.scale.set(330 / name.width);
      this.stage.addChild(name);
      onomatopoeia(this.m.panel, 28 + 270, 108 + 200, def.battleForm.cry, { size: 54, color: elementFx(def.elements[0]).accent, font: F.heavy, dur: 1.1 });
      flash(scenes.fxLayer, elementFx(def.elements[0]).main, 0.35, 0.2);
      btn.setText('VER FORMA ISLA');
    } else {
      this.showIsland();
      btn.setText('VER BATTLE FORM');
    }
  }

  private drawStars() {
    const b = this.starsBox;
    b.removeChildren().forEach((x) => x.destroy({ children: true }));
    const c = this.c;
    for (let i = 0; i < 6; i++) {
      const s = icon('star', 34, i < c.stars ? C.yellow : C.paperDark);
      s.position.set(20 + i * 38, 22);
      b.addChild(s);
    }
    const orbs = G.s.orbs[c.species] ?? 0;
    const need = c.stars < 6 ? starNeed(c) : 0;
    const oi = icon('orb', 30, elementFx(catDef(c.species).elements[0]).main);
    oi.position.set(266, 22);
    const ot = txt(c.stars < 6 ? `${fmt(orbs)} / ${fmt(need)} orbes` : `${fmt(orbs)} orbes · ★ máx.`, { fontFamily: F.heavy, fontSize: 20, fill: C.ink });
    ot.position.set(288, 9);
    b.addChild(oi, ot);
    const altarOn = hudUnlocks().altar;
    const ab = new Button(altarOn ? 'ALTAR' : 'ALTAR 🔒', () => {
      if (!altarOn) {
        sfx('error');
        toast('El Altar de Almas aún duerme', { sub: 'Junta 10 orbes de un mismo gato (misión «Primeros orbes»).' });
        return;
      }
      this.m.close();
      openAltar(this.uid);
    }, { w: 130, h: 44, size: 22, color: altarOn ? C.lilac : C.paperDark });
    ab.position.set(410, 0);
    b.addChild(ab);
  }

  // ================================================================== live refresh
  private refresh(animate = true) {
    const c = this.c;
    if (!c || this.lvText.destroyed) return;
    this.lvText.text = String(c.level);
    const cap = levelCap();
    this.capText.text = c.level >= cap ? `TOPE Nv ${cap} (sube tu Reino)` : `tope Nv ${cap}`;
    this.capText.style.fill = c.level >= cap ? C.red : C.ink;
    const segW = 92;
    this.segs.forEach((g, i) => {
      const on = i < c.bites;
      g.clear().rect(4, 4, segW, 52).fill(C.ink).rect(0, 0, segW, 52).fill(on ? C.pinkHot : C.paperDark).stroke({ width: 3, color: C.ink, alignment: 1 });
      if (on) g.rect(6, 6, segW - 12, 10).fill({ color: 0xffffff, alpha: 0.35 });
    });
    const cost = biteCost(c);
    this.costText.text = c.level >= cap ? 'TOPE' : `−${fmt(cost)} 🐟  (tienes ${fmt(G.s.food)})`;
    const th = nextThreshold(c);
    if (th && th.up) {
      const n = th.level - c.level;
      this.thresholdText.text = n <= 0 ? '' : `en ${n} nivel${n > 1 ? 'es' : ''}: ¡${th.up.name.toUpperCase()}! — ${th.up.effect}`;
    } else this.thresholdText.text = 'Su ataque ya es leyenda.';
    // gold/s (cat base × habitat tier × global)
    const h = c.habitat ? habitat(c.habitat) : null;
    const gps = catGold(c) * (h ? habitatTier(h.tier).mult : 0) * globalGoldMult();
    this.goldText.text = h ? `Produce +${fmt(gps)} oro/s · vive en el hábitat de ${(ELEMENT_NAME[h.element] ?? h.element).toLowerCase()}` : 'SIN CASA: no produce oro (constrúyele un hábitat)';
    this.goldText.style.fill = h ? C.ink : C.red;
    if (this.feedToText) this.setFeedTarget(this.feedTarget, false);
    void animate;
  }

  private setFeedTarget(v: number, sound = true) {
    const c = this.c;
    const cap = levelCap();
    this.feedTarget = Math.max(Math.min(c.level + 1, cap), Math.min(cap, v));
    this.feedToText.text = `HASTA NV ${this.feedTarget}`;
    if (sound) sfx('tick');
  }

  // ================================================================== feeding (storyboard i)
  private startHold() {
    if (this.feeding) return;
    this.holdDelay = 250;
    gsap.to(this.feedFace.scale, { x: 0.92, y: 0.92, duration: 0.06 });
    this.bite();
    const loop = () => {
      this.holdTimer = window.setTimeout(() => {
        if (this.m.closed) return;
        if (!this.bite()) return this.stopHold();
        this.holdDelay = Math.max(120, this.holdDelay * 0.88);
        loop();
      }, this.holdDelay);
    };
    loop();
  }
  private stopHold() {
    if (this.holdTimer !== null) window.clearTimeout(this.holdTimer);
    this.holdTimer = null;
    if (!this.feedFace.destroyed) gsap.to(this.feedFace.scale, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' });
  }

  /** one bite; returns false when feeding must stop */
  private bite(quiet = false): boolean {
    const c = this.c;
    const before = c.level;
    const r = feed(c);
    if (r === 'poor') {
      sfx('error');
      this.bag.fromTo(this.feedFace, { x: this.feedFace.x - 10 }, { x: this.feedFace.x, duration: 0.35, ease: 'elastic.out(1,0.3)' });
      toast('Te faltan Pescaditos', { icon: 'food', sub: 'Ve al Muelle de Pesca: siembra, espera, cosecha.', color: C.paper });
      return false;
    }
    if (r === 'cap') {
      sfx('error');
      toast(`Tope de nivel: Nv ${levelCap()}`, { icon: 'crown', sub: 'Cada nivel de Reino sube el tope +1.' });
      return false;
    }
    const now = performance.now();
    if (now - this.lastBite > 1200) this.streak = 0;
    this.lastBite = now;
    const semis = Math.min(12, this.streak++);
    this.fishArc(() => {
      if (this.m.closed) return;
      if (!quiet) sfx('nyam', Math.pow(2, semis / 12));
      this.chomp(quiet);
      if (r === 'level') this.levelUp(c.level, before, quiet);
      this.refresh();
    }, quiet);
    if (r === 'level') checkMissions();
    return true;
  }

  private catPoint() {
    // mouth-ish point of the cat in panel coords
    return { x: 28 + 270, y: 108 + 590 - 120 - 230 };
  }

  private fishArc(onArrive: () => void, quiet: boolean) {
    const fromG = this.feedFace.getGlobalPosition();
    const p = this.m.panel;
    const from = p.toLocal(fromG);
    const to = this.catPoint();
    if (quiet) {
      onArrive();
      return;
    }
    const fish = icon('food', 40);
    fish.position.set(from.x, from.y);
    p.addChild(fish);
    const o = { t: 0 };
    this.bag.to(o, {
      t: 1,
      duration: 0.25,
      ease: 'power1.in',
      onUpdate: () => {
        const t = o.t;
        fish.x = from.x + (to.x - from.x) * t;
        fish.y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 160;
        fish.rotation = -t * 3;
      },
      onComplete: () => {
        fish.destroy({ children: true });
        onArrive();
      },
    });
  }

  private chomp(quiet: boolean) {
    const tgt = this.stage;
    this.bag.fromTo(tgt.scale, { x: 1.08, y: 0.88 }, { x: 1, y: 1, duration: 0.32, ease: 'elastic.out(1.4,0.35)' });
    if (quiet) return;
    const to = this.catPoint();
    const word = NYAMS[Math.floor(Math.random() * NYAMS.length)];
    onomatopoeia(this.m.panel, to.x + 190 + (Math.random() - 0.5) * 40, to.y - 70, word, { size: 64, color: C.pink, font: Math.random() < 0.5 ? F.comic : F.brush, dur: 0.6 });
    // crumbs + heart
    for (let i = 0; i < 6; i++) {
      const g = new Graphics().circle(0, 0, 3 + Math.random() * 3).fill(Math.random() < 0.5 ? 0x7fd8ff : C.paper).stroke({ width: 1.5, color: C.ink });
      g.position.set(to.x, to.y + 20);
      this.m.panel.addChild(g);
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 50;
      this.bag.to(g, { x: to.x + Math.cos(a) * d, y: to.y + 20 + Math.sin(a) * d + 30, alpha: 0, duration: 0.5, ease: 'power2.out', onComplete: () => g.destroy() });
    }
    if (Math.random() < 0.5) {
      const h = txt('♥', { fontFamily: F.ui, fontSize: 34, fill: C.pinkHot, stroke: { color: C.ink, width: 4 } });
      h.anchor.set(0.5);
      h.position.set(to.x - 60, to.y);
      this.m.panel.addChild(h);
      this.bag.to(h, { y: to.y - 80, alpha: 0, duration: 0.9, ease: 'power1.out', onComplete: () => h.destroy() });
    }
  }

  private levelUp(level: number, before: number, quiet: boolean) {
    const p = this.m.panel;
    const lp = p.toLocal(this.lvText.getGlobalPosition());
    this.bag.fromTo(this.lvText.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
    this.islandCat?.hop();
    this.islandCat?.scale.set(catLevelScale(level));
    if (quiet) {
      sfx('tick', 1 + Math.min(1, level / 50));
      sparkles(p, lp.x + 40, lp.y + 50, C.yellow, 4, 50);
      return;
    }
    sfx('levelup');
    flash(scenes.fxLayer, C.paper, 0.25, 0.18);
    const t = this.catPoint();
    floatText(p, t.x, t.y - 120, `¡NIVEL ${level}!`, { size: 72, color: C.yellow, font: F.comic, rise: 60, dur: 1.2 });
    sparkles(p, lp.x + 40, lp.y + 50, C.yellow, 12, 120);
    // threshold → T2
    if ([10, 20, 30, 40].includes(level) && before < level) {
      const def = catDef(this.c.species);
      const el = ELEMENT_BY_ID.get(def.combat.shot.element);
      const up = el?.levelUpgrades[String(level)];
      if (up) {
        sfx('fanfare');
        toast(`¡SU ATAQUE EVOLUCIONÓ! ${up.name.toUpperCase()}`, { sub: up.effect, color: C.pinkHot, dur: 3.2, icon: 'flame' });
      }
    }
  }

  /** Reino 6: feed level by level (intermediate T0, last T1) */
  private async feedTo() {
    if (this.feeding) return;
    const c = this.c;
    const target = Math.min(this.feedTarget, levelCap());
    if (c.level >= target) {
      sfx('error');
      return;
    }
    this.feeding = true;
    G.count('feature_feed_bulk');
    checkMissions();
    const start = c.level;
    let stop = false;
    while (!stop && this.c.level < target && !this.m.closed) {
      const lv = this.c.level;
      let guard = 0;
      while (this.c.level === lv && guard++ < 6) {
        const r = feed(this.c);
        if (r === 'poor' || r === 'cap') {
          stop = true;
          if (r === 'poor') toast('Se acabaron los Pescaditos', { icon: 'food', sub: `Llegó a Nv ${this.c.level}.`, color: C.paper });
          break;
        }
      }
      if (this.c.level > lv) {
        const last = this.c.level >= target;
        this.levelUp(this.c.level, lv, !last);
        if (last) this.chomp(false);
        else this.chomp(true);
        this.refresh();
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    if (this.c.level > start) {
      sfx('nyam', 1.5);
      checkMissions();
    }
    this.refresh();
    this.feeding = false;
  }

  // ================================================================== name editing (DOM overlay)
  private editName() {
    const c = this.c;
    const gp = this.m.panel.getGlobalPosition();
    openInput(c.name, { x: gp.x + 28 * game.scale, y: gp.y + 11 * game.scale, w: 620, h: 64 }, (v) => {
      if (v && renameCat(this.c, v)) {
        sfx('meow', 1.2);
        toast(`¡Se llama ${this.c.name}!`, { icon: 'paw', sub: 'Ya no hay vuelta atrás. (Sí la hay: el botón de renombrar.)' });
        // retitle the band
        const t = this.m.panel.children.find((x) => x instanceof Text && x.style.fontFamily === F.poster && x.y === 4) as Text | undefined;
        if (t) t.text = this.c.name.toUpperCase();
      }
    });
  }

  private onTick(t: Ticker) {
    this.tt += t.deltaMS / 1000;
    if (this.sheen) this.sheen.x = ((this.tt * 260) % 1100) - 100;
    if (this.holo) this.holo.tint = [0xffffff, 0xffe0f0, 0xe0fff8, 0xfff6d0][Math.floor(this.tt * 6) % 4];
  }
}

function smallBtn(label: string, onTap: () => void) {
  const b = new Container();
  const g = new Graphics().rect(0, 0, 40, 40).fill(C.paper).stroke({ width: 3, color: C.ink });
  const t = txt(label, { fontFamily: F.poster, fontSize: 28, fill: C.ink });
  t.anchor.set(0.5);
  t.position.set(20, 19);
  b.addChild(g, t);
  b.eventMode = 'static';
  b.cursor = 'pointer';
  b.on('pointertap', onTap);
  return b;
}

// ------------------------------------------------------------------ DOM text input over the canvas
let inputEl: HTMLInputElement | null = null;
function removeInput() {
  inputEl?.remove();
  inputEl = null;
}
function openInput(value: string, box: { x: number; y: number; w: number; h: number }, done: (v: string | null) => void) {
  removeInput();
  const canvas = game.pixi.canvas as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  const s = game.scale;
  const el = document.createElement('input');
  el.value = value;
  el.maxLength = 18;
  Object.assign(el.style, {
    position: 'fixed',
    left: `${rect.left + box.x}px`,
    top: `${rect.top + box.y}px`,
    width: `${box.w * s}px`,
    height: `${box.h * s}px`,
    font: `${Math.round(48 * s)}px Anton, sans-serif`,
    background: '#EDE4D6',
    color: '#171317',
    border: `${Math.max(2, 4 * s)}px solid #171317`,
    boxShadow: `${6 * s}px ${6 * s}px 0 #171317`,
    padding: `0 ${12 * s}px`,
    outline: 'none',
    zIndex: '50',
    textTransform: 'uppercase',
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
  inputEl = el;
  setTimeout(() => {
    el.focus();
    el.select();
  }, 30);
  let finished = false;
  const finish = (v: string | null) => {
    if (finished) return;
    finished = true;
    removeInput();
    done(v);
  };
  el.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') finish(el.value);
    if (e.key === 'Escape') finish(null);
  });
  el.addEventListener('blur', () => finish(el.value));
  void Sprite;
}
