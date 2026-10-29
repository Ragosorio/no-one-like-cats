/**
 * Michi-Wan: the far-galaxy universe (a space-wizard saga's serene robed mentor). The stars stretch into hyperspace
 * lines, the jump drops out over a desert planet at dusk under TWO setting suns — dunes, a domed adobe hut, a tall
 * moisture tower. His blade ignites — ¡VUUM! — blue and humming… then flickers, shrinks, and turns out to be a laser
 * pointer: a red dot lands on the sand and zips over the dunes, and a dotted line from his eyes follows it everywhere
 * («…¿un puntero?»). The serene master is, after all, a cat.
 * Payoff: the dune under his paws rises into a towering ridge — he's on the high part — the desert floor drops away,
 * far below his bad apprentice shakes a fist («¡NO ES JUSTO!»), the twin suns flare, the blade burns blue again;
 * ¡QUE LA CROQUETA TE ACOMPAÑE! (…desde la parte alta.) — the high-ground joke, without quoting anyone.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, burst, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { beat, floatWord, glowDisc, pay, smooth } from './kitC';
import { balloon, drive, ngon, onCat, rnd, say, starfield, streak, twinkle } from './kitD';
import { type Prepped, lazy, TAU, prepTitle, prepWord } from './kitG';

const SKY = [0x141a3e, 0x2b2f6b, 0x6a4a86, 0xc96a5a, 0xf2a650, 0xffd58a];
const DUNE_FAR = 0xc9946a;
const DUNE_MID = 0xd9a66a;
const DUNE_NEAR = 0xe6b878;
const SHADE = 0xa86a48;
const ADOBE = 0xe8d0a8;
const SUN_A = 0xffb347;
const SUN_B = 0xfff1c0;
const BLADE = 0x6fb6ff;
const DOT = 0xff2a2a;
const ROBE = 0x6b4a30;

/** a dune layer: a smooth wavy top from x0..x1 at height y (amp, len, ph), filled down to `bottom` */
function duneLayer(g: Graphics, w: number, y: number, amp: number, len: number, ph: number, bottom: number, color: number) {
  const pts: number[] = [];
  const n = Math.max(6, Math.round(w / (len / 3)));
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * w;
    pts.push(x, y + Math.sin((x / len) * TAU + ph) * amp + Math.sin((x / (len * 0.43)) * TAU + ph * 2) * amp * 0.35);
  }
  const top = smooth(pts, 3, false);
  g.poly([...top, w, bottom, 0, bottom]).fill(color);
  return top;
}

/** the planet at dusk: sky, two suns, far spires, three dune layers, the hut and the moisture tower (w×h, horizon hz) */
function planet(w: number, h: number, hz: number, u: number, seed: number) {
  const k = new Container();
  const sky = vgrad(new Graphics(), 0, 0, w, hz + 40 * u, SKY, 20);
  starfield(sky, 0, 0, w, hz * 0.45, Math.round((w / u / 1920) * 70), seed, 0xffffff, 2.2 * u);
  const suns = new Container();
  const sa = new Container();
  sa.addChild(glowDisc(190 * u, SUN_A, 0.5, 8, 28), new Graphics().poly(ngon(0, 0, 66 * u, 66 * u, 28)).fill(SUN_A));
  const sb = new Container();
  sb.addChild(glowDisc(130 * u, SUN_B, 0.55, 7, 24), new Graphics().poly(ngon(0, 0, 40 * u, 40 * u, 24)).fill(SUN_B));
  suns.addChild(sa, sb);
  const land = new Graphics();
  const r = rng(seed);
  // far rock spires
  for (let x = -40 * u; x < w; x += (180 + r() * 260) * u) {
    const hh = (40 + r() * 90) * u;
    const ww = (40 + r() * 70) * u;
    land.poly([x, hz + 10 * u, x + ww * 0.2, hz - hh, x + ww * 0.45, hz - hh - 8 * u, x + ww * 0.7, hz - hh * 0.8, x + ww, hz + 10 * u]).fill(0x9a6a6a);
  }
  duneLayer(land, w, hz, 14 * u, 620 * u, r() * 6, h, DUNE_FAR);
  duneLayer(land, w, hz + 90 * u, 26 * u, 900 * u, r() * 6, h, DUNE_MID);
  // shadow sides on the mid dunes (soft wedges)
  for (let x = r() * 300 * u; x < w; x += (380 + r() * 300) * u) land.poly([x, hz + 96 * u, x + 160 * u, hz + 70 * u, x + 240 * u, hz + 140 * u, x + 40 * u, hz + 150 * u]).fill({ color: SHADE, alpha: 0.35 });
  const near = new Graphics();
  duneLayer(near, w, hz + 260 * u, 40 * u, 1200 * u, r() * 6, h + 10 * u, DUNE_NEAR);
  // ripples in the near sand
  for (let i = 0; i < Math.round((w / u / 1920) * 14); i++) {
    const x = r() * w;
    const y = hz + 330 * u + r() * (h - hz - 340 * u);
    near.poly(streak(x - 60 * u, y, x + 60 * u, y - 6 * u, 2 * u, 1 * u)).fill({ color: SHADE, alpha: 0.35 });
  }
  k.addChild(sky, suns, land, near);
  return { k, sky, suns, sa, sb, land, near };
}

/** a domed adobe hut with its doorway, and a moisture tower beside it (origin at the hut's base center) */
function homestead(s = 1) {
  const g = new Graphics();
  g.poly([-110 * s, 0, ...smooth([-110 * s, 0, -96 * s, -70 * s, -40 * s, -110 * s, 40 * s, -110 * s, 96 * s, -70 * s, 110 * s, 0], 4, false).slice(2, -2), 110 * s, 0]).fill(ADOBE);
  g.poly([-110 * s, 0, -96 * s, -70 * s, -60 * s, -96 * s, -70 * s, 0]).fill({ color: 0xc9a77a, alpha: 0.7 });
  g.poly([-30 * s, 0, -30 * s, -50 * s, 0, -66 * s, 30 * s, -50 * s, 30 * s, 0]).fill(0x3a2a24);
  g.poly(ngon(60 * s, -60 * s, 14 * s, 10 * s, 10)).fill(0x3a2a24);
  // the tower: a pole, two rings, little fins
  const tx = 200 * s;
  g.poly(streak(tx, 0, tx, -230 * s, 9 * s, 6 * s)).fill(0xb8b0a0);
  for (const y of [-80, -170]) g.rect(tx - 26 * s, y * s, 52 * s, 14 * s).fill(0x9a9286);
  for (const y of [-120, -200]) g.rect(tx - 16 * s, y * s, 32 * s, 8 * s).fill(0xcfc7b6);
  g.poly([tx - 4 * s, -230 * s, tx + 4 * s, -230 * s, tx, -256 * s]).fill(0xb8b0a0);
  g.poly([tx - 40 * s, 0, tx + 40 * s, 0, tx + 30 * s, -16 * s, tx - 30 * s, -16 * s]).fill(0x9a9286);
  return g;
}

/** the blade (local: from the hilt along -y): a wide soft glow, a colored body and a white core; `len` 0..L */
function drawBlade(g: Graphics, len: number, color: number, flick = 1) {
  g.clear();
  if (len < 2) return;
  const w = 20 * flick;
  g.poly(streak(0, 0, 0, -len - 10, w * 1.9, w * 1.6)).fill({ color, alpha: 0.18 });
  g.poly(streak(0, 0, 0, -len - 4, w * 1.1, w * 0.95)).fill({ color, alpha: 0.45 });
  g.poly(streak(0, 0, 0, -len, w * 0.6, w * 0.5)).fill({ color, alpha: 0.9 });
  g.poly(streak(0, 0, 0, -len + 4, w * 0.28, w * 0.22)).fill(0xffffff);
}

/** the red dot (a glow, a dot, a white core) */
function dot(s = 1) {
  const g = new Graphics();
  g.poly(ngon(0, 0, 30 * s, 30 * s, 16)).fill({ color: DOT, alpha: 0.22 });
  g.poly(ngon(0, 0, 16 * s, 16 * s, 14)).fill({ color: DOT, alpha: 0.6 });
  g.poly(ngon(0, 0, 8 * s, 8 * s, 12)).fill(DOT);
  g.poly(ngon(-2 * s, -2 * s, 3 * s, 3 * s, 8)).fill(0xffd0d0);
  return g;
}

/** the ridge he ends up on: a towering rock spur whose top is under his paws (origin at its top center) */
function ridge(s = 1) {
  const g = new Graphics();
  const top = smooth([-330 * s, 30 * s, -200 * s, 4 * s, -90 * s, -6 * s, 60 * s, -4 * s, 180 * s, 6 * s, 320 * s, 34 * s], 3, false);
  g.poly([-900 * s, 760 * s, -520 * s, 300 * s, -380 * s, 80 * s, ...top, 400 * s, 90 * s, 560 * s, 320 * s, 960 * s, 760 * s]).fill(0x9a5e3c);
  // strata and the lit face
  g.poly([-380 * s, 80 * s, -330 * s, 30 * s, 320 * s, 34 * s, 400 * s, 90 * s, 300 * s, 120 * s, -300 * s, 110 * s]).fill(0xc07a4a);
  for (const y of [220, 380, 540]) g.poly([-560 * s - y * 0.4 * s, y * s, 580 * s + y * 0.5 * s, y * s, 590 * s + y * 0.5 * s, (y + 16) * s, -570 * s - y * 0.4 * s, (y + 16) * s]).fill({ color: 0x6e3e26, alpha: 0.5 });
  return g;
}

/** the bad apprentice, tiny, far below: dark robe, a fist raised (origin at his feet) */
function apprentice(s = 1) {
  const g = new Graphics();
  g.poly([-14 * s, 0, 14 * s, 0, 10 * s, -36 * s, -10 * s, -36 * s]).fill(0x1a1418);
  g.poly(ngon(0, -44 * s, 10 * s, 10 * s, 10)).fill(0x1a1418);
  g.poly([-9 * s, -50 * s, -6 * s, -62 * s, -2 * s, -52 * s]).fill(0x1a1418);
  g.poly([9 * s, -50 * s, 6 * s, -62 * s, 2 * s, -52 * s]).fill(0x1a1418);
  g.poly(streak(10 * s, -32 * s, 22 * s, -58 * s, 3 * s, 3 * s)).fill(0x1a1418);
  g.poly(ngon(23 * s, -60 * s, 5 * s, 5 * s, 8)).fill(0x1a1418);
  return g;
}

interface St {
  title: () => Prepped;
  blade: Graphics;
  bladeLen: { v: number; c: number };
  world: Container;
  suns: Container;
  hyper: Container | null;
}
const S = stash<St>();
const HZ = 600;
const SUNS: [number, number, number, number] = [1390, 470, 1540, 420];
/** the hilt on the painting (onCat) and the blade's tilt — measured on the integrated painting */
const HILT: [number, number] = [0.455, 0.51];
/** the painted blade points down and to the right (≈34° under the horizontal): the drawn one lies right over it */
const TILT = 2.16;
const BLADE_L = 262;
const EYE: [number, number] = [0.52, 0.23];

export const michiwan: Signature = {
  dark: true,
  frame: 0x3b5ba5,
  tag: 'UNIVERSO DE LA GALAXIA LEJANA',
  open(c: SigCtx) {
    const k = new Container();
    const pl = planet(W, H, HZ, 1, 1977);
    pl.sa.position.set(SUNS[0], SUNS[1]);
    pl.sb.position.set(SUNS[2], SUNS[3]);
    const home = homestead(1);
    home.position.set(330, HZ + 120);
    pl.k.addChildAt(home, 3);
    // more sky above the frame: the payoff drops the whole world down
    k.addChild(new Graphics().rect(0, -340, W, 342).fill(SKY[0]), pl.k);
    k.pivot.set(W / 2, H / 2);
    k.position.set(W / 2, H / 2);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the blade: in front of the silhouette (it glows), from the hilt
    const blade = new Graphics();
    blade.blendMode = 'add';
    const [hx, hy] = onCat(c, HILT[0], HILT[1]);
    blade.position.set(hx, hy);
    blade.rotation = TILT;
    c.fg.addChild(blade);
    const bladeLen = { v: 0, c: BLADE };
    const title = lazy(c, 1.3, () => prepTitle(c, '¡QUE LA CROQUETA\nTE ACOMPAÑE!', { fontFamily: F.poster, fontSize: 112, fill: 0xffe08a, lineHeight: 112, letterSpacing: 2, stroke: { color: 0x141a3e, width: 12, join: 'round' } }, { aside: '…desde la parte alta.', glow: BLADE, maxW: 720, at: [430, 650] }));
    const st: St = { title, blade, bladeLen, world: k, suns: pl.suns, hyper: null };
    S.set(c, st);
    const frame = (t: number) => {
      if (blade.destroyed) return;
      drawBlade(blade, bladeLen.v, bladeLen.c, 0.92 + 0.08 * Math.sin(t * 40));
      pl.sa.scale.set(1 + Math.sin(t * 1.3) * 0.02);
    };
    if (!c.reduce) every(c, 30, frame);
    if (c.short) {
      bladeLen.v = BLADE_L;
      frame(0);
      return;
    }

    // the hyperspace jump: stars stretch into lines, a flash, and we drop out over the planet
    const hyper = new Container();
    const hb = new Graphics().rect(0, 0, W, H).fill(0x05060f);
    const lines = new Graphics();
    hyper.addChild(hb, lines);
    c.back.addChild(hyper);
    st.hyper = hyper;
    const r = rnd(5);
    const stars = Array.from({ length: 150 }, () => ({ a: r() * TAU, d: 40 + r() * 900, w: 1 + r() * 2.4 }));
    const drawHyper = (kk: number) => {
      if (lines.destroyed) return;
      lines.clear();
      for (const s of stars) {
        const d1 = s.d * (1 + kk * 1.4);
        const d0 = Math.max(10, d1 - (4 + kk * kk * 520));
        const ca = Math.cos(s.a);
        const sa = Math.sin(s.a);
        lines.poly(streak(W / 2 + ca * d0, c.catY + sa * d0 * 0.7, W / 2 + ca * d1, c.catY + sa * d1 * 0.7, s.w * 0.3, s.w)).fill({ color: kk > 0.5 ? 0xcfe6ff : 0xffffff, alpha: 0.9 });
      }
    };
    if (c.reduce) {
      destroyTree(hyper);
      bladeLen.v = BLADE_L;
      frame(0);
    } else {
      drawHyper(0);
      drive(lines, 0, 1, 0.42, drawHyper, { ease: 'power2.in' });
      later(c, 0.44, () => {
        flashOf(c, 0xdfeeff, 0.7, 0.3);
        sfx('whoosh', 0.5);
        if (!hyper.destroyed) gsap.to(hyper, { alpha: 0, duration: 0.18, onComplete: () => destroyTree(hyper) });
        gsap.from(k.scale, { x: 1.08, y: 1.08, duration: 0.6, ease: 'power2.out' });
      });
    }
    score(c, [
      [0.0, 'charge', 0.5],
      [0.3, 'whoosh', 0.35],
      [0.62, 'zap', 0.45],
      [1.05, 'zap', 1.6],
    ]);

    // ¡VUUM! the blade ignites
    const vuum = lazy(c, 0.3, () => prepWord(c, c.fg, 1360, 300, '¡VUUM!', BLADE, 120, -0.1));
    beat(c, 0.62, () => {
      vuum().show(0.6);
      c.shaker.add(0.12);
      if (c.reduce) bladeLen.v = BLADE_L;
      else drive(blade, 0, BLADE_L, 0.18, (v) => (bladeLen.v = v), { ease: 'power3.out' });
    });
    // …it flickers, shrinks to a thin red beam: it's a laser pointer
    const dotG = dot(1.4);
    dotG.visible = false;
    c.fg.addChild(dotG);
    const gaze = new Graphics();
    c.fg.addChild(gaze);
    const [ex, ey] = onCat(c, EYE[0], EYE[1]);
    const beam = new Graphics();
    beam.blendMode = 'add';
    c.fg.addChild(beam);
    const route: [number, number][] = [
      [1240, 880],
      [1560, 760],
      [1380, 640],
      [700, 700],
      [420, 860],
      [880, 960],
      [1480, 900],
      [1700, 700],
    ];
    const dotP = { u: 0 };
    const placeDot = () => {
      if (dotG.destroyed) return;
      const f = dotP.u * (route.length - 1);
      const i = Math.min(route.length - 2, Math.floor(f));
      const q = f - i;
      const e = q * q * (3 - 2 * q);
      const x = route[i][0] + (route[i + 1][0] - route[i][0]) * e;
      const y = route[i][1] + (route[i + 1][1] - route[i][1]) * e;
      dotG.position.set(x, y);
      // the thin beam from the hilt, and the gaze: a dotted line from his eyes
      beam.clear().poly(streak(hx, hy, x, y, 2, 1)).fill({ color: DOT, alpha: 0.5 });
      gaze.clear();
      const L = Math.hypot(x - ex, y - ey);
      for (let d = 30; d < L - 20; d += 26) {
        const k2 = d / L;
        gaze.rect(ex + (x - ex) * k2 - 4, ey + (y - ey) * k2 - 4, 8, 8);
      }
      gaze.fill({ color: 0xffffff, alpha: 0.75 });
    };
    beat(c, 1.05, () => {
      sfx('error', 1.8);
      if (c.reduce) bladeLen.v = 0;
      else
        drive(blade, bladeLen.v, 0, 0.16, (v) => (bladeLen.v = v), { ease: 'power2.in' });
      dotG.visible = true;
      dotP.u = 0;
      placeDot();
      if (!c.reduce) gsap.to(dotP, { u: 1, duration: 1.05, delay: 0.12, ease: 'none', onUpdate: placeDot });
      else {
        dotP.u = 0.45;
        placeDot();
      }
      floatWord(c, c.fg, 1400, 560, '…¿un puntero?', { fontFamily: F.comic, fontSize: 48, fill: 0xffffff, letterSpacing: 1, stroke: { color: C.ink, width: 7 } }, 40, 1.0);
    });
    // his attention: «!» over him, then the sound of a cat thinking about pouncing
    beat(c, 1.5, () => {
      const [qx, qy] = onCat(c, 0.6, 0.03);
      floatWord(c, c.fg, qx, qy, '!', { fontFamily: F.comic, fontSize: 110, fill: 0xffe14d, stroke: { color: C.ink, width: 10 } }, 30, 0.6);
      sfx('meow', 1.25);
    });
    later(c, 2.2, () => {
      for (const g of [dotG, gaze, beam]) if (!g.destroyed) gsap.to(g, { alpha: 0, duration: 0.2, onComplete: () => destroyTree(g) });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('zap', 0.5);
    sfx('bigboom', 0.7);
    later(c, 0.2, () => sfx('fanfare', 0.95));
    c.shaker.add(0.35);
    flashOf(c, 0xfff1c0, 0.45, 0.35);
    // the dune under his paws becomes a towering ridge; the desert drops away below
    const rg = ridge(1);
    rg.position.set(W / 2, c.catY + 238);
    c.behind.addChild(rg);
    const ap = apprentice(1.5);
    ap.position.set(W / 2 + 560, H - 40);
    ap.scale.x = -1;
    // wisps of cloud drift by below his paws: that's how high it is
    const wisps = new Graphics();
    for (const [x, y, rx] of [
      [W / 2 - 600, c.catY + 300, 260],
      [W / 2 - 380, c.catY + 340, 180],
      [W / 2 + 420, c.catY + 320, 240],
      [W / 2 + 700, c.catY + 290, 170],
    ])
      wisps.poly(ngon(x, y + rx * 0.05, rx, rx * 0.15, 16)).fill({ color: 0xd8a8a0, alpha: 0.6 }).poly(ngon(x, y, rx * 0.96, rx * 0.13, 16)).fill({ color: 0xfff6ec, alpha: 0.92 });
    c.back.addChild(ap);
    c.behind.addChild(wisps);
    if (!c.reduce) {
      gsap.from(wisps, { alpha: 0, duration: 0.5, delay: 0.3 });
      gsap.to(wisps, { x: -160, duration: 4, ease: 'none' });
    }
    if (st) {
      // a reveal skipped inside the jump: drop out of hyperspace now
      if (st.hyper && !st.hyper.destroyed) destroyTree(st.hyper);
      st.title().show(2.8);
      if (c.reduce) st.bladeLen.v = BLADE_L;
      else drive(st.blade, 0, BLADE_L, 0.22, (v) => (st.bladeLen.v = v), { ease: 'power3.out', delay: 0.15 });
      if (!c.reduce && !st.world.destroyed) {
        gsap.to(st.world, { y: H / 2 + 230, duration: 0.6, ease: 'power2.out' });
      } else if (!st.world.destroyed) st.world.y = H / 2 + 230;
      if (!st.suns.destroyed && !c.reduce) gsap.fromTo(st.suns.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.8, ease: 'power2.out' });
    }
    if (!c.reduce) gsap.from(rg, { y: rg.y + 520, duration: 0.55, ease: 'back.out(1.1)' });
    // the apprentice protests from down there
    later(c, 0.7, () => {
      say(c, c.fg, balloon('¡NO ES JUSTO!', { size: 30, tx: 20, ty: 60 }), W / 2 + 540, H - 210, 1.6, -0.04);
    });
    // stars of light out of the blade
    burst(c, c.fg, (i) => new Graphics().poly(twinkle(0, 0, 16 + (i % 3) * 8)).fill(i % 2 ? BLADE : 0xffffff), 18, W / 2, c.catY - 40, 820, 1.4);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const hz = h * 0.56;
    const pl = planet(w, h, hz, u * 1.3, 1980);
    const sx = w / 2 + Math.min(w * 0.3, m * 0.42);
    pl.sa.position.set(sx, hz - 80 * u);
    pl.sb.position.set(sx + 150 * u * 1.3, hz - 130 * u);
    const home = homestead(u * 1.2);
    home.position.set(w / 2 - Math.min(w * 0.34, m * 0.6), hz + 120 * u);
    pl.k.addChildAt(home, 3);
    k.addChild(pl.k);
    // the red dot on the sand (the painting brings its own blade)
    const d = dot(Math.max(0.35, u * 1.4));
    d.position.set(w / 2 - m * 0.34, h * 0.86);
    k.addChild(d);
    if (live)
      liveLoop(k, (t) => {
        const a = t * 1.3;
        d.position.set(w / 2 + Math.sin(a) * Math.min(w * 0.42, m * 0.6), h * (0.86 + Math.sin(a * 2.3) * 0.05));
        pl.sa.scale.set(1 + Math.sin(t) * 0.03);
      });
    return k;
  },
};
