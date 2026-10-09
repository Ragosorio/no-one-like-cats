/**
 * Giant closed books, instanced: ONE draw call for every book on the island (cliffs, the lighthouse
 * plinth, the spine stairs, piles, the drowned shelves). Per-instance cover color; the page block
 * stays cream with page-edge lines and the spine wears gold bands and a title label — the "titles as
 * color bands" of the cliffs. Unit book: 2 long (x, along the spine) · 0.5 thick (y) · 1.4 deep (z),
 * spine on +z.
 */
import * as THREE from 'three';
import { Bin, toon } from './kit';
import { GLSL_HASH } from './kit';

export const BOOK_DIM = { x: 2, y: 0.5, z: 1.4 };

/** cover palette: oxblood, navy, forest, mustard, plum, teal, tobacco, red, vellum, ink */
export const COVERS = ['#7a2e2e', '#2f3d66', '#2f5a45', '#c9963a', '#5b3a63', '#2f6b6e', '#6b4a32', '#a23a32', '#d8c9a2', '#2a2730', '#3f5c8a', '#8a5a2a'];

function bookGeometry() {
  // [w, h, d, cx, cy, cz, color, tint, page]
  const parts: [number, number, number, number, number, number, string, number, number][] = [
    [2.0, 0.06, 1.4, 0, -0.22, 0, '#ffffff', 1, 0], // back cover
    [2.0, 0.06, 1.4, 0, 0.22, 0, '#ffffff', 1, 0], // front cover
    [2.0, 0.5, 0.08, 0, 0, 0.66, '#ffffff', 1, 0], // spine
    [1.92, 0.38, 1.3, 0, 0, -0.04, '#efe3c6', 0, 1], // page block
    [0.07, 0.52, 0.1, -0.64, 0, 0.67, '#d9b45a', 0, 0], // gold band
    [0.07, 0.52, 0.1, 0.64, 0, 0.67, '#d9b45a', 0, 0], // gold band
    [0.62, 0.2, 0.1, 0, 0.04, 0.67, '#e9dcb4', 0.2, 0], // title label
    [2.0, 0.045, 0.1, 0, -0.15, 0.67, '#5a5a5a', 1, 0], // dark rule under the title
  ];
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const tint: number[] = [];
  const page: number[] = [];
  const c = new THREE.Color();
  for (const [w, h, d, x, y, z, color, t, pg] of parts) {
    const b = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    b.translate(x, y, z);
    const p = b.attributes.position as THREE.BufferAttribute;
    const n = b.attributes.normal as THREE.BufferAttribute;
    c.set(color);
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      col.push(c.r, c.g, c.b);
      tint.push(t);
      page.push(pg);
    }
    b.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 1));
  g.setAttribute('aPage', new THREE.Float32BufferAttribute(page, 1));
  return g;
}

/** toon material: vColor = mix(color, color·instanceColor, aTint); page edges get fine lines */
export function bookMaterial(bin: Bin) {
  const m = toon(bin, { vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aTint; attribute float aPage; varying float vPage; varying vec3 vLocal;')
      .replace(
        '#include <color_vertex>',
        `#include <color_vertex>
  #ifdef USE_INSTANCING_COLOR
    vColor.rgb = mix(color.rgb, color.rgb * instanceColor.rgb, aTint);
  #endif
  vPage = aPage; vLocal = position;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vPage; varying vec3 vLocal;\n${GLSL_HASH}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  if (vPage > 0.5) {
    float ln = abs(fract(vLocal.y * 34.0) - 0.5);
    diffuseColor.rgb *= 0.86 + 0.14 * smoothstep(0.08, 0.3, ln);
    diffuseColor.rgb *= 0.93 + 0.07 * pn(vLocal.xz * 9.0);
  } else {
    diffuseColor.rgb *= 0.9 + 0.1 * pn(vLocal.xz * 6.0 + vLocal.y * 3.0); // worn leather
  }`,
      );
  };
  m.customProgramCacheKey = () => 'paginas-book';
  return m;
}

export interface BookPlacement {
  m: THREE.Matrix4;
  color: THREE.ColorRepresentation;
}

/** one InstancedMesh for every book */
export function bookMesh(bin: Bin, list: BookPlacement[]) {
  const geo = bin.add(bookGeometry());
  const mat = bookMaterial(bin);
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
  const c = new THREE.Color();
  list.forEach((b, i) => {
    mesh.setMatrixAt(i, b.m);
    mesh.setColorAt(i, c.set(b.color));
  });
  mesh.count = list.length;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** a stack of books from y0 upward; returns the top height. Spines face `out` (radians, world yaw). */
export function stack(list: BookPlacement[], rnd: () => number, x: number, z: number, y0: number, n: number, face: number, size = 2.4, lean = 0) {
  let y = y0;
  let ox = 0;
  for (let i = 0; i < n; i++) {
    const s = size * (0.82 + rnd() * 0.36);
    const sy = s * (0.85 + rnd() * 0.5);
    const th = BOOK_DIM.y * sy;
    const yaw = face + (rnd() - 0.5) * 0.35;
    // wider books at the bottom, a bit of drift on the way up
    const k = 1 - (i / Math.max(1, n)) * 0.18;
    ox += lean * th;
    const jx = (rnd() - 0.5) * 0.5 + ox * Math.cos(face);
    const jz = (rnd() - 0.5) * 0.5 - ox * Math.sin(face);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x + jx, y + th / 2, z + jz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.04, yaw, (rnd() - 0.5) * 0.05)),
      new THREE.Vector3(s * k, sy, s * k * (0.9 + rnd() * 0.2)),
    );
    list.push({ m, color: COVERS[Math.floor(rnd() * COVERS.length)] });
    y += th * 0.98;
  }
  return y;
}
