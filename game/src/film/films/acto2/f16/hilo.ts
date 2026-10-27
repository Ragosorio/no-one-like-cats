/**
 * F16 — the THREAD WORLD: the arena, the stands and the spectators drawn as ONE white line on indigo, and what the duel
 * does to it. Built once (the drawing is baked); what moves is small and live:
 *
 *   arenaDrawing   the stage in white thread (rings, steps, banners, the stands' gatera, the ship at the edge)
 *   ThreadFigure   a cat drawn in thread (the `hilo` treatment: a white contour) that can unravel (Cruceta in the stands)
 *   Cuts           every blow leaves a CUT in the drawing: a gap with two frayed ends that droop
 *   Fringe         the 16:9 frays from its edges: hanging threads that grow longer (screen space)
 *   Strings        taut strings across the frame that vibrate (the stop of c25)
 *   Collapse       the corte seco: the baked drawing sliced in strips that let go and fall like snow
 *   fishFire       Canelo's «Fuego de pescado» · threadSlash: Itō's cut (a glowing line)
 */
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import type { SceneCtx } from '../../../stage';
import { rnd, seg, sm } from '../kit';

export const IND = { bg: 0x0b1240, deep: 0x060a2a, line: 0xf2f0ff, glow: 0xbfd0ff, cyan: 0x4fe3e8, fire: 0xff8a2a, fireCore: 0xffe27a, grey: 0x8a8a92, blue: 0x58d0ff } as const;
/** the arena (design px of the wide shot) */
export const ARENA = { cx: 960, cy: 790, rx: 760, ry: 150, ito: 600, canelo: 1330, feet: 830 } as const;

/** a polyline stroke helper */
function poly(g: Graphics, pts: [number, number][], w = 3, color: number = IND.line, alpha = 1) {
  if (pts.length < 2) return;
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke({ width: w, color, alpha, cap: 'round', join: 'round' });
}
const ell = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 64, wob = 0, seed = 1): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    const w = wob ? (rnd(seed + i) - 0.5) * wob : 0;
    return [cx + Math.cos(a) * (rx + w), cy + Math.sin(a) * (ry + w * 0.3)] as [number, number];
  });

/** the stage drawn in thread: one continuous-looking line (built once; bake it static) */
export function arenaDrawing(ctx: SceneCtx, o: { stands?: boolean; ship?: boolean } = {}): Container {
  const c = new Container();
  const bg = new Graphics().rect(-1400, -900, 4720, 2880).fill(IND.bg);
  const cloth = ctx.tex('hl:indigo') as Texture | undefined;
  c.addChild(bg);
  if (cloth) {
    const s = new Sprite(cloth);
    s.position.set(-1400, -900);
    s.setSize(4720, 2880);
    s.alpha = 0.9;
    c.addChild(s);
  }
  const g = new Graphics();
  c.addChild(g);
  const A = ARENA;
  // the floor: three rings and the stones (one loop runs into the next: a single hand)
  poly(g, ell(A.cx, A.cy, A.rx, A.ry, 0, Math.PI * 2, 120, 6, 3), 4);
  poly(g, ell(A.cx, A.cy - 8, A.rx * 0.82, A.ry * 0.78, 0.2, Math.PI * 2 + 0.2, 110, 5, 9), 2.5, IND.line, 0.8);
  poly(g, ell(A.cx, A.cy + 40, A.rx * 1.04, A.ry * 1.05, Math.PI * 0.05, Math.PI * 0.95, 60, 4, 21), 3, IND.line, 0.7);
  for (let i = 0; i < 18; i++) {
    const a = Math.PI * (0.06 + (i / 17) * 0.88);
    const x = A.cx + Math.cos(a) * A.rx;
    const y = A.cy + Math.sin(a) * A.ry;
    poly(g, [[x, y], [x + (rnd(i) - 0.5) * 20, y + 46]], 2.5, IND.line, 0.8);
  }
  if (o.stands !== false) {
    // the stands: stepped arcs behind, with banners on poles
    for (let r = 0; r < 4; r++) poly(g, ell(A.cx, A.cy - 230 - r * 70, A.rx * (1.05 + r * 0.08), 120 + r * 30, Math.PI, Math.PI * 2, 90, 4, 40 + r), 2.5, IND.line, 0.85 - r * 0.12);
    for (let i = 0; i < 9; i++) {
      const x = A.cx - 820 + i * 205;
      const y = 300 - Math.sin((i / 8) * Math.PI) * 60;
      poly(g, [[x, y + 200], [x, y]], 2.5);
      poly(g, [[x, y], [x + 70, y + 14 + Math.sin(i) * 8], [x + 64, y + 30], [x, y + 44]], 2.5);
    }
    // the stands' gatera (where Esquirla limps away), upper right
    poly(g, ell(1640, 420, 70, 100, Math.PI, Math.PI * 2, 30), 3);
    poly(g, [[1570, 420], [1570, 520], [1710, 520], [1710, 420]], 3);
    // the arena's own gatera with its chain, far back centre
    poly(g, ell(960, 470, 80, 110, Math.PI, Math.PI * 2, 30), 3);
    for (let i = 0; i < 7; i++) poly(g, ell(890 + i * 24, 500, 12, 7, 0, Math.PI * 2, 10), 2, IND.glow);
  }
  if (o.ship !== false) {
    // our ship at the edge of the arena (left): hull, mast, a sail — in thread
    poly(g, [[60, 700], [380, 700], [340, 760], [100, 760], [60, 700]], 3);
    poly(g, [[200, 700], [200, 470]], 3);
    poly(g, [[200, 480], [320, 520], [320, 660], [200, 690]], 2.5);
  }
  return c;
}

/** a cat drawn in thread (the `hilo` treatment, a white contour) that can UNRAVEL: wipe 0..1 erases it bottom → top, leaving loose ends */
export class ThreadFigure extends Container {
  readonly sp: Sprite | null;
  private m = new Graphics();
  private ends = new Graphics();
  private h: number;
  constructor(ctx: SceneCtx, slug: string, h: number, extra?: (g: Graphics) => void) {
    super();
    this.h = h;
    const s = ctx.stillAs('hilo', slug, 0.5, 1);
    this.sp = s;
    if (s) {
      s.setSize((s.width / s.height) * h, h);
      s.tint = IND.line;
      this.addChild(s);
    }
    if (extra) {
      const g = new Graphics();
      extra(g);
      this.addChild(g);
    }
    this.addChild(this.m, this.ends);
    this.mask = this.m;
    this.setWipe(0, 0);
  }
  /** w = 0 drawn … 1 gone: it unravels from the head down, loose threads hanging from the edge */
  setWipe(w: number, lt: number) {
    const top = -this.h * 1.25;
    const ye = top + w * (this.h * 1.25 + 10);
    this.m.clear().rect(-this.h, ye, this.h * 2, -ye + 12).fill(0xffffff);
    const e = this.ends.clear();
    if (w > 0.01 && w < 0.99) {
      for (let i = 0; i < 7; i++) {
        const x = -this.h * 0.32 + i * this.h * 0.1;
        e.moveTo(x, ye).quadraticCurveTo(x + Math.sin(lt * 3 + i) * 8, ye + 20, x + Math.sin(lt * 2 + i) * 12, ye + 34 + rnd(i) * 30);
      }
      e.stroke({ width: 2, color: IND.line, alpha: 0.85 });
    }
    this.alpha = 1 - sm(seg(w, 0.9, 1));
  }
}

/** cuts in the drawing: each one a gap with two frayed ends that droop with time since the cut */
export interface Cut {
  t: number;
  x: number;
  y: number;
  ang: number;
}
export class Cuts extends Container {
  /** the cuts that have settled (redrawn only when one more settles) and the ones still opening / drooping */
  private settled = new Graphics();
  private active = new Graphics();
  private nSettled = -1;
  constructor(private list: Cut[]) {
    super();
    this.addChild(this.settled, this.active);
  }
  private one(g: Graphics, c: Cut, age: number, lt: number, rm: boolean, live: boolean) {
    const open = Math.min(1, age / 0.12);
    const droop = Math.min(1, age / 2.5);
    const ca = Math.cos(c.ang);
    const sa = Math.sin(c.ang);
    g.circle(c.x, c.y, 10 * open).fill(IND.bg);
    for (const d of [-1, 1]) {
      const ex = c.x + ca * 10 * d * open;
      const ey = c.y + sa * 10 * d * open;
      for (let i = 0; i < 3; i++) {
        const L = 18 + i * 6;
        const fall = droop * (20 + i * 8);
        const sway = rm || !live ? 0 : Math.sin(lt * 2 + i + c.x) * 3;
        g.moveTo(ex, ey).quadraticCurveTo(ex + ca * d * L * 0.5 + sway, ey + sa * d * L * 0.5 + fall * 0.4, ex + ca * d * L * 0.4 + (i - 1) * 4 + sway, ey + fall + 6);
      }
      g.stroke({ width: 1.8, color: IND.line, alpha: 0.85 });
    }
    if (age < 0.25) g.circle(c.x, c.y, 26 * (1 - age / 0.25)).fill({ color: IND.glow, alpha: 0.6 * (1 - age / 0.25) });
  }
  draw(lt: number, rm: boolean) {
    let n = 0;
    for (const c of this.list) if (lt - c.t >= 2.5) n++;
    if (n !== this.nSettled) {
      this.nSettled = n;
      const g = this.settled.clear();
      for (const c of this.list) if (lt - c.t >= 2.5) this.one(g, c, 2.5, lt, rm, false);
    }
    const a = this.active.clear();
    for (const c of this.list) {
      const age = lt - c.t;
      if (age < 0 || age >= 2.5) continue;
      this.one(a, c, age, lt, rm, true);
    }
  }
}
/** the frame frays from its edges: hanging threads (screen space), longer as `k` grows */
export class Fringe extends Graphics {
  private key = '';
  draw(view: { x: number; y: number; w: number; h: number }, k: number, lt: number, rm: boolean) {
    // hand-drawn rhythm: redrawn 12 times a second (and only when it changes)
    const key = `${Math.round(k * 200)},${rm ? 0 : Math.floor(lt * 12)},${view.x},${view.w}`;
    if (key === this.key) return;
    this.key = key;
    this.clear();
    if (k <= 0.01) return;
    const n = 90;
    for (let i = 0; i < n; i++) {
      const side = i % 4;
      const u = rnd(i * 7 + 1);
      const L = (20 + rnd(i * 3) * 120) * k;
      const sw = rm ? 0 : Math.sin(lt * 1.7 + i) * 6 * k;
      let x0: number;
      let y0: number;
      let x1: number;
      let y1: number;
      if (side === 0) [x0, y0, x1, y1] = [view.x + u * view.w, view.y, view.x + u * view.w + sw, view.y + L];
      else if (side === 1) [x0, y0, x1, y1] = [view.x + u * view.w, view.y + view.h, view.x + u * view.w + sw, view.y + view.h - L * 0.6];
      else if (side === 2) [x0, y0, x1, y1] = [view.x, view.y + u * view.h, view.x + L, view.y + u * view.h + sw + L * 0.3];
      else [x0, y0, x1, y1] = [view.x + view.w, view.y + u * view.h, view.x + view.w - L, view.y + u * view.h + sw + L * 0.3];
      this.moveTo(x0, y0).quadraticCurveTo((x0 + x1) / 2 + sw, (y0 + y1) / 2, x1, y1);
    }
    this.stroke({ width: 1.6, color: IND.line, alpha: 0.7 });
    // the edge itself goes dark (the cloth unravelled)
    const e = 26 * k;
    this.rect(view.x, view.y, view.w, e).fill({ color: IND.deep, alpha: 0.85 }).rect(view.x, view.y + view.h - e, view.w, e).fill({ color: IND.deep, alpha: 0.85 });
    this.rect(view.x, view.y, e, view.h).fill({ color: IND.deep, alpha: 0.85 }).rect(view.x + view.w - e, view.y, e, view.h).fill({ color: IND.deep, alpha: 0.85 });
  }
}
/** taut strings across the frame that vibrate (amplitude 0..1) */
export function strings(g: Graphics, lt: number, amp: number, rm: boolean, n = 7) {
  for (let i = 0; i < n; i++) {
    const y0 = 160 + i * 120 + rnd(i) * 40;
    const y1 = y0 + (rnd(i + 9) - 0.5) * 300;
    const a = rm ? 0 : amp * 6 * Math.sin(lt * 70 + i * 2);
    g.moveTo(-200, y0).quadraticCurveTo(960, (y0 + y1) / 2 + a, 2120, y1).stroke({ width: 1.5, color: IND.line, alpha: 0.35 + amp * 0.3 });
  }
}
/** the collapse: the baked drawing sliced into strips that let go and fall */
export class Collapse extends Container {
  private strips: { s: Sprite; x: number; y: number; r: number; d: number }[] = [];
  constructor(tex: Texture, x0: number, y0: number, n = 26) {
    super();
    const W = tex.width;
    const H = tex.height;
    for (let i = 0; i < n; i++) {
      const fx = (i % 13) / 13;
      const fy = Math.floor(i / 13) / 2;
      const t = new Texture({ source: tex.source, frame: new Rectangle(fx * W, fy * H, W / 13, H / 2) });
      const s = new Sprite(t);
      s.position.set(x0 + fx * W, y0 + fy * H);
      this.addChild(s);
      this.strips.push({ s, x: x0 + fx * W, y: y0 + fy * H, r: (rnd(i) - 0.5) * 1.2, d: 0.2 + rnd(i + 5) * 0.9 });
    }
  }
  /** p = seconds since the let-go */
  update(p: number, rm: boolean) {
    this.visible = true;
    for (const st of this.strips) {
      const t = Math.max(0, p - st.d * 0.25);
      const fall = rm ? 0 : t * t * 120 + t * 40;
      st.s.position.set(st.x + Math.sin(t * 2 + st.r * 5) * 30 * Math.min(1, t), st.y + fall);
      st.s.rotation = rm ? 0 : st.r * Math.min(1, t * 0.8);
      st.s.alpha = rm ? Math.max(0, 1 - p / 2.5) : Math.max(0, 1 - t / 3);
    }
  }
}

/** Canelo's «Fuego de pescado» (a fish-shaped fireball heading `dir`), on twos */
export function fishFire(g: Graphics, x: number, y: number, s: number, dir: number, lt: number, rm: boolean, half: 0 | 1 | 2 = 0, sep = 0) {
  const st = rm ? 0 : Math.floor(lt * 12);
  const body = (dy: number, top: boolean) => {
    const ox = x;
    const oy = y + dy;
    // flames trailing
    for (let i = 0; i < 4; i++) {
      const fx = ox - dir * (60 + i * 26) * s;
      const fy = oy + (rnd(st + i) - 0.5) * 30 * s;
      g.circle(fx, fy, (26 - i * 5) * s).fill({ color: i % 2 ? IND.fire : IND.fireCore, alpha: 0.8 - i * 0.15 });
    }
    const pts: number[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (top && Math.sin(a) > 0.05) continue;
      if (!top && half && Math.sin(a) < -0.05) continue;
      pts.push(ox + Math.cos(a) * 62 * s * dir, oy + Math.sin(a) * 30 * s);
    }
    g.poly(pts).fill(IND.fire).stroke({ width: 4, color: 0x2a0a00 });
    g.poly([ox - dir * 50 * s, oy, ox - dir * 92 * s, oy - 28 * s, ox - dir * 92 * s, oy + 28 * s]).fill(IND.fire).stroke({ width: 4, color: 0x2a0a00 });
    g.circle(ox + dir * 34 * s, oy - 6 * s, 6 * s).fill(0x2a0a00);
  };
  if (!half) body(0, false);
  else {
    body(-sep, true);
    body(sep, false);
  }
}
/** Itō's cut: a glowing thread across from a to b (p = how far it has run) */
export function threadSlash(g: Graphics, a: [number, number], b: [number, number], p: number, color: number = IND.line, w = 3) {
  if (p <= 0) return;
  const x = a[0] + (b[0] - a[0]) * Math.min(1, p);
  const y = a[1] + (b[1] - a[1]) * Math.min(1, p);
  g.moveTo(a[0], a[1]).lineTo(x, y).stroke({ width: w * 4, color: IND.glow, alpha: 0.25 }).moveTo(a[0], a[1]).lineTo(x, y).stroke({ width: w, color, alpha: 1 });
}
