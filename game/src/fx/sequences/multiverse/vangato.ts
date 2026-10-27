/** Vincent van Gato: the brush universe. The sky paints itself stroke by stroke in swirls, stars with halos, a cypress grows, a great swirl behind him; sunflowers bloom and he signs it */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, cover, later, score, word } from './kit';

const BLUE = 0x1b3a8a;
const YELLOW = 0xf6d55c;
const SKY = [0x1d3f9a, 0x2a55b8, 0x3e74d1, 0x6a9be6, 0xa9c8f0, 0xe8e2b0];
/** the swirls the strokes follow: [x, y, strength] */
const VORTEX: [number, number, number][] = [
  [760, 330, 1],
  [1260, 250, 0.7],
  [420, 160, 0.5],
];

/** flow direction at (x,y): the swirls' tangents plus a wind to the right */
function flow(x: number, y: number) {
  let dx = 0.6;
  let dy = 0.05 * Math.sin(x * 0.01);
  let near = 0;
  for (const [vx, vy, s] of VORTEX) {
    const rx = x - vx;
    const ry = y - vy;
    const d2 = rx * rx + ry * ry + 900;
    const k = (s * 26000) / d2;
    dx += -ry * k * 0.01;
    dy += rx * k * 0.01;
    near = Math.max(near, (s * 160) / Math.sqrt(d2));
  }
  const L = Math.hypot(dx, dy) || 1;
  return { ux: dx / L, uy: dy / L, near };
}

/** the sky as `batches` Graphics of short brush strokes along the flow */
function sky(batches: number): Graphics[] {
  const out = Array.from({ length: batches }, () => new Graphics());
  let i = 0;
  for (let y = 10; y < 760; y += 30) {
    for (let x = -10; x < W + 20; x += 34) {
      const jx = x + ((i * 37) % 19) - 9;
      const jy = y + ((i * 53) % 17) - 8;
      const { ux, uy, near } = flow(jx, jy);
      const len = 22 + ((i * 7) % 18);
      const ci = Math.min(SKY.length - 1, Math.floor(near * 3.2 + (jy < 400 ? 1 : 0) + ((i * 13) % 3) * 0.5));
      const g = out[i % batches];
      const mx = jx + ux * len * 0.5 - uy * 5;
      const my = jy + uy * len * 0.5 + ux * 5;
      g.moveTo(jx, jy).quadraticCurveTo(mx, my, jx + ux * len, jy + uy * len).stroke({ width: 8 + (i % 3), color: SKY[ci], cap: 'round' });
      i++;
    }
  }
  return out;
}

/** a star with concentric halos */
function star(r: number): Graphics {
  const g = new Graphics();
  for (let k = 3; k >= 1; k--) g.circle(0, 0, r + k * 13).stroke({ width: 6, color: k === 1 ? YELLOW : 0xe8e2b0, alpha: 0.75 - k * 0.15 });
  return g.circle(0, 0, r).fill(YELLOW).circle(0, 0, r * 0.45).fill(0xffffff);
}

/** the great swirl behind him: a spiral of strokes */
function swirl(): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 160; i++) {
    const a = i * 0.21;
    const r = 30 + i * 1.9;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    g.moveTo(x, y)
      .lineTo(x + Math.cos(a + Math.PI / 2) * 26, y + Math.sin(a + Math.PI / 2) * 26)
      .stroke({ width: 9, color: SKY[2 + (i % 4)], cap: 'round' });
  }
  return g;
}

/** a cypress: a dark green flame */
function cypress(): Graphics {
  const g = new Graphics().poly([0, 0, -70, -10, -90, -240, -60, -420, -36, -640, 0, -820, 30, -600, 58, -380, 80, -200, 66, -6]).fill(0x10301c);
  for (let i = 0; i < 14; i++) g.moveTo(-40 + (i % 3) * 30, -60 - i * 52).quadraticCurveTo(-10 + (i % 2) * 20, -90 - i * 52, 20 - (i % 3) * 10, -70 - i * 52).stroke({ width: 7, color: 0x1f4a2a, cap: 'round' });
  return g;
}

/** a sunflower */
function sunflower(r: number): Container {
  const k = new Container();
  for (let i = 0; i < 16; i++) {
    const p = new Graphics().ellipse(0, 0, r * 0.55, r * 0.22).fill(0xf4b81f).stroke({ width: 3, color: C.ink });
    const a = (i / 16) * Math.PI * 2;
    p.position.set(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
    p.rotation = a;
    k.addChild(p);
  }
  const head = new Graphics().circle(0, 0, r * 0.62).fill(0x6b3f1d).stroke({ width: 4, color: C.ink });
  for (let i = 0; i < 18; i++) head.circle(Math.cos(i * 2.4) * r * 0.4 * Math.sqrt(i / 18), Math.sin(i * 2.4) * r * 0.4 * Math.sqrt(i / 18), 3).fill(0x3f2410);
  k.addChild(head);
  return k;
}

export const vangato: Signature = {
  dark: true,
  frame: 0xd9a43a,
  tag: 'UNIVERSO PINCEL',
  open(c: SigCtx) {
    const k = new Container();
    k.addChild(cover(BLUE));
    const strokes = sky(8);
    k.addChild(...strokes);
    const village = new Graphics().poly([0, 760, 300, 720, 700, 750, 1100, 715, 1500, 745, W, 720, W, H, 0, H]).fill(0x1a2340);
    for (let i = 0; i < 26; i++) {
      const x = 380 + i * 50;
      const h = 30 + (i % 4) * 12;
      village.rect(x, 860 - h, 38, h).fill(0x2a3a6a).poly([x - 4, 860 - h, x + 19, 860 - h - 22, x + 42, 860 - h]).fill(0x16204a);
      if (i % 3) village.rect(x + 14, 860 - h + 10, 10, 10).fill(YELLOW);
    }
    k.addChild(village);
    const moon = new Graphics().circle(0, 0, 58).fill(YELLOW).circle(-22, -10, 50).cut();
    moon.position.set(W - 230, 150);
    const halo = new Graphics().circle(0, 0, 84).stroke({ width: 10, color: 0xe8e2b0, alpha: 0.6 }).circle(0, 0, 108).stroke({ width: 8, color: YELLOW, alpha: 0.35 });
    halo.position.copyFrom(moon.position);
    k.addChild(halo, moon);
    const stars = [
      [300, 120, 16],
      [560, 220, 12],
      [980, 120, 14],
      [1180, 420, 11],
      [1460, 160, 15],
      [1640, 380, 12],
      [200, 420, 10],
      [860, 470, 9],
    ].map(([x, y, r]) => {
      const s = star(r);
      s.position.set(x, y);
      k.addChild(s);
      return s;
    });
    const cy = cypress();
    cy.position.set(220, H);
    k.addChild(cy);
    c.back.addChild(k);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.4 });
    const sw = swirl();
    sw.position.set(W / 2, c.CY);
    c.behind.addChild(sw);
    gsap.to(sw, { rotation: Math.PI * 2, duration: 30, repeat: -1, ease: 'none' });
    const twinkle = (s: Graphics) => gsap.to(s.scale, { x: 1.1, y: 1.1, duration: 0.9 + Math.random() * 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    if (c.short || c.reduce) {
      if (!c.reduce) stars.forEach(twinkle);
      return;
    }

    // the canvas paints itself: a great yellow swoosh, then the sky in batches
    const swoosh = new Graphics().moveTo(-100, 520).quadraticCurveTo(W / 2, 200, W + 100, 480).stroke({ width: 70, color: YELLOW, cap: 'round' });
    c.fg.addChild(swoosh);
    gsap.fromTo(swoosh, { alpha: 1 }, { alpha: 0, duration: 0.5, delay: 0.25, onComplete: () => swoosh.destroy() });
    k.alpha = 1;
    for (const g of strokes) g.alpha = 0;
    for (const s of stars) s.visible = false;
    village.alpha = 0;
    moon.alpha = 0;
    halo.alpha = 0;
    cy.scale.y = 0;
    sw.alpha = 0;
    strokes.forEach((g, i) => gsap.to(g, { alpha: 1, duration: 0.2, delay: 0.15 + i * 0.13 }));
    for (let i = 0; i < 8; i++) later(c, 0.15 + i * 0.13, () => sfx(i % 2 ? 'pencil' : 'nib', 0.7 + i * 0.05));
    gsap.to(village, { alpha: 1, duration: 0.4, delay: 0.9 });
    gsap.to(sw, { alpha: 1, duration: 0.6, delay: 0.7 });
    stars.forEach((s, i) =>
      later(c, 1.0 + i * 0.08, () => {
        s.visible = true;
        gsap.fromTo(s.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2.5)', onComplete: () => !s.destroyed && twinkle(s) });
        sfx('tick', 1.8 + i * 0.12);
      }),
    );
    gsap.to([moon, halo], { alpha: 1, duration: 0.4, delay: 1.3 });
    gsap.to(cy.scale, { y: 1, duration: 0.6, delay: 1.35, ease: 'back.out(1.4)' });
    later(c, 1.6, () => word(c, W / 2, 150, '¡MIRA ESE CIELO!', YELLOW, 92, 1.2, F.brush));
    score(c, [[0.05, 'whoosh', 0.9]]);
  },
  payoff(c: SigCtx) {
    sfx('reveal', 1.1);
    sfx('gem', 0.9);
    // sunflowers bloom around the bottom of the canvas
    const spots: [number, number, number][] = [
      [470, H - 150, 62],
      [610, H - 70, 48],
      [1450, H - 150, 62],
      [1310, H - 70, 48],
      [360, H - 50, 40],
      [1560, H - 50, 40],
    ];
    spots.forEach(([x, y, r], i) => {
      const f = sunflower(r);
      f.position.set(x, y);
      f.rotation = (Math.random() - 0.5) * 0.4;
      c.back.addChild(f);
      gsap.fromTo(f.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: c.reduce ? 0.01 : 0.45, delay: c.reduce ? 0 : i * 0.08, ease: 'back.out(2)' });
    });
    // and he signs the canvas
    const sig = txt('van Gato', { fontFamily: F.brush, fontSize: 44, fill: 0xc8282e });
    sig.anchor.set(1, 0.5);
    sig.position.set(W / 2 + 290, c.CY + 300);
    sig.rotation = -0.06;
    c.fg.addChild(sig);
    if (!c.reduce) gsap.fromTo(sig, { alpha: 0 }, { alpha: 1, duration: 0.5, delay: 0.5 });
    later(c, 0.5, () => sfx('pencil', 1.1));
  },
};
