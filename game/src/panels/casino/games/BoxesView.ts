/**
 * CAJAS MISTERIOSAS (rules: state/sys/casino/boxes.ts). Nine boxes on a shelf, a PUBLIC list of what's inside.
 * Pay → the boxes shuffle (the real shuffle was drawn and saved when you paid) → open 3, 2 or 1 of them →
 * the rest pop open too, so you see where everything was. Every box is a different kind of box (gift, hatbox,
 * crate, tin…) with its own opening.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { audio, sfx } from '../../../core/audio';
import { INSTANT_SPEED, canPay } from '../../../state/sys/casino';
import { BOX_MATH, BOX_TIERS, BOX_TIER_BLURB, BoxTier, Shelf, boxesPick, boxesStart, shelf } from '../../../state/sys/casino/boxes';
import type { AutoOutcome } from '../auto';
import type { CasinoCtx } from '../ctx';
import { CP, heading, label } from '../kit';
import { MiniGame } from './base';
import { OddsSpec, pct } from './odds';

const BW = 200;
const BH = 150;
const COLORS = [CP.violet, CP.pink, CP.cyan, 0xff6a1a, CP.green, CP.yellow, CP.red, 0x7fd8ff, 0xb7a4c7];

class Box extends Container {
  lid = new Graphics();
  body = new Graphics();
  prize: Text;
  picked = false;
  opened = false;
  constructor(
    public idx: number,
    public color: number,
  ) {
    super();
    const kind = idx % 3;
    const b = this.body;
    b.rect(-BW / 2 + 8, -BH / 2 + 30 + 8, BW, BH - 30).fill(CP.ink);
    b.rect(-BW / 2, -BH / 2 + 30, BW, BH - 30).fill(color).stroke({ width: 4, color: CP.ink });
    if (kind === 0) b.rect(-10, -BH / 2 + 30, 20, BH - 30).fill(CP.yellow).stroke({ width: 2, color: CP.ink });
    else if (kind === 1) for (let i = 0; i < 3; i++) b.rect(-BW / 2 + 10, -BH / 2 + 50 + i * 30, BW - 20, 6).fill({ color: CP.ink, alpha: 0.3 });
    else b.circle(0, 20, 22).fill(CP.paper).stroke({ width: 3, color: CP.ink });
    const l = this.lid;
    l.rect(-BW / 2 - 10, -16, BW + 20, 32).fill(color).stroke({ width: 4, color: CP.ink });
    if (kind === 0) {
      l.rect(-10, -16, 20, 32).fill(CP.yellow).stroke({ width: 2, color: CP.ink });
      l.ellipse(-18, -26, 18, 11).stroke({ width: 5, color: CP.yellow });
      l.ellipse(18, -26, 18, 11).stroke({ width: 5, color: CP.yellow });
    } else if (kind === 2) l.circle(0, -22, 10).fill(CP.paper).stroke({ width: 3, color: CP.ink });
    l.position.set(0, -BH / 2 + 22);
    this.prize = heading('', 46, CP.ink, { stroke: { color: CP.paper, width: 6, join: 'round' } });
    this.prize.anchor.set(0.5);
    this.prize.position.set(0, -10);
    this.prize.visible = false;
    this.addChild(this.body, this.prize, this.lid);
    const n = heading(String(idx + 1), 26, CP.ink);
    n.anchor.set(0.5);
    n.position.set(-BW / 2 + 22, BH / 2 - 22);
    this.addChild(n);
  }
  reset() {
    gsap.killTweensOf(this.lid);
    gsap.killTweensOf(this.lid.scale);
    this.lid.position.set(0, -BH / 2 + 22);
    this.lid.rotation = 0;
    this.lid.alpha = 1;
    this.prize.visible = false;
    this.alpha = 1;
    this.picked = this.opened = false;
  }
}

export class BoxesView extends MiniGame {
  private boxes: Box[] = [];
  private homes: { x: number; y: number }[] = [];
  private status!: Text;
  private contentsT!: Text;
  private picking = false;

  constructor(ctx: CasinoCtx) {
    super(ctx, {
      id: 'boxes',
      title: 'CAJAS MISTERIOSAS',
      kicker: 'NUEVE CAJAS · LA LISTA DE PREMIOS ESTÁ A LA VISTA',
      color: CP.violet,
      tiers: { names: BOX_TIERS.map((t) => t.name), blurbs: BOX_TIER_BLURB },
      playLabel: 'PONER CAJAS',
    });
    const s = shelf();
    if (s) {
      this.tier = s.tier;
      this.cur = s.cur;
    }
    this.buildBoard();
    if (s) this.resume(s);
    else this.idle();
    this.refresh(true);
  }

  maxMult() {
    return BOX_MATH[this.tier].max;
  }
  infoText() {
    const m = BOX_MATH[this.tier];
    return `RETORNO ${(m.rtp * 100).toFixed(0)}% EN LOS TRES MODOS · ${BOX_TIERS[this.tier].name}: MÁX. x${+m.max.toFixed(2)} · ${BOX_TIER_BLURB[this.tier]}`;
  }
  protected override locked() {
    return !!shelf() || this.playing;
  }
  protected override onTier() {
    this.drawContents();
  }

  private buildBoard() {
    const b = this.board;
    const sh = new Graphics();
    for (let r = 0; r < 3; r++) {
      const y = 330 + r * 190 + BH / 2;
      sh.rect(400, y, 760, 16).fill(0x5a3a20).stroke({ width: 3, color: CP.ink });
    }
    b.addChild(sh);
    for (let i = 0; i < 9; i++) {
      const bx = new Box(i, COLORS[i]);
      const home = { x: 520 + (i % 3) * 260, y: 330 + Math.floor(i / 3) * 190 };
      bx.position.set(home.x, home.y);
      this.homes.push(home);
      bx.eventMode = 'static';
      bx.cursor = 'pointer';
      bx.on('pointertap', () => this.pick(i));
      bx.on('pointerover', () => this.picking && !bx.opened && gsap.to(bx.scale, { x: 1.05, y: 1.05, duration: 0.1 }));
      bx.on('pointerout', () => gsap.to(bx.scale, { x: 1, y: 1, duration: 0.1 }));
      b.addChild(bx);
      this.boxes.push(bx);
    }
    const px = 1190;
    const pg = new Graphics().rect(px + 6, 230 + 6, 230, 600).fill(CP.ink).rect(px, 230, 230, 600).fill(0x2a1631).stroke({ width: 4, color: CP.violet });
    b.addChild(pg);
    const ph = label('ADENTRO HAY', 15, CP.yellow, { letterSpacing: 3 });
    ph.position.set(px + 16, 244);
    this.contentsT = heading('', 30, CP.paper, { lineHeight: 40 });
    this.contentsT.position.set(px + 16, 270);
    this.status = label('', 17, CP.paper, { wordWrap: true, wordWrapWidth: 200 });
    this.status.position.set(px + 16, 660);
    b.addChild(ph, this.contentsT, this.status);
    this.drawContents();
    // idle: a box wiggles now and then, as if something inside moved
    let idleT = 0;
    this.onTick((tk) => {
      idleT += tk.deltaMS;
      if (idleT < 1800 || this.playing) return;
      idleT = 0;
      const bx = this.boxes[Math.floor(Math.random() * 9)];
      if (!bx || bx.opened || bx.destroyed) return;
      gsap.fromTo(bx, { rotation: -0.04 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(1.2,0.3)' });
    });
  }
  private drawContents() {
    const c = [...BOX_TIERS[this.tier].contents].sort((a, b) => b - a);
    this.contentsT.text = c.map((v) => (v ? `x${v}` : 'NADA')).join('\n');
  }

  private idle() {
    for (const bx of this.boxes) bx.reset();
    this.picking = false;
    this.status.text = `Paga y elige ${BOX_TIERS[this.tier].picks === 1 ? 'una caja' : `${BOX_TIERS[this.tier].picks} cajas`}. Cobras lo que sumen.`;
  }
  private resume(s: Shelf) {
    for (const bx of this.boxes) bx.reset();
    for (const i of s.picked) this.showOpen(this.boxes[i], s.contents[i], true, false);
    this.picking = true;
    this.status.text = `Te faltan ${BOX_TIERS[s.tier].picks - s.picked.length}. Las cajas siguen donde las dejaste.`;
  }

  odds(): OddsSpec {
    return {
      title: 'Cajas misteriosas: probabilidades',
      cols: [
        { t: 'MODO', x: 0 },
        { t: 'LO QUE HAY EN LAS 9 CAJAS', x: 220 },
        { t: 'MÁXIMO', x: 900 },
        { t: 'RETORNO', x: 1100 },
      ],
      rows: BOX_TIERS.map((t, i) => [t.name, t.contents.map((v) => `x${v}`).join(' · '), `x${+BOX_MATH[i].max.toFixed(2)}`, pct(BOX_MATH[i].rtp)]),
      summary: ['Cada caja tiene la misma probabilidad (1 en 9) de tener cualquiera de esos premios.'],
      notes: [
        'Al pagar, la lista se revuelve con azar criptográfico y se guarda. Abres 3, 2 o 1 cajas (según el modo) y cobras la suma, multiplicada por tu apuesta (redondeado hacia abajo).',
        'Retorno = cajas que abres × (suma de la lista) / 9 = 96% exacto en los tres modos. Menos cajas = más riesgo y premio más gordo.',
        'Al terminar se abren todas para que veas dónde estaba cada cosa. Si sales a media ronda, las cajas te esperan igualitas.',
      ],
    };
  }

  play() {
    if (this.manualBlocked() || this.playing || shelf()) return;
    void this.start(1);
  }

  private async start(speed: number): Promise<boolean> {
    if (!canPay(this.cur, this.stake)) {
      if (speed === 1) this.poor();
      return false;
    }
    const s = boxesStart(this.cur, this.tier as BoxTier, this.stake);
    if (!s) return false;
    this.playing = true;
    this.refresh();
    if (speed === 1) {
      this.ctx.say('boxes', 0.5);
      this.ctx.chat('boxes', 1);
    }
    for (const bx of this.boxes) bx.reset();
    // shuffle dance (presentation; the real shuffle is already saved)
    if (speed < INSTANT_SPEED) {
      const rounds = speed >= 4 ? 1 : 3;
      for (let r = 0; r < rounds; r++) {
        const order = [...this.homes].sort(() => Math.random() - 0.5);
        audio.voice({ wave: 'noise', freq: 1.5, to: 0.8, dur: 0.2, vol: 0.08, lp: 1200 });
        await Promise.all(this.boxes.map((bx, i) => this.tween(bx, { x: order[i].x, y: order[i].y, duration: 0.22 / speed, ease: 'power2.inOut' })));
      }
      await Promise.all(this.boxes.map((bx, i) => this.tween(bx, { x: this.homes[i].x, y: this.homes[i].y, duration: 0.2 / speed, ease: 'back.out(1.6)' })));
    }
    this.playing = false;
    this.picking = true;
    this.status.text = `Elige ${BOX_TIERS[s.tier].picks === 1 ? 'una caja' : `${BOX_TIERS[s.tier].picks} cajas`}.`;
    this.refresh();
    return true;
  }

  private pick(i: number) {
    if (!this.picking || this.manualBlocked() || this.playing) return;
    void this.doPick(i, 1);
  }

  private async doPick(i: number, speed: number) {
    const bx = this.boxes[i];
    if (bx.opened) return null;
    const r = boxesPick(i);
    if (!r) return null;
    this.playing = true;
    // anticipation: the box shakes, then the lid pops
    if (speed < INSTANT_SPEED) {
      sfx('drumroll', 1.4);
      await this.tween(bx, { rotation: 0.06, duration: 0.05 / speed, yoyo: true, repeat: speed >= 4 ? 1 : 5 });
      bx.rotation = 0;
    }
    this.showOpen(bx, r.value, false, speed < INSTANT_SPEED);
    if (speed < INSTANT_SPEED) {
      if (r.value >= 1) sfx('fanfare');
      else if (r.value > 0) sfx('coin');
      else audio.voice({ wave: 'triangle', freq: 260, to: 180, dur: 0.2, vol: 0.1 });
    }
    await this.wait(380 / speed);
    if (r.done) {
      this.picking = false;
      // open the rest
      for (let k = 0; k < 9; k++) {
        if (r.done.picked.includes(k)) continue;
        this.showOpen(this.boxes[k], r.done.contents[k], true, speed < 4);
        if (speed < 4) await this.wait(70);
      }
      const at = { x: this.homes[4].x, y: this.homes[4].y };
      this.status.text = `Sumaste x${+r.done.total.toFixed(2)}.`;
      void this.celebrate(r.done.payout, r.done.stake, at, speed, { quiet: speed > 1 });
      this.candy(r.done.candy, at, speed);
      this.playing = false;
      this.refresh();
      return r;
    }
    this.playing = false;
    const s = shelf();
    this.status.text = s ? `Te ${BOX_TIERS[s.tier].picks - s.picked.length === 1 ? 'falta 1' : `faltan ${BOX_TIERS[s.tier].picks - s.picked.length}`}.` : '';
    return r;
  }

  private showOpen(bx: Box, v: number, dim: boolean, anim: boolean) {
    bx.opened = true;
    bx.picked = !dim;
    bx.prize.text = v ? `x${v}` : 'NADA';
    bx.prize.style.fill = v >= 1 ? CP.yellow : v > 0 ? CP.paper : 0x9a8aa6;
    bx.prize.visible = true;
    if (dim) bx.alpha = 0.55;
    if (anim) {
      gsap.to(bx.lid, { y: bx.lid.y - 70, rotation: -0.5, alpha: 0.8, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo(bx.prize.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
    } else {
      bx.lid.y -= 70;
      bx.lid.rotation = -0.5;
      bx.lid.alpha = 0.8;
    }
  }

  async autoStep(speed: number): Promise<AutoOutcome> {
    if (this.playing) return { ok: true };
    if (!shelf() && !(await this.start(speed))) return { ok: false };
    for (let guard = 0; guard < 10; guard++) {
      const s = shelf();
      if (!s || this.disposed) break;
      const free = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((k) => !s.picked.includes(k));
      const r = await this.doPick(free[Math.floor(Math.random() * free.length)], speed);
      if (r?.done) {
        if (speed < INSTANT_SPEED) await this.wait(300 / speed);
        return this.outcome(r.done.stake, r.done.payout);
      }
    }
    return { ok: true };
  }

  protected override updatePlay() {
    super.updatePlay();
    const s = shelf();
    if (s) {
      this.playBtn.disabled = true;
      this.playBtn.setText('ELIGE CAJAS', `${s.picked.length} DE ${BOX_TIERS[s.tier].picks}`);
    }
  }
}
