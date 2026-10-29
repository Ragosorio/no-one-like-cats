/**
 * Gatojo: the bizarre universe (a bizarre-adventure anime). A color page of flat impossible blocks — magenta, lime,
 * yellow, violet — turning like a pinwheel behind a giant clock; menacing ゴゴゴ rise up both sides, focus lines, and a
 * muscular feline spirit rises behind his shoulder. Sardines fly at him… the clock goes ¡TOC!, a dome of inverted color
 * swells out of him and time stops: the sardines hang in the air. «¡QUIETOS!», «PODER: SIESTA DE PLATINO».
 * Payoff: time resumes (the dome collapses), the spirit's paw rush — ¡MIAUMIAUMIAUMIAU! — blasts the sardines away;
 * ¡EL TIEMPO SE DETIENE… / …para la siesta.; then the page freezes in sepia under a CONTINUARÁ arrow.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash } from './kitB';
import { beat, pay } from './kitC';
import { ngon, rnd, streak } from './kitD';
import { type Head, band, diamonds, glyphGo, prep, prepHead, prepWord, rays, rrect, show, showHead } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';

const GOLD = 0xe6c34a;
const TEAL = 0x7fd1c7;
const VIOLET = 0x4b2a8a;
const SPIRIT = 0x7a4ad0;
/** the color page: magenta, lime, yellow, violet, teal, orange */
const PAGE = [0xd9338f, 0x86d13a, 0xffd23a, 0x5a2fa0, 0x2fb8a8, 0xff7a3a, 0xf05fb0, 0xc9e83a];
/**
 * stopped time: the page as a negative duotone — light things go deep violet, dark things pale teal (inverting the
 * saturated page alone still reads as just another color page)
 */
const NEG_D = [0x1c, 0x10, 0x34];
const NEG_L = [0xb8, 0xf4, 0xe6];
function inv(c: number) {
  const l = (((c >> 16) & 255) * 0.299 + ((c >> 8) & 255) * 0.587 + (c & 255) * 0.114) / 255;
  const k = Math.min(1, Math.max(0, (1 - l) * 1.25 - 0.1));
  const ch = (j: number) => Math.round(NEG_D[j] + (NEG_L[j] - NEG_D[j]) * k);
  return (ch(0) << 16) | (ch(1) << 8) | ch(2);
}
const col = (c: number, i: boolean) => (i ? inv(c) : c);

/** the pinwheel of flat color blocks around (cx, cy) (radius R reaches past the corners), screentone at the bottom */
function blocks(g: Graphics, cx: number, cy: number, R: number, i: boolean, w: number, h: number, seed = 3) {
  const r = rnd(seed);
  const n = 14;
  let a = -0.2;
  for (let k = 0; k < n; k++) {
    const da = (TAU_ / n) * (0.7 + r() * 0.6);
    g.poly([cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R, cx + Math.cos(a + da) * R, cy + Math.sin(a + da) * R]).fill(col(PAGE[k % PAGE.length], i));
    a += da;
  }
  g.poly([cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R, cx + Math.cos(-0.2) * R, cy + Math.sin(-0.2) * R]).fill(col(PAGE[3], i));
  // a few hard diagonal stripes across the blocks (the page's design lines)
  for (let k = 0; k < 4; k++) {
    const y0 = h * (0.1 + k * 0.27);
    g.poly([-w, y0, w * 2, y0 - h * 0.9, w * 2, y0 - h * 0.9 + 18 + k * 6, -w, y0 + 18 + k * 6]).fill({ color: col(0xffffff, i), alpha: 0.18 });
  }
}
const TAU_ = Math.PI * 2;

/** the giant clock face (gold ring, 12 bars, 60 ticks as one band each) at (x, y), radius r */
function clockFace(g: Graphics, x: number, y: number, r: number, i: boolean) {
  const gold = col(GOLD, i);
  const ink = col(C.ink, i);
  const q = r / 420;
  g.poly(ngon(x, y, r + 16 * q, r + 16 * q, 60)).stroke({ width: 20 * q, color: ink, alpha: 0.85 });
  g.poly(ngon(x, y, r + 16 * q, r + 16 * q, 60)).stroke({ width: 10 * q, color: gold });
  g.poly(ngon(x, y, r * 0.06, r * 0.06, 12)).fill(gold).stroke({ width: 4 * q, color: ink });
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * TAU_;
    const big = k % 5 === 0;
    const r0 = r * (big ? 0.82 : 0.92);
    g.poly(streak(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r, y + Math.sin(a) * r, (big ? 9 : 2.5) * q, (big ? 12 : 2.5) * q)).fill(big ? gold : { color: ink, alpha: 0.6 });
  }
}

/** a clock hand (origin at the clock's center, pointing up), length L */
function hand(L: number, wd: number, i: boolean) {
  const g = new Graphics();
  g.poly([-wd, L * 0.12, -wd * 0.7, -L * 0.85, 0, -L, wd * 0.7, -L * 0.85, wd, L * 0.12]).fill(col(GOLD, i)).stroke({ width: Math.max(1, wd / 4), color: col(C.ink, i), join: 'round' });
  return g;
}

/** the rising ゴ columns (both sides): `t` = seconds risen; `n` per side; `k` = scale (1 at 1920×1080) */
function drawGo(g: Graphics, w: number, h: number, t: number, n: number, k: number, i: boolean, shown = 99) {
  g.clear();
  const fill = col(0x9a4ae0, i);
  const fill2 = col(0xff4fa3, i);
  const ink = col(C.ink, i);
  let m = 0;
  for (const side of [-1, 1]) {
    for (let j = 0; j < n; j++) {
      if (m++ >= shown) continue;
      const span = h + 260 * k;
      const yy = h + 120 * k - ((j / n) * span + t * 70 * k) % span;
      const x = side < 0 ? (150 + (j % 2) * 70) * k : w - (150 + (j % 2) * 70) * k;
      const s = (120 + (j % 3) * 34) * k;
      const wob = Math.sin(t * 9 + j * 2.1) * 0.06;
      glyphGo(g, x + Math.sin(t * 13 + j) * 3 * k, yy, s, side * 0.12 + wob, j % 2 ? fill : fill2, ink);
    }
  }
}

/**
 * the feline spirit: a muscular cat-shaped warrior from the waist up (origin at its waist), pointing left like him; blank
 * glowing eyes, a long mane, gold cuffs. One Graphics (~400 vertices); `s` = scale (1 ≈ 620 px tall).
 */
function spirit(s: number, body = SPIRIT, light = TEAL) {
  const g = new Graphics();
  const P = (pts: number[]) => pts.map((v) => v * s);
  const ink = { width: 5 * s, color: C.ink, join: 'round' as const };
  // the mane, flowing back (right)
  g.poly(P([-40, -600, 60, -610, 200, -560, 330, -600, 260, -520, 380, -500, 250, -450, 330, -400, 180, -400, 60, -470])).fill(0x2a1a50).stroke(ink);
  // the far arm (bent, fist at the hip)
  g.poly(band(P([170, -400, 260, -270, 170, -170]), 42 * s, 36 * s)).fill(body).stroke(ink);
  g.poly(rrect(120 * s, -215 * s, 90 * s, 80 * s, 26 * s)).fill(body).stroke(ink);
  // the torso: a V of muscle
  g.poly(P([-95, 0, -125, -170, -215, -380, -150, -450, 150, -450, 215, -380, 125, -170, 95, 0])).fill(body).stroke(ink);
  // pecs, abs, the line down the middle (teal light)
  g.poly(P([-150, -420, -10, -410, -20, -320, -140, -330])).fill({ color: light, alpha: 0.35 });
  g.poly(P([10, -410, 150, -420, 140, -330, 20, -320])).fill({ color: light, alpha: 0.35 });
  for (let r = 0; r < 3; r++) {
    g.poly(rrect(-62 * s, (-290 + r * 72) * s, 54 * s, 56 * s, 14 * s)).fill({ color: light, alpha: 0.3 });
    g.poly(rrect(8 * s, (-290 + r * 72) * s, 54 * s, 56 * s, 14 * s)).fill({ color: light, alpha: 0.3 });
  }
  // the shoulder pads (gold) and the pointing arm, straight out to the left
  // upper arm (a bicep's bulge), forearm tapering to the cuff, the paw pointing with one digit
  g.poly(P([-180, -446, -260, -470, -340, -452, -400, -420, -404, -380, -330, -352, -250, -350, -180, -372])).fill(body).stroke(ink);
  g.poly(P([-392, -430, -470, -428, -520, -416, -520, -384, -470, -372, -392, -362])).fill(body).stroke(ink);
  g.poly(P([-500, -436, -470, -436, -470, -364, -500, -364])).fill(GOLD).stroke(ink);
  g.poly(P([-520, -430, -590, -440, -612, -410, -606, -372, -560, -356, -520, -366])).fill(body).stroke(ink);
  g.poly(P([-600, -432, -690, -428, -696, -410, -604, -406])).fill(body).stroke(ink);
  g.poly(P([-560, -404, -598, -396, -590, -380, -556, -384])).fill({ color: light, alpha: 0.5 });
  g.poly(P([-232, -470, -140, -470, -120, -400, -232, -380])).fill(GOLD).stroke(ink);
  g.poly(P([140, -470, 232, -470, 232, -380, 120, -400])).fill(GOLD).stroke(ink);
  // the head: a cat's (ears, a strong jaw), blank glowing eyes, a stripe of teal
  g.poly(P([-70, -560, -96, -680, -20, -610])).fill(body).stroke(ink);
  g.poly(P([70, -560, 96, -680, 20, -610])).fill(body).stroke(ink);
  g.poly(P([-86, -560, -70, -620, 0, -640, 70, -620, 86, -560, 60, -480, 0, -455, -60, -480])).fill(body).stroke(ink);
  g.poly(P([-60, -560, -16, -548, -22, -530, -62, -540])).fill(0xffffff);
  g.poly(P([60, -560, 16, -548, 22, -530, 62, -540])).fill(0xffffff);
  g.poly(P([-8, -640, 8, -640, 6, -590, -6, -590])).fill(light);
  g.poly(P([-30, -488, 0, -478, 30, -488, 0, -470])).fill({ color: C.ink, alpha: 0.6 });
  // the waist fades into an aura (the spirit has no legs)
  g.poly(P([-95, 0, 95, 0, 140, 90, 40, 60, 0, 130, -40, 60, -140, 90])).fill({ color: body, alpha: 0.5 });
  return g;
}

/** a sardine (origin at its middle, pointing +x) */
function sardine(s: number) {
  const g = new Graphics();
  g.poly([-46 * s, 0, -70 * s, -20 * s, -66 * s, 0, -70 * s, 20 * s]).fill(0x8aa6c8).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.poly(ngon(0, 0, 50 * s, 16 * s, 12)).fill(0xc8d8ea).stroke({ width: 3 * s, color: C.ink });
  g.poly(ngon(0, -4 * s, 44 * s, 7 * s, 10)).fill(0x6a86b0);
  g.poly(ngon(32 * s, -3 * s, 4 * s, 4 * s, 6)).fill(C.ink);
  return g;
}

/** the spirit's paw (a fist) at (x, y), turned `a`, radius r */
function fist(g: Graphics, x: number, y: number, r: number, a: number, fill: number) {
  g.poly(streak(x - Math.cos(a) * r * 3.2, y - Math.sin(a) * r * 3.2, x, y, r * 0.15, r * 0.8)).fill({ color: 0xffffff, alpha: 0.5 });
  g.poly(ngon(x, y, r, r * 0.86, 10, a)).fill(fill).stroke({ width: Math.max(2, r * 0.12), color: C.ink });
  for (let k = -1; k <= 1; k++) g.poly(ngon(x + Math.cos(a) * r * 0.7 + Math.cos(a + 1.57) * k * r * 0.45, y + Math.sin(a) * r * 0.7 + Math.sin(a + 1.57) * k * r * 0.45, r * 0.24, r * 0.24, 6)).fill(0xffd8f0);
}

/** the CONTINUARÁ arrow (the episode's freeze-frame sign), origin at its left */
function arrow() {
  const k = new Container();
  const g = new Graphics();
  const pts = [0, -46, 330, -46, 330, -74, 420, 0, 330, 74, 330, 46, 0, 46, -30, 0];
  g.poly(pts.map((v, i) => v + (i % 2 ? 7 : 7))).fill(C.ink);
  g.poly(pts).fill(0xe8d8a8).stroke({ width: 6, color: 0x3a2a18, join: 'miter' });
  const t = txt('CONTINUARÁ', { fontFamily: F.heavy, fontSize: 40, fill: 0x3a2a18, letterSpacing: 2 });
  t.anchor.set(0.5);
  t.position.set(180, 0);
  k.addChild(g, t);
  return k;
}

interface World {
  k: Container;
  go: Graphics;
  hands: Graphics[];
}

/** the whole page (normal or inverted): blocks turning, screentone, focus lines, the clock and its hands, the ゴ */
function world(w: number, h: number, cx: number, cy: number, i: boolean, scale = 1): World {
  const k = new Container();
  const spin = new Container();
  spin.position.set(cx, cy);
  const bg = new Graphics();
  blocks(bg, 0, 0, Math.hypot(w, h) * 1.1, i, w, h);
  spin.addChild(bg);
  const tone = new Graphics();
  diamonds(tone, 0, h * 0.62, w, h * 0.4, 26 * scale, 0, 9 * scale, col(C.ink, i), 0.28);
  const fl = new Graphics();
  rays(fl, cx, cy, 64, 330 * scale, Math.hypot(w, h), 9 * scale, col(0xffffff, i), 0.35, 11);
  const clock = new Graphics();
  clockFace(clock, cx, cy, 420 * scale, i);
  const hands = [hand(260 * scale, 20 * scale, i), hand(380 * scale, 14 * scale, i)];
  for (const hd of hands) hd.position.set(cx, cy);
  const go = new Graphics();
  k.addChild(spin, tone, fl, clock, ...hands, go);
  return { k, go, hands };
}

interface St {
  N: World;
  I: World;
  dome: Graphics;
  mask: { r: number };
  spirit: Container;
  fish: Container[];
  frozen: { v: boolean };
  head: Head;
  rush: Container;
  pageK: Container;
}
const S = stash<St>();

export const gatojo: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO BIZARRO',
  open(c: SigCtx) {
    const cx = W / 2;
    const cy = c.catY - 20;
    const pageK = new Container();
    const N = world(W, H, cx, cy, false);
    const I = world(W, H, cx, cy, true);
    // the inverted page shows only inside the dome (it swells out of him when time stops)
    const dome = new Graphics();
    const mask = { r: 0 };
    const drawDome = () => {
      if (dome.destroyed) return;
      dome.clear().poly(ngon(cx, cy, Math.max(1, mask.r), Math.max(1, mask.r), 56)).fill(0xffffff);
      I.k.visible = mask.r > 2;
    };
    I.k.mask = dome;
    pageK.addChild(N.k, I.k, dome);
    c.back.addChild(pageK);
    hideDisc(c, 0.15);
    drawDome();
    // the spirit behind his shoulder
    const sp = new Container();
    const glow = new Graphics();
    for (let k = 7; k >= 1; k--) glow.poly(ngon(0, -330, 120 + k * 46, 180 + k * 52, 28)).fill({ color: 0xb07aff, alpha: 0.05 });
    sp.addChild(glow, spirit(0.95));
    sp.position.set(W / 2 + 190, c.catY + 230);
    c.behind.addChild(sp);
    const frozen = { v: false };
    // prepared words (built now, shown later)
    const quietos = prepWord(c.fg, W / 2 - 520, 230, '¡QUIETOS!', 0xffffff, 112, -0.1);
    const toc = prepWord(c.fg, cx + 330, cy - 330, '¡TOC!', GOLD, 96, 0.12);
    const power = new Container();
    {
      const g = new Graphics().poly(rrect(0, 0, 560, 92, 6)).fill({ color: C.ink, alpha: 0.9 }).stroke({ width: 4, color: GOLD });
      const a = txt('PODER', { fontFamily: F.heavy, fontSize: 22, fill: GOLD, letterSpacing: 6 });
      a.position.set(22, 10);
      const b = txt('SIESTA DE PLATINO', { fontFamily: F.heavy, fontSize: 40, fill: 0xffffff });
      b.position.set(22, 36);
      power.addChild(g, a, b);
      power.position.set(W - 640, H - 300);
      power.alpha = 0.001;
      c.fg.addChild(power);
    }
    const rush = prepWord(c.fg, W - 470, 540, '¡MIAUMIAUMIAUMIAU!', 0xff4fa3, 88, -0.1);
    const head = prepHead(c, '¡EL TIEMPO SE DETIENE…', { fontFamily: F.heavy, fontSize: 92, fill: GOLD, stroke: { color: C.ink, width: 12, join: 'round' }, dropShadow: { color: VIOLET, distance: 8, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…para la siesta.',
      asideStyle: { fill: TEAL },
      maxW: 820,
      at: [470, 690],
    });
    const fish: Container[] = [];
    S.set(c, { N, I, dome, mask, spirit: sp, fish, frozen, head, rush, pageK });

    // the page lives: the blocks turn, the ゴ rise, the hands sweep (until time stops)
    const spinN = N.k.children[0];
    const spinI = I.k.children[0];
    let tFrozen = 0;
    const shown = { v: c.short || c.reduce ? 99 : 0 };
    const frame = (t: number) => {
      if (N.go.destroyed) return;
      const tt = frozen.v ? tFrozen : t;
      if (!frozen.v) tFrozen = t;
      spinN.rotation = spinI.rotation = tt * 0.05;
      drawGo(N.go, W, H, tt, 6, 1, false, shown.v);
      if (I.k.visible) drawGo(I.go, W, H, tt, 6, 1, true, shown.v);
      const m = tt * 2.4;
      for (const wd of [N, I]) {
        wd.hands[0].rotation = m / 12 + 1.2;
        wd.hands[1].rotation = m;
      }
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) {
      sp.alpha = 0.8;
      return;
    }

    // the spirit rises behind him
    if (c.reduce) sp.alpha = 0.85;
    else {
      sp.alpha = 0;
      sp.y += 140;
      gsap.to(sp, { alpha: 0.85, y: sp.y - 140, duration: 0.5, delay: 0.3, ease: 'power2.out' });
      gsap.to(glow, { alpha: 0.5, duration: 0.18, yoyo: true, repeat: 9, delay: 0.8, ease: 'sine.inOut' });
    }
    // the ゴ pop up one by one, rumbling
    for (let k = 1; k <= 12; k++) beat(c, 0.05 + k * 0.07, () => {
      shown.v = k;
      if (k % 3 === 0) sfx('boom', 0.45 + k * 0.01);
    });
    beat(c, 0.3, () => {
      sfx('charge', 0.7);
      c.shaker.add(0.12);
    });
    // the clock ticks
    for (let k = 0; k < 4; k++) beat(c, 0.1 + k * 0.24, () => sfx('tick', 1.6));
    // sardines fly at him from both sides
    const at: [number, number, number][] = [
      [-1, 300, 0.55],
      [1, 220, 0.6],
      [-1, 520, 0.68],
      [1, 460, 0.74],
      [-1, 700, 0.8],
      [1, 680, 0.86],
    ];
    for (const [side, y, d] of at) {
      beat(c, d, () => {
        const f = sardine(1.3);
        f.scale.x = side < 0 ? 1 : -1;
        f.position.set(side < 0 ? -120 : W + 120, y);
        c.fg.addChild(f);
        fish.push(f);
        sfx('whoosh', 1.4);
        // they'd hit him at ~1.35 s: time stops first (their tween is killed then)
        const tx = W / 2 + side * (300 + Math.random() * 60);
        if (c.reduce) f.position.set(tx, y + (c.catY - y) * 0.3);
        else gsap.to(f, { x: tx, y: y + (c.catY - y) * 0.3, rotation: side * -0.3, duration: 1.35 - d + 0.35, ease: 'none' });
      });
    }
    // ¡TOC!: the clock stops — the dome of inverted color swells out of him; everything hangs
    beat(c, 1.08, () => {
      frozen.v = true;
      sfx('freeze', 0.9);
      sfx('glitch', 0.6);
      sfx('hit', 0.5);
      c.shaker.add(0.25);
      for (const f of fish) {
        gsap.killTweensOf(f);
        if (!f.destroyed) f.tint = 0x6a5a8a;
      }
      show(c, toc, 0.7, { from: 1.8 });
      if (c.reduce) {
        mask.r = 2400;
        drawDome();
        drawGo(I.go, W, H, 0, 6, 1, true, 99);
      } else gsap.to(mask, { r: 2400, duration: 0.4, ease: 'power2.in', onUpdate: drawDome });
    });
    beat(c, 1.35, () => {
      sfx('hit', 0.7);
      show(c, quietos, 0.85, { from: 2.4 });
    });
    beat(c, 1.7, () => {
      sfx('sting', 0.8);
      if (power.destroyed) return;
      power.alpha = 1;
      if (!c.reduce) gsap.from(power, { x: W + 40, duration: 0.25, ease: 'power3.out' });
      fadeKill(power, 0.85, 0.25);
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 0.95);
    sfx('bigboom', 0.7);
    c.shaker.add(0.45);
    flashOf(c, 0xffffff, 0.6, 0.35);
    if (st) {
      const { mask, dome, I } = st;
      st.frozen.v = false;
      // time resumes: the dome collapses back into him
      const drawDome = () => {
        if (dome.destroyed) return;
        dome.clear().poly(ngon(W / 2, c.catY - 20, Math.max(1, mask.r), Math.max(1, mask.r), 56)).fill(0xffffff);
        I.k.visible = mask.r > 2;
      };
      gsap.killTweensOf(mask);
      if (c.reduce || c.short) {
        mask.r = 0;
        drawDome();
      } else gsap.to(mask, { r: 0, duration: 0.3, ease: 'power3.in', onUpdate: drawDome });
      if (!st.spirit.destroyed) {
        gsap.killTweensOf(st.spirit);
        st.spirit.alpha = 0.9;
        if (!c.reduce) gsap.fromTo(st.spirit.scale, { x: 1.08, y: 1.08 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
      }
      // the paw rush: fists everywhere, then the sardines fly off
      if (!c.short) {
        const g = new Graphics();
        c.fg.addChild(g);
        const r = rnd(77);
        if (c.reduce) {
          for (let k = 0; k < 10; k++) fist(g, W / 2 - 600 + r() * 360, c.catY - 220 + r() * 300, 40 + r() * 20, Math.PI + (r() - 0.5) * 0.8, SPIRIT);
          fadeKill(g, 0.6, 0.3);
        } else {
          let n = 0;
          const stop = every(c, 30, () => {
            if (g.destroyed || n++ > 18) return stop();
            g.clear();
            for (let k = 0; k < 12; k++) fist(g, W / 2 - 640 + r() * 400, c.catY - 250 + r() * 330, 36 + r() * 26, Math.PI + (r() - 0.5) * 0.9, k % 2 ? SPIRIT : 0x9a6ae8);
          });
          later(c, 0.62, () => destroyTree(g));
        }
        for (const f of st.fish) {
          if (f.destroyed) continue;
          gsap.killTweensOf(f);
          f.tint = 0xffffff;
          const side = f.x < W / 2 ? -1 : 1;
          if (c.reduce) {
            destroyTree(f);
            continue;
          }
          gsap.to(f, { x: f.x + side * (900 + Math.random() * 300), y: f.y - 300 - Math.random() * 300, rotation: side * 8, duration: 0.7, delay: Math.random() * 0.25, ease: 'power2.out', onComplete: () => destroyTree(f) });
        }
        for (let k = 0; k < 4; k++) later(c, k * 0.09, () => sfx('hit', 1.2 + k * 0.15));
        show(c, st.rush, 0.9, { from: 2 });
      } else destroyTree(st.rush);
    }
    showHead(c, st?.head, { dur: 2.5 });
    // the freeze frame: sepia page, the CONTINUARÁ arrow
    if (!c.short)
      later(c, 1.5, () => {
        if (st && !st.pageK.destroyed) {
          if (c.reduce) st.pageK.tint = 0xd8b890;
          else {
            const p = { v: 0 };
            gsap.to(p, { v: 1, duration: 0.3, onUpdate: () => !st.pageK.destroyed && (st.pageK.tint = mixTint(p.v)) });
          }
        }
        sfx('sting', 1.3);
        const a = arrow();
        a.position.set(W - 520, H - 270);
        a.rotation = -0.02;
        c.fg.addChild(a);
        if (!c.reduce) gsap.from(a, { x: W + 60, duration: 0.3, ease: 'power3.out' });
        fadeKill(a, 1.8, 0.4);
      });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const cx = w / 2;
    const cy = h * 0.46;
    const bg = new Graphics();
    blocks(bg, cx, cy, Math.hypot(w, h) * 1.05, false, w, h);
    const tone = new Graphics();
    diamonds(tone, 0, h * 0.64, w, h * 0.38, Math.max(8, 26 * s * 1.6), 0, Math.max(1.5, 9 * s * 1.6), C.ink, 0.25);
    const fl = new Graphics();
    rays(fl, cx, cy, 48, m * 0.32, Math.hypot(w, h), Math.max(2, 9 * s), 0xffffff, 0.3, 11);
    const clock = new Graphics();
    clockFace(clock, cx, cy, m * 0.42, false);
    const hands = [hand(m * 0.26, Math.max(4, 20 * s), false), hand(m * 0.37, Math.max(3, 14 * s), false)];
    for (const hd of hands) hd.position.set(cx, cy);
    hands[0].rotation = 1.2;
    hands[1].rotation = -0.5;
    const sp = spirit(0.62 * s * 1.6);
    sp.position.set(cx + m * 0.2, h * 0.98);
    sp.alpha = 0.75;
    const go = new Graphics();
    // the ゴ at the card's sides (the page is wide: they fill its edges; the grid card: just a few)
    const goK = Math.max(0.12, s * 1.2);
    const goN = w > h * 2 ? 6 : w > 200 ? 3 : 2;
    drawGo(go, w, h, 0.4, goN, goK, false);
    k.addChild(bg, tone, fl, clock, ...hands, sp, go);
    if (live)
      liveLoop(k, (t) => {
        drawGo(go, w, h, 0.4 + t, goN, goK, false);
        hands[1].rotation = -0.5 + t * 0.8;
        hands[0].rotation = 1.2 + t * 0.07;
        sp.alpha = 0.7 + Math.sin(t * 5) * 0.08;
      });
    return k;
  },
};

/** white → sepia, v in 0..1 (a tint) */
function mixTint(v: number) {
  const r = Math.round(255 + (0xd8 - 255) * v);
  const g = Math.round(255 + (0xb8 - 255) * v);
  const b = Math.round(255 + (0x90 - 255) * v);
  return (r << 16) | (g << 8) | b;
}
