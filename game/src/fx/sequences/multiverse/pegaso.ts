/**
 * Michi de Pegaso: the sanctuary universe (a 1980s knights-of-the-zodiac anime). Night over a sacred mountain whose
 * stairway climbs past twelve little temples; marble steps and columns at his feet. The stars join into a winged horse,
 * the bronze armor comes down from the constellation piece by piece and clangs onto the silhouette, and a cosmos aura
 * (blue, full of orbiting stars) lights around him. Payoff: a hundred paw-meteors out of his fist; ¡ARDE, COSMOS!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, backlight, cheer, drizzle, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { aside, drive, ngon, onCat, rnd, starfield, streak, twinkle } from './kitD';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const NIGHT = [0x03061a, 0x0a1440, 0x1a2c6e, 0x34509c];
const MARBLE = 0xd9dcea;
const MARBLE_D = 0x8f97b8;
const BRONZE = 0xd9a441;
const BRONZE_D = 0x8a5a1c;
const COSMOS = 0x6f9bff;

/** the winged horse in stars (unit coordinates, facing left like his punch) and its stick figure */
const STARS: [number, number][] = [
  [-1.0, -0.42], // 0 nose
  [-0.74, -0.78], // 1 ear
  [-0.3, -0.2], // 2 withers
  [0.15, -1.0], // 3 wing tip
  [0.55, -0.72], // 4 wing mid
  [0.7, -0.5], // 5 wing low
  [0.5, -0.18], // 6 croup
  [0.98, -0.05], // 7 tail
  [0.66, 0.38], // 8 hind knee
  [0.52, 0.66], // 9 hind hoof
  [0.0, 0.2], // 10 belly
  [-0.52, -0.02], // 11 chest
  [-0.64, 0.24], // 12 fore knee
  [-0.84, 0.42], // 13 fore hoof
  [-0.62, -0.26], // 14 throat
];
const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 14],
  [14, 2],
  [14, 11],
  [11, 12],
  [12, 13],
  [11, 10],
  [10, 6],
  [2, 6],
  [6, 7],
  [6, 8],
  [8, 9],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
];
/** the horse's silhouette (unit coordinates): head, a raised wing, the tail, a galloping foreleg */
const OUTLINE: [number, number][] = [
  [-1.0, -0.42], [-0.86, -0.6], [-0.76, -0.8], [-0.66, -0.64], [-0.5, -0.42], [-0.3, -0.22], [-0.24, -0.26], [0.1, -0.98],
  [0.2, -1.02], [0.36, -0.9], [0.3, -0.78], [0.56, -0.74], [0.46, -0.6], [0.72, -0.52], [0.5, -0.36], [0.22, -0.24],
  [0.52, -0.2], [0.76, -0.2], [1.0, -0.06], [0.8, 0.0], [0.62, -0.02], [0.6, 0.12], [0.68, 0.38], [0.58, 0.68],
  [0.48, 0.66], [0.52, 0.42], [0.42, 0.2], [0.0, 0.24], [-0.38, 0.16], [-0.6, 0.26], [-0.78, 0.46], [-0.88, 0.4],
  [-0.68, 0.14], [-0.56, -0.02], [-0.62, -0.24], [-0.88, -0.3],
];

/**
 * the sacred mountain: a dark peak at (px, peak), its zigzag stairway climbing from (bx, base) and twelve little temples,
 * one at each turn, the last (the biggest) on the summit (one Graphics)
 */
function sanctuary(g: Graphics, w: number, base: number, px: number, peak: number, bx: number, k: number) {
  g.poly([px - 760 * k, base, px - 330 * k, peak + 170 * k, px - 90 * k, peak + 30 * k, px, peak, px + 120 * k, peak + 40 * k, px + 420 * k, peak + 230 * k, px + 900 * k, base]).fill(0x0c1434);
  g.poly([px - 1300 * k, base, px - 980 * k, base - 160 * k, px - 700 * k, base - 90 * k, px - 520 * k, base]).fill(0x111c46);
  g.poly([px + 700 * k, base, px + 1050 * k, base - 140 * k, px + 1300 * k, base - 110 * k, px + 1640 * k, base]).fill(0x111c46);
  // the stairway: a zigzag of pale steps narrowing toward the summit
  const zz: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const mx = bx + (px - bx) * u;
    zz.push([mx + (i % 2 ? 1 : -1) * (150 - 130 * u) * k, base - 10 * k + (peak - base + 30 * k) * u]);
  }
  for (let i = 0; i < 12; i++) {
    const [x0, y0] = zz[i];
    const [x1, y1] = zz[i + 1];
    g.poly(streak(x0, y0, x1, y1, 5 * k * (1 - i / 16), 5 * k * (1 - (i + 1) / 16))).fill({ color: MARBLE_D, alpha: 0.6 });
  }
  for (let i = 1; i <= 12; i++) {
    const [x, y] = zz[i];
    const s = (i === 12 ? 1.3 : 1.05 - i * 0.05) * k;
    temple(g, x, y, 30 * s, i === 12 ? 0xf2e6c2 : MARBLE);
  }
}

/** a tiny temple: steps, columns, pediment (origin at its base center, `s` = half width) */
function temple(g: Graphics, x: number, y: number, s: number, col: number) {
  g.rect(x - s * 1.1, y - s * 0.18, s * 2.2, s * 0.18).fill(col);
  for (let i = 0; i < 4; i++) g.rect(x - s * 0.9 + i * s * 0.56, y - s * 1.0, s * 0.18, s * 0.82).fill(col);
  g.rect(x - s, y - s * 1.12, s * 2, s * 0.14).fill(col);
  g.poly([x - s * 1.1, y - s * 1.12, x, y - s * 1.55, x + s * 1.1, y - s * 1.12]).fill(col);
  g.rect(x - s * 0.7, y - s * 0.96, s * 1.4, s * 0.78).fill({ color: 0xffe9a8, alpha: 0.35 });
}

/** a fluted marble column (origin at its base center), broken at `h` */
function column(g: Graphics, x: number, base: number, h: number, r: number, broken = false) {
  g.rect(x - r * 1.35, base - r * 0.5, r * 2.7, r * 0.5).fill(MARBLE).rect(x - r * 1.15, base - r * 0.8, r * 2.3, r * 0.3).fill(MARBLE_D);
  g.rect(x - r, base - h, r * 2, h - r * 0.8).fill(MARBLE);
  for (let i = 0; i < 5; i++) g.rect(x - r + r * 0.18 + i * r * 0.38, base - h + r * 0.4, r * 0.1, h - r * 1.4).fill({ color: MARBLE_D, alpha: 0.7 });
  g.rect(x - r, base - h, r * 0.35, h - r * 0.8).fill({ color: 0x5a6390, alpha: 0.35 });
  if (broken) {
    g.poly([x - r, base - h, x - r * 0.4, base - h - r * 0.7, x + r * 0.1, base - h - r * 0.2, x + r * 0.6, base - h - r * 0.9, x + r, base - h]).fill(MARBLE);
  } else {
    g.rect(x - r * 1.5, base - h - r * 0.6, r * 3, r * 0.6).fill(MARBLE).rect(x - r * 1.2, base - h, r * 2.4, r * 0.3).fill(MARBLE_D);
    g.poly(ngon(x - r * 1.25, base - h - r * 0.3, r * 0.32, r * 0.32, 10)).fill(MARBLE_D).poly(ngon(x + r * 1.25, base - h - r * 0.3, r * 0.32, r * 0.32, 10)).fill(MARBLE_D);
  }
}

/** marble steps across the bottom (where he stands) */
function steps(g: Graphics, w: number, top: number, h: number, n: number) {
  for (let i = 0; i < n; i++) {
    const y = top + ((h - top) * i) / n;
    const y2 = top + ((h - top) * (i + 1)) / n;
    g.rect(0, y, w, y2 - y).fill(i % 2 ? 0x4a5488 : 0x56609a).rect(0, y, w, Math.max(2, (y2 - y) * 0.14)).fill(0x9aa4d4);
  }
}

/** the constellation: lines, stars and the horse's faint outline, at (x,y), scale s; `k` 0..1 = how much is drawn */
function drawConstellation(g: Graphics, x: number, y: number, s: number, k: number, glowA = 1) {
  g.clear();
  const P = STARS.map(([a, b]) => [x + a * s, y + b * s] as const);
  if (k > 0.75) {
    const o = OUTLINE.flatMap(([a, b]) => [x + a * s, y + b * s]);
    g.poly(o).fill({ color: 0x6f9bff, alpha: Math.min(1, (k - 0.75) * 4) * 0.16 * glowA });
    g.poly(o, true).stroke({ width: Math.max(1, s * 0.01), color: 0x9fc4ff, alpha: Math.min(1, (k - 0.75) * 4) * 0.65 * glowA, join: 'round' });
  }
  const nl = Math.floor(LINKS.length * Math.min(1, k / 0.75));
  for (let i = 0; i < nl; i++) {
    const [a, b] = LINKS[i];
    g.poly(streak(P[a][0], P[a][1], P[b][0], P[b][1], s * 0.005, s * 0.005)).fill({ color: 0xbfd6ff, alpha: 0.7 * glowA });
  }
  const ns = Math.ceil(STARS.length * Math.min(1, k / 0.6));
  for (let i = 0; i < ns; i++) {
    const [px, py] = P[i];
    g.poly(ngon(px, py, s * 0.045, s * 0.045, 10)).fill({ color: COSMOS, alpha: 0.25 * glowA });
    g.poly(twinkle(px, py, s * (i === 6 || i === 2 || i === 3 ? 0.075 : 0.05))).fill(0xffffff);
  }
  return P;
}

/** the bronze cloth's pieces (drawn small, at the origin): tiara, two winged shoulders, breastplate, belt, two greaves */
function piece(kind: number, s: number): Graphics {
  const g = new Graphics();
  const ink = { width: Math.max(1.5, s * 0.06), color: BRONZE_D, join: 'round' as const };
  if (kind === 0) {
    // the winged tiara
    g.poly([-s * 0.9, 0, -s * 0.5, -s * 0.3, 0, -s * 0.12, s * 0.5, -s * 0.3, s * 0.9, 0, 0, s * 0.18]).fill(BRONZE).stroke(ink);
    g.poly([-s * 0.5, -s * 0.3, -s * 1.3, -s * 0.9, -s * 0.9, -s * 0.2]).fill(0xf6e2a8).stroke(ink);
    g.poly([s * 0.5, -s * 0.3, s * 1.3, -s * 0.9, s * 0.9, -s * 0.2]).fill(0xf6e2a8).stroke(ink);
  } else if (kind === 1 || kind === 2) {
    // a shoulder guard with its little wing
    const d = kind === 1 ? -1 : 1;
    g.poly([-s * 0.7, s * 0.3, -s * 0.5, -s * 0.4, s * 0.5, -s * 0.45, s * 0.75, s * 0.25, 0, s * 0.5]).fill(BRONZE).stroke(ink);
    g.poly([d * s * 0.3, -s * 0.4, d * s * 1.4, -s * 1.1, d * s * 1.1, -s * 0.6, d * s * 1.3, -s * 0.5, d * s * 0.7, -s * 0.1]).fill(0xf6e2a8).stroke(ink);
  } else if (kind === 3) {
    // the breastplate
    g.poly([-s * 0.9, -s * 0.6, s * 0.9, -s * 0.6, s * 0.75, s * 0.4, 0, s * 0.7, -s * 0.75, s * 0.4]).fill(BRONZE).stroke(ink);
    g.poly([-s * 0.5, -s * 0.4, 0, -s * 0.1, s * 0.5, -s * 0.4, s * 0.3, s * 0.2, -s * 0.3, s * 0.2]).fill(0xf6e2a8);
  } else if (kind === 4) {
    // the belt
    g.rect(-s, -s * 0.18, s * 2, s * 0.36).fill(BRONZE).stroke(ink);
    g.poly(ngon(0, 0, s * 0.26, s * 0.26, 6)).fill(0xf6e2a8).stroke(ink);
  } else {
    // a greave
    g.poly([-s * 0.4, -s * 0.8, s * 0.4, -s * 0.8, s * 0.32, s * 0.6, 0, s * 0.85, -s * 0.32, s * 0.6]).fill(BRONZE).stroke(ink);
    g.poly([-s * 0.25, -s * 0.5, s * 0.25, -s * 0.5, 0, 0]).fill(0xf6e2a8);
  }
  return g;
}
/** where each piece lands on the painting (fx, fy) */
const SLOT: [number, number][] = [
  [0.53, 0.23],
  [0.41, 0.34],
  [0.69, 0.31],
  [0.56, 0.45],
  [0.55, 0.54],
  [0.38, 0.77],
  [0.69, 0.78],
];

/** the cosmos aura: translucent blue layers + a ring of orbiting stars (redrawn with time t, size 0..1) */
function drawAura(g: Graphics, t: number, size: number) {
  g.clear();
  if (size < 0.02) return;
  for (const [sc, col, a] of [
    [1.0, 0x2a4bd8, 0.28],
    [0.82, COSMOS, 0.3],
    [0.6, 0xbfd6ff, 0.28],
  ] as const) {
    const pts: number[] = [];
    const N = 28;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      const up = Math.max(0, -Math.sin(ang));
      const wob = 1 + 0.07 * Math.sin(t * 6 + i * 1.7) + 0.05 * Math.sin(t * 11 + i);
      pts.push(Math.cos(ang) * 230 * sc * size * wob, Math.sin(ang) * 300 * sc * size * (1 + 0.25 * up) * wob);
    }
    g.poly(pts).fill({ color: col, alpha: a });
  }
  // the galaxy: stars orbiting on a tilted ellipse
  for (let i = 0; i < 26; i++) {
    const a = t * 1.4 + (i / 26) * Math.PI * 2;
    const rr = (250 + (i % 3) * 30) * size;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr * 0.32 + 40 * size;
    g.poly(twinkle(x, y, (i % 4 === 0 ? 12 : 6) * size)).fill({ color: 0xffffff, alpha: Math.sin(a) > 0 ? 0.95 : 0.45 });
  }
}

interface St {
  con: Graphics;
  aura: Graphics;
  auraK: { v: number };
  cx: number;
  cy: number;
  cs: number;
}
const S = stash<St>();

export const pegaso: Signature = {
  dark: true,
  frame: BRONZE,
  tag: 'UNIVERSO DEL SANTUARIO',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, H, NIGHT, 20);
    const neb = new Graphics();
    neb.poly([0, 300, 600, 140, 1300, 260, 1920, 80, 1920, 300, 1250, 420, 640, 330, 0, 470]).fill({ color: 0x5a3ab8, alpha: 0.16 });
    neb.poly([0, 360, 700, 220, 1320, 330, 1920, 170, 1920, 240, 1280, 380, 660, 290, 0, 420]).fill({ color: 0x3a8adf, alpha: 0.14 });
    const stars = starfield(new Graphics(), 0, 0, W, 760, 240, 13, 0xffffff, 2.6);
    const mtn = new Graphics();
    sanctuary(mtn, W, 830, 520, 230, 820, 1);
    const fore = new Graphics();
    steps(fore, W, 820, H, 5);
    column(fore, W - 150, 832, 700, 62);
    column(fore, 130, 832, 330, 58, true);
    column(fore, W - 380, 832, 240, 44, true);
    k.addChild(sky, neb, stars, mtn, fore);
    c.back.addChild(k);
    arrive(c, k, 0.3);
    hideDisc(c, 0.25);
    // the light behind the silhouette (the night is dark)
    const bl = backlight(0x4a6ad8, 380, 0.55);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    // the constellation, behind him, the wings over his head
    const con = new Graphics();
    const cx = 1430;
    const cy = 270;
    const cs = 270;
    c.behind.addChildAt(con, 0);
    const aura = new Graphics();
    aura.position.set(W / 2, c.catY + 20);
    c.behind.addChild(aura);
    const auraK = { v: 0 };
    S.set(c, { con, aura, auraK, cx, cy, cs });
    const glowK = { v: 1 };
    const conK = { v: c.short || c.reduce ? 1 : 0 };
    if (!c.reduce)
      every(c, 30, (t) => {
        if (!aura.destroyed) drawAura(aura, t, auraK.v);
        if (!stars.destroyed) stars.alpha = 0.85 + 0.15 * Math.sin(t * 5);
        if (!con.destroyed && conK.v >= 1) drawConstellation(con, cx, cy, cs, 1, glowK.v * (0.8 + 0.2 * Math.sin(t * 4)));
      });
    drawConstellation(con, cx, cy, cs, conK.v);
    if (c.short || c.reduce) {
      auraK.v = 0.9;
      drawAura(aura, 0, auraK.v);
      if (c.short) return;
    }

    // the stars light one by one and join into the winged horse
    score(c, [
      [0.05, 'gem', 1.6],
      [0.35, 'gem', 1.9],
      [0.65, 'gem', 2.2],
      [0.85, 'charge', 1.2],
    ]);
    if (!c.reduce) drive(con, 0, 1, 0.9, (v) => ((conK.v = v), drawConstellation(con, cx, cy, cs, v)), { delay: 0.05, ease: 'none' });

    // the bronze cloth comes down from the stars, piece by piece, and clangs on
    const layer = c.fg;
    later(c, 0.95, () => {
      const P = STARS.map(([a, b]) => [cx + a * cs, cy + b * cs] as const);
      const from = [3, 2, 5, 14, 10, 12, 8];
      SLOT.forEach(([fx, fy], i) => {
        later(c, i * 0.1, () => {
          const p = piece(i, i === 3 ? 46 : i === 0 ? 34 : 30);
          const [tx, ty] = onCat(c, fx, fy);
          const [sx, sy] = P[from[i]];
          p.position.set(sx, sy);
          p.scale.set(0.3);
          layer.addChild(p);
          const land = () => {
            if (p.destroyed) return;
            sfx('shield', 1.3 + i * 0.08);
            c.shaker.add(0.08);
            const sp = new Graphics().poly(twinkle(0, 0, 60)).fill(0xfff2c0).poly(twinkle(0, 0, 30, 0.4)).fill(0xffffff);
            sp.position.set(tx, ty);
            layer.addChild(sp);
            if (!c.reduce) gsap.fromTo(sp.scale, { x: 0.2, y: 0.2 }, { x: 1.3, y: 1.3, duration: 0.18, ease: 'power2.out' });
            gsap.to(sp, { alpha: 0, duration: 0.25, delay: 0.08, onComplete: () => destroyTree(sp) });
            gsap.to(p, { alpha: 0, duration: 0.3, delay: 0.12, onComplete: () => destroyTree(p) });
          };
          if (c.reduce) {
            p.position.set(tx, ty);
            p.scale.set(1);
            land();
          } else {
            gsap.to(p.scale, { x: 1, y: 1, duration: 0.32, ease: 'power2.out' });
            gsap.to(p, { x: tx, y: ty, rotation: Math.PI * 2, duration: 0.32, ease: 'power2.in', onComplete: land });
          }
        });
      });
    });
    // the cosmos lights up around him (¡BRONCE! is built now, at the break, so it doesn't rasterize mid-takeover)
    const bronce = txt('¡BRONCE!', { fontFamily: F.serif, fontWeight: '900', fontSize: 74, fill: 0xf6e2a8, stroke: { color: BRONZE_D, width: 10, join: 'round' }, letterSpacing: 6 });
    bronce.anchor.set(0.5);
    bronce.position.set(W / 2 + 480, 560);
    bronce.rotation = -0.06;
    bronce.alpha = 0.001;
    c.fg.addChild(bronce);
    later(c, 1.7, () => {
      sfx('zap', 0.7);
      sfx('levelup', 1.2);
      if (!c.reduce) drive(aura, 0, 1, 0.35, (v) => (auraK.v = v), { ease: 'back.out(2)' });
      else auraK.v = 1;
      glowK.v = 1.3;
      if (bronce.destroyed) return;
      bronce.alpha = 1;
      if (!c.reduce) gsap.fromTo(bronce.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
      fadeKill(bronce, 0.8, 0.25);
    });
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('bigboom', 1.1);
    sfx('fanfare', 1.15);
    c.shaker.add(0.45);
    flashOf(c, 0xbfd6ff, 0.55, 0.4);
    if (st) {
      st.auraK.v = 1.25;
      drive(st.aura, 1.25, 0.95, 1.2, (v) => (st.auraK.v = v));
    }
    // the meteors: a hundred streaks out of his fist, to the left
    const [fx, fy] = onCat(c, 0.21, 0.33);
    const g = new Graphics();
    c.fg.addChild(g);
    const r = rnd(77);
    const M = c.reduce ? 24 : 90;
    const mets = Array.from({ length: M }, (_, i) => ({ a: Math.PI + (r() - 0.5) * 1.1, d0: r() * 0.4, v: 1500 + r() * 1300, L: 90 + r() * 160, wd: 3 + r() * 6, t0: (i / M) * 0.7 }));
    const draw = (t: number) => {
      if (g.destroyed) return;
      g.clear();
      for (const m of mets) {
        const tt = t - m.t0;
        if (tt < 0 || tt > 0.9) continue;
        const d = m.d0 * 100 + tt * m.v;
        const hx = fx + Math.cos(m.a) * d;
        const hy = fy + Math.sin(m.a) * d * 0.7;
        const tx = fx + Math.cos(m.a) * Math.max(0, d - m.L);
        const ty = fy + Math.sin(m.a) * Math.max(0, d - m.L) * 0.7;
        g.poly(streak(tx, ty, hx, hy, 0.5, m.wd)).fill({ color: COSMOS, alpha: 0.8 });
        g.poly(twinkle(hx, hy, m.wd * 2.6)).fill(0xffffff);
      }
    };
    if (c.reduce) {
      draw(0.35);
      fadeKill(g, 1.2, 0.4);
    } else {
      const p = { t: 0 };
      gsap.to(p, { t: 1.6, duration: 1.6, ease: 'none', onUpdate: () => draw(p.t), onComplete: () => destroyTree(g) });
    }
    for (let i = 0; i < 6; i++) later(c, i * 0.09, () => sfx('zap', 1.4 + i * 0.1));
    cheer(c, '¡ARDE, COSMOS!', 0x9fc4ff, 140, 2.0);
    aside(c, '…y la cola también.', 0xf6e2a8, { delay: 0.6, dur: 2.2 });
    drizzle(c, c.back, () => new Graphics().poly(twinkle(0, 0, 10 + Math.random() * 10)).fill(0xffffff), 0.18, 3.4);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const sky = vgrad(new Graphics(), 0, 0, w, h, NIGHT, 16);
    const stars = starfield(new Graphics(), 0, 0, w, h * 0.75, Math.round(Math.min(420, (w * h) / (m * m * 0.012))), 5, 0xffffff, Math.max(1.2, 3 * u * 1.6));
    const mtn = new Graphics();
    sanctuary(mtn, w, h * 0.8, w / 2 - m * 0.45, h * 0.2, w / 2 - m * 0.15, u * 1.3);
    const fore = new Graphics();
    steps(fore, w, h * 0.78, h, 4);
    const cr = 60 * u * 1.6;
    column(fore, w / 2 - m * 0.62, h * 0.8, h * 0.62, cr);
    column(fore, w / 2 + m * 0.62, h * 0.8, h * 0.45, cr, true);
    for (let x = w / 2 + m * 1.4; x < w; x += m * 0.9) column(fore, x, h * 0.8, h * (0.3 + ((x * 7) % 5) * 0.06), cr * 0.8, true);
    for (let x = w / 2 - m * 1.4; x > 0; x -= m * 0.9) column(fore, x, h * 0.8, h * (0.3 + ((x * 3) % 5) * 0.06), cr * 0.8, true);
    const con = new Graphics();
    const cx = w / 2 + Math.min(w * 0.3, m * 0.95);
    const cy = h * 0.26;
    const cs = m * 0.24;
    drawConstellation(con, cx, cy, cs, 1);
    const aura = new Graphics();
    aura.position.set(w / 2, h * 0.56);
    aura.scale.set(m / 760);
    drawAura(aura, 0, 0.9);
    k.addChild(sky, stars, mtn, fore, con, aura);
    // a meteor or two crossing the sky
    const met = new Graphics();
    k.addChild(met);
    const meteor = (t: number) => {
      met.clear();
      for (let i = 0; i < 3; i++) {
        const q = (t * 0.35 + i / 3) % 1;
        const x = w * (1.1 - q * 1.3);
        const y = h * (0.06 + i * 0.12) + q * h * 0.25;
        met.poly(streak(x + m * 0.18, y - m * 0.06, x, y, 0.5, m * 0.008)).fill({ color: COSMOS, alpha: 0.7 * Math.sin(q * Math.PI) });
        met.poly(twinkle(x, y, m * 0.018)).fill({ color: 0xffffff, alpha: Math.sin(q * Math.PI) });
      }
    };
    meteor(0.2);
    if (live)
      liveLoop(k, (t) => {
        drawAura(aura, t, 0.9);
        drawConstellation(con, cx, cy, cs, 1, 0.8 + 0.2 * Math.sin(t * 3));
        stars.alpha = 0.85 + 0.15 * Math.sin(t * 4);
        meteor(t);
      });
    return k;
  },
};
