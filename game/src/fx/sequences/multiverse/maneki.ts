/**
 * Maneki, the box concierge: the luck universe (the beckoning cat of Japanese folklore). A red lacquer box office with a
 * wave pattern in gold, paper lanterns lighting up one by one, shelves full of little beckoning cats that wave all
 * together on the beat, a giant gold koban that spins in behind her, and coins raining on the counter. «¡PASE, PASE!»
 * Payoff: ¡SUERTE! — stamped with her seal: NADA ES GRATIS.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, CHEER, burst, cover, drizzle, every, fall, later, word } from './kit';
import { fadeKill, liveLoop, stash } from './kitB';

const RED = 0xc8102e;
const DEEP = 0x8a0a1e;
const GOLD = 0xf5c542;
const GOLD_D = 0xb8862a;
const GOLD_L = 0xffe9a0;
const WHITE = 0xfff8ee;
const COUNTER = 860;
const BEAT = 0.36;

/** points on a circle of radius r around (x,y), from angle a0 to a1 in n steps */
function ring(x: number, y: number, r: number, a0: number, a1: number, n: number): number[] {
  const p: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    p.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  return p;
}

/**
 * red lacquer with the wave pattern (seigaiha) in deep red and gold. Coarse polygons, not circle()/arc(): Pixi
 * tessellates those by radius, and the detail page's full-width backdrop came to ~114k vertices in one Graphics (Pixi's
 * pooled batchers grow to the biggest Graphics and never shrink); at these sizes 16 sides read as round.
 */
function lacquer(w: number, h: number, r: number): Graphics {
  const g = new Graphics().rect(0, 0, w, h).fill(RED);
  const lw1 = Math.max(1, r * 0.06);
  const lw2 = Math.max(1, r * 0.05);
  let row = 0;
  for (let y = 0; y < h + r; y += r / 2, row++)
    for (let x = row % 2 ? r : 0; x < w + r; x += r * 2) {
      g.poly(ring(x, y, r, 0, Math.PI * 2, 16)).fill(row % 2 ? 0xb00c26 : RED);
      g.poly(ring(x, y, r * 0.5, Math.PI, Math.PI * 2, 6), false).stroke({ width: lw1, color: DEEP, alpha: 0.55 });
      g.poly(ring(x, y, r * 0.8, Math.PI, Math.PI * 2, 8), false).stroke({ width: lw2, color: GOLD, alpha: 0.35 });
    }
  return g;
}

/** a paper lantern (origin at its hook) with its glow */
function lantern(s = 1): { k: Container; glow: Graphics; body: Graphics } {
  const k = new Container();
  const glow = new Graphics().circle(0, 70 * s, 110 * s).fill({ color: 0xffb45a, alpha: 0.12 }).circle(0, 70 * s, 70 * s).fill({ color: 0xffd08a, alpha: 0.16 });
  glow.blendMode = 'add';
  const body = new Graphics();
  body.moveTo(0, 0).lineTo(0, 14 * s).stroke({ width: 3 * s, color: C.ink });
  body.ellipse(0, 70 * s, 46 * s, 58 * s).fill(0xd7262e).stroke({ width: 4 * s, color: C.ink });
  for (let i = -3; i <= 3; i++) body.ellipse(0, 70 * s + i * 14 * s, 46 * s * Math.sqrt(1 - (i / 4.1) ** 2), 3 * s).fill({ color: DEEP, alpha: 0.5 });
  body.ellipse(-14 * s, 56 * s, 10 * s, 26 * s).fill({ color: 0xffffff, alpha: 0.18 });
  body.rect(-24 * s, 12 * s, 48 * s, 10 * s).fill(C.ink).rect(-24 * s, 118 * s, 48 * s, 10 * s).fill(C.ink);
  for (let i = -2; i <= 2; i++) body.moveTo(i * 4 * s, 128 * s).lineTo(i * 5 * s, 160 * s).stroke({ width: 3 * s, color: GOLD });
  k.addChild(glow, body);
  return { k, glow, body };
}

/** a little beckoning cat (origin at its base), its raised paw on its own so it can wave */
function figurine(i: number, s = 1): { k: Container; paw: Graphics } {
  const k = new Container();
  const g = new Graphics();
  g.ellipse(0, -40 * s, 34 * s, 40 * s).fill(WHITE).stroke({ width: 3 * s, color: C.ink });
  g.ellipse(-12 * s, -30 * s, 12 * s, 9 * s).fill(GOLD).stroke({ width: 2 * s, color: C.ink });
  g.poly([-26 * s, -112 * s, -22 * s, -138 * s, -6 * s, -120 * s]).fill(WHITE).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.poly([26 * s, -112 * s, 22 * s, -138 * s, 6 * s, -120 * s]).fill(WHITE).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.poly([-21 * s, -116 * s, -20 * s, -130 * s, -11 * s, -120 * s]).fill(0xf4a0b0);
  g.circle(0, -96 * s, 30 * s).fill(WHITE).stroke({ width: 3 * s, color: C.ink });
  if (i % 3 !== 2) g.circle(-16 * s, -110 * s, 11 * s).fill(i % 2 ? 0xf08a2a : 0x2a2a2a);
  g.arc(-11 * s, -96 * s, 6 * s, Math.PI * 0.15, Math.PI * 0.85).stroke({ width: 2.5 * s, color: C.ink });
  g.arc(11 * s, -96 * s, 6 * s, Math.PI * 0.15, Math.PI * 0.85).stroke({ width: 2.5 * s, color: C.ink });
  g.poly([-3 * s, -88 * s, 3 * s, -88 * s, 0, -84 * s]).fill(0xf4a0b0);
  g.moveTo(-30 * s, -84 * s).lineTo(-14 * s, -86 * s).moveTo(30 * s, -84 * s).lineTo(14 * s, -86 * s).stroke({ width: 1.5 * s, color: C.ink });
  g.rect(-24 * s, -70 * s, 48 * s, 7 * s).fill(RED).circle(0, -60 * s, 7 * s).fill(GOLD).stroke({ width: 2 * s, color: C.ink });
  const paw = new Graphics().roundRect(-9 * s, -42 * s, 18 * s, 44 * s, 9 * s).fill(WHITE).stroke({ width: 3 * s, color: C.ink }).circle(0, -32 * s, 5 * s).fill(0xf4a0b0);
  paw.position.set(24 * s, -66 * s);
  paw.rotation = 0.2;
  k.addChild(g, paw);
  return { k, paw };
}

/** a koban: the oval gold coin (with ridges and stamps); w×h */
function koban(w: number, h: number): Graphics {
  const g = new Graphics();
  g.ellipse(0, 0, w / 2, h / 2).fill(GOLD_D).stroke({ width: Math.max(2, w * 0.03), color: C.ink });
  g.ellipse(0, 0, w * 0.44, h * 0.44).fill(GOLD);
  g.ellipse(-w * 0.08, -h * 0.1, w * 0.26, h * 0.3).fill({ color: GOLD_L, alpha: 0.45 });
  for (let i = -5; i <= 5; i++) {
    const y = (i / 6) * h * 0.3;
    const hw = w * 0.4 * Math.sqrt(1 - (y / (h * 0.44)) ** 2);
    g.moveTo(-hw * 0.8, y).lineTo(hw * 0.8, y).stroke({ width: Math.max(1, w * 0.012), color: GOLD_D, alpha: 0.6 });
  }
  // the stamped cartouches, top and bottom
  for (const y of [-0.36, 0.36]) g.roundRect(-w * 0.17, h * y - h * 0.032, w * 0.34, h * 0.064, h * 0.03).fill(GOLD_D).stroke({ width: Math.max(1, w * 0.008), color: 0x8a5a1a });
  return g;
}

/** a round coin with a square hole */
function mon(r: number): Graphics {
  return new Graphics().circle(0, 0, r).fill(GOLD).stroke({ width: Math.max(2, r * 0.12), color: C.ink }).rect(-r * 0.3, -r * 0.3, r * 0.6, r * 0.6).fill(RED).stroke({ width: Math.max(1, r * 0.08), color: C.ink });
}

/** the box office counter, with a desk bell, keys and a stack of coins */
function counter(): Graphics {
  const g = new Graphics();
  g.rect(0, COUNTER, W, H - COUNTER).fill(0x3a1a0e).rect(0, COUNTER, W, 18).fill(0x5a2a14).rect(0, COUNTER + 18, W, 6).fill(GOLD_D);
  for (let x = 60; x < W; x += 240) g.rect(x, COUNTER + 50, 200, 150).stroke({ width: 4, color: 0x24100a });
  // a desk bell
  g.ellipse(1640, COUNTER + 2, 60, 12).fill(0x4a4a4a).moveTo(1585, COUNTER).quadraticCurveTo(1640, COUNTER - 90, 1695, COUNTER).fill(GOLD).stroke({ width: 4, color: C.ink }).circle(1640, COUNTER - 52, 8).fill(C.ink);
  // a stack of coins
  for (let i = 0; i < 6; i++) g.ellipse(260, COUNTER + 4 - i * 12, 46, 14).fill(i % 2 ? GOLD : GOLD_D).stroke({ width: 3, color: C.ink });
  return g;
}

interface St {
  paws: Graphics[];
  raise: { v: number };
  big: Container;
  kick: (a: number) => void;
}
const S = stash<St>();

export const maneki: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO FORTUNA',
  open(c: SigCtx) {
    const k = new Container();
    k.addChild(cover(RED), lacquer(W, COUNTER, 76));
    // shelves of beckoning cats on both sides
    const paws: Graphics[] = [];
    const shelf = new Graphics();
    let n = 0;
    for (const [x0, x1] of [
      [50, 470],
      [1450, 1870],
    ])
      for (const y of [470, 650, 830]) {
        shelf.rect(x0 - 10, y, x1 - x0 + 20, 16).fill(0x5a2a14).stroke({ width: 3, color: C.ink });
        for (let i = 0; i < 4; i++) {
          const f = figurine(n++, 0.95);
          f.k.position.set(x0 + 50 + i * ((x1 - x0 - 100) / 3), y);
          k.addChild(f.k);
          paws.push(f.paw);
        }
      }
    k.addChildAt(shelf, 2);
    k.addChild(counter());
    // lanterns along the top
    const lanterns = Array.from({ length: 8 }, (_, i) => {
      const l = lantern(0.9);
      l.k.position.set(120 + i * 240, 6 + (i % 2) * 14);
      k.addChild(l.k);
      return { ...l, ph: i * 0.9 };
    });
    const rope = new Graphics().moveTo(0, 8).quadraticCurveTo(W / 2, 40, W, 8).stroke({ width: 4, color: C.ink });
    k.addChildAt(rope, k.children.indexOf(lanterns[0].k));
    c.back.addChild(k);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.2 });
    // the giant koban behind her
    const big = new Container();
    big.addChild(koban(560, 720));
    big.position.set(W / 2, c.CY);
    c.behind.addChild(big);
    const raise = { v: 0 };
    let swing = 0.04;
    const kick = (a: number) => (swing = Math.max(swing, a));
    S.set(c, { paws, raise, big, kick });
    if (!c.reduce) {
      const t0 = performance.now();
      every(c, 30, (t) => {
        swing += (0.04 - swing) * 0.03;
        lanterns.forEach((l) => !l.k.destroyed && (l.k.rotation = swing * Math.sin(t * 1.8 + l.ph)));
        // all the little cats beckon together, on the beat
        const ph = (((performance.now() - t0) / 1000) % BEAT) / BEAT;
        const beck = Math.sin(ph * Math.PI) * 0.9;
        raise.v *= 0.95;
        for (const p of paws) if (!p.destroyed) p.rotation = 0.2 + beck - raise.v * 1.4;
      });
    }
    if (c.short) return;

    // lights: lanterns on, one by one; the koban spins in
    lanterns.forEach((l, i) => {
      l.glow.alpha = 0;
      l.body.tint = 0x777777;
      later(c, 0.08 + i * 0.07, () => {
        if (l.glow.destroyed) return;
        l.glow.alpha = 1;
        l.body.tint = 0xffffff;
        sfx('tick', 1.6 + i * 0.12);
      });
    });
    if (!c.reduce) {
      k.alpha = 0.4;
      gsap.to(k, { alpha: 1, duration: 0.5 });
      const sp = { a: 0 };
      gsap.fromTo(big, { y: c.CY - 700 }, { y: c.CY, duration: 0.5, ease: 'back.out(1.4)' });
      gsap.to(sp, {
        a: Math.PI * 4,
        duration: 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          if (!big.destroyed) big.scale.x = Math.cos(sp.a);
        },
      });
    }
    later(c, 0.5, () => {
      sfx('coin', 0.7);
      sfx('boom', 0.9);
      c.shaker.add(0.2);
    });
    // coins rain on the counter, with a crescendo of chimes
    fall(c, c.back, (i) => (i % 3 ? koban(34, 48) : mon(20)), { n: 22, over: 1.6, dur: 1.2, bounce: true, spin: 4 });
    fall(c, c.fg, (i) => (i % 2 ? koban(46, 64) : mon(28)), { n: 8, over: 1.4, dur: 1.0, spin: 5 });
    for (let i = 0; i < 10; i++) later(c, 0.7 + i * 0.12, () => sfx('coin', 0.8 + i * 0.06));
    for (let i = 0; i < 6; i++) later(c, 0.2 + i * BEAT, () => sfx('gem', 2.2));
    later(c, 0.95, () => word(c, 440, 250, '¡PASE, PASE!', GOLD, 96, 1.1));
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('fanfare', 1.2);
    for (let i = 0; i < 8; i++) later(c, i * 0.07, () => sfx('coin', 0.9 + i * 0.08));
    c.shaker.add(0.35);
    if (st) {
      st.raise.v = 1;
      st.kick(0.3);
      if (!c.reduce && !st.big.destroyed) {
        const sp = { a: 0 };
        gsap.to(sp, { a: Math.PI * 2, duration: 0.6, ease: 'power2.inOut', onUpdate: () => !st.big.destroyed && (st.big.scale.x = Math.cos(sp.a)) });
      }
    }
    burst(c, c.fg, (i) => (i % 2 ? koban(44, 60) : mon(24)), 22, W / 2, c.catY, 860, 1.3);
    // ¡SUERTE!, with a red shadow and her seal
    const k = new Container();
    const sh = txt('¡SUERTE!', { fontFamily: F.heavy, fontSize: 138, fill: RED, stroke: { color: C.ink, width: 14, join: 'round' } });
    const t = txt('¡SUERTE!', { fontFamily: F.heavy, fontSize: 138, fill: GOLD, stroke: { color: C.ink, width: 14, join: 'round' } });
    for (const x of [sh, t]) x.anchor.set(0.5);
    sh.position.set(10, 10);
    k.addChild(sh, t);
    if (k.width > 760) k.scale.set(760 / k.width);
    const s0 = k.scale.x;
    k.position.set(CHEER[0], CHEER[1]);
    k.rotation = -0.05;
    c.fg.addChild(k);
    gsap.fromTo(k.scale, { x: s0 * 2, y: s0 * 2 }, { x: s0, y: s0, duration: 0.2, ease: 'back.out(3)' });
    fadeKill(k, 2.3, 0.5);
    // glints on the word
    if (!c.reduce)
      for (let i = 0; i < 6; i++)
        later(c, 0.2 + i * 0.22, () => {
          const g = new Graphics().poly([0, -26, 6, -6, 26, 0, 6, 6, 0, 26, -6, 6, -26, 0, -6, -6]).fill(0xffffff);
          g.position.set(CHEER[0] + (Math.random() - 0.5) * 600 * s0, CHEER[1] + (Math.random() - 0.5) * 100);
          c.fg.addChild(g);
          gsap.fromTo(g.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.15, yoyo: true, repeat: 1, onComplete: () => destroyTree(g) });
        });
    // the seal: NADA ES GRATIS
    later(c, 0.5, () => {
      const seal = new Container();
      const g = new Graphics().roundRect(-92, -78, 184, 156, 16).fill({ color: 0xfff1e0, alpha: 0.9 }).stroke({ width: 8, color: RED }).roundRect(-80, -66, 160, 132, 10).stroke({ width: 3, color: RED });
      const st1 = txt('NADA ES\nGRATIS', { fontFamily: F.heavy, fontSize: 38, fill: RED, align: 'center', lineHeight: 46 });
      st1.anchor.set(0.5);
      seal.addChild(g, st1);
      seal.position.set(200, 492);
      seal.rotation = -0.16;
      c.fg.addChild(seal);
      sfx('hit', 0.7);
      if (!c.reduce) gsap.fromTo(seal.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.14, ease: 'back.out(2)' });
      fadeKill(seal, 1.9, 0.4);
    });
    drizzle(c, c.back, () => (Math.random() < 0.6 ? koban(30, 42) : mon(18)), 0.32, 3.2);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.min(w, h) / 300;
    k.addChild(lacquer(w, h, 26 * u));
    const big = koban(Math.min(w, h) * 0.78, Math.min(w, h) * 1.0);
    big.position.set(w / 2, h * 0.54);
    const ls = [0.12, 0.38, 0.62, 0.88].map((x, i) => {
      const l = lantern(0.32 * u);
      l.k.position.set(x * w, i % 2 ? 4 * u : 0);
      return l.k;
    });
    const figs = [figurine(0, 0.5 * u), figurine(1, 0.5 * u)];
    figs[0].k.position.set(w * 0.12, h * 0.96);
    figs[1].k.position.set(w * 0.88, h * 0.96);
    const coins = new Graphics();
    for (let i = 0; i < 5; i++) coins.ellipse(w * (0.25 + i * 0.12), h * 0.97, 12 * u, 5 * u).fill(i % 2 ? GOLD : GOLD_D).stroke({ width: 1.5 * u, color: C.ink });
    k.addChild(big, ...ls, coins, figs[0].k, figs[1].k);
    if (live)
      liveLoop(k, 30, (t) => {
        ls.forEach((l, i) => (l.rotation = 0.06 * Math.sin(t * 1.8 + i)));
        const beck = Math.sin(((t % BEAT) / BEAT) * Math.PI) * 0.9;
        figs.forEach((f) => (f.paw.rotation = 0.2 + beck));
      });
    return k;
  },
};
