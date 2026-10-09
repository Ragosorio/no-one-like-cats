/**
 * GPU particles (AgentGameEngine `fx/particles`): one Points draw call per pool; the CPU only writes
 * a particle's birth data once (ring buffer), motion is evaluated in the vertex shader
 * (p = p0 + v·t + ½·g·t² + curl-ish wobble). Budgets come from the quality tier.
 */
import * as THREE from 'three';

export interface Burst {
  pos: THREE.Vector3Like;
  /** spawn box half-extent */
  spread?: THREE.Vector3Like;
  vel?: THREE.Vector3Like;
  velJitter?: THREE.Vector3Like;
  life?: number;
  size?: number;
  color?: THREE.ColorRepresentation;
  color2?: THREE.ColorRepresentation;
  count?: number;
}

const tc = new THREE.Color();
const tc2 = new THREE.Color();

export class ParticlePool {
  readonly points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private a0: THREE.BufferAttribute; // xyz birth pos, w birth time
  private a1: THREE.BufferAttribute; // xyz velocity, w life
  private a2: THREE.BufferAttribute; // rgb, size
  private a3: THREE.BufferAttribute; // rgb end color, seed
  private head = 0;
  private time = 0;
  readonly u: Record<string, THREE.IUniform>;
  /** fraction of requested particles actually spawned (quality tier) */
  budget = 1;

  constructor(
    readonly capacity: number,
    o: { gravity?: number; wobble?: number; additive?: boolean; soft?: number; shape?: 'dot' | 'star' | 'flake' | 'streak' } = {},
  ) {
    this.geo = new THREE.BufferGeometry();
    const mk = (n: number) => new THREE.BufferAttribute(new Float32Array(capacity * n), n).setUsage(THREE.DynamicDrawUsage);
    this.a0 = mk(4);
    this.a1 = mk(4);
    this.a2 = mk(4);
    this.a3 = mk(4);
    for (let i = 0; i < capacity; i++) this.a1.setW(i, -1);
    this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(capacity * 3), 3));
    this.geo.setAttribute('a0', this.a0);
    this.geo.setAttribute('a1', this.a1);
    this.geo.setAttribute('a2', this.a2);
    this.geo.setAttribute('a3', this.a3);
    const shapeId = { dot: 0, star: 1, flake: 2, streak: 3 }[o.shape ?? 'dot'];
    this.u = {
      uTime: { value: 0 },
      uGravity: { value: o.gravity ?? 0 },
      uWobble: { value: o.wobble ?? 0 },
      uScale: { value: 300 },
      uShape: { value: shapeId },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: o.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec4 a0; attribute vec4 a1; attribute vec4 a2; attribute vec4 a3;
        uniform float uTime; uniform float uGravity; uniform float uWobble; uniform float uScale;
        varying vec3 vCol; varying float vA; varying float vSeed;
        void main(){
          float t = uTime - a0.w; float life = a1.w;
          if (life <= 0.0 || t < 0.0 || t > life) { gl_Position = vec4(2.0,2.0,2.0,1.0); gl_PointSize = 0.0; return; }
          float k = t / life;
          vec3 p = a0.xyz + a1.xyz * t + vec3(0.0, -0.5 * uGravity * t * t, 0.0);
          p.x += sin(t * 2.3 + a3.w * 40.0) * uWobble * t;
          p.z += cos(t * 1.9 + a3.w * 31.0) * uWobble * t;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float sz = a2.w * (1.0 - k * 0.6) * smoothstep(0.0, 0.08, k);
          gl_PointSize = sz * uScale / -mv.z;
          vCol = mix(a2.rgb, a3.rgb, k);
          vA = smoothstep(1.0, 0.65, k);
          vSeed = a3.w;
        }`,
      fragmentShader: /* glsl */ `
        uniform int uShape; varying vec3 vCol; varying float vA; varying float vSeed;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float r = length(c); float a;
          if (uShape == 1) { float s = abs(c.x) * abs(c.y) * 40.0; a = smoothstep(0.5, 0.0, r) * (0.35 + smoothstep(0.12, 0.0, s) * 0.9); }
          else if (uShape == 2) { a = smoothstep(0.5, 0.35, r); }
          else if (uShape == 3) { a = smoothstep(0.08, 0.0, abs(c.x)) * smoothstep(0.5, 0.2, abs(c.y)); }
          else { a = smoothstep(0.5, 0.0, r); }
          if (a < 0.01) discard;
          gl_FragColor = vec4(vCol, a * vA);
        }`,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }

  emit(b: Burst) {
    const n = Math.max(0, Math.round((b.count ?? 1) * this.budget));
    if (!n) return;
    tc.set(b.color ?? '#ffffff');
    tc2.set(b.color2 ?? b.color ?? '#ffffff');
    const sp = b.spread ?? { x: 0, y: 0, z: 0 };
    const v = b.vel ?? { x: 0, y: 0, z: 0 };
    const vj = b.velJitter ?? { x: 0, y: 0, z: 0 };
    const r = () => Math.random() * 2 - 1;
    for (let k = 0; k < n; k++) {
      const i = this.head;
      this.head = (this.head + 1) % this.capacity;
      this.a0.setXYZW(i, b.pos.x + r() * sp.x, b.pos.y + r() * sp.y, b.pos.z + r() * sp.z, this.time);
      this.a1.setXYZW(i, v.x + r() * vj.x, v.y + r() * vj.y, v.z + r() * vj.z, (b.life ?? 1.5) * (0.75 + Math.random() * 0.5));
      this.a2.setXYZW(i, tc.r, tc.g, tc.b, (b.size ?? 0.2) * (0.7 + Math.random() * 0.6));
      this.a3.setXYZW(i, tc2.r, tc2.g, tc2.b, Math.random());
    }
    // upload only what changed would need ranges per attribute; the pools are small, full upload is fine
    this.a0.needsUpdate = this.a1.needsUpdate = this.a2.needsUpdate = this.a3.needsUpdate = true;
  }

  update(dt: number, viewportH: number) {
    this.time += dt;
    this.u.uTime.value = this.time;
    this.u.uScale.value = viewportH * 0.9;
  }

  dispose() {
    this.geo.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
