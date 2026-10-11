/**
 * Things at the edge of the chart: the BLANK PAGE where the sea ends (a sheet of paper as big as the world, torn
 * along the edge, glowing white), the DOOR (ajar, with giant hinges and a cat-flap at its foot), the white fleet of
 * the Correctores (identical, in a perfect row; ink stains after H62), gulls flying in formation, the Disruptores'
 * graffiti that drips glitch on torn floating rocks and their rift ship, and the Titiriteros' threads of light
 * that come down from the sky like reins.
 */
import * as THREE from 'three';
import type { Bin } from '../paginas/kit';
import { canvasTexture } from '../paginas/kit';
import { Mesher, mat, type U } from '../cielo/kit';
import { hull } from '../suenos/props';
import { DOOR, EDGE_Z } from './layout';

// ------------------------------------------------------------------ the blank page beyond the edge
export function blankSheet(bin: Bin, uTime: U<number>, uNight: U<number>) {
  // a huge sheet north of the edge, its torn front edge following a ragged line, plus the cut (paper thickness)
  const W = 1200;
  const D = 1400;
  const seg = 600;
  const pos: number[] = [];
  const uv: number[] = [];
  const rag = (x: number) => EDGE_Z + Math.sin(x * 0.21) * 1.6 + Math.sin(x * 0.53 + 1.7) * 0.9 + Math.sin(x * 1.3) * 0.5;
  const Y = 0.9;
  for (let i = 0; i < seg; i++) {
    const x0 = -W / 2 + (i / seg) * W;
    const x1 = -W / 2 + ((i + 1) / seg) * W;
    const z0a = rag(x0);
    const z0b = rag(x1);
    // top face (a quad from the ragged edge to the far end)
    const quad = [
      [x0, Y, z0a, 0],
      [x1, Y, z0b, 0],
      [x0, Y, -D, 1],
      [x0, Y, -D, 1],
      [x1, Y, z0b, 0],
      [x1, Y, -D, 1],
    ];
    for (const [x, y, z, v] of quad) {
      pos.push(x, y, z);
      uv.push(0, v);
    }
    // the cut: the paper's edge, down into the sea
    const cut = [
      [x0, Y, z0a, -1],
      [x0, -6, z0a, -2],
      [x1, Y, z0b, -1],
      [x1, Y, z0b, -1],
      [x0, -6, z0a, -2],
      [x1, -6, z0b, -2],
    ];
    for (const [x, y, z, v] of cut) {
      pos.push(x, y, z);
      uv.push(1, v);
    }
  }
  const g = bin.add(new THREE.BufferGeometry());
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { uTime, uNight },
      fog: false,
      vertexShader: /* glsl */ `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uNight; varying vec3 vW; varying vec2 vUv;
        float ph(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
        float pn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(ph(i), ph(i+vec2(1,0)), f.x), mix(ph(i+vec2(0,1)), ph(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec3 paper = vec3(0.985, 0.975, 0.95);
          // fibers and a very soft grain, more visible near the edge
          float d = max(0.0, ${EDGE_Z.toFixed(1)} - vW.z);
          float fib = pn(vW.xz * vec2(0.6, 4.0)) * 0.5 + pn(vW.xz * 2.2) * 0.5;
          paper *= 1.0 - fib * 0.05 * exp(-d * 0.02);
          // the light of nothing: it gets whiter (and slightly warmer) the farther you look
          paper = mix(paper, vec3(1.0, 0.99, 0.965), smoothstep(10.0, 300.0, d));
          // ink seeping along the torn edge
          float seep = smoothstep(4.0, 0.0, d) * (0.4 + 0.6 * pn(vW.xz * 0.7));
          paper = mix(paper, vec3(0.16, 0.14, 0.26), seep * 0.55);
          // the cut face: a slightly darker fibrous band
          if (vUv.x > 0.5) paper = vec3(0.9, 0.88, 0.84) * (0.85 + 0.15 * pn(vec2(vW.x * 3.0, vW.y * 9.0)));
          // at night it still glows (the blank is not lit by anything: it just is)
          paper *= mix(1.0, 0.86, uNight);
          gl_FragColor = vec4(paper, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const mesh = new THREE.Mesh(g, m);
  mesh.name = 'blank-sheet';
  mesh.frustumCulled = false;
  return mesh;
}

// ------------------------------------------------------------------ the door
export function door(M: Mesher) {
  const { x, z, w, h, y } = DOOR;
  const post = 1.6;
  const frame = '#e9e2d2';
  const dark = '#2a2440';
  // the step and the frame (two posts and a lintel with a carved cat's head)
  M.add(new THREE.BoxGeometry(w + 6, 0.8, 6), '#d8d0c0', mat(x, y + 0.2, z));
  for (const s of [-1, 1]) M.add(new THREE.BoxGeometry(post, h, post * 1.3), frame, mat(x + s * (w / 2 + post / 2), y + h / 2 + 0.6, z));
  M.add(new THREE.BoxGeometry(w + post * 2 + 1.2, post * 1.2, post * 1.5), frame, mat(x, y + h + 1.2, z));
  M.add(new THREE.ConeGeometry(1.6, 2.2, 3), frame, mat(x - 1.6, y + h + 2.8, z, 0, 0, 0.1));
  M.add(new THREE.ConeGeometry(1.6, 2.2, 3), frame, mat(x + 1.6, y + h + 2.8, z, 0, 0, -0.1));
  // ink drips down the frame
  for (let i = 0; i < 6; i++) M.add(new THREE.CylinderGeometry(0.12, 0.05, 2 + (i % 3) * 1.5, 4), dark, mat(x - w / 2 - post / 2 + (i % 2 ? 0.5 : -0.4), y + h - 1 - (i % 3) * 0.7, z + post * 0.66));
  // three giant hinges on the left post (the cat at the hinge is called Bisagra for a reason)
  for (let i = 0; i < 3; i++) {
    const hy = y + 3 + i * 7.5;
    M.add(new THREE.BoxGeometry(2.4, 2, 0.4), '#c89a4a', mat(x - w / 2 + 0.6, hy, z + post * 0.68), 0, 0.1);
    M.add(new THREE.CylinderGeometry(0.42, 0.42, 2.4, 10), '#e0b060', mat(x - w / 2, hy, z + post * 0.7), 0, 0.15);
  }
  return { hinge: new THREE.Vector3(x - w / 2, y + 0.6, z) };
}

/** the leaf (it swings on its hinges) with the cat-flap at its foot; built in hinge space */
export function doorLeaf(M: Mesher) {
  const { w, h } = DOOR;
  M.add(new THREE.BoxGeometry(w - 0.2, h, 0.7), (v, out) => out.set(Math.abs(v.x % 3) < 0.15 ? '#cfc6b4' : '#f2ecdf'), mat(w / 2, h / 2, 0));
  // panels
  for (const py of [h * 0.28, h * 0.72]) M.add(new THREE.BoxGeometry(w * 0.7, h * 0.32, 0.2), '#e2d8c4', mat(w / 2, py, 0.42));
  // a doorknob shaped like a paw
  M.add(new THREE.SphereGeometry(0.55, 10, 8), '#e0b060', mat(w - 1.4, h * 0.48, 0.6), 0, 0.2);
  // the cat-flap's frame
  M.add(new THREE.TorusGeometry(1.1, 0.16, 6, 16, Math.PI), '#4a3c5a', mat(w / 2, 0.3, 0.42));
}
export function catFlap(M: Mesher) {
  M.add(new THREE.CircleGeometry(1.05, 14, 0, Math.PI), '#7a6a8a', mat(0, -0.05, 0, 0, 0, Math.PI));
}

// ------------------------------------------------------------------ the white fleet
/** a Corrector's ship: white, symmetric, square sails, a white flag; `stained` = ink blots that won't come off */
export function whiteShip(M: Mesher, s = 1) {
  hull(M, { len: 11 * s, beam: 2.8 * s, depth: 2.2 * s, side: '#f7f7f4', stripe: '#e4e4ee', keel: '#c8c8d4', deck: '#eeeef2', m: mat(0, 1.3 * s, 0) });
  for (const [mz, mh] of [
    [-2.6, 9],
    [2.2, 10],
  ]) {
    M.add(new THREE.CylinderGeometry(0.14 * s, 0.18 * s, mh * s, 6), '#e8e8ee', mat(0, (2.2 + mh / 2) * s, mz * s));
    for (let k = 0; k < 2; k++) M.add(new THREE.BoxGeometry(3.8 * s, 2.3 * s, 0.08), '#ffffff', mat(0, (4.2 + k * 2.9) * s, mz * s + 0.2), (v) => 0.15 + Math.abs(v.y) * 0.05);
    M.add(new THREE.PlaneGeometry(1.4 * s, 0.8 * s), '#ffffff', mat(0.7 * s, (2.8 + mh) * s, mz * s), 0.6);
  }
}

/** ink blots on a ship's hull (one mesh per fleet, shown after H62) */
export function inkBlots(M: Mesher, rng: () => number, s = 1) {
  // on the stern and the hull's flanks, at the waterline
  for (let i = 0; i < 3; i++) {
    const side = i === 0 ? -1 : 1;
    const z = (rng() - 0.2) * 4 * s;
    M.add(new THREE.CircleGeometry((0.35 + rng() * 0.35) * s, 9), '#15122a', mat(side * 2.62 * s, (1.6 + rng() * 0.5) * s, z, 0, side * Math.PI / 2, rng() * 3));
    M.add(new THREE.CylinderGeometry(0.07 * s, 0.02, (0.8 + rng()) * s, 4), '#15122a', mat(side * 2.64 * s, 1.05 * s, z + 0.1, 0, 0, 0));
  }
  M.add(new THREE.CircleGeometry(0.55 * s, 9), '#15122a', mat(0.4 * s, 2.0 * s, 5.45 * s, 0, 0, rng() * 3));
  // and a stain on the aft square sail, facing back (the camera sees it)
  M.add(new THREE.CircleGeometry(0.75 * s, 10), '#15122a', mat(-0.5 * s, 4.6 * s, 2.2 * s + 0.26));
  M.add(new THREE.CylinderGeometry(0.08 * s, 0.03, 1.3 * s, 4), '#15122a', mat(-0.5 * s, 3.7 * s, 2.2 * s + 0.26));
}

/** a gull (a white chevron with a dark wingtip) */
export function gull(M: Mesher) {
  for (const s of [-1, 1]) {
    M.add(new THREE.BoxGeometry(1.4, 0.06, 0.45), '#ffffff', mat(s * 0.65, 0.18, 0, 0, s * 0.12, s * 0.3));
    M.add(new THREE.BoxGeometry(0.4, 0.06, 0.35), '#3a3a48', mat(s * 1.35, 0.42, 0.02, 0, 0, s * 0.3));
  }
  M.add(new THREE.SphereGeometry(0.22, 6, 4).scale(1, 0.9, 1.8), '#ffffff', mat(0, 0, 0));
  M.add(new THREE.ConeGeometry(0.06, 0.25, 4), '#ffb030', mat(0, 0, -0.45, -Math.PI / 2, 0, 0));
}

/** a giant pencil stuck in the ground (the Titiriteros write the margins with these): hexagonal, sharpened */
export function pencil(M: Mesher, x: number, y: number, z: number, len: number, rx: number, rz: number) {
  const B = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)), new THREE.Vector3(1, 1, 1));
  const part = (g: THREE.BufferGeometry, c: string | ((p: THREE.Vector3, out: THREE.Color) => void), m: THREE.Matrix4, glow = 0) => M.add(g, c, B.clone().multiply(m), 0, glow);
  part(new THREE.ConeGeometry(0.8, 1.6, 6), '#e8c89a', mat(0, 0.8, 0, Math.PI, 0, 0));
  part(new THREE.ConeGeometry(0.28, 0.56, 6), '#2a2440', mat(0, 0.28, 0, Math.PI, 0, 0));
  part(new THREE.CylinderGeometry(0.8, 0.8, len, 6), (v, out) => out.set(Math.abs(v.x) > 0.62 ? '#e0a83a' : '#f2c04a'), mat(0, 1.6 + len / 2, 0));
  part(new THREE.CylinderGeometry(0.84, 0.84, 0.9, 8), '#c8c8d0', mat(0, 1.6 + len + 0.45, 0));
  part(new THREE.CylinderGeometry(0.78, 0.78, 1.1, 8), '#f29aac', mat(0, 1.6 + len + 1.45, 0));
}

// ------------------------------------------------------------------ the Disruptores
/** a rift-pirate ship: black-violet hull, neon trims, torn sails (it glitches in the shader) */
export function riftShip(M: Mesher) {
  hull(M, { len: 12, beam: 3, depth: 2.4, side: '#2a1838', stripe: '#ff3ad0', keel: '#120a1c', glow: 0 });
  M.add(new THREE.CylinderGeometry(0.16, 0.22, 11, 6), '#3a2a48', mat(0, 6.5, -0.5));
  const sail = new THREE.PlaneGeometry(4.6, 5.6, 6, 6);
  const p = sail.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < -1.5 && (i * 7) % 3 === 0) p.setY(i, p.getY(i) + 1.2);
  M.add(sail, (v, out) => out.set(v.y > 1 ? '#4a2a5a' : '#2a1a3a'), mat(0, 7.2, -0.3, 0, Math.PI / 2, 0), 0.4);
  // neon trims
  M.add(new THREE.BoxGeometry(0.12, 0.12, 11), '#4ff2ff', mat(2.4, 1.3, 0), 0, 1);
  M.add(new THREE.BoxGeometry(0.12, 0.12, 11), '#4ff2ff', mat(-2.4, 1.3, 0), 0, 1);
  M.add(new THREE.OctahedronGeometry(0.7, 0), '#ff3ad0', mat(0, 12.4, -0.5), 0, 1);
}

/** a torn floating rock for the graffiti (a slab of paper-stone) */
export function tornRock(M: Mesher, x: number, y: number, z: number, s: number, ry: number) {
  const g = new THREE.BoxGeometry(6 * s, 4 * s, 1.2 * s, 6, 4, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i);
    const vy = p.getY(i);
    p.setX(i, vx + Math.sin(vy * 3.1 + vx) * 0.25 * s);
    p.setY(i, vy + Math.sin(vx * 2.3) * 0.3 * s);
  }
  M.add(g, (v, out) => out.set(v.z > 0.4 * s ? '#e6e0d4' : '#6a647e'), mat(x, y, z, 0.05, ry, 0.08));
  return new THREE.Vector3(x, y, z);
}

const TAGS = ['ROMPE LA CAJA', 'LIBRES', 'NO HAY MANO', '¿Y SI NO?', 'AQUÍ NO HAY BORDE', 'GATO SUELTO'];
/** a graffiti panel: spray tag on transparent, with drips; the material glitches (RGB split, sliced rows) */
export function graffiti(bin: Bin, uTime: U<number>, uK: U<number>, i: number) {
  const tex = canvasTexture(bin, 512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cols = ['#ff3ad0', '#4ff2ff', '#ffe14a', '#8aff6a'];
    const c = cols[i % cols.length];
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate((i % 2 ? -1 : 1) * 0.08);
    g.font = `900 ${i % 3 === 0 ? 74 : 62}px Impact, "Arial Black", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 14;
    g.strokeStyle = '#120a1c';
    const t = TAGS[i % TAGS.length];
    g.strokeText(t, 0, 0);
    g.fillStyle = c;
    g.fillText(t, 0, 0);
    // a cat-face tag and an arrow
    g.lineWidth = 6;
    g.strokeStyle = c;
    g.beginPath();
    g.arc(-w * 0.36, -h * 0.28, 22, 0, Math.PI * 2);
    g.moveTo(-w * 0.36 - 18, -h * 0.28 - 12);
    g.lineTo(-w * 0.36 - 22, -h * 0.28 - 38);
    g.lineTo(-w * 0.36 - 4, -h * 0.28 - 20);
    g.moveTo(-w * 0.36 + 18, -h * 0.28 - 12);
    g.lineTo(-w * 0.36 + 22, -h * 0.28 - 38);
    g.lineTo(-w * 0.36 + 4, -h * 0.28 - 20);
    g.stroke();
    g.restore();
    // drips
    g.fillStyle = c;
    for (let k = 0; k < 14; k++) {
      const x = 60 + ((k * 97) % (w - 120));
      const len = 20 + ((k * 53) % 70);
      g.fillRect(x, h * 0.62, 4, len);
      g.beginPath();
      g.arc(x + 2, h * 0.62 + len, 4, 0, Math.PI * 2);
      g.fill();
    }
  });
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uTime, uK, uSeed: { value: i * 1.7 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D map; uniform float uTime; uniform float uK; uniform float uSeed; varying vec2 vUv;
        float ph(float x){ return fract(sin(x * 91.7 + uSeed) * 43758.5); }
        void main(){
          float tq = floor(uTime * 9.0);
          float row = floor(vUv.y * 18.0);
          float glitch = step(0.9, ph(tq + row * 1.3)) * (ph(row + tq) - 0.5) * 0.12;
          vec2 uv = vUv + vec2(glitch, 0.0);
          // drain: after the battle the tag slides down and fades (uK 1 → 0)
          uv.y += (1.0 - uK) * 0.35 * ph(floor(vUv.x * 40.0));
          float sp = 0.006 + abs(glitch) * 0.3;
          vec4 c = texture2D(map, uv);
          float r = texture2D(map, uv + vec2(sp, 0.0)).a;
          float b = texture2D(map, uv - vec2(sp, 0.0)).a;
          vec3 col = c.rgb;
          col.r = max(col.r, r * 0.9);
          col.b = max(col.b, b * 0.9);
          float a = max(c.a, max(r, b) * 0.6) * mix(0.18, 1.0, uK);
          if (a < 0.02) discard;
          gl_FragColor = vec4(col * 1.25, a);
          #include <colorspace_fragment>
        }`,
    }),
  );
  return new THREE.Mesh(bin.add(new THREE.PlaneGeometry(8, 4)), m);
}

// ------------------------------------------------------------------ the Titiriteros' threads of light
/**
 * Threads that come down from the sky to the things they hold (ships, the door, the sea), drawn as camera-facing
 * ribbons in one draw call; they sway as if a hand above were breathing. uRise 0→1: the reins are let go and
 * go back up.
 */
export function threads(bin: Bin, anchors: THREE.Vector3[], uTime: U<number>, uRise: U<number>, uK: U<number>) {
  const pos: number[] = [];
  const top: number[] = [];
  const side: number[] = [];
  const along: number[] = [];
  const seed: number[] = [];
  anchors.forEach((a, i) => {
    // every string goes up to the same control bar, high over the edge: somebody holds them all
    const bar = (i / Math.max(1, anchors.length - 1) - 0.5) * 60;
    const b = new THREE.Vector3(i % 2 ? bar : 0, 300, -180 + (i % 2 ? 0 : bar));
    for (const [e, s] of [
      [0, -1],
      [0, 1],
      [1, -1],
      [1, -1],
      [0, 1],
      [1, 1],
    ]) {
      pos.push(a.x, a.y, a.z);
      top.push(b.x, b.y, b.z);
      side.push(s);
      along.push(e);
      seed.push(i * 1.37);
    }
  });
  const g = bin.add(new THREE.BufferGeometry());
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTop', new THREE.Float32BufferAttribute(top, 3));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { uTime, uRise, uK },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aTop; attribute float aSide; attribute float aAlong; attribute float aSeed;
        uniform float uTime; uniform float uRise; varying float vAlong; varying float vSide;
        void main(){
          vec3 a = position; vec3 b = aTop;
          a.y += uRise * 180.0;
          vec3 p = mix(a, b, aAlong);
          float sw = sin(uTime * 0.6 + aSeed) * (1.0 - aAlong) * 1.6 + sin(uTime * 1.3 + aSeed * 2.0) * 0.4 * (1.0 - aAlong);
          p.x += sw;
          vec3 axis = normalize(b - a);
          vec3 view = normalize(cameraPosition - p);
          vec3 sd = normalize(cross(axis, view));
          float wid = mix(0.06, 0.16, aAlong) * (0.8 + 0.4 * length(cameraPosition - p) / 120.0);
          p += sd * aSide * wid;
          vAlong = aAlong; vSide = aSide;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uK; varying float vAlong; varying float vSide;
        void main(){
          float core = 1.0 - abs(vSide);
          float a = (0.2 + core * 0.6) * (1.0 - smoothstep(0.35, 0.85, vAlong)) * uK;
          // a little knot of light climbing each thread
          a += smoothstep(0.02, 0.0, abs(fract(vAlong * 3.0 - uTime * 0.12) - 0.5)) * 0.6 * uK;
          gl_FragColor = vec4(vec3(1.0, 0.94, 0.72) * a, 1.0);
        }`,
    }),
  );
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 7;
  mesh.name = 'threads';
  return mesh;
}
