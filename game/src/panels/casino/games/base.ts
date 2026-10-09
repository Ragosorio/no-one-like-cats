/**
 * MiniGame: shared chrome for the newer casino tables (plinko, dados, mayor/menor, bingo, rasca, cajas).
 *   - header (neon title + kicker), currency FICHAS / ORO, risk tier, stake (remembered per game), the big PLAY
 *     button, an honest info line (RTP · max · hit rate) and the TABLA DE PAGOS modal.
 *   - celebrate(): the short reward moment (number pop, coins flying to the pill, a sound, a host line) that never
 *     ends the session and never blocks input — the payout is already credited; the pill catches up on landing.
 *   - AutoHost glue (autoBalance / autoName); subclasses implement autoStep(speed).
 * Board area: x 350…1430, y 200…880 (logical px). Controls: y 900…1060.
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { fmt } from '../../../core/format';
import { sfx } from '../../../core/audio';
import { settings } from '../../../core/settings';
import { floatText, onomatopoeia, sparkles } from '../../../fx/juice';
import { Cur, Granted, INSTANT_SPEED, balanceOf, canPay, chips, summary } from '../../../state/sys/casino';
import { miniPrefs, miniStakes } from '../../../state/sys/casino/common';
import { G } from '../../../state/game';
import type { AutoHost, AutoOutcome } from '../auto';
import type { CasinoCtx, CasinoView } from '../ctx';
import type { Ev } from '../lines';
import { CP, CButton, Seg, block, chipIcon, clickable, curIcon, heading, label, neon, killDeep } from '../kit';
import { coinFountain, flyLoot, stamp, winBanner } from '../fx';
import { csfx } from '../sfx';
import { openMiniOdds, OddsSpec } from './odds';

export const BOARD = { x: 350, y: 200, w: 1080, h: 680, cx: 890 } as const;
const CY = 900;

export interface MiniCfg {
  id: string;
  title: string;
  kicker: string;
  color: number;
  /** risk tiers (labels + one-line blurbs); omit for single-mode games */
  tiers?: { names: readonly string[]; blurbs: readonly string[] };
  playLabel: string;
}

export abstract class MiniGame extends Container implements CasinoView, AutoHost {
  protected cur: Cur = 'chips';
  protected tier = 0;
  protected info!: Text;
  protected net!: Text;
  protected playBtn!: CButton;
  protected ctrl = new Container();
  protected board = new Container();
  protected fxl = new Container();
  /** a hand/round is being played (manual) */
  protected playing = false;
  private stakeSeg: (Seg<number> & { key?: string }) | null = null;
  private stakeBox = new Container();
  private tierSeg: Seg<number> | null = null;
  protected disposed = false;
  private tickFns: ((t: Ticker) => void)[] = [];
  private timers: number[] = [];

  constructor(
    protected ctx: CasinoCtx,
    protected cfg: MiniCfg,
  ) {
    super();
    const p = miniPrefs(cfg.id);
    this.cur = p.cur === 'gold' || p.cur === 'chips' ? p.cur : chips() >= 10 || G.s.gold < 100 ? 'chips' : 'gold';
    this.tier = cfg.tiers ? Math.max(0, Math.min(cfg.tiers.names.length - 1, Math.floor(Number(p.tier) || 0))) : 0;
    const title = neon(cfg.title, 66, cfg.color);
    title.position.set(372, 88);
    const kick = label(cfg.kicker, 15, CP.yellow, { letterSpacing: 3 });
    kick.position.set(376, 176);
    this.addChild(title, kick, this.board, this.ctrl, this.fxl);
    this.buildControls();
  }

  // ---------------------------------------------------------------- to implement
  /** biggest multiplier of the current tier (gold stake cap) */
  abstract maxMult(): number;
  /** "RETORNO 96% · MÁX x140 · …" */
  abstract infoText(): string;
  abstract odds(): OddsSpec;
  /** the PLAY button / Space */
  abstract play(): void;
  abstract autoStep(speed: number): Promise<AutoOutcome>;
  /** a multi-step hand is open (stake/currency/tier locked) */
  protected locked(): boolean {
    return this.playing;
  }

  // ---------------------------------------------------------------- stakes
  stakes(): number[] {
    return miniStakes(this.cur, this.maxMult());
  }
  get stake(): number {
    const st = this.stakes();
    const rem = miniPrefs(this.cfg.id).stake;
    if (!st.length) return 0;
    if (rem === undefined) return st[0];
    let best = st[0];
    for (const o of st) if (o <= rem + 1e-9) best = o;
    return best;
  }
  protected curName(n: number) {
    return this.cur === 'chips' ? `${fmt(n)} ${n === 1 ? 'FICHA' : 'FICHAS'}` : `${fmt(n)} ORO`;
  }
  protected pill(): 'gold' | 'chips' {
    return this.cur === 'gold' ? 'gold' : 'chips';
  }

  // ---------------------------------------------------------------- controls
  private buildControls() {
    const c = this.ctrl;
    const curSeg = new Seg<Cur>(
      [
        { v: 'chips', label: 'FICHAS', icon: chipIcon(24) },
        { v: 'gold', label: 'ORO', icon: curIcon('gold', 24) },
      ],
      this.cur,
      (v) => {
        if (this.locked()) {
          curSeg.set(this.cur);
          sfx('error');
          return;
        }
        this.cur = v;
        miniPrefs(this.cfg.id).cur = v;
        this.refresh(true);
      },
      { w: 128, h: 48, size: 22, color: CP.yellow, gap: 6 },
    );
    curSeg.position.set(372, CY);
    c.addChild(curSeg);
    if (this.cfg.tiers) {
      const t = new Seg<number>(
        this.cfg.tiers.names.map((n, i) => ({ v: i, label: n })),
        this.tier,
        (v) => {
          if (this.locked()) {
            t.set(this.tier);
            sfx('error');
            return;
          }
          this.tier = v;
          miniPrefs(this.cfg.id).tier = v;
          this.onTier();
          this.refresh(true);
        },
        { w: 122, h: 48, size: 21, color: CP.pink, gap: 6 },
      );
      t.position.set(660, CY);
      c.addChild(t);
      this.tierSeg = t;
    }
    this.stakeBox.position.set(372, CY + 62);
    c.addChild(this.stakeBox);
    this.info = label('', 16, CP.paper);
    this.info.position.set(372, CY + 124);
    this.net = label('', 16, CP.softPink);
    this.net.position.set(372, CY + 148);
    c.addChild(this.info, this.net);
    this.playBtn = new CButton(this.cfg.playLabel, () => this.play(), { w: 250, h: 104, color: this.cfg.color, size: 40, sub: '' });
    this.playBtn.position.set(1168, CY);
    const ob = new Container();
    const obBg = block(250, 40, CP.cyan, { off: 5, border: 3 });
    const obT = heading('TABLA DE PAGOS', 24, CP.ink);
    obT.anchor.set(0.5, 0);
    obT.position.set(125, 5);
    ob.addChild(obBg, obT);
    ob.position.set(1168, CY + 120);
    clickable(ob, () => openMiniOdds(this.odds()));
    c.addChild(this.playBtn, ob);
  }
  /** tier changed (rebuild the board if it depends on it) */
  protected onTier() {}

  /** full = rebuild the stake selector */
  refresh(full = false) {
    if (this.disposed) return;
    const st = this.stakes();
    const key = `${this.cur}|${st.join(',')}`;
    if (full || !this.stakeSeg || this.stakeSeg.key !== key) {
      this.stakeBox.removeChildren().forEach((x) => x.destroy({ children: true }));
      const seg = new Seg<number>(
        st.map((v) => ({ v, label: fmt(v) })),
        this.stake,
        (v) => {
          if (this.locked()) {
            seg.set(this.stake);
            sfx('error');
            return;
          }
          miniPrefs(this.cfg.id).stake = v;
          this.refresh();
        },
        { w: 128, h: 46, size: this.cur === 'gold' ? 20 : 22, color: CP.cyan, gap: 6 },
      ) as Seg<number> & { key?: string };
      seg.key = key;
      this.stakeSeg = seg;
      this.stakeBox.addChild(seg);
      const lbl = label('APUESTA', 13, CP.softPink, { letterSpacing: 3 });
      lbl.position.set(st.length * 134 + 4, 15);
      this.stakeBox.addChild(lbl);
    } else if (this.stakeSeg.value !== this.stake) this.stakeSeg.set(this.stake);
    this.info.text = this.infoText();
    const s = summary(this.cur);
    const pct = Math.round(s.pct * 100);
    this.net.text = s.bets ? `Casino en ${this.cur === 'chips' ? 'fichas' : 'oro'}: ${s.bets} jugadas · neto ${pct >= 0 ? '+' : ''}${pct}%` : '';
    this.updatePlay();
    this.ctx.refresh();
  }
  /** PLAY button caption / enabled state */
  protected updatePlay() {
    const ok = this.locked() || canPay(this.cur, this.stake);
    this.playBtn.disabled = !ok;
    this.playBtn.setText(this.cfg.playLabel, this.curName(this.stake));
  }

  primary() {
    this.play();
  }
  autoBalance() {
    return balanceOf(this.cur);
  }
  autoStake() {
    return { cur: this.cur, amount: this.stake };
  }
  autoName() {
    return `${this.cfg.title} · ${this.curName(this.stake)}`;
  }

  /** manual actions are ignored while the auto-play / ETERNO drives the table */
  protected manualBlocked() {
    return this.ctx.busy;
  }
  protected poor() {
    sfx('error');
    this.ctx.say('poor');
  }

  // ---------------------------------------------------------------- reward moment
  /**
   * The payout is already credited: hold it off the pill, pop it, fly coins, release on landing.
   * Never blocks input; returns when the coins landed (callers in auto-play may await it at high speed only briefly).
   */
  celebrate(payout: number, stake: number, at: { x: number; y: number }, speed = 1, o: { ev?: Ev; quiet?: boolean } = {}): Promise<void> {
    const kind = this.pill();
    const release = payout > 0 ? this.ctx.hold({ [kind]: payout }) : () => {};
    const mult = stake > 0 ? payout / stake : 0;
    const fast = speed >= 4;
    if (speed >= INSTANT_SPEED || payout <= 0) {
      release();
      if (payout <= 0 && !fast && !o.quiet) {
        csfx.lose();
        floatText(this.fxl, at.x, at.y, 'NADA', { color: 0x9a8aa6, size: 44, font: undefined, rise: 50, dur: 0.7 });
      }
      return Promise.resolve();
    }
    const big = mult >= 5;
    const huge = mult >= 20;
    const txtCol = mult >= 1 ? CP.yellow : 0xbfd4c8;
    floatText(this.fxl, at.x, at.y - 20, `+${fmt(payout)}`, { color: txtCol, size: big ? 78 : 56, rise: 90, dur: fast ? 0.6 : 1.0 });
    if (mult < 1) csfx.coin(0.8);
    else if (big) {
      csfx.winBig();
      csfx.coinShower(fast ? 5 : 14);
      this.ctx.marquee.burst(fast ? 600 : 1800, 'rainbow');
      this.ctx.shake(fast ? 0.12 : 0.35);
      coinFountain(this.ctx.particles, at.x, at.y, kind, fast ? 10 : 30, 1.1);
      if (!fast) {
        onomatopoeia(this.fxl, at.x, at.y - 120, huge ? '¡CHA-CHING!' : '¡PLIN-PLIN!', { size: huge ? 130 : 100, color: CP.yellow });
        this.ctx.say(huge ? 'jackpot' : 'winBig', speed > 1 ? 0.5 : 1);
        this.ctx.chat(huge ? 'jackpot' : 'winBig', 3);
      }
      // the poster slam only at x1 and never awaited (input stays free)
      if (huge && speed <= 1 && !settings.reduceMotion) void winBanner(this.ctx.top, '¡GRAN PREMIO!', `x${+mult.toFixed(2)} · +${this.curName(payout)}`, CP.yellow);
    } else {
      csfx.winSmall();
      if (!fast) sparkles(this.fxl, at.x, at.y, CP.yellow, 10, 140);
      if (!fast && !o.quiet) this.ctx.say(mult > 1 ? 'winSmall' : 'refund', speed > 1 ? 0.15 : 0.45);
    }
    return new Promise((res) => {
      flyLoot(this.ctx.fx, kind, at, this.ctx.pillPos(kind), fast ? 3 : Math.min(14, 4 + Math.round(mult * 2)), () => {
        release();
        res();
      });
      // safety: never keep the pill wrong for long
      this.later(() => {
        release();
        res();
      }, 2500);
    });
  }

  /** LA CASA TE DEBE paid on this bet: a boleto + fichas fly to the pills */
  candy(candy: Granted[], at: { x: number; y: number }, speed = 1) {
    if (!candy.length) return;
    this.ctx.refresh();
    if (speed >= INSTANT_SPEED) return;
    this.ctx.say('candy', speed > 1 ? 0.3 : 1);
    csfx.winSmall();
    const t = stamp(this.fxl, at.x, at.y - 120, 'LA CASA TE DEBÍA UNA', CP.cyan, 48, -0.06);
    flyLoot(this.ctx.fx, 'tickets', at, this.ctx.pillPos('tickets'), 3);
    gsap.to(t, { alpha: 0, delay: 1.0 / Math.max(1, speed), duration: 0.25, onComplete: () => t.destroy() });
  }

  // ---------------------------------------------------------------- lifecycle helpers
  protected onTick(fn: (t: Ticker) => void) {
    this.tickFns.push(fn);
    Ticker.shared.add(fn);
  }
  protected later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      if (!this.disposed) fn();
    }, ms);
    this.timers.push(id);
    return id;
  }
  protected wait(ms: number) {
    return new Promise<void>((r) => {
      if (ms <= 0 || this.disposed) return r();
      this.timers.push(window.setTimeout(r, ms));
    });
  }
  /** a tween as a promise (resolves immediately at INSTANT speed or when disposed) */
  protected tween(target: object, vars: gsap.TweenVars): Promise<void> {
    return new Promise((r) => {
      if (this.disposed) return r();
      gsap.to(target, { ...vars, onComplete: () => r() });
      // a killed tween never completes: don't hang
      this.timers.push(window.setTimeout(r, ((Number(vars.duration) || 0) + (Number(vars.delay) || 0)) * 1000 + 400));
    });
  }
  protected outcome(stake: number, payout: number, extra: Partial<AutoOutcome> = {}): AutoOutcome {
    return { ok: true, big: payout >= stake * 5, ...extra };
  }

  dispose() {
    this.disposed = true;
    for (const f of this.tickFns) Ticker.shared.remove(f);
    for (const t of this.timers) window.clearTimeout(t);
    this.tickFns = [];
    this.timers = [];
    killDeep(this);
  }
}

export { Graphics };
