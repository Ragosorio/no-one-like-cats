/**
 * Luna Lovegata: the upside-down universe (the dreamy wizard-school girl who sees what nobody sees). A night forest by a
 * still lake under a huge pale moon — and the whole world turns over (¡VUELTA!): the trees hang from the top, the lake
 * is a sky, the moon is down by her feet. (With Reducir movimiento the forest simply arrives already upside down.) Her
 * spiral spectacles glide across the screen like a magnifying glass, and inside the lenses the invisible creatures
 * show up in color — moon moths, an air jellyfish trailing its veils, little buzzing coils — while outside them they are
 * only faint glowing outlines. «¡AHÍ ESTÁN!» Her radish earrings float off on their own; a magazine flutters past, its
 * title upside down. Payoff: every creature lights up at once; ¡ESTÁ AL REVÉS! …o tú estás al revés.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, every, flashOf, later, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, floatWord, pay, say } from './kitC';
import { aside, bandPts, hsv, ngon, onCat, rnd, starfield, twinkle } from './kitD';
import { strip } from './kitH';
import { liveLoop } from '../../../panels/collection/cardArt';

const NIGHT = 0x0e1a2c;
const TEAL = 0x1e4a5a;
const TREE = 0x0b2a32;
const TREE_B = 0x123a44;
const MINT = 0x7fd1c7;
const PINK = 0xd96c9e;
const PALE = 0xf2e6a6;
const LILAC = 0xb7a4f0;

/** the forest by the lake, drawn upright (one Graphics, w×h, k scale, cx center); it's the world that turns over */
function forest(g: Graphics, w: number, h: number, k: number, cx: number) {
  const hz = h * 0.6;
  vgrad(g, 0, 0, w, hz, [0x0a1424, NIGHT, TEAL], 10);
  starfield(g, 0, 0, w, hz * 0.8, Math.round(140 * (w / 1920)), 3, 0xfff6d8, 2.4 * k);
  // the moon
  for (let i = 5; i >= 1; i--) g.poly(ngon(cx + 520 * k, 200 * k, 90 * k + i * 26 * k, 90 * k + i * 26 * k, 24)).fill({ color: PALE, alpha: 0.05 });
  g.poly(ngon(cx + 520 * k, 200 * k, 96 * k, 96 * k, 28)).fill(PALE);
  g.poly(ngon(cx + 490 * k, 180 * k, 18 * k, 14 * k, 10)).fill({ color: 0xd9cc8a, alpha: 0.6 }).poly(ngon(cx + 548 * k, 230 * k, 12 * k, 10 * k, 10)).fill({ color: 0xd9cc8a, alpha: 0.6 });
  // far hills, then two rows of trees (rounded and pointy, alternating)
  g.poly([0, hz, 0, hz - 120 * k, w * 0.25, hz - 190 * k, w * 0.5, hz - 130 * k, w * 0.75, hz - 200 * k, w, hz - 110 * k, w, hz]).fill(0x16323e);
  const r = rnd(5);
  for (const [row, col, base] of [
    [0, TREE_B, hz - 30 * k],
    [1, TREE, hz + 10 * k],
  ] as const) {
    for (let x = -60 * k; x < w + 100 * k; x += (80 + r() * 90) * k) {
      const th = (220 + r() * 200) * k * (row ? 1.1 : 0.8);
      if (r() < 0.5) {
        g.poly([x - 60 * k, base, x, base - th, x + 60 * k, base]).fill(col);
        g.poly([x - 48 * k, base - th * 0.35, x, base - th * 1.05, x + 48 * k, base - th * 0.35]).fill(col);
      } else {
        g.rect(x - 8 * k, base - th * 0.5, 16 * k, th * 0.5).fill(col);
        g.poly(ngon(x, base - th * 0.66, 70 * k, th * 0.36, 12)).fill(col);
      }
    }
  }
  // the lake, with the moon's road
  g.rect(0, hz, w, h - hz).fill(0x0c2230);
  for (let i = 0; i < 9; i++) {
    const y = hz + 20 * k + i * 30 * k;
    g.rect(cx + 520 * k - (60 - i * 4) * k, y, (120 - i * 8) * k, 6 * k).fill({ color: PALE, alpha: 0.5 - i * 0.04 });
  }
  for (let i = 0; i < 6; i++) g.rect(0, hz + 40 * k + i * 60 * k, w, 2 * k).fill({ color: MINT, alpha: 0.12 });
  // glowing mushrooms on the shore
  for (let i = 0; i < 9; i++) {
    const x = (i / 9) * w + r() * 80 * k;
    const y = hz + 16 * k + r() * 30 * k;
    g.rect(x - 4 * k, y - 26 * k, 8 * k, 26 * k).fill(0xd9e8e0);
    g.poly(ngon(x, y - 26 * k, 22 * k, 12 * k, 10)).fill(i % 2 ? PINK : MINT);
    g.poly(ngon(x, y - 26 * k, 40 * k, 24 * k, 10)).fill({ color: i % 2 ? PINK : MINT, alpha: 0.15 });
  }
}

/** an invented creature: kind 0 moon moth, 1 air jellyfish, 2 buzzing coil; `mode` fill (seen) or outline (ghost) */
function creature(g: Graphics, kind: number, x: number, y: number, s: number, t: number, mode: 'fill' | 'ghost', col: number) {
  const out = mode === 'ghost';
  const paint = (pts: number[], fill: number, a = 1) => {
    if (out) g.poly(pts).stroke({ width: 2.5, color: col, alpha: 0.55 * a });
    else g.poly(pts).fill({ color: fill, alpha: a });
  };
  if (kind === 0) {
    const f = Math.sin(t * 16 + x) * 0.35;
    paint(ngon(x - 30 * s, y - 8 * s, 32 * s, 22 * s * (1 + f), 10, -0.5), col, 0.85);
    paint(ngon(x + 30 * s, y - 8 * s, 32 * s, 22 * s * (1 + f), 10, 0.5), col, 0.85);
    paint(ngon(x - 20 * s, y + 14 * s, 18 * s, 12 * s, 8, 0.6), LILAC, 0.8);
    paint(ngon(x + 20 * s, y + 14 * s, 18 * s, 12 * s, 8, -0.6), LILAC, 0.8);
    paint(ngon(x, y, 12 * s, 24 * s, 10), 0xfff6e8);
    if (!out) {
      g.poly(ngon(x - 4 * s, y - 10 * s, 2.5 * s, 2.5 * s, 6)).fill(C.ink).poly(ngon(x + 4 * s, y - 10 * s, 2.5 * s, 2.5 * s, 6)).fill(C.ink);
      g.poly(strip([x - 3 * s, y - 22 * s, x - 10 * s, y - 38 * s, x - 18 * s, y - 40 * s], 1.2 * s)).fill(0xfff6e8);
      g.poly(strip([x + 3 * s, y - 22 * s, x + 10 * s, y - 38 * s, x + 18 * s, y - 40 * s], 1.2 * s)).fill(0xfff6e8);
    }
  } else if (kind === 1) {
    // the bell (a dome) and five trailing veils
    const bell: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      bell.push(x + Math.cos(a) * 70 * s, y + Math.sin(a) * 56 * s);
    }
    for (let i = 0; i <= 6; i++) bell.push(x + 70 * s - (i / 6) * 140 * s, y + (i % 2 ? 10 : 0) * s);
    for (let v = 0; v < 5; v++) {
      const vx = x - 50 * s + v * 25 * s;
      const pts: number[] = [];
      for (let j = 0; j <= 6; j++) pts.push(vx + Math.sin(t * 3 + j * 0.9 + v) * 12 * s, y + 8 * s + j * 30 * s);
      if (out) g.poly(pts, false).stroke({ width: 2.5, color: col, alpha: 0.45 });
      else g.poly(strip(pts, 4 * s)).fill({ color: v % 2 ? PINK : LILAC, alpha: 0.7 });
    }
    paint(bell, col, 0.85);
    if (!out) {
      g.poly(ngon(x - 22 * s, y - 24 * s, 16 * s, 8 * s, 8, -0.3)).fill({ color: 0xffffff, alpha: 0.5 });
      g.poly(ngon(x - 16 * s, y - 6 * s, 4 * s, 4 * s, 6)).fill(C.ink).poly(ngon(x + 16 * s, y - 6 * s, 4 * s, 4 * s, 6)).fill(C.ink);
    }
  } else {
    // a little coil that buzzes in place
    const pts: number[] = [];
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI * 4 + t * 10;
      const rr = (6 + i * 1.3) * s;
      pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7);
    }
    if (out) g.poly(pts, false).stroke({ width: 2.5, color: col, alpha: 0.5 });
    else {
      g.poly(strip(pts, 3 * s)).fill(col);
      g.poly(ngon(x, y, 8 * s, 8 * s, 8)).fill(0xfff6e8);
      g.poly(ngon(x + 2 * s, y - 1 * s, 2.5 * s, 2.5 * s, 6)).fill(C.ink);
    }
  }
}

/** the herd (seeded spots in a w×h box): kind, home, drift, scale, color */
interface Beast {
  kind: number;
  x: number;
  y: number;
  s: number;
  col: number;
  ph: number;
}
function herd(w: number, h: number, k: number, seed: number, n: number): Beast[] {
  const r = rnd(seed);
  const out: Beast[] = [];
  for (let i = 0; i < n; i++) {
    const kind = i % 5 === 0 ? 1 : i % 2 ? 0 : 2;
    out.push({ kind, x: ((i + r() * 0.8) / n) * w, y: 130 * k + r() * h * 0.6, s: (kind === 1 ? 1.1 : 1.1 + r() * 0.7) * k, col: [MINT, PINK, PALE, LILAC][i % 4], ph: r() * 6 });
  }
  return out;
}
function drawHerd(seen: Graphics, ghost: Graphics | null, bs: Beast[], t: number) {
  seen.clear();
  ghost?.clear();
  for (const b of bs) {
    const x = b.x + Math.sin(t * 0.7 + b.ph) * 40 * b.s;
    const y = b.y + Math.cos(t * 0.9 + b.ph) * 26 * b.s;
    creature(seen, b.kind, x, y, b.s, t, 'fill', b.col);
    if (ghost) creature(ghost, b.kind, x, y, b.s, t, 'ghost', b.col);
  }
}

/** the spiral spectacles (origin between the lenses): two big lenses with a rainbow swirl, pink frames, a bridge */
function drawSpecs(g: Graphics, R: number, t: number) {
  g.clear();
  for (const sd of [-1, 1]) {
    const x = sd * R * 1.08;
    g.poly(ngon(x, 0, R, R, 28)).fill({ color: PALE, alpha: 0.14 });
    for (let i = 0; i < 12; i++) {
      const a0 = t * 2.2 * sd + (i / 12) * Math.PI * 2;
      for (let j = 0; j < 4; j++) g.poly(bandPts(x, 0, R * (0.12 + j * 0.22), R * (0.22 + j * 0.22), a0 + j * 0.5, a0 + j * 0.5 + 0.42, 3)).fill({ color: hsv(i / 12 + j * 0.1), alpha: 0.2 });
    }
    g.poly(bandPts(x, 0, R, R * 1.12, 0, Math.PI * 2, 28)).fill(PINK);
    g.poly(bandPts(x, 0, R * 1.12, R * 1.17, 0, Math.PI * 2, 28)).fill(C.ink);
  }
  g.poly(strip([-R * 0.2, -R * 0.1, 0, -R * 0.28, R * 0.2, -R * 0.1], R * 0.05)).fill(PINK);
}

/** a radish earring: a magenta bulb, its root and three leaves (origin at the stalk) */
function radish(s: number) {
  const g = new Graphics();
  g.poly([0, 14 * s, 10 * s, 22 * s, 4 * s, 40 * s, 0, 52 * s, -4 * s, 40 * s, -10 * s, 22 * s]).fill(0xd93a6a).stroke({ width: 2 * s, color: C.ink });
  g.poly(ngon(0, 26 * s, 13 * s, 14 * s, 10)).fill(0xd93a6a).stroke({ width: 2 * s, color: C.ink });
  g.poly(ngon(-4 * s, 22 * s, 3 * s, 5 * s, 6)).fill({ color: 0xffffff, alpha: 0.6 });
  for (const a of [-0.6, 0, 0.6]) g.poly(ngon(Math.sin(a) * 10 * s, 4 * s - Math.cos(a) * 10 * s, 5 * s, 11 * s, 7, a)).fill(0x4aa84a);
  return g;
}

/** the magazine, title upside down */
function magazine(): Container {
  const k = new Container();
  const g = new Graphics();
  g.rect(-90, -120, 180, 240).fill(0xfff2c4).stroke({ width: 4, color: C.ink });
  g.poly(ngon(-20, 30, 50, 50, 14)).fill(PINK).poly(ngon(30, 60, 30, 30, 12)).fill(MINT).rect(-70, 80, 140, 16).fill(0x5a3a7a);
  const t = txt('LA GACETA\nAL REVÉS', { fontFamily: F.heavy, fontSize: 24, fill: 0x5a3a7a, align: 'center', lineHeight: 26 });
  t.anchor.set(0.5);
  t.rotation = Math.PI;
  t.position.set(0, -80);
  k.addChild(g, t);
  return k;
}

interface St {
  seen: Graphics;
  lensMask: Graphics;
  world: Container;
  lens: Container;
  reveal: { v: number };
}
const S = stash<St>();
const R = 150;

export const lunalovegata: Signature = {
  dark: true,
  frame: PALE,
  tag: 'UNIVERSO AL REVÉS',
  open(c: SigCtx) {
    const k = new Container();
    const world = new Container();
    const fg = new Graphics();
    forest(fg, W, H, 1, W / 2);
    world.addChild(fg);
    world.pivot.set(W / 2, H / 2);
    world.position.set(W / 2, H / 2);
    // the creatures live in screen space (they don't turn with the world)
    const herdC = new Container();
    const ghost = new Graphics();
    const seen = new Graphics();
    const lensMask = new Graphics();
    seen.mask = lensMask;
    herdC.addChild(ghost, seen, lensMask);
    const lens = new Container();
    const specs = new Graphics();
    lens.addChild(specs);
    lens.position.set(-500, 360);
    k.addChild(world, herdC, lens);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    // a soft moonlight behind her
    const halo = new Graphics();
    for (let i = 7; i >= 1; i--) halo.poly(ngon(W / 2, c.catY, 50 * i, 60 * i, 20)).fill({ color: MINT, alpha: 0.03 });
    k.addChildAt(halo, 1);
    const beasts = herd(W, H, 1, 77, 18);
    const reveal = { v: c.short ? 1 : 0 };
    const glow = { v: c.short ? 1 : 0.4 };
    S.set(c, { seen, lensMask, world, lens, reveal });
    if (c.short || c.reduce) world.rotation = Math.PI;
    if (c.short) {
      seen.mask = null;
      lensMask.visible = false;
      lens.visible = false;
    }
    const frame = (t: number) => {
      if (seen.destroyed) return;
      drawHerd(seen, ghost, beasts, t);
      ghost.alpha = glow.v;
      drawSpecs(specs, R, c.reduce ? 0 : t);
      if (!lensMask.destroyed && seen.mask) {
        lensMask.clear();
        for (const sd of [-1, 1]) lensMask.poly(ngon(lens.x + sd * R * 1.08, lens.y, R * lens.scale.x, R * lens.scale.y, 24)).fill(0xffffff);
      }
    };
    frame(0);
    // Reducir movimiento: no motion, but the state changes (a cut, a light, a flip) still land: redraw still frames
    every(c, c.reduce ? 4 : 30, (t) => frame(c.reduce ? 0 : t));
    if (c.short) return;

    // the world turns over
    score(c, [
      [0.05, 'whoosh', 0.8],
      [0.28, 'whoosh', 0.6],
    ]);
    beat(c, 0.25, () => {
      sfx('glitch', 1.4);
      c.shaker.add(0.12);
      if (c.reduce) world.rotation = Math.PI;
      else gsap.to(world, { rotation: Math.PI, duration: 0.5, ease: 'back.inOut(1.4)' });
      word(c, 420, 280, '¡VUELTA!', PALE, 110, 0.8);
    });
    // the spectacles glide in from the left, stop by her, then sweep across her to the right
    const ly = 380;
    beat(c, 0.7, () => {
      sfx('gem', 1.2);
      if (c.reduce) {
        lens.position.set(560, ly);
        later(c, 0.6, () => !lens.destroyed && lens.position.set(W - 520, ly + 60));
      } else {
        gsap.to(lens, { x: 560, duration: 0.4, ease: 'power3.out' });
        gsap.to(lens, { x: W - 520, y: ly + 60, duration: 0.7, delay: 0.6, ease: 'sine.inOut' });
      }
    });
    beat(c, 1.0, () => {
      sfx('meow', 1.5);
      say(c, c.fg, W / 2 + 330, 200, '¡AHÍ ESTÁN!', 0.65, { size: 46, tail: 'left', fill: PALE });
    });
    // the outlines brighten in a wave; little buzzes
    beat(c, 1.25, () => {
      if (c.reduce) glow.v = 1;
      else gsap.to(glow, { v: 1, duration: 0.4 });
      for (let i = 0; i < 3; i++) floatWord(c, c.fg, 260 + i * 640, 640 - i * 130, 'bzzz', { fontFamily: F.comic, fontSize: 40, fill: MINT, stroke: { color: C.ink, width: 6, join: 'round' } }, 40, 0.8);
      sfx('zap', 2.2);
    });
    // her radish earrings float off on their own, and back
    beat(c, 1.35, () => {
      for (const [fx, fy, d] of [
        [0.37, 0.31, -1],
        [0.74, 0.36, 1],
      ] as const) {
        const [x, y] = onCat(c, fx, fy);
        const rd = radish(2.2);
        rd.position.set(x, y);
        c.fg.addChild(rd);
        if (!c.reduce) {
          gsap.to(rd, { x: x + d * 90, y: y - 120, rotation: d * 2.5, duration: 0.5, ease: 'sine.out', yoyo: true, repeat: 1 });
        }
        fadeKill(rd, 1.0, 0.2);
      }
      sfx('pop', 1.6);
    });
    // the magazine flutters past, its title upside down
    beat(c, 1.45, () => {
      const mg = magazine();
      mg.position.set(-120, 780);
      mg.rotation = 0.3;
      c.fg.addChild(mg);
      sfx('paper', 1);
      if (c.reduce) mg.position.set(300, 760);
      else gsap.to(mg, { x: 520, y: 700, rotation: -0.4, duration: 0.7, ease: 'sine.out' });
      fadeKill(mg, 0.75, 0.2);
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.05);
    sfx('gem', 1.4);
    c.shaker.add(0.25);
    flashOf(c, PALE, 0.5, 0.35);
    if (st) {
      st.world.rotation = Math.PI;
      // every creature lights up: no more lenses
      if (!st.seen.destroyed) st.seen.mask = null;
      // a mask that stops masking would draw itself: its white lenses must go too
      if (!st.lensMask.destroyed) st.lensMask.visible = false;
      if (!st.lens.destroyed) gsap.to(st.lens, { alpha: 0, duration: c.reduce ? 0 : 0.25 });
    }
    burst(c, c.fg, (i) => new Graphics().poly(twinkle(0, 0, 20)).fill([MINT, PINK, PALE, LILAC][i % 4]), 26, W / 2, c.catY - 60, 820, 1.4);
    cheer(c, '¡ESTÁ AL REVÉS!', MINT, 140, 2.0);
    aside(c, '…o tú estás al revés.', PALE, { delay: 0.6, dur: 2.2 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const world = new Graphics();
    forest(world, w, h, s * 1.05, w / 2);
    const wc = new Container();
    wc.addChild(world);
    wc.pivot.set(w / 2, h / 2);
    wc.position.set(w / 2, h / 2);
    wc.rotation = Math.PI;
    const beasts = herd(w, h, s * 1.05, 31, Math.max(6, Math.min(40, Math.round((w / m) * 10))));
    const ghost = new Graphics();
    const seen = new Graphics();
    const mask = new Graphics();
    seen.mask = mask;
    const specs = new Graphics();
    const RR = 140 * s;
    k.addChild(wc, ghost, seen, mask, specs);
    const draw = (t: number) => {
      drawHerd(seen, ghost, beasts, t);
      ghost.alpha = 0.7;
      const x = w / 2 - m * 0.42 + Math.sin(t * 0.4) * Math.min(w * 0.3, m * 0.9) * (live ? 1 : 0);
      const y = h * 0.3 + Math.cos(t * 0.5) * m * 0.06;
      specs.position.set(x, y);
      drawSpecs(specs, RR, t);
      mask.clear();
      for (const sd of [-1, 1]) mask.poly(ngon(x + sd * RR * 1.08, y, RR, RR, 22)).fill(0xffffff);
    };
    draw(0);
    if (live) liveLoop(k, (t) => draw(t));
    return k;
  },
};

