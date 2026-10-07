/**
 * CATACLISMOS on screen (the rules live in cataclysm.ts; this only stages what the sim already resolved):
 *  - CataFx: the SEAL over their ship while it charges (cracks included) and the ghost marks on YOUR ship:
 *    meteor crosshairs, the moon's crush ring, the heat on every exposed cell, the black tide line.
 *  - preCata: the set piece before the blow lands (sky darkens, the sun comes down with heat haze, the black
 *    sea climbs the hull…). Meteors and the moon then fly as real projectiles (BattleScene.animateShot).
 *  - atCata: warning banner, seal cracks / cancel, the landing's big finish.
 *  - cataProjectile / cataTrail: the meteor rocks with fire trails and the moon itself.
 * Everything is drawn in code, animated "on twos" (12 fps steps) like the boss rigs, and few particles.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { txt, poster } from '../ui/widgets';
import { flash, onomatopoeia, speedLines } from '../fx/juice';
import { sfx } from '../core/audio';
import { settings } from '../core/settings';
import { Stepped } from './boss/rigs';
import { CELL } from './ship';
import { CATA_INFO, moonRadius, poderDe } from './cataclysm';
import type { CataId } from './cataclysm';
import type { Battle, BattleEvent } from './sim';
import type { UltCtx } from './ultFx';
import type { ShotDef } from './types';

const INK = 0x171317;
type CataEv = Extract<BattleEvent, { k: 'cata' }>;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ================================================================ seal + ghost marks (world space)
export class CataFx extends Stepped {
  private g = new Graphics();
  private sealLabel = txt('', { fontFamily: F.poster, fontSize: 24, fill: C.paper, stroke: { color: INK, width: 6 } });
  constructor(private sim: Battle) {
    super();
    this.sealLabel.anchor.set(0.5, 0);
    this.addChild(this.g, this.sealLabel);
  }
  protected override step() {
    const g = this.g;
    g.clear();
    const c = this.sim.cata;
    if (!c || !c.charging || this.sim.winner !== null) {
      this.sealLabel.visible = false;
      return;
    }
    const col = CATA_INFO[c.cfg.id].color;
    const t = this.t;
    // ---- the SEAL
    const { x, y, r } = c.seal;
    const pulse = 1 + 0.08 * Math.sin(t * 5);
    g.circle(x, y, r * 1.7 * pulse).fill({ color: col, alpha: 0.12 });
    g.circle(x, y, r * 1.25).fill({ color: INK, alpha: 0.35 });
    g.circle(x, y, r).stroke({ width: 9, color: INK }).circle(x, y, r).stroke({ width: 4, color: col });
    for (let i = 0; i < 8; i++) {
      const a = t * 0.9 + (i / 8) * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      g.rect(px - 5, py - 5, 10, 10).fill(i % 2 ? C.paper : col).stroke({ width: 2, color: INK });
    }
    g.star(x, y, 6, r * 0.72, r * 0.36, -t * 1.4).stroke({ width: 3, color: C.paper });
    g.circle(x, y, r * 0.2).fill(col).stroke({ width: 3, color: INK });
    if (c.cracks > 0) {
      g.moveTo(x - r * 0.9, y - r * 0.3).lineTo(x - r * 0.2, y + r * 0.1).lineTo(x + r * 0.1, y - r * 0.4).lineTo(x + r * 0.9, y + r * 0.2).stroke({ width: 7, color: INK }).stroke({ width: 3, color: 0xffffff });
    }
    this.sealLabel.visible = true;
    this.sealLabel.text = c.cracks > 0 ? 'SELLO 1/2 · ¡OTRO MÁS!' : 'SELLO: ¡TÍRALE A TRAVÉS!';
    this.sealLabel.position.set(x, y + r + 10);
    // ---- the ghost marks on the target ship
    const blink = 0.45 + 0.35 * Math.sin(t * 6);
    if (c.cfg.id === 'meteors') {
      for (const m of c.marks) {
        g.moveTo(m.x, 70).lineTo(m.x, m.y - 40).stroke({ width: 2, color: col, alpha: blink * 0.6 });
        g.circle(m.x, m.y, 24 * pulse).stroke({ width: 6, color: INK, alpha: 0.8 }).circle(m.x, m.y, 24 * pulse).stroke({ width: 3, color: col });
        g.moveTo(m.x - 34, m.y).lineTo(m.x + 34, m.y).moveTo(m.x, m.y - 34).lineTo(m.x, m.y + 34).stroke({ width: 3, color: col, alpha: 0.9 });
      }
    } else if (c.cfg.id === 'moon') {
      const m = c.marks[0];
      if (m) {
        const R = moonRadius(c.cells0);
        const n = 28;
        for (let i = 0; i < n; i += 2) {
          const a0 = (i / n) * Math.PI * 2 + t * 0.3;
          const a1 = ((i + 1) / n) * Math.PI * 2 + t * 0.3;
          g.moveTo(m.x + Math.cos(a0) * R, m.y + Math.sin(a0) * R).lineTo(m.x + Math.cos(a1) * R, m.y + Math.sin(a1) * R);
        }
        g.stroke({ width: 5, color: col, alpha: 0.85 });
        // the moon waiting high in the sky (ghost)
        const my = 150;
        g.circle(m.x, my, 70 * pulse).fill({ color: 0xdfe6ff, alpha: 0.22 }).stroke({ width: 3, color: 0xdfe6ff, alpha: 0.5 });
        g.circle(m.x - 22, my - 12, 13).fill({ color: 0x8a95b8, alpha: 0.25 }).circle(m.x + 20, my + 18, 9).fill({ color: 0x8a95b8, alpha: 0.25 });
        g.moveTo(m.x, my + 75).lineTo(m.x, m.y - R - 10).stroke({ width: 3, color: col, alpha: blink * 0.5 });
      }
    } else if (c.cfg.id === 'sun') {
      c.marks.forEach((m, i) => {
        if (i % 2) return;
        const ph = t * 4 + i;
        g.moveTo(m.x - 8, m.y + 6);
        for (let k = 1; k <= 4; k++) g.lineTo(m.x - 8 + Math.sin(ph + k) * 6, m.y + 6 - k * 9);
        g.stroke({ width: 4, color: col, alpha: 0.35 + blink });
      });
      // the sun waiting high in the sky (ghost)
      const sx = this.sim.shipCenter(1 - c.cfg.side).x;
      g.circle(sx, 130, 62 * pulse).fill({ color: 0xffd400, alpha: 0.2 });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.5;
        g.moveTo(sx + Math.cos(a) * 72, 130 + Math.sin(a) * 72).lineTo(sx + Math.cos(a) * 100, 130 + Math.sin(a) * 100);
      }
      g.stroke({ width: 4, color: 0xffd400, alpha: 0.35 });
    } else if (c.cfg.id === 'tide' && c.marks.length >= 2) {
      const [a, b] = c.marks;
      const ty = this.sim.waterY - CELL * 1.3;
      g.rect(a.x - 20, ty, b.x - a.x + 40, this.sim.waterY + 10 - ty).fill({ color: 0x3a1a4a, alpha: 0.2 + 0.2 * blink });
      for (const [w, cc] of [
        [10, INK],
        [5, 0xc77dff],
      ] as const) {
        g.moveTo(a.x - 20, ty);
        for (let xx = a.x - 20; xx <= b.x + 20; xx += 16) g.lineTo(xx, ty + Math.sin(xx / 30 + t * 4) * 6);
        g.stroke({ width: w, color: cc, alpha: 0.95 });
      }
      for (let xx = a.x + 40; xx <= b.x; xx += 110) g.poly([xx - 13, ty - 14, xx, ty - 32, xx + 13, ty - 14]).fill({ color: 0xc77dff, alpha: blink }).stroke({ width: 3, color: INK, alpha: blink });
    }
  }
}

// ================================================================ projectiles + trails
/** the look of a cataclysm projectile (null = not one) */
export function cataProjectile(shot: ShotDef, core: Graphics): number | null {
  if (shot.id === 'cata_meteor') {
    core.circle(0, 0, 22).fill({ color: 0xff6a1a, alpha: 0.35 });
    core.poly([-14, -9, -3, -16, 11, -12, 17, 0, 10, 13, -6, 15, -16, 4]).fill(0x5a4636).stroke({ width: 4, color: INK, join: 'round' });
    core.circle(4, -3, 5).fill(0xffb02e).circle(-6, 5, 3).fill(0xffd400);
    return 0.9;
  }
  if (shot.id === 'cata_moon') {
    const R = Math.max(70, shot.radius * 0.9);
    core.circle(0, 0, R * 1.18).fill({ color: 0xdfe6ff, alpha: 0.18 });
    core.circle(0, 0, R).fill(0xe9edf7).stroke({ width: 10, color: INK });
    core.circle(-R * 0.32, -R * 0.2, R * 0.2).fill(0xc2c9dc).stroke({ width: 4, color: 0x8a95b8 });
    core.circle(R * 0.3, R * 0.28, R * 0.14).fill(0xc2c9dc).stroke({ width: 4, color: 0x8a95b8 });
    core.circle(R * 0.36, -R * 0.36, R * 0.09).fill(0xc2c9dc);
    core.circle(-R * 0.1, R * 0.45, R * 0.07).fill(0xc2c9dc);
    // the night side
    core.arc(0, 0, R - 6, Math.PI * 0.15, Math.PI * 1.05).stroke({ width: R * 0.18, color: 0x8a95b8, alpha: 0.35 });
    return 2.2;
  }
  return null;
}

/** trails of the cataclysm projectiles (true when it drew) */
export function cataTrail(trail: Graphics, shot: ShotDef, hist: { x: number; y: number }[][], done: boolean[], frame: number): boolean {
  if (shot.id === 'cata_meteor') {
    hist.forEach((hs, pi) => {
      if (done[pi] || hs.length < 2) return;
      const n = hs.length;
      for (let k = 1; k < n; k++) {
        const f = k / n;
        trail.moveTo(hs[k - 1].x, hs[k - 1].y).lineTo(hs[k].x, hs[k].y).stroke({ width: 4 + f * 18, color: k > n - 4 ? 0xfff2c0 : k > n / 2 ? 0xffb02e : 0xff6a1a, alpha: 0.25 + f * 0.7, cap: 'round' });
      }
      const h = hs[n - 1];
      if (frame % 2) trail.circle(h.x + (frame % 3) * 4 - 4, h.y - 16, 4).fill(0xffd400);
    });
    return true;
  }
  if (shot.id === 'cata_moon') {
    hist.forEach((hs, pi) => {
      if (done[pi] || !hs.length) return;
      const h = hs[hs.length - 1];
      const R = Math.max(70, shot.radius * 0.9);
      // moonlight pressing down on the ship below
      trail.poly([h.x - R * 0.7, h.y + R * 0.6, h.x + R * 0.7, h.y + R * 0.6, h.x + R * 1.6, h.y + R * 4, h.x - R * 1.6, h.y + R * 4]).fill({ color: 0xdfe6ff, alpha: 0.12 + 0.04 * (frame % 2) });
      for (let k = 0; k < 6; k++) trail.circle(h.x + Math.sin(frame * 0.7 + k * 2) * R * 1.1, h.y - R - 10 - k * 18, 4).fill({ color: 0xdfe6ff, alpha: 0.5 });
    });
    return true;
  }
  return false;
}

// ================================================================ banners
function cataBanner(ctx: UltCtx, id: CataId, by: string, head: string, sub: string, hold = 1.6) {
  const info = CATA_INFO[id];
  const c = new Container();
  const band = new Graphics().rect(-300, -92, 2520, 184).fill(INK);
  band.rect(-300, -92, 2520, 10).fill(info.color).rect(-300, 82, 2520, 10).fill(info.color);
  band.rotation = -0.035;
  const t = poster(head, 96, info.color, { stroke: { color: INK, width: 12 } });
  t.anchor.set(0.5);
  t.rotation = -0.035;
  t.y = -14;
  if (t.width > 1700) t.scale.set(1700 / t.width);
  const s = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: C.paper });
  s.anchor.set(0.5);
  s.rotation = -0.035;
  s.y = 60;
  if (s.width > 1600) s.scale.set(1600 / s.width);
  // "it's the zone's / boss's power", never a cat
  const tag = new Container();
  const tt = poster(poderDe(by), 28, INK);
  tt.anchor.set(0.5);
  const tb = new Graphics().rect(-tt.width / 2 - 16, -tt.height / 2 - 4, tt.width + 32, tt.height + 8).fill(info.color).stroke({ width: 5, color: INK });
  tag.addChild(tb, tt);
  tag.position.set(0, -104);
  tag.rotation = -0.05;
  c.addChild(band, t, s, tag);
  c.position.set(960, 290);
  ctx.overlay.addChild(c);
  gsap.from(band.scale, { x: 0, duration: 0.22, ease: 'power3.out' });
  gsap.from(t.scale, { x: 2.4, y: 2.4, duration: 0.26, ease: 'back.out(2)' });
  gsap.from(tag, { y: tag.y - 60, alpha: 0, duration: 0.25, delay: 0.1 });
  gsap.to(c, { alpha: 0, delay: hold, duration: 0.35, onComplete: () => c.destroy({ children: true }) });
}

function veil(ctx: UltCtx, color: number, alpha: number, dur = 0.35) {
  const g = new Graphics().rect(-400, -300, 2720, 1680).fill(color);
  g.alpha = 0;
  ctx.overlay.addChildAt(g, 0);
  gsap.to(g, { alpha, duration: dur });
  return g;
}
function lift(g: Graphics, delay = 0.2) {
  gsap.to(g, { alpha: 0, delay, duration: 0.5, onComplete: () => g.destroy() });
}

// ================================================================ the set piece before it lands
let pendingVeil: Graphics | null = null;
let pendingSun: Container | null = null;
let pendingTide: { g: Graphics; stop: () => void } | null = null;

const FALL_SUB: Record<CataId, string> = {
  meteors: 'ENTRE MÁS GRANDE TU BARCO, MÁS PIEDRAS LE CAEN',
  moon: 'APLASTA LO MÁS ALTO DE TU BARCO · SUBE LA MAREA',
  sun: 'CUECE TODO LO EXPUESTO · RECALIENTA TUS CAÑONES',
  tide: 'PUDRE TU LÍNEA DE FLOTACIÓN · TE INUNDA',
};

/** stage the fall (awaited before the cataclysm's projectiles fly / its events apply) */
export async function preCata(ctx: UltCtx, e: CataEv, by: string, mul: number) {
  const fast = settings.reduceMotion;
  const info = CATA_INFO[e.id];
  const sim = ctx.sim;
  cataBanner(ctx, e.id, by, info.shout, mul < 1 ? `EL SELLO AGRIETADO LO DEBILITA: x${mul}` : FALL_SUB[e.id], 1.05);
  sfx('alarm', 0.9);
  if (e.id === 'meteors') {
    pendingVeil = veil(ctx, 0x14081f, 0.42);
    sfx('whoosh', 0.7);
    // far meteors streak across the high sky first (decoration only)
    const n = fast ? 4 : 10;
    for (let i = 0; i < n; i++) {
      const g = new Graphics();
      const len = 120 + Math.random() * 120;
      g.moveTo(0, 0).lineTo(-len, -len * 0.45).stroke({ width: 10, color: 0xff6a1a, alpha: 0.35, cap: 'round' });
      g.moveTo(0, 0).lineTo(-len * 0.6, -len * 0.27).stroke({ width: 5, color: 0xfff2c0, cap: 'round' });
      g.circle(0, 0, 6).fill(0xffffff);
      g.position.set(200 + Math.random() * 900, -60 - Math.random() * 120);
      ctx.wfx.addChild(g);
      gsap.to(g, { x: g.x + 900, y: g.y + 420, duration: 0.55 + Math.random() * 0.25, delay: i * 0.06, ease: 'none', onComplete: () => g.destroy() });
    }
    await wait(fast ? 250 : 750);
    return;
  }
  if (e.id === 'moon') {
    pendingVeil = veil(ctx, 0x070b1e, 0.55, 0.5);
    sfx('charge', 0.4);
    ctx.shaker.add(0.3);
    // the stars come out
    const stars = new Graphics();
    for (let i = 0; i < 40; i++) stars.star(Math.random() * 1920, Math.random() * 420, 4, 3 + Math.random() * 4, 1.5, 0).fill(0xffffff);
    ctx.overlay.addChildAt(stars, 1);
    stars.alpha = 0;
    gsap.to(stars, { alpha: 0.8, duration: 0.4, onComplete: () => gsap.to(stars, { alpha: 0, delay: 1.6, duration: 0.6, onComplete: () => stars.destroy() }) });
    ctx.flt(e.x, Math.max(120, e.y - 260), '¡LA LUNA SE VIENE ENCIMA!', { color: 0xdfe6ff, size: 46, font: F.poster, dur: 1.6 });
    await wait(fast ? 250 : 800);
    return;
  }
  if (e.id === 'sun') {
    pendingVeil = veil(ctx, 0xff6a1a, 0.28, 0.4);
    const tgt = sim.sides[e.side];
    const box = { x0: tgt.setup.origin.x, x1: tgt.setup.origin.x + tgt.ship.cols * CELL, y0: tgt.setup.origin.y, y1: sim.waterY };
    const sun = new Container();
    const rays = new Graphics();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      rays.poly([Math.cos(a - 0.07) * 130, Math.sin(a - 0.07) * 130, Math.cos(a) * 230, Math.sin(a) * 230, Math.cos(a + 0.07) * 130, Math.sin(a + 0.07) * 130]).fill(i % 2 ? 0xff6a1a : 0xffd400);
    }
    const disc = new Graphics().circle(0, 0, 150).fill(0xffd400).stroke({ width: 10, color: INK }).circle(0, 0, 105).fill(0xfff2c0).circle(0, 0, 60).fill(0xffffff);
    sun.addChild(rays, disc);
    sun.position.set((box.x0 + box.x1) / 2, -280);
    ctx.wfx.addChild(sun);
    pendingSun = sun;
    gsap.to(rays, { rotation: Math.PI, duration: 5, ease: 'none' });
    sfx('charge', 0.5);
    gsap.to(sun, { y: Math.max(40, box.y0 - 250), duration: fast ? 0.25 : 1, ease: 'power2.out' });
    // heat haze over the target: wavy columns rising (one Graphics, redrawn per tick, ~1.6 s)
    const haze = new Graphics();
    ctx.wfx.addChild(haze);
    let k = 0;
    const tick = () => {
      k += Ticker.shared.deltaMS / 1000;
      if (haze.destroyed) return;
      haze.clear();
      const cols = 14;
      for (let i = 0; i < cols; i++) {
        const x = box.x0 + ((i + 0.5) / cols) * (box.x1 - box.x0);
        haze.moveTo(x, box.y1);
        for (let yy = box.y1; yy > box.y0 - 140; yy -= 18) haze.lineTo(x + Math.sin(yy / 22 + k * 7 + i) * 7, yy);
        haze.stroke({ width: 3, color: 0xfff2c0, alpha: 0.28 * Math.min(1, k * 2) });
      }
    };
    Ticker.shared.add(tick);
    window.setTimeout(() => {
      Ticker.shared.remove(tick);
      gsap.to(haze, { alpha: 0, duration: 0.4, onComplete: () => haze.destroy() });
    }, fast ? 900 : 2300);
    for (let i = 0; i < (fast ? 2 : 5); i++)
      window.setTimeout(() => !ctx.fxp.destroyed && ctx.fxp.burst(box.x0 + Math.random() * (box.x1 - box.x0), box.y0 + Math.random() * 120, { count: 10, tint: [0xff6a1a, 0xffd400, 0xfff2c0], speed: [40, 160], gravity: -260, life: [0.5, 1] }), 500 + i * 160);
    await wait(fast ? 300 : 1100);
    return;
  }
  // tide: the black sea climbs the hull
  pendingVeil = veil(ctx, 0x1a0b24, 0.38);
  const tgt = sim.sides[e.side];
  const x0 = tgt.setup.origin.x - 60;
  const x1 = tgt.setup.origin.x + tgt.ship.cols * CELL + 60;
  const crest = sim.waterY - CELL * 2.2;
  const g = new Graphics();
  ctx.wfx.addChild(g);
  let k = 0;
  let level = 0;
  const draw = () => {
    k += Ticker.shared.deltaMS / 1000;
    if (g.destroyed) return;
    g.clear();
    const top = sim.waterY + 40 - level * (sim.waterY + 40 - crest);
    g.moveTo(x0, sim.waterY + 90);
    for (let x = x0; x <= x1; x += 14) g.lineTo(x, top + Math.sin(x / 26 + k * 5) * 9 + Math.sin(x / 9 + k * 9) * 3);
    g.lineTo(x1, sim.waterY + 90).closePath().fill({ color: 0x120818, alpha: 0.85 }).stroke({ width: 6, color: 0xc77dff, alpha: 0.8 });
    for (let x = x0 + 20; x <= x1; x += 60) g.moveTo(x, top + 14 + Math.sin(x / 26 + k * 5) * 9).lineTo(x + 26, top + 16 + Math.sin(x / 26 + k * 5) * 9).stroke({ width: 4, color: 0xe2b8ff, alpha: 0.7 });
    // oily bubbles popping on the surface
    for (let i = 0; i < 8; i++) {
      const bx = x0 + ((i * 137 + Math.floor(k * 3) * 53) % Math.max(1, x1 - x0));
      g.circle(bx, top + 30 + (i % 3) * 18, 6 + (i % 2) * 4).stroke({ width: 3, color: 0xc77dff, alpha: 0.6 });
    }
  };
  const lv = { v: 0 };
  Ticker.shared.add(draw);
  sfx('splash', 0.6);
  gsap.to(lv, { v: 1, duration: fast ? 0.25 : 0.9, ease: 'power2.out', onUpdate: () => (level = lv.v) });
  pendingTide = {
    g,
    stop: () => {
      gsap.to(lv, { v: 0, duration: 0.7, ease: 'power2.in', onUpdate: () => (level = lv.v), onComplete: () => { Ticker.shared.remove(draw); g.destroy(); } });
    },
  };
  await wait(fast ? 300 : 950);
}

/** after the blow: the sky clears, the sun goes back up, the black sea recedes */
export function postCata() {
  if (pendingVeil) lift(pendingVeil, 0.1);
  pendingVeil = null;
  const sun = pendingSun;
  pendingSun = null;
  if (sun && !sun.destroyed) gsap.to(sun, { y: -320, alpha: 0, duration: 0.8, delay: 0.3, ease: 'power2.in', onComplete: () => sun.destroy({ children: true }) });
  pendingTide?.stop();
  pendingTide = null;
}

// ================================================================ events during the fight
export function atCata(ctx: UltCtx, e: CataEv, by: string) {
  const info = CATA_INFO[e.id];
  const sim = ctx.sim;
  switch (e.what) {
    case 'tell': {
      cataBanner(ctx, e.id, by, `¡${info.name}!`, 'CAE EN SU PRÓXIMO TURNO · PASA UN TIRO DE GATO POR EL SELLO PARA DEBILITARLO', 1.5);
      sfx('alarm');
      sfx('charge', 0.7);
      const s = sim.cata?.seal;
      if (s) {
        ctx.fxp.burst(s.x, s.y, { count: 24, tint: [info.color, C.paper, INK], speed: [80, 300], life: [0.3, 0.7], gravity: 0 });
        ctx.flt(s.x, s.y - 90, '¡UN SELLO!', { color: info.color, size: 36, font: F.poster, dur: 1.6 });
      }
      ctx.sync?.();
      break;
    }
    case 'crack': {
      sfx('crit');
      sfx('glitch', 1.2);
      ctx.shaker.add(0.25);
      ctx.fxp.burst(e.x, e.y, { count: 26, tint: [info.color, 0xffffff, INK], speed: [150, 520], life: [0.25, 0.6], stepped: true });
      onomatopoeia(ctx.wfx, e.x, e.y - 70, '¡KRSSH!', { color: info.color, size: 80 });
      ctx.flt(e.x, e.y - 150, '¡SELLO AGRIETADO! x0.5', { color: C.yellow, size: 40, font: F.poster, dur: 1.5 });
      break;
    }
    case 'stop': {
      sfx('bigboom');
      sfx('reveal');
      ctx.shaker.add(0.5);
      if (!settings.reduceFlashes) flash(ctx.overlay, info.color, 0.4, 0.2);
      for (let i = 0; i < 3; i++) window.setTimeout(() => !ctx.fxp.destroyed && ctx.fxp.burst(e.x, e.y, { count: 22, tint: [info.color, 0xffffff, C.yellow], speed: [200, 700], life: [0.3, 0.8], stepped: true }), i * 90);
      onomatopoeia(ctx.wfx, e.x, e.y - 80, '¡CRASH!', { color: C.yellow, size: 110 });
      ctx.flt(960, 300, `¡${info.name}: CANCELADO!`, { color: C.yellow, size: 60, font: F.poster, dur: 1.8 });
      break;
    }
    case 'land': {
      const t = sim.sides[e.side];
      const cx = t.setup.origin.x + (t.ship.cols * CELL) / 2;
      if (e.id === 'moon') {
        // the shockwave rolls out from the crush, the tide comes up
        const m = { x: e.x, y: e.y };
        for (let i = 0; i < 3; i++) {
          const r = new Graphics().ellipse(0, 0, 80, 26).stroke({ width: 14 - i * 3, color: i === 1 ? 0xdfe6ff : INK });
          r.position.set(cx, sim.waterY - 10);
          ctx.wfx.addChild(r);
          gsap.fromTo(r.scale, { x: 0.3, y: 0.3 }, { x: 6 + i * 2, y: 2 + i, duration: 0.8 + i * 0.15, ease: 'power3.out' });
          gsap.to(r, { alpha: 0, duration: 0.9 + i * 0.15, onComplete: () => r.destroy() });
        }
        ctx.fxp.burst(cx, sim.waterY, { count: 40, tint: [C.paper, 0x7fd8ff, 0xdfe6ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [300, 900] });
        onomatopoeia(ctx.wfx, m.x, Math.max(140, t.setup.origin.y - 120), '¡KRA-THOOOM!', { color: 0xdfe6ff, size: 130, dur: 1.3 });
        ctx.flt(960, 250, 'MAREA ALTA · TODO PESA MENOS 2 RONDAS', { color: 0x7fd8ff, size: 38, font: F.poster, dur: 1.8 });
        sfx('splash');
        if (!settings.reduceFlashes) flash(ctx.overlay, 0xdfe6ff, 0.6, 0.35);
        ctx.shaker.add(1.1);
      } else if (e.id === 'meteors') {
        onomatopoeia(ctx.wfx, cx, Math.max(140, t.setup.origin.y - 100), '¡KA-BOOOOM!', { color: 0xff8a2e, size: 120, dur: 1.2 });
        ctx.shaker.add(0.6);
      } else if (e.id === 'sun') {
        if (!settings.reduceFlashes) flash(ctx.overlay, 0xfff2c0, 0.7, 0.4);
        onomatopoeia(ctx.wfx, cx, Math.max(140, t.setup.origin.y - 100), '¡CHHHHHHH!', { color: 0xffd400, size: 130, dur: 1.3 });
        speedLines(ctx.wfx, cx, t.setup.origin.y + 80, 0xffb02e, 36, 0.6);
        sfx('bigboom', 0.7);
        ctx.shaker.add(0.8);
      } else {
        onomatopoeia(ctx.wfx, cx, sim.waterY - 160, '¡GLORG!', { color: 0xc77dff, size: 130, dur: 1.3 });
        ctx.flt(cx, sim.waterY - 260, 'LÍNEA DE FLOTACIÓN MALDITA x1.5', { color: 0xd8a8ee, size: 34, font: F.poster, dur: 1.8 });
        sfx('splash', 0.5);
        ctx.shaker.add(0.6);
      }
      if ((e.n ?? 100) < 100) ctx.flt(960, 330, `EL SELLO ROTO LO DEBILITÓ: x${(e.n ?? 100) / 100}`, { color: C.yellow, size: 34, font: F.poster, dur: 1.6 });
      break;
    }
  }
}

/** the opening card of a fight with a cataclysm and no intro card (normal zone stages) */
export async function cataCard(ctx: UltCtx, id: CataId, by: string, every: number) {
  const info = CATA_INFO[id];
  const c = new Container();
  const head = poster(`${poderDe(by)}: ${info.name}`, 44, INK);
  const body = txt(`Cada ${every} turnos cae sobre TU barco (no es un gato). ${info.rule}\n${info.counter}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 23, fill: C.paper, wordWrap: true, wordWrapWidth: 1040, lineHeight: 30 });
  const w = Math.max(head.width, body.width) + 60;
  const bg = new Graphics().rect(10, 10, w, 92 + body.height).fill(INK).rect(0, 0, w, 64).fill(info.color).stroke({ width: 5, color: INK }).rect(0, 64, w, 28 + body.height).fill(INK);
  head.position.set(30, 6);
  body.position.set(30, 78);
  c.addChild(bg, head, body);
  c.position.set(960 - w / 2, 330);
  ctx.overlay.addChild(c);
  sfx('sting');
  gsap.from(c, { y: c.y + 60, alpha: 0, duration: 0.3, ease: 'back.out(2)' });
  // a tap anywhere skips it
  let skip = false;
  c.eventMode = 'static';
  c.hitArea = { contains: () => true };
  c.once('pointertap', () => (skip = true));
  const t0 = performance.now();
  while (!skip && performance.now() - t0 < (settings.reduceMotion ? 1400 : 2400)) await wait(80);
  gsap.to(c, { alpha: 0, duration: 0.3, onComplete: () => c.destroy({ children: true }) });
}
