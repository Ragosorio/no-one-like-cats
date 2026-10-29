/**
 * Ryumiau: the notebook universe (a dark-thriller anime about a notebook dropped from the sky; kept playful). The world
 * goes black and white: a night of screentone, a huge white moon behind him, gothic roofs, a spire and a clock tower.
 * A black notebook floats open beside him and its pages turn by themselves (FRRRT), empty ruled lines… then a hand
 * writes: «Lunes: manzana. / Martes: manzana. / Miércoles: manzana.». Black feathers drift down; a red apple — the only
 * color in the world — falls in slow motion toward his paw; «¡KU KU KU!».
 * Payoff: the apple drops into his paw (¡ÑAM!), the page signs off «Jueves: ¡MANZANA!» with a red check, feathers burst;
 * Anotado. / …y con letra bonita.
 */
import { Container, Graphics, type Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, drizzle, every, later } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, pay, say } from './kitC';
import { ngon, onCat, rnd, streak } from './kitD';
import { type Head, diamonds, prepHead, prepWord, show, showHead } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';

const RED = 0xc8102e;
const PAGE = 0xf2f2ee;
const LINE = 0xb4b4b4;

/** the moon: a white disc with soft grey seas and a halo (center x, y, radius r) */
function moon(g: Graphics, x: number, y: number, r: number) {
  for (let i = 4; i >= 1; i--) g.poly(ngon(x, y, r * (1 + i * 0.12), r * (1 + i * 0.12), 40)).fill({ color: 0xffffff, alpha: 0.05 });
  g.poly(ngon(x, y, r, r, 48)).fill(0xf4f4f0);
  for (const [dx, dy, rr] of [
    [-0.35, -0.2, 0.22],
    [0.25, 0.3, 0.16],
    [0.4, -0.35, 0.1],
    [-0.1, 0.45, 0.12],
  ])
    g.poly(ngon(x + dx * r, y + dy * r, rr * r, rr * r * 0.85, 14)).fill({ color: 0xd8d8d4, alpha: 0.8 });
}

/** the gothic roofline (two greys), a spire on the left, a clock tower on the right; `k` scale, bottom of the screen */
function roofs(g: Graphics, w: number, h: number, k: number, cx: number, seed: number) {
  const r = rnd(seed);
  for (const [y0, col] of [
    [h * 0.74, 0x3a3a3a],
    [h * 0.82, 0x1c1c1c],
  ] as const) {
    const pts: number[] = [0, h];
    for (let x = 0; x <= w + 60 * k; ) {
      const ww = (60 + r() * 90) * k;
      const hh = (20 + r() * 80) * k;
      pts.push(x, y0 - hh * 0.3, x + ww * 0.5, y0 - hh, x + ww, y0 - hh * 0.3);
      x += ww;
    }
    pts.push(w + 60 * k, h);
    g.poly(pts).fill(col);
  }
  // the spire (left) and the clock tower (right)
  const sx = cx - 720 * k;
  g.poly([sx - 50 * k, h * 0.8, sx - 50 * k, h * 0.5, sx, h * 0.22, sx + 50 * k, h * 0.5, sx + 50 * k, h * 0.8]).fill(0x262626);
  g.poly([sx - 10 * k, h * 0.42, sx + 10 * k, h * 0.42, sx + 10 * k, h * 0.47, sx - 10 * k, h * 0.47]).fill(0xd8d8d4);
  const tx = cx + 700 * k;
  g.rect(tx - 70 * k, h * 0.4, 140 * k, h * 0.42).fill(0x262626);
  g.poly([tx - 86 * k, h * 0.4, tx, h * 0.28, tx + 86 * k, h * 0.4]).fill(0x1c1c1c);
  g.poly(ngon(tx, h * 0.47, 46 * k, 46 * k, 20)).fill(0xe8e8e4);
  g.poly(streak(tx, h * 0.47, tx, h * 0.47 - 34 * k, 3 * k, 2 * k)).fill(0x111111);
  g.poly(streak(tx, h * 0.47, tx + 24 * k, h * 0.47 + 6 * k, 3 * k, 2 * k)).fill(0x111111);
  for (let i = 0; i < 5; i++) g.rect(tx - 50 * k + i * 22 * k, h * 0.58, 10 * k, 30 * k).fill({ color: 0xd8d8d4, alpha: 0.5 });
}

/** a black feather (quill along +x), length L, turned `a` */
function feather(g: Graphics, x: number, y: number, L: number, a: number) {
  const cs = Math.cos(a);
  const sn = Math.sin(a);
  const p = [-0.5, 0, -0.3, -0.12, 0.1, -0.16, 0.5, -0.02, 0.2, 0.1, -0.2, 0.12];
  const o: number[] = [];
  for (let i = 0; i < p.length; i += 2) o.push(x + (p[i] * cs - p[i + 1] * sn) * L, y + (p[i] * sn + p[i + 1] * cs) * L);
  g.poly(o).fill(0x141414).stroke({ width: Math.max(1, L * 0.03), color: 0x6a6a6a, join: 'round' });
  g.poly(streak(x - cs * L * 0.62, y - sn * L * 0.62, x + cs * L * 0.45, y + sn * L * 0.45, L * 0.012, L * 0.006)).fill(0x9a9a9a);
}

/** the red apple (origin at its middle), r = radius; `bite` cuts a bite from its right */
function apple(r: number, bite = false) {
  const g = new Graphics();
  const ink = { width: Math.max(2, r * 0.08), color: 0x2a0a0a, join: 'round' as const };
  g.poly([0, -r * 0.7, r * 0.5, -r * 0.95, r * 0.95, -r * 0.5, r * 1.02, r * 0.2, r * 0.7, r * 0.85, r * 0.2, r * 0.98, 0, r * 0.88, -r * 0.2, r * 0.98, -r * 0.7, r * 0.85, -r * 1.02, r * 0.2, -r * 0.95, -r * 0.5, -r * 0.5, -r * 0.95]).fill(RED).stroke(ink);
  g.poly(ngon(-r * 0.42, -r * 0.4, r * 0.18, r * 0.3, 10, 0.5)).fill({ color: 0xffffff, alpha: 0.7 });
  g.poly(streak(0, -r * 0.7, r * 0.12, -r * 1.25, r * 0.08, r * 0.06)).fill(0x4a2a12);
  g.poly([r * 0.1, -r * 1.05, r * 0.5, -r * 1.35, r * 0.75, -r * 1.15, r * 0.4, -r * 0.98]).fill(0x2e7a2e).stroke({ width: ink.width * 0.7, color: 0x1a3a1a });
  if (bite) for (let i = 0; i < 3; i++) g.poly(ngon(r * 1.0, -r * 0.2 + i * r * 0.32, r * 0.22, r * 0.2, 10)).fill(0x0a0a0a);
  return g;
}

interface Book {
  x: number;
  y: number;
  pw: number;
  ph: number;
  lean: number;
}
/** the open notebook: black covers, two ruled pages; `flip` 0..1 a page turning (right → left), `n` empty-line rows */
function drawBook(g: Graphics, b: Book, flip: number) {
  g.clear();
  const { x, y, pw, ph, lean } = b;
  const top = (dx: number) => y - ph / 2 + Math.abs(dx) * lean;
  const pageQ = (dir: number, w = pw) => [x, top(0), x + dir * w, top(w), x + dir * w, top(w) + ph, x, top(0) + ph];
  // the black covers, a little bigger than the pages
  g.poly([x, top(0) - 10, x - pw - 16, top(pw + 16) - 10, x - pw - 16, top(pw + 16) + ph + 14, x, top(0) + ph + 14, x + pw + 16, top(pw + 16) + ph + 14, x + pw + 16, top(pw + 16) - 10]).fill(0x0c0c0c).stroke({ width: 3, color: 0x5a5a5a });
  for (const dir of [-1, 1]) {
    g.poly(pageQ(dir)).fill(PAGE).stroke({ width: 2, color: 0x8a8a8a });
    for (let i = 1; i <= 10; i++) {
      const yy = (ph * i) / 11.5 + ph * 0.06;
      g.poly(streak(x + dir * pw * 0.06, top(pw * 0.06) + yy, x + dir * pw * 0.94, top(pw * 0.94) + yy, 0.8, 0.8)).fill(LINE);
    }
  }
  g.poly(streak(x, top(0), x, top(0) + ph, 3, 3)).fill(0x9a9a9a);
  // the turning page (lifts toward us as it crosses the spine)
  if (flip > 0.001 && flip < 0.999) {
    const th = flip * Math.PI;
    const ex = x + Math.cos(th) * pw;
    const lift = Math.sin(th) * ph * 0.08;
    const yt = top(Math.abs(Math.cos(th)) * pw) - lift;
    const shade = 0.75 + 0.25 * Math.abs(Math.cos(th));
    const v = Math.round(0xf2 * shade);
    g.poly([x, top(0), ex, yt, ex, yt + ph, x, top(0) + ph]).fill((v << 16) | (v << 8) | Math.round(0xee * shade)).stroke({ width: 2, color: 0x7a7a7a });
  }
}

interface St {
  apple: Container;
  book: Book;
  lines: Text[];
  last: Text;
  check: Graphics;
  head: Head;
  flip: { on: boolean };
}
const S = stash<St>();
const BOOK: Book = { x: 420, y: 470, pw: 300, ph: 380, lean: 0.07 };

export const ryumiau: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO LIBRETA',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, H, [0x050505, 0x161616, 0x2a2a2a], 12);
    diamonds(sky, 0, 0, W, H * 0.5, 30, 3.2, 0, 0x3a3a3a, 0.8);
    const mg = new Graphics();
    moon(mg, W / 2 + 30, c.catY - 30, 330);
    const rf = new Graphics();
    roofs(rf, W, H, 1, W / 2, 13);
    const bookG = new Graphics();
    k.addChild(sky, mg, rf, bookG);
    c.back.addChild(k);
    hideDisc(c, 0.15);
    if (!c.short && !c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    // the writing (Permanent Marker, ink): three lines, then the last at the payoff; the red check
    const lineStyle = { fontFamily: F.brush, fontSize: 30, fill: 0x1a1a1a };
    const L = ['Lunes: manzana.', 'Martes: manzana.', 'Miércoles: manzana.'];
    const lines = L.map((s, i) => {
      const t = txt(s, lineStyle);
      t.position.set(BOOK.x - BOOK.pw + 26, BOOK.y - BOOK.ph / 2 + BOOK.pw * BOOK.lean + 30 + i * 46);
      t.rotation = -0.06;
      t.alpha = c.short || c.reduce ? 1 : 0;
      k.addChild(t);
      return t;
    });
    const last = txt('Jueves: ¡MANZANA!', { ...lineStyle, fill: RED });
    last.position.set(BOOK.x + 26, BOOK.y - BOOK.ph / 2 + 40);
    last.rotation = 0.06;
    last.alpha = 0;
    const check = new Graphics().poly([0, 0, 14, 18, 44, -24, 50, -18, 14, 30, -6, 6]).fill(RED);
    check.position.set(BOOK.x + 220, BOOK.y - BOOK.ph / 2 + 120);
    check.alpha = 0;
    k.addChild(last, check);
    // the apple: the only color; it falls in slow motion toward his paw
    const [px, py] = onCat(c, 0.667, 0.41);
    const ap = new Container();
    const trail = new Graphics();
    ap.addChild(trail, apple(44));
    ap.position.set(px, c.short || c.reduce ? py - 220 : -120);
    c.fg.addChild(ap);
    const head = prepHead(c, 'Anotado.', { fontFamily: F.news, fontSize: 170, fill: 0xffffff, stroke: { color: RED, width: 10, join: 'round' }, dropShadow: { color: 0x000000, distance: 8, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…y con letra bonita.',
      asideStyle: { fill: 0xffffff, stroke: { color: 0x000000, width: 8, join: 'round' } },
      at: [430, 760],
    });
    const flip = { on: !c.reduce };
    S.set(c, { apple: ap, book: BOOK, lines, last, check, head, flip });
    // the pages turn by themselves; the apple sways as it sinks; feathers drift
    let fl = 0;
    let lastT = 0;
    const frame = (t: number) => {
      if (bookG.destroyed) return;
      const dt = Math.min(0.1, t - lastT);
      lastT = t;
      if (flip.on) fl = (fl + dt * (t < 1.2 ? 2.4 : 0.9)) % 1;
      drawBook(bookG, BOOK, flip.on ? fl : 0);
      if (!ap.destroyed) {
        ap.rotation = Math.sin(t * 1.3) * 0.25;
        trail.clear();
        if (!c.reduce) for (let i = 1; i <= 3; i++) trail.poly(streak(-26 + i * 13, -60 - i * 10, -26 + i * 13, -130 - i * 30, 1, 3)).fill({ color: 0xffffff, alpha: 0.5 });
      }
    };
    frame(0.3);
    if (!c.reduce) every(c, 30, frame);
    drizzle(c, c.fg, () => {
      const g = new Graphics();
      feather(g, 0, 0, 60 + Math.random() * 40, Math.random() * 6);
      return g;
    }, 0.32, 4.5);
    if (c.short) return;

    // the apple's slow fall
    if (!c.reduce) {
      gsap.to(ap, { y: py - 250, duration: 2.2, ease: 'power1.out' });
      gsap.to(ap, { y: py - 150, duration: 2.0, delay: 2.2, ease: 'none' });
    }
    // prepared words
    const frrt = prepWord(c.fg, BOOK.x + 40, BOOK.y - 300, 'FRRRT', 0xffffff, 76, -0.08);
    const box = new Container();
    {
      const bg = new Graphics().rect(0, 0, 400, 70).fill(0xffffff).stroke({ width: 4, color: 0x000000 });
      const t = txt('DÍA 3 SIN MANZANAS…', { fontFamily: F.heavy, fontSize: 26, fill: 0x000000 });
      t.position.set(18, 18);
      box.addChild(bg, t);
      box.position.set(W - 470, 120);
      box.alpha = 0.001;
      c.fg.addChild(box);
    }
    sfx('paper', 0.9);
    beat(c, 0.15, () => {
      sfx('paper', 1.3);
      show(c, frrt, 0.6, { from: 1.6 });
    });
    beat(c, 0.35, () => {
      sfx('sting', 0.7);
      if (box.destroyed) return;
      box.alpha = 1;
      if (!c.reduce) gsap.from(box, { x: W + 20, duration: 0.25, ease: 'power3.out' });
      fadeKill(box, 1.1, 0.25);
    });
    // a hand writes, line by line (pencil scratches)
    lines.forEach((t, i) =>
      beat(c, 0.75 + i * 0.32, () => {
        if (t.destroyed) return;
        sfx('pencil', 1 + i * 0.1);
        if (c.reduce) t.alpha = 1;
        else {
          t.alpha = 1;
          const full = t.text;
          const n = { v: 0 };
          t.text = '';
          gsap.to(n, { v: full.length, duration: 0.26, ease: 'none', onUpdate: () => !t.destroyed && (t.text = full.slice(0, Math.round(n.v))) });
        }
      }),
    );
    beat(c, 1.35, () => {
      sfx('purr', 0.6);
      const [hx, hy] = onCat(c, 0.6, 0.18);
      say(c, c.fg, hx + 250, hy - 60, '¡KU KU KU!', 0.85, { size: 48, tail: 'left', fill: 0xffffff });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 0.9);
    c.shaker.add(0.25);
    if (st) {
      const [px, py] = onCat(c, 0.667, 0.41);
      const ap = st.apple;
      if (!ap.destroyed) {
        gsap.killTweensOf(ap);
        const land = () => {
          sfx('nyam', 1);
          sfx('pop', 0.8);
          destroyTree(ap);
          const w = txt('¡ÑAM!', { fontFamily: F.comic, fontSize: 72, fill: RED, stroke: { color: 0xffffff, width: 9, join: 'round' } });
          w.anchor.set(0.5);
          w.position.set(px + 130, py - 70);
          w.rotation = 0.12;
          c.fg.addChild(w);
          if (!c.reduce) gsap.fromTo(w.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.15, ease: 'back.out(3)' });
          fadeKill(w, 0.8, 0.25);
        };
        if (c.reduce || c.short) land();
        else gsap.to(ap, { y: py, duration: 0.18, ease: 'power2.in', onComplete: land });
      }
      st.flip.on = false;
      // the page signs off, with a red check
      if (!st.last.destroyed) {
        st.last.alpha = 1;
        for (const t of st.lines) if (!t.destroyed) t.alpha = 1;
        sfx('pencil', 1.3);
      }
      later(c, 0.35, () => {
        if (st.check.destroyed) return;
        st.check.alpha = 1;
        sfx('click', 0.8);
        if (!c.reduce) gsap.fromTo(st.check.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.15, ease: 'back.out(3)' });
      });
    }
    burst(c, c.fg, (i) => {
      const g = new Graphics();
      feather(g, 0, 0, 50 + (i % 3) * 14, i);
      return g;
    }, 22, W / 2, c.catY - 40, 900, 1.6);
    showHead(c, st?.head, { dur: 2.6, slow: true });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const sky = vgrad(new Graphics(), 0, 0, w, h, [0x050505, 0x161616, 0x2a2a2a], 10);
    diamonds(sky, 0, 0, w, h * 0.5, Math.max(8, 30 * s * 1.3), Math.max(1, 3.2 * s * 1.3), 0, 0x3a3a3a, 0.8);
    const mg = new Graphics();
    moon(mg, w / 2, h * 0.46, m * 0.34);
    const rf = new Graphics();
    roofs(rf, w, h, s * 1.1, w / 2, 13);
    const bookG = new Graphics();
    const wide = w > h * 2;
    const b: Book = wide ? { x: w / 2 - m * 0.9, y: h * 0.5, pw: m * 0.28, ph: m * 0.36, lean: 0.07 } : { x: w * 0.2, y: h * 0.78, pw: m * 0.16, ph: m * 0.2, lean: 0.07 };
    drawBook(bookG, b, 0.35);
    const ap = apple(m * 0.06);
    ap.position.set(wide ? w / 2 + m * 0.75 : w * 0.82, h * 0.24);
    const fg = new Graphics();
    const r = rnd(3);
    const fs: [number, number, number, number][] = [];
    for (let i = 0; i < (wide ? 14 : 4); i++) fs.push([r() * w, r() * h, m * (0.05 + r() * 0.04), r() * 6]);
    const drawF = (t: number) => {
      fg.clear();
      for (const [x, y, L, a] of fs) feather(fg, x + Math.sin(t + a) * L * 0.4, (y + t * m * 0.04) % h, L, a + Math.sin(t * 0.8 + a) * 0.4);
    };
    drawF(0);
    k.addChild(sky, mg, rf, bookG, fg, ap);
    if (live)
      liveLoop(k, (t) => {
        drawBook(bookG, b, (t * 0.35) % 1);
        drawF(t);
        ap.rotation = Math.sin(t * 1.3) * 0.2;
        ap.y = h * 0.24 + Math.sin(t * 1.1) * 6 * s;
      });
    return k;
  },
};
