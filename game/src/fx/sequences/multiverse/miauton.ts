/**
 * Isaac Miauton, el que Entendió la Manzana: the apple-tree universe (an English garden, 1666, at sunset). Rolling
 * hills, a little stone manor, the sun going down on the right and a huge apple tree whose crown fills the top of the
 * screen. A stem snaps (¡CRAC!) and an apple falls in slow motion along a perfect curve, drawn in light, leaving ghost
 * apples behind it like a time-lapse while the sky fills with his sums (F = G · m · M / r², g = 9,8 m/s²). A ray of
 * the setting sun reaches the prism in his paw and opens into a fan of seven colors across the garden (LA LUZ BLANCA
 * ES DE COLORES). The apple lands on his head: ¡TONC! Three little stars. «…¡claro!».
 * Payoff: everything falls — apples, cups, books, a quill — and the law shines over the sky; ¡TODO SE CAE! / …sobre
 * todo lo que está en la mesa.
 * (A public-domain scientist evoked through his garden, his apple and his prism; he is a cat.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, fall, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { balloon, ngon, onCat, streak, twinkle } from './kitD';
import { star5 } from './kitH';
import { at, comic, pre, wrap } from './kitI';
import { C, F, TAU, blob, glow, headline, loop, word1 } from './kitK';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const RED = 0xc0392b;
const SKY = [0x24335f, 0x4a4a86, 0x9a5f8e, 0xe5866a, 0xffc98a];
const SUN = 0xffe7a8;
const LEAF = [0x1f4a24, 0x2c5e2c, 0x3d7a36, 0x5a9a44];
const RAINBOW = [0xe23b3b, 0xf28a2e, 0xf6d63c, 0x4dbb5a, 0x3a8fe0, 0x4b4fc9, 0x8a4fc9];
/** the apple and the prism on the painting (measured on the integrated SVG) */
const APPLE: [number, number] = [0.54, 0.136];
const HEAD: [number, number] = [0.5, 0.2];
const PRISM: [number, number] = [0.235, 0.505];

interface Lay {
  w: number;
  h: number;
  cx: number;
  u: number;
}
const X = (l: Lay, x: number) => l.cx + (x - 960) * l.u;
const Y = (l: Lay, y: number) => y * l.u;

/** an apple (origin at its center, radius r): body, a dimple, a stem and a leaf, a shine */
function apple(g: Graphics, x: number, y: number, r: number, rot = 0, alpha = 1) {
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  const P = (px: number, py: number) => [x + px * cs - py * sn, y + px * sn + py * cs];
  const body: number[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU - Math.PI / 2;
    const dip = 1 - 0.16 * Math.max(0, Math.cos(a + Math.PI / 2)) ** 6;
    const [px, py] = P(Math.cos(a) * r * 1.04 * dip, Math.sin(a) * r * dip);
    body.push(px, py);
  }
  g.poly(body).fill({ color: RED, alpha });
  const sh: number[] = [];
  for (const [px, py] of [
    [-0.55, -0.35],
    [-0.3, -0.62],
    [-0.15, -0.45],
    [-0.4, -0.1],
  ])
    sh.push(...P(px * r, py * r));
  g.poly(sh).fill({ color: 0xffffff, alpha: 0.45 * alpha });
  g.poly([...P(-r * 0.06, -r * 0.8), ...P(r * 0.1, -r * 1.35), ...P(r * 0.2, -r * 1.3), ...P(r * 0.06, -r * 0.8)]).fill({ color: 0x4a2c14, alpha });
  g.poly([...P(r * 0.15, -r * 1.1), ...P(r * 0.6, -r * 1.42), ...P(r * 0.85, -r * 1.2), ...P(r * 0.42, -r * 0.98)]).fill({ color: 0x3d8a34, alpha });
}

/** the garden: sunset sky, the sun, hills and hedges, the manor, the grass (static) */
function garden(g: Graphics, l: Lay, sunX: number, sunY: number) {
  vgrad(g, 0, 0, l.w, Y(l, 700), SKY, 22);
  glow(g, sunX, sunY, 420 * l.u, 0xffd28a, 0.45, 8, 28);
  g.poly(ngon(sunX, sunY, 92 * l.u, 92 * l.u, 30)).fill(SUN);
  // thin evening clouds
  const r = rng(7);
  for (let i = 0; i < 6; i++) {
    const cx = l.cx + (r() - 0.5) * l.w * 1.1;
    const cy = Y(l, 120 + r() * 360);
    g.poly(blob(cx, cy, (140 + r() * 160) * l.u, (12 + r() * 10) * l.u, 40 + i, 12, 0.3)).fill({ color: i % 2 ? 0xffd0b0 : 0xf2a68a, alpha: 0.55 });
  }
  // far hills and the manor
  const hill = (y: number, amp: number, col: number, seed: number) => {
    const rr = rng(seed);
    const pts: number[] = [-40, l.h + 40];
    const n = 16;
    const ph = rr() * TAU;
    for (let i = 0; i <= n; i++) {
      const x = -40 + ((l.w + 80) * i) / n;
      pts.push(x, Y(l, y) + Math.sin((x / l.u) * 0.004 + ph) * amp * l.u + Math.sin((x / l.u) * 0.011 + ph * 2) * amp * 0.4 * l.u);
    }
    pts.push(l.w + 40, l.h + 40);
    g.poly(pts).fill(col);
  };
  hill(610, 30, 0x6a7a5a, 3);
  const hx = X(l, 640);
  const hy = Y(l, 600);
  g.rect(hx - 70 * l.u, hy - 70 * l.u, 140 * l.u, 70 * l.u).fill(0xb7a27e);
  g.poly([hx - 82 * l.u, hy - 70 * l.u, hx, hy - 120 * l.u, hx + 82 * l.u, hy - 70 * l.u]).fill(0x5a4636);
  g.rect(hx + 30 * l.u, hy - 128 * l.u, 14 * l.u, 34 * l.u).fill(0x5a4636);
  for (let i = 0; i < 3; i++) g.rect(hx - 52 * l.u + i * 40 * l.u, hy - 52 * l.u, 18 * l.u, 22 * l.u).fill(0xffd27a);
  hill(660, 36, 0x4f7a3e, 9);
  // hedges along the field
  for (let i = 0; i < 9; i++) {
    const x = l.cx + (i - 4) * 260 * l.u + (i % 2) * 60 * l.u;
    g.poly(blob(x, Y(l, 700), 120 * l.u, 30 * l.u, 70 + i, 12, 0.25)).fill(0x2f5a2a);
  }
  hill(760, 22, 0x3f7032, 13);
  hill(880, 14, 0x356428, 19);
  // grass tufts in front
  for (let i = 0; i < 40; i++) {
    const x = (i / 40) * l.w + r() * 30 * l.u;
    const y = Y(l, 960 + r() * 90);
    g.poly([x - 8 * l.u, y, x - 2 * l.u, y - 30 * l.u, x + 2 * l.u, y, x + 6 * l.u, y - 24 * l.u, x + 10 * l.u, y]).fill(0x2a521f);
  }
}

/** the apple tree: trunk and limbs (static) */
function trunk(g: Graphics, l: Lay) {
  const tx = X(l, 300);
  g.poly([tx - 60 * l.u, Y(l, 960), tx - 26 * l.u, Y(l, 560), tx - 40 * l.u, Y(l, 260), tx + 20 * l.u, Y(l, 240), tx + 46 * l.u, Y(l, 560), tx + 80 * l.u, Y(l, 960)]).fill(0x4a3220);
  g.poly([tx - 10 * l.u, Y(l, 900), tx - 4 * l.u, Y(l, 600), tx + 10 * l.u, Y(l, 600), tx + 22 * l.u, Y(l, 900)]).fill({ color: 0x2c1c10, alpha: 0.6 });
  // the long limb over the cat, and one to the left
  g.poly([tx, Y(l, 330), X(l, 720), Y(l, 150), X(l, 1060), Y(l, 128), X(l, 1060), Y(l, 146), X(l, 720), Y(l, 176), tx + 30 * l.u, Y(l, 380)]).fill(0x4a3220);
  g.poly([tx - 20 * l.u, Y(l, 300), X(l, 80), Y(l, 160), X(l, 70), Y(l, 180), tx - 10 * l.u, Y(l, 340)]).fill(0x4a3220);
  // roots
  g.poly([tx - 60 * l.u, Y(l, 960), tx - 130 * l.u, Y(l, 985), tx - 20 * l.u, Y(l, 970)]).fill(0x4a3220);
  g.poly([tx + 80 * l.u, Y(l, 960), tx + 150 * l.u, Y(l, 990), tx + 40 * l.u, Y(l, 972)]).fill(0x4a3220);
}

/** the crown: leaf clusters and apples, swaying a little with time `t` */
function crown(g: Graphics, l: Lay, t: number) {
  g.clear();
  const r = rng(23);
  for (let i = 0; i < 26; i++) {
    const bx = X(l, -120 + r() * 1300);
    const by = Y(l, -60 + r() * 300);
    const sway = Math.sin(t * 1.3 + i * 0.7) * 6 * l.u;
    const rr = (110 + r() * 110) * l.u;
    g.poly(blob(bx + sway, by, rr, rr * 0.7, 100 + i, 12, 0.24)).fill(LEAF[i % 4]);
  }
  const ra = rng(29);
  for (let i = 0; i < 16; i++) {
    const ax = X(l, -60 + ra() * 1160);
    const ay = Y(l, 40 + ra() * 230);
    apple(g, ax + Math.sin(t * 1.3 + i) * 5 * l.u, ay, 17 * l.u, (ra() - 0.5) * 0.6);
  }
}

/** the rainbow fan out of the prism (to the left): `len` 0..1, `a` alpha */
function fan(g: Graphics, x: number, y: number, len: number, a: number, t: number) {
  g.clear();
  if (len < 0.01 || a < 0.01) return;
  const L = 1500 * len;
  const a0 = Math.PI - 0.06;
  const da = 0.034 + Math.sin(t * 2) * 0.002;
  for (let i = 0; i < RAINBOW.length; i++) {
    const q0 = a0 + i * da;
    const q1 = a0 + (i + 1) * da;
    g.poly([x, y, x + Math.cos(q0) * L, y + Math.sin(q0) * L, x + Math.cos(q1) * L, y + Math.sin(q1) * L]).fill({ color: RAINBOW[i], alpha: 0.75 * a });
  }
}

/** the sun's white ray from the sun to the prism (it passes behind him) */
function ray(g: Graphics, x0: number, y0: number, x1: number, y1: number, k: number) {
  g.clear();
  if (k < 0.01) return;
  const ex = x0 + (x1 - x0) * k;
  const ey = y0 + (y1 - y0) * k;
  g.poly(streak(x0, y0, ex, ey, 40, 14)).fill({ color: 0xffe8b0, alpha: 0.16 });
  g.poly(streak(x0, y0, ex, ey, 18, 7)).fill({ color: 0xfff4d0, alpha: 0.28 });
  g.poly(streak(x0, y0, ex, ey, 5, 2.5)).fill({ color: 0xffffff, alpha: 0.55 });
}

/** the falling apple's path: a parabola from the limb (x0,y0) to the painting's apple (x1,y1), u 0..1 */
function path(x0: number, y0: number, x1: number, y1: number, u: number): [number, number] {
  return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u * u];
}

interface St {
  sky: Container;
}
const S = stash<St>();
interface St2 {
  land: (o?: { dur?: number; slow?: boolean }) => void;
  trail: Graphics;
  ap: Graphics;
}
const St2 = stash<St2>();

export const miauton: Signature = {
  dark: false,
  frame: RED,
  tag: 'UNIVERSO DEL MANZANO',
  open(c: SigCtx) {
    const L: Lay = { w: W, h: H, cx: W / 2, u: 1 };
    const sunX = 1540;
    const sunY = 600;
    const k = new Container();
    const bg = new Graphics();
    garden(bg, L, sunX, sunY);
    const tr = new Graphics();
    trunk(tr, L);
    const cr = new Graphics();
    const sky = new Container();
    k.addChild(bg, tr, cr, sky);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    loop(c, cr, 20, (t) => crown(cr, L, t), 0.5);
    // the ray and the fan live with him (unscaled), so they meet the prism in his paw on any screen
    const [qx, qy] = onCat(c, PRISM[0], PRISM[1]);
    const ry = new Graphics();
    const fn = new Graphics();
    ry.blendMode = 'add';
    c.behind.addChild(ry, fn);
    const rayK = { v: c.short || c.reduce ? 1 : 0 };
    const fanK = { v: c.short || c.reduce ? 1 : 0 };
    loop(c, fn, 30, (t) => {
      ray(ry, sunX, sunY - 10, qx + 30, qy - 4, rayK.v);
      fan(fn, qx, qy, fanK.v, 1, t);
    });
    S.set(c, { sky });
    // the falling apple and its light trail
    const [ax1, ay1] = onCat(c, APPLE[0], APPLE[1]);
    const ax0 = 700;
    const ay0 = 170;
    const trail = new Graphics();
    const ap = new Graphics();
    c.fg.addChild(trail, ap);
    const land = headline(c, comic('¡TODO SE CAE!', 0xffd23f, 128), '…sobre todo lo que está en la mesa.');
    St2.set(c, { land, trail, ap });
    if (c.short) {
      apple(ap, ax1, ay1, 22);
      return;
    }
    apple(ap, ax0, ay0, 22);

    const crac = pre(c, comic('¡CRAC!', 0xfff1d6, 70), ax0 - 120, ay0 + 40, -0.12);
    const tonc = pre(c, comic('¡TONC!', 0xffd23f, 150), ax1 + 280, ay1 - 80, 0.1);
    const law = pre(c, word1('F = G · m · M / r²', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 64, fill: 0xffffff, stroke: { color: 0x3a2a4a, width: 7, join: 'round' } }), 1410, 190, -0.04);
    const gee = pre(c, word1('↓ g = 9,8 m/s²', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 46, fill: 0xfff1d6, stroke: { color: 0x3a2a4a, width: 6, join: 'round' } }), 560, 380, 0.03);
    const colors = pre(c, plate('LA LUZ BLANCA ES DE COLORES', 0xffffff, C.ink, 38, C.ink), 420, 880, 0.03);
    const aha = pre(c, balloon('…¡claro!', { size: 46, tx: -110, ty: -40 }), ...onCat(c, 1.08, 0.36), 0.04);

    // ¡CRAC!: the stem snaps; the apple falls in slow motion along its curve, drawn in light
    at(c, 0.2, () => {
      crac(0.5, { from: 1.4 });
      sfx('click', 1.6);
      sfx('whoosh', 0.5);
      if (c.reduce) {
        ap.clear();
        apple(ap, ax1, ay1, 22);
        for (let i = 0; i <= 4; i++) apple(trail, ...path(ax0, ay0, ax1, ay1, i / 5), 22, i * 0.3, 0.25);
        return;
      }
      const p = { u: 0 };
      let ghost = 0;
      gsap.to(p, {
        u: 1,
        duration: 1.15,
        ease: 'none',
        onUpdate: () => {
          if (ap.destroyed) return;
          const [x, y] = path(ax0, ay0, ax1, ay1, p.u);
          ap.clear();
          apple(ap, x, y, 22, p.u * 1.6);
          // the trail: a dashed line of light behind it, and a ghost apple every fifth of the way
          trail.clear();
          for (let i = 0; i < 40; i++) {
            const u0 = (i / 40) * p.u;
            const u1 = ((i + 0.55) / 40) * p.u;
            const [x0, y0] = path(ax0, ay0, ax1, ay1, u0);
            const [x1, y1] = path(ax0, ay0, ax1, ay1, u1);
            trail.poly(streak(x0, y0, x1, y1, 4, 4)).fill({ color: 0xfff6c8, alpha: 0.85 });
          }
          while (ghost < 5 && p.u >= ghost / 5) ghost++;
          for (let i = 0; i < ghost; i++) apple(trail, ...path(ax0, ay0, ax1, ay1, i / 5), 22, i * 0.32, 0.28);
        },
      });
    });
    at(c, 0.45, () => {
      law(1.6, { from: 1.3 });
      sfx('nib', 1.2);
    });
    at(c, 0.7, () => {
      gee(1.0, { from: 1.3 });
      sfx('nib', 1.5);
    });
    // a ray of the setting sun reaches the prism and opens into seven colors
    at(c, 0.8, () => {
      sfx('charge', 1.4);
      if (c.reduce) {
        rayK.v = fanK.v = 1;
        colors(0.9);
        return;
      }
      gsap.to(rayK, { v: 1, duration: 0.22, ease: 'power2.in' });
      gsap.to(fanK, { v: 1, delay: 0.22, duration: 0.45, ease: 'power2.out' });
      later(c, 0.24, () => sfx('gem', 1.8));
      later(c, 0.4, () => colors(0.9, { from: 1.4 }));
    });
    // ¡TONC!
    at(c, 1.36, () => {
      tonc(0.75);
      sfx('hit', 1.2);
      sfx('pop', 0.8);
      c.shaker.add(0.22);
      const [hx, hy] = onCat(c, HEAD[0], HEAD[1]);
      const st = new Graphics();
      st.position.set(hx, hy - 10);
      c.fg.addChild(st);
      for (let i = 0; i < 3; i++) st.poly(star5(Math.cos((i / 3) * TAU) * 90, Math.sin((i / 3) * TAU) * 26, 18)).fill(0xffd23f).stroke({ width: 3, color: C.ink, join: 'round' });
      if (!c.reduce) gsap.to(st, { rotation: TAU * 0.8, duration: 0.9, ease: 'none' });
      gsap.to(st, { alpha: 0, delay: 0.7, duration: 0.25, onComplete: () => destroyTree(st) });
    });
    at(c, 1.75, () => {
      aha(0.7);
      sfx('purr', 1.2);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    const s2 = St2.get(c);
    sfx('fanfare', 1.0);
    sfx('boom', 0.7);
    c.shaker.add(0.3);
    flashOf(c, 0xfff4d0, 0.4, 0.35);
    if (s2) {
      if (!s2.trail.destroyed) gsap.to(s2.trail, { alpha: 0, duration: c.reduce ? 0 : 0.3 });
      if (!s2.ap.destroyed) gsap.to(s2.ap, { alpha: 0, duration: c.reduce ? 0 : 0.3 });
    }
    // the law shines over the sky
    if (st && !st.sky.destroyed) {
      const g = new Graphics();
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        g.poly(twinkle(1410 + Math.cos(a) * 260, 200 + Math.sin(a) * 70, 10 + (i % 3) * 6)).fill({ color: 0xfff6c8, alpha: 0.9 });
      }
      st.sky.addChild(g);
      gsap.to(g, { alpha: 0, delay: 1.6, duration: 0.6, onComplete: () => destroyTree(g) });
    }
    // everything falls: apples, cups, books, a quill
    const make = (i: number) => {
      const g = new Graphics();
      const kind = i % 5;
      if (kind < 2) apple(g, 0, 0, 22 + (i % 3) * 4);
      else if (kind === 2) {
        g.poly([-26, -18, 26, -18, 18, 22, -18, 22]).fill(0xf4f1ea).stroke({ width: 4, color: C.ink, join: 'round' });
        g.poly([26, -8, 40, -6, 40, 10, 22, 12]).fill(0xf4f1ea).stroke({ width: 4, color: C.ink, join: 'round' });
        g.rect(-24, -10, 48, 6).fill(0x3a6fb0);
      } else if (kind === 3) {
        g.rect(-34, -24, 68, 48).fill(0x6a2a1a).stroke({ width: 4, color: C.ink });
        g.rect(-30, -18, 4, 36).fill(0xe6c34a).rect(-34, 16, 68, 8).fill(0xf4ecd8);
      } else {
        g.poly([0, -50, 10, -20, 4, 40, -4, 40, -10, -20]).fill(0xf4f1ea).stroke({ width: 3, color: C.ink, join: 'round' });
        g.rect(-1.5, -10, 3, 56).fill(0x6a5a4a);
      }
      return g;
    };
    fall(c, c.fg, make, { n: 22, over: 1.3, dur: 1.3, bounce: true, spin: 3 });
    if (s2) s2.land({ dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const L: Lay = { w, h, cx: w / 2, u };
    const sunX = w / 2 + Math.min(w * 0.36, h * 0.6);
    const sunY = h * 0.56;
    const bg = new Graphics();
    garden(bg, L, sunX, sunY);
    const tr = new Graphics();
    trunk(tr, L);
    const cr = new Graphics();
    crown(cr, L, 0.5);
    const ap = new Graphics();
    k.addChild(bg, tr, cr, ap);
    if (live) {
      const x0 = X(L, 720);
      liveLoop(k, (t) => {
        crown(cr, L, t);
        // an apple drops from the limb every few seconds
        ap.clear();
        const q = (t % 3.2) / 1.6;
        if (q < 1) apple(ap, x0, Y(L, 180) + (Y(L, 960) - Y(L, 180)) * q * q, 20 * u, q * 2);
      });
    }
    return k;
  },
};
