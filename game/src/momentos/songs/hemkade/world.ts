/**
 * HEMKADE — the 3D world (three.js) the Momento renders into its OWN canvas; the stage shows that canvas as a Pixi
 * texture inside the camera layer, so the kit's camera punches/shakes, the post (grade, impact frames), cut-ins and
 * prompts all sit on top of real 3D.
 *
 * Contents: sky dome (hard bands from the live palette + sun + stars + nebula + THE RIFT), the sea (shader waves,
 * breach swell, foam crests, engraved lines in GRABADO), a storm/cloud band (instanced toon puffs, lit from inside by
 * lightning), rain, lightning bolts, star points, the Leviathan + chains + seals + the line, our ship, GPU bursts
 * (closed-form particles: spray, shards, sparks, starfire), the cascade off the body, kick halos, and speed streaks.
 * Altitude is real: the sea at y = 0, the storm band 380–760, clear sky above, space past ~2600.
 */
import * as THREE from 'three';
import { Leviathan, LEV_GLSL, LEV_L, radiusAt } from './leviathan';
import { Chains, type SealState } from './chains';
import { Ship } from './ship';
import { inked, outlineMat, rand, sharedUniforms, toonMat, type U } from './mats';

export const STORM_LO = 380;
export const STORM_HI = 760;

export interface Burst {
  /** start (momento s) */
  t0: number;
  kind: 'spray' | 'shards' | 'sparks' | 'star' | 'ink' | 'mist';
  at: THREE.Vector3;
  /** base velocity */
  vel?: THREE.Vector3;
  scale?: number;
  color?: number;
  seed: number;
}

export interface WorldFrame {
  m: number;
  /** camera */
  cam: { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number };
  /** palette-driven colors */
  sky: number[];
  sea: number[];
  sun: { dir: THREE.Vector3; col: number; size: number };
  fog: { col: number; near: number; far: number; max: number };
  amb: [number, number];
  style: number;
  wipe: number;
  reveal: number;
  paper: number;
  ink: number;
  kick: number;
  flash: number;
  flashCol: number;
  stars: number;
  nebula: number;
  rift: number;
  storm: number;
  rain: number;
  lightning: { on: number; x: number; z: number; seed: number }[];
  speed: number;
  lev: { pos: THREE.Vector3; rotY: number; pitch: number; roll: number; swim: number; phase: number; arch: number; sway: number; pleat: number; maw: number; rings: number[]; ringI: number[]; fin: number; fluke: number; eyeOpen: number; look: [number, number]; wet: number; cascade: number };
  chains: { lineY: number; lineZ: number; strain: number; vib: number; seals: SealState[]; snapped: number[]; lineCrack: number; hum: number; slack: number };
  ship: { pos: THREE.Vector3; rotY: number; fold: number; thrust: number; bob: number; roll: number; pitch: number; visible: boolean };
  sea_: { swell: number; breach: number; breachAt: THREE.Vector3; chop: number; visible: boolean };
  halos: { t: number; s: number }[];
  bursts: Burst[];
  beam: { on: number; from: THREE.Vector3; to: THREE.Vector3; w: number };
}

const SKY_VERT = /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */ `
uniform vec3 uS0; uniform vec3 uS1; uniform vec3 uS2; uniform vec3 uS3; uniform vec3 uS4; uniform vec3 uBelow;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunSize;
uniform float uStars; uniform float uNebula; uniform float uRift; uniform float uTime; uniform float uStyle; uniform vec3 uPaper; uniform vec3 uInk;
uniform float uReveal; uniform float uWipe; uniform vec2 uRes; uniform float uFlash; uniform vec3 uFlashCol; uniform float uKick;
varying vec3 vD;
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
void main(){
  vec3 d = normalize(vD);
  float y = d.y;
  // hard bands: horizon → zenith
  vec3 c = y < 0.0 ? uBelow : (y < 0.06 ? uS4 : (y < 0.16 ? uS3 : (y < 0.32 ? uS2 : (y < 0.55 ? uS1 : uS0))));
  // a soft lift right at the horizon (aerial perspective)
  c = mix(c, uS4, (1.0 - smoothstep(0.0, 0.05, abs(y))) * 0.5);
  // the sun: a hard disc + two halo rings (toon)
  float sd = dot(d, normalize(uSunDir));
  float disc = step(1.0 - uSunSize, sd);
  float halo = step(1.0 - uSunSize * 4.0, sd) * 0.25 + step(1.0 - uSunSize * 10.0, sd) * 0.12;
  c = mix(c, uSunCol, clamp(disc + halo * (1.0 - disc), 0.0, 1.0));
  // nebula band (space)
  float neb = n3(d * 3.0 + vec3(0.0, uTime * 0.01, 0.0)) * n3(d * 7.0);
  float band = exp(-pow((d.y - 0.15 - d.x * 0.3) * 3.2, 2.0));
  c += vec3(0.55, 0.2, 0.75) * smoothstep(0.25, 0.6, neb) * band * uNebula * 0.8;
  c += vec3(0.1, 0.5, 0.8) * smoothstep(0.35, 0.7, n3(d * 5.0 + 3.0)) * band * uNebula * 0.35;
  // stars
  vec3 sp = d * 220.0;
  float st = step(0.985, h3(floor(sp))) * (0.6 + 0.4 * sin(uTime * 3.0 + h3(floor(sp)) * 40.0));
  c += vec3(1.0, 0.95, 0.85) * st * uStars * step(-0.02, y);
  // THE RIFT: a jagged tear high in the sky, white-hot edge, another sky inside
  vec2 q = vec2(atan(d.z, d.x), d.y);
  float rx = q.x + 1.3;
  float edge = 0.62 + 0.05 * sin(rx * 9.0) + 0.03 * sin(rx * 23.0 + 1.0) + 0.015 * sin(rx * 57.0);
  float wdt = uRift * (0.06 + 0.04 * sin(rx * 3.0)) * smoothstep(0.9, 0.0, abs(rx));
  float inside = step(abs(q.y - edge), wdt);
  float rim = step(abs(abs(q.y - edge) - wdt), 0.006 + uRift * 0.004) * step(0.001, wdt);
  vec3 other = mix(vec3(0.95, 0.4, 1.0), vec3(0.3, 0.95, 1.0), n3(d * 12.0 + uTime * 0.2)) + st * 2.0;
  c = mix(c, other, inside);
  c = mix(c, vec3(1.0), rim);
  c = mix(c, c * 0.5 + uFlashCol * 0.6, uFlash * 0.7);
  // the plate: horizontal engraved lines, denser toward the zenith; the sun as concentric rings; stars as dots
  float lum = dot(c, vec3(0.3, 0.5, 0.2));
  float s1 = d.y * 160.0;
  float shade = 1.0 - clamp(lum * 1.2, 0.0, 1.0);
  float dl = abs(fract(s1 + 0.5) - 0.5) * 2.0;
  float aa = clamp(fwidth(s1) * 2.0, 0.02, 0.5);
  float ink = (1.0 - smoothstep(shade * 0.7 - aa, shade * 0.7 + aa, dl));
  float sunR = acos(clamp(sd, -1.0, 1.0)) * 60.0;
  ink = mix(ink, step(0.75, fract(sunR * 0.4)), step(sd, 1.0 - uSunSize) * step(1.0 - uSunSize * 2.2, sd));
  ink = mix(ink, 0.0, disc);
  ink = max(ink, st * uStars);
  ink = max(ink, rim + inside * 0.4);
  ink *= step(h3(vec3(floor(s1), 1.0, 2.0)), uReveal * 1.05);
  vec3 plate = mix(uPaper, uInk, ink);
  float s = uStyle;
  if (uWipe > 0.0) s = step(gl_FragCoord.x / uRes.x + (gl_FragCoord.y / uRes.y) * 0.18, uWipe * 1.2);
  gl_FragColor = vec4(mix(c, plate, s), 1.0);
}`;

const SEA_VERT = /* glsl */ `
uniform float uTime; uniform float uSwell; uniform float uChop; uniform float uBreach; uniform vec3 uBreachAt; uniform float uKick; uniform float uCloud;
varying vec3 vW; varying float vH; varying float vDist; varying float vRing;
float wave(vec2 p, vec2 d, float f, float s, float a){ return a * sin(dot(p, d) * f + uTime * s); }
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vec2 p = w.xz;
  float h = 0.0;
  // the sea of clouds: big slow billows instead of waves
  h += uCloud * (wave(p, normalize(vec2(1.0, 0.2)), 0.004, 0.2, 26.0) + wave(p, normalize(vec2(-0.3, 1.0)), 0.007, 0.25, 16.0) + wave(p, normalize(vec2(0.7, 0.7)), 0.013, 0.3, 7.0));
  h += (1.0 - uCloud) * wave(p, normalize(vec2(1.0, 0.3)), 0.012, 1.1, 5.0 * uSwell);
  h += wave(p, normalize(vec2(-0.4, 1.0)), 0.021, 1.7, 3.0 * uSwell);
  h += wave(p, normalize(vec2(0.8, -0.7)), 0.05, 2.6, 1.2 * uChop);
  h += wave(p, normalize(vec2(-1.0, -0.2)), 0.09, 3.4, 0.6 * uChop);
  // the breach: a dome of water heaving up around the body, a ring trench + crown
  float r = length(p - uBreachAt.xz);
  float dome = exp(-pow(r / 210.0, 2.0)) * 60.0 * uBreach;
  float ring = exp(-pow((r - 260.0 - uBreach * 120.0) / 40.0, 2.0)) * 18.0 * uBreach;
  // kick: a shock ripple from the body
  float rip = sin(r * 0.08 - uTime * 14.0) * exp(-r / 500.0) * 3.0 * uKick;
  h += dome + ring + rip;
  w.y += h;
  vH = h; vRing = ring;
  vW = w.xyz;
  vec4 mv = viewMatrix * w;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SEA_FRAG = /* glsl */ `
uniform vec3 uSea0; uniform vec3 uSea1; uniform vec3 uSea2; uniform vec3 uFoam;
uniform vec3 uFogCol; uniform float uFogNear; uniform float uFogFar; uniform float uFogMax;
uniform float uStyle; uniform vec3 uPaper; uniform vec3 uInk; uniform float uReveal; uniform float uWipe; uniform vec2 uRes; uniform float uFlash; uniform vec3 uFlashCol;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uCloud;
varying vec3 vW; varying float vH; varying float vDist; varying float vRing;
void main(){
  vec3 dx = dFdx(vW); vec3 dy = dFdy(vW);
  vec3 n = normalize(cross(dx, dy)); if (n.y < 0.0) n = -n;
  float ndl = dot(n, normalize(uSunDir));
  vec3 c = vH > 4.0 ? uSea0 : (vH > -1.5 ? uSea1 : uSea2);
  if (uCloud > 0.5) c = vH > 30.0 ? uSea0 : mix(uSea1, uSea2, 0.35 + 0.25 * step(vH, -20.0));
  // foam: crests and the breach crown
  float foam = (step(10.5, vH) + step(6.0, vRing)) * (1.0 - uCloud);
  foam = max(foam, step(0.93, fract(vH * 0.22 + vW.x * 0.003 + vW.z * 0.002)) * step(4.5, vH) * (1.0 - uCloud));
  c = mix(c, uFoam, clamp(foam, 0.0, 1.0));
  // the sun's glitter path
  vec3 v = normalize(cameraPosition - vW);
  float spec = pow(max(dot(reflect(-normalize(uSunDir), n), v), 0.0), 220.0);
  c = mix(c, uSunCol, step(0.75, spec) * 0.8 * (1.0 - uCloud));
  c = mix(c, c * 0.5 + uFlashCol * 0.5, uFlash * 0.6);
  // seen from below: the bright skin of the surface, rippled bands (Snell's window toward the zenith)
  if (cameraPosition.y < vW.y) {
    float rb = step(0.5, fract(vH * 0.25 + vW.x * 0.01));
    c = mix(mix(uSea0, vec3(0.8, 0.97, 1.0), 0.55), mix(uSea0, vec3(1.0), 0.8), rb * 0.6);
  }
  float fogK = smoothstep(uFogNear, uFogFar, vDist) * uFogMax;
  c = mix(c, uFogCol, fogK);
  // the plate: Hokusai-like wave lines — parallel to the crests, thicker in the troughs
  float s1 = (vW.z * 0.12 + vH * 0.35);
  float shade = clamp(0.55 - vH * 0.06 - ndl * 0.2, 0.0, 1.0) * (1.0 - foam);
  float dl = abs(fract(s1 + 0.5) - 0.5) * 2.0;
  float aa = clamp(fwidth(s1) * 2.0, 0.02, 0.5);
  float ink = 1.0 - smoothstep(shade - aa, shade + aa, dl);
  ink *= step(fract(sin(floor(s1) * 12.9898) * 43758.5453), uReveal * 1.05);
  vec3 plate = mix(uPaper, uInk, ink * (1.0 - fogK * 0.9));
  float s = uStyle;
  if (uWipe > 0.0) s = step(gl_FragCoord.x / uRes.x + (gl_FragCoord.y / uRes.y) * 0.18, uWipe * 1.2);
  gl_FragColor = vec4(mix(c, plate, s), 1.0);
}`;

/** closed-form particle bursts (64 points each) */
const BURST_VERT = /* glsl */ `
attribute vec4 aSeed;
uniform float uAge; uniform float uLife; uniform vec3 uVel; uniform float uSpread; uniform float uG; uniform float uSize; uniform float uScale; uniform float uDrag;
uniform vec2 uRes;
varying float vA; varying float vS;
void main(){
  float t = uAge;
  vec3 dir = normalize(aSeed.xyz * 2.0 - 1.0 + vec3(0.0001));
  float sp = uSpread * (0.4 + 0.6 * aSeed.w);
  vec3 v = uVel * (0.6 + 0.5 * aSeed.w) + dir * sp;
  // drag: x = v(1-e^{-kt})/k
  float k = uDrag;
  float tt = k > 0.0 ? (1.0 - exp(-k * t)) / k : t;
  vec3 p = position + (v * tt + vec3(0.0, -0.5 * uG * t * t, 0.0)) * uScale;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float life = uLife * (0.6 + 0.4 * aSeed.w);
  vA = clamp(1.0 - t / life, 0.0, 1.0);
  vS = aSeed.w;
  gl_PointSize = min(uSize * uScale * (0.5 + aSeed.w) * 900.0 / max(1.0, -mv.z), 30.0) * (uRes.y / 1080.0) * (0.4 + 0.6 * vA);
  gl_Position = projectionMatrix * mv;
}`;
const BURST_FRAG = /* glsl */ `
uniform vec3 uCol; uniform vec3 uCol2; uniform float uStyle; uniform vec3 uInk; uniform float uShape;
varying float vA; varying float vS;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  float d = uShape > 0.5 ? max(abs(q.x) * 1.6, abs(q.y) * 0.9 + abs(q.x) * 0.6) : length(q);
  if (d > 0.5 || vA <= 0.0) discard;
  vec3 c = mix(uCol, uCol2, step(0.62, vS));
  c = mix(c, uInk, uStyle);
  gl_FragColor = vec4(c, 1.0);
}`;

const KINDS: Record<Burst['kind'], { life: number; spread: number; g: number; size: number; drag: number; col: number; col2: number; shape: number; vel: [number, number, number] }> = {
  spray: { life: 2.2, spread: 60, g: 30, size: 3.2, drag: 0.6, col: 0xffffff, col2: 0xbfe8ff, shape: 0, vel: [0, 70, 0] },
  mist: { life: 3, spread: 25, g: 2, size: 9, drag: 1.2, col: 0xe6f4ff, col2: 0xffffff, shape: 0, vel: [0, 12, 0] },
  shards: { life: 1.6, spread: 70, g: 40, size: 2.4, drag: 0.8, col: 0xfff6e6, col2: 0xff6e9a, shape: 1, vel: [0, 10, 0] },
  sparks: { life: 0.7, spread: 90, g: 50, size: 1.2, drag: 2, col: 0xfff0a0, col2: 0xffffff, shape: 1, vel: [0, 0, 0] },
  star: { life: 1.4, spread: 50, g: 0, size: 2.6, drag: 1.6, col: 0xfff1b8, col2: 0x8ff6ff, shape: 1, vel: [0, 0, 0] },
  ink: { life: 1.2, spread: 40, g: 20, size: 2.2, drag: 1.5, col: 0x2a2018, col2: 0x2a2018, shape: 0, vel: [0, 0, 0] },
};

export class Hem3D {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(50, 16 / 9, 1, 30000);
  readonly U: U = sharedUniforms();
  readonly lev: Leviathan;
  readonly chains: Chains;
  readonly ship: Ship;
  private sky: THREE.Mesh;
  private skyU: U;
  private sea: THREE.Mesh;
  private seaU: U;
  private clouds: THREE.InstancedMesh;
  private cloudsOut: THREE.InstancedMesh;
  private rain: THREE.LineSegments;
  private rainU: U;
  private bolts: THREE.Mesh[] = [];
  private bursts: { pts: THREE.Points; u: U; busy: number }[] = [];
  private halos: THREE.Mesh[] = [];
  private streaks: THREE.LineSegments;
  private streakU: U;
  private cascade: THREE.Points;
  private cascadeU: U;
  private beam: THREE.Mesh;
  private shafts = new THREE.Group();
  private beamU: U;
  readonly high: boolean;
  w = 1;
  h = 1;

  constructor(o: { high: boolean }) {
    this.high = o.high;
    this.canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: o.high, alpha: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(1);
    this.renderer.autoClear = true;
    this.renderer.setClearColor(0x000000, 1);
    const U = this.U;
    // ---- sky
    this.skyU = {
      ...U,
      uS0: { value: new THREE.Color() },
      uS1: { value: new THREE.Color() },
      uS2: { value: new THREE.Color() },
      uS3: { value: new THREE.Color() },
      uS4: { value: new THREE.Color() },
      uBelow: { value: new THREE.Color() },
      uSunSize: { value: 0.004 },
      uStars: { value: 0 },
      uNebula: { value: 0 },
      uRift: { value: 0 },
    };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({ uniforms: this.skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false }));
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);
    // ---- sea (a grid that follows the camera)
    this.seaU = { ...U, uCloud: { value: 0 }, uSea0: { value: new THREE.Color() }, uSea1: { value: new THREE.Color() }, uSea2: { value: new THREE.Color() }, uFoam: { value: new THREE.Color(0xf4fbff) }, uSwell: { value: 1 }, uChop: { value: 1 }, uBreach: { value: 0 }, uBreachAt: { value: new THREE.Vector3() } };
    const sg = new THREE.PlaneGeometry(9000, 9000, o.high ? 220 : 130, o.high ? 220 : 130);
    sg.rotateX(-Math.PI / 2);
    this.sea = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: this.seaU, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, side: THREE.DoubleSide }));
    this.sea.frustumCulled = false;
    this.scene.add(this.sea);
    // ---- clouds: one instanced field of toon puffs in the storm band (dark below, bright on top)
    const N = o.high ? 1300 : 650;
    const cg = new THREE.IcosahedronGeometry(1, 2);
    const cm = toonMat(U, {
      base: 0xffffff,
      shadow: 0xffffff,
      light: 0xffffff,
      freq: 0.6,
      seed: 41,
      lines: 'world',
      uniforms: { uStormDark: { value: 1 }, uLit: { value: 0 } },
      fHead: 'uniform float uStormDark; uniform float uLit;',
      fBody: /* glsl */ `
  if (vDist < 70.0) discard;
  float hh = clamp((vW.y - ${STORM_LO.toFixed(1)}) / ${(STORM_HI - STORM_LO).toFixed(1)}, 0.0, 1.0);
  vec3 dark = vec3(0.24, 0.22, 0.38); vec3 darkS = vec3(0.12, 0.10, 0.22);
  vec3 bright = vec3(0.98, 0.95, 0.92); vec3 brightS = vec3(0.70, 0.72, 0.86);
  float k = smoothstep(0.55, 0.95, hh) * (1.0 - uStormDark * 0.0);
  k = mix(k, 1.0, 1.0 - uStormDark);
  base = mix(dark, bright, k); shadowC = mix(darkS, brightS, k); lightC = mix(base * 1.25, vec3(1.0), k);
  emis += vec3(0.75, 0.85, 1.0) * uLit * (1.0 - k) * 0.9;
`,
    });
    this.clouds = new THREE.InstancedMesh(cg, cm, N);
    this.cloudsOut = new THREE.InstancedMesh(cg, outlineMat(U, { color: 0x2a2648, px: 2.2, cut: 70 }), N);
    this.clouds.frustumCulled = this.cloudsOut.frustumCulled = false;
    const R = rand(77);
    const M = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pv = new THREE.Vector3();
    const sv = new THREE.Vector3();
    // clusters of puffs in a ring around the path: a clear shaft in the middle (the chains go up through a hole)
    let i = 0;
    while (i < N) {
      const a = R() * Math.PI * 2;
      const top = R() < 0.4;
      const r = 760 + Math.pow(R(), 0.8) * 4600;
      const cy = top ? STORM_HI - 40 + R() * 40 : STORM_LO + 30 + R() * (STORM_HI - STORM_LO - 120);
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      const big = 60 + R() * 90;
      const n = 4 + Math.floor(R() * 5);
      for (let j = 0; j < n && i < N; j++, i++) {
        const s = big * (0.45 + R() * 0.6);
        pv.set(cx + (R() - 0.5) * big * 2.6, cy + (R() - 0.3) * big * 0.5, cz + (R() - 0.5) * big * 2.6);
        q.setFromEuler(e.set(R() * 0.4, R() * 3, R() * 0.4));
        sv.set(s * (1.2 + R() * 0.5), s * (top ? 0.42 : 0.62), s * (1.1 + R() * 0.5));
        M.compose(pv, q, sv);
        this.clouds.setMatrixAt(i, M);
        this.cloudsOut.setMatrixAt(i, M);
      }
    }
    this.cloudsOut.renderOrder = -1;
    this.scene.add(this.clouds, this.cloudsOut);
    // ---- rain (streaks in a box around the camera)
    const RN = o.high ? 2600 : 1200;
    const rp = new Float32Array(RN * 6);
    for (let i = 0; i < RN; i++) {
      const x = (R() - 0.5) * 600;
      const y = R() * 400;
      const z = (R() - 0.5) * 600;
      rp.set([x, y, z, x - 1.5, y - 14, z], i * 6);
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rainU = { ...U, uRain: { value: 0 }, uOrigin: { value: new THREE.Vector3() } };
    this.rain = new THREE.LineSegments(
      rg,
      new THREE.ShaderMaterial({
        uniforms: this.rainU,
        vertexShader: /* glsl */ `uniform float uTime; uniform vec3 uOrigin; void main(){ vec3 p = position; p.y = mod(p.y - uTime * 260.0, 400.0) - 200.0; p.x = mod(p.x - uOrigin.x + 300.0, 600.0) - 300.0; p.z = mod(p.z - uOrigin.z + 300.0, 600.0) - 300.0; gl_Position = projectionMatrix * viewMatrix * vec4(p + uOrigin, 1.0); }`,
        fragmentShader: /* glsl */ `uniform float uRain; uniform float uStyle; uniform vec3 uInk; void main(){ gl_FragColor = vec4(mix(vec3(0.75, 0.82, 1.0), uInk, uStyle) * uRain, 1.0); }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    this.rain.frustumCulled = false;
    this.scene.add(this.rain);
    // ---- lightning bolts (ribbons; turned to face the camera around Y)
    for (let b = 0; b < 4; b++) {
      const Rb = rand(900 + b);
      const pts: THREE.Vector3[] = [];
      let x = 0;
      for (let i = 0; i <= 22; i++) {
        x += (Rb() - 0.5) * 60;
        pts.push(new THREE.Vector3(x, -i * 40, 0));
      }
      const pos: number[] = [];
      const idx: number[] = [];
      pts.forEach((p, i) => {
        const w = 5 * (1 - i / 26);
        pos.push(p.x - w, p.y, 0, p.x + w, p.y, 0);
        if (i < pts.length - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...U, uOn: { value: 0 } }, vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'uniform float uOn; uniform float uStyle; uniform vec3 uInk; void main(){ gl_FragColor = vec4(mix(vec3(0.92, 0.97, 1.0), uInk, uStyle), 1.0); }', side: THREE.DoubleSide }));
      mesh.frustumCulled = false;
      mesh.visible = false;
      this.bolts.push(mesh);
      this.scene.add(mesh);
    }
    // ---- light shafts under the surface (the intro, underwater)
    for (let i = 0; i < 9; i++) {
      const pm = new THREE.ShaderMaterial({
        uniforms: { uA: { value: 0.2 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform float uA; varying vec2 vUv; void main(){ float x = 1.0 - abs(vUv.x - 0.5) * 2.0; gl_FragColor = vec4(vec3(0.75, 0.95, 1.0) * uA * x * x * vUv.y, 1.0); }',
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(26 + R() * 30, 260), pm);
      const a = R() * Math.PI * 2;
      const r = 40 + R() * 260;
      pl.position.set(Math.cos(a) * r, -130, Math.sin(a) * r);
      pl.rotation.z = (R() - 0.5) * 0.3;
      pl.frustumCulled = false;
      this.shafts.add(pl);
    }
    this.shafts.visible = false;
    this.scene.add(this.shafts);
    // ---- the cast
    this.lev = new Leviathan(U, o.high);
    this.scene.add(this.lev.group);
    this.chains = new Chains(U, o.high);
    this.scene.add(this.chains.group);
    this.ship = new Ship(U);
    this.scene.add(this.ship.group);
    // ---- the cascade: the sea pouring off the body (points riding the spine, falling)
    const CN = o.high ? 3600 : 1600;
    const ca = new Float32Array(CN * 4);
    for (let i = 0; i < CN; i++) ca.set([0.08 + R() * 0.86, R(), R(), R()], i * 4);
    const cgeo = new THREE.BufferGeometry();
    cgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CN * 3), 3));
    cgeo.setAttribute('aSeed', new THREE.BufferAttribute(ca, 4));
    this.cascadeU = { ...this.lev.u, ...U, uCascade: { value: 0 }, uLevM: { value: new THREE.Matrix4() } };
    this.cascade = new THREE.Points(
      cgeo,
      new THREE.ShaderMaterial({
        uniforms: this.cascadeU,
        vertexShader: /* glsl */ `
${LEV_GLSL}
uniform float uTime; uniform float uCascade; uniform mat4 uLevM; uniform vec2 uRes;
attribute vec4 aSeed;
varying float vA;
float rad(float u){ float b = 58.0 * (0.07 + 0.93 * pow(smoothstep(0.0, 0.58, u), 0.8)); float cap = u < 0.9 ? 1.0 : pow(max(0.0, 1.0 - pow((u - 0.9) / 0.1, 2.0)), 0.35); return b * cap; }
void main(){
  float u = aSeed.x;
  float th = 3.1416 * 0.5 + (aSeed.y - 0.5) * 2.4;   // the back side (it faces down)
  vec3 sp = spineOf(u);
  float r = rad(u);
  vec3 lp = vec3(sp.x, sp.y + r * sin(th) * 0.86, sp.z + r * cos(th));
  vec4 wp = uLevM * vec4(lp, 1.0);
  float ph = fract(uTime * (0.35 + aSeed.z * 0.3) + aSeed.w);
  float t = ph * 3.0;
  wp.y -= 0.5 * 40.0 * t * t;
  wp.x += (aSeed.z - 0.5) * 30.0 * t;
  vA = uCascade * (1.0 - ph) * step(aSeed.w, uCascade * 1.2);
  vec4 mv = viewMatrix * wp;
  gl_PointSize = (0.8 + 2.2 * aSeed.z) * (uRes.y / 1080.0) * 600.0 / max(1.0, -mv.z) * step(0.01, vA);
  gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: /* glsl */ `uniform float uStyle; uniform vec3 uInk; varying float vA; void main(){ if (length(gl_PointCoord - 0.5) > 0.5 || vA <= 0.01) discard; gl_FragColor = vec4(mix(vec3(0.9, 0.97, 1.0), uInk, uStyle), 1.0); }`,
      }),
    );
    this.cascade.frustumCulled = false;
    this.scene.add(this.cascade);
    // ---- bursts pool
    const BN = o.high ? 28 : 16;
    const PN = o.high ? 72 : 40;
    for (let b = 0; b < BN; b++) {
      const g = new THREE.BufferGeometry();
      const seeds = new Float32Array(PN * 4);
      const Rb = rand(5000 + b);
      for (let i = 0; i < PN * 4; i++) seeds[i] = Rb();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PN * 3), 3));
      g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
      const u: U = { ...U, uAge: { value: 0 }, uLife: { value: 1 }, uVel: { value: new THREE.Vector3() }, uSpread: { value: 50 }, uG: { value: 0 }, uSize: { value: 2 }, uScale: { value: 1 }, uDrag: { value: 1 }, uCol: { value: new THREE.Color() }, uCol2: { value: new THREE.Color() }, uShape: { value: 0 } };
      const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: BURST_VERT, fragmentShader: BURST_FRAG }));
      pts.frustumCulled = false;
      pts.visible = false;
      this.bursts.push({ pts, u, busy: 0 });
      this.scene.add(pts);
    }
    // ---- kick halos (rings that face the camera, around the heart of the whale)
    for (let i = 0; i < 4; i++) {
      const hm = new THREE.Mesh(
        new THREE.RingGeometry(0.92, 1, 64),
        new THREE.ShaderMaterial({ uniforms: { ...U, uA: { value: 0 } }, vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'uniform float uA; uniform float uStyle; uniform vec3 uInk; void main(){ gl_FragColor = vec4(mix(vec3(1.0, 0.93, 0.7), uInk, uStyle) * uA, 1.0); }', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
      );
      hm.frustumCulled = false;
      hm.visible = false;
      this.halos.push(hm);
      this.scene.add(hm);
    }
    // ---- speed streaks (camera space)
    const SN = o.high ? 420 : 200;
    const sp = new Float32Array(SN * 6);
    for (let i = 0; i < SN; i++) {
      const a = R() * Math.PI * 2;
      const r = 30 + R() * 140;
      const z = -R() * 900;
      const L = 30 + R() * 90;
      sp.set([Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(a) * r, Math.sin(a) * r, z - L], i * 6);
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.streakU = { ...U, uSpeed: { value: 0 } };
    this.streaks = new THREE.LineSegments(
      sgeo,
      new THREE.ShaderMaterial({
        uniforms: this.streakU,
        vertexShader: 'uniform float uTime; uniform float uSpeed; varying float vF; void main(){ vec3 p = position; p.z = mod(p.z + uTime * 1400.0, 900.0) - 900.0; vF = clamp(-p.z / 300.0, 0.0, 1.0) * clamp((900.0 + p.z) / 200.0, 0.0, 1.0); gl_Position = projectionMatrix * vec4(p, 1.0); }',
        fragmentShader: 'uniform float uSpeed; uniform float uStyle; uniform vec3 uInk; varying float vF; void main(){ gl_FragColor = vec4(mix(vec3(1.0), uInk, uStyle) * uSpeed * vF, 1.0); }',
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    );
    this.streaks.frustumCulled = false;
    this.camera.add(this.streaks);
    this.scene.add(this.camera);
    // ---- the starfire beam (a tapered ribbon facing the camera)
    this.beamU = { ...U, uOn: { value: 0 } };
    const bg = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    bg.translate(0, 0.5, 0);
    this.beam = new THREE.Mesh(
      bg,
      new THREE.ShaderMaterial({
        uniforms: this.beamU,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform float uOn; uniform float uTime; uniform float uStyle; uniform vec3 uInk; varying vec2 vUv; void main(){ float core = 0.6 + 0.4 * sin(vUv.y * 80.0 - uTime * 90.0); vec3 c = mix(vec3(1.0, 0.75, 0.3), vec3(1.0, 1.0, 0.92), core) * uOn; gl_FragColor = vec4(mix(c, uInk * uOn, uStyle), 1.0); }',
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    this.beam.frustumCulled = false;
    this.beam.visible = false;
    this.scene.add(this.beam);
  }

  setSize(w: number, h: number) {
    this.w = Math.max(16, Math.round(w));
    this.h = Math.max(16, Math.round(h));
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    (this.U.uRes.value as THREE.Vector2).set(this.w, this.h);
  }

  /** compile every program before the clock (no hitch on the first drop) */
  warm() {
    // three compiles only what is visible: show everything once (bursts, bolts, halos, beam, shafts, cascade, rain…)
    const hidden: THREE.Object3D[] = [];
    this.scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    this.renderer.compile(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
    for (const o of hidden) o.visible = false;
  }

  private col(u: THREE.IUniform, c: number) {
    (u.value as THREE.Color).setHex(c);
  }

  frame(f: WorldFrame) {
    const U = this.U;
    U.uTime.value = f.m;
    U.uStyle.value = f.style;
    U.uWipe.value = f.wipe;
    U.uReveal.value = f.reveal;
    this.col(U.uPaper, f.paper);
    this.col(U.uInk, f.ink);
    (U.uSunDir.value as THREE.Vector3).copy(f.sun.dir).normalize();
    this.col(U.uSunCol, f.sun.col);
    this.col(U.uAmbTop, f.amb[0]);
    this.col(U.uAmbBot, f.amb[1]);
    this.col(U.uFogCol, f.fog.col);
    U.uFogNear.value = f.fog.near;
    U.uFogFar.value = f.fog.far;
    U.uFogMax.value = f.fog.max;
    U.uKick.value = f.kick;
    U.uFlash.value = f.flash;
    this.col(U.uFlashCol, f.flashCol);
    // camera
    const c = this.camera;
    c.position.copy(f.cam.pos);
    c.up.set(0, 1, 0);
    c.lookAt(f.cam.look);
    if (f.cam.roll) c.rotateZ(f.cam.roll);
    if (Math.abs(c.fov - f.cam.fov) > 1e-3) {
      c.fov = f.cam.fov;
      c.updateProjectionMatrix();
    }
    c.updateMatrixWorld(true);
    // sky
    const s = this.skyU;
    for (let i = 0; i < 5; i++) this.col(s[`uS${i}`], f.sky[Math.min(i, f.sky.length - 1)]);
    this.col(s.uBelow, f.sea[2]);
    s.uSunSize.value = f.sun.size;
    s.uStars.value = f.stars;
    s.uNebula.value = f.nebula;
    s.uRift.value = f.rift;
    this.sky.position.copy(c.position);
    this.sky.scale.setScalar(20000);
    // sea
    // above the storm band the sea gives way to a SEA OF CLOUDS (the same mesh, billows, the palette's cloud colours)
    // (only once the colossus itself is up there: a high camera looking down at it at sea still sees the sea)
    const cloudSea = c.position.y > STORM_HI + 40 && f.lev.pos.y > STORM_HI - 60;
    this.sea.visible = f.sea_.visible || cloudSea;
    this.seaU.uCloud.value = cloudSea ? 1 : 0;
    if (this.sea.visible) {
      this.sea.position.set(Math.round(c.position.x / 40) * 40, cloudSea ? STORM_HI - 40 : 0, Math.round(c.position.z / 40) * 40);
      this.col(this.seaU.uSea0, f.sea[0]);
      this.col(this.seaU.uSea1, f.sea[1]);
      this.col(this.seaU.uSea2, f.sea[2]);
      this.seaU.uSwell.value = f.sea_.swell;
      this.seaU.uChop.value = f.sea_.chop;
      this.seaU.uBreach.value = cloudSea ? 0 : f.sea_.breach;
      (this.seaU.uBreachAt.value as THREE.Vector3).copy(f.sea_.breachAt);
    }
    // clouds
    const cm = this.clouds.material as THREE.ShaderMaterial;
    cm.uniforms.uStormDark.value = f.storm;
    cm.uniforms.uLit.value = f.lightning.reduce((a, l) => Math.max(a, l.on), 0);
    const cloudsNear = c.position.y > 0 && c.position.y < STORM_HI + 2600;
    this.shafts.visible = c.position.y < 0;
    if (this.shafts.visible) {
      this.shafts.position.set(c.position.x, 0, c.position.z);
      this.shafts.children.forEach((sh, i) => {
        sh.lookAt(c.position.x, sh.getWorldPosition(this.tmpP).y, c.position.z);
        ((sh as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uA.value = 0.18 + 0.1 * Math.sin(f.m * 0.7 + i * 1.7);
      });
    }
    this.clouds.visible = this.cloudsOut.visible = cloudsNear;
    // rain
    this.rainU.uRain.value = f.rain;
    this.rain.visible = f.rain > 0.01;
    (this.rainU.uOrigin.value as THREE.Vector3).copy(c.position);
    // lightning
    for (let i = 0; i < this.bolts.length; i++) {
      const L = f.lightning[i];
      const b = this.bolts[i];
      b.visible = !!L && L.on > 0.3;
      if (b.visible && L) {
        b.position.set(L.x, STORM_HI + 60, L.z);
        b.lookAt(c.position.x, STORM_HI + 60, c.position.z);
        b.scale.setScalar(1 + (L.seed % 3) * 0.3);
      }
    }
    // leviathan
    const L = f.lev;
    this.lev.group.position.copy(L.pos);
    this.lev.group.rotation.set(L.roll, L.rotY, L.pitch, 'YZX');
    this.lev.update(L);
    this.lev.group.updateMatrixWorld(true);
    // cascade off the body
    this.cascadeU.uCascade.value = L.cascade;
    this.cascade.visible = L.cascade > 0.01;
    (this.cascadeU.uLevM.value as THREE.Matrix4).copy(this.lev.local.matrixWorld);
    // chains
    this.chains.update(this.lev, { ...f.chains, t: f.m, cam: c });
    // ship
    const S = f.ship;
    this.ship.group.visible = S.visible;
    this.ship.group.position.copy(S.pos);
    this.ship.group.rotation.set(0, S.rotY, 0);
    this.ship.update(S);
    // halos
    const heart = this.lev.toWorld(this.lev.surface(0.6, 0, 0, new THREE.Vector3()), new THREE.Vector3());
    this.halos.forEach((h, i) => {
      const hh = f.halos[i];
      h.visible = !!hh && hh.t >= 0 && hh.t < 0.6;
      if (!h.visible || !hh) return;
      h.position.copy(heart);
      h.quaternion.copy(c.quaternion);
      const r = (radiusAt(0.6) * 1.3 + hh.t * 520) * hh.s;
      h.scale.setScalar(r);
      ((h.material as THREE.ShaderMaterial).uniforms.uA as THREE.IUniform).value = (1 - hh.t / 0.6) ** 1.5 * 0.9;
    });
    // bursts
    for (const b of this.bursts) b.pts.visible = false;
    let bi = 0;
    for (const B of f.bursts) {
      if (bi >= this.bursts.length) break;
      const K = KINDS[B.kind];
      const age = f.m - B.t0;
      if (age < 0 || age > K.life) continue;
      const slot = this.bursts[bi++];
      slot.pts.visible = true;
      slot.pts.position.copy(B.at);
      const u = slot.u;
      u.uAge.value = age;
      u.uLife.value = K.life;
      (u.uVel.value as THREE.Vector3).set(...K.vel);
      if (B.vel) (u.uVel.value as THREE.Vector3).add(B.vel);
      u.uSpread.value = K.spread;
      u.uG.value = K.g;
      u.uSize.value = K.size;
      u.uScale.value = B.scale ?? 1;
      u.uDrag.value = K.drag;
      this.col(u.uCol, B.color ?? K.col);
      this.col(u.uCol2, K.col2);
      u.uShape.value = K.shape;
    }
    // speed streaks
    this.streakU.uSpeed.value = f.speed;
    this.streaks.visible = f.speed > 0.02;
    // the starfire beam
    this.beam.visible = f.beam.on > 0.01;
    if (this.beam.visible) {
      const d = new THREE.Vector3().subVectors(f.beam.to, f.beam.from);
      const len = d.length();
      this.beam.position.copy(f.beam.from);
      this.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      this.beam.scale.set(f.beam.w, len, f.beam.w);
      this.beamU.uOn.value = f.beam.on;
    }
    this.renderer.render(this.scene, c);
  }

  /** world → design-box screen coords (the sprite covers `rect`) + depth (−1 behind) */
  project(p: THREE.Vector3, rect: { x: number; y: number; w: number; h: number }, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
    const v = this.tmpP.copy(p).project(this.camera);
    out[0] = rect.x + (v.x * 0.5 + 0.5) * rect.w;
    out[1] = rect.y + (-v.y * 0.5 + 0.5) * rect.h;
    out[2] = v.z < 1 ? this.tmpP.copy(p).applyMatrix4(this.camera.matrixWorldInverse).z * -1 : -1;
    return out;
  }
  private tmpP = new THREE.Vector3();

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
    this.chains.dispose();
    this.ship.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.width = this.canvas.height = 1;
  }
}

export { LEV_L, inked };
