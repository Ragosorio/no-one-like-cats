/**
 * RULETA DEL MULTIVERSO — 25 pockets (12 red, 12 black, 0 = GATO NEGRO). Every bet returns 96% on average.
 * The pocket is drawn first (state/sys/casino.spinRoulette); the ball physically lands in it (wheel-local coords).
 * Stake memory: currency, bet and the stake per currency persist in the save; switching ROJO / NEGRO, bet type or
 * currency never drops you back to the minimum (stakeFor picks the closest option <= what you chose).
 * Auto-play: implements AutoHost (x1/x2/x4 spin faster; TURBO drops the ball straight into the pocket).
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import { onomatopoeia, sparkles, flash } from '../../fx/juice';
import {
  AutoSpeed,
  Cur,
  RouletteBet,
  RouletteResult,
  WHEEL,
  betChance,
  betLabel,
  betMult,
  balanceOf,
  canPay,
  cs,
  gemBetsLeft,
  plenoTickets,
  pocketColor,
  prefs,
  rouletteStakes,
  spinRoulette,
  stakeFor,
  summary,
} from '../../state/sys/casino';
import type { AutoHost, AutoOutcome } from './auto';
import { CP, CButton, Seg, block, chipIcon, clickable, curIcon, heading, label, neon } from './kit';
import { coinFountain, flyLoot, stamp, winBanner } from './fx';
import { csfx } from './sfx';
import { openOdds } from './OddsPanel';
import { lounge } from './lounge';
import type { CasinoCtx, CasinoView } from './ctx';

const CX = 700;
const CY = 590;
const R = 312;
const N = WHEEL.length;
const SEG = (Math.PI * 2) / N;
const COL = { red: CP.red, black: 0x231a26, green: 0x1e9e5a } as const;

export class RouletteView extends Container implements CasinoView, AutoHost {
  private wheel = new Container();
  private ball = new Graphics();
  private ballAng = -Math.PI / 2;
  private ballR = R - 34;
  private cur: Cur = 'chips';
  private bet: RouletteBet = { kind: 'color', v: 'red' };
  private stakeSeg: Seg<number> | null = null;
  private stakeKey = '';
  private hist: { c: Container; g: Graphics; t: Text }[] = [];
  private board = new Container();
  private betCells: { b: RouletteBet; g: Graphics; draw: (on: boolean, hit?: boolean) => void }[] = [];
  private info!: Text;
  private stakeBox = new Container();
  private spinBtn!: CButton;
  private histBox = new Container();
  private net!: Text;
  private spinning = false;
  private lastTickSeg = 0;
  private gemNote!: Text;

  constructor(private ctx: CasinoCtx) {
    super();
    const rp = (prefs().roulette ??= {});
    if (rp.cur === 'chips' || rp.cur === 'gold' || rp.cur === 'gems') this.cur = rp.cur;
    if (rp.bet && (rp.bet.kind === 'color' || rp.bet.kind === 'third' || rp.bet.kind === 'num')) this.bet = { ...rp.bet } as RouletteBet;
    this.buildWheel();
    this.buildBoard();
    this.refresh();
  }

  // ------------------------------------------------------------------ wheel
  private buildWheel() {
    const base = new Graphics();
    base.circle(CX + 12, CY + 14, R + 46).fill(CP.ink);
    base.circle(CX, CY, R + 46).fill(0x5b2a17).stroke({ width: 6, color: CP.ink });
    base.circle(CX, CY, R + 30).fill(0x7a3a20).stroke({ width: 3, color: CP.ink });
    // studs
    for (let i = 0; i < 25; i++) {
      const a = (i / 25) * Math.PI * 2;
      base.circle(CX + Math.cos(a) * (R + 38), CY + Math.sin(a) * (R + 38), 4).fill(CP.gold);
    }
    base.circle(CX, CY, R + 6).fill(0x1a1018).stroke({ width: 4, color: CP.ink });
    this.addChild(base);
    const w = this.wheel;
    w.position.set(CX, CY);
    const g = new Graphics();
    WHEEL.forEach((n, i) => {
      const a0 = -Math.PI / 2 + i * SEG;
      const a1 = a0 + SEG;
      const col = COL[pocketColor(n)];
      g.moveTo(0, 0).arc(0, 0, R, a0, a1).closePath().fill(col).stroke({ width: 2, color: CP.gold, alpha: 0.9 });
    });
    // pocket ring
    g.circle(0, 0, R * 0.7).fill(0x2a1a14).stroke({ width: 4, color: CP.gold });
    WHEEL.forEach((_, i) => {
      const a0 = -Math.PI / 2 + i * SEG;
      g.moveTo(Math.cos(a0) * R * 0.7, Math.sin(a0) * R * 0.7).lineTo(Math.cos(a0) * R * 0.86, Math.sin(a0) * R * 0.86).stroke({ width: 3, color: CP.gold });
    });
    g.circle(0, 0, R * 0.86).stroke({ width: 3, color: CP.gold });
    w.addChild(g);
    WHEEL.forEach((n, i) => {
      const a = -Math.PI / 2 + (i + 0.5) * SEG;
      const t = txt(String(n), { fontFamily: F.poster, fontSize: 30, fill: CP.paper });
      t.anchor.set(0.5);
      t.position.set(Math.cos(a) * R * 0.93, Math.sin(a) * R * 0.93);
      t.rotation = a + Math.PI / 2;
      w.addChild(t);
      if (n === 0) {
        // tiny cat head on the green pocket
        const c = new Graphics();
        const r = 14;
        c.poly([-r, -2, -r * 0.9, -r * 1.2, -r * 0.2, -r * 0.6]).fill(CP.ink);
        c.poly([r, -2, r * 0.9, -r * 1.2, r * 0.2, -r * 0.6]).fill(CP.ink);
        c.ellipse(0, 0, r, r * 0.8).fill(CP.ink);
        c.ellipse(-5, -2, 3, 2.2).fill(CP.yellow).ellipse(5, -2, 3, 2.2).fill(CP.yellow);
        c.position.set(Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78);
        c.rotation = a + Math.PI / 2;
        w.addChild(c);
      }
    });
    // cone + paw hub
    const hub = new Graphics();
    hub.circle(0, 0, R * 0.62).fill(0x7a3a20).stroke({ width: 4, color: CP.ink });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      hub.moveTo(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2).lineTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6).stroke({ width: 10, color: CP.gold, cap: 'round' });
    }
    hub.circle(0, 0, R * 0.26).fill(CP.gold).stroke({ width: 5, color: CP.ink });
    hub.ellipse(0, 12, 26, 22).fill(CP.ink);
    for (const [dx, dy] of [
      [-26, -12],
      [-10, -30],
      [10, -30],
      [26, -12],
    ])
      hub.circle(dx, dy, 9).fill(CP.ink);
    w.addChild(hub);
    this.addChild(w);
    // pointer
    const ptr = new Graphics().poly([CX - 22, CY - R - 62, CX + 22, CY - R - 62, CX, CY - R - 18]).fill(CP.yellow).stroke({ width: 4, color: CP.ink });
    this.addChild(ptr);
    this.ball.circle(0, 0, 13).fill(0xffffff).stroke({ width: 3, color: CP.ink });
    this.ball.circle(-4, -4, 4).fill({ color: 0xffffff, alpha: 1 });
    w.addChild(this.ball);
    this.placeBall();
    // title
    const t = neon('RULETA DEL MULTIVERSO', 54, CP.cyan);
    t.anchor.set(0.5, 0);
    t.position.set(CX, 100);
    this.addChild(t);
  }

  private placeBall() {
    this.ball.position.set(Math.cos(this.ballAng) * this.ballR, Math.sin(this.ballAng) * this.ballR);
  }

  // ------------------------------------------------------------------ board
  private buildBoard() {
    const bx = 1070;
    const by = 196;
    const b = this.board;
    b.position.set(bx, by);
    const felt = new Graphics().rect(-24, -64, 370, 830).fill(CP.felt).stroke({ width: 4, color: CP.ink });
    felt.rect(-14, -54, 350, 810).stroke({ width: 2, color: CP.gold, alpha: 0.6 });
    b.addChild(felt);
    // history
    b.addChild(this.histBox);
    this.histBox.position.set(-6, -48);
    const mk = (bet: RouletteBet, x: number, y: number, w: number, h: number, col: number, text: string, sub: string) => {
      const c = new Container();
      c.position.set(x, y);
      const g = new Graphics();
      const t = txt(text, { fontFamily: F.poster, fontSize: h > 60 ? 34 : 24, fill: col === CP.yellow || col === CP.paper ? CP.ink : CP.paper });
      t.anchor.set(0.5);
      t.position.set(w / 2, sub ? h * 0.4 : h / 2);
      const s = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: CP.yellow });
      s.anchor.set(0.5);
      s.position.set(w / 2, h * 0.76);
      c.addChild(g, t, s);
      const draw = (on: boolean, hit = false) => {
        g.clear();
        if (on) g.rect(5, 5, w, h).fill(CP.pink);
        g.rect(0, 0, w, h).fill(col).stroke({ width: on ? 5 : 3, color: hit ? CP.yellow : on ? CP.pink : CP.ink, alignment: 1 });
        c.y = on ? y - 3 : y;
      };
      clickable(
        c,
        () => {
          if (this.spinning) return;
          // keep the stake you chose: switching ROJO / NEGRO used to drop you back to the minimum
          this.bet = bet;
          (prefs().roulette ??= {}).bet = { ...bet } as RouletteBet;
          this.refresh();
          if (bet.kind === 'num') this.ctx.say('betBig', 0.3);
        },
        { hover: false },
      );
      b.addChild(c);
      this.betCells.push({ b: bet, g, draw });
    };
    mk({ kind: 'color', v: 'red' }, 0, 0, 156, 84, COL.red, 'ROJO', 'PAGA x2 · 48%');
    mk({ kind: 'color', v: 'black' }, 166, 0, 156, 84, COL.black, 'NEGRO', 'PAGA x2 · 48%');
    (['1–8', '9–16', '17–24'] as const).forEach((l, i) => mk({ kind: 'third', v: i as 0 | 1 | 2 }, i * 109, 96, 101, 64, 0x3a2a40, l, 'x3 · 32%'));
    mk({ kind: 'num', v: 0 }, 0, 172, 322, 52, COL.green, 'GATO NEGRO · 0', '');
    for (let n = 1; n <= 24; n++) {
      const i = n - 1;
      const col = COL[pocketColor(n)];
      mk({ kind: 'num', v: n }, (i % 6) * 54, 234 + Math.floor(i / 6) * 54, 48, 48, col, String(n), '');
    }
    const nl = label('UN NÚMERO PAGA x24 · 4%', 14, CP.yellow, { letterSpacing: 1 });
    nl.position.set(0, 455);
    b.addChild(nl);
    // currency, stake, spin
    const cy = 488;
    const seg = new Seg<Cur>(
      [
        { v: 'chips', label: 'FICHAS', icon: chipIcon(22) },
        { v: 'gold', label: 'ORO', icon: curIcon('gold', 22) },
        { v: 'gems', label: 'GEMAS', icon: curIcon('gems', 22) },
      ],
      this.cur,
      (v) => {
        // each currency remembers its own stake; nothing resets
        this.cur = v;
        (prefs().roulette ??= {}).cur = v;
        this.refresh();
        if (v === 'gems') this.ctx.say('betVip');
      },
      { w: 100, h: 46, size: 20, gap: 8 },
    );
    seg.position.set(0, cy);
    b.addChild(seg);
    this.stakeBox.position.set(0, cy + 62);
    b.addChild(this.stakeBox);
    this.info = label('', 16, CP.paper, { wordWrap: true, wordWrapWidth: 330, lineHeight: 21 });
    this.info.position.set(0, cy + 120);
    b.addChild(this.info);
    this.spinBtn = new CButton('¡GIRAR!', () => this.spin(), { w: 322, h: 84, color: CP.yellow, size: 44, sub: '' });
    this.spinBtn.position.set(0, cy + 176);
    b.addChild(this.spinBtn);
    this.gemNote = label('', 13, CP.softPink, { wordWrap: true, wordWrapWidth: 330 });
    this.gemNote.position.set(0, cy + 268);
    b.addChild(this.gemNote);
    this.addChild(b);
    // odds + net under the wheel
    const od = new Container();
    od.addChild(block(250, 44, CP.cyan, { off: 5, border: 3 }));
    const ot = heading('PROBABILIDADES', 24, CP.ink);
    ot.position.set(20, 6);
    od.addChild(ot);
    od.position.set(380, 990);
    clickable(od, () => openOdds('roulette'));
    this.addChild(od);
    this.net = label('', 18, CP.softPink);
    this.net.anchor.set(1, 0);
    this.net.position.set(1030, 1000);
    this.addChild(this.net);
  }

  private stake(): number {
    return stakeFor(rouletteStakes(this.cur, this.bet), prefs().roulette?.stake?.[this.cur]);
  }

  private refresh() {
    for (const c of this.betCells) c.draw(sameBet(c.b, this.bet));
    const st = rouletteStakes(this.cur, this.bet);
    const stake = this.stake();
    const key = `${this.cur}|${st.join(',')}`;
    if (!this.stakeSeg || key !== this.stakeKey) {
      this.stakeBox.removeChildren().forEach((c) => c.destroy({ children: true }));
      const n = st.length;
      const w = Math.floor((322 - (n - 1) * 6) / n);
      this.stakeSeg = new Seg<number>(
        st.map((v) => ({ v, label: fmt(v) })),
        stake,
        (v) => {
          const rp = (prefs().roulette ??= {});
          (rp.stake ??= {})[this.cur] = v;
          this.refresh();
          this.ctx.say(v === st[st.length - 1] && this.cur !== 'chips' ? 'betBig' : 'betSmall', 0.4);
        },
        { w, h: 44, size: n > 3 ? 18 : 22, color: CP.pink, gap: 6 },
      );
      this.stakeKey = key;
      this.stakeBox.addChild(this.stakeSeg);
    } else if (this.stakeSeg.value !== stake) this.stakeSeg.set(stake);
    const m = betMult(this.bet);
    const p = betChance(this.bet);
    const curName = this.cur === 'gold' ? 'oro' : this.cur === 'gems' ? 'gemas' : 'fichas';
    const pl = plenoTickets(this.cur, this.bet, stake);
    this.info.text = `${betLabel(this.bet)} · probabilidad ${(p * 100).toFixed(0)}% · paga x${m} (${fmt(stake * m)} ${curName})${pl ? ` + ${pl} ${pl === 1 ? 'boleto' : 'boletos'}` : ''} · retorno medio 96%`;
    const ok = canPay(this.cur, stake) && !this.spinning;
    this.spinBtn.disabled = !ok;
    this.spinBtn.setText('¡GIRAR!', `${fmt(stake)} ${curName.toUpperCase()}`);
    this.gemNote.text = this.cur === 'gems' ? `Mesa VIP: te quedan ${gemBetsLeft()} apuestas de gemas (1 más cada 2 niveles de Reino).` : '';
    const s = summary(this.cur);
    const pct = Math.round(s.pct * 100);
    this.net.text = s.bets ? `${s.bets} apuestas con ${curName} · neto ${pct >= 0 ? '+' : ''}${pct}%` : '';
    this.drawHistory();
    this.ctx.refresh();
  }

  /** last 9 pockets — a fixed pool of 9 chips, re-coloured (no allocation per spin) */
  private drawHistory() {
    if (!this.hist.length) {
      for (let i = 0; i < 9; i++) {
        const c = new Container();
        const g = new Graphics();
        const t = txt('', { fontFamily: F.poster, fontSize: 18, fill: CP.paper });
        t.anchor.set(0.5);
        t.position.set(17, 17);
        c.addChild(g, t);
        c.x = i * 38;
        c.alpha = i === 0 ? 1 : 0.75;
        this.histBox.addChild(c);
        this.hist.push({ c, g, t });
      }
    }
    const last = (cs().hist ?? []).filter((h) => h.g === 'roulette').slice(0, 9);
    this.hist.forEach((h, i) => {
      const e = last[i];
      h.c.visible = !!e;
      if (!e) return;
      const n = parseInt(e.r, 10);
      h.g.clear().circle(17, 17, 17).fill(COL[pocketColor(n)]).stroke({ width: 2, color: CP.gold });
      h.t.text = String(n);
    });
  }

  primary() {
    void this.play(1, false);
  }
  private spin() {
    void this.play(1, false);
  }

  // ---- AutoHost
  autoStep(speed: AutoSpeed): Promise<AutoOutcome> {
    return this.play(speed, true);
  }
  autoBalance() {
    return balanceOf(this.cur);
  }
  autoName() {
    return `RULETA · ${betLabel(this.bet)}`;
  }

  private play(speed: AutoSpeed, auto: boolean): Promise<AutoOutcome> {
    if (this.spinning || (!auto && this.ctx.busy)) return Promise.resolve({ ok: true });
    const stake = this.stake();
    if (!canPay(this.cur, stake)) {
      sfx('error');
      this.ctx.say('poor');
      return Promise.resolve({ ok: false });
    }
    this.ctx.freeze({ [this.cur]: -stake });
    const res = spinRoulette(this.cur, this.bet, stake);
    if (!res) {
      this.ctx.unfreeze();
      return Promise.resolve({ ok: false });
    }
    this.spinning = true;
    if (!auto) this.ctx.setBusy(true);
    this.spinBtn.disabled = true;
    for (const c of this.betCells) if (!sameBet(c.b, this.bet)) c.draw(false);
    const idx = WHEEL.indexOf(res.pocket);
    const target = -Math.PI / 2 + (idx + 0.5) * SEG;
    const outcome = (): AutoOutcome => ({ ok: true, big: res.win && betMult(res.bet) >= 24 });
    if (speed >= 99) {
      // TURBO: the ball is simply in its pocket
      gsap.killTweensOf(this.wheel);
      this.ballAng = target;
      this.ballR = R * 0.78;
      this.placeBall();
      csfx.wheelTick(1);
      return this.result(res, speed, auto).then(outcome);
    }
    if (!auto || speed === 1) {
      this.ctx.say('roulette', auto ? 0.2 : 0.7);
      if (!auto) this.ctx.chat('roulette', 2);
    }
    lounge.hype(0.6);
    sfx('whoosh');
    const T = 5.2 / speed;
    const r0 = this.wheel.rotation;
    const r1 = r0 + Math.PI * 2 * ((4 + Math.random()) / Math.sqrt(speed));
    gsap.to(this.wheel, {
      rotation: r1,
      duration: T,
      ease: 'power3.out',
      onUpdate: () => this.tickSound(),
    });
    // ball: local angle runs backwards many turns and ends exactly in the pocket
    const b = { a: this.ballAng, r: R - 34 };
    const turns = Math.max(4, Math.round(13 / speed));
    let a1 = target - Math.PI * 2 * turns;
    while (a1 > b.a - Math.PI * 2 * (turns - 1)) a1 -= Math.PI * 2;
    gsap.to(b, {
      a: a1,
      duration: T - 0.9 / speed,
      ease: 'power2.out',
      onUpdate: () => {
        this.ballAng = b.a;
        this.ballR = b.r;
        this.placeBall();
      },
    });
    gsap.to(b, { r: R * 0.78, duration: 1.1 / speed, delay: T - 2.2 / speed, ease: 'bounce.out', onStart: () => csfx.ballDrop() });
    return new Promise<AutoOutcome>((resolve) => {
      window.setTimeout(() => {
        if (this.destroyed) return resolve({ ok: true });
        this.ballAng = target;
        void this.result(res, speed, auto).then(() => resolve(outcome()));
      }, T * 1000 + 150 / speed);
    });
  }

  private tickSound() {
    const rel = (((-Math.PI / 2 - this.wheel.rotation) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const seg = Math.floor(rel / SEG);
    if (seg !== this.lastTickSeg) {
      this.lastTickSeg = seg;
      csfx.wheelTick(1 + Math.random() * 0.1);
    }
  }

  private async result(r: RouletteResult, speed: AutoSpeed = 1, auto = false) {
    lounge.hype(0);
    const turbo = speed >= 99;
    const fast = speed >= 4;
    const col = r.color === 'red' ? 'ROJO' : r.color === 'black' ? 'NEGRO' : 'GATO NEGRO';
    for (const c of this.betCells) {
      const hit = c.b.kind === 'num' ? c.b.v === r.pocket : c.b.kind === 'color' ? c.b.v === r.color : r.pocket >= 1 + c.b.v * 8 && r.pocket <= 8 + c.b.v * 8;
      c.draw(sameBet(c.b, this.bet), hit);
    }
    if (!turbo) {
      const plate = new Container();
      const pcol = r.color === 'red' ? CP.red : r.color === 'green' ? CP.green : 0x231a26;
      const pt = txt(`${r.pocket}  ${col}`, { fontFamily: F.poster, fontSize: 92, fill: CP.paper, letterSpacing: 0 });
      pt.anchor.set(0.5);
      const pw = pt.width + 70;
      const pg = new Graphics().rect(-pw / 2 + 10, -64 + 10, pw, 128).fill(CP.ink).rect(-pw / 2, -64, pw, 128).fill(pcol).stroke({ width: 6, color: CP.paper });
      plate.addChild(pg, pt);
      plate.position.set(CX, CY);
      plate.rotation = -0.06;
      this.ctx.fx.addChild(plate);
      gsap.from(plate.scale, { x: 2.2, y: 2.2, duration: 0.25, ease: 'back.out(2.2)' });
      gsap.to(plate, { alpha: 0, delay: 2.0 / speed, duration: 0.4 / speed, onComplete: () => plate.destroy({ children: true }) });
      csfx.reelStop(1);
      this.ctx.shake(0.15);
    }
    const loot = r.cur === 'gold' ? 'gold' : r.cur === 'gems' ? 'gems' : 'chips';
    if (r.win) {
      const m = betMult(r.bet);
      if (turbo) {
        this.ctx.unfreeze();
        if (m >= 24) {
          csfx.winBig();
          this.ctx.say('winBig', 0.6);
        } else csfx.coin();
      } else {
        coinFountain(this.ctx.particles, CX, CY, loot, fast ? 8 : m >= 24 ? 60 : 22, m >= 24 ? 1.4 : 1);
        flyLoot(this.ctx.fx, loot, { x: CX, y: CY }, this.ctx.pillPos(loot), fast ? 4 : m >= 24 ? 18 : 8, () => this.ctx.unfreeze());
        if (m >= 24) {
          this.ctx.marquee.burst(3000 / speed, 'rainbow');
          flash(this.ctx.fx, CP.yellow, 0.5, 0.3);
          csfx.winBig();
          csfx.coinShower(fast ? 8 : 24);
          this.ctx.say('winBig');
          this.ctx.chat('winBig', 4);
          onomatopoeia(this.ctx.fx, CX, CY - 160, '¡PLENO!', { size: 150, color: CP.yellow });
          if (speed <= 2) await winBanner(this.ctx.top, '¡PLENO!', `x${m} · +${fmt(r.payout)} ${loot === 'gold' ? 'DOBLONES' : loot === 'gems' ? 'OJOS DE GATO' : 'FICHAS'}`, CP.yellow);
        } else {
          this.ctx.marquee.burst(1400 / speed, 'flash');
          csfx.winSmall();
          csfx.coinShower(fast ? 3 : 8);
          if (!fast) {
            sparkles(this.ctx.fx, CX, CY, CP.yellow, 14, 260);
            onomatopoeia(this.ctx.fx, CX, CY - 150, pick(['¡TILÍN!', '¡ESO!', '¡MIAU!']), { size: 100, color: CP.yellow });
          }
          const streak = cs().streak ?? 0;
          this.ctx.say(streak >= 3 ? 'winStreak' : 'winSmall', auto ? 0.2 : streak >= 3 ? 1 : 0.7);
          if (!auto) this.ctx.chat(streak >= 3 ? 'winStreak' : 'winSmall', 2);
        }
      }
    } else {
      this.ctx.unfreeze();
      if (!turbo) csfx.lose();
      if (!fast) {
        const streak = cs().streak ?? 0;
        if (streak <= -4) {
          this.ctx.say('loseStreak', auto ? 0.3 : 1);
          this.ctx.chat('loseStreak', 1);
        } else {
          this.ctx.say('lose', auto ? 0.1 : 0.55);
          if (!auto) this.ctx.chat('lose', 1);
        }
      }
    }
    // BONO PLENO / LA CASA TE DEBE
    const tk = r.bonus.filter((g) => g.kind === 'tickets').reduce((s, g) => s + g.n, 0);
    if (tk) {
      const candy = !r.win;
      this.ctx.say(candy ? 'candy' : 'winBig', candy ? 1 : 0.5);
      if (!turbo) {
        const t = stamp(this.ctx.fx, CX, CY + 120, candy ? 'LA CASA TE DEBÍA UNA' : `BONO PLENO +${tk} ${tk === 1 ? 'BOLETO' : 'BOLETOS'}`, CP.cyan, 50, -0.05);
        flyLoot(this.ctx.fx, 'tickets', { x: CX, y: CY + 120 }, this.ctx.pillPos('tickets'), 4);
        gsap.to(t, { alpha: 0, delay: 1.1 / speed, duration: 0.25, onComplete: () => t.destroy() });
      }
    }
    if (!turbo) await new Promise((res) => window.setTimeout(res, 500 / speed));
    this.spinning = false;
    if (!auto) this.ctx.setBusy(false);
    if (!this.destroyed) this.refresh();
  }

  dispose() {
    gsap.killTweensOf(this.wheel);
  }
}

function sameBet(a: RouletteBet, b: RouletteBet) {
  return a.kind === b.kind && a.v === b.v;
}
function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
