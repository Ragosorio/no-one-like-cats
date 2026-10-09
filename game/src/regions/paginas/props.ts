/**
 * Built pieces of the Isla de las Páginas Hundidas: the open book (pages that write themselves), the
 * Archive's little lighthouse on its plinth of books, the reading-room ruin, the drowned dock and
 * shelves, paper lanterns, the ink tide pool, a flock of loose pages and the glow halos. Static parts
 * are merged into a handful of draw calls; everything that moves is animated in shaders.
 */
import * as THREE from 'three';
import { GLSL_NOISE } from '../../engine/world/ocean';
import { Bin, GLSL_HASH, Merger, canvasTexture, mat, toon } from './kit';
import { BLOCK_RECT, BOOK, COVER_RECT, height, pageHeight, SPOT } from './layout';
import { drawEdgeStripes, drawOpenPages, drawWriteMask, OPEN_PAGES } from './pageArt';

export type U<T> = { value: T };

// ───────────────────────────────── the open book ─────────────────────────────────
/** the paper over the book's terrain + the live writing on page 213 */
export function openBookPages(bin: Bin, uNight: U<number>) {
  const r = BLOCK_RECT;
  const w = r.x1 - r.x0;
  const d = r.z1 - r.z0;
  const geo = bin.add(new THREE.PlaneGeometry(w, d, 120, 110));
  geo.rotateX(-Math.PI / 2);
  geo.translate((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, pageHeight(p.getX(i), p.getZ(i)) + 0.05);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const S = OPEN_PAGES.size;
  const map = canvasTexture(bin, S, S, drawOpenPages);
  const mask = canvasTexture(bin, 512, 512, drawWriteMask);
  mask.colorSpace = THREE.NoColorSpace;
  const b = OPEN_PAGES.blank;
  const uProg = { value: 0 };
  const uFade = { value: 1 };
  const m = toon(bin, { map });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWrite = { value: mask };
    sh.uniforms.uRect = { value: new THREE.Vector4(b.x0 / S, 1 - b.y1 / S, (b.x1 - b.x0) / S, (b.y1 - b.y0) / S) };
    sh.uniforms.uProg = uProg;
    sh.uniforms.uFade = uFade;
    sh.uniforms.uNightP = uNight;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform sampler2D uWrite; uniform vec4 uRect; uniform float uProg; uniform float uFade; uniform float uNightP; float wTip = 0.0;\n${GLSL_HASH}`)
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
  // paper grain (the region's lens: printed, not rendered)
  diffuseColor.rgb *= 0.95 + 0.05 * pn(vMapUv * 900.0);
  vec2 wuv = (vMapUv - uRect.xy) / uRect.zw;
  if (wuv.x > 0.0 && wuv.y > 0.0 && wuv.x < 1.0 && wuv.y < 1.0) {
    vec4 wm = texture2D(uWrite, wuv);
    float shown = wm.r * smoothstep(wm.g, wm.g + 0.003, uProg) * uFade;
    wTip = wm.r * smoothstep(0.012, 0.0, abs(wm.g - uProg)) * uFade;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.08, 0.2), shown * 0.95);
  }`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.35, 0.55, 1.0) * wTip * (0.6 + uNightP * 1.6);');
  };
  m.customProgramCacheKey = () => 'paginas-pages';
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  // the line writes itself (≈5.5 s a line), holds, then the ink sinks into the paper and it starts again
  let t = 0;
  return {
    mesh,
    update(dt: number) {
      t += dt;
      const cyc = t % 72;
      uProg.value = Math.min(1.02, cyc / 56);
      uFade.value = cyc < 64 ? 1 : 1 - (cyc - 64) / 8;
    },
  };
}

/** the sides of the page block (stacked page edges) following the paper's curve */
export function pageBlockWalls(bin: Bin) {
  const r = BLOCK_RECT;
  const bottom = BOOK.coverTop - 0.02;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const wall = (ax: number, az: number, bx: number, bz: number) => {
    const n = 48;
    const base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const top = pageHeight(x, z) + 0.05;
      pos.push(x, bottom, z, x, top, z);
      uv.push(t * 6, 0, t * 6, 1);
    }
    for (let i = 0; i < n; i++) {
      const a = base + i * 2;
      // walls are walked so that (direction × up) points outward
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  };
  wall(r.x1, r.z1, r.x1, r.z0); // east fore-edge
  wall(r.x0, r.z0, r.x0, r.z1); // west fore-edge
  wall(r.x0, r.z1, r.x1, r.z1); // tail
  wall(r.x1, r.z0, r.x0, r.z0); // head
  const g = bin.add(new THREE.BufferGeometry());
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const tex = canvasTexture(bin, 16, 128, drawEdgeStripes);
  tex.wrapS = THREE.RepeatWrapping;
  const m = toon(bin, { map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** cover board, gold corners and the satin ribbon (static, merged) */
export function bookStatics(M: Merger) {
  const c = COVER_RECT;
  const w = c.x1 - c.x0;
  const d = c.z1 - c.z0;
  const cx = (c.x0 + c.x1) / 2;
  const cz = (c.z0 + c.z1) / 2;
  M.add(new THREE.BoxGeometry(w, 0.55, d), '#6b2a26', mat(cx, BOOK.coverTop - 0.275, cz));
  // tooled gold rule along the board's rim
  M.add(new THREE.BoxGeometry(w + 0.04, 0.08, 0.12), '#c9a24a', mat(cx, BOOK.coverTop - 0.18, c.z1 + 0.02));
  M.add(new THREE.BoxGeometry(w + 0.04, 0.08, 0.12), '#c9a24a', mat(cx, BOOK.coverTop - 0.18, c.z0 - 0.02));
  // gold corner plates on the board's margin
  for (const sx of [c.x0, c.x1])
    for (const sz of [c.z0, c.z1]) {
      const ix = sx - Math.sign(sx) * 0.75;
      const iz = sz - Math.sign(sz - cz) * 0.75;
      M.add(new THREE.BoxGeometry(1.6, 0.06, 0.5), '#d4ad52', mat(ix, BOOK.coverTop + 0.02, sz - Math.sign(sz - cz) * 0.25));
      M.add(new THREE.BoxGeometry(0.5, 0.06, 1.6), '#d4ad52', mat(sx - Math.sign(sx) * 0.25, BOOK.coverTop + 0.02, iz));
      M.add(new THREE.BoxGeometry(0.62, 0.6, 0.62), '#c9a24a', mat(sx - Math.sign(sx) * 0.28, BOOK.coverTop - 0.27, sz - Math.sign(sz - cz) * 0.28));
    }
  // the ribbon bookmark: out of the head of the gutter, along it, across 213, over the edge
  const pts = [
    new THREE.Vector2(0.15, BLOCK_RECT.z0 + 0.3),
    new THREE.Vector2(0.5, -11),
    new THREE.Vector2(3.2, -6.4),
    new THREE.Vector2(8.5, -5.6),
    new THREE.Vector2(BLOCK_RECT.x1 - 0.2, -6.3),
    new THREE.Vector2(BLOCK_RECT.x1 + 0.6, -6.5),
    new THREE.Vector2(c.x1 + 0.9, -6.9),
    new THREE.Vector2(c.x1 + 2.2, -6.2),
  ];
  const curve = new THREE.SplineCurve(pts);
  const n = 140;
  const half = 0.36;
  const pos: number[] = [];
  const idx: number[] = [];
  const yAt = (x: number, z: number) => {
    if (x <= BLOCK_RECT.x1 && z >= BLOCK_RECT.z0) return pageHeight(x, z) + 0.12;
    if (x <= c.x1) return BOOK.coverTop + 0.05;
    return height(x, z) + 0.06;
  };
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = curve.getPoint(t);
    const tg = curve.getTangent(t);
    const nx = -tg.y;
    const nz = tg.x;
    for (const s of [-1, 1]) {
      const x = p.x + nx * half * s;
      const z = p.y + nz * half * s;
      pos.push(x, yAt(x, z), z);
    }
  }
  // a hard drop over the fore-edge: duplicate the point where the ribbon leaves the paper
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  // V-cut tail
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  M.add(g, '#b3262e');
}

// ───────────────────────────────── lighthouse ─────────────────────────────────
export function lighthouse(bin: Bin, M: Merger, E: Merger, base: THREE.Vector3, S = 1.3) {
  const g = new THREE.Group();
  const H = 7.6;
  const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s = 1) => mat(base.x + x * S, base.y + y * S, base.z + z * S, rx, ry, rz, s * S);
  // tapered tower in crisp bands (one open cylinder per band: no smeared vertex colors)
  const rad = (y: number) => 1.75 - (y / H) * 0.6;
  const bands: [number, number, string][] = [
    [0, 0.7, '#8a8090'],
    [0.7, 2.5, '#3f7c86'],
    [2.5, 3.0, '#efe4c8'],
    [3.0, 5.1, '#3f7c86'],
    [5.1, 5.5, '#efe4c8'],
    [5.5, H - 0.35, '#3f7c86'],
    [H - 0.35, H, '#efe4c8'],
  ];
  for (const [y0, y1, c] of bands) M.add(new THREE.CylinderGeometry(rad(y1), rad(y0) + (y0 === 0 ? 0.14 : 0), y1 - y0, 24, 1, true), c, at(0, (y0 + y1) / 2, 0));
  // door + windows (windows glow at night)
  M.add(new THREE.BoxGeometry(0.9, 1.5, 0.3), '#2a2230', at(0, 0.75, 1.66));
  M.add(new THREE.BoxGeometry(1.1, 0.12, 0.4), '#efe4c8', at(0, 1.55, 1.68));
  for (const [y, ang] of [
    [2.0, 0.5],
    [3.9, -0.9],
    [6.2, 0.2],
    [4.6, 2.4],
  ] as [number, number][]) {
    const r = rad(y) + 0.06;
    M.add(new THREE.BoxGeometry(0.56, 0.8, 0.1), '#efe4c8', at(Math.sin(ang) * (r - 0.03), y, Math.cos(ang) * (r - 0.03), 0, ang, 0));
    E.add(new THREE.PlaneGeometry(0.4, 0.62), '#ffc66b', at(Math.sin(ang) * (r + 0.03), y, Math.cos(ang) * (r + 0.03), 0, ang, 0), 1);
  }
  // gallery, railing, lantern room, dome, finial
  M.add(new THREE.CylinderGeometry(1.85, 1.6, 0.3, 22), '#e8dcc0', at(0, H + 0.12, 0));
  M.add(new THREE.TorusGeometry(1.75, 0.05, 4, 28), '#2e3c44', at(0, H + 0.75, 0, Math.PI / 2));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    M.add(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 4), '#2e3c44', at(Math.cos(a) * 1.75, H + 0.45, Math.sin(a) * 1.75));
  }
  E.add(new THREE.CylinderGeometry(0.95, 0.95, 1.3, 14, 1, true), '#fff1c2', at(0, H + 0.95, 0), 1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    M.add(new THREE.BoxGeometry(0.08, 1.3, 0.08), '#2e3c44', at(Math.cos(a) * 0.97, H + 0.95, Math.sin(a) * 0.97));
  }
  M.add(new THREE.CylinderGeometry(1.1, 1.1, 0.14, 16), '#2e5459', at(0, H + 1.66, 0));
  M.add(new THREE.SphereGeometry(1.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#2e5459', at(0, H + 1.7, 0));
  M.add(new THREE.ConeGeometry(0.16, 0.8, 8), '#c9a24a', at(0, H + 3.15, 0));
  M.add(new THREE.SphereGeometry(0.16, 8, 6), '#c9a24a', at(0, H + 2.78, 0));
  // the beam: two additive cones sweeping the sea at night (same recipe as your own lighthouse)
  const beamMat = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { uI: { value: 0 }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; varying float vEdge; void main(){ vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix * normal);
        vEdge = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform float uI; uniform float uTime; varying vec2 vUv; varying float vEdge; ${GLSL_NOISE}
        void main(){ float along = vUv.y;
          float a = mix(0.05, 1.0, pow(along, 2.2)) * (0.7 + 0.3*vn(vec2(vUv.x*8.0, along*5.0 - uTime*0.5)));
          a *= smoothstep(0.05, 0.6, vEdge);
          gl_FragColor = vec4(vec3(1.0, 0.9, 0.66) * a * uI * 0.7, 1.0); }`,
    }),
  );
  const pivot = new THREE.Object3D();
  pivot.position.set(base.x, base.y + (H + 0.95) * S, base.z);
  const coneGeo = bin.add(new THREE.CylinderGeometry(0.45, 6.5, 56, 24, 1, true));
  for (const dir of [1, -1]) {
    const arm = new THREE.Object3D();
    arm.rotation.y = dir > 0 ? 0 : Math.PI;
    arm.rotation.z = -0.12;
    const cone = new THREE.Mesh(coneGeo, beamMat);
    cone.rotation.z = Math.PI / 2;
    cone.position.x = 28;
    cone.renderOrder = 7;
    cone.frustumCulled = false;
    arm.add(cone);
    pivot.add(arm);
  }
  g.add(pivot);
  const glow = new THREE.PointLight('#ffe2a0', 0, 34, 1.6);
  glow.position.set(base.x, base.y + (H + 1.0) * S, base.z);
  g.add(glow);
  const lamp = new THREE.Vector3(base.x, base.y + (H + 0.95) * S, base.z);
  return {
    group: g,
    lamp,
    update(dt: number, t: number, night: number) {
      pivot.rotation.y += dt * 0.5;
      beamMat.uniforms.uI.value = night;
      beamMat.uniforms.uTime.value = t;
      glow.intensity = night * 26;
    },
  };
}

// ───────────────────────────────── reading-room ruin + dock ─────────────────────────────────
function checker(w: number, d: number, nx: number, nz: number, a: string, b: string, worn = 0.12) {
  const g = new THREE.PlaneGeometry(w, d, nx, nz).toNonIndexed();
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  const c = new THREE.Color();
  for (let t = 0; t < p.count; t += 3) {
    const x = (p.getX(t) + p.getX(t + 1) + p.getX(t + 2)) / 3;
    const z = (p.getZ(t) + p.getZ(t + 1) + p.getZ(t + 2)) / 3;
    const i = Math.floor((x + w / 2) / (w / nx));
    const j = Math.floor((z + d / 2) / (d / nz));
    c.copy((i + j) % 2 ? ca : cb).multiplyScalar(1 - worn * (((i * 7 + j * 13) % 5) / 5));
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (t + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** stone column: base, fluted shaft (stained where the tide reaches), capital; `h` may be broken */
function column(M: Merger, x: number, y: number, z: number, h: number, full: boolean) {
  M.add(new THREE.BoxGeometry(1.25, 0.35, 1.25), '#cfc4b0', mat(x, y + 0.17, z));
  M.addFn(
    new THREE.CylinderGeometry(0.44, 0.5, h, 10, 3),
    (p, out) => void out.set(p.y + h / 2 + y < 1.25 ? '#8f9f8a' : '#ddd3c1'),
    mat(x, y + 0.35 + h / 2, z),
  );
  if (full) M.add(new THREE.BoxGeometry(1.2, 0.4, 1.2), '#cfc4b0', mat(x, y + 0.35 + h + 0.2, z));
  else M.add(new THREE.DodecahedronGeometry(0.42, 0), '#cfc4b0', mat(x + 0.2, y + 0.35 + h + 0.05, z, 0.4, 0.6, 0.2, 1, 0.5, 1));
}

export function readingRoom(M: Merger, E: Merger) {
  const R = SPOT.room;
  const fy = R.floor;
  // upper floor (dry, east) + sunken floor (flooded, west) + three steps between
  M.addColored(checker(9, 9, 9, 9, '#d8cdb6', '#3b4a5e'), mat(R.x + 0.5, fy + 0.02, R.z));
  M.add(new THREE.BoxGeometry(9.2, 0.6, 9.2), '#a89c86', mat(R.x + 0.5, fy - 0.3, R.z));
  M.addColored(checker(7, 8, 7, 8, '#bdb39c', '#2f3d4e', 0.2), mat(SPOT.roomSunk.x, -0.12, SPOT.roomSunk.z));
  for (let s = 0; s < 3; s++) M.add(new THREE.BoxGeometry(0.8, 0.3, 6), '#a89c86', mat(R.x - 4.3 - s * 0.8, fy - 0.25 - s * 0.3, R.z));
  // ring of columns (some broken, one fallen)
  const hs = [5.6, 5.6, 2.2, 5.6, 3.4, 5.6, 1.3, 5.6, 4.1];
  const cols: THREE.Vector3[] = [];
  for (let i = 0; i < hs.length; i++) {
    const a = -Math.PI * 0.95 + (i / (hs.length - 1)) * Math.PI * 1.6;
    const x = R.x - 1.5 + Math.cos(a) * 6.4;
    const z = R.z + Math.sin(a) * 5.6;
    const y = x < R.x - 4.2 ? -0.15 : fy;
    column(M, x, y, z, hs[i], hs[i] > 5);
    cols.push(new THREE.Vector3(x, y + 0.35 + hs[i] + 0.4, z));
  }
  // architraves between neighbouring full columns
  for (let i = 0; i < hs.length - 1; i++) {
    if (hs[i] < 5 || hs[i + 1] < 5) continue;
    const a = cols[i];
    const b = cols[i + 1];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const len = a.distanceTo(b) + 1.0;
    M.add(new THREE.BoxGeometry(len, 0.55, 1.1), '#d6ccb9', mat(mid.x, Math.max(a.y, b.y) + 0.25, mid.z, 0, -Math.atan2(b.z - a.z, b.x - a.x), 0));
  }
  // the fallen column
  M.add(new THREE.CylinderGeometry(0.44, 0.48, 5.2, 10), '#d3c9b6', mat(R.x + 2.4, fy + 0.46, R.z + 4.9, 0, 0.5, Math.PI / 2));
  // north wall with a built-in bookcase (books are instanced elsewhere), stepped broken top
  const wz = R.z - 5.4;
  M.add(new THREE.BoxGeometry(7.5, 5.2, 0.7), '#cfc4ae', mat(R.x + 0.3, fy + 2.6, wz));
  M.add(new THREE.BoxGeometry(4.2, 1.4, 0.7), '#cfc4ae', mat(R.x - 1.35, fy + 5.9, wz));
  M.add(new THREE.BoxGeometry(1.8, 0.8, 0.7), '#cfc4ae', mat(R.x - 2.55, fy + 6.95, wz));
  M.add(new THREE.BoxGeometry(5.6, 4.4, 0.4), '#4a3020', mat(R.x + 0.3, fy + 2.5, wz + 0.4));
  for (let s = 0; s < 4; s++) M.add(new THREE.BoxGeometry(5.6, 0.12, 0.7), '#6b4a32', mat(R.x + 0.3, fy + 0.5 + s * 1.15, wz + 0.55));
  // reading desk, lectern with an open book, a green banker's lamp
  const dx = R.x + 1.8;
  const dz = R.z + 0.6;
  M.add(new THREE.BoxGeometry(2.8, 0.16, 1.4), '#6b4a32', mat(dx, fy + 1.15, dz));
  for (const [lx, lz] of [
    [-1.25, -0.55],
    [1.25, -0.55],
    [-1.25, 0.55],
    [1.25, 0.55],
  ])
    M.add(new THREE.BoxGeometry(0.14, 1.1, 0.14), '#4a3020', mat(dx + lx, fy + 0.55, dz + lz));
  M.add(new THREE.BoxGeometry(1.2, 0.08, 0.85), '#5a3d28', mat(dx - 0.5, fy + 1.4, dz, -0.35, 0, 0));
  M.add(new THREE.BoxGeometry(0.55, 0.05, 0.75), '#efe3c6', mat(dx - 0.78, fy + 1.47, dz, -0.35, 0, 0.08));
  M.add(new THREE.BoxGeometry(0.55, 0.05, 0.75), '#efe3c6', mat(dx - 0.22, fy + 1.47, dz, -0.35, 0, -0.08));
  M.add(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), '#b8913e', mat(dx + 0.9, fy + 1.5, dz - 0.2));
  M.add(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 8), '#b8913e', mat(dx + 0.9, fy + 1.24, dz - 0.2));
  E.add(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 10, 1, false, 0, Math.PI), '#2f9a5e', mat(dx + 0.9, fy + 1.82, dz - 0.2, 0, 0, Math.PI / 2), 0.55);
  E.add(new THREE.SphereGeometry(0.12, 8, 6), '#fff0b0', mat(dx + 0.9, fy + 1.7, dz - 0.2), 1);
  // the sign: SILENCIO (hand-painted, on a post by the steps)
  M.add(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 5), '#4a3020', mat(R.x + 4.6, fy + 1.2, R.z + 4.4));
  return { lamp: new THREE.Vector3(dx + 0.9, fy + 1.75, dz - 0.2), desk: new THREE.Vector3(dx, fy, dz), wallZ: wz, sign: new THREE.Vector3(R.x + 4.6, fy + 2.05, R.z + 4.5) };
}

export function signBoard(bin: Bin, at: THREE.Vector3) {
  const tex = canvasTexture(bin, 256, 128, (g, w, h) => {
    g.fillStyle = '#8a6440';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4a3020';
    g.lineWidth = 8;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#f2e6c9';
    g.textAlign = 'center';
    g.font = '24px "Permanent Marker", cursive';
    g.fillText('SALA DE LECTURA', w / 2, 50);
    g.font = '40px "Permanent Marker", cursive';
    g.fillText('¡SHHH!', w / 2, 100);
  });
  const m = toon(bin, { map: tex });
  const mesh = new THREE.Mesh(bin.add(new THREE.BoxGeometry(1.8, 0.9, 0.08)), m);
  mesh.position.copy(at);
  mesh.rotation.y = 0.5;
  mesh.castShadow = true;
  return mesh;
}

export function dock(M: Merger) {
  const d = SPOT.dock;
  const len = Math.hypot(d.x1 - d.x0, d.z1 - d.z0);
  const ang = Math.atan2(d.z1 - d.z0, d.x1 - d.x0);
  const n = Math.round(len / 0.55);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = d.x0 + (d.x1 - d.x0) * t;
    const z = d.z0 + (d.z1 - d.z0) * t;
    M.add(new THREE.BoxGeometry(0.5, 0.14, 2.3), i % 3 ? '#9a6b45' : '#8a5e3c', mat(x, d.y + (i % 2) * 0.02, z, 0, -ang + (i % 5 === 2 ? 0.05 : 0), 0));
  }
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    for (const s of [-1, 1]) {
      const x = d.x0 + (d.x1 - d.x0) * t - Math.sin(ang) * 1.1 * s;
      const z = d.z0 + (d.z1 - d.z0) * t + Math.cos(ang) * 1.1 * s;
      M.add(new THREE.CylinderGeometry(0.14, 0.16, 3.2 + (i === 6 ? 0.7 : 0), 6), '#5c3b26', mat(x, d.y - 1.2 + (i === 6 ? 0.35 : 0), z));
    }
  }
  return new THREE.Vector3(d.x1, d.y, d.z1);
}

// ───────────────────────────────── shelves, rowboat ─────────────────────────────────
/** a bookcase frame in its own space: 5 wide, 9 tall, 1.4 deep, open front on +z */
export function shelfFrame(M: Merger, m: THREE.Matrix4) {
  const wood = '#5a3d2a';
  const part = (geo: THREE.BufferGeometry, x: number, y: number, z: number, c = wood) => M.add(geo, c, new THREE.Matrix4().multiplyMatrices(m, mat(x, y, z)));
  part(new THREE.BoxGeometry(0.3, 9, 1.4), -2.35, 4.5, 0);
  part(new THREE.BoxGeometry(0.3, 9, 1.4), 2.35, 4.5, 0);
  part(new THREE.BoxGeometry(5.3, 0.35, 1.6), 0, 9.1, 0, '#4a3020');
  part(new THREE.BoxGeometry(4.6, 9, 0.12), 0, 4.5, -0.64, '#3e2a1e');
  for (let s = 0; s < 5; s++) part(new THREE.BoxGeometry(4.5, 0.14, 1.3), 0, 0.3 + s * 1.85, 0.02);
  // a little crown moulding
  part(new THREE.BoxGeometry(5.6, 0.18, 1.75), 0, 9.35, 0.02, '#6b4a32');
}

export function rowboat(M: Merger, at: THREE.Vector3, yaw: number) {
  const b = new THREE.Matrix4().multiplyMatrices(mat(at.x, at.y, at.z, 0.08, yaw, 0.12), new THREE.Matrix4());
  const part = (geo: THREE.BufferGeometry, c: string, m: THREE.Matrix4) => M.add(geo, c, new THREE.Matrix4().multiplyMatrices(b, m));
  part(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#8a5a36', mat(0, 0.55, 0, 0, 0, 0, 1.05, 0.55, 2.3));
  part(new THREE.TorusGeometry(1, 0.07, 4, 24), '#c9a24a', mat(0, 0.55, 0, Math.PI / 2, 0, 0, 1.05, 2.3, 1));
  part(new THREE.BoxGeometry(1.9, 0.08, 0.4), '#b07c4f', mat(0, 0.4, 0.3));
  part(new THREE.BoxGeometry(1.6, 0.08, 0.35), '#b07c4f', mat(0, 0.4, -0.9));
  part(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 4), '#6b4a32', mat(0.7, 0.62, 0.1, 0.1, 0, 1.35));
  part(new THREE.BoxGeometry(0.2, 0.03, 0.5), '#6b4a32', mat(1.9, 0.05, 0.22, 0, 0, 1.35));
}

// ───────────────────────────────── paper lanterns ─────────────────────────────────
export const LANTERN_COLORS = ['#ffb35c', '#ffd27a', '#ff8a5c', '#ffe9b0', '#f7a8a0'];

/** a post with a hanging paper lantern; returns the lantern's center */
export function lanternPost(M: Merger, E: Merger, x: number, y: number, z: number, yaw: number, color: string) {
  M.add(new THREE.CylinderGeometry(0.07, 0.09, 2.7, 5), '#4a3020', mat(x, y + 1.35, z));
  const ax = x + Math.cos(yaw) * 0.42;
  const az = z + Math.sin(yaw) * 0.42;
  M.add(new THREE.BoxGeometry(0.9, 0.07, 0.07), '#4a3020', mat((x + ax) / 2 + Math.cos(yaw) * 0.05, y + 2.62, (z + az) / 2 + Math.sin(yaw) * 0.05, 0, -yaw, 0));
  const c = new THREE.Vector3(ax, y + 2.12, az);
  E.add(new THREE.SphereGeometry(0.34, 10, 8), color, mat(c.x, c.y, c.z, 0, 0, 0, 1, 1.25, 1), 0.45);
  M.add(new THREE.CylinderGeometry(0.17, 0.2, 0.1, 8), '#2a2230', mat(c.x, c.y + 0.44, c.z));
  M.add(new THREE.CylinderGeometry(0.2, 0.17, 0.1, 8), '#2a2230', mat(c.x, c.y - 0.44, c.z));
  M.add(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 3), '#2a2230', mat(c.x, c.y + 0.52, c.z));
  return c;
}

/** a festoon of small lanterns on a sagging string between two points */
export function festoon(M: Merger, E: Merger, a: THREE.Vector3, b: THREE.Vector3, n: number, sag: number, rnd: () => number) {
  const out: THREE.Vector3[] = [];
  let prev = a.clone();
  for (let i = 1; i <= n + 1; i++) {
    const t = i / (n + 1);
    const p = a.clone().lerp(b, t);
    p.y -= Math.sin(t * Math.PI) * sag;
    const seg = p.clone().sub(prev);
    const mid = prev.clone().add(p).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), seg.clone().normalize());
    M.add(new THREE.CylinderGeometry(0.018, 0.018, seg.length(), 3), '#2a2230', new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
    if (i <= n) {
      const l = p.clone();
      l.y -= 0.24;
      E.add(new THREE.SphereGeometry(0.16, 8, 6), LANTERN_COLORS[Math.floor(rnd() * LANTERN_COLORS.length)], mat(l.x, l.y, l.z, 0, 0, 0, 1, 1.2, 1), 0.5);
      out.push(l);
    }
    prev = p;
  }
  return out;
}

/** unlit paper/glass whose glow follows the night (aGlow: 0 = paper, 1 = lit glass) */
export function emissiveMaterial(bin: Bin, uNight: U<number>) {
  const m = bin.add(new THREE.MeshBasicMaterial({ vertexColors: true }));
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNightE = uNight;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGlow; varying float vGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vGlow = aGlow;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNightE; varying float vGlow;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= mix(mix(0.92, 0.42, vGlow), 1.05 + vGlow * 1.5, uNightE);');
  };
  m.customProgramCacheKey = () => 'paginas-emissive';
  return m;
}

// ───────────────────────────────── glow halos (instanced billboards) ─────────────────────────────────
export interface Halo {
  p: THREE.Vector3;
  size: number;
  color: THREE.ColorRepresentation;
}

export function haloMesh(bin: Bin, list: Halo[], uI: U<number>, uTime: U<number>) {
  const geo = bin.add(new THREE.PlaneGeometry(1, 1));
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { uI, uTime },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `uniform float uTime; varying vec2 vUv; varying vec3 vCol; varying float vSeed;
        void main(){ vUv = uv;
          vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float s = length(instanceMatrix[0].xyz);
          c.xy += position.xy * s;
          #ifdef USE_INSTANCING_COLOR
            vCol = instanceColor;
          #else
            vCol = vec3(1.0);
          #endif
          vSeed = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 0.9;
          gl_Position = projectionMatrix * c; }`,
      fragmentShader: /* glsl */ `uniform float uI; uniform float uTime; varying vec2 vUv; varying vec3 vCol; varying float vSeed;
        void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2);
          float fl = 0.9 + 0.1 * sin(uTime * 7.0 + vSeed * 3.0) * sin(uTime * 2.3 + vSeed);
          gl_FragColor = vec4(vCol * a * uI * fl, 1.0); }`,
    }),
  );
  const mesh = new THREE.InstancedMesh(geo, m, Math.max(1, list.length));
  const c = new THREE.Color();
  const o = new THREE.Object3D();
  list.forEach((h, i) => {
    o.position.copy(h.p);
    o.scale.setScalar(h.size);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    mesh.setColorAt(i, c.set(h.color));
  });
  mesh.count = list.length;
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  return mesh;
}

// ───────────────────────────────── the ink tide pool ─────────────────────────────────
export function inkPool(bin: Bin, uNight: U<number>, uTime: U<number>) {
  const P = SPOT.pool;
  const geo = bin.add(new THREE.CircleGeometry(P.r + 0.7, 56));
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 1; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const k = 1 + 0.08 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 7);
    p.setX(i, p.getX(i) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  geo.translate(P.x, P.surface, P.z);
  const uSky = { value: new THREE.Color() };
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uC: { value: new THREE.Vector2(P.x, P.z) } }]),
      fog: true,
      vertexShader: /* glsl */ `varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform float uNight; uniform vec3 uSky; uniform vec2 uC; varying vec3 vW;
        #include <fog_pars_fragment>
        ${GLSL_HASH}
        mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
        void main(){
          vec2 d = vW.xz - uC; float r = length(d); float a = atan(d.y, d.x);
          float band = sin(a * 3.0 + r * 1.7 - uTime * 0.45 + pn(d * 0.7 + uTime * 0.08) * 4.0);
          vec3 col = vec3(0.035, 0.03, 0.07);
          vec3 sheen = mix(vec3(0.22, 0.1, 0.4), vec3(0.06, 0.32, 0.42), pn(d * 0.45 + uTime * 0.03));
          col += sheen * smoothstep(0.55, 1.0, band) * 0.55;
          // letters adrift: a slowly turning grid of glyph strokes
          vec2 q = rot(uTime * 0.04) * d * 1.5; vec2 cell = floor(q); vec2 f = fract(q) - 0.5; float h = ph21(cell);
          float g1 = smoothstep(0.07, 0.0, abs(f.x - (h - 0.5) * 0.3)) * step(abs(f.y), 0.26);
          float g2 = smoothstep(0.06, 0.0, abs(f.y + 0.2 - h * 0.4)) * step(abs(f.x), 0.2);
          float g3 = smoothstep(0.06, 0.0, abs(length(f - vec2(0.1, 0.0)) - 0.18)) * step(0.5, fract(h * 7.0));
          float glyph = max(max(g1, g2 * step(0.4, fract(h * 3.0))), g3) * step(0.72, h) * smoothstep(${(P.r - 0.2).toFixed(2)}, ${(P.r - 1.2).toFixed(2)}, r);
          float tw = 0.55 + 0.45 * sin(uTime * 1.3 + h * 40.0);
          col += glyph * tw * mix(vec3(0.3, 0.25, 0.45) * 0.35, vec3(0.45, 0.75, 1.0) * 1.1, uNight);
          // sky in the ink (fresnel) and a meniscus at the rim
          vec3 V = normalize(cameraPosition - vW);
          float fr = pow(1.0 - max(V.y, 0.0), 3.0);
          col = mix(col, uSky * 0.55, fr * 0.6);
          col += vec3(0.25, 0.2, 0.4) * smoothstep(${(P.r - 0.1).toFixed(2)}, ${(P.r + 0.6).toFixed(2)}, r) * 0.6;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    }),
  );
  m.uniforms.uTime = uTime;
  m.uniforms.uNight = uNight;
  m.uniforms.uSky = uSky;
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = false;
  return { mesh, sky: uSky.value };
}

// ───────────────────────────────── the flock of loose pages ─────────────────────────────────
export function pageFlock(bin: Bin, n: number, rnd: () => number, centers: THREE.Vector3[], uTime: U<number>, uTint: U<THREE.Color>) {
  const plane = new THREE.PlaneGeometry(0.75, 0.95, 4, 1);
  const g = bin.add(new THREE.InstancedBufferGeometry());
  g.index = plane.index;
  g.setAttribute('position', plane.attributes.position);
  g.setAttribute('uv', plane.attributes.uv);
  g.setAttribute('normal', plane.attributes.normal);
  const P = new Float32Array(n * 4);
  const Cn = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const c = centers[i % centers.length];
    P.set([4 + rnd() * 14, 2 + rnd() * 9, (0.08 + rnd() * 0.14) * (rnd() < 0.5 ? -1 : 1), rnd() * Math.PI * 2], i * 4);
    Cn.set([c.x, c.y, c.z], i * 3);
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 4));
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(Cn, 3));
  g.instanceCount = n;
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      fog: true,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `attribute vec4 aP; attribute vec3 aC; uniform float uTime; varying vec2 vUv;
        #include <fog_pars_vertex>
        mat3 rY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
        mat3 rX(float a){ float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
        mat3 rZ(float a){ float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
        void main(){ vUv = uv;
          float ang = aP.w + uTime * aP.z;
          vec3 ctr = aC + vec3(cos(ang) * aP.x, aP.y + sin(uTime * 0.6 + aP.w * 3.0) * 1.3, sin(ang) * aP.x * 0.8);
          vec3 p = position;
          p.z += p.x * p.x * 0.9 * sin(uTime * 3.4 + aP.w * 7.0);
          p = rY(-ang + (aP.z > 0.0 ? 0.0 : 3.1416)) * rZ(sin(uTime * 2.1 + aP.w * 5.0) * 0.6) * rX(-1.25 + sin(uTime * 1.7 + aP.w) * 0.45) * p;
          vec4 mvPosition = modelViewMatrix * vec4(ctr + p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `uniform vec3 uTint; varying vec2 vUv;
        #include <fog_pars_fragment>
        void main(){
          float inside = step(0.14, vUv.x) * step(vUv.x, 0.86) * step(0.12, vUv.y) * step(vUv.y, 0.86);
          float lines = inside * step(0.6, fract(vUv.y * 10.0)) * step(0.2, fract(vUv.x * 3.0 + floor(vUv.y * 10.0) * 0.37));
          vec3 c = vec3(0.93, 0.88, 0.76) * (1.0 - lines * 0.35) * (gl_FrontFacing ? 1.0 : 0.8) * uTint;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    }),
  );
  m.uniforms.uTime = uTime;
  m.uniforms.uTint = uTint;
  plane.dispose();
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return mesh;
}

// ───────────────────────────────── fishable pages (and Canelo's) ─────────────────────────────────
export function glowPageMaterial(bin: Bin, uTime: U<number>, uTint: U<THREE.Color>, map: THREE.Texture | null, gold: number) {
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, uHasMap: { value: map ? 1 : 0 }, uGold: { value: gold }, uGlow: { value: 1 } }]),
      fog: true,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `uniform float uTime; varying vec2 vUv;
        #include <fog_pars_vertex>
        void main(){ vUv = uv; vec3 p = position;
          p.z += (p.x * p.x) * 0.22 * sin(uTime * 2.2) + sin(p.y * 2.0 + uTime * 3.0) * 0.04;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform sampler2D map; uniform float uHasMap; uniform float uGold; uniform float uGlow; uniform vec3 uTint; varying vec2 vUv;
        #include <fog_pars_fragment>
        void main(){
          vec3 paper = mix(vec3(1.0, 0.93, 0.74), vec3(1.0, 0.8, 0.36), uGold);
          if (uHasMap > 0.5) paper = texture2D(map, vUv).rgb;
          else {
            float inside = step(0.15, vUv.x) * step(vUv.x, 0.85) * step(0.12, vUv.y) * step(vUv.y, 0.88);
            paper *= 1.0 - inside * step(0.62, fract(vUv.y * 11.0)) * step(0.25, fract(vUv.x * 2.7 + floor(vUv.y * 11.0) * 0.41)) * 0.4;
          }
          float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
          float rim = 1.0 - smoothstep(0.0, 0.09, e);
          vec3 c = paper * mix(uTint, vec3(1.0), 0.55 + 0.3 * uGlow);
          c += mix(vec3(1.0, 0.86, 0.5), vec3(1.0, 0.7, 0.2), uGold) * rim * uGlow * (0.75 + 0.25 * sin(uTime * 3.0));
          if (!gl_FrontFacing && uHasMap > 0.5) c = mix(vec3(0.95, 0.78, 0.4), c, 0.15);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    }),
  );
  m.uniforms.uTime = uTime;
  m.uniforms.uTint = uTint;
  if (map) m.uniforms.map.value = map;
  return m;
}

// ───────────────────────────────── the ink trickle (page 213 → the tide pool) ─────────────────────────────────
/** a ribbon of wet ink that runs off the fore-edge, over the cover, down the slope and into the pool */
export function inkStream(bin: Bin, uTime: U<number>, uNight: U<number>) {
  const c = COVER_RECT;
  const P = SPOT.pool;
  const z0 = SPOT.ink[0][1];
  const xe = BLOCK_RECT.x1;
  const pts: THREE.Vector3[] = [
    new THREE.Vector3(xe - 1.6, pageHeight(xe - 1.6, z0 - 0.4) + 0.08, z0 - 0.4),
    new THREE.Vector3(xe - 0.4, pageHeight(xe - 0.4, z0 - 0.1) + 0.08, z0 - 0.1),
    new THREE.Vector3(xe + 0.04, pageHeight(xe, z0) + 0.06, z0),
    new THREE.Vector3(xe + 0.06, BOOK.coverTop + 0.04, z0 + 0.05),
    new THREE.Vector3(c.x1 - 0.02, BOOK.coverTop + 0.04, z0 + 0.2),
    new THREE.Vector3(c.x1 + 0.05, BOOK.coverTop - 0.5, z0 + 0.25),
  ];
  // then over the ground, following the channel, into the ink
  const g0 = SPOT.ink;
  for (let i = 1; i < g0.length; i++) {
    const [ax, az] = g0[i - 1];
    const [bx, bz] = g0[i];
    for (let k = 1; k <= 6; k++) {
      const t = k / 6;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      if (x < c.x1 + 0.3) continue;
      pts.push(new THREE.Vector3(x, height(x, z) + 0.06, z));
    }
  }
  // the last stretch slides under the pool's surface
  const last = g0[g0.length - 1];
  pts.push(new THREE.Vector3(last[0] + (P.x - last[0]) * 0.25, P.surface - 0.06, last[1] + (P.z - last[1]) * 0.25));
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const o = pts[Math.max(0, i - 1)];
    if (i > 0) len += p.distanceTo(o);
    const dx = q.x - o.x;
    const dz = q.z - o.z;
    const l = Math.hypot(dx, dz) || 1;
    const half = 0.3 + 0.08 * Math.sin(len * 1.3);
    const nx = (-dz / l) * half;
    const nz = (dx / l) * half;
    pos.push(p.x + nx, p.y, p.z + nz, p.x - nx, p.y, p.z - nz);
    uv.push(len, 0, len, 1);
    if (i < pts.length - 1) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = bin.add(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      fog: true,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      vertexShader: /* glsl */ `varying vec2 vUv;
        #include <fog_pars_vertex>
        void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform float uNight; varying vec2 vUv;
        #include <fog_pars_fragment>
        ${GLSL_HASH}
        void main(){
          float flow = pn(vec2(vUv.x * 1.6 - uTime * 1.4, vUv.y * 3.0));
          float glint = smoothstep(0.72, 0.95, flow) * (1.0 - abs(vUv.y - 0.5) * 2.0);
          vec3 c = vec3(0.04, 0.035, 0.08) + mix(vec3(0.25, 0.2, 0.45), vec3(0.35, 0.6, 1.0), uNight) * glint * (0.5 + uNight * 0.6);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    }),
  );
  m.uniforms.uTime = uTime;
  m.uniforms.uNight = uNight;
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = false;
  return mesh;
}
