/**
 * Cleogatra: the Nile's universe (the last queen of ancient Egypt, public domain — as a cat, and as the old story of
 * the queen who arrived rolled up in a carpet). A palace terrace over the Nile at sunset: papyrus columns painted
 * turquoise and gold, linen drapes in the breeze, braziers; beyond, the river, a felucca, palms and a far pyramid
 * under a setting sun. Two feline palace guards march in carrying a rolled rug, drop it — ¡PUM! — and step aside; the
 * rug unrolls at the camera in one go and out she comes in a twirl, the pearl in her paw catching the light.
 * Payoff: lotus petals and gold rain down, the guards raise their spears: ¡LLEGÓ LA REINA! — …y trajo su propia
 * alfombra. (Not Bastet's temple: daylight's last gold, the river, turquoise — and the rug.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, fall, later, score } from './kit';
import {
  C,
  TAU,
  arcPts,
  at,
  band,
  borrowCat,
  cardLoop,
  comic,
  glint,
  glowDisc,
  glyphRow,
  hideDisc,
  ngon,
  onCat,
  park,
  payline,
  pre,
  rnd,
  stash,
  streak,
  take,
  torch,
  twinkle,
  vgrad,
  wrap,
} from './kitJ';

const SKY = [0x4a3270, 0x9a4a7a, 0xe0687a, 0xff9a5c, 0xffc66a];
const NILE = [0x2a7a8a, 0x1f5e72, 0x184a5c];
const TURQ = 0x2bb3a3;
const LAPIS = 0x1b5e9e;
const GOLD = 0xe6c34a;
const GOLD_L = 0xffe27a;
const STONE = 0xe8d6b0;
const RUG = 0x9a2a2a;
const INK = C.ink;

/** the pearl in her paw, and the rug-roll's size */
const PEARL: [number, number] = [0.774, 0.344];

/** a papyrus column (origin at its base center, w wide, h tall): ribbed shaft, colored bands, open papyrus capital */
function papyrus(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x - w * 0.6, y - h * 0.03, w * 1.2, h * 0.03).fill(0xc8b48a);
  const shaft = [x - w * 0.42, y - h * 0.03, x + w * 0.42, y - h * 0.03, x + w * 0.5, y - h * 0.12, x + w * 0.4, y - h * 0.82, x - w * 0.4, y - h * 0.82, x - w * 0.5, y - h * 0.12];
  g.poly(shaft).fill(STONE).stroke({ width: Math.max(2, w * 0.03), color: 0x8a7450 });
  for (let i = 1; i < 6; i++) {
    const fx = -0.4 + (i * 0.8) / 6;
    g.poly(streak(x + fx * w * 1.1, y - h * 0.1, x + fx * w, y - h * 0.82, w * 0.012, w * 0.012)).fill({ color: 0x8a7450, alpha: 0.6 });
  }
  g.rect(x - w * 0.42, y - h * 0.8, w * 0.84, h * 0.06).fill(TURQ).rect(x - w * 0.42, y - h * 0.74, w * 0.84, h * 0.02).fill(GOLD).rect(x - w * 0.42, y - h * 0.72, w * 0.84, h * 0.02).fill(LAPIS);
  // the open papyrus capital (a bell) painted with leaves
  const cy = y - h * 0.82;
  g.poly([x - w * 0.4, cy, x + w * 0.4, cy, x + w * 0.95, cy - h * 0.14, x + w * 0.9, cy - h * 0.18, x - w * 0.9, cy - h * 0.18, x - w * 0.95, cy - h * 0.14]).fill(0x3aa890).stroke({ width: Math.max(2, w * 0.03), color: 0x1a5a4a });
  for (let i = 0; i < 7; i++) {
    const fx = -0.8 + (i * 1.6) / 6;
    g.poly([x + fx * w * 0.45, cy, x + fx * w, cy - h * 0.17, x + fx * w + w * 0.1, cy - h * 0.17]).fill(i % 2 ? GOLD : LAPIS);
  }
  g.rect(x - w * 0.7, cy - h * 0.2, w * 1.4, h * 0.03).fill(0xc8b48a);
}

/** a feline palace guard in profile (Egyptian flat style; origin at its feet, facing +x·dir, ~h tall) */
function guard(h: number, dir = 1) {
  const g = new Graphics();
  const P = (pts: number[]) => pts.map((v, i) => (i % 2 ? v * h : v * h * dir));
  const lw = Math.max(2, h * 0.008);
  // legs and kilt
  g.poly(P([-0.09, 0, -0.05, 0, -0.04, -0.3, -0.08, -0.3])).fill(0xd9a456).stroke({ width: lw, color: INK });
  g.poly(P([0.04, 0, 0.1, 0, 0.06, -0.3, 0.02, -0.3])).fill(0xd9a456).stroke({ width: lw, color: INK });
  g.poly(P([-0.12, -0.28, 0.12, -0.28, 0.08, -0.46, -0.08, -0.46])).fill(0xf6f0e0).stroke({ width: lw, color: INK });
  g.poly(P([0.0, -0.28, 0.06, -0.28, 0.04, -0.46, 0.0, -0.46])).fill(GOLD);
  // torso, collar, arms (one holds the spear upright)
  g.poly(P([-0.08, -0.46, 0.08, -0.46, 0.09, -0.7, -0.07, -0.72])).fill(0xd9a456).stroke({ width: lw, color: INK });
  g.poly(P([-0.09, -0.66, 0.1, -0.66, 0.08, -0.72, -0.08, -0.74])).fill(TURQ).stroke({ width: lw, color: INK });
  g.poly(P([0.06, -0.66, 0.2, -0.56, 0.22, -0.6, 0.08, -0.7])).fill(0xd9a456).stroke({ width: lw, color: INK });
  // the head: cat face in profile, tall ears, the striped headcloth behind
  g.poly(P([-0.1, -0.72, -0.12, -0.9, -0.04, -0.94, 0.0, -0.74])).fill(LAPIS).stroke({ width: lw, color: INK });
  for (let i = 0; i < 3; i++) g.poly(P([-0.11, -0.76 - i * 0.05, -0.02, -0.76 - i * 0.05, -0.02, -0.78 - i * 0.05, -0.11, -0.78 - i * 0.05])).fill(GOLD);
  g.poly(P([-0.04, -0.74, 0.08, -0.74, 0.14, -0.8, 0.1, -0.84, 0.06, -0.92, 0.0, -0.96, -0.04, -0.9])).fill(0xc8904a).stroke({ width: lw, color: INK });
  g.poly(P([-0.01, -0.92, 0.02, -1.04, 0.05, -0.93])).fill(0xc8904a).stroke({ width: lw, color: INK });
  g.poly(P([0.04, -0.86, 0.08, -0.86, 0.07, -0.875])).fill(INK);
  return g;
}

/** the spear (origin at its butt, upright; h long) */
function spear(g: Graphics, x: number, y: number, h: number, lean = 0) {
  g.poly(streak(x, y, x + lean * h, y - h, h * 0.008, h * 0.008)).fill(0x6a4a2a);
  g.poly([x + lean * h - h * 0.025, y - h, x + lean * h + h * 0.025, y - h, x + lean * h, y - h * 1.1]).fill(GOLD).stroke({ width: Math.max(1.5, h * 0.004), color: INK });
}

/** the rolled rug (a cylinder seen from the side; origin at its center; L long, r radius) */
function rolled(g: Graphics, L: number, r: number) {
  g.clear();
  g.rect(-L / 2, -r, L, r * 2).fill(RUG).stroke({ width: Math.max(2, r * 0.08), color: INK });
  for (let i = 0; i < 7; i++) g.rect(-L / 2 + (i + 0.5) * (L / 7) - r * 0.15, -r, r * 0.3, r * 2).fill(i % 2 ? GOLD : LAPIS);
  g.poly(ngon(L / 2, 0, r * 0.4, r, 14)).fill(0x7a1e1e).stroke({ width: Math.max(2, r * 0.08), color: INK });
  g.poly(arcPts(L / 2, 0, r * 0.28, Math.PI * 0.2, Math.PI * 3.4, 18, r * 0.7), false).stroke({ width: Math.max(1.5, r * 0.06), color: GOLD });
}

/**
 * the rug unrolled on the floor from (cx, y0) toward the camera down to y1 (a perspective trapezoid with its border,
 * field and medallions), the still-rolled part sitting at its near end. `q` 0..1 = how far it has unrolled.
 */
function drawRug(g: Graphics, cx: number, y0: number, y1: number, w0: number, w1: number, q: number, u: number) {
  g.clear();
  const yq = y0 + (y1 - y0) * q;
  const wq = w0 + (w1 - w0) * q;
  if (q > 0.01) {
    g.poly([cx - w0, y0, cx + w0, y0, cx + wq, yq, cx - wq, yq]).fill(GOLD);
    const ins = 0.82;
    g.poly([cx - w0 * ins, y0 + 6 * u, cx + w0 * ins, y0 + 6 * u, cx + wq * ins, yq - 6 * u * (1 + q), cx - wq * ins, yq - 6 * u * (1 + q)]).fill(RUG);
    // medallions down the middle, fringe at the far end
    for (let i = 0; i < 5; i++) {
      const f = (i + 0.5) / 5;
      if (f > q) break;
      const y = y0 + (y1 - y0) * f;
      const ww = w0 + (w1 - w0) * f;
      g.poly([cx, y - ww * 0.18, cx + ww * 0.36, y, cx, y + ww * 0.18, cx - ww * 0.36, y]).fill(i % 2 ? LAPIS : TURQ).stroke({ width: Math.max(1.5, 3 * u), color: GOLD });
    }
    for (let i = 0; i <= 12; i++) g.rect(cx - w0 + (i * w0 * 2) / 12 - 1.5 * u, y0 - 10 * u, 3 * u, 10 * u).fill(GOLD_L);
  }
  if (q < 1) {
    const r = (14 + 70 * q) * u;
    const L = wq * 2;
    g.rect(cx - L / 2, yq - r, L, r * 2).fill(RUG).stroke({ width: Math.max(2, r * 0.08), color: INK });
    for (let i = 0; i < 7; i++) g.rect(cx - L / 2 + (i + 0.5) * (L / 7) - r * 0.15, yq - r, r * 0.3, r * 2).fill(i % 2 ? GOLD : LAPIS);
  }
}

/**
 * the palace terrace at sunset (w×h): sky, setting sun, the Nile with its shimmer, far bank (palms, a pyramid), the
 * felucca, the floor, papyrus columns and the architrave, linen drapes (redrawn to flutter), braziers. `u` = h/1080.
 */
function terrace(w: number, h: number, seed: number) {
  const u = h / 1080;
  const cx = w / 2;
  const hz = h * 0.6;
  const k = new Container();
  const sky = vgrad(new Graphics(), 0, 0, w, hz, SKY, 18);
  const sunX = cx + h * 0.36;
  const sunG = glowDisc(260 * u, 0xffd27a, 0.5, 8, 28);
  sunG.position.set(sunX, hz - 20 * u);
  const sunD = new Graphics().poly(ngon(sunX, hz - 20 * u, 90 * u, 90 * u, 36)).fill(0xffd890);
  // the far bank: a pyramid, palms
  const bank = new Graphics();
  bank.poly([cx - h * 0.7, hz, cx - h * 0.5, hz - h * 0.13, cx - h * 0.3, hz]).fill(0x8a4a5a);
  bank.poly([cx - h * 0.5, hz - h * 0.13, cx - h * 0.3, hz, cx - h * 0.44, hz]).fill({ color: 0x6a3a4a, alpha: 0.8 });
  bank.rect(-20, hz - 8 * u, w + 40, 10 * u).fill(0x5a3a4a);
  const r = rnd(seed);
  for (let x = -20 * u; x < w + 40 * u; x += 90 * u * (0.6 + r() * 0.8)) {
    if (Math.abs(x - sunX) < 60 * u) continue;
    const ph = (40 + r() * 50) * u;
    bank.poly(streak(x, hz - 4 * u, x + 6 * u, hz - ph, 3 * u, 2 * u)).fill(0x3a2438);
    for (let j = 0; j < 6; j++) {
      const a = Math.PI + (j / 5) * Math.PI;
      bank.poly(streak(x + 6 * u, hz - ph, x + 6 * u + Math.cos(a) * 34 * u, hz - ph + Math.sin(a) * 10 * u + 12 * u, 5 * u, 1 * u)).fill(0x3a2438);
    }
  }
  // the Nile with the sun's road on it
  const nile = vgrad(new Graphics(), 0, hz, w, h * 0.14, NILE, 6);
  const shimmer = new Graphics();
  const drawShimmer = (t: number) => {
    shimmer.clear();
    for (let i = 0; i < 12; i++) {
      const y = hz + (4 + i * 11) * u;
      const half = (30 + i * 12) * u;
      const x = sunX + Math.sin(t * 1.8 + i) * 8 * u;
      shimmer.rect(x - half, y, half * 2, 3 * u).fill({ color: 0xffd890, alpha: 0.65 - i * 0.04 });
    }
  };
  drawShimmer(0);
  // the felucca: a hull and a tall triangular sail
  const boat = new Graphics();
  boat.poly([-60 * u, 0, 60 * u, 0, 44 * u, 14 * u, -46 * u, 14 * u]).fill(0x3a2430);
  boat.poly(streak(0, 0, 4 * u, -120 * u, 2 * u, 1.5 * u)).fill(0x3a2430);
  boat.poly([4 * u, -118 * u, 70 * u, -10 * u, -30 * u, -6 * u]).fill(0xf0d8c0);
  boat.position.set(cx - h * 0.2, hz + 40 * u);
  // the floor of the terrace (light stone, turquoise and gold inlay)
  const floor = new Graphics();
  const fy = h * 0.74;
  floor.rect(0, fy, w, h - fy + 10).fill(STONE);
  floor.rect(0, fy, w, 10 * u).fill(GOLD).rect(0, fy + 10 * u, w, 6 * u).fill(TURQ);
  for (let i = -8; i <= 8; i++) floor.poly(streak(cx + i * h * 0.1, fy + 16 * u, cx + i * h * 0.5, h + 10, 1.2 * u, 3 * u)).fill({ color: 0xb8a070, alpha: 0.6 });
  for (let j = 0; j < 4; j++) floor.rect(0, fy + (40 + j * j * 26) * u, w, 2 * u).fill({ color: 0xb8a070, alpha: 0.6 });
  // the architrave across the top, painted
  const arch = new Graphics();
  arch.rect(-20, 0, w + 40, h * 0.13).fill(0xd8c49a);
  arch.rect(-20, h * 0.13, w + 40, 10 * u).fill(GOLD);
  for (let x = -20 * u; x < w + 20 * u; x += 36 * u) arch.rect(x, h * 0.105, 18 * u, h * 0.02).fill(Math.round(x / (36 * u)) % 2 ? LAPIS : TURQ);
  glyphRow(arch, -20 * u, h * 0.06, Math.ceil(w / (56 * u)) + 2, 56 * u, 0x6a4a2a, seed + 2, 0.8);
  // the columns (two each side; the middle stays open on the river)
  const cols = new Graphics();
  const cw = 120 * u;
  for (const dx of [-0.78, -0.48, 0.48, 0.78]) papyrus(cols, cx + dx * h, fy + 40 * u, cw * (Math.abs(dx) > 0.6 ? 1.15 : 1), h * 0.78);
  // linen drapes between the outer columns, fluttering
  const drapes = new Graphics();
  const drawDrapes = (t: number) => {
    drapes.clear();
    for (const side of [-1, 1]) {
      const x0 = cx + side * h * 0.78;
      const x1 = cx + side * h * 0.48;
      const pts: number[] = [x0, h * 0.14, x1, h * 0.14];
      for (let i = 0; i <= 8; i++) {
        const q = i / 8;
        pts.push(x1 + side * (Math.sin(t * 1.4 + q * 3) * 18 * u * q) - side * q * 30 * u, h * 0.14 + q * h * 0.52);
      }
      pts.push(x0 + side * Math.sin(t * 1.2) * 10 * u, h * 0.66);
      drapes.poly(pts).fill({ color: 0xfff6e8, alpha: 0.35 });
    }
  };
  drawDrapes(0);
  // braziers by the inner columns
  const fire = new Graphics();
  const fires = [cx - h * 0.36, cx + h * 0.36];
  const glows = fires.map((x) => {
    const gl = glowDisc(180 * u, 0xffa040, 0.35, 6, 22);
    gl.position.set(x, fy - 130 * u);
    return gl;
  });
  const drawFire = (t: number) => {
    fire.clear();
    fires.forEach((x, i) => torch(fire, x, fy + 20 * u, 120 * u, t + i * 2.1, 0x6a4a2a, GOLD));
    glows.forEach((gl, i) => (gl.alpha = 0.8 + 0.2 * Math.sin(t * 12 + i * 3)));
  };
  drawFire(0);
  k.addChild(sky, sunG, sunD, bank, nile, shimmer, boat, floor, drapes, cols, arch, ...glows, fire);
  const live = (t: number) => {
    drawShimmer(t);
    drawDrapes(t);
    drawFire(t);
    boat.x = cx - h * 0.2 + Math.sin(t * 0.2) * h * 0.08;
  };
  return { k, live, u, fy };
}

/** a lotus petal (falling) */
function petal(i: number) {
  return new Graphics().poly([0, -16, 7, -4, 5, 10, 0, 14, -5, 10, -7, -4]).fill(i % 3 === 0 ? 0xffffff : i % 3 === 1 ? 0xf8c8d8 : 0x9ad8ff).stroke({ width: 1.5, color: 0xc88aa8 });
}

interface St {
  give: () => void;
  shine: Container | null;
  guards: Container[];
}
const S = stash<St>();

export const cleogatra: Signature = {
  dark: false,
  frame: 0x2bb3a3,
  tag: 'UNIVERSO DEL NILO',
  open(c: SigCtx) {
    const tr = terrace(W, H, 91);
    c.back.addChild(tr.k);
    hideDisc(c, 0.2);
    if (!c.short && !c.reduce) {
      tr.k.alpha = 0;
      gsap.to(tr.k, { alpha: 1, duration: 0.3 });
    }
    if (!c.reduce) every(c, 30, (t) => !tr.k.destroyed && tr.live(t));
    // the rug (on the floor, in the scenery) and the guards
    const FEET = c.catY + 0.47 * 520;
    const rug = new Graphics();
    c.back.addChild(rug);
    const RUG_W0 = 150;
    const RUG_W1 = 520;
    const done = () => drawRug(rug, W / 2, FEET - 8, H + 60, RUG_W0, RUG_W1, 1, 1);
    const gs: Container[] = [];
    const spears: Graphics[] = [];
    for (const dir of [1, -1]) {
      const k = new Container();
      const sp = new Graphics();
      spear(sp, 0.21 * 380 * dir, -0.58 * 380, 520);
      k.addChild(sp, guard(380, dir));
      c.back.addChild(k);
      gs.push(k);
      spears.push(sp);
    }
    const stand = () => {
      gs[0].position.set(W / 2 - 330, FEET + 30);
      gs[1].position.set(W / 2 + 330, FEET + 30);
    };
    park(c, 'main', comic('¡LLEGÓ\nLA REINA!', GOLD_L, 120));
    const borrowed = borrowCat(c);
    const st: St = { give: () => borrowed.give(), shine: null, guards: gs };
    S.set(c, st);
    if (c.short) {
      done();
      stand();
      return;
    }

    if (!c.cat.destroyed) c.cat.alpha = 0;
    // the guards march in from the left with the rolled rug on their shoulders
    const carry = new Graphics();
    rolled(carry, 300, 26);
    const troupe = new Container();
    troupe.addChild(carry);
    c.back.addChild(troupe);
    const lead = gs[0];
    const back2 = gs[1];
    // during the march both face right
    back2.scale.x = -1;
    const place = (x: number, bob: number) => {
      lead.position.set(x + 150, FEET + 30 - bob);
      back2.position.set(x - 150, FEET + 30 - bob * 0.6);
      troupe.position.set(x, FEET + 30 - 0.7 * 380 - bob);
    };
    score(c, [
      [0.05, 'drumroll', 0.9],
      [0.82, 'boom', 0.8],
      [1.02, 'whoosh', 0.8],
      [1.05, 'paper', 0.7],
      [1.2, 'sting', 1.3],
      [1.45, 'gem', 1.6],
      [1.75, 'gem', 1.9],
    ]);
    if (c.reduce) place(W / 2, 0);
    else {
      place(-400, 0);
      const p = { x: -400, t: 0 };
      gsap.to(p, { x: W / 2, t: 1, duration: 0.75, ease: 'power1.out', onUpdate: () => place(p.x, Math.abs(Math.sin(p.t * Math.PI * 6)) * 10) });
    }
    // ¡PUM! they drop it and step aside
    const pum = comic('¡PUM!', GOLD_L, 100);
    const popPum = pre(c, pum, W / 2 - 330, 690, -0.1);
    at(c, 0.8, () => {
      if (troupe.destroyed) return;
      popPum(0.4);
      c.shaker.add(0.2);
      destroyTree(troupe);
      drawRug(rug, W / 2, FEET - 8, H + 60, RUG_W0, RUG_W1, 0, 1);
      back2.scale.x = 1;
      if (c.reduce) stand();
      else {
        gsap.to(gs[0], { x: W / 2 - 330, y: FEET + 30, duration: 0.3, ease: 'power2.out' });
        gsap.to(gs[1], { x: W / 2 + 330, y: FEET + 30, duration: 0.3, ease: 'power2.out' });
      }
    });
    // the rug unrolls at the camera in one go, and out she comes in a twirl
    const flop = comic('¡FLOOOP!', TURQ, 104);
    const popFlop = pre(c, flop, W / 2 + 470, 860, 0.08);
    at(c, 1.0, () => {
      if (rug.destroyed) return;
      popFlop(0.5);
      if (c.reduce) done();
      else {
        const p = { q: 0 };
        gsap.to(p, { q: 1, duration: 0.3, ease: 'power2.in', onUpdate: () => !rug.destroyed && drawRug(rug, W / 2, FEET - 8, H + 60, RUG_W0, RUG_W1, p.q, 1) });
      }
    });
    at(c, 1.15, () => {
      borrowed.give();
      if (!c.cat.destroyed && !c.reduce) {
        c.cat.alpha = 0;
        gsap.to(c.cat, { alpha: 1, duration: 0.18 });
      }
      // the twirl: two golden swooshes spin around her and sparkles fly off
      const tw = new Graphics();
      for (let s = 0; s < 2; s++) {
        const a0 = s * Math.PI;
        tw.poly(band(arcPts(0, 0, 300, a0, a0 + Math.PI * 0.9, 18, 120), 14, 2)).fill({ color: GOLD_L, alpha: 0.85 });
      }
      tw.position.set(W / 2, c.catY + 120);
      c.fg.addChildAt(tw, 0);
      if (!c.reduce) gsap.to(tw, { rotation: TAU * 0.8, duration: 0.45, ease: 'power2.out' });
      gsap.to(tw, { alpha: 0, delay: 0.3, duration: 0.25, onComplete: () => destroyTree(tw) });
      burst(c, c.fg, (i) => new Graphics().poly(twinkle(0, 0, 12 + (i % 3) * 5, 0.35)).fill(i % 2 ? GOLD_L : 0xffffff), 12, W / 2, c.catY, 520, 0.8);
    });
    // the pearl catches the light (and keeps a glow until her colors come)
    at(c, 1.42, () => {
      const [px, py] = onCat(c, PEARL[0], PEARL[1]);
      const shine = glowDisc(70, 0xffffff, 0.7, 6, 20);
      shine.position.set(px, py);
      c.fg.addChild(shine);
      st.shine = shine;
      glint(c, c.fg, px, py, 70, 0xffffff, 0.5);
      later(c, 0.32, () => glint(c, c.fg, px + 6, py - 4, 50, 0xd8f4ff, 0.45));
    });
    // the guards bow
    at(c, 1.6, () => {
      if (c.reduce) return;
      gsap.to(gs[0], { rotation: 0.12, duration: 0.2, yoyo: true, repeat: 1, repeatDelay: 0.25 });
      gsap.to(gs[1], { rotation: -0.12, duration: 0.2, yoyo: true, repeat: 1, repeatDelay: 0.25 });
    });
    later(c, 2.3, () => borrowed.give());
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    if (st) {
      st.give();
      if (st.shine && !st.shine.destroyed) gsap.to(st.shine, { alpha: 0, duration: 0.3, onComplete: () => destroyTree(st.shine!) });
      // the guards raise their spears
      if (!c.reduce) st.guards.forEach((g, i) => !g.destroyed && gsap.fromTo(g, { y: g.y }, { y: g.y - 30, duration: 0.15, yoyo: true, repeat: 1, delay: i * 0.08 }));
    }
    sfx('fanfare', 1.15);
    sfx('gem', 1.5);
    later(c, 0.15, () => sfx('gem', 1.9));
    c.shaker.add(0.2);
    const [px, py] = onCat(c, PEARL[0], PEARL[1]);
    glint(c, c.fg, px, py, 90, 0xffffff, 0.6);
    fall(c, c.fg, (i) => petal(i), { n: 26, over: 1.6, dur: 2.2, spin: 3 });
    burst(c, c.fg, (i) => new Graphics().rect(-9, -5, 18, 10).fill(i % 3 === 0 ? GOLD_L : i % 3 === 1 ? TURQ : LAPIS), 30, W / 2, c.catY - 80, 860, 1.4);
    const main = take(c, 'main', () => comic('¡LLEGÓ\nLA REINA!', GOLD_L, 120));
    payline(c, main, '…y trajo su propia alfombra.', { maxW: 640, dur: 2.6, asideStyle: { fill: 0xfff2c8 } });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const tr = terrace(w, h, 93);
    k.addChild(tr.k);
    const rug = new Graphics();
    drawRug(rug, w / 2, h * 0.78, h * 1.05, h * 0.1, h * 0.36, 1, tr.u);
    k.addChild(rug);
    // the pearl's twinkle over the river
    const tw = new Graphics().poly(twinkle(0, 0, 30 * tr.u, 0.18)).fill(0xffffff);
    tw.position.set(w / 2, h * 0.36);
    tw.alpha = 0;
    k.addChild(tw);
    if (live)
      cardLoop(k, 30, (t) => {
        tr.live(t);
        const q = t % 3;
        tw.alpha = q < 0.4 ? Math.sin((q / 0.4) * Math.PI) : 0;
        tw.rotation = t;
      });
    return k;
  },
};
