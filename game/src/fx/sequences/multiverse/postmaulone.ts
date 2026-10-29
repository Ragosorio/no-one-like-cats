/**
 * Post Maulone: the chill universe (the laid-back singer of every genre, as a cat; no lyrics, no likeness). A warm
 * sunset on a wooden terrace over a sunflower field: the sun sits huge and low right behind him, string lights glow on
 * their wire, a campfire crackles (CRIC… CRAC), a folding chair and a cooler of ice wait on the deck. «Ahhh…». He strums
 * — TRRANG~ — and soft rings roll out of the guitar while chalky doodles (stars, little suns, hearts, notes, sunflowers)
 * slip off into the air around him. Someone off-screen panics: «¡SE HUNDE EL BARCO!» — «relax…».
 * Payoff: one icy strum: a frost ring, snowflakes, the doodles burst out, the bulbs flare; ¡TRANQUI! …ahorita flota.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, every, flashOf, score } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, floatWord, pay, say } from './kitC';
import { aside, bandPts, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { catenary, heartPts, star5, stringLights } from './kitH';
import { liveLoop } from '../../../panels/collection/cardArt';

const SUN = 0xf2c14e;
const TEAL = 0x7fd1c7;
const WOOD = 0x9a6a3e;
const WOOD_D = 0x6a4424;
const PETAL = 0xf6c63a;
const SEED = 0x5b3a2a;
const CHALK = 0xfff6e0;
const WARM = [0xffd27a, 0xffb85a, 0xfff0c0, 0xff9a6a];
const FROST = 0xcff4ff;

/** the sunset, the field, the terrace (one Graphics, w×h, scale k, centered on cx); returns the sun's center */
function terrace(g: Graphics, w: number, h: number, k: number, cx: number, lite = false): [number, number] {
  const hz = h * 0.58;
  vgrad(g, 0, 0, w, hz, [0x6a5aa8, 0xc87aa0, 0xf29a6a, 0xffc87a], 14);
  // the sun, low and huge, with soft rings
  const sx = cx;
  const sy = hz - 120 * k;
  for (let i = 6; i >= 1; i--) g.poly(ngon(sx, sy, 250 * k + i * 40 * k, 250 * k + i * 40 * k, 30)).fill({ color: 0xfff0b0, alpha: 0.07 });
  g.poly(ngon(sx, sy, 250 * k, 250 * k, 36)).fill(0xffe08a);
  for (let i = 0; i < 4; i++) g.rect(sx - 260 * k, sy + 60 * k + i * 40 * k, 520 * k, (6 + i * 3) * k).fill({ color: 0xf29a6a, alpha: 0.6 });
  // long thin clouds
  for (const [x, y, l] of [
    [-620, 140, 380],
    [520, 90, 300],
    [-300, 60, 220],
  ] as const)
    g.poly(ngon(cx + x * k, y * k, l * k, 14 * k, 16)).fill({ color: 0xffd0b0, alpha: 0.7 });
  // hills, then the sunflower field in three rows (small far, big near)
  g.poly([0, hz, 0, hz - 60 * k, w * 0.3, hz - 110 * k, w * 0.6, hz - 70 * k, w, hz - 120 * k, w, hz]).fill(0x8a6a8a);
  g.rect(0, hz, w, h - hz).fill(0x5a7a3a);
  const r = rnd(12);
  for (const [row, n, sz, y0] of [
    [0, 44, 14, hz + 14 * k],
    [1, 30, 24, hz + 56 * k],
    [2, 18, 40, hz + 120 * k],
  ] as const) {
    // a tiny card (the Catdex grid draws up to 155): a third of the flowers
    const step = w / (lite ? Math.ceil(n / 3) : n);
    for (let i = 0; i < w / step + 1; i++) {
      const x = i * step + (row % 2) * step * 0.5 + (r() - 0.5) * step * 0.3;
      const y = y0 + (r() - 0.5) * 10 * k;
      const s = sz * k * (0.85 + r() * 0.3);
      g.poly(streak(x, y + s * 3, x, y, s * 0.12, s * 0.1)).fill(0x3a5a22);
      if (row > 0) g.poly(ngon(x + s * 0.5, y + s * 1.6, s * 0.5, s * 0.22, 8, -0.5)).fill(0x4a6a2a);
      g.poly(star5(x, y, s, 0.55, r() * 2)).fill(PETAL);
      g.poly(star5(x, y, s * 0.92, 0.6, r() * 2 + 0.6)).fill(0xffd84a);
      g.poly(ngon(x, y, s * 0.42, s * 0.42, 10)).fill(SEED);
    }
  }
  // the terrace: a railing, the deck in planks
  const deck = h * 0.73;
  g.rect(0, deck - 110 * k, w, 14 * k).fill(WOOD_D);
  for (let x = 30 * k; x < w; x += 140 * k) g.rect(x, deck - 110 * k, 14 * k, 110 * k).fill(WOOD_D);
  g.rect(0, deck - 60 * k, w, 8 * k).fill(WOOD_D);
  g.rect(0, deck, w, h - deck).fill(WOOD);
  for (let i = 0; i < 8; i++) {
    const u = Math.pow(i / 8, 1.4);
    g.rect(0, deck + (h - deck) * u, w, 3 * k).fill(WOOD_D);
  }
  // the string-light posts
  for (const x of [60 * k, w - 60 * k]) g.rect(x - 10 * k, 90 * k, 20 * k, deck - 90 * k + 30 * k).fill(WOOD_D);
  return [sx, sy];
}

/** the folding chair and the cooler (one Graphics; origin at the deck), on the right */
function props(g: Graphics, x: number, y: number, k: number) {
  // the chair: X legs, a teal canvas seat and back
  g.poly(streak(x - 70 * k, y, x + 60 * k, y - 120 * k, 5 * k, 5 * k)).fill(0x5a5a62);
  g.poly(streak(x + 70 * k, y, x - 60 * k, y - 120 * k, 5 * k, 5 * k)).fill(0x5a5a62);
  g.poly([x - 80 * k, y - 120 * k, x + 80 * k, y - 120 * k, x + 70 * k, y - 96 * k, x - 70 * k, y - 96 * k]).fill(TEAL);
  g.poly([x - 70 * k, y - 120 * k, x - 80 * k, y - 250 * k, x + 80 * k, y - 250 * k, x + 70 * k, y - 120 * k]).fill(0x5ab8ae);
  for (let i = 0; i < 4; i++) g.rect(x - 76 * k, y - 230 * k + i * 30 * k, 152 * k, 8 * k).fill({ color: 0xffffff, alpha: 0.35 });
  // the cooler, open, ice and a plain glass bottle
  const cx = x + 210 * k;
  g.rect(cx - 70 * k, y - 90 * k, 140 * k, 90 * k).fill(0x3a8ac8).stroke({ width: 4 * k, color: C.ink });
  g.rect(cx - 74 * k, y - 104 * k, 148 * k, 18 * k).fill(0xffffff).stroke({ width: 3 * k, color: C.ink });
  for (let i = 0; i < 5; i++) g.poly(ngon(cx - 50 * k + i * 25 * k, y - 104 * k, 14 * k, 12 * k, 4, i)).fill({ color: FROST, alpha: 0.95 }).stroke({ width: 2 * k, color: 0x8ab8d0 });
  g.poly([cx + 10 * k, y - 104 * k, cx + 10 * k, y - 160 * k, cx + 18 * k, y - 180 * k, cx + 26 * k, y - 160 * k, cx + 26 * k, y - 104 * k]).fill({ color: 0x6ab86a, alpha: 0.85 });
}

/** the campfire (origin at its base): stones, logs (static) + flames and sparks (redrawn with t) */
function fireBase(g: Graphics, x: number, y: number, k: number) {
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    g.poly(ngon(x + Math.cos(a) * 80 * k, y + Math.sin(a) * -22 * k + 6 * k, 22 * k, 16 * k, 8)).fill(0x6a6a72).stroke({ width: 3 * k, color: 0x3a3a42 });
  }
  g.poly(streak(x - 70 * k, y, x + 60 * k, y - 30 * k, 12 * k, 12 * k)).fill(0x6a4424);
  g.poly(streak(x + 70 * k, y, x - 60 * k, y - 30 * k, 12 * k, 12 * k)).fill(0x5a3a1a);
}
function drawFire(g: Graphics, x: number, y: number, k: number, t: number, hot = 1) {
  g.clear();
  for (let i = 4; i >= 1; i--) g.poly(ngon(x, y - 60 * k, 70 * k * i * 0.5 * hot, 60 * k * i * 0.5 * hot, 12)).fill({ color: 0xffb85a, alpha: 0.06 });
  const f = (s: number, col: number, ph: number) => {
    const w = 60 * k * s;
    const hh = 150 * k * s * hot * (1 + 0.12 * Math.sin(t * 13 + ph));
    const sw = Math.sin(t * 9 + ph) * 14 * k;
    g.poly([x - w, y - 10 * k, x - w * 0.5 + sw * 0.3, y - hh * 0.5, x + sw, y - hh, x + w * 0.5 + sw * 0.3, y - hh * 0.55, x + w, y - 10 * k]).fill(col);
  };
  f(1, 0xff6a2a, 0);
  f(0.72, 0xffa83a, 1.3);
  f(0.42, 0xfff0a0, 2.4);
  const r = rnd(Math.floor(t * 8));
  for (let i = 0; i < 6; i++) {
    const q = (t * 1.6 + i / 6) % 1;
    g.poly(ngon(x + (r() - 0.5) * 80 * k + Math.sin(t * 3 + i) * 20 * k, y - 80 * k - q * 260 * k, 3 * k, 3 * k, 5)).fill({ color: 0xffd27a, alpha: 1 - q });
  }
}

/** a chalky doodle (outline only): 0 star, 1 little sun, 2 heart, 3 note, 4 sunflower */
function doodle(i: number, s = 1, col = CHALK) {
  const g = new Graphics();
  const ln = { width: 4 * s, color: col, join: 'round' as const, cap: 'round' as const };
  const kind = i % 5;
  if (kind === 0) g.poly(star5(0, 0, 26 * s)).stroke(ln);
  else if (kind === 1) {
    g.poly(ngon(0, 0, 14 * s, 14 * s, 12)).stroke(ln);
    for (let j = 0; j < 8; j++) {
      const a = (j / 8) * Math.PI * 2;
      g.poly(streak(Math.cos(a) * 22 * s, Math.sin(a) * 22 * s, Math.cos(a) * 32 * s, Math.sin(a) * 32 * s, 2 * s, 2 * s)).fill(col);
    }
  } else if (kind === 2) g.poly(heartPts(0, 0, 24 * s, 8)).stroke(ln);
  else if (kind === 3) {
    g.poly(ngon(-6 * s, 16 * s, 10 * s, 7 * s, 10, -0.4)).stroke(ln);
    g.poly(streak(3 * s, 14 * s, 3 * s, -24 * s, 2 * s, 2 * s)).fill(col).poly(streak(3 * s, -24 * s, 18 * s, -12 * s, 2 * s, 2 * s)).fill(col);
  } else {
    g.poly(ngon(0, 0, 9 * s, 9 * s, 10)).stroke(ln);
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * Math.PI * 2;
      g.poly(ngon(Math.cos(a) * 18 * s, Math.sin(a) * 18 * s, 8 * s, 4 * s, 6, a)).stroke({ ...ln, width: 3 * s });
    }
  }
  return g;
}

/** a snowflake (six thin arms) */
function flake(s = 1) {
  const g = new Graphics();
  for (let j = 0; j < 6; j++) {
    const a = (j / 6) * Math.PI;
    g.poly(streak(Math.cos(a) * -20 * s, Math.sin(a) * -20 * s, Math.cos(a) * 20 * s, Math.sin(a) * 20 * s, 2.2 * s, 2.2 * s)).fill(FROST);
  }
  return g;
}

interface St {
  flare: { v: number };
  fx: Container;
}
const S = stash<St>();

export const postmaulone: Signature = {
  dark: false,
  frame: SUN,
  tag: 'UNIVERSO RELAX',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    terrace(g, W, H, 1, W / 2);
    const deck = H * 0.73;
    const pg = new Graphics();
    props(pg, W - 470, deck + 120, 1);
    fireBase(pg, 330, deck + 150, 1);
    const fire = new Graphics();
    const lights = new Graphics();
    const wire = catenary(60, 110, W - 60, 120, 120, 24);
    const fx = new Container();
    k.addChild(g, pg, fire, lights, fx);
    c.back.addChild(k);
    arrive(c, k, 0.3);
    hideDisc(c, 0.25);
    const flare = { v: c.short ? 1 : 0.6 };
    S.set(c, { flare, fx });
    const frame = (t: number) => {
      if (fire.destroyed) return;
      drawFire(fire, 330, deck + 150, 1, t);
      lights.clear();
      stringLights(lights, wire, 22, WARM, (i) => flare.v * (0.75 + 0.25 * Math.sin(t * 2.5 + i * 1.3)), { r: 14, wireW: 2 });
    };
    frame(0);
    // Reducir movimiento: no motion, but the state changes (a cut, a light, a flip) still land: redraw still frames
    every(c, c.reduce ? 4 : 30, (t) => frame(c.reduce ? 0 : t));
    if (c.short) return;

    // Ahhh…
    score(c, [
      [0.02, 'purr', 1],
      [0.1, 'whoosh', 0.5],
    ]);
    beat(c, 0.15, () => floatWord(c, c.fg, W / 2 - 420, 300, 'Ahhh…', { fontFamily: F.brush, fontSize: 64, fill: CHALK, stroke: { color: C.ink, width: 8, join: 'round' } }, 40, 1.1));
    // three lazy strums: soft rings out of the guitar, TRRANG~
    const [gx, gy] = onCat(c, 0.7, 0.52);
    for (let i = 0; i < 3; i++)
      beat(c, 0.4 + i * 0.5, () => {
        sfx('gem', 0.45 + i * 0.06);
        sfx('tick', 0.6);
        const ring = new Graphics().poly(bandPts(0, 0, 60, 72, 0, Math.PI * 2, 28)).fill({ color: CHALK, alpha: 0.6 });
        ring.position.set(gx, gy);
        fx.addChild(ring);
        if (!c.reduce) gsap.fromTo(ring.scale, { x: 0.4, y: 0.4 }, { x: 4, y: 4, duration: 0.9, ease: 'sine.out' });
        fadeKill(ring, 0.3, 0.5);
        if (i === 0) floatWord(c, c.fg, gx + 240, gy - 160, 'TRRANG~', { fontFamily: F.brush, fontSize: 70, fill: SUN, stroke: { color: C.ink, width: 9, join: 'round' } }, 50, 1.2);
      });
    // the doodles slip off into the air around him
    const n = c.reduce ? 6 : 16;
    for (let i = 0; i < n; i++)
      beat(c, 0.3 + i * (1.6 / n), () => {
        const d = doodle(i, 1.2 + (i % 3) * 0.25, i % 4 === 0 ? SUN : CHALK);
        const a = (i / n) * Math.PI * 2 + 0.4;
        const x = W / 2 + Math.cos(a) * (260 + (i % 3) * 60);
        const y = c.catY - 40 + Math.sin(a) * 200;
        d.position.set(x, y);
        d.rotation = (i % 2 ? 1 : -1) * 0.3;
        fx.addChild(d);
        if (c.reduce) fadeKill(d, 1.2, 0.3);
        else {
          gsap.fromTo(d.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' });
          gsap.to(d, { y: y - 260, x: x + (i % 2 ? 40 : -40), rotation: d.rotation * -2, duration: 1.8, ease: 'sine.out' });
          fadeKill(d, 1.2, 0.6);
        }
      });
    // the campfire crackles
    beat(c, 0.95, () => {
      sfx('pop', 0.7);
      floatWord(c, c.fg, 330, H * 0.73 - 60, 'CRIC…', { fontFamily: F.comic, fontSize: 44, fill: 0xffb85a, stroke: { color: C.ink, width: 7, join: 'round' } }, 40, 0.8);
    });
    beat(c, 1.2, () => {
      sfx('pop', 0.9);
      floatWord(c, c.fg, 430, H * 0.73 - 110, 'CRAC', { fontFamily: F.comic, fontSize: 50, fill: 0xffb85a, stroke: { color: C.ink, width: 7, join: 'round' } }, 40, 0.8);
    });
    // someone panics off-screen; he doesn't
    beat(c, 1.5, () => {
      sfx('alarm', 1.6);
      say(c, c.fg, 330, 380, '¡SE HUNDE EL BARCO!', 0.65, { size: 40, tail: 'left' });
    });
    beat(c, 1.95, () => {
      sfx('purr', 0.9);
      say(c, c.fg, W / 2 + 340, 230, 'relax…', 0.5, { size: 46, tail: 'left', font: F.brush, fill: 0xfff0c0 });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.0);
    sfx('freeze', 1.2);
    c.shaker.add(0.25);
    flashOf(c, FROST, 0.5, 0.35);
    if (st) {
      if (c.reduce) st.flare.v = 1;
      else gsap.fromTo(st.flare, { v: 1.6 }, { v: 1, duration: 1.2 });
      // one icy strum: a frost ring
      const [gx, gy] = onCat(c, 0.7, 0.52);
      const ring = new Graphics().poly(bandPts(0, 0, 70, 96, 0, Math.PI * 2, 30)).fill({ color: FROST, alpha: 0.85 });
      ring.position.set(gx, gy);
      st.fx.addChild(ring);
      if (!c.reduce) gsap.fromTo(ring.scale, { x: 0.3, y: 0.3 }, { x: 8, y: 8, duration: 0.7, ease: 'power2.out' });
      fadeKill(ring, 0.3, 0.4);
      const sp = new Graphics();
      for (let i = 0; i < 10; i++) sp.poly(twinkle(gx + (Math.random() - 0.5) * 300, gy + (Math.random() - 0.5) * 220, 18 + Math.random() * 14)).fill(0xffffff);
      st.fx.addChild(sp);
      fadeKill(sp, 0.25, 0.3);
    }
    burst(c, c.fg, (i) => (i % 3 === 0 ? flake(1.2) : doodle(i, 1.1, i % 2 ? SUN : CHALK)), 24, W / 2, c.catY - 60, 860, 1.5);
    cheer(c, '¡TRANQUI!', TEAL, 170, 2.0);
    aside(c, '…ahorita flota.', CHALK, { delay: 0.6, dur: 2.2 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const kk = s * 1.05;
    const g = new Graphics();
    terrace(g, w, h, kk, w / 2, w < 400);
    const deck = h * 0.73;
    const pg = new Graphics();
    const px = Math.min(w - 330 * kk, w / 2 + m * 0.6);
    props(pg, px, deck + 120 * kk, kk);
    const fx0 = Math.max(120 * kk, w / 2 - m * 0.62);
    fireBase(pg, fx0, deck + 150 * kk, kk);
    const fire = new Graphics();
    const lights = new Graphics();
    const wire = catenary(60 * kk, 110 * kk, w - 60 * kk, 120 * kk, 120 * kk, 24);
    const nb = Math.max(8, Math.min(60, Math.round((w / m) * 22)));
    const dd = new Container();
    k.addChild(g, pg, fire, lights, dd);
    // a few doodles hanging in the air
    const ds: Graphics[] = [];
    for (let i = 0; i < 5; i++) {
      const d = doodle(i, kk * 1.4, i % 2 ? SUN : CHALK);
      d.position.set(w / 2 + (i - 2) * m * 0.2 + (i % 2 ? m * 0.05 : 0), h * (0.18 + (i % 3) * 0.08));
      dd.addChild(d);
      ds.push(d);
    }
    const draw = (t: number) => {
      drawFire(fire, fx0, deck + 150 * kk, kk, t);
      lights.clear();
      stringLights(lights, wire, nb, WARM, (i) => 0.75 + 0.25 * Math.sin(t * 2.5 + i * 1.3), { r: 14 * kk, wireW: 2 * kk });
      ds.forEach((d, i) => {
        d.y = h * (0.18 + (i % 3) * 0.08) - ((t * 12 * kk + i * 30 * kk) % (60 * kk));
        d.rotation = Math.sin(t + i) * 0.3;
      });
    };
    draw(0.3);
    if (live) liveLoop(k, (t) => draw(t + 0.3));
    return k;
  },
};

