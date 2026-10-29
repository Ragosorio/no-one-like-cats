/**
 * Mazingato Z: the super-robot universe (a 1970s giant-robot anime). Dusk over the photon lab on the cliff; klaxons and
 * red beacons on the deck; the swimming pool splits in two and the giant rises out of the shaft on its lift, through
 * steam and searchlights; the little hover-cockpit flies in and docks on its head (¡PILOTO… ACOPLADO!) and a hero's
 * sunburst opens behind. Payoff: both rocket fists fly off in flames and blow up at the edges (and come back by
 * themselves); ¡PATAS… FUERA!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, cheer, every, flashOf, later, score, starburst } from './kit';
import { hideDisc } from './kitA';
import { borrowCat, fadeKill, puff, stash, vgrad } from './kitB';
import { aside, ngon, onCat, rnd, streak } from './kitD';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const DUSK = [0x0e1238, 0x2c2462, 0x7a3a78, 0xe0603a, 0xffb85a];
const RED = 0xd62839;
const STEEL = 0x8c96a6;
const WATER = 0x3ec6d8;
const HZ = 640;
const POOL_TOP = 760;
const POOL_BOT = 1000;
const LINE = 905;

/** the photon lab on the cliff: a tall central tower and two domed wings (origin at its base center, scale s) */
function lab(g: Graphics, x: number, y: number, s: number) {
  g.poly([x - 260 * s, y, x - 200 * s, y - 70 * s, x + 220 * s, y - 70 * s, x + 280 * s, y]).fill(0x3a3050);
  g.rect(x - 190 * s, y - 150 * s, 110 * s, 90 * s).fill(0xe6e2ee).rect(x + 80 * s, y - 150 * s, 110 * s, 90 * s).fill(0xe6e2ee);
  g.poly(ngon(x - 135 * s, y - 150 * s, 55 * s, 40 * s, 14)).fill(0xd2cede).poly(ngon(x + 135 * s, y - 150 * s, 55 * s, 40 * s, 14)).fill(0xd2cede);
  g.rect(x - 45 * s, y - 300 * s, 90 * s, 240 * s).fill(0xf2eef8);
  g.poly([x - 70 * s, y - 300 * s, x, y - 360 * s, x + 70 * s, y - 300 * s]).fill(0xd2cede);
  g.rect(x - 4 * s, y - 420 * s, 8 * s, 70 * s).fill(0xd2cede);
  for (let i = 0; i < 5; i++) g.rect(x - 30 * s, y - 280 * s + i * 40 * s, 60 * s, 14 * s).fill(0xffd27a);
  for (const dx of [-135, 135]) for (let i = 0; i < 3; i++) g.rect(x + (dx - 40 + i * 30) * s, y - 125 * s, 18 * s, 22 * s).fill(0xffd27a);
}

/** the pool deck (concrete, warning stripes, the shaft) — the water halves are separate so they can slide */
function deck(g: Graphics, w: number, h: number, top: number, bot: number, cx: number) {
  g.rect(0, HZ + 60, w, h - HZ - 60).fill(0x7c8290);
  for (let i = 0; i < 9; i++) g.poly(streak(cx, HZ + 70, cx + (i - 4) * 420, h, 1, 3)).fill({ color: 0x6a707c, alpha: 0.8 });
  // the pit: a trapezoid with yellow-and-black edges
  const tw = 430;
  const bw = 640;
  g.poly([cx - tw - 30, top - 14, cx + tw + 30, top - 14, cx + bw + 40, bot + 18, cx - bw - 40, bot + 18]).fill(0x2a2d36);
  for (let i = 0; i < 16; i++) {
    const u0 = i / 16;
    const u1 = (i + 0.5) / 16;
    const xa = cx - tw - 30 + (2 * tw + 60) * u0;
    const xb = cx - tw - 30 + (2 * tw + 60) * u1;
    g.poly([xa, top - 14, xb, top - 14, xb + 8, top - 2, xa + 8, top - 2]).fill(0xffc94a);
  }
  g.poly([cx - tw, top, cx + tw, top, cx + bw, bot, cx - bw, bot]).fill(0x0c0f16);
  // the lit lift shaft walls
  g.poly([cx - tw, top, cx - tw + 60, top + 30, cx - bw + 90, bot, cx - bw, bot]).fill(0x1c2230);
  g.poly([cx + tw, top, cx + tw - 60, top + 30, cx + bw - 90, bot, cx + bw, bot]).fill(0x1c2230);
}

/** one half of the pool's water (left = -1, right = 1), as a polygon over the pit */
function half(side: number, cx: number, top: number, bot: number) {
  const g = new Graphics();
  const tw = 430;
  const bw = 640;
  const pts = side < 0 ? [cx - tw, top, cx, top, cx, bot, cx - bw, bot] : [cx, top, cx + tw, top, cx + bw, bot, cx, bot];
  g.poly(pts).fill(WATER);
  for (let i = 1; i < 6; i++) {
    const y = top + ((bot - top) * i) / 6;
    const x0 = side < 0 ? cx - tw - ((bw - tw) * i) / 6 + 30 : cx + 20;
    const x1 = side < 0 ? cx - 20 : cx + tw + ((bw - tw) * i) / 6 - 30;
    g.poly(streak(x0, y, x1, y, 1.5, 1.5)).fill({ color: 0xbff4fa, alpha: 0.6 });
  }
  g.poly(side < 0 ? [cx - 8, top, cx, top, cx, bot, cx - 8, bot] : [cx, top, cx + 8, top, cx + 8, bot, cx, bot]).fill(0xe6fbff);
  return g;
}

/** a rocket fist (pointing right at angle 0): cuff, chunky knuckles, thumb */
function fist(s = 1): Graphics {
  const g = new Graphics();
  const ink = { width: 5 * s, color: C.ink, join: 'round' as const };
  g.rect(-110 * s, -44 * s, 60 * s, 88 * s).fill(0x2a2a33).stroke(ink);
  g.rect(-100 * s, -44 * s, 14 * s, 88 * s).fill(RED);
  g.roundRect(-56 * s, -58 * s, 110 * s, 116 * s, 26 * s).fill(STEEL).stroke(ink);
  for (let i = 0; i < 4; i++) g.roundRect(30 * s, -54 * s + i * 27 * s, 40 * s, 25 * s, 10 * s).fill(0xa8b2c2).stroke({ width: 4 * s, color: C.ink });
  g.roundRect(-30 * s, -76 * s, 56 * s, 32 * s, 12 * s).fill(0xa8b2c2).stroke({ width: 4 * s, color: C.ink });
  g.rect(-50 * s, -40 * s, 70 * s, 12 * s).fill({ color: 0xffffff, alpha: 0.35 });
  return g;
}

/** flames behind a fist (pointing right), redrawn with time t */
function flames(g: Graphics, t: number, s = 1) {
  g.clear();
  for (const [L, col, wd] of [
    [300, 0xff4a1a, 62],
    [220, 0xffa31a, 44],
    [140, 0xfff2a0, 26],
  ] as const) {
    const fl = L * s * (0.85 + 0.15 * Math.sin(t * 40 + L));
    g.poly([-100 * s, -wd * s, -100 * s - fl * 0.6, -wd * s * 0.7, -100 * s - fl, 0, -100 * s - fl * 0.6, wd * s * 0.7, -100 * s, wd * s]).fill(col);
  }
}

/** the hover-cockpit: a red-and-black saucer with a glass canopy and a little cat inside */
function cockpit(s = 1): Container {
  const k = new Container();
  const g = new Graphics();
  g.poly([-110 * s, 0, -70 * s, -24 * s, 70 * s, -24 * s, 110 * s, 0, 70 * s, 22 * s, -70 * s, 22 * s]).fill(RED).stroke({ width: 5 * s, color: C.ink, join: 'round' });
  g.poly([-110 * s, 0, 110 * s, 0, 70 * s, 22 * s, -70 * s, 22 * s]).fill(0x24242c);
  g.poly([-150 * s, -6 * s, -100 * s, -10 * s, -100 * s, 8 * s, -150 * s, 4 * s]).fill(0x24242c).poly([150 * s, -6 * s, 100 * s, -10 * s, 100 * s, 8 * s, 150 * s, 4 * s]).fill(0x24242c);
  g.poly(ngon(0, -26 * s, 52 * s, 40 * s, 18)).fill({ color: 0x9fe8ff, alpha: 0.55 }).stroke({ width: 4 * s, color: C.ink });
  // the pilot: a little gray cat head
  g.poly([-24 * s, -30 * s, -20 * s, -58 * s, -6 * s, -42 * s, 6 * s, -42 * s, 20 * s, -58 * s, 24 * s, -30 * s, 0, -16 * s]).fill(0x6a6a74);
  g.poly(ngon(-8 * s, -34 * s, 4 * s, 4 * s, 6)).fill(0xffd23f).poly(ngon(8 * s, -34 * s, 4 * s, 4 * s, 6)).fill(0xffd23f);
  g.poly(ngon(-18 * s, -40 * s, 14 * s, 8 * s, 8, -0.6)).fill({ color: 0xffffff, alpha: 0.6 });
  k.addChild(g);
  return k;
}

/** the searchlights from the deck: translucent beams from (x, y) at angle a */
function beams(g: Graphics, t: number, pts: [number, number][], len: number, wd: number) {
  g.clear();
  pts.forEach(([x, y], i) => {
    const a = -Math.PI / 2 + Math.sin(t * (0.9 + i * 0.23) + i * 1.7) * 0.55;
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    g.poly(streak(x, y, ex, ey, wd * 0.08, wd)).fill({ color: 0xfff3c0, alpha: 0.14 });
    g.poly(streak(x, y, ex, ey, wd * 0.04, wd * 0.45)).fill({ color: 0xfff3c0, alpha: 0.12 });
  });
}

/** the hero's sunburst (red and yellow wedges) */
function sunburst(g: Graphics, r: number, n: number) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const b = a + Math.PI / n;
    g.poly([0, 0, Math.cos(a) * r, Math.sin(a) * r, Math.cos(b) * r, Math.sin(b) * r]).fill({ color: i % 2 ? 0xffc94a : RED, alpha: 0.55 });
  }
  return g;
}

interface St {
  lend: ReturnType<typeof borrowCat> | null;
  burst: Graphics;
}
const S = stash<St>();

export const mazingato: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO SUPERROBOT',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, HZ + 60, DUSK, 22);
    const far = new Graphics();
    far.poly([0, HZ, 220, HZ - 90, 420, HZ - 40, 700, HZ - 120, 1000, HZ - 30, 1300, HZ - 100, 1600, HZ - 50, 1920, HZ - 110, 1920, HZ + 60, 0, HZ + 60]).fill(0x2a1e4a);
    far.rect(0, HZ + 20, W, 40).fill(0x1c2a5a);
    for (let i = 0; i < 6; i++) far.poly(streak(200 + i * 300, HZ + 32, 330 + i * 300, HZ + 32, 1.5, 1.5)).fill({ color: 0xffb85a, alpha: 0.5 });
    lab(far, 300, HZ + 24, 0.8);
    const burstG = sunburst(new Graphics(), 1500, 28);
    burstG.position.set(W / 2, c.catY - 60);
    burstG.alpha = 0;
    const deckG = new Graphics();
    deck(deckG, W, H, POOL_TOP, POOL_BOT, W / 2);
    const left = half(-1, W / 2, POOL_TOP, POOL_BOT);
    const right = half(1, W / 2, POOL_TOP, POOL_BOT);
    const lights = new Graphics();
    const beacons = new Graphics();
    // the water halves over the shaft (they slide off to the sides; the stencil keeps him under the water line)
    k.addChild(sky, far, burstG, lights, deckG, left, right);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    const bpos: [number, number][] = [
      [200, 900],
      [W - 200, 900],
      [W / 2 - 700, 1040],
      [W / 2 + 700, 1040],
    ];
    const drawBeacons = (t: number) => {
      beacons.clear();
      bpos.forEach(([x, y], i) => {
        const on = Math.sin(t * 9 + i * 1.6) > 0;
        beacons.rect(x - 16, y - 6, 32, 30).fill(0x2a2d36).poly(ngon(x, y - 14, 16, 18, 10)).fill(on ? 0xff2a2a : 0x7a1a1a);
        if (on) beacons.poly(ngon(x, y - 14, 46, 40, 12)).fill({ color: 0xff2a2a, alpha: 0.25 });
      });
    };
    k.addChild(beacons);
    drawBeacons(0);
    const lpts: [number, number][] = [
      [W / 2 - 560, 1000],
      [W / 2 - 300, 1060],
      [W / 2 + 300, 1060],
      [W / 2 + 560, 1000],
    ];
    beams(lights, 0.6, lpts, 1200, 140);
    if (!c.reduce)
      every(c, 30, (t) => {
        if (!lights.destroyed) beams(lights, t, lpts, 1200, 140);
        if (!beacons.destroyed) drawBeacons(t);
        if (!burstG.destroyed) burstG.rotation = t * 0.08;
      });
    const lend = c.short || c.reduce ? null : borrowCat(c);
    S.set(c, { lend, burst: burstG });
    const open = () => {
      left.x = -760;
      right.x = 760;
    };
    if (c.short || c.reduce) {
      open();
      burstG.alpha = 0.7;
      if (c.short) return;
    }
    // the lift slab under his feet (rises with him)
    const slab = new Graphics().poly([-300, 0, 300, 0, 340, 26, -340, 26]).fill(STEEL).stroke({ width: 4, color: C.ink }).rect(-340, 26, 680, 30).fill(0x4a505c);
    slab.position.set(W / 2, c.catY + 252);
    c.behind.addChild(slab);

    // klaxon; the pool splits; the giant rises
    score(c, [
      [0.0, 'alarm', 0.8],
      [0.45, 'alarm', 0.8],
      [0.25, 'whoosh', 0.4],
      [0.55, 'boom', 0.5],
      [0.85, 'boom', 0.45],
    ]);
    if (!c.reduce) {
      gsap.to(left, { x: -760, duration: 0.45, delay: 0.25, ease: 'power2.inOut' });
      gsap.to(right, { x: 760, duration: 0.45, delay: 0.25, ease: 'power2.inOut' });
    }
    if (lend) {
      const m = lend.mask();
      if (m) m.rect(0, 0, W, LINE).fill(0xffffff);
      const y0 = c.cat.y;
      c.cat.y = y0 + 560;
      slab.y += 560;
      // the stencil hides him under the water line; he rises on the lift
      const rise = { v: 0 };
      gsap.to(rise, {
        v: 1,
        duration: 0.8,
        delay: 0.55,
        ease: 'power2.out',
        onUpdate: () => {
          if (lend.given || c.cat.destroyed) return;
          c.cat.y = y0 + 560 * (1 - rise.v);
          if (!slab.destroyed) slab.y = c.catY + 252 + 560 * (1 - rise.v);
        },
      });
      for (let i = 0; i < 4; i++)
        later(c, 0.6 + i * 0.16, () => {
          c.shaker.add(0.18);
          puff(c, c.fg, W / 2 + (i % 2 ? 380 : -380), LINE - 20, 0xe8f4ff, 5, 90, 160);
        });
      // the splash at the shaft's mouth
      later(c, 0.62, () => {
        const sp = new Graphics();
        for (let i = 0; i < 14; i++) {
          const x = W / 2 + (i - 6.5) * 60;
          const hh = 120 + ((i * 53) % 7) * 30;
          sp.poly([x - 30, LINE, x, LINE - hh, x + 30, LINE]).fill(i % 2 ? WATER : 0xdffaff);
        }
        c.fg.addChild(sp);
        sp.pivot.set(0, LINE);
        sp.position.set(0, LINE);
        if (!c.reduce) gsap.fromTo(sp.scale, { y: 0.1 }, { y: 1, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 });
        fadeKill(sp, 0.4, 0.2);
      });
      later(c, 2.15, () => lend.give());
    }
    // the hover-cockpit docks on his head
    later(c, 1.3, () => {
      const [hx, hy] = onCat(c, 0.67, 0.17);
      const p = cockpit(0.62);
      p.position.set(W + 200, 80);
      p.rotation = -0.3;
      c.fg.addChild(p);
      const dock = () => {
        sfx('shield', 0.9);
        sfx('zap', 1.1);
        c.shaker.add(0.25);
        const sp = new Graphics().poly(ngon(0, 0, 90, 90, 16)).fill({ color: 0xfff2a0, alpha: 0.6 });
        sp.position.set(hx, hy);
        c.fg.addChild(sp);
        if (!c.reduce) gsap.fromTo(sp.scale, { x: 0.2, y: 0.2 }, { x: 1.6, y: 1.6, duration: 0.25 });
        fadeKill(sp, 0.05, 0.25);
        fadeKill(p, 0.1, 0.2);
        const t = txt('¡PILOTO…\nACOPLADO!', { fontFamily: F.heavy, fontSize: 64, fill: 0xffc94a, stroke: { color: RED, width: 10, join: 'round' }, align: 'center', lineHeight: 70 });
        t.anchor.set(0.5);
        t.position.set(W / 2 + 520, 300);
        t.rotation = -0.08;
        c.fg.addChild(t);
        if (!c.reduce) gsap.fromTo(t.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
        fadeKill(t, 0.75, 0.2);
      };
      if (c.reduce) {
        p.position.set(hx, hy);
        p.rotation = 0;
        dock();
      } else gsap.to(p, { x: hx, y: hy, rotation: 0, duration: 0.32, ease: 'power2.in', onComplete: dock });
    });
    // the hero's sunburst, on an organ-ish chord
    later(c, 1.75, () => {
      sfx('fanfare', 0.6);
      sfx('sting', 0.7);
      if (!burstG.destroyed) gsap.to(burstG, { alpha: 0.7, duration: c.reduce ? 0 : 0.25 });
    });
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    st?.lend?.give();
    sfx('shoot', 0.7);
    sfx('bigboom', 0.9);
    c.shaker.add(0.5);
    flashOf(c, 0xffe0a0, 0.5, 0.3);
    if (st && !st.burst.destroyed) gsap.fromTo(st.burst.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.5 });
    // two rocket fists: up-left and right; they blow up at the edges and come back
    const shots: [number, number, number, number][] = [
      [0.15, 0.19, 140, 150],
      [0.87, 0.56, W - 120, 560],
    ];
    shots.forEach(([fx, fy, tx, ty], i) => {
      const [sx, sy] = onCat(c, fx, fy);
      const k = new Container();
      const fl = new Graphics();
      const f = fist(0.9);
      k.addChild(fl, f);
      k.position.set(sx, sy);
      k.rotation = Math.atan2(ty - sy, tx - sx);
      c.fg.addChild(k);
      flames(fl, 0, 0.9);
      const boom = () => {
        sfx('boom', 1.1 + i * 0.15);
        c.shaker.add(0.3);
        const b = starburst(new Graphics(), 150, 14, 0xffc94a, RED, 0.55);
        b.position.set(tx, ty);
        c.fg.addChild(b);
        if (!c.reduce) gsap.fromTo(b.scale, { x: 0.2, y: 0.2 }, { x: 1.3, y: 1.3, duration: 0.25, ease: 'back.out(2)' });
        fadeKill(b, 0.35, 0.3);
      };
      if (c.reduce) {
        k.position.set(sx + (tx - sx) * 0.6, sy + (ty - sy) * 0.6);
        boom();
        fadeKill(k, 1, 0.3);
        return;
      }
      const p = { t: 0 };
      gsap.to(p, { t: 3, duration: 3, ease: 'none', onUpdate: () => !fl.destroyed && flames(fl, p.t, 0.9) });
      gsap.to(k, { x: tx, y: ty, duration: 0.32, delay: i * 0.1, ease: 'power2.in', onComplete: boom });
      // …and back to the arm, by themselves
      gsap.to(k, { x: sx, y: sy, duration: 0.45, delay: 1.25 + i * 0.12, ease: 'power2.inOut', onStart: () => !k.destroyed && (k.rotation += Math.PI) });
      fadeKill(k, 1.65 + i * 0.12, 0.15);
    });
    // the chest's V of heat
    const [vx, vy] = onCat(c, 0.57, 0.45);
    const v = new Graphics();
    v.poly([0, 0, -380, 520, -200, 560, 0, 160, 200, 560, 380, 520]).fill({ color: 0xff5a1a, alpha: 0.35 }).poly([0, 30, -200, 420, -110, 440, 0, 170, 110, 440, 200, 420]).fill({ color: 0xffd27a, alpha: 0.4 });
    v.position.set(vx, vy);
    c.behind.addChild(v);
    if (!c.reduce) gsap.fromTo(v.scale, { x: 0.3, y: 0.1 }, { x: 1, y: 1, duration: 0.3, ease: 'power2.out' });
    fadeKill(v, 0.7, 0.4);
    cheer(c, '¡PATAS… FUERA!', 0xffc94a, 140, 2.0);
    aside(c, '…y regresan solas.', 0xffffff, { delay: 1.2, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const hz = h * 0.6;
    const sky = vgrad(new Graphics(), 0, 0, w, hz + h * 0.06, DUSK, 16);
    const far = new Graphics();
    const r = rnd(4);
    const pts: number[] = [0, hz];
    for (let x = 0; x <= w; x += m * 0.3) pts.push(x, hz - m * (0.03 + r() * 0.1));
    pts.push(w, hz + h * 0.06, 0, hz + h * 0.06);
    far.poly(pts).fill(0x2a1e4a);
    lab(far, w / 2 - m * 0.75, hz + h * 0.02, s * 0.9);
    if (w > m * 2) lab(far, w / 2 + m * 1.6, hz + h * 0.02, s * 0.7);
    const burstG = sunburst(new Graphics(), Math.hypot(w, h), 24);
    burstG.position.set(w / 2, h * 0.5);
    burstG.alpha = 0.5;
    // the open pool, scaled to the card: deck, pit, the halves pushed aside
    const pool = new Container();
    const dk = new Graphics();
    deck(dk, W, H, POOL_TOP, POOL_BOT, W / 2);
    const L = half(-1, W / 2, POOL_TOP, POOL_BOT);
    const R = half(1, W / 2, POOL_TOP, POOL_BOT);
    L.x = -760;
    R.x = 760;
    pool.addChild(dk, L, R);
    pool.scale.set(s);
    pool.position.set(w / 2 - (W / 2) * s, h - H * s + m * 0.03);
    // the deck spans the whole card width (a wide card is mostly deck)
    const deckWide = new Graphics().rect(0, pool.y + (HZ + 60) * s, w, h).fill(0x7c8290);
    const lights = new Graphics();
    const lp: [number, number][] = [
      [w / 2 - m * 0.5, h],
      [w / 2 + m * 0.5, h],
      [w / 2 - m * 1.2, h],
      [w / 2 + m * 1.2, h],
    ];
    beams(lights, 0.5, lp, h * 1.2, m * 0.14);
    k.addChild(sky, burstG, far, lights, deckWide, pool);
    if (live)
      liveLoop(k, (t) => {
        beams(lights, t, lp, h * 1.2, m * 0.14);
        burstG.rotation = t * 0.06;
      });
    return k;
  },
};
