/**
 * Quetzalgatl: the codex's universe (the feathered serpent of Mesoamerica, as a cat — drawn the way the old painted
 * books draw: flat red, jade and gold with black outlines on bark paper). The whole screen is a codex page; the wind
 * turns the pages by itself (two leaves flip away) and leaves us at a stepped pyramid with its little temple, a sun
 * glyph, cloud scrolls, a trail of paw prints. Then the TAIL: an enormous tail covered in quetzal feathers winds once
 * around the whole screen like a serpent; feather whirlwinds rise at the sides; a wind scroll puffs from his mouth.
 * Payoff: the tail loops behind him, feathers everywhere, wind scrolls: ¡QUE SOPLE! — …y a favor, para variar.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, later, score } from './kit';
import { pawPrint } from './kitC';
import {
  C,
  TAU,
  at,
  band,
  cardLoop,
  comic,
  feather,
  fretPts,
  hideDisc,
  ngon,
  onCat,
  park,
  payline,
  pre,
  rnd,
  stash,
  streak,
  take,
  volute,
  wrap,
} from './kitJ';

const PAPER = 0xe9d8b0;
const PAPER_D = 0xd8c294;
const RED = 0xc0392b;
const OCHRE = 0xd99a3a;
const JADE = 0x1f8a5b;
const JADE_L = 0x37c27f;
const TURQ = 0x2bb3a3;
const GOLD = 0xe6c34a;
const INK = C.ink;

/** his mouth in the painting (the wind scroll comes out of it) */
const MOUTH: [number, number] = [0.71, 0.4];

/** bark paper: the base color, fibers and a few soft blotches (one Graphics) */
function amate(g: Graphics, x: number, y: number, w: number, h: number, seed: number, base = PAPER) {
  const r = rnd(seed);
  g.rect(x, y, w, h).fill(base);
  const u = h / 1080;
  const nb = Math.round((w * h) / (180000 * u * u));
  for (let i = 0; i < nb; i++) g.poly(ngon(x + r() * w, y + r() * h, (80 + r() * 160) * u, (50 + r() * 90) * u, 10, r() * 3)).fill({ color: PAPER_D, alpha: 0.18 });
  const nf = Math.round((w * h) / (9000 * u * u));
  for (let i = 0; i < nf; i++) {
    const fx = x + r() * w;
    const fy = y + r() * h;
    const L = (30 + r() * 90) * u;
    const a = (r() - 0.5) * 0.6 + (i % 3 === 0 ? Math.PI / 2 : 0);
    g.poly(streak(fx, fy, fx + Math.cos(a) * L, fy + Math.sin(a) * L, 1.2 * u, 0.6 * u)).fill({ color: 0x9a7a4a, alpha: 0.13 });
  }
  return g;
}

/** a frieze band: red with black rules and a row of step-frets (one Graphics) */
function frieze(g: Graphics, x0: number, x1: number, y: number, hh: number, u: number) {
  g.rect(x0, y, x1 - x0, hh).fill(RED);
  g.rect(x0, y, x1 - x0, 4 * u).fill(INK).rect(x0, y + hh - 4 * u, x1 - x0, 4 * u).fill(INK);
  const s = hh * 0.62;
  let dir = 1;
  for (let x = x0 + 10 * u; x < x1 - s; x += s * 1.25) {
    g.poly(fretPts(x, y + hh / 2 + s / 2, s, dir)).fill(INK);
    dir = -dir;
  }
}

/** the sun glyph: gold disc, a red ring, red rays, jade dots (codex style) */
function sunGlyph(g: Graphics, x: number, y: number, r: number) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2;
    const b = a + TAU / 16;
    g.poly([x + Math.cos(a - 0.2) * r * 0.9, y + Math.sin(a - 0.2) * r * 0.9, x + Math.cos(a) * r * 1.55, y + Math.sin(a) * r * 1.55, x + Math.cos(a + 0.2) * r * 0.9, y + Math.sin(a + 0.2) * r * 0.9]).fill(RED);
    g.poly(ngon(x + Math.cos(b) * r * 1.2, y + Math.sin(b) * r * 1.2, r * 0.09, r * 0.09, 8)).fill(JADE);
  }
  g.poly(ngon(x, y, r, r, 28)).fill(GOLD).stroke({ width: Math.max(2, r * 0.05), color: INK });
  g.poly(ngon(x, y, r * 0.72, r * 0.72, 24)).stroke({ width: Math.max(2, r * 0.07), color: RED });
  g.poly(ngon(x, y, r * 0.3, r * 0.3, 16)).fill(RED).stroke({ width: Math.max(1.5, r * 0.04), color: INK });
}

/** the stepped pyramid with its stair and temple (codex flat colors, black outlines); base center (x, y), half-width hw */
function pyramid(g: Graphics, x: number, y: number, hw: number, hh: number, u: number) {
  const tiers = 6;
  const top = hw * 0.24;
  for (let i = 0; i < tiers; i++) {
    const q0 = i / tiers;
    const q1 = (i + 1) / tiers;
    const w0 = hw - (hw - top) * q0;
    const w1 = hw - (hw - top) * q1 + 6 * u;
    const y0 = y - hh * q0;
    const y1 = y - hh * q1;
    g.poly([x - w0, y0, x + w0, y0, x + w1, y1 + hh * 0.02, x - w1, y1 + hh * 0.02]).fill(i % 2 ? OCHRE : RED).stroke({ width: 4 * u, color: INK, join: 'round' });
    g.rect(x - w1, y1 + hh * 0.02, w1 * 2, hh * 0.03).fill(i % 2 ? RED : OCHRE).stroke({ width: 3 * u, color: INK });
  }
  // the stair: a jade band up the middle with step lines and its balustrades
  const sw0 = hw * 0.2;
  const sw1 = top * 0.5;
  g.poly([x - sw0, y, x + sw0, y, x + sw1, y - hh, x - sw1, y - hh]).fill(JADE).stroke({ width: 4 * u, color: INK });
  for (let i = 1; i < 14; i++) {
    const q = i / 14;
    const ww = sw0 - (sw0 - sw1) * q;
    g.moveTo(x - ww, y - hh * q).lineTo(x + ww, y - hh * q);
  }
  g.stroke({ width: 2.5 * u, color: INK });
  // the temple on top: walls, a dark doorway, a roof comb with frets
  const tw = top * 0.9;
  const ty = y - hh;
  g.rect(x - tw, ty - hh * 0.22, tw * 2, hh * 0.22).fill(RED).stroke({ width: 4 * u, color: INK });
  g.rect(x - tw * 0.3, ty - hh * 0.16, tw * 0.6, hh * 0.16).fill(INK);
  g.poly([x - tw * 1.1, ty - hh * 0.22, x + tw * 1.1, ty - hh * 0.22, x + tw * 0.8, ty - hh * 0.36, x - tw * 0.8, ty - hh * 0.36]).fill(GOLD).stroke({ width: 4 * u, color: INK });
  for (let i = -2; i <= 2; i++) g.poly(fretPts(x + i * tw * 0.36 - tw * 0.12, ty - hh * 0.23, hh * 0.1, i % 2 ? 1 : -1)).fill(INK);
}

/** a maguey: a rosette of pointed jade leaves (origin at its base) */
function maguey(g: Graphics, x: number, y: number, s: number) {
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.38;
    const L = s * (1 - Math.abs(i - 3) * 0.12);
    g.poly([x - Math.sin(a) * s * 0.08, y + Math.cos(a) * s * 0.08 * 0, x + Math.cos(a) * L, y + Math.sin(a) * L, x + Math.sin(a) * s * 0.08, y]).fill(i % 2 ? JADE : JADE_L).stroke({ width: Math.max(1.5, s * 0.03), color: INK, join: 'round' });
  }
}

/** the pyramid page (w×h): bark paper, friezes, pyramid, sun, cloud scrolls, magueys, a trail of paw prints */
function codexPage(w: number, h: number, seed: number) {
  const u = h / 1080;
  const cx = w / 2;
  const g = new Graphics();
  amate(g, 0, 0, w, h, seed);
  const base = h * 0.78;
  pyramid(g, cx, base, h * 0.6, h * 0.5, u);
  g.rect(0, base, w, 5 * u).fill(INK);
  sunGlyph(g, cx - h * 0.53, h * 0.3, 70 * u);
  for (const [x, y, s, d] of [
    [cx + h * 0.55, h * 0.3, 70, 1],
    [cx + h * 0.66, h * 0.26, 50, -1],
    [cx - h * 0.3, h * 0.2, 46, 1],
  ] as const) {
    volute(g, x, y, s * u * 2, 0, TURQ, INK, d);
    volute(g, x + s * u * 1.1 * d, y + s * u * 0.2, s * u * 1.4, 1, 0x7ad0e0, INK, d);
  }
  for (const [x, s] of [
    [cx - h * 0.72, 120],
    [cx + h * 0.74, 130],
    [cx - h * 0.95, 90],
    [cx + h * 0.98, 100],
  ])
    maguey(g, x, base + 4 * u, s * u);
  // a trail of paw prints walking along the ground toward the pyramid (how the codices draw a journey)
  for (let i = 0; i < 6; i++) pawPrint(g, cx - h * 0.98 + i * 70 * u, base + 44 * u + (i % 2) * 22 * u, 2.4 * u, Math.PI / 2, INK, 0.85);
  const fz = 50 * u;
  frieze(g, -20, w + 20, h * 0.14, fz, u);
  frieze(g, -20, w + 20, h * 0.86 - fz * 0.2, fz, u);
  return g;
}

/** a leaf that turns away: a page of glyph registers (or of sky) that folds toward its left edge as `q` goes 0 → 1 */
function leaf(w: number, h: number, kind: 0 | 1, seed: number) {
  const u = h / 1080;
  const k = new Container();
  const g = new Graphics();
  amate(g, 0, 0, w, h, seed, kind ? 0xe4cfa2 : PAPER);
  const r = rnd(seed + 3);
  if (kind === 0) {
    // three registers of glyphs: dot-and-bar counts, feather glyphs, cloud scrolls, paw prints
    for (let j = 0; j < 3; j++) {
      const y0 = h * (0.2 + j * 0.24);
      g.rect(0, y0, w, 5 * u).fill(RED);
      for (let x = 160 * u; x < w - 120 * u; x += 220 * u) {
        const yy = y0 + h * 0.12;
        const kind2 = Math.floor(r() * 4);
        if (kind2 === 0) {
          const n = 1 + Math.floor(r() * 4);
          for (let d = 0; d < n; d++) g.poly(ngon(x - 50 * u + d * 34 * u, yy - 40 * u, 12 * u, 12 * u, 10)).fill(INK);
          g.rect(x - 70 * u, yy - 10 * u, 140 * u, 20 * u).fill(INK);
        } else if (kind2 === 1) feather(g, x - 60 * u, yy + 30 * u, 150 * u, -0.6, JADE, JADE_L, GOLD, INK);
        else if (kind2 === 2) volute(g, x, yy, 90 * u, 0, TURQ, INK);
        else {
          g.poly(ngon(x, yy, 52 * u, 52 * u, 20)).fill(OCHRE).stroke({ width: 4 * u, color: INK });
          g.poly(ngon(x, yy, 24 * u, 24 * u, 14)).fill(RED);
        }
      }
    }
  } else {
    sunGlyph(g, w * 0.5, h * 0.42, 120 * u);
    for (let i = 0; i < 6; i++) feather(g, w * 0.5 + Math.cos(i) * 300 * u, h * 0.42 + Math.sin(i) * 200 * u, 200 * u, i * 1.1, JADE, JADE_L, GOLD, INK);
  }
  frieze(g, -20, w + 20, h * 0.1, 40 * u, u);
  const shade = new Graphics();
  k.addChild(g, shade);
  const set = (q: number) => {
    const sx = Math.cos(q * Math.PI);
    k.scale.x = Math.max(0.001, Math.abs(sx));
    k.skew.y = Math.sin(q * Math.PI) * 0.12;
    shade.clear().rect(0, 0, w, h).fill({ color: 0x3a2a10, alpha: q * 0.5 });
    k.visible = q < 0.5;
  };
  return { k, set };
}

/**
 * a long quetzal tail feather (origin at its quill, pointing along `rot`): a narrow, slightly curved vane in two greens
 * split by a golden rachis, a dark-green edge (no ink outline: it reads as a plume, not a leaf). ~30 vertices.
 */
function plume(g: Graphics, x: number, y: number, len: number, rot: number, light = JADE_L, dark = JADE, rach = GOLD, curve = 0.12) {
  const ca = Math.cos(rot);
  const sa = Math.sin(rot);
  const N = 7;
  const T = (u: number, v: number): [number, number] => {
    const bend = Math.sin(u * Math.PI) * curve;
    return [x + ca * u * len - sa * (v + bend) * len, y + sa * u * len + ca * (v + bend) * len];
  };
  const w = (u: number) => 0.075 * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.9)) + 0.01;
  const top: number[] = [];
  const bot: number[] = [];
  const mid: number[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    top.push(...T(u, -w(u)));
    mid.push(...T(u, 0));
    bot.push(...T(u, w(u)));
  }
  const rev = (a: number[]) => {
    const out: number[] = [];
    for (let i = a.length - 2; i >= 0; i -= 2) out.push(a[i], a[i + 1]);
    return out;
  };
  g.poly([...top, ...rev(bot)]).fill(0x0f5a3a);
  g.poly([...top.map((v, i) => v + (mid[i] - v) * 0.18), ...rev(mid)]).fill(light);
  g.poly([...mid, ...rev(bot.map((v, i) => v + (mid[i] - v) * 0.18))]).fill(dark);
  g.poly([...T(0, -0.008), ...T(0.97, -0.003), ...T(0.97, 0.003), ...T(0, 0.008)]).fill(rach);
}

/**
 * the feathered serpent's tail: a tapering jade body with turquoise scales, a crest of long quetzal plumes along its
 * outer side sweeping back, red-and-gold ones every few, a fan of plumes at the tip (redrawn every frame; ~4k
 * vertices). pts[0] is the leading end, the last point the tip; (ox, oy) = the center it winds around.
 */
function drawTail(g: Graphics, pts: [number, number][], s: number, ox = W / 2, oy = H / 2) {
  g.clear();
  const n = pts.length;
  // the crest first (under the body), from the tip to the leading end
  for (let i = n - 1; i >= 0; i--) {
    const [x, y] = pts[i];
    const [px, py] = pts[Math.max(0, i - 1)];
    const [nx, ny] = pts[Math.min(n - 1, i + 1)];
    let bx = nx - px;
    let by = ny - py;
    const bl = Math.hypot(bx, by) || 1;
    bx /= bl;
    by /= bl;
    let qx = x - ox;
    let qy = y - oy;
    const ql = Math.hypot(qx, qy) || 1;
    qx /= ql;
    qy /= ql;
    const q = i / (n - 1);
    const rr = s * (0.4 + 0.6 * (1 - q * 0.75));
    const a = Math.atan2(qy * 0.62 + by * 0.38, qx * 0.62 + bx * 0.38);
    const accent = i % 5 === 0;
    plume(g, x, y, rr * 4.2, a + 0.12, accent ? 0xff5a4a : JADE_L, accent ? RED : JADE, GOLD, 0.1);
    if (i % 2 === 0) plume(g, x, y, rr * 3.2, a - 0.35, 0x5ae0a0, 0x177a4e, GOLD, -0.08);
  }
  // the body over it: a jade band and its scales
  const line: number[] = [];
  for (const [x, y] of pts) line.push(x, y);
  g.poly(band(line, s * 0.5, s * 0.14)).fill(JADE).stroke({ width: Math.max(2, s * 0.05), color: INK, join: 'round' });
  for (let i = 1; i < n - 1; i += 2) {
    const [x, y] = pts[i];
    const q = i / (n - 1);
    const rr = s * (0.5 - q * 0.36);
    g.poly(ngon(x, y, rr * 0.55, rr * 0.4, 8)).fill(TURQ);
    g.poly(ngon(x, y - rr * 0.1, rr * 0.25, rr * 0.16, 6)).fill(JADE_L);
  }
  // the tip: a fan of three long plumes, the middle one red and gold
  const [tx, ty] = pts[n - 1];
  const [ux, uy] = pts[Math.max(0, n - 2)];
  const ta = Math.atan2(ty - uy, tx - ux);
  for (const d of [-0.45, 0.45, 0]) plume(g, tx, ty, s * 3.4, ta + d, d ? JADE_L : 0xff5a4a, d ? JADE : RED, GOLD, d * 0.2);
}

interface St {
  tail: Graphics | null;
}
const S = stash<St>();

export const quetzalgatl: Signature = {
  dark: false,
  frame: 0x1f8a5b,
  tag: 'UNIVERSO DEL CÓDICE',
  open(c: SigCtx) {
    const k = new Container();
    const page = codexPage(W, H, 61);
    k.addChild(page);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // feathers drift over the page
    const drift = new Graphics();
    k.addChild(drift);
    const r = rnd(5);
    const fl = Array.from({ length: 12 }, () => ({ x: r() * W, y: r() * H, a: r() * TAU, s: 90 + r() * 70, v: 30 + r() * 40 }));
    const drawDrift = (t: number) => {
      drift.clear();
      for (const f of fl) {
        const x = ((f.x + t * f.v * 2) % (W + 200)) - 100;
        const y = f.y + Math.sin(t * 1.3 + f.a) * 40;
        plume(drift, x, y, f.s * 1.3, f.a + t * 0.8);
      }
    };
    drawDrift(0);
    if (!c.reduce) every(c, 30, (t) => !drift.destroyed && drawDrift(t));
    park(c, 'main', comic('¡QUE SOPLE!', JADE_L, 140));
    const st: St = { tail: null };
    S.set(c, st);
    if (c.short) return;

    // the wind turns two leaves away, leaving the pyramid page
    const leaves = [leaf(W, H, 1, 71), leaf(W, H, 0, 73)];
    for (const lf of leaves) k.addChild(lf.k);
    if (c.reduce) leaves.forEach((lf) => destroyTree(lf.k));
    else {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.2 });
      leaves.forEach((lf, i) => {
        lf.set(0);
        const p = { q: 0 };
        gsap.to(p, { q: 1, duration: 0.36 - i * 0.04, delay: i === 1 ? 0.15 : 0.55, ease: 'power2.in', onUpdate: () => !lf.k.destroyed && lf.set(p.q), onComplete: () => destroyTree(lf.k) });
      });
    }
    const fu = comic('¡FUUUSH!', TURQ, 110);
    const popFu = pre(c, fu, 1460, 250, 0.08);
    score(c, [
      [0.12, 'paper', 0.8],
      [0.15, 'whoosh', 0.7],
      [0.55, 'paper', 1.0],
      [0.58, 'whoosh', 0.9],
      [0.95, 'whoosh', 0.45],
      [1.25, 'whoosh', 0.55],
      [1.55, 'whoosh', 0.65],
      [1.9, 'charge', 1.2],
    ]);
    at(c, 0.2, () => popFu(0.6));

    // THE TAIL winds once around the whole screen (around him), feathers trailing
    const tail = new Graphics();
    c.fg.addChildAt(tail, 0);
    st.tail = tail;
    const N = 34;
    const path = (a: number): [number, number] => [W / 2 + Math.cos(a) * 760 + Math.sin(a * 3) * 40, c.catY + 40 + Math.sin(a) * 390];
    const pose = (a: number) => {
      const pts: [number, number][] = [];
      for (let i = 0; i < N; i++) pts.push(path(a - i * 0.12));
      drawTail(tail, pts, 58, W / 2, c.catY + 40);
    };
    if (c.reduce) {
      at(c, 0.9, () => {
        pose(Math.PI * 0.5);
        later(c, 0.9, () => !tail.destroyed && destroyTree(tail));
      });
    } else {
      const p = { a: -Math.PI * 1.3 };
      at(c, 0.85, () => {
        if (tail.destroyed) return;
        gsap.to(p, {
          a: -Math.PI * 1.3 + TAU + N * 0.12 + 0.6,
          duration: 1.25,
          ease: 'sine.inOut',
          onUpdate: () => !tail.destroyed && pose(p.a),
          onComplete: () => destroyTree(tail),
        });
      });
    }
    // feather whirlwinds rise at the sides
    at(c, 1.45, () => {
      if (c.reduce) return;
      for (const sx of [360, W - 360]) {
        for (let i = 0; i < 9; i++) {
          const f = new Graphics();
          plume(f, 0, 0, 110, 0, i % 3 ? JADE_L : 0xff5a4a, i % 3 ? JADE : RED);
          f.position.set(sx, 900);
          c.fg.addChild(f);
          const p = { q: 0 };
          const a0 = (i / 9) * TAU;
          gsap.to(p, {
            q: 1,
            duration: 0.9,
            delay: i * 0.03,
            ease: 'power1.out',
            onUpdate: () => {
              if (f.destroyed) return;
              const a = a0 + p.q * 9;
              f.position.set(sx + Math.cos(a) * (30 + p.q * 120), 900 - p.q * 620 + Math.sin(a) * 30);
              f.rotation = a;
            },
            onComplete: () => destroyTree(f),
          });
        }
      }
    });
    // a wind scroll puffs out of his mouth
    at(c, 1.9, () => {
      const [mx, my] = onCat(c, MOUTH[0], MOUTH[1]);
      const v = volute(new Graphics(), 0, 0, 110, 0, 0x7ad0e0, INK, 1);
      v.position.set(mx + 90, my - 10);
      c.fg.addChild(v);
      if (!c.reduce) {
        gsap.fromTo(v.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' });
        gsap.to(v, { x: v.x + 80, rotation: 0.5, duration: 0.5 });
      }
      gsap.to(v, { alpha: 0, delay: 0.45, duration: 0.25, onComplete: () => destroyTree(v) });
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    if (st?.tail && !st.tail.destroyed) destroyTree(st.tail);
    sfx('whoosh', 0.6);
    sfx('charge', 1.4);
    later(c, 0.1, () => sfx('sting', 1.2));
    c.shaker.add(0.25);
    // the tail loops once behind him (fast), then settles into a ring of feathers
    const ring = new Graphics();
    c.behind.addChild(ring);
    const N = 30;
    const loop = (a: number, R: number) => {
      const pts: [number, number][] = [];
      for (let i = 0; i < N; i++) {
        const b = a - i * 0.21;
        pts.push([W / 2 + Math.cos(b) * R, c.catY + 20 + Math.sin(b) * R * 0.92]);
      }
      drawTail(ring, pts, 46, W / 2, c.catY + 20);
    };
    if (c.reduce) loop(Math.PI * 1.5, 330);
    else {
      const p = { a: 0 };
      gsap.to(p, { a: TAU * 1.25, duration: 0.8, ease: 'power3.out', onUpdate: () => !ring.destroyed && loop(Math.PI * 0.5 + p.a, 330) });
      every(c, 30, (t) => {
        if (ring.destroyed || t < 0.8) return;
        loop(Math.PI * 0.5 + TAU * 1.25 + (t - 0.8) * 0.6, 330 + Math.sin(t * 2) * 6);
      });
    }
    // feathers burst out; wind scrolls puff
    burst(
      c,
      c.fg,
      (i) => {
        const g = new Graphics();
        plume(g, 0, 0, 100 + (i % 3) * 24, (i / 22) * TAU, i % 4 ? JADE_L : 0xff5a4a, i % 4 ? JADE : RED);
        return g;
      },
      22,
      W / 2,
      c.catY - 40,
      860,
      1.4,
    );
    for (let i = 0; i < 4; i++)
      later(c, c.reduce ? 0 : 0.15 + i * 0.18, () => {
        const v = volute(new Graphics(), 0, 0, 80 + i * 14, i, 0x7ad0e0, INK, i % 2 ? 1 : -1);
        v.position.set(W / 2 + (i % 2 ? 380 : -380), c.catY - 220 + i * 60);
        c.fg.addChild(v);
        if (!c.reduce) gsap.fromTo(v.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' });
        gsap.to(v, { alpha: 0, delay: 1.2, duration: 0.3, onComplete: () => destroyTree(v) });
      });
    const main = take(c, 'main', () => comic('¡QUE SOPLE!', JADE_L, 140));
    payline(c, main, '…y a favor, para variar.', { maxW: 640, dur: 2.5, asideStyle: { fill: 0xfff2c8 } });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    k.addChild(codexPage(w, h, 63));
    const u = h / 1080;
    const drift = new Graphics();
    k.addChild(drift);
    const r = rnd(9);
    const n = Math.max(4, Math.round((w / h) * 4));
    const fl = Array.from({ length: n }, (_, i) => ({ x: ((i + 0.5) / n) * w, y: h * (0.25 + r() * 0.4), a: r() * TAU, s: (110 + r() * 80) * u }));
    const draw = (t: number) => {
      drift.clear();
      for (const f of fl) {
        const x = ((f.x + t * 40 * u + w * 0.1) % (w * 1.1)) - w * 0.05;
        plume(drift, x, f.y + Math.sin(t * 1.2 + f.a) * 30 * u, f.s * 1.3, f.a + t * 0.6);
      }
    };
    draw(0);
    if (live) cardLoop(k, 30, draw);
    return k;
  },
};
