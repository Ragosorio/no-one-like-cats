/**
 * El Podio — duel HUD: fighter bars (name, level, stars, element badges, HP with damage ghost, shield,
 * ULTI meter, status chips), the 4 power cards (bottom-left), the speed selector ×0.5/×1/×2/×4 and AUTO.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { elementIcon } from '../ui/elementIcon';
import { icon } from '../ui/icons';
import { fmt } from '../core/format';
import { sfx } from '../core/audio';
import { elColor } from './fx';
import { PowerDef, SLOT_LABEL, SLOT_UNLOCK, STATUS_NAME, StatusId } from './powers';
import type { Fighter } from './engine';
import PB from '../data/podio.json';

const DM = PB.stats.display_mul;
export const show = (n: number) => fmt(Math.max(0, Math.round(n * DM)));

function stars(n: number) {
  const g = new Graphics();
  for (let i = 0; i < n; i++) {
    const cx = i * 22;
    const pts: number[] = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 4.2 : 10;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      pts.push(cx + Math.cos(a) * r, Math.sin(a) * r);
    }
    g.poly(pts).fill(C.yellow).stroke({ width: 2, color: C.ink });
  }
  return g;
}

export class FighterBar extends Container {
  readonly W = 660;
  private hpFill = new Graphics();
  private hpGhost = new Graphics();
  private shieldG = new Graphics();
  private meterFill = new Graphics();
  private hpText: Text;
  private chips = new Container();
  private hpP = 1;
  private ghostP = 1;
  private meterP = 0;
  private flashG = new Graphics();
  readonly meterLocked: boolean;

  constructor(
    public f: Fighter,
    public side: 0 | 1,
    accent: number,
  ) {
    super();
    const w = this.W;
    const h = 176;
    const bg = new Graphics()
      .rect(8, 8, w, h)
      .fill(C.ink)
      .rect(0, 0, w, h)
      .fill(C.paper)
      .stroke({ width: 4, color: C.ink, alignment: 1 });
    const strip = new Graphics().rect(0, 0, w, 10).fill(accent);
    this.addChild(bg, strip);
    const R = side === 1;
    const ax = R ? 1 : 0;
    const x0 = R ? w - 22 : 22;
    // name + owner
    const name = txt(f.name.toUpperCase(), { fontFamily: F.poster, fontSize: 42, fill: C.ink });
    name.anchor.set(ax, 0);
    name.position.set(x0, 14);
    if (name.width > 330) name.scale.set(330 / name.width);
    const owner = txt(f.owner, { fontFamily: F.bebas, fontSize: 22, fill: C.plum, letterSpacing: 2 });
    owner.anchor.set(ax, 0);
    owner.position.set(x0, 64);
    this.addChild(name, owner);
    // level, stars, elements (other side)
    const meta = new Container();
    const lv = txt(`NV ${f.level}`, { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    const st = stars(f.stars);
    st.position.set(lv.width + 22, 20);
    const pl = txt(`PODIO ${f.podioLvl}`, { fontFamily: F.bebas, fontSize: 22, fill: C.paper, letterSpacing: 1 });
    const plBg = new Graphics().roundRect(0, 0, pl.width + 16, 28, 6).fill(C.pinkHot).stroke({ width: 2, color: C.ink });
    const plC = new Container();
    plC.addChild(plBg, pl);
    pl.position.set(8, 1);
    plC.position.set(0, 44);
    meta.addChild(lv, st, plC);
    let ex = lv.width + 30 + f.stars * 22;
    for (const el of f.elements) {
      const b = elementIcon(el, 38);
      b.position.set(ex, 20);
      meta.addChild(b);
      ex += 42;
    }
    meta.position.set(R ? 22 : w - 22 - Math.max(ex, plC.width), 14);
    this.addChild(meta);
    // HP bar
    const bw = w - 44;
    const by = 98;
    const back = new Graphics().rect(0, 0, bw, 36).fill(C.ink);
    this.hpGhost.position.set(22, by);
    this.hpFill.position.set(22, by);
    this.shieldG.position.set(22, by);
    back.position.set(22, by);
    const frame = new Graphics().rect(0, 0, bw, 36).stroke({ width: 4, color: C.ink, alignment: 1 });
    frame.position.set(22, by);
    this.hpText = txt('', { fontFamily: F.bebas, fontSize: 28, fill: C.paper, stroke: { color: C.ink, width: 5, join: 'round' }, letterSpacing: 1 });
    this.hpText.anchor.set(0.5);
    this.hpText.position.set(22 + bw / 2, by + 18);
    this.addChild(back, this.hpGhost, this.hpFill, this.shieldG, frame, this.hpText);
    // ULTI meter
    this.meterLocked = f.levels[3] <= 0;
    const mb = new Graphics().rect(0, 0, bw, 14).fill(C.paperDark).stroke({ width: 3, color: C.ink, alignment: 1 });
    mb.position.set(22, by + 46);
    this.meterFill.position.set(22, by + 46);
    const ml = txt(this.meterLocked ? `ULTI BLOQUEADA · PODIO ${SLOT_UNLOCK[3]}` : 'ULTI', { fontFamily: F.bebas, fontSize: 16, fill: this.meterLocked ? C.plum : C.ink, letterSpacing: 2 });
    ml.anchor.set(ax, 0.5);
    ml.position.set(R ? 22 + bw - 6 : 28, by + 53);
    this.addChild(mb, this.meterFill, ml);
    // status chips under the card
    this.chips.position.set(R ? w : 0, h + 16);
    this.addChild(this.chips, this.flashG);
    this.flashG.rect(0, 0, w, h).fill(0xffffff);
    this.flashG.alpha = 0;
    this.redraw();
  }

  private bw() {
    return this.W - 44;
  }

  private hpColor(p: number) {
    return p > 0.5 ? C.green : p > 0.22 ? C.yellow : C.red;
  }

  /** sync with the fighter (animate=true eases the bar, the ghost catches up later) */
  sync(animate = true) {
    const f = this.f;
    const p = Math.max(0, f.hp / f.hpMax);
    const m = f.meter / 100;
    if (!animate) {
      this.hpP = this.ghostP = p;
      this.meterP = m;
      this.redraw();
      return;
    }
    const st = { hp: this.hpP, m: this.meterP };
    gsap.killTweensOf(st);
    gsap.to(st, {
      hp: p,
      m,
      duration: 0.22,
      ease: 'power2.out',
      onUpdate: () => {
        this.hpP = st.hp;
        this.meterP = st.m;
        this.redraw();
      },
    });
    if (p < this.ghostP) {
      const g = { v: this.ghostP };
      gsap.to(g, {
        v: p,
        duration: 0.5,
        delay: 0.45,
        ease: 'power2.in',
        onUpdate: () => {
          if (this.destroyed) return;
          this.ghostP = g.v;
          this.redraw();
        },
      });
    } else this.ghostP = p;
    this.hpText.text = `${show(f.hp)} / ${show(f.hpMax)}`;
    this.syncChips();
  }

  private redraw() {
    if (this.destroyed) return;
    const bw = this.bw();
    const R = this.side === 1;
    const seg = (g: Graphics, p: number, color: number, h: number) => {
      g.clear();
      const w = Math.max(0, bw * p);
      if (w <= 0) return;
      g.rect(R ? bw - w : 0, 0, w, h).fill(color);
    };
    seg(this.hpGhost, this.ghostP, C.paper, 36);
    seg(this.hpFill, this.hpP, this.hpColor(this.hpP), 36);
    // highlight stripe
    if (this.hpP > 0) this.hpFill.rect(R ? bw - bw * this.hpP : 0, 4, bw * this.hpP, 6).fill({ color: 0xffffff, alpha: 0.35 });
    const sh = Math.min(1, this.f.shield / this.f.hpMax);
    this.shieldG.clear();
    if (sh > 0) this.shieldG.rect(R ? bw - bw * sh : 0, 0, bw * sh, 36).fill({ color: C.cyan, alpha: 0.55 }).stroke({ width: 2, color: 0xffffff });
    seg(this.meterFill, this.meterP, this.meterP >= 1 ? C.yellow : C.pinkHot, 14);
    this.hpText.text = `${show(this.f.hp)} / ${show(this.f.hpMax)}`;
  }

  private chipSig = '';
  syncChips() {
    const f = this.f;
    const list: { id: StatusId | 'shield' | 'summon'; n: number }[] = f.statuses.map((s) => ({ id: s.id, n: s.turns }));
    if (f.shield > 0) list.push({ id: 'shield', n: 0 });
    if (f.summon) list.push({ id: 'summon', n: f.summon.turns });
    const sig = list.map((x) => x.id + x.n).join(',');
    if (sig === this.chipSig) return;
    this.chipSig = sig;
    this.chips.removeChildren().forEach((c) => c.destroy({ children: true }));
    let x = 0;
    const R = this.side === 1;
    for (const it of list) {
      const label = it.id === 'shield' ? 'ESCUDO' : it.id === 'summon' ? `ESPÍRITU ${it.n}` : `${STATUS_NAME[it.id]}${it.n ? ' ' + it.n : ''}`;
      const col = it.id === 'shield' ? C.cyan : it.id === 'summon' ? C.violet : it.id === 'regen' ? C.green : it.id === 'stun' ? C.yellow : C.red;
      const t = txt(label, { fontFamily: F.bebas, fontSize: 22, fill: C.ink, letterSpacing: 1 });
      const c = new Container();
      const g = new Graphics().roundRect(0, 0, t.width + 20, 32, 8).fill(col).stroke({ width: 3, color: C.ink });
      t.position.set(10, 2);
      c.addChild(g, t);
      c.x = R ? -x - g.width : x;
      x += g.width + 8;
      this.chips.addChild(c);
      gsap.from(c.scale, { x: 0.3, y: 0.3, duration: 0.25, ease: 'back.out(3)' });
    }
  }

  hitFlash() {
    gsap.killTweensOf(this.flashG);
    this.flashG.alpha = 0.6;
    gsap.to(this.flashG, { alpha: 0, duration: 0.25 });
    gsap.fromTo(this, { x: this.x + (this.side ? 10 : -10) }, { x: this.x, duration: 0.3, ease: 'elastic.out(1, 0.3)' });
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.flashG);
    super.destroy(o);
  }
}

// ------------------------------------------------------------------ power cards
export class PowerButton extends Container {
  readonly w = 262;
  readonly h = 138;
  private face = new Container();
  private cdLayer = new Container();
  private glow = new Graphics();
  private enabled = false;
  private readyPulse: gsap.core.Tween | null = null;
  onTip: ((p: PowerDef | null, b: PowerButton) => void) | null = null;

  constructor(
    public p: PowerDef,
    public level: number,
    private onPick: (slot: number) => void,
  ) {
    super();
    const f = elColor(p.element);
    const w = this.w;
    const h = this.h;
    const locked = level <= 0;
    const bg = new Graphics()
      .rect(7, 7, w, h)
      .fill(C.ink)
      .rect(0, 0, w, h)
      .fill(locked ? C.paperDark : C.paper)
      .stroke({ width: 4, color: C.ink, alignment: 1 });
    const top = new Graphics().rect(0, 0, w, 34).fill(p.ult ? C.ink : f.main).stroke({ width: 3, color: C.ink, alignment: 1 });
    const sl = txt(SLOT_LABEL[p.slot], { fontFamily: F.bebas, fontSize: 24, fill: p.ult ? C.yellow : C.paper, letterSpacing: 2, stroke: { color: C.ink, width: 4, join: 'round' } });
    sl.position.set(12, 3);
    const badge = elementIcon(p.element, 30);
    badge.position.set(w - 22, 17);
    this.face.addChild(this.glow, bg, top, sl, badge);
    if (locked) {
      const lk = icon('lock', 40);
      lk.position.set(w / 2, 74);
      const lt = txt(`SE ABRE EN PODIO NV ${SLOT_UNLOCK[p.slot]}`, { fontFamily: F.bebas, fontSize: 20, fill: C.plum, letterSpacing: 1 });
      lt.anchor.set(0.5);
      lt.position.set(w / 2, 116);
      this.face.addChild(lk, lt);
      this.face.alpha = 0.75;
    } else {
      const nm = txt(p.name, { fontFamily: F.poster, fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: w - 20, lineHeight: 28, breakWords: true });
      nm.position.set(10, 40);
      if (nm.height > 64) nm.scale.set(Math.max(0.6, 64 / nm.height));
      this.face.addChild(nm);
      // level pips
      for (let i = 0; i < 5; i++) {
        const pip = new Graphics().rect(0, 0, 18, 10).fill(i < level ? f.main : C.paperDark).stroke({ width: 2, color: C.ink });
        pip.position.set(10 + i * 22, h - 20);
        this.face.addChild(pip);
      }
      const info = p.ult ? 'BARRA LLENA' : p.cd ? `ESPERA ${p.cd}` : p.kind === 'heal' ? 'CURA' : 'SIEMPRE';
      const it = txt(info, { fontFamily: F.bebas, fontSize: 18, fill: C.plum, letterSpacing: 1 });
      it.anchor.set(1, 0.5);
      it.position.set(w - 10, h - 15);
      this.face.addChild(it);
    }
    this.face.addChild(this.cdLayer);
    this.addChild(this.face);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => this.onTip?.(this.p, this));
    this.on('pointerout', () => this.onTip?.(null, this));
    this.on('pointertap', () => {
      if (!this.enabled) {
        sfx('error');
        gsap.fromTo(this.face, { x: -6 }, { x: 0, duration: 0.3, ease: 'elastic.out(1,0.3)' });
        this.onTip?.(this.p, this);
        return;
      }
      sfx('click');
      gsap.fromTo(this.face.scale, { x: 0.92, y: 0.92 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
      this.onPick(this.p.slot);
    });
  }

  /** state for the current turn */
  setState(o: { usable: boolean; myTurn: boolean; cd: number; meter: number; locked: boolean }) {
    this.enabled = o.usable && o.myTurn;
    this.cdLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (o.locked) return;
    if (o.cd > 0) {
      const g = new Graphics().rect(0, 34, this.w, this.h - 34).fill({ color: C.ink, alpha: 0.62 });
      const t = txt(String(o.cd), { fontFamily: F.poster, fontSize: 64, fill: C.paper });
      t.anchor.set(0.5);
      t.position.set(this.w / 2, 84);
      const s = txt('TURNOS', { fontFamily: F.bebas, fontSize: 18, fill: C.paper, letterSpacing: 2 });
      s.anchor.set(0.5);
      s.position.set(this.w / 2, 124);
      this.cdLayer.addChild(g, t, s);
    } else if (this.p.ult && o.meter < 100) {
      const g = new Graphics().rect(0, 34, this.w, this.h - 34).fill({ color: C.ink, alpha: 0.45 });
      const fillH = ((this.h - 34) * o.meter) / 100;
      g.rect(0, this.h - fillH, this.w, fillH).fill({ color: C.pinkHot, alpha: 0.4 });
      const t = txt(`${Math.floor(o.meter)}%`, { fontFamily: F.poster, fontSize: 44, fill: C.paper, stroke: { color: C.ink, width: 6 } });
      t.anchor.set(0.5);
      t.position.set(this.w / 2, 86);
      this.cdLayer.addChild(g, t);
    }
    const ready = this.p.ult && o.usable;
    this.glow.clear();
    if (ready) {
      this.glow.rect(-10, -10, this.w + 20, this.h + 20).fill({ color: C.yellow, alpha: 0.8 });
      if (!this.readyPulse) this.readyPulse = gsap.to(this.glow, { alpha: 0.3, duration: 0.45, yoyo: true, repeat: -1 });
    } else if (this.readyPulse) {
      this.readyPulse.kill();
      this.readyPulse = null;
      this.glow.alpha = 1;
    }
    this.face.alpha = this.enabled || !o.myTurn ? 1 : 0.8;
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    this.readyPulse?.kill();
    gsap.killTweensOf(this.face);
    gsap.killTweensOf(this.face.scale);
    super.destroy(o);
  }
}

// ------------------------------------------------------------------ speed + auto
export class SpeedBar extends Container {
  private btns: { c: Container; g: Graphics; t: Text; v: number }[] = [];
  constructor(
    private speeds: readonly number[],
    private get: () => number,
    private set: (v: number) => void,
  ) {
    super();
    const lab = txt('VELOCIDAD', { fontFamily: F.bebas, fontSize: 20, fill: C.paper, letterSpacing: 3, stroke: { color: C.ink, width: 4 } });
    lab.position.set(2, -26);
    this.addChild(lab);
    speeds.forEach((v, i) => {
      const c = new Container();
      const g = new Graphics();
      const t = txt(v === 0.5 ? '×½' : `×${v}`, { fontFamily: F.poster, fontSize: 32, fill: C.ink });
      t.anchor.set(0.5);
      t.position.set(40, 30);
      c.addChild(g, t);
      c.x = i * 88;
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointertap', () => {
        sfx('click', 0.8 + i * 0.2);
        this.set(v);
        this.refresh();
        gsap.fromTo(c.scale, { x: 0.9, y: 0.9 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' });
      });
      this.btns.push({ c, g, t, v });
      this.addChild(c);
    });
    this.refresh();
  }
  refresh() {
    const cur = this.get();
    for (const b of this.btns) {
      const on = b.v === cur;
      b.g.clear().rect(5, 5, 80, 60).fill(C.ink).rect(0, 0, 80, 60).fill(on ? C.yellow : C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
      b.t.style.fill = on ? C.ink : C.plum;
    }
  }
}

export class Toggle extends Container {
  private g = new Graphics();
  private t: Text;
  constructor(
    private caption: string,
    private get: () => boolean,
    private set: (v: boolean) => void,
    private w = 170,
  ) {
    super();
    this.t = txt('', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    this.t.anchor.set(0.5);
    this.t.position.set(w / 2, 30);
    this.addChild(this.g, this.t);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => {
      sfx('click');
      this.set(!this.get());
      this.refresh();
      gsap.fromTo(this.scale, { x: 0.9, y: 0.9 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' });
    });
    this.refresh();
  }
  refresh() {
    const on = this.get();
    this.g.clear().rect(5, 5, this.w, 60).fill(C.ink).rect(0, 0, this.w, 60).fill(on ? C.pinkHot : C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
    this.t.text = `${this.caption}: ${on ? 'SÍ' : 'NO'}`;
    this.t.style.fill = on ? C.paper : C.ink;
  }
}
