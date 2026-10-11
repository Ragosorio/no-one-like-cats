/**
 * ANIMATED INTENTS: purposeful motion for the living cats in the normal game (docs/part-ii/31-animaciones-con-proposito.md).
 *
 * Every action is ANTICIPATION → ACTION → FOLLOW-THROUGH → SETTLE, shaped by the cat's temperament and weight
 * (art/temperament.ts): a heavy primordial gathers itself slowly and lands with inertia; a light, playful cat squashes,
 * stretches and bounces; a shy one flinches and hides; Canelo jumps first and pretends he never missed.
 *
 * An Intent is DATA: keyframe tracks over a few channels + cues (emotes/acts/owner calls) at given times.
 *   crouch, lean, headDy, headA, look → the puppet's additive pose layer (PuppetBrain.pose; same units as its targets)
 *   lift                              → hop height, in fractions of the cat's size (the painting's y)
 *   sx, sy                            → squash & stretch of the whole body (scale deltas, scaled by the cat's weight)
 * The IntentDriver plays them on one cat. It runs on the owner's clock (on twos on the island), writes nothing when idle,
 * allocates nothing per frame, and uses its OWN visual dice (core/rng Rng seeded by the cat's uid) — never the battle's.
 * «Reducir movimiento» (motionAmount 0): play() refuses and the cat keeps its plain, older acting.
 */
import type { Container } from 'pixi.js';
import { Rng } from '../core/rng';
import type { CatAct, CatEmote } from './puppetCore';
import { seedOf, type MotionProfile, type Quirk, type Reaction } from './temperament';

export type Channel = 'crouch' | 'lean' | 'headDy' | 'headA' | 'look' | 'lift' | 'sx' | 'sy';
export const CHANNELS: readonly Channel[] = ['crouch', 'lean', 'headDy', 'headA', 'look', 'lift', 'sx', 'sy'];
export type Ease = 'io' | 'out' | 'in' | 'lin';
/** [time s, value, how to arrive at it from the previous key] */
export type Key = [number, number, Ease?];
export interface Cue {
  t: number;
  emote?: [CatEmote, number];
  act?: CatAct;
  /** owner hook ('move', 'dash', 'swatText'…) */
  call?: string;
}
export interface Intent {
  name: string;
  dur: number;
  tracks: Partial<Record<Channel, Key[]>>;
  cues?: Cue[];
}

/** what the driver moves: the puppet (pose + emotes), the body to squash and the painting to lift */
export interface IntentBody {
  puppet: {
    pose: { lean: number; crouch: number; headDy: number; headA: number; look: number };
    emote(kind: CatEmote, strength?: number): void;
    doAct(kind: CatAct): void;
    destroyed: boolean;
  };
  /** squashed around its origin (the feet): IslandCat container */
  body: Container;
  /** lifted (y = -lift × size): the painting itself */
  lifted: Container;
  /** on-screen height in the body's local px */
  size: number;
}

const ease = (e: Ease | undefined, x: number) =>
  e === 'lin' ? x : e === 'out' ? 1 - (1 - x) * (1 - x) : e === 'in' ? x * x : x * x * (3 - 2 * x);

/** value of a track at time t (holds the first/last value outside) */
export function sample(keys: Key[], t: number): number {
  if (!keys.length) return 0;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t <= k[0]) {
      const p = keys[i - 1];
      const span = k[0] - p[0];
      const x = span > 0 ? (t - p[0]) / span : 1;
      return p[1] + (k[1] - p[1]) * ease(k[2], x);
    }
  }
  return keys[keys.length - 1][1];
}

// ================================================================== builders (pure: profile → Intent)
/** a little score to write tracks with relative time and append beats */
class Score {
  tracks: Partial<Record<Channel, Key[]>> = {};
  cues: Cue[] = [];
  end = 0;
  key(ch: Channel, t: number, v: number, e?: Ease) {
    const tr = (this.tracks[ch] ??= [[0, 0]]);
    tr.push([t, v, e]);
    this.end = Math.max(this.end, t);
    return this;
  }
  cue(c: Cue) {
    this.cues.push(c);
    return this;
  }
  done(name: string, tail = 0): Intent {
    for (const ch of Object.keys(this.tracks) as Channel[]) {
      const tr = this.tracks[ch]!;
      tr.sort((a, b) => a[0] - b[0]);
      const last = tr[tr.length - 1];
      if (last[1] !== 0) tr.push([last[0] + 0.12, 0, 'io']);
      this.end = Math.max(this.end, tr[tr.length - 1][0]);
    }
    return { name, dur: this.end + tail, tracks: this.tracks, cues: this.cues };
  }
}

/** time scale: temperament tempo × inertia of the mass */
const kOf = (p: MotionProfile) => p.temperament.tempo * p.weight.inertia;

/**
 * A hop with anticipation (crouch + squash), take-off stretch, airtime, landing squash and settle.
 * `height` 1 = the island's usual hop (a quarter of the cat); `forward` leans into the jump.
 */
function hopInto(s: Score, p: MotionProfile, t0: number, height = 1, forward = 0, cue = true) {
  const k = kOf(p);
  const sq = p.weight.squash;
  const a = 0.1 * k; // anticipation
  const air = 0.34 * Math.sqrt(p.weight.inertia) * (0.8 + 0.25 * height);
  const h = (0.25 * p.temperament.bounce * height) / Math.sqrt(p.weight.mass);
  const land = t0 + a + air;
  const settle = 0.24 * k;
  s.key('crouch', t0 + a, 0.85, 'out')
    .key('crouch', t0 + a + 0.05, -0.35, 'in')
    .key('crouch', t0 + a + air * 0.6, -0.08)
    .key('crouch', land, 0.55 + 0.2 * sq, 'in')
    .key('crouch', land + settle * 0.45, 0.08, 'out')
    .key('crouch', land + settle, 0, 'io');
  s.key('lift', t0 + a, 0).key('lift', t0 + a + air * 0.5, h, 'out').key('lift', land, 0, 'in');
  s.key('sx', t0 + a, 0.08 * sq, 'out')
    .key('sx', t0 + a + 0.06, -0.07 * sq, 'in')
    .key('sx', land - 0.02, -0.02 * sq)
    .key('sx', land + 0.04, 0.13 * sq, 'out')
    .key('sx', land + settle * 0.5, -0.03 * sq)
    .key('sx', land + settle, 0, 'io');
  s.key('sy', t0 + a, -0.1 * sq, 'out')
    .key('sy', t0 + a + 0.06, 0.11 * sq, 'in')
    .key('sy', land - 0.02, 0.03 * sq)
    .key('sy', land + 0.04, -0.15 * sq, 'out')
    .key('sy', land + settle * 0.5, 0.04 * sq)
    .key('sy', land + settle, 0, 'io');
  if (forward) s.key('lean', t0 + a, -0.2 * forward, 'out').key('lean', t0 + a + air * 0.4, 0.55 * forward, 'out').key('lean', land + settle * 0.6, -0.08 * forward).key('lean', land + settle, 0, 'io');
  if (cue) s.cue({ t: t0 + a, emote: ['happy', 1] });
  return land + settle;
}

/** a butt wiggle before a pounce (lean flutter, low crouch) */
function wiggle(s: Score, p: MotionProfile, t0: number, dur: number) {
  const n = Math.max(3, Math.round(dur * 9));
  s.key('crouch', t0 + 0.08, 0.6, 'out');
  for (let i = 1; i <= n; i++) s.key('lean', t0 + (dur * i) / n, (i % 2 ? 1 : -1) * 0.16 * (p.weight.squash + 0.2), 'io');
  s.key('crouch', t0 + dur, 0.7);
  return t0 + dur;
}

/** hold a posture: rise to it, keep it (with a breath), let it go */
function hold(s: Score, t0: number, rise: number, keep: number, fall: number, v: Partial<Record<Channel, number>>) {
  for (const [ch, val] of Object.entries(v) as [Channel, number][]) {
    s.key(ch, t0 + rise, val, 'out')
      .key(ch, t0 + rise + keep * 0.5, val * 0.94, 'io')
      .key(ch, t0 + rise + keep, val, 'io')
      .key(ch, t0 + rise + keep + fall, 0, 'io');
  }
  return t0 + rise + keep + fall;
}

export interface HopOpts {
  height?: number;
  double?: boolean;
  forward?: number;
}
export function hopIntent(p: MotionProfile, o: HopOpts = {}): Intent {
  const s = new Score();
  let t = hopInto(s, p, 0, o.height ?? 1, o.forward ?? 0);
  if (o.double) t = hopInto(s, p, t - 0.12 * kOf(p), (o.height ?? 1) * 0.6, o.forward ?? 0, false);
  return s.done('hop');
}

/** walking off: lean back + gather (anticipation), push off forward */
export function departIntent(p: MotionProfile): Intent {
  const k = kOf(p);
  const s = new Score();
  s.key('lean', 0.12 * k, -0.28, 'out').key('lean', 0.24 * k, 0.32 * p.temperament.bounce, 'in').key('lean', 0.5 * k, 0, 'io');
  s.key('crouch', 0.12 * k, 0.4, 'out').key('crouch', 0.24 * k, -0.1, 'in').key('crouch', 0.42 * k, 0, 'io');
  s.key('sy', 0.12 * k, -0.05 * p.weight.squash, 'out').key('sy', 0.24 * k, 0.04 * p.weight.squash).key('sy', 0.4 * k, 0, 'io');
  return s.done('depart');
}
/** seconds of the depart's anticipation (the owner holds the walk until then) */
export const departLead = (p: MotionProfile) => 0.2 * kOf(p);

/** arriving: momentum carries the top forward, it sways back and settles (heavier = longer, slower sway) */
export function arriveIntent(p: MotionProfile, skid = 1): Intent {
  const k = kOf(p);
  const m = p.weight.mass;
  const s = new Score();
  const over = 0.3 * p.temperament.bounce * skid * (0.75 + 0.25 * m);
  s.key('lean', 0.07 * k, over, 'out').key('lean', 0.28 * k, -over * 0.35, 'io').key('lean', 0.48 * k, over * 0.12, 'io').key('lean', 0.66 * k, 0, 'io');
  s.key('crouch', 0.08 * k, 0.22 * skid, 'out').key('crouch', 0.3 * k, 0, 'io');
  s.key('sx', 0.08 * k, 0.05 * p.weight.squash * skid, 'out').key('sx', 0.3 * k, 0, 'io');
  s.key('sy', 0.08 * k, -0.05 * p.weight.squash * skid, 'out').key('sy', 0.3 * k, 0, 'io');
  return s.done('arrive');
}

/** a reaction to something; `dir` = which side it is on (+1 = where the cat faces) */
export function reactionIntent(r: Reaction, p: MotionProfile, rng: Rng, dir = 1): Intent {
  const k = kOf(p);
  const sq = p.weight.squash;
  const s = new Score();
  switch (r) {
    case 'flinch':
      s.cue({ t: 0, emote: ['hurt', 0.35] });
      s.key('crouch', 0.06, 0.7, 'out').key('crouch', 0.35 * k, 0.25).key('crouch', 0.7 * k, 0, 'io');
      s.key('lean', 0.06, -0.5 * dir, 'out').key('lean', 0.6 * k, 0, 'io');
      s.key('sx', 0.06, 0.07 * sq, 'out').key('sx', 0.4 * k, 0, 'io');
      s.key('sy', 0.06, -0.1 * sq, 'out').key('sy', 0.4 * k, 0, 'io');
      return s.done(r);
    case 'hide': {
      s.cue({ t: 0, emote: ['hurt', 0.4] });
      s.key('lean', 0.06, -0.55 * dir, 'out');
      s.key('sx', 0.06, 0.08 * sq, 'out').key('sx', 0.3, 0.03 * sq);
      s.key('sy', 0.06, -0.12 * sq, 'out').key('sy', 0.3, -0.05 * sq);
      const keep = 1.6 + rng.next() * 1.2;
      s.key('crouch', 0.06, 0.75, 'out').key('crouch', 0.3, 0.62);
      // a peek halfway (the head comes up a little, then ducks again)
      s.key('crouch', 0.3 + keep * 0.45, 0.62).key('crouch', 0.3 + keep * 0.55, 0.38, 'io').key('crouch', 0.3 + keep * 0.7, 0.64, 'out');
      s.key('lean', 0.3 + keep, -0.4 * dir).key('lean', 0.3 + keep + 0.6 * k, 0, 'io');
      s.key('crouch', 0.3 + keep, 0.6).key('crouch', 0.3 + keep + 0.7 * k, 0, 'io');
      s.key('sx', 0.3 + keep, 0.03 * sq).key('sx', 0.3 + keep + 0.5, 0, 'io');
      s.key('sy', 0.3 + keep, -0.05 * sq).key('sy', 0.3 + keep + 0.5, 0, 'io');
      s.cue({ t: 0.3 + keep * 0.5, emote: ['surprise', 0.25] });
      return s.done(r);
    }
    case 'brace':
      s.key('lean', 0.08 * k, -0.15 * dir, 'out');
      s.cue({ t: 0.18 * k, emote: ['attack', 0.45] });
      hold(s, 0.08 * k, 0.12 * k, 1.1, 0.4 * k, { crouch: 0.38, lean: 0.32 * dir, sx: 0.05 * sq, sy: -0.03 * sq });
      return s.done(r);
    case 'advance': {
      s.key('lean', 0.14 * k, -0.35 * dir, 'out').key('crouch', 0.14 * k, 0.5, 'out');
      s.key('lean', 0.3 * k, 0.7 * dir, 'in').key('crouch', 0.3 * k, -0.25, 'in');
      s.key('lift', 0.3 * k, 0.05 * p.temperament.bounce, 'out').key('lift', 0.45 * k, 0, 'in');
      s.key('sy', 0.14 * k, -0.08 * sq, 'out').key('sy', 0.3 * k, 0.08 * sq, 'in').key('sy', 0.46 * k, -0.06 * sq).key('sy', 0.66 * k, 0, 'io');
      s.key('lean', 0.6 * k, 0.25 * dir, 'io').key('lean', 0.9 * k, 0, 'io').key('crouch', 0.55 * k, 0.1, 'io').key('crouch', 0.8 * k, 0, 'io');
      s.cue({ t: 0.3 * k, emote: ['attack', 0.5] }).cue({ t: 0.3 * k, call: 'move' });
      return s.done(r);
    }
    case 'gawk':
      // look FIRST (ears kick, head comes up), THEN the body rises on its toes
      s.cue({ t: 0, emote: ['surprise', 0.55] });
      s.key('headDy', 0.12, -4, 'out');
      hold(s, 0.22 * k, 0.25 * k, 1.1 + rng.next() * 0.6, 0.5 * k, { crouch: -0.32, headDy: -11, lean: -0.08 * dir, sy: 0.05 * sq });
      return s.done(r);
    case 'bounce':
      return hopIntent(p, { double: rng.next() < p.temperament.doubleHop + 0.15 });
    case 'cheer': {
      let t = hopInto(s, p, 0, 0.85);
      for (let i = 0; i < 2; i++) {
        s.key('crouch', t + 0.08 * k, 0.32, 'out').key('crouch', t + 0.18 * k, -0.12, 'in');
        s.key('sy', t + 0.08 * k, -0.05 * sq, 'out').key('sy', t + 0.18 * k, 0.04 * sq, 'in');
        t += 0.2 * k;
      }
      s.key('crouch', t + 0.12, 0, 'io').key('sy', t + 0.12, 0, 'io');
      s.cue({ t: t - 0.2, emote: ['happy', 0.8] });
      return s.done(r);
    }
    case 'puff':
      s.cue({ t: 0.12 * k, emote: ['happy', 0.4] });
      s.key('crouch', 0.1 * k, 0.2, 'out');
      hold(s, 0.1 * k, 0.18 * k, 1.1, 0.45 * k, { crouch: -0.22, sx: 0.1 * sq, sy: 0.03 * sq, headDy: -6, lean: -0.12 });
      return s.done(r);
    case 'pounce': {
      const t = wiggle(s, p, 0, 0.42 * k);
      hopInto(s, p, t - 0.1 * k, 0.75, 1);
      return s.done(r);
    }
    case 'late': {
      const t0 = 0.25 + rng.next() * 0.3;
      s.cue({ t: t0 + 0.5 * k, emote: ['surprise', 0.25] });
      s.key('headDy', t0, 0).key('headDy', t0 + 0.8 * k, -6, 'io').key('headDy', t0 + 1.7 * k, -5).key('headDy', t0 + 2.6 * k, 0, 'io');
      s.key('crouch', t0, 0).key('crouch', t0 + 0.8 * k, -0.12, 'io').key('crouch', t0 + 1.7 * k, -0.1).key('crouch', t0 + 2.6 * k, 0.12, 'io');
      return s.done(r);
    }
    case 'glare':
      s.cue({ t: 0.1, emote: ['hurt', 0.22] });
      hold(s, 0, 0.3 * k, 1.3, 0.5 * k, { crouch: 0.12, lean: -0.22 * dir, headDy: 3 });
      return s.done(r);
    case 'preen':
      hold(s, 0, 0.3 * k, 0.8, 0.4 * k, { crouch: -0.16, headDy: -8, lean: -0.08 });
      s.cue({ t: 0.3 * k + 0.9, act: 'groom' });
      return s.done(r);
    case 'nod':
      s.key('headDy', 0.35 * k, 7, 'io').key('headDy', 0.8 * k, -2, 'io').key('headDy', 1.1 * k, 0, 'io');
      s.key('crouch', 0.35 * k, 0.12, 'io').key('crouch', 0.9 * k, 0, 'io');
      s.key('headA', 0.35 * k, 0.03 * dir, 'io').key('headA', 1 * k, 0, 'io');
      return s.done(r);
    case 'loom':
      s.key('crouch', 0.25 * k, 0.25, 'out');
      s.cue({ t: 0.9 * k, emote: ['surprise', 0.22] });
      hold(s, 0.25 * k, 0.65 * k, 1.2, 0.8 * k, { crouch: -0.5, headDy: -10, sy: 0.08 * sq, sx: -0.035 * sq });
      // a heavy body settles past its rest point
      s.key('crouch', 0.25 * k + 0.65 * k + 1.2 + 0.8 * k + 0.25 * k, 0.08, 'out').key('crouch', 0.25 * k + 0.65 * k + 1.2 + 0.8 * k + 0.6 * k, 0, 'io');
      return s.done(r);
    case 'swat': {
      // Canelo: wiggle, a big leap at it (paw first), misses, lands heavy, grooms like nothing happened
      const t = wiggle(s, p, 0, 0.32 * k);
      s.cue({ t: t, emote: ['attack', 1] }).cue({ t: t + 0.05, call: 'swatText' });
      s.key('headDy', t + 0.05, -12, 'out').key('headDy', t + 0.4, 0, 'io');
      const end = hopInto(s, p, t - 0.08 * k, 1.5, 0.5, false);
      s.key('sx', end - 0.05, 0.02 * sq);
      s.cue({ t: end + 0.15, act: 'groom' });
      return s.done(r, 0.2);
    }
    case 'zoom': {
      const end = hopInto(s, p, 0, 1.05, 0.8);
      hopInto(s, p, end - 0.14 * kOf(p), 0.65, 0.8, false);
      s.cue({ t: 0.05, act: 'flick' });
      return s.done(r);
    }
    case 'ignore':
    default:
      s.cue({ t: 0, act: 'flick' });
      s.key('headA', 0.15, 0.02 * dir, 'out').key('headA', 0.5, 0, 'io');
      return s.done('ignore');
  }
}

/** an idle quirk (the cat does it on its own while it waits) */
export function quirkIntent(q: Quirk, p: MotionProfile, rng: Rng): Intent {
  const k = kOf(p);
  const sq = p.weight.squash;
  const s = new Score();
  switch (q) {
    case 'tap': {
      // impatient: 3–4 quick foot-taps, then a huff
      const n = 3 + (rng.next() < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const t = 0.05 + i * 0.17 * k;
        s.key('crouch', t + 0.07 * k, 0.28, 'out').key('crouch', t + 0.15 * k, 0.02, 'in');
        s.key('sy', t + 0.07 * k, -0.04 * sq, 'out').key('sy', t + 0.15 * k, 0, 'in');
        s.key('lean', t + 0.07 * k, 0.12, 'out').key('lean', t + 0.15 * k, 0.04, 'in');
      }
      const e = 0.05 + n * 0.17 * k;
      s.key('lean', e + 0.25 * k, -0.18, 'io').key('lean', e + 0.6 * k, 0, 'io');
      s.key('headDy', e + 0.2 * k, 3, 'io').key('headDy', e + 0.6 * k, 0, 'io');
      s.cue({ t: e, act: 'flick' });
      return s.done(q);
    }
    case 'pounce': {
      const t = wiggle(s, p, 0, 0.36 * k);
      hopInto(s, p, t - 0.1 * k, 0.5, 1);
      return s.done(q);
    }
    case 'glance':
      s.cue({ t: 0, act: 'look' });
      s.key('crouch', 0.08, 0.18, 'out').key('crouch', 0.5 * k, 0.1).key('crouch', 1.4 * k, 0, 'io');
      s.key('lean', 0.08, -0.12, 'out').key('lean', 1.2 * k, 0, 'io');
      return s.done(q);
    case 'sniff': {
      const t0 = 0.4 * k;
      s.key('headDy', t0, 9, 'io').key('lean', t0, 0.28, 'io').key('crouch', t0, 0.14, 'io');
      for (let i = 1; i <= 6; i++) s.key('headDy', t0 + i * 0.12, 9 + (i % 2 ? -1.8 : 1.2), 'io');
      s.key('headDy', t0 + 1.2, 0, 'io').key('lean', t0 + 1.25, 0, 'io').key('crouch', t0 + 1.2, 0, 'io');
      return s.done(q);
    }
    case 'puff':
      return reactionIntent('puff', p, rng);
    case 'preen':
      return reactionIntent('preen', p, rng);
    case 'nod': {
      // dozing off on its feet… and the jolt awake
      s.key('headDy', 1.2 * k, 8, 'io').key('crouch', 1.2 * k, 0.16, 'io');
      s.key('headDy', 1.32 * k, -3, 'out').key('crouch', 1.32 * k, -0.06, 'out');
      s.key('headDy', 1.7 * k, 0, 'io').key('crouch', 1.7 * k, 0, 'io');
      s.cue({ t: 1.3 * k, emote: ['surprise', 0.3] });
      return s.done(q);
    }
    case 'stretch':
      s.cue({ t: 0, act: 'stretch' });
      s.key('sx', 0.5 * k, 0.05 * sq, 'io').key('sx', 1.4 * k, 0, 'io');
      return s.done(q, 0.6);
    case 'zoom':
      // the anticipation of a sprint; the owner runs the dash ('dash' cue) and the skid on arrival
      s.key('crouch', 0.14 * k, 0.55, 'out').key('lean', 0.14 * k, -0.3, 'out').key('sy', 0.14 * k, -0.08 * sq, 'out');
      s.key('crouch', 0.26 * k, -0.1, 'in').key('lean', 0.26 * k, 0.5, 'in').key('sy', 0.26 * k, 0.05 * sq, 'in');
      s.key('crouch', 0.45 * k, 0, 'io').key('sy', 0.45 * k, 0, 'io').key('lean', 0.45 * k, 0, 'io');
      s.cue({ t: 0.22 * k, call: 'dash' }).cue({ t: 0, act: 'flick' });
      return s.done(q);
    case 'flare':
      s.cue({ t: 0.12 * k, emote: ['attack', 0.55] }).cue({ t: 0.3 * k, act: 'flick' });
      s.key('crouch', 0.1 * k, 0.3, 'out').key('lean', 0.1 * k, -0.15, 'out');
      s.key('lean', 0.22 * k, 0.45, 'in').key('crouch', 0.22 * k, -0.1, 'in');
      s.key('lean', 0.7 * k, 0, 'io').key('crouch', 0.6 * k, 0, 'io');
      return s.done(q);
    case 'glare':
      return reactionIntent('glare', p, rng, rng.next() < 0.5 ? -1 : 1);
    case 'scan': {
      const d = rng.next() < 0.5 ? -1 : 1;
      hold(s, 0, 0.35 * k, 1.1 + rng.next() * 0.8, 0.4 * k, { lean: 0.26 * d, look: 0.7 * d, headDy: -3 });
      return s.done(q);
    }
    case 'sigh':
      hold(s, 0, 0.7 * k, 0.4, 1 * k, { crouch: 0.32, sx: 0.04 * sq, sy: -0.03 * sq, headDy: 3 });
      return s.done(q);
    case 'loom':
      return reactionIntent('loom', p, rng);
    case 'bow':
      s.key('headDy', 0.6 * k, 9, 'io').key('headDy', 1.5 * k, 9).key('headDy', 2.2 * k, 0, 'io');
      s.key('crouch', 0.6 * k, 0.18, 'io').key('crouch', 1.5 * k, 0.18).key('crouch', 2.2 * k, 0, 'io');
      return s.done(q);
    case 'swat':
      return reactionIntent('swat', p, rng);
  }
  return reactionIntent('ignore', p, rng);
}

// ================================================================== the driver (one per cat)
interface Run {
  intent: Intent;
  t: number;
  delay: number;
  dir: number;
  cue: number;
}

export interface PlayOpts {
  /** seconds before it starts */
  delay?: number;
  /** mirror lean/look/headA (+1 = toward where the cat faces) */
  dir?: number;
  /** keep what's playing and layer this on top (default: replace) */
  layer?: boolean;
}

export class IntentDriver {
  readonly rng: Rng;
  /** the temperament's standing posture (0..1, eased): on while awake and free */
  posture = 0;
  private postureK = 0;
  private runs: Run[] = [];
  private touched = false;
  /** owner hook for cues with `call` */
  onCue: ((name: string) => void) | null = null;
  /** sums of this frame (read by tests and the lab) */
  readonly out: Record<Channel, number> = { crouch: 0, lean: 0, headDy: 0, headA: 0, look: 0, lift: 0, sx: 0, sy: 0 };

  constructor(
    readonly body: IntentBody,
    readonly profile: MotionProfile,
    seed: string | number = 0,
  ) {
    this.rng = new Rng(typeof seed === 'number' ? seed : seedOf(seed));
  }

  /** something is playing (or waiting to) */
  get busy() {
    return this.runs.length > 0;
  }
  /** the name of what's playing now ('' = nothing) */
  get playing() {
    return this.runs[0]?.intent.name ?? '';
  }

  /** play an intent; false when motion is off (the owner falls back to its plain acting) */
  play(intent: Intent, amount: number, o: PlayOpts = {}): boolean {
    if (amount <= 0) return false;
    if (!o.layer) this.runs.length = 0;
    this.runs.push({ intent, t: 0, delay: Math.max(0, o.delay ?? 0), dir: o.dir ?? 1, cue: 0 });
    return true;
  }
  /** stop everything now (the body eases back through the owner's springs) */
  clear() {
    this.runs.length = 0;
  }

  /** advance and write the pose; `amount` 0 releases everything at once */
  update(dt: number, amount: number) {
    const o = this.out;
    for (const ch of CHANNELS) o[ch] = 0;
    if (amount <= 0) {
      this.runs.length = 0;
      this.postureK = 0;
    }
    for (let i = this.runs.length - 1; i >= 0; i--) {
      const r = this.runs[i];
      let step = dt;
      if (r.delay > 0) {
        r.delay -= dt;
        if (r.delay > 0) continue;
        step = Math.max(0, dt + r.delay);
      }
      r.t += step;
      const cues = r.intent.cues;
      if (cues) {
        while (r.cue < cues.length && cues[r.cue].t <= r.t) this.fire(cues[r.cue++]);
      }
      if (r.t >= r.intent.dur) {
        this.runs.splice(i, 1);
        continue;
      }
      const tr = r.intent.tracks;
      for (const ch of CHANNELS) {
        const keys = tr[ch];
        if (!keys) continue;
        const v = sample(keys, r.t);
        o[ch] += ch === 'lean' || ch === 'look' || ch === 'headA' ? v * r.dir : v;
      }
    }
    // standing posture by temperament (a strut, a shy hunch, a lifted chin)
    this.postureK += ((amount > 0 ? this.posture : 0) - this.postureK) * Math.min(1, dt * 3);
    const pk = this.postureK;
    if (pk > 0.001) {
      const ps = this.profile.temperament.posture;
      o.lean += ps.lean * pk;
      o.crouch += (ps.crouch - ps.chin * 0.08) * pk;
      o.headDy -= ps.chin * 6 * pk;
    }
    this.write();
  }

  private fire(c: Cue) {
    const p = this.body.puppet;
    if (p.destroyed) return;
    if (c.emote) p.emote(c.emote[0], c.emote[1]);
    if (c.act) p.doAct(c.act);
    if (c.call) this.onCue?.(c.call);
  }

  private write() {
    const o = this.out;
    const b = this.body;
    if (b.puppet.destroyed) return;
    const pose = b.puppet.pose;
    pose.lean = o.lean;
    pose.crouch = o.crouch;
    pose.headDy = o.headDy;
    pose.headA = o.headA;
    pose.look = o.look;
    const moving = o.lift !== 0 || o.sx !== 0 || o.sy !== 0;
    // the body and the painting are only touched while something plays (and once more to put them back), so the
    // owner's own tweens on them (the old hop, a speaking bounce) are never fought when nothing plays
    if (moving || this.touched) {
      if (!b.body.destroyed) b.body.scale.set(1 + o.sx, 1 + o.sy);
      if (!b.lifted.destroyed) b.lifted.y = o.lift ? -o.lift * b.size : 0;
      this.touched = moving;
    }
  }

  /** put everything back to rest (owner is being destroyed or switches to plain acting) */
  reset() {
    this.runs.length = 0;
    this.postureK = 0;
    for (const ch of CHANNELS) this.out[ch] = 0;
    this.touched = true;
    this.write();
  }
}
