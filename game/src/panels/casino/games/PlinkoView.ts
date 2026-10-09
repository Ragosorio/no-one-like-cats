/**
 * PLINKO "LA CASCADA" — a croqueta falls through 12 rows of pegs into 13 slots.
 * Honest physics-look: the path (12 fair bounces) is drawn and paid when you drop; the ball then bounces peg to
 * peg along EXACTLY that path (arcs with gravity, squash on impact, the peg lights and rings). Several balls can be
 * in the air at once (input never waits); each payout reaches the pill when its ball lands.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { fmt } from '../../../core/format';
import { settings } from '../../../core/settings';
import { INSTANT_SPEED, canPay } from '../../../state/sys/casino';
import { PLINKO_MATH, PLINKO_ROWS, PLINKO_TABLES, PLINKO_TIER_BLURB, PLINKO_TIER_NAME, PlinkoResult, PlinkoTier, plinkoDrop, plinkoProb } from '../../../state/sys/casino/plinko';
import { audio } from '../../../core/audio';
import type { AutoOutcome } from '../auto';
import type { CasinoCtx } from '../ctx';
import { CP, heading, label } from '../kit';
import { BOARD, MiniGame } from './base';
import { OddsSpec, oneIn, pct } from './odds';

const S = 62; // horizontal peg spacing
const V = 44; // row spacing
const TOP = 280; // y of row 0
const PEG_R = 7;
const BALL_R = 15;
const CX = BOARD.cx;
const SLOT_Y = TOP + PLINKO_ROWS * V - 6;
const MAX_BALLS = 10;

const slotColor = (m: number) => (m >= 20 ? 0xff3b1f : m >= 5 ? 0xff6a1a : m >= 1.5 ? CP.yellow : m >= 1 ? CP.green : 0x6a5a78);

export class PlinkoView extends MiniGame {
  private pegs: Graphics[][] = [];
  private slots: { c: Container; bg: Graphics; t: Text }[] = [];
  private balls = 0;
  private hint!: Text;

  constructor(ctx: CasinoCtx) {
    super(ctx, {
      id: 'plinko',
      title: 'PLINKO',
      kicker: 'LA CASCADA · 12 CLAVOS, 12 VOLADOS',
      color: CP.cyan,
      tiers: { names: PLINKO_TIER_NAME.map((n) => `RIESGO ${n}`), blurbs: PLINKO_TIER_BLURB },
      playLabel: '¡SUELTA!',
    });
    this.buildBoard();
    this.refresh(true);
  }

  maxMult() {
    return PLINKO_MATH[this.tier].max;
  }
  infoText() {
    const m = PLINKO_MATH[this.tier];
    return `RETORNO ${(m.rtp * 100).toFixed(1)}% · MÁX. x${m.max} · TE REGRESA x1 O MÁS EN ${Math.round(m.back * 100)}% · ${PLINKO_TIER_BLURB[this.tier]}`;
  }
  protected override onTier() {
    this.drawSlots();
  }

  private pegPos(r: number, k: number) {
    return { x: CX + (k - r / 2) * S, y: TOP + r * V };
  }

  private buildBoard() {
    const b = this.board;
    // cabinet
    const cab = new Graphics();
    const w = 14 * S + 40;
    const ch = SLOT_Y + 78 - (TOP - 70);
    cab.roundRect(CX - w / 2 + 10, TOP - 70 + 10, w, ch, 22).fill(CP.ink);
    cab.roundRect(CX - w / 2, TOP - 70, w, ch, 22).fill(0x16323a).stroke({ width: 5, color: CP.ink });
    // funnel
    cab.poly([CX - 70, TOP - 70, CX + 70, TOP - 70, CX + 22, TOP - 30, CX - 22, TOP - 30]).fill(CP.cyan).stroke({ width: 3, color: CP.ink });
    b.addChild(cab);
    for (let r = 0; r < PLINKO_ROWS; r++) {
      const row: Graphics[] = [];
      for (let k = -1; k <= r + 1; k++) {
        const p = this.pegPos(r, k);
        const g = new Graphics().circle(0, 0, PEG_R).fill(CP.paper).stroke({ width: 2, color: CP.ink });
        g.position.set(p.x, p.y);
        b.addChild(g);
        row.push(g);
      }
      this.pegs.push(row);
    }
    for (let k = 0; k <= PLINKO_ROWS; k++) {
      const c = new Container();
      const bg = new Graphics();
      const t = heading('', 21, CP.ink);
      t.anchor.set(0.5);
      t.position.set(0, 26);
      c.addChild(bg, t);
      c.position.set(CX + (k - PLINKO_ROWS / 2) * S, SLOT_Y + 12);
      b.addChild(c);
      this.slots.push({ c, bg, t });
    }
    this.drawSlots();
    // idle: the board twinkles now and then (one peg at a time, no allocations)
    let idleT = 0;
    this.onTick((tk) => {
      idleT += tk.deltaMS;
      if (idleT < 450 || this.balls > 0) return;
      idleT = 0;
      const r = Math.floor(Math.random() * PLINKO_ROWS);
      const row = this.pegs[r];
      const g = row?.[Math.floor(Math.random() * row.length)];
      if (!g || g.destroyed) return;
      g.tint = CP.yellow;
      gsap.fromTo(g.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.5, onComplete: () => !g.destroyed && (g.tint = 0xffffff) });
    });
    this.hint = label('Toca ¡SUELTA! varias veces:\ncaen varias croquetas a la vez.', 15, CP.softPink, { align: 'right' });
    this.hint.anchor.set(1, 0);
    this.hint.position.set(1420, 150);
    b.addChild(this.hint);
  }

  private drawSlots() {
    const t = PLINKO_TABLES[this.tier];
    this.slots.forEach((s, k) => {
      const m = t[k];
      s.bg.clear().roundRect(-S / 2 + 3, 0, S - 6, 52, 6).fill(slotColor(m)).stroke({ width: 3, color: CP.ink });
      s.t.text = `x${m}`;
      s.t.style.fill = m >= 5 ? CP.paper : CP.ink;
      s.t.scale.set(1);
      if (s.t.width > S - 10) s.t.scale.set((S - 10) / s.t.width);
    });
  }

  odds(): OddsSpec {
    const rows: string[][] = [];
    for (let k = 0; k <= PLINKO_ROWS; k++) rows.push([`CASILLA ${k + 1}`, pct(plinkoProb(k)), oneIn(plinkoProb(k)), ...PLINKO_TABLES.map((t) => `x${t[k]}`)]);
    return {
      title: 'Plinko: probabilidades',
      cols: [
        { t: 'CASILLA (IZQ. → DER.)', x: 0 },
        { t: 'PROBABILIDAD', x: 300 },
        { t: 'O SEA', x: 480 },
        { t: 'RIESGO BAJO', x: 680 },
        { t: 'RIESGO MEDIO', x: 900 },
        { t: 'RIESGO ALTO', x: 1120 },
      ],
      rows,
      summary: [`RETORNO: BAJO ${(PLINKO_MATH[0].rtp * 100).toFixed(2)}% · MEDIO ${(PLINKO_MATH[1].rtp * 100).toFixed(2)}% · ALTO ${(PLINKO_MATH[2].rtp * 100).toFixed(2)}%`],
      notes: [
        'Cada clavo es un volado justo (azar criptográfico): izquierda o derecha al 50%. La casilla final = cuántas veces rebotó a la derecha, así que la probabilidad es exactamente C(12, k) / 4096.',
        'El camino se sortea y se paga al soltar la croqueta; la animación rebota clavo por clavo por ESE camino. No hay imanes ni rebotes trucados.',
        'Pagas la apuesta por cada croqueta. Lo que dice la casilla es lo que se multiplica tu apuesta (redondeado hacia abajo a moneda entera). En oro, la apuesta máxima depende de tu producción.',
      ],
    };
  }

  play() {
    if (this.manualBlocked()) return;
    void this.drop(1, false);
  }
  autoStep(speed: number): Promise<AutoOutcome> {
    return this.drop(speed, true);
  }

  private async drop(speed: number, auto: boolean): Promise<AutoOutcome> {
    const stake = this.stake;
    if (!canPay(this.cur, stake)) {
      if (!auto) this.poor();
      return { ok: false };
    }
    if (!auto && this.balls >= MAX_BALLS) return { ok: true };
    const res = plinkoDrop(this.cur, this.tier as PlinkoTier, stake);
    if (!res) return { ok: false };
    // hide the payout until the ball lands
    const release = res.payout > 0 ? this.ctx.hold({ [this.pill()]: res.payout }) : () => {};
    this.refresh();
    if (!auto) {
      this.ctx.say('plinko', 0.25);
      if (Math.random() < 0.3) this.ctx.chat('plinko', 1);
    }
    this.balls++;
    try {
      await this.animate(res, speed);
    } catch (e) {
      console.warn('[plinko]', e);
    }
    this.balls--;
    if (this.disposed) {
      release();
      return { ok: true };
    }
    const s = this.slots[res.slot];
    const at = { x: s.c.x, y: s.c.y - 10 };
    gsap.fromTo(s.c.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
    void this.celebrate(res.payout, res.stake, at, speed, { quiet: auto });
    release(); // celebrate() took over the hold until its coins land
    this.candy(res.candy, at, speed);
    this.refresh();
    return this.outcome(res.stake, res.payout);
  }

  private async animate(res: PlinkoResult, speed: number) {
    if (speed >= INSTANT_SPEED) return;
    const ball = new Graphics();
    ball.circle(0, 0, BALL_R).fill(0xc8823a).stroke({ width: 3, color: CP.ink });
    ball.circle(-5, -5, 4).fill({ color: 0xffffff, alpha: 0.6 });
    ball.circle(4, 3, 2).fill(0x8a5426).circle(-3, 6, 2).fill(0x8a5426);
    const startX = CX + (Math.random() - 0.5) * 16;
    ball.position.set(startX, TOP - 80);
    this.board.addChild(ball);
    const k = 1 / speed;
    const quiet = speed >= 4;
    // fall onto the first peg
    let rights = 0;
    let p = this.pegPos(0, 0);
    await this.tween(ball, { x: p.x, y: p.y - PEG_R - BALL_R, duration: 0.3 * k, ease: 'power2.in' });
    for (let r = 0; r < PLINKO_ROWS; r++) {
      if (this.disposed || ball.destroyed) return;
      this.hitPeg(r, rights, quiet);
      if (!settings.reduceMotion) gsap.fromTo(ball.scale, { x: 1.25, y: 0.75 }, { x: 1, y: 1, duration: 0.12 * k });
      rights += res.path[r];
      const last = r === PLINKO_ROWS - 1;
      const to = last ? { x: CX + (rights - PLINKO_ROWS / 2) * S, y: SLOT_Y + 20 } : this.pegPos(r + 1, rights);
      const ty = last ? to.y : to.y - PEG_R - BALL_R;
      // arc: a little hop up (random, like a real bounce), then gravity
      const dur = (0.2 - r * 0.004) * k;
      const hop = 12 + Math.random() * 16;
      const x0 = ball.x;
      const y0 = ball.y;
      const o = { t: 0 };
      await this.tween(o, {
        t: 1,
        duration: dur,
        ease: 'none',
        onUpdate: () => {
          if (ball.destroyed) return;
          const t = o.t;
          ball.x = x0 + (to.x - x0) * t;
          ball.y = y0 + (ty - y0) * t * t - hop * 4 * t * (1 - t);
          ball.rotation += 0.25 * (res.path[r] ? 1 : -1);
        },
      });
      p = to;
    }
    if (ball.destroyed) return;
    // land in the slot
    if (!quiet || Math.random() < 0.3) audio.voice({ wave: 'triangle', freq: 180, to: 90, dur: 0.12, vol: 0.12 });
    await this.tween(ball, { alpha: 0, y: ball.y + 18, duration: 0.18 * k });
    ball.destroy();
  }

  private hitPeg(r: number, k: number, quiet: boolean) {
    const g = this.pegs[r]?.[k + 1];
    if (!g || g.destroyed) return;
    g.tint = CP.cyan;
    gsap.killTweensOf(g.scale);
    gsap.fromTo(g.scale, { x: 1.7, y: 1.7 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)', onComplete: () => !g.destroyed && (g.tint = 0xffffff) });
    if (!quiet || r % 3 === 0) audio.voice({ wave: 'sine', freq: 600 + r * 70 + Math.random() * 40, dur: 0.06, vol: quiet ? 0.03 : 0.06 });
  }

  protected override updatePlay() {
    super.updatePlay();
    this.playBtn.setText('¡SUELTA!', `${fmt(this.stake)} ${this.cur === 'chips' ? 'FICHAS' : 'ORO'} POR CROQUETA`);
  }
}
