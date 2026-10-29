/**
 * Gomitas D. Michi: the pirate universe (a rubber-limbed pirate anime). Open sea at noon: a deep sky with cumulus, waves
 * that roll, gulls. A caravel with a cat's-head figurehead plows across the screen behind him and stops; its sail — a
 * fish skeleton over crossed bones — fills with a ¡FLAP!; his other arm stretches like chewing gum all the way up to the
 * crow's nest (¡ESTIIIRA!) and snaps back ¡BOING!; a SE BUSCA poster flutters in (VIVO O DORMIDO · 3.000.000.000
 * CROQUETAS); a wave crashes over the bow: «¡NO SÉ NADAR!».
 * Payoff: the sail bellies out, the flag snaps, spray and gulls burst; ¡ZARPAMOS! / …sin saber nadar.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, arrive, burst, every, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, pay, say, wavePts } from './kitC';
import { ngon, onCat, rnd, streak } from './kitD';
import { type Head, band, cumulus, gull, prepHead, prepWord, rrect, show, showHead } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';

const RED = 0xd62839;
const SKY = [0x1f6fd0, 0x3f92e6, 0x8cc8f6, 0xd8efff];
const SEA = [0x0f4f9a, 0x1563b8, 0x1f78cc, 0x2f8edc];
const WOOD = 0x9a6232;
const WOOD_D = 0x6a3e1c;
const FUR = 0xf0a040;
const FUR_D = 0xc8701e;
const HZ = 560;

/** the sea from the horizon down: wave rows (phase `t`), foam streaks; rows from `r0` to `r1` (back rows / front rows) */
function sea(g: Graphics, w: number, h: number, hz: number, t: number, k: number, r0 = 0, r1 = 5) {
  if (r0 === 0) g.rect(0, hz, w, h - hz).fill(SEA[0]);
  for (let i = r0; i < r1; i++) {
    const u = i / 5;
    const y = hz + (h - hz) * (0.05 + u * u * 0.95);
    const len = (90 + u * 260) * k;
    const amp = (4 + u * 16) * k;
    g.poly(wavePts(-len, w + len, y, amp, len, t * (1.2 + u) * (i % 2 ? 1 : -1) + i, h + 4, len / 6)).fill(SEA[Math.min(3, i)]);
    // foam on the crests
    for (let x = ((i * 137) % 220) * k - len; x < w + len; x += len * 1.7) {
      const ph = (x / len) * Math.PI * 2 + t * (1.2 + u) * (i % 2 ? 1 : -1) + i;
      const yy = y + Math.sin(ph) * amp - amp * 0.6;
      g.poly(streak(x - len * 0.18, yy, x + len * 0.18, yy, 0.5, (2 + u * 4) * k)).fill({ color: 0xe8f6ff, alpha: 0.75 });
    }
  }
}

/** the fish skeleton over crossed bones (origin at its center, `s` scale, ink on the sail) */
function emblem(g: Graphics, x: number, y: number, s: number, ink = C.ink, paper = 0xf4ecd8) {
  for (const a of [0.7, -0.7]) {
    g.poly(streak(x - Math.cos(a) * 120 * s, y - Math.sin(a) * 120 * s, x + Math.cos(a) * 120 * s, y + Math.sin(a) * 120 * s, 14 * s, 14 * s)).fill(ink);
    for (const e of [-1, 1]) g.poly(ngon(x + e * Math.cos(a) * 124 * s, y + e * Math.sin(a) * 124 * s, 18 * s, 18 * s, 10)).fill(ink);
  }
  // the head (a fish skull looking right), its eye hole and jaw; the spine, ribs and tail
  g.poly([x + 20 * s, y - 52 * s, x + 96 * s, y - 20 * s, x + 110 * s, y + 6 * s, x + 80 * s, y + 30 * s, x + 20 * s, y + 46 * s]).fill(ink);
  g.poly(ngon(x + 58 * s, y - 12 * s, 13 * s, 13 * s, 10)).fill(paper);
  g.poly([x + 76 * s, y + 10 * s, x + 108 * s, y + 8 * s, x + 80 * s, y + 22 * s]).fill(paper);
  g.poly(streak(x + 20 * s, y, x - 96 * s, y, 7 * s, 5 * s)).fill(ink);
  for (let i = 0; i < 4; i++) {
    const rx = x - 4 * s - i * 24 * s;
    g.poly(streak(rx, y, rx - 12 * s, y - (40 - i * 6) * s, 5 * s, 3 * s)).fill(ink);
    g.poly(streak(rx, y, rx - 12 * s, y + (40 - i * 6) * s, 5 * s, 3 * s)).fill(ink);
  }
  g.poly([x - 96 * s, y, x - 140 * s, y - 34 * s, x - 128 * s, y, x - 140 * s, y + 34 * s]).fill(ink);
}

/**
 * the caravel, facing right (origin at its waterline's middle), `s` scale (1 ≈ 1300 px long), `bulge` 0..1 how full its
 * sail is, `flap` −1..1 the flag. Hull, stern castle, the cat's-head figurehead, mast, crow's nest, rigging, sail, flag.
 */
function caravel(g: Graphics, s: number, bulge: number, flap: number) {
  g.clear();
  const P = (pts: number[]) => pts.map((v) => v * s);
  const ink = { width: Math.max(2, 6 * s), color: C.ink, join: 'round' as const };
  // rigging (behind the sail)
  for (const [x1, y1] of [
    [640, -180],
    [-560, -250],
  ])
    g.poly(streak(0, -900 * s, x1 * s, y1 * s, 2.5 * s, 2.5 * s)).fill(0x3a2a1a);
  // the mast and the crow's nest
  g.poly(P([-14, -120, 14, -120, 10, -930, -10, -930])).fill(WOOD_D).stroke(ink);
  g.poly(P([-48, -840, 48, -840, 40, -790, -40, -790])).fill(WOOD).stroke(ink);
  // the yards
  g.poly(P([-330, -772, 330, -772, 330, -756, -330, -756])).fill(WOOD_D).stroke(ink);
  g.poly(P([-300, -318, 300, -318, 300, -304, -300, -304])).fill(WOOD_D).stroke(ink);
  // the sail: its right side (the bow side) bellies out with the wind from behind
  const b = 40 + bulge * 120;
  const sail: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    sail.push(-300 + 600 * u, -756 - Math.sin(u * Math.PI) * 14);
  }
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    sail.push(300 + Math.sin(u * Math.PI) * b, -756 + 440 * u);
  }
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    sail.push(300 - 600 * u, -316 + Math.sin(u * Math.PI) * (20 + bulge * 30));
  }
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    sail.push(-300 + Math.sin(u * Math.PI) * b * 0.4, -316 - 440 * u);
  }
  g.poly(P(sail)).fill(0xf4ecd8).stroke(ink);
  g.poly(P([-300, -540, 300 + b * 0.9, -560, 300 + b * 0.7, -460, -290, -440])).fill({ color: 0xd8ccb0, alpha: 0.5 });
  emblem(g, (20 + b * 0.35) * s, -540 * s, 1.05 * s);
  // the flag at the top (black, a tiny bone cross), flapping
  const fy = -930;
  const fpts: number[] = [0, fy];
  for (let i = 1; i <= 6; i++) fpts.push(i * 30, fy + 10 + Math.sin(i * 1.1 + flap * 2.4) * 10 * (i / 6));
  for (let i = 6; i >= 0; i--) fpts.push(i * 30, fy + 70 + Math.sin(i * 1.1 + flap * 2.4) * 10 * (i / 6));
  g.poly(P(fpts)).fill(C.ink);
  g.poly(streak(60 * s, (fy + 22) * s, 130 * s, (fy + 58) * s, 4 * s, 4 * s)).fill(0xffffff);
  g.poly(streak(130 * s, (fy + 22) * s, 60 * s, (fy + 58) * s, 4 * s, 4 * s)).fill(0xffffff);
  // the stern castle (left) with its windows
  g.poly(P([-600, -120, -600, -300, -380, -300, -360, -120])).fill(WOOD).stroke(ink);
  for (let i = 0; i < 3; i++) g.poly(rrect((-570 + i * 66) * s, -270 * s, 40 * s, 50 * s, 10 * s)).fill(0xffe9a8).stroke({ width: 3 * s, color: C.ink });
  // the hull: a fat, cheerful curve up to the bow
  g.poly(P([-620, -140, -560, -30, -420, 30, 380, 40, 560, -20, 660, -150, 700, -200, 640, -210, 560, -130, -620, -130])).fill(WOOD).stroke(ink);
  for (let i = 0; i < 3; i++) g.poly(P([-590, -100 + i * 40, 600 - i * 50, -100 + i * 40, 590 - i * 50, -92 + i * 40, -585, -92 + i * 40])).fill(WOOD_D);
  g.poly(P([-620, -150, 640, -150, 640, -128, -620, -128])).fill(0xc89058).stroke({ width: 3 * s, color: C.ink });
  // the figurehead: a round, happy cat's head on the bow
  const hx = 700;
  const hy = -270;
  g.poly(P([hx - 80, hy + 30, hx - 64, hy - 96, hx - 22, hy - 54])).fill(0xfff4e0).stroke(ink);
  g.poly(P([hx + 70, hy + 20, hx + 70, hy - 100, hx + 26, hy - 56])).fill(0xfff4e0).stroke(ink);
  g.poly(ngon(hx * s, hy * s, 84 * s, 76 * s, 22)).fill(0xfff4e0).stroke(ink);
  for (const ex of [-30, 30]) g.poly(P([hx + ex - 16, hy - 6, hx + ex, hy - 18, hx + ex + 16, hy - 6, hx + ex, hy - 12])).fill(C.ink);
  g.poly(P([hx - 8, hy + 12, hx + 8, hy + 12, hx, hy + 22])).fill(0xe87090);
  g.poly(P([hx - 26, hy + 30, hx, hy + 44, hx + 26, hy + 30, hx, hy + 36])).fill(C.ink);
  for (const e of [-1, 1]) for (const dy of [16, 30]) g.poly(streak((hx + e * 40) * s, (hy + dy) * s, (hx + e * 96) * s, (hy + dy + 6 * (dy - 22) / 8) * s, 2 * s, 1.5 * s)).fill(C.ink);
}

/** the SE BUSCA poster (origin at its center) */
function wanted() {
  const k = new Container();
  const PW = 300;
  const PH = 400;
  const g = new Graphics();
  g.poly(rrect(-PW / 2 + 8, -PH / 2 + 10, PW, PH, 4)).fill({ color: 0x000000, alpha: 0.3 });
  g.poly([-PW / 2, -PH / 2, PW / 2, -PH / 2 + 4, PW / 2 - 4, PH / 2, -PW / 2 + 4, PH / 2 - 3]).fill(0xf0dcae).stroke({ width: 4, color: 0x6a4a28 });
  g.poly(rrect(-110, -110, 220, 170, 4)).fill(0xe2c890).stroke({ width: 4, color: 0x6a4a28 });
  // the sketch: a cat's head in a straw hat, grinning
  g.poly(ngon(0, -10, 56, 50, 18)).fill(0xd8a868).stroke({ width: 4, color: 0x4a3018 });
  g.poly([-50, -30, -46, -78, -16, -50]).fill(0xd8a868).stroke({ width: 4, color: 0x4a3018 });
  g.poly([50, -30, 46, -78, 16, -50]).fill(0xd8a868).stroke({ width: 4, color: 0x4a3018 });
  g.poly(ngon(0, -54, 92, 22, 18)).fill(0xf2d478).stroke({ width: 4, color: 0x4a3018 });
  g.poly(ngon(0, -66, 52, 26, 16)).fill(0xf2d478).stroke({ width: 4, color: 0x4a3018 });
  g.poly([-50, -60, 50, -60, 50, -50, -50, -50]).fill(RED);
  g.poly([-30, 14, 0, 30, 30, 14, 0, 22]).fill(0x4a3018);
  for (const ex of [-20, 20]) g.poly(ngon(ex, -10, 6, 7, 8)).fill(0x4a3018);
  const t1 = txt('SE BUSCA', { fontFamily: F.poster, fontSize: 58, fill: 0x4a3018, letterSpacing: 3 });
  t1.anchor.set(0.5);
  t1.y = -158;
  const t2 = txt('VIVO O DORMIDO', { fontFamily: F.poster, fontSize: 24, fill: 0x4a3018, letterSpacing: 2 });
  t2.anchor.set(0.5);
  t2.y = 86;
  const t3 = txt('3.000.000.000', { fontFamily: F.poster, fontSize: 38, fill: 0x4a3018 });
  t3.anchor.set(0.5);
  t3.y = 124;
  const t4 = txt('CROQUETAS', { fontFamily: F.poster, fontSize: 24, fill: 0x4a3018, letterSpacing: 4 });
  t4.anchor.set(0.5);
  t4.y = 164;
  k.addChild(g, t1, t2, t3, t4);
  return k;
}

interface St {
  ship: Container;
  draw: () => void;
  bulge: { v: number };
  flap: { v: number };
  head: Head;
}
const S = stash<St>();
const SHIP_X = 1380;
const SHIP_Y = 640;
const SHIP_S = 0.62;

export const gomitas: Signature = {
  dark: false,
  frame: RED,
  tag: 'UNIVERSO PIRATA',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, HZ + 4, SKY, 16);
    sky.poly(ngon(190, 120, 70, 70, 20)).fill(0xfff6c0).poly(ngon(190, 120, 110, 110, 20)).fill({ color: 0xfff6c0, alpha: 0.25 });
    const clouds = new Graphics();
    cumulus(clouds, 700, 170, 220);
    cumulus(clouds, 1180, 90, 150);
    cumulus(clouds, 1640, 240, 190);
    cumulus(clouds, 300, 420, 130);
    const back = new Graphics();
    const front = new Graphics();
    const shipK = new Container();
    const shipG = new Graphics();
    shipK.addChild(shipG);
    shipK.position.set(c.short || c.reduce ? SHIP_X : -900, SHIP_Y);
    const birds = new Graphics();
    k.addChild(sky, clouds, back, shipK, front, birds);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    const bulge = { v: c.short ? 0.8 : 0.1 };
    const flap = { v: 0 };
    const draw = () => !shipG.destroyed && caravel(shipG, SHIP_S, bulge.v, flap.v);
    draw();
    const head = prepHead(c, '¡ZARPAMOS!', { fontFamily: F.comic, fontSize: 170, fill: 0xffe14d, letterSpacing: 4, stroke: { color: C.ink, width: 16, join: 'round' }, dropShadow: { color: RED, distance: 8, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…sin saber nadar.',
      asideStyle: { fill: 0xffffff },
      at: [440, 700],
    });
    S.set(c, { ship: shipK, draw, bulge, flap, head });
    const r = rnd(3);
    const gulls: [number, number, number, number][] = [];
    for (let i = 0; i < 6; i++) gulls.push([r() * W, 120 + r() * 300, 18 + r() * 16, r() * 6]);
    const frame = (t: number) => {
      if (back.destroyed) return;
      back.clear();
      sea(back, W, H, HZ, t, 1, 0, 3);
      front.clear();
      sea(front, W, H, HZ, t, 1, 3, 5);
      flap.v = Math.sin(t * 6);
      draw();
      if (!shipK.destroyed) shipK.rotation = Math.sin(t * 1.6) * 0.012;
      clouds.x = -t * 10;
      birds.clear();
      for (const [x, y, s, ph] of gulls) gull(birds, ((x + t * 90) % (W + 200)) - 100, y + Math.sin(t * 2 + ph) * 12, s, Math.sin(t * 9 + ph), 0x2a3a5a);
    };
    frame(0.5);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // prepared words
    const flapW = prepWord(c.fg, SHIP_X + 60, 210, '¡FLAP!', 0xffffff, 80, 0.1);
    const est = prepWord(c.fg, 1480, 380, '¡ESTIIIRA!', 0xffe14d, 84, -0.18);
    const boing = prepWord(c.fg, 1250, 300, '¡BOING!', 0xff7ab8, 96, 0.08);
    const splash = prepWord(c.fg, 1500, 760, '¡SPLASH!', 0x9fe0ff, 96, -0.06);
    const poster = wanted();
    poster.position.set(330, 330);
    poster.rotation = -0.08;
    poster.alpha = 0.001;
    c.fg.addChild(poster);

    // the ship plows across behind him and stops
    sfx('splash', 0.6);
    sfx('whoosh', 0.5);
    if (!c.reduce) {
      gsap.to(shipK, { x: SHIP_X, duration: 0.85, ease: 'power3.out' });
      // the bow wave
      for (let i = 0; i < 8; i++)
        later(c, i * 0.08, () => {
          const d = new Graphics().poly(ngon(0, 0, 16 + Math.random() * 14, 12, 8)).fill({ color: 0xf2faff, alpha: 0.9 });
          d.position.set(shipK.x + 420 * SHIP_S, SHIP_Y - 10);
          c.back.addChild(d);
          gsap.to(d, { x: d.x + 80 + Math.random() * 80, y: d.y - 60 - Math.random() * 60, alpha: 0, duration: 0.5, ease: 'power2.out', onComplete: () => destroyTree(d) });
        });
    }
    // the sail fills
    beat(c, 0.55, () => {
      sfx('paper', 0.8);
      sfx('whoosh', 1.2);
      show(c, flapW, 0.5, { from: 1.8 });
      if (c.reduce) bulge.v = 0.8;
      else gsap.to(bulge, { v: 0.8, duration: 0.25, ease: 'back.out(3)' });
    });
    // the chewing-gum arm: from his paw at his chest up to the crow's nest, and back
    const [ax, ay] = onCat(c, 0.79, 0.47);
    const nx = SHIP_X;
    const ny = SHIP_Y - 815 * SHIP_S;
    const arm = new Graphics();
    c.fg.addChild(arm);
    const reach = { v: 0 };
    const drawArm = (wob: number) => {
      if (arm.destroyed) return;
      arm.clear();
      if (reach.v < 0.02) return;
      const ex = ax + (nx - ax) * reach.v;
      const ey = ay + (ny - ay) * reach.v;
      const L = Math.hypot(ex - ax, ey - ay);
      const n = 16;
      const pts: number[] = [];
      const ux = (ex - ax) / (L || 1);
      const uy = (ey - ay) / (L || 1);
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const sw = Math.sin(u * Math.PI) * Math.sin(u * Math.PI * 3 + wob) * 26 * (0.3 + reach.v);
        pts.push(ax + (ex - ax) * u - uy * sw, ay + (ey - ay) * u + ux * sw);
      }
      const thin = 30 - reach.v * 12;
      arm.poly(band(pts, thin + 4, thin)).fill(FUR).stroke({ width: 5, color: C.ink, join: 'round' });
      // tabby stripes across the arm
      for (let i = 2; i < n - 1; i += 2) {
        const px = pts[i * 2];
        const py = pts[i * 2 + 1];
        arm.poly(streak(px - uy * thin * 0.9, py + ux * thin * 0.9, px + uy * thin * 0.9, py - ux * thin * 0.9, 4, 4)).fill(FUR_D);
      }
      // the paw gripping the mast
      arm.poly(ngon(ex, ey, 36, 32, 14)).fill(FUR).stroke({ width: 5, color: C.ink });
      for (let i = -1; i <= 1; i++) arm.poly(streak(ex - 10 + i * 12, ey - 26, ex - 6 + i * 12, ey - 8, 2.5, 2.5)).fill(C.ink);
    };
    beat(c, 0.75, () => {
      sfx('charge', 1.9);
      show(c, est, 0.6, { from: 1.6 });
      if (c.reduce) {
        reach.v = 1;
        drawArm(0);
        return;
      }
      gsap.to(reach, { v: 1, duration: 0.24, ease: 'power2.out', onUpdate: () => drawArm(reach.v * 6) });
    });
    if (!c.reduce) beat(c, 1.0, () => every(c, 30, (t) => (reach.v > 0.02 ? drawArm(t * 30) : undefined)));
    beat(c, 1.3, () => {
      sfx('pop', 0.55);
      sfx('hit', 1.6);
      c.shaker.add(0.15);
      show(c, boing, 0.55, { from: 2 });
      if (c.reduce) {
        reach.v = 0;
        drawArm(0);
      } else gsap.to(reach, { v: 0, duration: 0.18, ease: 'back.in(2)', onUpdate: () => drawArm(reach.v * 10) });
    });
    later(c, 2.0, () => destroyTree(arm));
    // the poster flutters in from the sky
    beat(c, 1.05, () => {
      if (poster.destroyed) return;
      sfx('paper', 1.2);
      poster.alpha = 1;
      if (!c.reduce) {
        gsap.from(poster, { y: -280, rotation: 0.6, duration: 0.45, ease: 'back.out(1.6)' });
        gsap.to(poster, { rotation: -0.04, duration: 0.3, yoyo: true, repeat: 3, delay: 0.45, ease: 'sine.inOut' });
      }
      fadeKill(poster, 1.6, 0.35);
    });
    // a wave crashes over the bow: «¡NO SÉ NADAR!»
    beat(c, 1.6, () => {
      sfx('splash', 1);
      c.shaker.add(0.18);
      show(c, splash, 0.6, { from: 1.8 });
      if (!c.reduce)
        for (let i = 0; i < 14; i++) {
          const d = new Graphics().poly(ngon(0, 0, 10 + Math.random() * 16, 9 + Math.random() * 10, 8)).fill({ color: i % 3 ? 0xe8f6ff : 0x9fd8ff, alpha: 0.95 });
          d.position.set(SHIP_X + 380 + Math.random() * 120, SHIP_Y - 60);
          c.fg.addChild(d);
          gsap.to(d, { x: d.x - 200 - Math.random() * 300, y: d.y - 120 - Math.random() * 200, duration: 0.45, ease: 'power2.out' });
          gsap.to(d, { y: d.y + 200, alpha: 0, delay: 0.45, duration: 0.4, ease: 'power2.in', onComplete: () => destroyTree(d) });
        }
      const [hx, hy] = onCat(c, 0.42, 0.1);
      say(c, c.fg, hx - 280, hy - 40, '¡NO SÉ NADAR!', 0.8, { size: 54, tail: 'right' });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.05);
    sfx('splash', 0.8);
    c.shaker.add(0.35);
    flashOf(c, 0xffffff, 0.45, 0.3);
    if (st && !st.ship.destroyed) {
      gsap.killTweensOf(st.ship);
      st.ship.x = SHIP_X;
      if (c.reduce) st.bulge.v = 1;
      else gsap.to(st.bulge, { v: 1, duration: 0.3, ease: 'back.out(4)', onUpdate: st.draw });
    }
    // spray and gulls burst from the bow; the crew's streamers
    burst(c, c.fg, (i) => new Graphics().poly(ngon(0, 0, 12 + (i % 3) * 5, 10, 8)).fill(i % 2 ? 0xe8f6ff : 0x9fd8ff), 26, W / 2, c.catY + 140, 900, 1.3);
    burst(c, c.fg, () => gull(new Graphics(), 0, 0, 30, 0.5, 0xffffff), 8, W / 2 + 200, c.catY - 160, 1000, 1.6);
    burst(c, c.fg, (i) => new Graphics().rect(-14, -6, 28, 12).fill(i % 3 === 0 ? RED : i % 3 === 1 ? 0xffe14d : 0x3a7bd5), 22, W / 2, c.catY - 100, 850, 1.4);
    showHead(c, st?.head, { dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const hz = h * 0.5;
    const sky = vgrad(new Graphics(), 0, 0, w, hz + 4, SKY, 12);
    const clouds = new Graphics();
    const r = rnd(5);
    const nc = Math.max(2, Math.round(w / (m * 0.8)));
    for (let i = 0; i < nc; i++) cumulus(clouds, ((i + 0.5) / nc) * w + (r() - 0.5) * m * 0.2, hz * (0.2 + r() * 0.4), m * (0.16 + r() * 0.08));
    const back = new Graphics();
    sea(back, w, h, hz, 0.4, s * 1.4, 0, 3);
    const front = new Graphics();
    sea(front, w, h, hz, 0.4, s * 1.4, 3, 5);
    const shipK = new Container();
    const sg = new Graphics();
    shipK.addChild(sg);
    const ss = s * 0.62;
    shipK.position.set(w / 2 + Math.min(w * 0.3, m * 0.45), hz + m * 0.1);
    caravel(sg, ss, 0.8, 0);
    k.addChild(sky, clouds, back, shipK, front);
    // the wide page: the SE BUSCA poster on the left
    if (w > h * 2) {
      const p = wanted();
      p.scale.set(m / 900);
      p.position.set(w / 2 - m * 0.95, h * 0.36);
      p.rotation = -0.06;
      k.addChild(p);
    }
    if (live)
      liveLoop(k, (t) => {
        back.clear();
        sea(back, w, h, hz, 0.4 + t, s * 1.4, 0, 3);
        front.clear();
        sea(front, w, h, hz, 0.4 + t, s * 1.4, 3, 5);
        caravel(sg, ss, 0.8, Math.sin(t * 6));
        shipK.rotation = Math.sin(t * 1.6) * 0.015;
        clouds.x = -((t * m * 0.02) % (m * 0.4));
      });
    return k;
  },
};
