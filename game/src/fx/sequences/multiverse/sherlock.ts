/**
 * Sherlock Ronrones: the fog universe (Conan Doyle, public domain). A Victorian street at night in thick yellow fog —
 * brick terraces with sash windows, iron railings, a far clock tower, a green door with 221B in its fanlight — and the
 * gas lamps light one by one. Paw prints glow on the cobbles, a red thread joins them and runs to the clues
 * (OLOR A ATÚN · PELOS EN EL SOFÁ · ¿LA CROQUETA?), and a giant magnifying glass sweeps over him: under the lens the
 * prints come up big and bright.
 * Payoff: the threads snap from every clue into him, the lamps flare and the fog parts; ¡ELEMENTAL! (…mi querido michi.)
 * (Not Noir's office: no rain, no blinds, no typewriter — gaslight, fog, cobbles, the thread and the lens.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, later, score } from './kit';
import { cardLoop, hideDisc } from './kitA';
import { rng, stash, vgrad } from './kitB';
import { arcPts, beat, ell, fogBank, glowDisc, headline, pawPrint, pay } from './kitC';

const SKY = [0x161d1b, 0x26302a, 0x3d4535];
const FOG = 0xcfc48e;
const BRICK = 0x4a3229;
const MORTAR = 0x2a1d18;
const IRON = 0x15181a;
const GAS = 0xffd27a;
const PRINT = 0xffdf8a;
const THREAD = 0xd62839;
const PAPER = 0xf2e8cc;
const DOOR = 0x1f4a3a;

/** the street: sky, far skyline and clock tower, brick terraces with windows, the 221B door, railings, cobbles */
function street(w: number, h: number, u: number, curb: number, doorX: number) {
  const g = new Graphics();
  vgrad(g, 0, 0, w, curb, SKY, 16);
  const r = rng(11);
  // far skyline in the fog
  const far: number[] = [0, 420 * u];
  for (let x = 0; x <= w; x += 70 * u) far.push(x, (300 + r() * 80) * u, x + 30 * u, (300 + r() * 60) * u);
  far.push(w, 420 * u);
  g.poly(far).fill({ color: 0x48503e, alpha: 0.8 });
  const tx = w / 2 - 560 * u;
  g.rect(tx - 40 * u, 110 * u, 80 * u, 320 * u).fill({ color: 0x48503e }).poly([tx - 48 * u, 112 * u, tx + 48 * u, 112 * u, tx, 30 * u]).fill(0x48503e);
  g.poly(ell(tx, 170 * u, 26 * u, 26 * u, 20)).fill({ color: 0xf2e2a8, alpha: 0.85 });
  g.moveTo(tx, 170 * u).lineTo(tx, 152 * u).moveTo(tx, 170 * u).lineTo(tx + 12 * u, 176 * u).stroke({ width: 3 * u, color: 0x48503e });
  // the terraces
  const top = 250 * u;
  g.rect(0, top, w, curb - top).fill(BRICK);
  // the mortar in its own Graphics (thousands of little rects: kept apart from the rest, one fill)
  const bk = new Graphics();
  for (let y = top; y < curb; y += 16 * u) {
    bk.rect(0, y, w, 2.2 * u);
    const off = Math.round((y - top) / (16 * u)) % 2 ? 22 * u : 0;
    for (let x = off; x < w; x += 44 * u) bk.rect(x, y, 2.2 * u, 16 * u);
  }
  bk.fill(MORTAR);
  const g2 = new Graphics();
  // cornices and the house fronts' rhythm
  for (let x = -60 * u; x < w; x += 380 * u) {
    g2.rect(x, top - 14 * u, 370 * u, 18 * u).fill(0x6a5a48).rect(x + 360 * u, top, 14 * u, curb - top).fill(0x3a2620);
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 2; i++) {
        const wx = x + (70 + i * 150) * u;
        const wy = top + (60 + j * 220) * u;
        const lit = r() < 0.45;
        g2.rect(wx, wy, 80 * u, 140 * u).fill(lit ? 0xe8b860 : 0x1a2020).stroke({ width: 6 * u, color: 0xd8d0b8 });
        g2.moveTo(wx, wy + 70 * u).lineTo(wx + 80 * u, wy + 70 * u).moveTo(wx + 40 * u, wy).lineTo(wx + 40 * u, wy + 140 * u).stroke({ width: 3 * u, color: 0xd8d0b8 });
      }
  }
  // the green door with its fanlight
  const dx = doorX;
  const dy = curb;
  g2.rect(dx - 80 * u, dy - 300 * u, 160 * u, 300 * u).fill(0xd8d0b8);
  g2.rect(dx - 62 * u, dy - 250 * u, 124 * u, 250 * u).fill(DOOR).stroke({ width: 4 * u, color: 0x0e2018 });
  for (const yy of [-230, -150, -70]) g2.rect(dx - 50 * u, dy + yy * u, 44 * u, 60 * u).stroke({ width: 3 * u, color: 0x2f6a54 }).rect(dx + 6 * u, dy + yy * u, 44 * u, 60 * u).stroke({ width: 3 * u, color: 0x2f6a54 });
  g2.poly(ell(dx + 36 * u, dy - 130 * u, 6 * u, 6 * u, 8)).fill(0xd8b44a);
  g2.poly([dx - 62 * u, dy - 252 * u, ...arcPts(dx, dy - 252 * u, 62 * u, 40 * u, Math.PI, Math.PI * 2, 12), dx + 62 * u, dy - 252 * u]).fill(0xe8b860).stroke({ width: 4 * u, color: 0xd8d0b8 });
  // the railings and the curb
  for (let x = 0; x < w; x += 22 * u) g2.rect(x, curb - 70 * u, 4 * u, 70 * u).fill(IRON).poly([x - 3 * u, curb - 70 * u, x + 2 * u, curb - 82 * u, x + 7 * u, curb - 70 * u]).fill(IRON);
  g2.rect(0, curb - 66 * u, w, 5 * u).fill(IRON).rect(0, curb - 18 * u, w, 4 * u).fill(IRON);
  g2.rect(0, curb, w, 12 * u).fill(0x6a6a60);
  // cobbles (rows growing toward us)
  // cobbles as coarse octagons (roundRect tessellates its corners by radius), in their own Graphics, two fills
  const cb = new Graphics().rect(0, curb + 12 * u, w, h - curb).fill(0x22221d);
  const tones: number[][] = [[], []];
  let y = curb + 14 * u;
  for (let row = 0; y < h; row++) {
    const ch = (14 + row * 5) * u;
    const cw = ch * 1.5;
    for (let x = (row % 2) * cw * 0.5 - cw; x < w + cw; x += cw) tones[r() < 0.5 ? 0 : 1].push(x + cw / 2, y + ch / 2, cw / 2 - 2 * u, ch / 2 - 2 * u);
    y += ch;
  }
  tones.forEach((list, i) => {
    for (let j = 0; j < list.length; j += 4) cb.poly(ell(list[j], list[j + 1], list[j + 2], list[j + 3], 8, Math.PI / 8));
    cb.fill(i ? 0x34342e : 0x3a3a33);
  });
  const label = txt('221B', { fontFamily: F.serif, fontWeight: '700', fontSize: 30 * u, fill: 0x2a1a10 });
  label.anchor.set(0.5);
  label.position.set(dx, dy - 268 * u);
  return { g, bk, g2, cb, label, door: [dx, dy] as [number, number] };
}

/** a gas lamp (origin at its foot); the light (glow + cone) is separate so it can come on */
function gasLamp(s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-8 * s, -400 * s, 16 * s, 400 * s).fill(IRON).rect(-18 * s, -30 * s, 36 * s, 30 * s).fill(IRON).rect(-28 * s, -405 * s, 56 * s, 8 * s).fill(IRON);
  g.poly([-24 * s, -405 * s, 24 * s, -405 * s, 30 * s, -470 * s, -30 * s, -470 * s]).fill(0x3a3a2a).stroke({ width: 4 * s, color: IRON });
  g.poly([-36 * s, -470 * s, 36 * s, -470 * s, 0, -500 * s]).fill(IRON);
  const light = new Container();
  const glass = new Graphics().poly([-20 * s, -409 * s, 20 * s, -409 * s, 25 * s, -466 * s, -25 * s, -466 * s]).fill(GAS);
  const glow = glowDisc(190 * s, GAS, 0.5, 8, 24);
  glow.position.set(0, -438 * s);
  glow.blendMode = 'add';
  const cone = new Graphics().poly([-24 * s, -410 * s, 24 * s, -410 * s, 170 * s, 0, -170 * s, 0]).fill({ color: GAS, alpha: 0.1 });
  cone.blendMode = 'add';
  light.addChild(cone, glass, glow);
  k.addChild(g, light);
  return { k, light };
}

/** a pinned clue card (origin at its pin) */
function clue(text: string) {
  const k = new Container();
  const t = txt(text, { fontFamily: F.poster, fontSize: 30, fill: 0x2a1a10, letterSpacing: 1 });
  t.anchor.set(0.5, 0);
  t.y = 16;
  const g = new Graphics().rect(-t.width / 2 - 18, 0, t.width + 36, t.height + 30).fill(PAPER).stroke({ width: 3, color: 0x6a5030 });
  const pin = new Graphics().poly(ell(0, 4, 9, 9, 10)).fill(THREAD).stroke({ width: 2, color: 0x2a0a0a });
  k.addChild(g, t, pin);
  k.rotation = (Math.random() - 0.5) * 0.12;
  return k;
}

/** the trail of prints from the left edge to his feet */
function trail(): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const x = 120 + t * (W / 2 - 220);
    const y = 1010 - t * 190 + Math.sin(t * 5) * 30;
    out.push([x + (i % 2 ? 22 : -22), y, Math.PI / 2 - 0.35 + (i % 2 ? 0.25 : -0.25)]);
  }
  return out;
}

/** the magnifying glass (origin at the lens center, radius r) */
function lens(r: number) {
  const k = new Container();
  const glass = new Graphics().poly(ell(0, 0, r, r, 40)).fill({ color: 0xfff6d8, alpha: 0.12 });
  glass.blendMode = 'add';
  const g = new Graphics();
  g.moveTo(r * 0.7, r * 0.7).lineTo(r * 1.75, r * 1.75).stroke({ width: r * 0.2, color: 0x5a3a1c, cap: 'round' });
  g.moveTo(r * 0.72, r * 0.72).lineTo(r * 0.92, r * 0.92).stroke({ width: r * 0.24, color: 0xb8913f, cap: 'round' });
  g.poly(ell(0, 0, r, r, 40)).stroke({ width: r * 0.12, color: 0xb8913f }).poly(ell(0, 0, r * 1.05, r * 1.05, 40)).stroke({ width: r * 0.03, color: 0x5a3a10 });
  g.poly(arcPts(0, 0, r * 0.78, r * 0.78, Math.PI * 1.1, Math.PI * 1.45, 8), false).stroke({ width: r * 0.06, color: 0xffffff, alpha: 0.6, cap: 'round' });
  k.addChild(glass, g);
  return k;
}

interface St {
  lamps: ReturnType<typeof gasLamp>[];
  fogs: Graphics[];
  prints: Graphics;
  pins: [number, number][];
  clues: Container[];
}
const S = stash<St>();
const CLUES: [string, number, number][] = [
  ['OLOR A ATÚN', 330, 250],
  ['PELOS EN EL SOFÁ', 1600, 280],
  ['¿LA CROQUETA?', 1650, 640],
];

export const sherlock: Signature = {
  dark: true,
  frame: 0x4f7f72,
  tag: 'UNIVERSO DE NIEBLA',
  open(c: SigCtx) {
    const k = new Container();
    const CURB = 800;
    const st0 = street(W, H, 1, CURB, W / 2 + 520);
    const lamps = [180, 600, 1330, 1760].map((x, i) => {
      const l = gasLamp(i === 0 || i === 3 ? 1.05 : 0.9);
      l.k.position.set(x, CURB + (i === 0 || i === 3 ? 40 : 0));
      return l;
    });
    const prints = new Graphics();
    const steps = trail();
    const fogs = [0, 1, 2].map((i) => {
      const f = new Graphics();
      fogBank(f, -300, W + 600, [380, 640, 900][i], [90, 110, 130][i], FOG, [0.12, 0.14, 0.16][i], rng(20 + i), 14);
      return f;
    });
    const tint = new Graphics().rect(0, 0, W, H).fill({ color: FOG, alpha: 0.1 });
    k.addChild(st0.g, st0.bk, st0.g2, st0.cb, st0.label, fogs[0], ...lamps.map((l) => l.k), prints, fogs[1], fogs[2], tint);
    c.back.addChild(k);
    hideDisc(c);
    const halo = glowDisc(380, 0xe8dca8, 0.4, 8, 28);
    halo.position.set(W / 2, c.catY - 20);
    c.behind.addChild(halo);
    const st: St = { lamps, fogs, prints, pins: CLUES.map(([, x, y]) => [x, y]), clues: [] };
    S.set(c, st);
    const lampOn = (l: ReturnType<typeof gasLamp>, on: boolean) => !l.light.destroyed && (l.light.alpha = on ? 1 : 0);
    if (!c.reduce)
      every(c, 30, (t) => {
        fogs.forEach((f, i) => !f.destroyed && (f.x = Math.sin(t * (0.25 + i * 0.1) + i) * 120 - 100));
        lamps.forEach((l) => !l.light.destroyed && l.light.alpha > 0.5 && c.flashes && (l.light.alpha = 0.9 + Math.random() * 0.1));
      });
    const drawPrints = (n: number, alpha = 1) => {
      if (prints.destroyed) return;
      prints.clear();
      for (let i = 0; i < n; i++) {
        const [x, y, a] = steps[i];
        const s = 1.4 + (y - 800) / 200;
        pawPrint(prints, x, y, s, a, PRINT, alpha * 0.95);
      }
    };
    if (c.short) {
      drawPrints(steps.length);
      return;
    }
    lamps.forEach((l) => lampOn(l, !!c.reduce));
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.4 });
    }
    score(c, [
      [0.02, 'whoosh', 0.4],
      [0.12, 'tick', 1.1],
      [0.28, 'tick', 1.2],
      [0.44, 'tick', 1.0],
      [0.6, 'tick', 1.3],
      [1.0, 'pencil', 1.2],
      [1.35, 'whoosh', 0.7],
      [1.9, 'gem', 1.2],
    ]);
    // the lamps come on one by one
    [0, 3, 1, 2].forEach((li, i) =>
      beat(c, 0.12 + i * 0.16, () => {
        const l = lamps[li];
        lampOn(l, true);
        sfx('pop', 1.2 + i * 0.1);
        if (!c.reduce) gsap.fromTo(l.light, { alpha: 0 }, { alpha: 1, duration: 0.15 });
      }),
    );
    // the prints glow up, one by one, toward him
    const n = { v: 0 };
    if (c.reduce) drawPrints(steps.length);
    else {
      gsap.to(n, {
        v: steps.length,
        duration: 0.8,
        delay: 0.45,
        ease: 'none',
        onUpdate: () => {
          const k2 = Math.floor(n.v);
          if (k2 !== Math.floor(n.v - 0.0001)) sfx('tick', 0.7);
          drawPrints(k2);
        },
      });
    }
    // the red thread joins them and runs to the clues
    const thread = new Graphics();
    k.addChild(thread);
    beat(c, 1.0, () => {
      const path: number[] = [];
      for (const [x, y] of steps) path.push(x, y);
      const prog = { v: c.reduce ? 1 : 0 };
      const draw = () => {
        if (thread.destroyed) return;
        thread.clear();
        const m = Math.max(2, Math.floor((path.length / 2) * prog.v));
        thread.poly(path.slice(0, m * 2), false).stroke({ width: 4, color: THREAD, join: 'round' });
        if (prog.v >= 1) {
          for (const [, x, y] of CLUES) thread.moveTo(steps[steps.length - 1][0], steps[steps.length - 1][1]).lineTo(x, y + 4);
          thread.stroke({ width: 3, color: THREAD, alpha: 0.85 });
        }
      };
      if (c.reduce) draw();
      else gsap.to(prog, { v: 1, duration: 0.35, ease: 'none', onUpdate: draw, onComplete: draw });
      CLUES.forEach(([text, x, y], i) =>
        beat(c, 0.35 + i * 0.12, () => {
          const cl = clue(text);
          cl.position.set(x, y);
          k.addChild(cl);
          st.clues.push(cl);
          sfx('paper', 1.2);
          if (!c.reduce) gsap.from(cl.scale, { x: 0.2, y: 0.2, duration: 0.2, ease: 'back.out(2.5)' });
        }),
      );
    });
    // the giant lens sweeps over him; under it the prints come up big
    beat(c, 1.3, () => {
      if (c.reduce) return;
      const R = 210;
      const L = lens(R);
      const big = new Graphics();
      const mask = new Graphics().poly(ell(0, 0, R * 0.94, R * 0.94, 36)).fill(0xffffff);
      big.mask = mask;
      c.fg.addChild(big, mask, L);
      const MAG = 1.7;
      const p = { t: 0 };
      gsap.to(p, {
        t: 1,
        duration: 0.95,
        ease: 'sine.inOut',
        onUpdate: () => {
          if (L.destroyed) return;
          const x = -260 + p.t * (W + 520);
          const y = 790 - 190 * Math.sin(Math.PI * p.t);
          L.position.set(x, y);
          mask.position.set(x, y);
          big.clear();
          for (const [px, py, a] of steps) {
            const s = (1.4 + (py - 800) / 200) * MAG;
            pawPrint(big, x + (px - x) * MAG, y + (py - y) * MAG, s, a, 0xfff2c0, 1);
          }
          big.poly(ell(x, y, R, R, 36)).fill({ color: 0xffe9a8, alpha: 0.12 });
        },
        onComplete: () => {
          destroyTree(L);
          destroyTree(big);
          destroyTree(mask);
        },
      });
    });
    // the clues fade before the name comes (the thread stays on the cobbles)
    beat(c, 2.15, () => st.clues.forEach((cl) => !cl.destroyed && gsap.to(cl, { alpha: 0, duration: 0.3, onComplete: () => destroyTree(cl) })));
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('gem', 0.9);
    sfx('sting', 1.1);
    later(c, 0.08, () => sfx('hit', 1.3));
    later(c, 0.16, () => sfx('hit', 1.5));
    later(c, 0.24, () => sfx('hit', 1.7));
    c.shaker.add(0.25);
    if (st) {
      st.clues.forEach((cl) => !cl.destroyed && destroyTree(cl));
      // threads snap from every clue's pin into him
      const g = new Graphics();
      c.behind.addChild(g);
      const pr = { v: c.reduce ? 1 : 0 };
      const draw = () => {
        if (g.destroyed) return;
        g.clear();
        for (const [x, y] of st.pins) g.moveTo(x, y).lineTo(x + (W / 2 - x) * pr.v, y + (c.catY - y) * pr.v);
        g.stroke({ width: 5, color: THREAD });
        for (const [x, y] of st.pins) g.poly(ell(x, y, 11, 11, 10)).fill(THREAD).stroke({ width: 2, color: 0x2a0a0a });
      };
      draw();
      if (!c.reduce) gsap.to(pr, { v: 1, duration: 0.25, ease: 'power3.in', onUpdate: draw });
      gsap.to(g, { alpha: 0, delay: 2.2, duration: 0.5, onComplete: () => destroyTree(g) });
      // the lamps flare, the fog parts
      st.lamps.forEach((l) => {
        if (l.light.destroyed) return;
        l.light.alpha = 1;
        if (!c.reduce) gsap.fromTo(l.light.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.6, ease: 'power2.out' });
      });
      if (!c.reduce) st.fogs.forEach((f, i) => !f.destroyed && gsap.to(f, { alpha: 0.35, duration: 0.6, delay: i * 0.05 }));
    }
    headline(c, '¡ELEMENTAL!', { fontFamily: F.poster, fontSize: 156, fill: PAPER, letterSpacing: 5, stroke: { color: 0x2a1a10, width: 14, join: 'round' } }, {
      glow: GAS,
      aside: '…mi querido michi.',
      asideStyle: { fill: 0xf2e8cc, stroke: { color: 0x2a1a10, width: 8, join: 'round' } },
      dur: 2.7,
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const curb = h * 0.74;
    const s = 0.34 * u;
    const st0 = street(w, h, s, curb, w / 2 + 150 * u);
    const lamps = [w / 2 - 130 * u, w / 2 + 130 * u].map((x) => {
      const l = gasLamp(0.36 * u);
      l.k.position.set(x, curb);
      return l;
    });
    for (let x = w / 2 - 130 * u - 360 * u; x > -40 * u; x -= 360 * u) {
      const l = gasLamp(0.36 * u);
      l.k.position.set(x, curb);
      lamps.push(l);
    }
    for (let x = w / 2 + 130 * u + 360 * u; x < w + 40 * u; x += 360 * u) {
      const l = gasLamp(0.36 * u);
      l.k.position.set(x, curb);
      lamps.push(l);
    }
    const prints = new Graphics();
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      pawPrint(prints, w * 0.08 + t * w * 0.38 + (i % 2 ? 6 : -6) * u, h * 0.96 - t * h * 0.16, (0.5 + (1 - t) * 0.3) * u, Math.PI / 2 - 0.35, PRINT, 0.9);
    }
    const thread = new Graphics();
    const pts: number[] = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      pts.push(w * 0.08 + t * w * 0.38, h * 0.96 - t * h * 0.16);
    }
    thread.poly(pts, false).stroke({ width: 1.5 * u, color: THREAD });
    const fog = new Graphics();
    fogBank(fog, -40 * u, w + 80 * u, h * 0.55, 40 * u, FOG, 0.14, rng(21), Math.max(8, Math.round(w / (50 * u))));
    fogBank(fog, -40 * u, w + 80 * u, h * 0.9, 40 * u, FOG, 0.16, rng(22), Math.max(8, Math.round(w / (50 * u))));
    const halo = glowDisc(Math.min(w, h) * 0.4, 0xe8dca8, 0.35, 6, 28);
    halo.position.set(w / 2, h * 0.52);
    const L = lens(30 * u);
    L.position.set(w / 2 + 120 * u, h * 0.88);
    L.rotation = -0.3;
    k.addChild(st0.g, st0.bk, st0.g2, st0.cb, st0.label, ...lamps.map((l) => l.k), prints, thread, fog, halo, L);
    if (live)
      cardLoop(k, 30, (t) => {
        fog.x = Math.sin(t * 0.3) * 20 * u;
        lamps.forEach((l) => (l.light.alpha = 0.9 + Math.random() * 0.1));
        L.position.set(w / 2 + Math.sin(t * 0.5) * 150 * u, h * 0.86 + Math.cos(t * 0.5) * 8 * u);
      });
    return k;
  },
};
