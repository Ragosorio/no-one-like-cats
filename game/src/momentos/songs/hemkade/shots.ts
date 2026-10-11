/**
 * HEMKADE — the 3D camera: named SHOTS (the score switches them on the beat: 'shot' keys are strings, so a switch is a
 * hard anime cut) that move on their own through their local time, plus authored knobs ('sh.*' keys tween).
 * Every shot frames real geometry: the body, the ship, a seal, the eye, the line.
 */
import * as THREE from 'three';

export interface ShotCtx {
  /** shot-local time (s) and the whole Momento time */
  lt: number;
  m: number;
  /** body point by (u along tail→snout, angle around: −π/2 = belly = sky side) in world space */
  body(u: number, th: number, lift?: number): THREE.Vector3;
  heart: THREE.Vector3;
  head: THREE.Vector3;
  eye: THREE.Vector3;
  /** outward normal of the body at the eye */
  eyeN: THREE.Vector3;
  ship: THREE.Vector3;
  shipFwd: THREE.Vector3;
  bow: THREE.Vector3;
  seal(i: number): THREE.Vector3;
  lineY: number;
  /** knobs from the score ('sh.a' angle, 'sh.d' distance, 'sh.h' height, 'sh.f' fov, 'sh.p' progress 0..1, 'sh.s' seal) */
  a: number;
  d: number;
  h: number;
  f: number;
  p: number;
  s: number;
  /** «reducir movimiento»: 0.3 (spins and drifts slow down), else 1 */
  calm: number;
}
export interface Cam {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  roll: number;
}

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

export const SHOTS: Record<string, (c: ShotCtx) => Cam> = {
  /** under the sea: our tiny hull up at the bright surface, the shape passing beneath */
  abyss: (c) => ({ pos: V(c.ship.x - 40 + c.lt * 5, -58 - c.lt * 1.5, c.ship.z + 170), look: V(c.ship.x - 90, -30, c.ship.z - 80), fov: 64, roll: 0.06 }),
  /** the eye opening in the deep, very close */
  eye: (c) => {
    const out = c.eyeN.clone();
    const fwd = c.head.clone().sub(c.heart).normalize();
    const d = c.d || 46;
    return { pos: c.eye.clone().addScaledVector(out, Math.max(24, d - c.lt * (2 + c.p * 10))).addScaledVector(fwd, -10).add(V(0, 6, 0)), look: c.eye.clone().addScaledVector(fwd, -6), fov: c.f || 34, roll: -0.05 };
  },
  /** low over the swell, our ship in front, the horizon behind */
  surface: (c) => ({ pos: c.ship.clone().add(V(-38 - c.lt * 3, 7, 26)), look: c.ship.clone().add(V(60, 14 + c.h, -20)), fov: 54, roll: -0.03 }),
  /** from the waterline UP at the body bursting out (low, wide, rising) */
  breach: (c) => {
    const at = c.body(0.86, -Math.PI / 2);
    const pos = V(at.x + 170 + c.a * 80, 46 + c.lt * 14, at.z + 240);
    return { pos, look: at.clone().add(V(0, 40 + c.lt * 18, 0)), fov: 66, roll: 0.08 };
  },
  /** tracking along the flank, head → tail, the body a wall on the left */
  flank: (c) => {
    const u = 0.95 - (c.p || ease(c.lt / 6)) * 0.7;
    const at = c.body(u, 0, 0);
    const out = at.clone().sub(c.body(u, Math.PI, 0)).normalize();
    return { pos: at.clone().addScaledVector(out, c.d || 90).add(V(0, c.h || 20, 0)), look: c.body(u - 0.12, 0.2, 0).add(V(0, 10, 0)), fov: 70, roll: -0.12 };
  },
  /** orbit the heart (sh.a advances; the lt drift keeps it alive) */
  orbit: (c) => {
    const a = c.a + c.lt * 0.12;
    const d = c.d || 620;
    return { pos: c.heart.clone().add(V(Math.cos(a) * d, c.h || 80, Math.sin(a) * d)), look: c.heart.clone().add(V(0, 20, 0)), fov: c.f || 48, roll: 0 };
  },
  /** from our deck, past the bow, up at the belly / a seal */
  deck: (c) => {
    const tgt = c.s >= 0 ? c.seal(Math.round(c.s)) : c.heart;
    const back = c.shipFwd.clone().multiplyScalar(-14);
    const pos = c.ship.clone().add(back).add(V(0, 9, 3));
    // telephoto on a seal (it reads as a target, the chain and the body stacked behind it); wide on the heart
    const dist = pos.distanceTo(tgt);
    const fov = c.s >= 0 ? Math.min(58, Math.max(24, (2 * Math.atan(105 / Math.max(1, dist)) * 180) / Math.PI)) : 58;
    return { pos, look: tgt.clone().lerp(c.bow, 0.05), fov, roll: 0.1 };
  },
  /** three-quarter hero on our ship, the colossus filling the back */
  hero: (c) => {
    const side = V(-c.shipFwd.z, 0, c.shipFwd.x);
    return { pos: c.ship.clone().addScaledVector(c.shipFwd, 22 + c.lt * 1.5).addScaledVector(side, 24).add(V(0, 3 + c.h, 0)), look: c.ship.clone().add(V(0, 6, 0)).lerp(c.heart, 0.12), fov: 50, roll: -0.08 };
  },
  /** low on the sea, looking up a chain as it rises out of the water toward the line */
  rise: (c) => {
    const s = c.seal(Math.max(0, Math.round(c.s)));
    const base = V(s.x, 0, s.z);
    const d = c.d || 170;
    const pos = base.clone().add(V(Math.cos(c.a) * d, 14 + c.lt * 3, Math.sin(c.a) * d));
    return { pos, look: s.clone().lerp(base, 0.45), fov: 64, roll: 0.1 };
  },
  /** under the body looking up: the belly, the chains, the line in the sky */
  under: (c) => {
    const a = c.a + c.lt * 0.05;
    return { pos: c.heart.clone().add(V(Math.cos(a) * 140, -180 - c.h, Math.sin(a) * 140)), look: c.heart.clone().add(V(0, 60, 0)), fov: 74, roll: 0.15 };
  },
  /** straight down from the line: the whale belly-up, chains converging at the lens */
  top: (c) => ({ pos: c.heart.clone().add(V(10, (c.d || 520) - c.lt * 20, 60)), look: c.heart.clone(), fov: 56, roll: c.lt * 0.04 }),
  /** a seal close, the chain diving down to the body */
  chain: (c) => {
    const s = c.seal(Math.max(0, Math.round(c.s)));
    return { pos: s.clone().add(V(36, 18 + c.lt * 4, 40)), look: s.clone().lerp(c.heart, 0.35), fov: 60, roll: -0.18 };
  },
  /** the engraving's composition: a stately profile, slowly drifting */
  plate: (c) => {
    const d = c.d || 900;
    const a = c.a;
    return { pos: c.heart.clone().add(V(Math.cos(a) * d + c.lt * 3, (c.h || 40) + c.lt, Math.sin(a) * d)), look: c.heart.clone().add(V(0, 60, 0)), fov: c.f || 42, roll: 0 };
  },
  /** near the flukes as they sweep past */
  tail: (c) => {
    const t = c.body(0.04, 0);
    return { pos: t.clone().add(V(-40, 30 + c.lt * 6, 120)), look: t.clone().lerp(c.heart, 0.25), fov: 64, roll: 0.12 };
  },
  /** the climax: spiralling around the body's axis with the ship (Gurren-style drill run) */
  spiral: (c) => {
    const u = 0.15 + ((c.p || 0) + c.lt * 0.03) % 0.8;
    const th = c.a + c.lt * 2.2 * c.calm;
    // high enough off the skin that the body reads as a body (its curve, the chains, the eye ahead), not a wall
    const at = c.body(u, th, 105);
    const ahead = c.body(Math.min(0.98, u + 0.3), th + 0.5, 0);
    return { pos: at, look: ahead, fov: 72, roll: th * 0.4 };
  },
  /** chase behind our ship as it climbs */
  chase: (c) => {
    const side = V(-c.shipFwd.z, 0, c.shipFwd.x);
    return { pos: c.ship.clone().addScaledVector(c.shipFwd, -34).addScaledVector(side, 10).add(V(0, 10 + c.h, 0)), look: c.ship.clone().addScaledVector(c.shipFwd, 40).lerp(c.heart, 0.3), fov: 68, roll: Math.sin(c.lt * 1.4) * 0.06 };
  },
  /** looking down as the colossus falls back toward the sea of clouds */
  fall: (c) => ({ pos: c.heart.clone().add(V(-260, 380 - c.lt * 10, 300)), look: c.heart.clone().add(V(0, -80, 0)), fov: 52, roll: -0.06 }),
};

/** blend two cameras (a whip between shots) */
export function mixCam(a: Cam, b: Cam, k: number): Cam {
  return { pos: a.pos.clone().lerp(b.pos, k), look: a.look.clone().lerp(b.look, k), fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k };
}
