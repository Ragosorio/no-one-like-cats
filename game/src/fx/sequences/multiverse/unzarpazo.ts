/**
 * Un Zarpazo: the hobby-hero universe (a 2010s superhero-parody anime). A ruined gray city under an overcast sky, smoke
 * rising; a monster the size of the sky climbs out from behind the buildings, opens seven red eyes and roars at him. He
 * doesn't move. A dry leaf and a supermarket flyer blow past, and a manga cut-in shows his face: nothing. Payoff: one
 * normal punch — the monster bursts, the clouds blow away in a ring and the sky turns blue; ¡PUM!… …¿ya?
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { aside, balloon, bandPts, ngon, rnd, say, streak } from './kitD';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const GREY = [0x5f636c, 0x80848d, 0xa5a8af, 0xbdbfc4];
const BLUE = [0x2f7fe0, 0x5ea8f0, 0x9fd0ff, 0xd6eeff];
const MON = 0x6e6680;
const MON_D = 0x544c66;
const EYE = 0xff2a2a;
const YELLOW = 0xffd23f;

/** a gray cloud: overlapping puffs (polygons), `s` its size */
function cloud(s: number, dark: boolean): Graphics {
  const g = new Graphics();
  const a = dark ? 0x5a5e68 : 0x8e929b;
  const b = dark ? 0x6e727c : 0xa4a7af;
  const r = rnd(Math.round(s));
  for (let i = 0; i < 5; i++) g.poly(ngon((i - 2) * s * 0.34, (r() - 0.6) * s * 0.3 + s * 0.06, s * (0.3 + r() * 0.16), s * (0.24 + r() * 0.1), 12)).fill(a);
  for (let i = 0; i < 4; i++) g.poly(ngon((i - 1.5) * s * 0.36, (r() - 0.7) * s * 0.26, s * (0.26 + r() * 0.12), s * (0.2 + r() * 0.08), 12)).fill(b);
  return g;
}

/** the ruined skyline: broken tops, tilted towers, dark windows, rubble (one Graphics), base at `base` */
function ruins(g: Graphics, w: number, base: number, k: number, seed: number, light = false) {
  const r = rnd(seed);
  const cols = light ? [0x9a9ca3, 0x8a8c94, 0xa8aab0] : [0x6a6d75, 0x5c5f67, 0x777a82];
  let x = -20 * k;
  while (x < w + 20 * k) {
    const bw = (80 + r() * 120) * k;
    const center = Math.abs(x + bw / 2 - w / 2) < 360 * k;
    const bh = (center ? 120 + r() * 120 : 220 + r() * 300) * k;
    const top = base - bh;
    const col = cols[Math.floor(r() * cols.length)];
    const tilt = (r() - 0.5) * 0.25 * bh;
    // a broken top: a jagged line instead of a roof
    const jag: number[] = [];
    const nj = 4 + Math.floor(r() * 3);
    for (let i = nj; i >= 0; i--) jag.push(x + (bw * i) / nj + tilt, top + (i % 2 ? r() * 50 * k : r() * 18 * k));
    g.poly([x, base, x + bw, base, ...jag]).fill(col);
    // dark windows (some blown out)
    for (let wy = top + 40 * k; wy < base - 30 * k; wy += 34 * k)
      for (let wx = x + 12 * k; wx < x + bw - 20 * k; wx += 26 * k) {
        if (r() < 0.25) continue;
        const sh = tilt * ((base - wy) / bh);
        g.rect(wx + sh, wy, 12 * k, 18 * k).fill({ color: 0x2c2e34, alpha: 0.75 });
      }
    x += bw + (r() * 18 - 4) * k;
  }
  // rubble along the street
  for (let i = 0; i < 26; i++) {
    const rx = r() * w;
    const rs = (20 + r() * 50) * k;
    g.poly([rx - rs, base + 4, rx - rs * 0.4, base - rs * 0.7, rx + rs * 0.3, base - rs * 0.5, rx + rs, base + 4]).fill(light ? 0x7c7e86 : 0x4c4e55);
  }
}

/** the monster: a dome of a head with horns, wide shoulders and claws gripping the city, seven red eyes, a toothy mouth */
function monster() {
  const k = new Container();
  const body = new Graphics();
  // shoulders and arms
  body.poly([-260, 40, -620, 110, -860, 360, -900, 700, 900, 700, 860, 360, 620, 110, 260, 40]).fill(MON_D);
  body.poly([-620, 110, -760, 240, -820, 420, -700, 430, -640, 300]).fill(MON);
  body.poly([620, 110, 760, 240, 820, 420, 700, 430, 640, 300]).fill(MON);
  // claws over the rooftops
  for (const s of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const x = s * (700 + i * 40);
      body.poly([x - 18, 410, x + 18, 410, x + s * 10, 500]).fill(0xe8e2d0);
    }
  // horns
  body.poly([-170, -190, -360, -430, -300, -420, -110, -232]).fill(0x8a8070);
  body.poly([170, -190, 360, -430, 300, -420, 110, -232]).fill(0x8a8070);
  // the head
  body.poly([-270, 50, -240, -120, -160, -215, -60, -258, 60, -258, 160, -215, 240, -120, 270, 50, 140, 100, -140, 100]).fill(MON);
  // plates on the skull
  body.poly([-120, -230, 0, -190, 120, -230, 60, -258, -60, -258]).fill(MON_D);
  body.poly([-230, -60, -160, -20, -250, 20]).fill(MON_D).poly([230, -60, 160, -20, 250, 20]).fill(MON_D);
  const mouth = new Graphics();
  mouth.poly([-170, 0, 170, 0, 120, 60, 0, 90, -120, 60]).fill(0x4a0d14);
  for (let i = 0; i < 9; i++) {
    const x = -150 + i * 37.5;
    mouth.poly([x - 14, 0, x + 14, 0, x, 30]).fill(0xf2ecdc);
  }
  for (let i = 0; i < 6; i++) {
    const x = -100 + i * 40;
    mouth.poly([x - 12, 72, x + 12, 72, x, 46]).fill(0xf2ecdc);
  }
  mouth.position.set(0, 10);
  mouth.scale.y = 0.2;
  const eyes: Graphics[] = [];
  const at: [number, number, number][] = [
    [-110, -110, 1],
    [110, -110, 1],
    [-36, -170, 0.8],
    [36, -170, 0.8],
    [-185, -50, 0.7],
    [185, -50, 0.7],
    [0, -100, 0.9],
  ];
  for (const [x, y, s] of at) {
    const e = new Graphics();
    e.poly(ngon(0, 0, 46 * s, 30 * s, 14)).fill({ color: EYE, alpha: 0.25 });
    e.poly(ngon(0, 0, 32 * s, 18 * s, 14)).fill(EYE);
    e.poly(ngon(0, 0, 6 * s, 15 * s, 8)).fill(0x1a0306);
    e.position.set(x, y);
    e.rotation = x === 0 ? 0 : x < 0 ? 0.25 : -0.25;
    e.scale.y = 0;
    eyes.push(e);
  }
  k.addChild(body, mouth, ...eyes);
  return { k, mouth, eyes };
}

/** the supermarket flyer: ¡OFERTA! ATÚN 2×1 */
function flyer(s = 1) {
  const k = new Container();
  const g = new Graphics().rect(-80 * s, -100 * s, 160 * s, 200 * s).fill(0xfffdf4).stroke({ width: 3 * s, color: 0x9a968c }).rect(-80 * s, -100 * s, 160 * s, 56 * s).fill(0xd62839);
  g.poly(ngon(40 * s, 50 * s, 34 * s, 34 * s, 12)).fill(YELLOW);
  const a = txt('¡OFERTA!', { fontFamily: F.heavy, fontSize: 30 * s, fill: 0xffffff });
  a.anchor.set(0.5);
  a.position.set(0, -72 * s);
  const b = txt('ATÚN', { fontFamily: F.heavy, fontSize: 30 * s, fill: C.ink });
  b.anchor.set(0.5);
  b.position.set(-22 * s, 0);
  const d = txt('2×1', { fontFamily: F.heavy, fontSize: 26 * s, fill: 0xd62839 });
  d.anchor.set(0.5);
  d.position.set(40 * s, 50 * s);
  k.addChild(g, a, b, d);
  return k;
}

/** the manga cut-in: his face, drawn simple (an egg with ears, two dots under flat lids, a line) */
function cutIn() {
  const k = new Container();
  const g = new Graphics();
  g.rect(0, 0, 380, 300).fill(0xffffff).stroke({ width: 8, color: C.ink });
  // speed-hatching in the corners (manga)
  for (let i = 0; i < 14; i++) g.poly(streak(0, 20 * i, 60, 20 * i + 6, 1, 0.5)).fill({ color: C.ink, alpha: 0.3 });
  const cx = 190;
  const cy = 170;
  g.poly([cx - 112, cy - 40, cx - 120, cy - 150, cx - 52, cy - 96]).fill(0xf6c9c0).stroke({ width: 5, color: C.ink, join: 'round' });
  g.poly([cx + 112, cy - 40, cx + 120, cy - 150, cx + 52, cy - 96]).fill(0xf6c9c0).stroke({ width: 5, color: C.ink, join: 'round' });
  g.poly(ngon(cx, cy, 118, 104, 26)).fill(0xf8d6cc).stroke({ width: 5, color: C.ink });
  g.poly(ngon(cx - 40, cy - 8, 7, 7, 8)).fill(C.ink).poly(ngon(cx + 40, cy - 8, 7, 7, 8)).fill(C.ink);
  g.rect(cx - 58, cy - 20, 34, 5).fill(C.ink).rect(cx + 24, cy - 20, 34, 5).fill(C.ink);
  g.rect(cx - 14, cy + 44, 28, 4).fill(C.ink);
  g.poly([cx - 6, cy + 14, cx + 6, cy + 14, cx, cy + 22]).fill(0xd98a8a);
  k.addChild(g);
  return k;
}

interface St {
  mon: Container;
  clouds: { g: Graphics; x: number; y: number }[];
  cover: Graphics;
}
const S = stash<St>();
const BASE = 860;

export const unzarpazo: Signature = {
  dark: false,
  frame: YELLOW,
  tag: 'UNIVERSO HÉROE DE AFICIÓN',
  open(c: SigCtx) {
    const k = new Container();
    const blue = vgrad(new Graphics(), 0, 0, W, H, BLUE, 16);
    const sun = new Graphics();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      sun.poly([0, 0, Math.cos(a) * 1400, Math.sin(a) * 1400, Math.cos(a + 0.12) * 1400, Math.sin(a + 0.12) * 1400]).fill({ color: 0xffffff, alpha: 0.12 });
    }
    sun.position.set(W / 2, 260);
    const cover = vgrad(new Graphics(), 0, 0, W, H, GREY, 16);
    const back = new Graphics();
    ruins(back, W, BASE - 120, 0.7, 4, true);
    const m = monster();
    m.k.position.set(W / 2 + 110, 330);
    m.k.scale.set(1.08);
    const front = new Graphics();
    ruins(front, W, BASE + 40, 1, 9);
    const street = new Graphics().rect(0, BASE + 40, W, H - BASE - 40).fill(0x55585f);
    for (let i = 0; i < 6; i++) street.poly(streak(W / 2 - 40 + i * 16, BASE + 50, W / 2 - 600 + i * 240, H, 2, 6)).fill({ color: 0x6a6d74, alpha: 0.7 });
    // the clouds over everything far
    const clouds: St['clouds'] = [];
    const cl = new Container();
    const r = rnd(21);
    for (let i = 0; i < 16; i++) {
      const g = cloud(220 + r() * 200, i % 3 === 0);
      const x = (i % 8) * 270 + r() * 120 - 40;
      const y = 40 + Math.floor(i / 8) * 150 + r() * 60;
      g.position.set(x, y);
      cl.addChild(g);
      clouds.push({ g, x, y });
    }
    // smoke columns from the ruins
    const smoke = new Graphics();
    k.addChild(blue, sun, cover, cl, back, m.k, front, street, smoke);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    S.set(c, { mon: m.k, clouds, cover });
    const vents = [180, 560, 1390, 1760];
    const drawSmoke = (t: number) => {
      smoke.clear();
      vents.forEach((vx, j) => {
        for (let i = 0; i < 7; i++) {
          const q = (t * 0.25 + i / 7 + j * 0.13) % 1;
          const y = BASE - 160 - q * 520;
          const s = 40 + q * 110;
          smoke.poly(ngon(vx + Math.sin(q * 6 + j) * 30 + q * 80, y, s, s * 0.8, 10)).fill({ color: 0x4a4c52, alpha: 0.38 * (1 - q) });
        }
      });
    };
    drawSmoke(0.4);
    if (!c.reduce)
      every(c, 30, (t) => {
        if (!smoke.destroyed) drawSmoke(t);
        if (!cl.destroyed) cl.x = Math.sin(t * 0.4) * 10;
      });
    const eyesOpen = () => m.eyes.forEach((e) => (e.scale.y = 1));
    if (c.short || c.reduce) {
      eyesOpen();
      if (c.short) return;
    }

    // the monster climbs out from behind the city, its eyes open one by one
    if (!c.reduce) {
      gsap.from(m.k, { y: m.k.y + 560, duration: 0.95, ease: 'power2.out' });
      m.eyes.forEach((e, i) => later(c, 0.45 + i * 0.06, () => !e.destroyed && gsap.to(e.scale, { y: 1, duration: 0.12, ease: 'back.out(3)' })));
    }
    score(c, [
      [0.0, 'boom', 0.45],
      [0.3, 'boom', 0.4],
      [0.6, 'boom', 0.38],
      [0.45, 'sting', 0.6],
    ]);
    for (let i = 0; i < 3; i++) later(c, i * 0.3, () => c.shaker.add(0.15));
    // the roar
    later(c, 1.0, () => {
      sfx('bigboom', 0.55);
      c.shaker.add(0.4);
      if (!m.mouth.destroyed) gsap.to(m.mouth.scale, { y: 1, duration: 0.12, ease: 'back.out(2)' });
      say(c, c.fg, balloon('¡TIEMBLA,\nGATITO!', { size: 58, jag: true, tx: 140, ty: 120, font: F.heavy }), 470, 230, 0.8, -0.05);
    });
    // nothing happens: a dry leaf and a supermarket flyer blow past
    later(c, 1.2, () => {
      sfx('whoosh', 0.4);
      const leaf = new Graphics().poly([0, -16, 10, -4, 6, 14, 0, 18, -6, 14, -10, -4]).fill(0xa8803a).poly(streak(0, -16, 0, 18, 1, 1)).fill(0x6a4a1a);
      leaf.position.set(-40, c.catY + 120);
      c.fg.addChild(leaf);
      const fly = flyer(0.9);
      fly.position.set(W + 120, c.catY - 40);
      c.fg.addChild(fly);
      if (c.reduce) {
        leaf.position.set(W / 2 - 330, c.catY + 150);
        fly.position.set(W / 2 + 420, c.catY + 40);
        fadeKill(leaf, 0.9, 0.2);
        fadeKill(fly, 0.9, 0.2);
      } else {
        gsap.to(leaf, { x: W + 60, y: c.catY + 40, rotation: 9, duration: 1.4, ease: 'none', onComplete: () => destroyTree(leaf) });
        gsap.to(fly, { x: -200, y: c.catY + 120, rotation: -5, duration: 1.3, ease: 'sine.inOut', onComplete: () => destroyTree(fly) });
      }
      const f = txt('fuuu…', { fontFamily: F.comic, fontSize: 44, fill: 0xffffff, stroke: { color: C.ink, width: 6 } });
      f.position.set(300, c.catY + 170);
      c.fg.addChild(f);
      fadeKill(f, 0.7, 0.3);
    });
    // the cut-in: his face, doing nothing at all
    later(c, 1.5, () => {
      const p = cutIn();
      p.position.set(W - 470, 140);
      p.rotation = 0.03;
      c.fg.addChild(p);
      if (!c.reduce) gsap.from(p, { x: W + 40, duration: 0.18, ease: 'power3.out' });
      sfx('pop', 0.7);
      say(c, c.fg, balloon('…¿hoy hay oferta?', { size: 36, tx: 80, ty: 80 }), W - 330, 108, 0.65, 0.02);
      fadeKill(p, 0.65, 0.2);
    });
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('bigboom', 1.0);
    sfx('crit', 0.8);
    c.shaker.add(0.7);
    flashOf(c, 0xffffff, 0.9, 0.35);
    const ox = W / 2 - 20;
    const oy = c.catY - 120;
    // the shockwave: two rings and a burst of lines
    const sw = new Graphics();
    c.fg.addChild(sw);
    const drawSw = (v: number) => {
      if (sw.destroyed) return;
      sw.clear();
      for (const [f, a] of [
        [1, 0.9],
        [0.7, 0.6],
      ] as const) {
        const R = 80 + v * 1400 * f;
        sw.poly(bandPts(ox, oy, R, R + 30 + v * 40, 0, Math.PI * 2, 36)).fill({ color: 0xffffff, alpha: a * (1 - v) });
      }
    };
    if (c.reduce) {
      drawSw(0.3);
      fadeKill(sw, 0.6, 0.3);
    } else {
      const p = { v: 0 };
      gsap.to(p, { v: 1, duration: 0.7, ease: 'power2.out', onUpdate: () => drawSw(p.v), onComplete: () => destroyTree(sw) });
    }
    if (st) {
      // the monster bursts
      if (!st.mon.destroyed) {
        const mx = st.mon.x;
        const my = st.mon.y;
        gsap.to(st.mon, { alpha: 0, duration: 0.18 });
        if (!c.reduce) gsap.to(st.mon.scale, { x: 1.2, y: 1.2, duration: 0.2 });
        burst(
          c,
          c.back,
          (i) => new Graphics().poly(ngon(0, 0, 40 + (i % 4) * 22, 30 + (i % 3) * 16, 5 + (i % 3), i)).fill(i % 2 ? MON : MON_D),
          26,
          mx,
          my,
          1100,
          1.2,
        );
      }
      // the clouds blow away in a ring; the sky turns blue
      for (const cl of st.clouds) {
        if (cl.g.destroyed) continue;
        const dx = cl.x - ox;
        const dy = cl.y - oy;
        const d = Math.hypot(dx, dy) || 1;
        if (c.reduce) cl.g.visible = false;
        else gsap.to(cl.g, { x: cl.x + (dx / d) * 1600, y: cl.y + (dy / d) * 1000, duration: 0.8, ease: 'power2.out' });
      }
      if (!st.cover.destroyed) gsap.to(st.cover, { alpha: 0, duration: c.reduce ? 0 : 0.6 });
    }
    cheer(c, '¡PUM!', YELLOW, 210, 1.8);
    aside(c, '…¿ya?', 0xffffff, { delay: 0.8, dur: 2.5, size: 84, dy: 120 });
    // and the flyer comes back down, slowly
    later(c, 1.1, () => {
      if (c.reduce) return;
      const f = flyer(0.8);
      f.position.set(W - 380, -160);
      f.rotation = 0.4;
      c.fg.addChild(f);
      gsap.to(f, { y: H + 200, duration: 3.2, ease: 'none', onComplete: () => destroyTree(f) });
      gsap.to(f, { x: W - 560, rotation: -0.4, duration: 0.8, yoyo: true, repeat: 3, ease: 'sine.inOut' });
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const cx = w / 2;
    const cy = h * 0.4;
    const sky = vgrad(new Graphics(), 0, 0, w, h, BLUE, 14);
    // the overcast sky with the punched hole right behind him, its rim puffed with cloud
    const R = m * 0.42;
    const cover = new Graphics();
    cover.rect(0, 0, w, h).fill(0x8a8e97);
    cover.poly(ngon(cx, cy, R, R * 0.9, 28)).cut();
    const rim = new Graphics();
    const r = rnd(3);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      rim.poly(ngon(cx + Math.cos(a) * R * 1.02, cy + Math.sin(a) * R * 0.92, R * (0.16 + r() * 0.08), R * (0.12 + r() * 0.06), 10)).fill(i % 2 ? 0xa0a3ab : 0x9195a0);
    }
    // more puffs over the rest of the gray
    const n = Math.round(Math.min(60, (w / m) * 14));
    for (let i = 0; i < n; i++) {
      const x = r() * w;
      const y = r() * h * 0.7;
      if (Math.hypot(x - cx, (y - cy) / 0.9) < R * 1.25) continue;
      rim.poly(ngon(x, y, m * (0.08 + r() * 0.1), m * (0.05 + r() * 0.06), 10)).fill(i % 2 ? 0x7a7e88 : 0x9a9da5);
    }
    const sun = new Graphics();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      sun.poly([cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R, cx + Math.cos(a + 0.18) * R, cy + Math.sin(a + 0.18) * R]).fill({ color: 0xffffff, alpha: 0.16 });
    }
    const city = new Graphics();
    ruins(city, w, h * 0.86, u * 1.1, 9);
    city.rect(0, h * 0.86, w, h * 0.14).fill(0x55585f);
    const smoke = new Graphics();
    const vents = Array.from({ length: Math.max(2, Math.round(w / (m * 0.5))) }, (_, i) => (i + 0.5) * (w / Math.max(2, Math.round(w / (m * 0.5)))));
    const drawSmoke = (t: number) => {
      smoke.clear();
      vents.forEach((vx, j) => {
        if (Math.abs(vx - cx) < m * 0.3) return;
        for (let i = 0; i < 5; i++) {
          const q = (t * 0.2 + i / 5 + j * 0.17) % 1;
          const s = m * (0.04 + q * 0.09);
          smoke.poly(ngon(vx + q * m * 0.08, h * 0.72 - q * h * 0.5, s, s * 0.8, 10)).fill({ color: 0x4a4c52, alpha: 0.35 * (1 - q) });
        }
      });
    };
    drawSmoke(0.3);
    const fl = flyer((m / 400) * 0.55);
    fl.position.set(cx + m * 0.62, h * 0.3);
    fl.rotation = 0.3;
    k.addChild(sky, sun, cover, rim, city, smoke, fl);
    if (live)
      liveLoop(k, (t) => {
        drawSmoke(t);
        rim.x = Math.sin(t * 0.3) * m * 0.01;
        fl.y = h * 0.3 + Math.sin(t * 0.9) * m * 0.05;
        fl.rotation = 0.3 + Math.sin(t * 1.3) * 0.25;
      });
    return k;
  },
};
