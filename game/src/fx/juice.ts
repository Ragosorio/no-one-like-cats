import { Container, Graphics, Text, Ticker, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { W, H } from '../core/App';
import { sparkTexture } from '../art/textures';
import { settings } from '../core/settings';
import { screenRect } from '../ui/screen';

/** Trauma-based screen shake applied to a target container. */
export class Shaker {
  trauma = 0;
  private t = 0;
  constructor(public target: Container, public maxOffset = 28, public maxRot = 0.03) {
    Ticker.shared.add(this.tick, this);
  }
  add(amount: number) {
    if (settings.reduceMotion) amount *= 0.25;
    this.trauma = Math.min(1, this.trauma + amount);
  }
  private tick(tk: Ticker) {
    const dt = tk.deltaMS / 1000;
    this.t += dt * 40;
    if (this.trauma <= 0) {
      this.target.pivot.set(0, 0);
      this.target.rotation = 0;
      return;
    }
    const s = this.trauma * this.trauma;
    // smooth-ish noise from sines
    const nx = Math.sin(this.t * 1.7) * Math.cos(this.t * 0.9);
    const ny = Math.sin(this.t * 1.3 + 2) * Math.cos(this.t * 1.1);
    const nr = Math.sin(this.t * 0.7 + 5);
    this.target.pivot.set(nx * this.maxOffset * s, ny * this.maxOffset * s);
    this.target.rotation = nr * this.maxRot * s;
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
  }
  destroy() {
    Ticker.shared.remove(this.tick, this);
  }
}

/** Global game-time scale for hitstop / slow-mo (battle logic multiplies dt by this). */
export const time = {
  scale: 1,
  hitstop(ms: number) {
    if (settings.reduceMotion) ms *= 0.5;
    time.scale = 0.02;
    gsap.globalTimeline.timeScale(0.02);
    window.setTimeout(() => {
      time.scale = 1;
      gsap.globalTimeline.timeScale(1);
    }, ms);
  },
  slowmo(scale: number, ms: number) {
    time.scale = scale;
    gsap.globalTimeline.timeScale(scale);
    window.setTimeout(() => {
      time.scale = 1;
      gsap.globalTimeline.timeScale(1);
    }, ms);
  },
};

/** Fullscreen flash */
export function flash(layer: Container, color: number = C.white, alpha = 0.8, dur = 0.25) {
  if (settings.reduceFlashes) alpha *= 0.3;
  const g = screenRect(color);
  g.alpha = alpha;
  layer.addChild(g);
  gsap.to(g, { alpha: 0, duration: dur, ease: 'power2.out', onComplete: () => g.destroy() });
}

/** Floating number / text that pops and rises */
export function floatText(
  layer: Container,
  x: number,
  y: number,
  text: string,
  o: { color?: number; size?: number; font?: string; stroke?: number; rise?: number; dur?: number; rot?: number } = {},
) {
  const t = txt(text, {
    fontFamily: o.font ?? F.comic,
    fontSize: o.size ?? 44,
    fill: o.color ?? C.yellow,
    stroke: { color: o.stroke ?? C.ink, width: Math.max(4, (o.size ?? 44) / 7), join: 'round' },
    letterSpacing: 1,
  });
  t.anchor.set(0.5);
  t.position.set(x, y);
  t.rotation = o.rot ?? (Math.random() - 0.5) * 0.25;
  t.scale.set(0.2);
  layer.addChild(t);
  const tl = gsap.timeline({ onComplete: () => t.destroy() });
  tl.to(t.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(4)' })
    .to(t, { y: y - (o.rise ?? 90), duration: o.dur ?? 0.9, ease: 'power1.out' }, 0)
    .to(t, { alpha: 0, duration: 0.3 }, (o.dur ?? 0.9) - 0.25);
  return t;
}

/** Comic onomatopoeia with CMYK misregistration ghosts: ¡BOOM! ¡ÑAM! */
export function onomatopoeia(
  layer: Container,
  x: number,
  y: number,
  word: string,
  o: { color?: number; size?: number; font?: string; dur?: number } = {},
) {
  const size = o.size ?? 120;
  const c = new Container();
  c.position.set(x, y);
  c.rotation = (Math.random() - 0.5) * 0.4;
  const mk = (fill: number, dx: number, dy: number, alpha = 1) => {
    const t = txt(word, {
      fontFamily: o.font ?? F.comic,
      fontSize: size,
      fill,
      stroke: { color: C.ink, width: size / 9, join: 'round' },
      letterSpacing: 2,
    });
    t.anchor.set(0.5);
    t.position.set(dx, dy);
    t.alpha = alpha;
    return t;
  };
  const ghostA = mk(C.cyan, -6, 3, 0.85);
  const ghostB = mk(C.pinkHot, 6, -3, 0.85);
  ghostA.blendMode = 'multiply';
  ghostB.blendMode = 'multiply';
  c.addChild(ghostA, ghostB, mk(o.color ?? C.yellow, 0, 0));
  c.scale.set(0.1);
  layer.addChild(c);
  const d = o.dur ?? 0.9;
  gsap
    .timeline({ onComplete: () => c.destroy({ children: true }) })
    .to(c.scale, { x: 1.15, y: 1.15, duration: 0.12, ease: 'back.out(5)' })
    .to(c.scale, { x: 1, y: 1, duration: 0.15 })
    .to(c, { alpha: 0, duration: 0.25 }, d - 0.25);
  return c;
}

/** Radial speed lines (anime) centered on a point */
export function speedLines(layer: Container, x: number, y: number, color: number = C.ink, count = 48, dur = 0.5) {
  if (settings.reduceMotion) return;
  const g = new Graphics();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.1;
    const r0 = 260 + Math.random() * 220;
    const r1 = 1500;
    const w = 0.012 + Math.random() * 0.02;
    g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0)
      .lineTo(x + Math.cos(a - w) * r1, y + Math.sin(a - w) * r1)
      .lineTo(x + Math.cos(a + w) * r1, y + Math.sin(a + w) * r1)
      .closePath();
  }
  g.fill(color);
  layer.addChild(g);
  let frame = 0;
  const jitter = () => {
    frame++;
    g.rotation = frame % 2 ? 0.01 : -0.01;
  };
  const iv = window.setInterval(jitter, 1000 / 12);
  gsap.to(g, {
    alpha: 0,
    duration: 0.2,
    delay: dur,
    onComplete: () => {
      window.clearInterval(iv);
      g.destroy();
    },
  });
}

/** Sparkle burst made of 4-point stars */
export function sparkles(layer: Container, x: number, y: number, color: number = C.yellow, n = 10, radius = 120) {
  const tex: Texture = sparkTexture();
  for (let i = 0; i < n; i++) {
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    s.tint = color;
    s.position.set(x, y);
    s.scale.set(0);
    layer.addChild(s);
    const a = Math.random() * Math.PI * 2;
    const r = radius * (0.4 + Math.random() * 0.6);
    const sc = 0.3 + Math.random() * 0.6;
    gsap
      .timeline({ delay: Math.random() * 0.15, onComplete: () => s.destroy() })
      .to(s, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, duration: 0.5, ease: 'power3.out' }, 0)
      .to(s.scale, { x: sc, y: sc, duration: 0.2, ease: 'back.out(3)' }, 0)
      .to(s.scale, { x: 0, y: 0, duration: 0.3 }, 0.35)
      .to(s, { rotation: Math.PI, duration: 0.6 }, 0);
  }
}

/** Squash & stretch pop on any display object */
export function pop(target: Container, amount = 0.25, dur = 0.35) {
  const sx = target.scale.x;
  const sy = target.scale.y;
  gsap.fromTo(
    target.scale,
    { x: sx * (1 + amount), y: sy * (1 - amount * 0.7) },
    { x: sx, y: sy, duration: dur, ease: 'elastic.out(1.2, 0.4)' },
  );
}

export type { Text };
