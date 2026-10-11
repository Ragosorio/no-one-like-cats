/**
 * Floating-island anatomy for the sky layer: the faceted, stratified UNDERSIDE that hangs from an
 * island's outline (an upside-down mountain), hanging roots and vines that sway, loose rocks that
 * float under it, round-canopy trees (upright or hanging), and whole ISLETS (top cap + underside +
 * trees) built in local space so a region can bob, spin or flip them as one mesh.
 * Everything goes into a Mesher (kit.ts): no draw call per part.
 */
import * as THREE from 'three';
import { Mesher, mat } from './kit';

export interface RockPalette {
  /** the top layer under the grass */
  soil: string;
  /** strata, from the top down (repeats) */
  rock: string[];
  /** grass / moss lip at the rim */
  moss: string;
  /** the deep tip */
  dark: string;
  root: string;
}

const c0 = new THREE.Color();
const c1 = new THREE.Color();

function h1(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export interface UndersideOpts {
  /** rim radius at angle a (local, around cx/cz) */
  outline: (a: number) => number;
  cx: number;
  cz: number;
  /** rim height */
  y0: number;
  /** rim → tip */
  depth: number;
  /** tip offset from the center */
  tip?: [number, number];
  segs?: number;
  rings?: number;
  seed: number;
  pal: RockPalette;
  /** radial roughness 0..0.3 */
  jag?: number;
  /** how bulgy the upper part is (turnip) */
  belly?: number;
  /**
   * a crisp grass LIP on top (main islands): ring 0 sits at y(a) — the ground's height at the rim —
   * with a flat cap `inset` units inward (it hides the heightfield's cut edge) and a thin grass
   * overhang before the soil starts
   */
  lip?: { y: (a: number) => number; inset: number; grass: string };
}

/** an upside-down faceted mountain under an island; returns points on its surface (for roots) */
export function underside(M: Mesher, o: UndersideOpts) {
  const S = o.segs ?? 56;
  const K = o.rings ?? 9;
  const jag = o.jag ?? 0.14;
  const belly = o.belly ?? 0.18;
  const [tx, tz] = o.tip ?? [0, 0];
  const lip = o.lip;
  const ring: THREE.Vector3[][] = [];
  const outl: number[] = [];
  const top: number[] = [];
  for (let s = 0; s < S; s++) {
    const a = (s / S) * Math.PI * 2;
    outl.push(o.outline(a));
    top.push(lip ? lip.y(a) : o.y0);
  }
  // with a lip, ring 1 is the grass overhang and the cone proper starts at ring 2
  const k0 = lip ? 1 : 0;
  for (let k = 0; k <= K; k++) {
    const t = k <= k0 ? 0 : (k - k0) / (K - k0);
    const row: THREE.Vector3[] = [];
    const f = Math.pow(1 - t, 0.78) * (1 + belly * Math.sin(Math.min(1, t * 1.6) * Math.PI));
    const cx = o.cx + tx * Math.pow(t, 1.5);
    const cz = o.cz + tz * Math.pow(t, 1.5);
    for (let s = 0; s < S; s++) {
      const a = (s / S) * Math.PI * 2;
      let r: number;
      let y: number;
      if (k === 0) {
        r = outl[s];
        y = top[s];
      } else if (lip && k === 1) {
        r = outl[s] + 0.22;
        y = top[s] - 0.55;
      } else {
        const n = h1(o.seed * 13 + k * 71 + s * 7);
        r = outl[s] * f * (1 + jag * (n - 0.5) * 2 * (0.6 + t));
        const ledge = (h1(o.seed + k * 5 + Math.floor(s / 3) * 11) - 0.5) * (o.depth / K) * 0.7;
        y = (lip ? top[s] - 0.55 : top[s]) - o.depth * Math.pow(t, 1.05) + ledge;
      }
      row.push(new THREE.Vector3(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r));
    }
    ring.push(row);
  }
  const yTop = lip ? Math.min(...top) : o.y0;
  const tip = new THREE.Vector3(o.cx + tx, yTop - o.depth * 1.08, o.cz + tz);
  const pos: number[] = [];
  const col: number[] = [];
  const surf: THREE.Vector3[] = [];
  const shade = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, k: number, s: number) => {
    const my = (a.y + b.y + c.y) / 3;
    const t = (yTop - my) / o.depth;
    if (lip && k === 0) c0.set(lip.grass);
    else if (t < 0.07) c0.set(!lip && k === 0 && h1(s * 3 + o.seed) < 0.55 ? o.pal.moss : o.pal.soil);
    else {
      const band = Math.floor((yTop - my) / 2.3 + h1(o.seed * 7 + s) * 0.6);
      c0.set(o.pal.rock[((band % o.pal.rock.length) + o.pal.rock.length) % o.pal.rock.length]);
      c0.lerp(c1.set(o.pal.dark), Math.min(1, Math.max(0, (t - 0.45) * 1.2)));
    }
    c0.multiplyScalar(0.94 + h1(o.seed + k * 31 + s * 17) * 0.12);
    for (const v of [a, b, c]) pos.push(v.x, v.y, v.z);
    for (let i = 0; i < 3; i++) col.push(c0.r, c0.g, c0.b);
  };
  // the flat grass cap that hides the cut edge of the terrain
  if (lip)
    for (let s = 0; s < S; s++) {
      const s2 = (s + 1) % S;
      const a = (s / S) * Math.PI * 2;
      const a2 = (s2 / S) * Math.PI * 2;
      const i1 = new THREE.Vector3(o.cx + Math.cos(a) * (outl[s] - lip.inset), top[s], o.cz + Math.sin(a) * (outl[s] - lip.inset));
      const i2 = new THREE.Vector3(o.cx + Math.cos(a2) * (outl[s2] - lip.inset), top[s2], o.cz + Math.sin(a2) * (outl[s2] - lip.inset));
      c0.set(lip.grass).multiplyScalar(0.97 + h1(s * 5 + o.seed) * 0.06);
      for (const v of [i1, i2, ring[0][s], i2, ring[0][s2], ring[0][s]]) pos.push(v.x, v.y, v.z);
      for (let i = 0; i < 6; i++) col.push(c0.r, c0.g, c0.b);
    }
  for (let k = 0; k < K; k++)
    for (let s = 0; s < S; s++) {
      const s2 = (s + 1) % S;
      const a = ring[k][s];
      const b = ring[k][s2];
      const c = ring[k + 1][s];
      const d = ring[k + 1][s2];
      // outward-facing winding (CCW from outside: a·b on this ring, c·d on the next one down)
      shade(a, b, c, k, s);
      shade(b, d, c, k, s);
      if (k > k0 && k < K - 2 && h1(o.seed * 3 + k * 9 + s) < 0.5) surf.push(a.clone().lerp(c, 0.5));
    }
  for (let s = 0; s < S; s++) shade(ring[K][s], ring[K][(s + 1) % S], tip, K, s);
  M.tris(pos, col);
  return { surf, tip, ring0: ring[0] };
}

/** a tapered tube along a polyline (roots, vines, chains): sway grows toward the tip */
export function tube(M: Mesher, pts: THREE.Vector3[], r0: number, r1: number, color: string | ((t: number, out: THREE.Color) => void), swayTip = 1, sides = 4) {
  const pos: number[] = [];
  const col: number[] = [];
  const sw: number[] = [];
  const n = pts.length;
  const frames: { p: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3; r: number; t: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const d = (i < n - 1 ? pts[i + 1].clone().sub(pts[i]) : pts[i].clone().sub(pts[i - 1])).normalize();
    const u = Math.abs(d.y) < 0.9 ? new THREE.Vector3(0, 1, 0).cross(d).normalize() : new THREE.Vector3(1, 0, 0).cross(d).normalize();
    const v = d.clone().cross(u).normalize();
    frames.push({ p: pts[i], u, v, r: r0 + (r1 - r0) * t, t });
  }
  const at = (f: (typeof frames)[0], j: number) => {
    const a = (j / sides) * Math.PI * 2;
    return f.p.clone().addScaledVector(f.u, Math.cos(a) * f.r).addScaledVector(f.v, Math.sin(a) * f.r);
  };
  for (let i = 0; i < n - 1; i++) {
    const A = frames[i];
    const B = frames[i + 1];
    if (typeof color === 'string') c0.set(color);
    else color((A.t + B.t) / 2, c0);
    for (let j = 0; j < sides; j++) {
      const a = at(A, j);
      const b = at(A, j + 1);
      const c = at(B, j);
      const d = at(B, j + 1);
      for (const [v, t] of [
        [a, A.t],
        [b, A.t],
        [c, B.t],
        [b, A.t],
        [d, B.t],
        [c, B.t],
      ] as [THREE.Vector3, number][]) {
        pos.push(v.x, v.y, v.z);
        col.push(c0.r, c0.g, c0.b);
        sw.push(Math.pow(t, 1.4) * swayTip);
      }
    }
  }
  M.tris(pos, col, sw);
}

/** roots hanging from points of an underside (curly, tapered, swaying) */
export function hangingRoots(M: Mesher, anchors: THREE.Vector3[], rng: () => number, color: string, o: { len?: [number, number]; r?: number; vine?: string } = {}) {
  const [l0, l1] = o.len ?? [2.5, 8];
  for (const a of anchors) {
    const L = l0 + rng() * (l1 - l0);
    const n = 6;
    const dx = (rng() - 0.5) * 0.5;
    const dz = (rng() - 0.5) * 0.5;
    const ph = rng() * 6.28;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(new THREE.Vector3(a.x + dx * L * t + Math.sin(ph + t * 5) * 0.25 * t * L * 0.15, a.y + 0.3 - L * t, a.z + dz * L * t + Math.cos(ph + t * 4) * 0.25 * t * L * 0.15));
    }
    const vine = o.vine && rng() < 0.45;
    tube(M, pts, (o.r ?? 0.16) * (0.7 + rng() * 0.6), 0.03, vine ? o.vine! : color, 1.2, 4);
    // a vine carries a few leaves
    if (vine)
      for (let i = 2; i < n; i += 1) {
        const p = pts[i];
        M.add(new THREE.TetrahedronGeometry(0.28 + rng() * 0.2), o.vine!, mat(p.x + (rng() - 0.5) * 0.3, p.y, p.z + (rng() - 0.5) * 0.3, rng() * 3, rng() * 3, rng() * 3), Math.pow(i / n, 1.4) * 1.2);
      }
  }
}

/** loose rocks floating just under an island (they drift with the wind sway) */
export function floatingRocks(M: Mesher, n: number, around: THREE.Vector3, spread: number, rng: () => number, pal: RockPalette, size = 1) {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = spread * (0.4 + rng() * 0.6);
    const s = size * (0.4 + rng() * 0.9);
    const p = new THREE.Vector3(around.x + Math.cos(a) * d, around.y - rng() * spread * 0.5, around.z + Math.sin(a) * d);
    const geo = rng() < 0.5 ? new THREE.DodecahedronGeometry(s, 0) : new THREE.IcosahedronGeometry(s, 0);
    geo.scale(1, 0.75 + rng() * 0.4, 1);
    const top = pal.rock[Math.floor(rng() * pal.rock.length)];
    M.add(geo, (v, out) => out.set(v.y > s * 0.35 ? pal.moss : top), mat(p.x, p.y, p.z, rng() * 3, rng() * 3, rng() * 3), 0.6 + rng() * 0.4);
  }
}

export interface TreeOpts {
  canopy: string[];
  trunk: string;
  /** canopy lumps */
  lumps?: number;
  /** hangs from a ceiling instead of standing */
  inverted?: boolean;
  lean?: number;
  /** canopy night glow (aGlow) */
  glow?: number;
}

/** a round-canopy tree (base at x,y,z; s = scale); inverted = it hangs from the surface above */
export function tree(M: Mesher, x: number, y: number, z: number, s: number, rng: () => number, o: TreeOpts) {
  const base = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.inverted ? Math.PI : 0, rng() * 6.28, 0)), new THREE.Vector3(s, s, s));
  const lean = (o.lean ?? 0.12) * (rng() - 0.5) * 2;
  const H = 2.4 + rng() * 0.8;
  const trunk = new THREE.CylinderGeometry(0.16, 0.3, H, 6);
  trunk.translate(0, H / 2, 0);
  trunk.rotateZ(lean);
  M.add(trunk, o.trunk, base);
  const top = new THREE.Vector3(-Math.sin(lean) * H, Math.cos(lean) * H, 0);
  const col = o.canopy[Math.floor(rng() * o.canopy.length)];
  const n = o.lumps ?? 3;
  for (let i = 0; i < n; i++) {
    const r = (i === 0 ? 1.35 : 0.9 + rng() * 0.4) * (1 + rng() * 0.15);
    const a = (i / n) * 6.28 + rng();
    const off = i === 0 ? new THREE.Vector3(0, 0.6, 0) : new THREE.Vector3(Math.cos(a) * 0.95, 0.15 + rng() * 0.5, Math.sin(a) * 0.95);
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.scale(1, 0.85, 1);
    const p = top.clone().add(off);
    M.add(
      g,
      (v, out) => {
        out.set(col);
        // darker belly, lighter crown (reads round under the toon ramp)
        out.multiplyScalar(0.82 + 0.3 * THREE.MathUtils.smoothstep(v.y, -r, r));
      },
      new THREE.Matrix4().multiplyMatrices(base, mat(p.x, p.y, p.z)),
      0.18,
      o.glow ?? 0,
    );
  }
}

export interface IsletOpts {
  r: number;
  seed: number;
  pal: RockPalette;
  grass: string[];
  /** underside depth as a multiple of r */
  deep?: number;
  trees?: number;
  tree?: TreeOpts;
  /** hanging trees under it (Invertidas) */
  hanging?: number;
  roots?: number;
  rocks?: number;
}

/**
 * A small floating island in LOCAL space (top surface around y = 0, center at the origin): grass cap,
 * soil lip, upside-down mountain, roots, trees. Returns the outline so callers can hang waterfalls.
 */
export function islet(M: Mesher, rng: () => number, o: IsletOpts) {
  const sd = o.seed;
  const R = (a: number) => o.r * (1 + 0.16 * Math.sin(a * 3 + sd) + 0.08 * Math.sin(a * 5 - sd * 1.7) + 0.05 * Math.sin(a * 9 + sd * 0.3));
  // top cap (gentle dome), faceted
  const S = 28;
  const K = 4;
  const pts: THREE.Vector3[][] = [];
  for (let k = 0; k <= K; k++) {
    const t = k / K;
    const row: THREE.Vector3[] = [];
    for (let s = 0; s < S; s++) {
      const a = (s / S) * Math.PI * 2;
      const rr = R(a) * t;
      row.push(new THREE.Vector3(Math.cos(a) * rr, 0.45 * o.r * 0.12 * (1 - t * t) + (k > 0 && k < K ? (h1(sd + k * 7 + s) - 0.5) * 0.25 : 0), Math.sin(a) * rr));
    }
    pts.push(row);
  }
  const pos: number[] = [];
  const col: number[] = [];
  const g0 = o.grass;
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, k: number, s: number) => {
    c0.set(g0[Math.floor(h1(sd * 5 + k * 13 + s) * g0.length)]);
    if (k === K - 1) c0.lerp(c1.set(o.pal.moss), 0.35);
    c0.multiplyScalar(0.95 + h1(sd + s * 3 + k) * 0.1);
    for (const v of [a, b, c]) pos.push(v.x, v.y, v.z);
    for (let i = 0; i < 3; i++) col.push(c0.r, c0.g, c0.b);
  };
  for (let k = 0; k < K; k++)
    for (let s = 0; s < S; s++) {
      const s2 = (s + 1) % S;
      tri(pts[k][s], pts[k][s2], pts[k + 1][s], k, s);
      tri(pts[k][s2], pts[k + 1][s2], pts[k + 1][s], k, s);
    }
  M.tris(pos, col);
  const under = underside(M, { outline: (a) => R(a) * 1.005, cx: 0, cz: 0, y0: 0.02, depth: o.r * (o.deep ?? 1.35), tip: [(rng() - 0.5) * o.r * 0.4, (rng() - 0.5) * o.r * 0.4], segs: 28, rings: 6, seed: sd, pal: o.pal, jag: 0.16 });
  // trees on top
  const nt = o.trees ?? 0;
  for (let i = 0; i < nt && o.tree; i++) {
    const a = rng() * 6.28;
    const d = Math.sqrt(rng()) * o.r * 0.62;
    tree(M, Math.cos(a) * d, 0.1, Math.sin(a) * d, 0.55 + rng() * 0.35, rng, o.tree);
  }
  // trees hanging from the underside
  const nh = o.hanging ?? 0;
  for (let i = 0; i < nh && o.tree && under.surf.length; i++) {
    const p = under.surf[Math.floor(rng() * under.surf.length)];
    tree(M, p.x, p.y + 0.2, p.z, 0.45 + rng() * 0.3, rng, { ...o.tree, inverted: true });
  }
  const anchors: THREE.Vector3[] = [];
  for (let i = 0; i < (o.roots ?? 6) && under.surf.length; i++) anchors.push(under.surf[Math.floor(rng() * under.surf.length)]);
  hangingRoots(M, anchors, rng, o.pal.root, { len: [o.r * 0.3, o.r * 0.9], r: 0.08 + o.r * 0.012 });
  if (o.rocks) floatingRocks(M, o.rocks, new THREE.Vector3(0, -o.r * (o.deep ?? 1.35) * 0.9, 0), o.r * 0.9, rng, o.pal, o.r * 0.12);
  return { outline: R, under };
}
