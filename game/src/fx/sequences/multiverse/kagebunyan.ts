/**
 * Kagebunyan: the shinobi universe (an orange-ninja anime). A late-afternoon hidden village: the cliff with four great
 * cat faces carved in the rock, roofs and round water tanks down the valley, and the tiled ridge in front. Leaves whirl
 * around him, his paws make the sign (a ring of light); ¡POF! ¡POF! ¡POF!: white smoke, and the silhouette becomes
 * three… then twelve, running in a file along the ridge, arms trailing; shuriken whistle past; ¡MIL MICHIS!
 * Payoff: every clone fills with color at once, then each one vanishes in its own puff; ¡MIL CLONES, MIL MIAUS! / …lo juran
 * los mil.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { SilhouetteFilter } from '../../filters';
import { type Signature, type SigCtx, arrive, burst, every, later } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { drive, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { type Head, band, copyOf, prepHead, prepWord, show, showHead } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';

const ORANGE = 0xff7a1a;
const SKY = [0xf08a3a, 0xf8ad5a, 0xffd08a, 0xffe8bc];
const ROCK = 0xc0a07c;
const ROCK_D = 0x6a4c30;
const LEAF = [0x4caf50, 0x7cc84a, 0x2e8b3a];
const SPECIES = 'xp_kagebunyan';

/** one carved cat face in the cliff (center x, y; s = its height) */
function face(g: Graphics, x: number, y: number, s: number, kind: number) {
  const q = s / 200;
  g.poly([x - 78 * q, y - 40 * q, x - 70 * q, y - 120 * q, x - 30 * q, y - 76 * q]).fill(ROCK_D);
  g.poly([x + 78 * q, y - 40 * q, x + 70 * q, y - 120 * q, x + 30 * q, y - 76 * q]).fill(ROCK_D);
  g.poly(ngon(x + 8 * q, y + 8 * q, 86 * q, 96 * q, 16)).fill({ color: ROCK_D, alpha: 0.55 });
  g.poly(ngon(x, y, 82 * q, 92 * q, 16)).fill(0xe2c8a0);
  g.poly(ngon(x + 18 * q, y + 14 * q, 62 * q, 74 * q, 16)).fill({ color: 0xc0a07c, alpha: 0.6 });
  // eyes: closed arcs, or one stern pair
  for (const e of [-1, 1]) {
    if (kind % 2) g.poly(streak(x + e * 22 * q, y - 10 * q, x + e * 50 * q, y - 16 * q, 5 * q, 5 * q)).fill(ROCK_D);
    else g.poly([x + e * 18 * q, y - 8 * q, x + e * 34 * q, y - 20 * q, x + e * 52 * q, y - 8 * q, x + e * 34 * q, y - 14 * q]).fill(ROCK_D);
  }
  g.poly([x - 9 * q, y + 18 * q, x + 9 * q, y + 18 * q, x, y + 30 * q]).fill(ROCK_D);
  g.poly([x - 22 * q, y + 44 * q, x, y + 52 * q, x + 22 * q, y + 44 * q, x, y + 48 * q]).fill(ROCK_D);
  for (const e of [-1, 1]) for (const dy of [26, 40]) g.poly(streak(x + e * 30 * q, y + dy * q, x + e * 84 * q, y + (dy + (dy - 33)) * q, 2.5 * q, 1.5 * q)).fill(ROCK_D);
}

/** the valley: the carved cliff, hills, roofs with water tanks (`k` scale, horizon of roofs at `ry`) */
function valley(g: Graphics, w: number, h: number, k: number, cx: number, seed: number) {
  vgrad(g, 0, 0, w, h * 0.75, SKY, 14);
  // the sun low on the right, and long clouds
  g.poly(ngon(cx + 640 * k, h * 0.3, 120 * k, 120 * k, 24)).fill({ color: 0xfff2c8, alpha: 0.9 }).poly(ngon(cx + 640 * k, h * 0.3, 190 * k, 190 * k, 24)).fill({ color: 0xfff2c8, alpha: 0.2 });
  for (let i = 0; i < 4; i++) g.poly(streak(cx - 900 * k + i * 520 * k, h * (0.12 + (i % 2) * 0.09), cx - 560 * k + i * 520 * k, h * (0.12 + (i % 2) * 0.09), 8 * k, 4 * k)).fill({ color: 0xfff0d8, alpha: 0.7 });
  // far hills
  g.poly([0, h * 0.62, w * 0.2, h * 0.5, w * 0.45, h * 0.58, w * 0.7, h * 0.47, w, h * 0.56, w, h * 0.7, 0, h * 0.7]).fill(0x8a9a6a);
  // the cliff with its four faces (left of center; a wide page repeats the range)
  const cliff = (x0: number) => {
    g.poly([x0 - 520 * k, h * 0.64, x0 - 470 * k, h * 0.2, x0 - 300 * k, h * 0.15, x0 + 380 * k, h * 0.16, x0 + 500 * k, h * 0.26, x0 + 540 * k, h * 0.64]).fill(ROCK);
    g.poly([x0 - 470 * k, h * 0.2, x0 - 300 * k, h * 0.15, x0 + 380 * k, h * 0.16, x0 + 500 * k, h * 0.26, x0 + 500 * k, h * 0.3, x0 - 480 * k, h * 0.26]).fill(0x6a8a4a);
    for (let i = 0; i < 4; i++) face(g, x0 - 360 * k + i * 240 * k, h * 0.4, 200 * k, i);
    for (let i = 0; i < 7; i++) g.poly(streak(x0 - 500 * k + i * 160 * k, h * 0.56, x0 - 480 * k + i * 160 * k, h * 0.64, 3 * k, 6 * k)).fill({ color: ROCK_D, alpha: 0.6 });
  };
  cliff(cx - 330 * k);
  if (w > h * 2) {
    cliff(cx - 330 * k - 1300 * k);
    cliff(cx + 1100 * k);
  }
  // the roofs down the valley: cream walls, red / green / blue roofs, round water tanks
  const r = rnd(seed);
  const ROOF = [0xc8452e, 0x4a8a5a, 0x3a6aa8, 0xb8603a];
  for (let row = 0; row < 3; row++) {
    const y = h * (0.64 + row * 0.055);
    const s = (70 + row * 26) * k;
    for (let x = -s * r(); x < w + s; x += s * (1.3 + r() * 0.6)) {
      const hh = s * (0.6 + r() * 0.5);
      g.rect(x, y - hh, s, hh + h * 0.06).fill(row === 2 ? 0xf2dcb0 : 0xe2c89a);
      g.rect(x + s * 0.2, y - hh * 0.6, s * 0.18, s * 0.18).rect(x + s * 0.6, y - hh * 0.6, s * 0.18, s * 0.18).fill(0x5a4a3a);
      g.poly([x - s * 0.12, y - hh, x + s / 2, y - hh - s * 0.32, x + s * 1.12, y - hh]).fill(ROOF[Math.floor(r() * 4)]);
      if (r() < 0.3) {
        g.rect(x + s * 0.3, y - hh - s * 0.62, s * 0.06, s * 0.34).rect(x + s * 0.64, y - hh - s * 0.62, s * 0.06, s * 0.34).fill(0x6a5a4a);
        g.poly(ngon(x + s * 0.5, y - hh - s * 0.7, s * 0.3, s * 0.2, 12)).fill(0x9aa8b0);
        g.rect(x + s * 0.2, y - hh - s * 0.96, s * 0.6, s * 0.26).fill(0xb8c4cc);
        g.poly(ngon(x + s * 0.5, y - hh - s * 0.96, s * 0.3, s * 0.1, 12)).fill(0xd8e0e6);
      }
    }
  }
}

/** the tiled ridge in front (top edge at `ry`): slate tiles with round ends */
function ridge(g: Graphics, w: number, h: number, ry: number, k: number) {
  g.rect(0, ry, w, h - ry).fill(0x3a4458);
  g.rect(0, ry - 16 * k, w, 26 * k).fill(0x2a3244);
  const t = 54 * k;
  for (let row = 0; row < 6; row++) {
    const y = ry + 20 * k + row * t * 0.7;
    for (let x = (row % 2) * t * 0.5 - t; x < w + t; x += t) g.poly(ngon(x, y, t * 0.46, t * 0.24, 10));
  }
  g.fill({ color: 0x4e5a72, alpha: 1 });
  for (let x = 0; x < w; x += t * 2) g.poly(ngon(x, ry - 4 * k, 14 * k, 14 * k, 8)).fill(0x22293a);
}

/** a ninja cat silhouette running with its arms trailing (origin at its feet, facing +x), `s` = height, `ph` the stride */
function runner(g: Graphics, x: number, y: number, s: number, ph: number, color: number) {
  const P = (pts: number[]) => {
    const o: number[] = [];
    for (let i = 0; i < pts.length; i += 2) o.push(x + pts[i] * s, y + pts[i + 1] * s);
    return o;
  };
  const sw = Math.sin(ph);
  g.poly(band(P([-0.1, -0.36, -0.32, -0.46, -0.42, -0.66]), 0.035 * s, 0.02 * s)).fill(color);
  g.poly(band(P([0, -0.34, 0.14 + sw * 0.1, -0.18, 0.2 + sw * 0.16, 0]), 0.05 * s, 0.04 * s)).fill(color);
  g.poly(band(P([-0.06, -0.34, -0.2 - sw * 0.1, -0.2, -0.32 - sw * 0.14, -0.06]), 0.05 * s, 0.04 * s)).fill(color);
  g.poly(P([-0.12, -0.32, -0.1, -0.62, 0.14, -0.68, 0.1, -0.34])).fill(color);
  g.poly(band(P([0, -0.6, -0.26, -0.56, -0.48, -0.5]), 0.04 * s, 0.03 * s)).fill(color);
  g.poly(ngon(x + 0.17 * s, y - 0.8 * s, 0.16 * s, 0.14 * s, 12)).fill(color);
  g.poly(P([0.06, -0.9, 0.07, -1.04, 0.15, -0.94])).fill(color);
  g.poly(P([0.21, -0.94, 0.29, -1.03, 0.31, -0.86])).fill(color);
  g.poly(P([0.03, -0.86, -0.24, -0.86 + sw * 0.04, -0.26, -0.8 + sw * 0.04, 0.03, -0.8])).fill(color);
  g.poly(P([0.03, -0.84, -0.2, -0.96 - sw * 0.04, -0.22, -0.9 - sw * 0.04, 0.03, -0.8])).fill(color);
}

/** a leaf (a pointed oval with its vein) at (x, y), length L, turned `a` */
function leaf(g: Graphics, x: number, y: number, L: number, a: number, color: number) {
  const cs = Math.cos(a);
  const sn = Math.sin(a);
  const p = [-1, 0, -0.5, -0.32, 0.2, -0.36, 1, 0, 0.2, 0.36, -0.5, 0.32];
  const o: number[] = [];
  for (let i = 0; i < p.length; i += 2) o.push(x + (p[i] * cs - p[i + 1] * sn) * L * 0.5, y + (p[i] * sn + p[i + 1] * cs) * L * 0.5);
  g.poly(o).fill(color);
  g.poly(streak(x - cs * L * 0.45, y - sn * L * 0.45, x + cs * L * 0.45, y + sn * L * 0.45, L * 0.02, L * 0.01)).fill({ color: 0x1e5a2a, alpha: 0.7 });
}

/** the whirl of leaves around (cx, cy) at time t (n leaves on a turning, breathing spiral) */
function whirl(g: Graphics, cx: number, cy: number, t: number, n: number, R: number, k: number) {
  g.clear();
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const a = u * Math.PI * 2 * 1.5 + t * (1.6 + u);
    const r = R * (0.55 + 0.5 * u) * (1 + 0.06 * Math.sin(t * 3 + i));
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.55;
    leaf(g, x, y, (26 + (i % 3) * 8) * k, a + t * 4 + i, LEAF[i % 3]);
  }
}

/** a ¡POF!: a burst of white smoke balls that swell and fade (polygons) */
function pof(c: SigCtx, layer: Container, x: number, y: number, s = 1) {
  const g = new Graphics();
  const r = rnd(Math.floor(x * 7 + y));
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 60 * s;
    g.poly(ngon(Math.cos(a) * d, Math.sin(a) * d * 0.7, (40 + r() * 34) * s, (36 + r() * 30) * s, 12)).fill({ color: i % 3 ? 0xffffff : 0xe2e6ee, alpha: 0.95 });
  }
  g.position.set(x, y);
  layer.addChild(g);
  if (c.reduce) {
    gsap.to(g, { alpha: 0, delay: 0.3, duration: 0.2, onComplete: () => destroyTree(g) });
    return g;
  }
  gsap.fromTo(g.scale, { x: 0.3, y: 0.3 }, { x: 1.25, y: 1.25, duration: 0.35, ease: 'power2.out' });
  gsap.to(g, { alpha: 0, delay: 0.2, duration: 0.35, onComplete: () => destroyTree(g) });
  return g;
}

/** a shuriken (4 blades, a hole) */
function shuriken(s: number) {
  const g = new Graphics();
  g.poly(twinkle(0, 0, 34 * s, 0.3)).fill(0x5a6474).stroke({ width: 3 * s, color: C.ink, join: 'miter' });
  g.poly(ngon(0, 0, 7 * s, 7 * s, 8)).fill(0xf8ad5a);
  return g;
}

interface Clone {
  k: Container;
  x: number;
  lane: number;
}
interface St {
  clones: Clone[];
  sil: SilhouetteFilter;
  holder: Container;
  run: { v: number };
  head: Head;
}
const S = stash<St>();
const RIDGE = 840;
const CLONE = 250;

export const kagebunyan: Signature = {
  dark: false,
  frame: ORANGE,
  tag: 'UNIVERSO SHINOBI',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    valley(g, W, H, 1, W / 2, 21);
    const rg = new Graphics();
    ridge(rg, W, H, RIDGE, 1);
    k.addChild(g, rg);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    // the whirl of leaves (behind and in front of him)
    const wb = new Graphics();
    const wf = new Graphics();
    c.behind.addChild(wb);
    c.fg.addChild(wf);
    // the clones: copies of his painting, one silhouette filter for all of them (on their holder)
    const holder = new Container();
    const sil = new SilhouetteFilter(C.ink, c.short ? 0 : 1);
    holder.filters = [sil];
    c.back.addChild(holder);
    const clones: Clone[] = [];
    const lanes = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
    for (let i = 0; i < (c.short ? 4 : 12); i++) {
      const cp = copyOf(SPECIES, CLONE).root;
      const ck = new Container();
      ck.addChild(cp);
      ck.visible = c.short || c.reduce;
      holder.addChild(ck);
      clones.push({ k: ck, x: 0, lane: lanes[i] });
    }
    const run = { v: 0 };
    const head = prepHead(c, '¡MIL CLONES, MIL MIAUS!', { fontFamily: F.comic, fontSize: 132, fill: ORANGE, letterSpacing: 3, stroke: { color: C.ink, width: 14, join: 'round' }, dropShadow: { color: 0x1b1b2f, distance: 8, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…lo juran los mil.',
      asideStyle: { fill: 0xffd23f },
      at: [450, 700],
    });
    S.set(c, { clones, sil, holder, run, head });
    // places: the file along the ridge (two lanes); they run right and wrap around. The first three appear beside him.
    const span = W + 400;
    const SHORT = [W / 2 - 640, W / 2 - 400, W / 2 + 400, W / 2 + 640];
    const FIRST = [W / 2 - 420, W / 2 + 420, W / 2 - 720];
    const base = clones.map((_, i) => (c.short ? SHORT[i] : i < 3 ? FIRST[i] : 200 + ((i - 3) / 9) * span));
    if (!c.short) [0, 1, 1].forEach((ln, i) => clones[i] && (clones[i].lane = ln));
    const dist = { v: 0 };
    const placeAll = () => {
      clones.forEach((cl, i) => {
        if (cl.k.destroyed) return;
        const x = c.short || c.reduce ? base[i] : ((((base[i] + 200 + dist.v) % span) + span) % span) - 200;
        const bob = c.reduce || c.short ? 0 : Math.abs(Math.sin(dist.v / 37 + i)) * 14 * run.v;
        const y = RIDGE - CLONE * 0.42 + cl.lane * 70 - bob;
        cl.k.position.set(x, y);
        cl.k.rotation = 0.1 * run.v;
        cl.k.scale.set(1 + cl.lane * 0.18);
      });
      holder.children.sort((a, b) => a.y - b.y);
    };
    placeAll();
    if (c.reduce)
      clones.forEach((cl, i) => {
        const RX = [W / 2 - 420, W / 2 + 420, W / 2 - 720, W / 2 + 720, 180, W - 180];
        if (i >= RX.length) cl.k.visible = false;
        else cl.k.x = RX[i];
      });
    let last = 0;
    const frame = (t: number) => {
      if (wb.destroyed) return;
      const dt = Math.min(0.1, t - last);
      last = t;
      dist.v += dt * 560 * run.v;
      whirl(wb, W / 2, c.catY + 60, t, 14, 360, 1.5);
      whirl(wf, W / 2, c.catY + 60, t + 1.7, 10, 420, 1.8);
      if (!c.reduce) placeAll();
    };
    frame(0.3);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // prepared words
    const pofs = [prepWord(c.fg, 520, 330, '¡POF!', 0xffffff, 96, -0.12), prepWord(c.fg, 1400, 300, '¡POF!', 0xffffff, 104, 0.1), prepWord(c.fg, 960, 150, '¡POF!', 0xffffff, 112, -0.04)];
    const mil = prepWord(c.fg, 470, 520, '¡MIL MICHIS!', ORANGE, 112, -0.1);
    // the sign: a ring of light at his paws
    const [hx, hy] = onCat(c, 0.66, 0.5);
    beat(c, 0.1, () => {
      sfx('charge', 1.2);
      const ring = new Graphics().poly(ngon(0, 0, 60, 60, 24)).stroke({ width: 10, color: 0xbfe8ff }).poly(twinkle(0, 0, 50)).fill(0xffffff);
      ring.position.set(hx, hy);
      c.fg.addChild(ring);
      if (!c.reduce) gsap.fromTo(ring.scale, { x: 0.2, y: 0.2 }, { x: 2.2, y: 2.2, duration: 0.4, ease: 'power2.out' });
      gsap.to(ring, { alpha: 0, delay: 0.25, duration: 0.2, onComplete: () => destroyTree(ring) });
    });
    // ¡POF! ×3 beside him (the first three), then the rest along the ridge; then they run
    for (let i = 0; i < 12; i++) {
      const d = i < 3 ? 0.35 + i * 0.18 : 0.95 + (i - 3) * 0.045;
      beat(c, d, () => {
        const cl = clones[i];
        if (!cl || cl.k.destroyed) return;
        cl.k.visible = true;
        if (i < 3) {
          sfx('pop', 0.8 + i * 0.12);
          sfx('whoosh', 1.6);
          show(c, pofs[i], 0.45, { from: 1.8 });
        } else if (i % 3 === 0) sfx('pop', 1 + i * 0.03);
        pof(c, c.fg, cl.k.x, cl.k.y + 20, i < 3 ? 1.4 : 0.9);
      });
    }
    // then the whole file runs
    if (!c.reduce) {
      beat(c, 1.25, () => {
        sfx('whoosh', 0.9);
        gsap.to(run, { v: 1, duration: 0.3, ease: 'power2.in' });
      });
      for (let i = 0; i < 6; i++) beat(c, 1.3 + i * 0.12, () => sfx('tick', 2.4 + (i % 2) * 0.3));
    }
    // shuriken whistle past
    for (let i = 0; i < 3; i++)
      beat(c, 1.45 + i * 0.12, () => {
        const s = shuriken(1.2);
        const y = 200 + i * 130;
        s.position.set(W + 60, y);
        c.fg.addChild(s);
        sfx('shoot', 1.6 + i * 0.1);
        if (c.reduce) {
          s.position.set(W - 300 - i * 120, y);
          gsap.to(s, { alpha: 0, delay: 0.5, duration: 0.2, onComplete: () => destroyTree(s) });
        } else gsap.to(s, { x: -80, y: y + 60, rotation: -14, duration: 0.5, ease: 'none', onComplete: () => destroyTree(s) });
      });
    beat(c, 1.6, () => {
      sfx('hit', 0.8);
      c.shaker.add(0.15);
      show(c, mil, 0.8, { from: 2.2 });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.1);
    c.shaker.add(0.3);
    if (st) {
      // every clone fills with color at once…
      if (c.reduce || c.short) st.sil.mix = 0;
      else drive(st.holder, st.sil.mix, 0, 0.3, (v) => (st.sil.mix = v));
      // …then each vanishes in its own puff
      if (!c.short)
        st.clones.forEach((cl, i) =>
          later(c, 0.9 + i * 0.07, () => {
            if (cl.k.destroyed || !cl.k.visible) return;
            if (i % 3 === 0) sfx('pop', 1.1 + i * 0.04);
            pof(c, c.fg, cl.k.x, cl.k.y + 10, 1.1);
            destroyTree(cl.k);
          }),
        );
    }
    burst(c, c.fg, (i) => {
      const g = new Graphics();
      leaf(g, 0, 0, 40, i, LEAF[i % 3]);
      return g;
    }, 26, W / 2, c.catY, 900, 1.5);
    showHead(c, st?.head, { dur: 2.5 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const g = new Graphics();
    valley(g, w, h, s * 1.05, w / 2, 21);
    const ry = h * 0.8;
    const rg = new Graphics();
    ridge(rg, w, h, ry, s * 1.2);
    const runners = new Graphics();
    const wl = new Graphics();
    const n = w > h * 2 ? 9 : 3;
    const drawRun = (t: number) => {
      runners.clear();
      for (let i = 0; i < n; i++) {
        const span = w + m * 0.4;
        const x = (((i / n) * span + t * m * 0.35) % span) - m * 0.2;
        runner(runners, x, ry + 4 * s - Math.abs(Math.sin(t * 12 + i)) * 8 * s, m * 0.2, t * 12 + i, 0x1b1b2f);
      }
    };
    drawRun(0.2);
    whirl(wl, w / 2, h * 0.56, 0.4, w > h * 2 ? 22 : 10, m * 0.42, s * 1.4);
    k.addChild(g, rg, runners, wl);
    if (live)
      liveLoop(k, (t) => {
        drawRun(0.2 + t);
        whirl(wl, w / 2, h * 0.56, 0.4 + t * 0.6, w > h * 2 ? 22 : 10, m * 0.42, s * 1.4);
      });
    return k;
  },
};
