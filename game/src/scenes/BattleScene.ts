import { Container, FederatedPointerEvent, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Scene, scenes } from '../core/scenes';
import { W, H } from '../core/App';
import { Sea } from '../battle/sea';
import { CELL } from '../battle/ship';
import { ShipView } from '../battle/shipView';
import { Battle, BattleEvent, SideSetup, ShotPath, VictoryReason } from '../battle/sim';
import { decide, DIFFICULTY, aimCannon } from '../battle/ai';
import { CatStatusView, playKO, playOverboard } from '../battle/catFx';
import { SkyLife } from '../battle/sky';
import { CatState, ShotDef } from '../battle/types';
import { Particles } from '../fx/particles';
import { Shaker, flash, onomatopoeia, floatText, time, speedLines, sparkles } from '../fx/juice';
import { sfx } from '../core/audio';
import { C, F } from '../ui/theme';
import { txt, poster } from '../ui/widgets';
import { BattleCat, elementFx, preloadCats } from '../art/catArt';
import { dotTexture, glowTexture } from '../art/textures';
import { CrewCard, BattleTopBar } from '../battle/hud';
import { settings } from '../core/settings';
import { fmt } from '../core/format';
import { G } from '../state/game';

export const WATER_Y = 820;

export interface BattleResult {
  won: boolean;
  reason: VictoryReason | null;
  turns: number;
  modulesDestroyed: number;
  damageDealt: number;
  catsLost: number;
  perfect: boolean;
}

export interface BattleSpec {
  player: Omit<SideSetup, 'origin' | 'flip'>;
  enemy: Omit<SideSetup, 'origin' | 'flip'>;
  playerName: string;
  enemyName: string;
  captain?: string;
  captainLine?: string;
  difficulty: keyof typeof DIFFICULTY;
  palette?: { skyTop: number; skyBottom: number; sea: number; seaDark: number };
  seed?: number;
  /** shown numbers = internal × displayMul (numbers grow with progress; TTK stays) */
  displayMul?: number;
  meta?: { zone: number; stage: number; key: string; boss: boolean; ep: number; sp: number };
  onEnd: (r: BattleResult) => void;
}

const ONO: Record<string, [string, number]> = {
  fire: ['¡FWOOSH!', C.orange],
  water: ['¡SPLASH!', C.cyan],
  electric: ['¡ZZZAP!', C.yellow],
  earth: ['¡KRAK!', 0xe0b77a],
  ice: ['¡CRASH!', 0xc6f0e4],
  wind: ['¡FWOOM!', 0xc6f0e4],
  nature: ['¡CRUNCH!', 0xd4f27a],
  magic: ['¡ZING!', 0xff7ab8],
  spirit: ['¡BUUU!', 0xffffff],
  cosmic: ['¡VWOOM!', 0x00e5ff],
  void: ['¡...!', 0xff2e88],
  neutral: ['¡BOOM!', C.yellow],
};

export class BattleScene extends Scene {
  sim!: Battle;
  camRoot = new Container();
  world = new Container();
  /** world-space fx layer (zooms with the camera) */
  wfx = new Container();
  sky!: SkyLife;
  statusViews = new Map<string, CatStatusView>();
  cam = { x: W / 2, y: H / 2, z: 1, tx: W / 2, ty: H / 2, tz: 1 };
  follow: Container | null = null;
  sinking = new Set<Container>();
  /** elevation (rad) of the last player shot, for the 'lobbed shot' mission */
  lastElevation = 0;
  sea!: Sea;
  ships: ShipView[] = [];
  catViews = new Map<string, BattleCat>();
  debris = new Container();
  fxp = new Particles();
  aimG = new Graphics();
  ui = new Container();
  overlay = new Container();
  shaker = new Shaker(this.world);
  top!: BattleTopBar;
  cards: CrewCard[] = [];
  selected: string = '';
  ultArmed = false;
  phase: 'intro' | 'aim' | 'flight' | 'enemy' | 'end' = 'intro';
  dragging = false;
  dragStart = { x: 0, y: 0 };
  aim = { angle: -0.7, power: 850 };
  aiMemory = new Map<string, number>();
  stats = { modulesDestroyed: 0, damageDealt: 0, catsLost: 0 };
  burnAcc = 0;
  fast = false;

  constructor(public spec: BattleSpec) {
    super();
  }

  /** format a damage number for display (scaled by progress) */
  show(n: number) {
    return fmt(n * (this.spec.displayMul ?? 1));
  }

  override async enter() {
    const sp = this.spec;
    const pW = sp.player.blueprint.cols * CELL;
    const eW = sp.enemy.blueprint.cols * CELL;
    const originY = (bp: { rows: number }) => WATER_Y - bp.rows * CELL + 70;
    this.sim = new Battle({
      seed: sp.seed ?? Math.floor(Math.random() * 1e9),
      waterY: WATER_Y,
      sides: [
        { ...sp.player, origin: { x: 70, y: originY(sp.player.blueprint) }, flip: false },
        { ...sp.enemy, origin: { x: W - 70 - eW, y: originY(sp.enemy.blueprint) }, flip: true },
      ],
    });
    void pW;
    const slugs = [...sp.player.cats, ...sp.enemy.cats].map((c) => c.slug);
    await preloadCats(slugs);

    this.sea = new Sea(WATER_Y, sp.palette);
    this.sky = new SkyLife(WATER_Y);
    this.sky.wind = this.sim.wind;
    this.camRoot.addChild(this.world);
    this.addChild(this.camRoot, this.ui, this.overlay);
    const shipsLayer = new Container();
    this.world.addChild(this.sea, this.sky, shipsLayer, this.debris, this.sea.frontLayer(), this.fxp, this.aimG, this.wfx);
    for (let side = 0; side < 2; side++) {
      const s = this.sim.sides[side];
      const v = new ShipView(s.ship, s.setup.flip);
      v.position.set(s.setup.origin.x, s.setup.origin.y);
      v.baseY = v.y;
      shipsLayer.addChild(v);
      this.ships.push(v);
      for (const c of s.cats) {
        const bc = new BattleCat(c.def.slug, c.def.elements[0] ?? 'fire', CELL * 3.1, s.setup.flip);
        if (c.def.tint !== undefined) bc.sprite.tint = c.def.tint;
        const m = s.ship.modules[c.room];
        const p = v.cellPos(s.setup.flip ? m.x + m.w - 1 : m.x, m.y);
        bc.position.set(p.x + CELL, p.y + m.h * CELL + 2);
        v.decor.addChild(bc);
        this.catViews.set(c.def.uid, bc);
        this.statusViews.set(c.def.uid, new CatStatusView(bc));
      }
    }
    this.buildHud();
    if (import.meta.env.DEV) (window as unknown as { __battle: BattleScene }).__battle = this;
    this.eventMode = 'static';
    this.hitArea = { contains: () => true };
    this.on('pointerdown', this.down, this);
    this.on('globalpointermove', this.move, this);
    this.on('pointerup', this.up, this);
    this.on('pointerupoutside', this.up, this);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    await this.intro();
    this.playerTurn();
  }

  override exit() {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
    this.shaker.destroy();
    this.sky?.destroy();
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.fast = true;
    if (this.phase !== 'aim') return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= this.cards.length) this.select(this.cards[n - 1].cat!.def.uid);
  };
  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.fast = false;
  };

  // ---------------------------------------------------------------- HUD
  buildHud() {
    this.top = new BattleTopBar(this.spec.playerName, this.spec.enemyName);
    this.ui.addChild(this.top);
    this.top.setWind(this.sim.wind);
    const s = this.sim.sides[0];
    s.cats.forEach((c, i) => {
      const card = new CrewCard(
        c,
        () => this.select(c.def.uid),
        () => this.armUlt(c),
      );
      card.position.set(40 + i * 220, H - 172);
      this.ui.addChild(card);
      this.cards.push(card);
    });
    const cannons = this.sim.cannons(0).length;
    const auto = txt(`💣 CAÑONES AUTOMÁTICOS ×${cannons}\nDisparan solos al final de tu turno`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.paper, lineHeight: 20 });
    auto.position.set(40 + s.cats.length * 220 + 10, H - 120);
    this.ui.addChild(auto);
    const hint = txt('ARRASTRA PARA APUNTAR · SUELTA PARA DISPARAR · 1-5 ELIGE GATO · ESPACIO ACELERA', {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 16,
      fill: C.paper,
    });
    hint.position.set(W - hint.width - 30, H - 34);
    this.ui.addChild(hint);
  }

  refreshCards() {
    if (!G.s.flags.first_meter_full && this.sim?.sides[0].cats.some((c) => c.ultCharge >= 1)) G.flag('first_meter_full');
    for (let side = 0; side < 2; side++)
      for (const c of this.sim.sides[side].cats) if (!c.ko) this.statusViews.get(c.def.uid)?.set(c.fx);
    for (const c of this.cards) {
      c.draw();
      c.ultBtn.visible = !!c.cat && this.phase === 'aim' && this.sim.canUlt(c.cat) && c.cat.cooldown <= 0;
    }
    this.top.hullA.set(this.sim.hullPct(0));
    this.top.hullB.set(this.sim.hullPct(1));
    this.top.setWind(this.sim.wind);
    this.top.turn.text = `TURNO ${this.sim.turn}`;
  }

  select(uid: string) {
    if (this.phase !== 'aim') return;
    const sc = this.sim.sides[0].cats.find((k) => k.def.uid === uid);
    if (!sc || sc.ko || sc.cooldown > 0 || sc.stunned > 0) {
      sfx('error');
      return;
    }
    this.selected = uid;
    this.ultArmed = false;
    for (const c of this.cards) c.setSelected(c.cat?.def.uid === uid);
    const bc = this.catViews.get(uid);
    if (bc) {
      gsap.fromTo(bc.scale, { x: 1.15, y: 0.85 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
      gsap.fromTo(bc, { y: bc.y - 26 }, { y: bc.y, duration: 0.35, ease: 'bounce.out' });
      sfx('meow', 0.9 + Math.random() * 0.3);
    }
    this.refreshCards();
  }

  armUlt(c: CatState) {
    if (this.phase !== 'aim' || !this.sim.canUlt(c)) return;
    this.select(c.def.uid);
    this.ultArmed = true;
    sfx('charge');
    const bc = this.catViews.get(c.def.uid);
    if (bc) { const wp = this.world.toLocal(bc.getGlobalPosition()); sparkles(this.world, wp.x, wp.y - 60, elementFx(c.def.elements[0]).accent, 14, 160); }
    floatText(this.overlay, 960, 300, `ULTIMATE LISTA: ${c.def.ultimate?.name ?? ''}`, { color: elementFx(c.def.elements[0]).main, size: 50, rise: 30, dur: 1.4 });
  }

  currentShot(): ShotDef {
    const c = this.sim.sides[0].cats.find((k) => k.def.uid === this.selected)!;
    return this.ultArmed && c.def.ultimate ? c.def.ultimate : c.def.shot;
  }

  // ---------------------------------------------------------------- intro
  async intro() {
    const banner = new Container();
    const band = new Graphics().rect(-200, -90, W + 400, 180).fill(C.ink);
    band.rotation = -0.06;
    const t = poster('¡A LA BATALLA!', 140, C.yellow, { stroke: { color: C.ink, width: 10 } });
    t.anchor.set(0.5);
    const sub = txt(`${this.spec.playerName.toUpperCase()}  VS  ${this.spec.enemyName.toUpperCase()}`, { fontFamily: F.poster, fontSize: 34, fill: C.paper });
    sub.anchor.set(0.5);
    sub.y = 92;
    banner.addChild(band, t, sub);
    banner.position.set(W / 2, H / 2 - 60);
    this.overlay.addChild(banner);
    sfx('fanfare');
    gsap.from(band.scale, { x: 0, duration: 0.3, ease: 'power3.out' });
    gsap.from(t.scale, { x: 2.4, y: 2.4, duration: 0.25, ease: 'back.out(2)', delay: 0.15 });
    this.shaker.add(0.3);
    // line-up: each cat pops
    let i = 0;
    for (const [, bc] of this.catViews) {
      gsap.fromTo(bc.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.35, delay: 0.2 + i * 0.12, ease: 'back.out(3)', onStart: () => sfx('pop', 0.8 + i * 0.1) });
      i++;
    }
    if (this.spec.captainLine) this.speech(this.ships[1], this.spec.captain ?? 'Capitán', this.spec.captainLine, 2.6);
    await new Promise((r) => setTimeout(r, 1500));
    gsap.to(banner, { alpha: 0, y: banner.y - 40, duration: 0.3, onComplete: () => banner.destroy({ children: true }) });
  }

  speech(ship: ShipView, who: string, line: string, dur = 2) {
    const c = new Container();
    const t = txt(line, { fontFamily: F.comic, fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: 380 });
    const n = txt(who.toUpperCase(), { fontFamily: F.poster, fontSize: 18, fill: C.pinkHot });
    n.position.set(0, -26);
    const bg = new Graphics()
      .roundRect(-16, -34, Math.max(t.width, n.width) + 32, t.height + 46, 14)
      .fill(C.paper)
      .stroke({ width: 4, color: C.ink });
    c.addChild(bg, n, t);
    const p = ship.getGlobalPosition();
    const lp = this.overlay.toLocal(p);
    c.position.set(Math.min(W - 460, Math.max(20, lp.x + 40)), lp.y - 150);
    this.overlay.addChild(c);
    gsap.from(c.scale, { x: 0.3, y: 0.3, duration: 0.25, ease: 'back.out(3)' });
    gsap.to(c, { alpha: 0, delay: dur, duration: 0.3, onComplete: () => c.destroy({ children: true }) });
  }

  // ---------------------------------------------------------------- turns
  async playerTurn(): Promise<void> {
    if (this.sim.winner !== null) return this.finish();
    const ev = this.sim.startTurn(0);
    await this.playTicks(ev);
    if (this.sim.winner !== null) return this.finish();
    this.phase = 'aim';
    const avail = this.sim.shooters(0);
    if (!avail.find((c) => c.def.uid === this.selected)) this.selected = avail[0]?.def.uid ?? '';
    if (!avail.length) {
      // nobody can shoot: the cannons still fire
      floatText(this.overlay, W / 2, H / 2, 'TUS GATOS ESTÁN FUERA… ¡CAÑONES, FUEGO!', { color: C.paper, size: 46 });
      await wait(700);
      await this.autoVolley(0);
      this.sim.endTurn();
      this.refreshCards();
      if (this.sim.winner !== null) return this.finish();
      return this.enemyTurn();
    }
    for (const c of this.cards) c.setSelected(c.cat?.def.uid === this.selected);
    this.ultArmed = false;
    this.refreshCards();
    this.turnBanner('TU TURNO', C.yellow);
  }

  turnBanner(text: string, color: number) {
    const t = poster(text, 64, color, { stroke: { color: C.ink, width: 8 } });
    t.anchor.set(0.5);
    t.position.set(W / 2, 170);
    this.overlay.addChild(t);
    gsap.from(t.scale, { x: 0.3, y: 0.3, duration: 0.2, ease: 'back.out(3)' });
    gsap.to(t, { alpha: 0, delay: 0.9, duration: 0.3, onComplete: () => t.destroy() });
  }

  async enemyTurn(): Promise<void> {
    if (this.sim.winner !== null) return this.finish();
    this.phase = 'enemy';
    this.refreshCards();
    const ev = this.sim.startTurn(1);
    await this.playTicks(ev);
    if (this.sim.winner !== null) return this.finish();
    this.turnBanner('TURNO ENEMIGO', C.pinkHot);
    await wait(this.fast ? 300 : 900);
    const d = decide(this.sim, 1, DIFFICULTY[this.spec.difficulty], this.aiMemory, Math.floor(Math.random() * 1e9));
    if (d) {
      const cat = this.sim.sides[1].cats.find((c) => c.def.uid === d.shooter);
      const bc = this.catViews.get(d.shooter);
      if (bc && !this.fast) {
        const wp = this.world.toLocal(bc.getGlobalPosition());
        this.cam.tx = wp.x;
        this.cam.ty = wp.y - 80;
        this.cam.tz = 1.22;
        gsap.timeline().to(bc.scale, { x: 1.12, y: 0.9, duration: 0.25 }).to(bc.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
        sfx('meow', 0.8);
        await wait(650);
      }
      if (d.ult && cat) await this.ultCutIn(cat);
      const res = this.sim.fire(1, d.shooter, d.angle, d.power, d.ult);
      await this.animateShot(1, d.shooter, res.paths, res.events, res.shot);
    }
    if (this.sim.winner === null) await this.autoVolley(1);
    this.sim.endTurn();
    this.refreshCards();
    if (this.sim.winner !== null) return this.finish();
    this.playerTurn();
  }

  // ---------------------------------------------------------------- input
  down(e: FederatedPointerEvent) {
    if (this.phase !== 'aim') return;
    const p = this.toLocal(e.global);
    if (p.y > H - 200 || p.y < 120) return; // HUD areas
    this.dragging = true;
    this.dragStart = { x: p.x, y: p.y };
  }
  move(e: FederatedPointerEvent) {
    if (!this.dragging || this.phase !== 'aim') return;
    const p = this.toLocal(e.global);
    const dx = this.dragStart.x - p.x;
    const dy = this.dragStart.y - p.y;
    const len = Math.min(300, Math.hypot(dx, dy));
    if (len < 10) return;
    this.aim.angle = Math.atan2(dy, dx);
    this.aim.power = 380 + len * 3.1;
    this.drawAim();
  }
  up() {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.phase !== 'aim') return;
    this.aimG.clear();
    this.playerFire();
  }

  drawAim() {
    const shot = this.currentShot();
    const o = this.sim.muzzle(0, this.selected);
    const paths = this.sim.buildPaths(shot, o, this.aim.angle, this.aim.power, this.sim.wind, 0);
    const g = this.aimG;
    g.clear();
    const frac = (shot.preview ?? 0.4) * this.sim.previewMul(0);
    const col = elementFx(shot.element === 'neutral' ? 'fire' : shot.element).main;
    for (const p of paths) {
      const n = Math.max(6, Math.floor(p.points.length * frac));
      for (let i = 0; i < n; i += 5) {
        const pt = p.points[i];
        const a = 1 - i / n;
        g.circle(pt.x, pt.y, 7 * a + 2).fill({ color: C.ink, alpha: a });
        g.circle(pt.x, pt.y, 4.5 * a + 1).fill({ color: i % 10 === 0 ? col : C.paper, alpha: a });
      }
    }
    // power meter near muzzle
    const pw = (this.aim.power - 380) / 930;
    g.rect(o.x - 40, o.y - 70, 80, 12).fill(C.ink);
    g.rect(o.x - 38, o.y - 68, 76 * Math.min(1, pw), 8).fill(pw > 0.9 ? C.red : C.yellow);
  }

  async playerFire() {
    if (this.phase !== 'aim') return;
    this.phase = 'flight';
    const cat = this.sim.sides[0].cats.find((c) => c.def.uid === this.selected);
    const ult = this.ultArmed && !!cat && this.sim.canUlt(cat);
    if (ult && cat) {
      await this.ultCutIn(cat);
      G.count('ultimates');
    }
    this.lastElevation = -this.aim.angle;
    const res = this.sim.fire(0, this.selected, this.aim.angle, this.aim.power, ult);
    this.refreshCards();
    await this.animateShot(0, this.selected, res.paths, res.events, res.shot);
    if (this.sim.winner === null) await this.autoVolley(0);
    this.sim.endTurn();
    this.refreshCards();
    if (this.sim.winner !== null) return this.finish();
    this.enemyTurn();
  }

  // ---------------------------------------------------------------- ultimate cut-in (storyboard d, compact)
  async ultCutIn(c: CatState) {
    const fx = elementFx(c.def.elements[0]);
    const layer = new Container();
    this.overlay.addChild(layer);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.75 });
    const band = new Graphics().rect(-300, -170, W + 600, 340).fill(fx.main).stroke({ width: 8, color: C.ink });
    band.rotation = -0.12;
    band.position.set(W / 2, H / 2);
    const cat = new BattleCat(c.def.slug, c.def.elements[0], 420, c.side === 1);
    if (c.def.tint !== undefined) cat.sprite.tint = c.def.tint;
    cat.position.set(c.side === 0 ? 520 : W - 520, H / 2 + 200);
    const name = poster(c.def.ultimate?.shout ?? c.def.ultimate?.name ?? 'ULTIMATE', 120, C.paper, { stroke: { color: C.ink, width: 12 } });
    name.anchor.set(0.5);
    name.rotation = -0.12;
    name.position.set(c.side === 0 ? W / 2 + 300 : W / 2 - 300, H / 2 - 20);
    const who = txt(`${c.def.name.toUpperCase()} — BATTLE FORM`, { fontFamily: F.poster, fontSize: 34, fill: C.ink });
    who.anchor.set(0.5);
    who.rotation = -0.12;
    who.position.set(name.x, H / 2 + 90);
    layer.addChild(dim, band, cat, name, who);
    sfx('charge');
    speedLines(layer, W / 2, H / 2, C.ink, 60, 1.1);
    gsap.from(band.scale, { x: 0, duration: 0.18, ease: 'power3.out' });
    gsap.from(cat, { x: c.side === 0 ? -300 : W + 300, duration: 0.25, ease: 'power3.out' });
    gsap.from(name.scale, { x: 3, y: 3, duration: 0.2, delay: 0.2, ease: 'back.out(2)' });
    window.setTimeout(() => {
      sfx('crit');
      cat.impactFrame(140);
      this.shaker.add(0.4);
    }, 420);
    await wait(settings.reduceMotion ? 600 : 1250);
    sfx('whoosh');
    gsap.to(layer, { alpha: 0, duration: 0.2, onComplete: () => layer.destroy({ children: true }) });
  }

  // ---------------------------------------------------------------- automatic cannons
  async autoVolley(side: 0 | 1) {
    const cannons = this.sim.cannons(side);
    if (!cannons.length) return;
    const v = this.ships[side];
    const gp = this.overlay.toLocal(v.getGlobalPosition());
    const label = poster(cannons.length > 1 ? `¡ANDANADA ×${cannons.length}!` : '¡CAÑONAZO!', 54, C.paper, { stroke: { color: C.ink, width: 8 } });
    label.anchor.set(0.5);
    label.rotation = side === 0 ? -0.06 : 0.06;
    label.position.set(gp.x + v.width / 2, gp.y - 60);
    this.overlay.addChild(label);
    gsap.from(label.scale, { x: 0.2, y: 0.2, duration: 0.18, ease: 'back.out(3)' });
    gsap.to(label, { alpha: 0, delay: 0.9, duration: 0.25, onComplete: () => label.destroy() });
    for (const m of cannons) {
      if (this.sim.winner !== null) break;
      if (!m.alive) continue;
      const a = aimCannon(this.sim, side, m.id, Math.floor(Math.random() * 1e9), side === 0 ? 2.2 : 2.8);
      const res = this.sim.fire(side, 'cannon', a.angle, a.power, false, m.id);
      const mz = this.sim.cannonMuzzle(side, m.id);
      this.fxp.burst(mz.x, mz.y, { count: 18, tint: [C.yellow, C.orange, C.paper, 0x8a95a3], speed: [100, 420], gravity: -60, life: [0.2, 0.6], angle: side === 0 ? [-0.6, 0.6] : [Math.PI - 0.6, Math.PI + 0.6] });
      v.hitReact?.(side === 0 ? 0 : 9999, 0.12);
      await this.animateShot(side, 'cannon', res.paths, res.events, res.shot, true);
      this.refreshCards();
    }
  }

  // ---------------------------------------------------------------- animation of events
  async playTicks(ev: BattleEvent[]) {
    if (!ev.length) return;
    for (const e of ev) this.applyEvent(e);
    await wait(this.fast ? 150 : 450);
    this.refreshCards();
  }

  animateShot(side: number, shooter: string, paths: ShotPath[], events: BattleEvent[], shot: ShotDef, quick = false): Promise<void> {
    return new Promise((resolve) => {
      const fx = elementFx(shot.element === 'neutral' ? 'fire' : shot.element);
      const bc = this.catViews.get(shooter);
      if (bc) {
        gsap.timeline().to(bc.scale, { x: 1.2, y: 0.8, duration: 0.08 }).to(bc.scale, { x: 0.9, y: 1.15, duration: 0.06 }).to(bc.scale, { x: 1, y: 1, duration: 0.3, ease: 'elastic.out(1,0.4)' });
      }
      sfx(shot.element === 'electric' ? 'zap' : 'shoot', quick ? 1.25 : 1);
      this.shaker.add(quick ? 0.06 : 0.12);
      const o = paths[0].points[0];
      this.fxp.burst(o.x, o.y, { count: 14, tint: [fx.main, fx.accent, C.paper], speed: [80, 380], gravity: 0, life: [0.15, 0.35] });
      const balls = paths.map(() => {
        const g = new Container();
        const glow = new Sprite(glowTexture());
        glow.anchor.set(0.5);
        glow.tint = fx.main;
        glow.scale.set(0.5);
        const core = new Graphics().circle(0, 0, shot.trajectory === 'meteor' ? 30 : 12).fill(fx.main).stroke({ width: 4, color: C.ink });
        g.addChild(glow, core);
        this.world.addChild(g);
        return g;
      });
      if (!quick) {
        this.follow = balls[0];
        this.cam.tz = 1.16;
      }
      const idx = paths.map(() => 0);
      const done = paths.map(() => false);
      const consumed = new Set<BattleEvent>();
      let acc = 0;
      const tick = (t: Ticker) => {
        acc += (t.deltaMS / 1000) * time.scale * (this.fast ? 2.5 : 1) * (quick ? 1.7 : 1);
        const stepDt = 1 / 120;
        while (acc >= stepDt) {
          acc -= stepDt;
          paths.forEach((p, pi) => {
            if (done[pi]) return;
            idx[pi]++;
            const i = idx[pi];
            if (i >= p.points.length) {
              done[pi] = true;
              balls[pi].destroy({ children: true });
              // flush remaining events for this path
              for (const e of events) if (!consumed.has(e) && 'path' in e && e.path === pi) {
                consumed.add(e);
                this.applyEvent(e);
              }
              return;
            }
            const pt = p.points[i];
            balls[pi].position.set(pt.x, pt.y);
            if (i % 3 === 0) this.fxp.burst(pt.x, pt.y, { count: 1, tint: [fx.main, fx.accent], speed: [0, 30], life: [0.2, 0.4], gravity: 0, scale: [0.35, 0.55], texture: dotTexture() });
            if (p.impacts.includes(i)) {
              for (const e of events) if (!consumed.has(e) && 'path' in e && e.path === pi && e.at === i) {
                consumed.add(e);
                this.applyEvent(e);
              }
            }
          });
        }
        if (done.every(Boolean)) {
          Ticker.shared.remove(tick);
          this.follow = null;
          window.setTimeout(() => {
            if (!this.follow) {
              this.cam.tx = W / 2;
              this.cam.ty = H / 2;
              this.cam.tz = 1;
            }
          }, quick ? 100 : 450);
          for (const e of events) if (!consumed.has(e)) this.applyEvent(e);
          this.refreshCards();
          window.setTimeout(resolve, this.fast || quick ? 200 : 650);
        }
      };
      Ticker.shared.add(tick);
    });
  }

  applyEvent(e: BattleEvent) {
    switch (e.k) {
      case 'cell': {
        const v = this.ships[e.side];
        if (e.destroyed) v.knockOff(e.cell, this.debris, this.sim.cellCenter(e.side, e.cell.x, e.cell.y));
        else v.refreshCell(e.cell);
        if (e.side === 1) this.stats.damageDealt += e.dmg;
        break;
      }
      case 'tick': {
        const v = this.ships[e.side];
        const p = this.sim.cellCenter(e.side, e.cell.x, e.cell.y);
        if (e.destroyed) v.knockOff(e.cell, this.debris, p, 0.4);
        else v.refreshCell(e.cell);
        if (e.status === 'burning') this.fxp.burst(p.x, p.y, { count: 6, tint: [C.orange, C.yellow], speed: [40, 120], gravity: -200, life: [0.3, 0.6] });
        floatText(this.wfx, p.x, p.y - 20, `-${this.show(e.dmg)}`, { color: C.orange, size: 26, rise: 40 });
        break;
      }
      case 'spread':
        this.ships[e.side].refreshCell(e.cell);
        break;
      case 'impact': {
        const [word, col] = ONO[e.element] ?? ONO.neutral;
        const fx = elementFx(e.element === 'neutral' ? 'fire' : e.element);
        const big = e.total > 400;
        sfx(e.total > 600 ? 'bigboom' : 'boom');
        if (e.crit) sfx('crit');
        time.hitstop(Math.min(150, 50 + e.total / 12));
        this.shaker.add(Math.min(0.75, 0.15 + e.total / 1500));
        if (big && !settings.reduceFlashes) flash(this.overlay, C.paper, 0.3, 0.12);
        this.fxp.burst(e.x, e.y, { count: big ? 48 : 28, tint: [fx.main, fx.accent, C.ink, C.paper], speed: [200, 850], life: [0.4, 1], scale: [0.4, 1.3], stepped: true });
        onomatopoeia(this.wfx, e.x, e.y - 90, word, { color: col, size: big ? 130 : 96 });
        const sv = this.ships[e.side];
        sv.hitReact?.(e.x - sv.x, Math.min(1, 0.2 + e.total / 900));
        this.cam.z += Math.min(0.08, 0.02 + e.total / 8000);
        if (e.total > 0) floatText(this.wfx, e.x + 70, e.y - 30, `-${this.show(e.total)}`, { color: e.crit ? C.pinkHot : C.paper, size: e.crit ? 64 : 46, font: F.heavy });
        if (e.crit) floatText(this.wfx, e.x - 60, e.y - 170, '¡CRÍTICO!', { color: C.pinkHot, size: 54, rot: -0.2 });
        break;
      }
      case 'chunk': {
        if (!e.cells.length) break;
        this.ships[e.side].sinkChunk(e.cells, this.debris, (sx) => {
          sfx('splash');
          this.fxp.burst(sx, WATER_Y, { count: 40, tint: [C.paper, C.megaBlue, 0x7fd8ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [300, 850] });
        });
        const p = this.sim.cellCenter(e.side, e.cells[0].x, e.cells[0].y);
        onomatopoeia(this.wfx, p.x, p.y - 160, 'CRACK!', { color: C.pinkHot, size: 100 });
        this.shaker.add(0.4);
        sfx('bigboom');
        break;
      }
      case 'cat': {
        const bc = this.catViews.get(e.uid);
        if (!bc || bc.destroyed) break;
        const st = this.statusViews.get(e.uid);
        const gp = this.wfx.toLocal(bc.getGlobalPosition());
        if (e.shield) {
          sfx('shield');
          floatText(this.wfx, gp.x, gp.y - 120, '¡BLOCK!', { color: C.cyan, size: 48 });
          break;
        }
        if (!e.ko) st?.set(e.fx);
        if (e.dmg > 0) {
          floatText(this.wfx, gp.x, gp.y - 140, e.dot ? `-${this.show(e.dmg)} 🔥` : `-${this.show(e.dmg)}`, { color: e.dot ? C.orange : C.red, size: e.dot ? 30 : 40, font: F.heavy });
        }
        if (!e.dot && !e.overboard) {
          gsap.fromTo(bc, { x: bc.x + (e.side === 0 ? -14 : 14) }, { x: bc.x, duration: 0.35, ease: 'elastic.out(1,0.3)' });
          if (e.element === 'electric' && !e.ko) st?.electrocute();
          else bc.impactFrame(90, false);
          if (e.element === 'fire' && e.fx.burning > 0 && !e.ko) floatText(this.wfx, gp.x, gp.y - 190, '¡AY AY AY!', { color: C.orange, size: 34, rot: 0.15 });
          if (e.element === 'ice' && e.fx.frozen > 0 && !e.ko) floatText(this.wfx, gp.x, gp.y - 190, '¡CONGELADO!', { color: 0xc6f0e4, size: 34 });
          // allies flinch
          for (const [uid, other] of this.catViews) {
            if (uid === e.uid || other.destroyed) continue;
            const oc = this.sim.sides[e.side].cats.find((k) => k.def.uid === uid);
            if (oc && !oc.ko) gsap.fromTo(other.scale, { x: 1.08, y: 0.92 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
          }
        }
        if (e.revived) {
          floatText(this.wfx, gp.x, gp.y - 200, '¡SEGUNDA VIDA!', { color: C.lilac, size: 50 });
          sfx('reveal');
        }
        const splash = (x: number) => this.fxp.burst(x, WATER_Y, { count: 34, tint: [C.paper, C.megaBlue, 0x7fd8ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [250, 700] });
        if (e.ko) {
          if (e.side === 0) this.stats.catsLost++;
          st?.set({ burning: 0, shocked: 0, wet: 0, frozen: 0 });
          playKO(bc, this.wfx, this.world, WATER_Y, e.side, splash);
          this.cam.tx = gp.x;
          this.cam.ty = gp.y - 60;
          this.cam.tz = 1.25;
          time.slowmo(0.5, 500);
          window.setTimeout(() => {
            if (!this.follow) {
              this.cam.tx = W / 2;
              this.cam.ty = H / 2;
              this.cam.tz = 1;
            }
          }, 1300);
        } else if (e.overboard) {
          playOverboard(bc, this.wfx, WATER_Y, splash);
        }
        break;
      }
      case 'reaction': {
        if (!G.s.flags[`reaction_${e.name}`]) {
          G.flag(`reaction_${e.name}`);
          G.count('reactions_discovered');
          floatText(this.wfx, e.x, e.y - 300, '¡SINERGIA DESCUBIERTA!', { color: C.yellow, size: 44, font: F.poster, rise: 40, dur: 1.6 });
        }
        const t = poster(e.name, 76, C.ink, { stroke: { color: C.paper, width: 10 } });
        t.anchor.set(0.5);
        t.position.set(e.x, e.y - 220);
        t.rotation = -0.08;
        const plate = new Graphics().rect(-t.width / 2 - 18, -48, t.width + 36, 96).fill(C.yellow).stroke({ width: 6, color: C.ink });
        plate.position.copyFrom(t.position);
        plate.rotation = t.rotation;
        this.wfx.addChild(plate, t);
        sfx('levelup');
        gsap.from([t.scale, plate.scale], { x: 0.2, y: 0.2, duration: 0.2, ease: 'back.out(3)' });
        gsap.to([t, plate], { alpha: 0, delay: 1.1, duration: 0.3, onComplete: () => (t.destroy(), plate.destroy()) });
        break;
      }
      case 'module': {
        const v = this.ships[e.side];
        v.updateModuleDecor();
        if (e.side === 1) {
          this.stats.modulesDestroyed++;
          if (e.kind === 'powder') G.count('destroy_powder');
          if (this.phase === 'flight' && this.lastElevation > 0.75) G.count('destroy_module_arc');
        }
        const m = this.sim.sides[e.side].ship.modules[e.id];
        const p = this.sim.cellCenter(e.side, m.x, m.y);
        const label = e.kind === 'core' ? '¡NÚCLEO DESTRUIDO!' : '¡MÓDULO DESTRUIDO!';
        floatText(this.wfx, p.x, p.y - 260, label, { color: e.kind === 'core' ? C.pinkHot : C.yellow, size: e.kind === 'core' ? 70 : 42, font: F.poster, rise: 50, dur: 1.4 });
        if (e.kind === 'core') {
          this.shaker.add(1);
          flash(this.overlay, C.white, 0.8, 0.3);
          sfx('bigboom');
        }
        break;
      }
      case 'splash': {
        sfx('splash');
        this.fxp.burst(e.x, WATER_Y, { count: 28, tint: [C.paper, C.megaBlue], angle: [-Math.PI * 0.9, -Math.PI * 0.1], speed: [200, 600] });
        onomatopoeia(this.wfx, e.x, WATER_Y - 70, '¡PLOP!', { color: C.cyan, size: 64 });
        break;
      }
      case 'shieldHit': {
        sfx('shield');
        const ship = this.ships[e.side];
        const gp = this.wfx.toLocal(ship.getGlobalPosition());
        const bub = new Graphics().ellipse(0, 0, ship.width * 0.62, ship.height * 0.7).stroke({ width: 8, color: C.cyan }).fill({ color: C.cyan, alpha: 0.15 });
        bub.position.set(gp.x + ship.width / 2, gp.y + ship.height / 2);
        this.wfx.addChild(bub);
        gsap.fromTo(bub, { alpha: 1 }, { alpha: 0, duration: 0.5, onComplete: () => bub.destroy() });
        if (e.broken) floatText(this.wfx, bub.x, bub.y - 200, '¡ESCUDO ROTO!', { color: C.cyan, size: 56 });
        break;
      }
    }
  }

  // ---------------------------------------------------------------- end
  /** storyboard (e): chain explosions accelerating, then the loser's ship sinks tilted */
  async sinkSequence(loser: number) {
    const v = this.ships[loser];
    const cells = this.sim.sides[loser].ship.cells();
    this.cam.tx = v.x + v.width / 2;
    this.cam.ty = v.y + v.height / 2;
    this.cam.tz = 1.15;
    time.slowmo(0.6, 600);
    let delay = 120;
    const n = Math.min(10, cells.length);
    for (let i = 0; i < n; i++) {
      const c = cells[Math.floor(Math.random() * cells.length)];
      const p = this.sim.cellCenter(loser, c.x, c.y);
      window.setTimeout(() => {
        sfx(i === n - 1 ? 'bigboom' : 'boom', 1 + i * 0.06);
        this.fxp.burst(p.x, p.y, { count: 26, tint: [C.orange, C.yellow, C.red, C.ink], speed: [150, 700], life: [0.4, 0.9], scale: [0.5, 1.3], stepped: true });
        this.shaker.add(0.25);
        v.hitReact?.(p.x - v.x, 0.35);
        if (i % 3 === 0) onomatopoeia(this.wfx, p.x, p.y - 60, ['¡BOOM!', '¡KABOOM!', '¡KRAK!', '¡PUM!'][i % 4], { color: C.yellow, size: 90 });
      }, delay * i);
      delay = Math.max(60, delay - 8);
    }
    await wait(delay * n + 200);
    sfx('splash');
    this.sinking.add(v);
    gsap.to(v, { y: v.y + 520, rotation: loser === 1 ? 0.35 : -0.35, duration: 1.6, ease: 'power2.in' });
    for (let i = 0; i < 4; i++)
      window.setTimeout(() => this.fxp.burst(v.x + Math.random() * v.width, WATER_Y, { count: 30, tint: [C.paper, C.megaBlue, 0x7fd8ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [250, 750] }), 300 + i * 280);
    onomatopoeia(this.wfx, v.x + v.width / 2, WATER_Y - 160, loser === 1 ? '¡HUNDIDO!' : '¡GLU GLU GLU!', { color: C.paper, size: 120, dur: 1.4 });
    await wait(1500);
    this.cam.tx = W / 2;
    this.cam.ty = H / 2;
    this.cam.tz = 1;
  }

  async finish(): Promise<void> {
    if (this.phase === 'end') return;
    this.phase = 'end';
    this.refreshCards();
    const won = this.sim.winner === 0;
    await this.sinkSequence(won ? 1 : 0);
    const layer = new Container();
    this.overlay.addChild(layer);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: won ? C.paper : C.oceanNoir, alpha: 0.92 });
    const circle = new Graphics().circle(0, 0, 300).fill(won ? C.pink : C.river);
    circle.position.set(W / 2, H / 2);
    const title = poster(won ? '¡VICTORIA!' : 'DERROTA', 220, won ? C.ink : C.paper, { letterSpacing: -4 });
    title.anchor.set(0.5);
    title.position.set(W / 2, H / 2 - 40);
    const reasonTxt =
      this.sim.reason === 'core'
        ? won
          ? 'LE REVENTASTE EL NÚCLEO'
          : 'TE REVENTARON EL NÚCLEO'
        : this.sim.reason === 'crew'
          ? won
            ? 'TRIPULACIÓN ENEMIGA K.O.'
            : 'TUS GATOS ESTÁN K.O.'
          : won
            ? 'BARCO ENEMIGO HUNDIDO'
            : 'TE HUNDIERON, CAPI';
    const sub = txt(reasonTxt, { fontFamily: F.poster, fontSize: 44, fill: won ? C.pinkHot : C.yellow });
    sub.anchor.set(0.5);
    sub.position.set(W / 2, H / 2 + 100);
    const hint = txt('CLIC PARA CONTINUAR', { fontFamily: F.poster, fontSize: 28, fill: won ? C.ink : C.paper });
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 80);
    layer.addChild(dim, circle, title, sub, hint);
    sfx(won ? 'fanfare' : 'sting');
    gsap.from(circle.scale, { x: 0, y: 0, duration: 0.4, ease: 'back.out(2)' });
    gsap.from(title.scale, { x: 2.5, y: 2.5, duration: 0.3, ease: 'back.out(2)', delay: 0.1 });
    if (won) sparkles(layer, W / 2, H / 2 - 40, C.yellow, 24, 500);
    gsap.to(hint, { alpha: 0.3, yoyo: true, repeat: -1, duration: 0.6 });
    await wait(600);
    layer.eventMode = 'static';
    layer.hitArea = { contains: () => true };
    layer.once('pointertap', () => {
      const result: BattleResult = {
        won,
        reason: this.sim.reason,
        turns: this.sim.turn,
        modulesDestroyed: this.stats.modulesDestroyed,
        damageDealt: this.stats.damageDealt,
        catsLost: this.stats.catsLost,
        perfect: won && this.stats.catsLost === 0,
      };
      this.spec.onEnd(result);
    });
  }

  override update(dt: number) {
    for (const v of this.ships) if (!this.sinking.has(v)) v.bob(dt * time.scale);
    // camera rig: follow projectile, ease back to the wide shot
    if (this.follow && !this.follow.destroyed) {
      const lead = this.follow.x < W / 2 ? 120 : -60;
      this.cam.tx = this.follow.x + lead * 0.5;
      this.cam.ty = Math.min(this.follow.y, WATER_Y - 200);
    }
    const k = 1 - Math.exp(-dt * 4);
    this.cam.x += (this.cam.tx - this.cam.x) * k;
    this.cam.y += (this.cam.ty - this.cam.y) * k;
    this.cam.z += (this.cam.tz - this.cam.z) * (1 - Math.exp(-dt * 5));
    const z = Math.max(1, this.cam.z);
    const hw = W / (2 * z);
    const hh = H / (2 * z);
    const cx = Math.max(hw, Math.min(W - hw, this.cam.x));
    const cy = Math.max(hh, Math.min(H - hh, this.cam.y));
    this.camRoot.scale.set(z);
    this.camRoot.position.set(W / 2 - cx * z, H / 2 - cy * z);
    if (this.sky) this.sky.wind = this.sim?.wind ?? 0;
    // burning cells emit flames
    this.burnAcc += dt;
    if (this.burnAcc > 0.12 && this.sim) {
      this.burnAcc = 0;
      for (let side = 0; side < 2; side++) {
        for (const c of this.sim.sides[side].ship.cells()) {
          if (!c.status.burning) continue;
          const p = this.sim.cellCenter(side, c.x, c.y);
          this.fxp.burst(p.x + (Math.random() - 0.5) * 20, p.y - 10, { count: 1, tint: [C.orange, C.yellow, C.red], speed: [20, 60], angle: [-Math.PI * 0.7, -Math.PI * 0.3], gravity: -260, life: [0.4, 0.7], scale: [0.5, 0.9] });
        }
      }
    }
  }
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export { scenes };
