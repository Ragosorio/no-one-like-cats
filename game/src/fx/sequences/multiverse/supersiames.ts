/** Super Siamés: the training universe. An anime wasteland, the power-up: a golden aura, rocks floating, the ground cracks, a scream that won't end; ¡PASÓ DE NUEVE! */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { speedLines } from '../../juice';
import { type Signature, type SigCtx, CHEER, SIG_LEN, arrive, bolt, cheer, cover, every, flashOf, later, score, word } from './kit';
import { liveLoop, seeded } from '../../../panels/collection/cardArt';

const GOLD = 0xffd23a;

/** the wasteland: a banded sunset sky, mesas, cracked ground */
function wasteland(): Container {
  const k = new Container();
  k.addChild(cover(0xffd36b));
  const bands = [0xff7a1a, 0xff8d24, 0xffa032, 0xffb444, 0xffc657];
  const sky = new Graphics();
  bands.forEach((b, i) => sky.rect(0, i * 110, W, 112).fill(b));
  k.addChild(sky);
  const mesas = new Graphics();
  mesas.poly([0, 760, 120, 610, 330, 600, 420, 760]).poly([1380, 760, 1460, 560, 1700, 545, 1790, 760]).poly([520, 760, 600, 680, 760, 672, 820, 760]).fill(0xa8582a);
  mesas.poly([1500, 760, 1530, 640, 1600, 760]).fill(0x8a4520);
  k.addChild(mesas);
  const ground = new Graphics().rect(0, 760, W, H - 760).fill(0xc77a3a);
  for (let i = 0; i < 9; i++) ground.rect(0, 780 + i * 34, W, 3).fill({ color: 0xa8612b, alpha: 0.5 });
  k.addChild(ground);
  return k;
}

/** the aura: a flame drawn around (0,0), flickering with time `t`, `size` 0..1.3 */
function aura(g: Graphics, t: number, size: number) {
  g.clear();
  if (size <= 0.01) return;
  for (const [sx, col, alpha] of [
    [1, 0xffb020, 0.7],
    [0.85, GOLD, 0.75],
    [0.62, 0xfff3a0, 0.85],
  ] as const) {
    const pts: number[] = [];
    const N = 34;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const up = Math.max(0, -Math.sin(a));
      const spike = i % 2 ? 1 : 0.82;
      const flick = 1 + 0.1 * Math.sin(t * 17 + i * 2.1) + 0.06 * Math.sin(t * 29 + i);
      const rx = 190 * sx * size * (1 + 0.15 * up * spike) * flick;
      const ry = 300 * sx * size * (1 + 0.55 * up * spike) * flick;
      pts.push(Math.cos(a) * rx, Math.sin(a) * ry - 40 * size);
    }
    g.poly(pts).fill({ color: col, alpha });
  }
}

/** a floating rock */
function rock(r: number): Graphics {
  const g = new Graphics();
  const pts: number[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const rr = r * (0.7 + Math.random() * 0.45);
    pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return g.poly(pts).fill(0x9a5a2c).stroke({ width: 4, color: C.ink });
}

export const supersiames: Signature = {
  dark: false,
  frame: 0x2457c5,
  tag: 'UNIVERSO SÚPER',
  open(c: SigCtx) {
    const k = wasteland();
    c.back.addChild(k);
    arrive(c, k, 0.3);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.3 });
    const g = new Graphics();
    g.position.set(W / 2, c.catY + 30);
    c.behind.addChild(g);
    const sparks = new Graphics();
    c.behind.addChild(sparks);
    const p = { size: c.short || c.reduce ? 1 : 0.25 };
    // the aura lives for as long as the card is up
    every(c, 30, (t) => {
      if (g.destroyed) return;
      aura(g, c.reduce ? 0 : t, p.size);
      sparks.clear();
      if (!c.reduce && p.size > 0.8 && Math.random() < 0.45) {
        const a = Math.random() * Math.PI * 2;
        const x0 = W / 2 + Math.cos(a) * 160;
        const y0 = c.catY + Math.sin(a) * 240;
        bolt(sparks, x0, y0, x0 + Math.cos(a) * 120, y0 + Math.sin(a) * 120, 0xbfe9ff, 5, 5, 30);
      }
    });
    if (c.short) return;
    if (!c.reduce) gsap.to(p, { size: 1, duration: 1.7, ease: 'power2.in' });

    // the silhouette trembles harder and harder
    const cat = c.cat;
    if (!c.reduce) {
      const stop = every(c, 40, (t) => {
        if (cat.destroyed) return;
        const amp = Math.min(1, t / 2) * 6;
        cat.x = W / 2 + (Math.random() - 0.5) * amp;
      });
      later(c, SIG_LEN, () => {
        stop();
        if (!cat.destroyed) cat.x = W / 2;
      });
      for (let i = 0; i < 6; i++) later(c, 0.3 + i * 0.3, () => c.shaker.add(0.08 + i * 0.03));
    }
    // rocks lift off the ground
    if (!c.reduce)
      for (let i = 0; i < 16; i++) {
        const r = rock(14 + Math.random() * 26);
        r.position.set(W / 2 + (Math.random() - 0.5) * 1300, H - 40 - Math.random() * 120);
        c.back.addChild(r);
        gsap.to(r, { y: r.y - 260 - Math.random() * 420, rotation: (Math.random() - 0.5) * 3, duration: 2.2 + Math.random(), delay: 0.2 + Math.random() * 0.6, ease: 'sine.out' });
        gsap.to(r, { y: '-=14', duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 3.2 });
      }
    // the ground cracks under him
    later(c, 1.0, () => {
      const cr = new Graphics();
      for (let i = 0; i < 6; i++) {
        const dir = i % 2 ? 1 : -1;
        bolt(cr, W / 2, 800, W / 2 + dir * (300 + i * 90), 790 + i * 40, C.ink, 6 - i * 0.5, 7, 34);
      }
      cr.pivot.set(W / 2, 0);
      cr.x = W / 2;
      c.back.addChild(cr);
      if (!c.reduce) gsap.from(cr.scale, { x: 0.2, duration: 0.25, ease: 'power3.out' });
      sfx('boom', 0.7);
    });
    // the scream gets longer
    const scream = txt('¡AA', { fontFamily: F.comic, fontSize: 120, fill: GOLD, stroke: { color: C.ink, width: 14, join: 'round' }, letterSpacing: 2 });
    scream.anchor.set(0.5);
    scream.position.set(W / 2, 150);
    c.fg.addChild(scream);
    const n = { a: 2 };
    gsap.to(n, {
      a: 13,
      duration: 1.9,
      ease: 'none',
      onUpdate: () => {
        if (scream.destroyed) return;
        scream.text = `¡${'A'.repeat(Math.round(n.a))}H!`;
        scream.scale.set(Math.min(1, 1500 / scream.width) * (0.8 + n.a * 0.02));
        scream.rotation = (Math.random() - 0.5) * 0.04;
      },
      onComplete: () => gsap.to(scream, { alpha: 0, duration: 0.3, onComplete: () => scream.destroy() }),
    });
    score(c, [
      [0.1, 'charge', 0.7],
      [0.75, 'charge', 0.95],
      [1.35, 'charge', 1.3],
      [1.3, 'zap', 1.4],
      [1.55, 'zap', 1.7],
      [1.8, 'zap', 1.2],
      [2.0, 'zap', 2],
    ]);
    later(c, 1.6, () => !c.reduce && speedLines(c.fg, W / 2, c.catY, 0xffffff, 60, 0.6));
  },
  payoff(c: SigCtx) {
    sfx('bigboom');
    sfx('fanfare', 1.2);
    flashOf(c, 0xfff6c8, 0.9, 0.6);
    c.shaker.add(0.6);
    for (let i = 0; i < 2; i++) {
      const ring = new Graphics().circle(0, 0, 100).stroke({ width: 18 - i * 8, color: i ? 0xffffff : GOLD });
      ring.position.set(W / 2, c.catY);
      c.fg.addChild(ring);
      gsap.fromTo(ring.scale, { x: 0.3, y: 0.3 }, { x: 9, y: 9, duration: 0.8 + i * 0.2, ease: 'power2.out' });
      gsap.to(ring, { alpha: 0, duration: 0.8 + i * 0.2, onComplete: () => ring.destroy() });
    }
    cheer(c, '¡PASÓ DE NUEVE!', GOLD, 110, 1.6);
    later(c, 1.0, () => word(c, CHEER[0] + 40, CHEER[1] + 110, '…vidas, digo.', C.paper, 46, 1.8, F.ui));
  },
  card(w, h, live) {
    const k = new Container();
    const m = Math.min(w, h);
    const cx = w / 2;
    const cy = h * 0.54;
    const hz = h * 0.72;
    const sky = new Graphics();
    const sb = [0xff7a1a, 0xff8d24, 0xffa032, 0xffb444, 0xffc657, 0xffd36b];
    sb.forEach((b, i) => sky.rect(0, (i * hz) / sb.length, w, hz / sb.length + 1).fill(b));
    k.addChild(sky);
    const mesas = new Graphics();
    mesas
      .poly([0, hz, w * 0.06, hz - h * 0.15, w * 0.17, hz - h * 0.16, w * 0.22, hz])
      .poly([w * 0.72, hz, w * 0.76, hz - h * 0.19, w * 0.89, hz - h * 0.2, w * 0.93, hz])
      .poly([w * 0.27, hz, w * 0.31, hz - h * 0.08, w * 0.4, hz - h * 0.085, w * 0.43, hz])
      .fill(0xa8582a);
    k.addChild(mesas);
    const ground = new Graphics().rect(0, hz, w, h - hz).fill(0xc77a3a);
    for (let i = 0; i < 6; i++) ground.rect(0, hz + (h - hz) * (0.12 + i * 0.15), w, Math.max(1, m * 0.006)).fill({ color: 0xa8612b, alpha: 0.5 });
    k.addChild(ground);
    // the ground cracks under him
    const cr = new Graphics();
    for (let i = 0; i < 6; i++) {
      const dir = i % 2 ? 1 : -1;
      bolt(cr, cx, hz + (h - hz) * 0.35, cx + dir * (w * 0.16 + i * w * 0.05), hz + (h - hz) * (0.25 + i * 0.12), C.ink, Math.max(1, m * (0.012 - i * 0.001)), 7, m * 0.04);
    }
    k.addChild(cr);
    // the golden aura (drawn at the reveal's size, scaled to the card)
    const au = new Graphics();
    const AS = h / 890;
    au.scale.set(AS);
    au.position.set(cx, cy + h * 0.06);
    k.addChild(au);
    const sparks = new Graphics();
    k.addChild(sparks);
    // rocks floating up
    const r = seeded(3);
    const rocks = Array.from({ length: 7 }, (_, i) => {
      const g = rock(30);
      g.scale.set((m * (0.03 + r() * 0.035)) / 30);
      const side = i % 2 ? 1 : -1;
      g.position.set(cx + side * (m * 0.3 + r() * Math.max(m * 0.1, w / 2 - m * 0.3)), h * (0.2 + r() * 0.55));
      g.rotation = r() * 6;
      k.addChild(g);
      return { g, y0: g.y, p: r() * 6 };
    });
    if (live)
      liveLoop(k, (t) => {
        aura(au, t, 1);
        for (const p of rocks) p.g.y = p.y0 + Math.sin(t * 1.6 + p.p) * m * 0.02;
        sparks.clear();
        if (Math.random() < 0.35) {
          const a = Math.random() * Math.PI * 2;
          const x0 = cx + Math.cos(a) * m * 0.2;
          const y0 = cy + Math.sin(a) * m * 0.3;
          bolt(sparks, x0, y0, x0 + Math.cos(a) * m * 0.14, y0 + Math.sin(a) * m * 0.14, 0xbfe9ff, Math.max(1, m * 0.006), 5, m * 0.03);
        }
      });
    else aura(au, 0.7, 1);
    return k;
  },
};
