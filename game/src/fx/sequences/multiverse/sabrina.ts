/**
 * Sabrina Gatpenter: the sweet universe (the sugar-pop diva, as a cat; no lyrics, nothing but sweetness and jokes). A
 * retro theatre stage: pink velvet curtains with a gold-fringed valance swing open (¡TA-RÁÁ!), a single warm spotlight
 * slams on her (¡TUNG!), and behind her a big heart of marquee bulbs starts chasing. An antique silver microphone comes
 * down from the flies on its cable and swings (ZIIIP), pastel hearts drift down like confetti, huge sequin glints pop
 * around her. «¿Nos llevamos bien?» — «…¿no? ok.»
 * Payoff: a giant sugar heart inflates behind her and bursts into sugar confetti; ¡QUÉ DULCE! …dulce, sí; tonta, jamás.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, every, fall, flashOf, later, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, pay, say } from './kitC';
import { aside, ngon, rnd, streak, twinkle } from './kitD';
import { cone, curtain, heartPts, strip, valance } from './kitH';
import { liveLoop } from '../../../panels/collection/cardArt';

const VELVET = 0xe0679c;
const VELVET_D = 0xa83a6e;
const VELVET_L = 0xffa8cc;
const PLUM = 0x2a0f24;
const GOLD = 0xffd27a;
const BULB = 0xfff2c4;
const PASTEL = [0xffd6e8, 0xffe08a, 0xbfe3ff, 0xd8c8ff, 0xffb8d8];
const SILVER = 0xd0d6dc;

/** the stage behind the curtains (one Graphics): plum backdrop with a soft glow, floor boards, scallop footlights */
function stage(g: Graphics, w: number, h: number, k: number, cx: number) {
  const floor = h * 0.76;
  vgrad(g, 0, 0, w, floor, [0x1a0814, PLUM, 0x4a1a3a], 10);
  for (let i = 7; i >= 1; i--) g.poly(ngon(cx, floor - 300 * k, 120 * k * i, 80 * k * i, 22)).fill({ color: 0xff8fc0, alpha: 0.035 });
  // a backdrop of tiny glitter
  const r = rnd(7);
  for (let i = 0; i < Math.round(90 * (w / 1920)); i++) g.poly(twinkle(r() * w, r() * floor * 0.9, (3 + r() * 5) * k)).fill({ color: 0xffd6e8, alpha: 0.3 + r() * 0.5 });
  g.rect(0, floor, w, h - floor).fill(0x7a3a2a);
  for (let i = 0; i < 7; i++) {
    const u = Math.pow(i / 7, 1.5);
    g.rect(0, floor + (h - floor) * u, w, 3 * k).fill(0x5a2a1e);
  }
  g.rect(0, floor, w, 10 * k).fill(GOLD);
  // footlights: little gold shells along the stage lip
  for (let x = 40 * k; x < w; x += 110 * k) {
    g.poly([x - 30 * k, floor + 10 * k, x + 30 * k, floor + 10 * k, x + 20 * k, floor + 34 * k, x - 20 * k, floor + 34 * k]).fill(0xc89a3a);
    g.poly(ngon(x, floor + 8 * k, 16 * k, 8 * k, 10)).fill({ color: BULB, alpha: 0.9 });
  }
}

/** the heart of marquee bulbs behind her: the frame (static) + bulbs chasing with t */
function heartBulbs(g: Graphics, x: number, y: number, r: number, k: number, t: number, on: number) {
  g.clear();
  const pts = heartPts(x, y, r, 18);
  g.poly(pts).stroke({ width: 26 * k, color: 0x5a1a3a, join: 'round' });
  g.poly(pts).stroke({ width: 12 * k, color: 0xc89a3a, join: 'round' });
  const n = pts.length / 2;
  for (let i = 0; i < n; i++) {
    const lit = on > 0 && (i + Math.floor(t * 12)) % 3 === 0;
    const bx = pts[i * 2];
    const by = pts[i * 2 + 1];
    if (lit) g.poly(ngon(bx, by, 22 * k, 22 * k, 10)).fill({ color: BULB, alpha: 0.3 * on });
    g.poly(ngon(bx, by, 10 * k, 10 * k, 8)).fill(lit ? BULB : on > 0 ? 0xd9a63a : 0x6a4a3a);
  }
}

/** the antique microphone on its cable (origin at the top of the cable): grille capsule, chrome bands */
function mic(len: number, s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.poly(strip([0, 0, 2 * s, len * 0.5, 0, len], 2.5 * s)).fill(0x1a1a1a);
  const y = len;
  g.poly([-36 * s, y + 10 * s, 36 * s, y + 10 * s, 40 * s, y + 60 * s, 30 * s, y + 110 * s, -30 * s, y + 110 * s, -40 * s, y + 60 * s]).fill(SILVER).stroke({ width: 4 * s, color: C.ink, join: 'round' });
  for (let i = 0; i < 7; i++) g.rect(-34 * s, y + 22 * s + i * 12 * s, 68 * s, 5 * s).fill(0x8a929a);
  g.rect(-40 * s, y + 52 * s, 80 * s, 10 * s).fill(0xf2f4f6).stroke({ width: 2 * s, color: C.ink });
  g.poly([-14 * s, y + 110 * s, 14 * s, y + 110 * s, 8 * s, y + 140 * s, -8 * s, y + 140 * s]).fill(0x5a5a62);
  g.poly(ngon(-18 * s, y + 34 * s, 8 * s, 18 * s, 8)).fill({ color: 0xffffff, alpha: 0.6 });
  g.rect(-10 * s, y - 2 * s, 20 * s, 14 * s).fill(0x5a5a62);
  k.addChild(g);
  return k;
}

/** a pastel confetti heart */
function sweet(i: number, s = 1) {
  return new Graphics().poly(heartPts(0, 0, 18 * s, 8)).fill(PASTEL[i % PASTEL.length]).stroke({ width: 2.5 * s, color: 0xffffff });
}

/** a big sequin glint (a fat 4-point star with a white core) */
function sequin(s = 1, col = 0xfff2c4) {
  return new Graphics().poly(twinkle(0, 0, 60 * s, 0.16)).fill(col).poly(twinkle(0, 0, 26 * s, 0.3)).fill(0xffffff);
}

interface St {
  on: { v: number };
  fx: Container;
}
const S = stash<St>();

export const sabrina: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO DULCE',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    stage(g, W, H, 1, W / 2);
    const hb = new Graphics();
    const spot = new Graphics();
    cone(spot, W / 2, -60, W / 2, H * 0.76, 40, 330, 0xfff2d8, 0.3, 3);
    spot.blendMode = 'add';
    const fx = new Container();
    // the side curtains (open, gathered) and the valance; the closing pair that opens at the start
    const sides = new Graphics();
    curtain(sides, 0, 0, 300, H, VELVET, VELVET_D, VELVET_L, 5, 0.5, -1);
    curtain(sides, W - 300, 0, 300, H, VELVET, VELVET_D, VELVET_L, 5, 0.5, 1);
    const val = new Graphics();
    valance(val, 0, 0, W, 150, VELVET_D, GOLD, 9);
    const cl = new Graphics();
    curtain(cl, 0, 0, W / 2 + 20, H, VELVET, VELVET_D, VELVET_L, 8, 0, -1);
    const cr = new Graphics();
    curtain(cr, W / 2 - 20, 0, W / 2 + 20, H, VELVET, VELVET_D, VELVET_L, 8, 0, 1);
    k.addChild(g, hb, spot, fx, sides, cl, cr, val);
    c.back.addChild(k);
    arrive(c, k, 0.15);
    hideDisc(c, 0.15);
    const on = { v: c.short || c.reduce ? 1 : 0 };
    S.set(c, { on, fx });
    spot.visible = on.v > 0;
    if (c.short || c.reduce) {
      cl.visible = false;
      cr.visible = false;
    }
    const frame = (t: number) => {
      if (hb.destroyed) return;
      heartBulbs(hb, W / 2, c.catY - 80, 360, 1, t, on.v);
    };
    frame(0);
    // Reducir movimiento: no motion, but the state changes (a cut, a light, a flip) still land: redraw still frames
    every(c, c.reduce ? 4 : 30, (t) => frame(c.reduce ? 0 : t));
    if (c.short) return;

    // the curtains swing open: ¡TA-RÁÁ!
    score(c, [
      [0.02, 'drumroll', 1.2],
      [0.1, 'whoosh', 0.8],
    ]);
    if (!c.reduce) {
      gsap.to(cl, { x: -W / 2 - 40, duration: 0.4, delay: 0.08, ease: 'power2.inOut' });
      gsap.to(cr, { x: W / 2 + 40, duration: 0.4, delay: 0.08, ease: 'power2.inOut' });
      later(c, 0.6, () => {
        if (!cl.destroyed) cl.visible = false;
        if (!cr.destroyed) cr.visible = false;
      });
    }
    beat(c, 0.2, () => word(c, 420, 260, '¡TA-RÁÁ!', GOLD, 100, 0.7));
    // the spotlight slams on; the heart of bulbs starts chasing
    beat(c, 0.5, () => {
      sfx('boom', 0.7);
      sfx('charge', 1.6);
      if (!spot.destroyed) spot.visible = true;
      on.v = 1;
      if (c.reduce) frame(0);
      word(c, W - 420, 320, '¡TUNG!', 0xffffff, 90, 0.5);
    });
    // the antique mic comes down from the flies and swings
    beat(c, 0.8, () => {
      sfx('whoosh', 1.5);
      const m = mic(260, 1.4);
      m.position.set(W / 2 + 360, -460);
      fx.addChild(m);
      if (c.reduce) m.y = -40;
      else {
        gsap.to(m, { y: -40, duration: 0.45, ease: 'back.out(1.6)' });
        gsap.fromTo(m, { rotation: 0.12 }, { rotation: -0.08, duration: 0.6, delay: 0.45, ease: 'sine.inOut', yoyo: true, repeat: 2 });
      }
      word(c, W / 2 + 560, 220, 'ZIIIP', SILVER, 64, 0.6);
    });
    // pastel hearts drift down; big sequin glints pop around her
    fall(c, fx, (i) => sweet(i, 1.2), { n: 18, over: 1.4, dur: 1.8, spin: 2, spread: W * 0.9 });
    // the first glint on her own antique mic (measured on the painting: 0.3, 0.36 of its box)
    const glints: [number, number][] = [
      [-104, -73],
      [280, -160],
      [-240, 120],
      [320, 160],
      [-60, -300],
      [120, 260],
    ];
    glints.forEach(([dx, dy], i) =>
      beat(c, 1.05 + i * 0.13, () => {
        sfx('gem', 2 + (i % 3) * 0.2);
        const q = sequin(0.8 + (i % 2) * 0.4, i % 3 === 0 ? 0xffd6e8 : 0xfff2c4);
        q.position.set(W / 2 + dx, c.catY + dy);
        c.fg.addChild(q);
        if (!c.reduce) gsap.fromTo(q.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.12, yoyo: true, repeat: 1, repeatDelay: 0.08 });
        fadeKill(q, 0.3, 0.12);
      }),
    );
    beat(c, 1.45, () => {
      sfx('meow', 1.5);
      say(c, c.fg, W / 2 - 360, 250, '¿Nos llevamos bien?', 0.55, { size: 42, tail: 'right', fill: 0xffd6e8 });
    });
    beat(c, 1.9, () => {
      sfx('tick', 1.2);
      say(c, c.fg, W / 2 + 380, 300, '…¿no? ok.', 0.45, { size: 42, tail: 'left' });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.15);
    sfx('gem', 1.4);
    c.shaker.add(0.3);
    flashOf(c, 0xffe6f2, 0.55, 0.35);
    if (st) st.on.v = 1;
    // the sugar heart inflates behind her, then bursts into sugar
    const sh = new Graphics();
    sh.poly(heartPts(0, 0, 320, 16)).fill({ color: 0xff9ac8, alpha: 0.45 }).stroke({ width: 10, color: 0xffffff, alpha: 0.8 });
    sh.poly(ngon(-120, -110, 70, 36, 12, -0.5)).fill({ color: 0xffffff, alpha: 0.5 });
    sh.position.set(W / 2, c.catY - 20);
    c.behind.addChild(sh);
    if (c.reduce) fadeKill(sh, 1.2, 0.3);
    else {
      gsap.fromTo(sh.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.45, ease: 'back.out(2.2)' });
      later(c, 0.9, () => {
        if (sh.destroyed) return;
        sfx('pop', 1.2);
        burst(c, c.fg, (i) => new Graphics().rect(-6, -6, 12, 12).fill(PASTEL[i % PASTEL.length]), 24, W / 2, c.catY - 40, 800, 1.2);
        gsap.to(sh.scale, { x: 1.3, y: 1.3, duration: 0.15 });
        fadeKill(sh, 0, 0.15);
      });
    }
    burst(c, c.fg, (i) => sweet(i, 1.3), 20, W / 2, c.catY - 80, 860, 1.4);
    cheer(c, '¡QUÉ DULCE!', 0xff8fc0, 160, 2.0);
    aside(c, '…dulce, sí; tonta, jamás.', 0xffd6e8, { delay: 0.6, dur: 2.2 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const kk = s * 1.05;
    const g = new Graphics();
    stage(g, w, h, kk, w / 2);
    const hb = new Graphics();
    heartBulbs(hb, w / 2, h * 0.43, 360 * kk, kk, 0.2, 1);
    const spot = new Graphics();
    cone(spot, w / 2, -60 * kk, w / 2, h * 0.76, 40 * kk, 330 * kk, 0xfff2d8, 0.3, 3);
    spot.blendMode = 'add';
    const sides = new Graphics();
    const cw = Math.max(300 * kk, (w - m * 1.3) / 2);
    curtain(sides, 0, 0, cw, h, VELVET, VELVET_D, VELVET_L, 5, 0.5, -1);
    curtain(sides, w - cw, 0, cw, h, VELVET, VELVET_D, VELVET_L, 5, 0.5, 1);
    const val = new Graphics();
    valance(val, 0, 0, w, 150 * kk, VELVET_D, GOLD, Math.max(5, Math.round(w / (210 * kk))));
    const mc = mic(300 * kk, 1.1 * kk);
    mc.position.set(w / 2 + m * 0.36, -40 * kk);
    mc.rotation = -0.06;
    const hearts = new Graphics();
    k.addChild(g, hb, spot, hearts, mc, sides, val);
    const drawHearts = (t: number) => {
      hearts.clear();
      const r = rnd(4);
      const n = Math.round(14 * (w / m));
      for (let i = 0; i < n; i++) {
        const x = r() * w + Math.sin(t + i) * 12 * kk;
        const y = (((r() * h + t * 40 * kk) % h) + h) % h;
        hearts.poly(heartPts(x, y, 16 * kk, 6, Math.sin(t * 2 + i) * 0.4)).fill(PASTEL[i % PASTEL.length]);
      }
    };
    drawHearts(0);
    if (live)
      liveLoop(k, (t) => {
        heartBulbs(hb, w / 2, h * 0.43, 360 * kk, kk, t, 1);
        drawHearts(t);
        mc.rotation = Math.sin(t * 1.2) * 0.06;
      });
    return k;
  },
};
