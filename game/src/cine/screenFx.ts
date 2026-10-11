/**
 * Screen-level flourishes any CINE stage can use (`{ fx: { id: … } }` that the stage itself doesn't handle).
 * They live in the overlay layer, under the cine's letterbox and SALTAR, and are always removed by their stopper
 * (the runner calls it when the cine ends in any way). Time runs on the Pixi ticker; the cine's own clock decides
 * WHEN they start. Reduce motion / reduce flashes have their own gentler variants.
 *
 *   glitch  { dur, k, on: 'scene' | 'panel' | 'hud:<id>' }   the picture itself tears (GlitchFilter + RGB split)
 *   card    { title, sub, hold }                             a paper card in the middle («CONTINUARÁ»)
 *   ink     { text, x, y, size, rot, color, write, hold }    handwriting that writes itself (an unknown hand)
 *   fade    { to, dur, color }                               the whole screen fades to a color and stays (0 = clear)
 *   point   { at: 'hud:<id>', text, hold }                   an arrow + label over a HUD button («ÁBRELO»)
 *   banner  { text, sub }                                    a system line that types itself in static (REGISTRO 000)
 */
import { Container, Graphics, Sprite, Text, Texture, Ticker } from 'pixi.js';
import { GlitchFilter, RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { game } from '../core/App';
import { scenes } from '../core/scenes';
import { C, F } from '../ui/theme';
import { poster, txt } from '../ui/widgets';
import { Modal } from '../ui/modal';
import type { CineCtx, FxCmd } from './types';

type Stopper = () => void;

/** what a glitch / point can grab: the scene, the top panel, or a HUD action button (`hud:catdex`) */
function grab(on: string): Container | null {
  const sc = scenes.current as (Container & { hud?: Container & { actions?: Container } }) | null;
  if (on === 'panel') {
    const mods = scenes.overlayLayer.children.filter((c): c is Modal => c instanceof Modal && c.visible && !c.destroyed && !c.closed);
    return mods[mods.length - 1]?.panel ?? null;
  }
  if (on.startsWith('hud:')) {
    const id = on.slice(4);
    const bar = sc?.hud?.actions;
    return (bar?.children.find((c) => (c as unknown as { def?: { id?: string } }).def?.id === id) as Container | undefined) ?? null;
  }
  return sc;
}

function glitch(cmd: FxCmd, ctx: CineCtx): Stopper {
  const target = grab(String(cmd.on ?? 'scene'));
  if (!target || target.destroyed) return () => undefined;
  const k = Number(cmd.k ?? 1);
  const dur = Number(cmd.dur ?? 0.8);
  const soft = ctx.reduceFlashes || ctx.reduceMotion;
  const gl = new GlitchFilter({ slices: soft ? 4 : 9, offset: (soft ? 14 : 46) * k, fillMode: 2, seed: Math.random() });
  const rgb = new RGBSplitFilter({ red: { x: -6 * k, y: 0 }, green: { x: 0, y: 0 }, blue: { x: 6 * k, y: 0 } });
  const prev = target.filters ? [...(target.filters as never[])] : [];
  const mine = soft ? [gl] : [gl, rgb];
  target.filters = [...prev, ...mine];
  let t = 0;
  let acc = 0;
  let dead = false;
  const tick = (tk: Ticker) => {
    if (dead || target.destroyed) return stop();
    const dt = tk.deltaMS / 1000;
    t += dt;
    acc += dt;
    // stepped (12 fps, 5 with reduced flashes): it reads as broken signal, not as a strobe
    if (acc >= (soft ? 0.2 : 1 / 12)) {
      acc = 0;
      gl.seed = Math.random();
      gl.refresh();
      const on = Math.random() < (soft ? 0.6 : 0.8);
      gl.offset = on ? (soft ? 14 : 46) * k * (0.4 + Math.random()) : 0;
      rgb.red = { x: on ? -6 * k : 0, y: 0 };
      rgb.blue = { x: on ? 6 * k : 0, y: 0 };
    }
    if (t >= dur) stop();
  };
  const stop = () => {
    if (dead) return;
    dead = true;
    Ticker.shared.remove(tick);
    if (!target.destroyed) target.filters = (target.filters as never[] | null)?.filter((f) => !mine.includes(f as never)) ?? [];
    gl.destroy();
    rgb.destroy();
  };
  Ticker.shared.add(tick);
  return stop;
}

function layer() {
  const c = new Container();
  c.label = 'cineFx';
  c.eventMode = 'none';
  scenes.overlayLayer.addChild(c);
  return c;
}

/** «CONTINUARÁ» and friends: a paper card that lands in the middle and holds */
function card(cmd: FxCmd, ctx: CineCtx): Stopper {
  const root = layer();
  const v = game.view;
  const dim = new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: C.ink, alpha: 0.55 });
  const box = new Container();
  const title = poster(String(cmd.title ?? 'CONTINUARÁ'), 120, C.ink, { letterSpacing: 6 });
  title.anchor.set(0.5);
  const sub = cmd.sub ? poster(String(cmd.sub), 44, C.pinkHot, { letterSpacing: 4 }) : null;
  const w = Math.max(title.width, sub?.width ?? 0) + 140;
  const h = 210 + (sub ? 70 : 0);
  box.addChild(new Graphics().rect(-w / 2 + 12, -h / 2 + 12, w, h).fill(C.ink).rect(-w / 2, -h / 2, w, h).fill(C.paper).stroke({ width: 6, color: C.ink, alignment: 1 }));
  title.position.set(0, sub ? -36 : 0);
  box.addChild(title);
  if (sub) {
    sub.anchor.set(0.5);
    sub.position.set(0, 66);
    const rule = new Graphics().rect(-sub.width / 2, 26, sub.width, 5).fill(C.ink);
    box.addChild(rule, sub);
  }
  box.position.set(v.x + v.w / 2, v.y + v.h / 2);
  box.rotation = -0.025;
  root.addChild(dim, box);
  root.alpha = 0;
  gsap.to(root, { alpha: 1, duration: 0.5 });
  if (!ctx.reduceMotion) gsap.from(box.scale, { x: 1.25, y: 1.25, duration: 0.55, ease: 'back.out(1.6)' });
  if (sub) {
    sub.alpha = 0;
    gsap.to(sub, { alpha: 1, duration: 0.25, delay: 0.9 });
    if (!ctx.reduceMotion) gsap.from(sub.scale, { x: 2.2, y: 2.2, duration: 0.3, delay: 0.9, ease: 'power3.in' });
  }
  return () => {
    gsap.killTweensOf([root, box.scale, sub, sub?.scale].filter(Boolean));
    if (root.destroyed) return;
    gsap.to(root, { alpha: 0, duration: 0.4, onComplete: () => root.destroy({ children: true }) });
  };
}

/** handwriting that writes itself left to right (a mask grows over brush text) */
function ink(cmd: FxCmd, ctx: CineCtx): Stopper {
  const root = layer();
  const v = game.view;
  // ink that reads by day AND by night: a pale ink line with the hand's dark edge (`color` = that edge)
  const size = Number(cmd.size ?? 120);
  const t = txt(String(cmd.text ?? ''), { fontFamily: F.brush, fontSize: size, fill: Number(cmd.fill ?? 0xf1ecff), stroke: { color: Number(cmd.color ?? C.ink), width: Math.max(4, size * 0.07), join: 'round' }, padding: 24 }) as Text;
  t.anchor.set(0.5);
  const x = v.x + v.w * Number(cmd.x ?? 0.5);
  const y = v.y + v.h * Number(cmd.y ?? 0.42);
  t.position.set(x, y);
  t.rotation = Number(cmd.rot ?? -0.06);
  const mask = new Sprite(Texture.WHITE);
  mask.anchor.set(0, 0.5);
  mask.height = t.height * 1.6;
  mask.rotation = t.rotation;
  const left = x - (t.width / 2) * Math.cos(t.rotation);
  const top = y - (t.width / 2) * Math.sin(t.rotation);
  mask.position.set(left, top);
  mask.width = 1;
  t.mask = mask;
  root.addChild(t, mask);
  const write = ctx.reduceMotion ? 0.01 : Number(cmd.write ?? 1.2);
  const tw = gsap.to(mask, { width: t.width + 40, duration: write, ease: 'power1.inOut' });
  return () => {
    tw.kill();
    if (root.destroyed) return;
    gsap.to(root, { alpha: 0, duration: 0.5, onComplete: () => root.destroy({ children: true }) });
  };
}

/** the whole screen fades to a color (kept until the stopper; `to: 0` = clear again) */
let fadeRoot: Container | null = null;
function fade(cmd: FxCmd): Stopper {
  const v = game.view;
  if (!fadeRoot || fadeRoot.destroyed) {
    fadeRoot = layer();
    fadeRoot.addChild(new Graphics().rect(v.x - 4, v.y - 4, v.w + 8, v.h + 8).fill(0xffffff));
    fadeRoot.alpha = 0;
  }
  const r = fadeRoot;
  (r.children[0] as Graphics).tint = Number(cmd.color ?? C.ink);
  gsap.killTweensOf(r);
  gsap.to(r, { alpha: Number(cmd.to ?? 1), duration: Number(cmd.dur ?? 0.5), ease: 'sine.inOut' });
  return () => {
    if (r.destroyed) return;
    gsap.killTweensOf(r);
    gsap.to(r, { alpha: 0, duration: 0.3, onComplete: () => r.destroy({ children: true }) });
    if (fadeRoot === r) fadeRoot = null;
  };
}

/** an inked arrow + label over a HUD button (the cine hands control back and says where to go) */
function point(cmd: FxCmd, ctx: CineCtx): Stopper {
  const target = grab(String(cmd.at ?? 'hud:catdex'));
  if (!target) return () => undefined;
  const root = layer();
  const lab = poster(String(cmd.text ?? '¡AQUÍ!'), 34, C.paper, { stroke: { color: C.ink, width: 8 } });
  lab.anchor.set(0.5, 1);
  const arrow = new Graphics().poly([-18, 0, 18, 0, 0, 26]).fill(C.pinkHot).stroke({ width: 4, color: C.ink, join: 'round' });
  root.addChild(lab, arrow);
  let t = 0;
  const tick = (tk: Ticker) => {
    if (root.destroyed || target.destroyed) return stop();
    t += tk.deltaMS / 1000;
    const b = target.getBounds();
    const p = scenes.overlayLayer.toLocal({ x: b.x + b.width / 2, y: b.y });
    const bob = ctx.reduceMotion ? 0 : Math.sin(t * 5) * 8;
    arrow.position.set(p.x, p.y - 34 + bob);
    lab.position.set(p.x, p.y - 40 + bob);
    if (cmd.hold && t > Number(cmd.hold)) stop();
  };
  const stop = () => {
    Ticker.shared.remove(tick);
    if (!root.destroyed) root.destroy({ children: true });
  };
  Ticker.shared.add(tick);
  return stop;
}

/** a line the system types by itself, half static: «NEW ENTRY DETECTED — REGISTRO 000» */
function banner(cmd: FxCmd, ctx: CineCtx): Stopper {
  const root = layer();
  const v = game.view;
  const full = String(cmd.text ?? '');
  const sub = cmd.sub ? String(cmd.sub) : '';
  const strip = new Graphics();
  const t = txt('', { fontFamily: F.glitch, fontSize: 52, fill: C.paper, letterSpacing: 3 }) as Text;
  const st = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.pinkHot, letterSpacing: 6 }) as Text;
  t.anchor.set(0.5);
  st.anchor.set(0.5);
  const cy = v.y + v.h * 0.2;
  t.position.set(v.x + v.w / 2, cy);
  st.position.set(v.x + v.w / 2, cy + 50);
  st.alpha = 0;
  root.addChild(strip, t, st);
  const GLYPHS = '#%&@$?¿!/\\|<>░▒▓';
  let n = 0;
  let acc = 0;
  let life = 0;
  const tick = (tk: Ticker) => {
    if (root.destroyed) return;
    const dt = tk.deltaMS / 1000;
    acc += dt;
    life += dt;
    if (acc >= (ctx.reduceMotion ? 0.02 : 0.045)) {
      acc = 0;
      n = Math.min(full.length, n + (ctx.reduceMotion ? 4 : 1));
      // what's typed so far, with a couple of wrong glyphs that settle
      let out = '';
      for (let i = 0; i < n; i++) out += i >= n - 2 && n < full.length && full[i] !== ' ' ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : full[i];
      t.text = out;
      if (n >= full.length && st.alpha === 0) gsap.to(st, { alpha: 1, duration: 0.3 });
    }
    const w = Math.max(240, t.width + 80);
    strip.clear().rect(v.x + v.w / 2 - w / 2, cy - 40, w, sub ? 112 : 80).fill({ color: 0x0b0a0c, alpha: 0.86 });
    if (!ctx.reduceFlashes && Math.random() < 0.08) strip.rect(v.x + v.w / 2 - w / 2, cy - 40 + Math.random() * 70, w, 2 + Math.random() * 4).fill({ color: C.cyan, alpha: 0.5 });
    t.x = v.x + v.w / 2 + (!ctx.reduceFlashes && Math.random() < 0.1 ? (Math.random() - 0.5) * 10 : 0);
    void life;
  };
  Ticker.shared.add(tick);
  return () => {
    Ticker.shared.remove(tick);
    if (root.destroyed) return;
    gsap.to(root, { alpha: 0, duration: 0.3, onComplete: () => root.destroy({ children: true }) });
  };
}

/** a stage's fallback for fx ids it doesn't know. Returns undefined when nobody knows it */
export function screenFx(cmd: FxCmd, ctx: CineCtx): Stopper | undefined {
  const stop = make(cmd, ctx);
  // `hold`: it leaves by itself after that many seconds (or when the scene ends, whichever comes first)
  if (stop && cmd.hold && cmd.id !== 'point') {
    let done = false;
    const once = () => {
      if (done) return;
      done = true;
      stop();
    };
    const tm = setTimeout(once, Number(cmd.hold) * 1000);
    return () => {
      clearTimeout(tm);
      once();
    };
  }
  return stop;
}
function make(cmd: FxCmd, ctx: CineCtx): Stopper | undefined {
  switch (cmd.id) {
    case 'glitch':
      return glitch(cmd, ctx);
    case 'card':
      return card(cmd, ctx);
    case 'ink':
      return ink(cmd, ctx);
    case 'fade':
      return fade(cmd);
    case 'point':
      return point(cmd, ctx);
    case 'banner':
      return banner(cmd, ctx);
    case 'markNew': {
      // a HUD button gets its ¡NUEVO! tag (it stays until the player taps it: ui/hud/ActionBar)
      const b = grab(String(cmd.at ?? 'hud:catdex')) as (Container & { markNew?: () => void; newTag?: unknown }) | null;
      if (b && !b.newTag) b.markNew?.();
      return () => undefined;
    }
  }
  return undefined;
}
