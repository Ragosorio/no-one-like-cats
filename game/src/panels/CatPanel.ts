/**
 * Cat panel (EDITORIAL SUIZO + the element's dimension in Battle Form):
 * big island art with rarity print-quality frame, Battle Form toggle, editable name, chips,
 * level + 4-bite ¡ÑAM! bar (tap = 1 bite, hold = accelerating chain, storyboard i), feed-to (Reino 6),
 * next threshold, stars + orbs (→ Altar), gold/s, combat sheet and lore.
 */
import '../island/safety';
import { Container, Graphics, Sprite, Text, Texture, Ticker, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { fitBlock, fitLine } from '../ui/fit';
import { Modal, toast } from '../ui/modal';
import { scenes } from '../core/scenes';
import { game } from '../core/App';
import { C, F, RARITY } from '../ui/theme';
import { Button, txt } from '../ui/widgets';
import { icon } from '../ui/icons';
import { G, OwnedCat } from '../state/game';
import { catDef, ROLE_BY_ID, CONTENT, ELEMENT_BY_ID } from '../data/content';
import { ELEMENT_NAME } from '../data/elementsMeta';
import { biteCost, canStarUp, cat as getCat, catGold, feed, levelCap, mutationOf, nextThreshold, starNeed, starPerks, traitOf } from '../state/sys/cats';
import { koRank, rankDef, rankProgress } from '../state/sys/ranks';
import { limitationText, mutationLook, mutationShort, starCapNote, starInfo, starMissing, starRoadmap } from '../state/ext/collection';
import { collState } from '../state/sys/cats';
import { dnaIcon, heart, killTree, pencil } from './collection/ui';
import { mutationOverlay, syncMutationOverlay } from './collection/art';
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
/** level numeral: center x and max width inside the NIVEL block */
const LV_CX = 84;
const LV_MAXW = 140;
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
  private lvBase = 1;
  private lvPopping = false;
  starsBox = new Container();
  private holdTimer: number | null = null;
  private holdDelay = 250;
  private streak = 0;
  private lastBite = 0;
  private sheen: Graphics | null = null;
  private holo: Graphics | null = null;
  private halo: Graphics | null = null;
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
    const origClose = this.m.close.bind(this.m);
    this.m.close = () => {
      if (!this.m.closed) killTree(this.starsBox);
      origClose();
    };
    // the same cat changed somewhere else (another panel, an expedition, a patch): show it now
    this.m.listen(
      G.on('cat', (e) => {
        if (e.uid === this.uid && !this.m.closed) this.refresh(false);
      }),
    );
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
    const pi = pencil(22);
    pi.position.set(20, 22);
    const pt = txt('RENOMBRAR', { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 1 });
    pt.position.set(36, 9);
    pen.addChild(pb, pi, pt);
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
    this.koBadge(FW);
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
    if (def.worker) chips.push(chip(`OFICIO: ${(WORKER_NAME[def.worker] ?? def.worker).toUpperCase()}`, C.mint, C.ink, 22));
    if (c.holo) chips.push(chip('HOLO', C.cyan, C.ink, 22));
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
    y += 46;
    // rasgo + mutación (combat-only effects, readable)
    y = this.traitCards(x0, y, RW);
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
    // centered so the level-up pop grows in place instead of spilling over "tope Nv" and the ÑAM bar
    this.lvText = txt(String(c.level), { fontFamily: F.poster, fontSize: 96, fill: C.ink });
    this.lvText.anchor.set(0.5, 0.5);
    this.lvText.position.set(LV_CX, 94);
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
      const li = icon('lock', 20);
      li.position.set(10, 20);
      const lk = txt(`Alimentar hasta Nv X · Reino ${featureKl('feed_bulk')}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
      lk.alpha = 0.55;
      li.alpha = 0.55;
      lk.position.set(26, 10);
      ftC.addChild(li, lk);
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
    const lim = limitationText(def);
    const cards: [string, string, string, number][] = [
      ['DISPARO', `${cb.shot.name}${cb.shot.cry ? ` — ${cb.shot.cry}` : ''}`, shotDescription(c), fx.main],
      ['ULTIMATE', cb.ultimate.name, cb.ultimate.effect, C.pinkHot],
      ['PASIVA', 'Siempre activa', cb.passive, C.mint],
      ['LIMITACIÓN', lim ? lim.split(':')[0].slice(0, 28) : 'Ninguna', lim ? (lim.includes(':') ? lim.slice(lim.indexOf(':') + 1).trim() : lim) : 'Sin limitaciones. Disfrútalo.', C.paperDark],
    ];
    const cw = (RW - 16) / 2;
    const chh = 112;
    cards.forEach(([k, t, d, col], i) => {
      const cc = new Container();
      const g = new Graphics().rect(5, 5, cw, chh).fill(C.ink).rect(0, 0, cw, chh).fill(C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
      g.rect(0, 0, 12, chh).fill(col);
      const kt = txt(k, { fontFamily: F.bebas, fontSize: 18, fill: C.ink, letterSpacing: 2 });
      kt.position.set(24, 6);
      const tt = txt(t, { fontFamily: F.poster, fontSize: 20, fill: C.ink });
      tt.position.set(24, 28);
      if (tt.width > cw - 36) tt.scale.set((cw - 36) / tt.width);
      // re-wrap at a smaller size before shrinking the whole block (long ultimates used to turn into ant text)
      const dt = fitBlock(d, cw - 36, chh - 58, { fontFamily: F.ui, fill: C.ink }, [15, 14, 13, 12, 11]);
      dt.position.set(24, 54);
      cc.addChild(g, kt, tt, dt);
      cc.position.set(x0 + (i % 2) * (cw + 16), y + Math.floor(i / 2) * (chh + 12));
      body.addChild(cc);
    });
    y += 2 * (chh + 12);
    y = this.starPerkRow(x0, y, RW);
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
    } else if (rarity === 'heroic') {
      // carmesí + laureles
      fr.rect(0, 0, FW, FH).stroke({ width: 16, color: C.red, alignment: 1 });
      fr.rect(9, 9, FW - 18, FH - 18).stroke({ width: 3, color: 0xffc94a, alignment: 1 });
      const laurel = new Graphics();
      for (const dir of [-1, 1]) {
        for (let i = 0; i < 9; i++) {
          const a = Math.PI / 2 + dir * (0.3 + i * 0.16);
          const lx = FW / 2 + Math.cos(a) * 190;
          const ly = FH - 150 + Math.sin(a) * 70 - i * 6;
          laurel.ellipse(lx, ly, 7, 16).fill(0xffc94a).stroke({ width: 2, color: C.ink });
        }
      }
      f.addChild(laurel);
      const sh = new Graphics().poly([0, 0, 50, 0, -150, FH, -200, FH]).fill({ color: 0xffd27a, alpha: 0.3 });
      const mask = new Graphics().rect(0, 0, FW, FH).fill(0xffffff);
      sh.mask = mask;
      f.addChild(mask, sh);
      this.sheen = sh;
    } else if (rarity === 'divine') {
      // nácar + halo
      const cols = [0xfffaf0, 0xf2cfe0, 0xcdeee6, 0xded6fb, 0xfff0cc];
      for (let i = 0; i < 5; i++) fr.rect(i * 3, i * 3, FW - i * 6, FH - i * 6).stroke({ width: 4, color: cols[i], alignment: 1 });
      fr.rect(15, 15, FW - 30, FH - 30).stroke({ width: 2, color: 0xc9a45a, alignment: 1 });
      const halo = new Graphics().ellipse(FW / 2, 70, 120, 26).stroke({ width: 10, color: 0xffe08a }).ellipse(FW / 2, 70, 120, 26).stroke({ width: 3, color: 0xffffff });
      f.addChild(halo);
      this.halo = halo;
      const sh = new Graphics().poly([0, 0, 90, 0, -110, FH, -200, FH]).fill({ color: 0xffffff, alpha: 0.35 });
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
    ic.scale.set(catLevelScale(c.level) * (mutationLook(c.mutation)?.scale ?? 1));
    this.stage.addChild(ic);
    this.islandCat = ic;
    this.battleCat = null;
    this.mutOverlay = mutationOverlay(ic.sprite, c.species, c.mutation);
    if (this.mutOverlay) ic.addChild(this.mutOverlay);
  }
  private mutOverlay: Container | null = null;

  /** K.O. rank medal (state/sys/ranks, combat counts OwnedCat.kos) */
  private koBadge(FW: number) {
    const kos = this.c.kos ?? 0;
    const r = koRank(kos);
    const d = rankDef(kos);
    const b = new Container();
    b.position.set(24, 22);
    const metal = d.metal === 'none' ? 0xb8ae9e : d.color;
    // ribbon tails
    const rib = new Graphics()
      .poly([-16, 18, -4, 18, -10, 62, -18, 54])
      .fill(C.pinkHot)
      .stroke({ width: 2, color: C.ink })
      .poly([4, 18, 16, 18, 18, 54, 10, 62])
      .fill(C.megaBlue)
      .stroke({ width: 2, color: C.ink });
    const disc = new Graphics().circle(0, 0, 30).fill(metal).stroke({ width: 4, color: C.ink }).circle(0, 0, 22).stroke({ width: 2, color: C.ink, alpha: 0.5 });
    for (let i = 0; i < Math.min(3, ((r.tier - 1) % 3) + 1) && r.tier > 0; i++) disc.star(-12 + i * 12, 0, 5, 6, 2.6).fill(C.ink);
    if (r.tier === 0) disc.moveTo(-8, 0).lineTo(8, 0).stroke({ width: 3, color: C.ink, alpha: 0.4 });
    b.addChild(rib, disc);
    const nm = txt(r.tier ? r.name.toUpperCase() : 'SIN RANGO', { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 1 });
    const sub = txt(`${kos} K.O.${r.next !== null ? ` · siguiente a ${r.next}` : ' · TOPE'}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 12, fill: C.ink });
    const w = Math.max(nm.width, sub.width) + 22;
    const plate = new Graphics().rect(38, -24, w, 48).fill(C.paper).stroke({ width: 3, color: C.ink });
    const pk = rankProgress(kos);
    plate.rect(38, 20, w * pk, 4).fill(metal);
    nm.position.set(48, -24);
    sub.position.set(48, 1);
    b.addChildAt(plate, 0);
    b.addChild(nm, sub);
    b.rotation = -0.04;
    this.frame.addChild(b);
    void FW;
  }

  /** RASGO + MUTACIÓN cards (combat-only, GDD 2.5) */
  private traitCards(x0: number, y: number, RW: number) {
    const c = this.c;
    const tr = traitOf(c);
    const mu = mutationOf(c);
    const body = this.m.body;
    const cards: { kind: string; name: string; eff: string; col: number; node: Container }[] = [];
    if (tr) {
      const ic = new Graphics().circle(0, 0, 16).fill(C.lilac).stroke({ width: 3, color: C.ink });
      ic.circle(-5, -3, 3).fill(C.ink).circle(5, -3, 3).fill(C.ink).moveTo(-6, 6).quadraticCurveTo(0, 10, 6, 6).stroke({ width: 2.5, color: C.ink, cap: 'round' });
      cards.push({ kind: 'RASGO', name: tr.name, eff: tr.effect, col: C.lilac, node: ic });
    }
    if (mu) cards.push({ kind: 'MUTACIÓN', name: mutationShort(mu.id) ?? mu.name, eff: mu.effect, col: mutationLook(mu.id)?.color ?? C.pinkHot, node: dnaIcon(30, C.ink) });
    if (!cards.length) return y;
    const gap = 14;
    const cw = cards.length === 1 ? RW : (RW - gap) / 2;
    let hMax = 0;
    const built = cards.map((k, i) => {
      const cc = new Container();
      const kt = txt(`${k.kind} · ${k.name.toUpperCase()}`, { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 1 });
      const et = txt(k.eff, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink, wordWrap: true, wordWrapWidth: cw - 74, lineHeight: 17 });
      kt.position.set(60, 6);
      et.position.set(60, 32);
      const h = Math.max(64, et.height + 42);
      hMax = Math.max(hMax, h);
      cc.addChild(kt, et);
      k.node.position.set(30, 32);
      cc.addChild(k.node);
      cc.position.set(x0 + i * (cw + gap), y);
      return { cc, k };
    });
    for (const { cc, k } of built) {
      const g = new Graphics().rect(5, 5, cw, hMax).fill(C.ink).rect(0, 0, cw, hMax).fill(C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
      g.rect(0, 0, 10, hMax).fill(k.col);
      cc.addChildAt(g, 0);
      body.addChild(cc);
    }
    return y + hMax + 16;
  }

  /** ★2…★6: what each star gives, lit when active */
  private starPerkRow(x0: number, y: number, RW: number) {
    const c = this.c;
    const road = starRoadmap(c);
    const perks = starPerks(c);
    const body = this.m.body;
    const gap = 8;
    const tw = (RW - gap * (road.length - 1)) / road.length;
    const th = 50;
    road.forEach((st, i) => {
      const t = new Container();
      t.position.set(x0 + i * (tw + gap), y);
      const on = st.state === 'done';
      const g = new Graphics().rect(0, 0, tw, th).fill(on ? C.yellow : st.state === 'next' ? C.paper : C.paperDark).stroke({ width: 2.5, color: C.ink });
      const s1 = txt(`★${st.star}`, { fontFamily: F.poster, fontSize: 24, fill: on ? C.ink : 0x8a8070 });
      s1.position.set(8, 4);
      const tt = txt(st.title, { fontFamily: F.bebas, fontSize: 16, fill: C.ink, letterSpacing: 1 });
      tt.position.set(46, 4);
      if (tt.width > tw - 52) tt.scale.set((tw - 52) / tt.width);
      const lv = txt(on ? 'ACTIVA' : `NV ${st.minLevel}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 12, fill: on ? C.green : C.ink });
      lv.position.set(46, 27);
      t.addChild(g, s1, tt, lv);
      if (!on) t.alpha = 0.8;
      body.addChild(t);
    });
    let yy = y + th + 8;
    const active = [perks.star3 ? `★3 ${perks.star3}` : null, perks.star5 ? `★5 ${perks.star5}` : null].filter(Boolean).join('   ·   ');
    const def = catDef(c.species);
    const line = active || `Próximo efecto: ★3 ${def.combat.star3.replace(/^★3:\s*/, '')}`;
    const lt = txt(line, { fontFamily: F.ui, fontSize: 13, fill: C.ink, wordWrap: true, wordWrapWidth: RW, fontStyle: active ? 'normal' : 'italic' });
    lt.alpha = active ? 1 : 0.7;
    lt.position.set(x0, yy);
    body.addChild(lt);
    yy += lt.height + 8;
    return yy;
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

  private starsKey = '';
  private drawStars() {
    const b = this.starsBox;
    const c = this.c;
    const key = `${c.level}|${c.stars}|${G.s.orbs[c.species] ?? 0}|${G.s.prisma}`;
    if (key === this.starsKey) return;
    this.starsKey = key;
    killTree(b);
    b.removeChildren().forEach((x) => x.destroy({ children: true }));
    for (let i = 0; i < 6; i++) {
      const s = icon('star', 30, i < c.stars ? C.yellow : C.paperDark);
      s.position.set(18 + i * 33, 22);
      b.addChild(s);
    }
    const orbs = G.s.orbs[c.species] ?? 0;
    const need = c.stars < 6 ? starNeed(c) : 0;
    const oi = icon('orb', 30, elementFx(catDef(c.species).elements[0]).main);
    oi.position.set(232, 22);
    const ot = txt(c.stars < 6 ? `${fmt(orbs)} / ${fmt(need)} orbes` : `${fmt(orbs)} orbes · ★ máx.`, { fontFamily: F.heavy, fontSize: 20, fill: C.ink });
    ot.position.set(252, 9);
    fitLine(ot, 410 - 10 - 252); // never under the ALTAR button
    b.addChild(oi, ot);
    const altarOn = hudUnlocks().altar;
    const usePrisma = collState().usePrisma !== false;
    const can = altarOn && canStarUp(c, usePrisma);
    const si = starInfo(c, usePrisma);
    const ab = new Button(altarOn ? (can ? '¡ALTAR!' : 'ALTAR') : 'ALTAR', () => {
      if (!altarOn) {
        sfx('error');
        toast('El Altar de Almas aún duerme', { sub: 'Junta 10 orbes de un mismo gato (misión «Primeros orbes»).' });
        return;
      }
      this.m.close();
      openAltar(this.uid);
    }, { w: 130, h: 44, size: 22, color: can ? C.pinkHot : C.paper, textColor: can ? C.paper : C.ink });
    ab.position.set(410, 0);
    b.addChild(ab);
    if (!altarOn) {
      const lk = icon('lock', 22);
      lk.position.set(410 + 112, 22);
      b.addChild(lk);
    } else if (can) {
      gsap.to(ab.scale, { x: 1.06, y: 1.06, yoyo: true, repeat: -1, duration: 0.5, ease: 'sine.inOut' });
      sparkles(b, 475, 4, C.yellow, 6, 50);
    }
    // what's missing, in plain words
    if (altarOn && !si.max) {
      const why = can ? `¡Ya puede subir a ★${si.next}!` : starCapNote(si) ?? `${starMissing(si)} para ★${si.next}.`;
      const wt = txt(why, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: can ? C.pinkHot : C.ink, wordWrap: true, wordWrapWidth: 520 });
      wt.position.set(16, 48);
      b.addChild(wt);
    }
  }

  // ================================================================== live refresh
  private refresh(animate = true) {
    const c = this.c;
    if (!c || this.lvText.destroyed) return;
    this.lvText.text = String(c.level);
    this.lvBase = Math.min(1, LV_MAXW / Math.max(1, this.lvText.width / Math.abs(this.lvText.scale.x || 1)));
    if (!this.lvPopping) this.lvText.scale.set(this.lvBase);
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
    this.costText.text = c.level >= cap ? 'TOPE' : `−${fmt(cost)} pescaditos (tienes ${fmt(G.s.food)})`;
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
    this.drawStars();
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
      const h = heart(34);
      h.position.set(to.x - 60, to.y);
      this.m.panel.addChild(h);
      this.bag.to(h, { y: to.y - 80, alpha: 0, duration: 0.9, ease: 'power1.out', onComplete: () => h.destroy() });
    }
  }

  private levelUp(level: number, before: number, quiet: boolean) {
    const p = this.m.panel;
    const lp = p.toLocal(this.lvText.getGlobalPosition());
    this.lvPopping = true;
    this.bag.fromTo(this.lvText.scale, { x: this.lvBase * 1.35, y: this.lvBase * 1.35 }, { x: this.lvBase, y: this.lvBase, duration: 0.4, ease: 'back.out(3)', onComplete: () => (this.lvPopping = false) });
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
    if (this.mutOverlay && this.islandCat && !this.islandCat.destroyed) syncMutationOverlay(this.mutOverlay, this.islandCat.sprite);
    if (this.sheen) this.sheen.x = ((this.tt * 260) % 1100) - 100;
    if (this.holo) this.holo.tint = [0xffffff, 0xffe0f0, 0xe0fff8, 0xfff6d0][Math.floor(this.tt * 6) % 4];
    if (this.halo && !this.halo.destroyed) this.halo.alpha = 0.7 + 0.3 * Math.sin(this.tt * 2.2);
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

/** the cat's OWN shot description (never the generic element rule) */
function shotDescription(c: OwnedCat) {
  const def = catDef(c.species);
  const sh = def.combat.shot;
  const pk = starPerks(c);
  const proj = sh.projectiles + pk.shot.projectiles;
  const bnc = sh.bounces + pk.shot.bounces;
  const prc = sh.pierce + pk.shot.pierce;
  const bits = [
    `Daño ${sh.dmg}`,
    proj > 1 ? `${proj} proyectiles` : null,
    bnc ? `${bnc} rebote${bnc > 1 ? 's' : ''}` : null,
    prc ? `perfora ${prc}` : null,
    sh.status ? `${sh.status.charAt(0).toUpperCase() + sh.status.slice(1)} ${sh.statusTurns} t` : null,
    `radio ${sh.radius}`,
  ].filter(Boolean);
  return `${sh.special ? sh.special + ' ' : ''}${bits.join(' · ')}.`;
}
