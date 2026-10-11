/**
 * HEMKADE — EL LEVIATÁN INVERTIDO (procedural, 420 m). A whale-serpent built as one lofted body that swims in the vertex
 * shader (the spine function below exists twice, GLSL and JS, so fins, flukes, plates, eyes and the chain wraps ride the
 * same curve), shown UPSIDE DOWN: the pale pleated belly faces the sky, the armored back the sea.
 *
 * Reactions it carries (stage.ts feeds them every frame): kick → the pleats flare + a swim twitch; bass → the fins and
 * the sway; the ♭II (G♭) → the chain wraps glow (the Correctors' orders tighten); melody → rings of light travel
 * head-ward along the body (it SINGS); voice / shouts → the maw opens and glows.
 */
import * as THREE from 'three';
import { inked, outlineMat, rand, toonMat, type U } from './mats';

export const LEV_L = 420;
export const R_MAX = 58;
const RINGS_U = 96;
const RINGS_V = 40;

export interface LevParams {
  swim: number;
  phase: number;
  arch: number;
  sway: number;
}

/** radius profile r(u), u 0 = tail tip → 1 = snout */
export function radiusAt(u: number): number {
  const body = R_MAX * (0.07 + 0.93 * smoothstepJs(0.0, 0.58, u) ** 0.8);
  const cap = u < 0.9 ? 1 : Math.pow(Math.max(0, 1 - ((u - 0.9) / 0.1) ** 2), 0.35);
  return body * Math.max(cap, u < 0.999 ? 0.02 : 0);
}
function smoothstepJs(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** the spine offset at u (local space, before the group's transform) — mirrors LEV_GLSL.spine */
export function spineAt(u: number, P: LevParams): [number, number, number] {
  const a = Math.pow(1 - u, 1.6);
  const y = P.swim * (a * 24 + 2) * Math.sin(Math.PI * 2 * 1.1 * u - P.phase) + P.arch * (u - 0.55) ** 2 * LEV_L * 0.35;
  const z = P.sway * a * 14 * Math.sin(Math.PI * 2 * 0.8 * u - P.phase * 0.7 + 1.3);
  return [(u - 0.6) * LEV_L, y, z];
}
/** slope dy/dx of the spine (radians-ish) */
export function slopeAt(u: number, P: LevParams): number {
  const e = 0.01;
  return (spineAt(u + e, P)[1] - spineAt(u - e, P)[1]) / (2 * e * LEV_L);
}

export const LEV_GLSL = /* glsl */ `
uniform float uL;
uniform float uSwim;
uniform float uPhase;
uniform float uArch;
uniform float uSway;
vec3 spineOf(float u) {
  float a = pow(1.0 - u, 1.6);
  float y = uSwim * (a * 24.0 + 2.0) * sin(6.2831853 * 1.1 * u - uPhase) + uArch * (u - 0.55) * (u - 0.55) * uL * 0.35;
  float z = uSway * a * 14.0 * sin(6.2831853 * 0.8 * u - uPhase * 0.7 + 1.3);
  return vec3((u - 0.6) * uL, y, z);
}
`;
const LEV_DEFORM = /* glsl */ `
  float u = uv.x;
  vec3 sp = spineOf(u);
  p.y += sp.y;
  p.z += sp.z;
  float e = 0.01;
  float sl = (spineOf(min(u + e, 1.0)).y - spineOf(max(u - e, 0.0)).y) / (2.0 * e * uL);
  n = normalize(vec3(n.x - sl * n.y, n.y + sl * n.x * 0.0, n.z));
`;

/** the lofted body: uv.x = u (tail → snout), uv.y = around (0..1, 0.25 = back/top, 0.75 = belly) */
function bodyGeometry(nu: number, nv: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= nu; i++) {
    // denser rings at the head and the tail tip
    const s = i / nu;
    const u = s < 0.5 ? s : s;
    const r = radiusAt(u);
    const dr = (radiusAt(Math.min(1, u + 0.005)) - radiusAt(Math.max(0, u - 0.005))) / (0.01 * LEV_L);
    for (let j = 0; j <= nv; j++) {
      const th = (j / nv) * Math.PI * 2;
      const c = Math.cos(th);
      let sn = Math.sin(th);
      // flatter belly, a ridge on the back
      const ry = sn < 0 ? 0.78 : 0.86 + 0.06 * Math.pow(Math.max(0, sn), 6);
      const y = r * sn * ry;
      const z = r * c;
      pos.push((u - 0.6) * LEV_L, y, z);
      const n = new THREE.Vector3(-dr, sn / ry, c).normalize();
      nor.push(n.x, n.y, n.z);
      uvs.push(u, j / nv);
      sn = 0;
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j;
      const b = a + nv + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  g.boundingSphere!.radius = LEV_L;
  return g;
}

/** the pectoral fin of a humpback, 130 m: a long flattened leaf with knobs on its leading edge */
function finGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 28, 10);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    // root at x=-1 → tip at x=+1; leaf profile
    const t = (x + 1) / 2;
    const w = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.04)) ** 0.7;
    const knob = z > 0 ? 1 + 0.12 * Math.max(0, Math.sin(t * 40)) : 1;
    x = t * 130;
    z = z * 17 * w * knob;
    y = y * 3.2 * (0.4 + 0.6 * w);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** the flukes: two swept lobes with a notch */
function flukeGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-18, 20, -48, 58, -70, 66);
  s.bezierCurveTo(-60, 44, -52, 22, -54, 6);
  s.lineTo(-46, 0);
  s.lineTo(-54, -6);
  s.bezierCurveTo(-52, -22, -60, -44, -70, -66);
  s.bezierCurveTo(-48, -58, -18, -20, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 3, bevelEnabled: true, bevelSize: 1.4, bevelThickness: 1.2, bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -1.5);
  g.rotateX(Math.PI / 2);
  // uv for the plate lines: along the fluke
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) uv.setXY(i, -p.getX(i) / 70, (p.getZ(i) + 66) / 132);
  g.computeVertexNormals();
  return g;
}

export class Leviathan {
  readonly group = new THREE.Group();
  /** where the body lives (rotated upside down inside `group`) */
  readonly local = new THREE.Group();
  readonly u: U;
  private fins: THREE.Group[] = [];
  private flukes: THREE.Group;
  private eyes: THREE.Mesh[] = [];
  private plates: THREE.InstancedMesh;
  private platesOut: THREE.InstancedMesh;
  private plateU: number[] = [];
  readonly P: LevParams = { swim: 1, phase: 0, arch: 0, sway: 0.5 };
  private tmpM = new THREE.Matrix4();
  private tmpQ = new THREE.Quaternion();
  private tmpS = new THREE.Vector3();
  private tmpV = new THREE.Vector3();
  private tmpE = new THREE.Euler();

  constructor(shared: U, high: boolean) {
    this.u = {
      uL: { value: LEV_L },
      uSwim: { value: 1 },
      uPhase: { value: 0 },
      uArch: { value: 0 },
      uSway: { value: 0.5 },
      uPleat: { value: 0 },
      uRings: { value: new THREE.Vector4(-1, -1, -1, -1) },
      uRingI: { value: new THREE.Vector4(0, 0, 0, 0) },
      uMaw: { value: 0 },
      uGlow: { value: new THREE.Color(0xffc24a) },
      uWet: { value: 0 },
    };
    const U2 = { ...shared, ...this.u };
    const body = bodyGeometry(high ? RINGS_U : 64, high ? RINGS_V : 28);
    const mat = toonMat(U2, {
      base: 0x4c6f9e,
      shadow: 0x1f2f55,
      light: 0x9fc2e8,
      freq: 150,
      seed: 3,
      vHead: LEV_GLSL,
      vBody: LEV_DEFORM,
      fHead: /* glsl */ `
uniform float uPleat;
uniform vec4 uRings;
uniform vec4 uRingI;
uniform float uMaw;
uniform vec3 uGlow;
uniform float uWet;
float hash2(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
`,
      fBody: /* glsl */ `
  float u = vUv.x;
  float a = vUv.y;
  float sideS = sin(a * 6.2831853); // +1 back, -1 belly
  // belly (pale, grooved) vs back (deep slate), a hard edge between them
  float belly = step(sideS, -0.18);
  base = mix(vec3(0.27, 0.40, 0.62), vec3(0.86, 0.84, 0.78), belly);
  shadowC = mix(vec3(0.10, 0.16, 0.33), vec3(0.47, 0.50, 0.60), belly);
  lightC = mix(vec3(0.55, 0.72, 0.92), vec3(1.0, 0.98, 0.92), belly);
  // ventral pleats (lines along the length on the belly, from the jaw to mid body)
  float pleatZone = belly * smoothstep(0.5, 0.62, u) * (1.0 - smoothstep(0.95, 0.99, u));
  float pl = abs(fract(a * 46.0) - 0.5);
  float groove = pleatZone * (1.0 - smoothstep(0.06, 0.12, pl));
  base = mix(base, shadowC, groove * 0.85);
  emis += uGlow * groove * uPleat * 1.6;
  // barnacle clusters near the head and on the back
  float bz = smoothstep(0.75, 0.9, u) + (1.0 - belly) * 0.35;
  float bn = hash2(floor(vec2(u * 260.0, a * 70.0)));
  base = mix(base, vec3(0.80, 0.82, 0.76), step(0.93, bn) * clamp(bz, 0.0, 1.0));
  // the maw: a long line from the snout down the side, glowing when it roars
  float side = abs(abs(a - 0.5) - 0.5);
  float mouth = smoothstep(0.80, 0.84, u) * (1.0 - smoothstep(0.012 + uMaw * 0.03, 0.02 + uMaw * 0.045, abs(sideS + 0.12)));
  base = mix(base, vec3(0.06, 0.07, 0.16), mouth);
  emis += vec3(1.0, 0.55, 0.25) * mouth * uMaw * 1.4;
  // songs of light: rings travelling along the body
  for (int i = 0; i < 4; i++) {
    float d = abs(u - uRings[i]);
    emis += uGlow * (1.0 - smoothstep(0.004, 0.018, d)) * uRingI[i] * 1.5;
  }
  // wet: the sea still pours off it (a sheen band)
  lightC = mix(lightC, vec3(1.0), uWet * 0.3);
`,
    });
    const out = outlineMat(U2, { color: 0x0d1430, px: 3.4, vHead: LEV_GLSL, vBody: LEV_DEFORM });
    const bodyMesh = inked(body, mat, out);
    for (const c of bodyMesh.children) (c as THREE.Mesh).frustumCulled = false;
    this.local.add(bodyMesh);
    // fins + flukes (rigid, positioned on the spine every frame)
    const finMat = toonMat(shared, { base: 0x4c6f9e, shadow: 0x1f2f55, light: 0x9fc2e8, freq: 30, seed: 5, fBody: `
  float under = step(0.0, -n.y);
  base = mix(vec3(0.30,0.44,0.66), vec3(0.88,0.86,0.80), smoothstep(0.2, 0.6, vUv.y));
` });
    const finOut = outlineMat(shared, { color: 0x0d1430, px: 3 });
    const fg = finGeometry();
    for (const s of [1, -1]) {
      const f = inked(fg, finMat, finOut);
      f.scale.set(1, 1, s);
      this.fins.push(f);
      this.local.add(f);
    }
    this.flukes = inked(flukeGeometry(), finMat, finOut);
    this.local.add(this.flukes);
    // the eyes: amber, slit pupil, a lid (uOpen)
    const eyeMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uOpen: { value: 1 }, uLook: { value: new THREE.Vector2(0, 0) } },
      vertexShader: /* glsl */ `varying vec3 vP; varying vec3 vNn; void main(){ vP = position; vNn = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
uniform float uStyle; uniform vec3 uPaper; uniform vec3 uInk; uniform float uOpen; uniform vec2 uLook; uniform float uTime; uniform float uKick;
varying vec3 vP; varying vec3 vNn;
void main(){
  vec3 d = normalize(vP);
  vec2 q = d.xy - uLook * 0.25;
  float r = length(q);
  // sclera rim → amber iris with radial streaks → a vertical slit
  float iris = 1.0 - smoothstep(0.62, 0.66, r);
  float streak = 0.5 + 0.5 * sin(atan(q.y, q.x) * 26.0 + r * 8.0);
  vec3 col = mix(vec3(0.95, 0.92, 0.82), mix(vec3(1.0, 0.62, 0.12), vec3(1.0, 0.86, 0.35), streak * (1.0 - r)), iris);
  float slit = (1.0 - smoothstep(0.07 + uKick * 0.03, 0.1 + uKick * 0.03, abs(q.x) / (1.0 - abs(q.y) * 0.9 + 0.01))) * iris;
  col = mix(col, vec3(0.05, 0.03, 0.08), slit);
  col += vec3(1.0, 0.7, 0.3) * iris * 0.35;
  // a hard catchlight
  col = mix(col, vec3(1.0), 1.0 - smoothstep(0.08, 0.1, length(q - vec2(-0.25, 0.3))));
  // the lid closes from both sides
  float lid = step(uOpen, abs(d.y) * 1.05 + 0.02);
  col = mix(col, vec3(0.16, 0.22, 0.40), lid);
  float ring = smoothstep(0.88, 0.95, length(d.xy));
  col = mix(col, vec3(0.05, 0.07, 0.18), ring);
  // the plate: a ringed eye in ink
  float ink = max(step(abs(fract(r * 9.0) - 0.5), 0.12) * iris, slit);
  vec3 plate = mix(uPaper, uInk, max(ink, ring));
  gl_FragColor = vec4(mix(col, plate, uStyle), 1.0);
}`,
    });
    const eg = new THREE.SphereGeometry(8.5, 24, 16);
    for (const s of [1, -1]) {
      const e = new THREE.Mesh(eg, eyeMat);
      e.scale.set(1, 1, 0.5);
      (e as THREE.Mesh & { side?: number }).side = s;
      this.eyes.push(e);
      this.local.add(e);
    }
    // the armored ridge on the back (it faces the sea, upside down): plates riding the spine
    const n = high ? 26 : 16;
    const pg = new THREE.ConeGeometry(7, 16, 5);
    pg.rotateZ(Math.PI / 2 - 0.4);
    const plateMat = toonMat(shared, { base: 0x324c78, shadow: 0x152245, light: 0x7b9cc8, freq: 24, seed: 9 });
    this.plates = new THREE.InstancedMesh(pg, plateMat, n);
    this.platesOut = new THREE.InstancedMesh(pg, outlineMat(shared, { color: 0x0d1430, px: 2.6 }), n);
    this.plates.frustumCulled = this.platesOut.frustumCulled = false;
    const R = rand(57);
    for (let i = 0; i < n; i++) this.plateU.push(0.12 + (i / n) * 0.72 + R() * 0.01);
    this.local.add(this.plates, this.platesOut);
    // upside down
    this.local.rotation.x = Math.PI;
    this.group.add(this.local);
  }

  /** a point ON the body surface (local, before the upside-down flip): u along, angle around (0 = side +z, π/2 = back) */
  surface(u: number, th: number, lift = 0, out = new THREE.Vector3()): THREE.Vector3 {
    const s = spineAt(u, this.P);
    const r = radiusAt(u) + lift;
    const sn = Math.sin(th);
    const ry = sn < 0 ? 0.78 : 0.86;
    return out.set(s[0], s[1] + r * sn * ry, s[2] + r * Math.cos(th));
  }
  /** local → world */
  toWorld(v: THREE.Vector3, out = new THREE.Vector3()) {
    return out.copy(v).applyMatrix4(this.local.matrixWorld);
  }

  update(p: { swim: number; phase: number; arch: number; sway: number; pleat: number; maw: number; rings: number[]; ringI: number[]; fin: number; fluke: number; eyeOpen: number; look: [number, number]; wet: number }) {
    Object.assign(this.P, { swim: p.swim, phase: p.phase, arch: p.arch, sway: p.sway });
    const u = this.u;
    u.uSwim.value = p.swim;
    u.uPhase.value = p.phase;
    u.uArch.value = p.arch;
    u.uSway.value = p.sway;
    u.uPleat.value = p.pleat;
    u.uMaw.value = p.maw;
    u.uWet.value = p.wet;
    (u.uRings.value as THREE.Vector4).set(p.rings[0] ?? -1, p.rings[1] ?? -1, p.rings[2] ?? -1, p.rings[3] ?? -1);
    (u.uRingI.value as THREE.Vector4).set(p.ringI[0] ?? 0, p.ringI[1] ?? 0, p.ringI[2] ?? 0, p.ringI[3] ?? 0);
    // fins at u 0.7, low on the sides, flapping with the bass
    const P = this.P;
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? 1 : -1;
      const f = this.fins[i];
      const sp = spineAt(0.7, P);
      const r = radiusAt(0.7);
      f.position.set(sp[0] + 6, sp[1] - r * 0.45, sp[2] + s * r * 0.82);
      const sl = slopeAt(0.7, P);
      f.rotation.set(0, s * (0.95 + p.fin * 0.25), -0.5 + sl + p.fin * 0.35 * s * 0 - p.fin * 0.2, 'YXZ');
      f.scale.set(1, 1, s);
    }
    // flukes at the tail tip, pitched with the spine
    const st = spineAt(0.015, P);
    this.flukes.position.set(st[0], st[1], st[2]);
    this.flukes.rotation.set(0, 0, slopeAt(0.03, P) * 1.4 + p.fluke * 0.3);
    // eyes near the jaw corner
    for (const e of this.eyes) {
      const s = (e as THREE.Mesh & { side?: number }).side ?? 1;
      const v = this.surface(0.885, s > 0 ? -0.18 : Math.PI + 0.18, -1.2, this.tmpV);
      e.position.copy(v);
      e.rotation.set(0, s > 0 ? 0 : Math.PI, 0);
      e.scale.set(1, 1, 0.5);
      const m = e.material as THREE.ShaderMaterial;
      m.uniforms.uOpen.value = p.eyeOpen;
      (m.uniforms.uLook.value as THREE.Vector2).set(p.look[0], p.look[1]);
    }
    // back plates
    for (let i = 0; i < this.plateU.length; i++) {
      const uu = this.plateU[i];
      const v = this.surface(uu, Math.PI / 2, -2, this.tmpV);
      const sl = slopeAt(uu, P);
      this.tmpQ.setFromEuler(this.tmpE.set(0, 0, sl + Math.PI / 2, 'XYZ'));
      const r = radiusAt(uu) / R_MAX;
      this.tmpS.set(0.6 + r, 0.6 + r, 0.6 + r);
      this.tmpM.compose(v, this.tmpQ, this.tmpS);
      this.plates.setMatrixAt(i, this.tmpM);
      this.platesOut.setMatrixAt(i, this.tmpM);
    }
    this.plates.instanceMatrix.needsUpdate = true;
    this.platesOut.instanceMatrix.needsUpdate = true;
  }
}
