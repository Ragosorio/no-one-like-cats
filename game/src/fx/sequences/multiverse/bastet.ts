/**
 * Bastet: the temple's universe (the ancient Egyptian cat goddess of the home, public domain). A stone temple at
 * night, torchlit: columns painted with rows of sitting cats, a band of glyphs along the walls, and at the back a
 * monumental gate standing open on the desert night (stars, far pyramids). A golden sun disc rises behind her black
 * silhouette; golden sand lifts off the floor and spirals around her; then the great gate swings shut by itself —
 * ¡CLONC! — and its seams light up in gold.
 * Payoff: the sun flares, a ring of glyphs closes around her, sand sparkles: ¡PROTEGIDOS! — …nadie entra sin
 * limpiarse las patas. (Not Cleogatra's Nile: no river, no daylight — black, gold and lapis in the dark.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, later, score } from './kit';
import {
  TAU,
  at,
  cardLoop,
  comic,
  glowDisc,
  glyphRow,
  hideDisc,
  ngon,
  park,
  payline,
  pre,
  rnd,
  sittingCatPts,
  stash,
  streak,
  take,
  torch,
  twinkle,
  vgrad,
  wrap,
} from './kitJ';

const GOLD = 0xe6c34a;
const GOLD_L = 0xffe27a;
const LAPIS = 0x2a4fa0;
const RED = 0xa83a2a;
const STONE = 0x6a4e30;
const STONE_L = 0x8a6a44;
const WALL = [0x1c140c, 0x2a1e12, 0x3a2a1a];

/** a painted column (origin at its base center; w wide, h tall): shaft, registers of sitting cats, lotus capital */
function column(g: Graphics, x: number, y: number, w: number, h: number, seed: number) {
  const r = rnd(seed);
  g.rect(x - w * 0.62, y - h * 0.04, w * 1.24, h * 0.04).fill(0x4a3420);
  g.rect(x - w / 2, y - h, w, h * 0.96).fill(STONE);
  g.rect(x - w / 2, y - h, w * 0.22, h * 0.96).fill({ color: STONE_L, alpha: 0.5 });
  g.rect(x + w * 0.3, y - h, w * 0.2, h * 0.96).fill({ color: 0x000000, alpha: 0.25 });
  // three painted registers, each a band with sitting cats between colored rules
  const regs = 3;
  for (let i = 0; i < regs; i++) {
    const y0 = y - h * (0.18 + i * 0.24);
    g.rect(x - w / 2, y0 - h * 0.02, w, h * 0.02).fill(LAPIS);
    g.rect(x - w / 2, y0 - h * 0.2, w, h * 0.015).fill(RED);
    const n = 2;
    for (let j = 0; j < n; j++) g.poly(sittingCatPts(x - w * 0.22 + j * w * 0.44, y0 - h * 0.025, h * 0.15, j % 2 ? -1 : 1)).fill(0x111111);
    g.poly(ngon(x, y0 - h * 0.13, w * 0.06, w * 0.06, 8)).fill(r() < 0.5 ? GOLD : LAPIS);
  }
  // the lotus capital: a flared top with petals
  const cy = y - h;
  g.poly([x - w / 2, cy, x + w / 2, cy, x + w * 0.85, cy - h * 0.08, x - w * 0.85, cy - h * 0.08]).fill(STONE_L);
  for (let i = 0; i < 5; i++) {
    const px = x - w * 0.6 + i * w * 0.3;
    g.poly([px - w * 0.14, cy - h * 0.01, px, cy - h * 0.085, px + w * 0.14, cy - h * 0.01]).fill(i % 2 ? LAPIS : 0x2a8a6a);
  }
  g.rect(x - w * 0.9, cy - h * 0.1, w * 1.8, h * 0.025).fill(GOLD);
}

/** the gate's two leaves: q 0 = swung open (edge-on at the hinges) → 1 = shut; seams glow by `glow` */
function drawDoors(g: Graphics, cx: number, top: number, bot: number, hw: number, q: number, u: number) {
  g.clear();
  const ang = (1 - q) * 1.38;
  for (const side of [-1, 1]) {
    const hinge = cx + side * hw;
    const free = hinge - side * hw * Math.cos(ang);
    const grow = Math.sin(ang) * 46 * u;
    const pts = [hinge, top, free, top - grow, free, bot + grow, hinge, bot];
    g.poly(pts).fill(0x4a2e16).stroke({ width: 4 * u, color: 0x2a180a, join: 'round' });
    // bronze bands and studs, a painted sitting cat facing the middle
    const L = (f: number, v: number): [number, number] => {
      const x = hinge + (free - hinge) * f;
      const yt = top + (top - grow - top) * f;
      const yb = bot + (bot + grow - bot) * f;
      return [x, yt + (yb - yt) * v];
    };
    for (const v of [0.12, 0.5, 0.88]) g.poly([...L(0, v - 0.015), ...L(1, v - 0.015), ...L(1, v + 0.015), ...L(0, v + 0.015)]).fill(0xb08a3a);
    if (q > 0.3) {
      const [px, py] = L(0.55, 0.42);
      g.poly(sittingCatPts(px, py + (bot - top) * 0.16, (bot - top) * 0.3 * Math.max(0.2, Math.cos(ang)), -side)).fill({ color: GOLD, alpha: 0.85 });
      for (const v of [0.12, 0.5, 0.88])
        for (const f of [0.2, 0.45, 0.7]) {
          const [sx, sy] = L(f, v);
          g.poly(ngon(sx, sy, 6 * u, 6 * u, 6)).fill(GOLD_L);
        }
    }
  }
}

/**
 * the temple (w×h): the wall with its glyph bands, the gate open on the desert night, the columns, the floor, the
 * torches (redrawn to flicker) and floating motes. `u` = h / 1080.
 */
function temple(w: number, h: number, seed: number) {
  const u = h / 1080;
  const cx = w / 2;
  const k = new Container();
  const wall = vgrad(new Graphics(), 0, 0, w, h * 0.86, WALL, 12);
  glyphRow(wall, -40 * u, h * 0.2, Math.ceil(w / (70 * u)) + 2, 70 * u, 0xd9a441, seed, 0.45);
  glyphRow(wall, -10 * u, h * 0.74, Math.ceil(w / (60 * u)) + 2, 60 * u, 0xd9a441, seed + 1, 0.35);
  wall.rect(0, h * 0.16, w, 4 * u).fill({ color: GOLD, alpha: 0.5 }).rect(0, h * 0.24, w, 4 * u).fill({ color: GOLD, alpha: 0.5 });
  // the gate: the night outside (stars, far pyramids), its frame and lintel with the winged sun
  const top = h * 0.17;
  const bot = h * 0.82;
  const hw = h * 0.36;
  const outside = vgrad(new Graphics(), cx - hw, top, hw * 2, bot - top, [0x0a1030, 0x16224a, 0x2a2a48], 8);
  const r = rnd(seed + 7);
  for (let i = 0; i < 40; i++) outside.rect(cx - hw + r() * hw * 2, top + r() * (bot - top) * 0.6, 2.5 * u, 2.5 * u).fill({ color: 0xffffff, alpha: 0.4 + r() * 0.5 });
  outside.poly([cx - hw, bot, cx - hw * 0.6, bot - h * 0.1, cx - hw * 0.3, bot, cx + hw * 0.1, bot, cx + hw * 0.5, bot - h * 0.16, cx + hw, bot]).fill(0x1a1428);
  outside.rect(cx - hw, bot - h * 0.02, hw * 2, h * 0.02).fill(0x2a2030);
  const frame = new Graphics();
  frame.poly([cx - hw - 50 * u, bot, cx - hw - 70 * u, top - 70 * u, cx + hw + 70 * u, top - 70 * u, cx + hw + 50 * u, bot, cx + hw, bot, cx + hw, top, cx - hw, top, cx - hw, bot]).fill(0x4a3420);
  frame.rect(cx - hw - 80 * u, top - 90 * u, (hw + 80 * u) * 2, 34 * u).fill(GOLD);
  // the winged sun over the gate
  const wy = top - 73 * u;
  frame.poly(ngon(cx, wy, 26 * u, 26 * u, 18)).fill(0xc8102e).stroke({ width: 3 * u, color: GOLD_L });
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++) frame.poly([cx + side * 28 * u, wy - 8 * u + i * 5 * u, cx + side * (150 - i * 22) * u, wy - 14 * u + i * 8 * u, cx + side * (150 - i * 22) * u, wy - 6 * u + i * 8 * u, cx + side * 28 * u, wy + i * 5 * u]).fill(i % 2 ? LAPIS : 0x2a8a6a);
  const doors = new Graphics();
  drawDoors(doors, cx, top, bot, hw, 0, u);
  const seams = new Graphics();
  seams.rect(cx - 4 * u, top, 8 * u, bot - top).fill(GOLD_L);
  seams.rect(cx - hw, top, hw * 2, 6 * u).fill(GOLD_L).rect(cx - hw, bot - 6 * u, hw * 2, 6 * u).fill(GOLD_L);
  seams.poly(ngon(cx, (top + bot) / 2, 46 * u, 46 * u, 16), true).stroke({ width: 6 * u, color: GOLD_L });
  seams.poly([cx - 40 * u, (top + bot) / 2, cx, (top + bot) / 2 - 22 * u, cx + 40 * u, (top + bot) / 2, cx, (top + bot) / 2 + 20 * u]).fill(GOLD_L);
  seams.alpha = 0;
  // the floor: dark polished stone with gold reflections
  const floor = new Graphics();
  floor.rect(0, h * 0.82, w, h * 0.2).fill(0x1a120a);
  for (let i = 0; i < 6; i++) floor.rect(0, h * (0.84 + i * 0.03), w, 2 * u).fill({ color: GOLD, alpha: 0.08 });
  for (let i = -6; i <= 6; i++) floor.poly(streak(cx + i * h * 0.08, h * 0.82, cx + i * h * 0.4, h * 1.02, 1.2 * u, 3 * u)).fill({ color: 0x000000, alpha: 0.35 });
  // the columns: two each side of the gate, the outer ones partly off a narrow screen
  const cols = new Graphics();
  const cw = 104 * u;
  const ch = h * 0.84;
  for (const dx of [-0.74, -0.53, 0.53, 0.74]) column(cols, cx + dx * h * 1.0 * (dx < 0 ? 1 : 1), h * 0.88, cw, ch, seed + Math.round(dx * 10));
  // the torches between the columns, their glow on the wall
  const tx = [cx - h * 0.635, cx + h * 0.635];
  const glows = tx.map((x) => {
    const gl = glowDisc(240 * u, 0xff9a3a, 0.4, 7, 24);
    gl.position.set(x, h * 0.5);
    return gl;
  });
  const fire = new Graphics();
  const drawFire = (t: number) => {
    fire.clear();
    tx.forEach((x, i) => torch(fire, x, h * 0.66, 90 * u, t + i * 1.7, 0x2a1a0e, GOLD));
    glows.forEach((gl, i) => (gl.alpha = 0.8 + 0.2 * Math.sin(t * 13 + i) * Math.sin(t * 5.3 + i * 2)));
  };
  drawFire(0);
  // motes of gold dust in the torchlight
  const motes = new Graphics();
  const mr = rnd(seed + 11);
  const ms = Array.from({ length: Math.round((w / h) * 22) }, () => ({ x: mr() * w, y: mr() * h, s: (1.5 + mr() * 2.5) * u, v: (10 + mr() * 25) * u }));
  const drawMotes = (t: number) => {
    motes.clear();
    for (const m of ms) {
      const y = (((m.y - t * m.v) % h) + h) % h;
      motes.rect(m.x + Math.sin(t + m.y) * 10 * u, y, m.s, m.s).fill({ color: GOLD_L, alpha: 0.5 });
    }
  };
  drawMotes(0);
  k.addChild(wall, outside, frame, doors, seams, floor, ...glows, cols, fire, motes);
  return { k, doors, seams, drawFire, drawMotes, u, cx, top, bot, hw };
}

/** the sun disc: gold with a bright core and long thin rays (Container; rays rotate) */
function sun(r: number) {
  const k = new Container();
  const rays = new Graphics();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    rays.poly(streak(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05, Math.cos(a) * r * (i % 2 ? 1.7 : 2.1), Math.sin(a) * r * (i % 2 ? 1.7 : 2.1), r * 0.06, r * 0.01)).fill({ color: GOLD_L, alpha: 0.75 });
  }
  const halo = glowDisc(r * 1.9, GOLD, 0.45, 8, 28);
  const disc = new Graphics().poly(ngon(0, 0, r, r, 40)).fill(GOLD).poly(ngon(0, 0, r * 0.86, r * 0.86, 36)).fill(0xf2d468).poly(ngon(-r * 0.25, -r * 0.3, r * 0.3, r * 0.22, 14)).fill({ color: 0xffffff, alpha: 0.35 });
  k.addChild(halo, rays, disc);
  return { k, rays };
}

/** a ring of glyphs (gold band with little sitting cats and eyes), radius R (one Graphics) */
function glyphRing(R: number) {
  const g = new Graphics();
  const N = 48;
  const outer: number[] = [];
  const inner: number[] = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    outer.push(Math.cos(a) * (R + 26), Math.sin(a) * (R + 26));
    inner.unshift(Math.cos(a) * (R - 26), Math.sin(a) * (R - 26));
  }
  g.poly([...outer, ...inner]).fill({ color: GOLD, alpha: 0.85 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    if (i % 2) g.poly(sittingCatPts(x, y + 16, 34, 1)).fill(0x111111);
    else g.poly([x - 16, y, x - 5, y - 8, x + 6, y - 7, x + 16, y, x + 6, y + 6, x - 5, y + 5]).fill(LAPIS);
  }
  return g;
}

interface St {
  sunK: Container | null;
  rays: Graphics | null;
  seams: Graphics;
  sand: Graphics | null;
}
const S = stash<St>();

export const bastet: Signature = {
  dark: true,
  frame: 0xe6c34a,
  tag: 'UNIVERSO DEL TEMPLO',
  open(c: SigCtx) {
    const tp = temple(W, H, 81);
    c.back.addChild(tp.k);
    hideDisc(c, 0.2);
    if (!c.short && !c.reduce) {
      tp.k.alpha = 0;
      gsap.to(tp.k, { alpha: 1, duration: 0.35 });
    }
    if (!c.reduce)
      every(c, 30, (t) => {
        if (tp.k.destroyed) return;
        tp.drawFire(t);
        tp.drawMotes(t);
      });
    // the sun disc behind her silhouette
    const sn = sun(190);
    const SY = c.catY - 120;
    sn.k.position.set(W / 2, SY);
    c.behind.addChild(sn.k);
    if (!c.reduce) every(c, 30, (t) => !sn.rays.destroyed && (sn.rays.rotation = t * 0.12));
    park(c, 'main', comic('¡PROTEGIDOS!', GOLD_L, 136));
    const st: St = { sunK: sn.k, rays: sn.rays, seams: tp.seams, sand: null };
    S.set(c, st);
    const shut = () => {
      drawDoors(tp.doors, tp.cx, tp.top, tp.bot, tp.hw, 1, tp.u);
      tp.seams.alpha = 0.85;
    };
    if (c.short) {
      shut();
      return;
    }

    // the sun rises behind her
    if (c.reduce) sn.k.alpha = 1;
    else {
      sn.k.alpha = 0;
      sn.k.y = SY + 360;
      gsap.to(sn.k, { y: SY, alpha: 1, duration: 0.8, delay: 0.1, ease: 'power2.out' });
    }
    score(c, [
      [0.08, 'charge', 0.55],
      [0.12, 'sting', 0.6],
      [0.6, 'whoosh', 0.35],
      [0.9, 'whoosh', 0.45],
      [1.3, 'whoosh', 0.3],
      [1.62, 'boom', 0.55],
      [1.64, 'shield', 0.7],
      [1.9, 'gem', 0.9],
    ]);
    // golden sand lifts off the floor and spirals up around her
    const sand = new Graphics();
    c.fg.addChildAt(sand, 0);
    st.sand = sand;
    const grains = Array.from({ length: 110 }, (_, i) => ({ a: (i / 110) * TAU * 4, d: Math.random() * 0.25, s: 3 + Math.random() * 4 }));
    const drawSand = (q: number) => {
      sand.clear();
      for (const gr of grains) {
        const p = Math.min(1, Math.max(0, q * 1.3 - gr.d));
        if (p <= 0 || p >= 1) continue;
        const a = gr.a + p * 7;
        const R = 330 - p * 120;
        const x = W / 2 + Math.cos(a) * R;
        const y = 880 - p * 680 + Math.sin(a) * 40;
        sand.poly(twinkle(x, y, gr.s * (1.2 - p * 0.5), 0.45)).fill({ color: Math.sin(a) > 0 ? GOLD_L : GOLD, alpha: 0.9 - p * 0.4 });
      }
    };
    if (!c.reduce)
      at(c, 0.5, () => {
        const p = { q: 0 };
        gsap.to(p, { q: 1, duration: 1.3, ease: 'sine.inOut', onUpdate: () => !sand.destroyed && drawSand(p.q), onComplete: () => !sand.destroyed && sand.clear() });
      });
    // the gate swings shut by itself — ¡CLONC! — and its seams light up
    const clonc = comic('¡CLONC!', GOLD_L, 120);
    const popClonc = pre(c, clonc, W / 2 - 520, 230, -0.1);
    at(c, 1.25, () => {
      if (tp.doors.destroyed) return;
      if (c.reduce) {
        shut();
        popClonc(0.6);
        return;
      }
      const p = { q: 0 };
      gsap.to(p, {
        q: 1,
        duration: 0.36,
        ease: 'power3.in',
        onUpdate: () => !tp.doors.destroyed && drawDoors(tp.doors, tp.cx, tp.top, tp.bot, tp.hw, p.q, tp.u),
        onComplete: () => {
          if (tp.seams.destroyed) return;
          c.shaker.add(0.35);
          popClonc(0.6);
          gsap.to(tp.seams, { alpha: 1, duration: 0.25 });
          gsap.to(tp.seams, { alpha: 0.7, duration: 0.5, delay: 0.3, yoyo: true, repeat: 1 });
        },
      });
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    if (st) {
      if (st.sand && !st.sand.destroyed) destroyTree(st.sand);
      if (!st.seams.destroyed) st.seams.alpha = 1;
      if (st.sunK && !st.sunK.destroyed) {
        st.sunK.alpha = 1;
        if (!c.reduce) gsap.fromTo(st.sunK.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.6, ease: 'power2.out' });
      }
    }
    sfx('sting', 0.9);
    sfx('shield', 1.1);
    later(c, 0.2, () => sfx('gem', 1.2));
    c.shaker.add(0.2);
    // a ring of glyphs closes around her
    const ring = glyphRing(330);
    ring.position.set(W / 2, c.catY + 10);
    c.behind.addChild(ring);
    if (!c.reduce) {
      gsap.fromTo(ring.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.45, ease: 'back.out(1.4)' });
      gsap.fromTo(ring, { alpha: 0 }, { alpha: 1, duration: 0.3 });
      every(c, 30, (t) => !ring.destroyed && (ring.rotation = t * 0.15));
    }
    burst(c, c.fg, (i) => new Graphics().poly(twinkle(0, 0, 10 + (i % 3) * 5, 0.4)).fill(i % 2 ? GOLD_L : GOLD), 30, W / 2, c.catY - 60, 820, 1.4);
    const main = take(c, 'main', () => comic('¡PROTEGIDOS!', GOLD_L, 136));
    payline(c, main, '…nadie entra sin limpiarse las patas.', { maxW: 680, dur: 2.6, asideStyle: { fill: 0xffe9b0 } });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const tp = temple(w, h, 83);
    drawDoors(tp.doors, tp.cx, tp.top, tp.bot, tp.hw, 1, tp.u);
    tp.seams.alpha = 0.85;
    k.addChild(tp.k);
    const sn = sun(110 * tp.u);
    sn.k.position.set(w / 2, h * 0.4);
    k.addChild(sn.k);
    if (live)
      cardLoop(k, 30, (t) => {
        tp.drawFire(t);
        tp.drawMotes(t);
        sn.rays.rotation = t * 0.12;
        tp.seams.alpha = 0.7 + 0.25 * Math.sin(t * 1.6);
      });
    return k;
  },
};


