/**
 * «Las fronteras» (Parte II · Oleada 4: Archipiélago de los Sueños, La Isla que Nadie Recuerda, El Umbral) —
 * the build kit the three regions share, on top of the sky kit (../cielo/kit.ts: Mesher, skyToon, Halos):
 *
 *  - EL / elLook(el)   one small palette per element (islets that dream it, ruins that remember it)
 *  - lensQuad()        the region's LENS (art bible §7) as ONE full-screen pass multiplied over the frame:
 *                      paper grain, bled edges, vignettes. Cheap: a 2-triangle quad, no render target.
 *  - skyShell()        a transparent dome just inside the sky: whatever the region paints on its sky
 *                      (watercolor washes, the seam, an aurora, the white of the blank page) — the engine's
 *                      sky keeps its day cycle under it
 *  - storyBattle()     a story-battle marker at a chosen spot (a region with two battles in two places)
 *  - quietSay()        ctx.say with a busy flag (activities don't stack)
 *  - devHook()         window.__<id> for headless shots (dev builds only)
 */
import * as THREE from 'three';
import type { POI, RegionCtx } from '../types';
import type { Bin } from '../paginas/kit';
import type { World3D } from '../../engine/world/World3D';
import type { Mesher } from '../cielo/kit';
import { G } from '../../state/game';
import { MISSION_BY_ID } from '../../data/content';

// ------------------------------------------------------------------ element palettes
export interface ElLook {
  /** the element's main color, its shade, its light, and what glows */
  main: string;
  dark: string;
  light: string;
  glow: string;
}
export const EL: Record<string, ElLook> = {
  fire: { main: '#ff7a3c', dark: '#a8341c', light: '#ffd27a', glow: '#ff9a4a' },
  water: { main: '#3fb6e8', dark: '#1f5e9a', light: '#a8ecff', glow: '#7fe0ff' },
  nature: { main: '#5fbf5a', dark: '#2f6e3a', light: '#c8f0a0', glow: '#b8ff8a' },
  earth: { main: '#b08a5a', dark: '#6a4a2e', light: '#e2c79a', glow: '#ffd28a' },
  storm: { main: '#ffd23f', dark: '#5a5aa0', light: '#fff3a8', glow: '#fff07a' },
  ice: { main: '#9fe3ff', dark: '#5a9ac8', light: '#f0fbff', glow: '#c8f4ff' },
  magic: { main: '#c27aff', dark: '#6a2fa8', light: '#f0d2ff', glow: '#e0a8ff' },
  cosmic: { main: '#8a6cff', dark: '#2a1d6a', light: '#d6c8ff', glow: '#b8a2ff' },
  void: { main: '#6a5a8a', dark: '#1a1428', light: '#c8b8e8', glow: '#a07aff' },
  sound: { main: '#ff7ab8', dark: '#a83a78', light: '#ffd0e6', glow: '#ff9ad0' },
  shadow: { main: '#6a6380', dark: '#241f33', light: '#b8b0cc', glow: '#9a8cd8' },
  time: { main: '#e0b77a', dark: '#8a6a3a', light: '#fff0d0', glow: '#ffd890' },
  light: { main: '#ffe68a', dark: '#c8a03a', light: '#fffbe0', glow: '#fff4b0' },
  crystal: { main: '#3fb6e8', dark: '#6a4ab0', light: '#e8f8ff', glow: '#c392f1' },
  gravity: { main: '#6a5ac8', dark: '#2a2260', light: '#e8e2d0', glow: '#9a8cff' },
};
export const elLook = (el: string): ElLook => EL[el] ?? EL.magic;

// ------------------------------------------------------------------ the lens: one multiplied full-screen pass
const LENS_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
/** GLSL helpers every lens can use: hash, value noise, fbm */
export const LENS_NOISE = /* glsl */ `
float lh(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float lvn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(lh(i), lh(i+vec2(1,0)), f.x), mix(lh(i+vec2(0,1)), lh(i+vec2(1,1)), f.x), f.y); }
float lfbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * lvn(p); p = p * 2.07 + vec2(11.3, 7.9); a *= 0.5; } return s / 0.9375; }`;

/**
 * A full-screen quad drawn LAST and multiplied over the frame (blend: dst × src). The fragment writes the
 * factor (1 = untouched). Uniforms always present: uTime, uK (strength 0..1), uAspect (w/h).
 */
export function lensQuad(bin: Bin, fragment: string, extra: Record<string, THREE.IUniform> = {}) {
  const u: Record<string, THREE.IUniform> = { uTime: { value: 0 }, uK: { value: 1 }, uAspect: { value: 16 / 9 }, ...extra };
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: LENS_VERT,
      fragmentShader: fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      fog: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.DstColorFactor,
      blendDst: THREE.ZeroFactor,
    }),
  );
  const mesh = new THREE.Mesh(bin.add(new THREE.PlaneGeometry(2, 2)), m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 999;
  mesh.name = 'lens';
  return {
    mesh,
    u,
    update(w: World3D, t: number) {
      u.uTime.value = t;
      const c = w.renderer.domElement;
      u.uAspect.value = c.width / Math.max(1, c.height);
    },
  };
}

// ------------------------------------------------------------------ the sky shell
/**
 * A dome just inside the engine's sky (radius 860 < 900), drawn right after it with normal alpha: the fragment
 * gets the view direction `d` (normalized) and writes `gl_FragColor = vec4(rgb, a)`. Uniforms: uTime, uNight
 * (+ extra). No fog, no depth.
 */
export function skyShell(bin: Bin, fragmentBody: string, extra: Record<string, THREE.IUniform> = {}, opts: { additive?: boolean; head?: string } = {}) {
  const u: Record<string, THREE.IUniform> = { uTime: { value: 0 }, uNight: { value: 0 }, ...extra };
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: u,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      // drawn at the far plane (xyww): the depth test keeps it behind everything the frame already has
      depthTest: true,
      depthFunc: THREE.LessEqualDepth,
      fog: false,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uNight;
        ${Object.keys(extra)
          .map((k) => {
            const v = extra[k].value;
            const t = v instanceof THREE.Color ? 'vec3' : v instanceof THREE.Vector3 ? 'vec3' : v instanceof THREE.Vector2 ? 'vec2' : v instanceof THREE.Vector4 ? 'vec4' : 'float';
            return `uniform ${t} ${k};`;
          })
          .join('\n')}
        varying vec3 vDir;
        ${LENS_NOISE}
        ${opts.head ?? ''}
        void main(){
          vec3 d = normalize(vDir);
          ${fragmentBody}
          #include <colorspace_fragment>
        }`,
    }),
  );
  const mesh = new THREE.Mesh(bin.add(new THREE.SphereGeometry(860, 48, 24)), m);
  mesh.frustumCulled = false;
  mesh.renderOrder = -9;
  mesh.name = 'sky-shell';
  return { mesh, u };
}

/** the shell and the dome follow the camera (a sky never comes closer) */
export function followCamera(o: THREE.Object3D, w: World3D) {
  o.position.copy(w.camera.position);
}

/** copy a built Mesher geometry (colors, sway, glow) into another Mesher under a transform (one draw call for
 *  many copies of a model: a fleet, a flock) */
export function mergeInto(M: Mesher, g: THREE.BufferGeometry, m: THREE.Matrix4) {
  const P = g.attributes.position as THREE.BufferAttribute;
  const Cc = g.attributes.color as THREE.BufferAttribute;
  const Sw = g.attributes.aSway as THREE.BufferAttribute | undefined;
  const Gl = g.attributes.aGlow as THREE.BufferAttribute | undefined;
  const v = new THREE.Vector3();
  const pos: number[] = [];
  const col: number[] = [];
  const sw: number[] = [];
  const gl: number[] = [];
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i).applyMatrix4(m);
    pos.push(v.x, v.y, v.z);
    col.push(Cc.getX(i), Cc.getY(i), Cc.getZ(i));
    sw.push(Sw ? Sw.getX(i) : 0);
    gl.push(Gl ? Gl.getX(i) : 0);
  }
  M.tris(pos, col, sw, gl);
  g.dispose();
}

// ------------------------------------------------------------------ story battles, activities, dialog
/** the region's story battle the active story mission fights right now (null = none) */
export function battleNow(battles: string[]): string | null {
  for (const m of G.s.missions.active) {
    const b = (MISSION_BY_ID.get(m)?.goal as { battle?: string } | undefined)?.battle;
    if (b && battles.includes(b)) return b;
  }
  return null;
}

/** a «¡A PELEAR!» marker for one story battle at its own spot (RegionScene's generic marker has only one) */
export function storyBattle(id: string, pos: THREE.Vector3, gate: () => boolean = () => true): POI {
  return {
    id: `battle_${id}`,
    pos,
    label: '¡A PELEAR!',
    kind: 'battle',
    visible: () => battleNow([id]) === id && gate(),
    onTap: async () => {
      if (battleNow([id]) !== id) return;
      const { startStoryBattle } = await import('../../app/storyFlow');
      await startStoryBattle(id);
    },
  };
}

/** dialog that marks the region busy while it plays (taps on activities wait) */
export function quietSay(ctx: RegionCtx) {
  const st = { busy: false };
  const say = async (lines: Parameters<RegionCtx['say']>[0]) => {
    st.busy = true;
    try {
      await ctx.say(lines);
    } finally {
      st.busy = false;
    }
  };
  return { st, say };
}

/** taps on things that are not residents (props): `near(p, r)` is a screen-space test in CSS px */
export function propTaps(w: World3D, busy: () => boolean, handler: (near: (p: THREE.Vector3, r: number) => boolean) => boolean) {
  const prev = w.rig.onClick;
  w.rig.onClick = (x, y) => {
    if (!busy() && !w.pickResident(x, y)) {
      const near = (p: THREE.Vector3, r: number) => {
        const s = w.project(p);
        return !!s && Math.hypot(s.x - x, s.y - y) < r;
      };
      if (handler(near)) return;
    }
    prev?.(x, y);
  };
}

/** dev only: window.__<id> = hooks (headless shots, perf), removed on dispose */
export function devHook(id: string, w: World3D, hooks: Record<string, unknown>, setHour: (h: number) => void) {
  if (!import.meta.env.DEV) return () => undefined;
  const win = window as unknown as Record<string, unknown>;
  win[`__${id}`] = {
    ready: true,
    world: w,
    setHour,
    info: () => ({
      calls: w.renderer.info.render.calls,
      tris: w.renderer.info.render.triangles,
      fps: Math.round(w.stats.fps),
      p95: w.stats.pct(95),
      tier: w.tier,
      geos: w.renderer.info.memory.geometries,
      tex: w.renderer.info.memory.textures,
      cats: w.cats.length,
      progs: w.renderer.info.programs?.length ?? 0,
    }),
    cam(target: [number, number, number], dist: number, pitch: number, yaw: number) {
      w.rig.follow = null;
      w.rig.focus(new THREE.Vector3(...target), dist, pitch, yaw);
      w.rig.cut();
    },
    ...hooks,
  };
  return () => {
    delete win[`__${id}`];
  };
}

/** smoothstep-ish ease */
export const ease = (k: number) => k * k * (3 - 2 * k);
/** ease out with a little overshoot (things that pop into place) */
export const backOut = (k: number) => {
  const c = 1.70158;
  const x = k - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
/** a stable 0..1 hash */
export function h1(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
