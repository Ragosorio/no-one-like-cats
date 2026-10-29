/**
 * Conde Gatula: the Transylvania universe (Stoker, public domain). A blood-red moon over a castle of pointed towers on
 * a crag, mist in the valley, dead trees; on the rocks two wolves lift their heads and howl (los hijos de la noche), a
 * black coach races up the winding road to the gate and bats pour out of the tallest tower. Then the CAPE: it sweeps
 * across the screen and everything goes black — only little red eyes blink open in the dark — and when it sweeps away,
 * the red moon stands right behind him.
 * Payoff: a bell tolls, the cape opens behind him like two great wings, bats burst out of it; «Bienvenido.»
 * (Not Murciégato's night: no white moon, no signal, no city — crimson, the castle, the wolves and the cape.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, later, score } from './kit';
import { cardLoop, hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { TAU, beat, ell, floatWord, fogBank, glowDisc, headline, pay, smooth } from './kitC';

const SKY = [0x0d060b, 0x1e0912, 0x3a0d1b, 0x56121f];
const MOON = 0xc8102e;
const MOON_L = 0xe8394b;
const BLACK = 0x0a0508;
const LIT = 0xffb347;
const BONE = 0xf4ece0;
const LINING = 0xa80c26;

/** a bat (polygon), wings at `flap` (1 = spread, 0 = folded down) */
function batPts(s: number, flap: number): number[] {
  const up = 10 - flap * 26;
  return [0, -8 * s, 8 * s, -4 * s, 22 * s, (up - 6) * s, 46 * s, up * s, 38 * s, (up + 10) * s, 30 * s, (up + 6) * s, 22 * s, (up + 12) * s, 10 * s, 6 * s, 0, 12 * s, -10 * s, 6 * s, -22 * s, (up + 12) * s, -30 * s, (up + 6) * s, -38 * s, (up + 10) * s, -46 * s, up * s, -22 * s, (up - 6) * s, -8 * s, -4 * s];
}
function bat(s = 1, color = BLACK) {
  return new Graphics().poly(batPts(s, 1)).fill(color);
}

/** the castle on its crag (origin: bottom-left of the crag), towers with pointed roofs; returns the windows */
function castle(s = 1) {
  const k = new Container();
  const g = new Graphics();
  // the crag
  g.poly(smooth([0, 0, 40, -160, 140, -300, 260, -360, 420, -380, 560, -340, 700, -360, 820, -300, 900, -200, 960, 0], 4)).fill(0x140a10);
  // walls and towers
  const towers: [number, number, number][] = [
    [250, 90, 330],
    [420, 120, 480],
    [600, 80, 300],
    [740, 70, 250],
  ];
  g.rect(230 * s, -560 * s, 560 * s, 200 * s).fill(BLACK);
  for (let x = 230; x < 790; x += 34) g.rect(x * s, -580 * s, 20 * s, 22 * s).fill(BLACK);
  for (const [x, w, h] of towers) {
    g.rect((x - w / 2) * s, (-360 - h) * s, w * s, h * s).fill(BLACK);
    g.poly([(x - w / 2 - 14) * s, (-360 - h) * s, (x + w / 2 + 14) * s, (-360 - h) * s, x * s, (-360 - h - w * 1.3) * s]).fill(BLACK);
    g.rect((x - 2) * s, (-360 - h - w * 1.3 - 40) * s, 4 * s, 40 * s).fill(BLACK);
  }
  const wins = new Graphics();
  const spots: [number, number][] = [
    [250, -560],
    [420, -720],
    [420, -620],
    [600, -540],
    [740, -520],
    [330, -460],
    [520, -440],
  ];
  for (const [x, y] of spots) wins.poly([(x - 8) * s, y * s, (x + 8) * s, y * s, (x + 8) * s, (y - 18) * s, x * s, (y - 26) * s, (x - 8) * s, (y - 18) * s]).fill(LIT);
  k.addChild(g, wins);
  return { k, wins, spots, top: [420 * s, -840 * s] as [number, number] };
}

/** a wolf sitting on a rock, howling (origin at its paws, facing right); head is its own node */
function wolf(s = 1) {
  const k = new Container();
  const body = new Graphics().poly(smooth([-40, 0, -50, -40, -36, -90, -10, -120, 18, -110, 30, -60, 34, 0], 4).map((v) => v * s)).fill(BLACK);
  body.poly([-40 * s, -10 * s, -90 * s, -30 * s, -96 * s, -16 * s, -44 * s, 2 * s]).fill(BLACK);
  const head = new Graphics().poly([0, 0, 18, -20, 40, -46, 54, -60, 48, -40, 34, -14, 30, 4, 10, 12].map((v) => v * s)).fill(BLACK);
  head.poly([4 * s, -6 * s, 0, -30 * s, 14 * s, -14 * s]).fill(BLACK);
  head.position.set(4 * s, -112 * s);
  head.rotation = 0.9;
  k.addChild(body, head);
  return { k, head };
}

/** a dead tree, crooked branches (stroked once) */
function deadTree(g: Graphics, x: number, y: number, s: number, seed: number) {
  const r = rng(seed);
  const branch = (x0: number, y0: number, a: number, len: number, wd: number, d: number) => {
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: wd, color: BLACK, cap: 'round' });
    if (d > 0) {
      branch(x1, y1, a - 0.5 - r() * 0.4, len * 0.68, wd * 0.6, d - 1);
      branch(x1, y1, a + 0.4 + r() * 0.4, len * 0.62, wd * 0.6, d - 1);
    }
  };
  branch(x, y, -Math.PI / 2 - 0.15, 120 * s, 16 * s, 3);
}

/** the black coach with its lanterns and two horses (origin at the ground, facing right) */
function coach(s = 1) {
  const g = new Graphics();
  g.roundRect(-70 * s, -86 * s, 90 * s, 60 * s, 8 * s).fill(BLACK).rect(-80 * s, -92 * s, 110 * s, 8 * s).fill(BLACK);
  for (const x of [-56, 6]) g.poly(ell(x * s, -16 * s, 16 * s, 16 * s, 10)).stroke({ width: 4 * s, color: BLACK });
  g.poly(ell(-74 * s, -80 * s, 5 * s, 5 * s, 8)).fill(LIT).poly(ell(24 * s, -80 * s, 5 * s, 5 * s, 8)).fill(LIT);
  for (const hx of [60, 104]) {
    g.poly(ell(hx * s, -46 * s, 26 * s, 12 * s, 12)).fill(BLACK);
    g.poly([(hx + 18) * s, -50 * s, (hx + 34) * s, -76 * s, (hx + 42) * s, -70 * s, (hx + 28) * s, -44 * s]).fill(BLACK);
    for (const lx of [-16, -6, 10, 20]) g.rect((hx + lx) * s, -38 * s, 4 * s, 38 * s).fill(BLACK);
  }
  g.moveTo(30 * s, -46 * s).lineTo(40 * s, -46 * s).stroke({ width: 3 * s, color: BLACK });
  return g;
}

/** the moon: crimson disc with darker seas and a red glow */
function moon(r: number) {
  const k = new Container();
  const glow = glowDisc(r * 2.1, MOON, 0.55, 9, 32);
  const g = new Graphics().poly(ell(0, 0, r, r, 40)).fill(MOON);
  g.poly(ell(-r * 0.12, -r * 0.1, r * 0.86, r * 0.86, 36)).fill({ color: MOON_L, alpha: 0.55 });
  for (const [x, y, rr] of [
    [-0.3, -0.25, 0.22],
    [0.25, 0.1, 0.3],
    [-0.1, 0.42, 0.16],
    [0.42, -0.36, 0.12],
  ])
    g.poly(ell(x * r, y * r, rr * r, rr * r * 0.9, 16)).fill({ color: 0x8a0a1e, alpha: 0.45 });
  k.addChild(glow, g);
  return k;
}

/** one half of the cape spread as a wing (origin at his shoulder; side = -1 left, 1 right) */
function capeWing(side: number) {
  const g = new Graphics();
  const p: number[] = [0, 0, side * 120, -80, side * 420, -150, side * 660, -60];
  // the scalloped hem, from the wingtip down and back to the shoulder
  const tips: [number, number][] = [
    [660, -60],
    [600, 120],
    [470, 210],
    [330, 330],
    [180, 420],
    [40, 460],
  ];
  for (let i = 1; i < tips.length; i++) {
    const [x0, y0] = tips[i - 1];
    const [x1, y1] = tips[i];
    p.push(side * ((x0 + x1) / 2 - 30), (y0 + y1) / 2 - 50, side * x1, y1);
  }
  p.push(0, 440);
  g.poly(p).fill(BLACK).stroke({ width: 6, color: 0x2a0a14, join: 'round' });
  const inner = p.map((v, i) => (i % 2 ? v * 0.86 + 20 : v * 0.86));
  g.poly(inner).fill(LINING);
  g.poly(inner.map((v, i) => (i % 2 ? v * 0.7 + 30 : v * 0.6))).fill({ color: 0xd8203a, alpha: 0.35 });
  for (const [x, y] of tips.slice(0, 5)) g.moveTo(0, 0).lineTo(side * x * 0.86, y * 0.86 + 20).stroke({ width: 3, color: 0x5a0614, alpha: 0.7 });
  return g;
}

/** a band `dx` wide along a polyline (the polyline, then back along it shifted by dx) */
function strip(pts: number[], dx: number) {
  const back: number[] = [];
  for (let i = pts.length - 2; i >= 0; i -= 2) back.push(pts[i] + dx, pts[i + 1]);
  return [...pts, ...back];
}

interface St {
  sky: Container;
  moonK: Container;
  cape: Container | null;
  eyes: Container | null;
  after: () => void;
  wins: Graphics;
}
const S = stash<St>();
const MOON_AT: [number, number] = [1500, 300];

export const gatula: Signature = {
  dark: true,
  frame: 0xc8102e,
  tag: 'UNIVERSO TRANSILVANIA',
  open(c: SigCtx) {
    const k = new Container();
    const sky = new Graphics();
    vgrad(sky, 0, 0, W, H, SKY, 28);
    const r = rng(17);
    for (let i = 0; i < 60; i++) sky.poly(ell(r() * W, r() * 560, 1.5 + r() * 2, 1.5 + r() * 2, 4)).fill({ color: 0xffe0e0, alpha: 0.3 + r() * 0.5 });
    const moonK = moon(220);
    moonK.position.set(MOON_AT[0], MOON_AT[1]);
    const cs = castle(1);
    cs.k.position.set(1060, H - 120);
    // the valley: hills, the winding road, mist
    const land = new Graphics();
    land.poly(smooth([0, 760, 300, 700, 700, 780, 1100, 740, 1500, 800, 1920, 760, 1920, 1080, 0, 1080], 4)).fill(0x1a0a12);
    const road = smooth([-60, 1060, 300, 990, 700, 930, 1000, 900, 1220, 860, 1330, 790, 1420, 730], 6, false);
    land.poly(road, false).stroke({ width: 22, color: 0x3a1c22 });
    land.poly(road, false).stroke({ width: 8, color: 0x5a2c30, alpha: 0.6 });
    land.poly(smooth([0, 900, 220, 760, 420, 720, 560, 820, 600, 1080, 0, 1080], 4)).fill(0x12080d);
    deadTree(land, 520, 800, 1.2, 3);
    deadTree(land, 1790, 900, 1.0, 5);
    deadTree(land, 90, 860, 0.9, 7);
    const wolves = [wolf(1.55), wolf(1.35)];
    wolves[0].k.position.set(250, 742);
    wolves[1].k.position.set(410, 748);
    wolves[1].k.scale.x = -1;
    const mist = new Graphics();
    fogBank(mist, -100, W + 200, 830, 60, 0x7a3040, 0.16, rng(3), 12);
    fogBank(mist, -100, W + 200, 960, 80, 0x7a3040, 0.2, rng(4), 12);
    const coachK = coach(0.9);
    coachK.visible = false;
    const batsL = new Container();
    k.addChild(sky, moonK, cs.k, land, coachK, ...wolves.map((w) => w.k), mist, batsL);
    c.back.addChild(k);
    hideDisc(c);
    // a dim red light behind him (the silhouette must read on the night)
    const halo = glowDisc(380, 0xff5a6a, 0.32, 8, 28);
    halo.position.set(W / 2, c.catY - 30);
    c.behind.addChild(halo);
    // after the cape: the moon stands right behind him
    let arranged = false;
    const after = () => {
      if (arranged || moonK.destroyed) return;
      arranged = true;
      moonK.position.set(W / 2, c.catY - 70);
      moonK.scale.set(1.75);
      if (!halo.destroyed) halo.alpha = 0;
    };
    const st: St = { sky: k, moonK, cape: null, eyes: null, after, wins: cs.wins };
    S.set(c, st);
    if (!c.reduce)
      every(c, 30, (t) => {
        if (!mist.destroyed) mist.x = Math.sin(t * 0.4) * 60;
        if (!cs.wins.destroyed) cs.wins.alpha = c.flashes ? 0.8 + Math.random() * 0.2 : 0.95;
      });
    if (c.short) {
      after();
      return;
    }
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.45 });
      cs.wins.alpha = 0;
      gsap.to(cs.wins, { alpha: 1, duration: 0.5, delay: 0.15 });
      gsap.from(moonK, { y: MOON_AT[1] + 80, duration: 1.2, ease: 'power2.out' });
    }
    score(c, [
      [0.02, 'sting', 0.45],
      [0.25, 'purr', 0.3],
      [0.3, 'charge', 0.35],
      [0.85, 'whoosh', 0.9],
      [1.3, 'whoosh', 0.35],
      [1.32, 'freeze', 0.45],
      [1.9, 'whoosh', 0.4],
    ]);
    // the wolves howl
    beat(c, 0.25, () => {
      wolves.forEach((w, i) => {
        if (w.head.destroyed) return;
        if (c.reduce) w.head.rotation = -0.3;
        else gsap.to(w.head, { rotation: -0.35, duration: 0.3, delay: i * 0.12, ease: 'power2.out' });
      });
      floatWord(c, c.back, 330, 500, 'auuuuu…', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 46, fill: 0xf0a0a8, stroke: { color: BLACK, width: 6 } }, 60, 1.3);
    });
    // the coach races up the road to the gate
    beat(c, 0.4, () => {
      if (c.reduce || coachK.destroyed) return;
      coachK.visible = true;
      const p = { t: 0 };
      const n = road.length / 2 - 1;
      gsap.to(p, {
        t: 1,
        duration: 1.0,
        ease: 'power1.in',
        onUpdate: () => {
          if (coachK.destroyed) return;
          const f = p.t * n;
          const i = Math.min(n - 1, Math.floor(f));
          const u = f - i;
          coachK.position.set(road[i * 2] + (road[i * 2 + 2] - road[i * 2]) * u, road[i * 2 + 1] + (road[i * 2 + 3] - road[i * 2 + 1]) * u);
          coachK.scale.set(0.9 - p.t * 0.6);
          coachK.y += Math.sin(p.t * 60) * 2;
        },
        onComplete: () => coachK.visible && (coachK.visible = false),
      });
      for (let i = 0; i < 6; i++) later(c, i * 0.15, () => sfx('tick', 0.6 + (i % 2) * 0.1));
    });
    // bats pour out of the tallest tower and fly across the moon
    beat(c, 0.8, () => {
      if (c.reduce) return;
      const [tx, ty] = [cs.k.x + cs.top[0], cs.k.y + cs.top[1]];
      for (let i = 0; i < 12; i++) {
        const b = bat(0.7 + Math.random() * 0.4);
        b.position.set(tx, ty);
        batsL.addChild(b);
        const a0 = Math.random() * TAU;
        const p = { t: 0 };
        gsap.to(p, {
          t: 1,
          duration: 1.1 + Math.random() * 0.4,
          delay: i * 0.04,
          ease: 'power1.in',
          onUpdate: () => {
            if (b.destroyed) return;
            const rr = 40 + p.t * 900;
            b.position.set(tx + Math.cos(a0 + p.t * 5) * rr - p.t * 700, ty + Math.sin(a0 + p.t * 5) * rr * 0.35 - p.t * 200);
            b.scale.y = 0.4 + Math.abs(Math.sin(p.t * 40)) * 0.8;
          },
          onComplete: () => destroyTree(b),
        });
      }
    });
    // THE CAPE: it sweeps over everything, red eyes in the dark, and it sweeps away with the moon behind him
    beat(c, 1.3, () => {
      const cape = new Container();
      const g = new Graphics();
      const hem: number[] = [];
      for (let i = 0; i <= 8; i++) hem.push(-60 - (i % 2) * 120, -100 + (i * (H + 200)) / 8);
      g.poly([...hem, W * 2.2, H + 100, W * 2.2, -100]).fill(BLACK);
      g.poly(strip(hem, 200)).fill(LINING);
      const trail: number[] = [];
      for (let i = 0; i <= 8; i++) trail.push(W * 2.2 - 60 - (i % 2) * 120, -100 + (i * (H + 200)) / 8);
      g.poly(strip(trail, 220)).fill(LINING);
      cape.addChild(g);
      cape.x = W + 260;
      c.fg.addChild(cape);
      st.cape = cape;
      const eyes = new Container();
      c.fg.addChild(eyes);
      st.eyes = eyes;
      if (c.reduce) {
        cape.x = -W * 2.6;
        after();
        return;
      }
      gsap.to(cape, { x: -180, duration: 0.2, ease: 'power2.in' });
      later(c, 0.2, () => {
        after();
        const er = rng(9);
        for (let i = 0; i < 16; i++) {
          later(c, i * 0.025, () => {
            if (eyes.destroyed) return;
            const x = 120 + er() * (W - 240);
            const y = 100 + er() * (H - 200);
            if (Math.abs(x - W / 2) < 260 && Math.abs(y - c.catY) < 300) return;
            const e = new Graphics().poly(ell(-14, 0, 8, 5, 8)).fill(0xff2a3a).poly(ell(14, 0, 8, 5, 8)).fill(0xff2a3a);
            e.position.set(x, y);
            e.scale.y = 0.1;
            eyes.addChild(e);
            gsap.to(e.scale, { y: 1, duration: 0.08 });
            if (i % 3 === 0) sfx('tick', 0.4 + er() * 0.3);
          });
        }
      });
      later(c, 0.62, () => {
        if (cape.destroyed) return;
        gsap.to(cape, { x: -W * 2.6, duration: 0.3, ease: 'power2.in', onComplete: () => destroyTree(cape) });
        gsap.to(eyes, { alpha: 0, duration: 0.2, onComplete: () => destroyTree(eyes) });
      });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    if (st) {
      st.after();
      if (st.cape && !st.cape.destroyed) destroyTree(st.cape);
      if (st.eyes && !st.eyes.destroyed) destroyTree(st.eyes);
    }
    sfx('sting', 0.38);
    sfx('boom', 0.32);
    later(c, 0.05, () => sfx('whoosh', 0.5));
    later(c, 1.1, () => {
      sfx('sting', 0.38);
      sfx('boom', 0.3);
    });
    c.shaker.add(0.3);
    // the cape opens behind him like two great wings
    const wings = new Container();
    for (const side of [-1, 1]) {
      const wg = capeWing(side);
      wg.position.set(W / 2 + side * 40, c.catY - 150);
      if (!c.reduce) gsap.fromTo(wg.scale, { x: 0.08, y: 0.6 }, { x: 1, y: 1, duration: 0.38, ease: 'back.out(1.4)' });
      wings.addChild(wg);
    }
    c.behind.addChild(wings);
    // bats burst out of it
    burst(c, c.fg, () => bat(0.8 + Math.random() * 0.5), 16, W / 2, c.catY - 60, 900, 1.3);
    const h = headline(c, 'Bienvenido.', { fontFamily: F.news, fontSize: 150, fill: BONE, stroke: { color: 0x2a0010, width: 10, join: 'round' } }, { glow: MOON, dur: 3.0, slow: true, rot: -0.03 });
    // a drop of red runs from the period
    const drop = new Graphics().poly(smooth([0, -10, 8, 4, 0, 12, -8, 4], 4)).fill(0xd8203a).stroke({ width: 3, color: 0x2a0010 });
    drop.position.set(h.main.width / 2 - 14, h.main.height * 0.28);
    drop.alpha = 0;
    h.k.addChild(drop);
    gsap.to(drop, { alpha: 1, duration: 0.2, delay: 0.9 });
    if (!c.reduce) gsap.to(drop, { y: drop.y + 46, duration: 1.2, delay: 1.0, ease: 'power1.in' });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const sky = new Graphics();
    vgrad(sky, 0, 0, w, h, SKY, 18);
    const r = rng(17);
    const n = Math.round((w * h) / (90 * 90 * u * u));
    for (let i = 0; i < n; i++) sky.poly(ell(r() * w, r() * h * 0.6, (0.6 + r()) * u, (0.6 + r()) * u, 4)).fill({ color: 0xffe0e0, alpha: 0.3 + r() * 0.5 });
    const m = moon(Math.min(w * 0.3, 92 * u));
    m.position.set(w / 2, h * 0.42);
    const cs = castle(0.3 * u);
    cs.k.position.set(w / 2 + 70 * u, h + 4 * u);
    const land = new Graphics();
    land.poly([0, h * 0.84, w * 0.3, h * 0.8, w * 0.6, h * 0.86, w, h * 0.82, w, h, 0, h]).fill(0x1a0a12);
    deadTree(land, w / 2 - 150 * u, h * 0.92, 0.5 * u, 3);
    const wl = wolf(0.36 * u);
    wl.k.position.set(w / 2 - 110 * u, h * 0.88);
    wl.head.rotation = -0.35;
    const mist = new Graphics();
    fogBank(mist, -20 * u, w + 40 * u, h * 0.9, 18 * u, 0x7a3040, 0.2, rng(4), Math.max(6, Math.round(w / (60 * u))));
    const bats: Graphics[] = [];
    for (let i = 0; i < 5; i++) {
      const b = bat(0.3 * u);
      b.position.set(w / 2 + (i - 2) * 50 * u, h * (0.16 + (i % 2) * 0.08));
      bats.push(b);
    }
    k.addChild(sky, m, cs.k, land, wl.k, mist, ...bats);
    if (live)
      cardLoop(k, 30, (t) => {
        bats.forEach((b, i) => {
          const a = t * 0.6 + i * 1.3;
          b.position.set(w / 2 + Math.cos(a) * (60 + i * 18) * u, h * 0.3 + Math.sin(a * 1.3) * 30 * u);
          b.clear().poly(batPts(0.3 * u, Math.abs(Math.sin(t * 9 + i)))).fill(BLACK);
        });
        mist.x = Math.sin(t * 0.4) * 14 * u;
        cs.wins.alpha = 0.8 + Math.random() * 0.2;
      });
    return k;
  },
};
