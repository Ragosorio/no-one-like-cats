/**
 * El Estambre: the dust-storm universe (tolvanera). A hazy desert whose dunes are made of yarn; the silhouette comes
 * undone into a cloud of fibers, a storm of wool grains swirls around a twisting funnel, and the grains stream back in
 * and knit him whole again, grain by grain (nobody was looking). Yarn tumbleweeds roll by. Payoff: two giant fists of
 * wool rise out of the dunes and pound the ground, then crumble; ¡TORMENTA DE ESTAMBRE!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, CHEER, burst, cheer, every, later, score, word } from './kit';
import { CAT_R, cardLoop, hideDisc } from './kitA';

const OLIVE = 0x6b7a3a;
const OLIVE_D = 0x4e5a28;
const SAND = 0xd9c79a;
const TAN = 0xb89a5c;
const FIBER = [0x6b7a3a, 0x8f8a45, 0xb89a5c, 0xe8d9b0, 0x4e5a28];
const HZ = 0.74;

/** a dune band whose surface is combed into yarn fibers (parallel wavy strokes following the ridge) */
function dune(g: Graphics, w: number, h: number, y0: number, amp: number, freq: number, ph: number, fill: number, fiber: number, s: number) {
  const ridge = (x: number) => y0 + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 2.3 + ph * 1.7) * amp * 0.35;
  const pts: number[] = [];
  for (let x = 0; x <= w + 20; x += 20) pts.push(x, ridge(x));
  pts.push(w, h, 0, h);
  g.poly(pts).fill(fill);
  for (let j = 1; j < 9; j++) {
    const off = j * j * 4 * s + 6 * s;
    g.moveTo(0, ridge(0) + off);
    for (let x = 20; x <= w + 20; x += 20) g.lineTo(x, ridge(x) + off + Math.sin(x * 0.05 + j) * 2 * s);
    g.stroke({ width: 3 * s, color: fiber, alpha: 0.55 });
  }
}

/** the desert: pale ochre haze, a muffled sun, three dune bands of yarn */
function desert(w = W, h = H, s = 1): Container {
  const k = new Container();
  const sky = new Graphics();
  const bands = [0xf4e6c2, 0xf0ddb2, 0xead2a0, 0xe4c78f];
  bands.forEach((b, i) => sky.rect(0, (i * h * HZ) / bands.length, w, (h * HZ) / bands.length + 2).fill(b));
  sky.rect(0, h * HZ, w, h).fill(0xe4c78f);
  k.addChild(sky);
  const sun = new Graphics();
  for (let i = 5; i >= 1; i--) sun.circle(w * 0.72, h * 0.26, 70 * s + i * 22 * s).fill({ color: 0xfff6dc, alpha: 0.12 });
  sun.circle(w * 0.72, h * 0.26, 70 * s).fill({ color: 0xfffaf0, alpha: 0.85 });
  k.addChild(sun);
  const d = new Graphics();
  dune(d, w, h, h * 0.6, 40 * s, 0.004 / s, 0.5, 0xdcc290, 0xc8ab72, s);
  dune(d, w, h, h * 0.7, 55 * s, 0.003 / s, 2.2, TAN, 0x9c8048, s);
  dune(d, w, h, h * 0.83, 36 * s, 0.005 / s, 4.1, 0x8f8a45, OLIVE_D, s);
  k.addChild(d);
  return k;
}

/** a fiber grain: a short curled stroke */
function fiberG(i: number): Graphics {
  return new Graphics()
    .moveTo(-12, 0)
    .lineTo(0, -5)
    .lineTo(12, 0)
    .stroke({ width: 4, color: FIBER[i % FIBER.length] });
}

/** the funnel: a twisting tornado of yarn from his feet down to the dunes, striped bands turning with `t` */
function funnel(g: Graphics, x: number, top: number, bot: number, t: number, k: number) {
  g.clear();
  if (k <= 0.01) return;
  const n = 13;
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    const y = top + (bot - top) * p;
    const rw = (230 - 170 * p) * k;
    const sway = Math.sin(t * 3 + p * 4) * 22 * p;
    g.ellipse(x + sway, y, rw, 26 * k).fill({ color: i % 2 ? OLIVE : TAN, alpha: 0.85 });
  }
  // the stripes wrapping around it (one stroke)
  let any = false;
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    const y = top + (bot - top) * p;
    const rw = (230 - 170 * p) * k;
    const sway = Math.sin(t * 3 + p * 4) * 22 * p;
    for (let j = 0; j < 3; j++) {
      const a = t * 4 + j * 2.1 + p * 3;
      if (Math.sin(a) < 0) continue;
      const sx = Math.cos(a) * rw * 0.9;
      g.moveTo(x + sway + sx - 22, y - 6).lineTo(x + sway + sx + 22, y + 6);
      any = true;
    }
  }
  if (any) g.stroke({ width: 5, color: 0xe8d9b0, alpha: 0.8 });
}

/** a giant fist of wool (knuckles up), ~300 wide */
function fist(): Container {
  const k = new Container();
  const g = new Graphics();
  g.roundRect(-120, -40, 240, 330, 50).fill(OLIVE).stroke({ width: 8, color: C.ink });
  for (let i = 0; i < 4; i++) g.roundRect(-150 + i * 76, -150, 74, 150, 34).fill(i % 2 ? 0x7d8b45 : OLIVE).stroke({ width: 8, color: C.ink });
  g.roundRect(-176, -50, 80, 150, 36).fill(0x7d8b45).stroke({ width: 8, color: C.ink });
  // the yarn: wound fibers across it (one stroke)
  for (let y = -130; y < 280; y += 22) g.moveTo(-140, y).lineTo(0, y + 10).lineTo(140, y);
  g.stroke({ width: 4, color: 0xa9b26a, alpha: 0.6 });
  // loose fibers fraying off its outline (it's made of wool grains): one stroke per color
  const fuzz = new Graphics();
  for (let ci = 0; ci < FIBER.length; ci++) {
    for (let i = ci; i < 46; i += FIBER.length) {
      const a = (i / 46) * Math.PI * 2;
      const x = Math.cos(a) * (150 + (i % 3) * 14);
      const y = 70 + Math.sin(a) * 230;
      fuzz.moveTo(x, y).lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26 - 6);
    }
    fuzz.stroke({ width: 4, color: FIBER[ci] });
  }
  k.addChild(fuzz, g);
  return k;
}

/** a yarn tumbleweed */
function tumble(r: number): Container {
  const k = new Container();
  const g = new Graphics().circle(0, 0, r).fill(TAN).stroke({ width: 5, color: C.ink });
  for (let i = 0; i < 7; i++) g.ellipse(0, 0, r * 0.95, r * (0.2 + i * 0.11)).stroke({ width: 3, color: i % 2 ? 0xe8d9b0 : OLIVE_D, alpha: 0.85 });
  g.moveTo(-r, 0).bezierCurveTo(-r * 1.6, r * 0.4, -r * 2.2, -r * 0.3, -r * 3, r * 0.2).stroke({ width: 4, color: TAN, cap: 'round' });
  k.addChild(g);
  return k;
}

interface Storm {
  calm: { k: number };
}
const state = new WeakMap<SigCtx, Storm>();

/** the storm ring: grains orbiting him on a flat ellipse (front half over the cat, back half behind) */
const ORBIT = Array.from({ length: 190 }, (_, i) => ({
  r: 300 + ((i * 97) % 340),
  v: 1.6 + ((i * 31) % 10) / 6,
  a0: (i * 2.399) % (Math.PI * 2),
  hy: -260 + ((i * 53) % 480),
  c: FIBER[i % FIBER.length],
}));

/** the whirl's ribbons: [radius x, radius y, height, arc span, speed, width, color] */
const RIBBONS = [
  { rx: 470, ry: 110, hy: -200, a0: 0, span: 2.4, v: 2.4, w: 34, c: 0xc9a467 },
  { rx: 540, ry: 120, hy: -40, a0: 2.1, span: 2.0, v: 2.0, w: 44, c: 0xb08a4a },
  { rx: 430, ry: 100, hy: 110, a0: 4.2, span: 2.6, v: 2.8, w: 30, c: 0xa9b26a },
  { rx: 380, ry: 80, hy: 230, a0: 1.0, span: 2.2, v: 3.2, w: 26, c: 0xc9a467 },
];

export const estambre: Signature = {
  dark: false,
  frame: SAND,
  tag: 'UNIVERSO TOLVANERA',
  open(c: SigCtx) {
    const k = desert();
    c.back.addChild(k);
    hideDisc(c, 0.25);
    const dust = new Graphics().rect(0, 0, W, H).fill(0xb08a4a);
    dust.alpha = c.short || c.reduce ? 0.08 : 0;
    c.back.addChild(dust);
    const bank = new Graphics();
    c.back.addChild(bank);
    const wind = new Graphics();
    c.back.addChild(wind);
    const fn = new Graphics();
    c.behind.addChild(fn);
    const back = new Graphics();
    c.behind.addChild(back);
    const front = new Graphics();
    c.fg.addChild(front);
    const inflow = new Graphics();
    c.fg.addChild(inflow);
    const calm = { k: c.short || c.reduce ? 0.35 : 1 };
    const FN = { k: c.short || c.reduce ? 1 : 0 };
    state.set(c, { calm });
    const streaks = Array.from({ length: 34 }, (_, i) => ({ y: 40 + ((i * 131) % (H - 80)), x: (i * 397) % W, v: 900 + ((i * 71) % 700), L: 80 + ((i * 37) % 160) }));
    const feet = c.catY + CAT_R - 30;
    const drawStorm = (t: number, still: boolean) => {
      if (front.destroyed) return;
      funnel(fn, W / 2, feet, H * 0.9, still ? 0 : t, FN.k);
      back.clear();
      front.clear();
      // the fibers, batched by color and side (a handful of strokes per frame, not hundreds)
      const L = 12 + calm.k * 14;
      for (let ci = 0; ci < FIBER.length; ci++) {
        for (const side of [front, back]) {
          let any = false;
          for (let i = ci; i < ORBIT.length; i += FIBER.length) {
            const o = ORBIT[i];
            const a = o.a0 + (still ? 0 : t * o.v * (0.35 + calm.k * 0.65));
            if (Math.sin(a) > 0 !== (side === front)) continue;
            const x = W / 2 + Math.cos(a) * o.r;
            const y = c.catY + o.hy * (0.5 + 0.5 * calm.k) + Math.sin(a) * o.r * 0.22;
            const dx = -Math.sin(a) * L;
            const dy = Math.cos(a) * L * 0.22;
            side.moveTo(x - dx, y - dy).lineTo(x, y - 5).lineTo(x + dx, y + dy);
            any = true;
          }
          if (any) side.stroke({ width: 5, color: FIBER[ci], alpha: 0.9 });
        }
      }
      // the whirl: translucent ribbons of dust circling him (front half over the cat, back half behind)
      for (const rb of RIBBONS) {
        const a0 = rb.a0 + (still ? 0 : t * rb.v * (0.4 + calm.k * 0.6));
        const hy = c.catY + rb.hy * (0.6 + 0.4 * calm.k);
        let fronts = 0;
        let backs = 0;
        let prev: boolean | null = null;
        for (let j = 0; j <= 18; j++) {
          const a = a0 + (j / 18) * rb.span;
          const x = W / 2 + Math.cos(a) * rb.rx;
          const y = hy + Math.sin(a) * rb.ry;
          const fr = Math.sin(a) > 0;
          const g = fr ? front : back;
          if (fr !== prev) {
            // a new run on this side: start it where the last one ended
            if (prev !== null) g.moveTo(W / 2 + Math.cos(a - rb.span / 18) * rb.rx, hy + Math.sin(a - rb.span / 18) * rb.ry);
            else g.moveTo(x, y);
          }
          g.lineTo(x, y);
          if (fr) fronts++;
          else backs++;
          prev = fr;
        }
        const st = { width: rb.w * (0.5 + 0.5 * calm.k), color: rb.c, alpha: 0.32, cap: 'round' as const, join: 'round' as const };
        if (fronts) front.stroke(st);
        if (backs) back.stroke(st);
      }
      // the dust bank rolling along the top
      bank.clear();
      for (const odd of [0, 1]) {
        for (let j = odd; j < 22; j += 2) {
          const bx = ((j * 131 + (still ? 0 : t * (50 + (j % 4) * 30))) % (W + 600)) - 300;
          bank.ellipse(bx, 30 + (j % 5) * 42, 240 + (j % 3) * 90, 46 + (j % 4) * 14);
        }
        bank.fill({ color: odd ? 0xc9a467 : 0xa8823f, alpha: 0.1 + calm.k * 0.22 });
      }
      wind.clear();
      for (const s of streaks) {
        const x = still ? s.x : ((s.x + t * s.v * (0.3 + calm.k * 0.7)) % (W + 400)) - 200;
        wind.moveTo(x, s.y).lineTo(x + s.L, s.y + 6);
      }
      wind.stroke({ width: 3, color: 0xfff6dc, alpha: 0.35 + calm.k * 0.25 });
    };
    if (c.reduce) {
      drawStorm(0, true);
      return;
    }
    every(c, 40, (t) => drawStorm(t, false));
    // the tumbleweeds keep rolling by
    const roll = (delay: number, y: number, r: number, dir: number) =>
      later(c, delay, () => {
        const tw = tumble(r);
        tw.position.set(dir > 0 ? -120 : W + 120, y);
        c.back.addChild(tw);
        gsap.to(tw, { x: dir > 0 ? W + 160 : -160, duration: 2.6, ease: 'none', onComplete: () => tw.destroy({ children: true }) });
        gsap.to(tw, { rotation: dir * 14, duration: 2.6, ease: 'none' });
        gsap.to(tw, { y: y - 40, duration: 0.3, yoyo: true, repeat: 7, ease: 'sine.out' });
      });
    if (c.short) {
      roll(0.1, H * 0.86, 40, 1);
      return;
    }
    roll(2.2, H * 0.86, 46, 1);
    roll(3.3, H * 0.8, 30, -1);

    // he comes undone: the silhouette blows away into fibers…
    const cat = c.cat;
    const mk = new Container();
    c.fg.addChild(mk);
    cat.mask = mk;
    burst(c, c.fg, (i) => fiberG(i), 36, W / 2, c.catY, 760, 0.8);
    sfx('whoosh', 0.5);
    sfx('splash', 0.6);
    gsap.to(dust, { alpha: 0.3, duration: 0.3 });
    later(c, 0.25, () => word(c, 420, 300, '¡FSSSHH!', 0xe8d9b0, 90, 0.9));
    // …the grains stream back and knit him again, grain by grain
    const grains: { a: number; r: number; tx: number; ty: number; t0: number }[] = [];
    let added = 0;
    let batch: Graphics | null = null;
    let inBatch = 0;
    const pts: number[] = [];
    const T0 = 0.3;
    const T1 = 1.6;
    const stop = every(c, 40, (t) => {
      if (inflow.destroyed) return;
      if (t > T0 && t < T1) {
        for (let i = 0; i < 9; i++) grains.push({ a: Math.random() * Math.PI * 2, r: 700 + Math.random() * 300, tx: W / 2 + (Math.random() - 0.5) * CAT_R * 1.7, ty: c.catY + (Math.random() - 0.5) * CAT_R * 1.8, t0: t });
        // the mask fills up (more and more grains per frame)
        const p = (t - T0) / (T1 - T0);
        const want = Math.floor(850 * p * p);
        if (want > added && !mk.destroyed) {
          // grains go into the current batch (a new batch every 110 grains: few Graphics, small rebuilds)
          if (!batch || inBatch >= 110) {
            batch = new Graphics();
            mk.addChild(batch);
            inBatch = 0;
            pts.length = 0;
          }
          for (; added < want; added++, inBatch++) pts.push(W / 2 + (Math.random() - 0.5) * CAT_R * 2, c.catY + (Math.random() - 0.5) * CAT_R * 2, 11 + Math.random() * 10);
          batch.clear();
          for (let i = 0; i < pts.length; i += 3) batch.circle(pts[i], pts[i + 1], pts[i + 2]);
          batch.fill(0xffffff);
        }
      }
      inflow.clear();
      for (let i = grains.length - 1; i >= 0; i--) if ((t - grains[i].t0) / 0.55 >= 1) grains.splice(i, 1);
      for (let ci = 0; ci < 3; ci++) {
        let any = false;
        for (let i = ci; i < grains.length; i += 3) {
          const g = grains[i];
          const e = ((t - g.t0) / 0.55) ** 2;
          const ang = g.a + (1 - e) * 1.8;
          const sx = W / 2 + Math.cos(ang) * g.r;
          const sy = c.catY + Math.sin(ang) * g.r * 0.6;
          const x = sx + (g.tx - sx) * e;
          const y = sy + (g.ty - sy) * e;
          inflow.moveTo(x - 9, y).lineTo(x + 9, y - 3);
          any = true;
        }
        if (any) inflow.stroke({ width: 4, color: FIBER[ci + 1], alpha: 0.95 });
      }
    });
    later(c, 0.55, () => {
      const sh = txt('shhh… no lo mires', { fontFamily: F.ui, fontSize: 30, fill: 0x5b4a26, fontStyle: 'italic', letterSpacing: 2 });
      sh.anchor.set(0.5);
      sh.position.set(W / 2, H - 120);
      sh.alpha = 0;
      c.fg.addChild(sh);
      gsap.to(sh, { alpha: 0.9, duration: 0.3 });
      gsap.to(sh, { alpha: 0, delay: 0.9, duration: 0.3, onComplete: () => sh.destroy() });
    });
    gsap.to(FN, { k: 1, duration: 1.2, delay: 0.4, ease: 'power2.out' });
    for (let i = 0; i < 7; i++) later(c, 0.35 + i * 0.18, () => sfx('whoosh', 0.6 + i * 0.08));
    // whole again: a puff, the storm calms a little
    later(c, T1 + 0.02, () => {
      stop();
      if (!cat.destroyed) cat.mask = null;
      mk.destroy({ children: true });
      inflow.clear();
      sfx('pop', 0.6);
      sfx('boom', 1.5);
      c.shaker.add(0.25);
      const puff = new Graphics().ellipse(0, 0, 200, 60).stroke({ width: 16, color: 0xe8d9b0, alpha: 0.9 });
      puff.position.set(W / 2, feet);
      c.behind.addChild(puff);
      gsap.to(puff.scale, { x: 5, y: 3, duration: 0.6, ease: 'power2.out' });
      gsap.to(puff, { alpha: 0, duration: 0.6, onComplete: () => puff.destroy() });
      word(c, W / 2, 150, '¡TOLVANERA!', 0xe8d9b0, 112, 1.2);
      gsap.to(calm, { k: 0.4, duration: 1.2 });
      gsap.to(dust, { alpha: 0.08, duration: 1.0 });
    });
  },
  payoff(c: SigCtx) {
    const st = state.get(c);
    // two giant fists of wool rise out of the dunes and pound the ground
    const spots: [number, number][] = [
      [300, 1],
      [W - 300, -1],
    ];
    spots.forEach(([x, dir], i) => {
      const f = fist();
      f.scale.set(dir * 1.1, 1.1);
      f.position.set(x, H + 260);
      c.back.addChild(f);
      if (c.reduce) {
        f.y = H * 0.62;
        later(c, 1.2, () => gsap.to(f, { alpha: 0, duration: 0.3, onComplete: () => f.destroy({ children: true }) }));
        return;
      }
      const t0 = i * 0.12;
      // up out of the dunes, then it pounds the ground twice
      gsap.to(f, { y: H * 0.42, duration: 0.3, delay: t0, ease: 'power2.out' });
      gsap.to(f, { y: H * 0.66, duration: 0.14, delay: t0 + 0.36, ease: 'power3.in' });
      gsap.to(f, { y: H * 0.5, duration: 0.14, delay: t0 + 0.56, ease: 'power2.out' });
      gsap.to(f, { y: H * 0.66, duration: 0.12, delay: t0 + 0.72, ease: 'power3.in' });
      for (const at of [t0 + 0.5, t0 + 0.84])
        later(c, at, () => {
          sfx('boom', 0.8 + i * 0.1);
          sfx('hit', 0.6);
          c.shaker.add(0.4);
          burst(c, c.fg, (j) => fiberG(j + i), 14, x, H * 0.84, 520, 0.8);
          const puff = new Graphics().ellipse(0, 0, 160, 34).stroke({ width: 18, color: 0xe8d9b0, alpha: 0.85 });
          puff.position.set(x, H * 0.86);
          c.back.addChild(puff);
          gsap.to(puff.scale, { x: 3, y: 2, duration: 0.5, ease: 'power2.out' });
          gsap.to(puff, { alpha: 0, duration: 0.5, onComplete: () => puff.destroy() });
        });
      // and crumbles back to grains
      later(c, t0 + 1.15, () => {
        burst(c, c.back, (j) => fiberG(j), 22, x, H * 0.62, 360, 0.9);
        gsap.to(f.scale, { y: 0.2, duration: 0.45, ease: 'power2.in' });
        gsap.to(f, { alpha: 0, y: H * 0.8, duration: 0.45, ease: 'power2.in', onComplete: () => f.destroy({ children: true }) });
        sfx('splash', 0.7);
      });
    });
    if (st && !c.reduce) gsap.to(st.calm, { k: 1, duration: 0.3, yoyo: true, repeat: 1, repeatDelay: 0.6 });
    score(c, [
      [0, 'whoosh', 0.45],
      [0.1, 'charge', 0.7],
      [0.7, 'fanfare', 0.95],
    ]);
    cheer(c, '¡TORMENTA DE ESTAMBRE!', 0xe8d9b0, 110, 1.9);
    later(c, 1.0, () => word(c, CHEER[0] + 40, CHEER[1] + 110, '…y se volvió a enrollar.', C.ink, 44, 1.8, F.ui));
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const s = Math.max(0.3, Math.min(w, h) / 700);
    k.addChild(desert(w, h, s));
    const fn = new Graphics();
    const sc = Math.min(w, h) / 1000;
    fn.scale.set(sc);
    k.addChild(fn);
    const ring = new Graphics();
    k.addChild(ring);
    const cx = w / 2;
    const cy = h * 0.46;
    const draw = (t: number) => {
      funnel(fn, cx / sc, (h * 0.62) / sc, (h * 0.98) / sc, t, 1);
      ring.clear();
      for (let ci = 0; ci < FIBER.length; ci++) {
        for (let i = ci; i < 70; i += FIBER.length) {
          const o = ORBIT[i];
          const a = o.a0 + t * o.v * 0.5;
          const x = cx + Math.cos(a) * o.r * sc * 1.2;
          const y = cy + o.hy * sc * 0.8 + Math.sin(a) * o.r * sc * 0.25;
          ring.moveTo(x - 6 * s, y).lineTo(x + 6 * s, y + 2 * s);
        }
        ring.stroke({ width: Math.max(1.5, 3 * s), color: FIBER[ci], alpha: 0.85 });
      }
    };
    // a yarn tumbleweed in the foreground
    const tw = tumble(Math.max(8, Math.min(w, h) * 0.07));
    tw.position.set(w * 0.2, h * 0.88);
    k.addChild(tw);
    draw(0);
    if (live)
      cardLoop(k, 24, (t) => {
        draw(t);
        tw.x = ((w * 0.2 + t * w * 0.12) % (w * 1.3)) - w * 0.1;
        tw.rotation = t * 3;
      });
    return k;
  },
};

