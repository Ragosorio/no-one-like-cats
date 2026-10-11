/**
 * HEMKADE — our ship in 3D (the same identity as the 2D one in LIKY FIGHT: navy hull, orange stripe, gold rail and
 * portholes, the flame-cat sail), now flying: the Kit de Vuelo wings and the astral thrusters glow behind it.
 * 16 m long, bow +X. Deck points (for the cats, drawn as the Momento's baked paintings on top) come from `deck()`.
 */
import * as THREE from 'three';
import { inked, outlineMat, toonMat, type U } from './mats';

function hullGeometry(): THREE.BufferGeometry {
  const NX = 28;
  const NA = 14;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const width = (t: number) => (t < 0.72 ? 3.3 * (0.82 + 0.18 * Math.sin((t / 0.72) * Math.PI * 0.5)) : 3.3 * Math.cos(((t - 0.72) / 0.28) * Math.PI * 0.5) ** 0.8 + 0.05);
  for (let i = 0; i <= NX; i++) {
    const t = i / NX;
    const x = -8 + t * 16;
    const w = width(t);
    const d = 2.4 * (0.75 + 0.25 * Math.sin(t * Math.PI)) * (t > 0.9 ? 1 - (t - 0.9) * 4 : 1);
    const rise = t > 0.75 ? (t - 0.75) * 3.2 : t < 0.08 ? (0.08 - t) * 6 : 0;
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA) * Math.PI;
      pos.push(x, -Math.sin(a) * d + rise * 0.6, Math.cos(a) * w);
      uv.push(t, j / NA);
    }
  }
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NA; j++) {
      const a = i * (NA + 1) + j;
      const b = a + NA + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function flameSail(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff3dc';
  g.fillRect(0, 0, 256, 256);
  // the flame-cat: a flame with two ears
  g.fillStyle = '#ff8a1f';
  g.beginPath();
  g.moveTo(128, 214);
  g.bezierCurveTo(60, 210, 58, 140, 92, 104);
  g.lineTo(86, 52);
  g.lineTo(116, 84);
  g.bezierCurveTo(124, 80, 132, 80, 140, 84);
  g.lineTo(170, 52);
  g.lineTo(164, 104);
  g.bezierCurveTo(198, 140, 196, 210, 128, 214);
  g.fill();
  g.fillStyle = '#ffc23a';
  g.beginPath();
  g.ellipse(128, 168, 26, 36, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1c275a';
  g.fillRect(108, 130, 10, 12);
  g.fillRect(138, 130, 10, 12);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export class Ship {
  readonly group = new THREE.Group();
  /** the rocking body (the group is placed by the stage; this one bobs/rolls) */
  readonly body = new THREE.Group();
  readonly bow = new THREE.Object3D();
  readonly wings: THREE.Group[] = [];
  private thrust: THREE.Mesh[] = [];
  readonly thrustU: U;
  private sailTex: THREE.CanvasTexture;
  readonly deckPts: Record<string, THREE.Object3D> = {};

  constructor(shared: U) {
    const out = (px = 2.4) => outlineMat(shared, { color: 0x0e1238, px });
    const hullMat = toonMat(shared, {
      base: 0x2a3a78,
      shadow: 0x161f4a,
      light: 0x4a62b8,
      freq: 26,
      seed: 31,
      fBody: /* glsl */ `
  // the orange stripe under the rail, gold portholes, a waterline
  float stripe = step(0.06, vUv.y) * step(vUv.y, 0.14) + step(0.86, vUv.y) * step(vUv.y, 0.94);
  base = mix(base, vec3(1.0, 0.54, 0.12), stripe); lightC = mix(lightC, vec3(1.0, 0.75, 0.4), stripe); shadowC = mix(shadowC, vec3(0.7, 0.3, 0.08), stripe);
  float ph = step(length(vec2(fract(vUv.x * 7.0) - 0.5, (min(vUv.y, 1.0 - vUv.y) - 0.24) * 5.0)), 0.22) * step(0.2, vUv.x) * step(vUv.x, 0.8);
  base = mix(base, vec3(1.0, 0.83, 0.42), ph); emis += vec3(1.0, 0.8, 0.4) * ph * 0.4;
`,
    });
    const hull = inked(hullGeometry(), hullMat, out(2.8));
    this.body.add(hull);
    // deck + rail
    const deckMat = toonMat(shared, { base: 0xc8955a, shadow: 0x7a5232, light: 0xf0c48a, freq: 30, seed: 32, lines: 'world' });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 6.2), deckMat);
    deck.position.set(-0.4, 0.1, 0);
    this.body.add(deck);
    const railMat = toonMat(shared, { base: 0xffc23a, shadow: 0xb07a18, light: 0xfff0a8, freq: 10, seed: 33 });
    for (const s of [1, -1]) {
      const r = inked(new THREE.BoxGeometry(14, 0.35, 0.3), railMat, out(1.6));
      r.position.set(-0.6, 0.9, s * 3.15);
      this.body.add(r);
    }
    // cabin at the stern
    const cabMat = toonMat(shared, { base: 0x3a4a8e, shadow: 0x1c275a, light: 0x6a7fd0, freq: 20, seed: 34 });
    const cab = inked(new THREE.BoxGeometry(3.2, 2.2, 4.6), cabMat, out());
    cab.position.set(-5.6, 1.3, 0);
    this.body.add(cab);
    // mast + sail
    const mastMat = toonMat(shared, { base: 0x8a5a32, shadow: 0x4a2e18, light: 0xc88a52, freq: 14, seed: 35 });
    const mast = inked(new THREE.CylinderGeometry(0.28, 0.36, 15, 8), mastMat, out(1.8));
    mast.position.set(0.8, 7.6, 0);
    this.body.add(mast);
    this.sailTex = flameSail();
    const sailG = new THREE.PlaneGeometry(8.4, 9.5, 8, 8);
    const sp = sailG.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i);
      const y = sp.getY(i);
      sp.setZ(i, 1.6 * Math.cos((x / 8.4) * Math.PI) * (0.6 + 0.4 * Math.cos((y / 9.5) * Math.PI)));
    }
    sailG.computeVertexNormals();
    sailG.rotateY(Math.PI / 2);
    const sailMat = toonMat(shared, {
      base: 0xfff3dc,
      shadow: 0xc9b89c,
      light: 0xffffff,
      freq: 22,
      seed: 36,
      side: THREE.DoubleSide,
      uniforms: { uSail: { value: this.sailTex } },
      fHead: 'uniform sampler2D uSail;',
      fBody: 'vec3 sc = texture2D(uSail, vUv).rgb; base = sc; lightC = mix(sc, vec3(1.0), 0.3); shadowC = sc * 0.72;',
    });
    const sail = inked(sailG, sailMat, out(1.8));
    sail.position.set(1.4, 8.4, 0);
    this.body.add(sail);
    // the Kit de Vuelo: swept wings (fold out when flying) + astral thrusters
    const wingMat = toonMat(shared, { base: 0xe9e4ff, shadow: 0x8e86c0, light: 0xffffff, freq: 18, seed: 37, fBody: 'float st = step(0.45, fract(vUv.x * 3.0)); base = mix(base, vec3(1.0, 0.54, 0.12), st * step(0.7, vUv.y)); emis += vec3(0.5,0.8,1.0) * 0.12;' });
    const wg = new THREE.BoxGeometry(6, 0.3, 7);
    const wp = wg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < wp.count; i++) {
      const z = wp.getZ(i);
      wp.setX(i, wp.getX(i) - Math.max(0, z) * 0.55);
      wp.setX(i, wp.getX(i) * (1 - Math.max(0, z) / 7 * 0.6));
    }
    wg.computeVertexNormals();
    for (const s of [1, -1]) {
      const pivot = new THREE.Group();
      const w = inked(wg, wingMat, out(2));
      w.position.set(0, 0, 3.6);
      pivot.add(w);
      pivot.position.set(-1, -0.6, s * 2.8);
      pivot.scale.z = s;
      this.wings.push(pivot);
      this.body.add(pivot);
    }
    this.thrustU = { uThrust: { value: 0.5 } };
    const thrMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, ...this.thrustU },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `uniform float uThrust; uniform float uTime; uniform float uStyle; varying vec2 vUv;
void main(){ float f = (1.0 - vUv.y); float flick = 0.8 + 0.2 * sin(uTime * 60.0 + vUv.x * 12.0); vec3 c = mix(vec3(0.4, 0.8, 1.0), vec3(1.0, 0.95, 0.8), f) * f * uThrust * flick * (1.0 - uStyle * 0.85); gl_FragColor = vec4(c, 1.0); }`,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const cone = new THREE.ConeGeometry(0.9, 6, 10, 1, true);
    cone.rotateZ(Math.PI / 2);
    cone.translate(-3, 0, 0);
    for (const s of [1, -1]) {
      const t = new THREE.Mesh(cone, thrMat);
      t.position.set(-8, 0.2, s * 1.6);
      this.thrust.push(t);
      this.body.add(t);
    }
    // the bow cannon (Canelo's starfire leaves from here)
    const can = inked(new THREE.CylinderGeometry(0.45, 0.6, 3.2, 10), mastMat, out(1.8));
    can.rotation.z = -Math.PI / 2 + 0.25;
    can.position.set(7.4, 1.2, 0);
    this.body.add(can);
    this.bow.position.set(9.2, 1.7, 0);
    this.body.add(this.bow);
    // where the cats stand
    const pts: [string, number, number, number][] = [['canelo', 6.2, 0.3, 0], ['luzterna', -1.0, 0.3, -1.7], ['crew0', -4.6, 0.3, 1.5], ['crew1', 2.6, 0.3, 1.8], ['helm', -5.6, 2.4, 0]];
    for (const [k, x, y, z] of pts) {
      const o = new THREE.Object3D();
      o.position.set(x, y, z);
      this.deckPts[k] = o;
      this.body.add(o);
    }
    this.group.add(this.body);
  }

  update(o: { fold: number; thrust: number; bob: number; roll: number; pitch: number }) {
    for (let i = 0; i < 2; i++) {
      const w = this.wings[i];
      w.rotation.x = (i === 0 ? 1 : -1) * (1 - o.fold) * 1.3;
      w.visible = o.fold > 0.02;
    }
    this.thrustU.uThrust.value = o.thrust;
    for (const t of this.thrust) t.visible = o.thrust > 0.02;
    this.body.position.y = o.bob;
    this.body.rotation.set(o.roll, 0, o.pitch);
  }
  dispose() {
    this.sailTex.dispose();
  }
}
