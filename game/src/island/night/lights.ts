/**
 * Light that really lights the night (world space, ADDITIVE, drawn above the graded world, never graded):
 * windows and lanterns with pools of light on the ground, portals, dimension glows, the faro's lamp and its
 * beam sweeping outward over the void, sparkles and star reflections on the lagoons, ripples where a star
 * leaves the water, and the near upward-falling stars. Positions come from the island layout (./index.ts).
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { glowTexture, sparkTexture } from '../../art/textures';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { isoToScreen } from '../iso';
import { DROP } from '../terrain';
import { dimWorld } from '../dimensions/state';
import type { WorldLook } from '../../state/sys/worldState';
import { beamTex, poolTex, streakTex } from './textures';
import { RisingStars } from './stars';

export type LightKind = 'window' | 'lantern' | 'portal' | 'dim' | 'glow';
export interface LightSpot {
  x: number;
  y: number;
  color: number;
  /** glow radius in px */
  r: number;
  kind: LightKind;
  /** 0 = steady, 1 = candle */
  flicker?: number;
  /** a pool of light on the ground under it (px below the light) */
  pool?: number;
}

interface Glow {
  spot: LightSpot;
  s: Sprite;
  pool: Sprite | null;
  ph: number;
}
interface Spark {
  s: Sprite;
  t: number;
  life: number;
}
interface Ripple {
  s: Sprite;
  t: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class NightLights extends Container {
  private poolLayer = new Container();
  private glowLayer = new Container();
  private seaLayer = new Container();
  private faroLayer = new Container();
  private markLayer = new Container();
  readonly stars = new RisingStars(110, 0.5);
  private glows: Glow[] = [];
  private sparks: Spark[] = [];
  private ripples: Ripple[] = [];
  private strange: Sprite[] = [];
  private faro: { core: Sprite; halo: Sprite; beam: Sprite; core2: Sprite; back: Sprite; pool: Sprite; refl: Sprite | null; at: { x: number; y: number } } | null = null;
  private beamA = -0.35;
  private bloom = 0;
  private t = 0;
  /** strange reflection on the lagoons (the opening): 0..1 */
  reflect = 0;
  /** where the faro beam is aimed (radians in screen-iso), null = sweeping */
  aim: number | null = null;

  constructor() {
    super();
    this.eventMode = 'none';
    this.label = 'nightLights';
    for (const l of [this.poolLayer, this.glowLayer, this.seaLayer, this.faroLayer]) l.blendMode = 'add';
    this.addChild(this.poolLayer, this.seaLayer, this.glowLayer, this.faroLayer, this.stars, this.markLayer);
  }

  // ------------------------------------------------------------------ build
  setSpots(spots: LightSpot[]) {
    for (const g of this.glows) {
      g.s.destroy();
      g.pool?.destroy();
    }
    this.glows = [];
    const glowT = glowTexture();
    const poolT = poolTex();
    for (const spot of spots) {
      const s = new Sprite(glowT);
      s.anchor.set(0.5);
      s.tint = spot.color;
      s.blendMode = 'add';
      s.position.set(spot.x, spot.y);
      s.scale.set(spot.r / 64);
      this.glowLayer.addChild(s);
      let pool: Sprite | null = null;
      if (spot.pool !== undefined) {
        pool = new Sprite(poolT);
        pool.anchor.set(0.5);
        pool.tint = spot.color;
        pool.blendMode = 'add';
        pool.position.set(spot.x, spot.y + spot.pool);
        pool.scale.set((spot.r * 2.2) / 256);
        this.poolLayer.addChild(pool);
      }
      this.glows.push({ spot, s, pool, ph: Math.random() * 6.28 });
    }
  }

  setFaro(at: { x: number; y: number } | null) {
    if (this.faro) for (const k of ['core', 'halo', 'beam', 'core2', 'back', 'pool'] as const) this.faro[k].destroy();
    this.faro?.refl?.destroy();
    this.faro = null;
    if (!at) return;
    const g = glowTexture();
    const halo = new Sprite(g);
    halo.anchor.set(0.5);
    halo.tint = 0xffe7a8;
    const core = new Sprite(g);
    core.anchor.set(0.5);
    core.tint = 0xfffbe8;
    const beam = new Sprite(beamTex());
    beam.anchor.set(0, 0.5);
    beam.tint = 0xfff0c4;
    const back = new Sprite(beamTex());
    back.anchor.set(0, 0.5);
    back.tint = 0xffe2a0;
    const core2 = new Sprite(beamTex());
    core2.anchor.set(0, 0.5);
    core2.tint = 0xffffff;
    const pool = new Sprite(poolTex());
    pool.anchor.set(0.5);
    pool.tint = 0xffd88a;
    pool.position.set(at.x, at.y + 186);
    pool.scale.set(1.5);
    // its reflection on the nearest lagoon water (if the faro stands by the water)
    let refl: Sprite | null = null;
    const w = nearestWater(at.x, at.y + 170, 420);
    if (w) {
      refl = new Sprite(streakTex());
      refl.anchor.set(0.5, 0.05);
      refl.tint = 0xffe7a8;
      refl.position.set(w.x, w.y);
      this.seaLayer.addChild(refl);
    }
    for (const s of [halo, core]) s.position.set(at.x, at.y);
    for (const s of [beam, core2, back]) s.position.set(at.x, at.y);
    for (const s of [pool, back, beam, core2, halo, core]) s.blendMode = 'add';
    if (refl) refl.blendMode = 'add';
    this.faroLayer.addChild(pool, back, beam, core2, halo, core);
    this.faro = { core, halo, beam, core2, back, pool, refl, at };
  }

  // ------------------------------------------------------------------ events
  /** the lamp lights up with a bloom (local, never a full-screen flash; gentler with «reducir destellos») */
  ignite(soft = false) {
    this.bloom = soft ? 0.35 : 1;
  }
  ripple(x: number, y: number) {
    let r = this.ripples.find((q) => q.t >= 1);
    if (!r) {
      if (this.ripples.length > 24) return;
      const s = new Sprite(poolTex());
      s.anchor.set(0.5);
      s.tint = 0xb9b0ff;
      s.blendMode = 'add';
      this.seaLayer.addChild(s);
      r = { s, t: 1 };
      this.ripples.push(r);
    }
    r.t = 0;
    r.s.position.set(x, y);
    r.s.visible = true;
  }

  /** a pulsing «tap here» marker over a world point (interactions); returns its remover */
  marker(at: { x: number; y: number }, text: string): () => void {
    const c = new Container();
    c.position.set(at.x, at.y);
    const ring = new Graphics();
    ring.ellipse(0, 0, 70, 26).stroke({ width: 6, color: C.yellow });
    ring.ellipse(0, 0, 70, 26).stroke({ width: 2, color: C.ink, alpha: 0.6 });
    ring.y = 190;
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = 0xffe7a8;
    glow.blendMode = 'add';
    glow.scale.set(2.6);
    const arrow = new Graphics();
    arrow.poly([-22, -30, 22, -30, 0, 0]).fill(C.yellow).stroke({ width: 5, color: C.ink, join: 'round' });
    arrow.y = -70;
    const label = txt(text, { fontFamily: F.comic, fontSize: 40, fill: C.yellow, stroke: { color: C.ink, width: 8, join: 'round' }, letterSpacing: 1 }) as Text;
    label.anchor.set(0.5, 1);
    label.y = -112;
    c.addChild(glow, ring, arrow, label);
    this.markLayer.addChild(c);
    const born = this.t;
    const tick = () => {
      if (c.destroyed) return;
      const t = this.t - born;
      const k = 0.5 + 0.5 * Math.sin(t * 5);
      ring.scale.set(1 + k * 0.25);
      ring.alpha = 0.6 + 0.4 * k;
      arrow.y = -70 - k * 14;
      label.y = -112 - k * 14;
      glow.alpha = 0.35 + 0.35 * k;
    };
    (c as Container & { tickMark?: () => void }).tickMark = tick;
    return () => {
      if (!c.destroyed) c.destroy({ children: true });
    };
  }

  // ------------------------------------------------------------------ frame
  update(dt: number, look: WorldLook, cam: { x0: number; y0: number; x1: number; y1: number }, reduceMotion: boolean) {
    this.t += dt;
    const L = look.lights;
    this.glowLayer.visible = this.poolLayer.visible = L > 0.003;
    if (L > 0.003)
      for (const g of this.glows) {
        const sp = g.spot;
        const vis = sp.x > cam.x0 - 300 && sp.x < cam.x1 + 300 && sp.y > cam.y0 - 300 && sp.y < cam.y1 + 400;
        g.s.visible = vis;
        if (g.pool) g.pool.visible = vis;
        if (!vis) continue;
        const fl = sp.flicker ? 1 - sp.flicker * 0.18 * (0.5 + 0.5 * Math.sin(this.t * 11 + g.ph) * Math.sin(this.t * 7.3 + g.ph * 2)) : 1;
        const pulse = sp.kind === 'portal' ? 0.85 + 0.15 * Math.sin(this.t * 2.2 + g.ph) : 1;
        const base = sp.kind === 'dim' ? 0.38 : sp.kind === 'glow' ? 0.7 : 0.9;
        g.s.alpha = L * base * fl * pulse;
        if (g.pool) g.pool.alpha = L * 0.55 * fl;
      }
    this.updateFaro(dt, look.faro, reduceMotion);
    this.updateSea(dt, look.seaGlow, cam);
    this.stars.update(dt, cam.y0, reduceMotion);
    for (const r of this.ripples) {
      if (r.t >= 1) {
        r.s.visible = false;
        continue;
      }
      r.t = Math.min(1, r.t + dt / 1.1);
      r.s.scale.set(0.15 + r.t * 0.7, 0.15 + r.t * 0.7);
      r.s.alpha = (1 - r.t) * 0.8;
    }
    for (const c of this.markLayer.children) (c as Container & { tickMark?: () => void }).tickMark?.();
  }

  private updateFaro(dt: number, F: number, reduceMotion: boolean) {
    const f = this.faro;
    if (!f) return;
    this.faroLayer.visible = F > 0.003 || this.bloom > 0.01;
    if (f.refl) f.refl.visible = F > 0.003;
    if (!this.faroLayer.visible) return;
    this.bloom = Math.max(0, this.bloom - dt * 0.9);
    const b = this.bloom;
    const breathe = 0.92 + 0.08 * Math.sin(this.t * 2.4);
    f.core.alpha = Math.min(1, F * breathe + b);
    f.core.scale.set(0.7 + b * 0.8);
    f.halo.alpha = Math.min(1, F * 0.55 * breathe + b * 0.6);
    f.halo.scale.set(3.4 + b * 4.5);
    f.pool.alpha = F * 0.5;
    // the beam sweeps around (projected on the iso ground: an ellipse 2:1)
    const speed = reduceMotion ? 0.32 : 0.7;
    if (this.aim === null) this.beamA += dt * speed;
    else this.beamA += angleDelta(this.beamA, this.aim) * Math.min(1, dt * 1.6);
    const a = this.beamA;
    const dx = Math.cos(a);
    const dy = Math.sin(a) * 0.5;
    const len = Math.hypot(dx, dy);
    const toward = Math.sin(a) > 0; // pointing at the viewer (down-screen)
    // brightest when it sweeps sideways over the void; toward/away from the viewer it foreshortens and dims
    // (and never paints a white smear over the tower)
    const side = Math.abs(Math.cos(a));
    f.beam.rotation = Math.atan2(dy, dx);
    f.beam.scale.set((1600 * len) / 512, 1.2);
    f.beam.alpha = F * (0.18 + 0.62 * side) * (toward ? 1 : 0.7);
    f.core2.rotation = f.beam.rotation;
    f.core2.scale.set((1100 * len) / 512, 0.42);
    f.core2.alpha = F * (0.1 + 0.55 * side) * (toward ? 1 : 0.6);
    f.back.rotation = f.beam.rotation + Math.PI;
    f.back.scale.set((700 * len) / 512, 0.9);
    f.back.alpha = F * 0.2 * side;
    if (f.refl) {
      f.refl.alpha = F * (0.32 + 0.12 * Math.sin(this.t * 3.1));
      f.refl.scale.set(0.55 + 0.12 * Math.sin(this.t * 4.3), -0.85);
    }
  }

  private updateSea(dt: number, glow: number, cam: { x0: number; y0: number; x1: number; y1: number }) {
    const want = Math.round(glow * 64 + this.reflect * 30);
    this.seaLayer.visible = want > 0 || this.ripples.some((r) => r.t < 1) || !!this.faro?.refl?.visible;
    // strange reflection: violet pools breathing on the lagoons near the camera
    const wantStrange = this.reflect > 0.01 ? 14 : 0;
    if (wantStrange && !this.strange.length) {
      for (let i = 0; i < wantStrange; i++) {
        const p = waterPoint(cam);
        if (!p) break;
        const s = new Sprite(poolTex());
        s.anchor.set(0.5);
        s.tint = i % 3 ? 0x8f7bff : 0x5ff3d0;
        s.blendMode = 'add';
        s.position.set(p.x, p.y);
        s.scale.set(rnd(0.9, 1.6), rnd(0.5, 0.8));
        (s as Sprite & { ph?: number }).ph = Math.random() * 6.28;
        this.seaLayer.addChildAt(s, 0);
        this.strange.push(s);
      }
    }
    for (const s of this.strange) s.alpha = this.reflect * (0.55 + 0.3 * Math.sin(this.t * 1.7 + ((s as Sprite & { ph?: number }).ph ?? 0)));
    if (this.reflect <= 0.01 && this.strange.length) {
      for (const s of this.strange) s.destroy();
      this.strange = [];
    }
    // sparkles: each lives a moment on a random lagoon tile in view, then moves on
    while (this.sparks.length < want) {
      const s = new Sprite(sparkTexture());
      s.anchor.set(0.5);
      s.blendMode = 'add';
      s.visible = false;
      this.seaLayer.addChild(s);
      this.sparks.push({ s, t: 1, life: 1 });
    }
    for (let i = 0; i < this.sparks.length; i++) {
      const sp = this.sparks[i];
      if (i >= want) {
        sp.s.visible = false;
        continue;
      }
      sp.t += dt / sp.life;
      if (sp.t >= 1) {
        const p = waterPoint(cam);
        if (!p) {
          sp.s.visible = false;
          continue;
        }
        sp.t = 0;
        sp.life = rnd(0.7, 1.9);
        sp.s.position.set(p.x, p.y);
        sp.s.tint = Math.random() < 0.5 ? 0xffffff : Math.random() < 0.5 ? 0xbfe8ff : 0xd8c8ff;
        sp.s.visible = true;
      }
      const k = Math.sin(sp.t * Math.PI);
      // the uncanny bit: reflected stars sink in the water — the mirror of what the sky is about to do
      if (this.reflect > 0.01) sp.s.y += dt * 22 * this.reflect;
      sp.s.alpha = k * (0.55 + this.reflect * 0.4);
      sp.s.scale.set((0.1 + k * 0.16) * (1 + this.reflect * 0.5));
      sp.s.rotation = sp.t * 1.5;
    }
  }

  clearFx() {
    this.stars.clear();
    this.bloom = 0;
    this.reflect = 0;
    for (const c of [...this.markLayer.children]) c.destroy({ children: true });
  }
}

function angleDelta(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** a random point on lagoon water (open islands only) inside the camera rect */
export function waterPoint(cam: { x0: number; y0: number; x1: number; y1: number }): { x: number; y: number } | null {
  const plates = dimWorld.plates;
  if (!plates) return null;
  for (let tries = 0; tries < 6; tries++) {
    const list = [...plates.values()].filter((p) => p.wet.length && dimWorld.looks.get(p.id) === 'open' && p.maxX > cam.x0 && p.minX < cam.x1 && p.maxY + DROP > cam.y0 && p.minY < cam.y1);
    if (!list.length) return null;
    const p = list[Math.floor(Math.random() * list.length)];
    const t = p.wet[Math.floor(Math.random() * p.wet.length)];
    const s = isoToScreen(t.gx + Math.random() - 0.5, t.gy + Math.random() - 0.5);
    const y = s.y + DROP;
    if (s.x > cam.x0 && s.x < cam.x1 && y > cam.y0 && y < cam.y1) return { x: s.x, y };
  }
  return null;
}

/** the closest lagoon water to a point (within `max` px) */
export function nearestWater(x: number, y: number, max: number): { x: number; y: number } | null {
  const plates = dimWorld.plates;
  if (!plates) return null;
  let best: { x: number; y: number } | null = null;
  let bd = max;
  for (const p of plates.values())
    for (const t of p.wet) {
      const s = isoToScreen(t.gx, t.gy);
      const d = Math.hypot(s.x - x, s.y + DROP - y);
      if (d < bd) {
        bd = d;
        best = { x: s.x, y: s.y + DROP };
      }
    }
  return best;
}
