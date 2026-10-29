/**
 * Miaunion: the helpers' universe (the yellow goggled helper creatures who love bananas). A bright lab-warehouse — pale
 * blue walls with round portholes, hazard stripes, a conveyor belt carrying bananas, crates stamped with a banana, and a
 * big red alarm beacon on the ceiling. The beacon starts to spin (¡UIUUU! ¡UIUUU!), red light sweeps the room, and a
 * stampede of yellow capsules in goggles and overalls charges across the screen while bananas fly overhead in arcs; one
 * of them stops right by his silhouette, turns, and waves — ¡HOLAAA!
 * Payoff: banana rain, the whole herd jumps for joy, the beacon spins double time; ¡BANANAAA! (…¿alguien tiene otra?)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, drizzle, every, fall, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { beat, pay } from './kitC';
import { balloon } from './kitD';
import { asideText, banana, bar, capsule, glow, oval, payline, pop, pre, rand, rrect, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const WALL = 0xcfe6f2;
const WALL2 = 0xb8d8ea;
const FLOOR = 0x8a96a8;
const HAZ = 0xffc83a;
const RED = 0xe0202a;

/** the warehouse (w×h, u vs 1920×1080): walls, portholes, crates, the conveyor (its bananas drawn by belt()) */
function warehouse(w: number, h: number, u: number, cx: number) {
  const g = new Graphics().rect(0, 0, w, h).fill(WALL);
  for (let x = (cx % (200 * u)) - 200 * u; x < w; x += 200 * u) g.rect(x, 0, 90 * u, h * 0.7);
  g.fill(WALL2);
  // portholes
  for (let x = (cx % (480 * u)) - 240 * u; x < w + 100 * u; x += 480 * u) {
    g.poly(oval(x, 250 * u, 74 * u, 74 * u, 22)).fill(0x9aa4b4).poly(oval(x, 250 * u, 56 * u, 56 * u, 20)).fill(0x3a6ab8);
    g.poly(oval(x - 18 * u, 232 * u, 16 * u, 10 * u, 10, -0.6)).fill({ color: 0xffffff, alpha: 0.6 });
    for (let i = 0; i < 8; i++) g.poly(oval(x + Math.cos((i / 8) * Math.PI * 2) * 66 * u, 250 * u + Math.sin((i / 8) * Math.PI * 2) * 66 * u, 4 * u, 4 * u, 6)).fill(0x5a6474);
  }
  // hazard stripe band and the floor
  const floorY = h * 0.78;
  g.rect(0, floorY, w, h - floorY).fill(FLOOR);
  for (let y = floorY + 40 * u; y < h; y += 60 * u) g.rect(0, y, w, 3 * u);
  g.fill(0x7a8698);
  const hz = new Graphics();
  hz.rect(0, h * 0.62, w, 30 * u).fill(0x1a1a1a);
  for (let x = -40 * u; x < w + 40 * u; x += 64 * u) hz.poly([x, h * 0.62 + 30 * u, x + 32 * u, h * 0.62 + 30 * u, x + 58 * u, h * 0.62, x + 26 * u, h * 0.62]);
  hz.fill(HAZ);
  // crates stamped with a banana (left and right)
  const crates = new Graphics();
  const crate = (x: number, y: number, s: number) => {
    crates.rect(x - 80 * s, y - 140 * s, 160 * s, 140 * s).fill(0xc8a068).stroke({ width: 5 * s, color: 0x6a4a20 });
    crates.poly(bar(x - 80 * s, y - 140 * s, x + 80 * s, y, 5 * s)).poly(bar(x + 80 * s, y - 140 * s, x - 80 * s, y, 5 * s)).fill(0xa8804a);
    crates.poly(oval(x, y - 70 * s, 40 * s, 30 * s, 14)).fill(0xe8d0a0);
  };
  for (const side of [-1, 1]) {
    const x0 = cx + side * 720 * u;
    crate(x0, floorY + 10 * u, u);
    crate(x0 + side * 170 * u, floorY + 10 * u, u);
    crate(x0 + side * 85 * u, floorY - 130 * u, u);
  }
  const stamps: [number, number, number][] = [];
  for (const side of [-1, 1]) {
    const x0 = cx + side * 720 * u;
    stamps.push([x0, floorY - 60 * u, u], [x0 + side * 170 * u, floorY - 60 * u, u], [x0 + side * 85 * u, floorY - 200 * u, u]);
  }
  // the conveyor (high, across the back)
  const cy = 450 * u;
  const conv = new Graphics();
  conv.rect(0, cy, w, 26 * u).fill(0x3a4250);
  for (let x = (cx % (120 * u)); x < w; x += 120 * u) conv.poly(oval(x, cy + 13 * u, 14 * u, 14 * u, 10)).fill(0x9aa4b4);
  for (let x = (cx % (300 * u)); x < w; x += 300 * u) conv.rect(x - 6 * u, cy + 26 * u, 12 * u, 120 * u).fill(0x4a5464);
  return { g, hz, crates, stamps, conv, floorY, beltY: cy };
}

/** the alarm beacon on the ceiling (origin at its base); its beams are separate and turn */
function beacon(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.poly(rrect(-60 * s, -10 * s, 120 * s, 30 * s, 6 * s, 2)).fill(0x3a4250);
  g.poly([-46 * s, 20 * s, 46 * s, 20 * s, 40 * s, 90 * s, -40 * s, 90 * s]).fill(RED).stroke({ width: 4 * s, color: 0x6a0a0a });
  g.poly(oval(0, 90 * s, 40 * s, 12 * s, 14)).fill(0xff6a6a);
  const beams = new Graphics();
  beams.blendMode = 'add';
  const halo = glow(200 * s, RED, 0.5, 6, 20);
  halo.blendMode = 'add';
  halo.y = 60 * s;
  k.addChild(beams, halo, g);
  return { k, beams, halo };
}

function drawBeams(b: Graphics, a: number, s: number, reach: number, alpha: number) {
  b.clear();
  for (const d of [0, Math.PI]) {
    const ang = a + d;
    const sx = Math.cos(ang);
    // a sweeping cone, squashed vertically when it points sideways (the room is a box seen from the front)
    b.poly([0, 60 * s, sx * reach - 160 * s, 60 * s + reach * 0.9, sx * reach + 160 * s, 60 * s + reach * 0.9]).fill({ color: RED, alpha: alpha * (0.35 + 0.35 * Math.abs(Math.sin(ang))) });
  }
}

interface St {
  herd: ReturnType<typeof capsule>[];
  front: ReturnType<typeof capsule>[];
  joy: { v: number };
  spin: { v: number };
  waver: ReturnType<typeof capsule>;
  words: Container[];
  line: ReturnType<typeof payline>;
}
const S = stash<St>();

export const miaunion: Signature = {
  dark: false,
  frame: 0xffe14d,
  tag: 'UNIVERSO AYUDANTE',
  open(c: SigCtx) {
    const k = new Container();
    const wh = warehouse(W, H, 1, W / 2);
    const bananaStamps = new Container();
    for (const [x, y, s] of wh.stamps) {
      const b = banana(s * 0.55);
      b.position.set(x, y);
      bananaStamps.addChild(b);
    }
    const belt = new Container();
    for (let i = 0; i < 12; i++) {
      const b = banana(0.6);
      b.position.set(i * 170, wh.beltY - 14);
      b.rotation = 0.2;
      belt.addChild(b);
    }
    const bc = beacon(1.1);
    bc.k.position.set(W / 2, 0);
    // the herd: a back row (behind him) and a front row low along the floor
    const r = rand(7);
    const herd = Array.from({ length: 14 }, (_, i) => {
      const front = i % 2 === 1;
      const h = capsule(front ? 0.95 : 0.75, { eyes: r() < 0.35 ? 1 : 2, tall: 0.85 + r() * 0.4, look: 1 });
      h.k.position.set(-200 - i * 120, front ? H - 40 : wh.floorY + 30);
      return h;
    });
    const back = herd.filter((_, i) => i % 2 === 0);
    const front = herd.filter((_, i) => i % 2 === 1);
    const waver = capsule(1.15, { eyes: 2, look: -1 });
    waver.k.position.set(W / 2 + 330, wh.floorY + 120);
    waver.k.alpha = 0;
    k.addChild(wh.g, wh.conv, belt, wh.hz, wh.crates, bananaStamps, ...back.map((h) => h.k), bc.k);
    c.back.addChild(k);
    c.fg.addChild(...front.map((h) => h.k));
    c.behind.addChild(waver.k);
    hideDisc(c, 0.2);
    const words: Container[] = [];
    const line = payline(c, () => title('¡BANANAAA!', { size: 170, fill: 0xffe14d, ink: 0x1a2a5a, inkW: 18, shadow: 0x2f5fb0 }), () => asideText('…¿alguien tiene otra?', 0xffffff, 0x1a2a5a, 46));
    const joy = { v: 0 };
    const spin = { v: c.reduce ? 0 : 1 };
    S.set(c, { herd, front, joy, spin, waver, words, line });
    const run = { v: c.short || c.reduce ? 0 : 1 };
    let ang = 0;
    let last = 0;
    const life = (t: number) => {
      const dt = Math.min(0.1, t - last);
      last = t;
      ang += dt * 5 * spin.v;
      if (!bc.beams.destroyed) drawBeams(bc.beams, ang, 1.1, 900, c.flashes ? 1 : 0.5);
      if (!belt.destroyed) belt.x = -((t * 120) % 170);
      herd.forEach((h, i) => {
        if (h.k.destroyed) return;
        const fr = i % 2 === 1;
        if (run.v > 0) {
          const speed = fr ? 900 : 640;
          h.k.x = -200 + ((t * speed + i * 160) % (W + 500));
        }
        h.run(t + i * 0.37);
        const base = fr ? H - 40 : wh.floorY + 30;
        h.k.y = base - joy.v * Math.abs(Math.sin(t * 8 + i)) * 70;
      });
      if (!waver.k.destroyed && waver.k.alpha > 0.5) waver.arm.rotation = -1.2 + Math.sin(t * 14) * 0.5;
    };
    if (c.short || c.reduce) {
      // the herd stands about, the waver waves
      herd.forEach((h, i) => (h.k.x = 80 + ((i * 280) % (W - 160))));
      waver.k.alpha = 1;
    }
    life(0.3);
    if (!c.reduce) every(c, 30, life);
    if (c.short) {
      // the front row would stand on the name: only the back row is home
      front.forEach((h) => (h.k.visible = false));
      return;
    }
    score(c, [
      [0.02, 'alarm', 1.0],
      [0.42, 'alarm', 1.0],
      [0.84, 'alarm', 1.0],
      [0.3, 'whoosh', 0.7],
      [1.0, 'pop', 1.5],
      [1.3, 'pop', 1.7],
      [1.7, 'meow', 1.8],
    ]);
    const bido = ['¡UIUUU!', '¡UIUUU!'].map((tx, i) => pre(c.fg, title(tx, { size: 96, fill: 0xffffff, ink: RED, inkW: 12, shadow: 0x6a0a0a }), W / 2 + (i ? 330 : -330), 230 + i * 30, i ? 0.12 : -0.12));
    words.push(...bido);
    pop(c, bido[0], 0.04, 0.38);
    pop(c, bido[1], 0.44, 0.38);
    // bananas fly overhead in arcs
    for (let i = 0; i < 7; i++)
      beat(c, 0.4 + i * 0.18, () => {
        if (c.reduce) return;
        const b = banana(0.9);
        const x0 = i % 2 ? -60 : W + 60;
        const x1 = i % 2 ? W * (0.55 + Math.random() * 0.4) : W * (0.05 + Math.random() * 0.4);
        const p = { v: 0 };
        b.position.set(x0, 700);
        c.fg.addChild(b);
        gsap.to(p, {
          v: 1,
          duration: 0.8,
          ease: 'none',
          onUpdate: () => {
            if (b.destroyed) return;
            b.x = x0 + (x1 - x0) * p.v;
            b.y = 700 - Math.sin(p.v * Math.PI) * 560 + p.v * 300;
            b.rotation += 0.25;
          },
          onComplete: () => destroyTree(b),
        });
      });
    // one of them stops by him, turns and waves
    beat(c, 1.55, () => {
      if (waver.k.destroyed) return;
      waver.k.alpha = 1;
      if (!c.reduce) gsap.fromTo(waver.k, { x: W + 120 }, { x: W / 2 + 330, duration: 0.25, ease: 'power3.out' });
    });
    const hola = pre(c.fg, balloon('¡HOLAAA!', { size: 52, tx: -60, ty: 110 }), W / 2 + 470, wh.floorY - 160, 0.05);
    words.push(hola);
    pop(c, hola, 1.75, 0.5, { from: 0.4 });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.2);
    sfx('alarm', 1.4);
    later(c, 0.1, () => sfx('pop', 1.8));
    c.shaker.add(0.35);
    if (!st) return;
    sweep(st.words);
    st.line.land(2.4);
    st.joy.v = 1;
    st.spin.v = c.reduce ? 0 : 2.2;
    // the front row runs off (the name and the lore come in down there)
    st.front.forEach((h) => !h.k.destroyed && gsap.to(h.k, { alpha: 0, duration: c.reduce ? 0.01 : 0.3, onComplete: () => !h.k.destroyed && (h.k.visible = false) }));
    gsap.to(st.joy, { v: 0.35, delay: 1.8, duration: 1 });
    if (!st.waver.k.destroyed) {
      gsap.killTweensOf(st.waver.k);
      st.waver.k.alpha = 1;
      st.waver.k.x = W / 2 + 330;
    }
    fall(c, c.fg, () => banana(0.8 + Math.random() * 0.5), { n: 26, over: 1.0, dur: 1.4, spin: 6 });
    drizzle(c, c.back, () => banana(0.6), 0.22, 3.2);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const wh = warehouse(w, h, u, w / 2);
    const belt = new Graphics();
    for (let x = 0; x < w + 200 * u; x += 170 * u) banana(0.6 * u, belt, x, wh.beltY - 14 * u);
    const bc = beacon(1.1 * u);
    bc.k.position.set(w / 2, 0);
    drawBeams(bc.beams, 0.6, 1.1 * u, 900 * u, 0.7);
    const n = Math.max(2, Math.round(w / (300 * u)));
    const herd = Array.from({ length: n }, (_, i) => {
      const hh = capsule(0.75 * u, { eyes: i % 3 === 1 ? 1 : 2, tall: 0.9 + (i % 3) * 0.12, look: 1, flat: !live });
      hh.k.position.set(((i + 0.5) / n) * w, wh.floorY + 30 * u);
      return hh;
    });
    k.addChild(wh.g, wh.conv, belt, wh.hz, wh.crates, ...herd.map((hh) => hh.k), bc.k);
    if (live) {
      let ang = 0.6;
      liveLoop(k, (t, dt) => {
        ang += dt * 4;
        drawBeams(bc.beams, ang, 1.1 * u, 900 * u, 0.7);
        belt.x = -((t * 60 * u) % (170 * u));
        herd.forEach((hh, i) => {
          hh.k.x = ((((i + 0.5) / n) * w + t * 90 * u) % (w + 120 * u)) - 60 * u;
          hh.run(t + i * 0.4);
        });
      });
    }
    return k;
  },
};
