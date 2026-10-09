/**
 * Instanced flora (AgentGameEngine `world/flora`): palms, rocks, grass tufts and flowers, each kind one
 * draw call, swaying with a shared wind uniform injected into the stock toon material
 * (onBeforeCompile keeps lights, shadows and fog for free).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toonGradient } from './heightfield';

export const wind = { value: 0.35, time: { value: 0 } };

/** add vertex sway proportional to height above the instance origin */
function swaying(mat: THREE.Material, stiffness: number) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = wind as unknown as THREE.IUniform;
    sh.uniforms.uWTime = wind.time;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind; uniform float uWTime;')
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
        #else
          float ph = 0.0;
        #endif
        float hgt = max(position.y, 0.0);
        float sway = (sin(uWTime * 1.7 + ph) * 0.6 + sin(uWTime * 3.1 + ph * 1.7) * 0.25) * uWind;
        transformed.x += sway * hgt * hgt * ${stiffness.toFixed(4)};
        transformed.z += sway * 0.4 * hgt * hgt * ${stiffness.toFixed(4)};`,
      );
  };
  return mat;
}

function leafTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  // a palm frond: central rib with leaflets
  g.beginPath();
  g.moveTo(32, 0);
  for (let y = 0; y <= 256; y += 16) {
    const w = Math.sin((y / 256) * Math.PI) * 30 + 2;
    g.lineTo(32 + w, y + 6);
    g.lineTo(32 + w * 0.3, y + 10);
  }
  for (let y = 256; y >= 0; y -= 16) {
    const w = Math.sin((y / 256) * Math.PI) * 30 + 2;
    g.lineTo(32 - w * 0.3, y + 10);
    g.lineTo(32 - w, y + 6);
  }
  g.closePath();
  g.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
}

/** a palm made of a curved trunk + 9 drooping fronds, merged per kind */
function palmGeometries() {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.35, 2.4, 0), new THREE.Vector3(1.1, 4.6, 0), new THREE.Vector3(2.0, 6.2, 0)]);
  const trunk = new THREE.TubeGeometry(curve, 10, 0.26, 6, false);
  // taper + ring bands via vertex colors
  const tp = trunk.attributes.position as THREE.BufferAttribute;
  const tcol = new Float32Array(tp.count * 3);
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i);
    const band = Math.floor(y * 2.2) % 2 ? 0.82 : 1;
    tcol[i * 3] = 0.55 * band;
    tcol[i * 3 + 1] = 0.38 * band;
    tcol[i * 3 + 2] = 0.24 * band;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
  const top = curve.getPoint(1);
  const fronds: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 9; k++) {
    const g = new THREE.PlaneGeometry(1.1, 4.2, 1, 6);
    g.translate(0, -2.1, 0);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const t = -p.getY(i) / 4.2; // 0 at base → 1 at tip
      p.setZ(i, -t * t * 1.9 + Math.abs(p.getX(i)) * 0.35); // droop + V fold
    }
    g.rotateX(-Math.PI / 2 + 0.35);
    g.rotateY((k / 9) * Math.PI * 2 + (k % 2) * 0.2);
    g.translate(top.x, top.y, top.z);
    fronds.push(g);
  }
  const frond = mergeGeometries(fronds)!;
  return { trunk, frond, top };
}

export interface Placement {
  x: number;
  y: number;
  z: number;
  s: number;
  r: number;
}

function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, list: Placement[], shadow = true) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
  const o = new THREE.Object3D();
  list.forEach((p, i) => {
    o.position.set(p.x, p.y, p.z);
    o.rotation.set(0, p.r, 0);
    o.scale.setScalar(p.s);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
  });
  m.count = list.length;
  m.castShadow = shadow;
  m.receiveShadow = true;
  m.computeBoundingSphere();
  return m;
}

export class Flora {
  readonly group = new THREE.Group();
  private mats: THREE.Material[] = [];
  private geos: THREE.BufferGeometry[] = [];
  constructor(o: { palms: Placement[]; rocks: Placement[]; grass: Placement[]; flowers: Placement[] }) {
    const ramp = toonGradient();
    const { trunk, frond } = palmGeometries();
    const trunkMat = swaying(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp }), 0.012);
    const leaf = leafTexture();
    const frondMat = swaying(new THREE.MeshToonMaterial({ color: '#3fae4f', gradientMap: ramp, alphaMap: leaf, alphaTest: 0.5, side: THREE.DoubleSide }), 0.012);
    const rockGeo = new THREE.DodecahedronGeometry(0.8, 0);
    rockGeo.scale(1, 0.62, 1);
    const rockMat = new THREE.MeshToonMaterial({ color: '#8b8a9a', gradientMap: ramp });
    // grass tuft: five thin blades, dark at the root and light at the tip (vertex colors)
    const blades: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 5; k++) {
      const b = new THREE.PlaneGeometry(0.16, 0.75, 1, 3);
      b.translate(0, 0.37, 0);
      const bp = b.attributes.position as THREE.BufferAttribute;
      const bc = new Float32Array(bp.count * 3);
      for (let i = 0; i < bp.count; i++) {
        const t = bp.getY(i) / 0.75;
        bp.setX(i, bp.getX(i) * (1 - t * 0.9) + t * t * 0.12 * (k % 2 ? 1 : -1));
        bc.set([0.55 + t * 0.45, 0.62 + t * 0.38, 0.5 + t * 0.3], i * 3);
      }
      b.setAttribute('color', new THREE.BufferAttribute(bc, 3));
      b.rotateY((k / 5) * Math.PI + k * 0.3);
      b.translate(Math.sin(k * 2.1) * 0.12, 0, Math.cos(k * 1.7) * 0.12);
      blades.push(b);
    }
    const grassGeo = mergeGeometries(blades)!;
    const grassMat = swaying(new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: ramp, side: THREE.DoubleSide }), 0.8);
    // flowers: a flat five-petal daisy on a short stem
    const petal = new THREE.Shape();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = i % 2 ? 0.07 : 0.17;
      if (i === 0) petal.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else petal.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const head = new THREE.ShapeGeometry(petal);
    head.rotateX(-Math.PI / 2 + 0.35);
    head.translate(0, 0.42, 0);
    const stem = new THREE.CylinderGeometry(0.012, 0.012, 0.42, 3);
    stem.translate(0, 0.21, 0);
    const flowerGeo = mergeGeometries([head.toNonIndexed(), stem.toNonIndexed()])!;
    const flowerMat = swaying(new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: ramp, side: THREE.DoubleSide }), 1.2);
    const flowers = instanced(flowerGeo, flowerMat, o.flowers, false);
    const palette = ['#ff8fbf', '#ffe066', '#ffffff', '#c7a8ff', '#ffa86b'];
    o.flowers.forEach((_, i) => flowers.setColorAt(i, new THREE.Color(palette[i % palette.length])));
    const grassMesh = instanced(grassGeo, grassMat, o.grass, false);
    const greens = ['#6fcf5c', '#5fbf55', '#84d968', '#58b04f'];
    o.grass.forEach((_, i) => grassMesh.setColorAt(i, new THREE.Color(greens[i % greens.length])));
    this.group.add(
      instanced(trunk, trunkMat, o.palms),
      instanced(frond, frondMat, o.palms),
      instanced(rockGeo, rockMat, o.rocks),
      grassMesh,
      flowers,
    );
    this.mats.push(trunkMat, frondMat, rockMat, grassMat, flowerMat);
    this.geos.push(trunk, frond, rockGeo, grassGeo, flowerGeo);
  }
  dispose() {
    this.mats.forEach((m) => m.dispose());
    this.geos.forEach((g) => g.dispose());
  }
}
