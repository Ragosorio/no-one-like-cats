/**
 * Parte III · La Borracha — what the battle SCREEN shows of MAREO (battle/mareo.ts holds the rules; this only draws).
 *
 *   · the swaying aim guide: the guide is drawn at aim + sway(phase now); the phase of the last drawn guide is what the
 *     shot is released with (MareoInput.sway), so the arc you saw is the arc that flies (minus the small drift)
 *   · the donuts on the enemy deck (they ride the ship's bob), eaten with a «¡ÑAM!» or dropped into the sea
 *   · the alley's bottles as green bottles in flight
 *
 * BattleScene hooks (a few lines): new MareoFx(sim, ships) when spec.rules.mareo · drawAim → aimAngle · playerFire →
 * input() · applyEvent → onEvent · syncLate → sync · makeProjectile → mareoProjectile · update → wantsRedraw.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { Battle, BattleEvent } from './sim';
import type { ShotDef } from './types';
import { BOTELLA, DONA_R, mareoDonas, mareoGuideAngle, mareoPhaseAt } from './mareo';
import type { MareoInput } from './mareo';
import { settings } from '../core/settings';

interface ShipLike extends Container {
  decor: Container;
}

const DONUT = 0xf59ac0;
const DOUGH = 0xd9a05b;

function donut(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(2, DONA_R * 0.55, DONA_R * 1.05, DONA_R * 0.35).fill({ color: 0x000000, alpha: 0.25 });
  g.circle(0, 0, DONA_R).fill(DOUGH).stroke({ width: 3, color: 0x2b1d12 });
  g.circle(0, -1, DONA_R - 3).fill(DONUT);
  g.circle(0, 0, DONA_R * 0.36).fill(0x2b1d12);
  g.circle(0, 0, DONA_R * 0.3).fill(DOUGH);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    const r = DONA_R * 0.66;
    g.moveTo(Math.cos(a) * r - 2.5, Math.sin(a) * r - 1).lineTo(Math.cos(a) * r + 2.5, Math.sin(a) * r + 1).stroke({ width: 2.5, color: [0xffffff, 0xe8a33d, 0x7fd8ff, 0x2e7d4f][i % 4], cap: 'round' });
  }
  g.ellipse(-DONA_R * 0.4, -DONA_R * 0.5, DONA_R * 0.3, DONA_R * 0.14).fill({ color: 0xffffff, alpha: 0.5 });
  c.addChild(g);
  return c;
}

export class MareoFx {
  private sprites = new Map<number, Container>();
  private t0 = performance.now();
  /** sway phase of the last drawn guide (what the release sends) */
  phase = 0;
  private lastDraw = 0;

  constructor(
    private sim: Battle,
    private ships: ShipLike[],
  ) {
    for (const d of mareoDonas(sim)) {
      const v = ships[d.side];
      if (!v) continue;
      const o = sim.sides[d.side].setup.origin;
      const s = donut();
      s.position.set(d.x - o.x, d.y - o.y);
      v.decor.addChild(s);
      this.sprites.set(d.id, s);
      if (!settings.reduceMotion) gsap.to(s, { y: s.y - 4, yoyo: true, repeat: -1, duration: 0.9 + d.id * 0.13, ease: 'sine.inOut' });
    }
  }

  /** the guide's angle now (advances the sway clock); `hold` = the last drawn phase (the release, the ghost) */
  aimAngle(angle: number, hold = false): number {
    if (!hold) this.phase = mareoPhaseAt(this.sim, 0, (performance.now() - this.t0) / 1000);
    return mareoGuideAngle(this.sim, angle, this.phase);
  }
  /** what the release adds to fire(): the phase the player saw */
  input(): MareoInput {
    return { sway: this.phase };
  }
  /** the guide moves on its own: redraw it ~30 times a second while aiming */
  wantsRedraw(): boolean {
    const now = performance.now();
    if (now - this.lastDraw < 33) return false;
    this.lastDraw = now;
    return true;
  }

  onEvent(e: BattleEvent) {
    if (e.k !== 'boss' || e.what !== 'dona') return;
    this.eat(e.n ?? -1);
  }

  private eat(id: number) {
    const s = this.sprites.get(id);
    if (!s || s.destroyed) return;
    this.sprites.delete(id);
    gsap.killTweensOf(s);
    if (settings.reduceMotion) return void s.destroy({ children: true });
    gsap.to(s.scale, { x: 1.5, y: 0.4, duration: 0.12, yoyo: true, repeat: 1 });
    gsap.to(s, { alpha: 0, duration: 0.35, delay: 0.2, onComplete: () => s.destroy({ children: true }) });
  }

  /** keep the donuts in step with the rules (a donut whose deck fell drops into the sea) */
  sync() {
    for (const d of mareoDonas(this.sim)) {
      if (d.state === 'on') continue;
      const s = this.sprites.get(d.id);
      if (!s || s.destroyed) continue;
      this.sprites.delete(d.id);
      gsap.killTweensOf(s);
      if (d.state === 'eaten' || settings.reduceMotion) {
        s.destroy({ children: true });
        continue;
      }
      gsap.to(s, { y: s.y + 420, rotation: 2.4, duration: 0.9, ease: 'power2.in', onComplete: () => s.destroy({ children: true }) });
    }
  }
}

/** a bottle in flight (the alley's escombro); false: not ours */
export function mareoProjectile(shot: ShotDef, core: Graphics): boolean {
  if (shot.id !== BOTELLA.id) return false;
  core.roundRect(-8, -6, 16, 26, 5).fill(0x2e7d4f).stroke({ width: 3, color: 0x0b2a18 });
  core.rect(-3.5, -18, 7, 13).fill(0x2e7d4f).stroke({ width: 2.5, color: 0x0b2a18 });
  core.rect(-5, 2, 10, 9).fill(0xf3ead2);
  core.rect(-6, -3, 3, 18).fill({ color: 0xffffff, alpha: 0.4 });
  return true;
}
