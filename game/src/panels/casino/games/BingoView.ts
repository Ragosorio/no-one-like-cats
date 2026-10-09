/**
 * BINGO EXPRÉS (rules: state/sys/casino/bingo.ts). Quick rounds: 13 of 30 balls come out of the cage one by one,
 * your cards get daubed, completed lines light up. 1 to 3 cards per round (each costs the stake and is paid on its
 * own). Your numbers stay between rounds; "CARTONES NUEVOS" shuffles them (cosmetic: any card has the same odds).
 * The draw is made and paid when you press ¡BINGO!; the cage only presents it.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { audio } from '../../../core/audio';
import { fmt } from '../../../core/format';
import { INSTANT_SPEED, canPay } from '../../../state/sys/casino';
import { BINGO, BINGO_DIST, BINGO_LINES, BINGO_MATH, BINGO_PAY, BINGO_PAY_ROWS, BingoRound, bingoCard, bingoPlay, validCard } from '../../../state/sys/casino/bingo';
import { miniPrefs } from '../../../state/sys/casino/common';
import type { AutoOutcome } from '../auto';
import type { CasinoCtx } from '../ctx';
import { CP, CButton, Seg, heading, label } from '../kit';
import { MiniGame } from './base';
import { OddsSpec, oneIn, pct } from './odds';

const CELL = 64;
const CARD_W = CELL * 3 + 16;
const CARD_Y = 286;
const CAGE = { x: 540, y: 470, r: 130 };
const TRAY_Y = 790;
const BALL_COL = [0xff6a1a, CP.cyan, CP.pink];

class CardView extends Container {
  cells: { bg: Graphics; t: Text; daub: Graphics }[] = [];
  lines = new Graphics();
  result: Text;
  constructor(public nums: number[]) {
    super();
    const bg = new Graphics();
    bg.rect(6, 6, CARD_W, CARD_W + 40).fill(CP.ink);
    bg.rect(0, 0, CARD_W, CARD_W + 40).fill(CP.paper).stroke({ width: 4, color: CP.ink, alignment: 1 });
    bg.rect(0, 0, CARD_W, 36).fill(0xff6a1a);
    const h = heading('B · I · N', 24, CP.ink);
    h.anchor.set(0.5, 0);
    h.position.set(CARD_W / 2, 3);
    this.addChild(bg, h);
    nums.forEach((n, i) => {
      const x = 8 + (i % 3) * CELL;
      const y = 44 + Math.floor(i / 3) * CELL;
      const cb = new Graphics().rect(x, y, CELL - 4, CELL - 4).fill(0xf5ead6).stroke({ width: 2, color: CP.ink });
      const daub = new Graphics().circle(x + (CELL - 4) / 2, y + (CELL - 4) / 2, 25).fill({ color: CP.pink, alpha: 0.8 });
      daub.visible = false;
      const t = heading(String(n), 30, CP.ink);
      t.anchor.set(0.5);
      t.position.set(x + (CELL - 4) / 2, y + (CELL - 4) / 2);
      this.addChild(cb, daub, t);
      this.cells.push({ bg: cb, t, daub });
    });
    this.addChild(this.lines);
    this.result = heading('', 26, CP.yellow);
    this.result.anchor.set(0.5, 0);
    this.result.position.set(CARD_W / 2, CARD_W + 50);
    this.addChild(this.result);
  }
  reset() {
    for (const c of this.cells) c.daub.visible = false;
    this.lines.clear();
    this.result.text = '';
  }
  daub(i: number, anim: boolean) {
    const c = this.cells[i];
    c.daub.visible = true;
    if (anim) gsap.fromTo(c.daub.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' });
  }
  drawLine(li: number) {
    const L = BINGO_LINES[li];
    const p = (i: number) => ({ x: 8 + (i % 3) * CELL + (CELL - 4) / 2, y: 44 + Math.floor(i / 3) * CELL + (CELL - 4) / 2 });
    const a = p(L[0]);
    const b = p(L[2]);
    this.lines.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 10, color: CP.yellow, cap: 'round', alpha: 0.9 });
    this.lines.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 3, color: CP.ink, cap: 'round' });
  }
}

export class BingoView extends MiniGame {
  private cards: CardView[] = [];
  private cardBox = new Container();
  private nSeg!: Seg<number>;
  private newBtn!: CButton;
  private cageBalls: Graphics[] = [];
  private tray = new Container();
  private cage = new Container();
  private t = 0;
  private spin = 1;

  constructor(ctx: CasinoCtx) {
    super(ctx, { id: 'bingo', title: 'BINGO EXPRÉS', kicker: '13 DE 30 BOLITAS · PAGA POR LÍNEAS · CADA CARTÓN COBRA SOLO', color: 0xff6a1a, playLabel: '¡BINGO!' });
    this.buildBoard();
    this.layoutCards();
    this.refresh(true);
  }

  private get n() {
    return Math.max(1, Math.min(BINGO.maxCards, Math.floor(Number(miniPrefs('bingo').n) || 1)));
  }
  maxMult() {
    return BINGO_MATH.max;
  }
  infoText() {
    return `RETORNO ${(BINGO_MATH.rtp * 100).toFixed(1)}% POR CARTÓN · PREMIO EN ${(BINGO_MATH.hit * 100).toFixed(1)}% DE LOS CARTONES · LLENO x${BINGO_PAY[8]} (${oneIn(BINGO_DIST[8])})`;
  }

  private buildBoard() {
    const b = this.board;
    // cage
    const cg = new Graphics();
    cg.rect(CAGE.x - 20, CAGE.y + CAGE.r - 10, 40, 90).fill(0x5a3a20).stroke({ width: 4, color: CP.ink });
    cg.rect(CAGE.x - 90, CAGE.y + CAGE.r + 70, 180, 22).fill(0x5a3a20).stroke({ width: 4, color: CP.ink });
    cg.circle(CAGE.x, CAGE.y, CAGE.r).fill({ color: 0xffffff, alpha: 0.08 }).stroke({ width: 6, color: CP.yellow });
    b.addChild(cg);
    this.cage.position.set(CAGE.x, CAGE.y);
    b.addChild(this.cage);
    for (let i = 0; i < 14; i++) {
      const g = new Graphics().circle(0, 0, 16).fill(BALL_COL[i % 3]).stroke({ width: 3, color: CP.ink });
      g.circle(-5, -5, 4).fill({ color: 0xffffff, alpha: 0.6 });
      this.cage.addChild(g);
      this.cageBalls.push(g);
    }
    const wires = new Graphics();
    for (let i = 0; i < 6; i++) wires.ellipse(0, 0, CAGE.r, CAGE.r * (0.2 + i * 0.16)).stroke({ width: 2, color: CP.yellow, alpha: 0.5 });
    this.cage.addChild(wires);
    this.onTick((tk) => {
      this.t += tk.deltaMS / 1000;
      wires.rotation += (tk.deltaMS / 1000) * 0.6 * this.spin;
      this.cageBalls.forEach((g, i) => {
        const a = this.t * (1.1 + (i % 4) * 0.3) * this.spin + i * 1.7;
        const rr = (CAGE.r - 24) * (0.35 + 0.6 * Math.abs(Math.sin(a * 0.7 + i)));
        g.position.set(Math.cos(a) * rr, Math.sin(a * 1.3) * rr * 0.9);
      });
    });
    // tray
    const tr = new Graphics();
    tr.roundRect(392, TRAY_Y - 34, 13 * 52 + 16, 68, 34).fill(0x2a1a12).stroke({ width: 4, color: CP.ink });
    b.addChild(tr);
    this.tray.position.set(426, TRAY_Y);
    b.addChild(this.tray);
    b.addChild(this.cardBox);
    // card count + new cards
    this.nSeg = new Seg<number>(
      [1, 2, 3].map((v) => ({ v, label: `${v} ${v === 1 ? 'CARTÓN' : 'CARTONES'}` })),
      this.n,
      (v) => {
        if (this.playing) {
          this.nSeg.set(this.n);
          return;
        }
        miniPrefs('bingo').n = v;
        this.layoutCards();
        this.refresh();
      },
      { w: 130, h: 42, size: 18, color: 0xff6a1a, gap: 6 },
    );
    this.nSeg.position.set(760, 222);
    this.newBtn = new CButton('CARTONES NUEVOS', () => this.newCards(), { w: 236, h: 42, color: CP.paperDark, size: 20 });
    this.newBtn.position.set(1176, 222);
    b.addChild(this.nSeg, this.newBtn);
    const pt = label(BINGO_PAY_ROWS.map((r) => `${r.name} x${BINGO_PAY[r.lines]}`).join(' · '), 15, CP.paper, { wordWrap: true, wordWrapWidth: 640 });
    pt.position.set(760, 660);
    b.addChild(pt);
  }

  private savedCards(): number[][] {
    const p = miniPrefs('bingo');
    if (!Array.isArray(p.cards) || p.cards.length < BINGO.maxCards || !p.cards.every(validCard)) p.cards = Array.from({ length: BINGO.maxCards }, () => bingoCard());
    return p.cards;
  }
  private newCards() {
    if (this.playing || this.manualBlocked()) return;
    miniPrefs('bingo').cards = Array.from({ length: BINGO.maxCards }, () => bingoCard());
    this.layoutCards();
    audio.voice({ wave: 'noise', freq: 2.5, to: 1, dur: 0.2, vol: 0.1, hp: 1500 });
  }
  private layoutCards() {
    this.cardBox.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cards = [];
    const all = this.savedCards();
    const n = this.n;
    const total = n * CARD_W + (n - 1) * 20;
    const x0 = 760 + (650 - total) / 2;
    for (let i = 0; i < n; i++) {
      const c = new CardView(all[i]);
      c.position.set(x0 + i * (CARD_W + 20), CARD_Y);
      this.cardBox.addChild(c);
      this.cards.push(c);
    }
  }

  odds(): OddsSpec {
    return {
      title: 'Bingo exprés: probabilidades',
      cols: [
        { t: 'EN UN CARTÓN', x: 0 },
        { t: 'PROBABILIDAD', x: 360 },
        { t: 'O SEA', x: 600 },
        { t: 'PAGA', x: 860 },
      ],
      rows: [
        ['NADA (0 LÍNEAS)', pct(BINGO_DIST[0]), oneIn(BINGO_DIST[0]), 'x0'],
        ...BINGO_PAY_ROWS.map((r) => [r.name, pct(BINGO_DIST[r.lines] ?? 0), oneIn(BINGO_DIST[r.lines] ?? 0), `x${BINGO_PAY[r.lines]}`]),
      ],
      summary: [`RETORNO POR CARTÓN: ${(BINGO_MATH.rtp * 100).toFixed(2)}% · PREMIO EN ${(BINGO_MATH.hit * 100).toFixed(1)}%`],
      notes: [
        'Salen 13 de las 30 bolitas, sin repetir (azar criptográfico). Líneas = filas, columnas y las 2 diagonales completas. 7 líneas es imposible en un 3×3; con las 9 casillas son 8 (CARTÓN LLENO).',
        'Probabilidad exacta: cualquier grupo de casillas marcadas del mismo tamaño es igual de probable, así que P(marcadas = S) = C(21, 13 − |S|) / C(30, 13), sumado sobre los 512 grupos.',
        'Tus números no importan: cualquier cartón tiene las mismas probabilidades. Juega 1, 2 o 3 cartones; cada uno cuesta la apuesta y cobra por su cuenta (comparten la misma tómbola).',
      ],
    };
  }

  play() {
    if (this.manualBlocked() || this.playing) return;
    void this.round(1, false);
  }
  autoStep(speed: number): Promise<AutoOutcome> {
    if (this.playing) return Promise.resolve({ ok: true });
    return this.round(speed, true);
  }

  private async round(speed: number, auto: boolean): Promise<AutoOutcome> {
    const n = this.n;
    const stake = this.stake;
    if (!canPay(this.cur, stake * n)) {
      if (!auto) this.poor();
      return { ok: false };
    }
    const res = bingoPlay(this.cur, stake, this.cards.map((c) => c.nums));
    if (!res) return { ok: false };
    this.playing = true;
    const release = res.payout > 0 ? this.ctx.hold({ [this.pill()]: res.payout }) : () => {};
    this.refresh();
    if (!auto) {
      this.ctx.say('bingo', 0.4);
      this.ctx.chat('bingo', 1);
    }
    try {
      await this.present(res, speed);
    } catch (e) {
      console.warn('[bingo]', e);
    }
    this.playing = false;
    if (this.disposed) {
      release();
      return { ok: true };
    }
    const at = { x: 1085, y: 560 };
    void this.celebrate(res.payout, res.stake, at, speed, { quiet: auto });
    release();
    this.candy(res.candy, at, speed);
    this.refresh();
    return this.outcome(res.stake, res.payout);
  }

  private async present(res: BingoRound, speed: number) {
    for (const c of this.cards) c.reset();
    this.tray.removeChildren().forEach((c) => c.destroy({ children: true }));
    const instant = speed >= INSTANT_SPEED;
    const k = 1 / speed;
    this.spin = instant ? 1 : 4;
    const done = res.cards.map(() => new Set<number>());
    for (let bi = 0; bi < res.balls.length; bi++) {
      if (this.disposed) return;
      const n = res.balls[bi];
      if (!instant) {
        const ball = new Container();
        const g = new Graphics().circle(0, 0, 22).fill(BALL_COL[n % 3]).stroke({ width: 3, color: CP.ink });
        g.circle(0, 0, 13).fill(CP.paper);
        const t = heading(String(n), 18, CP.ink);
        t.anchor.set(0.5);
        ball.addChild(g, t);
        ball.position.set(CAGE.x, CAGE.y + CAGE.r - 10);
        ball.scale.set(0.3);
        this.board.addChild(ball);
        if (speed < 4 || bi % 2 === 0) audio.voice({ wave: 'sine', freq: 500 + (n % 10) * 60, to: 900, dur: 0.08, vol: 0.06 });
        gsap.to(ball.scale, { x: 1, y: 1, duration: 0.15 * k });
        await this.tween(ball, { x: 426 + bi * 52, y: TRAY_Y, duration: 0.24 * k, ease: 'power2.out' });
        if (!ball.destroyed) {
          ball.position.set(0, 0);
          ball.x = bi * 52;
          this.tray.addChild(ball);
        }
      }
      // daub + lines
      res.cards.forEach((cr, ci) => {
        const cv = this.cards[ci];
        const i = cr.card.indexOf(n);
        if (i < 0 || !cv) return;
        cv.daub(i, !instant);
        if (!instant && speed < 4) audio.voice({ wave: 'square', freq: 1200, dur: 0.04, vol: 0.05 });
        for (const li of cr.lines) {
          if (done[ci].has(li)) continue;
          if (BINGO_LINES[li].every((x) => res.balls.slice(0, bi + 1).includes(cr.card[x]))) {
            done[ci].add(li);
            cv.drawLine(li);
            if (!instant) audio.voice({ wave: 'square', freq: 784 + done[ci].size * 120, dur: 0.12, vol: 0.08 });
          }
        }
      });
      if (!instant) await this.wait(90 * k);
    }
    this.spin = 1;
    res.cards.forEach((cr, ci) => {
      const cv = this.cards[ci];
      if (!cv) return;
      const L = cr.lines.length;
      cv.result.text = L ? `${L === 8 ? '¡LLENO!' : `${L} ${L === 1 ? 'LÍNEA' : 'LÍNEAS'}`} · +${fmt(cr.win)}` : 'NADA';
      cv.result.style.fill = L ? CP.yellow : 0x9a8aa6;
      if (L && !instant) gsap.fromTo(cv.scale, { x: 1.06, y: 1.06 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
    });
    if (!instant) await this.wait(300 * k);
  }

  protected override updatePlay() {
    const n = this.n;
    const ok = this.playing || canPay(this.cur, this.stake * n);
    this.playBtn.disabled = !ok || this.playing;
    this.playBtn.setText('¡BINGO!', n > 1 ? `${n} × ${fmt(this.stake)} = ${this.curName(this.stake * n)}` : this.curName(this.stake));
  }
}
