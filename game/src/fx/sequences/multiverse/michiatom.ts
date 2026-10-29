/**
 * Michi Atom: the championship universe (a 1980s soccer anime). A pitch so long it curves away with the horizon, a
 * stadium packed with cats, «CAP. 128 · LA MISMA JUGADA»: the curling shot crosses the sky in slow motion, squashing
 * like bread, flies over the horizon… and the episode freezes on «¿Entrará?». Payoff: the ball comes back around the
 * world, the stands erupt, ¡GOOOOL!… en el capítulo que sigue.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, drizzle, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { aside, ngon, rnd, streak } from './kitD';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const SKY = [0x2a78d6, 0x5aa6ec, 0xa9d8ff, 0xdff1ff];
const GRASS_A = 0x3cae48;
const GRASS_B = 0x2e9a3c;
const STAND = 0x223052;
const SHIRT = 0x2456c8;
const FUR = [0xffffff, 0xf2a03a, 0x2a2a30, 0x9a9aa6, 0xf3e2c4, 0xd9772a, 0xffffff, 0x5a4636];

/** the soccer ball: white panels, black pentagons, a shine (r = radius; one Graphics, ~70 vertices) */
function ball(r: number): Graphics {
  const g = new Graphics();
  g.poly(ngon(0, 0, r, r, 22)).fill(0xffffff).stroke({ width: Math.max(2, r * 0.09), color: C.ink, join: 'round' });
  g.poly(ngon(0, 0, r * 0.3, r * 0.3, 5, -Math.PI / 2)).fill(C.ink);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + Math.PI / 5 + (i * 2 * Math.PI) / 5;
    g.poly(ngon(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74, r * 0.2, r * 0.13, 5, a + Math.PI / 2)).fill(C.ink);
    const b = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    g.moveTo(Math.cos(b) * r * 0.3, Math.sin(b) * r * 0.3).lineTo(Math.cos(b) * r * 0.62, Math.sin(b) * r * 0.62);
  }
  g.stroke({ width: Math.max(1.5, r * 0.06), color: C.ink, cap: 'round' });
  g.poly(ngon(-r * 0.38, -r * 0.42, r * 0.2, r * 0.1, 8, -0.7)).fill({ color: 0xffffff, alpha: 0.9 });
  return g;
}

/** an anime cumulus: stacked white puffs over a pale-blue base (polygons) */
function cumulus(g: Graphics, x: number, y: number, s: number) {
  const puffs: [number, number, number][] = [
    [-0.5, 0.05, 0.32],
    [-0.18, -0.18, 0.42],
    [0.22, -0.26, 0.48],
    [0.58, -0.04, 0.34],
    [0.05, 0.08, 0.4],
  ];
  for (const [px, py, pr] of puffs) g.poly(ngon(x + px * s, y + py * s + s * 0.08, pr * s, pr * s * 0.9, 14)).fill(0xbad8f2);
  for (const [px, py, pr] of puffs) g.poly(ngon(x + px * s, y + py * s, pr * s, pr * s * 0.9, 14)).fill(0xffffff);
  g.rect(x - s * 0.85, y + s * 0.12, s * 1.6, s * 0.28).fill(0xbad8f2);
}

/**
 * the pitch that never ends: concentric mowed bands of a planet-sized disc (its top is the horizon), in perspective;
 * `phase` scrolls them toward the viewer (we're running). Redrawn each frame: ~20 bands × 30 points.
 */
function drawPitch(g: Graphics, w: number, h: number, hz: number, R: number, phase: number, lines = true) {
  g.clear();
  const cx = w / 2;
  const cy = hz + R;
  g.rect(0, hz - 2, w, h - hz + 2).fill(GRASS_A);
  // the disc's silhouette (the curved horizon): sky-colored corners above the curve are painted by the sky; here the grass
  const yOf = (z: number) => hz + (h - hz) / z;
  const N = 22;
  const p = phase % 2;
  for (let j = -2; j < N; j++) {
    const z0 = 1 + (j - p) * 0.55;
    const z1 = z0 + 0.55;
    if (z1 <= 0.05) continue;
    const ya = z0 <= 0.05 ? h * 2 : yOf(z0);
    const yb = yOf(z1);
    const r0 = R - (ya - hz);
    const r1 = R - (yb - hz);
    if ((j & 1) === 0) continue;
    const span = (r: number) => Math.asin(Math.min(1, (w / 2 + 40) / Math.max(1, r)));
    const s0 = span(Math.max(r0, 1));
    const s1 = span(r1);
    const n = 26;
    const pts: number[] = [];
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 - s1 + (2 * s1 * i) / n;
      pts.push(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    }
    for (let i = n; i >= 0; i--) {
      const a = -Math.PI / 2 - s0 + (2 * s0 * i) / n;
      pts.push(cx + Math.cos(a) * Math.max(r0, 1), cy + Math.sin(a) * Math.max(r0, 1));
    }
    g.poly(pts).fill(GRASS_B);
  }
  // the curved horizon itself: the sky above the disc's edge (two wedges at the sides)
  const n = 30;
  const top: number[] = [];
  const s = Math.asin(Math.min(1, (w / 2 + 40) / R));
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 - s + (2 * s * i) / n;
    top.push(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
  }
  g.poly([-40, hz - 4, ...top, w + 40, hz - 4]).fill(0xdff1ff);
  if (!lines) return;
  // touchlines running to the horizon, the center circle around his feet
  const lw = Math.max(1.5, h * 0.006);
  g.poly(streak(cx - w * 0.04, hz + 2, -w * 0.25, h + 10, lw * 0.25, lw * 1.6)).fill({ color: 0xffffff, alpha: 0.9 });
  g.poly(streak(cx + w * 0.04, hz + 2, w * 1.25, h + 10, lw * 0.25, lw * 1.6)).fill({ color: 0xffffff, alpha: 0.9 });
  g.poly(streak(cx, hz + 2, cx, h + 10, lw * 0.2, lw * 1.4)).fill({ color: 0xffffff, alpha: 0.85 });
  g.poly(ngon(cx, h * 0.92, w * 0.22, h * 0.06, 28), true).stroke({ width: lw * 1.2, color: 0xffffff, alpha: 0.9 });
}

/** a cat's head in the stands (ears included): one 8-point polygon */
function head(g: Graphics, x: number, y: number, s: number, col: number) {
  g.poly([x - s, y - s * 0.1, x - s * 0.9, y - s * 1.2, x - s * 0.3, y - s * 0.7, x + s * 0.3, y - s * 0.7, x + s * 0.9, y - s * 1.2, x + s, y - s * 0.1, x + s * 0.7, y + s * 0.65, x - s * 0.7, y + s * 0.65]).fill(col);
}

/**
 * the two stands (left and right of the open sky), packed with cats: seat bands down to the curved horizon, a roof, a
 * front wall. Returns the rows (each its own Graphics so a row can jump) and the static tier. `k` scales the people
 * (1 at 1920×1080); the horizon is the pitch disc's edge (center (w/2, hz+R)).
 */
function stands(w: number, hz: number, R: number, k: number, seed: number) {
  const tier = new Graphics();
  const rows: Graphics[] = [];
  const r = rnd(seed);
  const sw = w * 0.35;
  const cx = w / 2;
  const hy = (x: number) => hz + R - Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));
  const top = (x: number) => (70 + (x / sw) * 200) * k;
  const NB = 8;
  for (const side of [-1, 1]) {
    const X = (x: number) => (side < 0 ? x : w - x);
    // seat bands (alternating blues), each a strip between two slanted lines down to the curve
    for (let i = 0; i < NB; i++) {
      const u0 = i / NB;
      const u1 = (i + 1) / NB;
      const pts: number[] = [];
      for (let j = 0; j <= 8; j++) {
        const x = (sw * j) / 8;
        pts.push(X(x), top(x) + (hy(X(x)) - top(x)) * u0);
      }
      for (let j = 8; j >= 0; j--) {
        const x = (sw * j) / 8;
        pts.push(X(x), top(x) + (hy(X(x)) - top(x)) * u1 + 1);
      }
      tier.poly(pts).fill(i % 2 ? 0x2c4f9e : STAND);
    }
    // the roof: a dark canopy with its struts, over the top rows
    tier.poly([X(-10), top(0) - 64 * k, X(sw + 26 * k), top(sw) - 30 * k, X(sw + 26 * k), top(sw) - 8 * k, X(-10), top(0) + 6 * k]).fill(0x141b30);
    for (let j = 1; j <= 4; j++) {
      const x = (sw * j) / 4.4;
      tier.poly(streak(X(x), top(x) - 40 * k + (x / sw) * 22 * k, X(x), top(x) + 6 * k, 3 * k, 3 * k)).fill(0x141b30);
    }
    tier.poly(streak(X(-10), top(0) - 60 * k, X(sw + 26 * k), top(sw) - 26 * k, 2.5 * k, 2.5 * k)).fill(0x9fb2d8);
    // the front wall along the pitch: plain colored panels (no brands)
    const wall: number[] = [];
    for (let j = 0; j <= 10; j++) {
      const x = (sw * j) / 10;
      wall.push(X(x), hy(X(x)) - 18 * k);
    }
    for (let j = 10; j >= 0; j--) {
      const x = (sw * j) / 10;
      wall.push(X(x), hy(X(x)) + 2);
    }
    tier.poly(wall).fill(0xffffff);
    for (let j = 0; j < 10; j += 2) {
      const xa = (sw * j) / 10;
      const xb = (sw * (j + 1)) / 10;
      tier.poly([X(xa), hy(X(xa)) - 15 * k, X(xb), hy(X(xb)) - 15 * k, X(xb), hy(X(xb)) - 1, X(xa), hy(X(xa)) - 1]).fill(j % 4 ? 0xc8102e : SHIRT);
    }
  }
  const NR = 7;
  for (let i = 0; i < NR; i++) {
    const g = new Graphics();
    const u = (i + 0.7) / (NR + 0.4);
    for (const side of [-1, 1]) {
      const X = (x: number) => (side < 0 ? x : w - x);
      for (let x = 10 * k + r() * 12 * k; x < sw - 14 * k; ) {
        const near = 1 - x / sw;
        const s = (8 + near * 8 + u * 4) * k * (0.85 + r() * 0.3);
        const y = top(x) + (hy(X(x)) - 18 * k - top(x)) * u;
        head(g, X(x), y, s, FUR[Math.floor(r() * FUR.length)]);
        // a few flags in the crowd (blank: team colors only)
        if (r() < 0.05) {
          const fx = X(x);
          const dir = side < 0 ? 1 : -1;
          g.poly(streak(fx, y, fx, y - s * 4.2, s * 0.12, s * 0.12)).fill(0xdddddd);
          g.poly([fx, y - s * 4.2, fx + dir * s * 3.2, y - s * 3.4, fx, y - s * 2.6]).fill(r() < 0.5 ? 0xffffff : SHIRT);
        }
        x += s * 2.2;
      }
    }
    rows.push(g);
  }
  return { tier, rows };
}

/**
 * the anime technique title: heavy yellow letters, a red outline and an ink drop shadow, tilted. One Text (one texture):
 * two big stroked copies cost a 100+ ms frame to rasterize mid-takeover.
 */
function technique(text: string, size: number) {
  const t = txt(text, {
    fontFamily: F.heavy,
    fontSize: size,
    fill: 0xffe14d,
    align: 'center',
    stroke: { color: 0xc8102e, width: size / 8, join: 'round' },
    dropShadow: { color: C.ink, distance: size / 12, angle: Math.PI / 4, blur: 0, alpha: 1 },
  });
  t.anchor.set(0.5);
  return t;
}

interface St {
  rows: Graphics[];
  row0: number[];
  cheer: { v: number };
  run: { v: number };
}
const S = stash<St>();
const HZ = 470;
const R = 2300;

export const michiatom: Signature = {
  dark: false,
  frame: SHIRT,
  tag: 'UNIVERSO DEL CAMPEONATO',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, HZ + 10, SKY, 18);
    const clouds = new Graphics();
    cumulus(clouds, 760, 150, 230);
    cumulus(clouds, 1240, 250, 170);
    cumulus(clouds, 1020, 70, 120);
    const pitch = new Graphics();
    drawPitch(pitch, W, H, HZ, R, 0);
    const st = stands(W, HZ, R, 1, 128);
    k.addChild(sky, clouds, pitch, st.tier, ...st.rows);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    const row0 = st.rows.map((g) => g.y);
    const cheerV = { v: 0.15 };
    const run = { v: c.short || c.reduce ? 0 : 3.2 };
    S.set(c, { rows: st.rows, row0, cheer: cheerV, run });
    if (!c.reduce) {
      let ph = 0;
      let last = 0;
      every(c, 30, (t) => {
        const dt = Math.min(0.1, t - last);
        last = t;
        ph += dt * run.v;
        if (!pitch.destroyed && run.v > 0.01) drawPitch(pitch, W, H, HZ, R, ph);
        if (!clouds.destroyed) clouds.x = -t * 14;
        st.rows.forEach((g, i) => {
          if (g.destroyed) return;
          const j = Math.max(0, Math.sin(t * (9 + i) + i * 1.7));
          g.y = row0[i] - j * 12 * cheerV.v;
        });
      });
    }
    if (c.short) return;

    // the episode card
    const card = new Container();
    const cb = new Graphics().rect(0, 0, 420, 96).fill(0xffffff).stroke({ width: 5, color: C.ink }).rect(0, 0, 120, 96).fill(0xc8102e);
    const n1 = txt('CAP.\n128', { fontFamily: F.heavy, fontSize: 30, fill: 0xffffff, align: 'center', lineHeight: 34 });
    n1.anchor.set(0.5);
    n1.position.set(60, 48);
    const n2 = txt('LA MISMA JUGADA', { fontFamily: F.heavy, fontSize: 28, fill: C.ink });
    n2.anchor.set(0, 0.5);
    n2.position.set(136, 48);
    card.addChild(cb, n1, n2);
    card.position.set(W - 520, H - 210);
    c.fg.addChild(card);
    if (!c.reduce) gsap.from(card, { x: W + 40, duration: 0.3, ease: 'power3.out', delay: 0.05 });
    fadeKill(card, 1.3, 0.3);
    score(c, [
      [0.0, 'drumroll', 1.1],
      [0.3, 'whoosh', 0.6],
      [0.35, 'charge', 1.3],
      [0.9, 'whoosh', 0.45],
    ]);

    // the curling shot: in from behind the camera (huge, bottom right), out toward the horizon, squashing like bread
    const b = new Container();
    const bg = ball(120);
    const trail = new Graphics();
    b.addChild(bg);
    c.back.addChild(trail);
    c.back.addChild(b);
    const path = { u: 0 };
    const at = (u: number) => {
      const x = W * 0.94 + (W / 2 + 330 - W * 0.94) * u + Math.sin(u * Math.PI) * 240;
      const y = H * 1.08 + (HZ - 4 - H * 1.08) * Math.pow(u, 0.7);
      return [x, y, 2.6 * Math.pow(1 - u, 1.6) + 0.06] as const;
    };
    const place = () => {
      if (b.destroyed) return;
      const [x, y, s] = at(path.u);
      b.position.set(x, y);
      const sq = 1 + 0.22 * Math.sin(path.u * 40);
      bg.scale.set(s * sq, s / sq);
      bg.rotation = path.u * 14;
      // motion: ghost balls along the curl
      trail.clear();
      for (let i = 1; i <= 5; i++) {
        const [px, py, ps] = at(Math.max(0, path.u - i * 0.03));
        trail.poly(ngon(px, py, ps * 120, ps * 120, 16)).fill({ color: 0xffffff, alpha: 0.3 - i * 0.05 });
      }
    };
    if (c.reduce) {
      path.u = 0.7;
      place();
    } else {
      place();
      gsap.to(path, { u: 0.55, duration: 0.55, delay: 0.25, ease: 'power2.out', onUpdate: place });
      gsap.to(path, { u: 1, duration: 0.85, delay: 0.8, ease: 'sine.inOut', onUpdate: place });
    }
    later(c, 1.75, () => {
      if (!b.destroyed) b.visible = false;
      if (!trail.destroyed) trail.clear();
    });

    // ¡TIRO CON EFECTO! (the technique's name, as the anime shouts it): built now, at the break, shown at 0.35 s
    const tq = technique('¡TIRO CON\nEFECTO!', 92);
    tq.position.set(470, 300);
    tq.rotation = -0.12;
    tq.alpha = 0.001;
    c.fg.addChild(tq);
    later(c, 0.35, () => {
      if (tq.destroyed) return;
      tq.alpha = 1;
      sfx('hit', 0.8);
      c.shaker.add(0.2);
      if (!c.reduce) gsap.fromTo(tq.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
      fadeKill(tq, 0.95, 0.25);
    });

    // the freeze: the episode stops on a still, a narrator box asks the question
    later(c, 1.45, () => {
      run.v = 0;
      if (!k.destroyed) k.tint = 0xf0dcb4;
      sfx('sting', 1.2);
      const box = new Container();
      const g = new Graphics().rect(0, 0, 820, 120).fill({ color: C.ink, alpha: 0.88 }).stroke({ width: 4, color: 0xffe14d });
      const q = txt('¿ENTRARÁ? ¡NO TE PIERDAS\nEL PRÓXIMO CAPÍTULO!', { fontFamily: F.heavy, fontSize: 34, fill: 0xffffff, lineHeight: 44 });
      q.position.set(26, 16);
      box.addChild(g, q);
      box.position.set(60, H - 190);
      c.fg.addChild(box);
      if (!c.reduce) gsap.from(box, { x: -880, duration: 0.25, ease: 'power3.out' });
      fadeKill(box, 0.95, 0.25);
    });
    later(c, 2.25, () => {
      if (!k.destroyed) k.tint = 0xffffff;
      run.v = 0.6;
    });
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('fanfare', 1.05);
    sfx('boom', 1.2);
    c.shaker.add(0.4);
    flashOf(c, 0xffffff, 0.6, 0.35);
    if (st) {
      st.cheer.v = 1;
      st.run.v = 1.6;
      gsap.to(st.cheer, { v: 0.3, delay: 2.2, duration: 1.2 });
      gsap.to(st.run, { v: 0.4, delay: 1, duration: 1 });
    }
    // the ball comes back around the world: out of the horizon, past him, into the top corner
    if (!c.reduce) {
      const b = ball(60);
      const tr = new Graphics();
      c.fg.addChild(tr, b);
      const p = { u: 0 };
      gsap.to(p, {
        u: 1,
        duration: 0.42,
        ease: 'power2.in',
        onUpdate: () => {
          if (b.destroyed) return;
          const x = W / 2 + 60 + (W * 0.9 - W / 2 - 60) * p.u + Math.sin(p.u * Math.PI) * 200;
          const y = HZ + (60 - HZ) * p.u;
          const s = 0.15 + p.u * 2.2;
          b.position.set(x, y);
          b.scale.set(s);
          b.rotation += 0.6;
          tr.clear().poly(streak(x, y, W / 2 + 60, HZ, s * 50, 4)).fill({ color: 0xffffff, alpha: 0.4 });
        },
        onComplete: () => {
          destroyTree(b);
          if (!tr.destroyed) gsap.to(tr, { alpha: 0, duration: 0.2, onComplete: () => destroyTree(tr) });
        },
      });
    }
    cheer(c, '¡GOOOOL!', 0xffe14d, 170, 2.0);
    aside(c, '…en el capítulo que sigue.', 0xffffff, { delay: 0.55, dur: 2.2 });
    // the stands throw paper: confetti in the team's colors
    burst(
      c,
      c.fg,
      (i) => new Graphics().rect(-12, -6, 24, 12).fill(i % 3 === 0 ? SHIRT : i % 3 === 1 ? 0xffffff : 0xffe14d),
      36,
      W / 2,
      c.catY - 80,
      900,
      1.5,
    );
    drizzle(c, c.back, () => new Graphics().rect(-9, -5, 18, 10).fill(Math.random() < 0.5 ? SHIRT : 0xffffff), 0.12, 3);
  },
  card(w: number, h: number, isLive: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 300;
    const hz = h * 0.42;
    const sky = vgrad(new Graphics(), 0, 0, w, hz + 4, SKY, 12);
    const clouds = new Graphics();
    const r = rnd(7);
    const nc = Math.max(3, Math.round(w / (m * 0.9)));
    for (let i = 0; i < nc; i++) cumulus(clouds, ((i + 0.5) / nc) * w + (r() - 0.5) * m * 0.2, hz * (0.25 + r() * 0.35), m * (0.28 + r() * 0.12));
    const pitch = new Graphics();
    const RR = Math.max(w, h) * 2.4;
    drawPitch(pitch, w, h, hz, RR, 0);
    const st = stands(w, hz, RR, u * 0.9, 31);
    // the stands only reach the sides of a wide card: scale them to the card's height
    k.addChild(sky, clouds, pitch, st.tier, ...st.rows);
    // the ball, high in the sky on its curl, with its trail
    const bl = new Container();
    const trail = new Graphics();
    const b = ball(m * 0.07);
    bl.addChild(trail, b);
    k.addChild(bl);
    const curl = (q: number) => [w * 0.5 + Math.sin(q * Math.PI * 2) * Math.min(w * 0.42, m * 0.9), hz * (0.28 + 0.12 * Math.cos(q * Math.PI * 2))] as const;
    const pose = (q: number) => {
      const [x, y] = curl(q);
      b.position.set(x, y);
      b.rotation = q * 20;
      trail.clear();
      for (let i = 1; i <= 5; i++) {
        const [px, py] = curl(q - i * 0.025);
        const [qx, qy] = curl(q - (i - 1) * 0.025);
        trail.poly(streak(qx, qy, px, py, m * 0.05 * (1 - i / 6), m * 0.05 * (1 - (i + 1) / 6))).fill({ color: 0xffffff, alpha: 0.5 - i * 0.08 });
      }
    };
    pose(0.12);
    const row0 = st.rows.map((g) => g.y);
    if (isLive)
      liveLoop(k, (t) => {
        drawPitch(pitch, w, h, hz, RR, t * 0.8);
        clouds.x = -((t * m * 0.02) % (m * 0.6));
        pose(0.12 + t * 0.06);
        st.rows.forEach((g, i) => (g.y = row0[i] - Math.max(0, Math.sin(t * (6 + i) + i)) * 5 * u));
      });
    return k;
  },
};

