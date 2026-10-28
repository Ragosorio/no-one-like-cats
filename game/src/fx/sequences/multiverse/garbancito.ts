/**
 * Garbancito: the tiny universe (Spanish folk tale, public domain). Everything is giant around a hero the size of a
 * chickpea: blades of grass like trees, a cabbage that unfurls behind him like a palace, a ladybug the size of a car,
 * dew drops like windows — and the ox, an eye as big as a door, sniffing for him. His steps sound tiny: ¡pachín,
 * pachín, pachín! Payoff: the refrain, bigger every time — ¡PACHÍN! ¡PACHÍN! ¡PACHÍN! (¡a Garbancito no lo pisen!).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, cover, every, later, score, word } from './kit';
import { fadeKill, liveLoop, puff, rng, stash, vgrad } from './kitB';

const LEAF = 0x6cbf3a;
const GRASS = [0x3a7a22, 0x4f9a2e, 0x6cbf3a, 0x86d14a, 0x2f6a1c];
const RED = 0xd7192e;
const OX = 0x9a6a44;

/** a blade of grass (origin at its base): tapered, curved, with a midline */
function blade(h: number, w: number, color: number, lean: number): Graphics {
  const g = new Graphics();
  const tx = lean * h * 0.4;
  g.moveTo(-w / 2, 0).quadraticCurveTo(-w / 2 + lean * h * 0.08, -h * 0.55, tx, -h).quadraticCurveTo(w / 2 + lean * h * 0.16, -h * 0.5, w / 2, 0).fill(color).stroke({ width: 4, color: 0x1f4a12, alpha: 0.6 });
  g.moveTo(0, 0).quadraticCurveTo(lean * h * 0.12, -h * 0.5, tx, -h).stroke({ width: Math.max(2, w * 0.06), color: 0x1f4a12, alpha: 0.35 });
  return g;
}

/** one cabbage leaf (origin at the heart, pointing up), length L, width wd */
function leaf(L: number, wd: number, color: number): Graphics {
  const g = new Graphics();
  g.moveTo(0, 0).bezierCurveTo(-wd, -L * 0.25, -wd * 0.85, -L, 0, -L * 1.02).bezierCurveTo(wd * 0.85, -L, wd, -L * 0.25, 0, 0).fill(color).stroke({ width: 5, color: 0x2f6a1c, join: 'round' });
  g.moveTo(0, -L * 0.05).lineTo(0, -L * 0.92).stroke({ width: L * 0.03, color: 0xe2f4b6, cap: 'round' });
  for (let i = 1; i <= 4; i++) {
    const y = -L * (0.18 + i * 0.16);
    g.moveTo(0, y).quadraticCurveTo(-wd * 0.3, y - L * 0.04, -wd * 0.6, y - L * 0.14).stroke({ width: L * 0.012, color: 0xd2ec9e, cap: 'round' });
    g.moveTo(0, y).quadraticCurveTo(wd * 0.3, y - L * 0.04, wd * 0.6, y - L * 0.14).stroke({ width: L * 0.012, color: 0xd2ec9e, cap: 'round' });
  }
  return g;
}

/** the giant cabbage: outer leaves, inner leaves, a pale heart */
function cabbage(R: number): { k: Container; leaves: Graphics[] } {
  const k = new Container();
  const leaves: Graphics[] = [];
  const cols = [0x8cc85a, 0x7ab84a, 0x9fd46a];
  for (let i = 0; i < 12; i++) {
    const l = leaf(R, R * 0.6, cols[i % 3]);
    l.rotation = (i / 12) * Math.PI * 2;
    k.addChild(l);
    leaves.push(l);
  }
  for (let i = 0; i < 8; i++) {
    const l = leaf(R * 0.66, R * 0.42, [0xb8e08a, 0xa6d878][i % 2]);
    l.rotation = (i / 8) * Math.PI * 2 + 0.3;
    k.addChild(l);
    leaves.push(l);
  }
  k.addChild(new Graphics().circle(0, 0, R * 0.3).fill(0xd8f0a8).stroke({ width: 5, color: 0x2f6a1c }));
  return { k, leaves };
}

/** the giant ladybug (facing right), its legs on their own so they can walk */
function ladybug(s = 1): { k: Container; legs: Graphics } {
  const k = new Container();
  const legs = new Graphics();
  for (let i = 0; i < 3; i++) legs.moveTo((-40 + i * 40) * s, 30 * s).lineTo((-56 + i * 40) * s, 70 * s).stroke({ width: 8 * s, color: C.ink, cap: 'round' });
  const g = new Graphics();
  g.ellipse(80 * s, 6 * s, 44 * s, 38 * s).fill(C.ink);
  g.circle(96 * s, -6 * s, 8 * s).fill(0xffffff).circle(98 * s, 22 * s, 6 * s).fill(0xffffff);
  g.moveTo(108 * s, -24 * s).quadraticCurveTo(130 * s, -60 * s, 150 * s, -56 * s).stroke({ width: 5 * s, color: C.ink, cap: 'round' });
  g.ellipse(0, 0, 100 * s, 72 * s).fill(RED).stroke({ width: 6 * s, color: C.ink });
  g.moveTo(70 * s, -30 * s).lineTo(-96 * s, 0).stroke({ width: 5 * s, color: C.ink });
  for (const [x, y, r] of [
    [30, -30, 16],
    [-30, -38, 14],
    [-60, 4, 16],
    [10, 18, 18],
    [-20, 46, 12],
    [50, 34, 12],
  ])
    g.circle(x * s, y * s, r * s).fill(C.ink);
  g.ellipse(20 * s, -44 * s, 30 * s, 10 * s).fill({ color: 0xffffff, alpha: 0.35 });
  k.addChild(legs, g);
  return { k, legs };
}

/** the ox's head (facing left): huge, peeking from the right */
function ox(): { k: Container; lid: Graphics; puffAt: [number, number][] } {
  const k = new Container();
  const g = new Graphics();
  g.poly([60, -250, 200, -300, 330, -150, 330, 300, 120, 340, -120, 260, -330, 160, -360, 0, -200, -170]).fill(OX).stroke({ width: 8, color: C.ink, join: 'round' });
  g.moveTo(80, -270).quadraticCurveTo(180, -430, 60, -480).quadraticCurveTo(150, -400, 120, -280).fill(0xf2e6c8).stroke({ width: 6, color: C.ink });
  g.ellipse(250, -200, 110, 46).fill(0x7a5030).stroke({ width: 6, color: C.ink });
  g.ellipse(-250, 90, 170, 130).fill(0xe0b090).stroke({ width: 7, color: C.ink });
  g.ellipse(-320, 60, 30, 46).fill(0x4a2a20).ellipse(-190, 50, 30, 46).fill(0x4a2a20);
  g.moveTo(-330, 180).quadraticCurveTo(-240, 230, -140, 190).stroke({ width: 6, color: 0x6a4428, cap: 'round' });
  // the eye: as big as a door
  g.ellipse(20, -90, 70, 56).fill(0xfbf6ea).stroke({ width: 6, color: C.ink });
  g.circle(-6, -84, 34).fill(0x2a1a10).circle(-18, -98, 12).fill(0xffffff);
  for (let i = 0; i < 5; i++) g.moveTo(-40 + i * 24, -140).lineTo(-50 + i * 28, -170).stroke({ width: 6, color: C.ink, cap: 'round' });
  const lid = new Graphics().ellipse(20, -90, 74, 60).fill(OX).stroke({ width: 6, color: C.ink });
  lid.scale.y = 0;
  lid.pivot.set(0, -150);
  lid.position.set(0, -150);
  k.addChild(g, lid);
  return { k, lid, puffAt: [[-320, 60], [-190, 50]] };
}

/** the sky, out of focus: a gradient and big soft bokeh discs */
function sky(w: number, h: number, u = 1): Graphics {
  const g = vgrad(new Graphics(), 0, 0, w, h, [0x8fd0f5, 0xc8ecff, 0xeef9e6], 16);
  const r = rng(31);
  for (let i = 0; i < 26; i++) {
    const rr = (40 + r() * 120) * u;
    const x = r() * w;
    const y = r() * h * 0.8;
    const col = [0xffffff, 0xfff2a0, 0xc8f0a0][i % 3];
    g.circle(x, y, rr).fill({ color: col, alpha: 0.18 }).circle(x, y, rr * 0.7).fill({ color: col, alpha: 0.12 });
  }
  // a giant daisy far behind, blurred
  const dx = w * 0.84;
  const dy = h * 0.2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.ellipse(dx + Math.cos(a) * 90 * u, dy + Math.sin(a) * 90 * u, 70 * u, 26 * u).fill({ color: 0xffffff, alpha: 0.5 });
  }
  g.circle(dx, dy, 44 * u).fill({ color: 0xffd23a, alpha: 0.75 });
  g.moveTo(dx, dy + 40 * u).lineTo(dx - 30 * u, h).stroke({ width: 26 * u, color: 0x7ab84a, alpha: 0.5 });
  return g;
}

interface St {
  blades: { g: Graphics; ph: number; base: number }[];
  bend: { v: number };
  leaves: Graphics[];
  oxK: Container | null;
}
const S = stash<St>();

export const garbancito: Signature = {
  dark: false,
  frame: LEAF,
  tag: 'UNIVERSO DIMINUTO',
  open(c: SigCtx) {
    const k = new Container();
    k.addChild(cover(0xc8ecff), sky(W, H));
    const r = rng(77);
    const blades: { g: Graphics; ph: number; base: number }[] = [];
    // grass, far and near
    for (let i = 0; i < 16; i++) {
      const x = (i / 16) * W + r() * 90;
      const b = blade(520 + r() * 480, 70 + r() * 60, GRASS[i % GRASS.length], (r() - 0.5) * 0.8);
      b.position.set(x, H + 20);
      b.alpha = 0.92;
      k.addChild(b);
      blades.push({ g: b, ph: r() * 6, base: b.rotation });
    }
    // the ground: a giant pebble and crumbs of earth
    const ground = new Graphics().rect(0, 980, W, 120).fill(0x6a4a2a).ellipse(1500, 990, 260, 70).fill(0x9a9286).stroke({ width: 6, color: 0x4a4038 });
    for (let i = 0; i < 30; i++) ground.circle(r() * W, 990 + r() * 80, 6 + r() * 14).fill(0x4a3420);
    k.addChild(ground);
    const oxk = ox();
    oxk.k.position.set(W - 300, c.CY - 40);
    k.addChild(oxk.k);
    c.back.addChild(k);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.2 });
    // the cabbage, where his disc was
    const cab = cabbage(420);
    cab.k.position.set(W / 2, c.CY + 30);
    c.behind.addChild(cab.k);
    // grass in front, at the edges (and a dew drop on one)
    const front: { g: Graphics; ph: number; base: number }[] = [];
    // (they lean outward: nothing crosses him or the words)
    for (const [x, hh, lean, col] of [
      [60, 1150, -0.1, GRASS[4]],
      [180, 900, -0.28, GRASS[1]],
      [W - 60, 1120, 0.1, GRASS[0]],
      [W - 190, 860, 0.3, GRASS[3]],
    ] as const) {
      const b = blade(hh, 110, col, lean);
      b.position.set(x, H + 30);
      c.fg.addChild(b);
      front.push({ g: b, ph: x, base: 0 });
    }
    const dew = new Graphics().circle(0, 0, 38).fill({ color: 0xe0f8ff, alpha: 0.55 }).stroke({ width: 4, color: 0xffffff, alpha: 0.8 }).circle(-12, -14, 10).fill({ color: 0xffffff, alpha: 0.9 });
    dew.position.set(150, 520);
    c.fg.addChild(dew);
    const bend = { v: 0 };
    const all = [...blades, ...front];
    S.set(c, { blades: all, bend, leaves: cab.leaves, oxK: oxk.k });
    if (!c.reduce)
      every(c, 30, (t) => {
        bend.v *= 0.94;
        for (const b of all) if (!b.g.destroyed) b.g.rotation = b.base + 0.035 * Math.sin(t * 1.3 + b.ph) - bend.v;
        if (!dew.destroyed) dew.scale.set(1 + Math.sin(t * 5) * 0.04, 1 - Math.sin(t * 5) * 0.04);
      });
    if (c.short) return;

    // the cabbage unfurls; the ox slides in from the side
    if (!c.reduce) {
      cab.leaves.forEach((l, i) => {
        const rot = l.rotation;
        gsap.fromTo(l, { rotation: rot - 0.6 }, { rotation: rot, duration: 0.6, delay: 0.05 + i * 0.025, ease: 'back.out(1.6)' });
        gsap.fromTo(l.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.6, delay: 0.05 + i * 0.025, ease: 'back.out(1.6)' });
      });
      gsap.fromTo(oxk.k, { x: W + 420 }, { x: W - 300, duration: 0.7, delay: 0.7, ease: 'power2.out' });
      gsap.fromTo(oxk.lid.scale, { y: 0 }, { y: 1, duration: 0.07, delay: 1.45, yoyo: true, repeat: 1 });
    }
    // the giant ladybug walks across
    const lb = ladybug(1.4);
    lb.k.position.set(-260, 930);
    c.back.addChild(lb.k);
    if (!c.reduce) {
      // it takes its time crossing the whole screen
      gsap.to(lb.k, { x: W + 320, duration: 7, ease: 'none', onComplete: () => destroyTree(lb.k) });
      every(c, 12, (t) => {
        if (lb.legs.destroyed) return;
        lb.legs.scale.x = Math.floor(t * 12) % 2 ? 1 : -0.6;
        lb.k.y = 930 + (Math.floor(t * 12) % 2) * 3;
      });
    } else lb.k.x = 1500;
    // his steps: tiny
    [0.3, 0.55, 0.8].forEach((t, i) =>
      later(c, t, () => {
        const x = 760 + i * 90;
        const p = txt('¡pachín!', { fontFamily: F.comic, fontSize: 30, fill: RED, stroke: { color: 0xffffff, width: 5 } });
        p.anchor.set(0.5);
        p.position.set(x, 1028);
        p.rotation = (i % 2 ? 1 : -1) * 0.08;
        c.fg.addChild(p);
        const prints = new Graphics().circle(x - 34, 1056, 3).fill(C.ink).circle(x - 26, 1050, 3).fill(C.ink);
        c.fg.addChild(prints);
        if (!c.reduce) gsap.fromTo(p.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' });
        fadeKill(p, 1.3, 0.3);
        fadeKill(prints, 1.3, 0.3);
        sfx('tick', 2.8);
        sfx('pop', 2.4);
      }),
    );
    // the ox sniffs: a snort that bends the grass; then it moos
    later(c, 1.3, () => {
      sfx('splash', 0.55);
      bend.v = 0.12;
      for (const [px, py] of oxk.puffAt) puff(c, c.fg, oxk.k.x + px - 40, oxk.k.y + py + 30, 0xffffff, 5, 40, 20);
    });
    later(c, 1.7, () => {
      sfx('purr', 3.2);
      sfx('boom', 0.35);
      c.shaker.add(0.3);
      word(c, W - 430, 190, '¡MUUU!', OX, 110, 0.9);
    });
    score(c, [
      [0.05, 'whoosh', 1.4],
      [0.75, 'whoosh', 0.6],
    ]);
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('levelup', 1.15);
    // the refrain, bigger every time
    const sizes: [number, number, number][] = [
      [62, 215, 812],
      [96, 320, 726],
      [140, 470, 612],
    ];
    sizes.forEach(([size, x, y], i) =>
      later(c, i * 0.2, () => {
        sfx('pop', 1.2 + i * 0.35);
        sfx('hit', 1.4 - i * 0.2);
        c.shaker.add(0.12 + i * 0.1);
        const t = txt('¡PACHÍN!', { fontFamily: F.comic, fontSize: size, fill: i === 2 ? RED : 0xffe14d, stroke: { color: C.ink, width: size / 8, join: 'round' }, letterSpacing: 2 });
        t.anchor.set(0.5);
        t.position.set(x, y);
        t.rotation = -0.08 + i * 0.03;
        c.fg.addChild(t);
        if (!c.reduce) gsap.fromTo(t.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.22, ease: 'back.out(3)' });
        fadeKill(t, 2.3 - i * 0.2, 0.4);
      }),
    );
    later(c, 0.55, () => {
      const line = txt('¡a Garbancito no lo pisen!', { fontFamily: F.brush, fontSize: 42, fill: RED, stroke: { color: 0xffffff, width: 8, join: 'round' } });
      line.anchor.set(0.5);
      line.position.set(400, 884);
      line.rotation = -0.03;
      c.fg.addChild(line);
      if (!c.reduce) gsap.from(line, { alpha: 0, y: 890, duration: 0.3 });
      fadeKill(line, 1.9, 0.4);
    });
    // leaves fly, the cabbage shivers, the grass whips, the ox jumps back and leaves
    burst(c, c.fg, (i) => leaf(40 + (i % 3) * 14, 26 + (i % 3) * 8, [0x8cc85a, 0x6cbf3a, 0xb8e08a][i % 3]), 18, W / 2, c.catY, 820, 1.3);
    if (st) {
      st.bend.v = -0.1;
      if (!c.reduce) st.leaves.forEach((l, i) => gsap.fromTo(l.scale, { x: 1.12, y: 1.12 }, { x: 1, y: 1, duration: 0.6, delay: i * 0.01, ease: 'elastic.out(1.2,0.4)' }));
      const o = st.oxK;
      if (o && !o.destroyed && !c.reduce) {
        gsap.to(o, { x: o.x + 120, rotation: 0.12, duration: 0.15, ease: 'power2.out' });
        gsap.to(o, { x: W + 520, rotation: 0, duration: 0.6, delay: 0.35, ease: 'power2.in' });
      }
    }
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.min(w, h) / 300;
    k.addChild(sky(w, h, u * 0.6));
    const cab = cabbage(Math.min(w, h) * 0.44);
    cab.k.position.set(w / 2, h * 0.56);
    const o = ox();
    o.k.scale.set(0.42 * u);
    o.k.position.set(w + 40 * u, h * 0.3);
    const blades: Graphics[] = [];
    for (const [x, hh, lean, col] of [
      [0.06, 1.0, 0.3, GRASS[4]],
      [0.18, 0.75, 0.45, GRASS[1]],
      [0.94, 0.95, -0.3, GRASS[0]],
      [0.82, 0.7, -0.4, GRASS[3]],
    ] as const) {
      const b = blade(hh * h, 34 * u, col, lean);
      b.position.set(x * w, h + 8 * u);
      blades.push(b);
    }
    const lb = ladybug(0.28 * u);
    lb.k.position.set(w * 0.18, h * 0.5);
    lb.k.rotation = -1.2;
    k.addChild(o.k, cab.k, ...blades, lb.k);
    if (live) liveLoop(k, 30, (t) => blades.forEach((b, i) => (b.rotation = 0.04 * Math.sin(t * 1.3 + i * 1.7))));
    return k;
  },
};
