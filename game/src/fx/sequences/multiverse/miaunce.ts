/**
 * Miaunce: the universe of the Other Side (the 80s small-town sci-fi series: the telekinetic girl, the dark mirror
 * world). A living room in 1983 — floral wallpaper, wood paneling, a window on the sleeping town — with Christmas lights
 * strung over an alphabet painted on the wall: the bulbs light one by one, M · I · A · U, then all of them flicker
 * (¡CORRE!) and the screen flips over into the dark reflection: the same room gone blue-grey, vines on the walls, red
 * bulbs, a red storm in the window and spores floating up. Three bikes with headlights tear across the floor. She raises
 * her paw — a pink ring — and everything stops dead in the air: the bikes, the spores, the lights (¡ZUUUM!… silence).
 * Payoff: she lets go: the ring blasts the spores away, the bikes fly off, waffles rain; ¡ALTO! …¿me pasas un waffle?
 * (No nosebleed: just the paw, the ring and the stillness.)
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, every, fall, flashOf, later, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { aside, bandPts, ngon, onCat, rnd, streak } from './kitD';
import { catenary, cone, held, stringLights, strip } from './kitH';
import { liveLoop } from '../../../panels/collection/cardArt';

const PAPER = 0xe8d9b0;
const FLORAL = 0xc9a86a;
const PANEL = 0x6a4428;
const PANEL_D = 0x4e3018;
const RED = 0xc8102e;
const PINK = 0xf7a1c4;
const BULBS = [0xff4a3a, 0x4ad96a, 0x3a8aff, 0xffd23a, 0xff8a2a, 0xd94aff];
const ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z'],
];

/** the two alphabet panels' layout for a w×h room at scale k: each row's wire and letter spots */
interface Row {
  wire: number[];
  spots: [number, number][];
  letters: string[];
}
function rowsOf(w: number, h: number, k: number, cx: number): Row[] {
  const out: Row[] = [];
  ROWS.forEach((letters, i) => {
    const left = i < 2;
    const x0 = left ? cx - 900 * k : cx + 330 * k;
    const x1 = left ? cx - 330 * k : cx + 900 * k;
    const y = (i % 2 ? 420 : 230) * k + h * 0.02;
    const wire = catenary(x0 - 20 * k, y - 20 * k, x1 + 20 * k, y - 20 * k, 30 * k, 14);
    const spots: [number, number][] = letters.map((_, j) => [x0 + ((j + 0.5) / letters.length) * (x1 - x0), y + 80 * k]);
    out.push({ wire, spots, letters });
  });
  return out;
}

/** the room (one Graphics): wallpaper + flowers, paneling, carpet, the window on the town; `other` = the dark mirror */
function room(g: Graphics, w: number, h: number, k: number, cx: number, other: boolean, lite = false) {
  const panelTop = h * 0.6;
  const floor = h * 0.8;
  g.rect(0, 0, w, panelTop).fill(other ? 0x1c2430 : PAPER);
  const r = rnd(4);
  // the flowers: sparser on a tiny card (the Catdex grid draws up to 155 of them)
  const fs = lite ? 2 : 1;
  for (let y = 40 * k; y < panelTop; y += 90 * k * fs)
    for (let x = ((y / (90 * k * fs)) % 2) * 60 * k * fs; x < w; x += 120 * k * fs) {
      const col = other ? 0x26303e : FLORAL;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        g.poly(ngon(x + Math.cos(a) * 9 * k, y + Math.sin(a) * 9 * k, 7 * k, 7 * k, 6)).fill(col);
      }
      g.poly(ngon(x, y, 5 * k, 5 * k, 6)).fill(other ? 0x323c4a : 0xb84a3a);
      if (r() < 0.3) g.poly(ngon(x + 24 * k, y + 20 * k, 10 * k, 4 * k, 6, 0.6)).fill(other ? 0x26303e : 0x7a8a4a);
    }
  g.rect(0, panelTop, w, floor - panelTop).fill(other ? 0x141a22 : PANEL);
  for (let x = 0; x < w; x += 70 * k) g.rect(x, panelTop, 4 * k, floor - panelTop).fill(other ? 0x0c1016 : PANEL_D);
  g.rect(0, panelTop - 10 * k, w, 12 * k).fill(other ? 0x0c1016 : PANEL_D);
  g.rect(0, floor, w, h - floor).fill(other ? 0x0e1218 : 0x8a6a3a);
  for (let y = floor + 20 * k; y < h; y += 28 * k) g.rect(0, y, w, 3 * k).fill(other ? 0x161c24 : 0x7a5a2e);
  // the window behind her: the sleeping town (or the red storm)
  const wx = cx;
  const wy = 150 * k;
  const ww = 230 * k;
  const wh = 330 * k;
  g.rect(wx - ww - 16 * k, wy - 16 * k, ww * 2 + 32 * k, wh + 32 * k).fill(other ? 0x0c1016 : 0xf2ecd8);
  if (other) vgrad(g, wx - ww, wy, ww * 2, wh, [0x3a0a10, 0x6a1420, 0x1a0a10], 8);
  else vgrad(g, wx - ww, wy, ww * 2, wh, [0x0a1430, 0x1a2a5a, 0x2a3a6a], 8);
  // houses, the water tower, the woods
  const base = wy + wh;
  for (let i = 0; i < 6; i++) {
    const hx = wx - ww + (i + 0.2) * (ww / 3);
    g.rect(hx, base - 70 * k, 50 * k, 70 * k).fill(other ? 0x14080c : 0x101830).poly([hx - 6 * k, base - 70 * k, hx + 25 * k, base - 100 * k, hx + 56 * k, base - 70 * k]).fill(other ? 0x14080c : 0x101830);
    if (!other && i % 2 === 0) g.rect(hx + 16 * k, base - 50 * k, 14 * k, 14 * k).fill(0xffd98a);
  }
  g.poly(streak(wx + 120 * k, base - 70 * k, wx + 110 * k, base - 190 * k, 3 * k, 3 * k)).fill(other ? 0x14080c : 0x101830);
  g.poly(streak(wx + 150 * k, base - 70 * k, wx + 160 * k, base - 190 * k, 3 * k, 3 * k)).fill(other ? 0x14080c : 0x101830);
  g.poly(ngon(wx + 135 * k, base - 210 * k, 44 * k, 30 * k, 14)).fill(other ? 0x14080c : 0x101830);
  g.rect(wx - 3 * k, wy, 6 * k, wh).fill(other ? 0x0c1016 : 0xf2ecd8).rect(wx - ww, wy + wh * 0.5, ww * 2, 6 * k).fill(other ? 0x0c1016 : 0xf2ecd8);
  if (!other) g.poly(ngon(wx - 120 * k, wy + 70 * k, 30 * k, 30 * k, 16)).fill(0xf2ecd8);
  // vines on the dark side
  if (other) {
    const vr = rnd(9);
    for (let i = 0; i < 14; i++) {
      const x0 = vr() * w;
      const pts: number[] = [];
      let x = x0;
      let y = vr() < 0.5 ? 0 : panelTop;
      const dy = y === 0 ? 1 : -1;
      for (let j = 0; j < 7; j++) {
        pts.push(x, y);
        x += (vr() - 0.5) * 90 * k;
        y += dy * (40 + vr() * 50) * k;
      }
      g.poly(strip(pts, (3 + vr() * 4) * k)).fill(0x2a1418);
    }
  }
}

/** the painted letters (one Container of Texts); `other` fades them out */
function letters(rows: Row[], k: number, other: boolean): Container {
  const c = new Container();
  for (const r of rows)
    r.letters.forEach((L, j) => {
      const t: Text = txt(L, { fontFamily: F.brush, fontSize: 64 * k, fill: other ? 0x3a4250 : 0x1a1410 });
      t.anchor.set(0.5);
      t.position.set(r.spots[j][0], r.spots[j][1]);
      t.rotation = ((j * 37) % 7 - 3) * 0.03;
      c.addChild(t);
    });
  return c;
}

/** the string lights over the letters: `lit(row, i)` 0..1 */
function drawLights(g: Graphics, rows: Row[], k: number, lit: (row: number, i: number) => number, red: boolean) {
  g.clear();
  rows.forEach((r, ri) => stringLights(g, r.wire, r.letters.length, red ? [RED] : BULBS, (i) => lit(ri, i), { r: 13 * k, wireW: 1.8 * k, hang: 12 * k }));
}

/** a kid-cat on a bike with its headlight (origin at the ground under the wheels), facing left */
function bike(s: number) {
  const k = new Container();
  const g = new Graphics();
  const ink = 0x0c0e14;
  for (const x of [-60, 60]) {
    g.poly(bandPts(x * s, -36 * s, 28 * s, 36 * s, 0, Math.PI * 2, 14)).fill(ink);
    g.poly(streak(x * s, -36 * s, 0, -60 * s, 2.5 * s, 2.5 * s)).fill(ink);
  }
  g.poly(streak(-60 * s, -36 * s, -40 * s, -96 * s, 4 * s, 4 * s)).fill(ink).poly(streak(-40 * s, -96 * s, -60 * s, -100 * s, 4 * s, 4 * s)).fill(ink);
  g.poly(streak(0, -60 * s, -44 * s, -80 * s, 4 * s, 4 * s)).fill(ink).poly(streak(0, -60 * s, 30 * s, -84 * s, 4 * s, 4 * s)).fill(ink);
  // the rider: body, head, ears, a backpack
  g.poly([10 * s, -84 * s, 40 * s, -84 * s, 20 * s, -150 * s, -10 * s, -150 * s]).fill(ink);
  g.poly(ngon(-14 * s, -170 * s, 24 * s, 22 * s, 10)).fill(ink);
  g.poly([-30 * s, -180 * s, -26 * s, -206 * s, -14 * s, -190 * s]).fill(ink).poly([2 * s, -180 * s, -2 * s, -206 * s, -12 * s, -190 * s]).fill(ink);
  g.rect(24 * s, -146 * s, 26 * s, 40 * s).fill(0x1a1e28);
  g.poly(streak(-10 * s, -140 * s, -40 * s, -98 * s, 5 * s, 5 * s)).fill(ink);
  // the headlight
  g.poly(ngon(-44 * s, -96 * s, 7 * s, 7 * s, 8)).fill(0xfff6c8);
  const beam = new Graphics();
  cone(beam, -44 * s, -96 * s, -560 * s, -40 * s, 6 * s, 120 * s, 0xfff2c8, 0.32, 2);
  beam.blendMode = 'add';
  k.addChild(beam, g);
  return k;
}

/** a waffle (a golden rounded square with its grid) */
function waffle(s = 1) {
  const g = new Graphics();
  g.poly(ngon(0, 0, 28 * s, 28 * s, 10)).fill(0xe0a040).stroke({ width: 3 * s, color: 0x8a5a1a });
  for (let i = -1; i <= 1; i++) {
    g.rect(i * 12 * s - 2 * s, -22 * s, 4 * s, 44 * s).fill(0xb87a2a);
    g.rect(-22 * s, i * 12 * s - 2 * s, 44 * s, 4 * s).fill(0xb87a2a);
  }
  return g;
}

/** the spores: drifting motes (screen space), redrawn each frame from a clock `t` that stops when frozen */
function drawSpores(g: Graphics, w: number, h: number, t: number, n: number, seed: number, blast = 0, bx = 0, by = 0) {
  g.clear();
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    let x = r() * w + Math.sin(t * 0.8 + i) * 30;
    let y = (((r() * h - t * (20 + r() * 40)) % h) + h) % h;
    if (blast > 0) {
      const dx = x - bx;
      const dy = y - by;
      const d = Math.hypot(dx, dy) || 1;
      x += (dx / d) * blast * 900;
      y += (dy / d) * blast * 900;
    }
    const s = 2 + r() * 4;
    g.poly(ngon(x, y, s, s, 5)).fill({ color: 0xc8d0e0, alpha: 0.35 + r() * 0.4 });
  }
}

interface St {
  frozen: { v: boolean };
  blast: { v: number };
  bikes: Container[];
  flip: { other: boolean };
  pulse: Graphics;
}
const S = stash<St>();
const SPELL: [number, number][] = [
  [1, 5],
  [1, 1],
  [0, 0],
  [3, 0],
]; // M · I · A · U as [row, index]

export const miaunce: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO DEL OTRO LADO',
  open(c: SigCtx) {
    const k = new Container();
    const world = new Container();
    world.pivot.set(W / 2, H / 2);
    world.position.set(W / 2, H / 2);
    const rows = rowsOf(W, H, 1, W / 2);
    const normal = new Container();
    const rg = new Graphics();
    room(rg, W, H, 1, W / 2, false);
    normal.addChild(rg, letters(rows, 1, false));
    const other = new Container();
    const og = new Graphics();
    room(og, W, H, 1, W / 2, true);
    other.addChild(og, letters(rows, 1, true));
    other.visible = false;
    const lights = new Graphics();
    world.addChild(normal, other, lights);
    const spores = new Graphics();
    spores.alpha = 0;
    const bikesL = new Container();
    const pulse = new Graphics();
    // behind the world while it flips over: the void between the two sides
    const under = new Graphics().rect(0, 0, W, H).fill(0x05070c);
    k.addChild(under, world, spores, bikesL, pulse);
    c.back.addChild(k);
    arrive(c, k, 0.2);
    hideDisc(c, 0.15);
    const halo = new Graphics();
    for (let i = 7; i >= 1; i--) halo.poly(ngon(W / 2, c.catY - 40, 46 * i, 56 * i, 18)).fill({ color: 0x9ab8ff, alpha: 0.03 });
    world.addChildAt(halo, 2);
    // state: which bulbs are lit, the flip, the freeze
    const on = new Set<string>();
    const mode = { v: c.short ? 2 : 0 }; // 0 spelling, 1 frantic, 2 steady, 3 frozen
    const flip = { other: !!c.short };
    const frozen = { v: false };
    const blast = { v: 0 };
    const bikes: Container[] = [];
    S.set(c, { frozen, blast, bikes, flip, pulse });
    if (c.short) {
      normal.visible = false;
      other.visible = true;
      spores.alpha = 1;
    }
    let clock = 0;
    let last = 0;
    const frame = (t: number) => {
      if (lights.destroyed) return;
      const dt = t - last;
      last = t;
      if (!frozen.v) clock += dt;
      const m = mode.v;
      drawLights(
        lights,
        rows,
        1,
        (ri, i) => {
          if (m === 0) return on.has(`${ri}:${i}`) ? 1 : 0.08;
          if (m === 1) return Math.sin(clock * 40 + ri * 3 + i * 1.7) > 0 ? 1 : 0.1;
          return 0.55 + 0.45 * Math.sin(clock * 3 + i + ri);
        },
        flip.other,
      );
      drawSpores(spores, W, H, clock, 70, 21, blast.v, ...onCat(c, 0.26, 0.32));
    };
    frame(0);
    // Reducir movimiento: no motion, but the state changes (a cut, a light, a flip) still land: redraw still frames
    every(c, c.reduce ? 4 : 30, (t) => frame(c.reduce ? 0 : t));
    if (c.short) return;

    // M · I · A · U, one bulb at a time
    SPELL.forEach(([ri, i], n) =>
      beat(c, 0.08 + n * 0.17, () => {
        on.clear();
        on.add(`${ri}:${i}`);
        sfx('gem', 1.2 + n * 0.15);
        if (c.reduce) frame(0);
      }),
    );
    // all of them flicker: ¡CORRE!
    beat(c, 0.78, () => {
      mode.v = 1;
      sfx('alarm', 1.4);
      sfx('glitch', 0.9);
    });
    held(c, c.fg, (() => {
      const t = txt('¡CORRE!', { fontFamily: F.brush, fontSize: 120, fill: 0x1a1410, stroke: { color: PAPER, width: 14, join: 'round' } });
      t.anchor.set(0.5);
      return t;
    })(), W - 420, 640, 0.8, { hold: 0.35, rot: -0.06 });
    // the screen flips over into the dark reflection
    beat(c, 1.0, () => {
      sfx('whoosh', 0.6);
      sfx('freeze', 0.7);
      c.shaker.add(0.15);
      const swap = () => {
        if (normal.destroyed) return;
        flip.other = true;
        mode.v = 2;
        normal.visible = false;
        other.visible = true;
        spores.alpha = 1;
      };
      if (c.reduce) swap();
      else {
        gsap.to(world.scale, { y: 0, duration: 0.12, ease: 'power2.in', onComplete: swap });
        gsap.to(world.scale, { y: 1, duration: 0.14, delay: 0.12, ease: 'power2.out' });
      }
      // a crack of red lightning in the window
      later(c, 0.2, () => {
        const b = new Graphics();
        const pts = [W / 2 - 120, 160, W / 2 - 60, 260, W / 2 - 110, 300, W / 2 + 10, 420, W / 2 - 30, 450, W / 2 + 60, 480];
        b.poly(strip(pts, 6)).fill(0xff3a4a).poly(strip(pts, 14)).fill({ color: 0xff3a4a, alpha: 0.3 });
        world.addChild(b);
        sfx('zap', 0.5);
        fadeKill(b, 0.2, 0.2);
      });
    });
    // three bikes with headlights tear across the floor
    for (let i = 0; i < 3; i++)
      beat(c, 1.25 + i * 0.12, () => {
        const b = bike(1 + i * 0.12);
        b.position.set(W + 200, H - 40 - i * 34);
        bikesL.addChild(b);
        bikes.push(b);
        sfx('whoosh', 1.3 + i * 0.1);
        if (c.reduce) b.x = W - 380 - i * 330;
        else gsap.to(b, { x: W - 380 - i * 330, duration: 0.5, ease: 'power2.out' });
      });
    // she raises her paw: a pink ring, ZUUUM… and everything stops in the air
    beat(c, 1.7, () => {
      sfx('charge', 0.7);
      const [px, py] = onCat(c, 0.26, 0.32);
      const ring = new Graphics();
      ring.poly(bandPts(0, 0, 70, 96, 0, Math.PI * 2, 30)).fill({ color: PINK, alpha: 0.75 });
      ring.position.set(px, py);
      c.fg.addChild(ring);
      if (!c.reduce) gsap.fromTo(ring.scale, { x: 0.3, y: 0.3 }, { x: 5, y: 5, duration: 0.5, ease: 'power2.out' });
      fadeKill(ring, 0.2, 0.3);
      word(c, px - 40, py - 170, '¡ZUUUM!', PINK, 90, 0.6);
      later(c, 0.12, () => {
        frozen.v = true;
        mode.v = 3;
        for (const b of bikes) {
          if (b.destroyed) continue;
          gsap.killTweensOf(b);
          if (!c.reduce) gsap.to(b, { y: b.y - 170, rotation: -0.25, duration: 0.25, ease: 'power2.out' });
          else b.y -= 170;
        }
        if (!pulse.destroyed) {
          pulse.clear().rect(0, 0, W, H).fill({ color: PINK, alpha: 0.12 });
        }
      });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.1);
    sfx('bigboom', 0.8);
    c.shaker.add(0.45);
    flashOf(c, PINK, 0.55, 0.35);
    if (st) {
      st.frozen.v = false;
      st.flip.other = true;
      if (!st.pulse.destroyed) st.pulse.clear();
      if (c.reduce) st.blast.v = 0.4;
      else gsap.fromTo(st.blast, { v: 0 }, { v: 1.4, duration: 1.1, ease: 'power2.out' });
      for (const b of st.bikes) {
        if (b.destroyed) continue;
        gsap.killTweensOf(b);
        if (!c.reduce) gsap.to(b, { x: b.x - 1400, y: b.y + 170, rotation: 0, duration: 0.7, ease: 'power2.in' });
      }
      const [px, py] = onCat(c, 0.26, 0.32);
      const ring = new Graphics().poly(bandPts(0, 0, 80, 120, 0, Math.PI * 2, 30)).fill({ color: PINK, alpha: 0.8 });
      ring.position.set(px, py);
      c.fg.addChild(ring);
      if (!c.reduce) gsap.fromTo(ring.scale, { x: 0.3, y: 0.3 }, { x: 9, y: 9, duration: 0.6, ease: 'power2.out' });
      fadeKill(ring, 0.25, 0.35);
    }
    burst(c, c.fg, () => waffle(1.1), 14, W / 2, c.catY - 60, 820, 1.4);
    fall(c, c.fg, () => waffle(0.9), { n: 10, over: 1.3, dur: 1.5, spin: 4 });
    cheer(c, '¡ALTO!', PINK, 190, 2.0);
    aside(c, '…¿me pasas un waffle?', 0xffffff, { delay: 0.6, dur: 2.2 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    // the room above, its dark reflection below (mirrored under the floor line)
    const kk = s * 1.05;
    const rows = rowsOf(w, h, kk, w / 2);
    const top = new Container();
    const rg = new Graphics();
    room(rg, w, h, kk, w / 2, false, w < 400);
    const lights = new Graphics();
    top.addChild(rg);
    if (w > 300) top.addChild(letters(rows, kk, false));
    top.addChild(lights);
    const bot = new Container();
    const og = new Graphics();
    room(og, w, h, kk, w / 2, true, w < 400);
    const lightsB = new Graphics();
    bot.addChild(og, lightsB);
    const split = h * 0.62;
    bot.scale.y = -1;
    bot.position.y = split * 2;
    const mT = new Graphics().rect(0, 0, w, split).fill(0xffffff);
    const mB = new Graphics().rect(0, split, w, h - split).fill(0xffffff);
    top.mask = mT;
    bot.mask = mB;
    const seam = new Graphics().rect(0, split - 3 * s, w, 6 * s).fill({ color: RED, alpha: 0.8 });
    const spores = new Graphics();
    k.addChild(top, bot, mT, mB, seam, spores);
    const draw = (t: number) => {
      const step = Math.floor(t / 0.45) % 6;
      drawLights(lights, rows, kk, (ri, i) => (step < 4 ? (SPELL[step][0] === ri && SPELL[step][1] === i ? 1 : 0.1) : 0.6 + 0.4 * Math.sin(t * 3 + i)), false);
      drawLights(lightsB, rows, kk, (_, i) => 0.5 + 0.5 * Math.sin(t * 2 + i), true);
      spores.clear();
      const r = rnd(5);
      const n = Math.round(30 * (w / m));
      for (let i = 0; i < n; i++) {
        const x = r() * w + Math.sin(t + i) * 10 * s;
        const y = split + ((((r() * (h - split)) - t * 20 * s) % (h - split)) + (h - split)) % (h - split);
        spores.poly(ngon(x, y, 3 * s + r() * 3 * s, 3 * s + r() * 3 * s, 5)).fill({ color: 0xc8d0e0, alpha: 0.6 });
      }
    };
    draw(live ? 0 : 1.0);
    if (live) liveLoop(k, (t) => draw(t));
    return k;
  },
};

