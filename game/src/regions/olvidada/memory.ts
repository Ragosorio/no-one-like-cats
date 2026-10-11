/**
 * The MEMORY lens of La Isla que Nadie Recuerda (art bible §7: «desaturación selectiva: solo tus gatos conservan
 * color»): everything on the island is drawn sepia, like an old photo, EXCEPT within reach of a repaired ruin —
 * color comes back in a ring that opens from each ruin you raise («como cuando alguien abre una ventana»), and
 * the last one sends a wave over the whole island. Your visiting cats keep their colors all along.
 *
 * One set of uniforms shared by every material of the region:
 *   uMemSrc[i] = (x, z, radius, glow)       a color source (radius grows when a ruin is raised; glow = its edge)
 *   uMemAll    0..1                          the whole island (the last wave)
 * `MEM_GLSL` declares them and `memApply(col, worldPos)`; the terrain gets it injected (patchTerrain), the props
 * use memToon() (vertex colors + night glow + the RUINS animation: broken parts sink, whole parts rise).
 */
import * as THREE from 'three';
import { toonGradient } from '../../engine/world/heightfield';
import type { Bin } from '../paginas/kit';

export const MAX_SRC = 10;
export const MAX_RUINS = 8;

export interface MemoryU {
  uMemSrc: { value: THREE.Vector4[] };
  uMemAll: { value: number };
  uMemTime: { value: number };
}
export function memoryUniforms(): MemoryU {
  return { uMemSrc: { value: Array.from({ length: MAX_SRC }, () => new THREE.Vector4()) }, uMemAll: { value: 0 }, uMemTime: { value: 0 } };
}

export const MEM_GLSL = /* glsl */ `
uniform vec4 uMemSrc[${MAX_SRC}]; uniform float uMemAll; uniform float uMemTime;
float memH(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float memN(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(memH(i), memH(i+vec2(1,0)), f.x), mix(memH(i+vec2(0,1)), memH(i+vec2(1,1)), f.x), f.y); }
float memK(vec3 wp, out float front){
  float k = uMemAll; front = 0.0;
  for (int i = 0; i < ${MAX_SRC}; i++){
    vec4 s = uMemSrc[i];
    if (s.z <= 0.0) continue;
    float d = length(wp.xz - s.xy);
    float wob = (memN(wp.xz * 0.35) - 0.5) * 2.6 + (memN(wp.xz * 1.3) - 0.5) * 0.8;
    k = max(k, 1.0 - smoothstep(s.z * 0.82, s.z, d + wob));
    // the opening edge glows warm while it travels (s.w: 1 while the window opens, fading after)
    front = max(front, smoothstep(1.4, 0.0, abs(d + wob - s.z)) * s.w);
  }
  return clamp(k, 0.0, 1.0);
}
vec3 memSepia(vec3 c){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return vec3(l * 1.06 + 0.035, l * 0.95 + 0.02, l * 0.76 + 0.01);
}
vec3 memApply(vec3 c, vec3 wp){
  float front;
  float k = memK(wp, front);
  vec3 old = memSepia(c) * (0.94 + 0.06 * memN(wp.xz * 2.1));
  return mix(old, c, k) + vec3(1.0, 0.9, 0.62) * front * 0.22;
}`;

const bindMem = (sh: { uniforms: Record<string, THREE.IUniform> }, mem: MemoryU) => {
  sh.uniforms.uMemSrc = mem.uMemSrc;
  sh.uniforms.uMemAll = mem.uMemAll;
  sh.uniforms.uMemTime = mem.uMemTime;
};

/** the engine's terrain material learns the memory lens (chained after its own onBeforeCompile) */
export function patchTerrain(m: THREE.MeshToonMaterial, mem: MemoryU) {
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    base.call(m, sh, r);
    bindMem(sh, mem);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${MEM_GLSL}`).replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = memApply(diffuseColor.rgb, vWPos);');
  };
  m.customProgramCacheKey = () => 'olvidada-terrain';
  m.needsUpdate = true;
}

export interface RuinU {
  uBuilt: { value: number[] };
  uRuinC: { value: THREE.Vector3[] };
}
export function ruinUniforms(): RuinU {
  return { uBuilt: { value: new Array(MAX_RUINS).fill(0) }, uRuinC: { value: Array.from({ length: MAX_RUINS }, () => new THREE.Vector3()) } };
}

/**
 * aRuin per vertex: −1 = scenery; else index + 16 × state (state 0 always there · 1 BROKEN only · 2 WHOLE only).
 * uBuilt[i] 0 → 1: the broken parts sink into the ground, the whole ones rise out of it (with a little overshoot).
 */
const RUIN_VERT_HEAD = /* glsl */ `
attribute float aRuin; uniform float uBuilt[${MAX_RUINS}]; uniform vec3 uRuinC[${MAX_RUINS}];
vec3 ruinMove(vec3 p){
  if (aRuin < 0.0) return p;
  float st = floor(aRuin / 16.0 + 0.01);
  if (st < 0.5) return p;
  int idx = int(mod(aRuin, 16.0) + 0.5);
  float e = clamp(uBuilt[idx], 0.0, 1.0);
  vec3 c = uRuinC[idx];
  if (st > 1.5) {
    if (e <= 0.001) return c;
    float x = e - 1.0;
    float b = 1.0 + 2.70158 * x * x * x + 1.70158 * x * x;
    float sxz = min(1.0, e * 1.8);
    return c + (p - c) * vec3(sxz, b, sxz);
  }
  if (e >= 0.999) return c - vec3(0.0, 2.0, 0.0);
  vec3 q = p - c;
  return c + vec3(q.x * (1.0 + e * 0.3), q.y * (1.0 - e) - e * 0.6, q.z * (1.0 + e * 0.3));
}`;

/** the props' material: vertex colors, 3-band toon, memory lens, glow at night (aGlow), the ruins' animation */
export function memToon(bin: Bin, mem: MemoryU, o: { uNight: { value: number }; ruins?: RuinU; key: string; bright?: number }) {
  const m = bin.add(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() }));
  const bright = o.bright ?? 0.06;
  m.onBeforeCompile = (sh) => {
    bindMem(sh, mem);
    sh.uniforms.uNightS = o.uNight;
    if (o.ruins) {
      sh.uniforms.uBuilt = o.ruins.uBuilt;
      sh.uniforms.uRuinC = o.ruins.uRuinC;
    }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aGlow; varying float vGlowS; varying vec3 vMemW;\n${o.ruins ? RUIN_VERT_HEAD : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n  vGlowS = aGlow;\n${o.ruins ? '  transformed = ruinMove(transformed);' : ''}`)
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n  vMemW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uNightS; varying float vGlowS; varying vec3 vMemW;\n${MEM_GLSL}`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = memApply(diffuseColor.rgb, vMemW);')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
  { float fr; float mk = memK(vMemW, fr);
    totalEmissiveRadiance += diffuseColor.rgb * vGlowS * (0.15 + uNightS * 1.1) * (0.25 + 0.75 * mk);
    totalEmissiveRadiance += diffuseColor.rgb * ${bright.toFixed(3)} * (1.0 - uNightS * 0.7); }`,
      );
  };
  m.customProgramCacheKey = () => `olv-${o.key}-${o.ruins ? 'r' : 's'}`;
  return m;
}

/** the shadow pass must move the ruins the same way (or a rebuilt wall casts the broken wall's shadow) */
export function ruinDepth(bin: Bin, ruins: RuinU) {
  const d = bin.add(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
  d.onBeforeCompile = (sh) => {
    sh.uniforms.uBuilt = ruins.uBuilt;
    sh.uniforms.uRuinC = ruins.uRuinC;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${RUIN_VERT_HEAD}`).replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed = ruinMove(transformed);');
  };
  d.customProgramCacheKey = () => 'olv-ruin-depth';
  return d;
}
