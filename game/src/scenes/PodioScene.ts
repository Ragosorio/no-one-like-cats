/**
 * EL PODIO — 1 vs 1 cat duels (Dragon City style): your cat on the left, the rival on the right, in an
 * arena of the rival's element. Four powers bottom-left, speed ×½/×1/×2/×4 + AUTO bottom-right.
 * Lobby (ladder + picker) → duel → results → next rival / lobby / island.
 * Entered with panels/podio/open.ts (openPodio). Logic: podio/engine.ts · system: state/sys/podio.ts.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { C, F } from '../ui/theme';
import { txt, Button } from '../ui/widgets';
import { music } from '../core/music';
import { sfx } from '../core/audio';
import { Shaker, time } from '../fx/juice';
import { Particles } from '../fx/particles';
import { BattleCat } from '../art/catArt';
import { applyCatTint } from '../art/tint';
import { goIsland } from '../app/flow';
import { G, OwnedCat } from '../state/game';
import { catDef } from '../data/content';
import { ensureCats } from '../panels/campaign/common';
import { Arena, SPOT } from '../podio/arena';
import { PodioFx, P2 } from '../podio/fx';
import { Duel, DuelEv } from '../podio/engine';
import { FighterBar, PowerButton, SpeedBar, Toggle, show } from '../podio/hud';
import { Lobby } from '../podio/lobby';
import { PodioResults } from '../podio/results';
import { PowerDef, STATUS_DESC, STATUS_NAME } from '../podio/powers';
import { KO_WORDS, SKIP_TEXT, START, pick } from '../podio/lines';
import { SPEEDS, aiSkill, applyDuel, league, playerFighter, ps, rivalAt, rivalFighter } from '../state/sys/podio';
import type { RivalDef } from '../podio/ladder';

const CAT_SIZE = 400;

export class PodioScene extends Scene {
  override bleed: number | null = 0x0d0b10;
  private world = new Container();
  private stage = new Container();
  private catLayer = new Container();
  private fxLayer = new Container();
  private ui = new Container();
  private top = new Container();
  private particles = new Particles();
  private shaker!: Shaker;
  private fx!: PodioFx;
  private arena: Arena | null = null;
  private lobby: Lobby | null = null;
  private results: PodioResults | null = null;
  // ---- duel state
  private duel: Duel | null = null;
  private cat: OwnedCat | null = null;
  private rival: RivalDef | null = null;
  private cats: BattleCat[] = [];
  private bars: FighterBar[] = [];
  private buttons: PowerButton[] = [];
  private shields: (Graphics | null)[] = [null, null];
  private spirits: (Container | null)[] = [null, null];
  private stuns: (Container | null)[] = [null, null];
  private pending: ((slot?: number) => void) | null = null;
  private runId = 0;
  private cur: { side: 0 | 1; p: PowerDef } | null = null;
  private turnPill = new Container();
  private tipBox = new Container();
  private hint: Text | null = null;
  private superShown = 0;
  private forfeitArmed = 0;
  private forfeitBtn: Button | null = null;
  private autoT: Toggle | null = null;
  private speedB: SpeedBar | null = null;

  override async enter() {
    this.world.addChild(this.stage, this.catLayer, this.particles, this.fxLayer);
    this.addChild(this.world, this.ui, this.top);
    this.shaker = new Shaker(this.world, 26, 0.02);
    this.fx = new PodioFx(this.fxLayer, this.particles, () => this.speed);
    music.play('battle');
    await ensureCats(G.s.cats.map((c) => c.species));
    if (this.destroyed) return;
    this.showLobby();
  }

  override exit() {
    this.runId++;
    this.shaker?.destroy();
    gsap.globalTimeline.timeScale(1);
    time.scale = 1;
  }

  override update(dt: number) {
    this.arena?.update(dt);
  }

  get speed() {
    return ps().speed || 1;
  }

  /** wait `s` seconds of battle time (scaled by the speed, frozen by hit-stop) */
  private wait(s: number) {
    return new Promise<void>((r) => gsap.delayedCall(s / this.speed, r));
  }

  private clearAll() {
    this.pending = null;
    this.runId++;
    for (const layer of [this.ui, this.top, this.catLayer, this.fxLayer, this.stage]) {
      for (const ch of layer.removeChildren()) {
        killDeep(ch as Container);
        ch.destroy({ children: true });
      }
    }
    this.arena = null;
    this.lobby = null;
    this.results = null;
    this.cats = [];
    this.bars = [];
    this.buttons = [];
    this.shields = [null, null];
    this.spirits = [null, null];
    this.stuns = [null, null];
    this.forfeitBtn = null;
    this.autoT = null;
    this.speedB = null;
    this.hint = null;
    this.turnPill = new Container();
    this.tipBox = new Container();
  }

  // ================================================================== LOBBY
  showLobby() {
    this.clearAll();
    const p = ps();
    const r = rivalAt(p.league, p.bout);
    this.setArena(r.def.elements[0], league(p.league).name, league(p.league).color);
    const dim = new Graphics().rect(-400, -200, W + 800, H + 400).fill({ color: C.ink, alpha: 0.35 });
    this.ui.addChild(dim);
    void ensureCats([r.species, ...[0, 1, 2, 3, 4].map((i) => rivalAt(p.league, i).species)]).then(() => {
      if (this.destroyed || this.duel) return;
      this.lobby?.destroy({ children: true });
      this.lobby = new Lobby({
        onFight: (uid, lg, bout) => void this.startDuel(uid, lg, bout),
        onExit: () => void goIsland(),
      });
      this.ui.addChild(this.lobby);
    });
    music.play('battle');
  }

  private setArena(el: string, lname: string, lcol: number) {
    for (const ch of this.stage.removeChildren()) {
      killDeep(ch as Container);
      ch.destroy({ children: true });
    }
    this.arena = new Arena(el, lname, lcol);
    this.stage.addChild(this.arena);
  }

  // ================================================================== DUEL
  async startDuel(uid: string, lg: number, bout: number) {
    const cat = G.s.cats.find((c) => c.uid === uid);
    if (!cat) return;
    const r = rivalAt(lg, bout);
    await ensureCats([cat.species, r.species]);
    if (this.destroyed) return;
    this.clearAll();
    const run = this.runId;
    this.cat = cat;
    this.rival = r;
    this.superShown = 0;
    const seed = (Date.now() ^ (r.seed * 31)) >>> 0;
    const duel = (this.duel = new Duel(playerFighter(cat), rivalFighter(r), seed, aiSkill(lg, r.champion)));
    this.setArena(r.def.elements[0], league(lg).name, league(lg).color);
    music.play(r.champion ? 'boss' : 'battle');
    // ---- the two cats
    for (const side of [0, 1] as const) {
      const f = duel.f[side];
      const bc = new BattleCat(f.slug, f.elements[0], CAT_SIZE, side === 1);
      applyCatTint(bc.sprite, f.species);
      (bc as unknown as { baseTint: number }).baseTint = bc.sprite.tint as number;
      bc.position.set(side === 0 ? -300 : W + 300, SPOT[side].y);
      this.catLayer.addChild(bc);
      this.cats.push(bc);
    }
    // ---- bars
    for (const side of [0, 1] as const) {
      const b = new FighterBar(duel.f[side], side, side === 0 ? C.pinkHot : league(lg).color);
      b.position.set(side === 0 ? 24 : W - 24 - b.W, -260);
      this.ui.addChild(b);
      b.sync(false);
      this.bars.push(b);
    }
    // ---- turn pill + hint + tooltip
    this.turnPill.position.set(W / 2, 156);
    this.ui.addChild(this.turnPill, this.tipBox);
    // ---- power cards (bottom-left)
    const lv = duel.f[0].levels;
    duel.f[0].powers.forEach((p, i) => {
      const b = new PowerButton(p, lv[i], (slot) => this.pick(slot));
      b.position.set(24 + i * (b.w + 16), H - b.h - 22);
      b.onTip = (pp, bb) => this.showTip(pp, bb);
      this.ui.addChild(b);
      this.buttons.push(b);
    });
    // ---- speed / auto / forfeit (bottom-right)
    this.speedB = new SpeedBar(SPEEDS, () => this.speed, (v) => {
      ps().speed = v;
    });
    this.speedB.position.set(1172, H - 84);
    this.autoT = new Toggle('AUTO', () => ps().auto, (v) => {
      ps().auto = v;
      if (v && this.pending) this.resolvePick(undefined);
    }, 170);
    this.autoT.position.set(1540, H - 84);
    this.forfeitBtn = new Button('RENDIRSE', () => this.forfeit(), { w: 168, h: 60, color: C.paperDark, size: 26 });
    this.forfeitBtn.position.set(1724, H - 84);
    this.ui.addChild(this.speedB, this.autoT, this.forfeitBtn);
    this.refreshButtons();
    // ---- intro
    await this.intro(run);
    if (run !== this.runId) return;
    await this.loop(run);
  }

  private async intro(run: number) {
    const tl = gsap.timeline();
    tl.timeScale(Math.min(2, this.speed));
    this.cats.forEach((bc, side) => {
      bc.sprite.crouch = 0.6;
      tl.to(bc, { x: SPOT[side].x, duration: 0.45, ease: 'power3.out' }, side * 0.1).call(
        () => {
          bc.sprite.crouch = 0;
          this.fx.dust({ x: SPOT[side].x, y: SPOT[side].y });
          sfx('whoosh');
        },
        [],
        0.45 + side * 0.1,
      );
    });
    this.bars.forEach((b) => tl.to(b, { y: 24, duration: 0.4, ease: 'back.out(1.6)' }, 0.3));
    await new Promise<void>((r) => tl.call(r, [], 0.75));
    if (run !== this.runId) return;
    // rival taunt
    const r = this.rival!;
    this.bubble(1, r.taunt, 1.6);
    this.cats[1].sprite.emote('attack', 0.6);
    await this.wait(1.1);
    if (run !== this.runId) return;
    this.fx.banner(pick(START), C.yellow, H * 0.42, 130, 0.7);
    this.shaker.add(0.35);
    sfx('bigboom', 1.2);
    this.arena?.cheerUp(1.5);
    await this.wait(0.8);
  }

  private async loop(run: number) {
    const duel = this.duel!;
    while (!duel.over) {
      if (run !== this.runId || this.destroyed) return;
      const side = duel.turn;
      this.setTurn(side);
      let choice: number | undefined;
      if (side === 0 && !ps().auto && !duel.willSkip(0)) {
        choice = await new Promise<number | undefined>((res) => (this.pending = res));
        if (run !== this.runId || this.destroyed) return;
      } else await this.wait(side === 1 ? 0.45 : 0.25);
      if (run !== this.runId) return;
      this.pending = null;
      this.refreshButtons(true);
      const ev = duel.step(choice);
      await this.play(ev, run);
      if (run !== this.runId) return;
      this.syncStatusFx();
      await this.wait(0.25);
    }
    if (run !== this.runId) return;
    await this.finish(run, duel.winner === 0);
  }

  private pick(slot: number) {
    if (!this.pending || !this.duel || this.duel.turn !== 0) return;
    if (!this.duel.usable(0, slot)) return;
    this.resolvePick(slot);
  }
  private resolvePick(slot: number | undefined) {
    const p = this.pending;
    this.pending = null;
    this.hideHint();
    for (const ch of this.tipBox.removeChildren()) ch.destroy({ children: true });
    p?.(slot);
  }

  private setTurn(side: 0 | 1) {
    this.arena?.focus(side);
    const c = this.turnPill;
    for (const ch of c.removeChildren()) ch.destroy({ children: true });
    const mine = side === 0;
    const label = mine ? (ps().auto ? 'TU TURNO · AUTO' : 'TU TURNO') : `TURNO DE ${this.rival?.def.name.toUpperCase() ?? 'RIVAL'}`;
    const t = txt(label, { fontFamily: F.poster, fontSize: 34, fill: mine ? C.ink : C.paper, letterSpacing: 2 });
    t.anchor.set(0.5);
    const w = t.width + 50;
    const g = new Graphics().rect(-w / 2 + 6, -26 + 6, w, 52).fill(C.ink).rect(-w / 2, -26, w, 52).fill(mine ? C.yellow : C.red).stroke({ width: 4, color: C.ink, alignment: 1 });
    const n = txt(`RONDA ${Math.floor((this.duel?.n ?? 0) / 2) + 1}`, { fontFamily: F.bebas, fontSize: 22, fill: C.paper, letterSpacing: 3, stroke: { color: C.ink, width: 4 } });
    n.anchor.set(0.5);
    n.y = 44;
    c.addChild(g, t, n);
    gsap.fromTo(c.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' });
    this.refreshButtons();
    if (mine && !ps().auto && !this.duel?.willSkip(0)) this.showHint();
  }

  private showHint() {
    this.hideHint();
    const t = txt('ELIGE UN PODER', { fontFamily: F.comic, fontSize: 40, fill: C.yellow, stroke: { color: C.ink, width: 8, join: 'round' }, letterSpacing: 2 });
    t.position.set(30, H - 222);
    this.ui.addChild(t);
    gsap.to(t, { y: t.y - 10, duration: 0.45, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.hint = t;
  }
  private hideHint() {
    if (!this.hint) return;
    gsap.killTweensOf(this.hint);
    this.hint.destroy();
    this.hint = null;
  }

  private showTip(p: PowerDef | null, b: PowerButton) {
    const c = this.tipBox;
    for (const ch of c.removeChildren()) ch.destroy({ children: true });
    if (!p) return;
    const lv = this.duel?.f[0].levels[p.slot] ?? 0;
    const st = p.status ? ` · ${STATUS_NAME[p.status.id]}: ${STATUS_DESC[p.status.id]}` : '';
    const t = txt(`${p.desc}${st}${lv > 1 ? ` · Nv ${lv}: +${Math.round((lv - 1) * 12)}% de poder` : ''}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: C.ink, wordWrap: true, wordWrapWidth: 520 });
    t.position.set(14, 10);
    const g = new Graphics().rect(6, 6, t.width + 28, t.height + 20).fill(C.ink).rect(0, 0, t.width + 28, t.height + 20).fill(C.mintLight).stroke({ width: 3, color: C.ink, alignment: 1 });
    c.addChild(g, t);
    c.position.set(Math.min(W - g.width - 30, b.x), b.y - g.height - 18);
  }

  private refreshButtons(lock = false) {
    const d = this.duel;
    if (!d) return;
    const f = d.f[0];
    const myTurn = !lock && d.turn === 0 && !d.over && !ps().auto;
    this.buttons.forEach((b, i) => b.setState({ usable: d.usable(0, i), myTurn, cd: f.cds[i], meter: f.meter, locked: f.levels[i] <= 0 }));
  }

  // ------------------------------------------------------------------ event playback
  private pos(side: 0 | 1, part: 'body' | 'mouth' | 'head' | 'feet'): P2 {
    const x = SPOT[side].x;
    const y = SPOT[side].y;
    const dir = side === 0 ? 1 : -1;
    if (part === 'feet') return { x, y };
    if (part === 'head') return { x, y: y - CAT_SIZE * 0.78 };
    if (part === 'mouth') return { x: x + dir * CAT_SIZE * 0.22, y: y - CAT_SIZE * 0.55 };
    return { x, y: y - CAT_SIZE * 0.45 };
  }

  private async play(evs: DuelEv[], run: number) {
    const d = this.duel!;
    for (const e of evs) {
      if (run !== this.runId || this.destroyed) return;
      switch (e.t) {
        case 'turn':
          break;
        case 'use':
          this.cur = { side: e.side, p: e.power };
          await this.animUse(e.side, e.power);
          break;
        case 'hit':
          await this.animHit(e);
          break;
        case 'status': {
          const at = this.pos(e.side, 'head');
          this.fx.number({ x: at.x, y: at.y + 40 }, STATUS_NAME[e.id], { color: e.id === 'stun' ? C.yellow : C.orange, size: 42, rot: 0 });
          this.bars[e.side].syncChips();
          if (e.id === 'stun' && !this.stuns[e.side]) this.stuns[e.side] = this.fx.stunStars(this.pos(e.side, 'head'));
          break;
        }
        case 'resist':
          this.fx.number(this.pos(e.side, 'head'), '¡RESISTE!', { color: C.paper, size: 40, rot: 0 });
          break;
        case 'dot': {
          const at = this.pos(e.side, 'body');
          if (e.id === 'summon') {
            const sp = this.spirits[1 - e.side];
            if (sp && !sp.destroyed) await this.fx.spiritStrike(sp, at);
            this.fx.impact(at, d.f[1 - e.side].elements[0], { small: true });
          } else this.fx.puff(at, e.id);
          this.fx.number({ x: at.x + 60, y: at.y - 80 }, `-${show(e.dmg)}`, { color: e.id === 'burn' ? C.orange : e.id === 'root' ? C.green : C.violet, size: 46 });
          this.cats[e.side].sprite.emote('hurt', 0.6);
          this.bars[e.side].sync();
          await this.wait(0.35);
          break;
        }
        case 'heal': {
          await this.fx.heal(this.pos(e.side, 'body'));
          this.fx.number(this.pos(e.side, 'head'), `+${show(e.amount)}`, { color: C.green, size: 54 });
          this.cats[e.side].sprite.emote('happy', 1);
          sfx('levelup', 1.4);
          this.bars[e.side].sync();
          await this.wait(0.3);
          break;
        }
        case 'cleanse':
          this.fx.number({ ...this.pos(e.side, 'head'), y: this.pos(e.side, 'head').y + 50 }, '¡LIMPIO!', { color: C.mint, size: 40, rot: 0 });
          this.clearStun(e.side);
          this.bars[e.side].syncChips();
          break;
        case 'shield': {
          this.shields[e.side]?.destroy();
          const s = this.fx.shield(this.pos(e.side, 'body'), d.f[e.side].elements[0]);
          this.shields[e.side] = s;
          sfx('shield');
          this.bars[e.side].sync();
          await this.wait(0.45);
          break;
        }
        case 'summon': {
          this.spirits[e.side]?.destroy({ children: true });
          const at = this.pos(e.side, 'body');
          this.spirits[e.side] = this.fx.spirit({ x: at.x - (e.side === 0 ? 170 : -170), y: at.y - 140 }, d.f[e.side].elements[0]);
          sfx('reveal', 1.5);
          await this.wait(0.4);
          break;
        }
        case 'skip': {
          const at = this.pos(e.side, 'head');
          this.fx.number({ x: at.x, y: at.y + 20 }, SKIP_TEXT[e.why] ?? '…', { color: C.yellow, size: 50, rot: 0 });
          const sp = this.cats[e.side].sprite;
          if (e.why === 'sleep') sp.emote('sleepy', 1);
          else sp.emote('surprise', 1);
          gsap.fromTo(this.cats[e.side], { rotation: -0.06 }, { rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.25)' });
          if (e.why === 'stun') this.clearStun(e.side);
          sfx('error', 0.7);
          await this.wait(0.7);
          break;
        }
        case 'meter':
          this.bars[e.side].sync();
          if (e.side === 0 && e.v >= 100 && d.f[0].levels[3] > 0) {
            this.fx.banner('¡ULTI LISTA!', C.yellow, H - 260, 48, 0.6);
            sfx('charge', 1.3);
          }
          break;
        case 'ko':
          await this.faint(e.side);
          break;
        case 'decision':
          this.fx.banner('DECISIÓN DE LOS JUECES', C.paper, H * 0.4, 70, 1.2);
          await this.wait(1.2);
          break;
      }
    }
    this.refreshButtons();
  }

  private bubble(side: 0 | 1, text: string, dur = 1.2) {
    const at = this.pos(side, 'head');
    const t = txt(text, { fontFamily: F.ui, fontWeight: '700', fontSize: 24, fill: C.ink, wordWrap: true, wordWrapWidth: 380, align: 'center' });
    t.anchor.set(0.5);
    const w = t.width + 36;
    const h = t.height + 24;
    const c = new Container();
    const tailX = side === 0 ? -w / 2 + 50 : w / 2 - 50;
    const g = new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 18)
      .fill(C.paper)
      .stroke({ width: 4, color: C.ink })
      .poly([tailX - 14, h / 2 - 2, tailX + 14, h / 2 - 2, tailX + (side === 0 ? -10 : 10), h / 2 + 26])
      .fill(C.paper)
      .stroke({ width: 4, color: C.ink });
    c.addChild(g, t);
    c.position.set(Math.max(w / 2 + 20, Math.min(W - w / 2 - 20, at.x + (side === 0 ? 120 : -120))), at.y - 30);
    c.scale.set(0.3);
    this.fxLayer.addChild(c);
    const tl = gsap.timeline({ onComplete: () => c.destroy({ children: true }) });
    tl.timeScale(Math.max(1, this.speed));
    tl.to(c.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' }).to(c, { alpha: 0, duration: 0.2 }, dur);
  }

  /** attacker anticipation + power name (+ the ULTI cut-in) */
  private async animUse(side: 0 | 1, p: PowerDef) {
    const bc = this.cats[side];
    const sp = bc.sprite;
    this.arena?.focus(side);
    // power name label over the attacker
    const head = this.pos(side, 'head');
    const nm = txt(p.name, { fontFamily: F.poster, fontSize: 40, fill: C.paper, stroke: { color: C.ink, width: 8, join: 'round' }, letterSpacing: 1 });
    nm.anchor.set(0.5);
    nm.position.set(Math.max(nm.width / 2 + 20, Math.min(W - nm.width / 2 - 20, head.x)), head.y - 40);
    nm.rotation = side === 0 ? -0.05 : 0.05;
    nm.scale.set(0.4);
    this.fxLayer.addChild(nm);
    const tl = gsap.timeline({ onComplete: () => nm.destroy() });
    tl.timeScale(this.speed);
    tl.to(nm.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' }).to(nm, { y: nm.y - 30, duration: 0.8 }, 0).to(nm, { alpha: 0, duration: 0.2 }, 0.8);
    if (p.ult) {
      sfx('charge');
      sp.crouch = 1;
      sp.emote('attack', 1.5);
      await this.fx.cutIn({ slug: this.duel!.f[side].slug, species: this.duel!.f[side].species, side, el: p.element, name: p.name, cry: p.cry });
      this.arena?.flash(0xffffff, 0.6, 0.35);
      this.shaker.add(0.4);
      sp.crouch = 0;
      return;
    }
    // anticipation: crouch → spring + lean in
    sp.crouch = 0.8;
    sp.emote('attack', 1);
    await this.wait(0.18);
    sp.crouch = -0.25;
    sp.lean = 0.6;
    sfx(p.kind === 'heal' || p.kind === 'shield' ? 'charge' : 'whoosh', p.kind === 'heal' ? 1.6 : 1);
    await this.wait(0.08);
    window.setTimeout(() => {
      if (sp.destroyed) return;
      sp.lean = 0;
      sp.crouch = 0;
    }, 420 / this.speed);
  }

  /** projectile for the current power, then the impact on the target */
  private async animHit(e: Extract<DuelEv, { t: 'hit' }>) {
    const att = e.from;
    const tgt = e.side;
    const p = this.cur?.p;
    const from = this.pos(att, 'mouth');
    const to = this.pos(tgt, 'body');
    const el = e.element;
    const lunge = async (dist: number) => {
      const bc = this.cats[att];
      const dir = att === 0 ? 1 : -1;
      const tl = gsap.timeline();
      tl.timeScale(this.speed);
      tl.to(bc, { x: SPOT[att].x + dir * dist, duration: 0.14, ease: 'power3.in' }).to(bc, { x: SPOT[att].x, duration: 0.3, ease: 'power2.out' }, 0.3);
      await this.wait(0.14);
    };
    switch (e.kind) {
      case 'beam':
        sfx('zap');
        await this.fx.beam(from, to, el);
        break;
      case 'orb':
      case 'dot':
        sfx('shoot');
        await this.fx.orb(from, to, el);
        break;
      case 'multi':
        sfx('shoot', 1.2 + e.hit * 0.1);
        await this.fx.orb(from, to, el, 22);
        break;
      case 'slash':
      case 'strike':
        await lunge(430);
        sfx('hit');
        await this.fx.slash(to, el, e.kind === 'slash' ? 3 : 1);
        break;
      case 'crush':
        sfx('whoosh', 0.7);
        await this.fx.crush(to, el);
        break;
      case 'snipe':
        sfx('tick');
        await this.fx.snipe(from, to, el);
        break;
      case 'stun':
        sfx('glitch');
        await this.fx.spiral(to, el);
        break;
      case 'summon': {
        const sp = this.spirits[att];
        if (sp && !sp.destroyed) await this.fx.spiritStrike(sp, to);
        else await this.fx.orb(from, to, el);
        break;
      }
      case 'ult':
        sfx('bigboom');
        await this.fx.beam(from, to, el, 130);
        void this.fx.slash(to, el, 3);
        this.fx.word({ x: to.x, y: to.y - 160 }, el, 150);
        break;
      default:
        await this.fx.orb(from, to, el);
    }
    if (e.dodged) {
      // the target sidesteps: no impact, a taunt instead
      const bc = this.cats[tgt];
      const away = tgt === 0 ? -1 : 1;
      const dt = gsap.timeline();
      dt.timeScale(this.speed);
      dt.to(bc, { x: SPOT[tgt].x + away * 110, y: SPOT[tgt].y - 30, duration: 0.1, ease: 'power2.out' }).to(bc, { x: SPOT[tgt].x, y: SPOT[tgt].y, duration: 0.3, ease: 'back.out(2)' }, 0.25);
      bc.sprite.emote('happy', 0.8);
      this.fx.number(this.pos(tgt, 'head'), '¡ESQUIVÓ!', { color: C.mint, size: 56, rot: 0 });
      sfx('whoosh', 1.4);
      await this.wait(e.of > 1 ? 0.12 : 0.35);
      return;
    }
    // ---- impact
    const crit = e.crit;
    const sup = e.eff === 'super';
    const big = crit || sup || e.kind === 'ult';
    this.fx.impact(to, el, { crit: big });
    if (e.kind !== 'ult' && (big || Math.random() < 0.4)) this.fx.word({ x: to.x + (Math.random() - 0.5) * 120, y: to.y - 140 }, el, big ? 110 : 80);
    sfx(crit ? 'crit' : big ? 'boom' : 'hit', 0.9 + Math.random() * 0.2);
    time.hitstop((e.kind === 'ult' ? 140 : big ? 90 : 45) / Math.max(1, this.speed * 0.75));
    this.shaker.add(e.kind === 'ult' ? 0.7 : big ? 0.42 : 0.2);
    this.arena?.cheerUp(big ? 1 : 0.35);
    if (sup) this.arena?.flash(0xffffff, 0.25, 0.2);
    // ---- the target flinches
    const bc = this.cats[tgt];
    bc.sprite.emote('hurt', big ? 1.4 : 0.9);
    const base = (bc as unknown as { baseTint: number }).baseTint ?? 0xffffff;
    bc.sprite.tint = 0xff7070;
    gsap.delayedCall(0.09, () => !bc.destroyed && (bc.sprite.tint = base));
    const away = tgt === 0 ? -1 : 1;
    const kt = gsap.timeline();
    kt.timeScale(this.speed);
    kt.to(bc, { x: SPOT[tgt].x + away * (big ? 60 : 30), duration: 0.07, ease: 'power2.out' }).to(bc, { x: SPOT[tgt].x, duration: 0.35, ease: 'elastic.out(1, 0.4)' });
    // ---- numbers + callouts
    const head = this.pos(tgt, 'head');
    if (e.absorbed > 0) this.fx.number({ x: head.x - away * 90, y: head.y + 40 }, `ESCUDO -${show(e.absorbed)}`, { color: C.cyan, size: 36, rot: 0 });
    if (e.dmg > 0 || e.absorbed <= 0) this.fx.number({ x: head.x + away * 30, y: head.y + 10 }, `${crit ? '¡' : ''}${show(e.dmg)}${crit ? '!' : ''}`, { color: crit ? C.pinkHot : sup ? C.yellow : e.eff === 'weak' ? C.paperDark : C.paper, size: crit ? 96 : sup ? 80 : 64 });
    if (crit && e.hit === 0) this.fx.banner('¡CRÍTICO!', C.pinkHot, H * 0.3, 60, 0.5);
    if (sup && e.hit === 0) {
      this.fx.banner('¡SÚPER EFECTIVO!', C.yellow, H * 0.38, this.superShown++ < 2 ? 84 : 58, 0.7);
    } else if (e.eff === 'weak' && e.hit === 0) this.fx.banner('NO MUY EFECTIVO…', C.paperDark, H * 0.38, 52, 0.6);
    // shield broke?
    const sh = this.shields[tgt];
    const f = this.duel!.f[tgt];
    if (sh && f.shield <= 0) {
      this.fx.shatter(sh);
      this.shields[tgt] = null;
      sfx('crit', 1.4);
    }
    this.bars[tgt].sync();
    this.bars[tgt].hitFlash();
    await this.wait(e.of > 1 ? 0.12 : 0.32);
  }

  private clearStun(side: 0 | 1) {
    const s = this.stuns[side];
    if (s && !s.destroyed) s.destroy({ children: true });
    this.stuns[side] = null;
  }

  /** remove effects whose status is gone (summons, stun stars) */
  private syncStatusFx() {
    const d = this.duel;
    if (!d) return;
    for (const side of [0, 1] as const) {
      const f = d.f[side];
      if (!f.summon && this.spirits[side]) {
        const sp = this.spirits[side]!;
        this.spirits[side] = null;
        killDeep(sp);
        gsap.to(sp, { alpha: 0, duration: 0.3, onComplete: () => sp.destroy({ children: true }) });
      }
      if (!d.hasStatus(f, 'stun')) this.clearStun(side);
      this.bars[side].sync();
    }
  }

  private async faint(side: 0 | 1) {
    const bc = this.cats[side];
    const sp = bc.sprite;
    sp.emote('hurt', 1.6);
    sfx('bigboom', 0.7);
    time.slowmo(0.3, 650);
    this.shaker.add(0.9);
    this.arena?.flash(0xffffff, 0.7, 0.4);
    this.arena?.cheerUp(2);
    this.fx.banner(pick(KO_WORDS), C.red, H * 0.42, 170, 1.3);
    const dir = side === 0 ? -1 : 1;
    const tl = gsap.timeline();
    tl.to(bc, { rotation: dir * 0.5, y: SPOT[side].y + 40, duration: 0.5, ease: 'bounce.out' }).to(bc, { alpha: 0.75, duration: 0.3 }, 0.2);
    window.setTimeout(() => {
      if (sp.destroyed) return;
      sp.sleeping = true;
      this.fx.dust(this.pos(side, 'feet'));
    }, 350);
    this.clearStun(side);
    const winner = this.cats[1 - side];
    window.setTimeout(() => {
      if (winner.destroyed) return;
      winner.sprite.emote('happy', 1.6);
      gsap.timeline().to(winner, { y: SPOT[1 - side].y - 70, duration: 0.2, ease: 'power2.out' }).to(winner, { y: SPOT[1 - side].y, duration: 0.3, ease: 'bounce.out' });
    }, 700);
    await new Promise((r) => window.setTimeout(r, 1500));
  }

  private forfeit() {
    if (!this.duel || this.duel.over) return;
    const now = performance.now();
    if (now - this.forfeitArmed > 2500) {
      this.forfeitArmed = now;
      this.forfeitBtn?.setText('¿SEGURO?');
      window.setTimeout(() => this.forfeitBtn && !this.forfeitBtn.destroyed && this.forfeitBtn.setText('RENDIRSE'), 2500);
      sfx('error');
      return;
    }
    const run = ++this.runId;
    this.duel.over = true;
    this.duel.winner = 1;
    this.pending = null;
    void (async () => {
      await this.faint(0);
      await this.finish(run, false, true);
    })();
  }

  private async finish(run: number, won: boolean, _forfeit = false) {
    if (run !== this.runId || this.destroyed) return;
    const cat = this.cat!;
    const r = this.rival!;
    const f0 = this.duel!.f[0];
    const perfect = won && f0.hp / f0.hpMax >= 0.75;
    this.hideHint();
    if (perfect) {
      this.fx.banner('¡IMPECABLE!', C.yellow, H * 0.3, 80, 0.9);
      await this.wait(0.6);
    }
    const loot = applyDuel(cat, r.league, r.bout, won, perfect);
    this.duel = null;
    if (run !== this.runId || this.destroyed) return;
    this.results = new PodioResults(loot, cat, `${r.trainer} (${r.def.name})`, {
      onNext: () => {
        const p = ps();
        if (won) void this.startDuel(cat.uid, p.league, p.bout);
        else void this.startDuel(cat.uid, r.league, r.bout);
      },
      onLobby: () => this.showLobby(),
      onIsland: () => void goIsland(),
    });
    this.top.addChild(this.results);
  }
}

function killDeep(c: Container) {
  gsap.killTweensOf(c);
  gsap.killTweensOf(c.scale);
  for (const ch of c.children) killDeep(ch as Container);
}

void catDef;
