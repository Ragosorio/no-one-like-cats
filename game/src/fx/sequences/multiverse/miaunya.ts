/**
 * Miaunya: the secret universe (a 2020s spy-family anime). A kraft dossier fills the screen — «OPERACIÓN BIGOTES»,
 * ULTRASECRETO — and flips open onto a perfect mid-century living room (teal wallpaper, mustard sofa, cone lamp, the
 * family photo) with an evidence board strung in red. Stamps slam; the family's thoughts float up in bubbles (a fish,
 * a water pistol, a peanut); her eyes glow green and telepathy ripples out of her head: ¡JE! Payoff: sparkles and
 * peanuts, the stamp MISIÓN: ADORABLE; ¡MIAKU MIAKU!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, drizzle, every, later, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash } from './kitB';
import { ngon, onCat, rnd, streak, twinkle } from './kitD';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const WALL = 0x4f8a7e;
const WALL_D = 0x467c71;
const WOOD = 0x8a5a36;
const MUSTARD = 0xd9a63a;
const PINK = 0xf7a1c4;
const HOT = 0xff6fae;
const RED = 0xc8202e;
const KRAFT = 0xd9b77a;
const GREEN = 0x5cff9a;

/** the living room (one Graphics): wallpaper, floor, window, sofa, cone lamp, the family photo, the evidence board */
function room(g: Graphics, w: number, h: number, k: number, cx: number) {
  const floor = h * 0.78;
  g.rect(0, 0, w, floor).fill(WALL);
  for (let x = 0; x < w; x += 60 * k) g.rect(x, 0, 26 * k, floor).fill(WALL_D);
  g.rect(0, floor - 26 * k, w, 26 * k).fill(0xf2e6cc);
  g.rect(0, floor, w, h - floor).fill(WOOD);
  for (let y = floor + 30 * k; y < h; y += 34 * k) g.rect(0, y, w, 3 * k).fill(0x6e4428);
  for (let i = 0; i < Math.ceil(w / (220 * k)) + 1; i++) g.rect(i * 220 * k + ((i * 97) % 3) * 40 * k, floor, 3 * k, h - floor).fill(0x6e4428);
  // the window, left of center, with its curtains and a sunny sky
  const wx = cx - 620 * k;
  const wy = 120 * k;
  g.rect(wx - 12 * k, wy - 12 * k, 344 * k, 424 * k).fill(0xf2e6cc);
  g.rect(wx, wy, 320 * k, 400 * k).fill(0x9fd8f0);
  g.poly([wx, wy + 300 * k, wx + 80 * k, wy + 240 * k, wx + 150 * k, wy + 280 * k, wx + 230 * k, wy + 210 * k, wx + 320 * k, wy + 260 * k, wx + 320 * k, wy + 400 * k, wx, wy + 400 * k]).fill(0x8ab6c8);
  g.rect(wx + 154 * k, wy, 12 * k, 400 * k).fill(0xf2e6cc).rect(wx, wy + 194 * k, 320 * k, 12 * k).fill(0xf2e6cc);
  g.poly([wx - 60 * k, wy - 30 * k, wx + 40 * k, wy - 30 * k, wx + 10 * k, wy + 440 * k, wx - 80 * k, wy + 440 * k]).fill(0xc85a4a);
  g.poly([wx + 280 * k, wy - 30 * k, wx + 380 * k, wy - 30 * k, wx + 400 * k, wy + 440 * k, wx + 310 * k, wy + 440 * k]).fill(0xc85a4a);
  g.rect(wx - 90 * k, wy - 44 * k, 500 * k, 18 * k).fill(0x6e4428);
  // the family photo over the sofa (three silhouettes and a big dog: nobody's face)
  const fx = cx + 330 * k;
  const fy = 150 * k;
  g.rect(fx - 110 * k, fy - 80 * k, 220 * k, 160 * k).fill(0xb8863a).rect(fx - 96 * k, fy - 66 * k, 192 * k, 132 * k).fill(0xf6ead2);
  for (const [dx, hh] of [
    [-50, 92],
    [0, 70],
    [44, 96],
  ] as const) {
    g.poly(ngon(fx + dx * k, fy + (52 - hh) * k, 14 * k, 14 * k, 10)).fill(0x4a3a3a);
    g.poly([fx + (dx - 22) * k, fy + 64 * k, fx + (dx - 16) * k, fy + (64 - hh + 22) * k, fx + (dx + 16) * k, fy + (64 - hh + 22) * k, fx + (dx + 22) * k, fy + 64 * k]).fill(0x4a3a3a);
  }
  g.poly(ngon(fx + 78 * k, fy + 40 * k, 24 * k, 20 * k, 10)).fill(0xf2f2f2);
  // the sofa behind him: mustard, long, with button tufts
  const sy = floor - 30 * k;
  g.roundRect(cx - 520 * k, sy - 250 * k, 1040 * k, 170 * k, 40 * k).fill(MUSTARD);
  g.roundRect(cx - 560 * k, sy - 120 * k, 1120 * k, 120 * k, 30 * k).fill(0xc8932e);
  g.roundRect(cx - 600 * k, sy - 200 * k, 110 * k, 210 * k, 40 * k).fill(MUSTARD).roundRect(cx + 490 * k, sy - 200 * k, 110 * k, 210 * k, 40 * k).fill(MUSTARD);
  for (let i = 0; i < 6; i++) g.poly(ngon(cx - 400 * k + i * 160 * k, sy - 170 * k, 6 * k, 6 * k, 6)).fill(0x9a6a1e);
  g.rect(cx - 520 * k, sy, 24 * k, 30 * k).fill(0x3a2a1a).rect(cx + 496 * k, sy, 24 * k, 30 * k).fill(0x3a2a1a);
  // the cone lamp (mid-century), right of the sofa
  const lx = cx + 760 * k;
  g.poly(streak(lx, floor, lx - 20 * k, floor - 520 * k, 4 * k, 4 * k)).fill(0x2a2a2a);
  g.poly([lx - 90 * k, floor - 520 * k, lx + 50 * k, floor - 520 * k, lx + 10 * k, floor - 620 * k, lx - 50 * k, floor - 620 * k]).fill(0xf2e6cc);
  g.poly([lx - 90 * k, floor - 520 * k, lx + 50 * k, floor - 520 * k, lx + 160 * k, floor - 200 * k, lx - 200 * k, floor - 200 * k]).fill({ color: 0xfff2c0, alpha: 0.12 });
  g.poly([lx - 40 * k, floor, lx, floor - 20 * k, lx + 40 * k, floor]).fill(0x2a2a2a);
  // the evidence board on the right wall: cork, pinned photos and notes, red string
  const bx = cx + 620 * k;
  const by = 330 * k;
  g.rect(bx, by, 300 * k, 220 * k).fill(0x6e4428).rect(bx + 10 * k, by + 10 * k, 280 * k, 200 * k).fill(0xc89a5e);
  const pins: [number, number][] = [
    [bx + 50 * k, by + 50 * k],
    [bx + 200 * k, by + 40 * k],
    [bx + 120 * k, by + 140 * k],
    [bx + 240 * k, by + 160 * k],
  ];
  pins.forEach(([px, py], i) => {
    g.rect(px - 30 * k, py - 20 * k, 60 * k, 46 * k).fill(i % 2 ? 0xf6ead2 : 0xffffff);
    if (i % 2 === 0) g.poly(ngon(px, py + 2 * k, 10 * k, 10 * k, 8)).fill(0x5a5a5a);
    else for (let j = 0; j < 3; j++) g.rect(px - 22 * k, py - 8 * k + j * 12 * k, 44 * k, 5 * k).fill(C.ink);
  });
  for (const [a, b] of [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 2],
  ] as const)
    g.poly(streak(pins[a][0], pins[a][1] - 18 * k, pins[b][0], pins[b][1] - 18 * k, 1.5 * k, 1.5 * k)).fill(RED);
  for (const [px, py] of pins) g.poly(ngon(px, py - 18 * k, 6 * k, 6 * k, 8)).fill(RED);
}

/** a rubber stamp: a double-lined rounded box and heavy letters, in `color` */
function stamp(text: string, color: number, size = 64) {
  const k = new Container();
  const t = txt(text, { fontFamily: F.heavy, fontSize: size, fill: color, letterSpacing: 4 });
  t.anchor.set(0.5);
  const g = new Graphics();
  const bw = t.width / 2 + size * 0.5;
  const bh = t.height / 2 + size * 0.22;
  g.roundRect(-bw, -bh, bw * 2, bh * 2, size * 0.2).stroke({ width: size / 9, color });
  g.roundRect(-bw + size * 0.16, -bh + size * 0.16, bw * 2 - size * 0.32, bh * 2 - size * 0.32, size * 0.12).stroke({ width: size / 22, color });
  k.addChild(g, t);
  k.alpha = 0.88;
  return k;
}

/** a peanut (a waisted shell with its grid of dimples), drawn into g at (x, y) */
function drawPeanut(g: Graphics, x: number, y: number, s: number) {
  g.poly(ngon(x - s * 0.42, y, s * 0.5, s * 0.44, 12)).fill(0xd9a86a).poly(ngon(x + s * 0.42, y, s * 0.46, s * 0.4, 12)).fill(0xd9a86a);
  g.rect(x - s * 0.2, y - s * 0.3, s * 0.4, s * 0.6).fill(0xd9a86a);
  for (let i = 0; i < 6; i++) g.poly(ngon(x - s * 0.7 + i * s * 0.28, y + (i % 2 ? -1 : 1) * s * 0.12, s * 0.05, s * 0.05, 5)).fill(0xa8783a);
  return g;
}
const peanut = (s: number) => drawPeanut(new Graphics(), 0, 0, s);

/** what each thought is: a fish, a water pistol, a peanut (drawn into g, about s wide) */
function icon(g: Graphics, kind: number, s: number) {
  if (kind === 0) {
    g.poly([-s * 0.45, 0, -s * 0.2, -s * 0.22, s * 0.2, -s * 0.2, s * 0.4, 0, s * 0.2, s * 0.2, -s * 0.2, s * 0.22]).fill(0xff8a3a);
    g.poly([s * 0.35, 0, s * 0.6, -s * 0.22, s * 0.6, s * 0.22]).fill(0xff8a3a);
    g.poly(ngon(-s * 0.26, -s * 0.04, s * 0.05, s * 0.05, 6)).fill(C.ink);
  } else if (kind === 1) {
    g.roundRect(-s * 0.5, -s * 0.2, s * 0.8, s * 0.26, s * 0.08).fill(0x3a8adf);
    g.rect(s * 0.28, -s * 0.13, s * 0.22, s * 0.1).fill(0xffd23f);
    g.poly([-s * 0.4, s * 0.04, -s * 0.12, s * 0.04, -s * 0.2, s * 0.45, -s * 0.46, s * 0.45]).fill(0x3a8adf);
    g.poly(ngon(-s * 0.3, -s * 0.26, s * 0.1, s * 0.08, 8)).fill(0xffd23f);
    for (let i = 0; i < 3; i++) g.poly(ngon(s * (0.62 + i * 0.12), -s * 0.08 + i * s * 0.03, s * 0.04, s * 0.04, 6)).fill(0x9fd8ff);
  } else drawPeanut(g, 0, 0, s * 0.7);
}

/** a thought bubble with its icon and the little trailing puffs toward (tx, ty) (relative) */
function thought(kind: number, s: number, tx: number, ty: number) {
  const k = new Container();
  const g = new Graphics();
  const lw = Math.max(2, s * 0.05);
  const blobs: [number, number, number][] = [
    [-0.32, 0.02, 0.36],
    [0, -0.14, 0.42],
    [0.32, 0, 0.36],
    [0.02, 0.16, 0.38],
  ];
  for (const [x, y, r] of blobs) g.poly(ngon(x * s, y * s, r * s, r * s * 0.86, 14)).fill(0xffffff).stroke({ width: lw, color: C.ink });
  for (const [x, y, r] of blobs) g.poly(ngon(x * s, y * s, r * s - lw, r * s * 0.86 - lw, 14)).fill(0xffffff);
  for (let i = 1; i <= 3; i++) {
    const u = 0.35 + i * 0.2;
    g.poly(ngon(tx * u, ty * u, s * (0.12 - i * 0.025), s * (0.1 - i * 0.02), 10)).fill(0xffffff).stroke({ width: lw * 0.8, color: C.ink });
  }
  icon(g, kind, s * 0.9);
  k.addChild(g);
  return k;
}

/** telepathy: wavy rings out of her head (pink and lavender), t = time */
function waves(g: Graphics, t: number, x: number, y: number, s: number) {
  g.clear();
  for (let i = 0; i < 3; i++) {
    const q = (t * 0.7 + i / 3) % 1;
    const r = s * (0.3 + q * 1.4);
    const pts: number[] = [];
    const N = 40;
    for (let j = 0; j < N; j++) {
      const a = (j / N) * Math.PI * 2;
      const rr = r * (1 + 0.05 * Math.sin(a * 9 + t * 6));
      pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8);
    }
    g.poly(pts, true).stroke({ width: Math.max(1.5, s * 0.03), color: i % 2 ? 0xc9a6ff : HOT, alpha: 0.8 * (1 - q) });
  }
}

/** the dossier's cover: kraft, a tab, OPERACIÓN BIGOTES, a paper clip and the red stamp */
function cover() {
  const k = new Container();
  const g = new Graphics();
  g.rect(0, 0, W, H).fill(KRAFT);
  g.rect(0, 0, W, 20).fill(0xc8a468);
  g.roundRect(120, 60, 520, 120, 18).fill(0xe6c890);
  for (let i = 0; i < 40; i++) g.rect(((i * 173) % W) + 0.5, ((i * 97) % H) + 0.5, 140, 2).fill({ color: 0xb8945a, alpha: 0.35 });
  g.roundRect(W - 360, -40, 60, 260, 30).stroke({ width: 10, color: 0x9aa0aa });
  g.roundRect(W - 345, -20, 30, 200, 15).stroke({ width: 8, color: 0x9aa0aa });
  const a = txt('EXPEDIENTE Nº 0-M', { fontFamily: F.ui, fontWeight: '700', fontSize: 40, fill: 0x5a4020 });
  a.position.set(150, 96);
  const b = txt('OPERACIÓN BIGOTES', { fontFamily: F.heavy, fontSize: 84, fill: 0x3a2a14 });
  b.anchor.set(0.5);
  b.position.set(W / 2, H / 2 - 110);
  const s = stamp('ULTRASECRETO', RED, 120);
  s.position.set(W / 2, H / 2 + 120);
  s.rotation = -0.14;
  k.addChild(g, a, b, s);
  return k;
}

interface St {
  eyes: Graphics;
}
const S = stash<St>();

export const miaunya: Signature = {
  dark: false,
  frame: PINK,
  tag: 'UNIVERSO SECRETO',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    room(g, W, H, 1, W / 2);
    k.addChild(g);
    c.back.addChild(k);
    arrive(c, k, 0.2);
    hideDisc(c, 0.05);
    // the telepathy rings and the glowing eyes
    const [hx, hy] = onCat(c, 0.575, 0.3);
    const tele = new Graphics();
    c.behind.addChild(tele);
    const eyes = new Graphics();
    for (const [ex, ey] of [onCat(c, 0.5, 0.335), onCat(c, 0.655, 0.335)]) {
      eyes.poly(ngon(ex, ey, 30, 20, 12)).fill({ color: GREEN, alpha: 0.3 });
      eyes.poly(ngon(ex, ey, 14, 9, 10, 0.1)).fill(GREEN);
      eyes.poly(twinkle(ex + 4, ey - 4, 10)).fill(0xffffff);
    }
    eyes.alpha = 0;
    c.fg.addChild(eyes);
    S.set(c, { eyes });
    const teleOn = { v: c.short || c.reduce ? 1 : 0 };
    if (!c.reduce)
      every(c, 30, (t) => {
        if (tele.destroyed) return;
        if (teleOn.v > 0) waves(tele, t, hx, hy, 220);
        tele.alpha = teleOn.v;
      });
    else waves(tele, 0.2, hx, hy, 220);
    if (c.short) return;

    // the dossier: its cover fills the screen, then flips open
    const cv = cover();
    c.back.addChild(cv);
    sfx('paper', 0.9);
    if (c.reduce) fadeKill(cv, 0.35, 0.2);
    else {
      gsap.to(cv.scale, { x: 0, duration: 0.3, delay: 0.32, ease: 'power2.in' });
      gsap.to(cv, { alpha: 0.6, duration: 0.3, delay: 0.32, onComplete: () => destroyTree(cv) });
      later(c, 0.32, () => sfx('whoosh', 0.7));
    }
    // stamps slam
    const slamStamp = (text: string, color: number, x: number, y: number, rot: number, size: number, hold: number) => {
      const s = stamp(text, color, size);
      s.position.set(x, y);
      s.rotation = rot;
      c.fg.addChild(s);
      sfx('hit', 0.75);
      c.shaker.add(0.12);
      if (!c.reduce) gsap.fromTo(s.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.12, ease: 'power3.in' });
      fadeKill(s, hold, 0.25);
    };
    later(c, 0.62, () => slamStamp('ULTRASECRETO', RED, 470, 250, -0.16, 64, 1.3));
    later(c, 0.9, () => slamStamp('CONFIDENCIAL', 0x2a4a9a, W - 430, 830, 0.1, 56, 1.1));
    // the family's thoughts float up, one by one
    const bubbles: [number, number, number][] = [
      [0, 560, 300],
      [1, 1400, 260],
      [2, 1190, 150],
    ];
    bubbles.forEach(([kind, x, y], i) => {
      later(c, 1.0 + i * 0.18, () => {
        const b = thought(kind, 185, hx - x, hy - y + 40);
        b.position.set(x, y);
        c.fg.addChild(b);
        sfx('pop', 1.1 + i * 0.15);
        if (!c.reduce) {
          gsap.fromTo(b.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(2.5)' });
          gsap.to(b, { y: y - 30, duration: 1.2, ease: 'sine.inOut' });
        }
        fadeKill(b, 1.05 - i * 0.12, 0.25);
      });
    });
    // she reads all of it: green eyes, telepathy, ¡JE!
    later(c, 1.35, () => {
      sfx('zap', 1.6);
      sfx('gem', 1.4);
      if (c.reduce) {
        eyes.alpha = 1;
        teleOn.v = 1;
      } else {
        gsap.to(eyes, { alpha: 1, duration: 0.15 });
        gsap.to(teleOn, { v: 1, duration: 0.3 });
      }
    });
    later(c, 1.7, () => word(c, W / 2 + 330, 250, '¡JE!', HOT, 110, 0.9));
    score(c, [[1.7, 'meow', 1.5]]);
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('fanfare', 1.2);
    for (let i = 0; i < 6; i++) later(c, i * 0.08, () => sfx('gem', 1.4 + i * 0.12));
    c.shaker.add(0.3);
    if (st && !st.eyes.destroyed) gsap.to(st.eyes, { alpha: 0, duration: 0.25 });
    // sparkly stars and peanuts out of her
    burst(c, c.fg, (i) => new Graphics().poly(twinkle(0, 0, 26 + (i % 3) * 10)).fill(i % 2 ? 0xffe14d : HOT), 22, W / 2, c.catY - 80, 820, 1.3);
    burst(c, c.fg, (i) => peanut(34 + (i % 3) * 8), 12, W / 2, c.catY, 700, 1.3);
    cheer(c, '¡MIAKU MIAKU!', HOT, 140, 2.0);
    // the final stamp: MISIÓN: ADORABLE
    later(c, 0.45, () => {
      const s = stamp('MISIÓN: ADORABLE', 0x2a8a4a, 50);
      s.position.set(W / 2 + 520, 650);
      s.rotation = 0.12;
      c.fg.addChild(s);
      sfx('hit', 0.8);
      if (!c.reduce) gsap.fromTo(s.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.12, ease: 'power3.in' });
      fadeKill(s, 1.8, 0.3);
    });
    drizzle(c, c.back, () => peanut(22 + Math.random() * 10), 0.4, 3.2);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const g = new Graphics();
    room(g, w, h, s * 1.1, w / 2);
    // more wall on a wide card: extra window and boards beyond the room's middle
    const extra = new Graphics();
    if (w > m * 2.2) {
      for (let x = w / 2 + m * 1.3; x < w - m * 0.2; x += m * 1.1) {
        extra.rect(x, h * 0.14, m * 0.32, m * 0.4).fill(0xf2e6cc).rect(x + m * 0.012, h * 0.14 + m * 0.012, m * 0.296, m * 0.376).fill(0x9fd8f0);
        extra.rect(x + m * 0.152, h * 0.14, m * 0.016, m * 0.4).fill(0xf2e6cc);
      }
    }
    const st = stamp('ULTRASECRETO', RED, 70 * s * 1.6);
    st.position.set(w / 2 - m * 0.55, h * 0.16);
    st.rotation = -0.16;
    st.alpha = 0.55;
    const tele = new Graphics();
    const hx = w / 2;
    const hy = h * 0.4;
    waves(tele, 0.3, hx, hy, m * 0.25);
    const bubbles = [
      [0, -0.6, 0.32],
      [1, 0.62, 0.3],
      [2, 0.42, 0.1],
    ].map(([kind, fx, fy]) => {
      const b = thought(kind, m * 0.18, -fx * m * 0.6, m * 0.15);
      b.position.set(w / 2 + fx * m, h * fy + m * 0.1);
      return b;
    });
    k.addChild(g, extra, st, tele, ...bubbles);
    const y0 = bubbles.map((b) => b.y);
    if (live)
      liveLoop(k, (t) => {
        waves(tele, t, hx, hy, m * 0.25);
        bubbles.forEach((b, i) => (b.y = y0[i] + Math.sin(t * 1.4 + i * 2) * m * 0.02));
      });
    return k;
  },
};
