/** A cat living on the island: wanders inside its area "on twos", hops, sleeps (Zzz), sulks when homeless. */
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import gsap from 'gsap';
import { IslandCat } from '../art/catArt';
import { applyCatTint, slugOf } from '../art/tint';
import { catDef } from '../data/content';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { isoToScreen } from './iso';
import { emptyBoxArt } from './buildingArt';

export interface Area {
  x0: number;
  y0: number;
  w: number;
  h: number;
  /** keep out of this rect (the little house) */
  avoid?: { x0: number; y0: number; x1: number; y1: number };
}
export type Mood = 'roam' | 'sleep' | 'sad' | 'boxsleep';

const BASE = 104;

export class CatActor extends Container {
  cat: IslandCat;
  gx = 0;
  gy = 0;
  private tx = 0;
  private ty = 0;
  private wait = Math.random() * 1.5;
  private acc = 0;
  private zzzT = 0;
  private hopT = 3 + Math.random() * 6;
  speed = 0.9;
  mood: Mood = 'roam';
  area: Area;
  private face = 1;
  private levelScale = 1;
  private bubble: Container | null = null;
  private hint: Container | null = null;
  private travelling = false;
  private tweens: gsap.core.Tween[] = [];
  /** layer for Zzz/bubbles (world fx) */
  constructor(
    public catUid: string,
    public species: string,
    area: Area,
    public fx: Container,
  ) {
    super();
    this.area = area;
    this.cat = new IslandCat(slugOf(species), BASE);
    applyCatTint(this.cat.sprite, species);
    const ts = catDef(species).art.tint?.scale;
    if (ts) this.cat.baseScale *= ts;
    this.addChild(this.cat);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-BASE * 0.42, -BASE * 0.95, BASE * 0.84, BASE);
    const p = this.randomPoint();
    this.gx = this.tx = p.x;
    this.gy = this.ty = p.y;
    this.place();
  }

  setLevel(level: number, scale: number) {
    this.levelScale = scale;
    this.applyScale();
  }
  private applyScale() {
    const sleepy = this.mood === 'sleep' || this.mood === 'boxsleep';
    this.scale.set(this.levelScale * this.face, this.levelScale * (sleepy ? 0.9 : 1));
  }

  private randomPoint() {
    const a = this.area;
    for (let i = 0; i < 12; i++) {
      const x = a.x0 + Math.random() * a.w;
      const y = a.y0 + Math.random() * a.h;
      const v = a.avoid;
      if (v && x > v.x0 && x < v.x1 && y > v.y0 && y < v.y1) continue;
      return { x, y };
    }
    return { x: a.x0 + a.w * 0.6, y: a.y0 + a.h * 0.6 };
  }

  setArea(area: Area, travel = true) {
    this.area = area;
    const p = this.randomPoint();
    this.tx = p.x;
    this.ty = p.y;
    if (!travel) {
      this.gx = p.x;
      this.gy = p.y;
      this.place();
    } else {
      this.travelling = true;
      this.wait = 0;
    }
  }

  setMood(m: Mood) {
    if (m === this.mood) return;
    const was = this.mood;
    this.mood = m;
    this.bubble?.destroy({ children: true });
    this.bubble = null;
    this.tweens.forEach((t) => t.kill());
    this.tweens = [];
    this.hint?.destroy({ children: true });
    this.hint = null;
    if (m === 'sad') {
      const b = new Container();
      const g = new Graphics();
      g.roundRect(-44 + 3, -36 + 3, 88, 52, 16).fill(C.ink).roundRect(-44, -36, 88, 52, 16).fill(C.paper).stroke({ width: 3, color: C.ink });
      g.circle(-8, 24, 6).fill(C.paper).stroke({ width: 2.5, color: C.ink });
      g.circle(-16, 36, 3.5).fill(C.paper).stroke({ width: 2, color: C.ink });
      const box = emptyBoxArt();
      box.scale.set(0.62);
      box.position.set(-16, 0);
      const face: Text = txt('😿', { fontSize: 26 });
      face.anchor.set(0.5);
      face.position.set(20, -10);
      b.addChild(g, box, face);
      b.y = -BASE * 1.35;
      this.addChild(b);
      this.bubble = b;
      this.speed = 0.45;
    } else this.speed = 0.9;
    if (m === 'boxsleep') {
      // pulsing ring + hand hint: "¡TÓCALO!"
      const h = new Container();
      const ring = new Graphics().ellipse(0, 0, 58, 22).stroke({ width: 5, color: C.pinkHot });
      const label = txt('¡TÓCALO!', { fontFamily: F.comic, fontSize: 30, fill: C.yellow, stroke: { color: C.ink, width: 6, join: 'round' } });
      label.anchor.set(0.5);
      label.y = -BASE * 1.25;
      h.addChild(ring, label);
      this.addChildAt(h, 0);
      this.tweens.push(gsap.to(ring.scale, { x: 1.25, y: 1.25, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      this.tweens.push(gsap.to(label, { y: label.y - 10, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      this.hint = h;
    }
    if ((was === 'sleep' || was === 'boxsleep') && m === 'roam') this.cat.hop();
    this.applyScale();
  }

  /** wake-up animation (H01): big hop + ¡MIAU! handled by the scene */
  wake() {
    this.setMood('roam');
    gsap
      .timeline()
      .to(this.cat.sprite, { y: -BASE * 0.6, duration: 0.2, ease: 'power2.out' })
      .to(this.cat.sprite, { y: 0, duration: 0.35, ease: 'bounce.out' });
    gsap.fromTo(this.cat.scale, { x: 1.25, y: 0.75 }, { x: 1, y: 1, duration: 0.6, ease: 'elastic.out(1.2,0.4)' });
  }

  happy() {
    this.cat.hop();
  }

  private place() {
    const p = isoToScreen(this.gx, this.gy);
    this.position.set(p.x, p.y);
    this.zIndex = this.gx + this.gy + 0.01;
  }

  update(dt: number) {
    this.acc += dt;
    if (this.acc < 1 / 12) return; // animate on twos
    const step = this.acc;
    this.acc = 0;
    if (this.mood === 'sleep' || this.mood === 'boxsleep') {
      if (this.travelling) this.moveToward(step * 1.5);
      this.zzzT -= step;
      if (this.zzzT <= 0) {
        this.zzzT = 0.9;
        this.spawnZ();
      }
      return;
    }
    if (this.wait > 0) {
      this.wait -= step;
      this.hopT -= step;
      if (this.hopT <= 0 && this.mood === 'roam') {
        this.hopT = 4 + Math.random() * 8;
        this.cat.hop();
      }
      return;
    }
    if (this.moveToward(step)) {
      this.travelling = false;
      this.wait = 1.2 + Math.random() * 3.5;
      const p = this.randomPoint();
      this.tx = p.x;
      this.ty = p.y;
    }
  }

  /** returns true on arrival */
  private moveToward(step: number) {
    const dx = this.tx - this.gx;
    const dy = this.ty - this.gy;
    const d = Math.hypot(dx, dy);
    const sp = this.travelling ? Math.max(1.6, d / 3) : this.speed;
    if (d < 0.05) return true;
    const mv = Math.min(d, sp * step);
    this.gx += (dx / d) * mv;
    this.gy += (dy / d) * mv;
    const sx = dx - dy; // screen x direction
    const f = sx >= 0 ? 1 : -1;
    if (f !== this.face) {
      this.face = f;
      this.applyScale();
    }
    this.place();
    return mv >= d - 1e-4;
  }

  private spawnZ() {
    if (!this.fx || this.destroyed) return;
    const z = txt('Z', { fontFamily: F.comic, fontSize: 26, fill: C.paper, stroke: { color: C.ink, width: 5, join: 'round' } });
    z.anchor.set(0.5);
    z.position.set(this.x + 18 * this.levelScale, this.y - BASE * 0.75 * this.levelScale);
    z.scale.set(0.5);
    this.fx.addChild(z);
    gsap.to(z, { x: z.x + 26, y: z.y - 60, alpha: 0, duration: 1.8, ease: 'sine.out', onComplete: () => z.destroy() });
    gsap.to(z.scale, { x: 1.1, y: 1.1, duration: 1.2 });
  }

  override destroy() {
    gsap.killTweensOf(this.cat.sprite);
    gsap.killTweensOf(this.cat.scale);
    this.tweens.forEach((t) => t.kill());
    super.destroy({ children: true });
  }
}
