import { Assets, Container, Graphics, Sprite, FederatedPointerEvent } from 'pixi.js';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { Sea } from '../battle/sea';
import { ShipModel, CELL } from '../battle/ship';
import { ShipView } from '../battle/shipView';
import { BLUEPRINTS } from '../battle/blueprints';
import { trace } from '../battle/ballistics';
import { Particles } from '../fx/particles';
import { Shaker, flash, onomatopoeia, floatText, time } from '../fx/juice';
import { sfx } from '../core/audio';
import { C } from '../ui/theme';
import { glowTexture } from '../art/textures';
import { loadCatTexture } from '../art/catArt';

const WATER_Y = 760;

/** Temporary playground to validate ship destruction feel. */
export class BattleSandbox extends Scene {
  world = new Container();
  sea = new Sea(WATER_Y);
  shipsLayer = new Container();
  debris = new Container();
  fx = new Particles();
  overlay = new Container();
  aimG = new Graphics();
  shaker = new Shaker(this.world);
  player!: ShipView;
  enemy!: ShipView;
  dragging = false;
  dragStart = { x: 0, y: 0 };
  aim = { angle: -0.6, power: 900 };
  shotLive = false;
  wind = 0;

  override enter() {
    this.addChild(this.world, this.overlay);
    this.world.addChild(this.sea, this.shipsLayer, this.debris, this.sea.frontLayer(), this.fx, this.aimG);
    const pm = new ShipModel(BLUEPRINTS.sparrow);
    const em = new ShipModel(BLUEPRINTS.sparrow);
    pm.snapshotMax();
    em.snapshotMax();
    this.player = new ShipView(pm, false);
    this.enemy = new ShipView(em, true);
    this.player.position.set(120, WATER_Y - pm.rows * CELL + 40);
    this.enemy.position.set(W - 120 - em.cols * CELL, WATER_Y - em.rows * CELL + 40);
    this.player.baseY = this.player.y;
    this.enemy.baseY = this.enemy.y;
    this.shipsLayer.addChild(this.player, this.enemy);
    this.placeCats(this.player, ['canelo_cozy_cat', 'jelly_aquatic_cat', 'molten_ember_cat']);
    this.placeCats(this.enemy, ['neon_glitch_cat', 'regal_cosmic_cat', 'stormcloud_elemental_cat']);

    this.eventMode = 'static';
    this.hitArea = { contains: () => true };
    this.on('pointerdown', this.down, this);
    this.on('pointermove', this.move, this);
    this.on('pointerup', this.up, this);
    this.on('pointerupoutside', this.up, this);
  }

  async placeCats(ship: ShipView, slugs: string[]) {
    for (const m of ship.model.modules) {
      if (m.kind !== 'catroom' || m.slot === undefined) continue;
      const slug = slugs[m.slot];
      if (!slug) continue;
      const tex = await loadCatTexture(slug);
      const s = new Sprite(tex);
      s.anchor.set(0.5, 1);
      const size = CELL * 2.6;
      s.scale.set(size / tex.width);
      if (ship.flip) s.scale.x *= -1;
      const p = ship.cellPos(ship.flip ? m.x + m.w - 1 : m.x, m.y);
      s.position.set(p.x + CELL, p.y + CELL * 2 + 4);
      const glow = new Sprite(glowTexture());
      glow.anchor.set(0.5);
      glow.tint = C.yellow;
      glow.alpha = 0.35;
      glow.scale.set(1.2);
      glow.position.set(s.x, s.y - size * 0.4);
      ship.decor.addChild(glow, s);
    }
  }

  muzzle() {
    const m = this.player.model.modules.find((k) => k.kind === 'cannon')!;
    const p = this.player.cellPos(m.x + m.w, m.y);
    return { x: this.player.x + p.x, y: this.player.y + p.y + CELL * 0.4 };
  }

  down(e: FederatedPointerEvent) {
    if (this.shotLive) return;
    this.dragging = true;
    const p = this.toLocal(e.global);
    this.dragStart = { x: p.x, y: p.y };
  }
  move(e: FederatedPointerEvent) {
    if (!this.dragging) return;
    const p = this.toLocal(e.global);
    const dx = this.dragStart.x - p.x;
    const dy = this.dragStart.y - p.y;
    const len = Math.min(320, Math.hypot(dx, dy));
    this.aim.angle = Math.atan2(dy, dx);
    this.aim.power = 400 + len * 3.2;
    this.drawAim();
  }
  up() {
    if (!this.dragging) return;
    this.dragging = false;
    this.aimG.clear();
    this.fire();
  }

  hitTest = (x: number, y: number) => {
    for (const ship of [this.enemy, this.player]) {
      const lp = ship.toLocal({ x, y }, this.world);
      if (lp.x < 0 || lp.y < 0) continue;
      const g = ship.toGrid(lp.x, lp.y);
      if (ship.model.get(g.x, g.y)) return true;
    }
    return false;
  };

  drawAim() {
    const m = this.muzzle();
    const res = trace({ x: m.x, y: m.y, angle: this.aim.angle, power: this.aim.power, wind: this.wind }, this.hitTest, WATER_Y + 40);
    this.aimG.clear();
    const n = Math.floor(res.path.length * 0.4);
    for (let i = 0; i < n; i += 4) {
      const p = res.path[i];
      this.aimG.circle(p.x, p.y, 5 - (i / n) * 3).fill({ color: C.paper, alpha: 1 - i / n });
    }
  }

  fire() {
    const m = this.muzzle();
    const res = trace({ x: m.x, y: m.y, angle: this.aim.angle, power: this.aim.power, wind: this.wind }, this.hitTest, WATER_Y + 40);
    this.shotLive = true;
    sfx('shoot');
    this.shaker.add(0.25);
    this.fx.burst(m.x, m.y, { count: 14, tint: [C.yellow, C.orange, C.paper], speed: [100, 400], angle: [this.aim.angle - 0.4, this.aim.angle + 0.4], gravity: 0, life: [0.2, 0.4] });
    const ball = new Graphics().circle(0, 0, 12).fill(C.orange).stroke({ width: 4, color: C.ink });
    this.world.addChild(ball);
    let i = 0;
    const step = () => {
      i += 2 * time.scale;
      const idx = Math.min(res.path.length - 1, Math.floor(i));
      const p = res.path[idx];
      ball.position.set(p.x, p.y);
      if (idx % 2 === 0) this.fx.burst(p.x, p.y, { count: 1, tint: [C.orange, C.yellow], speed: [0, 30], life: [0.2, 0.35], gravity: 0, scale: [0.4, 0.6] });
      if (idx >= res.path.length - 1) {
        this.ticker?.remove(step);
        ball.destroy();
        this.impact(p.x, p.y, res.end);
      }
    };
    this.ticker = { remove: () => clearInterval(iv) };
    const iv = window.setInterval(step, 1000 / 60);
  }
  ticker?: { remove: (f: () => void) => void };

  impact(x: number, y: number, end: string) {
    this.shotLive = false;
    if (end === 'water') {
      sfx('splash');
      this.fx.burst(x, WATER_Y, { count: 30, tint: [C.paper, C.megaBlue], angle: [-Math.PI * 0.9, -Math.PI * 0.1], speed: [200, 600] });
      onomatopoeia(this.overlay, x, WATER_Y - 80, 'SPLASH', { color: C.cyan, size: 70 });
      return;
    }
    sfx('boom');
    time.hitstop(70);
    this.shaker.add(0.6);
    flash(this.overlay, C.paper, 0.35, 0.15);
    onomatopoeia(this.overlay, x, y - 60, '¡BOOM!', { color: C.yellow });
    this.fx.burst(x, y, { count: 40, tint: [C.orange, C.yellow, C.red, C.ink], speed: [200, 900], life: [0.4, 1], scale: [0.4, 1.2], stepped: true });
    const R = 85;
    for (const ship of [this.enemy, this.player]) {
      let total = 0;
      for (const c of ship.model.cells()) {
        const p = ship.cellPos(c.x, c.y);
        const wx = ship.x + p.x + CELL / 2;
        const wy = ship.y + p.y + CELL / 2;
        const d = Math.hypot(wx - x, wy - y);
        if (d > R) continue;
        const dmg = Math.round(120 * Math.pow(1 - d / R, 0.6));
        c.hp -= dmg;
        total += dmg;
        if (c.hp <= 0) {
          ship.model.destroyCell(c.x, c.y);
          ship.knockOff(c, this.debris, { x, y });
        } else ship.refreshCell(c);
      }
      if (total > 0) floatText(this.overlay, x + 40, y - 120, `-${total}`, { color: C.paper, size: 40 });
      const chunks = ship.model.collapse();
      for (const ch of chunks) {
        ship.sinkChunk(ch, this.debris, (sx) => {
          sfx('splash');
          this.fx.burst(sx, WATER_Y, { count: 40, tint: [C.paper, C.megaBlue], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [300, 800] });
        });
      }
      if (chunks.length) {
        onomatopoeia(this.overlay, x, y - 200, 'CRACK!', { color: C.pinkHot, size: 90 });
        this.shaker.add(0.4);
      }
      ship.updateModuleDecor();
    }
  }

  override update(dt: number) {
    this.player?.bob(dt * time.scale);
    this.enemy?.bob(dt * time.scale);
  }
}

export { H };
