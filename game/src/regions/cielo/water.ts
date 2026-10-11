/**
 * Water of the sky layer: falling sheets (a curved ribbon along a path — they fall UP in the Islas
 * Invertidas and DOWN off Corona Celeste's perfect canals), flowing river/canal strips and still
 * ponds. All toon-styled: flat teal body, white flow streaks, foam lips, soft dissolving ends.
 */
import * as THREE from 'three';
import { GLSL_NOISE } from '../../engine/world/ocean';
import type { Bin } from '../paginas/kit';
import type { U } from './kit';

export interface WaterLook {
  deep: string;
  light: string;
  foam: string;
}

export const WATER_INV: WaterLook = { deep: '#2fa6c8', light: '#8ff0e8', foam: '#f4fffd' };
export const WATER_CORONA: WaterLook = { deep: '#4cb6e6', light: '#bdf2ff', foam: '#ffffff' };

/**
 * A falling sheet along `pts` (lip first). `side` is the sheet's horizontal across-direction. Width can
 * vary along it. `up`: the streaks race toward the END of the path (it is the flow direction either way;
 * the flag only changes how the far end dissolves: into the sky as mist, or into the clouds).
 */
export function fallSheet(bin: Bin, pts: THREE.Vector3[], side: THREE.Vector3, width: (t: number) => number, look: WaterLook, uTime: U<number>, uNight: U<number>, o: { speed?: number; up?: boolean } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const len = curve.getLength();
  const N = Math.max(24, Math.round(len / 1.2));
  const J = 6;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const sd = side.clone().normalize();
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const tg = curve.getTangentAt(t);
    const nrm = new THREE.Vector3().crossVectors(sd, tg).normalize();
    const w = width(t);
    for (let j = 0; j <= J; j++) {
      const u = j / J;
      const x = (u - 0.5) * 2;
      const q = p.clone().addScaledVector(sd, x * w).addScaledVector(nrm, (1 - x * x) * w * 0.32);
      pos.push(q.x, q.y, q.z);
      uv.push(u, t * len);
    }
    if (i < N)
      for (let j = 0; j < J; j++) {
        const a = i * (J + 1) + j;
        const b = a + J + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
  }
  const geo = bin.add(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  const u = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uDeep: { value: new THREE.Color(look.deep) },
      uLight: { value: new THREE.Color(look.light) },
      uFoam: { value: new THREE.Color(look.foam) },
      uLen: { value: len },
      uSpeed: { value: o.speed ?? 6 },
      uUp: { value: o.up ? 1 : 0 },
    },
  ]);
  u.uTime = uTime;
  u.uNightW = uNight;
  const mat = bin.add(
    new THREE.ShaderMaterial({
      uniforms: u,
      fog: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        #include <fog_pars_vertex>
        void main(){
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uNightW; uniform vec3 uDeep; uniform vec3 uLight; uniform vec3 uFoam;
        uniform float uLen; uniform float uSpeed; uniform float uUp;
        varying vec2 vUv;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        void main(){
          float t = vUv.y / uLen;
          float d = vUv.y - uTime * uSpeed;
          // columns of water: streaks that race along the flow
          float col = vn(vec2(vUv.x * 9.0, d * 0.08));
          float streak = smoothstep(0.55, 0.85, vn(vec2(vUv.x * 14.0 + 3.0, d * 0.22)));
          vec3 c = mix(uDeep, uLight, col * 0.7 + 0.15);
          c = mix(c, uFoam, streak * 0.75);
          // foam at the lip, and the far end turns to mist
          float lip = 1.0 - smoothstep(0.0, 2.2, vUv.y);
          c = mix(c, uFoam, lip * 0.85);
          float mist = smoothstep(0.62, 1.0, t);
          c = mix(c, uFoam, mist * 0.7);
          float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
          float tear = smoothstep(0.25, 0.55, vn(vec2(vUv.x * 6.0, d * 0.05 + 7.0)) + (1.0 - mist));
          float a = edge * mix(0.88, 0.0, smoothstep(0.7, 1.0, t)) * mix(1.0, tear, mist);
          c *= mix(1.0, 0.62, uNightW);
          c += uLight * uNightW * 0.12 * streak;
          gl_FragColor = vec4(c, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    }),
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 4;
  mesh.frustumCulled = false;
  return { mesh, curve, len };
}

/** a flowing strip over a polyline at water level y(t) (rivers, canals): streaks follow the polyline */
export function flowStrip(bin: Bin, line: [number, number][], y: (t: number) => number, width: number, look: WaterLook, uTime: U<number>, uNight: U<number>, speed = 2.2) {
  const pts = line.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const len = curve.getLength();
  const N = Math.max(16, Math.round(len / 0.8));
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const tg = curve.getTangentAt(t);
    const sx = -tg.z;
    const sz = tg.x;
    const sl = Math.hypot(sx, sz) || 1;
    for (const k of [-1, 1]) {
      pos.push(p.x + (sx / sl) * width * k, y(t), p.z + (sz / sl) * width * k);
      uv.push(k < 0 ? 0 : 1, t * len);
    }
    if (i < N) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = bin.add(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return new THREE.Mesh(geo, surfaceMaterial(bin, look, uTime, uNight, speed, 'strip'));
}

/** a still (rippling) round pond */
export function pond(bin: Bin, x: number, y: number, z: number, r: number, look: WaterLook, uTime: U<number>, uNight: U<number>) {
  const geo = bin.add(new THREE.CircleGeometry(r, 40));
  geo.rotateX(-Math.PI / 2);
  // uv: radial distance in world units (x) and angle (y)
  const p = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) uv.setXY(i, Math.hypot(p.getX(i), p.getZ(i)) / r, Math.atan2(p.getZ(i), p.getX(i)));
  const m = new THREE.Mesh(geo, surfaceMaterial(bin, look, uTime, uNight, 0.6, 'pond'));
  m.position.set(x, y, z);
  return m;
}

function surfaceMaterial(bin: Bin, look: WaterLook, uTime: U<number>, uNight: U<number>, speed: number, kind: 'strip' | 'pond') {
  const u = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uDeep: { value: new THREE.Color(look.deep) },
      uLight: { value: new THREE.Color(look.light) },
      uFoam: { value: new THREE.Color(look.foam) },
      uSpeed: { value: speed },
    },
  ]);
  u.uTime = uTime;
  u.uNightW = uNight;
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: u,
      fog: true,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vW = wp.xyz;
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uNightW; uniform vec3 uDeep; uniform vec3 uLight; uniform vec3 uFoam; uniform float uSpeed;
        varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        void main(){
          vec3 c;
          float a;
          ${
            kind === 'strip'
              ? `float d = vUv.y - uTime * uSpeed;
          float across = abs(vUv.x - 0.5) * 2.0;
          float st = smoothstep(0.6, 0.85, vn(vec2(vUv.x * 7.0, d * 0.35)));
          c = mix(uDeep, uLight, 0.35 + 0.4 * vn(vec2(vUv.x * 3.0, d * 0.12)));
          c = mix(c, uFoam, st * 0.6 + smoothstep(0.7, 1.0, across) * 0.55);
          a = mix(0.92, 0.55, smoothstep(0.75, 1.0, across));`
              : `float ring = smoothstep(0.75, 1.0, fract(vUv.x * 4.0 - uTime * uSpeed * 0.5)) * (1.0 - vUv.x);
          c = mix(uDeep, uLight, 0.25 + 0.5 * vn(vW.xz * 0.6 + uTime * 0.2));
          c = mix(c, uFoam, ring * 0.35 + smoothstep(0.86, 1.0, vUv.x) * 0.7);
          a = mix(0.9, 0.7, vUv.x);`
          }
          c *= mix(1.0, 0.6, uNightW);
          gl_FragColor = vec4(c, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    }),
  );
  return m;
}
