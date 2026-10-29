/**
 * The Miauknd, el del Traje Rojo: the endless-night universe (the R&B star in the red suit, retro synths, a neon city at
 * three in the morning). A black-violet sky over a skyline of lit windows; a highway runs straight into the horizon
 * between two magenta grids, the dashes and the lamp posts rushing at us, headlights coming, taillights going. A red
 * sports car tears past from behind and shrinks into the horizon (¡VRRRUUUM!); then the neon signs buzz on one by one
 * (a fish, a cat's head, a heart, ABIERTO, the clock at 3:00), BZZT, and a red neon ring lights up behind him, segment
 * by segment.
 * Payoff: every sign at full, the grids pulse — and a sliver of dawn tries to rise on the horizon and sinks right back;
 * ¡QUE NO AMANEZCA! / …y el día ni lo extraña.
 * (No song names, no lyrics, no real person's face: a cat in a red suit and his city.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, backlight, burst, every, flashOf, later, score } from './kit';
import { hideDisc, segText } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, bandPts, ngon, rnd, starfield, streak, twinkle } from './kitD';
import { at, comic, flat, park, take, heartPts, neonWord, payline, pre, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const RED = 0xff2a3a;
const SUIT = 0xc8102e;
const MAG = 0xff3fa4;
const CYAN = 0x3ff0ff;
const AMBER = 0xffc94a;
const SKY = [0x05030c, 0x0e0620, 0x2a0a3a, 0x6a1050, 0xb0206a];
const HZ = 600;

/** the skyline on the horizon: towers with lit windows (magenta, cyan, amber), a neon rim on a few tops */
function skyline(w: number, hz: number, k: number, seed: number) {
  const g = new Graphics();
  const r = rnd(seed);
  for (let pass = 0; pass < 2; pass++) {
    for (let x = -30 * k; x < w; ) {
      const bw = (60 + r() * 120) * k * (pass ? 1 : 0.8);
      const bh = (pass ? 80 + r() * 300 : 140 + r() * 260) * k;
      const col = pass ? 0x120a22 : 0x1c1030;
      g.rect(x, hz - bh, bw, bh + 2).fill(col);
      if (pass) {
        for (let wy = hz - bh + 14 * k; wy < hz - 10 * k; wy += 18 * k)
          for (let wx = x + 8 * k; wx < x + bw - 10 * k; wx += 16 * k) {
            const q = r();
            if (q < 0.3) g.rect(wx, wy, 8 * k, 9 * k).fill({ color: q < 0.1 ? MAG : q < 0.18 ? CYAN : AMBER, alpha: 0.75 });
          }
        if (r() < 0.35) g.rect(x, hz - bh, bw, 3 * k).fill(r() < 0.5 ? MAG : CYAN);
        if (r() < 0.2) g.poly(streak(x + bw / 2, hz - bh, x + bw / 2, hz - bh - 50 * k, 2 * k, 1 * k)).fill(0x120a22).poly(ngon(x + bw / 2, hz - bh - 50 * k, 4 * k, 4 * k, 6)).fill(RED);
      }
      x += bw + (pass ? 4 : 30) * k;
    }
  }
  return g;
}

/**
 * the drive (redrawn each frame): black ground, a magenta grid on both sides, the highway into the vanishing point with
 * neon edges and dashes, lamp posts, oncoming headlights and receding taillights. `ph` = distance driven.
 */
function drawRoad(g: Graphics, w: number, h: number, hz: number, k: number, ph: number, pulse: number) {
  g.clear();
  g.rect(0, hz, w, h - hz).fill(0x07040e);
  const cx = w / 2;
  const yOf = (z: number) => hz + (h - hz) * (0.6 / z);
  const xOf = (x: number, z: number) => cx + (x * (w * 0.5)) / z;
  // grid: horizontal lines moving toward us, radial lines from the vanishing point
  const ga = 0.35 + 0.4 * pulse;
  for (let j = 0; j < 14; j++) {
    const z = 0.6 + ((j - (ph % 1)) * 0.55 + 7.7) % 7.7;
    const y = yOf(z);
    if (y > h + 4 || y < hz) continue;
    g.rect(0, y, w, Math.max(1, (2.4 * k) / Math.max(0.6, z * 0.6))).fill({ color: MAG, alpha: ga * Math.min(1, 1.6 / z) });
  }
  for (let i = -9; i <= 9; i++) {
    if (Math.abs(i) < 2) continue;
    g.poly(streak(cx + i * 6 * k, hz, cx + i * w * 0.18, h, 0.4 * k, 2.2 * k)).fill({ color: MAG, alpha: ga * 0.8 });
  }
  // the highway
  const rw = 0.42;
  g.poly([cx - 8 * k, hz, cx + 8 * k, hz, xOf(rw, 0.6), h, xOf(-rw, 0.6), h]).fill(0x16101e);
  g.poly(streak(cx - 7 * k, hz, xOf(-rw, 0.6), h, 0.6 * k, 4 * k)).fill(RED);
  g.poly(streak(cx + 7 * k, hz, xOf(rw, 0.6), h, 0.6 * k, 4 * k)).fill(RED);
  for (let j = 0; j < 9; j++) {
    const z0 = 0.62 + ((j * 0.9 - (ph % 1) * 0.9 + 8.1) % 8.1);
    const z1 = z0 + 0.45;
    const y0 = yOf(z0);
    const y1 = yOf(z1);
    const hw0 = (6 * k) / z0;
    const hw1 = (6 * k) / z1;
    g.poly([cx - hw1, y1, cx + hw1, y1, cx + hw0, y0, cx - hw0, y0]).fill({ color: 0xfff1d8, alpha: 0.85 });
  }
  // lamp posts on both sides, coming at us
  for (let j = 0; j < 6; j++) {
    const z = 0.65 + ((j * 1.3 - (ph % 2) * 1.3 + 7.8) % 7.8);
    const y = yOf(z);
    for (const s of [-1, 1]) {
      const x = xOf(s * (rw + 0.08), z);
      const hh = (230 * k) / z;
      g.poly(streak(x, y, x, y - hh, (3 * k) / z, (2 * k) / z)).fill(0x2a1e3a);
      g.poly(streak(x, y - hh, x - (s * 40 * k) / z, y - hh, (2 * k) / z, (2 * k) / z)).fill(0x2a1e3a);
      g.poly(ngon(x - (s * 40 * k) / z, y - hh + (4 * k) / z, (14 * k) / z, (6 * k) / z, 8)).fill({ color: AMBER, alpha: 0.9 });
      g.poly(ngon(x - (s * 40 * k) / z, y - hh + (8 * k) / z, (34 * k) / z, (16 * k) / z, 10)).fill({ color: AMBER, alpha: 0.16 });
    }
  }
  // headlights coming (left lane), taillights going (right lane)
  for (let j = 0; j < 3; j++) {
    const zc = 0.7 + ((j * 2.4 - ph * 1.6 + 7.2) % 7.2);
    const y = yOf(zc);
    const x = xOf(-0.2, zc);
    const s = (12 * k) / zc;
    for (const d of [-1, 1]) {
      g.poly(ngon(x + d * s * 2.2, y - s, s * 2.6, s * 1.6, 10)).fill({ color: 0xfff6e0, alpha: 0.18 });
      g.poly(ngon(x + d * s * 2.2, y - s, s, s * 0.7, 8)).fill(0xffffff);
    }
    const zt = 0.9 + ((j * 2.4 + ph * 0.5) % 7.2);
    const yt = yOf(zt);
    const xt = xOf(0.2, zt);
    const st = (10 * k) / zt;
    for (const d of [-1, 1]) g.poly(ngon(xt + d * st * 2.4, yt - st, st * 1.1, st * 0.6, 8)).fill(RED);
  }
}

/** a neon sign: a glowing outline (a wide faint stroke + a thin bright one) of the polygon(s) `polys` */
function neon(polys: number[][], col: number, width = 6) {
  const g = new Graphics();
  for (const p of polys) g.poly(p).stroke({ width: width * 3.4, color: col, alpha: 0.22, join: 'round' });
  for (const p of polys) g.poly(p).stroke({ width, color: col, alpha: 1, join: 'round' });
  for (const p of polys) g.poly(p).stroke({ width: width * 0.35, color: 0xffffff, alpha: 0.9, join: 'round' });
  return g;
}

/** the signs of the city (each a node at its spot, off until lit): fish, cat head, heart, ABIERTO, the clock */
function signs(k: number, pos: [number, number][]) {
  const fish = neon(
    [
      [-60, 0, -20, -28, 30, -22, 60, 0, 30, 22, -20, 28],
      [60, 0, 92, -26, 86, 0, 92, 26],
    ].map((p) => p.map((v) => v * k)),
    CYAN,
    6 * k,
  );
  const cat = neon([[-46, 30, -50, -20, -40, -56, -16, -30, 16, -30, 40, -56, 50, -20, 46, 30, 0, 46].map((v) => v * k)], MAG, 6 * k);
  const heart = neon([heartPts(0, 0, 52 * k, 20)], RED, 6 * k);
  const open = neonWord('ABIERTO', 46 * k, 0xfff0d0, AMBER, F.bebas);
  const clock = new Container();
  const cb = new Graphics().roundRect(-110 * k, -46 * k, 220 * k, 92 * k, 14 * k).fill({ color: 0x14060c, alpha: 0.9 }).stroke({ width: 4 * k, color: RED, alpha: 0.6 });
  const cd = new Graphics();
  segText(cd, '3', -88 * k, -30 * k, 60 * k, RED, 0.08);
  cd.rect(-38 * k, -14 * k, 8 * k, 8 * k).fill(RED).rect(-38 * k, 8 * k, 8 * k, 8 * k).fill(RED);
  segText(cd, '00', -22 * k, -30 * k, 60 * k, RED, 0.08);
  const am = flat('A.M.', { fontFamily: F.bebas, fontSize: 26 * k, fill: RED });
  am.position.set(84 * k, 20 * k);
  clock.addChild(cb, cd, am);
  const all = [fish, cat, heart, open, clock];
  all.forEach((n, i) => n.position.set(pos[i][0], pos[i][1]));
  return all;
}

/** a red neon ring segment by segment (lit = fraction), r = radius */
function ring(g: Graphics, r: number, lit: number, pulse: number) {
  g.clear();
  const n = 24;
  const m = Math.round(lit * n);
  for (let i = 0; i < m; i++) {
    const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2 + 0.03;
    const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2 - 0.03;
    g.poly(bandPts(0, 0, r - 26, r + 26, a0, a1, 3)).fill({ color: RED, alpha: 0.12 + 0.08 * pulse });
    g.poly(bandPts(0, 0, r - 7, r + 7, a0, a1, 3)).fill({ color: RED, alpha: 0.95 });
    g.poly(bandPts(0, 0, r - 2, r + 2, a0, a1, 3)).fill({ color: 0xffe0e4, alpha: 0.9 });
  }
}

interface St {
  sg: Container[];
  lit: boolean[];
  pulse: { v: number };
  dawn: Graphics;
  speed: { v: number };
  ringLit: { v: number };
}
const S = stash<St>();

export const miauknd: Signature = {
  dark: true,
  frame: SUIT,
  tag: 'UNIVERSO DE LA NOCHE SIN FIN',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, HZ, SKY, 18);
    starfield(sky, 0, 0, W, HZ * 0.6, 70, 33, 0xffffff, 2.2);
    // a thin red crescent: the only moon this city allows
    sky.poly([1540, 120, 1600, 150, 1626, 214, 1606, 276, 1556, 306, 1588, 262, 1598, 214, 1584, 164]).fill(RED);
    const dawn = new Graphics();
    vgrad(dawn, 0, HZ - 160, W, 160, [0x6a1050, 0xff7a3a, 0xffc94a], 8);
    dawn.alpha = 0;
    const city = skyline(W, HZ, 1, 7);
    const road = new Graphics();
    const sg = signs(1.45, [
      [330, 360],
      [600, 220],
      [1380, 250],
      [1640, 420],
      [300, 150],
    ]);
    const lit = sg.map(() => !!(c.short || c.reduce));
    sg.forEach((n, i) => (n.alpha = lit[i] ? 1 : 0.12));
    const rg = new Graphics();
    rg.position.set(W / 2, c.catY - 30);
    // a magenta backlight: the silhouette has to read on a black night
    const bl = backlight(MAG, 380, 0.55);
    bl.position.set(W / 2, c.catY - 20);
    c.behind.addChild(bl, rg);
    k.addChild(sky, dawn, city, road, ...sg);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const pulse = { v: 0 };
    const speed = { v: c.short ? 0.6 : c.reduce ? 0 : 1.6 };
    const ringLit = { v: c.short || c.reduce ? 1 : 0 };
    S.set(c, { sg, lit, pulse, dawn, speed, ringLit });
    const mkLine = () => neonWord('¡QUE NO AMANEZCA!', 104, 0xffe6f2, MAG, F.heavy);
    if (!c.short) at(c, 1.9, () => park(c, 'line', mkLine()));
    let ph = 0.3;
    let last = 0;
    const frame = (t: number) => {
      if (road.destroyed) return;
      const dt = Math.min(0.1, t - last);
      last = t;
      ph += dt * speed.v;
      const beat = (t * 110) / 60;
      const kick = c.reduce ? 0.5 : Math.max(0, 1 - (beat % 1) * 2.4);
      drawRoad(road, W, H, HZ, 1, ph, Math.max(kick * 0.6, pulse.v));
      if (!rg.destroyed) ring(rg, 300, ringLit.v, kick);
      sg.forEach((n, i) => {
        if (n.destroyed || !lit[i]) return;
        n.alpha = c.reduce ? 1 : 0.86 + 0.14 * Math.sin(t * 13 + i * 3) * (i === 3 ? 1.6 : 0.6);
      });
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // the red car tears past from behind and shrinks into the horizon
    const car = new Container();
    const cg = new Graphics();
    cg.poly([-170, 0, -160, -46, -90, -60, -40, -100, 70, -100, 120, -60, 170, -46, 176, 0]).fill(0x8a0a1a).stroke({ width: 5, color: 0x1a0008, join: 'round' });
    cg.poly([-30, -92, 60, -92, 98, -60, -60, -60]).fill(0x1a0a2a);
    cg.rect(-176, -34, 70, 16).fill(RED).rect(106, -34, 70, 16).fill(RED);
    cg.rect(-176, -38, 70, 24).fill({ color: RED, alpha: 0.3 }).rect(106, -38, 70, 24).fill({ color: RED, alpha: 0.3 });
    cg.poly(ngon(-110, 0, 32, 14, 10)).fill(0x0a0a10).poly(ngon(110, 0, 32, 14, 10)).fill(0x0a0a10);
    const tl = new Graphics();
    car.addChild(tl, cg);
    car.position.set(W / 2 + 240, H + 140);
    car.scale.set(1.6);
    c.back.addChild(car);
    if (c.reduce) car.visible = false;
    else {
      const p = { u: 0 };
      gsap.to(p, {
        u: 1,
        duration: 0.95,
        delay: 0.12,
        ease: 'power2.out',
        onUpdate: () => {
          if (car.destroyed) return;
          const y = H + 140 + (HZ + 6 - H - 140) * p.u;
          const x = W / 2 + 240 - 230 * p.u;
          car.position.set(x, y);
          car.scale.set(1.6 * Math.pow(1 - p.u, 1.4) + 0.02);
          tl.clear();
          if (p.u > 0.05) for (const d of [-1, 1]) tl.poly(streak(d * 140, -26, d * 160, 300, 8, 30)).fill({ color: RED, alpha: 0.35 * (1 - p.u) });
        },
        onComplete: () => destroyTree(car),
      });
    }

    // words, built now
    const vrum = pre(c, comic('¡VRRRUUUM!', RED, 130, F.comic), 600, 760, -0.1);
    const bz = [0, 1, 2].map((i) => pre(c, flat('BZZT', { fontFamily: F.heavy, fontSize: 58, fill: 0xffffff, stroke: { color: MAG, width: 7, join: 'round' } }), [470, 1480, 1500][i], [470, 380, 540][i], (i - 1) * 0.12));
    at(c, 0.28, () => {
      vrum(0.7);
      sfx('whoosh', 0.55);
      sfx('charge', 0.7);
      c.shaker.add(0.15);
    });
    // the signs buzz on, one by one
    [0.55, 0.78, 1.0, 1.22, 1.44].forEach((d, i) =>
      at(c, d, () => {
        const n = sg[i];
        if (n.destroyed) return;
        lit[i] = true;
        sfx('zap', 2.2 - i * 0.12);
        if (c.reduce) n.alpha = 1;
        else gsap.fromTo(n, { alpha: 0.12 }, { alpha: 1, duration: 0.14, ease: 'steps(3)' });
        if (i === 0) bz[0](0.4, { from: 1.4 });
        if (i === 2) bz[1](0.4, { from: 1.4 });
        if (i === 4) bz[2](0.4, { from: 1.4 });
      }),
    );
    // the ring lights up behind him, segment by segment
    at(c, 1.6, () => {
      sfx('charge', 1.4);
      if (c.reduce) ringLit.v = 1;
      else gsap.to(ringLit, { v: 1, duration: 0.45, ease: 'none' });
    });
    score(c, [
      [0.0, 'boom', 0.42],
      [0.55, 'boom', 0.42],
      [1.1, 'boom', 0.42],
      [1.64, 'boom', 0.42],
      [0.27, 'tick', 1.6],
      [0.82, 'tick', 1.6],
      [1.37, 'tick', 1.6],
    ]);
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 0.9);
    sfx('bigboom', 0.7);
    c.shaker.add(0.35);
    flashOf(c, MAG, 0.4, 0.4);
    if (st) {
      st.sg.forEach((n, i) => {
        st.lit[i] = true;
        if (!n.destroyed) n.alpha = 1;
      });
      st.pulse.v = 1;
      if (st.ringLit.v < 1) st.ringLit.v = 1;
      gsap.to(st.pulse, { v: 0.4, duration: 1.4, delay: 0.3 });
      if (!c.reduce) gsap.to(st.speed, { v: 2.4, duration: 0.3 });
      // a sliver of dawn tries to rise… and sinks back
      const d = st.dawn;
      if (!d.destroyed) {
        if (c.reduce) d.alpha = 0;
        else {
          gsap.to(d, { alpha: 0.85, duration: 0.45, delay: 0.25, ease: 'power1.out' });
          gsap.to(d, { alpha: 0, duration: 0.5, delay: 1.0, ease: 'power2.in' });
          later(c, 1.0, () => sfx('whoosh', 0.4));
        }
      }
    }
    burst(c, c.fg, (i) => new Graphics().poly(twinkle(0, 0, 10)).fill(i % 3 === 0 ? MAG : i % 3 === 1 ? CYAN : RED), 28, W / 2, c.catY - 60, 900, 1.4);
    payline(c, take(c, 'line', () => neonWord('¡QUE NO AMANEZCA!', 104, 0xffe6f2, MAG, F.heavy)), '…y el día ni lo extraña.', {
      dur: 2.4,
      asideStyle: { fill: 0xffd6ec, stroke: { color: 0x2a0018, width: 8, join: 'round' } },
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.3, h / 1080);
    const hz = h * 0.56;
    const sky = vgrad(new Graphics(), 0, 0, w, hz, SKY, 14);
    starfield(sky, 0, 0, w, hz * 0.6, Math.round(w / 30), 41, 0xffffff, 2 * u + 0.4);
    const city = skyline(w, hz, u, 13);
    const road = new Graphics();
    const side = Math.min(w * 0.42, m * 0.8);
    const sg = signs(u, [
      [w / 2 - side * 0.8, hz - 230 * u],
      [w / 2 - side * 0.45, hz - 380 * u],
      [w / 2 + side * 0.5, hz - 330 * u],
      [w / 2 + side * 0.85, hz - 200 * u],
      [w / 2 - side * 0.95, hz - 420 * u],
    ]);
    const rg = new Graphics();
    rg.position.set(w / 2, h * 0.5);
    rg.scale.set((m / 1080) * 1.05);
    ring(rg, 300, 1, 0.5);
    k.addChild(sky, city, road, rg, ...sg);
    drawRoad(road, w, h, hz, u, 0.3, 0.4);
    if (live)
      liveLoop(k, (t) => {
        const beat = (t * 110) / 60;
        const kick = Math.max(0, 1 - (beat % 1) * 2.4);
        drawRoad(road, w, h, hz, u, 0.3 + t * 0.7, kick * 0.6);
        ring(rg, 300, 1, kick);
        sg.forEach((n, i) => (n.alpha = 0.86 + 0.14 * Math.sin(t * 13 + i * 3)));
      });
    return k;
  },
};
