/**
 * Supermichi: the sky universe (the caped flying hero from a lost planet; his own emblem — a gold diamond with a red
 * paw, never a letter). A comic-book city at sunset: art-deco towers with lit windows, the newspaper building with a
 * ringed globe on its roof («EL MAULLIDO»), halftone dots in the sky, and a crowd of cats on the rooftop pointing up
 * («¡MIREN!» «¿QUÉ ES ESO?»). A red-and-blue streak crosses the sky, loops round the tallest tower — ¡FIUUUM! — and
 * a pair of reporter's glasses comes tumbling down and lands at his paws. Then his CAPE billows across the whole screen,
 * and when it's gone the emblem shines behind him («¡ES UN GATO!»).
 * Payoff: the emblem flares, sunrays spin, the crowd jumps, newspaper pages fly; ¡ARRIBA! (…con lentes nadie lo
 * reconoce.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, CHEER, burst, drizzle, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { aside, balloon, ngon, onCat, say, streak, twinkle } from './kitD';
import { TAU, halftone, lazy, prepWord, pulse, ringPts, sunRays } from './kitG';

const SKY = [0x1b2766, 0x463a8c, 0xb4507a, 0xf0784e, 0xffb04a, 0xffd88a];
const TOWER = 0x2a2350;
const TOWER_L = 0x3b3166;
const WIN = 0xffd56a;
const RED = 0xd62839;
const BLUE = 0x2f4b8a;
const GOLD = 0xffd23f;

/** the hero's emblem: a gold diamond with an ink border and a red paw (origin at its center; s = half-height) */
function emblem(s: number) {
  const g = new Graphics();
  const lw = Math.max(2, s * 0.08);
  g.poly([0, -s, s * 1.15, -s * 0.18, 0, s, -s * 1.15, -s * 0.18]).fill(GOLD).stroke({ width: lw, color: C.ink, join: 'round' });
  g.poly([0, -s * 0.8, s * 0.92, -s * 0.16, 0, s * 0.78, -s * 0.92, -s * 0.16]).stroke({ width: lw * 0.5, color: RED, join: 'round' });
  // the paw: a pad and four toes
  g.poly(ngon(0, s * 0.16, s * 0.26, s * 0.21, 12)).fill(RED);
  for (const [x, y] of [
    [-0.3, -0.12],
    [-0.11, -0.28],
    [0.11, -0.28],
    [0.3, -0.12],
  ])
    g.poly(ngon(x * s, y * s, s * 0.09, s * 0.11, 9)).fill(RED);
  return g;
}

/**
 * the city: towers (stepped art-deco tops, spires), lit windows, the newspaper building with its ringed globe and sign;
 * returns the parts (the globe turns). base = the street line, u = scale.
 */
function city(w: number, base: number, u: number, seed: number, sign = true) {
  const k = new Container();
  const far = new Graphics();
  const near = new Graphics();
  const wins = new Graphics();
  const r = rng(seed);
  // far skyline (lighter, hazy)
  for (let x = -20 * u; x < w; x += (60 + r() * 70) * u) {
    const tw = (50 + r() * 60) * u;
    const th = (140 + r() * 200) * u;
    far.rect(x, base - th, tw, th).fill(0x5a4a86);
    if (r() < 0.4) far.poly([x + tw * 0.3, base - th, x + tw * 0.5, base - th - 40 * u, x + tw * 0.7, base - th]).fill(0x5a4a86);
  }
  // near towers with stepped tops
  const towers: [number, number, number][] = [];
  for (let x = -40 * u; x < w; x += (150 + r() * 170) * u) towers.push([x, (90 + r() * 70) * u, (180 + r() * 260) * u]);
  for (const [x, tw, th] of towers) {
    const top = base - th;
    near.rect(x, top, tw, th).fill(TOWER);
    near.rect(x + tw * 0.12, top - 34 * u, tw * 0.76, 34 * u).fill(TOWER);
    near.rect(x + tw * 0.28, top - 62 * u, tw * 0.44, 28 * u).fill(TOWER);
    near.poly([x + tw * 0.46, top - 62 * u, x + tw * 0.5, top - 120 * u, x + tw * 0.54, top - 62 * u]).fill(TOWER);
    near.rect(x + tw * 0.8, top, tw * 0.2, th).fill({ color: TOWER_L, alpha: 0.6 });
    // windows: a sparse grid, some lit
    for (let wy = top + 20 * u; wy < base - 20 * u; wy += 34 * u)
      for (let wx = x + 12 * u; wx < x + tw - 18 * u; wx += 24 * u) if (r() < 0.32) wins.rect(wx, wy, 10 * u, 16 * u);
  }
  wins.fill({ color: WIN, alpha: 0.85 });
  k.addChild(far, near, wins);
  // the newspaper building (left third) with its globe
  const nb = new Container();
  const ng = new Graphics();
  const bw = 300 * u;
  const bh = 470 * u;
  const bx = w * 0.17 - bw / 2;
  ng.rect(bx, base - bh, bw, bh).fill(0x332a5e);
  ng.rect(bx + 20 * u, base - bh - 40 * u, bw - 40 * u, 40 * u).fill(0x332a5e);
  for (let wy = base - bh + 120 * u; wy < base - 30 * u; wy += 40 * u) for (let wx = bx + 22 * u; wx < bx + bw - 30 * u; wx += 36 * u) if (r() < 0.5) ng.rect(wx, wy, 14 * u, 20 * u).fill({ color: WIN, alpha: 0.85 });
  ng.rect(bx - 10 * u, base - bh + 40 * u, bw + 20 * u, 60 * u).fill(0x241d46).stroke({ width: 3 * u, color: GOLD });
  nb.addChild(ng);
  if (sign) {
    const st = txt('EL MAULLIDO', { fontFamily: F.poster, fontSize: 40 * u, fill: GOLD, letterSpacing: 4 * u });
    st.anchor.set(0.5);
    st.position.set(bx + bw / 2, base - bh + 70 * u);
    nb.addChild(st);
  }
  const globe = new Graphics();
  globe.position.set(bx + bw / 2, base - bh - 120 * u);
  nb.addChild(globe);
  k.addChild(nb);
  return { k, globe, gr: 74 * u, top: towers };
}

/** the globe on the roof at time t: a gold sphere with turning meridians and a tilted ring */
function drawGlobe(g: Graphics, R: number, t: number) {
  g.clear();
  const lw = Math.max(1.5, R * 0.05);
  g.poly(ngon(0, 0, R, R, 28)).fill(0xe6b84a).stroke({ width: lw, color: 0x241d46 });
  for (let i = 0; i < 4; i++) {
    const a = t + (i / 4) * Math.PI;
    const rx = Math.abs(Math.cos(a)) * R;
    if (rx > 2) g.poly(ngon(0, 0, rx, R, 20)).stroke({ width: lw * 0.6, color: 0x8a6420 });
  }
  g.poly(streak(-R, 0, R, 0, lw * 0.4, lw * 0.4)).fill(0x8a6420);
  g.poly(ringPts(0, 0, R * 1.32, R * 1.46, 28, 0.28)).fill(GOLD);
  g.poly(ngon(0, R + 30, 8, 30, 6)).fill(0x241d46);
}

/** the rooftop crowd: cats from behind with arms up, pointing at the sky (rows: each row its own Graphics, they jump) */
function crowd(w: number, y: number, u: number, seed: number) {
  const rows: Graphics[] = [];
  const r = rng(seed);
  const FUR = [0x2a2a30, 0xf2a03a, 0xffffff, 0x9a9aa6, 0x5a4636, 0xd9772a, 0xf3e2c4];
  for (let j = 0; j < 2; j++) {
    const g = new Graphics();
    const yy = y + j * 70 * u;
    for (let x = r() * 40 * u; x < w; x += (78 + r() * 50) * u) {
      const s = (34 + r() * 12 + j * 8) * u;
      const col = FUR[Math.floor(r() * FUR.length)];
      const shirt = r() < 0.5 ? 0x6a4a86 : 0x3a5a9a;
      g.poly([x - s * 1.1, yy + s * 3, x - s * 0.9, yy + s * 0.8, x + s * 0.9, yy + s * 0.8, x + s * 1.1, yy + s * 3]).fill(shirt);
      // an arm up, pointing
      const side = r() < 0.5 ? -1 : 1;
      g.poly(streak(x + side * s * 0.7, yy + s * 1.1, x + side * s * 1.3, yy - s * 1.2, s * 0.22, s * 0.16)).fill(shirt);
      g.poly(ngon(x + side * s * 1.32, yy - s * 1.3, s * 0.2, s * 0.2, 8)).fill(col);
      g.poly([x - s, yy, x - s * 0.9, yy - s * 1.1, x - s * 0.35, yy - s * 0.65, x + s * 0.35, yy - s * 0.65, x + s * 0.9, yy - s * 1.1, x + s, yy, x + s * 0.7, yy + s * 0.75, x - s * 0.7, yy + s * 0.75]).fill(col);
    }
    rows.push(g);
  }
  return rows;
}

/** the reporter's glasses (black frames), origin at the bridge */
function glasses(s = 1) {
  const g = new Graphics();
  for (const x of [-34, 34]) g.poly(ringPts(x * s, 0, 22 * s, 30 * s, 16, 0.78)).fill(0x141414);
  for (const x of [-34, 34]) g.poly(ngon(x * s, 0, 22 * s, 17 * s, 14)).fill({ color: 0xcfe8ff, alpha: 0.5 });
  g.poly(streak(-10 * s, -4 * s, 10 * s, -4 * s, 3 * s, 3 * s)).fill(0x141414);
  g.poly(streak(-62 * s, -6 * s, -84 * s, -2 * s, 3 * s, 2 * s)).fill(0x141414);
  g.poly(streak(62 * s, -6 * s, 84 * s, -2 * s, 3 * s, 2 * s)).fill(0x141414);
  return g;
}

/** the cape that wipes the screen: one red sheet with a wavy leading edge and fold lines (origin at its leading edge) */
function capeSheet(ph: number) {
  const g = new Graphics();
  const edge: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const y = -120 + (i / 12) * (H + 240);
    edge.push(Math.sin(i * 1.3 + ph) * 70 + (i % 2) * 40, y);
  }
  g.poly([...edge, W * 2.4, H + 120, W * 2.4, -120]).fill(RED);
  for (let i = 1; i < 7; i++) {
    const x = 160 + i * 300;
    g.poly(streak(x, -120, x + Math.sin(i) * 120, H + 120, 22, 40)).fill({ color: 0x9a1222, alpha: 0.55 });
  }
  g.poly(edge.map((v, i) => (i % 2 ? v : v + 30)).concat([...edge].reverse().map((v, i) => (i % 2 ? v + 0 : v)))).fill({ color: 0xff5a6a, alpha: 0.4 });
  return g;
}

/** the flyer seen far off: a red-and-blue speck with a cape triangle */
function speck(s = 1) {
  const g = new Graphics();
  g.poly([-14 * s, 0, 18 * s, -6 * s, 18 * s, 6 * s]).fill(BLUE);
  g.poly([-6 * s, -2 * s, -30 * s, -12 * s, -26 * s, 10 * s]).fill(RED);
  g.poly(ngon(20 * s, 0, 6 * s, 6 * s, 8)).fill(0xf3e2c4);
  return g;
}

interface St {
  rows: Graphics[];
  row0: number[];
  jump: { v: number };
  em: Container;
  rays: Graphics;
  arriba: () => ReturnType<typeof prepWord>;
}
const S = stash<St>();
const BASE = 930;

export const supermichi: Signature = {
  dark: false,
  frame: BLUE,
  tag: 'UNIVERSO DEL CIELO',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, BASE, SKY, 22);
    halftone(sky, 0, 0, W, BASE * 0.7, 26, 4.2, 0xffffff, 0.12, (u, v) => 1 - v);
    const sun = new Graphics();
    for (let i = 7; i >= 1; i--) sun.poly(ngon(W * 0.66, BASE - 120, 60 * i, 60 * i, 28)).fill({ color: 0xffe08a, alpha: 0.07 });
    sun.poly(ngon(W * 0.66, BASE - 120, 110, 110, 30)).fill(0xffe9a8);
    const ct = city(W, BASE, 1, 38);
    const roof = new Graphics().rect(0, BASE - 6, W, H - BASE + 6).fill(0x1a1430).rect(0, BASE - 12, W, 10).fill(0x4a3a7a);
    const rows = crowd(W, BASE + 30, 1, 9);
    k.addChild(sky, sun, ct.k, roof, ...rows);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the emblem behind him (shown after the cape) and its rays
    const em = new Container();
    const rays = sunRays(new Graphics(), 0, 0, 900, 18, 0xfff3c0, 0.22, 0, 0.45);
    em.addChild(rays, emblem(175));
    em.position.set(W / 2, c.catY - 20);
    em.alpha = 0;
    c.behind.addChild(em);
    const row0 = rows.map((g) => g.y);
    const jump = { v: 0.3 };
    const arriba = lazy(c, 1.05, () => prepWord(c, c.fg, CHEER[0], CHEER[1], '¡ARRIBA!', GOLD, 170, -0.06));
    S.set(c, { rows, row0, jump, em, rays, arriba });
    if (!c.reduce)
      every(c, 30, (t) => {
        if (ct.globe.destroyed) return;
        drawGlobe(ct.globe, ct.gr, t * 1.6);
        rows.forEach((g, i) => !g.destroyed && (g.y = row0[i] - Math.max(0, Math.sin(t * (8 + i * 3) + i)) * 14 * jump.v));
        if (!rays.destroyed) rays.rotation = t * 0.15;
      });
    else drawGlobe(ct.globe, ct.gr, 0.4);
    if (c.short) {
      em.alpha = 1;
      return;
    }
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    score(c, [
      [0.0, 'whoosh', 0.6],
      [0.12, 'pop', 1.4],
      [0.3, 'pop', 1.2],
      [0.45, 'whoosh', 1.3],
      [0.95, 'boom', 1.6],
      [1.3, 'whoosh', 0.45],
    ]);
    // the crowd points up and shouts
    beat(c, 0.1, () => say(c, c.fg, balloon('¡MIREN!', { size: 40, tx: 40, ty: 90 }), 300, BASE - 160, 1.0, -0.05));
    beat(c, 0.3, () => say(c, c.fg, balloon('¿QUÉ ES ESO?', { size: 40, tx: -60, ty: 90 }), W - 330, BASE - 180, 0.95, 0.04));
    // the streak crosses the sky and loops round the tallest tower
    const trail = new Graphics();
    const sp = speck(2.1);
    c.back.addChild(trail, sp);
    const path = (u: number): [number, number] => {
      // in low left, up across the sky, a loop at upper right, out the top
      if (u < 0.55) {
        const q = u / 0.55;
        return [-80 + q * 1500, 760 - q * 560 - Math.sin(q * Math.PI) * 120];
      }
      const q = (u - 0.55) / 0.45;
      const a = -Math.PI / 2 + q * TAU * 0.85;
      return [1420 + Math.cos(a) * 170 + q * 200, 200 + 170 + Math.sin(a) * 170 - q * 500];
    };
    const pp = { u: 0 };
    const place = () => {
      if (sp.destroyed) return;
      const [x, y] = path(pp.u);
      const [px, py] = path(Math.max(0, pp.u - 0.01));
      sp.position.set(x, y);
      sp.rotation = Math.atan2(y - py, x - px);
      trail.clear();
      for (let i = 0; i < 14; i++) {
        const [ax, ay] = path(Math.max(0, pp.u - i * 0.022));
        const [bx, by] = path(Math.max(0, pp.u - (i + 1) * 0.022));
        const wd = 9 * (1 - i / 14);
        trail.poly(streak(ax, ay - 4, bx, by - 4, wd, wd * 0.9)).fill({ color: RED, alpha: 0.85 - i * 0.05 });
        trail.poly(streak(ax, ay + 5, bx, by + 5, wd * 0.8, wd * 0.7)).fill({ color: 0x5aa6ec, alpha: 0.85 - i * 0.05 });
      }
    };
    if (c.reduce) {
      pp.u = 0.5;
      place();
      later(c, 1.0, () => {
        destroyTree(sp);
        destroyTree(trail);
      });
    } else {
      place();
      gsap.to(pp, { u: 1, duration: 1.0, delay: 0.4, ease: 'sine.inOut', onUpdate: place, onComplete: () => (destroyTree(sp), destroyTree(trail)) });
    }
    const fiu = lazy(c, 0.55, () => prepWord(c, c.fg, 1450, 180, '¡FIUUUM!', 0xffffff, 96, 0.1));
    beat(c, 0.95, () => {
      fiu().show(0.6);
      pulse(c, c.back, 1420, 370, 0xffffff, 60, 6, 10, 0.6);
    });
    // the reporter's glasses tumble down and land at his paws
    const gl = glasses(1.2);
    gl.position.set(W / 2 + 160, -80);
    c.fg.addChild(gl);
    if (c.reduce) gl.position.set(W / 2 + 190, c.catY + 236);
    else {
      gsap.to(gl, { y: c.catY + 236, duration: 0.7, delay: 0.75, ease: 'bounce.out' });
      gsap.to(gl, { x: W / 2 + 190, rotation: 6 * Math.PI + 0.1, duration: 0.7, delay: 0.75, ease: 'power1.out' });
    }
    beat(c, 1.2, () => sfx('click', 1.6));
    // THE CAPE: it billows across the whole screen; behind it the emblem lights up
    beat(c, 1.35, () => {
      const cape = capeSheet(0.4);
      cape.x = W + 120;
      c.fg.addChild(cape);
      const reveal = () => {
        if (em.destroyed) return;
        em.alpha = 1;
      };
      if (c.reduce) {
        destroyTree(cape);
        reveal();
      } else {
        gsap.to(cape, { x: -W * 2.6, duration: 0.6, ease: 'power1.inOut', onComplete: () => destroyTree(cape) });
        later(c, 0.28, reveal);
      }
    });
    beat(c, 1.75, () => {
      say(c, c.fg, balloon('¡ES UN GATO!', { size: 44, jag: true, tx: 40, ty: 100 }), 360, BASE - 190, 0.7, -0.05);
      sfx('fanfare', 1.5);
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.0);
    sfx('boom', 0.9);
    later(c, 0.1, () => sfx('whoosh', 1.4));
    c.shaker.add(0.35);
    flashOf(c, 0xfff3c0, 0.55, 0.35);
    if (st) {
      st.em.alpha = 1;
      st.jump.v = 1;
      gsap.to(st.jump, { v: 0.3, delay: 2.2, duration: 1 });
      if (!c.reduce) gsap.fromTo(st.em.scale, { x: 1.35, y: 1.35 }, { x: 1, y: 1, duration: 0.5, ease: 'back.out(2)' });
    }
    st?.arriba().show(2.0);
    // a glint off the raised fist (measured on the painting)
    const [fx, fy] = onCat(c, 0.14, 0.15);
    const tw = new Graphics().poly(twinkle(0, 0, 60)).fill(0xffffff);
    tw.position.set(fx, fy);
    c.fg.addChild(tw);
    if (!c.reduce) gsap.fromTo(tw.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.14, yoyo: true, repeat: 1 });
    gsap.to(tw, { alpha: 0, delay: 0.3, duration: 0.15, onComplete: () => destroyTree(tw) });
    pulse(c, c.fg, fx, fy, GOLD, 40, 5, 8, 0.5);
    aside(c, '…con lentes nadie lo reconoce.', 0xffffff, { delay: 0.6, dur: 2.4 });
    // newspaper pages fly
    burst(
      c,
      c.fg,
      () => {
        const g = new Graphics().rect(-26, -34, 52, 68).fill(0xf4f0e3).stroke({ width: 2.5, color: C.ink });
        for (let i = 0; i < 5; i++) g.rect(-20, -26 + i * 11, i === 0 ? 40 : 30 + Math.random() * 10, 4).fill(0x8a857a);
        return g;
      },
      20,
      W / 2,
      c.catY - 60,
      900,
      1.6,
    );
    drizzle(c, c.back, () => new Graphics().rect(-14, -18, 28, 36).fill(0xf4f0e3).stroke({ width: 2, color: C.ink }), 0.18, 3.4);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const base = h * 0.86;
    const sky = vgrad(new Graphics(), 0, 0, w, base, SKY, 18);
    halftone(sky, 0, 0, w, base * 0.7, 26 * u * 1.6, 4.2 * u * 1.6, 0xffffff, 0.12, (_u, v) => 1 - v, 2400);
    const sun = new Graphics();
    for (let i = 7; i >= 1; i--) sun.poly(ngon(w / 2, base - 160 * u, 70 * i * u, 70 * i * u, 28)).fill({ color: 0xffe08a, alpha: 0.07 });
    const ct = city(w, base, u * 1.25, 21, m > 200);
    drawGlobe(ct.globe, ct.gr, 0.4);
    const roof = new Graphics().rect(0, base - 4 * u, w, h - base + 4 * u).fill(0x1a1430);
    const em = new Container();
    const rays = sunRays(new Graphics(), 0, 0, Math.max(w, h), 18, 0xfff3c0, 0.2, 0, 0.45);
    em.addChild(rays, emblem(m * 0.2));
    em.position.set(w / 2, h * 0.44);
    // a streak with its trail across the sky
    const fl = new Graphics();
    const sp = speck(Math.max(0.5, u * 1.8));
    k.addChild(sky, sun, em, ct.k, roof, fl, sp);
    const pose = (t: number) => {
      const x = ((t * 0.18) % 1.2 - 0.1) * w;
      const y = h * 0.22 + Math.sin(t * 1.4) * h * 0.06;
      sp.position.set(x, y);
      fl.clear();
      fl.poly(streak(x - 10 * u, y - 3 * u, x - Math.min(w * 0.3, m * 0.5), y + 20 * u, 7 * u * 1.5, 1)).fill({ color: RED, alpha: 0.8 });
      fl.poly(streak(x - 10 * u, y + 4 * u, x - Math.min(w * 0.3, m * 0.5), y + 28 * u, 6 * u * 1.5, 1)).fill({ color: 0x5aa6ec, alpha: 0.8 });
    };
    pose(2);
    if (live)
      liveLoop(k, (t) => {
        rays.rotation = t * 0.12;
        drawGlobe(ct.globe, ct.gr, t * 1.4);
        pose(2 + t);
      });
    return k;
  },
};
