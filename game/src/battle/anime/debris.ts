/**
 * Tiny ballistic simulator for broken pieces living in the scene's debris layer.
 * Driven by gsap.ticker and scaled by gsap's global timeScale, so hitstop / slow-mo freeze debris too.
 * Wooden chunks splash and float on the surface for a while ("restos flotando") before sinking.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import gsap from 'gsap';
import { MeshSimple } from 'pixi.js';
import { killTweensDeep } from './util';

export type DebrisKind = 'chunk' | 'shard' | 'puff' | 'drop';

export interface DebrisBody {
  obj: Container;
  kind: DebrisKind;
  vx: number;
  vy: number;
  vr: number;
  g: number;
  waterY: number;
  /** wood floats a while, iron sinks */
  floats?: boolean;
  life?: number;
  age?: number;
  state?: 'air' | 'float' | 'sink';
  floatT?: number;
  baseScale?: number;
  grow?: number;
  onSplash?: (x: number, big: boolean) => void;
  big?: boolean;
  /** stepped (12 fps) motion like the anime FX */
  stepped?: boolean;
  /** paper / feathers: slow swaying fall */
  flutter?: boolean;
  acc?: number;
}

const bodies: DebrisBody[] = [];
let running = false;

export function addDebris(b: DebrisBody) {
  b.age = 0;
  b.state = 'air';
  b.acc = 0;
  b.baseScale = b.obj.scale.x;
  bodies.push(b);
  if (!running) {
    running = true;
    gsap.ticker.add(tick);
  }
}

function tick(_t: number, dms: number) {
  const dt = Math.min(0.05, dms / 1000) * gsap.globalTimeline.timeScale();
  for (let i = bodies.length - 1; i >= 0; i--) {
    const b = bodies[i];
    const o = b.obj;
    if (o.destroyed || !o.parent) {
      bodies.splice(i, 1);
      continue;
    }
    b.age! += dt;
    let step = dt;
    if (b.stepped) {
      b.acc! += dt;
      if (b.acc! < 1 / 12) continue;
      step = b.acc!;
      b.acc = 0;
    }
    if (b.kind === 'puff') {
      o.x += b.vx * step;
      o.y += b.vy * step;
      b.vx *= 1 - 1.5 * step;
      b.vy *= 1 - 1.2 * step;
      const f = b.age! / (b.life ?? 1);
      o.scale.set(b.baseScale! * (1 + f * (b.grow ?? 1.2)));
      o.alpha = Math.max(0, 1 - f * f);
      o.rotation += b.vr * step;
      if (f >= 1) kill(i);
      continue;
    }
    if (b.state === 'air') {
      b.vy += b.g * step;
      if (b.flutter) {
        b.vy = Math.min(b.vy, 70);
        b.vx *= 1 - 1.8 * step;
        o.x += Math.sin(b.age! * 6 + o.y * 0.01) * 60 * step;
        o.rotation = Math.sin(b.age! * 5) * 0.9;
      } else o.rotation += b.vr * step;
      o.x += b.vx * step;
      o.y += b.vy * step;
      if (b.kind === 'shard' && b.life && b.age! > b.life) {
        o.alpha = Math.max(0, o.alpha - step * 3);
        if (o.alpha <= 0.01) {
          kill(i);
          continue;
        }
      }
      if (o.y >= b.waterY && b.vy > 0) {
        if (b.kind === 'drop' || b.kind === 'shard') {
          kill(i);
          continue;
        }
        b.onSplash?.(o.x, !!b.big);
        if (b.floats) {
          b.state = 'float';
          b.floatT = 2 + Math.random() * 2.5;
          b.vx *= 0.25;
          b.vy = 0;
          b.vr *= 0.15;
        } else {
          b.state = 'sink';
          b.vy = Math.min(b.vy * 0.15, 90);
          b.vx *= 0.3;
          b.vr *= 0.4;
        }
      }
      if (o.y > b.waterY + 900) kill(i);
    } else if (b.state === 'float') {
      b.floatT! -= step;
      o.x += b.vx * step;
      b.vx *= 1 - 0.6 * step;
      const bobY = b.waterY - 3 + Math.sin(b.age! * 3 + o.x * 0.05) * 3;
      o.y += (bobY - o.y) * Math.min(1, step * 6);
      // settle toward flat-ish
      const target = Math.round(o.rotation / Math.PI) * Math.PI + Math.sin(b.age! * 2.2) * 0.12;
      o.rotation += (target - o.rotation) * Math.min(1, step * 2);
      if (b.floatT! <= 0) {
        b.state = 'sink';
        b.vy = 25;
      }
    } else {
      // sink: slow, darken, fade
      b.vy += (70 - b.vy) * Math.min(1, step * 2);
      o.y += b.vy * step;
      o.x += b.vx * step;
      o.rotation += b.vr * step;
      o.alpha = Math.max(0, o.alpha - step * (b.big ? 0.45 : 1.1));
      darken(o, step);
      if (o.alpha <= 0.01) kill(i);
    }
  }
  if (!bodies.length) {
    running = false;
    gsap.ticker.remove(tick);
  }
}

function darken(o: Container, step: number) {
  const k = Math.max(0, 1 - step * 0.9);
  const apply = (c: Container) => {
    if (c instanceof MeshSimple || c instanceof Sprite || c instanceof Graphics) {
      const t = c.tint as number;
      const r = Math.round(((t >> 16) & 255) * k + 20 * (1 - k));
      const g = Math.round(((t >> 8) & 255) * k + 50 * (1 - k));
      const bb = Math.round((t & 255) * k + 90 * (1 - k));
      c.tint = (r << 16) | (g << 8) | bb;
    }
    for (const ch of c.children) apply(ch as Container);
  };
  apply(o);
}

function kill(i: number) {
  const b = bodies[i];
  bodies.splice(i, 1);
  if (!b.obj.destroyed) {
    killTweensDeep(b.obj);
    b.obj.destroy({ children: true });
  }
}
