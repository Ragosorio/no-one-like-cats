/**
 * After the Parte III · the 60 post MULTIDIMENSIONAL powers on screen (battle/multidimPost — agent PODERES-2, 2026-10-28).
 * The sim already resolved everything; this only stages the `ultfx` events those powers emit:
 *
 *   mdpPre   (after multidimFx's stamp banner, before anything flies) each cat's own set piece: the rubber fist, the
 *            shadow clones, the stopped clock, the serious paw, the meteors, the notebook, the cards, the lance…
 *            The duos bring their partner: Daft Miau's gold helmet, Party Michi's afro hype-man.
 *   mdpAt    ('mdp…' events, at impact time) the beats inside each power: a bounce off rubber, a clone popping, a shot
 *            frozen in the air (it stays until time comes back), a goal, a vote, a laser, the bill of the decree…
 *
 * Everything is drawn here with the battle's primitives (Graphics, particles, onomatopoeia, flashes): no raster.
 * Reducir movimiento / Reducir destellos are honored (settings.reduceMotion / reduceFlashes). Never imports the sim
 * side of the post powers at runtime (only data and multidimFx's helpers, inside functions): no import cycle.
 */
import { ColorMatrixFilter, Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { poster } from '../../ui/widgets';
import { flash, onomatopoeia, speedLines, sparkles } from '../../fx/juice';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import type { BattleEvent } from '../sim';
import type { UltCtx } from '../ultFx';
import { bat, caster, fleeting, mdColor, veil, word } from './multidimFx';

type UltEv = Extract<BattleEvent, { k: 'ultfx' }>;
const INK = 0x171317;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const later = (ctx: UltCtx, ms: number, fn: () => void) =>
  window.setTimeout(() => {
    if (!ctx.wfx.destroyed) fn();
  }, ms);

// ------------------------------------------------------------------ little drawings (all vector)
/** a cat head silhouette (ears + round face + eyes) — clones, the copy from the past, the twins, the partners */
function catHead(r: number, fill: number, eyes = 0xffffff) {
  const g = new Graphics();
  g.poly([-r * 0.9, -r * 0.35, -r * 0.75, -r * 1.25, -r * 0.2, -r * 0.8]).fill(fill).stroke({ width: 4, color: INK });
  g.poly([r * 0.9, -r * 0.35, r * 0.75, -r * 1.25, r * 0.2, -r * 0.8]).fill(fill).stroke({ width: 4, color: INK });
  g.circle(0, 0, r).fill(fill).stroke({ width: 5, color: INK });
  g.ellipse(-r * 0.35, -r * 0.1, r * 0.14, r * 0.2).fill(eyes);
  g.ellipse(r * 0.35, -r * 0.1, r * 0.14, r * 0.2).fill(eyes);
  return g;
}
function ringG(r: number, color: number, w = 10) {
  return new Graphics().circle(0, 0, r).stroke({ width: w + 6, color: INK }).circle(0, 0, r).stroke({ width: w, color });
}
function boltG(len: number, color: number) {
  const g = new Graphics();
  const pts = [0, 0, len * 0.18, len * 0.3, -len * 0.05, len * 0.42, len * 0.12, len * 0.7, -len * 0.1, len * 0.62, 0, len];
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.stroke({ width: 16, color: INK, join: 'miter' });
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.stroke({ width: 8, color, join: 'miter' });
  return g;
}
function heartG(r: number, color: number) {
  return new Graphics()
    .moveTo(0, r * 0.9)
    .bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.7, -r * 1.3, 0, -r * 0.45)
    .bezierCurveTo(r * 0.7, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9)
    .fill(color)
    .stroke({ width: 5, color: INK });
}
function pawG(r: number, color: number) {
  const g = new Graphics();
  g.ellipse(0, r * 0.35, r * 0.55, r * 0.45).fill(color).stroke({ width: 3, color: INK });
  for (const [dx, dy] of [
    [-0.55, -0.25],
    [-0.2, -0.6],
    [0.2, -0.6],
    [0.55, -0.25],
  ])
    g.circle(dx * r, dy * r, r * 0.2).fill(color).stroke({ width: 3, color: INK });
  return g;
}
function fistG(r: number, color: number) {
  const g = new Graphics();
  g.roundRect(-r, -r * 0.8, r * 2, r * 1.6, r * 0.5).fill(color).stroke({ width: 5, color: INK });
  for (let i = 0; i < 3; i++) g.moveTo(-r * 0.4 + i * r * 0.45, -r * 0.8).lineTo(-r * 0.4 + i * r * 0.45, -r * 0.1).stroke({ width: 3, color: INK });
  return g;
}
function clockG(r: number, face = 0xf2e6a6) {
  const g = new Graphics().circle(0, 0, r).fill(face).stroke({ width: 6, color: INK });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8).lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
  }
  g.stroke({ width: 3, color: INK });
  g.moveTo(0, 0).lineTo(0, -r * 0.7).moveTo(0, 0).lineTo(r * 0.45, r * 0.1).stroke({ width: 5, color: INK });
  return g;
}
function ballG(r: number) {
  const g = new Graphics().circle(0, 0, r).fill(0xffffff).stroke({ width: 4, color: INK });
  g.star(0, 0, 5, r * 0.36, r * 0.24).fill(INK);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    g.circle(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, r * 0.18).fill(INK);
  }
  return g;
}
function cardG(w: number, color: number, label: string) {
  const c = new Container();
  const g = new Graphics().roundRect(-w / 2, -w * 0.7, w, w * 1.4, 8).fill(color).stroke({ width: 5, color: INK });
  g.roundRect(-w / 2 + 8, -w * 0.7 + 8, w - 16, w * 1.4 - 16, 6).stroke({ width: 3, color: 0xe6c34a });
  const t = poster(label, w * 0.42, 0xe6c34a, { stroke: { color: INK, width: 5 } });
  t.anchor.set(0.5);
  c.addChild(g, t);
  return c;
}
function barrelG(r: number) {
  const g = new Graphics().roundRect(-r, -r * 1.2, r * 2, r * 2.4, r * 0.5).fill(0x8b5a2b).stroke({ width: 6, color: INK });
  for (const y of [-0.6, 0.6]) g.rect(-r, y * r - 5, r * 2, 10).fill(0x3b2a1a);
  return g;
}
function hourglassG(r: number) {
  const g = new Graphics();
  g.rect(-r, -r * 1.3, r * 2, r * 0.2).fill(0x7a2e2e).stroke({ width: 4, color: INK });
  g.rect(-r, r * 1.1, r * 2, r * 0.2).fill(0x7a2e2e).stroke({ width: 4, color: INK });
  g.poly([-r * 0.8, -r * 1.1, r * 0.8, -r * 1.1, r * 0.1, 0, r * 0.8, r * 1.1, -r * 0.8, r * 1.1, -r * 0.1, 0]).fill({ color: 0xbfe3ff, alpha: 0.7 }).stroke({ width: 4, color: INK });
  g.poly([-r * 0.5, r * 1.05, r * 0.5, r * 1.05, 0, r * 0.4]).fill(0xe6c34a);
  return g;
}
function flaskG(r: number, liquid: number) {
  const g = new Graphics();
  g.poly([-r * 0.25, -r * 1.2, r * 0.25, -r * 1.2, r * 0.25, -r * 0.3, r, r * 0.8, -r, r * 0.8, -r * 0.25, -r * 0.3]).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ width: 5, color: INK });
  g.poly([-r * 0.62, r * 0.3, r * 0.62, r * 0.3, r * 0.92, r * 0.72, -r * 0.92, r * 0.72]).fill(liquid);
  return g;
}
function pyramidG(w: number, color: number) {
  const g = new Graphics().poly([0, -w * 0.8, w * 0.7, w * 0.3, -w * 0.7, w * 0.3]).fill({ color, alpha: 0.85 }).stroke({ width: 6, color: INK });
  for (let i = 1; i < 4; i++) g.moveTo(-w * 0.7 * (i / 4), -w * 0.8 + w * 1.1 * (i / 4)).lineTo(w * 0.7 * (i / 4), -w * 0.8 + w * 1.1 * (i / 4));
  g.stroke({ width: 3, color: 0xffffff, alpha: 0.7 });
  return g;
}
/** a robot/DJ helmet (Daft Miau and his partner) */
function helmetG(r: number, color: number, visor: number) {
  const g = new Graphics().roundRect(-r, -r * 1.1, r * 2, r * 2.1, r * 0.8).fill(color).stroke({ width: 5, color: INK });
  g.roundRect(-r * 0.75, -r * 0.35, r * 1.5, r * 0.55, r * 0.2).fill(visor).stroke({ width: 3, color: INK });
  g.poly([-r * 0.9, -r * 0.9, -r * 0.7, -r * 1.6, -r * 0.3, -r * 1.0]).fill(color).stroke({ width: 4, color: INK });
  g.poly([r * 0.9, -r * 0.9, r * 0.7, -r * 1.6, r * 0.3, -r * 1.0]).fill(color).stroke({ width: 4, color: INK });
  return g;
}
function snowG(r: number) {
  const g = new Graphics();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.moveTo(0, 0).lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.stroke({ width: 7, color: INK }).stroke({ width: 3, color: 0xe6fbff });
  return g;
}
function shieldG(r: number) {
  const g = new Graphics();
  g.circle(0, 0, r).fill(0xd62839).stroke({ width: 5, color: INK });
  g.circle(0, 0, r * 0.75).fill(0xffffff);
  g.circle(0, 0, r * 0.52).fill(0xd62839);
  g.circle(0, 0, r * 0.32).fill(0x2f4b8a);
  g.star(0, 0, 5, r * 0.28, r * 0.12).fill(0xffffff);
  return g;
}
function bananaG(r: number) {
  return new Graphics()
    .moveTo(-r, -r * 0.2)
    .quadraticCurveTo(0, r * 1.1, r, -r * 0.4)
    .quadraticCurveTo(0, r * 0.4, -r, -r * 0.2)
    .fill(0xffe14d)
    .stroke({ width: 4, color: INK });
}
function cakeG(r: number) {
  const g = new Graphics();
  g.rect(-r, -r * 0.2, r * 2, r * 0.9).fill(0xf7c6d9).stroke({ width: 4, color: INK });
  g.rect(-r * 0.7, -r * 0.8, r * 1.4, r * 0.6).fill(0xbfe3d0).stroke({ width: 4, color: INK });
  g.circle(0, -r * 0.95, r * 0.15).fill(0xc8102e);
  return g;
}
function piranhaG(r: number) {
  const g = new Graphics().ellipse(0, 0, r, r * 0.65).fill(0x5b3a7a).stroke({ width: 4, color: INK });
  g.poly([r * 0.8, 0, r * 1.4, -r * 0.5, r * 1.4, r * 0.5]).fill(0x5b3a7a).stroke({ width: 4, color: INK });
  g.circle(-r * 0.4, -r * 0.15, r * 0.12).fill(0xffffff);
  for (let i = 0; i < 4; i++) g.poly([-r * 0.95 + i * 0.18 * r, r * 0.15, -r * 0.86 + i * 0.18 * r, r * 0.35, -r * 0.77 + i * 0.18 * r, r * 0.15]).fill(0xffffff);
  return g;
}
function spark(ctx: UltCtx, x: number, y: number, tint: number[], n = 18, gravity = 300) {
  ctx.fxp.burst(x, y, { count: n, tint, speed: [100, 360], gravity, life: [0.3, 0.8] });
}
/** drop a drawing from the sky onto (x, y) */
function drop(ctx: UltCtx, node: Container, x: number, y: number, hold = 1, dur = 0.45) {
  fleeting(ctx, node, hold);
  node.position.set(x, -200);
  gsap.to(node, { y, duration: settings.reduceMotion ? 0.05 : dur, ease: 'power2.in' });
  return node;
}
function popAt(ctx: UltCtx, node: Container, x: number, y: number, hold = 1) {
  fleeting(ctx, node, hold);
  node.position.set(x, y);
  gsap.from(node.scale, { x: 0, y: 0, duration: settings.reduceMotion ? 0.05 : 0.25, ease: 'back.out(2)' });
  return node;
}
function bang(ctx: UltCtx, x: number, y: number, text: string, color: number, size = 80) {
  const c = onomatopoeia(ctx.wfx, x, y, text, { color, size });
  // a long line over a ship near the edge stays whole on screen (the 1920-wide stage; it pops to ×1.15)
  const half = (c.getLocalBounds().width * 1.15) / 2 + 24;
  if (half * 2 < 1920) c.x = Math.max(half, Math.min(1920 - half, x));
}

// ------------------------------------------------------------------ persistent marks
/** Gatojo: every shot hanging in the stopped time (cleared on mdpResume) */
const PAUSED: Container[] = [];
/** Kagebunyan: the shadow clones over your cabins (cleared on mdpPoof nearby, or fading on their own) */
const CLONES: { node: Container; x: number; y: number }[] = [];
function prune() {
  for (let i = PAUSED.length - 1; i >= 0; i--) if (PAUSED[i].destroyed) PAUSED.splice(i, 1);
  for (let i = CLONES.length - 1; i >= 0; i--) if (CLONES[i].node.destroyed) CLONES.splice(i, 1);
}
function kill(node: Container) {
  if (node.destroyed) return;
  gsap.killTweensOf(node);
  gsap.killTweensOf(node.scale);
  node.destroy({ children: true });
}

// ------------------------------------------------------------------ before the projectiles fly
/** each post cat's own set piece (multidimFx.mdPre already drew the stamp banner); a drawing never stalls the shot */
export async function mdpPre(ctx: UltCtx, e: UltEv) {
  try {
    await pre(ctx, e);
  } catch {
    // the stamp already read: the shot flies on
  }
}
async function pre(ctx: UltCtx, e: UltEv) {
  const id = e.uid ?? '';
  const fast = settings.reduceMotion;
  const fl = !settings.reduceFlashes;
  const color = mdColor(id);
  const me = caster(ctx, id);
  const x = e.x;
  const y = e.y;
  const mx = me?.x ?? x - 600;
  const my = me?.y ?? y;
  // (tanda 2's words go under the stamp's band, which covers y≈196–404 of the stage while it reads)
  const low = Math.max(480, my + 50);
  const dir = mx < x ? 1 : -1;
  switch (id) {
    case 'xp_gomitas': {
      // the rubber arm stretches across the sea
      const arm = new Graphics();
      fleeting(ctx, arm, 0.9);
      const f = fleeting(ctx, fistG(30, 0xf4e1c1), 0.9);
      f.position.set(mx, my - 40);
      const st = { t: 0 };
      gsap.to(st, {
        t: 1,
        duration: fast ? 0.05 : 0.45,
        ease: 'power2.out',
        onUpdate: () => {
          if (arm.destroyed || f.destroyed) return;
          const ex = mx + (x - mx) * st.t;
          const ey = my - 40 + (y - 120 - my + 40) * st.t - Math.sin(st.t * Math.PI) * 120;
          arm.clear().moveTo(mx, my - 40).quadraticCurveTo((mx + ex) / 2, Math.min(my, ey) - 160, ex, ey).stroke({ width: 22, color: INK }).moveTo(mx, my - 40).quadraticCurveTo((mx + ex) / 2, Math.min(my, ey) - 160, ex, ey).stroke({ width: 14, color: 0xd62839 });
          f.position.set(ex, ey);
        },
      });
      bang(ctx, x, y - 220, '¡GOMU GOMU NO… MIAU!', 0xd62839, 70);
      sfx('whoosh', 1.3);
      break;
    }
    case 'xp_kagebunyan': {
      for (let i = 0; i < 3; i++) {
        const h = popAt(ctx, catHead(34, 0x1b1b2f, 0xff7a1a), mx + (i - 1) * 90, my - 120, 0.9);
        h.alpha = 0.85;
      }
      for (let i = 0; i < 3; i++) ctx.fxp.burst(mx + (i - 1) * 90, my - 120, { count: 14, tint: [0xffffff, 0xd8d8d8, 0x1b1b2f], speed: [60, 200], gravity: -80, life: [0.4, 0.8] });
      bang(ctx, mx, my - 230, '¡KAGE BUNYAN NO JUTSU!', 0xff7a1a, 64);
      sfx('pop', 1.3);
      break;
    }
    case 'xp_gatojo': {
      veil(ctx, 0x8a6a3a, 0.45, 1.6);
      const c = popAt(ctx, clockG(110), 960, 420, 1.5);
      gsap.to(c, { rotation: -0.4, duration: fast ? 0.05 : 0.3, ease: 'steps(3)' });
      onomatopoeia(ctx.overlay, 960, 520, '¡ZA… MIAURLDO!', { color: 0xe6c34a, size: 100 });
      ctx.flt(960, 580, '…TOKI WO TOMARE', { color: 0x7fd1c7, size: 30, font: F.comic });
      sfx('tick', 0.6);
      await wait(fast ? 80 : 400);
      break;
    }
    case 'xp_unzarpazo': {
      if (fl) flash(ctx.overlay, 0xffffff, 0.9, 0.2);
      const p = popAt(ctx, pawG(80, 0xffd23f), x, y, 0.8);
      p.rotation = -0.3;
      speedLines(ctx.wfx, x, y, INK, 64, 0.5);
      bang(ctx, x, y - 200, 'SERIOUS PAW.', 0xffffff, 96);
      ctx.shaker.add(0.9);
      sfx('bigboom', 0.7);
      break;
    }
    case 'xp_pegaso': {
      for (let i = 0; i < 14; i++)
        later(ctx, i * 35, () => {
          const g = new Graphics().moveTo(0, 0).lineTo(-dir * 70, -120).stroke({ width: 8, color: 0x3d5afe }).circle(0, 0, 9).fill(0xf6c453).stroke({ width: 3, color: INK });
          fleeting(ctx, g, 0.3, 0.2);
          g.position.set(x - 240 + (i * 37) % 480, y - 300);
          gsap.to(g, { x: g.x + dir * 120, y: y - 40 + (i % 4) * 25, duration: 0.3, ease: 'power1.in' });
        });
      bang(ctx, mx, my - 220, '¡ARDE, MI COSMOS!', 0xf6c453, 76);
      if ((e.n ?? 100) > 120) ctx.flt(mx, my - 300, `x${((e.n ?? 100) / 100).toFixed(2)}`, { color: 0xf6c453, size: 44, font: F.poster });
      sfx('charge');
      break;
    }
    case 'xp_michiatom': {
      const b = fleeting(ctx, ballG(26), 1.0);
      b.position.set(mx, my - 20);
      gsap.to(b, { x: mx + dir * 380, y: -300, rotation: 10, duration: fast ? 0.05 : 0.7, ease: 'power1.out' });
      bang(ctx, mx, my - 200, '¡TIRO INFINITO!', 0x3a7bd5, 72);
      ctx.flt(mx, my - 280, 'LLEGA EN 2 TURNOS…', { color: C.paper, size: 28, font: F.poster });
      sfx('whoosh', 0.9);
      break;
    }
    case 'xp_mazingato': {
      const f = fleeting(ctx, fistG(36, 0x2b2b33), 0.9);
      f.position.set(mx, my - 40);
      gsap.to(f, { x: x - dir * 80, y: y - 60, duration: fast ? 0.05 : 0.4, ease: 'power2.in' });
      ctx.fxp.burst(mx, my - 40, { count: 24, tint: [0xff6a1a, 0xffd23f, 0xffffff], angle: dir > 0 ? [Math.PI * 0.8, Math.PI * 1.2] : [-0.2, 0.2], speed: [120, 380], gravity: 0 });
      bang(ctx, mx, my - 220, '¡ROCKET PAWNCH!', 0xd62839, 76);
      sfx('shoot', 0.8);
      break;
    }
    case 'xp_ryumiau': {
      const book = new Container();
      const g = new Graphics().rect(-110, -70, 220, 140).fill(INK).stroke({ width: 5, color: 0xe8e8e8 });
      const t = poster('NOTE OF NINE LIVES', 22, 0xe8e8e8);
      t.anchor.set(0.5);
      book.addChild(g, t);
      popAt(ctx, book, mx, my - 200, 1.4);
      word(ctx, x, y - 140, 'ANOTADO.', 0xc8102e, 52, F.brush, 1.4);
      sfx('pencil');
      break;
    }
    case 'xp_miaunya': {
      for (let i = 0; i < 3; i++) {
        const r = popAt(ctx, ringG(40 + i * 40, 0xf7a1c4, 5), mx, my - 80, 0.8);
        r.alpha = 0.7;
        gsap.to(r.scale, { x: 2.2, y: 2.2, duration: 0.8, delay: i * 0.12 });
      }
      for (let i = 0; i < 6; i++) {
        const nut = new Graphics().ellipse(0, 0, 14, 9).fill(0xc49a6c).stroke({ width: 3, color: INK });
        drop(ctx, nut, mx - 90 + i * 36, my - 60 - (i % 2) * 20, 0.8, 0.35);
      }
      bang(ctx, mx, my - 230, '¡WAKU WAKU!', 0xf7a1c4, 72);
      sfx('reveal', 1.3);
      break;
    }
    case 'xp_yugi': {
      const n = e.n ?? 0;
      for (let i = 0; i < 5; i++) {
        const c = popAt(ctx, cardG(70, i < n ? 0x7b2cbf : 0x333344, i < n ? '★' : '?'), x - 240 + i * 120, y - 260, 1.1);
        c.rotation = (i - 2) * 0.08;
        gsap.from(c, { y: c.y + 200, duration: fast ? 0.05 : 0.3, delay: i * 0.06, ease: 'back.out(2)' });
      }
      bang(ctx, x, y - 390, n >= 5 ? '¡EL PROHIBIDO, COMPLETO!' : `¡${n} PIEZA${n === 1 ? '' : 'S'}!`, 0xe6c34a, 70);
      sfx(n >= 5 ? 'fanfare' : 'paper');
      break;
    }
    case 'xp_gatote': {
      const mill = new Graphics();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        mill.poly([0, 0, Math.cos(a - 0.15) * 110, Math.sin(a - 0.15) * 110, Math.cos(a + 0.15) * 110, Math.sin(a + 0.15) * 110]).fill(0xc9b17a).stroke({ width: 4, color: INK });
      }
      popAt(ctx, mill, x, y - 220, 1.1);
      gsap.to(mill, { rotation: Math.PI, duration: 1.1 });
      const lance = new Graphics().moveTo(0, 0).lineTo(dir * 200, 0).stroke({ width: 10, color: INK }).stroke({ width: 5, color: 0x8c6b3e });
      fleeting(ctx, lance, 0.7).position.set(mx, my - 20);
      gsap.to(lance, { x: x - dir * 260, duration: fast ? 0.05 : 0.45, ease: 'power2.in' });
      bang(ctx, mx, my - 220, (e.n ?? 1) > 1 ? '¡GIGANTES! x2' : '¡A LA CARGA!', 0xc9b17a, 72);
      sfx('whoosh', 0.7);
      break;
    }
    case 'xp_sherlock': {
      const m = new Graphics().circle(0, 0, 70).fill({ color: 0xbfe3ff, alpha: 0.35 }).stroke({ width: 10, color: 0x7a5c3e }).moveTo(50, 50).lineTo(130, 130).stroke({ width: 18, color: 0x7a5c3e });
      popAt(ctx, m, x - 200, y - 60, 1.2);
      gsap.to(m, { x: x + 200, duration: fast ? 0.05 : 1.0, ease: 'sine.inOut' });
      word(ctx, x, y - 230, 'ELEMENTAL, MI QUERIDO MICHI', 0xc9a66b, 40, F.serif, 1.4);
      sfx('paper', 0.8);
      break;
    }
    case 'xp_frankengato': {
      if (fl) flash(ctx.overlay, 0xf2d24b, 0.6, 0.2);
      const b = popAt(ctx, boltG(260, 0xf2d24b), (e.n ? mx : x) + 30, (e.n ? my : y) - 300, 0.6);
      void b;
      bang(ctx, mx, my - 230, '¡ESTÁ VIVOOO!', 0x6b8f71, 76);
      sfx('zap');
      break;
    }
    case 'xp_gatula': {
      veil(ctx, 0x1a0f1f, 0.5, 1.2);
      for (let i = 0; i < 12; i++) {
        const b = fleeting(ctx, bat(70), 0.9);
        b.position.set(mx, my - 80);
        gsap.to(b, { x: x - 200 + (i * 41) % 400, y: y - 160 + (i % 5) * 40, duration: fast ? 0.05 : 0.6, delay: i * 0.03, ease: 'sine.out' });
      }
      bang(ctx, mx, my - 220, '¡LOS HIJOS DE LA NOCHE!', 0xc8102e, 64);
      sfx('whoosh', 1.6);
      break;
    }
    case 'xp_ahab': {
      const rope = new Graphics().moveTo(mx, my - 40).quadraticCurveTo((mx + x) / 2, Math.min(my, y) - 200, x, y).stroke({ width: 7, color: INK }).moveTo(mx, my - 40).quadraticCurveTo((mx + x) / 2, Math.min(my, y) - 200, x, y).stroke({ width: 3, color: 0xe8e1d3 });
      fleeting(ctx, rope, 1.2);
      bang(ctx, mx, my - 220, '¡EL PESCADO BLANCO!', 0xe8e1d3, 70);
      sfx('splash', 0.8);
      break;
    }
    case 'xp_pinomichi': {
      const n = e.n ?? 1;
      const nose = new Graphics();
      fleeting(ctx, nose, 0.9).position.set(mx + dir * 20, my - 50);
      const st = { l: 10 };
      gsap.to(st, { l: 30 + n * 40, duration: fast ? 0.05 : 0.5, ease: 'steps(6)', onUpdate: () => !nose.destroyed && nose.clear().roundRect(dir > 0 ? 0 : -st.l, -9, st.l, 18, 9).fill(0xc49a6c).stroke({ width: 4, color: INK }) });
      ctx.flt(mx, my - 200, '«AHORITA NO LA USO»', { color: C.paper, size: 30, font: F.comic });
      bang(ctx, mx, my - 270, `¡NARIZ x${n}!`, 0xc49a6c, 70);
      sfx('pop', 0.6);
      break;
    }
    case 'xp_michipulin': {
      const pill = new Graphics().roundRect(-24, -12, 48, 24, 12).fill(0xd62839).stroke({ width: 4, color: INK }).rect(0, -12, 24, 24).fill(0xffd23f);
      const p = fleeting(ctx, pill, 0.8);
      p.position.set(mx, my - 40);
      gsap.to(p, { x, y: y - 40, rotation: 8, duration: fast ? 0.05 : 0.5, ease: 'power1.out' });
      later(ctx, fast ? 50 : 450, () => bang(ctx, x, y - 140, '¡PIII! ¡PIII!', 0xffd23f, 64));
      bang(ctx, mx, my - 220, '¡NO CONTABAN CON MI ASTUCIA!', 0xd62839, 54);
      sfx('pop', 1.6);
      break;
    }
    case 'xp_barril': {
      popAt(ctx, barrelG(46), mx, my - 30, 1.2);
      bang(ctx, mx, my - 200, '¡ESO, ESO, ESO!', 0xf2c14e, 72);
      sfx('paper', 0.6);
      break;
    }
    case 'xp_miaufalda': {
      const band = new Graphics().roundRect(-130, -32, 260, 64, 30).fill(0xf2c9a0).stroke({ width: 5, color: INK }).roundRect(-40, -22, 80, 44, 8).fill(0xffe4c8);
      const b = popAt(ctx, band, mx, my - 60, 1.2);
      b.rotation = -0.4;
      bang(ctx, mx, my - 220, '¡UNA CURITA AL MUNDO!', 0x6ec6f0, 64);
      sfx('levelup');
      break;
    }
    case 'xp_condorgato': {
      word(ctx, mx, my - 200, '¿QUÉ LE DIJO UN CAÑÓN A OTRO?', C.paper, 34, F.comic, 1.5);
      later(ctx, fast ? 50 : 600, () => word(ctx, mx, my - 150, '«TE VEO EN EL REMATE»', 0xf2a33a, 34, F.comic, 1.2));
      later(ctx, fast ? 80 : 900, () => bang(ctx, x, y - 200, '¡PLOP!', 0xffffff, 100));
      sfx('drumroll');
      await wait(fast ? 80 : 700);
      break;
    }
    case 'xp_esponja': {
      for (let i = 0; i < 16; i++) {
        const bub = ringG(10 + (i % 4) * 6, 0x6ec6f0, 3);
        fleeting(ctx, bub, 0.9).position.set(mx - 120 + (i * 17) % 240, my);
        gsap.to(bub, { y: my - 160 - (i % 5) * 30, duration: 0.9, ease: 'sine.out' });
      }
      bang(ctx, mx, my - 230, '¡ORDEN LISTA!', 0xffe14d, 72);
      sfx('levelup', 1.2);
      break;
    }
    case 'xp_rick': {
      const r = popAt(ctx, ringG(90, 0x97ce4c, 18), x, y - 160, 1.2);
      gsap.to(r, { rotation: 6, duration: 1.2 });
      ctx.fxp.burst(x, y - 160, { count: 30, tint: [0x97ce4c, 0xd8ff8a, 0xffffff], speed: [60, 260], gravity: 0, blend: 'add' });
      bang(ctx, mx, my - 220, '¡WUBBA LUBBA MIAU MIAU!', 0x97ce4c, 64);
      sfx('glitch');
      break;
    }
    case 'xp_miaang': {
      const cols = [0x5aa9e6, 0xffd23f, 0x8c6b3e, 0xff6a1a];
      cols.forEach((c, i) => {
        const a = (i / 4) * Math.PI * 2;
        const o = popAt(ctx, new Graphics().circle(0, 0, 26).fill(c).stroke({ width: 4, color: INK }), mx + Math.cos(a) * 80, my - 120 + Math.sin(a) * 60, 1);
        gsap.to(o, { x: x, y: y, duration: fast ? 0.05 : 0.6, delay: 0.25, ease: 'power2.in' });
      });
      bang(ctx, mx, my - 240, '¡ESTADO AVATAR!', 0xf6a01a, 76);
      sfx('charge', 1.2);
      break;
    }
    case 'xp_miauby': {
      const mask = new Graphics().ellipse(0, 0, 70, 50).fill(0x2a2a2a).stroke({ width: 5, color: INK }).ellipse(-25, -6, 14, 9).fill(0xffffff).ellipse(25, -6, 14, 9).fill(0xffffff);
      const m = popAt(ctx, mask, x, y - 100, 1.0);
      gsap.to(m, { y: y - 360, rotation: 3, duration: fast ? 0.05 : 0.7, delay: 0.25, ease: 'power2.in' });
      bang(ctx, x, y - 230, '¡Y LO HUBIERA LOGRADO DE NO SER POR…!', 0xe6c34a, 44);
      sfx('reveal', 1.1);
      break;
    }
    case 'xp_blumiau': {
      for (let i = 0; i < 3; i++) {
        const p = popAt(ctx, pawG(28, 0x2f6fd6), x - 120 + i * 120, y - 40 - (i % 2) * 40, 1.1);
        p.rotation = 0.3 * (i - 1);
        gsap.from(p, { alpha: 0, duration: 0.2, delay: i * 0.18 });
      }
      word(ctx, mx, my - 200, '¡UNA PISTA!', 0x6ec6f0, 54, F.comic, 1.2);
      sfx('paper', 1.4);
      break;
    }
    case 'xp_miaubody': {
      const ring = popAt(ctx, ringG(80, 0xd62839, 10), mx, my - 100, 1.0);
      gsap.to(ring, { rotation: 8, duration: 1 });
      if (fl) flash(ctx.overlay, 0xffffff, 0.5, 0.25);
      const h = popAt(ctx, catHead(30, 0x3b4a6b), mx, my - 100, 1.0);
      h.alpha = 0.7;
      bang(ctx, mx, my - 230, '¡A LA MÁQUINA DEL TIEMPO!', 0xd62839, 60);
      sfx('glitch', 0.8);
      break;
    }
    case 'xp_gatogro': {
      const sw = new Graphics();
      for (let i = 0; i < 6; i++) sw.ellipse(-180 + i * 72, 0, 70, 30).fill({ color: 0x7aa83a, alpha: 0.8 });
      sw.stroke({ width: 4, color: INK });
      popAt(ctx, sw, x, y + 60, 1.4);
      bang(ctx, mx, my - 220, '¡GRAAAAH! ¡MI PANTANO!', 0x7aa83a, 70);
      ctx.shaker.add(0.6);
      sfx('purr', 0.5);
      break;
    }
    case 'xp_grru': {
      const ray = new Graphics().moveTo(mx, my - 40).lineTo(x, y).stroke({ width: 26, color: 0x6ec6f0, alpha: 0.6 }).moveTo(mx, my - 40).lineTo(x, y).stroke({ width: 8, color: 0xffffff });
      fleeting(ctx, ray, 0.6);
      popAt(ctx, snowG(60), x, y, 1.0);
      if (e.n === 1) {
        const mini = new Graphics().roundRect(-18, -26, 36, 52, 18).fill(0xffe14d).stroke({ width: 4, color: INK }).circle(0, -8, 10).fill(0xc0c6cc).stroke({ width: 3, color: INK }).circle(0, -8, 5).fill(INK);
        popAt(ctx, mini, mx + dir * 70, my - 60, 1.2);
        word(ctx, mx + dir * 70, my - 130, '¡UIUUU!', 0xffe14d, 36, F.comic, 1.1);
      }
      bang(ctx, mx, my - 220, '¡RAYO CONGELANTE!', 0x6ec6f0, 70);
      sfx('freeze');
      break;
    }
    case 'xp_miaunion': {
      const siren = popAt(ctx, new Graphics().roundRect(-30, -20, 60, 40, 14).fill(0xd62839).stroke({ width: 5, color: INK }), mx, my - 140, 1.1);
      gsap.to(siren, { alpha: 0.3, duration: 0.15, repeat: 5, yoyo: true });
      bang(ctx, mx, my - 230, '¡UIUUU! ¡UIUUU!', 0xffe14d, 80);
      popAt(ctx, bananaG(30), mx + dir * 60, my - 80, 0.9);
      sfx('alarm');
      break;
    }
    case 'xp_garritas': {
      for (let i = 0; i < 3; i++) {
        const s = new Graphics().moveTo(-120, -120).lineTo(120, 120).stroke({ width: 14, color: INK }).moveTo(-120, -120).lineTo(120, 120).stroke({ width: 6, color: 0xc0c6cc });
        popAt(ctx, s, x - 60 + i * 60, y - 40, 0.5);
      }
      bang(ctx, mx, my - 220, '¡SNIKT!', 0xffd23f, 96);
      sfx('crit');
      break;
    }
    case 'xp_supermichi': {
      speedLines(ctx.wfx, x, y + 120, 0x2f4b8a, 50, 0.5);
      const cape = new Graphics().poly([0, 0, -50, 120, 50, 120]).fill(0xd62839).stroke({ width: 4, color: INK });
      const c = fleeting(ctx, cape, 0.9);
      c.position.set(mx, my);
      gsap.to(c, { x, y: y + 140, duration: fast ? 0.05 : 0.45, ease: 'power2.in' });
      bang(ctx, x, y - 250, '¡ARRIBA!', 0x2f4b8a, 96);
      ctx.shaker.add(0.8);
      sfx('bigboom', 0.6);
      break;
    }
    case 'xp_hierromichi': {
      for (let i = 0; i < 5; i++) {
        const plate = new Graphics().roundRect(-20, -14, 40, 28, 6).fill(i % 2 ? 0xe6c34a : 0xb3001b).stroke({ width: 3, color: INK });
        const p = fleeting(ctx, plate, 0.8);
        p.position.set(mx + Math.cos(i * 1.3) * 200, my - 100 + Math.sin(i * 1.3) * 120);
        gsap.to(p, { x: mx, y: my - 40, duration: fast ? 0.05 : 0.4, delay: i * 0.05, ease: 'power2.in' });
      }
      bang(ctx, mx, my - 230, '¡PROTOCOLO DE MEJORA!', 0xe6c34a, 64);
      sfx('charge', 0.9);
      break;
    }
    case 'xp_michimerica': {
      const s = popAt(ctx, shieldG(54), mx, my - 80, 1.0);
      gsap.to(s, { x, y, rotation: 12, duration: fast ? 0.05 : 0.6, delay: 0.2, ease: 'power1.in' });
      bang(ctx, mx, my - 230, '¡PUEDO HACER ESTO TODO EL DÍA!', 0x2f4b8a, 54);
      sfx('shield');
      break;
    }
    case 'xp_doomiau': {
      const sc = new Container();
      const g = new Graphics().roundRect(-140, -80, 280, 160, 12).fill(0xe8e1d3).stroke({ width: 6, color: 0x2e5e3a });
      const t = poster('DECRETO', 40, 0x2e5e3a);
      t.anchor.set(0.5);
      sc.addChild(g, t);
      popAt(ctx, sc, x, y - 230, 1.3);
      bang(ctx, mx, my - 230, '¡DOOMIAU LO DECRETA!', 0x7cff6b, 64);
      sfx('sting');
      break;
    }
    case 'xp_ssssmichi': {
      word(ctx, mx, my - 160, 'sssssss…', 0x8bc34a, 50, F.comic, 1.0);
      if (e.n) {
        const cube = new Graphics().rect(-40, -40, 80, 80).fill(0x4caf50).stroke({ width: 5, color: INK }).rect(-22, -18, 14, 14).fill(INK).rect(8, -18, 14, 14).fill(INK).rect(-8, 2, 16, 22).fill(INK);
        const c = popAt(ctx, cube, mx, my - 40, 0.9);
        gsap.to(c, { x, y, duration: fast ? 0.05 : 0.5, ease: 'power1.inOut' });
        later(ctx, fast ? 60 : 500, () => {
          if (fl) flash(ctx.overlay, 0xffffff, 0.9, 0.3);
          bang(ctx, x, y - 120, '¡PUM!', 0xffffff, 140);
        });
      } else ctx.flt(mx, my - 220, '*se pone triste*', { color: C.paper, size: 30, font: F.comic });
      sfx('tick', 1.4);
      await wait(fast ? 60 : 450);
      break;
    }
    case 'xp_michimpostor': {
      const btn = new Graphics().circle(0, 0, 60).fill(0xc51111).stroke({ width: 8, color: INK }).circle(0, 0, 44).fill(0xff3b3b);
      popAt(ctx, btn, 960, 420, 1.2);
      onomatopoeia(ctx.overlay, 960, 520, '¡JUNTA DE EMERGENCIA!', { color: 0xc51111, size: 84 });
      sfx('alarm', 0.8);
      await wait(fast ? 60 : 350);
      break;
    }
    case 'xp_zoomic': {
      for (let i = 0; i < 10; i++) {
        const r = ringG(14, 0xffd23f, 5);
        fleeting(ctx, r, 0.8).position.set(x - 200 + i * 44, y - 80 - Math.sin(i) * 30);
        gsap.from(r.scale, { x: 0, y: 0, duration: 0.2, delay: i * 0.04 });
      }
      speedLines(ctx.wfx, mx, my - 40, 0x1e5bd6, 40, 0.4);
      bang(ctx, mx, my - 220, '¡GOTTA GO FAST!', 0x1e5bd6, 76);
      sfx('coin', 1.5);
      break;
    }
    case 'xp_hannah': {
      const wig = new Graphics().ellipse(0, 0, 70, 50).fill(0xffe08a).stroke({ width: 5, color: INK });
      for (let i = 0; i < 5; i++) wig.ellipse(-60 + i * 30, 40, 14, 40).fill(0xffe08a).stroke({ width: 3, color: INK });
      const w = drop(ctx, wig, mx, my - 110, 1.0, 0.4);
      void w;
      bang(ctx, mx, my - 230, '¡LO MEJOR DE DOS MUNDOS!', 0xff4fa3, 60);
      sfx('reveal', 1.4);
      break;
    }
    case 'xp_gemichi': {
      const a = popAt(ctx, catHead(32, 0xffffff, INK), mx, my - 100, 1.1);
      const b = popAt(ctx, catHead(32, 0xd9e8f5, INK), x, y - 100, 1.1);
      gsap.to(a, { x, duration: fast ? 0.05 : 0.6, delay: 0.25, ease: 'sine.inOut' });
      gsap.to(b, { x: mx, duration: fast ? 0.05 : 0.6, delay: 0.25, ease: 'sine.inOut' });
      bang(ctx, (mx + x) / 2, Math.min(my, y) - 230, '¡CAMBIAZO!', 0xc8102e, 80);
      sfx('whoosh', 1.1);
      break;
    }
    case 'xp_persafalsa': {
      const glasses = new Graphics().circle(-26, 0, 20).stroke({ width: 6, color: INK }).circle(26, 0, 20).stroke({ width: 6, color: INK }).moveTo(-6, 0).lineTo(6, 0).stroke({ width: 5, color: INK }).ellipse(0, 26, 34, 10).fill(INK);
      popAt(ctx, glasses, mx, my - 110, 1.1);
      word(ctx, mx, my - 200, '*nadie sospecha nada*', 0xf7a1c4, 34, F.comic, 1.3);
      sfx('paper', 1.2);
      break;
    }
    case 'xp_hermiaune': {
      const h = popAt(ctx, hourglassG(50), mx, my - 120, 1.2);
      gsap.to(h, { rotation: Math.PI, duration: fast ? 0.05 : 0.7, ease: 'back.inOut(2)' });
      veil(ctx, 0xe6c34a, 0.18, 0.8);
      bang(ctx, mx, my - 260, '¡GIRATIEMPO!', 0xe6c34a, 76);
      sfx('tick', 0.8);
      break;
    }
    case 'xp_lunalovegata': {
      const mag = new Container();
      const g = new Graphics().rect(-80, -100, 160, 200).fill(0xf2e6a6).stroke({ width: 5, color: INK });
      const t = poster('EL QUISQUILLOSO', 18, 0xd96c9e);
      t.anchor.set(0.5);
      t.rotation = Math.PI;
      mag.addChild(g, t);
      // (beside her, under the stamp's band: above a cat on a tall deck the band would cover the magazine whole)
      const m = popAt(ctx, mag, mx + dir * 180, my + 70, 1.2);
      gsap.to(m, { rotation: Math.PI, duration: fast ? 0.05 : 0.6, ease: 'back.out(2)' });
      bang(ctx, x, y - 230, '¡¡OÍRAV LA!!', 0xd96c9e, 80);
      sfx('glitch', 1.3);
      break;
    }
    case 'xp_miaunce': {
      const p = popAt(ctx, pawG(50, 0xf7a1c4), mx + dir * 60, my - 120, 1.2);
      gsap.to(p.scale, { x: 1.2, y: 1.2, duration: 0.3, yoyo: true, repeat: 1 });
      const r = popAt(ctx, ringG(70, 0xc8102e, 4), mx + dir * 60, my - 120, 1.0);
      gsap.to(r.scale, { x: 2.5, y: 2.5, duration: 1 });
      bang(ctx, mx, my - 250, '¡ALTO AHÍ!', 0xf7a1c4, 76);
      sfx('reveal', 0.7);
      break;
    }
    case 'xp_heisenmiau': {
      const f = fleeting(ctx, flaskG(40, 0x4fc3f7), 0.9);
      f.position.set(mx, my - 60);
      gsap.to(f, { x, y: y - 40, rotation: 6, duration: fast ? 0.05 : 0.55, ease: 'power1.in' });
      bang(ctx, mx, my - 230, 'SAY MY NAME.', 0x4fc3f7, 70);
      sfx('charge', 0.7);
      break;
    }
    case 'xp_michiercoles': {
      for (let i = 0; i < 6; i++) {
        const p = piranhaG(22);
        fleeting(ctx, p, 1.0).position.set(x - 200 + i * 80, y + 30);
        p.scale.x = i % 2 ? -1 : 1;
        gsap.from(p, { y: y + 140, duration: fast ? 0.05 : 0.35, delay: i * 0.05, ease: 'back.out(2)' });
      }
      word(ctx, mx, my - 200, '*chasquea los dedos dos veces*', C.paper, 30, F.comic, 1.3);
      bang(ctx, x, y - 180, '¡ÑAC ÑAC ÑAC!', 0x5b3a7a, 70);
      sfx('splash', 1.3);
      break;
    }
    case 'xp_michiwan': {
      const hill = new Graphics().poly([-200, 120, 0, -80, 200, 120]).fill({ color: 0xe8c170, alpha: 0.6 }).stroke({ width: 5, color: INK });
      popAt(ctx, hill, mx, my + 40, 1.3);
      bang(ctx, mx, my - 230, '¡TENGO LA VENTAJA DE LA ALTURA!', 0xe8c170, 56);
      sfx('fanfare', 0.9);
      break;
    }
    case 'xp_gatoleone': {
      const rose = new Graphics().circle(0, 0, 18).fill(0xc8102e).stroke({ width: 4, color: INK }).moveTo(0, 18).lineTo(0, 80).stroke({ width: 5, color: 0x2e7d32 });
      const r = popAt(ctx, rose, mx, my - 100, 0.9);
      gsap.to(r, { x, y: y - 60, rotation: 4, duration: fast ? 0.05 : 0.6, ease: 'power1.inOut' });
      word(ctx, mx, my - 220, '«UNA OFERTA QUE NO PUEDE RECHAZAR»', 0xd9b24c, 34, F.serif, 1.4);
      sfx('sting', 0.7);
      break;
    }
    case 'xp_gatoneta': {
      for (let i = 0; i < 4; i++) {
        const c = cakeG(22);
        const k = fleeting(ctx, c, 0.9);
        k.position.set(mx, my - 60);
        gsap.to(k, { x: x - 150 + i * 100, y: y - 40, duration: fast ? 0.05 : 0.55, delay: i * 0.06, ease: 'power1.out' });
      }
      word(ctx, mx, my - 220, '«¡QUE COMAN PASTEL!»', 0xf7c6d9, 46, F.serif, 1.3);
      sfx('nyam', 1.2);
      break;
    }
    case 'xp_romiau': {
      for (let i = 0; i < 7; i++) {
        const h = fleeting(ctx, heartG(14, 0xc8102e), 0.9);
        h.position.set(mx, my - 60);
        gsap.to(h, { x: x - 60 + (i % 3) * 60, y: y - 80 - i * 14, duration: fast ? 0.05 : 0.7, delay: i * 0.05, ease: 'sine.out' });
      }
      word(ctx, mx, my - 220, '♪ PROPUESTA INDECENTE ♪', 0xc8102e, 40, F.comic, 1.3);
      sfx('purr', 1.2);
      break;
    }
    case 'xp_miauki': {
      veil(ctx, 0x1c3a51, 0.35, 1.4);
      for (let i = 0; i < 18; i++)
        later(ctx, i * 40, () => {
          const t = new Graphics().moveTo(0, -10).quadraticCurveTo(8, 4, 0, 10).quadraticCurveTo(-8, 4, 0, -10).fill(0x7fd8ff).stroke({ width: 2, color: INK });
          fleeting(ctx, t, 0.6, 0.2).position.set(400 + (i * 97) % 1120, 200 + (i % 4) * 60);
          gsap.to(t, { y: t.y + 260, duration: 0.8, ease: 'power1.in' });
        });
      word(ctx, (mx + x) / 2, 300, '♪ AMOR ETERNO… ♪', 0xf2e1c9, 54, F.serif, 1.5);
      sfx('sting', 0.5);
      await wait(fast ? 60 : 400);
      break;
    }
    case 'xp_postmaulone': {
      for (let i = 0; i < 5; i++) popAt(ctx, snowG(18 + i * 4), x - 200 + i * 100, y - 120 - (i % 2) * 40, 0.9);
      const glasses = new Graphics().roundRect(-50, -12, 40, 24, 8).fill(0x5b3a2a).roundRect(10, -12, 40, 24, 8).fill(0x5b3a2a).stroke({ width: 3, color: INK });
      popAt(ctx, glasses, mx, my - 110, 1.1);
      bang(ctx, mx, my - 220, '¡CHILL, BRO!', 0x7fd1c7, 76);
      sfx('freeze', 1.2);
      break;
    }
    case 'xp_miautentacion': {
      const sp = new Graphics();
      for (let i = 0; i < 10; i++) sp.circle(-150 + (i * 53) % 300, -60 + (i * 31) % 120, 20 + (i % 3) * 10).fill(i % 2 ? 0x111111 : 0xf2d24b);
      popAt(ctx, sp, x, y - 60, 1.0);
      bang(ctx, mx, my - 230, '¡LO QUE DUELE, SE PINTA!', 0xf2d24b, 60);
      sfx('crit', 0.8);
      break;
    }
    case 'xp_sabrina': {
      const h = popAt(ctx, heartG(80, 0xffd6e8), mx, my - 200, 1.2);
      gsap.to(h.scale, { x: 1.3, y: 1.3, duration: 0.35, yoyo: true, repeat: 1 });
      sparkles(ctx.wfx, mx, my - 200, 0xffe08a, 14, 160);
      bang(ctx, mx, my - 340, '¡ESPRESSO DE AZÚCAR!', 0xffd6e8, 60);
      sfx('levelup', 1.3);
      break;
    }
    case 'xp_daftmiau': {
      // the pyramid goes up and the partner with the gold helmet steps out next to him
      popAt(ctx, pyramidG(120, 0xc0c6cc), mx, my - 230, 1.5);
      const me2 = popAt(ctx, helmetG(28, 0xc0c6cc, 0x111111), mx - dir * 40, my - 90, 1.4);
      const partner = popAt(ctx, helmetG(28, 0xe6c34a, 0xff4fa3), mx - dir * 40, my - 90, 1.4);
      gsap.to(partner, { x: mx + dir * 60, duration: fast ? 0.05 : 0.45, delay: 0.15, ease: 'back.out(2)' });
      void me2;
      bang(ctx, mx, my - 380, 'ONE MORE TIME!', 0xff4fa3, 70);
      sfx('fanfare', 1.1);
      break;
    }
    case 'xp_partymichi': {
      // the disco ball drops, and his partner (afro + shades) hypes the crowd
      const ball = new Graphics().circle(0, 0, 50).fill(0xc0c6cc).stroke({ width: 5, color: INK });
      for (let i = -2; i <= 2; i++) ball.moveTo(-48, i * 18).lineTo(48, i * 18).moveTo(i * 18, -48).lineTo(i * 18, 48);
      ball.stroke({ width: 2, color: 0x555555 });
      drop(ctx, ball, x, y - 220, 1.3, 0.4);
      const partner = new Container();
      const afro = new Graphics().circle(0, -30, 44).fill(0x111111).stroke({ width: 4, color: INK });
      partner.addChild(afro, catHead(26, 0xff4fa3));
      const sh = new Graphics().roundRect(-24, -8, 20, 12, 4).fill(0x39ff14).roundRect(4, -8, 20, 12, 4).fill(0x39ff14);
      partner.addChild(sh);
      popAt(ctx, partner, mx + dir * 80, my - 90, 1.4);
      gsap.to(partner, { y: my - 120, duration: 0.15, yoyo: true, repeat: 5 });
      word(ctx, mx + dir * 80, my - 200, '¡PARTY ROCK!', 0x39ff14, 44, F.comic, 1.3);
      ctx.fxp.burst(x, y - 220, { count: 30, tint: [0x39ff14, 0xff4fa3, 0x00e5ff, 0xffe14d], speed: [80, 360], gravity: 200 });
      sfx('drumroll', 1.4);
      break;
    }
    case 'xp_miauknd': {
      veil(ctx, 0x111111, 0.55, 1.4);
      const moon = popAt(ctx, new Graphics().circle(0, 0, 70).fill(0xc8102e).circle(26, -14, 62).fill(0x111111), x + 200, y - 300, 1.3);
      void moon;
      bang(ctx, mx, my - 230, '¡BLINDING LIGHTS!', 0xff4fa3, 70);
      sfx('sting', 1.2);
      break;
    }
    case 'xp_miaussi': {
      const b = fleeting(ctx, ballG(22), 0.9);
      b.position.set(mx, my);
      gsap.to(b, { keyframes: [{ x: mx + dir * 120, y: my + 20, duration: fast ? 0.02 : 0.15 }, { x: mx + dir * 260, y: my - 20, duration: fast ? 0.02 : 0.15 }, { x, y, duration: fast ? 0.02 : 0.25 }] });
      gsap.to(b, { rotation: 12, duration: fast ? 0.05 : 0.55 });
      bang(ctx, mx, my - 230, '¡ANDÁ PA\' ALLÁ, BOBO!', 0x75aadb, 64);
      sfx('whoosh', 1.5);
      break;
    }
    case 'xp_gatistiano': {
      for (let i = 0; i < 3; i++) {
        const b = fleeting(ctx, ballG(18), 0.8);
        b.position.set(mx, my - 20);
        gsap.to(b, { x, y: y - 20, rotation: 8, duration: fast ? 0.05 : 0.4, delay: i * 0.12, ease: 'power2.in' });
      }
      bang(ctx, mx, my - 230, '¡HAT-TRICK!', 0xe6c34a, 80);
      sfx('coin', 0.9);
      break;
    }
    case 'xp_miaupe': {
      popAt(ctx, boltG(140, 0xffffff), mx, my - 200, 0.7);
      speedLines(ctx.wfx, mx, my - 60, 0x1f2a5a, 40, 0.4);
      bang(ctx, mx, my - 240, '¡QUÉ ME MIRÁS!', 0xc8102e, 70);
      sfx('zap', 1.3);
      break;
    }
    case 'xp_lamiau': {
      const curve = new Graphics().moveTo(mx, my - 40).bezierCurveTo(mx + dir * 400, my - 600, x + dir * 500, y - 300, x + dir * 120, y).stroke({ width: 8, color: INK }).moveTo(mx, my - 40).bezierCurveTo(mx + dir * 400, my - 600, x + dir * 500, y - 300, x + dir * 120, y).stroke({ width: 4, color: 0xffd23f });
      fleeting(ctx, curve, 0.9);
      bang(ctx, mx, my - 230, '¡CON ROSCA!', 0xffd23f, 76);
      sfx('whoosh', 1.2);
      break;
    }
    // ---------------------------------------------------------------- tanda 2 (agent PODERES-3)
    case 'xp_sombreronron': {
      const hat = new Graphics().ellipse(0, 18, 120, 26).fill(0x1b1b2f).stroke({ width: 6, color: INK }).roundRect(-46, -60, 92, 80, 18).fill(0x1b1b2f).stroke({ width: 6, color: INK });
      popAt(ctx, hat, mx, my - 30, 1.1);
      gsap.to(hat, { y: my - 170, duration: 0.3, yoyo: true, repeat: 2 });
      bang(ctx, mx, low, '¡QUIETO, QUE TE TRENZO!', 0xe6c34a, 56);
      sfx('paper', 0.9);
      break;
    }
    case 'xp_gatejo': {
      const w = popAt(ctx, catHead(30, 0xf4f1ea, 0x7fb2e5), mx - 40, my - 140, 1.1);
      const k = popAt(ctx, catHead(30, 0x111111, 0xff6b35), mx + 40, my - 140, 1.1);
      gsap.to(w, { x: mx - 120, duration: 0.5 });
      gsap.to(k, { x: x, y: y - 120, duration: fast ? 0.05 : 0.7, ease: 'power2.in' });
      bang(ctx, mx, low, '¡NADIE ANDA SOLO!', 0xf4f1ea, 64);
      sfx('sting', 0.8);
      break;
    }
    case 'xp_maullorona': {
      veil(ctx, 0x1b2a4a, 0.4, 1.4);
      for (let i = 0; i < 5; i++) later(ctx, fast ? 10 : i * 120, () => ctx.fxp.burst(mx + (i - 2) * 30, my - 120, { count: 6, tint: [0x7fb2e5, 0xe8f1f8], speed: [60, 140], gravity: 500 }));
      bang(ctx, mx, low, '¡AAAY, MIS GATITOS!', 0xc9d6e8, 64);
      sfx('splash', 0.8);
      break;
    }
    case 'xp_quetzalgatl': {
      speedLines(ctx.wfx, (mx + x) / 2, my - 100, 0x2bb3a3, 40, 0.7);
      for (let i = 0; i < 6; i++) later(ctx, fast ? 10 : i * 90, () => ctx.fxp.burst(mx + dir * i * 90, my - 150 - (i % 2) * 40, { count: 5, tint: [0x2bb3a3, 0xc8102e, 0xe6c34a], speed: [120, 300], gravity: 40, angle: dir > 0 ? [-0.3, 0.3] : [Math.PI - 0.3, Math.PI + 0.3] }));
      bang(ctx, mx, low, '¡EL VIENTO TIENE PLUMAS!', 0x2bb3a3, 60);
      sfx('whoosh', 1.3);
      break;
    }
    case 'xp_bastet': {
      const disc = new Graphics().circle(0, 0, 70).fill({ color: 0xe6c34a, alpha: 0.9 }).stroke({ width: 8, color: INK });
      popAt(ctx, disc, mx, my - 30, 1.3);
      gsap.to(disc.scale, { x: 1.2, y: 1.2, duration: 0.4, yoyo: true, repeat: 1 });
      bang(ctx, mx, low, '¡AQUÍ NADIE ENTRA!', 0xe6c34a, 60);
      sfx('shield', 1.0);
      break;
    }
    case 'xp_cleogatra': {
      const pearl = new Graphics().circle(0, 0, 34).fill(0xf5f0e1).stroke({ width: 6, color: INK }).circle(-10, -10, 8).fill(0xffffff);
      popAt(ctx, pearl, mx, my - 30, 1.2);
      gsap.to(pearl, { y: my - 90, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' });
      bang(ctx, mx, low, '¿APOSTAMOS?', 0xf5f0e1, 70);
      sfx('coin', 1.0);
      break;
    }
    case 'xp_bonapata': {
      const flag = new Graphics().rect(0, -90, 6, 100).fill(INK).rect(6, -90, 26, 50).fill(0x1f3a93).rect(32, -90, 26, 50).fill(0xffffff).rect(58, -90, 26, 50).fill(0xc8102e).stroke({ width: 3, color: INK });
      popAt(ctx, flag, mx, my - 80, 1.2);
      bang(ctx, mx, low, '¡A CONQUISTAR!', 0x1f3a93, 70);
      sfx('fanfare', 0.7);
      break;
    }
    case 'xp_leonardo': {
      const page = new Graphics().rect(-90, -60, 180, 120).fill(0xe8d3a8).stroke({ width: 5, color: 0xb5543a });
      for (let i = 0; i < 4; i++) page.moveTo(-70, -36 + i * 22).lineTo(70 - i * 12, -36 + i * 22).stroke({ width: 3, color: 0xb5543a });
      popAt(ctx, page, mx, my - 30, 1.3);
      word(ctx, mx, low, 'CODEX', 0xb5543a, 54, F.serif, 1.2);
      sfx('pencil', 1.0);
      break;
    }
    case 'xp_perla': {
      const win = new Graphics().rect(-70, -90, 140, 180).fill({ color: 0xf2d27a, alpha: 0.35 }).stroke({ width: 8, color: 0x6b4f2a }).moveTo(0, -90).lineTo(0, 90).moveTo(-70, 0).lineTo(70, 0).stroke({ width: 5, color: 0x6b4f2a });
      popAt(ctx, win, mx - dir * 120, my - 30, 1.4);
      flash(ctx.overlay, 0xf2d27a, fl ? 0.25 : 0.05, 0.5);
      bang(ctx, mx, low, 'LUZ DE VENTANA', 0xf2d27a, 56);
      sfx('levelup', 0.6);
      break;
    }
    case 'xp_miauton': {
      const apple = new Graphics().circle(0, 0, 40).fill(0xc0392b).stroke({ width: 6, color: INK }).rect(-3, -54, 6, 18).fill(0x6b4f2a).ellipse(14, -50, 14, 7).fill(0x3e8e41);
      popAt(ctx, apple, x, -120, 1.0);
      gsap.to(apple, { y: y - 30, duration: fast ? 0.05 : 0.6, ease: 'power2.in' });
      bang(ctx, mx, low, '¡EUREKA… DIGO, GRAVEDAD!', 0xc0392b, 56);
      sfx('boom', 0.6);
      break;
    }
    case 'xp_miauzart': {
      for (let i = 0; i < 3; i++) later(ctx, fast ? 10 : i * 160, () => onomatopoeia(ctx.wfx, mx + dir * (60 + i * 80), low - i * 30, '♪', { color: 0xe8c7a0, size: 70 }));
      bang(ctx, mx, low, '¡BRAVO! ¡OTRA!', 0xe8c7a0, 66);
      sfx('fanfare', 0.6);
      break;
    }
    case 'xp_miausagi': {
      const moon = new Graphics().circle(0, 0, 80).fill({ color: 0xfff3b0, alpha: 0.9 }).stroke({ width: 6, color: INK });
      popAt(ctx, moon, x, 170, 1.4);
      veil(ctx, 0x2a1b4a, 0.35, 1.3);
      bang(ctx, mx, low, '¡EN EL NOMBRE DE LA LUNA… Y LA AMISTAD!', 0xf7a1c4, 46);
      sfx('reveal', 1.1);
      break;
    }
    case 'xp_tanjimiau': {
      speedLines(ctx.wfx, x, y, 0x3a7bd5, 50, 0.6);
      bang(ctx, mx, low, '¡RESPIRACIÓN DEL AGUA!', 0x3a7bd5, 60);
      sfx('splash', 1.1);
      break;
    }
    case 'xp_tetrimiau': {
      const cols = [0x8a4dff, 0x2bb3a3, 0xf2a33a, 0xd62839];
      for (let i = 0; i < 4; i++) {
        const blk = new Graphics().rect(-30, -30, 60, 60).fill(cols[i]).stroke({ width: 5, color: INK });
        popAt(ctx, blk, x + (i - 1.5) * 70, -80 - i * 40, 1.0);
        gsap.to(blk, { y: y - 20, duration: fast ? 0.05 : 0.5 + i * 0.08, ease: 'power1.in' });
      }
      sfx('tick', 1.0);
      break;
    }
    case 'xp_laracroqueta': {
      const rope = new Graphics().moveTo(mx, my - 40).lineTo(x, y - 60).stroke({ width: 6, color: 0x8a5a2b });
      fleeting(ctx, rope, 0.8);
      bang(ctx, mx, low, '¡ESTO VA PARA EL MUSEO!', 0xc49a3c, 58);
      sfx('coin', 1.2);
      break;
    }
    case 'xp_pobregatito': {
      flash(ctx.overlay, 0xc8102e, fl ? 0.2 : 0.05, 0.3);
      bang(ctx, mx, low, '¡AAAAH! (CASA ARMADA)', 0xc8102e, 62);
      sfx('alarm', 0.6);
      break;
    }
    case 'xp_felinamente': {
      const book = new Graphics().rect(-70, -50, 140, 100).fill(0xf7a1c4).stroke({ width: 6, color: INK }).rect(-60, -40, 10, 80).fill(0xe6c34a);
      popAt(ctx, book, x, -100, 1.0);
      gsap.to(book, { y: y - 40, duration: fast ? 0.05 : 0.5, ease: 'power2.in' });
      bang(ctx, mx, low, '¡OBJECIÓN!', 0xf7a1c4, 80);
      sfx('hit', 1.0);
      break;
    }
    case 'xp_gorrimiau': {
      const comp = new Graphics().circle(0, 0, 50).fill(0xe8d3a8).stroke({ width: 7, color: 0x8a5a2b }).moveTo(0, 0).lineTo(dir * 38, -12).stroke({ width: 6, color: 0xc8102e });
      popAt(ctx, comp, mx, my - 30, 1.3);
      gsap.to(comp, { rotation: dir * 6, duration: fast ? 0.05 : 1.0, ease: 'power2.out' });
      bang(ctx, mx, low, '¡ESA ES LA DIRECCIÓN!', 0xc49a3c, 58);
      sfx('tick', 0.8);
      break;
    }
    case 'xp_docmiauwn': {
      veil(ctx, 0x0b1a3a, 0.4, 1.2);
      const t1 = new Graphics().moveTo(mx - 160, my - 60).lineTo(mx + 160, my - 60).stroke({ width: 6, color: 0xff8c1a }).moveTo(mx - 160, my - 40).lineTo(mx + 160, my - 40).stroke({ width: 6, color: 0xff8c1a });
      fleeting(ctx, t1, 0.9);
      bang(ctx, mx, low, '¡GRAN MICHI SCOTT!', 0xff8c1a, 64);
      sfx('zap', 1.0);
      break;
    }
    case 'xp_pinkmiau': {
      const fl2 = new Graphics().moveTo(-14, -50).lineTo(14, -50).lineTo(14, -20).lineTo(40, 40).lineTo(-40, 40).lineTo(-14, -20).closePath().fill({ color: 0xf7a1c4, alpha: 0.85 }).stroke({ width: 6, color: INK });
      popAt(ctx, fl2, mx, my - 30, 1.1);
      bang(ctx, mx, low, '¡SÍ, CIENCIA!', 0xf7a1c4, 66);
      sfx('charge', 0.8);
      break;
    }
    case 'xp_miauty': {
      const sheet = new Graphics().rect(-80, -60, 160, 120).fill(0xf5f0e1).stroke({ width: 5, color: 0x6b4f2a });
      for (let i = 0; i < 5; i++) sheet.moveTo(-60, -40 + i * 20).lineTo(60, -40 + i * 20).stroke({ width: 2, color: 0x6b4f2a });
      popAt(ctx, sheet, mx, my - 30, 1.2);
      bang(ctx, mx, low, '¡LAS CUENTAS CLARAS!', 0x6b4f2a, 58);
      sfx('paper', 1.0);
      break;
    }
    case 'xp_michincipe': {
      const box = new Graphics().rect(-60, -40, 120, 80).fill(0xf2c94c).stroke({ width: 6, color: INK }).circle(-25, 0, 6).fill(INK).circle(0, 0, 6).fill(INK).circle(25, 0, 6).fill(INK);
      popAt(ctx, box, mx, my - 30, 1.3);
      word(ctx, mx, low, 'ADENTRO ESTÁ LO QUE NECESITAS', 0xf2c94c, 34, F.serif, 1.3);
      sfx('reveal', 0.8);
      break;
    }
    case 'xp_garjona': {
      for (let i = 0; i < 3; i++) later(ctx, fast ? 10 : i * 200, () => word(ctx, mx + (i - 1) * 140, low - i * 20, ['Y LA HISTORIA…', '…SIGUE…', '…Y SIGUE'][i], 0xd4a017, 34, F.serif, 1.0));
      sfx('purr', 0.8);
      break;
    }
    case 'xp_shakimiau': {
      ctx.shaker.add(fast ? 0.3 : 1.2);
      bang(ctx, mx, low, '¡EL SUELO BAILA CONMIGO!', 0xe0a030, 60);
      sfx('bigboom', 0.7);
      break;
    }
    case 'xp_miaucol': {
      const ball = new Graphics().circle(0, 0, 30).fill(0xe0702a).stroke({ width: 5, color: INK }).moveTo(-30, 0).lineTo(30, 0).moveTo(0, -30).lineTo(0, 30).stroke({ width: 3, color: INK });
      popAt(ctx, ball, mx, my - 30, 1.1);
      gsap.to(ball, { x: x, y: y - 40, duration: fast ? 0.05 : 0.9, ease: 'power1.inOut' });
      bang(ctx, mx, low, '¡DESDE LA LÍNEA!', 0xce1141, 70);
      sfx('whoosh', 1.0);
      break;
    }
    default: {
      sparkles(ctx.wfx, x, y, color, 16, 160);
      break;
    }
  }
}

// ------------------------------------------------------------------ at impact time
/** the beats inside each post power ('mdp…' events) */
export function mdpAt(ctx: UltCtx, e: UltEv) {
  try {
    beat(ctx, e);
  } catch {
    // a drawing must never break the battle
  }
}

function beat(ctx: UltCtx, e: UltEv) {
  const fl = !settings.reduceFlashes;
  const x = e.x;
  const y = e.y;
  const n = e.n ?? 0;
  const label = (text: string, color: number, size = 30, dy = 150, dur = 1.4) => ctx.flt(x, y - dy, text, { color, size, font: F.poster, dur });
  switch (e.fx) {
    // ---- Gomitas
    case 'mdpRubber':
      label(`TU TRIPULACIÓN, DE HULE (${n} TURNOS)`, 0xd62839, 30, 200);
      spark(ctx, x, y - 60, [0xd62839, 0xf4e1c1], 16, 200);
      sfx('pop', 0.7);
      break;
    case 'mdpBoing':
      onomatopoeia(ctx.wfx, x, y - 60, '¡BOING!', { color: 0xd62839, size: 70 });
      sfx('pop', 0.6);
      break;
    // ---- Kagebunyan
    case 'mdpClone': {
      prune();
      const h = catHead(28, 0x1b1b2f, 0xff7a1a);
      h.alpha = 0.7;
      h.position.set(x, y - 70);
      ctx.wfx.addChild(h);
      gsap.from(h.scale, { x: 0, y: 0, duration: 0.25, ease: 'back.out(2)' });
      gsap.to(h, { alpha: 0, delay: 30, duration: 1, onComplete: () => kill(h) });
      CLONES.push({ node: h, x, y });
      ctx.fxp.burst(x, y - 70, { count: 10, tint: [0xffffff, 0x1b1b2f], speed: [40, 160], gravity: -60 });
      break;
    }
    case 'mdpPoof': {
      prune();
      const k = CLONES.map((c, i) => ({ c, i, d: Math.hypot(c.x - x, c.y - y) })).sort((a, z) => a.d - z.d)[0];
      if (k && k.d < 160) {
        kill(k.c.node);
        CLONES.splice(k.i, 1);
      }
      onomatopoeia(ctx.wfx, x, y - 80, '¡POOF!', { color: 0xff7a1a, size: 64 });
      ctx.fxp.burst(x, y - 40, { count: 24, tint: [0xffffff, 0xd8d8d8, 0xff7a1a], speed: [80, 260], gravity: -40, life: [0.4, 0.8] });
      sfx('pop', 1.1);
      break;
    }
    // ---- Gatojo
    case 'mdpZaWarudo':
      label('SU TURNO NO PASA', 0xe6c34a, 34, 200);
      break;
    case 'mdpPause': {
      prune();
      const c = new Container();
      c.addChild(ringG(22, 0xe6c34a, 4), clockG(14));
      c.position.set(x, y);
      ctx.wfx.addChild(c);
      gsap.from(c.scale, { x: 0, y: 0, duration: 0.2 });
      PAUSED.push(c);
      ctx.flt(x, y - 50, '¡ALTO!', { color: 0xe6c34a, size: 26, font: F.comic });
      sfx('tick', 1.2);
      break;
    }
    case 'mdpResume': {
      prune();
      for (const p of PAUSED.splice(0)) {
        if (!p.destroyed) ctx.fxp.burst(p.x, p.y, { count: 10, tint: [0xe6c34a, 0x7fd1c7], speed: [60, 200], gravity: 200 });
        kill(p);
      }
      if (fl) flash(ctx.overlay, 0xe6c34a, 0.4, 0.2);
      onomatopoeia(ctx.overlay, 960, 280, '¡EL TIEMPO VUELVE!', { color: 0xe6c34a, size: 90 });
      sfx('tick', 0.5);
      break;
    }
    // ---- Un Zarpazo
    case 'mdpSerious':
      onomatopoeia(ctx.wfx, x, y - 100, n ? '…EL NÚCLEO AGUANTA' : '¡DESAPARECIÓ!', { color: 0xffd23f, size: 64 });
      spark(ctx, x, y, [0xffd23f, 0xffffff, INK], 40, 500);
      ctx.shaker.add(1);
      sfx('bigboom');
      break;
    // ---- Pegaso
    case 'mdpCosmos':
      label(`COSMOS x${(n / 100).toFixed(2)}`, 0xf6c453, 36, 220);
      sparkles(ctx.wfx, x, y, 0x3d5afe, 18, 220);
      break;
    // ---- Michi Atom
    case 'mdpKick':
      ctx.flt(x, y - 120, `¡${n} TURNOS DE CANCHA!`, { color: 0x3a7bd5, size: 28, font: F.comic });
      break;
    case 'mdpGoal':
      onomatopoeia(ctx.wfx, x, y - 120, '¡GOOOOOL!', { color: 0x3a7bd5, size: 110 });
      spark(ctx, x, y, [0xffffff, 0x3a7bd5, 0x2e7d32], 40, 400);
      ctx.shaker.add(0.9);
      sfx('bigboom', 0.9);
      break;
    // ---- Mazingato
    case 'mdpAlloy':
      label('ALEACIÓN: NADIE LES QUITA MÁS DE 20 %', 0xd62839, 28, 220);
      sparkles(ctx.wfx, x, y, 0xffd23f, 12, 200);
      sfx('shield', 0.8);
      break;
    case 'mdpAlloyHit':
      ctx.flt(x, y - 120, '¡CLANG! (TOPE 20 %)', { color: 0xffd23f, size: 26, font: F.comic });
      sfx('shield', 1.2);
      break;
    // ---- Ryumiau
    case 'mdpNote':
      word(ctx, x, y - 120, `${n}…`, 0xc8102e, 70, F.brush, 1.0);
      sfx('pencil', 0.8);
      break;
    case 'mdpNoteKill': {
      if (fl) flash(ctx.overlay, 0x000000, 0.5, 0.4);
      const book = new Graphics().rect(-60, -40, 120, 80).fill(INK).stroke({ width: 4, color: 0xe8e8e8 });
      popAt(ctx, book, x, y - 160, 1.0);
      onomatopoeia(ctx.wfx, x, y - 90, '…CUMPLIDO.', { color: 0xc8102e, size: 70 });
      sfx('crit', 0.6);
      break;
    }
    // ---- Miaunya
    case 'mdpRead':
      label('TELEPATÍA: ESQUIVAN TIROS DE GATO (2 TURNOS)', 0xf7a1c4, 26, 220);
      break;
    case 'mdpDodge':
      onomatopoeia(ctx.wfx, x, y - 100, '¡ESQUIVA!', { color: 0xf7a1c4, size: 56 });
      speedLines(ctx.wfx, x, y - 40, 0xf7a1c4, 24, 0.3);
      sfx('whoosh', 1.8);
      break;
    // ---- Yugi
    case 'mdpPieces':
      ctx.flt(x, y - 120, `PIEZAS ${n}/5`, { color: 0x7b2cbf, size: 30, font: F.poster });
      if (n) popAt(ctx, cardG(40, 0x7b2cbf, '★'), x + 40, y - 70, 0.8);
      sfx('paper', 1.3);
      break;
    case 'mdpExodia':
      if (fl) flash(ctx.overlay, 0xe6c34a, 0.6, 0.3);
      onomatopoeia(ctx.wfx, x, y - 200, '¡EL PROHIBIDO!', { color: 0xe6c34a, size: 110 });
      ctx.shaker.add(1.2);
      sfx('bigboom', 0.6);
      break;
    // ---- Don Gatote
    case 'mdpLance':
      onomatopoeia(ctx.wfx, x, y - 100, n > 1 ? '¡A LA CARGA! x2' : '¡A LA CARGA!', { color: 0xc9b17a, size: 60 });
      break;
    case 'mdpGiant':
      onomatopoeia(ctx.wfx, x, y - 120, '¡GIGANTE!', { color: 0xc9b17a, size: 80 });
      ctx.flt(x, y - 200, 'LA LANZA SE ATORÓ (PIERDE SU TURNO)', { color: C.paper, size: 24, font: F.poster });
      sfx('crit', 0.7);
      break;
    // ---- Sherlock
    case 'mdpMark': {
      const m = new Graphics().circle(0, 0, 24).stroke({ width: 7, color: INK }).circle(0, 0, 24).stroke({ width: 3, color: 0xc9a66b }).moveTo(-34, 0).lineTo(34, 0).moveTo(0, -34).lineTo(0, 34).stroke({ width: 3, color: 0xc9a66b });
      popAt(ctx, m, x, y, 1.6);
      ctx.flt(x, y - 50, `PUNTO DÉBIL ${n + 1}`, { color: 0xc9a66b, size: 22, font: F.poster });
      break;
    }
    case 'mdpDeduce':
      onomatopoeia(ctx.wfx, x, y - 80, '¡DEDUCIDO!', { color: 0xc9a66b, size: 54 });
      break;
    // ---- revive (Frankengato, Hermiaune)
    case 'mdpRevive':
      revive(ctx, e);
      break;
    case 'mdpSpark':
      onomatopoeia(ctx.wfx, x, y - 100, `¡ZZZAP! x${n}`, { color: 0xf2d24b, size: 64 });
      sfx('zap');
      break;
    // ---- Gatula
    case 'mdpBats':
      for (let i = 0; i < 3; i++) popAt(ctx, bat(40), x - 30 + i * 30, y - 60 - i * 10, 0.5);
      ctx.flt(x, y - 120, '¡ÑAM!', { color: 0xc8102e, size: 30, font: F.comic });
      sfx('nyam', 0.7);
      break;
    case 'mdpDrain':
      ctx.flt(x, y - 140, `+${n}`, { color: 0x7ed957, size: 34, font: F.heavy });
      ctx.fxp.burst(x, y - 40, { count: 12, tint: [0xc8102e, 0x7ed957], speed: [40, 140], gravity: -120 });
      break;
    // ---- Ahab
    case 'mdpHarpoon':
      onomatopoeia(ctx.wfx, x, y - 100, '¡AMARRADO!', { color: 0xe8e1d3, size: 60 });
      sfx('hit');
      break;
    case 'mdpPull':
      onomatopoeia(ctx.wfx, x, y - 100, `¡JALA! −${n} %`, { color: 0xe8e1d3, size: 60 });
      ctx.shaker.add(0.4);
      sfx('hit', 0.7);
      break;
    // ---- Pinomichi
    case 'mdpNose':
      ctx.flt(x, y - 110, `NARIZ x${n}`, { color: 0xc49a6c, size: 26, font: F.comic });
      sfx('pop', 0.5 + n * 0.08);
      break;
    // ---- Michipulín
    case 'mdpShrink':
      onomatopoeia(ctx.wfx, x, y - 100, '¡CHIQUITO!', { color: 0xd62839, size: 60 });
      spark(ctx, x, y - 40, [0xd62839, 0xffd23f], 16, 300);
      sfx('pop', 2);
      break;
    // ---- Barril
    case 'mdpBarrel':
      popAt(ctx, barrelG(34), x, y - 30, 1.0);
      ctx.flt(x, y - 120, '*se mete al barril*', { color: C.paper, size: 26, font: F.comic });
      break;
    case 'mdpBarrelBlock':
      popAt(ctx, barrelG(30), x, y - 40, 0.8);
      onomatopoeia(ctx.wfx, x, y - 120, '¡CLONC!', { color: 0xf2c14e, size: 70 });
      sfx('hit', 0.6);
      break;
    case 'mdpBarrelOut':
      onomatopoeia(ctx.wfx, x, y - 100, '¡FUE SIN QUERER!', { color: 0xf2c14e, size: 60 });
      sfx('boom', 1.1);
      break;
    // ---- Miaufalda
    case 'mdpBandage':
      label(`¡CURITA! +${n}`, 0x6ec6f0, 30, 200);
      break;
    case 'mdpRebuild':
      onomatopoeia(ctx.wfx, x, y - 80, '¡REARMADO!', { color: 0x6ec6f0, size: 54 });
      sparkles(ctx.wfx, x, y, 0x6ec6f0, 10, 80);
      sfx('levelup', 0.8);
      break;
    // ---- Condorgato
    case 'mdpJoke':
      if (n === 0) {
        onomatopoeia(ctx.wfx, x, y - 90, '¡Y EL REMATE!', { color: 0xf2a33a, size: 56 });
        sfx('drumroll', 1.6);
      } else ctx.flt(x, y - 140, `EL REMATE x3 (${n} ANDANADAS)`, { color: 0xf2a33a, size: 26, font: F.poster });
      break;
    // ---- Esponja
    case 'mdpReady':
      spark(ctx, x, y - 60, [0xffe14d, 0x6ec6f0, 0xffffff], 30, -100);
      break;
    // ---- Rick
    case 'mdpPortal': {
      const r = popAt(ctx, ringG(n ? 34 : 26, 0x97ce4c, 8), x, y, 0.5);
      gsap.to(r, { rotation: 4, duration: 0.5 });
      sfx('glitch', 1.6);
      break;
    }
    // ---- Miaang
    case 'mdpElements': {
      const cols = [0x5aa9e6, 0xffd23f, 0x8c6b3e, 0xff6a1a];
      const words = ['¡AGUA!', '¡AIRE!', '¡TIERRA!', '¡FUEGO!'];
      ctx.flt(x + (n - 1.5) * 60, y - 120 - n * 20, words[n] ?? '', { color: cols[n] ?? C.paper, size: 34, font: F.comic });
      spark(ctx, x, y, [cols[n] ?? 0xffffff, 0xffffff], 16, 200);
      break;
    }
    // ---- Miauby
    case 'mdpUnmask':
      label(n ? `¡DESENMASCARADO! (${n})` : '¡DESENMASCARADO!', 0xe6c34a, 32, 200);
      break;
    // ---- Blumiau
    case 'mdpClue': {
      const p = popAt(ctx, pawG(18, 0x2f6fd6), x, y - 10, 2.0);
      p.alpha = 0.85;
      break;
    }
    case 'mdpClueFound':
      onomatopoeia(ctx.wfx, x, y - 90, `¡PISTA ${n}/3!`, { color: 0x6ec6f0, size: 56 });
      sfx('coin', 1.3);
      break;
    case 'mdpSolved':
      if (fl) flash(ctx.overlay, 0x6ec6f0, 0.4, 0.25);
      onomatopoeia(ctx.wfx, x, y - 130, '¡LO RESOLVIMOS!', { color: 0x6ec6f0, size: 90 });
      sfx('fanfare');
      break;
    // ---- Mr. Miaubody
    case 'mdpTimeCopy':
      label('¡DEL PASADO!', 0xd62839, 32, 200);
      popAt(ctx, catHead(26, 0x3b4a6b), x + 50, y - 80, 1.0).alpha = 0.7;
      break;
    case 'mdpCopyShot':
      popAt(ctx, catHead(22, 0x3b4a6b), x, y - 20, 0.6).alpha = 0.65;
      ctx.flt(x, y - 80, '¡OTRA VEZ!', { color: 0xd62839, size: 24, font: F.comic });
      break;
    // ---- Gatogro
    case 'mdpSwamp':
      label(`¡PANTANO! (${n} TURNOS)`, 0x7aa83a, 32, 200);
      ctx.fxp.burst(x, y, { count: 30, tint: [0x7aa83a, 0x8b5a2b, 0x4f5a45], speed: [80, 300], gravity: 500 });
      sfx('splash', 0.6);
      break;
    case 'mdpRoar':
      onomatopoeia(ctx.wfx, x, y - 120, '¡GROAAAR!', { color: 0x7aa83a, size: 80 });
      ctx.shaker.add(0.5);
      break;
    // ---- Grrrú / Miaunion
    case 'mdpFreeze':
    case 'mdpFreezeCombo': {
      const ice = new Graphics().roundRect(-55, -70, 110, 120, 12).fill({ color: 0xbfe3ff, alpha: 0.55 }).stroke({ width: 5, color: 0x6ec6f0 });
      popAt(ctx, ice, x, y - 30, 1.4);
      onomatopoeia(ctx.wfx, x, y - 130, e.fx === 'mdpFreeze' ? '¡CONGELADO!' : '¡Y OTRO! (UIUUU)', { color: 0x6ec6f0, size: 56 });
      sfx('freeze');
      break;
    }
    case 'mdpBanana':
      popAt(ctx, bananaG(22), x, y - 40, 0.6);
      onomatopoeia(ctx.wfx, x, y - 110, n ? '¡BANANA HELADA!' : '¡BANANA!', { color: 0xffe14d, size: 60 });
      if (n) popAt(ctx, snowG(26), x + 40, y - 60, 0.8);
      sfx('boom', 1.3);
      break;
    // ---- Garritas
    case 'mdpClaws':
      onomatopoeia(ctx.wfx, x, y - 140, '¡SNIKT SNIKT!', { color: 0xffd23f, size: 70 });
      break;
    case 'mdpRegen':
      ctx.flt(x, y - 140, `+${n}`, { color: 0x7ed957, size: 32, font: F.heavy });
      ctx.fxp.burst(x, y - 40, { count: 10, tint: [0x7ed957, 0xffd23f], speed: [30, 120], gravity: -150 });
      break;
    // ---- Supermichi
    case 'mdpLift':
      onomatopoeia(ctx.wfx, x, y - 160, '¡Y LO SUELTA!', { color: 0x2f4b8a, size: 80 });
      ctx.fxp.burst(x, y + 120, { count: 40, tint: [0xffffff, 0x3569a3], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [200, 600] });
      ctx.shaker.add(1.1);
      sfx('splash');
      break;
    // ---- Hierro Michi
    case 'mdpUpgrade':
      ctx.flt(x, y - 130, n ? `MEJORA +${n} %` : 'PROTOCOLO ACTIVO', { color: 0xe6c34a, size: 28, font: F.poster });
      sparkles(ctx.wfx, x, y - 40, 0xe6c34a, 8, 70);
      sfx('charge', 1.4);
      break;
    // ---- Michimérica
    case 'mdpShieldUp':
      label(`NINGUNO CAE (${n} TURNOS)`, 0x2f4b8a, 30, 220);
      break;
    case 'mdpShield':
      popAt(ctx, shieldG(36), x, y - 60, 0.9);
      onomatopoeia(ctx.wfx, x, y - 140, '¡AQUÍ NO CAE NADIE!', { color: 0x2f4b8a, size: 50 });
      sfx('shield');
      break;
    // ---- Doomiau
    case 'mdpDecree':
      label(`LA LEY DE DOOMIAU (${n} TURNOS)`, 0x7cff6b, 30, 220);
      break;
    // ---- Ssssmichi
    case 'mdpHug':
      if (fl) flash(ctx.overlay, 0xffffff, 0.8, 0.3);
      onomatopoeia(ctx.wfx, x, y - 160, '¡ABRAZO EXPLOSIVO!', { color: 0x4caf50, size: 80 });
      ctx.fxp.burst(x, y, { count: 60, tint: [0x4caf50, 0x1b1b1b, 0xffffff, 0xff6a1a], speed: [200, 700], gravity: 500, stepped: true });
      ctx.shaker.add(1.4);
      sfx('bigboom');
      break;
    case 'mdpHiss':
      word(ctx, x, y - 120, 'sss… (snif)', 0x8bc34a, 40, F.comic, 1.2);
      break;
    // ---- Michimpostor
    case 'mdpVote':
      onomatopoeia(ctx.wfx, x, y - 110, '¡EXPULSADO!', { color: 0xc51111, size: 70 });
      ctx.flt(x, y - 190, `ERA EL IMPOSTOR (FUERA ${n} TURNO${n === 1 ? '' : 'S'})`, { color: C.paper, size: 24, font: F.poster });
      sfx('alarm', 1.2);
      break;
    case 'mdpReturn':
      onomatopoeia(ctx.wfx, x, y - 100, '¡VOLVIÓ!', { color: 0x9fd8ff, size: 56 });
      break;
    // ---- Zoomic
    case 'mdpRings':
      label(`${n} ANILLOS`, 0xffd23f, 32, 160);
      sfx('coin', 1.6);
      break;
    case 'mdpRingLoss':
      for (let i = 0; i < 8; i++) {
        const r = ringG(9, 0xffd23f, 3);
        fleeting(ctx, r, 0.6, 0.3).position.set(x, y - 40);
        gsap.to(r, { x: x + Math.cos(i) * 120, y: y - 40 + Math.sin(i) * 60 - 40, duration: 0.6, ease: 'power1.out' });
      }
      sfx('coin', 0.7);
      break;
    case 'mdpRingBack':
      ctx.flt(x, y - 130, `ANILLOS ${n}`, { color: 0xffd23f, size: 30, font: F.poster });
      sfx('coin', 1.8);
      break;
    // ---- Hannah
    case 'mdpWig':
      onomatopoeia(ctx.wfx, x, y - 120, '¡NADIE SABE QUE SOY YO!', { color: 0xff4fa3, size: 50 });
      break;
    case 'mdpConcert':
      onomatopoeia(ctx.wfx, x, y - 160, '♪ ¡NOCHE DE CONCIERTO! ♪', { color: 0xff4fa3, size: 60 });
      sfx('fanfare', 1.2);
      break;
    // ---- Gemichi
    case 'mdpSwap':
      onomatopoeia(ctx.wfx, x, y - 110, n ? '¡AHORA ESTOY SANO!' : '¿Y ESTA HERIDA?', { color: n ? 0x7ed957 : 0xc8102e, size: 46 });
      sparkles(ctx.wfx, x, y - 40, 0xd9e8f5, 10, 80);
      break;
    // ---- Persa Falsa
    case 'mdpUndercover':
      label(`INFILTRADA (${n} TURNOS)`, 0xf7a1c4, 30, 200);
      break;
    case 'mdpFooled':
      onomatopoeia(ctx.wfx, x, y - 80, '¿QUIÉN ES QUIÉN?', { color: 0xf7a1c4, size: 44 });
      break;
    // ---- Hermiaune
    case 'mdpTurner':
      popAt(ctx, hourglassG(40), x, y - 180, 1.0);
      label(`¡DESHECHO! +${n}`, 0xe6c34a, 30, 260);
      sfx('tick', 0.6);
      break;
    // ---- Luna
    case 'mdpUpside':
      label(n ? `¡AL REVÉS! (${n})` : '¡AL REVÉS!', 0xd96c9e, 32, 200);
      break;
    // ---- Miaunce
    case 'mdpCatchReady':
      ctx.flt(x, y - 150, 'ATRAPA EL SIGUIENTE TIRO', { color: 0xf7a1c4, size: 26, font: F.poster });
      break;
    case 'mdpCatch': {
      const r = popAt(ctx, ringG(40, 0xf7a1c4, 6), x, y, 0.9);
      gsap.to(r, { rotation: 3, duration: 0.9 });
      onomatopoeia(ctx.wfx, x, y - 90, '¡ATRAPADO!', { color: 0xf7a1c4, size: 60 });
      sfx('shield', 0.7);
      break;
    }
    case 'mdpCaught':
      ctx.fxp.burst(x, y, { count: 8, tint: [0xf7a1c4, 0xffffff], speed: [40, 120], gravity: 0 });
      break;
    case 'mdpThrowBack':
      onomatopoeia(ctx.wfx, x, y - 90, '¡DE VUELTA! x1.5', { color: 0xf7a1c4, size: 56 });
      sfx('whoosh', 1.3);
      break;
    // ---- Heisenmiau
    case 'mdpChem':
      ctx.fxp.burst(x, y, { count: 6 + n * 4, tint: [0x4fc3f7, 0xe6c34a, 0xffffff], speed: [80, 260], gravity: 200, life: [0.25, 0.5] });
      if (n > 1) ctx.flt(x, y - 40, `x${n}`, { color: 0x4fc3f7, size: 22, font: F.comic });
      break;
    // ---- Michiércoles
    case 'mdpPiranha':
      for (let i = 0; i < 4; i++) {
        const p = piranhaG(16);
        fleeting(ctx, p, 0.6, 0.3).position.set(x - 120 + i * 80, y + 10);
        gsap.from(p, { y: y + 80, duration: 0.25, delay: i * 0.05, ease: 'back.out(2)' });
      }
      onomatopoeia(ctx.wfx, x, y - 90, '¡ÑAC!', { color: 0x5b3a7a, size: 60 });
      sfx('nyam', 0.6);
      break;
    // ---- Michi-Wan
    case 'mdpHighGround':
      label(`VENTAJA DE LA ALTURA (${n} TURNOS)`, 0xe8c170, 28, 200);
      break;
    case 'mdpHigh':
      onomatopoeia(ctx.wfx, x, y - 70, '¡NO ALCANZA!', { color: 0xe8c170, size: 46 });
      break;
    // ---- Gatoleone
    case 'mdpOffer':
      onomatopoeia(ctx.wfx, x, y - 110, n ? '…ACEPTO.' : '¡NO ACEPTO OFERTAS!', { color: 0xd9b24c, size: 56 });
      break;
    case 'mdpBetray':
      onomatopoeia(ctx.wfx, x, y - 110, '¡POR RESPETO!', { color: 0xd9b24c, size: 60 });
      sfx('crit', 0.9);
      break;
    // ---- Gatoñeta
    case 'mdpCake':
      label(`EMPACHADOS (${n} TURNOS): SIN BARRA`, 0xf7c6d9, 28, 200);
      break;
    case 'mdpFull':
      word(ctx, x, y - 110, 'Zzz… *burp*', 0xf7c6d9, 44, F.comic, 1.3);
      popAt(ctx, cakeG(18), x + 40, y - 60, 0.9);
      break;
    // ---- Romiau
    case 'mdpSerenade':
      popAt(ctx, heartG(30, 0xc8102e), x, y - 100, 1.2);
      onomatopoeia(ctx.wfx, x, y - 170, '¡ENAMORADO!', { color: 0xc8102e, size: 56 });
      sfx('purr', 1.3);
      break;
    case 'mdpLove':
      popAt(ctx, heartG(18, 0xc8102e), x, y - 90, 0.8);
      ctx.flt(x, y - 140, '−25 DE BARRA ♥', { color: 0xc8102e, size: 24, font: F.comic });
      break;
    // ---- El Miauki
    case 'mdpBallad':
      label(`TREGUA · +${n} DE VIDA`, 0xf2e1c9, 30, 220);
      break;
    // ---- Post Maulone
    case 'mdpChill':
      label(`CHILL: INMUNES (${n} TURNOS)`, 0x7fd1c7, 30, 220);
      break;
    // ---- Miautentación
    case 'mdpArt':
      onomatopoeia(ctx.wfx, x, y - 160, n ? `¡${n} PENAS, ${n} GOLPES!` : '¡ARTE!', { color: 0xf2d24b, size: 60 });
      break;
    // ---- Sabrina
    case 'mdpHeart': {
      const h = popAt(ctx, heartG(60, 0xffd6e8), x, y - 40, 1.6);
      h.alpha = 0.8;
      label(`CORAZÓN DE AZÚCAR: ${n}`, 0xffd6e8, 28, 150);
      break;
    }
    case 'mdpConfetti':
      if (fl) flash(ctx.overlay, 0xffd6e8, 0.4, 0.2);
      onomatopoeia(ctx.wfx, x, y - 160, '¡CONFETI DE AZÚCAR!', { color: 0xffd6e8, size: 70 });
      ctx.fxp.burst(x, y - 120, { count: 50, tint: [0xffd6e8, 0xffe08a, 0xbfe3ff, 0xff4fa3], speed: [120, 420], gravity: 400, stepped: true });
      sfx('levelup', 1.4);
      break;
    // ---- Daft Miau
    case 'mdpPyramid': {
      popAt(ctx, pyramidG(70, 0xc0c6cc), x, y - 40, 1.4);
      const partner = popAt(ctx, helmetG(18, 0xe6c34a, 0xff4fa3), x + 90, y + 10, 1.4);
      gsap.from(partner, { x: x, duration: 0.3, ease: 'back.out(2)' });
      label(`PIRÁMIDE: ${n} LÁSERES`, 0xe6c34a, 26, 140);
      break;
    }
    case 'mdpLaser':
      onomatopoeia(ctx.wfx, x, y - 90, n ? '¡ORO!' : '¡PLATA!', { color: n ? 0xe6c34a : 0xc0c6cc, size: 56 });
      ctx.fxp.burst(x, y, { count: 18, tint: n ? [0xe6c34a, 0xffffff] : [0xc0c6cc, 0xffffff], speed: [80, 260], gravity: 0, blend: 'add' });
      sfx('zap', n ? 1.4 : 1.1);
      break;
    // ---- Party Michi
    case 'mdpPile':
      if (fl) flash(ctx.overlay, 0xff4fa3, 0.4, 0.2);
      onomatopoeia(ctx.wfx, x, y - 140, '¡BASS DROP!', { color: 0x39ff14, size: 100 });
      ctx.flt(x, y - 230, `${n} AMONTONADOS`, { color: 0xff4fa3, size: 28, font: F.poster });
      ctx.shaker.add(1.1);
      sfx('bigboom', 1.2);
      break;
    case 'mdpPileBack':
      ctx.flt(x, y - 200, 'SE ACABÓ LA FIESTA: CADA QUIEN A SU CAMAROTE', { color: 0x39ff14, size: 24, font: F.poster });
      break;
    // ---- The Miauknd
    case 'mdpNight':
      label('NOCHE SIN FIN: SUS ESTADOS DURAN EL DOBLE', 0xff4fa3, 28, 220);
      break;
    // ---- Miaussi
    case 'mdpDribble':
      onomatopoeia(ctx.wfx, x, y - 110, n ? `¡${n} GAMBETAS!` : '¡GAMBETA!', { color: 0x75aadb, size: 60 });
      sfx('boom', 1.1);
      break;
    case 'mdpAssist':
      ctx.flt(x, y - 140, 'ASISTENCIA x2.5', { color: 0x75aadb, size: 28, font: F.poster });
      break;
    // ---- Gatistiano
    case 'mdpHatTrick':
      onomatopoeia(ctx.wfx, x, y - 100 - n * 30, n >= 2 ? '¡SIUUUUU!' : n === 1 ? '¡DOS!' : '¡UNO!', { color: 0xe6c34a, size: n >= 2 ? 100 : 60 });
      if (n >= 2) ctx.shaker.add(0.8);
      sfx(n >= 2 ? 'fanfare' : 'boom', 1);
      break;
    // ---- Miaupé
    case 'mdpCounterReady':
      ctx.flt(x, y - 150, 'CONTRAGOLPE LISTO', { color: 0x1f2a5a, size: 26, font: F.poster });
      break;
    case 'mdpCounter':
      popAt(ctx, boltG(80, 0xffffff), x, y - 120, 0.4);
      onomatopoeia(ctx.wfx, x, y - 100, '¡CONTRAGOLPE!', { color: 0xc8102e, size: 56 });
      sfx('zap', 1.5);
      break;
    // ---- Lamiau
    case 'mdpCurl':
      onomatopoeia(ctx.wfx, x, y - 100, '¡POR LA POPA!', { color: 0xffd23f, size: 60 });
      break;
    // ---------------------------------------------------------------- tanda 2 (agent PODERES-3)
    case 'mdpBraid':
      sparkles(ctx.wfx, x, y - 60, 0xc8102e, 12, 140);
      break;
    case 'mdpPin':
      bang(ctx, x, y - 50, `LISTÓN ${n}/3`, 0xc8102e, 44);
      spark(ctx, x, y, [0xc8102e, 0xe6c34a, 0x2bb3a3], 14, 160);
      sfx('pencil', 1.1);
      break;
    case 'mdpBraidClose':
    case 'mdpPinBlow':
      bang(ctx, x, y - 80, '¡TRENZADO!', 0xe6c34a, 90);
      spark(ctx, x, y, [0xc8102e, 0xe6c34a, 0x2bb3a3], 30, 300);
      sfx('bigboom', 0.7);
      break;
    case 'mdpGuard':
      sparkles(ctx.wfx, x, y - 40, 0xf4f1ea, 12, 120);
      sfx('shield', 0.6);
      break;
    case 'mdpBite':
      bang(ctx, x, y - 70, '¡ÑAM!', 0xff6b35, 70);
      sfx('nyam', 0.9);
      break;
    case 'mdpTear':
      spark(ctx, x, y - 20, [0x7fb2e5, 0xe8f1f8], 10, 400);
      if (n === 7) bang(ctx, x, y - 90, '¡BUAAA!', 0x7fb2e5, 80);
      sfx('splash', 0.5);
      break;
    case 'mdpWind':
      speedLines(ctx.wfx, x, y - 60, 0x2bb3a3, 36, 0.5);
      break;
    case 'mdpFeather':
      sparkles(ctx.wfx, x, y - 30, 0x2bb3a3, 10, 120);
      label('SELLADO', 0x2bb3a3, 24, 90, 1.0);
      break;
    case 'mdpGuardian':
      sparkles(ctx.wfx, x, y - 60, 0xe6c34a, 20, 220);
      break;
    case 'mdpSun':
      bang(ctx, x, y - 90, n ? `¡${n} RAYOS!` : '¡SOL!', 0xe6c34a, 90);
      if (fl) flash(ctx.overlay, 0xfff2a0, 0.4, 0.3);
      ctx.shaker.add(0.8);
      sfx('bigboom', 0.8);
      break;
    case 'mdpWager':
      sparkles(ctx.wfx, x, y - 60, 0xf5f0e1, 12, 140);
      break;
    case 'mdpPearlWin':
      bang(ctx, x, y - 100, '¡GANÉ LA APUESTA!', 0xf5f0e1, 76);
      spark(ctx, x, y, [0xf5f0e1, 0x9fd8ff, 0xffffff], 30, 300);
      sfx('fanfare', 0.7);
      break;
    case 'mdpPearlLose':
      bang(ctx, x, y - 90, 'PERLA DE CONSOLACIÓN', 0xf5f0e1, 48);
      sfx('coin', 0.6);
      break;
    case 'mdpConquest':
      sparkles(ctx.wfx, x, y - 80, 0x1f3a93, 16, 200);
      sfx('levelup', 0.5);
      break;
    case 'mdpMachine':
    case 'mdpInvention':
      sparkles(ctx.wfx, x, y - 50, 0xb5543a, 10, 120);
      break;
    case 'mdpPearl':
      sparkles(ctx.wfx, x, y - 60, 0xf5f0e1, 14, 140);
      label('+2 ESCUDOS (LA PERLA)', 0xf5f0e1, 24, 110, 1.1);
      break;
    case 'mdpWindow':
    case 'mdpLight':
      sparkles(ctx.wfx, x, y - 60, 0xf2d27a, 22, 260);
      sfx('purr', 0.5);
      break;
    case 'mdpApple':
      bang(ctx, x, y - 70, '¡PLONK!', 0xc0392b, 80);
      break;
    case 'mdpEncore':
      label('EL PÚBLICO PIDE OTRA', 0xe8c7a0, 28, 160);
      break;
    case 'mdpEncoreHit':
      bang(ctx, x, y - 90, '¡ENCORE!', 0xe8c7a0, 90);
      sfx('fanfare', 0.6);
      break;
    case 'mdpMoon':
      bang(ctx, x, y - 90, `¡LUNA LLENA x${n}!`, 0xf7a1c4, 72);
      if (fl) flash(ctx.overlay, 0xfff3b0, 0.3, 0.3);
      sfx('reveal', 0.9);
      break;
    case 'mdpDragon':
      spark(ctx, x, y, [0x3a7bd5, 0xbfe3ff, 0xffffff], 10, 120);
      break;
    case 'mdpLine':
      bang(ctx, x, y - 80, '¡LÍNEA!', 0x8a4dff, 100);
      ctx.shaker.add(0.9);
      sfx('levelup', 0.8);
      break;
    case 'mdpRaid':
      label('CEGADO', 0xc49a3c, 26, 110, 1.0);
      sfx('coin', 0.8);
      break;
    case 'mdpTrapSet':
      sparkles(ctx.wfx, x, y, 0xc8102e, 6, 60);
      break;
    case 'mdpTrap':
      bang(ctx, x, y - 70, ['¡LATA!', '¡AUCH, CALIENTE!', '¡CARRITOS!', '¡LA PLANCHA!'][n] ?? '¡TRAMPA!', 0xc8102e, 66);
      sfx('hit', 1.0);
      break;
    case 'mdpTrapHit':
      spark(ctx, x, y - 30, [0xc8102e, 0xf2c94c], 16, 240);
      break;
    case 'mdpBook':
      bang(ctx, x, y - 80, '¡SE ACEPTA!', 0xf7a1c4, 70);
      sfx('hit', 0.9);
      break;
    case 'mdpObjection':
      bang(ctx, x, y - 90, '¡OBJECIÓN ACEPTADA!', 0xf7a1c4, 62);
      sfx('crit', 0.8);
      break;
    case 'mdpCompass':
      sparkles(ctx.wfx, x, y - 60, 0xc49a3c, 12, 140);
      break;
    case 'mdpCompassBend':
      sparkles(ctx.wfx, x, y, 0xc49a3c, 8, 90);
      break;
    case 'mdpPast':
      spark(ctx, x, y, [0xff8c1a, 0x9fd8ff], 12, 160);
      break;
    case 'mdpBolt':
      bang(ctx, x, y - 90, '¡1.21 GIGAMIAUS!', 0xff8c1a, 64);
      if (fl) flash(ctx.overlay, 0xbfe3ff, 0.4, 0.2);
      sfx('zap', 1.0);
      break;
    case 'mdpLab':
      spark(ctx, x, y - 30, [0xf7a1c4, 0xffffff, n ? 0x4fc3f7 : 0xf7a1c4], 18, 160);
      break;
    case 'mdpBalance':
      bang(ctx, x, y - 90, n ? '¡CUADRADO!' : '¡INTERESES!', 0x6b4f2a, 76);
      sfx('paper', 1.0);
      break;
    case 'mdpBox':
      bang(ctx, x, y - 90, ['', '¡CURITAS!', '¡SIN ESCUDOS!', '¡BEEE!'][n] ?? '¡LA CAJA!', 0xf2c94c, 76);
      sfx('pop', 0.9);
      break;
    case 'mdpMarked':
      label('MARCADO: TUS TIROS x1.25', 0xd4a017, 26, 120);
      break;
    case 'mdpQuake':
      bang(ctx, x, y - 100, '¡TERREMOTO!', 0xe0a030, 100);
      ctx.shaker.add(1.4);
      sfx('bigboom', 1.0);
      break;
    case 'mdpDunk':
      bang(ctx, x, y - 90, n ? `¡CLAVADA! x${n} ANILLOS` : '¡CLAVADA!', 0xce1141, 80);
      ctx.shaker.add(1.0);
      sfx('bigboom', 0.9);
      break;
    default:
      break;
  }
}

/** a KO'd cat gets up (Frankengato's bolt, Hermiaune's hourglass): bring its view back to its cabin */
function revive(ctx: UltCtx, e: UltEv) {
  if (!settings.reduceFlashes) flash(ctx.overlay, e.n ? 0xe6c34a : 0xf2d24b, 0.5, 0.25);
  popAt(ctx, e.n ? hourglassG(30) : boltG(140, 0xf2d24b), e.x, e.y - 160, 0.7);
  onomatopoeia(ctx.wfx, e.x, e.y - 120, '¡ESTÁ VIVO!', { color: e.n ? 0xe6c34a : 0x6b8f71, size: 70 });
  sfx('reveal');
  try {
    const v = e.uid ? ctx.catViews.get(e.uid) : undefined;
    if (!v || v.destroyed || !v.parent) return;
    gsap.killTweensOf(v);
    gsap.killTweensOf(v.scale);
    const filters = v.sprite.filters;
    if (Array.isArray(filters)) v.sprite.filters = filters.filter((f) => !(f instanceof ColorMatrixFilter));
    else if (filters instanceof ColorMatrixFilter) v.sprite.filters = [];
    v.rotation = 0;
    v.alpha = 1;
    v.scale.set(1);
    const to = v.parent.toLocal(ctx.wfx.toGlobal({ x: e.x, y: e.y + 30 }));
    gsap.to(v, { x: to.x, y: to.y, duration: settings.reduceMotion ? 0.05 : 0.5, ease: 'back.out(1.6)' });
    v.sprite.emote?.('happy');
  } catch {
    // the view may be mid-teardown: the cards still show the cat back on its feet
  }
}
