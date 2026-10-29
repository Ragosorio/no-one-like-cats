/**
 * Doctor Doomiau: the iron-throne universe (the iron-masked monarch villain in a green cloak who speaks of himself in
 * the third person). The great hall of a green-stone castle in a storm: two tall pointed windows full of rain, long
 * green banners with no emblem, braziers of green fire, a green carpet up to an iron throne of spikes right behind him,
 * and two rows of masked robot doubles in green cloaks forming a guard of honor. Lightning — ¡KRA-KOOM! — and the
 * doubles' eyes light up one by one; they all say his name («¡DOOMIAU!»); a ring of green runes turns on the floor
 * around him; he speaks of himself («Doomiau ha llegado.»); the next bolt flashes off his mask.
 * Payoff: green magic bursts from his gauntlet, the runes fly, the doubles bow, the banners billow;
 * ¡DOOMIAU HA HABLADO! (…y Doomiau aplaude a Doomiau.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, bolt, burst, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { balloon, bandPts, ngon, onCat, say, streak, twinkle } from './kitD';
import { type Prepped, TAU, lazy, prepTitle, prepWord, pulse, sparks } from './kitG';

const STONE = 0x34443a;
const STONE_D = 0x222e27;
const MORTAR = 0x18211b;
const GREEN = 0x2e5e3a;
const GREEN_D = 0x1a3a22;
const GLOW = 0x7cff6b;
const IRON = 0x2a2e33;
const IRON_L = 0x4a5058;
const GOLD = 0xc9a64a;
const STORM = [0x0e1420, 0x1c2a3a, 0x2a3a48];

/** a pointed (gothic) arch window's outline: (x, y) = bottom center, w×h */
function archPts(x: number, y: number, w: number, h: number): number[] {
  const p: number[] = [x - w / 2, y, x - w / 2, y - h * 0.62];
  const n = 8;
  for (let i = 1; i <= n; i++) {
    const q = i / n;
    p.push(x - w / 2 + (w / 2) * Math.sin((q * Math.PI) / 2), y - h * 0.62 - h * 0.38 * Math.pow(q, 0.8));
  }
  for (let i = n - 1; i >= 0; i--) {
    const q = i / n;
    p.push(x + w / 2 - (w / 2) * Math.sin((q * Math.PI) / 2), y - h * 0.62 - h * 0.38 * Math.pow(q, 0.8));
  }
  p.push(x + w / 2, y - h * 0.62, x + w / 2, y);
  return p;
}

/** the hall: stone wall with blocks, the windows (glass in its own Graphics: it flashes), the floor, the carpet */
function hall(w: number, h: number, floorY: number, u: number, wins: [number, number, number, number][]) {
  const k = new Container();
  const wall = new Graphics().rect(0, 0, w, floorY).fill(STONE);
  const blocks = new Graphics();
  for (let y = 0, row = 0; y < floorY; y += 54 * u, row++) {
    blocks.rect(0, y, w, 4 * u);
    for (let x = row % 2 ? 50 * u : 0; x < w; x += 100 * u) blocks.rect(x, y, 4 * u, 54 * u);
  }
  blocks.fill(MORTAR);
  const glass = new Graphics();
  const frames = new Graphics();
  for (const [x, y, ww, hh] of wins) {
    frames.poly(archPts(x, y + 14 * u, ww + 40 * u, hh + 34 * u)).fill(STONE_D);
    glass.poly(archPts(x, y, ww, hh));
  }
  glass.fill(0xffffff);
  const storm = new Graphics();
  const mullions = new Graphics();
  for (const [x, y, ww, hh] of wins) {
    mullions.poly(streak(x, y, x, y - hh * 0.96, 5 * u, 5 * u)).fill(STONE_D);
    for (const k2 of [0.3, 0.6]) mullions.rect(x - ww / 2, y - hh * k2, ww, 6 * u).fill(STONE_D);
  }
  const fl = new Graphics();
  vgrad(fl, 0, floorY, w, h - floorY, [0x2a3530, 0x141a16], 8);
  for (let j = 1; j < 6; j++) fl.rect(0, floorY + (h - floorY) * Math.pow(j / 6, 1.6), w, 2 * u).fill({ color: 0x0a0e0b, alpha: 0.6 });
  for (let i = -8; i <= 8; i++) fl.poly(streak(w / 2 + i * 90 * u, floorY, w / 2 + i * 300 * u, h, 1 * u, 3 * u)).fill({ color: 0x0a0e0b, alpha: 0.5 });
  // the carpet up to the throne
  fl.poly([w / 2 - 150 * u, floorY, w / 2 + 150 * u, floorY, w / 2 + 420 * u, h, w / 2 - 420 * u, h]).fill(GREEN);
  fl.poly(streak(w / 2 - 150 * u, floorY, w / 2 - 420 * u, h, 4 * u, 10 * u)).fill(GOLD).poly(streak(w / 2 + 150 * u, floorY, w / 2 + 420 * u, h, 4 * u, 10 * u)).fill(GOLD);
  k.addChild(wall, blocks, frames, glass, storm, mullions, fl);
  return { k, glass, storm };
}

/** the storm seen through the windows at time t: dark sky color on the glass, rain streaks, an optional bolt */
function drawStorm(glass: Graphics, storm: Graphics, wins: [number, number, number, number][], t: number, flash: number, u: number, seed: number) {
  const base = flash > 0.05 ? 0xcfe8ff : STORM[1];
  glass.tint = base;
  storm.clear();
  const r = rng(seed);
  for (const [x, y, ww, hh] of wins) {
    for (let i = 0; i < 16; i++) {
      const rx = x - ww / 2 + ((r() * ww + t * 60 * u) % ww);
      const ry = y - hh * 0.9 + ((r() * hh * 0.9 + t * 900 * u) % (hh * 0.9));
      storm.poly(streak(rx, ry, rx - 6 * u, ry + 30 * u, 0.6 * u, 1.4 * u)).fill({ color: 0x9fb8d0, alpha: 0.55 });
    }
  }
}

/** a long banner with a gold border and a swallowtail (origin at its top center) */
function banner(s = 1) {
  const g = new Graphics();
  const w = 70 * s;
  const h = 420 * s;
  g.rect(-w - 12 * s, -8 * s, (w + 12 * s) * 2, 12 * s).fill(IRON_L);
  g.poly([-w, 0, w, 0, w, h, 0, h - 60 * s, -w, h]).fill(GREEN).stroke({ width: 4 * s, color: GOLD, join: 'round' });
  g.poly([-w + 14 * s, 14 * s, w - 14 * s, 14 * s, w - 14 * s, h - 30 * s, 0, h - 82 * s, -w + 14 * s, h - 30 * s]).stroke({ width: 2 * s, color: GOLD, join: 'round' });
  g.poly([-w, 0, -w * 0.4, 0, -w * 0.5, h - 30 * s, -w, h]).fill({ color: GREEN_D, alpha: 0.6 });
  return g;
}

/** the iron throne (origin at the seat's front center, behind him): a tall spiked back, arms, rivets, green gems */
function throne(s = 1) {
  const g = new Graphics();
  const back: number[] = [-230 * s, 0, -230 * s, -420 * s];
  const spikes = 7;
  for (let i = 0; i <= spikes * 2; i++) {
    const x = -230 * s + (i / (spikes * 2)) * 460 * s;
    const mid = 1 - Math.abs(i / (spikes * 2) - 0.5) * 2;
    back.push(x, i % 2 ? -470 * s - mid * 120 * s : -560 * s - mid * 220 * s);
  }
  back.push(230 * s, -420 * s, 230 * s, 0);
  g.poly(back).fill(IRON).stroke({ width: 6 * s, color: 0x111316, join: 'round' });
  g.poly([-170 * s, -40 * s, -170 * s, -420 * s, 0, -540 * s, 170 * s, -420 * s, 170 * s, -40 * s]).fill(0x22262b);
  for (let i = 0; i < 9; i++) {
    const y = -60 * s - i * 42 * s;
    g.poly(ngon(-200 * s, y, 6 * s, 6 * s, 6)).fill(IRON_L).poly(ngon(200 * s, y, 6 * s, 6 * s, 6)).fill(IRON_L);
  }
  g.poly(ngon(0, -600 * s, 26 * s, 34 * s, 6)).fill(GLOW).stroke({ width: 4 * s, color: 0x111316 });
  // the arms
  for (const sd of [-1, 1]) {
    g.poly([sd * 230 * s, -10 * s, sd * 330 * s, -10 * s, sd * 340 * s, -160 * s, sd * 230 * s, -190 * s]).fill(IRON).stroke({ width: 5 * s, color: 0x111316, join: 'round' });
    g.poly(ngon(sd * 335 * s, -175 * s, 22 * s, 22 * s, 8)).fill(IRON_L).stroke({ width: 3 * s, color: 0x111316 });
    g.poly(ngon(sd * 335 * s, -175 * s, 9 * s, 9 * s, 6)).fill(GLOW);
  }
  return g;
}

/** a robot double (origin at its feet): green hooded cloak, grey metal mask with eye slits; eyes are their own node */
function double(s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.poly([-70 * s, 0, -54 * s, -200 * s, -30 * s, -250 * s, 30 * s, -250 * s, 54 * s, -200 * s, 70 * s, 0]).fill(GREEN_D).stroke({ width: 3 * s, color: 0x0a1a0e, join: 'round' });
  g.poly([-40 * s, -10 * s, -30 * s, -190 * s, 30 * s, -190 * s, 40 * s, -10 * s]).fill(0x3a4048);
  g.rect(-34 * s, -120 * s, 68 * s, 14 * s).fill(0x5a4a2a);
  for (const sd of [-1, 1]) g.poly(ngon(sd * 44 * s, -196 * s, 22 * s, 14 * s, 10)).fill(IRON_L).stroke({ width: 2 * s, color: 0x111316 });
  // the hood and the mask
  g.poly([-46 * s, -230 * s, -40 * s, -300 * s, 0, -326 * s, 40 * s, -300 * s, 46 * s, -230 * s, 30 * s, -218 * s, -30 * s, -218 * s]).fill(GREEN).stroke({ width: 3 * s, color: 0x0a1a0e, join: 'round' });
  g.poly([-26 * s, -296 * s, 26 * s, -296 * s, 24 * s, -240 * s, 0, -228 * s, -24 * s, -240 * s]).fill(0x8a9098).stroke({ width: 2 * s, color: 0x111316 });
  for (const y of [-258, -246]) g.rect(-14 * s, y * s, 28 * s, 2 * s).fill(0x111316);
  const eyes = new Graphics().rect(-18 * s, -278 * s, 12 * s, 5 * s).rect(6 * s, -278 * s, 12 * s, 5 * s).fill(GLOW);
  eyes.alpha = 0.15;
  k.addChild(g, eyes);
  return { k, eyes };
}

/** a brazier on a pillar with green flames (flames redrawn with t) */
function drawFlame(g: Graphics, t: number, s: number, seed: number) {
  g.clear();
  for (let i = 0; i < 5; i++) {
    const ph = t * 7 + i * 1.3 + seed;
    const hh = (60 + Math.sin(ph) * 16 + i * 6) * s;
    const x = (i - 2) * 12 * s;
    g.poly([x - 16 * s, 0, x + Math.sin(ph * 1.3) * 8 * s, -hh, x + 16 * s, 0]).fill({ color: i % 2 ? GLOW : 0x2fd04a, alpha: 0.8 });
  }
  g.poly(ngon(0, -10 * s, 70 * s, 40 * s, 14)).fill({ color: GLOW, alpha: 0.08 });
}
function brazier(s = 1) {
  const g = new Graphics();
  g.rect(-30 * s, 0, 60 * s, 240 * s).fill(STONE_D);
  g.poly([-50 * s, 0, 50 * s, 0, 36 * s, 30 * s, -36 * s, 30 * s]).fill(IRON).stroke({ width: 3 * s, color: 0x111316 });
  return g;
}

/** a rune: one of a few invented glyphs (triangle, crossed bars, diamond, fork), centered (one Graphics adds it) */
function rune(g: Graphics, x: number, y: number, s: number, kind: number, rot: number, color: number, alpha = 1) {
  const P = (dx: number, dy: number) => [x + dx * Math.cos(rot) - dy * Math.sin(rot), y + dx * Math.sin(rot) + dy * Math.cos(rot)];
  const bar = (ax: number, ay: number, bx: number, by: number) => g.poly(streak(...(P(ax, ay) as [number, number]), ...(P(bx, by) as [number, number]), s * 0.12, s * 0.12)).fill({ color, alpha });
  const k = kind % 4;
  if (k === 0) {
    bar(-s * 0.5, s * 0.4, 0, -s * 0.5);
    bar(0, -s * 0.5, s * 0.5, s * 0.4);
    bar(-s * 0.5, s * 0.4, s * 0.5, s * 0.4);
  } else if (k === 1) {
    bar(0, -s * 0.5, 0, s * 0.5);
    bar(-s * 0.4, -s * 0.2, s * 0.4, s * 0.1);
    bar(-s * 0.4, s * 0.2, s * 0.4, -s * 0.1);
  } else if (k === 2) {
    bar(0, -s * 0.5, s * 0.4, 0);
    bar(s * 0.4, 0, 0, s * 0.5);
    bar(0, s * 0.5, -s * 0.4, 0);
    bar(-s * 0.4, 0, 0, -s * 0.5);
  } else {
    bar(0, s * 0.5, 0, -s * 0.1);
    bar(0, -s * 0.1, -s * 0.35, -s * 0.5);
    bar(0, -s * 0.1, s * 0.35, -s * 0.5);
  }
}

/** the rune ring on the floor around his paws at angle a (a flattened band + glyphs) */
function drawRing(g: Graphics, x: number, y: number, R: number, a: number, on: number) {
  g.clear();
  if (on <= 0.01) return;
  g.poly(bandPts(x, y, R * 0.92, R, 0, TAU, 40).map((v, i) => (i % 2 ? y + (v - y) * 0.28 : v))).fill({ color: GLOW, alpha: 0.7 * on });
  g.poly(bandPts(x, y, R * 0.7, R * 0.74, 0, TAU, 36).map((v, i) => (i % 2 ? y + (v - y) * 0.28 : v))).fill({ color: GLOW, alpha: 0.5 * on });
  for (let i = 0; i < 12; i++) {
    const q = a + (i / 12) * TAU;
    rune(g, x + Math.cos(q) * R * 0.83, y + Math.sin(q) * R * 0.83 * 0.28, 26, i, 0, GLOW, on * (0.5 + 0.5 * Math.max(0, Math.sin(q))));
  }
}

interface St {
  title: () => Prepped;
  doubles: Container[];
  banners: Graphics[];
  ringOn: { v: number };
  spin: { v: number };
}
const S = stash<St>();
const FLOOR = 760;
const WINS: [number, number, number, number][] = [
  [560, 620, 230, 470],
  [1360, 620, 230, 470],
];
/** measured on the integrated painting: the mask (for the glint) and the gauntlet with the spark */
const MASK: [number, number] = [0.47, 0.24];
const HAND: [number, number] = [0.16, 0.3];

export const doomiau: Signature = {
  dark: true,
  frame: GREEN,
  tag: 'UNIVERSO DEL TRONO DE HIERRO',
  open(c: SigCtx) {
    const k = new Container();
    const hl = hall(W, H, FLOOR, 1, WINS);
    const banners: Graphics[] = [];
    for (const x of [200, 860, 1060, 1720]) {
      const b = banner(1);
      b.position.set(x, 40);
      banners.push(b);
    }
    const th = throne(1.05);
    th.position.set(W / 2, c.catY + 200);
    const flames: Graphics[] = [];
    const braz = new Container();
    for (const x of [90, W - 90]) {
      const b = brazier(1);
      b.position.set(x, FLOOR - 40);
      const f = new Graphics();
      f.position.set(x, FLOOR - 40);
      braz.addChild(b, f);
      flames.push(f);
    }
    // two rows of doubles in perspective (near ones bigger, lower)
    const doubles: Container[] = [];
    const eyes: Graphics[] = [];
    const rows = new Container();
    const spots: [number, number, number][] = [
      [W / 2 - 360, FLOOR + 30, 0.85],
      [W / 2 + 360, FLOOR + 30, 0.85],
      [W / 2 - 530, FLOOR + 140, 1.1],
      [W / 2 + 530, FLOOR + 140, 1.1],
      [W / 2 - 740, FLOOR + 300, 1.4],
      [W / 2 + 740, FLOOR + 300, 1.4],
    ];
    for (const [x, y, s] of spots) {
      const d = double(s);
      d.k.position.set(x, y);
      rows.addChild(d.k);
      doubles.push(d.k);
      eyes.push(d.eyes);
    }
    k.addChild(hl.k, ...banners, braz, th, rows);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // a dim green light behind his silhouette (it must read against the iron)
    const back = new Graphics();
    for (let i = 7; i >= 1; i--) back.poly(ngon(0, 0, 50 * i, 50 * i, 24)).fill({ color: GLOW, alpha: 0.035 });
    back.position.set(W / 2, c.catY - 40);
    c.behind.addChild(back);
    const ring = new Graphics();
    c.behind.addChild(ring);
    const ringOn = { v: c.short ? 1 : 0 };
    const spin = { v: 0.6 };
    const flash = { v: 0 };
    const title = lazy(c, 1.0, () => prepTitle(c, '¡DOOMIAU\nHA HABLADO!', { fontFamily: F.serif, fontWeight: '900', fontSize: 112, lineHeight: 112, fill: 0xd8ffc8, stroke: { color: 0x061208, width: 14, join: 'round' }, dropShadow: { color: 0x061208, distance: 8, angle: Math.PI / 3, blur: 0, alpha: 1 } }, { aside: '…y Doomiau aplaude a Doomiau.', asideStyle: { fill: 0xd8ffc8, stroke: { color: 0x061208, width: 8, join: 'round' } }, glow: GLOW, maxW: 720, at: [430, 650] }));
    S.set(c, { title, doubles, banners, ringOn, spin });
    const [fx, fy] = onCat(c, 0.5, 0.97);
    let ang = 0;
    let last = 0;
    const frame = (t: number) => {
      if (ring.destroyed) return;
      const dt = Math.min(0.1, t - last);
      last = t;
      ang += dt * spin.v;
      drawStorm(hl.glass, hl.storm, WINS, t, flash.v, 1, 9);
      flames.forEach((f, i) => drawFlame(f, t, 1, i * 3));
      drawRing(ring, fx, fy, 330, ang, ringOn.v);
      banners.forEach((b, i) => (b.skew.x = Math.sin(t * 1.2 + i) * 0.02 * (1 + spin.v)));
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) {
      eyes.forEach((e) => (e.alpha = 1));
      return;
    }
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    score(c, [
      [0.0, 'sting', 0.5],
      [0.1, 'purr', 0.25],
    ]);
    // lightning through the windows: ¡KRA-KOOM!
    const strike = (wi: number) => {
      const [x, y, ww, hh] = WINS[wi];
      flash.v = 1;
      if (c.reduce) frame(0);
      const b = bolt(new Graphics(), x - ww * 0.3 + Math.random() * ww * 0.2, y - hh * 0.95, x + (Math.random() - 0.5) * ww * 0.5, y - hh * 0.05, 0xeaffff, 6, 7, 50);
      k.addChildAt(b, k.getChildIndex(hl.k) + 1);
      sfx('zap', 0.4);
      later(c, 0.08, () => sfx('boom', 0.5));
      c.shaker.add(0.18);
      if (c.flashes) flashOf(c, 0xcfe8ff, 0.25, 0.25);
      gsap.to(b, { alpha: 0, duration: 0.3, delay: 0.08, onComplete: () => destroyTree(b) });
      later(c, 0.15, () => (flash.v = 0));
    };
    const kra = lazy(c, 0.02, () => prepWord(c, c.fg, 560, 220, '¡KRA-KOOM!', 0xc8ffb0, 92, -0.08));
    beat(c, 0.15, () => {
      strike(0);
      kra().show(0.55);
    });
    // the doubles' eyes light up one by one, then they say his name
    eyes.forEach((e, i) =>
      beat(c, 0.4 + i * 0.07, () => {
        if (e.destroyed) return;
        e.alpha = 1;
        sfx('tick', 1.2 + i * 0.1);
      }),
    );
    const chorus: [number, number][] = [
      [W / 2 - 740, FLOOR - 220],
      [W / 2 + 740, FLOOR - 210],
      [W / 2 - 530, FLOOR - 270],
      [W / 2 + 530, FLOOR - 280],
    ];
    chorus.forEach(([x, y], i) =>
      beat(c, 0.75 + i * 0.1, () => {
        say(c, c.fg, balloon('¡DOOMIAU!', { size: 38, jag: i % 2 === 1, tx: 0, ty: 80 }), x, y, 0.75 - i * 0.05, (i % 2 ? 1 : -1) * 0.05);
        sfx('click', 0.7 + i * 0.1);
      }),
    );
    // the runes wake up around him
    beat(c, 1.1, () => {
      const [hx, hy] = onCat(c, HAND[0], HAND[1]);
      sparks(c, c.fg, hx, hy, 12, GLOW, 160, 0.5, -Math.PI / 2, 2.4);
      sfx('charge', 0.7);
      if (c.reduce) ringOn.v = 1;
      else gsap.to(ringOn, { v: 1, duration: 0.3 });
      spin.v = 1.6;
    });
    // he speaks of himself
    beat(c, 1.35, () => {
      const [bx, by] = onCat(c, 0.92, 0.1);
      say(c, c.fg, balloon('Doomiau ha llegado.', { size: 40, font: F.serif, tx: -140, ty: 80 }), bx + 80, by - 20, 0.75, -0.03);
    });
    // the second bolt, and its flash off his mask
    beat(c, 1.8, () => {
      strike(1);
      const [mx, my] = onCat(c, MASK[0], MASK[1]);
      const g = new Graphics().poly(twinkle(0, 0, 52)).fill(0xffffff);
      g.position.set(mx + 30, my - 10);
      c.fg.addChild(g);
      if (!c.reduce) gsap.fromTo(g.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.12, yoyo: true, repeat: 1 });
      gsap.to(g, { alpha: 0, delay: 0.25, duration: 0.1, onComplete: () => destroyTree(g) });
      sfx('gem', 1.6);
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('zap', 0.5);
    sfx('bigboom', 0.7);
    later(c, 0.2, () => sfx('fanfare', 0.8));
    c.shaker.add(0.4);
    flashOf(c, 0xc8ffb0, 0.45, 0.35);
    const [hx, hy] = onCat(c, HAND[0], HAND[1]);
    pulse(c, c.fg, hx, hy, GLOW, 50, 9, 14, 0.7);
    pulse(c, c.fg, hx, hy, 0xffffff, 40, 6, 8, 0.5);
    if (st) {
      st.title().show(2.8, true);
      st.ringOn.v = 1;
      st.spin.v = 4;
      gsap.to(st.spin, { v: 0.8, delay: 0.5, duration: 1.5 });
      // the doubles bow toward him
      st.doubles.forEach((d, i) => {
        if (d.destroyed) return;
        const dir = d.x < W / 2 ? 1 : -1;
        if (c.reduce) d.rotation = dir * 0.2;
        else gsap.to(d, { rotation: dir * 0.22, duration: 0.3, delay: 0.1 + (i >> 1) * 0.08, ease: 'back.out(2)' });
      });
    }
    // runes fly out of the ring
    burst(
      c,
      c.fg,
      (i) => {
        const g = new Graphics();
        rune(g, 0, 0, 40, i, 0, i % 3 ? GLOW : 0xffffff);
        return g;
      },
      18,
      W / 2,
      c.catY + 120,
      900,
      1.4,
    );
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const fy = h * 0.72;
    const n = Math.max(2, Math.round(w / (m * 0.8)));
    const wins: [number, number, number, number][] = [];
    for (let i = 0; i < n; i++) wins.push([((i + 0.5) / n) * w + (i % 2 ? 1 : -1) * m * 0.32, fy - 40 * u, 210 * u * 1.3, 430 * u * 1.3]);
    const hl = hall(w, h, fy, u * 1.3, wins);
    const th = throne(u * 1.2);
    th.position.set(w / 2, h * 0.92);
    const banners: Graphics[] = [];
    const nb = Math.max(2, Math.round(w / (m * 0.45)));
    for (let i = 0; i < nb; i++) {
      const b = banner(u * 1.25);
      b.position.set(((i + 0.5) / nb) * w, 10 * u);
      banners.push(b);
    }
    const ds: Graphics[] = [];
    const rowK = new Container();
    const nd = Math.max(2, Math.round(w / (m * 0.42)));
    for (let i = 0; i < nd; i++) {
      const x = ((i + 0.5) / nd) * w;
      if (Math.abs(x - w / 2) < m * 0.32) continue;
      const d = double(u * 1.15);
      d.k.position.set(x, h * 0.98);
      d.eyes.alpha = 1;
      rowK.addChild(d.k);
      ds.push(d.eyes);
    }
    k.addChild(hl.k, ...banners, th, rowK);
    drawStorm(hl.glass, hl.storm, wins, 0, 0, u * 1.3, 4);
    if (live)
      liveLoop(k, (t) => {
        const fl = (t % 4.3) < 0.12 ? 1 : 0;
        drawStorm(hl.glass, hl.storm, wins, t, fl, u * 1.3, 4);
        ds.forEach((e, i) => (e.alpha = 0.6 + 0.4 * Math.sin(t * 3 + i)));
      });
    return k;
  },
};

