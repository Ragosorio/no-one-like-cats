/**
 * One habitat on the island (free placement): its 3×3 yard wherever Habitat.gx/gy says, under
 * construction (scaffold + clock) or living (tier yard + house + coin/fish piles). The view follows
 * the habitat when it moves and is destroyed by the scene when the habitat is sold.
 * (Class name kept from the fixed-plot days so the scene diff stays small.)
 */
import { Container, Graphics } from 'pixi.js';
import { G, Habitat } from '../../state/game';
import { habitatTier } from '../../state/econ';
import { habitatFill, habitatFull } from '../../state/ext/island';
import { fishBuffer, fishCap, habitatFishRate } from '../../state/sys/island';
import { isoToScreen } from '../iso';
import { habitatParts, scaffoldArt, P } from '../buildingArt';
import type { Tick } from '../habitatTiers';
import { ClockBubble, YieldPile } from '../worldUi';
import { HAB_SIZE, habitatSpot } from '../placement';
import type { Spot } from '../layout';
import type { Area } from '../catActor';
import type { IslandCtx } from './ctx';

export class PlotView {
  ground = new Container();
  back = new Container();
  front = new Container();
  bubble = new Container();
  coins = new YieldPile();
  clock = new ClockBubble(26);
  private sig = '';
  private posSig = '';
  private hit: Graphics;
  private fxTick: Tick | null = null;
  private t = Math.random() * 10;
  roof = { x: 0, y: -120 };
  /** visible = its region is open (not held back by a reveal) */
  active = false;
  dead = false;
  constructor(
    public habitat: Habitat,
    private ctx: IslandCtx,
    onTap: (v: PlotView) => void,
  ) {
    ctx.ground.addChild(this.ground);
    ctx.objects.addChild(this.back, this.front, this.coins);
    ctx.bubbles.addChild(this.bubble);
    this.bubble.addChild(this.clock);
    // hit area: the whole footprint diamond + house volume
    const a = P(-0.5, -0.5);
    const b = P(HAB_SIZE - 0.5, -0.5);
    const c = P(HAB_SIZE - 0.5, HAB_SIZE - 0.5);
    const d = P(-0.5, HAB_SIZE - 0.5);
    this.hit = new Graphics().poly([a.x, a.y - 120, b.x, b.y, c.x, c.y, d.x, d.y]).fill({ color: 0xffffff, alpha: 0.001 });
    this.back.addChildAt(this.hit, 0);
    for (const t of [this.back, this.coins]) {
      t.eventMode = 'static';
      t.cursor = 'pointer';
      t.on('pointertap', () => {
        if (ctx.tapOk()) onTap(this);
      });
    }
    this.place();
  }

  get id() {
    return this.habitat.id;
  }
  get region() {
    return this.habitat.region;
  }
  get spot(): Spot {
    return Number.isFinite(this.habitat.gx) ? habitatSpot(this.habitat) : { gx: 22, gy: 22, w: HAB_SIZE, h: HAB_SIZE };
  }

  /** put every layer where the habitat stands (called again when it moves) */
  private place() {
    const s = this.spot;
    this.posSig = `${s.gx},${s.gy}`;
    const p = isoToScreen(s.gx, s.gy);
    for (const c of [this.ground, this.back, this.front, this.bubble]) c.position.set(p.x, p.y);
    this.back.zIndex = s.gx + s.gy + 0.5;
    this.front.zIndex = s.gx + s.gy + s.w + s.h - 1;
    // coin + fish piles on the doorstep (in front of the gate: drawn over the yard, easy to tap)
    const gate = P(1.05, s.h - 0.15);
    this.coins.position.set(p.x + gate.x, p.y + gate.y);
    this.coins.zIndex = s.gx + s.gy + s.w + s.h - 0.6;
  }

  /** world-space center of the plot's bubble anchor (for fly-from) */
  bubbleGlobal() {
    return this.coins.getGlobalPosition();
  }
  catArea(): Area {
    const s = this.spot;
    return { x0: s.gx - 0.15, y0: s.gy - 0.15, w: s.w - 0.75, h: s.h - 0.75, avoid: { x0: s.gx - 1, y0: s.gy - 1, x1: s.gx + 0.75, y1: s.gy + 0.75 } };
  }

  /** returns true when the habitat moved (the scene re-targets its cats) */
  sync(active: boolean, h: Habitat): boolean {
    this.habitat = h;
    this.active = active;
    for (const c of [this.ground, this.back, this.front, this.bubble]) c.visible = active;
    if (!active) this.coins.visible = false;
    const s = this.spot;
    let moved = false;
    if (`${s.gx},${s.gy}` !== this.posSig) {
      this.place();
      moved = true;
    }
    if (!active) return moved;
    const sig = `h|${h.element}|${h.tier}|${h.busy ? 1 : 0}|${h.busy && G.timerFor('build', h.id) ? 'b' : ''}`;
    if (sig !== this.sig) {
      this.sig = sig;
      this.rebuild(h);
    }
    return moved;
  }

  private clearArt() {
    for (const c of [this.ground, this.front]) c.removeChildren().forEach((x) => x.destroy({ children: true }));
    this.back.removeChildren().forEach((x) => x !== this.hit && x.destroy({ children: true }));
    if (!this.hit.parent) this.back.addChildAt(this.hit, 0);
    this.fxTick = null;
  }

  private rebuild(h: Habitat) {
    this.clearArt();
    const s = this.spot;
    const building = h.busy && !!G.timerFor('build', h.id);
    const parts = habitatParts(h.element, building ? 1 : h.tier, s.w, s.h, building);
    this.ground.addChild(parts.ground);
    this.back.addChild(parts.back);
    this.front.addChild(parts.front);
    this.roof = parts.roof;
    this.fxTick = parts.tick ?? null;
    if (h.busy) {
      const sc = scaffoldArt(1.6, 1.6);
      const hp = P(0.0, 0.0);
      sc.position.set(hp.x, hp.y);
      this.back.addChild(sc);
      if (building) parts.back.children.forEach((c, i) => i > 0 && (c.alpha = 0.25));
    }
  }

  update(dt: number) {
    if (!this.active) return;
    this.t += dt;
    const h = this.habitat;
    const r = this.roof;
    if (this.fxTick) this.fxTick(this.t);
    const t = h.busy ? (G.timerFor('build', h.id) ?? G.timerFor('habitat_upgrade', h.id)) : null;
    this.clock.visible = !!t;
    if (t) {
      this.clock.position.set(r.x, r.y - 30);
      this.clock.set(t.leftMs, t.totalMs);
    }
    const fish = fishBuffer(h);
    const showCoins = !t && h.cats.length > 0 && (h.buffer >= 1 || fish >= 1);
    this.coins.visible = showCoins;
    if (showCoins) {
      const fc = fishCap(h);
      this.coins.set(h.buffer, habitatFill(h), habitatFull(h), fish, fc > 0 ? fish / fc : 0, fc > 0 && habitatFishRate(h) > 0 && fish >= fc - 0.01);
      this.coins.tick(dt);
    }
  }

  /** placement "move" mode: fade the real one while its ghost follows the finger */
  setGhosted(on: boolean) {
    for (const c of [this.ground, this.back, this.front, this.coins]) c.alpha = on ? 0.25 : 1;
  }

  refreshPrice() {
    // fixed-plot price signs are gone (habitats are bought from the Shop / build menu)
  }

  tierName() {
    return habitatTier(this.habitat.tier).name;
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    for (const c of [this.ground, this.back, this.front, this.bubble, this.coins]) if (!c.destroyed) c.destroy({ children: true });
  }
}
