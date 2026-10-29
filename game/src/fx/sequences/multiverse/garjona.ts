/**
 * Ricardo Garjona, el Trovador Chapín: the troubadour universe (a Guatemalan singer-storyteller: a cat with his guitar —
 * no song titles, no lyrics). Antigua at the blue hour: a cobbled street between colonial fronts (ochre, terracotta,
 * cream, blue, white, pink) with wooden balconies, iron window grilles, tiled eaves, bougainvillea and wall lanterns, and
 * at its end the yellow arch with its little clock lantern on top, the great cone of the volcano rising behind it. He
 * strums (¡TRRRAN!) and the words of his story come out one by one — «Había una vez…», «un gato…», «una caja…», «y
 * entonces…» — and each folds itself into a paper bird and flies off over the roofs: LA HISTORIA SIGUE…
 * Payoff: a whole flock of paper birds bursts out of the guitar and sweeps over the volcano, the lanterns blaze,
 * bougainvillea petals fall; ¡QUÉ HISTORIA! / …y eso que todavía no termina.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, cheer, every, fall, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, ngon, onCat, rnd, streak } from './kitD';
import { pulse } from './kitG';
import { strip } from './kitH';
import { at, comic, petalPts, pre, wrap } from './kitI';

const GREEN = 0x2e7d5b;
const GOLD = 0xe6c34a;
const ARCH = 0xe8b83a;
const ARCH_D = 0xb8862a;
const SKY = [0x141c44, 0x34397a, 0x6a4f8a, 0xb86c80, 0xf0985a];
const VOLC = 0x1c2246;
const VOLC_L = 0x2c3462;
const PAPER = 0xf6f0e0;
const PAPER_D = 0xd8ccb0;
const LIGHT = 0xffc86a;
const BOUG = 0xd8306a;
const HZ = 650;
/** the façades run from the screen's edge (outer) to the arch's piers (inner) */
const IN_L = 600;
const IN_R = 1320;

/** an origami paper crane at (x, y) facing `dir` (1 right, −1 left), wings at `flap` (−1..1), into g */
function crane(s: number, flap = 1, g = new Graphics(), x = 0, y = 0, dir = 1) {
  const M = (pts: number[]) => pts.map((v, i) => (i % 2 ? y + v * s : x + v * s * dir));
  const ln = { width: 1.5 * s, color: 0x8a7a5a, join: 'round' as const };
  const wy = -46 * flap;
  g.poly(M([-6, 0, 30, -8, 6, wy])).fill(PAPER_D).stroke(ln);
  g.poly(M([-40, 2, 0, -10, 40, 2, 0, 14])).fill(PAPER).stroke(ln);
  g.poly(M([-30, 0, -62, -30, -54, -30, -40, -4])).fill(PAPER).stroke(ln);
  g.poly(M([-62, -30, -72, -24, -56, -26])).fill(PAPER);
  g.poly(M([30, 0, 62, -26, 40, 4])).fill(PAPER).stroke(ln);
  g.poly(M([-6, 0, -28, -10, -2, wy * 1.1])).fill(PAPER).stroke(ln);
  return g;
}

/** the street of Antigua: sky, volcano, the far street seen through the arch, both rows of fronts, the cobbles */
function antigua(g: Graphics, w: number, h: number, k: number, cx: number, x0 = -200) {
  const L = x0;
  const R = w - x0;
  const inL = cx - (960 - IN_L) * k;
  const inR = cx + (IN_R - 960) * k;
  const hz = h * (HZ / 1080);
  vgrad(g, L, x0, R - L, hz - x0, SKY, 18);
  const r = rnd(41);
  for (let i = 0; i < 40; i++) g.rect(L + r() * (R - L), r() * hz * 0.45, 2.2 * k, 2.2 * k).fill({ color: 0xffffff, alpha: 0.35 + r() * 0.5 });
  // the volcano (a crater-topped cone; the lit flank on the left)
  // the volcano towers over the arch: a crater-topped cone with gently concave flanks, lit on the left by the sunset
  const vy = hz - 590 * k;
  const flank = (d: number) => {
    const p: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      p.push(cx + d * (60 + 760 * Math.pow(u, 1.35)) * k, vy + 600 * k * u);
    }
    return p;
  };
  const lf = flank(-1);
  const rf = flank(1);
  const rback: number[] = [];
  for (let i = rf.length - 2; i >= 0; i -= 2) rback.push(rf[i], rf[i + 1]);
  g.poly([...lf, ...rback]).fill(VOLC);
  g.poly([...flank(-1), cx - 330 * k, hz + 10 * k, cx - 20 * k, vy + 40 * k]).fill(VOLC_L);
  g.poly([cx - 60 * k, vy, cx + 60 * k, vy, cx + 40 * k, vy + 14 * k, cx - 40 * k, vy + 14 * k]).fill(0x2e3462);
  g.poly(ngon(cx + 150 * k, vy + 30 * k, 130 * k, 22 * k, 12)).fill({ color: 0xd8c8e8, alpha: 0.35 });
  g.poly(strip(lf, 3 * k)).fill({ color: 0xffb08a, alpha: 0.5 });
  // the far street inside the arch: little houses, a lantern
  g.rect(cx - 170 * k, hz - 120 * k, 340 * k, 120 * k).fill(0x6a4a5a);
  g.rect(cx - 170 * k, hz - 130 * k, 340 * k, 12 * k).fill(0x8a3a2a);
  g.rect(cx - 120 * k, hz - 90 * k, 30 * k, 40 * k).fill({ color: LIGHT, alpha: 0.7 }).rect(cx + 80 * k, hz - 90 * k, 30 * k, 40 * k).fill({ color: LIGHT, alpha: 0.5 });
  // the arch: a yellow wall with the opening cut out, the row of windows, the clock lantern on top
  const at = (x: number) => cx + (x - 960) * k;
  const ay = (y: number) => hz + (y - HZ) * k;
  const open: number[] = [at(830), ay(650), at(830), ay(540)];
  for (let i = 1; i < 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI;
    open.push(at(960 + Math.cos(a) * 130), ay(540 + Math.sin(a) * 130));
  }
  open.push(at(1090), ay(540), at(1090), ay(650));
  g.rect(inL, ay(340), inR - inL, ay(650) - ay(340)).fill(ARCH).poly(open).cut();
  g.poly(open).stroke({ width: 10 * k, color: 0xf6e2a0 });
  g.rect(inL - 14 * k, ay(330), inR - inL + 28 * k, 16 * k).fill(0xf6e2a0);
  g.rect(inL - 8 * k, ay(402), inR - inL + 16 * k, 8 * k).fill(ARCH_D);
  for (let i = 0; i < 5; i++) {
    const wx = at(760 + i * 100);
    g.rect(wx - 14 * k, ay(360), 28 * k, 34 * k).fill(0x3a2a20);
    g.poly(ngon(wx, ay(360), 14 * k, 11 * k, 10)).fill(0x3a2a20);
    g.rect(wx - 14 * k, ay(392), 28 * k, 6 * k).fill(0xf6e2a0);
  }
  g.rect(at(905), ay(262), 110 * k, 70 * k).fill(ARCH).stroke({ width: 3 * k, color: ARCH_D });
  g.poly([at(893), ay(264), at(960), ay(218), at(1027), ay(264)]).fill(0xb8583a);
  g.poly(ngon(at(960), ay(297), 23 * k, 23 * k, 16)).fill(0xf6f0dc).stroke({ width: 3 * k, color: 0x3a2a20 });
  g.poly(streak(at(960), ay(297), at(960), ay(281), 2 * k, 1.5 * k)).fill(0x3a2a20).poly(streak(at(960), ay(297), at(973), ay(301), 2 * k, 1.5 * k)).fill(0x3a2a20);
  for (const d of [-1, 1]) g.rect(at(960 + d * 200) - 44 * k, ay(430), 88 * k, 220 * k).fill({ color: ARCH_D, alpha: 0.35 });
  // the two rows of colonial fronts in perspective (u: outer edge 0 → arch 1; v: street 0 → eave 1)
  const topO = ay(150);
  const topI = ay(430);
  const botO = ay(980);
  const botI = ay(650);
  const P = (side: number, u: number, v: number): [number, number] => {
    const ex = side < 0 ? L : R;
    const ix = side < 0 ? inL : inR;
    const x = ex + (ix - ex) * u;
    const yb = botO + (botI - botO) * u;
    const yt = topO + (topI - topO) * u;
    return [x, yb + (yt - yb) * v];
  };
  const Q = (side: number, u0: number, u1: number, v0: number, v1: number) => [...P(side, u0, v0), ...P(side, u1, v0), ...P(side, u1, v1), ...P(side, u0, v1)];
  const houses: [number, number, number][] = [
    [-1, 0, 0xd89a4a],
    [-1, 0.42, 0xb8583a],
    [-1, 0.74, 0xece2c8],
    [1, 0, 0x3a6aa8],
    [1, 0.42, 0xece2c8],
    [1, 0.74, 0xd87a8a],
  ];
  houses.forEach(([side, u0, col], i) => {
    const u1 = u0 === 0 ? 0.42 : u0 === 0.42 ? 0.74 : 1;
    g.poly(Q(side, u0, u1, 0, 1)).fill(col);
    g.poly(Q(side, u0, u1, 0, 0.08)).fill({ color: 0x000000, alpha: 0.18 });
    // tiled eave
    g.poly([...P(side, u0, 1.0), ...P(side, u1, 1.0), ...P(side, u1, 1.08), ...P(side, u0, 1.08)]).fill(0x8a3a2a);
    for (let j = 0; j < 6; j++) {
      const uu = u0 + ((u1 - u0) * (j + 0.5)) / 6;
      g.poly([...P(side, uu - 0.008, 1.0), ...P(side, uu + 0.008, 1.0), ...P(side, uu + 0.008, 1.08), ...P(side, uu - 0.008, 1.08)]).fill(0x5a2418);
    }
    // a window with an iron grille, a door or a balcony
    const wu0 = u0 + (u1 - u0) * 0.2;
    const wu1 = u0 + (u1 - u0) * 0.55;
    g.poly(Q(side, wu0, wu1, 0.42, 0.8)).fill(i % 2 ? 0x2a1a14 : 0xffd27a).stroke({ width: 2 * k, color: 0x3a2a20 });
    for (let j = 1; j < 5; j++) {
      const uu = wu0 + ((wu1 - wu0) * j) / 5;
      g.poly([...P(side, uu - 0.003, 0.42), ...P(side, uu + 0.003, 0.42), ...P(side, uu + 0.003, 0.8), ...P(side, uu - 0.003, 0.8)]).fill(0x14100c);
    }
    g.poly(Q(side, wu0 - 0.01, wu1 + 0.01, 0.4, 0.44)).fill(0x5a3a24);
    const du0 = u0 + (u1 - u0) * 0.66;
    const du1 = u0 + (u1 - u0) * 0.9;
    g.poly(Q(side, du0, du1, 0, 0.5)).fill(0x5a3420).stroke({ width: 2 * k, color: 0x2a1a10 });
    if (i % 3 === 0) {
      g.poly(Q(side, wu0 - 0.03, wu1 + 0.03, 0.38, 0.46)).fill(0x6a4428);
      for (let j = 0; j <= 6; j++) {
        const uu = wu0 - 0.03 + ((wu1 - wu0 + 0.06) * j) / 6;
        g.poly([...P(side, uu - 0.003, 0.3), ...P(side, uu + 0.003, 0.3), ...P(side, uu + 0.003, 0.4), ...P(side, uu - 0.003, 0.4)]).fill(0x4a2e1a);
      }
      g.poly(Q(side, wu0 - 0.03, wu1 + 0.03, 0.3, 0.32)).fill(0x4a2e1a);
    }
  });
  // bougainvillea spilling over two walls
  for (const [side, u] of [
    [-1, 0.86],
    [1, 0.3],
  ] as [number, number][]) {
    const rr = rnd(side > 0 ? 3 : 7);
    for (let j = 0; j < 22; j++) {
      const [bx, by] = P(side, u + (rr() - 0.5) * 0.18, 0.86 + rr() * 0.18);
      g.poly(ngon(bx, by, (10 + rr() * 10) * k * (1 - u * 0.5), (8 + rr() * 8) * k * (1 - u * 0.5), 6, rr() * 3)).fill(rr() < 0.75 ? BOUG : 0x2e6a3a);
    }
  }
  // the cobbles
  g.poly([L, botO, inL, botI, inR, botI, R, botO, R, h - x0, L, h - x0]).fill(0x4a4048);
  for (let j = 0; j < 8; j++) {
    const v = j / 8;
    const y = botI + (h - x0 - botI) * v * v;
    const half = ((inR - inL) / 2) * (1 + v * 3.2);
    const sz = (6 + v * 30) * k;
    for (let x = cx - half - 600 * k * v; x < cx + half + 600 * k * v; x += sz * 3) g.poly(ngon(x + (j % 2) * sz, y, sz, sz * 0.42, 6)).fill({ color: 0x6a5e64, alpha: 0.7 });
  }
  return P;
}

/** a wall lantern on a bracket at (x, y), size s, lit 0..1 (glow on the wall) */
function lantern(g: Graphics, x: number, y: number, s: number, lit: number, dir: number) {
  if (lit > 0.02) for (let i = 5; i >= 1; i--) g.poly(ngon(x, y, 34 * i * s, 34 * i * s, 14)).fill({ color: LIGHT, alpha: 0.07 * lit });
  g.poly(streak(x - dir * 34 * s, y - 30 * s, x, y - 30 * s, 3 * s, 3 * s)).fill(0x14100c);
  g.poly([x - 14 * s, y - 26 * s, x + 14 * s, y - 26 * s, x + 18 * s, y + 18 * s, x - 18 * s, y + 18 * s]).fill({ color: lit > 0.02 ? 0xffe2a0 : 0x5a5040, alpha: 0.6 + 0.4 * lit }).stroke({ width: 3 * s, color: 0x14100c });
  g.poly([x - 20 * s, y - 26 * s, x + 20 * s, y - 26 * s, x, y - 44 * s]).fill(0x14100c);
}

interface St {
  lit: { v: number };
  birds: Container;
}
const S = stash<St>();

/** a paper bird flies off from (x, y) on `layer` toward (tx, ty), flapping; destroyed when it's gone */
function fly(c: SigCtx, layer: Container, x: number, y: number, tx: number, ty: number, s: number, dur: number, delay = 0) {
  const b = new Graphics();
  crane(s, 1, b);
  b.position.set(x, y);
  b.scale.x = tx < x ? -1 : 1;
  layer.addChild(b);
  if (c.reduce) {
    b.position.set(x + (tx - x) * 0.25, y + (ty - y) * 0.25);
    gsap.to(b, { alpha: 0, delay: 0.9, duration: 0.3, onComplete: () => destroyTree(b) });
    return b;
  }
  gsap.from(b, { alpha: 0, duration: 0.15, delay });
  gsap.to(b, { x: tx, y: ty, duration: dur, delay, ease: 'sine.in' });
  gsap.to(b.scale, { y: 0.35, duration: 0.12, yoyo: true, repeat: Math.round(dur / 0.12), delay, ease: 'sine.inOut' });
  gsap.to(b, { alpha: 0, delay: delay + dur * 0.8, duration: dur * 0.2, onComplete: () => destroyTree(b) });
  return b;
}

const WORDS: [string, number, number][] = [
  ['Había una vez…', 520, 430],
  ['un gato…', 1400, 360],
  ['una caja…', 560, 260],
  ['y entonces…', 1380, 210],
];

export const garjona: Signature = {
  dark: true,
  frame: GREEN,
  tag: 'UNIVERSO DEL TROVADOR',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    const P = antigua(g, W, H, 1, 960);
    const lamps = new Graphics();
    const lampAt: [number, number, number, number][] = [
      [...P(-1, 0.36, 0.62), 1.3, 1],
      [...P(-1, 0.86, 0.6), 0.8, 1],
      [...P(1, 0.36, 0.62), 1.3, -1],
      [...P(1, 0.86, 0.6), 0.8, -1],
    ];
    const birds = new Container();
    k.addChild(g, lamps, birds);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(0xffd9a0, 380, 0.42);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    const lit = { v: 0.8 };
    S.set(c, { lit, birds });
    const frame = (t: number) => {
      if (lamps.destroyed) return;
      lamps.clear();
      lampAt.forEach(([x, y, s, d], i) => lantern(lamps, x, y, s, lit.v * (0.85 + 0.15 * Math.sin(t * 9 + i * 2)), d));
    };
    frame(0);
    if (!c.reduce) every(c, 20, frame);
    if (c.short) return;
    const tran = pre(c, comic('¡TRRRAN!', GOLD, 100), 600, 600, -0.1);
    // the story's words, built now (invisible), shown one by one
    const words = WORDS.map(([s, x, y], i) => {
      const t = txt(s, { fontFamily: F.brush, fontSize: 54, fill: PAPER, stroke: { color: 0x2a1a10, width: 7, join: 'round' } });
      t.anchor.set(0.5);
      t.position.set(x, y);
      t.rotation = (i % 2 ? 0.05 : -0.06);
      t.alpha = 0.001;
      c.fg.addChild(t);
      return t;
    });
    const sigue = pre(c, plate('LA HISTORIA SIGUE…', GREEN, C.ink, 46), 960, 120, -0.04);
    const [gx, gy] = onCat(c, 0.32, 0.53);
    at(c, 0.08, () => {
      tran(0.55);
      pulse(c, c.behind, gx, gy, GOLD, 60, 6, 10, 0.7);
      [1, 1.26, 1.5, 2].forEach((p, i) => later(c, i * 0.04, () => sfx('gem', p * 0.8)));
    });
    words.forEach((t, i) =>
      at(c, 0.3 + i * 0.32, () => {
        if (t.destroyed) return;
        sfx('nib', 1 + i * 0.1);
        if (i % 2 === 0) [1, 1.26, 1.5].forEach((p, j) => later(c, j * 0.05, () => sfx('gem', p * (0.9 + i * 0.05))));
        t.alpha = 1;
        if (!c.reduce) gsap.from(t.scale, { x: 0.6, y: 0.6, duration: 0.18, ease: 'back.out(2.5)' });
        // it folds into a paper bird and flies off over the roofs
        later(c, 0.36, () => {
          if (t.destroyed) return;
          gsap.to(t, { alpha: 0, duration: 0.12, onComplete: () => destroyTree(t) });
          if (!c.reduce) gsap.to(t.scale, { x: 0.2, y: 0.2, duration: 0.12 });
          sfx('paper', 1.3);
          const tx = t.x < 960 ? -100 : W + 100;
          fly(c, c.fg, t.x, t.y, tx * 0.3 + t.x * 0.7, -120, 1.25, 1.1);
        });
      }),
    );
    at(c, 1.75, () => {
      sigue(0.4);
      sfx('sting', 1.05);
      lit.v = 1;
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 0.95);
    [1, 1.26, 1.5, 2, 2.52].forEach((p, i) => later(c, i * 0.05, () => sfx('gem', p * 0.8)));
    c.shaker.add(0.2);
    flashOf(c, 0xffe8c0, 0.35, 0.4);
    if (st) st.lit.v = 1.4;
    // a whole flock out of the guitar, sweeping over the roofs and the volcano
    const [gx, gy] = onCat(c, 0.32, 0.53);
    pulse(c, c.behind, gx, gy, GOLD, 60, 9, 12, 0.8);
    const n = c.reduce ? 4 : 16;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n - 0.5) * 2.6;
      const d = 900 + Math.random() * 300;
      later(c, i * 0.04, () => fly(c, c.fg, gx, gy, gx + Math.cos(a) * d, gy + Math.sin(a) * d * 0.8 - 200, 0.6 + Math.random() * 0.5, 1.3 + Math.random() * 0.5));
    }
    for (let i = 0; i < 4; i++) later(c, i * 0.1, () => sfx('paper', 1 + i * 0.15));
    fall(c, c.fg, (i) => new Graphics().poly(petalPts(22 + (i % 3) * 6)).fill(i % 4 ? BOUG : 0xb85ad8), { n: 22, over: 2, dur: 2.2, spread: W, spin: 3 });
    cheer(c, '¡QUÉ HISTORIA!', GOLD, 140, 2.3);
    aside(c, '…y eso que todavía no termina.', 0xffffff, { delay: 0.6, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.max(0.2, h / 1080);
    const cx = w / 2;
    const g = new Graphics();
    const P = antigua(g, w, h, u, cx, 0);
    const lamps = new Graphics();
    const flock = new Graphics();
    const drawAll = (t: number) => {
      lamps.clear();
      for (const [side, uu] of [
        [-1, 0.86],
        [1, 0.86],
        [-1, 0.5],
        [1, 0.5],
      ] as [number, number][]) {
        const [x, y] = P(side, uu, 0.6);
        lantern(lamps, x, y, (uu > 0.6 ? 0.8 : 1.2) * u, 0.85 + 0.15 * Math.sin(t * 9 + uu * 7), side > 0 ? -1 : 1);
      }
      flock.clear();
      for (let i = 0; i < 5; i++) {
        const q = (t * 0.08 + i / 5) % 1;
        crane((0.5 + (i % 3) * 0.15) * u + 0.1, Math.sin(t * 8 + i * 2), flock, -100 * u + q * (w + 200 * u), h * (0.12 + 0.08 * i) + Math.sin(q * 8 + i) * 20 * u, 1);
      }
    };
    k.addChild(g, lamps, flock);
    drawAll(0.4);
    if (live) liveLoop(k, (t) => drawAll(t + 0.4), 20);
    return k;
  },
};
