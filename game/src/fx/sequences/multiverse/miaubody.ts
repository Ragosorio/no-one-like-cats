/**
 * Mr. Miaubody: the time-machine universe (a 1959 limited-animation cartoon). A flat mid-century penthouse — teal wall,
 * picture window on the skyline, an atomic starburst clock, a globe — and behind him a riveted arch that hums, its bulbs
 * chasing; inside, the time tunnel swirls and the ages fly past (pyramids, a castle, a caravel, a rocket) while the
 * console's LED counter rolls the years. He adjusts his glasses: «Ejem.» Payoff: the arch flashes and souvenirs from
 * every age tumble out; ¡LLEGAMOS… A TIEMPO! …bueno, casi.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, every, fall, flashOf, later, score, word } from './kit';
import { hideDisc, pixelText, pixelWidth } from './kitA';
import { fadeKill, stash } from './kitB';
import { arcPts, aside, bandPts, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { liveLoop } from '../../../panels/collection/cardArt';

const TEAL = 0x3f7f86;
const TEAL_D = 0x2f6268;
const CREAM = 0xf2e6cc;
const MUSTARD = 0xd9a63a;
const CORAL = 0xe0603a;
const STEEL = 0x9aa4ae;
const INK = 0x2a2a30;
const RED_BOW = 0xd62839;

/** the arch's doorway (a horseshoe: straight sides, round top), center x, floor y, half-width r, inset d */
function archPts(cx: number, floor: number, top: number, r: number, d = 0): number[] {
  const rr = r - d;
  const cy = top + r;
  const p: number[] = [cx - rr, floor];
  p.push(...arcPts(cx, cy, rr, Math.PI, Math.PI * 2, 24));
  p.push(cx + rr, floor);
  return p;
}

/** the penthouse (one Graphics): wall, wainscot, floor, picture window with skyline, starburst clock, globe, armchair */
function apartment(g: Graphics, w: number, h: number, k: number, cx: number) {
  const floor = h * 0.8;
  g.rect(0, 0, w, floor).fill(TEAL);
  g.rect(0, floor - 150 * k, w, 150 * k).fill(TEAL_D).rect(0, floor - 156 * k, w, 8 * k).fill(CREAM);
  g.rect(0, floor, w, h - floor).fill(0xb8844a);
  for (let x = 0; x < w; x += 90 * k) g.poly([x, floor, x + 90 * k, floor, x + 60 * k, h, x - 60 * k, h]).fill(x % (180 * k) ? 0xc8945a : 0xb8844a);
  // the picture window on the night skyline (left)
  const wx = cx - 820 * k;
  g.rect(wx - 14 * k, 150 * k, 368 * k, 440 * k).fill(CREAM).rect(wx, 164 * k, 340 * k, 412 * k).fill(0x1f2a4a);
  const r = rnd(8);
  for (let i = 0; i < 9; i++) {
    const bx = wx + i * 38 * k;
    const bh = (120 + r() * 220) * k;
    g.rect(bx, 576 * k - bh, 34 * k, bh).fill(0x14182e);
    for (let j = 0; j < 6; j++) if (r() < 0.5) g.rect(bx + 6 * k + (j % 2) * 14 * k, 576 * k - bh + 14 * k + Math.floor(j / 2) * 30 * k, 8 * k, 12 * k).fill(0xffd98a);
  }
  g.poly(ngon(wx + 270 * k, 230 * k, 30 * k, 30 * k, 14)).fill(0xf6ecc8);
  g.rect(wx + 164 * k, 164 * k, 12 * k, 412 * k).fill(CREAM);
  // the atomic starburst clock
  const sx = cx - 430 * k;
  const sy = 170 * k;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.poly(streak(sx, sy, sx + Math.cos(a) * 110 * k, sy + Math.sin(a) * 110 * k, 4 * k, 1.5 * k)).fill(MUSTARD);
    g.poly(ngon(sx + Math.cos(a) * 112 * k, sy + Math.sin(a) * 112 * k, 8 * k, 8 * k, 8)).fill(CORAL);
  }
  g.poly(ngon(sx, sy, 42 * k, 42 * k, 18)).fill(CREAM).stroke({ width: 4 * k, color: INK });
  g.poly(streak(sx, sy, sx, sy - 30 * k, 3 * k, 2 * k)).fill(INK).poly(streak(sx, sy, sx + 22 * k, sy + 8 * k, 3 * k, 2 * k)).fill(INK);
  // the globe on its stand (right of the arch, before the console)
  const gx = cx + 470 * k;
  const gy = floor - 260 * k;
  g.poly(streak(gx, floor, gx, gy, 6 * k, 6 * k)).fill(INK).poly([gx - 70 * k, floor, gx + 70 * k, floor, gx, floor - 30 * k]).fill(INK);
  g.poly(ngon(gx, gy, 80 * k, 80 * k, 20)).fill(0x5ab4c8).stroke({ width: 4 * k, color: INK });
  g.poly([gx - 50 * k, gy - 30 * k, gx - 10 * k, gy - 50 * k, gx + 20 * k, gy - 10 * k, gx - 20 * k, gy + 30 * k, gx - 56 * k, gy + 6 * k]).fill(0x8ab65a);
  g.poly([gx + 30 * k, gy + 20 * k, gx + 60 * k, gy + 10 * k, gx + 50 * k, gy + 50 * k]).fill(0x8ab65a);
  g.poly(arcPts(gx, gy, 96 * k, -2.2, 1.0, 16), false).stroke({ width: 5 * k, color: 0xb8945a });
  // the armchair (coral, left of the arch)
  const ax = cx - 520 * k;
  g.roundRect(ax - 130 * k, floor - 260 * k, 260 * k, 200 * k, 40 * k).fill(CORAL);
  g.roundRect(ax - 160 * k, floor - 140 * k, 320 * k, 100 * k, 30 * k).fill(0xc8502e);
  g.poly(streak(ax - 120 * k, floor - 40 * k, ax - 140 * k, floor, 5 * k, 3 * k)).fill(INK).poly(streak(ax + 120 * k, floor - 40 * k, ax + 140 * k, floor, 5 * k, 3 * k)).fill(INK);
}

/** the console: a cream cabinet, two tape reels (separate, they spin), a light row, the LED year, a lever */
function console_(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.roundRect(0, 0, 380 * s, 440 * s, 18 * s).fill(CREAM).stroke({ width: 5 * s, color: INK });
  g.rect(30 * s, 40 * s, 320 * s, 90 * s).fill(0x14141a).stroke({ width: 4 * s, color: INK });
  g.rect(20 * s, 300 * s, 340 * s, 120 * s).fill(MUSTARD).stroke({ width: 4 * s, color: INK });
  for (let i = 0; i < 5; i++) g.poly(ngon(60 * s + i * 65 * s, 360 * s, 18 * s, 18 * s, 12)).fill(0x5a5a62).stroke({ width: 3 * s, color: INK });
  g.poly(streak(330 * s, 300 * s, 400 * s, 200 * s, 6 * s, 6 * s)).fill(INK).poly(ngon(400 * s, 200 * s, 20 * s, 20 * s, 12)).fill(RED_BOW);
  const reels: Graphics[] = [];
  for (const rx of [110, 270]) {
    const r = new Graphics();
    r.poly(ngon(0, 0, 58 * s, 58 * s, 18)).fill(0x5a5a62).stroke({ width: 4 * s, color: INK });
    r.poly(ngon(0, 0, 20 * s, 20 * s, 10)).fill(CREAM);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      r.poly(ngon(Math.cos(a) * 36 * s, Math.sin(a) * 36 * s, 12 * s, 12 * s, 8)).fill(0x2a2a30);
    }
    r.position.set(rx * s, 210 * s);
    reels.push(r);
  }
  const lights = new Graphics();
  const led = new Graphics();
  k.addChild(g, ...reels, lights, led);
  return { k, reels, lights, led };
}

/** the LED year on the console's display */
function showYear(led: Graphics, text: string, s: number) {
  led.clear();
  const px = 9 * s;
  pixelText(led, text, 190 * s - pixelWidth(text, px) / 2, 85 * s - 3.5 * px, px, 0xff4a3a);
}

/** the time tunnel: rotating bands of teal and mustard (one Graphics), center (x, y) */
function vortex(g: Graphics, x: number, y: number, R: number, t: number) {
  g.clear();
  g.rect(x - R, y - R * 1.2, R * 2, R * 3).fill(0x1c3a40);
  for (let i = 0; i < 7; i++) {
    const r0 = R * (0.12 + i * 0.14);
    const r1 = r0 + R * 0.07;
    const n = 6 + i * 2;
    for (let j = 0; j < n; j++) {
      const a0 = t * (i % 2 ? 1.6 : -1.2) + (j / n) * Math.PI * 2;
      g.poly(bandPts(x, y, r0, r1, a0, a0 + (Math.PI / n) * 1.1, 4)).fill(j % 2 ? MUSTARD : 0x5ab4b8);
    }
  }
}

/** one age, a flat card about 640×700 centered at the origin: 0 pyramids, 1 castle, 2 caravel, 3 rocket */
function age(kind: number): Graphics {
  const g = new Graphics();
  const sky = [0xf2a03a, 0x6a4a9a, 0x5ab4e0, 0x14183a][kind];
  g.rect(-340, -380, 680, 760).fill(sky);
  if (kind === 0) {
    g.poly(ngon(160, -170, 60, 60, 16)).fill(0xffe27a);
    g.rect(-340, 160, 680, 220).fill(0xe8c47a);
    g.poly([-300, 170, -120, -120, 60, 170]).fill(0xc8963a).poly([-120, -120, 60, 170, -40, 170]).fill(0xa8762a);
    g.poly([20, 170, 170, -40, 320, 170]).fill(0xc8963a).poly([170, -40, 320, 170, 240, 170]).fill(0xa8762a);
  } else if (kind === 1) {
    g.poly(ngon(-180, -200, 40, 40, 14)).fill(0xf6ecc8);
    g.rect(-340, 200, 680, 180).fill(0x4a7a3a);
    g.rect(-180, -40, 360, 240).fill(0x9a9aa8);
    for (const tx of [-200, 140]) {
      g.rect(tx, -160, 60, 360).fill(0x8a8a98);
      g.poly([tx - 10, -160, tx + 30, -240, tx + 70, -160]).fill(0xc8202e);
    }
    for (let i = 0; i < 6; i++) g.rect(-180 + i * 64, -64, 36, 26).fill(0x9a9aa8);
    g.poly([-40, 200, -40, 90, 0, 60, 40, 90, 40, 200]).fill(0x3a2a1a);
    g.poly(streak(170, -240, 170, -300, 2, 2)).fill(INK).poly([170, -300, 220, -285, 170, -270]).fill(MUSTARD);
  } else if (kind === 2) {
    g.rect(-340, 140, 680, 240).fill(0x2a6aa8);
    for (let i = 0; i < 5; i++) g.poly(arcPts(-300 + i * 150, 170, 60, Math.PI, Math.PI * 2, 6), false).stroke({ width: 8, color: 0xd9f0ff });
    g.poly([-220, 100, 220, 100, 170, 180, -170, 180]).fill(0x7a4a24);
    g.poly([-220, 100, -260, 60, -180, 100]).fill(0x7a4a24);
    for (const [mx, mh] of [
      [-110, 260],
      [20, 320],
      [140, 240],
    ] as const) {
      g.poly(streak(mx, 100, mx, 100 - mh, 4, 4)).fill(0x4a2a14);
      g.poly([mx - 70, 100 - mh + 30, mx + 70, 100 - mh + 30, mx + 80, 100 - mh * 0.35, mx - 80, 100 - mh * 0.35]).fill(CREAM);
      g.rect(mx - 74, 100 - mh * 0.62, 148, 14).fill(CORAL);
    }
  } else {
    const r = rnd(2);
    for (let i = 0; i < 30; i++) g.rect(-330 + r() * 660, -370 + r() * 500, 4, 4).fill(0xffffff);
    g.poly(ngon(180, -230, 56, 56, 16)).fill(0xf6ecc8);
    g.rect(-340, 220, 680, 160).fill(0x3a3a4a);
    g.poly([-40, 130, -40, -150, 0, -240, 40, -150, 40, 130]).fill(0xf2f2f2).stroke({ width: 4, color: INK });
    g.poly([-40, 60, -90, 140, -40, 130]).fill(CORAL).poly([40, 60, 90, 140, 40, 130]).fill(CORAL);
    g.poly(ngon(0, -110, 16, 16, 12)).fill(0x5ab4e0).stroke({ width: 3, color: INK });
    g.poly([-30, 130, 30, 130, 0, 240]).fill(0xffa31a).poly([-14, 130, 14, 130, 0, 200]).fill(0xfff2a0);
  }
  return g;
}
const YEARS = ['-2560', '1200', '1492', '1969'];

/** souvenirs from every age (they tumble out of the arch): a little pyramid, a knight's helmet, a ship's wheel, a rocket */
function souvenir(i: number): Graphics {
  const g = new Graphics();
  const k = i % 4;
  const ink = { width: 3, color: INK, join: 'round' as const };
  if (k === 0) g.poly([-30, 22, 0, -28, 30, 22]).fill(0xc8963a).stroke(ink);
  else if (k === 1) {
    g.poly([-26, 26, -26, -10, 0, -30, 26, -10, 26, 26]).fill(STEEL).stroke(ink);
    g.rect(-20, -4, 40, 6).fill(INK);
  } else if (k === 2) {
    g.poly(ngon(0, 0, 26, 26, 12)).stroke({ width: 6, color: 0x7a4a24 });
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI;
      g.poly(streak(Math.cos(a) * -36, Math.sin(a) * -36, Math.cos(a) * 36, Math.sin(a) * 36, 3, 3)).fill(0x7a4a24);
    }
  } else {
    g.poly([-10, 24, -10, -16, 0, -32, 10, -16, 10, 24]).fill(0xf2f2f2).stroke(ink);
    g.poly([-10, 14, -22, 28, -10, 24]).fill(CORAL).poly([10, 14, 22, 28, 10, 24]).fill(CORAL);
  }
  return g;
}

interface St {
  arch: Container;
  led: Graphics;
  bulbsHot: { v: number };
}
const S = stash<St>();
const FLOOR = 864;
const TOP = 170;
const AR = 340;

export const miaubody: Signature = {
  dark: false,
  frame: RED_BOW,
  tag: 'UNIVERSO DE LA MÁQUINA DEL TIEMPO',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    apartment(g, W, H, 1, W / 2);
    // the arch: a riveted steel horseshoe, the tunnel inside, bulbs around it
    const arch = new Container();
    const frame = new Graphics();
    frame.poly(archPts(W / 2, FLOOR, TOP, AR + 30)).fill(INK);
    frame.poly(archPts(W / 2, FLOOR, TOP, AR + 22)).fill(STEEL);
    frame.poly(archPts(W / 2, FLOOR, TOP, AR - 26)).fill(0x5a646e);
    frame.rect(W / 2 - AR - 60, FLOOR - 30, AR * 2 + 120, 40).fill(0x5a646e).stroke({ width: 4, color: INK });
    const inside = new Container();
    const vg = new Graphics();
    inside.addChild(vg);
    const ages = [0, 1, 2, 3].map((i) => {
      const a = age(i);
      a.position.set(W / 2 + 900, TOP + AR + 40);
      a.visible = false;
      inside.addChild(a);
      return a;
    });
    const mask = new Graphics().poly(archPts(W / 2, FLOOR, TOP, AR - 34)).fill(0xffffff);
    inside.mask = mask;
    const bulbs = new Graphics();
    arch.addChild(frame, inside, mask, bulbs);
    const cons = console_(0.95);
    cons.k.position.set(W - 470, FLOOR - 420);
    k.addChild(g, arch, cons.k);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    const bulbsHot = { v: c.short || c.reduce ? 1 : 0 };
    S.set(c, { arch, led: cons.led, bulbsHot });
    const bpos: [number, number][] = [];
    const ring = archPts(W / 2, FLOOR, TOP, AR);
    for (let i = 2; i < ring.length - 2; i += 4) bpos.push([ring[i], ring[i + 1]]);
    for (let y = FLOOR - 60; y > TOP + AR; y -= 70) bpos.unshift([W / 2 - AR, y]), bpos.push([W / 2 + AR, y]);
    const drawBulbs = (t: number) => {
      bulbs.clear();
      bpos.forEach(([x, y], i) => {
        const on = bulbsHot.v > 0 && (i + Math.floor(t * 14)) % 3 === 0;
        bulbs.poly(ngon(x, y, 11, 11, 8)).fill(on ? 0xfff2a0 : bulbsHot.v > 0 ? 0xd9a63a : 0x7a7062).stroke({ width: 2, color: INK });
        if (on) bulbs.poly(ngon(x, y, 24, 24, 10)).fill({ color: 0xfff2a0, alpha: 0.3 * bulbsHot.v });
      });
      cons.lights.clear();
      for (let i = 0; i < 8; i++) cons.lights.poly(ngon((44 + i * 42) * 0.95, 160 * 0.95, 8, 8, 8)).fill(bulbsHot.v > 0 && (i + Math.floor(t * 9)) % 2 ? [CORAL, 0x8ad65a, MUSTARD][i % 3] : 0x5a5a62);
    };
    drawBulbs(0);
    vortex(vg, W / 2, TOP + AR, AR * 1.2, 0);
    showYear(cons.led, c.short ? 'HOY' : '----', 0.95);
    if (!c.reduce)
      every(c, 30, (t) => {
        if (bulbs.destroyed) return;
        drawBulbs(t);
        vortex(vg, W / 2, TOP + AR, AR * 1.2, t * (0.4 + bulbsHot.v));
        cons.reels.forEach((r, i) => (r.rotation = t * (2 + bulbsHot.v * 6) * (i ? -1 : 1)));
      });
    if (c.short) return;

    // the arch hums; the bulbs chase
    score(c, [
      [0.05, 'charge', 0.8],
      [0.2, 'zap', 0.5],
    ]);
    later(c, 0.2, () => (bulbsHot.v = 1));
    // the ages fly past inside, the counter rolling the years
    ages.forEach((a, i) => {
      later(c, 0.45 + i * 0.3, () => {
        if (a.destroyed) return;
        a.visible = true;
        showYear(cons.led, YEARS[i], 0.95);
        sfx('whoosh', 1 + i * 0.12);
        sfx('tick', 2.2);
        if (c.reduce) {
          a.x = W / 2;
          later(c, 0.28, () => !a.destroyed && (a.visible = false));
        } else gsap.fromTo(a, { x: W / 2 + 760 }, { x: W / 2 - 760, duration: 0.42, ease: 'sine.inOut', onComplete: () => !a.destroyed && (a.visible = false) });
      });
    });
    // he adjusts his glasses: a glint on each lens; «Ejem.»
    later(c, 1.8, () => {
      sfx('gem', 2);
      showYear(cons.led, 'HOY', 0.95);
      for (const [fx, fy] of [
        [0.43, 0.265],
        [0.57, 0.265],
      ] as const) {
        const [x, y] = onCat(c, fx, fy);
        const gl = new Graphics().poly(twinkle(0, 0, 34)).fill(0xffffff);
        gl.position.set(x, y);
        c.fg.addChild(gl);
        if (!c.reduce) gsap.fromTo(gl.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.12, yoyo: true, repeat: 1 });
        fadeKill(gl, 0.25, 0.1);
      }
      word(c, W / 2 + 330, 300, 'Ejem.', CREAM, 84, 0.7, F.serif);
    });
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('fanfare', 1.1);
    sfx('zap', 0.8);
    c.shaker.add(0.35);
    flashOf(c, 0xfff2c8, 0.7, 0.4);
    if (st) {
      st.bulbsHot.v = 1;
      if (!st.led.destroyed) showYear(st.led, 'HOY', 0.95);
    }
    // souvenirs from every age tumble out of the arch
    burst(c, c.fg, (i) => souvenir(i), 16, W / 2, c.catY - 120, 820, 1.4);
    fall(c, c.back, (i) => souvenir(i + 1), { n: 10, over: 1.2, dur: 1.2, bounce: true, spin: 4, spread: W * 0.7 });
    // ¡LLEGAMOS… (a beat) …A TIEMPO! …bueno, casi.
    aside(c, '¡LLEGAMOS…', CREAM, { delay: 0, dur: 2.3, size: 62, dy: -105 });
    later(c, 0.3, () => cheer(c, '¡A TIEMPO!', RED_BOW, 170, 2.0));
    aside(c, '…bueno, casi.', CREAM, { delay: 1.1, dur: 2.6, size: 52, dy: 100 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const g = new Graphics();
    apartment(g, w, h, s * 1.05, w / 2);
    const floor = h * 0.86;
    const top = h * 0.12;
    const ar = m * 0.36;
    const frame = new Graphics();
    frame.poly(archPts(w / 2, floor, top, ar + 30 * s)).fill(INK);
    frame.poly(archPts(w / 2, floor, top, ar + 22 * s)).fill(STEEL);
    frame.poly(archPts(w / 2, floor, top, ar - 26 * s)).fill(0x5a646e);
    const inside = new Container();
    const vg = new Graphics();
    vortex(vg, w / 2, top + ar, ar * 1.2, 0.4);
    // the four ages, built once: one at a time slides through (the still card shows the caravel coming in)
    const ags = [0, 1, 2, 3].map((i) => {
      const a = age(i);
      a.scale.set((ar * 2) / 680);
      a.position.set(w / 2 + ar * 0.55, top + ar + ar * 0.3);
      a.visible = i === 2;
      return a;
    });
    inside.addChild(vg, ...ags);
    const mask = new Graphics().poly(archPts(w / 2, floor, top, ar - 34 * s)).fill(0xffffff);
    inside.mask = mask;
    const bulbs = new Graphics();
    const ring = archPts(w / 2, floor, top, ar);
    const bpos: [number, number][] = [];
    for (let i = 2; i < ring.length - 2; i += 4) bpos.push([ring[i], ring[i + 1]]);
    const drawBulbs = (t: number) => {
      bulbs.clear();
      bpos.forEach(([x, y], i) => bulbs.poly(ngon(x, y, 11 * s, 11 * s, 8)).fill((i + Math.floor(t * 10)) % 3 === 0 ? 0xfff2a0 : MUSTARD));
    };
    drawBulbs(0);
    const cons = console_(s * 0.95);
    cons.k.position.set(Math.min(w / 2 + m * 0.62, w - 400 * s * 0.95 - m * 0.02), floor - 420 * s * 0.95);
    // a wide page: more of the penthouse (bookshelves and boomerang paintings along the wall)
    const deco = new Graphics();
    for (let x = w / 2 + m * 1.25; x < w - m * 0.2; x += m * 0.95) {
      deco.rect(x, floor - m * 0.62, m * 0.36, m * 0.62).fill(0x7a4a2a);
      for (let j = 0; j < 4; j++) {
        const y = floor - m * 0.6 + j * m * 0.15;
        deco.rect(x + m * 0.02, y + m * 0.13, m * 0.32, m * 0.015).fill(0x5a341c);
        for (let b = 0; b < 7; b++) deco.rect(x + m * (0.03 + b * 0.044), y + m * (0.03 + ((b * 7 + j) % 3) * 0.01), m * 0.034, m * (0.1 - ((b * 7 + j) % 3) * 0.01)).fill([CORAL, MUSTARD, CREAM, 0x5ab4b8][(b + j) % 4]);
      }
      deco.poly([x + m * 0.5, floor - m * 0.86, x + m * 0.78, floor - m * 0.92, x + m * 0.7, floor - m * 0.78, x + m * 0.62, floor - m * 0.84]).fill(MUSTARD);
    }
    for (let x = w / 2 - m * 1.25; x > m * 0.2; x -= m * 0.95) deco.poly(ngon(x, h * 0.22, m * 0.08, m * 0.08, 14)).fill(CREAM).stroke({ width: 3 * s, color: INK });
    showYear(cons.led, '1492', s * 0.95);
    k.addChild(g, deco, frame, inside, mask, bulbs, cons.k);
    if (live)
      liveLoop(k, (t) => {
        vortex(vg, w / 2, top + ar, ar * 1.2, t * 0.6);
        drawBulbs(t);
        const i = Math.floor(t / 1.6) % 4;
        const q = (t % 1.6) / 1.6;
        ags.forEach((a, j) => (a.visible = j === i));
        ags[i].x = w / 2 + ar * 1.6 - q * ar * 3.2;
        cons.reels.forEach((r, j) => (r.rotation = t * 3 * (j ? -1 : 1)));
        showYear(cons.led, YEARS[i], s * 0.95);
      });
    return k;
  },
};

