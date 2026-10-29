/**
 * Miauby-Doo: the mystery universe (a 1970s cartoon about a cowardly detective dog and his gang). A haunted mansion's
 * hallway at night — purple striped wallpaper, a wood wainscot, a red runner, a row of doors, stern portraits whose eyes
 * follow you, candles in sconces, cobwebs, a tall arched window with a full moon and bats. Thunder; the doors open and
 * slam by themselves (¡PAM! ¡BANG!); a sheet ghost dashes out of one door and into another, back and forth across the
 * hall; he trembles (¡GLUP!); the ghost looms over him — ¡BUUU! — and he grabs the sheet…
 * Payoff: the sheet comes off: under it, the grumpy old janitor with his mop; the lights come up; ¡ERA EL CONSERJE!
 * (…con razón olía a trapeador.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { beat, pay } from './kitC';
import { balloon, onCat } from './kitD';
import { asideText, bar, borrowFor, glow, oval, payline, pop, pre, rand, rrect, star, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const WALL = 0x2e2350;
const STRIPE = 0x3a2d63;
const WOOD = 0x3b2418;
const DOOR = 0x5a3420;
const FRAME = 0x24130a;
const GOLD = 0xe6c34a;
const MOON = 0xf4ecc0;
const GHOST = 0xeef6ee;
const ORANGE = 0xffb21f;

/** a door, origin at its bottom-left: the dark doorway + the leaf (pivot at the hinge, scale.x closes/opens it) */
function door(w: number, h: number, s: number) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-14 * s, -h - 14 * s, w + 28 * s, h + 14 * s).fill(FRAME);
  g.rect(0, -h, w, h).fill(0x07050c);
  const eyes = new Graphics();
  eyes.poly(oval(w * 0.38, -h * 0.62, 9 * s, 6 * s, 8)).poly(oval(w * 0.6, -h * 0.62, 9 * s, 6 * s, 8)).fill(0xfff04a);
  eyes.alpha = 0;
  const leaf = new Graphics();
  leaf.rect(0, -h, w, h).fill(DOOR).stroke({ width: 3 * s, color: FRAME });
  for (const [y0, y1] of [
    [0.08, 0.44],
    [0.54, 0.92],
  ])
    leaf.rect(w * 0.14, -h * (1 - y0), w * 0.72, h * (y1 - y0)).stroke({ width: 4 * s, color: 0x3e2212 });
  leaf.poly(oval(w * 0.84, -h * 0.48, 9 * s, 9 * s, 8)).fill(GOLD);
  k.addChild(g, eyes, leaf);
  return { k, leaf, eyes };
}

/** a framed portrait of a stern ancestor cat, its eyes on their own Graphics (they follow you) */
function portrait(w: number, h: number, s: number, seed: number) {
  const k = new Container();
  const r = rand(seed);
  const fur = [0x7a6a58, 0x5a5a66, 0x9a6a3a][Math.floor(r() * 3)];
  const g = new Graphics();
  g.rect(-w / 2 - 16 * s, -h / 2 - 16 * s, w + 32 * s, h + 32 * s).fill(0xb8902a).stroke({ width: 4 * s, color: 0x5a400a });
  g.rect(-w / 2, -h / 2, w, h).fill(0x3a4a3a);
  g.poly([-w * 0.42, h / 2, -w * 0.3, h * 0.12, w * 0.3, h * 0.12, w * 0.42, h / 2]).fill(0x1a1a22);
  g.poly([-w * 0.3, -h * 0.12, -w * 0.28, -h * 0.42, -w * 0.08, -h * 0.26, w * 0.08, -h * 0.26, w * 0.28, -h * 0.42, w * 0.3, -h * 0.12, w * 0.22, h * 0.14, -w * 0.22, h * 0.14]).fill(fur);
  g.poly(oval(-w * 0.1, -h * 0.06, w * 0.08, h * 0.05, 10)).fill(0xf2f0e0).poly(oval(w * 0.1, -h * 0.06, w * 0.08, h * 0.05, 10)).fill(0xf2f0e0);
  g.poly([-w * 0.2, -h * 0.16, -w * 0.02, -h * 0.11, -w * 0.02, -h * 0.09, -w * 0.2, -h * 0.13]).poly([w * 0.2, -h * 0.16, w * 0.02, -h * 0.11, w * 0.02, -h * 0.09, w * 0.2, -h * 0.13]).fill(0x1a1a1a);
  g.poly([-w * 0.14, h * 0.06, w * 0.14, h * 0.06, w * 0.1, h * 0.09, -w * 0.1, h * 0.09]).fill(0x2a1a1a);
  const eyes = new Graphics().poly(oval(-w * 0.1, -h * 0.06, w * 0.035, h * 0.04, 8)).poly(oval(w * 0.1, -h * 0.06, w * 0.035, h * 0.04, 8)).fill(0x111111);
  k.addChild(g, eyes);
  return { k, eyes };
}

/** a candle sconce (origin at the plate): the flame is separate (flicker) */
function sconce(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.poly(oval(0, 0, 14 * s, 22 * s, 10)).fill(GOLD).poly(bar(0, 0, 0, -30 * s, 4 * s)).fill(GOLD);
  g.poly(rrect(-30 * s, -36 * s, 60 * s, 10 * s, 4 * s, 2)).fill(GOLD);
  for (const x of [-22, 0, 22]) g.rect((x - 5) * s, -80 * s, 10 * s, 44 * s).fill(0xf2ead0);
  const flame = new Container();
  const halo = glow(90 * s, 0xffc060, 0.55, 6, 18);
  halo.blendMode = 'add';
  halo.y = -92 * s;
  const fl = new Graphics();
  for (const x of [-22, 0, 22]) fl.poly([x * s, -106 * s, (x + 6) * s, -90 * s, x * s, -82 * s, (x - 6) * s, -90 * s]);
  fl.fill(0xffd27a);
  flame.addChild(halo, fl);
  k.addChild(g, flame);
  return { k, flame };
}

/** the sheet ghost (origin at the bottom center; the janitor waits under the sheet) */
function ghost(s: number) {
  const k = new Container();
  // the janitor: an old grey cat, cap, bushy white moustache, green coveralls, a mop
  const jan = new Graphics();
  const ink = { width: 5 * s, color: 0x1a1020, join: 'round' as const };
  jan.poly(bar(150 * s, -380 * s, 120 * s, 0, 7 * s)).fill(0x8a6a3a);
  jan.poly([90 * s, 0, 150 * s, 0, 140 * s, -40 * s, 100 * s, -40 * s]).fill(0xc8c0b0).stroke({ width: 3 * s, color: 0x1a1020 });
  jan.poly(rrect(-80 * s, -250 * s, 160 * s, 230 * s, 40 * s, 3)).fill(0x4a7a4a).stroke(ink);
  jan.poly(rrect(-60 * s, -40 * s, 50 * s, 40 * s, 12 * s, 2)).fill(0x2a2a2a).poly(rrect(10 * s, -40 * s, 50 * s, 40 * s, 12 * s, 2)).fill(0x2a2a2a);
  jan.poly(bar(-70 * s, -230 * s, -100 * s, -120 * s, 18 * s)).fill(0x4a7a4a).stroke(ink);
  jan.poly(bar(70 * s, -230 * s, 128 * s, -180 * s, 18 * s)).fill(0x4a7a4a).stroke(ink);
  jan.poly(oval(-46 * s, -150 * s, 10 * s, 10 * s, 10)).fill(GOLD).poly(oval(-34 * s, -140 * s, 10 * s, 10 * s, 10)).fill(0xc0c6cc);
  const hy = -310 * s;
  jan.poly([-74 * s, hy - 10 * s, -70 * s, hy - 84 * s, -30 * s, hy - 56 * s]).fill(0x8a8a94).stroke(ink);
  jan.poly([74 * s, hy - 10 * s, 70 * s, hy - 84 * s, 30 * s, hy - 56 * s]).fill(0x8a8a94).stroke(ink);
  jan.poly(oval(0, hy, 80 * s, 70 * s, 18)).fill(0x9a9aa4).stroke(ink);
  jan.poly([-84 * s, hy - 40 * s, 84 * s, hy - 40 * s, 70 * s, hy - 86 * s, -70 * s, hy - 86 * s]).fill(0x3a6a3a).stroke(ink);
  jan.poly([-84 * s, hy - 40 * s, -120 * s, hy - 30 * s, -84 * s, hy - 28 * s]).fill(0x3a6a3a);
  jan.poly([-50 * s, hy - 26 * s, -10 * s, hy - 16 * s, -10 * s, hy - 8 * s, -50 * s, hy - 14 * s]).fill(0xffffff).poly([50 * s, hy - 26 * s, 10 * s, hy - 16 * s, 10 * s, hy - 8 * s, 50 * s, hy - 14 * s]).fill(0xffffff);
  jan.poly(oval(-26 * s, hy, 8 * s, 6 * s, 8)).fill(0x1a1020).poly(oval(26 * s, hy, 8 * s, 6 * s, 8)).fill(0x1a1020);
  jan.poly([-70 * s, hy + 34 * s, -36 * s, hy + 18 * s, 0, hy + 26 * s, 36 * s, hy + 18 * s, 70 * s, hy + 34 * s, 40 * s, hy + 44 * s, 0, hy + 36 * s, -40 * s, hy + 44 * s]).fill(0xffffff).stroke({ width: 3 * s, color: 0x1a1020, join: 'round' });
  jan.poly(oval(0, hy + 14 * s, 9 * s, 7 * s, 8)).fill(0xd88a8a);
  // the sheet: a dome, raised arms, a wavy hem; two eye holes and a mouth
  const sheet = new Container();
  const sg = new Graphics();
  const pts: number[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    pts.push(Math.cos(a) * 120 * s, -300 * s + Math.sin(a) * 130 * s);
  }
  pts.push(170 * s, -250 * s, 200 * s, -330 * s, 210 * s, -250 * s, 160 * s, -150 * s, 170 * s, 0);
  for (let i = 0; i <= 8; i++) pts.push(170 * s - (i / 8) * 340 * s, (i % 2 ? -34 : 0) * s);
  pts.push(-160 * s, -150 * s, -210 * s, -250 * s, -200 * s, -330 * s, -170 * s, -250 * s);
  sg.poly(pts).fill(GHOST).stroke({ width: 6 * s, color: 0x9ab8a8, join: 'round' });
  sg.poly(oval(-46 * s, -320 * s, 22 * s, 32 * s, 12)).fill(0x101018).poly(oval(46 * s, -320 * s, 22 * s, 32 * s, 12)).fill(0x101018);
  sg.poly(oval(0, -240 * s, 30 * s, 40 * s, 12)).fill(0x101018);
  for (let i = 0; i < 3; i++) sg.poly(bar(-90 * s + i * 70 * s, -200 * s, -110 * s + i * 76 * s, -40 * s, 3 * s)).fill({ color: 0xb8d0c4, alpha: 0.8 });
  const halo = glow(300 * s, 0xb8ffd0, 0.35, 6, 20, 340 * s);
  halo.blendMode = 'add';
  halo.y = -220 * s;
  sheet.addChild(halo, sg);
  sheet.pivot.set(0, -300 * s);
  sheet.y = -300 * s;
  k.addChild(jan, sheet);
  jan.visible = false;
  return { k, sheet, jan };
}

/**
 * the hallway (w×h, u = scale vs the 1920×1080 reveal); doors at `dx` (centers), portraits and sconces between them,
 * the arched window centered at (wx, wy)
 */
function hallway(w: number, h: number, u: number, dx: number[], wx: number) {
  const g = new Graphics().rect(0, 0, w, h).fill(WALL);
  for (let x = (w / 2) % (60 * u); x < w; x += 60 * u) g.rect(x, 0, 26 * u, h * 0.6);
  g.fill(STRIPE);
  const wain = h * 0.6;
  const floorY = h * 0.8;
  g.rect(0, wain, w, floorY - wain).fill(WOOD);
  for (let x = (w / 2) % (180 * u); x < w; x += 180 * u) g.rect(x + 16 * u, wain + 22 * u, 148 * u, floorY - wain - 44 * u).stroke({ width: 4 * u, color: 0x2a180e });
  g.rect(0, wain - 10 * u, w, 14 * u).fill(0x24140a);
  g.rect(0, floorY, w, h - floorY).fill(0x2a1a12);
  g.poly([0, floorY + 40 * u, w, floorY + 40 * u, w, h, 0, h]).fill(0x6a1a2a);
  for (let x = 0; x < w; x += 80 * u) g.poly(star(x + 40 * u, floorY + (h - floorY) * 0.6, 14 * u, 6 * u, 4)).fill({ color: GOLD, alpha: 0.45 });
  g.rect(0, floorY + 40 * u, w, 6 * u).fill(GOLD);
  // cobwebs in the top corners
  const web = (x: number, d: number) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 4) * (Math.PI / 2);
      g.poly(bar(x, 0, x + d * Math.cos(a) * 170 * u, Math.sin(a) * 170 * u, 1.2 * u));
    }
    for (let j = 1; j <= 3; j++) {
      const pts: number[] = [];
      for (let i = 0; i <= 4; i++) {
        const a = (i / 4) * (Math.PI / 2);
        const rr = j * 50 * u - (i % 2) * 10 * u;
        pts.push(x + d * Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.poly(pts, false).stroke({ width: 1.5 * u, color: 0xc8c8d8, alpha: 0.6 });
    }
    g.fill({ color: 0xc8c8d8, alpha: 0.6 });
  };
  web(0, 1);
  web(w, -1);
  // the arched window: night sky, full moon, a dead tree's branch
  const win = new Graphics();
  const ww = 250 * u;
  const wt = 110 * u;
  const wb = 440 * u;
  const arch: number[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI;
    arch.push(wx + Math.cos(a) * ww / 2, wt + ww / 2 + Math.sin(a) * ww / 2);
  }
  win.poly([wx - ww / 2 - 18 * u, wb + 18 * u, ...arch.map((v, i) => (i % 2 ? v - 18 * u : v + (v < wx ? -18 * u : 18 * u))), wx + ww / 2 + 18 * u, wb + 18 * u]).fill(FRAME);
  win.poly([wx - ww / 2, wb, ...arch, wx + ww / 2, wb]).fill(0x1a2a5a);
  win.poly(oval(wx + 40 * u, wt + 120 * u, 66 * u, 66 * u, 22)).fill(MOON);
  win.poly(oval(wx + 22 * u, wt + 104 * u, 12 * u, 10 * u, 10)).poly(oval(wx + 62 * u, wt + 140 * u, 16 * u, 12 * u, 10)).fill({ color: 0xd8cc98, alpha: 0.8 });
  win.poly([wx - ww / 2, wt + 260 * u, wx - 30 * u, wt + 200 * u, wx + 20 * u, wt + 150 * u, wx - 10 * u, wt + 196 * u, wx + 60 * u, wt + 236 * u, wx - 40 * u, wt + 214 * u, wx - ww / 2, wt + 282 * u]).fill(0x0a0a14);
  win.poly(bar(wx, wt, wx, wb, 4 * u)).poly(bar(wx - ww / 2, wt + 250 * u, wx + ww / 2, wt + 250 * u, 4 * u)).fill(FRAME);
  win.rect(wx - ww / 2 - 30 * u, wb + 10 * u, ww + 60 * u, 18 * u).fill(0x24140a);
  const doors = dx.map((x) => {
    const d = door(200 * u, 420 * u, u);
    d.k.position.set(x - 100 * u, floorY);
    return d;
  });
  return { g, win, doors, floorY, wain };
}

/** bats (little zigzag wings), one Graphics redrawn */
function bats(g: Graphics, t: number, x0: number, y0: number, s: number, n: number) {
  g.clear();
  for (let i = 0; i < n; i++) {
    const q = (t * 0.25 + i / n) % 1;
    const x = x0 - 160 * s + q * 320 * s;
    const y = y0 + Math.sin(q * 9 + i) * 30 * s + i * 22 * s;
    const f = Math.sin(t * 18 + i * 2) * 10 * s;
    g.poly([x - 22 * s, y - f, x - 8 * s, y + 2 * s, x, y - 4 * s, x + 8 * s, y + 2 * s, x + 22 * s, y - f, x + 6 * s, y + 8 * s, x, y + 4 * s, x - 6 * s, y + 8 * s]);
  }
  g.fill(0x07050c);
}

interface St {
  gh: ReturnType<typeof ghost>;
  lightsUp: () => void;
  words: Container[];
  line: ReturnType<typeof payline>;
  give: () => void;
}
const S = stash<St>();
const DOORS = [170, 480, 1440, 1750];
const LOOM: [number, number, number] = [1390, 900, 1.15];

export const miauby: Signature = {
  dark: true,
  frame: 0x7a4fb0,
  tag: 'UNIVERSO DEL MISTERIO',
  open(c: SigCtx) {
    const k = new Container();
    const hw = hallway(W, H, 1, DOORS, W / 2);
    const pics = [325, 1595].map((x, i) => {
      const p = portrait(130, 170, 1, 3 + i);
      p.k.position.set(x, 300);
      return p;
    });
    const sc = [325, 1595].map((x) => {
      const s0 = sconce(1);
      s0.k.position.set(x, 560);
      return s0;
    });
    const batG = new Graphics();
    const dark = new Graphics().rect(0, 0, W, H).fill({ color: 0x0a0820, alpha: 0.35 });
    const gh = ghost(1);
    gh.k.position.set(LOOM[0], LOOM[1]);
    gh.k.scale.set(LOOM[2]);
    k.addChild(hw.g, hw.win, batG, ...pics.map((p) => p.k), ...hw.doors.map((d) => d.k), ...sc.map((s0) => s0.k), gh.k, dark);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const halo = glow(380, 0xb8a8ff, 0.35, 7, 24);
    halo.position.set(W / 2, c.catY);
    c.behind.addChild(halo);
    const words: Container[] = [];
    const line = payline(c, () => title('¡ERA EL\nCONSERJE!', { size: 120, fill: ORANGE, ink: 0x2a0a3a, inkW: 14, shadow: 0x7a4fb0 }), () => asideText('…con razón olía a trapeador.', 0xffffff, 0x2a0a3a, 44));
    const give = borrowFor(c, 1.25, 0.55, (cat, x0, _y0, q) => {
      cat.x = x0 + Math.sin(q * 70) * 7 * (1 - q * 0.3);
    });
    const lightsUp = () => {
      if (dark.destroyed) return;
      if (c.reduce) dark.alpha = 0;
      else gsap.to(dark, { alpha: 0, duration: 0.4 });
    };
    S.set(c, { gh, lightsUp, words, line, give });
    let look = 0;
    if (!c.reduce)
      every(c, 30, (t) => {
        if (!batG.destroyed) bats(batG, t, W / 2 + 40, 200, 1, 3);
        sc.forEach((s0, i) => !s0.flame.destroyed && (s0.flame.alpha = 0.8 + 0.2 * Math.sin(t * 13 + i * 3) * (c.flashes ? 1 : 0.3)));
        look = Math.sin(t * 1.6);
        pics.forEach((p) => !p.eyes.destroyed && (p.eyes.x = look * 9));
        if (!gh.sheet.destroyed && !gh.jan.visible) gh.sheet.y = -300 + Math.sin(t * 3) * 10;
      });
    else bats(batG, 0.4, W / 2 + 40, 200, 1, 3);
    if (c.short) return;

    // the ghost waits off-stage until its run
    if (!c.reduce) gh.k.alpha = 0;
    score(c, [
      [0.02, 'boom', 0.45],
      [0.32, 'whoosh', 0.4],
      [0.5, 'hit', 0.8],
      [0.66, 'hit', 0.7],
      [1.25, 'freeze', 1.6],
      [1.6, 'sting', 0.8],
    ]);
    // thunder: the window flashes
    beat(c, 0.04, () => {
      if (c.flashes && !hw.win.destroyed) {
        const f = new Graphics().rect(0, 0, W, H).fill({ color: 0xdfe6ff, alpha: 0.5 });
        k.addChild(f);
        gsap.to(f, { alpha: 0, duration: 0.35, onComplete: () => destroyTree(f) });
      }
    });
    const crash = pre(c.fg, title('¡CRAAACK!', { size: 96, fill: 0xdfe6ff, ink: 0x1a1040, inkW: 12, shadow: null }), W / 2 + 330, 170, 0.1);
    words.push(crash);
    pop(c, crash, 0.06, 0.45);
    // the doors open and slam by themselves
    const swing = (i: number, at: number, open: boolean, word?: string) => {
      const d = hw.doors[i];
      if (word) {
        const t = pre(c.fg, title(word, { size: 92, fill: ORANGE, ink: 0x2a0a3a, inkW: 11, shadow: null }), d.k.x + 100, d.k.y - 480, (i % 2 ? 1 : -1) * 0.14);
        words.push(t);
        pop(c, t, at, 0.4, { onShow: () => c.shaker.add(0.08) });
      }
      beat(c, at, () => {
        if (d.leaf.destroyed) return;
        if (c.reduce) d.leaf.scale.x = open ? 0.15 : 1;
        else gsap.to(d.leaf.scale, { x: open ? 0.15 : 1, duration: open ? 0.16 : 0.08, ease: open ? 'power2.out' : 'power3.in' });
      });
    };
    swing(0, 0.28, true);
    swing(2, 0.32, true);
    swing(0, 0.5, false, '¡PAM!');
    swing(3, 0.55, true);
    swing(2, 0.66, false, '¡BANG!');
    swing(1, 0.7, true);
    // the chase: out of one door, across the hall, into another
    const run = (from: number, to: number, at: number, dur: number) =>
      beat(c, at, () => {
        if (c.reduce || gh.k.destroyed) return;
        const x0 = DOORS[from];
        const x1 = DOORS[to];
        gh.k.alpha = 1;
        gh.k.scale.set(0.55 * (x1 > x0 ? -1 : 1), 0.55);
        gh.k.position.set(x0, hw.floorY - 10);
        gsap.to(gh.k, { x: x1, duration: dur, ease: 'none', onComplete: () => !gh.k.destroyed && (gh.k.alpha = 0) });
        sfx('whoosh', 0.9);
      });
    run(3, 1, 0.6, 0.32);
    run(1, 3, 0.96, 0.3);
    const boo = pre(c.fg, balloon('¡BUUU!', { size: 46, jag: true, tx: -60, ty: 90 }), DOORS[1] + 40, 440, -0.05);
    words.push(boo);
    pop(c, boo, 0.62, 0.3, { from: 0.4 });
    // he trembles
    const [mx, my] = onCat(c, 0.62, 0.12);
    const glup = pre(c.fg, title('¡GLUP!', { size: 84, fill: 0xffffff, ink: 0x2a0a3a, inkW: 10, shadow: null }), mx - 240, my - 30, -0.15);
    words.push(glup);
    pop(c, glup, 1.3, 0.5);
    // the ghost looms beside him… ¡BUUUUU!
    beat(c, 1.5, () => {
      if (gh.k.destroyed) return;
      gh.k.alpha = 1;
      gh.k.position.set(LOOM[0] + 260, LOOM[1]);
      gh.k.scale.set(0.6);
      if (c.reduce) {
        gh.k.position.set(LOOM[0], LOOM[1]);
        gh.k.scale.set(LOOM[2]);
      } else {
        gsap.to(gh.k, { x: LOOM[0], duration: 0.3, ease: 'power2.out' });
        gsap.to(gh.k.scale, { x: LOOM[2], y: LOOM[2], duration: 0.3, ease: 'back.out(1.6)' });
      }
      hw.doors[3].eyes.alpha = 1;
    });
    const buu = pre(c.fg, balloon('¡BUUUUU!', { size: 64, jag: true, tx: -150, ty: 120 }), LOOM[0] + 60, 230, 0.06);
    words.push(buu);
    pop(c, buu, 1.62, 0.45, { from: 0.4, onShow: () => c.shaker.add(0.15) });
    // he grabs the sheet: it stretches toward him
    beat(c, 2.0, () => {
      if (c.reduce || gh.sheet.destroyed) return;
      gsap.to(gh.sheet.skew, { x: 0.18, duration: 0.15, yoyo: true, repeat: 1 });
      sfx('paper', 0.8);
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('paper', 0.6);
    sfx('whoosh', 1.2);
    later(c, 0.12, () => sfx('sting', 1.3));
    later(c, 0.3, () => sfx('fanfare', 1.1));
    c.shaker.add(0.3);
    flashOf(c, 0xfff6d8, 0.45, 0.3);
    if (!st) return;
    st.give();
    sweep(st.words);
    st.lightsUp();
    st.line.land(2.4);
    const { gh } = st;
    if (gh.k.destroyed) return;
    gsap.killTweensOf(gh.k);
    gsap.killTweensOf(gh.k.scale);
    gh.k.alpha = 1;
    gh.k.position.set(LOOM[0], LOOM[1]);
    gh.k.scale.set(LOOM[2]);
    gh.jan.visible = true;
    // the sheet flies off toward him, spinning, and falls away
    const sh = gh.sheet;
    if (c.reduce) sh.visible = false;
    else {
      gsap.killTweensOf(sh.skew);
      sh.skew.set(0, 0);
      gsap.to(sh, { x: -380, y: -620, rotation: -2.4, duration: 0.5, ease: 'power2.out' });
      gsap.to(sh.scale, { x: 0.6, y: 0.4, duration: 0.5 });
      gsap.to(sh, { alpha: 0, delay: 0.35, duration: 0.25 });
      gsap.fromTo(gh.jan.scale, { y: 0.9 }, { y: 1, duration: 0.3, ease: 'back.out(3)' });
    }
    // the janitor's grumble
    later(c, 0.35, () => {
      if (gh.k.destroyed) return;
      const g = new Graphics();
      for (let i = 0; i < 3; i++) g.poly(star(LOOM[0] - 40 + i * 70, LOOM[1] - 520 - (i % 2) * 30, 20, 8, 4)).fill(0xffffff);
      c.fg.addChild(g);
      gsap.to(g, { alpha: 0, delay: 0.6, duration: 0.3, onComplete: () => destroyTree(g) });
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const span = 640 * u;
    const dx: number[] = [];
    for (let x = w / 2 - 470 * u; x > -100 * u; x -= span) dx.push(x);
    for (let x = w / 2 + 470 * u; x < w + 100 * u; x += span) dx.push(x);
    const hw = hallway(w, h, u, dx, w / 2);
    const pics: ReturnType<typeof portrait>[] = [];
    const scs: ReturnType<typeof sconce>[] = [];
    for (const x of dx) {
      const px = x + (x < w / 2 ? -320 * u : 320 * u);
      if (px < -60 * u || px > w + 60 * u) continue;
      const p = portrait(130 * u, 170 * u, u, Math.round(px));
      p.k.position.set(px, 300 * u);
      pics.push(p);
      const s0 = sconce(u);
      s0.k.position.set(px, 560 * u);
      scs.push(s0);
    }
    // one door ajar with eyes in the dark; the ghost peeks out of the next one
    const ajar = hw.doors[0];
    ajar.leaf.scale.x = 0.35;
    ajar.eyes.alpha = 1;
    const gh = ghost(u * 0.8);
    const nl = dx.filter((x) => x < w / 2).length;
    const gd = hw.doors[nl] ?? hw.doors[0];
    gd.leaf.scale.x = 0.2;
    gh.k.position.set(gd.k.x + 100 * u, hw.floorY);
    const batG = new Graphics();
    bats(batG, 0.3, w / 2 + 40 * u, 200 * u, u, 3);
    k.addChild(hw.g, hw.win, batG, ...pics.map((p) => p.k), ...hw.doors.map((d) => d.k), ...scs.map((s0) => s0.k), gh.k);
    const shade = new Graphics().rect(0, 0, w, h).fill({ color: 0x0a0820, alpha: 0.25 });
    k.addChild(shade);
    if (live)
      liveLoop(k, (t) => {
        bats(batG, t, w / 2 + 40 * u, 200 * u, u, 3);
        scs.forEach((s0, i) => (s0.flame.alpha = 0.85 + 0.15 * Math.sin(t * 11 + i * 3)));
        pics.forEach((p) => (p.eyes.x = Math.sin(t * 1.2) * 9 * u));
        gh.sheet.y = -300 * u * 0.8 + Math.sin(t * 2.4) * 10 * u;
        gh.k.x = gd.k.x + 100 * u + Math.sin(t * 0.7) * 30 * u;
        ajar.eyes.alpha = Math.sin(t * 2.3) > -0.85 ? 1 : 0;
      });
    return k;
  },
};
