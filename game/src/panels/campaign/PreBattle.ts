/**
 * Pre-batalla (GDD 2.9.2 / 6.11 — NOIR OCEÁNICO + editorial): enemy silhouette, elements, captain,
 * Power vs Power + honest estimate, loot; pick active ship & crew ("sugerir"), ¡ZARPAR!.
 */
import { ColorMatrixFilter, Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt, Button } from '../../ui/widgets';
import { glowTexture, halftoneTexture } from '../../art/textures';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import { goBattle } from '../../app/flow';
import { G } from '../../state/game';
import { CAT_BY_ID, SHIP_BY_ID, zoneBoss } from '../../data/content';
import { OutlineFilter } from 'pixi-filters';
import { buildBattle, stageInfo, stagePower, winChance } from '../../state/sys/campaign';
import { autoCrew, crew, shipPower } from '../../state/sys/ship';
import { playerBlueprint } from '../../state/sys/ship';
import {
  FACTION,
  KIND_LABEL,
  PERSONALITY,
  lootPreview,
  prettyArchetype,
  stageCaptain,
  stageElements,
  stageKind,
  stageState,
  snapshotBeforeBattle,
} from '../../state/ext/campaign';
import { P, catPortrait, elKey, elName, elNameCap, elementBadge, ensureCats, label, resChip, stamp, clearChildren } from './common';
import { shipPreview } from './shipArt';
import { CrewPicker } from './CrewPicker';
import { SilhouetteFilter } from '../../fx/filters';
import { catTexture, elementFx, preloadCats, livingCat } from '../../art/catArt';
import type { ShipBlueprint } from '../../battle/ship';
import type { BattleSpec } from '../../scenes/BattleScene';
import type { ShipStyleId } from '../../battle/anime';
import { simulateEstimate, estimateLabel, Estimate } from '../../state/sys/estimate';
import { iconText } from '../../ui/elementIcon';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

export async function openPreBattle(zone: number, stage: number) {
  const sd = stageInfo(zone, stage);
  const kind = stageKind(zone, stage);
  const m = new Modal(`${KIND_LABEL[kind] === 'NORMAL' ? 'PRE-BATALLA' : KIND_LABEL[kind]} · ${zone}-${stage}`, 1820, 980, {
    color: 0xe6dcc6,
    band: C.oceanNoir,
    subtitle: (sd?.name ?? '').toUpperCase(),
  });
  m.open();
  // enemy spec (same generator the battle uses; deterministic per stage)
  let spec: BattleSpec | null = null;
  try {
    spec = buildBattle(zone, stage, () => undefined);
  } catch (e) {
    console.warn('[prebattle] buildBattle failed', e);
  }
  const enemySpecies = sd?.enemyCats?.length ? sd.enemyCats : ['c_canelo'];
  await ensureCats([...G.s.cats.map((c) => c.species), ...enemySpecies]);
  const boss = zoneBoss(zone);
  if (kind === 'boss' && boss?.captainArt.slug) await preloadCats([boss.captainArt.slug]).catch(() => undefined);
  if (m.closed) return;
  new PreBattleView(m, zone, stage, spec?.enemy.blueprint ?? null, enemySpecies, (spec as (BattleSpec & { enemyStyle?: ShipStyleId }) | null)?.enemyStyle);
}

class PreBattleView {
  private power = new Container();
  private shipBox = new Container();
  private picker: CrewPicker;
  private go!: Button;
  constructor(
    private m: Modal,
    private zone: number,
    private stage: number,
    private enemyBp: ShipBlueprint | null,
    private enemySpecies: string[],
    private enemyStyle?: ShipStyleId,
  ) {
    if (!crew().length) autoCrew();
    this.buildEnemy();
    this.picker = new CrewPicker(G.s.ship.active, { width: 844, slotH: 196, rosterSize: 72, rosterRows: 1, onChange: () => this.rebuildPower() });
    this.picker.position.set(900, 330);
    m.body.addChild(this.shipBox, this.power, this.picker);
    this.buildShip();
    this.buildFooter();
    this.rebuildPower();
  }

  // ------------------------------------------------------------------ enemy (left)
  private buildEnemy() {
    const z = this.zone;
    const s = this.stage;
    const b = this.m.body;
    const w = 860;
    // noir sea panel
    const sea = new Container();
    const g = new Graphics();
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const col = lerpColor(0x0d110f, 0x204a7a, t);
      g.rect(0, (i * 430) / steps, w, 430 / steps + 1).fill(col);
    }
    g.rect(0, 300, w, 130).fill(0x172b35);
    for (let i = 0; i < 9; i++) g.moveTo(20 + i * 100, 312 + (i % 3) * 30).quadraticCurveTo(60 + i * 100, 300 + (i % 3) * 30, 100 + i * 100, 312 + (i % 3) * 30);
    g.stroke({ width: 2, color: 0x3569a3, alpha: 0.7 });
    const dots = new TilingSprite({ texture: halftoneTexture(0x000000, 10, 2.2), width: w, height: 430 });
    dots.alpha = 0.25;
    // moon / spotlight
    const moon = new Graphics().circle(690, 90, 56).fill({ color: 0xede4d6, alpha: 0.9 });
    sea.addChild(g, moon, dots);
    const lateStamps: Container[] = [];
    if (this.enemyBp) {
      const glow = new Sprite(glowTexture(256));
      glow.anchor.set(0.5);
      glow.tint = stageKind(z, s) === 'boss' ? C.red : C.pinkHot;
      glow.alpha = 0.55;
      glow.scale.set(5.2, 2.6);
      glow.position.set(w / 2 + 40, 250);
      sea.addChild(glow);
      // the REAL enemy ship (same blueprint + anime style the battle uses): a moonlit noir silhouette with a
      // hot rim until you beat it once; afterwards it shows in full color (you know that face)
      const known = stageState(z, s) === 'cleared';
      const ship = shipPreview(this.enemyBp, { maxW: 600, maxH: 330, flip: true, style: this.enemyStyle ?? (z === 5 ? 'cosmic' : 'rat') });
      const view = ship.children[0] as Container | undefined;
      if (view && !known) {
        const noir = new ColorMatrixFilter();
        noir.brightness(0.5, false);
        const tone = new ColorMatrixFilter();
        tone.tint(0x3569a3, true);
        view.filters = [noir, tone, new OutlineFilter({ thickness: 3, color: stageKind(z, s) === 'boss' ? C.red : C.pinkHot, quality: 0.2 })];
      }
      ship.position.set((w - ship.width) / 2 + (stageKind(z, s) === 'boss' ? -70 : 40), 300 - ship.height + 50);
      sea.addChild(ship);
      if (!known) {
        const q = stamp('SIN AVISTAR', C.yellow, 22, -0.06);
        q.position.set(110, 392);
        lateStamps.push(q);
      }
      // red eyes of the windows: a pulsing glow in front of the silhouette
      const eye = new Graphics().circle(0, 0, 7).fill(C.pinkHot);
      eye.position.set(ship.x + ship.width * 0.45, ship.y + ship.height * 0.55);
      const tw = gsap.to(eye, { alpha: 0.2, yoyo: true, repeat: -1, duration: 0.7 });
      eye.on('destroyed', () => tw.kill());
      sea.addChild(eye);
    }
    const frontWater = new Graphics().rect(0, 340, w, 90).fill({ color: 0x172b35, alpha: 0.75 });
    sea.addChild(frontWater, ...lateStamps);
    const mask = new Graphics().rect(0, 0, w, 430).fill(0xffffff);
    sea.mask = mask;
    const border = new Graphics().rect(0, 0, w, 430).stroke({ width: 4, color: C.ink });
    b.addChild(sea, mask, border);
    const sd = stageInfo(z, s);
    const kind = stageKind(z, s);
    const nm = txt((sd?.name ?? 'Pirata').toUpperCase(), { fontFamily: F.poster, fontSize: 52, fill: C.paper, stroke: { color: C.ink, width: 6 }, wordWrap: true, wordWrapWidth: w - 60 });
    nm.position.set(26, 14);
    const fac = txt(`${FACTION[z].name} · ${prettyArchetype(z, s)} · Zona ${ROMAN[z]}`, { fontFamily: F.bebas, fontSize: 26, fill: C.mint, letterSpacing: 1 });
    fac.position.set(28, nm.y + nm.height);
    b.addChild(nm, fac);
    if (kind !== 'normal') {
      const st = stamp(KIND_LABEL[kind], kind === 'boss' ? C.red : C.yellow, 30, 0.08);
      st.position.set(w - 90, 380);
      b.addChild(st);
    }

    // captain block
    let y = 452;
    const cap = stageCaptain(z, s);
    const boss = kind === 'boss' ? zoneBoss(z) : undefined;
    if (boss?.captainArt.slug) {
      const art = livingCat(boss.captainArt.slug);
      art.anchor.set(0.5, 1);
      const k = 250 / Math.max(1, art.texture.height);
      art.scale.set(-k, k);
      art.position.set(w - 105, 432);
      const desat = new ColorMatrixFilter();
      desat.saturate(-0.4, false);
      art.filters = [desat, new OutlineFilter({ thickness: 4, color: C.red })];
      b.addChild(art);
      const wanted = stamp('SE BUSCA', C.red, 26, 0.1);
      wanted.position.set(w - 105, 196);
      b.addChild(wanted);
    }
    const pers = PERSONALITY[cap.personality] ?? { name: cap.personality, line: '' };
    const cl = label('CAPITÁN', 14, P.blue, { letterSpacing: 3 });
    cl.position.set(0, y);
    const cn = txt(cap.name.toUpperCase(), { fontFamily: F.poster, fontSize: 34, fill: C.ink, wordWrap: true, wordWrapWidth: w });
    cn.position.set(0, y + 18);
    b.addChild(cl, cn);
    y += 24 + cn.height;
    const pt = txt(`PERSONALIDAD: ${pers.name.toUpperCase()} — ${pers.line}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink, wordWrap: true, wordWrapWidth: w });
    pt.position.set(0, y);
    b.addChild(pt);
    y += pt.height + 12;
    if (cap.line) {
      const bub = new Container();
      const t = txt(cap.line, { fontFamily: F.comic, fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: w - 60, letterSpacing: 1 });
      t.position.set(18, 12);
      const bg = new Graphics()
        .roundRect(0, 0, t.width + 36, t.height + 24, 14)
        .fill(C.paper)
        .stroke({ width: 4, color: C.ink })
        .poly([30, t.height + 22, 56, t.height + 22, 22, t.height + 46])
        .fill(C.paper);
      bg.moveTo(30, t.height + 24).lineTo(22, t.height + 46).lineTo(56, t.height + 24).stroke({ width: 4, color: C.ink });
      bub.addChild(bg, t);
      bub.position.set(0, y);
      bub.rotation = -0.01;
      b.addChild(bub);
      y += bub.height + 14;
    }
    const rule = stageInfo(z, s)?.eliteRule;
    if (rule) {
      const rt = txt(`REGLA DE ÉLITE: ${rule}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.red, wordWrap: true, wordWrapWidth: w });
      rt.position.set(0, y);
      b.addChild(rt);
      y += rt.height + 12;
    }
    // elements + enemy crew silhouettes
    const elL = label('ELEMENTOS', 14, P.blue, { letterSpacing: 3 });
    elL.position.set(0, y);
    b.addChild(elL);
    const els = stageElements(z, s);
    els.forEach((el, i) => {
      const eb = elementBadge(el, 54);
      eb.position.set(30 + i * 170, y + 52);
      const en = label(elName(el), 15, C.ink);
      en.position.set(62 + i * 170, y + 44);
      b.addChild(eb, en);
    });
    const crL = label('TRIPULACIÓN ENEMIGA', 14, P.blue, { letterSpacing: 3 });
    crL.position.set(440, y);
    b.addChild(crL);
    this.enemySpecies.slice(0, 5).forEach((sp, i) => {
      const p = catPortrait(sp, 76, { bg: 0x1c3a51 });
      const spr = p.children[p.children.length - 1];
      spr.filters = [new SilhouetteFilter(C.chaos, 0.92)];
      p.position.set(480 + i * 90, y + 62);
      const def = CAT_BY_ID.get(sp);
      const q = elementBadge(def ? def.elements[0] : 'unknown', 26);
      q.position.set(p.x + 26, p.y + 28);
      b.addChild(p, q);
    });
  }

  // ------------------------------------------------------------------ your ship (right, static parts)
  private buildShip() {
    const box = this.shipBox;
    clearChildren(box);
    const x0 = 900;
    const owned = G.s.ship.owned;
    const tl = label('TU BARCO', 14, P.blue, { letterSpacing: 3 });
    tl.position.set(x0, 0);
    box.addChild(tl);
    let tx = x0;
    for (const id of owned) {
      const def = SHIP_BY_ID.get(id);
      const active = id === G.s.ship.active;
      const b = new Button((def?.name ?? id).toUpperCase(), () => {
        if (active) return;
        G.s.ship.active = id;
        if (!crew(id).length) autoCrew(id);
        G.recalc();
        sfx('pop');
        this.buildShip();
        this.picker.setShip(id);
        this.rebuildPower();
      }, { w: 200, h: 46, size: 22, color: active ? C.ink : C.paper, textColor: active ? C.paper : C.ink });
      b.position.set(tx, 22);
      box.addChild(b);
      tx += 212;
    }
    const prev = shipPreview(playerBlueprint().bp, { maxW: 360, maxH: 230, style: 'pirate' });
    prev.position.set(1744 - 370, 84);
    box.addChild(prev);
  }

  // ------------------------------------------------------------------ dynamic parts
  private estToken = 0;
  private rebuildPower() {
    const d = this.power;
    clearChildren(d);
    const x0 = 900;
    const z = this.zone;
    const s = this.stage;
    const def = SHIP_BY_ID.get(G.s.ship.active);
    const ep = stagePower(z, s);
    const sp = shipPower();
    const pc = winChance(z, s);
    const pv = new Container();
    pv.position.set(x0, 90);
    const l1 = label('PODER ENEMIGO', 14, P.blue, { letterSpacing: 2 });
    const v1 = txt(fmt(ep), { fontFamily: F.poster, fontSize: 64, fill: C.red });
    v1.y = 16;
    const vs = txt('vs', { fontFamily: F.news, fontSize: 48, fill: C.ink });
    vs.position.set(Math.max(150, v1.width + 24), 26);
    const l2 = label(`TU PODER · ${(def?.name ?? '').toUpperCase()}`, 14, P.blue, { letterSpacing: 2 });
    l2.position.set(vs.x + vs.width + 24, 0);
    const v2 = txt(fmt(sp), { fontFamily: F.poster, fontSize: 64, fill: P.blue });
    v2.position.set(l2.x, 16);
    pv.addChild(l1, v1, vs, l2, v2);
    // honest estimate: the real sim plays this stage with YOUR ship (layout, materials, crew) 12 times
    const estBox = new Container();
    estBox.position.set(0, 128);
    pv.addChild(estBox);
    d.addChild(pv);
    const token = ++this.estToken;
    const draw = (e: Estimate) => {
      if (token !== this.estToken || estBox.destroyed) return;
      clearChildren(estBox);
      const p = e.p ?? pc;
      const col = e.p === null ? P.blue : p >= 0.7 ? 0x2e8a52 : p >= 0.45 ? 0xb8701e : C.red;
      const st = stamp(`ESTIMACIÓN ${estimateLabel(e)}`, col, 34, -0.05);
      st.position.set(170, 12);
      estBox.addChild(st);
      if (e.details.length) {
        const why = new Button('¿POR QUÉ?', () => openWhy(e), { w: 170, h: 44, size: 22, color: C.paper });
        why.position.set(370, -8);
        estBox.addChild(why);
      }
      const lines = e.p === null ? ['Simulando la pelea con tu barco real…'] : [...e.reasons, ...e.tips].slice(0, 2);
      if (e.p !== null && !lines.length) lines.push(p >= 0.7 ? 'Vas sobrado. Igual apunta bien.' : p >= 0.45 ? 'Pelea pareja: lee el viento.' : 'Cuesta arriba. Mejora el barco o alimenta gatos… o ve con fe.');
      let ly = 52;
      for (const l of lines) {
        const t = txt(l, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, wordWrap: true, wordWrapWidth: 760, fontStyle: 'italic' });
        t.position.set(0, ly);
        estBox.addChild(t);
        ly += t.height + 4;
      }
    };
    void simulateEstimate(`${z}-${s}`, () => buildBattle(z, s, () => undefined), draw);
    if (this.go) this.go.disabled = !crew().length;
  }

  private buildFooter() {
    const d = this.m.body;
    const z = this.zone;
    const s = this.stage;
    const lp = lootPreview(z, s);
    const lx0 = 900;
    const lootY = 724;
    const ll = label('BOTÍN PREVISTO', 14, P.blue, { letterSpacing: 3 });
    ll.position.set(lx0, lootY);
    d.addChild(ll);
    const chips = [
      resChip('gold', `≈${fmt(lp.gold)}`, true, 30),
      resChip('scrap', `${lp.scrap}`, true, 30),
      resChip('crystal', `${lp.crystals.n} ${elNameCap(lp.crystals.el)}`, true, 30, elementFx(elKey(lp.crystals.el)).main),
    ];
    if (lp.blueprintChance > 0) chips.push(resChip('blueprint', lp.blueprintChance >= 1 ? `×${lp.blueprints}` : `${Math.round(lp.blueprintChance * 100)}%`, true, 30));
    if (lp.gems) chips.push(resChip('gem', `${lp.gems}`, true, 30));
    chips.push(resChip('clock', 'Ronroneo', true, 30));
    let cx = lx0;
    let cy = lootY + 22;
    for (const c of chips) {
      if (cx + c.width > lx0 + 400) {
        cx = lx0;
        cy += 40;
      }
      c.position.set(cx, cy);
      d.addChild(c);
      cx += c.width + 22;
    }
    const boss = stageKind(z, s) === 'boss';
    const go = new Button('¡ZARPAR!', () => this.sail(), { w: 420, h: 96, size: 58, color: boss ? C.red : C.pink, textColor: boss ? C.paper : C.ink });
    go.position.set(1744 - 420, 836 - 104);
    d.addChild(go);
    const tw = gsap.fromTo(go.face.scale, { x: 1, y: 1 }, { x: 1.03, y: 1.03, yoyo: true, repeat: -1, duration: 0.6, ease: 'sine.inOut' });
    go.on('destroyed', () => tw.kill());
    this.go = go;
  }

  private sail() {
    if (!crew().length) {
      toast('Sin tripulación no zarpa nadie', { color: C.pink });
      return;
    }
    sfx('whoosh');
    snapshotBeforeBattle(); // K.O. ranks / reactions for the Results front page
    G.save();
    this.m.close();
    void goBattle(this.zone, this.stage);
  }
}

/** the whole why of the estimate: matchups + the hidden numbers of the stage, nothing hidden */
export function openWhy(e: Estimate) {
  const m = new Modal('¿Por qué esta estimación?', 1240, 820, { color: 0xe6dcc6, band: C.oceanNoir, subtitle: 'Lo que el Poder no dice' });
  let y = 0;
  const head = txt(e.p === null ? 'Simulando…' : `${e.done} peleas simuladas con TU barco: ganaste ${Math.round((e.p ?? 0) * e.done)}.`, { fontFamily: F.poster, fontSize: 30, fill: C.ink });
  m.body.addChild(head);
  y += head.height + 14;
  for (const l of e.details) {
    const dot = new Graphics().circle(8, 14, 6).fill(C.red);
    dot.position.set(0, y);
    const t = iconText(l, { fontFamily: F.ui, fontWeight: '700', fontSize: 21, fill: C.ink }, { wrap: 1120 });
    t.position.set(26, y);
    m.body.addChild(dot, t);
    y += t.height + 12;
    if (y > m.innerH - 40) break;
  }
  m.open();
}

function lerpColor(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}
