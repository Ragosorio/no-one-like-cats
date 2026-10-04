/**
 * PORTAL DEL MULTIVERSO (gacha): banners with visible odds and pity, single / x10 pulls,
 * paid with Boletos or Ojos de Gato. The summon animation lives in fx/sequences/gachaSummon.ts.
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
import { BANNERS, Banner, PayWith, TIER_NAME, TIER_ORDER, banner, canPull, featuredCat, pityLeft, pityOf, pull, pullCost, tierOdds } from '../../state/sys/gacha';
import { eligibleCats, tickets } from '../../state/sys/casino';
import { CP, CButton, Seg, block, clickable, curIcon, heading, label, neon, ticketIcon } from './kit';
import { TIER_COL, catArt, revealCats } from './prizes';
import { drawAccessory } from './accessoryArt';
import { holoSheen } from '../../fx/sequences/gachaHolo';
import { openOdds } from './OddsPanel';
import { lounge } from './lounge';
import type { CasinoCtx, CasinoView } from './ctx';

const X0 = 360;
const PW = 1046;

export class GachaView extends Container implements CasinoView {
  private b: Banner;
  private pay: PayWith = 'tickets';
  private tabs = new Container();
  private poster = new Container();
  private controls = new Container();
  private busy = false;
  private anim: gsap.core.Tween[] = [];

  constructor(
    private ctx: CasinoCtx,
    bannerId?: string,
  ) {
    super();
    this.b = banner(bannerId);
    this.pay = tickets() > 0 ? 'tickets' : 'gems';
    this.addChild(this.tabs, this.poster, this.controls);
    this.build();
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
      clickable(c, () => {
        if (this.busy || bn.id === this.b.id) return;
        this.b = bn;
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
    const bg = new Graphics();
    bg.rect(X0 + 10, y0 + 10, PW, ph).fill(CP.ink);
    bg.rect(X0, y0, PW, ph).fill(b.id === 'cofre' ? 0xf0e2c8 : 0x160b1b).stroke({ width: 5, color: CP.ink, alignment: 1 });
    p.addChild(bg);
    const ht = new TilingSprite({ texture: halftoneTexture(b.accent, 16, 3), width: PW, height: ph });
    ht.position.set(X0, y0);
    ht.alpha = b.id === 'cofre' ? 0.18 : 0.14;
    p.addChild(ht);
    const mask = new Graphics().rect(X0, y0, PW, ph).fill(0xffffff);
    const art = new Container();
    art.mask = mask;
    p.addChild(mask, art);
    // big circle (Swiss poster) + art per banner
    const circle = new Graphics().circle(0, 0, 250).fill(b.accent);
    circle.position.set(X0 + PW * 0.72, y0 + ph * 0.48);
    art.addChild(circle);
    if (b.id === 'michi') this.artMichi(art, X0 + PW * 0.72, y0 + ph * 0.48);
    else if (b.id === 'holo') this.artHolo(art, X0 + PW * 0.72, y0 + ph * 0.5);
    else this.artCofre(art, X0 + PW * 0.72, y0 + ph * 0.53);
    // title block
    const dark = b.id !== 'cofre';
    const kick = label(b.kicker, 16, dark ? b.accent2 : CP.red, { letterSpacing: 3 });
    kick.position.set(X0 + 40, y0 + 34);
    const words = b.name.split(' ');
    const t1 = txt(words[0], { fontFamily: F.poster, fontSize: 130, fill: dark ? CP.paper : CP.ink, letterSpacing: -3 });
    t1.position.set(X0 + 34, y0 + 52);
    const t2 = txt(words.slice(1).join(' '), { fontFamily: F.poster, fontSize: 130, fill: b.accent, letterSpacing: -3 });
    t2.position.set(X0 + 34, y0 + 182);
    const ghost = txt(words.slice(1).join(' '), { fontFamily: F.poster, fontSize: 130, fill: b.accent2, letterSpacing: -3 });
    ghost.position.set(X0 + 40, y0 + 178);
    ghost.alpha = 0.55;
    const tag = txt(b.tagline, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: dark ? CP.paper : CP.ink, wordWrap: true, wordWrapWidth: 400, lineHeight: 28 });
    tag.position.set(X0 + 40, y0 + 342);
    p.addChild(kick, t1, ghost, t2, tag);
    if (b.id === 'holo') {
      const f = featuredCat();
      if (f) {
        const def = catDef(f);
        const fl = label('DESTACADO', 16, CP.yellow, { letterSpacing: 3 });
        fl.position.set(X0 + 40, y0 + 410);
        const fn = heading(def.name.toUpperCase(), 44, CP.paper);
        fn.position.set(X0 + 40, y0 + 428);
        p.addChild(fl, fn);
        def.elements.forEach((e, i) => {
          const ic = elementIcon(e, 34);
          ic.position.set(X0 + 60 + fn.width + 16 + i * 38, y0 + 456);
          p.addChild(ic);
        });
      }
    }
    // odds strip
    const odds = tierOdds(b);
    const tiers = TIER_ORDER.filter((t) => b.tiers[t] > 0);
    const sw = (PW - 40) / tiers.length;
    tiers.forEach((t, i) => {
      const c = new Container();
      c.position.set(X0 + 20 + i * sw, y0 + ph - 62);
      const g = new Graphics().rect(0, 0, sw - 10, 46).fill(TIER_COL[t]).stroke({ width: 3, color: CP.ink });
      const tt = heading(`${TIER_NAME[t]} ${fmtP(odds[t])}`, 24, CP.ink);
      tt.position.set(12, 7);
      c.addChild(g, tt);
      if (Math.abs(odds[t] - b.tiers[t]) > 1e-6) {
        const up = label(odds[t] > b.tiers[t] ? 'SUBIÓ' : '', 12, CP.ink);
        up.anchor.set(1, 0);
        up.position.set(sw - 18, 4);
        c.addChild(up);
      }
      p.addChild(c);
    });
  }

  private artMichi(c: Container, x: number, y: number) {
    // portal rings
    const ring = new Graphics();
    ring.circle(0, 0, 210).stroke({ width: 18, color: CP.ink });
    ring.circle(0, 0, 186).stroke({ width: 4, color: CP.cyan });
    ring.circle(6, -4, 230).stroke({ width: 5, color: CP.cyan, alpha: 0.6 });
    ring.circle(-6, 4, 230).stroke({ width: 5, color: CP.yellow, alpha: 0.6 });
    ring.position.set(x, y);
    c.addChild(ring);
    this.anim.push(gsap.to(ring, { rotation: Math.PI * 2, duration: 30, ease: 'none', repeat: -1 }));
    const pool = eligibleCats().filter((d) => d.rarity !== 'common');
    const pick = [...pool].sort((a, b) => b.rarity.localeCompare(a.rarity)).slice(0, 3);
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
    // chest
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
    const y = 800;
    const c = this.controls;
    // pity bars
    const pl = pityLeft(b);
    const po = pityOf(b);
    const bar = (yy: number, labelTxt: string, frac: number, col: number) => {
      const t = label(labelTxt, 17, CP.paper);
      t.position.set(X0, yy);
      const g = new Graphics();
      g.rect(X0, yy + 26, 440, 22).fill(0x24132a).stroke({ width: 3, color: CP.ink });
      g.rect(X0 + 3, yy + 29, Math.max(0, 434 * frac), 16).fill(col);
      for (let i = 1; i < 10; i++) g.rect(X0 + i * 44, yy + 29, 2, 16).fill({ color: CP.ink, alpha: 0.4 });
      c.addChild(t, g);
    };
    bar(y, `ÉPICO o mejor garantizado en ${pl.epic} ${pl.epic === 1 ? 'tiro' : 'tiros'}`, po.e / b.epicPity, CP.pink);
    bar(y + 62, `LEGENDARIO o mejor a más tardar en ${pl.legendary} ${pl.legendary === 1 ? 'tiro' : 'tiros'}`, po.l / b.hardPity, CP.yellow);
    const od = new Container();
    od.addChild(block(300, 44, CP.cyan, { off: 5, border: 3 }));
    const ot = heading('VER PROBABILIDADES', 24, CP.ink);
    ot.position.set(20, 6);
    od.addChild(ot);
    od.position.set(X0, y + 140);
    clickable(od, () => openOdds('gacha', 'gems', 0, b.id));
    c.addChild(od);
    // pay with
    const pw = new Seg<PayWith>(
      [
        { v: 'tickets', label: 'BOLETOS', icon: ticketIcon(26) },
        { v: 'gems', label: 'GEMAS', icon: curIcon('gems', 24) },
      ],
      this.pay,
      (v) => {
        this.pay = v;
        this.buildControls();
      },
      { w: 160, h: 48, size: 22, gap: 8 },
    );
    pw.position.set(X0 + 480, y);
    const pt = label('PAGAR CON', 13, CP.softPink, { letterSpacing: 2 });
    pt.position.set(X0 + 480, y - 20);
    c.addChild(pt, pw);
    const costTxt = (n: 1 | 10) => {
      const k = pullCost(b, n, this.pay);
      return this.pay === 'tickets' ? `${k} ${k === 1 ? 'BOLETO' : 'BOLETOS'}` : `${k} GEMAS`;
    };
    const b1 = new CButton('INVOCAR x1', () => this.doPull(1), { w: 250, h: 104, color: CP.paper, size: 40, sub: costTxt(1) });
    b1.position.set(X0 + 480, y + 70);
    b1.disabled = !canPull(b, 1, this.pay);
    const b10 = new CButton('INVOCAR x10', () => this.doPull(10), { w: 300, h: 104, color: b.accent === CP.yellow ? CP.yellow : CP.pink, size: 44, sub: costTxt(10) });
    b10.position.set(X0 + 746, y + 70);
    b10.disabled = !canPull(b, 10, this.pay);
    c.addChild(b1, b10);
    if (this.pay === 'gems') {
      const n = label(`Tienes ${G.s.gems} · x10 = 10 tiros por el precio de 9`, 14, CP.softPink, { wordWrap: true, wordWrapWidth: 210 });
      n.position.set(X0 + 820, y - 2);
      c.addChild(n);
    } else {
      const n = label(`Tienes ${tickets()} · salen en La Caja y la Tragamichis`, 14, CP.softPink, { wordWrap: true, wordWrapWidth: 210 });
      n.position.set(X0 + 820, y - 2);
      c.addChild(n);
    }
  }

  primary() {
    this.doPull(1);
  }

  private async doPull(n: 1 | 10) {
    if (this.busy || this.ctx.busy) return;
    const b = this.b;
    if (!canPull(b, n, this.pay)) {
      sfx('error');
      this.ctx.say('poor');
      return;
    }
    this.ctx.freeze(this.pay === 'tickets' ? { tickets: -pullCost(b, n, 'tickets') } : { gems: -pullCost(b, n, 'gems') });
    const res = pull(b.id, n, this.pay);
    if (!res) {
      this.ctx.unfreeze();
      return;
    }
    this.busy = true;
    this.ctx.setBusy(true);
    this.ctx.refresh();
    this.ctx.say(n === 10 ? 'gachaX10' : 'gacha');
    this.ctx.chat(n === 10 ? 'gachaX10' : 'gacha', 2);
    lounge.hype(0.8);
    const { playSummon } = await import('../../fx/sequences/gachaSummon');
    await playSummon(this.ctx.top, res, b, (ev) => {
      const map = { epic: 'gachaEpic', legend: 'gachaLegend', holo: 'gachaHolo', meh: 'gachaMeh' } as const;
      this.ctx.say(map[ev]);
      this.ctx.chat(map[ev], ev === 'meh' ? 1 : 3);
    });
    lounge.hype(0);
    this.ctx.unfreeze();
    await revealCats(this.ctx.top, res.map((p) => p.got));
    this.busy = false;
    this.ctx.setBusy(false);
    if (!this.destroyed) this.build();
  }

  dispose() {
    for (const t of this.anim) t.kill();
  }
}

function fmtP(p: number) {
  return p >= 0.1 ? `${Math.round(p * 1000) / 10}%` : `${Math.round(p * 1000) / 10}%`;
}
export type { Text };
