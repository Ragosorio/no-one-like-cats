/**
 * CASINO "EL GATO NEGRO" — the neon-glitch dimension of the multiverse (casino agent).
 * Tables come from panels/casino/games/registry.ts (grouped, scrollable left nav): Tragamichis, Ruleta, Plinko,
 * Duelo de Dados, Mayor o Menor, Bingo Exprés, Rasca y Gana, Cajas Misteriosas, Portal, La Caja, Accesorios.
 * Owns MODO ETERNO (panels/casino/eterno.ts): the 20-second overheating session over the current table.
 * Entered via panels/casino/open.ts (openCasino / openGacha). Leaves to the island with goIsland().
 * Owns the PILOTO AUTOMÁTICO (panels/casino/auto.ts, left column) and the LA CASA TE DEBE meter (top bar).
 * Remembers the last tab you played (saved with the stakes in G.s.casino.prefs).
 */
import { Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, Rectangle, Text } from 'pixi.js';
import gsap from 'gsap';
import { Scene, scenes } from '../core/scenes';
import { W, H } from '../core/App';
import { Shaker } from '../fx/juice';
import { Particles } from '../fx/particles';
import { music } from '../core/music';
import { speak, stopVoice, voice } from '../core/voice';
import { settings } from '../core/settings';
import { G } from '../state/game';
import { CANDY, chips, ensureGambitOpen, owed, prefs, syncChips, tickets } from '../state/sys/casino';
import { CP, Bubble, ChatFeed, Host, Marquee, ResPill, block, clickable, halftone, heading, label, neon, killDeep } from '../panels/casino/kit';
import { GAMES, GAME_BY_ID, GROUPS, isGame } from '../panels/casino/games/registry';
import { settleAbandoned } from '../state/sys/casino/eterno';
import { chatLines, hostLine, Ev } from '../panels/casino/lines';
import type { CasinoCtx, CasinoTab, CasinoView, PillKind } from '../panels/casino/ctx';
import { lounge } from '../panels/casino/lounge';
import { sfx } from '../core/audio';
import { AutoHost, AutoPanel, STOP_TEXT } from '../panels/casino/auto';
import { screenRect } from '../ui/screen';

const NAV = { x: 14, y: 194, w: 306, h: 598, row: 66, gap: 6, head: 30 } as const;

export class CasinoScene extends Scene {
  private root = new Container();
  private bg = new Container();
  private viewLayer = new Container();
  private fxLayer = new Container();
  private topLayer = new Container();
  private particles = new Particles();
  private shaker!: Shaker;
  private view: CasinoView | null = null;
  private tabBtns = new Map<CasinoTab, { c: Container; bg: Graphics; t: Text }>();
  private pills: Record<string, ResPill> = {};
  private host!: Host;
  private bubble!: Bubble;
  private chatFeed!: ChatFeed;
  private marquee!: Marquee;
  private voiceBtn!: { c: Container; t: Text; g: Graphics };
  private busyFlag = false;
  private frozen: Record<PillKind, number> | null = null;
  private held: Record<PillKind, number> = { gold: 0, gems: 0, chips: 0, tickets: 0 };
  private navList = new Container();
  private navScroll = 0;
  private navMax = 0;
  private navBar = new Graphics();
  private navMore!: Container;
  private navLess!: Container;
  private navDrag: { y0: number; s0: number; moved: boolean } | null = null;
  private navMoved = false;
  private eterno: { stop: (why: 'user' | 'gone') => void } | null = null;
  private leaveAfterEterno = false;
  private current: CasinoTab = 'slot';
  private offs: (() => void)[] = [];
  private lastSay = 0;
  private glitchT = 0;
  private bigCat!: Container;
  private auto!: AutoPanel;
  private owedG = new Graphics();
  private owedT!: Text;
  ctx!: CasinoCtx;

  constructor(
    public tab: 'floor' | 'gacha' = 'floor',
    public banner?: string,
  ) {
    super();
  }

  override enter() {
    this.addChild(this.root, this.topLayer);
    this.root.addChild(this.bg, this.viewLayer, this.particles, this.fxLayer);
    this.shaker = new Shaker(this.root, 22, 0.012);
    this.buildBg();
    this.buildChrome();
    this.ctx = this.makeCtx();
    this.buildAuto();
    music.play('silence');
    lounge.start();
    ensureGambitOpen();
    // an ETERNO session left open by a reload (before the explosion) = abandoned: no roll was drawn, nothing changes
    const ab = settleAbandoned();
    const got = syncChips();
    this.show(this.tab, this.banner);
    window.addEventListener('keydown', this.onKey);
    this.offs.push(G.on('res', () => this.refresh()));
    // greeting
    window.setTimeout(() => {
      if (this.destroyed) return;
      this.say('enter');
      this.chat('enter', 3);
      if (got.gained || got.tickets) {
        window.setTimeout(() => {
          if (this.destroyed) return;
          this.bubble.say(got.parts.join(' · ') + '.', 'LA CASA PAGA', CP.cyan);
          this.host.talk(1200);
          this.refresh();
        }, 3600);
      }
      if (ab) {
        this.bubble.say('La máquina del ETERNO se apagó sola cuando te fuiste: no hubo 50/50, no perdiste ni ganaste nada.', 'MODO ETERNO', CP.cyan);
        this.host.talk(1600);
      }
    }, 650);
  }

  /** switch tab (also used by openCasino/openGacha when already inside) */
  show(tab: 'floor' | 'gacha' | CasinoTab, banner?: string) {
    const last = prefs().tab;
    const t: CasinoTab = tab === 'floor' ? (isGame(last) && GAME_BY_ID.get(last)!.remember ? last : 'slot') : tab;
    this.go(t, banner);
  }

  private async go(tab: CasinoTab, arg?: string) {
    if (this.busyFlag) return;
    this.current = tab;
    const def = GAME_BY_ID.get(tab) ?? GAMES[0];
    if (def.remember) prefs().tab = tab;
    for (const [id, b] of this.tabBtns) this.drawTab(id, b, id === tab);
    this.scrollNavTo(tab);
    if (this.view) {
      this.view.dispose?.();
      killDeep(this.view);
      this.view.destroy({ children: true });
      this.view = null;
    }
    let v: CasinoView;
    try {
      v = await def.load(this.ctx, arg);
    } catch (e) {
      console.warn('[casino] table failed to load', tab, e);
      return;
    }
    if (this.destroyed || this.current !== tab) {
      v.dispose?.();
      v.destroy({ children: true });
      return;
    }
    this.view = v;
    this.viewLayer.addChild(v);
    this.auto?.setAvailable(!!this.autoHost());
    v.alpha = 0;
    gsap.to(v, { alpha: 1, duration: 0.2 });
    gsap.from(v, { x: 40, duration: 0.25, ease: 'power3.out' });
    this.refresh();
  }

  // ------------------------------------------------------------------ background (neon-glitch dimension in a Swiss poster)
  private buildBg() {
    const g = screenRect(CP.night);
    this.bg.addChild(g);
    // big poster shapes
    const shapes = new Graphics();
    shapes.circle(1030, 560, 470).fill({ color: CP.plum, alpha: 0.9 });
    shapes.poly([0, 0, 520, 0, 260, H, 0, H]).fill({ color: CP.night2 });
    shapes.rect(1420, 0, 6, H).fill({ color: CP.pink, alpha: 0.35 });
    shapes.rect(340, 92, W - 360, 3).fill({ color: CP.cyan, alpha: 0.3 });
    this.bg.addChild(shapes);
    // giant Le Chat Noir silhouette with halo (faint)
    const cat = new Container();
    const hg = new Graphics();
    hg.circle(0, 0, 360).fill({ color: CP.yellow, alpha: 0.07 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      hg.moveTo(Math.cos(a) * 380, Math.sin(a) * 380).lineTo(Math.cos(a) * 460, Math.sin(a) * 460).stroke({ width: 10, color: CP.yellow, alpha: 0.06, cap: 'round' });
    }
    const cg = new Graphics();
    cg.poly([-150, -60, -170, -280, -40, -150]).fill({ color: 0x000000, alpha: 0.35 });
    cg.poly([150, -60, 170, -280, 40, -150]).fill({ color: 0x000000, alpha: 0.35 });
    cg.ellipse(0, -60, 170, 135).fill({ color: 0x000000, alpha: 0.35 });
    cg.moveTo(-180, 400).bezierCurveTo(-240, 140, -120, 40, -70, 30).lineTo(80, 30).bezierCurveTo(150, 60, 230, 180, 190, 400).closePath().fill({ color: 0x000000, alpha: 0.35 });
    for (const sx of [-1, 1]) cg.ellipse(sx * 64, -75, 34, 24).fill({ color: CP.yellow, alpha: 0.2 });
    cat.addChild(hg, cg);
    cat.position.set(1030, 600);
    this.bigCat = cat;
    this.bg.addChild(cat);
    const dots = halftone(W, H, CP.pink, 0.07, 18, 2.2);
    this.bg.addChild(dots);
    // swiss marks
    const marks = new Graphics();
    const plus = (x: number, y: number, s: number) => marks.moveTo(x - s, y).lineTo(x + s, y).moveTo(x, y - s).lineTo(x, y + s);
    plus(1395, 120, 12);
    plus(1395, 1040, 12);
    plus(360, 1050, 10);
    marks.stroke({ width: 2, color: CP.paper, alpha: 0.5 });
    for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) marks.circle(1290 + x * 16, 980 + y * 16, 2.4).fill({ color: CP.cyan, alpha: 0.6 });
    this.bg.addChild(marks);
    // scanlines
    const scan = new Graphics();
    for (let y = 0; y < H; y += 4) scan.rect(0, y, W, 1.5).fill({ color: 0x000000, alpha: 0.12 });
    this.bg.addChild(scan);
  }

  // ------------------------------------------------------------------ chrome: logo, nav, top bar, host, chat
  private buildChrome() {
    // left column poster
    const col = new Graphics().rect(0, 0, 330, H).fill(CP.ink).rect(326, 0, 4, H).fill(CP.pink);
    this.bg.addChild(col);
    // logo: halo + cat + stacked neon
    const logo = new Container();
    const lg = new Graphics();
    lg.circle(70, 78, 52).fill(CP.yellow).stroke({ width: 4, color: CP.ink });
    lg.poly([40, 72, 36, 22, 64, 50]).fill(CP.ink);
    lg.poly([100, 72, 104, 22, 76, 50]).fill(CP.ink);
    lg.ellipse(70, 74, 38, 30).fill(CP.ink);
    lg.moveTo(42, 130).bezierCurveTo(36, 100, 50, 92, 58, 92).lineTo(84, 92).bezierCurveTo(94, 94, 104, 110, 98, 130).closePath().fill(CP.ink);
    lg.ellipse(56, 72, 8, 6).fill(CP.yellow).ellipse(84, 72, 8, 6).fill(CP.yellow);
    lg.ellipse(56, 72, 2, 6).fill(CP.ink).ellipse(84, 72, 2, 6).fill(CP.ink);
    logo.addChild(lg);
    const l1 = neon('EL GATO', 52, CP.pink);
    l1.position.set(132, 22);
    const l2 = neon('NEGRO', 64, CP.cyan);
    l2.position.set(132, 70);
    const l3 = label('CASINO · CLUB · MULTIVERSO', 13, CP.yellow, { letterSpacing: 2 });
    l3.position.set(24, 150);
    logo.addChild(l1, l2, l3);
    logo.position.set(10, 14);
    this.bg.addChild(logo);
    // neon sign flickers on
    if (!settings.reduceFlashes) {
      const seq = [0.2, 1, 0.1, 0.9, 0.3, 1];
      seq.forEach((a, i) => window.setTimeout(() => {
        if (!l1.destroyed) l1.alpha = a;
        if (!l2.destroyed) l2.alpha = seq[(i + 2) % seq.length];
      }, 120 + i * 90));
    }
    // floating neon motes (atmosphere)
    for (let i = 0; i < 18; i++) {
      const m = new Graphics().circle(0, 0, 2 + Math.random() * 3).fill([CP.pink, CP.cyan, CP.yellow][i % 3]);
      m.position.set(340 + Math.random() * 1560, 120 + Math.random() * 940);
      m.alpha = 0.25 + Math.random() * 0.35;
      this.bg.addChild(m);
      gsap.to(m, { y: m.y - 80 - Math.random() * 120, x: m.x + (Math.random() - 0.5) * 60, alpha: 0.05, duration: 5 + Math.random() * 6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: Math.random() * 3 });
    }
    this.marquee = new Marquee(306, 176, 30);
    this.marquee.position.set(12, 12);
    this.bg.addChild(this.marquee);
    // nav (registry, grouped, scrollable): wheel, drag or the arrows
    this.buildNav();
    // exit
    const ex = new Container();
    const exBg = block(270, 70, CP.paper, { off: 6, border: 4 });
    const arrow = new Graphics().poly([24, 35, 46, 18, 46, 28, 70, 28, 70, 42, 46, 42, 46, 52]).fill(CP.ink);
    const exT = heading('A LA ISLA', 36, CP.ink);
    exT.position.set(86, 12);
    ex.addChild(exBg, arrow, exT);
    ex.position.set(24, H - 110);
    clickable(ex, () => this.leave());
    this.bg.addChild(ex);
    const info = label('Reglas de la casa', 15, CP.softPink, { letterSpacing: 1 });
    info.position.set(28, H - 30);
    clickable(info, async () => (await import('../panels/casino/OddsPanel')).openOdds('rules'));
    this.bg.addChild(info);
    // top bar pills
    const kinds: [string, PillKind, () => number][] = [
      ['gold', 'gold', () => this.frozen?.gold ?? G.s.gold],
      ['gems', 'gems', () => this.frozen?.gems ?? G.s.gems],
      ['chips', 'chips', () => this.frozen?.chips ?? chips()],
      ['tickets', 'tickets', () => this.frozen?.tickets ?? tickets()],
    ];
    kinds.forEach(([k, kind, get], i) => {
      const p = new ResPill(kind, () => get() - (this.frozen ? 0 : this.held[kind]), i === 0 ? 220 : 170);
      p.position.set(362 + (i === 0 ? 0 : 220 + 14 + (i - 1) * 184), 22);
      this.bg.addChild(p);
      this.pills[k] = p;
    });
    const nm = label('ORO · OJOS DE GATO · FICHAS · BOLETOS', 12, CP.softPink, { letterSpacing: 2 });
    nm.position.set(366, 80);
    this.bg.addChild(nm);
    // LA CASA TE DEBE: losing bets fill it; when full the house pays a boleto
    this.owedT = label('', 12, CP.cyan, { letterSpacing: 2 });
    this.owedT.position.set(760, 80);
    this.owedG.position.set(940, 80);
    this.bg.addChild(this.owedT, this.owedG);
    clickable(this.owedT, async () => (await import('../panels/casino/OddsPanel')).openOdds('rules'));
    // voice toggle
    const vc = new Container();
    const vg = new Graphics();
    const vt = heading('', 24, CP.ink);
    vt.position.set(56, 9);
    vc.addChild(vg, vt);
    vc.position.set(1210, 22);
    clickable(vc, () => {
      voice.enabled = !voice.enabled;
      this.drawVoice();
      if (voice.enabled) this.say('enter');
    });
    this.voiceBtn = { c: vc, t: vt, g: vg };
    this.bg.addChild(vc);
    this.drawVoice();
    // right column: bubble, host, chat
    this.host = new Host(250);
    this.host.position.set(1735, 470);
    const plate = new Container();
    const pb = block(250, 40, CP.pink, { off: 5, border: 3 });
    const pt = heading('MADAME NOIR · CRUPIER', 22, CP.ink);
    pt.position.set(14, 5);
    plate.addChild(pb, pt);
    plate.position.set(1610, 600);
    this.bubble = new Bubble(440);
    this.bubble.position.set(1446, 128);
    this.chatFeed = new ChatFeed(440, 360);
    this.chatFeed.position.set(1446, 676);
    this.bg.addChild(this.host, plate, this.chatFeed);
    this.root.addChild(this.bubble);
  }

  private drawVoice() {
    const on = voice.enabled && voice.supported;
    const { g, t } = this.voiceBtn;
    g.clear();
    g.rect(5, 5, 200, 54).fill(CP.ink).rect(0, 0, 200, 54).fill(on ? CP.cyan : CP.paperDark).stroke({ width: 3, color: CP.ink, alignment: 1 });
    // speaker glyph
    g.poly([14, 20, 22, 20, 32, 11, 32, 43, 22, 34, 14, 34]).fill(CP.ink);
    if (on) {
      g.arc(34, 27, 8, -0.9, 0.9).stroke({ width: 3, color: CP.ink });
      g.arc(34, 27, 14, -0.9, 0.9).stroke({ width: 3, color: CP.ink });
    } else g.moveTo(38, 18).lineTo(50, 36).moveTo(50, 18).lineTo(38, 36).stroke({ width: 3, color: CP.ink });
    t.text = voice.supported ? (on ? 'VOCES: SÍ' : 'VOCES: NO') : 'VOCES: N/D';
  }

  private buildNav() {
    const wrap = new Container();
    wrap.position.set(NAV.x, NAV.y);
    const mask = new Graphics().rect(-6, 0, NAV.w + 12, NAV.h).fill(0xffffff);
    wrap.addChild(this.navList, mask);
    this.navList.mask = mask;
    let y = 0;
    for (const grp of GROUPS) {
      const list = GAMES.filter((g) => g.group === grp);
      if (!list.length) continue;
      const h = label(grp, 14, CP.yellow, { letterSpacing: 3 });
      h.position.set(6, y + 6);
      const rule = new Graphics().rect(h.width + 16, y + 15, NAV.w - h.width - 30, 2).fill({ color: CP.yellow, alpha: 0.35 });
      this.navList.addChild(h, rule);
      y += NAV.head;
      for (const t of list) {
        const c = new Container();
        c.position.set(0, y);
        const bg = new Graphics();
        const ic = t.icon();
        ic.scale.set(0.8);
        ic.position.set(38, NAV.row / 2);
        const nt = heading(t.name, 28, CP.paper);
        nt.position.set(74, 4);
        if (nt.width > NAV.w - 92) nt.style.fontSize = 24;
        const st = label(t.sub, 14, CP.softPink);
        st.position.set(76, 40);
        c.addChild(bg, ic, nt, st);
        (c as Container & { tabColor: number; sub: Text }).tabColor = t.color;
        (c as Container & { tabColor: number; sub: Text }).sub = st;
        clickable(
          c,
          () => {
            if (this.navMoved) return;
            if (this.busyFlag) {
              sfx('error');
              return;
            }
            this.go(t.id);
          },
          { hover: false },
        );
        this.navList.addChild(c);
        this.tabBtns.set(t.id, { c, bg, t: nt });
        this.drawTab(t.id, { c, bg, t: nt }, false);
        y += NAV.row + NAV.gap;
      }
    }
    this.navMax = Math.max(0, y - NAV.gap - NAV.h);
    // scroll track + arrows (only if it overflows)
    this.navBar.position.set(NAV.x + NAV.w + 2, NAV.y);
    const arrow = (up: boolean) => {
      const a = new Container();
      const g = new Graphics();
      const w = up ? 70 : 222;
      g.rect(0, 0, w, 26).fill(CP.ink).stroke({ width: 2, color: CP.yellow, alpha: 0.7 });
      g.poly(up ? [27, 19, 35, 8, 43, 19] : [14, 8, 22, 19, 30, 8]).fill(CP.yellow);
      a.addChild(g);
      if (!up) {
        const t = label('MÁS JUEGOS', 13, CP.yellow, { letterSpacing: 2 });
        t.position.set(40, 5);
        a.addChild(t);
      }
      a.position.set(up ? NAV.x + 236 : NAV.x + 6, NAV.y + NAV.h + 6);
      clickable(a, () => this.setNavScroll(this.navScroll + (up ? -1 : 1) * (NAV.row + NAV.gap) * 2), { hover: false });
      return a;
    };
    this.navLess = arrow(true);
    this.navMore = arrow(false);
    this.bg.addChild(wrap, this.navBar, this.navLess, this.navMore);
    // wheel + drag
    wrap.eventMode = 'static';
    wrap.hitArea = new Rectangle(-6, 0, NAV.w + 12, NAV.h);
    wrap.on('wheel', (e: FederatedWheelEvent) => {
      this.setNavScroll(this.navScroll + e.deltaY * 0.8);
      e.preventDefault?.();
    });
    wrap.on('pointerdown', (e: FederatedPointerEvent) => {
      this.navDrag = { y0: e.global.y, s0: this.navScroll, moved: false };
      this.navMoved = false;
    });
    wrap.on('globalpointermove', (e: FederatedPointerEvent) => {
      const d = this.navDrag;
      if (!d) return;
      const k = 1 / Math.max(0.01, this.root.worldTransform.a || 1);
      const dy = (e.global.y - d.y0) * k;
      if (Math.abs(dy) > 10) d.moved = this.navMoved = true;
      if (d.moved) this.setNavScroll(d.s0 - dy);
    });
    const end = () => {
      this.navDrag = null;
      // a drag must not also "tap" the row under the finger (the tap fires right after pointerup)
      if (this.navMoved) window.setTimeout(() => (this.navMoved = false), 0);
    };
    wrap.on('pointerup', end);
    wrap.on('pointerupoutside', end);
    this.setNavScroll(0);
  }

  private setNavScroll(v: number) {
    this.navScroll = Math.max(0, Math.min(this.navMax, v));
    this.navList.y = -Math.round(this.navScroll);
    const over = this.navMax > 0;
    this.navMore.alpha = over && this.navScroll < this.navMax - 2 ? 1 : 0.3;
    this.navLess.alpha = over && this.navScroll > 2 ? 1 : 0.3;
    this.navMore.visible = this.navLess.visible = over;
    const g = this.navBar.clear();
    if (over) {
      const th = Math.max(60, (NAV.h * NAV.h) / (NAV.h + this.navMax));
      const ty = ((NAV.h - th) * this.navScroll) / this.navMax;
      g.rect(0, 0, 4, NAV.h).fill({ color: 0xffffff, alpha: 0.08 });
      g.rect(0, ty, 4, th).fill({ color: CP.yellow, alpha: 0.75 });
    }
  }

  /** keep the selected table visible in the nav */
  private scrollNavTo(tab: CasinoTab) {
    const b = this.tabBtns.get(tab);
    if (!b) return;
    const top = b.c.y;
    const bot = top + NAV.row;
    if (top < this.navScroll + 30) this.setNavScroll(top - NAV.head);
    else if (bot > this.navScroll + NAV.h - 30) this.setNavScroll(bot - NAV.h + 34);
  }

  private drawTab(_id: CasinoTab, b: { c: Container; bg: Graphics; t: Text }, on: boolean) {
    const col = (b.c as Container & { tabColor: number }).tabColor;
    const w = NAV.w - 14;
    b.bg.clear();
    if (on) {
      b.bg.rect(6, 6, w, NAV.row).fill(CP.pink);
      b.bg.rect(0, 0, w, NAV.row).fill(col).stroke({ width: 3, color: CP.paper, alignment: 1 });
      const dark = col === CP.yellow || col === CP.cyan || col === CP.green || col === CP.softPink;
      b.t.style.fill = dark ? CP.ink : CP.paper;
      (b.c as Container & { sub?: Text }).sub!.style.fill = dark ? CP.ink : CP.paper;
      b.c.x = 8;
    } else {
      b.bg.rect(0, 0, w, NAV.row).fill({ color: 0xffffff, alpha: 0.04 }).stroke({ width: 2, color: 0x4a3150, alignment: 1 });
      b.t.style.fill = CP.paper;
      (b.c as Container & { sub?: Text }).sub!.style.fill = CP.softPink;
      b.c.x = 0;
    }
  }

  // ------------------------------------------------------------------ ctx for views
  private makeCtx(): CasinoCtx {
    const self = this;
    return {
      fx: this.fxLayer,
      top: this.topLayer,
      particles: this.particles,
      marquee: this.marquee,
      shake: (a) => this.shaker.add(a),
      say: (ev, p = 1) => this.say(ev, p),
      chat: (ev, n = 2) => this.chat(ev, n),
      refresh: () => this.refresh(),
      freeze: (d = {}) => {
        const cur = { gold: G.s.gold, gems: G.s.gems, chips: chips(), tickets: tickets() };
        for (const k of Object.keys(d) as PillKind[]) cur[k] += d[k] ?? 0;
        this.frozen = cur;
        this.refresh();
      },
      unfreeze: () => {
        this.frozen = null;
        this.refresh();
      },
      hold: (d) => {
        for (const k of Object.keys(d) as PillKind[]) this.held[k] += d[k] ?? 0;
        let done = false;
        return () => {
          if (done) return;
          done = true;
          for (const k of Object.keys(d) as PillKind[]) this.held[k] -= d[k] ?? 0;
          if (!this.destroyed) this.refresh();
        };
      },
      setBusy: (b) => {
        this.busyFlag = b;
        if (!b && this.frozen) {
          this.frozen = null;
          this.refresh();
        }
        for (const [, t] of this.tabBtns) t.c.alpha = b ? 0.55 : 1;
      },
      get busy() {
        return self.busyFlag;
      },
      pillPos: (k) => {
        const p = this.pills[k];
        return p ? { x: p.x + 30, y: p.y + 27 } : { x: W / 2, y: 40 };
      },
      go: (tab, arg) => this.go(tab, arg),
    };
  }

  private say(ev: Ev, p = 1) {
    if (Math.random() > p) return;
    const now = performance.now();
    // never stack lines faster than ~1.2 s (except big moments)
    const big = ev === 'jackpot' || ev === 'winBig' || ev === 'gachaHolo' || ev === 'gachaLegend' || ev === 'poor';
    if (!big && now - this.lastSay < 1200) return;
    this.lastSay = now;
    const line = hostLine(ev);
    this.bubble.say(line);
    this.host.talk(Math.min(3500, 700 + line.length * 45));
    const pitch = ev === 'jackpot' || ev === 'winBig' ? 1.25 : ev === 'lose' || ev === 'loseStreak' ? 0.92 : 1.08;
    speak(line, { pitch, rate: ev === 'jackpot' ? 1.15 : 1.04 });
  }

  private chat(ev: Ev, n = 2) {
    chatLines(ev, n).forEach((l, i) =>
      window.setTimeout(
        () => {
          if (!this.destroyed) this.chatFeed.push(l.user, l.msg, l.color);
        },
        i * (220 + Math.random() * 380),
      ),
    );
  }

  private refresh() {
    for (const p of Object.values(this.pills)) p.refresh();
    if (this.owedT && !this.owedT.destroyed) {
      const n = owed();
      this.owedT.text = 'LA CASA TE DEBE';
      const g = this.owedG.clear();
      for (let i = 0; i < CANDY.every; i++) g.rect(i * 13, 1, 10, 12).fill(i < n ? CP.cyan : 0x2a1a30).stroke({ width: 1.5, color: CP.cyan, alpha: 0.6 });
    }
  }

  // ------------------------------------------------------------------ PILOTO AUTOMÁTICO
  private autoHost(): AutoHost | null {
    const v = this.view as (CasinoView & Partial<AutoHost>) | null;
    return v && !v.destroyed && typeof v.autoStep === 'function' ? (v as unknown as AutoHost) : null;
  }
  private buildAuto() {
    this.auto = new AutoPanel(
      this.ctx,
      () => this.autoHost(),
      (reason, rounds) => {
        if (this.destroyed) return;
        const msg = `${STOP_TEXT[reason]}${rounds ? ` (${rounds} ${rounds === 1 ? 'tirada' : 'tiradas'})` : ''}`;
        this.bubble.say(msg, 'PILOTO AUTOMÁTICO', reason === 'legend' || reason === 'new' || reason === 'big' ? CP.yellow : CP.cyan);
        this.host.talk(1200);
        this.refresh();
      },
      () => void this.askEterno(),
    );
    this.auto.position.set(24, 832);
    this.bg.addChild(this.auto);
    this.auto.setAvailable(false);
  }

  // ------------------------------------------------------------------ MODO ETERNO
  private async askEterno() {
    const h = this.autoHost();
    if (!h || this.busyFlag || this.auto?.running || this.eterno) {
      sfx('error');
      return;
    }
    const { openEternoConfirm, EternoRun } = await import('../panels/casino/eterno');
    openEternoConfirm(() => {
      if (this.destroyed || this.eterno || this.busyFlag) return;
      const run = new EternoRun({
        ctx: this.ctx,
        host: () => this.autoHost(),
        game: this.current,
        viewLayer: this.viewLayer,
        hud: this.topLayer,
        chat: this.chatFeed,
        marquee: this.marquee,
        bubble: (text, who, color) => {
          this.bubble.say(text, who, color);
          this.host.talk(Math.min(3500, 700 + text.length * 40));
        },
        say: (ev) => this.say(ev),
        chatEv: (ev, n) => this.chat(ev, n),
      });
      this.eterno = run;
      this.auto.eterno = true;
      this.auto.setAvailable(false);
      void run.run().finally(() => {
        this.eterno = null;
        if (!this.destroyed) {
          if (this.leaveAfterEterno) window.setTimeout(() => !this.destroyed && this.leave(), 50);
          this.auto.eterno = false;
          this.auto.setAvailable(!!this.autoHost());
          this.refresh();
        }
      });
    });
  }

  private leave() {
    if (this.eterno) {
      // ENFRIAR first (only possible before the explosion), then leave by itself when the machine is quiet
      this.eterno.stop('user');
      this.leaveAfterEterno = true;
      return;
    }
    if (this.auto?.running) this.auto.stop('user');
    if (this.busyFlag) return;
    this.say('exit');
    G.save();
    window.setTimeout(async () => {
      const { goIsland } = await import('../app/flow');
      goIsland();
    }, 250);
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      if (document.activeElement && (document.activeElement as HTMLElement).tagName === 'INPUT') return;
      if (this.eterno) return;
      // Space stops the auto-play (never starts a manual bet on top of it)
      if (this.auto?.running) {
        this.auto.stop('user');
        e.preventDefault();
        return;
      }
      // a modal (odds, accessories…) or a full-screen sequence is on top: don't bet behind it
      if (scenes.overlayLayer.children.some((c) => c.visible && c.children.length > 0) || this.topLayer.children.length) return;
      this.view?.primary?.();
      e.preventDefault();
    }
  };

  override update(dt: number) {
    // occasional glitch slice on the background (neon dimension)
    this.glitchT -= dt;
    if (this.glitchT <= 0 && !settings.reduceMotion) {
      this.glitchT = 2.5 + Math.random() * 4;
      const c = this.bigCat;
      const x0 = c.x;
      c.x = x0 + (Math.random() - 0.5) * 30;
      window.setTimeout(() => {
        if (!c.destroyed) c.x = x0;
      }, 80);
    }
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    // belt and braces: a shaker left on the ticker would throw every frame once root is gone
    this.shaker?.destroy();
    super.destroy(o);
  }

  override exit() {
    this.eterno?.stop('gone');
    if (this.auto?.running) this.auto.stop('gone');
    window.removeEventListener('keydown', this.onKey);
    for (const f of this.offs) f();
    this.offs = [];
    lounge.stop();
    stopVoice();
    this.view?.dispose?.();
    this.shaker?.destroy();
    killDeep(this);
    G.save();
  }
}

