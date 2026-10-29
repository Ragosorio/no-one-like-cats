/**
 * Miauzart, el Niño Prodigio: the concert-hall universe (a rococo salon, Vienna, 1762). Pale walls, gilded scrollwork,
 * tall mirrors and arched windows at dusk, two crystal chandeliers, a diamond parquet. A harpsichord with its lid open
 * (a landscape painted inside, black naturals, white sharps) plays by itself: its keys go down on their own, a little
 * minuet rings and the notes fly out across the room (¡TIN-TIN-TÁN!). The candles light one by one, in time, from
 * chandelier to chandelier, and the salon warms up with them; his baton sparkles on every beat. In the front rows a
 * public of white powdered wigs — with cat ears poking through — rises to its feet: ¡OOOH!
 * Payoff: every candle flares, petals and roses rain, the wigs bob; ¡BRAVO, MICHI! / …lo compuso durante la siesta.
 * (A public-domain composer evoked through his salon and instrument; he is a cat. The tune is a generic minuet run.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, fall, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { mix, rng, stash, vgrad } from './kitB';
import { ngon, onCat, twinkle } from './kitD';
import { at, comic, note, petalPts, pre, rose, wrap } from './kitI';
import { glow, headline, loop } from './kitK';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const GOLD = 0xe6c34a;
const GOLD_D = 0xa8822a;
const RED = 0xb32a22;
const CREAM = 0xf4f1ea;
const WALL = 0xe6e2cc;
const MINT = 0xcfe0d2;
const FLAME = 0xffd27a;
/** the baton's tip on the painting (measured on the integrated SVG) */
const BATON: [number, number] = [0.09, 0.124];
/** a minuet run (semitones over the base pitch), one note per lit candle */
const TUNE = [0, 7, 4, 0, 2, 4, 5, 7, 9, 7, 12, 7];

interface Lay {
  w: number;
  h: number;
  cx: number;
  u: number;
}
const X = (l: Lay, x: number) => l.cx + (x - 960) * l.u;
const Y = (l: Lay, y: number) => y * l.u;

/** a gilded rocaille frame (a rectangle with an arched top), drawn as polygons: outer gold, inner shade */
function arched(x: number, y: number, w: number, h: number, n = 10): number[] {
  const p: number[] = [x, y + h, x, y + w / 2];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    p.push(x + w / 2 + Math.cos(a) * (w / 2), y + w / 2 + Math.sin(a) * (w / 2));
  }
  p.push(x + w, y + h);
  return p;
}

/** the salon: walls with bays (mirrors / windows in gilded arches), cornice, parquet (static) */
function salon(g: Graphics, l: Lay) {
  const fl = Y(l, 760);
  g.rect(0, 0, l.w, fl).fill(WALL);
  // the cornice and its gold moulding
  g.rect(0, 0, l.w, Y(l, 70)).fill(0xd8d2b6).rect(0, Y(l, 62), l.w, Y(l, 14)).fill(GOLD).rect(0, Y(l, 76), l.w, Y(l, 6)).fill(GOLD_D);
  // bays: a pilaster, then a mirror or a dusk window in a gilded arch, a panel under it
  const bay = 320 * l.u;
  const n = Math.ceil(l.w / bay / 2) + 1;
  for (let i = -n; i <= n; i++) {
    const bx = l.cx + i * bay;
    // pilaster
    g.rect(bx - bay / 2 - 18 * l.u, Y(l, 82), 36 * l.u, fl - Y(l, 82)).fill(0xd6d0b4);
    g.rect(bx - bay / 2 - 10 * l.u, Y(l, 100), 4 * l.u, fl - Y(l, 140)).fill(GOLD).rect(bx - bay / 2 + 6 * l.u, Y(l, 100), 4 * l.u, fl - Y(l, 140)).fill(GOLD);
    const fw = 200 * l.u;
    const fx = bx - fw / 2;
    const fy = Y(l, 140);
    const fh = Y(l, 430);
    g.poly(arched(fx - 14 * l.u, fy - 14 * l.u, fw + 28 * l.u, fh + 28 * l.u)).fill(GOLD);
    g.poly(arched(fx - 4 * l.u, fy - 4 * l.u, fw + 8 * l.u, fh + 8 * l.u)).fill(GOLD_D);
    const win = i % 2 !== 0;
    if (win) {
      g.poly(arched(fx, fy, fw, fh)).fill(0x46588a);
      g.poly(arched(fx, fy + fh * 0.45, fw, fh * 0.55)).fill({ color: 0xe0907a, alpha: 0.55 });
      g.rect(fx + fw / 2 - 3 * l.u, fy, 6 * l.u, fh).fill(0xf0ead6).rect(fx, fy + fh * 0.5, fw, 6 * l.u).fill(0xf0ead6);
    } else {
      g.poly(arched(fx, fy, fw, fh)).fill(0xbfd2d6);
      g.poly([fx + fw * 0.15, fy + fh, fx + fw * 0.55, fy + fh * 0.2, fx + fw * 0.75, fy + fh * 0.25, fx + fw * 0.35, fy + fh]).fill({ color: 0xffffff, alpha: 0.35 });
    }
    // the rocaille crest on top of the arch: a shell fan and two scrolls
    const sx = bx;
    const sy = fy - 18 * l.u;
    for (let j = 0; j < 7; j++) {
      const a = Math.PI + 0.25 + (j / 6) * (Math.PI - 0.5);
      g.poly([sx, sy, sx + Math.cos(a - 0.12) * 46 * l.u, sy + Math.sin(a - 0.12) * 46 * l.u, sx + Math.cos(a + 0.12) * 46 * l.u, sy + Math.sin(a + 0.12) * 46 * l.u]).fill(j % 2 ? GOLD : GOLD_D);
    }
    g.poly(ngon(sx - 70 * l.u, sy + 8 * l.u, 18 * l.u, 12 * l.u, 8)).fill(GOLD).poly(ngon(sx + 70 * l.u, sy + 8 * l.u, 18 * l.u, 12 * l.u, 8)).fill(GOLD);
    // the dado panel
    g.rect(fx - 10 * l.u, Y(l, 620), fw + 20 * l.u, Y(l, 110)).fill(MINT);
    g.rect(fx - 10 * l.u, Y(l, 620), fw + 20 * l.u, 5 * l.u).fill(GOLD).rect(fx - 10 * l.u, Y(l, 725), fw + 20 * l.u, 5 * l.u).fill(GOLD);
  }
  g.rect(0, fl - Y(l, 14), l.w, Y(l, 14)).fill(GOLD_D);
  // the diamond parquet in perspective
  const vx = l.cx;
  const vy = Y(l, 300);
  const rows = 6;
  const tile = 120 * l.u;
  for (let j = 0; j < rows; j++) {
    const y0 = fl + (l.h - fl) * Math.pow(j / rows, 1.5);
    const y1 = fl + (l.h - fl) * Math.pow((j + 1) / rows, 1.5);
    const k0 = (y0 - vy) / (fl - vy);
    const k1 = (y1 - vy) / (fl - vy);
    const span = Math.ceil(l.w / 2 / tile / k1) + 2;
    for (let i = -span; i < span; i++) {
      const xa0 = vx + i * tile * k0;
      const xb0 = vx + (i + 1) * tile * k0;
      const xa1 = vx + i * tile * k1;
      const xb1 = vx + (i + 1) * tile * k1;
      const mx0 = (xa0 + xb0) / 2;
      const mx1 = (xa1 + xb1) / 2;
      const ym = (y0 + y1) / 2;
      const xl = (xa0 + xa1) / 2;
      const xr = (xb0 + xb1) / 2;
      const base = (i + j) % 2 ? 0xa8743a : 0x8a5a2a;
      g.poly([xa0, y0, xb0, y0, xb1, y1, xa1, y1]).fill(base);
      g.poly([mx0, y0, xr, ym, mx1, y1, xl, ym]).fill(mix(base, 0xd8a868, 0.35));
    }
  }
}

/** a chandelier hanging from the cornice at (x, top): chain, gilded tiers, crystal drops, `n` arms; returns candle tips */
function chandelier(g: Graphics, x: number, y: number, s: number, n = 6): [number, number][] {
  g.rect(x - 3 * s, 0, 6 * s, y).fill(GOLD_D);
  g.poly(ngon(x, y + 20 * s, 34 * s, 16 * s, 12)).fill(GOLD);
  g.poly([x - 16 * s, y + 30 * s, x + 16 * s, y + 30 * s, x + 6 * s, y + 110 * s, x - 6 * s, y + 110 * s]).fill(GOLD_D);
  g.poly(ngon(x, y + 120 * s, 46 * s, 14 * s, 12)).fill(GOLD);
  const tips: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1)) * Math.PI;
    const ex = x + Math.cos(a) * 150 * s;
    const ey = y + 110 * s - Math.sin(a) * 26 * s;
    // the arm: a sagging curve as a strip, a drip cup, a candle
    const mx = (x + ex) / 2;
    const my = y + 150 * s;
    g.poly([x, y + 118 * s, mx, my, ex, ey + 6 * s, ex, ey - 2 * s, mx, my - 8 * s, x, y + 110 * s]).fill(GOLD);
    g.poly(ngon(ex, ey, 16 * s, 6 * s, 8)).fill(GOLD_D);
    g.rect(ex - 5 * s, ey - 46 * s, 10 * s, 46 * s).fill(CREAM);
    tips.push([ex, ey - 48 * s]);
    // crystal drops
    g.poly([mx, my + 2 * s, mx + 6 * s, my + 14 * s, mx, my + 30 * s, mx - 6 * s, my + 14 * s]).fill({ color: 0xe8f4ff, alpha: 0.9 });
  }
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 16 * s;
    g.poly([x + dx, y + 132 * s, x + dx + 6 * s, y + 148 * s, x + dx, y + 170 * s - Math.abs(i - 2) * 8 * s, x + dx - 6 * s, y + 148 * s]).fill({ color: 0xe8f4ff, alpha: 0.9 });
  }
  return tips;
}

/** the candle flames (and their halos) for the candles that are lit: `lit[i]` 0..1 */
function flames(g: Graphics, tips: [number, number][], lit: number[], t: number, s: number) {
  g.clear();
  tips.forEach(([x, y], i) => {
    const v = lit[i] ?? 0;
    if (v < 0.02) return;
    const fl = 1 + Math.sin(t * 13 + i * 1.7) * 0.12;
    glow(g, x, y, 70 * s * v, FLAME, 0.35 * v, 4, 12);
    g.poly([x, y - 22 * s * fl * v, x + 7 * s, y - 2 * s, x, y + 5 * s, x - 7 * s, y - 2 * s]).fill({ color: FLAME, alpha: v });
    g.poly([x, y - 10 * s * fl * v, x + 3 * s, y, x, y + 3 * s, x - 3 * s, y]).fill({ color: 0xffffff, alpha: v });
  });
}

/** the harpsichord (origin at the keyboard's left end, facing us): wing case, open lid painted inside, gilded legs */
function harpsichord(s: number) {
  const k = new Container();
  const g = new Graphics();
  const ink = { width: 4 * s, color: 0x2a140a, join: 'round' as const };
  const P = (pts: number[]) => pts.map((v) => v * s);
  // gilded cabriole legs
  for (const lx of [16, 210, 400]) g.poly(P([lx, 50, lx + 22, 50, lx + 14, 120, lx + 22, 196, lx + 6, 196, lx + 2, 120])).fill(GOLD).stroke(ink);
  // the lid, hinged along the far edge and propped open: its inside painted with a landscape
  // (the lid has the case's wing shape: long straight spine at the hinge, the curved bentside up top, narrow at the tail)
  g.poly(P([0, -46, 456, -10, 450, -40, 400, -96, 300, -160, 170, -214, 40, -244, 0, -236])).fill(RED).stroke(ink);
  g.poly(P([16, -56, 430, -22, 424, -44, 384, -92, 290, -150, 166, -200, 46, -228, 16, -222])).fill(0x9cc4dc);
  g.poly(P([16, -56, 430, -22, 418, -52, 330, -82, 250, -70, 170, -110, 90, -96, 16, -120])).fill(0x6a9a5a);
  g.poly(P([16, -56, 430, -22, 424, -34, 300, -60, 160, -56, 16, -76])).fill(0x4a7a44);
  g.poly(P([150, -170, 190, -180, 220, -166, 190, -156])).fill({ color: 0xffffff, alpha: 0.85 });
  g.poly(P([70, -196, 100, -204, 120, -194, 96, -186])).fill({ color: 0xffffff, alpha: 0.7 });
  // the prop stick
  g.poly(P([244, -36, 252, -36, 262, -150, 254, -150])).fill(0x5a2a10);
  // the soundboard (top), seen from a little above, and the case's long side in red lacquer with a gold band
  g.poly(P([0, -4, 0, -46, 300, -52, 400, -36, 456, -10, 444, 0])).fill(0xd8b67a).stroke(ink);
  g.poly(P([150, -30, 150, -44, 296, -48, 300, -34])).fill({ color: 0x8a6a3a, alpha: 0.5 });
  g.poly(P([0, 0, 444, 0, 456, -10, 456, 50, 0, 50])).fill(RED).stroke(ink);
  g.rect(0, 30 * s, 456 * s, 8 * s).fill(GOLD);
  g.poly(P([0, 4, 456, 4, 456, 10, 0, 10])).fill({ color: 0xffffff, alpha: 0.18 });
  // the keyboard well at the near end
  g.rect(-6 * s, -10 * s, 150 * s, 42 * s).fill(0x2a140a);
  const keys = new Graphics();
  keys.position.set(0, -4 * s);
  k.addChild(g, keys);
  return { k, keys };
}

/** the keys (black naturals, white sharps); `down` = the index pressed (−1: none) */
function drawKeys(g: Graphics, s: number, down: number[]) {
  g.clear();
  const n = 14;
  const kw = (140 * s) / n;
  for (let i = 0; i < n; i++) {
    const d = down.includes(i);
    g.rect(i * kw + 1 * s, d ? 4 * s : 0, kw - 2 * s, 30 * s).fill(d ? 0x5a4a3a : 0x161210);
  }
  for (let i = 0; i < n - 1; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) g.rect((i + 0.68) * kw, -2 * s, kw * 0.64, 16 * s).fill(0xf4ecd8);
}

/** one listener seen from behind: a white powdered wig with side curls, a black bow — and cat ears through it */
function wig(g: Graphics, x: number, y: number, s: number, tone = 0) {
  const wc = mix(0xf2efe6, 0xd8d2c4, tone);
  g.poly([x - 34 * s, y - 50 * s, x - 22 * s, y - 86 * s, x - 10 * s, y - 56 * s]).fill(wc);
  g.poly([x + 34 * s, y - 50 * s, x + 22 * s, y - 86 * s, x + 10 * s, y - 56 * s]).fill(wc);
  g.poly([x - 30 * s, y - 52 * s, x - 22 * s, y - 76 * s, x - 14 * s, y - 56 * s]).fill(0xe6b8b0);
  g.poly([x + 30 * s, y - 52 * s, x + 22 * s, y - 76 * s, x + 14 * s, y - 56 * s]).fill(0xe6b8b0);
  g.poly(ngon(x, y - 30 * s, 44 * s, 42 * s, 14)).fill(wc);
  for (const sd of [-1, 1]) for (let j = 0; j < 2; j++) g.poly(ngon(x + sd * 44 * s, y - 20 * s + j * 22 * s, 14 * s, 10 * s, 8)).fill(mix(wc, 0xbab2a2, 0.3));
  g.rect(x - 6 * s, y - 2 * s, 12 * s, 40 * s).fill(0x1a1a1a);
  g.poly([x, y + 4 * s, x - 22 * s, y - 8 * s, x - 22 * s, y + 16 * s]).fill(0x1a1a1a).poly([x, y + 4 * s, x + 22 * s, y - 8 * s, x + 22 * s, y + 16 * s]).fill(0x1a1a1a);
  g.poly([x - 60 * s, y + 20 * s, x + 60 * s, y + 20 * s, x + 70 * s, y + 90 * s, x - 70 * s, y + 90 * s]).fill(mix(0x5a2a3a, 0x2a3a5a, tone));
}

/** the public: two rows of wigs from behind; `rise` 0..1 = standing up, `bob` a little head bob */
function crowd(g: Graphics, l: Lay, rise: number, bob: number, t: number) {
  g.clear();
  const r = rng(41);
  for (let row = 0; row < 2; row++) {
    const n = 11 - row;
    for (let i = 0; i < n; i++) {
      const x = l.cx + (i - (n - 1) / 2) * 190 * l.u + (r() - 0.5) * 30 * l.u;
      const s = (row ? 1.18 : 0.98) * l.u;
      const y0 = Y(l, row ? 1070 : 990);
      const y = y0 - rise * (row ? 70 : 54) * l.u - Math.abs(Math.sin(t * 6 + i * 1.3)) * bob * 14 * l.u;
      wig(g, x, y, s, r() * 0.6);
    }
  }
}

interface St {
  lit: number[];
  rise: { v: number };
  bob: { v: number };
  notes: Container;
  hx: number;
  hy: number;
  land: (o?: { dur?: number; slow?: boolean }) => void;
}
const S = stash<St>();

export const miauzart: Signature = {
  dark: false,
  frame: RED,
  tag: 'UNIVERSO DEL SALÓN DE CONCIERTOS',
  open(c: SigCtx) {
    const L: Lay = { w: W, h: H, cx: W / 2, u: 1 };
    const k = new Container();
    const bg = new Graphics();
    salon(bg, L);
    const dusk = vgrad(new Graphics(), -200, -200, W + 400, H + 400, [0x141a3e, 0x26203e], 2);
    const ch = new Graphics();
    const tips = [...chandelier(ch, 560, 96, 1.45), ...chandelier(ch, 1360, 96, 1.45)];
    // light order: outward from the middle, alternating chandeliers
    const order = [5, 6, 4, 7, 3, 8, 2, 9, 1, 10, 0, 11];
    const fl = new Graphics();
    const hp = harpsichord(1.05);
    hp.k.position.set(1230, 700);
    const notes = new Container();
    const cw = new Graphics();
    k.addChild(bg, dusk, ch, fl, hp.k, notes, cw);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const instant = c.short || c.reduce;
    const lit = tips.map(() => (instant ? 1 : 0));
    const rise = { v: instant ? 1 : 0 };
    const bob = { v: 0 };
    dusk.alpha = instant ? 0 : 0.6;
    const down: number[] = [];
    loop(
      c,
      fl,
      30,
      (t) => {
        flames(fl, tips, lit, t, 1.45);
        drawKeys(hp.keys, 1.05, down);
        crowd(cw, L, rise.v, bob.v, t);
      },
      0.3,
    );
    const land = headline(c, comic('¡BRAVO, MICHI!', GOLD, 132), '…lo compuso durante la siesta.');
    S.set(c, { lit, rise, bob, notes, hx: 1300, hy: 690, land });
    if (c.short) return;

    const tin = pre(c, comic('¡TIN-TIN-TÁN!', CREAM, 96), 1460, 330, 0.08);
    const ooh = pre(c, comic('¡OOOH!', 0xffe9a8, 110), 470, 800, -0.08);
    const [bx, by] = onCat(c, BATON[0], BATON[1]);
    // the minuet: a candle lights on each note, a key goes down, a note flies out, the baton sparkles
    const beat = 0.15;
    order.forEach((ci, i) =>
      at(c, 0.1 + i * beat, () => {
        sfx('gem', Math.pow(2, TUNE[i] / 12) * 0.9);
        if (c.reduce) lit[ci] = 1;
        else gsap.to(lit, { [ci]: 1, duration: 0.12 });
        if (!c.reduce) gsap.to(dusk, { alpha: 0.6 * (1 - (i + 1) / order.length), duration: 0.15 });
        else dusk.alpha = 0;
        down.length = 0;
        down.push((TUNE[i] + 3) % 14);
        if (i % 2 === 0) {
          const tw = new Graphics().poly(twinkle(0, 0, 26)).fill(0xfff6c8);
          tw.position.set(bx, by);
          c.fg.addChild(tw);
          if (!c.reduce) gsap.fromTo(tw.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.1, yoyo: true, repeat: 1 });
          gsap.to(tw, { alpha: 0, delay: 0.14, duration: 0.1, onComplete: () => tw.destroy() });
        }
        if (!c.reduce) {
          const ng = new Graphics();
          note(ng, 0, 0, 64, i % 3 ? 0x2a140a : RED, i % 2 === 1);
          ng.position.set(1300, 690);
          notes.addChild(ng);
          const tx = 1500 - i * 110;
          gsap.to(ng, { x: tx, y: 240 + Math.sin(i) * 80, duration: 1.2, ease: 'sine.out' });
          gsap.to(ng, { rotation: (i % 2 ? 1 : -1) * 0.5, duration: 1.2 });
          gsap.to(ng, { alpha: 0, delay: 0.9, duration: 0.3, onComplete: () => destroyTree(ng) });
        }
        if (i === 2) tin(0.8);
      }),
    );
    at(c, 0.1 + order.length * beat, () => (down.length = 0));
    // the public rises to its feet
    at(c, 1.55, () => {
      ooh(0.65);
      sfx('meow', 1.3);
      later(c, 0.08, () => sfx('meow', 1.55));
      if (c.reduce) rise.v = 1;
      else gsap.to(rise, { v: 1, duration: 0.35, ease: 'back.out(2)' });
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.1);
    sfx('boom', 0.6);
    c.shaker.add(0.25);
    flashOf(c, 0xfff1c8, 0.35, 0.4);
    [0, 4, 7, 12].forEach((n, i) => later(c, i * 0.08, () => sfx('gem', Math.pow(2, n / 12))));
    if (st) {
      st.rise.v = 1;
      st.lit.forEach((_, i) => (st.lit[i] = 1.25));
      if (!c.reduce) {
        gsap.to(st.bob, { v: 1, duration: 0.2 });
        gsap.to(st.bob, { v: 0.3, delay: 1.6, duration: 0.6 });
      }
      // a burst of notes out of the harpsichord
      if (!c.reduce && !st.notes.destroyed)
        for (let i = 0; i < 10; i++) {
          const ng = new Graphics();
          note(ng, 0, 0, 76, i % 2 ? RED : 0x2a140a, i % 3 === 0);
          ng.position.set(st.hx, st.hy);
          st.notes.addChild(ng);
          const a = -Math.PI / 2 + (i / 9 - 0.5) * 2.4;
          gsap.to(ng, { x: st.hx + Math.cos(a) * 520, y: st.hy + Math.sin(a) * 420, duration: 1.3, ease: 'power2.out' });
          gsap.to(ng, { alpha: 0, delay: 1.0, duration: 0.3, onComplete: () => destroyTree(ng) });
        }
    }
    // petals and roses rain
    fall(c, c.fg, (i) => rose(new Graphics(), 0, 0, 18 + (i % 3) * 5, 0, i % 4 ? RED : 0xffffff), { n: 14, over: 1.4, dur: 1.6, spread: W * 1.05 });
    fall(c, c.back, (i) => new Graphics().poly(petalPts(18)).fill(i % 3 ? 0xe85a6a : 0xfff0f0), { n: 30, over: 2.2, dur: 2.4 });
    if (st) st.land({ dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const L: Lay = { w, h, cx: w / 2, u };
    const bg = new Graphics();
    salon(bg, L);
    const ch = new Graphics();
    const off = Math.min(w * 0.3, h * 0.55);
    const tips = [...chandelier(ch, w / 2 - off, 96 * u, 1.45 * u), ...chandelier(ch, w / 2 + off, 96 * u, 1.45 * u)];
    const fl = new Graphics();
    const lit = tips.map(() => 1);
    flames(fl, tips, lit, 0, 1.45 * u);
    const hp = harpsichord(1.05 * u);
    hp.k.position.set(w / 2 + Math.min(w * 0.18, h * 0.3), h * 0.66);
    drawKeys(hp.keys, 1.05 * u, []);
    const cw = new Graphics();
    crowd(cw, L, 0, 0, 0);
    k.addChild(bg, ch, fl, hp.k, cw);
    if (live) {
      let last = -1;
      liveLoop(k, (t) => {
        flames(fl, tips, lit, t, 1.45 * u);
        const i = Math.floor(t * 4) % TUNE.length;
        if (i !== last) {
          drawKeys(hp.keys, 1.05 * u, [(TUNE[i] + 3) % 14]);
          last = i;
        }
      });
    }
    return k;
  },
};

