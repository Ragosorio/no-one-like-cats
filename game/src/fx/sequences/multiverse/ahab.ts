/**
 * Capitán Ahabigotes: the whaling universe (Melville, public domain). A grey sea out of an old steel engraving — a ruled
 * sky, storm clouds, a light break, a whaler pitching on the horizon — and he stands on the gunwale of a whaleboat. The
 * harpoon lines snap taut across the screen, a spout breaks the horizon, and an enormous WHITE fin (a fish's: spiny
 * rays, old harpoons still in it) glides right under him dragging the lines along; its tail slaps the sea.
 * Payoff: the White Fish breaches behind him in one huge arc and crashes back; ¡AHÍ SOPLA! (¡el Pez Blanco!)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, later, score } from './kit';
import { cardLoop, hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { TAU, beat, ell, engrave, floatWord, glowDisc, headline, pay, smooth, wavePts } from './kitC';

const SKY = [0x222e35, 0x3a4a52, 0x6b7a7e];
const SEA = [0x3b5761, 0x2a414b, 0x1b2c34];
const FOAM = 0xe8e1d3;
const BONE = 0xf0ebdf;
const INK = 0x131a1e;
const ROPE = 0xb58e55;
const HORIZON = 590;

// --- the White Fish (local: head toward +x, ~1100 long, origin mid-body) ---------------------------
const BODY = smooth([500, 10, 470, -70, 380, -135, 220, -175, 40, -182, -150, -152, -320, -96, -430, -36, -430, 30, -320, 82, -150, 126, 60, 150, 260, 140, 410, 96, 482, 56], 5);
const BACK = smooth([470, -66, 380, -132, 220, -172, 40, -179, -150, -149, -320, -93, -426, -33, -300, -58, -100, -92, 100, -104, 300, -86, 440, -44], 4);
const TAIL = smooth([-412, -28, -540, -150, -626, -176, -560, -40, -548, 0, -560, 40, -626, 178, -540, 152, -412, 30], 4);

/** the spiny dorsal fin: a jagged polygon over the back (base from x0 to x1 at the back's height) */
function dorsalPts(): number[] {
  const p: number[] = [-230, -146];
  for (let i = 0; i < 8; i++) {
    const x = -205 + i * 52;
    p.push(x + 12, -330 + Math.abs(i - 3) * 16, x + 34, -206);
  }
  p.push(196, -170);
  return p;
}
const DORSAL = dorsalPts();

/** an old harpoon stuck in the hide at (x, y), leaning by `a`, with its rope trailing */
function harpoon(g: Graphics, x: number, y: number, a: number, len: number, seed: number) {
  const ex = x + Math.cos(a) * len;
  const ey = y + Math.sin(a) * len;
  g.moveTo(x, y).lineTo(ex, ey).stroke({ width: 9, color: 0x5a4430, cap: 'round' });
  g.moveTo(x, y).lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26).stroke({ width: 12, color: 0x4a4a4a, cap: 'round' });
  const r = rng(seed);
  const rope: number[] = [ex, ey];
  for (let i = 1; i <= 5; i++) rope.push(ex - i * 26 + (r() - 0.5) * 14, ey + i * 22 + Math.sin(i * 1.7) * 10);
  g.poly(smooth(rope, 4, false), false).stroke({ width: 4, color: ROPE, cap: 'round', join: 'round' });
}

/** the whole fish (one Graphics) */
function whiteFish(): Graphics {
  const g = new Graphics();
  g.poly(TAIL).fill(BONE).stroke({ width: 7, color: INK, join: 'round' });
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) g.moveTo(-440, s * (8 + i * 4)).lineTo(-600 + i * 8, s * (60 + i * 30)).stroke({ width: 2, color: INK, alpha: 0.5 });
  g.poly(DORSAL).fill(BONE).stroke({ width: 6, color: INK, join: 'round' });
  for (let i = 0; i < 8; i++) {
    const x = -205 + i * 52;
    g.moveTo(x + 18, -170).lineTo(x + 12, -322 + Math.abs(i - 3) * 16).stroke({ width: 3, color: INK, alpha: 0.6 });
  }
  g.poly(BODY).fill(BONE);
  g.poly(BACK).fill({ color: 0xbdb7aa, alpha: 0.75 });
  // engraved scales: short arcs in rows, as open polylines
  const r = rng(77);
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < 9; i++) {
      const x = -300 + i * 70 + (row % 2) * 35;
      const y = -100 + row * 46 + Math.abs(x) * 0.08;
      if (r() < 0.3) continue;
      g.poly([x - 16, y - 10, x - 4, y + 2, x + 14, y + 4], false).stroke({ width: 2.5, color: INK, alpha: 0.35 });
    }
  // scars
  for (let i = 0; i < 9; i++) {
    const x = -280 + r() * 640;
    const y = -120 + r() * 220;
    const a = -0.6 + r() * 1.2;
    g.moveTo(x, y).lineTo(x + Math.cos(a) * 60, y + Math.sin(a) * 60).stroke({ width: 3, color: INK, alpha: 0.55 });
  }
  g.poly(BODY).stroke({ width: 8, color: INK, join: 'round' });
  // gill, mouth, pectoral fin, eye
  g.poly(smooth([338, -118, 312, -20, 326, 84], 5, false), false).stroke({ width: 5, color: INK });
  g.poly([500, 12, 444, 34, 418, 26], false).stroke({ width: 6, color: INK, join: 'round' });
  g.poly(smooth([236, 40, 150, 128, 116, 104, 196, 30], 4)).fill(0xd9d3c6).stroke({ width: 5, color: INK, join: 'round' });
  g.poly(ell(395, -48, 26, 24, 18)).fill(0xfffcf2).stroke({ width: 5, color: INK });
  g.poly(ell(401, -46, 12, 13, 12)).fill(INK);
  g.poly(ell(405, -51, 4, 4, 8)).fill(0xffffff);
  g.moveTo(352, -96).lineTo(446, -8).stroke({ width: 4, color: INK, alpha: 0.7 });
  harpoon(g, 60, -176, -2.25, 190, 3);
  harpoon(g, -150, -150, -2.0, 160, 5);
  harpoon(g, 240, -168, -2.5, 150, 9);
  return g;
}

/** the fin above the water (dorsal fin + a hump of back), origin at the waterline, ~470 long */
function fin(): Graphics {
  const g = new Graphics();
  const hump = smooth([-300, 40, -220, -10, -60, -40, 120, -44, 260, -16, 330, 40], 5, false);
  g.poly([...hump, 330, 60, -300, 60]).fill(BONE).stroke({ width: 6, color: INK, join: 'round' });
  const d = DORSAL.map((v, i) => (i % 2 ? v + 140 : v));
  g.poly(d).fill(BONE).stroke({ width: 6, color: INK, join: 'round' });
  for (let i = 0; i < 8; i++) {
    const x = -205 + i * 52;
    g.moveTo(x + 18, -24).lineTo(x + 12, -182 + Math.abs(i - 3) * 16).stroke({ width: 3, color: INK, alpha: 0.6 });
  }
  harpoon(g, 40, -40, -2.3, 150, 3);
  harpoon(g, 210, -30, -2.55, 120, 9);
  return g;
}

/** the fish's tail fork, upright (origin at the waterline) */
function fluke(): Graphics {
  const g = new Graphics();
  const p = smooth([-34, 0, -26, -110, -150, -230, -196, -290, -60, -206, 0, -176, 60, -206, 196, -290, 150, -230, 26, -110, 34, 0], 4);
  g.poly(p).fill(BONE).stroke({ width: 7, color: INK, join: 'round' });
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) g.moveTo(s * 10, -150 - i * 10).lineTo(s * (90 + i * 30), -230 - i * 14).stroke({ width: 2, color: INK, alpha: 0.5 });
  return g;
}

// --- the world ----------------------------------------------------------------------------------
/** a three-masted whaler (origin at the waterline, ~330 wide) with its try-works smoke */
function whaler(s = 1): Container {
  const k = new Container();
  const g = new Graphics();
  const masts: [number, number][] = [
    [-82, 214],
    [10, 254],
    [96, 192],
  ];
  g.moveTo(-170, -22).lineTo(-82, -214).lineTo(10, -254).lineTo(96, -192).lineTo(190, -30).stroke({ width: 2, color: INK, alpha: 0.75 });
  for (const [x, h] of masts) g.rect(x - 3, -h, 6, h).fill(INK);
  for (const [x, h] of masts)
    for (let j = 0; j < 3; j++) {
      const seg = (h - 60) / 3;
      const y0 = -h + 18 + j * seg;
      const sw = 30 + j * 9;
      g.poly([x - sw, y0, x + sw, y0, x + sw + 6, y0 + seg - 8, x - sw - 6, y0 + seg - 8]).fill(0xcdc6b6).stroke({ width: 2, color: INK });
    }
  g.poly([-176, -30, 186, -36, 160, 8, -150, 8]).fill(0x2a2018).stroke({ width: 3, color: INK });
  g.rect(-160, -24, 334, 5).fill(0xc8b88a);
  for (let i = 0; i < 9; i++) g.rect(-140 + i * 34, -17, 12, 6).fill(INK);
  const smoke = new Graphics();
  const r = rng(31);
  for (let i = 0; i < 7; i++) smoke.poly(ell(-20 - i * 34 - r() * 10, -60 - i * 16 - r() * 10, 22 + i * 6, 16 + i * 4, 12)).fill({ color: 0x4c5458, alpha: 0.55 - i * 0.05 });
  k.addChild(smoke, g);
  k.scale.set(s);
  return k;
}

/** a storm cloud: a lumpy dark polygon with a lit top edge */
function cloud(g: Graphics, x: number, y: number, rx: number, ry: number, seed: number) {
  const r = rng(seed);
  const p: number[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const k = i < 6 ? 0.7 + r() * 0.5 : 0.9 + r() * 0.15;
    p.push(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * (a > Math.PI ? 1 + r() * 0.5 : 0.6));
  }
  const s = smooth(p, 4);
  g.poly(s.map((v, i) => (i % 2 ? v - ry * 0.12 : v))).fill({ color: 0x5f6e74, alpha: 0.55 });
  g.poly(s).fill({ color: 0x1b252b, alpha: 0.85 });
}

/** a band of waves wider than the screen by one wavelength each side (moved, never redrawn), with foam on the crests */
function waveBand(w: number, y: number, amp: number, len: number, color: number, bottom: number, foam = 0): Graphics {
  const g = new Graphics();
  g.poly(wavePts(-len, w + len, y, amp, len, 0, bottom, len / 10)).fill(color);
  if (foam > 0)
    for (let x = -len + len * 0.25; x < w + len; x += len) {
      const top = (xx: number) => y + Math.sin((xx / len) * TAU) * amp;
      const p: number[] = [];
      for (let i = -4; i <= 4; i++) p.push(x + i * len * 0.05, top(x + i * len * 0.05) - 1);
      for (let i = 4; i >= -4; i--) p.push(x + i * len * 0.05, top(x + i * len * 0.05) + foam * (1 - Math.abs(i) / 5));
      g.poly(p).fill({ color: FOAM, alpha: 0.85 });
    }
  return g;
}

/** the whaleboat under him (origin: middle of the gunwale; the bow rises at the right) */
function whaleboat(): Graphics {
  const g = new Graphics();
  for (const [x0, y0, x1, y1] of [
    [-260, 20, -420, 150],
    [-120, 26, -250, 160],
    [140, 22, 250, 160],
  ])
    g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 10, color: 0x7a5a3a, cap: 'round' });
  const hull = smooth([-440, 0, -200, 10, 150, 10, 360, -12, 476, -84, 440, 40, 250, 98, -100, 104, -380, 66, -452, 14], 5);
  g.poly(hull).fill(0x4d3a29).stroke({ width: 6, color: INK, join: 'round' });
  for (const y of [34, 60, 84]) g.poly(smooth([-420, y - 24, -100, y, 200, y - 4, 410, y - 52 - (y - 34) * 0.2], 4, false), false).stroke({ width: 3, color: 0x2b1f15 });
  g.poly(smooth([-446, 4, -200, 14, 150, 14, 362, -8, 474, -80], 4, false), false).stroke({ width: 12, color: 0x8f6f47, cap: 'round' });
  return g;
}

/** a rope from a to b sagging by `sag` (a vibrating line when sag swings) */
function rope(g: Graphics, ax: number, ay: number, bx: number, by: number, sag: number) {
  const p: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    p.push(ax + (bx - ax) * t, ay + (by - ay) * t + Math.sin(t * Math.PI) * sag);
  }
  g.poly(p, false).stroke({ width: 7, color: ROPE, cap: 'round', join: 'round' });
  g.poly(p, false).stroke({ width: 2, color: 0xe2c792, alpha: 0.7, cap: 'round', join: 'round' });
}

interface St {
  ship: Container;
  ropes: Graphics;
  /** the lines' far ends follow this point */
  target: { x: number; y: number; sag: number; amp: number };
  bands: Graphics[];
  boat: Graphics;
}
const S = stash<St>();
const BOAT: [number, number] = [W / 2 + 40, 775];
const BOW: [number, number] = [BOAT[0] + 474, BOAT[1] - 80];
const STERN: [number, number] = [BOAT[0] - 440, BOAT[1] + 2];

/** a geyser of foam rising from (x, y) */
function spout(c: SigCtx, layer: Container, x: number, y: number, s = 1) {
  if (c.reduce) return;
  for (let i = 0; i < 14; i++) {
    const p = new Graphics().poly(ell(0, 0, 18 * s, 14 * s, 10)).fill({ color: FOAM, alpha: 0.85 });
    p.position.set(x + (Math.random() - 0.5) * 20 * s, y);
    layer.addChild(p);
    const top = y - (140 + Math.random() * 120) * s;
    const dx = (Math.random() - 0.5) * 180 * s;
    gsap.to(p, { y: top, duration: 0.45 + Math.random() * 0.2, ease: 'power2.out', delay: i * 0.02 });
    gsap.to(p, { x: p.x + dx, duration: 1.1, ease: 'sine.out', delay: i * 0.02 });
    gsap.to(p.scale, { x: 2.4, y: 1.8, duration: 1.1, delay: i * 0.02 });
    gsap.to(p, { alpha: 0, duration: 0.6, delay: 0.55 + i * 0.02, onComplete: () => destroyTree(p) });
  }
}

/** white water thrown up at (x, y) */
function splash(c: SigCtx, layer: Container, x: number, y: number, n = 22, s = 1) {
  if (c.reduce) return;
  for (let i = 0; i < n; i++) {
    const p = new Graphics().poly(ell(0, 0, (8 + Math.random() * 14) * s, (6 + Math.random() * 10) * s, 8)).fill({ color: i % 3 ? FOAM : 0xc8d4d4, alpha: 0.9 });
    p.position.set(x + (Math.random() - 0.5) * 160 * s, y);
    layer.addChild(p);
    const vx = (Math.random() - 0.5) * 700 * s;
    const vy = -(300 + Math.random() * 500) * s;
    const T = 0.9 + Math.random() * 0.4;
    gsap.to(p, { x: p.x + vx * T * 0.6, duration: T, ease: 'none' });
    gsap.to(p, { y: y + vy * 0.55, duration: T * 0.45, ease: 'power2.out' });
    gsap.to(p, { y: y + 140, duration: T * 0.55, delay: T * 0.45, ease: 'power2.in' });
    gsap.to(p, { alpha: 0, duration: 0.3, delay: T * 0.75, onComplete: () => destroyTree(p) });
  }
}

export const ahab: Signature = {
  dark: true,
  frame: 0xe6dfcf,
  tag: 'UNIVERSO BALLENERO',
  open(c: SigCtx) {
    const k = new Container();
    const sky = new Graphics();
    vgrad(sky, 0, 0, W, HORIZON + 4, SKY, 24);
    engrave(sky, 0, 6, W, HORIZON - 10, 9, 3.2, 0.5, INK, 0.32);
    // a break in the clouds: soft light over the sea behind him
    const brk = glowDisc(520, 0xdfe6e2, 0.22, 7, 32);
    brk.position.set(W / 2 + 120, HORIZON - 120);
    const rays = new Graphics();
    for (const [x0, x1] of [
      [1180, 820],
      [1300, 1180],
      [1420, 1560],
    ])
      rays.poly([x0 - 30, 0, x0 + 30, 0, x1 + 90, HORIZON, x1 - 90, HORIZON]).fill({ color: 0xe9efe9, alpha: 0.07 });
    rays.blendMode = 'add';
    const clouds = new Graphics();
    cloud(clouds, 260, 90, 380, 120, 1);
    cloud(clouds, 900, 40, 460, 110, 2);
    cloud(clouds, 1640, 110, 420, 130, 3);
    cloud(clouds, 1240, 230, 260, 60, 4);
    const ship = whaler(0.95);
    ship.position.set(330, HORIZON + 8);
    const seaBase = new Graphics().rect(0, HORIZON, W, H - HORIZON).fill(SEA[0]);
    engrave(seaBase, 0, HORIZON + 6, W, H - HORIZON, 11, 0.8, 3.4, 0x15232a, 0.45);
    const b1 = waveBand(W, HORIZON + 46, 6, 120, 0x35505a, H, 3);
    const b2 = waveBand(W, HORIZON + 160, 14, 260, SEA[1], H, 6);
    const b3 = waveBand(W, HORIZON + 300, 24, 380, SEA[2], H, 9);
    const spoutL = new Container();
    k.addChild(sky, brk, rays, clouds, ship, seaBase, b1, spoutL, b2, b3);
    c.back.addChild(k);
    hideDisc(c);
    // behind him: the near water, the boat, the lines
    const halo = glowDisc(400, 0xdfe6e2, 0.3, 10, 32);
    halo.position.set(W / 2, c.catY - 40);
    const finK = new Container();
    const near = waveBand(W, 840, 16, 300, SEA[2], H, 7);
    const boat = whaleboat();
    boat.position.set(BOAT[0], BOAT[1]);
    const ropes = new Graphics();
    c.behind.addChild(halo, near, ropes, boat, finK);
    const target = { x: W + 80, y: 720, sag: 40, amp: 0 };
    const bands = [b1, b2, b3, near];
    S.set(c, { ship, ropes, target, bands, boat });
    const drawRopes = (t: number) => {
      if (ropes.destroyed) return;
      ropes.clear();
      const v = target.amp * Math.sin(t * 42);
      rope(ropes, BOW[0], BOW[1], target.x, target.y - 30, target.sag + v);
      rope(ropes, STERN[0], STERN[1], target.x, target.y, target.sag * 1.2 - v);
    };
    drawRopes(0);
    if (!c.reduce)
      every(c, 30, (t) => {
        const sp = [18, -32, 46, -60];
        bands.forEach((b, i) => {
          if (b.destroyed) return;
          const len = [120, 260, 380, 300][i];
          b.x = (((t * sp[i]) % len) + len) % len - len;
          b.y = Math.sin(t * (1.1 + i * 0.3) + i) * (3 + i * 3);
        });
        if (!ship.destroyed) {
          ship.rotation = Math.sin(t * 1.3) * 0.07;
          ship.y = HORIZON + 8 + Math.sin(t * 1.3 + 0.6) * 5;
        }
        if (!boat.destroyed) {
          boat.rotation = Math.sin(t * 1.6) * 0.012;
          boat.y = BOAT[1] + Math.sin(t * 1.6 + 1) * 4;
        }
        target.amp *= 0.9;
        drawRopes(t);
      });
    if (c.short) {
      target.x = -80;
      target.y = 830;
      target.sag = 60;
      drawRopes(0);
      return;
    }
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.35 });
    }
    score(c, [
      [0.02, 'whoosh', 0.35],
      [0.05, 'splash', 0.45],
      [0.28, 'shoot', 0.42],
      [0.62, 'splash', 0.32],
      [0.64, 'whoosh', 0.6],
      [0.95, 'whoosh', 0.3],
      [1.25, 'splash', 0.62],
      [1.85, 'boom', 0.5],
      [1.87, 'splash', 0.4],
    ]);
    // the lines snap taut
    beat(c, 0.28, () => {
      target.sag = 6;
      target.amp = 26;
      c.shaker.add(0.15);
    });
    // a spout on the horizon
    beat(c, 0.62, () => {
      spout(c, spoutL, 1560, HORIZON + 30, 1.1);
      floatWord(c, c.back, 1560, HORIZON - 170, 'fuuush…', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 34, fill: BONE, stroke: { color: INK, width: 6 } }, 40, 1);
    });
    // the white fin glides right under him, dragging the lines
    beat(c, 0.9, () => {
      // right under him, in front of the boat: its base is the bottom of the screen (the water nearest to us)
      const f = fin();
      f.scale.set(1.7);
      f.position.set(W + 560, H + 30);
      finK.addChild(f);
      const p = { x: W + 560 };
      const dur = c.reduce ? 0.01 : 1.25;
      gsap.to(p, {
        x: -620,
        duration: dur,
        ease: 'sine.inOut',
        onUpdate: () => {
          if (f.destroyed) return;
          f.x = p.x;
          f.y = H + 30 + Math.sin(p.x / 120) * 6;
          target.x = p.x + 60;
          target.y = 960;
          target.sag = 4;
        },
        onComplete: () => {
          destroyTree(f);
          target.sag = 50;
          target.amp = 18;
        },
      });
      if (!c.reduce) {
        c.shaker.add(0.25);
        const wake = every(c, 22, () => {
          if (f.destroyed) return wake();
          const w = new Graphics().poly(ell(0, 0, 50 + Math.random() * 50, 12 + Math.random() * 8, 12)).fill({ color: FOAM, alpha: 0.75 });
          w.position.set(f.x + 520 + Math.random() * 60, H - 10 + (Math.random() - 0.5) * 16);
          finK.addChild(w);
          gsap.to(w.scale, { x: 2.2, y: 1.4, duration: 0.8 });
          gsap.to(w, { alpha: 0, duration: 0.8, onComplete: () => destroyTree(w) });
        });
      }
    });
    // its tail rises at the far left and slaps the sea
    beat(c, 1.55, () => {
      const t = fluke();
      t.scale.set(0.8);
      t.position.set(250, HORIZON + 230);
      c.back.addChildAt(t, c.back.children.indexOf(k) + 1);
      if (c.reduce) {
        later(c, 0.5, () => destroyTree(t));
        return;
      }
      t.scale.y = 0.05;
      gsap.to(t.scale, { y: 0.8, duration: 0.25, ease: 'power2.out' });
      gsap.to(t, { rotation: -0.5, duration: 0.25, delay: 0.1 });
      gsap.to(t.scale, { y: 0.02, duration: 0.16, delay: 0.32, ease: 'power2.in', onComplete: () => destroyTree(t) });
    });
    beat(c, 1.86, () => {
      splash(c, c.back, 260, HORIZON + 220, 20, 0.9);
      c.shaker.add(0.3);
      target.amp = 22;
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('bigboom', 0.5);
    sfx('splash', 0.38);
    later(c, 0.05, () => sfx('whoosh', 0.35));
    later(c, 1.15, () => sfx('splash', 0.3));
    later(c, 1.17, () => sfx('boom', 0.42));
    c.shaker.add(0.55);
    if (st) {
      st.target.amp = 30;
      st.target.sag = 4;
    }
    // the White Fish breaches behind him (in front of the far sea, behind the near water and the boat)
    const fish = whiteFish();
    const holder = new Container();
    holder.addChild(fish);
    // in front of the far sea, behind the nearest waves (and the boat, which lives in c.behind)
    const near = st?.bands[2];
    const parent = near && !near.destroyed ? near.parent : null;
    if (parent) parent.addChildAt(holder, parent.children.indexOf(near!));
    else c.back.addChild(holder);
    if (c.reduce) {
      fish.scale.set(-1.05, 1.05);
      holder.position.set(W / 2 + 330, 470);
      holder.rotation = 0.2;
      gsap.to(holder, { alpha: 0, delay: 2.6, duration: 0.5, onComplete: () => destroyTree(holder) });
    } else {
      fish.scale.set(-1.15, 1.15);
      const p = { t: 0 };
      const X0 = W + 380;
      const X1 = -420;
      const Y0 = 1180;
      const APEX = 210;
      const pos = (t: number) => [X0 + (X1 - X0) * t, Y0 - (Y0 - APEX) * 4 * t * (1 - t)];
      gsap.to(p, {
        t: 1,
        duration: 1.35,
        ease: 'none',
        onUpdate: () => {
          if (holder.destroyed) return;
          const [x, y] = pos(p.t);
          const [x2, y2] = pos(Math.min(1, p.t + 0.01));
          holder.position.set(x, y);
          holder.rotation = Math.atan2(-(y2 - y), -(x2 - x));
        },
        onComplete: () => destroyTree(holder),
      });
      splash(c, c.back, W - 260, 900, 26, 1.1);
      later(c, 1.12, () => {
        splash(c, c.back, 300, 900, 30, 1.2);
        spout(c, c.back, 300, 880, 1.3);
        c.shaker.add(0.4);
      });
      // spray across the front
      later(c, 0.15, () => splash(c, c.fg, W / 2 + 520, 980, 12, 0.8));
    }
    headline(c, '¡AHÍ SOPLA!', { fontFamily: F.serif, fontWeight: '700', fontSize: 132, fill: BONE, letterSpacing: 2, stroke: { color: INK, width: 14, join: 'round' } }, {
      aside: '(¡el Pez Blanco!)',
      asideStyle: { fill: 0xdfe6e2, stroke: { color: INK, width: 8, join: 'round' } },
      dur: 2.6,
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const hz = h * 0.58;
    const g = new Graphics();
    vgrad(g, 0, 0, w, hz + 2, SKY, 16);
    engrave(g, 0, 4 * u, w, hz - 8 * u, 7 * u, 2.4 * u, 0.4 * u, INK, 0.3);
    const clouds = new Graphics();
    for (let i = 0; i < Math.ceil(w / (150 * u)); i++) cloud(clouds, i * 150 * u + 40 * u, (i % 2 ? 26 : 12) * u, 110 * u, 34 * u, i + 1);
    const lightG = glowDisc(Math.min(w, h) * 0.5, 0xdfe6e2, 0.22, 6, 28);
    lightG.position.set(w / 2, hz - 30 * u);
    const sea = new Graphics().rect(0, hz, w, h - hz).fill(SEA[0]);
    engrave(sea, 0, hz + 3 * u, w, h - hz, 6 * u, 0.5 * u, 2 * u, 0x15232a, 0.45);
    const ship = whaler(0.32 * u);
    ship.position.set(w / 2 - 125 * u, hz + 2 * u);
    const fish = whiteFish();
    fish.scale.set(0.27 * u);
    fish.position.set(w / 2, h * 0.6);
    fish.rotation = -0.12;
    const b1 = waveBand(w, hz + 14 * u, 2 * u, 40 * u, 0x35505a, h, 1.2 * u);
    const b2 = waveBand(w, h * 0.78, 5 * u, 90 * u, SEA[1], h, 2.4 * u);
    const b3 = waveBand(w, h * 0.92, 7 * u, 120 * u, SEA[2], h, 3 * u);
    const spoutG = new Graphics();
    for (let i = 0; i < 7; i++) spoutG.poly(ell((i - 3) * 5 * u, -i * 7 * u, (6 + i * 1.6) * u, (4 + i) * u, 10)).fill({ color: FOAM, alpha: 0.8 });
    spoutG.position.set(w / 2 + 135 * u, hz + 4 * u);
    k.addChild(g, clouds, lightG, sea, ship, b1, spoutG, fish, b2, b3);
    if (live)
      cardLoop(k, 30, (t) => {
        const L = [40 * u, 90 * u, 120 * u];
        [b1, b2, b3].forEach((b, i) => {
          b.x = ((((t * [6, -11, 16][i] * u) % L[i]) + L[i]) % L[i]) - L[i];
          b.y = Math.sin(t * (1.2 + i * 0.3) + i) * (1 + i) * u;
        });
        ship.rotation = Math.sin(t * 1.3) * 0.07;
        fish.y = h * 0.6 + Math.sin(t * 0.9) * 4 * u;
        fish.rotation = -0.12 + Math.sin(t * 0.9 + 1) * 0.025;
        const s = (t % 3) / 3;
        spoutG.scale.set(0.6 + s * 0.8, 0.4 + Math.min(1, s * 3) * 0.8);
        spoutG.alpha = s < 0.7 ? 1 : (1 - s) / 0.3;
      });
    return k;
  },
};
