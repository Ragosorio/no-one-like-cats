/**
 * Condorgato: the punchline universe (a Chilean comic-strip condor). A newsprint page printed in two inks — black and a
 * warm red — with halftone dots. The panels stack down the page like a staircase and tell a joke in a small town called
 * Pelotillemiau: «DOCTOR, ¡ME SIENTO COMO UN GATO!» · «¿Y DESDE CUÁNDO?» · «¡DESDE QUE ERA GATITO!»… and in the last three
 * panels everybody falls flat on their back at the same time, legs in the air, in a puff of dust: plaf, plaf, plaf.
 * Payoff: the whole page goes over — a storm of condor feathers, the dust ring at his feet; ¡PLAF! (…y eso que el chiste
 * era bueno.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, drizzle, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { beat, pay } from './kitC';
import { asideText, bar, halftone, oval, payline, pop, pre, puffs, rand, rrect, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const PAPER = 0xf3ead2;
const INK = 0x1b1b22;
const SPOT = 0xd8452b;
const PALE = 0xf6c9b0;

/** a feather (condor: black with a white tip), origin at its middle */
function feather(s: number, white = false) {
  const g = new Graphics();
  const pts = [0, -40 * s, 12 * s, -22 * s, 14 * s, 6 * s, 8 * s, 30 * s, 0, 40 * s, -8 * s, 30 * s, -14 * s, 6 * s, -12 * s, -22 * s];
  g.poly(pts).fill(white ? 0xffffff : INK).stroke({ width: 2.5 * s, color: INK, join: 'round' });
  if (!white) g.poly([0, 18 * s, 8 * s, 30 * s, 0, 40 * s, -8 * s, 30 * s]).fill(0xffffff);
  g.poly(bar(0, -40 * s, 0, 52 * s, 1.4 * s)).fill(white ? INK : 0x55555e);
  return g;
}

/** a standing strip cat, feet at (x, y): coat = the doctor (head mirror, white coat), else a red sweater */
function toonStand(g: Graphics, x: number, y: number, s: number, o: { coat?: boolean; flip?: boolean; laugh?: boolean } = {}) {
  const d = o.flip ? -1 : 1;
  const ink = { width: 4 * s, color: INK, join: 'round' as const };
  // legs and shoes
  g.poly(bar(x - 16 * s, y - 62 * s, x - 18 * s, y - 6 * s, 7 * s)).fill(INK).poly(bar(x + 16 * s, y - 62 * s, x + 18 * s, y - 6 * s, 7 * s)).fill(INK);
  g.poly(oval(x - 24 * s, y - 4 * s, 18 * s, 8 * s, 10)).fill(INK).poly(oval(x + 24 * s, y - 4 * s, 18 * s, 8 * s, 10)).fill(INK);
  // body
  g.poly(rrect(x - 40 * s, y - 150 * s, 80 * s, 96 * s, 26 * s, 3)).fill(o.coat ? 0xffffff : SPOT).stroke(ink);
  if (o.coat) g.poly([x - 6 * s, y - 150 * s, x + 6 * s, y - 150 * s, x + 2 * s, y - 56 * s, x - 2 * s, y - 56 * s]).fill(INK);
  else for (let i = 0; i < 3; i++) g.rect(x - 38 * s, y - 128 * s + i * 24 * s, 76 * s, 7 * s).fill(0xffffff);
  // arms (one gesturing)
  g.poly(bar(x - 38 * s, y - 136 * s, x - 56 * s, y - 80 * s, 8 * s)).fill(o.coat ? 0xffffff : SPOT).stroke(ink);
  if (o.laugh) g.poly(bar(x + 38 * s, y - 136 * s, x + 50 * s, y - 84 * s, 8 * s)).fill(o.coat ? 0xffffff : SPOT).stroke(ink);
  else g.poly(bar(x + d * 38 * s, y - 136 * s, x + d * 74 * s, y - 170 * s, 8 * s)).fill(o.coat ? 0xffffff : SPOT).stroke(ink);
  // head: ears, face, eyes, nose, whiskers
  const hy = y - 196 * s;
  g.poly([x - 42 * s, hy - 14 * s, x - 36 * s, hy - 62 * s, x - 10 * s, hy - 40 * s]).fill(INK);
  g.poly([x + 42 * s, hy - 14 * s, x + 36 * s, hy - 62 * s, x + 10 * s, hy - 40 * s]).fill(INK);
  g.poly(oval(x, hy, 48 * s, 44 * s, 16)).fill(PAPER).stroke(ink);
  if (o.laugh) {
    g.poly([x - 26 * s, hy - 8 * s, x - 10 * s, hy - 14 * s, x - 10 * s, hy - 10 * s]).fill(INK).poly([x + 26 * s, hy - 8 * s, x + 10 * s, hy - 14 * s, x + 10 * s, hy - 10 * s]).fill(INK);
    g.poly([x - 18 * s, hy + 10 * s, x + 18 * s, hy + 10 * s, x + 10 * s, hy + 30 * s, x - 10 * s, hy + 30 * s]).fill(SPOT).stroke({ width: 3 * s, color: INK });
  } else {
    g.poly(oval(x - 16 * s + d * 6 * s, hy - 8 * s, 6 * s, 9 * s, 8)).fill(INK).poly(oval(x + 16 * s + d * 6 * s, hy - 8 * s, 6 * s, 9 * s, 8)).fill(INK);
    g.poly(bar(x - 10 * s + d * 6 * s, hy + 22 * s, x + 10 * s + d * 6 * s, hy + 22 * s, 2.5 * s)).fill(INK);
  }
  g.poly(oval(x + d * 6 * s, hy + 8 * s, 6 * s, 4 * s, 8)).fill(SPOT);
  for (const k of [-1, 1]) g.poly(bar(x + k * 20 * s, hy + 12 * s, x + k * 62 * s, hy + 6 * s, 1.4 * s)).poly(bar(x + k * 20 * s, hy + 16 * s, x + k * 60 * s, hy + 20 * s, 1.4 * s)).fill(INK);
  if (o.coat) {
    g.poly(oval(x, hy - 34 * s, 16 * s, 16 * s, 12)).fill(0xdddddd).stroke({ width: 3 * s, color: INK });
    g.poly(bar(x - 30 * s, hy - 28 * s, x + 30 * s, hy - 28 * s, 3 * s)).fill(INK);
  }
}

/** the same cat flat on its back, legs in the air (the punchline), body along the floor at y */
function toonFallen(g: Graphics, x: number, y: number, s: number, o: { coat?: boolean; flip?: boolean } = {}) {
  const d = o.flip ? -1 : 1;
  const ink = { width: 4 * s, color: INK, join: 'round' as const };
  // legs straight up, shoes to the sky
  g.poly(bar(x + d * 22 * s, y - 30 * s, x + d * 34 * s, y - 132 * s, 7 * s)).fill(INK).poly(bar(x + d * 46 * s, y - 30 * s, x + d * 70 * s, y - 124 * s, 7 * s)).fill(INK);
  g.poly(oval(x + d * 36 * s, y - 140 * s, 9 * s, 18 * s, 10, d * 0.2)).fill(INK).poly(oval(x + d * 74 * s, y - 132 * s, 9 * s, 18 * s, 10, d * 0.4)).fill(INK);
  // body along the floor
  g.poly(rrect(x - 56 * s, y - 64 * s, 112 * s, 56 * s, 24 * s, 3)).fill(o.coat ? 0xffffff : SPOT).stroke(ink);
  // arms flung up
  g.poly(bar(x - d * 20 * s, y - 56 * s, x - d * 40 * s, y - 120 * s, 7 * s)).fill(o.coat ? 0xffffff : SPOT).stroke(ink);
  g.poly(bar(x + d * 4 * s, y - 60 * s, x + d * 2 * s, y - 128 * s, 7 * s)).fill(o.coat ? 0xffffff : SPOT).stroke(ink);
  // the head lying on the floor
  const hx = x - d * 96 * s;
  const hy = y - 40 * s;
  g.poly([hx - d * 30 * s, hy - 30 * s, hx - d * 74 * s, hy - 40 * s, hx - d * 46 * s, hy - 8 * s]).fill(INK);
  g.poly([hx - d * 30 * s, hy + 30 * s, hx - d * 74 * s, hy + 34 * s, hx - d * 46 * s, hy + 6 * s]).fill(INK);
  g.poly(oval(hx, hy, 42 * s, 38 * s, 16)).fill(PAPER).stroke(ink);
  // eyes popped (two little crosses) and a big open mouth
  for (const k of [-1, 1]) {
    const ex = hx + d * 4 * s;
    const ey = hy + k * 14 * s;
    g.poly(bar(ex - 6 * s, ey - 6 * s, ex + 6 * s, ey + 6 * s, 2 * s)).poly(bar(ex - 6 * s, ey + 6 * s, ex + 6 * s, ey - 6 * s, 2 * s)).fill(INK);
  }
  g.poly(oval(hx + d * 24 * s, hy, 8 * s, 12 * s, 10)).fill(INK);
  // motion lines over the legs
  for (let i = 0; i < 3; i++) g.poly(bar(x + d * (10 + i * 26) * s, y - 168 * s - i * 4 * s, x + d * (16 + i * 26) * s, y - 196 * s - i * 4 * s, 2 * s)).fill(INK);
}

/** a comic balloon (cream, ink outline) with its tail toward (tx, ty) from its center */
function strip(text: string, size: number, tx: number, ty: number, red = false) {
  const k = new Container();
  const t = txt(text, { fontFamily: F.comic, fontSize: size, fill: INK, align: 'center', letterSpacing: 1, lineHeight: size * 1.02 });
  t.anchor.set(0.5);
  const rx = t.width / 2 + size * 0.7;
  const ry = t.height / 2 + size * 0.45;
  const g = new Graphics();
  g.poly([-size * 0.4, ry * 0.5, size * 0.4, ry * 0.5, tx, ty]).fill(0xffffff).stroke({ width: 3.5, color: INK, join: 'round' });
  g.poly(oval(0, 0, rx, ry, 22)).fill(red ? PALE : 0xffffff).stroke({ width: 3.5, color: INK });
  g.poly([-size * 0.4 + 3, ry * 0.4, size * 0.4 - 3, ry * 0.4, tx * 0.3, ry * 0.7]).fill(red ? PALE : 0xffffff);
  k.addChild(g, t);
  return k;
}

type Kind = 'street' | 'office' | 'punch' | 'fall';

/**
 * one panel, local origin at its top-left, w×h: a cream frame with an ink border and a hard shadow, two-ink scenery and
 * its cast. A 'fall' panel holds two Graphics (standing / fallen) so everyone can go over at the same instant.
 */
function panel(kind: Kind, w: number, h: number, s: number, seed: number, words = true, flat = false) {
  const k = new Container();
  const r = rand(seed);
  const g = new Graphics();
  g.rect(10 * s, 10 * s, w, h).fill(INK);
  g.rect(0, 0, w, h).fill(0xfbf5e4);
  // a halftone sky in spot red, a ground line, two-ink scenery
  if (s >= 0.3) halftone(g, 0, 0, w, h * 0.62, 12 * s, 3.2 * s, SPOT, 0.5, 'up');
  else g.rect(0, 0, w, h * 0.62).fill({ color: SPOT, alpha: 0.12 });
  const gy = h * 0.82;
  g.rect(0, gy, w, 4 * s).fill(INK);
  if (kind === 'street' || kind === 'fall') {
    // little houses of Pelotillemiau, a lamppost, a cactus
    for (let x = 20 * s + r() * 30 * s; x < w - 60 * s; x += (130 + r() * 50) * s) {
      const bw = (80 + r() * 40) * s;
      const bh = (90 + r() * 60) * s;
      g.rect(x, gy - bh, bw, bh).fill(0xfbf5e4).stroke({ width: 3 * s, color: INK });
      g.poly([x - 8 * s, gy - bh, x + bw / 2, gy - bh - 40 * s, x + bw + 8 * s, gy - bh]).fill(SPOT).stroke({ width: 3 * s, color: INK, join: 'round' });
      g.rect(x + bw * 0.2, gy - bh * 0.6, bw * 0.24, bh * 0.24).fill(INK);
      g.rect(x + bw * 0.58, gy - bh * 0.5, bw * 0.24, bh * 0.5).fill(INK);
    }
  } else {
    // the doctor's office: a framed diploma, a cabinet, a stool
    g.rect(w * 0.08, h * 0.16, w * 0.22, h * 0.2).fill(0xffffff).stroke({ width: 4 * s, color: INK });
    for (let i = 0; i < 3; i++) g.rect(w * 0.11, h * (0.21 + i * 0.045), w * 0.16, 3 * s).fill(INK);
    g.rect(w * 0.76, gy - h * 0.42, w * 0.18, h * 0.42).fill(0xfbf5e4).stroke({ width: 4 * s, color: INK });
    g.poly([w * 0.8, gy - h * 0.34, w * 0.9, gy - h * 0.34, w * 0.85, gy - h * 0.28]).fill(SPOT);
    g.poly(bar(w * 0.85, gy - h * 0.38, w * 0.85, gy - h * 0.22, 3 * s)).fill(SPOT);
    g.poly(bar(w * 0.79, gy - h * 0.3, w * 0.91, gy - h * 0.3, 3 * s)).fill(SPOT);
  }
  k.addChild(g);
  // flat = a Catdex card: everything in the one Graphics (a 'fall' panel shows the fall), no lettering
  const cast = flat ? g : new Graphics();
  const fallen = flat ? g : new Graphics();
  const sc = Math.min(1, h / 330) * s * 0.9;
  if (kind === 'street') {
    toonStand(cast, w * 0.2, gy, sc * 0.82, { flip: false });
    toonStand(cast, w * 0.56, gy, sc * 0.82, { coat: true, flip: true });
    // the signpost (our town's name)
    const sp = (flat ? g : new Graphics()).poly(bar(w * 0.86, gy, w * 0.86, gy - 140 * s, 4 * s)).fill(INK).poly([w * 0.7, gy - 150 * s, w * 0.93, gy - 150 * s, w * 0.97, gy - 128 * s, w * 0.93, gy - 106 * s, w * 0.7, gy - 106 * s]).fill(0xffffff).stroke({ width: 3 * s, color: INK });
    if (!flat) k.addChild(sp);
    const nm = txt('PELOTILLEMIAU', { fontFamily: F.comic, fontSize: 18 * s, fill: INK, letterSpacing: 1 });
    nm.anchor.set(0.5);
    nm.position.set(w * 0.83, gy - 128 * s);
    if (words) k.addChild(nm);
    else nm.destroy();
  } else if (kind === 'office') toonStand(cast, w * 0.6, gy, sc * 1.05, { coat: true, flip: true });
  else if (kind === 'punch') toonStand(cast, w * 0.66, gy, sc * 1.02, { flip: true });
  else {
    if (!flat) {
      toonStand(cast, w * 0.32, gy, sc, { coat: seed % 2 === 0, laugh: true });
      toonStand(cast, w * 0.7, gy, sc, { coat: seed % 2 === 1, flip: true, laugh: true });
    }
    toonFallen(fallen, w * 0.32, gy, sc, { coat: seed % 2 === 0 });
    toonFallen(fallen, w * 0.72, gy, sc, { coat: seed % 2 === 1, flip: true });
    puffs(fallen, w * 0.5, gy + 4 * s, w * 0.7, 24 * s, 7, 0xffffff, 1, seed);
    if (!flat) fallen.visible = false;
  }
  if (!flat) k.addChild(cast, fallen);
  const balloons: Container[] = [];
  if (words) {
    if (kind === 'street') balloons.push(strip('DOCTOR…\n¡ME SIENTO COMO UN GATO!', 25 * s, -w * 0.14, h * 0.2));
    if (kind === 'office') balloons.push(strip('¿Y DESDE\nCUÁNDO?', 34 * s, w * 0.12, h * 0.14));
    if (kind === 'punch') balloons.push(strip('¡DESDE QUE\nERA GATITO!', 36 * s, w * 0.14, h * 0.12, true));
    if (kind === 'street') balloons[0].position.set(w * 0.36, h * 0.16);
    if (kind === 'office') balloons[0].position.set(w * 0.27, h * 0.24);
    if (kind === 'punch') balloons[0].position.set(w * 0.3, h * 0.26);
    if (balloons.length) k.addChild(...balloons);
  }
  // the panel border on top of everything
  if (flat) g.rect(0, 0, w, h).stroke({ width: 6 * s, color: INK });
  else k.addChild(new Graphics().rect(0, 0, w, h).stroke({ width: 6 * s, color: INK }));
  return { k, cast, fallen, w, h };
}

/** the newsprint under the panels: paper, faint halftone, a red burst behind the cat */
function paper(w: number, h: number, cx: number, cy: number, s: number, gap = 34) {
  const g = new Graphics().rect(0, 0, w, h).fill(PAPER);
  halftone(g, 0, 0, w, h, Math.max(gap * s, 6), Math.max(2.6 * s, 1.2), 0xc8b890, 0.6);
  const burst = new Graphics();
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 0.5) / n) * Math.PI * 2;
    burst.poly([cx, cy, cx + Math.cos(a0) * 1400 * s, cy + Math.sin(a0) * 1400 * s, cx + Math.cos(a1) * 1400 * s, cy + Math.sin(a1) * 1400 * s]);
  }
  burst.fill({ color: SPOT, alpha: 0.16 });
  return { g, burst };
}

interface St {
  falls: ReturnType<typeof panel>[];
  panels: Container[];
  words: Container[];
  line: ReturnType<typeof payline>;
}
const S = stash<St>();

/** the staircase: [x, y, w, h, kind] at 1920×1080 */
const LAYOUT: [number, number, number, number, Kind][] = [
  [40, 34, 600, 300, 'street'],
  [1290, 64, 590, 300, 'office'],
  [60, 384, 590, 300, 'punch'],
  [1310, 414, 570, 290, 'fall'],
  [80, 734, 570, 300, 'fall'],
  [1330, 764, 550, 290, 'fall'],
];

export const condorgato: Signature = {
  dark: false,
  frame: SPOT,
  tag: 'UNIVERSO DEL REMATE',
  open(c: SigCtx) {
    const k = new Container();
    const pg = paper(W, H, W / 2, c.catY, 1);
    k.addChild(pg.g, pg.burst);
    const panels = LAYOUT.map(([x, y, w, h, kind], i) => {
      const p = panel(kind, w, h, 1, 11 + i);
      p.k.position.set(x, y);
      p.k.rotation = (i % 2 ? 1 : -1) * 0.012;
      k.addChild(p.k);
      return p;
    });
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const falls = panels.filter((_, i) => LAYOUT[i][4] === 'fall');
    const words: Container[] = [];
    const line = payline(c, () => title('¡PLAF!', { size: 210, fill: 0xffffff, ink: INK, inkW: 22, shadow: SPOT }), () => asideText('…y eso que el chiste era bueno.', PAPER, INK, 44));
    S.set(c, { falls, panels: panels.map((p) => p.k), words, line });
    if (!c.reduce && !c.short) {
      pg.burst.alpha = 0;
      gsap.to(pg.burst, { alpha: 1, duration: 0.4 });
    }
    if (c.short) {
      falls.forEach((p) => ((p.cast.visible = false), (p.fallen.visible = true)));
      return;
    }
    // the panels stack down the page, one per beat (the first three tell the joke)
    const times = [0.05, 0.42, 0.8, 1.2, 1.28, 1.36];
    panels.forEach((p, i) => {
      if (c.reduce) return;
      p.k.alpha = 0;
      beat(c, times[i], () => {
        if (p.k.destroyed) return;
        p.k.alpha = 1;
        sfx(i < 3 ? 'paper' : 'pop', 1 + i * 0.08);
        const sx = p.k.x;
        const sy = p.k.y;
        gsap.fromTo(p.k, { x: sx - 40, y: sy - 60 }, { x: sx, y: sy, duration: 0.18, ease: 'back.out(2)' });
        gsap.fromTo(p.k.scale, { x: 1.15, y: 1.15 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2)' });
      });
    });
    score(c, [
      [0.5, 'tick', 1.6],
      [0.88, 'tick', 1.2],
      [1.05, 'sting', 1.4],
    ]);
    // the punchline lands: everybody laughs… and goes over AT THE SAME TIME, legs up, dust
    const plafs = falls.map((p, i) => {
      const t = title('plaf', { size: 64, fill: SPOT, ink: INK, inkW: 8, shadow: null });
      return pre(c.fg, t, p.k.x + p.w * (i === 1 ? 0.78 : 0.5), p.k.y + p.h * 0.28, i % 2 ? 0.12 : -0.12);
    });
    words.push(...plafs);
    beat(c, 1.68, () => {
      sfx('boom', 0.8);
      sfx('hit', 0.7);
      c.shaker.add(0.18);
      for (const p of falls) {
        if (p.cast.destroyed) continue;
        p.cast.visible = false;
        p.fallen.visible = true;
        if (!c.reduce) gsap.fromTo(p.fallen, { y: -16 }, { y: 0, duration: 0.18, ease: 'bounce.out' });
        // a couple of feathers out of each panel
        if (!c.reduce)
          for (let j = 0; j < 4; j++) {
            const f = feather(0.7, j % 2 === 1);
            f.position.set(p.k.x + p.w * (0.2 + j * 0.2), p.k.y + p.h * 0.6);
            f.rotation = Math.random() * 6;
            c.fg.addChild(f);
            gsap.to(f, { y: f.y - 120 - Math.random() * 80, x: f.x + (Math.random() - 0.5) * 120, rotation: f.rotation + 3, duration: 0.7, ease: 'power2.out' });
            gsap.to(f, { alpha: 0, delay: 0.45, duration: 0.3, onComplete: () => destroyTree(f) });
          }
      }
    });
    plafs.forEach((t, i) => pop(c, t, 1.7 + i * 0.03, 0.55, { from: 1.8 }));
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('bigboom', 0.85);
    later(c, 0.06, () => sfx('hit', 0.6));
    later(c, 0.3, () => sfx('fanfare', 1.1));
    c.shaker.add(0.45);
    if (!st) return;
    sweep(st.words);
    for (const p of st.falls) if (!p.cast.destroyed) ((p.cast.visible = false), (p.fallen.visible = true));
    st.line.land(2.3);
    // the page itself goes over a little and rights itself
    if (!c.reduce)
      st.panels.forEach((p, i) => {
        if (p.destroyed) return;
        const r0 = p.rotation;
        gsap.fromTo(p, { rotation: r0 + (i % 2 ? 0.08 : -0.08) }, { rotation: r0, duration: 0.6, ease: 'elastic.out(1.2,0.4)' });
      });
    // the dust ring at his feet
    const dust = new Graphics();
    puffs(dust, W / 2, c.catY + 250, 760, 90, 9, 0xffffff, 0.95, 4);
    puffs(dust, W / 2, c.catY + 262, 820, 60, 9, 0xe8dcc0, 0.9, 5);
    c.behind.addChild(dust);
    if (!c.reduce) gsap.fromTo(dust.scale, { x: 0.4, y: 0.3 }, { x: 1, y: 1, duration: 0.35, ease: 'power2.out' });
    dust.pivot.set(W / 2, c.catY + 250);
    dust.position.set(W / 2, c.catY + 250);
    gsap.to(dust, { alpha: 0, delay: 0.8, duration: 0.8, onComplete: () => destroyTree(dust) });
    // a storm of condor feathers
    burst(c, c.fg, (i) => feather(1.1, i % 3 === 0), 30, W / 2, c.catY - 40, 900, 1.6);
    drizzle(c, c.back, () => feather(0.9, Math.random() < 0.3), 0.2, 3.4);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const s = h / 1080;
    const pg = paper(w, h, w / 2, h * 0.52, s, 60);
    k.addChild(pg.g, pg.burst);
    // the staircase on both sides of the cat: as many columns as fit, falling panels nearest to him
    const pw = 590 * s;
    const ph = 300 * s;
    const kinds: Kind[][] = [
      ['fall', 'punch', 'street'],
      ['office', 'fall', 'fall'],
    ];
    let col = 0;
    for (let x = w / 2 - 330 * s - pw; x > -pw; x -= pw + 40 * s, col++)
      for (let j = 0; j < 3; j++) {
        const p = panel(col === 0 ? kinds[0][j] : (['street', 'office', 'punch'] as Kind[])[(j + col) % 3], pw, ph, s, 30 + col * 3 + j, false, true);
        p.k.position.set(x + j * 20 * s, 34 * s + j * 350 * s + col * 10 * s);
        k.addChild(p.k);
      }
    col = 0;
    for (let x = w / 2 + 330 * s; x < w; x += pw + 40 * s, col++)
      for (let j = 0; j < 3; j++) {
        const kind = col === 0 ? kinds[1][j] : (['punch', 'street', 'office'] as Kind[])[(j + col) % 3];
        const p = panel(kind, pw, ph, s, 60 + col * 3 + j, false, true);
        p.k.position.set(x + j * 20 * s, 64 * s + j * 350 * s + col * 10 * s);
        k.addChild(p.k);
      }
    // three feathers in the air (they drift in the detail view)
    const fs = [0, 1, 2].map((i) => {
      const f = feather(1.4 * s, i === 1);
      f.position.set(w / 2 + (i - 1) * Math.min(w * 0.3, 420 * s), h * (0.2 + i * 0.12));
      f.rotation = i * 1.3;
      k.addChild(f);
      return f;
    });
    const plaf = title('¡PLAF!', { size: 130 * s, fill: 0xffffff, ink: INK, inkW: 13 * s, shadow: SPOT });
    plaf.position.set(w / 2 - Math.min(w * 0.3, 360 * s), h * 0.86);
    plaf.rotation = -0.08;
    k.addChild(plaf);
    if (live)
      liveLoop(k, (t) => {
        fs.forEach((f, i) => {
          const q = (t * 0.12 + i / 3) % 1;
          f.y = -60 * s + q * (h + 120 * s);
          f.x = w / 2 + (i - 1) * Math.min(w * 0.3, 420 * s) + Math.sin(t * 1.4 + i * 2) * 40 * s;
          f.rotation = Math.sin(t * 1.8 + i) * 0.9;
        });
        plaf.scale.set(1 + 0.04 * Math.sin(t * 3));
      });
    return k;
  },
};
