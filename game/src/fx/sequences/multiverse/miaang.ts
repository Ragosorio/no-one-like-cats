/**
 * Miaang: the universe of the four (an airbender cartoon). A high pale sky turning around him in long spiral arms,
 * curling auspicious clouds, far mountain peaks crowned with slender temple towers over a sea of cloud. A gust (¡FIUUU!)
 * and the four come one by one — a drop, a rock, a flame, a swirl — and orbit him; a great six-legged flying bison
 * drifts across like a cloud (¡MUUU!); the blue arrow on his head lights up: ¡CUATRO EN UNO!
 * Payoff: the four fly into him and a whirlwind bursts out in rings; ¡AIRE! / …ya merito los cuatro.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, arrive, burst, every, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { arcPts, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { type Head, band, prepHead, prepWord, show, showHead, spiralPts } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';

const SAFFRON = 0xf6a01a;
const SKY = [0x7ec4ec, 0xa6d8f2, 0xcfeaf6, 0xf2f8f2];
const ARROW = 0x3a8ee6;
const PEAK = 0x8aa6c4;

// --- the four ---------------------------------------------------------------------------------
function glow(g: Graphics, x: number, y: number, r: number, color: number, a = 0.35) {
  for (let i = 3; i >= 1; i--) g.poly(ngon(x, y, r * (0.7 + i * 0.25), r * (0.7 + i * 0.25), 16)).fill({ color, alpha: a / 3 });
}
function drop(g: Graphics, x: number, y: number, s: number) {
  glow(g, x, y, s * 1.3, 0x7ec4ff);
  g.poly([x, y - 1.45 * s, ...arcPts(x, y, s, -0.45, Math.PI + 0.45, 12)]).fill(0x3a8ee6).stroke({ width: s * 0.1, color: 0x1a3a6a, join: 'round' });
  g.poly(ngon(x - s * 0.38, y - s * 0.1, s * 0.16, s * 0.34, 8, 0.4)).fill({ color: 0xffffff, alpha: 0.8 });
}
function rock(g: Graphics, x: number, y: number, s: number) {
  glow(g, x, y, s * 1.3, 0xb8d870);
  const P = (p: number[]) => p.map((v, i) => (i % 2 ? y : x) + v * s);
  g.poly(P([-1, 0.3, -0.7, -0.6, 0, -0.95, 0.8, -0.55, 1, 0.25, 0.4, 0.85, -0.5, 0.8])).fill(0x7a6a4a).stroke({ width: s * 0.1, color: 0x3a2a1a, join: 'round' });
  g.poly(P([-0.7, -0.6, 0, -0.95, 0.8, -0.55, 0.2, -0.2])).fill(0x9a8a5a);
  g.poly(P([-1, 0.3, -0.7, -0.6, 0.2, -0.2, -0.2, 0.35])).fill(0x6a8a3a);
}
function flame(g: Graphics, x: number, y: number, s: number, t = 0) {
  glow(g, x, y, s * 1.3, 0xffa040);
  const w = Math.sin(t * 12) * 0.08;
  const P = (p: number[], k = 1) => p.map((v, i) => (i % 2 ? y + v * s * k : x + v * s * k));
  const out = [0 + w, -1.55, 0.36, -0.7, 0.78 + w, -0.95, 0.72, -0.1, 0.92, 0.4, 0.5, 0.95, -0.5, 0.95, -0.92, 0.4, -0.72, -0.25, -0.5 - w, -0.62, -0.18, -0.36];
  g.poly(P(out)).fill(0xe8481a).stroke({ width: s * 0.1, color: 0x6a1a0a, join: 'round' });
  g.poly(P([0, -0.85, 0.32, -0.2, 0.5, 0.5, 0, 0.85, -0.5, 0.5, -0.36, -0.1], 0.8)).fill(0xffc83a);
}
function swirl(g: Graphics, x: number, y: number, s: number, t = 0) {
  glow(g, x, y, s * 1.3, 0xffffff, 0.5);
  g.poly(band(spiralPts(x, y, s * 0.08, s * 0.95, 1.6, 26, t * 3), s * 0.05, s * 0.18)).fill(0xf6f8ff).stroke({ width: s * 0.07, color: 0x5a9ac8, join: 'round' });
}
type Elem = (g: Graphics, x: number, y: number, s: number, t?: number) => void;
const FOUR: Elem[] = [drop, rock, flame, swirl];

/** a curling auspicious cloud: three spirals on a soft base (white, pale-blue edge), centered at (x, y), size s */
function curlCloud(g: Graphics, x: number, y: number, s: number, flip = 1) {
  g.poly(ngon(x, y + s * 0.18, s * 1.2, s * 0.32, 16)).fill(0xffffff).stroke({ width: s * 0.05, color: 0x9ac8e6 });
  for (const [dx, dy, r, a0] of [
    [-0.7, 0, 0.36, 0],
    [0, -0.25, 0.5, 1],
    [0.75, 0.02, 0.34, 2],
  ]) {
    const cx = x + dx * s * flip;
    const cy = y + dy * s;
    g.poly(ngon(cx, cy, r * s, r * s, 16)).fill(0xffffff).stroke({ width: s * 0.05, color: 0x9ac8e6 });
    g.poly(band(spiralPts(cx, cy, r * s * 0.12, r * s * 0.82, 1.15, 16, a0 * 2), s * 0.02, s * 0.05)).fill(0x9ac8e6);
  }
}

/** the far peaks with their temple towers (slender, blue roofs) and a sea of cloud below; `k` scale */
function peaks(g: Graphics, w: number, h: number, k: number, cx: number, seed: number) {
  const r = rnd(seed);
  const base = h * 0.72;
  const n = Math.max(4, Math.round(w / (300 * k)));
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (w / n) + (r() - 0.5) * 120 * k;
    if (Math.abs(x - cx) < 220 * k) continue;
    const top = h * (0.3 + r() * 0.18);
    const hw = (90 + r() * 70) * k;
    g.poly([x - hw * 1.6, base, x - hw * 0.4, top + 30 * k, x, top, x + hw * 0.5, top + 40 * k, x + hw * 1.5, base]).fill(i % 2 ? PEAK : 0x9ab4ce);
    g.poly([x - hw * 0.4, top + 30 * k, x, top, x + hw * 0.1, top + 60 * k]).fill({ color: 0xffffff, alpha: 0.4 });
    if (r() < 0.7) {
      // a temple: towers with conical blue roofs
      for (const [dx, hh, rw] of [
        [-0.5, 1, 0.16],
        [0, 1.5, 0.2],
        [0.45, 0.8, 0.14],
      ]) {
        const tx = x + dx * 60 * k;
        const ty = top + 8 * k;
        const tw = rw * 60 * k;
        g.rect(tx - tw, ty - hh * 60 * k, tw * 2, hh * 60 * k).fill(0xf2e8d0);
        g.poly([tx - tw * 1.5, ty - hh * 60 * k, tx, ty - hh * 60 * k - tw * 4.4, tx + tw * 1.5, ty - hh * 60 * k]).fill(0x2a6ab8);
        g.rect(tx - tw * 0.4, ty - hh * 38 * k, tw * 0.8, tw).fill(0x3a2a1a);
      }
    }
  }
  // the sea of cloud
  for (let i = 0; i < n * 3; i++) {
    const x = (i / (n * 3)) * w + (r() - 0.5) * 60 * k;
    g.poly(ngon(x, base + (r() - 0.3) * 30 * k, (90 + r() * 60) * k, (40 + r() * 20) * k, 14)).fill(i % 2 ? 0xffffff : 0xeef6fb);
  }
  g.rect(0, base + 20 * k, w, h - base).fill(0xf6fbff);
}

/** the spiral arms of the sky (white bands) around (0,0): draw once, turn the container */
function arms(g: Graphics, R: number, k: number) {
  for (let a = 0; a < 5; a++) g.poly(band(spiralPts(0, 0, 60 * k, R, 0.75, 28, (a / 5) * Math.PI * 2), 4 * k, 70 * k)).fill({ color: 0xffffff, alpha: 0.22 });
}

/** the flying bison: a big fluffy cloud of a beast (facing left), the brown arrow on its head, six stubby legs, a flat tail */
function bison(s: number) {
  const g = new Graphics();
  const ink = { width: Math.max(2, 5 * s), color: 0x5a4a3a, join: 'round' as const };
  // tail (right): a wide flat paddle
  g.poly([200 * s, -20 * s, 330 * s, -70 * s, 360 * s, 10 * s, 330 * s, 80 * s, 200 * s, 40 * s]).fill(0xf4f2ea).stroke(ink);
  g.poly([250 * s, -40 * s, 340 * s, 0, 250 * s, 40 * s]).fill(0x9a7a5a);
  // legs
  for (let i = 0; i < 3; i++) for (const e of [0, 1]) g.poly(ngon((-120 + i * 110 + e * 30) * s, (78 + e * 6) * s, 22 * s, 30 * s, 10)).fill(e ? 0xe2ded2 : 0xf4f2ea).stroke(ink);
  // the fluffy body: a scalloped oval
  const body: number[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const rr = 1 + (i % 2 ? 0.06 : 0);
    body.push(Math.cos(a) * 230 * s * rr, Math.sin(a) * 92 * s * rr);
  }
  g.poly(body).fill(0xf4f2ea).stroke(ink);
  // the head (left): a big round face, little horns, sleepy eyes, a wide nose, the arrow
  g.poly(ngon(-230 * s, -10 * s, 96 * s, 84 * s, 22)).fill(0xf4f2ea).stroke(ink);
  g.poly([-280 * s, -80 * s, -310 * s, -126 * s, -262 * s, -92 * s]).fill(0xe8dcc0).stroke(ink);
  g.poly([-180 * s, -80 * s, -150 * s, -126 * s, -198 * s, -92 * s]).fill(0xe8dcc0).stroke(ink);
  g.poly([-230 * s, -92 * s, -196 * s, -60 * s, -214 * s, -60 * s, -214 * s, 0, -246 * s, 0, -246 * s, -60 * s, -264 * s, -60 * s]).fill(0x9a6a3a);
  for (const ex of [-268, -192]) g.poly(streak(ex * s - 14 * s, 4 * s, ex * s + 14 * s, 4 * s, 3 * s, 3 * s)).fill(0x5a4a3a);
  g.poly(ngon(-232 * s, 44 * s, 40 * s, 20 * s, 14)).fill(0xe2d0b8).stroke(ink);
  return g;
}

/** the arrow on his head (top of head → forehead, its head pointing down), glowing */
function arrowMark(g: Graphics, x0: number, y0: number, x1: number, y1: number, a: number) {
  g.clear();
  if (a <= 0.01) return;
  for (let i = 3; i >= 1; i--) g.poly(streak(x0, y0 - 10, x1, y1 + 20, 14 + i * 9, 14 + i * 9)).fill({ color: 0x9fd8ff, alpha: (a * 0.35) / i });
  g.poly(streak(x0, y0, x1, y1 - 14, 6, 8)).fill({ color: 0x7ec4ff, alpha: a });
  g.poly([x1 - 24, y1 - 22, x1 + 24, y1 - 22, x1, y1 + 16]).fill({ color: 0x7ec4ff, alpha: a });
  g.poly(streak(x0, y0 + 6, x1, y1 - 18, 2.5, 3)).fill({ color: 0xffffff, alpha: a });
}

interface St {
  ring: { v: number; speed: number };
  alive4: { v: number };
  head: Head;
  spin: Container;
}
const S = stash<St>();

export const miaang: Signature = {
  dark: false,
  frame: SAFFRON,
  tag: 'UNIVERSO DE LOS CUATRO',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, H, SKY, 16);
    const spin = new Container();
    spin.position.set(W / 2, c.catY);
    const ag = new Graphics();
    arms(ag, 1500, 1);
    spin.addChild(ag);
    const pk = new Graphics();
    peaks(pk, W, H, 1, W / 2, 8);
    const cl = new Graphics();
    curlCloud(cl, 320, 170, 120);
    curlCloud(cl, 1620, 120, 100, -1);
    curlCloud(cl, 1500, 420, 80);
    curlCloud(cl, 420, 470, 70, -1);
    const bis = bison(0.95);
    bis.position.set(W + 450, 250);
    k.addChild(sky, spin, pk, cl, bis);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    // the four in orbit: back half behind him, front half over him
    const eb = new Graphics();
    const ef = new Graphics();
    c.behind.addChild(eb);
    c.fg.addChild(ef);
    const ring = { v: 0, speed: 0.9 };
    const alive4 = { v: c.short || c.reduce ? 4 : 0 };
    const arrowG = new Graphics();
    c.fg.addChild(arrowG);
    const head = prepHead(c, '¡AIRE!', { fontFamily: F.comic, fontSize: 190, fill: 0xffffff, letterSpacing: 6, stroke: { color: 0x1a3a6a, width: 16, join: 'round' }, dropShadow: { color: SAFFRON, distance: 9, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…ya merito los cuatro.',
      asideStyle: { fill: 0xffd23f, stroke: { color: 0x1a3a6a, width: 8, join: 'round' } },
      at: [400, 690],
    });
    S.set(c, { ring, alive4, head, spin });
    const cx = W / 2;
    const cy = c.catY + 30;
    let last = 0;
    const frame = (t: number) => {
      if (eb.destroyed) return;
      const dt = Math.min(0.1, t - last);
      last = t;
      ring.v += dt * ring.speed;
      spin.rotation = -t * 0.12;
      cl.x = Math.sin(t * 0.6) * 12;
      eb.clear();
      ef.clear();
      for (let i = 0; i < alive4.v; i++) {
        const a = ring.v + (i / 4) * Math.PI * 2;
        const x = cx + Math.cos(a) * 470;
        const y = cy + Math.sin(a) * 170;
        const s = 60 + Math.sin(a) * 14;
        FOUR[i](Math.sin(a) < 0 ? eb : ef, x, y, s, t);
      }
    };
    frame(0.2);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // prepared words
    const fiu = prepWord(c.fg, 470, 300, '¡FIUUU!', 0xffffff, 96, -0.1);
    const muu = prepWord(c.fg, 1200, 150, '¡MUUU!', 0xfff2c8, 70, 0.08);
    const four = prepWord(c.fg, 470, 560, '¡CUATRO EN UNO!', SAFFRON, 96, -0.08);
    // a gust: long white streaks across
    sfx('whoosh', 0.7);
    beat(c, 0.1, () => {
      show(c, fiu, 0.6, { from: 1.8 });
      const g = new Graphics();
      const r = rnd(4);
      for (let i = 0; i < 12; i++) {
        const y = 120 + r() * 800;
        const x = r() * W;
        g.poly(streak(x - 300, y, x + 300, y - 30, 1, 6)).fill({ color: 0xffffff, alpha: 0.7 });
      }
      c.fg.addChild(g);
      if (!c.reduce) gsap.fromTo(g, { x: 500 }, { x: -700, duration: 0.6, ease: 'power1.in' });
      fadeKill(g, 0.35, 0.25);
    });
    // the four arrive one by one
    const notes: [string, number][] = [
      ['splash', 1.3],
      ['hit', 0.6],
      ['charge', 1.6],
      ['whoosh', 1.8],
    ];
    for (let i = 0; i < 4; i++)
      beat(c, 0.3 + i * 0.2, () => {
        alive4.v = i + 1;
        sfx(notes[i][0] as 'splash', notes[i][1]);
        if (c.reduce) frame(0.2);
        const a = ring.v + (i / 4) * Math.PI * 2;
        const sp = new Graphics().poly(twinkle(0, 0, 60)).fill(0xffffff);
        sp.position.set(cx + Math.cos(a) * 470, cy + Math.sin(a) * 170);
        c.fg.addChild(sp);
        if (!c.reduce) gsap.fromTo(sp.scale, { x: 0.2, y: 0.2 }, { x: 1.3, y: 1.3, duration: 0.2 });
        fadeKill(sp, 0.1, 0.2);
      });
    beat(c, 1.1, () => gsap.to(ring, { speed: 2.6, duration: 0.5 }));
    // the bison drifts across like a cloud
    if (!c.reduce) gsap.to(bis, { x: -420, y: 210, duration: 3.2, delay: 0.5, ease: 'none' });
    else bis.position.set(W - 380, 230);
    beat(c, 1.3, () => {
      sfx('meow', 0.45);
      show(c, muu, 0.6, { from: 1.6, drift: 30 });
    });
    // the arrow lights up
    const [ax0, ay0] = onCat(c, 0.49, 0.12);
    const [ax1, ay1] = onCat(c, 0.49, 0.28);
    beat(c, 1.55, () => {
      sfx('gem', 1.2);
      sfx('reveal', 1.4);
      c.shaker.add(0.15);
      const p = { v: 0 };
      if (c.reduce) arrowMark(arrowG, ax0, ay0, ax1, ay1, 1);
      else gsap.to(p, { v: 1, duration: 0.2, onUpdate: () => !arrowG.destroyed && arrowMark(arrowG, ax0, ay0, ax1, ay1, p.v) });
      const rg = new Graphics().poly(ngon(0, 0, 80, 80, 28)).stroke({ width: 8, color: 0x9fd8ff });
      rg.position.set(ax1, ay1 - 40);
      c.fg.addChild(rg);
      if (!c.reduce) gsap.fromTo(rg.scale, { x: 0.3, y: 0.3 }, { x: 3, y: 3, duration: 0.5, ease: 'power2.out' });
      fadeKill(rg, 0.2, 0.3);
      show(c, four, 0.75, { from: 2 });
    });
    later(c, 3.4, () => {
      if (arrowG.destroyed) return;
      gsap.to(arrowG, { alpha: 0, duration: 0.4 });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.1);
    sfx('whoosh', 0.8);
    c.shaker.add(0.3);
    flashOf(c, 0xffffff, 0.4, 0.3);
    if (st) {
      // the four fly into him
      gsap.killTweensOf(st.ring);
      if (c.reduce || c.short) st.alive4.v = 0;
      else {
        st.ring.speed = 6;
        later(c, 0.25, () => (st.alive4.v = 0));
      }
    }
    // a whirlwind bursts out of him in rings
    if (!c.reduce)
      for (let i = 0; i < 4; i++)
        later(c, 0.2 + i * 0.12, () => {
          const g = new Graphics().poly(band(spiralPts(0, 0, 40, 200, 1.2, 30, i), 3, 22)).fill({ color: 0xffffff, alpha: 0.75 });
          g.position.set(W / 2, c.catY + 40);
          g.scale.y = 0.5;
          c.fg.addChild(g);
          gsap.to(g.scale, { x: 4.5, y: 2.2, duration: 0.7, ease: 'power2.out' });
          gsap.to(g, { rotation: -3, duration: 0.7 });
          gsap.to(g, { alpha: 0, delay: 0.35, duration: 0.35, onComplete: () => destroyTree(g) });
        });
    burst(c, c.fg, (i) => {
      const g = new Graphics();
      FOUR[i % 4](g, 0, 0, 22, 0);
      return g;
    }, 16, W / 2, c.catY, 900, 1.4);
    showHead(c, st?.head, { dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const sky = vgrad(new Graphics(), 0, 0, w, h, SKY, 14);
    const spin = new Container();
    spin.position.set(w / 2, h * 0.5);
    const ag = new Graphics();
    arms(ag, Math.hypot(w, h) * 0.75, s * 1.3);
    spin.addChild(ag);
    const pk = new Graphics();
    peaks(pk, w, h, s * 1.1, w / 2, 8);
    const cl = new Graphics();
    const nc = w > h * 2 ? 6 : 2;
    for (let i = 0; i < nc; i++) curlCloud(cl, ((i + 0.5) / nc) * w + (i === 0 && nc === 2 ? -m * 0.1 : 0), h * (0.14 + (i % 2) * 0.12), m * 0.1, i % 2 ? -1 : 1);
    const bis = bison(s * 0.6);
    bis.position.set(w > h * 2 ? w / 2 + m * 0.95 : w * 0.78, h * 0.2);
    const e = new Graphics();
    const draw4 = (t: number) => {
      e.clear();
      for (let i = 0; i < 4; i++) {
        const a = Math.PI + (i / 3) * Math.PI + Math.sin(t * 0.8 + i) * 0.05;
        const x = w / 2 + Math.cos(a) * m * 0.44;
        const y = h * 0.5 + Math.sin(a) * m * 0.38 * 0.6;
        FOUR[i](e, x, y + Math.sin(t * 2 + i) * 4 * s, m * 0.05, t);
      }
    };
    draw4(0.3);
    k.addChild(sky, spin, pk, cl, bis, e);
    if (live)
      liveLoop(k, (t) => {
        spin.rotation = -t * 0.1;
        draw4(0.3 + t);
        bis.y = h * 0.2 + Math.sin(t * 1.2) * 8 * s;
      });
    return k;
  },
};
