/**
 * Island/map HUD (COZY ISLA + EDITORIAL SUIZO). Reusable: `new Hud({ mode: 'map' })` from the map scene.
 * Top: Reino badge + Momentum heat bar, resource pills (+ dropdown). Left: pinned missions.
 * Right: green clocks + Ronroneo reserve. Bottom: action bar (+ "Recolectar todo" on the island).
 */
import '../../island/safety';
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H, game } from '../../core/App';
import { C, F } from '../theme';
import { Counter, txt } from '../widgets';
import { icon, IconKind } from '../icons';
import { G } from '../../state/game';
import { MissionDef, MISSION_BY_ID } from '../../data/content';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementFx } from '../../art/catArt';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { sparkles } from '../../fx/juice';
import { goIsland, goMap } from '../../app/flow';
import { openSanctuary } from '../../panels/Sanctuary';
import { openCatdex } from '../../panels/Catdex';
import { openShipyard } from '../../panels/Shipyard';
import { openMissions } from '../../panels/Missions';
import { openSettings } from '../../panels/Settings';
import { hudUnlocks, setUiSeen } from '../../state/ext/island';
import { islandNotices } from '../../state/ext/islandM2';
import { workersUnlocked } from '../../state/sys/workforce';
import { autoHarvestOn, bankUnlocked, fishBuffer } from '../../state/sys/island';
import { toast } from '../modal';
import { podioUnlocked } from '../../state/sys/podio';

/** panels owned by agents that may not exist yet: resolved lazily with import.meta.glob (never a hard import) */
const LAZY = import.meta.glob<Record<string, unknown>>(['../../panels/shop/Shop.ts', '../../panels/casino/open.ts']);
function lazyOpen(path: string, fn: string, label: string) {
  const loader = LAZY[path];
  if (!loader) {
    sfx('error');
    toast(`${label}: ¡muy pronto!`, { sub: 'Los gatos están pintando el letrero.', color: C.paper });
    return;
  }
  void loader().then((m) => {
    const f = m[fn] as (() => void) | undefined;
    if (typeof f === 'function') f();
    else toast(`${label}: ¡muy pronto!`, { color: C.paper });
  });
}
export function lazyPanelExists(path: string) {
  return !!LAZY[path];
}
import { card, coinPitch, heatColor, pressable } from './parts';
import { glyph } from './glyphs';
import { TimerColumn } from './TimerColumn';
import { setGoalRoute } from '../../panels/Missions';
import { MissionPins } from './MissionPins';
import { ActionBar } from './ActionBar';
import { TweenBag } from './tweenBag';

export interface HudOpts {
  compact?: boolean;
  mode?: 'island' | 'map';
  /** "IR" on a pinned mission (the island focuses the camera etc.); default opens Misiones */
  onGoal?: (m: MissionDef) => void;
  /** "Recolectar todo" (island only) */
  onCollectAll?: () => void;
}

type ResKey = 'gold' | 'food' | 'gems';

class Pill extends Container {
  counter: Counter;
  rate?: Text;
  ic: Container;
  constructor(
    public key: ResKey,
    kind: IconKind,
    public w: number,
    withRate: boolean,
  ) {
    super();
    const bg = card(w, 62, C.paper, 6, 4);
    this.ic = icon(kind, 42);
    this.ic.position.set(34, 31);
    this.counter = new Counter({ fontFamily: F.heavy, fontSize: 28, fill: C.ink });
    this.counter.position.set(62, withRate ? 3 : 12);
    this.addChild(bg, this.ic, this.counter);
    if (withRate) {
      this.rate = txt('+0/s', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.green });
      this.rate.position.set(64, 37);
      this.addChild(this.rate);
    }
  }
}

export class Hud extends Container {
  private opts: HudOpts;
  private pills = new Map<ResKey, Pill>();
  private pending: Record<ResKey, number> = { gold: 0, food: 0, gems: 0 };
  private pillRow = new Container();
  private more = new Container();
  private dropdown: Container | null = null;
  private kBadge = new Container();
  private kLevel: Text;
  private kBar = new Graphics();
  private kPct: Text;
  private shownKl = -1;
  private shownXp = -1;
  private mom = new Container();
  private momBar = new Graphics();
  private momText: Text;
  private momFlame: Container;
  private shownMom = -1;
  timers = new TimerColumn();
  pins: MissionPins;
  actions: ActionBar;
  collectBtn = new Container();
  /** island notices (sin casa / expedición de vuelta) at the top center */
  notices = new Container();
  private noticeSig = '';
  private collectAmt: Text;
  fx = new Container();
  private unsub: (() => void)[] = [];
  private acc = 0;
  private t = 0;
  private bag = new TweenBag();

  constructor(opts: HudOpts = {}) {
    super();
    this.opts = opts;
    const island = (opts.mode ?? 'island') === 'island';

    // ---------------------------------------------------------------- Reino badge
    const medal = new Graphics().circle(5, 5, 46).fill(C.ink).circle(0, 0, 46).fill(C.pink).stroke({ width: 4, color: C.ink });
    medal.circle(0, 0, 38).stroke({ width: 2, color: C.ink, alpha: 0.5 });
    const crown = icon('crown', 34);
    crown.position.set(0, -46);
    this.kLevel = txt('1', { fontFamily: F.poster, fontSize: 50, fill: C.ink });
    this.kLevel.anchor.set(0.5);
    this.kLevel.y = 2;
    const kTitle = txt('REINO', { fontFamily: F.poster, fontSize: 30, fill: C.ink, letterSpacing: 2 });
    kTitle.position.set(60, -44);
    this.kBar.position.set(60, -6);
    this.kPct = txt('0%', { fontFamily: F.heavy, fontSize: 18, fill: C.ink });
    this.kPct.position.set(60 + 280 + 10, -8);
    const medalC = new Container();
    medalC.addChild(medal, this.kLevel, crown);
    this.kBadge.addChild(medalC, kTitle, this.kBar, this.kPct);
    this.kBadge.position.set(76, 72);
    // the Reino shield opens the Kingdom panel (hitos + automatizaciones)
    const kHit = new Graphics().rect(-56, -60, 420, 112).fill({ color: 0xffffff, alpha: 0.001 });
    this.kBadge.addChildAt(kHit, 0);
    pressable(this.kBadge, () => void import('../../panels/Kingdom').then((m) => m.openKingdom()), { face: medalC });
    // momentum
    const mb = card(330, 40, C.ink, 5, 3);
    this.momFlame = icon('flame', 28);
    this.momFlame.position.set(22, 20);
    const mt = txt('MOMENTUM', { fontFamily: F.bebas, fontSize: 20, fill: C.paper, letterSpacing: 2 });
    mt.position.set(42, 9);
    this.momBar.position.set(126, 13);
    this.momText = txt('x1.00', { fontFamily: F.heavy, fontSize: 18, fill: C.paper });
    this.momText.position.set(270, 9);
    this.mom.addChild(mb, this.momFlame, mt, this.momBar, this.momText);
    this.mom.position.set(24, 138);
    this.addChild(this.kBadge, this.mom);

    // ---------------------------------------------------------------- resources
    const defs: [ResKey, IconKind, number, boolean][] = [
      ['gold', 'gold', 268, true],
      ['food', 'food', 214, false],
      ['gems', 'gem', 164, false],
    ];
    for (const [k, ic, w, rate] of defs) {
      const p = new Pill(k, ic, w, rate);
      this.pills.set(k, p);
      this.pillRow.addChild(p);
    }
    const mbg = card(58, 62, C.yellow, 6, 4);
    const chev = glyph('chevron', 30);
    chev.position.set(29, 31);
    this.more.addChild(mbg, chev);
    pressable(this.more, () => this.toggleDropdown());
    this.pillRow.addChild(this.more);
    this.addChild(this.pillRow);
    this.layoutPills(false);

    // ---------------------------------------------------------------- timers, pins, actions
    this.timers.position.set(W - 268 - 24, 104);
    this.pins = new MissionPins((m) => (this.opts.onGoal ? this.opts.onGoal(m) : openMissions()));
    // the Missions panel's IR buttons use the same route as the pins of the screen you're on
    if (this.opts.onGoal) setGoalRoute(this.opts.onGoal);
    this.pins.position.set(24, 262);
    const u = () => hudUnlocks();
    this.actions = new ActionBar([
      { id: 'sanctuary', label: 'SANTUARIO', glyph: 'torii', onTap: () => openSanctuary(), visible: () => u().sanctuary, badge: () => (G.s.resonance.jobs.some((j) => j.ready) ? '¡!' : null) },
      { id: 'catdex', label: 'CATDEX', glyph: 'book', onTap: () => openCatdex(), visible: () => u().catdex },
      { id: 'shipyard', label: 'ASTILLERO', glyph: 'anchor', onTap: () => openShipyard(), visible: () => u().shipyard },
      island
        ? { id: 'sail', label: '¡ZARPAR!', glyph: 'ship', onTap: () => goMap(), visible: () => u().sail, big: true, color: C.pinkHot }
        : { id: 'island', label: 'ISLA', glyph: 'palm', onTap: () => goIsland(), visible: () => true, big: true, color: C.megaBlue },
      { id: 'missions', label: 'MISIONES', glyph: 'scroll', onTap: () => openMissions(), visible: () => true, badge: () => (G.s.missions.active.length ? String(G.s.missions.active.length) : null) },
      { id: 'workers', label: 'OFICIOS', glyph: 'tools', onTap: () => void import('../../panels/island/WorkersPanel').then((m) => m.openWorkers()), visible: () => island && workersUnlocked() },
      { id: 'shop', label: 'TIENDA', glyph: 'shop', onTap: () => lazyOpen('../../panels/shop/Shop.ts', 'openShop', 'TIENDA'), visible: () => island && u().sail },
      { id: 'podio', label: 'PODIO', glyph: 'podium', onTap: () => void import('../../panels/podio/open').then((m) => m.openPodio()), visible: () => podioUnlocked() },
      { id: 'casino', label: 'CASINO', glyph: 'capsule', onTap: () => lazyOpen('../../panels/casino/open.ts', 'openCasino', 'CASINO'), visible: () => island && u().mesa },
      { id: 'settings', label: 'AJUSTES', glyph: 'gear', onTap: () => openSettings(), visible: () => true },
    ]);
    this.actions.position.set(W / 2, H - 120);
    this.addChild(this.timers, this.pins, this.actions);

    // ---------------------------------------------------------------- collect all
    const cbg = new Container();
    const cg = card(250, 100, C.yellow, 6, 4);
    const coins = glyph('coins', 54);
    coins.position.set(46, 52);
    const ct = txt('RECOLECTAR\nTODO', { fontFamily: F.poster, fontSize: 26, fill: C.ink, lineHeight: 26 });
    ct.position.set(86, 12);
    this.collectAmt = txt('', { fontFamily: F.heavy, fontSize: 16, fill: C.ink });
    this.collectAmt.position.set(88, 68);
    cbg.addChild(cg, coins, ct, this.collectAmt);
    cbg.pivot.set(125, 50);
    cbg.position.set(125, 50);
    this.collectBtn.addChild(cbg);
    this.collectBtn.position.set(24, H - 128);
    pressable(this.collectBtn, () => this.opts.onCollectAll?.(), { face: cbg, sound: false });
    this.collectBtn.visible = false;
    if (island) this.addChild(this.collectBtn);
    if (island) this.addChild(this.notices);
    this.notices.position.set(W / 2 - 110, 20);
    this.addChild(this.fx);
    this.anchorGroups();

    // ---------------------------------------------------------------- events
    this.unsub.push(
      G.on('purr', (p) => this.onPurr(p)),
      G.on('mission', (p) => {
        if (p.kind === 'done') this.pins.markDone(p.id);
      }),
      G.on('klUp', (p) => this.onKlUp(p.kl)),
    );
    this.syncNow();
  }

  // ------------------------------------------------------------------ public API
  /** global position of a resource pill icon (for fly-to effects) */
  target(key: ResKey) {
    const p = this.pills.get(key);
    return p && p.visible ? p.ic.getGlobalPosition() : null;
  }
  /**
   * Storyboard (h): coins burst from `fromGlobal` and fly in a curve to the pill; the counter adds
   * each coin's share on arrival with an ascending pentatonic pitch. Never blocks input.
   */
  flyTo(key: ResKey, fromGlobal: { x: number; y: number }, amount: number, o: { delay?: number; count?: number } = {}) {
    const p = this.pills.get(key);
    if (!p || amount <= 0) return;
    if (settings.reduceMotion || !p.visible) {
      gsap.fromTo(p.ic.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.3 });
      return;
    }
    const n = o.count ?? Math.max(3, Math.min(14, Math.round(3 * Math.log10(amount + 1))));
    const share = amount / n;
    this.pending[key] += amount;
    const from = this.fx.toLocal(fromGlobal);
    const to = this.fx.toLocal(p.ic.getGlobalPosition());
    const kind: IconKind = key === 'gold' ? 'gold' : key === 'food' ? 'food' : 'gem';
    let arrived = 0;
    for (let i = 0; i < n; i++) {
      const coin = icon(kind, 30);
      coin.position.set(from.x, from.y);
      coin.visible = false;
      this.fx.addChild(coin);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const burst = 40 + Math.random() * 50;
      const bx = from.x + Math.cos(a) * burst;
      const by = from.y + Math.sin(a) * burst - 20;
      const ctrl = { x: (bx + to.x) / 2 + (Math.random() - 0.5) * 120, y: Math.min(by, to.y) - 120 - Math.random() * 80 };
      const prog = { t: 0 };
      this.bag
        .tl({ delay: (o.delay ?? 0) + i * (0.04 - Math.min(0.015, i * 0.002)) })
        .call(() => {
          coin.visible = true;
        })
        .to(coin, { x: bx, y: by, duration: 0.15, ease: 'power2.out' })
        .to(prog, {
          t: 1,
          duration: 0.5 + Math.random() * 0.1,
          ease: 'power2.in',
          onUpdate: () => {
            const t = prog.t;
            const it = 1 - t;
            coin.x = it * it * bx + 2 * it * t * ctrl.x + t * t * to.x;
            coin.y = it * it * by + 2 * it * t * ctrl.y + t * t * to.y;
            coin.scale.set(1 - t * 0.25);
          },
          onComplete: () => {
            coin.destroy({ children: true });
            arrived++;
            const last = arrived === n;
            this.pending[key] = Math.max(0, this.pending[key] - (last ? amount - share * (n - 1) : share));
            if (last) this.pending[key] = Math.max(0, Math.round(this.pending[key] * 1000) / 1000);
            sfx(key === 'food' ? 'pop' : 'coin', coinPitch() * (last ? 1.5 : 1));
            gsap.fromTo(p.ic.scale, { x: last ? 1.4 : 1.12, y: last ? 1.4 : 1.12 }, { x: 1, y: 1, duration: 0.22, ease: 'back.out(3)' });
            if (last) sparkles(this.fx, to.x, to.y, key === 'food' ? 0x7fd8ff : C.yellow, 8, 60);
            this.syncCounters(true);
          },
        });
    }
  }
  /** ripple a counter without coins (e.g. spends) */
  pulse(key: ResKey) {
    const p = this.pills.get(key);
    if (p) gsap.fromTo(p.scale, { x: 1.05, y: 1.05 }, { x: 1, y: 1, duration: 0.3 });
  }

  update(dt: number) {
    this.t += dt;
    this.timers.update();
    this.pins.update(dt);
    this.actions.update(dt);
    this.acc += dt;
    if (this.acc > 0.1) {
      this.acc = 0;
      this.syncNow();
    }
    // momentum flame flicker on twos
    if (G.s.momentum > 2.2 && Math.floor(this.t * 12) % 2 === 0) this.momFlame.scale.set(1 + Math.random() * 0.2, 1 + Math.random() * 0.3);
  }

  // ------------------------------------------------------------------ screen anchoring (phones / wide screens)
  /** corner groups: each keeps its 1920×1080 layout but sticks to the REAL screen edge and grows on phones */
  private tl = new Container();
  private tr = new Container();
  private bc = new Container();
  private bl = new Container();
  private tc = new Container();
  private anchorGroups() {
    const move = (g: Container, kids: Container[], ox: number, oy: number) => {
      for (const k of kids) {
        if (!k.parent) continue;
        k.position.set(k.x - ox, k.y - oy);
        g.addChild(k);
      }
    };
    move(this.tl, [this.kBadge, this.mom, this.pins], 0, 0);
    move(this.tr, [this.pillRow, this.timers], W, 0);
    move(this.bc, [this.actions], W / 2, H);
    move(this.bl, [this.collectBtn], 0, H);
    move(this.tc, [this.notices], W / 2, 0);
    this.addChildAt(this.tc, 0);
    this.addChildAt(this.bl, 0);
    this.addChildAt(this.bc, 0);
    this.addChildAt(this.tr, 0);
    this.addChildAt(this.tl, 0);
    this.layoutView();
    this.unsub.push(game.onView(() => this.layoutView()));
  }
  /** phones: the 1920×1080 UI is tiny; corner groups scale up so 24 px text reads ≥ ~12 css px */
  static uiScale() {
    return Math.max(1, Math.min(1.5, 0.5 / Math.max(0.01, game.scale)));
  }
  private layoutView() {
    const v = game.view;
    const k = Hud.uiScale();
    this.tl.position.set(v.x, v.y);
    this.tr.position.set(v.x + v.w, v.y);
    this.bc.position.set(v.x + v.w / 2, v.y + v.h);
    this.bl.position.set(v.x, v.y + v.h);
    this.tc.position.set(v.x + v.w / 2, v.y);
    for (const g of [this.tl, this.tr, this.bc, this.bl, this.tc]) g.scale.set(k);
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    this.unsub.forEach((f) => f());
    this.unsub = [];
    this.bag.killAll();
    for (const p of this.pills.values()) (p.counter as unknown as { tween?: gsap.core.Tween }).tween?.kill();
    gsap.killTweensOf(this.fx.children);
    super.destroy(o ?? { children: true });
  }

  // ------------------------------------------------------------------ internals
  private syncNow() {
    const u = hudUnlocks();
    // gems pill appears once you have any
    const gp = this.pills.get('gems')!;
    if (gp.visible !== u.gems) {
      gp.visible = u.gems;
      if (u.gems) {
        setUiSeen('gems');
        gsap.fromTo(gp.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2.5)' });
      }
      this.layoutPills(true);
    }
    this.syncCounters(false);
    this.pills.get('gold')!.rate!.text = `+${fmt(G.goldPerSec)}/s`;
    // reino
    if (G.s.kl !== this.shownKl) {
      this.shownKl = G.s.kl;
      this.kLevel.text = String(G.s.kl);
      this.kLevel.scale.set(G.s.kl >= 10 ? 0.82 : 1);
    }
    const xp = Math.round(G.s.klXp * 1000) / 1000;
    if (xp !== this.shownXp) {
      const up = xp > this.shownXp;
      this.shownXp = xp;
      const bw = 280;
      this.kBar.clear().rect(5, 5, bw, 22).fill(C.ink).rect(0, 0, bw, 22).fill(C.paperDark).stroke({ width: 3, color: C.ink, alignment: 1 });
      this.kBar.rect(0, 0, Math.max(0, bw * xp), 22).fill(C.pinkHot);
      for (let k = 1; k < 10; k++) this.kBar.moveTo((bw * k) / 10, 4).lineTo((bw * k) / 10, 18).stroke({ width: 1.5, color: C.ink, alpha: 0.25 });
      this.kPct.text = `${Math.floor(xp * 100)}%`;
      if (up && this.shownKl >= 0) gsap.fromTo(this.kPct.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
    }
    // momentum
    this.mom.visible = u.momentum;
    if (u.momentum) setUiSeen('momentum');
    const m = Math.round(G.s.momentum * 100) / 100;
    if (m !== this.shownMom) {
      this.shownMom = m;
      const bw = 136;
      const p = (m - 1) / 2;
      this.momBar.clear().rect(0, 0, bw, 14).fill(0x3a3238).stroke({ width: 2, color: C.paper, alignment: 1 });
      this.momBar.rect(0, 0, bw * p, 14).fill(heatColor(m));
      this.momText.text = `x${m.toFixed(2)}`;
      this.momText.style.fill = heatColor(m);
    }
    // collect all
    const island = (this.opts.mode ?? 'island') === 'island';
    if (island) {
      const total = G.s.habitats.reduce((a, h) => a + Math.floor(h.buffer), 0);
      const fish = G.s.habitats.reduce((a, h) => a + Math.floor(fishBuffer(h)), 0);
      // Banco (KL15) + Mar de Pescados Automático (KL21) retire the button: nothing left to collect by hand
      const vis = u.collectAll && !(bankUnlocked() && autoHarvestOn());
      if (vis !== this.collectBtn.visible) {
        this.collectBtn.visible = vis;
        if (vis) gsap.fromTo(this.collectBtn.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.5, ease: 'back.out(2.5)' });
      }
      this.collectAmt.text = total > 0 && fish > 0 ? `+${fmt(total)} · +${fmt(fish)} pesca` : total > 0 ? `+${fmt(total)}` : fish > 0 ? `+${fmt(fish)} pesca` : 'vacío';
      this.collectBtn.alpha = total > 0 || fish > 0 ? 1 : 0.6;
      this.collectAmt.scale.set(1);
      if (this.collectAmt.width > 152) this.collectAmt.scale.set(152 / this.collectAmt.width);
    }
    if (this.dropdown) this.fillDropdown();
    if (island) this.syncNotices();
  }

  private syncNotices() {
    const list = islandNotices();
    const sig = list.map((n) => n.id + n.text).join('|');
    if (sig === this.noticeSig) return;
    this.noticeSig = sig;
    for (const c of this.notices.children) {
      const face = c.children[0];
      if (face) {
        gsap.killTweensOf(face);
        gsap.killTweensOf(face.scale);
      }
    }
    this.notices.removeChildren().forEach((c) => c.destroy({ children: true }));
    let x = 0;
    const items: Container[] = [];
    for (const n of list) {
      const c = new Container();
      const face = new Container();
      const t = txt(n.text, { fontFamily: F.poster, fontSize: 24, fill: n.color === C.red ? C.paper : C.ink });
      const go = txt(n.id === 'homeless' ? 'ARREGLAR ›' : 'RECLAMAR ›', { fontFamily: F.bebas, fontSize: 22, fill: n.color === C.red ? C.yellow : C.ink, letterSpacing: 1 });
      const ic = n.id === 'homeless' ? icon('paw', 26, n.color === C.red ? C.paper : C.ink) : icon('scrap', 28);
      ic.position.set(22, 22);
      t.position.set(42, 4);
      go.position.set(t.x + t.width + 14, 9);
      const w = go.x + go.width + 16;
      face.addChild(card(w, 44, n.color, 5, 3), ic, t, go);
      c.addChild(face);
      pressable(c, () => {
        if (n.id === 'homeless') void import('../../panels/island/HomelessPanel').then((m) => m.openHomeless());
        else void import('../../panels/island/PortPanel').then((m) => m.openPort());
      }, { face });
      c.position.set(-w / 2, items.length * 54);
      x = Math.max(x, w);
      items.push(c);
      this.notices.addChild(c);
      gsap.fromTo(face.scale, { x: 0.3, y: 0.3 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2.5)' });
      if (n.id === 'homeless') this.bag.to(face, { rotation: 0.025, duration: 0.18, yoyo: true, repeat: 5, ease: 'sine.inOut' });
    }
  }

  private syncCounters(animate: boolean) {
    for (const [k, p] of this.pills) {
      const v = Math.max(0, G.s[k] - this.pending[k]);
      p.counter.set(Math.floor(v), animate || true);
    }
  }

  private layoutPills(animate: boolean) {
    const gap = 14;
    const items: Container[] = [...this.pills.values()].filter((p) => p.visible);
    items.push(this.more);
    const widths = items.map((c) => (c === this.more ? 58 : (c as Pill).w));
    const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
    let x = W - 24 - total;
    items.forEach((c, i) => {
      if (animate) gsap.to(c, { x, duration: 0.3, ease: 'power2.out' });
      else c.x = x;
      c.y = 18;
      x += widths[i] + gap;
    });
  }

  private toggleDropdown() {
    if (this.dropdown) {
      const d = this.dropdown;
      this.dropdown = null;
      gsap.to(d, { alpha: 0, y: d.y - 10, duration: 0.15, onComplete: () => d.destroy({ children: true }) });
      return;
    }
    const d = new Container();
    d.position.set(this.pillRow.x + this.more.x + 58 - 300, 92);
    this.dropdown = d;
    this.tr.addChild(d);
    this.fillDropdown();
    gsap.from(d, { alpha: 0, y: d.y - 12, duration: 0.2, ease: 'back.out(2)' });
  }
  private ddSig = '';
  private fillDropdown() {
    const d = this.dropdown!;
    const rows: { ic: IconKind; tint?: number; name: string; v: number }[] = [
      { ic: 'scrap', name: 'Chatarra', v: G.s.scrap },
      { ic: 'blueprint', name: 'Planos', v: G.s.blueprint },
      { ic: 'orb', tint: 0xffffff, name: 'Orbe Prisma', v: G.s.prisma },
    ];
    for (const [el, n] of Object.entries(G.s.crystals)) if (n > 0) rows.push({ ic: 'crystal', tint: elementFx(el).main, name: `Cristal de ${cap(ELEMENT_NAME[el] ?? el)}`, v: n });
    const sig = rows.map((r) => `${r.name}:${Math.floor(r.v)}`).join('|');
    if (sig === this.ddSig && d.children.length) return;
    this.ddSig = sig;
    d.removeChildren().forEach((c) => c.destroy({ children: true }));
    const h = 20 + rows.length * 44;
    d.addChild(card(300, h, C.paper, 6, 4));
    const title = txt('MATERIALES (solo combate)', { fontFamily: F.bebas, fontSize: 18, fill: C.ink, letterSpacing: 1 });
    title.position.set(14, -24);
    const tb = new Graphics().rect(0, -30, 300, 30).fill(C.ink);
    title.style.fill = C.paper;
    d.addChild(tb, title);
    rows.forEach((r, i) => {
      const ic = icon(r.ic, 30, r.tint);
      ic.position.set(30, 32 + i * 44);
      const n = txt(r.name, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.ink });
      n.position.set(56, 20 + i * 44);
      const v = txt(fmt(r.v), { fontFamily: F.heavy, fontSize: 20, fill: C.ink });
      v.anchor.set(1, 0);
      v.position.set(284, 18 + i * 44);
      d.addChild(ic, n, v);
    });
  }

  private onKlUp(kl: number) {
    gsap.fromTo(this.kBadge.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.6, ease: 'elastic.out(1.2,0.4)' });
    const kp = this.fx.toLocal(this.kBadge.getGlobalPosition());
    sparkles(this.fx, kp.x, kp.y, C.pinkHot, 14, 120);
    const t = txt(`¡REINO ${kl}!`, { fontFamily: F.comic, fontSize: 54, fill: C.yellow, stroke: { color: C.ink, width: 9, join: 'round' } });
    t.anchor.set(0, 0.5);
    t.position.set(kp.x + 60, kp.y + 40);
    t.scale.set(0.2);
    this.fx.addChild(t);
    this.bag
      .tl({ onComplete: () => t.destroy() })
      .to(t.scale, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' })
      .to(t, { y: t.y + 30, alpha: 0, duration: 0.5, delay: 1.2 });
    sfx('levelup');
  }

  /** Ronroneo gained: "−X min" stamps fly to the affected clocks (07 e) */
  private onPurr(p: { minutes: number; applied: { timer: { id: string } | null; minutes: number }[]; source: string }) {
    let i = 0;
    for (const a of p.applied) {
      if (a.minutes < 0.05) continue;
      const r0 = a.timer ? this.timers.rowFor(a.timer.id) : null;
      const row = r0 && !r0.destroyed ? r0 : null;
      const target = row ?? this.timers.reserveChip;
      const tg = this.fx.toLocal(target.getGlobalPosition());
      const tx = tg.x + 40;
      const ty = tg.y + 30;
      const st = new Container();
      const label = a.timer ? `−${a.minutes.toFixed(1)} min` : `+${a.minutes.toFixed(1)} min`;
      const t = txt(label, { fontFamily: F.comic, fontSize: 34, fill: C.paper });
      t.anchor.set(0.5);
      const w = t.width + 26;
      const g = new Graphics().rect(-w / 2, -24, w, 48).fill(a.timer ? C.green : C.lilac).stroke({ width: 4, color: C.ink });
      g.rect(-w / 2 + 5, -19, w - 10, 38).stroke({ width: 2, color: C.paper, alpha: 0.7 });
      st.addChild(g, t);
      st.position.set(W / 2 + (i - 0.5) * 60, H / 2 - 120);
      st.rotation = -0.15 + Math.random() * 0.3;
      st.scale.set(2.6);
      st.alpha = 0;
      this.fx.addChild(st);
      this.bag
        .tl({ delay: i * 0.18, onComplete: () => st.destroy({ children: true }) })
        .to(st, { alpha: 1, duration: 0.05 })
        .to(st.scale, { x: 1, y: 1, duration: 0.22, ease: 'back.out(2)' }, '<')
        .call(() => sfx('tick', 1.4))
        .to(st, { x: tx, y: ty, rotation: 0, duration: 0.55, delay: 0.35, ease: 'power2.in' })
        .to(st.scale, { x: 0.5, y: 0.5, duration: 0.55, ease: 'power2.in' }, '<')
        .call(() => {
          sfx('purr');
          // the timer may have finished (row destroyed) while the stamp was flying
          if (row && !row.destroyed && row.scale) gsap.fromTo(row.scale, { x: 1.08, y: 1.08 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
        });
      i++;
    }
  }
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export { MISSION_BY_ID };
