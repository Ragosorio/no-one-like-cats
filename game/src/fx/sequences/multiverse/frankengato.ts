/**
 * Frankengato: the laboratory universe (Shelley, public domain). A stone tower on a night of storm: the roof hatch open
 * to the lightning, his slab rising behind him on chains, a Jacob's ladder climbing between its rods, a copper coil
 * spitting sparks, green flasks bubbling, a big knife switch and a dial that reads MUERTO … VIVO. The switch is thrown
 * (¡KLANK!), the machines wake, the lightning strikes the tower (¡KRAK!) and paints him black on white; his stitches
 * glow, sparks crawl over him and the needle creeps toward VIVO.
 * Payoff: one last bolt, every machine overloads, the corks pop, the needle slams to VIVO; ¡RESPIRA! …y maúlla.
 * (Not Doctor Ovillo's brass lab: no reactor, no arms — stone, storm, the slab and the switch.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, bolt, burst, cover, every, later, score, word } from './kit';
import { cardLoop, hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { arcPts, beat, ell, glowDisc, headline, paid, pay, smooth } from './kitC';

const STONE = [0x2c2a3b, 0x302e41, 0x29273a, 0x343247];
const MORTAR = 0x18171f;
const SKYC = [0x1c1630, 0x352a55, 0x4d3f74];
const VOLT = 0xfff6b0;
const YEL = 0xf2d24b;
const LIME = 0xb6e04a;
const COPPER = 0xc0703a;
const BRASS = 0xb8913f;
const IRON = 0x3b3d46;

/** the stone wall: offset courses of blocks over the mortar */
function stoneWall(g: Graphics, w: number, h: number, bw: number, bh: number, seed: number) {
  g.rect(0, 0, w, h).fill(MORTAR);
  const r = rng(seed);
  let row = 0;
  for (let y = 0; y < h; y += bh, row++)
    for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) g.rect(x + bh * 0.06, y + bh * 0.06, bw - bh * 0.12, bh - bh * 0.12).fill(STONE[Math.floor(r() * STONE.length)]);
  return g;
}

/** the roof hatch open to the storm: an elliptic hole (top center) with clouds; the two hatch doors hang open */
function oculus(w: number, cx: number, rx: number, ry: number, u: number) {
  const k = new Container();
  const hole = ell(cx, 0, rx, ry, 40);
  const sky = new Graphics();
  vgrad(sky, cx - rx, 0, rx * 2, ry, SKYC, 12);
  const r = rng(5);
  for (let i = 0; i < 7; i++) sky.poly(ell(cx - rx + r() * rx * 2, ry * (0.2 + r() * 0.6), rx * (0.18 + r() * 0.2), ry * (0.1 + r() * 0.08), 14)).fill({ color: 0x5c4e86, alpha: 0.5 });
  const mask = new Graphics().poly(hole).fill(0xffffff);
  const flash = new Graphics().poly(hole).fill({ color: 0xe8e0ff, alpha: 1 });
  flash.alpha = 0;
  const inner = new Container();
  inner.addChild(sky, flash, mask);
  inner.mask = mask;
  const rim = new Graphics().poly(arcPts(cx, 0, rx, ry, 0, Math.PI, 30), false).stroke({ width: 22 * u, color: 0x16151d }).poly(arcPts(cx, 0, rx + 10 * u, ry + 8 * u, 0, Math.PI, 30), false).stroke({ width: 6 * u, color: 0x4a4760 });
  // the two wooden hatch doors swung down
  const doors = new Graphics();
  for (const s of [-1, 1]) {
    const x0 = cx + s * rx;
    doors.poly([x0, 0, x0 + s * 30 * u, 0, x0 + s * 70 * u, ry * 1.25, x0 + s * 40 * u, ry * 1.3]).fill(0x3a2a1c).stroke({ width: 4 * u, color: 0x120e0a });
    for (let i = 1; i < 4; i++) doors.moveTo(x0 + s * (8 + i * 8) * u, 0).lineTo(x0 + s * (14 + i * 14) * u, ry * 1.27).stroke({ width: 2 * u, color: 0x1e1610 });
  }
  k.addChild(inner, rim, doors);
  return { k, flash };
}

/** the slab: an iron-banded table stood upright on chains (origin at its center, 420×760) */
function slab(s = 1): Container {
  const k = new Container();
  const g = new Graphics();
  const w = 420 * s;
  const h = 760 * s;
  // chains up to the hatch
  for (const x of [-w * 0.42, w * 0.42]) {
    for (let y = -h / 2; y > -h / 2 - 900 * s; y -= 26 * s) g.poly(ell(x, y, 7 * s, 13 * s, 8)).stroke({ width: 4 * s, color: 0x6d6f7c });
  }
  // a zinc slab, pale, so his silhouette reads against it
  g.roundRect(-w / 2, -h / 2, w, h, 18 * s).fill(0x5d6274).stroke({ width: 8 * s, color: 0x14151b });
  g.roundRect(-w / 2 + 18 * s, -h / 2 + 18 * s, w - 36 * s, h - 36 * s, 10 * s).fill(0x9aa0b6);
  g.rect(-w / 2 + 18 * s, -h / 2 + 18 * s, w * 0.18, h - 36 * s).fill({ color: 0xffffff, alpha: 0.12 });
  for (let i = 1; i < 6; i++) g.moveTo(-w / 2 + 24 * s, -h / 2 + (i * h) / 6).lineTo(w / 2 - 24 * s, -h / 2 + (i * h) / 6).stroke({ width: 3 * s, color: 0x7a8096 });
  // iron bands with rivets, leather straps
  for (const y of [-h * 0.42, h * 0.42]) {
    g.rect(-w / 2 - 6 * s, y - 14 * s, w + 12 * s, 28 * s).fill(IRON).stroke({ width: 3 * s, color: 0x111216 });
    for (let i = 0; i < 6; i++) g.poly(ell(-w / 2 + 20 * s + (i * (w - 40 * s)) / 5, y, 5 * s, 5 * s, 8)).fill(0x8a8c98);
  }
  for (const y of [-h * 0.12, h * 0.16]) g.rect(-w / 2 - 10 * s, y - 16 * s, w + 20 * s, 32 * s).fill(0x5a3a24).rect(-24 * s, y - 20 * s, 48 * s, 40 * s).stroke({ width: 6 * s, color: BRASS });
  k.addChild(g);
  return k;
}

/** a Jacob's ladder: two rods in a V on a box with dials; `arc` is redrawn by the caller (origin at the box's top) */
function jacob(s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-90 * s, 0, 180 * s, 120 * s).fill(0x2a2b33).stroke({ width: 5 * s, color: 0x0d0d10 });
  for (const x of [-46, 46]) g.poly(ell(x * s, 52 * s, 22 * s, 22 * s, 16)).fill(0xd8d2bc).stroke({ width: 4 * s, color: BRASS });
  for (const x of [-46, 46]) g.moveTo(x * s, 52 * s).lineTo(x * s + 12 * s, 38 * s).stroke({ width: 3 * s, color: 0x8a1f1f });
  g.rect(-30 * s, -16 * s, 60 * s, 16 * s).fill(0x5a5c66);
  g.moveTo(-14 * s, -10 * s).lineTo(-60 * s, -380 * s).stroke({ width: 8 * s, color: COPPER, cap: 'round' });
  g.moveTo(14 * s, -10 * s).lineTo(60 * s, -380 * s).stroke({ width: 8 * s, color: COPPER, cap: 'round' });
  const arc = new Graphics();
  arc.blendMode = 'add';
  k.addChild(g, arc);
  /** the arc at height k (0 = bottom, 1 = top) */
  const draw = (t: number, fat = 1) => {
    if (arc.destroyed) return;
    arc.clear();
    const y = -20 * s - t * 350 * s;
    const half = (14 + (46 * (y / s + 10)) / -370) * s;
    for (const [wd, col, a] of [
      [14 * fat, LIME, 0.25],
      [5 * fat, VOLT, 1],
    ] as const) {
      arc.moveTo(-half, y);
      for (let i = 1; i < 6; i++) arc.lineTo(-half + (i / 6) * half * 2, y - 10 * s - Math.random() * 26 * s * fat);
      arc.lineTo(half, y).stroke({ width: wd * s, color: col, alpha: a, cap: 'round', join: 'round' });
    }
  };
  return { k, draw };
}

/** a copper coil with its torus on top (origin at its base); sparks are drawn by the caller from `top` */
function coil(s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-70 * s, -40 * s, 140 * s, 40 * s).fill(0x2a2b33).stroke({ width: 4 * s, color: 0x0d0d10 });
  g.rect(-38 * s, -400 * s, 76 * s, 360 * s).fill(0x6a3d22);
  for (let y = -396; y < -44; y += 12) g.rect(-40 * s, y * s, 80 * s, 7 * s).fill(COPPER);
  g.rect(-38 * s, -400 * s, 14 * s, 360 * s).fill({ color: 0xffffff, alpha: 0.12 });
  g.poly(ell(0, -420 * s, 92 * s, 30 * s, 28)).fill(0x9a9ca8).stroke({ width: 5 * s, color: 0x2a2b33 });
  g.poly(ell(-10 * s, -428 * s, 60 * s, 12 * s, 20)).fill({ color: 0xffffff, alpha: 0.25 });
  const sparks = new Graphics();
  sparks.blendMode = 'add';
  k.addChild(g, sparks);
  return { k, sparks, top: [0, -420 * s] as [number, number] };
}

/** the dial MUERTO … VIVO (origin at its pivot); the needle swings from -2.6 (MUERTO) to -0.55 (VIVO) */
function dial(s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.poly(ell(0, 0, 130 * s, 130 * s, 36)).fill(BRASS).stroke({ width: 6 * s, color: 0x2a1e0e });
  g.poly(ell(0, 0, 112 * s, 112 * s, 36)).fill(0xe8dfc4);
  g.poly([...arcPts(0, 0, 96 * s, 96 * s, Math.PI + 0.35, Math.PI * 1.55, 10), ...arcPts(0, 0, 78 * s, 78 * s, Math.PI * 1.55, Math.PI + 0.35, 10)]).fill(0x8a1f1f);
  g.poly([...arcPts(0, 0, 96 * s, 96 * s, Math.PI * 1.65, Math.PI * 2 - 0.35, 10), ...arcPts(0, 0, 78 * s, 78 * s, Math.PI * 2 - 0.35, Math.PI * 1.65, 10)]).fill(0x3f9a3a);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + 0.35 + (i / 10) * (Math.PI - 0.7);
    g.moveTo(Math.cos(a) * 70 * s, Math.sin(a) * 70 * s).lineTo(Math.cos(a) * 60 * s, Math.sin(a) * 60 * s).stroke({ width: 3 * s, color: 0x2a1e0e });
  }
  const st = { fontFamily: F.poster, fontSize: 24 * s, fill: 0x2a1e0e } as const;
  const a = txt('MUERTO', st);
  a.anchor.set(0.5);
  a.position.set(-56 * s, 34 * s);
  const b = txt('VIVO', { ...st, fill: 0x2f7a2b });
  b.anchor.set(0.5);
  b.position.set(56 * s, 34 * s);
  const needle = new Graphics().poly([0, -6 * s, 100 * s, 0, 0, 6 * s]).fill(0x111111);
  needle.rotation = -2.6;
  const cap = new Graphics().poly(ell(0, 0, 14 * s, 14 * s, 12)).fill(BRASS).stroke({ width: 3 * s, color: 0x2a1e0e });
  k.addChild(g, a, b, needle, cap);
  return { k, needle, vivo: b };
}

/** the big knife switch on its slate (origin at the hinge); lever.rotation 0 = open (up), PI*0.92 = thrown */
function knifeSwitch(s = 1) {
  const k = new Container();
  const g = new Graphics().roundRect(-80 * s, -170 * s, 160 * s, 300 * s, 10 * s).fill(0x3d4048).stroke({ width: 5 * s, color: 0x111216 });
  for (const x of [-34, 34]) g.rect((x - 9) * s, 70 * s, 18 * s, 44 * s).fill(BRASS).rect((x - 9) * s, -14 * s, 18 * s, 28 * s).fill(BRASS);
  const lever = new Graphics();
  for (const x of [-34, 34]) lever.rect((x - 5) * s, -150 * s, 10 * s, 150 * s).fill(0xd9d2c0);
  lever.rect(-46 * s, -168 * s, 92 * s, 20 * s).fill(0x222222).roundRect(-14 * s, -230 * s, 28 * s, 70 * s, 12 * s).fill(0x6a3d22).stroke({ width: 3 * s, color: 0x111111 });
  k.addChild(g, lever);
  return { k, lever };
}

/** a lab flask with green liquid (origin at its base) */
function flask(g: Graphics, x: number, y: number, s: number, col: number, tall: boolean) {
  const neck = tall ? 90 : 40;
  const body = tall ? smooth([-14, -neck, -14, -neck * 0.5, -40, -30, -40, 0, 40, 0, 40, -30, 14, -neck * 0.5, 14, -neck], 3) : ell(0, -42, 46, 42, 20);
  const pts = body.map((v, i) => (i % 2 ? y + v * s : x + v * s));
  g.poly(pts).fill({ color: 0xcfe8e0, alpha: 0.25 }).stroke({ width: 3 * s, color: 0xcfe8e0, alpha: 0.7 });
  const liq = tall ? [-38, -28, 38, -28, 38, 0, -38, 0] : arcPts(0, -42, 44, 40, 0.15, Math.PI - 0.15, 10);
  g.poly(liq.map((v, i) => (i % 2 ? y + v * s : x + v * s))).fill({ color: col, alpha: 0.85 });
  if (!tall) g.rect(x - 12 * s, y - 112 * s, 24 * s, 34 * s).fill({ color: 0xcfe8e0, alpha: 0.25 }).stroke({ width: 3 * s, color: 0xcfe8e0, alpha: 0.7 });
  g.rect(x - 10 * s, y - (tall ? neck + 16 : 124) * s, 20 * s, 16 * s).fill(0x8a6a44);
}

interface St {
  dimmer: Graphics;
  flashSky: Graphics;
  ladder: ReturnType<typeof jacob>;
  tc: ReturnType<typeof coil>;
  dl: ReturnType<typeof dial>;
  power: { v: number; needle: number; jitter: number };
  corks: [number, number][];
  fx: Container;
}
const S = stash<St>();
const LADDER: [number, number] = [300, 760];
const COIL: [number, number] = [1660, 880];
const DIAL: [number, number] = [1560, 330];
const SWITCH: [number, number] = [150, 560];

/** stitches across a seam: short glowing ticks along (x0,y0)→(x1,y1) */
function stitches(g: Graphics, x0: number, y0: number, x1: number, y1: number, n: number, len: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  g.moveTo(x0, y0).lineTo(x1, y1);
  for (let i = 0; i <= n; i++) {
    const x = x0 + (dx * i) / n;
    const y = y0 + (dy * i) / n;
    g.moveTo(x - nx * len, y - ny * len).lineTo(x + nx * len, y + ny * len);
  }
}

export const frankengato: Signature = {
  dark: true,
  frame: LIME,
  tag: 'UNIVERSO LABORATORIO',
  open(c: SigCtx) {
    const k = new Container();
    const wall = stoneWall(new Graphics(), W, H, 168, 70, 21);
    const oc = oculus(W, W / 2, 560, 250, 1);
    const floor = new Graphics().rect(0, 880, W, H - 880).fill(0x1d1c27);
    for (let x = -40; x < W; x += 150) floor.poly([x, 880, x + 140, 880, x + 160 + (x - W / 2) * 0.15, H, x + (x - W / 2) * 0.15, H]).stroke({ width: 3, color: 0x111018 });
    // cables snaking across the floor to the slab
    const cables = new Graphics();
    cables.poly(smooth([LADDER[0], 870, 520, 980, 760, 930, 900, 900], 5, false), false).stroke({ width: 10, color: 0x111111 });
    cables.poly(smooth([COIL[0], 880, 1400, 990, 1180, 940, 1020, 900], 5, false), false).stroke({ width: 10, color: 0x111111 });
    const ladder = jacob(1);
    ladder.k.position.set(LADDER[0], LADDER[1]);
    const tc = coil(1);
    tc.k.position.set(COIL[0], COIL[1]);
    const dl = dial(0.9);
    dl.k.position.set(DIAL[0], DIAL[1]);
    const sw = knifeSwitch(0.9);
    sw.k.position.set(SWITCH[0], SWITCH[1]);
    const shelf = new Graphics().rect(1300, 846, 300, 16).fill(0x3a2a1c).rect(60, 846, 120, 16).fill(0x3a2a1c);
    const flasks = new Graphics();
    flask(flasks, 1340, 846, 0.9, LIME, true);
    flask(flasks, 1420, 846, 1, 0x7ad3a0, false);
    flask(flasks, 1520, 846, 0.8, LIME, true);
    flask(flasks, 110, 846, 0.8, 0x7ad3a0, false);
    const corks: [number, number][] = [
      [1340, 846 - 122 * 0.9],
      [1420, 846 - 124],
      [1520, 846 - 122 * 0.8],
      [110, 846 - 124 * 0.8],
    ];
    const fx = new Container();
    const dimmer = cover(0x05040a, c.reduce || c.short ? 0.3 : 0.9);
    k.addChild(wall, oc.k, floor, cables, ladder.k, tc.k, dl.k, sw.k, shelf, flasks, fx, dimmer);
    c.back.addChild(k);
    hideDisc(c);
    // the slab rises behind him; a cold light behind it so the silhouette reads
    const glow = glowDisc(430, 0x8f86c8, 0.3, 10, 32);
    glow.position.set(W / 2, c.catY - 20);
    const sl = slab(1);
    sl.position.set(W / 2, c.catY + 30 + (c.short || c.reduce ? 0 : 320));
    glow.blendMode = 'add';
    c.behind.addChild(sl, glow);
    const power = { v: c.short ? 1 : 0, needle: c.short ? -1.2 : -2.6, jitter: 0.05 };
    S.set(c, { dimmer, flashSky: oc.flash, ladder, tc, dl, power, corks, fx });
    if (c.short || c.reduce) sw.lever.rotation = Math.PI * 0.92;
    ladder.draw(0.5, c.short ? 1 : 0.0001);
    // the machines: the ladder's arc climbs, the coil spits, the bubbles rise, the needle trembles
    if (!c.reduce) {
      let climb = 0;
      every(c, 30, (t) => {
        if (power.v > 0.02) {
          climb = (climb + 0.045 * (0.6 + power.v)) % 1;
          ladder.draw(climb, 0.6 + power.v * 0.6);
          if (!tc.sparks.destroyed) {
            tc.sparks.clear();
            const n = Math.round(1 + power.v * 3);
            for (let i = 0; i < n; i++) {
              const a = Math.random() * Math.PI * 2;
              const d = 90 + Math.random() * 140 * power.v;
              bolt(tc.sparks, tc.top[0], tc.top[1], tc.top[0] + Math.cos(a) * d, tc.top[1] + Math.sin(a) * d * 0.7, VOLT, 3, 6, 30);
            }
          }
        } else if (!ladder.k.destroyed) ladder.draw(0, 0.0001);
        if (!dl.needle.destroyed) dl.needle.rotation = power.needle + (Math.random() - 0.5) * power.jitter * (0.3 + power.v);
        if (power.v > 0.02 && Math.random() < 0.35) {
          const [bx, by] = corks[Math.floor(Math.random() * corks.length)];
          const b = new Graphics().poly(ell(0, 0, 4 + Math.random() * 4, 4 + Math.random() * 4, 8)).fill({ color: 0xd8ffd0, alpha: 0.8 });
          b.position.set(bx + (Math.random() - 0.5) * 10, by + 20);
          fx.addChild(b);
          gsap.to(b, { y: b.y - 60 - Math.random() * 50, alpha: 0, duration: 0.8, ease: 'sine.out', onComplete: () => destroyTree(b) });
        }
        void t;
      });
    } else {
      dl.needle.rotation = power.needle;
    }
    if (c.short) return;

    score(c, [
      [0.02, 'zap', 0.5],
      [0.05, 'boom', 0.35],
      [0.26, 'hit', 0.5],
      [0.28, 'shield', 0.6],
      [0.32, 'charge', 0.7],
      [0.45, 'tick', 0.5],
      [0.6, 'tick', 0.45],
      [0.75, 'tick', 0.5],
      [1.05, 'bigboom', 0.6],
      [1.06, 'zap', 0.8],
      [1.26, 'zap', 1.1],
      [1.6, 'charge', 1.0],
      [2.0, 'zap', 0.7],
    ]);
    // a first flash shows the lab; the lamps flicker on
    const strike = (alpha: number) => {
      if (!c.flashes) return;
      const f = cover(0xf4f0ff, alpha);
      k.addChild(f);
      gsap.to(f, { alpha: 0, duration: 0.12, delay: 0.06, onComplete: () => destroyTree(f) });
      if (!oc.flash.destroyed) gsap.fromTo(oc.flash, { alpha: 1 }, { alpha: 0, duration: 0.4 });
    };
    if (!c.reduce) {
      strike(0.6);
      gsap.to(dimmer, { alpha: 0.65, duration: 0.05, delay: 0.08 });
      gsap.to(dimmer, { alpha: 0.3, duration: 0.25, delay: 0.3 });
    }
    // ¡KLANK!: the switch is thrown, the machines wake
    beat(c, 0.25, () => {
      if (!sw.lever.destroyed) {
        if (c.reduce) sw.lever.rotation = Math.PI * 0.92;
        else gsap.to(sw.lever, { rotation: Math.PI * 0.92, duration: 0.12, ease: 'power3.in' });
      }
      later(c, 0.12, () => {
        word(c, SWITCH[0] + 150, SWITCH[1] - 170, '¡KLANK!', 0xd9d2c0, 70, 0.7);
        burst(c, fx, () => new Graphics().poly([0, -6, 16, 0, 0, 6]).fill(VOLT), 10, SWITCH[0], SWITCH[1] + 80, 160, 0.4);
        c.shaker.add(0.2);
        if (c.reduce) power.v = 0.5;
        else gsap.to(power, { v: 0.5, duration: 0.4 });
        power.needle = -2.3;
        power.jitter = 0.25;
      });
    });
    // the slab rises on its chains
    if (!c.reduce) gsap.to(sl, { y: c.catY + 30, duration: 0.7, delay: 0.38, ease: 'power2.out' });
    // ¡KRAK!: the lightning hits the tower and paints him on white
    const krak = (t: number, big: boolean, neg: number) =>
      beat(c, t, () => {
        const g = new Graphics();
        g.blendMode = 'add';
        k.addChild(g);
        const x0 = W / 2 + (Math.random() - 0.5) * 300;
        bolt(g, x0, -20, W / 2 + 10, c.catY - 210, LIME, big ? 30 : 18, 10, 110);
        bolt(g, x0, -20, W / 2 + 10, c.catY - 210, VOLT, big ? 9 : 6, 10, 110);
        gsap.to(g, { alpha: 0, duration: 0.3, delay: 0.08, onComplete: () => destroyTree(g) });
        if (c.flashes && neg > 0) {
          // black on white: his silhouette is the only dark thing in the room
          const f = cover(0xffffff, neg);
          k.addChild(f);
          gsap.to(f, { alpha: 0, duration: 0.14, delay: 0.06, onComplete: () => destroyTree(f) });
        } else if (!oc.flash.destroyed) gsap.fromTo(oc.flash, { alpha: 0.6 }, { alpha: 0, duration: 0.4 });
        if (!oc.flash.destroyed && c.flashes) gsap.fromTo(oc.flash, { alpha: 1 }, { alpha: 0, duration: 0.5 });
        c.shaker.add(big ? 0.45 : 0.25);
        power.v = Math.min(1, power.v + 0.25);
      });
    krak(1.05, true, 0.92);
    krak(1.25, false, 0.45);
    krak(2.0, false, 0);
    beat(c, 1.1, () => word(c, W / 2 + 330, 250, '¡KRAK!', YEL, 120, 0.9));
    // his stitches glow and sparks crawl over him; the needle creeps toward VIVO
    beat(c, 1.1, () => {
      const seams = new Graphics();
      const cx = W / 2;
      const cy = c.catY;
      stitches(seams, cx - 26, cy - 188, cx - 20, cy - 96, 7, 9);
      stitches(seams, cx - 74, cy - 70, cx + 52, cy - 52, 8, 8);
      stitches(seams, cx - 40, cy + 60, cx + 30, cy + 120, 5, 8);
      seams.stroke({ width: 4, color: LIME, cap: 'round' });
      seams.blendMode = 'add';
      c.fg.addChild(seams);
      if (c.reduce) {
        later(c, 1.1, () => destroyTree(seams));
        power.needle = -1.6;
        if (!dl.needle.destroyed) dl.needle.rotation = power.needle;
        return;
      }
      gsap.fromTo(seams, { alpha: 0 }, { alpha: 1, duration: 0.2, yoyo: true, repeat: 4, onComplete: () => destroyTree(seams) });
      const crawl = new Graphics();
      crawl.blendMode = 'add';
      c.fg.addChild(crawl);
      const stop = every(c, 30, (t) => {
        if (crawl.destroyed || t > 1.1 || paid(c)) {
          stop();
          destroyTree(crawl);
          return;
        }
        crawl.clear();
        for (let i = 0; i < 3; i++) {
          const x = cx - 200 + Math.random() * 400;
          const y = cy - 230 + Math.random() * 460;
          const a = Math.random() * Math.PI * 2;
          const d = 40 + Math.random() * 60;
          bolt(crawl, x, y, x + Math.cos(a) * d, y + Math.sin(a) * d, VOLT, 3, 5, 18);
        }
      });
      gsap.to(power, { needle: -1.3, duration: 1.0, ease: 'power1.inOut' });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('bigboom', 0.55);
    sfx('zap', 0.6);
    sfx('charge', 1.4);
    later(c, 0.18, () => sfx('pop', 0.9));
    later(c, 0.28, () => sfx('pop', 1.1));
    later(c, 0.36, () => sfx('pop', 0.8));
    later(c, 0.5, () => sfx('levelup', 1.2));
    c.shaker.add(0.55);
    // one last bolt, straight into him
    const g = new Graphics();
    g.blendMode = 'add';
    c.back.addChild(g);
    bolt(g, W / 2 + 60, -20, W / 2, c.catY - 210, LIME, 36, 11, 120);
    bolt(g, W / 2 + 60, -20, W / 2, c.catY - 210, VOLT, 11, 11, 120);
    gsap.to(g, { alpha: 0, duration: 0.45, delay: 0.1, onComplete: () => destroyTree(g) });
    if (c.flashes) {
      const f = cover(0xf4ffe0, 0.3);
      c.fg.addChild(f);
      gsap.to(f, { alpha: 0, duration: 0.4, onComplete: () => destroyTree(f) });
    }
    if (st) {
      st.power.v = 1.6;
      st.power.jitter = 0.04;
      if (!st.dl.needle.destroyed) {
        st.power.needle = -0.6;
        if (c.reduce) st.dl.needle.rotation = -0.6;
        else gsap.fromTo(st.power, { needle: -1.3 }, { needle: -0.55, duration: 0.25, ease: 'back.out(3)' });
      }
      if (!st.dl.vivo.destroyed) {
        st.dl.vivo.style.fill = 0x9bff7a;
        st.dl.vivo.style.stroke = { color: 0x1d4a1a, width: 4 };
      }
      if (!st.dimmer.destroyed) st.dimmer.alpha = 0.12;
      if (!st.flashSky.destroyed && c.flashes) gsap.fromTo(st.flashSky, { alpha: 1 }, { alpha: 0, duration: 0.6 });
      // the corks pop, green spills
      if (!c.reduce)
        st.corks.forEach(([x, y], i) => {
          later(c, 0.15 + i * 0.08, () => {
            if (st.fx.destroyed) return;
            const ck = new Graphics().rect(-10, -8, 20, 16).fill(0x8a6a44);
            ck.position.set(x, y);
            st.fx.addChild(ck);
            gsap.to(ck, { y: y - 260 - Math.random() * 120, x: x + (Math.random() - 0.5) * 200, rotation: 8, duration: 0.6, ease: 'power2.out' });
            gsap.to(ck, { alpha: 0, delay: 0.5, duration: 0.3, onComplete: () => destroyTree(ck) });
            burst(c, st.fx, () => new Graphics().poly(ell(0, 0, 6, 6, 8)).fill({ color: LIME, alpha: 0.9 }), 8, x, y, 120, 0.6);
          });
        });
      later(c, 1.2, () => {
        st.power.v = 1;
      });
    }
    // sparks fly off him
    burst(c, c.fg, () => new Graphics().poly([0, -5, 22, 0, 0, 5]).fill(VOLT), 18, W / 2, c.catY - 40, 520, 0.8);
    headline(c, '¡RESPIRA!', { fontFamily: F.comic, fontSize: 168, fill: YEL, letterSpacing: 4, stroke: { color: C.ink, width: 16, join: 'round' } }, {
      glow: LIME,
      aside: '…y maúlla.',
      asideStyle: { fill: 0xe4f7c0, fontSize: 52 },
      dur: 2.6,
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const wall = stoneWall(new Graphics(), w, h, 54 * u, 22 * u, 21);
    const oc = oculus(w, w / 2, Math.min(w * 0.4, 190 * u), 80 * u, u);
    const floor = new Graphics().rect(0, h * 0.86, w, h * 0.14).fill(0x1d1c27);
    const glow = glowDisc(Math.min(w, h) * 0.42, 0x8f86c8, 0.3, 8, 28);
    glow.position.set(w / 2, h * 0.52);
    glow.blendMode = 'add';
    const sl = slab(0.36 * u);
    sl.position.set(w / 2, h * 0.56);
    const ladder = jacob(0.34 * u);
    ladder.k.position.set(w / 2 - 125 * u, h * 0.86 - 40 * u);
    const tc = coil(0.3 * u);
    tc.k.position.set(w / 2 + 125 * u, h * 0.9);
    const dl = dial(0.3 * u);
    dl.k.position.set(w / 2 + 120 * u, h * 0.3);
    dl.needle.rotation = -0.9;
    const fl = new Graphics();
    flask(fl, w / 2 - 70 * u, h * 0.95, 0.4 * u, LIME, true);
    flask(fl, w / 2 + 70 * u, h * 0.95, 0.4 * u, 0x7ad3a0, false);
    k.addChild(wall, oc.k, floor, sl, glow, ladder.k, tc.k, dl.k, fl);
    ladder.draw(0.55, 1);
    bolt(tc.sparks, tc.top[0], tc.top[1], tc.top[0] - 40 * u, tc.top[1] - 20 * u, VOLT, 1.5 * u, 5, 10 * u);
    if (live) {
      let climb = 0;
      cardLoop(k, 24, (t) => {
        climb = (climb + 0.05) % 1;
        ladder.draw(climb, 1);
        tc.sparks.clear();
        for (let i = 0; i < 2; i++) {
          const a = Math.random() * Math.PI * 2;
          const d = (30 + Math.random() * 40) * u;
          bolt(tc.sparks, tc.top[0], tc.top[1], tc.top[0] + Math.cos(a) * d, tc.top[1] + Math.sin(a) * d * 0.7, VOLT, 1.5 * u, 5, 10 * u);
        }
        dl.needle.rotation = -0.9 + Math.sin(t * 7) * 0.06;
        const ph = t % 4;
        oc.flash.alpha = ph < 0.08 || (ph > 0.18 && ph < 0.24) ? 0.9 : 0;
      });
    }
    return k;
  },
};

