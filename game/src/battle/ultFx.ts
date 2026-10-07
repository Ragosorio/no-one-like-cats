/**
 * Set pieces of the signature ultimates (battle/ults.ts). The sim already resolved everything; this
 * only stages it: `pre` plays before the projectiles fly (the sun darkens the sky, the slashes…), `at`
 * plays when its event comes up during the flight (the black hole opens where the orb lands, FIN gets
 * written…). Persistent marks (FIN words, the eclipse) live in UltMarks.
 */
import { ColorMatrixFilter, Container, Graphics } from 'pixi.js';
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
import { CELL } from './ship';

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
  /** redraw the field state (wells…) right now */
  sync?: () => void;
}
/** a divine that stays on the field becomes visible at its impact */
function reveal(ctx: UltCtx, kind: 'sun' | 'horizon') {
  for (const w of ctx.sim.wells) if (w.kind === kind) w.hidden = false;
  ctx.sync?.();
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** set pieces that play BEFORE the projectiles fly (BattleScene.PRE_FX adds these) */
export const ULT_PRE_FX = ['cutlass', 'yokozuna', 'valkyrie', 'grimoire', 'horizon', 'sundown', 'senjin', 'bigbang', 'aurora', 'cathedral', 'midnight', 'wallofsound', 'nobody', 'timestop'] as const;
/** a falling sun / the Big Bang's black screen waiting (from the pre set piece) for the impact event */
let pendingSun: Container | null = null;
let pendingVoid: Container | null = null;

/** HEROICO / DIVINO title card: a heavier banner with the rarity under it */
function bigBanner(ctx: UltCtx, text: string, color: number, sub: string, rarity: 'HEROICO' | 'DIVINO') {
  const c = new Container();
  const divine = rarity === 'DIVINO';
  const band = new Graphics().rect(-300, -96, 2520, 192).fill(divine ? 0xfff6ea : 0x5a0a14);
  band.rect(-300, -96, 2520, 10).fill(divine ? 0xe8c46a : 0xffc94a).rect(-300, 86, 2520, 10).fill(divine ? 0xe8c46a : 0xffc94a);
  band.rotation = -0.04;
  const t = poster(text, 104, color, { stroke: { color: INK, width: 12 } });
  t.anchor.set(0.5);
  t.rotation = -0.04;
  t.y = -14;
  const s = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: divine ? INK : C.paper });
  s.anchor.set(0.5);
  s.y = 62;
  s.rotation = -0.04;
  if (s.width > 1500) s.scale.set(1500 / s.width);
  // the rarity badge, pinned to the band's top edge
  const tag = new Container();
  const tt = poster(rarity, 30, divine ? INK : 0xffe08a);
  tt.anchor.set(0.5);
  const tb = new Graphics().rect(-tt.width / 2 - 16, -tt.height / 2 - 4, tt.width + 32, tt.height + 8).fill(divine ? 0xe8c46a : C.red).stroke({ width: 5, color: INK });
  tag.addChild(tb, tt);
  tag.position.set(-t.width / 2 - 40, -96);
  tag.rotation = -0.08;
  c.addChild(band, t, s, tag);
  c.position.set(960, 300);
  ctx.overlay.addChild(c);
  gsap.from(band.scale, { x: 0, duration: 0.22, ease: 'power3.out' });
  gsap.from(t.scale, { x: 2.6, y: 2.6, duration: 0.26, ease: 'back.out(2)' });
  gsap.to(c, { alpha: 0, delay: 1.6, duration: 0.35, onComplete: () => c.destroy({ children: true }) });
}

/** overlay-space rectangle covering the whole screen */
function veil(ctx: UltCtx, color: number, alpha: number, dur = 0.3) {
  const g = new Graphics().rect(-400, -300, 2720, 1680).fill(color);
  g.alpha = 0;
  ctx.overlay.addChildAt(g, 0);
  gsap.to(g, { alpha, duration: dur });
  return g;
}

/** a six-armed snowflake (Bóreas) */
function snowflake(g: Graphics, r: number, color: number) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    g.moveTo(0, 0).lineTo(ca * r, sa * r);
    for (const k of [0.45, 0.7]) {
      const bx = ca * r * k;
      const by = sa * r * k;
      const l = r * (0.85 - k) * 0.9;
      g.moveTo(bx, by).lineTo(bx + Math.cos(a + 0.7) * l, by + Math.sin(a + 0.7) * l);
      g.moveTo(bx, by).lineTo(bx + Math.cos(a - 0.7) * l, by + Math.sin(a - 0.7) * l);
    }
  }
  g.stroke({ width: 10, color: INK, cap: 'round' });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.moveTo(0, 0).lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.stroke({ width: 5, color, cap: 'round' });
  g.circle(0, 0, r * 0.16).fill(color).stroke({ width: 4, color: INK });
}

/** Cronos: the battlefield turns into an old sepia photograph for `dur` seconds (returns the undo) */
function sepia(ctx: UltCtx, dur: number) {
  const world = ctx.wfx.parent;
  if (!world || world.destroyed) return () => undefined;
  const cm = new ColorMatrixFilter();
  cm.sepia(false);
  world.filters = [...(world.filters ?? []), cm];
  let done = false;
  const undo = () => {
    if (done) return;
    done = true;
    if (!world.destroyed) world.filters = (world.filters ?? []).filter((f) => f !== cm);
  };
  window.setTimeout(undo, dur * 1000);
  return undo;
}

/** banner across the screen for the big ones (the multiverse legendaries tint the band with their element) */
function banner(ctx: UltCtx, text: string, color: number, sub?: string, bandColor = INK) {
  const c = new Container();
  const band = new Graphics().rect(-300, -70, 2520, 140).fill(bandColor);
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
    // ================================================================ HEROICOS
    case 'cutlass': {
      // one flaming cutlass stroke across the whole enemy deck, through every cat
      bigBanner(ctx, '百刃斬り ¡ABORDAJE!', 0xff6a1a, 'UN ESPADAZO A TODOS SUS GATOS · ARDIENDO', 'HEROICO');
      const s = ctx.sim.sides[e.side];
      const cats = s.cats.filter((c) => !c.ko);
      const ys = cats.map((c) => ctx.catViews.get(c.def.uid)).filter((v): v is BattleCat => !!v && !v.destroyed).map((v) => ctx.wfx.toLocal(v.getGlobalPosition()).y - 60);
      const y = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : e.y;
      const x0 = e.x - 520;
      const x1 = e.x + 520;
      const g = new Graphics();
      g.moveTo(x0, y + 40).quadraticCurveTo(e.x, y - 50, x1, y + 30).stroke({ width: 40, color: INK, cap: 'round' });
      g.moveTo(x0, y + 40).quadraticCurveTo(e.x, y - 50, x1, y + 30).stroke({ width: 22, color: 0xff6a1a, cap: 'round' });
      g.moveTo(x0, y + 40).quadraticCurveTo(e.x, y - 50, x1, y + 30).stroke({ width: 8, color: 0xfff2c0, cap: 'round' });
      // the cut "draws itself" left to right (a mask that grows from the bow)
      const m = new Graphics().rect(0, -200, 1, 400).fill(0xffffff);
      m.position.set(x0 - 60, y);
      g.mask = m;
      ctx.wfx.addChild(g, m);
      sfx('whoosh');
      gsap.to(m.scale, { x: x1 - x0 + 140, duration: fast ? 0.05 : 0.22, ease: 'power4.in' });
      for (let i = 0; i < 8; i++) window.setTimeout(() => ctx.fxp.burst(x0 + (i / 7) * (x1 - x0), y + Math.sin(i) * 20, { count: 10, tint: [0xff6a1a, 0xffd400, INK], speed: [80, 320], gravity: 300 }), 40 + i * 22);
      await wait(fast ? 60 : 230);
      for (const c of cats) {
        const bc = ctx.catViews.get(c.def.uid);
        if (!bc || bc.destroyed) continue;
        const gp = ctx.wfx.toLocal(bc.getGlobalPosition());
        onomatopoeia(ctx.wfx, gp.x, gp.y - 170, '¡ZAS!', { color: 0xffc94a, size: 66 });
        bc.impactFrame?.(90, false);
      }
      sfx('hit', 1.1);
      ctx.shaker.add(0.6);
      gsap.to(g, { alpha: 0, delay: 0.35, duration: 0.3, onComplete: () => (g.destroy(), m.destroy()) });
      await wait(fast ? 80 : 300);
      break;
    }
    case 'yokozuna': {
      bigBanner(ctx, '横綱 ¡DOSUKOI!', 0xe0b77a, 'SU BARCO QUEDA DE PIEDRA · LA QUILLA ENEMIGA VA A TEMBLAR', 'HEROICO');
      for (let i = 0; i < 2; i++)
        window.setTimeout(() => {
          sfx('bigboom', 0.5);
          ctx.shaker.add(0.7);
          ctx.fxp.burst(e.x + (i ? 160 : -160), e.y + 200, { count: 26, tint: [0xc4bdab, 0x8a7a62, INK], speed: [150, 500], angle: [-Math.PI * 0.95, -Math.PI * 0.05], gravity: 600, stepped: true });
          onomatopoeia(ctx.wfx, e.x + (i ? 160 : -160), e.y - 160, i ? '¡KOI!' : '¡DOSU!', { color: 0xe0b77a, size: 90 });
        }, i * 320);
      await wait(fast ? 200 : 700);
      break;
    }
    case 'valkyrie': {
      bigBanner(ctx, '戦乙女 ¡AL VALHALLA!', 0xffe14a, 'UNA LANZA DESDE EL CIELO: TODA LA COLUMNA, EMPAPADA Y ELECTROCUTADA', 'HEROICO');
      const dark = veil(ctx, 0x0d1020, 0.5, 0.2);
      // wings over the sky (two fans of feathers)
      const o = ctx.toOverlay(e.x, 160);
      const wings = new Container();
      for (const dir of [-1, 1]) {
        const w = new Graphics();
        for (let i = 0; i < 6; i++) {
          const a = -0.25 - i * 0.2;
          const len = 300 - i * 24;
          w.poly([0, 0, Math.cos(a) * len * dir, Math.sin(a) * len, Math.cos(a - 0.16) * (len - 40) * dir, Math.sin(a - 0.16) * (len - 40)]).fill(i % 2 ? 0xffffff : 0xdff6ff).stroke({ width: 4, color: INK });
        }
        wings.addChild(w);
      }
      wings.position.set(Math.max(420, Math.min(1500, o.x)), 470);
      ctx.overlay.addChild(wings);
      gsap.from(wings.scale, { x: 0.1, y: 0.1, duration: 0.3, ease: 'back.out(2)' });
      gsap.to(wings, { alpha: 0, delay: 0.9, duration: 0.3, onComplete: () => wings.destroy({ children: true }) });
      for (let i = 0; i < 3; i++) window.setTimeout(() => !settings.reduceFlashes && flash(ctx.overlay, 0xfff6a8, 0.45, 0.08), 120 + i * 140);
      sfx('zap');
      await wait(fast ? 200 : 650);
      gsap.to(dark, { alpha: 0, duration: 0.6, delay: 0.5, onComplete: () => dark.destroy() });
      break;
    }
    case 'grimoire': {
      bigBanner(ctx, '禁書 PÁGINA 666', 0xd8a8ee, 'MALDICE SUS MEJORES MÓDULOS Y LES ROBA LA BARRA DE ULTI', 'HEROICO');
      const book = new Container();
      const cover = new Graphics().roundRect(-230, -150, 460, 300, 16).fill(0x5c3d5b).stroke({ width: 8, color: INK });
      const pageL = new Graphics().roundRect(-215, -135, 210, 270, 6).fill(0xf3e9d8).stroke({ width: 4, color: INK });
      const pageR = new Graphics().roundRect(5, -135, 210, 270, 6).fill(0xf3e9d8).stroke({ width: 4, color: INK });
      for (let i = 0; i < 6; i++) {
        pageL.rect(-195, -110 + i * 36, 160 - (i % 3) * 20, 6).fill({ color: 0x8f6b93, alpha: 0.8 });
        pageR.rect(25, -110 + i * 36, 170 - (i % 2) * 30, 6).fill({ color: 0x8f6b93, alpha: 0.8 });
      }
      const rune = txt('猫', { fontFamily: F.poster, fontSize: 120, fill: 0xff7ab8 });
      rune.anchor.set(0.5);
      rune.position.set(110, 0);
      book.addChild(cover, pageL, pageR, rune);
      book.position.set(960, 560);
      ctx.overlay.addChild(book);
      gsap.from(book.scale, { x: 0, y: 0.4, duration: 0.3, ease: 'back.out(2)' });
      for (let i = 0; i < 4; i++) {
        const flip = new Graphics().roundRect(0, -135, 210, 270, 6).fill(0xfffaf0).stroke({ width: 3, color: INK });
        flip.position.set(5, 0);
        book.addChild(flip);
        gsap.to(flip.scale, { x: -1, duration: 0.18, delay: 0.15 + i * 0.1, ease: 'power1.in', onComplete: () => flip.destroy() });
      }
      sfx('reveal');
      gsap.to(book, { alpha: 0, delay: 1, duration: 0.3, onComplete: () => book.destroy({ children: true }) });
      await wait(fast ? 200 : 700);
      break;
    }
    // ================================================================ DIVINOS
    case 'horizon': {
      bigBanner(ctx, '零点 NADA ESCAPA', 0xff2e88, 'UN AGUJERO NEGRO ENCIMA DE SU BARCO · 3 TURNOS · SUS TIROS DESAPARECEN', 'DIVINO');
      const dark = veil(ctx, 0x000000, 0.72, 0.35);
      sfx('glitch');
      // static: TV noise for a beat
      const noise = new Graphics();
      ctx.overlay.addChild(noise);
      let n = 0;
      const iv = window.setInterval(() => {
        if (noise.destroyed || ++n > 14) {
          window.clearInterval(iv);
          if (!noise.destroyed) noise.destroy();
          return;
        }
        noise.clear();
        for (let i = 0; i < 40; i++) noise.rect(Math.random() * 1920, Math.random() * 1080, 4 + Math.random() * 60, 2 + Math.random() * 4).fill({ color: i % 3 ? 0xffffff : 0xff2e88, alpha: 0.5 });
      }, 50);
      await wait(fast ? 200 : 750);
      gsap.to(dark, { alpha: 0.35, duration: 0.4, onComplete: () => gsap.to(dark, { alpha: 0, delay: 1.2, duration: 0.6, onComplete: () => dark.destroy() }) });
      break;
    }
    case 'sundown': {
      bigBanner(ctx, '落日 ¡SE CAE EL SOL!', 0xffd400, 'EL SOL ENTERO SOBRE SU BARCO · TODO ARDE · CEGADOS', 'DIVINO');
      const glow = veil(ctx, 0xffb02e, 0.3, 0.6);
      const o = ctx.toOverlay(e.x, e.y);
      const sun = new Container();
      const rays = new Graphics();
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        rays.poly([Math.cos(a - 0.08) * 150, Math.sin(a - 0.08) * 150, Math.cos(a) * 260, Math.sin(a) * 260, Math.cos(a + 0.08) * 150, Math.sin(a + 0.08) * 150]).fill(i % 2 ? 0xff6a1a : 0xffd400);
      }
      const disc = new Graphics().circle(0, 0, 170).fill(0xffd400).stroke({ width: 10, color: INK }).circle(0, 0, 120).fill(0xfff2c0);
      sun.addChild(rays, disc);
      sun.position.set(o.x, -320);
      ctx.overlay.addChild(sun);
      gsap.to(rays, { rotation: Math.PI, duration: 4, ease: 'none' });
      gsap.to(sun, { y: 120, duration: fast ? 0.2 : 0.9, ease: 'power1.in' });
      gsap.to(sun.scale, { x: 1.35, y: 1.35, duration: 0.9 });
      sfx('charge', 0.5);
      pendingSun = sun;
      await wait(fast ? 200 : 900);
      gsap.to(glow, { alpha: 0.55, duration: 0.3, onComplete: () => gsap.to(glow, { alpha: 0, delay: 0.8, duration: 0.6, onComplete: () => glow.destroy() }) });
      break;
    }
    case 'senjin': {
      bigBanner(ctx, '千刃 MIL CORTES', 0xc8102e, `${e.n ?? 7} CORTES DE SOMBRA A CADA UNO DE SUS GATOS`, 'DIVINO');
      const dark = veil(ctx, 0x0d110f, 0.62, 0.15);
      const s = ctx.sim.sides[e.side];
      const cats = s.cats.filter((c) => !c.ko);
      sfx('whoosh');
      const cuts = Math.min(9, e.n ?? 7);
      for (let k = 0; k < cuts; k++) {
        for (const c of cats) {
          const bc = ctx.catViews.get(c.def.uid);
          if (!bc || bc.destroyed) continue;
          const gp = ctx.wfx.toLocal(bc.getGlobalPosition());
          const a = Math.random() * Math.PI;
          const len = 230;
          const g = new Graphics();
          const dx = Math.cos(a) * len * 0.5;
          const dy = Math.sin(a) * len * 0.5;
          g.moveTo(-dx, -dy).lineTo(dx, dy).stroke({ width: 12, color: 0xc8102e, cap: 'round' }).moveTo(-dx, -dy).lineTo(dx, dy).stroke({ width: 4, color: 0xffffff, cap: 'round' });
          g.position.set(gp.x + (Math.random() - 0.5) * 40, gp.y - 70 + (Math.random() - 0.5) * 40);
          g.scale.set(0, 1);
          ctx.wfx.addChild(g);
          gsap.to(g.scale, { x: 1, duration: 0.06, ease: 'power4.out' });
          gsap.to(g, { alpha: 0, delay: 0.18, duration: 0.2, onComplete: () => g.destroy() });
          if (k === cuts - 1) {
            onomatopoeia(ctx.wfx, gp.x, gp.y - 180, '斬', { color: 0xc8102e, size: 110 });
            bc.impactFrame?.(90, false);
          }
        }
        sfx('hit', 1.2 + k * 0.08);
        ctx.shaker.add(0.12);
        await wait(fast ? 20 : 70);
      }
      gsap.to(dark, { alpha: 0, duration: 0.5, delay: 0.3, onComplete: () => dark.destroy() });
      break;
    }
    case 'bigbang': {
      // total silence: the screen goes black, one white dot where it will start
      const dark = veil(ctx, 0x000000, 0.93, 0.35);
      const o = ctx.toOverlay(e.x, e.y);
      const dot = new Graphics().circle(0, 0, 6).fill(0xffffff);
      dot.position.set(o.x, o.y);
      const t = txt('. . .', { fontFamily: F.poster, fontSize: 80, fill: C.paper });
      t.anchor.set(0.5);
      t.position.set(960, 300);
      const wrap = new Container();
      wrap.addChild(dark, dot, t);
      ctx.overlay.addChildAt(wrap, 0);
      gsap.to(dot.scale, { x: 2.5, y: 2.5, duration: 0.25, yoyo: true, repeat: 5, ease: 'sine.inOut' });
      pendingVoid = wrap;
      await wait(fast ? 250 : 1100);
      break;
    }
    // ================================================================ LEGENDARIOS DEL MULTIVERSO
    case 'aurora': {
      // AURORA ZERO: the night sky turns into curtains of aurora over their ship, then everything freezes
      banner(ctx, '極光零度 AURORA ZERO!', 0x9fe8ff, 'SUS CAÑONES SE CONGELAN · LA CUBIERTA ESCARCHADA REVIENTA ×2', 0x1f2b4a);
      const dark = veil(ctx, 0x0b1430, 0.55, 0.3);
      const sky = new Container();
      ctx.overlay.addChildAt(sky, 1);
      const cols = [0x7cffc4, 0xb59cff, 0x9fe8ff];
      for (let r = 0; r < 3; r++) {
        const g = new Graphics();
        const base = 300 + r * 90;
        // a curtain: thin rays, faint on top, bright on the lower edge (the way an aurora hangs)
        for (let x = -120; x < 2040; x += 6) {
          const y = base + Math.sin(x / 230 + r * 1.7) * 80 + Math.sin(x / 61 + r) * 10;
          const h = 190 + Math.sin(x / 90 + r) * 70 + r * 30;
          const k = 0.55 + 0.45 * Math.abs(Math.sin(x / 160 + r * 2));
          g.rect(x, y - h, 4, h).fill({ color: cols[r], alpha: 0.12 * k });
          g.rect(x, y - h * 0.45, 4, h * 0.45).fill({ color: cols[r], alpha: 0.2 * k });
          g.rect(x, y - 14, 4, 14).fill({ color: r === 1 ? 0xe6dcff : 0xeafff6, alpha: 0.55 * k });
        }
        sky.addChild(g);
        gsap.fromTo(g, { alpha: 0, x: -220 + r * 60 }, { alpha: 1, x: 40 - r * 40, duration: fast ? 0.3 : 1.4, ease: 'sine.out' });
      }
      for (let i = 0; i < 8; i++) window.setTimeout(() => ctx.fxp.burst(e.x + (Math.random() - 0.5) * 600, e.y - 260, { count: 10, tint: [0xffffff, 0x9fe8ff, 0x7cffc4], angle: [Math.PI * 0.35, Math.PI * 0.65], speed: [60, 180], gravity: 140, life: [0.8, 1.4] }), i * 90);
      sfx('freeze', 0.8);
      sfx('charge', 0.7);
      await wait(fast ? 200 : 800);
      gsap.to([dark, sky], { alpha: 0, delay: 0.9, duration: 0.6, onComplete: () => (dark.destroy(), sky.destroy({ children: true })) });
      break;
    }
    case 'cathedral': {
      // HALO JUDGEMENT: an art-déco halo opens over their ship and the light comes down like through stained glass
      banner(ctx, '光輪の審判 HALO JUDGEMENT!', 0xffd77a, 'UNA CATEDRAL DE LUZ: CADA RAYO ATRAVIESA 6 FILAS · CEGADOS Y DESLUMBRADOS', 0x3a2c14);
      const glow = veil(ctx, 0xfff8e1, 0.3, 0.4);
      const s = ctx.sim.sides[e.side];
      const o = ctx.toOverlay(e.x, e.y);
      const hx = Math.max(300, Math.min(1620, o.x));
      const hy = 130;
      // the windows: one shaft of colored light per beam, from the halo to their deck
      const shafts = new Graphics();
      const glass = [0xe8879a, 0x7fd8ff, 0xffd77a, 0xfff8e1];
      const n = e.n ?? 5;
      const x0 = s.setup.origin.x + CELL * 0.5;
      const x1 = s.setup.origin.x + (s.ship.cols - 0.5) * CELL;
      for (let i = 0; i < n; i++) {
        const t = ctx.toOverlay(x0 + ((i + 0.5) / n) * (x1 - x0), e.y);
        shafts.poly([hx - 14, hy, hx + 14, hy, t.x + 46, t.y, t.x - 46, t.y]).fill({ color: glass[i % glass.length], alpha: 0.32 });
      }
      shafts.blendMode = 'add';
      shafts.alpha = 0;
      ctx.overlay.addChild(shafts);
      const halo = new Container();
      const rays = new Graphics();
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const len = i % 2 ? 210 : 290;
        rays.poly([Math.cos(a - 0.04) * 118, Math.sin(a - 0.04) * 118, Math.cos(a) * len, Math.sin(a) * len, Math.cos(a + 0.04) * 118, Math.sin(a + 0.04) * 118]).fill(i % 2 ? 0xffd77a : 0xb89558);
      }
      const ring = new Graphics().circle(0, 0, 140).stroke({ width: 22, color: INK }).circle(0, 0, 140).stroke({ width: 14, color: 0xffd77a }).circle(0, 0, 104).stroke({ width: 6, color: 0xfff8e1 });
      // déco steps around the ring
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const st = new Graphics().rect(-14, -10, 28, 20).fill(0xfff8e1).stroke({ width: 4, color: INK }).rect(-8, -18, 16, 8).fill(0xffd77a).stroke({ width: 3, color: INK });
        st.position.set(Math.cos(a) * 140, Math.sin(a) * 140);
        st.rotation = a + Math.PI / 2;
        halo.addChild(st);
      }
      halo.addChildAt(rays, 0);
      halo.addChildAt(ring, 1);
      halo.position.set(hx, hy);
      halo.scale.set(0.75, 0.42);
      ctx.overlay.addChild(halo);
      gsap.from(halo.scale, { x: 0, y: 0, duration: 0.35, ease: 'back.out(2)' });
      gsap.to(rays, { rotation: Math.PI / 4, duration: 2.5, ease: 'none' });
      gsap.to(shafts, { alpha: 1, delay: 0.35, duration: 0.25 });
      for (let i = 0; i < 3; i++) window.setTimeout(() => sfx('gem', 0.8 + i * 0.2), 120 + i * 160);
      sfx('reveal');
      await wait(fast ? 200 : 750);
      gsap.to([halo, shafts], { alpha: 0, delay: 0.8, duration: 0.5, onComplete: () => (halo.destroy({ children: true }), shafts.destroy()) });
      gsap.to(glow, { alpha: 0, delay: 0.8, duration: 0.6, onComplete: () => glow.destroy() });
      break;
    }
    case 'midnight': {
      // ENDLESS MIDNIGHT: the lights go out and the crown of eyes opens, one eye at a time, all looking at them
      const dark = veil(ctx, 0x0d110f, 0.82, 0.25);
      banner(ctx, '永遠の真夜中 ENDLESS MIDNIGHT!', 0xc8102e, `${e.n ?? 2} TURNOS MÁS: SUS TIROS NO SE VEN Y CADA UNO APUÑALA`, 0x0d110f);
      const crown = new Container();
      crown.position.set(960, 800);
      const look = Math.sign(ctx.toOverlay(e.x, e.y).x - 960) || 1;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + ((i + 0.5) / 9) * Math.PI;
        const big = i === 4;
        const eye = new Container();
        const w = big ? 62 : 42;
        const h = big ? 26 : 17;
        const g = new Graphics().moveTo(-w, 0).quadraticCurveTo(0, -h * 2, w, 0).quadraticCurveTo(0, h * 2, -w, 0).fill(0xeae1d3).stroke({ width: 5, color: INK });
        const iris = new Graphics().circle(0, 0, h * 0.95).fill(0xc8102e).ellipse(0, 0, h * 0.22, h * 0.8).fill(INK);
        iris.x = look * w * 0.3;
        eye.addChild(g, iris);
        eye.position.set(Math.cos(a) * 560, Math.sin(a) * 340 - (big ? 30 : 0));
        eye.scale.y = 0;
        crown.addChild(eye);
        gsap.to(eye.scale, { y: 1, duration: 0.12, delay: (fast ? 0.01 : 0.07) * Math.abs(i - 4), ease: 'power2.out' });
        // they blink together before it starts
        gsap.to(eye.scale, { y: 0.1, duration: 0.06, delay: fast ? 0.2 : 0.75, yoyo: true, repeat: 1 });
      }
      ctx.overlay.addChild(crown);
      sfx('sting');
      window.setTimeout(() => sfx('whoosh', 0.6), 300);
      await wait(fast ? 220 : 950);
      gsap.to(crown, { alpha: 0, duration: 0.4, onComplete: () => crown.destroy({ children: true }) });
      gsap.to(dark, { alpha: 0.35, duration: 0.4, onComplete: () => gsap.to(dark, { alpha: 0, delay: 1, duration: 0.6, onComplete: () => dark.destroy() }) });
      break;
    }
    case 'wallofsound': {
      // WALL OF SOUND: a concert poster — riso halftone, the speaker wall rises next to their ship
      const bg = veil(ctx, 0x231626, 0.45, 0.2);
      const dots = new Graphics();
      for (let y = 0; y < 1080; y += 48)
        for (let x = 0; x < 1920; x += 48) {
          const r = 3 + 10 * ((Math.sin(x / 180) + Math.cos(y / 150) + 2) / 4);
          dots.circle(x, y, r).fill({ color: 0xff2e88, alpha: 0.22 }).circle(x + 6, y + 4, r * 0.8).fill({ color: 0x2ec4e6, alpha: 0.16 });
        }
      ctx.overlay.addChildAt(dots, 1);
      banner(ctx, '音の壁 WALL OF SOUND!', 0xffd400, 'UNA ONDA POR CUBIERTA QUE ATRAVIESA TODO · ATURDE A SUS GATOS', 0x231626);
      const wall = new Container();
      const woofers: Graphics[] = [];
      const rows = Math.max(3, Math.min(5, (e.n ?? 3) + 1));
      for (let cx = 0; cx < 2; cx++)
        for (let r = 0; r < rows; r++) {
          const cab = new Graphics().roundRect(-38, -38, 76, 76, 6).fill(0x231626).stroke({ width: 5, color: INK });
          const wf = new Graphics().circle(0, 0, 26).fill(0x3a2a40).stroke({ width: 5, color: 0xffd400 }).circle(0, 0, 9).fill(0xff2e88);
          wf.position.set((cx - 0.5) * 80, (r - (rows - 1) / 2) * 80);
          woofers.push(wf);
          cab.position.set((cx - 0.5) * 80, (r - (rows - 1) / 2) * 80);
          wall.addChild(cab, wf);
        }
      wall.position.set(e.x, e.y);
      ctx.wfx.addChild(wall);
      gsap.from(wall, { y: e.y + 500, duration: fast ? 0.1 : 0.35, ease: 'back.out(1.4)' });
      onomatopoeia(ctx.wfx, e.x, e.y - rows * 40 - 70, '¡ONE, TWO…!', { color: 0xffd400, size: 64 });
      sfx('drumroll', 1.4);
      await wait(fast ? 150 : 550);
      for (const w of woofers) gsap.to(w.scale, { x: 1.3, y: 1.3, duration: 0.06, yoyo: true, repeat: 7 });
      sfx('charge', 1.2);
      await wait(fast ? 80 : 300);
      gsap.to(wall, { alpha: 0, delay: 1.4, duration: 0.4, onComplete: () => wall.destroy({ children: true }) });
      gsap.to([bg, dots], { alpha: 0, delay: 0.7, duration: 0.5, onComplete: () => (bg.destroy(), dots.destroy()) });
      break;
    }
    case 'nobody': {
      // DEAD CHANNEL: the screen becomes a dead channel; one white eye opens. Nobody sees you.
      const dark = veil(ctx, 0x000000, 0.9, 0.15);
      const noise = new Graphics();
      ctx.overlay.addChild(noise);
      let k = 0;
      const iv = window.setInterval(() => {
        if (noise.destroyed || ++k > 20) {
          window.clearInterval(iv);
          if (!noise.destroyed) noise.destroy();
          return;
        }
        noise.clear();
        for (let i = 0; i < 70; i++) noise.rect(Math.random() * 1920, Math.random() * 1080, 4 + Math.random() * 90, 2 + Math.random() * 3).fill({ color: i % 4 ? 0xffffff : 0xff2e88, alpha: 0.35 });
      }, 50);
      const eye = new Container();
      const lid = new Graphics().moveTo(-150, 0).quadraticCurveTo(0, -105, 150, 0).quadraticCurveTo(0, 105, -150, 0).fill(0xffffff);
      const pupil = new Graphics().circle(0, 0, 30).fill(0x0d110f).circle(-9, -9, 7).fill(0xffffff);
      eye.addChild(lid, pupil);
      eye.position.set(960, 440);
      eye.scale.y = 0;
      ctx.overlay.addChild(eye);
      gsap.to(eye.scale, { y: 1, duration: 0.18, delay: fast ? 0.05 : 0.3, ease: 'power2.out' });
      const title = new Container();
      const ghost = poster('NADIE TE VE', 130, 0xff2e88);
      ghost.anchor.set(0.5);
      ghost.position.set(7, 4);
      const t = poster('NADIE TE VE', 130, 0xffffff, { stroke: { color: INK, width: 10 } });
      t.anchor.set(0.5);
      const sub = txt('DEAD CHANNEL · BORRA UNA FRANJA DE SU BARCO Y SE COME TODOS SUS ESCUDOS', { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: C.paper });
      sub.anchor.set(0.5);
      sub.y = 92;
      title.addChild(ghost, t, sub);
      title.position.set(960, 700);
      title.alpha = 0;
      ctx.overlay.addChild(title);
      gsap.to(title, { alpha: 1, delay: fast ? 0.05 : 0.45, duration: 0.1 });
      gsap.to(ghost, { x: -7, duration: 0.05, repeat: 9, yoyo: true, delay: 0.5 });
      sfx('glitch');
      window.setTimeout(() => sfx('glitch', 0.7), 420);
      await wait(fast ? 250 : 1050);
      gsap.to(eye.scale, { y: 0, duration: 0.1, onComplete: () => eye.destroy({ children: true }) });
      gsap.to(title, { alpha: 0, duration: 0.25, onComplete: () => title.destroy({ children: true }) });
      gsap.to(dark, { alpha: 0, duration: 0.4, onComplete: () => dark.destroy() });
      break;
    }
    case 'timestop': {
      // ETERNAL SECOND: the world turns into an old daguerreotype and a giant clock stops
      banner(ctx, '永遠の一秒 ETERNAL SECOND', 0xe0b77a, e.n ? 'TIME STOP: SUS GATOS PIERDEN SU PRÓXIMO TURNO' : 'EL TIEMPO NO SE DEJA DETENER DOS VECES SEGUIDAS', 0x1c3a51);
      const tint = veil(ctx, 0x6b4f2a, 0.3, 0.3);
      const unSepia = sepia(ctx, fast ? 0.6 : 1.9);
      const clock = new Container();
      const face = new Graphics().circle(0, 0, 262).fill({ color: 0xd9c29a, alpha: 0.94 }).stroke({ width: 12, color: INK }).circle(0, 0, 232).stroke({ width: 4, color: 0x6b4f2a });
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const r0 = i % 5 ? 218 : 196;
        face.moveTo(Math.cos(a) * r0, Math.sin(a) * r0).lineTo(Math.cos(a) * 228, Math.sin(a) * 228).stroke({ width: i % 5 ? 3 : 7, color: INK });
      }
      clock.addChild(face);
      ['XII', 'III', 'VI', 'IX'].forEach((n, i) => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const t = poster(n, 46, 0x1c3a51);
        t.anchor.set(0.5);
        t.position.set(Math.cos(a) * 160, Math.sin(a) * 160);
        clock.addChild(t);
      });
      const hour = new Graphics().roundRect(-7, -140, 14, 160, 7).fill(INK);
      const minute = new Graphics().roundRect(-4, -210, 8, 230, 4).fill(INK);
      const pin = new Graphics().circle(0, 0, 16).fill(0xe0b77a).stroke({ width: 5, color: INK });
      clock.addChild(hour, minute, pin);
      clock.position.set(960, 650);
      clock.scale.set(0.82);
      ctx.overlay.addChild(clock);
      gsap.from(clock.scale, { x: 0.15, y: 0.15, duration: 0.3, ease: 'back.out(2)' });
      // the hands run BACKWARDS, faster and faster… and stop dead
      const spin = fast ? 0.3 : 0.95;
      gsap.to(minute, { rotation: -Math.PI * 8, duration: spin, ease: 'power2.in' });
      gsap.to(hour, { rotation: -Math.PI * 1.5, duration: spin, ease: 'power2.in' });
      for (let i = 0; i < 6; i++) window.setTimeout(() => sfx('tick', 1 + i * 0.12), i * 150);
      await wait(fast ? 300 : 1000);
      gsap.killTweensOf([minute, hour]);
      sfx('sting', 0.8);
      ctx.shaker.add(0.4);
      onomatopoeia(ctx.overlay, 960, 280, e.n ? '¡TIME STOP!' : '…', { color: 0xe0b77a, size: 110 });
      await wait(fast ? 80 : 350);
      gsap.to(clock, { alpha: 0, duration: 0.4, onComplete: () => clock.destroy({ children: true }) });
      gsap.to(tint, { alpha: 0, delay: 0.5, duration: 0.6, onComplete: () => tint.destroy() });
      void unSepia;
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
    // ================================================================ HEROICOS
    case 'quake': {
      sfx('bigboom', 0.7);
      ctx.shaker.add(1.1);
      const w = 520;
      for (let i = 0; i < 9; i++) ctx.fxp.burst(e.x - w + (i / 8) * w * 2, e.y + 20, { count: 12, tint: [0xc4bdab, 0x8a7a62, INK], speed: [200, 600], angle: [-Math.PI * 0.9, -Math.PI * 0.1], gravity: 700, stepped: true });
      onomatopoeia(ctx.wfx, e.x, e.y - 260, '¡TERREMOTO!', { color: 0xe0b77a, size: 100 });
      ctx.flt(e.x, e.y - 330, 'LA QUILLA ENTERA TIEMBLA', { color: C.paper, size: 30, font: F.poster, dur: 1.6 });
      break;
    }
    case 'drain': {
      sfx('gem');
      for (let i = 0; i < 14; i++) {
        const g = new Graphics().circle(0, 0, 10).fill(0xd8a8ee).stroke({ width: 3, color: INK });
        g.position.set(e.x + (Math.random() - 0.5) * 400, e.y + Math.random() * 200);
        ctx.wfx.addChild(g);
        gsap.to(g, { x: 1920 - e.x + (Math.random() - 0.5) * 300, y: e.y - 60 - Math.random() * 120, duration: 0.7, delay: i * 0.03, ease: 'power2.in', onComplete: () => g.destroy() });
      }
      ctx.flt(e.x, e.y, `ROBA ${e.n ?? 40}% DE BARRA A CADA GATO${e.w ? ' · SE LA DA A TU TRIPULACIÓN' : ''}`, { color: 0xd8a8ee, size: 30, font: F.poster, dur: 2 });
      break;
    }
    // ================================================================ DIVINOS
    case 'horizonOpen': {
      reveal(ctx, 'horizon');
      sfx('bigboom', 0.4);
      sfx('glitch');
      if (!settings.reduceFlashes) flash(ctx.overlay, 0x2a0030, 0.75, 0.5);
      onomatopoeia(ctx.wfx, e.x, e.y - 170, 'ZWOOOOOM', { color: 0xff2e88, size: 130 });
      ctx.flt(e.x, e.y - 260, 'HORIZONTE DE EVENTOS: SE TRAGA SU BARCO 3 TURNOS', { color: C.paper, size: 30, font: F.poster, dur: 2.2 });
      speedLines(ctx.wfx, e.x, e.y, 0xff2e88, 60, 0.8);
      ctx.shaker.add(1);
      break;
    }
    case 'horizonTick': {
      sfx('boom', 0.6);
      onomatopoeia(ctx.wfx, e.x, e.y - 130, '¡GLUP!', { color: 0x00e5ff, size: 90 });
      ctx.flt(e.x, e.y - 210, 'EL AGUJERO SE TRAGA MÁS · −25% DE BARRA A SUS GATOS', { color: C.paper, size: 26, font: F.poster, dur: 1.8 });
      ctx.shaker.add(0.4);
      break;
    }
    case 'eaten': {
      sfx('pop', 0.6);
      ctx.flt(e.x, e.y - 40, '¡TRAGADO!', { color: 0xff7ab8, size: 34, font: F.poster });
      ctx.fxp.burst(e.x, e.y, { count: 10, tint: [0xff2e88, 0x00e5ff, 0xffffff], speed: [40, 160], life: [0.2, 0.5] });
      break;
    }
    case 'sunImpact': {
      reveal(ctx, 'sun');
      const sun = pendingSun;
      pendingSun = null;
      if (sun && !sun.destroyed) {
        const o = ctx.toOverlay(e.x, e.y);
        gsap.killTweensOf(sun);
        gsap.to(sun, { y: o.y, duration: 0.12, ease: 'power2.in', onComplete: () => gsap.to(sun, { alpha: 0, duration: 0.35, onComplete: () => sun.destroy({ children: true }) }) });
        gsap.to(sun.scale, { x: 2.6, y: 2.6, duration: 0.45 });
      }
      if (!settings.reduceFlashes) flash(ctx.overlay, 0xfff6d8, 0.95, 0.7);
      sfx('bigboom', 0.8);
      sfx('boom', 0.5);
      onomatopoeia(ctx.wfx, e.x, e.y - 220, '¡FWOOOOOM!', { color: 0xffd400, size: 150 });
      for (let i = 0; i < 10; i++) window.setTimeout(() => ctx.fxp.burst(e.x + (Math.random() - 0.5) * 700, e.y + (Math.random() - 0.5) * 200, { count: 18, tint: [0xff6a1a, 0xffd400, 0xfff2c0, INK], speed: [150, 650], gravity: 250 }), i * 50);
      ctx.shaker.add(1.4);
      break;
    }
    case 'sunTick': {
      sfx('boom', 0.8);
      ctx.fxp.burst(e.x, e.y + 40, { count: 30, tint: [0xff6a1a, 0xffd400], speed: [100, 420], gravity: 200 });
      ctx.flt(e.x, e.y - 170, 'EL SOL SIGUE QUEMANDO', { color: 0xffd400, size: 30, font: F.poster, dur: 1.6 });
      ctx.shaker.add(0.3);
      break;
    }
    case 'bigbangBoom': {
      const v = pendingVoid;
      pendingVoid = null;
      if (v && !v.destroyed) gsap.to(v, { alpha: 0, duration: 0.5, onComplete: () => v.destroy({ children: true }) });
      if (!settings.reduceFlashes) flash(ctx.overlay, 0xffffff, 1, 0.8);
      sfx('bigboom', 1);
      window.setTimeout(() => sfx('bigboom', 0.6), 160);
      const halfW = Math.max(160, e.w ?? 300);
      // rings of the first explosion, the colors of a concert poster
      [0xff2e88, 0xffd400, 0x2ec4e6, 0xffffff].forEach((col, i) => {
        const r = new Graphics().circle(0, 0, 60).stroke({ width: 26 - i * 4, color: col });
        r.position.set(e.x, e.y);
        ctx.wfx.addChild(r);
        gsap.fromTo(r.scale, { x: 0.2, y: 0.2 }, { x: (halfW / 60) * (1.4 + i * 0.35), y: (halfW / 60) * (1 + i * 0.3), duration: 0.7 + i * 0.12, delay: i * 0.06, ease: 'power3.out' });
        gsap.to(r, { alpha: 0, delay: 0.45 + i * 0.1, duration: 0.5, onComplete: () => r.destroy() });
      });
      const core = new Graphics().circle(0, 0, halfW * 0.9).fill({ color: 0xffffff, alpha: 0.85 });
      core.position.set(e.x, e.y);
      ctx.wfx.addChild(core);
      gsap.fromTo(core.scale, { x: 0.05, y: 0.05 }, { x: 1, y: 0.8, duration: 0.25, ease: 'power4.out' });
      gsap.to(core, { alpha: 0, delay: 0.2, duration: 0.5, onComplete: () => core.destroy() });
      for (let i = 0; i < 12; i++) ctx.fxp.burst(e.x + (Math.random() - 0.5) * halfW * 1.6, e.y + (Math.random() - 0.5) * 220, { count: 16, tint: [0xff2e88, 0xffd400, 0x2ec4e6, INK], speed: [250, 900], gravity: 500, stepped: true });
      onomatopoeia(ctx.wfx, e.x, e.y - 260, '¡BIG BANG!', { color: 0xffd400, size: 170 });
      ctx.flt(e.x, e.y - 360, 'LA MITAD DEL BARCO, DE GOLPE', { color: C.paper, size: 34, font: F.poster, dur: 2.2 });
      speedLines(ctx.wfx, e.x, e.y, 0xffffff, 70, 0.8);
      ctx.shaker.add(2);
      break;
    }
    // ================================================================ LEGENDARIOS DEL MULTIVERSO
    case 'auroraFreeze': {
      const g = new Graphics();
      snowflake(g, 48, 0xeaf6ff);
      g.position.set(e.x, e.y);
      ctx.wfx.addChild(g);
      gsap.from(g.scale, { x: 0, y: 0, duration: 0.25, ease: 'back.out(3)' });
      gsap.to(g, { rotation: 0.6, duration: 1.4 });
      gsap.to(g, { alpha: 0, delay: 1.1, duration: 0.4, onComplete: () => g.destroy() });
      ctx.fxp.burst(e.x, e.y, { count: 16, tint: [0xeaf6ff, 0x9fe8ff, 0x4fa3d9], speed: [80, 300], gravity: 300, life: [0.3, 0.7], stepped: true });
      if (e.n) {
        onomatopoeia(ctx.wfx, e.x, e.y - 90, '¡CRIC!', { color: 0x9fe8ff, size: 60 });
        ctx.flt(e.x, e.y - 150, 'CAÑÓN CONGELADO', { color: 0x9fe8ff, size: 24, font: F.poster, dur: 1.6 });
      }
      sfx('freeze', 0.9 + Math.random() * 0.3);
      break;
    }
    case 'dazzle': {
      if (!settings.reduceFlashes) flash(ctx.overlay, 0xfff8e1, 0.85, 0.45);
      sfx('reveal', 1.3);
      onomatopoeia(ctx.wfx, e.x, e.y - 120, '¡DESLUMBRADOS!', { color: 0xffd77a, size: 96 });
      ctx.flt(e.x, e.y - 210, 'CEGADOS 3 TURNOS · SIN CRÍTICOS · SUS CAÑONES A CIEGAS', { color: C.paper, size: 28, font: F.poster, dur: 2 });
      for (const c of ctx.sim.sides[e.side].cats) {
        const bc = ctx.catViews.get(c.def.uid);
        if (c.ko || !bc || bc.destroyed) continue;
        const gp = ctx.wfx.toLocal(bc.getGlobalPosition());
        ctx.fxp.burst(gp.x, gp.y - 80, { count: 12, tint: [0xffffff, 0xffd77a, 0xe8879a], speed: [60, 220], gravity: 0, life: [0.3, 0.6] });
      }
      ctx.shaker.add(0.5);
      break;
    }
    case 'powerchord': {
      sfx('bigboom', 1.4);
      sfx('zap', 0.5);
      [0xff2e88, 0xffd400, 0x2ec4e6].forEach((col, i) => {
        const r = new Graphics().circle(0, 0, 80).stroke({ width: 22 - i * 5, color: col });
        r.position.set(e.x, e.y);
        ctx.wfx.addChild(r);
        gsap.fromTo(r.scale, { x: 0.2, y: 0.2 }, { x: 7 + i, y: 4 + i * 0.6, duration: 0.6 + i * 0.1, delay: i * 0.08, ease: 'power3.out' });
        gsap.to(r, { alpha: 0, delay: 0.35 + i * 0.08, duration: 0.45, onComplete: () => r.destroy() });
      });
      onomatopoeia(ctx.wfx, e.x, e.y - 230, '¡BWAAAANG!', { color: 0xff2e88, size: 140 });
      ctx.flt(e.x, e.y - 320, 'TODOS ATURDIDOS (MENOS LOS SORDOS Y LOS DE SONIDO)', { color: C.paper, size: 28, font: F.poster, dur: 2 });
      speedLines(ctx.wfx, e.x, e.y, 0xffd400, 50, 0.6);
      ctx.shaker.add(1);
      break;
    }
    case 'nobodyErase': {
      // a vertical stripe of TV static over their ship: then it's gone
      const w = Math.max(CELL, e.w ?? CELL * 2);
      const h = (e.n ?? 400) + 260;
      const strip = new Container();
      const g = new Graphics();
      strip.addChild(g);
      strip.position.set(e.x, e.y);
      ctx.wfx.addChild(strip);
      let k = 0;
      const iv = window.setInterval(() => {
        if (g.destroyed || ++k > 16) {
          window.clearInterval(iv);
          if (!strip.destroyed) gsap.to(strip.scale, { x: 0, duration: 0.18, ease: 'power3.in', onComplete: () => strip.destroy({ children: true }) });
          return;
        }
        g.clear();
        g.rect(-w / 2, -h / 2, w, h).fill({ color: 0x0d110f, alpha: 0.85 });
        for (let i = 0; i < 46; i++) g.rect(-w / 2 + Math.random() * w * 0.8, -h / 2 + Math.random() * h, 4 + Math.random() * w * 0.5, 2 + Math.random() * 3).fill({ color: i % 5 ? 0xffffff : 0xff2e88, alpha: 0.7 });
      }, 45);
      if (!settings.reduceFlashes) flash(ctx.overlay, 0xff2e88, 0.35, 0.25);
      sfx('glitch');
      sfx('boom', 0.6);
      ctx.shaker.add(0.7);
      onomatopoeia(ctx.wfx, e.x, e.y - h / 2 - 40, 'BORRADO', { color: 0xff2e88, size: 110 });
      break;
    }
    case 'nobodyAte': {
      if (!e.n) break;
      ctx.flt(e.x, e.y - 120, `SE COMIÓ ${e.n} ESCUDO${e.n > 1 ? 'S' : ''} Y VIDA${e.n > 1 ? 'S' : ''} EXTRA`, { color: 0xff2e88, size: 30, font: F.poster, dur: 2 });
      sfx('pop', 0.5);
      break;
    }
    case 'timestopHit': {
      if (!settings.reduceFlashes) flash(ctx.overlay, 0xfff2d0, 0.7, 0.4);
      sepia(ctx, settings.reduceMotion ? 0.5 : 1.2);
      const c = new Graphics().circle(0, 0, 46).fill(0xd9c29a).stroke({ width: 8, color: INK });
      c.moveTo(0, 0).lineTo(0, -34).stroke({ width: 8, color: INK }).moveTo(0, 0).lineTo(22, 0).stroke({ width: 10, color: INK }).circle(0, 0, 7).fill(0xe0b77a);
      c.position.set(e.x, e.y - 150);
      ctx.wfx.addChild(c);
      gsap.from(c.scale, { x: 2.5, y: 2.5, duration: 0.25, ease: 'power3.out' });
      gsap.to(c, { alpha: 0, delay: 1.3, duration: 0.4, onComplete: () => c.destroy() });
      onomatopoeia(ctx.wfx, e.x, e.y - 200, '時よ止まれ', { color: 0xe0b77a, size: 120 });
      sfx('tick', 0.7);
      window.setTimeout(() => sfx('tick', 0.5), 260);
      ctx.shaker.add(0.6);
      break;
    }
    case 'timestopTurn': {
      // their turn, frozen in a photograph: the cats don't move
      sepia(ctx, settings.reduceMotion ? 0.6 : 1.4);
      onomatopoeia(ctx.wfx, e.x, e.y - 180, 'TIC… TAC…', { color: 0xe0b77a, size: 90 });
      sfx('tick', 0.6);
      window.setTimeout(() => sfx('tick', 0.45), 500);
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
