/**
 * Lara Croqueta, la Saqueadora de Alacenas: the tomb universe (a jungle temple out of an old 3D console, all flat
 * polygons). A chamber of big faceted stone blocks, a doorway open on a jungle of green triangles with shafts of light,
 * hanging vines, two flickering torches, a pedestal on the right. She steps on a plate (¡CLIC!) and a bed of spikes
 * shoots up under her (¡CLANC!) — she is already in the air, somersaulting, a motion arc around her, and lands in a
 * puff of dust as the spikes sink back. A shaft of light falls on the pedestal: on it, a GOLDEN TUNA CAN (¡TIN!) —
 * RELIQUIA: ATÚN DORADO.
 * Payoff: the can pops open, gold rays and fish sparkles burst out, her two red laser dots sweep the walls; ¡SAQUEADO! /
 * …había atún. Siempre hay atún.
 * (No names, logos or weapons: a cat explorer with a braid and two laser pointers. She is the only thing borrowed: the
 * cat's pose, given back exactly at the landing and at the payoff.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, alive, burst, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { puff, rng, stash, vgrad } from './kitB';
import { borrowPose } from './kitC';
import { arcPts, ngon, onCat, streak } from './kitD';
import { at, comic, pre, wrap } from './kitI';
import { C, TAU, glint, glow, headline, loop, taper } from './kitK';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const TEAL = 0x2bb3a3;
const STONE = [0x8a7656, 0x977f5c, 0x7c6a4e, 0xa08a64, 0x705f45];
const FLOOR = [0x6e5e44, 0x76654a, 0x67583f, 0x7c6b4e, 0x625239];
const JUNGLE = [0x1f5a2a, 0x2c7a34, 0x3e9a3e, 0x174a22];
const GOLD = 0xf2c84a;
const LASER = 0xff2a2a;
/** her feet on the painting (measured on the integrated SVG) */
const FEET_Y = 0.95;

interface Lay {
  w: number;
  h: number;
  cx: number;
  u: number;
}
const X = (l: Lay, x: number) => l.cx + (x - 960) * l.u;
const Y = (l: Lay, y: number) => y * l.u;

/** the chamber: faceted block wall, the doorway onto the jungle, vines, the tiled floor, the pedestal (static) */
function chamber(g: Graphics, l: Lay) {
  const fl = Y(l, 770);
  // the jungle beyond the doorway (drawn first, the wall cuts it)
  const dx0 = X(l, 760);
  const dx1 = X(l, 1160);
  vgrad(g, dx0, Y(l, 120), dx1 - dx0, fl - Y(l, 120), [0xbfe8a0, 0x7ac070, 0x3e8a44], 8);
  const r = rng(19);
  for (let i = 0; i < 26; i++) {
    const x = dx0 + r() * (dx1 - dx0);
    const y = Y(l, 300) + r() * (fl - Y(l, 300));
    const s = (40 + r() * 70) * l.u;
    g.poly([x, y - s, x + s * 0.8, y + s * 0.4, x - s * 0.8, y + s * 0.4]).fill(JUNGLE[i % 4]);
  }
  // the wall: big blocks, each split into two flat-shaded triangles
  const bh = 110 * l.u;
  for (let j = 0; j * bh < fl; j++) {
    const y0 = j * bh;
    const y1 = Math.min(fl, y0 + bh);
    const bw = 190 * l.u;
    const off = j % 2 ? bw / 2 : 0;
    for (let x = -bw + off - ((l.w / 2) % bw); x < l.w + bw; x += bw) {
      const xa = x;
      const xb = x + bw;
      // skip the doorway (an opening with a stepped lintel)
      const mid = (xa + xb) / 2;
      if (mid > dx0 && mid < dx1 && y0 >= Y(l, 120)) continue;
      const c0 = STONE[Math.floor(r() * STONE.length)];
      const c1 = STONE[Math.floor(r() * STONE.length)];
      g.poly([xa + 2, y0 + 2, xb - 2, y0 + 2, xa + 2, y1 - 2]).fill(c0);
      g.poly([xb - 2, y0 + 2, xb - 2, y1 - 2, xa + 2, y1 - 2]).fill(c1);
      const q = r();
      if (q < 0.1) g.poly(ngon(mid, (y0 + y1) / 2, 26 * l.u, 18 * l.u, 6, r())).fill({ color: 0x4a3c2a, alpha: 0.7 });
      else if (q < 0.22) g.poly([xa + 4, y1 - 2, xa + bw * (0.3 + r() * 0.4), y1 - 2, xa + bw * 0.2, y1 - bh * (0.25 + r() * 0.3)]).fill({ color: 0x4e6a2a, alpha: 0.75 });
    }
  }
  // the doorway's jambs and lintel, with a carved cat face on the lintel
  g.poly([dx0 - 50 * l.u, Y(l, 70), dx1 + 50 * l.u, Y(l, 70), dx1 + 20 * l.u, Y(l, 130), dx0 - 20 * l.u, Y(l, 130)]).fill(0x8a7e6e);
  g.poly([dx0 - 50 * l.u, Y(l, 70), dx1 + 50 * l.u, Y(l, 70), dx1 + 20 * l.u, Y(l, 100), dx0 - 20 * l.u, Y(l, 100)]).fill(0x9a8e7c);
  const fx = (dx0 + dx1) / 2;
  const fy = Y(l, 100);
  g.poly([fx - 50 * l.u, fy + 10 * l.u, fx - 40 * l.u, fy - 26 * l.u, fx - 20 * l.u, fy - 6 * l.u, fx + 20 * l.u, fy - 6 * l.u, fx + 40 * l.u, fy - 26 * l.u, fx + 50 * l.u, fy + 10 * l.u, fx, fy + 26 * l.u]).fill(0x5a5046);
  g.poly(ngon(fx - 18 * l.u, fy + 4 * l.u, 7 * l.u, 5 * l.u, 6)).fill(TEAL).poly(ngon(fx + 18 * l.u, fy + 4 * l.u, 7 * l.u, 5 * l.u, 6)).fill(TEAL);
  g.poly([dx0 - 24 * l.u, Y(l, 130), dx0, Y(l, 130), dx0, fl, dx0 - 30 * l.u, fl]).fill(0x4a4239);
  g.poly([dx1, Y(l, 130), dx1 + 24 * l.u, Y(l, 130), dx1 + 30 * l.u, fl, dx1, fl]).fill(0x4a4239);
  // vines hanging from the top
  for (let i = 0; i < 9; i++) {
    const x = (i / 8) * l.w + (r() - 0.5) * 80 * l.u;
    const len = (160 + r() * 260) * l.u;
    const pts: number[] = [];
    for (let k = 0; k <= 6; k++) pts.push(x + Math.sin(k * 0.9 + i) * 14 * l.u, (k / 6) * len);
    g.poly(taper(pts, 6 * l.u, 3 * l.u)).fill(0x2c5a26);
    for (let k = 1; k <= 6; k++) {
      const lx = pts[k * 2];
      const ly = pts[k * 2 + 1];
      const sd = k % 2 ? 1 : -1;
      g.poly([lx, ly, lx + sd * 30 * l.u, ly - 8 * l.u, lx + sd * 18 * l.u, ly + 12 * l.u]).fill(JUNGLE[k % 4]);
    }
  }
  // the floor: tiles in perspective, each two triangles
  const vx = l.cx;
  const vy = Y(l, 380);
  const rows = 6;
  const tile = 150 * l.u;
  for (let j = 0; j < rows; j++) {
    const y0 = fl + (l.h + 40 - fl) * Math.pow(j / rows, 1.5);
    const y1 = fl + (l.h + 40 - fl) * Math.pow((j + 1) / rows, 1.5);
    const k0 = (y0 - vy) / (fl - vy);
    const k1 = (y1 - vy) / (fl - vy);
    const span = Math.ceil(l.w / 2 / tile / k1) + 2;
    for (let i = -span; i < span; i++) {
      const xa0 = vx + i * tile * k0;
      const xb0 = vx + (i + 1) * tile * k0;
      const xa1 = vx + i * tile * k1;
      const xb1 = vx + (i + 1) * tile * k1;
      g.poly([xa0, y0, xb0, y0, xa1, y1]).fill(FLOOR[(i + j + 40) % 5]);
      g.poly([xb0, y0, xb1, y1, xa1, y1]).fill(FLOOR[(i * 3 + j + 41) % 5]);
    }
  }
  // the pedestal (right): a stepped stone column
  const px = X(l, 1470);
  g.poly([px - 140 * l.u, Y(l, 880), px + 140 * l.u, Y(l, 880), px + 116 * l.u, Y(l, 830), px - 116 * l.u, Y(l, 830)]).fill(0xa8946c);
  g.poly([px - 90 * l.u, Y(l, 830), px, Y(l, 830), px - 78 * l.u, Y(l, 590)]).fill(0x9a8462);
  g.poly([px, Y(l, 830), px + 90 * l.u, Y(l, 830), px + 78 * l.u, Y(l, 590), px - 78 * l.u, Y(l, 590)]).fill(0x7a6648);
  g.poly([px - 116 * l.u, Y(l, 590), px + 116 * l.u, Y(l, 590), px + 98 * l.u, Y(l, 552), px - 98 * l.u, Y(l, 552)]).fill(0xb8a47a);
  g.poly([px - 40 * l.u, Y(l, 700), px + 40 * l.u, Y(l, 700), px + 30 * l.u, Y(l, 760), px - 30 * l.u, Y(l, 760)]).fill({ color: 0x2bb3a3, alpha: 0.55 });
}

/** a wall torch at (x, y): bracket and a faceted flame flickering with t */
function torch(g: Graphics, x: number, y: number, s: number, t: number) {
  g.poly([x - 10 * s, y, x + 10 * s, y, x + 6 * s, y + 60 * s, x - 6 * s, y + 60 * s]).fill(0x3a2a1a);
  g.poly([x - 22 * s, y - 6 * s, x + 22 * s, y - 6 * s, x + 12 * s, y + 8 * s, x - 12 * s, y + 8 * s]).fill(0x5a4a3a);
  const f = 1 + Math.sin(t * 17 + x) * 0.15 + Math.sin(t * 29) * 0.08;
  glow(g, x, y - 30 * s, 120 * s, 0xffa040, 0.3, 4, 10);
  g.poly([x - 18 * s, y - 6 * s, x, y - 70 * s * f, x + 18 * s, y - 6 * s]).fill(0xff7a20);
  g.poly([x - 10 * s, y - 6 * s, x + 2 * s, y - 46 * s * f, x + 10 * s, y - 6 * s]).fill(0xffd040);
}

/** the golden tuna can at (x, y = its base): a faceted gold cylinder with a fish on its label; `open` 0..1 the lid */
function can(g: Graphics, x: number, y: number, s: number, open: number) {
  const rx = 60 * s;
  const ry = 18 * s;
  const hh = 54 * s;
  g.poly([x - rx, y - hh, x + rx, y - hh, x + rx, y, x - rx, y]).fill(0xd8a830);
  g.poly(ngon(x, y, rx, ry, 10)).fill(0xb88a20);
  g.poly([x - rx, y - hh, x - rx * 0.3, y - hh, x - rx * 0.3, y, x - rx, y]).fill({ color: 0xffe080, alpha: 0.6 });
  g.rect(x - rx, y - hh * 0.72, rx * 2, hh * 0.44).fill(TEAL);
  g.poly([x - 26 * s, y - hh * 0.5, x + 10 * s, y - hh * 0.66, x + 22 * s, y - hh * 0.5, x + 10 * s, y - hh * 0.34]).fill(0xf4f1ea);
  g.poly([x + 20 * s, y - hh * 0.5, x + 34 * s, y - hh * 0.62, x + 34 * s, y - hh * 0.38]).fill(0xf4f1ea);
  if (open < 0.02) g.poly(ngon(x, y - hh, rx, ry, 10)).fill(GOLD);
  else {
    // the lid flips up on its hinge (back edge) and the tuna shows
    g.poly(ngon(x, y - hh, rx * 0.92, ry * 0.8, 10)).fill(0xf0a8a0);
    const a = open * 1.9;
    const ly = y - hh - Math.sin(a) * rx * 0.9;
    const lry = ry * Math.abs(Math.cos(a)) + 4 * s;
    g.poly(ngon(x, ly - ry * 0.4, rx, lry, 10)).fill(GOLD).stroke({ width: 3 * s, color: 0x8a6a10 });
  }
}

/** spikes out of the floor slab: `k` 0..1 how far up (one Graphics; fixed polygons) */
function spikes(g: Graphics, x: number, y: number, k: number) {
  g.clear();
  g.poly([x - 230, y - 6, x + 230, y - 6, x + 260, y + 26, x - 260, y + 26]).fill(0x3e3830);
  for (let i = 0; i < 9; i++) g.rect(x - 220 + i * 52, y + 2, 34, 8).fill(0x14100c);
  if (k < 0.02) return;
  for (let i = 0; i < 9; i++) {
    const sx = x - 203 + i * 52;
    const h = 150 * k * (0.85 + ((i * 37) % 10) / 40);
    g.poly([sx - 14, y + 6, sx, y + 6 - h, sx + 14, y + 6]).fill(0xb8b0a4);
    g.poly([sx, y + 6, sx, y + 6 - h, sx + 14, y + 6]).fill(0x7a7266);
  }
}

interface St {
  open: { v: number };
  lasers: { v: number };
  pose: ReturnType<typeof borrowPose> | null;
  canG: Graphics;
  draw: () => void;
  land: (o?: { dur?: number; slow?: boolean }) => void;
}
const S = stash<St>();

export const laracroqueta: Signature = {
  dark: true,
  frame: TEAL,
  tag: 'UNIVERSO DE LA TUMBA',
  open(c: SigCtx) {
    const L: Lay = { w: W, h: H, cx: W / 2, u: 1 };
    const k = new Container();
    const bg = new Graphics();
    chamber(bg, L);
    const shafts = new Graphics();
    shafts.blendMode = 'add';
    const tg = new Graphics();
    const canG = new Graphics();
    const dots = new Graphics();
    k.addChild(bg, shafts, tg, canG, dots);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the spike slab lives with her (unscaled): it meets her feet on any screen
    const [, fy] = onCat(c, 0.5, FEET_Y);
    const sp = new Graphics();
    c.behind.addChild(sp);
    const instant = c.short || c.reduce;
    const spk = { v: 0 };
    const beam = { v: instant ? 1 : 0 };
    const open = { v: 0 };
    const lasers = { v: c.short ? 1 : 0 };
    const px = 1470;
    const draw = loop(
      c,
      tg,
      30,
      (t) => {
        tg.clear();
        torch(tg, 470, 330, 1, t);
        torch(tg, 1300, 330, 1, t);
        spikes(sp, W / 2, fy + 12, spk.v);
        shafts.clear();
        shafts.poly([840, 130, 1080, 130, 1260, 770, 700, 770]).fill({ color: 0xfff2c0, alpha: 0.06 });
        if (beam.v > 0.01) {
          shafts.poly([px - 70, -20, px + 70, -20, px + 150, 560, px - 150, 560]).fill({ color: 0xfff2c0, alpha: 0.12 * beam.v });
          shafts.poly([px - 36, -20, px + 36, -20, px + 90, 560, px - 90, 560]).fill({ color: 0xfff2c0, alpha: 0.12 * beam.v });
        }
        canG.clear();
        can(canG, px, 556, 1.6, open.v);
        dots.clear();
        if (lasers.v > 0.01) {
          for (let i = 0; i < 2; i++) {
            const x = 960 + Math.sin(t * (1.7 + i * 0.6) + i * 2) * 640;
            const y = 420 + Math.cos(t * (2.3 - i * 0.5) + i) * 260;
            dots.poly(ngon(x, y, 46, 46, 12)).fill({ color: LASER, alpha: 0.2 * lasers.v });
            dots.poly(ngon(x, y, 22, 22, 10)).fill({ color: LASER, alpha: 0.6 * lasers.v });
            dots.poly(ngon(x, y, 9, 9, 8)).fill({ color: 0xffe0e0, alpha: lasers.v });
          }
        }
      },
      0.3,
    );
    const land = headline(c, comic('¡SAQUEADO!', GOLD, 150), '…había atún. Siempre hay atún.');
    S.set(c, { open, lasers, pose: null, canG, draw, land });
    if (c.short) return;

    const clic = pre(c, comic('¡CLIC!', 0xe8e0c8, 70), W / 2 - 300, fy - 30, -0.1);
    const clanc = pre(c, comic('¡CLANC!', 0xd8d8d8, 130), W / 2 + 380, fy - 120, 0.1);
    const tin = pre(c, comic('¡TIN!', GOLD, 96), px - 60, 380, -0.1);
    const reliq = pre(c, plate('RELIQUIA: ATÚN DORADO', GOLD, C.ink, 40, C.ink), px - 60, 900, 0.03);
    // she steps on the plate
    at(c, 0.15, () => {
      clic(0.45, { from: 1.4 });
      sfx('click', 0.8);
    });
    // spikes shoot up — she is already in the air, somersaulting
    at(c, 0.42, () => {
      clanc(0.7);
      sfx('hit', 1.4);
      sfx('zap', 0.5);
      c.shaker.add(0.18);
      if (c.reduce) {
        spk.v = 1;
        later(c, 0.6, () => (spk.v = 0));
        return;
      }
      gsap.to(spk, { v: 1, duration: 0.08, ease: 'power3.out' });
      gsap.to(spk, { v: 0, delay: 0.6, duration: 0.25, ease: 'power2.in' });
    });
    at(c, 0.36, () => {
      if (c.reduce) return;
      const pose = borrowPose(c);
      const st = S.get(c);
      if (st) st.pose = pose;
      sfx('whoosh', 1.1);
      const cat = c.cat;
      const r0 = cat.rotation;
      const p = { u: 0 };
      // the arc around her as she flips
      const arc = new Graphics();
      c.fg.addChild(arc);
      gsap.to(p, {
        u: 1,
        duration: 0.82,
        ease: 'none',
        onUpdate: () => {
          if (pose.given || cat.destroyed) return;
          const u = p.u;
          cat.y = pose.y0 - Math.sin(u * Math.PI) * 280;
          cat.rotation = r0 - gsap.parseEase('power1.inOut')(u) * TAU;
          if (!arc.destroyed) {
            arc.clear();
            const a0 = -Math.PI / 2 - gsap.parseEase('power1.inOut')(u) * TAU;
            for (let j = 0; j < 3; j++) arc.poly(taper(arcPts(W / 2, cat.y, 300 + j * 30, a0, a0 + 1.4, 10), 3, 10 - j * 3)).fill({ color: 0xffffff, alpha: 0.5 - j * 0.12 });
          }
        },
        onComplete: () => {
          pose.give();
          destroyTree(arc);
          if (!alive(c)) return;
          sfx('hit', 0.7);
          c.shaker.add(0.12);
          puff(c, c.fg, W / 2 - 120, fy, 0xb8a888, 4, 50, 40);
          puff(c, c.fg, W / 2 + 120, fy, 0xb8a888, 4, 50, 40);
        },
      });
    });
    // a shaft of light on the pedestal: the golden can
    at(c, 1.35, () => {
      if (c.reduce) beam.v = 1;
      else gsap.to(beam, { v: 1, duration: 0.3 });
      later(c, 0.15, () => {
        const g = glint(new Graphics(), 0, 0, 70, 0xfff6c8);
        g.position.set(px + 50, 480);
        k.addChild(g);
        tin(0.6, { from: 1.5 });
        sfx('gem', 2.2);
        if (!c.reduce) gsap.fromTo(g.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.15, ease: 'back.out(2)' });
        gsap.to(g, { alpha: 0, delay: 0.35, duration: 0.3, onComplete: () => g.destroy() });
      });
    });
    at(c, 1.75, () => {
      reliq(0.6, { from: 1.4 });
      sfx('sting', 1.3);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    st?.pose?.give();
    sfx('fanfare', 1.05);
    sfx('coin', 1.2);
    sfx('bigboom', 0.6);
    c.shaker.add(0.3);
    flashOf(c, 0xfff2c0, 0.45, 0.35);
    const px = 1470;
    if (st) {
      if (c.reduce) {
        st.open.v = 1;
        st.lasers.v = 1;
        st.draw();
      } else {
        gsap.to(st.open, { v: 1, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(st.lasers, { v: 1, duration: 0.3 });
      }
      // gold rays out of the can
      if (!st.canG.destroyed && st.canG.parent) {
        const rays = new Graphics();
        rays.blendMode = 'add';
        for (let i = 0; i < 12; i++) {
          const a = -Math.PI / 2 + (i / 11 - 0.5) * 2.2;
          rays.poly(streak(px, 470, px + Math.cos(a) * 760, 470 + Math.sin(a) * 760, 8, 48)).fill({ color: 0xffe080, alpha: 0.22 });
        }
        st.canG.parent.addChild(rays);
        if (!c.reduce) gsap.from(rays.scale, { x: 0.2, y: 0.2, duration: 0.3 });
        rays.pivot.set(px, 470);
        rays.position.set(px, 470);
        gsap.to(rays, { alpha: 0, delay: 1.8, duration: 0.6, onComplete: () => destroyTree(rays) });
      }
    }
    // fish sparkles out of the can
    burst(
      c,
      c.fg,
      (i) => {
        const g = new Graphics();
        const col = i % 3 ? GOLD : 0xffffff;
        g.poly([-16, 0, 6, -10, 16, 0, 6, 10]).fill(col);
        g.poly([14, 0, 26, -10, 26, 10]).fill(col);
        return g;
      },
      16,
      px,
      470,
      560,
      1.3,
    );
    if (st) st.land({ dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const L: Lay = { w, h, cx: w / 2, u };
    const bg = new Graphics();
    chamber(bg, L);
    const tg = new Graphics();
    const cg = new Graphics();
    const ped = X(L, 1470);
    can(cg, ped, Y(L, 556), 1.6 * u, 0);
    const shafts = new Graphics();
    shafts.blendMode = 'add';
    shafts.poly([X(L, 840), Y(L, 130), X(L, 1080), Y(L, 130), X(L, 1260), Y(L, 770), X(L, 700), Y(L, 770)]).fill({ color: 0xfff2c0, alpha: 0.07 });
    shafts.poly([ped - 60 * u, 0, ped + 60 * u, 0, ped + 110 * u, Y(L, 600), ped - 110 * u, Y(L, 600)]).fill({ color: 0xfff2c0, alpha: 0.14 });
    torch(tg, X(L, 470), Y(L, 330), u, 0);
    torch(tg, X(L, 1300), Y(L, 330), u, 0);
    k.addChild(bg, shafts, tg, cg);
    if (live)
      liveLoop(k, (t) => {
        tg.clear();
        torch(tg, X(L, 470), Y(L, 330), u, t);
        torch(tg, X(L, 1300), Y(L, 330), u, t);
      });
    return k;
  },
};
