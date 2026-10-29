/**
 * Daft Miau: the pyramid universe (a French robot duo's light show). A black dance floor; on a four-on-the-floor kick a
 * giant pyramid of LED panels lights up stripe by stripe from the bottom, the floor's tiles flash on the beat, lasers
 * sweep from the apex. His partner — the gold helmet, rainbow visor — lights up on a riser beside him; light glints off
 * both helmets and his own visor glows through the silhouette: BIP · BUP. Payoff: the whole pyramid goes rainbow,
 * lasers fan out, LED confetti; ¡BIP-BUP-MIAU!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, burst, cheer, every, flashOf, later } from './kit';
import { hideDisc, pixelText, pixelWidth } from './kitA';
import { fadeKill, stash } from './kitB';
import { beats, hsv, ngon, onCat, streak, twinkle } from './kitD';
import { liveLoop } from '../../../panels/collection/cardArt';

const SILVER = 0xc0c6cc;
const GOLD = 0xe6c34a;
const PINK = 0xff4fa3;
const CYAN = 0x3ff0ff;
const BPM = 124;
const BEAT = 60 / BPM;

/** the pyramid's geometry: apex (x, top), base y `base`, half-width `hw` at the base, `rows` LED rows */
interface Pyr {
  x: number;
  top: number;
  base: number;
  hw: number;
  rows: number;
}

/**
 * the LED pyramid at time t: `lit` = how many rows are on (from the bottom), `mode` 0 build (white-cyan), 1 rainbow
 * wave, 2 chevrons, `kick` 0..1 the beat's flash. ~130 panels, redrawn each frame (no strokes).
 */
function drawPyramid(g: Graphics, p: Pyr, t: number, lit: number, mode: number, kick: number) {
  g.clear();
  const H2 = p.base - p.top;
  // the dark frame behind the panels
  g.poly([p.x, p.top - 14, p.x + p.hw + 24, p.base + 10, p.x - p.hw - 24, p.base + 10]).fill(0x14141c);
  for (let r = 0; r < p.rows; r++) {
    const y1 = p.base - (H2 * r) / p.rows;
    const y0 = p.base - (H2 * (r + 1)) / p.rows;
    const w1 = p.hw * (1 - r / p.rows);
    const w0 = p.hw * (1 - (r + 1) / p.rows);
    const gap = Math.max(1.5, (y1 - y0) * 0.14);
    const n = Math.max(1, Math.round((w1 * 2) / ((y1 - y0) * 2.2)));
    const on = r < lit;
    for (let i = 0; i < n; i++) {
      const a = i / n;
      const b = (i + 1) / n;
      const xa1 = p.x - w1 + 2 * w1 * a + gap / 2;
      const xb1 = p.x - w1 + 2 * w1 * b - gap / 2;
      const xa0 = p.x - w0 + 2 * w0 * a + gap / 2;
      const xb0 = p.x - w0 + 2 * w0 * b - gap / 2;
      let col = 0x26262f;
      let al = 1;
      if (on) {
        if (mode === 0) col = (r + i) % 2 ? 0xdff8ff : CYAN;
        else if (mode === 1) col = hsv(r * 0.06 - t * 0.45 + (i / n) * 0.15, 0.85, 1);
        else col = (r + Math.floor(t * 4) + Math.abs(i - n / 2)) % 4 < 1.5 ? PINK : (r + i) % 2 ? CYAN : 0x2a2a6a;
        al = 0.65 + 0.35 * kick;
      }
      g.poly([xa0, y0 + gap / 2, xb0, y0 + gap / 2, xb1, y1 - gap / 2, xa1, y1 - gap / 2]).fill({ color: col, alpha: al });
    }
  }
}

/** the LED dance floor in perspective: tiles flash in a pattern that changes every beat */
function drawFloor(g: Graphics, w: number, h: number, top: number, cx: number, beat: number, kick: number, rainbow: boolean) {
  g.clear();
  g.rect(0, top, w, h - top).fill(0x0b0b10);
  const R = 7;
  const C2 = 14;
  const farW = w * 0.42;
  const nearW = w * 1.5;
  for (let j = 0; j < R; j++) {
    const u0 = Math.pow(j / R, 1.6);
    const u1 = Math.pow((j + 1) / R, 1.6);
    const y0 = top + (h - top) * u0;
    const y1 = top + (h - top) * u1;
    const hw0 = farW + (nearW - farW) * u0;
    const hw1 = farW + (nearW - farW) * u1;
    for (let i = 0; i < C2; i++) {
      const a = i / C2 - 0.5;
      const b = (i + 1) / C2 - 0.5;
      const pat = (i + j + beat) % 3 === 0 || (beat % 2 === 1 && (i - j + 40) % 4 === 0);
      const col = rainbow ? hsv((i + j) * 0.07 + beat * 0.13, 0.8, 1) : (i + j) % 2 ? PINK : CYAN;
      const inset = 3;
      g.poly([cx + hw0 * a * 2 + inset, y0 + inset, cx + hw0 * b * 2 - inset, y0 + inset, cx + hw1 * b * 2 - inset, y1 - inset, cx + hw1 * a * 2 + inset, y1 - inset]).fill({
        color: pat ? col : 0x1c1c28,
        alpha: pat ? 0.35 + 0.5 * kick : 1,
      });
    }
  }
}

/** lasers out of the apex (and the base corners on the drop), sweeping with time */
function drawLasers(g: Graphics, p: Pyr, t: number, n: number, spread: number, alpha: number) {
  g.clear();
  if (alpha <= 0.01) return;
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + (i / Math.max(1, n - 1) - 0.5) * spread + Math.sin(t * 1.7 + i) * 0.18;
    const L = 2200;
    const col = i % 2 ? PINK : CYAN;
    g.poly(streak(p.x, p.top, p.x + Math.cos(a) * L, p.top + Math.sin(a) * L, 1.5, 10)).fill({ color: col, alpha: alpha * 0.35 });
    g.poly(streak(p.x, p.top, p.x + Math.cos(a) * L, p.top + Math.sin(a) * L, 0.8, 3.5)).fill({ color: 0xffffff, alpha: alpha * 0.6 });
  }
}

/** the partner: black leather, silver boots, the gold helmet with cat ears and a rainbow visor (origin at his feet) */
function partner(s = 1) {
  const k = new Container();
  const g = new Graphics();
  const ink = { width: 4 * s, color: 0x000000, join: 'round' as const };
  // legs and boots
  g.poly([-50 * s, -190 * s, -10 * s, -190 * s, -14 * s, -20 * s, -52 * s, -20 * s]).fill(0x15151a).stroke(ink);
  g.poly([10 * s, -190 * s, 50 * s, -190 * s, 52 * s, -20 * s, 14 * s, -20 * s]).fill(0x15151a).stroke(ink);
  g.roundRect(-64 * s, -26 * s, 56 * s, 26 * s, 8 * s).fill(SILVER).stroke(ink).roundRect(8 * s, -26 * s, 56 * s, 26 * s, 8 * s).fill(SILVER).stroke(ink);
  // the jacket, with a rim of pink light
  g.poly([-78 * s, -340 * s, 78 * s, -340 * s, 70 * s, -180 * s, -70 * s, -180 * s]).fill(0x1c1c22).stroke(ink);
  g.poly(streak(0, -336 * s, 0, -186 * s, 2 * s, 2 * s)).fill(SILVER);
  g.poly(streak(74 * s, -334 * s, 66 * s, -186 * s, 3 * s, 3 * s)).fill(PINK);
  g.poly([-40 * s, -340 * s, 0, -300 * s, 40 * s, -340 * s]).fill(0x101014);
  // left arm down (the right one is its own piece: it rises on the payoff)
  g.poly([-78 * s, -336 * s, -104 * s, -328 * s, -112 * s, -210 * s, -86 * s, -206 * s]).fill(0x1c1c22).stroke(ink);
  g.poly(ngon(-100 * s, -196 * s, 18 * s, 16 * s, 10)).fill(0x101014);
  // the gold helmet: a dome, cat ears, a black visor with rainbow LEDs
  g.poly([-56 * s, -420 * s, -48 * s, -486 * s, -24 * s, -452 * s]).fill(GOLD).stroke(ink);
  g.poly([56 * s, -420 * s, 48 * s, -486 * s, 24 * s, -452 * s]).fill(GOLD).stroke(ink);
  g.poly(ngon(0, -398 * s, 62 * s, 64 * s, 22)).fill(GOLD).stroke(ink);
  g.roundRect(-50 * s, -412 * s, 100 * s, 40 * s, 14 * s).fill(0x0a0a0e);
  g.poly(ngon(-24 * s, -436 * s, 20 * s, 10 * s, 10, -0.5)).fill({ color: 0xfff6c8, alpha: 0.8 });
  g.rect(-30 * s, -344 * s, 60 * s, 14 * s).fill(0x15151a);
  const visor = new Graphics();
  visor.position.set(0, -392 * s);
  const arm = new Graphics();
  arm.poly([0, 0, 26 * s, -6 * s, 30 * s, 120 * s, 4 * s, 124 * s]).fill(0x1c1c22).stroke(ink);
  arm.poly(ngon(18 * s, 134 * s, 18 * s, 16 * s, 10)).fill(0x101014);
  arm.position.set(78 * s, -336 * s);
  k.addChild(g, arm, visor);
  return { k, visor, arm };
}

/** the partner's visor LEDs: rainbow bars scrolling (local to the visor's center), s = scale */
function drawVisor(v: Graphics, t: number, s: number) {
  v.clear();
  for (let i = 0; i < 7; i++) v.rect(-44 * s + i * 12.6 * s, -12 * s, 10 * s, 24 * s).fill(hsv(i / 7 - t * 0.6, 0.9, 1));
}

interface St {
  mode: { v: number };
  vis: Graphics;
  lasers: { n: number; spread: number; a: number };
  arm: Graphics | null;
  rainbow: { v: boolean };
}
const S = stash<St>();

export const daftmiau: Signature = {
  dark: true,
  frame: SILVER,
  tag: 'UNIVERSO PIRÁMIDE',
  open(c: SigCtx) {
    const k = new Container();
    const bg = new Graphics().rect(0, 0, W, H).fill(0x050508);
    // a soft haze behind the pyramid
    for (let i = 6; i >= 1; i--) bg.poly(ngon(W / 2, 420, 140 * i, 110 * i, 24)).fill({ color: 0x3a2a6a, alpha: 0.06 });
    const pyr: Pyr = { x: W / 2, top: 70, base: 770, hw: 760, rows: 12 };
    const pg = new Graphics();
    const lasers = new Graphics();
    lasers.blendMode = 'add';
    const floor = new Graphics();
    const p = partner(1);
    p.k.position.set(W / 2 + 560, 800);
    const riser = new Graphics().poly([-150, 0, 150, 0, 170, 40, -170, 40]).fill(0x24242e).rect(-170, 40, 340, 60).fill(0x16161e);
    for (let i = 0; i < 6; i++) riser.rect(-150 + i * 52, 52, 40, 8).fill(i % 2 ? PINK : CYAN);
    riser.position.set(W / 2 + 560, 800);
    const spot = new Graphics().poly([W / 2 + 560 - 30, -20, W / 2 + 560 + 30, -20, W / 2 + 560 + 230, 820, W / 2 + 560 - 230, 820]).fill({ color: 0xfff2c8, alpha: 0.1 });
    k.addChild(bg, pg, spot, floor, riser, p.k, lasers);
    c.back.addChild(k);
    hideDisc(c, 0.15);
    // his own visor glows through the silhouette
    const vis = new Graphics();
    const [vx, vy] = onCat(c, 0.355, 0.295);
    c.fg.addChild(vis);
    const mode = { v: 0 };
    const lit = { v: c.short || c.reduce ? pyr.rows : 0 };
    const las = { n: 0, spread: 1.2, a: 0 };
    const rainbow = { v: false };
    const kickV = { v: 0 };
    S.set(c, { mode, vis, lasers: las, arm: p.arm, rainbow });
    if (c.short || c.reduce) {
      mode.v = 1;
      las.n = 6;
      las.a = 0.6;
    } else {
      p.k.alpha = 0;
      spot.alpha = 0;
    }
    const t0 = performance.now();
    const frame = (t: number) => {
      if (pg.destroyed) return;
      const bt = (performance.now() - t0) / 1000 / BEAT;
      const beat = Math.floor(bt);
      const ph = bt - beat;
      const kick = c.reduce ? 0.6 : Math.max(0, 1 - ph * 2.2);
      kickV.v = kick;
      drawPyramid(pg, pyr, t, Math.round(lit.v), mode.v, kick);
      drawFloor(floor, W, H, 770, W / 2, beat, kick, rainbow.v);
      drawLasers(lasers, pyr, t, las.n, las.spread, las.a * (0.5 + 0.5 * kick));
      drawVisor(p.visor, t, 1);
      if (!vis.destroyed) {
        vis.clear();
        vis.roundRect(vx - 62, vy - 13, 124, 26, 12).fill({ color: 0x050508, alpha: 0.6 });
        for (let i = 0; i < 9; i++) vis.rect(vx - 56 + i * 12.6, vy - 9, 9, 18).fill({ color: rainbow.v ? hsv(i / 9 - t * 0.6) : i % 4 === Math.floor(t * 8) % 4 ? 0xffffff : CYAN, alpha: 0.9 });
      }
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // the kick: four on the floor; hats between; the pyramid builds two rows a step
    beats(c, BPM, 5, (i) => {
      sfx('boom', 0.55);
      c.shaker.add(0.08);
      later(c, BEAT / 2, () => sfx('tick', 2.4));
      if (i === 2) sfx('zap', 0.6);
    });
    if (c.reduce) lit.v = pyr.rows;
    else for (let i = 1; i <= 6; i++) later(c, (i * BEAT) / 3, () => (lit.v = i * 2));
    // the partner lights up on his riser; lasers on; the light glints off both helmets
    later(c, BEAT * 2, () => {
      mode.v = 2;
      las.n = 4;
      las.a = 0.8;
      sfx('charge', 1.6);
      if (c.reduce) {
        p.k.alpha = 1;
        spot.alpha = 1;
      } else {
        gsap.to(p.k, { alpha: 1, duration: 0.2 });
        gsap.to(spot, { alpha: 1, duration: 0.2 });
      }
    });
    const glint = (x: number, y: number, d: number) =>
      later(c, d, () => {
        const g = new Graphics().poly(twinkle(0, 0, 44)).fill(0xffffff);
        g.position.set(x, y);
        c.fg.addChild(g);
        sfx('gem', 2.2);
        if (!c.reduce) gsap.fromTo(g.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.12, yoyo: true, repeat: 1 });
        fadeKill(g, 0.25, 0.1);
      });
    glint(W / 2 + 540, 800 - 440, BEAT * 2.5);
    glint(...onCat(c, 0.3, 0.17), BEAT * 3);
    // BIP · BUP in LEDs over the partner, then over him
    const bip = (text: string, x: number, y: number, d: number, col: number) =>
      later(c, d, () => {
        const g = new Graphics();
        pixelText(g, text, x - pixelWidth(text, 9) / 2, y, 9, col);
        c.fg.addChild(g);
        sfx('click', 1.8);
        fadeKill(g, BEAT * 1.4, 0.15);
      });
    bip('BIP', W / 2 + 560, 230, BEAT * 3, GOLD);
    bip('BUP', W / 2 - 520, 260, BEAT * 3.5, SILVER);
    later(c, BEAT * 4, () => {
      mode.v = 1;
      las.n = 6;
    });
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('fanfare', 1.1);
    sfx('bigboom', 0.8);
    c.shaker.add(0.4);
    flashOf(c, 0xffffff, 0.45, 0.3);
    if (st) {
      st.mode.v = 1;
      st.rainbow.v = true;
      st.lasers.n = 12;
      st.lasers.spread = 2.4;
      st.lasers.a = 1;
      // the painting's own visor takes over once he's in color
      if (!st.vis.destroyed) gsap.to(st.vis, { alpha: 0, duration: c.reduce ? 0 : 0.3 });
      if (st.arm && !st.arm.destroyed && !c.reduce) gsap.to(st.arm, { rotation: -2.6, duration: 0.25, ease: 'back.out(2)' });
      else if (st.arm && !st.arm.destroyed) st.arm.rotation = -2.6;
    }
    // LED confetti
    burst(c, c.fg, (i) => new Graphics().rect(-10, -10, 20, 20).fill(hsv(i / 30)), 30, W / 2, c.catY - 60, 900, 1.4);
    for (let i = 0; i < 4; i++) later(c, i * BEAT, () => sfx('boom', 0.6));
    cheer(c, '¡BIP-BUP-MIAU!', CYAN, 140, 2.0);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const bg = new Graphics().rect(0, 0, w, h).fill(0x050508);
    for (let i = 6; i >= 1; i--) bg.poly(ngon(w / 2, h * 0.4, m * 0.13 * i, m * 0.1 * i, 24)).fill({ color: 0x3a2a6a, alpha: 0.06 });
    const pyr: Pyr = { x: w / 2, top: h * 0.06, base: h * 0.72, hw: m * 0.72, rows: 12 };
    const pg = new Graphics();
    drawPyramid(pg, pyr, 0.3, 12, 1, 0.6);
    const lasers = new Graphics();
    lasers.blendMode = 'add';
    drawLasers(lasers, pyr, 0.3, 6, 1.4, 0.5);
    const floor = new Graphics();
    drawFloor(floor, w, h, h * 0.72, w / 2, 1, 0.6, false);
    const p = partner(s * 0.95);
    p.k.position.set(w / 2 + Math.min(w * 0.36, m * 0.62), h * 0.78);
    drawVisor(p.visor, 0, s * 0.95);
    k.addChild(bg, pg, floor, p.k, lasers);
    if (live) {
      liveLoop(k, (t) => {
        const bt = t / BEAT;
        const beat = Math.floor(bt);
        const kick = Math.max(0, 1 - (bt - beat) * 2.2);
        drawPyramid(pg, pyr, t, 12, beat % 8 < 4 ? 1 : 2, kick);
        drawFloor(floor, w, h, h * 0.72, w / 2, beat, kick, false);
        drawLasers(lasers, pyr, t, 6, 1.4, 0.3 + 0.3 * kick);
        drawVisor(p.visor, t, s * 0.95);
      });
    }
    return k;
  },
};

