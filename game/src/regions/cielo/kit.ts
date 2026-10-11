/**
 * Sky-layer kit (Oleada 2 «El Cielo Despierta»: Islas Invertidas, Corona Celeste) — build helpers
 * shared by both sky regions:
 *  - Mesher: static parts → ONE non-indexed geometry with per-vertex color and per-vertex sway
 *    (`aSway`: 0 = rigid, 1 = the tip of a hanging root), flat-faceted or smooth
 *  - skyToon: the toon material every merged sky mesh uses (vertex colors + wind sway in the vertex
 *    shader, lights/shadows/fog kept by the stock MeshToonMaterial)
 *  - Halos: camera-facing additive glows refilled every frame (the soft bloom of lamps and crowns)
 *  - rimRadius: where a region's height function crosses the cut (the floating island's outline)
 *  - devParams: ?hour= / ?weather= (dev only)
 */
import * as THREE from 'three';
import { toonGradient } from '../../engine/world/heightfield';
import { wind } from '../../engine/world/flora';
import type { RegionDef } from '../types';
import type { Bin } from '../paginas/kit';

export type U<T> = { value: T };
export type ColorFn = (p: THREE.Vector3, out: THREE.Color) => void;
export type SwayFn = (p: THREE.Vector3) => number;

const tc = new THREE.Color();
const tv = new THREE.Vector3();
const tm = new THREE.Matrix4();
const tq = new THREE.Quaternion();
const te = new THREE.Euler();
const ts = new THREE.Vector3();

/** compose a matrix from position / euler / scale (fresh matrix) */
export function mat(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  te.set(rx, ry, rz);
  tq.setFromEuler(te);
  return new THREE.Matrix4().compose(tv.set(x, y, z), tq, ts.set(sx, sy, sz));
}

/**
 * Collects transformed parts (any BufferGeometry) with a color (flat, or a function of the LOCAL vertex
 * position) and a sway weight, and merges them into one geometry: one draw call per material.
 */
export class Mesher {
  private pos: number[] = [];
  private col: number[] = [];
  private sway: number[] = [];
  private glow: number[] = [];
  private nrm: number[] = [];
  /** flat = faceted (normals per triangle), else the part's own normals */
  constructor(private flat = true) {}

  /** sway: 0 rigid → 1 tip of a hanging root · glow: unlit night glow (windows, runes, lanterns) */
  add(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation | ColorFn, m?: THREE.Matrix4, sway: number | SwayFn = 0, glow = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (!this.flat && !g.attributes.normal) g.computeVertexNormals();
    const P = g.attributes.position as THREE.BufferAttribute;
    const N = g.attributes.normal as THREE.BufferAttribute | undefined;
    const nm = m ? new THREE.Matrix3().getNormalMatrix(m) : null;
    const fixed = typeof color === 'function' ? null : tc.set(color).clone();
    const n = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      tv.fromBufferAttribute(P, i);
      if (fixed) tc.copy(fixed);
      else (color as ColorFn)(tv, tc);
      const s = typeof sway === 'number' ? sway : sway(tv);
      if (m) tv.applyMatrix4(m);
      this.pos.push(tv.x, tv.y, tv.z);
      this.col.push(tc.r, tc.g, tc.b);
      this.sway.push(s);
      this.glow.push(glow);
      if (!this.flat && N) {
        n.fromBufferAttribute(N, i);
        if (nm) n.applyMatrix3(nm).normalize();
        this.nrm.push(n.x, n.y, n.z);
      }
    }
    if (g !== geo) g.dispose();
    geo.dispose();
    return this;
  }

  /** raw triangles (already in world space), e.g. lofted surfaces built by hand */
  tris(p: number[], c: number[], s?: number[], g?: number[]) {
    for (let i = 0; i < p.length; i++) this.pos.push(p[i]);
    for (let i = 0; i < c.length; i++) this.col.push(c[i]);
    const n = p.length / 3;
    for (let i = 0; i < n; i++) this.sway.push(s ? s[i] : 0);
    for (let i = 0; i < n; i++) this.glow.push(g ? g[i] : 0);
    if (!this.flat) {
      // raw triangles carry no normals: give them their face normal (faceted, like the flat mesher)
      const A = new THREE.Vector3();
      const B = new THREE.Vector3();
      const Cc = new THREE.Vector3();
      for (let i = 0; i < n; i += 3) {
        A.fromArray(p, i * 3);
        B.fromArray(p, i * 3 + 3);
        Cc.fromArray(p, i * 3 + 6);
        const nn = B.sub(A).cross(Cc.sub(A)).normalize();
        for (let k = 0; k < 3; k++) this.nrm.push(nn.x, nn.y, nn.z);
      }
    }
    return this;
  }

  get count() {
    return this.pos.length / 3;
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.sway, 1));
    g.setAttribute('aGlow', new THREE.Float32BufferAttribute(this.glow, 1));
    if (this.flat) g.computeVertexNormals();
    else g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.computeBoundingSphere();
    this.pos = [];
    this.col = [];
    this.sway = [];
    this.glow = [];
    this.nrm = [];
    return g;
  }
}

/**
 * The sky regions' toon material: vertex colors, the 3-band ramp, wind sway driven by `aSway`
 * (hanging roots, vines, canopies, banners) and an unlit glow driven by `aGlow` that grows at night
 * (windows, runes, lanterns, the glowing canopies of the hanging forest).
 */
export function skyToon(bin: Bin, o: { uNight?: U<number>; key?: string; /** self-lift so whites stay white under the toon ramp (by day) */ bright?: number } = {}) {
  const bright = o.bright ?? 0;
  const m = bin.add(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() }));
  const uNight = o.uNight ?? { value: 0 };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = wind as unknown as THREE.IUniform;
    sh.uniforms.uWTime = wind.time;
    sh.uniforms.uNightS = uNight;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSway; attribute float aGlow; uniform float uWind; uniform float uWTime; varying float vGlowS;')
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        vGlowS = aGlow;
        float swk = aSway;
        if (swk > 0.0) {
          vec4 wp0 = modelMatrix * vec4(position, 1.0);
          float ph = wp0.x * 0.21 + wp0.z * 0.17;
          float sw = (sin(uWTime * 1.3 + ph) * 0.6 + sin(uWTime * 2.7 + ph * 1.9) * 0.3) * (0.5 + uWind);
          transformed.x += sw * swk * 0.55;
          transformed.z += cos(uWTime * 1.1 + ph * 1.3) * swk * 0.35 * (0.5 + uWind);
        }`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNightS; varying float vGlowS;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += diffuseColor.rgb * vGlowS * (0.18 + uNightS * 1.25);
  totalEmissiveRadiance += diffuseColor.rgb * ${bright.toFixed(3)} * (1.0 - uNightS * 0.75);`);
  };
  m.customProgramCacheKey = () => `sky-toon-${o.key ?? 'a'}-${bright.toFixed(3)}`;
  return m;
}

/** camera-facing additive glows refilled every frame: begin() · add() … · end() */
export class Halos {
  readonly mesh: THREE.InstancedMesh;
  private n = 0;
  private c = new THREE.Color();
  private o = new THREE.Object3D();
  constructor(
    bin: Bin,
    readonly max = 64,
  ) {
    const mat = bin.add(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vC;
          void main(){
            vUv = uv - 0.5;
            vec3 center = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            float s = length(instanceMatrix[0].xyz);
            vec4 mv = viewMatrix * vec4(center, 1.0);
            mv.xy += position.xy * s;
            mv.z += s * 0.35;
            gl_Position = projectionMatrix * mv;
            vC = vec3(1.0);
            #ifdef USE_INSTANCING_COLOR
              vC = instanceColor;
            #endif
          }`,
        fragmentShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vC;
          void main(){
            float r = length(vUv) * 2.0;
            float a = exp(-r * r * 3.2) * 0.75 + exp(-r * r * 22.0) * 0.6;
            a *= smoothstep(1.0, 0.8, r);
            gl_FragColor = vec4(vC * a, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    );
    this.mesh = new THREE.InstancedMesh(bin.add(new THREE.PlaneGeometry(1, 1)), mat, max);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 8;
  }
  begin() {
    this.n = 0;
  }
  add(p: THREE.Vector3, size: number, color: THREE.ColorRepresentation, k = 1) {
    if (this.n >= this.max || k <= 0.003 || size <= 0) return;
    this.o.position.copy(p);
    this.o.scale.setScalar(size);
    this.o.updateMatrix();
    this.mesh.setMatrixAt(this.n, this.o.matrix);
    this.mesh.setColorAt(this.n, this.c.set(color).multiplyScalar(k));
    this.n++;
  }
  end() {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

/** distance from (cx,cz) along angle `a` where the height function falls below `cut` (bisection) */
export function rimRadius(height: (x: number, z: number) => number, a: number, cut: number, rMax: number, cx = 0, cz = 0) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  // march out to the first point under the cut, then refine
  let lo = 0;
  let hi = rMax;
  for (let r = 1; r <= rMax; r += 0.75)
    if (height(cx + ca * r, cz + sa * r) < cut) {
      hi = r;
      lo = r - 0.75;
      break;
    }
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (height(cx + ca * mid, cz + sa * mid) < cut) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** dev only: ?hour=23 fixes the hour, ?weather=despejado|lluvia|tormenta fixes the sky */
export function devParams(): { hour?: number; weather?: RegionDef['weather'] } {
  const qs = import.meta.env.DEV && typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
  return {
    hour: qs?.get('hour') ? Math.max(0.01, Number(qs.get('hour'))) : undefined,
    weather: (qs?.get('weather') ?? undefined) as RegionDef['weather'],
  };
}

/** a hex color as linear-space rgb (for vertex colors) */
export function lin(hex: string) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b] as [number, number, number];
}

export { tm as tmpMatrix };
