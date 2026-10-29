/**
 * El Michito del Barril: the courtyard universe (the classic Latin American TV sitcom set, evoked). A vecindad patio
 * built on a TV stage: pale walls with patches of painted brick, numbered doors in green, blue and red, the stairs to
 * the upper floor, the stone laundry sink, a clothesline, geraniums — and over it all the studio: a truss of lights and
 * a RISAS sign. The lights bang on (¡CLAC!), a ball bounces from door to door (¡TOING! ¡TOING!), the boom mic dips into
 * the shot by mistake, the RISAS sign lights up and the canned laughter rolls (JA JA JA), and the ball bonks his barrel.
 * Payoff: a giant torta de jamón comes down in a beam of light and drops into the barrel; APLAUSOS; ¡TORTA! (…de jamón)
 * No catchphrases of the show: only the set, the ball, the barrel and the torta.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, cover, every, fall, later, score, word } from './kit';
import { cardLoop, hideDisc, scanlines } from './kitA';
import { rng, stash } from './kitB';
import { TAU, beat, ell, floatWord, glowDisc, headline, pay, smooth } from './kitC';

const WALL = 0xf0d79a;
const WALL2 = 0xead0a0;
const BRICK = 0xb8573a;
const GREEN = 0x2e7d5b;
const INK = 0x2a1a10;
const DOORS: [number, number, string][] = [
  [0x2e7d5b, 0xf2c14e, '14'],
  [0x3a6aa8, 0xffffff, '71'],
  [0xc84a3a, 0xffffff, '8'],
];

/** the patio's back wall: plaster with brick patches, a green dado, the cement floor (spans w; scaled by u) */
function patio(w: number, h: number, u: number, floorY: number) {
  const g = new Graphics();
  g.rect(0, 0, w, floorY).fill(WALL);
  for (let x = 0; x < w; x += 300 * u) g.rect(x + 150 * u, 0, 150 * u, floorY).fill({ color: WALL2, alpha: 0.6 });
  // patches where the plaster fell off: painted bricks
  const r = rng(14);
  const patches = Math.max(3, Math.round(w / (420 * u)));
  for (let i = 0; i < patches; i++) {
    const px = ((i + 0.3 + r() * 0.4) * w) / patches;
    const py = (150 + r() * 380) * u;
    const pw = (90 + r() * 70) * u;
    const ph = (50 + r() * 40) * u;
    g.poly(smooth([px, py, px + pw, py - 10 * u, px + pw + 10 * u, py + ph, px - 6 * u, py + ph + 8 * u], 3)).fill(0xd8b68a);
    for (let by = py + 4 * u; by < py + ph; by += 14 * u) for (let bx = px + ((by / (14 * u)) % 2 ? 0 : 12 * u); bx < px + pw - 20 * u; bx += 26 * u) g.rect(bx, by, 22 * u, 10 * u).fill(BRICK);
  }
  // cracks
  for (let i = 0; i < patches; i++) {
    const x = r() * w;
    const y = (100 + r() * 500) * u;
    g.poly([x, y, x + 14 * u, y + 30 * u, x + 6 * u, y + 52 * u, x + 22 * u, y + 80 * u], false).stroke({ width: 2 * u, color: 0x8a6a40, alpha: 0.6 });
  }
  g.rect(0, floorY - 120 * u, w, 120 * u).fill(0x6fae7a).rect(0, floorY - 124 * u, w, 6 * u).fill(GREEN);
  g.rect(0, floorY, w, h - floorY).fill(0xc9baa2);
  for (let x = 0; x < w; x += 160 * u) g.moveTo(x, floorY).lineTo(x + (x - w / 2) * 0.4, h).stroke({ width: 2 * u, color: 0xa8987e });
  g.rect(0, floorY + (h - floorY) * 0.45, w, 2 * u).fill(0xa8987e);
  return g;
}

/** a numbered door with its window and a pot of geraniums (origin at its bottom center) */
function door(g: Graphics, x: number, y: number, s: number, color: number, numColor: number, num: string, labels: Text[]) {
  g.rect(x - 70 * s, y - 250 * s, 140 * s, 250 * s).fill(color).stroke({ width: 5 * s, color: INK });
  g.rect(x - 52 * s, y - 230 * s, 104 * s, 90 * s).stroke({ width: 4 * s, color: INK, alpha: 0.5 }).rect(x - 52 * s, y - 120 * s, 104 * s, 100 * s).stroke({ width: 4 * s, color: INK, alpha: 0.5 });
  g.poly(ell(x + 48 * s, y - 120 * s, 7 * s, 7 * s, 8)).fill(0xd8b44a);
  g.rect(x - 22 * s, y - 286 * s, 44 * s, 30 * s).fill(0xfff6e0).stroke({ width: 3 * s, color: INK });
  const t = txt(num, { fontFamily: F.poster, fontSize: 26 * s, fill: color === 0x2e7d5b ? 0x2e7d5b : color });
  t.anchor.set(0.5);
  t.position.set(x, y - 271 * s);
  labels.push(t);
  void numColor;
  // a window with curtains beside it
  const wx = x + 150 * s;
  g.rect(wx - 55 * s, y - 230 * s, 110 * s, 110 * s).fill(0x9ad0e8).stroke({ width: 6 * s, color: INK });
  g.poly([wx - 52 * s, y - 228 * s, wx - 10 * s, y - 228 * s, wx - 34 * s, y - 124 * s, wx - 52 * s, y - 124 * s]).fill(0xf2a0a0).poly([wx + 52 * s, y - 228 * s, wx + 10 * s, y - 228 * s, wx + 34 * s, y - 124 * s, wx + 52 * s, y - 124 * s]).fill(0xf2a0a0);
  g.rect(wx - 62 * s, y - 120 * s, 124 * s, 10 * s).fill(0xd8c8a8);
  // geraniums in a can
  g.rect(wx - 22 * s, y - 40 * s, 44 * s, 40 * s).fill(0xc86a3a).stroke({ width: 3 * s, color: INK });
  for (let i = 0; i < 5; i++) g.poly(ell(wx + (i - 2) * 12 * s, y - (54 + (i % 2) * 12) * s, 10 * s, 9 * s, 8)).fill(i % 2 ? 0xe83a4a : 0x4a9a3a);
}

/** the stairs up to the upper floor, with an iron railing (from bottom-left (x0,y0) to top-right (x1,y1)) */
function stairs(g: Graphics, x0: number, y0: number, x1: number, y1: number, s: number) {
  const n = 9;
  const dx = (x1 - x0) / n;
  const dy = (y0 - y1) / n;
  const pts: number[] = [x0, y0];
  for (let i = 0; i < n; i++) pts.push(x0 + i * dx, y0 - (i + 1) * dy, x0 + (i + 1) * dx, y0 - (i + 1) * dy);
  pts.push(x1 + 40 * s, y1, x1 + 40 * s, y0);
  g.poly(pts).fill(0xd8c8a8).stroke({ width: 4 * s, color: INK, join: 'round' });
  for (let i = 0; i <= n; i++) g.rect(x0 + i * dx - 3 * s, y0 - i * dy - 90 * s, 6 * s, 90 * s).fill(0x3a3a3a);
  g.moveTo(x0, y0 - 90 * s).lineTo(x1, y1 - 90 * s).lineTo(x1 + 400 * s, y1 - 90 * s).stroke({ width: 8 * s, color: 0x3a3a3a });
  g.rect(x1, y1, 420 * s, 16 * s).fill(0xb8a888).stroke({ width: 3 * s, color: INK });
  for (let x = x1; x < x1 + 400 * s; x += 26 * s) g.rect(x, y1 - 90 * s, 5 * s, 90 * s).fill(0x3a3a3a);
}

/** the stone laundry sink with its tap (origin at its base center) */
function lavadero(g: Graphics, x: number, y: number, s: number) {
  g.rect(x - 110 * s, y - 120 * s, 220 * s, 120 * s).fill(0xb8b0a0).stroke({ width: 4 * s, color: INK });
  g.poly([x - 120 * s, y - 120 * s, x + 120 * s, y - 120 * s, x + 110 * s, y - 150 * s, x - 110 * s, y - 150 * s]).fill(0xcfc8b8).stroke({ width: 4 * s, color: INK });
  for (let i = 0; i < 6; i++) g.rect(x - 90 * s + i * 30 * s, y - 146 * s, 14 * s, 22 * s).fill({ color: 0x8a8070, alpha: 0.6 });
  g.rect(x + 60 * s, y - 230 * s, 10 * s, 84 * s).fill(0x7a7a7a).rect(x + 30 * s, y - 232 * s, 40 * s, 10 * s).fill(0x7a7a7a);
  g.rect(x - 20 * s, y - 60 * s, 40 * s, 50 * s).fill({ color: 0x5a9ad0, alpha: 0.7 });
}

/** the studio over the set: a truss with lamp cans (their glows come on) and the RISAS / APLAUSOS signs */
function studio(w: number, u: number) {
  const k = new Container();
  const g = new Graphics().rect(0, 0, w, 54 * u).fill(0x141416);
  for (let x = 0; x < w; x += 30 * u) g.moveTo(x, 8 * u).lineTo(x + 15 * u, 30 * u).lineTo(x + 30 * u, 8 * u).stroke({ width: 2.5 * u, color: 0x3a3a40 });
  g.rect(0, 6 * u, w, 4 * u).fill(0x3a3a40).rect(0, 30 * u, w, 4 * u).fill(0x3a3a40);
  const glows: Graphics[] = [];
  const n = Math.max(4, Math.round(w / (260 * u)));
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) * w) / n;
    g.rect(x - 3 * u, 30 * u, 6 * u, 24 * u).fill(0x2a2a2e);
    g.poly([x - 26 * u, 52 * u, x + 26 * u, 52 * u, x + 22 * u, 96 * u, x - 22 * u, 96 * u]).fill(0x222226).stroke({ width: 2 * u, color: 0x0a0a0a });
    const gl = new Graphics();
    gl.poly(ell(x, 96 * u, 22 * u, 7 * u, 14)).fill(0xfff6c8);
    gl.poly([x - 22 * u, 96 * u, x + 22 * u, 96 * u, x + 160 * u, 700 * u, x - 160 * u, 700 * u]).fill({ color: 0xfff6c8, alpha: 0.07 });
    gl.blendMode = 'add';
    glows.push(gl);
  }
  k.addChild(g, ...glows);
  return { k, glows };
}

/** a lit studio sign (origin at its center); lit(on) */
function studioSign(text: string, u: number) {
  const k = new Container();
  const t = txt(text, { fontFamily: F.poster, fontSize: 40 * u, fill: 0x4a1a1a, letterSpacing: 4 * u });
  t.anchor.set(0.5);
  const bw = t.width + 40 * u;
  const bh = t.height + 16 * u;
  const box = new Graphics().roundRect(-bw / 2, -bh / 2, bw, bh, 8 * u).fill(0x1a0a0a).stroke({ width: 4 * u, color: 0x5a5a60 });
  const glow = new Graphics().roundRect(-bw / 2 - 12 * u, -bh / 2 - 12 * u, bw + 24 * u, bh + 24 * u, 14 * u).fill({ color: 0xff3a3a, alpha: 0.3 });
  glow.blendMode = 'add';
  glow.alpha = 0;
  k.addChild(glow, box, t);
  const lit = (on: boolean) => {
    if (t.destroyed) return;
    t.style.fill = on ? 0xff4a3a : 0x4a1a1a;
    glow.alpha = on ? 1 : 0;
  };
  return { k, lit };
}

/** the clothesline across the top with the laundry (origin at the left post) */
function laundry(w: number, u: number) {
  const k = new Container();
  const g = new Graphics().moveTo(0, 0).quadraticCurveTo(w / 2, 40 * u, w, 0).stroke({ width: 2.5 * u, color: 0x5a5a5a });
  k.addChild(g);
  const items: Graphics[] = [];
  const cols = [0xf2c14e, 0x3a6aa8, 0xffffff, 0xe85a4a, 0x6aaa5a, 0xf2a0c0];
  const n = Math.max(4, Math.round(w / (160 * u)));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = t * w;
    const y = 4 * t * (1 - t) * 20 * u;
    const it = new Graphics();
    const col = cols[i % cols.length];
    if (i % 3 === 0) it.poly([-36, 0, 36, 0, 44, 20, 28, 26, 26, 80, -26, 80, -28, 26, -44, 20].map((v) => v * u)).fill(col).stroke({ width: 2 * u, color: INK });
    else if (i % 3 === 1) it.poly([-10, 0, 10, 0, 10, 46, 24, 56, 20, 66, -4, 56, -10, 50].map((v) => v * u)).fill(col).stroke({ width: 2 * u, color: INK });
    else it.poly([-30, 0, 30, 0, 26, 70, 4, 70, 0, 30, -4, 70, -26, 70].map((v) => v * u)).fill(col).stroke({ width: 2 * u, color: INK });
    it.position.set(x, y);
    k.addChild(it);
    items.push(it);
  }
  return { k, items };
}

/** a classic leather ball: white with black patches */
function ball(r: number) {
  const g = new Graphics().poly(ell(0, 0, r, r, 22)).fill(0xfaf8f0).stroke({ width: r * 0.12, color: INK });
  g.poly(ell(0, 0, r * 0.36, r * 0.36, 5, -Math.PI / 2)).fill(INK);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * TAU;
    g.poly(ell(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.22, r * 0.22, 5, a)).fill(INK);
  }
  return g;
}

/** a torta de jamón seen from the side (origin at its center, ~350 wide; scale its container) */
function torta() {
  const s = 1;
  const g = new Graphics();
  g.poly(smooth([-170, 20, 170, 20, 160, 60, -160, 60], 3)).fill(0xd89a4a).stroke({ width: 5 * s, color: INK });
  g.poly(smooth([-176, 18, -120, 6, -60, 22, 0, 6, 60, 22, 120, 6, 176, 18, 170, 34, -170, 34], 2).map((v) => v * s)).fill(0x6ab83a).stroke({ width: 3 * s, color: 0x2a5a1a });
  g.poly([-170, 4, 170, 4, 166, 22, -166, 22].map((v) => v * s)).fill(0xf29a9a).stroke({ width: 3 * s, color: 0x8a3a3a });
  for (let i = 0; i < 4; i++) g.poly(ell((-120 + i * 80) * s, -8 * s, 34 * s, 10 * s, 12)).fill(0xe83a3a).stroke({ width: 2 * s, color: 0x8a1a1a });
  g.poly([-160, -6, 160, -6, 150, 6, 110, 18, 80, 6, -40, 6, -70, 22, -100, 6, -160, 6].map((v) => v * s)).fill(0xf2d24a);
  g.poly(ell(60 * s, -12 * s, 40 * s, 9 * s, 12)).fill(0x8ab84a);
  const top = smooth([-176, -10, -150, -70, -60, -100, 60, -100, 150, -70, 176, -10], 5, false);
  g.poly([...top.map((v) => v * s), 176 * s, -6 * s, -176 * s, -6 * s]).fill(0xe0a050).stroke({ width: 5 * s, color: INK, join: 'round' });
  g.poly(smooth([-90, -84, -40, -96, 10, -86], 3, false).map((v) => v * s), false).stroke({ width: 5 * s, color: 0xa86a2a });
  g.poly(smooth([10, -92, 60, -98, 110, -80], 3, false).map((v) => v * s), false).stroke({ width: 5 * s, color: 0xa86a2a });
  g.poly(ell(-60 * s, -78 * s, 40 * s, 10 * s, 12)).fill({ color: 0xffffff, alpha: 0.25 });
  return g;
}

interface St {
  dimmer: Graphics;
  risas: ReturnType<typeof studioSign>;
  aplausos: ReturnType<typeof studioSign>;
  lights: ReturnType<typeof studio>;
}
const S = stash<St>();
const FLOOR = 820;
const DOOR_X = [300, 700, 1300];
const BARREL: [number, number] = [W / 2 + 120, 690];

export const barril: Signature = {
  dark: false,
  frame: 0xe0602f,
  tag: 'UNIVERSO DE LA VECINDAD',
  open(c: SigCtx) {
    const k = new Container();
    const wall = patio(W, H, 1, FLOOR);
    const props = new Graphics();
    const labels: Text[] = [];
    DOORS.forEach(([col, nc, num], i) => door(props, DOOR_X[i], FLOOR, 1, col, nc, num, labels));
    stairs(props, 1500, FLOOR, 1720, 470, 1);
    lavadero(props, 120, FLOOR + 10, 0.9);
    const doorK = DOOR_X.map(() => new Container());
    const line = laundry(W * 0.62, 1);
    line.k.position.set(W * 0.05, 150);
    const lights = studio(W, 1);
    const risas = studioSign('RISAS', 1);
    risas.k.position.set(W / 2 - 300, 100);
    const aplausos = studioSign('APLAUSOS', 1);
    aplausos.k.position.set(W / 2 + 300, 100);
    const scan = scanlines(W, H, 4, 0.05);
    const dimmer = cover(0x000000, c.short || c.reduce ? 0 : 0.75);
    k.addChild(wall, props, ...labels, ...doorK, line.k, lights.k, risas.k, aplausos.k, scan, dimmer);
    c.back.addChild(k);
    hideDisc(c);
    const halo = glowDisc(360, 0xfff6d8, 0.5, 8, 28);
    halo.position.set(W / 2, c.catY - 20);
    c.behind.addChild(halo);
    const st: St = { dimmer, risas, aplausos, lights };
    S.set(c, st);
    lights.glows.forEach((gl) => (gl.alpha = c.short || c.reduce ? 1 : 0));
    if (!c.reduce)
      every(c, 30, (t) => {
        line.items.forEach((it, i) => !it.destroyed && (it.rotation = Math.sin(t * 2 + i) * 0.06));
      });
    if (c.short) return;

    score(c, [
      [0.02, 'hit', 0.5],
      [0.16, 'hit', 0.55],
      [0.3, 'hit', 0.6],
    ]);
    // ¡CLAC! ¡CLAC! ¡CLAC!: the studio lights bang on, bank by bank
    [0.02, 0.16, 0.3].forEach((t, i) =>
      beat(c, t, () => {
        const n = lights.glows.length;
        lights.glows.forEach((gl, j) => {
          if (Math.floor((j * 3) / n) === i && !gl.destroyed) gl.alpha = 1;
        });
        if (!dimmer.destroyed) dimmer.alpha = [0.45, 0.2, 0][i];
      }),
    );
    beat(c, 0.05, () => floatWord(c, c.back, 380, 140, '¡CLAC!', { fontFamily: F.comic, fontSize: 40, fill: 0xfff6c8, stroke: { color: INK, width: 6 } }, 20, 0.4));
    // the ball bounces from door to door and bonks the barrel
    const b = ball(34);
    b.visible = false;
    c.back.addChild(b);
    const hops: [number, number, number, number][] = [
      // [x, y, door index or -1, time]
      [W + 80, 260, -1, 0.35],
      [DOOR_X[2], FLOOR - 140, 2, 0.6],
      [1000, FLOOR - 10, -1, 0.8],
      [DOOR_X[1], FLOOR - 160, 1, 1.0],
      [500, FLOOR - 10, -1, 1.17],
      [DOOR_X[0], FLOOR - 130, 0, 1.32],
      [620, FLOOR + 40, -1, 1.55],
      [BARREL[0], BARREL[1], -1, 1.85],
    ];
    if (!c.reduce) {
      beat(c, 0.35, () => {
        b.visible = true;
        b.position.set(hops[0][0], hops[0][1]);
      });
      for (let i = 1; i < hops.length; i++) {
        const [x, y, di, t] = hops[i];
        const t0 = hops[i - 1][3];
        beat(c, t0, () => {
          if (b.destroyed) return;
          const x0 = b.x;
          const y0 = b.y;
          const p = { k: 0 };
          const arc = Math.max(80, Math.abs(x - x0) * 0.25);
          gsap.to(p, {
            k: 1,
            duration: t - t0,
            ease: 'none',
            onUpdate: () => {
              if (b.destroyed) return;
              b.position.set(x0 + (x - x0) * p.k, y0 + (y - y0) * p.k - Math.sin(Math.PI * p.k) * arc);
              b.rotation += 0.25;
            },
          });
        });
        beat(c, t, () => {
          sfx('pop', 0.6 + i * 0.05);
          if (di >= 0) {
            sfx('hit', 0.8);
            word(c, x + 60, y - 120, '¡TOING!', 0xffd23f, 56, 0.6);
            c.shaker.add(0.08);
          }
        });
      }
      beat(c, 1.85, () => {
        sfx('boom', 0.7);
        sfx('pop', 0.5);
        word(c, BARREL[0] + 140, BARREL[1] - 140, '¡TOING!', 0xffd23f, 80, 0.8);
        c.shaker.add(0.25);
        if (!b.destroyed) gsap.to(b, { x: W + 120, y: FLOOR + 120, rotation: b.rotation + 12, duration: 0.6, ease: 'power1.in', onComplete: () => destroyTree(b) });
      });
    }
    // the boom mic dips into the shot by mistake
    beat(c, 0.95, () => {
      if (c.reduce) return;
      const mic = new Graphics().rect(-4, -600, 8, 560).fill(0x2a2a2e).roundRect(-40, -50, 80, 60, 26).fill(0x4a4a50).stroke({ width: 3, color: 0x111111 });
      for (let i = -30; i <= 30; i += 10) mic.moveTo(i, -44).lineTo(i, 6).stroke({ width: 2, color: 0x6a6a70 });
      mic.position.set(W / 2 - 520, -20);
      mic.rotation = 0.18;
      c.back.addChild(mic);
      gsap.to(mic, { y: 230, duration: 0.25, ease: 'power2.out' });
      gsap.to(mic, { y: -40, duration: 0.2, delay: 0.42, ease: 'power2.in', onComplete: () => destroyTree(mic) });
    });
    // RISAS: the sign lights and the canned laughter rolls
    beat(c, 1.25, () => {
      risas.lit(true);
      const r = rng(5);
      for (let i = 0; i < 6; i++)
        later(c, i * 0.09, () => {
          sfx('tick', 1.3 + r() * 0.8);
          if (i % 2 === 0) floatWord(c, c.back, 220 + r() * (W - 440), H - 60 - r() * 60, 'JA JA JA', { fontFamily: F.comic, fontSize: 42 + r() * 14, fill: 0xffffff, stroke: { color: INK, width: 6 } }, 70, 0.9);
        });
      later(c, 0.8, () => risas.lit(false));
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.1);
    later(c, 1.2, () => sfx('nyam', 0.9));
    later(c, 1.22, () => sfx('pop', 0.6));
    c.shaker.add(0.2);
    if (st) {
      if (!st.dimmer.destroyed) st.dimmer.alpha = 0;
      st.lights.glows.forEach((gl) => !gl.destroyed && (gl.alpha = 1));
      st.aplausos.lit(true);
      st.risas.lit(true);
      later(c, 2.2, () => {
        st.aplausos.lit(false);
        st.risas.lit(false);
      });
      for (let i = 0; i < 14; i++) later(c, 0.2 + i * 0.07, () => sfx('tick', 1.8 + Math.random() * 0.6));
    }
    // a giant torta comes down in a beam of light and drops into the barrel
    const k = new Container();
    const rays = new Graphics();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      rays.poly([0, 0, Math.cos(a - 0.09) * 420, Math.sin(a - 0.09) * 420, Math.cos(a + 0.09) * 420, Math.sin(a + 0.09) * 420]).fill({ color: 0xfff2b0, alpha: 0.45 });
    }
    rays.blendMode = 'add';
    const tt = torta();
    k.addChild(rays, tt);
    // it hovers beside him (clear of the plate, the stamp and the lore box), then drops into the barrel
    const HOVER: [number, number] = [W / 2 + 330, 470];
    k.position.set(HOVER[0], -260);
    k.scale.set(0.8);
    c.fg.addChild(k);
    if (c.reduce) {
      k.position.set(HOVER[0], HOVER[1]);
      gsap.to(k, { alpha: 0, delay: 1.2, duration: 0.3, onComplete: () => destroyTree(k) });
    } else {
      gsap.to(rays, { rotation: 1.2, duration: 1.6, ease: 'none' });
      gsap.to(k, { y: HOVER[1], duration: 0.5, ease: 'back.out(1.4)' });
      gsap.to(k, { x: BARREL[0] - 60, y: BARREL[1] - 60, duration: 0.22, delay: 1.0, ease: 'power2.in' });
      gsap.to(k.scale, { x: 0.15, y: 0.15, duration: 0.22, delay: 1.0, ease: 'power2.in' });
      gsap.to(k, { alpha: 0, duration: 0.1, delay: 1.18, onComplete: () => destroyTree(k) });
      later(c, 1.2, () => burst(c, c.fg, () => new Graphics().poly(ell(0, 0, 7, 5, 8)).fill(0xe0a050), 10, BARREL[0] - 60, BARREL[1] - 60, 200, 0.6));
    }
    // confetti from the studio
    fall(c, c.fg, (i) => new Graphics().rect(-9, -5, 18, 10).fill([0xffd23f, 0x2e7d5b, 0xe0602f, 0x3a6aa8, 0xffffff][i % 5]), { n: 36, over: 1.2, dur: 1.8, spin: 8 });
    headline(c, '¡TORTA!', { fontFamily: F.comic, fontSize: 190, fill: 0xffd23f, letterSpacing: 6, stroke: { color: C.ink, width: 18, join: 'round' } }, {
      aside: '(…de jamón)',
      asideStyle: { fill: 0xffffff, stroke: { color: INK, width: 8, join: 'round' } },
      dur: 2.6,
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const s = 0.34 * u;
    const floorY = h * 0.8;
    const wall = patio(w, h, s, floorY);
    const props = new Graphics();
    const labels: Text[] = [];
    const xs = [w / 2 - 150 * u, w / 2 + 110 * u];
    door(props, xs[0], floorY, s, DOORS[0][0], DOORS[0][1], DOORS[0][2], labels);
    door(props, xs[1], floorY, s, DOORS[2][0], DOORS[2][1], DOORS[2][2], labels);
    for (let x = xs[1] + 330 * s; x < w; x += 900 * s) door(props, x, floorY, s, DOORS[1][0], DOORS[1][1], DOORS[1][2], labels);
    for (let x = xs[0] - 600 * s; x > -100 * s; x -= 900 * s) door(props, x, floorY, s, DOORS[1][0], DOORS[1][1], DOORS[1][2], labels);
    const line = laundry(w * 0.9, s);
    line.k.position.set(w * 0.05, 52 * u);
    const lights = studio(w, s);
    const risas = studioSign('RISAS', s);
    risas.k.position.set(w / 2, 34 * u);
    const halo = glowDisc(Math.min(w, h) * 0.4, 0xfff6d8, 0.45, 6, 28);
    halo.position.set(w / 2, h * 0.52);
    const b = ball(10 * u);
    b.position.set(w / 2 - 100 * u, floorY + 20 * u);
    k.addChild(wall, props, ...labels, line.k, lights.k, risas.k, halo, b);
    risas.lit(true);
    if (live)
      cardLoop(k, 30, (t) => {
        line.items.forEach((it, i) => (it.rotation = Math.sin(t * 2 + i) * 0.07));
        risas.lit(t % 2.4 < 1.2);
        const p = (t * 0.8) % 1;
        b.position.set(w / 2 - 140 * u + p * 80 * u, floorY + 20 * u - Math.abs(Math.sin(p * Math.PI * 3)) * 40 * u * (1 - p * 0.5));
        b.rotation = t * 4;
      });
    return k;
  },
};
