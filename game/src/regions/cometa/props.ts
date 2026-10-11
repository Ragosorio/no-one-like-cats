/**
 * The yard's moving and special-material parts (each a single draw call):
 *  - cranes: the slewing tops (cab, jib, counterweight, trolley, cable, hook and its load)
 *  - the big telescope (fork + brass tube) that sweeps the sky, and the radar dish
 *  - the fishbowl helmet on the workshop's spire (glass: fresnel + reflections)
 *  - the crater's crystal SHIELD (concept 6): a hex-veined dome you only see at grazing angles
 *  - the glass fuel tubes where Combustible Astral flows in pulses
 *  - glowing ice veins on the ground, from the heart outward
 *  - the asteroid debris that orbits the island, slowly
 */
import * as THREE from 'three';
import type { Bin } from '../paginas/kit';
import { Mesher, mat, type U } from '../cielo/kit';
import { floatingRocks, type RockPalette } from '../cielo/rock';
import { P, beam, girder, metalToon, pipe } from './kit';
import { CRATER, height } from './layout';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface Crane {
  group: THREE.Group;
  /** world point of the jib tip (beacon) */
  tip(): THREE.Vector3;
  update(t: number): void;
}

/** a tower crane's slewing top (the mast is static in the port mesh) */
export function craneTop(bin: Bin, mtl: THREE.Material, base: THREE.Vector3, jib: number, load: 'fin' | 'bell' | 'crate', phase: number): Crane {
  const M = new Mesher(true);
  // cab
  M.add(new THREE.BoxGeometry(1.6, 1.4, 1.6), P.mustard, mat(0.2, 0.7, 1.15), 0.4);
  M.add(new THREE.BoxGeometry(1.2, 0.8, 0.05), P.glass, mat(0.2, 0.85, 1.96), 0.5, 0.6);
  // turntable, A-frame and the jib
  M.add(new THREE.CylinderGeometry(1.0, 1.0, 0.4, 14), P.dark, mat(0, 0.2, 0), 0.4);
  girder(M, V(-4.5, 1.6, 0), V(jib, 1.6, 0), 1.1, P.mustard, 1.3, 0.09);
  beam(M, V(0, 0.4, -0.5), V(0, 4.2, 0), 0.14, P.mustard);
  beam(M, V(0, 0.4, 0.5), V(0, 4.2, 0), 0.14, P.mustard);
  beam(M, V(0, 4.2, 0), V(jib * 0.85, 1.7, 0), 0.05, P.steel2);
  beam(M, V(0, 4.2, 0), V(-4.3, 1.7, 0), 0.05, P.steel2);
  // the counterweight blocks
  M.add(new THREE.BoxGeometry(1.8, 1.4, 1.4), (p, out) => void out.set(Math.floor((p.x + 0.9) / 0.45) & 1 ? P.mustard : P.dark), mat(-3.8, 0.8, 0), 0.2);
  // trolley + cable + hook + load
  const tx = jib * 0.72;
  M.add(new THREE.BoxGeometry(1.0, 0.35, 1.0), P.steel2, mat(tx, 0.85, 0), 0.6);
  const drop = 6.5;
  pipe(M, V(tx - 0.12, 0.7, 0), V(tx - 0.12, 0.7 - drop, 0), 0.03, P.dark, 0.2);
  pipe(M, V(tx + 0.12, 0.7, 0), V(tx + 0.12, 0.7 - drop, 0), 0.03, P.dark, 0.2);
  M.add(new THREE.BoxGeometry(0.6, 0.5, 0.4), P.mustard, mat(tx, 0.4 - drop, 0), 0.3);
  M.add(new THREE.TorusGeometry(0.25, 0.07, 5, 10, Math.PI * 1.4), P.steel, mat(tx, -0.1 - drop, 0, 0, 0, Math.PI * 0.8), 0.8);
  const ly = -1.4 - drop;
  if (load === 'fin') {
    const fin = new THREE.BufferGeometry();
    const a = [0, 0.8, 0];
    const b = [-1.6, 0.8, 0];
    const c = [-2.6, -1.4, 0];
    const d = [-0.4, -0.6, 0];
    fin.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d, ...a, ...c, ...b, ...a, ...d, ...c], 3));
    M.add(fin, P.coral, mat(tx + 1.1, ly, 0), 0.5);
    for (const sx of [-0.3, 0.6]) pipe(M, V(tx, -0.2 - drop, 0), V(tx + sx, ly + 0.8, 0), 0.025, P.dark, 0.2);
  } else if (load === 'bell') {
    M.add(new THREE.CylinderGeometry(0.6, 1.0, 1.6, 14, 1, true), P.steel2, mat(tx, ly, 0), 0.85);
    M.add(new THREE.TorusGeometry(0.62, 0.08, 6, 16), P.chrome, mat(tx, ly + 0.8, 0, Math.PI / 2, 0, 0), 0.9);
    for (const sx of [-0.55, 0.55]) pipe(M, V(tx, -0.2 - drop, 0), V(tx + sx, ly + 0.8, 0), 0.025, P.dark, 0.2);
  } else {
    M.add(new THREE.BoxGeometry(1.6, 1.2, 1.2), P.teal, mat(tx, ly, 0), 0.3);
  }
  // a beacon at the tip (the halo does the glow)
  M.add(new THREE.OctahedronGeometry(0.16, 0), P.red, mat(jib, 1.9, 0), 0, 1);
  const mesh = new THREE.Mesh(bin.add(M.build()), mtl);
  mesh.castShadow = true;
  const group = new THREE.Group();
  group.position.copy(base);
  group.add(mesh);
  const tipL = V(jib, 2.1, 0);
  const out = new THREE.Vector3();
  return {
    group,
    tip: () => out.copy(tipL).applyMatrix4(group.matrixWorld),
    update(t) {
      // slews back and forth, pausing at each end (somebody up there is placing something)
      const k = Math.sin(t * 0.08 + phase);
      group.rotation.y = phase + Math.sign(k) * Math.pow(Math.abs(k), 0.6) * 0.9;
    },
  };
}

/** the observatory's big brass telescope (fork mount + tube), sweeping the sky */
export function telescope(bin: Bin, mtl: THREE.Material, pivot: THREE.Vector3) {
  const M = new Mesher(false);
  // the fork
  M.add(new THREE.BoxGeometry(0.3, 2.2, 0.6), P.navy, mat(-1.05, 1.1, 0), 0.6);
  M.add(new THREE.BoxGeometry(0.3, 2.2, 0.6), P.navy, mat(1.05, 1.1, 0), 0.6);
  M.add(new THREE.BoxGeometry(2.4, 0.3, 0.7), P.navy, mat(0, 0.1, 0), 0.6);
  const fork = new THREE.Mesh(bin.add(M.build()), mtl);
  const T = new Mesher(false);
  // the tube: brass with dark rings, a wide dew cap, the eyepiece and a finder scope
  T.add(new THREE.CylinderGeometry(0.72, 0.62, 6.4, 18), (p, out) => void out.set(Math.abs(p.y - 1.2) < 0.18 || Math.abs(p.y + 1.6) < 0.18 ? P.navy : P.brass), mat(0, 1.0, 0), 0.9);
  T.add(new THREE.CylinderGeometry(0.85, 0.78, 1.0, 18, 1, true), P.brass, mat(0, 4.5, 0), 0.9);
  T.add(new THREE.CircleGeometry(0.74, 18), '#0a1030', mat(0, 4.15, 0, -Math.PI / 2, 0, 0), 0.9, 0.25);
  T.add(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), P.dark, mat(0.55, -1.6, 0, 0, 0, Math.PI / 2), 0.4);
  T.add(new THREE.CylinderGeometry(0.15, 0.15, 2.0, 10), P.chrome, mat(0, 1.6, 0.9), 0.9);
  T.add(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 12), P.dark, mat(0, 0, 0, 0, 0, Math.PI / 2), 0.5);
  const tube = new THREE.Mesh(bin.add(T.build()), mtl);
  tube.position.y = 1.9;
  tube.castShadow = true;
  fork.castShadow = true;
  const group = new THREE.Group();
  group.position.copy(pivot);
  group.add(fork, tube);
  let aim: { yaw: number; pitch: number } | null = null;
  return {
    group,
    tube,
    /** point it somewhere (null = back to sweeping) */
    aimAt(yaw: number | null, pitch = 0.6) {
      aim = yaw === null ? null : { yaw, pitch };
    },
    update(t: number, dt: number) {
      const yaw = aim ? aim.yaw : -0.4 + Math.sin(t * 0.05) * 0.9;
      const pitch = aim ? aim.pitch : 0.7 + Math.sin(t * 0.083 + 1) * 0.25;
      const k = 1 - Math.exp(-dt * 1.5);
      group.rotation.y += (yaw - group.rotation.y) * k;
      // tilt the tube about the fork's axis (x)
      const want = -(Math.PI / 2 - pitch);
      tube.rotation.x += (want - tube.rotation.x) * k;
    },
  };
}

/** a radar dish on the antenna mast (it turns) */
export function radar(bin: Bin, mtl: THREE.Material, at: THREE.Vector3) {
  const M = new Mesher(true);
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    prof.push(new THREE.Vector2(0.05 + t * 1.6, t * t * 0.7));
  }
  const dish = new THREE.LatheGeometry(prof, 18);
  M.add(dish, P.chrome, mat(0, 0.9, 0.2, Math.PI / 2 - 0.4, 0, 0), 0.9);
  const back = dish.clone();
  M.add(back.scale(1, 1, 1), P.steel2, mat(0, 0.88, 0.17, Math.PI / 2 - 0.4 + Math.PI, 0, 0, 0.98, 0.98, 0.98), 0.6);
  M.add(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), P.steel, mat(0, 1.0, -0.4, Math.PI / 2 - 0.4, 0, 0), 0.6);
  M.add(new THREE.SphereGeometry(0.12, 8, 6), P.red, mat(0, 1.25, -0.95), 0, 1);
  M.add(new THREE.CylinderGeometry(0.25, 0.35, 0.6, 8), P.dark, mat(0, 0.3, 0), 0.4);
  const mesh = new THREE.Mesh(bin.add(M.build()), mtl);
  mesh.position.copy(at);
  mesh.castShadow = true;
  return mesh;
}

/** glass: fresnel edge, a cold sky reflection band and a hot specular dot (transparent, one draw call) */
function glassMaterial(bin: Bin, tint: string, uNight: U<number>) {
  return bin.add(
    new THREE.ShaderMaterial({
      uniforms: { uTint: { value: new THREE.Color(tint) }, uNight },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */ `uniform vec3 uTint; uniform float uNight; varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main(){
          vec3 N = normalize(vN); vec3 Vv = normalize(vV);
          float f = pow(1.0 - abs(dot(N, Vv)), 2.2);
          vec3 R = reflect(-Vv, N);
          float band = smoothstep(0.05, 0.25, R.y) * (1.0 - smoothstep(0.25, 0.7, R.y));
          float spec = pow(max(dot(R, normalize(vec3(0.4, 0.8, 0.3))), 0.0), 60.0);
          vec3 col = uTint * (0.25 + f * 0.9) + vec3(1.0) * band * 0.35 + vec3(1.0) * spec * 1.4;
          col += mix(vec3(0.0), vec3(0.3, 0.8, 1.0), uNight) * f * 0.6;
          float a = clamp(0.12 + f * 0.75 + band * 0.25 + spec, 0.0, 0.95);
          gl_FragColor = vec4(col, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
}

/** the fishbowl helmet on the spire (and, reused, the owner's own helmet) */
export function fishbowl(bin: Bin, r: number, uNight: U<number>) {
  const geo = bin.add(new THREE.SphereGeometry(r, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.82));
  const mesh = new THREE.Mesh(geo, glassMaterial(bin, '#bdf6ff', uNight));
  mesh.renderOrder = 7;
  return mesh;
}

/** the crater's crystal shield: a low dome of hex cells, visible at grazing angles, pulsing softly */
export function shieldDome(bin: Bin, uTime: U<number>, uNight: U<number>) {
  const R = CRATER.r + 1.6;
  const geo = bin.add(new THREE.SphereGeometry(R, 48, 18, 0, Math.PI * 2, 0, Math.PI / 2));
  geo.scale(1, 0.55, 1);
  const mtl = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { uTime, uNight },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vV; varying vec3 vL;
        void main(){ vL = position; vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform float uNight; varying vec3 vN; varying vec3 vV; varying vec3 vL;
        // hex grid distance (cells ~1.4 u)
        float hexd(vec2 p){ p /= 1.4; vec2 r = vec2(1.0, 1.732); vec2 h = r * 0.5;
          vec2 a = mod(p, r) - h; vec2 b = mod(p - h, r) - h; vec2 g = dot(a, a) < dot(b, b) ? a : b;
          vec2 q = abs(g); return 0.5 - max(dot(q, normalize(vec2(1.0, 1.732))), q.x); }
        void main(){
          float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);
          float az = atan(vL.z, vL.x);
          vec2 uv = vec2(az * 9.0, vL.y * 2.2);
          float e = smoothstep(0.06, 0.0, hexd(uv));
          float wave = 0.5 + 0.5 * sin(vL.y * 1.4 - uTime * 1.3);
          float a = (f * 0.35 + e * (0.12 + f * 0.6)) * (0.55 + wave * 0.45) * (0.6 + uNight * 0.6);
          vec3 c = mix(vec3(0.55, 0.95, 1.0), vec3(1.0, 0.55, 0.9), smoothstep(-0.6, 0.6, sin(az * 2.0 + uTime * 0.2)));
          gl_FragColor = vec4(c * a, a);
        }`,
    }),
  );
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.position.set(CRATER.x, height(CRATER.x, CRATER.z) + 0.2, CRATER.z);
  mesh.renderOrder = 5;
  return mesh;
}

/** glass tubes along the pipe runs, Combustible Astral flowing in pulses (toward the tank, toward the docks) */
export function fuelTubes(bin: Bin, runs: THREE.Vector3[][], uTime: U<number>, uNeon: U<number>) {
  const geos: THREE.BufferGeometry[] = [];
  for (const run of runs) {
    const curve = new THREE.CatmullRomCurve3(run, false, 'catmullrom', 0.05);
    const len = curve.getLength();
    const g = new THREE.TubeGeometry(curve, Math.max(16, Math.round(len * 1.5)), 0.17, 8, false);
    // u along the run in world units (for the pulses)
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len);
    geos.push(g);
  }
  const pos: number[] = [];
  const uvs: number[] = [];
  for (const g of geos) {
    const ng = g.toNonIndexed();
    pos.push(...(ng.attributes.position.array as Float32Array));
    uvs.push(...(ng.attributes.uv.array as Float32Array));
    ng.dispose();
    g.dispose();
  }
  const geo = bin.add(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeBoundingSphere();
  const mtl = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { uTime, uNeon },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform float uNeon; varying vec2 vUv;
        void main(){
          float s = vUv.x;
          float pulse = pow(0.5 + 0.5 * sin(s * 1.3 - uTime * 3.2), 6.0);
          float bub = step(0.93, fract(sin(floor(s * 3.0 - uTime * 4.0) * 12.9898) * 43758.5)) * smoothstep(0.3, 0.5, abs(fract(vUv.y * 2.0) - 0.5));
          vec3 base = mix(vec3(0.62, 0.32, 1.0), vec3(1.0, 0.36, 0.9), pulse);
          vec3 col = base * (0.55 + pulse * 1.2 + bub * 0.8) * (0.8 + uNeon * 0.8);
          gl_FragColor = vec4(col, 0.8);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.renderOrder = 3;
  return mesh;
}

/** glowing ice veins on the ground, cracking out from the heart (additive strips laid on the terrain) */
export function veins(bin: Bin, rng: () => number, uTime: U<number>, uNeon: U<number>) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const cx = CRATER.x;
  const cz = CRATER.z;
  // 1) grow the cracks as polylines (a branch may fork once or twice)
  type Crack = { pts: [number, number][]; w: number; t0: number };
  const cracks: Crack[] = [];
  const grow = (x: number, z: number, a: number, len: number, w: number, t0: number, depth: number) => {
    const steps = Math.max(4, Math.round(len / 0.9));
    const pts: [number, number][] = [[x, z]];
    let ang = a;
    for (let i = 1; i <= steps; i++) {
      ang += (rng() - 0.5) * 0.7;
      x += Math.cos(ang) * (len / steps);
      z += Math.sin(ang) * (len / steps);
      pts.push([x, z]);
      if (depth < 2 && i > 2 && i < steps - 1 && rng() < 0.12) grow(x, z, ang + (rng() < 0.5 ? -1 : 1) * (0.6 + rng() * 0.6), len * 0.45, w * 0.7, t0 + i / steps, depth + 1);
    }
    cracks.push({ pts, w, t0 });
  };
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rng() * 0.3;
    const r0 = CRATER.r * 0.75;
    grow(cx + Math.cos(a) * r0, cz + Math.sin(a) * r0, a, 7 + rng() * 12, 0.22 + rng() * 0.12, 0, 0);
  }
  // 2) lay each one on the ground as a strip
  let base = 0;
  for (const c of cracks) {
    const n = c.pts.length;
    for (let i = 0; i < n; i++) {
      const [px, pz] = c.pts[i];
      const [qx, qz] = c.pts[Math.min(n - 1, i + 1)];
      const [ox, oz] = c.pts[Math.max(0, i - 1)];
      const ang = Math.atan2(qz - oz, qx - ox);
      const t = i / (n - 1);
      const ww = c.w * (1 - t * 0.85);
      for (const sd of [-1, 1]) {
        const vx = px - Math.sin(ang) * ww * sd;
        const vz = pz + Math.cos(ang) * ww * sd;
        pos.push(vx, height(vx, vz) + 0.06, vz);
        uv.push(c.t0 + t, sd < 0 ? 0 : 1);
      }
      if (i < n - 1) {
        const k = base + i * 2;
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    base += n * 2;
  }
  const geo = bin.add(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  const mtl = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { uTime, uNeon },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform float uNeon; varying vec2 vUv;
        void main(){
          float e = 1.0 - abs(vUv.y * 2.0 - 1.0);
          float t = clamp(vUv.x / 2.2, 0.0, 1.0);
          float pulse = 0.55 + 0.45 * sin(vUv.x * 9.0 - uTime * 2.2);
          float a = pow(e, 1.5) * (1.0 - t * 0.7) * pulse * (0.35 + uNeon * 0.65);
          vec3 c = mix(vec3(0.5, 0.95, 1.0), vec3(0.95, 0.5, 1.0), t);
          gl_FragColor = vec4(c * a, a);
        }`,
    }),
  );
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.renderOrder = 2;
  return mesh;
}

/** loose asteroid chips orbiting the island, slowly (one mesh, turned as a whole) */
export function debris(bin: Bin, rng: () => number, uNight: U<number>, uNeon: U<number>, pal: RockPalette) {
  const M = new Mesher(true);
  for (let i = 0; i < 16; i++) {
    const a = rng() * Math.PI * 2;
    const r = 60 + rng() * 55;
    const y = -12 + rng() * 26;
    floatingRocks(M, 2 + Math.floor(rng() * 3), V(Math.cos(a) * r, y, Math.sin(a) * r), 4 + rng() * 6, rng, pal, 1.2 + rng() * 1.6);
  }
  const mesh = new THREE.Mesh(bin.add(M.build()), metalToon(bin, { uNight, uNeon, key: 'debris', bright: 0.04 }));
  mesh.name = 'debris';
  return mesh;
}
