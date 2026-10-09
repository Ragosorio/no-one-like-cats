/**
 * RASCA Y GANA "MICHI DE LA SUERTE" (rules: state/sys/casino/scratch.ts).
 * Drag over the foil to scratch it (a brush is painted into a mask texture; each cell pops fully open once you've
 * scratched ~half of it). Three equal symbols = that prize. The ticket was printed (and paid) when you bought it:
 * scratching only uncovers it. RASCAR TODO / auto-play sweep the whole ticket.
 */
import { Container, FederatedPointerEvent, Graphics, Rectangle, RenderTexture, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import { game } from '../../../core/App';
import { audio } from '../../../core/audio';
import { INSTANT_SPEED, SYM_NAME, Sym, canPay } from '../../../state/sys/casino';
import { SCRATCH_MATH, SCRATCH_PRIZES, ScratchCard, scratchBuy } from '../../../state/sys/casino/scratch';
import type { AutoOutcome } from '../auto';
import type { CasinoCtx } from '../ctx';
import { CP, heading, label, paw, symbolSprite } from '../kit';
import { MiniGame } from './base';
import { OddsSpec, oneIn, pct } from './odds';

const GX = 452;
const GY = 300;
const CS = 170;
const GAP = 10;
const GW = CS * 3 + GAP * 2;
const GRID = 10; // coverage samples per cell side
const BRUSH = 30;

export class ScratchView extends MiniGame {
  private rt: RenderTexture;
  private maskSprite: Sprite;
  private content = new Container();
  private brush = new Graphics();
  private cover = new Container();
  private card: ScratchCard | null = null;
  private seen: boolean[][] = [];
  private open: boolean[] = [];
  private scratching = false;
  private last: { x: number; y: number } | null = null;
  private release: (() => void) | null = null;
  private result!: Text;
  private lastNoise = 0;
  private done = true;

  constructor(ctx: CasinoCtx) {
    super(ctx, { id: 'scratch', title: 'RASCA Y GANA', kicker: 'MICHI DE LA SUERTE · 3 IGUALES = PREMIO · RASCA CON EL DEDO', color: CP.softPink, playLabel: 'COMPRAR' });
    this.rt = RenderTexture.create({ width: GW, height: GW, resolution: 1 });
    this.maskSprite = new Sprite(this.rt);
    this.buildBoard();
    this.refresh(true);
  }

  maxMult() {
    return SCRATCH_MATH.max;
  }
  infoText() {
    return `RETORNO ${(SCRATCH_MATH.rtp * 100).toFixed(1)}% · PREMIO (x1 O MÁS) EN ${(SCRATCH_MATH.hit * 100).toFixed(1)}% DE LOS BOLETOS · GATO NEGRO x${SCRATCH_MATH.max}`;
  }
  protected override locked() {
    return this.playing;
  }

  private buildBoard() {
    const b = this.board;
    // the ticket
    const t = new Graphics();
    t.rect(GX - 40 + 10, 212 + 10, GW + 80, 660).fill(CP.ink);
    t.rect(GX - 40, 212, GW + 80, 660).fill(CP.paper).stroke({ width: 5, color: CP.ink, alignment: 1 });
    t.rect(GX - 40, 212, GW + 80, 70).fill(CP.softPink).stroke({ width: 5, color: CP.ink, alignment: 1 });
    for (let i = 0; i < 14; i++) t.circle(GX - 40 + 20 + i * ((GW + 40) / 13), 872, 6).fill(CP.night);
    b.addChild(t);
    const h = heading('MICHI DE LA SUERTE', 46, CP.ink);
    h.anchor.set(0.5, 0);
    h.position.set(GX + GW / 2, 218);
    b.addChild(h);
    const foot = label('3 iguales = premio · solo un premio por boleto · ya viene impreso', 15, CP.ink);
    foot.anchor.set(0.5, 0);
    foot.position.set(GX + GW / 2, 830);
    b.addChild(foot);
    // foil under the content (the content is revealed where the mask was painted)
    for (let i = 0; i < 9; i++) {
      const x = GX + (i % 3) * (CS + GAP);
      const y = GY + Math.floor(i / 3) * (CS + GAP);
      const f = new Graphics();
      f.rect(x, y, CS, CS).fill(0xb9b2c4).stroke({ width: 3, color: CP.ink });
      for (let k = -CS; k < CS; k += 16) f.moveTo(x + Math.max(0, k), y + Math.max(0, -k)).lineTo(x + Math.min(CS, k + CS), y + Math.min(CS, CS - k)).stroke({ width: 3, color: 0xd8d2e2, alpha: 0.7 });
      paw(f, x + CS / 2, y + CS / 2, 30, 0x9a92a8);
      this.cover.addChild(f);
    }
    b.addChild(this.cover);
    this.content.position.set(GX, GY);
    this.maskSprite.position.set(GX, GY);
    b.addChild(this.content, this.maskSprite);
    this.content.mask = this.maskSprite;
    this.brush.circle(0, 0, BRUSH).fill(0xffffff);
    // input
    const hit = new Container();
    hit.hitArea = new Rectangle(GX, GY, GW, GW);
    hit.eventMode = 'static';
    hit.cursor = 'crosshair';
    hit.on('pointerdown', (e: FederatedPointerEvent) => {
      if (this.done || this.manualBlocked()) return;
      this.scratching = true;
      this.last = null;
      this.scratchAt(e);
    });
    hit.on('globalpointermove', (e: FederatedPointerEvent) => this.scratching && this.scratchAt(e));
    const end = () => {
      this.scratching = false;
      this.last = null;
    };
    hit.on('pointerup', end);
    hit.on('pointerupoutside', end);
    b.addChild(hit);
    // prize table on the right
    const px = 1090;
    const pg = new Graphics().rect(px + 6, 212 + 6, 320, 470).fill(CP.ink).rect(px, 212, 320, 470).fill(0x2a1631).stroke({ width: 4, color: CP.softPink });
    b.addChild(pg);
    const ph = label('3 IGUALES PAGAN', 15, CP.yellow, { letterSpacing: 3 });
    ph.position.set(px + 18, 226);
    b.addChild(ph);
    SCRATCH_PRIZES.forEach((p, i) => {
      const y = 262 + i * 76;
      for (let k = 0; k < 3; k++) {
        const s = symbolSprite(p.sym, 50);
        s.position.set(px + 40 + k * 46, y + 30);
        b.addChild(s);
      }
      const m = heading(`x${p.mult}`, 40, p.mult >= 20 ? CP.yellow : CP.paper);
      m.position.set(px + 190, y + 4);
      const o = label(oneIn(p.p), 13, CP.softPink);
      o.position.set(px + 192, y + 50);
      b.addChild(m, o);
    });
    this.result = heading('', 40, CP.yellow, { wordWrap: true, wordWrapWidth: 320, align: 'center' });
    this.result.anchor.set(0.5, 0);
    this.result.position.set(px + 160, 700);
    b.addChild(this.result);
    this.printBlank();
  }

  private clearMask() {
    game.pixi.renderer.render({ container: new Container(), target: this.rt, clear: true });
  }
  private paint(x: number, y: number, full = false) {
    if (full) {
      const g = new Graphics().rect(x, y, CS, CS).fill(0xffffff);
      game.pixi.renderer.render({ container: g, target: this.rt, clear: false });
      g.destroy();
      return;
    }
    this.brush.position.set(x, y);
    game.pixi.renderer.render({ container: this.brush, target: this.rt, clear: false });
  }

  private printBlank() {
    this.content.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.clearMask();
    this.result.text = 'Compra un boleto y ráscalo.';
    this.result.style.fill = CP.paper;
  }
  private print(card: ScratchCard) {
    this.content.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.clearMask();
    card.cells.forEach((sym: Sym, i) => {
      const x = (i % 3) * (CS + GAP);
      const y = Math.floor(i / 3) * (CS + GAP);
      const bg = new Graphics().rect(x, y, CS, CS).fill(card.win === sym ? 0xfff1c2 : 0xf5ead6).stroke({ width: 3, color: CP.ink });
      const s = symbolSprite(sym, 128);
      s.position.set(x + CS / 2, y + CS / 2);
      this.content.addChild(bg, s);
    });
    this.seen = Array.from({ length: 9 }, () => new Array(GRID * GRID).fill(false));
    this.open = new Array(9).fill(false);
    this.done = false;
    this.result.text = 'RASCA';
    this.result.style.fill = CP.paper;
  }

  private scratchAt(e: FederatedPointerEvent) {
    const p = this.board.toLocal(e.global);
    const x = p.x - GX;
    const y = p.y - GY;
    const from = this.last ?? { x, y };
    const d = Math.hypot(x - from.x, y - from.y);
    const steps = Math.max(1, Math.ceil(d / (BRUSH * 0.5)));
    for (let i = 1; i <= steps; i++) this.stroke(from.x + ((x - from.x) * i) / steps, from.y + ((y - from.y) * i) / steps);
    this.last = { x, y };
    const now = performance.now();
    if (now - this.lastNoise > 70) {
      this.lastNoise = now;
      audio.voice({ wave: 'noise', freq: 2.2 + Math.random(), to: 1.5, dur: 0.07, vol: 0.06, hp: 2500 });
    }
  }
  /** paint + coverage bookkeeping (a cell opens completely past 55%) */
  private stroke(x: number, y: number) {
    if (x < -BRUSH || y < -BRUSH || x > GW + BRUSH || y > GW + BRUSH) return;
    this.paint(x, y);
    for (let i = 0; i < 9; i++) {
      if (this.open[i]) continue;
      const cx = (i % 3) * (CS + GAP);
      const cy = Math.floor(i / 3) * (CS + GAP);
      if (x < cx - BRUSH || x > cx + CS + BRUSH || y < cy - BRUSH || y > cy + CS + BRUSH) continue;
      const s = this.seen[i];
      let n = 0;
      for (let gy = 0; gy < GRID; gy++)
        for (let gx = 0; gx < GRID; gx++) {
          const k = gy * GRID + gx;
          if (!s[k]) {
            const sx = cx + ((gx + 0.5) / GRID) * CS;
            const sy = cy + ((gy + 0.5) / GRID) * CS;
            if ((sx - x) ** 2 + (sy - y) ** 2 <= BRUSH * BRUSH) s[k] = true;
          }
          if (s[k]) n++;
        }
      if (n >= GRID * GRID * 0.55) this.openCell(i, true);
    }
  }
  private openCell(i: number, anim: boolean) {
    if (this.open[i]) return;
    this.open[i] = true;
    this.paint((i % 3) * (CS + GAP), Math.floor(i / 3) * (CS + GAP), true);
    if (anim) audio.voice({ wave: 'triangle', freq: 880 + i * 40, dur: 0.06, vol: 0.05 });
    if (this.open.every(Boolean)) void this.finish(1);
  }

  private async finish(speed: number) {
    if (this.done || !this.card) return;
    this.done = true;
    this.scratching = false;
    const c = this.card;
    const at = { x: GX + GW / 2, y: GY + GW / 2 };
    if (c.win) {
      // ring the winning cells
      c.cells.forEach((s, i) => {
        if (s !== c.win) return;
        const x = GX + (i % 3) * (CS + GAP);
        const y = GY + Math.floor(i / 3) * (CS + GAP);
        const ring = new Graphics().rect(x + 4, y + 4, CS - 8, CS - 8).stroke({ width: 8, color: CP.yellow });
        this.fxl.addChild(ring);
        if (speed < INSTANT_SPEED) gsap.fromTo(ring, { alpha: 1 }, { alpha: 0.2, duration: 0.3, yoyo: true, repeat: 3, onComplete: () => ring.destroy() });
        else this.later(() => ring.destroy(), 400);
      });
      this.result.text = `¡3 ${SYM_NAME[c.win]}!\nx${c.mult} · +${this.curName(c.payout)}`;
      this.result.style.fill = CP.yellow;
    } else {
      this.result.text = 'NADA ESTA VEZ';
      this.result.style.fill = 0x9a8aa6;
    }
    void this.celebrate(c.payout, c.stake, at, speed, { quiet: speed > 1 });
    this.release?.();
    this.release = null;
    this.candy(c.candy, at, speed);
    this.refresh();
  }

  odds(): OddsSpec {
    const lose = 1 - SCRATCH_MATH.hit;
    return {
      title: 'Rasca y gana: probabilidades',
      cols: [
        { t: 'PREMIO IMPRESO', x: 0 },
        { t: 'PROBABILIDAD', x: 380 },
        { t: 'O SEA', x: 620 },
        { t: 'PAGA', x: 880 },
      ],
      rows: [...SCRATCH_PRIZES.map((p) => [`3 ${SYM_NAME[p.sym]}`, pct(p.p), oneIn(p.p), `x${p.mult}`]), ['SIN PREMIO', pct(lose), oneIn(lose), 'x0']],
      summary: [`RETORNO ${(SCRATCH_MATH.rtp * 100).toFixed(2)}% · PREMIO EN ${(SCRATCH_MATH.hit * 100).toFixed(1)}% (x1 = recuperas lo apostado)`],
      notes: [
        'El boleto se imprime (y se paga) al comprarlo: primero se sortea el premio con esta tabla, luego se acomodan las 9 casillas al azar para que SOLO ese símbolo salga 3 veces.',
        'Un boleto sin premio es un boleto al azar sin tercias: los pares salen solos, nunca se "acomodan" para que casi ganes. PATITA nunca paga: es relleno.',
        'Raspar solo descubre lo que ya estaba impreso. RASCAR TODO lo destapa de golpe.',
      ],
    };
  }

  play() {
    if (this.manualBlocked() || this.playing) return;
    if (!this.done) {
      void this.scratchAll(1);
      return;
    }
    void this.buy(1);
  }

  private async buy(speed: number): Promise<boolean> {
    if (!canPay(this.cur, this.stake)) {
      if (speed === 1) this.poor();
      return false;
    }
    const c = scratchBuy(this.cur, this.stake);
    if (!c) return false;
    this.release?.();
    this.release = c.payout > 0 ? this.ctx.hold({ [this.pill()]: c.payout }) : null;
    this.card = c;
    if (speed < INSTANT_SPEED) {
      // a fresh ticket slides in
      this.content.alpha = 0;
      gsap.to(this.content, { alpha: 1, duration: 0.2 / speed });
      gsap.fromTo(this.cover, { y: -30 }, { y: 0, duration: 0.25 / speed, ease: 'back.out(2)' });
      audio.voice({ wave: 'noise', freq: 2.5, to: 1, dur: 0.15, vol: 0.1, hp: 1600 });
    }
    this.print(c);
    if (speed === 1) this.ctx.say('scratch', 0.3);
    this.refresh();
    return true;
  }

  /** sweep the brush across the ticket (auto-play / RASCAR TODO) */
  private async scratchAll(speed: number) {
    if (this.done || this.playing) return;
    this.playing = true;
    this.refresh();
    if (speed < INSTANT_SPEED) {
      const rows = 7;
      const dur = Math.max(0.25, 0.9 / speed);
      const t0 = performance.now();
      for (;;) {
        if (this.disposed || this.done) break;
        const k = Math.min(1, (performance.now() - t0) / (dur * 1000));
        const row = Math.min(rows - 1, Math.floor(k * rows));
        const f = k * rows - row;
        const x = (row % 2 ? 1 - f : f) * (GW + 20) - 10;
        const y = ((row + 0.5) / rows) * GW;
        if (this.last) {
          const d = Math.hypot(x - this.last.x, y - this.last.y);
          const steps = Math.max(1, Math.ceil(d / (BRUSH * 0.6)));
          for (let i = 1; i <= steps; i++) this.stroke(this.last.x + ((x - this.last.x) * i) / steps, this.last.y + ((y - this.last.y) * i) / steps);
        }
        this.last = { x, y };
        if (speed < 4 && performance.now() - this.lastNoise > 80) {
          this.lastNoise = performance.now();
          audio.voice({ wave: 'noise', freq: 2.5, to: 1.5, dur: 0.07, vol: 0.05, hp: 2500 });
        }
        if (k >= 1) break;
        await this.wait(16);
      }
      this.last = null;
    }
    for (let i = 0; i < 9; i++) if (!this.disposed && !this.done) this.openCellQuiet(i);
    this.playing = false;
    await this.finish(speed);
  }
  private openCellQuiet(i: number) {
    if (this.open[i]) return;
    this.open[i] = true;
    this.paint((i % 3) * (CS + GAP), Math.floor(i / 3) * (CS + GAP), true);
  }

  async autoStep(speed: number): Promise<AutoOutcome> {
    if (this.playing) return { ok: true };
    if (!this.done) await this.scratchAll(speed);
    if (!(await this.buy(speed))) return { ok: false };
    await this.wait(120 / speed);
    await this.scratchAll(speed);
    const c = this.card!;
    // keep the uncovered ticket on screen for a beat, even at x10
    if (speed < INSTANT_SPEED) await this.wait(Math.max(420, 900 / speed));
    return this.outcome(c.stake, c.payout);
  }

  protected override updatePlay() {
    super.updatePlay();
    if (!this.done) {
      this.playBtn.disabled = this.playing;
      this.playBtn.setText('RASCAR TODO', 'DESTAPA EL BOLETO');
    } else this.playBtn.setText('COMPRAR', this.curName(this.stake));
  }

  override dispose() {
    this.release?.();
    this.release = null;
    super.dispose();
    this.content.mask = null;
    this.rt.destroy(true);
    this.brush.destroy();
  }
}
