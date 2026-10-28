/**
 * Doctor Ovillo: the tentacle universe. A mad-science lab flickers on — riveted steel, pressure gauges, yarn cables
 * sagging from the ceiling, a fusion reactor that is a glowing ball of yarn behind him — and four mechanical arms,
 * wrapped in green yarn, slam in around him one by one (¡CLANC!), claws biting the walls, needles into the red.
 * Payoff: the reactor flares and the four claws shoot yarn across the whole lab; ¡HORA DE ENREDAR!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, CHEER, backlight, bolt, burst, cheer, every, flashOf, later, score, starburst, word } from './kit';
import { box, cardLoop, hideDisc, ring } from './kitA';

const WALL = 0x1c2a29;
const PANEL = 0x24363a;
const STEEL = 0x9aa3b2;
const STEEL_D = 0x6b7485;
const STEEL_HI = 0xe1e7ef;
const BRASS = 0xc9a227;
const GREEN = 0x5f9a3e;
const LIME = 0xa6e05a;
const GLOW = 0xffd36b;
const YARNS = [GREEN, BRASS, 0xd2433a, 0xe9dcc0, 0x7fb24f];

/** the lab: riveted panels, a pipe along the ceiling, the floor grate (w×h, scale s) */
function lab(w = W, h = H, s = 1): Container {
  const k = new Container();
  k.addChild(new Graphics().rect(0, 0, w, h).fill(WALL));
  const p = new Graphics();
  const pw = 230 * s;
  const ph = 250 * s;
  for (let y = 150 * s; y < h * 0.8; y += ph + 14 * s)
    for (let x = 10 * s; x < w; x += pw + 14 * s) {
      p.rect(x, y, pw, ph).fill(PANEL).stroke({ width: 3 * s, color: 0x13201f });
      for (const [rx, ry] of [
        [x + 12 * s, y + 12 * s],
        [x + pw - 12 * s, y + 12 * s],
        [x + 12 * s, y + ph - 12 * s],
        [x + pw - 12 * s, y + ph - 12 * s],
      ])
        p.circle(rx, ry, 5 * s).fill(0x3d5559);
    }
  k.addChild(p);
  // the ceiling: a fat pipe with joints, the light tubes' housings
  const top = new Graphics().rect(0, 0, w, 120 * s).fill(0x111a1a);
  top.rect(0, 92 * s, w, 34 * s).fill(0x4a5560).stroke({ width: 3 * s, color: C.ink });
  for (let x = 120 * s; x < w; x += 300 * s) top.rect(x, 86 * s, 26 * s, 46 * s).fill(BRASS).stroke({ width: 3 * s, color: C.ink });
  k.addChild(top);
  // the floor grate
  const fl = new Graphics().rect(0, h * 0.8, w, h * 0.2).fill(0x161d1f);
  for (let x = 0; x < w; x += 40 * s) fl.moveTo(x, h * 0.8).lineTo(x + (x - w / 2) * 0.25, h).stroke({ width: 2 * s, color: 0x2c3a3c });
  for (let j = 1; j < 6; j++) fl.moveTo(0, h * 0.8 + j * j * 7 * s).lineTo(w, h * 0.8 + j * j * 7 * s).stroke({ width: 2 * s, color: 0x2c3a3c });
  fl.rect(0, h * 0.8 - 6 * s, w, 8 * s).fill(BRASS);
  k.addChild(fl);
  return k;
}

/** a pressure gauge: a dial with a red zone and a needle (returns the needle to spin) */
function gauge(r: number): { g: Container; needle: Graphics } {
  const g = new Container();
  const d = new Graphics().circle(0, 0, r + 10).fill(BRASS).stroke({ width: 5, color: C.ink }).circle(0, 0, r).fill(0xf2ead6);
  d.moveTo(Math.cos(0.5) * r * 0.78, Math.sin(0.5) * r * 0.78).arc(0, 0, r * 0.78, 0.5, 2.2).stroke({ width: r * 0.16, color: 0xd2433a });
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI * 1.2 + (i / 10) * Math.PI * 1.4 + Math.PI / 2;
    d.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62).lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
  }
  d.stroke({ width: 3, color: C.ink });
  const needle = new Graphics().poly([-5, 0, 0, -r * 0.82, 5, 0]).fill(C.ink).circle(0, 0, 9).fill(C.ink);
  needle.rotation = -1.9;
  g.addChild(d, needle);
  return { g, needle };
}

/** the reactor: a glowing ball of yarn in a steel containment ring */
function reactor(size: number): Container {
  // drawn at the reveal's size (190) and scaled (the clamps and the ring keep their proportions on a card)
  const r = 190;
  const k = new Container();
  k.scale.set(size / 190);
  k.addChild(backlight(GLOW, r * 2.1, 0.75));
  const b = new Graphics().circle(0, 0, r).fill(0xffc24a);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI;
    const e = new Graphics().ellipse(0, 0, r * 0.98, r * (0.25 + (i % 4) * 0.18)).stroke({ width: 5, color: i % 2 ? 0xfff0b8 : 0xe0a22a, alpha: 0.9 });
    e.rotation = a;
    k.addChild(e);
  }
  k.addChildAt(b, 1);
  const rg = new Graphics().circle(0, 0, r * 1.22).stroke({ width: 26, color: 0x55606c }).circle(0, 0, r * 1.22).stroke({ width: 6, color: C.ink, alpha: 0.6 });
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const cl = new Graphics().rect(-26, -40, 52, 80).fill(BRASS).stroke({ width: 5, color: C.ink });
    cl.position.set(Math.cos(a) * r * 1.22, Math.sin(a) * r * 1.22);
    cl.rotation = a;
    rg.addChild(cl);
  }
  k.addChild(rg);
  return k;
}

interface Arm {
  ox: number;
  oy: number;
  tx: number;
  ty: number;
  side: number;
  up: boolean;
  k: number;
  open: number;
  ph: number;
}

function bez(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

const NSEG = 17;

/** one joint of an arm, drawn once facing +x (gunmetal + brass ring + highlight, or wound with green yarn) */
function joint(r: number, yarn: boolean, steel: number): Graphics {
  const g = new Graphics();
  g.circle(0, 0, r + 4).fill(C.ink);
  g.circle(0, 0, r).fill(yarn ? GREEN : steel);
  if (yarn) {
    for (const o of [-0.55, -0.1, 0.35]) g.moveTo(r * o, r * 0.92).lineTo(r * (o + 0.4), -r * 0.92);
    g.stroke({ width: 6, color: LIME, cap: 'round' });
  } else {
    g.circle(0, 0, r * 0.62).stroke({ width: 5, color: BRASS });
    g.moveTo(Math.cos(Math.PI * 1.05) * r * 0.8, Math.sin(Math.PI * 1.05) * r * 0.8).arc(0, 0, r * 0.8, Math.PI * 1.05, Math.PI * 1.55).stroke({ width: 5, color: STEEL_HI, cap: 'round' });
  }
  return g;
}

/** a claw finger drawn once from the claw's center along +x, curling toward the middle (j = -1 / 0 / 1) */
function finger(j: number): Graphics {
  const ea = -j * 0.6;
  const qx = 84 + Math.cos(ea) * 50;
  const qy = Math.sin(ea) * 50;
  return new Graphics()
    .moveTo(22, 0)
    .quadraticCurveTo(84, 0, qx, qy)
    .stroke({ width: 22, color: C.ink, cap: 'round' })
    .moveTo(22, 0)
    .quadraticCurveTo(84, 0, qx, qy)
    .stroke({ width: 13, color: STEEL_HI, cap: 'round' });
}

/**
 * a mechanical arm as a rig: its joints and claw are built once; every frame only their positions and rotations move
 * along the arm's curve (no redrawing — four arms at 60 fps cost nothing)
 */
class ArmRig {
  k = new Container();
  private joints: Graphics[] = [];
  private claw = new Container();
  private fingers: Graphics[] = [];
  constructor(
    layer: Container,
    private scale = 1,
  ) {
    for (let i = 1; i <= NSEG; i++) {
      const sN = i / NSEG;
      const j = joint(46 - 18 * sN, i % 2 === 0, i % 4 === 1 ? STEEL : STEEL_D);
      this.joints.push(j);
      this.k.addChild(j);
    }
    for (const j of [-1, 0, 1]) {
      const f = finger(j);
      this.fingers.push(f);
      this.claw.addChild(f);
    }
    const head = new Graphics()
      .circle(0, 0, 40)
      .fill(BRASS)
      .stroke({ width: 5, color: C.ink })
      .circle(0, 0, 24)
      .fill({ color: 0xff3b2f, alpha: 0.35 })
      .circle(0, 0, 13)
      .fill(0xff5a3c)
      .circle(-4, -4, 4)
      .fill(0xffd0c0);
    this.claw.addChild(head);
    this.k.addChild(this.claw);
    this.k.scale.set(scale);
    layer.addChild(this.k);
  }
  /** lay the rig along arm `a` at time `t` (coordinates in the layer's space) */
  update(a: Arm, t: number, still: boolean) {
    if (this.k.destroyed) return;
    this.k.visible = a.k > 0.01;
    if (!this.k.visible) return;
    const sc = this.scale;
    const L = (v: number) => v / sc;
    const sw = still ? 0 : Math.sin(t * 1.7 + a.ph) * 22 * sc;
    const sw2 = still ? 0 : Math.cos(t * 1.3 + a.ph) * 14 * sc;
    const ex = a.ox + (a.tx + sw - a.ox) * a.k;
    const ey = a.oy + (a.ty + sw2 - a.oy) * a.k;
    const c1x = a.ox + a.side * 70 * sc * a.k;
    const c1y = a.oy + (a.up ? -330 : 140) * sc * a.k;
    const c2x = ex - a.side * (a.up ? 260 : 180) * sc * a.k;
    const c2y = ey + (a.up ? -160 : 90) * sc * a.k;
    let px = a.ox;
    let py = a.oy;
    let dir = 0;
    const js = 0.7 + 0.3 * a.k;
    for (let i = 1; i <= NSEG; i++) {
      const s = i / NSEG;
      const x = bez(a.ox, c1x, c2x, ex, s);
      const y = bez(a.oy, c1y, c2y, ey, s);
      dir = Math.atan2(y - py, x - px);
      px = x;
      py = y;
      const j = this.joints[i - 1];
      j.position.set(L(x), L(y));
      j.rotation = dir;
      j.scale.set(js);
    }
    this.claw.position.set(L(px), L(py));
    const spread = 0.28 + 0.62 * a.open;
    this.fingers.forEach((f, n) => (f.rotation = dir + (n - 1) * spread));
  }
}

/** where the claws are now (for the payoff's yarn shots) */
function tipOf(a: Arm, t: number, still: boolean) {
  const sw = still ? 0 : Math.sin(t * 1.7 + a.ph) * 22;
  const sw2 = still ? 0 : Math.cos(t * 1.3 + a.ph) * 14;
  return { x: a.ox + (a.tx + sw - a.ox) * a.k, y: a.oy + (a.ty + sw2 - a.oy) * a.k };
}

/** a hanging yarn cable (a sagging curve) from (x0,y0) to (x1,y1) */
function cable(g: Graphics, x0: number, y0: number, x1: number, y1: number, sag: number, color: number, w = 10) {
  const mx = (x0 + x1) / 2;
  const my = Math.max(y0, y1) + sag;
  g.moveTo(x0, y0).quadraticCurveTo(mx, my, x1, y1).stroke({ width: w + 4, color: C.ink, cap: 'round' });
  g.moveTo(x0, y0).quadraticCurveTo(mx, my, x1, y1).stroke({ width: w, color, cap: 'round' });
  g.moveTo(x0, y0).quadraticCurveTo(mx, my, x1, y1).stroke({ width: w * 0.3, color: 0x000000, alpha: 0.25, cap: 'round' });
}

interface Lab {
  arms: Arm[];
  clock: () => number;
}
const state = new WeakMap<SigCtx, Lab>();

export const ovillo: Signature = {
  dark: true,
  frame: BRASS,
  tag: 'UNIVERSO TENTÁCULO',
  open(c: SigCtx) {
    const k = lab();
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the gauges (left wall ×2, right wall low)
    const gauges = [
      [170, 330, 84],
      [300, 600, 66],
      [W - 170, 660, 84],
    ].map(([x, y, r]) => {
      const gg = gauge(r);
      gg.g.position.set(x, y);
      k.addChild(gg.g);
      return gg.needle;
    });
    // the light tubes (they flicker on)
    const tubes = [380, 960, 1540].map((x) => {
      const t = new Graphics().roundRect(-220, -10, 440, 20, 10).fill(0xeaffff);
      t.position.set(x, 56);
      const halo = new Graphics().poly([-240, 10, 240, 10, 420, 420, -420, 420]).fill({ color: 0xd8fff4, alpha: 0.05 });
      halo.position.set(x, 56);
      k.addChild(halo, t);
      return [t, halo] as const;
    });
    // the yarn cables sagging from the ceiling pipe
    const cables = new Graphics();
    k.addChild(cables);
    const CAB: [number, number, number, number, number, number][] = [
      [60, 120, 520, 120, 260, 0],
      [420, 120, 860, 120, 180, 1],
      [1060, 120, 1500, 120, 200, 2],
      [1380, 120, 1880, 120, 300, 3],
      [200, 120, 40, 820, 80, 4],
      [1720, 120, 1880, 860, 60, 0],
    ];
    const drawCables = (t: number) => {
      if (cables.destroyed) return;
      cables.clear();
      CAB.forEach(([x0, y0, x1, y1, sag, ci], i) => cable(cables, x0, y0, x1, y1, sag + Math.sin(t * 1.4 + i) * (c.reduce ? 0 : 14), YARNS[ci]));
    };
    drawCables(0);
    // the reactor behind him (its own disc)
    const rx = reactor(190);
    rx.position.set(W / 2, c.CY);
    c.behind.addChild(rx);
    // the arms, behind the cat
    const ag = new Container();
    c.behind.addChild(ag);
    const ox = W / 2;
    const oy = c.catY + 40;
    const arms: Arm[] = [
      { ox, oy, tx: W / 2 - 600, ty: c.catY - 330, side: -1, up: true, k: 0, open: 1, ph: 0 },
      { ox, oy, tx: W / 2 + 610, ty: c.catY - 310, side: 1, up: true, k: 0, open: 1, ph: 1.7 },
      { ox, oy, tx: W / 2 + 640, ty: c.catY + 300, side: 1, up: false, k: 0, open: 1, ph: 3.1 },
      { ox, oy, tx: W / 2 - 650, ty: c.catY + 290, side: -1, up: false, k: 0, open: 1, ph: 4.4 },
    ];
    const t0 = performance.now();
    state.set(c, { arms, clock: () => (performance.now() - t0) / 1000 });
    const rigs = arms.map(() => new ArmRig(ag));
    const drawAll = (t: number) => {
      if (ag.destroyed) return;
      arms.forEach((a, i) => rigs[i].update(a, t, c.reduce));
    };
    if (c.reduce || c.short) {
      for (const a of arms) {
        a.k = 1;
        a.open = 0.15;
      }
      drawAll(0);
      gauges.forEach((n) => (n.rotation = 1.5));
      if (c.reduce) return;
    }
    every(c, 40, (t) => {
      drawAll(t);
      drawCables(t);
      if (!rx.destroyed) rx.scale.set(1 + Math.sin(t * 5) * 0.025);
    });
    if (c.short) return;

    // lights flicker on
    for (const [t, h] of tubes) {
      t.alpha = 0;
      h.alpha = 0;
    }
    tubes.forEach(([t, h], i) => {
      const seq = [0.04, 0.09, 0.15, 0.22].map((s) => s + i * 0.07);
      seq.forEach((s, j) => later(c, s, () => !t.destroyed && ((t.alpha = j % 2 ? 0.2 : 1), (h.alpha = j % 2 ? 0 : 1))));
    });
    score(c, [
      [0.04, 'zap', 1.8],
      [0.12, 'zap', 2.1],
      [0.2, 'zap', 1.6],
      [0.1, 'charge', 0.6],
    ]);
    k.alpha = 0.35;
    gsap.to(k, { alpha: 1, duration: 0.3, delay: 0.1 });
    rx.scale.set(0.2);
    rx.alpha = 0;
    gsap.to(rx, { alpha: 1, duration: 0.3 });
    // the four slams
    arms.forEach((a, i) => {
      const at = 0.3 + i * 0.2;
      gsap.to(a, { k: 1, duration: 0.2, delay: at, ease: 'back.out(2.2)' });
      later(c, at + 0.14, () => {
        gsap.to(a, { open: 0.15, duration: 0.08 });
        const tip = tipOf(a, (performance.now() - t0) / 1000, false);
        sfx('boom', 1.25 - i * 0.08);
        sfx('hit', 0.7 + i * 0.1);
        c.shaker.add(0.28);
        const cr = new Graphics();
        for (let j = 0; j < 6; j++) {
          const an = (j / 6) * Math.PI * 2 + Math.random() * 0.5;
          bolt(cr, tip.x, tip.y, tip.x + Math.cos(an) * (70 + Math.random() * 60), tip.y + Math.sin(an) * (70 + Math.random() * 60), C.ink, 5, 4, 16);
        }
        k.addChild(cr);
        const pow = starburst(new Graphics(), 120, 12, i % 2 ? GLOW : 0xffffff);
        pow.position.set(tip.x, tip.y);
        c.back.addChild(pow);
        gsap.fromTo(pow.scale, { x: 0.3, y: 0.3 }, { x: 1.1, y: 1.1, duration: 0.12, ease: 'back.out(3)' });
        gsap.to(pow, { alpha: 0, delay: 0.12, duration: 0.25, onComplete: () => pow.destroy() });
        burst(c, c.fg, () => new Graphics().rect(-12, -2, 24, 4).fill(i % 2 ? 0xfff27a : 0xffb347), 10, tip.x, tip.y, 260, 0.5);
        gauges.forEach((n, j) => gsap.to(n, { rotation: -1.2 + (i + 1) * 0.65 + j * 0.1, duration: 0.25, ease: 'back.out(3)' }));
        if (i === 1) word(c, tip.x - 120, tip.y + 140, '¡CLANC!', LIME, 92, 0.8);
        if (i === 3) word(c, tip.x + 130, tip.y - 150, '¡CLANC!', GLOW, 92, 0.8);
      });
    });
    // the reactor lights once the four are in
    later(c, 1.15, () => {
      gsap.to(rx.scale, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2)' });
      sfx('charge', 1.2);
      sfx('zap', 0.8);
    });
    // the claws snap, one after another, and the gauges tremble in the red
    for (let i = 0; i < 4; i++)
      later(c, 1.45 + i * 0.14, () => {
        const a = arms[i];
        gsap.to(a, { open: 0.9, duration: 0.06, yoyo: true, repeat: 1 });
        sfx('tick', 1.4 + i * 0.2);
      });
    later(c, 1.5, () => word(c, W / 2, 150, '¡HORA DE ENREDAR!', LIME, 92, 1.2));
    every(c, 20, () => gauges.forEach((n) => !n.destroyed && n.rotation > 0.4 && (n.rotation += (Math.random() - 0.5) * 0.06)));
    // steam from the ceiling pipe joints
    later(c, 1.1, () => {
      for (let i = 0; i < 5; i++) {
        const p = new Graphics().circle(0, 0, 30).fill({ color: 0xe8f4f2, alpha: 0.5 });
        p.position.set(120 + i * 300 + 13, 130);
        c.back.addChild(p);
        gsap.fromTo(p.scale, { x: 0.3, y: 0.3 }, { x: 2.4, y: 2.4, duration: 0.8, delay: i * 0.06 });
        gsap.to(p, { alpha: 0, y: 200, duration: 0.8, delay: i * 0.06, onComplete: () => p.destroy() });
      }
      sfx('splash', 1.8);
    });
  },
  payoff(c: SigCtx) {
    const st = state.get(c);
    sfx('bigboom', 1.1);
    sfx('charge', 1.6);
    flashOf(c, 0xfff3c4, 0.6, 0.45);
    ring(c, c.behind, W / 2, c.CY, GLOW, 120, 7, 22, 0.8);
    c.shaker.add(0.5);
    // the four claws shoot yarn across the lab (it stays: a tangle)
    const tangle = new Graphics();
    c.back.addChild(tangle);
    const shots: { x0: number; y0: number; x1: number; y1: number; col: number; p: number }[] = [];
    const t = st ? st.clock() : 0;
    (st?.arms ?? []).forEach((a, i) => {
      const tip = tipOf(a, t, c.reduce);
      gsap.to(a, { open: 1, duration: 0.08 });
      for (let j = 0; j < 6; j++) {
        // across the lab: each claw throws yarn to the far side (the lines cross behind him: a tangle)
        const far = tip.x < W / 2;
        const x1 = far ? W * (0.45 + Math.random() * 0.5) : W * (0.05 + Math.random() * 0.5);
        const y1 = 140 + Math.random() * (H - 300);
        const sh = { x0: tip.x, y0: tip.y, x1, y1, col: YARNS[(i + j) % YARNS.length], p: c.reduce ? 1 : 0 };
        shots.push(sh);
        if (!c.reduce) gsap.to(sh, { p: 1, duration: 0.18, delay: 0.05 + j * 0.06 + i * 0.03, ease: 'power2.out' });
      }
    });
    const draw = () => {
      if (tangle.destroyed) return;
      tangle.clear();
      for (const s of shots) {
        if (s.p <= 0) continue;
        const x = s.x0 + (s.x1 - s.x0) * s.p;
        const y = s.y0 + (s.y1 - s.y0) * s.p;
        const mx = (s.x0 + x) / 2 + (y - s.y0) * 0.16;
        const my = (s.y0 + y) / 2 - (x - s.x0) * 0.16;
        tangle.moveTo(s.x0, s.y0).quadraticCurveTo(mx, my, x, y).stroke({ width: 19, color: C.ink, cap: 'round' });
        tangle.moveTo(s.x0, s.y0).quadraticCurveTo(mx, my, x, y).stroke({ width: 12, color: s.col, cap: 'round' });
        tangle.moveTo(s.x0, s.y0).quadraticCurveTo(mx, my, x, y).stroke({ width: 3, color: 0xffffff, alpha: 0.35, cap: 'round' });
        if (s.p >= 1) tangle.circle(x, y, 22).fill(s.col).stroke({ width: 5, color: C.ink });
      }
    };
    if (c.reduce) draw();
    else {
      const stop = every(c, 60, draw);
      later(c, 1.0, () => {
        stop();
        draw();
      });
    }
    score(c, [
      [0.05, 'whoosh', 1.6],
      [0.15, 'whoosh', 1.9],
      [0.25, 'whoosh', 2.2],
      [0.4, 'fanfare', 0.9],
    ]);
    cheer(c, '¡HORA DE ENREDAR!', LIME, 112, 1.9);
    later(c, 1.0, () => word(c, CHEER[0] + 40, CHEER[1] + 110, '…y de tejer.', C.paper, 46, 1.8, F.ui));
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const s = Math.min(w, h) / 1000;
    k.addChild(lab(w, h, Math.max(0.35, s * 1.6)));
    k.addChild(box(w, h, 0x000000, 0.15));
    const rx = reactor(Math.min(w, h) * 0.26);
    const rs = rx.scale.x;
    rx.position.set(w / 2, h * 0.54);
    k.addChild(rx);
    const ag = new Container();
    k.addChild(ag);
    const sc = (Math.min(w, h) / 1080) * 1.1;
    const arms: Arm[] = [
      { ox: w / 2, oy: h * 0.6, tx: w * 0.08, ty: h * 0.14, side: -1, up: true, k: 1, open: 0.2, ph: 0 },
      { ox: w / 2, oy: h * 0.6, tx: w * 0.92, ty: h * 0.16, side: 1, up: true, k: 1, open: 0.2, ph: 2 },
      { ox: w / 2, oy: h * 0.6, tx: w * 0.94, ty: h * 0.9, side: 1, up: false, k: 1, open: 0.2, ph: 3.5 },
      { ox: w / 2, oy: h * 0.6, tx: w * 0.06, ty: h * 0.88, side: -1, up: false, k: 1, open: 0.2, ph: 5 },
    ];
    const rigs = arms.map(() => new ArmRig(ag, sc));
    const draw = (t: number, still: boolean) => arms.forEach((a, i) => rigs[i].update(a, t, still));
    draw(0, true);
    if (live)
      cardLoop(k, 24, (t) => {
        arms.forEach((a, i) => (a.open = 0.2 + 0.6 * Math.max(0, Math.sin(t * 2.2 + i * 1.6)) ** 6));
        draw(t, false);
        rx.scale.set(rs * (1 + Math.sin(t * 5) * 0.025));
      });
    return k;
  },
};
