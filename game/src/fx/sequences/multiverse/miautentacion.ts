/**
 * Miautentación, el del Pelo de Dos Colores: the universe of the two halves (a respectful tribute to the young singer
 * whose songs felt like a storm and a hug at once; his fur split in black and blond). The ship's prow at night, and the
 * world split down the middle like his hair: on the left a storm — rain, black clouds, a teal flash, a dark sea; on the
 * right a warm golden night — candles on the rail, fireflies, a calm sea, lanterns. ¡BRRROOOM! on the storm side; then he
 * sings softly: notes drift out to both halves, a great hush («shhh…»), the saddest cats of the ship come from both
 * edges and sit by him with their little candles, and the storm starts to calm.
 * Payoff: the two halves become one quiet night — stars on both sides, paper lanterns rising across the whole sky;
 * ENTERO. / …cuando canta.
 * Calm and dignified on purpose: no violence, no death imagery, no names, no lyrics, no real person's face.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, every, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { fogBank, wavePts } from './kitC';
import { arcPts, ngon, rnd, starfield, streak, twinkle } from './kitD';
import { at, comic, flat, park, take, neonWord, note, payline, pre, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const TEAL = 0x7fd1c7;
const GOLD = 0xf2d24b;
const AMBER = 0xffb347;
const STORM = [0x020406, 0x07121a, 0x0d2028, 0x15303a];
const WARM = [0x0a0604, 0x24120a, 0x4e2810, 0x8a4a18];
const CALM = [0x03060f, 0x0a1430, 0x142a52, 0x24406e];
const HZ = 690;
const RAIL = 900;

/** one half of the sky and sea (the storm or the warm night) in [x0, x0+w] */
function half(x0: number, w: number, h: number, hz: number, k: number, storm: boolean, seed: number) {
  const g = vgrad(new Graphics(), x0, 0, w, hz, storm ? STORM : WARM, 14);
  const r = rnd(seed);
  if (storm) {
    fogBank(g, x0 - 60 * k, w + 120 * k, 120 * k, 110 * k, 0x0a1a20, 0.95, r, 7);
    fogBank(g, x0 - 60 * k, w + 120 * k, 260 * k, 80 * k, 0x12262e, 0.85, r, 6);
    g.rect(x0, hz, w, h - hz).fill(0x041016);
  } else {
    g.poly(ngon(x0 + w * 0.62, hz, w * 0.5, 120 * k, 24)).fill({ color: AMBER, alpha: 0.12 });
    starfield(g, x0, 0, w, hz * 0.55, Math.round(w / 40), seed, 0xfff0c8, 2.2 * k);
    g.rect(x0, hz, w, h - hz).fill(0x1a0e06);
    for (let i = 0; i < 26; i++) {
      const y = hz + 8 * k + r() * (h - hz) * 0.5;
      const x = x0 + w * 0.62 + (r() - 0.5) * w * 0.5 * (1 - (y - hz) / (h - hz));
      g.poly(streak(x - 30 * k, y, x + 30 * k, y, 1.2 * k, 1.2 * k)).fill({ color: GOLD, alpha: 0.5 });
    }
  }
  return g;
}

/** the calm night that the storm becomes (drawn over the left half; its alpha grows) */
function calm(x0: number, w: number, h: number, hz: number, k: number, seed: number) {
  const g = vgrad(new Graphics(), x0, 0, w, hz, CALM, 14);
  starfield(g, x0, 0, w, hz * 0.6, Math.round(w / 34), seed, 0xdff4ff, 2.2 * k);
  g.rect(x0, hz, w, h - hz).fill(0x06101e);
  const r = rnd(seed + 1);
  for (let i = 0; i < 18; i++) {
    const y = hz + 10 * k + r() * (h - hz) * 0.4;
    const x = x0 + r() * w;
    g.poly(streak(x - 26 * k, y, x + 26 * k, y, 1 * k, 1 * k)).fill({ color: TEAL, alpha: 0.4 });
  }
  return g;
}

/** the soft seam down the middle: teal fading into gold */
function seam(x: number, h: number, k: number) {
  const g = new Graphics();
  for (let i = 1; i <= 6; i++) {
    g.rect(x - i * 10 * k, 0, 10 * k, h).fill({ color: TEAL, alpha: 0.05 * (7 - i) * 0.5 });
    g.rect(x + (i - 1) * 10 * k, 0, 10 * k, h).fill({ color: GOLD, alpha: 0.05 * (7 - i) * 0.5 });
  }
  g.rect(x - 1.5 * k, 0, 3 * k, h).fill({ color: 0xffffff, alpha: 0.35 });
  return g;
}

/** the prow's rail and deck along the bottom: planks, balusters, a top rail */
function prow(w: number, h: number, rail: number, k: number) {
  const g = new Graphics();
  g.rect(0, rail + 40 * k, w, h - rail).fill(0x2a1a10);
  for (let i = -14; i <= 14; i++) g.poly(streak(w / 2 + i * 60 * k, rail + 40 * k, w / 2 + i * 150 * k, h, 1 * k, 2 * k)).fill({ color: 0x1a0e08, alpha: 0.8 });
  for (let x = 20 * k; x < w; x += 70 * k) g.rect(x - 6 * k, rail - 40 * k, 12 * k, 82 * k).fill(0x4a2e18);
  g.rect(0, rail - 52 * k, w, 16 * k).fill(0x5a3a1e).rect(0, rail - 52 * k, w, 4 * k).fill(0x8a5a2e);
  g.rect(0, rail + 34 * k, w, 8 * k).fill(0x3a2412);
  return g;
}

/** candles on the rail (cream sticks; their flames are redrawn by flames()) */
function candleSticks(g: Graphics, xs: number[], y: number, k: number) {
  for (const x of xs) g.rect(x - 7 * k, y - 34 * k, 14 * k, 34 * k).fill(0xf4ead2).rect(x - 7 * k, y - 34 * k, 14 * k, 5 * k).fill(0xe0d2b0);
  return g;
}
function flames(g: Graphics, xs: number[], y: number, k: number, t: number, alpha = 1) {
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const f = 1 + 0.18 * Math.sin(t * 11 + i * 2.1) + 0.1 * Math.sin(t * 23 + i);
    g.poly(ngon(x, y - 46 * k, 34 * k * f, 30 * k * f, 12)).fill({ color: AMBER, alpha: 0.14 * alpha });
    g.poly([x, y - (64 + 6 * f) * k, x + 6 * k, y - 46 * k, x, y - 38 * k, x - 6 * k, y - 46 * k]).fill({ color: GOLD, alpha });
    g.poly([x, y - 54 * k, x + 2.6 * k, y - 45 * k, x, y - 41 * k, x - 2.6 * k, y - 45 * k]).fill({ color: 0xffffff, alpha });
  }
}

/** a paper lantern (warm, glowing), centered, s = scale */
function lantern(s: number, col = AMBER) {
  const g = new Graphics();
  g.poly(ngon(0, 0, 46 * s, 46 * s, 14)).fill({ color: col, alpha: 0.16 });
  g.poly([-18 * s, -24 * s, 18 * s, -24 * s, 22 * s, 18 * s, -22 * s, 18 * s]).fill(col);
  g.poly([-14 * s, -18 * s, 14 * s, -18 * s, 16 * s, 12 * s, -16 * s, 12 * s]).fill({ color: 0xffe6a0, alpha: 0.8 });
  g.rect(-20 * s, -27 * s, 40 * s, 4 * s).fill(0x6a3a1a).rect(-23 * s, 17 * s, 46 * s, 4 * s).fill(0x6a3a1a);
  return g;
}

/** a small cat sitting with its back to us (a listener), origin at its base, holding a tiny candle glow in front */
function listener(s: number, col: number, dir: number, rim = GOLD) {
  const k = new Container();
  const g = new Graphics();
  // a rim of light around the silhouette (the side it faces)
  g.poly(ngon(0, -40 * s, 37 * s, 45 * s, 14)).fill({ color: rim, alpha: 0.5 });
  g.poly(ngon(0, -96 * s, 27 * s, 25 * s, 12)).fill({ color: rim, alpha: 0.5 });
  g.poly(ngon(0, -40 * s, 34 * s, 42 * s, 14)).fill(col);
  g.poly(ngon(0, -96 * s, 24 * s, 22 * s, 12)).fill(col);
  g.poly([-20 * s, -104 * s, -16 * s, -132 * s, -4 * s, -114 * s]).fill(col);
  g.poly([20 * s, -104 * s, 16 * s, -132 * s, 4 * s, -114 * s]).fill(col);
  g.poly([dir * 28 * s, -8 * s, dir * 70 * s, -14 * s, dir * 78 * s, -44 * s, dir * 66 * s, -40 * s, dir * 62 * s, -22 * s, dir * 26 * s, 2 * s]).fill(col);
  const glow = new Graphics().poly(ngon(0, -70 * s, 46 * s, 40 * s, 14)).fill({ color: AMBER, alpha: 0.22 });
  k.addChild(glow, g);
  return k;
}

interface St {
  rain: { v: number };
  calmV: { v: number };
  lan: Container;
  lanOn: { v: number };
}
const S = stash<St>();

export const miautentacion: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO DE LAS DOS MITADES',
  open(c: SigCtx) {
    const k = new Container();
    const L = half(0, W / 2, H, HZ, 1, true, 3);
    const R = half(W / 2, W / 2, H, HZ, 1, false, 4);
    const cm = calm(0, W / 2, H, HZ, 1, 5);
    cm.alpha = c.short ? 1 : 0;
    const flash = new Graphics().rect(0, 0, W / 2, HZ).fill(TEAL);
    flash.alpha = 0;
    flash.blendMode = 'add';
    const sea = new Graphics();
    const rainG = new Graphics();
    const fire = new Graphics();
    const lan = new Container();
    const sm = seam(W / 2, H, 1);
    const pr = prow(W, H, RAIL, 1);
    const xsR = [1150, 1290, 1430, 1570, 1710, 1850];
    const xsL = [70, 210, 350, 490, 630, 770];
    const sticks = new Graphics();
    candleSticks(sticks, xsR, RAIL - 52, 1);
    const sticksL = new Graphics();
    candleSticks(sticksL, xsL, RAIL - 52, 1);
    sticksL.alpha = c.short ? 1 : 0;
    const fl = new Graphics();
    const crowd = new Container();
    k.addChild(L, R, cm, flash, sea, rainG, lan, fire, sm, pr, sticks, sticksL, fl, crowd);
    c.back.addChild(k);
    // a soft backlight split like his fur (teal / gold): the silhouette has to read on the night
    const bl = new Graphics();
    for (let i = 8; i >= 1; i--) {
      const r0 = (340 * i) / 8;
      bl.poly([0, -r0, ...arcPts(0, 0, r0, -Math.PI / 2, -Math.PI * 1.5, 14), 0, r0]).fill({ color: TEAL, alpha: 0.05 });
      bl.poly([0, -r0, ...arcPts(0, 0, r0, -Math.PI / 2, Math.PI / 2, 14), 0, r0]).fill({ color: GOLD, alpha: 0.05 });
    }
    bl.position.set(W / 2, c.catY - 20);
    c.behind.addChild(bl);
    hideDisc(c, 0.25);
    const rain = { v: c.short ? 0 : 1 };
    const calmV = { v: c.short ? 1 : 0 };
    const lanOn = { v: c.short ? 1 : 0.35 };
    const lit = { v: c.short ? 1 : 0 };
    S.set(c, { rain, calmV, lan, lanOn });
    const mkLine = () => neonWord('ENTERO.', 150, 0xffffff, GOLD, F.serif);
    if (!c.short) at(c, 1.9, () => park(c, 'line', mkLine()));
    const r = rnd(9);
    const RN = Array.from({ length: 80 }, () => [r() * (W / 2 + 200), r() * H, 0.7 + r() * 0.6]);
    const FF = Array.from({ length: 22 }, () => [W / 2 + 40 + r() * (W / 2 - 80), 300 + r() * 560, r() * 6, 0.4 + r() * 0.6]);
    const LAN = Array.from({ length: 16 }, (_, i) => [((i + 0.5) / 16) * W + (r() - 0.5) * 60, r(), 0.6 + r() * 0.5]);
    const lanG = LAN.map(([, , s]) => lantern(s));
    lanG.forEach((g) => lan.addChild(g));
    const frame = (t: number) => {
      if (sea.destroyed) return;
      cm.alpha = calmV.v;
      sea.clear();
      sea.poly(wavePts(0, W / 2, HZ + 30, 12 * (1 - calmV.v * 0.8), 160, t * 3, H, 20)).fill({ color: 0x0a1e26, alpha: 0.9 * (1 - calmV.v * 0.6) });
      sea.poly(wavePts(0, W / 2, HZ + 90, 16 * (1 - calmV.v * 0.8), 210, -t * 2.4, H, 26)).fill({ color: 0x06141a, alpha: 0.9 * (1 - calmV.v * 0.6) });
      rainG.clear();
      if (rain.v > 0.02) {
        for (const [x0, y0, sp] of RN) {
          const y = (y0 + t * 1500 * sp) % (H + 100) - 60;
          const x = x0 - (y * 0.25) % 200;
          if (x > W / 2 - 4) continue;
          rainG.poly(streak(x, y, x - 10, y + 44 * sp, 0.6, 1.4)).fill({ color: 0x9fd8e0, alpha: 0.45 * rain.v });
        }
      }
      fire.clear();
      for (const [x, y, ph, s] of FF) {
        const yy = y - ((t * 30 * s + ph * 40) % 160);
        fire.poly(twinkle(x + Math.sin(t * 1.5 + ph) * 16, yy, 5 + s * 4)).fill({ color: GOLD, alpha: 0.5 + 0.4 * Math.sin(t * 4 + ph) });
      }
      fl.clear();
      flames(fl, xsR, RAIL - 52, 1, t, 1);
      if (lit.v > 0.01) flames(fl, xsL, RAIL - 52, 1, t, lit.v);
      lanG.forEach((g, i) => {
        if (g.destroyed) return;
        const [x, ph, s] = LAN[i];
        const right = x > W / 2;
        const on = right ? lanOn.v : Math.max(0, lanOn.v - 0.35) / 0.65;
        g.visible = on > 0.02;
        g.alpha = Math.min(1, on * 1.4);
        g.position.set(x + Math.sin(t * 0.7 + i) * 14, HZ - 40 - ((ph * 600 + t * 26 * s) % 640));
      });
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    else {
      // still: the storm half already calming, a few lanterns on both sides
      rain.v = 0.4;
      calmV.v = 0.35;
      lanOn.v = 0.7;
      lit.v = 1;
      sticksL.alpha = 1;
      frame(0.5);
    }
    if (c.short) return;

    // the words (built now)
    const brrom = pre(c, comic('¡BRRROOOM!', 0xdff8ff, 120), 470, 250, -0.1);
    const shh = pre(c, flat('shhh…', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 150, fill: 0xffffff, stroke: { color: 0x0a1418, width: 10, join: 'round' } }), 470, 470, -0.04);
    at(c, 0.18, () => {
      brrom(0.7);
      sfx('boom', 0.5);
      sfx('bigboom', 0.45);
      c.shaker.add(0.18);
      if (c.flashes && !flash.destroyed) gsap.fromTo(flash, { alpha: 0.45 }, { alpha: 0, duration: 0.5 });
    });
    // he sings softly: notes drift into both halves
    const notes = new Container();
    c.fg.addChild(notes);
    for (let i = 0; i < 10; i++)
      at(c, 0.55 + i * 0.1, () => {
        const left = i % 2 === 0;
        const g = note(new Graphics(), 0, 0, 34 + (i % 3) * 8, left ? TEAL : GOLD, i % 4 === 1);
        g.position.set(W / 2 + (left ? -60 : 60), 330);
        notes.addChild(g);
        if (c.reduce) {
          g.position.set(W / 2 + (left ? -1 : 1) * (260 + i * 30), 300 - i * 8);
          gsap.to(g, { alpha: 0, delay: 0.8, duration: 0.3, onComplete: () => destroyTree(g) });
          return;
        }
        gsap.to(g, { x: g.x + (left ? -1 : 1) * (380 + i * 40), y: 200 + Math.sin(i) * 120, duration: 1.4, ease: 'sine.out' });
        gsap.to(g, { alpha: 0, delay: 1.0, duration: 0.4, onComplete: () => destroyTree(g) });
        if (i % 3 === 0) sfx('gem', 0.7 + i * 0.03);
      });
    later(c, 2.6, () => destroyTree(notes));
    at(c, 1.0, () => {
      shh(0.85, { from: 1.15, fade: 0.4 });
      sfx('purr', 0.8);
      if (c.reduce) rain.v = 0.4;
      else gsap.to(rain, { v: 0.35, duration: 0.8 });
    });
    // the saddest cats come and sit by him with their candles
    const cols = [0x0e1418, 0x14100c, 0x10141a, 0x18120c];
    [
      [-1, 560, 1.5],
      [-1, 300, 1.3],
      [1, 1380, 1.5],
      [1, 1640, 1.3],
    ].forEach(([d, x, s], i) =>
      at(c, 0.85 + i * 0.14, () => {
        const g = listener(s, cols[i], -d, d < 0 ? TEAL : GOLD);
        g.position.set(x, H + 10);
        crowd.addChild(g);
        if (!c.reduce) gsap.from(g, { x: d < 0 ? -140 : W + 140, duration: 0.55, ease: 'power2.out' });
      }),
    );
    // the storm starts to calm; candles light on its side too
    at(c, 1.6, () => {
      sfx('reveal', 0.9);
      if (c.reduce) {
        calmV.v = 0.35;
        lit.v = 1;
        sticksL.alpha = 1;
        return;
      }
      gsap.to(calmV, { v: 0.35, duration: 0.6 });
      gsap.to([lit], { v: 1, duration: 0.5 });
      gsap.to(sticksL, { alpha: 1, duration: 0.4 });
      gsap.to(lanOn, { v: 0.6, duration: 0.6 });
    });
    score(c, [
      [0.0, 'drumroll', 0.6],
      [0.5, 'purr', 1.0],
    ]);
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('reveal', 0.8);
    sfx('boom', 0.35);
    later(c, 0.3, () => sfx('gem', 0.9));
    later(c, 0.6, () => sfx('gem', 1.1));
    if (st) {
      if (c.reduce) {
        st.rain.v = 0;
        st.calmV.v = 1;
        st.lanOn.v = 1;
      } else {
        gsap.to(st.rain, { v: 0, duration: 0.6 });
        gsap.to(st.calmV, { v: 1, duration: 0.9 });
        gsap.to(st.lanOn, { v: 1, duration: 1.0 });
      }
    }
    // a soft rise of golden motes from him (no burst, no flash)
    for (let i = 0; i < (c.reduce ? 0 : 18); i++) {
      const g = new Graphics().poly(twinkle(0, 0, 8 + (i % 3) * 3)).fill(i % 2 ? GOLD : TEAL);
      g.position.set(W / 2 + (Math.random() - 0.5) * 420, c.catY + 120);
      c.fg.addChild(g);
      gsap.to(g, { y: g.y - 360 - Math.random() * 200, x: g.x + (Math.random() - 0.5) * 200, duration: 2.0, delay: i * 0.05, ease: 'sine.out' });
      gsap.to(g, { alpha: 0, delay: 1.4 + i * 0.05, duration: 0.6, onComplete: () => destroyTree(g) });
    }
    payline(c, take(c, 'line', () => neonWord('ENTERO.', 150, 0xffffff, GOLD, F.serif)), '…cuando canta.', {
      slow: true,
      dur: 2.8,
      asideStyle: { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 50, fill: 0xfff0c8, stroke: { color: C.ink, width: 8, join: 'round' } },
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.max(0.3, h / 1080);
    const hz = h * 0.64;
    const rail = h * 0.83;
    const L = half(0, w / 2, h, hz, u, true, 13);
    const R = half(w / 2, w / 2, h, hz, u, false, 14);
    const sea = new Graphics().poly(wavePts(0, w / 2, hz + 24 * u, 10 * u, 140 * u, 0, h, 18 * u)).fill({ color: 0x0a1e26, alpha: 0.9 });
    const rainG = new Graphics();
    const lan = new Container();
    const sm = seam(w / 2, h, u);
    const pr = prow(w, h, rail, u);
    const xs: number[] = [];
    for (let x = w / 2 + 120 * u; x < w; x += 150 * u) xs.push(x);
    for (let x = w / 2 - 120 * u; x > 0; x -= 150 * u) xs.push(x);
    const sticks = candleSticks(new Graphics(), xs, rail - 52 * u, u);
    const fl = new Graphics();
    const r = rnd(5);
    const LAN = Array.from({ length: Math.max(4, Math.round(w / 260)) }, () => [w / 2 + 60 * u + r() * (w / 2 - 120 * u), r(), 0.6 + r() * 0.5]);
    const lanG = LAN.map(([, , s]) => lantern(s * u * 1.2));
    lanG.forEach((g) => lan.addChild(g));
    const RN = Array.from({ length: Math.max(20, Math.round(w / 16)) }, () => [r() * (w / 2 + 100 * u), r() * h, 0.7 + r() * 0.6]);
    k.addChild(L, R, sea, rainG, lan, sm, pr, sticks, fl);
    const draw = (t: number) => {
      rainG.clear();
      for (const [x0, y0, sp] of RN) {
        const y = ((y0 + t * 900 * sp * u) % (h + 60 * u)) - 40 * u;
        const x = x0 - ((y * 0.25) % (120 * u));
        if (x > w / 2 - 3) continue;
        rainG.poly(streak(x, y, x - 6 * u, y + 30 * u * sp, 0.5 * u + 0.2, 1.1 * u + 0.3)).fill({ color: 0x9fd8e0, alpha: 0.4 });
      }
      fl.clear();
      flames(fl, xs, rail - 52 * u, u, t, 1);
      lanG.forEach((g, i) => {
        const [x, ph, s] = LAN[i];
        g.position.set(x + Math.sin(t * 0.7 + i) * 10 * u, hz - 30 * u - ((ph * hz * 0.9 + t * 20 * s * u) % (hz * 0.9)));
      });
    };
    draw(0.4);
    if (live) liveLoop(k, (t) => draw(t + 0.4));
    return k;
  },
};
