/**
 * Miauty la Fea, la Secretaria Más Brillante: the office universe (a 90s telenovela at a fashion house: no names, no
 * logos, no songs). A 90s office in one-point perspective: fluorescent panels, a glossy catwalk running down the middle
 * of the corridor under spotlights to a lit PASARELA sign, fashion posters of cat models on the walls, and in front two
 * desks with chunky beige computers, phones with curly cords and piles of folders; beside her, a tiny desk with a tiny
 * lamp. The phones ring (¡RIIIN! ¡RIIIN!), the green screens flicker on, a whirl of papers flies off the big desk and
 * lands — one by one, in perfect order — on her tiny desk (¡TAC!); her huge glasses and her braces flash (¡TING!) —
 * BALANCE: CUADRA.
 * Payoff: the screens draw rising green charts, the catwalk lights blaze, papers and check marks fly; ¡CUENTAS CLARAS! /
 * …y la belleza también suma.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, cheer, every, fall, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { aside, ngon, onCat, rnd, streak } from './kitD';
import { strip } from './kitH';
import { at, comic, pre, wrap } from './kitI';
import { glint, sheet } from './kitL';

const BROWN = 0x8b5a2b;
const TAN = 0xc9a66b;
const WALL = 0xdcd6c4;
const WALL_D = 0xbab29c;
const CARPET = 0x5a6a7a;
const BEIGE = 0xd8d0b8;
const BEIGE_D = 0xa8a088;
const SCREEN = 0x0a2a1a;
const GREEN = 0x5aff8a;
const VP: [number, number] = [960, 430];
/** the far wall (the end of the corridor) */
const BW0 = 770;
const BW1 = 1150;
const BT = 330;
const BB = 560;
/** the big desks (left, right) and her tiny desk */
const DL: [number, number] = [0, 560];
const DR: [number, number] = [1440, 1920];
const DTOP = 650;
const TINY: [number, number, number] = [1190, 1350, 690];

/** a point on the line from the vanishing point through (x, y), at depth u (0 = VP, 1 = (x, y)) */
const toward = (x: number, y: number, u: number, vp = VP): [number, number] => [vp[0] + (x - vp[0]) * u, vp[1] + (y - vp[1]) * u];

/** the corridor: ceiling panels, side walls with posters, the far wall with the PASARELA sign, carpet, the catwalk */
function corridor(g: Graphics, w: number, h: number, k: number, vp: [number, number], bw0: number, bw1: number, bt: number, bb: number, x0 = -200) {
  const L = x0;
  const R = w - x0;
  // ceiling
  g.poly([L, x0, R, x0, bw1, bt, bw0, bt]).fill(0xeeeae0);
  for (const u of [0.25, 0.45, 0.7, 1.0]) {
    for (const s of [-1, 1]) {
      const [ax, ay] = toward(vp[0] + s * 140 * k, -40 * k, u, vp);
      const [bx, by] = toward(vp[0] + s * 520 * k, -40 * k, u, vp);
      const [cx, cy] = toward(vp[0] + s * 520 * k, -40 * k, u * 0.82, vp);
      const [dx, dy] = toward(vp[0] + s * 140 * k, -40 * k, u * 0.82, vp);
      g.poly([ax, ay, bx, by, cx, cy, dx, dy]).fill(0xfbfcff).stroke({ width: 2 * k, color: 0xc8c8d0 });
    }
  }
  // side walls
  g.poly([L, x0 + 60 * k, bw0, bt, bw0, bb, L, h - x0]).fill(WALL);
  g.poly([R, x0 + 60 * k, bw1, bt, bw1, bb, R, h - x0]).fill(WALL_D);
  // posters on the walls: cat models in a pose (plain shapes), in perspective
  const cols = [0xd84a7a, 0x3a7bd5, 0xe6a83a, 0x2e9a7a];
  [0.35, 0.6].forEach((u, i) => {
    for (const s of [-1, 1]) {
      const ex = s < 0 ? L : R;
      const P = (yy: number, uu: number) => toward(ex, yy, uu, vp);
      const [ax, ay] = P(200 * k, u + 0.12);
      const [bx, by] = P(200 * k, u);
      const [cx, cy] = P(620 * k, u);
      const [dx, dy] = P(620 * k, u + 0.12);
      g.poly([ax, ay, bx, by, cx, cy, dx, dy]).fill(cols[(i * 2 + (s > 0 ? 1 : 0)) % 4]).stroke({ width: 4 * k * u, color: 0x2a2a2a });
      // the model: a slim cat silhouette with a hat, mid-pose
      const mx = (ax + bx + cx + dx) / 4;
      const my = (ay + by + cy + dy) / 4;
      const sc = Math.abs(bx - ax) / 120;
      g.poly([mx - 10 * sc, my + 60 * sc, mx - 4 * sc, my - 10 * sc, mx + 8 * sc, my - 10 * sc, mx + 16 * sc, my + 60 * sc]).fill(0x1a1a22);
      g.poly(ngon(mx + 2 * sc, my - 24 * sc, 12 * sc, 12 * sc, 10)).fill(0x1a1a22);
      g.poly([mx - 9 * sc, my - 30 * sc, mx - 6 * sc, my - 46 * sc, mx, my - 34 * sc]).fill(0x1a1a22).poly([mx + 13 * sc, my - 30 * sc, mx + 10 * sc, my - 46 * sc, mx + 4 * sc, my - 34 * sc]).fill(0x1a1a22);
      g.poly(ngon(mx + 2 * sc, my - 36 * sc, 26 * sc, 5 * sc, 12)).fill(0x1a1a22);
    }
  });
  // the far wall: a door, the lit sign
  g.rect(bw0, bt, bw1 - bw0, bb - bt).fill(0xe8e2d0).stroke({ width: 3 * k, color: WALL_D });
  g.rect(vp[0] - 50 * k, bb - 150 * k, 100 * k, 150 * k).fill(0x8a6a4a);
  g.rect(vp[0] - 120 * k, bt + 20 * k, 240 * k, 50 * k).fill(0x1a1a22);
  // carpet
  g.poly([L, h - x0, bw0, bb, bw1, bb, R, h - x0]).fill(CARPET);
  // the catwalk (glossy) with its spotlights along the edges
  const [r0x] = toward(vp[0] - 60 * k, bb, 1, vp);
  g.poly([vp[0] - 60 * k, bb, vp[0] + 60 * k, bb, vp[0] + 400 * k, h - x0, vp[0] - 400 * k, h - x0]).fill(0xf6e6ee);
  g.poly([vp[0] - 4 * k, bb, vp[0] + 4 * k, bb, vp[0] + 26 * k, h - x0, vp[0] - 26 * k, h - x0]).fill({ color: 0xd84a7a, alpha: 0.5 });
  void r0x;
}

/** the catwalk's spotlights (redrawn: `v` 0..1 how lit) along its two edges */
function spots(g: Graphics, h: number, k: number, vp: [number, number], bb: number, v: number, x0 = -200) {
  g.clear();
  for (let i = 0; i < 7; i++) {
    const u = (i + 1) / 7;
    const y = bb + (h - x0 - bb) * u * u;
    const half = 60 * k + (340 * k * (y - bb)) / (h - x0 - bb);
    const r = (4 + 10 * u) * k;
    for (const s of [-1, 1]) {
      const x = vp[0] + s * (half + 8 * k);
      if (v > 0.05) g.poly(ngon(x, y, r * 4, r * 2.4, 12)).fill({ color: 0xfff2c0, alpha: 0.25 * v });
      g.poly(ngon(x, y, r, r * 0.6, 10)).fill(v > 0.05 ? 0xfff6d0 : 0x8a8a94);
    }
  }
}

/** a chunky beige computer on a desk (origin at the desk at its bottom center) */
function crt(g: Graphics, x: number, y: number, s: number) {
  g.poly([x - 70 * s, y, x + 70 * s, y, x + 54 * s, y - 24 * s, x - 54 * s, y - 24 * s]).fill(BEIGE_D);
  g.rect(x - 120 * s, y - 210 * s, 240 * s, 186 * s).fill(BEIGE).stroke({ width: 4 * s, color: 0x5a5444 });
  g.rect(x - 96 * s, y - 192 * s, 192 * s, 136 * s).fill(SCREEN).stroke({ width: 5 * s, color: BEIGE_D });
  g.rect(x + 70 * s, y - 46 * s, 30 * s, 10 * s).fill(0x5a5444);
  g.poly(ngon(x - 90 * s, y - 40 * s, 5 * s, 5 * s, 6)).fill(0x5aff8a);
  g.poly([x - 130 * s, y + 46 * s, x + 130 * s, y + 46 * s, x + 110 * s, y + 14 * s, x - 110 * s, y + 14 * s]).fill(BEIGE).stroke({ width: 3 * s, color: 0x5a5444 });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 11; j++) g.rect(x - 104 * s + j * 19 * s, y + 18 * s + i * 9 * s, 14 * s, 6 * s).fill(BEIGE_D);
}

/** the screen's content: `mode` 0 dark, 1 green text lines (flicker with t), 2 a rising bar chart (`u` 0..1) */
function screenOf(g: Graphics, x: number, y: number, s: number, mode: number, t: number, u = 1, seed = 1) {
  const sx = x - 90 * s;
  const sy = y - 186 * s;
  if (mode === 0) return;
  if (mode === 1) {
    const r = rnd(seed);
    for (let i = 0; i < 7; i++) if ((Math.floor(t * 8) + i) % 9 !== 0) g.rect(sx + 6 * s, sy + 8 * s + i * 16 * s, (40 + r() * 120) * s, 6 * s).fill({ color: GREEN, alpha: 0.85 });
    if (Math.floor(t * 3) % 2) g.rect(sx + 6 * s, sy + 8 * s + 7 * 16 * s, 10 * s, 6 * s).fill(GREEN);
    return;
  }
  const r = rnd(seed);
  for (let i = 0; i < 6; i++) {
    const bh = (20 + i * 16 + r() * 10) * s * u;
    g.rect(sx + 10 * s + i * 28 * s, sy + 120 * s - bh, 20 * s, bh).fill(GREEN);
  }
  g.poly(strip([sx + 8 * s, sy + 110 * s, sx + 60 * s, sy + 90 * s, sx + 110 * s, sy + 70 * s, sx + 170 * s, sy + 26 * s - 20 * s * u], 2.5 * s)).fill(0xffffff);
}

/** a desk phone with a curly cord (origin at its bottom center); returns the handset to make it ring */
function phone(s: number, col = 0xc8102e) {
  const k = new Container();
  const g = new Graphics();
  g.poly([-56 * s, 0, 56 * s, 0, 44 * s, -40 * s, -44 * s, -40 * s]).fill(col).stroke({ width: 3 * s, color: C.ink });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.rect(-22 * s + j * 16 * s, -32 * s + i * 9 * s, 10 * s, 6 * s).fill(0xf2efe6);
  const cord: number[] = [];
  for (let i = 0; i <= 16; i++) cord.push(-60 * s - i * 6 * s, -10 * s + (i % 2 ? 10 * s : 0) + i * 2 * s);
  g.poly(strip(cord, 1.8 * s)).fill(0x2a2a2a);
  const hs = new Graphics();
  hs.poly([-64 * s, -6 * s, -48 * s, -22 * s, 48 * s, -22 * s, 64 * s, -6 * s, 52 * s, 6 * s, 36 * s, -6 * s, -36 * s, -6 * s, -52 * s, 6 * s]).fill(col).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  hs.position.set(0, -40 * s);
  k.addChild(g, hs);
  return { k, hs };
}

/** a big desk: top and front panel (x0..x1, top y), a stack of folders */
function desk(g: Graphics, x0: number, x1: number, y: number, k = 1) {
  g.rect(x0, y, x1 - x0, 26 * k).fill(0x8a6a4a).stroke({ width: 3 * k, color: 0x4a3420 });
  g.rect(x0 + 10 * k, y + 26 * k, x1 - x0 - 20 * k, 300 * k).fill(0x6a4e34);
  g.rect(x0 + 30 * k, y + 50 * k, (x1 - x0) * 0.4, 70 * k).stroke({ width: 3 * k, color: 0x4a3420 });
}

interface St {
  mode: { v: number; u: number };
  light: { v: number };
}
const S = stash<St>();

export const miauty: Signature = {
  dark: false,
  frame: BROWN,
  tag: 'UNIVERSO DE LA OFICINA',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    corridor(g, W, H + 200, 1, VP, BW0, BW1, BT, BB);
    const sign = txt('PASARELA', { fontFamily: F.poster, fontSize: 36, fill: 0xff8ab8, stroke: { color: 0xd84a7a, width: 3 }, letterSpacing: 4 });
    sign.anchor.set(0.5);
    sign.position.set(VP[0], BT + 45);
    const sp = new Graphics();
    const furn = new Graphics();
    desk(furn, DL[0] - 200, DL[1], DTOP);
    desk(furn, DR[0], DR[1] + 200, DTOP);
    crt(furn, 300, DTOP, 1);
    crt(furn, 1700, DTOP, 1);
    // folder piles, a plant, the water cooler
    for (let i = 0; i < 5; i++) furn.rect(40 + (i % 2) * 6, DTOP - 26 - i * 22, 150, 20).fill([0xe6c34a, 0x3a7bd5, 0xc8102e, 0x2e9a7a, 0xe6c34a][i]).stroke({ width: 2, color: 0x4a3420 });
    furn.rect(1850, DTOP - 80, 70, 80).fill(0xb8643a);
    for (let i = 0; i < 7; i++) furn.poly(streak(1885, DTOP - 80, 1885 + (i - 3) * 30, DTOP - 230 + Math.abs(i - 3) * 30, 12, 3)).fill(0x2e7d4a);
    // her tiny desk with its tiny lamp
    const tiny = new Graphics();
    tiny.rect(TINY[0], TINY[2], TINY[1] - TINY[0], 16).fill(0x8a6a4a).stroke({ width: 3, color: 0x4a3420 });
    tiny.rect(TINY[0] + 8, TINY[2] + 16, 10, 100).fill(0x4a3420).rect(TINY[1] - 18, TINY[2] + 16, 10, 100).fill(0x4a3420);
    tiny.poly(streak(TINY[1] - 30, TINY[2], TINY[1] - 46, TINY[2] - 60, 3, 3)).fill(0x2a2a2a);
    tiny.poly([TINY[1] - 70, TINY[2] - 56, TINY[1] - 26, TINY[2] - 56, TINY[1] - 36, TINY[2] - 84, TINY[1] - 60, TINY[2] - 84]).fill(0x2e9a7a).stroke({ width: 2, color: C.ink });
    const scr = new Graphics();
    const phL = phone(1, 0xc8102e);
    phL.k.position.set(470, DTOP);
    const phR = phone(1, 0x3a3a44);
    phR.k.position.set(1510, DTOP);
    const papers = new Container();
    k.addChild(g, sign, sp, furn, tiny, scr, phL.k, phR.k, papers);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(0xfff6e0, 380, 0.5);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    const mode = { v: c.short ? 1 : 0, u: 0 };
    const light = { v: c.short ? 0.6 : 0.3 };
    S.set(c, { mode, light });
    const frame = (t: number) => {
      if (scr.destroyed) return;
      scr.clear();
      screenOf(scr, 300, DTOP, 1, mode.v, t, mode.u, 3);
      screenOf(scr, 1700, DTOP, 1, mode.v, t + 0.4, mode.u, 7);
      spots(sp, H + 200, 1, VP, BB, light.v);
    };
    frame(0);
    if (!c.reduce) every(c, 20, frame);
    if (c.short) return;
    const riinL = pre(c, comic('¡RIIIN!', 0xffe14d, 84), 470, 470, -0.12);
    const riinR = pre(c, comic('¡RIIIN!', 0xffe14d, 84), 1520, 470, 0.12);
    const tac = pre(c, comic('¡TAC!', 0xffffff, 90), 1300, 560, 0.08);
    const ting = pre(c, comic('¡TING!', 0xbfe6ff, 80), 1250, 260, 0.1);
    const bal = pre(c, plate('BALANCE: CUADRA', BROWN, C.ink, 46), 520, 200, -0.05);
    const ring = (hs: Graphics, w: () => void, d: number) =>
      at(c, d, () => {
        w();
        sfx('alarm', 1.8);
        for (let i = 0; i < 6; i++) later(c, i * 0.05, () => sfx('tick', 2));
        if (!c.reduce) gsap.fromTo(hs, { y: hs.y - 14 }, { y: hs.y, duration: 0.05, repeat: 7, yoyo: true });
      });
    ring(phL.hs, () => riinL(0.45), 0.08);
    ring(phR.hs, () => riinR(0.45), 0.36);
    at(c, 0.55, () => {
      mode.v = 1;
      frame(0.55);
      sfx('glitch', 1.4);
      light.v = 0.55;
    });
    // a whirl of papers off the big desk, landing in perfect order on her tiny desk
    at(c, 0.75, () => {
      sfx('paper', 0.9);
      const n = c.reduce ? 4 : 10;
      for (let i = 0; i < n; i++) {
        const p = sheet(64, 46, { lines: 4 });
        const x0 = 120 + Math.random() * 300;
        const y0 = DTOP - 40;
        const x1 = (TINY[0] + TINY[1]) / 2 - 20;
        const y1 = TINY[2] - 26 - i * 5;
        const mx = 400 + Math.random() * 1100;
        const my = 80 + Math.random() * 180;
        p.position.set(x0, y0);
        papers.addChild(p);
        if (c.reduce) {
          p.position.set(x1, y1);
          continue;
        }
        const q = { u: 0 };
        const spin = (Math.random() - 0.5) * 12;
        gsap.to(q, {
          u: 1,
          duration: 0.8,
          delay: i * 0.05,
          ease: 'power1.inOut',
          onUpdate: () => {
            if (p.destroyed) return;
            const u = q.u;
            p.position.set((1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * my + u * u * y1);
            p.rotation = spin * (1 - u);
            p.scale.y = 0.4 + 0.6 * Math.abs(Math.cos(u * 9));
          },
          onComplete: () => {
            if (p.destroyed) return;
            p.scale.y = 0.4;
            if (i % 3 === 0) sfx('paper', 1.4);
          },
        });
      }
    });
    at(c, 1.4, () => {
      tac(0.5);
      sfx('hit', 1.3);
    });
    // the glasses and the braces flash
    at(c, 1.6, () => {
      ting(0.5);
      glint(c, c.fg, ...onCat(c, 0.47, 0.29), 42);
      later(c, 0.08, () => glint(c, c.fg, ...onCat(c, 0.63, 0.27), 42));
      later(c, 0.18, () => glint(c, c.fg, ...onCat(c, 0.55, 0.4), 30));
      sfx('gem', 1.6);
      later(c, 0.1, () => sfx('gem', 2));
    });
    at(c, 1.85, () => {
      bal(0.35);
      sfx('sting', 1.1);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1);
    sfx('coin', 1.2);
    c.shaker.add(0.2);
    flashOf(c, 0xfff6e0, 0.4, 0.35);
    if (st) {
      st.mode.v = 2;
      st.light.v = 1;
      if (c.reduce) st.mode.u = 1;
      else gsap.to(st.mode, { u: 1, duration: 0.9, ease: 'power2.out' });
    }
    // papers and check marks fly
    fall(
      c,
      c.fg,
      (i) => {
        if (i % 3) return sheet(54, 40, { lines: 3 });
        const g = new Graphics().poly([-20, 0, -8, 14, 22, -18, 26, -12, -8, 24, -26, 6]).fill(0x2e9a5a).stroke({ width: 3, color: C.ink, join: 'round' });
        return g;
      },
      { n: 20, over: 1.6, dur: 1.8, spread: W, spin: 3 },
    );
    later(c, 0.3, () => glint(c, c.fg, ...onCat(c, 0.47, 0.29), 54));
    later(c, 0.4, () => glint(c, c.fg, ...onCat(c, 0.63, 0.27), 54));
    later(c, 0.55, () => glint(c, c.fg, ...onCat(c, 0.55, 0.4), 36));
    cheer(c, '¡CUENTAS CLARAS!', TAN, 140, 2.3);
    aside(c, '…y la belleza también suma.', 0xffffff, { delay: 0.6, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.max(0.2, h / 1080);
    const cx = w / 2;
    const vp: [number, number] = [cx, h * 0.4];
    const bw = 380 * u;
    const g = new Graphics();
    corridor(g, w, h, u, vp, cx - bw / 2, cx + bw / 2, h * 0.3, h * 0.52, 0);
    const sp = new Graphics();
    spots(sp, h, u, vp, h * 0.52, 0.8, 0);
    const furn = new Graphics();
    const m = Math.min(w, h);
    const side = Math.min(w * 0.4, m * 0.85);
    const dt = h * 0.62;
    desk(furn, 0, cx - side * 0.62, dt, u);
    desk(furn, cx + side * 0.62, w, dt, u);
    const lx = cx - side * 0.9;
    const rx = cx + side * 0.9;
    crt(furn, lx, dt, u);
    crt(furn, rx, dt, u);
    const scr = new Graphics();
    const draw = (t: number) => {
      scr.clear();
      screenOf(scr, lx, dt, u, 1, t, 1, 3);
      screenOf(scr, rx, dt, u, 2, t, 0.7 + 0.3 * Math.sin(t * 1.5), 7);
    };
    k.addChild(g, sp, furn, scr);
    draw(0.5);
    if (live) liveLoop(k, (t) => draw(t + 0.5));
    return k;
  },
};
