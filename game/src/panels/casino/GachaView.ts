/**
 * PORTAL DEL MULTIVERSO (gacha): banners with visible odds, pity ramps and the candy director (state/sys/gacha.ts).
 *  - NORMAL x1 / x10, ALTO RIESGO (3 boletos) and TODO O NADA (10): bigger bet = more variance, better top odds.
 *  - paid with Boletos or Ojos de Gato. Banner, payment, mode and x1/x10 are remembered in the save.
 *  - the poster changes when the portal is "hot" (RACHA CALIENTE) or your beginner's guarantee is close.
 *  - auto-play (AutoHost): x1/x2/x4 play the summon (compressed), TURBO shows a results strip and only stops
 *    for the reveal of NEW legendary+ cats.
 * The summon itself lives in fx/sequences/gachaSummon.ts.
 */
import { Container, Graphics, Text, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { G } from '../../state/game';
import { catDef } from '../../data/content';
import { elementIcon } from '../../ui/elementIcon';
import { halftoneTexture } from '../../art/textures';
import {
  BANNERS,
  Banner,
  GachaMode,
  MODES,
  PayWith,
  Pull,
  TIER_NAME,
  TIER_ORDER,
  banner,
  canPull,
  featuredCat,
  modeOdds,
  modesFor,
  pityCaps,
  pityLeft,
  pityOf,
  pull,
  pullCost,
  rankOf,
} from '../../state/sys/gacha';
import { AutoSpeed, gachaCats, prefs, tickets } from '../../state/sys/casino';
import { CP, CButton, Seg, block, clickable, curIcon, heading, label, ticketIcon } from './kit';
import { TIER_COL, catArt, catRank, revealCats, revealPlanFor } from './prizes';
import { drawAccessory } from './accessoryArt';
import { holoSheen } from '../../fx/sequences/gachaHolo';
import { openOdds } from './OddsPanel';
import { lounge } from './lounge';
import type { CasinoCtx, CasinoView } from './ctx';
import type { AutoHost, AutoOutcome } from './auto';
import type { Ev } from './lines';

const X0 = 360;
const PW = 1046;
const GOLD = 0xffc94a;

export class GachaView extends Container implements CasinoView, AutoHost {
  private b: Banner;
  private pay: PayWith = 'tickets';
  private mode: GachaMode = 'normal';
  private n: 1 | 10 = 1;
  private tabs = new Container();
  private poster = new Container();
  private controls = new Container();
  private turboBox = new Container();
  private turbo: { t: Text; chips: Graphics; log: Pull['tier'][]; pulls: number; epic: number; legend: number; fresh: number; last: number } | null = null;
  private busy = false;
  private anim: gsap.core.Tween[] = [];

  constructor(
    private ctx: CasinoCtx,
    bannerId?: string,
  ) {
    super();
    const gp = (prefs().gacha ??= {});
    this.b = banner(bannerId ?? gp.banner);
    this.pay = gp.pay === 'gems' || gp.pay === 'tickets' ? gp.pay : tickets() > 0 ? 'tickets' : 'gems';
    this.mode = gp.mode === 'riesgo' || gp.mode === 'todo' ? gp.mode : 'normal';
    this.n = gp.n === 10 ? 10 : 1;
    if (!modesFor(this.b).includes(this.mode)) this.mode = 'normal';
    this.addChild(this.tabs, this.poster, this.controls, this.turboBox);
    this.build();
  }

  private save() {
    const gp = (prefs().gacha ??= {});
    gp.banner = this.b.id;
    gp.pay = this.pay;
    gp.mode = this.mode;
    gp.n = this.n;
  }

  private build() {
    this.buildTabs();
    this.buildPoster();
    this.buildControls();
    this.ctx.refresh();
  }

  private clear(c: Container) {
    for (const ch of c.removeChildren()) ch.destroy({ children: true });
  }

  private buildTabs() {
    this.clear(this.tabs);
    BANNERS.forEach((bn, i) => {
      const on = bn.id === this.b.id;
      const c = new Container();
      const w = 336;
      const h = 80;
      c.position.set(X0 + i * (w + 19), on ? 104 : 110);
      const g = new Graphics();
      if (on) g.rect(7, 7, w, h).fill(bn.accent);
      g.rect(0, 0, w, h).fill(on ? CP.paper : 0x24132a).stroke({ width: 4, color: on ? CP.ink : 0x4a3150, alignment: 1 });
      g.rect(0, 0, 14, h).fill(bn.accent);
      const t = heading(bn.name, 32, on ? CP.ink : CP.paper);
      t.position.set(28, 6);
      const k = label(bn.kicker, 13, on ? CP.ink : CP.softPink, { letterSpacing: 1 });
      k.position.set(30, 50);
      c.addChild(g, t, k);
      // the hot window shows on the tab too
      const pl = pityLeft(bn);
      if (pl.hot) {
        const hb = new Graphics().rect(w - 92, -10, 96, 26).fill(GOLD).stroke({ width: 3, color: CP.ink });
        const ht = label(`RACHA ${pl.hot}`, 14, CP.ink);
        ht.position.set(w - 84, -7);
        c.addChild(hb, ht);
      }
      clickable(c, () => {
        if (this.busy || this.ctx.busy || bn.id === this.b.id) return;
        this.b = bn;
        if (!modesFor(bn).includes(this.mode)) this.mode = 'normal';
        this.save();
        this.build();
      });
      this.tabs.addChild(c);
    });
  }

  private buildPoster() {
    this.clear(this.poster);
    for (const t of this.anim) t.kill();
    this.anim = [];
    const b = this.b;
    const y0 = 214;
    const ph = 556;
    const p = this.poster;
    const pl = pityLeft(b);
    const hot = pl.hot > 0;
    const bg = new Graphics();
    bg.rect(X0 + 10, y0 + 10, PW, ph).fill(hot ? GOLD : CP.ink);
    bg.rect(X0, y0, PW, ph).fill(b.id === 'cofre' ? 0xf0e2c8 : hot ? 0x2a1600 : 0x160b1b).stroke({ width: hot ? 8 : 5, color: hot ? GOLD : CP.ink, alignment: 1 });
    p.addChild(bg);
    const ht = new TilingSprite({ texture: halftoneTexture(hot ? GOLD : b.accent, 16, 3), width: PW, height: ph });
    ht.position.set(X0, y0);
    ht.alpha = b.id === 'cofre' ? 0.18 : 0.14;
    p.addChild(ht);
    const mask = new Graphics().rect(X0, y0, PW, ph).fill(0xffffff);
    const art = new Container();
    art.mask = mask;
    p.addChild(mask, art);
    const circle = new Graphics().circle(0, 0, 250).fill(hot ? GOLD : b.accent);
    circle.position.set(X0 + PW * 0.72, y0 + ph * 0.48);
    art.addChild(circle);
    if (b.id === 'michi') this.artMichi(art, X0 + PW * 0.72, y0 + ph * 0.48, hot);
    else if (b.id === 'holo') this.artHolo(art, X0 + PW * 0.72, y0 + ph * 0.5);
    else this.artCofre(art, X0 + PW * 0.72, y0 + ph * 0.53);
    // title block
    const dark = b.id !== 'cofre';
    const kick = label(b.kicker, 16, dark ? b.accent2 : CP.red, { letterSpacing: 3 });
    kick.position.set(X0 + 40, y0 + 34);
    const words = b.name.split(' ');
    const t1 = txt(words[0], { fontFamily: F.poster, fontSize: 130, fill: dark ? CP.paper : CP.ink, letterSpacing: -3 });
    t1.position.set(X0 + 34, y0 + 52);
    const t2 = txt(words.slice(1).join(' '), { fontFamily: F.poster, fontSize: 130, fill: hot ? GOLD : b.accent, letterSpacing: -3 });
    t2.position.set(X0 + 34, y0 + 182);
    const ghost = txt(words.slice(1).join(' '), { fontFamily: F.poster, fontSize: 130, fill: b.accent2, letterSpacing: -3 });
    ghost.position.set(X0 + 40, y0 + 178);
    ghost.alpha = 0.55;
    const tag = txt(b.tagline, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: dark ? CP.paper : CP.ink, wordWrap: true, wordWrapWidth: 420, lineHeight: 26 });
    tag.position.set(X0 + 40, y0 + 338);
    p.addChild(kick, t1, ghost, t2, tag);
    if (b.id === 'holo') {
      const f = featuredCat();
      if (f) {
        const def = catDef(f);
        const fl = label('DESTACADO', 16, CP.yellow, { letterSpacing: 3 });
        fl.position.set(X0 + 40, y0 + 432);
        const fn = heading(def.name.toUpperCase(), 40, CP.paper);
        fn.position.set(X0 + 40, y0 + 450);
        p.addChild(fl, fn);
        def.elements.forEach((e, i) => {
          const ic = elementIcon(e, 32);
          ic.position.set(X0 + 60 + fn.width + 16 + i * 36, y0 + 476);
          p.addChild(ic);
        });
      }
    }
    // candy ribbons: RACHA CALIENTE / SUERTE DE PRINCIPIANTE (the machine looks different when luck is on your side)
    const ribbon = (text: string, col: number, y: number) => {
      const r = new Container();
      const tt = heading(text, 26, CP.ink);
      const g = new Graphics().rect(6, 6, tt.width + 36, 42).fill(CP.ink).rect(0, 0, tt.width + 36, 42).fill(col).stroke({ width: 3, color: CP.ink });
      tt.position.set(18, 4);
      r.addChild(g, tt);
      r.position.set(X0 + PW - tt.width - 70, y);
      r.rotation = -0.03;
      p.addChild(r);
      this.anim.push(gsap.to(r, { y: y - 4, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    };
    if (hot) ribbon(`RACHA CALIENTE · LEGENDARIO x2.5 · ${pl.hot} ${pl.hot === 1 ? 'TIRO' : 'TIROS'}`, GOLD, y0 + 22);
    else if (pl.beginner) ribbon(`SUERTE DE PRINCIPIANTE · LEGENDARIO SEGURO EN ${pl.legendary}`, CP.cyan, y0 + 22);
    else if (b.hasCats && pl.legendary <= 5) ribbon(`¡YA CASI! LEGENDARIO SEGURO EN ${pl.legendary}`, CP.yellow, y0 + 22);
    // odds strip (the NEXT pull, in the selected mode — ramps included)
    const odds = modeOdds(b, this.mode);
    const tiers = TIER_ORDER.filter((t) => odds[t] > 0 || (this.mode === 'normal' && b.tiers[t] > 0));
    const sw = (PW - 40) / Math.max(1, tiers.length);
    tiers.forEach((t, i) => {
      const c = new Container();
      c.position.set(X0 + 20 + i * sw, y0 + ph - 62);
      const g = new Graphics().rect(0, 0, sw - 8, 46).fill(TIER_COL[t]).stroke({ width: 3, color: CP.ink });
      const name = this.mode !== 'normal' && t === 'common' ? 'NADA' : TIER_NAME[t];
      const tt = heading(`${name} ${fmtP(odds[t])}`, tiers.length > 5 ? 19 : 24, CP.ink);
      tt.position.set(8, 9);
      if (tt.width > sw - 20) tt.scale.set((sw - 20) / tt.width);
      c.addChild(g, tt);
      if (this.mode === 'normal' && odds[t] > b.tiers[t] + 1e-6 && t !== 'common' && t !== 'rare') {
        const up = new Graphics().rect(sw - 56, -14, 50, 20).fill(CP.ink);
        const ut = label('SUBIÓ', 12, CP.yellow);
        ut.position.set(sw - 50, -12);
        c.addChild(up, ut);
      }
      p.addChild(c);
    });
  }

  private artMichi(c: Container, x: number, y: number, hot: boolean) {
    const ring = new Graphics();
    ring.circle(0, 0, 210).stroke({ width: 18, color: CP.ink });
    ring.circle(0, 0, 186).stroke({ width: 4, color: hot ? CP.ink : CP.cyan });
    ring.circle(6, -4, 230).stroke({ width: 5, color: hot ? 0xffffff : CP.cyan, alpha: 0.6 });
    ring.circle(-6, 4, 230).stroke({ width: 5, color: CP.yellow, alpha: 0.6 });
    ring.position.set(x, y);
    c.addChild(ring);
    this.anim.push(gsap.to(ring, { rotation: Math.PI * 2, duration: hot ? 8 : 30, ease: 'none', repeat: -1 }));
    // Lumen (la Fotógrafa) peeks out of the michi portal while you don't have her
    const pool = gachaCats().filter((d) => d.rarity !== 'common');
    const lumen = pool.find((d) => d.id === 's_lumen' && G.s.catdex[d.id] !== 'registered');
    const rest = pool.filter((d) => d !== lumen).sort((a, b) => b.rarity.localeCompare(a.rarity));
    const pick = lumen ? [rest[0], rest[1], lumen].filter(Boolean) : rest.slice(0, 3);
    const pos = [
      [-150, 60, 250],
      [150, 60, 250],
      [0, 0, 320],
    ];
    pick.forEach((d, i) => {
      const a = catArt(d.id, pos[i][2]);
      a.position.set(x + pos[i][0], y + pos[i][1]);
      c.addChild(a);
      this.anim.push(gsap.to(a, { y: a.y - 10, duration: 1.6 + i * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    });
    if (lumen) {
      const l = label('LUMEN RONDA EL PORTAL', 15, CP.ink);
      const lb = new Graphics().rect(0, 0, l.width + 20, 26).fill(CP.yellow).stroke({ width: 3, color: CP.ink });
      l.position.set(10, 3);
      const cc = new Container();
      cc.addChild(lb, l);
      cc.position.set(x - (l.width + 20) / 2, y + 180);
      c.addChild(cc);
    }
  }

  private artHolo(c: Container, x: number, y: number) {
    const f = featuredCat();
    if (!f) return;
    const a = catArt(f, 480);
    a.position.set(x, y);
    c.addChild(a);
    const s = holoSheen(520, 540, 0.9);
    s.position.set(x - 260, y - 270);
    const m = new Graphics().circle(x, y, 250).fill(0xffffff);
    s.mask = m;
    c.addChild(m, s);
    const st = new Graphics();
    st.star(x + 190, y - 180, 4, 34, 10).fill(CP.paper);
    st.star(x - 210, y + 150, 4, 24, 8).fill(CP.cyan);
    c.addChild(st);
    this.anim.push(gsap.to(a, { y: y - 12, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  }

  private artCofre(c: Container, x: number, y: number) {
    const ch = new Graphics();
    ch.roundRect(-170, -40, 340, 170, 12).fill(0x7a3a20).stroke({ width: 6, color: CP.ink });
    ch.moveTo(-170, -40).bezierCurveTo(-170, -170, 170, -170, 170, -40).closePath().fill(0x8f4626).stroke({ width: 6, color: CP.ink });
    for (const sx of [-110, 110]) ch.rect(sx - 14, -150, 28, 280).fill(CP.gold).stroke({ width: 4, color: CP.ink });
    ch.rect(-174, -46, 348, 22).fill(CP.gold).stroke({ width: 4, color: CP.ink });
    ch.roundRect(-30, -40, 60, 60, 8).fill(CP.gold).stroke({ width: 4, color: CP.ink });
    ch.circle(0, -12, 9).fill(CP.ink);
    ch.position.set(x, y);
    c.addChild(ch);
    const ids = ['corona', 'chistera', 'lentes_sol', 'capa_heroe', 'tricornio', 'cadena_oro', 'aureola_glitch', 'mono'];
    ids.forEach((id, i) => {
      const a = (i / ids.length) * Math.PI * 2;
      const it = drawAccessory(id, 96);
      it.position.set(x + Math.cos(a) * 250, y - 40 + Math.sin(a) * 170);
      c.addChild(it);
      this.anim.push(gsap.to(it, { y: it.y - 14, rotation: 0.12, duration: 1.2 + (i % 3) * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    });
  }

  private buildControls() {
    this.clear(this.controls);
    const b = this.b;
    const y = 790;
    const c = this.controls;
    // guarantees
    const pl = pityLeft(b);
    const po = pityOf(b);
    const caps = pityCaps(b);
    const bar = (yy: number, labelTxt: string, frac: number, col: number) => {
      const t = label(labelTxt, 16, CP.paper);
      t.position.set(X0, yy);
      const g = new Graphics();
      g.rect(X0, yy + 24, 440, 20).fill(0x24132a).stroke({ width: 3, color: CP.ink });
      g.rect(X0 + 3, yy + 27, Math.max(0, Math.min(1, frac) * 434), 14).fill(col);
      for (let i = 1; i < 10; i++) g.rect(X0 + i * 44, yy + 27, 2, 14).fill({ color: CP.ink, alpha: 0.4 });
      c.addChild(t, g);
    };
    bar(y, `ÉPICO o mejor garantizado en ${pl.epic} ${pl.epic === 1 ? 'tiro' : 'tiros'}`, po.e / b.epicPity, CP.pink);
    bar(y + 54, `LEGENDARIO o mejor a más tardar en ${pl.legendary} ${pl.legendary === 1 ? 'tiro' : 'tiros'}${caps.beginner ? ' (principiante)' : ''}`, po.l / caps.hard, pl.hot ? GOLD : CP.yellow);
    const extra = [b.catPity ? `GATO en ${pl.cat}` : '', b.mythicPity ? `MÍTICO a más tardar en ${pl.mythic}` : '', pl.hot ? `RACHA CALIENTE: ${pl.hot}` : ''].filter(Boolean).join(' · ');
    if (extra) {
      const e = label(extra, 14, pl.hot ? GOLD : CP.softPink);
      e.position.set(X0, y + 106);
      c.addChild(e);
    }
    const od = new Container();
    od.addChild(block(300, 44, CP.cyan, { off: 5, border: 3 }));
    const ot = heading('VER PROBABILIDADES', 24, CP.ink);
    ot.position.set(20, 6);
    od.addChild(ot);
    od.position.set(X0, y + 140);
    clickable(od, () => openOdds('gacha', 'gems', 0, b.id, this.mode));
    c.addChild(od);
    // pay with
    const rx = X0 + 480;
    const pw = new Seg<PayWith>(
      [
        { v: 'tickets', label: 'BOLETOS', icon: ticketIcon(26) },
        { v: 'gems', label: 'GEMAS', icon: curIcon('gems', 24) },
      ],
      this.pay,
      (v) => {
        this.pay = v;
        this.save();
        this.buildControls();
      },
      { w: 160, h: 44, size: 22, gap: 8 },
    );
    pw.position.set(rx, y);
    const pt = label('PAGAR CON', 13, CP.softPink, { letterSpacing: 2 });
    pt.position.set(rx, y - 20);
    const have = label(this.pay === 'gems' ? `Tienes ${G.s.gems} gemas` : `Tienes ${tickets()} boletos · salen peleando, en La Caja y la Tragamichis`, 14, CP.softPink, { wordWrap: true, wordWrapWidth: 220 });
    have.position.set(rx + 344, y - 4);
    c.addChild(pt, pw, have);
    // risk mode (cat banners)
    const modes = modesFor(b);
    let by = y + 60;
    if (modes.length > 1) {
      const ms = new Seg<GachaMode>(
        modes.map((m) => ({ v: m, label: `${MODES[m].name}` })),
        this.mode,
        (v) => {
          this.mode = v;
          this.save();
          this.buildPoster();
          this.buildControls();
          this.ctx.say(v === 'todo' ? 'riskAll' : v === 'riesgo' ? 'riskHigh' : 'gacha', 0.7);
        },
        { w: 180, h: 40, size: 20, gap: 8, color: this.mode === 'todo' ? CP.red : this.mode === 'riesgo' ? CP.pink : CP.yellow },
      );
      ms.position.set(rx, by);
      c.addChild(ms);
      by += 56;
    }
    const costTxt = (n: 1 | 10) => {
      const k = pullCost(b, n, this.pay, this.mode);
      return this.pay === 'tickets' ? `${k} ${k === 1 ? 'BOLETO' : 'BOLETOS'}` : `${k} GEMAS`;
    };
    if (this.mode === 'normal') {
      const b1 = new CButton('INVOCAR x1', () => this.doPull(1), { w: 250, h: 96, color: this.n === 1 ? CP.paper : CP.paperDark, size: 38, sub: costTxt(1) });
      b1.position.set(rx, by);
      b1.disabled = !canPull(b, 1, this.pay);
      const b10 = new CButton('INVOCAR x10', () => this.doPull(10), { w: 300, h: 96, color: b.accent === CP.yellow ? CP.yellow : CP.pink, size: 42, sub: costTxt(10) });
      b10.position.set(rx + 266, by);
      b10.disabled = !canPull(b, 10, this.pay);
      c.addChild(b1, b10);
    } else {
      const md = MODES[this.mode];
      const bt = new CButton(this.mode === 'todo' ? '¡TODO O NADA!' : '¡ARRIESGAR!', () => this.doPull(1), { w: 566, h: 96, color: this.mode === 'todo' ? CP.red : CP.pink, fg: this.mode === 'todo' ? CP.paper : CP.ink, size: 44, sub: `${costTxt(1)} · ${md.blurb.split(':').slice(1).join(':').trim()}` });
      bt.position.set(rx, by);
      bt.disabled = !canPull(b, 1, this.pay, this.mode);
      c.addChild(bt);
    }
  }

  primary() {
    this.doPull(this.mode === 'normal' ? this.n : 1);
  }

  // ---- AutoHost
  autoBalance() {
    return this.pay === 'tickets' ? tickets() : G.s.gems;
  }
  autoName() {
    return `PORTAL · ${this.mode === 'normal' ? `x${this.n}` : MODES[this.mode].name}`;
  }
  async autoStep(speed: AutoSpeed): Promise<AutoOutcome> {
    const n = this.mode === 'normal' ? this.n : 1;
    if (!canPull(this.b, n, this.pay, this.mode)) return { ok: false };
    const cost = pullCost(this.b, n, this.pay, this.mode);
    if (speed < 99) this.ctx.freeze(this.pay === 'tickets' ? { tickets: -cost } : { gems: -cost });
    const res = pull(this.b.id, n, this.pay, this.mode);
    if (!res) {
      this.ctx.unfreeze();
      return { ok: false };
    }
    this.ctx.refresh();
    if (speed >= 99) await this.turboShow(res);
    else await this.present(res, speed, true);
    return outcomeOf(res);
  }
  /** the auto-play run ended: rebuild everything once */
  onAutoStop() {
    if (this.destroyed) return;
    this.hideTurbo();
    this.build();
  }

  private async doPull(n: 1 | 10) {
    if (this.busy || this.ctx.busy) return;
    const b = this.b;
    if (this.mode !== 'normal') n = 1;
    else if (this.n !== n) {
      this.n = n;
      this.save();
    }
    if (!canPull(b, n, this.pay, this.mode)) {
      sfx('error');
      this.ctx.say('poor');
      return;
    }
    this.ctx.freeze(this.pay === 'tickets' ? { tickets: -pullCost(b, n, 'tickets', this.mode) } : { gems: -pullCost(b, n, 'gems', this.mode) });
    const res = pull(b.id, n, this.pay, this.mode);
    if (!res) {
      this.ctx.unfreeze();
      return;
    }
    this.ctx.setBusy(true);
    await this.present(res, 1, false);
    this.ctx.setBusy(false);
    if (!this.destroyed) this.build();
  }

  private async present(res: Pull[], speed: number, auto: boolean) {
    this.busy = true;
    this.ctx.refresh();
    const ev: Ev = this.mode === 'todo' ? 'riskAll' : this.mode === 'riesgo' ? 'riskHigh' : res.length === 10 ? 'gachaX10' : 'gacha';
    if (!auto || speed === 1) {
      this.ctx.say(ev, auto ? 0.3 : 1);
      this.ctx.chat(ev, 2);
    }
    lounge.hype(0.8);
    const { playSummon } = await import('../../fx/sequences/gachaSummon');
    await playSummon(this.ctx.top, res, this.b, {
      speed,
      auto,
      reveal: auto ? revealPlanFor(speed) : undefined,
      onEvent: (e) => {
        const map = { epic: 'gachaEpic', legend: 'gachaLegend', holo: 'gachaHolo', mythic: 'gachaMythic', meh: 'gachaMeh', escape: 'escape', first: 'firstLegend' } as const;
        const big = e !== 'meh' && e !== 'epic';
        if (auto && !big && speed > 1) return;
        this.ctx.say(map[e]);
        this.ctx.chat(map[e], e === 'meh' ? 1 : 3);
      },
    });
    lounge.hype(0);
    this.ctx.unfreeze();
    this.busy = false;
    if (auto && !this.destroyed) {
      // cheap refresh between auto pulls: the poster/pity change, rebuild them (no per-pull leaks: old children are destroyed)
      this.buildTabs();
      this.buildPoster();
      this.buildControls();
    }
  }

  // ---------------------------------------------------------------- TURBO results strip (reused objects)
  private ensureTurbo() {
    if (this.turbo && Date.now() - this.turbo.last < 4000) return this.turbo;
    this.hideTurbo();
    const box = this.turboBox;
    const bg = new Graphics().rect(X0 + 8, 646 + 8, PW - 120, 112).fill(CP.ink).rect(X0, 646, PW - 120, 112).fill(0x0b0f0c).stroke({ width: 4, color: CP.cyan });
    const h = label('TURBO · RESULTADOS', 14, CP.cyan, { letterSpacing: 3 });
    h.position.set(X0 + 16, 654);
    const t = label('', 20, CP.paper);
    t.position.set(X0 + 16, 676);
    const chips = new Graphics();
    chips.position.set(X0 + 16, 712);
    box.addChild(bg, h, t, chips);
    this.turbo = { t, chips, log: [], pulls: 0, epic: 0, legend: 0, fresh: 0, last: Date.now() };
    return this.turbo;
  }
  private hideTurbo() {
    this.clear(this.turboBox);
    this.turbo = null;
  }
  private async turboShow(res: Pull[]) {
    const tb = this.ensureTurbo();
    tb.last = Date.now();
    for (const p of res) {
      tb.pulls += this.mode === 'normal' ? 1 : MODES[this.mode].cost;
      const r = rankOf(p.tier);
      if (r >= 2) tb.epic++;
      if (r >= 3) tb.legend++;
      if (p.got.kind === 'cat' && p.got.isNew) tb.fresh++;
      tb.log.push(p.tier);
    }
    if (tb.log.length > 40) tb.log.splice(0, tb.log.length - 40);
    tb.t.text = `${tb.pulls} tiros · ÉPICO+ ${tb.epic} · LEGENDARIO+ ${tb.legend} · gatos nuevos ${tb.fresh}`;
    const g = tb.chips.clear();
    tb.log.forEach((t, i) => g.rect(i * 22, 0, 18, 30).fill(TIER_COL[t]).stroke({ width: 2, color: CP.ink }));
    this.ctx.unfreeze();
    const escaped = res.find((p) => p.escaped);
    if (escaped) this.ctx.say('escape');
    const best = res.reduce((m, p) => Math.max(m, rankOf(p.tier)), 0);
    if (best >= 3) {
      sfx('fanfare');
      this.ctx.say(best >= 5 ? 'gachaMythic' : 'gachaLegend', 0.6);
    }
    // only NEW legendary+ cats interrupt TURBO (with a fast, self-closing reveal)
    await revealCats(this.ctx.top, res.map((p) => p.got), revealPlanFor(99));
  }

  dispose() {
    for (const t of this.anim) t.kill();
  }
}

function outcomeOf(res: Pull[]): AutoOutcome {
  const cats = res.filter((p) => p.got.kind === 'cat');
  return {
    ok: true,
    big: cats.some((p) => catRank(p.got) >= 2 && !!p.got.isNew) || res.some((p) => rankOf(p.tier) >= 3),
    legend: res.some((p) => rankOf(p.tier) >= 3),
    newCat: cats.some((p) => !!p.got.isNew),
  };
}

function fmtP(p: number) {
  return p >= 0.1 ? `${Math.round(p * 1000) / 10}%` : p >= 0.01 ? `${Math.round(p * 1000) / 10}%` : `${Math.round(p * 10000) / 100}%`;
}
export type { Text };
