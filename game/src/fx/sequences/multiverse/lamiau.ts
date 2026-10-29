/**
 * Lamiau Yamal, el Chamaco de la Rosca: the recess universe (the teenage prodigy in red and yellow who still has
 * homework). It starts on a classroom blackboard: «TAREA: CALCULA LA ROSCA», a chalk wall of three X's, a chalk goal,
 * and a dashed chalk curve drawing itself from his left foot over the wall and into the corner. ¡RIIING! — the bell for
 * recess — and the blackboard rolls up like a screen: behind it, the neighborhood court at sunset (apartment blocks,
 * laundry in red and yellow, a chain-link fence, the stadium glowing far away). The real ball takes the chalk's path:
 * it curls over a wall of three defenders and drops into the top corner; ¡ROSCA!
 * Payoff: his school backpack drops in and bursts, the homework flies like confetti, a sheet comes back marked with a red
 * «10»; ¡GOLAZO! / …y mañana hay examen.
 * (National-team colors only: no crests, no sponsors, no real person's face.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, burst, cheer, drizzle, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { puff, stash, vgrad } from './kitB';
import { smooth } from './kitC';
import { aside, ngon, rnd, streak } from './kitD';
import { at, ball, bits, comic, flat, giant, pre, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const RED = 0xc8102e;
const YEL = 0xffd23f;
const NAVY = 0x1f2a5a;
const BOARD = 0x2e5745;
const CHALK = 0xf4f1e6;
const SUNSET = [0x2a1a4a, 0x7a2a4a, 0xd8503a, 0xff9a3c, 0xffd36a];
const HZ = 640;

/** the curl's path for a scene of scale k centered on cx (the ball leaves his left foot, over the wall, into the corner) */
function curl(cx: number, cy: number, k: number) {
  const P = [182, 182, 300, 40, 420, -90, 600, -140, 740, -90, 790, 10];
  const q: number[] = [];
  for (let i = 0; i < P.length; i += 2) q.push(cx + P[i] * k, cy + P[i + 1] * k);
  return smooth(q, 8, false);
}

/**
 * the neighborhood court at sunset for a w×h scene (k = scale, cx = where he stands): sky, sun, the far stadium's glow,
 * apartment blocks with lit windows, the laundry line (its shirts redrawn by `wash`), a chain-link fence, the court
 */
function barrio(w: number, h: number, hz: number, k: number, seed: number) {
  const g = vgrad(new Graphics(), 0, 0, w, hz, SUNSET, 16);
  const r = rnd(seed);
  g.poly(ngon(w * 0.72, hz - 40 * k, 120 * k, 120 * k, 24)).fill({ color: 0xffe9a0, alpha: 0.9 });
  for (let i = 4; i >= 1; i--) g.poly(ngon(w * 0.72, hz - 40 * k, (120 + i * 50) * k, (120 + i * 50) * k, 24)).fill({ color: 0xffd36a, alpha: 0.08 });
  // the stadium far away: a bowl with its floodlights glowing
  const sx = w * 0.3;
  g.poly([sx - 220 * k, hz - 30 * k, sx - 180 * k, hz - 100 * k, sx + 180 * k, hz - 100 * k, sx + 220 * k, hz - 30 * k]).fill(0x5a2a40);
  for (const d of [-1, 1]) {
    for (let i = 4; i >= 1; i--) g.poly(ngon(sx + d * 200 * k, hz - 170 * k, 22 * i * k, 16 * i * k, 14)).fill({ color: 0xfff4c8, alpha: 0.07 });
    g.rect(sx + d * 200 * k - 2 * k, hz - 170 * k, 4 * k, 80 * k).fill(0x4a2236);
    g.rect(sx + d * 200 * k - 18 * k, hz - 178 * k, 36 * k, 12 * k).fill(0xfff4c8);
  }
  // apartment blocks
  const blocks = new Graphics();
  for (let x = -40 * k; x < w; ) {
    const bw = (180 + r() * 160) * k;
    const bh = (220 + r() * 260) * k;
    const col = [0x6a3a3a, 0x7a4a3a, 0x5a3446, 0x8a5a42][Math.floor(r() * 4)];
    blocks.rect(x, hz - bh, bw, bh + 4 * k).fill(col);
    blocks.rect(x, hz - bh, bw, 8 * k).fill(0x3a1e2a);
    for (let wy = hz - bh + 26 * k; wy < hz - 30 * k; wy += 46 * k)
      for (let wx = x + 18 * k; wx < x + bw - 30 * k; wx += 42 * k) blocks.rect(wx, wy, 22 * k, 26 * k).fill(r() < 0.45 ? 0xffd98a : 0x3a2030);
    // a balcony rail and a tiny flag of plain red and yellow on some
    if (r() < 0.5) {
      const by = hz - bh * (0.4 + r() * 0.3);
      blocks.rect(x + 10 * k, by, bw * 0.5, 5 * k).fill(0x2a1620);
      blocks.rect(x + 20 * k, by - 34 * k, 40 * k, 9 * k).fill(RED).rect(x + 20 * k, by - 25 * k, 40 * k, 12 * k).fill(YEL).rect(x + 20 * k, by - 13 * k, 40 * k, 9 * k).fill(RED);
    }
    x += bw + (10 + r() * 30) * k;
  }
  // the court: terracotta with a green border and white lines, a fence across, its posts
  const court = new Graphics();
  court.rect(0, hz, w, h - hz).fill(0x2e7a4a);
  court.poly([w * 0.04, hz + 30 * k, w * 0.96, hz + 30 * k, w * 1.1, h, -w * 0.1, h]).fill(0xb4553a);
  court.poly(streak(w * 0.5, hz + 30 * k, w * 0.5, h, 2 * k, 4 * k)).fill({ color: 0xffffff, alpha: 0.8 });
  court.poly(ngon(w * 0.5, hz + (h - hz) * 0.55, 220 * k, 70 * k, 26)).stroke({ width: 4 * k, color: 0xffffff, alpha: 0.8 });
  const fence = new Graphics();
  const fy0 = hz - 190 * k;
  const fy1 = hz + 20 * k;
  const step = 34 * k;
  for (let x = -fy1; x < w + fy1; x += step) {
    fence.poly(streak(x, fy0, x + (fy1 - fy0), fy1, 0.9 * k, 0.9 * k));
    fence.poly(streak(x, fy1, x + (fy1 - fy0), fy0, 0.9 * k, 0.9 * k));
  }
  fence.fill({ color: 0xc8c8d0, alpha: 0.45 });
  for (let x = 0; x <= w; x += 260 * k) fence.rect(x - 4 * k, fy0 - 6 * k, 8 * k, fy1 - fy0 + 6 * k).fill(0x6a6a74);
  fence.rect(0, fy0 - 6 * k, w, 6 * k).fill(0x6a6a74);
  return { sky: g, blocks, court, fence };
}

/** the laundry line between two blocks: a sagging cord and shirts in red / yellow / navy that swing with t */
function wash(g: Graphics, x0: number, x1: number, y: number, k: number, t: number) {
  g.clear();
  const sag = (u: number) => y + Math.sin(u * Math.PI) * 30 * k;
  const pts: number[] = [];
  for (let i = 0; i <= 10; i++) pts.push(x0 + ((x1 - x0) * i) / 10, sag(i / 10));
  const low: number[] = [];
  for (let i = pts.length - 2; i >= 0; i -= 2) low.push(pts[i], pts[i + 1] + 2.5 * k);
  g.poly([...pts, ...low]).fill({ color: 0x2a1620, alpha: 0.8 });
  const cols = [RED, YEL, NAVY, 0xffffff, RED, YEL];
  for (let i = 0; i < cols.length; i++) {
    const u = (i + 0.7) / (cols.length + 0.4);
    const x = x0 + (x1 - x0) * u;
    const yy = sag(u);
    const sw = Math.sin(t * 2.2 + i) * 6 * k;
    g.poly([x - 22 * k, yy, x + 22 * k, yy, x + 30 * k, yy + 12 * k, x + 18 * k, yy + 16 * k, x + 18 * k + sw, yy + 52 * k, x - 18 * k + sw, yy + 52 * k, x - 18 * k, yy + 16 * k, x - 30 * k, yy + 12 * k]).fill(cols[i]);
  }
  return g;
}

/** a futsal goal seen from the front (posts, bar, a net of a few strands), base center at (x, y), w wide */
function goal(w: number) {
  const g = new Graphics();
  const h = w * 0.66;
  for (let i = 1; i < 7; i++) g.rect(-w / 2 + (i * w) / 7, -h, 1.6, h).fill({ color: 0xffffff, alpha: 0.5 });
  for (let i = 1; i < 4; i++) g.rect(-w / 2, -h + (i * h) / 4, w, 1.6).fill({ color: 0xffffff, alpha: 0.5 });
  g.rect(-w / 2 - 5, -h, 9, h).fill(0xffffff).rect(w / 2 - 4, -h, 9, h).fill(0xffffff).rect(-w / 2 - 5, -h - 6, w + 14, 9).fill(0xffffff);
  for (let i = 0; i < 6; i++) g.rect(-w / 2 - 5, -h + (i * h) / 6, 9, h / 12).fill(RED);
  return g;
}

/** a dashed chalk line along `P` up to fraction `u` (one fill) */
function chalkPath(g: Graphics, P: number[], u: number, wid: number, alpha = 0.92) {
  const n = P.length / 2;
  const m = Math.floor(u * (n - 1));
  for (let i = 0; i < m; i++) if (i % 3 !== 2) g.poly(streak(P[i * 2], P[i * 2 + 1], P[i * 2 + 2], P[i * 2 + 3], wid, wid));
  g.fill({ color: CHALK, alpha });
  if (m >= 2 && u >= 0.999) {
    // the arrowhead
    const x = P[(n - 1) * 2];
    const y = P[(n - 1) * 2 + 1];
    const a = Math.atan2(y - P[(n - 3) * 2 + 1], x - P[(n - 3) * 2]);
    g.poly([x + Math.cos(a) * wid * 6, y + Math.sin(a) * wid * 6, x + Math.cos(a + 2.4) * wid * 7, y + Math.sin(a + 2.4) * wid * 7, x + Math.cos(a - 2.4) * wid * 7, y + Math.sin(a - 2.4) * wid * 7]).fill({ color: CHALK, alpha });
  }
  return g;
}

/** the school backpack (red with a yellow pocket and navy straps), origin at its bottom center, s = scale */
function backpack(s: number) {
  const g = new Graphics();
  g.poly(ngon(0, -150 * s, 60 * s, 34 * s, 14, 0)).fill(NAVY);
  g.roundRect(-90 * s, -170 * s, 180 * s, 170 * s, 40 * s).fill(RED).stroke({ width: 6 * s, color: C.ink });
  g.roundRect(-60 * s, -84 * s, 120 * s, 70 * s, 18 * s).fill(YEL).stroke({ width: 5 * s, color: C.ink });
  g.rect(-50 * s, -70 * s, 100 * s, 6 * s).fill(C.ink);
  g.rect(-70 * s, -150 * s, 14 * s, 110 * s).fill(NAVY).rect(56 * s, -150 * s, 14 * s, 110 * s).fill(NAVY);
  // books peeking out
  g.rect(-50 * s, -196 * s, 40 * s, 34 * s).fill(0x3a7ac8).rect(-6 * s, -206 * s, 34 * s, 44 * s).fill(0x3aa85a).rect(30 * s, -190 * s, 24 * s, 28 * s).fill(0xffffff);
  return g;
}

/** a homework sheet (lined paper, a margin), w × 1.3w, centered */
function sheet(w: number, grade = false) {
  const k = new Container();
  const h = w * 1.3;
  const g = new Graphics().rect(-w / 2 + 5, -h / 2 + 6, w, h).fill({ color: C.ink, alpha: 0.4 }).rect(-w / 2, -h / 2, w, h).fill(0xfbfaf4);
  for (let y = -h / 2 + h * 0.16; y < h / 2 - 6; y += h * 0.075) g.rect(-w / 2 + 4, y, w - 8, Math.max(1, w * 0.008)).fill(0x8fb4e0);
  g.rect(-w / 2 + w * 0.14, -h / 2, Math.max(1, w * 0.01), h).fill(0xe08a8a);
  // scribbles of «homework»
  for (let i = 0; i < 6; i++) {
    const y = -h / 2 + h * 0.2 + i * h * 0.075 - w * 0.012;
    g.rect(-w / 2 + w * 0.2, y, w * (0.35 + ((i * 37) % 30) / 100), w * 0.02).fill({ color: 0x3a4a6a, alpha: 0.7 });
  }
  k.addChild(g);
  if (grade) {
    const ring = new Graphics().poly(ngon(w * 0.12, h * 0.12, w * 0.3, w * 0.24, 20, 0.3)).stroke({ width: w * 0.035, color: 0xd81e2e });
    const t = flat('10', { fontFamily: F.brush, fontSize: w * 0.34, fill: 0xd81e2e });
    t.position.set(w * 0.12, h * 0.12);
    t.rotation = -0.12;
    k.addChild(ring, t);
  }
  return k;
}

interface St {
  fx: Container;
  board: Container | null;
  shot: Container[];
}
const S = stash<St>();

export const lamiau: Signature = {
  dark: false,
  frame: RED,
  tag: 'UNIVERSO DEL RECREO',
  open(c: SigCtx) {
    const k = new Container();
    const b = barrio(W, H, HZ, 1, 19);
    const line = new Graphics();
    wash(line, 120, 640, 230, 1, 0);
    const net = goal(230);
    net.position.set(1740, 600);
    const fx = new Container();
    k.addChild(b.sky, b.blocks, line, b.fence, b.court, net, fx);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const st: St = { fx, board: null, shot: [] };
    S.set(c, st);
    if (!c.reduce)
      every(c, 20, (t) => {
        if (!line.destroyed) wash(line, 120, 640, 230, 1, t);
      });
    if (c.short) return;

    const P = curl(W / 2, c.catY, 1);
    const n = P.length / 2;

    // the blackboard over everything: frame, chalk title, the chalk wall, the chalk goal, the curve drawing itself
    const bd = new Container();
    const bg = new Graphics().rect(0, 0, W, H).fill(0x7a4a26).rect(26, 26, W - 52, H - 100).fill(BOARD);
    const r = rnd(4);
    for (let i = 0; i < 9; i++) bg.poly(ngon(100 + r() * (W - 200), 120 + r() * (H - 300), 120 + r() * 200, 40 + r() * 60, 12, r())).fill({ color: 0x4a7a62, alpha: 0.18 });
    bg.rect(0, H - 74, W, 20).fill(0x5a341a).rect(0, H - 54, W, 54).fill(0x7a4a26);
    bg.rect(300, H - 82, 60, 12).fill(CHALK).rect(380, H - 80, 36, 10).fill(0xffd23f).rect(1500, H - 84, 120, 16).fill(0x3a3a44);
    // the chalk wall (three X's) and goal, where the real ones will stand
    const ch = new Graphics();
    for (let i = 0; i < 3; i++) {
      const x = 1400 + i * 70;
      ch.poly(streak(x - 24, 760, x + 24, 820, 4, 4)).poly(streak(x + 24, 760, x - 24, 820, 4, 4));
    }
    ch.poly(streak(1625, 600, 1625, 450, 4, 4)).poly(streak(1625, 450, 1855, 450, 4, 4)).poly(streak(1855, 450, 1855, 600, 4, 4));
    ch.fill({ color: CHALK, alpha: 0.85 });
    const title = flat('TAREA: CALCULA LA ROSCA', { fontFamily: F.brush, fontSize: 58, fill: CHALK });
    title.position.set(560, 120);
    title.rotation = -0.03;
    title.alpha = 0.92;
    const eq = flat('ZURDA + EXTERIOR = ROSCA', { fontFamily: F.brush, fontSize: 40, fill: CHALK });
    eq.position.set(470, 220);
    eq.alpha = 0.8;
    const name = flat('NOMBRE: ____________   GRUPO: 3°B', { fontFamily: F.brush, fontSize: 30, fill: CHALK });
    name.position.set(1440, 110);
    name.alpha = 0.7;
    const path = new Graphics();
    bd.addChild(bg, ch, path, title, eq, name);
    c.back.addChild(bd);
    st.board = bd;
    const prog = { u: c.reduce ? 1 : 0 };
    const drawChalk = () => !path.destroyed && chalkPath(path.clear(), P, prog.u, 4.5);
    drawChalk();
    if (!c.reduce) {
      bd.alpha = 0;
      gsap.to(bd, { alpha: 1, duration: 0.12 });
      gsap.to(prog, { u: 1, duration: 0.6, delay: 0.12, ease: 'power1.inOut', onUpdate: drawChalk });
      for (let i = 0; i < 6; i++) later(c, 0.14 + i * 0.1, () => sfx('pencil', 1.2 + Math.random() * 0.4));
    }

    // ¡RIIING! the bell for recess: the blackboard rolls up like a screen
    const riing = pre(c, comic('¡RIIING!', YEL, 140), 520, 380, -0.1);
    const recreo = pre(c, flat('¡RECREO!', { fontFamily: F.heavy, fontSize: 64, fill: CHALK, stroke: { color: C.ink, width: 8, join: 'round' } }), 540, 500, -0.06);
    const rosca = pre(c, comic('¡ROSCA!', YEL, 150), 1500, 300, 0.08);
    at(c, 0.85, () => {
      riing(0.6);
      sfx('alarm', 1.6);
      later(c, 0.12, () => sfx('alarm', 1.6));
      c.shaker.add(0.25);
      later(c, 0.15, () => recreo(0.5, { from: 1.4 }));
      if (c.reduce) {
        destroyTree(bd);
        return;
      }
      gsap.to(bd, { y: -H - 60, duration: 0.34, ease: 'power2.in', onComplete: () => destroyTree(bd) });
      sfx('whoosh', 0.8);
    });

    // the real ball takes the chalk's path, over a wall of three defenders, into the top corner
    const wallers = [0, 1, 2].map((i) => {
      const g = giant(34, 0x1a1420, YEL, 0xffe14d, 0x2a4a8a, 0x1a2a50);
      g.position.set(1400 + i * 76, 905 + (i % 2) * 6);
      k.addChild(g);
      return g;
    });
    const trail = new Graphics();
    const bl = new Container();
    bl.addChild(ball(22));
    bl.visible = false;
    k.addChild(trail, bl);
    st.shot.push(trail, bl);
    const bu = { u: 0 };
    const place = () => {
      if (trail.destroyed) return;
      const m = Math.max(1, Math.floor(bu.u * (n - 1)));
      trail.clear();
      for (let i = Math.max(0, m - 14); i < m; i++) {
        const f = (i - (m - 14)) / 14;
        trail.poly(streak(P[i * 2], P[i * 2 + 1], P[i * 2 + 2], P[i * 2 + 3], 2 + f * 8, 2 + f * 9));
      }
      trail.fill({ color: YEL, alpha: 0.75 });
      if (!bl.destroyed) {
        bl.position.set(P[m * 2], P[m * 2 + 1]);
        bl.rotation = bu.u * 22;
        bl.scale.set(1 - 0.3 * bu.u);
      }
    };
    at(c, 1.12, () => {
      bl.visible = true;
      sfx('shoot', 1.1);
      if (c.reduce) {
        bu.u = 1;
        place();
      } else gsap.to(bu, { u: 1, duration: 0.5, ease: 'sine.in', onUpdate: place });
      // the wall jumps, too late
      if (!c.reduce) for (const g of wallers) gsap.to(g, { y: g.y - 60, duration: 0.2, delay: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
    });
    at(c, 1.64, () => {
      rosca(0.7);
      sfx('boom', 1.15);
      c.shaker.add(0.22);
      if (!net.destroyed && !c.reduce) gsap.fromTo(net.scale, { x: 1.12, y: 1.16 }, { x: 1, y: 1, duration: 0.45, ease: 'elastic.out(1, 0.4)' });
      puff(c, k, 1770, 520, 0xffffff, 5, 40, 30);
      later(c, 0.5, () => {
        if (!trail.destroyed) gsap.to(trail, { alpha: 0, duration: 0.3 });
        if (!bl.destroyed) gsap.to(bl, { alpha: 0, duration: 0.3 });
      });
    });
    score(c, [
      [0.0, 'paper', 1.2],
      [0.05, 'drumroll', 1.2],
    ]);
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.1);
    sfx('bigboom', 0.9);
    c.shaker.add(0.35);
    flashOf(c, 0xffffff, 0.45, 0.3);
    const layer = st?.fx ?? c.back;
    // a skip mid-shot: the ball and its trail go
    for (const n of st?.shot ?? []) if (!n.destroyed) gsap.to(n, { alpha: 0, duration: 0.25, onComplete: () => destroyTree(n) });
    // a skip before the bell: the blackboard still has to go
    if (st?.board && !st.board.destroyed) {
      const bd = st.board;
      if (c.reduce) destroyTree(bd);
      else gsap.to(bd, { y: -H - 60, duration: 0.25, ease: 'power2.in', onComplete: () => destroyTree(bd) });
    }
    // the backpack drops in beside him and bursts
    const bp = backpack(1.1);
    bp.position.set(W / 2 + 540, 1010);
    bp.rotation = -0.08;
    layer.addChild(bp);
    if (!c.reduce) gsap.from(bp, { y: -200, duration: 0.5, ease: 'bounce.out' });
    later(c, c.reduce ? 0 : 0.42, () => {
      sfx('paper', 1.0);
      burst(c, c.fg, () => sheet(40 + Math.random() * 20), 14, W / 2 + 540, 840, 700, 1.6);
    });
    // a sheet comes back marked with a red 10
    const sh = sheet(210, true);
    // (a duplicate's star bar sits on the right: the sheet lands lower)
    sh.position.set(c.short ? 1740 : 1600, c.short ? 800 : 600);
    sh.rotation = 0.1;
    layer.addChild(sh);
    if (!c.reduce) {
      gsap.from(sh, { x: W + 200, rotation: 1.2, duration: 0.4, delay: 0.3, ease: 'power3.out' });
      later(c, 0.7, () => sfx('hit', 1.2));
    }
    burst(c, c.fg, bits([RED, YEL, 0xffffff]), 30, W / 2, c.catY - 80, 900, 1.4);
    drizzle(c, c.back, () => new Graphics().rect(-10, -13, 20, 26).fill(0xfbfaf4).rect(-7, -6, 14, 1.5).fill(0x8fb4e0).rect(-7, 0, 14, 1.5).fill(0x8fb4e0), 0.18, 3.4);
    cheer(c, '¡GOLAZO!', YEL, 160, 2.2);
    aside(c, '…y mañana hay examen.', 0xffffff, { delay: 0.55, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.3, h / 1080);
    const hz = h * 0.6;
    const b = barrio(w, h, hz, u, 29);
    const line = new Graphics();
    const lx0 = w / 2 - Math.min(w * 0.46, m * 0.9);
    const lx1 = lx0 + Math.min(w * 0.3, m * 0.5);
    wash(line, lx0, lx1, h * 0.2, u, 0.4);
    // the chalk curve in the sky, from his foot (the painting: m·1.04 wide on (w/2, 0.54h)) into the goal
    const kc = Math.min((m * 1.04) / 520, (w / 2 - 30) / 800);
    const P = curl(w / 2, h * 0.54, kc);
    const net = goal(230 * kc);
    net.position.set(w / 2 + 790 * kc, h * 0.54 + 80 * kc);
    const path = chalkPath(new Graphics(), P, 1, Math.max(1.2, 3.2 * u), 0.75);
    const bp = backpack(0.8 * u);
    bp.position.set(w / 2 - Math.min(w * 0.3, m * 0.5), h * 0.97);
    bp.rotation = -0.1;
    const bl = new Container();
    bl.addChild(ball(16 * u + 3));
    k.addChild(b.sky, b.blocks, line, b.fence, b.court, net, path, bp, bl);
    const n = P.length / 2;
    const pose = (q: number) => {
      const i = Math.floor((q % 1) * (n - 1));
      bl.position.set(P[i * 2], P[i * 2 + 1]);
      bl.rotation = q * 20;
    };
    pose(0.6);
    if (live)
      liveLoop(k, (t) => {
        wash(line, lx0, lx1, h * 0.2, u, t + 0.4);
        pose(0.6 + t * 0.35);
      });
    return k;
  },
};
