/**
 * Built pieces of the home island for the Rupturas vertical slice: Luzterna's lighthouse (now lit —
 * the Parte I ending promised it), the dock, three living habitats (Fuego, Hielo, Cósmico) and the
 * player's ship. Low-poly toon geometry generated in code; every piece exposes `update()` and the
 * local lights it contributes so paper cats are lit by lava, lanterns and the beam.
 */
import * as THREE from 'three';
import { toonGradient } from '../engine/world/heightfield';
import type { LocalLight } from '../engine/world/paperCat';
import type { ParticlePool } from '../engine/fx/particles';
import { GLSL_NOISE } from '../engine/world/ocean';
import { PADS, POI } from './island';

const toon = (color: THREE.ColorRepresentation, extra: THREE.MeshToonMaterialParameters = {}) =>
  new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...extra });

function shade<T extends THREE.Object3D>(o: T, cast = true): T {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = cast;
      c.receiveShadow = true;
    }
  });
  return o;
}

export interface Prop {
  group: THREE.Group;
  lights: LocalLight[];
  update(dt: number, t: number, night: number): void;
}

// ───────────────────────────────── lighthouse ─────────────────────────────────
export function lighthouse(): Prop & { beamPivot: THREE.Object3D; gallery: THREE.Vector3 } {
  const g = new THREE.Group();
  const p = PADS.lighthouse;
  g.position.set(p.x, p.h, p.z);
  // tapered tower with red/white bands (vertex colors by height)
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const y = (i / 12) * 11;
    prof.push(new THREE.Vector2(2.2 - (i / 12) * 0.9, y));
  }
  const tower = new THREE.LatheGeometry(prof, 18);
  const tp = tower.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(tp.count * 3);
  for (let i = 0; i < tp.count; i++) {
    const red = Math.floor(tp.getY(i) / 2.2) % 2 === 1;
    col.set(red ? [0.86, 0.24, 0.26] : [0.97, 0.94, 0.88], i * 3);
  }
  tower.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.add(new THREE.Mesh(tower, toon('#ffffff', { vertexColors: true })));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.3, 1.2, 18), toon('#9a8f86'));
  base.position.y = 0.4;
  g.add(base);
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.25, 20), toon('#3b3550'));
  gallery.position.y = 11.1;
  const rail = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.05, 4, 24), toon('#3b3550'));
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 11.7;
  const lampMat = new THREE.MeshBasicMaterial({ color: '#fff3c4' });
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.4, 12), lampMat);
  lamp.position.y = 12.0;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.4, 12), toon('#c23b44'));
  cap.position.y = 13.4;
  g.add(gallery, rail, lamp, cap);
  // the beam: two additive cones that sweep the sea at night, tilted down so they graze the water.
  // Brightness lives near the lamp and fades out; edges fade by view angle (no hard cone outline).
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uI: { value: 0 }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying float vEdge; void main(){ vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix * normal);
      vEdge = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform float uI; uniform float uTime; varying vec2 vUv; varying float vEdge; ${GLSL_NOISE}
      void main(){ float along = vUv.y; // 1 at the lamp, 0 at the far end
        float a = mix(0.06, 1.0, pow(along, 2.2)) * (0.7 + 0.3*vn(vec2(vUv.x*8.0, along*5.0 - uTime*0.5)));
        a *= smoothstep(0.05, 0.6, vEdge);
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.7) * a * uI * 0.75, 1.0); }`,
  });
  const beamPivot = new THREE.Object3D();
  beamPivot.position.y = 12.0;
  for (const dir of [1, -1]) {
    const arm = new THREE.Object3D();
    arm.rotation.y = dir > 0 ? 0 : Math.PI;
    arm.rotation.z = -0.1; // aim slightly down toward the sea
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 7, 60, 24, 1, true), beamMat);
    cone.rotation.z = Math.PI / 2;
    cone.position.x = 30;
    cone.renderOrder = 7;
    arm.add(cone);
    beamPivot.add(arm);
  }
  g.add(beamPivot);
  const light: LocalLight = { pos: new THREE.Vector3(p.x, p.h + 12, p.z), color: new THREE.Color('#ffe7a8'), range: 16, intensity: 0 };
  const glow = new THREE.PointLight('#ffe2a0', 0, 30, 1.6);
  glow.position.y = 12;
  g.add(glow);
  shade(g);
  beamPivot.traverse((c) => (c.castShadow = false));
  lamp.castShadow = false;
  return {
    group: g,
    beamPivot,
    gallery: new THREE.Vector3(p.x + 1.45, p.h + 11.25, p.z + 0.9),
    lights: [light],
    update(dt, t, night) {
      beamPivot.rotation.y += dt * 0.55;
      beamMat.uniforms.uI.value = night;
      beamMat.uniforms.uTime.value = t;
      lampMat.color.setRGB(1, 0.95, 0.78).multiplyScalar(0.75 + night * 0.6);
      glow.intensity = night * 30;
      light.intensity = 0.25 + night * 1.1;
    },
  };
}

// ───────────────────────────────── dock ─────────────────────────────────
export function dock(): Prop {
  const g = new THREE.Group();
  const wood = toon('#9a6b45');
  const dark = toon('#5c3b26');
  const a = PADS.dock;
  const b = POI.dockEnd;
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, len), wood);
  deck.position.set((a.x + b.x) / 2, 0.85, (a.z + b.z) / 2);
  g.add(deck);
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 3, 6), dark);
      post.position.set(a.x + (b.x - a.x) * t + s * 1.1, -0.6, a.z + (b.z - a.z) * t);
      g.add(post);
    }
  }
  const lanternLight: LocalLight = { pos: new THREE.Vector3(b.x + 1, 2.4, b.z), color: new THREE.Color('#ffb35c'), range: 7, intensity: 0 };
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 5), dark);
  pole.position.set(b.x + 1, 1.8, b.z);
  const lanternMat = new THREE.MeshBasicMaterial({ color: '#ffcf7a' });
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), lanternMat);
  lantern.position.set(b.x + 1, 2.7, b.z);
  g.add(pole, lantern);
  shade(g);
  return {
    group: g,
    lights: [lanternLight],
    update(_dt, t, night) {
      lanternLight.intensity = night * (0.9 + 0.1 * Math.sin(t * 7));
      lanternMat.color.setRGB(1, 0.8, 0.45).multiplyScalar(0.6 + night * 0.7);
    },
  };
}

// ───────────────────────────────── habitats ─────────────────────────────────
function ringOfRocks(r: number, n: number, color: string, scale = 0.6) {
  const m = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), toon(color), n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    o.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
    o.rotation.set(i, i * 2.3, 0);
    o.scale.set(scale * (0.8 + (i % 3) * 0.25), scale * (0.6 + (i % 2) * 0.3), scale);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
  }
  return m;
}

/** Fuego: lava pool with flowing crust, a smoking cone, embers and a flickering heat light */
export function fireHabitat(fx: ParticlePool, smoke: ParticlePool): Prop & { spot: THREE.Vector3 } {
  const p = PADS.fire;
  const g = new THREE.Group();
  g.position.set(p.x, p.h, p.z);
  const lavaMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `uniform float uTime; varying vec2 vP; ${GLSL_NOISE}
      void main(){ vec2 q = vP*0.9; float n = vn(q + vec2(uTime*0.15, uTime*0.08)) * 0.6 + vn(q*2.3 - uTime*0.2) * 0.4;
        float crust = smoothstep(0.42, 0.5, n);
        float vein = smoothstep(0.08, 0.0, abs(n - 0.44));
        vec3 hot = mix(vec3(0.75,0.08,0.02), vec3(1.0,0.42,0.06), smoothstep(0.15,0.42,n));
        vec3 c = mix(hot, vec3(0.13,0.05,0.05), crust) + vec3(1.0,0.75,0.25) * vein * 0.9;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), lavaMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.12;
  g.add(pool, ringOfRocks(3.4, 16, '#4a3a3a', 0.7));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.6, 9, 1, true), toon('#5a3d36', { side: THREE.DoubleSide }));
  cone.position.set(-3.2, 1.6, -3.0);
  const crater = new THREE.Mesh(new THREE.CircleGeometry(0.75, 12), new THREE.MeshBasicMaterial({ color: '#ff7a2a' }));
  crater.rotation.x = -Math.PI / 2;
  crater.position.set(-3.2, 3.15, -3.0);
  g.add(cone, crater);
  shade(g);
  pool.receiveShadow = false;
  const light: LocalLight = { pos: new THREE.Vector3(p.x, p.h + 1.2, p.z), color: new THREE.Color('#ff7a33'), range: 9, intensity: 1 };
  const pl = new THREE.PointLight('#ff6a2a', 12, 14, 1.8);
  pl.position.set(0, 1.4, 0);
  g.add(pl);
  let emitT = 0;
  let smokeT = 0;
  const world = new THREE.Vector3(p.x, p.h, p.z);
  return {
    group: g,
    lights: [light],
    spot: new THREE.Vector3(p.x + 3.6, p.h, p.z + 2.2),
    update(dt, t, night) {
      lavaMat.uniforms.uTime.value = t;
      const flick = 0.85 + 0.15 * Math.sin(t * 9.3) * Math.sin(t * 5.1 + 1);
      light.intensity = (0.7 + night * 0.9) * flick;
      pl.intensity = (6 + night * 16) * flick;
      emitT -= dt;
      if (emitT <= 0) {
        emitT = 0.05;
        fx.emit({ pos: { x: world.x, y: world.y + 0.3, z: world.z }, spread: { x: 2.6, y: 0.1, z: 2.6 }, vel: { x: 0, y: 1.6, z: 0 }, velJitter: { x: 0.4, y: 0.8, z: 0.4 }, life: 2.2, size: 0.16, color: '#ffd27a', color2: '#ff3d1a', count: 2 });
      }
      smokeT -= dt;
      if (smokeT <= 0) {
        smokeT = 0.35;
        smoke.emit({ pos: { x: world.x - 3.2, y: world.y + 3.3, z: world.z - 3 }, spread: { x: 0.3, y: 0.1, z: 0.3 }, vel: { x: 0.35, y: 1.1, z: 0 }, velJitter: { x: 0.2, y: 0.2, z: 0.2 }, life: 4, size: 1.6, color: '#6b5a58', color2: '#2e2a33', count: 1 });
      }
    },
  };
}

/** Hielo: snow pad, glassy crystals, an igloo, falling snow; steams when a fire cat visits */
export function iceHabitat(snow: ParticlePool): Prop & { spot: THREE.Vector3; center: THREE.Vector3 } {
  const p = PADS.ice;
  const g = new THREE.Group();
  g.position.set(p.x, p.h, p.z);
  // snow: a soft mound instead of a flat disc
  const padGeo = new THREE.CircleGeometry(4.8, 40, 0, Math.PI * 2);
  const pp = padGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pp.count; i++) {
    const r = Math.hypot(pp.getX(i), pp.getY(i)) / 4.8;
    pp.setZ(i, (1 - r * r) * 0.35 + Math.sin(pp.getX(i) * 2.1) * Math.cos(pp.getY(i) * 1.7) * 0.06 * (1 - r));
  }
  padGeo.computeVertexNormals();
  const pad = new THREE.Mesh(padGeo, toon('#f6fbff'));
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.1;
  g.add(pad);
  const iceMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    transparent: true,
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */ `uniform float uTime; uniform float uNight; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        vec3 c = mix(vec3(0.55,0.85,1.0), vec3(0.95,1.0,1.0), f) * (0.8 + 0.4*uNight*f);
        gl_FragColor = vec4(c, 0.55 + f*0.45);
        #include <colorspace_fragment>
      }`,
  });
  const crystals: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), iceMat);
    const a = (i / 7) * Math.PI * 2 + 0.3;
    c.position.set(Math.cos(a) * 3.6, 0.9 + (i % 3) * 0.3, Math.sin(a) * 3.6);
    c.scale.set(0.6, 1.6 + (i % 3) * 0.6, 0.6);
    c.rotation.z = (i % 2 ? 1 : -1) * 0.15;
    c.renderOrder = 3; // transparent: after the ocean (renderOrder 1)
    crystals.push(c);
    g.add(c);
  }
  const igloo = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#f4f9ff'));
  igloo.position.set(-1.6, 0, -1.2);
  const door = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#2a3d5c' }));
  door.position.set(-1.6, 0.02, 0.41);
  g.add(igloo, door);
  shade(g);
  crystals.forEach((c) => (c.castShadow = false));
  const light: LocalLight = { pos: new THREE.Vector3(p.x, p.h + 1.5, p.z), color: new THREE.Color('#9fd8ff'), range: 7, intensity: 0.4 };
  let t0 = 0;
  const center = new THREE.Vector3(p.x, p.h, p.z);
  return {
    group: g,
    lights: [light],
    center,
    spot: new THREE.Vector3(p.x - 1.6, p.h, p.z + 1.4),
    update(dt, t, night) {
      iceMat.uniforms.uTime.value = t;
      iceMat.uniforms.uNight.value = night;
      light.intensity = 0.25 + night * 0.6;
      t0 -= dt;
      if (t0 <= 0) {
        t0 = 0.08;
        snow.emit({ pos: { x: center.x, y: center.y + 5, z: center.z }, spread: { x: 4, y: 0.5, z: 4 }, vel: { x: 0.2, y: -0.9, z: 0 }, velJitter: { x: 0.2, y: 0.2, z: 0.2 }, life: 5, size: 0.14, color: '#ffffff', color2: '#cfe8ff', count: 2 });
      }
    },
  };
}

/** Cósmico: a pocket universe under a glass dome — orbiting planets, drifting stardust */
export function cosmicHabitat(stars: ParticlePool): Prop & { spot: THREE.Vector3 } {
  const p = PADS.cosmic;
  const g = new THREE.Group();
  g.position.set(p.x, p.h, p.z);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.6, 24), toon('#2e2a4a'));
  plinth.position.y = 0.1;
  const runes = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.7, 40), new THREE.MeshBasicMaterial({ color: '#b48cff', transparent: true, opacity: 0.8 }));
  runes.rotation.x = -Math.PI / 2;
  runes.renderOrder = 3;
  runes.position.y = 0.42;
  const domeMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */ `uniform float uTime; varying vec3 vP; varying vec3 vN; varying vec3 vV; ${GLSL_NOISE}
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);
        vec2 q = vec2(atan(vP.z, vP.x)*6.0, vP.y*5.0);
        float st = step(0.93, h21(floor(q*3.0))) * (0.5+0.5*sin(uTime*3.0 + h21(floor(q*3.0))*30.0));
        vec3 neb = mix(vec3(0.25,0.1,0.5), vec3(0.1,0.5,0.9), vn(q*0.7 + uTime*0.05));
        vec3 c = neb * 0.35 + vec3(1.0) * st + vec3(0.7,0.5,1.0) * f;
        gl_FragColor = vec4(c, 0.18 + f*0.55 + st*0.6);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.6, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.position.y = 0.4;
  dome.renderOrder = 4;
  const planets = new THREE.Group();
  planets.position.y = 2.2;
  const cols = ['#ffb36b', '#7fd0ff', '#ff7ab8'];
  cols.forEach((c, i) => {
    const pl = new THREE.Mesh(new THREE.SphereGeometry(0.22 + i * 0.08, 12, 8), new THREE.MeshBasicMaterial({ color: c }));
    pl.position.x = 1.0 + i * 0.7;
    const piv = new THREE.Object3D();
    piv.rotation.z = 0.3 * (i - 1);
    piv.add(pl);
    planets.add(piv);
  });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), new THREE.MeshBasicMaterial({ color: '#fff3b0' }));
  planets.add(sun);
  g.add(plinth, runes, dome, planets);
  shade(plinth);
  const light: LocalLight = { pos: new THREE.Vector3(p.x, p.h + 2, p.z), color: new THREE.Color('#b08cff'), range: 8, intensity: 0.6 };
  let t0 = 0;
  const center = new THREE.Vector3(p.x, p.h, p.z);
  return {
    group: g,
    lights: [light],
    spot: new THREE.Vector3(p.x - 4.4, p.h, p.z + 1.6),
    update(dt, t, night) {
      domeMat.uniforms.uTime.value = t;
      planets.children.forEach((c, i) => (c.rotation.y += dt * (0.9 - i * 0.2)));
      (runes.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.3 * Math.sin(t * 2);
      light.intensity = 0.4 + night * 0.8;
      t0 -= dt;
      if (t0 <= 0) {
        t0 = 0.12;
        stars.emit({ pos: { x: center.x, y: center.y + 1.5, z: center.z }, spread: { x: 3, y: 1.2, z: 3 }, vel: { x: 0, y: 0.25, z: 0 }, velJitter: { x: 0.2, y: 0.15, z: 0.2 }, life: 3.5, size: 0.28, color: '#fff6c8', color2: '#b48cff', count: 1 });
      }
    },
  };
}

// ───────────────────────────────── ship ─────────────────────────────────
/** a stubby cat-pirate sloop: hull from cross-sections, billowing sails, paw emblem */
export function ship(): { group: THREE.Group; sails: THREE.ShaderMaterial; lantern: LocalLight } {
  const g = new THREE.Group();
  // hull: loft of U-shaped sections along z (bow at -z)
  const secs = 9;
  const ring = 9;
  const verts: number[] = [];
  const idx: number[] = [];
  const cols: number[] = [];
  for (let i = 0; i <= secs; i++) {
    const t = i / secs;
    const z = -3.2 + t * 6.4;
    const width = 1.45 * Math.sin(Math.min(1, t * 1.25 + 0.08) * Math.PI * 0.9) + 0.15;
    const depth = 1.1 - Math.abs(t - 0.55) * 0.5;
    const sheer = 0.75 + Math.pow(Math.abs(t - 0.5) * 2, 2) * 0.6;
    for (let j = 0; j <= ring; j++) {
      const a = Math.PI + (j / ring) * Math.PI; // bottom half circle
      const x = Math.cos(a) * width;
      const y = Math.sin(a) * depth + (j === 0 || j === ring ? sheer : 0) + 0.2;
      verts.push(x, y, z);
      const stripe = y > 0.05 && y < 0.35;
      cols.push(...(stripe ? [0.95, 0.85, 0.35] : y < -0.2 ? [0.22, 0.14, 0.12] : [0.52, 0.27, 0.16]));
    }
  }
  for (let i = 0; i < secs; i++)
    for (let j = 0; j < ring; j++) {
      const a = i * (ring + 1) + j;
      const b = a + ring + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const hullGeo = new THREE.BufferGeometry();
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  hullGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  hullGeo.setIndex(idx);
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide }));
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 5.6), toon('#b07c4f'));
  deck.position.y = 0.75;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.4), toon('#6b3b2a'));
  cabin.position.set(0, 1.25, 2.1);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6, 6), toon('#5c3b26'));
  mast.position.set(0, 3.7, -0.3);
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 5), toon('#5c3b26'));
  yard.rotation.z = Math.PI / 2;
  yard.position.set(0, 6.0, -0.3);
  // sail texture: cream canvas with a paw emblem
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const sg = c.getContext('2d')!;
  sg.fillStyle = '#f3e6c8';
  sg.fillRect(0, 0, 256, 256);
  sg.fillStyle = '#e1cfa6';
  for (let x = 0; x < 256; x += 32) sg.fillRect(x, 0, 2, 256);
  sg.fillStyle = '#c23b44';
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
  const sailTex = new THREE.CanvasTexture(c);
  sailTex.colorSpace = THREE.SRGBColorSpace;
  const sails = new THREE.ShaderMaterial({
    uniforms: { map: { value: sailTex }, uTime: { value: 0 }, uWind: { value: 0.6 }, uGrade: { value: new THREE.Color('#ffffff') } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `uniform float uTime; uniform float uWind; varying vec2 vUv; varying float vB;
      void main(){ vUv = uv; vec3 p = position; float b = sin(uv.x*3.1416) * sin(uv.y*3.1416*0.9+0.2);
        p.z += b * (0.7*uWind + 0.08*sin(uTime*3.0 + uv.y*4.0)); vB = b;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
    fragmentShader: /* glsl */ `uniform sampler2D map; uniform vec3 uGrade; varying vec2 vUv; varying float vB;
      void main(){ vec3 c = texture2D(map, vUv).rgb * uGrade * (0.8 + vB*0.3); gl_FragColor = vec4(c,1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.6, 10, 10), sails);
  sail.position.set(0, 4.15, -0.2);
  const flagMat = new THREE.MeshBasicMaterial({ color: '#2a2440', side: THREE.DoubleSide });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), flagMat);
  flag.position.set(0.45, 6.9, -0.3);
  const lanternMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: '#ffcf7a' }));
  lanternMesh.position.set(0, 1.4, -3.2);
  g.add(hull, deck, cabin, mast, yard, sail, flag, lanternMesh);
  for (const s of [-1, 1])
    for (let k = 0; k < 2; k++) {
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8), toon('#2a2a33'));
      cannon.rotation.z = Math.PI / 2;
      cannon.position.set(s * 1.35, 0.95, -0.8 + k * 1.6);
      g.add(cannon);
    }
  shade(g);
  sail.castShadow = true;
  return { group: g, sails, lantern: { pos: new THREE.Vector3(), color: new THREE.Color('#ffb35c'), range: 6, intensity: 0 } };
}
