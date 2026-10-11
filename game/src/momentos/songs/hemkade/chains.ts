/**
 * HEMKADE — the chains, their ORDER SEALS and THE LINE they hang from.
 *
 * The Leviathan is hauled into the sky by chains wrapped twice around its body; each chain climbs to a perfectly
 * straight white line ruled across the sky (the Correctors' kind of order). Every chain carries two hexagonal seals with
 * one order each (CORRIGE · OBEDECE · QUIETO · NO CANTES · SUBE · ORDEN): the crew's shots crack and shatter them. All
 * links are ONE instanced mesh (+ its outline twin); their transforms are recomputed every frame from the body.
 */
import * as THREE from 'three';
import { inked, outlineMat, toonMat, type U } from './mats';
import type { Leviathan } from './leviathan';

export const ORDERS = ['CORRIGE', 'OBEDECE', 'QUIETO', 'NO CANTES', 'SUBE', 'ORDEN'];
export const WRAP_U = [0.36, 0.7];
/** chain attach angles around the body (local: −π/2 is the belly, which faces the sky upside down) */
const ATTACH = [-Math.PI / 2 - 0.62, -Math.PI / 2, -Math.PI / 2 + 0.62];
export const CHAINS = WRAP_U.length * ATTACH.length;
/** where on each chain the seals hang (0 = body, 1 = the line) */
export const SEAL_S = [0.3, 0.58];
export const SEALS = CHAINS * SEAL_S.length;
const LINK = 6.2;

export interface SealState {
  /** 0 intact · 1 cracked · 2 shattered (gone) */
  state: number;
  /** a recent knock (0..1): it flashes and swings */
  knock: number;
}

function sealAtlas(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 1024, 512);
  ORDERS.forEach((w, i) => {
    const x = (i % 3) * 341 + 170;
    const y = Math.floor(i / 3) * 256 + 128;
    g.save();
    g.translate(x, y);
    g.font = `700 ${w.length > 7 ? 46 : 58}px "Playfair Display", Georgia, serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(w, 0, 4);
    g.lineWidth = 6;
    g.strokeStyle = '#fff';
    g.beginPath();
    g.moveTo(-120, 52);
    g.lineTo(120, 52);
    g.stroke();
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

export class Chains {
  readonly group = new THREE.Group();
  private links: THREE.InstancedMesh;
  private linksOut: THREE.InstancedMesh;
  private max: number;
  readonly seals: THREE.Group[] = [];
  private sealMats: THREE.ShaderMaterial[] = [];
  readonly line: THREE.Mesh;
  private lineGlow: THREE.Mesh;
  readonly lineU: U;
  private atlas: THREE.CanvasTexture;
  /** world positions computed this frame: seal centres, chain attach points */
  readonly sealPos: THREE.Vector3[] = [];
  readonly attach: THREE.Vector3[] = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private a = new THREE.Vector3();
  private b = new THREE.Vector3();
  private d = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private side = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private wp = new THREE.Vector3();
  private wp2 = new THREE.Vector3();
  private qr = new THREE.Quaternion();

  constructor(shared: U, high: boolean) {
    const lg = new THREE.TorusGeometry(2.6, 0.78, 6, high ? 12 : 8);
    lg.scale(1, 1.55, 1);
    this.max = high ? 1400 : 900;
    const lm = toonMat(shared, { base: 0x5c5a70, shadow: 0x23213a, light: 0xc9c6d8, freq: 3, seed: 11, uniforms: { uStrain: { value: 0 } }, fHead: 'uniform float uStrain;', fBody: 'emis += vec3(1.0, 0.82, 0.45) * uStrain * 0.55 * step(0.2, ndl);' });
    this.links = new THREE.InstancedMesh(lg, lm, this.max);
    this.linksOut = new THREE.InstancedMesh(lg, outlineMat(shared, { color: 0x100c1e, px: 2.2 }), this.max);
    this.links.frustumCulled = this.linksOut.frustumCulled = false;
    this.linksOut.renderOrder = -1;
    this.group.add(this.links, this.linksOut);
    // seals
    this.atlas = sealAtlas();
    const sg = new THREE.CylinderGeometry(15, 15, 2.4, 6);
    sg.rotateX(Math.PI / 2);
    for (let i = 0; i < SEALS; i++) {
      const word = (i * 7 + Math.floor(i / CHAINS)) % ORDERS.length;
      const mat = toonMat(shared, {
        base: 0xe8e2d2,
        shadow: 0x8d8574,
        light: 0xffffff,
        freq: 6,
        seed: 20 + i,
        uniforms: { uAtlas: { value: this.atlas }, uCell: { value: new THREE.Vector2(word % 3, Math.floor(word / 3)) }, uCrack: { value: 0 }, uKnock: { value: 0 }, uOrder: { value: new THREE.Color(0xff3d6e) } },
        fHead: /* glsl */ `
uniform sampler2D uAtlas; uniform vec2 uCell; uniform float uCrack; uniform float uKnock; uniform vec3 uOrder;
float hs(float x){ return fract(sin(x*91.7)*43758.5); }`,
        fBody: /* glsl */ `
  // the order glyph on the face (front cap only)
  if (dot(n, v) > 0.55) {
    vec2 q = vUv;
    vec2 cell = vec2((uCell.x * 341.0 + q.x * 341.0) / 1024.0, 1.0 - (uCell.y * 256.0 + (1.0 - q.y) * 256.0) / 512.0);
    float gl = texture2D(uAtlas, cell).r;
    base = mix(base, uOrder * 0.55, gl);
    emis += uOrder * gl * (0.55 + uKnock * 1.2);
  }
  // cracks: jagged lines from the centre
  float ang = atan(vUv.y - 0.5, vUv.x - 0.5);
  float rr = length(vUv - 0.5);
  float k = 0.0;
  for (int i = 0; i < 5; i++) {
    float a0 = hs(float(i) + 3.0) * 6.2831;
    float da = abs(mod(ang - a0 + 3.1416, 6.2831) - 3.1416);
    k = max(k, (1.0 - smoothstep(0.02, 0.05, da - rr * 0.08 * sin(rr * 40.0 + float(i)))) * step(rr, 0.1 + uCrack * 0.5));
  }
  base = mix(base, vec3(0.08, 0.05, 0.1), k * step(0.01, uCrack));
  emis += vec3(1.0, 0.9, 0.6) * k * uCrack * uKnock;
  emis += vec3(1.0) * uKnock * 0.25;
`,
      });
      const g = inked(sg, mat, outlineMat(shared, { color: 0x2a1a20, px: 2.6 }));
      this.sealMats.push(mat);
      this.seals.push(g);
      this.group.add(g);
      this.sealPos.push(new THREE.Vector3());
    }
    for (let i = 0; i < CHAINS; i++) this.attach.push(new THREE.Vector3());
    // THE LINE: perfectly straight, white-gold, humming
    this.lineU = { uCrackL: { value: 0 }, uHum: { value: 0 } };
    const lineMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, ...this.lineU },
      vertexShader: /* glsl */ `varying vec3 vW; varying float vDist; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `
uniform float uStyle; uniform vec3 uPaper; uniform vec3 uInk; uniform float uCrackL; uniform float uHum; uniform float uTime;
varying vec3 vW; varying float vDist;
float h(float x){ return fract(sin(x*12.9898)*43758.5453); }
void main(){
  vec3 c = vec3(1.0, 0.97, 0.88) + vec3(0.2, 0.15, 0.0) * uHum;
  // cracks along it (the climax)
  float seg = floor(vW.x / 90.0);
  float cr = step(1.0 - uCrackL, h(seg)) * step(abs(fract(vW.x / 90.0) - 0.5), 0.08 * uCrackL);
  c = mix(c, vec3(0.1, 0.02, 0.2), cr);
  gl_FragColor = vec4(mix(c, uInk, uStyle), 1.0);
}`,
    });
    this.line = new THREE.Mesh(new THREE.BoxGeometry(9000, 4, 4), lineMat);
    this.line.frustumCulled = false;
    const glowMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, ...this.lineU },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `uniform float uStyle; uniform float uHum; varying vec2 vUv; void main(){ float d = abs(vUv.y - 0.5) * 2.0; float a = pow(1.0 - d, 3.0) * (0.55 + uHum * 0.4) * (1.0 - uStyle); gl_FragColor = vec4(vec3(1.0, 0.92, 0.7) * a, 1.0); }`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
    this.lineGlow = new THREE.Mesh(new THREE.PlaneGeometry(9000, 120), glowMat);
    this.lineGlow.frustumCulled = false;
    this.group.add(this.line, this.lineGlow);
  }

  /**
   * Lay the chains out for this frame. `lineY` = the line's height (world); `strain` 0..1 (glow + straighter);
   * `vib` = lateral vibration (kick/bass); `seals` = per-seal state; `cam` for billboarding the seals.
   */
  update(lev: Leviathan, o: { lineY: number; lineZ: number; strain: number; vib: number; t: number; seals: SealState[]; cam: THREE.Camera; snapped: number[]; lineCrack: number; hum: number; slack: number }) {
    lev.local.updateMatrixWorld(true);
    let n = 0;
    const put = (p: THREE.Vector3, dir: THREE.Vector3, roll: number, scale = 1) => {
      if (n >= this.max) return;
      this.q.setFromUnitVectors(this.up, dir);
      if (roll) this.q.multiply(this.qr.setFromAxisAngle(this.up, roll));
      this.s.setScalar(scale);
      this.m.compose(p, this.q, this.s);
      this.links.setMatrixAt(n, this.m);
      this.linksOut.setMatrixAt(n, this.m);
      n++;
    };
    // the wraps around the body
    for (const u of WRAP_U) {
      const N = 46;
      for (let i = 0; i < N; i++) {
        const th = (i / N) * Math.PI * 2;
        lev.surface(u, th, 2.2, this.tmp);
        const p = lev.toWorld(this.tmp, this.wp);
        lev.surface(u, th + 0.05, 2.2, this.tmp);
        const p2 = lev.toWorld(this.tmp, this.wp2);
        this.d.copy(p2).sub(p).normalize();
        put(p, this.d, i % 2 ? Math.PI / 2 : 0, 1.05);
      }
    }
    // the chains up to the line
    let c = 0;
    for (const u of WRAP_U) {
      for (const th of ATTACH) {
        lev.surface(u, th, 3.2, this.tmp);
        lev.toWorld(this.tmp, this.a);
        this.attach[c].copy(this.a);
        this.b.set(this.a.x * 0.85 + (th + Math.PI / 2) * 60, o.lineY, o.lineZ + (th + Math.PI / 2) * 40);
        this.d.copy(this.b).sub(this.a);
        const len = this.d.length();
        this.d.normalize();
        this.side.set(-this.d.z, 0, this.d.x).normalize();
        const snapAt = o.snapped[c] ?? 1;
        const N = Math.min(400, Math.ceil(len / LINK));
        const sag = (1 - o.strain) * len * 0.04 + o.slack * len * 0.12;
        for (let i = 0; i < N; i++) {
          const s = i / N;
          if (s > snapAt) {
            // a snapped chain: the end whips and hangs
            continue;
          }
          const p = this.tmp.copy(this.a).lerp(this.b, s);
          const bell = Math.sin(Math.PI * s);
          p.y -= sag * bell;
          const wob = Math.sin(s * Math.PI * (2 + c * 0.3) + o.t * (9 + c)) * o.vib * bell * 3.2;
          p.addScaledVector(this.side, wob);
          put(p, this.d, i % 2 ? Math.PI / 2 : 0);
        }
        // the seals ride their chain
        SEAL_S.forEach((ss, k) => {
          const idx = c + k * CHAINS;
          const g = this.seals[idx];
          const st = o.seals[idx] ?? { state: 0, knock: 0 };
          const p = this.sealPos[idx].copy(this.a).lerp(this.b, ss);
          p.y -= sag * Math.sin(Math.PI * ss);
          p.addScaledVector(this.side, Math.sin(ss * Math.PI * 2 + o.t * 9) * o.vib * 3);
          g.visible = st.state < 2 && ss <= snapAt;
          g.position.copy(p);
          g.lookAt(o.cam.position);
          g.rotateZ(Math.sin(o.t * 2 + idx) * 0.12 + st.knock * Math.sin(o.t * 40) * 0.3);
          g.scale.setScalar(1 + st.knock * 0.25);
          const mu = this.sealMats[idx].uniforms;
          mu.uCrack.value = st.state >= 1 ? 1 : 0;
          mu.uKnock.value = st.knock;
        });
        c++;
      }
    }
    for (let i = n; i < this.links.count; i++) {
      this.m.makeScale(0, 0, 0);
      this.links.setMatrixAt(i, this.m);
      this.linksOut.setMatrixAt(i, this.m);
    }
    this.links.count = this.max;
    this.links.instanceMatrix.needsUpdate = true;
    this.linksOut.instanceMatrix.needsUpdate = true;
    ((this.links.material as THREE.ShaderMaterial).uniforms.uStrain as THREE.IUniform).value = o.strain;
    // the line
    this.line.position.set(0, o.lineY, o.lineZ);
    this.lineGlow.position.set(0, o.lineY, o.lineZ);
    this.lineGlow.quaternion.copy(o.cam.quaternion);
    this.lineGlow.rotation.z = 0;
    this.lineGlow.lookAt(o.cam.position.x, o.lineY, o.cam.position.z);
    this.lineU.uCrackL.value = o.lineCrack;
    this.lineU.uHum.value = o.hum;
    this.lastN = n;
  }
  lastN = 0;
  dispose() {
    this.atlas.dispose();
  }
}
