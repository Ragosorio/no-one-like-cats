/**
 * Puerto Cometa's build kit — the RETROFUTURO lens (art bible §7: soft scanlines, neon, metallic paint):
 *  - metalToon: the toon material every merged port mesh uses. Vertex colors + the 3-band ramp, plus
 *    METALLIC PAINT (a fresnel rim and a chrome horizon band in the reflection, driven per vertex by
 *    the Mesher's `aSway` slot, which nothing sways here) and the night GLOW (`aGlow`: rivets, windows,
 *    neon tubes, fuel) that grows when the lights come on.
 *  - beam / lattice / pipe: steel parts between two points (gantries, cranes, trusses, pipework)
 *  - palette of the yard
 */
import * as THREE from 'three';
import { toonGradient } from '../../engine/world/heightfield';
import type { Bin } from '../paginas/kit';
import { Mesher, type U } from '../cielo/kit';

export const P = {
  cream: '#f1e7d0',
  cream2: '#e2d6bb',
  teal: '#2fb3a8',
  teal2: '#1f8a86',
  coral: '#e8574d',
  coral2: '#c23f3b',
  chrome: '#c9d2e0',
  steel: '#7d879e',
  steel2: '#5b6479',
  dark: '#2a2a3c',
  navy: '#26305e',
  mustard: '#f2b632',
  brass: '#d9a441',
  rubber: '#1f1d29',
  wood: '#8a5232',
  wood2: '#6b3b26',
  glass: '#9fe9ff',
  /** Combustible Astral (glowing violet-pink) */
  fuel: '#ff5ce1',
  fuel2: '#a35bff',
  ice: '#8ff1ff',
  neonPink: '#ff3d8b',
  neonCyan: '#4ff2ff',
  warm: '#ffd88a',
  red: '#ff3b3b',
};

/** metallic paint + night glow on a vertex-colored toon (aSway = metalness, aGlow = night glow) */
export function metalToon(bin: Bin, o: { uNight: U<number>; uNeon: U<number>; key: string; bright?: number }) {
  const bright = o.bright ?? 0.08;
  const m = bin.add(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() }));
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNightM = o.uNight;
    sh.uniforms.uNeonM = o.uNeon;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSway; attribute float aGlow; varying float vMetal; varying float vGlowM;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMetal = aSway; vGlowM = aGlow;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNightM; uniform float uNeonM; varying float vMetal; varying float vGlowM;')
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
  {
    vec3 Vv = normalize(vViewPosition);
    float fres = pow(1.0 - clamp(abs(dot(normal, Vv)), 0.0, 1.0), 3.0);
    // chrome: a bright horizon band in the reflection (sky over the line, dark deck under it)
    vec3 R = reflect(-Vv, normal);
    float band = smoothstep(-0.05, 0.08, R.y) * (1.0 - smoothstep(0.08, 0.45, R.y));
    vec3 rimCol = mix(vec3(1.0, 0.86, 0.95), vec3(0.45, 0.85, 1.0), uNightM);
    totalEmissiveRadiance += vMetal * (diffuseColor.rgb * band * 0.42 + rimCol * fres * (0.28 + uNightM * 0.25));
    totalEmissiveRadiance += diffuseColor.rgb * vGlowM * (0.35 + uNeonM * 1.6);
    totalEmissiveRadiance += diffuseColor.rgb * ${bright.toFixed(3)} * (1.0 - uNightM * 0.6);
  }`,
      );
  };
  m.customProgramCacheKey = () => `cometa-metal-${o.key}-${bright.toFixed(3)}`;
  return m;
}

const up = new THREE.Vector3(0, 1, 0);
const tq = new THREE.Quaternion();
const tv = new THREE.Vector3();

/** a box beam from a to b (square section w), metal by default */
export function beam(M: Mesher, a: THREE.Vector3, b: THREE.Vector3, w: number, color: THREE.ColorRepresentation, metal = 0.6, glow = 0) {
  const len = a.distanceTo(b);
  if (len < 1e-4) return;
  const g = new THREE.BoxGeometry(w, len, w);
  tq.setFromUnitVectors(up, tv.copy(b).sub(a).normalize());
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), tq, new THREE.Vector3(1, 1, 1));
  M.add(g, color, m, metal, glow);
}

/** a round pipe from a to b */
export function pipe(M: Mesher, a: THREE.Vector3, b: THREE.Vector3, r: number, color: THREE.ColorRepresentation, metal = 0.7, glow = 0, sides = 8) {
  const len = a.distanceTo(b);
  if (len < 1e-4) return;
  const g = new THREE.CylinderGeometry(r, r, len, sides, 1, true);
  tq.setFromUnitVectors(up, tv.copy(b).sub(a).normalize());
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), tq, new THREE.Vector3(1, 1, 1));
  M.add(g, color, m, metal, glow);
}

/** a polyline of pipes with joints */
export function pipeline(M: Mesher, pts: THREE.Vector3[], r: number, color: THREE.ColorRepresentation, metal = 0.7, glow = 0) {
  for (let i = 0; i < pts.length - 1; i++) pipe(M, pts[i], pts[i + 1], r, color, metal, glow);
  for (let i = 1; i < pts.length - 1; i++) M.add(new THREE.SphereGeometry(r * 1.35, 8, 6), color, new THREE.Matrix4().makeTranslation(pts[i].x, pts[i].y, pts[i].z), metal);
}

/**
 * A square lattice mast from `base` up `h` (side `s`): four corner posts, rungs and X braces every
 * `step` — the bones of every crane, gantry and antenna in the yard.
 */
export function lattice(M: Mesher, base: THREE.Vector3, h: number, s: number, color: THREE.ColorRepresentation, step = 1.6, w = 0.12) {
  const c = [
    [-s / 2, -s / 2],
    [s / 2, -s / 2],
    [s / 2, s / 2],
    [-s / 2, s / 2],
  ];
  for (const [x, z] of c) beam(M, base.clone().add(new THREE.Vector3(x, 0, z)), base.clone().add(new THREE.Vector3(x, h, z)), w * 1.4, color);
  const n = Math.max(1, Math.round(h / step));
  for (let i = 0; i <= n; i++) {
    const y = (i / n) * h;
    for (let k = 0; k < 4; k++) {
      const [x0, z0] = c[k];
      const [x1, z1] = c[(k + 1) % 4];
      beam(M, base.clone().add(new THREE.Vector3(x0, y, z0)), base.clone().add(new THREE.Vector3(x1, y, z1)), w, color);
      if (i < n) beam(M, base.clone().add(new THREE.Vector3(x0, y, z0)), base.clone().add(new THREE.Vector3(x1, y + h / n, z1)), w * 0.8, color);
    }
  }
}

/** a horizontal lattice girder from a to b (triangular section, depth d) */
export function girder(M: Mesher, a: THREE.Vector3, b: THREE.Vector3, d: number, color: THREE.ColorRepresentation, step = 1.4, w = 0.11) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  dir.normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(d / 2);
  const down = new THREE.Vector3(0, -d * 0.85, 0);
  const A0 = a.clone().add(side);
  const A1 = a.clone().sub(side);
  const A2 = a.clone().add(down);
  const B0 = b.clone().add(side);
  const B1 = b.clone().sub(side);
  const B2 = b.clone().add(down);
  beam(M, A0, B0, w * 1.4, color);
  beam(M, A1, B1, w * 1.4, color);
  beam(M, A2, B2, w * 1.4, color);
  const n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p0 = A0.clone().lerp(B0, t);
    const p1 = A1.clone().lerp(B1, t);
    const p2 = A2.clone().lerp(B2, t);
    beam(M, p0, p1, w, color);
    if (i < n) {
      const t2 = (i + 1) / n;
      beam(M, p0, A2.clone().lerp(B2, t2), w * 0.8, color);
      beam(M, p1, A2.clone().lerp(B2, t2), w * 0.8, color);
      beam(M, p2, p0, w * 0.8, color);
    }
  }
}

/** rivets: little glowing studs along a line (they light up at night: «glowing rivets») */
export function rivets(M: Mesher, a: THREE.Vector3, b: THREE.Vector3, n: number, color: THREE.ColorRepresentation, r = 0.07, glow = 1) {
  for (let i = 0; i < n; i++) {
    const p = a.clone().lerp(b, (i + 0.5) / n);
    M.add(new THREE.OctahedronGeometry(r, 0), color, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z), 0, glow);
  }
}
