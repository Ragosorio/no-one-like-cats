/**
 * El Michíncipe, el del Asteroide de Bolsillo: the asteroid universe (our own drawings — soft washes of blue and little
 * gold stars, never the book's watercolors). Around his pocket asteroid float the little worlds he visited: one with a
 * lamppost that someone keeps lighting, one crushed by a giant baobab, one with a tiny throne and a crown, one with
 * three toy volcanoes (two smoking). A fox watches him from a big star. His golden scarf unfurls in the wind and waves
 * from one side of the screen to the other (¡FIUUU!). Then the sun sets behind his asteroid — again, and again, faster
 * and faster, the sky blushing each time — ATARDECERES: 44. The rose under its glass dome sparkles.
 * Payoff: a sheet of paper drifts in and a pencil draws, line by line, a box with three little holes; from inside,
 * «béee»; the scarf whips, the fox wags; ¡DIBÚJAME UNA CAJA! / …con tres agujeritos, por favor.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { ngon, onCat, twinkle } from './kitD';
import { heartPts, star5 } from './kitH';
import { at, comic, pre, wrap } from './kitI';
import { F, blob, glint, glow, headline, loop, taper, word1 } from './kitK';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const GOLD = 0xffd23f;
const SCARF = 0xf2c230;
const SCARF_D = 0xc8961a;
const SKY = [0x0f2456, 0x1e3f86, 0x3a68b0, 0x5a8cc8];
const ROCK = 0xb8a68a;
const ROCK_D = 0x8a7a62;
const PAPER = 0xf6f0de;
const GRAPHITE = 0x3a3a44;
/** the scarf's tip, the rose's dome and his asteroid on the painting (measured on the integrated SVG) */
const SCARF_TIP: [number, number] = [0.89, 0.54];
const ROSE: [number, number] = [0.53, 0.66];
const ROCK_AT: [number, number] = [0.42, 0.84];

interface Lay {
  w: number;
  h: number;
  cx: number;
  u: number;
}
const X = (l: Lay, x: number) => l.cx + (x - 960) * l.u;
const Y = (l: Lay, y: number) => y * l.u;

/** a soft blue wash sky with gold stars (static) */
function sky(g: Graphics, l: Lay) {
  vgrad(g, 0, 0, l.w, l.h, SKY, 18);
  const r = rng(52);
  for (let i = 0; i < 34; i++) {
    const x = r() * l.w;
    const y = r() * l.h;
    const s = (120 + r() * 260) * l.u;
    g.poly(blob(x, y, s, s * (0.5 + r() * 0.4), 500 + i, 14, 0.3)).fill({ color: i % 3 ? 0x7ab0e8 : 0x0a1a46, alpha: 0.07 + r() * 0.06 });
  }
  for (let i = 0; i < Math.round((l.w / l.u) / 22); i++) {
    const x = r() * l.w;
    const y = r() * l.h * 0.95;
    const s = (2 + r() * 2.5) * l.u;
    g.rect(x, y, s, s).fill({ color: 0xfff6d0, alpha: 0.5 + r() * 0.5 });
  }
}

/** a little lumpy asteroid with craters (center x,y, radius r) */
function rock(g: Graphics, x: number, y: number, r: number, seed: number) {
  g.poly(blob(x, y, r, r * 0.92, seed, 14, 0.12)).fill(ROCK);
  g.poly(blob(x + r * 0.12, y + r * 0.18, r * 0.8, r * 0.66, seed + 1, 12, 0.12)).fill({ color: ROCK_D, alpha: 0.5 });
  const rr = rng(seed);
  for (let i = 0; i < 4; i++) g.poly(ngon(x + (rr() - 0.5) * r * 1.1, y + (rr() - 0.3) * r * 0.9, r * (0.1 + rr() * 0.1), r * (0.08 + rr() * 0.07), 8)).fill(0x7a6a52);
  g.poly(ngon(x - r * 0.35, y - r * 0.4, r * 0.3, r * 0.14, 8, -0.5)).fill({ color: 0xffffff, alpha: 0.25 });
}

/** the little worlds, bobbing with t; `lamp` 0..1 the lamplighter's lamp */
function worlds(g: Graphics, l: Lay, t: number, lamp: number) {
  g.clear();
  const z = l.u * 1.35;
  const bob = (i: number) => Math.sin(t * 1.2 + i * 1.7) * 8 * l.u;
  // 1 · the lamplighter's: a lamppost
  {
    const x = X(l, 1630);
    const y = Y(l, 600) + bob(0);
    g.rect(x - 3 * z, y - 150 * z, 6 * z, 110 * z).fill(0x2a2a3a);
    g.poly([x - 16 * z, y - 170 * z, x + 16 * z, y - 170 * z, x + 10 * z, y - 148 * z, x - 10 * z, y - 148 * z]).fill(0x2a2a3a);
    if (lamp > 0.02) glow(g, x, y - 158 * z, 90 * z, 0xffe08a, 0.5 * lamp, 5, 14);
    g.poly(ngon(x, y - 158 * z, 9 * z, 9 * z, 8)).fill(lamp > 0.5 ? 0xfff0b0 : 0x5a5a6a);
    rock(g, x, y, 52 * z, 11);
  }
  // 2 · the baobab's: a fat tree whose roots wrap the rock
  {
    const x = X(l, 1560);
    const y = Y(l, 300) + bob(1);
    rock(g, x, y, 66 * z, 21);
    g.poly([x - 26 * z, y - 40 * z, x - 34 * z, y - 150 * z, x + 30 * z, y - 150 * z, x + 24 * z, y - 40 * z]).fill(0x7a5a3a);
    for (const sd of [-1, 1]) g.poly(taper([x + sd * 20 * z, y - 50 * z, x + sd * 60 * z, y - 30 * z, x + sd * 72 * z, y + 10 * z, x + sd * 60 * z, y + 50 * z], 9 * z, 3 * z)).fill(0x6a4a2a);
    for (let i = 0; i < 6; i++) g.poly(blob(x + (i - 2.5) * 34 * z, y - 170 * z + Math.abs(i - 2.5) * 6 * z, 46 * z, 30 * z, 30 + i, 10, 0.2)).fill(i % 2 ? 0x2e7d5b : 0x3e9a6a);
  }
  // 3 · the volcanoes': three toy cones, two smoking
  {
    const x = X(l, 1640);
    const y = Y(l, 880) + bob(3);
    rock(g, x, y, 64 * z, 41);
    [-40, 0, 40].forEach((dx, i) => {
      const vx = x + dx * z;
      const vy = y - 48 * z + Math.abs(dx) * 0.3 * z;
      g.poly([vx - 22 * z, vy + 16 * z, vx - 7 * z, vy - 26 * z, vx + 7 * z, vy - 26 * z, vx + 22 * z, vy + 16 * z]).fill(i === 1 ? 0x7a6a7a : 0x8a5a4a);
      if (i < 2)
        for (let j = 0; j < 3; j++) {
          const q = (t * 0.6 + j / 3 + i * 0.4) % 1;
          g.poly(ngon(vx + Math.sin(q * 5) * 8 * z, vy - 30 * z - q * 70 * z, (6 + q * 12) * z, (5 + q * 9) * z, 8)).fill({ color: 0xe8e8f0, alpha: 0.7 * (1 - q) });
        }
    });
  }
}

/** the fox on its star (x, y = the star's center): `wag` its tail's swing */
function foxOnStar(g: Graphics, x: number, y: number, s: number, wag: number, t: number) {
  g.clear();
  glow(g, x, y, 130 * s, 0xffe8a0, 0.35, 5, 18);
  g.poly(star5(x, y, 78 * s, 0.48)).fill(GOLD);
  g.poly(star5(x - 6 * s, y - 6 * s, 50 * s, 0.48)).fill({ color: 0xfff2a8, alpha: 0.7 });
  const fx = x + 4 * s;
  const fy = y - 52 * s;
  // tail (swinging), body, chest, head, ears, snout
  const ta = Math.sin(t * 6) * 0.35 * wag;
  const tx = fx + Math.cos(-0.4 + ta) * 64 * s;
  const ty = fy + 10 * s + Math.sin(-0.4 + ta) * 64 * s;
  g.poly(taper([fx + 18 * s, fy + 10 * s, (fx + tx) / 2 + 10 * s, (fy + ty) / 2 - 18 * s, tx, ty], 14 * s, 6 * s)).fill(0xe8742a);
  g.poly(ngon(tx, ty, 9 * s, 7 * s, 8)).fill(0xfff6ea);
  g.poly([fx - 22 * s, fy + 20 * s, fx - 14 * s, fy - 30 * s, fx + 16 * s, fy - 30 * s, fx + 24 * s, fy + 20 * s]).fill(0xe8742a);
  g.poly([fx - 8 * s, fy + 18 * s, fx - 4 * s, fy - 20 * s, fx + 8 * s, fy - 20 * s, fx + 10 * s, fy + 18 * s]).fill(0xfff6ea);
  const hy = fy - 44 * s;
  g.poly([fx - 26 * s, hy - 4 * s, fx - 30 * s, hy - 44 * s, fx - 8 * s, hy - 16 * s]).fill(0xe8742a);
  g.poly([fx + 26 * s, hy - 4 * s, fx + 30 * s, hy - 44 * s, fx + 8 * s, hy - 16 * s]).fill(0xe8742a);
  g.poly([fx - 26 * s, hy - 6 * s, fx + 26 * s, hy - 6 * s, fx + 8 * s, hy + 16 * s, fx - 8 * s, hy + 16 * s]).fill(0xe8742a);
  g.poly([fx - 12 * s, hy + 4 * s, fx + 12 * s, hy + 4 * s, fx, hy + 22 * s]).fill(0xfff6ea);
  g.poly(ngon(fx, hy + 20 * s, 4 * s, 3 * s, 6)).fill(0x2a1a10);
  g.poly(ngon(fx - 10 * s, hy - 2 * s, 3 * s, 4 * s, 6)).fill(0x2a1a10).poly(ngon(fx + 10 * s, hy - 2 * s, 3 * s, 4 * s, 6)).fill(0x2a1a10);
}

/** the long golden scarf from (x0, y0) streaming right and up, twisting like cloth; `len` 0..1 unfurled, `amp` the wind */
function scarf(g: Graphics, x0: number, y0: number, len: number, amp: number, t: number, reach = 1100, s = 1, rise = 1) {
  g.clear();
  if (len < 0.01) return;
  const L = reach * len;
  const n = 30;
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push(x0 + u * L, y0 - Math.pow(u, 1.4) * 250 * s * rise * len + Math.sin(u * 7 - t * 5) * amp * (0.25 + u) * 70 * s);
  }
  // each stretch is a quad whose width follows the twist; the back of the cloth shows darker
  for (let i = 0; i < n; i++) {
    const u0 = i / n;
    const u1 = (i + 1) / n;
    const tw0 = Math.cos(u0 * 9 - t * 4);
    const tw1 = Math.cos(u1 * 9 - t * 4);
    const w0 = (30 - 10 * u0) * s * (0.3 + 0.7 * Math.abs(tw0));
    const w1 = (30 - 10 * u1) * s * (0.3 + 0.7 * Math.abs(tw1));
    const ax = pts[i * 2];
    const ay = pts[i * 2 + 1];
    const bx = pts[i * 2 + 2];
    const by = pts[i * 2 + 3];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    g.poly([ax + nx * w0, ay + ny * w0, bx + nx * w1, by + ny * w1, bx - nx * w1, by - ny * w1, ax - nx * w0, ay - ny * w0]).fill((tw0 + tw1) / 2 > 0 ? SCARF : SCARF_D);
  }
  const ex = pts[n * 2];
  const ey = pts[n * 2 + 1];
  g.poly([ex - 4 * s, ey - 16 * s, ex + 46 * s, ey - 34 * s, ex + 20 * s, ey, ex + 46 * s, ey + 30 * s, ex - 4 * s, ey + 16 * s]).fill(SCARF);
}

/** the pencil box with three holes on its sheet of paper (origin at the sheet's center): `k` 0..1 how much is drawn */
function sketch(g: Graphics, k: number, s = 1) {
  g.clear();
  // the sheet, a torn edge on the left
  const pw = 340 * s;
  const ph = 250 * s;
  const sheet: number[] = [pw / 2, -ph / 2, pw / 2, ph / 2];
  for (let i = 0; i <= 10; i++) sheet.push(-pw / 2 + ((i % 2) * 8 - 4) * s, ph / 2 - (i / 10) * ph);
  g.poly([...sheet.slice(0, 4), ...sheet.slice(4)]).fill(PAPER).stroke({ width: 2 * s, color: 0xc8bfa4 });
  // the box: front face, top, side — each line appears in turn
  const lines: number[][] = [
    [-90, -20, 50, -20],
    [50, -20, 50, 80],
    [50, 80, -90, 80],
    [-90, 80, -90, -20],
    [-90, -20, -40, -70],
    [-40, -70, 100, -70],
    [100, -70, 50, -20],
    [100, -70, 100, 30],
    [100, 30, 50, 80],
  ];
  const m = lines.length + 3;
  const show = k * m;
  lines.forEach(([x0, y0, x1, y1], i) => {
    const f = Math.max(0, Math.min(1, show - i));
    if (f <= 0) return;
    const ex = x0 + (x1 - x0) * f;
    const ey = y0 + (y1 - y0) * f;
    // a slightly wobbly graphite stroke (two thin passes)
    g.poly(taper([x0 * s, y0 * s, ((x0 + ex) / 2) * s + 1.5 * s, ((y0 + ey) / 2) * s - 1.5 * s, ex * s, ey * s], 2.6 * s, 2 * s)).fill(GRAPHITE);
    g.poly(taper([x0 * s + 2 * s, y0 * s + 1 * s, ex * s + 1 * s, ey * s + 2 * s], 1 * s, 0.8 * s)).fill({ color: GRAPHITE, alpha: 0.5 });
  });
  // three little holes on the front face
  for (let i = 0; i < 3; i++) {
    const f = Math.max(0, Math.min(1, show - lines.length - i));
    if (f <= 0) continue;
    g.poly(ngon((-60 + i * 40) * s, 30 * s, 8 * s * f, 8 * s * f, 8)).fill(GRAPHITE);
  }
}

interface St {
  amp: { v: number };
  wag: { v: number };
  paper: Graphics;
  land: (o?: { dur?: number; slow?: boolean }) => void;
}
const S = stash<St>();

export const michincipe: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO DEL ASTEROIDE',
  open(c: SigCtx) {
    const L: Lay = { w: W, h: H, cx: W / 2, u: 1 };
    const k = new Container();
    const bg = new Graphics();
    sky(bg, L);
    const tw = new Graphics();
    const wg = new Graphics();
    const fox = new Graphics();
    const dusk = new Graphics();
    k.addChild(bg, dusk, tw, wg, fox);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the scarf and the setting sun live with him (unscaled)
    const sc = new Graphics();
    const sun = new Graphics();
    c.behind.addChild(sun, sc);
    const [sx, sy] = onCat(c, SCARF_TIP[0], SCARF_TIP[1]);
    const [rx, ry] = onCat(c, ROCK_AT[0], ROCK_AT[1]);
    const instant = c.short || c.reduce;
    const unfurl = { v: instant ? 1 : 0 };
    const amp = { v: 0.6 };
    const lamp = { v: instant ? 1 : 0 };
    const wag = { v: 0.4 };
    const blush = { v: 0 };
    const sunU = { v: -1 };
    const starR = rng(71);
    const stars = Array.from({ length: 26 }, () => [starR() * W, starR() * H * 0.9, 10 + starR() * 22, starR() * 6]);
    loop(
      c,
      tw,
      30,
      (t) => {
        tw.clear();
        stars.forEach(([x, y, r, p], i) => {
          const v = 0.6 + 0.4 * Math.sin(t * 2.4 + p);
          tw.poly(i % 3 ? star5(x, y, r * v, 0.45, -Math.PI / 2 + p) : twinkle(x, y, r * 1.2 * v)).fill({ color: i % 4 ? GOLD : 0xfff6d0, alpha: 0.9 });
        });
        worlds(wg, L, t, lamp.v);
        foxOnStar(fox, 350, 300, 1.35, wag.v, t);
        scarf(sc, sx - 20, sy, unfurl.v, amp.v, t);
        dusk.clear();
        if (blush.v > 0.01) {
          // a sunset wash rising from the bottom: soft bands, warmer and stronger low
          for (let i = 0; i < 8; i++) {
            const y = H * (0.25 + i * 0.1);
            dusk.rect(-300, y, W + 600, H * 0.1 + 2).fill({ color: i < 3 ? 0xc86a9a : 0xf08a5a, alpha: (0.05 + i * 0.04) * blush.v });
          }
        }
        sun.clear();
        if (sunU.v > -0.5 && sunU.v < 1) {
          // the sun dips behind his asteroid
          const x = rx + 260 - sunU.v * 220;
          const y = ry - 200 + sunU.v * 240;
          glow(sun, x, y, 90, 0xffb060, 0.4, 4, 14);
          sun.poly(ngon(x, y, 34, 34, 16)).fill(0xffc070);
        }
      },
      0.4,
    );
    // the payoff's sheet of paper (drawn into at the payoff)
    const paper = new Graphics();
    paper.position.set(1450, 770);
    paper.rotation = 0.05;
    paper.alpha = 0;
    c.fg.addChild(paper);
    const land = headline(c, comic('¡DIBÚJAME UNA CAJA!', GOLD, 128), '…con tres agujeritos, por favor.');
    S.set(c, { amp, wag, paper, land });
    if (c.short) return;

    const fiu = pre(c, comic('¡FIUUU!', 0xfff2b0, 100), 1500, 470, 0.1);
    const count = word1('ATARDECERES: 1', { fontFamily: F.brush, fontSize: 52, fill: 0xffe0b0, stroke: { color: 0x1a1030, width: 7, join: 'round' } });
    count.position.set(1480, 900);
    count.rotation = -0.04;
    count.alpha = 0.001;
    c.fg.addChild(count);
    // the scarf unfurls in the wind
    at(c, 0.05, () => {
      sfx('whoosh', 0.7);
      if (c.reduce) unfurl.v = 1;
      else {
        gsap.to(unfurl, { v: 1, duration: 0.7, ease: 'power2.out' });
        gsap.fromTo(amp, { v: 1.4 }, { v: 0.6, duration: 1.2 });
      }
      later(c, 0.3, () => fiu(0.6));
    });
    at(c, 0.35, () => {
      lamp.v = 1;
      sfx('click', 1.5);
    });
    at(c, 0.6, () => {
      sfx('purr', 1.6);
      if (!c.reduce) gsap.to(wag, { v: 1, duration: 0.3 });
    });
    // 44 sunsets: the sun dips behind his asteroid again and again, faster and faster; the sky blushes each time
    let n = 0;
    const times: number[] = [];
    for (let i = 0; i < 12; i++) times.push(0.85 + 0.9 * Math.pow(i / 12, 0.75));
    times.forEach((d, i) =>
      at(c, d, () => {
        n = Math.round(1 + (43 * (i + 1)) / times.length);
        if (!count.destroyed) {
          count.text = `ATARDECERES: ${i === times.length - 1 ? 44 : n}`;
          count.alpha = 1;
        }
        sfx('tick', 1.6 + i * 0.08);
        if (c.reduce) {
          blush.v = 0.8;
          return;
        }
        const dur = Math.max(0.06, 0.22 - i * 0.015);
        gsap.fromTo(sunU, { v: 0 }, { v: 1, duration: dur, ease: 'power1.in' });
        gsap.fromTo(blush, { v: 1 }, { v: 0.15, duration: dur * 1.2 });
      }),
    );
    at(c, 1.85, () => {
      sfx('sting', 1.2);
      if (!count.destroyed) gsap.to(count.scale, { x: 1.25, y: 1.25, duration: 0.12, yoyo: true, repeat: 1 });
      if (!count.destroyed) gsap.to(count, { alpha: 0, delay: 0.6, duration: 0.3 });
    });
    // the rose sparkles under its dome
    at(c, 1.95, () => {
      const [qx, qy] = onCat(c, ROSE[0], ROSE[1]);
      const g = glint(new Graphics(), 0, 0, 46, 0xffffff);
      g.position.set(qx, qy - 20);
      g.poly(heartPts(40, -40, 14, 8)).fill(0xe8455a);
      c.fg.addChild(g);
      sfx('gem', 2.4);
      if (!c.reduce) gsap.fromTo(g.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.15, ease: 'back.out(2)' });
      gsap.to(g, { alpha: 0, delay: 0.4, duration: 0.3, onComplete: () => destroyTree(g) });
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.05);
    sfx('boom', 0.5);
    c.shaker.add(0.2);
    flashOf(c, 0xfff2c0, 0.35, 0.4);
    if (st) {
      if (!c.reduce) {
        gsap.fromTo(st.amp, { v: 1.8 }, { v: 0.7, duration: 1.4 });
        gsap.to(st.wag, { v: 1.6, duration: 0.2 });
      }
      // a sheet drifts in and the pencil draws the box, line by line
      const p = st.paper;
      if (!p.destroyed) {
        const kk = { v: c.reduce ? 1 : 0 };
        sketch(p, kk.v);
        if (c.reduce) p.alpha = 1;
        else {
          gsap.fromTo(p, { alpha: 0, y: p.y - 60 }, { alpha: 1, y: p.y, duration: 0.3, ease: 'power2.out' });
          gsap.to(kk, { v: 1, delay: 0.2, duration: 1.1, ease: 'none', onUpdate: () => !p.destroyed && sketch(p, kk.v) });
          for (let i = 0; i < 6; i++) later(c, 0.2 + i * 0.18, () => sfx('pencil', 1 + (i % 3) * 0.1));
        }
        // «béee» from inside the box
        later(c, c.reduce ? 0.3 : 1.4, () => {
          if (p.destroyed) return;
          const b = word1('béee', { fontFamily: F.brush, fontSize: 46, fill: 0xffffff, stroke: { color: GRAPHITE, width: 7, join: 'round' } });
          b.position.set(p.x + 120, p.y - 150);
          b.rotation = 0.12;
          c.fg.addChild(b);
          sfx('meow', 1.8);
          if (!c.reduce) gsap.from(b.scale, { x: 0.2, y: 0.2, duration: 0.2, ease: 'back.out(3)' });
          gsap.to(b, { alpha: 0, delay: 1.0, duration: 0.3, onComplete: () => destroyTree(b) });
        });
        gsap.to(p, { alpha: 0, delay: 3.0, duration: 0.5 });
      }
      st.land({ dur: 2.5 });
    }
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const L: Lay = { w, h, cx: w / 2, u };
    const bg = new Graphics();
    sky(bg, L);
    const wg = new Graphics();
    worlds(wg, L, 0, 1);
    const fox = new Graphics();
    const fx = w / 2 - Math.min(w * 0.3, h * 0.55);
    foxOnStar(fox, fx, h * 0.18, u, 0.5, 0);
    const sc = new Graphics();
    const sx0 = w / 2 + 60 * u;
    scarf(sc, sx0, h * 0.55, 1, 0.6, 0, Math.max(w - sx0, 300 * u), u, 0.6);
    const tw = new Graphics();
    k.addChild(bg, tw, wg, fox, sc);
    if (live) {
      const r = rng(8);
      const st = Array.from({ length: 16 }, () => [r() * w, r() * h, (8 + r() * 14) * u + 2, r() * 6]);
      liveLoop(k, (t) => {
        tw.clear();
        st.forEach(([x, y, s, p]) => tw.poly(star5(x, y, s * (0.6 + 0.4 * Math.sin(t * 2.4 + p)))).fill(GOLD));
        worlds(wg, L, t, 1);
        foxOnStar(fox, fx, h * 0.18, u, 0.6, t);
        scarf(sc, sx0, h * 0.55, 1, 0.6, t, Math.max(w - sx0, 300 * u), u, 0.6);
      });
    }
    return k;
  },
};

