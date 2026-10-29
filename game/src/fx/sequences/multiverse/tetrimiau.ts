/**
 * Tetrimiau, el que Completa Filas: the falling-pieces universe (born on a little green screen). Everything starts in
 * the four greens of an old handheld's LCD: a tall well of bricks, a stack at the bottom with one deep slot on the right,
 * the HUD at the sides (NIVEL · FILAS · SIGUE). An L piece drops cell by cell on the left, turns (clac) and locks; then
 * the long piece appears up top, turns upright and HARD-DROPS into the slot: four rows complete and blink — ¡CUATRO!
 * Payoff: the four rows vanish in a flash, everything above falls a floor, the screen bursts into full color, blocks fly,
 * FILAS +4, NIVEL 10; and the next piece is already falling (they never stop); ¡LÍNEA! / …y ya cae la siguiente.
 * (Generic falling-block puzzle: no names, no logos, no landmarks — just the well, the pieces and the rows.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, burst, flashOf, later } from './kit';
import { hideDisc, pixelText } from './kitA';
import { mix, rng, stash } from './kitB';
import { at, comic, pre, wrap } from './kitI';
import { headline, loop } from './kitK';
import { liveLoop } from '../../../panels/collection/cardArt';

/** the handheld's four greens (darkest → lightest) */
const LCD = [0x0f380f, 0x306230, 0x8bac0f, 0x9bbc0f];
const CORAL = 0xff7f6b;
const MINT = 0x7fd1b9;
const GOLD = 0xe6c34a;
/** piece colors once the screen goes color: I O T S Z J L */
const COLS = [0x5ad6e8, GOLD, 0x9a6ad8, MINT, CORAL, 0x4a8fe0, 0xff9f40];
/** the pieces as cell offsets (rotation 0) */
const SHAPES: number[][][] = [
  [[0, 1], [1, 1], [2, 1], [3, 1]],
  [[1, 0], [2, 0], [1, 1], [2, 1]],
  [[1, 0], [0, 1], [1, 1], [2, 1]],
  [[1, 0], [2, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[2, 0], [0, 1], [1, 1], [2, 1]],
];
const COLS_N = 16;
const ROWS_N = 18;
const CELL = 60;
/** the well's left edge (design px) */
const WX = (W - COLS_N * CELL) / 2;

/** rotate a shape's cells 90° clockwise `r` times (inside a 4×4 box) */
function rot(cells: number[][], r: number) {
  let out = cells.map(([x, y]) => [x, y]);
  for (let i = 0; i < ((r % 4) + 4) % 4; i++) out = out.map(([x, y]) => [3 - y, x]);
  const mx = Math.min(...out.map((p) => p[0]));
  const my = Math.min(...out.map((p) => p[1]));
  return out.map(([x, y]) => [x - mx, y - my]);
}

/** a bevelled block at (x, y) size s: `color` in full color, or its LCD green when `lcd` is 1 */
function block(g: Graphics, x: number, y: number, s: number, color: number, lcd: number, a = 1) {
  const base = mix(color, LCD[2], lcd);
  const hi = mix(mix(color, 0xffffff, 0.45), LCD[3], lcd);
  const lo = mix(mix(color, 0x000000, 0.4), LCD[1], lcd);
  const b = s * 0.14;
  g.rect(x, y, s, s).fill({ color: lo, alpha: a });
  g.poly([x, y, x + s, y, x + s - b, y + b, x + b, y + b, x + b, y + s - b, x, y + s]).fill({ color: hi, alpha: a });
  g.rect(x + b, y + b, s - b * 2, s - b * 2).fill({ color: base, alpha: a });
  g.rect(x + s * 0.3, y + s * 0.3, s * 0.18, s * 0.18).fill({ color: hi, alpha: a * 0.8 });
}

/** the well: brick walls, the dark field with a faint grid; `lcd` 1 = green screen, 0 = color */
function well(g: Graphics, ox: number, oy: number, s: number, lcd: number, w: number, h: number) {
  g.clear();
  const bgc = mix(0x0a0d1e, LCD[0], lcd);
  g.rect(-200, -200, w + 400, h + 400).fill(mix(0x05060e, 0x0a2a0a, lcd));
  // a dot-matrix texture outside the well
  const dot = mix(0x141a33, 0x174a17, lcd);
  const st = 40 * s;
  const wx0 = ox - 60 * s;
  const wx1 = ox + COLS_N * CELL * s + 60 * s;
  for (let y = 0; y < h; y += st)
    for (let x = ((w / 2) % st) - st; x < w; x += st) if (x + 16 * s < wx0 || x > wx1) g.rect(x, y, 16 * s, 16 * s).fill(dot);
  g.rect(ox, oy, COLS_N * CELL * s, ROWS_N * CELL * s).fill(bgc);
  const line = mix(0x1a2040, 0x1f4a1f, lcd);
  for (let i = 1; i < COLS_N; i++) g.rect(ox + i * CELL * s - 1, oy, 2, ROWS_N * CELL * s).fill(line);
  for (let j = 1; j < ROWS_N; j++) g.rect(ox, oy + j * CELL * s - 1, COLS_N * CELL * s, 2).fill(line);
  // brick walls
  const bw = 60 * s;
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? ox - bw : ox + COLS_N * CELL * s;
    for (let j = 0; j < ROWS_N * 2; j++) {
      const y = oy + j * 30 * s;
      const off = j % 2 ? 0 : 30 * s;
      for (let x = x0 - off; x < x0 + bw; x += 60 * s) {
        const xa = Math.max(x0, x);
        const xb = Math.min(x0 + bw, x + 60 * s);
        if (xb - xa < 2) continue;
        g.rect(xa + 2, y + 2, xb - xa - 4, 26 * s).fill(mix(0x8a4a3a, LCD[1], lcd));
        g.rect(xa + 2, y + 2, xb - xa - 4, 6 * s).fill(mix(0xb06a50, LCD[2], lcd));
      }
    }
  }
}

/** the HUD panels at the sides of the well */
function hud(g: Graphics, ox: number, oy: number, s: number, lcd: number, level: number, rows: number, next: number) {
  g.clear();
  const ink = mix(0xf4f1ea, LCD[3], lcd);
  const box = mix(0x14183a, LCD[1], lcd);
  const edge = mix(MINT, LCD[3], lcd);
  const lx = ox - 60 * s - 260 * s;
  const rx = ox + COLS_N * CELL * s + 60 * s + 30 * s;
  const panel = (x: number, y: number, label: string, value: string) => {
    g.rect(x - 4 * s, y - 4 * s, 238 * s, 138 * s).fill(edge);
    g.rect(x, y, 230 * s, 130 * s).fill(box);
    pixelText(g, label, x + 115 * s, y + 18 * s, 6 * s, ink, 'center');
    pixelText(g, value, x + 115 * s, y + 70 * s, 7 * s, mix(GOLD, LCD[3], lcd), 'center');
  };
  panel(lx, oy + 260 * s, 'NIVEL', String(level));
  panel(lx, oy + 440 * s, 'FILAS', String(rows));
  // the next piece
  g.rect(rx - 4 * s, oy + 256 * s, 238 * s, 238 * s).fill(edge);
  g.rect(rx, oy + 260 * s, 230 * s, 230 * s).fill(box);
  pixelText(g, 'SIGUE', rx + 115 * s, oy + 278 * s, 6 * s, ink, 'center');
  const cells = rot(SHAPES[next], 0);
  const cw = Math.max(...cells.map((p) => p[0])) + 1;
  const chh = Math.max(...cells.map((p) => p[1])) + 1;
  const cs = 40 * s;
  for (const [x, y] of cells) block(g, rx + 115 * s - (cw * cs) / 2 + x * cs, oy + 400 * s - (chh * cs) / 2 + y * cs, cs, COLS[next], lcd);
}

/** the starting stack: rows 13–16 full but a deep slot in column 15 and an L-shaped gap on the left; row 17 full */
function startStack(): number[][] {
  const r = rng(77);
  const grid: number[][] = Array.from({ length: ROWS_N }, () => Array(COLS_N).fill(-1));
  for (let j = 13; j < ROWS_N; j++) for (let i = 0; i < COLS_N; i++) grid[j][i] = Math.floor(r() * 7);
  for (let j = 13; j <= 16; j++) grid[j][15] = -1;
  // the gap the L fills: (0,13) (1,13) (2,13) (0,14)
  grid[13][0] = grid[13][1] = grid[13][2] = grid[14][0] = -1;
  // a ragged stack over the four rows (it falls four floors when they clear): row 12 mostly full, 11 half, 10 a few
  for (let i = 0; i < 15; i++) if (i > 2 && r() < 0.8) grid[12][i] = Math.floor(r() * 7);
  for (let i = 3; i < 15; i++) if (r() < 0.45) grid[11][i] = Math.floor(r() * 7);
  for (const i of [6, 7, 11]) grid[10][i] = Math.floor(r() * 7);
  return grid;
}

interface Falling {
  kind: number;
  r: number;
  x: number;
  y: number;
  a: number;
}

/** draw the stack (skipping blinking rows when `blinkOff`), and the falling pieces */
function drawField(g: Graphics, grid: number[][], fall: Falling[], ox: number, oy: number, s: number, lcd: number, blink: number[], blinkOff: boolean, drop: number) {
  g.clear();
  const cs = CELL * s;
  for (let j = 0; j < ROWS_N; j++) {
    const bl = blink.includes(j);
    // rows above the cleared ones fall a floor (drop 0..1 → 0..4 cells)
    const dy = blink.length && !bl && j < Math.min(...blink) ? drop * blink.length * cs : 0;
    for (let i = 0; i < COLS_N; i++) {
      const k = grid[j][i];
      if (k < 0) continue;
      if (bl && blinkOff) {
        g.rect(ox + i * cs, oy + j * cs, cs, cs).fill(mix(0xffffff, LCD[3], lcd));
        continue;
      }
      if (bl && drop > 0) continue;
      block(g, ox + i * cs, oy + j * cs + dy, cs, COLS[k], lcd);
    }
  }
  for (const f of fall) for (const [x, y] of rot(SHAPES[f.kind], f.r)) block(g, ox + (f.x + x) * cs, oy + (f.y + y) * cs, cs, COLS[f.kind], lcd, f.a);
}

interface St {
  lcd: { v: number };
  drop: { v: number };
  blink: number[];
  grid: number[][];
  rows: { v: number };
  level: { v: number };
  rain: { on: boolean };
  fall: Falling[];
  draw: () => void;
  land: (o?: { dur?: number; slow?: boolean }) => void;
}
const S = stash<St>();

export const tetrimiau: Signature = {
  dark: true,
  frame: MINT,
  tag: 'UNIVERSO DE LAS PIEZAS',
  open(c: SigCtx) {
    const k = new Container();
    const wg = new Graphics();
    const hg = new Graphics();
    const fg = new Graphics();
    k.addChild(wg, hg, fg);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const instant = c.short || c.reduce;
    const lcd = { v: c.short ? 0 : 1 };
    const drop = { v: 0 };
    const blink: number[] = [];
    let blinkOff = false;
    const grid = startStack();
    const rows = { v: 36 };
    const level = { v: 9 };
    const rain = { on: !!c.short };
    const fall: Falling[] = [];
    // the L (kind 6 rotated to fill the gap) and the long piece (kind 0)
    const L = { kind: 6, r: 1, x: 0, y: 1, a: 1 };
    const I = { kind: 0, r: 0, x: 11, y: 2, a: 0 };
    if (instant) {
      grid[13][0] = grid[13][1] = grid[13][2] = grid[14][0] = 6;
      if (!c.short) for (let j = 13; j <= 16; j++) grid[j][15] = 0;
    } else fall.push(L, I);
    if (c.short) {
      // a duplicate: the screen is already in color and the rows already cleared
      for (let j = 13; j <= 16; j++) grid[j].fill(-1);
    }
    // the ambient rain of pieces in the side columns (after the payoff, and on a duplicate)
    const r = rng(5);
    let nextKind = 2;
    let rainT = 0;
    let lastT = 0;
    let lastLcd = -1;
    let hudKey = '';
    const draw = loop(
      c,
      fg,
      30,
      (t) => {
        const dt = Math.min(0.1, t - lastT);
        lastT = t;
        if (Math.abs(lcd.v - lastLcd) > 0.01) {
          well(wg, WX, 0, 1, lcd.v, W, H);
          lastLcd = lcd.v;
          hudKey = '';
        }
        const key = `${level.v}|${rows.v}|${nextKind}|${lcd.v.toFixed(2)}`;
        if (key !== hudKey) {
          hud(hg, WX, 0, 1, lcd.v, level.v, rows.v, nextKind);
          hudKey = key;
        }
        if (rain.on && !c.reduce) {
          rainT += dt;
          for (const f of fall) if (f.a > 0 && f.kind >= 0) f.y += dt * 9;
          for (let i = fall.length - 1; i >= 0; i--) if (fall[i].y > 12) fall.splice(i, 1);
          if (rainT > 0.75) {
            rainT = 0;
            const side = r() < 0.5;
            fall.push({ kind: nextKind, r: Math.floor(r() * 4), x: side ? Math.floor(r() * 2) : 12 + Math.floor(r() * 2), y: -3, a: 1 });
            nextKind = Math.floor(r() * 7);
          }
        }
        drawField(fg, grid, fall.map((f) => ({ ...f, y: Math.floor(f.y) })), WX, 0, 1, lcd.v, blink, blinkOff, drop.v);
      },
      0,
    );
    const land = headline(c, comic('¡LÍNEA!', GOLD, 150), '…y ya cae la siguiente.');
    S.set(c, { lcd, drop, blink, grid, rows, level, rain, fall, draw, land });
    if (c.short) return;

    const clac = pre(c, comic('clac', 0xd8f0a0, 70), 600, 250, -0.12);
    const cuatro = pre(c, comic('¡CUATRO!', 0xe8ffb0, 130), 1550, 700, 0.08);
    // the L drops cell by cell, turns once, locks into its gap
    const lSteps = 15;
    for (let i = 0; i <= lSteps; i++)
      at(c, 0.05 + i * 0.05, () => {
        if (c.reduce) return;
        L.y = 1 + (i * 12) / lSteps;
        if (i === 5) {
          L.r = 2;
          clac(0.4, { from: 1.3 });
          sfx('click', 1.3);
        } else sfx('tick', 1.8);
      });
    at(c, 0.85, () => {
      const idx = fall.indexOf(L);
      if (idx >= 0) fall.splice(idx, 1);
      grid[13][0] = grid[13][1] = grid[13][2] = grid[14][0] = 6;
      sfx('hit', 0.8);
      c.shaker.add(0.08);
    });
    // the long piece appears up top, turns upright, hard-drops into the slot
    at(c, 0.95, () => {
      I.a = 1;
      sfx('pop', 1.4);
    });
    at(c, 1.2, () => {
      I.r = 1;
      I.x = 15;
      I.y = 2;
      sfx('click', 1.5);
    });
    at(c, 1.45, () => {
      sfx('whoosh', 1.4);
      if (c.reduce) I.y = 13;
      else gsap.to(I, { y: 13, duration: 0.12, ease: 'power3.in' });
    });
    at(c, 1.58, () => {
      const idx = fall.indexOf(I);
      if (idx >= 0) fall.splice(idx, 1);
      for (let j = 13; j <= 16; j++) grid[j][15] = 0;
      sfx('hit', 0.6);
      sfx('boom', 0.8);
      c.shaker.add(0.25);
      blink.push(13, 14, 15, 16);
      cuatro(0.7);
      for (let b = 0; b < 6; b++)
        later(c, b * 0.1, () => {
          blinkOff = !blinkOff;
          if (b % 2 === 0) sfx('tick', 2.6);
        });
      later(c, 0.6, () => (blinkOff = false));
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.2);
    sfx('bigboom', 0.7);
    c.shaker.add(0.4);
    flashOf(c, 0xffffff, 0.55, 0.3);
    [0, 4, 7, 12, 16].forEach((n, i) => later(c, i * 0.06, () => sfx('coin', Math.pow(2, n / 12))));
    if (st) {
      // the rows vanish (a skipped reveal clears them all the same) and the stack falls a floor
      if (!st.blink.length) st.blink.push(13, 14, 15, 16);
      for (let j = 13; j <= 16; j++) for (let i = 0; i < COLS_N; i++) if (st.grid[j][i] < 0) st.grid[j][i] = 0;
      const settle = () => {
        const above = st.grid.slice(0, 13);
        const kept = st.grid.slice(17);
        const empty = Array.from({ length: 4 }, () => Array(COLS_N).fill(-1));
        const ng = [...empty, ...above, ...kept];
        for (let j = 0; j < ROWS_N; j++) st.grid[j] = ng[j];
        st.blink.length = 0;
        st.drop.v = 0;
      };
      if (c.reduce) {
        st.lcd.v = 0;
        settle();
      } else {
        gsap.to(st.drop, { v: 1, duration: 0.3, delay: 0.12, ease: 'bounce.out', onComplete: settle });
        gsap.to(st.lcd, { v: 0, duration: 0.35, ease: 'power1.out' });
      }
      st.fall.length = 0;
      st.rows.v += 4;
      st.level.v += 1;
      st.rain.on = true;
      if (c.reduce) st.draw();
      // blocks fly off the cleared rows
      for (let j = 0; j < 4; j++)
        burst(
          c,
          c.fg,
          (i) => {
            const g = new Graphics();
            block(g, -18, -18, 36, COLS[(i + j) % 7], 0);
            return g;
          },
          8,
          W / 2 + (j - 1.5) * 260,
          13 * CELL + j * CELL + 30,
          700,
          1.2,
        );
    }
    if (st) st.land({ dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const s = h / (ROWS_N * CELL);
    const ox = w / 2 - (COLS_N * CELL * s) / 2;
    const wg = new Graphics();
    well(wg, ox, 0, s, 0, w, h);
    const hg = new Graphics();
    hud(hg, ox, 0, s, 0, 10, 40, 2);
    const fg = new Graphics();
    const grid = startStack();
    grid[13][0] = grid[13][1] = grid[13][2] = grid[14][0] = 6;
    const fall: Falling[] = [{ kind: 2, r: 0, x: 1, y: 3, a: 1 }];
    drawField(fg, grid, fall, ox, 0, s, 0, [], false, 0);
    k.addChild(wg, hg, fg);
    if (live) {
      let last = -1;
      liveLoop(k, (t) => {
        const step = Math.floor(t * 4) % 40;
        if (step === last) return;
        last = step;
        // a T drops down the left columns, turning every few steps, then starts over
        fall[0].y = (step % 10) - 2;
        fall[0].r = Math.floor(step / 3) % 4;
        fall[0].x = step < 20 ? 1 : 12;
        drawField(fg, grid, fall, ox, 0, s, 0, [], false, 0);
      });
    }
    return k;
  },
};

