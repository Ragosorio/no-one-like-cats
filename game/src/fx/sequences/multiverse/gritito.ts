/**
 * El Gritito: the scream universe (Munch, public domain). The sky paints itself in orange-and-red waves that never stop
 * moving, the dark blue fjord swirls, the bridge cuts the screen on a diagonal with two tiny gentlemen in top hats at
 * the far end — and the whole picture trembles, him included («como si lo hubieran pintado durante un temblor»). His
 * scream is silent at first: only echo rings, a heartbeat. Payoff: it breaks the silence — ¡AAAAAH!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, CHEER, every, later, score } from './kit';
import { borrowCat, letters, liveLoop, stash } from './kitB';

const ORANGE = 0xe8742e;
const NAVY = 0x1b2f4a;
const SKY = [0xc8382a, ORANGE, 0xf2a03a, 0xf2c230, 0xe85a2a, 0xd9482e, 0xf28a3a, 0xf6b53c, 0xd94a2a];
const BLUES = [0x2a4d6e, 0x3a6a8e, 0x16283e, 0x4a7a9a];
/** where his mouth is in his painting: the rings start there */
const MOUTH: [number, number] = [-12, -82];

/** a band that waves: a periodic stroke (period w/2) drawn once, wider than the screen, so scrolling it makes it travel */
interface Band {
  g: Graphics;
  y: number;
  dir: number;
  v: number;
  ph: number;
}

/** the sky: thick painted bands (drawn once; animate() scrolls them) */
function makeSky(w: number, h: number): { k: Container; bands: Band[] } {
  const k = new Container();
  k.addChild(new Graphics().rect(-80, -80, w + 160, 0.66 * h + 80).fill(0xd9482e));
  const n = 13;
  const sp = (0.6 * h) / n;
  const P = w / 2;
  const bands: Band[] = [];
  for (let i = 0; i < n; i++) {
    const g = new Graphics();
    g.moveTo(-P - 40, 0);
    for (let x = -P - 40; x <= w + P + 40; x += P / 16) g.lineTo(x, sp * 0.5 * Math.sin((x / P) * Math.PI * 2 + i * 0.9) + sp * 0.2 * Math.sin((x / P) * Math.PI * 4 + i));
    g.stroke({ width: sp * 1.35, color: SKY[i % SKY.length], cap: 'round', join: 'round' });
    const y = -0.02 * h + i * sp;
    g.y = y;
    k.addChild(g);
    bands.push({ g, y, dir: i % 2 ? 1 : -1, v: 0.05 + (i % 4) * 0.018, ph: i * 0.37 });
  }
  return { k, bands };
}

/** the fjord: dark water with swirling blue strokes (drawn once; animate() scrolls them) */
function makeFjord(w: number, h: number): { k: Container; bands: Band[] } {
  const k = new Container();
  const top: number[] = [];
  for (let x = 0.26 * w; x <= w + 80; x += w / 24) top.push(x, 0.5 * h + 0.03 * h * Math.sin((x / w) * 5 + 1) - 0.04 * h * ((x - 0.26 * w) / w));
  k.addChild(new Graphics().poly([...top, w + 80, 0.8 * h, 0.4 * w, 0.78 * h]).fill(0x1e3550));
  const P = w / 2;
  const bands: Band[] = [];
  const clip = new Graphics().poly([...top, w + 80, 0.8 * h, 0.4 * w, 0.78 * h]).fill(0xffffff);
  const inner = new Container();
  for (let j = 0; j < 7; j++) {
    const g = new Graphics();
    g.moveTo(-P, 0);
    for (let x = -P; x <= w + P; x += P / 14) g.lineTo(x, 0.012 * h * Math.sin((x / P) * Math.PI * 2 + j) + 0.006 * h * Math.sin((x / P) * Math.PI * 6 - j));
    g.stroke({ width: 0.016 * h, color: BLUES[j % BLUES.length], cap: 'round', join: 'round' });
    const y = 0.53 * h + j * 0.034 * h;
    g.y = y;
    g.rotation = -0.03;
    inner.addChild(g);
    bands.push({ g, y, dir: j % 2 ? -1 : 1, v: 0.04 + (j % 3) * 0.015, ph: j * 0.5 });
  }
  inner.addChild(clip);
  inner.mask = clip;
  k.addChild(inner);
  return { k, bands };
}

/** scroll the bands (t in seconds × speed); P = the period (w/2) */
function animate(bands: Band[], t: number, P: number, h: number) {
  for (const b of bands) {
    if (b.g.destroyed) continue;
    b.g.x = b.dir * ((t * b.v * P + b.ph * P) % P);
    b.g.y = b.y + Math.sin(t * 0.9 + b.ph * 3) * h * 0.006;
  }
}

/** the land, the bridge with its railing, the two gentlemen (static) */
function drawLand(w: number, h: number): { g: Graphics; men: Container[] } {
  const g = new Graphics();
  // the ground under everything (the picture trembles: it must not show its edges)
  g.rect(-80, 0.74 * h, w + 160, 0.26 * h + 80).fill(0x24331f);
  // the shore on the right, swirling green and ochre
  g.poly([0.4 * w, 0.82 * h, 0.68 * w, 0.62 * h, 0.84 * w, 0.57 * h, w + 80, 0.53 * h, w + 80, h + 80, 0.5 * w, h + 80]).fill(0x33402a);
  for (let k = 0; k < 4; k++) g.moveTo(0.6 * w + k * 0.04 * w, 0.76 * h - k * 0.02 * h).quadraticCurveTo(0.8 * w, 0.6 * h + k * 0.03 * h, w + 10, 0.58 * h + k * 0.05 * h).stroke({ width: 0.012 * h, color: k % 2 ? 0x7a6a2a : 0x4f5a2a, cap: 'round' });
  g.poly([0.1 * w, 0.58 * h, 0.2 * w, 0.52 * h, 0.34 * w, 0.53 * h, 0.36 * w, 0.6 * h]).fill(0x2f3d22);
  // the bridge, on a diagonal to the vanishing point
  const vx = 0.31 * w;
  const vy = 0.55 * h;
  g.poly([-80, h + 80, -80, 0.8 * h, vx - 0.01 * w, vy + 0.005 * h, vx + 0.03 * w, vy + 0.01 * h, 0.56 * w, h + 80]).fill(0xb8693a);
  for (let k = 0; k <= 8; k++) g.moveTo(vx + 0.01 * w, vy + 0.008 * h).lineTo(-0.05 * w + k * 0.075 * w, h + 10).stroke({ width: 0.006 * h, color: k % 2 ? 0x9a4a28 : 0xd8904e, alpha: 0.8 });
  for (let k = 0; k < 5; k++) g.moveTo(0.04 * w + k * 0.08 * w, h).quadraticCurveTo(0.26 * w + k * 0.04 * w, 0.8 * h, vx + 0.02 * w, vy + 0.01 * h).stroke({ width: 0.01 * h, color: 0xe8a858, alpha: 0.4 });
  // the railing: two rails and posts, thick near, thin far
  const rail = (y0: number, y1: number, wid: number, col: number) => g.poly([-80, y0 - wid, vx, y1 - wid * 0.15, vx, y1 + wid * 0.15, -80, y0 + wid]).fill(col);
  const yA0 = 0.6 * h;
  const yA1 = vy - 0.04 * h;
  const yB0 = 0.79 * h;
  const yB1 = vy - 0.004 * h;
  for (let k = 0; k < 18; k++) {
    const u = 1 - Math.pow(1 - k / 18, 1.7);
    const x = vx * u;
    g.moveTo(x, yA0 + (yA1 - yA0) * u).lineTo(x, yB0 + (yB1 - yB0) * u).stroke({ width: Math.max(2, 0.012 * h * (1 - u * 0.85)), color: 0x2a140c });
  }
  // a diagonal brace between the rails, and the rails themselves (a lit top edge)
  g.moveTo(0, yA0 + 0.02 * h).lineTo(vx, yB1).stroke({ width: Math.max(2, 0.008 * h), color: 0x3a1c10 });
  rail(yB0, yB1, 0.011 * h, 0x3a1c10);
  rail(yA0, yA1, 0.019 * h, 0x4a2414);
  g.poly([-80, yA0 - 0.019 * h, vx, yA1 - 0.003 * h, vx, yA1, -80, yA0 - 0.008 * h]).fill(0xd8844a);
  // two tiny gentlemen with top hats at the far end (cats, of course)
  const men: Container[] = [];
  for (const [mx, s] of [
    [vx - 0.06 * w, 1],
    [vx - 0.03 * w, 0.9],
  ] as const) {
    const m = new Container();
    const s0 = 0.05 * h * s;
    const b = new Graphics()
      .roundRect(-s0 * 0.22, -s0 * 0.75, s0 * 0.44, s0 * 0.75, s0 * 0.15)
      .fill(0x10182a)
      .circle(0, -s0 * 0.88, s0 * 0.17)
      .fill(0x10182a)
      .poly([-s0 * 0.15, -s0 * 1.0, -s0 * 0.12, -s0 * 1.12, -s0 * 0.04, -s0 * 1.02])
      .fill(0x10182a)
      .rect(-s0 * 0.14, -s0 * 1.32, s0 * 0.28, s0 * 0.3)
      .fill(0x0a0f1c)
      .rect(-s0 * 0.22, -s0 * 1.04, s0 * 0.44, s0 * 0.06)
      .fill(0x0a0f1c);
    m.addChild(b);
    m.position.set(mx, vy + 0.012 * h);
    men.push(m);
  }
  return { g, men };
}

/** an echo ring: a wavy circle */
function ring(g: Graphics, x: number, y: number, r: number, ph: number, color: number, width: number, alpha: number) {
  const pts: number[] = [];
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    const rr = r + r * 0.05 * Math.sin(a * 6 + ph) + r * 0.03 * Math.sin(a * 3 - ph * 1.4);
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.92);
  }
  g.poly(pts).stroke({ width: width * 1.6, color: NAVY, alpha: alpha * 0.55 });
  g.poly(pts).stroke({ width, color, alpha });
}

interface St {
  speed: { k: number };
  wob: { k: number };
  blast: (n: number, gap: number, life: number) => void;
  men: Container[];
}
const S = stash<St>();
/** the borrowed cat of each open reveal (the payoff gives it back if the takeover was skipped) */
const gritBorrow = new WeakMap<Container, ReturnType<typeof borrowCat>>();

export const gritito: Signature = {
  dark: true,
  frame: ORANGE,
  tag: 'UNIVERSO ALARIDO',
  open(c: SigCtx) {
    const k = new Container();
    const sky = makeSky(W, H);
    const fj = makeFjord(W, H);
    const land = drawLand(W, H);
    k.addChild(sky.k, fj.k, land.g, ...land.men);
    animate(sky.bands, 0, W / 2, H);
    animate(fj.bands, 0, W / 2, H);
    c.back.addChild(k);
    k.pivot.set(W / 2, H / 2);
    k.position.set(W / 2, H / 2);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.25 });
    // the rings live behind him, where his disc was
    const rg = new Graphics();
    c.behind.addChild(rg);
    const mx = W / 2 + MOUTH[0];
    const my = c.catY + MOUTH[1];
    const rings: { t0: number; life: number; color: number }[] = [];
    let now = 0;
    const blast = (n: number, gap: number, life: number) => {
      for (let i = 0; i < n; i++) later(c, i * gap, () => rings.push({ t0: now, life, color: [0xf2c230, ORANGE, BLUES[0], 0xf6e3a0][rings.length % 4] }));
    };
    const speed = { k: 1 };
    const wob = { k: c.short ? 0.5 : 1 };
    S.set(c, { speed, wob, blast, men: land.men });
    if (c.reduce) {
      // still: three rings painted where the scream would be
      [180, 330, 500].forEach((r, i) => ring(rg, mx, my, r, i, [0xf2c230, ORANGE, BLUES[0]][i], 18, 0.9 - i * 0.2));
    } else {
      let ph = 0;
      let last = 0;
      every(c, 30, (t) => {
        const dt = t - last;
        last = t;
        now = t;
        ph += dt * speed.k;
        speed.k += (1 - speed.k) * Math.min(1, dt * 1.5);
        wob.k += ((c.short ? 0.5 : 1) - wob.k) * Math.min(1, dt * 1.2);
        if (k.destroyed) return;
        animate(sky.bands, ph, W / 2, H);
        animate(fj.bands, ph, W / 2, H);
        // the whole picture trembles
        k.skew.set(0.022 * wob.k * Math.sin(t * 2.6), 0.01 * wob.k * Math.sin(t * 3.1 + 1));
        rg.clear();
        for (let i = rings.length - 1; i >= 0; i--) {
          const r = rings[i];
          const u = (t - r.t0) / r.life;
          if (u >= 1) {
            rings.splice(i, 1);
            continue;
          }
          ring(rg, mx, my, 40 + u * 1100, t * 3 + i, r.color, 22 * (1 - u * 0.5), 1 - u * u);
        }
      });
    }
    if (c.short) {
      if (!c.reduce) every(c, 1 / 0.9, () => blast(1, 0, 2.4));
      return;
    }

    // the takeover: the picture trembles, the scream is silent — rings, a heartbeat
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.35 });
      const cat = borrowCat(c);
      every(c, 60, (t) => {
        if (cat.given) return;
        const fade = t < 1.75 ? 1 : Math.max(0, 1 - (t - 1.75) / 0.4);
        c.cat.skew.set(0.075 * fade * Math.sin(t * 4.4), 0.03 * fade * Math.sin(t * 3.3 + 1));
      });
      later(c, 2.2, () => cat.give());
      gritBorrow.set(c.root, cat);
      for (let i = 0; i < 7; i++) later(c, 0.3 + i * 0.27, () => blast(1, 0, 1.7));
    }
    score(c, [
      [0.05, 'purr', 0.45],
      [0.6, 'boom', 0.3],
      [0.78, 'boom', 0.26],
      [1.35, 'boom', 0.3],
      [1.53, 'boom', 0.26],
      [1.95, 'purr', 0.6],
    ]);
    // «¿oíste eso?», trembling
    later(c, 0.85, () => {
      const q = letters('¿oíste eso?', 60, 0xffe9a0, F.brush, NAVY, 8);
      q.k.position.set(440, 210);
      q.k.rotation = -0.06;
      c.fg.addChild(q.k);
      if (!c.reduce) {
        const stop = every(c, 30, (t) => {
          if (q.k.destroyed) return stop();
          q.ts.forEach((l, i) => (l.y = Math.sin(t * 7 + i * 0.8) * 6));
        });
        gsap.from(q.k, { alpha: 0, duration: 0.3 });
      }
      gsap.to(q.k, { alpha: 0, delay: 1.0, duration: 0.35, onComplete: () => destroyTree(q.k) });
    });
  },
  payoff(c: SigCtx) {
    gritBorrow.get(c.root)?.give();
    const st = S.get(c);
    sfx('charge', 1.6);
    sfx('crit', 0.8);
    sfx('whoosh', 0.6);
    later(c, 0.15, () => sfx('sting', 1.4));
    c.shaker.add(0.5);
    if (st) {
      st.speed.k = 6;
      st.wob.k = 3.2;
      if (!c.reduce) st.blast(7, 0.07, 1.1);
      // the two gentlemen jump
      st.men.forEach((m, i) => {
        if (m.destroyed) return;
        const bang = new Graphics().roundRect(-5, -40, 10, 26, 4).fill(0xffe9a0).circle(0, -6, 5).fill(0xffe9a0);
        bang.position.set(0, -H * 0.075);
        m.addChild(bang);
        if (!c.reduce) gsap.fromTo(m, { y: m.y - 26 }, { y: m.y, duration: 0.45, delay: i * 0.08, ease: 'bounce.out' });
        gsap.to(bang, { alpha: 0, delay: 1.8, duration: 0.3, onComplete: () => destroyTree(bang) });
      });
    }
    // ¡AAAAAH!, every letter trembling in the wave
    const wd = letters('¡AAAAAH!', 150, ORANGE, F.brush, NAVY, 16);
    wd.ts.forEach((l, i) => (l.style.fill = i % 2 ? 0xf2c230 : ORANGE));
    const s0 = Math.min(1, 720 / wd.width);
    wd.k.scale.set(s0);
    wd.k.position.set(CHEER[0], CHEER[1]);
    wd.k.rotation = -0.05;
    c.fg.addChild(wd.k);
    gsap.fromTo(wd.k.scale, { x: s0 * 0.3, y: s0 * 0.3 }, { x: s0, y: s0, duration: 0.5, ease: 'elastic.out(1.2,0.4)' });
    if (!c.reduce) {
      const stop = every(c, 30, (t) => {
        if (wd.k.destroyed) return stop();
        wd.ts.forEach((l, i) => {
          l.y = Math.sin(t * 9 + i * 0.7) * 16;
          l.rotation = Math.sin(t * 7 + i) * 0.12;
        });
      });
    }
    gsap.to(wd.k, { alpha: 0, delay: 2.3, duration: 0.5, onComplete: () => destroyTree(wd.k) });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const sky = makeSky(w, h);
    const fj = makeFjord(w, h);
    animate(sky.bands, 0, w / 2, h);
    animate(fj.bands, 0, w / 2, h);
    const land = drawLand(w, h);
    const rg = new Graphics();
    const r0 = Math.min(w, h);
    [0.36, 0.52].forEach((r, i) => ring(rg, w / 2, h * 0.42, r0 * r, i, [0xf2c230, BLUES[0]][i], r0 * 0.02, 0.6));
    k.addChild(sky.k, fj.k, land.g, ...land.men, rg);
    if (live)
      liveLoop(k, 30, (t) => {
        animate(sky.bands, t, w / 2, h);
        animate(fj.bands, t, w / 2, h);
      });
    return k;
  },
};
