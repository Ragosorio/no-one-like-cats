/**
 * Set pieces of the signature ultimates (battle/ults.ts). The sim already resolved everything; this
 * only stages it: `pre` plays before the projectiles fly (the sun darkens the sky, the slashes…), `at`
 * plays when its event comes up during the flight (the black hole opens where the orb lands, FIN gets
 * written…). Persistent marks (FIN words, the eclipse) live in UltMarks.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { txt, poster } from '../ui/widgets';
import { flash, onomatopoeia, speedLines } from '../fx/juice';
import { sfx } from '../core/audio';
import { settings } from '../core/settings';
import type { Particles } from '../fx/particles';
import type { Shaker } from '../fx/juice';
import type { BattleEvent, Battle } from './sim';
import type { BattleCat } from '../art/catArt';

const INK = 0x171317;
type UltEv = Extract<BattleEvent, { k: 'ultfx' }>;

export interface UltCtx {
  sim: Battle;
  wfx: Container;
  overlay: Container;
  fxp: Particles;
  shaker: Shaker;
  catViews: Map<string, BattleCat>;
  flt: (x: number, y: number, text: string, o?: { color?: number; size?: number; font?: string; rise?: number; dur?: number; rot?: number }) => void;
  /** world → overlay coords */
  toOverlay: (x: number, y: number) => { x: number; y: number };
  marks: UltMarks;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** banner across the screen for the big ones */
function banner(ctx: UltCtx, text: string, color: number, sub?: string) {
  const c = new Container();
  const band = new Graphics().rect(-300, -70, 2520, 140).fill(INK);
  band.rotation = -0.04;
  const t = poster(text, 84, color, { stroke: { color: INK, width: 10 } });
  t.anchor.set(0.5);
  t.rotation = -0.04;
  c.addChild(band, t);
  if (sub) {
    const s = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: C.paper });
    s.anchor.set(0.5);
    s.y = 64;
    s.rotation = -0.04;
    c.addChild(s);
  }
  c.position.set(960, 300);
  ctx.overlay.addChild(c);
  gsap.from(band.scale, { x: 0, duration: 0.2, ease: 'power3.out' });
  gsap.from(t.scale, { x: 2.2, y: 2.2, duration: 0.22, ease: 'back.out(2)' });
  gsap.to(c, { alpha: 0, delay: 1.3, duration: 0.3, onComplete: () => c.destroy({ children: true }) });
}

/** before the projectiles fly */
export async function preUlt(ctx: UltCtx, e: UltEv) {
  const fast = settings.reduceMotion;
  switch (e.fx) {
    case 'sun': {
      banner(ctx, '¡EL SOL SE CAE!', 0xffd400, 'STELLAR DECREE: STARFALL');
      const glow = new Graphics().rect(0, 0, 1920, 1080).fill(0xffb02e);
      glow.alpha = 0;
      ctx.overlay.addChildAt(glow, 0);
      gsap.to(glow, { alpha: 0.28, duration: 0.5, yoyo: true, repeat: 1, onComplete: () => glow.destroy() });
      sfx('charge', 0.6);
      await wait(fast ? 200 : 650);
      break;
    }
    case 'thunder': {
      banner(ctx, '雷神降臨', 0xffe14a, '7 RIELES DESDE EL CIELO');
      if (!settings.reduceFlashes) flash(ctx.overlay, 0x000000, 0.55, 0.5);
      sfx('zap');
      for (let i = 0; i < 3; i++) window.setTimeout(() => !settings.reduceFlashes && flash(ctx.overlay, 0xfff6a8, 0.4, 0.08), 150 + i * 160);
      await wait(fast ? 200 : 650);
      break;
    }
    case 'slash': {
      // one blade through every enemy cat, in a row
      const s = ctx.sim.sides[e.side];
      const cats = s.cats.filter((c) => !c.ko);
      banner(ctx, '千の仮面', 0xff7ab8, 'MIL CORTES: A TODOS SUS GATOS');
      sfx('whoosh');
      for (const c of cats) {
        const bc = ctx.catViews.get(c.def.uid);
        if (!bc || bc.destroyed) continue;
        const gp = ctx.wfx.toLocal(bc.getGlobalPosition());
        const g = new Graphics();
        const len = 260;
        g.moveTo(-len / 2, 30).lineTo(len / 2, -30).stroke({ width: 16, color: INK, cap: 'round' }).moveTo(-len / 2, 30).lineTo(len / 2, -30).stroke({ width: 7, color: 0xffffff, cap: 'round' });
        g.position.set(gp.x, gp.y - 70);
        g.scale.set(0, 1);
        ctx.wfx.addChild(g);
        gsap.to(g.scale, { x: 1, duration: 0.09, ease: 'power4.out' });
        gsap.to(g, { alpha: 0, delay: 0.25, duration: 0.25, onComplete: () => g.destroy() });
        onomatopoeia(ctx.wfx, gp.x, gp.y - 160, '¡ZAN!', { color: C.paper, size: 70 });
        bc.impactFrame?.(90, false);
        sfx('hit', 1.3);
        ctx.shaker.add(0.2);
        await wait(fast ? 60 : 140);
      }
      break;
    }
    case 'eruption': {
      banner(ctx, '¡ERUPCIÓN!', 0xff6a1a, 'TRES COLUMNAS DE LAVA DESDE EL FONDO');
      const g = new Graphics().ellipse(e.x, e.y + 10, 220, 34).fill({ color: 0xff3a1a, alpha: 0.55 });
      ctx.wfx.addChild(g);
      gsap.to(g, { alpha: 0, delay: 1.2, duration: 0.4, onComplete: () => g.destroy() });
      for (let i = 0; i < 6; i++) window.setTimeout(() => ctx.fxp.burst(e.x + (Math.random() - 0.5) * 300, e.y, { count: 14, tint: [0xff6a1a, 0xffd400, INK], angle: [-Math.PI * 0.9, -Math.PI * 0.1], speed: [100, 400], gravity: 400 }), i * 90);
      ctx.shaker.add(0.5);
      sfx('bigboom', 0.6);
      await wait(fast ? 200 : 600);
      break;
    }
    case 'storm': {
      banner(ctx, '完全嵐', 0x7fd8ff, 'TODO SU BARCO QUEDA MOJADO');
      const cloud = new Graphics();
      for (let i = 0; i < 8; i++) cloud.circle(e.x - 300 + i * 85, 110 + (i % 2) * 24, 70).fill({ color: 0x2a3140, alpha: 0.9 });
      ctx.wfx.addChild(cloud);
      gsap.from(cloud, { alpha: 0, duration: 0.3 });
      gsap.to(cloud, { alpha: 0, delay: 1.8, duration: 0.5, onComplete: () => cloud.destroy() });
      for (let i = 0; i < 10; i++) window.setTimeout(() => ctx.fxp.burst(e.x + (Math.random() - 0.5) * 600, 160, { count: 8, tint: [0xc6e6ff], angle: [Math.PI * 0.45, Math.PI * 0.55], speed: [700, 900], gravity: 0, life: [0.4, 0.7] }), i * 60);
      sfx('zap', 0.7);
      await wait(fast ? 150 : 450);
      break;
    }
    case 'stone': {
      banner(ctx, '石の心', 0xc4bdab, 'CORAZÓN DE PIEDRA: TUS MÓDULOS NO CAEN (2 TURNOS)');
      ctx.fxp.burst(e.x, e.y, { count: 40, tint: [0xc4bdab, 0x8a7a62, INK], speed: [200, 600], life: [0.4, 0.8], stepped: true });
      sfx('hit', 0.6);
      ctx.shaker.add(0.3);
      await wait(fast ? 150 : 450);
      break;
    }
    case 'lure': {
      banner(ctx, '深淵の灯', 0x7fd8ff, 'SU PRÓXIMO TURNO: TODOS SUS TIROS SE VAN AL MAR');
      sfx('splash');
      await wait(fast ? 150 : 450);
      break;
    }
    case 'forest': {
      banner(ctx, '原始の森', 0x7ed957, 'TODO SU BARCO ENRAIZADO · CAÑONES TRABADOS');
      for (let i = 0; i < 5; i++) window.setTimeout(() => ctx.fxp.burst(e.x + (i - 2) * 120, e.y, { count: 16, tint: [0x7ed957, 0x2e8a52, 0xd4f27a], speed: [150, 450], gravity: 200 }), i * 70);
      sfx('levelup', 0.8);
      await wait(fast ? 150 : 450);
      break;
    }
    case 'flash': {
      if (!settings.reduceFlashes) flash(ctx.overlay, 0xffffff, 0.9, 0.35);
      const o = ctx.toOverlay(e.x, e.y);
      onomatopoeia(ctx.overlay, o.x, o.y - 120, '¡CLIC!', { color: C.paper, size: 110 });
      banner(ctx, '永遠の一瞬', 0xffd400, 'REPITE EL ÚLTIMO TIRO DE TU EQUIPO');
      sfx('reveal');
      await wait(fast ? 150 : 500);
      break;
    }
    case 'eclipse': {
      banner(ctx, '皆既日食', 0xff7ab8, 'SIN VISTA PREVIA NI CRÍTICOS 2 TURNOS · TU PRÓXIMO TIRO x2');
      if (!settings.reduceFlashes) flash(ctx.overlay, 0x000000, 0.7, 0.6);
      sfx('sting');
      await wait(fast ? 150 : 550);
      break;
    }
  }
}

/** when its event comes up (impact time) */
export function atUlt(ctx: UltCtx, e: UltEv) {
  switch (e.fx) {
    case 'blackhole': {
      sfx('bigboom', 0.5);
      if (!settings.reduceFlashes) flash(ctx.overlay, 0x1a0030, 0.6, 0.4);
      onomatopoeia(ctx.wfx, e.x, e.y - 140, 'ZUUUUM', { color: 0xff7ab8, size: 120 });
      ctx.flt(e.x, e.y - 230, 'AGUJERO NEGRO: CURVA TODOS LOS TIROS 2 TURNOS', { color: C.paper, size: 30, font: F.poster, dur: 2 });
      speedLines(ctx.wfx, e.x, e.y, 0xff7ab8, 50, 0.7);
      ctx.shaker.add(0.9);
      break;
    }
    case 'sun': {
      if (!settings.reduceFlashes) flash(ctx.overlay, 0xfff2c0, 0.9, 0.5);
      ctx.shaker.add(1);
      break;
    }
    case 'fin':
      ctx.marks.fin(e.side, e.w ?? -1, e.x, e.y);
      break;
    case 'finBoom': {
      ctx.marks.finBoom(e.side, e.x, e.y);
      onomatopoeia(ctx.wfx, e.x, e.y - 100, '完', { color: C.paper, size: 150 });
      ctx.fxp.burst(e.x, e.y, { count: 50, tint: [INK, 0xff7ab8, C.paper], speed: [200, 800], life: [0.4, 1], stepped: true });
      sfx('bigboom');
      ctx.shaker.add(0.8);
      break;
    }
    case 'finFizzle':
      ctx.marks.finBoom(e.side, e.x, e.y, true);
      ctx.flt(e.x, e.y - 80, 'LA TINTA SE BORRA (MERLINA CAYÓ)', { color: 0xd8a8ee, size: 26, font: F.poster });
      break;
    case 'chord': {
      const s = ctx.sim.sides[e.side];
      for (const m of s.ship.modules) {
        if (!m.alive) continue;
        const c = ctx.sim.roomCenter(e.side, m.id);
        const n = new Graphics();
        n.ellipse(0, 0, 11, 8).fill(INK).moveTo(9, 0).lineTo(9, -34).lineTo(22, -26).stroke({ width: 4, color: INK });
        n.position.set(c.x, c.y);
        ctx.wfx.addChild(n);
        gsap.to(n, { y: c.y - 110, alpha: 0, rotation: 0.4, duration: 1, ease: 'power2.out', onComplete: () => n.destroy() });
      }
      onomatopoeia(ctx.wfx, e.x, e.y - 200, '大団円', { color: 0xff7ab8, size: 120 });
      ctx.shaker.add(0.6);
      break;
    }
  }
}

/** persistent ultimate marks: FIN words on modules, the eclipse sun */
export class UltMarks extends Container {
  private fins = new Map<string, Container>();
  private eclipse: Container | null = null;
  fin(side: number, module: number, x: number, y: number) {
    const key = `${side}:${module}`;
    this.fins.get(key)?.destroy({ children: true });
    const c = new Container();
    const bg = new Graphics().roundRect(-56, -34, 112, 68, 10).fill({ color: C.paper, alpha: 0.92 }).stroke({ width: 5, color: INK });
    const t = poster('FIN', 50, INK);
    t.anchor.set(0.5);
    const k = txt('完', { fontFamily: F.poster, fontSize: 26, fill: 0xff7ab8 });
    k.anchor.set(0.5);
    k.position.set(44, -26);
    c.addChild(bg, t, k);
    c.position.set(x, y);
    c.rotation = -0.12;
    this.addChild(c);
    gsap.from(c.scale, { x: 3, y: 3, duration: 0.25, ease: 'back.out(2)' });
    gsap.to(c, { rotation: 0.05, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.fins.set(key, c);
  }
  finBoom(side: number, x: number, y: number, fizzle = false) {
    for (const [key, c] of this.fins) {
      if (!key.startsWith(`${side}:`) || Math.hypot(c.x - x, c.y - y) > 4) continue;
      this.fins.delete(key);
      gsap.killTweensOf(c);
      gsap.to(c, { alpha: 0, duration: fizzle ? 0.8 : 0.15, onComplete: () => c.destroy({ children: true }) });
    }
  }
  setEclipse(on: boolean) {
    if (on && !this.eclipse) {
      const c = new Container();
      const g = new Graphics();
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        g.moveTo(Math.cos(a) * 70, Math.sin(a) * 70).lineTo(Math.cos(a) * 120, Math.sin(a) * 120).stroke({ width: 6, color: 0xffe9b0, alpha: 0.8 });
      }
      g.circle(0, 0, 74).fill(0xffe9b0);
      g.circle(0, 0, 66).fill(0x000000);
      c.addChild(g);
      c.position.set(960, 200);
      this.addChild(c);
      gsap.from(c, { alpha: 0, duration: 0.6 });
      gsap.to(c, { rotation: Math.PI * 2, duration: 30, repeat: -1, ease: 'none' });
      this.eclipse = c;
    } else if (!on && this.eclipse) {
      const c = this.eclipse;
      this.eclipse = null;
      gsap.killTweensOf(c);
      gsap.to(c, { alpha: 0, duration: 0.5, onComplete: () => c.destroy({ children: true }) });
    }
  }
}
