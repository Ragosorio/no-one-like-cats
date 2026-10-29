/**
 * Garritas: the mutant universe (the clawed hero with metal in his bones). First we see him on a secret lab's green
 * monitor — «SUJETO G-X · CONTENCIÓN», METAL EN HUESOS 100 %, PACIENCIA 3 %, a red ALERTA blinking — and then three
 * claws rip the monitor from side to side — ¡SHIKT! — its pieces fall away and behind it is a snowy comic-book forest
 * at night: a pale moon, snow-capped pines, flakes falling. Metal sparks fly off his claws; the rage comes (the screen
 * pulses red, «¡GRRRAAAH!»); and the three scratches he left on the screen heal by themselves with little green
 * crosses: FACTOR CURATIVO.
 * Payoff: three huge slashes cross the forest, the pines' tops slide off and topple, snow bursts; ¡SHIKT! (…ni un
 * rasguño.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, CHEER, burst, every, flashOf, later, plate, score } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, rng, stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { aside, balloon, ngon, onCat, say, streak } from './kitD';
import { halftone, hidden, lazy, prepWord, sparks } from './kitG';

const NIGHT = [0x0b1430, 0x1a2c5a, 0x34528a, 0x5a7aa8];
const SNOW = 0xeef4ff;
const SNOW_D = 0xb8c8e4;
const PINE = 0x14283a;
const PINE_FAR = 0x2a4466;
const YELLOW = 0xffd23f;
const CRT = 0x06301a;
const CRT_L = 0x5aff8a;
const SLASH = 0xfff6c8;

/** a snow-capped pine (tiers of triangles; caps of snow), origin at its foot; split = height where the top part starts */
function pine(gTop: Graphics, gBot: Graphics, x: number, y: number, h: number, col: number, snow: boolean, split = 0.55) {
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const yb = y - h * 0.12 - t0 * h * 0.78;
    const yt = yb - h * 0.36;
    const hw = h * (0.34 - t0 * 0.07);
    const g = t0 >= split ? gTop : gBot;
    g.poly([x - hw, yb, x, yt, x + hw, yb]).fill(col);
    if (snow) g.poly([x - hw * 0.62, yb - h * 0.1, x, yt, x + hw * 0.6, yb - h * 0.12, x + hw * 0.2, yb - h * 0.06, x - hw * 0.2, yb - h * 0.1]).fill(SNOW);
  }
  gBot.rect(x - h * 0.03, y - h * 0.14, h * 0.06, h * 0.14).fill(0x2a1c14);
}

/** the forest: sky with halftone, the moon, far pines, the snow field, near pines (each its own top/bottom pair) */
function forest(w: number, h: number, hz: number, u: number, seed: number, nearPines = true) {
  const k = new Container();
  const sky = vgrad(new Graphics(), 0, 0, w, hz + 10 * u, NIGHT, 16);
  halftone(sky, 0, 0, w, hz, 24 * u, 3.4 * u, 0xffffff, 0.08, (_x, v) => 1 - v, 2600);
  const moon = new Graphics();
  for (let i = 6; i >= 1; i--) moon.poly(ngon(0, 0, 70 * u * i * 0.5 + 90 * u, 70 * u * i * 0.5 + 90 * u, 28)).fill({ color: 0xdfe8ff, alpha: 0.05 });
  moon.poly(ngon(0, 0, 110 * u, 110 * u, 30)).fill(0xf2f4ff);
  moon.poly(ngon(-30 * u, -20 * u, 24 * u, 22 * u, 12)).fill({ color: 0xc8d0e8, alpha: 0.7 }).poly(ngon(36 * u, 30 * u, 18 * u, 16 * u, 10)).fill({ color: 0xc8d0e8, alpha: 0.7 });
  const r = rng(seed);
  const far = new Graphics();
  const farTop = new Graphics();
  for (let x = -40 * u; x < w + 40 * u; x += (46 + r() * 40) * u) pine(farTop, far, x, hz + 20 * u + r() * 20 * u, (150 + r() * 120) * u, PINE_FAR, true, 2);
  const ground = new Graphics();
  vgrad(ground, 0, hz + 10 * u, w, h - hz, [SNOW_D, SNOW, 0xffffff], 8);
  for (let i = 0; i < Math.round(w / (160 * u)); i++) ground.poly(ngon(r() * w, hz + 60 * u + r() * (h - hz) * 0.7, (60 + r() * 80) * u, (8 + r() * 6) * u, 12)).fill({ color: SNOW_D, alpha: 0.6 });
  k.addChild(sky, moon, far, farTop, ground);
  const near: { top: Graphics; bot: Graphics; x: number; cutY: number }[] = [];
  if (nearPines) {
    const xs = [w * 0.08, w * 0.22, w * 0.78, w * 0.93];
    xs.forEach((x, i) => {
      const top = new Graphics();
      const bot = new Graphics();
      const hh = (520 + (i % 2) * 120) * u;
      const y = h + 30 * u;
      pine(top, bot, x, y, hh, PINE, true, 0.5);
      k.addChild(bot, top);
      near.push({ top, bot, x, cutY: y - hh * 0.12 - 0.5 * hh * 0.78 });
    });
  }
  return { k, sky, moon, near };
}

/** snow falling at time t (one Graphics, `n` flakes drifting) */
function drawSnow(g: Graphics, w: number, h: number, t: number, n: number, u: number, seed: number) {
  g.clear();
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x0 = r() * w;
    const sp = 60 + r() * 90;
    const s = (2 + r() * 4) * u;
    const y = (r() * h + t * sp * u) % h;
    const x = (x0 + Math.sin(t + i) * 20 * u + t * 20 * u) % w;
    g.poly([x, y - s, x + s, y, x, y + s, x - s, y]);
  }
  g.fill({ color: 0xffffff, alpha: 0.85 });
}

/** the three cut lines: x = X0[i] + M·y (from upper right down to the lower left) */
const M = -0.55;
const X0 = [880, 1230, 1580];
const lineX = (i: number, y: number) => (i < 0 ? -4000 : i > 2 ? 6000 : X0[i] + M * y);

/** one strip of the monitor (between cut lines a-1 and a): dark green, scanlines (quads inside the strip), its texts */
function strip(a: number) {
  const k = new Container();
  const g = new Graphics();
  const y0 = -60;
  const y1 = H + 60;
  const L = (y: number) => Math.max(-60, lineX(a - 1, y));
  const R = (y: number) => Math.min(W + 60, lineX(a, y));
  g.poly([L(y0), y0, R(y0), y0, R(y1), y1, L(y1), y1]).fill(CRT);
  for (let y = 0; y < H; y += 7) {
    const xa = L(y);
    const xb = R(y);
    if (xb - xa < 2) continue;
    g.poly([xa, y, xb, y, R(y + 2.5), y + 2.5, L(y + 2.5), y + 2.5]);
  }
  g.fill({ color: 0x0a4a26, alpha: 0.8 });
  k.addChild(g);
  return { k, g };
}

interface St {
  shikt: () => ReturnType<typeof prepWord>;
  near: { top: Graphics; bot: Graphics; x: number; cutY: number }[];
  scratches: Container | null;
  rage: Graphics | null;
  mon: Container | null;
}
const S = stash<St>();
const HZ = 700;
/** the claws on the painting (measured on the integrated SVG): the left paw's and the right paw's */
const CLAWS: [number, number][] = [
  [0.15, 0.86],
  [0.73, 0.86],
];

export const garritas: Signature = {
  dark: true,
  frame: YELLOW,
  tag: 'UNIVERSO MUTANTE',
  open(c: SigCtx) {
    const k = new Container();
    const fr = forest(W, H, HZ, 1, 1974);
    fr.moon.position.set(1460, 250);
    const snow = new Graphics();
    k.addChild(fr.k, snow);
    c.back.addChild(k);
    hideDisc(c, 0.15);
    // a cold light behind his silhouette
    const bl = new Graphics();
    for (let i = 7; i >= 1; i--) bl.poly(ngon(0, 0, 52 * i, 52 * i, 24)).fill({ color: 0xbfd8ff, alpha: 0.04 });
    bl.position.set(W / 2, c.catY - 30);
    c.behind.addChild(bl);
    // one ¡SHIKT! for the claws (upper left), another for the payoff (its own spot): a shown word is gone
    const shikt = lazy(c, 0.05, () => prepWord(c, c.fg, 560, 300, '¡SHIKT!', YELLOW, 190, -0.12));
    const shiktPay = lazy(c, 1.1, () => prepWord(c, c.fg, CHEER[0], CHEER[1], '¡SHIKT!', YELLOW, 180, -0.06));
    const st: St = { shikt: shiktPay, near: fr.near, scratches: null, rage: null, mon: null };
    S.set(c, st);
    drawSnow(snow, W, H, 0.5, 110, 1, 3);
    if (!c.reduce) every(c, 30, (t) => !snow.destroyed && drawSnow(snow, W, H, t, 110, 1, 3));
    if (c.short) return;

    // the lab monitor in front of the forest, in four strips (the cut lines are where the claws will go)
    const mon = new Container();
    const strips = [0, 1, 2, 3].map((a) => strip(a));
    strips.forEach((s) => mon.addChild(s.k));
    const tStyle = { fontFamily: F.ui, fontWeight: '700' as const, fontSize: 30, fill: CRT_L, letterSpacing: 3 };
    const t1 = txt('SUJETO G-X · CONTENCIÓN', tStyle);
    t1.position.set(70, 90);
    strips[0].k.addChild(t1);
    const t2 = txt('METAL EN HUESOS', { ...tStyle, fontSize: 26 });
    t2.position.set(1290, 760);
    const b2 = new Graphics().rect(1290, 800, 420, 22).stroke({ width: 2, color: CRT_L }).rect(1294, 804, 412, 14).fill(CRT_L);
    const v2 = txt('100 %', { ...tStyle, fontSize: 26 });
    v2.position.set(1730, 790);
    const t3 = txt('PACIENCIA', { ...tStyle, fontSize: 26 });
    t3.position.set(1290, 860);
    const b3 = new Graphics().rect(1290, 900, 420, 22).stroke({ width: 2, color: CRT_L }).rect(1294, 904, 14, 14).fill(0xff5a5a);
    const v3 = txt('3 %', { ...tStyle, fontSize: 26, fill: 0xff5a5a });
    v3.position.set(1730, 890);
    strips[3].k.addChild(t2, b2, v2, t3, b3, v3);
    // a containment reticle round him (on the middle strips)
    const ret = new Graphics();
    for (const [a0, a1] of [
      [-0.9, -0.2],
      [0.2, 0.9],
      [2.25, 2.95],
      [3.35, 4.05],
    ]) {
      const pts: number[] = [];
      for (let i = 0; i <= 8; i++) {
        const a = a0 + ((a1 - a0) * i) / 8;
        pts.push(W / 2 + Math.cos(a) * 330, c.catY + Math.sin(a) * 330);
      }
      ret.poly(pts, false).stroke({ width: 5, color: CRT_L, alpha: 0.8 });
    }
    strips[1].k.addChild(ret);
    const alert = plate('ALERTA', 0xd62839, C.ink, 40, C.paper);
    alert.position.set(260, 980);
    strips[0].k.addChild(alert);
    c.back.addChild(mon);
    st.mon = mon;
    const blink = c.reduce ? null : gsap.to(alert, { alpha: 0.2, duration: 0.12, yoyo: true, repeat: 3 });
    score(c, [
      [0.0, 'alarm', 1.0],
      [0.25, 'alarm', 1.0],
      [0.45, 'crit', 0.7],
      [0.47, 'whoosh', 1.6],
    ]);

    // ¡SHIKT! three claws rip the monitor; its pieces fall away
    const scratches = new Container();
    // they heal by closing toward the middle line of the screen
    scratches.pivot.set(0, H / 2);
    scratches.position.set(0, H / 2);
    st.scratches = scratches;
    c.fg.addChild(scratches);
    beat(c, 0.45, () => {
      blink?.kill();
      c.shaker.add(0.4);
      flashOf(c, 0xffffff, 0.35, 0.2);
      shikt().show(0.55);
      for (let i = 0; i < 3; i++) {
        const g = new Graphics();
        const xa = lineX(i, -40);
        const xb = lineX(i, H + 40);
        g.poly(streak(xa, -40, xb, H + 40, 4, 26)).fill({ color: 0xff9a3a, alpha: 0.45 });
        g.poly(streak(xa, -40, xb, H + 40, 2, 12)).fill(SLASH);
        scratches.addChild(g);
        if (!c.reduce) {
          g.alpha = 0;
          gsap.to(g, { alpha: 1, duration: 0.05, delay: i * 0.03 });
        }
      }
      strips.forEach((s, i) => {
        const dir = i - 1.5;
        if (c.reduce) {
          destroyTree(s.k);
          return;
        }
        gsap.to(s.k, { x: dir * 260, y: 900 + Math.abs(dir) * 120, rotation: dir * 0.18, duration: 0.6, ease: 'power2.in', delay: 0.04 + Math.abs(dir) * 0.03 });
        gsap.to(s.k, { alpha: 0, duration: 0.2, delay: 0.42 });
      });
      later(c, 0.7, () => destroyTree(mon));
    });
    // metal sparks off the claws
    for (const [d, i] of [
      [0.6, 0],
      [0.78, 1],
      [1.0, 0],
    ] as const)
      beat(c, d, () => {
        const [x, y] = onCat(c, CLAWS[i][0], CLAWS[i][1]);
        sparks(c, c.fg, x, y, 18, 0xffe9a8, 280, 0.55, i ? -0.9 : Math.PI + 0.9, 1.8);
        sfx('shield', 1.8 + i * 0.2);
      });
    // the rage: the screen pulses red
    beat(c, 1.2, () => {
      const rage = new Graphics();
      for (let i = 0; i < 6; i++) {
        const m = i * 40;
        rage.rect(0, 0, W, H).fill({ color: 0xd62839, alpha: 0.07 }).rect(m, m, W - m * 2, H - m * 2).cut();
      }
      c.fg.addChild(rage);
      st.rage = rage;
      if (!c.reduce) gsap.fromTo(rage, { alpha: 0 }, { alpha: 1, duration: 0.1, yoyo: true, repeat: 3 });
      fadeKill(rage, 0.5, 0.2);
      const [bx, by] = onCat(c, 0.9, 0.1);
      say(c, c.fg, balloon('¡GRRRAAAH!', { size: 50, jag: true, fill: 0xd62839, color: 0xffffff, tx: -120, ty: 90 }), bx + 60, by - 20, 0.6, 0.05);
      sfx('crit', 0.5);
      c.shaker.add(0.25);
    });
    // the scratches heal by themselves: FACTOR CURATIVO
    const healPlate = lazy(c, 1.3, () => hidden(c.fg, plate('FACTOR CURATIVO', 0x3ab86a, C.ink, 34, C.paper), W - 330, 140, 0.04));
    beat(c, 1.7, () => {
      sfx('levelup', 1.6);
      const p = healPlate();
      if (!p.destroyed) {
        p.alpha = 1;
        if (!c.reduce) gsap.from(p.scale, { x: 2, y: 2, duration: 0.15, ease: 'back.out(3)' });
        fadeKill(p, 0.55, 0.15);
      }
      if (scratches.destroyed) return;
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 5; j++) {
          const y = 120 + j * 210 + i * 30;
          const x = lineX(i, y);
          const plus = new Graphics().rect(-14, -4, 28, 8).rect(-4, -14, 8, 28).fill(0x5aff8a);
          plus.position.set(x, y);
          scratches.addChild(plus);
          if (!c.reduce) gsap.from(plus.scale, { x: 0, y: 0, duration: 0.15, delay: j * 0.04, ease: 'back.out(3)' });
        }
      if (c.reduce) scratches.alpha = 0.3;
      else gsap.to(scratches.scale, { x: 1, y: 0.02, duration: 0.4, delay: 0.2, ease: 'power2.in' });
      gsap.to(scratches, { alpha: 0, duration: 0.25, delay: 0.45 });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('crit', 0.8);
    sfx('bigboom', 0.85);
    later(c, 0.2, () => sfx('fanfare', 0.9));
    c.shaker.add(0.45);
    flashOf(c, 0xffffff, 0.5, 0.3);
    if (st) {
      if (st.scratches && !st.scratches.destroyed) destroyTree(st.scratches);
      // a reveal skipped before the claws: the monitor goes now
      if (st.mon && !st.mon.destroyed) destroyTree(st.mon);
      st.shikt().show(2.0);
      // three huge slashes across the forest
      const sl = new Graphics();
      for (const [x0, y0, x1, y1] of [
        [-60, 420, W + 60, 760],
        [-60, 480, W + 60, 820],
        [-60, 540, W + 60, 880],
      ]) {
        sl.poly(streak(x0, y0, x1, y1, 3, 22)).fill({ color: 0xff9a3a, alpha: 0.4 });
        sl.poly(streak(x0, y0, x1, y1, 1.5, 10)).fill(SLASH);
      }
      c.fg.addChildAt(sl, 0);
      fadeKill(sl, 0.35, 0.4);
      // the pines' tops slide off and topple
      st.near.forEach((p, i) => {
        if (p.top.destroyed) return;
        const dir = p.x < W / 2 ? -1 : 1;
        if (c.reduce) {
          p.top.visible = false;
          return;
        }
        p.top.pivot.set(p.x, p.cutY);
        p.top.position.set(p.x, p.cutY);
        gsap.to(p.top, { x: p.x + dir * 120, duration: 0.25, delay: 0.05 + i * 0.03, ease: 'power1.out' });
        gsap.to(p.top, { rotation: dir * 1.4, y: p.cutY + 500, duration: 0.8, delay: 0.25 + i * 0.03, ease: 'power2.in' });
      });
    }
    aside(c, '…ni un rasguño.', 0xffffff, { delay: 0.6, dur: 2.1 });
    // snow bursts
    burst(c, c.fg, () => new Graphics().poly(ngon(0, 0, 8 + Math.random() * 10, 8 + Math.random() * 10, 7)).fill(0xffffff), 30, W / 2, c.catY + 180, 1000, 1.4);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const hz = h * 0.66;
    const fr = forest(w, h, hz, u * 1.3, 77, w > h * 1.2);
    fr.moon.position.set(w / 2 + Math.min(w * 0.3, m * 0.42), h * 0.24);
    const snow = new Graphics();
    const nS = Math.min(260, Math.round((w * h) / (m * m) * 50));
    drawSnow(snow, w, h, 0.4, nS, u * 1.3, 5);
    // three claw marks across the sky
    const sc = new Graphics();
    for (let i = 0; i < 3; i++) {
      const x = w / 2 - m * 0.42 + i * m * 0.07;
      sc.poly(streak(x + m * 0.12, h * 0.04, x - m * 0.12, h * 0.5, 2 * u, 18 * u)).fill({ color: 0xff9a3a, alpha: 0.5 });
      sc.poly(streak(x + m * 0.12, h * 0.04, x - m * 0.12, h * 0.5, 1 * u, 8 * u)).fill(SLASH);
    }
    k.addChild(fr.k, sc, snow);
    if (live)
      liveLoop(k, (t) => {
        drawSnow(snow, w, h, t, nS, u * 1.3, 5);
        sc.alpha = 0.75 + 0.25 * Math.sin(t * 2.4);
      });
    return k;
  },
};
