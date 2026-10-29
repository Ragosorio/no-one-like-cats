/**
 * Romiau Santos, el Rey de la Bachata: the bachata universe (the king of the romantic Caribbean guitar). A tropical
 * night on the bay: a huge moon, its path of light on the sea, palms, a white colonial balcony with its door lit and
 * bougainvillea on the rail, the malecón below with a lamp and a fish basket. Six gold strings of his requinto cross the
 * whole sky behind him and ring on every strum (¡TIRIRÍN!); the balcony door opens and a cat leans out, sighing hearts;
 * then the fish of the market jump out of the sea by themselves, one, two, three, straight into the basket (¡SPLASH!),
 * each with a heart over its head — NOCHE DE BACHATA.
 * Payoff: the strings blaze, roses and petals rain, hearts rise over the bay; ¡QUÉ ROMÁNTICO! / …hasta los pescados se
 * enamoraron.
 * (No song names, no lyrics, no real person's face: a cat in a white suit with his guitar.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, backlight, cheer, every, fall, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, ngon, rnd, starfield, streak } from './kitD';
import { at, comic, heartPts, petalPts, pre, rose, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const RED = 0xc8102e;
const NAVY = 0x1b1b2f;
const GOLD = 0xf2d27a;
const MOON = 0xfff4dc;
const SKY = [0x040818, 0x0a1636, 0x16285a, 0x2c3c78];
const HZ = 640;

/** a palm in silhouette (origin at its foot): a curved trunk and a crown of fronds, leaning `lean` */
function palm(g: Graphics, x: number, y: number, s: number, lean: number, col = 0x060a16) {
  const pts: number[] = [];
  const back: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const px = x + lean * s * 160 * u * u;
    const py = y - s * 420 * u;
    const wdt = s * (16 - 8 * u);
    pts.push(px - wdt, py);
    back.unshift(px + wdt, py);
  }
  g.poly([...pts, ...back]).fill(col);
  const tx = x + lean * s * 160;
  const ty = y - s * 420;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.48 + lean * 0.2;
    const L = s * (150 + (i % 2) * 40);
    const ex = tx + Math.cos(a) * L;
    const ey = ty + Math.sin(a) * L * 0.6 + L * 0.35;
    const mx = tx + Math.cos(a) * L * 0.5;
    const my = ty + Math.sin(a) * L * 0.5 - s * 10;
    g.poly([tx, ty, mx - Math.sin(a) * s * 22, my + Math.cos(a) * s * 14, ex, ey, mx + Math.sin(a) * s * 8, my - Math.cos(a) * s * 4]).fill(col);
  }
  g.poly(ngon(tx, ty + s * 10, s * 18, s * 14, 8)).fill(col);
}

/** the colonial balcony (left): white wall, an arched door with warm light, a wrought-iron rail, bougainvillea */
function balcony(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-200 * s, -380 * s, 400 * s, 420 * s).fill(0xe8e2d4);
  g.rect(-200 * s, -380 * s, 400 * s, 20 * s).fill(0xcac2b0);
  // the arched door's warm light
  const arch: number[] = [-70 * s, 0, -70 * s, -220 * s];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    arch.push(Math.cos(a) * 70 * s, -220 * s + Math.sin(a) * 70 * s);
  }
  arch.push(70 * s, 0);
  g.poly(arch).fill(0xffc26a);
  g.poly(arch).stroke({ width: 8 * s, color: 0x5a3a2a });
  // shutters
  g.rect(-130 * s, -280 * s, 50 * s, 280 * s).fill(0x2a6a6a).rect(80 * s, -280 * s, 50 * s, 280 * s).fill(0x2a6a6a);
  for (let i = 0; i < 9; i++) g.rect(-126 * s, -270 * s + i * 30 * s, 42 * s, 4 * s).fill(0x1a4a4a).rect(84 * s, -270 * s + i * 30 * s, 42 * s, 4 * s).fill(0x1a4a4a);
  // the floor slab and the iron rail
  const rail = new Graphics();
  rail.rect(-220 * s, 0, 440 * s, 22 * s).fill(0xcac2b0);
  rail.rect(-210 * s, -110 * s, 420 * s, 8 * s).fill(0x14141c);
  for (let i = 0; i <= 14; i++) rail.rect(-208 * s + i * 30 * s, -106 * s, 5 * s, 106 * s).fill(0x14141c);
  for (let i = 0; i < 7; i++) rail.poly(ngon(-195 * s + i * 60 * s, -56 * s, 14 * s, 22 * s, 10)).stroke({ width: 3 * s, color: 0x14141c });
  // bougainvillea spilling over the rail
  const r = rnd(8);
  for (let i = 0; i < 40; i++) {
    const x = (r() - 0.5) * 440 * s;
    const y = -118 * s + r() * 60 * s + (Math.abs(x) > 150 * s ? r() * 80 * s : 0);
    rail.poly(ngon(x, y, (10 + r() * 8) * s, (8 + r() * 6) * s, 6, r() * 3)).fill(r() < 0.7 ? 0xd8306a : 0x2e7a3a);
  }
  // the cat in the doorway (silhouette with a rim of warm light), hidden until the door opens
  const lady = new Graphics();
  lady.poly(ngon(0, -110 * s, 44 * s, 70 * s, 14)).fill(0x2a1418);
  lady.poly(ngon(0, -200 * s, 34 * s, 30 * s, 12)).fill(0x2a1418);
  lady.poly([-28 * s, -212 * s, -24 * s, -252 * s, -6 * s, -226 * s]).fill(0x2a1418).poly([28 * s, -212 * s, 24 * s, -252 * s, 6 * s, -226 * s]).fill(0x2a1418);
  lady.poly(ngon(30 * s, -214 * s, 12 * s, 8 * s, 8)).fill(RED);
  lady.poly(streak(-40 * s, -130 * s, -60 * s, -112 * s, 10 * s, 10 * s)).fill(0x2a1418);
  k.addChild(g, lady, rail);
  return { k, lady };
}

/** a fish (silver-blue, a tail, an eye), centered, s = scale */
function fish(s: number) {
  const g = new Graphics();
  g.poly(ngon(0, 0, 34 * s, 15 * s, 14)).fill(0x8ab0d8).stroke({ width: 3 * s, color: C.ink });
  g.poly([-30 * s, 0, -52 * s, -16 * s, -52 * s, 16 * s]).fill(0x6a90c0).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.poly(ngon(18 * s, -4 * s, 4 * s, 4 * s, 8)).fill(C.ink);
  g.poly(streak(-6 * s, -12 * s, 8 * s, 10 * s, 1 * s, 1 * s)).fill({ color: C.ink, alpha: 0.5 });
  return g;
}

/** the wicker basket on the malecón (origin at its bottom center) */
function basket(s: number) {
  const g = new Graphics();
  g.poly([-90 * s, -90 * s, 90 * s, -90 * s, 70 * s, 0, -70 * s, 0]).fill(0xb8844a).stroke({ width: 4 * s, color: 0x5a3a1e, join: 'round' });
  for (let i = 1; i < 5; i++) g.rect(-90 * s + i * 4 * s, -90 * s + i * 18 * s, 180 * s - i * 8 * s, 4 * s).fill(0x8a5a2e);
  for (let i = -3; i <= 3; i++) g.poly(streak(i * 24 * s, -90 * s, i * 19 * s, 0, 2 * s, 2 * s)).fill(0x8a5a2e);
  g.poly(ngon(0, -92 * s, 92 * s, 14 * s, 18)).fill(0x5a3a1e);
  return g;
}

/**
 * the six strings of the requinto crossing the sky (lower left → upper right), vibrating with `amp` (0..1); redrawn
 */
function strings(g: Graphics, w: number, h: number, t: number, amp: number, glow: number, k = 1) {
  g.clear();
  const x0 = -60 * k;
  const y0 = h * 0.86;
  const x1 = w + 60 * k;
  const y1 = h * 0.12;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const N = 22;
  for (let s = 0; s < 6; s++) {
    const off = (s - 2.5) * 26 * k;
    const wdt = (2.2 + (5 - s) * 0.5) * k;
    const pts: number[] = [];
    const back: number[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const d = amp * 14 * k * Math.sin(Math.PI * u) * Math.sin(t * (40 + s * 6) + s);
      const x = x0 + (x1 - x0) * u + nx * (off + d);
      const y = y0 + (y1 - y0) * u + ny * (off + d);
      pts.push(x + nx * wdt, y + ny * wdt);
      back.unshift(x - nx * wdt, y - ny * wdt);
    }
    g.poly([...pts, ...back]).stroke({ width: 10 * k, color: GOLD, alpha: 0.1 + 0.14 * glow });
    g.poly([...pts, ...back]).fill({ color: GOLD, alpha: 0.75 + 0.25 * glow });
  }
}

/** the moon's path of light on the sea, shimmering with t */
function moonPath(g: Graphics, cx: number, hz: number, h: number, t: number, k = 1) {
  g.clear();
  for (let i = 0; i < 22; i++) {
    const v = i / 22;
    const y = hz + 10 * k + v * v * (h - hz - 120 * k);
    const half = (30 + v * 260) * k * (0.6 + 0.4 * Math.sin(t * 2 + i * 1.7));
    const x = cx + Math.sin(t * 1.3 + i) * 10 * k;
    g.poly(streak(x - half, y, x + half, y, (1 + v * 3) * k, (1 + v * 3) * k)).fill({ color: MOON, alpha: 0.5 - v * 0.25 });
  }
}

interface St {
  amp: { v: number };
  glow: { v: number };
  hearts: Container;
}
const S = stash<St>();

export const romiau: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO DE LA BACHATA',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, HZ, SKY, 16);
    starfield(sky, 0, 0, W, HZ * 0.7, 80, 61, 0xffffff, 2.2);
    const mx = W * 0.73;
    for (let i = 7; i >= 1; i--) sky.poly(ngon(mx, 250, 150 + i * 34, 150 + i * 34, 30)).fill({ color: MOON, alpha: 0.035 });
    sky.poly(ngon(mx, 250, 150, 150, 36)).fill(MOON);
    sky.poly(ngon(mx - 40, 220, 30, 24, 12)).fill(0xf0e4c4).poly(ngon(mx + 50, 290, 22, 18, 10)).fill(0xf0e4c4);
    const sea = new Graphics().rect(0, HZ, W, H - HZ).fill(0x0a1430);
    const shimmer = new Graphics();
    const pal = new Graphics();
    palm(pal, 1840, 880, 1.2, -0.8);
    palm(pal, 1700, 900, 0.9, -0.5);
    palm(pal, 70, 900, 1.1, 0.6);
    const bal = balcony(1);
    bal.k.position.set(330, 640);
    bal.lady.alpha = 0;
    const prom = new Graphics();
    prom.rect(0, 860, W, H - 860).fill(0x3a3446).rect(0, 852, W, 14).fill(0x6a6276);
    for (let x = 0; x < W; x += 120) prom.rect(x, 866, 3, H - 866).fill({ color: 0x241f30, alpha: 0.8 });
    prom.rect(1180, 600, 12, 260).fill(0x14141c).poly(ngon(1186, 590, 22, 30, 10)).fill(0xffd27a);
    for (let i = 5; i >= 1; i--) prom.poly(ngon(1186, 590, 30 * i, 30 * i, 14)).fill({ color: 0xffd27a, alpha: 0.05 });
    const bk = basket(1.35);
    bk.position.set(1560, 1010);
    const str = new Graphics();
    const hearts = new Container();
    k.addChild(sky, sea, shimmer, pal, str, bal.k, prom, bk, hearts);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // a soft warm backlight so the silhouette reads on the night
    const bl = backlight(0xffd9a0, 360, 0.4);
    bl.position.set(W / 2, c.catY - 20);
    c.behind.addChild(bl);
    const amp = { v: c.short ? 0.25 : 0 };
    const glow = { v: c.short ? 0.6 : 0 };
    S.set(c, { amp, glow, hearts });
    let last = 0;
    const frame = (t: number) => {
      if (str.destroyed) return;
      const dt = Math.min(0.1, t - last);
      last = t;
      amp.v *= Math.exp(-dt * 3.2);
      strings(str, W, H, t, c.reduce ? 0 : amp.v, glow.v);
      moonPath(shimmer, mx, HZ, H, t);
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    else {
      glow.v = 0.6;
      frame(0.3);
    }
    if (c.short) return;

    // strums: the strings ring, a little three-note run each time
    const tiri = pre(c, comic('¡TIRIRÍN!', GOLD, 130), 560, 330, -0.1);
    const splash = pre(c, comic('¡SPLASH!', 0xbfe6ff, 100), 1440, 640, 0.1);
    const noche = pre(c, plate('NOCHE DE BACHATA', RED, C.ink, 46), 1380, 160, 0.04);
    [0.12, 0.59, 1.06, 1.53].forEach((d, i) =>
      at(c, d, () => {
        amp.v = 1;
        glow.v = Math.min(1, glow.v + 0.25);
        if (!c.reduce) frame(d);
        for (let j = 0; j < 3; j++) later(c, j * 0.05, () => sfx('gem', [1.0, 1.26, 1.5][j] * (i % 2 ? 0.94 : 1)));
        if (i === 0) {
          tiri(0.75);
          c.shaker.add(0.12);
        }
      }),
    );
    // the balcony door: a cat leans out and sighs hearts
    at(c, 0.6, () => {
      if (bal.lady.destroyed) return;
      if (c.reduce) bal.lady.alpha = 1;
      else gsap.to(bal.lady, { alpha: 1, duration: 0.25 });
      sfx('purr', 1.3);
      for (let i = 0; i < 6; i++)
        later(c, i * 0.12, () => {
          const hg = new Graphics().poly(heartPts(0, 0, 16 + (i % 3) * 5, 18)).fill(i % 2 ? 0xff5a8a : RED);
          hg.position.set(330 + (i % 2 ? 30 : -20), 440);
          hearts.addChild(hg);
          if (c.reduce) {
            hg.y = 340 - i * 30;
            gsap.to(hg, { alpha: 0, delay: 0.8, duration: 0.3, onComplete: () => destroyTree(hg) });
            return;
          }
          gsap.to(hg, { y: 160 - i * 10, x: hg.x + Math.sin(i) * 60, duration: 1.4, ease: 'sine.out' });
          gsap.to(hg, { alpha: 0, delay: 1.0, duration: 0.4, onComplete: () => destroyTree(hg) });
        });
    });
    // the fish jump out of the sea by themselves, into the basket
    for (let i = 0; i < 3; i++)
      at(c, 1.0 + i * 0.17, () => {
        const f = fish(1.6);
        const x0 = 1250 + i * 70;
        const y0 = HZ + 120;
        f.position.set(x0, y0);
        k.addChild(f);
        sfx('splash', 1.1 + i * 0.1);
        const land = () => {
          destroyTree(f);
          const hg = new Graphics().poly(heartPts(0, 0, 18, 18)).fill(0xff5a8a).stroke({ width: 3, color: C.ink });
          hg.position.set(1560 + (i - 1) * 40, 860);
          k.addChild(hg);
          sfx('pop', 1.4);
          if (!c.reduce) gsap.from(hg.scale, { x: 0.2, y: 0.2, duration: 0.18, ease: 'back.out(3)' });
          gsap.to(hg, { y: 800, alpha: 0, delay: 0.4, duration: 0.5, onComplete: () => destroyTree(hg) });
          if (i === 0) splash(0.6, { from: 1.6 });
        };
        if (c.reduce) return land();
        const p = { u: 0 };
        gsap.to(p, {
          u: 1,
          duration: 0.5,
          ease: 'none',
          onUpdate: () => {
            if (f.destroyed) return;
            f.position.set(x0 + (1560 - x0) * p.u, y0 + (900 - y0) * p.u - Math.sin(p.u * Math.PI) * 260);
            f.rotation = -0.9 + p.u * 2;
          },
          onComplete: land,
        });
      });
    at(c, 1.62, () => {
      noche(0.55);
      sfx('sting', 1.2);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 0.95);
    sfx('boom', 0.6);
    c.shaker.add(0.3);
    flashOf(c, 0xffe9d0, 0.35, 0.4);
    if (st) {
      st.amp.v = 1;
      st.glow.v = 1;
      for (let i = 0; i < 3; i++) later(c, 0.5 + i * 0.5, () => (st.amp.v = 0.8));
      for (let j = 0; j < 5; j++) later(c, j * 0.06, () => sfx('gem', [1.0, 1.26, 1.5, 2.0, 1.5][j]));
      // hearts rise over the bay
      for (let i = 0; i < (c.reduce ? 4 : 14); i++) {
        const hg = new Graphics().poly(heartPts(0, 0, 14 + (i % 4) * 6, 18)).fill(i % 3 ? RED : 0xff5a8a);
        hg.position.set(200 + Math.random() * (W - 400), 820 + Math.random() * 120);
        st.hearts.addChild(hg);
        if (c.reduce) {
          gsap.to(hg, { alpha: 0, delay: 1.6, duration: 0.4, onComplete: () => destroyTree(hg) });
          continue;
        }
        gsap.to(hg, { y: hg.y - 420 - Math.random() * 260, x: hg.x + (Math.random() - 0.5) * 120, duration: 2.2, delay: i * 0.08, ease: 'sine.out' });
        gsap.to(hg, { alpha: 0, delay: 1.6 + i * 0.08, duration: 0.6, onComplete: () => destroyTree(hg) });
      }
    }
    fall(c, c.fg, (i) => rose(new Graphics(), 0, 0, 20 + (i % 3) * 5, 0, i % 4 ? RED : 0xffffff), { n: 18, over: 1.5, dur: 1.6, spread: W * 1.05 });
    fall(c, c.back, () => new Graphics().poly(petalPts(20)).fill(RED), { n: 26, over: 2.2, dur: 2.4 });
    cheer(c, '¡QUÉ ROMÁNTICO!', 0xffd27a, 140, 2.3);
    aside(c, '…hasta los pescados se enamoraron.', 0xffffff, { delay: 0.6, dur: 2.5 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.3, h / 1080);
    const hz = h * 0.6;
    const sky = vgrad(new Graphics(), 0, 0, w, hz, SKY, 14);
    starfield(sky, 0, 0, w, hz * 0.7, Math.round(w / 24), 63, 0xffffff, 2 * u + 0.4);
    const mx = w / 2 + Math.min(w * 0.3, m * 0.55);
    const mr = m * 0.13;
    for (let i = 6; i >= 1; i--) sky.poly(ngon(mx, h * 0.22, mr + i * mr * 0.24, mr + i * mr * 0.24, 28)).fill({ color: MOON, alpha: 0.035 });
    sky.poly(ngon(mx, h * 0.22, mr, mr, 32)).fill(MOON);
    const sea = new Graphics().rect(0, hz, w, h - hz).fill(0x0a1430);
    const shimmer = new Graphics();
    moonPath(shimmer, mx, hz, h, 0.4, u);
    const pal = new Graphics();
    const side = Math.min(w * 0.46, m * 0.9);
    palm(pal, w / 2 + side, h * 0.86, u * 1.1, -0.8);
    palm(pal, w / 2 - side, h * 0.88, u, 0.6);
    const bal = balcony(u * 0.95);
    bal.k.position.set(w / 2 - Math.min(w * 0.3, m * 0.56), h * 0.6);
    const str = new Graphics();
    strings(str, w, h, 0.3, 0, 0.5, u);
    const prom = new Graphics().rect(0, h * 0.82, w, h * 0.18).fill(0x3a3446).rect(0, h * 0.815, w, 10 * u).fill(0x6a6276);
    const bk = basket(u);
    bk.position.set(w / 2 + Math.min(w * 0.36, m * 0.62), h * 0.97);
    const hearts = new Graphics();
    k.addChild(sky, sea, shimmer, pal, str, bal.k, prom, bk, hearts);
    if (live) {
      const hx = bal.k.x;
      const hy = bal.k.y - 200 * u;
      liveLoop(k, (t) => {
        moonPath(shimmer, mx, hz, h, t + 0.4, u);
        strings(str, w, h, t, 0.25 + 0.2 * Math.sin(t * 1.1), 0.5, u);
        hearts.clear();
        for (let i = 0; i < 4; i++) {
          const q = (t * 0.25 + i / 4) % 1;
          hearts.poly(heartPts(hx + Math.sin(q * 6 + i) * 20 * u, hy - q * 260 * u, (10 + i * 2) * u, 16)).fill({ color: i % 2 ? RED : 0xff5a8a, alpha: 1 - q });
        }
      });
    }
    return k;
  },
};
