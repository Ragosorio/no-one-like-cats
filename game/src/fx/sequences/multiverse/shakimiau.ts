/**
 * Shakimiau, la que Hace Temblar el Escenario: the seismic universe (a Caribbean pop star as a cat: no song titles, no
 * lyrics, nothing sexual — a dancer in a long skirt with a coin belt). A stage on the sand of a Caribbean beach at
 * sunset: the sun sinking into the sea, palms, a lighting truss over a wooden stage, a crowd of cats in front with their
 * paws up. She dances and every step (¡PUM!) sends a shock ring across the stage: everything shakes, the palms sway,
 * her coins jingle (¡CHIN-CHIN!), and behind her a giant wave rises from the sea on the beat… and freezes at its crest,
 * glittering — MAGNITUD: ¡9.9!
 * Payoff: the frozen wave bursts into a shower of gold glitter and coins instead of crashing, fireworks in gold, red and
 * blue, the crowd jumps; ¡QUE TIEMBLE! / …hasta el mar se puso a bailar.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, burst, cheer, every, fall, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { pulse } from './kitG';
import { at, comic, crowdBack, pre, wrap } from './kitI';
import { coin, palm } from './kitL';

const GOLD = 0xe6c34a;
const RED = 0xd9482b;
const BLUE = 0x3a7bd5;
const SKY = [0x2a4a98, 0x6a5aa8, 0xd8708a, 0xf2905a, 0xffd27a];
const SEA = 0x1a5a8a;
const WAVE = 0x1a8aa8;
const WAVE_L = 0x5ac8d8;
const FOAM = 0xf2fbff;
const SAND = 0xe8c48a;
const WOOD = 0x8a5a32;
const HZ = 520;
const SUN: [number, number] = [1260, 500];
/** the stage: top surface y, front edge y, x range */
const ST: [number, number, number, number] = [380, 1540, 712, 770];

/** the giant wave rising from the left (h 0..1 how tall), into g: body, lit face, foam on the lip, spray */
function wave(g: Graphics, h: number, t: number, k = 1, cx = 960, base = 590, x0 = -200) {
  g.clear();
  if (h <= 0.01) return;
  const X = (x: number) => cx + (x - 960) * k;
  const Y = (dy: number) => base - dy * h * k;
  const wob = Math.sin(t * 2) * 6 * k * (1 - h);
  const L = Math.min(X(-200), x0);
  const body = [L, base + 14 * k, L, Y(150), X(100), Y(300) + wob, X(350), Y(430), X(520), Y(470), X(680), Y(455), X(790), Y(400), X(760), Y(350), X(700), Y(330), X(690), Y(280), X(760), Y(180), X(880), Y(80), X(1000), base + 14 * k];
  g.poly(body).fill(WAVE);
  g.poly([X(560), Y(440), X(680), Y(445), X(760), Y(390), X(700), Y(330), X(690), Y(280), X(760), Y(180), X(880), Y(80), X(960), base, X(700), base, X(600), Y(200)]).fill({ color: WAVE_L, alpha: 0.55 });
  g.poly([L, Y(150), X(100), Y(300), X(350), Y(430), X(330), Y(340), X(80), Y(220), L, Y(100)]).fill({ color: 0x0e6a8a, alpha: 0.6 });
  // foam along the crest and the lip
  const r = rnd(5);
  const crest: [number, number][] = [
    [200, 360],
    [350, 430],
    [450, 460],
    [520, 470],
    [600, 466],
    [680, 455],
    [740, 430],
    [790, 400],
    [770, 360],
  ];
  for (const [cx0, cy0] of crest) for (let i = 0; i < 2; i++) g.poly(ngon(X(cx0 + (r() - 0.5) * 30), Y(cy0) + (r() - 0.3) * 14 * k, (20 + r() * 18) * k, (12 + r() * 10) * k, 9)).fill(FOAM);
  for (let i = 0; i < 18; i++) g.poly(ngon(X(560 + r() * 300), Y(470 + r() * 60) - r() * 30 * k, (3 + r() * 5) * k, (3 + r() * 5) * k, 6)).fill({ color: FOAM, alpha: 0.85 });
}

/** the beach: sky, the sun on the sea, the sand (w×h, horizon hz, scale k, the sun at sx) */
function beach(g: Graphics, w: number, h: number, k: number, sx: number, hz: number, x0 = -200) {
  vgrad(g, x0, x0, w - 2 * x0, hz - x0, SKY, 18);
  for (let i = 6; i >= 1; i--) g.poly(ngon(sx, hz - 20 * k, (120 + i * 46) * k, (120 + i * 46) * k, 28)).fill({ color: 0xffe08a, alpha: 0.07 });
  g.poly(ngon(sx, hz - 20 * k, 120 * k, 120 * k, 30)).fill(0xffe48a);
  g.rect(x0, hz, w - 2 * x0, 80 * k).fill(SEA);
  for (let i = 0; i < 8; i++) {
    const v = i / 8;
    g.poly(streak(sx - (40 + v * 140) * k, hz + 6 * k + v * 70 * k, sx + (40 + v * 140) * k, hz + 6 * k + v * 70 * k, (1 + v * 2) * k, (1 + v * 2) * k)).fill({ color: 0xffd27a, alpha: 0.7 - v * 0.4 });
  }
  g.rect(x0, hz + 80 * k, w - 2 * x0, h - hz - x0).fill(SAND);
  g.rect(x0, hz + 80 * k, w - 2 * x0, 18 * k).fill(0xd8a86a);
  g.poly(streak(x0, hz + 82 * k, w - x0, hz + 82 * k, 3 * k, 3 * k)).fill({ color: 0xffffff, alpha: 0.7 });
}

/** the stage on the sand: deck, front with bulbs, the truss towers and the top truss with its lamps */
function stage(g: Graphics, x0: number, x1: number, top: number, front: number, k = 1, trussTop = 170) {
  // truss towers and the top bar (a lattice: two rails and a zigzag)
  const truss = (ax: number, ay: number, bx: number, by: number, wdt: number) => {
    const d = Math.hypot(bx - ax, by - ay);
    const nx = (-(by - ay) / d) * wdt;
    const ny = ((bx - ax) / d) * wdt;
    g.poly(streak(ax + nx, ay + ny, bx + nx, by + ny, 3 * k, 3 * k)).fill(0x3a3a44);
    g.poly(streak(ax - nx, ay - ny, bx - nx, by - ny, 3 * k, 3 * k)).fill(0x3a3a44);
    const n = Math.max(2, Math.round(d / (wdt * 2)));
    for (let i = 0; i < n; i++) {
      const u0 = i / n;
      const u1 = (i + 1) / n;
      const s = i % 2 ? 1 : -1;
      g.poly(streak(ax + (bx - ax) * u0 + nx * s, ay + (by - ay) * u0 + ny * s, ax + (bx - ax) * u1 - nx * s, ay + (by - ay) * u1 - ny * s, 1.6 * k, 1.6 * k)).fill(0x4a4a54);
    }
  };
  truss(x0 + 40 * k, front, x0 + 40 * k, trussTop, 16 * k);
  truss(x1 - 40 * k, front, x1 - 40 * k, trussTop, 16 * k);
  truss(x0 + 20 * k, trussTop, x1 - 20 * k, trussTop, 14 * k);
  for (let i = 0; i < 8; i++) {
    const lx = x0 + 120 * k + (i * (x1 - x0 - 240 * k)) / 7;
    g.rect(lx - 14 * k, trussTop + 14 * k, 28 * k, 36 * k).fill(0x1a1a22);
  }
  // the deck
  g.poly([x0, top, x1, top, x1 + 30 * k, front, x0 - 30 * k, front]).fill(WOOD);
  for (let i = 1; i < 4; i++) g.poly(streak(x0 - 8 * k * i, top + ((front - top) * i) / 4, x1 + 8 * k * i, top + ((front - top) * i) / 4, 1.5 * k, 1.5 * k)).fill(0x6a4224);
  g.rect(x0 - 30 * k, front, x1 - x0 + 60 * k, 70 * k).fill(0x3a2414);
}

/** the truss lamps' beams and the stage-front bulbs (redrawn: `v` how lit, `hue` a color step on the beats) */
function lights(g: Graphics, x0: number, x1: number, top: number, front: number, v: number, step: number, k = 1, trussTop = 170) {
  g.clear();
  const cols = [GOLD, RED, BLUE, 0xffffff];
  for (let i = 0; i < 8; i++) {
    const lx = x0 + 120 * k + (i * (x1 - x0 - 240 * k)) / 7;
    const col = cols[(i + step) % cols.length];
    g.poly([lx - 10 * k, trussTop + 50 * k, lx + 10 * k, trussTop + 50 * k, lx + (i < 4 ? 160 : -160) * k + 90 * k, top, lx + (i < 4 ? 160 : -160) * k - 90 * k, top]).fill({ color: col, alpha: 0.12 * v });
    g.poly(ngon(lx, trussTop + 50 * k, 10 * k, 6 * k, 8)).fill({ color: col, alpha: 0.4 + 0.6 * v });
  }
  for (let i = 0; i < 16; i++) {
    const bx = x0 - 20 * k + (i * (x1 - x0 + 40 * k)) / 15;
    const on = (i + step) % 2 === 0;
    g.poly(ngon(bx, front + 30 * k, 8 * k, 8 * k, 8)).fill(on ? cols[(i + step) % 3] : 0x5a4a3a);
  }
}

interface St {
  h: { v: number };
  step: { v: number; lit: number };
  rows: Graphics[];
  wv: Graphics;
}
const S = stash<St>();

export const shakimiau: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO SÍSMICO',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    beach(g, W, H + 200, 1, SUN[0], HZ);
    const wv = new Graphics();
    const pal = new Graphics();
    const stg = new Graphics();
    stage(stg, ST[0], ST[1], ST[2], ST[3]);
    const lt = new Graphics();
    const crowd = crowdBack(W + 400, 900, { rows: 2, dy: 60, s: 34, cols: [0x2a1a2a, 0x3a2430, 0x1a1a2a], seed: 6, paws: 0.4, x0: -200 });
    k.addChild(g, wv, pal, stg, lt, ...crowd.rows);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(0xfff0c8, 380, 0.42);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    const h = { v: c.short ? 0.85 : 0 };
    const step = { v: 0, lit: c.short ? 0.8 : 0.45 };
    S.set(c, { h, step, rows: crowd.rows, wv });
    let sway = 0;
    const frame = (t: number) => {
      if (wv.destroyed) return;
      wave(wv, h.v, t);
      pal.clear();
      palm(pal, 120, 760, 1.25, 0.5, 0x2a1a24, Math.sin(t * 2.2) * 0.06 + sway * Math.sin(t * 30) * 0.08);
      palm(pal, 1800, 770, 1.35, -0.55, 0x2a1a24, Math.sin(t * 2 + 1) * 0.06 + sway * Math.sin(t * 30 + 1) * 0.08);
      palm(pal, 1700, 700, 0.9, -0.3, 0x3a2430, Math.sin(t * 1.8) * 0.05);
      lights(lt, ST[0], ST[1], ST[2], ST[3], step.lit, step.v);
      sway *= 0.9;
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;
    const [fx, fy] = onCat(c, 0.5, 0.95);
    const [hx, hy] = onCat(c, 0.52, 0.52);
    const pums = [0, 1, 2].map((i) => pre(c, comic('¡PUM!', GOLD, 84 + i * 10), i % 2 ? 1360 : 560, 640 - i * 40, (i % 2 ? 1 : -1) * 0.1));
    const chin = pre(c, comic('¡CHIN-CHIN!', 0xffe48a, 76), 1420, 420, 0.08);
    const mag = pre(c, plate('MAGNITUD: ¡9.9!', RED, C.ink, 46), 520, 200, -0.05);
    // four steps on the beat: a shock ring, a shake, the wave rises a step
    [0.12, 0.52, 0.92, 1.32].forEach((d, i) =>
      at(c, d, () => {
        sfx('boom', 0.6 + i * 0.05);
        sfx('hit', 0.5);
        c.shaker.add(0.18 + i * 0.03);
        sway = 1;
        step.v = i + 1;
        step.lit = 0.6 + i * 0.1;
        frame(d);
        pulse(c, c.behind, fx, fy, 0xfff2c0, 80, 7, 10, 0.6, 0.22);
        if (i < 3) pums[i](0.35);
        const to = Math.min(1, (i + 1) * 0.26);
        if (c.reduce) h.v = to;
        else gsap.to(h, { v: to, duration: 0.3, ease: 'back.out(2)' });
        if (!c.reduce) crowd.rows.forEach((row, j) => gsap.fromTo(row, { y: 0 }, { y: -14, duration: 0.1, delay: j * 0.04, yoyo: true, repeat: 1 }));
      }),
    );
    // her coins jingle
    at(c, 0.7, () => {
      chin(0.55);
      for (let i = 0; i < 4; i++) later(c, i * 0.06, () => sfx('coin', 1.4 + i * 0.1));
      burst(c, c.fg, (i) => coin(12 + (i % 3) * 3, 0.5 + (i % 3) * 0.2), 8, hx, hy, 260, 0.6);
    });
    // the wave freezes at its crest, glittering
    at(c, 1.7, () => {
      h.v = 1;
      frame(1.7);
      mag(0.45);
      sfx('freeze', 1.2);
      sfx('sting', 1.1);
      const tw = new Graphics();
      const r = rnd(2);
      for (let i = 0; i < 24; i++) tw.poly(twinkle(-200 + r() * 1100, 140 + r() * 380, 8 + r() * 14, 0.22)).fill(0xffffff);
      k.addChild(tw);
      gsap.to(tw, { alpha: 0, delay: 0.5, duration: 0.3, onComplete: () => destroyTree(tw) });
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('bigboom', 0.6);
    sfx('fanfare', 1);
    c.shaker.add(0.45);
    flashOf(c, 0xfff2c8, 0.45, 0.4);
    if (st) {
      st.step.lit = 1;
      // the frozen wave bursts into glitter and coins instead of crashing
      if (!st.wv.destroyed) {
        st.h.v = Math.max(st.h.v, 0.85);
        gsap.to(st.wv, { alpha: 0, duration: 0.5, delay: 0.1 });
      }
      for (let i = 0; i < 4; i++) later(c, i * 0.16, () => (st.step.v += 1));
      if (!c.reduce) st.rows.forEach((row, j) => gsap.fromTo(row, { y: 0 }, { y: -30, duration: 0.15, delay: j * 0.05, yoyo: true, repeat: 5 }));
    }
    burst(c, c.fg, (i) => (i % 3 ? new Graphics().poly(twinkle(0, 0, 14 + (i % 4) * 4, 0.24)).fill(i % 2 ? 0xffffff : 0xffe48a) : coin(16, 0.6)), 22, 520, 260, 760, 1.4);
    // fireworks in gold, red and blue
    const cols = [GOLD, RED, BLUE];
    for (let f = 0; f < (c.reduce ? 1 : 3); f++)
      later(c, 0.25 + f * 0.3, () => {
        const x = [1400, 600, 1620][f];
        const y = [200, 160, 330][f];
        sfx('boom', 1.3 + f * 0.1);
        burst(c, c.fg, () => new Graphics().poly(streak(0, 0, 26, 0, 4, 1)).fill(cols[f]), 14, x, y, 260, 0.8);
      });
    fall(c, c.fg, (i) => coin(14 + (i % 3) * 3, 0.3 + (i % 4) * 0.2), { n: 16, over: 1.6, dur: 1.6, spread: W, spin: 6 });
    cheer(c, '¡QUE TIEMBLE!', GOLD, 140, 2.3);
    aside(c, '…hasta el mar se puso a bailar.', 0xffffff, { delay: 0.6, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.2, h / 1080);
    const cx = w / 2;
    const side = Math.min(w * 0.42, m * 0.86);
    const hz = h * 0.48;
    const g = new Graphics();
    beach(g, w, h, u, cx + side * 0.6, hz, 0);
    const wv = new Graphics();
    const pal = new Graphics();
    const stg = new Graphics();
    const sx0 = cx - Math.min(side * 0.95, 580 * u);
    const sx1 = cx + Math.min(side * 0.95, 580 * u);
    const top = h * 0.66;
    const front = h * 0.71;
    stage(stg, sx0, sx1, top, front, u, h * 0.16);
    const lt = new Graphics();
    const draw = (t: number) => {
      wave(wv, 0.8 + 0.04 * Math.sin(t * 1.5), t, u, cx, hz + 70 * u, 0);
      pal.clear();
      palm(pal, cx - side * 1.05, h * 0.72, 1.2 * u, 0.5, 0x2a1a24, Math.sin(t * 2.2) * 0.06);
      palm(pal, cx + side * 1.05, h * 0.72, 1.3 * u, -0.55, 0x2a1a24, Math.sin(t * 2 + 1) * 0.06);
      lights(lt, sx0, sx1, top, front, 0.8, Math.floor(t * 2), u, h * 0.16);
    };
    k.addChild(g, wv, pal, stg, lt);
    draw(0.4);
    if (live) liveLoop(k, (t) => draw(t + 0.4));
    return k;
  },
};
