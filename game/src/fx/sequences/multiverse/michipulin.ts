/**
 * El Michipulín Colorado: the 1970s TV-studio universe (a red, bumbling Mexican TV superhero). A studio set made of painted
 * cardboard flats — a sky with a saguaro, an adobe wall with an arched door, a pink house with teal shutters — papel
 * picado across the top, a cardboard sun hanging from a visible string, the lighting truss, the boom mic, the AL AIRE and
 * APLAUSOS boxes. The lights clack on; someone in the painted window cries for help; red smoke, and the silhouette lands
 * with a hop; the little antennae beep; the squeaky mallet goes ¡CHUIK! and the laugh track rolls.
 * Payoff: one mighty squeaky bonk — the set can't take it and the house flat topples backwards in a cloud of dust while
 * the audience howls; ¡CHUIK! (…perdón por el decorado.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, flashOf, later, plate, score } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { beat, pay } from './kitC';
import { balloon, onCat } from './kitD';
import { asideText, bar, borrowFor, floaty, glow, oval, payline, pop, pre, puffs, rand, rrect, star, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const RED = 0xd62839;
const YEL = 0xffd23f;
const DARK = 0x15110f;
const WOOD = 0x6b4a32;
const SKY = 0x9fd6ea;
const ADOBE = 0xe8b98f;
const PINK = 0xefa6a0;
const TEAL = 0x3f8f8a;
const EDGE = 0xa8744c;
const PICADO = [0xff4f8b, 0x2fb7c4, 0xffd23f, 0x7fbf3a, 0xf28c28, 0x9b59d0];

type Kind = 'sky' | 'wall' | 'house';

/** one painted cardboard flat (local origin at its bottom-left corner: it falls backwards around its bottom edge) */
function flat(kind: Kind, fw: number, fh: number, u: number, seed: number) {
  const k = new Container();
  const g = new Graphics();
  const r = rand(seed);
  const T = -fh;
  // the cardboard (a slightly darker edge all round)
  g.rect(0, T, fw, fh).fill(EDGE);
  const ix = 7 * u;
  const body = kind === 'sky' ? SKY : kind === 'wall' ? ADOBE : PINK;
  g.rect(ix, T + ix, fw - ix * 2, fh - ix * 2).fill(body);
  if (kind === 'sky') {
    // painted clouds, mountains, the ochre ground and a saguaro
    puffs(g, fw * 0.3, T + fh * 0.2, fw * 0.32, 46 * u, 4, 0xffffff, 0.95, seed);
    puffs(g, fw * 0.75, T + fh * 0.12, fw * 0.24, 36 * u, 3, 0xffffff, 0.95, seed + 1);
    g.poly([ix, T + fh * 0.72, fw * 0.28, T + fh * 0.42, fw * 0.5, T + fh * 0.6, fw * 0.72, T + fh * 0.36, fw - ix, T + fh * 0.62, fw - ix, T + fh * 0.76, ix, T + fh * 0.76]).fill(0x9a86b8);
    g.poly([fw * 0.62, T + fh * 0.44, fw * 0.72, T + fh * 0.36, fw * 0.8, T + fh * 0.43, fw * 0.74, T + fh * 0.42, fw * 0.7, T + fh * 0.45]).fill(0xf4f0ff);
    g.rect(ix, T + fh * 0.74, fw - ix * 2, fh * 0.26 - ix).fill(0xe0b060);
    for (let i = 0; i < 5; i++) g.rect(ix + r() * (fw - 60 * u), T + fh * (0.8 + r() * 0.15), (20 + r() * 40) * u, 4 * u).fill(0xc89848);
    const cx = fw * (0.3 + r() * 0.15);
    const base = T + fh * 0.86;
    const cg = 0x4f9a4a;
    g.poly(rrect(cx - 22 * u, base - 260 * u, 44 * u, 260 * u, 22 * u, 3)).fill(cg).stroke({ width: 4 * u, color: 0x2f6a2e });
    g.poly(rrect(cx - 92 * u, base - 190 * u, 36 * u, 110 * u, 18 * u, 3)).fill(cg).stroke({ width: 4 * u, color: 0x2f6a2e });
    g.poly(rrect(cx - 92 * u, base - 106 * u, 80 * u, 30 * u, 14 * u, 2)).fill(cg);
    g.poly(rrect(cx + 56 * u, base - 230 * u, 36 * u, 120 * u, 18 * u, 3)).fill(cg).stroke({ width: 4 * u, color: 0x2f6a2e });
    g.poly(rrect(cx + 12 * u, base - 136 * u, 80 * u, 30 * u, 14 * u, 2)).fill(cg);
    for (let i = 0; i < 4; i++) g.rect(cx - 3 * u + (i - 1.5) * 9 * u, base - 250 * u, 2.5 * u, 240 * u).fill({ color: 0x2f6a2e, alpha: 0.5 });
  } else if (kind === 'wall') {
    // adobe: a painted baseboard, cracks, an arched wooden door and a pot
    g.rect(ix, T + fh * 0.86, fw - ix * 2, fh * 0.14 - ix).fill(0xb8805a);
    for (let i = 0; i < 4; i++) {
      const x = ix + r() * (fw - 80 * u);
      const y = T + fh * (0.12 + r() * 0.6);
      g.poly([x, y, x + 30 * u, y + 14 * u, x + 22 * u, y + 16 * u, x + 50 * u, y + 34 * u, x + 18 * u, y + 20 * u, x + 26 * u, y + 18 * u]).fill({ color: 0x9a6a48, alpha: 0.7 });
    }
    const dw = fw * 0.44;
    const dx = fw / 2 - dw / 2;
    const dTop = T + fh * 0.3;
    const arch: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      arch.push(fw / 2 + Math.cos(a) * dw * 0.5, dTop + Math.sin(a) * dw * 0.4);
    }
    g.poly([dx - 14 * u, T + fh * 0.86, ...arch.map((v, i) => (i % 2 ? v - 14 * u : v + (v < fw / 2 ? -14 * u : 14 * u))), dx + dw + 14 * u, T + fh * 0.86]).fill(0xc99a6e);
    g.poly([dx, T + fh * 0.86, ...arch, dx + dw, T + fh * 0.86]).fill(0x6b3f24);
    for (let i = 1; i < 4; i++) g.rect(dx + (dw * i) / 4 - 2 * u, dTop - dw * 0.2, 4 * u, fh * 0.56 + dw * 0.2).fill(0x4a2a16);
    g.poly(oval(dx + dw * 0.82, T + fh * 0.6, 8 * u, 8 * u, 8)).fill(YEL);
    const px = fw * 0.12;
    g.poly([px - 34 * u, T + fh * 0.76, px + 34 * u, T + fh * 0.76, px + 24 * u, T + fh * 0.86, px - 24 * u, T + fh * 0.86]).fill(0xc0582c);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.38;
      g.poly([px, T + fh * 0.76, px + Math.cos(a - 0.12) * 70 * u, T + fh * 0.76 + Math.sin(a - 0.12) * 70 * u, px + Math.cos(a) * 92 * u, T + fh * 0.76 + Math.sin(a) * 92 * u, px + Math.cos(a + 0.12) * 70 * u, T + fh * 0.76 + Math.sin(a + 0.12) * 70 * u]).fill(0x4f9a4a);
    }
  } else {
    // the pink house: a tiled eave, a window with teal shutters (someone lives in it), a wall lamp
    for (let x = ix; x < fw - ix; x += 34 * u) g.poly(rrect(x, T + ix, 30 * u, 44 * u, 14 * u, 2)).fill(0xc0582c);
    g.rect(ix, T + ix + 40 * u, fw - ix * 2, 10 * u).fill(0x8a3c1c);
    g.rect(ix, T + fh * 0.88, fw - ix * 2, fh * 0.12 - ix).fill(0xc98478);
    const lamp = fw * 0.82;
    g.rect(lamp - 4 * u, T + fh * 0.3, 8 * u, 40 * u).fill(0x2a2a2a).poly([lamp - 22 * u, T + fh * 0.3, lamp + 22 * u, T + fh * 0.3, lamp + 14 * u, T + fh * 0.22, lamp - 14 * u, T + fh * 0.22]).fill(YEL);
  }
  // a dent and a torn corner: it IS cardboard
  g.poly([fw - ix, T + ix, fw - ix - 26 * u, T + ix, fw - ix, T + ix + 22 * u]).fill(0xd8c0a0);
  k.addChild(g);
  let win: { x: number; y: number; w: number; h: number } | null = null;
  if (kind === 'house') {
    const ww = fw * 0.34;
    const wh = fh * 0.3;
    const wx = fw * 0.36;
    const wy = T + fh * 0.32;
    const wg = new Graphics();
    wg.rect(wx - 10 * u, wy - 10 * u, ww + 20 * u, wh + 20 * u).fill(0x8a5a3a).rect(wx, wy, ww, wh).fill(0x2a2030);
    k.addChild(wg);
    win = { x: wx, y: wy, w: ww, h: wh };
    const sh = new Graphics();
    sh.rect(wx - 10 * u - ww * 0.5, wy - 10 * u, ww * 0.5, wh + 20 * u).fill(TEAL).rect(wx + ww + 10 * u, wy - 10 * u, ww * 0.5, wh + 20 * u).fill(TEAL);
    for (let i = 1; i < 6; i++) sh.rect(wx - 10 * u - ww * 0.5, wy - 10 * u + ((wh + 20 * u) * i) / 6, ww * 0.5, 3 * u).rect(wx + ww + 10 * u, wy - 10 * u + ((wh + 20 * u) * i) / 6, ww * 0.5, 3 * u);
    sh.fill(0x2c6a66);
    sh.rect(wx - 16 * u, wy + wh + 8 * u, ww + 32 * u, 12 * u).fill(0x8a5a3a);
    k.addChild(sh);
  }
  return { k, win };
}

/** the somebody in the window: a worried grey cat head with a paw up (origin: bottom center) */
function victim(s: number) {
  const g = new Graphics();
  g.poly([-46 * s, -70 * s, -40 * s, -118 * s, -16 * s, -92 * s, 16 * s, -92 * s, 40 * s, -118 * s, 46 * s, -70 * s, 38 * s, -36 * s, -38 * s, -36 * s]).fill(0x9a9aa6).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.poly(oval(0, -40 * s, 44 * s, 34 * s, 14)).fill(0x9a9aa6).stroke({ width: 3 * s, color: C.ink });
  g.poly(oval(-16 * s, -66 * s, 11 * s, 14 * s, 10)).fill(0xffffff).poly(oval(16 * s, -66 * s, 11 * s, 14 * s, 10)).fill(0xffffff);
  g.poly(oval(-14 * s, -62 * s, 5 * s, 7 * s, 8)).fill(C.ink).poly(oval(14 * s, -62 * s, 5 * s, 7 * s, 8)).fill(C.ink);
  g.poly([-26 * s, -84 * s, -8 * s, -80 * s, -8 * s, -77 * s, -26 * s, -80 * s]).fill(C.ink).poly([26 * s, -84 * s, 8 * s, -80 * s, 8 * s, -77 * s, 26 * s, -80 * s]).fill(C.ink);
  g.poly(oval(0, -34 * s, 9 * s, 7 * s, 8)).fill(0x3a2020);
  g.poly(rrect(44 * s, -110 * s, 26 * s, 70 * s, 12 * s, 2)).fill(0x9a9aa6).stroke({ width: 3 * s, color: C.ink });
  return g;
}

/** the cardboard sun on its string (origin at the knot on the truss) */
function sun(len: number, s: number) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-1.5 * s, 0, 3 * s, len - 80 * s).fill(0xe8e0d0);
  g.poly(star(0, len, 96 * s, 66 * s, 14)).fill(0xf2a33a).stroke({ width: 5 * s, color: 0x8a4a10, join: 'round' });
  g.poly(oval(0, len, 62 * s, 62 * s, 18)).fill(YEL).stroke({ width: 4 * s, color: 0x8a4a10 });
  g.poly(oval(-22 * s, len - 10 * s, 7 * s, 9 * s, 8)).fill(0x5a2a10).poly(oval(22 * s, len - 10 * s, 7 * s, 9 * s, 8)).fill(0x5a2a10);
  g.poly([-26 * s, len + 16 * s, -10 * s, len + 30 * s, 10 * s, len + 30 * s, 26 * s, len + 16 * s, 10 * s, len + 22 * s, -10 * s, len + 22 * s]).fill(0x5a2a10);
  g.poly(oval(-36 * s, len + 10 * s, 10 * s, 6 * s, 8)).fill({ color: 0xf28c28, alpha: 0.7 }).poly(oval(36 * s, len + 10 * s, 10 * s, 6 * s, 8)).fill({ color: 0xf28c28, alpha: 0.7 });
  k.addChild(g);
  return k;
}

/** a light box sign (AL AIRE / APLAUSOS): returns the box and its lit layer */
function sign(text: string, on: number, off: number, s: number) {
  const k = new Container();
  const t = txt(text, { fontFamily: F.heavy, fontSize: 30 * s, fill: 0xffffff, letterSpacing: 3 * s });
  t.anchor.set(0.5);
  const w = t.width + 44 * s;
  const h = t.height + 22 * s;
  const g = new Graphics().rect(-1.5 * s, -h / 2 - 34 * s, 3 * s, 34 * s).fill(0x3a3a3a).poly(rrect(-w / 2 - 6 * s, -h / 2 - 6 * s, w + 12 * s, h + 12 * s, 8 * s, 2)).fill(0x222222);
  const dim = new Graphics().poly(rrect(-w / 2, -h / 2, w, h, 6 * s, 2)).fill(off);
  const lit = new Container();
  const halo = glow(w * 0.8, on, 0.45, 6, 20, h * 1.6);
  halo.blendMode = 'add';
  lit.addChild(halo, new Graphics().poly(rrect(-w / 2, -h / 2, w, h, 6 * s, 2)).fill(on));
  const tt = txt(text, { fontFamily: F.heavy, fontSize: 30 * s, fill: 0x5a1a1a, letterSpacing: 3 * s });
  tt.anchor.set(0.5);
  k.addChild(g, dim, tt, lit, t);
  lit.alpha = 0;
  t.alpha = 0.35;
  return {
    k,
    set(v: boolean) {
      if (lit.destroyed) return;
      lit.alpha = v ? 1 : 0;
      t.alpha = v ? 1 : 0.35;
    },
  };
}

/** a studio lamp can (origin at its hanging point) + its cone (separate: additive, switched on) */
function lamp(s: number, aim: number, reach: number) {
  const k = new Container();
  const g = new Graphics();
  g.rect(-3 * s, 0, 6 * s, 26 * s).fill(0x2a2a2a);
  const body = [-28 * s, 22 * s, 28 * s, 22 * s, 36 * s, 86 * s, -36 * s, 86 * s];
  g.poly(body).fill(0x33302c).stroke({ width: 3 * s, color: 0x111111 });
  g.poly(oval(0, 86 * s, 34 * s, 10 * s, 12)).fill(0x55504a);
  const face = new Graphics().poly(oval(0, 86 * s, 30 * s, 8 * s, 12)).fill(0xfff2c0);
  const cone = new Graphics().poly([-30 * s, 88 * s, 30 * s, 88 * s, reach * 0.42 + aim, reach, -reach * 0.42 + aim, reach]).fill({ color: 0xfff2c8, alpha: 0.075 });
  cone.blendMode = 'add';
  k.addChild(cone, g, face);
  return { k, cone, face };
}

/**
 * the whole studio for a w×h window (u = scale vs the 1920×1080 reveal): returns its parts. The flats are centered on w/2:
 * the adobe wall behind the cat, the pink house to its right (it falls), the sky to its left, then alternating.
 */
function studio(w: number, h: number, u: number, outer: boolean) {
  const back = new Graphics().rect(0, 0, w, h).fill(DARK);
  // behind the flats: scaffolding and ropes (seen at the open edges and when the house falls)
  for (let x = (w / 2) % (180 * u); x < w; x += 180 * u) back.rect(x, 0, 8 * u, h).fill(0x241e1a);
  for (let y = 140 * u; y < h * 0.8; y += 160 * u) back.rect(0, y, w, 6 * u).fill(0x241e1a);
  for (let x = (w / 2 + 90 * u) % (360 * u); x < w; x += 360 * u) back.poly(bar(x, 140 * u, x + 180 * u, 300 * u, 3 * u)).poly(bar(x + 180 * u, 140 * u, x, 300 * u, 3 * u));
  back.fill(0x2e2722);
  const floorY = h * 0.77;
  const floor = new Graphics().rect(0, floorY, w, h - floorY).fill(WOOD);
  for (let y = floorY + 26 * u; y < h; y += 34 * u) floor.rect(0, y, w, 3 * u);
  floor.fill(0x553a26);
  // tape marks where the actors stand
  const tape = (x: number, y: number, s: number) => floor.poly(bar(x - s, y - s * 0.4, x + s, y + s * 0.4, 3 * u)).poly(bar(x - s, y + s * 0.4, x + s, y - s * 0.4, 3 * u));
  for (let x = w / 2 - 520 * u; x < w; x += 1040 * u) tape(x, floorY + 120 * u, 34 * u);
  tape(w / 2 + 300 * u, floorY + 170 * u, 26 * u);
  floor.fill(YEL);
  const FW = 520 * u;
  const FH = 680 * u;
  const flatsY = floorY + 2 * u;
  const flats: { k: Container; win: { x: number; y: number; w: number; h: number } | null; x: number; kind: Kind }[] = [];
  const RIGHT: Kind[] = ['wall', 'house', 'sky'];
  const LEFT: Kind[] = ['wall', 'sky', 'house'];
  const add = (i: number) => {
    const kind: Kind = i >= 0 ? RIGHT[i % 3] : LEFT[-i % 3];
    const x = w / 2 - FW / 2 + i * (FW + 6 * u);
    const f = flat(kind, FW, FH, u, 40 + i * 7);
    f.k.position.set(x, flatsY);
    flats.push({ ...f, x, kind });
  };
  const n = outer ? 1 : Math.ceil((w / 2 - FW / 2) / FW) + 1;
  for (let i = -n; i <= n; i++) add(i);
  // wooden braces at the open ends (the reveal: the set doesn't reach the edges)
  const braces = new Graphics();
  if (outer) {
    const L = flats[0].x;
    const R = flats[flats.length - 1].x + FW;
    for (const [x, d] of [
      [L, -1],
      [R, 1],
    ] as const) {
      braces.poly(bar(x + d * 10 * u, flatsY - FH, x + d * 10 * u, flatsY, 9 * u)).poly(bar(x + d * 10 * u, flatsY - FH * 0.7, x + d * 160 * u, flatsY, 7 * u));
      braces.poly([x + d * 120 * u, flatsY - 30 * u, x + d * 200 * u, flatsY - 30 * u, x + d * 200 * u, flatsY, x + d * 120 * u, flatsY]);
    }
    braces.fill(0x8a6a48);
  }
  // papel picado across the top of the set
  const picado = new Graphics();
  const top = flatsY - FH + 10 * u;
  const x0 = outer ? flats[0].x : 0;
  const x1 = outer ? flats[flats.length - 1].x + FW : w;
  for (let row = 0; row < 2; row++) {
    const y0 = top + 30 * u + row * 70 * u;
    const span = 260 * u;
    for (let x = x0 + (row ? span / 2 : 0); x < x1; x += span) {
      const pts: number[] = [];
      for (let i = 0; i <= 8; i++) pts.push(x + (span * i) / 8, y0 + Math.sin((i / 8) * Math.PI) * 26 * u);
      picado.poly(pts, false).stroke({ width: 2 * u, color: 0xf2f2f2 });
      for (let i = 1; i < 8; i++) {
        const fx = x + (span * i) / 8;
        const fy = y0 + Math.sin((i / 8) * Math.PI) * 26 * u;
        const c = PICADO[(i + row * 3 + Math.round(x / span)) % PICADO.length];
        picado.poly([fx - 13 * u, fy, fx + 13 * u, fy, fx + 13 * u, fy + 26 * u, fx + 6 * u, fy + 33 * u, fx, fy + 26 * u, fx - 6 * u, fy + 33 * u, fx - 13 * u, fy + 26 * u]).fill(c);
      }
    }
  }
  // the lighting truss and its lamps
  const truss = new Graphics();
  truss.rect(0, 22 * u, w, 7 * u).rect(0, 56 * u, w, 7 * u);
  for (let x = 0; x < w; x += 34 * u) truss.poly(bar(x, 26 * u, x + 17 * u, 60 * u, 2.2 * u)).poly(bar(x + 17 * u, 60 * u, x + 34 * u, 26 * u, 2.2 * u));
  truss.fill(0x4a4a4e);
  const lamps: ReturnType<typeof lamp>[] = [];
  // a card draws its lamp cans into the truss and all the light cones into ONE Graphics (the grid shows 155 cards)
  const cones = new Graphics();
  cones.blendMode = 'add';
  for (let x = w / 2 - 150 * u - Math.floor((w / 2) / (300 * u)) * 300 * u; x < w + 100 * u; x += 300 * u) {
    if (outer) {
      const l = lamp(u, (w / 2 - x) * 0.25, floorY + 100 * u);
      l.k.position.set(x, 60 * u);
      lamps.push(l);
      continue;
    }
    const aim = (w / 2 - x) * 0.25;
    const reach = floorY + 100 * u - 60 * u;
    cones.poly([x - 30 * u, 148 * u, x + 30 * u, 148 * u, x + reach * 0.42 + aim, 60 * u + reach, x - reach * 0.42 + aim, 60 * u + reach]);
    truss.rect(x - 3 * u, 60 * u, 6 * u, 26 * u).fill(0x2a2a2a);
    truss.poly([x - 28 * u, 82 * u, x + 28 * u, 82 * u, x + 36 * u, 146 * u, x - 36 * u, 146 * u]).fill(0x33302c);
    truss.poly(oval(x, 146 * u, 30 * u, 8 * u, 12)).fill(0xfff2c0);
  }
  cones.fill({ color: 0xfff2c8, alpha: 0.075 });
  return { back, floor, flats, braces, picado, truss, lamps, cones, floorY, FW, FH, flatsY };
}

interface St {
  house: Container | null;
  sunK: Container;
  swing: { v: number };
  onAir: ReturnType<typeof sign>;
  applause: ReturnType<typeof sign>;
  give: () => void;
  words: Container[];
  line: ReturnType<typeof payline>;
}
const S = stash<St>();

export const michipulin: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO DEL HÉROE COLORADO',
  open(c: SigCtx) {
    const k = new Container();
    const st = studio(W, H, 1, true);
    const house = st.flats.find((f) => f.kind === 'house') ?? null;
    const sunK = sun(250, 1);
    sunK.position.set(W / 2 - 560, 60);
    const onAir = sign('AL AIRE', 0xe0202a, 0x4a1414, 1);
    onAir.k.position.set(W - 380, 132);
    const applause = sign('APLAUSOS', 0xfff0a0, 0x4a4430, 0.9);
    applause.k.position.set(560, 128);
    // the boom mic poking in from the top right
    const boom = new Graphics();
    boom.poly(bar(W + 40, 120, W / 2 + 360, 238, 6)).fill(0x3a3a3e);
    boom.poly(oval(W / 2 + 340, 250, 46, 22, 14, -0.24)).fill(0x77777e).stroke({ width: 4, color: 0x222222 });
    for (let i = -3; i <= 3; i++) boom.poly(oval(W / 2 + 340 + i * 11, 250 - i * 2.6, 3, 16, 6, -0.24)).fill({ color: 0x55555c, alpha: 0.8 });
    // the camera, bottom right
    const cam = new Graphics();
    cam.poly(bar(W - 150, 1080, W - 150, 860, 14)).fill(0x2a2a2e);
    cam.poly(rrect(W - 300, 700, 250, 170, 14, 3)).fill(0x4a4a52).stroke({ width: 5, color: 0x18181c });
    cam.poly(rrect(W - 360, 740, 70, 90, 10, 2)).fill(0x26262a).poly(oval(W - 364, 785, 22, 40, 12)).fill(0x101014).poly(oval(W - 368, 775, 8, 14, 8)).fill({ color: 0x8fb8ff, alpha: 0.5 });
    const tally = new Graphics().poly(oval(W - 90, 720, 12, 12, 10)).fill(0xff3030);
    k.addChild(st.back, st.braces, st.floor, ...st.flats.map((f) => f.k), st.picado, cam, tally, st.truss, ...st.lamps.map((l) => l.k), sunK, boom, onAir.k, applause.k);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const swing = { v: 0.05 };
    const words: Container[] = [];
    // the payoff's line, built now (a big stroked word mid-shot costs a long frame)
    const line = payline(
      c,
      () => title('¡CHUIK!', { size: 190, fill: YEL, ink: 0x5a0a0a, inkW: 22, shadow: RED, font: F.heavy }),
      () => asideText('…perdón por el decorado.', 0xffffff, 0x5a0a0a, 46),
    );
    const give = borrowFor(c, 0.78, 0.36, (cat, x0, y0, q) => {
      cat.y = y0 - Math.sin(q * Math.PI) * 80;
      cat.rotation = Math.sin(q * Math.PI * 2) * 0.05;
    });
    S.set(c, { house: house?.k ?? null, sunK, swing, onAir, applause, give, words, line });
    if (!c.reduce)
      every(c, 30, (t) => {
        if (!sunK.destroyed) sunK.rotation = Math.sin(t * 2.4) * swing.v;
        if (!tally.destroyed) tally.alpha = Math.sin(t * 6) > -0.3 ? 1 : 0.3;
      });
    const lightsOn = (on: boolean) => st.lamps.forEach((l) => !l.cone.destroyed && ((l.cone.alpha = on ? 1 : 0), (l.face.alpha = on ? 1 : 0.25)));
    if (c.short || c.reduce) {
      lightsOn(true);
      onAir.set(true);
    } else lightsOn(false);
    if (c.short) return;

    score(c, [
      [0.02, 'click', 0.7],
      [0.3, 'alarm', 1.4],
      [0.76, 'whoosh', 0.8],
      [0.8, 'pop', 0.6],
      [1.6, 'hit', 1.9],
      [1.62, 'pop', 2.4],
      [1.7, 'meow', 1.5],
    ]);
    // the lamps clack on, one by one; AL AIRE lights
    if (!c.reduce) {
      st.lamps.forEach((l, i) =>
        beat(c, 0.04 + i * 0.05, () => {
          if (l.cone.destroyed) return;
          l.cone.alpha = 1;
          l.face.alpha = 1;
          if (i % 2 === 0) sfx('click', 1 + i * 0.08);
        }),
      );
      beat(c, 0.32, () => onAir.set(true));
    }
    // somebody in the painted window cries for help
    if (house?.win) {
      const wv = house.win;
      const vk = new Container();
      const v = victim(1.05);
      v.position.set(wv.x + wv.w * 0.45, wv.y + wv.h + 4);
      const mask = new Graphics().rect(wv.x, wv.y, wv.w, wv.h).fill(0xffffff);
      vk.addChild(v, mask);
      v.mask = mask;
      house.k.addChild(vk);
      if (!c.reduce) {
        v.y += 130;
        beat(c, 0.2, () => !v.destroyed && gsap.to(v, { y: v.y - 130, duration: 0.18, ease: 'back.out(2)' }));
      }
      const help = pre(c.fg, balloon('¡AUXILIO!\n¡UN HÉROE, POR FAVOR!', { size: 42, jag: true, tx: 120, ty: 130 }), house.k.x + wv.x + wv.w * 0.2, house.k.y + wv.y - 110, 0.04);
      words.push(help);
      pop(c, help, 0.3, 0.55, { from: 0.3 });
    }
    // red smoke and the hop: he's here
    const puf = pre(c.fg, title('¡PUF!', { size: 130, fill: 0xffffff, ink: RED, inkW: 14, shadow: 0x5a0a0a }), W / 2 + 300, c.catY + 150, 0.12);
    words.push(puf);
    pop(c, puf, 0.8, 0.4);
    beat(c, 0.74, () => {
      if (c.reduce) return;
      const smoke = new Graphics();
      c.behind.addChild(smoke);
      const p = { v: 0 };
      gsap.to(p, {
        v: 1,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: () => {
          if (smoke.destroyed) return;
          smoke.clear();
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const d = 60 + p.v * 300;
            smoke.poly(oval(W / 2 + Math.cos(a) * d, c.catY + 120 + Math.sin(a) * d * 0.5, 70 + p.v * 60, 50 + p.v * 40, 10)).fill({ color: i % 3 ? 0xe23a3a : 0xff8a6a, alpha: 0.8 * (1 - p.v) });
          }
        },
        onComplete: () => destroyTree(smoke),
      });
    });
    // the antennae: beep, beep, beep (rings off the two little balls)
    const tips = [onCat(c, 0.443, 0.093), onCat(c, 0.714, 0.126)];
    const rings = new Graphics();
    c.fg.addChild(rings);
    const bips = [
      pre(c.fg, title('BIP', { size: 78, fill: YEL, ink: 0x5a0a0a, inkW: 10, shadow: null, font: F.heavy }), tips[0][0] - 130, tips[0][1] - 40, -0.25),
      pre(c.fg, title('BIP', { size: 78, fill: YEL, ink: 0x5a0a0a, inkW: 10, shadow: null, font: F.heavy }), tips[1][0] + 140, tips[1][1] - 30, 0.22),
    ];
    words.push(...bips);
    pop(c, bips[0], 1.05, 0.5, { from: 1.6 });
    pop(c, bips[1], 1.22, 0.45, { from: 1.6 });
    // the show is live
    const live0 = pre(c.fg, plate('¡EN VIVO Y CON PÚBLICO!', RED, 0x2a0606, 44, 0xffffff), 470, 250, -0.06);
    words.push(live0);
    pop(c, live0, 0.08, 0.6, { from: 2.4, onShow: () => sfx('sting', 1.3) });
    for (let n = 0; n < 3; n++)
      beat(c, 1.05 + n * 0.17, () => {
        sfx('tick', 2.6);
        if (rings.destroyed) return;
        const p = { v: 0 };
        gsap.to(p, {
          v: 1,
          duration: 0.3,
          onUpdate: () => {
            if (rings.destroyed) return;
            rings.clear();
            for (const [x, y] of tips)
              for (let j = 0; j < 3; j++) {
                const rr = 20 + p.v * 60 + j * 18;
                rings.poly(oval(x, y, rr, rr, 18), true).stroke({ width: 5, color: YEL, alpha: (1 - p.v) * (1 - j * 0.25) });
              }
          },
          onComplete: () => !rings.destroyed && rings.clear(),
        });
      });
    // the squeaky mallet: ¡CHUIK! (a practice swing) and the laugh track
    const [hx, hy] = onCat(c, 0.25, 0.17);
    const chuik = pre(c.fg, title('¡chuik!', { size: 112, fill: YEL, ink: 0x5a0a0a, inkW: 13, shadow: RED, font: F.heavy }), hx - 210, hy - 60, -0.2);
    words.push(chuik);
    pop(c, chuik, 1.6, 0.45, {
      onShow: () => {
        c.shaker.add(0.12);
        swing.v = 0.25;
      },
    });
    beat(c, 1.62, () => {
      applause.set(true);
      for (let i = 0; i < 7; i++) later(c, i * 0.07, () => floaty(c, c.fg, 160 + i * 260 + Math.random() * 60, H - 40, i % 2 ? 'JA JA' : '¡JA!', { fontFamily: F.comic, fontSize: 58, fill: 0xffffff, stroke: { color: C.ink, width: 8 } }, 110, 0.8));
    });
    beat(c, 2.1, () => applause.set(false));
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('hit', 1.6);
    sfx('pop', 2.6);
    later(c, 0.05, () => sfx('bigboom', 0.9));
    later(c, 0.35, () => sfx('fanfare', 1.15));
    c.shaker.add(0.45);
    flashOf(c, 0xfff2c0, 0.55, 0.3);
    if (!st) return;
    st.give();
    sweep(st.words);
    st.line.land(2.3);
    st.onAir.set(true);
    st.swing.v = 0.6;
    gsap.to(st.swing, { v: 0.12, delay: 0.6, duration: 1.6 });
    // the mallet's swoosh and the impact star
    const [hx, hy] = onCat(c, 0.25, 0.17);
    const fx = new Graphics();
    c.fg.addChild(fx);
    for (let i = 0; i < 5; i++) {
      const a0 = -2.2 + i * 0.04;
      const pts: number[] = [];
      for (let j = 0; j <= 10; j++) {
        const a = a0 + (j / 10) * 1.7;
        pts.push(W / 2 - 40 + Math.cos(a) * (230 + i * 22), c.catY - 40 + Math.sin(a) * (230 + i * 22));
      }
      fx.poly(pts, false).stroke({ width: 10 - i * 1.6, color: 0xffffff, alpha: 0.85 - i * 0.12, cap: 'round' });
    }
    fx.poly(star(hx - 60, hy - 40, 120, 60, 10)).fill(YEL).stroke({ width: 6, color: 0x5a0a0a, join: 'round' });
    if (!c.reduce) gsap.fromTo(fx.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2)' });
    fx.pivot.set(hx - 60, hy - 40);
    fx.position.set(hx - 60, hy - 40);
    gsap.to(fx, { alpha: 0, delay: 0.35, duration: 0.3, onComplete: () => destroyTree(fx) });
    // the set can't take it: the pink house topples backwards, dust, and the audience howls
    const hk = st.house;
    if (hk && !hk.destroyed) {
      const dust = () => {
        const g = new Graphics();
        puffs(g, hk.x + 260, hk.y, 640, 120, 7, 0xd8c8b0, 0.9, 9);
        c.back.addChild(g);
        if (!c.reduce) gsap.fromTo(g.scale, { y: 0.4 }, { y: 1, duration: 0.4, ease: 'power2.out' });
        gsap.to(g, { alpha: 0, delay: c.reduce ? 1.2 : 0.5, duration: 0.8, onComplete: () => destroyTree(g) });
        sfx('boom', 0.7);
        c.shaker.add(0.2);
      };
      if (c.reduce) {
        hk.scale.y = 0.03;
        dust();
      } else {
        gsap.to(hk.scale, { y: 0.92, duration: 0.12, delay: 0.1, ease: 'power1.out' });
        gsap.to(hk, { rotation: 0.02, duration: 0.1, delay: 0.1, yoyo: true, repeat: 1 });
        gsap.to(hk.scale, { y: 0.03, duration: 0.42, delay: 0.32, ease: 'power3.in', onComplete: dust });
      }
    }
    st.applause.set(true);
    let on = true;
    for (let i = 1; i < 8; i++)
      later(c, i * 0.22, () => {
        on = !on;
        st.applause.set(c.flashes ? on : true);
      });
    later(c, 1.9, () => st.applause.set(false));
    for (let i = 0; i < 12; i++) later(c, 0.5 + i * 0.09, () => floaty(c, c.fg, 1000 + Math.random() * 860, H - 30 - Math.random() * 60, ['¡JA JA JA!', '¡JUA!', 'JA JA', '¡JE!'][i % 4], { fontFamily: F.comic, fontSize: 44 + Math.random() * 16, fill: 0xffffff, stroke: { color: C.ink, width: 7 } }, 140, 1.1));
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const st = studio(w, h, u, false);
    const sunK = sun(250 * u * 0.9, u * 0.9);
    sunK.position.set(w / 2 - Math.min(w * 0.36, 560 * u), 60 * u);
    const onAir = sign('AL AIRE', 0xe0202a, 0x4a1414, u * 0.9);
    onAir.k.position.set(w / 2 + Math.min(w * 0.36, 520 * u), 130 * u);
    onAir.set(true);
    k.addChild(st.back, st.floor, ...st.flats.map((f) => f.k), st.picado, st.cones, st.truss, sunK, onAir.k);
    if (live)
      liveLoop(k, (t) => {
        sunK.rotation = Math.sin(t * 2.2) * 0.12;
        onAir.set(Math.sin(t * 2.5) > -0.6);
        st.cones.alpha = 0.85 + 0.15 * Math.sin(t * 7);
      });
    return k;
  },
};
