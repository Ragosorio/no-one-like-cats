/**
 * PELÍCULAS — the 2.5D camera (pure math; tests/filmCamera.test.ts).
 *
 * A pinhole camera over flat PLANES at depths (the multiplane). Every plane is authored in the 1920×1080 design box
 * as it looks with the camera at rest; depth d (focal = 1000 = the subject plane) only decides how it reacts:
 *   dolly  (z)    near planes grow faster than far ones (true parallax), unlike a zoom
 *   zoom   (fov)  every plane grows the same (the lens)
 *   dolly zoom    z and fov against each other: the subject stays, the background breathes (vertigo)
 *   truck / crane (x / y)  near planes slide more than far ones
 *   roll          the Dutch angle (the whole frame)
 *   focus         the depth in focus: each plane's blur = |d − focus| / depthOfField (rack focus)
 *   hand          handheld: a deterministic multi-octave wobble (x, y, roll) — off with «Reducir movimiento»
 *   whip          a whip pan offset (its speed drives the motion blur in the post)
 *
 * Everything is a pure function of scene-local time: the same instant always frames the same.
 */
import type { CamEase, CamKey, CamState } from './types';

export const FOCAL = 1000;
export const REST: CamState = { x: 960, y: 540, z: 0, fov: 1, roll: 0, focus: FOCAL, hand: 0, whip: 0 };
const FIELDS: (keyof CamState)[] = ['x', 'y', 'z', 'fov', 'roll', 'focus', 'hand', 'whip'];

const EASE: Record<CamEase, (x: number) => number> = {
  linear: (x) => x,
  in: (x) => x * x * x,
  out: (x) => 1 - (1 - x) ** 3,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  expoOut: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  hold: (x) => (x >= 1 ? 1 : 0),
};
export const camEase = (e: CamEase, x: number) => EASE[e](Math.max(0, Math.min(1, x)));

/**
 * The camera at scene-local time t. Keys are read in order: each field tweens from its value at the previous key
 * that set it to this key's value, over the gap between those two keys, with this key's ease.
 */
export function camAt(keys: CamKey[] | undefined, t: number, base: CamState = REST): CamState {
  const out: CamState = { ...base };
  if (!keys?.length) return out;
  for (const f of FIELDS) {
    let prevT = 0;
    let prevV = base[f];
    let cur = base[f];
    for (const k of keys) {
      const val = k[f];
      if (val === undefined) continue;
      if (k.t <= t) {
        prevT = k.t;
        prevV = val;
        cur = val;
        continue;
      }
      // the move into k is happening now
      const span = k.t - prevT;
      const x = span <= 0 ? 1 : (t - prevT) / span;
      cur = prevV + (val - prevV) * camEase(k.ease ?? 'inOut', x);
      break;
    }
    out[f] = cur;
  }
  return out;
}

// ------------------------------------------------------------------ deterministic noise (handheld)
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
/** smooth value noise in [-1, 1] */
export function noise1(x: number, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return (hash(i + seed * 57.3) * (1 - u) + hash(i + 1 + seed * 57.3) * u) * 2 - 1;
}
/** handheld wobble at t (px, px, rad) for an amplitude in px: two octaves, a slow drift and a breathing roll */
export function handheld(t: number, amp: number, seed = 3): [number, number, number] {
  if (amp <= 0) return [0, 0, 0];
  const x = noise1(t * 0.55, seed) * 0.7 + noise1(t * 1.9, seed + 11) * 0.3;
  const y = noise1(t * 0.47, seed + 23) * 0.7 + noise1(t * 2.3, seed + 37) * 0.3;
  const r = noise1(t * 0.31, seed + 41) * 0.0035;
  return [x * amp, y * amp, r * (amp / 10)];
}

// ------------------------------------------------------------------ projection
/**
 * How a plane is placed this frame: every plane is AUTHORED in the 1920×1080 design box as it looks with the camera
 * at rest; the camera only changes how much it moves and grows. The stage sets `node.pivot = (px, py)`,
 * `node.position = (960, 540)`, `node.scale = s` — so a point p lands at 960 + (p − pivot) · s.
 */
export interface PlaneXform {
  px: number;
  py: number;
  /** scale of the plane (fov · d / (d − z)) */
  s: number;
  /** blur amount 0..1 (rack focus) */
  blur: number;
  /** the plane is behind the camera (don't draw) */
  hidden: boolean;
}
export interface FrameCam {
  state: CamState;
  /** final camera centre after handheld / whip (design px at the focal plane) */
  cx: number;
  cy: number;
  roll: number;
  /** motion blur vector for the post (screen px, from the whip) */
  motion: [number, number];
}
/**
 * The frame's camera: keys + handheld + whip, with «Reducir movimiento» (handheld off, whip → none: the transition
 * library plays a dissolve instead; Dutch roll ×0.3; slow travel kept — the timeline is the same).
 */
export function frameCam(keys: CamKey[] | undefined, t: number, o: { reduceMotion?: boolean; seed?: number; dt?: number } = {}): FrameCam {
  const st = camAt(keys, t);
  const rm = !!o.reduceMotion;
  const [hx, hy, hr] = rm ? [0, 0, 0] : handheld(t, st.hand, o.seed ?? 3);
  const whip = rm ? 0 : st.whip;
  // motion: the whip's speed (finite difference, deterministic)
  const dt = o.dt ?? 1 / 60;
  let mx = 0;
  if (!rm && keys?.some((k) => k.whip !== undefined)) {
    const w0 = camAt(keys, t - dt).whip;
    mx = (st.whip - w0) * (st.fov || 1);
  }
  // «Reducir movimiento»: a Dutch angle is kept as a hint (×0.3), never a spin
  return { state: st, cx: st.x + hx + whip, cy: st.y + hy, roll: (st.roll + hr) * (rm ? 0.3 : 1), motion: [Math.max(-80, Math.min(80, mx)), 0] };
}

/**
 * Where a plane at depth d lands. At rest every plane is 1:1; a camera move of Δ px slides a plane by Δ · focal / d
 * (near planes — d < focal — slide more, the sky barely moves), a dolly grows it by d / (d − z), the lens by fov.
 * `dof` = depth of field (world px of depth per full blur); `parallax` scales the slide (0 = pinned to the screen).
 */
export function project(fc: FrameCam, d: number, o: { dof?: number; parallax?: number } = {}): PlaneXform {
  const st = fc.state;
  const dist = d - st.z;
  if (dist <= 20) return { px: 960, py: 540, s: 0, blur: 0, hidden: true };
  const s = (st.fov * d) / dist;
  const r = (FOCAL / d) * (o.parallax ?? 1);
  const dof = o.dof ?? 1400;
  const blur = Math.max(0, Math.min(1, Math.abs(d - st.focus) / dof));
  return { px: 960 + (fc.cx - 960) * r, py: 540 + (fc.cy - 540) * r, s, blur, hidden: false };
}
/** a plane point → screen (design box), before the frame's roll */
export function toScreen(x: PlaneXform, p: [number, number]): [number, number] {
  return [960 + (p[0] - x.px) * x.s, 540 + (p[1] - x.py) * x.s];
}

/** the keys a scene plays: its calm camera with «Reducir movimiento» when it has one */
export const sceneCam = (s: { cam?: CamKey[]; camRm?: CamKey[] }, reduceMotion: boolean) => (reduceMotion && s.camRm ? s.camRm : s.cam);

/** the BOIL of painted / hand-drawn frames: a key that changes `fps` times a second — frozen with «Reducir movimiento» */
export const boilStep = (lt: number, reduceMotion: boolean, fps = 8) => (reduceMotion ? 0 : Math.floor(lt * fps));

/** «Reducir movimiento»: parallax depth is flattened (planes move together, ×0.3 of the difference) */
export function flatten(d: number, reduceMotion: boolean, k = 0.3) {
  return reduceMotion ? FOCAL + (d - FOCAL) * k : d;
}

// ------------------------------------------------------------------ named moves (sugar that writes keys)
export const moves = {
  /** push in (or pull out with a negative dz) */
  dolly: (t0: number, t1: number, z0: number, z1: number, ease: CamEase = 'inOut'): CamKey[] => [
    { t: t0, z: z0 },
    { t: t1, z: z1, ease },
  ],
  /** vertical move */
  crane: (t0: number, t1: number, y0: number, y1: number, ease: CamEase = 'inOut'): CamKey[] => [
    { t: t0, y: y0 },
    { t: t1, y: y1, ease },
  ],
  /** horizontal move (truck) */
  truck: (t0: number, t1: number, x0: number, x1: number, ease: CamEase = 'inOut'): CamKey[] => [
    { t: t0, x: x0 },
    { t: t1, x: x1, ease },
  ],
  /** vertigo: dolly in while the lens widens so the subject plane (at depth d) keeps its size */
  dollyZoom: (t0: number, t1: number, dz: number, d = FOCAL, ease: CamEase = 'inOut'): CamKey[] => [
    { t: t0, z: 0, fov: 1 },
    { t: t1, z: dz, fov: (d - dz) / d, ease },
  ],
  /** rack focus from one depth to another */
  rack: (t0: number, t1: number, from: number, to: number, ease: CamEase = 'inOut'): CamKey[] => [
    { t: t0, focus: from },
    { t: t1, focus: to, ease },
  ],
  /** a whip pan: a fast lateral throw (with motion blur) that lands back at 0 offset on the next framing */
  whip: (t0: number, dur: number, dist: number): CamKey[] => [
    { t: t0, whip: 0 },
    { t: t0 + dur, whip: dist, ease: 'in' },
    { t: t0 + dur + 0.0001, whip: 0, ease: 'hold' },
  ],
  /** Dutch angle in / out */
  dutch: (t0: number, t1: number, r: number, ease: CamEase = 'inOut'): CamKey[] => [
    { t: t0, roll: 0 },
    { t: t1, roll: r, ease },
  ],
};
/** merge move lists into one sorted key list (stable: same-time keys keep their order) */
export function shot(...lists: CamKey[][]): CamKey[] {
  return lists
    .flat()
    .map((k, i) => ({ k, i }))
    .sort((a, b) => a.k.t - b.k.t || a.i - b.i)
    .map((x) => x.k);
}
