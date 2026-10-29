/**
 * Miaupé, el Más Rápido de la Cancha: the counter-attack universe (the French speedster in dark blue). A storm night
 * over a stadium that isn't standing still: he's already running — the stands smear into blue, white and red streaks,
 * the mowed bands whip past, lightning crackles around him, and the broadcast's speed box counts 38… 61… 99… ¡MACH 1!
 * Three defenders come at him and are left behind spinning (¡FIUUUM!). Then a dead stop — dust, a screech, everything
 * frozen — and the balloon by his crossed arms: «¿Y?».
 * Payoff: three bolts in blue, white and red split the sky, and a whole row of cats pops up in front with their arms
 * crossed, like him; ¡CONTRAATAQUE! / …¿y?
 * (National-team colors only: no crests, no sponsors, no real person's face.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { txt } from '../../../ui/widgets';
import { type Signature, type SigCtx, burst, cheer, every, flashOf, later, plate, score } from './kit';
import { hideDisc, segText } from './kitA';
import { puff, stash, vgrad } from './kitB';
import { fogBank } from './kitC';
import { aside, balloon, onCat, rnd, streak } from './kitD';
import { at, bits, boltPts, giant, head, pre, comic, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const NAVY = 0x1f2a5a;
const BLUE = 0x2d4fa8;
const WHITE = 0xffffff;
const RED = 0xc8102e;
const ELEC = 0x9fe2ff;
const SKY = [0x0a0b24, 0x1d2160, 0x3c3f99, 0x7068c8];
const FANS = [NAVY, BLUE, WHITE, RED, WHITE, BLUE, 0xf3e2c4, 0x5a4636, 0x2a2a30];
const HZ = 640;

/** the stands smeared by speed: horizontal streaks in the fans' colors (one Graphics, w wide; it tiles) */
function smear(w: number, top: number, hz: number, k: number, seed: number) {
  const g = new Graphics();
  const r = rnd(seed);
  g.rect(0, top, w, hz - top).fill(0x141838);
  for (let y = top + 3 * k; y < hz - 4 * k; y += 7 * k) {
    for (let x = -r() * 200 * k; x < w; ) {
      const L = (40 + r() * 260) * k;
      const col = FANS[Math.floor(r() * FANS.length)];
      g.rect(x, y, Math.min(L, w - x), (2.5 + r() * 3) * k).fill({ color: col, alpha: 0.35 + r() * 0.55 });
      x += L + r() * 60 * k;
    }
  }
  return g;
}

/** the pitch whipping past: slanted mowed bands (they tile every `w`), the touchline */
function grass(w: number, h: number, hz: number, k: number) {
  const g = new Graphics().rect(0, hz, w, h - hz).fill(0x2a8a3a);
  const bw = 150 * k;
  for (let x = 0; x < w; x += bw * 2) g.poly([x, hz, x + bw, hz, x + bw - (h - hz) * 0.5, h, x - (h - hz) * 0.5, h]).fill(0x237a32);
  for (let x = w; x < w + (h - hz) * 0.5 + bw * 2; x += bw * 2) g.poly([x, hz, x + bw, hz, x + bw - (h - hz) * 0.5, h, x - (h - hz) * 0.5, h]).fill(0x237a32);
  g.rect(0, hz + 14 * k, w, 4 * k).fill({ color: WHITE, alpha: 0.8 });
  return g;
}

/** the storm sky: bands of indigo cloud (polygon fog), a pale rim of electric light low on the horizon */
function sky(w: number, hz: number, k: number, seed: number) {
  const g = vgrad(new Graphics(), 0, 0, w, hz, SKY, 14);
  const r = rnd(seed);
  fogBank(g, -100 * k, w + 200 * k, 60 * k, 90 * k, 0x161a4a, 0.95, r, Math.max(6, Math.round(w / 260)));
  fogBank(g, -100 * k, w + 200 * k, 150 * k, 70 * k, 0x8a86d8, 0.3, r, Math.max(6, Math.round(w / 280)));
  fogBank(g, -100 * k, w + 200 * k, 170 * k, 70 * k, 0x2a2c78, 0.9, r, Math.max(6, Math.round(w / 300)));
  fogBank(g, -100 * k, w + 200 * k, 265 * k, 50 * k, 0x9a90e0, 0.25, r, Math.max(6, Math.round(w / 320)));
  return g;
}

/** a cat seen from the front with its arms crossed (smug): origin at its feet, s = scale */
function crossCat(g: Graphics, x: number, y: number, s: number, fur: number, shirt: number) {
  g.poly([x - 26 * s, y, x + 26 * s, y, x + 22 * s, y - 52 * s, x - 22 * s, y - 52 * s]).fill(shirt);
  head(g, x, y - 66 * s, 20 * s, fur);
  g.poly([x - 25 * s, y - 40 * s, x + 18 * s, y - 30 * s, x + 20 * s, y - 20 * s, x - 23 * s, y - 30 * s]).fill(fur);
  g.poly([x + 25 * s, y - 40 * s, x - 18 * s, y - 30 * s, x - 20 * s, y - 20 * s, x + 23 * s, y - 30 * s]).fill(fur);
  g.poly(streak(x - 12 * s, y - 70 * s, x - 4 * s, y - 68 * s, 1.6 * s, 1.6 * s)).fill(C.ink);
  g.poly(streak(x + 4 * s, y - 68 * s, x + 12 * s, y - 70 * s, 1.6 * s, 1.6 * s)).fill(C.ink);
  return g;
}

/** the broadcast's speed box (bottom right): a dark panel, a label, 7-segment digits redrawn into `d` */
function speedBox(x: number, y: number) {
  const k = new Container();
  const bg = new Graphics()
    .rect(6, 6, 360, 130)
    .fill(C.ink)
    .rect(0, 0, 360, 130)
    .fill(0x0d1030)
    .stroke({ width: 4, color: WHITE })
    .rect(0, 0, 360, 34)
    .fill(RED);
  const lab = txtLabel('VELOCIDAD', 24);
  lab.position.set(14, 3);
  const unit = txtLabel('KM/H', 26);
  unit.position.set(286, 92);
  const d = new Graphics();
  k.addChild(bg, lab, unit, d);
  k.position.set(x, y);
  return { k, d };
}
function txtLabel(s: string, size: number) {
  return txt(s, { fontFamily: F.heavy, fontSize: size, fill: WHITE });
}

interface St {
  v: { v: number };
  bolts: Graphics;
  crowd: Container;
  box: Container | null;
}
const S = stash<St>();

export const miaupe: Signature = {
  dark: true,
  frame: NAVY,
  tag: 'UNIVERSO DEL CONTRAATAQUE',
  open(c: SigCtx) {
    const k = new Container();
    const sk = sky(W, HZ, 1, 7);
    const sA = smear(W, 360, HZ, 1, 11);
    const sB = smear(W, 360, HZ, 1, 11);
    sB.x = W;
    const gA = grass(W, H, HZ, 1);
    const gB = grass(W, H, HZ, 1);
    gB.x = W;
    const roof = new Graphics().rect(0, 326, W, 34).fill(0x0b0d22);
    const lines = new Graphics();
    const bolts = new Graphics();
    bolts.blendMode = 'add';
    const crowd = new Container();
    k.addChild(sk, sA, sB, roof, gA, gB, lines, bolts, crowd);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const v = { v: c.reduce || c.short ? 0 : 2600 };
    if (c.short) v.v = 300;
    const st: St = { v, bolts, crowd, box: null };
    S.set(c, st);
    const r = rnd(3);
    const SL = Array.from({ length: 18 }, () => [r() * (W + 600), 300 + r() * 700, 120 + r() * 380, 1 + r() * 3]);
    let last = 0;
    let off = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.1, t - last);
      last = t;
      off += v.v * dt;
      const o1 = -(off * 0.45) % W;
      const o2 = -off % W;
      if (!sA.destroyed) {
        sA.x = o1;
        sB.x = o1 + W;
        gA.x = o2;
        gB.x = o2 + W;
      }
      if (lines.destroyed) return;
      lines.clear();
      if (v.v > 200) {
        const a = Math.min(1, v.v / 2600);
        for (const [x0, y, L, th] of SL) {
          const x = W + 300 - ((x0 + off * 1.6) % (W + 600));
          lines.poly(streak(x, y, x + L, y, th * 0.4, th)).fill({ color: WHITE, alpha: 0.55 * a });
        }
      }
    };
    tick(0);
    if (!c.reduce) every(c, 30, tick);
    if (c.short) return;

    // the speed box: 0 → 38 → 61 → 99, then ¡MACH 1!
    const sb = speedBox(W - 430, H - 230);
    c.fg.addChild(sb.k);
    st.box = sb.k;
    const sp = { v: c.reduce ? 99 : 0 };
    const drawSp = () => {
      if (sb.d.destroyed) return;
      sb.d.clear();
      segText(sb.d, String(Math.round(sp.v)).padStart(2, ' '), 20, 46, 74, ELEC, 0.12);
    };
    drawSp();
    if (!c.reduce) {
      gsap.from(sb.k, { x: W + 20, duration: 0.25, ease: 'power3.out' });
      gsap.to(sp, { v: 38, duration: 0.45, ease: 'power1.out', onUpdate: drawSp });
      gsap.to(sp, { v: 61, duration: 0.35, delay: 0.5, onUpdate: drawSp });
      gsap.to(sp, { v: 99, duration: 0.3, delay: 0.9, onUpdate: drawSp });
    }
    later(c, 1.85, () => !sb.k.destroyed && gsap.to(sb.k, { alpha: 0, duration: 0.25, onComplete: () => destroyTree(sb.k) }));

    // lightning crackles around him
    const crackle = (d: number, seed: number) =>
      at(c, d, () => {
        if (bolts.destroyed) return;
        bolts.clear();
        const x = W / 2 + (seed % 2 ? 1 : -1) * (300 + (seed * 97) % 260);
        bolts.poly(boltPts(x, -20, x + (seed % 3 - 1) * 120, HZ + 120, 16, seed, 8)).fill({ color: ELEC, alpha: 0.9 });
        bolts.poly(boltPts(x, -20, x + (seed % 3 - 1) * 120, HZ + 120, 5, seed, 8)).fill({ color: WHITE, alpha: 1 });
        sfx('zap', 1.1 + (seed % 3) * 0.2);
        if (!c.reduce) gsap.fromTo(bolts, { alpha: 1 }, { alpha: 0, duration: 0.28 });
      });
    crackle(0.2, 1);
    crackle(0.75, 2);
    crackle(1.25, 5);

    // three defenders come at him and are left behind, spinning
    if (!c.reduce)
      [0.12, 0.55, 1.0].forEach((d, i) =>
        at(c, d, () => {
          const g = giant(44 + i * 6, 0x1a1420, ELEC, 0xffe14d, 0x5a5f6e, 0x2a2e3a);
          const y = 900 + i * 50;
          g.position.set(W + 220, y);
          k.addChild(g);
          gsap.to(g, { x: -260, duration: 0.42, ease: 'none', onComplete: () => destroyTree(g) });
          gsap.to(g, { rotation: -4.5, duration: 0.42, ease: 'power1.in' });
          later(c, 0.18, () => sfx('whoosh', 1.4 + i * 0.15));
        }),
      );

    // the words (built now, shown on their beats)
    const fium = pre(c, comic('¡FIUUUM!', ELEC, 130), 520, 330, -0.12);
    const zas = pre(c, comic('¡ZAS!', WHITE, 96), 1430, 300, 0.1);
    const mach = pre(c, plate('¡MACH 1!', RED, C.ink, 54), W - 250, H - 300, -0.06);
    const [hx, hy] = onCat(c, 0.62, 0.16);
    const yq = pre(c, balloon("¿Y?", { size: 124, tx: -170, ty: 130 }), hx + 220, hy - 40, 0.04);
    at(c, 0.3, () => {
      fium(0.65);
      c.shaker.add(0.15);
    });
    at(c, 1.02, () => zas(0.45));
    at(c, 1.32, () => {
      mach(0.45);
      sfx('crit', 1.2);
      c.shaker.add(0.2);
    });
    // the dead stop: screech, dust, everything frozen; then «¿Y?»
    at(c, 1.55, () => {
      if (!c.reduce) gsap.to(v, { v: 0, duration: 0.14, ease: 'power3.out' });
      sfx('sting', 0.7);
      sfx('whoosh', 0.5);
      puff(c, c.behind, W / 2 - 60, c.catY + 250, 0xd8d0c0, 7, 70, 50);
    });
    at(c, 1.78, () => {
      yq(0.7, { from: 1.6 });
      sfx('pop', 1.1);
    });
    at(c, 2.2, () => !c.reduce && gsap.to(v, { v: 320, duration: 0.6 }));
    score(c, [
      [0.0, 'charge', 1.6],
      [0.05, 'whoosh', 0.7],
      [0.6, 'tick', 2.2],
      [0.95, 'tick', 2.5],
    ]);
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.05);
    sfx('bigboom', 0.85);
    c.shaker.add(0.45);
    flashOf(c, WHITE, 0.5, 0.3);
    if (st) {
      if (st.box && !st.box.destroyed) {
        const b = st.box;
        gsap.to(b, { alpha: 0, duration: 0.2, onComplete: () => destroyTree(b) });
      }
      if (!c.reduce) gsap.to(st.v, { v: 900, duration: 0.4 });
      // three bolts: blue, white, red
      const b = st.bolts;
      [BLUE, WHITE, RED].forEach((col, i) =>
        later(c, i * 0.16, () => {
          if (b.destroyed) return;
          if (i === 0) b.clear();
          const x = 420 + i * 540;
          b.poly(boltPts(x, -30, x + (i - 1) * 90, HZ + 200, 16, 20 + i, 9)).fill({ color: col, alpha: 0.95 });
          b.poly(boltPts(x, -30, x + (i - 1) * 90, HZ + 200, 5, 20 + i, 9)).fill({ color: WHITE, alpha: 1 });
          b.alpha = 1;
          sfx('zap', 0.8 + i * 0.25);
          if (i === 2) gsap.to(b, { alpha: 0, delay: 0.5, duration: 0.5 });
        }),
      );
      // a row of cats pops up in front, arms crossed like him
      const r = rnd(4);
      const furs = [0x8a5a3a, 0xf3e2c4, 0x2a2a30, 0xd9772a, 0x9a9aa6, 0x5a4636, WHITE];
      const shirts = [NAVY, BLUE, WHITE, RED];
      const n = 11;
      for (let i = 0; i < n; i++) {
        const x = 40 + (i / (n - 1)) * (W - 80) + (r() - 0.5) * 30;
        if (Math.abs(x - W / 2) < 260) continue;
        const g = crossCat(new Graphics(), 0, 0, 2.3 + r() * 0.5, furs[Math.floor(r() * furs.length)], shirts[i % shirts.length]);
        g.position.set(x, H + 6);
        st.crowd.addChild(g);
        if (!c.reduce) gsap.from(g, { y: H + 220, duration: 0.3, delay: 0.25 + Math.abs(x - W / 2) / 2400, ease: 'back.out(2)' });
      }
    }
    burst(c, c.fg, bits([BLUE, WHITE, RED]), 32, W / 2, c.catY - 80, 900, 1.4);
    cheer(c, '¡CONTRAATAQUE!', ELEC, 130, 2.2);
    aside(c, '…¿y?', WHITE, { delay: 0.6, dur: 2.4, size: 56 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.3, h / 1080);
    const hz = h * 0.62;
    const top = h * 0.34;
    const sk = sky(w, hz, u, 17);
    const sA = smear(w, top, hz, u, 23);
    const sB = smear(w, top, hz, u, 23);
    sB.x = w;
    const gA = grass(w, h, hz, u);
    const gB = grass(w, h, hz, u);
    gB.x = w;
    const roof = new Graphics().rect(0, top - 30 * u, w, 30 * u).fill(0x0b0d22);
    const bolts = new Graphics();
    bolts.blendMode = 'add';
    const lines = new Graphics();
    k.addChild(sk, sA, sB, roof, gA, gB, lines, bolts);
    // the speed box, frozen on 99 (right)
    const box = new Graphics();
    const bx = w / 2 + Math.min(w * 0.3, m * 0.5);
    const bs = m / 1080;
    box.rect(bx, h * 0.72, 300 * bs, 110 * bs).fill(0x0d1030).stroke({ width: Math.max(1, 3 * bs), color: WHITE });
    box.rect(bx, h * 0.72, 300 * bs, 26 * bs).fill(RED);
    segText(box, '99', bx + 20 * bs, h * 0.72 + 38 * bs, 60 * bs, ELEC, 0.12);
    k.addChild(box);
    const r = rnd(8);
    const SL = Array.from({ length: Math.max(8, Math.round(w / 110)) }, () => [r() * (w + 400 * u), top + r() * (h - top), (100 + r() * 300) * u, (1 + r() * 2.5) * u]);
    const draw = (t: number) => {
      const off = t * 900 * u;
      const o1 = -(off * 0.45) % w;
      const o2 = -off % w;
      sA.x = o1;
      sB.x = o1 + w;
      gA.x = o2;
      gB.x = o2 + w;
      lines.clear();
      for (const [x0, y, L, th] of SL) {
        const x = w + 200 * u - ((x0 + off * 1.6) % (w + 400 * u));
        lines.poly(streak(x, y, x + L, y, th * 0.4, th)).fill({ color: WHITE, alpha: 0.45 });
      }
      bolts.clear();
      const ph = t % 2.4;
      if (ph < 0.25 || t === 0) {
        const n = Math.floor(t / 2.4);
        const x = w * (0.15 + ((n * 0.37) % 0.7));
        bolts.poly(boltPts(x, -10, x + m * 0.08, hz + 30 * u, 7 * u + 1, 3 + n, 8)).fill({ color: ELEC, alpha: 0.85 * (1 - ph * 3) });
        bolts.poly(boltPts(x, -10, x + m * 0.08, hz + 30 * u, 2.4 * u + 0.5, 3 + n, 8)).fill({ color: WHITE, alpha: 1 - ph * 3 });
      }
    };
    draw(0.1);
    if (live) liveLoop(k, (t) => draw(t + 0.1));
    return k;
  },
};
