/**
 * Miausagi, la de los Chongos de Luna: the lunar universe (a magical-girl night in the big city). A purple night over a
 * skyline of lit windows and pink signs, and a huge full moon. A column of moonlight comes down on her; pink ribbons
 * spiral up around the silhouette, stars and sparkles rise with them, golden trails stream off her two very long
 * pigtails (¡CHIIING!); the crescent bell of her wand rings (¡TILÍN!). Then her tummy growls: «…grrr».
 * Payoff (the twist): the moon was never a moon — it tips over and it is a FULL BOWL, croquettes heaped on top, and her
 * four friends arrive as four colored shooting stars; croquettes rain; ¡LA LUNA ERA UN PLATO! / …llegó tarde,
 * pero llegó.
 * (Her source has official cats of its own: none of them is here — no crescent-browed advisor, no transformation call,
 * no team names. The moon-bowl is ours.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, burst, fall, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { balloon, ngon, onCat, starfield, streak, twinkle } from './kitD';
import { heartPts, star5 } from './kitH';
import { at, comic, pre, wrap } from './kitI';
import { C, TAU, blob, glint, glow, headline, loop, taper } from './kitK';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const PINK = 0xff6f91;
const GOLD = 0xffd23f;
const BLUE = 0x3a7bd5;
const MOON = 0xfff3b8;
const CRATER = 0xeedc98;
const KIBBLE = 0xb8743a;
const SKY = [0x0a0c2a, 0x1c1a4e, 0x3a2a6e, 0x7a3e86, 0xc0628e];
/** the wand's crescent and the pigtails' tips on the painting (measured on the integrated SVG) */
const WAND: [number, number] = [0.28, 0.1];
const TAILS: [number, number][] = [
  [0.06, 0.78],
  [0.95, 0.82],
];

interface Lay {
  w: number;
  h: number;
  cx: number;
  u: number;
}
const X = (l: Lay, x: number) => l.cx + (x - 960) * l.u;
const Y = (l: Lay, y: number) => y * l.u;

/** the night sky and its stars (static) */
function city(g: Graphics, l: Lay) {
  vgrad(g, 0, 0, l.w, l.h, SKY, 24);
  starfield(g, 0, 0, l.w, Y(l, 640), Math.round((l.w / l.u) / 14), 81, 0xffffff, 2.6 * l.u);
}

/** the skyline: far and near buildings with lit windows and pink signs, a generic tower (static) */
function skyline(g: Graphics, l: Lay) {
  const r = rng(13);
  // far skyline (dim), then near (darker, more windows)
  for (let layer = 0; layer < 2; layer++) {
    const col = layer ? 0x0d0b22 : 0x241c4a;
    const base = l.h + 20;
    let x = -60 * l.u;
    while (x < l.w + 60 * l.u) {
      const bw = (70 + r() * 120) * l.u;
      const bh = (layer ? 180 + r() * 260 : 260 + r() * 260) * l.u;
      const top = Y(l, 1080) - bh - (layer ? 0 : 60 * l.u);
      g.rect(x, top, bw, base - top).fill(col);
      if (r() < 0.25) g.rect(x + bw * 0.45, top - 50 * l.u, 4 * l.u, 50 * l.u).fill(col);
      const lit = layer ? 0xffd27a : 0x8a7ab8;
      for (let wy = top + 16 * l.u; wy < base - 20 * l.u; wy += 26 * l.u)
        for (let wx = x + 10 * l.u; wx < x + bw - 14 * l.u; wx += 20 * l.u) if (r() < (layer ? 0.32 : 0.18)) g.rect(wx, wy, 9 * l.u, 12 * l.u).fill({ color: lit, alpha: layer ? 0.9 : 0.6 });
      if (layer && r() < 0.22) {
        // a pink sign on the near buildings
        const sy = top + (30 + r() * 80) * l.u;
        g.rect(x + bw * 0.2, sy, bw * 0.6, 26 * l.u).fill(PINK);
        g.rect(x + bw * 0.2 - 6 * l.u, sy - 6 * l.u, bw * 0.6 + 12 * l.u, 38 * l.u).fill({ color: PINK, alpha: 0.2 });
      }
      x += bw + (layer ? 6 : 16) * l.u;
    }
  }
  // a generic tall tower with its red light (not a real landmark)
  const tx = X(l, 1590);
  g.poly([tx - 50 * l.u, l.h, tx - 12 * l.u, Y(l, 420), tx + 12 * l.u, Y(l, 420), tx + 50 * l.u, l.h]).fill(0x14112e);
  g.rect(tx - 3 * l.u, Y(l, 340), 6 * l.u, 80 * l.u).fill(0x14112e);
  g.poly(ngon(tx, Y(l, 336), 7 * l.u, 7 * l.u, 8)).fill(0xff4a5a);
}

/** the moon (centered at 0,0, radius r): pale disc, craters that are secretly croquettes; `bowl` 0..1 the reveal */
function moon(g: Graphics, r: number, bowl: number) {
  g.clear();
  const b = Math.max(0, Math.min(1, bowl));
  if (b < 0.98) {
    glow(g, 0, 0, r * 1.9, 0xfff0c0, 0.38 * (1 - b), 7, 28);
  }
  // the bowl's body under the moon (it slides in as the moon tips over)
  if (b > 0.01) {
    const by = r * 0.4 * b;
    const bh = r * 0.95;
    const pts = [-r * 1.02, by, r * 1.02, by];
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI;
      pts.push(Math.cos(a) * r * 0.78, by + bh * 0.55 + Math.sin(a) * bh * 0.45);
    }
    g.poly(pts).fill({ color: PINK, alpha: b }).stroke({ width: 8, color: C.ink, alpha: b, join: 'round' });
    g.rect(-r * 1.02, by - 6, r * 2.04, 18).fill({ color: 0xffffff, alpha: 0.9 * b });
    // the bowl's decal: a crescent and a paw
    const cx = 0;
    const cy = by + bh * 0.48;
    g.poly(ngon(cx, cy, r * 0.22, r * 0.22, 18)).fill({ color: GOLD, alpha: b });
    g.poly(ngon(cx + r * 0.09, cy - r * 0.05, r * 0.19, r * 0.19, 18)).fill({ color: PINK, alpha: b });
    g.poly(heartPts(cx - r * 0.42, cy + r * 0.02, r * 0.1, 8)).fill({ color: 0xffffff, alpha: 0.85 * b });
    g.poly(heartPts(cx + r * 0.44, cy + r * 0.02, r * 0.1, 8)).fill({ color: 0xffffff, alpha: 0.85 * b });
  }
  // the moon squashes into the bowl's heaped top
  const ry = r * (1 - 0.62 * b);
  g.poly(ngon(0, 0, r, ry, 40)).fill(b > 0.5 ? 0xf2d58a : MOON);
  const rr = rng(3);
  for (let i = 0; i < 26; i++) {
    const a = rr() * TAU;
    const d = Math.sqrt(rr()) * 0.82;
    const x = Math.cos(a) * r * d;
    const y = Math.sin(a) * ry * d;
    const s = r * (0.06 + rr() * 0.06);
    const col = b > 0.4 ? (i % 3 ? KIBBLE : 0x8a5228) : CRATER;
    if (i % 3 === 0) g.poly([x, y - s * (1 - 0.5 * b), x + s, y + s * 0.6 * (1 - 0.4 * b), x - s, y + s * 0.6 * (1 - 0.4 * b)]).fill(col);
    else g.poly(ngon(x, y, s, s * (1 - 0.55 * b), 8, rr())).fill(col);
  }
  if (b > 0.4) for (let i = 0; i < 6; i++) g.poly(ngon((i - 2.5) * r * 0.3, -ry * 0.75 - r * 0.06 * (i % 2), r * 0.09, r * 0.06, 8)).fill(KIBBLE);
}

/** ribbons spiraling up around the silhouette: back runs (behind him) and front runs (over him), each a continuous strip */
function ribbons(back: Graphics, front: Graphics, cx: number, cy: number, t: number, k: number) {
  back.clear();
  front.clear();
  if (k < 0.01) return;
  for (let j = 0; j < 2; j++) {
    const R = 270 + j * 30;
    const ph = t * 2.6 + j * Math.PI;
    const segs = 40;
    const n = Math.max(1, Math.floor(segs * k));
    let run: number[] = [];
    let side = 0;
    const flush = () => {
      if (run.length >= 4) (side > 0 ? front : back).poly(taper(run, 13, 13)).fill({ color: j ? 0xffb3c8 : PINK, alpha: side > 0 ? 0.7 : 0.95 });
      run = [];
    };
    for (let i = 0; i <= n; i++) {
      const u = i / segs;
      const a = ph + u * TAU * 1.15;
      const z = Math.sin(a) > 0 ? 1 : -1;
      const x = cx + Math.cos(a) * R * (0.75 + 0.25 * u);
      const y = cy + 300 - u * 640;
      if (side !== 0 && z !== side) {
        run.push(x, y);
        flush();
      }
      side = z;
      run.push(x, y);
    }
    flush();
  }
}

/** golden trails streaming off the pigtails (wind) */
function trails(g: Graphics, pts: [number, number][], t: number, k: number) {
  g.clear();
  if (k < 0.01) return;
  pts.forEach(([x, y], s) => {
    const dir = s ? 1 : -1;
    for (let j = 0; j < 2; j++) {
      const line: number[] = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        line.push(x + dir * u * 420 * k, y - u * 120 + Math.sin(t * 5 + u * 6 + j * 2 + s) * 26 * u);
      }
      g.poly(taper(line, 12 - j * 4, 1)).fill({ color: j ? 0xfff6c8 : GOLD, alpha: 0.7 });
    }
    for (let i = 0; i < 5; i++) {
      const u = ((t * 0.8 + i / 5) % 1);
      g.poly(twinkle(x + dir * u * 420 * k, y - u * 120 + Math.sin(t * 5 + u * 6) * 26 * u, 10 + 8 * (1 - u))).fill({ color: 0xffffff, alpha: 1 - u });
    }
  });
}

interface St {
  rf: Graphics;
  rb: Graphics;
  bowl: { v: number };
  mg: Graphics;
  mx: number;
  my: number;
  land: (o?: { dur?: number; slow?: boolean }) => void;
}
const S = stash<St>();

export const miausagi: Signature = {
  dark: true,
  frame: PINK,
  tag: 'UNIVERSO LUNAR',
  open(c: SigCtx) {
    const L: Lay = { w: W, h: H, cx: W / 2, u: 1 };
    const k = new Container();
    const bg = new Graphics();
    city(bg, L);
    const sk = new Graphics();
    skyline(sk, L);
    const mx = 520;
    const my = 330;
    const mg = new Graphics();
    mg.position.set(mx, my);
    const beam = new Graphics();
    beam.blendMode = 'add';
    k.addChild(bg, mg, sk, beam);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bowl = { v: 0 };
    moon(mg, 230, 0);
    // ribbons, trails and stars live with him (unscaled)
    const rb = new Graphics();
    const rf = new Graphics();
    const tr = new Graphics();
    const glowG = glow(new Graphics(), W / 2, c.catY, 360, 0xffc0d8, 0.35, 7, 24);
    c.behind.addChild(glowG, rb, tr);
    c.fg.addChild(rf);
    const instant = c.short || c.reduce;
    const rib = { v: instant ? 1 : 0 };
    const col = { v: instant ? 1 : 0 };
    const tails = TAILS.map(([fx, fy]) => onCat(c, fx, fy));
    if (c.short) {
      rf.alpha = 0;
      rb.alpha = 0.55;
    }
    loop(
      c,
      rb,
      30,
      (t) => {
        ribbons(rb, rf, W / 2, c.catY, t, rib.v);
        trails(tr, tails, t, rib.v);
        beam.clear();
        if (col.v > 0.01) {
          beam.poly([mx - 120, my, mx + 120, my, W / 2 + 330, H + 40, W / 2 - 330, H + 40]).fill({ color: 0xfff0d0, alpha: 0.1 * col.v });
          beam.poly([mx - 60, my, mx + 60, my, W / 2 + 200, H + 40, W / 2 - 200, H + 40]).fill({ color: 0xfff0d0, alpha: 0.1 * col.v });
        }
      },
      0.6,
    );
    const land = headline(c, comic('¡LA LUNA ERA UN PLATO!', GOLD, 120), '…llegó tarde, pero llegó.', { maxW: 820 });
    S.set(c, { rf, rb, bowl, mg, mx, my, land });
    if (c.short) return;

    const chiing = pre(c, comic('¡CHIIING!', 0xffd6e4, 110), 1460, 300, 0.08);
    const [wx, wy] = onCat(c, WAND[0], WAND[1]);
    const tilin = pre(c, comic('¡TILÍN!', GOLD, 92), wx - 180, wy - 30, -0.12);
    const grr = pre(c, balloon('…grrr', { size: 40, tx: 60, ty: 80, fill: 0xfff0f6 }), ...onCat(c, 0.9, 0.12), 0.06);
    // a column of moonlight comes down on her; the ribbons spiral up
    at(c, 0.12, () => {
      sfx('charge', 1.3);
      if (c.reduce) {
        col.v = rib.v = 1;
        return;
      }
      gsap.to(col, { v: 1, duration: 0.3 });
      gsap.to(rib, { v: 1, delay: 0.15, duration: 1.1, ease: 'power1.inOut' });
    });
    // stars and sparkles rise
    for (let i = 0; i < 12; i++)
      at(c, 0.3 + i * 0.09, () => {
        if (c.reduce) return;
        const g = new Graphics();
        if (i % 3 === 0) g.poly(star5(0, 0, 20)).fill(GOLD).stroke({ width: 3, color: C.ink, join: 'round' });
        else g.poly(twinkle(0, 0, 18 + (i % 2) * 8)).fill(i % 2 ? 0xffffff : 0xffd6e4);
        const x = W / 2 + (Math.random() - 0.5) * 640;
        g.position.set(x, c.catY + 280);
        c.fg.addChild(g);
        gsap.to(g, { y: c.catY - 320 - Math.random() * 120, x: x + (Math.random() - 0.5) * 80, rotation: 2, duration: 1.0, ease: 'power1.out' });
        gsap.to(g, { alpha: 0, delay: 0.7, duration: 0.3, onComplete: () => destroyTree(g) });
      });
    at(c, 0.6, () => {
      chiing(0.75);
      sfx('gem', 1.6);
      later(c, 0.08, () => sfx('gem', 2.0));
    });
    // the wand's crescent bell
    at(c, 1.35, () => {
      const g = glint(new Graphics(), 0, 0, 80, 0xfff6c8);
      g.position.set(wx, wy);
      c.fg.addChild(g);
      tilin(0.7, { from: 1.5 });
      sfx('gem', 2.6);
      later(c, 0.12, () => sfx('gem', 3.1));
      if (!c.reduce) gsap.fromTo(g.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.15, ease: 'back.out(2)' });
      gsap.to(g, { alpha: 0, delay: 0.4, duration: 0.3, onComplete: () => g.destroy() });
      burst(c, c.fg, (i) => new Graphics().poly(i % 2 ? twinkle(0, 0, 14) : heartPts(0, 0, 12, 8)).fill(i % 2 ? 0xffffff : PINK), 10, wx, wy, 260, 0.8);
    });
    // …and her tummy growls
    at(c, 1.8, () => {
      grr(0.7);
      sfx('purr', 0.7);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.15);
    sfx('bigboom', 0.7);
    c.shaker.add(0.35);
    flashOf(c, 0xfff0f6, 0.45, 0.35);
    if (st) {
      // the ribbons step aside for her colors
      if (!st.rf.destroyed) gsap.to(st.rf, { alpha: 0, duration: c.reduce ? 0 : 0.25 });
      if (!st.rb.destroyed) gsap.to(st.rb, { alpha: 0.55, duration: c.reduce ? 0 : 0.4 });
    }
    if (st && !st.mg.destroyed) {
      // the twist: the moon tips over — it is a full bowl
      const mg = st.mg;
      if (c.reduce) moon(mg, 230, (st.bowl.v = 1));
      else {
        gsap.to(st.bowl, { v: 1, duration: 0.45, ease: 'back.out(1.6)', onUpdate: () => !mg.destroyed && moon(mg, 230, st.bowl.v) });
        gsap.fromTo(mg, { rotation: -0.25 }, { rotation: 0, duration: 0.5, ease: 'back.out(2)' });
      }
      sfx('nyam', 1.1);
    }
    // her four friends arrive as four shooting stars
    const cols = [0x4aa8ff, 0xff4a5a, 0x4adb7a, 0xffa53a];
    const from: [number, number][] = [
      [-200, 60],
      [W + 200, 80],
      [-200, H - 140],
      [W + 200, H - 120],
    ];
    cols.forEach((cl, i) =>
      later(c, 0.15 + i * 0.12, () => {
        const g = new Graphics();
        const [x0, y0] = from[i];
        const tx = W / 2 + (i % 2 ? 380 : -380);
        const ty = c.catY + (i < 2 ? -260 : 200);
        g.poly(streak(0, 0, x0 - tx > 0 ? 160 : -160, (y0 - ty) * 0.15, 14, 2)).fill({ color: cl, alpha: 0.7 });
        g.poly(star5(0, 0, 26)).fill(cl).stroke({ width: 4, color: 0xffffff, join: 'round' });
        g.position.set(x0, y0);
        c.fg.addChild(g);
        sfx('zap', 1.4 + i * 0.1);
        if (c.reduce) {
          g.position.set(tx, ty);
          gsap.to(g, { alpha: 0, delay: 1.2, duration: 0.3, onComplete: () => destroyTree(g) });
          return;
        }
        gsap.to(g, { x: tx, y: ty, duration: 0.4, ease: 'power2.out' });
        gsap.to(g.scale, { x: 1.4, y: 1.4, delay: 0.4, duration: 0.15, yoyo: true, repeat: 1 });
        gsap.to(g, { alpha: 0, delay: 1.4, duration: 0.4, onComplete: () => destroyTree(g) });
      }),
    );
    // croquettes rain
    fall(
      c,
      c.fg,
      (i) => {
        const g = new Graphics();
        if (i % 3 === 0) g.poly([0, -14, 14, 10, -14, 10]).fill(KIBBLE).stroke({ width: 3, color: C.ink, join: 'round' });
        else g.poly(blob(0, 0, 14, 11, 200 + i, 9, 0.15)).fill(i % 2 ? KIBBLE : 0x8a5228).stroke({ width: 3, color: C.ink, join: 'round' });
        return g;
      },
      { n: 30, over: 1.6, dur: 1.4, bounce: true, spin: 5 },
    );
    if (st) st.land({ dur: 2.5 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const L: Lay = { w, h, cx: w / 2, u };
    const bg = new Graphics();
    city(bg, L);
    const sk = new Graphics();
    skyline(sk, L);
    const mg = new Graphics();
    moon(mg, 230 * u, 0);
    mg.scale.set(1);
    mg.position.set(w / 2 - Math.min(w * 0.32, h * 0.72), h * 0.3);
    const tw = new Graphics();
    k.addChild(bg, mg, sk, tw);
    if (live) {
      const r = rng(9);
      const spots = Array.from({ length: 14 }, () => [r() * w, r() * h * 0.6, r() * 6]);
      liveLoop(k, (t) => {
        tw.clear();
        spots.forEach(([x, y, p], i) => {
          const v = Math.max(0, Math.sin(t * 2 + p));
          if (v > 0.05) tw.poly(twinkle(x, y, (8 + (i % 3) * 5) * Math.max(0.5, u * 1.5) * v)).fill({ color: i % 3 ? 0xffffff : 0xffd6e4, alpha: v });
        });
        // a shooting star now and then
        const q = (t % 4) / 0.6;
        if (q < 1) tw.poly(streak(w * (0.15 + q * 0.4), h * (0.1 + q * 0.12), w * (0.15 + q * 0.4) - 120 * u, h * (0.1 + q * 0.12) - 30 * u, 3 * u + 1, 0.5)).fill({ color: 0xffffff, alpha: 1 - q });
      });
    }
    return k;
  },
};
