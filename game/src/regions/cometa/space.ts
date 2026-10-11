/**
 * Puerto Cometa's sky: the top of the sky layer, where the atmosphere thins into space.
 *
 *  - AstralSky replaces the engine's dome (hidden, never disposed early): a deep indigo vault with a
 *    PERPETUAL starfield (three layers of hashed stars, softer by «day», never off), a nebula band in
 *    pink / violet / teal, a ringed giant planet low in the north-west, the thin bright LIMB of the
 *    atmosphere on the horizon, the comet's sunrise-like glow behind the island, a few shooting stars
 *    (a real shower on some days) and the lens' soft scanlines. One draw call.
 *  - CometTail: the comet's two tails streaming away behind the island — a straight blue ion tail and a
 *    curved, wider pink-white dust tail — as crossed additive ribbons with streaks that flow outward
 *    (one draw call), fed by a particle stream (the region emits it).
 */
import * as THREE from 'three';
import type { SkyState } from '../../engine/world/sky';
import type { Bin } from '../paginas/kit';

const GLSL_N3 = /* glsl */ `
float h13(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
vec3 h33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float vn3(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * vn3(p); p = p * 2.07 + 7.1; a *= 0.5; } return s / 0.9375; }
`;

/** where things hang in the sky (unit directions) */
export const PLANET_DIR = new THREE.Vector3(-0.62, 0.2, -0.76).normalize();
export const GLOW_DIR = new THREE.Vector3(-0.8, 0.05, -0.6).normalize();

export class AstralSky {
  readonly mesh: THREE.Mesh;
  readonly u: Record<string, THREE.IUniform>;
  constructor(bin: Bin, radius = 880) {
    this.u = {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uFog: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uSunCol: { value: new THREE.Color() },
      uNight: { value: 0 },
      uTime: { value: 0 },
      uMeteors: { value: 0.3 },
      uPlanet: { value: PLANET_DIR.clone() },
      uGlowDir: { value: GLOW_DIR.clone() },
    };
    const mat = bin.add(
      new THREE.ShaderMaterial({
        uniforms: this.u,
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uFog; uniform vec3 uSunDir; uniform vec3 uSunCol;
          uniform float uNight; uniform float uTime; uniform float uMeteors; uniform vec3 uPlanet; uniform vec3 uGlowDir;
          varying vec3 vDir;
          ${GLSL_N3}
          // one layer of stars: a 3D cell grid over the direction (no seams, no pinched poles)
          vec3 starLayer(vec3 d, float scale, float keep, float size){
            vec3 g = d * scale;
            vec3 c = floor(g);
            vec3 r = h33(c);
            if (r.x > keep) return vec3(0.0);
            vec3 sp = c + 0.5 + (h33(c + 11.0) - 0.5) * 0.6;
            float dist = length(g - sp);
            float core = smoothstep(size, 0.0, dist);
            float halo = smoothstep(size * 3.2, 0.0, dist) * 0.25;
            float tw = 0.65 + 0.35 * sin(uTime * (0.8 + r.y * 3.0) + r.z * 40.0);
            vec3 tint = mix(vec3(0.75, 0.85, 1.0), mix(vec3(1.0, 0.85, 0.7), vec3(1.0, 0.7, 0.9), r.z), step(0.6, r.y));
            return tint * (core + halo) * tw * (0.4 + r.y * 0.9);
          }
          float segDist(vec3 p, vec3 a, vec3 b){ vec3 ab = b - a; float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0); return length(p - a - ab * t); }
          void main(){
            vec3 d = normalize(vDir);
            float y = d.y;
            float day = 1.0 - uNight;
            // the vault: horizon glow fading up into deep indigo
            vec3 col = mix(uHorizon, uZenith, pow(smoothstep(-0.02, 0.4, y), 0.75));
            // the comet's glow: a sunrise that never sets, low behind the island
            float cg = max(dot(d, normalize(uGlowDir)), 0.0);
            col += vec3(1.0, 0.45, 0.6) * pow(cg, 12.0) * (0.12 * day + 0.07) * smoothstep(-0.1, 0.05, y) * (1.0 - smoothstep(0.03, 0.3, y));
            col += vec3(1.0, 0.8, 0.85) * pow(cg, 120.0) * (0.12 * day + 0.05) * smoothstep(-0.05, 0.02, y);
            // nebula band (pink / violet / teal), stronger at night but always there
            vec3 nb = normalize(vec3(0.35, 0.82, 0.45));
            float band = exp(-pow(dot(d, nb) / 0.38, 2.0));
            float n1 = fbm3(d * 3.1 + vec3(0.0, 0.0, uTime * 0.004));
            float n2 = fbm3(d * 6.3 + 4.2);
            float neb = smoothstep(0.42, 0.85, n1 * 0.75 + n2 * 0.35) * band;
            vec3 nebCol = mix(mix(vec3(0.95, 0.32, 0.7), vec3(0.45, 0.3, 1.0), smoothstep(0.35, 0.65, n2)), vec3(0.2, 0.8, 0.85), smoothstep(0.62, 0.8, n1) * 0.6);
            float above = smoothstep(-0.03, 0.12, y);
            col += nebCol * neb * (0.22 + uNight * 0.38) * above;
            // dark dust lanes across the band
            col *= 1.0 - smoothstep(0.55, 0.75, fbm3(d * 9.0 + 2.0)) * band * 0.35 * above;
            // stars: three layers, always on (softer by day)
            vec3 st = starLayer(d, 70.0, 0.55, 0.11) + starLayer(d, 150.0, 0.35, 0.09) * 0.8 + starLayer(d, 26.0, 0.12, 0.08) * 1.6;
            st *= 1.0 + band * 0.8;
            col += st * (0.45 + uNight * 0.75) * above;
            // the giant planet (ringed, banded, lit from the sun's side), low in the north-west
            vec3 P = normalize(uPlanet);
            vec3 R = normalize(cross(vec3(0.0, 1.0, 0.0), P));
            vec3 U = cross(P, R);
            float pr = 0.105;
            vec2 q = vec2(dot(d, R), dot(d, U)) / pr;
            float ql = length(q);
            float front = step(0.0, dot(d, P));
            // ring plane (tilted ellipse)
            float ca = cos(0.38), sa = sin(0.38);
            vec2 rq = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
            float re = length(vec2(rq.x, rq.y * 3.4));
            float ring = smoothstep(1.35, 1.4, re) * (1.0 - smoothstep(2.05, 2.15, re)) * (0.55 + 0.45 * sin(re * 26.0)) * (1.0 - smoothstep(1.62, 1.66, re) * (1.0 - smoothstep(1.7, 1.74, re)) * 0.85);
            vec3 sunL = normalize(uSunDir + vec3(0.0, 0.3, 0.0));
            if (ql < 1.0 && front > 0.0) {
              float z = sqrt(1.0 - ql * ql);
              vec3 Nw = normalize(R * q.x + U * q.y - P * z);
              float lam = clamp(dot(Nw, normalize(vec3(0.4, 0.5, 0.75))) * 0.9 + 0.12, 0.0, 1.0);
              float lat = q.y * 0.92 + q.x * 0.2;
              float bands = sin(lat * 16.0 + fbm3(vec3(q * 3.0, 1.0)) * 3.0) * 0.5 + 0.5;
              vec3 pc = mix(vec3(0.93, 0.56, 0.48), vec3(0.98, 0.83, 0.62), bands);
              pc = mix(pc, vec3(0.62, 0.42, 0.78), smoothstep(0.55, 0.95, abs(lat)) * 0.6);
              vec3 pcol = pc * (0.1 + lam * 0.72) * (0.7 + day * 0.15);
              pcol += vec3(0.5, 0.75, 1.0) * pow(1.0 - z, 3.0) * 0.55;
              // the ring passes in front of the lower half
              float rf = ring * step(rq.y, 0.0);
              pcol = mix(pcol, vec3(0.92, 0.82, 0.7) * (0.55 + day * 0.3), rf * 0.85);
              col = mix(col, pcol, smoothstep(1.0, 0.985, ql));
            } else if (front > 0.0) {
              col += vec3(0.92, 0.82, 0.72) * ring * 0.55 * (0.55 + day * 0.3);
              col += vec3(0.45, 0.65, 1.0) * exp(-(ql - 1.0) * 9.0) * 0.18;
            }
            // the sun: a small white star by day (no blue sky up here)
            float s = max(dot(d, normalize(uSunDir)), 0.0);
            col += uSunCol * (pow(s, 1800.0) * 4.0 + pow(s, 90.0) * 0.18) * day;
            // shooting stars (more of them on a shower day)
            for (int i = 0; i < 4; i++) {
              float fi = float(i);
              float rate = 0.05 + fi * 0.013;
              float ph = fract(uTime * rate + fi * 0.37);
              float cyc = floor(uTime * rate + fi * 0.37);
              if (h13(vec3(cyc, fi, 3.0)) > uMeteors) continue;
              float k = ph / 0.07;
              if (k > 1.0) continue;
              vec3 hr = h33(vec3(cyc, fi, 7.0));
              float az = hr.x * 6.2832;
              vec3 A = normalize(vec3(cos(az), 0.35 + hr.y * 0.45, sin(az)));
              vec3 B = normalize(A + vec3(-sin(az), -0.18 - hr.z * 0.15, cos(az)) * 0.32);
              vec3 head = normalize(mix(A, B, k));
              vec3 tail = normalize(mix(A, B, max(0.0, k - 0.35)));
              float sd = segDist(d, tail, head);
              float along = clamp(dot(d - tail, head - tail) / max(dot(head - tail, head - tail), 1e-5), 0.0, 1.0);
              col += vec3(0.85, 0.95, 1.0) * smoothstep(0.0025, 0.0, sd) * along * (1.0 - k * 0.5) * 1.6;
            }
            // the limb: the last thin skin of air, bright on the horizon
            float limb = exp(-pow((y - 0.008) / 0.012, 2.0));
            col += mix(vec3(0.35, 0.8, 1.0), vec3(0.75, 0.55, 1.0), uNight) * limb * (0.22 + day * 0.08);
            // under the horizon: the haze of the cloud floor far below
            col = mix(col, uFog, smoothstep(0.0, -0.08, y));
            // the lens: soft scanlines
            col *= 0.968 + 0.032 * sin(gl_FragCoord.y * 1.5708);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    );
    this.mesh = new THREE.Mesh(bin.add(new THREE.SphereGeometry(radius, 48, 24)), mat);
    this.mesh.name = 'astral-sky';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
  }
  update(s: SkyState, t: number) {
    const u = this.u;
    u.uZenith.value.copy(s.zenith);
    u.uHorizon.value.copy(s.horizon);
    u.uFog.value.copy(s.fog);
    u.uSunDir.value.copy(s.sunDir);
    u.uSunCol.value.copy(s.sun);
    u.uNight.value = s.night;
    u.uTime.value = t;
  }
}

export interface TailOpts {
  /** where the tails leave the island */
  start: THREE.Vector3;
  /** main direction (normalized) */
  dir: THREE.Vector3;
}

/**
 * The comet's tails: crossed additive ribbons (3 per tail, 60° apart, so they never go edge-on) along
 * a centerline that widens with distance. aKind 0 = ion tail (straight, blue), 1 = dust tail (curved,
 * warm). Streaks flow outward along the tail.
 */
export class CometTail {
  readonly mesh: THREE.Mesh;
  readonly u: { uTime: { value: number }; uI: { value: number }; uNight: { value: number } };
  readonly curves: THREE.CatmullRomCurve3[] = [];
  constructor(bin: Bin, o: TailOpts) {
    const pos: number[] = [];
    const uv: number[] = [];
    const kind: number[] = [];
    const idx: number[] = [];
    const side0 = new THREE.Vector3().crossVectors(o.dir, new THREE.Vector3(0, 1, 0)).normalize();
    const tails = [
      { k: 0, L: 760, w0: 22, w1: 150, bend: new THREE.Vector3(0, 0, 0) },
      { k: 1, L: 600, w0: 30, w1: 260, bend: side0.clone().multiplyScalar(220).add(new THREE.Vector3(0, -60, 0)) },
    ];
    let base = 0;
    for (const T of tails) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        pts.push(o.start.clone().addScaledVector(o.dir, T.L * t).addScaledVector(T.bend, t * t));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      this.curves.push(curve);
      const N = 72;
      for (let s = 0; s < 3; s++) {
        const rot = (s / 3) * Math.PI;
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const p = curve.getPointAt(t);
          const tg = curve.getTangentAt(t);
          const side = side0.clone().applyAxisAngle(tg, rot);
          // keep it perpendicular to the tangent
          side.addScaledVector(tg, -side.dot(tg)).normalize();
          const w = T.w0 + (T.w1 - T.w0) * Math.pow(t, 0.8);
          for (const sd of [-1, 1]) {
            const q = p.clone().addScaledVector(side, sd * w);
            pos.push(q.x, q.y, q.z);
            uv.push(t, sd < 0 ? 0 : 1);
            kind.push(T.k + s * 0.01);
          }
          if (i < N) {
            const a = base + i * 2;
            idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
          }
        }
        base += (N + 1) * 2;
      }
    }
    const geo = bin.add(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    this.u = { uTime: { value: 0 }, uI: { value: 1 }, uNight: { value: 0 } };
    const mat = bin.add(
      new THREE.ShaderMaterial({
        uniforms: this.u,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aKind; varying vec2 vUv; varying float vKind;
          void main(){
            vUv = uv; vKind = aKind;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uI; uniform float uNight;
          varying vec2 vUv; varying float vKind;
          ${GLSL_N3}
          void main(){
            float t = vUv.x;
            float v = vUv.y * 2.0 - 1.0;
            float ion = 1.0 - step(0.5, vKind);
            float edge = pow(max(1.0 - abs(v), 0.0), mix(1.1, 1.6, ion));
            float along = smoothstep(0.0, 0.035, t) * pow(1.0 - t, mix(1.1, 1.5, ion));
            // streaks that flow outward along the tail
            float s1 = vn3(vec3(v * mix(5.0, 11.0, ion) + vKind * 40.0, t * 18.0 - uTime * 0.5, 0.0));
            float s2 = vn3(vec3(v * 3.0 + 9.0, t * 6.0 - uTime * 0.22, 3.0 + vKind * 40.0));
            float streak = mix(0.35, 1.2, s1 * 0.65 + s2 * 0.5);
            vec3 head = mix(vec3(1.0, 0.55, 0.8), vec3(0.5, 0.88, 1.0), ion);
            vec3 mid = mix(vec3(1.0, 0.5, 0.72), vec3(0.3, 0.7, 1.0), ion);
            vec3 far = mix(vec3(0.55, 0.32, 0.95), vec3(0.25, 0.32, 1.0), ion);
            vec3 col = mix(head, mid, smoothstep(0.0, 0.3, t));
            col = mix(col, far, smoothstep(0.3, 0.9, t));
            float a = edge * along * streak * uI * mix(0.08, 0.13, ion) * (0.75 + uNight * 0.4);
            gl_FragColor = vec4(col, a);
          }`,
      }),
    );
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.name = 'comet-tail';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
  }
  update(t: number, night: number) {
    this.u.uTime.value = t;
    this.u.uNight.value = night;
  }
}
