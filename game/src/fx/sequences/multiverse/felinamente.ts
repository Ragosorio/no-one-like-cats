/**
 * Felinamente Rubia, la Abogada de Rosa: the pink universe (a law-school comedy where everything is pink). A courtroom
 * all in pink: rose-marble columns under a cornice, rose-wood panelling, a pink-and-white marble floor, the court's seal
 * (a paw on the scales, a heart in the middle), the jury box full of cats on the left and the judge's bench on the right,
 * where a white-wigged cat judge bangs the gavel (¡TOC! ¡TOC! ¡TOC!): EL GATO vs. LA ASPIRADORA. The papers of the case
 * fly up and drift down in slow motion through the light; the jury gasps (¡OOOH!); the kitten in her bag peeps «¡miu!»;
 * her pink law book glints.
 * Payoff: one last gavel, pink light, hearts and papers in the air, the jury on its feet; ¡OBJECIÓN! / …¡ha lugar! Y con
 * brillito. (No film names, no lines from it: just pink, law and a kitten in a bag.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, cheer, every, fall, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, balloon, ngon, onCat, rnd, say, streak, twinkle } from './kitD';
import { heartPts } from './kitH';
import { at, comic, head, pre, wrap } from './kitI';
import { drift, glint, sheet } from './kitL';

const PINK = 0xff6fb5;
const PINK_L = 0xfcd3e4;
const PINK_M = 0xf7b6d2;
const ROSE = 0xe58fb8;
const ROSE_D = 0xb85a8a;
const ROSE_DD = 0x8a3a66;
const MARBLE = 0xffe3ef;
const GOLD = 0xffd23f;
const HZ = 720;
const COLS = [300, 700, 1220, 1620];
/** the judge's bench (right) and the jury box (left) */
const BX0 = 1190;
const BX1 = 1720;
const BY = 440;
const JX0 = 170;
const JX1 = 640;
const BLOCK: [number, number] = [1600, BY - 8];

/** a rose-marble column (origin at its foot, height h, width w): base, fluted shaft, an ionic capital */
function column(g: Graphics, x: number, y: number, h: number, w: number, k = 1) {
  g.rect(x - w * 0.7, y - 22 * k, w * 1.4, 22 * k).fill(ROSE).rect(x - w * 0.62, y - 38 * k, w * 1.24, 16 * k).fill(MARBLE);
  g.rect(x - w / 2, y - h, w, h - 38 * k).fill(MARBLE);
  for (let i = 1; i < 6; i++) g.rect(x - w / 2 + (i * w) / 6 - 2.5 * k, y - h + 8 * k, 5 * k, h - 54 * k).fill({ color: ROSE, alpha: 0.55 });
  g.poly(streak(x - w * 0.3, y - h * 0.8, x + w * 0.1, y - h * 0.45, 2 * k, 1 * k)).fill({ color: 0xffffff, alpha: 0.8 });
  g.poly(streak(x + w * 0.2, y - h * 0.4, x - w * 0.1, y - h * 0.15, 2 * k, 1 * k)).fill({ color: 0xffffff, alpha: 0.7 });
  g.rect(x - w * 0.7, y - h - 20 * k, w * 1.4, 20 * k).fill(MARBLE).stroke({ width: 3 * k, color: ROSE });
  for (const d of [-1, 1]) {
    g.poly(ngon(x + d * w * 0.62, y - h - 4 * k, 17 * k, 17 * k, 12)).fill(MARBLE).stroke({ width: 3 * k, color: ROSE });
    g.poly(ngon(x + d * w * 0.62, y - h - 4 * k, 6 * k, 6 * k, 8)).fill(ROSE);
  }
}

/** the court's seal: a ring, the scales hanging from a paw-topped post, a heart in the middle (invented, no real seal) */
function seal(g: Graphics, x: number, y: number, r: number) {
  g.poly(ngon(x, y, r, r, 32)).fill(GOLD).stroke({ width: r / 14, color: ROSE_DD });
  g.poly(ngon(x, y, r * 0.82, r * 0.82, 32)).fill(PINK_L).stroke({ width: r / 24, color: ROSE_D });
  g.rect(x - r * 0.04, y - r * 0.55, r * 0.08, r * 1.0).fill(ROSE_DD);
  g.poly(streak(x - r * 0.55, y - r * 0.38, x + r * 0.55, y - r * 0.38, r * 0.035, r * 0.035)).fill(ROSE_DD);
  for (const d of [-1, 1]) {
    g.poly([x + d * r * 0.55, y - r * 0.38, x + d * r * 0.36, y + r * 0.02, x + d * r * 0.74, y + r * 0.02]).stroke({ width: r / 50, color: ROSE_DD });
    g.poly([x + d * r * 0.3, y + r * 0.02, x + d * r * 0.8, y + r * 0.02, x + d * r * 0.68, y + r * 0.14, x + d * r * 0.42, y + r * 0.14]).fill(GOLD).stroke({ width: r / 40, color: ROSE_DD });
  }
  g.poly(heartPts(x, y + r * 0.18, r * 0.24, 10)).fill(PINK).stroke({ width: r / 40, color: ROSE_DD });
  g.poly(ngon(x, y - r * 0.6, r * 0.1, r * 0.09, 8)).fill(ROSE_DD);
  for (const [dx, dy] of [
    [-0.1, -0.13],
    [-0.035, -0.17],
    [0.035, -0.17],
    [0.1, -0.13],
  ])
    g.poly(ngon(x + dx * r, y - r * 0.6 + dy * r * 0.5, r * 0.035, r * 0.04, 6)).fill(ROSE_DD);
}

/** the pink-and-white marble floor in perspective, from hz down to bottom (tiles shrink toward the back) */
function checker(g: Graphics, w: number, hz: number, bottom: number, cx: number, k = 1) {
  g.rect(-200 * k, hz, w + 400 * k, bottom - hz).fill(0xffffff);
  const N = 7;
  const tile = 150 * k;
  const yAt = (j: number) => hz + (bottom - hz) * Math.pow(j / N, 1.5);
  const sAt = (y: number) => 0.38 + ((y - hz) / (bottom - hz)) * 1.1;
  for (let j = 0; j < N; j++) {
    const ya = yAt(j);
    const yb = yAt(j + 1);
    const sa = sAt(ya);
    const sb = sAt(yb);
    for (let i = -14; i < 14; i++) {
      if ((i + j) % 2 === 0) continue;
      g.poly([cx + i * tile * sa, ya, cx + (i + 1) * tile * sa, ya, cx + (i + 1) * tile * sb, yb, cx + i * tile * sb, yb]).fill(0xf9a8cb);
    }
  }
  g.rect(-200 * k, hz, w + 400 * k, 8 * k).fill(ROSE_D);
}

/** the white-wigged cat judge behind the bench (origin at the bench top, center of the judge) */
function judge(s = 1) {
  const g = new Graphics();
  g.poly([-90 * s, 0, -70 * s, -120 * s, 70 * s, -120 * s, 90 * s, 0]).fill(0x1e1a24);
  g.poly([-16 * s, -120 * s, 16 * s, -120 * s, 0, -90 * s]).fill(0xffffff);
  g.poly(ngon(0, -170 * s, 52 * s, 48 * s, 16)).fill(0x9a8a8e);
  for (const d of [-1, 1]) g.poly([d * 20 * s, -205 * s, d * 46 * s, -240 * s, d * 50 * s, -190 * s]).fill(0x9a8a8e);
  // the curly white wig
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.9 + (i / 8) * 1.2);
    g.poly(ngon(Math.cos(a) * 56 * s, -172 * s + Math.sin(a) * 50 * s, 18 * s, 16 * s, 10)).fill(0xf6f2ee).stroke({ width: 2 * s, color: 0xcfc6c8 });
  }
  for (const d of [-1, 1]) for (let i = 0; i < 3; i++) g.poly(ngon(d * 58 * s, -140 * s + i * 26 * s, 16 * s, 14 * s, 10)).fill(0xf6f2ee).stroke({ width: 2 * s, color: 0xcfc6c8 });
  for (const d of [-1, 1]) {
    g.poly(ngon(d * 20 * s, -172 * s, 13 * s, 11 * s, 10)).stroke({ width: 3 * s, color: 0x2a2028 });
    g.poly(ngon(d * 20 * s, -172 * s, 4 * s, 5 * s, 6)).fill(0x2a2028);
  }
  g.rect(-8 * s, -174 * s, 16 * s, 3 * s).fill(0x2a2028);
  g.poly([-8 * s, -152 * s, 8 * s, -152 * s, 0, -144 * s]).fill(0xd88aa0);
  return g;
}

/** the gavel (origin at the paw's grip): a handle and a head, swung by rotation */
function gavel(s = 1) {
  const g = new Graphics();
  g.poly(streak(0, 0, 70 * s, 0, 6 * s, 5 * s)).fill(0x6a3a24).stroke({ width: 2 * s, color: C.ink });
  g.rect(60 * s, -26 * s, 40 * s, 52 * s).fill(0x8a4a2a).stroke({ width: 3 * s, color: C.ink });
  g.rect(60 * s, -26 * s, 40 * s, 8 * s).fill(GOLD).rect(60 * s, 18 * s, 40 * s, 8 * s).fill(GOLD);
  return g;
}

/** the scene's wall, cornice, columns, seal (the static back of the courtroom), sized w×h at scale k, centered on cx */
function hall(g: Graphics, w: number, h: number, hz: number, k: number, cx: number, cols: number[]) {
  vgrad(g, -200 * k, -200 * k, w + 400 * k, hz + 200 * k, [PINK_L, PINK_M, 0xf2a2c6], 10);
  // god rays from the upper left
  for (let i = 0; i < 4; i++) {
    const x = cx - 700 * k + i * 300 * k;
    g.poly([x, -20 * k, x + 120 * k, -20 * k, x + 520 * k, hz, x + 300 * k, hz]).fill({ color: 0xffffff, alpha: 0.12 });
  }
  // panelling below
  g.rect(-200 * k, hz - 250 * k, w + 400 * k, 250 * k).fill(ROSE);
  g.rect(-200 * k, hz - 256 * k, w + 400 * k, 14 * k).fill(ROSE_D);
  for (let x = cx - 1100 * k; x < w + 100 * k; x += 150 * k) g.rect(x, hz - 220 * k, 110 * k, 190 * k).stroke({ width: 4 * k, color: ROSE_D });
  // the cornice
  g.rect(-200 * k, 0, w + 400 * k, 110 * k).fill(MARBLE);
  g.rect(-200 * k, 96 * k, w + 400 * k, 18 * k).fill(ROSE);
  for (let x = cx - 1200 * k; x < w + 100 * k; x += 46 * k) g.rect(x, 74 * k, 22 * k, 22 * k).fill(ROSE);
  for (const x of cols) column(g, x, hz, hz - 132 * k, 90 * k, k);
}

/** the jury box (left): a rose-wood rail in front of two rows of cats */
function juryRail(g: Graphics, x0: number, x1: number, y: number, hz: number, k = 1) {
  g.rect(x0, y, x1 - x0, hz - y).fill(ROSE_D).stroke({ width: 4 * k, color: ROSE_DD });
  g.rect(x0 - 10 * k, y - 12 * k, x1 - x0 + 20 * k, 16 * k).fill(ROSE_DD);
  for (let x = x0 + 20 * k; x < x1 - 60 * k; x += 110 * k) g.rect(x, y + 26 * k, 80 * k, hz - y - 50 * k).stroke({ width: 4 * k, color: ROSE_DD });
}

interface St {
  rows: Graphics[];
  gv: Container;
  hearts: Container;
  papers: Container;
}
const S = stash<St>();

/** the gavel's swing: up → down on the block, with a ring */
function bang(c: SigCtx, gv: Container, big = false) {
  if (gv.destroyed) return;
  sfx('hit', big ? 0.5 : 0.75);
  if (big) sfx('boom', 0.8);
  c.shaker.add(big ? 0.25 : 0.08);
  if (!c.reduce) gsap.fromTo(gv, { rotation: -1.1 }, { rotation: 0.12, duration: 0.09, ease: 'power3.in', yoyo: true, repeat: 1, repeatDelay: 0.05 });
}

export const felinamente: Signature = {
  dark: false,
  frame: PINK,
  tag: 'UNIVERSO ROSA',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    hall(g, W, H, HZ, 1, 960, COLS);
    seal(g, 960, 200, 92);
    const fl = new Graphics();
    checker(fl, W, HZ, H + 200, 960);
    // the jury: two rows of cats behind the rail
    const rows: Graphics[] = [];
    const jcols = [0x9a8a8e, 0xe8b07a, 0x3a3236, 0xf6efe4, 0xc77a4a, 0x7a7a8a];
    for (let j = 0; j < 2; j++) {
      const row = new Graphics();
      const r = rnd(20 + j);
      for (let x = JX0 + 46 + j * 40; x < JX1 - 30; x += 92) {
        const col = jcols[Math.floor(r() * jcols.length)];
        row.poly([x - 34, 560 + j * 40, x - 28, 500 + j * 40, x + 28, 500 + j * 40, x + 34, 560 + j * 40]).fill(r() < 0.5 ? 0x2a2a3a : 0x5a3a6a);
        head(row, x, 470 + j * 40, 30, col);
        row.poly(ngon(x - 10, 466 + j * 40, 4, 5, 6)).fill(C.ink).poly(ngon(x + 10, 466 + j * 40, 4, 5, 6)).fill(C.ink);
      }
      rows.push(row);
    }
    const jr = new Graphics();
    juryRail(jr, JX0, JX1, 540, HZ);
    // the bench (right) with the judge and the gavel
    const jd = judge(1);
    jd.position.set(1440, BY);
    const bench = new Graphics();
    bench.rect(BX0, BY, BX1 - BX0, HZ - BY).fill(ROSE_D).stroke({ width: 5, color: ROSE_DD });
    bench.rect(BX0 - 20, BY - 16, BX1 - BX0 + 40, 22).fill(ROSE_DD);
    bench.rect(BX0 + 40, BY + 60, BX1 - BX0 - 80, 150).stroke({ width: 5, color: ROSE_DD });
    bench.rect(BLOCK[0] - 34, BLOCK[1] - 12, 68, 16).fill(0x6a3a24).stroke({ width: 3, color: C.ink });
    const sign = txt('JUZGADO FELINO', { fontFamily: F.poster, fontSize: 44, fill: GOLD, stroke: { color: ROSE_DD, width: 6 } });
    sign.anchor.set(0.5);
    sign.position.set((BX0 + BX1) / 2, BY + 135);
    const gv = new Container();
    gv.addChild(gavel(1.15));
    gv.position.set(BLOCK[0] - 92, BLOCK[1] - 30);
    gv.rotation = -0.5;
    const papers = new Container();
    const hearts = new Container();
    k.addChild(g, fl, ...rows, jr, jd, gv, bench, sign, papers, hearts);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(0xffffff, 380, 0.5);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    S.set(c, { rows, gv, hearts, papers });
    // the sparkle in the air (a slow drizzle of twinkles while the card is up)
    const tw = new Graphics();
    k.addChild(tw);
    const frame = (t: number) => {
      if (tw.destroyed) return;
      tw.clear();
      const r = rnd(9);
      for (let i = 0; i < 26; i++) {
        const x = r() * W;
        const y = 140 + r() * (HZ - 160);
        const v = Math.max(0, Math.sin(t * 2.2 + r() * 6.28));
        if (v > 0.15) tw.poly(twinkle(x, y, 7 + v * 9, 0.22)).fill({ color: 0xffffff, alpha: v * 0.9 });
      }
    };
    frame(0.6);
    if (!c.reduce) every(c, 24, frame);
    if (c.short) return;

    const tocs = [0, 1, 2].map((i) => pre(c, comic('¡TOC!', 0xffffff, 80 - i * 6), 1500 + i * 110, 300 - i * 50, 0.1 + i * 0.05));
    const caso = pre(c, plate('EL GATO vs. LA ASPIRADORA', PINK, C.ink, 40), 520, 250, -0.05);
    const ooh = pre(c, comic('¡OOOH!', PINK_L, 92), 400, 380, -0.08);
    // the gavel, three times
    [0.1, 0.34, 0.58].forEach((d, i) =>
      at(c, d, () => {
        bang(c, gv);
        later(c, 0.09, () => tocs[i](0.5));
      }),
    );
    at(c, 0.7, () => {
      caso(0.85);
      sfx('sting', 1.15);
    });
    // the case's papers fly up and drift down in slow motion
    at(c, 0.85, () => {
      sfx('paper', 1);
      later(c, 0.2, () => sfx('paper', 1.2));
      const r = rnd(4);
      for (let i = 0; i < (c.reduce ? 4 : 11); i++) {
        const p = sheet(70, 92, { fold: i % 3 === 0 });
        p.rotation = (r() - 0.5) * 1.2;
        const x = 300 + r() * (W - 600);
        const y = 120 + r() * 200;
        drift(c, papers, p, x, y, { dy: 340 + r() * 200, dx: (r() - 0.5) * 300, dur: 2.2 + r() * 0.8, spin: (r() - 0.5) * 3, delay: i * 0.04 });
      }
    });
    // the jury gasps
    at(c, 1.25, () => {
      ooh(0.6);
      sfx('purr', 1.5);
      if (!c.reduce) rows.forEach((row, i) => gsap.fromTo(row, { y: 0 }, { y: -18, duration: 0.14, delay: i * 0.05, yoyo: true, repeat: 1 }));
    });
    // the kitten in the bag peeps; the law book glints
    at(c, 1.5, () => {
      const [bx, by] = onCat(c, 0.68, 0.45);
      say(c, c.fg, balloon('¡miu!', { size: 30, tx: -30, ty: 50 }), bx + 70, by - 70, 0.6, 0.06);
      sfx('meow', 2.2);
      const hg = new Graphics().poly(heartPts(0, 0, 18, 10)).fill(PINK).stroke({ width: 3, color: C.ink });
      hg.position.set(bx, by - 20);
      c.fg.addChild(hg);
      if (!c.reduce) gsap.to(hg, { y: by - 110, duration: 0.8, ease: 'sine.out' });
      gsap.to(hg, { alpha: 0, delay: 0.55, duration: 0.25, onComplete: () => destroyTree(hg) });
    });
    at(c, 1.78, () => {
      const [lx, ly] = onCat(c, 0.38, 0.42);
      glint(c, c.fg, lx, ly, 46);
      sfx('gem', 1.4);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.05);
    c.shaker.add(0.25);
    flashOf(c, 0xffd6ea, 0.5, 0.4);
    if (st) {
      bang(c, st.gv, true);
      // the jury on its feet, hearts over the room
      if (!c.reduce) st.rows.forEach((row, i) => gsap.fromTo(row, { y: 0 }, { y: -26, duration: 0.16, delay: i * 0.06, yoyo: true, repeat: 5 }));
      for (let i = 0; i < (c.reduce ? 5 : 16); i++) {
        const hg = new Graphics().poly(heartPts(0, 0, 14 + (i % 4) * 6, 10)).fill(i % 3 ? PINK : 0xffffff).stroke({ width: 3, color: ROSE_DD });
        hg.position.set(JX0 + Math.random() * (JX1 - JX0), 480 + Math.random() * 60);
        if (i % 2) hg.position.set(250 + Math.random() * (W - 500), 600 + Math.random() * 100);
        st.hearts.addChild(hg);
        if (c.reduce) {
          gsap.to(hg, { alpha: 0, delay: 1.5, duration: 0.4, onComplete: () => destroyTree(hg) });
          continue;
        }
        gsap.to(hg, { y: hg.y - 360 - Math.random() * 200, x: hg.x + (Math.random() - 0.5) * 120, duration: 2, delay: i * 0.05, ease: 'sine.out' });
        gsap.to(hg, { alpha: 0, delay: 1.5 + i * 0.05, duration: 0.5, onComplete: () => destroyTree(hg) });
      }
    }
    fall(c, c.fg, (i) => (i % 2 ? sheet(54, 70, { fold: true }) : new Graphics().poly(heartPts(0, 0, 18, 10)).fill(i % 4 ? PINK : 0xffffff).stroke({ width: 3, color: ROSE_DD })), { n: 18, over: 1.5, dur: 1.9, spread: W, spin: 2 });
    const [lx, ly] = onCat(c, 0.38, 0.42);
    later(c, 0.3, () => glint(c, c.fg, lx, ly, 60));
    later(c, 0.55, () => glint(c, c.fg, ...onCat(c, 0.62, 0.2), 40));
    cheer(c, '¡OBJECIÓN!', PINK, 150, 2.3);
    aside(c, '…¡ha lugar! Y con brillito.', 0xffffff, { delay: 0.6, dur: 2.4, ink: ROSE_DD });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.2, h / 1080);
    const hz = h * 0.7;
    const cx = w / 2;
    const side = Math.min(w * 0.42, m * 0.85);
    const cols = [cx - side, cx - side * 0.42, cx + side * 0.42, cx + side];
    const g = new Graphics();
    hall(g, w, h, hz, u, cx, cols);
    seal(g, cx, h * 0.19, 80 * u);
    const fl = new Graphics();
    checker(fl, w, hz, h, cx, u);
    const jr = new Graphics();
    const jw = Math.min(380 * u, side * 0.6);
    juryRail(jr, cx - side - jw * 0.3, cx - side + jw, hz - 170 * u, hz, u);
    const bench = new Graphics();
    bench.rect(cx + side * 0.55, hz - 260 * u, Math.min(460 * u, side * 0.7), 260 * u).fill(ROSE_D).stroke({ width: 4 * u, color: ROSE_DD });
    bench.rect(cx + side * 0.55 - 14 * u, hz - 274 * u, Math.min(460 * u, side * 0.7) + 28 * u, 18 * u).fill(ROSE_DD);
    const tw = new Graphics();
    const papers = new Graphics();
    const draw = (t: number) => {
      tw.clear();
      papers.clear();
      const r = rnd(9);
      for (let i = 0; i < 18; i++) {
        const x = r() * w;
        const y = h * 0.12 + r() * h * 0.6;
        const v = Math.max(0, Math.sin(t * 2.2 + r() * 6.28));
        if (v > 0.15) tw.poly(twinkle(x, y, (7 + v * 9) * u + 1, 0.22)).fill({ color: 0xffffff, alpha: v * 0.9 });
      }
      for (let i = 0; i < 6; i++) {
        const q = (t * 0.12 + i / 6) % 1;
        const x = cx + (r() - 0.5) * w * 0.95 + Math.sin(t + i) * 30 * u;
        const y = h * 0.05 + q * h * 0.8;
        const a = t * 0.8 + i;
        const pw = 34 * u + 2;
        const ph = 44 * u + 2;
        const cs = Math.cos(a);
        const sn = Math.sin(a);
        const pts: number[] = [];
        for (const [dx, dy] of [
          [-pw, -ph],
          [pw, -ph],
          [pw, ph],
          [-pw, ph],
        ])
          pts.push(x + (dx * cs - dy * sn) / 2, y + ((dx * sn + dy * cs) / 2) * (0.5 + 0.5 * Math.abs(Math.cos(a * 0.7))));
        papers.poly(pts).fill({ color: 0xffffff, alpha: 1 - q * 0.6 }).stroke({ width: 1.5 * u + 0.5, color: ROSE_D, alpha: 0.6 });
      }
    };
    k.addChild(g, fl, jr, bench, papers, tw);
    draw(0.6);
    if (live) liveLoop(k, (t) => draw(t + 0.6));
    return k;
  },
};
