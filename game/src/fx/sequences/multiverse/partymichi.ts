/**
 * Party Michi, el del Pelo Gigante: the universe of the party that never ended (a 2010s party-rock electro duo: the
 * giant afro, shutter shades, zebra print, the shuffle). Hot-pink shutter-shade slats cover the screen and flip open on
 * the first kick: behind them a zebra-print backdrop that wiggles to the beat, a neon arch in green and pink, lasers, a
 * black floor, and a row of cats with afros shuffling — heel, toe, kick — on every beat (¡PUM-PUM!). Confetti cannons
 * from both corners (¡PAAAM!), and over on the right a cardboard box starts to shake: «¿YA VIENE?»… not yet.
 * Payoff: everything goes double, the lasers fan out, and the box's lid pops — a second giant afro with pink shades peeks
 * out; ¡A BAILAR! / …y su compañero, ¡ya viene!
 * (No song names, no lyrics, no real person's face: a cat with a giant afro and his party.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, burst, cheer, every, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { aside, balloon, beats, ngon, rnd, streak } from './kitD';
import { at, bits, comic, pre, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const GREEN = 0x39ff14;
const PINK = 0xff4fa3;
const BLACK = 0x111111;
const AFRO = 0xb8541e;
const BPM = 130;
const BEAT = 60 / BPM;
const FLOOR = 820;

/** the zebra backdrop: black wavy stripes on white, wiggling with `ph` (redrawn), in [0, w] × [0, h] */
function zebra(g: Graphics, w: number, h: number, ph: number, k = 1) {
  g.clear();
  g.rect(0, 0, w, h).fill(0xf4f0e8);
  const n = Math.max(6, Math.round(w / (140 * k)));
  const seg = 14;
  for (let i = 0; i < n; i++) {
    const x0 = ((i + 0.2) / n) * w;
    const wd = (w / n) * (0.32 + 0.12 * Math.sin(i * 2.3));
    const L: number[] = [];
    const R: number[] = [];
    for (let j = 0; j <= seg; j++) {
      const y = (j / seg) * h;
      const sway = Math.sin(j * 0.9 + i * 1.7 + ph) * 26 * k + Math.sin(j * 0.37 + i) * 30 * k;
      const pinch = 0.6 + 0.4 * Math.abs(Math.sin(j * 0.7 + i * 0.9));
      L.push(x0 + sway - wd * pinch * 0.5, y);
      R.unshift(x0 + sway + wd * pinch * 0.5, y);
    }
    g.poly([...L, ...R]).fill(BLACK);
  }
}

/** the neon arch over the stage (green outer, pink inner) */
function arch(g: Graphics, w: number, floor: number, k = 1, pulse = 0.5) {
  const r0 = Math.min(w * 0.36, floor * 0.72);
  for (const [r, col] of [
    [r0, GREEN],
    [r0 * 0.92, PINK],
  ] as const) {
    const pts: number[] = [w / 2 - r, floor];
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI + (i / 20) * Math.PI;
      pts.push(w / 2 + Math.cos(a) * r, floor - 120 * k + Math.sin(a) * r * 1.05);
    }
    pts.push(w / 2 + r, floor);
    g.poly(pts, false).stroke({ width: 34 * k, color: col, alpha: 0.14 + 0.1 * pulse });
    g.poly(pts, false).stroke({ width: 10 * k, color: col, alpha: 1 });
    g.poly(pts, false).stroke({ width: 3 * k, color: 0xffffff, alpha: 0.9 });
  }
}

/** the black floor with neon reflections */
function floorG(g: Graphics, w: number, h: number, floor: number, k = 1) {
  g.rect(0, floor, w, h - floor).fill(0x0c0c10);
  for (let i = 0; i < 6; i++) {
    const y = floor + (h - floor) * ((i + 1) / 7) ** 1.4;
    g.rect(0, y, w, 2 * k).fill({ color: i % 2 ? PINK : GREEN, alpha: 0.35 });
  }
  g.rect(0, floor, w, 6 * k).fill(GREEN);
}

/**
 * one dancing cat with a big afro, front view, doing the shuffle (`p` = beat phase 0..1, `side` flips which leg kicks);
 * origin at the feet, s = scale; drawn into g
 */
function dancer(g: Graphics, x: number, y: number, s: number, p: number, side: number, shirt: number, fur: number, afro: number) {
  const kick = Math.sin(p * Math.PI) * side;
  const bob = Math.abs(Math.sin(p * Math.PI)) * 8 * s;
  const yy = y - bob;
  // legs: one planted, one kicking out (zebra leggings = black with white bands)
  const legL = [x - 14 * s, yy - 70 * s, x - 4 * s, yy - 70 * s, x - 10 * s + (kick < 0 ? kick * 40 * s : 0), yy, x - 26 * s + (kick < 0 ? kick * 40 * s : 0), yy];
  const legR = [x + 4 * s, yy - 70 * s, x + 14 * s, yy - 70 * s, x + 26 * s + (kick > 0 ? kick * 40 * s : 0), yy - (kick > 0 ? kick * 20 * s : 0), x + 10 * s + (kick > 0 ? kick * 40 * s : 0), yy - (kick > 0 ? kick * 20 * s : 0)];
  g.poly(legL).fill(BLACK).poly(legR).fill(BLACK);
  g.poly(streak(x - 12 * s + (kick < 0 ? kick * 20 * s : 0), yy - 34 * s, x - 2 * s + (kick < 0 ? kick * 20 * s : 0), yy - 36 * s, 2.5 * s, 2.5 * s)).fill(0xffffff);
  g.poly(streak(x + 4 * s + (kick > 0 ? kick * 20 * s : 0), yy - 36 * s, x + 16 * s + (kick > 0 ? kick * 20 * s : 0), yy - 34 * s - (kick > 0 ? kick * 10 * s : 0), 2.5 * s, 2.5 * s)).fill(0xffffff);
  // tank top, arms (one up on the beat)
  g.poly([x - 22 * s, yy - 70 * s, x + 22 * s, yy - 70 * s, x + 18 * s, yy - 126 * s, x - 18 * s, yy - 126 * s]).fill(shirt);
  const up = side > 0 ? p : 1 - p;
  g.poly(streak(x + 18 * s, yy - 120 * s, x + 46 * s, yy - 150 * s - up * 40 * s, 6 * s, 5 * s)).fill(fur);
  g.poly(streak(x - 18 * s, yy - 120 * s, x - 48 * s, yy - 96 * s + up * 20 * s, 6 * s, 5 * s)).fill(fur);
  // head and the afro (a lumpy disc), shutter shades
  g.poly(ngon(x, yy - 168 * s, 56 * s, 50 * s, 16)).fill(afro);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.poly(ngon(x + Math.cos(a) * 52 * s, yy - 168 * s + Math.sin(a) * 46 * s, 14 * s, 14 * s, 8)).fill(afro);
  }
  g.poly(ngon(x, yy - 146 * s, 22 * s, 20 * s, 12)).fill(fur);
  g.rect(x - 22 * s, yy - 156 * s, 44 * s, 12 * s).fill(PINK);
  for (let i = 0; i < 3; i++) g.rect(x - 20 * s, yy - 154 * s + i * 4 * s, 40 * s, 1.4 * s).fill(BLACK);
}

/** the cardboard box (origin at its bottom center); the lid is its own Graphics to pop */
function box(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.poly([-110 * s, -170 * s, 110 * s, -170 * s, 110 * s, 0, -110 * s, 0]).fill(0xc8955a).stroke({ width: 5 * s, color: 0x6a4424, join: 'round' });
  g.rect(-110 * s, -100 * s, 220 * s, 16 * s).fill({ color: 0xe8c890, alpha: 0.7 });
  g.poly([-30 * s, -60 * s, 0, -90 * s, 30 * s, -60 * s, 14 * s, -60 * s, 14 * s, -30 * s, -14 * s, -30 * s, -14 * s, -60 * s]).fill({ color: 0x6a4424, alpha: 0.6 });
  const lid = new Graphics();
  lid.poly([-118 * s, -14 * s, 118 * s, -14 * s, 118 * s, 10 * s, -118 * s, 10 * s]).fill(0xb8854a).stroke({ width: 5 * s, color: 0x6a4424, join: 'round' });
  lid.position.set(0, -176 * s);
  // the partner's afro and shades, hidden in the box until the payoff
  const pal = new Graphics();
  pal.poly(ngon(0, 0, 110 * s, 90 * s, 18)).fill(0x5a2a14);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    pal.poly(ngon(Math.cos(a) * 104 * s, Math.sin(a) * 84 * s, 24 * s, 24 * s, 8)).fill(0x5a2a14);
  }
  pal.poly(ngon(0, 70 * s, 50 * s, 40 * s, 14)).fill(0xd8a878);
  pal.poly([-44 * s, 40 * s, -40 * s, 4 * s, -20 * s, 30 * s]).fill(0xd8a878).poly([44 * s, 40 * s, 40 * s, 4 * s, 20 * s, 30 * s]).fill(0xd8a878);
  pal.rect(-56 * s, 52 * s, 112 * s, 26 * s).fill(GREEN);
  for (let i = 0; i < 4; i++) pal.rect(-52 * s, 56 * s + i * 5 * s, 104 * s, 2 * s).fill(BLACK);
  pal.position.set(0, -110 * s);
  pal.visible = false;
  // (behind the box's front: only what rises over the rim shows)
  k.addChild(pal, g, lid);
  return { k, lid, pal };
}

interface St {
  laser: { n: number; spread: number; a: number };
  dbl: { v: number };
  bx: ReturnType<typeof box>;
}
const S = stash<St>();

export const partymichi: Signature = {
  dark: false,
  frame: GREEN,
  tag: 'UNIVERSO DE LA FIESTA ETERNA',
  open(c: SigCtx) {
    const k = new Container();
    const zb = new Graphics();
    const ar = new Graphics();
    const fl = new Graphics();
    floorG(fl, W, H, FLOOR);
    const lasers = new Graphics();
    const crowd = new Graphics();
    const bx = box(0.9);
    bx.k.position.set(1800, FLOOR + 140);
    k.addChild(zb, ar, fl, lasers, bx.k, crowd);
    c.back.addChild(k);
    hideDisc(c, 0.15);
    const laser = { n: c.short ? 6 : 0, spread: 1.2, a: c.short ? 0.6 : 0 };
    const dbl = { v: c.short ? 1 : 0 };
    S.set(c, { laser, dbl, bx });
    const t0 = performance.now();
    const DX = [120, 320, 520, 1380, 1580];
    const shirts = [GREEN, PINK, 0x3ff0ff, 0xffe14d, PINK];
    const furs = [0xf3e2c4, 0x8a5a3a, 0xd9772a, 0x2a2a30, 0x9a9aa6];
    const afros = [AFRO, 0x2a1a10, 0xd88a3a, 0x5a2a14, AFRO];
    const frame = (t: number) => {
      if (zb.destroyed) return;
      const bt = c.reduce ? 0.3 : (performance.now() - t0) / 1000 / BEAT;
      const beat = Math.floor(bt);
      const ph = bt - beat;
      const kick = Math.max(0, 1 - ph * 2.4);
      zebra(zb, W, FLOOR, bt * Math.PI * 0.5 * (1 + dbl.v));
      ar.clear();
      arch(ar, W, FLOOR, 1, kick);
      lasers.clear();
      for (let i = 0; i < laser.n; i++) {
        const left = i % 2 === 0;
        const ox = left ? 0 : W;
        const a = (left ? 0.35 : Math.PI - 0.35) + (left ? 1 : -1) * ((i / Math.max(1, laser.n - 1) - 0.5) * laser.spread + Math.sin(t * 1.6 + i) * 0.25);
        lasers.poly(streak(ox, 40, ox + Math.cos(a) * 2400, 40 + Math.sin(a) * 2400, 1.5, 16)).fill({ color: i % 4 < 2 ? GREEN : PINK, alpha: laser.a * 0.45 });
        lasers.poly(streak(ox, 40, ox + Math.cos(a) * 2400, 40 + Math.sin(a) * 2400, 0.8, 5)).fill({ color: i % 4 < 2 ? GREEN : PINK, alpha: laser.a * 0.95 });
      }
      crowd.clear();
      DX.forEach((x, i) => dancer(crowd, x, H - 10, 1.5, ph, (beat + i) % 2 ? 1 : -1, shirts[i], furs[i], afros[i]));
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // the shutter-shade slats over everything flip open on the first kick
    const slats = new Container();
    const n = 12;
    const sh = H / n;
    const bars = Array.from({ length: n }, (_, i) => {
      const b = new Graphics().rect(-W / 2, -sh / 2, W, sh * 0.82).fill(PINK).rect(-W / 2, sh * 0.32 - sh / 2, W, sh * 0.12).fill(0xc8307a);
      b.position.set(W / 2, i * sh + sh / 2);
      slats.addChild(b);
      return b;
    });
    c.back.addChild(slats);
    if (c.reduce) destroyTree(slats);
    else {
      bars.forEach((b, i) => gsap.to(b.scale, { y: 0, duration: 0.22, delay: 0.12 + i * 0.018, ease: 'power2.in' }));
      later(c, 0.6, () => destroyTree(slats));
    }

    // the kick (and hats), lasers on
    beats(c, BPM, 5, (i) => {
      sfx('boom', 0.5);
      c.shaker.add(0.06);
      later(c, BEAT / 2, () => sfx('tick', 2.6));
      if (i === 1) {
        laser.n = 4;
        laser.a = 0.8;
      }
    }, 0.12);
    const pum = pre(c, comic('¡PUM-PUM!', GREEN, 130), 520, 330, -0.1);
    const pam = pre(c, comic('¡PAAAM!', PINK, 130), 1380, 300, 0.1);
    const yv = pre(c, balloon('¿YA VIENE?', { size: 54, tx: 120, ty: 150 }), 1640, 540, 0.04);
    const nope = pre(c, comic('…TODAVÍA NO', 0xffffff, 58), 1660, 700, -0.05);
    at(c, 0.26, () => pum(0.6));
    // confetti cannons from both corners
    at(c, 0.95, () => {
      pam(0.6);
      sfx('bigboom', 1.2);
      c.shaker.add(0.15);
      for (const [x, d] of [
        [60, -1],
        [W - 60, 1],
      ] as const) {
        const p = new Container();
        const cols = [GREEN, PINK, 0xffffff, 0x3ff0ff, 0xffe14d];
        for (let i = 0; i < (c.reduce ? 8 : 26); i++) {
          const g = new Graphics().rect(-9, -5, 18, 10).fill(cols[i % cols.length]);
          g.position.set(x, FLOOR);
          p.addChild(g);
          if (c.reduce) {
            g.position.set(x - d * (100 + i * 30), FLOOR - 200 - i * 20);
            continue;
          }
          const a = -Math.PI / 2 - d * (0.3 + Math.random() * 0.5);
          const v = 700 + Math.random() * 500;
          gsap.to(g, { x: x + Math.cos(a) * v, y: FLOOR + Math.sin(a) * v + 300, rotation: Math.random() * 10, duration: 1.4, ease: 'power1.out' });
        }
        c.back.addChild(p);
        gsap.to(p, { alpha: 0, delay: 1.2, duration: 0.4, onComplete: () => destroyTree(p) });
      }
    });
    // the box shakes… not yet
    at(c, 1.4, () => {
      if (!bx.k.destroyed && !c.reduce) gsap.fromTo(bx.k, { rotation: -0.06 }, { rotation: 0.06, duration: 0.06, repeat: 5, yoyo: true, onComplete: () => void (!bx.k.destroyed && (bx.k.rotation = 0)) });
      sfx('hit', 0.6);
      yv(0.55, { from: 1.5 });
    });
    at(c, 1.95, () => nope(0.45, { from: 1.3 }));
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.1);
    sfx('bigboom', 1.0);
    c.shaker.add(0.4);
    flashOf(c, 0xffffff, 0.4, 0.3);
    for (let i = 0; i < 4; i++) later(c, i * BEAT, () => sfx('boom', 0.5));
    if (st) {
      st.dbl.v = 1;
      st.laser.n = 12;
      st.laser.spread = 2.2;
      st.laser.a = 1;
      // the lid pops and the partner's afro peeks out
      const { lid, pal } = st.bx;
      later(c, c.reduce ? 0 : 0.35, () => {
        if (lid.destroyed || pal.destroyed) return;
        sfx('pop', 0.9);
        pal.visible = true;
        if (c.reduce) {
          lid.position.set(lid.x + 130, lid.y + 60);
          lid.rotation = 1.2;
          pal.y = -230;
          return;
        }
        gsap.to(lid, { x: lid.x + 160, y: lid.y - 120, rotation: 1.4, duration: 0.35, ease: 'power2.out' });
        gsap.to(lid, { y: lid.y + 170, duration: 0.3, delay: 0.35, ease: 'power2.in' });
        gsap.fromTo(pal, { y: -60 }, { y: -230, duration: 0.3, ease: 'back.out(2)' });
      });
    }
    burst(c, c.fg, bits([GREEN, PINK, 0xffffff, 0x3ff0ff]), 34, W / 2, c.catY - 80, 950, 1.4);
    cheer(c, '¡A BAILAR!', PINK, 160, 2.3);
    aside(c, '…y su compañero, ¡ya viene!', 0xffffff, { delay: 0.6, dur: 2.5 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.3, h / 1080);
    const floor = h * 0.76;
    const zb = new Graphics();
    zebra(zb, w, floor, 0.4, u);
    const ar = new Graphics();
    arch(ar, w, floor, u, 0.5);
    const fl = new Graphics();
    floorG(fl, w, h, floor, u);
    const bx = box(u * 0.9);
    bx.k.position.set(w / 2 + Math.min(w * 0.4, m * 0.72), h);
    bx.pal.visible = true;
    bx.pal.y = -200 * u * 0.9;
    bx.lid.position.set(bx.lid.x + 120 * u, bx.lid.y + 120 * u);
    bx.lid.rotation = 1.2;
    const crowd = new Graphics();
    const side = Math.min(w * 0.44, m * 0.85);
    const xs = [w / 2 - side, w / 2 - side * 0.72, w / 2 + side * 0.6];
    const draw = (t: number) => {
      const bt = t / BEAT;
      const beat = Math.floor(bt);
      zebra(zb, w, floor, bt * Math.PI * 0.5, u);
      crowd.clear();
      xs.forEach((x, i) => dancer(crowd, x, h - 6 * u, 2.0 * u, bt - beat, (beat + i) % 2 ? 1 : -1, [GREEN, PINK, 0x3ff0ff][i], [0xf3e2c4, 0x8a5a3a, 0xd9772a][i], [AFRO, 0x2a1a10, 0xd88a3a][i]));
    };
    draw(0.3);
    k.addChild(zb, ar, fl, bx.k, crowd);
    if (live) liveLoop(k, (t) => draw(t + 0.3));
    return k;
  },
};
