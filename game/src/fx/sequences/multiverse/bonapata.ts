/**
 * Napoleón Bonapata: the empire's universe (the French emperor, public domain — as a cat, painted the way the grand
 * heroic canvases of his day painted him). An oil-painted battlefield under golden storm clouds, brush strokes you
 * can see; drums roll; on a rocky crag a white horse rears against the sky. Then the camera tilts down, the cannon
 * smoke drifts apart… and our hero, it turns out, is standing on a cardboard box (a little hand-lettered arrow points
 * it out). The flag rises behind him: three stripes and a golden paw.
 * Payoff: light breaks through the clouds, laurel leaves fly, a little flag plants itself on the armchair in the
 * middle of the field: ¡CONQUISTADO! — …el sillón ya es territorio imperial.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, later, score } from './kit';
import { pawPrint, smooth } from './kitC';
import {
  C,
  F,
  at,
  band,
  cardLoop,
  comic,
  dab,
  dabField,
  flat,
  glowDisc,
  hideDisc,
  ngon,
  onCat,
  park,
  payline,
  pre,
  rnd,
  stash,
  streak,
  take,
  vgrad,
  wrap,
} from './kitJ';

const SKY = [0x4a5a7a, 0x8a7a6a, 0xd8a85a, 0xf6d48a, 0xfff0c8];
const CLOUD = [0xffe9b0, 0xf6d48a, 0xe8b860, 0xfff6dc, 0xd8b078];
const BLUE = 0x1f3a8a;
const RED = 0xc8102e;
const WHITE = 0xf6f2e8;
const GOLD = 0xe6c34a;
const INK = C.ink;

/** the box under his boots in the painting (center of its front), for the little arrow */
const BOX: [number, number] = [0.44, 0.84];

/** the rearing white horse (origin at its hind hooves, facing +x; ~s tall): one smooth body, far legs in shade, dabs */
function horse(s: number) {
  const g = new Graphics();
  const k = s / 690;
  const P = (pts: number[]) => smooth(pts.map((v) => v * k), 3);
  const shade = 0xc8c0b0;
  const body = 0xf4efe4;
  const line = 0x6a6050;
  const lw = Math.max(1.5, 4 * k);
  // the tail streaming back, the far hind leg and the far front leg (in shade)
  g.poly(dab(-180 * k, -320 * k, -320 * k, -300 * k, -380 * k, -150 * k, 30 * k)).fill(0xe0d8c8);
  g.poly(dab(-185 * k, -300 * k, -280 * k, -230 * k, -300 * k, -90 * k, 20 * k)).fill(shade);
  g.poly(P([-70, -240, -40, -250, -40, -150, -30, -60, -20, 0, -60, 0, -66, -60, -76, -150])).fill(shade).stroke({ width: lw, color: line });
  g.poly(P([60, -400, 110, -400, 175, -400, 195, -380, 190, -330, 170, -330, 172, -370, 120, -375, 70, -370])).fill(shade).stroke({ width: lw, color: line });
  // the horse: hind leg, rump, back, neck, head, chest, the near front leg raised, belly
  const outline = [
    -160, 0, -150, -80, -175, -170, -192, -262, -186, -332, -150, -364, -80, -412, -10, -470, 22, -540, 60, -610, 84, -650, 94, -692, 112, -656, 150, -640,
    196, -610, 216, -584, 200, -564, 160, -568, 130, -558, 110, -500, 92, -442, 78, -412, 112, -422, 150, -432, 164, -410, 152, -362, 154, -330, 130, -330,
    134, -372, 124, -394, 70, -376, 10, -330, -60, -282, -90, -232, -96, -150, -102, -60, -90, 0,
  ];
  g.poly(P(outline)).fill(body).stroke({ width: lw, color: line, join: 'round' });
  // shading: belly, neck underside, hindquarter
  g.poly(dab(-170 * k, -280 * k, -60 * k, -280 * k, 60 * k, -380 * k, 22 * k)).fill({ color: shade, alpha: 0.7 });
  g.poly(dab(100 * k, -440 * k, 120 * k, -500 * k, 130 * k, -560 * k, 14 * k)).fill({ color: shade, alpha: 0.6 });
  g.poly(ngon(-120 * k, -300 * k, 50 * k, 70 * k, 12, 0.4)).fill({ color: shade, alpha: 0.35 });
  // hooves, eye, nostril
  g.poly(P([-160, 0, -90, 0, -94, -22, -156, -22])).fill(0x5a4a3a);
  g.poly(P([130, -330, 154, -330, 153, -350, 132, -350])).fill(0x5a4a3a);
  g.poly(ngon(150 * k, -616 * k, 7 * k, 6 * k, 8)).fill(INK);
  g.poly(ngon(205 * k, -584 * k, 4 * k, 3 * k, 6)).fill(0x6a6050);
  // the mane flying back in the wind
  for (let i = 0; i < 7; i++) {
    const q = i / 6;
    const x0 = (84 - q * 90) * k;
    const y0 = (-650 + q * 180) * k;
    g.poly(dab(x0, y0, x0 - 70 * k, y0 - 26 * k, x0 - 150 * k, y0 + (14 - i * 4) * k, 15 * k)).fill(i % 2 ? 0xe8e0d0 : 0xd8d0c0);
  }
  return g;
}

/** the armchair in the middle of the field (red velvet, gilded frame; origin at its feet) */
function armchair(g: Graphics, x: number, y: number, s: number) {
  g.rect(x - s * 0.5, y - s * 0.08, s * 0.08, s * 0.08).fill(0x8a6a2a).rect(x + s * 0.42, y - s * 0.08, s * 0.08, s * 0.08).fill(0x8a6a2a);
  g.poly([x - s * 0.42, y - s * 1.0, x + s * 0.42, y - s * 1.0, x + s * 0.38, y - s * 0.4, x - s * 0.38, y - s * 0.4]).fill(0xa01828).stroke({ width: Math.max(2, s * 0.03), color: GOLD });
  g.poly([x - s * 0.56, y - s * 0.4, x + s * 0.56, y - s * 0.4, x + s * 0.52, y - s * 0.08, x - s * 0.52, y - s * 0.08]).fill(0xb82030).stroke({ width: Math.max(2, s * 0.03), color: GOLD });
  for (const side of [-1, 1]) g.poly([x + side * s * 0.4, y - s * 0.62, x + side * s * 0.58, y - s * 0.62, x + side * s * 0.58, y - s * 0.3, x + side * s * 0.4, y - s * 0.3]).fill(0x8a1420).stroke({ width: Math.max(2, s * 0.03), color: GOLD });
  g.poly(ngon(x, y - s * 0.72, s * 0.08, s * 0.08, 8)).fill(GOLD);
}

/** a waving flag on a pole (blue, white, red; a golden paw): pole at x, top y, flag fw×fh, phase t */
function drawFlag(g: Graphics, x: number, y: number, poleH: number, fw: number, fh: number, t: number, wind = 1) {
  g.clear();
  g.poly(streak(x, y + poleH, x, y - 10, fh * 0.035, fh * 0.03)).fill(0x3a2a1a);
  g.poly(ngon(x, y - 14, fh * 0.06, fh * 0.06, 8)).fill(GOLD);
  const cols = [BLUE, WHITE, RED];
  const N = 6;
  const wave = (u: number, v: number): [number, number] => [x + u * fw, y + v * fh + Math.sin(u * 5 - t * 6) * fh * 0.08 * u * wind + u * fh * 0.06];
  for (let s = 0; s < 3; s++) {
    const pts: number[] = [];
    for (let i = 0; i <= N; i++) pts.push(...wave((s + i / N) / 3, 0));
    for (let i = N; i >= 0; i--) pts.push(...wave((s + i / N) / 3, 1));
    g.poly(pts).fill(cols[s]);
  }
  const [px, py] = wave(0.5, 0.5);
  pawPrint(g, px, py, fh / 50, Math.sin(t * 6) * 0.1, GOLD, 1);
}

/**
 * the oil-painted battlefield (w×h; `u` = h / 1080): golden storm sky in brush dabs, distant hills with tents and
 * smoke, the rocky crag (the horse stands on it at hx, hy), the field, the armchair. Returns its parts.
 */
function battlefield(w: number, h: number, seed: number) {
  const u = h / 1080;
  const cx = w / 2;
  const k = new Container();
  const sky = vgrad(new Graphics(), 0, -h * 0.3, w, h * 1.0, SKY, 20);
  const clouds = new Graphics();
  dabField(clouds, -40 * u, -h * 0.3, w + 80 * u, h * 0.22, [0x7a7a8a, 0x9a8a7a, 0x6a6a7a], Math.round((w / h) * 60), seed + 9, 180 * u, 30 * u, 0.35, -0.1);
  dabField(clouds, -40 * u, -h * 0.12, w + 80 * u, h * 0.4, CLOUD, Math.round((w / h) * 200), seed, 150 * u, 24 * u, 0.4, -0.12);
  dabField(clouds, -40 * u, h * 0.15, w + 80 * u, h * 0.3, [0xfff0c8, 0xf6d48a, 0xffffff], Math.round((w / h) * 90), seed + 1, 120 * u, 18 * u, 0.45, -0.05);
  const hz = h * 0.66;
  const land = new Graphics();
  land.poly([-20, hz, w * 0.15, hz - 50 * u, w * 0.4, hz - 20 * u, w * 0.65, hz - 60 * u, w * 0.85, hz - 30 * u, w + 20, hz - 40 * u, w + 20, h + 40, -20, h + 40]).fill(0x6a7a4a);
  dabField(land, -20 * u, hz - 40 * u, w + 40 * u, h * 0.4, [0x7a8a52, 0x5a6a3a, 0x9a8a52, 0x8a7a4a, 0xa89a62], Math.round((w / h) * 160), seed + 2, 110 * u, 14 * u, 0.6, 0.02);
  // distant tents and smoke plumes
  const r = rnd(seed + 3);
  for (let i = 0; i < Math.round((w / h) * 7); i++) {
    const x = r() * w;
    const y = hz - 30 * u + r() * 30 * u;
    const s = (14 + r() * 10) * u;
    land.poly([x - s, y, x, y - s * 1.1, x + s, y]).fill(0xe8e0d0);
  }
  const smoke = new Graphics();
  for (let i = 0; i < Math.round((w / h) * 4); i++) {
    const x = (0.1 + r() * 0.8) * w;
    for (let j = 0; j < 6; j++) smoke.poly(ngon(x + j * 14 * u, hz - 40 * u - j * 40 * u, (30 + j * 12) * u, (22 + j * 8) * u, 10)).fill({ color: 0xc8c0b8, alpha: 0.32 - j * 0.04 });
  }
  // the rocky crag on the left (the horse rears on its top)
  const crag = new Graphics();
  const hx = cx - h * 0.5;
  const hy = h * 0.6;
  crag.poly(smooth([hx - 380 * u, h + 40, hx - 330 * u, hy + 70 * u, hx - 240 * u, hy + 10 * u, hx - 120 * u, hy - 14 * u, hx + 10 * u, hy - 4 * u, hx + 90 * u, hy + 30 * u, hx + 180 * u, hy + 120 * u, hx + 260 * u, hy + 260 * u, hx + 320 * u, h + 40], 4)).fill(0x5a4a3a);
  crag.poly(smooth([hx - 240 * u, hy + 14 * u, hx - 120 * u, hy - 10 * u, hx + 10 * u, hy, hx + 80 * u, hy + 34 * u, hx - 40 * u, hy + 40 * u], 3)).fill({ color: 0xc8a070, alpha: 0.55 });
  dabField(crag, hx - 300 * u, hy, 560 * u, h - hy, [0x7a6a52, 0x4a3a2a, 0x8a7a5a, 0x3a2e22], 60, seed + 4, 70 * u, 14 * u, 0.6, -0.6);
  const field = new Graphics();
  armchair(field, cx + h * 0.55, h * 0.86, 150 * u);
  k.addChild(sky, clouds, land, smoke, crag, field);
  return { k, hx, hy, u, chair: [cx + h * 0.55, h * 0.86] as [number, number], clouds };
}

interface St {
  flag: Graphics | null;
  scene: Container;
  chair: [number, number];
}
const S = stash<St>();
const PAN = 250;

export const bonapata: Signature = {
  dark: false,
  frame: 0x1f3a8a,
  tag: 'UNIVERSO DEL IMPERIO',
  open(c: SigCtx) {
    const bf = battlefield(W, H, 101);
    const scene = bf.k;
    c.back.addChild(scene);
    hideDisc(c, 0.2);
    const hs = horse(430);
    hs.position.set(bf.hx, bf.hy + 8);
    scene.addChild(hs);
    if (!c.reduce) every(c, 30, (t) => !bf.clouds.destroyed && (bf.clouds.x = Math.sin(t * 0.2) * 30));
    // the flag behind him (rises during the takeover; a duplicate finds it up)
    const flag = new Graphics();
    const FX = W / 2 + 190;
    const FTOP = c.catY - 300;
    c.behind.addChild(flag);
    const waveFlag = (t: number, up = 1) => {
      if (flag.destroyed) return;
      flag.alpha = up > 0.02 ? 1 : 0;
      drawFlag(flag, FX, FTOP + (1 - up) * 700, 1100, 300, 190, t);
    };
    const flagUp = { v: 1 };
    waveFlag(0);
    if (!c.reduce) every(c, 30, (t) => waveFlag(t, flagUp.v));
    park(c, 'main', comic('¡CONQUISTADO!', GOLD, 130));
    const st: St = { flag, scene, chair: bf.chair };
    S.set(c, st);
    if (c.short) return;

    flagUp.v = 0;
    waveFlag(0, 0);
    // the camera starts high on the sky (the horse on its crag), then tilts down
    if (!c.reduce) {
      scene.y = PAN;
      scene.alpha = 0;
      gsap.to(scene, { alpha: 1, duration: 0.3 });
      gsap.fromTo(hs, { rotation: 0.12 }, { rotation: -0.08, duration: 0.35, delay: 0.2, ease: 'back.out(3)' });
    }
    // cannon smoke in front hides his feet until the camera comes down
    const smoke = new Container();
    const sg = new Graphics();
    const rr = rnd(13);
    for (let i = 0; i < 16; i++) sg.poly(ngon(W / 2 - 500 + rr() * 1000, 760 + rr() * 260, 120 + rr() * 90, 70 + rr() * 50, 12)).fill({ color: i % 2 ? 0xe8e0d4 : 0xd0c8bc, alpha: 0.9 });
    smoke.addChild(sg);
    c.fg.addChildAt(smoke, 0);
    score(c, [
      [0.0, 'drumroll', 1.0],
      [0.25, 'boom', 0.45],
      [0.3, 'whoosh', 0.5],
      [0.85, 'drumroll', 1.15],
      [1.35, 'tick', 1.2],
      [1.65, 'charge', 0.9],
      [1.95, 'fanfare', 0.9],
    ]);
    const neigh = flat('¡IIIIIH!', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '900', fontSize: 64, fill: 0xfff6dc, stroke: { color: 0x5a3a1a, width: 8, join: 'round' } });
    const popNeigh = pre(c, neigh, 520, 250, -0.08);
    at(c, 0.25, () => popNeigh(0.6, { from: 0.4 }));
    at(c, 0.85, () => {
      if (c.reduce) {
        destroyTree(smoke);
        return;
      }
      gsap.to(scene, { y: 0, duration: 0.55, ease: 'power2.inOut' });
      gsap.to(smoke, { alpha: 0, duration: 0.5, delay: 0.1, onComplete: () => destroyTree(smoke) });
      gsap.to(smoke.scale, { x: 1.5, duration: 0.6 });
    });
    // the little hand-lettered arrow: it's a box
    at(c, 1.35, () => {
      const [bx, by] = onCat(c, BOX[0], BOX[1]);
      const k = new Container();
      const ar = new Graphics();
      const pts: number[] = [];
      for (let i = 0; i <= 10; i++) {
        const q = i / 10;
        pts.push(bx - 270 + q * 190, by + 60 - Math.sin(q * Math.PI) * 40 - q * 50);
      }
      ar.poly(band(pts, 4, 3)).fill(0xfff6dc);
      ar.poly([bx - 64, by - 6, bx - 96, by - 22, bx - 86, by + 6]).fill(0xfff6dc);
      const lab = flat('(una caja)', { fontFamily: F.brush, fontSize: 56, fill: 0xfff6dc, stroke: { color: 0x3a2a1a, width: 8, join: 'round' } });
      lab.position.set(bx - 330, by + 100);
      lab.rotation = -0.06;
      k.addChild(ar, lab);
      c.fg.addChild(k);
      if (!c.reduce) gsap.from(k, { alpha: 0, duration: 0.15 });
      gsap.to(k, { alpha: 0, delay: 0.75, duration: 0.25, onComplete: () => destroyTree(k) });
    });
    // the flag rises behind him
    at(c, 1.6, () => {
      if (c.reduce) {
        flagUp.v = 1;
        waveFlag(0);
        return;
      }
      gsap.to(flagUp, { v: 1, duration: 0.45, ease: 'back.out(1.4)' });
    });
    later(c, 2.25, () => (flagUp.v = 1));
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    if (st && !st.scene.destroyed) {
      st.scene.y = 0;
      // the armchair is taken: a little flag plants itself on its cushion
      const mini = new Graphics();
      const [ax, ay] = st.chair;
      st.scene.addChild(mini);
      const draw = (t: number) => !mini.destroyed && drawFlag(mini, ax + 10, ay - 260, 210, 110, 70, t);
      draw(0);
      if (!c.reduce) {
        gsap.fromTo(mini, { y: -300, alpha: 0 }, { y: 0, alpha: 1, duration: 0.25, delay: 0.25, ease: 'power3.in' });
        every(c, 30, draw);
      }
      later(c, 0.5, () => sfx('hit', 1.2));
    }
    sfx('fanfare', 1.0);
    sfx('drumroll', 1.3);
    later(c, 0.1, () => sfx('boom', 0.7));
    c.shaker.add(0.25);
    // light breaks through the clouds behind him
    const rays = new Graphics();
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i - 6.5) * 0.16;
      rays.poly([0, 0, Math.cos(a - 0.04) * 1300, Math.sin(a - 0.04) * 1300, Math.cos(a + 0.04) * 1300, Math.sin(a + 0.04) * 1300]).fill({ color: 0xfff0c0, alpha: 0.22 });
    }
    rays.position.set(W / 2, c.catY + 60);
    c.behind.addChildAt(rays, 0);
    const glow = glowDisc(360, 0xfff0c0, 0.35, 8, 28);
    glow.position.set(W / 2, c.catY - 60);
    c.behind.addChildAt(glow, 0);
    if (!c.reduce) {
      gsap.fromTo(rays, { alpha: 0 }, { alpha: 1, duration: 0.4 });
      every(c, 30, (t) => !rays.destroyed && (rays.rotation = Math.sin(t * 0.5) * 0.05));
    }
    // laurel leaves fly
    burst(c, c.fg, (i) => new Graphics().poly(ngon(0, 0, 16, 6, 8, i)).fill(i % 2 ? 0x3a7a3a : 0x5a9a4a).poly(ngon(0, 0, 9, 3, 6, i)).fill(GOLD), 30, W / 2, c.catY - 80, 860, 1.4);
    const main = take(c, 'main', () => comic('¡CONQUISTADO!', GOLD, 130));
    payline(c, main, '…el sillón ya es territorio imperial.', { maxW: 700, dur: 2.6, asideStyle: { fill: 0xfff2c8 } });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const bf = battlefield(w, h, 103);
    k.addChild(bf.k);
    const hs = horse(430 * bf.u);
    hs.position.set(bf.hx, bf.hy + 8 * bf.u);
    k.addChild(hs);
    const flag = new Graphics();
    const draw = (t: number) => drawFlag(flag, w / 2 - 60 * bf.u, h * 0.22, h * 0.6, 300 * bf.u, 190 * bf.u, t);
    draw(0);
    k.addChild(flag);
    if (live)
      cardLoop(k, 30, (t) => {
        draw(t);
        bf.clouds.x = Math.sin(t * 0.2) * 30 * bf.u;
      });
    return k;
  },
};
