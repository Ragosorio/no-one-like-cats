/**
 * Pinomichi: the woodshop universe (Collodi, public domain). The carpenter's workshop as an old storybook plate —
 * plank walls inked in brown, a sunbeam full of sawdust, a pegboard of tools over the bench, the fireplace that is only
 * PAINTED on the wall (pot and all), puppets hanging from the beam — and he hangs from a marionette's strings. Shavings
 * fly, the strings are cut one by one (¡TAC!), the cross flies off and he stands on his own. Then his wooden nose grows
 * right across the screen.
 * Payoff: «¡NO ES MENTIRA!» — and it grows again, sprouting leaves, until a woodpecker lands on the tip and pecks it
 * back (toc, toc, toc), as in the book.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, later, score } from './kit';
import { cardLoop, hideDisc } from './kitA';
import { borrowCat, rng, stash } from './kitB';
import { arcPts, beat, ell, floatWord, glowDisc, headline, paid, pay, smooth } from './kitC';

const PLANK = [0xd2a46c, 0xc6965e, 0xd9ae78, 0xcb9c64];
const SEAM = 0x7a5430;
const INK = 0x4a2e16;
const WOOD = 0xdba468;
const CREAM = 0xf6ead2;
const RED = 0xd62839;
/** his painted nose: tip and the direction it grows (measured on his painting, relative to the cat's center) */
const NOSE_TIP: [number, number] = [-168, -148];
const NOSE_A = Math.atan2(-60, -118);

/** plank wall with grain, the plank floor (spans w; scaled by u) */
function room(w: number, h: number, u: number, floorY: number) {
  const g = new Graphics();
  const pw = 86 * u;
  const r = rng(2);
  for (let x = 0, i = 0; x < w; x += pw, i++) {
    g.rect(x, 0, pw, floorY).fill(PLANK[i % PLANK.length]);
    for (let j = 0; j < 3; j++) {
      const gx = x + (0.2 + r() * 0.6) * pw;
      g.poly(smooth([gx, 0, gx + (r() - 0.5) * 14 * u, floorY * 0.35, gx + (r() - 0.5) * 14 * u, floorY * 0.7, gx, floorY], 4, false), false);
    }
    g.stroke({ width: 1.5 * u, color: SEAM, alpha: 0.35 });
    g.rect(x, 0, 3 * u, floorY).fill(SEAM);
    if (r() < 0.5) g.poly(ell(x + pw * 0.5, floorY * (0.2 + r() * 0.6), 5 * u, 9 * u, 10)).stroke({ width: 1.5 * u, color: SEAM, alpha: 0.5 });
  }
  // a beam across the top
  g.rect(0, 0, w, 40 * u).fill(0x8a5a2e).rect(0, 40 * u, w, 6 * u).fill(SEAM);
  // the floor
  g.rect(0, floorY, w, h - floorY).fill(0xb07a44);
  for (let y = floorY; y < h; y += 34 * u) g.rect(0, y, w, 2.5 * u).fill(SEAM);
  g.rect(0, floorY, w, 8 * u).fill(0x6a4424);
  return g;
}

/** the fireplace, only painted on the wall: flat, a painted pot over painted flames, inside a painted frame */
function paintedHearth(g: Graphics, x: number, y: number, s: number) {
  g.rect(x - 150 * s, y - 330 * s, 300 * s, 330 * s).fill({ color: 0xfff4dc, alpha: 0.55 }).stroke({ width: 4 * s, color: INK, alpha: 0.6 });
  g.poly([x - 120 * s, y, x - 120 * s, y - 200 * s, ...arcPts(x, y - 200 * s, 120 * s, 70 * s, Math.PI, Math.PI * 2, 12), x + 120 * s, y]).fill(0x9a8a7a).stroke({ width: 3 * s, color: INK });
  g.poly([x - 86 * s, y, x - 86 * s, y - 170 * s, ...arcPts(x, y - 170 * s, 86 * s, 50 * s, Math.PI, Math.PI * 2, 10), x + 86 * s, y]).fill(0x3a2a20);
  // painted flames (flat, a child's brush) and a painted pot with painted steam
  g.poly([x - 60 * s, y, x - 40 * s, y - 70 * s, x - 20 * s, y - 30 * s, x, y - 96 * s, x + 20 * s, y - 34 * s, x + 44 * s, y - 80 * s, x + 60 * s, y]).fill(0xf08a2a).stroke({ width: 2 * s, color: INK });
  g.poly([x - 30 * s, y, x - 14 * s, y - 40 * s, x, y - 20 * s, x + 14 * s, y - 50 * s, x + 30 * s, y]).fill(0xffd24a);
  g.poly([x - 46 * s, y - 104 * s, x + 46 * s, y - 104 * s, x + 38 * s, y - 60 * s, x - 38 * s, y - 60 * s]).fill(0x4a4a52).stroke({ width: 2 * s, color: INK });
  g.poly(smooth([x - 10 * s, y - 112 * s, x - 22 * s, y - 140 * s, x - 4 * s, y - 160 * s, x - 16 * s, y - 190 * s], 4, false), false).stroke({ width: 4 * s, color: 0xffffff, alpha: 0.8 });
  g.poly(smooth([x + 14 * s, y - 112 * s, x + 2 * s, y - 140 * s, x + 20 * s, y - 160 * s, x + 8 * s, y - 190 * s], 4, false), false).stroke({ width: 4 * s, color: 0xffffff, alpha: 0.8 });
}

/** the bench and the pegboard of tools over it (origin at the bench top's left end) */
function bench(g: Graphics, x: number, y: number, s: number) {
  g.rect(x, y - 360 * s, 560 * s, 300 * s).fill(0xa9794a).stroke({ width: 3 * s, color: INK });
  for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) g.poly(ell(x + (36 + i * 70) * s, y - (330 - j * 60) * s, 4 * s, 4 * s, 6)).fill(0x5a3a1c);
  // a saw, a mallet, three chisels, a plane, a square
  g.poly([x + 40 * s, y - 320 * s, x + 220 * s, y - 300 * s, x + 220 * s, y - 250 * s, x + 40 * s, y - 280 * s]).fill(0xc8ccd2).stroke({ width: 2 * s, color: INK });
  for (let i = 0; i < 12; i++) g.poly([x + (44 + i * 15) * s, y - (281 - i * 2.3) * s, x + (51 + i * 15) * s, y - (272 - i * 2.3) * s, x + (58 + i * 15) * s, y - (279 - i * 2.3) * s]).fill(0xc8ccd2);
  g.roundRect(x + 220 * s, y - 318 * s, 56 * s, 70 * s, 14 * s).fill(0x8a4a22).stroke({ width: 2 * s, color: INK });
  g.rect(x + 310 * s, y - 330 * s, 20 * s, 140 * s).fill(0x8a5a2e).roundRect(x + 290 * s, y - 340 * s, 60 * s, 34 * s, 6 * s).fill(0x6a4424).stroke({ width: 2 * s, color: INK });
  for (let i = 0; i < 3; i++) g.rect(x + (380 + i * 30) * s, y - 330 * s, 10 * s, 80 * s).fill(0x8a5a2e).rect(x + (381 + i * 30) * s, y - 250 * s, 8 * s, 50 * s).fill(0xc8ccd2);
  g.poly([x + 470 * s, y - 330 * s, x + 540 * s, y - 330 * s, x + 540 * s, y - 200 * s, x + 520 * s, y - 200 * s, x + 520 * s, y - 310 * s, x + 470 * s, y - 310 * s]).fill(0xc8ccd2).stroke({ width: 2 * s, color: INK });
  // the bench
  g.rect(x - 20 * s, y, 600 * s, 34 * s).fill(0x8a5a2e).stroke({ width: 3 * s, color: INK });
  for (const lx of [10, 520]) g.rect(x + lx * s, y + 34 * s, 36 * s, 220 * s).fill(0x6a4424).stroke({ width: 3 * s, color: INK });
  g.rect(x + 30 * s, y + 180 * s, 500 * s, 18 * s).fill(0x6a4424);
  g.roundRect(x + 380 * s, y - 40 * s, 120 * s, 40 * s, 8 * s).fill(0x8a4a22).stroke({ width: 2 * s, color: INK }).rect(x + 420 * s, y - 62 * s, 22 * s, 24 * s).fill(0x6a4424);
}

/** a hanging puppet (origin at its hook on the beam): strings, a little wooden body */
function puppet(s: number, coat: number) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-50 * s, 0, 100 * s, 8 * s).fill(0x8a5a2e).rect(-4 * s, -6 * s, 8 * s, 18 * s).fill(0x8a5a2e);
  for (const [x0, x1, y1] of [
    [-50, -26, 190],
    [50, 26, 190],
    [0, 0, 120],
  ])
    g.moveTo(x0 * s, 6 * s).lineTo(x1 * s, y1 * s).stroke({ width: 1.5 * s, color: CREAM });
  g.poly(ell(0, 140 * s, 22 * s, 24 * s, 14)).fill(WOOD).stroke({ width: 2 * s, color: INK });
  g.poly([-14 * s, 120 * s, 14 * s, 120 * s, 0, 96 * s]).fill(coat);
  g.roundRect(-24 * s, 166 * s, 48 * s, 70 * s, 8 * s).fill(coat).stroke({ width: 2 * s, color: INK });
  for (const x of [-30, 30]) g.rect((x - 5) * s, 176 * s, 10 * s, 50 * s).fill(WOOD).stroke({ width: 1.5 * s, color: INK });
  for (const x of [-12, 12]) g.rect((x - 5) * s, 236 * s, 10 * s, 50 * s).fill(WOOD).stroke({ width: 1.5 * s, color: INK });
  k.addChild(g);
  return k;
}

/** the book plate's border: a cream margin with an inked rule and corner ornaments */
function pageFrame(w: number, h: number, u: number) {
  const g = new Graphics();
  const m = 18 * u;
  g.rect(0, 0, w, h).fill(CREAM).rect(m, m, w - m * 2, h - m * 2).cut();
  g.rect(m + 6 * u, m + 6 * u, w - m * 2 - 12 * u, h - m * 2 - 12 * u).stroke({ width: 3 * u, color: INK });
  for (const [x, y] of [
    [m + 6 * u, m + 6 * u],
    [w - m - 6 * u, m + 6 * u],
    [m + 6 * u, h - m - 6 * u],
    [w - m - 6 * u, h - m - 6 * u],
  ])
    g.poly(ell(x, y, 10 * u, 10 * u, 4, Math.PI / 4)).fill(RED).stroke({ width: 2 * u, color: INK });
  return g;
}

/** the growing nose (origin at the painted tip, growing along +x): length L, leaves after `leafy` */
function drawNose(g: Graphics, L: number, leafy: number) {
  g.clear();
  if (L < 2) return;
  const t0 = 11;
  const t1 = 8;
  g.poly([-8, -t0, L, -t1, L + 8, 0, L, t1, -8, t0]).fill(WOOD).stroke({ width: 3, color: INK, join: 'round' });
  for (let x = 30; x < L - 10; x += 46) g.moveTo(x, -3).lineTo(x + 24, -1).stroke({ width: 1.5, color: 0xa8703a });
  if (leafy > 0) {
    const leaf = (x: number, side: number, k: number) => {
      const s = Math.min(1, k) * 1.0;
      if (s <= 0) return;
      g.moveTo(x, side * 8).lineTo(x + 10 * s, side * 26 * s).stroke({ width: 3, color: 0x3a7a2a });
      g.poly(smooth([x + 10 * s, side * 26 * s, x + 34 * s, side * 30 * s, x + 44 * s, side * 50 * s, x + 18 * s, side * 46 * s], 3)).fill(0x5aaa3a).stroke({ width: 2, color: 0x2a5a1a });
    };
    leaf(L * 0.35, -1, leafy * 2);
    leaf(L * 0.55, 1, leafy * 2 - 0.4);
    leaf(L * 0.8, -1, leafy * 2 - 0.8);
  }
}

/** a little woodpecker (origin at its feet, facing -x along the nose) */
function woodpecker() {
  const g = new Graphics();
  g.poly(ell(0, -22, 22, 16, 14)).fill(0x2a2a2a).stroke({ width: 3, color: INK });
  g.poly([16, -26, 46, -34, 42, -18]).fill(0x2a2a2a);
  g.poly(ell(-18, -40, 14, 14, 12)).fill(0xffffff).stroke({ width: 3, color: INK });
  g.poly(ell(-20, -50, 10, 6, 10)).fill(RED);
  g.poly([-30, -42, -52, -38, -30, -34]).fill(0xe8b030).stroke({ width: 2, color: INK });
  g.poly(ell(-20, -42, 2.5, 2.5, 6)).fill(INK);
  g.moveTo(-4, -8).lineTo(-6, 0).moveTo(6, -8).lineTo(8, 0).stroke({ width: 3, color: 0xe8b030 });
  return g;
}

interface St {
  noseK: Container;
  nose: Graphics;
  len: { v: number; leaf: number };
  y0: number;
  /** the marionette's strings and cross, while they're up */
  rig: Container[];
}
const S = stash<St>();
const borrowed = new WeakMap<Container, ReturnType<typeof borrowCat>>();
/** where each string meets him (relative to his center) */
const STRINGS: [number, number][] = [
  [40, -190],
  [-125, -48],
  [88, 66],
  [-95, 212],
  [66, 222],
];
const BAR_Y = 70;
const BENCH: [number, number] = [1300, 700];

export const pinomichi: Signature = {
  dark: false,
  frame: 0xb87a45,
  tag: 'UNIVERSO DEL TALLER',
  open(c: SigCtx) {
    const k = new Container();
    const FLOOR = 830;
    const rm = room(W, H, 1, FLOOR);
    const props = new Graphics();
    paintedHearth(props, 300, FLOOR, 1);
    bench(props, BENCH[0], BENCH[1], 1);
    // the window and its sunbeam full of sawdust
    props.rect(470, 110, 210, 250).fill(0xcfe6f0).stroke({ width: 10, color: 0x6a4424 });
    props.moveTo(575, 110).lineTo(575, 360).moveTo(470, 235).lineTo(680, 235).stroke({ width: 8, color: 0x6a4424 });
    const beam = new Graphics().poly([470, 120, 680, 110, 1150, FLOOR, 760, FLOOR]).fill({ color: 0xfff2c8, alpha: 0.16 });
    beam.blendMode = 'add';
    const pups = [puppet(0.9, 0x3a6aa8), puppet(0.8, 0x7a3aa0)];
    pups[0].position.set(170, 40);
    pups[1].position.set(1760, 40);
    const shav = new Graphics();
    const r = rng(9);
    for (let i = 0; i < 30; i++) {
      const x = 60 + r() * (W - 120);
      const y = FLOOR + 20 + r() * 200;
      shav.poly(arcPts(x, y, 12 + r() * 10, 8 + r() * 6, 0, Math.PI * (1.2 + r()), 6), false).stroke({ width: 4, color: 0xf2d29a });
    }
    const motes = new Graphics();
    motes.blendMode = 'add';
    const page = pageFrame(W, H, 1);
    k.addChild(rm, props, beam, ...pups, shav, motes, page);
    c.back.addChild(k);
    hideDisc(c);
    const halo = glowDisc(360, 0xfff6e0, 0.5, 8, 28);
    halo.position.set(W / 2, c.catY - 20);
    c.behind.addChild(halo);
    // his nose (over him): during the silhouette it's ink like him
    const noseK = new Container();
    const nose = new Graphics();
    noseK.addChild(nose);
    noseK.position.set(W / 2 + NOSE_TIP[0], c.catY + NOSE_TIP[1]);
    noseK.rotation = NOSE_A;
    nose.tint = 0x1a1a1a;
    c.fg.addChild(noseK);
    const len = { v: 0, leaf: 0 };
    const st: St = { noseK, nose, len, y0: c.cat.y, rig: [] };
    S.set(c, st);
    const pts = Array.from({ length: 18 }, () => [480 + Math.random() * 500, 150 + Math.random() * 600, Math.random() * 6]);
    if (!c.reduce)
      every(c, 30, (t) => {
        pups.forEach((p, i) => !p.destroyed && (p.rotation = Math.sin(t * 1.5 + i * 2) * 0.05));
        if (!motes.destroyed) {
          motes.clear();
          for (const [x, y, ph] of pts) motes.poly(ell(x + Math.sin(t * 0.7 + ph) * 30, y + ((t * 14 + ph * 40) % 120), 2.5, 2.5, 5)).fill({ color: 0xfff2c8, alpha: 0.7 });
        }
        if (!noseK.destroyed && !c.cat.destroyed) noseK.y = c.catY + NOSE_TIP[1] + (c.cat.y - st.y0);
      });
    if (c.short) return;

    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    score(c, [
      [0.02, 'paper', 0.8],
      [0.15, 'paper', 1.0],
      [0.32, 'paper', 0.9],
      [0.5, 'pencil', 0.7],
    ]);
    // shavings fly off the bench
    if (!c.reduce)
      for (let i = 0; i < 18; i++)
        later(c, 0.05 + i * 0.05, () => {
          const sv = new Graphics().poly(arcPts(0, 0, 14, 10, 0, Math.PI * 1.6, 7), false).stroke({ width: 5, color: 0xf6dca8 });
          sv.position.set(BENCH[0] + 440, BENCH[1] - 30);
          c.back.addChild(sv);
          const vx = -300 - Math.random() * 500;
          gsap.to(sv, { x: sv.x + vx, rotation: 10 * (Math.random() - 0.5), duration: 1, ease: 'power1.out' });
          gsap.to(sv, { y: sv.y - 200 - Math.random() * 160, duration: 0.45, ease: 'power2.out' });
          gsap.to(sv, { y: BENCH[1] + 160, duration: 0.55, delay: 0.45, ease: 'power2.in' });
          gsap.to(sv, { alpha: 0, delay: 0.85, duration: 0.2, onComplete: () => destroyTree(sv) });
        });
    // the strings come down from the cross; he dangles
    const strings = new Graphics();
    const bar = new Graphics().rect(-200, -10, 400, 20).fill(0x8a5a2e).stroke({ width: 3, color: INK }).rect(-12, -70, 24, 140).fill(0x8a5a2e).stroke({ width: 3, color: INK });
    bar.position.set(W / 2, BAR_Y);
    c.fg.addChild(strings, bar);
    st.rig.push(strings, bar);
    const ends: [number, number][] = [
      [-190, 0],
      [190, 0],
      [0, -60],
      [-120, 0],
      [120, 0],
    ];
    const cut = [false, false, false, false, false];
    const drop = { v: c.reduce ? 1 : 0 };
    const cat = borrowCat(c);
    borrowed.set(c.root, cat);
    const y0 = c.cat.y;
    const drawStrings = (bob: number) => {
      if (strings.destroyed) return;
      strings.clear();
      STRINGS.forEach(([sx, sy], i) => {
        if (cut[i]) return;
        const ax = bar.x + ends[i][0];
        const ay = bar.y + ends[i][1];
        const bx = W / 2 + sx;
        const by = c.catY + sy + bob;
        strings.moveTo(ax, ay).lineTo(ax + (bx - ax) * drop.v, ay + (by - ay) * drop.v);
      });
      strings.stroke({ width: 7, color: INK, alpha: 0.8 });
      STRINGS.forEach(([sx, sy], i) => {
        if (cut[i]) return;
        const ax = bar.x + ends[i][0];
        const ay = bar.y + ends[i][1];
        const bx = W / 2 + sx;
        const by = c.catY + sy + bob;
        strings.moveTo(ax, ay).lineTo(ax + (bx - ax) * drop.v, ay + (by - ay) * drop.v);
      });
      strings.stroke({ width: 3, color: CREAM });
    };
    if (!c.reduce) gsap.to(drop, { v: 1, duration: 0.35, delay: 0.25, ease: 'power2.out' });
    if (!c.reduce) gsap.from(bar, { y: -120, duration: 0.35, delay: 0.2, ease: 'power2.out' });
    let free = false;
    const stopDangle = every(c, 60, (t) => {
      if (cat.given || bar.destroyed) return;
      const left = cut.filter((x) => !x).length;
      const bob = free || c.reduce ? 0 : Math.sin(t * 5) * 9 * (left / 5) - 6 * (left / 5);
      if (!c.reduce) {
        c.cat.y = y0 + bob;
        bar.x = W / 2 + Math.sin(t * 2.5) * 16 * (left / 5);
      }
      drawStrings(bob);
    });
    const snip = (i: number, t: number) =>
      beat(c, t, () => {
        cut[i] = true;
        sfx('tick', 1.6 + i * 0.1);
        sfx('hit', 1.4);
        const [sx, sy] = STRINGS[i];
        const mx = (bar.x + ends[i][0] + W / 2 + sx) / 2;
        const my = (bar.y + ends[i][1] + c.catY + sy) / 2;
        floatWord(c, c.fg, mx + 40, my - 20, '¡TAC!', { fontFamily: F.comic, fontSize: 44, fill: CREAM, stroke: { color: INK, width: 7 } }, 30, 0.6);
        if (c.reduce) return;
        // the loose end curls down
        const bit = new Graphics().moveTo(0, 0).quadraticCurveTo(10, 40, -6, 90).stroke({ width: 7, color: INK, alpha: 0.8 }).moveTo(0, 0).quadraticCurveTo(10, 40, -6, 90).stroke({ width: 3, color: CREAM });
        bit.position.set(mx, my);
        c.fg.addChild(bit);
        gsap.to(bit, { y: my + 160, rotation: 0.8, alpha: 0, duration: 0.6, ease: 'power1.in', onComplete: () => destroyTree(bit) });
      });
    [0.85, 1.05, 1.25, 1.45, 1.65].forEach((t, i) => snip([1, 2, 3, 4, 0][i], t));
    // free: the cross flies off, he lands on his own feet
    beat(c, 1.8, () => {
      free = true;
      stopDangle();
      strings.clear();
      if (!c.reduce) gsap.to(bar, { y: -200, rotation: 0.6, duration: 0.35, ease: 'power2.in', onComplete: () => destroyTree(bar) });
      else destroyTree(bar);
      if (!c.reduce && !cat.given) gsap.fromTo(c.cat, { y: y0 - 30 }, { y: y0, duration: 0.3, ease: 'bounce.out', onComplete: () => cat.give() });
      else cat.give();
      sfx('pop', 0.7);
    });
    // …and the nose grows across the screen (then goes back before the stamps)
    beat(c, 1.95, () => {
      sfx('charge', 1.8);
      later(c, 0.05, () => sfx('pencil', 0.5));
      if (c.reduce) {
        drawNose(nose, 300, 0);
        later(c, 0.8, () => !paid(c) && drawNose(nose, 0, 0));
        return;
      }
      gsap.to(len, { v: 430, duration: 0.45, ease: 'power2.out', onUpdate: () => !nose.destroyed && drawNose(nose, len.v, 0) });
      later(c, 1.0, () => {
        if (paid(c)) return;
        gsap.to(len, { v: 0, duration: 0.3, ease: 'power2.in', onUpdate: () => !nose.destroyed && drawNose(nose, len.v, 0) });
      });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    borrowed.get(c.root)?.give();
    const st = S.get(c);
    // a skipped reveal can reach the payoff with the strings still up: they go
    st?.rig.forEach((n) => !n.destroyed && gsap.to(n, { alpha: 0, duration: 0.2, onComplete: () => destroyTree(n) }));
    sfx('levelup', 1.1);
    later(c, 0.1, () => sfx('charge', 2.0));
    c.shaker.add(0.25);
    if (st && !st.nose.destroyed) {
      const { nose, len, noseK } = st;
      nose.tint = 0xffffff;
      gsap.killTweensOf(len);
      if (c.reduce) {
        drawNose(nose, 480, 1);
        later(c, 2.2, () => !nose.destroyed && drawNose(nose, 0, 0));
      } else {
        len.leaf = 0;
        gsap.to(len, { v: 520, duration: 0.5, ease: 'back.out(1.6)', onUpdate: () => !nose.destroyed && drawNose(nose, len.v, len.leaf) });
        gsap.to(len, { leaf: 1, duration: 0.6, delay: 0.35, onUpdate: () => !nose.destroyed && drawNose(nose, len.v, len.leaf) });
        // a woodpecker lands on the tip and pecks it back
        later(c, 0.9, () => {
          if (noseK.destroyed) return;
          const bird = woodpecker();
          // upright on screen (its parent is turned along the nose), standing on the nose's upper side
          bird.rotation = -NOSE_A;
          const holder = new Container();
          holder.addChild(bird);
          holder.position.set(len.v - 40, 10);
          noseK.addChild(holder);
          gsap.from(holder, { x: len.v + 260, y: 240, duration: 0.3, ease: 'power2.out' });
          const peck = (i: number) =>
            later(c, 0.4 + i * 0.22, () => {
              if (bird.destroyed) return;
              gsap.fromTo(bird, { rotation: bird.rotation }, { rotation: bird.rotation + 0.35, duration: 0.08, yoyo: true, repeat: 1 });
              sfx('tick', 1.2);
              sfx('hit', 1.6);
              if (i === 0) floatWord(c, c.fg, noseK.x + Math.cos(NOSE_A) * len.v, noseK.y + Math.sin(NOSE_A) * len.v - 70, 'toc, toc, toc', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 40, fill: CREAM, stroke: { color: INK, width: 6 } }, 40, 1.0);
            });
          for (let i = 0; i < 3; i++) peck(i);
          later(c, 1.15, () => {
            gsap.to(len, { v: 0, leaf: 0, duration: 0.5, ease: 'power2.in', onUpdate: () => !nose.destroyed && drawNose(nose, len.v, len.leaf) });
            if (!holder.destroyed) gsap.to(holder, { x: 300, y: 300, alpha: 0, duration: 0.5, ease: 'power1.in', onComplete: () => destroyTree(holder) });
          });
        });
      }
    }
    headline(c, '¡NO ES MENTIRA!', { fontFamily: F.comic, fontSize: 136, fill: RED, letterSpacing: 3, stroke: { color: C.ink, width: 14, join: 'round' } }, {
      aside: '(…creció otro poquito)',
      asideStyle: { fill: 0xfff4dc, stroke: { color: INK, width: 8, join: 'round' } },
      dur: 2.6,
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const floorY = h * 0.8;
    const rm = room(w, h, 0.36 * u, floorY);
    const props = new Graphics();
    paintedHearth(props, w / 2 - 130 * u, floorY, 0.36 * u);
    bench(props, w / 2 + 72 * u, floorY - 76 * u, 0.3 * u);
    const beam = new Graphics().poly([w / 2 - 100 * u, 0, w / 2 - 40 * u, 0, w / 2 + 120 * u, floorY, w / 2 - 10 * u, floorY]).fill({ color: 0xfff2c8, alpha: 0.18 });
    beam.blendMode = 'add';
    const halo = glowDisc(Math.min(w, h) * 0.4, 0xfff6e0, 0.45, 6, 28);
    halo.position.set(w / 2, h * 0.52);
    // the cross with its cut strings, hanging above him
    const bar = new Graphics();
    const bs = 0.32 * u;
    bar.rect(-200 * bs, -10 * bs, 400 * bs, 20 * bs).fill(0x8a5a2e).stroke({ width: 3 * bs, color: INK }).rect(-12 * bs, -70 * bs, 24 * bs, 140 * bs).fill(0x8a5a2e).stroke({ width: 3 * bs, color: INK });
    for (const x of [-190, -120, 120, 190]) bar.moveTo(x * bs, 0).lineTo(x * bs + 8 * bs, (160 + Math.abs(x) * 0.3) * bs).stroke({ width: 3 * bs, color: CREAM });
    bar.position.set(w / 2, 34 * u);
    const pups = [puppet(0.3 * u, 0x3a6aa8), puppet(0.27 * u, 0x7a3aa0)];
    pups[0].position.set(w / 2 - 150 * u, 14 * u);
    pups[1].position.set(w / 2 + 150 * u, 14 * u);
    const shav = new Graphics();
    const r = rng(9);
    const n = Math.round(w / (14 * u));
    for (let i = 0; i < n; i++) shav.poly(arcPts(r() * w, floorY + (6 + r() * 50) * u, (4 + r() * 3) * u, (3 + r() * 2) * u, 0, Math.PI * (1.2 + r()), 5), false).stroke({ width: 1.6 * u, color: 0xf2d29a });
    const page = pageFrame(w, h, 0.36 * u);
    k.addChild(rm, props, beam, halo, ...pups, bar, shav, page);
    if (live)
      cardLoop(k, 30, (t) => {
        pups.forEach((p, i) => (p.rotation = Math.sin(t * 1.5 + i * 2) * 0.06));
        bar.rotation = Math.sin(t * 1.1) * 0.04;
        beam.alpha = 0.85 + Math.sin(t * 0.8) * 0.15;
      });
    return k;
  },
};
