/**
 * La Maullorona: the river's universe (the weeping lady of the old Latin American tale, told tender and never scary:
 * here she is a mother cat who only lost track of her kittens). A wide river under a big blue moon, reeds and
 * cattails, lily pads with little white flowers, fireflies. A long white veil floats over the water and comes to rest
 * behind her; a sad «¡AAAAAY!» goes all the way around the screen; big cartoon tears fall and ring the water; and on
 * the bank, out of a cardboard box, three little heads peek out: miu, miu, miu.
 * Payoff: the kittens hop out of the box toward her, hearts and fireflies: ¡AHÍ ESTÁN! — …ya no llora: ahora los regaña.
 */
import { Container, Graphics, type Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, later, score } from './kit';
import {
  C,
  F,
  TAU,
  at,
  band,
  cardLoop,
  comic,
  fireflies,
  flat,
  glowDisc,
  hideDisc,
  moon,
  ngon,
  onCat,
  park,
  payline,
  puffWord,
  reeds,
  rnd,
  ripple,
  stash,
  take,
  tearPts,
  twinkle,
  vgrad,
  wrap,
} from './kitJ';

const SKY = [0x081230, 0x12224a, 0x1e3668, 0x2e4c86];
const WATER = [0x1a3460, 0x14284e, 0x0e1e3c, 0x0a162c];
const VEIL = 0xeef4fa;
const PALE = 0xcfe3ff;
const TEAR = 0x9fd4ff;

/** her eyes in the painting */
const EYES: [number, number][] = [
  [0.49, 0.335],
  [0.58, 0.335],
];

/** a kitten's head peeking (origin at its chin; s ≈ head width): ears, face, two big eyes */
function kittenHead(g: Graphics, x: number, y: number, s: number, fur: number, inner = 0xf3b2c0) {
  g.poly([x - s * 0.5, y - s * 0.5, x - s * 0.42, y - s * 1.05, x - s * 0.12, y - s * 0.72]).fill(fur);
  g.poly([x + s * 0.5, y - s * 0.5, x + s * 0.42, y - s * 1.05, x + s * 0.12, y - s * 0.72]).fill(fur);
  g.poly([x - s * 0.42, y - s * 0.6, x - s * 0.38, y - s * 0.9, x - s * 0.2, y - s * 0.7]).fill(inner);
  g.poly([x + s * 0.42, y - s * 0.6, x + s * 0.38, y - s * 0.9, x + s * 0.2, y - s * 0.7]).fill(inner);
  g.poly(ngon(x, y - s * 0.4, s * 0.52, s * 0.42, 16)).fill(fur);
  for (const dx of [-0.2, 0.2]) {
    g.poly(ngon(x + dx * s, y - s * 0.44, s * 0.11, s * 0.13, 10)).fill(0x16161e);
    g.poly(ngon(x + dx * s + s * 0.03, y - s * 0.49, s * 0.04, s * 0.04, 6)).fill(0xffffff);
  }
  g.poly([x - s * 0.04, y - s * 0.3, x + s * 0.04, y - s * 0.3, x, y - s * 0.25]).fill(0xe88a9a);
}

/** the cardboard box on the bank (origin at its bottom center; s = width); returns the box and the kittens' layer */
function box(s: number) {
  const k = new Container();
  const back = new Graphics();
  back.poly([-s * 0.5, -s * 0.62, s * 0.5, -s * 0.62, s * 0.42, -s * 0.78, -s * 0.42, -s * 0.78]).fill(0x8a6034);
  const kits = new Graphics();
  const front = new Graphics();
  front.rect(-s * 0.5, -s * 0.62, s, s * 0.62).fill(0xc08a4a);
  front.rect(-s * 0.5, -s * 0.62, s, s * 0.62).stroke({ width: Math.max(2, s * 0.02), color: 0x5a3a1c });
  front.poly([-s * 0.5, -s * 0.62, -s * 0.78, -s * 0.5, -s * 0.72, -s * 0.36, -s * 0.5, -s * 0.5]).fill(0xa8743c);
  front.poly([s * 0.5, -s * 0.62, s * 0.8, -s * 0.72, s * 0.76, -s * 0.56, s * 0.5, -s * 0.5]).fill(0xa8743c);
  front.rect(-s * 0.08, -s * 0.62, s * 0.16, s * 0.62).fill({ color: 0xe6c08a, alpha: 0.5 });
  front.poly(ngon(0, -s * 0.28, s * 0.09, s * 0.08, 10)).stroke({ width: Math.max(1.5, s * 0.015), color: 0x5a3a1c });
  k.addChild(back, kits, front);
  return { k, kits };
}

/** the three kittens' heads, `up` 0..1 out of the box (0 = ears only) */
function drawKits(g: Graphics, s: number, up: number, eyes = true) {
  g.clear();
  const fur = [0xf4f4f4, 0x9aa0ac, 0xf0a04a];
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * s * 0.3;
    const y = -s * 0.62 + s * 0.12 - up * s * (0.22 + (i === 1 ? 0.05 : 0));
    kittenHead(g, x, y, s * 0.26, fur[i]);
    if (!eyes) g.rect(x - s * 0.16, y - s * 0.24, s * 0.32, s * 0.2).fill(fur[i]);
  }
}

/** the long floating veil: a wavy, tapering ribbon with a lace edge (redrawn as it flies) */
function veilPath(g: Graphics, x: number, y: number, len: number, t: number, alpha = 0.85) {
  g.clear();
  const N = 26;
  const pts: number[] = [];
  for (let i = 0; i <= N; i++) {
    const q = i / N;
    pts.push(x - q * len, y + Math.sin(q * 6 - t * 5) * 26 * (0.3 + q) - q * 30);
  }
  g.poly(band(pts, 46, 10)).fill({ color: VEIL, alpha });
  for (let i = 1; i < N; i += 2) g.poly(ngon(pts[i * 2], pts[i * 2 + 1] + 40 * (1 - i / N) + 6, 5, 5, 6)).fill({ color: 0xffffff, alpha: alpha * 0.8 });
}

/** the veil at rest behind her: a tall soft bell shape that breathes (origin at her head) */
function veilBell(g: Graphics, t: number, a = 0.3) {
  g.clear();
  const N = 14;
  const side = (q: number, s: number) => s * (120 + 250 * Math.pow(q, 1.3)) + Math.sin(t * 1.6 + q * 4 + (s > 0 ? 0 : 1)) * 14 * q;
  const pts: number[] = [];
  // the crown: an arc over her head
  for (let i = 0; i <= 10; i++) {
    const b = Math.PI + (i / 10) * Math.PI;
    pts.push(Math.cos(b) * 120, Math.sin(b) * 90);
  }
  for (let i = 1; i <= N; i++) {
    const q = i / N;
    pts.push(side(q, 1), q * 470);
  }
  // the scalloped lace hem
  const x1 = side(1, 1);
  const x0 = side(1, -1);
  for (let i = 1; i < 12; i++) {
    const f = i / 12;
    pts.push(x1 + (x0 - x1) * f, 470 + (i % 2 ? 20 : 4) + Math.sin(t * 2 + i) * 3);
  }
  for (let i = N; i >= 1; i--) {
    const q = i / N;
    pts.push(side(q, -1), q * 470);
  }
  g.poly(pts).fill({ color: VEIL, alpha: a });
  g.poly(pts.map((v, i) => (i % 2 ? v * 0.94 : v * 0.72))).fill({ color: 0xffffff, alpha: a * 0.45 });
  for (let i = 1; i < 12; i += 2) {
    const f = i / 12;
    g.poly(ngon(x1 + (x0 - x1) * f, 486, 6, 6, 6)).fill({ color: 0xffffff, alpha: a * 1.6 });
  }
}

/**
 * the river at night (w×h): sky, stars, moon, the far bank's trees, the water's bands and the moon's shimmering
 * road, lily pads, reeds on both near banks, fireflies (drawn by draw(t)). `u` = h / 1080.
 */
function river(w: number, h: number, seed: number) {
  const u = h / 1080;
  const cx = w / 2;
  const hz = h * 0.56;
  const r = rnd(seed);
  const k = new Container();
  const sky = vgrad(new Graphics(), 0, 0, w, hz + 10 * u, SKY, 16);
  const stars = new Graphics();
  const ns = Math.round((w * h) / (55000 * u * u));
  for (let i = 0; i < ns; i++) {
    const sx = r() * w;
    const sy = r() * hz * 0.8;
    const s = (1 + r() * 2) * u;
    if (i % 8 === 0) stars.poly(twinkle(sx, sy, s * 3)).fill({ color: 0xe8f0ff, alpha: 0.85 });
    else stars.rect(sx, sy, s, s).fill({ color: 0xe8f0ff, alpha: 0.35 + r() * 0.5 });
  }
  const mx = cx + h * 0.38;
  const my = h * 0.2;
  const m = moon(110 * u, 0xf0f6ff, 0xa8c8ff, 0xc8d6ee, 0.5);
  m.position.set(mx, my);
  // the far bank: hills and round tree crowns
  const bank = new Graphics();
  bank.poly([-20, hz + 6 * u, -20, hz - 40 * u, w * 0.2, hz - 70 * u, w * 0.45, hz - 30 * u, w * 0.7, hz - 80 * u, w + 20, hz - 40 * u, w + 20, hz + 6 * u]).fill(0x0c1a34);
  for (let x = -20 * u; x < w + 40 * u; x += 46 * u * (0.7 + r() * 0.6)) {
    const s = (26 + r() * 30) * u;
    bank.poly(ngon(x, hz - 30 * u - r() * 30 * u, s, s * 0.85, 10)).fill(0x0a1630);
  }
  // the water: bands darker toward us, the moon's shimmering road, soft light streaks
  const water = vgrad(new Graphics(), 0, hz, w, h - hz, WATER, 12);
  const shimmer = new Graphics();
  const drawShimmer = (t: number) => {
    shimmer.clear();
    const rr = rnd(seed + 9);
    for (let i = 0; i < 26; i++) {
      const q = i / 26;
      const y = hz + 8 * u + q * (h - hz) * 0.9;
      const half = (16 + q * 120) * u * (0.6 + rr() * 0.6);
      const x = mx + Math.sin(t * 1.6 + i * 1.3) * 10 * u * (1 + q * 3);
      shimmer.poly([x - half, y, x + half, y, x + half * 0.8, y + (3 + q * 5) * u, x - half * 0.8, y + (3 + q * 5) * u]).fill({ color: 0xdfeaff, alpha: 0.45 - q * 0.25 });
    }
    for (let i = 0; i < 9; i++) {
      const y = hz + (40 + i * 52) * u;
      const x = ((rr() * w + t * 30 * u * (1 + i * 0.2)) % (w + 400 * u)) - 200 * u;
      shimmer.poly([x, y, x + 160 * u, y, x + 150 * u, y + 2 * u, x + 10 * u, y + 2 * u]).fill({ color: 0x9fb8e0, alpha: 0.18 });
    }
  };
  drawShimmer(0);
  // lily pads with little white flowers
  const pads = new Graphics();
  for (const [px, py, s] of [
    [0.16, 0.72, 1],
    [0.28, 0.86, 1.3],
    [0.74, 0.7, 0.9],
    [0.86, 0.92, 1.4],
    [0.6, 0.78, 0.8],
    [0.4, 0.95, 1.1],
  ]) {
    const x = cx + (px - 0.5) * h * 1.78;
    const y = py * h;
    const rx = 46 * u * s;
    const pts = ngon(x, y, rx, rx * 0.32, 18);
    pads.poly([x, y, ...pts.slice(4)]).fill(0x2e6a4a);
    if (s > 1) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        pads.poly(ngon(x + Math.cos(a) * 10 * u * s, y - 10 * u * s + Math.sin(a) * 3 * u * s, 10 * u * s, 4 * u * s, 8, a)).fill(0xf6f6ff);
      }
      pads.poly(ngon(x, y - 10 * u * s, 5 * u * s, 3 * u * s, 8)).fill(0xffe27a);
    }
  }
  // the near banks: dark earth and reeds left and right (clear of the middle)
  const near = new Graphics();
  near.poly([-20, h * 0.82, w * 0.12, h * 0.86, w * 0.24, h * 0.95, w * 0.3, h + 20, -20, h + 20]).fill(0x0a1424);
  near.poly([w + 20, h * 0.8, w * 0.86, h * 0.84, w * 0.72, h * 0.92, w * 0.66, h + 20, w + 20, h + 20]).fill(0x0a1424);
  const reedL = new Graphics();
  const reedR = new Graphics();
  const drawReeds = (sw: number) => {
    reedL.clear();
    reedR.clear();
    reeds(reedL, -20, w * 0.22, h * 0.98, 280 * u, 0x0e2030, seed + 3, sw, 0x3a2414, 22 * u);
    reeds(reedR, w * 0.78, w + 20, h * 0.97, 300 * u, 0x0e2030, seed + 4, -sw, 0x3a2414, 22 * u);
  };
  drawReeds(0);
  const ff = fireflies(Math.max(10, Math.round((w / h) * 16)), 0, hz - 120 * u, w, h * 0.5, seed + 5, 0xd8ff9a, 4 * u);
  k.addChild(sky, stars, m, bank, water, shimmer, pads, near, reedL, reedR, ff.g);
  const live = (t: number) => {
    drawShimmer(t);
    drawReeds(Math.sin(t * 0.9) * 0.18);
    ff.draw(t);
  };
  return { k, live, u, hz };
}

interface St {
  bell: Graphics | null;
  kits: Graphics | null;
  kitBox: Container | null;
  aay: Container | null;
}
const S = stash<St>();
const BOX_AT: [number, number] = [1500, 905];
const BOX_S = 200;

export const maullorona: Signature = {
  dark: true,
  frame: 0x3a5a8c,
  tag: 'UNIVERSO DEL RÍO',
  open(c: SigCtx) {
    const rv = river(W, H, 41);
    c.back.addChild(rv.k);
    hideDisc(c, 0.2);
    if (!c.short && !c.reduce) {
      rv.k.alpha = 0;
      gsap.to(rv.k, { alpha: 1, duration: 0.35 });
    }
    if (!c.reduce) every(c, 30, (t) => !rv.k.destroyed && rv.live(t));
    // the box on the bank (it lives in the scenery so it stays on its bank on any screen)
    const bx = box(BOX_S);
    bx.k.position.set(BOX_AT[0], BOX_AT[1]);
    c.back.addChild(bx.k);
    drawKits(bx.kits, BOX_S, 0, false);
    // the veil at rest behind her (and a soft moonlight so the silhouette reads)
    const halo = glowDisc(380, 0xa8c8ff, 0.24, 8, 28);
    halo.position.set(W / 2, c.catY);
    const bell = new Graphics();
    bell.position.set(W / 2 + 0.035 * 520, c.catY - 0.32 * 520);
    veilBell(bell, 0);
    c.behind.addChild(halo, bell);
    park(c, 'main', comic('¡AHÍ ESTÁN!', VEIL, 130));
    const st: St = { bell, kits: bx.kits, kitBox: bx.k, aay: null };
    S.set(c, st);
    if (!c.reduce) every(c, 30, (t) => !bell.destroyed && veilBell(bell, t));
    if (c.short) {
      drawKits(bx.kits, BOX_S, 0.6);
      return;
    }

    // the floating veil comes over the water from the left and settles behind her
    bell.alpha = 0;
    const fly = new Graphics();
    c.behind.addChildAt(fly, 0);
    const vp = { x: -100, t: 0 };
    const drawFly = () => !fly.destroyed && veilPath(fly, vp.x, c.catY + 40 - Math.max(0, vp.x - 700) * 0.25, 640, vp.t, 0.85);
    if (c.reduce) {
      bell.alpha = 1;
      fly.destroy();
    } else {
      drawFly();
      gsap.to(vp, { x: W / 2 + 200, t: 2, duration: 0.95, delay: 0.1, ease: 'sine.inOut', onUpdate: drawFly });
      later(c, 0.9, () => {
        gsap.to(bell, { alpha: 1, duration: 0.3 });
        if (!fly.destroyed) gsap.to(fly, { alpha: 0, duration: 0.3, onComplete: () => destroyTree(fly) });
      });
    }

    // ¡AAAAAY! goes all the way around the screen (letters built now, on an ellipse around her)
    const aay = new Container();
    const chars = '¡AAAAAAY!'.split('');
    const ts: Text[] = chars.map((ch) => {
      const t = txt(ch, { fontFamily: F.comic, fontSize: 110, fill: PALE, stroke: { color: 0x0a1630, width: 12, join: 'round' } });
      t.anchor.set(0.5);
      aay.addChild(t);
      return t;
    });
    aay.alpha = 0.001;
    c.fg.addChild(aay);
    st.aay = aay;
    const placeA = (a0: number) => {
      ts.forEach((t, i) => {
        const a = a0 + (i - chars.length) * 0.2;
        t.position.set(W / 2 + Math.cos(a) * 700, c.catY + Math.sin(a) * 360);
        t.rotation = a + Math.PI / 2;
        t.scale.set(0.8 + 0.25 * Math.sin(i * 0.9 + a0 * 2));
      });
    };
    placeA(Math.PI * 0.9);
    score(c, [
      [0.05, 'purr', 0.4],
      [0.15, 'whoosh', 0.45],
      [0.52, 'meow', 0.62],
      [0.58, 'whoosh', 0.35],
      [1.5, 'pop', 1.6],
      [1.62, 'pop', 1.8],
      [1.74, 'pop', 2.0],
    ]);
    at(c, 0.5, () => {
      if (aay.destroyed) return;
      aay.alpha = 1;
      if (c.reduce) {
        placeA(Math.PI * 1.35);
        gsap.to(aay, { alpha: 0, delay: 0.9, duration: 0.3, onComplete: () => destroyTree(aay) });
        return;
      }
      const p = { a: Math.PI * 0.9 };
      gsap.to(p, { a: Math.PI * 0.9 + TAU * 0.92, duration: 1.15, ease: 'sine.inOut', onUpdate: () => !aay.destroyed && placeA(p.a) });
      gsap.to(aay, { alpha: 0, delay: 1.0, duration: 0.25, onComplete: () => destroyTree(aay) });
    });

    // big cartoon tears fall from her eyes and ring the water
    for (let i = 0; i < 6; i++)
      at(c, 1.0 + i * 0.12, () => {
        const [ex, ey] = onCat(c, EYES[i % 2][0], EYES[i % 2][1]);
        const d = new Graphics().poly(tearPts(0, 0, 13)).fill(TEAR).poly(ngon(-4, -4, 4, 6, 8)).fill({ color: 0xffffff, alpha: 0.9 });
        d.position.set(ex + (i % 2 ? 14 : -14), ey + 18);
        c.fg.addChild(d);
        const tx = ex + (i % 2 ? 1 : -1) * (150 + i * 30);
        const ty = 850 + (i % 3) * 22;
        if (c.reduce) {
          d.position.set(tx, ty - 40);
          gsap.to(d, { alpha: 0, delay: 0.3, duration: 0.2, onComplete: () => destroyTree(d) });
          return;
        }
        gsap.to(d, { x: tx, duration: 0.45, ease: 'power1.out' });
        gsap.to(d, {
          y: ty,
          duration: 0.45,
          ease: 'power2.in',
          onComplete: () => {
            destroyTree(d);
            ripple(c, c.fg, tx, ty, 0xdfeeff, 30, 4, 1.0, 4);
            if (i % 2 === 0) sfx('splash', 1.7);
          },
        });
      });

    // out of the box: ears… then three little faces
    at(c, 1.45, () => {
      if (bx.kits.destroyed) return;
      if (c.reduce) {
        drawKits(bx.kits, BOX_S, 0.6);
        return;
      }
      const p = { up: 0 };
      gsap.to(p, { up: 0.6, duration: 0.3, ease: 'back.out(2)', onUpdate: () => !bx.kits.destroyed && drawKits(bx.kits, BOX_S, p.up) });
    });
    for (let i = 0; i < 3; i++)
      at(c, 1.5 + i * 0.12, () =>
        puffWord(c, c.fg, flat('miu', { fontFamily: F.comic, fontSize: 40, fill: 0xfff2c8, stroke: { color: C.ink, width: 6, join: 'round' } }), BOX_AT[0] - 70 + i * 70, BOX_AT[1] - 200 - (i === 1 ? 20 : 0), 0.5, 30),
      );
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    if (st) {
      if (st.aay && !st.aay.destroyed) destroyTree(st.aay);
      if (st.bell && !st.bell.destroyed) st.bell.alpha = 1;
    }
    sfx('sting', 1.3);
    sfx('meow', 1.25);
    later(c, 0.25, () => sfx('meow', 1.6));
    later(c, 0.45, () => sfx('meow', 1.8));
    c.shaker.add(0.15);
    // the kittens hop out of the box toward her (they live in the scenery, next to the box)
    if (st?.kitBox && !st.kitBox.destroyed && st.kits && !st.kits.destroyed) {
      drawKits(st.kits, BOX_S, 0, false);
      const fur = [0xf4f4f4, 0x9aa0ac, 0xf0a04a];
      for (let i = 0; i < 3; i++) {
        const g = new Graphics();
        kittenHead(g, 0, 0, 56, fur[i]);
        g.poly(ngon(0, 30, 30, 26, 12)).fill(fur[i]);
        g.position.set(BOX_AT[0] + (i - 1) * 60, BOX_AT[1] - 150);
        st.kitBox.parent?.addChild(g);
        const tx = BOX_AT[0] - 260 - i * 90;
        const ty = BOX_AT[1] - 40 + (i % 2) * 20;
        if (c.reduce) {
          g.position.set(tx, ty);
          continue;
        }
        const p = { q: 0 };
        const x0 = g.x;
        const y0 = g.y;
        gsap.to(p, {
          q: 1,
          duration: 0.7,
          delay: i * 0.12,
          ease: 'none',
          onUpdate: () => {
            if (g.destroyed) return;
            g.x = x0 + (tx - x0) * p.q;
            g.y = y0 + (ty - y0) * p.q - Math.abs(Math.sin(p.q * Math.PI * 3)) * 60;
          },
        });
      }
    }
    // hearts float up from her, the fireflies gather
    for (let i = 0; i < 7; i++)
      later(c, c.reduce ? 0 : i * 0.12, () => {
        const ht = flat('♥', { fontFamily: F.comic, fontSize: 46 + (i % 3) * 14, fill: i % 2 ? 0xffb8cc : 0xffffff, stroke: { color: 0x0a1630, width: 6 } });
        puffWord(c, c.fg, ht, W / 2 - 200 + i * 70, c.catY - 180 - (i % 2) * 40, 1.1, 120);
      });
    const ff = fireflies(30, W / 2 - 420, c.catY - 300, 840, 600, 77, 0xe8ff9a, 5);
    c.behind.addChild(ff.g);
    if (!c.reduce) {
      ff.g.alpha = 0;
      gsap.to(ff.g, { alpha: 1, duration: 0.5 });
      every(c, 30, (t) => !ff.g.destroyed && ff.draw(t));
    }
    const main = take(c, 'main', () => comic('¡AHÍ ESTÁN!', VEIL, 130));
    payline(c, main, '…ya no llora: ahora los regaña.', { maxW: 640, dur: 2.6, asideStyle: { fill: PALE } });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const rv = river(w, h, 43);
    k.addChild(rv.k);
    const u = h / 1080;
    // the box on the bank, three pairs of ears (and eyes) peeking
    const bx = box(260 * u);
    bx.k.position.set(Math.min(w * 0.86, w / 2 + h * 0.58), h * 0.95);
    drawKits(bx.kits, 260 * u, 0.45);
    k.addChild(bx.k);
    // the veil drifting over the water
    const fly = new Graphics();
    fly.scale.set(u * 1.3);
    k.addChild(fly);
    const vx = w / 2 / (u * 1.3);
    const vy = (h * 0.7) / (u * 1.3);
    veilPath(fly, vx + 300, vy, 620, 0, 0.55);
    const rip = new Graphics();
    k.addChild(rip);
    if (live)
      cardLoop(k, 30, (t) => {
        rv.live(t);
        veilPath(fly, vx + 300 + Math.sin(t * 0.4) * 120, vy, 620, t, 0.55);
        rip.clear();
        for (let i = 0; i < 3; i++) {
          const q = (t * 0.5 + i / 3) % 1;
          rip.poly(ngon(w / 2 + (i - 1) * h * 0.4, h * (0.78 + i * 0.05), (20 + q * 120) * u, (6 + q * 34) * u, 22)).stroke({ width: 3 * u, color: 0xdfeeff, alpha: 0.6 * (1 - q) });
        }
      });
    return k;
  },
};
