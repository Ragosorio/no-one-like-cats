/**
 * Renderer-agnostic core of the living cats (AgentGameEngine `puppet`): the rig → deformable grid
 * (`PuppetModel`) and the acting brain (`PuppetBrain`: springs, blinks, ears, tail, idle acts, emotes)
 * that writes vertex positions into a plain Float32Array. Pixi (`art/livingCat.ts` CatPuppet) and the
 * Parte II 2.5D world (`engine/world/paperCat.ts`) both drive the same brain, so a cat moves the same
 * way on the 2D island, in battle and in the 3D scene.
 *
 * Extracted verbatim from livingCat.ts (2026-10-09); behavior is unchanged.
 */
import rigsJson from '../data/catRigs.json';

export const ART = 700;

type V2 = [number, number];
export interface CatRig {
  /** logical painting size (default 700×700) */
  size?: V2;
  /** head ellipse cx, cy, rx, ry */
  head: [number, number, number, number];
  /** pivot the head tilts around */
  neck: V2;
  /** baseX, baseY, tipX, tipY, halfWidth */
  ears: [number, number, number, number, number][];
  /**
   * eye boxes x0, y0, x1, y1 (upper lid at y0, lower lid at y1). Optional 5th value `lid` (px) = an ELLIPTIC lid:
   * the eye is the ellipse inscribed in the box and only the `lid` px painted right above its upper contour slide
   * down over it, so a glasses rim / crown / fringe painted just above the eye stays put (Archivista). Without it,
   * the classic flat lid: a band as tall as the eye, right above it, stretches down over it.
   */
  eyes: [number, number, number, number, number?][];
  tail: { pts: V2[]; r: number } | null;
  /** cx, cy, r of detached props that bob in place */
  floats: [number, number, number][];
  /**
   * cx, cy, rx, ry of painted things that must NOT follow the head, the ears or the tail (after-images, a backdrop):
   * inside they only bend with the whole body (lean, crouch) and can still bob as a `floats` prop (Refracta).
   * Soft edge from 1 to 1.15 radii.
   */
  pins?: [number, number, number, number][];
}
const RIGS = rigsJson as unknown as Record<string, CatRig>;
export function catRig(slug: string): CatRig | undefined {
  return RIGS[slug];
}

/** anything the old code treated as "the cat sprite" */
export type CatEmote = 'happy' | 'hurt' | 'surprise' | 'sleepy' | 'attack';
export type CatAct = 'look' | 'yawn' | 'groom' | 'stretch' | 'flick';
/** which spontaneous acts a puppet may start by itself */
export type ActSet = 'all' | 'calm' | 'battle' | 'none';
const ACTS: Record<ActSet, CatAct[]> = {
  all: ['look', 'look', 'yawn', 'groom', 'stretch', 'flick', 'flick'],
  calm: ['look', 'look', 'flick', 'yawn'],
  battle: ['look', 'flick', 'flick'],
  none: [],
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** 0→1→0 envelope with soft ends */
const bell = (p: number) => (p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p) ** 0.7);

/** grid lines along one axis: coarse spacing + dense runs (eyes) so blinks resolve */
function axis(len: number, step: number, dense: [number, number, number][]) {
  const vals: number[] = [];
  for (let v = 0; v < len; v += step) vals.push(v);
  vals.push(len);
  for (const [a, b, n] of dense) for (let i = 0; i <= n; i++) vals.push(clamp(a + ((b - a) * i) / n, 0, len));
  vals.sort((p, q) => p - q);
  const out = [vals[0]];
  for (const v of vals) if (v - out[out.length - 1] >= 1.5) out.push(v);
  out[out.length - 1] = len;
  return out;
}

function nearestOnPolyline(pts: V2[], cum: number[], x: number, y: number) {
  let best = Infinity;
  let bestS = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1);
    const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
    if (d < best) {
      best = d;
      bestS = cum[i] + Math.sqrt(l2) * t;
    }
  }
  return { d: best, s: bestS };
}

/** Precomputed rest mesh + per-vertex influence weights for one rig (shared by every puppet of that cat). */

export class PuppetModel {
  W: number;
  H: number;
  rest: Float32Array; // x,y in painting space
  uvs: Float32Array;
  indices: Uint32Array;
  n: number;
  head: Float32Array;
  ears: Float32Array[];
  eyes: Float32Array[]; // full-closure vertical delta per vertex (painting px)
  tailW: Float32Array;
  tailS: Float32Array;
  floatI: Int16Array;
  floatW: Float32Array;
  /** 0 at the feet → 1 at the top of the head: how much body lean/crouch moves a vertex */
  bodyH: Float32Array;
  feetY: number;
  topY: number;
  tailSize: number;
  tailReach: number;
  constructor(public rig: CatRig) {
    const [W, H] = rig.size ?? [ART, ART];
    this.W = W;
    this.H = H;
    const dense = rig.eyes.map(([x0, y0, x1, y1, lid]) => {
      const hw = (x1 - x0) / 2;
      const cx = x0 + hw;
      const h = y1 - y0;
      // elliptic lid: fine rows and columns on the eye itself (its band above is only a few px)
      if (lid !== undefined) return { x: [x0, x1, 24] as [number, number, number], y: [y0 - lid * 2, y1 + 2, 28] as [number, number, number] };
      return { x: [cx - hw * 1.6, cx + hw * 1.6, 12] as [number, number, number], y: [y0 - h * 1.1, y1 + h * 0.45, 16] as [number, number, number] };
    });
    const xs = axis(W, W / 26, dense.map((e) => e.x));
    const ys = axis(H, H / 26, dense.map((e) => e.y));
    const nx = xs.length;
    const ny = ys.length;
    const n = (this.n = nx * ny);
    this.rest = new Float32Array(n * 2);
    this.uvs = new Float32Array(n * 2);
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const k = (j * nx + i) * 2;
        this.rest[k] = xs[i];
        this.rest[k + 1] = ys[j];
        this.uvs[k] = xs[i] / W;
        this.uvs[k + 1] = ys[j] / H;
      }
    const idx: number[] = [];
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i;
        idx.push(a, a + 1, a + nx, a + 1, a + nx + 1, a + nx);
      }
    this.indices = new Uint32Array(idx);

    this.head = new Float32Array(n);
    this.ears = rig.ears.map(() => new Float32Array(n));
    this.eyes = rig.eyes.map(() => new Float32Array(n));
    this.tailW = new Float32Array(n);
    this.tailS = new Float32Array(n);
    this.floatI = new Int16Array(n).fill(-1);
    this.floatW = new Float32Array(n);
    this.bodyH = new Float32Array(n);

    const [hx, hy, hrx, hry] = rig.head;
    this.feetY = H * 0.95;
    this.topY = Math.max(0, hy - hry);
    const tail = rig.tail;
    const cum: number[] = [0];
    if (tail) for (let i = 1; i < tail.pts.length; i++) cum.push(cum[i - 1] + Math.hypot(tail.pts[i][0] - tail.pts[i - 1][0], tail.pts[i][1] - tail.pts[i - 1][1]));
    const tailLen = cum[cum.length - 1] || 1;
    this.tailSize = tail ? tail.r : 0;
    // tip travel in px, not radians: long tails swing the same few px as short ones
    this.tailReach = tail ? Math.max(...tail.pts.map(([x, y]) => Math.hypot(x - tail.pts[0][0], y - tail.pts[0][1]))) : 1;

    for (let v = 0; v < n; v++) {
      const x = this.rest[v * 2];
      const y = this.rest[v * 2 + 1];
      this.bodyH[v] = clamp((this.feetY - y) / (this.feetY - this.topY || 1), 0, 1.3);
      // pinned paint (after-images, a backdrop): head, ears and tail let go of it
      let keep = 1;
      if (rig.pins) for (const [px, py, prx, pry] of rig.pins) keep = Math.min(keep, smooth(1, 1.15, Math.hypot((x - px) / prx, (y - py) / pry)));
      // head ellipse with a soft collar
      const e = Math.hypot((x - hx) / hrx, (y - hy) / hry);
      let wh = 1 - smooth(1, 1.32, e);
      // ears: bend from base to tip; the whole ear (and a margin) follows the head
      rig.ears.forEach(([bx, by, tx, ty, hw], k) => {
        const L = Math.hypot(tx - bx, ty - by) || 1;
        const dx = (tx - bx) / L;
        const dy = (ty - by) / L;
        const s = ((x - bx) * dx + (y - by) * dy) / L;
        const q = Math.abs((x - bx) * -dy + (y - by) * dx);
        const half = hw * (1.05 - 0.45 * clamp(s, 0, 1)) + 4;
        const lateral = 1 - smooth(half, half * 1.6 + 8, q);
        const along = 1 - smooth(1.12, 1.5, s);
        const region = lateral * along * smooth(-0.45, -0.1, s);
        wh = Math.max(wh, region);
        const w = region * smooth(-0.05, 0.55, s) * keep;
        if (w > 0.001) this.ears[k][v] = w;
      });
      if (wh * keep > 0.001) this.head[v] = wh * keep;
      // eyes: lids slide down — fur above the eye stretches over it, the eye squeezes into a lash line
      rig.eyes.forEach(([x0, y0, x1, y1, lid], k) => {
        const hw = (x1 - x0) / 2;
        const cx = x0 + hw;
        const h = y1 - y0;
        if (lid !== undefined) {
          // elliptic lid: per column, the thin band right above the eye's upper contour covers 78% of it
          const u = (x - cx) / hw;
          if (u <= -1 || u >= 1) return;
          const half = (h / 2) * Math.sqrt(1 - u * u);
          const top = y0 + h / 2 - half;
          const bot = top + 2 * half;
          const band = Math.max(0.5, lid);
          const yt = top - band;
          const yc = top + (bot - top) * 0.78;
          let f = y;
          if (y > yt && y <= top) f = yt + ((y - yt) * (yc - yt)) / band;
          else if (y > top && y < bot) f = yc + ((y - top) * (bot - yc)) / (bot - top);
          const d = f - y;
          if (Math.abs(d) > 0.01) this.eyes[k][v] = d;
          return;
        }
        const across = 1 - smooth(0.82, 1.5, Math.abs(x - cx) / hw);
        if (across <= 0) return;
        const yt = y0 - h * 1.0;
        const yc = y0 + h * 0.78;
        let f = y;
        if (y > yt && y <= y0) f = yt + ((y - yt) * (yc - yt)) / (y0 - yt);
        else if (y > y0 && y < y1) f = yc + ((y - y0) * (y1 - yc)) / h;
        const d = (f - y) * across;
        if (Math.abs(d) > 0.01) this.eyes[k][v] = d;
      });
      // tail: distance to the spine; amplitude grows toward the tip
      if (tail) {
        const { d, s } = nearestOnPolyline(tail.pts, cum, x, y);
        let w = 1 - smooth(tail.r, tail.r * 2, d);
        w *= (1 - clamp(wh * 1.5, 0, 1)) * keep; // never drag the face (nor pinned paint)
        if (w > 0.001) {
          this.tailW[v] = w;
          this.tailS[v] = s / tailLen;
        }
      }
      // floating props
      rig.floats.forEach(([fx, fy, fr], k) => {
        const w = 1 - smooth(fr, fr * 1.5 + 4, Math.hypot(x - fx, y - fy));
        if (w > this.floatW[v]) {
          this.floatW[v] = w;
          this.floatI[v] = k;
        }
      });
    }
  }
}

const models = new Map<string, PuppetModel | null>();
export function modelFor(slug: string) {
  if (!models.has(slug)) {
    const rig = RIGS[slug];
    models.set(slug, rig ? new PuppetModel(rig) : null);
  }
  return models.get(slug) ?? null;
}

/** a plain 2×2 quad for paintings without a rig (still behaves like a sprite) */
export function quad() {
  return {
    W: ART,
    H: ART,
    rest: new Float32Array([0, 0, ART, 0, 0, ART, ART, ART]),
    uvs: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
    indices: new Uint32Array([0, 1, 2, 1, 3, 2]),
  };
}

let seedN = 1;
const rand = () => Math.random();

/** critically-damped follower: value chases target with time constant `tau` (s) */
export class Spring {
  v = 0;
  target = 0;
  constructor(public tau = 0.18) {}
  step(dt: number) {
    this.v += (this.target - this.v) * (1 - Math.exp(-dt / this.tau));
    return this.v;
  }
}

export interface BrainOptions {
  anchorX?: number;
  anchorY?: number;
  /** deformation rate (house style animates on twos-ish) */
  fps?: number;
  /** spontaneous acts this puppet may start on its own */
  acts?: ActSet;
}

/**
 * The acting state of one cat. Owners drive posture with `lean/crouch/look/walk/wind/sleeping`
 * and react with `emote()`; `tick(dt)` returns true when `pos` was rewritten (upload it).
 */
export class PuppetBrain {
  readonly model: PuppetModel | null;
  readonly W: number;
  readonly H: number;
  /** vertex positions (x,y pairs) in painting px minus the anchor; uvs/indices live on the model */
  readonly pos: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;
  readonly anchor: { x: number; y: number };
  t = rand() * 20;
  private acc = 0;
  private step: number;
  private seed = seedN++;
  // ---- posture (owner-driven targets, smoothed)
  readonly leanS = new Spring(0.14);
  readonly crouchS = new Spring(0.1);
  readonly lookS = new Spring(0.35);
  readonly walkS = new Spring(0.2);
  readonly sleepS = new Spring(0.6);
  readonly windS = new Spring(0.8);
  /** -1..1: body lean toward local +x (top moves, feet stay) */
  set lean(v: number) {
    this.leanS.target = clamp(v, -1, 1);
  }
  /** 0..1: squash toward the feet (anticipation) */
  set crouch(v: number) {
    this.crouchS.target = clamp(v, -0.4, 1);
  }
  /** -1..1: head turns toward local ±x */
  set look(v: number) {
    this.lookS.target = clamp(v, -1, 1);
  }
  /** 0..1: walk cycle intensity */
  set walk(v: number) {
    this.walkS.target = clamp(v, 0, 1);
  }
  set sleeping(v: boolean) {
    this.sleepS.target = v ? 1 : 0;
  }
  /** -1..1 wind along local x (tail and ears drift with it) */
  set wind(v: number) {
    this.windS.target = clamp(v, -1, 1);
  }
  /** extra amplitude multiplier for everything (0 freezes the acting) */
  energy = 1;
  /** spontaneous acts allowed */
  acts: ActSet;
  // ---- face state
  private blinkT = 1 + rand() * 3;
  private blinkPhase = -1;
  private blinkDouble = false;
  private earT: number[] = [];
  private earKick: { t: number; a: number }[] = [];
  private excite = 0;
  private hurt = 0;
  private surprise = 0;
  private sleepy = 0;
  private attack = 0;
  private walkPh = rand() * 6;
  private act: { kind: CatAct; t: number; dur: number; dir: number } | null = null;
  private actT = 5 + rand() * 8;

  constructor(slug: string, o: BrainOptions = {}) {
    const model = modelFor(slug);
    const base = model ?? quad();
    const ax = o.anchorX ?? 0.5;
    const ay = o.anchorY ?? 0.5;
    const pos = new Float32Array(base.rest.length);
    for (let i = 0; i < pos.length; i += 2) {
      pos[i] = base.rest[i] - ax * base.W;
      pos[i + 1] = base.rest[i + 1] - ay * base.H;
    }
    this.model = model;
    this.W = base.W;
    this.H = base.H;
    this.pos = pos;
    this.uvs = base.uvs;
    this.indices = base.indices;
    this.anchor = { x: ax, y: ay };
    this.step = 1 / (o.fps ?? 15);
    this.acts = o.acts ?? 'all';
    if (model) {
      this.earT = model.rig.ears.map(() => 2 + rand() * 6);
      this.earKick = model.rig.ears.map(() => ({ t: 9, a: 0 }));
    }
  }

  /** move the anchor (fraction of the painting); returns true when `pos` changed */
  setAnchor(x: number, y: number) {
    const dx = (x - this.anchor.x) * this.W;
    const dy = (y - this.anchor.y) * this.H;
    this.anchor.x = x;
    this.anchor.y = y;
    if (!dx && !dy) return false;
    for (let i = 0; i < this.pos.length; i += 2) {
      this.pos[i] -= dx;
      this.pos[i + 1] -= dy;
    }
    return true;
  }

  /** head center in local mesh space (for look-at) */
  headLocal(): [number, number] | null {
    if (!this.model) return null;
    return [this.model.rig.head[0] - this.anchor.x * this.W, this.model.rig.head[1] - this.anchor.y * this.H];
  }

  /** react: happy = tail wag + ears perk, hurt = squeeze eyes + ears back, attack = lunge */
  emote(kind: CatEmote, strength = 1) {
    if (kind === 'happy') this.excite = Math.max(this.excite, 1.6 * strength);
    if (kind === 'hurt') {
      this.hurt = Math.max(this.hurt, strength);
      this.kickEars(0.35 * strength);
    }
    if (kind === 'surprise') {
      this.surprise = strength;
      this.kickEars(-0.22 * strength);
    }
    if (kind === 'sleepy') this.sleepy = strength;
    if (kind === 'attack') {
      this.attack = strength;
      this.excite = Math.max(this.excite, 0.8 * strength);
    }
  }
  /** start a spontaneous act now (look around, yawn, groom, stretch, tail flick) */
  doAct(kind: CatAct) {
    const dur = { look: 2.4, yawn: 1.7, groom: 2.6, stretch: 1.9, flick: 0.9 }[kind];
    this.act = { kind, t: 0, dur, dir: rand() < 0.5 ? -1 : 1 };
  }
  /** force a blink right now */
  blink() {
    if (this.blinkPhase < 0) this.blinkPhase = 0;
  }
  private kickEars(a: number) {
    this.earKick.forEach((k, i) => {
      k.t = 0;
      k.a = a * (i % 2 ? 1 : -1);
    });
  }

  /** advance timers; true when the geometry was recomputed this frame */
  tick(dt: number): boolean {
    this.t += dt;
    if (!this.model) return false;
    // timers advance every frame so acting stays on schedule; geometry updates at `fps`
    this.blinkT -= dt;
    if (this.blinkT <= 0 && this.blinkPhase < 0) {
      this.blinkPhase = 0;
      this.blinkDouble = rand() < 0.18;
      this.blinkT = 2.2 + rand() * 4.2;
    }
    if (this.blinkPhase >= 0) {
      this.blinkPhase += dt;
      if (this.blinkPhase > 0.26) {
        if (this.blinkDouble) {
          this.blinkDouble = false;
          this.blinkPhase = 0.02;
        } else this.blinkPhase = -1;
      }
    }
    this.earT.forEach((v, i) => {
      this.earT[i] = v - dt;
      if (this.earT[i] <= 0) {
        this.earT[i] = 2.5 + rand() * 6.5;
        this.earKick[i] = { t: 0, a: (rand() < 0.5 ? -1 : 1) * (0.14 + rand() * 0.14) };
      }
    });
    for (const k of this.earKick) k.t += dt;
    this.excite *= Math.exp(-dt * 1.6);
    this.hurt *= Math.exp(-dt * 2.4);
    this.surprise *= Math.exp(-dt * 2);
    this.attack *= Math.exp(-dt * 3);
    // spontaneous acts (never while walking, sleeping or mid-emote)
    if (this.act) {
      this.act.t += dt;
      if (this.act.t >= this.act.dur) this.act = null;
    } else {
      this.actT -= dt;
      const pool = ACTS[this.acts];
      if (this.actT <= 0) {
        this.actT = 6 + rand() * 9;
        const busy = this.walkS.v > 0.2 || this.sleepS.v > 0.3 || this.excite + this.hurt + this.attack > 0.3;
        if (pool.length && !busy) this.doAct(pool[Math.floor(rand() * pool.length)]);
      }
    }
    if (this.walkS.v > 0.01) this.walkPh += dt * 11 * this.walkS.v;
    for (const s of [this.leanS, this.crouchS, this.lookS, this.walkS, this.sleepS, this.windS]) s.step(dt);
    this.acc += dt;
    if (this.acc < this.step) return false;
    this.acc = 0;
    this.deform();
    return true;
  }

  private blinkClosure(actClose: number) {
    let c = 0;
    const p = this.blinkPhase;
    if (p >= 0) c = p < 0.07 ? p / 0.07 : p < 0.12 ? 1 : Math.max(0, 1 - (p - 0.12) / 0.14);
    c = Math.max(c, Math.min(1, this.hurt * 1.4), this.sleepy * 0.75, this.sleepS.v, actClose);
    return Math.max(0, c - this.surprise * 0.15);
  }

  /** recompute vertex positions into `pos` from the current state */
  deform() {
    const m = this.model!;
    const rig = m.rig;
    const t = this.t;
    const s = this.seed;
    const E = this.energy;
    const ax = this.anchor.x * m.W;
    const ay = this.anchor.y * m.H;
    const rest = m.rest;
    const pos = this.pos;
    const walk = this.walkS.v;
    const sleep = this.sleepS.v;
    const wind = this.windS.v;
    // ---- spontaneous act envelopes
    let actLook = 0;
    let actHeadA = 0;
    let actHeadDy = 0;
    let actClose = 0;
    let actEars = 0;
    let actCrouch = 0;
    let actLean = 0;
    let actTail = 0;
    const a = this.act;
    if (a) {
      const p = a.t / a.dur;
      const env = bell(p);
      if (a.kind === 'look') actLook = a.dir * Math.sin(p * Math.PI * 2) * smooth(0, 0.15, p) * smooth(1, 0.85, p);
      if (a.kind === 'yawn') {
        actHeadDy = -10 * env;
        actHeadA = -0.07 * env * a.dir;
        actClose = smooth(0.15, 0.4, p) * smooth(0.95, 0.75, p);
        actEars = 0.22 * env;
      }
      if (a.kind === 'groom') {
        actHeadDy = (9 + 3 * Math.sin(t * 14)) * env;
        actHeadA = 0.09 * env * a.dir;
        actClose = 0.85 * env;
      }
      if (a.kind === 'stretch') {
        actCrouch = 0.7 * bell(clamp(p * 1.8, 0, 1));
        actLean = 0.35 * bell(clamp((p - 0.35) * 1.6, 0, 1));
        actClose = 0.5 * env;
      }
      if (a.kind === 'flick') actTail = 0.55 * Math.sin(p * Math.PI * 3) * env;
    }
    // ---- head: wandering tilt + bob; lean in on attack, turn with look, droop asleep
    const look = clamp(this.lookS.v + actLook, -1, 1);
    const awake = 1 - sleep;
    const headA =
      E *
      (awake * (0.035 * Math.sin(t * 0.75 + s) + 0.018 * Math.sin(t * 1.9 + s * 2.1)) +
        this.excite * 0.05 * Math.sin(t * 9) -
        this.hurt * 0.08 +
        this.attack * 0.12 +
        look * 0.07 +
        sleep * 0.08 +
        actHeadA);
    const headDx = E * (this.attack * 10 + look * 11);
    const headDy = E * (2.2 * Math.sin(t * 2.4 + s) * (1 - sleep * 0.6) - this.surprise * 8 + this.sleepy * 6 + sleep * 9 + walk * 2.6 * Math.sin(this.walkPh * 2) + actHeadDy);
    const hc = Math.cos(headA);
    const hs = Math.sin(headA);
    const [nx, ny] = rig.neck;
    // ---- ears
    const earA = rig.ears.map((_, i) => {
      const k = this.earKick[i];
      const kick = k.a * Math.exp(-k.t * 5.5) * Math.cos(k.t * 21);
      const side = i % 2 ? 1 : -1;
      return E * (awake * 0.025 * Math.sin(t * 1.3 + i * 2 + s) + kick - this.excite * 0.06 * side + this.hurt * 0.25 * side + actEars * side + sleep * 0.1 * side + wind * 0.07);
    });
    // ---- tail (+ walking makes it bouncier, wind pushes it)
    const big = m.tailSize > 60 ? 0.75 : 1;
    const tailAmp = E * big * clamp(26 / m.tailReach, 0.05, 0.14) * (1 + this.excite * 1.6 + walk * 0.6) * (1 - sleep * 0.65);
    const tailPh = t * (1.7 + this.excite * 2.5 + walk * 1.5) + s;
    const tailBias = E * (wind * 0.09 + actTail * clamp(26 / m.tailReach, 0.05, 0.14) * 2.2);
    const tb = rig.tail?.pts[0];
    // ---- eyes
    const close = Math.min(1, this.blinkClosure(actClose) * Math.min(1, E));
    // ---- floats
    const fdx = rig.floats.map((_, i) => E * (2.2 * Math.sin(t * 0.9 + i * 1.3 + s) + wind * 4));
    const fdy = rig.floats.map((_, i) => E * 6 * Math.sin(t * 1.5 + i * 1.7 + s));
    // ---- body: lean (shear over the feet) + crouch (squash toward the feet) + walk bob
    const step = Math.abs(Math.sin(this.walkPh));
    const lean = E * (this.leanS.v * 0.22 + walk * 0.06 + this.attack * 0.1 - this.hurt * 0.08 + actLean * 0.25);
    const crouch = E * (this.crouchS.v * 0.16 + walk * 0.045 * step + actCrouch * 0.12 + sleep * 0.05);
    const bodyH = m.feetY - m.topY;
    const cx = m.W / 2;
    const fy = m.feetY;

    for (let v = 0; v < m.n; v++) {
      let x = rest[v * 2];
      let y = rest[v * 2 + 1];
      if (close > 0) for (let k = 0; k < m.eyes.length; k++) y += m.eyes[k][v] * close;
      for (let k = 0; k < m.ears.length; k++) {
        const w = m.ears[k][v];
        if (w <= 0) continue;
        const ang = earA[k] * w;
        const c = Math.cos(ang);
        const sn = Math.sin(ang);
        const bx = rig.ears[k][0];
        const by = rig.ears[k][1];
        const dx = x - bx;
        const dy = y - by;
        x = bx + dx * c - dy * sn;
        y = by + dx * sn + dy * c;
      }
      const tw = m.tailW[v];
      if (tw > 0 && tb) {
        const ts = m.tailS[v];
        const ang = tw * Math.pow(ts, 1.25) * (tailAmp * Math.sin(tailPh - ts * 2.6) + tailBias);
        const c = Math.cos(ang);
        const sn = Math.sin(ang);
        const dx = x - tb[0];
        const dy = y - tb[1];
        x = tb[0] + dx * c - dy * sn;
        y = tb[1] + dx * sn + dy * c;
      }
      const wh = m.head[v];
      if (wh > 0) {
        const dx = x - nx;
        const dy = y - ny;
        let rx: number;
        let ry: number;
        if (wh >= 0.999) {
          rx = nx + dx * hc - dy * hs;
          ry = ny + dx * hs + dy * hc;
        } else {
          const ang = headA * wh;
          const c = Math.cos(ang);
          const sn = Math.sin(ang);
          rx = nx + dx * c - dy * sn;
          ry = ny + dx * sn + dy * c;
        }
        x = rx + headDx * wh;
        y = ry + headDy * wh;
      }
      const fi = m.floatI[v];
      if (fi >= 0) {
        const w = m.floatW[v];
        x += fdx[fi] * w;
        y += fdy[fi] * w;
      }
      if (lean !== 0 || crouch !== 0) {
        const h = m.bodyH[v];
        // the head leads the lean a little (follow-through)
        x += lean * h * bodyH * (1 + m.head[v] * 0.25);
        y = fy - (fy - y) * (1 - crouch * Math.min(1, h));
        x = cx + (x - cx) * (1 + crouch * 0.45 * Math.min(1, h));
      }
      pos[v * 2] = x - ax;
      pos[v * 2 + 1] = y - ay;
    }
  }
}
