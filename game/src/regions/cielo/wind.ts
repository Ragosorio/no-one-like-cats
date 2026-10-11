/**
 * Wind streams of the sky layer: long ribbons that follow the air currents around the islands, drawn as
 * dashes of light racing along them (one merged mesh, one draw call). The ribbon widens toward the
 * camera in the vertex shader (it never goes edge-on) and fades at its ends and in the distance.
 */
import * as THREE from 'three';
import type { Bin } from '../paginas/kit';

export interface Stream {
  pts: THREE.Vector3[];
  /** half width */
  w: number;
  /** dash speed multiplier */
  speed: number;
  closed?: boolean;
}

export class WindRibbons {
  readonly mesh: THREE.Mesh;
  readonly u: { uTime: { value: number }; uColor: { value: THREE.Color }; uAlpha: { value: number } };
  constructor(bin: Bin, streams: Stream[], color = '#ffffff') {
    const pos: number[] = [];
    const tan: number[] = [];
    const side: number[] = [];
    const along: number[] = [];
    const seed: number[] = [];
    const idx: number[] = [];
    let base = 0;
    streams.forEach((s, si) => {
      const curve = new THREE.CatmullRomCurve3(s.pts, !!s.closed, 'centripetal');
      const len = curve.getLength();
      const n = Math.max(24, Math.round(len / 1.6));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const p = curve.getPointAt(t);
        const d = curve.getTangentAt(t);
        for (const sd of [-1, 1]) {
          pos.push(p.x, p.y, p.z);
          tan.push(d.x, d.y, d.z);
          side.push(sd * s.w);
          along.push(t * len, s.closed ? -1 : t);
          seed.push(si * 1.618 + s.speed, s.speed);
        }
        if (i < n) {
          const a = base + i * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      base += (n + 1) * 2;
    });
    const geo = bin.add(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
    geo.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
    geo.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 2));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 2));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    this.u = { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uAlpha: { value: 1 } };
    const mat = bin.add(
      new THREE.ShaderMaterial({
        uniforms: this.u,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute vec3 aTan; attribute float aSide; attribute vec2 aAlong; attribute vec2 aSeed;
          varying vec2 vA; varying float vS; varying vec2 vSeed; varying float vDist;
          void main(){
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vec3 toCam = normalize(cameraPosition - wp.xyz);
            vec3 sd = normalize(cross(aTan, toCam));
            float taper = aAlong.y < 0.0 ? 1.0 : smoothstep(0.0, 0.12, aAlong.y) * smoothstep(1.0, 0.88, aAlong.y);
            wp.xyz += sd * aSide * taper;
            vA = aAlong; vS = sign(aSide); vSeed = aSeed;
            vDist = length(cameraPosition - wp.xyz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uColor; uniform float uAlpha;
          varying vec2 vA; varying float vS; varying vec2 vSeed; varying float vDist;
          void main(){
            float edge = 1.0 - abs(vS);
            // long dashes chasing each other (two trains at different speeds)
            float x = vA.x / 14.0 - uTime * (0.55 + vSeed.y * 0.35) + vSeed.x;
            float dash = smoothstep(0.0, 0.25, fract(x)) * smoothstep(0.62, 0.3, fract(x));
            float x2 = vA.x / 6.0 - uTime * (0.9 + vSeed.y * 0.4) + vSeed.x * 3.0;
            dash = max(dash, 0.55 * smoothstep(0.0, 0.2, fract(x2)) * smoothstep(0.45, 0.25, fract(x2)));
            float ends = vA.y < 0.0 ? 1.0 : smoothstep(0.0, 0.1, vA.y) * smoothstep(1.0, 0.9, vA.y);
            float far = 1.0 - smoothstep(120.0, 260.0, vDist);
            float near = smoothstep(4.0, 14.0, vDist);
            float a = dash * ends * far * near * uAlpha * (0.35 + 0.65 * smoothstep(0.0, 1.0, edge));
            if (a < 0.004) discard;
            gl_FragColor = vec4(uColor * a, 1.0);
          }`,
      }),
    );
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    this.mesh.name = 'wind';
  }
  update(t: number, night: number, overcast: number) {
    this.u.uTime.value = t;
    this.u.uAlpha.value = (0.42 - night * 0.18) * (1 + overcast * 0.6);
  }
}

/** a gently undulating current: an arc around (cx,cz) at height y, from angle a0 to a1 */
export function arcStream(cx: number, cz: number, r: number, y: number, a0: number, a1: number, rng: () => number, w = 0.35, speed = 1): Stream {
  const pts: THREE.Vector3[] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const rr = r * (1 + (rng() - 0.5) * 0.16);
    pts.push(new THREE.Vector3(cx + Math.cos(a) * rr, y + Math.sin(i * 1.3 + rng() * 2) * 2.2 + (rng() - 0.5) * 1.5, cz + Math.sin(a) * rr));
  }
  return { pts, w, speed };
}
