/** Harry Gatter: the magic universe. A castle night with floating candles, a whirl of sealed letters around him, a golden bolt; ¡EXPELLIARMIAU! */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { sparkles } from '../../juice';
import { type Signature, type SigCtx, arrive, backlight, cheer, cover, every, flashOf, later, score, word } from './kit';
import { bands, glow, liveLoop, seeded } from '../../../panels/collection/cardArt';

const GOLD = 0xffd56b;

/** the castle night: sky, stars, moon, towers with conical roofs, warm windows */
function castleNight(): Container {
  const k = new Container();
  k.addChild(cover(0x1a1440));
  k.addChild(new Graphics().rect(0, H * 0.55, W, H * 0.45).fill({ color: 0x2a1f5c, alpha: 0.6 }));
  const stars = new Graphics();
  for (let i = 0; i < 90; i++) stars.circle((i * 211) % W, (i * 97) % 620, 1.5 + (i % 3)).fill({ color: 0xffffff, alpha: 0.5 + (i % 4) * 0.12 });
  k.addChild(stars);
  const moon = new Graphics().circle(0, 0, 70).fill(0xfff2c4).circle(26, -14, 62).cut();
  moon.position.set(W - 260, 170);
  k.addChild(moon);
  const castle = new Graphics();
  castle.poly([0, H, 0, 900, 400, 860, 800, 880, 1200, 850, 1600, 880, W, 860, W, H]).fill(0x0a0820);
  const towers: [number, number, number][] = [
    [180, 140, 46],
    [300, 260, 64],
    [430, 190, 40],
    [1420, 230, 58],
    [1560, 320, 74],
    [1720, 180, 44],
  ];
  for (const [x, h, w] of towers) {
    castle.rect(x - w / 2, 880 - h, w, h).fill(0x0a0820);
    castle.poly([x - w / 2 - 10, 880 - h, x, 880 - h - w * 1.6, x + w / 2 + 10, 880 - h]).fill(0x0a0820);
    for (let y = 880 - h + 24; y < 860; y += 46) castle.rect(x - 5, y, 10, 16).fill({ color: 0xffc85a, alpha: 0.85 });
  }
  castle.rect(330, 760, 1260, 120).fill(0x0a0820);
  k.addChild(castle);
  return k;
}

/** a floating candle */
function candle(): Container {
  const k = new Container();
  const glow = new Graphics().circle(0, -34, 26).fill({ color: 0xffc85a, alpha: 0.2 });
  const body = new Graphics().roundRect(-6, -24, 12, 52, 3).fill(0xf6ecd2).stroke({ width: 2, color: C.ink });
  const flame = new Graphics().ellipse(0, -34, 6, 11).fill(0xffb43a).ellipse(0, -31, 3, 6).fill(0xfff2c4);
  k.addChild(glow, body, flame);
  return k;
}

/** a sealed letter */
function letter(): Container {
  const k = new Container();
  const g = new Graphics()
    .roundRect(-36, -24, 72, 48, 4)
    .fill(0xf3e6c4)
    .stroke({ width: 3, color: C.ink })
    .moveTo(-36, -24)
    .lineTo(0, 4)
    .lineTo(36, -24)
    .stroke({ width: 3, color: C.ink })
    .circle(0, 4, 9)
    .fill(0xb3202a)
    .stroke({ width: 2, color: C.ink });
  k.addChild(g);
  return k;
}

/** the winged golden ball */
function goldenBall(): Container {
  const k = new Container();
  const wl = new Graphics().ellipse(-22, -6, 20, 8).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 2, color: C.ink });
  const wr = new Graphics().ellipse(22, -6, 20, 8).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 2, color: C.ink });
  const b = new Graphics().circle(0, 0, 13).fill(GOLD).stroke({ width: 3, color: C.ink });
  k.addChild(wl, wr, b);
  gsap.to([wl.scale, wr.scale], { y: 0.2, duration: 0.05, yoyo: true, repeat: -1 });
  return k;
}


/** the winged golden ball, still (the card's: no wing tween of its own) */
function ballStill(): Container {
  const k = new Container();
  const wl = new Graphics().ellipse(-22, -6, 20, 8).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 2, color: C.ink });
  const wr = new Graphics().ellipse(22, -6, 20, 8).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 2, color: C.ink });
  const b = new Graphics().circle(0, 0, 13).fill(GOLD).stroke({ width: 3, color: C.ink });
  k.addChild(wl, wr, b);
  return k;
}

export const harrygatter: Signature = {
  dark: true,
  frame: 0xd4a92a,
  tag: 'UNIVERSO MÁGICO',
  open(c: SigCtx) {
    const k = castleNight();
    c.back.addChild(k);
    arrive(c, k, 0.4);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.3 });
    const lumos = backlight(0x9f8cff, 380, 0.75);
    lumos.position.set(W / 2, c.catY);
    c.behind.addChild(lumos);
    for (let i = 0; i < 10; i++) {
      const cd = candle();
      cd.position.set(120 + ((i * 197) % (W - 240)), 120 + ((i * 131) % 380));
      c.back.addChild(cd);
      if (!c.reduce) gsap.to(cd, { y: cd.y - 18, duration: 1.4 + (i % 3) * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }
    if (c.short) return;

    // the letters flood in and whirl around him, closer and closer
    const n = c.reduce ? 10 : 30;
    const ls = Array.from({ length: n }, (_, i) => {
      const l = letter();
      c.fg.addChild(l);
      return { l, a0: (i / n) * Math.PI * 2, r0: 1000 + (i % 5) * 80, d: 0.03 * (i % 7) };
    });
    const stop = every(c, 60, (t) => {
      for (const s of ls) {
        if (s.l.destroyed) continue;
        const u = Math.max(0, t - s.d);
        const out = u > 1.55 ? (u - 1.55) * 2400 : 0;
        const r = Math.max(270, s.r0 - u * 900) + out;
        const a = s.a0 + u * (2.2 + 1.2 * Math.min(1, u));
        s.l.position.set(W / 2 + Math.cos(a) * r, c.catY + Math.sin(a) * r * 0.62);
        s.l.rotation = a + Math.PI / 2;
        if (out > 1400) s.l.destroy({ children: true });
      }
    });
    later(c, 2.4, () => {
      stop();
      ls.forEach((s) => !s.l.destroyed && s.l.destroy({ children: true }));
    });
    for (let i = 0; i < 12; i++) later(c, 0.1 + i * 0.11, () => sfx('paper', 0.9 + Math.random() * 0.6));
    later(c, 0.55, () => word(c, W / 2, 150, '¡TE LLEGÓ LA CARTA!', GOLD, 76, 1.2));
    // the bolt strikes
    later(c, 1.75, () => {
      const b = new Graphics()
        .poly([0, 0, 60, 0, 22, 120, 78, 120, -20, 330, 14, 170, -40, 170])
        .fill(GOLD)
        .stroke({ width: 6, color: C.ink, join: 'round' });
      b.position.set(W / 2 - 10, c.catY - 560);
      c.fg.addChild(b);
      gsap.fromTo(b.scale, { y: 0.2 }, { y: 1, duration: 0.08 });
      gsap.to(b, { alpha: 0, delay: 0.35, duration: 0.3, onComplete: () => b.destroy() });
      flashOf(c, GOLD, 0.5, 0.4);
      sfx('zap', 0.8);
      sfx('boom', 1.1);
      c.shaker.add(0.4);
    });
  },
  payoff(c: SigCtx) {
    sfx('gem');
    sfx('levelup', 1.1);
    // the wand writes a golden loop over the card
    const trail = new Graphics();
    c.fg.addChild(trail);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 90; i++) {
      const u = i / 90;
      const a = u * Math.PI * 4.2;
      pts.push([W / 2 - 520 + u * 1040 + Math.cos(a) * 90, c.CY + 250 - Math.sin(u * Math.PI) * 120 + Math.sin(a) * 70]);
    }
    const p = { k: 0 };
    gsap.to(p, {
      k: 1,
      duration: c.reduce ? 0.01 : 0.8,
      ease: 'power1.inOut',
      onUpdate: () => {
        if (trail.destroyed) return;
        const m = Math.max(1, Math.floor(p.k * pts.length));
        trail.clear().moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < m; i++) trail.lineTo(pts[i][0], pts[i][1]);
        trail.stroke({ width: 7, color: GOLD, cap: 'round', join: 'round' });
        if (!c.reduce && Math.random() < 0.5) sparkles(c.fg, pts[m - 1][0], pts[m - 1][1], GOLD, 3, 40);
      },
    });
    gsap.to(trail, { alpha: 0, delay: 1.6, duration: 0.6, onComplete: () => trail.destroy() });
    cheer(c, '¡EXPELLIARMIAU!', GOLD, 100, 1.8);
    // and the winged ball stays, darting around the card
    const ball = goldenBall();
    c.fg.addChild(ball);
    every(c, 60, (t) => {
      if (ball.destroyed) return;
      ball.position.set(W / 2 + Math.sin(t * 1.3) * 560 + Math.sin(t * 4.1) * 60, c.CY - 120 + Math.sin(t * 2.2) * 260);
      ball.rotation = Math.sin(t * 3) * 0.3;
    });
  },
  card(w, h, live) {
    const k = new Container();
    const m = Math.min(w, h);
    const cx = w / 2;
    const cy = h * 0.54;
    const r = seeded(13);
    const sky = bands(new Graphics(), 0, 0, w, h, [0x110c30, 0x1a1440, 0x2e2264], 14);
    for (let i = 0; i < 54; i++) sky.circle(r() * w, r() * h * 0.7, Math.max(0.6, m * (0.003 + r() * 0.005))).fill({ color: 0xffffff, alpha: 0.4 + r() * 0.5 });
    const moon = new Graphics().circle(0, 0, m * 0.07).fill(0xfff2c4).circle(m * 0.026, -m * 0.014, m * 0.062).cut();
    moon.position.set(w * 0.86, h * 0.14);
    k.addChild(sky, moon);
    // lumos: a violet light behind him
    k.addChild(glow(new Graphics(), cx, cy, m * 0.52, 0x9f8cff, 0.85));
    // the castle on its hill
    const castle = new Graphics();
    const base = h * 0.88;
    castle.poly([0, h, 0, base, w * 0.2, base - h * 0.02, w * 0.42, base, w * 0.62, base - h * 0.03, w * 0.83, base, w, base - h * 0.01, w, h]).fill(0x0a0820);
    for (const [fx, fh, fw] of [
      [0.08, 0.16, 0.045],
      [0.17, 0.28, 0.06],
      [0.26, 0.2, 0.04],
      [0.74, 0.25, 0.055],
      [0.84, 0.34, 0.07],
      [0.94, 0.2, 0.045],
    ] as const) {
      const x = fx * w;
      const th = fh * h;
      const tw = Math.max(5, fw * w);
      castle.rect(x - tw / 2, base - th, tw, th).fill(0x0a0820);
      castle.poly([x - tw / 2 - tw * 0.2, base - th, x, base - th - tw * 1.6, x + tw / 2 + tw * 0.2, base - th]).fill(0x0a0820);
      for (let y = base - th + tw * 0.5; y < base - tw * 0.4; y += tw * 0.95) castle.rect(x - tw * 0.1, y, tw * 0.2, tw * 0.33).fill({ color: 0xffc85a, alpha: 0.85 });
    }
    k.addChild(castle);
    // floating candles
    const candles = Array.from({ length: 7 }, (_, i) => {
      const c = candle();
      c.scale.set((m * 0.13) / 62);
      c.position.set(w * (0.07 + (i / 6) * 0.86) + (r() - 0.5) * w * 0.04, h * (0.14 + r() * 0.28));
      k.addChild(c);
      return { c, y0: c.y, p: r() * 6 };
    });
    // sealed letters whirling around him
    const letters = Array.from({ length: 4 }, (_, i) => {
      const l = letter();
      l.scale.set((m * 0.14) / 72);
      k.addChild(l);
      return { l, a0: (i / 4) * Math.PI * 2 + 0.5 };
    });
    const ball = ballStill();
    ball.scale.set((m * 0.09) / 64);
    k.addChild(ball);
    const place = (t: number) => {
      for (const s of letters) {
        const a = s.a0 + t * 0.35;
        s.l.position.set(cx + Math.cos(a) * m * 0.47, cy + Math.sin(a) * m * 0.36);
        s.l.rotation = Math.sin(a) * 0.4;
      }
      ball.position.set(cx + Math.sin(t * 1.3) * w * 0.36, h * 0.3 + Math.sin(t * 2.1) * h * 0.12);
    };
    place(0.6);
    if (live)
      liveLoop(k, (t) => {
        place(0.6 + t);
        for (const c of candles) c.c.y = c.y0 + Math.sin(t * 1.4 + c.p) * m * 0.02;
        ball.children[0].scale.y = ball.children[1].scale.y = 0.2 + 0.8 * Math.abs(Math.sin(t * 30));
      });
    return k;
  },
};
