/**
 * Blumiau: the clues universe (a blue puppy's preschool clue-hunting show). A house made of pastel paper cut-outs —
 * every piece with its white paper edge and a soft shadow: a window with a smiling sun, a bookshelf, a little table with a
 * plate, a rug, a clock. Three blue paw prints turn up one after another (on the window, on the plate, on a book that
 * slides out of the shelf) — ¡PISTA! — the plush thinking chair slides in, and the green spiral notebook pops up and
 * draws the three clues by itself.
 * Payoff: the notebook ticks all three, blue paw prints hop all over the room, paper confetti; ¡TRES PISTAS!
 * (…¡a la silla de pensar!)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, drizzle, every, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { beat, pawPrint, pay } from './kitC';
import { asideText, jitter, oval, payline, pop, pre, puffs, rrect, star, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const WALL = 0xfde9a6;
const WALL2 = 0xf8dc8a;
const FLOOR = 0xd8c4ec;
const RUG = 0xf6b8c8;
const BLUE = 0x2f6fd6;
const SKY = 0xa8dcf4;
const CHAIR = 0xe0607a;
const NOTE = 0x7fbf6b;
const INK = 0x2a3a6a;

/** a paper cut-out: soft shadow, white paper edge, the colour on top (pts jittered: cut by hand) */
function cut(g: Graphics, pts: number[], fill: number, s: number, seed = 1, edge = 7) {
  const p = jitter(pts, 1.6 * s, seed);
  g.poly(p.map((v, i) => v + (i % 2 ? 7 : 5) * s)).fill({ color: 0x5a4a7a, alpha: 0.16 });
  g.poly(p).fill(0xffffff).stroke({ width: edge * s, color: 0xffffff, join: 'round' });
  g.poly(p).fill(fill);
  return g;
}

/** the room (w×h, u = scale vs the 1920×1080 reveal): wall, floor, rug, window, shelf, table, clock, picture */
function room(w: number, h: number, u: number, cx: number) {
  const g = new Graphics();
  g.rect(0, 0, w, h).fill(WALL);
  for (let x = (cx % (120 * u)) - 120 * u; x < w; x += 120 * u) g.rect(x, 0, 52 * u, h * 0.72);
  g.fill(WALL2);
  const floorY = h * 0.74;
  g.rect(0, floorY, w, h - floorY).fill(FLOOR);
  g.rect(0, floorY - 10 * u, w, 14 * u).fill(0xffffff);
  cut(g, oval(cx, floorY + (h - floorY) * 0.55, 520 * u, 110 * u, 28), RUG, u, 3);
  g.poly(oval(cx, floorY + (h - floorY) * 0.55, 400 * u, 76 * u, 28)).stroke({ width: 6 * u, color: 0xffffff, alpha: 0.7 });
  const parts: Record<string, [number, number]> = {};
  // the window (left): sky, a smiling sun, a cloud, pink curtains
  const wx = cx - 760 * u;
  const wy = 140 * u;
  cut(g, rrect(wx - 200 * u, wy, 400 * u, 340 * u, 18 * u, 3), 0xffffff, u, 5);
  g.poly(rrect(wx - 178 * u, wy + 22 * u, 356 * u, 296 * u, 10 * u, 2)).fill(SKY);
  g.poly(star(wx + 90 * u, wy + 90 * u, 54 * u, 40 * u, 12)).fill(0xffd34a).poly(oval(wx + 90 * u, wy + 90 * u, 34 * u, 34 * u, 16)).fill(0xffe27a);
  g.poly(oval(wx + 80 * u, wy + 86 * u, 4 * u, 5 * u, 6)).poly(oval(wx + 100 * u, wy + 86 * u, 4 * u, 5 * u, 6)).fill(INK);
  g.poly([wx + 78 * u, wy + 98 * u, wx + 102 * u, wy + 98 * u, wx + 90 * u, wy + 106 * u]).fill(INK);
  puffs(g, wx - 60 * u, wy + 200 * u, 170 * u, 46 * u, 4, 0xffffff, 1, 8);
  g.rect(wx - 3 * u, wy + 22 * u, 6 * u, 296 * u).rect(wx - 178 * u, wy + 168 * u, 356 * u, 6 * u).fill(0xffffff);
  cut(g, [wx - 236 * u, wy - 20 * u, wx - 150 * u, wy - 20 * u, wx - 176 * u, wy + 200 * u, wx - 140 * u, wy + 380 * u, wx - 246 * u, wy + 380 * u], 0xf6a8c0, u, 6);
  cut(g, [wx + 236 * u, wy - 20 * u, wx + 150 * u, wy - 20 * u, wx + 176 * u, wy + 200 * u, wx + 140 * u, wy + 380 * u, wx + 246 * u, wy + 380 * u], 0xf6a8c0, u, 7);
  parts.window = [wx - 70 * u, wy + 250 * u];
  // the bookshelf (right, high): two shelves of books
  const sx = cx + 700 * u;
  const sy = 150 * u;
  cut(g, rrect(sx - 230 * u, sy, 460 * u, 300 * u, 10 * u, 2), 0xc89a6a, u, 9);
  const cols = [0x7fbf6b, 0xf6a8c0, 0x6ec6f0, 0xffd34a, 0xb89af0, 0xf28c5a];
  for (let r = 0; r < 2; r++) {
    g.rect(sx - 210 * u, sy + 140 * u + r * 140 * u, 420 * u, 14 * u).fill(0xa8784a);
    for (let i = 0; i < 9; i++) {
      if (r === 0 && i === 4) continue;
      const bh = (90 + ((i * 37 + r * 11) % 30)) * u;
      g.rect(sx - 200 * u + i * 44 * u, sy + 140 * u + r * 140 * u - bh, 38 * u, bh).fill(cols[(i + r * 2) % cols.length]);
    }
  }
  parts.shelf = [sx - 200 * u + 4 * 44 * u + 19 * u, sy + 140 * u - 55 * u];
  // the little table with the plate (right, low)
  const tx = cx + 690 * u;
  const ty = floorY - 150 * u;
  cut(g, [tx - 26 * u, ty, tx + 26 * u, ty, tx + 20 * u, floorY + 30 * u, tx - 20 * u, floorY + 30 * u], 0xf6a8c0, u, 10);
  cut(g, oval(tx, ty, 190 * u, 40 * u, 22), 0x6ec6f0, u, 11);
  g.poly(oval(tx, ty - 16 * u, 110 * u, 26 * u, 20)).fill(0xffffff).stroke({ width: 4 * u, color: 0xe0e6f0 });
  g.poly(oval(tx, ty - 16 * u, 70 * u, 15 * u, 18)).stroke({ width: 4 * u, color: 0xf6a8c0 });
  parts.plate = [tx, ty - 16 * u];
  // a clock and a picture on the wall
  const ckx = cx - 380 * u;
  cut(g, oval(ckx, 150 * u, 64 * u, 64 * u, 20), 0xffffff, u, 12);
  g.poly(oval(ckx, 150 * u, 52 * u, 52 * u, 20)).stroke({ width: 5 * u, color: 0xb89af0 });
  g.rect(ckx - 3 * u, 110 * u, 6 * u, 42 * u).rect(ckx - 3 * u, 147 * u, 34 * u, 6 * u).fill(INK);
  const pcx = cx + 380 * u;
  cut(g, rrect(pcx - 70 * u, 90 * u, 140 * u, 110 * u, 6 * u, 2), 0xffd34a, u, 13);
  g.poly([pcx - 50 * u, 180 * u, pcx - 10 * u, 130 * u, pcx + 20 * u, 160 * u, pcx + 35 * u, 145 * u, pcx + 52 * u, 180 * u]).fill(0x7fbf6b);
  return { g, floorY, parts };
}

/** the plush thinking chair (origin at the floor, center) */
function chair(s: number) {
  const g = new Graphics();
  cut(g, rrect(-170 * s, -330 * s, 340 * s, 250 * s, 70 * s, 4), CHAIR, s, 20);
  cut(g, rrect(-200 * s, -180 * s, 80 * s, 170 * s, 36 * s, 3), CHAIR, s, 21);
  cut(g, rrect(120 * s, -180 * s, 80 * s, 170 * s, 36 * s, 3), CHAIR, s, 22);
  cut(g, rrect(-130 * s, -140 * s, 260 * s, 90 * s, 30 * s, 3), 0xf07a92, s, 23);
  for (const x of [-150, 150]) g.rect((x - 10) * s, -14 * s, 20 * s, 18 * s).fill(0xa8784a);
  for (let i = 0; i < 6; i++) g.poly(star((-110 + i * 44) * s, -230 * s + (i % 2) * 40 * s, 14 * s, 6 * s, 5)).fill({ color: 0xffd34a, alpha: 0.9 });
  return g;
}

/**
 * the green spiral notebook, open (origin at its center): the clue slots on the right page are drawn progressively by
 * draw(n, prog), and tick(n) puts check marks.
 */
function notebook(s: number) {
  const k = new Container();
  const g = new Graphics();
  cut(g, rrect(-280 * s, -190 * s, 560 * s, 380 * s, 22 * s, 3), NOTE, s, 30);
  g.poly(rrect(-260 * s, -170 * s, 250 * s, 340 * s, 8 * s, 2)).fill(0xfffdf4).poly(rrect(10 * s, -170 * s, 250 * s, 340 * s, 8 * s, 2)).fill(0xfffdf4);
  for (let y = -130; y < 170; y += 34) g.rect(-250 * s, y * s, 230 * s, 2 * s).rect(20 * s, y * s, 230 * s, 2 * s);
  g.fill({ color: 0xa8c8f0, alpha: 0.7 });
  for (let i = 0; i < 8; i++) g.poly(oval(0, (-150 + i * 42) * s, 16 * s, 8 * s, 10)).stroke({ width: 5 * s, color: 0xffc83a });
  pawPrint(g, -135 * s, 0, 5 * s, 0, BLUE, 0.9);
  const sk = new Graphics();
  const ticks = new Graphics();
  k.addChild(g, sk, ticks);
  const slot = (i: number): [number, number] => [135 * s, (-110 + i * 110) * s];
  // crayon sketches of the clues: a window, a plate, a book (polylines revealed by prog)
  const shapes: number[][][] = [
    [
      [-40, -30, 40, -30, 40, 30, -40, 30, -40, -30],
      [0, -30, 0, 30],
      [-40, 0, 40, 0],
    ],
    [
      [-46, 0, -34, -14, 0, -20, 34, -14, 46, 0, 34, 14, 0, 20, -34, 14, -46, 0],
      [-26, 0, -18, -8, 0, -11, 18, -8, 26, 0, 18, 8, 0, 11, -18, 8, -26, 0],
    ],
    [
      [-34, -34, 30, -34, 30, 34, -34, 34, -34, -34],
      [-24, -34, -24, 34],
      [-12, -16, 18, -16],
    ],
  ];
  return {
    k,
    draw(n: number, prog: number) {
      if (sk.destroyed) return;
      sk.clear();
      for (let i = 0; i < n; i++) {
        const [cx, cy] = slot(i);
        const pr = i === n - 1 ? prog : 1;
        for (const ln of shapes[i]) {
          const m = Math.max(2, Math.ceil((ln.length / 2) * pr));
          const pts: number[] = [];
          for (let j = 0; j < m; j++) pts.push(cx - 40 * s + ln[j * 2] * s, cy + ln[j * 2 + 1] * s);
          sk.poly(pts, false).stroke({ width: 5 * s, color: BLUE, cap: 'round', join: 'round' });
        }
      }
    },
    tick(n: number) {
      if (ticks.destroyed) return;
      ticks.clear();
      for (let i = 0; i < n; i++) {
        const [cx, cy] = slot(i);
        ticks.poly([cx + 30 * s, cy, cx + 48 * s, cy + 20 * s, cx + 92 * s, cy - 30 * s], false).stroke({ width: 9 * s, color: 0x2fa84a, cap: 'round', join: 'round' });
      }
    },
  };
}

/** a big blue clue print (its own Graphics) */
function clue(s: number, rot = 0) {
  const g = new Graphics();
  pawPrint(g, 0, 0, 5.4 * s, rot, 0xffffff, 1);
  pawPrint(g, 0, 0, 4.6 * s, rot, BLUE, 1);
  return g;
}

interface St {
  nb: ReturnType<typeof notebook>;
  nbK: Container;
  words: Container[];
  line: ReturnType<typeof payline>;
}
const S = stash<St>();

export const blumiau: Signature = {
  dark: false,
  frame: BLUE,
  tag: 'UNIVERSO DE LAS PISTAS',
  open(c: SigCtx) {
    const k = new Container();
    const rm = room(W, H, 1, W / 2);
    const ch = chair(1);
    const CH: [number, number] = [380, rm.floorY + 150];
    ch.position.set(CH[0], CH[1]);
    // the clue book (slides out of the shelf)
    const book = new Graphics();
    cut(book, rrect(-19, -55, 38, 110, 4, 1), 0x6ec6f0, 1, 40, 4);
    book.position.set(rm.parts.shelf[0], rm.parts.shelf[1]);
    const nb = notebook(1);
    const NB: [number, number] = [1560, 860];
    nb.k.position.set(NB[0], NB[1]);
    nb.k.rotation = -0.05;
    k.addChild(rm.g, book, ch, nb.k);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const words: Container[] = [];
    const line = payline(c, () => title('¡TRES PISTAS!', { size: 150, fill: 0x6ec6f0, ink: INK, inkW: 16, shadow: BLUE }), () => asideText('…¡a la silla de pensar!', 0xffffff, INK, 46));
    S.set(c, { nb, nbK: nb.k, words, line });
    if (!c.reduce)
      every(c, 30, (t) => {
        if (!nb.k.destroyed) nb.k.rotation = -0.05 + Math.sin(t * 2) * 0.012;
      });
    const spots: [number, number, number][] = [
      [rm.parts.window[0], rm.parts.window[1], 0.2],
      [rm.parts.plate[0], rm.parts.plate[1] - 4, 0],
      [rm.parts.shelf[0] - 70, rm.parts.shelf[1] + 2, -0.1],
    ];
    if (c.short) {
      for (const [x, y, r] of spots) {
        const p = clue(1, r);
        p.position.set(x, y);
        k.addChild(p);
      }
      book.x -= 70;
      nb.draw(3, 1);
      return;
    }
    if (!c.reduce) {
      ch.x = -320;
      nb.k.y = H + 260;
    } else nb.draw(3, 1);
    score(c, [
      [0.15, 'pop', 1.4],
      [0.68, 'pop', 1.6],
      [1.12, 'whoosh', 0.9],
      [1.42, 'paper', 1.2],
      [1.55, 'pencil', 1.3],
      [1.8, 'pencil', 1.1],
      [2.0, 'pencil', 1.4],
    ]);
    // the three prints turn up, one after another (the book slides out of the shelf first)
    beat(c, 0.92, () => {
      if (book.destroyed) return;
      if (c.reduce) book.x -= 70;
      else gsap.to(book, { x: book.x - 70, rotation: -0.1, duration: 0.18, ease: 'back.out(2)' });
      sfx('paper', 1.4);
    });
    spots.forEach(([x, y, r], i) => {
      const p = clue(1, r);
      pre(k, p, x, y);
      pop(c, p, 0.12 + i * 0.5, 99, { from: 0.1, keep: true, onShow: () => sfx('gem', 1.3 + i * 0.15) });
      const t = pre(c.fg, title(`¡PISTA ${i + 1}!`, { size: 70, fill: 0xffffff, ink: BLUE, inkW: 10, shadow: INK, font: F.brush }), x + (i === 0 ? 60 : -40), y - 110, (i % 2 ? 1 : -1) * 0.1);
      words.push(t);
      pop(c, t, 0.16 + i * 0.5, 0.42);
    });
    // the thinking chair slides in
    beat(c, 1.1, () => {
      if (ch.destroyed || c.reduce) return;
      gsap.to(ch, { x: CH[0], duration: 0.3, ease: 'back.out(1.6)' });
    });
    // the notebook pops up and draws the clues by itself
    beat(c, 1.38, () => {
      if (nb.k.destroyed || c.reduce) return;
      gsap.to(nb.k, { y: NB[1], duration: 0.22, ease: 'back.out(1.8)' });
      const p = { v: 0 };
      gsap.to(p, { v: 3, duration: 0.7, delay: 0.18, ease: 'none', onUpdate: () => nb.draw(Math.min(3, Math.floor(p.v) + 1), p.v - Math.floor(p.v) || (p.v >= 3 ? 1 : 0)), onComplete: () => nb.draw(3, 1) });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('levelup', 1.1);
    later(c, 0.1, () => sfx('fanfare', 1.2));
    c.shaker.add(0.25);
    if (!st) return;
    sweep(st.words);
    st.line.land(2.4);
    if (!st.nbK.destroyed) {
      gsap.killTweensOf(st.nbK);
      st.nbK.y = 860;
      st.nb.draw(3, 1);
      for (let i = 1; i <= 3; i++) later(c, c.reduce ? 0 : i * 0.14, () => (st.nb.tick(i), sfx('coin', 1 + i * 0.2)));
    }
    // blue prints hop across the room, paper confetti
    if (!c.reduce) {
      const hop = new Graphics();
      c.back.addChild(hop);
      const trail: [number, number, number][] = [];
      for (let i = 0; i < 12; i++) trail.push([140 + i * 150, 1000 - Math.abs(Math.sin(i * 0.9)) * 60 - (i % 2) * 34, -Math.PI / 2 + 0.2]);
      trail.forEach(([x, y, r], i) =>
        later(c, 0.05 + i * 0.06, () => {
          if (hop.destroyed) return;
          pawPrint(hop, x, y, 3.2, r + Math.PI, BLUE, 0.85);
          if (i % 3 === 0) sfx('pop', 1.8);
        }),
      );
      gsap.to(hop, { alpha: 0, delay: 2.4, duration: 0.6, onComplete: () => destroyTree(hop) });
    }
    const conf = [0x6ec6f0, 0xf6a8c0, 0xffd34a, 0x7fbf6b, 0xb89af0];
    burst(c, c.fg, (i) => cut(new Graphics(), i % 2 ? star(0, 0, 18, 8, 5) : oval(0, 0, 13, 13, 8), conf[i % conf.length], 1, i, 4), 26, W / 2, c.catY - 60, 850, 1.4);
    drizzle(c, c.back, () => cut(new Graphics(), oval(0, 0, 10, 10, 8), conf[Math.floor(Math.random() * conf.length)], 1, 2, 3), 0.18, 3.2);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const rm = room(w, h, u, w / 2);
    const ch = chair(u * 0.9);
    ch.position.set(w / 2 - Math.min(w * 0.36, 560 * u), rm.floorY + 150 * u);
    k.addChild(rm.g, ch);
    const spots: [number, number, number][] = [
      [rm.parts.window[0], rm.parts.window[1], 0.2],
      [rm.parts.plate[0], rm.parts.plate[1] - 4 * u, 0],
      [rm.parts.shelf[0], rm.parts.shelf[1], -0.1],
    ];
    const prints = spots.map(([x, y, r]) => {
      const p = clue(u, r);
      p.position.set(x, y);
      k.addChild(p);
      return p;
    });
    if (live)
      liveLoop(k, (t) => {
        // the three clues turn up in order, hold, and start again
        const q = t % 4;
        prints.forEach((p, i) => {
          const on = q > 0.4 + i * 0.6 && q < 3.6;
          p.alpha = on ? 1 : 0;
          p.scale.set(on ? 1 + 0.15 * Math.max(0, 1 - (q - 0.4 - i * 0.6) * 4) : 1);
        });
      });
    return k;
  },
};
