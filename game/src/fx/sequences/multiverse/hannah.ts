/**
 * Hannah Michitana: the double-life universe (the teen pop-star sitcom: schoolgirl by day, blonde star by night). The
 * screen splits down a zigzag seam right through her: on the left a plain lilac bedroom by day (bed, backpack, homework
 * under the lamp, a poster, a foam head on the dresser wearing the long blonde wig), on the right an arena at night
 * (truss lights, a giant LED screen, a sea of cat ears and glowsticks). «DE DÍA…» «…DE NOCHE.» The wig flies off its
 * stand across the seam and lands on her (¡FLIP!), the stage half sweeps over the whole screen, spotlights swing, the
 * crowd roars (¡AAAAH!), and from the bedroom side her best friend squints: «¿…HANNAH?» — «¿QUIÉN?».
 * Payoff: pyro fountains, star confetti, every spotlight on her; ¡SORPRESA! …nadie la reconoció.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, backlight, burst, cheer, every, fall, flashOf, later, plate, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, floatWord, pay, say } from './kitC';
import { aside, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { cone, held, star5, wig } from './kitH';
import { liveLoop } from '../../../panels/collection/cardArt';

const LILAC = 0xd9c8f0;
const LILAC_D = 0xc9b2e8;
const WOOD = 0xc89a6a;
const PINK = 0xff4fa3;
const GOLD = 0xffe08a;
const VIOLET = 0x7b5cff;
const NIGHT = 0x150a26;
const STICKS = [PINK, GOLD, 0x5ff0ff, VIOLET, 0xffffff];

/** the bedroom by day (one Graphics, w×h, scale k, centered on cx); returns where the wig stand's head is */
function room(g: Graphics, w: number, h: number, k: number, cx: number): [number, number] {
  const floor = h * 0.78;
  g.rect(0, 0, w, floor).fill(LILAC);
  for (let x = 0; x < w; x += 60 * k) g.rect(x, 0, 22 * k, floor).fill(LILAC_D);
  g.rect(0, floor - 40 * k, w, 40 * k).fill(0xffffff);
  g.rect(0, floor, w, h - floor).fill(WOOD);
  for (let y = floor + 30 * k; y < h; y += 42 * k) g.rect(0, y, w, 3 * k).fill(0xa87a4a);
  // the window: a blue morning, two clouds, pink curtains
  const wx = cx - 900 * k;
  g.rect(wx - 12 * k, 120 * k, 324 * k, 284 * k).fill(0xffffff).rect(wx, 132 * k, 300 * k, 260 * k).fill(0x9fd8ff);
  g.poly(ngon(wx + 90 * k, 220 * k, 50 * k, 26 * k, 12)).fill(0xffffff).poly(ngon(wx + 210 * k, 300 * k, 60 * k, 24 * k, 12)).fill(0xffffff);
  g.rect(wx + 144 * k, 132 * k, 12 * k, 260 * k).fill(0xffffff).rect(wx, 256 * k, 300 * k, 10 * k).fill(0xffffff);
  g.poly([wx - 40 * k, 110 * k, wx + 50 * k, 110 * k, wx + 10 * k, 420 * k, wx - 50 * k, 420 * k]).fill(0xf7a1c4);
  g.poly([wx + 250 * k, 110 * k, wx + 340 * k, 110 * k, wx + 350 * k, 420 * k, wx + 290 * k, 420 * k]).fill(0xf7a1c4);
  // the bed with a patchwork quilt (under the window)
  const bx = cx - 940 * k;
  g.roundRect(bx - 20 * k, floor - 260 * k, 40 * k, 260 * k, 10 * k).fill(0xffffff);
  g.rect(bx, floor - 120 * k, 420 * k, 90 * k).fill(0xffffff);
  const pc = [0xffc94a, 0x7fd1c7, 0xf7a1c4, 0xb7a4c7];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) g.rect(bx + 30 * k + i * 64 * k, floor - 150 * k + j * 46 * k, 64 * k, 46 * k).fill(pc[(i + j) % 4]);
  g.roundRect(bx + 20 * k, floor - 180 * k, 110 * k, 50 * k, 20 * k).fill(0xffffff);
  g.rect(bx + 400 * k, floor - 30 * k, 20 * k, 30 * k).fill(0xffffff).rect(bx, floor - 30 * k, 20 * k, 30 * k).fill(0xffffff);
  // the poster on the wall: a star over a long-haired silhouette (nobody connects the dots)
  const px = cx - 500 * k;
  g.rect(px - 70 * k, 130 * k, 140 * k, 190 * k).fill(NIGHT).stroke({ width: 4 * k, color: 0xffffff });
  g.poly(star5(px, 190 * k, 46 * k)).fill(GOLD);
  g.poly(ngon(px, 272 * k, 32 * k, 40 * k, 12)).fill(PINK);
  // the school backpack on the floor, homework spilling out
  g.roundRect(px - 70 * k, floor - 130 * k, 110 * k, 130 * k, 24 * k).fill(0x3fa9c8).rect(px - 50 * k, floor - 70 * k, 70 * k, 40 * k).fill(0x2f86a2);
  g.poly([px + 40 * k, floor - 6 * k, px + 120 * k, floor - 20 * k, px + 130 * k, floor + 4 * k, px + 50 * k, floor + 14 * k]).fill(0xffffff);
  // the dresser, its round mirror, and the foam head wearing the wig
  const sx = cx - 260 * k;
  g.rect(sx - 150 * k, floor - 230 * k, 300 * k, 230 * k).fill(0xf2e6cc).stroke({ width: 4 * k, color: 0xd9cdb8 });
  for (let i = 0; i < 3; i++) g.rect(sx - 130 * k, floor - 210 * k + i * 70 * k, 260 * k, 56 * k).fill(0xfff8ee).poly(ngon(sx, floor - 182 * k + i * 70 * k, 8 * k, 8 * k, 8)).fill(0xd9a63a);
  g.poly(ngon(sx + 40 * k, floor - 380 * k, 100 * k, 120 * k, 16)).fill(0xffffff).stroke({ width: 6 * k, color: 0xd9a63a });
  g.poly(streak(sx - 70 * k, floor - 230 * k, sx - 70 * k, floor - 290 * k, 8 * k, 6 * k)).fill(0xd9cdb8);
  g.poly(ngon(sx - 70 * k, floor - 330 * k, 40 * k, 48 * k, 12)).fill(0xe8e2d8);
  // the desk lamp on the dresser
  g.poly(streak(sx + 110 * k, floor - 230 * k, sx + 90 * k, floor - 320 * k, 4 * k, 4 * k)).fill(0x5a5a62);
  g.poly([sx + 60 * k, floor - 320 * k, sx + 110 * k, floor - 346 * k, sx + 124 * k, floor - 300 * k]).fill(0x7fd1c7);
  return [sx - 70 * k, floor - 362 * k];
}

/** the arena by night (one Graphics): backdrop, truss with light cans, the LED screen frame, the stage, the crowd */
function arena(g: Graphics, w: number, h: number, k: number, cx: number) {
  const floor = h * 0.78;
  vgrad(g, 0, 0, w, floor, [0x0b0618, NIGHT, 0x2a0f4a], 10);
  // the truss
  g.rect(0, 52 * k, w, 18 * k).fill(0x4a4a58).rect(0, 82 * k, w, 6 * k).fill(0x4a4a58);
  for (let x = 0; x < w; x += 40 * k) g.poly([x, 70 * k, x + 6 * k, 70 * k, x + 26 * k, 82 * k, x + 20 * k, 82 * k]).fill(0x4a4a58);
  for (let x = 60 * k; x < w; x += 170 * k) g.rect(x - 16 * k, 88 * k, 32 * k, 30 * k).fill(0x2a2a34);
  // the LED screen behind the stage
  g.roundRect(cx - 520 * k, 170 * k, 1040 * k, 420 * k, 14 * k).fill(0x0a0a12).stroke({ width: 8 * k, color: 0x3a3a48 });
  // the stage deck with pink edge lights
  g.rect(0, floor, w, h - floor).fill(0x0c0812);
  g.rect(0, floor, w, 8 * k).fill(PINK);
  for (let x = 20 * k; x < w; x += 90 * k) g.poly(ngon(x, floor + 24 * k, 8 * k, 5 * k, 8)).fill(GOLD);
}

/**
 * the LED screen's picture: big stars in three color groups, each group its own static Graphics whose alpha pulses
 * (no re-tessellation per frame)
 */
function makeScreen(k: number, cx: number) {
  const c = new Container();
  const groups = [new Graphics(), new Graphics(), new Graphics()];
  const x0 = cx - 508 * k;
  const y0 = 182 * k;
  const cw = 1016 * k;
  const ch = 396 * k;
  const n = 12;
  const m = 5;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const q = (i + j) % 3;
      groups[q].poly(star5(x0 + (i + 0.5) * (cw / n), y0 + (j + 0.5) * (ch / m), (cw / n) * 0.3, 0.5)).fill([PINK, VIOLET, GOLD][q]);
    }
  c.addChild(...groups);
  const draw = (t: number, hot: number) => groups.forEach((g, q) => (g.alpha = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(t * 4 + q * 2.1)) * (0.5 + 0.5 * hot)));
  return { c, draw };
}

/**
 * the crowd at the front: three rows of cat heads (each row one static Graphics that bobs as a whole) and their raised
 * glowsticks (the only part redrawn each frame)
 */
function makeCrowd(w: number, h: number, k: number) {
  const c = new Container();
  const sticks = new Graphics();
  c.addChild(sticks);
  const rows: Graphics[] = [];
  const holders: [number, number, number, number, number][] = []; // row, x, y, s, color
  const r = rnd(66);
  for (let row = 0; row < 3; row++) {
    const g = new Graphics();
    const y = h - 150 * k + row * 70 * k;
    const s = (0.8 + row * 0.25) * k;
    const col = row === 2 ? 0x08050e : row === 1 ? 0x120b20 : 0x1c1230;
    for (let x = -30 * k + (row % 2) * 40 * k; x < w + 60 * k; x += 92 * s) {
      if (r() < 0.55) holders.push([row, x + 20 * s, y - 40 * s, s, STICKS[Math.floor(r() * STICKS.length)]]);
      g.poly(ngon(x, y, 40 * s, 36 * s, 10)).fill(col);
      g.poly([x - 34 * s, y - 14 * s, x - 26 * s, y - 56 * s, x - 6 * s, y - 30 * s]).fill(col);
      g.poly([x + 34 * s, y - 14 * s, x + 26 * s, y - 56 * s, x + 6 * s, y - 30 * s]).fill(col);
      g.rect(x - 40 * s, y, 80 * s, 80 * s).fill(col);
    }
    rows.push(g);
    c.addChild(g);
  }
  const draw = (t: number, hot: number) => {
    const bob = rows.map((_, row) => Math.sin(t * 7 + row * 1.3) * 6 * k * hot);
    rows.forEach((g, row) => (g.y = bob[row]));
    sticks.clear();
    for (const [row, bx, y, s, sc] of holders) {
      const a = -Math.PI / 2 + Math.sin(t * 5 + bx * 0.03) * 0.5 * hot + Math.sin(bx) * 0.2;
      const by = y + bob[row];
      const ex = bx + Math.cos(a) * 70 * s;
      const ey = by + Math.sin(a) * 70 * s;
      sticks.poly(streak(bx, by, ex, ey, 12 * s, 12 * s)).fill({ color: sc, alpha: 0.25 });
      sticks.poly(streak(bx, by, ex, ey, 5 * s, 5 * s)).fill(sc);
    }
  };
  return { c, draw };
}

/** spotlights from the truss: `n` cones sweeping with t; `on` 0..1; `focus` 0..1 pulls them onto (fx, fy) */
function spots(g: Graphics, w: number, h: number, k: number, t: number, on: number, focus: number, fx: number, fy: number) {
  g.clear();
  if (on <= 0.01) return;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x0 = ((i + 0.5) / n) * w;
    const sw = Math.sin(t * 1.3 + i * 1.7) * 380 * k;
    const tx = x0 + sw + (fx - x0 - sw) * focus;
    const ty = h * 0.8 + (fy - h * 0.8) * focus;
    cone(g, x0, 100 * k, tx, ty, 10 * k, 150 * k, i % 2 ? 0xfff2c8 : 0xffb8e0, 0.22 * on, 2);
  }
}

/** her best friend peeking in from the bedroom's edge (a tan cat face, one eyebrow up), origin at its chin */
function friend(s = 1) {
  const g = new Graphics();
  const fur = 0xc8945a;
  g.poly([-70 * s, -120 * s, -56 * s, -190 * s, -20 * s, -150 * s]).fill(fur).stroke({ width: 4 * s, color: C.ink, join: 'round' });
  g.poly([70 * s, -120 * s, 56 * s, -190 * s, 20 * s, -150 * s]).fill(fur).stroke({ width: 4 * s, color: C.ink, join: 'round' });
  g.poly(ngon(0, -80 * s, 82 * s, 76 * s, 18)).fill(fur).stroke({ width: 4 * s, color: C.ink });
  for (const sd of [-1, 1]) {
    g.poly(ngon(sd * 30 * s, -92 * s, 16 * s, 20 * s, 12)).fill(0xffffff).stroke({ width: 3 * s, color: C.ink });
    g.poly(ngon(sd * 30 * s + 5 * s, -88 * s, 7 * s, 9 * s, 8)).fill(C.ink);
  }
  g.poly(streak(-46 * s, -126 * s, -14 * s, -118 * s, 4 * s, 4 * s)).fill(C.ink);
  g.poly(streak(14 * s, -128 * s, 46 * s, -142 * s, 4 * s, 4 * s)).fill(C.ink);
  g.poly([-8 * s, -62 * s, 8 * s, -62 * s, 0, -52 * s]).fill(0xd9776a);
  g.poly(streak(-14 * s, -40 * s, 14 * s, -42 * s, 3 * s, 3 * s)).fill(C.ink);
  return g;
}

/** the seam: a zigzag from (top, 0) to (bot, h) as points; `pts` → the right half's polygon */
function seamPts(top: number, bot: number, h: number, teeth = 9, amp = 34): number[] {
  const p: number[] = [];
  for (let i = 0; i <= teeth; i++) {
    const u = i / teeth;
    p.push(top + (bot - top) * u + (i % 2 ? amp : -amp) * (i === 0 || i === teeth ? 0 : 1), u * h);
  }
  return p;
}

interface St {
  sweep: { v: number };
  hot: { v: number };
  focus: { v: number };
  fx: Container;
}
const S = stash<St>();

export const hannah: Signature = {
  dark: true,
  frame: PINK,
  tag: 'UNIVERSO DOBLE VIDA',
  open(c: SigCtx) {
    const k = new Container();
    const rg = new Graphics();
    const standAt = room(rg, W, H, 1, W / 2);
    const stage = new Container();
    const ag = new Graphics();
    arena(ag, W, H, 1, W / 2);
    const scr = makeScreen(1, W / 2);
    const sp = new Graphics();
    sp.blendMode = 'add';
    const cr = makeCrowd(W, H, 1);
    stage.addChild(ag, scr.c, sp, cr.c);
    const mask = new Graphics();
    stage.mask = mask;
    const seam = new Graphics();
    const fx = new Container();
    k.addChild(rg, stage, mask, seam, fx);
    c.back.addChild(k);
    arrive(c, k, 0.2);
    hideDisc(c, 0.15);
    // a soft pink light behind her (the stage is dark: the silhouette must read)
    const bl = backlight(PINK, 330, 0.55);
    bl.position.set(W / 2, c.catY - 20);
    bl.alpha = c.short ? 1 : 0;
    c.behind.addChild(bl);
    // her best friend, peeking in from the bedroom's edge (shows at 1.6 s)
    const fr = friend(1.1);
    fr.position.set(-140, 620);
    k.addChildAt(fr, 1);
    // the wig on its stand (it flies at 0.35 s)
    const wg = new Graphics();
    wig(wg, 0.42);
    wg.position.set(...standAt);
    k.addChild(wg);
    // sweep: 0 = the seam through her, 1 = the stage has the whole screen
    const sweep = { v: c.short ? 1 : 0 };
    const hot = { v: c.short || c.reduce ? 1 : 0.35 };
    const focus = { v: 0 };
    S.set(c, { sweep, hot, focus, fx });
    let lastSweep = -1;
    const drawSeam = () => {
      if (sweep.v === lastSweep) return;
      lastSweep = sweep.v;
      const top = W / 2 + 110 - sweep.v * 1500;
      const bot = W / 2 - 110 - sweep.v * 1500;
      const p = seamPts(top, bot, H);
      mask.clear().poly([...p, W + 40, H, W + 40, 0]).fill(0xffffff);
      seam.clear();
      if (sweep.v < 0.99) {
        seam.poly(p, false).stroke({ width: 22, color: C.ink, join: 'miter' });
        seam.poly(p, false).stroke({ width: 10, color: GOLD, join: 'miter' });
      }
    };
    const [hx, hy] = onCat(c, 0.42, 0.3);
    const frame = (t: number) => {
      if (sp.destroyed) return;
      drawSeam();
      scr.draw(t, hot.v);
      cr.draw(t, hot.v);
      spots(sp, W, H, 1, t, hot.v, focus.v, hx, hy + 200);
    };
    frame(0);
    // Reducir movimiento: no motion, but the state changes (a cut, a light, a flip) still land: redraw still frames
    every(c, c.reduce ? 4 : 30, (t) => frame(c.reduce ? 0 : t));
    if (c.short) {
      wg.visible = false;
      return;
    }

    // DE DÍA… / …DE NOCHE.
    held(c, c.fg, plate('DE DÍA…', 0xffffff, C.ink, 46, C.ink), 300, 500, 0.05, { hold: 0.9, rot: -0.05 });
    held(c, c.fg, plate('…DE NOCHE.', PINK, C.ink, 46), W - 400, 180, 0.2, { hold: 0.8, rot: 0.05 });
    score(c, [
      [0.05, 'whoosh', 1],
      [0.2, 'sting', 1.3],
    ]);
    // the wig flies off its stand across the seam and lands on her: ¡FLIP!
    const [lx, ly] = onCat(c, 0.36, 0.2);
    beat(c, 0.35, () => {
      if (wg.destroyed) return;
      sfx('whoosh', 1.4);
      if (c.reduce) {
        wg.position.set(lx, ly);
        wg.scale.set(2.1);
      } else {
        const p = { u: 0 };
        const [x0, y0] = standAt;
        gsap.to(p, {
          u: 1,
          duration: 0.55,
          ease: 'power1.inOut',
          onUpdate: () => {
            if (wg.destroyed) return;
            wg.position.set(x0 + (lx - x0) * p.u, y0 + (ly - y0) * p.u - Math.sin(p.u * Math.PI) * 300);
            wg.rotation = p.u * Math.PI * 2 * -1;
            wg.scale.set(1 + 1.1 * p.u);
          },
        });
      }
      word(c, W / 2 + 360, 260, '¡FLIP!', GOLD, 90, 0.6);
    });
    beat(c, 0.92, () => {
      sfx('pop', 1.2);
      sfx('gem', 1.6);
      const g = new Graphics();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.poly(twinkle(lx + Math.cos(a) * 130, ly + Math.sin(a) * 90, 22)).fill(GOLD);
      }
      c.fg.addChild(g);
      if (!c.reduce) gsap.fromTo(g.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 0.25 });
      fadeKill(g, 0.25, 0.2);
      // the painted hair takes over
      if (!wg.destroyed) fadeKill(wg, 0.05, 0.25);
    });
    // the stage sweeps over the whole screen; the crowd roars
    beat(c, 1.05, () => {
      sfx('boom', 0.7);
      sfx('charge', 1.4);
      c.shaker.add(0.15);
      if (c.reduce) {
        sweep.v = 1;
        hot.v = 1;
      } else {
        gsap.to(sweep, { v: 1, duration: 0.4, ease: 'power3.in' });
        gsap.to(hot, { v: 1, duration: 0.3 });
      }
      word(c, 400, 760, '¡AAAAH!', 0xffffff, 110, 0.8);
      if (c.reduce) bl.alpha = 1;
      else gsap.to(bl, { alpha: 1, duration: 0.3 });
    });
    for (let i = 0; i < (c.reduce ? 2 : 5); i++)
      beat(c, 1.35 + i * 0.13, () => {
        sfx('hit', 2 + Math.random() * 0.4);
        floatWord(c, c.fg, 220 + Math.random() * 400 + (i % 2) * 1100, 820 + Math.random() * 80, 'CLAP', { fontFamily: F.comic, fontSize: 46, fill: GOLD, stroke: { color: C.ink, width: 7, join: 'round' } }, 70, 0.7);
      });
    // her best friend, from the bedroom (the seam slides back a moment)
    beat(c, 1.6, () => {
      if (!c.reduce) gsap.to(sweep, { v: 0.45, duration: 0.18, ease: 'power2.out' });
      if (!fr.destroyed) {
        if (c.reduce) fr.x = 110;
        else gsap.to(fr, { x: 110, duration: 0.2, ease: 'back.out(2)' });
      }
      sfx('tick', 1.2);
      say(c, c.fg, 300, 380, '¿…HANNAH?', 0.6, { size: 42, tail: 'left' });
    });
    beat(c, 1.95, () => {
      if (!c.reduce) gsap.to(sweep, { v: 1, duration: 0.18, ease: 'power2.in' });
      if (!fr.destroyed && !c.reduce) gsap.to(fr, { x: -160, duration: 0.18, ease: 'power2.in' });
      sfx('meow', 1.4);
      say(c, c.fg, W / 2 + 320, 240, '¿QUIÉN?', 0.45, { size: 50, tail: 'left', fill: GOLD });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.1);
    sfx('bigboom', 0.9);
    c.shaker.add(0.4);
    flashOf(c, 0xffd6f0, 0.6, 0.35);
    if (st) {
      st.sweep.v = 1;
      st.hot.v = 1;
      if (c.reduce) st.focus.v = 1;
      else gsap.to(st.focus, { v: 1, duration: 0.35, ease: 'power2.out' });
      // pyro fountains at the stage's front corners
      if (!c.reduce)
        for (const x of [180, W - 180])
          for (let i = 0; i < 3; i++)
            later(c, i * 0.18, () => {
              if (st.fx.destroyed) return;
              const g = new Graphics();
              for (let j = 0; j < 14; j++) {
                const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                const l = 260 + Math.random() * 300;
                g.poly(streak(x, H * 0.8, x + Math.cos(a) * l, H * 0.8 + Math.sin(a) * l, 2, 7)).fill(j % 2 ? GOLD : 0xffffff);
              }
              st.fx.addChild(g);
              gsap.fromTo(g.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.25 });
              fadeKill(g, 0.2, 0.3);
            });
    }
    burst(c, c.fg, (i) => new Graphics().poly(star5(0, 0, 22)).fill(i % 3 === 0 ? PINK : i % 3 === 1 ? GOLD : VIOLET).stroke({ width: 3, color: C.ink }), 28, W / 2, c.catY - 80, 900, 1.4);
    fall(c, c.fg, (i) => new Graphics().rect(-9, -5, 18, 10).fill(STICKS[i % STICKS.length]), { n: 22, over: 1.4, dur: 1.6, spin: 6 });
    cheer(c, '¡SORPRESA!', PINK, 160, 2.0);
    aside(c, '…nadie la reconoció.', 0xffffff, { delay: 0.6, dur: 2.2 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const rg = new Graphics();
    const standAt = room(rg, w, h, s * 1.05, w / 2);
    const wg = new Graphics();
    wig(wg, 0.42 * s * 1.05);
    wg.position.set(...standAt);
    const stage = new Container();
    const ag = new Graphics();
    arena(ag, w, h, s * 1.05, w / 2);
    const scr = makeScreen(s * 1.05, w / 2);
    const sp = new Graphics();
    sp.blendMode = 'add';
    const cr = makeCrowd(w, h, s * 1.05);
    stage.addChild(ag, scr.c, sp, cr.c);
    const p = seamPts(w / 2 + 70 * s, w / 2 - 70 * s, h, 9, 26 * s);
    const mask = new Graphics().poly([...p, w + 10, h, w + 10, 0]).fill(0xffffff);
    stage.mask = mask;
    const seam = new Graphics().poly(p, false).stroke({ width: 16 * s, color: C.ink }).poly(p, false).stroke({ width: 7 * s, color: GOLD });
    k.addChild(rg, wg, stage, mask, seam);
    const draw = (t: number) => {
      scr.draw(t, 1);
      cr.draw(t, live ? 1 : 0);
      spots(sp, w, h, s * 1.05, t, 0.9, 0, 0, 0);
    };
    draw(0.4);
    if (live) liveLoop(k, (t) => draw(t + 0.4));
    return k;
  },
};

