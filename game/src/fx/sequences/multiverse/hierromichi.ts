/**
 * Hierro Michi: the armor universe (the genius in red-gold powered armor). A high-tech garage at night: a polished floor
 * with a light grid, a back wall of lit glass cases each holding one of his forty armors, floating blue holographic
 * panels (graphs, gauges), a clumsy robot arm. «PROTOCOLO DE ARMADURA · INICIANDO…»: red and gold plates fly in from
 * both sides and lock onto the silhouette — ¡CLANK! ¡CLANK! — then we're INSIDE the helmet: the HUD's reticle turns
 * around him and the readouts tell the truth (ENERGÍA 400 % · EGO: MÁX · HUMILDAD: 0 %). The chest circle hums on.
 * Payoff: boot thrusters fire blue under his paws, every armor in the cases lights its chest, the holograms flare;
 * ¡ARMADURA LISTA! (…y la número 41 ya viene.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, every, flashOf, later, score } from './kit';
import { hideDisc, typewriter } from './kitA';
import { fadeKill, rng, stash, vgrad } from './kitB';
import { beat, floatWord, paid, pay } from './kitC';
import { bandPts, ngon, onCat, streak } from './kitD';
import { type Prepped, TAU, hidden, lazy, prepTitle, prepWord, pulse, sparks } from './kitG';

const BG = [0x080b12, 0x111827, 0x18233a];
const RED = 0xb3001b;
const RED_L = 0xe0283a;
const GOLD = 0xe6c34a;
const HOLO = 0x6ec6f0;
const HOLO_L = 0xc8f0ff;
const STEEL = 0x2a3344;

/** one armor on its stand (origin at its feet): red shell, gold faceplate and trim, a chest circle (its own Graphics) */
function armor(s = 1) {
  const k = new Container();
  const g = new Graphics();
  const ink = { width: 3 * s, color: 0x2a0008, join: 'round' as const };
  // legs, hips, torso, shoulders, arms
  g.poly([-34 * s, 0, -12 * s, 0, -10 * s, -120 * s, -36 * s, -120 * s]).fill(RED).stroke(ink);
  g.poly([12 * s, 0, 34 * s, 0, 36 * s, -120 * s, 10 * s, -120 * s]).fill(RED).stroke(ink);
  g.rect(-30 * s, -60 * s, 18 * s, 16 * s).fill(GOLD).rect(12 * s, -60 * s, 18 * s, 16 * s).fill(GOLD);
  g.poly([-46 * s, -120 * s, 46 * s, -120 * s, 56 * s, -230 * s, -56 * s, -230 * s]).fill(RED).stroke(ink);
  g.poly([-30 * s, -150 * s, 30 * s, -150 * s, 24 * s, -122 * s, -24 * s, -122 * s]).fill(GOLD);
  for (const sd of [-1, 1]) {
    g.poly(ngon(sd * 62 * s, -224 * s, 22 * s, 18 * s, 10)).fill(RED_L).stroke(ink);
    g.poly([sd * 58 * s, -210 * s, sd * 78 * s, -206 * s, sd * 82 * s, -110 * s, sd * 62 * s, -110 * s]).fill(RED).stroke(ink);
    g.poly(ngon(sd * 72 * s, -100 * s, 13 * s, 12 * s, 8)).fill(GOLD).stroke(ink);
  }
  // the helmet: dome, cat ears, gold faceplate with eye slits
  g.poly([-34 * s, -262 * s, -30 * s, -300 * s, -12 * s, -282 * s]).fill(RED).stroke(ink);
  g.poly([34 * s, -262 * s, 30 * s, -300 * s, 12 * s, -282 * s]).fill(RED).stroke(ink);
  g.poly(ngon(0, -262 * s, 36 * s, 38 * s, 16)).fill(RED).stroke(ink);
  g.poly([-24 * s, -270 * s, 24 * s, -270 * s, 20 * s, -236 * s, 0, -228 * s, -20 * s, -236 * s]).fill(GOLD).stroke({ width: 2 * s, color: 0x2a0008 });
  g.rect(-16 * s, -262 * s, 12 * s, 4 * s).fill(HOLO_L).rect(4 * s, -262 * s, 12 * s, 4 * s).fill(HOLO_L);
  const core = new Graphics();
  core.position.set(0, -196 * s);
  drawCore(core, 13 * s, 0.4);
  k.addChild(g, core);
  return { k, core };
}

/** the chest circle: a white-blue core with a ring and a little paw of light; `on` 0..1 */
function drawCore(g: Graphics, r: number, on: number) {
  g.clear();
  g.poly(ngon(0, 0, r * 2.4, r * 2.4, 18)).fill({ color: HOLO, alpha: 0.12 * on });
  g.poly(ngon(0, 0, r * 1.25, r * 1.25, 16)).fill(0x1a2433);
  g.poly(ngon(0, 0, r, r, 16)).fill({ color: HOLO, alpha: 0.4 + 0.6 * on });
  g.poly(ngon(0, 0, r * 0.55, r * 0.55, 12)).fill({ color: 0xffffff, alpha: 0.3 + 0.7 * on });
}

/** a glass case with its armor (origin at the floor, center) */
function caseWith(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-110 * s, -400 * s, 220 * s, 400 * s).fill({ color: 0x0f1622, alpha: 1 });
  // the base light and the top strip
  g.rect(-110 * s, -20 * s, 220 * s, 20 * s).fill(0xdfe8f0).rect(-110 * s, -400 * s, 220 * s, 10 * s).fill(0xdfe8f0);
  g.poly([-90 * s, -20 * s, 90 * s, -20 * s, 60 * s, -120 * s, -60 * s, -120 * s]).fill({ color: 0xdfe8f0, alpha: 0.08 });
  const a = armor(s * 1.12);
  a.k.position.set(0, -22 * s);
  const glass = new Graphics().rect(-110 * s, -400 * s, 220 * s, 400 * s).stroke({ width: 5 * s, color: 0x8aa0b8 });
  glass.poly([-90 * s, -380 * s, -60 * s, -380 * s, -100 * s, -60 * s, -108 * s, -60 * s]).fill({ color: 0xffffff, alpha: 0.12 });
  k.addChild(g, a.k, glass);
  return { k, core: a.core };
}

/** a holographic panel (origin top-left, w×h): frame, header bar, `kind` 0 graph / 1 gauge / 2 bars, at time t */
function drawPanel(g: Graphics, w: number, h: number, kind: number, t: number, s: number) {
  g.clear();
  g.rect(0, 0, w, h).fill({ color: HOLO, alpha: 0.1 }).stroke({ width: 2 * s, color: HOLO, alpha: 0.8 });
  g.rect(0, 0, w, 16 * s).fill({ color: HOLO, alpha: 0.35 });
  for (let i = 0; i < 3; i++) g.rect(w - (18 + i * 14) * s, 4 * s, 8 * s, 8 * s).fill({ color: HOLO_L, alpha: 0.8 });
  if (kind === 0) {
    const pts: number[] = [];
    for (let i = 0; i <= 20; i++) {
      const x = 10 * s + (i / 20) * (w - 20 * s);
      pts.push(x, h * 0.62 + Math.sin(i * 0.9 + t * 3) * h * 0.18 + Math.sin(i * 2.3 - t * 5) * h * 0.06);
    }
    g.poly(pts, false).stroke({ width: 2.5 * s, color: HOLO_L });
    for (let i = 0; i < 5; i++) g.rect(10 * s, 26 * s + i * 8 * s, (30 + ((i * 37 + Math.floor(t * 4)) % 50)) * s, 3 * s).fill({ color: HOLO, alpha: 0.7 });
  } else if (kind === 1) {
    const cx = w / 2;
    const cy = h * 0.58;
    const R = Math.min(w, h) * 0.32;
    g.poly(bandPts(cx, cy, R * 0.82, R, 0, TAU, 28)).fill({ color: HOLO, alpha: 0.35 });
    const a = t * 1.4;
    g.poly(bandPts(cx, cy, R * 0.82, R, a, a + 2.2, 14)).fill(HOLO_L);
    g.poly(bandPts(cx, cy, R * 0.5, R * 0.62, -a * 1.6, -a * 1.6 + 3.6, 14)).fill({ color: HOLO, alpha: 0.9 });
  } else {
    for (let i = 0; i < 7; i++) {
      const bh = (0.25 + 0.6 * Math.abs(Math.sin(i * 1.7 + t * 2))) * (h - 34 * s);
      g.rect(12 * s + i * ((w - 24 * s) / 7), h - 8 * s - bh, (w - 24 * s) / 7 - 6 * s, bh).fill({ color: HOLO, alpha: 0.75 });
    }
  }
}

/** the workshop floor: polished dark, a perspective light grid */
function floor(g: Graphics, w: number, h: number, top: number, s: number) {
  vgrad(g, 0, top, w, h - top, [0x1a2232, 0x0a0e16], 8);
  const cx = w / 2;
  for (let i = -10; i <= 10; i++) g.poly(streak(cx + i * 60 * s, top, cx + i * 260 * s, h + 10, 0.8 * s, 2.2 * s)).fill({ color: HOLO, alpha: 0.18 });
  for (let j = 1; j < 7; j++) {
    const y = top + (h - top) * Math.pow(j / 7, 1.7);
    g.rect(0, y, w, 1.5 * s + j * 0.4 * s).fill({ color: HOLO, alpha: 0.12 });
  }
}

/** the robot arm (origin at its base): base, two segments, a claw; returns the joints to wave */
function robotArm(s = 1) {
  const k = new Container();
  const base = new Graphics().poly([-60 * s, 0, 60 * s, 0, 44 * s, -40 * s, -44 * s, -40 * s]).fill(STEEL).stroke({ width: 3 * s, color: 0x0a0e16 });
  const a1 = new Container();
  a1.position.set(0, -40 * s);
  a1.addChild(new Graphics().poly(streak(0, 0, 0, -190 * s, 18 * s, 14 * s)).fill(0x3a4458).poly(ngon(0, 0, 22 * s, 22 * s, 12)).fill(0x56627a));
  const a2 = new Container();
  a2.position.set(0, -190 * s);
  a2.addChild(new Graphics().poly(streak(0, 0, 0, -150 * s, 13 * s, 10 * s)).fill(0x3a4458).poly(ngon(0, 0, 17 * s, 17 * s, 12)).fill(0x56627a));
  const claw = new Graphics();
  claw.position.set(0, -150 * s);
  claw.poly([-4 * s, 0, -22 * s, -30 * s, -12 * s, -44 * s, -6 * s, -24 * s]).fill(0x8a96a8).poly([4 * s, 0, 22 * s, -30 * s, 12 * s, -44 * s, 6 * s, -24 * s]).fill(0x8a96a8);
  a2.addChild(claw);
  a1.addChild(a2);
  k.addChild(base, a1);
  a1.rotation = -0.5;
  a2.rotation = 1.2;
  return { k, a1, a2 };
}

/** an armor plate that flies in: `kind` 0 faceplate, 1 chest, 2 shoulder, 3 gauntlet (origin at its center) */
function plateG(kind: number, s = 1) {
  const g = new Graphics();
  const ink = { width: 4 * s, color: 0x2a0008, join: 'round' as const };
  if (kind === 0) {
    g.poly([-60 * s, -50 * s, 60 * s, -50 * s, 50 * s, 30 * s, 0, 56 * s, -50 * s, 30 * s]).fill(GOLD).stroke(ink);
    g.rect(-40 * s, -18 * s, 30 * s, 9 * s).fill(HOLO_L).rect(10 * s, -18 * s, 30 * s, 9 * s).fill(HOLO_L);
  } else if (kind === 1) {
    g.poly([-90 * s, -60 * s, 90 * s, -60 * s, 70 * s, 70 * s, -70 * s, 70 * s]).fill(RED).stroke(ink);
    g.poly([-60 * s, -40 * s, 60 * s, -40 * s, 40 * s, 40 * s, -40 * s, 40 * s]).stroke({ width: 3 * s, color: GOLD });
    g.poly(ngon(0, -6 * s, 22 * s, 22 * s, 14)).fill(0x1a2433).stroke({ width: 3 * s, color: GOLD });
  } else if (kind === 2) {
    g.poly(ngon(0, 0, 62 * s, 44 * s, 12)).fill(RED_L).stroke(ink);
    g.poly(streak(-50 * s, 10 * s, 50 * s, 10 * s, 6 * s, 6 * s)).fill(GOLD);
  } else {
    g.poly([-36 * s, -50 * s, 36 * s, -50 * s, 44 * s, 40 * s, -44 * s, 40 * s]).fill(RED).stroke(ink);
    g.poly(ngon(0, 50 * s, 34 * s, 22 * s, 10)).fill(GOLD).stroke(ink);
  }
  return g;
}

/** the HUD seen from inside the helmet: dark curved corners, a reticle (turning), three readouts (built hidden) */
function hud(c: SigCtx) {
  const k = new Container();
  const frame = new Graphics();
  // the helmet's inside edge: dark wedges in the corners and a thin cyan line
  const edge = (x: number, y: number, sx: number, sy: number) =>
    frame.poly([x, y, x + sx * 520, y, x + sx * 360, y + sy * 60, x + sx * 120, y + sy * 200, x + sx * 50, y + sy * 380, x, y + sy * 520]).fill({ color: 0x02040a, alpha: 0.85 });
  edge(0, 0, 1, 1);
  edge(W, 0, -1, 1);
  edge(0, H, 1, -1);
  edge(W, H, -1, -1);
  frame.rect(0, 0, W, H).fill({ color: HOLO, alpha: 0.07 });
  const ret = new Graphics();
  ret.position.set(W / 2, c.catY);
  for (const [r0, r1, a0, a1] of [
    [300, 312, 0.2, 1.3],
    [300, 312, 2.0, 3.0],
    [300, 312, 3.5, 4.5],
    [300, 312, 5.0, 5.9],
  ])
    ret.poly(bandPts(0, 0, r0, r1, a0, a1, 10)).fill({ color: HOLO_L, alpha: 0.85 });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    ret.poly(streak(Math.cos(a) * 322, Math.sin(a) * 322, Math.cos(a) * (i % 6 ? 334 : 352), Math.sin(a) * (i % 6 ? 334 : 352), 1.5, 1.5)).fill(HOLO_L);
  }
  const ret2 = new Graphics();
  ret2.position.set(W / 2, c.catY);
  ret2.poly(bandPts(0, 0, 360, 366, 0.6, 2.4, 14)).fill({ color: HOLO, alpha: 0.7 }).poly(bandPts(0, 0, 360, 366, 3.8, 5.6, 14)).fill({ color: HOLO, alpha: 0.7 });
  const rows: [string, number, string][] = [
    ['ENERGÍA', 1, '400 %'],
    ['EGO', 1, 'MÁX'],
    ['HUMILDAD', 0.02, '0 %'],
  ];
  const readouts = new Container();
  rows.forEach(([label, v, val], i) => {
    const y = 240 + i * 104;
    const x = i === 1 ? W - 470 : 90;
    const lab = txt(label, { fontFamily: F.ui, fontWeight: '700', fontSize: 32, fill: HOLO_L, letterSpacing: 3 });
    lab.position.set(x, y);
    const vt = txt(val, { fontFamily: F.ui, fontWeight: '700', fontSize: 40, fill: i === 2 ? 0xff6a6a : 0xffffff });
    vt.anchor.set(1, 0);
    vt.position.set(x + 380, y - 8);
    const bar = new Graphics().rect(x, y + 44, 380, 16).stroke({ width: 2, color: HOLO }).rect(x + 3, y + 47, Math.max(4, 374 * v), 10).fill(i === 2 ? 0xff6a6a : HOLO_L);
    readouts.addChild(lab, vt, bar);
  });
  k.addChild(frame, ret2, ret, readouts);
  return { k, ret, ret2 };
}

interface St {
  title: () => Prepped;
  cores: Graphics[];
  coreOn: { v: number };
  thrust: { v: number };
}
const S = stash<St>();
const FLOOR = 820;
/** measured on the integrated painting: chest circle, helmet, shoulders, gauntlets, paws */
const CHEST: [number, number] = [0.537, 0.567];
const PALM: [number, number] = [0.183, 0.57];
const SPOTS: [number, number, number][] = [
  [0.37, 0.2, 0],
  [0.55, 0.55, 1],
  [0.42, 0.46, 2],
  [0.72, 0.5, 2],
  [0.2, 0.56, 3],
  [0.86, 0.78, 3],
];
/** he stands on four paws: a thruster under each (front left, front right, back) */
const PAWS: [number, number][] = [
  [0.24, 0.93],
  [0.55, 0.91],
  [0.86, 0.9],
];

export const hierromichi: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO DE LA ARMADURA',
  open(c: SigCtx) {
    const k = new Container();
    const bg = vgrad(new Graphics(), 0, 0, W, FLOOR, BG, 12);
    // wall panels behind the cases
    for (let x = 0; x < W; x += 160) bg.rect(x, 120, 150, FLOOR - 120).fill({ color: 0x1c2638, alpha: 0.5 });
    bg.rect(0, 100, W, 8).fill({ color: HOLO, alpha: 0.4 });
    const fl = new Graphics();
    floor(fl, W, H, FLOOR, 1);
    const cases = new Container();
    const cores: Graphics[] = [];
    for (const x of [150, 400, 1520, 1770]) {
      const cs = caseWith(0.95);
      cs.k.position.set(x, FLOOR - 10);
      cases.addChild(cs.k);
      cores.push(cs.core);
    }
    const panels: { g: Graphics; w: number; h: number; kind: number }[] = [];
    const pk = new Container();
    for (const [x, y, w, h, kind] of [
      [560, 150, 300, 170, 0],
      [1110, 120, 230, 190, 1],
      [600, 560, 220, 140, 2],
      [1180, 590, 200, 130, 0],
    ]) {
      const g = new Graphics();
      g.position.set(x, y);
      g.skew.y = x < W / 2 ? 0.08 : -0.08;
      drawPanel(g, w, h, kind, 0, 1);
      pk.addChild(g);
      panels.push({ g, w, h, kind });
    }
    const arm = robotArm(1.1);
    arm.k.position.set(1660, FLOOR + 120);
    k.addChild(bg, fl, cases, pk, arm.k);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const coreOn = { v: 0.35 };
    const thrust = { v: 0 };
    const jets = new Graphics();
    jets.blendMode = 'add';
    c.behind.addChild(jets);
    const title = lazy(c, 1.0, () => prepTitle(c, '¡ARMADURA LISTA!', { fontFamily: F.poster, fontSize: 150, fill: GOLD, letterSpacing: 3, stroke: { color: 0x5a0010, width: 14, join: 'round' }, dropShadow: { color: 0x000000, distance: 8, angle: Math.PI / 3, blur: 0, alpha: 1 } }, { aside: '…y la número 41 ya viene.', glow: RED_L, maxW: 760 }));
    S.set(c, { title, cores, coreOn, thrust });
    const frame = (t: number) => {
      panels.forEach((p) => !p.g.destroyed && drawPanel(p.g, p.w, p.h, p.kind, t, 1));
      cores.forEach((g, i) => !g.destroyed && drawCore(g, 13 * 0.95 * 1.12, coreOn.v * (0.85 + 0.15 * Math.sin(t * 6 + i))));
      if (!arm.a1.destroyed) {
        arm.a1.rotation = -0.5 + Math.sin(t * 1.3) * 0.25;
        arm.a2.rotation = 1.2 + Math.sin(t * 1.9 + 1) * 0.3;
      }
      if (!jets.destroyed) {
        jets.clear();
        if (thrust.v > 0.01)
          for (const [fx, fy] of PAWS) {
            const [x, y] = onCat(c, fx, fy);
            const L = (120 + Math.random() * 40) * thrust.v;
            jets.poly(streak(x, y - 6, x, y + L, 26, 4)).fill({ color: HOLO, alpha: 0.55 });
            jets.poly(streak(x, y - 6, x, y + L * 0.6, 12, 2)).fill({ color: 0xffffff, alpha: 0.9 });
          }
      }
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    score(c, [
      [0.0, 'charge', 0.8],
      [0.05, 'tick', 2.2],
    ]);
    // the protocol starts (typed)
    const proto = typewriter(c, c.fg, 'PROTOCOLO DE ARMADURA · INICIANDO…', 70, 70, { fontFamily: F.ui, fontWeight: '700', fontSize: 30, fill: HOLO_L, letterSpacing: 3 }, 60, 'tick');
    fadeKill(proto, 1.3, 0.2);
    // the plates fly in from both sides and lock on: ¡CLANK! ¡CLANK!
    const clank1 = lazy(c, 0.2, () => prepWord(c, c.fg, 380, 330, '¡CLANK!', RED_L, 110, -0.1));
    const clank2 = lazy(c, 0.45, () => prepWord(c, c.fg, W - 380, 420, '¡CLANK!', GOLD, 110, 0.1));
    SPOTS.forEach(([fx, fy, kind], i) => {
      const [tx, ty] = onCat(c, fx, fy);
      const side = i % 2 ? 1 : -1;
      const p = plateG(kind, 0.9);
      const t0 = 0.25 + i * 0.13;
      const sx = side < 0 ? -200 : W + 200;
      const sy = ty - 200 + i * 60;
      p.position.set(sx, sy);
      p.rotation = side * 2;
      p.visible = false;
      c.fg.addChild(p);
      later(c, t0, () => {
        if (p.destroyed) return;
        // skipped: the armor is already on
        if (paid(c)) return destroyTree(p);
        p.visible = true;
        if (c.reduce) {
          p.position.set(tx, ty);
          p.rotation = 0;
        } else {
          gsap.to(p, { x: tx, y: ty, rotation: 0, duration: 0.22, ease: 'power3.in' });
          gsap.fromTo(p.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.22, ease: 'power3.in' });
        }
        later(c, 0.22, () => {
          sfx('hit', 1.2 + i * 0.08);
          c.shaker.add(0.08);
          sparks(c, c.fg, tx, ty, 9, GOLD, 150);
          pulse(c, c.fg, tx, ty, HOLO_L, 40, 3, 6, 0.35);
          gsap.to(p, { alpha: 0, duration: 0.25, delay: 0.1, onComplete: () => destroyTree(p) });
        });
      });
    });
    beat(c, 0.5, () => clank1().show(0.45));
    beat(c, 0.85, () => clank2().show(0.45));
    // inside the helmet: the HUD
    const hdGet = lazy(c, 0.7, () => {
      const h = hud(c);
      hidden(c.fg, h.k, 0, 0);
      return h;
    });
    beat(c, 1.2, () => {
      const hd = hdGet();
      if (hd.k.destroyed) return;
      sfx('zap', 1.8);
      hd.k.alpha = 1;
      if (!c.reduce) {
        gsap.from(hd.k, { alpha: 0, duration: 0.15 });
        gsap.to(hd.ret, { rotation: 1.4, duration: 0.9, ease: 'power2.out' });
        gsap.to(hd.ret2, { rotation: -1.1, duration: 0.9, ease: 'power2.out' });
        gsap.from(hd.ret.scale, { x: 1.4, y: 1.4, duration: 0.3, ease: 'power3.out' });
      }
      for (let i = 0; i < 3; i++) later(c, 0.1 + i * 0.12, () => sfx('tick', 1.8));
      fadeKill(hd.k, 0.85, 0.2);
    });
    // the chest circle hums on
    beat(c, 1.75, () => {
      const [cx, cy] = onCat(c, CHEST[0], CHEST[1]);
      const core = new Graphics();
      core.position.set(cx, cy);
      drawCore(core, 26, 1);
      core.blendMode = 'add';
      c.fg.addChild(core);
      sfx('charge', 1.4);
      pulse(c, c.fg, cx, cy, HOLO_L, 30, 6, 6, 0.5);
      if (!c.reduce) gsap.from(core.scale, { x: 0.1, y: 0.1, duration: 0.2, ease: 'back.out(3)' });
      fadeKill(core, 0.4, 0.3);
      floatWord(c, c.fg, cx + 200, cy - 40, 'vmmmm…', { fontFamily: F.comic, fontSize: 40, fill: HOLO_L, letterSpacing: 2, stroke: { color: C.ink, width: 6 } }, 30, 0.7);
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('charge', 1.1);
    sfx('bigboom', 0.9);
    later(c, 0.15, () => sfx('fanfare', 1.05));
    c.shaker.add(0.35);
    flashOf(c, 0xcfefff, 0.5, 0.35);
    if (st) {
      st.title().show(2.7);
      if (c.reduce) st.coreOn.v = 1;
      else gsap.to(st.coreOn, { v: 1, duration: 0.4, delay: 0.1 });
      st.thrust.v = c.reduce ? 0 : 1;
      if (!c.reduce) gsap.to(st.thrust, { v: 0.45, delay: 0.8, duration: 1.2 });
    }
    sparks(c, c.fg, W / 2, c.catY + 230, 22, HOLO_L, 360, 0.6, Math.PI / 2, 2.4);
    const [cx, cy] = onCat(c, CHEST[0], CHEST[1]);
    pulse(c, c.fg, cx, cy, HOLO_L, 60, 8, 10, 0.7);
    // and the palm's repulsor answers
    const [px, py] = onCat(c, PALM[0], PALM[1]);
    pulse(c, c.fg, px, py, 0xffffff, 40, 6, 8, 0.5);
    sparks(c, c.fg, px, py, 12, HOLO_L, 260, 0.5, Math.PI, 1.2);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const fy = h * 0.8;
    const bg = vgrad(new Graphics(), 0, 0, w, fy, BG, 10);
    bg.rect(0, h * 0.1, w, 6 * u).fill({ color: HOLO, alpha: 0.4 });
    const fl = new Graphics();
    floor(fl, w, h, fy, u * 1.3);
    k.addChild(bg, fl);
    // a row of cases across the wall (the middle one hides behind the painting)
    const cores: Graphics[] = [];
    const cs = u * 1.15;
    const step = 260 * cs;
    const n = Math.max(2, Math.floor(w / step));
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (w / n);
      const c2 = caseWith(cs);
      c2.k.position.set(x, fy);
      k.addChild(c2.k);
      cores.push(c2.core);
    }
    const panels: { g: Graphics; w: number; h: number; kind: number }[] = [];
    const np = Math.max(2, Math.round(w / (m * 0.7)));
    for (let i = 0; i < np; i++) {
      const g = new Graphics();
      const pw = 240 * u * 1.3;
      const ph = 150 * u * 1.3;
      g.position.set(((i + 0.5) / np) * w - pw / 2 + (i % 2 ? m * 0.25 : -m * 0.25), h * (0.16 + (i % 2) * 0.32));
      drawPanel(g, pw, ph, i % 3, i, u * 1.3);
      k.addChild(g);
      panels.push({ g, w: pw, h: ph, kind: i % 3 });
    }
    if (live)
      liveLoop(k, (t) => {
        panels.forEach((p) => drawPanel(p.g, p.w, p.h, p.kind, t, u * 1.3));
        cores.forEach((g, i) => drawCore(g, 13 * cs * 1.12, 0.6 + 0.4 * Math.sin(t * 3 + i)));
      });
    else cores.forEach((g) => drawCore(g, 13 * cs * 1.12, 0.8));
    return k;
  },
};

