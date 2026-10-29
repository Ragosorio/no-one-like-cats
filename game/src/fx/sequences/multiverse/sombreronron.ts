/**
 * El Sombreronrón: the legend's universe (a Guatemalan colonial town at midnight, the hat-wearing serenader of the
 * old tales, as a cat). A cobbled street between ochre, blue and terracotta houses, a yellow arch at its end with the
 * dormant volcano behind it, a big moon, lanterns, ribbons strung across the street. A little guitar plays; down the
 * street, all by itself, comes a GIANT hat on tiptoe (just two tiny boots under it); the neighbors' lights go out one
 * by one; it stops, lifts a little — two glowing eyes — flips up and lands on his head: it was him all along.
 * Payoff: three ribbons braid themselves around him, the windows light up again: ¡QUIETO, QUE TE TRENZO!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, later, score } from './kit';
import { balloon } from './kitD';
import {
  C,
  F,
  TAU,
  at,
  band,
  borrowCat,
  cardLoop,
  comic,
  flat,
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
  strum,
  take,
  twinkle,
  vgrad,
  wrap,
  note,
} from './kitJ';

const SKY = [0x0b0c24, 0x161638, 0x2a2350, 0x3d2c58];
const WALLS = [0x8a6a2e, 0x2c4a7a, 0x7a3a2c, 0x7a4a5e, 0x3a5e48, 0x8a6a2e, 0x7a3a2c, 0x2c4a7a];
const LIT = 0xffc66a;
const GLOW = 0xffb347;
const HAT = 0x141418;
const RIB = [0xc8102e, 0xe6c34a, 0x1fa39a, 0xe8559a, 0x3fae6a, 0xff7a1a];
const GOLD = 0xe6c34a;

/** the cat's own hat in the painting (brim center, brim half-width as a fraction of the 520 box) and his eyes */
const HAT_AT: [number, number] = [0.5, 0.315];
const HAT_RX = 0.43;
const HAT_ROT = -0.18;
const EYES: [number, number][] = [
  [0.45, 0.37],
  [0.588, 0.365],
];

/**
 * the street at midnight, sized to (w, h): sky, stars, moon, the volcano, the arch at the end, two rows of houses in
 * perspective, the cobbles, the lanterns (redrawn to flicker), the ribbons across the street (redrawn to sway) and the
 * lit windows (their own Graphics: the neighbors switch them off). `u` = h / 1080.
 */
function street(w: number, h: number, seed: number) {
  const u = h / 1080;
  const cx = w / 2;
  const yf = h * 0.6;
  const fw = h * 0.16;
  const fh = h * 0.3;
  const nearX = w / 2 + h * 0.35;
  const yNearTop = h * 0.14;
  const yNearBot = h * 1.12;
  const p = (z: number) => Math.pow(z, 1.7);
  /** a point on a wall: side -1 left / 1 right, z depth (0 far, 1 near), v height (0 street, 1 roof) */
  const pt = (side: number, z: number, v: number): [number, number] => {
    const q = p(z);
    const x = cx + side * (fw + (nearX - fw) * q);
    const yb = yf + (yNearBot - yf) * q;
    const yt = yf - fh + (yNearTop - (yf - fh)) * q;
    return [x, yb + (yt - yb) * v];
  };
  const quad = (side: number, z0: number, z1: number, v0: number, v1: number) => [...pt(side, z0, v0), ...pt(side, z1, v0), ...pt(side, z1, v1), ...pt(side, z0, v1)];
  const r = rnd(seed);
  const k = new Container();

  const sky = vgrad(new Graphics(), 0, 0, w, h * 0.75, SKY, 16);
  const stars = new Graphics();
  const ns = Math.round((w * h) / (60000 * u * u));
  for (let i = 0; i < ns; i++) {
    const sx = r() * w;
    const sy = r() * h * 0.5;
    const s = (1.2 + r() * 2.2) * u;
    if (i % 7 === 0) stars.poly(twinkle(sx, sy, s * 2.8)).fill({ color: 0xfff6d8, alpha: 0.9 });
    else stars.rect(sx, sy, s, s).fill({ color: 0xfff6d8, alpha: 0.4 + r() * 0.5 });
  }
  const m = moon(95 * u, 0xfbf1d2, 0xffe2a8, 0xe0d2a8, 0.32);
  m.position.set(cx + h * 0.33, h * 0.17);

  // the volcano (dormant: a wisp of cloud on its shoulder) and a smaller one behind
  const volc = new Graphics();
  volc.poly([cx - h * 1.05, yf + 10, cx - h * 0.62, h * 0.34, cx - h * 0.5, h * 0.33, cx - h * 0.1, yf + 10]).fill(0x16152f);
  volc.poly([cx - h * 0.85, yf + 10, cx + h * 0.02, h * 0.205, cx + h * 0.1, h * 0.2, cx + h * 0.2, h * 0.215, cx + h * 1.05, yf + 10]).fill(0x1d1c3c);
  volc.poly([cx + h * 0.02, h * 0.205, cx + h * 0.1, h * 0.2, cx + h * 0.2, h * 0.215, cx + h * 0.55, h * 0.42, cx + h * 0.12, h * 0.28]).fill({ color: 0x3a3a6a, alpha: 0.7 });
  volc.poly(ngon(cx + h * 0.28, h * 0.27, h * 0.16, h * 0.025, 14)).fill({ color: 0x5a5682, alpha: 0.5 });

  // the arch at the end of the street, its little cupola; the volcano shows through its opening
  const arch = new Graphics();
  const ax0 = cx - fw * 1.75;
  const ax1 = cx + fw * 1.75;
  const aTop = yf - fh * 1.32;
  const ow = fw * 1.1;
  const oTop = yf - fh * 0.78;
  const opening: number[] = [cx - ow, yf + 2, cx - ow, oTop];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    opening.push(cx + Math.cos(a) * ow, oTop + Math.sin(a) * ow * 0.62);
  }
  opening.push(cx + ow, yf + 2);
  arch.rect(ax0, aTop, ax1 - ax0, yf + 2 - aTop).fill(0xa8823a).poly(opening).cut();
  arch.poly(opening, true).stroke({ width: 6 * u, color: 0x9a927e });
  arch.rect(ax0 - 6 * u, aTop - 10 * u, ax1 - ax0 + 12 * u, 14 * u).fill(0x9a927e);
  arch.rect(ax0, yf - fh * 0.42, ax1 - ax0, 8 * u).fill({ color: 0x9a927e, alpha: 0.8 });
  // the cupola with its round window and a little bell
  arch.poly([cx - fw * 0.42, aTop, cx - fw * 0.42, aTop - fh * 0.32, cx + fw * 0.42, aTop - fh * 0.32, cx + fw * 0.42, aTop]).fill(0xa8823a);
  arch.poly([cx - fw * 0.5, aTop - fh * 0.32, cx, aTop - fh * 0.55, cx + fw * 0.5, aTop - fh * 0.32]).fill(0x5a2a22);
  arch.poly(ngon(cx, aTop - fh * 0.16, fw * 0.17, fw * 0.17, 14)).fill(0xe8dcc0);
  arch.poly(ngon(cx, aTop - fh * 0.16, fw * 0.17, fw * 0.17, 14)).stroke({ width: 3 * u, color: 0x6a5a3a });
  for (const dx of [-0.95, 0.95]) arch.poly(ngon(cx + dx * fw * 1.2, yf - fh * 0.95, fw * 0.12, fw * 0.17, 8)).fill(0x2a2236);

  // the houses: each wall split into colored façades, with doors, windows, balconies and the roof's eave
  const walls = new Graphics();
  const lights = new Graphics();
  const n = Math.max(4, Math.round((4 * w) / h / 1.78) + 1);
  const cuts = Array.from({ length: n + 1 }, (_, i) => i / n);
  const winSpots: number[][] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const z0 = cuts[i];
      const z1 = cuts[i + 1];
      const col = WALLS[(i * 3 + (side > 0 ? 1 : 0)) % WALLS.length];
      walls.poly(quad(side, z0, z1, 0, 1)).fill(col);
      // the base band and the eave
      walls.poly(quad(side, z0, z1, 0, 0.1)).fill({ color: 0x000000, alpha: 0.28 });
      walls.poly(quad(side, z0, z1, 0.95, 1.06)).fill(0x4a2a20);
      walls.poly(quad(side, z0, z1, 1.06, 1.1)).fill(0x6a3a28);
      // a split line between houses
      walls.poly(quad(side, z1 - 0.004, z1, 0, 1)).fill({ color: 0x000000, alpha: 0.35 });
      // a door (an arched-ish dark quad) and a window with its grille and balcony
      const dz0 = z0 + (z1 - z0) * 0.18;
      const dz1 = z0 + (z1 - z0) * 0.38;
      walls.poly(quad(side, dz0, dz1, 0, 0.5)).fill(0x2a1a14);
      walls.poly(quad(side, dz0 + (dz1 - dz0) * 0.47, dz0 + (dz1 - dz0) * 0.53, 0, 0.5)).fill({ color: 0x000000, alpha: 0.4 });
      const wz0 = z0 + (z1 - z0) * 0.55;
      const wz1 = z0 + (z1 - z0) * 0.82;
      walls.poly(quad(side, wz0, wz1, 0.42, 0.78)).fill(0x14101c);
      lights.poly(quad(side, wz0, wz1, 0.42, 0.78)).fill(LIT);
      winSpots.push([side, wz0, wz1]);
      for (let b = 1; b < 4; b++) {
        const bz = wz0 + ((wz1 - wz0) * b) / 4;
        walls.poly(quad(side, bz - (wz1 - wz0) * 0.03, bz + (wz1 - wz0) * 0.03, 0.4, 0.8)).fill(0x2a1a14);
      }
      walls.poly(quad(side, wz0 - (wz1 - wz0) * 0.12, wz1 + (wz1 - wz0) * 0.12, 0.36, 0.42)).fill(0x2a1a14);
    }
  }
  // the facades read darker toward the end of the street (the night swallows it)
  for (const side of [-1, 1]) walls.poly(quad(side, 0, 0.3, 0, 1.1)).fill({ color: 0x0b0c24, alpha: 0.35 });

  // the cobbled street
  const floor = new Graphics();
  floor.poly([...pt(-1, 0, 0), ...pt(1, 0, 0), ...pt(1, 1, 0), ...pt(-1, 1, 0)]).fill(0x2a2634);
  const rows = 13;
  for (let j = 0; j < rows; j++) {
    const z0 = j / rows;
    const z1 = (j + 0.82) / rows;
    const [xl0, y0] = pt(-1, z0, 0);
    const [xr0] = pt(1, z0, 0);
    const [xl1, y1] = pt(-1, z1, 0);
    const [xr1] = pt(1, z1, 0);
    const across = Math.max(6, Math.round(10 + j * 1.4));
    const off = (j % 2) * 0.5;
    for (let i = -1; i < across; i++) {
      const a = (i + off) / across;
      const b = (i + off + 0.84) / across;
      if (b <= 0 || a >= 1) continue;
      const A = Math.max(0, a);
      const B = Math.min(1, b);
      const xa0 = xl0 + (xr0 - xl0) * A;
      const xb0 = xl0 + (xr0 - xl0) * B;
      const xa1 = xl1 + (xr1 - xl1) * A;
      const xb1 = xl1 + (xr1 - xl1) * B;
      floor.poly([xa0, y0, xb0, y0, xb1, y1, xa1, y1]).fill((i + j) % 3 ? 0x3e3a4c : 0x4a4558);
    }
  }
  // a pool of moonlight down the middle and the lanterns' warm puddles
  floor.poly([...pt(-0.25, 0, 0), ...pt(0.25, 0, 0), ...pt(0.25, 1, 0), ...pt(-0.25, 1, 0)]).fill({ color: 0x8a8ad0, alpha: 0.08 });

  // the lanterns on the walls (glow + iron box), at three depths per side
  const lampAt: [number, number][] = [];
  for (const side of [-1, 1]) for (const z of [0.3, 0.62]) lampAt.push(pt(side, z + side * 0.02, 0.66));
  const glow = new Container();
  const glows = lampAt.map(([x, y], i) => {
    const g = glowDisc(150 * u * (0.6 + i * 0.12), GLOW, 0.42, 6, 22);
    g.position.set(x, y);
    glow.addChild(g);
    return g;
  });
  const lamps = new Graphics();
  for (const [x, y] of lampAt) {
    const s = (y / h) * 1.3 * u * 34;
    lamps.poly([x - s * 0.5, y - s * 0.6, x + s * 0.5, y - s * 0.6, x + s * 0.4, y + s * 0.6, x - s * 0.4, y + s * 0.6]).fill(0xffd27a);
    lamps.poly([x - s * 0.6, y - s * 0.6, x, y - s * 1.1, x + s * 0.6, y - s * 0.6]).fill(0x1a1418);
    lamps.rect(x - s * 0.08, y - s * 1.6, s * 0.16, s * 0.6).fill(0x1a1418);
  }

  // ribbons strung across the street (three strings), swaying
  const ribs = new Graphics();
  const strings = [0.22, 0.48, 0.8].map((z) => [pt(-1, z, 0.88), pt(1, z, 0.88)] as const);
  const drawRibs = (t: number) => {
    ribs.clear();
    strings.forEach(([[x0, y0], [x1, y1]], si) => {
      const sag = (x1 - x0) * 0.08;
      const nn = 18;
      const line: number[] = [];
      for (let i = 0; i <= nn; i++) {
        const q = i / nn;
        line.push(x0 + (x1 - x0) * q, y0 + (y1 - y0) * q + Math.sin(q * Math.PI) * sag);
      }
      ribs.poly(band(line, 1.2 * u + si * 0.6 * u)).fill(0x1a1418);
      for (let i = 1; i < nn; i++) {
        const x = line[i * 2];
        const y = line[i * 2 + 1];
        const L = (18 + si * 22) * u;
        const sw = Math.sin(t * 2.4 + i * 0.9 + si) * 0.35;
        ribs.poly(streak(x, y, x + Math.sin(sw) * L, y + Math.cos(sw) * L, (2 + si * 1.6) * u, (1 + si) * u)).fill(RIB[(i + si * 2) % RIB.length]);
      }
    });
  };
  drawRibs(0);

  k.addChild(sky, stars, m, volc, arch, walls, lights, floor, glow, lamps, ribs);
  const flicker = (t: number) => {
    glows.forEach((g, i) => (g.alpha = 0.78 + 0.22 * Math.sin(t * (7 + i) + i * 2) * Math.sin(t * 3.1 + i)));
    stars.alpha = 0.85 + 0.15 * Math.sin(t * 1.7);
  };
  return { k, lights, glows, drawRibs, flicker, winSpots, u };
}

/** the giant sombrero (origin at the brim's center; `s` = brim half-width): crown, embroidered band, flowers, trim */
function sombrero(s: number) {
  const g = new Graphics();
  // under the brim: the dark where the eyes are
  g.poly(ngon(0, s * 0.03, s * 0.9, s * 0.17, 28)).fill(0x050508);
  // the brim (a wide tilted ellipse), its rim and embroidered flowers
  g.poly(ngon(0, 0, s, s * 0.21, 36)).fill(HAT);
  g.poly(ngon(0, 0, s, s * 0.21, 36)).stroke({ width: Math.max(2, s * 0.03), color: GOLD });
  g.poly(ngon(0, -s * 0.01, s * 0.86, s * 0.17, 32)).stroke({ width: Math.max(1.5, s * 0.012), color: 0xc8102e, alpha: 0.9 });
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * 0.08 + (i / 9) * Math.PI * 0.84;
    const fx = Math.cos(a) * s * 0.74;
    const fy = Math.sin(a) * s * 0.14;
    const col = RIB[i % 4];
    for (let pp = 0; pp < 5; pp++) {
      const b = (pp / 5) * TAU;
      g.poly(ngon(fx + Math.cos(b) * s * 0.035, fy + Math.sin(b) * s * 0.014, s * 0.03, s * 0.014, 6)).fill(col);
    }
    g.poly(ngon(fx, fy, s * 0.018, s * 0.01, 6)).fill(GOLD);
    if (i % 2 === 0) g.poly(ngon(-fx * 0.95, -fy * 0.4 - s * 0.05, s * 0.05, s * 0.016, 6)).fill(0x1fa39a);
  }
  // the crown: a tapered dome
  const crown = [-s * 0.34, -s * 0.03, -s * 0.3, -s * 0.3, -s * 0.24, -s * 0.5, -s * 0.12, -s * 0.6, 0, -s * 0.62, s * 0.12, -s * 0.6, s * 0.24, -s * 0.5, s * 0.3, -s * 0.3, s * 0.34, -s * 0.03];
  g.poly(crown).fill(HAT);
  g.poly([-s * 0.12, -s * 0.58, 0, -s * 0.6, s * 0.06, -s * 0.36, -s * 0.04, -s * 0.2]).fill({ color: 0x3a3a48, alpha: 0.55 });
  // the embroidered band around the crown's base
  g.poly([-s * 0.33, -s * 0.06, -s * 0.31, -s * 0.2, s * 0.31, -s * 0.2, s * 0.33, -s * 0.06]).fill(0xc8102e);
  for (let i = 0; i < 6; i++) {
    const x = -s * 0.26 + (i * s * 0.52) / 5;
    g.poly(ngon(x, -s * 0.13, s * 0.035, s * 0.035, 6)).fill(i % 2 ? GOLD : 0x1fa39a);
  }
  return g;
}

/** two tiny black boots with silver spurs (origin between them at the ground) */
function boots(s: number) {
  const k = new Container();
  const mk = (dir: number) => {
    const b = new Graphics();
    b.poly([-s * 0.05, -s * 0.2, s * 0.05, -s * 0.2, s * 0.06, -s * 0.04, s * 0.14 * dir + s * 0.02, -s * 0.02, s * 0.15 * dir, s * 0.02, -s * 0.06, s * 0.02]).fill(HAT);
    b.poly(twinkle(-s * 0.07 * dir, -s * 0.03, s * 0.05, 0.3)).fill(0xc9ccd6);
    return b;
  };
  const L = mk(-1);
  const R = mk(1);
  L.x = -s * 0.13;
  R.x = s * 0.13;
  k.addChild(L, R);
  return { k, L, R };
}

/** the braid: three ribbons woven in a ring of radius R around the origin (one Graphics) */
function braid(g: Graphics, R: number, phase: number, width = 16) {
  g.clear();
  for (let s = 0; s < 3; s++) {
    const pts: number[] = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU;
      const rr = R + Math.sin(a * 14 + phase + (s * TAU) / 3) * width * 1.4;
      pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.poly(band(pts, width * 0.55)).fill([0xc8102e, GOLD, 0x1fa39a][s]);
  }
  return g;
}

interface St {
  give: () => void;
  eyes: Graphics | null;
  hat: Container | null;
  lights: Graphics;
  glows: Graphics[];
}
const S = stash<St>();

export const sombreronron: Signature = {
  dark: true,
  frame: 0xc8102e,
  tag: 'UNIVERSO DE LA LEYENDA',
  open(c: SigCtx) {
    const st0 = street(W, H, 7);
    c.back.addChild(st0.k);
    hideDisc(c, 0.2);
    if (!c.short && !c.reduce) {
      st0.k.alpha = 0;
      gsap.to(st0.k, { alpha: 1, duration: 0.3 });
    }
    // a warm light behind him (the silhouette must read on the night)
    const halo = glowDisc(380, 0xffc66a, 0.26, 8, 28);
    halo.position.set(W / 2, c.catY + 20);
    c.behind.addChild(halo);
    if (!c.reduce)
      every(c, 30, (t) => {
        if (st0.k.destroyed) return;
        st0.flicker(t);
        st0.drawRibs(t);
      });
    // the payoff's words, built now (a big stroked title mid-shot costs a long frame)
    park(c, 'main', comic('¡QUIETO, QUE\nTE TRENZO!', GOLD, 104));
    const borrowed = borrowCat(c);
    const st: St = { give: () => borrowed.give(), eyes: null, hat: null, lights: st0.lights, glows: st0.glows };
    S.set(c, st);
    if (c.short) return;

    // the giant hat: the cat hides under it until it lands on his head
    if (!c.cat.destroyed) c.cat.alpha = 0;
    const [hx, hy] = onCat(c, HAT_AT[0], HAT_AT[1]);
    const S0 = 330;
    const FEET = c.catY + 0.44 * 520;
    const hatK = new Container();
    const shadow = new Graphics().poly(ngon(0, 0, S0 * 0.9, S0 * 0.12, 24)).fill({ color: 0x000000, alpha: 0.45 });
    shadow.y = S0 * 0.34;
    const bt = boots(S0);
    bt.k.y = S0 * 0.34;
    const hatG = sombrero(S0);
    const eyes = new Graphics();
    for (const dx of [-1, 1]) eyes.poly([dx * S0 * 0.13 - S0 * 0.07, 0, dx * S0 * 0.13, -S0 * 0.035, dx * S0 * 0.13 + S0 * 0.07, 0, dx * S0 * 0.13, S0 * 0.03]).fill(0xffd84a);
    eyes.position.set(0, S0 * 0.12);
    eyes.scale.y = 0.05;
    eyes.alpha = 0;
    // the dark under the hat (his body, hidden) between the brim and the boots
    const under = new Graphics().poly(ngon(0, S0 * 0.14, S0 * 0.5, S0 * 0.17, 20)).fill(0x050508);
    hatK.addChild(shadow, under, bt.k, eyes, hatG);
    hatK.position.set(c.reduce ? W / 2 : W + 420, FEET - S0 * 0.34);
    c.behind.addChild(hatK);
    st.hat = hatK;

    // words built now, shown on their beats
    const tirirín = flat('♪ tiririrín…', { fontFamily: F.brush, fontSize: 52, fill: GOLD, stroke: { color: C.ink, width: 8, join: 'round' } });
    const who = balloon('¡EL SOMBRERONRÓN!', { size: 42, jag: true, tx: 140, ty: 120, font: F.comic });
    const popWho = pre(c, who, 420, 330, -0.05);
    const flip = comic('¡FLIP!', 0xffe27a, 96);
    const popFlip = pre(c, flip, W / 2 + 380, 230, 0.12);

    strum(c, 0.05);
    strum(c, 0.62, 0.7);
    score(c, [
      [1.42, 'sting', 0.85],
      [1.78, 'whoosh', 1.1],
      [1.82, 'pop', 1.3],
      [2.0, 'gem', 1.2],
    ]);
    at(c, 0.08, () => puffWord(c, c.fg, tirirín, 400, 560, 0.9, 50));
    // notes drift up from the left
    at(c, 0.1, () => {
      for (let i = 0; i < 5; i++) {
        const g = note(new Graphics(), 0, 0, 34 + i * 4, i % 2 ? GOLD : 0xfff2c8, i % 3 === 0);
        g.position.set(330 + i * 40, 640 - i * 10);
        g.alpha = 0;
        c.fg.addChild(g);
        gsap.to(g, { alpha: 0.95, duration: 0.2, delay: i * 0.12 });
        if (!c.reduce) gsap.to(g, { y: g.y - 260 - i * 30, x: g.x + Math.sin(i) * 60, rotation: (i - 2) * 0.2, duration: 1.4, delay: i * 0.12, ease: 'sine.out' });
        gsap.to(g, { alpha: 0, delay: 1.0 + i * 0.12, duration: 0.4, onComplete: () => destroyTree(g) });
      }
    });

    // the walk: six tiptoe hops from the right edge to the middle; the neighbors switch off their lights as it passes
    if (!c.reduce) {
      const steps = 6;
      const x0 = W + 420;
      const dur = 1.12;
      const p = { t: 0 };
      gsap.to(p, {
        t: 1,
        duration: dur,
        delay: 0.15,
        ease: 'none',
        onUpdate: () => {
          if (hatK.destroyed) return;
          const e = 1 - Math.pow(1 - p.t, 1.6);
          hatK.x = x0 + (W / 2 - x0) * e;
          const ph = p.t * steps * Math.PI;
          const hop = Math.abs(Math.sin(ph));
          hatG.y = -hop * 26;
          eyes.y = S0 * 0.12 - hop * 26;
          under.y = -hop * 20;
          hatG.rotation = Math.sin(ph) * 0.05;
          bt.L.y = Math.sin(ph) > 0 ? -hop * 14 : 0;
          bt.R.y = Math.sin(ph) < 0 ? -hop * 14 : 0;
          shadow.scale.x = 1 - hop * 0.15;
        },
      });
      for (let i = 0; i < steps; i++)
        at(c, 0.15 + ((i + 0.5) / steps) * dur * 0.9, () => {
          sfx('tick', 1.7 + (i % 2) * 0.25);
          if (i % 2 === 0) {
            const tip = flat('tip…', { fontFamily: F.comic, fontSize: 38, fill: 0xe8e0ff, stroke: { color: C.ink, width: 6, join: 'round' } });
            puffWord(c, c.fg, tip, hatK.x + 120, FEET + 30, 0.4, 30);
          }
        });
      // lights out, one window after another
      for (let i = 0; i < 4; i++)
        at(c, 0.35 + i * 0.22, () => {
          if (st0.lights.destroyed) return;
          st0.lights.alpha = Math.max(0.15, 1 - (i + 1) * 0.22);
          sfx('tick', 0.7 + i * 0.05);
        });
    } else st0.lights.alpha = 0.3;
    at(c, 0.95, () => popWho(0.6, { from: 0.3 }));

    // it stops, lifts a little: two eyes glow under the brim
    at(c, 1.3, () => {
      if (hatK.destroyed) return;
      if (!c.reduce) gsap.fromTo(hatG.scale, { x: 1.08, y: 0.9 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
    });
    at(c, 1.42, () => {
      if (hatK.destroyed) return;
      eyes.alpha = 1;
      if (c.reduce) {
        eyes.scale.y = 1;
        hatG.y = -44;
        eyes.y = S0 * 0.12;
      } else {
        gsap.to(hatG, { y: -44, duration: 0.18, ease: 'power2.out' });
        gsap.to(eyes.scale, { y: 1, duration: 0.1, delay: 0.06 });
        gsap.to(eyes.scale, { y: 0.08, duration: 0.06, delay: 0.26, yoyo: true, repeat: 1 });
      }
    });

    // ¡FLIP! the hat jumps up and lands on his head: it was him
    at(c, 1.78, () => {
      if (hatK.destroyed) return;
      popFlip(0.55);
      c.shaker.add(0.15);
      borrowed.give();
      if (!c.cat.destroyed && !c.reduce) {
        c.cat.alpha = 0;
        gsap.to(c.cat, { alpha: 1, duration: 0.22 });
      }
      bt.k.visible = false;
      shadow.visible = false;
      eyes.visible = false;
      under.visible = false;
      const k = HAT_RX * 520;
      const sc = k / S0;
      if (c.reduce) {
        destroyTree(hatK);
      } else {
        gsap.to(hatK, { x: hx, y: hy, duration: 0.22, ease: 'power2.out' });
        gsap.to(hatG, { y: 0, duration: 0.22 });
        gsap.fromTo(hatK.scale, { x: 1, y: 1 }, { x: sc, y: sc, duration: 0.22, ease: 'power2.out' });
        gsap.to(hatK, { rotation: -TAU + HAT_ROT, duration: 0.22, ease: 'power2.out' });
        gsap.to(hatK, { alpha: 0, delay: 0.22, duration: 0.2, onComplete: () => destroyTree(hatK) });
      }
      // the silhouette's eyes keep glowing until the color comes
      const eg = new Graphics();
      for (const [fx, fy] of EYES) {
        const [ex, ey] = onCat(c, fx, fy);
        eg.poly(ngon(ex, ey, 34, 22, 14)).fill({ color: 0xffd84a, alpha: 0.25 });
        eg.poly([ex - 17, ey, ex, ey - 8, ex + 17, ey, ex, ey + 7]).fill(0xffe27a);
      }
      c.fg.addChild(eg);
      st.eyes = eg;
      if (!c.reduce) gsap.fromTo(eg, { alpha: 0 }, { alpha: 1, duration: 0.2, delay: 0.15 });
      // ribbons twirl off the hat
      burst(c, c.behind, (i) => new Graphics().poly(streak(0, 0, 0, 46, 6, 3)).fill(RIB[i % RIB.length]), 14, hx, hy, 520, 1.0);
    });
    // a safety: the cat is whole by the end of the takeover whatever happened
    later(c, 2.3, () => borrowed.give());
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    if (st) {
      st.give();
      if (st.hat && !st.hat.destroyed) destroyTree(st.hat);
      if (st.eyes && !st.eyes.destroyed) gsap.to(st.eyes, { alpha: 0, duration: 0.25, onComplete: () => destroyTree(st.eyes!) });
      // the neighbors light their windows again
      if (!st.lights.destroyed) gsap.to(st.lights, { alpha: 1, duration: 0.4, delay: 0.2 });
    }
    strum(c, 0, 0.8);
    strum(c, 0.3, 1.0);
    sfx('sting', 1.1);
    later(c, 0.6, () => sfx('gem', 1.4));
    c.shaker.add(0.2);
    // the braid closes around him
    const br = new Container();
    br.position.set(W / 2, c.catY + 10);
    c.behind.addChild(br);
    const R = 330;
    const bg = braid(new Graphics(), R, 0);
    br.addChild(bg);
    if (!c.reduce) {
      gsap.fromTo(br.scale, { x: 0.25, y: 0.25 }, { x: 1, y: 1, duration: 0.45, ease: 'back.out(1.6)' });
      gsap.fromTo(br, { rotation: -1.6 }, { rotation: 0, duration: 0.6, ease: 'power3.out' });
      every(c, 30, (t) => {
        if (br.destroyed) return;
        braid(bg, R, t * 3);
        br.rotation += 0.004;
      });
    }
    burst(c, c.fg, (i) => new Graphics().poly(streak(0, 0, 0, 40, 6, 2)).fill(RIB[i % RIB.length]), 30, W / 2, c.catY - 40, 820, 1.4);
    const main = take(c, 'main', () => comic('¡QUIETO, QUE\nTE TRENZO!', GOLD, 104));
    payline(c, main, '…con listoncitos de colores.', { maxW: 700, dur: 2.5, asideStyle: { fill: 0xffe9b0 } });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const s = street(w, h, 11);
    k.addChild(s.k);
    // a little sombrero shadow crossing the far end of the street (a hint of the legend)
    const mini = sombrero(h * 0.055);
    mini.position.set(w / 2 - h * 0.05, h * 0.6 - h * 0.01);
    mini.alpha = 0.92;
    k.addChild(mini);
    if (live)
      cardLoop(k, 30, (t) => {
        s.flicker(t);
        s.drawRibs(t);
        mini.x = w / 2 + Math.sin(t * 0.5) * h * 0.09;
        mini.y = h * 0.6 - h * 0.01 - Math.abs(Math.sin(t * 4)) * h * 0.006;
      });
    return k;
  },
};

