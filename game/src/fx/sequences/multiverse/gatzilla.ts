/**
 * Gatzilla: the kaiju universe. A black-and-white midnight movie (grain, scratches, letterbox) in a city of cardboard
 * buildings and planes on strings. Giant footsteps shake it, sirens, buildings topple, the extra edition spins in
 * («¡GATO GIGANTE PISA LA CIUDAD!»), his spines charge blue and the atomic breath sweeps the skyline — the only color in
 * the film. Payoff: he roars at the sky: ¡GATZILLAAA!
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { poster, txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { noiseTile } from '../../../panels/collection/printTextures';
import { type Signature, type SigCtx, CHEER, backlight, every, flashOf, later, score } from './kit';
import { fitW, glowWord, liveLoop, puff, rng, stash, vgrad } from './kitB';

const ATOM = 0x4fdcff;
const CORE = 0xeafdff;
const GROUND = 1010;
/** where his mouth is in his painting (the breath starts there) */
const MOUTH: [number, number] = [W / 2 + 156, -154];

/** each building's height (the breath checks its roofline) */
const TOP = new WeakMap<Container, number>();

/** a cardboard building (origin at its base center, so it can topple): body, side face, windows, a crease, tape */
function building(w: number, h: number, tone: number, r: () => number): Container {
  const k = new Container();
  const g = new Graphics();
  g.rect(-w / 2, -h, w, h).fill(tone);
  g.rect(-w / 2, -h, w * 0.14, h).fill(tone + 0x161616);
  g.rect(-w / 2, -h, w, 4).fill(tone + 0x2a2a2a);
  g.rect(-w / 2 - 5, -h - 9, w + 10, 11).fill(Math.max(0, tone - 0x080808));
  const cols = Math.max(2, Math.floor((w - 16) / 22));
  const rows = Math.max(3, Math.floor((h - 30) / 30));
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const lit = r() < 0.42;
      g.rect(-w / 2 + 12 + i * ((w - 20) / cols), -h + 18 + j * 30, 10, 14).fill(lit ? { color: 0xdedbc8, alpha: 0.85 } : 0x262626);
    }
  // the cardboard gives it away: a fold and a strip of tape
  g.moveTo(-w / 2 + w * 0.3, -h).lineTo(w / 2, -h * 0.62).stroke({ width: 2, color: 0x8a8a80, alpha: 0.35 });
  g.poly([-w * 0.22, -h + 22, w * 0.26, -h + 10, w * 0.26, -h + 26, -w * 0.22, -h + 38]).fill({ color: 0x9a9888, alpha: 0.45 });
  if (r() < 0.35) g.moveTo(0, -h - 9).lineTo(0, -h - 60).stroke({ width: 4, color: tone }).circle(0, -h - 62, 5).fill(0xcfcfcf);
  k.addChild(g);
  TOP.set(k, h);
  return k;
}

/** a little biplane hanging from a visible string (the special effects of the box of cinema) */
function biplane(): Container {
  const k = new Container();
  const str = new Graphics().moveTo(0, -900).lineTo(0, -14).stroke({ width: 2, color: 0xbdbdbd, alpha: 0.7 });
  const p = new Graphics()
    .roundRect(-46, -8, 92, 16, 8)
    .fill(0x8c8c8c)
    .rect(-14, -30, 30, 6)
    .fill(0xa8a8a8)
    .rect(-14, 22, 30, 6)
    .fill(0xa8a8a8)
    .rect(-4, -26, 4, 52)
    .fill(0x6a6a6a)
    .poly([-46, -4, -64, -18, -64, 10, -46, 4])
    .fill(0x7a7a7a)
    .circle(48, 0, 6)
    .fill(0x4a4a4a)
    .rect(52, -16, 3, 32)
    .fill(0xd0d0d0);
  k.addChild(str, p);
  return k;
}

/** the extra edition, spinning in like in every monster movie */
function newspaper(): Container {
  const k = new Container();
  const g = new Graphics().rect(-260, -170, 520, 340).fill(0xe4e0d4).stroke({ width: 4, color: C.ink });
  g.moveTo(-240, -100).lineTo(240, -100).stroke({ width: 3, color: C.ink }).moveTo(-240, -92).lineTo(240, -92).stroke({ width: 1, color: C.ink });
  g.rect(-240, 50, 200, 104).fill(0x5e5e5e);
  // the photo: a blurry cat-kaiju over tiny roofs
  g.poly([-180, 154, -176, 92, -160, 74, -150, 86, -138, 74, -126, 92, -110, 104, -96, 154]).fill(0x1c1c1c);
  for (let i = 0; i < 6; i++) g.rect(-236 + i * 33, 132 - (i % 3) * 10, 26, 30 + (i % 3) * 10).fill(0x3a3a3a);
  for (let y = 58; y < 156; y += 12) g.moveTo(-20, y).lineTo(y % 24 ? 236 : 200, y).stroke({ width: 4, color: 0x9a9a92 });
  const mast = txt('El Diario de Cartón', { fontFamily: F.news, fontSize: 44, fill: C.ink });
  mast.anchor.set(0.5);
  mast.y = -134;
  const ed = txt('EDICIÓN EXTRA · MEDIANOCHE', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, letterSpacing: 3 });
  ed.anchor.set(0.5);
  ed.y = -82;
  const h1 = poster('¡GATO GIGANTE', 56, C.ink);
  const h2 = poster('PISA LA CIUDAD!', 56, C.ink);
  h1.anchor.set(0.5);
  h2.anchor.set(0.5);
  h1.y = -40;
  h2.y = 14;
  fitW(h1, 480);
  fitW(h2, 480);
  k.addChild(g, mast, ed, h1, h2);
  return k;
}

/** the atomic breath: a glow, a blue body and a white core from (x0,y0) to (x1,y1) */
function beam(g: Graphics, x0: number, y0: number, x1: number, y1: number, k: number) {
  g.clear();
  if (k <= 0) return;
  const j = 0.85 + Math.random() * 0.3;
  g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 120 * k * j, color: ATOM, alpha: 0.18, cap: 'round' });
  g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 58 * k * j, color: ATOM, alpha: 0.8, cap: 'round' });
  g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 20 * k * j, color: CORE, cap: 'round' });
  g.circle(x0, y0, 34 * k * j).fill({ color: CORE, alpha: 0.9 });
}

/**
 * the old film over the picture: grain (the speckle texture twice, light and dark), scratches, a vignette, a flicker.
 * Drawn, not a filter: no shader to compile in the middle of a reveal. roll() moves it one film frame.
 */
function film(w: number, h: number, u = 1, flicker = true): { k: Container; roll: () => void } {
  const k = new Container();
  const grit = [0xffffff, 0x000000].map((tint, i) => {
    const t = new TilingSprite({ texture: noiseTile(), width: w, height: h });
    t.tint = tint;
    t.alpha = i ? 0.18 : 0.12;
    t.tileScale.set((1.3 + i * 0.5) * u);
    k.addChild(t);
    return t;
  });
  const vig = new Graphics();
  for (let i = 0; i < 6; i++) vig.rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.08 }).ellipse(w / 2, h / 2, w * (0.84 - i * 0.03), h * (0.86 - i * 0.035)).cut();
  const scratch = new Graphics();
  const dim = new Graphics().rect(0, 0, w, h).fill(0x000000);
  dim.alpha = 0;
  k.addChild(scratch, vig, dim);
  const roll = () => {
    for (const g of grit) if (!g.destroyed) g.tilePosition.set(Math.random() * 512, Math.random() * 512);
    if (scratch.destroyed) return;
    scratch.clear();
    const n = Math.random() < 0.5 ? 0 : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const x = Math.random() * w;
      scratch.moveTo(x, 0).lineTo(x + (Math.random() - 0.5) * 20 * u, h).stroke({ width: (1 + Math.random() * 1.5) * u, color: Math.random() < 0.7 ? 0xe8e8e8 : 0x000000, alpha: 0.35 });
    }
    if (Math.random() < 0.3) scratch.circle(Math.random() * w, Math.random() * h, (2 + Math.random() * 4) * u).fill({ color: 0x000000, alpha: 0.5 });
    if (flicker) dim.alpha = Math.random() * 0.07;
  };
  roll();
  return { k, roll };
}

interface City {
  k: Container;
  near: Container[];
  lights: Graphics;
  beams: Graphics[];
  planes: Container[];
}

function city(c: SigCtx): City {
  const k = new Container();
  const r = rng(1954);
  const sky = vgrad(new Graphics(), 0, 0, W, H, [0x040404, 0x111111, 0x2e2e2e, 0x545454], 20);
  k.addChild(sky);
  const beams: Graphics[] = [];
  for (const [x, rot] of [
    [380, 0.35],
    [1000, -0.2],
    [1560, -0.4],
  ] as const) {
    const b = new Graphics().poly([-16, 0, 16, 0, 150, -1200, -150, -1200]).fill({ color: 0xf2f2f2, alpha: 0.1 });
    b.position.set(x, 820);
    b.rotation = rot;
    b.blendMode = 'add';
    k.addChild(b);
    beams.push(b);
  }
  const far = new Graphics();
  const lights = new Graphics();
  let x = -20;
  while (x < W + 20) {
    const w = 60 + r() * 90;
    const h = 200 + r() * 260;
    far.rect(x, 820 - h, w, h + 200).fill(0x0f0f0f);
    for (let i = 0; i < 6; i++) if (r() < 0.6) lights.rect(x + 8 + r() * (w - 20), 820 - h + 12 + r() * (h - 30), 6, 8).fill({ color: 0xcfcfc0, alpha: 0.45 });
    x += w + 4;
  }
  k.addChild(far, lights);
  const planes = [biplane(), biplane()];
  planes[0].position.set(330, 250);
  planes[0].scale.set(1.3);
  planes[1].position.set(1600, 330);
  planes[1].scale.set(-1.05, 1.05);
  k.addChild(...planes);
  const near: Container[] = [];
  x = 30;
  while (x < W) {
    const w = 90 + r() * 80;
    const h = 220 + r() * 230;
    const b = building(w, h, 0x2a2a2a + Math.floor(r() * 4) * 0x060606, r);
    b.position.set(x + w / 2, 880 + r() * 30);
    k.addChild(b);
    near.push(b);
    x += w + 10 + r() * 30;
  }
  // the front row, low: the kaiju stands behind it
  const front = new Graphics();
  x = -10;
  while (x < W) {
    const w = 110 + r() * 90;
    const h = 60 + r() * 70;
    front.rect(x, 930 - h, w, h + 160).fill(0x0b0b0b);
    for (let i = 0; i < 4; i++) front.rect(x + 14 + i * 26, 950 - h, 12, 12).fill({ color: 0xbdbdb0, alpha: r() < 0.5 ? 0.6 : 0 });
    x += w + 6;
  }
  k.addChild(front);
  // letterbox
  k.addChild(new Graphics().rect(0, 0, W, 54).fill(0x000000).rect(0, GROUND + 16, W, H).fill(0x000000));
  const fm = film(W, H, 1, c.flashes);
  k.addChild(fm.k);
  if (!c.reduce)
    every(c, 24, (t) => {
      fm.roll();
      beams.forEach((b, i) => !b.destroyed && (b.rotation = [0.35, -0.2, -0.4][i] + Math.sin(t * (0.7 + i * 0.25) + i * 2) * 0.32));
      planes.forEach((p, i) => !p.destroyed && (p.rotation = Math.sin(t * 1.6 + i * 1.7) * 0.07));
    });
  return { k, near, lights, beams, planes };
}

/** a building falls over: rotates on its base, sinks, dust */
function topple(c: SigCtx, b: Container | undefined, dir: number) {
  if (!b || b.destroyed || c.reduce) return;
  gsap.to(b, { rotation: dir * (1.15 + Math.random() * 0.35), duration: 0.7, ease: 'power2.in' });
  gsap.to(b, { y: b.y + 120, duration: 0.5, delay: 0.55, ease: 'power1.in' });
  // chunks of cardboard fly off the top
  later(c, 0.25, () => {
    for (let i = 0; i < 8; i++) {
      const d = new Graphics().rect(-8, -6, 16 + Math.random() * 14, 10 + Math.random() * 8).fill(0x5a5a5a);
      d.position.set(b.x + dir * (60 + Math.random() * 90), b.y - (TOP.get(b) ?? 300) * 0.7);
      c.back.addChild(d);
      gsap.to(d, { x: d.x + dir * (120 + Math.random() * 220), y: 900 + Math.random() * 60, rotation: (Math.random() - 0.5) * 9, duration: 0.7 + Math.random() * 0.3, ease: 'power1.in', onComplete: () => destroyTree(d) });
    }
  });
  later(c, 0.62, () => {
    puff(c, c.back, b.x + dir * 160, 880, 0x9a9a9a, 9, 90, 110);
    sfx('boom', 0.8);
    c.shaker.add(0.15);
  });
}

const S = stash<{ city: City; glow: Graphics }>();

export const gatzilla: Signature = {
  dark: true,
  frame: ATOM,
  tag: 'UNIVERSO KAIJU',
  open(c: SigCtx) {
    const ct = city(c);
    c.back.addChild(ct.k);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.2 });
    // moonlit haze so the silhouette reads; the blue only comes with the charge
    const haze = backlight(0xd8d8d8, 420, 0.28);
    haze.position.set(W / 2, c.catY);
    const glow = backlight(ATOM, 380, 0.3);
    glow.position.set(W / 2, c.catY);
    glow.alpha = c.short ? 0.6 : 0;
    c.behind.addChild(haze, glow);
    S.set(c, { city: ct, glow });
    if (c.short) return;

    // the projector starts: the picture flickers on
    if (c.flashes && !c.reduce) gsap.fromTo(ct.k, { alpha: 0 }, { alpha: 1, duration: 0.05, repeat: 4, yoyo: true, ease: 'none' });
    else if (!c.reduce) gsap.fromTo(ct.k, { alpha: 0 }, { alpha: 1, duration: 0.3 });
    score(c, [
      [0, 'tick', 0.5],
      [0.05, 'tick', 0.5],
      [0.1, 'tick', 0.5],
      [0.02, 'sting', 0.55],
      [0.3, 'alarm', 0.72],
      [1.0, 'alarm', 0.8],
    ]);
    const near = ct.near;
    const nearest = (x: number) => near.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    // three giant footsteps: the city jumps, the windows blink, the dust rises
    [0.2, 0.7, 1.15].forEach((t, i) =>
      later(c, t, () => {
        sfx('bigboom', 0.42 + i * 0.04);
        sfx('boom', 0.45);
        c.shaker.add(0.5);
        if (!c.reduce) {
          for (const b of near) if (!b.destroyed && Math.abs(b.rotation) < 0.01) gsap.fromTo(b, { y: b.y - 14 - Math.random() * 10 }, { y: b.y, duration: 0.35, ease: 'bounce.out' });
          gsap.fromTo(ct.lights, { alpha: 0.15 }, { alpha: 1, duration: 0.3, ease: 'steps(3)' });
        }
        puff(c, c.back, W / 2 + (i % 2 ? 160 : -170), 900, 0x7a7a7a, 6, 70, 60);
        if (i === 1) topple(c, nearest(520), -1);
        if (i === 2) topple(c, nearest(1420), 1);
      }),
    );
    // the extra edition spins in, then flies away
    const news = newspaper();
    news.position.set(470, 330);
    ct.k.addChildAt(news, ct.k.children.length - 1);
    if (c.reduce) {
      news.rotation = -0.06;
      gsap.to(news, { alpha: 0, delay: 1.3, duration: 0.3, onComplete: () => destroyTree(news) });
    } else {
      gsap.fromTo(news, { rotation: Math.PI * 6 }, { rotation: -0.07, duration: 0.55, delay: 0.4, ease: 'power2.out' });
      gsap.fromTo(news.scale, { x: 0.02, y: 0.02 }, { x: 0.95, y: 0.95, duration: 0.55, delay: 0.4, ease: 'power2.out' });
      gsap.to(news, { x: -500, rotation: -1.2, duration: 0.4, delay: 1.25, ease: 'power2.in', onComplete: () => destroyTree(news) });
      later(c, 0.4, () => sfx('whoosh', 0.8));
      later(c, 0.95, () => sfx('paper', 0.7));
    }
    // the spines charge: blue light gathers behind him
    later(c, 1.38, () => {
      sfx('charge', 0.55);
      gsap.to(glow, { alpha: 1, duration: 0.4 });
      gsap.fromTo(glow.scale, { x: 0.7, y: 0.7 }, { x: 1.35, y: 1.35, duration: 0.45, ease: 'power2.in' });
      if (c.reduce) return;
      for (let i = 0; i < 26; i++) {
        const s = new Graphics().circle(0, 0, 4 + Math.random() * 6).fill(i % 3 ? ATOM : CORE);
        s.blendMode = 'add';
        s.position.set(W / 2 + (Math.random() - 0.62) * 380, c.catY + (Math.random() - 0.3) * 420);
        c.behind.addChild(s);
        gsap.to(s, { y: s.y - 120 - Math.random() * 80, alpha: 0, duration: 0.5 + Math.random() * 0.3, delay: Math.random() * 0.4, ease: 'power1.in', onComplete: () => destroyTree(s) });
      }
    });
    later(c, 1.62, () => sfx('charge', 0.9));
    // the atomic breath sweeps the skyline
    const mx = MOUTH[0];
    const my = c.catY + MOUTH[1];
    later(c, 1.84, () => {
      const g = new Graphics();
      g.blendMode = 'add';
      c.fg.addChild(g);
      sfx('zap', 0.55);
      sfx('bigboom', 0.6);
      sfx('crit', 0.7);
      c.shaker.add(0.7);
      flashOf(c, ATOM, 0.32, 0.45);
      const p = { a: 0, k: 0 };
      gsap.to(p, { k: 1, duration: 0.08 });
      gsap.to(p, { a: 1, duration: c.reduce ? 0.01 : 0.36, ease: 'power1.inOut' });
      const hit = new Set<Container>();
      const stop = every(c, 60, () => {
        if (g.destroyed) return stop();
        const ex = W + 80;
        const ey = 300 + p.a * 520;
        beam(g, mx, my, ex, ey, p.k);
        // what the breath touches, burns and falls
        for (const b of near) {
          if (hit.has(b) || b.destroyed || b.x < 1300) continue;
          const by = my + ((ey - my) * (b.x - mx)) / (ex - mx);
          if (by > b.y - (TOP.get(b) ?? 0)) {
            hit.add(b);
            topple(c, b, 1);
            const boom = new Graphics().circle(0, 0, 50).fill({ color: CORE, alpha: 0.8 }).circle(0, 0, 120).fill({ color: ATOM, alpha: 0.3 }).circle(0, 0, 150).stroke({ width: 8, color: ATOM, alpha: 0.7 });
            boom.blendMode = 'add';
            boom.position.set(b.x, by);
            c.fg.addChild(boom);
            gsap.fromTo(boom.scale, { x: 0.3, y: 0.3 }, { x: 1.6, y: 1.6, duration: 0.4 });
            gsap.to(boom, { alpha: 0, duration: 0.45, onComplete: () => destroyTree(boom) });
          }
        }
      });
      gsap.to(p, { k: 0, delay: 0.42, duration: 0.18, onComplete: () => {
          stop();
          destroyTree(g);
        } });
      gsap.to(glow, { alpha: 0.4, delay: 0.6, duration: 0.6 });
    });
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('sting', 0.48);
    sfx('bigboom', 0.42);
    sfx('purr', 0.7);
    later(c, 0.12, () => sfx('charge', 1.25));
    c.shaker.add(0.6);
    // he roars at the sky: the breath straight up
    const g = new Graphics();
    g.blendMode = 'add';
    c.fg.addChild(g);
    const mx = MOUTH[0];
    const my = c.catY + MOUTH[1];
    const p = { k: 0 };
    gsap.to(p, { k: 1, duration: 0.1 });
    gsap.to(p, { k: 0, delay: 0.85, duration: 0.25 });
    const stop = every(c, 60, () => !g.destroyed && beam(g, mx, my, mx + 320, -120, p.k));
    later(c, 1.2, () => {
      stop();
      destroyTree(g);
    });
    // a blue ring runs through the city; every window lights up
    const ring = new Graphics().ellipse(0, 0, 200, 40).stroke({ width: 10, color: ATOM });
    ring.blendMode = 'add';
    ring.position.set(W / 2, 880);
    c.back.addChild(ring);
    gsap.fromTo(ring.scale, { x: 0.3, y: 0.3 }, { x: 6, y: 6, duration: 0.9, ease: 'power2.out' });
    gsap.to(ring, { alpha: 0, duration: 0.9, onComplete: () => destroyTree(ring) });
    if (st) {
      gsap.fromTo(st.city.lights, { alpha: 0.2 }, { alpha: 1, duration: 0.4 });
      gsap.to(st.glow, { alpha: 0.6, duration: 0.5 });
      if (!c.reduce) for (const b of st.city.near) if (!b.destroyed && Math.abs(b.rotation) < 0.01) gsap.fromTo(b, { y: b.y - 22 }, { y: b.y, duration: 0.5, ease: 'bounce.out' });
    }
    // blue embers drift down from the sky
    if (!c.reduce)
      for (let i = 0; i < 30; i++) {
        const e = new Graphics().circle(0, 0, 3 + Math.random() * 4).fill(i % 2 ? ATOM : CORE);
        e.blendMode = 'add';
        e.position.set(Math.random() * W, -20 - Math.random() * 200);
        c.fg.addChild(e);
        gsap.to(e, { y: H * (0.5 + Math.random() * 0.4), x: e.x + (Math.random() - 0.5) * 200, alpha: 0, duration: 2 + Math.random(), delay: 0.3 + Math.random() * 0.6, ease: 'none', onComplete: () => destroyTree(e) });
      }
    // the title, rumbling
    const t = glowWord('¡GATZILLAAA!', 128, 0xf4f4f4, ATOM, F.heavy);
    fitW(t, 780);
    const s0 = t.scale.x;
    t.position.set(CHEER[0], CHEER[1]);
    t.rotation = -0.05;
    c.fg.addChild(t);
    gsap.fromTo(t.scale, { x: s0 * 1.7, y: s0 * 1.7 }, { x: s0, y: s0, duration: 0.22, ease: 'back.out(2.5)' });
    if (!c.reduce) {
      const shake = every(c, 30, (u) => {
        if (t.destroyed || u > 1.3) return shake();
        const a = 6 * (1 - u / 1.3);
        t.position.set(CHEER[0] + (Math.random() - 0.5) * a, CHEER[1] + (Math.random() - 0.5) * a);
      });
    }
    gsap.to(t, { alpha: 0, delay: 2.3, duration: 0.5, onComplete: () => destroyTree(t) });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.min(w, h) / 300;
    k.addChild(vgrad(new Graphics(), 0, 0, w, h, [0x060606, 0x1c1c1c, 0x3a3a3a], 12));
    const beams: Graphics[] = [];
    for (const [x, rot] of [
      [0.2, 0.3],
      [0.82, -0.35],
    ] as const) {
      const b = new Graphics().poly([-6 * u, 0, 6 * u, 0, 70 * u, -h * 1.3, -70 * u, -h * 1.3]).fill({ color: 0xffffff, alpha: 0.1 });
      b.position.set(x * w, h * 0.86);
      b.rotation = rot;
      k.addChild(b);
      beams.push(b);
    }
    const glow = backlight(ATOM, Math.min(w, h) * 0.55, 0.35);
    glow.position.set(w / 2, h * 0.5);
    k.addChild(glow);
    // the breath crosses the upper corner
    const br = new Graphics();
    beam(br, w * 0.6, h * 0.3, w + 20 * u, h * 0.05, 0.42 * u);
    br.blendMode = 'add';
    k.addChild(br);
    const r = rng(7);
    const sky = new Graphics();
    const lights = new Graphics();
    let x = -4;
    while (x < w) {
      const bw = (24 + r() * 30) * u;
      const bh = (40 + r() * 80) * u;
      sky.rect(x, h - bh, bw, bh).fill(r() < 0.5 ? 0x141414 : 0x1d1d1d);
      for (let i = 0; i < 3; i++) if (r() < 0.6) lights.rect(x + 3 * u + r() * (bw - 8 * u), h - bh + 6 * u + r() * (bh - 14 * u), 3 * u, 4 * u).fill({ color: 0xdedbc8, alpha: 0.75 });
      x += bw + 2 * u;
    }
    // one has already fallen
    const fallen = new Graphics().rect(-18 * u, -70 * u, 36 * u, 70 * u).fill(0x262626).rect(-18 * u, -70 * u, 6 * u, 70 * u).fill(0x333333);
    fallen.position.set(w * 0.86, h);
    fallen.rotation = 1.1;
    k.addChild(sky, lights, fallen);
    const fm = film(w, h, u * 0.6, false);
    k.addChild(fm.k);
    if (live) {
      liveLoop(k, 20, (t) => {
        fm.roll();
        beams[0].rotation = 0.3 + Math.sin(t * 0.8) * 0.35;
        beams[1].rotation = -0.35 + Math.sin(t * 0.6 + 2) * 0.35;
        lights.alpha = 0.75 + Math.sin(t * 7) * 0.1;
      });
    }
    return k;
  },
};
