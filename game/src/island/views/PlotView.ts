/** A 3×3 habitat plot: empty (build sign), under construction (scaffold + clock) or a living habitat. */
import { Container, Graphics } from 'pixi.js';
import { G, Habitat } from '../../state/game';
import { habitatTier } from '../../state/econ';
import { ctaVisible, habitatFill, habitatFull } from '../../state/ext/island';
import { fishBuffer, fishCap, habitatFishRate, nextHabitatCost } from '../../state/sys/island';
import { isoToScreen } from '../iso';
import { habitatParts, emptyPlotArt, scaffoldArt, plate, P, centerOf } from '../buildingArt';
import { ClockBubble, YieldPile } from '../worldUi';
import type { Spot } from '../layout';
import type { Area } from '../catActor';
import type { IslandCtx } from './ctx';
import { C } from '../../ui/theme';
import { fmt } from '../../core/format';
import { icon } from '../../ui/icons';

export class PlotView {
  ground = new Container();
  back = new Container();
  front = new Container();
  bubble = new Container();
  coins = new YieldPile();
  clock = new ClockBubble(26);
  private priceTag: Container | null = null;
  private sig = '';
  private hit: Graphics;
  roof = { x: 0, y: -120 };
  habitat: Habitat | null = null;
  /** visible = region unlocked & plot exists */
  active = false;
  private onTap: (v: PlotView) => void;
  constructor(
    public region: string,
    public plot: number,
    public spot: Spot,
    private ctx: IslandCtx,
    onTap: (v: PlotView) => void,
  ) {
    this.onTap = onTap;
    const p = isoToScreen(spot.gx, spot.gy);
    for (const c of [this.ground, this.back, this.front, this.bubble]) c.position.set(p.x, p.y);
    this.back.zIndex = spot.gx + spot.gy + 0.5;
    this.front.zIndex = spot.gx + spot.gy + spot.w + spot.h - 1;
    ctx.ground.addChild(this.ground);
    ctx.objects.addChild(this.back, this.front);
    ctx.bubbles.addChild(this.bubble);
    this.bubble.addChild(this.clock);
    // coin + fish piles on the doorstep (in front of the gate: drawn over the yard, easy to tap)
    const gate = P(1.05, spot.h - 0.15);
    this.coins.position.set(p.x + gate.x, p.y + gate.y);
    this.coins.zIndex = spot.gx + spot.gy + spot.w + spot.h - 0.6;
    ctx.objects.addChild(this.coins);
    // hit area: the whole footprint diamond + house volume
    const a = P(-0.5, -0.5);
    const b = P(spot.w - 0.5, -0.5);
    const c = P(spot.w - 0.5, spot.h - 0.5);
    const d = P(-0.5, spot.h - 0.5);
    this.hit = new Graphics().poly([a.x, a.y - 120, b.x, b.y, c.x, c.y, d.x, d.y]).fill({ color: 0xffffff, alpha: 0.001 });
    this.back.addChildAt(this.hit, 0);
    for (const t of [this.back, this.coins]) {
      t.eventMode = 'static';
      t.cursor = 'pointer';
      t.on('pointertap', () => {
        if (ctx.tapOk()) onTap(this);
      });
    }
  }

  /** world-space center of the plot's bubble anchor (for fly-from) */
  bubbleGlobal() {
    return this.coins.getGlobalPosition();
  }
  catArea(): Area {
    const s = this.spot;
    return { x0: s.gx - 0.15, y0: s.gy - 0.15, w: s.w - 0.75, h: s.h - 0.75, avoid: { x0: s.gx - 1, y0: s.gy - 1, x1: s.gx + 0.75, y1: s.gy + 0.75 } };
  }

  sync(active: boolean, h: Habitat | null) {
    this.active = active;
    this.habitat = h;
    const vis = active;
    for (const c of [this.ground, this.back, this.front, this.bubble]) c.visible = vis;
    if (!vis) this.coins.visible = false;
    if (!vis) return;
    const sig = h ? `h|${h.element}|${h.tier}|${h.busy ? 1 : 0}|${h.busy && G.timerFor('build', h.id) ? 'b' : ''}` : `empty`;
    if (sig !== this.sig) {
      this.sig = sig;
      this.rebuild(h);
    }
  }

  private clearArt() {
    for (const c of [this.ground, this.front]) c.removeChildren().forEach((x) => x.destroy({ children: true }));
    this.back.removeChildren().forEach((x) => x !== this.hit && x.destroy({ children: true }));
    if (!this.hit.parent) this.back.addChildAt(this.hit, 0);
    this.priceTag?.destroy({ children: true });
    this.priceTag = null;
  }

  private rebuild(h: Habitat | null) {
    this.clearArt();
    const s = this.spot;
    if (!h) {
      const e = emptyPlotArt(s.w, s.h);
      this.ground.addChild(e.ground);
      const ctr = centerOf(s.w, s.h);
      e.sign.position.set(ctr.x, ctr.y + 10);
      this.back.addChild(e.sign);
      this.roof = { x: ctr.x, y: ctr.y - 90 };
      this.priceTag = new Container();
      this.bubble.addChild(this.priceTag);
      return;
    }
    const building = h.busy && !!G.timerFor('build', h.id);
    const parts = habitatParts(h.element, building ? 1 : h.tier, s.w, s.h, building);
    this.ground.addChild(parts.ground);
    this.back.addChild(parts.back);
    this.front.addChild(parts.front);
    this.roof = parts.roof;
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
    const h = this.habitat;
    const r = this.roof;
    if (!h) {
      // price sign for an empty plot
      if (this.priceTag) this.priceTag.visible = ctaVisible('build');
      if (this.priceTag && this.priceTag.visible && this.priceTag.children.length === 0) this.drawPrice();
      this.coins.visible = false;
      this.clock.visible = false;
      return;
    }
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

  private priceSig = '';
  private drawPrice() {
    const cost = nextHabitatCost();
    const sig = `${cost}|${G.s.gold >= cost}`;
    if (sig === this.priceSig && this.priceTag!.children.length) return;
    this.priceSig = sig;
    const tag = this.priceTag!;
    tag.removeChildren().forEach((c) => c.destroy({ children: true }));
    const pl = plate(`CONSTRUIR`, C.yellow, 24);
    const row = new Container();
    const ic = icon('gold', 26);
    ic.position.set(13, 0);
    const pt = plate(fmt(cost), G.s.gold >= cost ? C.paper : C.paperDark, 20);
    pt.position.set(26 + pt.width / 2, 0);
    row.addChild(pt, ic);
    row.position.set(-row.width / 2, 34);
    tag.addChild(pl, row);
    tag.position.set(this.roof.x, this.roof.y - 44);
    // the sign itself is a button (it used to be decoration only)
    if (!tag.eventMode || tag.eventMode === 'passive') {
      tag.eventMode = 'static';
      tag.cursor = 'pointer';
      tag.hitArea = { contains: (x: number, y: number) => x > -110 && x < 110 && y > -30 && y < 60 };
      tag.on('pointertap', () => {
        if (this.ctx.tapOk()) this.onTap(this);
      });
    }
  }
  refreshPrice() {
    if (this.priceTag) {
      this.priceSig = '';
      this.priceTag.removeChildren().forEach((c) => c.destroy({ children: true }));
    }
  }

  tierName() {
    return this.habitat ? habitatTier(this.habitat.tier).name : '';
  }
}
