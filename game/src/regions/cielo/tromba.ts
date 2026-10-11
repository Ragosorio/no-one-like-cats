/**
 * Oleada 2 story props for the sky regions (docs/part-ii/22 «Pasada de cine»):
 *  - waterspout(): the TROMBA that lifts a ship out of the Primer Mar into the sky layer — a column of water and
 *    cloud with three ribbons twisting up it, a splash at its foot and a cloud collar at its head. `set(k)` grows it
 *    from the cloud sea up to its top (0..1); `update(t)` turns it. Until your ship has the Kit de Vuelo the region
 *    leaves one under it (it's what's holding the ship up).
 *  - umbrella(): the mechanic's umbrella-propeller (a striped canopy and two spinning blades).
 *  - blueprint(): the Kit de Vuelo's blue plan (balloon, side propellers, tail rudder) on a sheet with tape, drawn
 *    into a canvas at runtime (no image file).
 * All geometry/material/texture goes into the region's Bin (freed with the region).
 */
import * as THREE from 'three';
import type { Bin } from '../paginas/kit';
import { canvasTexture } from '../paginas/kit';

export interface Waterspout {
  group: THREE.Group;
  /** 0 = flat in the clouds … 1 = all the way up */
  set(k: number): void;
  update(t: number, dt: number): void;
  readonly k: number;
}

export function waterspout(bin: Bin, from: THREE.Vector3, to: THREE.Vector3, radius = 2.2): Waterspout {
  const group = new THREE.Group();
  group.name = 'tromba';
  group.position.copy(from);
  const H = Math.max(4, to.y - from.y);
  const inner = new THREE.Group();
  group.add(inner);
  // the column: an open cone, wider at the foot and at the head (an hourglass of water)
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const f = i / 16;
    const r = radius * (1.35 - 0.75 * Math.sin(f * Math.PI * 0.92)) + (f > 0.86 ? (f - 0.86) * radius * 7 : 0);
    prof.push(new THREE.Vector2(r, f * H));
  }
  const colGeo = bin.add(new THREE.LatheGeometry(prof, 20));
  const colMat = bin.add(new THREE.MeshBasicMaterial({ color: '#dff2ff', transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
  const col = new THREE.Mesh(colGeo, colMat);
  inner.add(col);
  // three ribbons of water twisting up
  const ribMat = bin.add(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.62, depthWrite: false }));
  for (let r = 0; r < 3; r++) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      const a = f * Math.PI * 7 + (r * Math.PI * 2) / 3;
      const rr = radius * (1.1 - 0.65 * Math.sin(f * Math.PI * 0.92)) + 0.15;
      pts.push(new THREE.Vector3(Math.cos(a) * rr, f * H, Math.sin(a) * rr));
    }
    const tube = bin.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.16, 4, false));
    inner.add(new THREE.Mesh(tube, ribMat));
  }
  // the splash at its foot (in the cloud sea) and the cloud collar at its head
  const puffMat = bin.add(new THREE.MeshLambertMaterial({ color: '#f6f8ff', transparent: true, opacity: 0.92 }));
  const puffGeo = bin.add(new THREE.IcosahedronGeometry(1, 1));
  const foot = new THREE.Group();
  const head = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const p = new THREE.Mesh(puffGeo, puffMat);
    p.position.set(Math.cos(a) * radius * 1.9, 0.4 + (i % 3) * 0.4, Math.sin(a) * radius * 1.9);
    p.scale.setScalar(radius * (0.7 + (i % 2) * 0.35));
    foot.add(p);
    const q = new THREE.Mesh(puffGeo, puffMat);
    q.position.set(Math.cos(a) * radius * 1.6, 0, Math.sin(a) * radius * 1.6);
    q.scale.setScalar(radius * (0.55 + (i % 3) * 0.18));
    head.add(q);
  }
  group.add(foot, head);
  let k = 1;
  const api: Waterspout = {
    group,
    get k() {
      return k;
    },
    set(v: number) {
      k = Math.max(0, Math.min(1, v));
      group.visible = k > 0.005;
      inner.scale.set(1, Math.max(0.001, k), 1);
      head.position.y = H * k;
      head.scale.setScalar(0.4 + 0.6 * k);
      foot.scale.setScalar(0.5 + 0.5 * Math.min(1, k * 3));
    },
    update(t: number) {
      inner.rotation.y = t * 1.6;
      head.rotation.y = -t * 0.4;
      colMat.opacity = 0.26 + 0.08 * Math.sin(t * 2.3);
    },
  };
  api.set(1);
  return api;
}

/** the mechanic's umbrella-propeller: a striped canopy, a handle, two blades that spin */
export function umbrella(bin: Bin): { group: THREE.Group; blades: THREE.Object3D } {
  const g = new THREE.Group();
  const canopy = bin.add(new THREE.ConeGeometry(1.5, 0.7, 10, 1, true));
  const cols = canopy.attributes.position.count;
  const c = new Float32Array(cols * 3);
  const P = canopy.attributes.position;
  const a1 = new THREE.Color('#f0b44c');
  const a2 = new THREE.Color('#13224a');
  for (let i = 0; i < cols; i++) {
    const ang = Math.atan2(P.getZ(i), P.getX(i));
    const s = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 10) % 2 ? a1 : a2;
    c.set([s.r, s.g, s.b], i * 3);
  }
  canopy.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const m = new THREE.Mesh(canopy, bin.add(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  m.position.y = 0.35;
  const handle = new THREE.Mesh(bin.add(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 5)), bin.add(new THREE.MeshLambertMaterial({ color: '#5c3b26' })));
  handle.position.y = -0.5;
  const blades = new THREE.Group();
  const bl = new THREE.Mesh(bin.add(new THREE.BoxGeometry(2.6, 0.04, 0.22)), bin.add(new THREE.MeshLambertMaterial({ color: '#d9a53a' })));
  blades.add(bl, bl.clone().rotateY(Math.PI / 2));
  blades.position.y = 0.82;
  g.add(m, handle, blades);
  return { group: g, blades };
}

/** the Kit de Vuelo's blueprint, taped (a plane with a runtime canvas drawing) */
export function blueprint(bin: Bin): THREE.Mesh {
  const tex = canvasTexture(bin, 256, 192, (g, w, h) => {
    g.fillStyle = '#1f4fa8';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(233,240,255,0.35)';
    g.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    g.strokeStyle = '#e9f0ff';
    g.lineWidth = 3;
    // hull
    g.beginPath();
    g.moveTo(50, 140);
    g.lineTo(206, 140);
    g.lineTo(186, 168);
    g.lineTo(70, 168);
    g.closePath();
    g.stroke();
    // mast + balloon
    g.beginPath();
    g.moveTo(128, 140);
    g.lineTo(128, 86);
    g.stroke();
    g.beginPath();
    g.ellipse(128, 58, 52, 36, 0, 0, Math.PI * 2);
    g.stroke();
    for (const dx of [-26, 0, 26]) {
      g.beginPath();
      g.ellipse(128 + dx, 58, 6, 35, 0, 0, Math.PI * 2);
      g.stroke();
    }
    // side propellers
    for (const x of [38, 218]) {
      g.beginPath();
      g.moveTo(x - 14, 132);
      g.lineTo(x + 14, 132);
      g.moveTo(x, 118);
      g.lineTo(x, 146);
      g.stroke();
    }
    // tail rudder
    g.beginPath();
    g.moveTo(206, 140);
    g.lineTo(232, 118);
    g.lineTo(232, 150);
    g.closePath();
    g.stroke();
    g.fillStyle = '#e9f0ff';
    g.font = 'bold 15px sans-serif';
    g.fillText('KIT DE VUELO', 10, 20);
    // the tape
    g.fillStyle = 'rgba(240,226,190,0.9)';
    g.fillRect(100, 0, 56, 12);
    g.fillRect(100, h - 12, 56, 12);
  });
  const m = new THREE.Mesh(bin.add(new THREE.PlaneGeometry(1.6, 1.2)), bin.add(new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })));
  m.name = 'blueprint';
  return m;
}
