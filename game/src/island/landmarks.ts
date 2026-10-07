/**
 * M2 island landmarks (code-drawn, poster flat colors + ink): Banco del Reino, the expedition pier of
 * the Puerto de las Mareas and the secret landmarks hidden in each expansion. Origin = center of the
 * anchor tile (isoToScreen(gx, gy)) like buildingArt; all footprints are 2×2.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { glowTexture } from '../art/textures';
import { isoBoxAt, P, centerOf, footprint } from './buildingArt';
import { DROP, shade } from './terrain';

const INK = { width: 3, color: C.ink, join: 'round' as const, cap: 'round' as const };
const THIN = { width: 2, color: C.ink, join: 'round' as const, cap: 'round' as const };

function glow(c: Container, x: number, y: number, tint: number, alpha = 0.5, sx = 0.6, sy = sx) {
  const g = new Sprite(glowTexture());
  g.anchor.set(0.5);
  g.tint = tint;
  g.alpha = alpha;
  g.scale.set(sx, sy);
  g.position.set(x, y);
  c.addChild(g);
  return g;
}
function shadowUnder(g: Graphics, fw = 2, fh = 2) {
  footprint(g, fw, fh, C.ink, 0.12, 0.02, false);
}

// =====================================================================================  BANCO DEL REINO
/** neoclassical mini bank: stone steps, columns, pediment with a paw coin, round vault door */
export function bankArt(): { c: Container; top: number; slot: { x: number; y: number }; door: { x: number; y: number } } {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  shadowUnder(g);
  isoBoxAt(g, 0, 0, 2, 2, 8, 0xc9bfae, 0.04);
  isoBoxAt(g, 0.12, 0.12, 1.76, 1.76, 8, 0xdcd3c3, 0.04, 8);
  const body = isoBoxAt(g, 0.32, 0.32, 1.36, 1.36, 58, 0xf2ead9, 0.04, 16);
  // columns on the two visible faces
  const colAt = (a: { x: number; y: number }, b: { x: number; y: number }, f: number) => {
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    g.rect(x - 5, y - 58, 10, 58).fill(0xffffff).stroke(THIN);
    g.rect(x - 8, y - 62, 16, 6).fill(0xe8dfcc).stroke(THIN);
    g.moveTo(x - 1.5, y - 54).lineTo(x - 1.5, y - 4).stroke({ width: 1, color: C.ink, alpha: 0.35 });
  };
  for (const f of [0.12, 0.88]) colAt(body.left, body.bottom, f);
  for (const f of [0.12, 0.5, 0.88]) colAt(body.bottom, body.right, f);
  // vault door on the left face
  const dl = { x: (body.left.x + body.bottom.x) / 2, y: (body.left.y + body.bottom.y) / 2 - 24 };
  g.ellipse(dl.x, dl.y, 17, 21).fill(0x9aa3a8).stroke(INK);
  g.ellipse(dl.x, dl.y, 11, 14).fill(0xb9c2c7).stroke(THIN);
  g.circle(dl.x, dl.y, 4).fill(C.gold).stroke({ width: 1.5, color: C.ink });
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI;
    g.moveTo(dl.x + Math.cos(a) * 10, dl.y + Math.sin(a) * 12).lineTo(dl.x - Math.cos(a) * 10, dl.y - Math.sin(a) * 12).stroke({ width: 2, color: C.ink });
  }
  // roof slab + pediment (triangle over the right face)
  const roof = isoBoxAt(g, 0.22, 0.22, 1.56, 1.56, 10, 0xe8dfcc, 0.02, 74);
  const pa = roof.tB;
  const pb = roof.tR;
  const apex = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 - 34 };
  g.poly([pa.x, pa.y, pb.x, pb.y, apex.x, apex.y]).fill(0xf2ead9).stroke(INK);
  g.poly([pa.x + 10, pa.y - 3, pb.x - 10, pb.y + 3 - 6, apex.x, apex.y + 10]).stroke({ width: 1.5, color: C.ink, alpha: 0.5 });
  // coin medallion in the pediment
  const mx = apex.x;
  const my = apex.y + 18;
  g.circle(mx, my, 10).fill(C.yellow).stroke(THIN);
  g.ellipse(mx, my + 2, 3.5, 3).fill(0xb8862a);
  for (const [dx, dy] of [
    [-4, -2],
    [-1.5, -5],
    [1.5, -5],
    [4, -2],
  ])
    g.circle(mx + dx, my + dy, 1.4).fill(0xb8862a);
  // BANCO lettering band on the left frieze
  const fr = { x: (roof.left.x + roof.bottom.x) / 2, y: (roof.left.y + roof.bottom.y) / 2 + 2 };
  const word = txt('BANCO', { fontFamily: F.poster, fontSize: 16, fill: C.ink, letterSpacing: 2 });
  word.anchor.set(0.5);
  word.position.set(fr.x, fr.y - 4);
  word.skew.set(0, 0.46);
  c.addChild(word);
  // money sacks + coin stack at the steps
  const sp = P(1.55, 1.25);
  const sk = new Graphics();
  for (const [dx, dy, s] of [
    [0, 0, 1],
    [16, 6, 0.8],
  ] as const) {
    sk.moveTo(sp.x + dx - 11 * s, sp.y + dy).bezierCurveTo(sp.x + dx - 14 * s, sp.y + dy - 18 * s, sp.x + dx + 14 * s, sp.y + dy - 18 * s, sp.x + dx + 11 * s, sp.y + dy).closePath().fill(0xc9a24a).stroke(THIN);
    sk.rect(sp.x + dx - 4 * s, sp.y + dy - 22 * s, 8 * s, 5 * s).fill(0xc9a24a).stroke({ width: 1.5, color: C.ink });
    const t = txt('$', { fontFamily: F.poster, fontSize: 12 * s, fill: C.ink });
    t.anchor.set(0.5);
    t.position.set(sp.x + dx, sp.y + dy - 8 * s);
    c.addChild(t);
  }
  c.addChildAt(sk, 1);
  return { c, top: apex.y - 20, slot: { x: apex.x, y: apex.y - 6 }, door: dl };
}

/** fenced empty lot + "BANCO · REINO 15" sign */
export function bankLotArt(kl: number): Container {
  const c = new Container();
  const g = new Graphics();
  footprint(g, 2, 2, 0xe9dfcc, 0.6, 0.06, false);
  const pts = [P(-0.42, -0.42), P(1.58, -0.42), P(1.58, 1.58), P(-0.42, 1.58)];
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    for (let k = 0; k <= 4; k++) {
      const x = a.x + ((b.x - a.x) * k) / 4;
      const y = a.y + ((b.y - a.y) * k) / 4;
      g.rect(x - 2, y - 16, 4, 16).fill(0xd9b07a).stroke({ width: 1.5, color: C.ink });
    }
    g.moveTo(a.x, a.y - 10).lineTo(b.x, b.y - 10).stroke({ width: 2, color: C.ink, alpha: 0.6 });
  }
  c.addChild(g);
  const ctr = centerOf(2, 2);
  const sign = new Container();
  const s = new Graphics();
  s.rect(-3, -56, 6, 56).fill(0x8a5a2e).stroke(THIN);
  s.rect(-62 + 4, -100 + 4, 124, 48).fill(C.ink);
  s.rect(-62, -100, 124, 48).fill(0xdfe9d2).stroke(INK);
  sign.addChild(s);
  const t1 = txt('BANCO', { fontFamily: F.poster, fontSize: 22, fill: 0x1e4a3a });
  t1.anchor.set(0.5);
  t1.position.set(0, -86);
  const t2 = txt(`REINO ${kl}`, { fontFamily: F.bebas, fontSize: 16, fill: C.ink, letterSpacing: 2 });
  t2.anchor.set(0.5);
  t2.position.set(0, -64);
  sign.addChild(t1, t2);
  sign.position.set(ctr.x, ctr.y + 6);
  c.addChild(sign);
  return c;
}

// =====================================================================================  EXPEDITION PIER
/** pale ghost-port office with lanterns + a long pier into the fog; the boat is animated by the view */
export function pierArt(facing: 'x' | 'y'): { c: Container; boat: Container; boatHome: { x: number; y: number }; top: number; lamps: { x: number; y: number }[] } {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  shadowUnder(g);
  isoBoxAt(g, 0, 0, 2, 2, 6, 0xb9b2bd, 0.04);
  for (let k = 1; k < 6; k++) {
    const a = P(-0.46 + k / 3, -0.46);
    const b = P(-0.46 + k / 3, 1.46);
    g.moveTo(a.x, a.y - 6).lineTo(b.x, b.y - 6).stroke({ width: 1.2, color: 0x6a6170, alpha: 0.5 });
  }
  // pier
  const pier = new Graphics();
  const len = 3.2;
  const w = 0.8;
  const q = (dx: number, dy: number) => (facing === 'x' ? P(1.5 + dx, 0.6 + dy) : P(0.6 + dy, 1.5 + dx));
  const A = q(0, 0);
  const B = q(len, 0);
  const Cc = q(len, w);
  const D = q(0, w);
  for (let k = 1; k <= 4; k++) for (const s of [0, w]) {
    const p = q((len * k) / 4, s);
    pier.rect(p.x - 3, p.y - 4, 6, DROP + 4).fill(0x4e4752).stroke(THIN);
  }
  pier.poly([A.x, A.y - 4, B.x, B.y - 4, Cc.x, Cc.y - 4, D.x, D.y - 4]).fill(0x9a8f9e).stroke(INK);
  for (let k = 1; k < 10; k++) {
    const f = k / 10;
    pier.moveTo(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f - 4).lineTo(D.x + (Cc.x - D.x) * f, D.y + (Cc.y - D.y) * f - 4).stroke({ width: 1.2, color: 0x4e4752 });
  }
  c.addChildAt(pier, 0);
  // harbour office
  const hut = new Graphics();
  const box = isoBoxAt(hut, 0.1, 0.1, 1.1, 1.0, 50, 0xdcd6e0, 0.06, 6);
  const mid = { x: (box.tT.x + box.tR.x) / 2, y: (box.tT.y + box.tR.y) / 2 - 30 };
  const mid2 = { x: (box.tL.x + box.tB.x) / 2, y: (box.tL.y + box.tB.y) / 2 - 30 };
  const hx = (box.tB.x - box.tL.x) * 0.5;
  const hy = (box.tB.y - box.tL.y) * 0.5;
  const rx = (box.tR.x - box.tT.x) * 0.5;
  const ry = (box.tR.y - box.tT.y) * 0.5;
  hut.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, mid2.x + hx, mid2.y + hy, mid2.x - hx, mid2.y - hy]).fill(0x4e4752).stroke(INK);
  hut.poly([box.tB.x, box.tB.y, box.tR.x, box.tR.y, mid.x + rx, mid.y + ry, mid2.x + hx, mid2.y + hy]).fill(shade(0x4e4752, 0.75)).stroke(INK);
  const dx = (box.left.x + box.bottom.x) / 2;
  const dy = (box.left.y + box.bottom.y) / 2;
  hut.rect(dx - 10, dy - 30, 20, 28).fill(0x221d24).stroke(THIN);
  const wx = (box.bottom.x + box.right.x) / 2;
  const wy = (box.bottom.y + box.right.y) / 2 - 28;
  hut.circle(wx, wy, 8).fill(C.yellow).stroke(THIN);
  hut.moveTo(wx - 8, wy).lineTo(wx + 8, wy).moveTo(wx, wy - 8).lineTo(wx, wy + 8).stroke({ width: 1.5, color: C.ink });
  c.addChild(hut);
  // lanterns along the pier
  const lamps: { x: number; y: number }[] = [];
  for (const f of [0.35, 0.95]) {
    const p = q(len * f, -0.05);
    const lp = new Graphics();
    lp.rect(p.x - 2, p.y - 44, 4, 40).fill(C.ink);
    lp.rect(p.x - 7, p.y - 58, 14, 14).fill(C.yellow).stroke(THIN);
    lp.poly([p.x - 9, p.y - 58, p.x, p.y - 66, p.x + 9, p.y - 58]).fill(C.ink);
    c.addChild(lp);
    lamps.push({ x: p.x, y: p.y - 51 });
  }
  for (const l of lamps) glow(c, l.x, l.y, C.yellow, 0.45, 0.5);
  // expedition boat (moored at the pier end, at sea level)
  const boat = new Container();
  const bg = new Graphics();
  bg.ellipse(0, 6, 46, 14).fill({ color: 0x1c3a51, alpha: 0.3 });
  bg.poly([-40, -6, 40, -6, 30, 12, -30, 12]).fill(0x6a4f6e).stroke(INK);
  bg.rect(-40, -10, 80, 6).fill(0x9a8f9e).stroke(THIN);
  bg.moveTo(0, -8).lineTo(0, -86).stroke({ width: 4, color: C.ink });
  bg.moveTo(2, -82).quadraticCurveTo(36, -60, 34, -18).lineTo(2, -16).closePath().fill(0xeae6ee).stroke(INK);
  bg.circle(16, -44, 5).fill(C.ink);
  for (const [ox, oy] of [
    [-5, -5],
    [-1.5, -8.5],
    [2, -8.5],
    [5.5, -5],
  ])
    bg.circle(16 + ox * 0.9, -44 + oy * 0.9, 2).fill(C.ink);
  bg.poly([0, -86, 18, -82, 0, -78]).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
  boat.addChild(bg);
  const bh = q(len + 0.6, w / 2);
  const boatHome = { x: bh.x, y: bh.y + DROP };
  boat.position.set(boatHome.x, boatHome.y);
  if (facing === 'x') boat.scale.x = -1;
  return { c, boat, boatHome, top: box.tT.y - 60, lamps };
}

// =====================================================================================  SECRETS
export interface SecretArt {
  c: Container;
  /** local point where hints / bubbles go */
  top: { x: number; y: number };
  /** sub-part that reacts to taps (shake) */
  hit: Container;
}

/** 1 · Santuario Sellado: overgrown stone shrine, mossy dome, big round vine-sealed door, rune ring */
export function shrineArt(state: 'sealed' | 'open' | 'done'): SecretArt {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  shadowUnder(g);
  const stone = 0x9a9688;
  const moss = 0x5f9c55;
  const rune = state === 'open' ? C.mint : state === 'done' ? 0xd4f27a : 0x55604a;
  isoBoxAt(g, 0.02, 0.02, 1.96, 1.96, 8, 0x7d776a, 0.03);
  isoBoxAt(g, 0.15, 0.15, 1.7, 1.7, 8, 0x8d8676, 0.03, 8);
  const body = isoBoxAt(g, 0.32, 0.32, 1.36, 1.36, 44, stone, 0.03, 16);
  // stone courses
  for (let r = 1; r < 4; r++) {
    g.moveTo(body.left.x, body.left.y - r * 11).lineTo(body.bottom.x, body.bottom.y - r * 11).lineTo(body.right.x, body.right.y - r * 11).stroke({ width: 1.2, color: C.ink, alpha: 0.3 });
  }
  // mossy dome
  const top = { x: (body.tL.x + body.tR.x) / 2, y: (body.tT.y + body.tB.y) / 2 };
  const rx = (body.tR.x - body.tL.x) / 2 + 6;
  g.ellipse(top.x, top.y, rx, rx * 0.5).fill(shade(moss, 0.8)).stroke(INK);
  g.moveTo(top.x - rx, top.y).bezierCurveTo(top.x - rx, top.y - rx * 1.25, top.x + rx, top.y - rx * 1.25, top.x + rx, top.y).closePath().fill(moss).stroke(INK);
  g.moveTo(top.x - rx * 0.55, top.y - rx * 0.55).quadraticCurveTo(top.x - rx * 0.2, top.y - rx * 0.85, top.x + rx * 0.1, top.y - rx * 0.9).stroke({ width: 3, color: 0xd4f27a, alpha: 0.6, cap: 'round' });
  // moss drips over the walls
  for (const [f, len] of [
    [0.15, 16],
    [0.42, 24],
    [0.7, 12],
  ] as const) {
    const x = body.tL.x + (body.tB.x - body.tL.x) * f;
    const y = body.tL.y + (body.tB.y - body.tL.y) * f;
    g.moveTo(x - 6, y - 2).quadraticCurveTo(x, y + len, x + 6, y - 2).fill(moss).stroke({ width: 1.5, color: C.ink });
  }
  // finial: a stone cat ear pair
  g.poly([top.x - 12, top.y - rx * 0.9, top.x - 8, top.y - rx * 1.25, top.x - 2, top.y - rx * 0.95]).fill(stone).stroke(THIN);
  g.poly([top.x + 2, top.y - rx * 0.95, top.x + 8, top.y - rx * 1.25, top.x + 12, top.y - rx * 0.9]).fill(stone).stroke(THIN);
  // big round door on the camera-left face
  const hit = new Container();
  const dg = new Graphics();
  const d = { x: (body.left.x + body.bottom.x) / 2, y: (body.left.y + body.bottom.y) / 2 - 22 };
  dg.ellipse(d.x, d.y, 24, 27).fill(state === 'done' ? 0x1f160f : 0x6b6458).stroke(INK);
  // rune ring
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    dg.circle(d.x + Math.cos(a) * 30, d.y + Math.sin(a) * 33, 2.6).fill(rune).stroke({ width: 1, color: C.ink });
  }
  if (state !== 'done') {
    dg.ellipse(d.x, d.y, 15, 17).stroke({ width: 2.5, color: shade(stone, 0.75) });
    // carved paw
    dg.ellipse(d.x, d.y + 4, 6, 5).fill(rune);
    for (const [ox, oy] of [
      [-7, -4],
      [-2.5, -8],
      [2.5, -8],
      [7, -4],
    ])
      dg.circle(d.x + ox, d.y + oy, 2.2).fill(rune);
    if (state === 'sealed') {
      dg.moveTo(d.x - 26, d.y - 18).bezierCurveTo(d.x - 6, d.y - 4, d.x + 6, d.y + 8, d.x + 26, d.y + 20).stroke({ width: 5, color: 0x3f8a3f, cap: 'round' });
      dg.moveTo(d.x + 24, d.y - 20).bezierCurveTo(d.x + 4, d.y - 4, d.x - 8, d.y + 10, d.x - 24, d.y + 18).stroke({ width: 5, color: 0x2f6f3f, cap: 'round' });
      for (const [x, y] of [
        [d.x - 13, d.y - 10],
        [d.x + 13, d.y + 13],
        [d.x + 12, d.y - 12],
        [d.x - 12, d.y + 12],
      ])
        dg.ellipse(x, y, 5, 3).fill(0x5fbf4a).stroke({ width: 1, color: C.ink });
    }
  } else {
    glow(c, d.x, d.y, C.mint, 0.3, 0.45);
    dg.ellipse(d.x + 3, d.y + 6, 12, 10).fill(0x2a1e18);
  }
  hit.addChild(dg);
  c.addChild(hit);
  if (state === 'open') glow(c, d.x, d.y, C.mint, 0.45, 0.7);
  // two little stone lanterns on the front steps
  for (const f of [0.08, 0.92]) {
    const p = P(1.75 * f + 0.05, 1.75 - 1.75 * f + 0.05);
    const L = new Graphics();
    L.rect(p.x - 4, p.y - 24, 8, 24).fill(0xb7b2a4).stroke(THIN);
    L.rect(p.x - 8, p.y - 34, 16, 11).fill(state === 'open' ? 0xd4f27a : 0x8d8676).stroke(THIN);
    L.poly([p.x - 11, p.y - 34, p.x, p.y - 42, p.x + 11, p.y - 34]).fill(0x7d776a).stroke(THIN);
    c.addChild(L);
    if (state === 'open') glow(c, p.x, p.y - 29, 0xd4f27a, 0.45, 0.3);
  }
  return { c, top: { x: top.x, y: top.y - rx * 1.25 - 30 }, hit };
}

/** 2 · Fósil en la Pared: a tall rock outcrop with a fossil cat embedded in its face; cracks grow with progress */
export function fossilWallArt(progress: number, done: boolean): SecretArt {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  shadowUnder(g);
  const rock = 0xa59d8c;
  isoBoxAt(g, 0.05, 0.05, 1.9, 1.9, 24, shade(rock, 0.86), 0.02);
  const mid = isoBoxAt(g, 0.2, 0.2, 1.55, 1.5, 54, rock, 0.03, 24);
  const top = isoBoxAt(g, 0.42, 0.38, 1.0, 0.95, 30, shade(rock, 1.08), 0.03, 78);
  // strata + a tuft on top
  for (const k of [16, 34]) g.moveTo(mid.left.x, mid.left.y - k).lineTo(mid.bottom.x, mid.bottom.y - k).lineTo(mid.right.x, mid.right.y - k).stroke({ width: 1.5, color: C.ink, alpha: 0.3 });
  g.moveTo(top.tT.x - 6, top.tT.y + 14).lineTo(top.tT.x - 2, top.tT.y + 4).moveTo(top.tT.x + 2, top.tT.y + 14).lineTo(top.tT.x + 4, top.tT.y + 2).stroke({ width: 2.5, color: 0x6f9e4f, cap: 'round' });
  // fossil niche on the camera-left face of the middle block
  const fx = (mid.left.x + mid.bottom.x) / 2;
  const fy = (mid.left.y + mid.bottom.y) / 2 - 28;
  const hit = new Container();
  const fg = new Graphics();
  if (!done) {
    fg.ellipse(fx, fy, 34, 22).fill(shade(rock, 0.78)).stroke({ width: 2, color: C.ink, alpha: 0.7 });
    const b = 0xf2e6cf;
    fg.circle(fx - 16, fy - 4, 8).fill(b).stroke({ width: 1.5, color: C.ink });
    fg.poly([fx - 22, fy - 9, fx - 21, fy - 18, fx - 16, fy - 11]).fill(b).stroke({ width: 1.2, color: C.ink });
    fg.poly([fx - 12, fy - 11, fx - 9, fy - 19, fx - 7, fy - 9]).fill(b).stroke({ width: 1.2, color: C.ink });
    fg.circle(fx - 18, fy - 5, 1.6).fill(C.ink);
    fg.moveTo(fx - 8, fy - 2).quadraticCurveTo(fx + 8, fy + 3, fx + 24, fy - 10).stroke({ width: 3.5, color: b, cap: 'round' });
    for (let k = 0; k < 4; k++) fg.moveTo(fx - 3 + k * 6, fy).lineTo(fx - 5 + k * 6, fy + 10).stroke({ width: 2.2, color: b, cap: 'round' });
    fg.moveTo(fx + 24, fy - 10).quadraticCurveTo(fx + 30, fy - 18, fx + 26, fy - 22).stroke({ width: 2.5, color: b, cap: 'round' });
    const n = Math.floor(progress * 8);
    for (let k = 0; k < n; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.3;
      const r0 = 26;
      const r1 = 38 + (k % 3) * 7;
      fg.moveTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0 * 0.66)
        .lineTo(fx + Math.cos(a + 0.12) * (r0 + r1) / 2, fy + Math.sin(a + 0.12) * ((r0 + r1) / 2) * 0.66)
        .lineTo(fx + Math.cos(a) * r1, fy + Math.sin(a) * r1 * 0.66)
        .stroke({ width: 2.2, color: C.ink });
    }
  } else {
    fg.ellipse(fx, fy, 30, 20).fill(0x3d2a1a).stroke(INK);
    fg.ellipse(fx + 4, fy + 4, 20, 11).fill(0x241812);
  }
  fg.circle(fx, fy, 46).fill({ color: 0xffffff, alpha: 0.001 });
  hit.addChild(fg);
  c.addChild(hit);
  // a pickaxe leaning on the rock (hint: hit me)
  const pk = new Graphics();
  const pp = P(1.65, 1.1);
  pk.moveTo(pp.x, pp.y).lineTo(pp.x + 14, pp.y - 42).stroke({ width: 4, color: 0x8a5a2e, cap: 'round' });
  pk.moveTo(pp.x + 1, pp.y - 46).quadraticCurveTo(pp.x + 14, pp.y - 53, pp.x + 29, pp.y - 40).stroke({ width: 5, color: 0x6b6b6b, cap: 'round' });
  c.addChild(pk);
  return { c, top: { x: top.tT.x, y: top.tT.y - 30 }, hit };
}

/** 3 · Forja Dormida: stone forge + anvil + chimney; lit = lava glow + flames */
export function forgeArt(lit: boolean): SecretArt & { fire: Container; chimney: { x: number; y: number }; mouth: { x: number; y: number } } {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  shadowUnder(g);
  isoBoxAt(g, 0.05, 0.05, 1.9, 1.9, 8, 0x3f2c2b, 0.03);
  const body = isoBoxAt(g, 0.2, 0.2, 1.2, 1.2, 46, 0x5e4a46, 0.04, 8);
  // bricks
  for (let r = 1; r < 4; r++) {
    g.moveTo(body.left.x, body.left.y - r * 12).lineTo(body.bottom.x, body.bottom.y - r * 12).stroke({ width: 1.2, color: C.ink, alpha: 0.4 });
    g.moveTo(body.bottom.x, body.bottom.y - r * 12).lineTo(body.right.x, body.right.y - r * 12).stroke({ width: 1.2, color: C.ink, alpha: 0.4 });
  }
  // chimney
  const ch = isoBoxAt(g, 0.35, 0.35, 0.45, 0.45, 50, 0x4a3433, 0.02, 54);
  // forge mouth (left face)
  const mouth = { x: (body.left.x + body.bottom.x) / 2, y: (body.left.y + body.bottom.y) / 2 - 16 };
  g.moveTo(mouth.x - 16, mouth.y + 10).bezierCurveTo(mouth.x - 16, mouth.y - 18, mouth.x + 16, mouth.y - 18, mouth.x + 16, mouth.y + 10).closePath().fill(lit ? C.orange : 0x1a1210).stroke(INK);
  // anvil
  const an = P(1.45, 1.2);
  g.poly([an.x - 18, an.y - 22, an.x + 18, an.y - 22, an.x + 12, an.y - 14, an.x - 12, an.y - 14]).fill(0x4b4b55).stroke(THIN);
  g.rect(an.x - 6, an.y - 14, 12, 12).fill(0x3a3a44).stroke(THIN);
  g.rect(an.x - 12, an.y - 4, 24, 5).fill(0x3a3a44).stroke(THIN);
  g.poly([an.x - 18, an.y - 22, an.x - 28, an.y - 20, an.x - 18, an.y - 16]).fill(0x4b4b55).stroke(THIN);
  const fire = new Container();
  if (lit) {
    glow(fire, mouth.x, mouth.y - 4, C.orange, 0.8, 0.9);
    const fl = new Graphics();
    fl.moveTo(mouth.x - 10, mouth.y + 8).bezierCurveTo(mouth.x - 14, mouth.y - 10, mouth.x - 2, mouth.y - 8, mouth.x, mouth.y - 22).bezierCurveTo(mouth.x + 4, mouth.y - 8, mouth.x + 14, mouth.y - 10, mouth.x + 10, mouth.y + 8).closePath().fill(C.yellow).stroke(THIN);
    fire.addChild(fl);
    glow(fire, an.x, an.y - 24, C.orange, 0.35, 0.4);
  }
  c.addChild(fire);
  const hit = new Container();
  hit.addChild(new Graphics().circle(mouth.x, mouth.y, 30).fill({ color: 0xffffff, alpha: 0.001 }));
  c.addChild(hit);
  return { c, top: { x: ch.tT.x, y: ch.tT.y - 30 }, hit, fire, chimney: { x: (ch.tT.x + ch.tB.x) / 2, y: (ch.tT.y + ch.tB.y) / 2 }, mouth };
}

/** 4 · Botella del Faro: a bottle stuck in the sand next to a tiny beacon post */
export function bottleArt(opened: boolean): SecretArt {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const ctr = centerOf(2, 2);
  g.ellipse(ctr.x, ctr.y + 4, 70, 30).fill(0xeae6ee).stroke({ width: 2, color: C.ink, alpha: 0.5 });
  g.ellipse(ctr.x + 10, ctr.y + 6, 44, 16).fill(0xf6f2f8);
  // beacon post
  const bp = P(0.2, 0.3);
  g.rect(bp.x - 4, bp.y - 70, 8, 70).fill(0xeae6ee).stroke(THIN);
  for (let k = 0; k < 3; k++) g.rect(bp.x - 4, bp.y - 60 + k * 18, 8, 8).fill(C.red);
  g.rect(bp.x - 8, bp.y - 84, 16, 14).fill(C.yellow).stroke(THIN);
  glow(c, bp.x, bp.y - 78, C.yellow, 0.4, 0.4);
  const hit = new Container();
  const b = new Graphics();
  const bx = ctr.x + 18;
  const by = ctr.y - 2;
  if (!opened) {
    b.roundRect(-9, -30, 18, 34, 6).fill({ color: 0x7fd8c0, alpha: 0.85 }).stroke(INK);
    b.rect(-4, -42, 8, 13).fill({ color: 0x7fd8c0, alpha: 0.85 }).stroke(THIN);
    b.rect(-5, -48, 10, 7).fill(0xb98348).stroke(THIN);
    b.roundRect(-5, -24, 10, 18, 2).fill(0xf2e6cf).stroke({ width: 1.2, color: C.ink });
    b.moveTo(-3, -18).lineTo(3, -18).moveTo(-3, -13).lineTo(3, -13).stroke({ width: 1, color: C.ink, alpha: 0.6 });
    b.rotation = 0.5;
  } else {
    b.roundRect(-9, -30, 18, 34, 6).fill({ color: 0x7fd8c0, alpha: 0.5 }).stroke(THIN);
    b.rect(-4, -42, 8, 13).fill({ color: 0x7fd8c0, alpha: 0.5 }).stroke(THIN);
    b.rotation = 1.4;
  }
  b.position.set(bx, by);
  hit.addChild(b);
  hit.addChild(new Graphics().circle(bx, by - 14, 34).fill({ color: 0xffffff, alpha: 0.001 }));
  c.addChild(hit);
  // little crab footprints
  for (let k = 0; k < 4; k++) g.circle(ctr.x - 40 + k * 12, ctr.y + 14 + (k % 2) * 4, 2).fill({ color: C.ink, alpha: 0.25 });
  return { c, top: { x: bx, y: by - 70 }, hit };
}

/** 5 · Gato en el Hielo: big ice cube with a frozen pirate cat (+ rare cannon) */
export function iceBlockArt(frozen: boolean): SecretArt {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  shadowUnder(g);
  const ctr = centerOf(2, 2);
  const hit = new Container();
  if (frozen) {
    const cube = new Graphics();
    const box = isoBoxAt(cube, 0.25, 0.25, 1.5, 1.5, 78, 0xbfe9f5, 0.03);
    cube.alpha = 1;
    // frozen cat silhouette inside + cannon
    const sil = new Graphics();
    const sx = (box.left.x + box.right.x) / 2;
    const sy = box.bottom.y - 30;
    sil.ellipse(sx - 4, sy, 18, 14).fill({ color: 0x2c5f8f, alpha: 0.8 });
    sil.circle(sx - 10, sy - 22, 11).fill({ color: 0x2c5f8f, alpha: 0.8 });
    sil.poly([sx - 19, sy - 28, sx - 17, sy - 40, sx - 11, sy - 31]).fill({ color: 0x2c5f8f, alpha: 0.8 });
    sil.poly([sx - 5, sy - 31, sx - 1, sy - 41, sx + 1, sy - 28]).fill({ color: 0x2c5f8f, alpha: 0.8 });
    sil.rect(sx + 4, sy - 16, 26, 10).fill({ color: 0x172b35, alpha: 0.8 });
    sil.circle(sx + 32, sy - 11, 7).fill({ color: 0x172b35, alpha: 0.8 });
    // pirate hat
    sil.poly([sx - 24, sy - 32, sx + 4, sy - 32, sx - 10, sy - 44]).fill({ color: 0x171317, alpha: 0.85 });
    // shine
    const shine = new Graphics();
    shine.moveTo(box.tL.x + 10, box.tL.y + 18).lineTo(box.left.x + 12, box.left.y - 20).stroke({ width: 4, color: 0xffffff, alpha: 0.7, cap: 'round' });
    shine.moveTo(box.tB.x - 14, box.tB.y + 10).lineTo(box.bottom.x - 14, box.bottom.y - 40).stroke({ width: 3, color: 0xffffff, alpha: 0.5, cap: 'round' });
    hit.addChild(cube, sil, shine);
    glow(c, ctr.x, ctr.y - 50, 0xbfe9f5, 0.35, 1.1);
  } else {
    // melted puddle + a thankful sign
    g.ellipse(ctr.x, ctr.y, 54, 22).fill({ color: 0x7fd8ff, alpha: 0.7 }).stroke(THIN);
    g.ellipse(ctr.x - 10, ctr.y - 3, 18, 6).fill({ color: 0xffffff, alpha: 0.5 });
    for (const [x, y] of [
      [-30, -10],
      [26, -6],
      [8, 12],
    ])
      g.poly([ctr.x + x - 6, ctr.y + y, ctr.x + x, ctr.y + y - 10, ctr.x + x + 6, ctr.y + y]).fill(0xdff6fb).stroke({ width: 1.5, color: C.ink });
    const s = new Graphics();
    s.rect(ctr.x + 40, ctr.y - 50, 4, 44).fill(0x8a5a2e).stroke({ width: 1.5, color: C.ink });
    s.rect(ctr.x + 18, ctr.y - 72, 48, 26).fill(C.paper).stroke(THIN);
    c.addChild(s);
    const t = txt('¡GRACIAS!', { fontFamily: F.comic, fontSize: 12, fill: C.ink });
    t.anchor.set(0.5);
    t.position.set(ctr.x + 42, ctr.y - 59);
    c.addChild(t);
    hit.addChild(new Graphics().circle(ctr.x, ctr.y, 40).fill({ color: 0xffffff, alpha: 0.001 }));
  }
  c.addChild(hit);
  return { c, top: { x: ctr.x, y: ctr.y - 140 }, hit };
}

/** 6–8 (M3/M4): rune stone, giant mirror shell, dark beacon — readable placeholders with a mood */
export function laterSecretArt(n: number, done: boolean): SecretArt {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  shadowUnder(g);
  const ctr = centerOf(2, 2);
  const hit = new Container();
  if (n === 6) {
    isoBoxAt(g, 0.3, 0.3, 1.4, 1.4, 10, 0x664566, 0.03);
    g.poly([ctr.x - 26, ctr.y - 6, ctr.x - 20, ctr.y - 92, ctr.x + 4, ctr.y - 106, ctr.x + 24, ctr.y - 86, ctr.x + 26, ctr.y - 4]).fill(0x9a77a0).stroke(INK);
    g.moveTo(ctr.x - 8, ctr.y - 70).lineTo(ctr.x, ctr.y - 84).lineTo(ctr.x + 8, ctr.y - 70).moveTo(ctr.x, ctr.y - 64).lineTo(ctr.x, ctr.y - 40).stroke({ width: 3, color: done ? C.mint : 0xb7a4c7 });
    glow(c, ctr.x, ctr.y - 64, 0x8a5cff, done ? 0.2 : 0.45, 0.6);
  } else if (n === 9) {
    // tea under the cherry tree: low table, teapot, a tiny wise cat silhouette
    isoBoxAt(g, 0.4, 0.4, 1.2, 1.2, 8, 0x8a5a3a, 0.04);
    g.ellipse(ctr.x, ctr.y - 12, 26, 10).fill(0xf3eee3).stroke(THIN);
    g.circle(ctr.x - 6, ctr.y - 26, 11).fill(0xff9ec4).stroke(THIN);
    g.moveTo(ctr.x + 4, ctr.y - 28).lineTo(ctr.x + 16, ctr.y - 34).stroke({ width: 3, color: C.ink });
    g.circle(ctr.x + 24, ctr.y - 30, 12).fill(0x3a1f2a);
    g.poly([ctr.x + 15, ctr.y - 38, ctr.x + 18, ctr.y - 50, ctr.x + 23, ctr.y - 41, ctr.x + 28, ctr.y - 50, ctr.x + 31, ctr.y - 38]).fill(0x3a1f2a);
    if (!done) glow(c, ctr.x, ctr.y - 30, 0xff9ec4, 0.4, 0.6);
  } else if (n === 10) {
    // sleeping sphinx-cat
    isoBoxAt(g, 0.2, 0.2, 1.6, 1.6, 12, 0xc89458, 0.03);
    g.ellipse(ctr.x, ctr.y - 24, 44, 18).fill(0xe2c182).stroke(INK);
    g.circle(ctr.x - 26, ctr.y - 48, 18).fill(0xe2c182).stroke(INK);
    g.poly([ctr.x - 40, ctr.y - 58, ctr.x - 36, ctr.y - 76, ctr.x - 28, ctr.y - 62]).fill(0xe2c182).stroke(THIN);
    g.poly([ctr.x - 24, ctr.y - 64, ctr.x - 16, ctr.y - 78, ctr.x - 12, ctr.y - 60]).fill(0xe2c182).stroke(THIN);
    g.poly([ctr.x - 44, ctr.y - 44, ctr.x - 8, ctr.y - 44, ctr.x - 14, ctr.y - 30, ctr.x - 38, ctr.y - 30]).fill(0x3569a3).stroke(THIN);
    if (done) g.circle(ctr.x - 30, ctr.y - 50, 3).fill(C.ink);
    else g.moveTo(ctr.x - 34, ctr.y - 50).lineTo(ctr.x - 26, ctr.y - 50).stroke({ width: 2, color: C.ink });
  } else if (n === 11) {
    // chocolate fountain
    g.ellipse(ctr.x, ctr.y - 6, 40, 16).fill(0x6a3b2a).stroke(INK);
    g.ellipse(ctr.x, ctr.y - 10, 32, 11).fill(0x8a4f2e);
    g.rect(ctr.x - 6, ctr.y - 70, 12, 60).fill(0xffd3e8).stroke(THIN);
    g.ellipse(ctr.x, ctr.y - 70, 24, 9).fill(0x6a3b2a).stroke(THIN);
    for (const dx of [-18, 0, 18]) g.moveTo(ctr.x + dx * 0.9, ctr.y - 66).quadraticCurveTo(ctr.x + dx * 1.4, ctr.y - 40, ctr.x + dx * 1.2, ctr.y - 12).stroke({ width: 4, color: 0x8a4f2e, cap: 'round' });
    glow(c, ctr.x, ctr.y - 40, 0xff7ab8, done ? 0.2 : 0.45, 0.6);
  } else if (n === 12) {
    // the eye in the ground
    g.ellipse(ctr.x, ctr.y - 4, 48, 20).fill(0x0b0a0e).stroke({ width: 3, color: 0xf3eee3 });
    g.moveTo(ctr.x - 40, ctr.y - 4).quadraticCurveTo(ctr.x, ctr.y - 30, ctr.x + 40, ctr.y - 4).quadraticCurveTo(ctr.x, ctr.y + 22, ctr.x - 40, ctr.y - 4).fill(0xf3eee3);
    g.circle(ctr.x, ctr.y - 4, 12).fill(0xff2e48);
    g.ellipse(ctr.x, ctr.y - 4, 3, 10).fill(0x000000);
    glow(c, ctr.x, ctr.y - 4, 0xff2e48, done ? 0.25 : 0.55, 0.7);
  } else if (n === 7) {
    g.moveTo(ctr.x - 50, ctr.y).bezierCurveTo(ctr.x - 56, ctr.y - 80, ctr.x + 56, ctr.y - 80, ctr.x + 50, ctr.y).closePath().fill(0xffd2dc).stroke(INK);
    for (let k = -3; k <= 3; k++) g.moveTo(ctr.x, ctr.y - 4).lineTo(ctr.x + k * 14, ctr.y - 60 + Math.abs(k) * 6).stroke({ width: 2, color: 0xff7ab8 });
    g.ellipse(ctr.x, ctr.y - 30, 18, 12).fill({ color: 0xffffff, alpha: done ? 0.3 : 0.75 }).stroke(THIN);
  } else {
    g.rect(ctr.x - 12, ctr.y - 96, 24, 96).fill(0x372347).stroke(INK);
    g.rect(ctr.x - 16, ctr.y - 116, 32, 22).fill(done ? C.cyan : 0x231626).stroke(INK);
    g.poly([ctr.x - 20, ctr.y - 116, ctr.x, ctr.y - 136, ctr.x + 20, ctr.y - 116]).fill(0x0d110f).stroke(THIN);
    if (done) glow(c, ctr.x, ctr.y - 106, C.cyan, 0.6, 0.8);
  }
  hit.addChild(new Graphics().circle(ctr.x, ctr.y - 40, 50).fill({ color: 0xffffff, alpha: 0.001 }));
  c.addChild(hit);
  return { c, top: { x: ctr.x, y: ctr.y - 150 }, hit };
}

/** a tiny "?" / sparkle hint that glints now and then (discreet secret hint) */
export function glintArt(): Container {
  const c = new Container();
  const s = new Sprite(glowTexture());
  s.anchor.set(0.5);
  s.tint = 0xffffff;
  s.alpha = 0.8;
  s.scale.set(0.35);
  const g = new Graphics();
  g.poly([0, -16, 3, -3, 16, 0, 3, 3, 0, 16, -3, 3, -16, 0, -3, -3]).fill(0xffffff).stroke({ width: 1.5, color: C.ink, alpha: 0.6 });
  c.addChild(s, g);
  return c;
}
