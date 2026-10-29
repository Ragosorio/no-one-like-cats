/**
 * El Gatejo: the night road's universe (the Central American legend of the two spirit dogs that walk with whoever is
 * out alone at night — here, one cat split white and black). A dirt road between cornfields under a full moon, a
 * little house far away with one lit window, fog in the furrows. A tiny kitten walks the road alone with a trembling
 * lantern («¿hay alguien…?»); a chain drags somewhere («clanc… clanc…»); in the fog two eyes open, one soft blue and
 * one ember; the fog parts and the silhouette comes out split in white and black: ¡GUAU-MIAU!
 * Payoff: glowing paw prints light the road all the way to the little house: ¡NADIE ANDA SOLO!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, later, score } from './kit';
import { balloon } from './kitD';
import { copyOf } from './kitE';
import { pawPrint } from './kitC';
import {
  C,
  F,
  at,
  band,
  cardLoop,
  comic,
  dab,
  fireflies,
  flat,
  fogBank,
  glowDisc,
  hideDisc,
  moon,
  ngon,
  onCat,
  park,
  payline,
  pre,
  puffWord,
  rnd,
  stash,
  streak,
  take,
  twinkle,
  vgrad,
  wrap,
} from './kitJ';

const SKY = [0x04060d, 0x0a1222, 0x142038, 0x223450];
const BLUE = 0x7cc8ff;
const EMBER = 0xff6b35;
const BONE = 0xf4f1ea;
const LIT = 0xffc66a;
const CORN = [0x0f1a16, 0x14241c, 0x1b3024];

/** his eyes in the painting (blue on the white side, ember on the black) and the line where white turns black */
const EYE_B: [number, number] = [0.352, 0.325];
const EYE_E: [number, number] = [0.435, 0.325];
const SPLIT = 0.4;

/** the ragged edge of the white side (long fur tufts, seeded so it's the same every time) */
const TUFT = (() => {
  const r = rnd(29);
  return Array.from({ length: 19 }, (_, i) => (i % 2 ? 6 + r() * 16 : -4 - r() * 10));
})();

/** soft fog: wide flat puffs, each three nested ellipses (a soft center, no hard edges) */
function softFog(g: Graphics, x0: number, w: number, y: number, h: number, color: number, alpha: number, r: () => number, n: number) {
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + r() * 0.8) * (w / n);
    const rx = (w / n) * (1.4 + r() * 1.2);
    const ry = h * (0.35 + r() * 0.4);
    const yy = y + (r() - 0.5) * h * 0.6;
    for (const k of [1, 0.68, 0.38]) g.poly(ngon(x, yy, rx * k, ry * k, 16)).fill({ color, alpha: alpha * 0.34 });
  }
  return g;
}

/** a corn plant: stalk, drooping leaves, a tassel and maybe an ear (one color; ~80 vertices) */
function corn(g: Graphics, x: number, y: number, s: number, r: () => number, color: number, leaves = 5) {
  const lean = (r() - 0.5) * s * 0.12;
  g.poly(streak(x, y, x + lean, y - s, s * 0.03, s * 0.012)).fill(color);
  for (let i = 0; i < leaves; i++) {
    const v = 0.22 + (i * 0.65) / leaves + r() * 0.04;
    const sx = x + lean * v;
    const sy = y - s * v;
    const dir = i % 2 ? 1 : -1;
    const L = s * (0.34 + r() * 0.16) * (1 - v * 0.35);
    g.poly(dab(sx, sy, sx + dir * L * 0.55, sy - L * 0.32, sx + dir * L, sy + L * 0.12, s * 0.03)).fill(color);
  }
  for (let i = -1; i <= 1; i++) g.poly(streak(x + lean, y - s, x + lean + i * s * 0.07, y - s * 1.13, s * 0.012, s * 0.004)).fill(color);
  if (leaves > 3 && r() < 0.5) g.poly(ngon(x + lean * 0.45 + s * 0.035, y - s * 0.45, s * 0.03, s * 0.08, 8, 0.3)).fill(color);
}

/** a far row of corn as one jagged silhouette (tassels as spikes): a few hundred vertices whatever the width */
function cornBand(g: Graphics, x0: number, x1: number, y: number, s: number, r: () => number, color: number) {
  const pts: number[] = [x0, y + s * 0.25];
  for (let x = x0; x <= x1; x += s * 0.22) {
    pts.push(x, y - s * (0.62 + r() * 0.12));
    pts.push(x + s * 0.11, y - s * (r() < 0.4 ? 1.0 + r() * 0.15 : 0.74 + r() * 0.1));
  }
  pts.push(x1, y + s * 0.25);
  g.poly(pts).fill(color);
}

/**
 * the road at night (w×h): sky, stars, moon, hills, the cornfields in three depths (their own Containers: they sway),
 * the winding dirt road to the little house, the lantern post, fog. `u` = h / 1080; the road's far end is at (rx, hz).
 */
function nightRoad(w: number, h: number, seed: number, o: { lamp?: boolean } = {}) {
  const u = h / 1080;
  const cx = w / 2;
  const hz = h * 0.56;
  const r = rnd(seed);
  const k = new Container();
  const sky = vgrad(new Graphics(), 0, 0, w, hz + 20 * u, SKY, 16);
  const stars = new Graphics();
  const ns = Math.round((w * h) / (50000 * u * u));
  for (let i = 0; i < ns; i++) {
    const sx = r() * w;
    const sy = r() * hz * 0.85;
    const s = (1 + r() * 2) * u;
    if (i % 8 === 0) stars.poly(twinkle(sx, sy, s * 3)).fill({ color: 0xdfeaff, alpha: 0.85 });
    else stars.rect(sx, sy, s, s).fill({ color: 0xdfeaff, alpha: 0.35 + r() * 0.5 });
  }
  const m = moon(118 * u, 0xeef3ff, 0xa8c4ff, 0xc8d2e8, 0.45);
  m.position.set(cx + h * 0.4, h * 0.21);
  const hills = new Graphics();
  const hp = (y0: number, amp: number, col: number, sd: number) => {
    const rr = rnd(sd);
    const pts: number[] = [-20, h];
    for (let x = -20; x <= w + 40; x += 80 * u) pts.push(x, y0 - amp * (0.5 + 0.5 * Math.sin(x / (260 * u) + sd)) - rr() * amp * 0.3);
    pts.push(w + 40, h);
    hills.poly(pts).fill(col);
  };
  hp(hz - 30 * u, 70 * u, 0x0b1424, 3);
  hp(hz, 40 * u, 0x0e1a20, 5);
  // the far fields (a dark band) and the road
  const ground = new Graphics();
  ground.rect(0, hz, w, h - hz).fill(0x0c1612);
  const rx = cx - h * 0.42;
  const road = [cx + h * 0.08, h * 1.05, cx + h * 0.02, h * 0.86, cx - h * 0.12, h * 0.72, cx - h * 0.3, h * 0.62, rx, hz + 6 * u];
  const smoothRoad: number[] = [];
  for (let i = 0; i < road.length / 2 - 1; i++) {
    for (let j = 0; j < 6; j++) {
      const q = j / 6;
      const a = (1 - q) * (1 - q);
      const b = 2 * (1 - q) * q;
      const cc = q * q;
      const x0 = road[i * 2];
      const y0 = road[i * 2 + 1];
      const x1 = road[i * 2 + 2];
      const y1 = road[i * 2 + 3];
      const mx = (x0 + x1) / 2 + (i % 2 ? -1 : 1) * 20 * u;
      const my = (y0 + y1) / 2;
      smoothRoad.push(a * x0 + b * mx + cc * x1, a * y0 + b * my + cc * y1);
    }
  }
  smoothRoad.push(rx, hz + 6 * u);
  ground.poly(band(smoothRoad, h * 0.3, h * 0.012)).fill(0x3a3328);
  ground.poly(band(smoothRoad, h * 0.22, h * 0.008)).fill({ color: 0x5a5244, alpha: 0.35 });
  // the moonlight on the road
  ground.poly(band(smoothRoad, h * 0.05, h * 0.002)).fill({ color: 0xa8c4ff, alpha: 0.08 });
  // the little house at the end of the road, one lit window
  const house = new Graphics();
  const hx = rx - 50 * u;
  const hy = hz + 4 * u;
  house.rect(hx - 34 * u, hy - 34 * u, 68 * u, 34 * u).fill(0x2a2430);
  house.poly([hx - 42 * u, hy - 32 * u, hx, hy - 58 * u, hx + 42 * u, hy - 32 * u]).fill(0x3a1e1c);
  const win = new Graphics().rect(hx + 6 * u, hy - 24 * u, 14 * u, 12 * u).fill(LIT);
  const winGlow = glowDisc(60 * u, LIT, 0.4, 5, 16);
  winGlow.position.set(hx + 13 * u, hy - 18 * u);
  // the cornfields: far (small, many), mid, near (big, framing the edges, away from the cat)
  const far = new Graphics();
  const mid = new Graphics();
  const near = new Graphics();
  const roadX = (y: number) => {
    // the road's center x at height y (rough: nearest smoothed sample)
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < smoothRoad.length; i += 2) {
      const d = Math.abs(smoothRoad[i + 1] - y);
      if (d < bd) {
        bd = d;
        best = smoothRoad[i];
      }
    }
    return best;
  };
  const rows: [Graphics, number, number, number, number][] = [
    [far, 0.02, 0.18, 26, 0],
    [mid, 0.22, 0.5, 70, 1],
    [near, 0.62, 0.95, 230, 2],
  ];
  for (const [g, z0, z1, s0, ci] of rows) {
    const nz = ci === 2 ? 2 : 3;
    for (let zi = 0; zi < nz; zi++) {
      const z = z0 + ((z1 - z0) * zi) / Math.max(1, nz - 1);
      const y = hz + (h - hz) * z;
      const s = s0 * u * (0.8 + z * 0.8);
      const halfRoad = h * (0.012 + 0.29 * Math.pow(z, 1.3)) + s * 0.25;
      const rc = roadX(y);
      if (ci === 0) {
        // far: two jagged bands, one each side of the road
        cornBand(g, -20 * u, rc - halfRoad, y, s, r, CORN[0]);
        cornBand(g, rc + halfRoad, w + 20 * u, y, s, r, CORN[0]);
        continue;
      }
      for (let x = -s * 0.5 + r() * s * 0.4; x < w + s * 0.5; x += s * (ci === 1 ? 0.62 + r() * 0.25 : 0.42 + r() * 0.2)) {
        if (Math.abs(x - rc) < halfRoad) continue;
        // the near row keeps away from the cat (the middle of the screen)
        if (ci === 2 && Math.abs(x - cx) < h * 0.4) continue;
        corn(g, x, y, s, r, CORN[ci], ci === 1 ? 3 : 5);
      }
    }
  }
  // the lantern post by the road (its glow trembles)
  const lamp = new Container();
  const glow = glowDisc(170 * u, LIT, 0.38, 7, 24);
  const post = new Graphics();
  const lx = cx - h * 0.44;
  const ly = h * 0.78;
  if (o.lamp !== false) {
    post.rect(lx - 6 * u, ly - 210 * u, 12 * u, 210 * u).fill(0x1a1410);
    post.rect(lx - 6 * u, ly - 210 * u, 46 * u, 8 * u).fill(0x1a1410);
    post.poly([lx + 26 * u, ly - 202 * u, lx + 46 * u, ly - 202 * u, lx + 50 * u, ly - 170 * u, lx + 22 * u, ly - 170 * u]).fill(0xffd27a);
    post.poly([lx + 20 * u, ly - 204 * u, lx + 36 * u, ly - 222 * u, lx + 52 * u, ly - 204 * u]).fill(0x1a1410);
    glow.position.set(lx + 36 * u, ly - 186 * u);
    lamp.addChild(glow, post);
  }
  // fog in the furrows
  const fog = new Graphics();
  fogBank(fog, -100 * u, w + 200 * u, hz + 40 * u, 40 * u, 0x8aa0c0, 0.12, rnd(seed + 1), Math.max(8, Math.round(w / (160 * u))));
  fogBank(fog, -100 * u, w + 200 * u, hz + 160 * u, 70 * u, 0x8aa0c0, 0.14, rnd(seed + 2), Math.max(8, Math.round(w / (160 * u))));
  const nearK = new Container();
  nearK.addChild(near);
  const midK = new Container();
  midK.addChild(mid);
  k.addChild(sky, stars, m, hills, ground, winGlow, house, win, far, midK, lamp, fog, nearK);
  const sway = (t: number) => {
    midK.skew.x = Math.sin(t * 0.9) * 0.015;
    nearK.skew.x = Math.sin(t * 0.7 + 1) * 0.03;
    fog.x = Math.sin(t * 0.35) * 60 * u;
    glow.alpha = 0.75 + 0.25 * Math.sin(t * 23) * Math.sin(t * 7.3);
    glow.x = lx + 36 * u + Math.sin(t * 31) * 2 * u;
    winGlow.alpha = 0.8 + 0.2 * Math.sin(t * 2);
  };
  return { k, sway, fog, road: smoothRoad, house: [hx, hy] as [number, number], u };
}

/** the little kitten with its lantern on a stick (origin at its feet, facing right; ~90 px at s = 1) */
function kitten(s = 1) {
  const k = new Container();
  const body = new Graphics();
  body.poly([-26, 0, -30, -26, -22, -46, -6, -52, 12, -50, 24, -40, 28, -20, 24, 0].map((v) => v * s)).fill(0x1a1622);
  body.poly([-2, -50, 2, -84, 20, -92, 34, -86, 40, -66, 32, -50, 14, -44].map((v) => v * s)).fill(0x1a1622);
  body.poly([6, -84, 8, -104, 18, -90].map((v) => v * s)).fill(0x1a1622);
  body.poly([26, -88, 34, -106, 38, -86].map((v) => v * s)).fill(0x1a1622);
  body.poly([-26, -20, -50, -36, -58, -60, -52, -62, -44, -42, -24, -30].map((v) => v * s)).fill(0x1a1622);
  // the lantern's warm light on its front (a rim on the face, chest and ear)
  body.poly([18, -48, 26, -40, 28, -20, 24, 0, 18, 0, 20, -24].map((v) => v * s)).fill({ color: 0xffb860, alpha: 0.55 });
  body.poly([30, -86, 38, -80, 40, -66, 34, -54, 30, -64].map((v) => v * s)).fill({ color: 0xffb860, alpha: 0.55 });
  body.poly([34, -104, 38, -88, 34, -88].map((v) => v * s)).fill({ color: 0xffb860, alpha: 0.6 });
  // the eyes catch the lantern
  const eyes = new Graphics().poly(ngon(22 * s, -70 * s, 4 * s, 5 * s, 8)).fill(0xffe7a8).poly(ngon(34 * s, -70 * s, 4 * s, 5 * s, 8)).fill(0xffe7a8);
  const lamp = new Container();
  const stick = new Graphics().poly(streak(0, 0, 34 * s, -40 * s, 2 * s, 1.5 * s)).fill(0x5a3a22);
  const box = new Graphics();
  box.poly([30 * s, -40 * s, 40 * s, -40 * s, 42 * s, -22 * s, 28 * s, -22 * s]).fill(0xffd27a);
  box.poly([28 * s, -42 * s, 35 * s, -50 * s, 42 * s, -42 * s]).fill(0x1a1410);
  const glow = glowDisc(70 * s, LIT, 0.45, 5, 18);
  glow.position.set(35 * s, -31 * s);
  lamp.addChild(glow, stick, box);
  lamp.position.set(18 * s, -36 * s);
  k.addChild(lamp, body, eyes);
  return { k, lamp, eyes };
}

interface St {
  eyes: Container | null;
  white: Container | null;
  kit: Container | null;
  road: number[];
  house: [number, number];
  u: number;
}
const S = stash<St>();

export const gatejo: Signature = {
  dark: true,
  frame: 0xff6b35,
  tag: 'UNIVERSO DEL CAMINO DE NOCHE',
  open(c: SigCtx) {
    const nr = nightRoad(W, H, 23);
    c.back.addChild(nr.k);
    hideDisc(c, 0.2);
    if (!c.short && !c.reduce) {
      nr.k.alpha = 0;
      gsap.to(nr.k, { alpha: 1, duration: 0.35 });
    }
    // moonlight behind him (the silhouette reads)
    const halo = glowDisc(390, 0x9fb8e0, 0.24, 8, 28);
    halo.position.set(W / 2, c.catY);
    c.behind.addChild(halo);
    if (!c.reduce) every(c, 30, (t) => !nr.k.destroyed && nr.sway(t));
    park(c, 'main', comic('¡NADIE ANDA SOLO!', BONE, 112));
    const st: St = { eyes: null, white: null, kit: null, road: nr.road, house: nr.house, u: nr.u };
    S.set(c, st);

    // the kitten on the road with its lantern (it stays: the payoff walks it home)
    const kt = kitten(1.35);
    kt.k.position.set(c.reduce || c.short ? 520 : 230, 905);
    c.fg.addChild(kt.k);
    st.kit = kt.k;
    if (!c.reduce)
      every(c, 30, (t) => {
        if (kt.k.destroyed) return;
        kt.lamp.rotation = Math.sin(t * 26) * 0.06 + Math.sin(t * 9) * 0.03;
      });
    if (c.short) return;

    const ask = balloon('¿hay alguien…?', { size: 34, tx: 90, ty: 90, font: F.comic });
    const popAsk = pre(c, ask, 380, 760, 0.04);
    const gm = comic('¡GUAU-MIAU!', BONE, 100);
    const popGm = pre(c, gm, W / 2 + 470, 250, 0.1);
    const yikes = comic('¡!', 0xffe27a, 80);
    const popYikes = pre(c, yikes, 610, 760, 0.1);

    score(c, [
      [0.02, 'purr', 0.35],
      [0.55, 'shield', 0.42],
      [0.85, 'shield', 0.38],
      [1.0, 'sting', 0.5],
      [1.38, 'whoosh', 0.6],
      [1.42, 'meow', 0.7],
    ]);
    // the kitten walks, small steps
    if (!c.reduce) {
      gsap.to(kt.k, { x: 520, duration: 0.95, ease: 'power1.out' });
      const p = { t: 0 };
      gsap.to(p, { t: 1, duration: 0.95, onUpdate: () => !kt.k.destroyed && (kt.k.y = 905 - Math.abs(Math.sin(p.t * Math.PI * 6)) * 6) });
    }
    at(c, 0.25, () => popAsk(0.65, { from: 0.3 }));
    // the chain drags somewhere in the dark
    for (const [t, x, y] of [
      [0.55, 1500, 820],
      [0.85, 1620, 700],
    ] as const)
      at(c, t, () => puffWord(c, c.fg, flat('clanc…', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 44, fill: 0xb8c4d8, stroke: { color: C.ink, width: 6 } }), x, y, 0.45, 26));
    // the fog thickens in front of him
    const veil = new Graphics();
    softFog(veil, 380, 1160, c.catY - 170, 120, 0xc8d4e8, 0.2, rnd(5), 12);
    softFog(veil, 420, 1080, c.catY - 20, 150, 0xc8d4e8, 0.24, rnd(6), 12);
    softFog(veil, 460, 1000, c.catY + 140, 130, 0xc8d4e8, 0.22, rnd(7), 11);
    softFog(veil, 560, 800, c.catY + 40, 220, 0xdfe8f6, 0.16, rnd(8), 8);
    c.fg.addChildAt(veil, 0);
    if (!c.reduce) {
      veil.alpha = 0;
      gsap.to(veil, { alpha: 1, duration: 0.5, delay: 0.4 });
    }
    // two eyes open in the fog: blue and ember
    at(c, 0.98, () => {
      const eyes = new Container();
      for (const [[fx, fy], col] of [
        [EYE_B, BLUE],
        [EYE_E, EMBER],
      ] as const) {
        const [ex, ey] = onCat(c, fx, fy);
        const gl = glowDisc(70, col, 0.55, 6, 20);
        gl.position.set(ex, ey);
        const e = new Graphics().poly([ex - 16, ey, ex, ey - 8, ex + 16, ey, ex, ey + 7]).fill(col).poly(ngon(ex, ey, 3, 6, 6)).fill(0x0a0a10);
        eyes.addChild(gl, e);
      }
      c.fg.addChild(eyes);
      st.eyes = eyes;
      if (!c.reduce) gsap.fromTo(eyes.scale, { y: 0.1 }, { y: 1, duration: 0.14, ease: 'power2.out' });
      eyes.pivot.set(0, c.catY + (EYE_B[1] - 0.5) * 520);
      eyes.position.set(0, c.catY + (EYE_B[1] - 0.5) * 520);
      popYikes(0.5);
      if (!c.reduce && !kt.k.destroyed) gsap.fromTo(kt.k, { y: 905 }, { y: 880, duration: 0.1, yoyo: true, repeat: 1 });
    });
    // the white half, built now and kept nearly invisible (its filter and stencil mask warm up under the seal's break)
    const wk = new Container();
    const copy = copyOf('xp_gatejo', 520, 1, BONE);
    copy.root.position.set(W / 2, c.catY);
    const mask = new Graphics();
    const xs = W / 2 + (SPLIT - 0.5) * 520;
    const top = c.catY - 280;
    // the white side's edge is ragged like long fur
    const draw = (q: number) => {
      const pts: number[] = [xs - 320 * q, top];
      for (let i = 0; i <= 18; i++) pts.push(xs + TUFT[i] * Math.min(1, q * 3), top + (i * 560) / 18);
      pts.push(xs - 320 * q, top + 560);
      mask.clear().poly(pts).fill(0xffffff);
    };
    draw(0.001);
    copy.root.mask = mask;
    wk.addChild(copy.root, mask);
    wk.alpha = 0.001;
    c.fg.addChildAt(wk, 0);
    st.white = wk;
    // the fog parts: the silhouette comes out split, white and black
    at(c, 1.38, () => {
      if (!veil.destroyed) {
        if (c.reduce) destroyTree(veil);
        else gsap.to(veil, { alpha: 0, x: -200, duration: 0.35, onComplete: () => destroyTree(veil) });
      }
      wk.alpha = 1;
      draw(c.reduce ? 1 : 0.02);
      if (!c.reduce) {
        const p = { q: 0.02 };
        gsap.to(p, { q: 1, duration: 0.28, ease: 'power2.out', onUpdate: () => !mask.destroyed && draw(p.q) });
      }
      c.shaker.add(0.25);
      popGm(0.75);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    if (st) {
      for (const n of [st.eyes, st.white]) if (n && !n.destroyed) gsap.to(n, { alpha: 0, duration: 0.3, onComplete: () => destroyTree(n) });
    }
    sfx('sting', 0.75);
    sfx('purr', 0.9);
    later(c, 0.3, () => sfx('gem', 0.8));
    // glowing paw prints light the road from the kitten to the little house (the road is in the cover-scaled back)
    if (st) {
      const prints = new Graphics();
      c.back.addChild(prints);
      const road = st.road;
      const n = road.length / 2;
      const steps = 14;
      for (let i = 0; i < steps; i++) {
        later(c, c.reduce ? 0 : i * 0.06, () => {
          if (prints.destroyed) return;
          const q = i / (steps - 1);
          const j = Math.min(n - 1, Math.floor(q * (n - 1)));
          const x = road[j * 2] + (i % 2 ? 1 : -1) * (30 - q * 26) * st.u;
          const y = road[j * 2 + 1];
          const s = (1 - q * 0.85) * 3.2 * st.u;
          pawPrint(prints, x, y, s, -0.5 - q * 0.6, BONE, 0.85);
          prints.poly(ngon(x, y, s * 14, s * 6, 10)).fill({ color: 0xbfd8ff, alpha: 0.12 });
          if (i % 3 === 0) sfx('tick', 1.4 + q * 0.4);
        });
      }
      if (!c.reduce) {
        prints.alpha = 1;
        gsap.to(prints, { alpha: 0.75, duration: 0.6, yoyo: true, repeat: 3, delay: 1 });
      }
      // the kitten isn't alone any more: a heart, and it trots off down the road
      if (st.kit && !st.kit.destroyed) {
        const kk = st.kit;
        const heart = flat('♥', { fontFamily: F.comic, fontSize: 54, fill: 0xff6b8a, stroke: { color: C.ink, width: 6 } });
        puffWord(c, c.fg, heart, kk.x + 30, kk.y - 130, 1.0, 50);
        if (!c.reduce) gsap.to(kk, { x: kk.x + 60, duration: 1.4, delay: 0.5, ease: 'sine.inOut' });
      }
    }
    // fireflies come out over the corn
    const ff = fireflies(26, 0, 560, W, 420, 9, 0xd8f0ff, 4);
    c.back.addChild(ff.g);
    if (!c.reduce) {
      ff.g.alpha = 0;
      gsap.to(ff.g, { alpha: 1, duration: 0.6 });
      every(c, 30, (t) => !ff.g.destroyed && ff.draw(t));
    }
    const main = take(c, 'main', () => comic('¡NADIE ANDA SOLO!', BONE, 112));
    payline(c, main, '…yo te acompaño hasta tu casa.', { maxW: 720, dur: 2.6, asideStyle: { fill: 0xcfe3ff } });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const nr = nightRoad(w, h, 31, { lamp: w > h * 1.2 });
    k.addChild(nr.k);
    const u = h / 300;
    // the two spirits' eyes floating over the road
    const eyes = new Container();
    const ex = w / 2 + 6 * u;
    const ey = h * 0.42;
    for (const [dx, col] of [
      [-16, BLUE],
      [16, EMBER],
    ] as const) {
      const gl = glowDisc(26 * u, col, 0.6, 5, 16);
      gl.position.set(ex + dx * u, ey);
      const e = new Graphics().poly([ex + dx * u - 7 * u, ey, ex + dx * u, ey - 3.5 * u, ex + dx * u + 7 * u, ey, ex + dx * u, ey + 3 * u]).fill(col);
      eyes.addChild(gl, e);
    }
    eyes.pivot.set(0, ey);
    eyes.y = ey;
    k.addChild(eyes);
    // half the night pale, half black (the two spirits): a soft tint on each side
    const tint = new Graphics();
    tint.rect(0, 0, w / 2, h).fill({ color: 0xdfe8ff, alpha: 0.07 });
    tint.rect(w / 2, 0, w / 2, h).fill({ color: 0x000000, alpha: 0.18 });
    k.addChild(tint);
    if (live)
      cardLoop(k, 30, (t) => {
        nr.sway(t);
        const blink = t % 4 > 3.85 ? 0.1 : 1;
        eyes.scale.y = blink;
        eyes.alpha = 0.85 + 0.15 * Math.sin(t * 2);
      });
    return k;
  },
};
