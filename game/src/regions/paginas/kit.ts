/**
 * Small build kit for the Páginas region: a geometry merger (many static parts → one draw call with
 * vertex colors), toon materials, canvas textures and a disposal bin (everything created here is
 * tracked so the region can free it even if it never reached the scene graph).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toonGradient } from '../../engine/world/heightfield';

export class Bin {
  private items = new Set<{ dispose(): void }>();
  add<T extends { dispose(): void }>(x: T): T {
    this.items.add(x);
    return x;
  }
  dispose() {
    for (const x of this.items) x.dispose();
    this.items.clear();
  }
}

export const toon = (bin: Bin, p: THREE.MeshToonMaterialParameters = {}) => bin.add(new THREE.MeshToonMaterial({ gradientMap: toonGradient(), ...p }));

const tmpC = new THREE.Color();

/** collects transformed, vertex-colored parts and merges them into one non-indexed geometry */
export class Merger {
  private parts: THREE.BufferGeometry[] = [];
  /** extra per-vertex float (e.g. glow strength) */
  constructor(private extra?: string) {}
  add(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, m?: THREE.Matrix4, extraVal = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (m) g.applyMatrix4(m);
    const n = g.attributes.position.count;
    const c = new Float32Array(n * 3);
    tmpC.set(color);
    for (let i = 0; i < n; i++) c.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    if (this.extra) g.setAttribute(this.extra, new THREE.BufferAttribute(new Float32Array(n).fill(extraVal), 1));
    this.parts.push(g);
    return this;
  }
  /** same as add() but with a per-vertex color function (gradients, bands) */
  addFn(geo: THREE.BufferGeometry, fn: (p: THREE.Vector3, out: THREE.Color) => void, m?: THREE.Matrix4, extraVal = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    const pos = g.attributes.position as THREE.BufferAttribute;
    const n = pos.count;
    const c = new Float32Array(n * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      fn(v.fromBufferAttribute(pos, i), tmpC);
      c.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    }
    if (m) g.applyMatrix4(m);
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    if (this.extra) g.setAttribute(this.extra, new THREE.BufferAttribute(new Float32Array(n).fill(extraVal), 1));
    this.parts.push(g);
    return this;
  }
  /** a geometry that already carries its own `color` attribute */
  addColored(geo: THREE.BufferGeometry, m?: THREE.Matrix4, extraVal = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (m) g.applyMatrix4(m);
    if (this.extra) g.setAttribute(this.extra, new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(extraVal), 1));
    this.parts.push(g);
    return this;
  }
  get empty() {
    return this.parts.length === 0;
  }
  build(): THREE.BufferGeometry {
    const out = mergeGeometries(this.parts, false)!;
    for (const p of this.parts) p.dispose();
    this.parts = [];
    out.computeBoundingSphere();
    return out;
  }
}

const tm = new THREE.Matrix4();
const tq = new THREE.Quaternion();
const te = new THREE.Euler();
const tv = new THREE.Vector3();
const ts = new THREE.Vector3();
/** compose a matrix from position / euler / scale (fresh matrix) */
export function mat(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  te.set(rx, ry, rz);
  tq.setFromEuler(te);
  return new THREE.Matrix4().compose(tv.set(x, y, z), tq, ts.set(sx, sy, sz));
}
export function mul(a: THREE.Matrix4, b: THREE.Matrix4) {
  return tm.multiplyMatrices(a, b).clone();
}

/** canvas → texture (sRGB, mipmapped) */
export function canvasTexture(bin: Bin, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = bin.add(new THREE.CanvasTexture(c));
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** GLSL: tiny hash for shaders in this region */
export const GLSL_HASH = /* glsl */ `float ph21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float pn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(ph21(i), ph21(i+vec2(1,0)), f.x), mix(ph21(i+vec2(0,1)), ph21(i+vec2(1,1)), f.x), f.y); }`;
