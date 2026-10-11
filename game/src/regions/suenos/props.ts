/**
 * Things of the Archipiélago de los Sueños: the dream islets (one per sleeper, decorated by what it dreams),
 * Duermevela's galleon sunk in a cloud, the whale with butterfly fins that snores across the sky, iridescent
 * dream bubbles, paper lanterns, the moon in a party hat and the dream vane on the plaza. All static parts
 * are merged (Mesher → one draw call per material); bubbles and lanterns are instanced.
 */
import * as THREE from 'three';
import type { Bin } from '../paginas/kit';
import { Mesher, mat, type U } from '../cielo/kit';
import { islet, type RockPalette } from '../cielo/rock';
import { elLook, h1 } from '../fronteras/kit';
import type { DreamIsle } from './layout';

const tc = new THREE.Color();

/** pastel rock for floating dream islets (lilac strata, peach soil, mint moss) */
export const DREAM_ROCK: RockPalette = { soil: '#e8c6b8', rock: ['#b7a6d8', '#cdb9e6', '#a796c8', '#d8c4ea', '#9e8cc0'], moss: '#bfe6cf', dark: '#6f5f98', root: '#d9b8e0' };

/** a lofted hull (bow toward -z) into a Mesher: U sections, a gold stripe, a dark keel */
export function hull(M: Mesher, o: { len: number; beam: number; depth: number; side: string; stripe: string; keel: string; deck?: string; m?: THREE.Matrix4; glow?: number }) {
  const secs = 10;
  const ring = 8;
  const rows: THREE.Vector3[][] = [];
  for (let i = 0; i <= secs; i++) {
    const t = i / secs;
    const z = (-0.5 + t) * o.len;
    const width = o.beam * (Math.sin(Math.min(1, t * 1.2 + 0.06) * Math.PI * 0.92) * 0.9 + 0.1);
    const depth = o.depth * (1 - Math.abs(t - 0.55) * 0.45);
    const sheer = o.depth * (0.55 + Math.pow(Math.abs(t - 0.5) * 2, 2) * 0.5);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= ring; j++) {
      const a = Math.PI + (j / ring) * Math.PI;
      row.push(new THREE.Vector3(Math.cos(a) * width, Math.sin(a) * depth + (j === 0 || j === ring ? sheer : 0), z));
    }
    rows.push(row);
  }
  const pos: number[] = [];
  const col: number[] = [];
  const glow: number[] = [];
  const cS = new THREE.Color(o.side);
  const cT = new THREE.Color(o.stripe);
  const cK = new THREE.Color(o.keel);
  const m = o.m;
  const push = (v: THREE.Vector3) => {
    const p = m ? v.clone().applyMatrix4(m) : v;
    pos.push(p.x, p.y, p.z);
    const c = v.y > o.depth * 0.25 && v.y < o.depth * 0.5 ? cT : v.y < -o.depth * 0.45 ? cK : cS;
    col.push(c.r, c.g, c.b);
    glow.push(o.glow ?? 0);
  };
  for (let i = 0; i < secs; i++)
    for (let j = 0; j < ring; j++) {
      const a = rows[i][j];
      const b = rows[i + 1][j];
      const c = rows[i][j + 1];
      const d = rows[i + 1][j + 1];
      for (const v of [a, b, c, c, b, d]) push(v);
    }
  // deck
  const deck = new THREE.Color(o.deck ?? '#d8b48a');
  for (let i = 0; i < secs; i++) {
    const a = rows[i][0];
    const b = rows[i][ring];
    const c = rows[i + 1][0];
    const d = rows[i + 1][ring];
    const y = o.depth * 0.45;
    for (const v of [a, c, b, b, c, d]) {
      const p = new THREE.Vector3(v.x * 0.96, y, v.z);
      const q = m ? p.applyMatrix4(m) : p;
      pos.push(q.x, q.y, q.z);
      col.push(deck.r, deck.g, deck.b);
      glow.push(0);
    }
  }
  M.tris(pos, col, undefined, glow);
}

/** the decorations a dream paints on its islet (local space, top ≈ y 0.3) */
function decor(M: Mesher, el: string, r: number, rng: () => number) {
  const L = elLook(el);
  const ring = (k: number) => {
    const a = rng() * Math.PI * 2;
    const d = r * (0.38 + rng() * 0.3) * k;
    return [Math.cos(a) * d, Math.sin(a) * d] as const;
  };
  const glowPts: THREE.Vector3[] = [];
  switch (el) {
    case 'fire': {
      // a candy volcano that smokes cotton candy
      const g = new THREE.ConeGeometry(2.2, 3.2, 9, 3, true);
      M.add(g, (v, out) => out.set(v.y > 0.9 ? L.glow : v.y > 0 ? L.main : L.dark), mat(r * 0.45, 1.8, -r * 0.2), 0, 0.15);
      M.add(new THREE.CircleGeometry(0.9, 9), L.light, mat(r * 0.45, 3.35, -r * 0.2, -Math.PI / 2), 0, 1);
      glowPts.push(new THREE.Vector3(r * 0.45, 3.6, -r * 0.2));
      for (let i = 0; i < 4; i++) {
        const [x, z] = ring(1);
        M.add(new THREE.SphereGeometry(0.35, 6, 4), L.light, mat(x, 0.6, z), 0, 0.9);
        M.add(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 4), '#7a5a4a', mat(x, 0.25, z));
      }
      break;
    }
    case 'water': {
      // a ball of sea that floats over the islet, a pond and fish-stones
      M.add(new THREE.SphereGeometry(1.8, 14, 10), (v, out) => out.set(L.main).lerp(tc.set(L.light), THREE.MathUtils.smoothstep(v.y, -1.8, 1.8) * 0.7), mat(-r * 0.3, 4.4, -r * 0.25), 0, 0.35);
      M.add(new THREE.CircleGeometry(r * 0.32, 14), L.main, mat(r * 0.3, 0.32, r * 0.1, -Math.PI / 2), 0, 0.2);
      glowPts.push(new THREE.Vector3(-r * 0.3, 4.4, -r * 0.25));
      break;
    }
    case 'nature': {
      // giant flowers and a mushroom you could nap under
      for (let i = 0; i < 4; i++) {
        const [x, z] = ring(1);
        const hgt = 2 + rng() * 2.2;
        M.add(new THREE.CylinderGeometry(0.1, 0.14, hgt, 5), '#5f9e5a', mat(x, hgt / 2, z), 0.3);
        const petal = ['#ff9ac0', '#ffd26a', '#c8a8ff', '#ffffff'][i % 4];
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2;
          M.add(new THREE.SphereGeometry(0.42, 6, 4).scale(1, 0.35, 0.7), petal, mat(x + Math.cos(a) * 0.45, hgt, z + Math.sin(a) * 0.45, 0, -a, 0), 0.3, 0.2);
        }
        M.add(new THREE.SphereGeometry(0.28, 6, 4), '#ffe08a', mat(x, hgt + 0.05, z), 0.3, 0.6);
      }
      M.add(new THREE.CylinderGeometry(0.35, 0.5, 1.6, 7), '#f4ead8', mat(-r * 0.4, 0.8, r * 0.2));
      M.add(new THREE.SphereGeometry(1.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), (v, out) => out.set(h1(Math.floor(v.x * 3) + Math.floor(v.z * 3) * 7) > 0.8 ? '#ffffff' : '#e8566a'), mat(-r * 0.4, 1.5, r * 0.2), 0, 0.15);
      break;
    }
    case 'ice': {
      for (let i = 0; i < 5; i++) {
        const [x, z] = ring(1);
        const s = 0.6 + rng() * 1.3;
        M.add(new THREE.OctahedronGeometry(s, 0).scale(0.6, 1.8, 0.6), L.light, mat(x, s * 1.2, z, (rng() - 0.5) * 0.4, rng() * 3, (rng() - 0.5) * 0.4), 0, 0.45);
      }
      M.add(new THREE.SphereGeometry(r * 0.75, 16, 6, 0, Math.PI * 2, 0, 0.5), '#ffffff', mat(0, -r * 0.62, 0));
      break;
    }
    case 'storm': {
      // its own little rain cloud, always raining on it
      for (let i = 0; i < 5; i++) M.add(new THREE.IcosahedronGeometry(1.2 + rng() * 0.7, 1), '#b8b8d8', mat((rng() - 0.5) * 3.4, 6.5 + rng() * 0.8, (rng() - 0.5) * 2.2), 0.25);
      glowPts.push(new THREE.Vector3(0, 6.2, 0));
      for (let i = 0; i < 3; i++) {
        const [x, z] = ring(1);
        M.add(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 5), '#6a6a90', mat(x, 1.3, z));
        M.add(new THREE.SphereGeometry(0.32, 6, 4), L.main, mat(x, 2.7, z), 0, 1);
      }
      break;
    }
    case 'magic': {
      // a stack of books and a few that float
      for (let i = 0; i < 6; i++) {
        const c = ['#c27aff', '#ff7ab8', '#7fd0ff', '#ffd26a'][i % 4];
        M.add(new THREE.BoxGeometry(1.4, 0.32, 1), c, mat(r * 0.3, 0.45 + i * 0.34, -r * 0.1, 0, rng() * 0.6, 0));
      }
      for (let i = 0; i < 4; i++) M.add(new THREE.BoxGeometry(1.1, 0.22, 0.8), ['#f0d2ff', '#ffd0e6'][i % 2], mat(Math.cos(i * 1.6) * r * 0.55, 3 + i * 0.6, Math.sin(i * 1.6) * r * 0.55, 0.3, i, 0.2), 0.4, 0.5);
      M.add(new THREE.TorusGeometry(r * 0.55, 0.06, 4, 32), L.glow, mat(0, 0.36, 0, Math.PI / 2), 0, 1);
      break;
    }
    case 'cosmic':
    case 'void':
    case 'gravity': {
      // tiny planets in orbit, a ring of stones that hang
      const n = el === 'void' ? 3 : 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rng();
        M.add(new THREE.IcosahedronGeometry(0.5 + rng() * 0.6, 1), ['#ff9ad0', '#9fe3ff', '#ffd26a', '#b8a2ff'][i % 4], mat(Math.cos(a) * r * 0.62, 2.6 + rng() * 2.4, Math.sin(a) * r * 0.62), 0.3, 0.5);
      }
      if (el === 'void') M.add(new THREE.CircleGeometry(r * 0.3, 18), '#06040c', mat(r * 0.25, 0.34, r * 0.1, -Math.PI / 2));
      M.add(new THREE.TorusGeometry(r * 0.3, 0.05, 4, 24), L.glow, mat(r * 0.25, 0.37, r * 0.1, Math.PI / 2), 0, 1);
      break;
    }
    case 'sound': {
      for (let i = 0; i < 3; i++) {
        const [x, z] = ring(1);
        M.add(new THREE.CylinderGeometry(0.9, 0.12, 1.6, 10, 1, true), L.main, mat(x, 1.4, z, 0.9, rng() * 6, 0), 0, 0.2);
        M.add(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 4), '#6a4a5a', mat(x, 0.6, z));
      }
      break;
    }
    case 'time': {
      // an hourglass taller than the sleeper, sand running up
      M.add(new THREE.ConeGeometry(1.1, 1.6, 10), L.light, mat(r * 0.35, 1.2, -r * 0.2, Math.PI), 0, 0.3);
      M.add(new THREE.ConeGeometry(1.1, 1.6, 10), L.light, mat(r * 0.35, 2.8, -r * 0.2), 0, 0.3);
      for (const y of [0.35, 3.65]) M.add(new THREE.CylinderGeometry(1.3, 1.3, 0.2, 10), '#8a6a3a', mat(r * 0.35, y, -r * 0.2));
      for (let i = 0; i < 3; i++) M.add(new THREE.TorusGeometry(0.6 + i * 0.25, 0.08, 4, 12), L.main, mat(-r * 0.4, 2.5 + i * 0.9, r * 0.1, rng(), rng(), 0), 0.3, 0.4);
      break;
    }
    case 'light':
    case 'crystal': {
      for (let i = 0; i < 4; i++) {
        const [x, z] = ring(1);
        const s = 0.7 + rng();
        M.add(new THREE.OctahedronGeometry(s, 0).scale(0.55, 1.6, 0.55), i % 2 ? L.glow : L.light, mat(x, s * 1.1, z, 0, rng() * 3, (rng() - 0.5) * 0.4), 0, 0.7);
      }
      break;
    }
    case 'shadow': {
      // a shadow lying the wrong way, and a lamp that lights nothing
      M.add(new THREE.CircleGeometry(r * 0.4, 12).scale(1.8, 1, 1), '#2a2440', mat(-r * 0.2, 0.33, r * 0.35, -Math.PI / 2, 0, 0.6));
      M.add(new THREE.CylinderGeometry(0.1, 0.1, 3, 5), '#3a3450', mat(r * 0.4, 1.5, -r * 0.2));
      M.add(new THREE.SphereGeometry(0.4, 8, 6), '#8a7ac8', mat(r * 0.4, 3.1, -r * 0.2), 0, 0.6);
      break;
    }
    default: {
      // earth: stones balanced on each other, the way a sleeping cat stacks them
      for (let k = 0; k < 2; k++) {
        const [x, z] = ring(1);
        let y = 0.3;
        for (let i = 0; i < 4; i++) {
          const s = 0.9 - i * 0.16;
          M.add(new THREE.DodecahedronGeometry(s, 0).scale(1, 0.6, 1), i % 2 ? L.main : L.light, mat(x + (rng() - 0.5) * 0.2, y + s * 0.5, z, 0, rng() * 3, 0));
          y += s * 1.05;
        }
      }
    }
  }
  return glowPts;
}

export interface BuiltIslet {
  isle: DreamIsle;
  group: THREE.Group;
  /** where the sleeper lies (local) */
  bed: THREE.Vector3;
  glow: THREE.Vector3[];
}

/** one dream islet: cap + underside (pastel), a pillow for the sleeper, the dream's decor, a pillow-cloud skirt */
export function dreamIslet(M: Mesher, isle: DreamIsle, rng: () => number): { bed: THREE.Vector3; glow: THREE.Vector3[] } {
  const L = elLook(isle.el);
  const grass = isle.who ? [L.light, '#bfe6cf', '#e8d4f0'] : ['#eef0fb', '#e6e2f6', '#f4ecf6'];
  const pal: RockPalette = { ...DREAM_ROCK, moss: isle.who ? L.light : '#eef0fb', root: isle.who ? L.main : '#d9b8e0' };
  islet(M, rng, { r: isle.r, seed: isle.seed, pal, grass, deep: 1.1, trees: isle.el === 'nature' ? 2 : 1, tree: { canopy: [L.light, '#ffd0e6', '#c9b9e8'], trunk: '#a08aa8', glow: 0.35 }, roots: 7, rocks: 3 });
  // the pillow the sleeper dreams on (striped, a little squashed)
  const bed = new THREE.Vector3(-isle.r * 0.12, 0.35, isle.r * 0.18);
  if (isle.who) {
    M.add(new THREE.SphereGeometry(1, 14, 8).scale(1.9, 0.45, 1.3), (v, out) => out.set(Math.floor((v.x + 2) * 2.2) % 2 ? '#fff6ee' : L.light), mat(bed.x, bed.y + 0.3, bed.z));
    bed.y += 0.62;
  }
  const glow = isle.who ? decor(M, isle.el, isle.r, rng) : [];
  return { bed, glow };
}

// ------------------------------------------------------------------ Duermevela's galleon
/** a galleon that only exists while somebody dreams it: nightcap sails, a crescent figurehead, a lantern */
export function galleon(M: Mesher) {
  hull(M, { len: 13, beam: 3.2, depth: 2.4, side: '#8e7cc8', stripe: '#ffd27a', keel: '#4a3c78' });
  // masts + sails (striped like a nightcap), a pompom on each
  const masts = [
    { z: -3, h: 10 },
    { z: 1.5, h: 12 },
    { z: 5, h: 8 },
  ];
  for (const m of masts) {
    M.add(new THREE.CylinderGeometry(0.16, 0.22, m.h, 6), '#6a5a8a', mat(0, 1 + m.h / 2, m.z));
    // two square sails per mast, striped like a nightcap, bellied a little toward the bow
    for (let k = 0; k < 2; k++) {
      const sh = m.h * (k ? 0.26 : 0.32);
      const sw = 4.6 - k * 1.1;
      const sail = new THREE.PlaneGeometry(sw, sh, 6, 3);
      const p = sail.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) p.setZ(i, -Math.cos((p.getX(i) / sw) * Math.PI) * 0.45);
      M.add(sail, (v, out) => out.set(Math.floor((v.y + 20) * 1.3) % 2 ? '#f6e8ff' : '#b8a2ff'), mat(0, 1 + m.h * (k ? 0.82 : 0.5), m.z - 0.25));
    }
    M.add(new THREE.ConeGeometry(0.45, 1.3, 8), '#b8a2ff', mat(0, 1.6 + m.h, m.z));
    M.add(new THREE.SphereGeometry(0.28, 8, 6), '#ffffff', mat(0, 2.3 + m.h, m.z), 0, 0.4);
  }
  // crescent moon figurehead
  const cres = new THREE.TorusGeometry(1.1, 0.28, 6, 16, Math.PI * 1.3);
  M.add(cres, '#ffe9a8', mat(0, 2.6, -7.6, 0, Math.PI / 2, 0.4), 0, 0.7);
  // stern lantern
  M.add(new THREE.SphereGeometry(0.45, 8, 6), '#ffd27a', mat(0, 3.6, 6.4), 0, 1);
  return { lantern: new THREE.Vector3(0, 3.6, 6.4) };
}

// ------------------------------------------------------------------ the whale that snores across the sky
export function whale(bin: Bin, uNight: U<number>) {
  const g = new THREE.Group();
  const M = new Mesher(false);
  // body: a lathe of a fat drop, lilac back, cream belly with grooves
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    prof.push(new THREE.Vector2(Math.sin(t * Math.PI) * (1 - t * 0.55) * 3.2 + 0.05, (t - 0.5) * 16));
  }
  const body = new THREE.LatheGeometry(prof, 14);
  body.rotateX(Math.PI / 2);
  M.add(body, (v, out) => out.set(v.y < -0.6 ? (Math.floor(v.x * 2.5) % 2 ? '#f7ecdf' : '#eadbcc') : '#a9a6e8').lerp(tc.set('#c8b6f2'), THREE.MathUtils.smoothstep(v.y, 0, 3) * 0.4));
  // tail flukes
  for (const s of [-1, 1]) M.add(new THREE.SphereGeometry(1.5, 8, 4).scale(2.1, 0.22, 1), '#9a96e0', mat(s * 2.1, 0.3, 8.6, 0, s * 0.5, 0));
  // eyes (closed: two little arcs), cheeks
  for (const s of [-1, 1]) {
    M.add(new THREE.TorusGeometry(0.45, 0.07, 4, 8, Math.PI), '#3a2c5a', mat(s * 2.4, 0.4, -4.8, Math.PI, s * 0.7, 0));
    M.add(new THREE.SphereGeometry(0.4, 8, 6).scale(1, 0.6, 1), '#ffb4c8', mat(s * 2.5, -0.5, -4.2));
  }
  const bodyMesh = new THREE.Mesh(bin.add(M.build()), bin.add(new THREE.MeshToonMaterial({ vertexColors: true })));
  g.add(bodyMesh);
  // butterfly fins: two big wings per side, painted in the shader, flapping slowly
  const wingU = { uTime: { value: 0 }, uNight };
  const wingMat = bin.add(
    new THREE.ShaderMaterial({
      uniforms: wingU,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uNight; varying vec2 vUv;
        void main(){
          vec2 p = vUv - vec2(0.0, 0.5);
          // two lobes (upper and lower wing), soft edged
          float up = length((p - vec2(0.42, 0.16)) * vec2(1.0, 1.25));
          float lo = length((p - vec2(0.3, -0.2)) * vec2(1.3, 1.5));
          float d = min(up - 0.4, lo - 0.27);
          if (d > 0.0) discard;
          vec3 c = mix(vec3(1.0, 0.78, 0.86), vec3(0.72, 0.62, 1.0), smoothstep(0.0, 0.9, vUv.x));
          c = mix(c, vec3(1.0, 0.95, 0.75), smoothstep(-0.05, -0.0, d) * 0.6);
          float spot = smoothstep(0.08, 0.05, length(p - vec2(0.55, 0.22))) + smoothstep(0.06, 0.04, length(p - vec2(0.35, -0.22)));
          c = mix(c, vec3(0.42, 0.32, 0.8), spot);
          c *= 1.0 - smoothstep(-0.03, 0.0, d) * 0.35;
          c += vec3(0.25, 0.2, 0.4) * uNight * (0.5 + 0.5 * sin(uTime * 2.0 + vUv.x * 6.0));
          gl_FragColor = vec4(c, 0.92);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const wingGeo = bin.add(new THREE.PlaneGeometry(9, 9));
  wingGeo.translate(4.5, 0, 0);
  wingGeo.rotateX(-Math.PI / 2);
  const wings: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.set(s * 2.2, 0.8, -1);
    const wm = new THREE.Mesh(wingGeo, wingMat);
    wm.scale.x = s;
    piv.add(wm);
    g.add(piv);
    wings.push(wm);
  }
  return {
    group: g,
    blowhole: new THREE.Vector3(0, 3.2, -2.5),
    update(t: number) {
      wingU.uTime.value = t;
      const flap = Math.sin(t * 1.1) * 0.5 + 0.15;
      wings[0].parent!.rotation.z = -flap;
      wings[1].parent!.rotation.z = flap;
      bodyMesh.rotation.z = Math.sin(t * 0.55) * 0.06;
    },
  };
}

// ------------------------------------------------------------------ dream bubbles (instanced, iridescent)
export interface Bubble {
  p: THREE.Vector3;
  v: THREE.Vector3;
  r: number;
  life: number;
  t: number;
  color: THREE.Color;
}
export class Bubbles {
  readonly mesh: THREE.InstancedMesh;
  readonly list: Bubble[] = [];
  private o = new THREE.Object3D();
  private u = { uTime: { value: 0 } };
  constructor(
    bin: Bin,
    readonly max = 90,
  ) {
    const m = bin.add(
      new THREE.ShaderMaterial({
        uniforms: this.u,
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV; varying vec3 vC;
          void main(){
            vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
            vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
            vV = normalize(cameraPosition - wp.xyz);
            vC = vec3(1.0);
            #ifdef USE_INSTANCING_COLOR
              vC = instanceColor;
            #endif
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec3 vC;
          void main(){
            float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
            vec3 irid = 0.5 + 0.5 * cos(6.2831 * (f * 1.4 + uTime * 0.05 + vec3(0.0, 0.33, 0.67)));
            vec3 c = mix(vC, irid, 0.45) + pow(f, 6.0) * 0.6;
            float a = 0.08 + pow(f, 2.2) * 0.75;
            // a little window highlight
            float hl = smoothstep(0.93, 0.98, dot(normalize(vN), normalize(vec3(-0.5, 0.7, 0.5))));
            gl_FragColor = vec4(c + hl, clamp(a + hl * 0.8, 0.0, 1.0));
            #include <colorspace_fragment>
          }`,
      }),
    );
    this.mesh = new THREE.InstancedMesh(bin.add(new THREE.SphereGeometry(1, 16, 10)), m, max);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
  }
  spawn(p: THREE.Vector3Like, o: { r?: number; up?: number; life?: number; color?: THREE.ColorRepresentation; drift?: number } = {}) {
    if (this.list.length >= this.max) this.list.shift();
    const d = o.drift ?? 0.4;
    this.list.push({ p: new THREE.Vector3(p.x, p.y, p.z), v: new THREE.Vector3((Math.random() - 0.5) * d, o.up ?? 0.8, (Math.random() - 0.5) * d), r: o.r ?? 0.5, life: o.life ?? 8, t: 0, color: new THREE.Color(o.color ?? '#ffffff') });
  }
  update(dt: number, t: number) {
    this.u.uTime.value = t;
    let n = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      b.t += dt;
      if (b.t > b.life) {
        this.list.splice(i, 1);
        continue;
      }
      b.p.addScaledVector(b.v, dt);
      b.p.x += Math.sin(t * 0.9 + i) * dt * 0.3;
    }
    for (const b of this.list) {
      const k = b.t / b.life;
      // grow in, wobble, pop at the end
      const s = b.r * Math.min(1, b.t * 2) * (1 + Math.sin(b.t * 3 + b.r * 9) * 0.04) * (k > 0.96 ? 1 + (k - 0.96) * 12 : 1);
      this.o.position.copy(b.p);
      this.o.scale.set(s, s * (1 + Math.sin(b.t * 2.3) * 0.05), s);
      this.o.updateMatrix();
      this.mesh.setMatrixAt(n, this.o.matrix);
      this.mesh.setColorAt(n, b.color);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

// ------------------------------------------------------------------ paper lanterns drifting up between the islets
export function lanterns(bin: Bin, n: number, rng: () => number, uNight: U<number>) {
  const u = { uNight, uTime: { value: 0 } };
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: /* glsl */ `
        varying float vY; varying vec3 vC;
        void main(){
          vY = position.y;
          vC = vec3(1.0, 0.8, 0.55);
          #ifdef USE_INSTANCING_COLOR
            vC = instanceColor;
          #endif
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uNight; varying float vY; varying vec3 vC;
        void main(){
          float band = step(0.42, abs(vY)) ;
          vec3 c = mix(vC, vC * 0.45, band);
          c *= 0.75 + uNight * 0.9;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const geo = bin.add(new THREE.CylinderGeometry(0.5, 0.42, 1, 8));
  const mesh = new THREE.InstancedMesh(geo, m, n);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  mesh.frustumCulled = false;
  const items = Array.from({ length: n }, (_, i) => {
    const a = rng() * Math.PI * 2;
    const d = 18 + rng() * 60;
    return { x: Math.cos(a) * d, z: Math.sin(a) * d - 6, y0: 4 + rng() * 26, ph: rng() * 10, sp: 0.25 + rng() * 0.35, col: new THREE.Color(['#ffd28a', '#ffb4c8', '#c8b6ff', '#a8f0d8'][i % 4]) };
  });
  const o = new THREE.Object3D();
  const pts = items.map(() => new THREE.Vector3());
  items.forEach((it, i) => mesh.setColorAt(i, it.col));
  return {
    mesh,
    pts,
    items,
    update(t: number) {
      u.uTime.value = t;
      items.forEach((it, i) => {
        // they rise slowly and wrap around (a lantern that leaves comes back from below, nobody notices)
        const y = it.y0 + ((t * it.sp + it.ph * 3) % 34);
        o.position.set(it.x + Math.sin(t * 0.3 + it.ph) * 2, y, it.z + Math.cos(t * 0.25 + it.ph) * 2);
        o.rotation.set(Math.sin(t + it.ph) * 0.1, t * 0.2 + it.ph, 0);
        o.scale.setScalar(Math.min(1, (34 - ((t * it.sp + it.ph * 3) % 34)) / 3) * 1.1);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        pts[i].copy(o.position);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------------------ the moon in a party hat (the gag of concept 15)
export function partyMoon(M: Mesher) {
  // a fat crescent (a torus arc, squashed) facing the island
  M.add(new THREE.TorusGeometry(26, 9, 10, 28, Math.PI * 1.25), (v, out) => out.set('#fff3c4').lerp(tc.set('#ffd98a'), THREE.MathUtils.smoothstep(v.z, -9, 9) * 0.5), mat(0, 0, 0, 0, 0, 0.9, 1, 1, 0.45), 0, 0.9);
  // the party hat on its upper tip (striped cone + pompom), a little crooked
  M.add(new THREE.ConeGeometry(7, 18, 12), (v, out) => out.set(Math.floor((v.y + 20) / 3) % 2 ? '#ff7ab8' : '#7fd0ff'), mat(-14, 30, 0, 0, 0, 0.5), 0, 0.6);
  M.add(new THREE.SphereGeometry(3, 10, 8), '#ffe08a', mat(-18.5, 38.5, 0), 0, 1);
  // a sleepy closed eye and a blush
  M.add(new THREE.TorusGeometry(3.2, 0.7, 4, 10, Math.PI), '#7a5a3a', mat(-24, -2, 5, Math.PI, 0, 0.5), 0, 0.2);
  M.add(new THREE.SphereGeometry(2.6, 10, 6).scale(1, 0.6, 0.4), '#ffb4b4', mat(-21, -9, 5), 0, 0.5);
}

// ------------------------------------------------------------------ the dream vane (plaza)
/** a big pillow on a post with a cat-shaped weather vane that points at the strongest dream */
export function vane(M: Mesher) {
  M.add(new THREE.CylinderGeometry(0.22, 0.32, 6.5, 8), '#8a78b8', mat(0, 3.25, 0));
  M.add(new THREE.SphereGeometry(1, 14, 8).scale(2.6, 0.9, 1.8), (v, out) => out.set(Math.floor((v.x + 3) * 1.6) % 2 ? '#fff4ee' : '#c9b9e8'), mat(0, 0.8, 0));
  for (const [x, z] of [
    [-2.4, -1.5],
    [2.4, -1.5],
    [-2.4, 1.5],
    [2.4, 1.5],
  ])
    M.add(new THREE.SphereGeometry(0.4, 6, 4), '#c9b9e8', mat(x, 0.9, z));
}
/** the vane's rotating arrow (separate, it turns): a cat that points with its tail */
export function vaneArrow(M: Mesher) {
  M.add(new THREE.BoxGeometry(0.18, 0.18, 4.6), '#ffd27a', mat(0, 0, 0.2), 0, 0.5);
  M.add(new THREE.ConeGeometry(0.55, 1.2, 4), '#ffd27a', mat(0, 0, -2.4, -Math.PI / 2), 0, 0.5);
  // a sitting cat silhouette on the vane (ears!)
  M.add(new THREE.BoxGeometry(0.16, 1.4, 1.1), '#3a2c5a', mat(0, 0.75, 1.4));
  M.add(new THREE.BoxGeometry(0.16, 0.8, 0.8), '#3a2c5a', mat(0, 1.75, 1.2));
  for (const s of [-1, 1]) M.add(new THREE.ConeGeometry(0.2, 0.45, 3), '#3a2c5a', mat(0, 2.3, 1.2 + s * 0.25));
  M.add(new THREE.TorusGeometry(0.5, 0.08, 4, 10, Math.PI), '#3a2c5a', mat(0, 0.4, 2.2, 0, Math.PI / 2, 0));
}
