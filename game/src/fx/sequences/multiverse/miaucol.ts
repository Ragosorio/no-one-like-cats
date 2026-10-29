/**
 * Miaucol Yordan, el que Vuela desde la Línea: the hardwood universe (a basketball legend as a cat: the red 23 jersey —
 * no silhouette logo, no team crest, no brand anywhere). An arena under the floodlights, seen from the sideline: the
 * stands packed with cats in shadow, the polished court with its red key and the free-throw line he just took off from,
 * the hoop on its stanchion with the shot clock on top. He floats in slow motion — the camera rises with him and drifts
 * toward the rim (¡FIUUU…!) — while camera flashes pop all over the stands (¡OOOH!), the shot clock blinks 0.3 and the
 * rim trembles waiting: DESDE LA LÍNEA.
 * Payoff: the slam — the rim bends and springs back, the net whips, a ball drops through and bounces away, the shot
 * clock hits 00 in red with the buzzer, confetti in red, black and white, a storm of flashes; ¡CLAVADA! / …y la gravedad,
 * de vacaciones.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, cheer, every, fall, flashOf, later, plate } from './kit';
import { hideDisc, segDigit } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, ngon, rnd, streak } from './kitD';
import { strip } from './kitH';
import { at, comic, pre, standsFront, wrap } from './kitI';
import { flashbulbs } from './kitL';

const RED = 0xd62839;
const BLACK = 0x111111;
const WOOD = 0xd8a46a;
const WOOD_D = 0xc08a52;
const KEY = 0xb8242e;
const ORANGE = 0xe8742a;
const HZ = 600;
const VP: [number, number] = [960, 160];
/** the hoop: the backboard (edge-on, slightly turned), the rim's center, the stanchion's foot */
const BOARD: [number, number] = [650, 300];
const RIM: [number, number] = [720, 392];
const POLE_X = 250;
/** the key: from the baseline to the free-throw line (x on the court's middle depth) */
const BASE_X = 470;
const FT_X = 1170;
/** the camera's start offset (it rises and drifts toward the rim during the takeover) */
const CAM0: [number, number] = [-150, -95];

/** a basketball (r), seams as strips */
function ball(r: number, g = new Graphics(), x = 0, y = 0) {
  g.poly(ngon(x, y, r, r, 18)).fill(ORANGE).stroke({ width: Math.max(2, r / 10), color: C.ink });
  g.poly(strip([x - r, y, x + r, y], Math.max(1, r / 18))).fill(C.ink);
  g.poly(strip([x, y - r, x, y + r], Math.max(1, r / 18))).fill(C.ink);
  for (const d of [-1, 1]) {
    const arc: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * Math.PI;
      arc.push(x + d * (r * 0.95 - Math.cos(a) * r * 0.42), y + Math.sin(a) * r * 0.92);
    }
    g.poly(strip(arc, Math.max(1, r / 18))).fill(C.ink);
  }
  g.poly(ngon(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.12, 8, -0.7)).fill({ color: 0xffffff, alpha: 0.5 });
  return g;
}

/** the court seen from the sideline: planks toward the vanishing point, the red key, the lines, the free-throw circle */
function court(g: Graphics, x0: number, x1: number, hz: number, bottom: number, k = 1, vp = VP, baseX = BASE_X, ftX = FT_X) {
  g.rect(x0, hz, x1 - x0, bottom - hz).fill(WOOD);
  for (let i = -16; i <= 16; i++) {
    const xb = vp[0] + i * 150 * k;
    const xt = vp[0] + (xb - vp[0]) * ((hz - vp[1]) / (bottom - vp[1]));
    if (i % 2) g.poly([xt, hz, xt + 150 * k * ((hz - vp[1]) / (bottom - vp[1])), hz, xb + 150 * k, bottom, xb, bottom]).fill(WOOD_D);
  }
  g.rect(x0, hz, x1 - x0, 6 * k).fill(0xffffff);
  // the key (a band across the depth: near edge y1, far edge y0) and the free-throw circle
  const y0 = hz + 60 * k;
  const y1 = hz + 220 * k;
  const at = (x: number, y: number) => vp[0] + (x - vp[0]) * ((y - vp[1]) / (hz + 140 * k - vp[1]));
  g.poly([at(baseX, y0), y0, at(ftX, y0), y0, at(ftX, y1), y1, at(baseX, y1), y1]).fill(KEY);
  g.poly([at(baseX, y0), y0, at(ftX, y0), y0, at(ftX, y1), y1, at(baseX, y1), y1]).stroke({ width: 5 * k, color: 0xffffff });
  g.poly(ngon(at(ftX, (y0 + y1) / 2), (y0 + y1) / 2, 90 * k, ((y1 - y0) / 2) * 1.02, 24)).stroke({ width: 5 * k, color: 0xffffff });
  g.poly(streak(at(baseX, hz), hz, at(baseX, bottom), bottom, 3 * k, 6 * k)).fill(0xffffff);
  // a reflection of the lights on the polish
  for (let i = 0; i < 5; i++) g.poly(ngon(vp[0] + (i - 2) * 380 * k, hz + 140 * k, 120 * k, 18 * k, 12)).fill({ color: 0xffffff, alpha: 0.12 });
}

/** the stanchion, the board, the shot clock on top; the rim and the net are their own Graphics */
function hoopStand(g: Graphics, board: [number, number], poleX: number, floor: number, k = 1) {
  g.rect(poleX - 40 * k, floor - 30 * k, 120 * k, 30 * k).fill(0x2a2a34);
  g.poly([poleX - 18 * k, floor - 30 * k, poleX + 18 * k, floor - 30 * k, poleX + 14 * k, board[1] + 40 * k, poleX - 14 * k, board[1] + 40 * k]).fill(0x3a3a46);
  g.rect(poleX - 30 * k, floor - 260 * k, 60 * k, 230 * k).fill(RED).stroke({ width: 3 * k, color: BLACK });
  g.poly(streak(poleX, board[1] + 50 * k, board[0], board[1] + 140 * k, 10 * k, 8 * k)).fill(0x3a3a46);
  g.poly(streak(poleX, board[1] + 120 * k, board[0], board[1] + 150 * k, 6 * k, 6 * k)).fill(0x3a3a46);
  // the board, nearly edge-on (white glass with a red border), the shot clock box above it
  g.poly([board[0], board[1], board[0] + 44 * k, board[1] - 20 * k, board[0] + 44 * k, board[1] + 180 * k, board[0], board[1] + 200 * k]).fill({ color: 0xe8f2ff, alpha: 0.85 }).stroke({ width: 5 * k, color: RED });
  g.rect(board[0] - 10 * k, board[1] - 92 * k, 92 * k, 66 * k).fill(BLACK).stroke({ width: 3 * k, color: 0x5a5a64 });
}

/** the rim (an ellipse ring, bent by rotation about its joint to the board) */
function rimG(k = 1) {
  const g = new Graphics();
  g.rect(-6 * k, -6 * k, 18 * k, 12 * k).fill(0x3a3a46);
  const outer = ngon(70 * k, 0, 60 * k, 15 * k, 18);
  const inner = ngon(70 * k, 0, 52 * k, 10 * k, 18);
  g.poly(outer).fill(ORANGE).poly(inner).cut();
  g.poly(outer).stroke({ width: 2 * k, color: 0x8a3a10 });
  return g;
}

/** the net (hangs from the rim: a tapered mesh of strips), origin at the rim's center */
function netG(k = 1) {
  const g = new Graphics();
  const top = 56 * k;
  const bot = 30 * k;
  const h = 90 * k;
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    const xt = -top + 2 * top * u;
    const xb = -bot + 2 * bot * u;
    g.poly(strip([xt, 4 * k, (xt + xb) / 2 + (u < 0.5 ? 6 : -6) * k, h * 0.5, xb, h], 1.4 * k)).fill(0xf6f6f6);
  }
  for (let j = 1; j <= 3; j++) {
    const v = j / 4;
    const hw = top + (bot - top) * v;
    g.poly(strip([-hw, h * v, -hw * 0.3, h * v + 6 * k, hw * 0.3, h * v + 6 * k, hw, h * v], 1.2 * k)).fill(0xf6f6f6);
  }
  return g;
}

/** the shot clock's digits (redrawn): two 7-segment digits, red, with a decimal dot between them when `dot` */
function shotClock(g: Graphics, x: number, y: number, s: string, col: number, dot: boolean, k = 1) {
  g.clear();
  segDigit(g, s[0], x, y, 26 * k, 44 * k, 6 * k, col, 0.12);
  segDigit(g, s[1], x + 40 * k, y, 26 * k, 44 * k, 6 * k, col, 0.12);
  if (dot) g.rect(x + 29 * k, y + 38 * k, 7 * k, 7 * k).fill(col);
}

interface St {
  cam: Container;
  rim: Graphics;
  net: Graphics;
  sc: Graphics;
  boost: { v: number };
  rows: Graphics[];
  stage: Container;
}
const S = stash<St>();

export const miaucol: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO DE LA DUELA',
  open(c: SigCtx) {
    const k = new Container();
    const cam = new Container();
    const arena = vgrad(new Graphics(), -500, -500, W + 1000, HZ + 500, [0x05050a, 0x0c0c16, 0x16141f], 8);
    const st = standsFront(W + 1000, 40, HZ, { k: 1, seed: 23, cols: [0x2e2838, 0x3a3046, 0x44283a, 0x2a2232], seat: [0x14101a, 0x1c1622], wall: [RED, BLACK, 0xf2f2f2, BLACK], roof: 0x08080c, rows: 9 });
    st.tier.x = -500;
    for (const r of st.rows) r.x = -500;
    // the floodlight banks above, their beams down to the court
    const beams = new Graphics();
    for (let i = 0; i < 5; i++) {
      const x = 160 + i * 400;
      beams.poly([x - 30, -60, x + 30, -60, x + 260, HZ + 300, x - 260, HZ + 300]).fill({ color: 0xfff6e0, alpha: 0.05 });
      beams.rect(x - 70, -80, 140, 30).fill(0x1a1a22);
      for (let j = 0; j < 5; j++) beams.rect(x - 62 + j * 26, -74, 20, 18).fill(0xfffbe6);
    }
    const flashes = new Graphics();
    const fl = new Graphics();
    court(fl, -500, W + 500, HZ, H + 500);
    const hs = new Graphics();
    hoopStand(hs, BOARD, POLE_X, HZ + 160);
    const sc = new Graphics();
    const net = netG(1);
    net.position.set(...RIM);
    const rim = rimG(1);
    rim.position.set(RIM[0] - 70, RIM[1]);
    // the dotted flight from the free-throw line up through him to the rim
    const path = new Graphics();
    for (let i = 0; i < 16; i++) {
      const u = i / 15;
      const x = FT_X + (RIM[0] + 40 - FT_X) * u;
      const y = HZ + 140 - Math.sin(u * Math.PI * 0.85) * 520 + u * 40;
      path.poly(ngon(x, y, 6, 6, 8)).fill({ color: 0xffffff, alpha: 0.55 });
    }
    const balls = new Container();
    cam.addChild(arena, st.tier, ...st.rows, beams, flashes, fl, path, hs, sc, net, rim, balls);
    k.addChild(cam);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(0xfff2e0, 380, 0.45);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    // slow-motion streaks behind him (redrawn)
    const lines = new Graphics();
    c.behind.addChildAt(lines, 0);
    const boost = { v: c.short ? 0.4 : 0 };
    S.set(c, { cam, rim, net, sc, boost, rows: st.rows, stage: balls });
    let slow = 0;
    const frame = (t: number) => {
      if (flashes.destroyed) return;
      flashes.clear();
      flashbulbs(flashes, -400, 70, W + 800, HZ - 110, t, 70, 9, { rate: 0.6 + boost.v * 2.4, size: 14, boost: boost.v });
      lines.clear();
      if (slow > 0.02) {
        const r = rnd(5);
        for (let i = 0; i < 14; i++) {
          const x = W / 2 + (r() - 0.5) * 900;
          const y = ((r() * 900 + t * 520) % 900) + 80;
          lines.poly(streak(x, y, x + 50, y + 160, 3, 0.5)).fill({ color: 0xffffff, alpha: 0.4 * slow });
        }
      }
    };
    const clock = (s: string, col: number, dot: boolean) => !sc.destroyed && shotClock(sc, BOARD[0] - 2, BOARD[1] - 86, s, col, dot);
    clock('03', 0xff3a2a, true);
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;
    // the camera rises with him and drifts toward the rim, in slow motion
    if (!c.reduce) {
      cam.position.set(...CAM0);
      gsap.to(cam, { x: 0, y: 0, duration: 2.05, ease: 'sine.out' });
      slow = 1;
      later(c, 1.9, () => (slow = 0));
    }
    const ooh = pre(c, comic('¡OOOH!', 0xffffff, 96), 1450, 260, 0.08);
    const fiu = pre(c, comic('¡FIUUU…!', 0xffe0a0, 104), 1420, 620, -0.06);
    const line = pre(c, plate('DESDE LA LÍNEA', RED, C.ink, 46), 1400, 170, 0.04);
    at(c, 0.1, () => {
      sfx('whoosh', 0.55);
      fiu(0.8);
    });
    at(c, 0.5, () => {
      ooh(0.6);
      boost.v = 1;
      sfx('purr', 0.6);
      for (let i = 0; i < 6; i++) later(c, i * 0.09, () => sfx('click', 1.5 + (i % 3) * 0.2));
      gsap.to(boost, { v: 0.35, duration: 0.8, delay: 0.3 });
    });
    // the shot clock blinks 0.3; the rim trembles waiting
    for (let i = 0; i < 4; i++) at(c, 0.9 + i * 0.22, () => clock(i % 2 ? '  ' : '03', 0xff3a2a, i % 2 === 0));
    at(c, 1.25, () => {
      sfx('tick', 0.9);
      if (!c.reduce) gsap.fromTo(rim, { rotation: 0 }, { rotation: 0.04, duration: 0.05, yoyo: true, repeat: 7 });
    });
    at(c, 1.7, () => {
      line(0.45);
      sfx('sting', 1.1);
      clock('03', 0xff3a2a, true);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('bigboom', 0.8);
    sfx('hit', 0.6);
    later(c, 0.15, () => sfx('alarm', 0.8));
    sfx('fanfare', 1.05);
    c.shaker.add(0.4);
    flashOf(c, 0xffffff, 0.5, 0.35);
    if (st) {
      if (!st.cam.destroyed) {
        gsap.killTweensOf(st.cam);
        st.cam.position.set(0, 0);
        if (!c.reduce) gsap.fromTo(st.cam, { y: 18 }, { y: 0, duration: 0.4, ease: 'bounce.out' });
      }
      // the rim bends and springs back, the net whips, a ball drops through and bounces away
      if (!st.rim.destroyed && !c.reduce) gsap.fromTo(st.rim, { rotation: 0.32 }, { rotation: 0, duration: 0.7, ease: 'elastic.out(1.2,0.3)' });
      if (!st.net.destroyed && !c.reduce) gsap.fromTo(st.net.scale, { y: 1.6, x: 0.8 }, { y: 1, x: 1, duration: 0.6, ease: 'elastic.out(1,0.35)' });
      const b = ball(30);
      b.position.set(RIM[0], RIM[1] + 10);
      st.stage.addChild(b);
      if (c.reduce) {
        b.position.set(RIM[0] + 60, HZ + 130);
        gsap.to(b, { alpha: 0, delay: 1.4, duration: 0.3, onComplete: () => destroyTree(b) });
      } else {
        gsap.to(b, { y: HZ + 130, duration: 0.45, ease: 'power2.in' });
        gsap.to(b, { y: HZ + 30, duration: 0.3, delay: 0.45, ease: 'power2.out', yoyo: true, repeat: 1 });
        gsap.to(b, { x: RIM[0] - 300, rotation: -4, duration: 1.4, delay: 0.45, ease: 'none' });
        gsap.to(b, { alpha: 0, delay: 1.6, duration: 0.3, onComplete: () => destroyTree(b) });
        later(c, 0.45, () => sfx('hit', 1.1));
        later(c, 1.05, () => sfx('hit', 1.2));
      }
      if (!st.sc.destroyed) shotClock(st.sc, BOARD[0] - 2, BOARD[1] - 86, '00', 0xff2a1a, false);
      st.boost.v = 1.4;
      gsap.to(st.boost, { v: 0.5, duration: 1.6, delay: 0.6 });
      if (!c.reduce) st.rows.forEach((row, j) => gsap.fromTo(row, { y: 0 }, { y: -10, duration: 0.12, delay: (j % 3) * 0.04, yoyo: true, repeat: 5 }));
      const w = comic('¡PLAM!', 0xffffff, 110);
      w.position.set(RIM[0] + 60, RIM[1] - 150);
      w.rotation = -0.1;
      c.fg.addChild(w);
      if (!c.reduce) gsap.fromTo(w.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.15, ease: 'back.out(3)' });
      gsap.to(w, { alpha: 0, delay: 0.7, duration: 0.25, onComplete: () => destroyTree(w) });
    }
    fall(c, c.fg, (i) => new Graphics().rect(-12, -7, 24, 14).fill([RED, BLACK, 0xffffff][i % 3]), { n: 30, over: 1.8, dur: 2, spread: W * 1.1, spin: 6 });
    cheer(c, '¡CLAVADA!', 0xffffff, 150, 2.3);
    aside(c, '…y la gravedad, de vacaciones.', 0xffffff, { delay: 0.6, dur: 2.4, ink: BLACK });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.2, h / 1080);
    const cx = w / 2;
    const side = Math.min(w * 0.42, m * 0.85);
    const hz = h * (HZ / 1080);
    const arena = vgrad(new Graphics(), 0, 0, w, hz, [0x05050a, 0x0c0c16, 0x16141f], 8);
    const st = standsFront(w, 40 * u, hz, { k: u, seed: 23, cols: [0x2e2838, 0x3a3046, 0x44283a, 0x2a2232], seat: [0x14101a, 0x1c1622], wall: [RED, BLACK, 0xf2f2f2, BLACK], roof: 0x08080c, rows: 7 });
    const vp: [number, number] = [cx, h * 0.15];
    const fl = new Graphics();
    const bx = cx - side * 0.9;
    court(fl, 0, w, hz, h, u, vp, bx + 60 * u, cx + side * 0.5);
    const hs = new Graphics();
    const board: [number, number] = [cx - side * 0.62, h * 0.28];
    hoopStand(hs, board, board[0] - 400 * u, hz + 160 * u, u);
    const rim = rimG(u);
    rim.position.set(board[0] + 0 * u, board[1] + 92 * u);
    const net = netG(u);
    net.position.set(board[0] + 70 * u, board[1] + 92 * u);
    const sc = new Graphics();
    shotClock(sc, board[0] - 2 * u, board[1] - 86 * u, '23', 0xff3a2a, false, u);
    const flashes = new Graphics();
    const draw = (t: number) => {
      flashes.clear();
      flashbulbs(flashes, 0, 60 * u, w, hz - 100 * u, t, Math.max(20, Math.round(w / (40 * u))), 9, { rate: 0.7, size: 12 * u + 2 });
    };
    k.addChild(arena, st.tier, ...st.rows, flashes, fl, hs, sc, net, rim);
    draw(0.3);
    if (live) liveLoop(k, (t) => draw(t + 0.3));
    return k;
  },
};
