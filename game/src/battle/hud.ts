import { Container, Graphics, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { Bar, txt } from '../ui/widgets';
import { catTexture, elementFx } from '../art/catArt';
import { ELEMENT_ICON } from '../data/elementsMeta';
import { CatState } from './types';
import { sfx } from '../core/audio';

/** Crew card at the bottom of the battle screen. */
export class CrewCard extends Container {
  bg = new Graphics();
  hp: Bar;
  ult: Bar;
  portrait: Sprite;
  state: Text;
  selected = false;
  ultBtn: Container;
  constructor(public cat: CatState | null, onSelect: () => void, onUlt: () => void) {
    super();
    const w = 200;
    const h = 150;
    this.addChild(this.bg);
    const el = cat?.def.elements[0] ?? 'neutral';
    const fx = elementFx(el);
    if (cat) {
      this.portrait = new Sprite(catTexture(cat.def.slug));
      this.portrait.anchor.set(0.5, 0.5);
      this.portrait.scale.set(120 / this.portrait.texture.width);
      if (cat.def.tint !== undefined) this.portrait.tint = cat.def.tint;
    } else {
      this.portrait = new Sprite();
    }
    this.portrait.position.set(56, 62);
    const mask = new Graphics().rect(6, 6, w - 12, h - 44).fill(0xffffff);
    this.portrait.mask = mask;
    this.addChild(mask, this.portrait);
    const name = txt(cat ? cat.def.name.toUpperCase() : 'CAÑÓN', { fontFamily: F.poster, fontSize: 24, fill: C.ink });
    name.position.set(100, 10);
    if (name.width > 96) name.scale.set(96 / name.width);
    const ic = txt(cat ? cat.def.elements.map((e) => ELEMENT_ICON[e] ?? '').join('') : '💣', { fontSize: 22 });
    ic.position.set(102, 42);
    const shotName = txt(cat ? cat.def.shot.name : 'Cañonazo', { fontFamily: F.ui, fontSize: 14, fontWeight: '700', fill: C.ink, wordWrap: true, wordWrapWidth: 92 });
    shotName.position.set(102, 72);
    this.state = txt('', { fontFamily: F.comic, fontSize: 22, fill: C.red, stroke: { color: C.paper, width: 4 } });
    this.state.anchor.set(0.5);
    this.state.position.set(w / 2, 60);
    this.hp = new Bar(w - 16, 14, C.green, C.paperDark);
    this.hp.position.set(8, h - 36);
    this.ult = new Bar(w - 16, 10, fx.main, C.ink);
    this.ult.position.set(8, h - 18);
    this.addChild(name, ic, shotName, this.hp, this.ult, this.state);
    if (!cat) {
      this.hp.visible = false;
      this.ult.visible = false;
    }
    // ULT button
    this.ultBtn = new Container();
    const ub = new Graphics().rect(0, 0, 84, 40).fill(fx.main).stroke({ width: 4, color: C.ink });
    const ut = txt('ULT', { fontFamily: F.poster, fontSize: 28, fill: C.ink });
    ut.anchor.set(0.5);
    ut.position.set(42, 20);
    this.ultBtn.addChild(ub, ut);
    this.ultBtn.position.set(w - 92, -48);
    this.ultBtn.visible = false;
    this.ultBtn.eventMode = 'static';
    this.ultBtn.cursor = 'pointer';
    this.ultBtn.on('pointertap', (e) => {
      e.stopPropagation();
      onUlt();
    });
    this.addChild(this.ultBtn);
    gsap.to(this.ultBtn.scale, { x: 1.08, y: 1.08, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => {
      sfx('click');
      onSelect();
    });
    this.draw();
  }
  draw() {
    const w = 200;
    const h = 150;
    const c = this.cat;
    const disabled = c ? c.ko || c.cooldown > 0 || c.stunned > 0 : false;
    this.bg.clear();
    this.bg.rect(6, 6, w, h).fill(C.ink);
    this.bg.rect(0, 0, w, h).fill(this.selected ? C.yellow : disabled ? 0xbfb5a3 : C.paper).stroke({ width: 4, color: C.ink });
    if (this.selected) this.bg.rect(-6, -6, w + 12, h + 12).stroke({ width: 4, color: C.pinkHot });
    if (c) {
      this.hp.set(c.hp / c.maxHp);
      this.hp.setColor(c.hp / c.maxHp > 0.5 ? C.green : c.hp / c.maxHp > 0.25 ? C.yellow : C.red);
      this.ult.set(c.ultCharge);
      this.state.text = c.ko ? 'K.O.' : c.stunned > 0 ? 'ATURDIDO' : c.cooldown > 0 ? 'RECARGANDO' : c.exposed ? '¡EXPUESTO!' : c.shields > 0 ? '🛡'.repeat(c.shields) : '';
      this.portrait.alpha = c.ko ? 0.3 : 1;
    }
  }
  setSelected(v: boolean) {
    this.selected = v;
    this.draw();
    if (v) gsap.fromTo(this, { y: this.y - 10 }, { y: this.y, duration: 0.3, ease: 'back.out(3)' });
  }
}

/** Top bar: both hulls, wind, turn */
export class BattleTopBar extends Container {
  hullA: Bar;
  hullB: Bar;
  wind: Text;
  windArrow = new Graphics();
  turn: Text;
  constructor(nameA: string, nameB: string) {
    super();
    const plate = (name: string, x: number, flip: boolean) => {
      const g = new Graphics().rect(0, 0, 620, 74).fill(C.paper).stroke({ width: 4, color: C.ink });
      g.position.set(x, 18);
      const t = txt(name.toUpperCase(), { fontFamily: F.poster, fontSize: 30, fill: C.ink });
      t.position.set(x + (flip ? 620 - 16 - t.width : 16), 22);
      this.addChild(g, t);
    };
    plate(nameA, 30, false);
    plate(nameB, 1920 - 650, true);
    this.hullA = new Bar(588, 22, C.green, C.paperDark);
    this.hullA.position.set(46, 60);
    this.hullB = new Bar(588, 22, C.red, C.paperDark);
    this.hullB.position.set(1920 - 634, 60);
    this.hullA.set(1, false);
    this.hullB.set(1, false);
    const wbg = new Graphics().rect(0, 0, 240, 74).fill(C.ink).stroke({ width: 4, color: C.ink });
    wbg.position.set(840, 18);
    this.wind = txt('VIENTO 0', { fontFamily: F.poster, fontSize: 24, fill: C.paper });
    this.wind.anchor.set(0.5);
    this.wind.position.set(960, 40);
    this.windArrow.position.set(960, 72);
    this.turn = txt('TURNO 1', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink });
    this.turn.anchor.set(0.5, 0);
    this.turn.position.set(960, 98);
    this.addChild(wbg, this.wind, this.windArrow, this.hullA, this.hullB, this.turn);
  }
  setWind(w: number) {
    this.wind.text = `VIENTO ${Math.abs(Math.round(w))}`;
    const g = this.windArrow;
    g.clear();
    const len = Math.min(90, Math.abs(w) * 1.3) * Math.sign(w || 1);
    g.moveTo(-len, 0).lineTo(len, 0).stroke({ width: 5, color: C.yellow });
    g.poly([len, -9, len + Math.sign(len || 1) * 14, 0, len, 9]).fill(C.yellow);
  }
}
