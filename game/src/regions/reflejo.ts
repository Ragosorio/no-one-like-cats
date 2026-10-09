/**
 * EL REFLEJO — the 3D cinematic of H31 «Las estrellas caen hacia arriba».
 *
 * Night on the open sea seen from your lighthouse. The stars fall UPWARD (the sky's Rupture), and the
 * water reflects an island that is not there: the Isla de las Páginas Hundidas exists only upside down,
 * under the surface — a mirrored ghost drawn after the ocean, wobbling with the waves. Then the camera
 * looks up, and the sky is empty where the island should be.
 */
import * as THREE from 'three';
import type { RegionDef } from './types';
import { islandHeight } from './shapes';

/** a sliver of home: only the lighthouse rock pokes out of the sea */
const height = islandHeight({ radius: 9, seed: 11, base: 3.5, hills: 0.8, pads: [{ x: 0, z: 0, r: 3.5, h: 4.2 }] });

/** the island that isn't there: an open book, stacks of books as cliffs, a lighthouse on the spine */
function ghostIsland(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `uniform float uTime; varying float vH;
      void main(){ vec3 p = position; vec4 w = modelMatrix * vec4(p,1.0);
        w.x += sin(w.z * 0.35 + uTime * 1.3) * 0.6 + sin(w.z * 1.7 + uTime * 2.1) * 0.15;
        vH = -w.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `uniform float uTime; varying float vH;
      void main(){ float a = 0.22 * smoothstep(14.0, 0.0, vH) * (0.75 + 0.25 * sin(vH * 3.0 - uTime * 2.0));
        gl_FragColor = vec4(vec3(0.75, 0.88, 1.0) * a, 1.0); }`,
  });
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(0, ry, rz);
    g.add(m);
  };
  // the open book (two tilted pages) and the cliffs of stacked books
  add(new THREE.BoxGeometry(18, 1.2, 13), -8.5, 3, 0, 0, 0.18);
  add(new THREE.BoxGeometry(18, 1.2, 13), 8.5, 3, 0, 0, -0.18);
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(5 + (i % 3), 1.1, 3.4), -14 + i * 3.4, 0.6 + (i % 4) * 1.1, 8 + (i % 2) * 2, i * 0.4);
  // lighthouse on the spine
  add(new THREE.CylinderGeometry(0.9, 1.5, 10, 10), 0, 9, -1);
  add(new THREE.ConeGeometry(1.4, 2, 10), 0, 15, -1);
  // flip it: it only exists as a reflection
  g.scale.y = -1;
  g.position.set(0, -0.05, -70);
  g.renderOrder = 4;
  g.traverse((o) => (o.renderOrder = 4));
  g.userData.mat = mat;
  return g;
}

export const region: RegionDef = {
  id: 'reflejo',
  name: 'El reflejo',
  subtitle: '',
  half: 64,
  height,
  paint: (_x, _z, h, slope, out) => void out.set(h < 0.4 ? '#4a4a5a' : slope > 0.9 ? '#5d5a66' : '#6e6a78'),
  walkable: () => false,
  rupture: 1,
  hour: 23.2,
  weather: 'despejado',
  fog: { near: 60, far: 260 },
  camera: { target: [0, 6, -20], yaw: 0, pitch: 0.12, dist: 18 },
  arrival: [0, 4, 0],
  cinematic: {
    duration: 19,
    shots: [
      { at: 0, target: [0, 9, -14], yaw: 0.15, pitch: 0.12, dist: 12, cut: true },
      { at: 0.4, target: [0, 22, -40], yaw: 0.1, pitch: -0.05, dist: 30, lines: [['LUZTERNA', 'Desde aquí arriba se ve mejor, Capi. Y también se ve peor.']] },
      { at: 6, target: [0, -2, -66], yaw: 0, pitch: 0.42, dist: 46, lines: [['LUZTERNA', 'Ahí, en el agua. Libros. Una isla entera hecha de libros, al revés.']] },
      { at: 11.5, target: [0, 16, -70], yaw: 0.05, pitch: 0.08, dist: 58, lines: [['LUZTERNA', 'Y arriba… nada. Solo existe en el reflejo. Como mis ganas de hacer ejercicio.']] },
      { at: 16, target: [0, 6, -30], yaw: -0.25, pitch: 0.22, dist: 44, lines: [['LUZTERNA', 'Mañana zarpamos. Hoy no. Hoy me da miedo. …Un poquito.']] },
    ],
  },
  async build(ctx) {
    const ghost = ghostIsland();
    ctx.world.scene.add(ghost);
    // your lighthouse light (Luzterna lives there now): a warm glow over the rock
    const lamp: THREE.PointLight = new THREE.PointLight('#ffe2a0', 30, 40, 1.6);
    lamp.position.set(0, 12, 0);
    ctx.world.scene.add(lamp);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 8, 14), new THREE.MeshToonMaterial({ color: '#f1e9dd' }));
    tower.position.set(0, 8, 0);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.6, 14), new THREE.MeshToonMaterial({ color: '#c23b44' }));
    cap.position.set(0, 12.8, 0);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.2, 12), new THREE.MeshBasicMaterial({ color: '#fff1c2' }));
    glass.position.set(0, 12.2, 0);
    ctx.world.scene.add(tower, cap, glass);
    const mat = ghost.userData.mat as THREE.ShaderMaterial;
    return {
      pois: [],
      update(_dt, t) {
        mat.uniforms.uTime.value = t;
      },
    };
  },
};
