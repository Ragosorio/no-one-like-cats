/**
 * LA ÚLTIMA RONDA — the INSERTS of the bar's polish pass (docs/part-iii/13 §3.2, §3.4): full-screen shots drawn in code
 * over the bar (CajaScene.screenL), cut in between the medium shots like a TV cartoon cuts to a detail:
 *
 *   CrossingInsert  the cross through the cat flap: the flap's warm light fills the screen and the world repaints
 *                   itself in FLAT TV BANDS that slide away one by one (preparation → development → exit).
 *   FoamInsert      A: the foam of his mug from above. His claw draws a little door; it opens on another box (your
 *                   island at night, its lighthouse beam turning) for half a second, and shuts with a puff.
 *   FrontInsert     A5: «¿No sabes quién soy?» — for half a second the bar is a front page of the Diario del Mar with
 *                   his face (a taste of the Momento), then it's the bar again.
 *   CounterInsert   B: the counter seen from above = THE DIAGRAM of what he tells. The napkin («esa hoja») in the
 *                   middle; the sugar cube, the ketchup and the lamp's hands of light around it (each one invades the
 *                   counter in its style and goes back); the fry-Capi with its quill; Espuma's pencil that can't write
 *                   under a sleeping cat.
 *
 * Everything is built ONCE (at the bar set's build); per frame only transforms and a few Graphics are redrawn. Texts
 * are made here, never mid-performance. The listener rule does not apply to inserts (they show only Canelo's things).
 */
import { Container, Graphics, Ticker, type Sprite, type Text } from 'pixi.js';
import { W, H } from '../../core/App';
import { LW, TV, donut } from '../../momentos/songs/drunck/tv';
import { tvText } from '../../momentos/songs/drunck/bar';
import { FLAP_LIGHT, drawFlapLight } from './barLuz';
import { CALICO, FUR, arm, fryCapi, ketchup, lightHand, mix, napkin, paw, pencil, quill, star, sugarCube, zzz } from './barKit';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const out3 = (k: number) => 1 - (1 - clamp(k, 0, 1)) ** 3;
const in2 = (k: number) => clamp(k, 0, 1) ** 2;
/** 0→1→0 over [a, b]: up in the first `r` part, down in the last `r` part */
const bump = (t: number, a: number, b: number, r = 0.3) => {
  if (t <= a || t >= b) return 0;
  const k = (t - a) / (b - a);
  return Math.min(1, k / r, (1 - k) / r);
};
/** a big rect that covers any screen shape (the view can be wider than the 1920×1080 box) */
const BIG = { x: -2200, y: -1600, w: W + 4400, h: H + 3200 };

/** what every insert offers the director */
export interface Insert {
  readonly root: Container;
  update(t: number): void;
  destroy(): void;
}

// ================================================================== the crossing
export { FLAP_LIGHT };
/**
 * the cross: we are INSIDE the flap's light — a tunnel of warm rings flying past, rays turning, Canelo's orange hair
 * drifting ahead of us, the flap's arch at the edges — for as long as the bar takes to be ready; then `wipe()`: N flat
 * bands of TV color slide away and reveal the alley. It ticks by itself (the scene doesn't update before it's ready).
 */
export class CrossingInsert implements Insert {
  readonly root = new Container();
  /** the living light (barLuz.ts), masked by the bands that are still there while they wipe away */
  private light = new Graphics();
  private strips = new Graphics();
  private edges = new Graphics();
  private born = performance.now();
  private wipeAt: number | null = null;
  done = false;
  constructor(private readonly gentle: boolean) {
    this.root.addChild(this.light, this.strips, this.edges);
    this.update();
    Ticker.shared.add(this.tick, this);
  }
  static readonly BANDS = 9;
  static readonly DUR = 0.06 * 8 + 0.55;
  get wiping() {
    return this.wipeAt !== null;
  }
  /** the bands start now */
  wipe() {
    if (this.wipeAt === null) this.wipeAt = performance.now();
  }
  private tick() {
    if (this.root.destroyed) return;
    this.update();
  }
  update() {
    const now = performance.now();
    const t = (now - this.born) / 1000;
    const k0 = this.wipeAt === null ? -1 : (now - this.wipeAt) / 1000;
    this.light.clear();
    drawFlapLight(this.light, t, this.gentle);
    this.edges.clear();
    if (k0 < 0) {
      this.light.mask = null;
      return;
    }
    if (this.gentle) {
      // reduce motion: one soft fade of the light
      const a = 1 - clamp(k0 / 0.7, 0, 1);
      this.root.alpha = a;
      if (a <= 0.001) this.finish();
      return;
    }
    // the light stays alive inside the bands that remain; each band slides off led by a flat TV color
    const m = this.strips;
    m.clear();
    const g = this.edges;
    const n = CrossingInsert.BANDS;
    const bh = H / n;
    const cols = [TV.pink, TV.green, TV.nightL, TV.amber, TV.neonBlue, TV.pinkD, TV.greenL, TV.amberD, TV.pink];
    let alive = false;
    for (let i = 0; i < n; i++) {
      const s = clamp((k0 - i * 0.06) / 0.55, 0, 1);
      if (s >= 1) continue;
      alive = true;
      const dir = i % 2 ? 1 : -1;
      const off = s * s * (3 - 2 * s) * (W + 2600) * dir;
      // the strips at the top and the bottom also cover the screen's extra height
      const y0 = i === 0 ? BIG.y : i * bh;
      const y1 = i === n - 1 ? BIG.y + BIG.h : (i + 1) * bh;
      const x0 = BIG.x + off;
      m.rect(x0, y0, BIG.w, y1 - y0).fill(0xffffff);
      // the paint roller's edge: a flat TV color band with the uniform line, leading the wipe
      const ex = dir > 0 ? x0 : x0 + BIG.w;
      const ew = 90;
      const bx = dir > 0 ? ex - ew : ex;
      if (s > 0) {
        g.rect(bx, y0, ew, y1 - y0).fill(cols[i % cols.length]);
        g.moveTo(bx, y0).lineTo(bx, y1).stroke({ width: LW, color: TV.line });
        g.moveTo(bx + ew, y0).lineTo(bx + ew, y1).stroke({ width: LW, color: TV.line });
        g.rect(bx + ew * 0.3, y0, 8, y1 - y0).fill({ color: TV.cream, alpha: 0.7 });
      }
      if (i > 0) g.moveTo(x0, y0).lineTo(x0 + BIG.w, y0).stroke({ width: 3, color: mix(FLAP_LIGHT, TV.amberD, 0.5) });
    }
    this.light.mask = m;
    if (!alive) this.finish();
  }
  private finish() {
    this.done = true;
    this.root.visible = false;
    Ticker.shared.remove(this.tick, this);
  }
  destroy() {
    Ticker.shared.remove(this.tick, this);
    this.root.destroy({ children: true });
  }
}

// ================================================================== A · the foam door
/** the door on the foam (screen): an arch, its hinge at the top (it flips up like a trapdoor) */
const DOOR = { x: 960, y: 540, w: 330, h: 420 };
function doorPath(k = 1): number[] {
  // left side up, the arch, right side down, the bottom — sampled, then cut at `k` of its length
  const { x, y, w, h } = DOOR;
  const pts: number[] = [];
  const L = x - w / 2;
  const R = x + w / 2;
  const top = y - h / 2 + w / 2;
  const bot = y + h / 2;
  for (let i = 0; i <= 6; i++) pts.push(L, bot - (bot - top) * (i / 6));
  for (let i = 1; i <= 14; i++) {
    const a = Math.PI + (Math.PI * i) / 14;
    pts.push(x + Math.cos(a) * (w / 2), top + Math.sin(a) * (w / 2));
  }
  for (let i = 1; i <= 6; i++) pts.push(R, top + (bot - top) * (i / 6));
  for (let i = 1; i <= 5; i++) pts.push(R - w * (i / 5), bot);
  const n = Math.max(2, Math.round((pts.length / 2) * clamp(k, 0, 1)));
  return pts.slice(0, n * 2);
}
export class FoamInsert implements Insert {
  readonly root = new Container();
  private bg = new Graphics();
  private dyn = new Graphics();
  private box = new Container();
  private boxBg = new Graphics();
  private beam = new Graphics();
  private boxMask = new Graphics();
  private flap = new Graphics();
  private clac: Text;
  /** the claw draws the door (start time) · the door opens on another box · it shuts */
  drawT: number | null = null;
  openT: number | null = null;
  constructor(private readonly gentle: boolean) {
    this.root.addChild(this.bg, this.box, this.flap, this.dyn);
    this.drawBg();
    this.drawBox();
    this.box.mask = this.boxMask;
    this.root.addChild(this.boxMask);
    this.box.visible = false;
    this.clac = tvText('¡CLAC!', 70, TV.cream, { strokeW: 9 });
    this.clac.position.set(DOOR.x + 250, DOOR.y - 230);
    this.clac.rotation = 0.12;
    this.clac.alpha = 0;
    this.root.addChild(this.clac);
  }
  private drawBg() {
    const g = this.bg;
    // the counter far below, dark; the warm lamp from above
    g.rect(BIG.x, BIG.y, BIG.w, BIG.h).fill(TV.woodD);
    g.ellipse(W / 2, H / 2, 1300, 760).fill({ color: TV.amberL, alpha: 0.12 });
    // the glass rim (seen from above, a little tilted) and the beer showing at the edge
    g.ellipse(W / 2, H / 2 + 20, 760, 470).fill({ color: TV.white, alpha: 0.25 }).stroke({ width: LW * 2, color: TV.line });
    g.ellipse(W / 2, H / 2 + 20, 720, 440).fill(TV.amber);
    g.ellipse(W / 2, H / 2 + 6, 690, 410).fill(TV.amberL);
    // the foam: a cream field with a bumpy rim of bubbles
    g.ellipse(W / 2, H / 2, 660, 385).fill(TV.foam);
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2;
      const r = 34 + ((i * 37) % 5) * 7;
      g.circle(W / 2 + Math.cos(a) * 640, H / 2 + Math.sin(a) * 370, r).fill(TV.foam).stroke({ width: LW * 0.6, color: TV.foamD });
    }
    g.ellipse(W / 2, H / 2, 600, 345).fill(TV.foam);
    for (let i = 0; i < 70; i++) {
      const x = W / 2 + Math.sin(i * 12.9898) * 520;
      const y = H / 2 + Math.cos(i * 78.233) * 290;
      g.circle(x, y, 5 + (i % 4) * 4).stroke({ width: 3, color: TV.foamD, alpha: 0.8 });
    }
    // the handle at the side and the rim's highlight
    g.roundRect(W / 2 + 700, H / 2 - 60, 240, 160, 70).stroke({ width: LW * 3, color: TV.line });
    g.roundRect(W / 2 + 700, H / 2 - 60, 240, 160, 70).stroke({ width: LW * 1.4, color: TV.chrome });
    g.arc(W / 2, H / 2 + 20, 740, Math.PI * 1.1, Math.PI * 1.45).stroke({ width: 16, color: TV.white, alpha: 0.6, cap: 'round' });
  }
  /** another box, through the door: your island at night, its lighthouse sweeping the dark (a TV-flat side view) */
  private drawBox() {
    const g = this.boxBg;
    const { x, y } = DOOR;
    const L = x - 220;
    g.rect(L, y - 260, 440, 520).fill(0x14205a);
    g.rect(L, y - 260, 440, 120).fill(0x0c1440);
    for (let i = 0; i < 16; i++) g.circle(L + 20 + ((i * 97) % 400), y - 240 + ((i * 53) % 220), 2 + (i % 3)).fill({ color: TV.cream, alpha: 0.85 });
    g.circle(x - 110, y - 150, 34).fill(TV.cream).stroke({ width: 4, color: TV.line });
    // the sea, flat bands with a few wave strokes
    g.rect(L, y + 80, 440, 200).fill(0x1d3a7a);
    for (let i = 0; i < 6; i++) g.moveTo(L + 10 + ((i * 131) % 380), y + 110 + (i % 3) * 40).quadraticCurveTo(L + 40 + ((i * 131) % 380), y + 98 + (i % 3) * 40, L + 70 + ((i * 131) % 380), y + 110 + (i % 3) * 40).stroke({ width: 4, color: 0x5d86d8 });
    // the island and the page by the lighthouse
    g.ellipse(x + 10, y + 96, 150, 38).fill(0xf0d9a0).stroke({ width: 4, color: TV.line });
    g.ellipse(x - 40, y + 76, 70, 20).fill(0x5fb36a).stroke({ width: 3, color: TV.line });
    g.poly([x - 92, y + 84, x - 52, y + 80, x - 50, y + 92, x - 90, y + 96]).fill(TV.white).stroke({ width: 3, color: TV.line });
    // the lighthouse: a white tower with red bands, its lamp lit
    g.poly([x + 30, y + 90, x + 46, y - 90, x + 94, y - 90, x + 110, y + 90]).fill(TV.white).stroke({ width: 4, color: TV.line });
    for (const yy of [y + 40, y - 30]) g.poly([x + 36, yy, x + 104, yy, x + 102, yy - 26, x + 38, yy - 26]).fill(0xe0443a);
    g.rect(x + 44, y - 130, 52, 40).fill(0xfff2a8).stroke({ width: 4, color: TV.line });
    g.poly([x + 38, y - 130, x + 70, y - 162, x + 102, y - 130]).fill(0xe0443a).stroke({ width: 4, color: TV.line });
    this.box.addChild(g, this.beam);
    this.boxMask.poly(doorPath(1)).fill(0xffffff);
  }
  update(t: number) {
    const g = this.dyn;
    g.clear();
    this.flap.clear();
    // ---- the claw draws the door (1.1 s), the paw leaves
    let drawn = 0;
    if (this.drawT !== null) {
      const k = (t - this.drawT) / 1.1;
      drawn = out3(k);
      const pts = doorPath(drawn);
      if (pts.length >= 4) {
        g.poly(pts, false).stroke({ width: 16, color: TV.foamD, cap: 'round', join: 'round' });
        g.poly(pts, false).stroke({ width: 6, color: TV.amberD, cap: 'round', join: 'round' });
      }
      // a tiny knob, once drawn
      if (drawn > 0.98) g.circle(DOOR.x + DOOR.w * 0.32, DOOR.y + 40, 10).fill(TV.amberD);
      // his paw with ONE claw out, the claw tip on the line's end
      const vis = k < 1.25;
      if (vis && pts.length >= 2) {
        const tx = pts[pts.length - 2];
        const ty = pts[pts.length - 1];
        const lift = clamp((k - 1) / 0.25, 0, 1);
        const px = tx - 70 - lift * 200;
        const py = ty - 90 - lift * 420;
        arm(g, px - 520, py - 700, px, py, 92);
        paw(g, px, py, 64, 0.9, { claws: 0 });
        // the single claw that draws
        g.poly([px + 30, py + 36, tx, ty, px + 52, py + 18]).fill(TV.white).stroke({ width: 4, color: TV.line, join: 'round' });
      }
    }
    // ---- the door opens (a trapdoor flipping up) on another box, ~0.6 s; then it shuts with a puff
    this.box.visible = false;
    this.clac.alpha = 0;
    if (this.openT !== null) {
      const k = t - this.openT;
      const open = this.gentle ? bump(k, 0, 1.1, 0.25) : k < 0.16 ? out3(k / 0.16) : k < 0.78 ? 1 : 1 - in2((k - 0.78) / 0.14);
      // the box below: its beam turns
      if (open > 0.02) {
        this.box.visible = true;
        this.box.alpha = this.gentle ? open : 1;
        const b = this.beam;
        b.clear();
        // the beam sweeps across the night (side view: it swings and narrows as it turns away)
        const sw = Math.sin(k * 6);
        const cx = DOOR.x + 70;
        const cy = DOOR.y - 110;
        const reach = 420 * sw;
        const spread = 46 + 30 * Math.abs(sw);
        b.poly([cx, cy - 8, cx + reach, cy - spread, cx + reach, cy + spread, cx, cy + 8]).fill({ color: 0xfff2a8, alpha: 0.55 });
        b.circle(cx, cy, 16).fill(0xfff2a8);
        // rays of light out of the hole (the light of the other box)
        for (let i = 0; i < 10; i++) {
          const ra = (i / 10) * Math.PI * 2 + k * 2;
          g.moveTo(DOOR.x + Math.cos(ra) * 170, DOOR.y + Math.sin(ra) * 190).lineTo(DOOR.x + Math.cos(ra) * (230 + 60 * open), DOOR.y + Math.sin(ra) * (250 + 60 * open)).stroke({ width: 8, color: 0xfff2a8, alpha: 0.6 * open, cap: 'round' });
        }
      }
      // the flap itself: the door shape squashed toward its top hinge (seen flipping up)
      // it flips up toward us: past the hinge only a thin strip of its underside shows
      const sy = this.gentle ? 1 - open : 1 - 1.28 * open;
      if (Math.abs(sy) > 0.02 && k < 1.6) {
        const top = DOOR.y - DOOR.h / 2;
        const pts = doorPath(1).map((v, i) => (i % 2 ? top + (v - top) * sy : v));
        this.flap.poly(pts).fill(sy > 0 ? TV.foam : TV.foamD).stroke({ width: 6, color: TV.amberD, join: 'round' });
      }
      // the puff and the «¡CLAC!» when it shuts
      const shut = k - 0.92;
      if (shut > 0 && shut < 0.7) {
        const q = shut / 0.7;
        for (let i = 0; i < 9; i++) {
          const pa = (i / 9) * Math.PI * 2;
          g.circle(DOOR.x + Math.cos(pa) * (120 + q * 160), DOOR.y + Math.sin(pa) * (140 + q * 140), 30 * (1 - q) + 6).fill({ color: TV.foam, alpha: 1 - q }).stroke({ width: 3, color: TV.foamD, alpha: 1 - q });
        }
        this.clac.alpha = 1 - q;
        this.clac.scale.set(0.8 + 0.4 * out3(q * 3));
      }
      // after: the outline heals into the foam
      if (k > 1.2) this.dyn.alpha = 1;
    }
  }
  /** how far the door's outline still shows (it heals into the foam after it shut) */
  healed(t: number) {
    return this.openT === null ? 0 : clamp((t - this.openT - 1.2) / 0.8, 0, 1);
  }
  destroy() {
    this.root.destroy({ children: true });
  }
}

// ================================================================== A5 · the front page
export class FrontInsert implements Insert {
  readonly root = new Container();
  private page = new Container();
  t0: number | null = null;
  static readonly DUR = 0.55;
  constructor(face: Sprite | null, private readonly gentle: boolean) {
    const PAPER = 0xf2e2bf;
    const INK = 0x3a2a1c;
    const bg = new Graphics().rect(BIG.x, BIG.y, BIG.w, BIG.h).fill(0xd8c49a);
    this.root.addChild(bg, this.page);
    const p = this.page;
    const g = new Graphics();
    g.rect(-760, -500, 1520, 1000).fill(PAPER).stroke({ width: 8, color: INK });
    g.rect(-720, -330, 1440, 6).fill(INK).rect(-720, -318, 1440, 2).fill(INK);
    // columns of text (lines) and the photo frame
    for (let c = 0; c < 2; c++) for (let i = 0; i < 14; i++) g.rect(260 + c * 240, -150 + i * 40, 200 - ((i * 37) % 5) * 18, 10).fill({ color: INK, alpha: 0.55 });
    g.rect(-700, -150, 900, 600).fill(0xc9b48c).stroke({ width: 6, color: INK });
    p.addChild(g);
    if (face) {
      face.anchor.set(0.5, 0.5);
      face.tint = 0xd9b98a;
      const sc = 640 / Math.max(1, face.texture.height);
      face.scale.set(-sc, sc);
      face.position.set(-250, 160);
      p.addChild(face);
    }
    // halftone dots over the photo (the newspaper print)
    const dots = new Graphics();
    for (let y = -140; y < 440; y += 26) for (let x = -690; x < 190; x += 26) dots.circle(x + ((y / 26) % 2) * 13, y, 3.2).fill({ color: INK, alpha: 0.2 });
    p.addChild(dots);
    const mast = tvText('DIARIO DEL MAR', 120, INK, { font: 'Anton', stroke: PAPER, strokeW: 2, spacing: 10 });
    mast.position.set(0, -420);
    const kick = tvText('¡EXTRA!', 56, 0xc0302a, { font: 'Anton', stroke: PAPER, strokeW: 2, spacing: 6 });
    kick.position.set(-560, -260);
    const head = tvText('¡ES CANELO!', 132, INK, { font: 'Anton', stroke: PAPER, strokeW: 2, spacing: 4 });
    head.position.set(130, -250);
    const cap = tvText('El gato que todos esperan', 34, INK, { font: 'Anton', stroke: PAPER, strokeW: 1, spacing: 2 });
    cap.position.set(-250, 490);
    p.addChild(mast, kick, head, cap);
    p.position.set(W / 2, H / 2);
    this.root.visible = false;
  }
  update(t: number) {
    if (this.t0 === null) return void (this.root.visible = false);
    const k = t - this.t0;
    const D = FrontInsert.DUR;
    if (k < 0 || k > D) return void (this.root.visible = false);
    this.root.visible = true;
    if (this.gentle) {
      // reduce motion / flashes: a soft dissolve in and out
      this.root.alpha = bump(k, 0, D, 0.3);
      this.page.rotation = 0;
      this.page.scale.set(1);
      return;
    }
    this.root.alpha = 1;
    // it SLAMS in (a spin that lands), sits, and it's gone (a TV cut back)
    const a = out3(k / 0.14);
    this.page.rotation = (1 - a) * -0.5 + 0.02;
    this.page.scale.set(1.5 - 0.5 * a);
  }
  destroy() {
    this.root.destroy({ children: true });
  }
}

// ================================================================== B · the counter from above (the diagram)
/** napkin corners on the screen (a trapezoid: the far edge is narrower) */
const NAP = [770, 300, 1150, 300, 1200, 640, 720, 640];
export const NAP_C = { x: 960, y: 470 };
/** what the director tells the counter insert each frame (times are scene seconds, null = not yet) */
export interface CounterState {
  t: number;
  /** his paw resting on the napkin (0..1), patting it flat at `patT` */
  pawOn: number;
  patT: number | null;
  cubeT: number | null;
  whiteT: number | null;
  ketchupT: number | null;
  redT: number | null;
  handsT: number | null;
  /** the Capi (the fry): when it hops in, its variant and when it starts writing */
  capiT: number | null;
  capi: 'perfecto' | 'romper' | 'nada' | 'none';
  writeT: number | null;
  /** he lies on it (fur over the napkin, breathing) · Espuma's pencil gag */
  asleep: number;
  pencilT: number | null;
  /** scene-level: reduce motion / flashes */
  gentle: boolean;
}
export class CounterInsert implements Insert {
  readonly root = new Container();
  private bg = new Graphics();
  private white = new Container();
  private whiteMask = new Graphics();
  private napG = new Graphics();
  private red = new Container();
  private dyn = new Graphics();
  private fur = new Graphics();
  private top = new Graphics();
  private tPerfecto: Text;
  private tRompan: Text;
  private mPerfecto = new Graphics();
  private mRompan = new Graphics();
  private tPlic: Text;
  private tTag: Text;
  constructor() {
    this.drawBg();
    // the Correctores' white: a perfect white field with a ruled grid (masked by a growing circle)
    const wg = new Graphics().rect(BIG.x, BIG.y, BIG.w, BIG.h).fill(0xfbfdff);
    for (let x = -1200; x < 3200; x += 80) wg.moveTo(x, BIG.y).lineTo(x, BIG.y + BIG.h).stroke({ width: 2, color: 0xd6deef });
    for (let y = -1200; y < 2400; y += 80) wg.moveTo(BIG.x, y).lineTo(BIG.x + BIG.w, y).stroke({ width: 2, color: 0xd6deef });
    this.white.addChild(wg);
    this.white.mask = this.whiteMask;
    // the graffiti (drawn once at full size; it grows out of the bottle and shrinks back into it)
    const rg = new Graphics();
    const splat = (x: number, y: number, r: number) => {
      rg.circle(x, y, r).fill(0xd8262c);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + r;
        rg.circle(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15, r * (0.18 + ((i * 7) % 4) * 0.08)).fill(0xd8262c);
      }
    };
    splat(-260, -60, 70);
    splat(-560, 120, 50);
    splat(-120, 200, 40);
    splat(-760, -180, 36);
    for (let i = 0; i < 9; i++) rg.roundRect(-820 + i * 95, -40 + ((i * 53) % 90), 16, 120 + ((i * 41) % 160), 8).fill(0xd8262c);
    // cracks (the box breaks)
    rg.poly([-900, -220, -700, -120, -760, -40, -520, 40, -580, 140, -300, 260], false).stroke({ width: 8, color: TV.line, join: 'miter' });
    rg.poly([-100, -300, -260, -200, -180, -120, -380, -20], false).stroke({ width: 7, color: TV.line, join: 'miter' });
    this.red.addChild(rg);
    this.tTag = tvText('¡ROMPAN!', 120, TV.neonBlue, { font: 'Permanent Marker', strokeW: 10 });
    this.tTag.position.set(-480, -160);
    this.tTag.rotation = -0.18;
    this.red.addChild(this.tTag);
    this.red.position.set(1380, 560);
    // the Capi's words (handwriting), revealed by a growing mask
    // two lines each, so the words fit on the napkin (the fry stands at its lower left corner)
    this.tPerfecto = tvText('un mundo\nperfecto', 64, TV.line, { font: 'Permanent Marker', stroke: TV.white, strokeW: 2, spacing: 1 });
    this.tRompan = tvText('rompan\ntodo', 72, TV.line, { font: 'Permanent Marker', stroke: TV.white, strokeW: 2, spacing: 1 });
    for (const t of [this.tPerfecto, this.tRompan]) {
      t.position.set(NAP_C.x + 40, NAP_C.y - 20);
      t.rotation = -0.04;
    }
    this.tPerfecto.mask = this.mPerfecto;
    this.tRompan.mask = this.mRompan;
    this.tPlic = tvText('¡PLIC!', 64, TV.cream, { strokeW: 8 });
    this.tPlic.alpha = 0;
    this.drawNapkin();
    this.root.addChild(this.bg, this.white, this.whiteMask, this.napG, this.tPerfecto, this.tRompan, this.mPerfecto, this.mRompan, this.red, this.dyn, this.fur, this.top, this.tPlic);
    this.root.visible = false;
  }
  private drawBg() {
    const g = this.bg;
    g.rect(BIG.x, BIG.y, BIG.w, BIG.h).fill(TV.woodL);
    // the grain: long strokes that converge far above (a high angle on the counter)
    const vp = { x: W / 2, y: -1400 };
    for (let i = -14; i <= 14; i++) {
      const bx = W / 2 + i * 190;
      g.moveTo(vp.x + (bx - vp.x) * 0.62, 90).lineTo(bx, H + 300).stroke({ width: 4, color: TV.wood, alpha: 0.75 });
    }
    for (let i = 0; i < 16; i++) {
      const x = ((i * 271) % 1700) + 100;
      const y = 160 + ((i * 137) % 760);
      g.moveTo(x, y).lineTo(x + 40 + ((i * 53) % 120), y + 6).stroke({ width: 3, color: TV.wood });
    }
    // the far edge (his side: dark beyond) and the near edge (ours)
    g.rect(BIG.x, BIG.y, BIG.w, 90 - BIG.y).fill(TV.nightD);
    g.rect(BIG.x, 84, BIG.w, 14).fill(TV.amberL);
    g.moveTo(BIG.x, 90).lineTo(BIG.x + BIG.w, 90).stroke({ width: LW, color: TV.line });
    g.rect(BIG.x, 1010, BIG.w, BIG.y + BIG.h - 1010).fill(TV.wood);
    g.moveTo(BIG.x, 1010).lineTo(BIG.x + BIG.w, 1010).stroke({ width: LW, color: TV.line });
    // the lamp's warm pool
    g.ellipse(NAP_C.x, NAP_C.y, 760, 420).fill({ color: TV.amberL, alpha: 0.2 });
    g.ellipse(NAP_C.x, NAP_C.y, 480, 270).fill({ color: TV.amberL, alpha: 0.16 });
    // a wet ring from a mug (someone's), lower left: life on the counter
    g.ellipse(330, 840, 110, 52).stroke({ width: 6, color: TV.wood, alpha: 0.8 });
  }
  private drawNapkin() {
    const g = this.napG;
    g.poly(NAP.map((v, i) => v + (i % 2 ? 14 : 12))).fill({ color: TV.wood, alpha: 0.6 });
    napkin(g, NAP);
    // a scalloped border, like a bar napkin
    g.poly([790, 322, 1132, 322, 1176, 618, 744, 618]).stroke({ width: 3, color: TV.chrome });
  }
  update(t: number, st?: CounterState) {
    if (!st) return;
    const g = this.dyn;
    g.clear();
    this.fur.clear();
    this.top.clear();
    this.whiteMask.clear();
    this.mPerfecto.clear();
    this.mRompan.clear();
    this.tPlic.alpha = 0;
    // ---- the Correctores' white flood (out of the polished cube and back into it)
    const cube = { x: 560, y: 560 };
    let wk = 0;
    if (st.whiteT !== null) {
      const k = t - st.whiteT;
      wk = k < 0.26 ? out3(k / 0.26) : k < 0.62 ? 1 : 1 - in2((k - 0.62) / 0.26);
      wk = clamp(wk, 0, 1);
    }
    this.white.visible = wk > 0.001;
    // «Reducir destellos»: the white is a veil, not a flash
    this.white.alpha = st.gentle ? 0.55 : 1;
    if (this.white.visible) this.whiteMask.circle(cube.x, cube.y, 30 + 1900 * wk).fill(0xffffff);
    // ---- the graffiti (out of the bottle and back)
    let rk = 0;
    if (st.redT !== null) {
      const k = t - st.redT;
      rk = k < 0.22 ? out3(k / 0.22) : k < 0.62 ? 1 : 1 - in2((k - 0.62) / 0.24);
      rk = clamp(rk, 0, 1);
    }
    this.red.visible = rk > 0.001;
    this.red.scale.set(rk);
    this.red.alpha = Math.min(1, rk * 2);
    // ---- the sugar cube: set down by his paw, polished white (the rub), then it stays, too perfect
    if (st.cubeT !== null) {
      const k = t - st.cubeT;
      const land = out3(k / 0.25);
      const sq = k > 0.25 && k < 0.4 ? Math.sin(((k - 0.25) / 0.15) * Math.PI) * 0.18 : 0;
      const pol = clamp((k - 0.5) / 0.9, 0, 1);
      const y = cube.y - (1 - land) * 260;
      g.ellipse(cube.x + 10, cube.y + 74, 70, 16).fill({ color: TV.wood, alpha: 0.5 * land });
      sugarCube(g, cube.x, y + sq * 30, 68 * (1 + sq * 0.3), pol, pol > 0.95 ? 0.6 + 0.4 * Math.sin(t * 9) : pol * 0.5);
      // his paw rubbing it (0.5..1.4 s)
      if (k > 0.45 && k < 1.5) {
        const rub = Math.sin((k - 0.45) * 26) * 26;
        arm(this.top, 340, -120, cube.x - 40 + rub, cube.y - 70, 84);
        paw(this.top, cube.x - 30 + rub, cube.y - 60, 56, 1.4);
        if (Math.sin((k - 0.45) * 26) > 0.8) star(this.top, cube.x + 70, cube.y - 90, 26, TV.white);
      } else if (k <= 0.45) {
        arm(this.top, 360, -120, cube.x, y - 90, 84);
        paw(this.top, cube.x, y - 80, 56, 1.5);
      }
    }
    // ---- the ketchup: set down, squeezed (SPLAT) and it stands there
    const kp = { x: 1380, y: 640 };
    if (st.ketchupT !== null) {
      const k = t - st.ketchupT;
      const land = out3(k / 0.25);
      const squeeze = k > 0.55 && k < 0.85 ? Math.sin(((k - 0.55) / 0.3) * Math.PI) : 0;
      g.ellipse(kp.x + 8, kp.y + 4, 64, 16).fill({ color: TV.wood, alpha: 0.5 * land });
      ketchup(g, kp.x, kp.y - (1 - land) * 280, 150, squeeze);
      if (k < 1.0) {
        const px = kp.x - 120 - squeeze * 20;
        arm(this.top, 1640, -140, px, kp.y - 150, 84);
        paw(this.top, px, kp.y - 140, 56, 0.4, { spread: squeeze });
      }
      // a single drop stays next to the napkin (the consequence)
      if (st.redT !== null && t - st.redT > 0.86) g.circle(1196, 600, 14).fill(0xd8262c).stroke({ width: 3, color: TV.line });
    }
    // ---- the hands of light: down from the lamp (off-frame above), they write a glowing line on the napkin's edge,
    // then their threads cross the whole counter like puppet strings, and go back up
    if (st.handsT !== null) {
      const k = t - st.handsT;
      const down = k < 0.5 ? out3(k / 0.5) : k < 1.7 ? 1 : 1 - in2((k - 1.7) / 0.35);
      const spread = k > 0.85 && k < 1.6 ? bump(k, 0.85, 1.6, 0.3) : 0;
      if (down > 0.01) {
        const ends: [number, number][] = [
          [820 + Math.sin(k * 7) * 30, 330 + 20 * Math.sin(k * 5)],
          [1110 + Math.cos(k * 6) * 30, 330 + 20 * Math.cos(k * 5)],
        ];
        for (const [i, [ex, ey]] of ends.entries()) {
          const sx = i ? 1060 : 860;
          const yy = -200 + (ey + 200) * down;
          const xx = sx + (ex - sx) * down;
          g.moveTo(sx, -200).lineTo(xx, yy).stroke({ width: 14, color: TV.lantern, alpha: 0.35 });
          g.moveTo(sx, -200).lineTo(xx, yy).stroke({ width: 4, color: 0xeafcff, alpha: 0.95 });
          lightHand(g, xx, yy, 38, i ? -0.4 : 0.4, 1);
        }
        // their writing: a glowing scribble at the napkin's top edge
        const wk2 = clamp((k - 0.4) / 0.6, 0, 1) * down;
        if (wk2 > 0) {
          const n = Math.floor(14 * wk2);
          let px = 830;
          for (let i = 0; i < n; i++) {
            const nx = px + 20;
            g.moveTo(px, 352 + (i % 2) * 14).lineTo(nx, 352 + ((i + 1) % 2) * 14).stroke({ width: 5, color: 0x7fe4ff, alpha: 0.9, cap: 'round' });
            px = nx;
          }
        }
        // the strings over the whole counter (the invasion)
        if (spread > 0.01) {
          for (let i = 0; i < 11; i++) {
            const fx = 120 + i * 168;
            const tx = 200 + ((i * 263) % 1500);
            const ty = 260 + ((i * 197) % 620);
            const ex = fx + (tx - fx) * spread;
            const ey = -100 + (ty + 100) * spread;
            g.moveTo(fx, -100).lineTo(ex, ey).stroke({ width: 10, color: TV.lantern, alpha: 0.3 * spread });
            g.moveTo(fx, -100).lineTo(ex, ey).stroke({ width: 3, color: 0xeafcff, alpha: 0.9 * spread });
            lightHand(g, ex, ey, 22, (i % 3) - 1, spread);
          }
        }
      }
    }
    // ---- the Capi: a fry (from his little plate) with a toothpick quill and a paper hat
    if (st.capiT !== null && st.asleep < 0.01) {
      const k = t - st.capiT;
      // it hops in from the plate's side and lands ON the napkin, at its lower left corner
      const hop = clamp(k / 0.7, 0, 1);
      const fx = 480 + 270 * hop;
      const fy = 610 - Math.abs(Math.sin(hop * Math.PI * 2)) * 90 * (1 - hop * 0.5);
      let look = 0;
      let qa = 0.5;
      let qx = fx + 64;
      let qy = fy - 160;
      const w = st.writeT === null ? -1 : t - st.writeT;
      const D = 1.5;
      const wq = clamp(w / D, 0, 1);
      if (st.capi === 'perfecto' || st.capi === 'romper') {
        const txt = st.capi === 'perfecto' ? this.tPerfecto : this.tRompan;
        const m = st.capi === 'perfecto' ? this.mPerfecto : this.mRompan;
        if (w >= 0) {
          // written line by line, left to right (the quill on the line being written)
          const x0 = txt.x - txt.width / 2 - 10;
          const top = txt.y - txt.height / 2;
          const q1 = clamp(wq * 2, 0, 1);
          const q2 = clamp(wq * 2 - 1, 0, 1);
          const xe1 = x0 + (txt.width + 20) * q1;
          const xe2 = x0 + (txt.width + 20) * q2;
          m.rect(x0, top - 20, Math.max(1, xe1 - x0), txt.height / 2 + 20).fill(0xffffff);
          if (q2 > 0) m.rect(x0, txt.y, Math.max(1, xe2 - x0), txt.height / 2 + 20).fill(0xffffff);
          if (wq < 1) {
            qx = q2 > 0 ? xe2 : xe1;
            qy = (q2 > 0 ? txt.y + txt.height * 0.25 : txt.y - txt.height * 0.25) - 30 + Math.sin(w * 30) * 10;
            qa = 0.45;
          }
        }
        txt.visible = w >= 0;
        (st.capi === 'perfecto' ? this.tRompan : this.tPerfecto).visible = false;
        // romper: then the quill CROSSES IT OUT, hard
        if (st.capi === 'romper' && w > D + 0.2) {
          // a hard zigzag scribble over both lines
          const s = clamp((w - D - 0.2) / 0.45, 0, 1);
          const x0 = txt.x - txt.width / 2 - 20;
          const W2 = txt.width + 40;
          const n = Math.max(1, Math.round(8 * s));
          g.moveTo(x0, txt.y - txt.height * 0.3);
          let ex = x0;
          let ey = txt.y;
          for (let i = 1; i <= n; i++) {
            ex = x0 + (W2 * i) / 8;
            ey = txt.y + (i % 2 ? txt.height * 0.32 : -txt.height * 0.3);
            g.lineTo(ex, ey);
          }
          g.stroke({ width: 10, color: TV.line, cap: 'round', join: 'round' });
          if (s < 1) {
            qx = ex;
            qy = ey - 40;
          }
        }
        // perfecto: the words glow the Correctores' white for a moment (a perfect world is scary)
        if (st.capi === 'perfecto' && w > D + 0.1) {
          const s = bump(w, D + 0.1, D + 1.3, 0.3);
          g.roundRect(txt.x - txt.width / 2 - 20, txt.y - txt.height / 2 - 10, txt.width + 40, txt.height + 20, 30).fill({ color: 0xffffff, alpha: 0.55 * s });
          star(g, txt.x + txt.width / 2 + 10, txt.y - txt.height / 2, 30 * s, TV.white);
        }
        look = wq >= 1 ? 1 : 0;
      } else {
        this.tPerfecto.visible = false;
        this.tRompan.visible = false;
        if (st.capi === 'nada' && w >= 0) {
          // it lifts the quill… hovers over the page… and puts it down. The page stays blank
          const lift = bump(w, 0, 1.8, 0.25);
          qy = fy - 160 - lift * 90;
          qx = fx + 64 + lift * 120;
          qa = 0.5 - lift * 0.4;
          if (w > 1.8) {
            qx = fx + 110;
            qy = fy + 10;
            qa = Math.PI / 2;
            star(g, NAP_C.x + 60, NAP_C.y - 40, 26 * bump(w, 1.9, 2.8, 0.3), TV.white);
          }
          look = w > 1.8 ? 1 : 0;
        } else if (st.capi === 'none') {
          // the Capi just looks (up at him)
          look = w >= 0 ? 1 : 0;
        }
      }
      fryCapi(g, fx, fy, 170, { look, tilt: Math.sin(t * 3) * 0.05, blink: Math.sin(t * 1.7) > 0.97 });
      quill(g, qx, qy, 110, qa);
    } else {
      this.tPerfecto.visible = false;
      this.tRompan.visible = false;
    }
    // ---- his paw on the napkin («esa hoja»): it pats it flat
    if (st.pawOn > 0.01 && st.asleep < 0.5) {
      const pat = st.patT === null ? 0 : Math.max(0, Math.sin(clamp((t - st.patT) / 0.9, 0, 1) * Math.PI * 3)) * (1 - clamp((t - (st.patT ?? 0)) / 0.9, 0, 1));
      const py = NAP_C.y - 40 - (1 - st.pawOn) * 500 - pat * 70;
      arm(this.top, NAP_C.x - 80, -260, NAP_C.x - 10, py, 110);
      paw(this.top, NAP_C.x, py, 78, Math.PI / 2, { spread: pat * 0.6 });
    }
    // ---- asleep on it: his fur covers the napkin (breathing), the Zzz
    if (st.asleep > 0.01) {
      const br = Math.sin(t * 2.2) * 10;
      const f = this.fur;
      const a = st.asleep;
      const yb = 560 + br - (1 - a) * 700;
      f.poly([520, -200, 1400, -200, 1360, yb - 140, 1260, yb - 30, 1080, yb + 20, 880, yb + 10, 700, yb - 40, 580, yb - 150]).fill(FUR.base).stroke({ width: LW * 1.4, color: TV.line, join: 'round' });
      for (let i = 0; i < 6; i++) f.moveTo(620 + i * 130, yb - 260).quadraticCurveTo(660 + i * 130, yb - 160, 640 + i * 130, yb - 70).stroke({ width: 18, color: FUR.stripe, cap: 'round' });
      f.ellipse(960, yb - 150, 200, 70).fill({ color: FUR.light, alpha: 0.8 });
      // his two paws hanging over the edge of the napkin
      paw(f, 820, yb + 6, 54, Math.PI / 2);
      paw(f, 1100, yb + 14, 54, Math.PI / 2);
      zzz(this.top, 1240, 160, 70, t, a);
    }
    // ---- Espuma's pencil can't write under a sleeping cat: «boing», the line runs away, the lead snaps
    if (st.pencilT !== null) {
      const k = (t - st.pencilT) * 1.15;
      const gone = clamp((k - 2.6) / 0.4, 0, 1);
      const reach = out3(k / 0.4) * (1 - gone);
      // the corner of the napkin that still shows: bottom right
      const tip = { x: 1150, y: 610 };
      // try 1 (0.4..1.0): it touches and BENDS; try 2 (1.1..2.0): it writes, but the line curls away from him;
      // 2.0: the lead snaps
      let bend = 0;
      let off = 0;
      if (k > 0.4 && k < 1.0) {
        bend = Math.sin(((k - 0.4) / 0.6) * Math.PI) * 0.9 * Math.cos((k - 0.4) * 30);
        off = Math.sin(((k - 0.4) / 0.6) * Math.PI) * 30;
      }
      const writing = clamp((k - 1.1) / 0.9, 0, 1);
      const broke = k > 2.0;
      const ex = tip.x + 360 + (1 - reach) * 500 + writing * 40;
      const ey = tip.y + 260 + off;
      // the line it manages: it starts at the corner and curls AWAY from the cat
      if (writing > 0) {
        const n = Math.floor(20 * writing);
        g.moveTo(tip.x, tip.y);
        let px = tip.x;
        let py = tip.y;
        for (let i = 1; i <= n; i++) {
          const q = i / 20;
          px = tip.x + q * 220 + Math.sin(q * 18) * 16;
          py = tip.y + q * q * 300;
          g.lineTo(px, py);
        }
        g.stroke({ width: 5, color: 0x5a5466, cap: 'round', join: 'round' });
      }
      // Espuma's arm (calico) holding the pencil from the bottom right
      const hx = ex + 40;
      const hy = ey + 40;
      if (reach > 0.01) {
        arm(this.top, 1960, 1180, hx, hy, 96, { color: CALICO.white, stripe: CALICO.black });
        paw(this.top, hx, hy, 58, -2.4, { color: CALICO.white, light: 0xffffff });
        const a = Math.atan2(tip.y - ey, tip.x - ex);
        const L = Math.hypot(tip.x - ex, tip.y - ey) * (k < 0.4 ? 1 : 1);
        pencil(this.top, ex, ey, L, a, { bend, broken: broke });
        this.top.ellipse(hx - 30, hy - 10, 26, 18).fill(CALICO.black);
      }
      // the snapped lead flies off; «¡PLIC!»
      if (broke && k < 2.9) {
        const q = (k - 2.0) / 0.9;
        g.poly([tip.x + q * 260, tip.y - 180 * q + 300 * q * q, tip.x + 18 + q * 260, tip.y - 10 - 180 * q + 300 * q * q, tip.x + 8 + q * 260, tip.y + 12 - 180 * q + 300 * q * q]).fill(0x3a3442);
        this.tPlic.alpha = 1 - q;
        this.tPlic.position.set(tip.x + 170, tip.y - 150);
        this.tPlic.scale.set(0.7 + 0.5 * out3(q * 3));
      }
    }
  }
  destroy() {
    this.root.destroy({ children: true });
  }
}

/** a donut ring for the floor shot (R7), re-exported for the director */
export { donut };
