/**
 * HEMKADE — materials: one toon material (COLOSO ↔ GRABADO through the shared uniforms) and its inverted-hull outline
 * (screen-space width, so a 400 m whale and a 16 m ship carry the same anime line).
 */
import * as THREE from 'three';
import { STYLE_FUNCS, STYLE_UNIFORMS, VARY } from './glsl';

export type U = Record<string, THREE.IUniform>;

/** the one bundle every material shares (world.ts owns the values) */
export function sharedUniforms(): U {
  return {
    uTime: { value: 0 },
    uStyle: { value: 0 },
    uWipe: { value: 0 },
    uReveal: { value: 1 },
    uPaper: { value: new THREE.Color(0xf1e6cf) },
    uInk: { value: new THREE.Color(0x2a2018) },
    uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    uSunCol: { value: new THREE.Color(0xfff1d6) },
    uAmbTop: { value: new THREE.Color(0x8fb4ff) },
    uAmbBot: { value: new THREE.Color(0x203050) },
    uFogCol: { value: new THREE.Color(0x6a7fb0) },
    uFogNear: { value: 400 },
    uFogFar: { value: 4000 },
    uFogMax: { value: 0.85 },
    uKick: { value: 0 },
    uFlash: { value: 0 },
    uFlashCol: { value: new THREE.Color(0xffffff) },
    uRes: { value: new THREE.Vector2(1920, 1080) },
  };
}

export interface ToonOpts {
  base: number;
  shadow: number;
  light: number;
  /** engraving line frequency (lines per uv unit / per metre in 'world' mode) */
  freq?: number;
  /** 'uv': lines follow the mesh's uv (form) · 'world': parallel lines in world xz/y */
  lines?: 'uv' | 'world';
  /** a seed so neighbouring meshes reveal differently */
  seed?: number;
  side?: THREE.Side;
  /** GLSL injected before main() in the vertex shader */
  vHead?: string;
  /** GLSL inside main(): may change `p` (object position) and `n` (object normal) */
  vBody?: string;
  /** GLSL before main() in the fragment shader */
  fHead?: string;
  /** GLSL inside main() after base/shadow/light/emis are set: may change them (vars: base, shadowC, lightC, emis, n, v, ndl) */
  fBody?: string;
  /** extra uniforms (own values) */
  uniforms?: U;
  /** vertex colors multiply the base (instanced clouds) */
  instanceColor?: boolean;
}

const VERT = (o: ToonOpts) => /* glsl */ `
${STYLE_UNIFORMS}
${VARY}
${o.vHead ?? ''}
void main() {
  vec3 p = position;
  vec3 n = normal;
  ${o.vBody ?? ''}
  vec4 wp = vec4(p, 1.0);
  #ifdef USE_INSTANCING
  wp = instanceMatrix * wp;
  n = mat3(instanceMatrix) * n;
  #endif
  wp = modelMatrix * wp;
  vN = normalize(mat3(modelMatrix) * n);
  vW = wp.xyz;
  vUv = uv;
  #ifdef USE_INSTANCING_COLOR
  vIC = instanceColor;
  #endif
  vec4 mv = viewMatrix * wp;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = (o: ToonOpts) => /* glsl */ `
${STYLE_UNIFORMS}
${VARY}
uniform vec3 uBase;
uniform vec3 uShadow;
uniform vec3 uLight;
uniform float uFreq;
uniform float uSeed;
${o.fHead ?? ''}
${STYLE_FUNCS}
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vW);
  float ndl = dot(n, normalize(uSunDir));
  float rim = 1.0 - max(dot(n, v), 0.0);
  vec3 base = uBase;
  vec3 shadowC = uShadow;
  vec3 lightC = uLight;
  vec3 emis = vec3(0.0);
  #ifdef USE_INSTANCING_COLOR
  base *= vIC; shadowC *= vIC; lightC *= mix(vec3(1.0), vIC, 0.5);
  #endif
  ${o.fBody ?? ''}
  vec3 toon = toonShade(base, shadowC, lightC, ndl, rim);
  // sky / sea bounce in the shadow band
  toon += mix(uAmbBot, uAmbTop, n.y * 0.5 + 0.5) * 0.08;
  toon += emis;
  toon = mix(toon, toon * 0.4 + uFlashCol * 0.75, uFlash * (0.5 + 0.5 * max(ndl, 0.0)));
  float fogK = smoothstep(uFogNear, uFogFar, vDist) * uFogMax;
  toon = mix(toon, uFogCol, fogK);
  // the plate: light from the same sun, lines along the form (uv) or the world
  float lit = smoothstep(-0.55, 0.85, ndl) * 0.85 + 0.15 * (1.0 - rim);
  ${o.lines === 'world' ? 'float s1 = (vW.y * 0.8 + vW.x * 0.2) * uFreq; float s2 = (vW.x * 0.7 - vW.z * 0.7) * uFreq;' : 'float s1 = vUv.y * uFreq; float s2 = (vUv.x * 0.6 + vUv.y * 0.8) * uFreq * 0.9;'}
  vec3 plate = engrave(lit + length(emis) * 0.6, s1, s2, uSeed);
  plate = mix(plate, uPaper, fogK * 0.9);
  gl_FragColor = vec4(styleMix(toon, plate), 1.0);
}
`;

export function toonMat(shared: U, o: ToonOpts): THREE.ShaderMaterial {
  const head = o.instanceColor ? 'varying vec3 vIC;\n' : '';
  const m = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uBase: { value: new THREE.Color(o.base) },
      uShadow: { value: new THREE.Color(o.shadow) },
      uLight: { value: new THREE.Color(o.light) },
      uFreq: { value: o.freq ?? 40 },
      uSeed: { value: o.seed ?? 1 },
      ...(o.uniforms ?? {}),
    },
    vertexShader: head + VERT(o),
    fragmentShader: head + FRAG(o),
    side: o.side ?? THREE.FrontSide,
  });
  return m;
}

/** the inverted hull: constant screen width (px at 1080p), outline color in COLOSO, ink in GRABADO */
export function outlineMat(shared: U, o: { color: number; px: number; vHead?: string; vBody?: string; uniforms?: U; cut?: number }): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uOutCol: { value: new THREE.Color(o.color) }, uPx: { value: o.px }, uCut: { value: o.cut ?? 0 }, ...(o.uniforms ?? {}) },
    vertexShader: /* glsl */ `
${STYLE_UNIFORMS}
uniform float uPx;
varying float vDist;
${o.vHead ?? ''}
void main() {
  vec3 p = position;
  vec3 n = normal;
  ${o.vBody ?? ''}
  vec4 wp = vec4(p, 1.0);
  #ifdef USE_INSTANCING
  wp = instanceMatrix * wp;
  n = mat3(instanceMatrix) * n;
  #endif
  wp = modelMatrix * wp;
  vec3 wn = normalize(mat3(modelMatrix) * n);
  vec4 mv = viewMatrix * wp;
  vDist = -mv.z;
  vec4 clip = projectionMatrix * mv;
  vec3 vn = mat3(viewMatrix) * wn;
  vec2 d = (projectionMatrix * vec4(vn, 0.0)).xy;
  float l = length(d);
  d = l > 1e-5 ? d / l : vec2(0.0);
  float px = uPx * (1.0 + uStyle * 0.5) * (uRes.y / 1080.0);
  clip.xy += d * px * 2.0 / uRes * clip.w;
  gl_Position = clip;
}`,
    fragmentShader: /* glsl */ `
${STYLE_UNIFORMS}
uniform vec3 uOutCol;
uniform float uCut;
varying float vDist;
void main() {
  if (vDist < uCut) discard;
  float fogK = smoothstep(uFogNear, uFogFar, vDist) * uFogMax;
  vec3 c = mix(uOutCol, uFogCol, fogK * 0.8);
  vec3 ink = mix(uInk, uPaper, fogK * 0.85);
  float s = uStyle;
  if (uWipe > 0.0) s = step(gl_FragCoord.x / uRes.x + (gl_FragCoord.y / uRes.y) * 0.18, uWipe * 1.2);
  gl_FragColor = vec4(mix(c, ink, s), 1.0);
}`,
    side: THREE.BackSide,
  });
}

/** a mesh + its outline twin sharing the geometry */
export function inked(geo: THREE.BufferGeometry, mat: THREE.ShaderMaterial, out: THREE.ShaderMaterial | null): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat);
  g.add(m);
  if (out) {
    const o = new THREE.Mesh(geo, out);
    o.renderOrder = -1;
    g.add(o);
  }
  return g;
}

/** a deterministic PRNG (mulberry32) */
export function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
