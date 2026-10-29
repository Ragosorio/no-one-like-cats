/**
 * Capitán Michimérica: the shield universe (the star-spangled shield soldier — here with his own shield: red and white
 * rings, a blue center, a white paw; no star, no real flag). A 1940s comic page in sepia: a field of trenches and
 * sandbags, barbed-wire posts, broken trees, smoke columns, biplanes, strings of red-and-white pennants; a yellowed
 * caption: «HACE MUCHAS, MUCHAS SIESTAS…». The shield flies in spinning and ricochets off three corners of the page —
 * ¡CLANG! ¡CLANG! ¡CLANG! — and every bounce pours color back into the old page, until it returns to his paw with a
 * star-burst. Then frost creeps in from the edges: «…Y LUEGO SE DURMIÓ 70 AÑOS EN EL HIELO.»
 * Payoff: the ice shatters, fireworks in red, white and blue, the pennants flap; ¡DE PIE! (…después de la siesta.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, CHEER, burst, every, flashOf, later, score, starburst } from './kit';
import { hideDisc } from './kitA';
import { mix, rng, stash, vgrad } from './kitB';
import { beat, paid, pay, smooth } from './kitC';
import { aside, ngon, onCat, streak, twinkle } from './kitD';
import { TAU, caption, halftone, hidden, lazy, prepWord, pulse, sparks } from './kitG';

const SKY = [0x5f9fd4, 0x8cc0e4, 0xcfe6f2];
const FIELD = [0x7a8a48, 0x6a6a3a, 0x5a4a30];
const RED = 0xd62839;
const BLUE = 0x1f3a7a;
const SAND = 0xc8b07a;
const SEPIA = 0xd8b27a;
const ICE = 0xdff4ff;

/** his shield (origin at its center, radius r): red and white rings, blue center, a white paw */
function shield(r: number) {
  const g = new Graphics();
  const lw = Math.max(2, r * 0.05);
  g.poly(ngon(0, 0, r, r, 32)).fill(RED).stroke({ width: lw, color: C.ink });
  g.poly(ngon(0, 0, r * 0.78, r * 0.78, 30)).fill(0xffffff);
  g.poly(ngon(0, 0, r * 0.58, r * 0.58, 28)).fill(RED);
  g.poly(ngon(0, 0, r * 0.4, r * 0.4, 24)).fill(BLUE);
  g.poly(ngon(0, r * 0.07, r * 0.13, r * 0.11, 10)).fill(0xffffff);
  for (const [x, y] of [
    [-0.16, -0.06],
    [-0.06, -0.15],
    [0.06, -0.15],
    [0.16, -0.06],
  ])
    g.poly(ngon(x * r, y * r, r * 0.045, r * 0.055, 8)).fill(0xffffff);
  g.poly([-r * 0.62, -r * 0.5, -r * 0.3, -r * 0.74, -r * 0.2, -r * 0.62, -r * 0.5, -r * 0.4]).fill({ color: 0xffffff, alpha: 0.35 });
  return g;
}

/** a string of pennants hanging between (x0,y0) and (x1,y1), sagging `sag`; `t` flutters them (one Graphics) */
function drawPennants(g: Graphics, x0: number, y0: number, x1: number, y1: number, sag: number, t: number, flap: number, s: number, clear = true) {
  if (clear) g.clear();
  const n = Math.max(6, Math.round(Math.abs(x1 - x0) / (64 * s)));
  const at = (q: number): [number, number] => [x0 + (x1 - x0) * q, y0 + (y1 - y0) * q + Math.sin(q * Math.PI) * sag];
  const line: number[] = [];
  for (let i = 0; i <= 16; i++) line.push(...at(i / 16));
  g.poly(line, false).stroke({ width: 2.5 * s, color: 0x3a2a1a });
  for (let i = 0; i < n; i++) {
    const qa = (i + 0.1) / n;
    const qb = (i + 0.9) / n;
    const [ax, ay] = at(qa);
    const [bx, by] = at(qb);
    const sw = Math.sin(t * 6 + i * 0.9) * 10 * s * flap;
    const tip: [number, number] = [(ax + bx) / 2 + sw, (ay + by) / 2 + 44 * s];
    g.poly([ax, ay, bx, by, ...tip]).fill(i % 2 ? 0xffffff : RED).stroke({ width: 1.5 * s, color: 0x3a2a1a, join: 'round' });
    if (i % 2) g.poly([ax + (bx - ax) * 0.3, ay + (by - ay) * 0.3 + 6 * s, ax + (bx - ax) * 0.7, ay + (by - ay) * 0.7 + 6 * s, ...tip]).fill(RED);
  }
}

/** a biplane (origin at its center, facing right) */
function biplane(s = 1) {
  const g = new Graphics();
  g.poly(ngon(0, 0, 60 * s, 12 * s, 12)).fill(0x5a6a3a).stroke({ width: 2.5 * s, color: 0x2a2a1a });
  g.rect(-14 * s, -34 * s, 34 * s, 8 * s).fill(0x6a7a48).stroke({ width: 2 * s, color: 0x2a2a1a });
  g.rect(-14 * s, 8 * s, 34 * s, 8 * s).fill(0x6a7a48).stroke({ width: 2 * s, color: 0x2a2a1a });
  g.poly(streak(-6 * s, -26 * s, -6 * s, 8 * s, 1.5 * s, 1.5 * s)).fill(0x2a2a1a).poly(streak(12 * s, -26 * s, 12 * s, 8 * s, 1.5 * s, 1.5 * s)).fill(0x2a2a1a);
  g.poly([-60 * s, 0, -74 * s, -22 * s, -52 * s, -4 * s]).fill(0x5a6a3a);
  g.poly(ngon(64 * s, 0, 4 * s, 18 * s, 8)).fill({ color: 0x2a2a1a, alpha: 0.5 });
  return g;
}

/** the old field: sky, smoke columns, far hills, the field, trenches with sandbags, posts and wire, broken trees */
function field(w: number, h: number, hz: number, u: number, seed: number) {
  const k = new Container();
  const sky = vgrad(new Graphics(), 0, 0, w, hz + 4, SKY, 12);
  const r = rng(seed);
  const smoke = new Graphics();
  for (let i = 0; i < Math.max(2, Math.round(w / (600 * u))); i++) {
    const x = (i + 0.3 + r() * 0.4) * (w / Math.max(2, Math.round(w / (600 * u))));
    for (let j = 0; j < 7; j++) smoke.poly(ngon(x + j * 18 * u + Math.sin(j) * 20 * u, hz - j * 60 * u, (30 + j * 12) * u, (26 + j * 10) * u, 12)).fill({ color: 0x8a8a86, alpha: 0.55 - j * 0.05 });
  }
  const land = new Graphics();
  land.poly([0, hz + 20 * u, ...smooth([0, hz, w * 0.25, hz - 30 * u, w * 0.55, hz - 10 * u, w * 0.8, hz - 40 * u, w, hz - 5 * u], 4, false), w, hz + 20 * u]).fill(0x8a9a68);
  vgrad(land, 0, hz, w, h - hz, FIELD, 8);
  // craters
  for (let i = 0; i < Math.round(w / (380 * u)); i++) {
    const x = r() * w;
    const y = hz + 40 * u + r() * (h - hz) * 0.6;
    land.poly(ngon(x, y, (50 + r() * 50) * u, (12 + r() * 8) * u, 12)).fill({ color: 0x3a2a1a, alpha: 0.4 });
  }
  // trench lines of sandbags
  for (const [yy, k2] of [
    [hz + 110 * u, 0.7],
    [h - 120 * u, 1.1],
  ]) {
    // (a small card: fewer, unstroked bags — a stroke costs four times the polygon)
    const small = u < 0.35;
    for (let x = -20 * u; x < w; x += Math.max(46 * u * k2, small ? 10 : 0)) {
      const y = yy + Math.sin(x * 0.01) * 10 * u;
      const a1 = land.poly(ngon(x, y, 26 * u * k2, 14 * u * k2, 10)).fill(SAND);
      if (!small) a1.stroke({ width: 2 * u, color: 0x6a5434 });
      const a2 = land.poly(ngon(x + 23 * u * k2, y - 18 * u * k2, 26 * u * k2, 14 * u * k2, 10)).fill(0xd6c08a);
      if (!small) a2.stroke({ width: 2 * u, color: 0x6a5434 });
    }
  }
  // barbed-wire posts and the wire (zigzags)
  const wy = hz + 60 * u;
  const wire: number[] = [];
  for (let x = 0; x <= w; x += 22 * u) wire.push(x, wy - 26 * u + ((x / (22 * u)) % 2 ? -8 : 8) * u);
  for (let x = 30 * u; x < w; x += 170 * u) {
    land.poly(streak(x - 14 * u, wy, x + 14 * u, wy - 50 * u, 3 * u, 3 * u)).fill(0x4a3a24);
    land.poly(streak(x + 14 * u, wy, x - 14 * u, wy - 50 * u, 3 * u, 3 * u)).fill(0x4a3a24);
  }
  land.poly(wire, false).stroke({ width: 2 * u, color: 0x3a3a3a });
  // broken trees
  for (const x of [w * 0.07, w * 0.88]) {
    land.poly([x - 10 * u, hz + 30 * u, x - 6 * u, hz - 170 * u, x + 4 * u, hz - 190 * u, x + 8 * u, hz - 150 * u, x + 12 * u, hz + 30 * u]).fill(0x3a2a1a);
    land.poly(streak(x, hz - 110 * u, x + 50 * u, hz - 150 * u, 4 * u, 2 * u)).fill(0x3a2a1a);
    land.poly(streak(x - 2 * u, hz - 70 * u, x - 44 * u, hz - 96 * u, 4 * u, 2 * u)).fill(0x3a2a1a);
  }
  k.addChild(sky, smoke, land);
  return { k, sky, smoke, land };
}

/** frost creeping in from a corner (a jagged fan of ice; origin at the corner, growing into +x +y) */
function frost(s: number, seed: number) {
  const g = new Graphics();
  const r = rng(seed);
  const pts: number[] = [0, 0];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    const rr = (i % 2 ? 0.55 + r() * 0.2 : 0.85 + r() * 0.3) * 420 * s;
    pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.poly(pts).fill({ color: ICE, alpha: 0.82 });
  g.poly(pts.map((v) => v * 0.6)).fill({ color: 0xffffff, alpha: 0.7 });
  for (let i = 0; i < 6; i++) {
    const a = r() * (Math.PI / 2);
    const L = (180 + r() * 200) * s;
    g.poly(streak(0, 0, Math.cos(a) * L, Math.sin(a) * L, 3 * s, 0.5)).fill({ color: 0x9fd8f0, alpha: 0.8 });
  }
  return g;
}

/** a firework: a ring of streaks out of a center (one Graphics; `k` 0..1 grows it) */
function drawFirework(g: Graphics, x: number, y: number, R: number, k: number, color: number) {
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const r0 = R * k * 0.55;
    const r1 = R * k;
    g.poly(streak(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1, 1, 5 * (1 - k * 0.5))).fill({ color, alpha: 1 - k * 0.6 });
  }
}

interface St {
  world: Container;
  flap: { v: number };
  ice: Container;
  dePie: () => ReturnType<typeof prepWord>;
  fw: Graphics;
}
const S = stash<St>();
const HZ = 620;
/** the shield in the painting (measured on the integrated SVG) */
const SHIELD_AT: [number, number] = [0.215, 0.5];

export const michimerica: Signature = {
  dark: false,
  frame: BLUE,
  tag: 'UNIVERSO DEL ESCUDO',
  open(c: SigCtx) {
    const k = new Container();
    const fd = field(W, H, HZ, 1, 1941);
    const planes = [biplane(1.1), biplane(0.8)];
    planes[0].position.set(420, 240);
    planes[1].position.set(1300, 160);
    const pen = new Graphics();
    const fw = new Graphics();
    const dots = halftone(new Graphics(), 0, 0, W, H, 30, 4.6, 0x3a2a1a, 0.1, (u, v) => 0.4 + 0.6 * v, 2400);
    k.addChild(fd.k, fw, ...planes, pen, dots);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the old page: sepia (a tint on the whole world) under a yellowed paper wash
    const wash = new Graphics().rect(0, 0, W, H).fill({ color: 0xf2dfb0, alpha: 0.3 });
    c.back.addChild(wash);
    const flap = { v: 0.4 };
    const ice = new Container();
    c.fg.addChild(ice);
    const dePie = lazy(c, 1.0, () => prepWord(c, c.fg, CHEER[0], CHEER[1], '¡DE PIE!', RED, 170, -0.06));
    S.set(c, { world: k, flap, ice, dePie, fw });
    const frame = (t: number) => {
      if (pen.destroyed) return;
      drawPennants(pen, -20, 40, W * 0.5, 70, 110, t, flap.v, 1);
      drawPennants(pen, W * 0.5, 70, W + 20, 30, 120, t + 1, flap.v, 1, false);
      planes[0].x = 420 + t * 70;
      planes[1].x = 1300 + t * 50;
      planes.forEach((p, i) => (p.y = (i ? 160 : 240) + Math.sin(t * 2 + i) * 6));
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) {
      wash.alpha = 0;
      return;
    }
    // the colors come back in three steps (one per bounce)
    let step = 0;
    k.tint = SEPIA;
    const colorStep = () => {
      if (paid(c)) return;
      step++;
      const q = Math.min(1, step / 3);
      if (!k.destroyed) k.tint = mix(SEPIA, 0xffffff, q);
      if (!wash.destroyed) wash.alpha = 0.3 * (1 - q);
    };
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    score(c, [
      [0.0, 'paper', 0.8],
      [0.25, 'whoosh', 0.8],
    ]);
    const cap1 = caption('HACE MUCHAS, MUCHAS SIESTAS…', { size: 36, fill: 0xf2d27a });
    hidden(c.fg, cap1, 60, 60, -0.02);
    beat(c, 0.08, () => {
      cap1.alpha = 1;
      if (!c.reduce) gsap.from(cap1, { x: -500, duration: 0.25, ease: 'power3.out' });
      gsap.to(cap1, { alpha: 0, delay: 1.2, duration: 0.25, onComplete: () => destroyTree(cap1) });
    });
    // the shield: in from the left, three corners, back to his paw
    const sh = new Container();
    const sg = shield(90);
    sh.addChild(sg);
    sh.position.set(-160, 300);
    c.fg.addChild(sh);
    const [px, py] = onCat(c, SHIELD_AT[0], SHIELD_AT[1]);
    const legs: [number, number, number][] = [
      [1810, 130, 0.3],
      [1810, 950, 0.22],
      [110, 950, 0.32],
      [px, py, 0.26],
    ];
    const words = [lazy(c, 0.12, () => prepWord(c, c.fg, 1560, 220, '¡CLANG!', 0xffe14d, 96, 0.12)), lazy(c, 0.35, () => prepWord(c, c.fg, 1560, 860, '¡CLANG!', 0xffffff, 96, -0.1)), lazy(c, 0.6, () => prepWord(c, c.fg, 360, 860, '¡CLANG!', 0xffe14d, 96, 0.08))];
    const spin = { a: 0 };
    if (!c.reduce) gsap.to(spin, { a: 30, duration: 1.4, delay: 0.25, ease: 'none', onUpdate: () => !sg.destroyed && ((sg.scale.x = 0.55 + 0.45 * Math.abs(Math.cos(spin.a))), (sg.rotation = spin.a * 0.3)) });
    let t = 0.25;
    legs.forEach(([x, y, d], i) => {
      later(c, t, () => {
        if (sh.destroyed) return;
        // skipped: the shield is already home
        if (paid(c)) return destroyTree(sh);
        if (c.reduce) sh.position.set(x, y);
        else gsap.to(sh, { x, y, duration: d, ease: 'none' });
      });
      t += d;
      later(c, t, () => {
        if (sh.destroyed) return;
        if (paid(c)) return destroyTree(sh);
        if (i < 3) {
          sfx('shield', 1.3 - i * 0.1);
          c.shaker.add(0.1);
          sparks(c, c.fg, x, y, 10, 0xffe14d, 160);
          pulse(c, c.fg, x, y, 0xffffff, 50, 4, 8, 0.45);
          words[i]().show(0.45);
          colorStep();
        } else {
          // home: a star-burst at his paw, the shield melts into the painting's own
          sfx('shield', 0.8);
          sfx('boom', 1.4);
          c.shaker.add(0.25);
          const sb = starburst(new Graphics(), 150, 14, 0xffe14d);
          sb.position.set(x, y);
          c.fg.addChildAt(sb, Math.max(0, c.fg.getChildIndex(sh)));
          if (!c.reduce) gsap.fromTo(sb.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' });
          gsap.to(sb, { alpha: 0, delay: 0.25, duration: 0.25, onComplete: () => destroyTree(sb) });
          if (!sg.destroyed) {
            sg.scale.x = 1;
            sg.rotation = 0;
          }
          gsap.to(sh, { alpha: 0, delay: 0.2, duration: 0.3, onComplete: () => destroyTree(sh) });
        }
      });
    });
    // the frost: the nap in the ice
    beat(c, 1.75, () => {
      sfx('freeze', 0.9);
      for (const [x, y, sx, sy, seed] of [
        [0, 0, 1, 1, 1],
        [W, 0, -1, 1, 2],
        [0, H, 1, -1, 3],
        [W, H, -1, -1, 4],
      ]) {
        const f = frost(1, seed);
        f.position.set(x, y);
        f.scale.set(sx, sy);
        ice.addChild(f);
        if (!c.reduce) gsap.from(f.scale, { x: sx * 0.1, y: sy * 0.1, duration: 0.35, ease: 'power2.out' });
      }
      const cap2 = caption('…Y LUEGO SE DURMIÓ 70 AÑOS\nEN EL HIELO.', { size: 32, fill: 0xcfeeff });
      cap2.position.set(W - 590, H - 210);
      cap2.rotation = 0.02;
      ice.addChild(cap2);
      if (!c.reduce) gsap.from(cap2, { alpha: 0, duration: 0.2 });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('freeze', 1.6);
    sfx('bigboom', 0.8);
    later(c, 0.2, () => sfx('fanfare', 1.0));
    c.shaker.add(0.4);
    flashOf(c, 0xffffff, 0.5, 0.35);
    if (st) {
      if (!st.world.destroyed) st.world.tint = 0xffffff;
      st.flap.v = 1.6;
      st.dePie().show(2.0);
      // the ice shatters
      if (!st.ice.destroyed) {
        for (const ch of [...st.ice.children]) gsap.to(ch, { alpha: 0, duration: 0.2, onComplete: () => destroyTree(ch as Container) });
        burst(c, c.fg, (i) => new Graphics().poly([0, -18 - (i % 3) * 8, 10, 0, 0, 14, -9, 2]).fill({ color: ICE, alpha: 0.9 }).stroke({ width: 2, color: 0x7fc8e8 }), 22, W / 2, H / 2, 1100, 1.0);
      }
      // fireworks over the field: red, white, blue
      const fw = st.fw;
      if (!fw.destroyed && !c.reduce) {
        const shots: [number, number, number, number, number][] = [
          [460, 220, 150, RED, 0],
          [1480, 180, 170, 0xffffff, 0.25],
          [760, 120, 120, 0x3a6ad8, 0.45],
          [1240, 300, 130, RED, 0.7],
          [300, 380, 110, 0x3a6ad8, 0.95],
          [1680, 360, 120, 0xffffff, 1.15],
        ];
        const p = { t: 0 };
        gsap.to(p, {
          t: 2.4,
          duration: 2.4,
          ease: 'none',
          onUpdate: () => {
            if (fw.destroyed) return;
            fw.clear();
            for (const [x, y, R, col, d] of shots) {
              const kk = (p.t - d) / 0.9;
              if (kk > 0 && kk < 1) drawFirework(fw, x, y, R, Math.sqrt(kk), col);
            }
          },
          onComplete: () => !fw.destroyed && fw.clear(),
        });
        for (let i = 0; i < 4; i++) later(c, 0.1 + i * 0.3, () => sfx('boom', 1.5 + (i % 2) * 0.3));
      }
    }
    aside(c, '…después de la siesta.', 0xffffff, { delay: 0.6, dur: 2.2 });
    burst(c, c.fg, (i) => new Graphics().poly(twinkle(0, 0, 18 + (i % 3) * 6)).fill(i % 3 === 0 ? RED : i % 3 === 1 ? 0xffffff : 0x3a6ad8), 16, W / 2, c.catY - 40, 800, 1.3);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const hz = h * 0.6;
    const fd = field(w, h, hz, u * 1.3, 64);
    const pen = new Graphics();
    const sag = h * 0.1;
    drawPennants(pen, -10 * u, h * 0.04, w + 10 * u, h * 0.06, sag, 0, 0.4, u * 1.4);
    const fw = new Graphics();
    const r = rng(3);
    const shots = Array.from({ length: Math.max(3, Math.round(w / (m * 0.5))) }, (_, i) => [((i + 0.5) / Math.max(3, Math.round(w / (m * 0.5)))) * w + (r() - 0.5) * m * 0.2, h * (0.2 + r() * 0.2), m * (0.12 + r() * 0.06), [RED, 0xffffff, 0x3a6ad8][i % 3], r()] as const);
    const drawFw = (t: number) => {
      fw.clear();
      for (const [x, y, R, col, ph] of shots) {
        const kk = (t * 0.45 + ph) % 1;
        drawFirework(fw, x, y, R, Math.sqrt(kk), col);
      }
    };
    drawFw(0.6);
    const dots = halftone(new Graphics(), 0, 0, w, h, 22 * u * 1.6, 3.6 * u * 1.6, 0x3a2a1a, 0.08, (_u, v) => 0.4 + 0.6 * v, 2600);
    k.addChild(fd.k, fw, pen, dots);
    if (live)
      liveLoop(k, (t) => {
        drawPennants(pen, -10 * u, h * 0.04, w + 10 * u, h * 0.06, sag, t, 0.6, u * 1.4);
        drawFw(t);
      });
    return k;
  },
};
