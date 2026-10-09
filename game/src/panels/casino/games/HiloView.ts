/**
 * MAYOR O MENOR "LA RACHA DEL GATO" (rules: state/sys/casino/hilo.ts).
 * A cat deck (A–K, four cosmetic suits: patita, pez, estambre, cascabel). Guess higher or lower; each button shows
 * its exact chance and the multiplier it applies BEFORE you press it. The pot grows, the dealer cat sweats, and you
 * decide when to cash out (COBRAR is the big button while a hand is open). A wrong guess burns the pot.
 * The hand is paid when dealt and saved after every card: leaving and coming back resumes it.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { audio, sfx } from '../../../core/audio';
import { fmt } from '../../../core/format';
import { INSTANT_SPEED, canPay } from '../../../state/sys/casino';
import { AUTO_HILO, HILO, Hand, Side, autoHiloRtp, bestSide, factor, hand, hiloCash, hiloGuess, hiloSkip, hiloStart, pRight } from '../../../state/sys/casino/hilo';
import type { AutoOutcome } from '../auto';
import type { CasinoCtx } from '../ctx';
import { CP, CButton, heading, label, paw } from '../kit';
import { MiniGame } from './base';
import { OddsSpec, pct } from './odds';

const RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_COL = [CP.pink, 0x2aa6d6, CP.red, 0xd4a017];
const CW = 220;
const CH = 308;

function suitGlyph(g: Graphics, suit: number, x: number, y: number, s: number) {
  const col = SUIT_COL[suit];
  if (suit === 0) paw(g, x, y, s * 0.6, col);
  else if (suit === 1) {
    g.ellipse(x - s * 0.1, y, s * 0.42, s * 0.26).fill(col);
    g.poly([x + s * 0.25, y, x + s * 0.55, y - s * 0.26, x + s * 0.55, y + s * 0.26]).fill(col);
  } else if (suit === 2) {
    g.circle(x, y, s * 0.42).fill(col);
    g.moveTo(x - s * 0.3, y - s * 0.1).quadraticCurveTo(x, y + s * 0.2, x + s * 0.3, y - s * 0.1).stroke({ width: Math.max(2, s * 0.07), color: 0xffffff, alpha: 0.6 });
  } else {
    g.moveTo(x - s * 0.4, y + s * 0.3).quadraticCurveTo(x - s * 0.4, y - s * 0.45, x, y - s * 0.45).quadraticCurveTo(x + s * 0.4, y - s * 0.45, x + s * 0.4, y + s * 0.3).closePath().fill(col);
    g.circle(x, y + s * 0.38, s * 0.1).fill(col);
  }
}

/** a card face (anchor centre). back = cat-patterned back */
function card(rank: number, suit: number, w = CW, h = CH, back = false): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2 + 6, -h / 2 + 6, w, h, w * 0.08).fill(CP.ink);
  g.roundRect(-w / 2, -h / 2, w, h, w * 0.08).fill(back ? CP.plum : CP.paper).stroke({ width: Math.max(3, w / 45), color: CP.ink });
  c.addChild(g);
  if (back) {
    g.roundRect(-w / 2 + w * 0.08, -h / 2 + w * 0.08, w * 0.84, h - w * 0.16, w * 0.05).stroke({ width: 3, color: CP.yellow, alpha: 0.7 });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) paw(g, -w * 0.25 + i * w * 0.25, -h * 0.3 + j * h * 0.2, w * 0.06, CP.pink);
    return c;
  }
  const col = SUIT_COL[suit];
  const corner = (sx: number, sy: number, rot: number) => {
    const t = heading(RANK[rank], w * 0.17, col);
    t.anchor.set(0.5);
    t.position.set(sx * (w / 2 - w * 0.13), sy * (h / 2 - w * 0.14));
    t.rotation = rot;
    c.addChild(t);
  };
  corner(-1, -1, 0);
  corner(1, 1, Math.PI);
  if (rank >= 11) {
    // face cards: a cat with a hat / tiara / crown
    const r = w * 0.26;
    g.poly([-r * 0.8, -r * 0.2, -r * 0.75, -r * 1.05, -r * 0.2, -r * 0.65]).fill(CP.ink);
    g.poly([r * 0.8, -r * 0.2, r * 0.75, -r * 1.05, r * 0.2, -r * 0.65]).fill(CP.ink);
    g.ellipse(0, 0, r, r * 0.8).fill(CP.ink);
    g.ellipse(-r * 0.35, -r * 0.05, r * 0.14, r * 0.1).fill(col).ellipse(r * 0.35, -r * 0.05, r * 0.14, r * 0.1).fill(col);
    if (rank === 13) g.poly([-r * 0.6, -r * 0.9, -r * 0.6, -r * 1.4, -r * 0.3, -r * 1.1, 0, -r * 1.5, r * 0.3, -r * 1.1, r * 0.6, -r * 1.4, r * 0.6, -r * 0.9]).fill(CP.yellow).stroke({ width: 3, color: CP.ink });
    else if (rank === 12) g.ellipse(0, -r * 1.0, r * 0.55, r * 0.18).fill(CP.yellow).stroke({ width: 3, color: CP.ink });
    else g.rect(-r * 0.4, -r * 1.35, r * 0.8, r * 0.45).fill(col).stroke({ width: 3, color: CP.ink });
    suitGlyph(g, suit, 0, h * 0.28, w * 0.2);
  } else {
    const t = heading(RANK[rank], w * 0.42, CP.ink);
    t.anchor.set(0.5);
    t.position.set(0, -h * 0.06);
    c.addChild(t);
    suitGlyph(g, suit, 0, h * 0.24, w * 0.28);
  }
  return c;
}

export class HiloView extends MiniGame {
  private cur0: Container | null = null;
  private history = new Container();
  private hiBtn!: CButton;
  private loBtn!: CButton;
  private skipBtn!: CButton;
  private potT!: Text;
  private potSub!: Text;
  private dealerT!: Text;
  private sweat = new Graphics();
  private suit = 0;

  constructor(ctx: CasinoCtx) {
    super(ctx, { id: 'hilo', title: 'MAYOR O MENOR', kicker: 'LA RACHA DEL GATO · EMPATE PIERDE · COBRA CUANDO QUIERAS', color: CP.green, playLabel: 'REPARTIR' });
    this.buildBoard();
    const h = hand();
    if (h) this.showHand(h, true);
    else this.idle();
    this.refresh(true);
  }

  maxMult() {
    return HILO.cap;
  }
  infoText() {
    return `CADA ACIERTO PAGA ${Math.round(HILO.first * 100)}% DE LO JUSTO (EL PRIMERO) Y ${Math.round(HILO.next * 100)}% (LOS DEMÁS) · BOTE MÁX. x${HILO.cap} · RETORNO ≤${Math.round(HILO.first * 100)}% (1 ACIERTO), ≤96% (2)`;
  }
  protected override locked() {
    return !!hand() || this.playing;
  }

  private buildBoard() {
    const b = this.board;
    const felt = new Graphics();
    felt.roundRect(390, 220, 1020, 650, 30).fill(0x0f3a2a).stroke({ width: 6, color: CP.ink });
    felt.roundRect(410, 240, 980, 610, 22).stroke({ width: 3, color: CP.green, alpha: 0.35 });
    b.addChild(felt);
    // deck
    for (let i = 0; i < 4; i++) {
      const k = card(1, 0, 150, 210, true);
      k.position.set(510 - i * 3, 470 - i * 3);
      b.addChild(k);
    }
    const dl = label('BARAJA SIN FIN · CADA CARTA 1 DE 13', 13, CP.paper, { letterSpacing: 1 });
    dl.anchor.set(0.5, 0);
    dl.position.set(510, 590);
    b.addChild(dl);
    this.history.position.set(430, 248);
    b.addChild(this.history);
    // pot panel
    const pot = new Graphics();
    pot.rect(1130 + 6, 330 + 6, 250, 250).fill(CP.ink);
    pot.rect(1130, 330, 250, 250).fill(0x0b0f0c).stroke({ width: 4, color: CP.green });
    b.addChild(pot);
    const pl = label('BOTE', 16, CP.green, { letterSpacing: 4 });
    pl.position.set(1148, 342);
    this.potT = heading('—', 64, CP.green);
    this.potT.position.set(1148, 366);
    this.potSub = label('', 17, CP.paper, { wordWrap: true, wordWrapWidth: 220 });
    this.potSub.position.set(1148, 450);
    b.addChild(pl, this.potT, this.potSub);
    // dealer: a gray cat with a visor
    const d = new Graphics();
    d.poly([-44, -10, -40, -58, -12, -36]).fill(0x8e8e9a).stroke({ width: 3, color: CP.ink });
    d.poly([44, -10, 40, -58, 12, -36]).fill(0x8e8e9a).stroke({ width: 3, color: CP.ink });
    d.ellipse(0, 0, 50, 40).fill(0x8e8e9a).stroke({ width: 4, color: CP.ink });
    d.rect(-54, -30, 108, 14).fill({ color: CP.green, alpha: 0.85 }).stroke({ width: 3, color: CP.ink });
    d.ellipse(-17, -2, 7, 5).fill(CP.yellow).ellipse(17, -2, 7, 5).fill(CP.yellow);
    d.poly([-5, 10, 5, 10, 0, 16]).fill(CP.pink);
    d.position.set(1255, 270);
    this.sweat.position.set(1255, 270);
    b.addChild(d, this.sweat);
    this.dealerT = label('', 16, CP.paper, { wordWrap: true, wordWrapWidth: 250, align: 'center' });
    this.dealerT.anchor.set(0.5, 0);
    this.dealerT.position.set(1255, 596);
    b.addChild(this.dealerT);
    // guess buttons
    this.hiBtn = new CButton('MAYOR', () => this.guess('hi'), { w: 270, h: 96, color: CP.green, size: 40, sub: '' });
    this.hiBtn.position.set(620, 740);
    this.loBtn = new CButton('MENOR', () => this.guess('lo'), { w: 270, h: 96, color: CP.softPink, size: 40, sub: '' });
    this.loBtn.position.set(904, 740);
    this.skipBtn = new CButton('PASAR', () => this.skip(), { w: 200, h: 96, color: CP.paperDark, size: 34, sub: '' });
    this.skipBtn.position.set(1190, 740);
    b.addChild(this.hiBtn, this.loBtn, this.skipBtn);
  }

  odds(): OddsSpec {
    const rows: string[][] = [];
    for (let c = 1; c <= 13; c++) {
      const hi = pRight(c, 'hi');
      const lo = pRight(c, 'lo');
      rows.push([`CARTA ${RANK[c]}`, hi > 0 ? `${pct(hi)} · x${factor(c, 'hi', 0)} / x${factor(c, 'hi', 1)}` : '—', lo > 0 ? `${pct(lo)} · x${factor(c, 'lo', 0)} / x${factor(c, 'lo', 1)}` : '—', pct(1 / 13)]);
    }
    return {
      title: 'Mayor o menor: probabilidades',
      cols: [
        { t: 'CARTA EN LA MESA', x: 0 },
        { t: 'MAYOR: PROB · PRIMER / SIGUIENTES', x: 300 },
        { t: 'MENOR: PROB · PRIMER / SIGUIENTES', x: 760 },
        { t: 'EMPATE (PIERDE)', x: 1220 },
      ],
      rows,
      summary: [`EL PILOTO AUTOMÁTICO (cobra tras 2 aciertos, pasa los 7): RETORNO ${(autoHiloRtp() * 100).toFixed(1)}%`],
      notes: [
        'Baraja sin fin: cada carta nueva es de 13 valores con la misma probabilidad (no sirve contar cartas). El palo es decorativo.',
        `Un acierto multiplica tu bote por ${HILO.first} / probabilidad (el primero) o ${HILO.next} / probabilidad (los siguientes), redondeado hacia abajo a 2 decimales. Empate pierde. Bote máximo x${HILO.cap}: ahí cobra solo.`,
        `Cobrar después de 1 acierto devuelve en promedio ${Math.round(HILO.first * 100)}% o menos; después de 2, 96% o menos; de 3, 95% o menos. Rachas largas = bote más gordo y comisión más grande. PASAR cambia la carta gratis (${HILO.skips} por mano).`,
        'La mano se paga al repartir y se guarda en cada carta: si sales, la retomas igualita.',
      ],
    };
  }

  // ---------------------------------------------------------------- view state
  private idle() {
    this.setCard(null, 1);
    this.potT.text = '—';
    this.potSub.text = 'Reparte para empezar. Primero adivinas, luego decides si cobras.';
    this.hiBtn.visible = this.loBtn.visible = this.skipBtn.visible = false;
    this.dealerT.text = '¿Mayor o menor? Empate pierde, ¿eh?';
    this.drawSweat(0);
  }
  private showHand(h: Hand, instant = false) {
    if (instant) this.setCard(h.card, 1);
    this.hiBtn.visible = this.loBtn.visible = this.skipBtn.visible = true;
    const hi = factor(h.card, 'hi', h.steps);
    const lo = factor(h.card, 'lo', h.steps);
    this.hiBtn.setText('MAYOR', hi ? `${pct(pRight(h.card, 'hi'))} · x${hi}` : 'IMPOSIBLE');
    this.loBtn.setText('MENOR', lo ? `${pct(pRight(h.card, 'lo'))} · x${lo}` : 'IMPOSIBLE');
    this.hiBtn.disabled = !hi;
    this.loBtn.disabled = !lo;
    this.skipBtn.setText('PASAR', `${h.skips} GRATIS`);
    this.skipBtn.disabled = h.skips <= 0;
    this.potT.text = h.steps ? `x${h.mult}` : 'x1';
    this.potSub.text = h.steps ? `${h.steps} ${h.steps === 1 ? 'acierto' : 'aciertos'} · cobras ${fmt(Math.floor(h.stake * h.mult))}` : `Apostaste ${fmt(h.stake)}. Primer acierto: adivina.`;
    this.drawSweat(h.steps);
  }
  private drawSweat(n: number) {
    const g = this.sweat.clear();
    for (let i = 0; i < Math.min(4, n); i++) g.ellipse(-60 + (i % 2) * 120, -30 + i * 10, 5, 8).fill(0x7fd8ff);
  }
  private setCard(rank: number | null, suit: number) {
    if (this.cur0) {
      gsap.killTweensOf(this.cur0);
      this.cur0.destroy({ children: true });
    }
    this.cur0 = rank ? card(rank, suit) : card(1, 0, CW, CH, true);
    this.cur0.position.set(840, 480);
    this.board.addChild(this.cur0);
  }
  private pushHistory(rank: number, suit: number) {
    const k = card(rank, suit, 56, 78);
    const n = this.history.children.length;
    k.position.set(30 + n * 64, 40);
    this.history.addChild(k);
    while (this.history.children.length > 10) {
      this.history.children[0].destroy({ children: true });
      this.history.children.forEach((c, i) => (c.x = 30 + i * 64));
    }
  }

  // ---------------------------------------------------------------- actions
  play() {
    if (this.manualBlocked() || this.playing) return;
    if (hand()) {
      void this.cash(1);
      return;
    }
    void this.deal(1);
  }
  private async deal(speed: number): Promise<boolean> {
    if (!canPay(this.cur, this.stake)) {
      if (speed === 1) this.poor();
      return false;
    }
    const h = hiloStart(this.cur, this.stake);
    if (!h) return false;
    this.playing = true;
    this.history.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.refresh();
    if (speed < 4) this.ctx.say('hilo', speed > 1 ? 0.2 : 0.5);
    await this.reveal(h.card, speed);
    this.playing = false;
    if (!this.disposed) {
      this.showHand(h);
      this.dealerT.text = 'Ahí está tu carta. ¿Mayor o menor?';
      this.refresh();
    }
    return true;
  }
  private guess(side: Side) {
    if (this.manualBlocked() || this.playing || !hand()) return;
    void this.doGuess(side, 1);
  }
  private skip() {
    if (this.manualBlocked() || this.playing || !hand()) return;
    void this.doSkip(1);
  }
  private async doSkip(speed: number) {
    const prev = hand()?.card ?? 1;
    const h = hiloSkip();
    if (!h) return;
    this.playing = true;
    this.pushHistory(prev, this.suit);
    await this.reveal(h.card, speed);
    this.playing = false;
    if (!this.disposed) {
      this.showHand(h);
      this.dealerT.text = 'Pasaste. Carta nueva, mismo bote.';
    }
  }
  private async doGuess(side: Side, speed: number) {
    const from = hand()!.card;
    const r = hiloGuess(side);
    if (!r) return null;
    this.playing = true;
    this.hiBtn.disabled = this.loBtn.disabled = this.skipBtn.disabled = true;
    this.pushHistory(from, this.suit);
    await this.reveal(r.card, speed);
    if (this.disposed) return r;
    const at = { x: 840, y: 480 };
    if (!r.right) {
      if (speed < INSTANT_SPEED) {
        audio.voice({ wave: 'triangle', freq: 330, to: 150, dur: 0.35, vol: 0.12 });
        this.ctx.shake(0.12);
        const g = new Graphics().moveTo(-90, -120).lineTo(90, 120).moveTo(90, -120).lineTo(-90, 120).stroke({ width: 16, color: 0xff3b1f, cap: 'round' });
        g.position.set(at.x, at.y);
        this.fxl.addChild(g);
        gsap.to(g, { alpha: 0, delay: 0.5 / speed, duration: 0.3, onComplete: () => g.destroy() });
      }
      this.dealerT.text = r.card === from ? 'Empate. Pierde. Te lo dije.' : '¡Uy! Se quemó el bote.';
      this.potT.text = 'x0';
      if (speed < 4) this.ctx.say('lose', 0.3);
      this.candy(r.done!.candy, at, speed);
      await this.wait(700 / speed);
      this.playing = false;
      if (!this.disposed) {
        this.idleButtons();
        this.refresh();
      }
      return r;
    }
    // right!
    if (speed < INSTANT_SPEED) {
      sfx('coin');
      gsap.fromTo(this.potT.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
    }
    this.dealerT.text = r.mult >= 4 ? 'Esto se está poniendo caro...' : '¡Bien! ¿Cobras o le sigues?';
    if (r.mult >= 4 && speed < 4) {
      this.ctx.say('hiloStreak', 0.6);
      this.ctx.chat('hiloStreak', 2);
    }
    if (r.done) {
      // house limit reached: cashed out automatically
      this.dealerT.text = `¡Tope de la casa x${HILO.cap}! Cobrado.`;
      void this.celebrate(r.done.payout, r.done.stake, at, speed);
      this.candy(r.done.candy, at, speed);
      this.playing = false;
      this.idleButtons();
      this.refresh();
      return r;
    }
    this.playing = false;
    this.showHand(hand()!);
    this.refresh();
    return r;
  }
  private async cash(speed: number) {
    const h = hand();
    if (!h || h.steps < 1) {
      sfx('error');
      if (h) this.dealerT.text = 'Primero acierta una, luego cobras.';
      return null;
    }
    const s = hiloCash();
    if (!s) return null;
    const at = { x: 1255, y: 420 };
    this.dealerT.text = 'Cobrado. Sabia decisión... para ti.';
    void this.celebrate(s.payout, s.stake, at, speed);
    this.candy(s.candy, at, speed);
    this.idleButtons();
    this.refresh();
    return s;
  }
  private idleButtons() {
    this.hiBtn.visible = this.loBtn.visible = this.skipBtn.visible = false;
    this.drawSweat(0);
  }

  /** a card flies from the deck and flips onto the table */
  private async reveal(rank: number, speed: number) {
    this.suit = Math.floor(Math.random() * 4);
    if (speed >= INSTANT_SPEED || this.disposed) {
      this.setCard(rank, this.suit);
      return;
    }
    const k = 1 / speed;
    this.setCard(null, 0);
    const c = this.cur0!;
    c.position.set(510, 470);
    c.scale.set(0.68);
    audio.voice({ wave: 'noise', freq: 2.5, to: 1, dur: 0.12, vol: 0.08, hp: 1800 });
    await this.tween(c, { x: 840, y: 480, duration: 0.28 * k, ease: 'power2.out' });
    gsap.to(c.scale, { y: 1, duration: 0.28 * k });
    await this.tween(c.scale, { x: 0.02, duration: 0.12 * k, ease: 'power1.in' });
    if (this.disposed) return;
    this.setCard(rank, this.suit);
    const f = this.cur0!;
    f.scale.set(0.02, 1);
    audio.voice({ wave: 'noise', freq: 3, to: 1.4, dur: 0.1, vol: 0.1, hp: 1400 });
    await this.tween(f.scale, { x: 1, duration: 0.14 * k, ease: 'back.out(2)' });
  }

  // ---------------------------------------------------------------- auto: the published strategy
  async autoStep(speed: number): Promise<AutoOutcome> {
    if (this.playing) return { ok: true };
    if (!hand() && !(await this.deal(speed))) return { ok: false };
    for (let guard = 0; guard < 40; guard++) {
      const h = hand();
      if (!h || this.disposed) break;
      if (h.steps >= AUTO_HILO.cashAfter) {
        const s = await this.cash(speed);
        return this.outcome(s?.stake ?? this.stake, s?.payout ?? 0);
      }
      if (h.card === 7 && h.skips > 0) {
        await this.doSkip(speed);
        await this.wait(120 / speed);
        continue;
      }
      const r = await this.doGuess(bestSide(h.card), speed);
      await this.wait(200 / speed);
      if (r?.done) return this.outcome(r.done.stake, r.done.payout);
    }
    return { ok: true };
  }

  protected override updatePlay() {
    super.updatePlay();
    const h = hand();
    if (h) {
      this.playBtn.disabled = h.steps < 1 || this.playing;
      this.playBtn.setText('COBRAR', h.steps ? `x${h.mult} · ${fmt(Math.floor(h.stake * h.mult))}` : 'ACIERTA PRIMERO');
    }
  }
}
