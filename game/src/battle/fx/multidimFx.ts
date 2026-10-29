/**
 * Parte III · the MULTIDIMENSIONAL powers on screen (battle/multidim.ts — agent PODERES, 2026-10-28). The sim already
 * resolved everything; this only stages it, from the `ultfx` events the powers emit:
 *
 *   'md'        (before the projectiles fly) the STAMP — the power's name across the screen in its universe's color
 *               (fx/sequences/multiverse Signature.frame; a fallback color for the cats whose universe isn't drawn
 *               yet), a MULTIDIMENSIONAL badge and the universe's tag — then the cat's own set piece (a donut falls,
 *               a web spreads, the bat-signal, the golden aura, three words written in the air, the ring ropes…)
 *   'md*'       (at impact time) the beats inside each power: a bounce, a rebound of luck, a spell, an era, a sleeping
 *               cat, a blue ghost, the headline, the bite, the bill…
 *
 * Everything is drawn here with the battle's primitives (Graphics, particles, onomatopoeia, flashes): no raster.
 * Reducir movimiento / Reducir destellos are honored (settings.reduceMotion / reduceFlashes).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F, RARITY } from '../../ui/theme';
import { poster, txt } from '../../ui/widgets';
import { flash, onomatopoeia, speedLines } from '../../fx/juice';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { signatureOf } from '../../fx/sequences/multiverse';
import { multidimPower } from '../../data/multidimPowers';
import { ERAS } from '../multidim';
// after the Parte III: the 60 post powers' set pieces and beats (fx/multidimPostFx.ts, agent PODERES-2)
import { MDP_UNIVERSE } from '../../data/multidimPowersPost';
import { mdpAt, mdpPre } from './multidimPostFx';
import type { BattleEvent } from '../sim';
import type { UltCtx } from '../ultFx';

type UltEv = Extract<BattleEvent, { k: 'ultfx' }>;
const INK = 0x171317;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** each universe's color when its Signature (the reveal) isn't drawn yet, and its tag */
const UNIVERSE: Record<string, { color: number; tag: string }> = {
  x_homiau: { color: 0xffd90f, tag: 'UNIVERSO AMARILLO' },
  x_gatarana: { color: 0xe2231a, tag: 'VERSO ARÁCNIDO' },
  x_murciegato: { color: 0xffd23a, tag: 'UNIVERSO NOCTURNO' },
  x_supersiames: { color: 0x2457c5, tag: 'UNIVERSO SÚPER' },
  x_harrygatter: { color: 0xd4a92a, tag: 'UNIVERSO MÁGICO' },
  x_gatomalo: { color: 0xff4fa3, tag: 'UNIVERSO REGGAETÓN' },
  x_tailorswift: { color: 0xff7ab8, tag: 'LA GIRA DE LAS ERAS' },
  x_billiebigotish: { color: 0x9be38a, tag: 'UNIVERSO SUSURRO' },
  x_vangato: { color: 0xd9a43a, tag: 'UNIVERSO PINCEL' },
  e_comecroquetas: { color: 0xffe100, tag: 'UNIVERSO ARCADE' },
  l_bigoton: { color: 0x3a63d8, tag: 'UNIVERSO SÚPER' },
  e_ovillo: { color: 0x5f8f45, tag: 'VERSO ARÁCNIDO' },
  e_estambre: { color: 0xc9a86a, tag: 'VERSO ARÁCNIDO' },
  r_gatarana_noir: { color: 0xbdbdbd, tag: 'VERSO NOIR' },
  r_gatarana_blanca: { color: 0xf06ab0, tag: 'VERSO ARÁCNIDO' },
  r_gatarana_2099: { color: 0x1fb6ff, tag: 'VERSO 2099' },
  r_gatemson: { color: 0xeae4d3, tag: 'EDICIÓN DE LA MAÑANA' },
  l_gatzilla: { color: 0x6c8f62, tag: 'UNIVERSO KAIJU' },
  l_emiau: { color: 0xe6e6e6, tag: 'LA CUADRA 8' },
  c_gritito: { color: 0xf28c28, tag: 'UNIVERSO DEL GRITO' },
  e_gatoconda: { color: 0x8a8a4a, tag: 'UNIVERSO SFUMATO' },
  e_sonrisa: { color: 0xc77dff, tag: 'EL PAÍS DE LAS MARAVILLAS' },
  e_sirsimon: { color: 0x9fc2d8, tag: 'UNIVERSO FANTASMA' },
  r_garbancito: { color: 0xe0c27a, tag: 'UNIVERSO DE CUENTO' },
  e_maneki: { color: 0xd8302f, tag: 'UNIVERSO DE LA SUERTE' },
};
/** the universe's color: its Signature's frame when there is one (white frames read as the fallback) */
export function mdColor(species: string): number {
  const sig = signatureOf(species);
  if (sig && sig.frame !== 0xffffff) return sig.frame;
  return UNIVERSE[species]?.color ?? MDP_UNIVERSE[species]?.color ?? RARITY.multidimensional.color;
}
export function mdTag(species: string): string {
  return signatureOf(species)?.tag ?? UNIVERSE[species]?.tag ?? MDP_UNIVERSE[species]?.tag ?? 'MULTIVERSO';
}
const luma = (c: number) => 0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255);
const light = (c: number) => luma(c) > 150;

/** the caster's view (world coords), from its species */
export function caster(ctx: UltCtx, species: string) {
  const c = ctx.sim.sides[0].cats.find((k) => k.def.catId === species) ?? ctx.sim.sides[1].cats.find((k) => k.def.catId === species);
  if (!c) return null;
  const v = ctx.catViews.get(c.def.uid);
  const p = v && !v.destroyed ? ctx.wfx.toLocal(v.getGlobalPosition()) : ctx.sim.roomCenter(c.side, c.room);
  return { c, v, x: p.x, y: p.y };
}
function catAt(ctx: UltCtx, uid?: string) {
  if (!uid) return null;
  const v = ctx.catViews.get(uid);
  return v && !v.destroyed ? { v, p: ctx.wfx.toLocal(v.getGlobalPosition()) } : null;
}
/** a world-layer node that fades out after `hold` seconds */
export function fleeting<T extends Container>(ctx: UltCtx, node: T, hold = 1.2, fade = 0.4, layer: Container = ctx.wfx): T {
  layer.addChild(node);
  gsap.to(node, {
    alpha: 0,
    delay: hold,
    duration: fade,
    onComplete: () => {
      // no tween may touch it once it's gone
      gsap.killTweensOf(node);
      gsap.killTweensOf(node.scale);
      if (!node.destroyed) node.destroy({ children: true });
    },
  });
  return node;
}
export function veil(ctx: UltCtx, color: number, alpha: number, hold = 1, fade = 0.5) {
  const g = new Graphics().rect(-400, -300, 2720, 1680).fill(color);
  g.alpha = 0;
  ctx.overlay.addChildAt(g, 0);
  gsap.to(g, { alpha, duration: 0.25 });
  gsap.to(g, { alpha: 0, delay: hold, duration: fade, onComplete: () => g.destroy() });
  return g;
}

/** THE STAMP: the power's name in its universe's color, the MULTIDIMENSIONAL badge and the universe's tag */
/** the stamp on screen right now (BattleScene keeps its own labels clear of it: an instant power's volley comes early) */
let liveStamp: Container | null = null;
/** is a Multidimensional stamp crossing the screen? (the band sits at y 196–404 of the 1920×1080 overlay) */
export function mdStampUp(): boolean {
  return !!liveStamp && !liveStamp.destroyed && liveStamp.alpha > 0.15;
}
function stampBanner(ctx: UltCtx, species: string) {
  const p = multidimPower(species);
  if (!p) return;
  const color = mdColor(species);
  const ink = light(color) ? INK : C.paper;
  const c = new Container();
  // the band crosses the whole screen (the container sits at its center)
  const band = new Graphics().rect(-1400, -104, 2800, 208).fill(color);
  band.rect(-1400, -104, 2800, 12).fill(INK).rect(-1400, 92, 2800, 12).fill(INK);
  // the multiverse's crossing stripes (the reveal's pink / teal)
  band.rect(-1400, -92, 2800, 6).fill(RARITY.multidimensional.glow).rect(-1400, 86, 2800, 6).fill(RARITY.multidimensional.color);
  band.rotation = -0.05;
  // the name in the band's own color, outlined — but a near-black band (a noir universe: Condorgato, Gatoleone, Gatojo,
  // Grrrú, Miaupé…) would swallow it whole: paper, then
  const t = poster(p.name, 108, ink === INK || luma(color) < 64 ? C.paper : color, { stroke: { color: INK, width: 14 } });
  t.anchor.set(0.5);
  t.rotation = -0.05;
  t.y = -18;
  if (t.width > 1500) t.scale.set(1500 / t.width);
  const s = txt(p.short.toUpperCase(), { fontFamily: F.ui, fontWeight: '700', fontSize: 28, fill: ink });
  s.anchor.set(0.5);
  s.y = 64;
  s.rotation = -0.05;
  if (s.width > 1500) s.scale.set(1500 / s.width);
  const badge = new Container();
  const bt = poster('MULTIDIMENSIONAL', 30, C.paper);
  bt.anchor.set(0.5);
  const bb = new Graphics().rect(-bt.width / 2 - 16, -bt.height / 2 - 4, bt.width + 32, bt.height + 8).fill(RARITY.multidimensional.color).stroke({ width: 5, color: INK });
  badge.addChild(bb, bt);
  badge.position.set(-Math.min(750, t.width / 2) - 30, -104);
  badge.rotation = -0.09;
  const tag = new Container();
  const tt = poster(mdTag(species), 24, INK);
  tt.anchor.set(0.5);
  const tb = new Graphics().rect(-tt.width / 2 - 14, -tt.height / 2 - 3, tt.width + 28, tt.height + 6).fill(C.paper).stroke({ width: 4, color: INK });
  tag.addChild(tb, tt);
  tag.position.set(Math.min(760, t.width / 2) + 20, 104);
  tag.rotation = -0.03;
  c.addChild(band, t, s, badge, tag);
  c.position.set(960, 300);
  ctx.overlay.addChild(c);
  liveStamp = c;
  gsap.from(band.scale, { x: 0, duration: 0.22, ease: 'power3.out' });
  gsap.from(t.scale, { x: t.scale.x * 2.6, y: t.scale.y * 2.6, duration: 0.26, ease: 'back.out(2)' });
  gsap.from(badge, { y: -300, duration: 0.3, delay: 0.1, ease: 'back.out(2)' });
  gsap.to(c, { alpha: 0, delay: 1.7, duration: 0.35, onComplete: () => c.destroy({ children: true }) });
}

// ------------------------------------------------------------------ little drawings
function donut(r: number) {
  const g = new Graphics();
  g.circle(0, 0, r).fill(0xd9a066).stroke({ width: 6, color: INK });
  g.circle(0, 0, r * 0.86).fill(0xf59ac0);
  const cols = [0xffffff, 0x6ab0e0, 0xffd521, 0x7ed957, 0xff6a6a];
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4;
    const rr = r * (0.5 + (i % 3) * 0.12);
    g.roundRect(Math.cos(a) * rr - 6, Math.sin(a) * rr - 2, 12, 4, 2).fill(cols[i % cols.length]);
  }
  g.circle(0, 0, r * 0.32).fill(INK);
  g.circle(0, 0, r * 0.26).fill(0x87c7ef);
  return g;
}
function web(r: number, color = 0xffffff) {
  const g = new Graphics();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.moveTo(0, 0).lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  for (let k = 1; k <= 4; k++) {
    const rr = (r * k) / 4;
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) g.moveTo(x, y);
      else g.quadraticCurveTo(Math.cos(a - 0.31) * rr * 0.86, Math.sin(a - 0.31) * rr * 0.86, x, y);
    }
  }
  g.stroke({ width: 7, color: INK, alpha: 0.6 });
  g.stroke({ width: 3, color });
  return g;
}
export function bat(w: number) {
  const g = new Graphics();
  const h = w * 0.42;
  g.poly([0, -h * 0.35, w * 0.12, -h * 0.6, w * 0.16, -h * 0.25, w * 0.5, -h * 0.5, w * 0.36, 0, w * 0.28, h * 0.35, w * 0.12, h * 0.1, 0, h * 0.5, -w * 0.12, h * 0.1, -w * 0.28, h * 0.35, -w * 0.36, 0, -w * 0.5, -h * 0.5, -w * 0.16, -h * 0.25, -w * 0.12, -h * 0.6]).fill(INK);
  return g;
}
function star5(g: Graphics, x: number, y: number, r: number, color: number) {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.poly(pts).fill(color).stroke({ width: 4, color: INK });
}
function coin(r: number) {
  const g = new Graphics();
  g.ellipse(0, 0, r, r * 0.7).fill(0xf2c14e).stroke({ width: 4, color: INK });
  g.rect(-r * 0.25, -r * 0.15, r * 0.5, r * 0.3).stroke({ width: 3, color: 0x8a5a10 });
  return g;
}
export function word(ctx: UltCtx, x: number, y: number, text: string, color: number, size = 64, font: string = F.comic, hold = 1.1) {
  const t = txt(text, { fontFamily: font, fontSize: size, fill: color, stroke: { color: INK, width: Math.max(4, size / 9), join: 'round' } });
  t.anchor.set(0.5);
  // a long line written over a ship near the edge stays whole on screen (the 1920-wide stage)
  const half = t.width / 2 + 24;
  t.position.set(half * 2 < 1920 ? Math.max(half, Math.min(1920 - half, x)) : 960, y);
  fleeting(ctx, t, hold, 0.35);
  gsap.from(t.scale, { x: 0.2, y: 0.2, duration: 0.2, ease: 'back.out(3)' });
  return t;
}

// ------------------------------------------------------------------ before the projectiles fly
/** the stamp and the cat's own set piece ('md' events) */
export async function mdPre(ctx: UltCtx, e: UltEv) {
  const id = e.uid ?? '';
  const fast = settings.reduceMotion;
  const fl = !settings.reduceFlashes;
  const color = mdColor(id);
  const me = caster(ctx, id);
  // the set pieces drawn over the whole screen go UNDER the stamp (the name must always read)
  const back = new Container();
  ctx.overlay.addChild(back);
  window.setTimeout(() => !back.destroyed && back.destroy({ children: true }), 4000);
  stampBanner(ctx, id);
  sfx('reveal', 0.9);
  ctx.shaker.add(0.3);
  const x = e.x;
  const y = e.y;
  switch (id) {
    case 'x_homiau': {
      // the donut of destiny, rolling down from the sky
      const d = fleeting(ctx, donut(64), 1.0);
      d.position.set(x, -200);
      gsap.to(d, { y: y - 120, rotation: 6, duration: fast ? 0.1 : 0.5, ease: 'power2.in' });
      ctx.flt(me?.x ?? x, (me?.y ?? y) - 150, '¡MMMH… DONA!', { color: 0xf59ac0, size: 40, font: F.comic });
      sfx('nyam');
      break;
    }
    case 'x_gatarana': {
      const w = fleeting(ctx, web(320), 1.6);
      w.position.set(x, y);
      gsap.from(w.scale, { x: 0, y: 0, duration: fast ? 0.05 : 0.35, ease: 'back.out(1.6)' });
      onomatopoeia(ctx.wfx, x, y - 220, '¡THWIP!', { color: 0xffffff, size: 100 });
      sfx('whoosh', 1.4);
      break;
    }
    case 'x_murciegato': {
      // lights out and the signal in the sky
      veil(ctx, 0x05060d, 0.62, 1.5);
      const sig = new Container();
      const g = new Graphics().ellipse(0, 0, 230, 120).fill({ color: 0xffe14a, alpha: 0.85 }).stroke({ width: 8, color: INK });
      const b = bat(300);
      sig.addChild(g, b);
      sig.position.set(960, 300);
      fleeting(ctx, sig, 1.3, 0.4, back);
      gsap.from(sig.scale, { x: 0.2, y: 0.2, duration: 0.3, ease: 'back.out(2)' });
      sfx('sting');
      break;
    }
    case 'x_supersiames': {
      // the golden aura (SUPER: a bigger one)
      if (me) {
        for (let i = 0; i < 3; i++) window.setTimeout(() => ctx.fxp.burst(me.x, me.y - 40, { count: 28, tint: [0xffd23a, 0xfff2a0, 0xffffff], speed: [200, 520], angle: [-Math.PI * 0.95, -Math.PI * 0.05], gravity: -200, life: [0.4, 0.8] }), i * 120);
        speedLines(ctx.wfx, me.x, me.y - 40, 0xffd23a, 54, 0.8);
        me.v?.impactFrame?.(160, false);
        ctx.flt(me.x, me.y - 190, e.n ? '¡SUPER… NUEVE VIDAS… WAAAVE!' : '¡NUEVE VIDAS… WAAAVE!', { color: 0xffd23a, size: 38, font: F.comic });
      }
      if (fl) flash(ctx.overlay, 0xfff2a0, 0.55, 0.3);
      sfx('charge', 0.8);
      break;
    }
    case 'x_harrygatter': {
      // three spells written in the air, one after the other
      const spells = ['¡EXPELLIARMIAU!', '¡DESMAYUS!', '¡BOMBARDA!'];
      for (let i = 0; i < 3; i++) {
        window.setTimeout(() => {
          if (ctx.overlay.destroyed) return;
          const t = txt(spells[i], { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '900', fontSize: 70, fill: 0xffe9a8, stroke: { color: INK, width: 8 } });
          t.anchor.set(0.5);
          t.position.set(560 + i * 400, 470 + (i % 2) * 70);
          t.rotation = -0.08 + i * 0.05;
          fleeting(ctx, t, 1.1, 0.4, back);
          gsap.from(t, { alpha: 0, duration: 0.25 });
          sfx('nib', 1 + i * 0.1);
        }, (fast ? 60 : 220) * i);
      }
      if (me) ctx.fxp.burst(me.x, me.y - 60, { count: 30, tint: [0xffe9a8, 0xd4a92a, 0xffffff], speed: [80, 320], gravity: -60, life: [0.5, 1] });
      await wait(fast ? 150 : 520);
      break;
    }
    case 'x_gatomalo': {
      // the ring ropes, the turnbuckle, the dive
      const ropes = new Graphics();
      for (let i = 0; i < 3; i++) ropes.rect(-400, 760 + i * 46, 2720, 12).fill(i === 1 ? 0xffffff : color).stroke({ width: 3, color: INK });
      fleeting(ctx, ropes, 1.2, 0.4, back);
      gsap.from(ropes, { alpha: 0, duration: 0.2 });
      onomatopoeia(ctx.overlay, 960, 640, '¡ESTO ES LUCHA!', { color, size: 96 });
      if (me) ctx.fxp.burst(me.x, me.y - 40, { count: 30, tint: [color, 0x7c3aed, 0xffd23a], speed: [150, 500], gravity: 300 });
      sfx('crit');
      break;
    }
    case 'x_tailorswift': {
      // sequins of the five eras and the stage lights
      const cols = ERAS.map((k) => k.color);
      for (let i = 0; i < 5; i++) window.setTimeout(() => me && ctx.fxp.burst(me.x, me.y - 60, { count: 22, tint: [cols[i], 0xffffff], speed: [200, 600], gravity: 250, life: [0.5, 1], stepped: true }), i * 90);
      const lights = new Graphics();
      for (let i = 0; i < 5; i++) lights.poly([300 + i * 330, -40, 240 + i * 330, 1100, 380 + i * 330, 1100]).fill({ color: cols[i], alpha: 0.16 });
      fleeting(ctx, lights, 1.3, 0.4, back);
      onomatopoeia(ctx.overlay, 960, 640, '¡NUEVA ERA!', { color: 0xff7ab8, size: 100 });
      sfx('fanfare', 1.1);
      break;
    }
    case 'x_billiebigotish': {
      veil(ctx, 0x050a06, 0.5, 1.6);
      for (let i = 0; i < 9; i++)
        window.setTimeout(() => {
          if (ctx.wfx.destroyed) return;
          const z = txt('z', { fontFamily: F.comic, fontSize: 40 + (i % 3) * 18, fill: 0x9be38a, stroke: { color: INK, width: 5 } });
          z.anchor.set(0.5);
          z.position.set(x - 260 + i * 65, y + 40);
          fleeting(ctx, z, 1, 0.4);
          gsap.to(z, { y: z.y - 160, x: z.x + 30, duration: 1.2, ease: 'sine.out' });
        }, i * 70);
      ctx.flt(me?.x ?? x, (me?.y ?? y) - 150, 'shhh…', { color: 0x9be38a, size: 34, font: F.comic });
      sfx('purr');
      break;
    }
    case 'x_vangato': {
      // the starry night: swirling brushstrokes and eleven stars
      const g = new Graphics();
      for (let k = 0; k < 3; k++) {
        g.moveTo(x, y);
        for (let s = 1; s <= 40; s++) {
          const a = s * 0.32 + k * 2.1;
          const r = s * 8;
          g.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 0.7);
        }
        g.stroke({ width: 14, color: INK, alpha: 0.35 });
      }
      for (let k = 0; k < 3; k++) {
        g.moveTo(x, y);
        for (let s = 1; s <= 40; s++) {
          const a = s * 0.32 + k * 2.1;
          const r = s * 8;
          g.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 0.7);
        }
        g.stroke({ width: 7, color: k === 1 ? 0xf2c14e : 0x3a63d8 });
      }
      for (let i = 0; i < 11; i++) {
        const u = Math.sqrt((i + 0.5) / 11);
        const a = i * 2.39996;
        star5(g, x + Math.cos(a) * u * 260, y + 40 + Math.sin(a) * u * 140, 14, 0xffe14a);
      }
      fleeting(ctx, g, 1.5, 0.5);
      gsap.from(g, { rotation: -0.4, duration: 0.6, ease: 'power2.out' });
      onomatopoeia(ctx.wfx, x, y - 200, '¡MIRA ESE CIELO!', { color: 0xf2c14e, size: 80 });
      sfx('reveal', 1.2);
      break;
    }
    case 'e_comecroquetas': {
      // the arcade: a row of pellets and the round one eating them
      const row = new Container();
      const pel = new Graphics();
      for (let i = 0; i < 12; i++) pel.circle(300 + i * 120, 860, i === 11 ? 18 : 8).fill(0xffd9a0);
      const pac = new Graphics();
      const draw = (open: number) => pac.clear().moveTo(0, 0).arc(0, 0, 46, open, Math.PI * 2 - open).lineTo(0, 0).fill(0xffe100).stroke({ width: 5, color: INK });
      draw(0.6);
      pac.position.set(200, 860);
      row.addChild(pel, pac);
      fleeting(ctx, row, 1.2, 0.3, back);
      const st = { o: 0.6 };
      gsap.to(st, { o: 0.05, duration: 0.12, yoyo: true, repeat: 9, onUpdate: () => !pac.destroyed && draw(st.o) });
      gsap.to(pac, { x: 1700, duration: fast ? 0.2 : 1.2, ease: 'none', onUpdate: () => {
        if (pel.destroyed || pac.destroyed) return;
        for (let i = 0; i < 12; i++) if (pac.x > 300 + i * 120) pel.circle(300 + i * 120, 860, 20).fill(0x0b0f3a);
      } });
      onomatopoeia(ctx.overlay, 960, 720, 'WAKA WAKA', { color: 0xffe100, size: 90 });
      sfx('nyam', 1.3);
      break;
    }
    case 'l_bigoton': {
      if (me) {
        speedLines(ctx.wfx, me.x, me.y - 40, 0xbfd4ff, 60, 0.9);
        for (let i = 0; i < 3; i++) window.setTimeout(() => ctx.fxp.burst(me.x, me.y - 40, { count: 24, tint: [0xffffff, 0xbfd4ff, 0xffe14a], speed: [60, 260], gravity: 0, life: [0.3, 0.6] }), i * 110);
        ctx.flt(me.x, me.y - 180, '¡TÚ VAS ATRÁS!', { color: 0xbfd4ff, size: 40, font: F.comic });
      }
      if (fl) flash(ctx.overlay, 0xffffff, 0.6, 0.25);
      sfx('charge', 1.1);
      break;
    }
    case 'e_ovillo': {
      // four mechanical arms reach out with their yarn balls
      if (me) {
        const g = new Graphics();
        for (let i = 0; i < 4; i++) {
          const tx = x + (i - 1.5) * 170;
          const ty = y - 40 + (i % 2) * 70;
          const cx = (me.x + tx) / 2;
          const cy = Math.min(me.y, ty) - 260 - i * 30;
          g.moveTo(me.x, me.y - 40).quadraticCurveTo(cx, cy, tx, ty).stroke({ width: 16, color: INK }).moveTo(me.x, me.y - 40).quadraticCurveTo(cx, cy, tx, ty).stroke({ width: 9, color: 0x7d8a6a });
          g.circle(tx, ty, 22).fill(0x5f8f45).stroke({ width: 5, color: INK });
        }
        fleeting(ctx, g, 1.1, 0.4);
        const m = new Graphics().rect(0, -2000, 1, 4000).fill(0xffffff);
        m.position.set(Math.min(me.x, x) - 400, 0);
        g.mask = m;
        ctx.wfx.addChild(m);
        gsap.to(m.scale, { x: 3000, duration: fast ? 0.05 : 0.45, ease: 'power2.out', onComplete: () => {
          // unmask before the mask goes (a destroyed mask still assigned crashes the renderer)
          if (!g.destroyed) g.mask = null;
          m.destroy();
        } });
      }
      onomatopoeia(ctx.wfx, x, y - 230, '¡TANGLE TIME!', { color: 0x9fd16f, size: 90 });
      sfx('whoosh');
      break;
    }
    case 'e_estambre': {
      if (me) {
        const g = new Graphics();
        for (let k = 0; k < 5; k++) g.arc(me.x, me.y - 30, 40 + k * 22, k, k + 4.2).stroke({ width: 8, color: k % 2 ? 0xc9a86a : 0x7c8a4a });
        fleeting(ctx, g, 0.9, 0.4);
        gsap.from(g, { rotation: -2, duration: 0.6, ease: 'power2.out' });
      }
      onomatopoeia(ctx.wfx, x, y - 200, '¡YARNSTORM!', { color: 0xc9a86a, size: 90 });
      sfx('whoosh', 0.8);
      break;
    }
    case 'r_gatarana_noir': {
      // black and white, and the rain
      veil(ctx, 0x2a2a2a, 0.45, 1.6);
      const rain = new Graphics();
      for (let i = 0; i < 70; i++) {
        const rx = (i * 137) % 2000 - 40;
        const ry = (i * 251) % 1000;
        rain.moveTo(rx, ry).lineTo(rx - 18, ry + 60);
      }
      rain.stroke({ width: 3, color: 0xdadada, alpha: 0.7 });
      fleeting(ctx, rain, 1.4, 0.4, back);
      gsap.to(rain, { y: 160, duration: 1.6, ease: 'none' });
      const t = txt('NOCHE DE LLUVIA.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 64, fill: 0xf2f2f2, stroke: { color: INK, width: 8 } });
      t.anchor.set(0.5);
      t.position.set(960, 520);
      fleeting(ctx, t, 1.1, 0.4, back);
      sfx('splash', 0.7);
      break;
    }
    case 'r_gatarana_blanca': {
      // the thread she drops on, and the drums
      const g = new Graphics().moveTo(x, -400).lineTo(x, y - 60).stroke({ width: 3, color: 0xffffff });
      fleeting(ctx, g, 1.2, 0.3);
      gsap.from(g.scale, { y: 0, duration: 0.3 });
      for (let i = 0; i < 4; i++) window.setTimeout(() => onomatopoeia(ctx.wfx, x - 180 + i * 120, y - 160 - (i % 2) * 50, i % 2 ? 'TSS' : 'BUM', { color: 0xf06ab0, size: 64 }), i * 110);
      ctx.flt(me?.x ?? x, (me?.y ?? y) - 150, '¡PLIÉ!', { color: 0xf06ab0, size: 40, font: F.comic });
      sfx('hit', 1.4);
      break;
    }
    case 'r_gatarana_2099': {
      const g = new Graphics();
      for (let i = 0; i < 3; i++) {
        const sx = x - 200 + i * 130;
        g.moveTo(sx, y - 260).lineTo(sx + 200, y + 200).stroke({ width: 26, color: 0x1fb6ff, alpha: 0.25 });
        g.moveTo(sx, y - 260).lineTo(sx + 200, y + 200).stroke({ width: 8, color: 0xe8fbff });
      }
      fleeting(ctx, g, 0.9, 0.3);
      const m = new Graphics().rect(-2000, 0, 4000, 1).fill(0xffffff);
      m.position.set(0, y - 280);
      g.mask = m;
      ctx.wfx.addChild(m);
      gsap.to(m.scale, { y: 520, duration: fast ? 0.05 : 0.25, ease: 'power4.in', onComplete: () => {
        if (!g.destroyed) g.mask = null;
        m.destroy();
      } });
      onomatopoeia(ctx.wfx, x, y - 300, '2099', { color: 0x1fb6ff, size: 110, font: F.glitch });
      sfx('zap', 1.3);
      break;
    }
    case 'r_gatemson': {
      // ¡EXTRA! ¡EXTRA!: the front page slams onto the screen
      const page = new Container();
      const bg = new Graphics().rect(-330, -210, 660, 420).fill(0xf3eedf).stroke({ width: 8, color: INK });
      bg.rect(-300, -120, 600, 6).fill(INK).rect(-300, 150, 600, 4).fill(INK);
      for (let i = 0; i < 6; i++) bg.rect(-300, 40 + i * 16, 280, 6).fill(0x9a9486).rect(20, 40 + i * 16, 280, 6).fill(0x9a9486);
      const head = txt('EL CLARÍN DEL BIGOTE', { fontFamily: F.news, fontSize: 40, fill: INK });
      head.anchor.set(0.5);
      head.y = -160;
      const big = poster('¡EXTRA! ¡EXTRA!', 76, INK);
      big.anchor.set(0.5);
      big.y = -50;
      page.addChild(bg, head, big);
      page.position.set(960, 520);
      page.rotation = -0.12;
      fleeting(ctx, page, 1.1, 0.35, back);
      gsap.from(page, { rotation: 6, duration: fast ? 0.05 : 0.4, ease: 'back.out(1.4)' });
      gsap.from(page.scale, { x: 0.1, y: 0.1, duration: fast ? 0.05 : 0.4, ease: 'back.out(1.4)' });
      sfx('paper');
      await wait(fast ? 100 : 380);
      break;
    }
    case 'l_gatzilla': {
      // the kaiju's shadow covers their ship
      const g = new Graphics().ellipse(0, 0, 520, 150).fill({ color: 0x000000, alpha: 0.4 });
      g.position.set(x, y + 40);
      fleeting(ctx, g, 1.1, 0.4);
      gsap.from(g.scale, { x: 0.2, y: 0.2, duration: fast ? 0.05 : 0.6, ease: 'power2.out' });
      onomatopoeia(ctx.overlay, 960, 560, '¡GAAAATZ!', { color: 0x9fd6a0, size: 150 });
      ctx.shaker.add(1);
      sfx('bigboom', 0.5);
      break;
    }
    case 'l_emiau': {
      // eight bars counted off, then the mic drops
      for (let i = 0; i < 8; i++) window.setTimeout(() => !ctx.overlay.destroyed && word(ctx, 360 + i * 170, 540 + (i % 2) * 40, `${i + 1}`, 0xe6e6e6, 70, F.poster, 0.4), (fast ? 20 : 70) * i);
      const mic = new Graphics();
      mic.circle(0, -40, 26).fill(0x8a8a8a).stroke({ width: 5, color: INK });
      mic.rect(-9, -16, 18, 70).fill(0x2a2a2a).stroke({ width: 4, color: INK });
      mic.position.set(x, -100);
      fleeting(ctx, mic, 1.1, 0.4);
      gsap.to(mic, { y: y - 80, rotation: 0.6, duration: fast ? 0.1 : 0.6, ease: 'bounce.out' });
      sfx('drumroll', 1.4);
      break;
    }
    case 'c_gritito': {
      // the sky bends: wavy orange and blue bands
      const g = new Graphics();
      for (let k = 0; k < 7; k++) {
        g.moveTo(-200, 120 + k * 90);
        for (let s = 0; s <= 24; s++) g.lineTo(-200 + s * 100, 120 + k * 90 + Math.sin(s * 0.7 + k) * 36);
        g.stroke({ width: 34, color: k % 3 === 2 ? 0x3b5ba5 : k % 2 ? 0xf28c28 : 0xe0533a, alpha: 0.4 });
      }
      fleeting(ctx, g, 1.2, 0.4, back);
      gsap.to(g, { x: -120, duration: 1.4, ease: 'sine.inOut' });
      onomatopoeia(ctx.overlay, 960, 560, '¡AAAAAAH!', { color: 0xf28c28, size: 150 });
      sfx('alarm');
      break;
    }
    case 'e_gatoconda': {
      // the sfumato and her gaze
      veil(ctx, 0x4a4a2a, 0.35, 1.5);
      const eye = new Graphics();
      eye.ellipse(0, 0, 150, 60).fill(0xf3ead2).stroke({ width: 8, color: INK });
      eye.circle(0, 0, 40).fill(0x4a3a20);
      eye.circle(0, 0, 18).fill(INK);
      eye.position.set(960, 300);
      fleeting(ctx, eye, 1.2, 0.5, back);
      gsap.from(eye.scale, { y: 0, duration: 0.3 });
      ctx.flt(me?.x ?? x, (me?.y ?? y) - 150, '…', { color: 0xd8c89a, size: 60, font: F.comic });
      sfx('sting', 0.7);
      break;
    }
    case 'e_sonrisa': {
      // only the grin is left
      const g = new Graphics();
      g.moveTo(-240, -20).quadraticCurveTo(0, 170, 240, -20).quadraticCurveTo(0, 90, -240, -20).fill(0xffffff).stroke({ width: 8, color: INK });
      for (let i = -5; i <= 5; i++) g.moveTo(i * 38, 20 + (25 - Math.abs(i) * 4)).lineTo(i * 38, 60 + (30 - Math.abs(i) * 5)).stroke({ width: 4, color: INK });
      g.position.set(960, 340);
      fleeting(ctx, g, 1.2, 0.6, back);
      gsap.from(g, { alpha: 0, duration: 0.4 });
      if (me?.v) gsap.to(me.v, { alpha: 0.2, duration: 0.3, yoyo: true, repeat: 1, repeatDelay: 0.8 });
      ctx.flt(me?.x ?? x, (me?.y ?? y) - 150, '¡AQUÍ NO HAY NADIE!', { color: 0xc77dff, size: 36, font: F.comic });
      sfx('whoosh', 0.7);
      break;
    }
    case 'e_sirsimon': {
      // chains rattling over their ship
      const g = new Graphics();
      for (let k = 0; k < 3; k++) {
        for (let i = 0; i < 16; i++) {
          const cx = x - 320 + i * 42;
          const cy = y - 120 + k * 80 + Math.sin(i * 0.5) * 30;
          g.ellipse(cx, cy, 16, 10).stroke({ width: 7, color: INK }).ellipse(cx, cy, 16, 10).stroke({ width: 3, color: 0x9fc2d8 });
        }
      }
      fleeting(ctx, g, 1.2, 0.4);
      gsap.from(g, { alpha: 0, y: -60, duration: 0.3 });
      onomatopoeia(ctx.wfx, x, y - 240, '¡BUUU!', { color: 0x9fc2d8, size: 110 });
      sfx('sting', 0.6);
      break;
    }
    case 'r_garbancito': {
      // nobody sees him: just a tiny shout
      ctx.flt(me?.x ?? x, (me?.y ?? y) - 120, '¡pachín!', { color: 0xe0c27a, size: 22, font: F.comic });
      sfx('pop', 1.8);
      await wait(fast ? 80 : 300);
      break;
    }
    case 'e_maneki': {
      // the raised paw and the koban rain
      for (let i = 0; i < 10; i++)
        window.setTimeout(() => {
          if (ctx.wfx.destroyed) return;
          const c = coin(18);
          c.position.set(x - 300 + i * 66, -60);
          fleeting(ctx, c, 0.9, 0.3);
          gsap.to(c, { y: y - 40 + (i % 3) * 30, duration: 0.7, ease: 'bounce.out' });
        }, i * 50);
      onomatopoeia(ctx.wfx, x, y - 230, '¡NADA ES GRATIS!', { color: 0xf2c14e, size: 80 });
      sfx('coin');
      break;
    }
    default:
      // after the Parte III: the post Multidimensionals' own set pieces
      await mdpPre(ctx, e);
      break;
  }
  await wait(fast ? 200 : 750);
}

// ------------------------------------------------------------------ at impact time
/** the beats inside each power ('md…' events other than the stamp) */
export function mdAt(ctx: UltCtx, e: UltEv) {
  if (e.fx.startsWith('mdp')) return mdpAt(ctx, e);
  const fl = !settings.reduceFlashes;
  switch (e.fx) {
    case 'mdHop':
      onomatopoeia(ctx.wfx, e.x, e.y - 120, '¡BOING!', { color: 0xf59ac0, size: 70 });
      ctx.fxp.burst(e.x, e.y - 20, { count: 16, tint: [0xffffff, 0x6ab0e0, 0xffd521, 0xf59ac0], speed: [120, 380], gravity: 500, stepped: true });
      ctx.shaker.add(0.35);
      sfx('boom', 1.2);
      break;
    case 'mdLuck':
      onomatopoeia(ctx.wfx, e.x, e.y - 90, '¡SUERTE DE SOFÁ!', { color: 0xffd90f, size: 54 });
      ctx.fxp.burst(e.x, e.y, { count: 18, tint: [0xffd90f, 0xf59ac0, 0xffffff], speed: [100, 300], gravity: 300 });
      sfx('coin', 1.3);
      break;
    case 'mdNet':
      ctx.flt(e.x, e.y - 240, 'TODO ENRAIZADO · SUS CAÑONES PEGADOS', { color: C.paper, size: 30, font: F.poster, dur: 1.6 });
      break;
    case 'mdNight':
      if (fl) flash(ctx.overlay, 0x000000, 0.6, 0.6);
      ctx.flt(e.x, e.y - 160, 'LA NOCHE SE QUEDA: ECLIPSADOS 2 TURNOS', { color: 0xffe14a, size: 30, font: F.poster, dur: 1.8 });
      break;
    case 'mdSuper': {
      const v = catAt(ctx, e.uid);
      if (fl) flash(ctx.overlay, 0xfff2a0, 0.8, 0.4);
      if (v) {
        speedLines(ctx.wfx, v.p.x, v.p.y - 40, 0xffd23a, 60, 1);
        ctx.fxp.burst(v.p.x, v.p.y - 40, { count: 60, tint: [0xffd23a, 0xffffff, 0xff9a1a], speed: [200, 700], life: [0.4, 1] });
        v.v.impactFrame?.(200, false);
      }
      onomatopoeia(ctx.wfx, e.x, e.y - 160, '¡SUPER SIAMÉS!', { color: 0xffd23a, size: 100 });
      sfx('levelup');
      ctx.shaker.add(0.6);
      break;
    }
    case 'mdSpell': {
      const t = e.n === 1 ? '¡DESMAYUS!' : '¡BOMBARDA!';
      word(ctx, e.x, e.y - 120, t, 0xffe9a8, 64, F.serif);
      ctx.fxp.burst(e.x, e.y, { count: 30, tint: [0xffe9a8, 0xd4a92a, 0xffffff], speed: [100, 420], gravity: 0 });
      sfx(e.n === 1 ? 'zap' : 'bigboom', 1.1);
      break;
    }
    case 'mdFlow':
      onomatopoeia(ctx.wfx, e.x, e.y - 160, '¡EL FLOW!', { color: 0xff4fa3, size: 80 });
      ctx.flt(e.x, e.y - 230, `TUS PRÓXIMOS ${e.n ?? 3} TURNOS: CADA TIRO TRAE SU ECO`, { color: C.paper, size: 28, font: F.poster, dur: 1.8 });
      break;
    case 'mdEra': {
      const era = ERAS[e.n ?? 0];
      if (!era) break;
      const c = new Container();
      const band = new Graphics().rect(-1400, -56, 2800, 112).fill(era.color).stroke({ width: 6, color: INK });
      band.rotation = 0.03;
      const t = poster(era.name, 70, light(era.color) ? INK : C.paper, { stroke: { color: light(era.color) ? C.paper : INK, width: 8 } });
      t.anchor.set(0.5);
      t.rotation = 0.03;
      c.addChild(band, t);
      c.position.set(960, 420);
      fleeting(ctx, c, 1.1, 0.3, ctx.overlay);
      gsap.from(band.scale, { x: 0, duration: 0.2 });
      ctx.fxp.burst(e.x, e.y - 60, { count: 24, tint: [era.color, 0xffffff], speed: [150, 450], gravity: 250, stepped: true });
      sfx('fanfare', 1.2);
      break;
    }
    case 'mdSleep': {
      const v = catAt(ctx, e.uid);
      const p = v?.p ?? { x: e.x, y: e.y };
      word(ctx, p.x + 30, p.y - 110, 'Zzz', 0x9be38a, 48, F.comic, 1.6);
      v?.v.sprite.emote('sleepy', 1.5);
      break;
    }
    case 'mdGhost': {
      const v = catAt(ctx, e.uid);
      const p = v?.p ?? { x: e.x, y: e.y };
      ctx.fxp.burst(p.x, p.y - 40, { count: 20, tint: [0x2f5fff, 0x9fb4ff, 0xffffff], speed: [60, 220], gravity: -80 });
      word(ctx, p.x, p.y - 120, '¡BUU!', 0x6f8cff, 46, F.comic, 0.9);
      if (v) {
        const s = v.v.sprite as unknown as { tint: number };
        const was = s.tint;
        s.tint = 0x7f9cff;
        window.setTimeout(() => {
          if (!v.v.destroyed) s.tint = was;
        }, 2600);
      }
      break;
    }
    case 'mdRival':
      onomatopoeia(ctx.wfx, e.x, e.y - 140, e.n ? '¡TE DEJÉ GANAR!' : '¡RIVAL!', { color: 0xbfd4ff, size: 80 });
      if (fl) flash(ctx.overlay, 0xffffff, 0.5, 0.2);
      ctx.shaker.add(0.6);
      break;
    case 'mdGrab':
      word(ctx, e.x, e.y - 90, '¡TE TENGO!', 0x9fd16f, 40, F.comic, 0.9);
      ctx.fxp.burst(e.x, e.y, { count: 14, tint: [0x5f8f45, 0x7d8a6a, INK], speed: [80, 260], gravity: 300 });
      sfx('hit', 0.9);
      break;
    case 'mdReform': {
      const v = catAt(ctx, e.uid);
      const p = v?.p ?? { x: e.x, y: e.y };
      const g = new Graphics();
      for (let k = 0; k < 4; k++) g.circle(p.x, p.y - 40, 50 + k * 14).stroke({ width: 5, color: k % 2 ? 0xc9a86a : 0x7c8a4a });
      fleeting(ctx, g, 0.8, 0.4);
      gsap.from(g.scale, { x: 1.6, y: 1.6, duration: 0.4 });
      word(ctx, p.x, p.y - 140, 'SE VUELVE A ENROLLAR', 0xc9a86a, 34, F.poster, 1.1);
      sfx('levelup', 0.9);
      break;
    }
    case 'mdNoir':
      ctx.flt(e.x, e.y - 220, 'SIN COLOR: TODO LES PEGA SÚPER EFECTIVO', { color: 0xf2f2f2, size: 30, font: F.poster, dur: 1.8 });
      break;
    case 'mdFuture':
      onomatopoeia(ctx.wfx, e.x, e.y - 160, '+2 GATOS', { color: 0x1fb6ff, size: 70, font: F.glitch });
      ctx.flt(e.x, e.y - 230, 'TU PRÓXIMO TURNO DISPARAN DOS GATOS MÁS', { color: C.paper, size: 28, font: F.poster, dur: 1.8 });
      break;
    case 'mdHeadline': {
      const c = ctx.sim.sides[e.side].cats.find((k) => k.def.uid === e.uid);
      const page = new Container();
      const bg = new Graphics().rect(-300, -90, 600, 180).fill(0xf3eedf).stroke({ width: 6, color: INK });
      const t = poster(`¡${(c?.def.name ?? 'ESTE GATO').toUpperCase()}`, 40, INK);
      t.anchor.set(0.5);
      t.y = -36;
      if (t.width > 560) t.scale.set(560 / t.width);
      const t2 = poster('ES UNA AMENAZA!', 54, 0xc8102e);
      t2.anchor.set(0.5);
      t2.y = 28;
      page.addChild(bg, t, t2);
      page.position.set(e.x, e.y - 210);
      page.rotation = 0.06;
      fleeting(ctx, page, 1.4, 0.4);
      gsap.from(page.scale, { x: 2.5, y: 2.5, duration: 0.25, ease: 'back.out(2)' });
      sfx('paper', 0.8);
      break;
    }
    case 'mdCrush':
      onomatopoeia(ctx.wfx, e.x, e.y - 120, '¡CRUNCH!', { color: 0x9fd6a0, size: 120 });
      for (let i = 0; i < 9; i++) ctx.fxp.burst(e.x - 400 + i * 100, e.y, { count: 10, tint: [0x8a7a62, 0xc4bdab, INK], speed: [150, 450], angle: [-Math.PI * 0.95, -Math.PI * 0.05], gravity: 700, stepped: true });
      ctx.shaker.add(1.2);
      sfx('bigboom');
      break;
    case 'mdMicDrop':
      onomatopoeia(ctx.wfx, e.x, e.y - 160, 'MIC DROP', { color: 0xe6e6e6, size: 100 });
      ctx.flt(e.x, e.y - 240, `SIN RÉPLICA: ${e.n ?? 2} TURNOS SIN ULTI`, { color: C.paper, size: 30, font: F.poster, dur: 1.8 });
      ctx.shaker.add(0.5);
      sfx('bigboom', 1.4);
      break;
    case 'mdGaze':
      ctx.flt(e.x, e.y - 170, 'TE SIGUE CON LA MIRADA', { color: 0xd8c89a, size: 30, font: F.poster, dur: 1.8 });
      break;
    case 'mdBite':
      onomatopoeia(ctx.wfx, e.x, e.y - 60, '¡ÑAM!', { color: 0xc77dff, size: 90 });
      ctx.fxp.burst(e.x, e.y, { count: 26, tint: [0xffffff, 0xc77dff, INK], speed: [100, 400], stepped: true });
      sfx('nyam', 0.9);
      ctx.shaker.add(0.4);
      break;
    case 'mdStain': {
      const g = new Graphics();
      for (let i = 0; i < 9; i++) g.circle(e.x + Math.cos(i * 2.1) * (10 + (i % 3) * 14), e.y + Math.sin(i * 2.1) * (8 + (i % 3) * 10), 14 + (i % 4) * 5).fill({ color: 0xa3141e, alpha: 0.85 });
      fleeting(ctx, g, 2.2, 0.8);
      gsap.from(g.scale, { x: 0.2, y: 0.2, duration: 0.25 });
      word(ctx, e.x, e.y - 90, 'LA MANCHA NO SE QUITA', 0xff6a6a, 30, F.poster, 1.5);
      break;
    }
    case 'mdChains':
      ctx.flt(e.x, e.y - 240, 'ENCADENADOS: LO QUE RECIBE UNO, LO SIENTEN TODOS', { color: 0x9fc2d8, size: 28, font: F.poster, dur: 1.8 });
      sfx('hit', 0.6);
      break;
    case 'mdSpray':
      word(ctx, e.x, e.y - 70, '¡PSSSST!', 0xe0c27a, 40, F.comic, 0.9);
      ctx.fxp.burst(e.x, e.y, { count: 40, tint: [0x1a1030, 0x6a5acd, 0xe0c27a], speed: [40, 200], gravity: 0, life: [0.5, 1] });
      ctx.flt(e.x, e.y - 150, 'SU NÚCLEO, BORRADO DESDE ADENTRO', { color: C.paper, size: 28, font: F.poster, dur: 1.6 });
      break;
    case 'mdBook':
      word(ctx, e.x, e.y - 120, 'LA CUENTA ESTÁ ABIERTA', 0xf2c14e, 32, F.poster, 1.4);
      sfx('coin', 0.8);
      break;
    case 'mdBill': {
      onomatopoeia(ctx.wfx, e.x, e.y - 140, '¡A PAGAR!', { color: 0xf2c14e, size: 100 });
      for (let i = 0; i < 12; i++)
        window.setTimeout(() => {
          if (ctx.wfx.destroyed) return;
          const c = coin(16);
          c.position.set(e.x - 300 + i * 52, e.y - 300);
          fleeting(ctx, c, 0.8, 0.3);
          gsap.to(c, { y: e.y, duration: 0.5, ease: 'power2.in' });
        }, i * 40);
      sfx('coin', 1.1);
      ctx.shaker.add(0.5);
      break;
    }
  }
}
