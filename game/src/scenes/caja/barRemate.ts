/**
 * LA ÚLTIMA RONDA — the reveal's execution (docs/part-iii/13 §3.4, «La revelación»: the staging is approved, only its
 * execution is polished; it does not get longer). Pure poses and drawings that CajaScene's bar set uses:
 *
 *   R6  hipFall(ft)      Hipólito's slow-motion fall: ANTICIPATION (a snore-inhale, he settles further onto the
 *                        counter), then the slide backwards off the stool, stretched, dropping behind the counter.
 *       towerAt(ft)      the donut tower DRAGGED with him: the stand tilts after him with a lag, the donuts slide off
 *                        the top first (overlapping action), each on its own slow arc, flipping; faint after-images
 *                        say «slow motion».
 *   R7  FloorShot        the floor behind the counter: he lies on his back, happy, still asleep; the donuts drop onto
 *                        each paw and the crown lands last («plink»); his snore bubble comes back; a slow push in.
 *   R8  leaveWobble(L)   Canelo gets off his stool staggering, and wobbles at the door.
 */
import { Container, Graphics, type Sprite } from 'pixi.js';
import { W, H, game } from '../../core/App';
import { BAR } from '../../momentos/songs/drunck/layout';
import { LW, TV, donut } from '../../momentos/songs/drunck/tv';
import { star } from './barKit';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (k: number) => {
  const x = clamp(k, 0, 1);
  return x * x * (3 - 2 * x);
};
const out3 = (k: number) => 1 - (1 - clamp(k, 0, 1)) ** 3;

/** R6: the fall's timing (s) — the anticipation, then the slide (the cine's «pop» comes at 1.5 s) */
export const FALL = { antic: 0.4, slide: 1.9 } as const;

/** R6: Hipólito's pose `ft` seconds into the fall (Toon fields: rot, dx, dy, sx, sy) */
export function hipFall(ft: number): { rot: number; dx: number; dy: number; sx: number; sy: number } {
  // anticipation: he breathes in (a snore), squeezes, slides a hair further onto the counter
  const a = smooth(ft / FALL.antic);
  const inhale = Math.sin(clamp(ft / FALL.antic, 0, 1) * Math.PI);
  // the slide: slow motion (a gentle ease in), tipping backwards and dropping behind the counter
  const k = clamp((ft - FALL.antic) / FALL.slide, 0, 1);
  const e = k ** 1.7;
  return {
    rot: lerp(-0.42 - 0.08 * a, 1.45, e),
    dx: lerp(-30 - 22 * a, 170, smooth(k)),
    dy: 10 - 10 * inhale + e * 620,
    sx: 1 - 0.04 * inhale + 0.03 * Math.sin(k * Math.PI),
    sy: 1 + 0.07 * inhale + 0.06 * Math.sin(k * Math.PI),
  };
}

export interface DonutAt {
  x: number;
  y: number;
  /** -1..1: the flip of a donut turning over (1 = face up) */
  flip: number;
  /** after-images: where it was a moment ago (slow motion) */
  ghosts: [number, number][];
}
const N = 7;
/** the stand's tilt: it follows his paw with a lag (the drag) */
function standTilt(ft: number) {
  return 0.95 * smooth((ft - FALL.antic - 0.15) / 1.1);
}
/** where donut `i` (0 bottom … 6 top) is `ft` seconds into the fall (null = gone behind the counter) */
function donutAt(i: number, ft: number): { x: number; y: number; flip: number } | null {
  const { tower, counterBack } = BAR;
  const px = tower.x;
  const py = counterBack - 34;
  const base = { x: i % 2 ? 8 : -8, y: -26 - i * 34 };
  // the higher ones lag behind (drag) and leave first
  const leave = FALL.antic + 0.55 + (N - 1 - i) * 0.07;
  const th = (tt: number) => standTilt(tt) * (1 - 0.05 * i);
  const at = (tt: number) => {
    const a = th(tt);
    return { x: px + base.x * Math.cos(a) - base.y * Math.sin(a), y: py + base.x * Math.sin(a) + base.y * Math.cos(a) };
  };
  if (ft < 0 || ft <= leave) {
    const p = at(Math.max(0, ft));
    return { ...p, flip: 1 };
  }
  // flying: the velocity it had on the tilting stack, then slow-motion gravity; it turns over as it goes
  const p0 = at(leave);
  const p1 = at(leave - 0.05);
  const vx = (p0.x - p1.x) / 0.05 + 40 + i * 18;
  const vy = (p0.y - p1.y) / 0.05 - 120 - i * 14;
  const tt = ft - leave;
  const x = p0.x + vx * tt;
  const y = p0.y + vy * tt + 0.5 * 520 * tt * tt;
  if (y > BAR.floor + 80) return null;
  return { x, y, flip: Math.cos(tt * (2.2 + i * 0.3)) };
}
/** R6: the tower (stand + donuts) `ft` seconds into the fall; ft < 0 = standing */
export function towerAt(ft: number): { tilt: number; donuts: (DonutAt | null)[] } {
  const donuts: (DonutAt | null)[] = [];
  for (let i = 0; i < N; i++) {
    const d = donutAt(i, ft);
    if (!d) {
      donuts.push(null);
      continue;
    }
    const ghosts: [number, number][] = [];
    if (ft > 0) for (const back of [0.09, 0.18]) {
      const g = donutAt(i, ft - back);
      if (g && Math.hypot(g.x - d.x, g.y - d.y) > 8) ghosts.push([g.x, g.y]);
    }
    donuts.push({ ...d, ghosts });
  }
  return { tilt: ft < 0 ? 0 : standTilt(ft), donuts };
}

/** a donut that can turn over (flip -1..1 squashes it; its underside is plain dough) */
export function donutFlip(g: Graphics, x: number, y: number, r: number, seed: number, flip: number, alpha = 1) {
  const f = Math.max(0.12, Math.abs(flip));
  if (alpha < 1 || f < 0.98) {
    g.ellipse(x, y, r, r * 0.62 * f).fill({ color: flip >= 0 ? TV.pink : TV.amberL, alpha }).stroke({ width: LW * 0.8, color: TV.line, alpha });
    g.ellipse(x, y, r * 0.3, r * 0.17 * f).fill({ color: TV.amberD, alpha }).stroke({ width: LW * 0.5, color: TV.line, alpha });
    return;
  }
  donut(g, x, y, r, seed);
}

/** R6: draw the tower (the stand tilts with the drag) */
export function drawTowerAt(g: Graphics, ft: number) {
  const { tower, counterBack } = BAR;
  const { tilt, donuts } = towerAt(ft);
  // the stand (a cake stand), tilting about its foot
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  const P = (lx: number, ly: number): [number, number] => [tower.x + lx * c - ly * s, counterBack - 34 + lx * s + ly * c];
  if (ft >= 0 && tilt > 0.01) {
    const pts = [P(-110, -10), P(110, -10), P(110, 10), P(-110, 10)].flat();
    g.poly(pts).fill(TV.chrome).stroke({ width: LW, color: TV.line, join: 'round' });
  }
  donuts.forEach((d, i) => {
    if (!d) return;
    for (const [k, [gx, gy]] of d.ghosts.entries()) donutFlip(g, gx, gy, 64, i + 2, d.flip, 0.22 - k * 0.08);
    donutFlip(g, d.x, d.y, 64, i + 2, d.flip);
  });
  // a sparkle of sugar where the tower was (the moment it goes)
  if (ft > FALL.antic + 0.5 && ft < FALL.antic + 1.0) star(g, tower.x - 60, counterBack - 120, 30 * (1 - (ft - FALL.antic - 0.5) / 0.5), TV.white);
}

// ------------------------------------------------------------------ R7 · the floor
/** a point of a 700-unit painting on a sprite anchored at its center, rotated `rot` */
function onSprite(sp: Sprite, px: number, py: number): { x: number; y: number } {
  const k = (sp.texture.height / 700) * sp.scale.y;
  const lx = (px - 350) * k;
  const ly = (py - 350) * k;
  const c = Math.cos(sp.rotation);
  const s = Math.sin(sp.rotation);
  return { x: sp.x + lx * c - ly * s, y: sp.y + lx * s + ly * c };
}
/** R7: the floor behind the counter, Hipólito on his back, the donuts landing on him */
export class FloorShot {
  readonly root = new Container();
  private cam = new Container();
  private dyn = new Graphics();
  private spots: { x: number; y: number; r: number; at: number }[] = [];
  private head = { x: W / 2, y: H / 2 };
  constructor(
    hip: Sprite | null,
    readonly t0: number,
    private readonly gentle: boolean,
  ) {
    const v = game.view;
    const g = new Graphics();
    // checkered floor tiles (amber / cream), the stool legs, the counter's foot, its shadow
    g.rect(v.x - 200, v.y - 200, v.w + 400, v.h + 400).fill(TV.cream);
    for (let i = -14; i < 32; i++) for (let j = -10; j < 18; j++) if ((i + j) % 2 === 0) g.rect(i * 110, j * 110, 110, 110).fill(0xf0c27a);
    g.rect(v.x - 200, v.y - 200, v.w + 400, 370).fill(TV.woodD);
    g.moveTo(v.x - 200, v.y + 170).lineTo(v.x + v.w + 200, v.y + 170).stroke({ width: LW, color: TV.line });
    g.rect(v.x - 200, v.y + 170, v.w + 400, 60).fill({ color: TV.line, alpha: 0.18 });
    for (const x of [380, 1500]) {
      g.rect(x - 14, v.y - 200, 28, 720).fill(TV.chrome).stroke({ width: LW, color: TV.line });
      g.ellipse(x, 560, 90, 22).fill(TV.chromeD).stroke({ width: LW, color: TV.line });
    }
    // the donuts that didn't make it, around him
    donut(g, 300, 860, 60, 7);
    donut(g, 1620, 820, 56, 8);
    this.cam.addChild(g);
    if (hip) {
      hip.anchor.set(0.5, 0.5);
      hip.scale.set(560 / hip.texture.height);
      hip.rotation = -Math.PI / 2 + 0.12;
      hip.position.set(W / 2 + 20, H / 2 + 120);
      this.cam.addChild(hip);
      // a donut on each paw and one on his head like a crown (the crown lands last)
      const pA = onSprite(hip, 190, 300);
      const pB = onSprite(hip, 410, 360);
      const hd = onSprite(hip, 360, 92);
      this.spots = [
        { ...pA, r: 64, at: 0 },
        { ...pB, r: 64, at: 0.2 },
        { ...hd, r: 78, at: 0.5 },
      ];
      this.head = onSprite(hip, 330, 200);
    } else {
      this.spots = [
        { x: W / 2 - 260, y: H / 2 + 40, r: 70, at: 0 },
        { x: W / 2 + 40, y: H / 2 - 120, r: 70, at: 0.2 },
        { x: W / 2 - 330, y: H / 2 + 210, r: 82, at: 0.5 },
      ];
    }
    this.cam.addChild(this.dyn);
    this.cam.pivot.set(W / 2, H / 2 + 60);
    this.cam.position.set(W / 2, H / 2 + 60);
    this.root.addChild(this.cam);
  }
  update(t: number) {
    const k = t - this.t0;
    const g = this.dyn;
    g.clear();
    // a slow push in
    this.cam.scale.set(this.gentle ? 1 : 1 + 0.07 * smooth(k / 2.6));
    for (const [i, s] of this.spots.entries()) {
      const q = this.gentle ? 1 : clamp((k - s.at) / 0.32, 0, 1);
      if (q <= 0) continue;
      const y = lerp(s.y - 520, s.y, out3(q));
      // the landing squash and a «plink» sparkle
      const land = q >= 1 ? Math.max(0, 1 - (k - s.at - 0.32) / 0.18) : 0;
      g.ellipse(s.x, s.y + s.r * 0.5, s.r * 0.9 * q, s.r * 0.18 * q).fill({ color: TV.line, alpha: 0.12 });
      donutFlip(g, s.x, y + land * 6, s.r * (1 + land * 0.12), 4 + i, 1 - land * 0.25);
      if (land > 0) star(g, s.x + s.r * 0.8, s.y - s.r * 0.6, 34 * land, TV.white);
    }
    // the snore bubble comes back: still asleep
    const b = clamp((k - 0.9) / 0.6, 0, 1);
    if (b > 0) {
      const r = (24 + 16 * (0.5 + 0.5 * Math.sin(k * 2.4))) * b;
      g.circle(this.head.x - 80, this.head.y - 40, r).fill({ color: 0xcff0ff, alpha: 0.6 }).stroke({ width: LW * 0.7, color: TV.line });
    }
  }
  destroy() {
    this.root.destroy({ children: true });
  }
}

/** R8–R10: Canelo staggers off his stool (L 0..0.5) and wobbles at the door (L 0.5..1) */
export function leaveWobble(L: number, t: number): { dx: number; rot: number; dy: number } {
  const a = clamp(L * 2, 0, 1);
  const b = clamp(L * 2 - 1, 0, 1);
  // getting down: he sways, tips, catches himself (a hiccup bounce), then slides away below the counter
  const sway = Math.sin(a * Math.PI) * (Math.sin(t * 8) * 0.12 + 0.1);
  const bob = Math.sin(a * Math.PI * 3) * 18 * (1 - a);
  // at the door: a zigzag and a lean on the frame
  return { dx: Math.sin(t * 5) * 26 * a * (1 - b) + Math.sin(t * 3.1) * 40 * b, rot: sway + Math.sin(t * 3.1) * 0.1 * b, dy: -bob };
}
