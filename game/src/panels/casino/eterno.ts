/**
 * MODO ETERNO — presentation + runner (rules live in state/sys/casino/eterno.ts).
 *
 *   openEternoConfirm()  the deliberate confirmation: what's at risk (current amounts), what can be won, the two
 *                        phases; the button must be held down ~1.6 s.
 *   EternoRun.run()      0–20 s  CALENTANDO: normal paid rounds on the current table, top speed at 15 s, the
 *                                 machine overheats; ENFRIAR stops it (no 50/50, no reward).
 *                        20–40 s SIN FRENOS · LA SUERTE ETERNA: no stopping; every round is a WIN that goes into
 *                                 the BOTÍN, and the botín DOUBLES every 4 s (×2 ×4 ×8 ×16) with a big slam.
 *                        40 s    resolveEterno() is applied and SAVED first; then the explosion, the coin and the
 *                                 win (every balance ×2 + botín + cat) or loss (all to 0) sequence.
 * Respects settings.reduceMotion (no vibration, light shake, few particles) and reduceFlashes.
 * Every tween / ticker / timer it creates is killed in cleanup(); the layers it adds are destroyed.
 */
import { Container, Graphics, Rectangle, Sprite, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { audio, sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { fmt } from '../../core/format';
import { G } from '../../state/game';
import { Modal } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { screenRect } from '../../ui/screen';
import { glowTexture, sparkTexture } from '../../art/textures';
import { Particles } from '../../fx/particles';
import { flash, floatText, onomatopoeia, sparkles } from '../../fx/juice';
import { AT_RISK, AT_RISK_NAME, ETERNO, EternoField, EternoRecord, addLuck, atRisk, doublePot, eternoRoll, eternoState, lockEterno, luckyMult, resolveEterno, startEterno, stopEterno } from '../../state/sys/casino/eterno';
import type { Granted } from '../../state/sys/casino';
import type { AutoHost } from './auto';
import { gapFor } from './auto';
import type { CasinoCtx } from './ctx';
import type { Ev } from './lines';
import { CP, CButton, ChatFeed, Marquee, curIcon, heading, label, neon } from './kit';
import { coinFountain, coinRain, stamp } from './fx';
import { revealCats } from './prizes';
import { csfx } from './sfx';

const AREA = { x: 336, y: 96, w: 1100, h: 984 };
const HUD = { x: 1446, y: 676, w: 440, h: 360 };

// ------------------------------------------------------------------ confirmation
export function openEternoConfirm(onConfirm: () => void) {
  const m = new Modal('Modo ETERNO', 1240, 940, { subtitle: `${ETERNO.seconds} SEGUNDOS · 50/50 · LÉELO TODO`, band: 0x2a0a0a });
  const b = m.body;
  const T = (s: string, size = 22, fill: number = C.ink, extra: Record<string, unknown> = {}) =>
    txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, wordWrap: true, wordWrapWidth: 1170, lineHeight: size + 7, ...extra });
  let y = 0;
  const add = (t: Container, gap = 12) => {
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + gap;
  };
  add(T(`0–${ETERNO.lockAt} s · CALENTANDO: la máquina juega sola, cada vez más rápido (a tope en ${ETERNO.rampSeconds} s). Cada tirada se paga y se cobra como siempre. Aquí todavía la puedes ENFRIAR.`, 21));
  add(T(`${ETERNO.lockAt}–${ETERNO.seconds} s · SIN FRENOS: ya no se puede parar. LA SUERTE ETERNA: TODAS las tiradas ganan (gratis) y van a tu BOTÍN, que se DUPLICA cada ${ETERNO.doubleEvery} s (×2, ×4, ×8, ×16…).`, 21, 0x9a3a00));
  add(T(`A los ${ETERNO.seconds} s EXPLOTA: volado 50/50 honesto (azar criptográfico; nadie lo mueve, ni la casa).`, 21, C.inkBlue));
  // win box
  const win = new Container();
  const wb = new Graphics();
  const wt = T(
    `SI GANAS: TODO lo tuyo se multiplica ×${ETERNO.winMultiplier} (oro, gemas, pescaditos, boletos y fichas), te llevas el BOTÍN entero y 1 gato especial: legendario (${Math.round(ETERNO.reward.legendary * 100)}%), legendario HOLO (${Math.round(ETERNO.reward.holo * 100)}%) o MÍTICO (${Math.round(ETERNO.reward.mythic * 100)}%; si aún no puedes tener uno, legendario HOLO).`,
    22,
    C.ink,
    { wordWrapWidth: 1130 },
  );
  wt.position.set(18, 12);
  wb.rect(0, 0, 1170, wt.height + 24).fill(0xffe9a8).stroke({ width: 4, color: C.ink, alignment: 1 });
  win.addChild(wb, wt);
  add(win, 14);
  // risk box: exact fields + current amounts
  const r = atRisk();
  const risk = new Container();
  const rb = new Graphics();
  const rt = T('SI PIERDES, te quedas en 0 de esto (y el botín se va):', 24, CP.paper, { wordWrapWidth: 1130 });
  rt.position.set(18, 12);
  risk.addChild(rb, rt);
  let ry = 12 + rt.height + 10;
  AT_RISK.forEach((k, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cell = new Container();
    const ic = curIcon(k === 'food' ? 'food' : k, 30);
    ic.position.set(18, 18);
    const nt = txt(`${AT_RISK_NAME[k]}: ${fmt(r[k])}`, { fontFamily: F.poster, fontSize: 30, fill: CP.paper });
    nt.position.set(42, 0);
    cell.addChild(ic, nt);
    cell.position.set(18 + col * 380, ry + row * 46);
    risk.addChild(cell);
  });
  ry += 2 * 46 + 6;
  const safe = T('Tus gatos, barcos, hábitats y progreso NO se tocan (ni niveles, estrellas, orbes, cristales, prisma, chatarra, planos ni historia).', 20, 0xffd0c8, { wordWrapWidth: 1130 });
  safe.position.set(18, ry);
  ry += safe.height + 14;
  rb.rect(0, 0, 1170, ry).fill(0x8a1010).stroke({ width: 4, color: C.ink, alignment: 1 });
  add(risk, 14);
  add(T(`¿Te arrepientes? ENFRÍALA antes de los ${ETERNO.lockAt} s: no hay 50/50 ni premio. Después ya no hay salida: si cierras el juego, el volado se tira cuando vuelvas al casino.`, 19, C.inkBlue), 18);
  // hold to confirm
  const hold = new Container();
  const W0 = 560;
  const H0 = 84;
  const sh = new Graphics().rect(8, 8, W0, H0).fill(C.ink);
  const face = new Graphics().rect(0, 0, W0, H0).fill(0xff3b1f).stroke({ width: 4, color: C.ink, alignment: 1 });
  const fill = new Graphics().rect(0, 0, W0, H0).fill(0xffc94a);
  fill.scale.x = 0;
  const cap = txt('MANTÉN PRESIONADO PARA ENCENDER', { fontFamily: F.poster, fontSize: 30, fill: CP.paper, stroke: { color: C.ink, width: 4, join: 'round' } });
  cap.anchor.set(0.5);
  cap.position.set(W0 / 2, H0 / 2);
  hold.addChild(sh, face, fill, cap);
  hold.position.set(0, y);
  hold.eventMode = 'static';
  hold.cursor = 'pointer';
  const prog = { v: 0 };
  let tw: gsap.core.Tween | null = null;
  let fired = false;
  const draw = () => {
    if (!fill.destroyed) fill.scale.x = prog.v;
  };
  const press = () => {
    if (fired) return;
    tw?.kill();
    sfx('charge');
    tw = gsap.to(prog, {
      v: 1,
      duration: 1.6 * (1 - prog.v),
      ease: 'none',
      onUpdate: draw,
      onComplete: () => {
        fired = true;
        sfx('fanfare');
        m.close();
        onConfirm();
      },
    });
  };
  const release = () => {
    if (fired) return;
    tw?.kill();
    tw = gsap.to(prog, { v: 0, duration: 0.25, onUpdate: draw });
  };
  hold.on('pointerdown', press);
  hold.on('pointerup', release);
  hold.on('pointerupoutside', release);
  hold.on('pointerleave', release);
  const cancel = new CButton('MEJOR NO', () => m.close(), { w: 240, h: 84, color: C.paperDark, size: 32 });
  cancel.position.set(W0 + 40, y);
  b.addChild(hold, cancel);
  m.onClose = () => tw?.kill();
  m.listen(() => tw?.kill());
  m.open();
  return m;
}

// ------------------------------------------------------------------ the run
export interface EternoEnv {
  ctx: CasinoCtx;
  host: () => AutoHost | null;
  game: string;
  /** the table's layer (vibrates, darkens) */
  viewLayer: Container;
  /** unshaken top layer (HUD + full-screen sequences) */
  hud: Container;
  chat: ChatFeed;
  marquee: Marquee;
  bubble: (text: string, who?: string, color?: number) => void;
  say: (ev: Ev) => void;
  chatEv: (ev: Ev, n?: number) => void;
}

const STATES: [number, string, number][] = [
  [0, 'TIBIA', CP.cyan],
  [0.25, 'CALIENTE', CP.yellow],
  [0.5, 'HIRVIENDO', 0xff9a3a],
  [0.75, 'AL ROJO', 0xff3b1f],
  [0.95, '¡CRÍTICA!', 0xff1f1f],
];

export class EternoRun {
  private id = '';
  private t0 = 0;
  private stopped: 'user' | 'gone' | null = null;
  private heat = new Container();
  private heatTint = new Graphics();
  private border = new Graphics();
  private steam: Sprite[] = [];
  private sparks = new Particles();
  private hud = new Container();
  private timerT!: Text;
  private stateT!: Text;
  private tempT!: Text;
  private gauge = new Graphics();
  private statT!: Text;
  private coolBtn!: CButton;
  private rounds = 0;
  private startBal = 0;
  private lastBeep = 0;
  private lastDrone = 0;
  private lastSpark = 0;
  private saidHot = false;
  private k = 0;
  private finished = false;
  private timers: number[] = [];
  private view0 = { x: 0, y: 0 };
  private ticking = false;
  private resolveCool: (() => void) | null = null;
  private reduce = settings.reduceMotion;
  // LA SUERTE ETERNA (20–40 s)
  private locked = false;
  private potBox = new Container();
  private potT!: Text;
  private potMulT!: Text;
  private potShown = 0;
  private potCur: EternoField = 'chips';

  constructor(private env: EternoEnv) {}

  stop(why: 'user' | 'gone') {
    if (this.finished || this.stopped) return;
    if (why === 'user' && (this.locked || this.elapsed() >= ETERNO.lockAt)) {
      // SIN FRENOS: no way out any more
      sfx('error');
      return;
    }
    this.stopped = why;
    if (why === 'gone' && this.locked) {
      // the scene is going away past the lock: the session stays open (locked) and its 50/50 is drawn on return
      this.ticking = false;
      Ticker.shared.remove(this.tick, this);
      this.resolveCool?.();
      return;
    }
    if (why === 'gone') {
      // the scene is going away: record the stop now and stop touching its objects
      this.ticking = false;
      Ticker.shared.remove(this.tick, this);
      if (this.id) stopEterno(this.id, 'stop');
    }
    this.resolveCool?.();
  }

  private elapsed() {
    return this.t0 ? (performance.now() - this.t0) / 1000 : 0;
  }

  /** the speed curve: x2 → x60, top speed at ETERNO.rampSeconds (past INSTANT_SPEED near the top) */
  static speedAt(t: number) {
    const k = Math.max(0, Math.min(1, t / ETERNO.rampSeconds));
    return 2 + 58 * Math.pow(k, 2.2);
  }

  async run() {
    const { ctx } = this.env;
    const h0 = this.env.host();
    if (!h0) return;
    this.id = startEterno(this.env.game).id;
    this.startBal = h0.autoBalance();
    ctx.setBusy(true);
    this.env.say('eterno');
    this.env.chatEv('eterno', 3);
    this.build();
    this.t0 = performance.now();
    this.ticking = true;
    Ticker.shared.add(this.tick, this);
    try {
      // ---- 0–20 s: CALENTANDO (paid rounds, ENFRIAR allowed)
      while (!this.stopped && this.elapsed() < ETERNO.lockAt) {
        const h = this.env.host();
        if (!h) {
          this.stopped = 'gone';
          break;
        }
        const sp = EternoRun.speedAt(this.elapsed());
        const out = await Promise.race([h.autoStep(sp), this.until(ETERNO.lockAt * 1000 + 6000).then(() => ({ ok: true }))]);
        if (this.stopped) break;
        if (!out.ok) {
          // no balance for another round: the machine keeps overheating anyway (ENFRIAR is there until the lock)
          this.statT.text = 'SIN SALDO PARA OTRA TIRADA · LA MÁQUINA SIGUE CALENTÁNDOSE';
          await this.sleepOrStop(250);
          continue;
        }
        this.rounds++;
        await this.sleepOrStop(gapFor(sp));
      }
      // ---- 20–40 s: SIN FRENOS · LA SUERTE ETERNA
      if (!this.stopped) await this.luckyPhase();
    } catch (e) {
      console.warn('[casino] ETERNO loop', e);
    }
    if (this.stopped === 'gone' && this.locked) {
      // left past the lock: nothing is drawn here; the casino draws it on return (settleAbandoned)
      this.cleanup();
      return;
    }
    if (this.stopped) {
      stopEterno(this.id, 'stop');
      if (this.stopped === 'user') await this.coolDown();
      this.cleanup();
      return;
    }
    // ---- 20 s: the outcome is drawn, applied and SAVED before anything is shown
    ctx.freeze();
    const res = resolveEterno(this.id, eternoRoll());
    this.finished = true;
    if (!res) {
      ctx.unfreeze();
      this.cleanup();
      return;
    }
    await this.explode();
    await this.pause(res.record.r === 'win');
    if (res.record.r === 'win') await this.winSeq(res.record);
    else await this.lossSeq(res.record.lost ?? atRisk(), res.record.pot);
    ctx.unfreeze();
    this.cleanup();
  }

  // ---------------------------------------------------------------- LA SUERTE ETERNA
  private async luckyPhase() {
    const h = this.env.host();
    const st = h?.autoStake() ?? { cur: 'chips' as const, amount: 10 };
    this.potCur = st.cur;
    const stake = Math.max(1, st.amount);
    lockEterno(this.id, st.cur);
    this.locked = true;
    this.coolBtn.disabled = true;
    this.coolBtn.setText('SIN FRENOS', 'YA NO SE PUEDE ENFRIAR');
    await this.lockSlam();
    this.showPot();
    let nextDouble = ETERNO.lockAt + ETERNO.doubleEvery;
    while (!this.stopped && this.elapsed() < ETERNO.seconds) {
      const t = this.elapsed();
      if (t >= nextDouble && nextDouble < ETERNO.seconds) {
        nextDouble += ETERNO.doubleEvery;
        doublePot(this.id);
        await this.doubleSlam();
        continue;
      }
      const m = luckyMult();
      const won = this.potCur === 'gold' ? stake * m : Math.max(1, Math.round(stake * m));
      addLuck(this.id, won);
      this.rounds++;
      this.luckyFx(won, m);
      // a touch faster as the end nears
      const k = (t - ETERNO.lockAt) / (ETERNO.seconds - ETERNO.lockAt);
      await this.sleepOrStop(1000 / (ETERNO.luck.perSecond * (1 + k)));
    }
    if (!this.stopped) G.save();
  }

  private potAmount() {
    return eternoState().open?.pot?.amount ?? 0;
  }
  private potDoublings() {
    return eternoState().open?.pot?.doublings ?? 0;
  }

  /** "SIN FRENOS": the cool button dies, a red slam, the luck starts */
  private async lockSlam() {
    sfx('bigboom');
    flash(this.env.hud, 0xff3b1f, this.reduce ? 0.25 : 0.7, 0.35);
    this.env.ctx.shake(this.reduce ? 0.15 : 0.6);
    const cx = AREA.x + AREA.w / 2;
    const t1 = stamp(this.env.hud, cx, AREA.y + 330, '¡SIN FRENOS!', 0xff3b1f, 130, -0.06);
    const t2 = stamp(this.env.hud, cx, AREA.y + 470, 'LA SUERTE ETERNA', CP.yellow, 86, 0.04);
    this.env.bubble('Ya no se puede parar. Ahora TODO gana… y se duplica. Ojalá la moneda te quiera.', 'MODO ETERNO', CP.yellow);
    this.env.chatEv('eternoHot', 4);
    await this.wait(1100);
    gsap.to([t1, t2], { alpha: 0, duration: 0.3, onComplete: () => [t1, t2].forEach((t) => !t.destroyed && t.destroy()) });
  }

  /** the botín banner over the table */
  private showPot() {
    const b = this.potBox;
    b.position.set(AREA.x + AREA.w / 2, AREA.y + 70);
    const W0 = 720;
    const bg = new Graphics().roundRect(-W0 / 2 + 8, 8, W0, 150, 14).fill(CP.ink).roundRect(-W0 / 2, 0, W0, 150, 14).fill(0x2a1a00).stroke({ width: 5, color: CP.yellow });
    const lbl = label('BOTÍN ETERNO · TODO GANA', 18, CP.yellow, { letterSpacing: 3 });
    lbl.anchor.set(0.5, 0);
    lbl.position.set(0, 10);
    const ic = curIcon(this.potCur, 54);
    ic.position.set(-W0 / 2 + 60, 92);
    this.potT = txt('0', { fontFamily: F.poster, fontSize: 84, fill: CP.yellow, stroke: { color: CP.ink, width: 8, join: 'round' } });
    this.potT.anchor.set(0.5, 0.5);
    this.potT.position.set(10, 92);
    this.potMulT = neon('x1', 54, 0xff3b1f);
    this.potMulT.anchor.set(1, 0.5);
    this.potMulT.position.set(W0 / 2 - 22, 92);
    b.addChild(bg, lbl, ic, this.potT, this.potMulT);
    this.env.hud.addChild(b);
    gsap.from(b, { y: b.y - 220, duration: 0.45, ease: 'back.out(1.7)' });
  }
  private drawPot() {
    if (!this.potT || this.potT.destroyed) return;
    this.potT.text = fmt(this.potShown);
    const maxW = 470;
    this.potT.scale.set(this.potT.width / this.potT.scale.x > maxW ? maxW / (this.potT.width / this.potT.scale.x) : 1);
  }

  /** one lucky round: coins out of the table, a floating +X, the botín counts up */
  private luckyFx(won: number, mult: number) {
    const cx = AREA.x + 160 + Math.random() * (AREA.w - 320);
    const cy = AREA.y + 380 + Math.random() * 380;
    const jackpot = mult >= ETERNO.luck.jackpotMult[0];
    floatText(this.env.hud, cx, cy, `+${fmt(won)}`, { color: jackpot ? 0xff3b1f : CP.yellow, size: jackpot ? 84 : 52, rise: 120, dur: 0.8 });
    if (!this.reduce) coinFountain(this.env.ctx.particles, cx, cy, this.potCur, jackpot ? 26 : 8, jackpot ? 1.2 : 0.8);
    if (jackpot) {
      csfx.jackpot();
      onomatopoeia(this.env.hud, cx, cy - 120, '¡JACKPOT!', { size: 110, color: 0xff3b1f });
      this.env.ctx.marquee.burst(900, 'rainbow');
    } else csfx.coin(1 + Math.random() * 0.6);
    const to = this.potAmount();
    gsap.to(this, { potShown: to, duration: 0.25, ease: 'power1.out', onUpdate: () => this.drawPot() });
    if (this.potT && !this.potT.destroyed) gsap.fromTo(this.potT.scale, { x: this.potT.scale.x * 1.08, y: this.potT.scale.y * 1.08 }, { x: this.potT.scale.x, y: this.potT.scale.y, duration: 0.18 });
  }

  /** ×2: the botín doubles with a slam, a rising chord, a coin storm */
  private async doubleSlam() {
    const n = this.potDoublings();
    const mul = 2 ** n;
    const cx = AREA.x + AREA.w / 2;
    const cy = AREA.y + AREA.h * 0.45;
    sfx('levelup');
    if (!audio.muted && audio.ctx) for (let i = 0; i < 3; i++) audio.voice({ wave: 'square', freq: 330 * 2 ** (n / 4) * [1, 1.26, 1.5][i], dur: 0.35, vol: 0.06, delay: i * 0.06 });
    flash(this.env.hud, 0xffc94a, this.reduce ? 0.2 : 0.55, 0.3);
    this.env.ctx.shake(this.reduce ? 0.12 : 0.45);
    const big = neon('x2', this.reduce ? 260 : 360, CP.yellow);
    big.anchor.set(0.5);
    big.position.set(cx, cy);
    this.env.hud.addChild(big);
    gsap.fromTo(big.scale, { x: 3, y: 3 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2)' });
    gsap.to(big, { alpha: 0, delay: 0.75, duration: 0.25, onComplete: () => !big.destroyed && big.destroy() });
    if (!this.reduce) coinRain(this.env.ctx.particles, this.potCur, 30 + n * 12, AREA.x, AREA.x + AREA.w);
    if (this.potMulT && !this.potMulT.destroyed) {
      this.potMulT.text = `x${mul}`;
      gsap.fromTo(this.potMulT.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
    }
    gsap.to(this, { potShown: this.potAmount(), duration: 0.6, ease: 'power2.out', onUpdate: () => this.drawPot() });
    this.env.chatEv('winBig', 2);
    await this.wait(700);
  }

  // ---------------------------------------------------------------- visuals
  private build() {
    const vl = this.env.viewLayer;
    this.view0 = { x: vl.x, y: vl.y };
    const parent = vl.parent!;
    parent.addChildAt(this.heat, parent.getChildIndex(vl) + 1);
    this.heatTint.rect(AREA.x, AREA.y, AREA.w, AREA.h).fill(0xff3b1f);
    this.heatTint.alpha = 0;
    this.heatTint.blendMode = 'add';
    this.heat.addChild(this.heatTint, this.border, this.sparks);
    const tex = glowTexture(64);
    for (let i = 0; i < (this.reduce ? 6 : 22); i++) {
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      s.alpha = 0;
      s.tint = 0xffffff;
      this.heat.addChild(s);
      this.steam.push(s);
    }
    // HUD over the chat column
    const hd = this.hud;
    hd.position.set(HUD.x, HUD.y);
    const bg = new Graphics().rect(8, 8, HUD.w, HUD.h).fill(CP.ink).rect(0, 0, HUD.w, HUD.h).fill(0x1a0606).stroke({ width: 4, color: 0xff3b1f, alignment: 1 });
    const title = neon('MODO ETERNO', 40, 0xff3b1f);
    title.position.set(18, 8);
    this.stateT = heading('TIBIA', 30, CP.cyan);
    this.stateT.anchor.set(1, 0);
    this.stateT.position.set(HUD.w - 18, 14);
    this.timerT = txt(ETERNO.seconds.toFixed(1), { fontFamily: F.poster, fontSize: 80, fill: CP.paper });
    this.timerT.position.set(18, 50);
    const sLbl = label('SEGUNDOS PARA REVENTAR', 14, CP.softPink, { letterSpacing: 2 });
    sLbl.position.set(20, 150);
    this.tempT = heading('20 °C', 40, CP.yellow);
    this.tempT.anchor.set(1, 0);
    this.tempT.position.set(HUD.w - 18, 96);
    this.gauge.position.set(18, 178);
    this.statT = label('', 15, CP.paper, { wordWrap: true, wordWrapWidth: HUD.w - 36 });
    this.statT.position.set(18, 212);
    this.coolBtn = new CButton('ENFRIAR Y SALIR', () => this.stop('user'), { w: HUD.w - 44, h: 70, color: CP.cyan, size: 30, sub: `SOLO ANTES DE LOS ${ETERNO.lockAt} s · SIN 50/50 · SIN PREMIO` });
    this.coolBtn.position.set(18, HUD.h - 94);
    hd.addChild(bg, title, this.stateT, this.timerT, sLbl, this.tempT, this.gauge, this.statT, this.coolBtn);
    this.env.hud.addChild(hd);
    gsap.from(hd, { y: HUD.y + 60, alpha: 0, duration: 0.3, ease: 'back.out(1.6)' });
    this.env.marquee.mode = 'chase';
  }

  private tick(tk: Ticker) {
    if (!this.ticking) return;
    const t = this.elapsed();
    const k = Math.min(1, t / ETERNO.seconds);
    this.k = k;
    const left = Math.max(0, ETERNO.seconds - t);
    this.timerT.text = left.toFixed(1);
    this.timerT.style.fill = k > 0.75 ? (Math.floor(t * 8) % 2 ? 0xff3b1f : CP.paper) : CP.paper;
    const temp = Math.round(20 + 980 * Math.pow(k, 1.6));
    this.tempT.text = `${temp} °C`;
    let st = STATES[0];
    for (const s of STATES) if (k >= s[0]) st = s;
    this.stateT.text = st[1];
    this.stateT.style.fill = st[2];
    // gauge: segmented thermometer
    const g = this.gauge.clear();
    const gw = HUD.w - 36;
    g.rect(0, 0, gw, 24).fill(0x2a1010).stroke({ width: 3, color: CP.ink });
    const segs = 20;
    const lit = Math.ceil(k * segs);
    for (let i = 0; i < segs; i++) {
      const col = i < 5 ? CP.cyan : i < 10 ? CP.yellow : i < 15 ? 0xff9a3a : 0xff3b1f;
      g.rect(3 + i * ((gw - 6) / segs), 3, (gw - 6) / segs - 2, 18).fill({ color: col, alpha: i < lit ? 1 : 0.15 });
    }
    const bal = this.env.host()?.autoBalance() ?? this.startBal;
    const d = bal - this.startBal;
    if (this.locked) this.statT.text = `SIN FRENOS · ${this.rounds} tiradas · el botín va x${2 ** this.potDoublings()} · explota en ${left.toFixed(0)} s`;
    else if (!this.statT.text.startsWith('SIN SALDO')) this.statT.text = `${this.rounds} tiradas · saldo ${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))} · velocidad x${Math.round(EternoRun.speedAt(t))} · enfriar: ${Math.max(0, ETERNO.lockAt - t).toFixed(0)} s`;
    // casing: tint, border lights, vibration
    this.heatTint.alpha = (0.06 + 0.42 * k * k) * (0.75 + 0.25 * Math.sin(t * (6 + 20 * k)));
    const b = this.border.clear();
    const on = Math.floor(t * (3 + 14 * k)) % 2 === 0;
    b.rect(AREA.x + 4, AREA.y + 4, AREA.w - 8, AREA.h - 8).stroke({ width: 10 + 10 * k, color: on ? 0xff3b1f : 0xffc94a, alpha: settings.reduceFlashes ? 0.35 : 0.25 + 0.6 * k });
    this.env.marquee.speed = 1 + 6 * k;
    const vl = this.env.viewLayer;
    if (!vl.destroyed) {
      const amp = this.reduce ? 0 : 1 + 9 * k * k;
      vl.position.set(this.view0.x + (Math.random() - 0.5) * amp, this.view0.y + (Math.random() - 0.5) * amp);
    }
    // steam (more and thicker as it heats)
    const dt = tk.deltaMS / 1000;
    for (const s of this.steam) {
      if (s.alpha <= 0.01 && Math.random() < dt * (0.4 + 3.5 * k)) {
        s.position.set(AREA.x + 120 + Math.random() * (AREA.w - 240), AREA.y + 160 + Math.random() * 500);
        s.scale.set(0.8 + Math.random() * 1.6 * (0.5 + k));
        s.alpha = 0.18 + 0.45 * k;
      }
      if (s.alpha > 0.01) {
        s.y -= dt * (60 + 140 * k);
        s.scale.x += dt * 0.8;
        s.scale.y += dt * 0.8;
        s.alpha = Math.max(0, s.alpha - dt * 0.3);
      }
    }
    // sparks after half
    const now = performance.now();
    if (k > 0.45 && now - this.lastSpark > (this.reduce ? 900 : 700 - 600 * k)) {
      this.lastSpark = now;
      this.sparks.burst(AREA.x + 150 + Math.random() * (AREA.w - 300), AREA.y + 150 + Math.random() * 600, {
        count: this.reduce ? 4 : 8 + Math.round(10 * k),
        texture: sparkTexture(),
        tint: [0xffc94a, 0xff9a3a, 0xffffff],
        speed: [250, 700],
        gravity: 1400,
        life: [0.2, 0.5],
        scale: [0.15, 0.4],
        blend: 'add',
      });
      if (Math.random() < 0.5) csfx.reelTick(2.5);
    }
    // audio: tempo + pitch rise (synthesized)
    if (!audio.muted && audio.ctx) {
      const iv = 560 - 480 * Math.pow(k, 1.2);
      if (now - this.lastBeep > iv && left > 0) {
        this.lastBeep = now;
        audio.voice({ wave: 'square', freq: 320 + 1500 * k, dur: 0.05, vol: 0.04 + 0.04 * k });
      }
      if (now - this.lastDrone > 900) {
        this.lastDrone = now;
        audio.voice({ wave: 'sawtooth', freq: 55 + 160 * k, to: 60 + 190 * k, dur: 1.0, vol: 0.05 + 0.05 * k, lp: 700 + 1600 * k });
      }
    }
    if (k > 0.55 && !this.saidHot) {
      this.saidHot = true;
      this.env.say('eternoHot');
      this.env.chatEv('eternoHot', 3);
    }
    if (t >= ETERNO.lockAt) this.coolBtn.disabled = true;
  }

  private until(ms: number) {
    return new Promise<void>((r) => this.timers.push(window.setTimeout(r, Math.max(0, ms - (performance.now() - this.t0)))));
  }
  private sleepOrStop(ms: number) {
    return new Promise<void>((r) => {
      this.resolveCool = r;
      this.timers.push(window.setTimeout(r, ms));
    });
  }
  private wait(ms: number) {
    return new Promise<void>((r) => this.timers.push(window.setTimeout(r, ms)));
  }

  /** ENFRIAR: temperature drops, a burst of steam, the casing settles */
  private async coolDown() {
    this.ticking = false;
    sfx('freeze');
    audio.voice({ wave: 'noise', freq: 1.4, to: 0.3, dur: 1.2, vol: 0.18, lp: 3000 });
    for (const s of this.steam) {
      s.position.set(AREA.x + 150 + Math.random() * (AREA.w - 300), AREA.y + 400 + Math.random() * 300);
      s.alpha = 0.5;
      s.scale.set(2 + Math.random() * 2);
      gsap.to(s, { y: s.y - 300, alpha: 0, duration: 1.4, ease: 'power1.out' });
      gsap.to(s.scale, { x: s.scale.x * 1.8, y: s.scale.y * 1.8, duration: 1.4 });
    }
    gsap.to(this.heatTint, { alpha: 0, duration: 0.8 });
    this.border.clear();
    this.stateT.text = 'ENFRIADA';
    this.stateT.style.fill = CP.cyan;
    this.timerT.style.fill = CP.cyan;
    this.coolBtn.disabled = true;
    this.env.bubble('Enfriada. Sin 50/50 y sin premio especial: te quedas con lo que ganaste tirando.', 'MODO ETERNO', CP.cyan);
    this.env.chatEv('eternoStop', 2);
    await this.wait(1500);
  }

  private async explode() {
    this.ticking = false;
    const { ctx } = this.env;
    const cx = AREA.x + AREA.w / 2;
    const cy = AREA.y + AREA.h * 0.42;
    this.timerT.text = '0.0';
    this.stateT.text = '¡BOOM!';
    sfx('bigboom');
    audio.voice({ wave: 'noise', freq: 0.6, to: 0.1, dur: 1.6, vol: 0.35, lp: 1400 });
    audio.voice({ wave: 'sine', freq: 70, to: 30, dur: 1.2, vol: 0.3 });
    flash(this.env.hud, 0xffffff, this.reduce ? 0.4 : 1, 0.6);
    ctx.shake(this.reduce ? 0.3 : 1);
    const p = new Particles();
    this.env.hud.addChild(p);
    p.burst(cx, cy, { count: this.reduce ? 24 : 110, tint: [CP.ink, 0xff3b1f, 0xffc94a, CP.paper], speed: [500, 1700], gravity: 1600, life: [0.8, 1.8], scale: [0.3, 1.3], spin: 12 });
    onomatopoeia(this.env.hud, cx, cy - 60, '¡KABOOM!', { size: 230, color: 0xff3b1f });
    const vl = this.env.viewLayer;
    if (!vl.destroyed) {
      vl.position.set(this.view0.x, this.view0.y);
      gsap.to(vl, { alpha: 0.18, duration: 0.5 });
      vl.tint = 0x777777;
    }
    gsap.to(this.heatTint, { alpha: 0.5, duration: 0.15, yoyo: true, repeat: 1 });
    for (const s of this.steam) {
      s.position.set(cx + (Math.random() - 0.5) * 600, cy + (Math.random() - 0.5) * 300);
      s.alpha = 0.6;
      s.tint = 0x555555;
      s.scale.set(3 + Math.random() * 3);
      gsap.to(s, { alpha: 0, y: s.y - 200, duration: 2.2 });
    }
    this.env.chatEv('eterno', 2);
    await this.wait(1100);
    p.destroy();
  }

  /** the dramatic pause: darkness, a heartbeat, a coin in the air that lands on the (already decided) side */
  private async pause(win: boolean) {
    const layer = new Container();
    this.env.hud.addChild(layer);
    const dark = screenRect(0x000000);
    dark.alpha = 0;
    layer.addChild(dark);
    gsap.to(dark, { alpha: 0.88, duration: 0.4 });
    for (let i = 0; i < 2; i++) {
      audio.voice({ wave: 'sine', freq: 62, to: 40, dur: 0.18, vol: 0.4, delay: 0.3 + i * 0.7 });
      audio.voice({ wave: 'sine', freq: 55, to: 35, dur: 0.2, vol: 0.32, delay: 0.5 + i * 0.7 });
    }
    const coin = new Container();
    coin.position.set(W / 2, H / 2);
    const face = new Graphics();
    const lbl = heading('', 46, CP.ink);
    lbl.anchor.set(0.5);
    coin.addChild(face, lbl);
    const drawFace = (cara: boolean) => {
      face.clear().circle(0, 0, 120).fill(cara ? 0xffc94a : 0x8c8c8c).stroke({ width: 8, color: CP.ink });
      face.circle(0, 0, 96).stroke({ width: 4, color: cara ? 0xb8862a : 0x5a5a5a });
      lbl.text = cara ? 'GANAS' : 'PIERDES';
    };
    drawFace(true);
    layer.addChild(coin);
    const q = label('50 / 50', 26, CP.paper, { letterSpacing: 6 });
    q.anchor.set(0.5);
    q.position.set(W / 2, H / 2 + 190);
    layer.addChild(q);
    // the flip: alternating faces, slowing down, landing on the result
    const flips = this.reduce ? 4 : 9;
    let side = true;
    for (let i = 0; i < flips; i++) {
      const d = 0.06 + i * 0.025;
      await new Promise<void>((r) => gsap.to(coin.scale, { x: 0.05, duration: d, ease: 'power1.in', onComplete: () => r() }));
      side = i === flips - 1 ? win : !side;
      drawFace(side);
      csfx.reelTick(side ? 1.4 : 1);
      await new Promise<void>((r) => gsap.to(coin.scale, { x: 1, duration: d, ease: 'power1.out', onComplete: () => r() }));
    }
    gsap.fromTo(coin.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
    await this.wait(650);
    gsap.to(layer, { alpha: 0, duration: 0.3, onComplete: () => layer.destroy({ children: true }) });
  }

  private async winSeq(rec: EternoRecord) {
    const { ctx } = this.env;
    const prize: Granted | null = rec.prize ?? null;
    const before = rec.before ?? atRisk();
    const after = rec.after ?? atRisk();
    const layer = new Container();
    this.env.hud.addChild(layer);
    const glow = screenRect(0x2a1a00);
    glow.alpha = 0.88;
    layer.addChild(glow);
    const rays = new Graphics();
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const a2 = a + Math.PI / 28;
      rays.poly([0, 0, Math.cos(a) * 1400, Math.sin(a) * 1400, Math.cos(a2) * 1400, Math.sin(a2) * 1400]).fill({ color: 0xffc94a, alpha: i % 2 ? 0.0 : 0.25 });
    }
    rays.position.set(W / 2, H / 2);
    layer.addChild(rays);
    if (!this.reduce) gsap.to(rays, { rotation: Math.PI, duration: 10, ease: 'none', repeat: -1 });
    flash(layer, 0xffc94a, 0.8, 0.5);
    csfx.jackpot();
    const t1 = neon('¡GANASTE EL ETERNO!', 110, 0xffc94a);
    t1.anchor.set(0.5);
    t1.position.set(W / 2, 140);
    if (t1.width > W - 120) t1.scale.set((W - 120) / t1.width);
    const t2 = heading(`TODO LO TUYO x${ETERNO.winMultiplier}${rec.pot?.amount ? ' + EL BOTÍN' : ''}${prize ? ' + UN GATO' : ''}`, 46, CP.paper);
    t2.anchor.set(0.5);
    t2.position.set(W / 2, 250);
    if (t2.width > W - 160) t2.scale.set((W - 160) / t2.width);
    layer.addChild(t1, t2);
    gsap.from(t1.scale, { x: 0, y: 0, duration: 0.5, ease: 'back.out(2)' });
    gsap.from(t2, { alpha: 0, y: t2.y + 40, duration: 0.4, delay: 0.3 });
    const p = new Particles();
    layer.addChild(p);
    coinRain(p, 'gold', this.reduce ? 20 : 80);
    sparkles(layer, W / 2, 140, 0xffc94a, 30, 500);
    this.env.say('eternoWin');
    this.env.chatEv('eternoWin', 4);
    this.restoreView();
    ctx.unfreeze();
    await this.wait(900);
    // every balance counts up from what you had to ×2 (+ the botín in its currency)
    const rows: { t: Text; k: EternoField; from: number; to: number }[] = [];
    AT_RISK.forEach((k, i) => {
      const row = new Container();
      const ic = curIcon(k === 'food' ? 'food' : k, 44);
      ic.position.set(0, 28);
      const t = txt(`${AT_RISK_NAME[k]}: ${fmt(before[k])}`, { fontFamily: F.poster, fontSize: 50, fill: CP.paper, stroke: { color: CP.ink, width: 6, join: 'round' } });
      t.position.set(40, 0);
      const extra = rec.pot && rec.pot.cur === k && rec.pot.amount ? `  x${ETERNO.winMultiplier} + BOTÍN` : `  x${ETERNO.winMultiplier}`;
      const tag = txt(extra, { fontFamily: F.poster, fontSize: 34, fill: CP.yellow });
      tag.position.set(560, 12);
      row.addChild(ic, t, tag);
      row.position.set(W / 2 - 420, 330 + i * 78);
      row.alpha = 0;
      layer.addChild(row);
      rows.push({ t, k, from: before[k], to: after[k] });
      gsap.to(row, { alpha: 1, duration: 0.2, delay: i * 0.1 });
    });
    await this.wait(700);
    for (const r of rows) {
      const o = { v: r.from };
      gsap.to(o, {
        v: r.to,
        duration: 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          if (!r.t.destroyed) r.t.text = `${AT_RISK_NAME[r.k]}: ${fmt(o.v)}`;
        },
        onComplete: () => {
          if (r.t.destroyed) return;
          r.t.style.fill = CP.yellow;
          gsap.fromTo(r.t.scale, { x: 1.15, y: 1.15 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
          if (!this.reduce) coinFountain(p, W / 2 + 200, r.t.parent!.y + 30, r.k === 'food' ? 'food' : r.k, 14, 1);
          csfx.coin(1.2);
        },
      });
      await this.wait(260);
    }
    await this.wait(1200);
    await this.tapToContinue(layer, 760);
    gsap.killTweensOf(rays);
    gsap.to(layer, { alpha: 0, duration: 0.3, onComplete: () => layer.destroy({ children: true }) });
    await this.wait(320);
    if (prize) await revealCats(this.env.hud, [{ ...prize, isNew: prize.isNew ?? true }], { only: () => true });
  }

  private async lossSeq(lost: Record<EternoField, number>, pot?: { cur: EternoField; amount: number; doublings: number }) {
    const { ctx } = this.env;
    const layer = new Container();
    this.env.hud.addChild(layer);
    const ash = screenRect(0x1a1a1a);
    ash.alpha = 0;
    layer.addChild(ash);
    gsap.to(ash, { alpha: 0.9, duration: 0.6 });
    audio.voice({ wave: 'triangle', freq: 220, to: 55, dur: 1.6, vol: 0.18 });
    const stampT = txt('TODO A CERO', { fontFamily: F.poster, fontSize: 170, fill: 0xd02020, stroke: { color: CP.ink, width: 14, join: 'round' } });
    stampT.anchor.set(0.5);
    stampT.position.set(W / 2, 250);
    stampT.rotation = -0.06;
    stampT.scale.set(2);
    stampT.alpha = 0;
    layer.addChild(stampT);
    gsap.to(stampT, { alpha: 1, duration: 0.1, delay: 0.4 });
    gsap.to(stampT.scale, { x: 1, y: 1, duration: 0.3, delay: 0.4, ease: 'back.out(2)', onComplete: () => this.env.ctx.shake(this.reduce ? 0.15 : 0.5) });
    // the five balances, ticking down one by one
    const rows: { t: Text; v: number; k: EternoField; name?: string }[] = [];
    AT_RISK.forEach((k, i) => {
      const row = new Container();
      const ic = curIcon(k === 'food' ? 'food' : k, 40);
      ic.position.set(0, 24);
      const t = txt(`${AT_RISK_NAME[k]}: ${fmt(lost[k])}`, { fontFamily: F.poster, fontSize: 44, fill: 0xbdbdbd });
      t.position.set(36, 0);
      row.addChild(ic, t);
      row.position.set(W / 2 - 260, 400 + i * 66);
      row.alpha = 0;
      layer.addChild(row);
      rows.push({ t, v: lost[k], k });
      gsap.to(row, { alpha: 1, duration: 0.2, delay: 0.9 + i * 0.12 });
    });
    if (pot?.amount) {
      const pr = new Container();
      const ic = curIcon(pot.cur === 'food' ? 'food' : pot.cur, 40);
      ic.position.set(0, 24);
      const pt = txt(`BOTÍN x${2 ** pot.doublings}: ${fmt(pot.amount)}`, { fontFamily: F.poster, fontSize: 44, fill: 0xbdbdbd });
      pt.position.set(36, 0);
      pr.addChild(ic, pt);
      pr.position.set(W / 2 - 260, 400 + AT_RISK.length * 66);
      pr.alpha = 0;
      layer.addChild(pr);
      rows.push({ t: pt, v: pot.amount, k: pot.cur, name: `BOTÍN x${2 ** pot.doublings}` });
      gsap.to(pr, { alpha: 1, duration: 0.2, delay: 0.9 + AT_RISK.length * 0.12 });
    }
    this.env.say('eternoLoss');
    this.env.chatEv('eternoLoss', 4);
    await this.wait(1500);
    ctx.unfreeze();
    for (const r of rows) {
      const o = { v: r.v };
      gsap.to(o, {
        v: 0,
        duration: 0.55,
        ease: 'power2.in',
        onUpdate: () => {
          if (!r.t.destroyed) r.t.text = `${r.name ?? AT_RISK_NAME[r.k]}: ${fmt(o.v)}`;
        },
        onComplete: () => {
          if (r.t.destroyed) return;
          r.t.style.fill = 0xd02020;
          audio.voice({ wave: 'noise', freq: 0.8, to: 0.2, dur: 0.3, vol: 0.15, lp: 1200 });
          const puff = new Sprite(glowTexture(64));
          puff.anchor.set(0.5);
          puff.tint = 0x777777;
          puff.alpha = 0.6;
          puff.position.set(r.t.parent!.x + r.t.x + r.t.width + 30, r.t.parent!.y + 26);
          layer.addChild(puff);
          gsap.to(puff, { alpha: 0, y: puff.y - 70, duration: 0.9 });
          gsap.to(puff.scale, { x: 2.5, y: 2.5, duration: 0.9 });
        },
      });
      await this.wait(240);
    }
    await this.wait(700);
    const safe = label('Tus gatos, barcos, hábitats y progreso siguen intactos. Las fichas y boletos se vuelven a ganar peleando.', 26, CP.paper, { wordWrap: true, wordWrapWidth: 1100, align: 'center' });
    safe.anchor.set(0.5, 0);
    safe.position.set(W / 2, pot?.amount ? 830 : 760);
    layer.addChild(safe);
    gsap.from(safe, { alpha: 0, duration: 0.4 });
    await this.tapToContinue(layer, pot?.amount ? 920 : 860);
    this.restoreView();
    gsap.to(layer, { alpha: 0, duration: 0.3, onComplete: () => layer.destroy({ children: true }) });
    await this.wait(320);
  }

  private tapToContinue(layer: Container, y: number) {
    return new Promise<void>((res) => {
      const b = new CButton('SEGUIR', () => done(), { w: 260, h: 74, color: CP.paper, size: 34 });
      b.position.set(W / 2 - 130, y);
      layer.addChild(b);
      layer.eventMode = 'static';
      layer.hitArea = new Rectangle(-2000, -2000, W + 4000, H + 4000);
      let fired = false;
      const done = () => {
        if (fired) return;
        fired = true;
        res();
      };
      this.timers.push(window.setTimeout(done, 15000));
    });
  }

  private restoreView() {
    const vl = this.env.viewLayer;
    if (vl.destroyed) return;
    gsap.killTweensOf(vl);
    vl.alpha = 1;
    vl.tint = 0xffffff;
    vl.position.set(this.view0.x, this.view0.y);
  }

  private cleanup() {
    this.ticking = false;
    Ticker.shared.remove(this.tick, this);
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
    this.restoreView();
    this.env.marquee.speed = 1;
    for (const s of this.steam) gsap.killTweensOf(s);
    gsap.killTweensOf(this.heatTint);
    gsap.killTweensOf(this);
    if (!this.potBox.destroyed) this.potBox.destroy({ children: true });
    if (!this.heat.destroyed) this.heat.destroy({ children: true });
    if (!this.hud.destroyed) {
      const hd = this.hud;
      gsap.to(hd, { alpha: 0, duration: 0.25, onComplete: () => hd.destroy({ children: true }) });
    }
    if (this.stopped === 'gone') return;
    this.env.ctx.setBusy(false);
    this.env.ctx.refresh();
  }
}
