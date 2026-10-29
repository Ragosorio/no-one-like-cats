/**
 * Mi Pobre Gatito, el de las Trampas de Navidad: the home-alone universe. A warm house on Christmas night: the foyer's
 * cream wallpaper, a big arched window onto a snowy street (falling snow, the neighbours' roofs in coloured bulbs), the
 * staircase with its red runner and lights on the banister, a green front door with a wreath and a frosted pane, the
 * tree in the corner. A paint can on a rope lets go from the landing and swings down over the stairs (¡FIUUU!), toy cars
 * roll across the floor (¡TRRRR!), and someone knocks: two cat burglars' shadows in the frosted glass (¡TOC, TOC!
 * «¿Hay alguien en casa?») — 4 TRAMPAS LISTAS.
 * Payoff: the scream, paws on his cheeks (¡AAAAH!…), then the grin (¡JA!): the door swings open and a second can swings
 * in — ¡BONK! — the two shadows tip over under spinning stars, the lights go wild, toy cars and ornaments fly; …la casa se
 * defiende sola. (No film names or lines; slapstick only — nobody gets hurt on screen.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, burst, every, fall, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, balloon, ngon, onCat, rnd, say, streak, twinkle } from './kitD';
import { catenary, star5, stringLights, strip } from './kitH';
import { at, comic, pre, wrap } from './kitI';
import { cheer2, shoutLines, snow } from './kitL';

const RED = 0xd62839;
const GOLD = 0xffd23f;
const GREEN = 0x2e7d5b;
const WALL = 0xe9d6ab;
const WALL_D = 0xd2b98a;
const WOOD = 0x5a3420;
const WOOD_D = 0x3e2214;
const FLOOR = [0x8a5a32, 0x7a4c2a];
const DOOR = 0x1f4d36;
const PORCH = 0xffc77a;
const SIL = 0x1c1424;
const BULBS = [RED, GOLD, 0x3fb0ff, 0x4fd27a, 0xff7ad1];
const HZ = 700;
/** the arched window: x0..x1, the arch springs at WY0 (radius WR), sill at WY1 */
const WX0 = 760;
const WX1 = 1160;
const WR = (WX1 - WX0) / 2;
const WY0 = 330;
const WY1 = 600;
/** the front door's opening */
const DX0 = 1230;
const DX1 = 1400;
const DY0 = 300;
/** the first can's pendulum: pivot, rope length, start angle (it waits on the landing) */
const P1: [number, number] = [520, -60];
const L1 = 440;
const A1 = -0.85;
/** the payoff's can, over the door */
const P2: [number, number] = [1315, -40];
const L2 = 420;

const inWindow = (x: number, y: number, pad = 0) => (x > WX0 - pad && x < WX1 + pad && y > WY0 && y < WY1 + pad) || Math.hypot(x - (WX0 + WR), y - WY0) < WR + pad;

/** the arched window's outline (for the wall's hole and the frame) */
function windowPts(x0: number, x1: number, y0: number, y1: number): number[] {
  const r = (x1 - x0) / 2;
  const p: number[] = [x0, y1, x0, y0];
  for (let i = 1; i < 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI;
    p.push(x0 + r + Math.cos(a) * r, y0 + Math.sin(a) * r);
  }
  p.push(x1, y0, x1, y1);
  return p;
}

/** the snowy street seen through the window (sky, moon, roofs with bulbs, snowy yard) — in the window's bbox */
function street(g: Graphics, x0: number, y0: number, w: number, h: number, k = 1) {
  vgrad(g, x0, y0, w, h, [0x0a1534, 0x1c3366, 0x3a5a94], 10);
  const r = rnd(12);
  for (let i = 0; i < 30; i++) g.rect(x0 + r() * w, y0 + r() * h * 0.5, 2.2 * k, 2.2 * k).fill({ color: 0xffffff, alpha: 0.4 + r() * 0.5 });
  g.poly(ngon(x0 + w * 0.74, y0 + h * 0.2, 30 * k, 30 * k, 18)).fill(0xf4f0dc);
  g.poly(ngon(x0 + w * 0.74, y0 + h * 0.2, 46 * k, 46 * k, 18)).fill({ color: 0xf4f0dc, alpha: 0.15 });
  // two neighbours' houses: gables, lit windows, snow on the roof, a row of bulbs on the eaves
  const hy = y0 + h * 0.66;
  for (const [hx, hw, col] of [
    [x0 + w * 0.05, w * 0.42, 0x2a2440],
    [x0 + w * 0.55, w * 0.4, 0x24304a],
  ] as [number, number, number][]) {
    g.rect(hx, hy - h * 0.16, hw, h * 0.2).fill(col);
    g.poly([hx - 8 * k, hy - h * 0.16, hx + hw / 2, hy - h * 0.32, hx + hw + 8 * k, hy - h * 0.16]).fill(0x1a1630);
    g.poly([hx - 8 * k, hy - h * 0.16, hx + hw / 2, hy - h * 0.32, hx + hw + 8 * k, hy - h * 0.16, hx + hw / 2, hy - h * 0.29]).fill(0xf2f6ff);
    for (let j = 0; j < 2; j++) g.rect(hx + hw * (0.18 + j * 0.46), hy - h * 0.12, hw * 0.18, h * 0.08).fill(0xffd27a);
    for (let j = 0; j < 7; j++) g.poly(ngon(hx + (j / 6) * hw, hy - h * 0.15, 3.4 * k, 3.4 * k, 6)).fill(BULBS[j % BULBS.length]);
  }
  g.rect(x0, hy + h * 0.04, w, h - (hy - y0) - h * 0.04).fill(0xdfe8f6);
  g.rect(x0, hy + h * 0.04, w, 6 * k).fill(0xb8c6de);
}

/** a paint can hanging from its bail (origin at the bail's top, where the rope ties): red paint dripping over the rim */
function paintCan(s = 1) {
  const g = new Graphics();
  // the wire bail
  const bail: number[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    bail.push(Math.cos(a) * 34 * s, 34 * s + Math.sin(a) * 32 * s);
  }
  g.poly(strip(bail, 2.2 * s)).fill(0x2a2a30);
  g.poly(ngon(0, 112 * s, 36 * s, 10 * s, 14)).fill(0x6a7078);
  g.poly([-36 * s, 36 * s, 36 * s, 36 * s, 36 * s, 112 * s, -36 * s, 112 * s]).fill(0x9aa2ac).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.rect(18 * s, 38 * s, 10 * s, 72 * s).fill({ color: 0xffffff, alpha: 0.35 });
  g.rect(-36 * s, 62 * s, 72 * s, 30 * s).fill(0xf2efe6);
  g.poly(ngon(-6 * s, 77 * s, 9 * s, 9 * s, 10)).fill(RED);
  g.poly(ngon(0, 36 * s, 36 * s, 10 * s, 14)).fill(RED).stroke({ width: 3 * s, color: C.ink });
  // drips
  for (const [dx, len] of [
    [-26, 22],
    [-8, 36],
    [12, 18],
    [28, 30],
  ])
    g.poly([dx * s - 5 * s, 40 * s, dx * s + 5 * s, 40 * s, dx * s + 4 * s, (40 + len) * s, dx * s, (44 + len) * s, dx * s - 4 * s, (40 + len) * s]).fill(RED);
  return g;
}

/** a toy car (origin at its bottom center), colour `col` */
function toyCar(col: number, s = 1) {
  const g = new Graphics();
  g.poly([-46 * s, -12 * s, -40 * s, -30 * s, 40 * s, -30 * s, 48 * s, -14 * s, 48 * s, -6 * s, -46 * s, -6 * s]).fill(col).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.poly([-24 * s, -30 * s, -14 * s, -48 * s, 18 * s, -48 * s, 28 * s, -30 * s]).fill(col).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.poly([-18 * s, -32 * s, -11 * s, -44 * s, 2 * s, -44 * s, 2 * s, -32 * s]).fill(0xbfe6ff);
  g.poly([6 * s, -32 * s, 6 * s, -44 * s, 16 * s, -44 * s, 22 * s, -32 * s]).fill(0xbfe6ff);
  for (const wx of [-28, 28]) {
    g.poly(ngon(wx * s, -6 * s, 11 * s, 11 * s, 10)).fill(C.ink);
    g.poly(ngon(wx * s, -6 * s, 4 * s, 4 * s, 6)).fill(0xd8d8d8);
  }
  g.rect(40 * s, -24 * s, 6 * s, 6 * s).fill(0xfff2a8);
  return g;
}

/** a cat burglar's shadow (origin at its feet): `tall` = the lanky one with a beanie, else the round one with a cap */
function burglar(tall: boolean) {
  const g = new Graphics();
  if (tall) {
    g.poly([-26, 0, -18, -150, 18, -150, 26, 0]).fill(SIL);
    g.poly([-34, -150, 34, -150, 30, -270, -30, -270]).fill(SIL);
    g.poly(ngon(0, -300, 30, 32, 14)).fill(SIL);
    g.poly([-26, -318, -30, -352, -10, -328]).fill(SIL).poly([26, -318, 30, -352, 10, -328]).fill(SIL);
    g.poly([-28, -312, 28, -312, 22, -344, 0, -356, -22, -344]).fill(SIL);
    g.poly(ngon(0, -358, 9, 9, 8)).fill(SIL);
  } else {
    g.poly([-30, 0, -24, -90, 24, -90, 30, 0]).fill(SIL);
    g.poly(ngon(0, -150, 52, 64, 16)).fill(SIL);
    g.poly(ngon(0, -238, 36, 32, 14)).fill(SIL);
    g.poly([-30, -252, -34, -286, -14, -262]).fill(SIL).poly([30, -252, 34, -286, 14, -262]).fill(SIL);
    g.poly([-36, -258, 36, -258, 30, -276, -30, -276]).fill(SIL).poly([20, -262, 64, -262, 60, -254, 20, -254]).fill(SIL);
  }
  return g;
}

/** the staircase to the landing (left): the stair mass, red runner on the risers, treads, banister, newel post */
function stairs(g: Graphics, x0: number, y0: number, n: number, run: number, rise: number, k = 1) {
  const prof: number[] = [x0, y0];
  for (let i = 0; i < n; i++) {
    const x = x0 - i * run;
    const y = y0 - (i + 1) * rise;
    prof.push(x, y, x - run, y);
  }
  const xt = x0 - n * run;
  const yt = y0 - n * rise;
  prof.push(-200 * k, yt, -200 * k, y0);
  g.poly(prof).fill(WOOD_D);
  for (let i = 0; i < n; i++) {
    const x = x0 - i * run;
    const y = y0 - (i + 1) * rise;
    g.rect(x - run * 0.82, y, run * 0.64, rise).fill(0xa8202e);
    g.rect(x - run * 0.82, y + rise - 4 * k, run * 0.64, 4 * k).fill(0x6e1420);
    g.rect(x - run - 4 * k, y - 5 * k, run + 10 * k, 8 * k).fill(0xb07a48);
    g.rect(x - run * 0.86, y + rise * 0.2, run * 0.72, 3 * k).fill(GOLD);
  }
  // the landing and the banister
  g.rect(-200 * k, yt - 5 * k, xt + 200 * k + 10 * k, 10 * k).fill(0xb07a48);
  const rh = 120 * k;
  for (let i = 0; i <= n; i++) {
    const x = x0 - i * run - run * 0.2;
    const y = y0 - i * rise - rise * 0.6;
    g.rect(x - 3 * k, y - rh + i * 0, 6 * k, rh - 4 * k).fill(WOOD);
  }
  g.poly(streak(x0 + 30 * k, y0 - rh - 10 * k, xt - run * 0.4, yt - rh, 7 * k, 7 * k)).fill(WOOD);
  g.rect(-200 * k, yt - rh - 6 * k, xt + 200 * k, 12 * k).fill(WOOD);
  for (let x = xt - 40 * k; x > -200 * k; x -= 40 * k) g.rect(x - 3 * k, yt - rh, 6 * k, rh).fill(WOOD);
  g.rect(x0 + 18 * k, y0 - rh - 30 * k, 30 * k, rh + 30 * k).fill(WOOD).stroke({ width: 3 * k, color: WOOD_D });
  g.poly(ngon(x0 + 33 * k, y0 - rh - 40 * k, 20 * k, 16 * k, 12)).fill(0xb07a48);
  return { railFrom: [x0 + 30 * k, y0 - rh - 6 * k] as [number, number], railTo: [xt - run * 0.4, yt - rh + 4 * k] as [number, number] };
}

/** the Christmas tree (origin at its foot, height ≈ 470·s): tiers, a star, ornaments, presents */
function tree(g: Graphics, x: number, y: number, s = 1) {
  for (const [dx, col] of [
    [-24, 0x5a3a8a],
    [34, RED],
    [-70, 0x2a7ad0],
    [80, GOLD],
  ] as [number, number][]) {
    g.rect(x + dx * s - 28 * s, y - 50 * s, 56 * s, 50 * s).fill(col).stroke({ width: 3 * s, color: C.ink });
    g.rect(x + dx * s - 5 * s, y - 50 * s, 10 * s, 50 * s).fill(0xf6f0e0);
    g.rect(x + dx * s - 28 * s, y - 30 * s, 56 * s, 8 * s).fill(0xf6f0e0);
  }
  g.rect(x - 14 * s, y - 90 * s, 28 * s, 50 * s).fill(WOOD);
  const tiers: [number, number, number][] = [
    [90, 160, 150],
    [190, 130, 125],
    [280, 100, 100],
    [360, 70, 80],
  ];
  for (const [ty, hw, th] of tiers) {
    g.poly([x - hw * s, y - (ty - 10) * s, x, y - (ty + th) * s, x + hw * s, y - (ty - 10) * s]).fill(0x1d5a36);
    g.poly([x - hw * s, y - (ty - 10) * s, x, y - (ty + th) * s, x - hw * s * 0.2, y - (ty - 10) * s]).fill(0x2a7a4a);
  }
  const r = rnd(5);
  for (let i = 0; i < 16; i++) {
    const u = r();
    const yy = y - (110 + u * 300) * s;
    const half = (1 - u) * 140 * s;
    g.poly(ngon(x + (r() - 0.5) * 2 * half * 0.8, yy, 9 * s, 9 * s, 8)).fill([RED, GOLD, 0x3fb0ff, 0xffffff][i % 4]);
  }
  g.poly(star5(x, y - 450 * s, 30 * s, 0.45)).fill(GOLD).stroke({ width: 3 * s, color: C.ink, join: 'round' });
}

/** the tree's light points (for the lights Graphics): a zigzag garland down the tiers */
function treeLightPts(x: number, y: number, s = 1): number[][] {
  const rows: number[][] = [];
  for (const [y0, y1, h0, h1] of [
    [380, 330, 40, 70],
    [300, 240, 60, 100],
    [210, 150, 80, 130],
  ]) rows.push(catenary(x - h0 * s, y - y0 * s, x + h1 * s, y - y1 * s, 18 * s, 8));
  return rows;
}

interface St {
  party: { v: number };
  door: Graphics;
  sils: Graphics[];
  k: Container;
  can2: Container;
  rope2: Graphics;
}
const S = stash<St>();

export const pobregatito: Signature = {
  dark: false,
  frame: RED,
  tag: 'UNIVERSO DE LA CASA SOLA',
  open(c: SigCtx) {
    const k = new Container();
    // the street outside, then the wall with the window cut out of it
    const out = new Graphics();
    street(out, WX0, WY0 - WR, WX1 - WX0, WY1 - WY0 + WR);
    const flakes = new Graphics();
    const wall = new Graphics().rect(-200, -200, W + 400, HZ + 200).fill(WALL).poly(windowPts(WX0, WX1, WY0, WY1)).cut();
    const r = rnd(3);
    for (let y = -20; y < 540; y += 64)
      for (let x = ((y / 64) % 2) * 40 - 40; x < W + 40; x += 80) if (!inWindow(x, y, 30)) wall.poly([x, y - 10, x + 7, y, x, y + 10, x - 7, y]).fill({ color: WALL_D, alpha: 0.8 + r() * 0.2 });
    // wainscot and chair rail
    wall.rect(-200, 540, W + 400, HZ - 540).fill(WOOD).rect(-200, 532, W + 400, 14).fill(WOOD_D);
    for (let x = -120; x < W + 100; x += 170) wall.rect(x, 566, 130, 108).stroke({ width: 4, color: WOOD_D });
    // the window: frame, mullions, sill, a garland
    const frame = new Graphics();
    frame.poly(windowPts(WX0, WX1, WY0, WY1)).stroke({ width: 18, color: 0xf6efe0, join: 'round' });
    frame.rect(WX0 + WR - 6, WY0 - WR, 12, WY1 - WY0 + WR).fill(0xf6efe0).rect(WX0, WY0 + 60, WX1 - WX0, 12).fill(0xf6efe0);
    frame.rect(WX0 - 30, WY1, WX1 - WX0 + 60, 20).fill(0xf6efe0).rect(WX0 - 30, WY1 + 18, WX1 - WX0 + 60, 8).fill(WALL_D);
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI + (i / 18) * Math.PI;
      frame.poly(ngon(WX0 + WR + Math.cos(a) * (WR + 22), WY0 + Math.sin(a) * (WR + 22), 22, 16, 7, a)).fill(i % 2 ? 0x1d5a36 : 0x2a7a4a);
    }
    frame.poly(ngon(WX0 + WR, WY0 - WR - 22, 24, 18, 10)).fill(RED).poly([WX0 + WR - 4, WY0 - WR - 14, WX0 + WR - 30, WY0 - WR + 30, WX0 + WR - 14, WY0 - WR + 30]).fill(RED).poly([WX0 + WR + 4, WY0 - WR - 14, WX0 + WR + 30, WY0 - WR + 30, WX0 + WR + 14, WY0 - WR + 30]).fill(RED);
    // the doorway (porch light, the two shadows waiting outside) and the door on its hinge
    const doorway = new Graphics().rect(DX0, DY0, DX1 - DX0, HZ - DY0).fill(PORCH);
    for (let i = 0; i < 5; i++) doorway.rect(DX0, DY0 + i * 30, DX1 - DX0, 30).fill({ color: 0xffffff, alpha: 0.05 * (5 - i) });
    const sils = [burglar(true), burglar(false)];
    sils[0].position.set(DX0 + 50, HZ);
    sils[1].position.set(DX0 + 118, HZ);
    for (const s of sils) s.alpha = 0;
    const door = new Graphics();
    const dw = DX1 - DX0;
    // the pane is a hole in the door: the porch light and whoever stands outside show through the frosted glass
    door.rect(0, 0, dw, HZ - DY0).fill(DOOR).rect(20, 28, dw - 40, 196).cut();
    door.rect(0, 0, dw, HZ - DY0).stroke({ width: 5, color: C.ink });
    door.rect(20, 28, dw - 40, 196).fill({ color: 0xfff0d0, alpha: 0.42 }).stroke({ width: 6, color: 0x123222 });
    door.rect(dw / 2 - 3, 28, 6, 196).fill(0x123222).rect(20, 122, dw - 40, 6).fill(0x123222);
    door.rect(22, 250, dw - 44, 130).stroke({ width: 5, color: 0x123222 });
    door.poly(ngon(dw - 24, 240, 8, 8, 10)).fill(GOLD);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      door.poly(ngon(dw / 2 + Math.cos(a) * 34, 300 + Math.sin(a) * 34, 15, 12, 7, a)).fill(i % 2 ? 0x1d5a36 : 0x2f8a52);
    }
    door.poly([dw / 2, 268, dw / 2 - 22, 252, dw / 2 - 22, 284]).fill(RED).poly([dw / 2, 268, dw / 2 + 22, 252, dw / 2 + 22, 284]).fill(RED).poly(ngon(dw / 2, 268, 7, 7, 8)).fill(0xa8202e);
    door.position.set(DX0, DY0);
    const trans = new Graphics();
    const tp: number[] = [DX0, DY0];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      tp.push(DX0 + dw / 2 + Math.cos(a) * dw / 2, DY0 + Math.sin(a) * 70);
    }
    trans.poly(tp).fill(0xffd9a0).stroke({ width: 8, color: 0xf6efe0 });
    for (let i = 1; i < 5; i++) trans.poly(streak(DX0 + dw / 2, DY0, DX0 + dw / 2 + Math.cos(Math.PI + (i / 5) * Math.PI) * dw / 2, DY0 + Math.sin(Math.PI + (i / 5) * Math.PI) * 70, 3, 3)).fill(0xf6efe0);
    trans.rect(DX0 - 14, DY0 - 6, dw + 28, 12).fill(0xf6efe0).rect(DX0 - 14, DY0, 14, HZ - DY0).fill(0xf6efe0).rect(DX1, DY0, 14, HZ - DY0).fill(0xf6efe0);
    // the floor (planks in perspective) and a red rug under him
    const floor = new Graphics().rect(-200, HZ, W + 400, H - HZ + 200).fill(FLOOR[0]);
    for (let i = -10; i <= 10; i++) {
      const xb0 = 960 + i * 170;
      const xb1 = xb0 + 170;
      if (i % 2) floor.poly([960 + (xb0 - 960) * 0.42, HZ, 960 + (xb1 - 960) * 0.42, HZ, xb1, H + 200, xb0, H + 200]).fill(FLOOR[1]);
    }
    floor.rect(-200, HZ, W + 400, 10).fill(WOOD_D);
    floor.poly(ngon(960, 790, 420, 74, 28)).fill(0x7a1622).poly(ngon(960, 790, 396, 64, 28)).fill(0xa8202e);
    floor.poly(ngon(960, 790, 340, 50, 28)).stroke({ width: 5, color: GOLD, alpha: 0.8 });
    // the staircase (left) and the tree (right)
    const st = new Graphics();
    const rail = stairs(st, 640, HZ, 9, 46, 40);
    const tr = new Graphics();
    tree(tr, 1615, HZ + 4, 1);
    const lights = new Graphics();
    const railPts = catenary(rail.railFrom[0], rail.railFrom[1] + 6, rail.railTo[0], rail.railTo[1] + 6, 22, 14);
    const archPts: number[] = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI + 0.12 + (i / 14) * (Math.PI - 0.24);
      archPts.push(WX0 + WR + Math.cos(a) * (WR + 44), WY0 + Math.sin(a) * (WR + 44));
    }
    const doorPts = catenary(DX0 - 20, DY0 - 30, DX1 + 20, DY0 - 30, 26, 10);
    const tl = treeLightPts(1615, HZ + 4);
    // the first can on its rope, waiting on the landing
    const rope = new Graphics();
    const can = new Container();
    can.addChild(paintCan(1));
    const cars = new Container();
    const can2 = new Container();
    can2.addChild(paintCan(1));
    can2.visible = false;
    const rope2 = new Graphics();
    k.addChild(out, flakes, wall, frame, doorway, ...sils, door, trans, floor, st, tr, lights, rope, can, cars, rope2, can2);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // a warm lamp glow behind the silhouette
    const bl = backlight(0xfff1c8, 380, 0.45);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);

    const party = { v: 0 };
    S.set(c, { party, door, sils, k, can2, rope2 });
    let go = false; // the can let go…
    let rel = -1; // …at this every() time
    const hang = (th: number) => {
      if (rope.destroyed) return;
      const ex = P1[0] + Math.sin(th) * L1;
      const ey = P1[1] + Math.cos(th) * L1;
      rope.clear().poly(strip([P1[0], P1[1], ex, ey], 2.6)).fill(0xc9b48a);
      can.position.set(ex, ey);
      can.rotation = -th;
    };
    const frame2 = (t: number) => {
      if (lights.destroyed) return;
      flakes.clear();
      snow(flakes, WX0, WY0 - WR, WX1 - WX0, WY1 - WY0 + WR, t, 70, 7, { wind: 24, speed: 60, size: 5 });
      lights.clear();
      const p = party.v;
      const lit = (j: number) => (p > 0 ? 0.4 + 0.6 * ((Math.floor(t * 10) + j) % 3 === 0 ? 1 : 0.35) : 0.55 + 0.45 * Math.sin(t * 3 + j * 1.9));
      stringLights(lights, railPts, 13, BULBS, lit, { r: 9, glow: 0.9 + p });
      stringLights(lights, archPts, 12, BULBS, (j) => lit(j + 3), { r: 9, glow: 0.9 + p });
      stringLights(lights, doorPts, 7, BULBS, (j) => lit(j + 5), { r: 8, glow: 0.9 + p });
      for (const row of tl) stringLights(lights, row, 7, BULBS, (j) => lit(j + 1), { r: 6, wireW: 1, wire: 0x123a22, glow: 0.8 + p });
      if (go && rel < 0) rel = t;
      if (rel >= 0) {
        const u = t - rel;
        hang(A1 * Math.exp(-0.35 * u) * Math.cos(u * 3.9));
      }
    };
    hang(A1);
    frame2(0);
    if (!c.reduce) every(c, 30, frame2);
    if (c.short) {
      hang(-0.3);
      return;
    }

    const fiu = pre(c, comic('¡FIUUU!', GOLD, 96), 470, 600, -0.12);
    const trr = pre(c, comic('¡TRRRR!', 0x7fd2ff, 74), 1500, 880, 0.06);
    const toc = pre(c, comic('¡TOC, TOC!', 0xfff1c8, 92), 1320, 230, 0.08);
    const ready = pre(c, plate('4 TRAMPAS LISTAS', RED, C.ink, 44), 470, 190, -0.05);
    // the can lets go and swings down over the stairs
    at(c, 0.15, () => {
      sfx('whoosh', 0.8);
      if (c.reduce) return hang(0.35);
      go = true;
    });
    at(c, 0.5, () => {
      fiu(0.55);
      later(c, 0.36, () => sfx('whoosh', 0.7));
    });
    // toy cars roll across the floor, right to left, behind his feet
    at(c, 0.82, () => {
      trr(0.6);
      [RED, 0x3a7bd5, GOLD].forEach((col, i) => {
        const car = toyCar(col, 1.6);
        car.position.set(c.reduce ? 1250 + i * 170 : 2150 + i * 190, 790 + i * 34);
        cars.addChild(car);
        later(c, i * 0.06, () => sfx('tick', 1.6 - i * 0.15));
        if (c.reduce) return;
        gsap.to(car, { x: -260, duration: 1.15 + i * 0.12, ease: 'none', onComplete: () => destroyTree(car) });
        gsap.to(car, { y: car.y - 4, duration: 0.08, yoyo: true, repeat: 9 });
      });
    });
    // knock knock: the two shadows in the frosted glass
    at(c, 1.3, () => {
      toc(0.7);
      sfx('hit', 0.55);
      later(c, 0.16, () => sfx('hit', 0.6));
      for (const s of sils) {
        if (c.reduce) s.alpha = 1;
        else gsap.to(s, { alpha: 1, duration: 0.2 });
      }
      if (!c.reduce) gsap.fromTo(door, { x: DX0 + 4 }, { x: DX0, duration: 0.05, repeat: 5, yoyo: true });
      say(c, c.fg, balloon('¿Hay alguien en casa?', { size: 34, tx: -70, ty: 70 }), 1530, 330, 0.75, 0.04);
    });
    at(c, 1.72, () => {
      ready(0.5);
      sfx('sting', 1.1);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('meow', 1.7);
    later(c, 0.12, () => sfx('meow', 1.9));
    sfx('boom', 0.7);
    c.shaker.add(0.3);
    flashOf(c, 0xfff6d8, 0.4, 0.35);
    // the scream: shout lines out of his mouth
    const [mx, my] = onCat(c, 0.49, 0.4);
    for (let i = 0; i < 2; i++)
      later(c, i * 0.22, () => {
        const sh = shoutLines(0, 0, 14, 150, 290, 0xffffff, 0, Math.PI * 2, 9);
        sh.position.set(mx, my);
        c.fg.addChildAt(sh, 0);
        if (c.reduce) return void gsap.to(sh, { alpha: 0, delay: 0.4, duration: 0.2, onComplete: () => destroyTree(sh) });
        gsap.fromTo(sh.scale, { x: 0.6, y: 0.6 }, { x: 1.35, y: 1.35, duration: 0.45, ease: 'power2.out' });
        gsap.to(sh, { alpha: 0, duration: 0.45, ease: 'power1.in', onComplete: () => destroyTree(sh) });
      });
    cheer2(c, '¡AAAAH!…', '¡JA!', GOLD, 0x6fe08a, { size: 124, gap: 0.6 });
    aside(c, '…la casa se defiende sola.', 0xffffff, { delay: 0.95, dur: 2.4 });
    if (st) {
      st.party.v = 1;
      // the door swings open and the second can swings in: ¡BONK!
      const { door, sils, can2, rope2 } = st;
      for (const s of sils) if (!s.destroyed) s.alpha = 1;
      if (!door.destroyed) {
        if (c.reduce) door.scale.x = 0.16;
        else gsap.to(door.scale, { x: 0.16, duration: 0.18, ease: 'power2.out', delay: 0.05 });
      }
      const hang2 = (th: number) => {
        if (rope2.destroyed) return;
        const ex = P2[0] + Math.sin(th) * L2;
        const ey = P2[1] + Math.cos(th) * L2;
        rope2.clear().poly(strip([P2[0], P2[1], ex, ey], 2.6)).fill(0xc9b48a);
        can2.position.set(ex, ey);
        can2.rotation = -th;
      };
      can2.visible = true;
      const bonk = () => {
        sfx('hit', 0.7);
        sfx('bigboom', 1.4);
        c.shaker.add(0.25);
        const w = comic('¡BONK!', 0xffffff, 110);
        w.position.set(1330, 520);
        w.rotation = 0.1;
        c.fg.addChild(w);
        if (!c.reduce) gsap.fromTo(w.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.15, ease: 'back.out(3)' });
        gsap.to(w, { alpha: 0, delay: 0.7, duration: 0.25, onComplete: () => destroyTree(w) });
        sils.forEach((s, i) => {
          if (s.destroyed) return;
          // spinning stars over their heads, then they tip over out of the doorway
          const stars = new Graphics();
          for (let j = 0; j < 4; j++) stars.poly(star5(Math.cos((j / 4) * Math.PI * 2) * 34, Math.sin((j / 4) * Math.PI * 2) * 12, 11, 0.45)).fill(GOLD).stroke({ width: 2, color: C.ink });
          stars.position.set(s.x, s.y - (i ? 300 : 375));
          st.k.addChild(stars);
          if (!c.reduce) gsap.to(stars, { rotation: Math.PI * 2, duration: 0.9, ease: 'none' });
          gsap.to(stars, { alpha: 0, delay: 1.0, duration: 0.3, onComplete: () => destroyTree(stars) });
          if (c.reduce) return void gsap.to(s, { alpha: 0, delay: 0.6, duration: 0.3 });
          gsap.to(s, { rotation: i ? 0.5 : -0.45, delay: 0.35, duration: 0.4, ease: 'power2.in' });
          gsap.to(s, { alpha: 0, delay: 0.6, duration: 0.3 });
        });
      };
      if (c.reduce) {
        hang2(0);
        later(c, 0.2, bonk);
      } else {
        const p = { a: -1.1 };
        hang2(p.a);
        gsap.to(p, { a: 0, duration: 0.42, delay: 0.12, ease: 'power2.in', onUpdate: () => hang2(p.a), onComplete: bonk });
        gsap.to(p, { a: -0.35, duration: 0.5, delay: 0.54, ease: 'power2.out', onUpdate: () => hang2(p.a) });
        gsap.to(p, { a: -0.08, duration: 0.6, delay: 1.04, ease: 'sine.inOut', onUpdate: () => hang2(p.a) });
      }
    }
    // toy cars and ornaments fly
    burst(c, c.fg, (i) => toyCar([RED, 0x3a7bd5, GOLD, 0x4fd27a][i % 4], 1.2), 8, W / 2, 760, 720, 1.2);
    fall(
      c,
      c.fg,
      (i) => {
        const g = new Graphics().poly(ngon(0, 0, 16, 16, 12)).fill(BULBS[i % BULBS.length]).stroke({ width: 3, color: C.ink });
        g.rect(-6, -22, 12, 8).fill(0xd8c070);
        g.poly(twinkle(-5, -5, 6, 0.3)).fill(0xffffff);
        return g;
      },
      { n: 16, over: 1.4, dur: 1.5, spread: W },
    );
    fall(c, c.fg, () => new Graphics().poly(twinkle(0, 0, 9, 0.3)).fill(0xffffff), { n: 24, over: 2, dur: 2.2, spin: 2 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.2, h / 1080);
    const hz = h * 0.68;
    const cx = w / 2;
    const ww = 360 * u;
    const x0 = cx - ww / 2;
    const r0 = ww / 2;
    const y0 = h * 0.32;
    const y1 = h * 0.58;
    const out = new Graphics();
    street(out, x0, y0 - r0, ww, y1 - y0 + r0, u);
    const flakes = new Graphics();
    const wall = new Graphics().rect(0, 0, w, hz).fill(WALL).poly(windowPts(x0, x0 + ww, y0, y1)).cut();
    wall.rect(0, hz - 150 * u, w, 150 * u).fill(WOOD).rect(0, hz - 156 * u, w, 12 * u).fill(WOOD_D);
    const frame = new Graphics().poly(windowPts(x0, x0 + ww, y0, y1)).stroke({ width: 16 * u, color: 0xf6efe0, join: 'round' });
    frame.rect(cx - 5 * u, y0 - r0, 10 * u, y1 - y0 + r0).fill(0xf6efe0).rect(x0 - 26 * u, y1, ww + 52 * u, 18 * u).fill(0xf6efe0);
    const floor = new Graphics().rect(0, hz, w, h - hz).fill(FLOOR[0]);
    for (let i = -14; i <= 14; i += 2) floor.poly([cx + i * 70 * u, hz, cx + (i + 1) * 70 * u, hz, cx + (i + 1) * 170 * u, h, cx + i * 170 * u, h]).fill(FLOOR[1]);
    floor.poly(ngon(cx, h * 0.8, Math.min(w * 0.4, 400 * u), 60 * u, 24)).fill(0xa8202e);
    const side = Math.min(w * 0.44, m * 0.95);
    const st = new Graphics();
    stairs(st, cx - side * 0.62, hz, 9, 46 * u, 40 * u, u);
    const tr = new Graphics();
    tree(tr, cx + side * 0.7, hz + 4 * u, u);
    const lights = new Graphics();
    const top = catenary(0, 30 * u, w, 30 * u, 40 * u, 24);
    const rope = new Graphics();
    const can = new Container();
    can.addChild(paintCan(u));
    const px = cx - side * 0.35;
    const L = h * 0.42;
    const hang = (th: number) => {
      rope.clear().poly(strip([px, 0, px + Math.sin(th) * L, Math.cos(th) * L], 2.4 * u)).fill(0xc9b48a);
      can.position.set(px + Math.sin(th) * L, Math.cos(th) * L);
      can.rotation = -th;
    };
    const draw = (t: number) => {
      flakes.clear();
      snow(flakes, x0, y0 - r0, ww, y1 - y0 + r0, t, 36, 7, { wind: 20 * u, speed: 50 * u, size: 4 * u + 0.6 });
      lights.clear();
      stringLights(lights, top, Math.max(8, Math.round(w / (90 * u))), BULBS, (j) => 0.55 + 0.45 * Math.sin(t * 3 + j * 1.9), { r: 9 * u + 0.8 });
      hang(Math.sin(t * 1.6) * 0.22);
    };
    k.addChild(out, flakes, wall, frame, floor, st, tr, lights, rope, can);
    draw(0.4);
    if (live) liveLoop(k, (t) => draw(t + 0.4));
    return k;
  },
};
