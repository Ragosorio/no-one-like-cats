/**
 * Sky + time of day (AgentGameEngine `world/sky`): a gradient dome with sun/moon discs, procedural
 * stars and — Parte II's first anomaly — a few stars that fall UPWARD at night. `DayCycle` turns an
 * hour (0..24) into every color the scene needs (lights, fog, water, cat grading) from keyframes,
 * so art direction tunes a table, not shaders.
 */
import * as THREE from 'three';
import { GLSL_NOISE } from './ocean';

export interface SkyKey {
  h: number;
  zenith: string;
  horizon: string;
  sun: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  fog: string;
  deep: string;
  shallow: string;
  /** color grade multiplied onto paper cats */
  grade: string;
  night: number;
}

/** hand-tuned palette (Parte II art bible §Luz): warm golden hours, teal nights, never pitch black */
export const SKY_KEYS: SkyKey[] = [
  { h: 0, zenith: '#060b24', horizon: '#1d2a5a', sun: '#8aa4ff', sunI: 0.0, hemiSky: '#3a4f9a', hemiGround: '#141a2e', hemiI: 0.55, fog: '#16224a', deep: '#06203f', shallow: '#13607a', grade: '#7f8fd0', night: 1 },
  { h: 4.8, zenith: '#0b1433', horizon: '#3a3a6e', sun: '#8aa4ff', sunI: 0.0, hemiSky: '#3d4a8f', hemiGround: '#171b30', hemiI: 0.55, fog: '#262f5c', deep: '#08264a', shallow: '#1a6a80', grade: '#8a90cf', night: 1 },
  { h: 6.0, zenith: '#3a5aa8', horizon: '#ffad7a', sun: '#ffb27a', sunI: 1.2, hemiSky: '#8fa6e0', hemiGround: '#5a4038', hemiI: 0.7, fog: '#e9a98f', deep: '#1d4f7e', shallow: '#3fbcc0', grade: '#ffd2bf', night: 0.25 },
  { h: 8.0, zenith: '#4c8fe6', horizon: '#bfe3ff', sun: '#fff0d2', sunI: 2.3, hemiSky: '#bfe0ff', hemiGround: '#6b5a40', hemiI: 0.85, fog: '#cfe6f5', deep: '#0d5a8a', shallow: '#2fd6cf', grade: '#fff6ea', night: 0 },
  { h: 12.5, zenith: '#3f86ec', horizon: '#c7ecff', sun: '#fff8ea', sunI: 2.6, hemiSky: '#d2ecff', hemiGround: '#7a6646', hemiI: 0.9, fog: '#d6eefa', deep: '#0b5b8e', shallow: '#36e0d2', grade: '#ffffff', night: 0 },
  { h: 16.5, zenith: '#4a7fd8', horizon: '#ffe0b0', sun: '#ffd79a', sunI: 2.3, hemiSky: '#c7dcf5', hemiGround: '#7a5a3c', hemiI: 0.85, fog: '#f2dcc0', deep: '#0f557f', shallow: '#3ccfc0', grade: '#fff0dc', night: 0 },
  { h: 18.3, zenith: '#3b4f9e', horizon: '#ff8a5c', sun: '#ff8a4a', sunI: 1.5, hemiSky: '#a08ad0', hemiGround: '#5a3a34', hemiI: 0.75, fog: '#e88a72', deep: '#20406e', shallow: '#3a9ab0', grade: '#ffc0a6', night: 0.15 },
  { h: 19.6, zenith: '#18204f', horizon: '#7a4a7a', sun: '#c07aa8', sunI: 0.35, hemiSky: '#5a5aa0', hemiGround: '#251d33', hemiI: 0.6, fog: '#3d3566', deep: '#0d2a55', shallow: '#256a88', grade: '#a39ad8', night: 0.7 },
  { h: 21, zenith: '#070d28', horizon: '#20295c', sun: '#8aa4ff', sunI: 0.0, hemiSky: '#3a4f9a', hemiGround: '#141a2e', hemiI: 0.55, fog: '#18244e', deep: '#06203f', shallow: '#13607a', grade: '#8090d2', night: 1 },
  { h: 24, zenith: '#060b24', horizon: '#1d2a5a', sun: '#8aa4ff', sunI: 0.0, hemiSky: '#3a4f9a', hemiGround: '#141a2e', hemiI: 0.55, fog: '#16224a', deep: '#06203f', shallow: '#13607a', grade: '#7f8fd0', night: 1 },
];

export interface SkyState {
  zenith: THREE.Color;
  horizon: THREE.Color;
  sun: THREE.Color;
  sunI: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiI: number;
  fog: THREE.Color;
  deep: THREE.Color;
  shallow: THREE.Color;
  grade: THREE.Color;
  night: number;
  sunDir: THREE.Vector3;
  moonDir: THREE.Vector3;
}

const ca = new THREE.Color();
const cb = new THREE.Color();
const COLOR_KEYS = ['zenith', 'horizon', 'sun', 'hemiSky', 'hemiGround', 'fog', 'deep', 'shallow', 'grade'] as const;

export class DayCycle {
  readonly s: SkyState = {
    zenith: new THREE.Color(),
    horizon: new THREE.Color(),
    sun: new THREE.Color(),
    sunI: 1,
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    hemiI: 1,
    fog: new THREE.Color(),
    deep: new THREE.Color(),
    shallow: new THREE.Color(),
    grade: new THREE.Color(),
    night: 0,
    sunDir: new THREE.Vector3(),
    moonDir: new THREE.Vector3(),
  };
  /** 0..1 storm darkening, applied on top of the hour */
  overcast = 0;
  constructor(public keys = SKY_KEYS) {}

  evaluate(hour: number) {
    const h = ((hour % 24) + 24) % 24;
    let i = 0;
    while (i < this.keys.length - 2 && this.keys[i + 1].h <= h) i++;
    const a = this.keys[i];
    const b = this.keys[i + 1];
    const t = (h - a.h) / (b.h - a.h || 1);
    const s = this.s;
    for (const k of COLOR_KEYS) s[k].copy(ca.set(a[k])).lerp(cb.set(b[k]), t);
    s.sunI = a.sunI + (b.sunI - a.sunI) * t;
    s.hemiI = a.hemiI + (b.hemiI - a.hemiI) * t;
    s.night = a.night + (b.night - a.night) * t;
    // sun arcs east→west from 6 to 18; the moon is opposite (a bit higher so nights stay readable)
    const ang = ((h - 6) / 12) * Math.PI;
    s.sunDir.set(Math.cos(ang), Math.sin(ang), -0.35).normalize();
    s.moonDir.set(-Math.cos(ang) * 0.8, Math.max(0.35, -Math.sin(ang)), 0.25).normalize();
    if (this.overcast > 0) {
      const o = this.overcast;
      const grey = cb.set('#5c6678');
      for (const k of ['zenith', 'horizon', 'fog', 'hemiSky'] as const) s[k].lerp(grey.clone().multiplyScalar(s.night > 0.5 ? 0.35 : 1), o * 0.75);
      s.sunI *= 1 - 0.75 * o;
      s.grade.lerp(cb.set('#c8d0e0'), o * 0.5);
      s.deep.lerp(cb.set('#23364a'), o * 0.6);
      s.shallow.lerp(cb.set('#3d6b78'), o * 0.6);
    }
    return s;
  }
}

export class SkyDome {
  readonly mesh: THREE.Mesh;
  readonly u: Record<string, THREE.IUniform>;
  constructor(radius = 900) {
    this.u = {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uSunCol: { value: new THREE.Color() },
      uMoonDir: { value: new THREE.Vector3() },
      uNight: { value: 0 },
      uTime: { value: 0 },
      uOvercast: { value: 0 },
      uRupture: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uMoonDir;
        uniform float uNight; uniform float uTime; uniform float uOvercast; uniform float uRupture;
        varying vec3 vDir;
        ${GLSL_NOISE}
        void main(){
          vec3 d = normalize(vDir);
          float up = clamp(d.y, -0.2, 1.0);
          vec3 col = mix(uHorizon, uZenith, pow(smoothstep(-0.05, 0.75, up), 0.7));
          // sun disc + glow
          float s = max(dot(d, normalize(uSunDir)), 0.0);
          col += uSunCol * (pow(s, 900.0) * 3.0 + pow(s, 12.0) * 0.35) * (1.0 - uNight) * (1.0 - uOvercast*0.85);
          // moon: flat disc with a soft halo (illustrated, not physical)
          float m = max(dot(d, normalize(uMoonDir)), 0.0);
          col += vec3(0.95, 0.96, 1.0) * (smoothstep(0.9993, 0.9996, m) * 1.2 + pow(m, 60.0) * 0.12) * uNight * (1.0 - uOvercast*0.9);
          // stars: hashed cells on a direction grid
          if (uNight > 0.01) {
            vec2 g = vec2(atan(d.z, d.x) * 40.0, d.y * 60.0);
            vec2 c = floor(g); vec2 f = fract(g) - 0.5;
            float h = h21(c);
            float star = smoothstep(0.12, 0.0, length(f + (vec2(h21(c+3.1), h21(c+7.7))-0.5)*0.6)) * step(0.88, h);
            float tw = 0.6 + 0.4*sin(uTime*(1.5+h*4.0) + h*40.0);
            col += vec3(0.9,0.95,1.0) * star * tw * uNight * smoothstep(0.0, 0.25, d.y) * (1.0 - uOvercast);
            // RUPTURA: a few stars fall upward, leaving thin trails (Parte II's first wrongness)
            vec2 g2 = vec2(atan(d.z, d.x) * 7.0, 0.0);
            float col2 = floor(g2.x);
            float hh = h21(vec2(col2, 9.0));
            if (hh > 0.72) {
              float phase = fract(uTime * (0.04 + hh*0.05) + hh*13.0);
              float y = mix(0.05, 0.95, phase);
              float dx = abs(fract(g2.x) - 0.5);
              float head = smoothstep(0.03, 0.0, dx) * smoothstep(0.025, 0.0, abs(d.y - y));
              float trail = smoothstep(0.012, 0.0, dx) * smoothstep(y - 0.18, y, d.y) * step(d.y, y) * 0.5;
              col += vec3(0.75, 0.9, 1.0) * (head * 1.6 + trail) * uNight * uRupture * (1.0 - uOvercast);
            }
          }
          // overcast: soft cloud mass
          float cl = vn(d.xz / max(d.y, 0.08) * 1.5 + uTime*0.02);
          col = mix(col, mix(uHorizon, uZenith, 0.4) * 0.9, uOvercast * smoothstep(0.3, 0.7, cl) * smoothstep(0.0, 0.2, d.y));
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
    this.mesh.name = 'sky';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
  }
  apply(s: SkyState, time: number, overcast: number) {
    this.u.uZenith.value.copy(s.zenith);
    this.u.uHorizon.value.copy(s.horizon);
    this.u.uSunDir.value.copy(s.sunDir);
    this.u.uSunCol.value.copy(s.sun);
    this.u.uMoonDir.value.copy(s.moonDir);
    this.u.uNight.value = s.night;
    this.u.uTime.value = time;
    this.u.uOvercast.value = overcast;
  }
}
