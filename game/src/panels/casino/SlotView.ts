/**
 * TRAGAMICHIS — 3 reels × 3 rows, 5 lines. The cabinet is a cat head (ears on top), the lever is a tail.
 * Honest presentation: the stops are drawn first (state/sys/casino.spinSlot), the reels just land on them;
 * the symbols above/below the line are the real strip neighbours. Anticipation only stretches time.
 * RISK TIERS: BAJA / MEDIA / ALTA change the paytable (bigger stake = fewer prizes, bigger prizes).
 * The chosen currency + tier are remembered in the save (never reset when you switch currency).
 * Auto-play: implements AutoHost (x1 / x2 / x10 — x10 skips banners; ETERNO pushes past INSTANT_SPEED: reels land instantly).
 */
import { Container, Graphics, Sprite, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import { onomatopoeia, sparkles, flash } from '../../fx/juice';
import { G } from '../../state/game';
import {
  AutoSpeed,
  Cur,
  INSTANT_SPEED,
  LINES,
  SLOT_MATH,
  SLOT_TIER_BLURB,
  SLOT_TIER_NAME,
  STRIPS,
  STRIP_LEN,
  SlotResult,
  SlotTier,
  Sym,
  balanceOf,
  canPay,
  chips,
  cs,
  prefs,
  slotStakes,
  spinSlot,
  summary,
} from '../../state/sys/casino';
import type { AutoHost, AutoOutcome } from './auto';
import { CP, CButton, Marquee, Seg, block, chipIcon, clickable, curIcon, halftone, heading, label, neon, symbolSprite, symbolTexture } from './kit';
import { coinFountain, flyLoot, jackpotTakeover, stamp, winBanner } from './fx';
import { csfx } from './sfx';
import type { CasinoCtx, CasinoView } from './ctx';
import { catRank, presentPrizes, revealCats, revealPlanFor } from './prizes';
import { openOdds } from './OddsPanel';
import { lounge } from './lounge';

const ROW = 150;
const COLW = 206;
const GAP = 14;
const LINE_COLORS = [CP.pink, CP.cyan, CP.yellow, CP.green, 0xff6a1a];

class Reel extends Container {
  pos: number;
  private sprites: Sprite[] = [];
  private cells: Container[] = [];
  spinning = false;
  speed = 0;
  private lastIdx = 0;
  constructor(
    public strip: Sym[],
    start: number,
    public onTick: () => void,
  ) {
    super();
    this.pos = start;
    for (let k = 0; k < 5; k++) {
      const cell = new Container();
      const s = symbolSprite(strip[0], 126);
      cell.addChild(s);
      this.addChild(cell);
      this.sprites.push(s);
      this.cells.push(cell);
    }
    this.layout();
  }
  layout() {
    const N = STRIP_LEN;
    const base = Math.floor(this.pos);
    for (let k = 0; k < 5; k++) {
      const idx = base - 2 + k;
      const y = ROW * 1.5 + (idx - this.pos) * ROW;
      const cell = this.cells[k];
      cell.position.set(COLW / 2, y);
      const sym = this.strip[((idx % N) + N) % N];
      const sp = this.sprites[k];
      const tex = symbolTexture(sym);
      if (sp.texture !== tex) sp.texture = tex;
      const blur = Math.min(1, this.speed / 22);
      sp.scale.y = sp.scale.x * (1 + blur * 0.35);
      sp.alpha = 1 - blur * 0.25;
    }
    const i = Math.floor(this.pos);
    if (i !== this.lastIdx) {
      this.lastIdx = i;
      this.onTick();
    }
  }
  /** visible cell (row 0..2) for highlighting */
  cellAt(row: number): Container {
    // rows: 0 top, 1 middle, 2 bottom ↔ idx = round(pos) - 1 + row
    const base = Math.floor(this.pos);
    const k = Math.round(this.pos) - 1 + row - (base - 2);
    return this.cells[Math.max(0, Math.min(4, k))];
  }
}

export class SlotView extends Container implements CasinoView, AutoHost {
  private reels: Reel[] = [];
  private cur: Cur = 'chips';
  private tier: SlotTier = 0;
  private stakeSeg: Seg<number> | null = null;
  private stakeBlurb!: Text;
  private curSeg!: Seg<Cur>;
  private stakeBox = new Container();
  private spinBtn!: CButton;
  private lcd!: Text;
  private lcdLbl!: Text;
  private info!: Text;
  private net!: Text;
  private lineLayer = new Graphics();
  private tagLayer = new Container();
  private tail = new Container();
  private marquee!: Marquee;
  private spinning = false;
  private x0 = 505;
  private y0 = 118;
  private winX = 0;
  private winY = 0;
  private tickAcc = 0;
  private offs: (() => void)[] = [];

  constructor(private ctx: CasinoCtx) {
    super();
    const sp = (prefs().slot ??= {});
    this.cur = sp.cur === 'gold' || sp.cur === 'chips' ? sp.cur : chips() >= 10 || G.s.gold < 100 ? 'chips' : 'gold';
    this.tier = clampTier(sp.tier?.[this.cur]);
    this.build();
    this.refresh();
    Ticker.shared.add(this.tick, this);
  }

  private build() {
    const x0 = this.x0;
    const y0 = this.y0;
    const CW = 760;
    const CH = 850;
    // ---- cabinet = a cat head
    const cab = new Graphics();
    cab.poly([x0 + 20, y0 + 120, x0 + 70, y0 - 10, x0 + 210, y0 + 90]).fill(CP.ink);
    cab.poly([x0 + CW - 20, y0 + 120, x0 + CW - 70, y0 - 10, x0 + CW - 210, y0 + 90]).fill(CP.ink);
    cab.poly([x0 + 52, y0 + 96, x0 + 78, y0 + 26, x0 + 168, y0 + 90]).fill(CP.pink);
    cab.poly([x0 + CW - 52, y0 + 96, x0 + CW - 78, y0 + 26, x0 + CW - 168, y0 + 90]).fill(CP.pink);
    cab.roundRect(x0 + 14, y0 + 74, CW, CH - 60, 26).fill(CP.ink);
    cab.roundRect(x0, y0 + 60, CW, CH - 60, 26).fill(CP.red).stroke({ width: 6, color: CP.ink });
    this.addChild(cab);
    const ht = halftone(CW - 40, CH - 110, CP.ink, 0.14, 13, 2.6);
    ht.position.set(x0 + 20, y0 + 84);
    const htMask = new Graphics().roundRect(x0 + 20, y0 + 84, CW - 40, CH - 110, 18).fill(0xffffff);
    ht.mask = htMask;
    this.addChild(htMask, ht);
    // header
    const hx = x0 + 60;
    const hy = y0 + 86;
    this.addChild(block(CW - 120, 104, CP.ink, { off: 0, border: 4, borderColor: CP.ink }));
    (this.children[this.children.length - 1] as Graphics).position.set(hx, hy);
    const title = neon('TRAGAMICHIS', 74, CP.pink);
    title.anchor.set(0.5);
    title.position.set(x0 + CW / 2, hy + 44);
    const kicker = label('5 LÍNEAS · EL GATO NEGRO PAGA', 15, CP.yellow, { letterSpacing: 3 });
    kicker.anchor.set(0.5);
    kicker.position.set(x0 + CW / 2, hy + 88);
    this.marquee = new Marquee(CW - 120, 104, 30);
    this.marquee.position.set(hx, hy);
    this.addChild(this.marquee, title, kicker);
    // reel window
    const wx = x0 + (CW - (COLW * 3 + GAP * 2)) / 2;
    const wy = y0 + 214;
    this.winX = wx;
    this.winY = wy;
    const frame = new Graphics();
    frame.rect(wx - 18, wy - 18, COLW * 3 + GAP * 2 + 36, ROW * 3 + 36).fill(CP.ink);
    frame.rect(wx - 10, wy - 10, COLW * 3 + GAP * 2 + 20, ROW * 3 + 20).fill(CP.yellow).stroke({ width: 4, color: CP.ink });
    this.addChild(frame);
    const starts = this.lastStops();
    for (let i = 0; i < 3; i++) {
      const col = new Container();
      col.position.set(wx + i * (COLW + GAP), wy);
      const bg = new Graphics().rect(0, 0, COLW, ROW * 3).fill(CP.paper).stroke({ width: 4, color: CP.ink, alignment: 1 });
      const shade = new Graphics();
      shade.rect(0, 0, COLW, 40).fill({ color: CP.ink, alpha: 0.18 });
      shade.rect(0, ROW * 3 - 40, COLW, 40).fill({ color: CP.ink, alpha: 0.18 });
      const reel = new Reel(STRIPS[i], starts[i], () => this.onReelTick(i));
      const m = new Graphics().rect(0, 0, COLW, ROW * 3).fill(0xffffff);
      reel.mask = m;
      col.addChild(bg, halftone(COLW, ROW * 3, CP.ink, 0.05, 10, 1.6), reel, m, shade);
      this.addChild(col);
      this.reels.push(reel);
    }
    // payline tabs (left/right of the window): rows 1–3 + diagonals at the corners
    LINES.forEach((L, li) => {
      for (const side of [0, 1]) {
        const row = side === 0 ? L[0] : L[2];
        const tx = side === 0 ? wx - 44 : wx + COLW * 3 + GAP * 2 + 16;
        const diag = li >= 3 ? (row === 0 ? 40 : -40) : 0;
        const tab = new Container();
        tab.position.set(tx, wy + row * ROW + ROW / 2 + diag);
        const tg = new Graphics().rect(0, -15, 28, 30).fill(LINE_COLORS[li]).stroke({ width: 3, color: CP.ink });
        const n = txt(String(li + 1), { fontFamily: F.poster, fontSize: 20, fill: CP.ink });
        n.anchor.set(0.5);
        n.position.set(14, 0);
        tab.addChild(tg, n);
        this.addChild(tab);
      }
    });
    this.addChild(this.lineLayer, this.tagLayer);
    // ---- controls
    const cy = wy + ROW * 3 + 28;
    const cx = x0 + 44;
    this.curSeg = new Seg<Cur>(
      [
        { v: 'chips', label: 'FICHAS', icon: chipIcon(24) },
        { v: 'gold', label: 'ORO', icon: curIcon('gold', 24) },
        { v: 'gems', label: 'GEMAS', icon: curIcon('gems', 22), disabled: true },
      ],
      this.cur,
      (v) => {
        // stake memory: each currency keeps its own risk tier (switching never resets it)
        this.cur = v;
        const sp = (prefs().slot ??= {});
        sp.cur = v;
        this.tier = clampTier(sp.tier?.[v] ?? this.tier);
        this.refresh(true);
        this.ctx.say(v === 'chips' ? 'betChips' : 'betSmall', 0.5);
      },
      { w: 104, h: 50, size: 21, color: CP.yellow, gap: 6 },
    );
    this.curSeg.position.set(cx, cy);
    this.stakeBox.position.set(cx, cy + 66);
    this.stakeBlurb = label('', 14, CP.yellow);
    this.stakeBlurb.position.set(cx, cy + 120);
    this.addChild(this.curSeg, this.stakeBox, this.stakeBlurb);
    // LCD
    const lx = cx + 338;
    const lcdBg = new Graphics().rect(lx, cy, 160, 104).fill(0x0b0f0c).stroke({ width: 4, color: CP.ink });
    this.lcdLbl = label('GANANCIA', 15, CP.green, { letterSpacing: 3 });
    this.lcdLbl.position.set(lx + 14, cy + 10);
    this.lcd = txt('—', { fontFamily: F.poster, fontSize: 52, fill: CP.green, dropShadow: { color: CP.green, blur: 10, distance: 0, alpha: 0.8, angle: 0 } });
    this.lcd.position.set(lx + 14, cy + 34);
    this.addChild(lcdBg, this.lcdLbl, this.lcd);
    this.spinBtn = new CButton('¡JALA!', () => this.spin(), { w: 162, h: 104, color: CP.yellow, size: 46, sub: '' });
    this.spinBtn.position.set(x0 + CW - 44 - 162, cy);
    this.addChild(this.spinBtn);
    // ---- info under the cabinet
    this.info = label('', 18, CP.paper);
    this.info.position.set(x0 + 10, y0 + CH + 18);
    this.net = label('', 18, CP.softPink);
    this.net.anchor.set(0, 0);
    this.net.position.set(x0 + 10, y0 + CH + 44);
    const pt = new Container();
    const ptBg = block(220, 44, CP.cyan, { off: 5, border: 3 });
    const ptT = heading('TABLA DE PAGOS', 24, CP.ink);
    ptT.position.set(18, 6);
    pt.addChild(ptBg, ptT);
    // inside the table area (the old spot spilled into the chat column)
    pt.position.set(1196, y0 + CH + 22);
    clickable(pt, () => openOdds('slot', this.cur, this.stake(), undefined, this.tier));
    this.addChild(this.info, this.net, pt);
    // ---- lever (cat tail)
    this.buildTail(x0 + CW + 8, y0 + 300);
  }

  private buildTail(x: number, y: number) {
    const t = this.tail;
    t.position.set(x, y);
    const g = new Graphics();
    const draw = (bend: number) => {
      g.clear();
      const P0 = { x: 0, y: 300 };
      const P1 = { x: 70, y: 250 };
      const P2 = { x: 30 + bend * 40, y: 140 + bend * 60 };
      const P3 = { x: 72 + bend * 70, y: 24 + bend * 230 };
      const at = (t: number) => {
        const u = 1 - t;
        return {
          x: u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
          y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
        };
      };
      const path = () => g.moveTo(P0.x, P0.y).bezierCurveTo(P1.x, P1.y, P2.x, P2.y, P3.x, P3.y);
      path().stroke({ width: 40, color: CP.paper, cap: 'round' });
      path().stroke({ width: 32, color: CP.ink, cap: 'round' });
      // fur rings (pink) along the tail
      for (let i = 1; i <= 5; i++) {
        const p = at(i / 6.2);
        const q = at(i / 6.2 + 0.02);
        const ang = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2;
        g.moveTo(p.x + Math.cos(ang) * 15, p.y + Math.sin(ang) * 15)
          .lineTo(p.x - Math.cos(ang) * 15, p.y - Math.sin(ang) * 15)
          .stroke({ width: 7, color: CP.pink, cap: 'round' });
      }
      // highlight
      g.moveTo(P0.x - 6, P0.y - 10).bezierCurveTo(P1.x - 8, P1.y - 12, P2.x - 8, P2.y, P3.x - 10, P3.y + 8).stroke({ width: 4, color: 0xffffff, alpha: 0.18, cap: 'round' });
      knob.position.set(P3.x, P3.y);
    };
    const knob = new Container();
    const kg = new Graphics().circle(0, 0, 38).fill(CP.red).stroke({ width: 5, color: CP.ink });
    for (let i = 0; i < 4; i++) {
      const a = -0.9 + i * 0.5;
      kg.moveTo(Math.cos(a + Math.PI) * 36, Math.sin(a + Math.PI) * 36)
        .quadraticCurveTo(Math.cos(a + Math.PI / 2) * 12, Math.sin(a + Math.PI / 2) * 12, Math.cos(a) * 36, Math.sin(a) * 36)
        .stroke({ width: 3, color: 0xff8fa8 });
    }
    knob.addChild(kg);
    const base = new Graphics().roundRect(-24, 280, 48, 60, 10).fill(CP.yellow).stroke({ width: 4, color: CP.ink });
    t.addChild(base, g, knob);
    draw(0);
    (t as Container & { bendTo: (b: number) => void }).bendTo = (b: number) => {
      const o = { b: (t as Container & { _b?: number })._b ?? 0 };
      gsap.to(o, {
        b,
        duration: b > 0 ? 0.18 : 0.5,
        ease: b > 0 ? 'power2.in' : 'elastic.out(1,0.4)',
        onUpdate: () => {
          if (!g.destroyed) draw(o.b);
          (t as Container & { _b?: number })._b = o.b;
        },
      });
    };
    clickable(t, () => this.spin(), { sound: false, hover: false });
    this.addChild(t);
    const hint = label('JALA LA COLA', 14, CP.yellow, { letterSpacing: 2 });
    hint.anchor.set(0.5);
    hint.position.set(x + 70, y - 46);
    hint.rotation = 0.1;
    this.addChild(hint);
  }

  private lastStops(): number[] {
    return [3, 11, 17].map((s, i) => (s + i * 5) % STRIP_LEN);
  }

  private stake(): number {
    return slotStakes(this.cur)[this.tier] ?? 0;
  }

  /** full = rebuild the stake selector (currency changed); otherwise only texts/buttons update (cheap, auto-play safe) */
  private refresh(full = false) {
    const st = slotStakes(this.cur);
    const labels = st.map((v, i) => `${SLOT_TIER_NAME[i]} ${fmt(v)}`);
    const key = labels.join('|');
    if (full || !this.stakeSeg || (this.stakeSeg as Seg<number> & { key?: string }).key !== key) {
      this.stakeBox.removeChildren().forEach((c) => c.destroy({ children: true }));
      const seg = new Seg<number>(
        labels.map((l, i) => ({ v: i, label: l })),
        this.tier,
        (i) => {
          this.tier = i as SlotTier;
          const sp = (prefs().slot ??= {});
          (sp.tier ??= {})[this.cur] = i;
          this.refresh();
          this.ctx.say(i === 2 ? 'betBig' : 'betSmall', 0.45);
        },
        { w: 104, h: 46, size: this.cur === 'gold' ? 17 : 19, color: CP.pink, gap: 6 },
      );
      (seg as Seg<number> & { key?: string }).key = key;
      this.stakeSeg = seg;
      this.stakeBox.addChild(seg);
    } else if (this.stakeSeg.value !== this.tier) this.stakeSeg.set(this.tier);
    const stake = this.stake();
    const m = SLOT_MATH[this.tier];
    this.stakeBlurb.text = `${SLOT_TIER_NAME[this.tier]}: ${SLOT_TIER_BLURB[this.tier]} Premio en ${(m.hit * 100).toFixed(0)}% de las tiradas.`;
    const ok = canPay(this.cur, stake);
    this.spinBtn.disabled = !ok || this.spinning;
    this.spinBtn.setText('¡JALA!', this.cur === 'chips' ? `${stake} FICHAS` : `${fmt(stake)} ORO`);
    const rtp = (m.rtp * 100).toFixed(1);
    this.info.text =
      this.cur === 'gold'
        ? `RIESGO ${SLOT_TIER_NAME[this.tier]} · RETORNO MEDIO ${rtp}% · PREMIO MÁX. x${m.maxM.toFixed(1)} (tope por producción)`
        : `RIESGO ${SLOT_TIER_NAME[this.tier]} · PREMIO EN ${(m.hit * 100).toFixed(0)}% · GATO NEGRO x3: 1 EN ${Math.round(1 / (m.perSpin.neko ?? 1e-9))}`;
    const s = summary(this.cur);
    const pct = Math.round(s.pct * 100);
    this.net.text = s.bets ? `${s.bets} tiradas · neto ${pct >= 0 ? '+' : ''}${pct}%` : '';
    this.ctx.refresh();
  }

  private onReelTick(i: number) {
    this.tickAcc++;
    if (this.tickAcc % 2 === 0) csfx.reelTick(1 + i * 0.12);
  }

  private tick(t: Ticker) {
    const dt = Math.min(0.05, t.deltaMS / 1000);
    for (const r of this.reels) {
      if (r.spinning) {
        r.pos -= r.speed * dt;
        r.layout();
      }
    }
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
    return `TRAGAMICHIS · ${this.cur === 'chips' ? `${this.stake()} FICHAS` : `${fmt(this.stake())} ORO`}`;
  }

  /** one spin at a speed (manual = x1). Resolves when the machine can spin again. */
  private async play(speed: AutoSpeed, auto: boolean): Promise<AutoOutcome> {
    if (this.spinning || (!auto && this.ctx.busy)) return { ok: true };
    const stake = this.stake();
    if (!canPay(this.cur, stake)) {
      sfx('error');
      this.ctx.say('poor');
      return { ok: false };
    }
    const turbo = speed >= INSTANT_SPEED;
    this.ctx.freeze({ [this.cur === 'gold' ? 'gold' : 'chips']: -stake });
    const res = spinSlot(this.cur, this.tier);
    if (!res) {
      this.ctx.unfreeze();
      return { ok: false };
    }
    this.spinning = true;
    if (!auto) this.ctx.setBusy(true);
    this.clearWins();
    this.lcd.text = '—';
    this.lcd.style.fill = CP.green;
    this.spinBtn.disabled = true;
    this.ctx.refresh();
    if (!turbo) {
      // banter by stake
      if (this.cur === 'gold') this.ctx.say(this.tier === 2 ? 'betBig' : 'betSmall', auto ? 0.1 : 0.35);
      else this.ctx.say('spin', auto ? 0.08 : 0.25);
      if (!auto) this.ctx.chat(this.tier === 2 ? 'betBig' : 'betChips', 1);
      csfx.lever();
      (this.tail as Container & { bendTo: (b: number) => void }).bendTo(1);
      window.setTimeout(() => !this.destroyed && (this.tail as Container & { bendTo: (b: number) => void }).bendTo(0), 220 / speed);
      this.marquee.speed = 2.2;
      lounge.hype(0.5);
      await this.spinReels(res, speed);
      this.marquee.speed = 1;
      lounge.hype(0);
    } else this.landNow(res);
    if (this.destroyed) return { ok: true };
    await this.present(res, speed, auto);
    this.spinning = false;
    if (!auto) this.ctx.setBusy(false);
    if (!this.destroyed) this.refresh();
    const catG = res.granted.filter((g) => g.kind === 'cat');
    return {
      ok: true,
      big: res.jackpot || (res.cur === 'gold' ? res.mult >= 5 : catG.length > 0 || res.granted.some((g) => g.tier === 'legendary' || g.tier === 'mythic')),
      legend: catG.some((g) => catRank(g) >= 3),
      newCat: catG.some((g) => g.isNew),
    };
  }

  /** INSTANT (ETERNO top speed): put the reels on their stops instantly */
  private landNow(res: SlotResult) {
    this.reels.forEach((r, i) => {
      gsap.killTweensOf(r);
      r.spinning = false;
      r.speed = 0;
      r.pos = res.stops[i];
      r.layout();
    });
    csfx.reelStop(1);
  }

  private spinReels(res: SlotResult, speed: number): Promise<void> {
    return new Promise((resolve) => {
      const V = 26 * Math.min(2, speed);
      for (const r of this.reels) {
        r.spinning = true;
        r.speed = 0;
        gsap.to(r, { speed: V, duration: 0.25, ease: 'power2.in' });
      }
      // honest anticipation: reels 1–2 already show two GATO NEGRO on a line → reel 3 spins longer
      const g = res.grid;
      const antic = LINES.some((L) => g[0][L[0]] === 'neko' && g[1][L[1]] === 'neko');
      const stopAt = [0.85, 1.3, antic ? 2.6 : 1.75].map((t) => t / speed);
      let done = 0;
      stopAt.forEach((t, i) => {
        window.setTimeout(() => {
          if (this.destroyed) return;
          if (i === 2 && antic) {
            // already slowed down suspense
          }
          const r = this.reels[i];
          r.spinning = false;
          const N = STRIP_LEN;
          const target = res.stops[i];
          // land with ~3 rows of travel left, on the exact stop
          let final = r.pos - 3;
          final = Math.floor(final) - ((((Math.floor(final) - target) % N) + N) % N);
          gsap.to(r, {
            pos: final,
            speed: 0,
            duration: 0.55 / Math.sqrt(speed),
            ease: 'back.out(1.6)',
            onUpdate: () => r.layout(),
            onComplete: () => {
              r.pos = final;
              r.speed = 0;
              r.layout();
              csfx.reelStop(i);
              const fl = new Graphics().rect(this.winX + i * (COLW + GAP), this.winY, COLW, ROW * 3).fill(0xffffff);
              fl.alpha = 0.45;
              this.addChild(fl);
              gsap.to(fl, { alpha: 0, duration: 0.25, onComplete: () => fl.destroy() });
              this.ctx.shake(0.08);
              done++;
              if (done === 3) resolve();
            },
          });
        }, t * 1000);
      });
      if (antic && speed < 4) {
        window.setTimeout(() => {
          if (this.destroyed) return;
          this.marquee.burst(1200, 'flash');
          sfx('drumroll');
          this.ctx.chat('betBig', 1);
          const t = stamp(this.ctx.fx, this.winX + COLW * 2.5 + GAP * 2, this.winY - 30, '¡¿EL GATO?!', CP.yellow, 52, 0.08);
          gsap.to(t, { alpha: 0, delay: 1.1, duration: 0.3, onComplete: () => t.destroy() });
        }, 1450 / speed);
      }
    });
  }

  private clearWins() {
    this.lineLayer.clear();
    this.tagLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  private cellCenter(reel: number, row: number) {
    return { x: this.winX + reel * (COLW + GAP) + COLW / 2, y: this.winY + row * ROW + ROW / 2 };
  }

  private drawLine(li: number, cells: [number, number][], quiet = false) {
    const L = LINES[li];
    const pts = [0, 1, 2].map((r) => this.cellCenter(r, L[r]));
    const col = LINE_COLORS[li];
    const g = this.lineLayer;
    g.moveTo(pts[0].x - 110, pts[0].y);
    for (const p of pts) g.lineTo(p.x, p.y);
    g.lineTo(pts[2].x + 110, pts[2].y);
    g.stroke({ width: 18, color: CP.ink, cap: 'round', join: 'round', alpha: 0.85 });
    g.moveTo(pts[0].x - 110, pts[0].y);
    for (const p of pts) g.lineTo(p.x, p.y);
    g.lineTo(pts[2].x + 110, pts[2].y);
    g.stroke({ width: 9, color: col, cap: 'round', join: 'round' });
    for (const [r, row] of cells) {
      const c = this.cellCenter(r, row);
      g.rect(c.x - COLW / 2 + 6, c.y - ROW / 2 + 6, COLW - 12, ROW - 12).stroke({ width: 6, color: col });
      if (quiet) continue;
      const cell = this.reels[r].cellAt(row);
      gsap.fromTo(cell.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.5, ease: 'elastic.out(1.2,0.4)' });
    }
  }

  private async present(res: SlotResult, speed: AutoSpeed = 1, auto = false) {
    const stake = res.stake;
    const turbo = speed >= INSTANT_SPEED;
    const fast = speed >= 4;
    const plan = auto ? revealPlanFor(speed) : {};
    if (!res.wins.length) {
      this.ctx.unfreeze();
      if (!turbo) csfx.lose();
      this.lcd.text = '0';
      this.lcd.style.fill = 0x4a6a55;
      if (!fast) {
        const streak = cs().streak ?? 0;
        if (streak <= -4) {
          this.ctx.say('loseStreak', auto ? 0.3 : 1);
          this.ctx.chat('loseStreak', 1);
        } else {
          this.ctx.say('lose', auto ? 0.1 : 0.4);
          if (!auto) this.ctx.chat('lose', 1);
        }
      }
      await this.candy(res, speed);
      return;
    }
    // draw every winning line, one by one (TURBO: all at once)
    for (let i = 0; i < res.wins.length; i++) {
      const w = res.wins[i];
      this.drawLine(w.line, w.cells, turbo);
      if (turbo) continue;
      const last = this.cellCenter(2, LINES[w.line][2]);
      const tag = new Container();
      const lbl = res.cur === 'gold' ? `x${w.mult}` : w.sym === 'neko' ? '¡GATO!' : `x${w.mult}`;
      const tb = txt(lbl, { fontFamily: F.poster, fontSize: 34, fill: CP.ink });
      const bg = new Graphics().rect(0, 0, tb.width + 20, 44).fill(LINE_COLORS[w.line]).stroke({ width: 3, color: CP.ink });
      tb.position.set(10, 2);
      tag.addChild(bg, tb);
      tag.position.set(last.x + COLW / 2 + 6, last.y - 22 + i * 4);
      this.tagLayer.addChild(tag);
      gsap.from(tag.scale, { x: 0, y: 0, duration: 0.25, ease: 'back.out(3)' });
      csfx.winSmall();
      await wait((res.wins.length > 1 ? 380 : 200) / speed);
    }
    const won = res.payout;
    const isGold = res.cur === 'gold';
    const mult = isGold ? won / stake : 0;
    const realWin = isGold ? won > stake : res.granted.some((g) => g.kind !== 'chips') || won > stake;
    // LCD roll (chips mode: number of prizes)
    if (!isGold) this.lcdLbl.text = 'PREMIOS';
    const shownVal = isGold || !realWin ? won : res.granted.length;
    if (turbo) this.lcd.text = fmt(shownVal);
    else {
      const o = { v: 0 };
      gsap.to(o, {
        v: shownVal,
        duration: Math.min(1.6, 0.4 + Math.log10(1 + won) * 0.3) / speed,
        ease: 'power2.out',
        onUpdate: () => {
          if (!this.lcd.destroyed) this.lcd.text = fmt(o.v);
        },
      });
    }
    if (!realWin) {
      this.ctx.unfreeze();
      this.lcdLbl.text = 'RECUPERAS';
      this.lcd.style.fill = 0x9fb3a6;
      if (!fast) {
        this.ctx.say('refund', auto ? 0.15 : 0.6);
        if (!auto) this.ctx.chat('refund', 1);
      }
      window.setTimeout(() => {
        if (!this.lcdLbl.destroyed) this.lcdLbl.text = this.cur === 'gold' ? 'GANANCIA' : 'PREMIOS';
      }, 1600 / speed);
      await this.candy(res, speed);
      return;
    }
    this.lcdLbl.text = isGold ? 'GANANCIA' : 'PREMIOS';
    const trayX = this.x0 + 380;
    const trayY = this.winY + ROW * 3;
    const big = res.jackpot || (isGold ? mult >= 5 : res.granted.some((g) => g.kind === 'cat' || g.tier === 'epic' || g.tier === 'legendary' || g.tier === 'mythic'));
    if (turbo) {
      // straight to the results: pills catch up, a short line in the host bubble for the big ones, reveal NEW legendary+ cats
      this.ctx.unfreeze();
      if (big) {
        csfx.winBig();
        this.marquee.burst(600, 'flash');
        this.ctx.say(res.jackpot ? 'jackpot' : 'winBig', 0.5);
      } else csfx.coin();
      await revealCats(this.ctx.top, res.granted, plan);
      return;
    }
    if (res.jackpot && !fast) {
      this.marquee.burst(4000, 'rainbow');
      this.ctx.shake(0.6);
      this.ctx.say('jackpot');
      this.ctx.chat('jackpot', 4);
      const catG = res.granted.find((g) => g.kind === 'cat');
      await jackpotTakeover(this.ctx.top, this.ctx.particles, { sub: isGold ? `+${fmt(won)} DOBLONES` : catG ? `TE LLEVAS A ${catG.label}` : '¡PREMIO MAYOR!', loot: isGold ? 'gold' : 'chips', autoClose: auto ? 2.6 : undefined });
    } else if (big) {
      this.marquee.burst(2200 / speed, 'rainbow');
      this.ctx.shake(0.35);
      flash(this.ctx.fx, CP.yellow, 0.35, 0.3);
      csfx.winBig();
      csfx.coinShower(fast ? 6 : 18);
      coinFountain(this.ctx.particles, trayX, trayY, isGold ? 'gold' : 'chips', fast ? 14 : 40, 1.2);
      onomatopoeia(this.ctx.fx, this.x0 + 380, this.winY + 120, '¡CHA-CHING!', { size: 120, color: CP.yellow });
      this.ctx.say(res.jackpot ? 'jackpot' : 'winBig');
      this.ctx.chat('winBig', 3);
      if (isGold && mult >= 5 && speed <= 2) await winBanner(this.ctx.top, '¡GRAN PREMIO!', `x${mult.toFixed(1)} · +${fmt(won)} DOBLONES`, CP.yellow);
    } else {
      this.marquee.burst(1000 / speed, 'flash');
      csfx.coinShower(fast ? 3 : 6);
      coinFountain(this.ctx.particles, trayX, trayY, isGold ? 'gold' : 'chips', fast ? 6 : 14, 0.8);
      if (!fast) {
        onomatopoeia(this.ctx.fx, this.x0 + 380, this.winY + 140, pick(['¡TILÍN!', '¡ÑAM!', '¡MIAU!', '¡PLIN!']), { size: 90, color: CP.yellow });
        sparkles(this.ctx.fx, trayX, this.winY + 250, CP.yellow, 12, 200);
      }
      const streak = cs().streak ?? 0;
      if (streak >= 3) {
        this.ctx.say('winStreak', auto ? 0.4 : 1);
        if (!auto) this.ctx.chat('winStreak', 2);
      } else {
        this.ctx.say('winSmall', auto ? 0.15 : 0.6);
        if (!auto) this.ctx.chat('winSmall', 1);
      }
    }
    if (isGold) flyLoot(this.ctx.fx, 'gold', { x: trayX, y: this.winY + ROW * 1.5 }, this.ctx.pillPos('gold'), fast ? 4 : Math.min(18, 5 + Math.round(mult * 2)), () => this.ctx.unfreeze());
    if (!isGold && res.granted.length) await presentPrizes(this.ctx, res.granted, { x: trayX, y: this.winY + ROW * 1.5 }, { hold: 1500 / speed, reveal: auto ? plan : undefined });
    else if (isGold && fast) this.ctx.unfreeze();
  }

  /** LA CASA TE DEBE: the meter filled on this spin → a boleto (+ fichas) flies to the pills */
  private async candy(res: SlotResult, speed: number) {
    if (!res.candy.length) return;
    this.ctx.unfreeze();
    this.ctx.say('candy');
    this.ctx.chat('candy', 1);
    csfx.winSmall();
    if (speed >= INSTANT_SPEED) return;
    const t = stamp(this.ctx.fx, this.x0 + 380, this.winY + 200, 'LA CASA TE DEBÍA UNA', CP.cyan, 54, -0.06);
    flyLoot(this.ctx.fx, 'tickets', { x: this.x0 + 380, y: this.winY + 200 }, this.ctx.pillPos('tickets'), 4);
    await wait(900 / speed);
    gsap.to(t, { alpha: 0, duration: 0.25, onComplete: () => t.destroy() });
  }

  dispose() {
    Ticker.shared.remove(this.tick, this);
    for (const r of this.reels) gsap.killTweensOf(r);
    for (const f of this.offs) f();
  }
}

function clampTier(x: unknown): SlotTier {
  const n = Math.floor(Number(x));
  return (Number.isFinite(n) ? Math.max(0, Math.min(2, n)) : 0) as SlotTier;
}
function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}
function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
