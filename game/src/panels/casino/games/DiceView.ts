/**
 * DUELO DE DADOS vs. DON CUBILETE (rules: state/sys/casino/dice.ts).
 * Best of 3. Each round you roll, then DECIDE: keep, or tap a die to re-roll it once. Every option shows its exact
 * chance to win the round before you choose. Don Cubilete then rolls in his cup and follows his printed rule.
 * Dice tumble (flicker of faces, spin, squash) and land with a thud; Don Cubilete reacts (smug / annoyed).
 * The duel is paid when it starts and saved after every roll: leaving and coming back resumes it.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { sfx } from '../../../core/audio';
import { audio } from '../../../core/audio';
import { INSTANT_SPEED, canPay } from '../../../state/sys/casino';
import { DICE, DICE_RTP, Duel, P_DUEL, P_ROUND, RoundResult, bestChoice, duel, duelDecide, duelStart, options, roundWin } from '../../../state/sys/casino/dice';
import type { AutoOutcome } from '../auto';
import type { CasinoCtx } from '../ctx';
import { CP, CButton, heading, label } from '../kit';
import { MiniGame } from './base';
import { OddsSpec, pct } from './odds';

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

class Die extends Container {
  private g = new Graphics();
  value = 1;
  constructor(
    public size: number,
    public color: number,
  ) {
    super();
    this.addChild(this.g);
    this.set(1);
  }
  set(v: number, dim = false) {
    this.value = v;
    const s = this.size;
    const g = this.g.clear();
    g.roundRect(-s / 2 + 6, -s / 2 + 6, s, s, s * 0.18).fill(CP.ink);
    g.roundRect(-s / 2, -s / 2, s, s, s * 0.18).fill(dim ? 0x9a8e86 : this.color).stroke({ width: 5, color: CP.ink });
    for (const [x, y] of PIPS[v]) g.circle(x * s * 0.26, y * s * 0.26, s * 0.085).fill(CP.ink);
  }
}

export class DiceView extends MiniGame {
  private mine: Die[] = [];
  private cats: Die[] = [];
  private optT: Text[] = [];
  private keepBtn!: CButton;
  private score!: Text;
  private pips = new Graphics();
  private banner!: Text;
  private catFace = new Container();
  private catMouth = new Graphics();
  private catSay!: Text;
  private cup = new Graphics();
  private deciding = false;

  constructor(ctx: CasinoCtx) {
    super(ctx, { id: 'dice', title: 'DUELO DE DADOS', kicker: 'AL MEJOR DE TRES · EMPATE GANA LA CASA · GANAS x' + DICE.mult, color: CP.yellow, playLabel: '¡A DUELO!' });
    this.buildBoard();
    const d = duel();
    if (d) this.resume(d);
    else this.idle();
    this.refresh(true);
  }

  maxMult() {
    return DICE.mult;
  }
  infoText() {
    return `RETORNO ${(DICE_RTP * 100).toFixed(1)}% CON LA MEJOR JUGADA · GANAR UNA RONDA ${(P_ROUND * 100).toFixed(1)}% · GANAR EL DUELO ${(P_DUEL * 100).toFixed(1)}% · PAGA x${DICE.mult}`;
  }
  protected override locked() {
    return !!duel() || this.playing;
  }

  private buildBoard() {
    const b = this.board;
    // felt table
    const felt = new Graphics();
    felt.roundRect(380 + 10, 220 + 10, 1030, 640, 30).fill(CP.ink);
    felt.roundRect(380, 220, 1030, 640, 30).fill(CP.felt).stroke({ width: 6, color: CP.ink });
    felt.roundRect(400, 240, 990, 600, 22).stroke({ width: 3, color: CP.yellow, alpha: 0.35 });
    felt.moveTo(895, 260).lineTo(895, 820).stroke({ width: 3, color: CP.yellow, alpha: 0.25 });
    b.addChild(felt);
    const you = heading('TÚ', 44, CP.paper);
    you.position.set(430, 250);
    const them = heading('DON CUBILETE', 44, CP.paper);
    them.anchor.set(1, 0);
    them.position.set(1380, 250);
    b.addChild(you, them);
    // score + round pips
    this.score = heading('0 — 0', 64, CP.yellow);
    this.score.anchor.set(0.5, 0);
    this.score.position.set(895, 236);
    this.pips.position.set(895, 330);
    b.addChild(this.score, this.pips);
    // your dice
    for (let i = 0; i < 2; i++) {
      const d = new Die(124, CP.paper);
      d.position.set(540 + i * 190, 520);
      d.eventMode = 'static';
      d.cursor = 'pointer';
      d.on('pointertap', () => this.decide(i as 0 | 1));
      d.on('pointerover', () => this.deciding && gsap.to(d.scale, { x: 1.08, y: 1.08, duration: 0.1 }));
      d.on('pointerout', () => gsap.to(d.scale, { x: 1, y: 1, duration: 0.1 }));
      b.addChild(d);
      this.mine.push(d);
      const t = label('', 17, CP.paper, { align: 'center' });
      t.anchor.set(0.5, 0);
      t.position.set(d.x, 600);
      b.addChild(t);
      this.optT.push(t);
    }
    this.keepBtn = new CButton('ME QUEDO', () => this.decide(-1), { w: 300, h: 74, color: CP.yellow, size: 32, sub: '' });
    this.keepBtn.position.set(485, 690);
    b.addChild(this.keepBtn);
    // Don Cubilete: a round tabby with an eye patch and a cup
    this.buildCat();
    for (let i = 0; i < 2; i++) {
      const d = new Die(104, 0xffe08a);
      d.position.set(1110 + i * 150, 690);
      d.visible = false;
      b.addChild(d);
      this.cats.push(d);
    }
    this.banner = heading('', 56, CP.paper, { stroke: { color: CP.ink, width: 8, join: 'round' } });
    this.banner.anchor.set(0.5);
    this.banner.position.set(895, 384);
    b.addChild(this.banner);
  }

  private buildCat() {
    const c = this.catFace;
    const g = new Graphics();
    const r = 92;
    g.poly([-r * 0.8, -r * 0.3, -r * 0.7, -r * 1.15, -r * 0.2, -r * 0.75]).fill(0xe08a3a).stroke({ width: 4, color: CP.ink });
    g.poly([r * 0.8, -r * 0.3, r * 0.7, -r * 1.15, r * 0.2, -r * 0.75]).fill(0xe08a3a).stroke({ width: 4, color: CP.ink });
    g.ellipse(0, 0, r, r * 0.82).fill(0xe08a3a).stroke({ width: 5, color: CP.ink });
    for (const x of [-0.5, 0, 0.5]) g.moveTo(x * r, -r * 0.8).lineTo(x * r * 0.8, -r * 0.45).stroke({ width: 6, color: 0xb0602a, cap: 'round' });
    g.ellipse(-r * 0.36, -r * 0.08, r * 0.16, r * 0.12).fill(CP.yellow).stroke({ width: 3, color: CP.ink });
    g.ellipse(-r * 0.36, -r * 0.08, r * 0.04, r * 0.11).fill(CP.ink);
    // eye patch
    g.ellipse(r * 0.36, -r * 0.08, r * 0.2, r * 0.16).fill(CP.ink);
    g.moveTo(-r * 0.9, -r * 0.45).lineTo(r * 0.95, -r * 0.2).stroke({ width: 4, color: CP.ink });
    g.poly([-r * 0.08, r * 0.12, r * 0.08, r * 0.12, 0, r * 0.22]).fill(CP.pink);
    for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) g.moveTo(sx * r * 0.3, r * 0.25 + k * 8).lineTo(sx * r * 0.95, r * 0.18 + k * 16).stroke({ width: 2, color: CP.paper });
    // a die earring
    g.roundRect(r * 0.62, -r * 0.62, 22, 22, 4).fill(CP.paper).stroke({ width: 3, color: CP.ink });
    g.circle(r * 0.62 + 11, -r * 0.62 + 11, 3).fill(CP.ink);
    this.catMouth.position.set(0, r * 0.4);
    c.addChild(g, this.catMouth);
    c.position.set(1225, 450);
    this.board.addChild(c);
    this.mouth('smug');
    this.catSay = label('', 18, CP.paper, { wordWrap: true, wordWrapWidth: 330, align: 'center' });
    this.catSay.anchor.set(0.5, 0);
    this.catSay.position.set(1215, 560);
    this.board.addChild(this.catSay);
    // the cup
    this.cup.roundRect(-60, -80, 120, 110, 14).fill(0x7a2a1a).stroke({ width: 5, color: CP.ink });
    this.cup.rect(-60, -50, 120, 12).fill(CP.yellow);
    this.cup.position.set(1360, 410);
    this.cup.rotation = 0.2;
    this.board.addChild(this.cup);
    gsap.to(c, { y: c.y - 6, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }

  private mouth(m: 'smug' | 'mad' | 'shock') {
    const g = this.catMouth.clear();
    if (m === 'smug') g.moveTo(-26, 0).quadraticCurveTo(0, 18, 30, -8).stroke({ width: 4, color: CP.ink, cap: 'round' });
    else if (m === 'mad') g.moveTo(-24, 10).quadraticCurveTo(0, -8, 24, 10).stroke({ width: 4, color: CP.ink, cap: 'round' });
    else g.ellipse(0, 6, 12, 14).fill(CP.ink);
  }
  private setBanner(t: string, col: number) {
    this.banner.text = t;
    this.banner.style.fill = col;
    this.banner.scale.set(1);
    const k = Math.min(1, 470 / Math.max(1, this.banner.width));
    this.banner.scale.set(k);
    (this.banner as Text & { k?: number }).k = k;
  }
  private catLine(t: string) {
    this.catSay.text = t;
    gsap.fromTo(this.catSay, { alpha: 0 }, { alpha: 1, duration: 0.2 });
  }

  odds(): OddsSpec {
    const rows: string[][] = [];
    for (let t = 2; t <= 12; t++) rows.push([`TU TOTAL ${t}`, pct(roundWin(t)), pct(1 - roundWin(t))]);
    return {
      title: 'Duelo de dados: probabilidades',
      cols: [
        { t: 'SI TERMINAS CON…', x: 0 },
        { t: 'GANAS LA RONDA', x: 360 },
        { t: 'LA GANA DON CUBILETE', x: 640 },
      ],
      rows,
      summary: [
        `RONDA CON LA MEJOR JUGADA: ${pct(P_ROUND)} · DUELO (2 DE 3): ${pct(P_DUEL)} · PAGA x${DICE.mult} · RETORNO ${(DICE_RTP * 100).toFixed(2)}%`,
      ],
      notes: [
        'Tiras dos dados y DECIDES: te quedas, o vuelves a tirar UNO (tú eliges cuál), una vez por ronda. Cada opción muestra su probabilidad exacta antes de elegir.',
        'Don Cubilete tira dos dados. Su regla es pública: si va perdiendo, vuelve a tirar su dado más bajo, una vez. Empate = gana la casa.',
        'Gana el que se lleve 2 rondas. Ganas el duelo: cobras tu apuesta x2.6. Dados justos, azar criptográfico. El duelo se paga al empezar y se guarda en cada tirada (si sales, lo retomas igualito).',
        'Si juegas peor que la mejor jugada, tu retorno baja. El piloto automático usa siempre la mejor jugada.',
      ],
    };
  }

  // ---------------------------------------------------------------- flow
  private idle() {
    this.deciding = false;
    for (const d of this.mine) d.set(6, true);
    for (const d of this.cats) d.visible = false;
    for (const t of this.optT) t.text = '';
    this.keepBtn.visible = false;
    this.drawScore(0, 0);
    this.banner.text = '';
    this.catLine('¿Un duelito? Al mejor de tres.\nEmpate gana la casa.');
    this.mouth('smug');
  }
  private resume(d: Duel) {
    this.drawScore(d.me, d.cat);
    this.mine.forEach((x, i) => x.set(d.dice[i]));
    this.showOptions(d.dice);
    this.catLine('Te estaba esperando. Tus dados siguen ahí.');
  }
  private drawScore(me: number, cat: number) {
    this.score.text = `${me} — ${cat}`;
    const g = this.pips.clear();
    for (let i = 0; i < 2; i++) {
      g.circle(-90 + i * 30, 0, 10).fill(i < me ? CP.yellow : 0x24483a).stroke({ width: 3, color: CP.ink });
      g.circle(60 + i * 30, 0, 10).fill(i < cat ? 0xff3b1f : 0x24483a).stroke({ width: 3, color: CP.ink });
    }
  }
  private showOptions(dice: [number, number]) {
    const o = options(dice);
    const best = bestChoice(dice);
    this.deciding = true;
    this.optT[0].text = `TOCA PARA RE-TIRAR\n${pct(o.r0)} de ganar${best === 0 ? '\nLA MEJOR' : ''}`;
    this.optT[1].text = `TOCA PARA RE-TIRAR\n${pct(o.r1)} de ganar${best === 1 ? '\nLA MEJOR' : ''}`;
    this.keepBtn.visible = true;
    this.keepBtn.setText('ME QUEDO', `${pct(o.keep)} de ganar la ronda${best === -1 ? ' · LA MEJOR' : ''}`);
  }
  private hideOptions() {
    this.deciding = false;
    for (const t of this.optT) t.text = '';
    this.keepBtn.visible = false;
  }

  play() {
    if (this.manualBlocked() || this.playing) return;
    if (duel()) return;
    void this.start(1);
  }

  private async start(speed: number): Promise<boolean> {
    const stake = this.stake;
    if (!canPay(this.cur, stake)) return false;
    const d = duelStart(this.cur, stake);
    if (!d) return false;
    this.playing = true;
    this.refresh();
    if (speed < 4) {
      this.ctx.say('dice', speed > 1 ? 0.2 : 0.6);
      this.ctx.chat('dice', 1);
    }
    this.drawScore(0, 0);
    this.banner.text = '';
    for (const c of this.cats) c.visible = false;
    this.catLine('Tira tú primero.');
    await this.roll(this.mine, d.dice, speed);
    this.playing = false;
    if (this.disposed) return true;
    this.showOptions(d.dice);
    this.refresh();
    return true;
  }

  private decide(choice: -1 | 0 | 1) {
    if (!this.deciding || this.manualBlocked() || this.playing) return;
    void this.resolve(choice, 1);
  }

  private async resolve(choice: -1 | 0 | 1, speed: number): Promise<RoundResult | null> {
    const r = duelDecide(choice);
    if (!r) return null;
    this.playing = true;
    this.hideOptions();
    if (choice === 0 || choice === 1) await this.roll([this.mine[choice]], [r.mine[choice]], speed);
    // Don Cubilete
    this.catLine(choice >= 0 ? 'Re-tiraste. Valiente.' : 'Te quedas. Muy bien.');
    if (speed < INSTANT_SPEED) {
      gsap.fromTo(this.cup, { rotation: 0.2 }, { rotation: -0.5, duration: 0.12 / speed, yoyo: true, repeat: 3 });
      audio.voice({ wave: 'noise', freq: 2, to: 1, dur: 0.4 / speed, vol: 0.12, hp: 800 });
      await this.wait(400 / speed);
    }
    for (const c of this.cats) c.visible = true;
    await this.roll(this.cats, r.catFirst, speed);
    const cr = r.catRerolled;
    if (cr === 0 || cr === 1) {
      this.catLine('Uy. Ese no me gustó. Lo vuelvo a tirar.');
      this.mouth('mad');
      await this.wait(350 / speed);
      await this.roll([this.cats[cr]], [r.catDice[cr]], speed);
    }
    const mt = r.mine[0] + r.mine[1];
    const ct = r.catDice[0] + r.catDice[1];
    const won = r.winner === 'me';
    this.setBanner(won ? `¡RONDA PARA TI! ${mt} vs ${ct}` : mt === ct ? `EMPATE ${mt}: GANA LA CASA` : `RONDA PARA ÉL: ${mt} vs ${ct}`, won ? CP.yellow : 0xff8a7a);
    if (speed < INSTANT_SPEED) {
      const k = (this.banner as Text & { k?: number }).k ?? 1;
      gsap.fromTo(this.banner.scale, { x: 1.5 * k, y: 1.5 * k }, { x: k, y: k, duration: 0.3 / Math.sqrt(speed), ease: 'back.out(3)' });
      if (won) sfx('coin');
      else audio.voice({ wave: 'triangle', freq: 300, to: 200, dur: 0.25, vol: 0.1 });
    }
    this.mouth(won ? 'shock' : 'smug');
    this.catLine(won ? '¿Qué? Suerte de principiante.' : mt === ct ? 'Empate. Mi casa, mis reglas.' : 'Así se tira, ¿ves?');
    this.drawScore(r.score[0], r.score[1]);
    await this.wait(900 / speed);
    if (r.done) {
      const at = { x: 895, y: 430 };
      if (speed < 4) {
        this.ctx.say(r.won ? 'diceWin' : 'diceLose', speed > 1 ? 0.4 : 1);
        this.ctx.chat(r.won ? 'diceWin' : 'diceLose', 2);
      }
      this.setBanner(r.won ? `¡GANASTE EL DUELO ${r.score[0]}-${r.score[1]}!` : `DUELO PERDIDO ${r.score[0]}-${r.score[1]}`, r.won ? CP.yellow : 0xff8a7a);
      this.mouth(r.won ? 'mad' : 'smug');
      void this.celebrate(r.done.payout, r.done.stake, at, speed, { quiet: true });
      this.candy(r.done.candy, at, speed);
      await this.wait(1000 / speed);
      this.playing = false;
      if (!this.disposed) {
        for (const d of this.mine) d.set(d.value, true);
        this.catLine(r.won ? 'La revancha cuando quieras.' : '¿Otra? La casa invita... a perder.');
        this.refresh();
      }
      return r;
    }
    // next round: your dice are already rolled (saved)
    for (const c of this.cats) c.visible = false;
    this.banner.text = '';
    await this.roll(this.mine, r.next!, speed);
    this.playing = false;
    if (!this.disposed) {
      this.showOptions(r.next!);
      this.refresh();
    }
    return r;
  }

  /** tumble animation that lands exactly on `vals` */
  private async roll(dice: Die[], vals: number[], speed: number) {
    if (speed >= INSTANT_SPEED || this.disposed) {
      dice.forEach((d, i) => d.set(vals[i]));
      return;
    }
    const dur = 0.6 / Math.sqrt(speed);
    const steps = Math.max(3, Math.round(8 / Math.sqrt(speed)));
    dice.forEach((d) => {
      gsap.killTweensOf(d);
      const y0 = d.y;
      gsap.fromTo(d, { rotation: (Math.random() - 0.5) * 2 }, { rotation: 0, duration: dur, ease: 'power2.out' });
      gsap.fromTo(d, { y: y0 - 80 }, { y: y0, duration: dur, ease: 'bounce.out' });
    });
    for (let s = 0; s < steps; s++) {
      dice.forEach((d) => d.set(1 + Math.floor(Math.random() * 6)));
      if (speed < 4 && s % 2 === 0) audio.voice({ wave: 'square', freq: 900 + Math.random() * 400, dur: 0.02, vol: 0.04 });
      await this.wait((dur * 1000) / steps);
    }
    dice.forEach((d, i) => {
      d.set(vals[i]);
      gsap.fromTo(d.scale, { x: 1.2, y: 0.85 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
    });
    if (speed < 4) audio.voice({ wave: 'sine', freq: 120, to: 60, dur: 0.12, vol: 0.2 });
  }

  // ---------------------------------------------------------------- auto: a whole duel with the best decision
  async autoStep(speed: number): Promise<AutoOutcome> {
    if (this.playing) return { ok: true };
    if (!duel()) {
      if (!canPay(this.cur, this.stake)) return { ok: false };
      if (!(await this.start(speed))) return { ok: false };
    }
    let last: RoundResult | null = null;
    for (let guard = 0; guard < 5; guard++) {
      const d = duel();
      if (!d || this.disposed) break;
      last = await this.resolve(bestChoice(d.dice), speed);
      if (!last || last.done) break;
    }
    const pay = last?.done?.payout ?? 0;
    return this.outcome(last?.done?.stake ?? this.stake, pay);
  }

  protected override updatePlay() {
    super.updatePlay();
    const open = !!duel();
    this.playBtn.disabled = open || this.playing || !canPay(this.cur, this.stake);
    if (open) this.playBtn.setText('EN DUELO', 'DECIDE ARRIBA');
  }

  override dispose() {
    gsap.killTweensOf(this.catFace);
    gsap.killTweensOf(this.cup);
    super.dispose();
  }
}
