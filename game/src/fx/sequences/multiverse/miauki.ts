/**
 * El Miauki, el de la Melena Romántica: the ballad universe (the great romantic balladeer of weddings, birthdays and
 * three in the morning). Red velvet curtains part on a fiesta stage: papel picado strung across, mariachi cats in wide
 * sombreros on the risers, a great golden clock behind him whose hands start running backward (nostalgia is his
 * element). ¡AYYY! — the grito — and the wind machine at the edge of the stage switches on: petals and papel picado blow
 * across, the crowd below waves white handkerchiefs and cries (¡SNIF!), roses fly in from the front rows and pile up at
 * his feet, and a white spotlight finds him.
 * Payoff: it rains roses, the footlights blaze, the whole plaza asks for more; ¡OTRA, OTRA! / …y la melena, intacta.
 * (No song names, no lyrics, no real person's face: a cat with a great mane and his ballads.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, cheer, every, fall, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, ngon, rnd, streak } from './kitD';
import { at, comic, cone, crowdBack, petalPts, pre, rose, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const VELVET = 0x8a0e22;
const VELVET_D = 0x5a0616;
const GOLD = 0xe6c34a;
const GOLD_D = 0xa8862a;
const BG = [0x12040c, 0x2a0818, 0x4a1024, 0x5a1a26];
const PICADO = [0xff4fa3, 0xff8a1a, 0xffd23f, 0x3fae6a, 0x3a8ae8, 0x9a4ae8];
const FLOOR = 840;

/** the great golden clock behind him: a ring with ticks; the hands are redrawn (`hh`, `mm` in turns) */
function clockFace(r: number) {
  const g = new Graphics();
  g.poly(ngon(0, 0, r * 1.08, r * 1.08, 40)).fill({ color: GOLD, alpha: 0.12 });
  g.poly(ngon(0, 0, r, r, 40)).fill(0x2a0a14).stroke({ width: r * 0.06, color: GOLD });
  g.poly(ngon(0, 0, r * 0.86, r * 0.86, 40)).stroke({ width: r * 0.015, color: GOLD_D });
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const big = i % 5 === 0;
    const r0 = r * (big ? 0.72 : 0.8);
    g.poly(streak(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84, r * (big ? 0.025 : 0.008), r * (big ? 0.025 : 0.008))).fill(GOLD);
  }
  const hands = new Graphics();
  return { face: g, hands };
}
function drawHands(g: Graphics, r: number, hh: number, mm: number) {
  g.clear();
  const ah = hh * Math.PI * 2 - Math.PI / 2;
  const am = mm * Math.PI * 2 - Math.PI / 2;
  g.poly(streak(0, 0, Math.cos(ah) * r * 0.45, Math.sin(ah) * r * 0.45, r * 0.04, r * 0.02)).fill(GOLD);
  g.poly(streak(0, 0, Math.cos(am) * r * 0.68, Math.sin(am) * r * 0.68, r * 0.03, r * 0.012)).fill(GOLD);
  g.poly(ngon(0, 0, r * 0.05, r * 0.05, 10)).fill(GOLD);
}

/** papel picado: `n` tissue flags on a sagging string from x0 to x1 at y, fluttering with t (one Graphics) */
function picado(g: Graphics, x0: number, x1: number, y: number, n: number, s: number, t: number, seed: number) {
  const r = rnd(seed);
  const sag = (u: number) => y + Math.sin(u * Math.PI) * 40 * s;
  g.poly(streak(x0, y, (x0 + x1) / 2, sag(0.5), 1.2 * s, 1.2 * s)).fill(0xd8d0c0).poly(streak((x0 + x1) / 2, sag(0.5), x1, y, 1.2 * s, 1.2 * s)).fill(0xd8d0c0);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const x = x0 + (x1 - x0) * u;
    const yy = sag(u);
    const fw = ((x1 - x0) / n) * 0.42;
    const fh = fw * 1.3;
    const sw = Math.sin(t * 3.1 + i * 0.9) * fw * 0.25;
    const col = PICADO[Math.floor(r() * PICADO.length)];
    const pts = [x - fw, yy, x + fw, yy];
    for (let k = 0; k <= 6; k++) pts.push(x + fw - (k / 6) * fw * 2 + sw, yy + fh + (k % 2 ? fh * 0.12 : 0));
    g.poly(pts).fill(col);
    // the cut-outs: a little flower and two diamonds (holes in the background's color)
    g.poly(ngon(x + sw * 0.5, yy + fh * 0.45, fw * 0.28, fw * 0.28, 6)).fill(0x2a0818);
    g.poly([x - fw * 0.55 + sw * 0.4, yy + fh * 0.2, x - fw * 0.4 + sw * 0.4, yy + fh * 0.32, x - fw * 0.55 + sw * 0.4, yy + fh * 0.44, x - fw * 0.7 + sw * 0.4, yy + fh * 0.32]).fill(0x2a0818);
    g.poly([x + fw * 0.55 + sw * 0.4, yy + fh * 0.2, x + fw * 0.7 + sw * 0.4, yy + fh * 0.32, x + fw * 0.55 + sw * 0.4, yy + fh * 0.44, x + fw * 0.4 + sw * 0.4, yy + fh * 0.32]).fill(0x2a0818);
  }
  return g;
}

/** a mariachi cat in silhouette (wide sombrero, a short jacket, an instrument), origin at the feet, s = scale */
function mariachi(g: Graphics, x: number, y: number, s: number, inst: 0 | 1 | 2, col = 0x14040c, rim = GOLD) {
  g.poly([x - 30 * s, y, x + 30 * s, y, x + 34 * s, y - 120 * s, x - 34 * s, y - 120 * s]).fill(col);
  g.poly(ngon(x, y - 140 * s, 30 * s, 26 * s, 12)).fill(col);
  g.poly([x - 26 * s, y - 150 * s, x - 20 * s, y - 182 * s, x - 6 * s, y - 160 * s]).fill(col);
  g.poly([x + 26 * s, y - 150 * s, x + 20 * s, y - 182 * s, x + 6 * s, y - 160 * s]).fill(col);
  // the sombrero: a wide brim and a tall crown, gold trim
  g.poly(ngon(x, y - 166 * s, 92 * s, 18 * s, 22)).fill(0x3a1622);
  g.poly([x - 30 * s, y - 168 * s, x - 22 * s, y - 214 * s, x, y - 224 * s, x + 22 * s, y - 214 * s, x + 30 * s, y - 168 * s]).fill(0x3a1622);
  g.poly(ngon(x, y - 166 * s, 92 * s, 18 * s, 22)).stroke({ width: 3 * s, color: rim, alpha: 0.8 });
  g.poly(streak(x - 28 * s, y - 176 * s, x + 28 * s, y - 176 * s, 3 * s, 3 * s)).fill({ color: rim, alpha: 0.8 });
  // the jacket's gold buttons down the side
  for (let i = 0; i < 4; i++) g.poly(ngon(x + 30 * s, y - 110 * s + i * 22 * s, 3 * s, 3 * s, 6)).fill(rim);
  if (inst === 0) {
    // trumpet raised
    g.poly(streak(x + 10 * s, y - 136 * s, x + 90 * s, y - 170 * s, 4 * s, 5 * s)).fill(rim);
    g.poly([x + 86 * s, y - 182 * s, x + 112 * s, y - 196 * s, x + 118 * s, y - 158 * s, x + 92 * s, y - 160 * s]).fill(rim);
  } else if (inst === 1) {
    // violin under the chin and its bow
    g.poly(ngon(x - 40 * s, y - 112 * s, 26 * s, 14 * s, 12, -0.5)).fill(0x6a3a1a).stroke({ width: 2 * s, color: rim });
    g.poly(streak(x - 90 * s, y - 70 * s, x + 20 * s, y - 150 * s, 1.6 * s, 1.6 * s)).fill(rim);
  } else {
    // guitarrón: a big rounded body
    g.poly(ngon(x + 6 * s, y - 64 * s, 50 * s, 44 * s, 16)).fill(0x6a3a1a).stroke({ width: 3 * s, color: rim });
    g.poly(ngon(x + 6 * s, y - 64 * s, 13 * s, 13 * s, 10)).fill(col);
    g.poly(streak(x + 6 * s, y - 104 * s, x + 30 * s, y - 190 * s, 6 * s, 5 * s)).fill(0x4a2a12);
  }
  return g;
}

/** the curtains: two velvet drapes with folds and gold fringe (each a Container to slide), and the valance */
function curtains(w: number, h: number, k: number) {
  const side = (dir: number) => {
    const g = new Graphics();
    const cw = w * 0.52;
    g.rect(dir < 0 ? -cw : 0, 0, cw, h).fill(VELVET);
    for (let i = 0; i < 12; i++) {
      const x = (dir < 0 ? -cw : 0) + (i + 0.3) * (cw / 12);
      g.poly([x, 0, x + cw * 0.03, 0, x + cw * 0.045, h, x + cw * 0.008, h]).fill(VELVET_D);
    }
    g.rect(dir < 0 ? -cw : 0, h - 24 * k, cw, 24 * k).fill(GOLD_D);
    for (let x = dir < 0 ? -cw : 0; x < (dir < 0 ? 0 : cw); x += 14 * k) g.rect(x, h - 24 * k, 6 * k, 30 * k).fill(GOLD);
    return g;
  };
  const L = new Container();
  L.addChild(side(-1));
  const R = new Container();
  R.addChild(side(1));
  const val = new Graphics();
  val.rect(0, 0, w, 70 * k).fill(VELVET);
  for (let i = 0; i < Math.ceil(w / (160 * k)); i++) {
    const x = i * 160 * k;
    const p: number[] = [x, 60 * k];
    for (let j = 0; j <= 8; j++) p.push(x + (j / 8) * 160 * k, 60 * k + Math.sin((j / 8) * Math.PI) * 50 * k);
    val.poly(p).fill(VELVET);
  }
  for (let x = 0; x < w; x += 12 * k) val.rect(x, 64 * k + Math.abs(Math.sin((x / (160 * k)) * Math.PI)) * 50 * k, 5 * k, 14 * k).fill(GOLD);
  val.rect(0, 58 * k, w, 6 * k).fill(GOLD);
  return { L, R, val, cw: w * 0.52 };
}

/** the stage floor: boards in perspective and a row of footlights along the front */
function stage(g: Graphics, w: number, h: number, floor: number, k: number, glow: number) {
  g.rect(0, floor, w, h - floor).fill(0x3a1e12);
  for (let i = -12; i <= 12; i++) g.poly(streak(w / 2 + i * 70 * k, floor, w / 2 + i * 190 * k, h, 1 * k, 2.2 * k)).fill({ color: 0x24120a, alpha: 0.8 });
  g.rect(0, floor, w, 6 * k).fill(GOLD_D);
  for (let x = 60 * k; x < w; x += 150 * k) {
    g.poly(ngon(x, floor + 10 * k, 60 * k, 24 * k, 12)).fill({ color: 0xffe9b0, alpha: 0.12 * glow });
    g.poly(ngon(x, floor + 8 * k, 16 * k, 7 * k, 10)).fill({ color: 0xfff4d0, alpha: 0.5 + 0.5 * glow });
  }
  return g;
}

/** a stand fan (the ballad's wind machine): cage, stand; its blades are their own Graphics to spin */
function fan(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.poly([-50 * s, 0, 50 * s, 0, 30 * s, -16 * s, -30 * s, -16 * s]).fill(0x2a2a30);
  g.rect(-6 * s, -150 * s, 12 * s, 136 * s).fill(0x3a3a44);
  g.poly(ngon(0, -200 * s, 74 * s, 74 * s, 20)).fill({ color: 0x1a1a20, alpha: 0.6 }).stroke({ width: 5 * s, color: 0x9a9aa6 });
  const blades = new Graphics();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    blades.poly(ngon(Math.cos(a) * 36 * s, Math.sin(a) * 36 * s, 34 * s, 16 * s, 10, a)).fill(0xc8c8d4);
  }
  blades.poly(ngon(0, 0, 12 * s, 12 * s, 10)).fill(0x6a6a74);
  blades.position.set(0, -200 * s);
  const cage = new Graphics();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    cage.poly(streak(0, -200 * s, Math.cos(a) * 74 * s, -200 * s + Math.sin(a) * 74 * s, 1.5 * s, 1.5 * s)).fill({ color: 0x9a9aa6, alpha: 0.8 });
  }
  k.addChild(g, blades, cage);
  return { k, blades };
}

interface St {
  wind: { v: number };
  glow: { v: number };
  spot: Graphics;
}
const S = stash<St>();

export const miauki: Signature = {
  dark: true,
  frame: VELVET,
  tag: 'UNIVERSO DE LA BALADA',
  open(c: SigCtx) {
    const k = new Container();
    const bg = vgrad(new Graphics(), 0, 0, W, FLOOR, BG, 16);
    const cl = clockFace(230);
    cl.face.position.set(W / 2, 330);
    cl.hands.position.set(W / 2, 330);
    const band = new Graphics();
    mariachi(band, 400, FLOOR, 1.55, 0);
    mariachi(band, 590, FLOOR, 1.4, 1);
    mariachi(band, 1330, FLOOR, 1.4, 2);
    mariachi(band, 1520, FLOOR, 1.55, 0);
    const risers = new Graphics().rect(260, FLOOR - 10, 450, 14).fill(GOLD_D).rect(1210, FLOOR - 10, 450, 14).fill(GOLD_D);
    const pic = new Graphics();
    const fl = new Graphics();
    stage(fl, W, H, FLOOR, 1, 0.5);
    const roses = new Graphics();
    const f = fan(1.1);
    f.k.position.set(300, FLOOR + 140);
    const wind = new Graphics();
    const spot = new Graphics().poly(cone(W / 2, -40, Math.PI / 2, 1200, 0.2)).fill({ color: 0xffffff, alpha: 0.13 });
    spot.alpha = 0;
    const cr = crowdBack(W, 960, { rows: 2, dy: 60, s: 34, cols: [0x1a0a12, 0x241018, 0x2e1420], seed: 6, paws: 0.4, light: 1 });
    const kerch = new Graphics();
    const cu = curtains(W, H, 1);
    cu.L.position.set(W / 2, 0);
    cu.R.position.set(W / 2, 0);
    k.addChild(bg, cl.face, cl.hands, band, risers, pic, fl, spot, roses, f.k, wind, ...cr.rows, kerch, cu.L, cu.R, cu.val);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the curtains part
    if (c.short || c.reduce) {
      cu.L.x = W * 0.1;
      cu.R.x = W * 0.9;
    } else {
      gsap.to(cu.L, { x: W * 0.1, duration: 0.5, ease: 'power3.inOut' });
      gsap.to(cu.R, { x: W * 0.9, duration: 0.5, ease: 'power3.inOut' });
    }
    const windV = { v: c.short ? 0.4 : 0 };
    const glowV = { v: 0.5 };
    const back = { v: 0 };
    S.set(c, { wind: windV, glow: glowV, spot });
    const r = rnd(12);
    const PET = Array.from({ length: 26 }, () => [r() * W, 140 + r() * 760, 0.6 + r() * 0.8, r() * 6]);
    const lights = cr.lights;
    let last = 0;
    let off = 0;
    let rot = 0;
    const frame = (t: number) => {
      if (pic.destroyed) return;
      const dt = Math.min(0.1, t - last);
      last = t;
      off += dt * windV.v;
      rot += dt * (2 + windV.v * 24);
      pic.clear();
      picado(pic, -20, W / 2 + 40, 110, 9, 1.4, t * (1 + windV.v * 3), 3);
      picado(pic, W / 2 - 40, W + 20, 110, 9, 1.4, t * (1 + windV.v * 3) + 1, 4);
      if (!f.blades.destroyed) f.blades.rotation = rot;
      drawHands(cl.hands, 230, 0.25 - back.v * 0.08, 0 - back.v);
      wind.clear();
      if (windV.v > 0.02) {
        for (const [x0, y, sp, ph] of PET) {
          const x = ((x0 + off * 900 * sp) % (W + 100)) - 50;
          const yy = y + Math.sin(t * 2 + ph) * 30;
          wind.poly(petalPts(22).map((v, i) => (i % 2 ? v * 0.7 + yy : v + x))).fill({ color: VELVET, alpha: Math.min(1, windV.v * 1.5) });
          wind.poly(streak(x - 160 * sp, yy + 30, x - 20, yy + 30, 0.4, 1.4)).fill({ color: 0xffffff, alpha: 0.25 * windV.v });
        }
      }
      if (!kerch.destroyed) {
        kerch.clear();
        lights.forEach((row, j) =>
          row.forEach(([x, y], i) => {
            const sw = Math.sin(t * 7 + i * 1.3 + j) * 14;
            kerch.poly([x, y, x + 34 + sw, y - 20, x + 22 + sw, y + 18]).fill({ color: 0xffffff, alpha: 0.92 });
          }),
        );
      }
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // the words, built now
    const ay = pre(c, comic('¡AYYY!', 0xffd23f, 150), 520, 340, -0.1);
    const snif1 = pre(c, comic('¡SNIF!', 0xbfe6ff, 74), 300, 760, -0.15);
    const snif2 = pre(c, comic('¡SNIF!', 0xbfe6ff, 74), 1600, 720, 0.12);
    const fiu = pre(c, comic('¡FUUUSH!', 0xffffff, 90), 360, 560, -0.06);
    at(c, 0.18, () => {
      ay(0.75);
      sfx('sting', 1.3);
      c.shaker.add(0.18);
    });
    // the wind machine
    at(c, 0.42, () => {
      if (c.reduce) windV.v = 1;
      else gsap.to(windV, { v: 1, duration: 0.35 });
      fiu(0.55, { from: 1.6 });
      sfx('whoosh', 0.45);
    });
    // the clock runs backward
    at(c, 0.5, () => {
      if (c.reduce) back.v = 3;
      else gsap.to(back, { v: 3, duration: 1.4, ease: 'power2.inOut' });
      for (let i = 0; i < 6; i++) later(c, i * 0.2, () => sfx('tick', 1.4 - i * 0.05));
    });
    // roses from the front rows, piling up at his feet
    const pile: [number, number, number][] = [];
    for (let i = 0; i < 9; i++) {
      at(c, 0.7 + i * 0.09, () => {
        const tx = W / 2 + (i % 2 ? 1 : -1) * (160 + ((i * 53) % 220));
        const ty = FLOOR + 30 + ((i * 37) % 60);
        const g = rose(new Graphics(), 0, 0, 24, 0, 0xc8102e);
        g.position.set(tx + (i % 2 ? 300 : -300), H + 40);
        k.addChild(g);
        const land = () => {
          destroyTree(g);
          pile.push([tx, ty, i]);
          if (!roses.destroyed) rose(roses, tx, ty, 24, i, 0xc8102e);
        };
        if (c.reduce) return land();
        gsap.to(g, { x: tx, duration: 0.5, ease: 'none', onComplete: land });
        gsap.to(g, { y: ty - 260, duration: 0.25, ease: 'power2.out' });
        gsap.to(g, { y: ty, duration: 0.25, delay: 0.25, ease: 'power2.in' });
        gsap.to(g, { rotation: 6, duration: 0.5 });
      });
    }
    at(c, 0.85, () => snif1(0.55, { from: 1.5 }));
    at(c, 1.2, () => snif2(0.55, { from: 1.5 }));
    // the spotlight finds him
    at(c, 1.55, () => {
      sfx('charge', 1.1);
      if (c.reduce) spot.alpha = 1;
      else gsap.to(spot, { alpha: 1, duration: 0.2 });
      glowV.v = 1;
      stage(fl.clear(), W, H, FLOOR, 1, 1);
    });
    score(c, [
      [0.0, 'drumroll', 0.9],
      [0.3, 'sting', 1.0],
    ]);
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 0.95);
    sfx('boom', 0.7);
    c.shaker.add(0.3);
    flashOf(c, 0xffe9b0, 0.4, 0.4);
    if (st) {
      if (!st.spot.destroyed) st.spot.alpha = 1;
      if (!c.reduce) gsap.to(st.wind, { v: 0.6, duration: 0.6 });
    }
    // it rains roses
    fall(c, c.fg, (i) => rose(new Graphics(), 0, 0, 20 + (i % 3) * 5, 0, i % 4 ? 0xc8102e : 0xffffff), { n: 22, over: 1.6, dur: 1.6, spread: W * 1.05 });
    fall(c, c.back, () => new Graphics().poly(petalPts(20)).fill(0xc8102e), { n: 30, over: 2.2, dur: 2.2 });
    cheer(c, '¡OTRA, OTRA!', 0xffd23f, 150, 2.3);
    aside(c, '…y la melena, intacta.', 0xffffff, { delay: 0.6, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.3, h / 1080);
    const floor = h * 0.78;
    const bg = vgrad(new Graphics(), 0, 0, w, floor, BG, 14);
    const R = m * 0.24;
    const cl = clockFace(R);
    cl.face.position.set(w / 2, h * 0.32);
    cl.hands.position.set(w / 2, h * 0.32);
    drawHands(cl.hands, R, 0.25, 0);
    const band = new Graphics();
    const side = Math.min(w * 0.42, m * 0.78);
    const ms = (h / 1080) * 1.15;
    mariachi(band, w / 2 - side, floor, ms, 0);
    mariachi(band, w / 2 - side + 170 * ms, floor, ms * 0.92, 1);
    mariachi(band, w / 2 + side - 170 * ms, floor, ms * 0.92, 2);
    mariachi(band, w / 2 + side, floor, ms, 0);
    const pic = new Graphics();
    picado(pic, -10, w + 10, h * 0.1, Math.max(6, Math.round(w / 110)), u * 1.3, 0.4, 7);
    const fl = stage(new Graphics(), w, h, floor, u, 1);
    const roses = new Graphics();
    for (let i = 0; i < 9; i++) rose(roses, w / 2 + (i % 2 ? 1 : -1) * m * (0.18 + ((i * 53) % 30) / 100), floor + (h - floor) * (0.3 + ((i * 37) % 40) / 100), 22 * u + 2, i, 0xc8102e);
    const spot = new Graphics().poly(cone(w / 2, -20, Math.PI / 2, h * 1.2, 0.22)).fill({ color: 0xffffff, alpha: 0.12 });
    const cu = curtains(w, h, u);
    const open = Math.min(w * 0.14, m * 0.24);
    cu.L.position.set(open, 0);
    cu.R.position.set(w - open, 0);
    k.addChild(bg, cl.face, cl.hands, band, fl, spot, roses, pic, cu.L, cu.R, cu.val);
    if (live)
      liveLoop(k, (t) => {
        pic.clear();
        picado(pic, -10, w + 10, h * 0.1, Math.max(6, Math.round(w / 110)), u * 1.3, t + 0.4, 7);
        drawHands(cl.hands, R, 0.25 - t * 0.004, -t * 0.05);
      });
    return k;
  },
};
