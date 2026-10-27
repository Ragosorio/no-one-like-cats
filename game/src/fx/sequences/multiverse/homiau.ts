/** Homiau Gatson: the yellow universe. Blue sky with puffy clouds, a giant donut rolls in and becomes his disc, it rains donuts; ¡WUJÚ! */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, cover, drizzle, every, fall, later, score, word } from './kit';

const SKY = 0x6ec6f0;
const DOUGH = 0xe3a65b;
const FROST = 0xff8fc8;
const SPRINKLES = [0xff3b3b, 0x3bb4ff, 0xffe14d, 0x7be36b, 0xffffff, 0xb36bff];

/** a pink-frosted donut with sprinkles (r = outer radius) */
export function donut(r: number, seed = 1): Graphics {
  const g = new Graphics();
  const hole = r * 0.34;
  const ink = Math.max(3, r / 12);
  g.circle(0, 0, r).fill(DOUGH).circle(0, 0, hole).cut();
  g.circle(0, 0, r).stroke({ width: ink, color: C.ink });
  const pts: number[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const rr = r * (0.83 + 0.06 * Math.sin(a * 9 + seed));
    pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.poly(pts).fill(FROST).circle(0, 0, hole * 1.18).cut();
  g.arc(0, 0, r * 0.6, -2.6, -1.5).stroke({ width: r * 0.08, color: 0xffd3ea, cap: 'round' });
  let s = (seed * 7919) % 233280;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const L = Math.max(4, r * 0.1);
  for (let i = 0; i < Math.round(r / 2.6); i++) {
    const a = rnd() * Math.PI * 2;
    const d = hole * 1.3 + rnd() * (r * 0.74 - hole * 1.3);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const t = rnd() * Math.PI;
    g.moveTo(x - (Math.cos(t) * L) / 2, y - (Math.sin(t) * L) / 2)
      .lineTo(x + (Math.cos(t) * L) / 2, y + (Math.sin(t) * L) / 2)
      .stroke({ width: Math.max(2, r * 0.04), color: SPRINKLES[i % SPRINKLES.length], cap: 'round' });
  }
  g.circle(0, 0, hole).stroke({ width: ink, color: C.ink });
  return g;
}

/** a puffy, flat-bottomed cartoon cloud */
function cloud(w: number): Graphics {
  const g = new Graphics();
  const bumps: [number, number, number][] = [
    [-0.28, 0.02, 0.2],
    [0, -0.08, 0.3],
    [0.3, -0.14, 0.34],
    [0.6, -0.04, 0.26],
    [0.84, 0.04, 0.18],
  ];
  for (const [x, y, r] of bumps) g.circle(x * w, y * w + 0.05 * w, r * w).fill(0xbfe6f8);
  for (const [x, y, r] of bumps) g.circle(x * w, y * w, r * w).fill(0xffffff);
  g.rect(-0.46 * w, 0, 1.46 * w, 0.18 * w).fill(SKY);
  return g;
}

export const homiau: Signature = {
  dark: false,
  frame: 0xffd90f,
  tag: 'UNIVERSO AMARILLO',
  open(c: SigCtx) {
    const sky = new Container();
    sky.addChild(cover(SKY));
    const clouds: { g: Graphics; x0: number; v: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const g = cloud(220 + (i % 3) * 90);
      const x0 = (i / 7) * (W + 600) - 300;
      g.position.set(x0, 120 + ((i * 167) % 640));
      sky.addChild(g);
      clouds.push({ g, x0, v: 18 + (i % 3) * 10 });
    }
    c.back.addChild(sky);
    arrive(c, sky);
    if (!c.reduce) every(c, 30, (t) => clouds.forEach((k) => (k.g.x = ((k.x0 + t * k.v + 300) % (W + 600)) - 300)));
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.3 });

    // the giant donut rolls in and lands where his disc was
    const big = donut(330, 3);
    c.behind.addChild(big);
    big.position.set(W / 2, c.CY);
    if (!c.short && !c.reduce) {
      gsap.fromTo(big, { x: -420, rotation: -7 }, { x: W / 2, rotation: 0, duration: 0.75, delay: 0.45, ease: 'power2.out' });
      later(c, 1.18, () => {
        sfx('pop', 0.7);
        sfx('boom', 1.4);
        c.shaker.add(0.3);
        gsap.fromTo(big.scale, { x: 1.12, y: 0.86 }, { x: 1, y: 1, duration: 0.5, ease: 'elastic.out(1.2,0.4)' });
      });
    }
    gsap.to(big, { rotation: Math.PI * 2, duration: 40, ease: 'none', repeat: -1, delay: c.short ? 0 : 1.3 });
    if (c.short) return;

    word(c, 420, 250, '¡MMMH…!', 0xffd90f, 96, 1.3);
    score(c, [
      [0.1, 'nyam', 0.6],
      [0.45, 'nyam', 0.55],
      [0.5, 'whoosh', 0.7],
    ]);
    // it rains donuts: most behind the card, a few in front
    fall(c, c.back, (i) => donut(44 + ((i * 7) % 30), i + 1), { n: 18, over: 1.3, dur: 1.2, bounce: true, spin: 3 });
    fall(c, c.fg, (i) => donut(58 + ((i * 5) % 24), i + 40), { n: 7, over: 1.2, dur: 1.1, spin: 5 });
    later(c, 0.9, () => {
      for (let i = 0; i < 9; i++) later(c, i * 0.12, () => sfx('coin', 0.8 + i * 0.07));
    });
    later(c, 1.55, () => word(c, W / 2 + 470, 300, '¡DONAS!', FROST, 120, 1.1));
  },
  payoff(c: SigCtx) {
    sfx('nyam', 1.25);
    sfx('fanfare', 1.1);
    cheer(c, '¡WUJÚ!', 0xffd90f, 170, 1.8);
    burst(c, c.fg, (i) => donut(50 + (i % 3) * 12, i + 70), 12, W / 2, c.catY, 760, 1.2);
    // sprinkles everywhere
    burst(
      c,
      c.fg,
      (i) => new Graphics().roundRect(-9, -3, 18, 6, 3).fill(SPRINKLES[i % SPRINKLES.length]),
      40,
      W / 2,
      c.catY - 60,
      900,
      1.4,
    );
    c.shaker.add(0.35);
    drizzle(c, c.back, () => donut(40 + Math.random() * 26, Math.ceil(Math.random() * 99)), 0.45, 3.4);
  },
};
