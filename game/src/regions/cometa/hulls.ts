/**
 * Ships of Puerto Cometa: hulls in mid-conversion (wood going chrome), the retro test rocket of the
 * launch rail, and the player's own sloop wearing its ASTRAL look (solar sails, thrusters that glow).
 * Everything static goes into a Mesher; what moves is its own small group.
 */
import * as THREE from 'three';
import { ship } from '../../rupturas/props';
import type { LocalLight } from '../../engine/world/paperCat';
import type { Bin } from '../paginas/kit';
import { Mesher, mat, type U } from '../cielo/kit';
import { P, metalToon, rivets, pipe } from './kit';

const WOOD = new THREE.Color(P.wood);
const WOOD2 = new THREE.Color(P.wood2);
const TEAL = new THREE.Color(P.teal);
const CHROME = new THREE.Color(P.chrome);
const CREAM = new THREE.Color(P.cream);
const CORAL = new THREE.Color(P.coral);
const NAVY = new THREE.Color(P.navy);

/** a hull loft along +x (bow at +x): U sections, keel at y = 0, deck at y = depth */
export function hullGeometry(L: number, beam: number, depth: number) {
  const secs = 14;
  const ring = 10;
  const verts: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= secs; i++) {
    const t = i / secs;
    const x = -L / 2 + t * L;
    // full amidships, a sharp bow, a squarer stern
    const w = (beam / 2) * Math.pow(Math.sin(Math.min(1, t * 1.05 + 0.12) * Math.PI * 0.92), 0.7) * (t > 0.85 ? 1 - (t - 0.85) * 2.6 : 1) + 0.08;
    const d = depth * (1 - Math.pow(Math.abs(t - 0.5) * 2, 3) * 0.35);
    const sheer = Math.pow(Math.abs(t - 0.45) * 2, 2) * 0.5;
    for (let j = 0; j <= ring; j++) {
      const a = Math.PI + (j / ring) * Math.PI;
      verts.push(x, depth + Math.sin(a) * d + (j === 0 || j === ring ? sheer : 0), Math.cos(a) * w);
    }
  }
  for (let i = 0; i < secs; i++)
    for (let j = 0; j < ring; j++) {
      const a = i * (ring + 1) + j;
      const b = a + ring + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  return g;
}

/**
 * A ship halfway to being a starship, in local space (bow +x, keel on y = 0). `stage` 0..1: how far
 * the conversion went (0.35 = wood with a chrome nose; 0.8 = plated, finned, with boosters).
 * Returns the points where the welders work (local).
 */
export function convertingShip(M: Mesher, m: THREE.Matrix4, stage: number, L = 12, beam = 3.6, depth = 2.4) {
  const plated = -L / 2 + L * (1 - stage);
  const hg = hullGeometry(L, beam, depth);
  M.add(
    hg,
    (p, out) => {
      if (p.x > plated) {
        // chrome plates in a checker, a teal stripe along the sheer, navy belly
        const tile = (Math.floor(p.x / 1.1) + Math.floor((p.y + p.z * 0.3) / 0.8)) & 1;
        out.copy(tile ? CHROME : TEAL).lerp(CHROME, 0.35);
        if (p.y > depth * 0.72) out.copy(CORAL);
        if (p.y < depth * 0.25) out.copy(NAVY);
      } else {
        // the old wooden hull: planks
        out.copy(Math.floor(p.y / 0.32) & 1 ? WOOD : WOOD2);
        if (p.y > depth * 0.78) out.copy(new THREE.Color(P.mustard));
      }
    },
    m,
    0.55,
  );
  // the deck and a little cabin with portholes
  M.add(new THREE.BoxGeometry(L * 0.86, 0.14, beam * 0.84), '#b07c4f', new THREE.Matrix4().multiplyMatrices(m, mat(-L * 0.02, depth + 0.05, 0)));
  M.add(new THREE.BoxGeometry(2.4, 1.3, beam * 0.6), stage > 0.6 ? P.cream : '#6b3b2a', new THREE.Matrix4().multiplyMatrices(m, mat(-L * 0.28, depth + 0.7, 0)), stage > 0.6 ? 0.4 : 0);
  for (const sz of [-1, 1]) {
    M.add(new THREE.TorusGeometry(0.26, 0.06, 5, 12), P.chrome, new THREE.Matrix4().multiplyMatrices(m, mat(-L * 0.28, depth + 0.8, sz * beam * 0.31, 0, 0, 0)), 0.9);
    M.add(new THREE.CircleGeometry(0.22, 10), P.warm, new THREE.Matrix4().multiplyMatrices(m, mat(-L * 0.28, depth + 0.8, sz * (beam * 0.3 + 0.01), 0, sz > 0 ? 0 : Math.PI, 0)), 0, 1);
  }
  // a chrome nose cone on the bow
  M.add(new THREE.ConeGeometry(0.75, 2.6, 12), P.chrome, new THREE.Matrix4().multiplyMatrices(m, mat(L / 2 + 0.75, depth * 0.62, 0, 0, 0, -Math.PI / 2)), 0.9);
  M.add(new THREE.SphereGeometry(0.2, 8, 6), P.red, new THREE.Matrix4().multiplyMatrices(m, mat(L / 2 + 2.05, depth * 0.62, 0)), 0.2, 1);
  // rivet rows along the plated part (they glow at night)
  for (const sz of [-1, 1]) {
    const a = new THREE.Vector3(plated + 0.3, depth * 0.66, sz * beam * 0.47).applyMatrix4(m);
    const b = new THREE.Vector3(L / 2 - 1.2, depth * 0.66, sz * beam * 0.2).applyMatrix4(m);
    rivets(M, a, b, Math.round((L / 2 - plated) * 2.2), P.warm, 0.07, 1);
    const a2 = new THREE.Vector3(plated + 0.3, depth * 0.36, sz * beam * 0.42).applyMatrix4(m);
    const b2 = new THREE.Vector3(L / 2 - 1.6, depth * 0.36, sz * beam * 0.16).applyMatrix4(m);
    rivets(M, a2, b2, Math.round((L / 2 - plated) * 2), P.neonCyan, 0.06, 1);
  }
  // fins (swept, coral) and thruster bells at the stern
  const fins = stage > 0.6 ? [-1, 1] : [1];
  for (const sz of fins) {
    // a swept fin, both faces (the toon material draws front faces only)
    const a = [0, 0, 0];
    const b = [-2.4, 0, 0];
    const c = [-3.4, -0.2, 2.2];
    const d = [-1.2, -0.1, 1.6];
    const fin = new THREE.BufferGeometry();
    fin.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d, ...a, ...c, ...b, ...a, ...d, ...c], 3));
    M.add(fin, P.coral, new THREE.Matrix4().multiplyMatrices(m, mat(-L * 0.15, depth * 0.55, sz * beam * 0.45, sz > 0 ? 0 : Math.PI, 0, 0)), 0.5);
  }
  const bells = stage > 0.6 ? [-0.7, 0.7] : [0];
  const glowAt: THREE.Vector3[] = [];
  for (const bz of bells) {
    const bm = new THREE.Matrix4().multiplyMatrices(m, mat(-L / 2 - 0.4, depth * 0.55, bz, 0, 0, Math.PI / 2));
    M.add(new THREE.CylinderGeometry(0.55, 0.85, 1.3, 14, 1, true), P.steel2, bm, 0.8);
    M.add(new THREE.CircleGeometry(0.5, 14), P.fuel, new THREE.Matrix4().multiplyMatrices(bm, mat(0, 0.3, 0, Math.PI / 2, 0, 0)), 0, 1);
    glowAt.push(new THREE.Vector3(-L / 2 - 1.2, depth * 0.55, bz).applyMatrix4(m));
  }
  if (stage > 0.6) {
    // a bubble cockpit and two strap-on boosters
    M.add(new THREE.SphereGeometry(1.0, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), P.glass, new THREE.Matrix4().multiplyMatrices(m, mat(L * 0.12, depth + 0.1, 0)), 0.9, 0.6);
    for (const sz of [-1, 1]) {
      const bm = new THREE.Matrix4().multiplyMatrices(m, mat(-L * 0.08, depth * 0.45, sz * (beam * 0.5 + 0.55), 0, 0, -Math.PI / 2));
      M.add(new THREE.CylinderGeometry(0.5, 0.5, L * 0.55, 12), P.cream, bm, 0.6);
      M.add(new THREE.ConeGeometry(0.5, 1.2, 12), P.coral, new THREE.Matrix4().multiplyMatrices(bm, mat(0, L * 0.275 + 0.6, 0)), 0.6);
    }
  }
  // where the welders work (local → world)
  const weld: THREE.Vector3[] = [];
  for (let i = 0; i < 4; i++) weld.push(new THREE.Vector3(plated + 0.2 + i * 0.05, depth * (0.3 + i * 0.15), (i % 2 ? 1 : -1) * beam * 0.48).applyMatrix4(m));
  weld.push(new THREE.Vector3(-L * 0.15, depth * 0.6, beam * 0.5).applyMatrix4(m));
  return { weld, glowAt };
}

/** the launch rail's test rocket: retro, cream with coral stripes, three fins, portholes, a fuel-violet bell */
export function rocket(bin: Bin, uNight: U<number>, uNeon: U<number>) {
  const M = new Mesher(false);
  const prof: THREE.Vector2[] = [];
  const L = 5.2;
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const r = 0.78 * Math.pow(Math.sin(Math.min(1, t * 1.02 + 0.06) * Math.PI * 0.62 + 0.25), 1.2) * (1 - Math.pow(t, 4) * 0.98);
    prof.push(new THREE.Vector2(Math.max(0.02, r), t * L));
  }
  const body = new THREE.LatheGeometry(prof, 20);
  M.add(
    body,
    (p, out) => {
      const t = p.y / L;
      out.set(P.cream);
      if (t > 0.72) out.set(P.coral);
      if (Math.abs(t - 0.28) < 0.035 || Math.abs(t - 0.56) < 0.03) out.set(P.coral);
      if (t < 0.06) out.set(P.steel2);
    },
    undefined,
    0.7,
  );
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = new THREE.BufferGeometry();
    fin.setAttribute('position', new THREE.Float32BufferAttribute([0.6, 0.2, 0, 1.55, -0.45, 0, 0.62, 1.7, 0, 0.6, 0.2, 0, 0.62, 1.7, 0, 1.55, -0.45, 0], 3));
    fin.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1], 3));
    M.add(fin, P.coral, mat(0, 0, 0, 0, a, 0), 0.6);
  }
  for (const y of [2.4, 3.3]) {
    M.add(new THREE.TorusGeometry(0.2, 0.05, 6, 12), P.chrome, mat(0, y, 0.72, 0, 0, 0), 0.9);
    M.add(new THREE.CircleGeometry(0.17, 12), P.warm, mat(0, y, 0.73), 0, 1);
  }
  M.add(new THREE.CylinderGeometry(0.42, 0.62, 0.6, 14, 1, true), P.steel, mat(0, -0.2, 0), 0.9);
  M.add(new THREE.CircleGeometry(0.4, 14), P.fuel, mat(0, -0.25, 0, Math.PI / 2, 0, 0), 0, 1);
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(bin.add(M.build()), metalToon(bin, { uNight, uNeon, key: 'rocket', bright: 0.1 }));
  mesh.castShadow = true;
  g.add(mesh);
  // the flame: an additive cone that flickers (hidden until launch)
  const flameU = { uTime: { value: 0 }, uK: { value: 0 } };
  const flame = new THREE.Mesh(
    bin.add(new THREE.ConeGeometry(0.55, 3.2, 16, 4, true).translate(0, -1.6, 0).rotateX(Math.PI)),
    bin.add(
      new THREE.ShaderMaterial({
        uniforms: flameU,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `uniform float uTime; varying float vY; varying vec2 vUv;
          void main(){ vUv = uv; vec3 p = position; vY = -p.y / 3.2; p.xz *= 1.0 + sin(uTime * 40.0 + p.y * 3.0) * 0.08; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
        fragmentShader: /* glsl */ `uniform float uK; uniform float uTime; varying float vY; varying vec2 vUv;
          void main(){
            float a = (1.0 - smoothstep(0.0, 1.0, vY)) * uK;
            a *= 0.7 + 0.3 * sin(vUv.x * 40.0 + uTime * 30.0);
            vec3 c = mix(vec3(1.0, 0.95, 1.0), mix(vec3(1.0, 0.36, 0.88), vec3(0.6, 0.35, 1.0), vY), smoothstep(0.0, 0.35, vY));
            gl_FragColor = vec4(c * a * 1.4, a);
          }`,
      }),
    ),
  );
  flame.position.y = -0.4;
  flame.visible = false;
  flame.renderOrder = 6;
  g.add(flame);
  return { group: g, flame, flameU, length: L };
}

/**
 * The player's sloop moored up here in its ASTRAL look (same hull and history: the ship is converted,
 * never replaced): the paw sail re-woven as a SOLAR SAIL (dark blue cells, a gold frame, the paw in
 * gold), two folding solar wings on the rails, and a pair of thrusters at the stern that glow fuel-violet.
 */
export function astralShip(bin: Bin, uNight: U<number>, uNeon: U<number>) {
  const base = ship();
  const g = base.group;
  // re-weave the sail: solar cells
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const sg = c.getContext('2d')!;
  sg.fillStyle = '#16214a';
  sg.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      sg.fillStyle = (x + y) % 2 ? '#22357a' : '#1c2b66';
      sg.fillRect(x * 32 + 2, y * 32 + 2, 28, 28);
      sg.fillStyle = 'rgba(140,200,255,0.25)';
      sg.fillRect(x * 32 + 4, y * 32 + 4, 10, 2);
    }
  sg.strokeStyle = '#e9b84a';
  sg.lineWidth = 8;
  sg.strokeRect(4, 4, 248, 248);
  sg.fillStyle = '#f2c14e';
  sg.beginPath();
  sg.ellipse(128, 150, 38, 32, 0, 0, Math.PI * 2);
  sg.fill();
  for (const [x, y] of [
    [84, 100],
    [112, 82],
    [144, 82],
    [172, 100],
  ]) {
    sg.beginPath();
    sg.ellipse(x, y, 13, 16, 0, 0, Math.PI * 2);
    sg.fill();
  }
  const tex = bin.add(new THREE.CanvasTexture(c));
  tex.colorSpace = THREE.SRGBColorSpace;
  const old = base.sails.uniforms.map.value as THREE.Texture;
  bin.add(old);
  base.sails.uniforms.map.value = tex;
  // the kit: solar wings, a dish on the mast, thrusters, an antenna
  const M = new Mesher(true);
  for (const sx of [-1, 1]) {
    // arm out of the rail, then a fan of three panels
    pipe(M, new THREE.Vector3(sx * 1.3, 1.0, -0.4), new THREE.Vector3(sx * 2.6, 1.6, -0.4), 0.06, P.chrome);
    for (let k = 0; k < 3; k++) {
      const pz = -1.7 + k * 1.3 + 0.65;
      const pm = mat(sx * 3.6, 1.75, pz, 0, 0, sx * 0.18);
      // a gold frame and 4×3 dark-blue cells on it
      M.add(new THREE.BoxGeometry(1.9, 0.05, 1.15), '#e9b84a', pm, 0.85);
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 3; j++) M.add(new THREE.BoxGeometry(0.4, 0.04, 0.32), (i + j) & 1 ? '#22357a' : '#1a2860', new THREE.Matrix4().multiplyMatrices(pm, mat(-0.69 + i * 0.46, 0.03, -0.36 + j * 0.36)), 0.9, 0.12);
    }
  }
  for (const sx of [-0.55, 0.55]) {
    M.add(new THREE.CylinderGeometry(0.32, 0.5, 0.9, 12, 1, true), P.steel2, mat(sx, 0.7, 3.55, Math.PI / 2, 0, 0), 0.85);
    M.add(new THREE.CircleGeometry(0.3, 12), P.fuel, mat(sx, 0.7, 4.0, 0, 0, 0), 0, 1);
  }
  M.add(new THREE.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.6), P.chrome, mat(0, 7.05, -0.3, Math.PI, 0, 0), 0.9);
  M.add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), P.chrome, mat(0, 7.6, -0.3), 0.9);
  M.add(new THREE.OctahedronGeometry(0.1, 0), P.red, mat(0, 8.35, -0.3), 0, 1);
  const kit = new THREE.Mesh(bin.add(M.build()), metalToon(bin, { uNight, uNeon, key: 'ship', bright: 0.06 }));
  kit.castShadow = true;
  g.add(kit);
  const exhaust = [new THREE.Vector3(-0.55, 0.7, 4.3), new THREE.Vector3(0.55, 0.7, 4.3)];
  return { group: g, sails: base.sails, lantern: base.lantern as LocalLight, exhaust };
}
