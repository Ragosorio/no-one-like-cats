/**
 * Heisenmiau: the desert universe (a chemistry-teacher crime drama, kept family-friendly: no drugs anywhere — only
 * «química»: his lab flask, a chalkboard and blue rock-candy crystals). A huge sky over a yellow desert of mesas and
 * scrub, under the show's warm haze; an old motorhome smokes from its roof pipe; a tumbleweed rolls by; the flask in
 * his raised paw starts to bubble («blup…»); the wind brings a little black hat that tumbles across the sky and lands
 * — ¡PLOP! — right on his head; chalk writes the formula on a board (2 MIAU + CALOR = PURR); blue candy crystals hail
 * down and ping off the ground; «Atención, clase.»; his glasses glint.
 * Payoff: the flask boils over in blue bubbles, crystal clusters burst out of the ground beside him, molecules fly,
 * the motorhome's smoke turns blue; ¡QUÍMICA! (…y hay examen el lunes.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, burst, drizzle, every, fall, flashOf, later, score } from './kit';
import { hideDisc, typewriter } from './kitA';
import { fadeKill, rng, stash, vgrad } from './kitB';
import { beat, floatWord, paid, pay } from './kitC';
import { balloon, ngon, onCat, say, slideIn, streak, twinkle } from './kitD';
import { type Prepped, lazy, prepTitle, prepWord } from './kitG';

const SKY = [0x1d5aa8, 0x3a84cb, 0x7cbbe4, 0xcfe7ee, 0xf4e6bc];
const SAND = [0xe6bf6a, 0xd6a24c, 0xbf853a];
const MESA_FAR = 0xc79a7a;
const MESA = 0xb8693c;
const MESA_D = 0x8e4a26;
const SCRUB = 0x6f7a3a;
const BLUE = 0x4fc3f7;
const BLUE_L = 0xb4ecff;
const BLUE_D = 0x16577f;
const CHALK = 0xf4f4ec;
const BOARD = 0x2c4a3b;
const WOOD = 0x7a4a24;
const HAT = 0x151515;

/** an anime cumulus (stacked puffs over a pale base; polygons) */
function cumulus(g: Graphics, x: number, y: number, s: number) {
  const puffs: [number, number, number][] = [
    [-0.55, 0.06, 0.3],
    [-0.2, -0.16, 0.42],
    [0.2, -0.24, 0.46],
    [0.56, -0.02, 0.32],
    [0.02, 0.08, 0.4],
  ];
  for (const [px, py, pr] of puffs) g.poly(ngon(x + px * s, y + py * s + s * 0.08, pr * s, pr * s * 0.86, 14)).fill(0xc6dceb);
  for (const [px, py, pr] of puffs) g.poly(ngon(x + px * s, y + py * s, pr * s, pr * s * 0.86, 14)).fill(0xffffff);
  g.rect(x - s * 0.82, y + s * 0.1, s * 1.6, s * 0.24).fill(0xc6dceb);
}

/** a mesa: flat top, steep sides, strata bands (x0 left foot, hz ground line, w wide, h tall) */
function mesa(g: Graphics, x0: number, hz: number, w: number, h: number, col: number, dark: number, strata = true) {
  const top = hz - h;
  g.poly([x0, hz, x0 + w * 0.12, top + h * 0.18, x0 + w * 0.16, top, x0 + w * 0.82, top, x0 + w * 0.86, top + h * 0.2, x0 + w, hz]).fill(col);
  // the shadow side
  g.poly([x0 + w * 0.82, top, x0 + w * 0.86, top + h * 0.2, x0 + w, hz, x0 + w * 0.78, hz]).fill(dark);
  if (!strata) return;
  for (const k of [0.32, 0.55]) {
    const y = top + h * k;
    const a = 0.12 + (0.16 - 0.12) * (1 - k);
    g.poly([x0 + w * (a - 0.02), y, x0 + w * 0.8, y, x0 + w * 0.8, y + h * 0.05, x0 + w * (a - 0.03), y + h * 0.05]).fill({ color: dark, alpha: 0.45 });
  }
}

/** the land: sky, clouds (their own Graphics: they drift), far and near mesas, sand, scrub, tire tracks */
function desert(w: number, h: number, hz: number, u: number, seed: number) {
  const sky = vgrad(new Graphics(), 0, 0, w, hz + 2, SKY, 18);
  const clouds = new Graphics();
  const r = rng(seed);
  const nc = Math.max(2, Math.round(w / (520 * u)));
  for (let i = 0; i < nc; i++) cumulus(clouds, ((i + 0.3 + r() * 0.4) / nc) * w, hz * (0.18 + r() * 0.3), (150 + r() * 90) * u);
  const land = new Graphics();
  // far mesas (hazy), then the near ones
  for (let x = -100 * u; x < w; x += (260 + r() * 260) * u) mesa(land, x, hz, (220 + r() * 260) * u, (40 + r() * 50) * u, MESA_FAR, 0xae8268, false);
  vgrad(land, 0, hz, w, h - hz, SAND, 12);
  for (let x = -200 * u + r() * 200 * u; x < w; x += (520 + r() * 520) * u) mesa(land, x, hz + 6 * u, (300 + r() * 300) * u, (110 + r() * 110) * u, MESA, MESA_D);
  // scrub and stones, smaller toward the horizon
  const sc = new Graphics();
  const n = Math.round((w / u / 1920) * 46);
  for (let i = 0; i < n; i++) {
    const v = r();
    const y = hz + 14 * u + v * v * (h - hz);
    const x = r() * w;
    const s = (6 + v * 26) * u;
    sc.poly(ngon(x, y, s * 1.4, s * 0.7, 9)).fill(SCRUB);
    sc.poly(ngon(x - s * 0.3, y - s * 0.3, s * 0.7, s * 0.45, 7)).fill(0x8a9448);
  }
  // tire tracks to the motorhome (two thin wedges)
  return { sky, clouds, land, scrub: sc };
}

/**
 * the old motorhome (origin at the ground under its middle, facing right): cream body, rust stripes, the cab, dark
 * windows, a roof pipe. Returns the node and the pipe's top (local).
 */
function motorhome(s = 1) {
  const g = new Graphics();
  const ink = { width: 4 * s, color: 0x2a2018, join: 'round' as const };
  g.roundRect(-240 * s, -214 * s, 410 * s, 184 * s, 16 * s).fill(0xf0e8d2).stroke(ink);
  // the cab
  g.poly([170 * s, -168 * s, 222 * s, -134 * s, 238 * s, -60 * s, 238 * s, -30 * s, 170 * s, -30 * s]).fill(0xe8dfc6).stroke(ink);
  g.poly([176 * s, -158 * s, 214 * s, -130 * s, 224 * s, -92 * s, 176 * s, -92 * s]).fill(0x3c4e5e);
  g.poly([182 * s, -150 * s, 200 * s, -138 * s, 186 * s, -112 * s]).fill({ color: 0xffffff, alpha: 0.35 });
  // stripes
  g.rect(-240 * s, -126 * s, 478 * s, 18 * s).fill(0x7c4a22).rect(-240 * s, -102 * s, 478 * s, 7 * s).fill(0xc5853a);
  // windows and the door
  for (const [x, ww] of [
    [-214, 72],
    [-118, 60],
    [-36, 92],
  ])
    g.roundRect(x * s, -192 * s, ww * s, 44 * s, 6 * s).fill(0x34404a).stroke({ width: 3 * s, color: 0x2a2018 });
  g.rect(84 * s, -184 * s, 54 * s, 150 * s).fill(0xe2d8bc).stroke({ width: 3 * s, color: 0x2a2018 });
  g.rect(94 * s, -172 * s, 34 * s, 30 * s).fill(0x34404a);
  g.poly(ngon(130 * s, -104 * s, 4 * s, 4 * s, 6)).fill(0x2a2018);
  // the skirt, bumper, rust
  g.rect(-240 * s, -44 * s, 478 * s, 16 * s).fill(0xc9bfa2);
  g.rect(226 * s, -46 * s, 18 * s, 22 * s).fill(0x9a9a9a);
  for (const [x, y, rr] of [
    [-200, -60, 10],
    [40, -70, 7],
    [150, -58, 8],
    [-90, -140, 6],
  ])
    g.poly(ngon(x * s, y * s, rr * s, rr * 0.7 * s, 7)).fill({ color: 0x9a5a2a, alpha: 0.55 });
  // the roof: a vent and the pipe
  g.rect(-70 * s, -232 * s, 56 * s, 18 * s).fill(0xbdb5a0).stroke({ width: 3 * s, color: 0x2a2018 });
  g.rect(-160 * s, -262 * s, 16 * s, 50 * s).fill(0x8a8a8a).stroke({ width: 3 * s, color: 0x2a2018 });
  // wheels
  for (const x of [-150, 128]) {
    g.poly(ngon(x * s, -24 * s, 32 * s, 32 * s, 14)).fill(0x1a1a1a);
    g.poly(ngon(x * s, -24 * s, 13 * s, 13 * s, 8)).fill(0xa8a8a8);
  }
  return { g, pipe: [-152 * s, -262 * s] as [number, number] };
}

/** smoke puffs rising from the pipe at time t (one Graphics, 9 puffs; blue after the payoff) */
function drawSmoke(g: Graphics, x: number, y: number, t: number, s: number, blue: number) {
  g.clear();
  for (let i = 0; i < 9; i++) {
    const ph = (t * 0.45 + i / 9) % 1;
    const px = x + ph * 120 * s + Math.sin(t * 2 + i) * 8 * s;
    const py = y - ph * 300 * s;
    const r = (12 + ph * 46) * s;
    const col = blue > 0 ? (i % 2 ? BLUE : BLUE_L) : i % 2 ? 0x8f8a86 : 0xc8c2bc;
    g.poly(ngon(px, py, r, r * 0.86, 12)).fill({ color: col, alpha: (1 - ph) * (0.55 + blue * 0.3) });
  }
}

/** a little black hat (pork-pie: flat crown, short brim), origin at the brim's center */
function hat(s = 1) {
  const g = new Graphics();
  g.poly(ngon(0, 0, 86 * s, 18 * s, 18)).fill(HAT);
  g.poly([-50 * s, -2 * s, -46 * s, -54 * s, -36 * s, -60 * s, 36 * s, -60 * s, 46 * s, -54 * s, 50 * s, -2 * s]).fill(HAT);
  g.rect(-49 * s, -22 * s, 98 * s, 12 * s).fill(0x2c2c2c);
  g.poly([-30 * s, -54 * s, 8 * s, -56 * s, -2 * s, -46 * s, -32 * s, -44 * s]).fill({ color: 0xffffff, alpha: 0.16 });
  return g;
}

/** a blue crystal shard (faceted; ~13 vertices) */
function shard(g: Graphics, x: number, y: number, s: number, rot = 0) {
  const P = (dx: number, dy: number) => [x + dx * Math.cos(rot) - dy * Math.sin(rot), y + dx * Math.sin(rot) + dy * Math.cos(rot)];
  const pts = [P(0, -s), P(s * 0.48, -s * 0.22), P(s * 0.32, s * 0.7), P(-s * 0.3, s * 0.62), P(-s * 0.52, -s * 0.1)].flat();
  g.poly(pts).fill(BLUE).stroke({ width: Math.max(1, s * 0.12), color: BLUE_D, join: 'round' });
  g.poly([P(0, -s), P(s * 0.48, -s * 0.22), P(0.02 * s, s * 0.1)].flat()).fill(BLUE_L);
  return g;
}

/** a crystal cluster: tall pointed prisms from one base (origin at the base; scale.y grows it) */
function cluster(s: number, seed: number) {
  const g = new Graphics();
  const r = rng(seed);
  const spikes: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) spikes.push([(i - 2.5) * 30 * s + (r() - 0.5) * 16 * s, (100 + r() * 130) * s, (i - 2.5) * 0.18 + (r() - 0.5) * 0.2]);
  spikes.sort((a, b) => a[1] - b[1]);
  for (const [x, len, a] of spikes) {
    const ca = Math.sin(a);
    const wd = 18 * s;
    const tx = x + ca * len;
    const ty = -len;
    g.poly([x - wd, 0, tx - wd * 0.8, ty + wd * 1.6, tx, ty, tx + wd * 0.8, ty + wd * 1.6, x + wd, 0]).fill(BLUE).stroke({ width: 3 * s, color: BLUE_D, join: 'round' });
    g.poly([x - wd * 0.2, 0, tx - wd * 0.15, ty + wd * 1.6, tx, ty, tx + wd * 0.8, ty + wd * 1.6, x + wd, 0]).fill({ color: BLUE_L, alpha: 0.55 });
  }
  return g;
}

/** a ball-and-stick molecule (one Graphics) */
function molecule(i: number) {
  const g = new Graphics();
  const n = 3 + (i % 2);
  const cols = [0xffffff, 0xe0403a, BLUE, 0x2a2a30];
  for (let j = 0; j < n; j++) {
    const a = (j / n) * Math.PI * 2 + i;
    g.poly(streak(0, 0, Math.cos(a) * 34, Math.sin(a) * 34, 4, 4)).fill(0xdddddd);
  }
  for (let j = 0; j < n; j++) {
    const a = (j / n) * Math.PI * 2 + i;
    g.poly(ngon(Math.cos(a) * 34, Math.sin(a) * 34, 11, 11, 10)).fill(cols[(i + j) % cols.length]).stroke({ width: 2.5, color: C.ink });
  }
  g.poly(ngon(0, 0, 16, 16, 12)).fill(i % 3 ? 0x2a2a30 : BLUE).stroke({ width: 2.5, color: C.ink });
  return g;
}

/** a tumbleweed (a scribbly ball of twigs: thin wedges round a center) */
function tumbleweed(s: number, seed: number) {
  const g = new Graphics();
  const r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const b = a + 1.6 + r() * 1.4;
    const ra = (30 + r() * 26) * s;
    g.poly(streak(Math.cos(a) * ra, Math.sin(a) * ra, Math.cos(b) * ra, Math.sin(b) * ra, 1.6 * s, 1.6 * s)).fill(i % 3 ? 0x9a7444 : 0x6f5230);
  }
  return g;
}

/** the chalkboard on its easel (origin at the board's center): the frame, the board, a tray; formulas come later */
function chalkboard(s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.poly(streak(-150 * s, 120 * s, -190 * s, 330 * s, 8 * s, 8 * s)).fill(WOOD);
  g.poly(streak(150 * s, 120 * s, 190 * s, 330 * s, 8 * s, 8 * s)).fill(WOOD);
  g.poly(streak(0, -120 * s, 0, 300 * s, 7 * s, 7 * s)).fill(0x5e3818);
  g.rect(-230 * s, -150 * s, 460 * s, 280 * s).fill(WOOD).stroke({ width: 4 * s, color: 0x3a2210 });
  g.rect(-214 * s, -136 * s, 428 * s, 252 * s).fill(BOARD);
  // old chalk smudges
  for (const [x, y, rx] of [
    [-120, -60, 90],
    [80, 40, 120],
    [-30, 70, 70],
  ])
    g.poly(ngon(x * s, y * s, rx * s, rx * 0.3 * s, 12)).fill({ color: 0xffffff, alpha: 0.05 });
  g.rect(-220 * s, 128 * s, 440 * s, 12 * s).fill(0x5e3818);
  g.rect(-160 * s, 120 * s, 28 * s, 8 * s).fill(CHALK).rect(100 * s, 121 * s, 18 * s, 7 * s).fill(0xf2d0d0);
  k.addChild(g);
  return k;
}

/** a hexagon molecule in chalk (drawn as 6 thin wedges + 3 bonds out) */
function chalkHex(s = 1) {
  const g = new Graphics();
  const P = ngon(0, 0, 34 * s, 34 * s, 6, Math.PI / 6);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    g.poly(streak(P[i * 2], P[i * 2 + 1], P[j * 2], P[j * 2 + 1], 2.4 * s, 2.4 * s));
  }
  for (const i of [0, 2, 4]) {
    const x = P[i * 2];
    const y = P[i * 2 + 1];
    g.poly(streak(x, y, x * 1.7, y * 1.7, 2.2 * s, 2.2 * s));
  }
  return g.fill({ color: CHALK, alpha: 0.85 });
}

interface St {
  smokeBlue: { v: number };
  title: () => Prepped;
  board: Container;
}
const S = stash<St>();
const HZ = 640;
/**
 * measured on the repainted painting (heisenmiau_chemist_cat.svg, 2026-10-29: a flask in the raised paw, no bag): the
 * hat's brim center and its tilt, the right lens, the flask's mouth and its glass
 */
const HAT_AT: [number, number] = [0.49, 0.19];
const HAT_TILT = 0.15;
const LENS: [number, number] = [0.545, 0.245];
const FLASK_MOUTH: [number, number] = [0.215, 0.2];
const FLASK: [number, number] = [0.25, 0.32];

/** a lab bubble (blue, with a highlight; one Graphics) */
function bubble(r: number) {
  return new Graphics()
    .poly(ngon(0, 0, r, r, 12))
    .fill({ color: BLUE, alpha: 0.55 })
    .stroke({ width: Math.max(1.5, r * 0.18), color: BLUE_D, alpha: 0.8 })
    .poly(ngon(-r * 0.35, -r * 0.35, r * 0.28, r * 0.22, 8))
    .fill({ color: 0xffffff, alpha: 0.85 });
}
const RV_AT: [number, number] = [1555, 900];
const BOARD_AT: [number, number] = [330, 560];

export const heisenmiau: Signature = {
  dark: false,
  frame: BLUE,
  tag: 'UNIVERSO DEL DESIERTO',
  open(c: SigCtx) {
    const k = new Container();
    const d = desert(W, H, HZ, 1, 505);
    const rv = motorhome(1);
    rv.g.position.set(...RV_AT);
    const smoke = new Graphics();
    const [px, py] = [RV_AT[0] + rv.pipe[0], RV_AT[1] + rv.pipe[1]];
    const board = chalkboard(1);
    board.position.set(...BOARD_AT);
    // the show's warm haze over everything
    const haze = new Graphics().rect(0, 0, W, H).fill({ color: 0xffc860, alpha: 0.1 });
    k.addChild(d.sky, d.clouds, d.land, d.scrub, smoke, rv.g, board, haze);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    if (!c.short && !c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    const smokeBlue = { v: 0 };
    const title = lazy(c, 0.95, () => prepTitle(c, '¡QUÍMICA!', { fontFamily: F.poster, fontSize: 190, fill: 0x9beaff, letterSpacing: 4, stroke: { color: 0x0b2233, width: 18, join: 'round' } }, { aside: '…y hay examen el lunes.', maxW: 720 }));
    S.set(c, { smokeBlue, title, board });
    drawSmoke(smoke, px, py, 0.3, 1, 0);
    if (!c.reduce)
      every(c, 30, (t) => {
        if (smoke.destroyed) return;
        drawSmoke(smoke, px, py, t, 1, smokeBlue.v);
        d.clouds.x = -t * 10;
      });
    // the formula on the board (chalk), the hexagon under it
    const formula = '2 MIAU + CALOR\n= PURR';
    const fStyle = { fontFamily: F.brush, fontSize: 40, fill: CHALK, lineHeight: 50, letterSpacing: 1 };
    if (c.short) {
      const t = txt(formula, fStyle);
      t.position.set(-190, -120);
      board.addChild(t);
      const hx = chalkHex(1);
      hx.position.set(130, 50);
      board.addChild(hx);
      return;
    }
    slideIn(c, board, -520, 0, 0.45, 0.35, 'back.out(1.2)');
    score(c, [
      [0.0, 'whoosh', 0.35],
      [0.12, 'whoosh', 0.5],
      [0.55, 'whoosh', 0.7],
    ]);

    // a tumbleweed rolls across the front
    const tw = tumbleweed(1.3, 3);
    tw.position.set(W + 120, H - 70);
    c.fg.addChild(tw);
    if (c.reduce) tw.position.set(W - 260, H - 70);
    else {
      gsap.to(tw, { x: -160, duration: 2.0, ease: 'none', delay: 0.05 });
      gsap.to(tw, { rotation: -16, duration: 2.0, ease: 'none', delay: 0.05 });
      gsap.to(tw, { y: H - 130, duration: 0.25, yoyo: true, repeat: 7, ease: 'sine.out', delay: 0.05 });
    }
    fadeKill(tw, 2.0, 0.2);

    // the flask bubbles: blue bubbles rise out of its mouth all through the takeover
    const [mx, my] = onCat(c, FLASK_MOUTH[0], FLASK_MOUTH[1]);
    const rise = () => {
      const b = bubble(5 + Math.random() * 9);
      b.position.set(mx + (Math.random() - 0.5) * 22, my);
      c.fg.addChild(b);
      const d = 0.9 + Math.random() * 0.5;
      gsap.to(b, { y: my - 130 - Math.random() * 130, x: b.x + (Math.random() - 0.5) * 70, duration: d, ease: 'sine.out' });
      gsap.to(b, { alpha: 0, delay: d * 0.6, duration: d * 0.4, onComplete: () => destroyTree(b) });
    };
    if (c.reduce) {
      const g = new Graphics();
      for (let i = 0; i < 4; i++) g.addChild(Object.assign(bubble(6 + i * 2), { x: mx + (i % 2 ? 10 : -8), y: my - 30 - i * 34 }));
      c.fg.addChild(g);
      fadeKill(g, 2.0, 0.2);
    } else {
      const stop = every(c, 9, (t) => {
        if (t > 2.1 || paid(c)) return stop();
        if (t > 0.25) rise();
      });
    }
    beat(c, 0.45, () => {
      floatWord(c, c.fg, mx - 40, my - 150, 'blup…', { fontFamily: F.comic, fontSize: 40, fill: BLUE_L, letterSpacing: 2, stroke: { color: C.ink, width: 6 } }, 40, 0.9);
      sfx('pop', 1.6);
      later(c, 0.15, () => sfx('pop', 1.9));
    });

    // the hat: the wind carries it across the sky and drops it on his head
    const [hx, hy] = onCat(c, HAT_AT[0], HAT_AT[1]);
    const ht = hat(0.95);
    c.fg.addChild(ht);
    if (c.reduce) {
      ht.position.set(hx, hy);
      ht.rotation = HAT_TILT;
    } else {
      const p = { u: 0 };
      const place = () => {
        if (ht.destroyed) return;
        const u = p.u;
        // a gusty arc: in from the left, up, a loop, down onto him
        ht.position.set(-140 + (hx + 140) * u + Math.sin(u * Math.PI * 2) * 120 * (1 - u), 260 - Math.sin(u * Math.PI) * 180 + (hy - 260) * u * u);
        ht.rotation = (1 - u) * 9 + HAT_TILT;
      };
      place();
      gsap.to(p, { u: 1, duration: 0.75, delay: 0.12, ease: 'sine.inOut', onUpdate: place });
    }
    beat(c, 0.88, () => {
      sfx('pop', 0.7);
      if (!c.reduce && !ht.destroyed) gsap.fromTo(ht.scale, { x: 1.25, y: 0.75 }, { x: 1, y: 1, duration: 0.3, ease: 'elastic.out(1.2,0.4)' });
      floatWord(c, c.fg, hx + 150, hy - 50, '¡PLOP!', { fontFamily: F.comic, fontSize: 48, fill: 0xffffff, stroke: { color: C.ink, width: 7 } }, 40, 0.8);
    });
    // it melts into the painting's own hat
    later(c, 1.25, () => !ht.destroyed && gsap.to(ht, { alpha: 0, duration: 0.3, onComplete: () => destroyTree(ht) }));

    // chalk writes the formula
    beat(c, 0.75, () => {
      typewriter(c, board, formula, -190, -120, fStyle, 26, 'nib');
      later(c, 0.7, () => {
        const hx2 = chalkHex(1);
        hx2.position.set(130, 50);
        board.addChild(hx2);
        if (!c.reduce) gsap.from(hx2.scale, { x: 0.2, y: 0.2, duration: 0.2, ease: 'back.out(2)' });
        sfx('pencil', 1.2);
      });
    });

    // blue crystals hail down, ping and bounce
    const plink = lazy(c, 0.6, () => prepWord(c, c.fg, 1560, 300, '¡PLINK!', BLUE_L, 92, 0.1));
    const plink2 = lazy(c, 0.75, () => prepWord(c, c.fg, 600, 250, '¡PLINK!', BLUE_L, 70, -0.12));
    beat(c, 1.0, () => {
      fall(c, c.fg, () => shard(new Graphics(), 0, 0, 16 + Math.random() * 18, 0), { n: 34, over: 0.85, dur: 0.95, bounce: true, spin: 3 });
      for (let i = 0; i < 6; i++) later(c, 0.25 + i * 0.12, () => sfx('gem', 1.8 + Math.random() * 0.8));
      if (c.reduce) {
        const g = new Graphics();
        for (let i = 0; i < 14; i++) shard(g, 200 + Math.random() * (W - 400), H - 60 - Math.random() * 120, 12 + Math.random() * 10, Math.random() * 6);
        c.back.addChild(g);
      }
    });
    beat(c, 1.25, () => plink().show(0.55));
    beat(c, 1.45, () => plink2().show(0.45));

    // «Atención, clase.»
    beat(c, 1.55, () => {
      const [bx, by] = onCat(c, 0.95, 0.12);
      say(c, c.fg, balloon('Atención, clase.', { size: 42, tx: -150, ty: 70 }), bx + 70, by - 10, 0.75, -0.03);
      sfx('click', 0.8);
    });
    // the glasses glint
    beat(c, 1.95, () => {
      const [gx, gy] = onCat(c, LENS[0], LENS[1]);
      const g = new Graphics().poly(twinkle(0, 0, 46)).fill(0xffffff);
      g.position.set(gx, gy);
      c.fg.addChild(g);
      sfx('gem', 2.4);
      if (!c.reduce) gsap.fromTo(g.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.12, yoyo: true, repeat: 1 });
      fadeKill(g, 0.25, 0.1);
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('zap', 0.6);
    sfx('bigboom', 0.85);
    later(c, 0.08, () => sfx('gem', 1.4));
    later(c, 0.3, () => sfx('fanfare', 1.15));
    c.shaker.add(0.35);
    flashOf(c, 0xc8f2ff, 0.5, 0.35);
    if (st) {
      if (c.reduce) st.smokeBlue.v = 1;
      else gsap.to(st.smokeBlue, { v: 1, duration: 0.4 });
      st.title().show(2.7);
    }
    // crystal clusters burst out of the ground beside him
    for (const [side, seed] of [
      [-1, 11],
      [1, 12],
    ]) {
      const cl = cluster(1, seed);
      cl.position.set(W / 2 + side * 290, c.catY + 246);
      c.behind.addChild(cl);
      if (!c.reduce) gsap.fromTo(cl.scale, { x: 0.6, y: 0 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2)', delay: side > 0 ? 0.06 : 0 });
    }
    // the flask boils over: a burst of blue bubbles from its mouth, a glint on its glass
    const [mx, my] = onCat(c, FLASK_MOUTH[0], FLASK_MOUTH[1]);
    burst(c, c.fg, (i) => bubble(8 + (i % 3) * 5), 14, mx, my - 20, 520, 1.2);
    const [fx, fy] = onCat(c, FLASK[0], FLASK[1]);
    const tw = new Graphics().poly(twinkle(0, 0, 40)).fill(0xffffff);
    tw.position.set(fx + 18, fy - 10);
    c.fg.addChild(tw);
    if (!c.reduce) gsap.fromTo(tw.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.14, yoyo: true, repeat: 1 });
    fadeKill(tw, 0.3, 0.12);
    // molecules fly
    burst(c, c.fg, (i) => molecule(i), 12, W / 2, c.catY - 40, 820, 1.4);
    // and the sky keeps dropping a few crystals
    drizzle(c, c.back, () => shard(new Graphics(), 0, 0, 10 + Math.random() * 8, 0), 0.22, 3.2);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const hz = h * 0.6;
    const d = desert(w, h, hz, u * 1.25, 77);
    const s = u * 1.05;
    const rv = motorhome(s);
    const rx = w / 2 + Math.min(w * 0.36, m * 0.66);
    rv.g.position.set(rx, h * 0.93);
    const smoke = new Graphics();
    const [px, py] = [rx + rv.pipe[0], h * 0.93 + rv.pipe[1]];
    drawSmoke(smoke, px, py, 0.3, s, 0);
    // a few crystals on the sand
    const cr = new Graphics();
    const r = rng(9);
    const nCr = Math.max(6, Math.round((w / m) * 7));
    for (let i = 0; i < nCr; i++) shard(cr, r() * w, h * (0.8 + r() * 0.18), (12 + r() * 10) * u * 2.2, r() * 6);
    // a glint hops from crystal to crystal (live)
    const glint = new Graphics();
    // bubbles rise from the flask in his paw (behind the painting: they show once they clear the glass). The card puts
    // the painting at (w/2, 0.54h), min(w,h)·1.04 wide
    const S2 = m * 1.04;
    const bx = w / 2 + (FLASK_MOUTH[0] - 0.5) * S2;
    const by = h * 0.54 + (FLASK_MOUTH[1] - 0.5) * S2;
    const bub = new Graphics();
    const drawBub = (t: number) => {
      bub.clear();
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.5 + i / 6) % 1;
        const r = S2 * (0.008 + (i % 3) * 0.004);
        const x = bx + Math.sin(t * 2 + i * 1.7) * S2 * 0.02;
        const y = by - ph * S2 * 0.26;
        bub.poly(ngon(x, y, r, r, 10)).fill({ color: BLUE, alpha: 0.7 * (1 - ph) }).poly(ngon(x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.25, 6)).fill({ color: 0xffffff, alpha: 0.85 * (1 - ph) });
      }
    };
    drawBub(0.4);
    k.addChild(d.sky, d.clouds, d.land, d.scrub, smoke, rv.g, cr, glint, bub);
    k.addChild(new Graphics().rect(0, 0, w, h).fill({ color: 0xffc860, alpha: 0.1 }));
    if (live)
      liveLoop(k, (t) => {
        drawSmoke(smoke, px, py, t, s, 0);
        drawBub(t);
        d.clouds.x = -((t * 18 * u * 10) % (w * 0.5));
        glint.clear();
        const ph = (t * 0.7) % 1;
        const gx = (0.08 + ((Math.floor(t * 0.7) * 0.37) % 0.84)) * w;
        glint.poly(twinkle(gx, h * 0.88, 26 * u * 2 * Math.sin(ph * Math.PI))).fill({ color: 0xffffff, alpha: 0.9 });
      });
    return k;
  },
};
