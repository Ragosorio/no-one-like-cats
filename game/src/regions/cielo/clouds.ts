/**
 * The floor of the sky layer: a SEA OF CLOUDS instead of an ocean, and the Primer Mar far, far below,
 * glimpsed through its gaps (parallax: the sea is sampled `depth` units under the cloud plane along the
 * view ray, so it slides like something really far down). Plus instanced cloud PUFFS — toon-shaded
 * cumulus blobs that collar the islands, drift between them and pile into towers on the horizon.
 * Both read the region's sky state every frame (sun, moon, horizon, deep/shallow sea, night).
 */
import * as THREE from 'three';
import { GLSL_NOISE } from '../../engine/world/ocean';
import type { SkyState } from '../../engine/world/sky';
import type { Bin } from '../paginas/kit';

export interface CloudPalette {
  /** lit tops by day / shaded flanks (tinted toward the sky every frame) */
  lit: string;
  shade: string;
  /** night tops (moonlit) */
  litNight: string;
  shadeNight: string;
  /** rim glow where the clouds turn away from you */
  rim: string;
}

const NOISE = /* glsl */ `${GLSL_NOISE}
float fbm4(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; } return s / 0.9375; }`;

export class CloudSea {
  readonly mesh: THREE.Mesh;
  readonly u: Record<string, THREE.IUniform>;
  private lit = new THREE.Color();
  private shade = new THREE.Color();
  private litN = new THREE.Color();
  private shadeN = new THREE.Color();
  private tmp = new THREE.Color();
  constructor(
    bin: Bin,
    o: { y: number; size?: number; depth?: number; gap?: number; palette: CloudPalette; drift?: [number, number] },
  ) {
    this.lit.set(o.palette.lit);
    this.shade.set(o.palette.shade);
    this.litN.set(o.palette.litNight);
    this.shadeN.set(o.palette.shadeNight);
    this.u = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uNight: { value: 0 },
        uGap: { value: o.gap ?? 0.4 },
        uDepth: { value: o.depth ?? 420 },
        uDrift: { value: new THREE.Vector2(...(o.drift ?? [1.1, 0.4])) },
        uLit: { value: new THREE.Color() },
        uShade: { value: new THREE.Color() },
        uRim: { value: new THREE.Color(o.palette.rim) },
        uHorizon: { value: new THREE.Color() },
        uSeaDeep: { value: new THREE.Color() },
        uSeaShallow: { value: new THREE.Color() },
        uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2) },
        uSunCol: { value: new THREE.Color() },
      },
    ]);
    const size = o.size ?? 2600;
    const geo = bin.add(new THREE.PlaneGeometry(size, size, 1, 1));
    geo.rotateX(-Math.PI / 2);
    const mat = bin.add(
      new THREE.ShaderMaterial({
        uniforms: this.u,
        fog: true,
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          #include <fog_pars_vertex>
          void main(){
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorld = wp.xyz;
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uNight; uniform float uGap; uniform float uDepth; uniform vec2 uDrift;
          uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uRim; uniform vec3 uHorizon;
          uniform vec3 uSeaDeep; uniform vec3 uSeaShallow; uniform vec3 uSunDir; uniform vec3 uSunCol;
          varying vec3 vWorld;
          #include <fog_pars_fragment>
          ${NOISE}
          float dens(vec2 p){
            float a = fbm4(p);
            float b = vn(p * 3.1 + 5.0);
            // billows: rounded humps (1 - |2n-1|) on top of the big masses
            float bill = 1.0 - abs(2.0 * vn(p * 1.7 - 2.3) - 1.0);
            return a * 0.68 + bill * 0.22 + b * 0.1;
          }
          void main(){
            vec2 p = (vWorld.xz + uDrift * uTime) * 0.011;
            float d = dens(p);
            // fake normals from the density field (a height map of cloud tops), from screen-space
            // derivatives solved back to world xz (two fewer fbm evaluations per pixel)
            vec2 wx = dFdx(vWorld.xz);
            vec2 wy = dFdy(vWorld.xz);
            float ddx = dFdx(d);
            float ddy = dFdy(d);
            float det = wx.x * wy.y - wx.y * wy.x;
            vec2 g = abs(det) > 1e-6 ? vec2(ddx * wy.y - ddy * wx.y, wx.x * ddy - wy.x * ddx) / det : vec2(0.0);
            g = clamp(g * 24.0, vec2(-3.0), vec2(3.0));
            vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
            vec3 V = normalize(cameraPosition - vWorld);
            float ndl = dot(N, normalize(uSunDir));
            // toon: three soft bands
            float band = smoothstep(0.18, 0.26, ndl) * 0.5 + smoothstep(0.62, 0.7, ndl) * 0.5;
            vec3 col = mix(uShade, uLit, 0.25 + band * 0.75);
            // deeper hollows are bluer, crests catch the sun
            col = mix(col * vec3(0.86, 0.9, 1.0), col, smoothstep(uGap, uGap + 0.25, d));
            col += uSunCol * pow(max(ndl, 0.0), 14.0) * 0.14 * (1.0 - uNight);
            float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
            col += uRim * rim * 0.18;
            // GAPS: the Primer Mar, far below (parallax along the view ray)
            vec3 ray = normalize(vWorld - cameraPosition);
            vec2 sxz = vWorld.xz + ray.xz / max(-ray.y, 0.06) * uDepth;
            float sn = fbm4(sxz * 0.0035);
            vec3 sea = mix(uSeaShallow, uSeaDeep, smoothstep(0.35, 0.65, sn));
            float wave = smoothstep(0.55, 0.95, sin(sxz.x * 0.09 + sxz.y * 0.05 + vn(sxz * 0.02) * 6.0 + uTime * 0.4));
            sea = mix(sea, sea * 1.25 + 0.05, wave * 0.25);
            // tiny islands down there (Part I's sea goes on without us)
            float isl = smoothstep(0.735, 0.75, vn(sxz * 0.0045 + 3.7));
            sea = mix(sea, mix(vec3(0.85, 0.78, 0.55), vec3(0.42, 0.62, 0.38), smoothstep(0.75, 0.8, vn(sxz * 0.0045 + 3.7))), isl);
            // glints of sun / moon on the far sea
            float gl = step(0.985, vn(sxz * 0.3 + uTime * 0.6)) * (0.5 + 0.5 * (1.0 - uNight));
            sea += gl * 0.35;
            // it is far: hazy, half the color is air
            sea = mix(sea, uHorizon, 0.42);
            float cloud = smoothstep(uGap - 0.035, uGap + 0.05, d);
            // the gap's rim: a thin bright lip of cloud (wisps lit from the side)
            float lip = smoothstep(uGap - 0.035, uGap + 0.01, d) * (1.0 - smoothstep(uGap + 0.01, uGap + 0.06, d));
            col = mix(sea, col, cloud) + uLit * lip * 0.12;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    );
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.y = o.y;
    this.mesh.name = 'cloud-sea';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -5;
  }

  /** follow the sky (call every frame) */
  update(t: number, s: SkyState, overcast: number) {
    const u = this.u;
    u.uTime.value = t;
    u.uNight.value = s.night;
    const n = Math.min(1, s.night * 1.15);
    // day: the cloud is white tinted by the sun; its shade borrows the sky's hemisphere
    this.tmp.copy(this.lit).lerp(s.sun, 0.18);
    u.uLit.value.copy(this.tmp).lerp(this.litN, n);
    this.tmp.copy(this.shade).lerp(s.hemiSky, 0.25);
    u.uShade.value.copy(this.tmp).lerp(this.shadeN, n);
    if (overcast > 0) {
      u.uLit.value.lerp(this.tmp.set('#9aa3b4'), overcast * 0.5);
      u.uShade.value.lerp(this.tmp.set('#5d6578'), overcast * 0.5);
    }
    u.uHorizon.value.copy(s.fog);
    u.uSeaDeep.value.copy(s.deep);
    u.uSeaShallow.value.copy(s.shallow);
    u.uSunDir.value.copy(s.night > 0.55 ? s.moonDir : s.sunDir);
    u.uSunCol.value.copy(s.sun);
  }
}

export interface Puff {
  x: number;
  y: number;
  z: number;
  /** radius (x/z), and how flat (y scale factor) */
  r: number;
  flat?: number;
  tint?: number;
}

/** instanced toon cumulus blobs (one draw call): lit tops, blue-grey bellies, a soft rim, slow billow */
export class CloudPuffs {
  readonly mesh: THREE.InstancedMesh;
  readonly u: Record<string, THREE.IUniform>;
  constructor(bin: Bin, puffs: Puff[], o: { detail?: number } = {}) {
    this.u = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uLit: { value: new THREE.Color('#ffffff') },
        uShade: { value: new THREE.Color('#9fb0d8') },
        uRim: { value: new THREE.Color('#ffffff') },
        uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2) },
      },
    ]);
    const geo = bin.add(new THREE.IcosahedronGeometry(1, o.detail ?? 2));
    const mat = bin.add(
      new THREE.ShaderMaterial({
        uniforms: this.u,
        fog: true,
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec3 vN; varying vec3 vWorld; varying float vTint; varying float vLocalY;
          #include <fog_pars_vertex>
          void main(){
            vec3 p = position;
            float seed = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.07;
            // billow: lumps that breathe slowly
            float lump = sin(p.x * 3.1 + seed + uTime * 0.35) * sin(p.y * 2.7 - seed) * sin(p.z * 2.9 + uTime * 0.27);
            p += normal * lump * 0.09;
            vLocalY = p.y;
            vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
            vWorld = wp.xyz;
            vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
            vTint = 1.0;
            #ifdef USE_INSTANCING_COLOR
              vTint = instanceColor.r;
            #endif
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uRim; uniform vec3 uSunDir;
          varying vec3 vN; varying vec3 vWorld; varying float vTint; varying float vLocalY;
          #include <fog_pars_fragment>
          void main(){
            vec3 N = normalize(vN);
            vec3 V = normalize(cameraPosition - vWorld);
            float ndl = dot(N, normalize(uSunDir));
            float band = smoothstep(-0.05, 0.05, ndl) * 0.55 + smoothstep(0.5, 0.58, ndl) * 0.45;
            vec3 col = mix(uShade, uLit, 0.2 + band * 0.8);
            // bellies: the underside of a cloud is always a little grey-blue
            col = mix(col, uShade * 0.92, smoothstep(0.1, -0.7, N.y) * 0.55);
            float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);
            col += uRim * rim * 0.22;
            col *= vTint;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    );
    this.mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, puffs.length));
    const o3 = new THREE.Object3D();
    const c = new THREE.Color();
    puffs.forEach((p, i) => {
      o3.position.set(p.x, p.y, p.z);
      o3.rotation.set(0, (p.x * 0.37 + p.z * 0.21) % 6.28, 0);
      o3.scale.set(p.r, p.r * (p.flat ?? 0.62), p.r * (0.85 + ((p.x * 7.1 + p.z) % 1) * 0.0));
      o3.updateMatrix();
      this.mesh.setMatrixAt(i, o3.matrix);
      const k = p.tint ?? 1;
      this.mesh.setColorAt(i, c.setRGB(k, k, k));
    });
    this.mesh.count = puffs.length;
    this.mesh.frustumCulled = false;
    this.mesh.name = 'cloud-puffs';
  }

  update(t: number, sea: CloudSea) {
    const u = this.u;
    u.uTime.value = t;
    u.uLit.value.copy(sea.u.uLit.value);
    u.uShade.value.copy(sea.u.uShade.value);
    u.uRim.value.copy(sea.u.uRim.value);
    u.uSunDir.value.copy(sea.u.uSunDir.value);
  }
}

/** a cumulus cluster: a few overlapping puffs around a center (rng = the region's seeded random) */
export function cluster(out: Puff[], rng: () => number, x: number, y: number, z: number, size: number, n = 6, flat = 0.6) {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * size * 0.9;
    const r = size * (0.45 + rng() * 0.5) * (1 - (d / size) * 0.35);
    out.push({ x: x + Math.cos(a) * d, y: y + rng() * size * 0.25 + (1 - d / size) * size * 0.2, z: z + Math.sin(a) * d * 0.7, r, flat, tint: 0.94 + rng() * 0.08 });
  }
}
