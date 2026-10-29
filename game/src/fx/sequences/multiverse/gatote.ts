/**
 * Don Gatote de la Mancha: the windmill universe (Cervantes, public domain). A yellow plain out of an old book plate —
 * a ruled sky, a white sun, furrows running to the horizon, white windmills turning on the ridge — and he gallops (a
 * bob, a trail of dust, hoofbeats) with the lance in rest. The nearest windmill grows into a GIANT: its windows open as
 * angry eyes, its door bares teeth, its sails grow fists (¡GRRR!). Far to the left his squire on a donkey shouts
 * «¡SEÑOR, QUE SON MOLINOS!».
 * Payoff: the charge — a streak to the giant, an explosion of dust, the sails spin wild and shed slats, the giant's eyes
 * spin dizzy and go out: just a windmill again; ¡A ELLOS! (…eran molinos)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, later, score, word } from './kit';
import { cardLoop, hideDisc } from './kitA';
import { borrowCat, puff, rng, stash, vgrad } from './kitB';
import { TAU, arcPts, beat, ell, engrave, glowDisc, headline, paid, pay, say } from './kitC';

const SKY = [0xf6ecca, 0xefdcaa, 0xe6cd8e];
const OCHRE = [0xdcaa3e, 0xcf9a30];
const SEPIA = 0x5a4020;
const WALL = 0xf6f1e4;
const ROOF = 0x4a3826;
const WOOD = 0x5a4430;
const DUST = 0xead6a2;
const HZ = 640;

/** a La Mancha windmill (origin at its base): white tower, dark cap, four lattice sails; `giant` bits start hidden */
function windmill(s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.poly([-78 * s, 0, 78 * s, 0, 62 * s, -300 * s, -62 * s, -300 * s]).fill(WALL).stroke({ width: 4 * s, color: SEPIA });
  // engraved shading on the tower's shadow side
  for (let y = -290; y < 0; y += 12) g.rect(30 * s, y * s, (44 + y * -0.05) * s, 3 * s).fill({ color: SEPIA, alpha: 0.28 });
  g.poly([-76 * s, -300 * s, 76 * s, -300 * s, 0, -386 * s]).fill(ROOF).stroke({ width: 4 * s, color: 0x2a1e12, join: 'round' });
  // the windows and the door (plain; the face lies on top)
  g.rect(-34 * s, -228 * s, 20 * s, 26 * s).fill(0x3a2a18).rect(14 * s, -228 * s, 20 * s, 26 * s).fill(0x3a2a18);
  g.poly([-24 * s, 0, -24 * s, -60 * s, ...arcPts(0, -60 * s, 24 * s, 22 * s, Math.PI, TAU, 8), 24 * s, 0]).fill(0x3a2a18);
  // the giant's face
  const face = new Graphics();
  for (const sx of [-1, 1]) {
    face.poly(ell(sx * 24 * s, -214 * s, 22 * s, 18 * s, 14)).fill(0xfff6dc).stroke({ width: 3 * s, color: 0x2a1e12 });
    face.poly(ell(sx * 20 * s, -212 * s, 9 * s, 10 * s, 10)).fill(0xc8102e);
    face.poly([sx * 4 * s, -236 * s, sx * 50 * s, -250 * s, sx * 50 * s, -240 * s, sx * 6 * s, -226 * s]).fill(0x2a1e12);
  }
  face.poly([-30 * s, -4 * s, -30 * s, -64 * s, ...arcPts(0, -64 * s, 30 * s, 26 * s, Math.PI, TAU, 8), 30 * s, -4 * s]).fill(0x1a0e08);
  const teeth: number[] = [-28 * s, -64 * s];
  for (let i = 0; i <= 6; i++) teeth.push(-28 * s + i * (56 / 6) * s, -64 * s + (i % 2 ? 16 : 0) * s);
  face.poly([...teeth, 28 * s, -64 * s]).fill(0xfff6dc);
  face.alpha = 0;
  // the dizzy eyes (after the charge)
  const dizzy = new Graphics();
  for (const sx of [-1, 1]) {
    const p: number[] = [];
    for (let i = 0; i < 22; i++) {
      const a = i * 0.7;
      const r = (2 + i * 0.85) * s;
      p.push(sx * 24 * s + Math.cos(a) * r, -214 * s + Math.sin(a) * r);
    }
    dizzy.poly(ell(sx * 24 * s, -214 * s, 22 * s, 18 * s, 14)).fill(0xfff6dc).poly(p, false).stroke({ width: 3 * s, color: 0x2a1e12 });
  }
  dizzy.alpha = 0;
  // the sails turn around the hub
  const sails = new Container();
  sails.position.set(0, -330 * s);
  const sg = new Graphics();
  const fists = new Graphics();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    const P = (x: number, y: number): [number, number] => [x * cs - y * sn, x * sn + y * cs];
    const L = 330 * s;
    const wd = 50 * s;
    // spar
    const [ax, ay] = P(0, -6 * s);
    const [bx, by] = P(L, -6 * s);
    const [cx2, cy2] = P(L, 6 * s);
    const [dx, dy] = P(0, 6 * s);
    sg.poly([ax, ay, bx, by, cx2, cy2, dx, dy]).fill(WOOD);
    // the lattice frame
    const q = [P(60 * s, 6 * s), P(L, 6 * s), P(L, wd), P(60 * s, wd)].flat();
    sg.poly(q).fill({ color: 0xe8dcc0, alpha: 0.55 }).stroke({ width: 3 * s, color: WOOD });
    for (let j = 1; j < 7; j++) {
      const [x1, y1] = P(60 * s + (j * (L - 60 * s)) / 7, 6 * s);
      const [x2, y2] = P(60 * s + (j * (L - 60 * s)) / 7, wd);
      sg.moveTo(x1, y1).lineTo(x2, y2);
    }
    const [m1x, m1y] = P(60 * s, wd * 0.55);
    const [m2x, m2y] = P(L, wd * 0.55);
    sg.moveTo(m1x, m1y).lineTo(m2x, m2y).stroke({ width: 2 * s, color: WOOD });
    // a fist at the tip
    const [fx, fy] = P(L + 26 * s, wd * 0.4);
    fists.poly(ell(fx, fy, 30 * s, 26 * s, 14)).fill(0xe8c49a).stroke({ width: 3 * s, color: 0x2a1e12 });
    for (let j = -1; j <= 1; j++) {
      const [kx, ky] = P(L + 44 * s, wd * 0.4 + j * 12 * s);
      fists.poly(ell(kx, ky, 8 * s, 6 * s, 8)).fill(0xd8b088).stroke({ width: 2 * s, color: 0x2a1e12 });
    }
  }
  sg.poly(ell(0, 0, 16 * s, 16 * s, 12)).fill(ROOF).stroke({ width: 3 * s, color: 0x2a1e12 });
  fists.alpha = 0;
  sails.addChild(sg, fists);
  k.addChild(g, face, dizzy, sails);
  return { k, sails, face, dizzy, fists };
}

/** the squire on his donkey, in silhouette (origin at the ground), facing right */
function squire(s = 1) {
  const g = new Graphics();
  const col = 0x3a2a1a;
  g.poly(ell(0, -64 * s, 62 * s, 30 * s, 16)).fill(col);
  for (const x of [-44, -28, 30, 46]) g.rect((x - 5) * s, -46 * s, 10 * s, 46 * s).fill(col);
  g.poly([48 * s, -78 * s, 92 * s, -110 * s, 108 * s, -96 * s, 64 * s, -56 * s]).fill(col);
  g.poly(ell(102 * s, -100 * s, 18 * s, 12 * s, 10)).fill(col);
  g.poly([92 * s, -110 * s, 88 * s, -150 * s, 98 * s, -112 * s]).fill(col).poly([102 * s, -110 * s, 108 * s, -148 * s, 110 * s, -108 * s]).fill(col);
  g.moveTo(-60 * s, -70 * s).lineTo(-80 * s, -30 * s).stroke({ width: 5 * s, color: col });
  // the squire: round, with a wide hat
  g.poly(ell(0, -122 * s, 34 * s, 40 * s, 16)).fill(col);
  g.poly(ell(4 * s, -176 * s, 20 * s, 20 * s, 12)).fill(col);
  g.poly(ell(4 * s, -190 * s, 44 * s, 8 * s, 14)).fill(col).poly(ell(4 * s, -200 * s, 20 * s, 14 * s, 10)).fill(col);
  g.rect(-10 * s, -96 * s, 12 * s, 40 * s).fill(col);
  return g;
}

/** the plain: sky with engraved rules, the sun, flat clouds, the ridge and the furrows (spans w; scaled by u) */
function plain(w: number, h: number, u: number, hz: number) {
  const g = new Graphics();
  vgrad(g, 0, 0, w, hz + 2, SKY, 18);
  engrave(g, 0, 6 * u, w, hz * 0.8, 9 * u, 2.6 * u, 0.3 * u, SEPIA, 0.22);
  const sun = new Graphics();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    sun.poly([0, 0, Math.cos(a - 0.08) * 260 * u, Math.sin(a - 0.08) * 260 * u, Math.cos(a + 0.08) * 260 * u, Math.sin(a + 0.08) * 260 * u]).fill({ color: 0xfff6d6, alpha: 0.35 });
  }
  sun.poly(ell(0, 0, 78 * u, 78 * u, 28)).fill(0xfff8e4).stroke({ width: 3 * u, color: SEPIA, alpha: 0.4 });
  sun.position.set(w / 2 - 600 * u, 190 * u);
  const r = rng(6);
  for (let x = 120 * u; x < w; x += 420 * u) {
    const y = (90 + r() * 120) * u;
    g.poly(ell(x, y, (110 + r() * 60) * u, 18 * u, 18)).fill({ color: 0xfffbea, alpha: 0.85 });
    engrave(g, x - 90 * u, y + 2 * u, 180 * u, 14 * u, 5 * u, 1.2 * u, 1.2 * u, SEPIA, 0.2);
  }
  // the ridge
  const ridge: number[] = [0, hz + 20 * u];
  for (let x = 0; x <= w; x += 60 * u) ridge.push(x, hz - 18 * u - Math.sin(x / (300 * u)) * 22 * u - Math.sin(x / (120 * u)) * 6 * u);
  ridge.push(w, hz + 20 * u);
  const ground = new Graphics();
  ground.poly(ridge).fill(0xc9a456);
  ground.rect(0, hz, w, h - hz).fill(OCHRE[0]);
  // furrows to a vanishing point
  const vx = w / 2;
  const vy = hz - 30 * u;
  for (let i = -30; i < 30; i++) {
    const x0 = w / 2 + i * 120 * u;
    const x1 = x0 + 120 * u;
    const t = (hz - vy) / (h - vy);
    if (i % 2) ground.poly([vx + (x0 - vx) * t, hz, vx + (x1 - vx) * t, hz, x1, h, x0, h]).fill(OCHRE[1]);
  }
  // a dusty road winding to the horizon
  ground.poly([w / 2 - 40 * u, h, w / 2 + 200 * u, h, w / 2 + 40 * u, hz + 60 * u, w / 2 + 10 * u, hz, w / 2 - 6 * u, hz, w / 2 - 10 * u, hz + 60 * u]).fill({ color: DUST, alpha: 0.8 });
  engrave(ground, 0, hz + 8 * u, w, h - hz, 14 * u, 0.6 * u, 2.4 * u, SEPIA, 0.18);
  return { g, sun, ground };
}

interface St {
  giant: ReturnType<typeof windmill>;
  far: ReturnType<typeof windmill>[];
  speed: { v: number };
}
const S = stash<St>();
const borrowed = new WeakMap<Container, ReturnType<typeof borrowCat>>();
const GIANT: [number, number] = [1480, 728];
const LANCE: [number, number] = [W / 2 - 155, -225];

/** a four-point gleam */
function gleam(r: number) {
  return new Graphics().poly([0, -r, r * 0.18, -r * 0.18, r, 0, r * 0.18, r * 0.18, 0, r, -r * 0.18, r * 0.18, -r, 0, -r * 0.18, -r * 0.18]).fill(0xffffff);
}

export const gatote: Signature = {
  dark: false,
  frame: 0x6f93c4,
  tag: 'UNIVERSO DE LA MANCHA',
  open(c: SigCtx) {
    const k = new Container();
    const pl = plain(W, H, 1, HZ);
    k.addChild(pl.g, pl.sun);
    const far = [
      [170, 0.34],
      [430, 0.42],
      [1820, 0.38],
    ].map(([x, s]) => {
      const m = windmill(s);
      m.k.position.set(x, HZ - 10);
      return m;
    });
    k.addChild(pl.ground, ...far.map((m) => m.k));
    const giant = windmill(1.15);
    giant.k.position.set(GIANT[0], GIANT[1]);
    k.addChild(giant.k);
    const sq = squire(0.95);
    sq.position.set(330, 900);
    k.addChild(sq);
    c.back.addChild(k);
    hideDisc(c);
    const speed = { v: 0.4 };
    S.set(c, { giant, far, speed });
    // a pale sun behind him so the silhouette reads on the bright plain
    const halo = glowDisc(360, 0xfff8e4, 0.55, 8, 28);
    halo.position.set(W / 2, c.catY - 30);
    c.behind.addChild(halo);
    if (!c.reduce)
      every(c, 30, (t) => {
        if (!giant.sails.destroyed) giant.sails.rotation += 0.03 * speed.v;
        far.forEach((m, i) => !m.sails.destroyed && (m.sails.rotation += 0.02 + i * 0.004));
        if (!pl.sun.destroyed) pl.sun.rotation = t * 0.05;
      });
    if (c.short) {
      giant.face.alpha = 1;
      giant.fists.alpha = 1;
      return;
    }
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    // he gallops: a bob, hoofbeats and a trail of dust
    if (!c.reduce) {
      const cat = borrowCat(c);
      borrowed.set(c.root, cat);
      const y0 = c.cat.y;
      every(c, 60, (t) => {
        if (cat.given) return;
        if (t > 2.05) return cat.give();
        c.cat.y = y0 - Math.abs(Math.sin(t * 9)) * 14;
      });
      later(c, 2.1, () => cat.give());
      const dust = every(c, 12, () => {
        if (paid(c)) return dust();
        puff(c, c.back, W / 2 - 200 - Math.random() * 120, c.catY + 240, DUST, 2, 46, 40);
      });
      later(c, 2.1, dust);
      for (let i = 0; i < 9; i++) {
        later(c, 0.15 + i * 0.22, () => sfx('hit', 0.55 + (i % 3) * 0.05));
        later(c, 0.22 + i * 0.22, () => sfx('tick', 0.5));
      }
    }
    score(c, [
      [0.02, 'whoosh', 0.7],
      [0.65, 'shield', 0.5],
      [0.7, 'boom', 0.45],
      [0.75, 'purr', 0.35],
      [1.0, 'charge', 0.55],
      [1.95, 'gem', 1.6],
    ]);
    // the windmill becomes a giant
    beat(c, 0.55, () => {
      if (c.reduce) speed.v = 2;
      else gsap.to(speed, { v: 2.2, duration: 0.5 });
    });
    beat(c, 0.7, () => {
      if (giant.face.destroyed) return;
      if (c.reduce) {
        giant.face.alpha = 1;
        giant.fists.alpha = 1;
      } else {
        gsap.to(giant.face, { alpha: 1, duration: 0.15 });
        gsap.to(giant.fists, { alpha: 1, duration: 0.3, delay: 0.1 });
        gsap.fromTo(giant.k.scale, { x: 1, y: 1 }, { x: 1.08, y: 1.08, duration: 0.5, ease: 'back.out(2)' });
      }
      word(c, GIANT[0] + 120, GIANT[1] - 520, '¡GRRR!', 0xc8102e, 90, 0.9);
      c.shaker.add(0.25);
    });
    beat(c, 0.95, () => far.forEach((m) => !m.face.destroyed && gsap.to(m.face, { alpha: 1, duration: 0.2 })));
    // the squire tries
    beat(c, 1.3, () => say(c, c.back, 600, 650, '¡SEÑOR, QUE\nSON MOLINOS!', 0.95, { size: 40, tail: 'left' }));
    // the lance gleams
    beat(c, 1.9, () => {
      const g = gleam(46);
      g.position.set(LANCE[0], c.catY + LANCE[1]);
      c.fg.addChild(g);
      if (c.reduce) later(c, 0.4, () => destroyTree(g));
      else {
        gsap.fromTo(g.scale, { x: 0.1, y: 0.1 }, { x: 1.2, y: 1.2, duration: 0.15, yoyo: true, repeat: 1 });
        gsap.to(g, { rotation: 1.2, duration: 0.3, onComplete: () => destroyTree(g) });
      }
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    borrowed.get(c.root)?.give();
    const st = S.get(c);
    sfx('whoosh', 0.8);
    later(c, 0.12, () => {
      sfx('bigboom', 0.6);
      sfx('hit', 0.6);
    });
    later(c, 0.3, () => sfx('crit', 0.8));
    c.shaker.add(0.3);
    later(c, 0.12, () => c.shaker.add(0.5));
    const gx = GIANT[0];
    const gy = GIANT[1] - 380;
    // the charge: a streak from his lance to the giant's hub
    const streak = new Graphics()
      .poly([LANCE[0], c.catY + LANCE[1] - 14, gx, gy - 6, gx, gy + 6, LANCE[0], c.catY + LANCE[1] + 14])
      .fill({ color: 0xffffff, alpha: 0.9 });
    c.back.addChild(streak);
    gsap.to(streak, { alpha: 0, duration: 0.35, delay: 0.1, onComplete: () => destroyTree(streak) });
    later(c, 0.12, () => {
      puff(c, c.back, gx, gy + 80, DUST, 10, 110, 120);
      burst(c, c.back, () => new Graphics().rect(-18, -4, 36, 8).fill(WOOD), 14, gx, gy, 520, 1.1);
      if (st) {
        st.speed.v = c.reduce ? 0.4 : 9;
        if (!c.reduce) gsap.to(st.speed, { v: 0.4, duration: 2.2, delay: 0.3, ease: 'power2.out' });
        if (!st.giant.face.destroyed) {
          st.giant.face.alpha = 0;
          st.giant.dizzy.alpha = 1;
          gsap.to(st.giant.dizzy, { alpha: 0, delay: 1.4, duration: 0.4 });
          gsap.to(st.giant.fists, { alpha: 0, delay: 0.6, duration: 0.4 });
          if (!c.reduce) gsap.fromTo(st.giant.k, { rotation: 0.06 }, { rotation: 0, duration: 0.8, ease: 'elastic.out(1.2,0.3)' });
        }
        st.far.forEach((m) => !m.face.destroyed && gsap.to(m.face, { alpha: 0, duration: 0.3, delay: 0.4 }));
      }
    });
    headline(c, '¡A ELLOS!', { fontFamily: F.heavy, fontSize: 150, fill: 0xc8102e, letterSpacing: 2, stroke: { color: C.ink, width: 16, join: 'round' } }, {
      aside: '(…eran molinos)',
      asideStyle: { fill: 0x5a4020, stroke: { color: 0xfff6dc, width: 8, join: 'round' } },
      dur: 2.6,
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const hz = h * 0.66;
    const pl = plain(w, h, 0.36 * u, hz);
    k.addChild(pl.g, pl.sun, pl.ground);
    const far: ReturnType<typeof windmill>[] = [];
    const n = Math.max(2, Math.round(w / (110 * u)));
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (w / n);
      if (Math.abs(x - w / 2) < 140 * u) continue;
      const m = windmill(0.13 * u);
      m.k.position.set(x, hz - 4 * u);
      m.sails.rotation = i;
      far.push(m);
      k.addChild(m.k);
    }
    const halo = glowDisc(Math.min(w, h) * 0.42, 0xfff8e4, 0.5, 6, 28);
    halo.position.set(w / 2, h * 0.5);
    const giant = windmill(0.42 * u);
    giant.k.position.set(w / 2 + 112 * u, h * 0.94);
    giant.face.alpha = 1;
    giant.fists.alpha = 1;
    const sq = squire(0.3 * u);
    sq.position.set(w / 2 - 130 * u, h * 0.95);
    k.addChild(halo, giant.k, sq);
    if (live)
      cardLoop(k, 30, (t) => {
        giant.sails.rotation = t * 0.9;
        far.forEach((m, i) => (m.sails.rotation = t * (0.5 + (i % 3) * 0.1) + i));
        giant.face.alpha = t % 3.5 < 0.12 ? 0.3 : 1;
      });
    return k;
  },
};

