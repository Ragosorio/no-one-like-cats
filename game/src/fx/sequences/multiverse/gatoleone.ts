/**
 * Don Gatoleone: the family universe (the classic mob saga, evoked). The don's study, almost black: wood panels with
 * a gold rule, shelves of books, one lamp hanging over him (the light from above, the eyes in shadow). The blinds open
 * slat by slat onto the bright garden outside, where the wedding goes on — a white tent, string lights, couples
 * dancing to a far-off tarantella. A red rose falls slowly through the lamplight, an orange rolls off the bowl on the
 * desk, and an envelope slides across to him: UNA OFERTA.
 * Payoff: the blinds snap shut, the room keeps only its lamp, the rose lands and loses its petals; «Es solo negocio.»
 * (…con todo respeto)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, cover, every, later, score } from './kit';
import { cardLoop, hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { beat, ell, glowDisc, headline, pay, smooth } from './kitC';

const DARK = 0x0d0907;
const PANEL = [0x24160d, 0x2c1b10];
const GOLD = 0xd9b24c;
const LAMP = 0xffc870;
const ROSE = 0xc8102e;
const ORANGE = 0xf28c28;
const DESK = 0x3a1a0e;

/** the study's back wall: dark panels with a gold rule and a bookcase (spans w; scaled by u) */
function study(w: number, h: number, u: number) {
  const g = new Graphics().rect(0, 0, w, h).fill(DARK);
  const pw = 240 * u;
  for (let x = 0, i = 0; x < w; x += pw, i++) {
    g.rect(x + 14 * u, 90 * u, pw - 28 * u, 380 * u).fill(PANEL[i % 2]).stroke({ width: 3 * u, color: 0x4a3018 });
    g.rect(x + 14 * u, 500 * u, pw - 28 * u, 280 * u).fill(PANEL[(i + 1) % 2]).stroke({ width: 3 * u, color: 0x4a3018 });
  }
  g.rect(0, 476 * u, w, 10 * u).fill(GOLD).rect(0, 486 * u, w, 4 * u).fill(0x6a4a14);
  g.rect(0, 70 * u, w, 12 * u).fill(0x3a2412);
  return g;
}

/** a bookcase (origin at its top-left, 420×640 at s = 1) */
function bookcase(g: Graphics, x: number, y: number, s: number, seed: number) {
  g.rect(x, y, 420 * s, 640 * s).fill(0x1e120a).stroke({ width: 6 * s, color: 0x3a2412 });
  const r = rng(seed);
  const cols = [0x5a1a14, 0x1e3a2a, 0x2a2a4a, 0x6a4a1e, 0x3a1a2a, 0x4a3a2a];
  for (let row = 0; row < 5; row++) {
    const sy = y + (20 + row * 124) * s;
    g.rect(x + 10 * s, sy + 100 * s, 400 * s, 10 * s).fill(0x3a2412);
    let bx = x + 16 * s;
    while (bx < x + 400 * s) {
      const bw = (18 + r() * 18) * s;
      const bh = (70 + r() * 28) * s;
      if (bx + bw > x + 404 * s) break;
      g.rect(bx, sy + 100 * s - bh, bw, bh).fill(cols[Math.floor(r() * cols.length)]);
      g.rect(bx, sy + 100 * s - bh * 0.8, bw, 3 * s).fill({ color: GOLD, alpha: 0.7 });
      bx += bw + 2 * s;
    }
  }
}

/** the garden wedding outside (drawn in window space x0..x1, y0..y1): sky, trees, the tent, string lights, couples */
function garden(x0: number, y0: number, ww: number, wh: number, u: number) {
  const k = new Container();
  const g = new Graphics();
  vgrad(g, x0, y0, ww, wh, [0xfbe9b8, 0xf6d898, 0xe8c27a], 10);
  const r = rng(4);
  for (let i = 0; i < 6; i++) g.poly(ell(x0 + r() * ww, y0 + wh * (0.42 + r() * 0.1), (50 + r() * 40) * u, (40 + r() * 20) * u, 14)).fill(0x6a8a3a);
  g.rect(x0, y0 + wh * 0.6, ww, wh * 0.4).fill(0x8aaa4a);
  // the white tent with its scalloped edge
  const tx = x0 + ww * 0.55;
  const ty = y0 + wh * 0.36;
  g.poly([tx - 160 * u, ty + 40 * u, tx, ty - 50 * u, tx + 160 * u, ty + 40 * u]).fill(0xfffaf0).stroke({ width: 2 * u, color: 0xc8b890 });
  const sc: number[] = [tx - 160 * u, ty + 40 * u];
  for (let i = 0; i <= 8; i++) sc.push(tx - 160 * u + i * 40 * u, ty + (i % 2 ? 56 : 40) * u);
  g.poly([...sc, tx + 160 * u, ty + 40 * u]).fill(0xfffaf0);
  g.rect(tx - 150 * u, ty + 50 * u, 6 * u, 90 * u).fill(0xe8e0d0).rect(tx + 144 * u, ty + 50 * u, 6 * u, 90 * u).fill(0xe8e0d0);
  const lights = new Graphics();
  for (let j = 0; j < 2; j++) {
    const yy = y0 + wh * (0.18 + j * 0.12);
    lights.moveTo(x0, yy).quadraticCurveTo(x0 + ww / 2, yy + 30 * u, x0 + ww, yy).stroke({ width: 1.5 * u, color: 0x5a4a2a });
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      lights.poly(ell(x0 + t * ww, yy + 4 * t * (1 - t) * 15 * u + 6 * u, 4 * u, 5 * u, 6)).fill(i % 3 === 0 ? 0xff8a6a : 0xfff2a8);
    }
  }
  // the couples dancing (little figures that bob)
  const dancers: Graphics[] = [];
  const cols = [0xc8102e, 0x2a2a2a, 0xf2f2f2, 0x3a6aa8, 0xe8a03a, 0x2a2a2a];
  for (let i = 0; i < 7; i++) {
    const d = new Graphics();
    const col = cols[i % cols.length];
    d.poly([-12 * u, 0, 12 * u, 0, 8 * u, -44 * u, -8 * u, -44 * u]).fill(col).poly(ell(0, -54 * u, 8 * u, 8 * u, 8)).fill(0x3a2a1a);
    d.position.set(x0 + ww * (0.08 + i * 0.13), y0 + wh * (0.88 + (i % 2) * 0.06));
    dancers.push(d);
  }
  k.addChild(g, lights, ...dancers);
  return { k, dancers, lights };
}

/** the window: frame, garden behind, venetian slats that open (k 0 closed → 1 open) */
function blindsWindow(x: number, y: number, ww: number, wh: number, u: number) {
  const k = new Container();
  const gd = garden(x, y, ww, wh, u);
  const mask = new Graphics().rect(x, y, ww, wh).fill(0xffffff);
  gd.k.mask = mask;
  const slats = new Graphics();
  const n = 16;
  const draw = (open: number) => {
    if (slats.destroyed) return;
    slats.clear();
    const sh = wh / n;
    for (let i = 0; i < n; i++) {
      const o = Math.max(0, Math.min(1, open * 1.3 - (i / n) * 0.3));
      const th = sh * (1 - o * 0.82);
      slats.rect(x, y + i * sh, ww, th).fill(0xc8a46a).rect(x, y + i * sh + th - 2 * u, ww, 2 * u).fill(0x6a4a24);
    }
    slats.rect(x + ww * 0.3, y, 3 * u, wh).fill(0xe8d8b0).rect(x + ww * 0.7, y, 3 * u, wh).fill(0xe8d8b0);
  };
  const frame = new Graphics().rect(x - 18 * u, y - 18 * u, ww + 36 * u, wh + 36 * u).stroke({ width: 18 * u, color: 0x3a2412 }).rect(x - 26 * u, y + wh + 14 * u, ww + 52 * u, 16 * u).fill(0x4a3018);
  k.addChild(gd.k, mask, slats, frame);
  return { k, draw, gd };
}

/** the light falling through the blinds onto the room: gold stripes (k = how open) */
function stripes(g: Graphics, x0: number, y0: number, wh: number, open: number, u: number) {
  g.clear();
  if (open <= 0.02) return;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const y = y0 + (i / n) * wh;
    g.poly([x0, y, x0, y + (wh / n) * 0.5 * open, x0 + 900 * u, y + 520 * u + (wh / n) * 0.9 * open, x0 + 900 * u, y + 520 * u]).fill({ color: LAMP, alpha: 0.08 });
  }
}

/** the hanging lamp and its cone of light (origin at the ceiling) */
function lamp(u: number, coneH: number) {
  const k = new Container();
  const cone = new Graphics().poly([-60 * u, 150 * u, 60 * u, 150 * u, 420 * u, coneH, -420 * u, coneH]).fill({ color: LAMP, alpha: 0.13 });
  cone.blendMode = 'add';
  const pool = glowDisc(340 * u, LAMP, 0.35, 8, 28);
  pool.position.set(0, coneH * 0.62);
  pool.blendMode = 'add';
  const g = new Graphics().rect(-2 * u, 0, 4 * u, 100 * u).fill(0x1a1a1a);
  g.poly([-70 * u, 150 * u, 70 * u, 150 * u, 30 * u, 96 * u, -30 * u, 96 * u]).fill(0x1e2a1e).stroke({ width: 3 * u, color: 0x0a0a0a });
  g.poly(ell(0, 150 * u, 70 * u, 10 * u, 16)).fill(0xfff2c8);
  k.addChild(cone, pool, g);
  return { k, cone, pool };
}

/** a red rose (origin at the bloom) */
function rose(s = 1) {
  const g = new Graphics();
  g.moveTo(0, 10 * s).quadraticCurveTo(-10 * s, 70 * s, 6 * s, 130 * s).stroke({ width: 5 * s, color: 0x2a5a1a });
  g.poly(smooth([-4 * s, 60 * s, -34 * s, 50 * s, -40 * s, 70 * s, -8 * s, 76 * s], 3)).fill(0x3a7a2a);
  g.poly(ell(0, 0, 26 * s, 22 * s, 14)).fill(ROSE).stroke({ width: 2.5 * s, color: 0x5a0614 });
  g.poly(smooth([-18 * s, -4 * s, -6 * s, -18 * s, 10 * s, -14 * s, 14 * s, 4 * s, 0, 10 * s, -10 * s, 6 * s], 3)).fill(0xe0283a).stroke({ width: 2 * s, color: 0x5a0614 });
  g.poly(smooth([-6 * s, -6 * s, 4 * s, -10 * s, 6 * s, 0, -2 * s, 4 * s], 2)).fill(0x8a0a1e);
  return g;
}

/** the envelope with its red wax seal (origin at its center) */
function envelope() {
  const k = new Container();
  const g = new Graphics().rect(-110, -60, 220, 120).fill(0xf2e8d0).stroke({ width: 3, color: 0x6a5030 });
  g.moveTo(-110, -60).lineTo(0, 10).lineTo(110, -60).stroke({ width: 3, color: 0x8a7050 });
  const seal = new Graphics().poly(smooth([0, -22, 18, -14, 22, 4, 10, 20, -10, 20, -22, 4, -18, -14], 3)).fill(ROSE).stroke({ width: 2, color: 0x5a0614 });
  seal.poly(ell(0, 0, 10, 10, 10)).stroke({ width: 2, color: 0x8a0a1e });
  seal.position.set(0, 10);
  const t = txt('UNA OFERTA', { fontFamily: F.serif, fontWeight: '700', fontSize: 22, fill: 0x3a2a1a, letterSpacing: 2 });
  t.anchor.set(0.5);
  t.position.set(0, -38);
  k.addChild(g, t, seal);
  return { k, seal };
}

/** the desk across the bottom: mahogany with a gold inlay; the bowl of oranges, a glass of red (spans w) */
function desk(w: number, top: number, h: number, u: number) {
  const g = new Graphics();
  g.rect(w / 2 - 700 * u, top, 1400 * u, h - top).fill(DESK).stroke({ width: 4 * u, color: 0x120804 });
  g.rect(w / 2 - 700 * u, top, 1400 * u, 18 * u).fill(0x5a2a14).rect(w / 2 - 690 * u, top + 40 * u, 1380 * u, 4 * u).fill(GOLD);
  // the bowl of oranges
  const bx = w / 2 - 470 * u;
  g.poly([bx - 90 * u, top - 30 * u, bx + 90 * u, top - 30 * u, bx + 60 * u, top + 4 * u, bx - 60 * u, top + 4 * u]).fill(0xc8c0b0).stroke({ width: 3 * u, color: 0x5a5040 });
  for (const [ox, oy] of [
    [-50, -50],
    [0, -56],
    [50, -50],
    [-24, -84],
    [26, -82],
  ])
    g.poly(ell(bx + ox * u, top + oy * u, 26 * u, 25 * u, 14)).fill(ORANGE).stroke({ width: 2.5 * u, color: 0x8a4a10 }).poly(ell(bx + (ox - 8) * u, top + (oy - 8) * u, 7 * u, 5 * u, 8)).fill({ color: 0xffffff, alpha: 0.4 });
  // a glass of red
  const gx = w / 2 + 470 * u;
  g.poly([gx - 26 * u, top - 120 * u, gx + 26 * u, top - 120 * u, gx + 20 * u, top - 70 * u, gx - 20 * u, top - 70 * u]).fill({ color: 0xe8f0f0, alpha: 0.3 }).stroke({ width: 2 * u, color: 0xe8f0f0, alpha: 0.6 });
  g.poly([gx - 22 * u, top - 100 * u, gx + 22 * u, top - 100 * u, gx + 20 * u, top - 72 * u, gx - 20 * u, top - 72 * u]).fill(0x7a0a1e);
  g.rect(gx - 2 * u, top - 70 * u, 4 * u, 60 * u).fill({ color: 0xe8f0f0, alpha: 0.6 }).poly(ell(gx, top - 8 * u, 22 * u, 6 * u, 12)).fill({ color: 0xe8f0f0, alpha: 0.6 });
  return g;
}

interface St {
  blinds: (open: number) => void;
  open: { v: number };
  rose: Container | null;
  roseLanded: boolean;
  env: ReturnType<typeof envelope> | null;
  lampK: ReturnType<typeof lamp>;
}
const S = stash<St>();
const WIN: [number, number, number, number] = [120, 150, 470, 470];
const DESK_TOP = 840;

export const gatoleone: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO DE LA FAMILIA',
  open(c: SigCtx) {
    const k = new Container();
    const wall = study(W, H, 1);
    const shelves = new Graphics();
    bookcase(shelves, 1420, 150, 1, 7);
    const win = blindsWindow(WIN[0], WIN[1], WIN[2], WIN[3], 1);
    const light = new Graphics();
    light.blendMode = 'add';
    const dk = desk(W, DESK_TOP, H, 1);
    const lp = lamp(1, DESK_TOP + 40);
    lp.k.position.set(W / 2, 0);
    const shade = cover(0x000000, c.short || c.reduce ? 0 : 0.85);
    k.addChild(wall, shelves, win.k, light, lp.k, dk, shade);
    c.back.addChild(k);
    hideDisc(c);
    const halo = glowDisc(360, LAMP, 0.28, 8, 28);
    halo.position.set(W / 2, c.catY - 10);
    halo.blendMode = 'add';
    c.behind.addChild(halo);
    const open = { v: c.short || c.reduce ? 1 : 0 };
    const blinds = (v: number) => {
      win.draw(v);
      if (!light.destroyed) stripes(light, WIN[0] + WIN[2], WIN[1], WIN[3], v, 1);
    };
    blinds(open.v);
    const st: St = { blinds, open, rose: null, roseLanded: false, env: null, lampK: lp };
    S.set(c, st);
    if (!c.reduce)
      every(c, 30, (t) => {
        win.gd.dancers.forEach((d, i) => {
          if (d.destroyed) return;
          d.y = WIN[1] + WIN[3] * (0.88 + (i % 2) * 0.06) - Math.abs(Math.sin(t * 6 + i * 1.3)) * 8;
          d.rotation = Math.sin(t * 3 + i) * 0.15;
        });
        if (!win.gd.lights.destroyed) win.gd.lights.alpha = 0.85 + Math.sin(t * 4) * 0.15;
        if (!lp.k.destroyed) lp.k.rotation = Math.sin(t * 0.9) * 0.012;
      });
    if (c.short) {
      const r = rose(1.1);
      r.position.set(W / 2 - 250, DESK_TOP - 18);
      r.rotation = -1.4;
      c.back.addChild(r);
      st.rose = r;
      st.roseLanded = true;
      return;
    }
    score(c, [
      [0.02, 'tick', 0.6],
      [0.05, 'purr', 0.4],
      [0.6, 'purr', 0.45],
      [1.5, 'paper', 0.6],
    ]);
    // the lamp clicks on
    if (!c.reduce) {
      gsap.to(shade, { alpha: 0.5, duration: 0.05, delay: 0.05 });
      gsap.to(shade, { alpha: 0, duration: 0.5, delay: 0.25 });
    }
    // the blinds open slat by slat; a tarantella far away
    beat(c, 0.25, () => {
      if (c.reduce) blinds(1);
      else gsap.to(open, { v: 1, duration: 0.55, ease: 'power1.inOut', onUpdate: () => blinds(open.v) });
      for (let i = 0; i < 7; i++) later(c, i * 0.04, () => sfx('tick', 1.8 - i * 0.05));
    });
    const tune = [1, 1.19, 1.33, 1.5, 1.33, 1.19, 1, 0.89, 1, 1.19, 1.5, 1.33];
    tune.forEach((p, i) => beat(c, 0.6 + i * 0.13, () => sfx('coin', p * 0.9)));
    // a red rose falls slowly through the lamplight
    beat(c, 0.7, () => {
      const r = rose(1.1);
      r.position.set(W / 2 - 160, -80);
      c.back.addChild(r);
      st.rose = r;
      if (c.reduce) {
        r.position.set(W / 2 - 250, DESK_TOP - 18);
        r.rotation = -1.4;
        st.roseLanded = true;
        return;
      }
      const p = { t: 0 };
      gsap.to(p, {
        t: 1,
        duration: 1.6,
        ease: 'sine.in',
        onUpdate: () => {
          if (r.destroyed) return;
          r.x = W / 2 - 160 - 90 * p.t + Math.sin(p.t * 9) * 60;
          r.y = -80 + p.t * (DESK_TOP - 18 + 80);
          r.rotation = Math.sin(p.t * 7) * 0.5 - p.t * 1.4;
        },
        onComplete: () => {
          st.roseLanded = true;
          sfx('paper', 0.5);
        },
      });
      // a petal comes loose
      later(c, 0.6, () => {
        if (r.destroyed) return;
        const pt = new Graphics().poly(smooth([0, -8, 8, 0, 0, 10, -8, 0], 3)).fill(ROSE);
        pt.position.set(r.x, r.y);
        c.back.addChild(pt);
        gsap.to(pt, { y: DESK_TOP - 6, x: pt.x + 120, rotation: 4, duration: 1.4, ease: 'sine.in', onComplete: () => destroyTree(pt) });
      });
    });
    // an orange rolls off the bowl and off the desk
    beat(c, 1.15, () => {
      if (c.reduce) return;
      const o = new Graphics().poly(ell(0, 0, 26, 25, 14)).fill(ORANGE).stroke({ width: 2.5, color: 0x8a4a10 });
      o.position.set(W / 2 - 444, DESK_TOP - 82);
      c.back.addChild(o);
      gsap.to(o, { y: DESK_TOP - 26, duration: 0.25, ease: 'bounce.out' });
      gsap.to(o, { x: W / 2 - 900, rotation: -8, duration: 0.9, delay: 0.2, ease: 'power1.in' });
      gsap.to(o, { y: H + 60, duration: 0.35, delay: 0.85, ease: 'power2.in', onComplete: () => destroyTree(o) });
      later(c, 0.25, () => sfx('pop', 0.5));
    });
    // the envelope slides across the desk to him
    beat(c, 1.5, () => {
      const e = envelope();
      e.k.position.set(W + 200, DESK_TOP + 70);
      e.k.rotation = 0.08;
      c.back.addChild(e.k);
      st.env = e;
      if (c.reduce) e.k.x = W / 2 + 330;
      else gsap.to(e.k, { x: W / 2 + 330, rotation: -0.05, duration: 0.45, ease: 'power3.out' });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('sting', 0.6);
    later(c, 0.05, () => sfx('purr', 0.35));
    c.shaker.add(0.15);
    if (st) {
      // the blinds snap shut: only the lamp is left
      gsap.killTweensOf(st.open);
      if (c.reduce) st.blinds(0);
      else gsap.to(st.open, { v: 0, duration: 0.3, ease: 'power2.in', onUpdate: () => st.blinds(st.open.v) });
      for (let i = 0; i < 8; i++) later(c, i * 0.03, () => sfx('tick', 1.2 + i * 0.05));
      if (!st.lampK.pool.destroyed && !c.reduce) gsap.fromTo(st.lampK.pool, { alpha: 1.4 }, { alpha: 1, duration: 0.8 });
      // the rose lands, its petals fall
      const r = st.rose;
      if (r && !r.destroyed) {
        gsap.killTweensOf(r);
        r.position.set(W / 2 - 250, DESK_TOP - 18);
        r.rotation = -1.4;
        burst(c, c.back, () => new Graphics().poly(smooth([0, -8, 8, 0, 0, 10, -8, 0], 3)).fill(ROSE), 9, r.x, r.y, 220, 1.4);
      }
      // the seal flashes gold
      const e = st.env;
      if (e && !e.k.destroyed) {
        gsap.killTweensOf(e.k);
        e.k.x = W / 2 + 330;
        if (!c.reduce) gsap.fromTo(e.seal.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
      }
    }
    // gold dust in the lamplight
    if (!c.reduce)
      for (let i = 0; i < 22; i++) {
        const d = new Graphics().poly(ell(0, 0, 2.5, 2.5, 5)).fill(LAMP);
        d.blendMode = 'add';
        d.position.set(W / 2 + (Math.random() - 0.5) * 600, 200 + Math.random() * 500);
        c.fg.addChild(d);
        gsap.to(d, { y: d.y + 60 + Math.random() * 80, x: d.x + (Math.random() - 0.5) * 60, alpha: 0, duration: 2 + Math.random(), ease: 'sine.inOut', onComplete: () => destroyTree(d) });
      }
    headline(c, 'Es solo negocio.', { fontFamily: F.serif, fontWeight: '700', fontSize: 120, fill: 0xeccf78, stroke: { color: 0x140a04, width: 11, join: 'round' } }, {
      glow: GOLD,
      aside: '(…con todo respeto)',
      asideStyle: { fill: 0xe8dcc0, stroke: { color: 0x140a04, width: 8, join: 'round' } },
      dur: 3.0,
      slow: true,
      rot: -0.03,
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const s = 0.34 * u;
    const wall = study(w, h, s);
    const shelves = new Graphics();
    for (let x = w / 2 + 120 * u; x < w; x += 460 * s) bookcase(shelves, x, 50 * s, s, 7 + Math.round(x));
    for (let x = w / 2 - 120 * u - 420 * s - 470 * s; x > -420 * s; x -= 900 * s) bookcase(shelves, x, 50 * s, s, 3 + Math.round(x));
    const wx = w / 2 - 120 * u - 300 * s;
    const win = blindsWindow(wx, 60 * s, 300 * s, 360 * s, s);
    win.draw(1);
    const light = new Graphics();
    light.blendMode = 'add';
    stripes(light, wx + 300 * s, 60 * s, 360 * s, 1, s);
    const dk = desk(w, h * 0.86, h, s * 1.4);
    const lp = lamp(s, h * 0.9);
    lp.k.position.set(w / 2, 0);
    const r = rose(0.4 * u);
    r.position.set(w / 2 - 90 * u, h * 0.86 - 6 * u);
    r.rotation = -1.4;
    k.addChild(wall, shelves, win.k, light, lp.k, dk, r);
    if (live)
      cardLoop(k, 30, (t) => {
        win.gd.dancers.forEach((d, i) => {
          d.y = 60 * s + 360 * s * (0.88 + (i % 2) * 0.06) - Math.abs(Math.sin(t * 6 + i * 1.3)) * 8 * s;
          d.rotation = Math.sin(t * 3 + i) * 0.15;
        });
        win.gd.lights.alpha = 0.85 + Math.sin(t * 4) * 0.15;
        lp.k.rotation = Math.sin(t * 0.9) * 0.015;
      });
    return k;
  },
};
