/**
 * Tanjimiau, el de la Caja a la Espalda: the breathing universe (a night forest as an old woodblock print). Flat indigo
 * sky with its dark band on top, a full moon crossed by bands of pink mist, tall cedars, hanging wisteria, a river of
 * wave scales at his feet, a red seal in the corner. He breathes in (fuuu…, a little mist at his mouth) and a WATER
 * DRAGON in flat print waves rises from the river and goes all the way around the screen — scales, foam claws, a horned
 * head — ¡SHAAAA! Then the wooden box on his back opens a crack (¡TOC!) and a little paw peeks out.
 * Payoff: the dragon speeds up, a flat wave with curling claws surges along the bottom, spray everywhere, and the
 * little paw waves from the box; ¡RESPIRA! / …perdón por el corte.
 * (Evoked through the print style, the box and the water: no names of techniques, no crests, no catchphrases.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, burst, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { ngon, onCat } from './kitD';
import { at, comic, pre, wrap } from './kitI';
import { F, blob, headline, loop, taper, word1 } from './kitK';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const INDIGO = 0x1d2a5a;
const PRUSSIAN = 0x1f4e8c;
const AQUA = 0x7fb2e5;
const FOAM = 0xf4f1ea;
const INK = 0x0e1430;
const GREEN = 0x2e7d5b;
const SEAL = 0xd62839;
const MOON = 0xf6e7b8;
/** the box on his back, his mouth (measured on the integrated SVG) */
const BOX_TOP: [number, number] = [0.32, 0.255];
const MOUTH: [number, number] = [0.62, 0.38];

interface Lay {
  w: number;
  h: number;
  cx: number;
  u: number;
}
const X = (l: Lay, x: number) => l.cx + (x - 960) * l.u;
const Y = (l: Lay, y: number) => y * l.u;

/** the print's night: sky with its top band, moon and mist, cedars, wisteria, the bank (static) */
function forest(g: Graphics, l: Lay) {
  vgrad(g, 0, 0, l.w, Y(l, 860), [0x0b1230, INDIGO, 0x2a3a72, 0x3e4e86], 16);
  g.rect(0, 0, l.w, Y(l, 90)).fill({ color: 0x050816, alpha: 0.7 });
  const mx = X(l, 1300);
  const my = Y(l, 300);
  g.poly(ngon(mx, my, 150 * l.u, 150 * l.u, 36)).fill(MOON);
  // bands of mist across the moon and the trees (flat, rounded)
  const band = (y: number, x0: number, x1: number, col: number, a: number) => {
    const hh = 26 * l.u;
    const pts: number[] = [];
    for (let i = 0; i <= 6; i++) {
      const q = -Math.PI / 2 + (i / 6) * Math.PI;
      pts.push(x1 + Math.cos(q) * hh, y + Math.sin(q) * hh);
    }
    for (let i = 0; i <= 6; i++) {
      const q = Math.PI / 2 + (i / 6) * Math.PI;
      pts.push(x0 + Math.cos(q) * hh, y + Math.sin(q) * hh);
    }
    g.poly(pts).fill({ color: col, alpha: a });
  };
  // cedars: tall flat trunks with bark lines, two depths
  const r = rng(11);
  for (let d = 0; d < 2; d++) {
    const n = d ? 7 : 9;
    for (let i = 0; i < n; i++) {
      const x = (i / n) * l.w + (r() - 0.3) * 120 * l.u;
      if (Math.abs(x - l.cx) < 330 * l.u && d) continue;
      const tw = (d ? 70 + r() * 40 : 34 + r() * 20) * l.u;
      const col = d ? 0x2c2620 : 0x1c2448;
      g.poly([x - tw / 2, -10, x + tw / 2, -10, x + tw * 0.6, Y(l, 880), x - tw * 0.6, Y(l, 880)]).fill(col);
      if (d) for (let j = 0; j < 5; j++) g.rect(x - tw / 2 + (j + 0.5) * (tw / 5), 0, 2.5 * l.u, Y(l, 860)).fill({ color: 0x14100c, alpha: 0.6 });
    }
    if (!d) {
      band(Y(l, 330), X(l, 980), X(l, 1620), 0xe8b8a8, 0.85);
      band(Y(l, 410), X(l, 1150), X(l, 1800), 0xf2d6c4, 0.75);
      band(Y(l, 230), X(l, 120), X(l, 700), 0xe8b8a8, 0.5);
    }
  }
  // wisteria hanging from the top
  for (let i = 0; i < 11; i++) {
    const x = (i / 10) * l.w + (r() - 0.5) * 60 * l.u;
    const len = (90 + r() * 120) * l.u;
    for (let j = 0; j < 7; j++) {
      const y = Y(l, 20) + (j / 7) * len;
      const s = (1 - j / 8) * 20 * l.u;
      g.poly(ngon(x + Math.sin(j * 1.3 + i) * 6 * l.u, y, s, s * 0.8, 7)).fill(j % 2 ? 0x9a7ac8 : 0xc0a8e8);
    }
    g.poly([x - 30 * l.u, 0, x + 30 * l.u, 0, x, Y(l, 30)]).fill(0x2e5a3a);
  }
  // the bank (dark green, flat) and grass strokes
  g.poly([0, Y(l, 840), l.w * 0.3, Y(l, 820), l.w * 0.7, Y(l, 832), l.w, Y(l, 816), l.w, Y(l, 880), 0, Y(l, 880)]).fill(0x1e3a2a);
  for (let i = 0; i < 50; i++) {
    const x = r() * l.w;
    const y = Y(l, 850 + r() * 20);
    g.poly([x, y, x + 4 * l.u, y - 26 * l.u, x + 7 * l.u, y]).fill(0x2e5a3a);
  }
}

/** the river: rows of wave scales (concentric half-rings), drifting with t */
function river(g: Graphics, l: Lay, t: number, top = 870) {
  g.clear();
  const y0 = Y(l, top);
  g.rect(0, y0, l.w, l.h - y0 + 40).fill(PRUSSIAN);
  const R = 46 * l.u;
  const rows = Math.ceil((l.h - y0) / (R * 0.5)) + 1;
  const shift = (t * 30 * l.u) % (R * 2);
  for (let j = 0; j < rows; j++) {
    const y = y0 + j * R * 0.5 + R * 0.4;
    const off = (j % 2 ? R : 0) + shift;
    for (let x = -R * 2 + off; x < l.w + R * 2; x += R * 2) {
      for (let b = 0; b < 3; b++) {
        const ro = R * (1 - b * 0.3);
        const pts: number[] = [];
        for (let i = 0; i <= 5; i++) {
          const a = Math.PI + (i / 5) * Math.PI;
          pts.push(x + Math.cos(a) * ro, y + Math.sin(a) * ro);
        }
        g.poly(pts).fill(b === 1 ? AQUA : b === 2 ? PRUSSIAN : 0x174070);
      }
    }
  }
}

/** a foam claw: the curling tip of a print wave (a hook polygon) pointing along angle `a` */
function claw(g: Graphics, x: number, y: number, s: number, a: number, col = FOAM) {
  const cs = Math.cos(a);
  const sn = Math.sin(a);
  const P = (px: number, py: number) => [x + px * cs - py * sn, y + px * sn + py * cs];
  const pts = [...P(0, 0), ...P(s * 0.5, -s * 0.9), ...P(s * 1.1, -s * 0.8), ...P(s * 1.25, -s * 0.35), ...P(s * 0.95, -s * 0.45), ...P(s * 0.75, -s * 0.2), ...P(s * 0.4, s * 0.1)];
  g.poly(pts).fill(col);
}

/** the dragon's path around the screen (an ellipse with a ripple), s in radians */
function path(cx: number, cy: number, s: number, rx = 730, ry = 360): [number, number] {
  return [cx + Math.cos(s) * rx, cy + Math.sin(s) * ry + Math.sin(s * 3) * 40];
}

/** the water dragon: head at path param `sh`, body back to `st`, drawn as print waves */
function dragon(g: Graphics, cx: number, cy: number, sh: number, st: number, sc = 1, rx = 730, ry = 360) {
  g.clear();
  const len = sh - st;
  if (len < 0.02) return;
  const n = Math.max(2, Math.round(len * 22));
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = path(cx, cy, sh - (len * i) / n, rx, ry);
    pts.push(x, y);
  }
  const w0 = 84 * sc;
  g.poly(taper(pts, w0 + 7 * sc, 5 * sc)).fill(INK);
  g.poly(taper(pts, w0, 3 * sc)).fill(PRUSSIAN);
  // belly stripe and scale chevrons
  const belly: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n, i + 1);
    const dx = pts[b * 2] - pts[a * 2];
    const dy = pts[b * 2 + 1] - pts[a * 2 + 1];
    const d = Math.hypot(dx, dy) || 1;
    const w = (w0 * (1 - i / n)) * 0.45;
    belly.push(pts[i * 2] + (dy / d) * w, pts[i * 2 + 1] - (dx / d) * w);
  }
  g.poly(taper(belly, w0 * 0.28, 1)).fill(AQUA);
  for (let i = 2; i < n - 1; i += 2) {
    const a = i - 1;
    const b = i + 1;
    const dx = pts[b * 2] - pts[a * 2];
    const dy = pts[b * 2 + 1] - pts[a * 2 + 1];
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const w = w0 * (1 - i / n) * 0.7;
    const x = pts[i * 2];
    const y = pts[i * 2 + 1];
    g.poly([x - uy * w, y + ux * w, x + ux * 8 * sc, y + uy * 8 * sc, x + uy * w * 0.2, y - ux * w * 0.2, x - ux * 4 * sc, y - uy * 4 * sc]).fill({ color: 0x4a7ab8, alpha: 0.9 });
    // foam claws along the back
    if (i % 2 === 0) claw(g, x - uy * w * 1.15, y + ux * w * 1.15, 52 * sc * (1 - i / n) + 14 * sc, Math.atan2(-uy, -ux) + Math.PI);
  }
  // the head, pointing along the path
  const hx = pts[0];
  const hy = pts[1];
  const a = Math.atan2(pts[1] - pts[3], pts[0] - pts[2]);
  const cs = Math.cos(a);
  const sn = Math.sin(a);
  const hs = sc * 1.75;
  const P = (px: number, py: number) => [hx + (px * cs - py * sn) * hs, hy + (px * sn + py * cs) * hs];
  // horns and mane
  g.poly([...P(-30, -30), ...P(-90, -78), ...P(-70, -40), ...P(-40, -20)]).fill(FOAM);
  g.poly([...P(-36, -34), ...P(-100, -40), ...P(-60, -18)]).fill(AQUA);
  for (let i = 0; i < 4; i++) claw(g, ...(P(-40 - i * 22, 30) as [number, number]), 26 * hs, a + Math.PI * 0.85, FOAM);
  // upper jaw / snout, lower jaw (open)
  g.poly([...P(-50, -36), ...P(30, -40), ...P(84, -22), ...P(92, -6), ...P(40, -4), ...P(-50, 8)]).fill(PRUSSIAN).stroke({ width: 5 * hs, color: INK, join: 'round' });
  g.poly([...P(-40, 10), ...P(40, 6), ...P(76, 26), ...P(30, 34), ...P(-40, 34)]).fill(0x174070).stroke({ width: 5 * hs, color: INK, join: 'round' });
  g.poly([...P(40, -4), ...P(48, 8), ...P(56, -4)]).fill(FOAM).poly([...P(60, -4), ...P(66, 10), ...P(72, -4)]).fill(FOAM);
  // the eye and the whiskers
  g.poly(ngon(...(P(4, -22) as [number, number]), 12 * hs, 9 * hs, 10, a)).fill(0xffe8a0).stroke({ width: 3 * hs, color: INK });
  g.poly(ngon(...(P(7, -22) as [number, number]), 4 * hs, 7 * hs, 8, a)).fill(INK);
  g.poly(taper([...P(80, -18), ...P(130, -50), ...P(170, -40)], 4 * hs, 1)).fill(FOAM);
  g.poly(taper([...P(70, 20), ...P(120, 50), ...P(160, 46)], 4 * hs, 1)).fill(FOAM);
}

/** a flat print wave surging along the bottom: a band with curling claws on its crest; k 0..1 its height */
function surge(g: Graphics, k: number, t: number) {
  g.clear();
  if (k < 0.01) return;
  const top = H + 40 - 300 * k;
  const pts: number[] = [-200, H + 200];
  for (let i = 0; i <= 24; i++) {
    const x = -200 + ((W + 400) * i) / 24;
    pts.push(x, top + Math.sin(i * 1.1 + t * 4) * 34);
  }
  pts.push(W + 200, H + 200);
  g.poly(pts).fill(PRUSSIAN);
  const inner = pts.map((v, i) => (i % 2 ? v + 40 : v));
  g.poly(inner).fill({ color: 0x174070, alpha: 0.9 });
  for (let i = 1; i < 24; i += 2) claw(g, -200 + ((W + 400) * i) / 24, top + Math.sin(i * 1.1 + t * 4) * 34 + 6, 54, -0.3);
}

/** the little paw peeking out of the box (origin at the box's top edge): `k` 0..1 how far out, `wave` its rocking */
function paw(g: Graphics, x: number, y: number, k: number, wave: number) {
  g.clear();
  if (k < 0.01) return;
  // the lid swings up on its back hinge: the dark gap, then the plank
  const a = -0.55 * k;
  const hx = x + 64;
  const hy = y - 8;
  const L = 132;
  const tip = (d: number, h: number): [number, number] => [hx - Math.cos(a) * d - Math.sin(a) * h, hy + Math.sin(a) * d - Math.cos(a) * h];
  g.poly([x - 66, y - 2, hx, hy, hx, hy + 8, x - 66, y + 6]).fill({ color: 0x0a0604, alpha: 0.95 * k });
  const p0 = tip(0, 0);
  const p1 = tip(L, 0);
  const p2 = tip(L, 18);
  const p3 = tip(0, 18);
  g.poly([...p0, ...p1, ...p2, ...p3]).fill(0x7a4a26).stroke({ width: 3, color: 0x2a140a, join: 'round' });
  g.poly([...tip(L * 0.15, 4), ...tip(L * 0.9, 4), ...tip(L * 0.9, 9), ...tip(L * 0.15, 9)]).fill(0x4a2a12);
  // the paw, rocking (bigger: it must read from the far seats)
  const s = 1.6;
  const px = x - 6;
  const py = y - 14 - 34 * k;
  const r = Math.sin(wave) * 0.45;
  const cs = Math.cos(r);
  const sn = Math.sin(r);
  const P = (u: number, v: number): [number, number] => [px + (u * cs - v * sn) * s, py + (u * sn + v * cs) * s];
  g.poly([...P(-12, 30), ...P(-14, 0), ...P(14, 0), ...P(12, 30)]).fill(0xf2d8c8).stroke({ width: 3, color: 0x2a140a });
  g.poly(ngon(...P(0, -6), 20 * s, 16 * s, 12, r)).fill(0xf2d8c8).stroke({ width: 3, color: 0x2a140a });
  g.poly(ngon(...P(0, -2), 8 * s, 6 * s, 8, r)).fill(0xf28aa0);
  for (let i = 0; i < 3; i++) g.poly(ngon(...P(-10 + i * 10, -16), 4 * s, 4 * s, 6)).fill(0xf28aa0);
}

interface St {
  speed: { v: number };
  surgeK: { v: number };
  pawK: { v: number };
  waving: { v: number };
  draw: () => void;
  land: (o?: { dur?: number; slow?: boolean }) => void;
}
const S = stash<St>();

export const tanjimiau: Signature = {
  dark: true,
  frame: GREEN,
  tag: 'UNIVERSO DE LA RESPIRACIÓN',
  open(c: SigCtx) {
    const L: Lay = { w: W, h: H, cx: W / 2, u: 1 };
    const k = new Container();
    const bg = new Graphics();
    forest(bg, L);
    const rv = new Graphics();
    // the red seal and the title cartouche (printed corners)
    const sealG = new Graphics();
    sealG.rect(1520, 860, 70, 70).fill(SEAL).rect(1530, 870, 50, 50).fill({ color: 0xffffff, alpha: 0.12 });
    sealG.poly(ngon(1555, 900, 10, 9, 8)).fill(0xfff0e0);
    for (let i = 0; i < 4; i++) sealG.poly(ngon(1541 + i * 9.5, 882 - (i % 3 === 0 ? 0 : 5), 4, 4.5, 6)).fill(0xfff0e0);
    sealG.rect(300, 150, 52, 190).fill(0xf2e6c4).stroke({ width: 3, color: SEAL });
    sealG.rect(306, 156, 40, 178).stroke({ width: 1.5, color: SEAL });
    for (let i = 0; i < 2; i++) sealG.poly(taper([314, 196 + i * 70, 326, 212 + i * 70, 338, 204 + i * 70], 5, 2)).fill(INK);
    k.addChild(bg, rv, sealG);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the dragon goes around him (unscaled: the loop keeps its distance on any screen)
    const dg = new Graphics();
    const sg = new Graphics();
    c.behind.addChild(dg);
    c.fg.addChild(sg);
    const pg = new Graphics();
    c.fg.addChild(pg);
    const [bx, by] = onCat(c, BOX_TOP[0], BOX_TOP[1]);
    const instant = c.short || c.reduce;
    const speed = { v: 1 };
    const surgeK = { v: 0 };
    const pawK = { v: 0 };
    const waving = { v: 0 };
    const s0 = Math.PI * 0.72;
    const cy = c.catY + 20;
    let sh = instant ? s0 + Math.PI * 1.6 : s0;
    let last = 0;
    const draw = loop(
      c,
      dg,
      30,
      (t) => {
        const dt = Math.min(0.1, t - last);
        last = t;
        river(rv, L, t);
        // fast around the screen during the takeover, then a slow patrol
        const v = (t < 1.7 && !instant ? 3.9 : 1.1) * speed.v;
        sh += v * dt;
        const st = Math.max(s0, sh - 2.5);
        dragon(dg, W / 2, cy, sh, st);
        surge(sg, surgeK.v, t);
        paw(pg, bx, by, pawK.v, t * 7 * waving.v);
      },
      0,
    );
    if (c.reduce) dragon(dg, W / 2, cy, s0 + Math.PI * 1.6, s0 + Math.PI * 1.6 - 2.5);
    const land = headline(c, comic('¡RESPIRA!', 0xbfe6ff, 150), '…perdón por el corte.');
    S.set(c, { speed, surgeK, pawK, waving, draw, land });
    if (c.short) return;

    const [mx, my] = onCat(c, MOUTH[0], MOUTH[1]);
    const fuu = pre(c, word1('fuuu…', { fontFamily: F.brush, fontSize: 58, fill: FOAM, stroke: { color: INK, width: 8, join: 'round' } }), mx + 150, my - 40, 0.08);
    const sha = pre(c, comic('¡SHAAAA!', 0xbfe6ff, 120), 1480, 760, 0.08);
    const toc = pre(c, comic('¡TOC!', 0xf2d8a8, 70), bx - 120, by - 70, -0.15);
    // he breathes in: a little mist at his mouth
    at(c, 0.08, () => {
      fuu(0.8, { from: 1.2 });
      sfx('whoosh', 0.45);
      if (c.reduce) return;
      for (let i = 0; i < 5; i++) {
        const p = new Graphics().poly(blob(0, 0, 26, 18, 300 + i, 10, 0.25)).fill({ color: 0xdff0ff, alpha: 0.5 });
        p.position.set(mx + 60 + i * 20, my - 10 + Math.sin(i) * 10);
        c.fg.addChild(p);
        gsap.fromTo(p, { x: p.x + 80, alpha: 0 }, { x: mx + 10, alpha: 0.7, duration: 0.5, delay: i * 0.05, ease: 'power2.in' });
        gsap.to(p, { alpha: 0, delay: 0.5 + i * 0.05, duration: 0.15, onComplete: () => destroyTree(p) });
      }
    });
    // the dragon rises from the river and runs the loop
    at(c, 0.3, () => {
      sfx('splash', 0.8);
      c.shaker.add(0.12);
    });
    at(c, 0.75, () => {
      sha(0.8);
      sfx('splash', 1.2);
      sfx('whoosh', 0.8);
    });
    // the box opens a crack and a little paw peeks out
    at(c, 1.7, () => {
      toc(0.55, { from: 1.5 });
      sfx('click', 0.7);
      later(c, 0.12, () => sfx('click', 0.85));
      if (c.reduce) {
        pawK.v = 1;
        draw();
      } else gsap.to(pawK, { v: 1, duration: 0.3, ease: 'back.out(2)' });
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 0.95);
    sfx('splash', 0.7);
    sfx('bigboom', 0.6);
    c.shaker.add(0.35);
    flashOf(c, 0xdff0ff, 0.4, 0.35);
    if (st) {
      if (c.reduce) {
        st.surgeK.v = 0.8;
        st.pawK.v = 1;
        st.draw();
      } else {
        gsap.to(st.speed, { v: 2.6, duration: 0.2 });
        gsap.to(st.speed, { v: 1, delay: 1.2, duration: 0.6 });
        gsap.to(st.surgeK, { v: 1, duration: 0.35, ease: 'back.out(1.6)' });
        gsap.to(st.surgeK, { v: 0.45, delay: 1.4, duration: 0.8, ease: 'sine.inOut' });
        gsap.to(st.pawK, { v: 1, duration: 0.2 });
        st.waving.v = 1;
        gsap.to(st.pawK, { v: 0, delay: 2.4, duration: 0.3 });
      }
    }
    // spray everywhere
    burst(c, c.fg, (i) => new Graphics().poly(ngon(0, 0, 8 + (i % 3) * 5, 6 + (i % 3) * 4, 7)).fill(i % 2 ? FOAM : 0xbfe6ff), 26, W / 2, H - 120, 900, 1.2);
    if (st) st.land({ dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const L: Lay = { w, h, cx: w / 2, u };
    const bg = new Graphics();
    forest(bg, L);
    const rv = new Graphics();
    river(rv, L, 0, 880);
    const dg = new Graphics();
    const rx = Math.min(w * 0.42, h * 0.75);
    const ry = h * 0.32;
    dragon(dg, w / 2, h * 0.5, Math.PI * 2.3, Math.PI * 2.3 - 2.2, u, rx, ry);
    k.addChild(bg, rv, dg);
    if (live) {
      liveLoop(k, (t) => {
        river(rv, L, t, 880);
        const sh = Math.PI * 2.3 + t * 0.6;
        dragon(dg, w / 2, h * 0.5, sh, sh - 2.2, u, rx, ry);
      });
    }
    return k;
  },
};

