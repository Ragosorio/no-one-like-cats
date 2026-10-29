/**
 * Pinkmiau, el Ayudante de Química: the motorhome universe (the lab partner of a chemistry-teacher drama, kept
 * family-friendly: a lab flask and safety goggles ONLY — no crystals, no baggies, nothing else). The desert at sunset: a
 * violet-to-orange sky, the sun sinking behind purple mesas, yucca and stones, two tyre tracks leading to an old
 * cream-and-brown motorhome parked right behind him. It rocks and bubbles (¡BLUB, BLUB!), blue smoke leaks out of its
 * windows and puffs from the roof vent (¡FUUUSH!), then the door bangs open (¡PAM!): blue light floods out beside him and
 * blue bubbles pour up into the sky — LABORATORIO MÓVIL.
 * Payoff: his flask boils over in a fountain of blue bubbles, ball-and-stick molecules fly, every window glows blue;
 * ¡CIENCIA! / …y siempre con goggles.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, burst, cheer, every, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { puff, stash, vgrad } from './kitB';
import { aside, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { at, comic, pre, wrap } from './kitI';
import { glint } from './kitL';

const BLUE = 0x4fc3f7;
const BLUE_L = 0xb4ecff;
const BLUE_D = 0x1a6a9a;
const SKY = [0x2a1f5a, 0x6a2f7a, 0xc4487a, 0xff7a3a, 0xffc860];
const MESA_FAR = 0x8a4a7a;
const MESA = 0x5a2a5a;
const SAND = [0xd8844a, 0xb8643a, 0x9a4e30];
const CREAM = 0xf2e6c8;
const BROWN = 0x8a4a24;
const RUST = 0xc8642a;
const HZ = 640;
/** the motorhome: its body x0..x1, roof y, floor y; the door's x range */
const RX0 = 520;
const RX1 = 1640;
const RT = 330;
const RB = 760;
const DX0 = 1250;
const DX1 = 1370;

/** a soap-film bubble (r): a light blue disc, a rim, a highlight */
function bubble(r: number) {
  const g = new Graphics();
  g.poly(ngon(0, 0, r, r, 14)).fill({ color: BLUE, alpha: 0.45 }).stroke({ width: Math.max(2, r / 8), color: BLUE_L, alpha: 0.95 });
  g.poly(ngon(-r * 0.35, -r * 0.38, r * 0.26, r * 0.18, 8, -0.6)).fill({ color: 0xffffff, alpha: 0.9 });
  return g;
}

/** a ball-and-stick molecule (a big blue atom with 2–3 smaller ones) */
function molecule(s: number, n = 3) {
  const g = new Graphics();
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + 0.3;
    pts.push([Math.cos(a) * 42 * s, Math.sin(a) * 42 * s]);
  }
  for (const [x, y] of pts) g.poly(streak(0, 0, x, y, 5 * s, 5 * s)).fill(0xf2efe6).stroke({ width: 2 * s, color: C.ink });
  g.poly(ngon(0, 0, 22 * s, 22 * s, 14)).fill(BLUE).stroke({ width: 3 * s, color: C.ink });
  g.poly(ngon(-7 * s, -7 * s, 6 * s, 5 * s, 8)).fill(0xffffff);
  pts.forEach(([x, y], i) => {
    g.poly(ngon(x, y, 14 * s, 14 * s, 12)).fill(i % 2 ? 0xffffff : 0xe8505a).stroke({ width: 3 * s, color: C.ink });
    g.poly(ngon(x - 4 * s, y - 4 * s, 4 * s, 3 * s, 6)).fill(0xffffff);
  });
  return g;
}

/** the sunset desert: sky, the sinking sun, mesas, sand, tracks, yucca (w×h, horizon hz, scale k) */
function desert(g: Graphics, w: number, h: number, hz: number, k: number, sunX: number, x0 = -200) {
  vgrad(g, x0, x0, w - 2 * x0, hz - x0, SKY, 18);
  for (let i = 6; i >= 1; i--) g.poly(ngon(sunX, hz - 30 * k, (110 + i * 50) * k, (110 + i * 50) * k, 28)).fill({ color: 0xffe08a, alpha: 0.06 });
  g.poly(ngon(sunX, hz - 30 * k, 110 * k, 110 * k, 30)).fill(0xffe890);
  for (let i = 0; i < 4; i++) g.rect(sunX - 130 * k, hz - 60 * k + i * 16 * k, 260 * k, 5 * k).fill({ color: 0xff9a4a, alpha: 0.5 });
  // far and near mesas (flat tops, steep sides)
  const mesa = (x: number, mw: number, mh: number, col: number) =>
    g.poly([x, hz + 2, x + mw * 0.1, hz - mh * 0.8, x + mw * 0.16, hz - mh, x + mw * 0.8, hz - mh, x + mw * 0.86, hz - mh * 0.75, x + mw, hz + 2]).fill(col);
  mesa(x0 + 40 * k, 520 * k, 120 * k, MESA_FAR);
  mesa(w * 0.55, 600 * k, 150 * k, MESA_FAR);
  mesa(x0 + 300 * k, 380 * k, 170 * k, MESA);
  mesa(w * 0.72, 420 * k, 200 * k, MESA);
  g.rect(x0, hz, w - 2 * x0, h - hz - x0).fill(SAND[0]);
  for (let i = 1; i < 3; i++) g.rect(x0, hz + (h - hz) * (i / 3) * 0.6, w - 2 * x0, h - hz).fill({ color: SAND[i], alpha: 0.45 });
  const r = rnd(17);
  for (let i = 0; i < 26; i++) {
    const x = x0 + r() * (w - 2 * x0);
    const y = hz + 20 * k + r() * (h - hz) * 0.9;
    g.poly(ngon(x, y, (6 + r() * 14) * k, (3 + r() * 6) * k, 7)).fill({ color: 0x6a3420, alpha: 0.5 });
  }
}

/** a yucca in silhouette (origin at its foot) */
function yucca(g: Graphics, x: number, y: number, s: number, col = 0x3a2440) {
  g.poly([x - 6 * s, y, x + 6 * s, y, x + 4 * s, y - 70 * s, x - 4 * s, y - 70 * s]).fill(col);
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI / 2 + (i - 5) * 0.26;
    g.poly(streak(x, y - 70 * s, x + Math.cos(a) * 60 * s, y - 70 * s + Math.sin(a) * 60 * s, 5 * s, 1 * s)).fill(col);
  }
}

/** the old motorhome (absolute coords, scale k about its own box): body, stripes, cab-over, windows, vent, wheels */
function motorhome(g: Graphics, x0: number, x1: number, top: number, bot: number, dx0: number, dx1: number, k = 1) {
  const ink = { width: 5 * k, color: 0x2a1a12, join: 'round' as const };
  // the cab-over front on the left, the boxy body
  g.poly([x0, bot - 40 * k, x0 + 10 * k, top + 150 * k, x0 + 120 * k, top + 90 * k, x0 + 150 * k, top, x1 - 20 * k, top, x1, top + 20 * k, x1, bot - 40 * k]).fill(CREAM).stroke(ink);
  g.poly([x0 + 18 * k, top + 165 * k, x0 + 118 * k, top + 108 * k, x0 + 118 * k, top + 230 * k, x0 + 22 * k, top + 230 * k]).fill(0x3a5a7a).stroke(ink);
  g.poly([x0 + 30 * k, top + 172 * k, x0 + 60 * k, top + 155 * k, x0 + 50 * k, top + 215 * k]).fill({ color: 0xffffff, alpha: 0.4 });
  // brown and rust stripes along the side
  g.rect(x0 + 6 * k, top + 250 * k, x1 - x0 - 6 * k, 34 * k).fill(BROWN);
  g.rect(x0 + 8 * k, top + 290 * k, x1 - x0 - 8 * k, 16 * k).fill(RUST);
  g.poly([x0 + 150 * k, top + 60 * k, x1, top + 60 * k, x1, top + 76 * k, x0 + 140 * k, top + 76 * k]).fill(BROWN);
  // side windows with curtains (they glow blue later: drawn by the caller on top)
  for (let i = 0; i < 4; i++) {
    const wx = x0 + 200 * k + i * 230 * k;
    if (wx + 150 * k > dx0 - 20 * k && wx < dx1 + 20 * k) continue;
    g.rect(wx, top + 110 * k, 150 * k, 100 * k).fill(0x2a3a4a).stroke(ink);
    g.rect(wx + 6 * k, top + 116 * k, 40 * k, 88 * k).fill(0xd8b46a).rect(wx + 104 * k, top + 116 * k, 40 * k, 88 * k).fill(0xd8b46a);
  }
  // the door frame (the door itself is its own Graphics), steps
  g.rect(dx0, top + 70 * k, dx1 - dx0, bot - 40 * k - top - 70 * k).fill(0x1a1a24).stroke(ink);
  g.rect(dx0 + 10 * k, bot - 40 * k, dx1 - dx0 - 20 * k, 14 * k).fill(0x7a7a84).rect(dx0 + 20 * k, bot - 22 * k, dx1 - dx0 - 40 * k, 12 * k).fill(0x6a6a74);
  // the roof vent / pipe, an AC box, rust spots, a ladder at the back
  g.rect(x0 + 520 * k, top - 40 * k, 30 * k, 44 * k).fill(0x7a7a84).stroke({ width: 3 * k, color: 0x2a1a12 });
  g.rect(x0 + 510 * k, top - 48 * k, 50 * k, 12 * k).fill(0x5a5a64);
  g.rect(x0 + 700 * k, top - 30 * k, 140 * k, 32 * k).fill(0xd8d0bc).stroke({ width: 3 * k, color: 0x2a1a12 });
  for (const [rx, ry] of [
    [x0 + 380 * k, top + 330 * k],
    [x0 + 820 * k, top + 240 * k],
    [x1 - 120 * k, top + 320 * k],
  ])
    g.poly(ngon(rx, ry, 22 * k, 12 * k, 9)).fill({ color: RUST, alpha: 0.7 });
  for (let i = 0; i < 7; i++) g.rect(x1 - 6 * k, top + 30 * k + i * 44 * k, 16 * k, 6 * k).fill(0x5a5a64);
  g.rect(x0 - 10 * k, bot - 70 * k, 40 * k, 30 * k).fill(0xd8d0bc).stroke({ width: 3 * k, color: 0x2a1a12 });
  // wheels
  for (const wx of [x0 + 220 * k, x1 - 260 * k]) {
    g.poly(ngon(wx, bot - 30 * k, 70 * k, 70 * k, 16)).fill(0x16161c);
    g.poly(ngon(wx, bot - 30 * k, 36 * k, 36 * k, 12)).fill(0xb8b8c0);
    g.poly(ngon(wx, bot - 30 * k, 12 * k, 12 * k, 8)).fill(0x5a5a64);
  }
  g.poly(ngon((x0 + x1) / 2, bot + 30 * k, (x1 - x0) * 0.56, 26 * k, 20)).fill({ color: 0x3a1a10, alpha: 0.35 });
}

/** the motorhome's window glow (blue), drawn over its windows: `v` 0..1 */
function windowGlow(g: Graphics, x0: number, top: number, dx0: number, dx1: number, v: number, k = 1) {
  g.clear();
  if (v <= 0.01) return;
  for (let i = 0; i < 4; i++) {
    const wx = x0 + 200 * k + i * 230 * k;
    if (wx + 150 * k > dx0 - 20 * k && wx < dx1 + 20 * k) continue;
    g.rect(wx + 46 * k, top + 116 * k, 58 * k, 88 * k).fill({ color: BLUE_L, alpha: 0.85 * v });
    g.poly(ngon(wx + 75 * k, top + 160 * k, 120 * k, 80 * k, 14)).fill({ color: BLUE, alpha: 0.12 * v });
  }
}

interface St {
  glow: { v: number };
  sky: Container;
  door: Graphics;
}
const S = stash<St>();

export const pinkmiau: Signature = {
  dark: true,
  frame: BLUE,
  tag: 'UNIVERSO DE LA CASA RODANTE',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    desert(g, W, H + 200, HZ, 1, 380);
    // tyre tracks to the motorhome
    for (const d of [-1, 1]) g.poly([1200 + d * 40, RB + 10, 1200 + d * 70, RB + 10, 1200 + d * 260, H + 200, 1200 + d * 180, H + 200]).fill({ color: 0x7a3a22, alpha: 0.35 });
    yucca(g, 260, HZ + 160, 1.5);
    yucca(g, 1760, HZ + 120, 1.3);
    yucca(g, 1860, HZ + 260, 1.8);
    const rv = new Graphics();
    motorhome(rv, RX0, RX1, RT, RB, DX0, DX1, 1);
    const win = new Graphics();
    // the light inside the door (hidden until it bangs open) and the door on its hinge (right edge)
    const inner = new Graphics().rect(DX0, RT + 70, DX1 - DX0, RB - 40 - RT - 70).fill(BLUE_L);
    for (let i = 5; i >= 1; i--) inner.poly(ngon((DX0 + DX1) / 2, RB - 160, 70 * i, 90 * i, 16)).fill({ color: BLUE, alpha: 0.06 });
    inner.alpha = 0;
    const door = new Graphics();
    const dh = RB - 40 - RT - 70;
    door.rect(-(DX1 - DX0), 0, DX1 - DX0, dh).fill(CREAM).stroke({ width: 5, color: 0x2a1a12 });
    door.rect(-(DX1 - DX0) + 20, 30, DX1 - DX0 - 40, 90).fill(0x2a3a4a).stroke({ width: 4, color: 0x2a1a12 });
    door.rect(-(DX1 - DX0), 180, DX1 - DX0, 34).fill(BROWN).rect(-(DX1 - DX0), 220, DX1 - DX0, 16).fill(RUST);
    door.poly(ngon(-(DX1 - DX0) + 18, 260, 7, 7, 8)).fill(0x9a9aa4);
    door.position.set(DX1, RT + 70);
    const smoke = new Container();
    const bubbles = new Container();
    k.addChild(g, rv, win, inner, door, smoke, bubbles);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(0xffd8a8, 380, 0.45);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    const glow = { v: c.short ? 0.6 : 0.25 };
    S.set(c, { glow, sky: bubbles, door });
    const frame = () => {
      if (win.destroyed) return;
      windowGlow(win, RX0, RT, DX0, DX1, glow.v);
    };
    frame();
    if (!c.reduce) every(c, 20, frame);
    // a few bubbles keep rising out of the open door while the card is up
    const rise = (x: number, y: number, r: number, dur: number) => {
      const b = bubble(r);
      b.position.set(x, y);
      bubbles.addChild(b);
      if (c.reduce) {
        b.y = y - 200;
        gsap.to(b, { alpha: 0, delay: 0.9, duration: 0.3, onComplete: () => destroyTree(b) });
        return;
      }
      gsap.to(b, { y: y - 520 - Math.random() * 300, x: x + (Math.random() - 0.5) * 220, duration: dur, ease: 'sine.out' });
      gsap.to(b, { alpha: 0, delay: dur * 0.7, duration: dur * 0.3, onComplete: () => destroyTree(b) });
    };
    if (c.short) {
      door.scale.x = -0.3;
      inner.alpha = 1;
      return;
    }
    const blub = pre(c, comic('¡BLUB, BLUB!', BLUE_L, 84), 620, 280, -0.08);
    const fuu = pre(c, comic('¡FUUUSH!', BLUE_L, 96), 980, 170, 0.06);
    const pam = pre(c, comic('¡PAM!', 0xffffff, 120), 1480, 420, 0.1);
    const lab = pre(c, plate('LABORATORIO MÓVIL', BLUE, C.ink, 46), 520, 200, -0.05);
    // it rocks and bubbles; blue smoke leaks out of the windows
    at(c, 0.08, () => {
      blub(0.6);
      for (let i = 0; i < 4; i++) later(c, i * 0.12, () => sfx('pop', 0.7 + i * 0.12));
      if (!c.reduce) gsap.fromTo(k, { rotation: 0 }, { rotation: 0.004, duration: 0.07, yoyo: true, repeat: 7 });
      for (let i = 0; i < 3; i++) later(c, i * 0.1, () => puff(c, smoke, RX0 + 275 + i * 230, RT + 110, BLUE, 4, 46, 90));
    });
    // the roof vent puffs a big blue cloud
    at(c, 0.55, () => {
      fuu(0.6);
      sfx('whoosh', 0.7);
      puff(c, smoke, RX0 + 535, RT - 50, BLUE, 9, 86, 200);
      glow.v = 0.55;
    });
    // the door bangs open: blue light, bubbles pour out
    at(c, 1.0, () => {
      pam(0.6);
      sfx('boom', 0.9);
      sfx('splash', 1.3);
      c.shaker.add(0.2);
      if (c.reduce) {
        door.scale.x = -0.3;
        inner.alpha = 1;
      } else {
        gsap.to(door.scale, { x: -0.3, duration: 0.12, ease: 'power3.out' });
        gsap.to(inner, { alpha: 1, duration: 0.1 });
      }
      for (let i = 0; i < (c.reduce ? 5 : 16); i++) later(c, i * 0.05, () => rise(DX0 + 20 + Math.random() * (DX1 - DX0 - 40), RB - 120 - Math.random() * 200, 12 + Math.random() * 26, 1.6 + Math.random() * 0.6));
      puff(c, smoke, (DX0 + DX1) / 2, RB - 200, BLUE_L, 7, 70, 140);
    });
    at(c, 1.7, () => {
      lab(0.45);
      sfx('sting', 1.15);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1);
    sfx('splash', 0.9);
    c.shaker.add(0.25);
    flashOf(c, 0xd8f6ff, 0.45, 0.4);
    if (st) {
      st.glow.v = 1;
      if (!st.door.destroyed) st.door.scale.x = -0.3;
    }
    // the flask boils over: a fountain of bubbles out of its mouth, molecules everywhere
    const [fx, fy] = onCat(c, 0.31, 0.13);
    for (let i = 0; i < (c.reduce ? 6 : 22); i++)
      later(c, i * 0.05, () => {
        const b = bubble(10 + Math.random() * 24);
        b.position.set(fx + (Math.random() - 0.5) * 20, fy);
        c.fg.addChild(b);
        if (c.reduce) {
          b.position.set(fx + (Math.random() - 0.5) * 200, fy - 60 - Math.random() * 200);
          gsap.to(b, { alpha: 0, delay: 1.2, duration: 0.3, onComplete: () => destroyTree(b) });
          return;
        }
        gsap.to(b, { y: fy - 300 - Math.random() * 300, x: fx + (Math.random() - 0.5) * 420, duration: 1.4, ease: 'power2.out' });
        gsap.to(b, { alpha: 0, delay: 1.1, duration: 0.4, onComplete: () => destroyTree(b) });
        if (i % 4 === 0) sfx('pop', 1 + Math.random() * 0.6);
      });
    burst(c, c.fg, (i) => molecule(0.8 + (i % 3) * 0.25, 2 + (i % 2)), 10, fx, fy + 40, 640, 1.3);
    later(c, 0.35, () => glint(c, c.fg, ...onCat(c, 0.55, 0.2), 46));
    later(c, 0.6, () => glint(c, c.fg, ...onCat(c, 0.64, 0.21), 34));
    cheer(c, '¡CIENCIA!', BLUE_L, 150, 2.3);
    aside(c, '…y siempre con goggles.', 0xffffff, { delay: 0.6, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.2, h / 1080);
    const hz = h * 0.6;
    const cx = w / 2;
    const side = Math.min(w * 0.42, m * 0.85);
    const g = new Graphics();
    desert(g, w, h, hz, u, cx - side * 0.8, 0);
    yucca(g, cx - side, hz + 140 * u, 1.3 * u);
    yucca(g, cx + side * 1.05, hz + 200 * u, 1.6 * u);
    const rv = new Graphics();
    const rw = 1120 * u;
    const x0 = cx - rw * 0.4;
    const top = h * 0.3;
    const bot = h * 0.72;
    const dx0 = x0 + rw * 0.65;
    const dx1 = dx0 + 120 * u;
    motorhome(rv, x0, x0 + rw, top, bot, dx0, dx1, u);
    const inner = new Graphics().rect(dx0, top + 70 * u, dx1 - dx0, bot - 40 * u - top - 70 * u).fill(BLUE_L);
    const win = new Graphics();
    windowGlow(win, x0, top, dx0, dx1, 0.7, u);
    const bub = new Graphics();
    const draw = (t: number) => {
      bub.clear();
      for (let i = 0; i < 9; i++) {
        const q = (t * 0.22 + i / 9) % 1;
        const x = (dx0 + dx1) / 2 + Math.sin(q * 5 + i) * 60 * u + (i % 3 - 1) * 30 * u;
        const y = bot - 140 * u - q * h * 0.6;
        const r = (10 + (i % 4) * 6) * u + 1;
        bub.poly(ngon(x, y, r, r, 12)).fill({ color: BLUE, alpha: 0.45 * (1 - q) }).stroke({ width: Math.max(1, r / 8), color: BLUE_L, alpha: 1 - q });
        bub.poly(twinkle(x - r * 0.35, y - r * 0.35, r * 0.35, 0.3)).fill({ color: 0xffffff, alpha: 1 - q });
      }
    };
    k.addChild(g, rv, inner, win, bub);
    draw(0.5);
    if (live) liveLoop(k, (t) => draw(t + 0.5));
    return k;
  },
};
