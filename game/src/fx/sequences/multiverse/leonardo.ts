/**
 * Leonardo da Michi: the genius's universe (the Renaissance inventor, public domain — as a cat, in his own red-chalk
 * and sepia notebook manner). A workshop of warm plaster and beams, every wall pinned with sketches (gears, wing
 * studies, an aerial screw, a «Vitruvian» cat inside its circle and square), a window on the Tuscan hills and its
 * cypresses, a workbench with dividers, quill and scrolls — and hanging from the ceiling, a flying machine of wood and
 * canvas. Drawings assemble themselves in the air, gear after gear, and start turning; a drawn chain runs up to the
 * machine; its ropes snap — ¡TAC! — the wings beat, it takes off, and a word written in mirror script flips to read.
 * Payoff: the machine loops back over him, the sketches fly off the walls like birds: ¡FUNCIONA! — …al intento número 47.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, later, score } from './kit';
import {
  F,
  TAU,
  at,
  cardLoop,
  comic,
  flat,
  gearPts,
  glowDisc,
  hideDisc,
  ngon,
  park,
  partial,
  payline,
  pre,
  rnd,
  sketchGear,
  stash,
  streak,
  take,
  vgrad,
  wrap,
} from './kitJ';

const PLASTER = [0xf0dcb8, 0xe6cca0, 0xd8b888];
const SEPIA = 0x7a4a22;
const CHALK = 0xb0503a;
const WOOD = 0x5a3a1e;
const WOOD_L = 0x8b5a2b;
const CANVAS = 0xe2bf86;
const PARCH = 0xead6ae;

/** the flying machine (origin at its body; s = half-span), wings beating by `flap` (-1 down … 1 up) */
function machine(g: Graphics, s: number, flap: number, ink = WOOD) {
  g.clear();
  const lw = Math.max(1.5, s * 0.014);
  for (const side of [-1, 1]) {
    const ribs: [number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const a = -0.55 + i * 0.27 - flap * 0.45 * (1 - i * 0.12);
      const L = s * (1 - i * 0.14);
      ribs.push([side * Math.cos(a) * L, Math.sin(a) * L * 0.55]);
    }
    // canvas between the ribs, scalloped at the trailing edge
    const pts: number[] = [side * s * 0.06, -s * 0.02];
    ribs.forEach(([x, y], i) => {
      pts.push(x, y);
      if (i < ribs.length - 1) {
        const [nx, ny] = ribs[i + 1];
        pts.push((x + nx) * 0.42, (y + ny) * 0.42 + s * 0.02);
      }
    });
    pts.push(side * s * 0.08, s * 0.08);
    g.poly(pts).fill({ color: CANVAS, alpha: 0.95 }).stroke({ width: lw, color: ink, join: 'round' });
    for (const [x, y] of ribs) g.moveTo(side * s * 0.05, 0).lineTo(x, y);
    g.stroke({ width: lw * 2.6, color: WOOD, cap: 'round' });
    // a cross spar
    g.moveTo(ribs[0][0] * 0.55, ribs[0][1] * 0.55).lineTo(ribs[4][0] * 0.55, ribs[4][1] * 0.55).stroke({ width: lw, color: WOOD_L });
  }
  // the body: a boat-like frame, a pulley wheel
  g.poly([-s * 0.16, -s * 0.03, s * 0.16, -s * 0.03, s * 0.1, s * 0.07, -s * 0.1, s * 0.07]).fill(WOOD_L).stroke({ width: lw, color: ink });
  g.poly(ngon(0, -s * 0.07, s * 0.05, s * 0.05, 10)).fill(WOOD).stroke({ width: lw, color: ink });
  return g;
}

/** a pinned sketch sheet (origin at its center; w×h, rotated): parchment, a sepia drawing of `kind`, a red pin */
function sheet(g: Graphics, x: number, y: number, w: number, h: number, rot: number, kind: number, u: number) {
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  const T = (dx: number, dy: number): [number, number] => [x + dx * cs - dy * sn, y + dx * sn + dy * cs];
  g.poly([...T(-w / 2, -h / 2), ...T(w / 2, -h / 2), ...T(w / 2, h / 2), ...T(-w / 2, h / 2)]).fill(PARCH).stroke({ width: 2 * u, color: 0xb89a6a });
  const lw = Math.max(1.2, 2.4 * u);
  const m = Math.min(w, h);
  if (kind === 0) {
    const [cx, cy] = T(-w * 0.08, 0);
    g.poly(gearPts(cx, cy, m * 0.28, 12, rot), true).stroke({ width: lw, color: SEPIA });
    const [c2x, c2y] = T(w * 0.24, -h * 0.16);
    g.poly(gearPts(c2x, c2y, m * 0.16, 8, rot + 0.3), true).stroke({ width: lw, color: SEPIA });
  } else if (kind === 1) {
    // a wing study: ribs fanning from a shoulder
    const [sx, sy] = T(-w * 0.35, h * 0.25);
    for (let i = 0; i < 5; i++) {
      const a = -1.2 + i * 0.22 + rot;
      g.moveTo(sx, sy).lineTo(sx + Math.cos(a) * m * 0.75, sy + Math.sin(a) * m * 0.75);
    }
    g.stroke({ width: lw, color: SEPIA });
  } else if (kind === 2) {
    // the «Vitruvian» cat: circle, square, a cat with four legs spread
    const [cx, cy] = T(0, 0);
    g.poly(ngon(cx, cy, m * 0.36, m * 0.36, 24), true).stroke({ width: lw, color: CHALK });
    g.poly([...T(-m * 0.3, -m * 0.3), ...T(m * 0.3, -m * 0.3), ...T(m * 0.3, m * 0.3), ...T(-m * 0.3, m * 0.3)], true).stroke({ width: lw, color: CHALK });
    g.poly(ngon(cx, cy, m * 0.12, m * 0.08, 10, rot)).fill({ color: CHALK, alpha: 0.7 });
    const [hx, hy] = T(0, -m * 0.16);
    g.poly(ngon(hx, hy, m * 0.06, m * 0.06, 8)).fill({ color: CHALK, alpha: 0.7 });
    for (const [dx, dy] of [
      [-0.32, -0.22],
      [0.32, -0.22],
      [-0.3, 0.3],
      [0.3, 0.3],
    ]) {
      const [ex, ey] = T(m * dx, m * dy);
      g.moveTo(cx, cy).lineTo(ex, ey);
    }
    g.stroke({ width: lw * 1.3, color: CHALK, cap: 'round' });
  } else {
    // the aerial screw: a spiral sail over a post
    const [cx, cy] = T(0, h * 0.2);
    g.moveTo(cx, cy).lineTo(cx, cy - m * 0.5).stroke({ width: lw, color: SEPIA });
    const pts: number[] = [];
    for (let i = 0; i <= 20; i++) {
      const q = i / 20;
      pts.push(cx + Math.cos(q * TAU * 1.5) * m * 0.32 * (1 - q * 0.3), cy - m * 0.1 - q * m * 0.4 + Math.sin(q * TAU * 1.5) * m * 0.06);
    }
    g.poly(pts, false).stroke({ width: lw, color: SEPIA });
  }
  // mirror-script scribbles along the bottom
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = T(-w * 0.4, h * (0.3 + i * 0.06));
    const [bx, by] = T(w * (0.4 - i * 0.12), h * (0.3 + i * 0.06));
    g.moveTo(ax, ay).lineTo(bx, by);
  }
  g.stroke({ width: lw * 0.6, color: SEPIA, alpha: 0.6 });
  const [px, py] = T(0, -h * 0.44);
  g.poly(ngon(px, py, 5 * u, 5 * u, 8)).fill(0xc8102e);
}

/**
 * the workshop (w×h; `u` = h / 1080): plaster walls with sketches, ceiling beams, the window on the hills, sunbeams,
 * the workbench; the machine hanging at (mx, my) with its ropes (`ropes` is its own Graphics: they snap).
 */
function workshop(w: number, h: number, seed: number) {
  const u = h / 1080;
  const cx = w / 2;
  const k = new Container();
  const wall = vgrad(new Graphics(), 0, 0, w, h, PLASTER, 14);
  const r = rnd(seed);
  for (let i = 0; i < Math.round((w / h) * 16); i++) wall.poly(ngon(r() * w, r() * h, (60 + r() * 140) * u, (40 + r() * 80) * u, 10, r() * 3)).fill({ color: 0xc8a070, alpha: 0.12 });
  // the window on the Tuscan hills (arched), cypresses in the sun
  const win = new Graphics();
  const wx = cx + h * 0.62;
  const wy = h * 0.42;
  const ww = 150 * u;
  const wh = 260 * u;
  const arch: number[] = [wx - ww, wy + wh / 2, wx - ww, wy - wh / 2 + ww * 0.3];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    arch.push(wx + Math.cos(a) * ww, wy - wh / 2 + ww * 0.3 + Math.sin(a) * ww * 0.7);
  }
  arch.push(wx + ww, wy + wh / 2);
  win.poly(arch.map((v, i) => (i % 2 ? v + (v > wy ? 18 * u : -18 * u) : v + (v > wx ? 18 * u : -18 * u)))).fill(WOOD);
  win.poly(arch).fill(0xa8d0e8);
  win.poly([wx - ww, wy + wh * 0.1, wx - ww * 0.3, wy - wh * 0.05, wx + ww * 0.4, wy + wh * 0.05, wx + ww, wy - wh * 0.02, wx + ww, wy + wh / 2, wx - ww, wy + wh / 2]).fill(0x9ab86a);
  win.poly([wx - ww, wy + wh * 0.3, wx, wy + wh * 0.18, wx + ww, wy + wh * 0.28, wx + ww, wy + wh / 2, wx - ww, wy + wh / 2]).fill(0x7a9a52);
  for (const [dx, s] of [
    [-0.5, 1],
    [-0.2, 0.7],
    [0.55, 0.9],
  ])
    win.poly(ngon(wx + dx * ww, wy + wh * 0.12 - 50 * u * s, 12 * u * s, 60 * u * s, 10)).fill(0x2a4a2a);
  win.rect(wx - 4 * u, wy - wh / 2, 8 * u, wh).fill(WOOD).rect(wx - ww, wy, ww * 2, 8 * u).fill(WOOD);
  // sunbeams from the window across the room
  const beams = new Graphics();
  for (let i = 0; i < 3; i++) beams.poly([wx - ww + i * 60 * u, wy - wh * 0.3, wx - ww + i * 60 * u + 80 * u, wy - wh * 0.3, cx - h * 0.3 + i * 120 * u, h, cx - h * 0.6 + i * 120 * u, h]).fill({ color: 0xfff2c8, alpha: 0.12 });
  // the sketches pinned on every wall
  const sk = new Graphics();
  const spots: [number, number, number, number, number, number][] = [
    [-0.78, 0.36, 170, 130, -0.08, 0],
    [-0.5, 0.26, 150, 190, 0.06, 2],
    [-0.88, 0.62, 150, 120, 0.05, 1],
    [-0.42, 0.56, 120, 110, -0.1, 3],
    [0.42, 0.3, 160, 120, 0.07, 1],
    [0.4, 0.6, 130, 150, -0.05, 0],
    [0.9, 0.72, 140, 120, 0.08, 3],
    [-1.15, 0.4, 150, 150, 0.04, 2],
    [1.12, 0.36, 150, 120, -0.06, 0],
    [-1.3, 0.7, 140, 110, -0.05, 1],
    [1.3, 0.62, 140, 160, 0.05, 2],
  ];
  for (const [dx, fy, sw, shh, rot, kind] of spots) {
    const x = cx + dx * h;
    if (x < -sw * u || x > w + sw * u) continue;
    sheet(sk, x, fy * h, sw * u, shh * u, rot, kind, u);
  }
  // ceiling beams and rafters
  const beam = new Graphics();
  beam.rect(-20, 0, w + 40, 60 * u).fill(WOOD);
  beam.rect(-20, 60 * u, w + 40, 10 * u).fill({ color: 0x000000, alpha: 0.25 });
  for (let x = -40 * u; x < w + 40 * u; x += 220 * u) beam.poly([x, 0, x + 40 * u, 0, x + 60 * u, 70 * u, x + 20 * u, 70 * u]).fill(0x4a2e16);
  // the floor and the workbench (dividers, an inkpot with its quill, scrolls)
  const floor = new Graphics();
  floor.rect(0, h * 0.84, w, h * 0.17).fill(0x8a6a44);
  for (let i = 0; i < 8; i++) floor.rect(0, h * (0.86 + i * 0.02), w, 2 * u).fill({ color: 0x5a3a1e, alpha: 0.3 });
  const bx = cx - h * 0.72;
  const by = h * 0.82;
  floor.rect(bx - 200 * u, by - 20 * u, 400 * u, 24 * u).fill(WOOD_L).rect(bx - 180 * u, by, 20 * u, h * 0.16).fill(WOOD).rect(bx + 160 * u, by, 20 * u, h * 0.16).fill(WOOD);
  floor.poly(streak(bx - 120 * u, by - 20 * u, bx - 80 * u, by - 110 * u, 3 * u, 1.5 * u)).fill(0x6a6a6a);
  floor.poly(streak(bx - 40 * u, by - 20 * u, bx - 80 * u, by - 110 * u, 3 * u, 1.5 * u)).fill(0x6a6a6a);
  floor.poly(ngon(bx + 40 * u, by - 34 * u, 22 * u, 16 * u, 10)).fill(0x2a1a10);
  floor.poly(streak(bx + 40 * u, by - 40 * u, bx + 90 * u, by - 130 * u, 4 * u, 1 * u)).fill(0xf6f0e0);
  floor.poly(ngon(bx + 130 * u, by - 34 * u, 50 * u, 14 * u, 12)).fill(PARCH).poly(ngon(bx + 140 * u, by - 56 * u, 40 * u, 12 * u, 12)).fill(0xe0c898);
  // the machine hanging from the ceiling
  const mx = cx;
  const my = h * 0.235;
  const ropes = new Graphics();
  ropes.moveTo(mx - 160 * u, 60 * u).lineTo(mx - 120 * u, my).moveTo(mx + 160 * u, 60 * u).lineTo(mx + 120 * u, my).moveTo(mx, 60 * u).lineTo(mx, my - 30 * u).stroke({ width: 3 * u, color: 0x6a4a2a });
  const mach = new Graphics();
  machine(mach, 420 * u, 0);
  const mk = new Container();
  mk.addChild(mach);
  mk.position.set(mx, my);
  k.addChild(wall, win, beams, sk, beam, floor, ropes, mk);
  return { k, mach, mk, ropes, u, mx, my };
}

interface St {
  gears: Graphics | null;
  mk: Container;
  mach: Graphics;
}
const S = stash<St>();

/** the sketched gears that assemble in the air around him: [x, y, r, teeth] (design box) */
const GEARS: [number, number, number, number][] = [
  [470, 360, 92, 12],
  [610, 505, 58, 8],
  [480, 660, 78, 10],
  [1450, 360, 84, 11],
  [1312, 520, 56, 8],
  [1450, 690, 92, 12],
];

export const leonardo: Signature = {
  dark: false,
  frame: 0x8b5a2b,
  tag: 'UNIVERSO DEL GENIO',
  open(c: SigCtx) {
    const ws = workshop(W, H, 111);
    c.back.addChild(ws.k);
    hideDisc(c, 0.2);
    if (!c.short && !c.reduce) {
      ws.k.alpha = 0;
      gsap.to(ws.k, { alpha: 1, duration: 0.3 });
    }
    // a warm light behind him (sunlight off the plaster)
    const halo = glowDisc(380, 0xfff2c8, 0.35, 8, 28);
    halo.position.set(W / 2, c.catY);
    c.behind.addChild(halo);
    park(c, 'main', comic('¡FUNCIONA!', 0xf2b84a, 140));
    const st: St = { gears: null, mk: ws.mk, mach: ws.mach };
    S.set(c, st);
    // the machine sways on its ropes
    const sway = { on: true };
    if (!c.reduce) every(c, 30, (t) => sway.on && !ws.mk.destroyed && (ws.mk.rotation = Math.sin(t * 1.3) * 0.03));
    if (c.short) return;

    // the gears draw themselves in the air, one after another, then turn
    const gears = new Graphics();
    c.fg.addChildAt(gears, 0);
    st.gears = gears;
    const prog = GEARS.map(() => ({ u: c.reduce ? 1 : 0 }));
    const chain = { u: c.reduce ? 1 : 0 };
    let spin = 0;
    const drawGears = () => {
      if (gears.destroyed) return;
      gears.clear();
      GEARS.forEach(([x, y, r, n], i) => {
        const p = prog[i].u;
        if (p <= 0) return;
        const rot = (i % 2 ? -1 : 1) * spin * (60 / r);
        if (p < 1) gears.poly(partial(gearPts(x, y, r, n, rot), p), false).stroke({ width: 6, color: CHALK, join: 'round' });
        else {
          gears.poly(gearPts(x, y, r, n, rot)).fill({ color: 0xfff2d8, alpha: 0.85 });
          sketchGear(gears, x, y, r, n, rot, CHALK, 5);
        }
      });
      // construction lines: the drawn chain up to the machine
      if (chain.u > 0)
        for (const [x0, y0] of [
          [470, 360],
          [1450, 360],
        ]) {
          const line = [x0, y0 - 90, x0 + (W / 2 - x0) * 0.5, 200, W / 2 + (x0 < W / 2 ? -110 : 110), 215];
          gears.poly(partial(line, chain.u), false).stroke({ width: 3, color: CHALK, alpha: 0.85 });
        }
    };
    drawGears();
    score(c, [
      [0.15, 'pencil', 1.1],
      [0.32, 'pencil', 1.25],
      [0.49, 'pencil', 1.0],
      [0.66, 'pencil', 1.3],
      [0.83, 'pencil', 1.15],
      [1.0, 'pencil', 1.4],
      [1.15, 'tick', 0.9],
      [1.3, 'hit', 1.4],
      [1.38, 'whoosh', 0.8],
      [1.6, 'whoosh', 0.9],
      [1.82, 'whoosh', 1.0],
    ]);
    if (!c.reduce) {
      GEARS.forEach((_, i) => gsap.to(prog[i], { u: 1, duration: 0.22, delay: 0.15 + i * 0.17, ease: 'power1.inOut' }));
      gsap.to(chain, { u: 1, duration: 0.25, delay: 1.05 });
      every(c, 60, (t) => {
        spin = Math.max(0, t - 0.4) * 1.6;
        drawGears();
      });
    }
    // ¡TAC! the ropes snap; the wings beat; it takes off over the room
    const tac = comic('¡TAC!', 0xf2b84a, 90);
    const popTac = pre(c, tac, W / 2 - 360, 150, -0.1);
    const flapW = comic('¡FLAP! ¡FLAP!', 0xfff2c8, 84);
    const popFlap = pre(c, flapW, W / 2 + 430, 300, 0.08);
    // the mirror-script word: written backwards, it flips to read
    const vuela = flat('¡VUELA!', { fontFamily: F.brush, fontSize: 92, fill: CHALK, stroke: { color: 0xfff2c8, width: 8, join: 'round' } });
    vuela.position.set(W / 2 + 470, 800);
    vuela.rotation = -0.05;
    vuela.alpha = 0.001;
    c.fg.addChild(vuela);
    at(c, 1.3, () => {
      popTac(0.5);
      c.shaker.add(0.2);
      if (!ws.ropes.destroyed) gsap.to(ws.ropes, { alpha: 0, duration: 0.15 });
      sway.on = false;
      if (c.reduce) {
        machine(ws.mach, 420 * ws.u, 0.6);
        return;
      }
      const p = { t: 0 };
      gsap.to(p, {
        t: 1,
        duration: 0.9,
        ease: 'power1.in',
        onUpdate: () => {
          if (ws.mk.destroyed) return;
          machine(ws.mach, 420 * ws.u, Math.sin(p.t * TAU * 3.5));
          ws.mk.position.set(ws.mx + p.t * p.t * 1300, ws.my - Math.sin(p.t * Math.PI) * 60 - p.t * 260);
          ws.mk.rotation = -0.1 - p.t * 0.25;
        },
      });
    });
    at(c, 1.42, () => popFlap(0.6));
    at(c, 1.55, () => {
      if (vuela.destroyed) return;
      vuela.alpha = 1;
      sfx('nib', 1.3);
      if (c.reduce) return;
      vuela.scale.x = -1;
      gsap.to(vuela.scale, { x: 1, duration: 0.25, delay: 0.3, ease: 'back.out(2)' });
      gsap.to(vuela, { alpha: 0, delay: 0.95, duration: 0.25, onComplete: () => destroyTree(vuela) });
    });
    later(c, 2.6, () => !vuela.destroyed && destroyTree(vuela));
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    if (st?.gears && !st.gears.destroyed) gsap.to(st.gears, { alpha: 0, duration: 0.4, onComplete: () => destroyTree(st.gears!) });
    sfx('fanfare', 1.1);
    sfx('whoosh', 0.9);
    later(c, 0.2, () => sfx('gem', 1.3));
    c.shaker.add(0.2);
    // the machine loops back over him (a small copy in the box, flying an arc)
    const fly = new Graphics();
    machine(fly, 230, 0);
    c.fg.addChild(fly);
    if (st && !st.mk.destroyed) st.mk.visible = false;
    if (c.reduce) {
      fly.position.set(W / 2 + 420, 170);
      fly.rotation = -0.08;
    } else {
      const p = { t: 0 };
      gsap.to(p, {
        t: 1,
        duration: 1.6,
        ease: 'sine.inOut',
        onUpdate: () => {
          if (fly.destroyed) return;
          const a = Math.PI + p.t * Math.PI;
          fly.position.set(W / 2 + Math.cos(a) * 620, 260 + Math.sin(a) * 160);
          fly.rotation = Math.cos(a) * 0.2;
          machine(fly, 230, Math.sin(p.t * TAU * 5));
        },
      });
      gsap.to(fly, { alpha: 0, delay: 1.8, duration: 0.4, onComplete: () => destroyTree(fly) });
    }
    // the sketches fly off the walls like birds
    burst(
      c,
      c.fg,
      (i) => {
        const g = new Graphics();
        sheet(g, 0, 0, 70, 54, 0, i % 4, 0.5);
        return g;
      },
      16,
      W / 2,
      c.catY - 60,
      900,
      1.5,
    );
    const main = take(c, 'main', () => comic('¡FUNCIONA!', 0xf2b84a, 140));
    payline(c, main, '…al intento número 47.', { maxW: 640, dur: 2.6, asideStyle: { fill: 0xfff2c8 } });
  },
  card(w: number, h: number, live: boolean) {
    // a notebook page: parchment, the wing study, gears, the «Vitruvian» cat, mirror script
    const k = new Container();
    const u = h / 1080;
    const g = vgrad(new Graphics(), 0, 0, w, h, [0xf0dcb4, 0xe6cc9c, 0xd8b884], 10);
    const r = rnd(7);
    for (let i = 0; i < Math.round((w / h) * 10); i++) g.poly(ngon(r() * w, r() * h, (80 + r() * 160) * u, (50 + r() * 90) * u, 10, r() * 3)).fill({ color: 0xb88a50, alpha: 0.1 });
    for (let y = h * 0.82; y < h * 0.95; y += 26 * u)
      for (let x = 40 * u; x < w - 40 * u; x += 220 * u) g.moveTo(x, y).lineTo(x + (120 + r() * 80) * u, y + r() * 4 * u);
    g.stroke({ width: 2.4 * u, color: SEPIA, alpha: 0.45 });
    const cx = w / 2;
    const vit = new Graphics();
    sheet(vit, cx - h * 0.8, h * 0.45, 300 * u, 300 * u, -0.04, 2, u);
    sheet(vit, cx + h * 0.82, h * 0.42, 280 * u, 230 * u, 0.05, 3, u);
    const mach = new Graphics();
    mach.position.set(cx, h * 0.3);
    machine(mach, Math.min(w * 0.42, 520 * u), 0, SEPIA);
    const gears = new Graphics();
    const G: [number, number, number, number][] = [
      [cx - h * 0.3, h * 0.66, 90 * u, 12],
      [cx - h * 0.3 + 118 * u, h * 0.66 + 52 * u, 50 * u, 8],
      [cx + h * 0.32, h * 0.7, 76 * u, 10],
    ];
    const drawG = (t: number) => {
      gears.clear();
      G.forEach(([x, y, rr, n], i) => sketchGear(gears, x, y, rr, n, (i % 2 ? -1 : 1) * t * (40 * u / rr), SEPIA, 3.5 * u));
    };
    drawG(0);
    k.addChild(g, vit, gears, mach);
    if (live)
      cardLoop(k, 30, (t) => {
        drawG(t);
        machine(mach, Math.min(w * 0.42, 520 * u), Math.sin(t * 2.2) * 0.35, SEPIA);
      });
    return k;
  },
};


