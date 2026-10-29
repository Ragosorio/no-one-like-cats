/**
 * Michi Esponja: the bottom-of-the-sea universe (an undersea cartoon about a sponge who cooks burgers). A watery sky with
 * light rays, flower-shaped clouds drifting in it, bubbles rising in clusters, a sandy bottom with coral and swaying kelp,
 * a tropical-fruit house with a porthole door, the order counter with its little bell. A bubble wipe opens the scene,
 * ¡DING! goes the bell, a pink jellyfish buzzes across, he hops with his spatula and the burgers fly — ¡FLIP! ¡FLIP! —
 * stacking up on the counter.
 * Payoff: a geyser of bubbles, the burger tower lands with its bun on top, sparkles; ¡ORDEN LISTA! (…con doble burbuja.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { onCat } from './kitD';
import { asideText, bar, borrowFor, glow, oval, payline, pop, pre, rand, rrect, star, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const WATER = [0x3fb4e8, 0x6ccaf0, 0x9fe0f8, 0x8ad6ee];
const SAND = 0xf0d890;
const SAND2 = 0xe0c070;
const INK = 0x1a3a5a;
const FLOWERS = [0xf6a8c8, 0x9ad86a, 0xc8a0f0, 0xffe27a, 0x7ad0f0];

/** a flower-shaped cloud (5 round petals as ONE polygon) + its lighter heart */
function flower(g: Graphics, x: number, y: number, r: number, col: number, rot: number) {
  const pts: number[] = [];
  for (let i = 0; i < 40; i++) {
    const a = rot + (i / 40) * Math.PI * 2;
    const rr = r * (0.72 + 0.28 * Math.abs(Math.cos((a - rot) * 2.5)));
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.poly(pts).fill({ color: col, alpha: 0.85 });
  g.poly(oval(x, y, r * 0.34, r * 0.34, 12)).fill({ color: 0xffffff, alpha: 0.45 });
}

/** bubbles: rings with a highlight (one Graphics) */
function bubble(g: Graphics, x: number, y: number, r: number, a = 0.8) {
  g.poly(oval(x, y, r, r, Math.max(8, Math.min(18, Math.round(r / 2))))).fill({ color: 0xffffff, alpha: 0.18 * a }).stroke({ width: Math.max(1.5, r * 0.12), color: 0xffffff, alpha: 0.8 * a });
  g.poly(oval(x - r * 0.35, y - r * 0.35, r * 0.22, r * 0.14, 8, -0.7)).fill({ color: 0xffffff, alpha: 0.9 * a });
}

/** the sea bottom (w×h, u vs 1920×1080): water, light rays, flower clouds, sand, coral, rocks, the fruit house */
function seabed(w: number, h: number, u: number, cx: number) {
  const g = vgrad(new Graphics(), 0, 0, w, h, WATER, 18);
  const rays = new Graphics();
  for (let x = (cx % (260 * u)) - 260 * u; x < w + 260 * u; x += 260 * u) rays.poly([x, 0, x + 90 * u, 0, x - 120 * u, h * 0.8, x - 260 * u, h * 0.8]);
  rays.fill({ color: 0xffffff, alpha: 0.07 });
  rays.blendMode = 'add';
  const fl = new Graphics();
  const r = rand(17);
  const nf = Math.max(4, Math.round(w / (300 * u)));
  for (let i = 0; i < nf; i++) flower(fl, ((i + 0.3 + r() * 0.4) / nf) * w, (90 + r() * 260) * u, (60 + r() * 50) * u, FLOWERS[i % FLOWERS.length], r() * 3);
  const floorY = h * 0.76;
  const bed = new Graphics();
  const dune: number[] = [0, h];
  for (let x = 0; x <= w + 40 * u; x += 40 * u) dune.push(x, floorY + Math.sin(x / (210 * u)) * 18 * u);
  dune.push(w + 40 * u, h);
  bed.poly(dune).fill(SAND);
  for (let i = 0; i < Math.round(w / (40 * u)); i++) bed.poly(oval(r() * w, floorY + (0.15 + r() * 0.8) * (h - floorY), (4 + r() * 6) * u, (3 + r() * 3) * u, 6)).fill(SAND2);
  // coral (branches) and rocks
  const coral = (x: number, s: number, col: number) => {
    bed.poly(bar(x, floorY + 8 * u, x, floorY - 120 * s, 12 * s)).poly(bar(x, floorY - 50 * s, x - 50 * s, floorY - 110 * s, 9 * s)).poly(bar(x, floorY - 70 * s, x + 46 * s, floorY - 150 * s, 9 * s)).poly(bar(x - 50 * s, floorY - 110 * s, x - 56 * s, floorY - 150 * s, 7 * s));
    bed.fill(col);
    for (const [dx, dy] of [
      [0, -120],
      [-56, -150],
      [46, -150],
    ])
      bed.poly(oval(x + dx * s, floorY + dy * s, 12 * s, 12 * s, 8)).fill(col);
  };
  for (let x = (cx % (520 * u)) - 200 * u; x < w; x += 520 * u) {
    coral(x, u, 0xf2708a);
    coral(x + 260 * u, u * 0.8, 0xf2a03a);
    bed.poly(oval(x + 130 * u, floorY + 20 * u, 60 * u, 30 * u, 12)).fill(0x9a8a7a).poly(oval(x + 120 * u, floorY + 10 * u, 30 * u, 12 * u, 10)).fill(0xb8aa9a);
  }
  return { g, rays, fl, bed, floorY };
}

/** the tropical-fruit house: a spiky-diamond fruit with leaves on top, a porthole door, two round windows (origin at its base) */
function fruitHouse(s: number) {
  const g = new Graphics();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32;
    g.poly([Math.cos(a - 0.12) * 60 * s, -380 * s + Math.sin(a - 0.12) * 60 * s, Math.cos(a) * 230 * s, -380 * s + Math.sin(a) * 200 * s, Math.cos(a + 0.12) * 60 * s, -380 * s + Math.sin(a + 0.12) * 60 * s]);
  }
  g.fill(0x3a9a3a);
  g.poly(oval(0, -200 * s, 150 * s, 200 * s, 26)).fill(0xf2a03a).stroke({ width: 6 * s, color: 0x8a4a10 });
  for (let i = -4; i <= 4; i++) g.poly(bar(i * 36 * s - 120 * s, -360 * s, i * 36 * s + 120 * s, -40 * s, 2.5 * s)).poly(bar(i * 36 * s + 120 * s, -360 * s, i * 36 * s - 120 * s, -40 * s, 2.5 * s));
  g.fill({ color: 0xc87818, alpha: 0.8 });
  g.poly(oval(0, -90 * s, 52 * s, 62 * s, 18)).fill(0x9aa0a8).stroke({ width: 6 * s, color: 0x5a5f66 });
  g.poly(oval(0, -96 * s, 34 * s, 40 * s, 14)).fill(0x5a5f66);
  g.poly(oval(-70 * s, -230 * s, 26 * s, 26 * s, 12)).fill(0x7ad0f0).stroke({ width: 6 * s, color: 0x9aa0a8 });
  g.poly(oval(68 * s, -280 * s, 26 * s, 26 * s, 12)).fill(0x7ad0f0).stroke({ width: 6 * s, color: 0x9aa0a8 });
  return g;
}

/** the order counter with its bell (origin at its base); the bell is separate (it shakes) */
function counter(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-200 * s, -190 * s, 400 * s, 190 * s).fill(0x9a5a2a).stroke({ width: 6 * s, color: 0x4a2a10 });
  for (let i = 1; i < 5; i++) g.rect(-200 * s, -190 * s + i * 38 * s, 400 * s, 3 * s).fill(0x6a3a1a);
  g.poly(rrect(-230 * s, -214 * s, 460 * s, 30 * s, 8 * s, 2)).fill(0xc87838).stroke({ width: 5 * s, color: 0x4a2a10 });
  // the order ticket wheel
  g.poly(oval(140 * s, -250 * s, 40 * s, 12 * s, 12)).fill(0xc0c6cc);
  for (let i = 0; i < 3; i++) g.poly([110 * s + i * 22 * s, -260 * s, 130 * s + i * 22 * s, -262 * s, 128 * s + i * 22 * s, -300 * s, 112 * s + i * 22 * s, -296 * s]).fill(0xffffff);
  const bell = new Graphics();
  bell.poly([-34 * s, 0, 34 * s, 0, 26 * s, -14 * s, 12 * s, -40 * s, -12 * s, -40 * s, -26 * s, -14 * s]).fill(0xe6c34a).stroke({ width: 4 * s, color: 0x8a6a10, join: 'round' });
  bell.poly(oval(0, -46 * s, 8 * s, 8 * s, 8)).fill(0xe6c34a);
  bell.rect(-42 * s, -2 * s, 84 * s, 8 * s).fill(0x5a5f66);
  bell.position.set(-90 * s, -214 * s);
  k.addChild(g, bell);
  return { k, bell, top: -214 * s };
}

/** a burger (bun, lettuce, patty, cheese) — origin at its middle; `top` = with the crown */
function burger(s: number, top = true) {
  const g = new Graphics();
  if (top) g.poly([...[0, 1, 2, 3, 4, 5, 6, 7, 8].flatMap((i) => [Math.cos(Math.PI + (i / 8) * Math.PI) * 52 * s, -10 * s + Math.sin(Math.PI + (i / 8) * Math.PI) * 34 * s])]).fill(0xe8a24a).stroke({ width: 3 * s, color: 0x7a4a1a });
  g.poly([-56 * s, -8 * s, 56 * s, -8 * s, 48 * s, 4 * s, 30 * s, -2 * s, 14 * s, 6 * s, -6 * s, -2 * s, -24 * s, 6 * s, -44 * s, -2 * s]).fill(0x5ac03a);
  g.poly(rrect(-54 * s, -2 * s, 108 * s, 16 * s, 8 * s, 2)).fill(0x6a3a1a);
  g.poly([-50 * s, -2 * s, 50 * s, -2 * s, 30 * s, 8 * s, 10 * s, 2 * s]).fill(0xffd23f);
  g.poly(rrect(-52 * s, 14 * s, 104 * s, 14 * s, 6 * s, 2)).fill(0xe8a24a).stroke({ width: 3 * s, color: 0x7a4a1a });
  if (top) for (let i = 0; i < 5; i++) g.poly(oval(-28 * s + i * 14 * s, -28 * s - (i % 2) * 6 * s, 3 * s, 2 * s, 6)).fill(0xfff2c8);
  return g;
}

/** a pink jellyfish (origin at its dome's center); tentacles wave with t */
function jelly(g: Graphics, s: number, t: number) {
  g.clear();
  for (let i = 0; i < 5; i++) {
    const x0 = (-32 + i * 16) * s;
    const pts: number[] = [];
    for (let j = 0; j <= 6; j++) pts.push(x0 + Math.sin(t * 6 + i + j * 0.9) * 6 * s, 10 * s + j * 14 * s);
    g.poly(pts, false).stroke({ width: 5 * s, color: 0xd86aa8, cap: 'round', join: 'round' });
  }
  g.poly([...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((i) => [Math.cos(Math.PI + (i / 10) * Math.PI) * 50 * s, 12 * s + Math.sin(Math.PI + (i / 10) * Math.PI) * 50 * s])]).fill(0xf6a8d0).stroke({ width: 4 * s, color: 0xd86aa8 });
  g.poly(oval(-16 * s, -14 * s, 8 * s, 8 * s, 8)).poly(oval(14 * s, -24 * s, 6 * s, 6 * s, 8)).poly(oval(18 * s, 0, 7 * s, 7 * s, 8)).fill(0xffd0e8);
}

interface St {
  bubbles: { v: number };
  tower: Container;
  words: Container[];
  line: ReturnType<typeof payline>;
  give: () => void;
}
const S = stash<St>();
const CT: [number, number] = [1600, 860];

export const esponja: Signature = {
  dark: false,
  frame: 0x3aa8d8,
  tag: 'UNIVERSO DEL FONDO',
  open(c: SigCtx) {
    const k = new Container();
    const sb = seabed(W, H, 1, W / 2);
    const house = fruitHouse(1);
    house.position.set(330, sb.floorY + 70);
    const ct = counter(1);
    ct.k.position.set(CT[0], CT[1]);
    const kelp = new Graphics();
    const bub = new Graphics();
    const jg = new Graphics();
    jg.position.set(-200, 260);
    const tower = new Container();
    tower.position.set(CT[0] + 60, CT[1] + ct.top);
    k.addChild(sb.g, sb.rays, sb.fl, sb.bed, house, kelp, ct.k, tower, jg, bub);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const halo = glow(380, 0xffffff, 0.3, 6, 24);
    halo.position.set(W / 2, c.catY);
    c.behind.addChild(halo);
    const words: Container[] = [];
    const line = payline(c, () => title('¡ORDEN LISTA!', { size: 150, fill: 0xffe14d, ink: INK, inkW: 16, shadow: 0xd62839 }), () => asideText('…con doble burbuja.', 0xffffff, INK, 46));
    const bubbles = { v: c.reduce ? 0.6 : 1 };
    const give = borrowFor(c, 1.0, 0.34, (cat, _x0, y0, q) => {
      cat.y = y0 - Math.sin(q * Math.PI) * 70;
    });
    S.set(c, { bubbles, tower, words, line, give });
    // bubble columns rising, kelp swaying, flowers drifting
    const cols = [120, 560, 760, 1180, 1380, 1820];
    const drawLife = (t: number) => {
      if (bub.destroyed) return;
      bub.clear();
      cols.forEach((x, i) => {
        for (let j = 0; j < 5; j++) {
          const q = (t * (0.18 + (i % 3) * 0.04) + j / 5 + i * 0.13) % 1;
          bubble(bub, x + Math.sin(q * 9 + i) * 16, sb.floorY - q * (sb.floorY + 60), 6 + ((i + j) % 4) * 4, bubbles.v);
        }
      });
      kelp.clear();
      for (const x of [80, 640, 1290, 1860]) {
        const pts: number[] = [];
        const back: number[] = [];
        for (let j = 0; j <= 8; j++) {
          const y = sb.floorY + 20 - j * 44;
          const dx = Math.sin(t * 1.6 + j * 0.6 + x) * j * 4;
          pts.push(x + dx - 12 + j * 0.6, y);
          back.unshift(x + dx + 12 - j * 0.6, y);
        }
        kelp.poly([...pts, ...back]);
      }
      kelp.fill(0x3a9a4a);
      if (!sb.fl.destroyed) sb.fl.x = Math.sin(t * 0.3) * 30;
    };
    drawLife(0.4);
    if (!c.reduce) every(c, 30, drawLife);
    if (c.short) {
      for (let i = 0; i < 3; i++) {
        const b = burger(1.5, i === 2);
        b.y = -30 - i * 50;
        tower.addChild(b);
      }
      return;
    }
    score(c, [
      [0.0, 'splash', 0.9],
      [0.38, 'coin', 2.2],
      [0.42, 'gem', 2.4],
      [0.7, 'zap', 2.2],
      [1.0, 'whoosh', 1.2],
      [1.22, 'pop', 1.2],
      [1.5, 'pop', 1.35],
      [1.78, 'pop', 1.5],
    ]);
    // the bubble wipe (the cartoon's scene change)
    beat(c, 0.0, () => {
      if (c.reduce) return;
      const wipe = new Graphics();
      c.fg.addChild(wipe);
      const p = { v: 0 };
      const r = rand(3);
      const bs: [number, number, number][] = [];
      for (let i = 0; i < 26; i++) bs.push([r() * W, H + r() * 400, 60 + r() * 120]);
      gsap.to(p, {
        v: 1,
        duration: 0.6,
        ease: 'power1.in',
        onUpdate: () => {
          if (wipe.destroyed) return;
          wipe.clear();
          for (const [x, y, rr] of bs) bubble(wipe, x + Math.sin(p.v * 6 + rr) * 30, y - p.v * (H + 700), rr, 1);
        },
        onComplete: () => destroyTree(wipe),
      });
    });
    // ¡DING! goes the order bell
    const ding = pre(c.fg, title('¡DING!', { size: 110, fill: 0xffe14d, ink: INK, inkW: 13, shadow: null }), CT[0] - 120, CT[1] - 420, 0.12);
    words.push(ding);
    pop(c, ding, 0.38, 0.5, {
      onShow: () => {
        if (!c.reduce && !ct.bell.destroyed) gsap.fromTo(ct.bell, { rotation: -0.4 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(1.2,0.3)' });
      },
    });
    // the jellyfish buzzes across the top
    beat(c, 0.6, () => {
      if (c.reduce || jg.destroyed) return;
      const p = { v: 0 };
      gsap.to(p, {
        v: 1,
        duration: 1.4,
        ease: 'none',
        onUpdate: () => {
          if (jg.destroyed) return;
          jg.position.set(-120 + p.v * (W + 240), 300 - Math.sin(p.v * Math.PI * 3) * 50);
          jelly(jg, 1.1, p.v * 4);
        },
      });
    });
    const bzz = pre(c.fg, title('bzzz', { size: 54, fill: 0xf6a8d0, ink: INK, inkW: 7, shadow: null }), 700, 200, -0.1);
    words.push(bzz);
    pop(c, bzz, 0.95, 0.4, { from: 1.4 });
    // the hop and the flipping burgers: off his spatula, spinning up, down onto the counter
    const [sx, sy] = onCat(c, 0.157, 0.271);
    const flips = [1.2, 1.48, 1.76];
    flips.forEach((at, i) => {
      beat(c, at, () => {
        if (tower.destroyed) return;
        const b = burger(1.5, i === 2);
        const ty = -30 - i * 50;
        if (c.reduce) {
          b.y = ty;
          tower.addChild(b);
          return;
        }
        b.position.set(sx - tower.x, sy - tower.y);
        tower.addChild(b);
        const p = { v: 0 };
        const x0 = b.x;
        const y0 = b.y;
        gsap.to(p, {
          v: 1,
          duration: 0.42,
          ease: 'none',
          onUpdate: () => {
            if (b.destroyed) return;
            b.x = x0 + (0 - x0) * p.v;
            b.y = y0 + (ty - y0) * p.v - Math.sin(p.v * Math.PI) * 340;
            b.rotation = p.v * Math.PI * 4;
          },
        });
      });
      const f = pre(c.fg, title('¡FLIP!', { size: 76, fill: 0xffffff, ink: INK, inkW: 9, shadow: null }), sx - 60 + i * 30, sy - 170 - i * 40, -0.15 + i * 0.12);
      words.push(f);
      pop(c, f, at + 0.02, 0.32, { from: 1.6 });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('splash', 1.2);
    sfx('coin', 2.4);
    later(c, 0.15, () => sfx('fanfare', 1.15));
    c.shaker.add(0.3);
    if (!st) return;
    st.give();
    sweep(st.words);
    st.line.land(2.4);
    st.bubbles.v = 1.4;
    gsap.to(st.bubbles, { v: 1, delay: 1.2, duration: 1 });
    // the tower is complete, whatever happened before
    if (!st.tower.destroyed) {
      st.tower.removeChildren().forEach((ch) => destroyTree(ch));
      for (let i = 0; i < 3; i++) {
        const b = burger(1.5, i === 2);
        b.y = -30 - i * 50;
        st.tower.addChild(b);
      }
      if (!c.reduce) gsap.fromTo(st.tower.scale, { x: 1.4, y: 0.6 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
      const sp = new Graphics();
      for (let i = 0; i < 4; i++) sp.poly(star(CT[0] + 60 + (i - 1.5) * 70, CT[1] - 420 + (i % 2) * 40, 22, 7, 4)).fill(0xffffff);
      c.fg.addChild(sp);
      gsap.to(sp, { alpha: 0, delay: 0.6, duration: 0.4, onComplete: () => destroyTree(sp) });
    }
    // a geyser of bubbles out of him
    burst(
      c,
      c.fg,
      () => {
        const g = new Graphics();
        bubble(g, 0, 0, 14 + Math.random() * 26, 1);
        return g;
      },
      30,
      W / 2,
      c.catY + 40,
      880,
      1.6,
    );
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const sb = seabed(w, h, u, w / 2);
    const house = fruitHouse(u * 0.9);
    house.position.set(w / 2 - Math.min(w * 0.36, 640 * u), sb.floorY + 70 * u);
    const bub = new Graphics();
    const jg = new Graphics();
    jelly(jg, u * 1.1, 0);
    jg.position.set(w / 2 + Math.min(w * 0.34, 560 * u), 300 * u);
    k.addChild(sb.g, sb.rays, sb.fl, sb.bed, house, jg, bub);
    const xs: number[] = [];
    for (let x = (w / 2) % (240 * u); x < w; x += 240 * u) xs.push(x);
    const drawB = (t: number) => {
      bub.clear();
      xs.forEach((x, i) => {
        for (let j = 0; j < 3; j++) {
          const q = (t * 0.15 + j / 3 + i * 0.37) % 1;
          bubble(bub, x + Math.sin(q * 8 + i) * 12 * u, sb.floorY - q * sb.floorY, (6 + ((i + j) % 3) * 5) * u, 1);
        }
      });
    };
    drawB(0.3);
    if (live)
      liveLoop(k, (t) => {
        drawB(t);
        sb.fl.x = Math.sin(t * 0.3) * 30 * u;
        jelly(jg, u * 1.1, t);
        jg.y = 300 * u + Math.sin(t * 1.4) * 30 * u;
      });
    return k;
  },
};
