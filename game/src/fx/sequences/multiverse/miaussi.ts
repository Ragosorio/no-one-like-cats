/**
 * Miaussi, la Pulga de Bigotes: the universe of the dribble (the little No. 10 of the light-blue and white stripes).
 * The night of a final: a stadium packed with cats in light blue and white, flags in the stands, floodlights. A plate
 * stamps what they always told him — «MUY BAJITO PARA JUGAR» — and four giant defenders rise around him in shadow,
 * twice his size. Then the ball goes: a light-blue trail slaloms between their feet, each giant spins and falls on its
 * tail (¡OLÉ! from the stands, four times), the ball rolls into the net on the horizon; ¡GAMBETA!
 * Payoff: the golden cup he took half a life to lift rises in a beam of light beside him, three stars, fireworks in the
 * team colors, flashes all over the stands; ¡CAMPEÓN! / …habla poco y mete muchos.
 * (National-team colors only: no crests, no sponsors, no real trophy's shape, no real person's face.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, burst, cheer, drizzle, every, flashOf, later, plate, score } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { smooth } from './kitC';
import { aside, ngon, rnd, starfield, streak, twinkle } from './kitD';
import { at, ball, bits, comic, cup, floodlight, giant, pitchFront, pre, standsFront, wavingFlag, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const CEL = 0x75aadb;
const CEL_D = 0x4f86bd;
const WHITE = 0xffffff;
const GOLD = 0xe6c34a;
const SKY = [0x060a1a, 0x0d1736, 0x1a2b58, 0x2c4479];
const GRASS: [number, number] = [0x2f8f3e, 0x287d36];
const FANS = [CEL, WHITE, CEL, WHITE, 0xf3e2c4, 0x2a2a30, 0xd9772a, 0x9a9aa6];
const FLAG = [CEL, WHITE, CEL];
const TOP = 150;
const HZ = 560;

/** a five-point star (gold), r = outer radius */
function star(g: Graphics, x: number, y: number, r: number, col = GOLD) {
  const p: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  return g.poly(p).fill(col).stroke({ width: Math.max(2, r * 0.12), color: C.ink, join: 'round' });
}

/** the goal on the horizon (posts, crossbar, a net of a few strands), origin at its base center, w wide */
function goal(w: number) {
  const g = new Graphics();
  const h = w * 0.36;
  for (let i = 1; i < 6; i++) g.poly(streak(-w / 2 + (i * w) / 6, -h, -w / 2 + (i * w) / 6 + w * 0.04, -h * 0.1, 0.8, 0.8)).fill({ color: WHITE, alpha: 0.5 });
  for (let i = 1; i < 3; i++) g.rect(-w / 2, -h + (i * h) / 3, w, 1.4).fill({ color: WHITE, alpha: 0.5 });
  g.rect(-w / 2 - 3, -h, 5, h).fill(WHITE).rect(w / 2 - 2, -h, 5, h).fill(WHITE).rect(-w / 2 - 3, -h - 3, w + 8, 5).fill(WHITE);
  return g;
}

/** the night stadium (sky, floodlights, stands, pitch) for a w×h scene; k scales the people */
function stadium(w: number, h: number, top: number, hz: number, k: number, seed: number) {
  const k0 = new Container();
  const sky = vgrad(new Graphics(), 0, 0, w, hz, SKY, 14);
  starfield(sky, 0, 0, w, top * 0.9, Math.round(w / 30), seed, 0xffffff, 2.2 * Math.max(0.5, k));
  const lights = new Graphics();
  const s = 34 * k;
  for (const x of [w * 0.06, w * 0.94]) {
    for (let i = 6; i >= 1; i--) lights.poly(ngon(x, top - 3.6 * s, s * 0.9 * i, s * 0.6 * i, 18)).fill({ color: 0xdfeaff, alpha: 0.045 });
    floodlight(lights, x, top - 30 * k, s);
  }
  const st = standsFront(w, top, hz, { k, seed, cols: FANS, seat: [0x1d2f5c, 0x24386b], wall: [CEL, WHITE], flag: FLAG });
  const pitch = pitchFront(new Graphics(), w, h, hz, GRASS, k);
  k0.addChild(sky, lights, st.tier, ...st.rows, pitch);
  return { k: k0, rows: st.rows };
}

interface St {
  rows: Graphics[];
  row0: number[];
  cheer: { v: number };
  flashes: Graphics;
  takeover: Container[];
}
const S = stash<St>();

export const miaussi: Signature = {
  dark: true,
  frame: CEL,
  tag: 'UNIVERSO DE LA GAMBETA',
  open(c: SigCtx) {
    const sd = stadium(W, H, TOP, HZ, 1, 10);
    const net = goal(170);
    net.position.set(1640, HZ + 30);
    sd.k.addChild(net);
    const flashes = new Graphics();
    sd.k.addChild(flashes);
    c.back.addChild(sd.k);
    hideDisc(c, 0.2);
    const row0 = sd.rows.map((g) => g.y);
    const cheerV = { v: 0.2 };
    const takeover: Container[] = [];
    S.set(c, { rows: sd.rows, row0, cheer: cheerV, flashes, takeover });
    if (!c.reduce) {
      every(c, 30, (t) => {
        sd.rows.forEach((g, i) => {
          if (g.destroyed) return;
          g.y = row0[i] - Math.max(0, Math.sin(t * (8 + i * 0.7) + i * 1.9)) * 9 * cheerV.v;
        });
      });
    }
    if (c.short) return;

    // the giants: four defenders in shadow, twice his size, rising around him
    const G: [number, number, number][] = [
      [600, 950, 74],
      [1330, 950, 74],
      [250, 1030, 84],
      [1680, 1030, 84],
    ];
    const giants = G.map(([x, y, s], i) => {
      const g = giant(s, 0x1a1420, CEL, 0xffe14d, 0x5a1f2e, 0x2a1220);
      g.position.set(x, y);
      if (x > W / 2) g.scale.x = -1;
      c.back.addChild(g);
      if (!c.reduce) gsap.from(g, { y: y + 520, duration: 0.32, delay: 0.04 + i * 0.05, ease: 'power3.out' });
      return g;
    });

    // the slalom: a smooth path from his feet between their feet, into the net
    const P = smooth(
      [1074, 712, 860, 830, 560, 1010, 380, 930, 190, 1040, 520, 1060, 900, 1020, 1240, 1050, 1420, 990, 1300, 900, 1560, 880, 1790, 1010, 1830, 800, 1650, 600],
      8,
      false,
    );
    const n = P.length / 2;
    const near = (gx: number, gy: number) => {
      let best = 0;
      let bd = 1e9;
      for (let i = 0; i < n; i++) {
        const d = Math.hypot(P[i * 2] - gx, P[i * 2 + 1] - gy);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best / (n - 1);
    };
    const T0 = 0.45;
    const TD = 1.0;
    const trail = new Graphics();
    const bl = new Container();
    bl.addChild(ball(20));
    c.back.addChild(trail, bl);
    takeover.push(trail, bl, ...giants);
    const draw = (u: number) => {
      if (trail.destroyed) return;
      trail.clear();
      const m = Math.max(2, Math.floor(u * (n - 1)) + 1);
      const L: number[] = [];
      const R: number[] = [];
      const L2: number[] = [];
      const R2: number[] = [];
      for (let i = 0; i < m; i++) {
        const j = Math.min(n - 1, i + 1);
        const q = Math.max(0, i - 1);
        const dx = P[j * 2] - P[q * 2];
        const dy = P[j * 2 + 1] - P[q * 2 + 1];
        const d = Math.hypot(dx, dy) || 1;
        const w = 3 + 15 * (i / m);
        const x = P[i * 2];
        const y = P[i * 2 + 1];
        L.push(x - (dy / d) * w, y + (dx / d) * w);
        R.unshift(x + (dy / d) * w, y - (dx / d) * w);
        L2.push(x - (dy / d) * w * 0.35, y + (dx / d) * w * 0.35);
        R2.unshift(x + (dy / d) * w * 0.35, y - (dx / d) * w * 0.35);
      }
      trail.poly([...L, ...R]).fill({ color: CEL, alpha: 0.6 });
      trail.poly([...L2, ...R2]).fill({ color: WHITE, alpha: 0.9 });
      if (!bl.destroyed) {
        const i = m - 1;
        bl.position.set(P[i * 2], P[i * 2 + 1] - 14);
        bl.rotation = u * 30;
        bl.scale.set(1.15 - 0.65 * Math.max(0, (u - 0.85) / 0.15));
      }
    };
    const fallAt = G.map(([x, y]) => near(x, y));
    if (c.reduce) {
      for (const g of giants) g.visible = false;
      draw(1);
    } else {
      bl.position.set(P[0], P[1] - 14);
      bl.alpha = 0;
      later(c, T0, () => !bl.destroyed && (bl.alpha = 1));
      trail.alpha = 1;
      const prog = { u: 0 };
      gsap.to(prog, { u: 1, duration: TD, delay: T0, ease: 'none', onUpdate: () => !trail.destroyed && draw(prog.u) });
      // each giant spins and falls on its tail as the ball goes by
      fallAt.forEach((u, i) => {
        at(c, T0 + u * TD, () => {
          const g = giants[i];
          if (g.destroyed) return;
          const d = G[i][0] < W / 2 ? -1 : 1;
          gsap.to(g, { rotation: d * 1.25, duration: 0.42, ease: 'power2.in' });
          gsap.to(g, { y: g.y + 260, alpha: 0, duration: 0.4, delay: 0.22, ease: 'power2.in' });
          sfx('whoosh', 1.3 + i * 0.12);
          later(c, 0.18, () => sfx('hit', 0.55));
        });
      });
    }
    later(c, T0 + TD + 0.6, () => {
      if (!trail.destroyed) gsap.to(trail, { alpha: 0, duration: 0.4 });
      if (!bl.destroyed) gsap.to(bl, { alpha: 0, duration: 0.3, onComplete: () => destroyTree(bl) });
      for (const g of giants) destroyTree(g);
    });

    // the words: built now (they rasterize under the break), shown on their beats
    const stamp = pre(c, plate('«MUY BAJITO PARA JUGAR»', WHITE, C.ink, 46, C.ink), W / 2, 170, -0.04);
    const oles = G.map(([x], i) => pre(c, comic('¡OLÉ!', WHITE, 70), x < W / 2 ? 300 + i * 120 : 1560 - (i - 1) * 110, 250 + (i % 2) * 70, (i % 2 ? 1 : -1) * 0.12));
    const gam = pre(c, comic('¡GAMBETA!', CEL, 160), 560, 330, -0.1);
    at(c, 0.12, () => {
      stamp(1.1);
      sfx('sting', 1.5);
      c.shaker.add(0.12);
    });
    fallAt.forEach((u, i) => at(c, T0 + u * TD + 0.15, () => oles[i](0.5, { from: 1.8 })));
    at(c, T0 + TD + 0.02, () => {
      if (!net.destroyed && !c.reduce) gsap.fromTo(net.scale, { x: 1.25, y: 1.3 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
      gam(0.75);
      sfx('boom', 1.1);
      c.shaker.add(0.25);
      cheerV.v = 0.7;
    });
    score(c, [
      [0.0, 'drumroll', 1.15],
      [0.4, 'charge', 1.5],
    ]);
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.0);
    sfx('bigboom', 0.9);
    c.shaker.add(0.4);
    flashOf(c, WHITE, 0.55, 0.35);
    if (st) {
      // a skip mid-dribble: the giants, the ball and its trail go
      for (const n of st.takeover) if (!n.destroyed) gsap.to(n, { alpha: 0, duration: 0.25, onComplete: () => destroyTree(n) });
      st.cheer.v = 1;
      gsap.to(st.cheer, { v: 0.35, delay: 2.4, duration: 1.2 });
      // flashes all over the stands
      const fl = st.flashes;
      const r = rnd(5);
      if (!c.reduce)
        every(c, 12, () => {
          if (fl.destroyed) return;
          fl.clear();
          for (let i = 0; i < 7; i++) fl.poly(twinkle(r() * W, TOP + 20 + r() * (HZ - TOP - 60), 7 + r() * 9)).fill({ color: WHITE, alpha: 0.9 });
        });
    }
    // the cup rises in a beam of light beside him
    const k = new Container();
    // (a duplicate's star bar sits on the right: the cup moves out of its way)
    const cx = c.short ? 1790 : 1440;
    const beam = new Graphics().poly([cx - 30, -40, cx + 30, -40, cx + 160, 900, cx - 160, 900]).fill({ color: 0xfff3c4, alpha: 0.16 });
    const halo = new Graphics();
    for (let i = 7; i >= 1; i--) halo.poly(ngon(cx, 690, 34 * i, 34 * i, 20)).fill({ color: GOLD, alpha: 0.05 });
    const cg = cup(new Graphics(), 0, 0, c.short ? 82 : 100);
    cg.position.set(cx, c.short ? 900 : 880);
    const stars = new Graphics();
    k.addChild(beam, halo, cg, stars);
    c.back.addChild(k);
    if (!c.reduce) {
      gsap.from(cg, { y: 1220, duration: 0.7, ease: 'back.out(1.2)' });
      gsap.from([beam, halo], { alpha: 0, duration: 0.4 });
    }
    // (a duplicate's star bar already has its stars there: the three go only on a first reveal)
    for (let i = 0; i < (c.short ? 0 : 3); i++)
      later(c, 0.45 + i * 0.22, () => {
        if (stars.destroyed) return;
        star(stars, cx - 80 + i * 80, 560 - (i === 1 ? 30 : 0), 26);
        sfx('gem', 1.6 + i * 0.2);
      });
    // fireworks in the team colors over the stands
    for (const [x, y, d] of [
      [330, 140, 0.1],
      [1640, 110, 0.35],
      [700, 90, 0.6],
      [1200, 130, 0.85],
    ] as const)
      later(c, d, () => {
        sfx('pop', 0.8 + Math.random() * 0.4);
        burst(c, c.back, (i) => new Graphics().poly(twinkle(0, 0, 9)).fill(i % 3 === 0 ? GOLD : i % 3 === 1 ? CEL : WHITE), 18, x, y, 230, 1.0);
      });
    burst(c, c.fg, bits([CEL, WHITE, GOLD]), 34, W / 2, c.catY - 80, 900, 1.5);
    drizzle(c, c.back, () => new Graphics().rect(-9, -5, 18, 10).fill(Math.random() < 0.5 ? CEL : WHITE), 0.12, 3);
    cheer(c, "¡CAMPEÓN!", 0xffe14d, 136, 2.2);
    aside(c, '…habla poco y mete muchos.', WHITE, { delay: 0.55, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.35, h / 1080);
    const top = h * 0.16;
    const hz = h * 0.56;
    const sd = stadium(w, h, top, hz, u, 21);
    k.addChild(sd.k);
    // the cup on the right in its beam, three stars over it
    const cx = w / 2 + Math.min(w * 0.36, m * 0.62);
    const deco = new Graphics();
    deco.poly([cx - m * 0.03, 0, cx + m * 0.03, 0, cx + m * 0.16, h * 0.9, cx - m * 0.16, h * 0.9]).fill({ color: 0xfff3c4, alpha: 0.14 });
    for (let i = 6; i >= 1; i--) deco.poly(ngon(cx, h * 0.62, m * 0.035 * i, m * 0.035 * i, 18)).fill({ color: GOLD, alpha: 0.05 });
    cup(deco, cx, h * 0.84, m * 0.1);
    for (let i = 0; i < 3; i++) star(deco, cx - m * 0.08 + i * m * 0.08, h * 0.5 - (i === 1 ? m * 0.03 : 0), m * 0.026);
    k.addChild(deco);
    // two big flags waving in the foreground (left)
    const flags = new Graphics();
    const fx = w / 2 - Math.min(w * 0.4, m * 0.66);
    const drawFlags = (t: number) => {
      flags.clear();
      wavingFlag(flags, fx, h, h * 0.62, m * 0.32, m * 0.2, FLAG, t, 1, false);
      wavingFlag(flags, fx - m * 0.12, h, h * 0.46, m * 0.26, m * 0.16, FLAG, t + 0.7, -1, false);
    };
    drawFlags(0.3);
    const fl = new Graphics();
    k.addChild(flags, fl);
    const row0 = sd.rows.map((g) => g.y);
    if (live) {
      const r = rnd(9);
      liveLoop(k, (t) => {
        drawFlags(t);
        sd.rows.forEach((g, i) => (g.y = row0[i] - Math.max(0, Math.sin(t * (5 + i * 0.6) + i * 1.3)) * 4 * u));
        fl.clear();
        for (let i = 0; i < Math.max(2, Math.round(w / 500)); i++) fl.poly(twinkle(r() * w, top + r() * (hz - top - 10 * u), (5 + r() * 7) * Math.max(0.6, u))).fill({ color: WHITE, alpha: 0.85 });
      });
    }
    return k;
  },
};
