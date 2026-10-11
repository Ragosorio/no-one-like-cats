/**
 * The look of a SKY battle (Parte II · Oleada 2, rules in battle/cielo.ts): a cloud sea instead of water (the Sea
 * draws with SKY_PALETTE), far-off upside-down islands, the three wind bands as chalk streaks, the floating islets
 * (read from the sim: positions, cracks, the fall when they crumble) and the aerobarcos' balloons + propellers on
 * every ship that flies. Pure view: it reads skyState(sim) and never writes the sim. Animated on twos.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W } from '../../core/App';
import { C } from '../../ui/theme';
import type { Battle } from '../sim';
import { skyState } from '../cielo';

/** sky + "sea" colors for a battle above the clouds (BattleSpec.palette shape) */
export const SKY_PALETTE = { skyTop: 0x5e95f2, skyBottom: 0xd9e9ff, sea: 0xf6f8ff, seaDark: 0xd6def2 };

const INK = C.ink;
const CHALK = 0xe9f0ff;
const BRASS = 0xf0b44c;

interface IsletView {
  g: Graphics;
  id: number;
  y: number;
  alive: boolean;
}
interface ShipBox {
  x: number;
  y: number;
  w: number;
}

export class SkyBattleFx {
  /** behind the ships: far islands, wind streaks, islets, balloons */
  back = new Container();
  /** over the cloud sea, in front of the hulls: a few cloud puffs */
  front = new Container();
  private far = new Graphics();
  private wind = new Graphics();
  private balloons = new Graphics();
  private puffs = new Graphics();
  private islets: IsletView[] = [];
  private t = 0;
  private acc = 0;
  private dead = false;

  constructor(
    private sim: Battle,
    /** live position of each ship view (follows sinking / shaking) */
    private shipBox: (side: number) => ShipBox,
  ) {
    this.back.addChild(this.far, this.wind, this.balloons);
    this.front.addChild(this.puffs);
    this.drawFar();
    const st = skyState(sim);
    for (const i of st?.islets ?? []) {
      const g = new Graphics();
      drawIslet(g, i.r, i.id, 1);
      g.position.set(i.x, i.y);
      this.back.addChild(g);
      this.islets.push({ g, id: i.id, y: i.y, alive: i.alive });
    }
    Ticker.shared.add(this.tick, this);
    this.back.once('destroyed', () => this.dispose());
    this.draw();
  }

  private dispose() {
    if (this.dead) return;
    this.dead = true;
    Ticker.shared.remove(this.tick, this);
    for (const i of this.islets) gsap.killTweensOf(i.g);
  }

  /** follow the sim (islet hp / drift / crumble) — BattleScene.syncLate */
  sync() {
    if (this.dead) return;
    const st = skyState(this.sim);
    if (!st) return;
    for (const v of this.islets) {
      const s = st.islets.find((k) => k.id === v.id);
      if (!s) continue;
      if (v.alive && !s.alive) {
        v.alive = false;
        // it crumbles into the void
        gsap.to(v.g, { y: v.g.y + 520, rotation: 0.6, alpha: 0, duration: 1.4, ease: 'power2.in' });
        continue;
      }
      if (!s.alive) continue;
      drawIslet(v.g, s.r, s.id, Math.max(0, s.hp / s.maxHp));
      if (Math.abs(s.y - v.y) > 0.5) {
        v.y = s.y;
        gsap.to(v.g, { y: s.y, duration: 0.9, ease: 'sine.inOut' });
      }
    }
  }

  private tick(t: Ticker) {
    if (this.dead) return;
    this.acc += t.deltaMS / 1000;
    if (this.acc < 1 / 12) return;
    this.t += this.acc;
    this.acc = 0;
    this.draw();
  }

  private draw() {
    const sim = this.sim;
    const st = skyState(sim);
    if (!st) return;
    const wy = sim.waterY;
    // ---- wind bands: chalk streaks drifting with the turn's wind × each band's multiplier
    const w = this.wind.clear();
    const bands: [number, number, number][] = [
      [wy - 760, st.bands.yHi, st.layers[0]],
      [st.bands.yHi, st.bands.yLo, st.layers[1]],
      [st.bands.yLo, wy - 20, st.layers[2]],
    ];
    bands.forEach(([y0, y1, mul], bi) => {
      const v = sim.wind * mul;
      const speed = v * 2.2;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const seed = bi * 31 + i * 7;
        const yy = y0 + ((seed * 53) % 97) / 97 * (y1 - y0);
        const len = 40 + Math.min(120, Math.abs(v) * 1.6);
        let x = (((seed * 211) % W) + this.t * speed) % (W + 300);
        if (x < -150) x += W + 300;
        const a = Math.min(0.55, 0.12 + Math.abs(v) / 160);
        w.moveTo(x - 150, yy).lineTo(x - 150 + Math.sign(v || 1) * len, yy).stroke({ width: 3, color: CHALK, alpha: a, cap: 'round' });
      }
      // band edge: a dotted chalk line (the layers are readable)
      if (bi > 0) for (let x = 0; x < W; x += 28) w.moveTo(x, y0).lineTo(x + 10, y0).stroke({ width: 2, color: CHALK, alpha: 0.25 });
    });
    // ---- balloons + propellers on every ship that flies
    const b = this.balloons.clear();
    for (let side = 0; side < 2; side++) {
      if ((st.kit[side] ?? 0) <= 0) continue;
      const box = this.shipBox(side);
      const cx = box.x + box.w / 2;
      const top = box.y - 40;
      const rx = Math.min(240, box.w * 0.42);
      const ry = 58;
      const ey = top - 120 + Math.sin(this.t * 1.6 + side) * 5;
      const body = side === 0 ? 0xe9dcc0 : 0xf6f6f2;
      const trim = side === 0 ? BRASS : 0xd9d2bf;
      for (const k of [-0.7, -0.25, 0.25, 0.7]) b.moveTo(cx + rx * k, ey + ry * 0.72).lineTo(cx + box.w * 0.4 * k, top + 40).stroke({ width: 2, color: INK, alpha: 0.8 });
      b.ellipse(cx + 6, ey + 6, rx, ry).fill({ color: INK, alpha: 0.85 });
      b.ellipse(cx, ey, rx, ry).fill(body).stroke({ width: 4, color: INK });
      for (const k of [-0.55, 0, 0.55]) b.moveTo(cx + rx * k, ey - ry * Math.sqrt(1 - k * k)).quadraticCurveTo(cx + rx * k * 1.25, ey, cx + rx * k, ey + ry * Math.sqrt(1 - k * k)).stroke({ width: 3, color: trim });
      // patches on yours (it's your old ship, after all)
      if (side === 0) b.rect(cx - rx * 0.35, ey - 8, 26, 20).fill(0xd7c49a).stroke({ width: 2, color: INK });
      // propellers at both ends of the hull
      for (const sgn of [-1, 1]) {
        const px = sgn < 0 ? box.x - 18 : box.x + box.w + 18;
        const py = top + 70;
        b.moveTo(sgn < 0 ? box.x : box.x + box.w, py).lineTo(px, py).stroke({ width: 4, color: INK });
        const a = this.t * 14 * sgn;
        for (const d of [0, Math.PI]) b.ellipse(px + Math.cos(a + d) * 3, py + Math.sin(a + d) * 16, 5, 14).fill(trim).stroke({ width: 2, color: INK });
        b.circle(px, py, 5).fill(INK);
      }
    }
    // ---- cloud puffs over the cloud sea
    const p = this.puffs.clear();
    for (let i = 0; i < 9; i++) {
      const x = ((i * 241 + this.t * (12 + i * 2)) % (W + 400)) - 200;
      const y = wy + 18 + (i % 3) * 26;
      const r = 34 + (i % 4) * 10;
      p.circle(x, y, r).fill({ color: 0xffffff, alpha: 0.85 });
      p.circle(x + r * 0.9, y + 6, r * 0.75).fill({ color: 0xffffff, alpha: 0.85 });
      p.circle(x - r * 0.8, y + 8, r * 0.6).fill({ color: 0xf1f5ff, alpha: 0.85 });
    }
  }

  /** far-off upside-down islands hanging in the sky (static) */
  private drawFar() {
    const g = this.far;
    const wy = this.sim.waterY;
    const spots = [
      [180, wy - 640, 70],
      [760, wy - 720, 46],
      [1320, wy - 690, 58],
      [1780, wy - 610, 40],
    ];
    for (const [x, y, r] of spots) {
      // an island hanging upside down: grass under, roots and a waterfall going UP
      g.poly([x - r, y, x + r, y, x + r * 0.5, y - r * 0.9, x, y - r * 1.3, x - r * 0.55, y - r * 0.8]).fill({ color: 0x8fa3c9, alpha: 0.55 });
      g.rect(x - r, y, r * 2, 6).fill({ color: 0x9fc79a, alpha: 0.5 });
      g.moveTo(x + r * 0.2, y).lineTo(x + r * 0.2, y + r * 1.6).stroke({ width: 5, color: 0xffffff, alpha: 0.35 });
    }
  }
}

/** a floating islet: rock with grass on top, hanging roots, cracks as it loses life */
function drawIslet(g: Graphics, r: number, seed: number, life: number) {
  g.clear();
  const pts = [-r, -r * 0.15, -r * 0.6, -r * 0.45, 0, -r * 0.5, r * 0.65, -r * 0.4, r, -r * 0.1, r * 0.55, r * 0.55, 0, r * 0.95, -r * 0.5, r * 0.6];
  g.poly(pts.map((v, i) => v + (i % 2 ? 6 : 6))).fill({ color: INK, alpha: 0.6 });
  g.poly(pts).fill(0x9a8a72).stroke({ width: 4, color: INK });
  g.poly([-r, -r * 0.15, -r * 0.6, -r * 0.45, 0, -r * 0.5, r * 0.65, -r * 0.4, r, -r * 0.1, r * 0.6, -r * 0.05, -r * 0.6, -r * 0.02]).fill(0x7ed957).stroke({ width: 3, color: INK });
  // roots
  for (let i = 0; i < 3; i++) {
    const x = -r * 0.3 + i * r * 0.3;
    g.moveTo(x, r * 0.6).quadraticCurveTo(x + 6, r * 0.9, x - 2 + ((seed + i) % 3) * 3, r * 1.25).stroke({ width: 2.5, color: 0x5a4a3a });
  }
  // cracks: more of them as it loses life
  const n = life > 0.7 ? 0 : life > 0.4 ? 2 : 4;
  for (let i = 0; i < n; i++) {
    const a = (i * 1.7 + seed) % 6.28;
    g.moveTo(Math.cos(a) * r * 0.1, Math.sin(a) * r * 0.1 + r * 0.2).lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.45 + r * 0.25).stroke({ width: 3, color: INK });
  }
}
