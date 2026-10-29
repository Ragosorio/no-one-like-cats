/**
 * Hermiaune: the magic-library universe (the wizard-school bookworm). A candle-lit hall of endless shelves in one-point
 * perspective toward a moonlit pointed window, a clock on the far wall and a hundred candles floating in the air.
 * ¡SHHH! The books jump off the shelves and fly around her, flapping open by themselves, and get stamped ¡LEÍDO! as
 * they pass; a golden hourglass turns over and its sand runs UP; the clock's hands spin backwards (¡CAT… CIT!) and the
 * candles go out left to right… and light again right to left. She raises the wand: «¡YO SÉ! ¡YO SÉ!».
 * Payoff: every book opens in a ring around her, loose pages flutter out, the candles flare; ¡LO LEÍ EN UN LIBRO!
 * …en todos, de hecho.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, cheer, every, flashOf, later, plate, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash } from './kitB';
import { beat, floatWord, pay, say } from './kitC';
import { aside, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { held } from './kitH';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const BRONZE = 0xc98a3a;
const GOLD = 0xe6c34a;
const WOOD = 0x4a2a1a;
const WOOD_D = 0x2e180e;
const STONE = 0x3a3040;
const NIGHT = 0x14101c;
const FLAME = 0xffc24a;
const SPINES = [0x7a2e2e, 0x2a5a4a, 0x2a3e6a, 0xc98a3a, 0x5a3a6a, 0x8a5a2a, 0x3a6a7a, 0x9a3a3a];

/** the hall's geometry for a w×h view: the far wall's rectangle and the near frame */
interface Hall {
  cx: number;
  fx0: number;
  fx1: number;
  fy0: number;
  fy1: number;
  w: number;
  h: number;
  k: number;
}
function hallOf(w: number, h: number, k: number, cx: number): Hall {
  return { cx, fx0: cx - 250 * k, fx1: cx + 250 * k, fy0: h * 0.1, fy1: h * 0.6, w, h, k };
}

/** a point on a side wall: side -1/+1, u 0 (near edge) → 1 (far wall), v 0 (top) → 1 (floor) */
function wallAt(L: Hall, side: number, u: number, v: number): [number, number] {
  const nx = side < 0 ? Math.min(0, L.cx - 1100 * L.k) : Math.max(L.w, L.cx + 1100 * L.k);
  const fx = side < 0 ? L.fx0 : L.fx1;
  const x = nx + (fx - nx) * u;
  const top = -40 * L.k + (L.fy0 + 40 * L.k) * u;
  const bot = L.h * 0.97 + (L.fy1 - L.h * 0.97) * u;
  return [x, top + (bot - top) * v];
}

/** the library (one Graphics): far wall with the window and clock face, shelves of books on both walls, floor, rug */
function library(g: Graphics, L: Hall) {
  const { cx, fx0, fx1, fy0, fy1, w, h, k } = L;
  g.rect(0, 0, w, h).fill(NIGHT);
  // floor: stone tiles in perspective
  g.poly([0, h, fx0, fy1, fx1, fy1, w, h]).fill(STONE);
  for (let i = 1; i < 10; i++) {
    const u = 1 - Math.pow(0.78, i);
    const y = h + (fy1 - h) * u;
    g.rect(0, y, w, 2 * k).fill({ color: 0x241c2a, alpha: 0.8 });
  }
  for (let i = -8; i <= 8; i++) g.poly(streak(cx + i * 200 * k, h, cx + i * 40 * k * 0.5, fy1, 1.5 * k, 0.5 * k)).fill({ color: 0x241c2a, alpha: 0.8 });
  // the long rug down the middle
  g.poly([cx - 300 * k, h, cx - 60 * k, fy1, cx + 60 * k, fy1, cx + 300 * k, h]).fill(0x5a1e24);
  g.poly([cx - 260 * k, h, cx - 52 * k, fy1, cx + 52 * k, fy1, cx + 260 * k, h]).fill({ color: GOLD, alpha: 0.25 });
  g.poly([cx - 240 * k, h, cx - 48 * k, fy1, cx + 48 * k, fy1, cx + 240 * k, h]).fill(0x6a2228);
  // the far wall: dark wood panels, the pointed window with the moon, the clock face above it
  g.rect(fx0, fy0, fx1 - fx0, fy1 - fy0).fill(WOOD_D);
  const wx = cx;
  const wt = fy0 + 90 * k;
  const wb = fy1 - 40 * k;
  const ww = 120 * k;
  const win = [wx - ww, wb, wx - ww, wt + 120 * k, wx - ww * 0.7, wt + 40 * k, wx, wt, wx + ww * 0.7, wt + 40 * k, wx + ww, wt + 120 * k, wx + ww, wb];
  g.poly(win).fill(0x2a3e6a).stroke({ width: 8 * k, color: WOOD });
  g.poly(ngon(wx + 40 * k, wt + 120 * k, 34 * k, 34 * k, 14)).fill(0xf2ecd0);
  g.poly(ngon(wx + 52 * k, wt + 112 * k, 30 * k, 30 * k, 14)).fill(0x2a3e6a);
  g.rect(wx - 3 * k, wt, 6 * k, wb - wt).fill(WOOD).rect(wx - ww, wt + 200 * k, ww * 2, 6 * k).fill(WOOD);
  // the side walls: shelving, books in perspective (columns get thinner toward the far wall)
  for (const side of [-1, 1]) {
    const nCols = 9;
    const rows = 6;
    const us = Array.from({ length: nCols + 1 }, (_, i) => 1 - Math.pow(0.8, i * 1.15));
    us[nCols] = 1;
    const [a0x, a0y] = wallAt(L, side, 0, 0);
    const [a1x, a1y] = wallAt(L, side, 1, 0);
    const [b1x, b1y] = wallAt(L, side, 1, 1);
    const [b0x, b0y] = wallAt(L, side, 0, 1);
    g.poly([a0x, a0y, a1x, a1y, b1x, b1y, b0x, b0y]).fill(WOOD);
    const r = rnd(side < 0 ? 12 : 34);
    for (let i = 0; i < nCols; i++) {
      for (let j = 0; j < rows; j++) {
        const v0 = 0.04 + (j / rows) * 0.9;
        const v1 = v0 + (0.9 / rows) * 0.82;
        // books: 4–6 spines across the cell, uneven heights
        const nb = 4 + Math.floor(r() * 3);
        for (let b = 0; b < nb; b++) {
          const ua = us[i] + ((us[i + 1] - us[i]) * (b + 0.08)) / nb;
          const ub = us[i] + ((us[i + 1] - us[i]) * (b + 0.92)) / nb;
          const top = v0 + (v1 - v0) * (r() * 0.28);
          const p1 = wallAt(L, side, ua, top);
          const p2 = wallAt(L, side, ub, top);
          const p3 = wallAt(L, side, ub, v1);
          const p4 = wallAt(L, side, ua, v1);
          g.poly([...p1, ...p2, ...p3, ...p4]).fill(SPINES[Math.floor(r() * SPINES.length)]);
        }
        // the shelf board under them
        const s1 = wallAt(L, side, us[i], v1);
        const s2 = wallAt(L, side, us[i + 1], v1);
        const s3 = wallAt(L, side, us[i + 1], v1 + 0.025);
        const s4 = wallAt(L, side, us[i], v1 + 0.025);
        g.poly([...s1, ...s2, ...s3, ...s4]).fill(0x6a3e22);
      }
      // the upright between columns
      const t1 = wallAt(L, side, us[i], 0);
      const t2 = wallAt(L, side, us[i] + 0.012, 0);
      const t3 = wallAt(L, side, us[i] + 0.012, 1);
      const t4 = wallAt(L, side, us[i], 1);
      g.poly([...t1, ...t2, ...t3, ...t4]).fill(WOOD_D);
    }
    // a rolling ladder leaning on the near shelves
    const l1 = wallAt(L, side, 0.18, 0.15);
    const l2 = wallAt(L, side, 0.24, 1);
    g.poly(streak(l1[0], l1[1], l2[0], l2[1] + 10 * k, 5 * k, 7 * k)).fill(0x8a5a32);
    g.poly(streak(l1[0] + side * 60 * k, l1[1], l2[0] + side * 80 * k, l2[1] + 10 * k, 5 * k, 7 * k)).fill(0x8a5a32);
    for (let q = 1; q < 9; q++) {
      const u = q / 9;
      const x0 = l1[0] + (l2[0] - l1[0]) * u;
      const y0 = l1[1] + (l2[1] - l1[1]) * u;
      g.poly(streak(x0, y0, x0 + side * (60 + 20 * u) * k, y0, 3 * k, 3 * k)).fill(0x8a5a32);
    }
  }
}

/** the clock on the far wall (its own Graphics, origin at its center): hands at `a` (radians, the minute hand) */
function clock(g: Graphics, k: number, a: number) {
  g.clear();
  g.poly(ngon(0, 0, 54 * k, 54 * k, 20)).fill(0xf2e6cc).stroke({ width: 6 * k, color: GOLD });
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2;
    g.rect(Math.cos(t) * 42 * k - 2 * k, Math.sin(t) * 42 * k - 2 * k, 4 * k, 4 * k).fill(WOOD_D);
  }
  g.poly(streak(0, 0, Math.cos(a - Math.PI / 2) * 40 * k, Math.sin(a - Math.PI / 2) * 40 * k, 3 * k, 1.5 * k)).fill(WOOD_D);
  g.poly(streak(0, 0, Math.cos(a / 12 - Math.PI / 2) * 26 * k, Math.sin(a / 12 - Math.PI / 2) * 26 * k, 4 * k, 2 * k)).fill(WOOD_D);
}

/** the floating candles: fixed spots (seeded), each with a `lit` level; flames flicker with t */
interface Candle {
  x: number;
  y: number;
  s: number;
  lit: number;
}
function candlesOf(w: number, h: number, k: number, n: number, seed: number): Candle[] {
  const r = rnd(seed);
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const s = (0.45 + r() * 0.75) * k;
    out.push({ x: r() * w, y: 60 * k + r() * h * 0.42, s, lit: 1 });
  }
  return out.sort((a, b) => a.x - b.x);
}
function drawCandles(g: Graphics, cs: Candle[], t: number, flare = 1) {
  g.clear();
  cs.forEach((c, i) => {
    const bob = Math.sin(t * 1.3 + i) * 6 * c.s;
    const y = c.y + bob;
    g.rect(c.x - 7 * c.s, y, 14 * c.s, 50 * c.s).fill(0xf2ecd8);
    g.rect(c.x - 7 * c.s, y, 4 * c.s, 50 * c.s).fill({ color: 0xffffff, alpha: 0.6 });
    if (c.lit > 0.02) {
      const f = 1 + Math.sin(t * 17 + i * 3) * 0.12;
      const L = c.lit * flare;
      g.poly(ngon(c.x, y - 12 * c.s, 34 * c.s * L, 34 * c.s * L, 10)).fill({ color: FLAME, alpha: 0.18 * c.lit });
      g.poly([c.x, y - 30 * c.s * f * L, c.x + 6 * c.s, y - 8 * c.s, c.x, y - 1 * c.s, c.x - 6 * c.s, y - 8 * c.s]).fill({ color: FLAME, alpha: c.lit });
      g.poly([c.x, y - 18 * c.s * f * L, c.x + 3 * c.s, y - 7 * c.s, c.x - 3 * c.s, y - 7 * c.s]).fill({ color: 0xfff6d8, alpha: c.lit });
    }
  });
}

/** a flying book (local origin at its spine), covers flapping at `a` (0 shut … 1 wide open) */
function drawBook(g: Graphics, a: number, color: number, s: number) {
  const hh = 34 * s;
  const ww = 46 * s;
  const ang = 0.15 + a * 1.25;
  const c = Math.cos(ang);
  const sn = Math.sin(ang);
  for (const sd of [-1, 1]) {
    const px = sd * ww * c;
    const py = -ww * sn * 0.45;
    // the pages, then the cover just outside them
    g.poly([0, -hh, px, py - hh, px, py + hh, 0, hh]).fill(color).stroke({ width: 3 * s, color: C.ink, join: 'round' });
    g.poly([0, -hh * 0.8, px * 0.82, py * 0.8 - hh * 0.8, px * 0.82, py * 0.8 + hh * 0.8, 0, hh * 0.8]).fill(0xf6eedc);
    g.poly(streak(px * 0.2, py * 0.2 - hh * 0.4, px * 0.75, py * 0.7 - hh * 0.4, 1.5 * s, 1.5 * s)).fill(0xb8aa90);
    g.poly(streak(px * 0.2, py * 0.2, px * 0.75, py * 0.7, 1.5 * s, 1.5 * s)).fill(0xb8aa90);
  }
}

/** the hourglass (origin at its center): gold caps, posts, glass, sand split `up` (0 all below … 1 all on top) */
function drawHourglass(g: Graphics, s: number, up: number, t: number, flowing: boolean) {
  g.clear();
  const hh = 170 * s;
  const ww = 100 * s;
  g.rect(-ww - 20 * s, -hh - 26 * s, ww * 2 + 40 * s, 26 * s).fill(GOLD).stroke({ width: 4 * s, color: C.ink });
  g.rect(-ww - 20 * s, hh, ww * 2 + 40 * s, 26 * s).fill(GOLD).stroke({ width: 4 * s, color: C.ink });
  for (const x of [-ww - 6 * s, ww + 6 * s]) g.poly(streak(x, -hh, x, hh, 6 * s, 6 * s)).fill(0xb8943a);
  const glass = [-ww, -hh, ww, -hh, ww * 0.85, -hh * 0.45, ww * 0.12, -6 * s, ww * 0.12, 6 * s, ww * 0.85, hh * 0.45, ww, hh, -ww, hh, -ww * 0.85, hh * 0.45, -ww * 0.12, 6 * s, -ww * 0.12, -6 * s, -ww * 0.85, -hh * 0.45];
  g.poly(glass).fill({ color: 0xcfe8ff, alpha: 0.18 });
  // sand on top (a pile against the top) and below (a heap on the floor)
  const top = up;
  const bot = 1 - up;
  // the glass's half-width at y (top bulb), for the sand piled against the top
  const half = (y: number) => {
    const u = (y + hh) / (hh - 6 * s);
    return u < 0.55 ? ww - (ww * 0.15 * u) / 0.55 : ww * 0.85 - ((ww * 0.73) * (u - 0.55)) / 0.45;
  };
  if (top > 0.01) {
    const y = -hh + (hh - 6 * s) * 0.92 * top;
    const pts: number[] = [-ww, -hh, ww, -hh];
    for (let i = 1; i <= 4; i++) {
      const yy = -hh + ((y + hh) * i) / 4;
      pts.push(half(yy) * 0.96, yy);
    }
    for (let i = 4; i >= 1; i--) {
      const yy = -hh + ((y + hh) * i) / 4;
      pts.push(-half(yy) * 0.96, yy);
    }
    g.poly(pts).fill(0xf2c14e);
  }
  if (bot > 0.01) g.poly([-ww * 0.95, hh, ww * 0.95, hh, ww * 0.4, hh - hh * 0.8 * bot, 0, hh - hh * 0.95 * bot, -ww * 0.4, hh - hh * 0.8 * bot]).fill(0xf2c14e);
  // the stream through the neck runs UP, grains rising
  if (flowing) {
    g.rect(-2 * s, -hh * 0.8, 4 * s, hh * 0.8 + hh * 0.2).fill(0xf2c14e);
    const r = rnd(Math.floor(t * 20));
    for (let i = 0; i < 6; i++) g.rect((r() - 0.5) * 18 * s, -((t * 400 + i * 50) % (hh * 0.8)) * 1 - 10 * s, 4 * s, 4 * s).fill(0xffe08a);
  }
  g.poly(glass).stroke({ width: 4 * s, color: 0xe8f4ff, alpha: 0.7 });
  g.poly(streak(-ww * 0.7, -hh * 0.9, -ww * 0.5, -hh * 0.4, 6 * s, 3 * s)).fill({ color: 0xffffff, alpha: 0.4 });
}

interface Book {
  g: Graphics;
  sx: number;
  sy: number;
  t0: number;
  th: number;
  color: number;
}
interface St {
  books: Book[];
  candles: Candle[];
  flare: { v: number };
  ring: { v: number };
  tStart: number;
  fx: Container;
}
const S = stash<St>();

export const hermiaune: Signature = {
  dark: true,
  frame: BRONZE,
  tag: 'UNIVERSO DE LA BIBLIOTECA MÁGICA',
  open(c: SigCtx) {
    const L = hallOf(W, H, 1, W / 2);
    const k = new Container();
    const g = new Graphics();
    library(g, L);
    const clk = new Graphics();
    clk.position.set(W / 2, L.fy0 + 50);
    clock(clk, 1, 0);
    const candles = candlesOf(W, H, 1, 30, 7);
    const cg = new Graphics();
    const hg = new Graphics();
    hg.position.set(W - 330, 560);
    const books = new Container();
    const front = new Container();
    c.fg.addChild(front);
    const fx = new Container();
    k.addChild(g, clk, cg, hg, books, fx);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    // a pale halo from the window behind her head
    const halo = new Graphics();
    for (let i = 7; i >= 1; i--) halo.poly(ngon(W / 2, 360, 46 * i, 60 * i, 18)).fill({ color: 0x9ab8ff, alpha: 0.035 });
    k.addChildAt(halo, 1);
    const flare = { v: 1 };
    const ring = { v: c.short ? 1 : 0 };
    const hour = { up: c.short ? 1 : 0, rot: 0, flow: false };
    const clockA = { v: 0 };
    const list: Book[] = [];
    const tStart = performance.now();
    S.set(c, { books: list, candles, flare, ring, tStart, fx });
    // the books: they leave the shelves one after another and orbit her, flapping
    const CX = W / 2;
    const CYr = c.catY - 30;
    const launch = (i: number, at: number) => {
      const side = i % 2 ? 1 : -1;
      const [sx, sy] = wallAt(L, side, 0.1 + (i % 4) * 0.12, 0.2 + ((i * 37) % 5) * 0.12);
      const bg = new Graphics();
      books.addChild(bg);
      list.push({ g: bg, sx, sy, t0: at, th: (i / 9) * Math.PI * 2, color: SPINES[i % SPINES.length] });
    };
    const nB = 9;
    for (let i = 0; i < nB; i++) launch(i, c.short || c.reduce ? -1 : 0.12 + i * 0.09);
    const frame = (t: number) => {
      if (cg.destroyed) return;
      drawCandles(cg, candles, t, flare.v);
      clock(clk, 1, clockA.v);
      hg.rotation = hour.rot;
      drawHourglass(hg, 1, hour.up, t, hour.flow);
      for (const b of list) {
        if (b.g.destroyed) continue;
        b.g.clear();
        const lt = t - b.t0;
        if (b.t0 >= 0 && lt < 0) continue;
        const q = b.t0 < 0 ? 1 : Math.min(1, lt / 0.45);
        const e = 1 - Math.pow(1 - q, 3);
        const th = b.th + t * (0.9 + ring.v * 0.8);
        const R = 400 + ring.v * 80;
        const ox = CX + Math.cos(th) * R;
        const oy = CYr + Math.sin(th) * R * 0.42;
        b.g.position.set(b.sx + (ox - b.sx) * e, b.sy + (oy - b.sy) * e - Math.sin(e * Math.PI) * 120);
        b.g.rotation = Math.sin(t * 3 + b.th) * 0.2;
        const flap = ring.v > 0.5 ? 0.9 : 0.5 + 0.5 * Math.sin(t * 14 + b.th * 3);
        drawBook(b.g, flap, b.color, 1.45);
        // the near half of the orbit passes in front of her, the far half behind
        const near = Math.sin(th) > 0 && e > 0.6;
        if (near && b.g.parent !== front && !front.destroyed) front.addChild(b.g);
        else if (!near && b.g.parent !== books && !books.destroyed) books.addChild(b.g);
      }
    };
    frame(0);
    // Reducir movimiento: no motion, but the state changes (a cut, a light, a flip) still land: redraw still frames
    every(c, c.reduce ? 4 : 30, (t) => frame(c.reduce ? 0 : t));
    if (c.short) return;

    // ¡SHHH!
    score(c, [
      [0.02, 'whoosh', 0.7],
      [0.15, 'paper', 1.2],
    ]);
    beat(c, 0.05, () => floatWord(c, c.fg, 330, 300, '¡SHHH!', { fontFamily: F.comic, fontSize: 70, fill: 0xf2ecd8, stroke: { color: C.ink, width: 10, join: 'round' } }, 50, 0.9));
    for (let i = 0; i < nB; i++) beat(c, 0.12 + i * 0.09, () => sfx('paper', 1.4 + (i % 3) * 0.2));
    // ¡LEÍDO! stamped on books as they pass
    const stamp = (d: number, idx: number) => {
      const p = plate('¡LEÍDO!', 0xffffff, 0xc8102e, 30, 0xc8102e);
      p.alpha = 0.001;
      c.fg.addChild(p);
      beat(c, d, () => {
        const b = list[idx];
        if (!b || b.g.destroyed || p.destroyed) return;
        p.position.set(b.g.x, b.g.y - 50);
        p.rotation = -0.2 + idx * 0.05;
        p.alpha = 1;
        sfx('click', 0.9);
        if (!c.reduce) gsap.fromTo(p.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.12, ease: 'back.out(3)' });
        fadeKill(p, 0.45, 0.2);
      });
      later(c, d + 1, () => !p.destroyed && p.alpha < 0.01 && destroyTree(p));
    };
    stamp(0.6, 1);
    stamp(0.78, 4);
    stamp(0.96, 6);
    // the hourglass turns over; the sand runs up
    beat(c, 0.75, () => {
      sfx('gem', 0.8);
      sfx('whoosh', 0.9);
      if (c.reduce) hour.rot = 0;
      else gsap.fromTo(hour, { rot: 0 }, { rot: Math.PI * 2, duration: 0.45, ease: 'power2.inOut' });
      later(c, c.reduce ? 0 : 0.45, () => {
        hour.flow = true;
        if (c.reduce) hour.up = 0.7;
        else gsap.to(hour, { up: 0.85, duration: 1.2, ease: 'none' });
      });
    });
    // the clock spins backwards; the candles go out left to right, then light again right to left
    held(c, c.fg, plate('¡CAT… CIT!', GOLD, C.ink, 44, C.ink), W / 2, L.fy0 + 150, 1.05, { hold: 0.7, rot: 0.04 });
    beat(c, 1.0, () => {
      sfx('tick', 0.8);
      if (c.reduce) clockA.v = -Math.PI * 3;
      else gsap.to(clockA, { v: -Math.PI * 8, duration: 1.0, ease: 'power1.inOut' });
    });
    const n = candles.length;
    for (let i = 0; i < n; i++) {
      const cdl = candles[i];
      beat(c, 1.1 + (i / n) * 0.35, () => {
        cdl.lit = 0;
        if (i % 4 === 0) {
          const smoke = new Graphics().poly(ngon(0, 0, 10 * cdl.s, 14 * cdl.s, 8)).fill({ color: 0x8a8a9a, alpha: 0.6 });
          smoke.position.set(cdl.x, cdl.y - 20 * cdl.s);
          fx.addChild(smoke);
          if (!c.reduce) gsap.to(smoke, { y: smoke.y - 50, duration: 0.5 });
          fadeKill(smoke, 0.1, 0.4);
        }
      });
      beat(c, 1.6 + ((n - 1 - i) / n) * 0.35, () => (cdl.lit = 1));
    }
    beat(c, 1.12, () => sfx('freeze', 1.6));
    beat(c, 1.62, () => sfx('charge', 1.8));
    // she raises the wand: a twinkle at its tip; ¡YO SÉ! ¡YO SÉ!
    beat(c, 1.85, () => {
      sfx('gem', 2);
      const [x, y] = onCat(c, 0.17, 0.08);
      const tw = new Graphics().poly(twinkle(0, 0, 54)).fill(0xffffff).poly(twinkle(0, 0, 28, 0.4)).fill(GOLD);
      tw.position.set(x, y);
      c.fg.addChild(tw);
      if (!c.reduce) gsap.fromTo(tw.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.14, yoyo: true, repeat: 1 });
      fadeKill(tw, 0.3, 0.1);
      say(c, c.fg, x - 150, y - 40, '¡YO SÉ! ¡YO SÉ!', 0.5, { size: 40, tail: 'right' });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.05);
    sfx('paper', 0.8);
    c.shaker.add(0.3);
    flashOf(c, 0xfff2c8, 0.5, 0.35);
    if (st) {
      for (const cdl of st.candles) cdl.lit = 1;
      if (c.reduce) st.ring.v = 1;
      else {
        gsap.to(st.ring, { v: 1, duration: 0.3 });
        gsap.fromTo(st.flare, { v: 1.8 }, { v: 1, duration: 1.2, ease: 'power2.out' });
      }
      // loose pages flutter out of the ring
      const n = c.reduce ? 6 : 20;
      for (let i = 0; i < n; i++) {
        const pg = new Graphics().rect(-16, -22, 32, 44).fill(0xf6eedc).stroke({ width: 2, color: 0xb8aa90 });
        for (let j = 0; j < 4; j++) pg.rect(-11, -14 + j * 8, 22, 2).fill(0xb8aa90);
        const a = (i / n) * Math.PI * 2;
        pg.position.set(W / 2 + Math.cos(a) * 300, c.catY - 30 + Math.sin(a) * 130);
        pg.rotation = a;
        st.fx.addChild(pg);
        if (!c.reduce) gsap.to(pg, { x: pg.x + Math.cos(a) * 520, y: pg.y + Math.sin(a) * 260 + 260, rotation: a + 5, duration: 1.6, ease: 'power1.out' });
        fadeKill(pg, 1.1, 0.5);
      }
    }
    cheer(c, '¡LO LEÍ EN UN LIBRO!', GOLD, 120, 2.0);
    aside(c, '…en todos, de hecho.', 0xf2ecd8, { delay: 0.6, dur: 2.2 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const L = hallOf(w, h, s * 1.05, w / 2);
    const g = new Graphics();
    library(g, L);
    const clk = new Graphics();
    clk.position.set(w / 2, L.fy0 + 50 * s);
    clock(clk, s * 1.05, 1.2);
    const candles = candlesOf(w, h, s * 1.05, Math.max(10, Math.min(60, Math.round((w / m) * 22))), 9);
    const cg = new Graphics();
    drawCandles(cg, candles, 0.3);
    const hg = new Graphics();
    hg.position.set(Math.min(w - 150 * s, w / 2 + m * 0.62), h * 0.6);
    drawHourglass(hg, s * 0.9, 0.55, 0.3, live);
    const bg = new Graphics();
    k.addChild(g, clk, cg, hg, bg);
    const book = (t: number) => {
      bg.clear();
      const x = w / 2 - m * 0.55 + ((t * 0.25) % 1) * m * 1.1;
      bg.position.set(x, h * 0.3 + Math.sin(t * 2) * m * 0.04);
      drawBook(bg, 0.5 + 0.5 * Math.sin(t * 12), SPINES[2], s * 1.6);
    };
    book(0.2);
    if (live)
      liveLoop(k, (t) => {
        drawCandles(cg, candles, t);
        drawHourglass(hg, s * 0.9, 0.3 + ((t * 0.08) % 0.6), t, true);
        clock(clk, s * 1.05, 1.2 - t * 0.8);
        book(t);
      });
    return k;
  },
};
