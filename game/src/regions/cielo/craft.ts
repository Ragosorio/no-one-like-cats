/**
 * Things that fly in the sky layer: AIRSHIPS (white envelopes with banded gores, a gondola with lit
 * windows, tail fins, a spinning propeller) and the player's own sloop wearing the «Kit de Vuelo»
 * look (a striped balloon on the mast, net ropes, canvas wings, a stern propeller). The kit's logic
 * lives with the story systems; this is only how a converted ship looks when it is moored up here.
 */
import * as THREE from 'three';
import { ship } from '../../rupturas/props';
import type { LocalLight } from '../../engine/world/paperCat';
import type { Bin } from '../paginas/kit';
import { Mesher, mat, skyToon, type U } from './kit';

export interface AirshipLook {
  envelope: [string, string];
  band: string;
  gondola: string;
  trim: string;
  fin: string;
  window: string;
}

export const AIRSHIP_CORONA: AirshipLook = { envelope: ['#fbf7ee', '#efe6d2'], band: '#e8b84a', gondola: '#f4efe4', trim: '#d9a53a', fin: '#f2ead8', window: '#ffe2a0' };
export const AIRSHIP_PATCH: AirshipLook = { envelope: ['#f0e2c8', '#d9c3a0'], band: '#b0567a', gondola: '#7a5a8e', trim: '#3f8f93', fin: '#c46a8e', window: '#ffd27a' };

/** an envelope of revolution along +z: radius profile(t) for t 0 (nose) → 1 (tail) */
function envelopeGeo(len: number, R: number, segs = 18, rows = 14) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    // blunt nose, long tapering tail
    const r = R * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.04)), 0.62) * (1 - 0.25 * t * t);
    pts.push(new THREE.Vector2(Math.max(0.02, r), -len / 2 + t * len));
  }
  const g = new THREE.LatheGeometry(pts, segs);
  // lathe axis is +y: lay it along +z (nose toward -z)
  g.rotateX(Math.PI / 2);
  return g;
}

export function airship(bin: Bin, uNight: U<number>, look: AirshipLook, scale = 1) {
  const M = new Mesher(true);
  const L = 11;
  const R = 2.6;
  const env = envelopeGeo(L, R);
  const ca = new THREE.Color(look.envelope[0]);
  const cb = new THREE.Color(look.envelope[1]);
  const band = new THREE.Color(look.band);
  M.add(env, (p, out) => {
    const a = Math.atan2(p.y, p.x);
    const gore = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 12) % 2;
    out.copy(gore ? ca : cb);
    const t = (p.z + L / 2) / L;
    if (Math.abs(t - 0.3) < 0.035 || Math.abs(t - 0.72) < 0.03) out.copy(band);
  });
  // tail fins (a cross)
  for (const [rx, rz] of [
    [0, 0],
    [0, Math.PI / 2],
  ] as const) {
    const fin = new THREE.BoxGeometry(0.12, R * 1.9, 2.2);
    M.add(fin, look.fin, mat(0, 0, L / 2 - 1.1, rx, 0, rz));
  }
  // gondola: a cabin slung underneath, with lit windows
  const gy = -R - 1.5;
  M.add(new THREE.BoxGeometry(1.6, 1.1, 4.2), look.gondola, mat(0, gy, 0.2));
  M.add(new THREE.BoxGeometry(1.75, 0.18, 4.4), look.trim, mat(0, gy + 0.6, 0.2));
  M.add(new THREE.BoxGeometry(1.75, 0.14, 4.4), look.trim, mat(0, gy - 0.55, 0.2));
  M.add(new THREE.ConeGeometry(0.8, 1.2, 4), look.trim, mat(0, gy, -2.4, -Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.7));
  for (let i = 0; i < 4; i++)
    for (const sx of [-1, 1]) {
      const w = new THREE.BoxGeometry(0.06, 0.42, 0.55);
      M.add(w, look.window, mat(sx * 0.82, gy + 0.05, -1.2 + i * 0.95), 0, 0.9);
    }
  // rigging: struts from the envelope to the cabin
  for (const [x, z] of [
    [-0.7, -1.6],
    [0.7, -1.6],
    [-0.7, 1.8],
    [0.7, 1.8],
  ]) {
    const len = 1.6;
    const c = new THREE.CylinderGeometry(0.04, 0.04, len, 3);
    M.add(c, look.trim, mat(x * 1.05, gy + 0.55 + len / 2 - 0.1, z, 0, 0, x * 0.12));
  }
  // engine pods + the stern propeller hub
  M.add(new THREE.CylinderGeometry(0.22, 0.32, 0.9, 6), look.trim, mat(0, gy, 2.6, Math.PI / 2));
  const body = new THREE.Mesh(bin.add(M.build()), skyToon(bin, { uNight, key: 'ship' }));
  body.castShadow = true;
  const blades = new THREE.Mesh(bin.add(new THREE.BoxGeometry(0.14, 2.2, 0.06)), bin.add(new THREE.MeshBasicMaterial({ color: look.trim })));
  const blades2 = blades.clone();
  blades2.rotation.z = Math.PI / 2;
  const prop = new THREE.Group();
  prop.add(blades, blades2);
  prop.position.set(0, gy, 3.1);
  const group = new THREE.Group();
  group.add(body, prop);
  group.scale.setScalar(scale);
  const lamp = new THREE.Vector3(0, gy * scale - 0.6, 0);
  return { group, prop, lamp };
}

/**
 * The player's sloop as an aerobarco: same hull and paw sail (rupturas/props ship()), plus a striped
 * balloon held by the mast and a rope net, canvas wings and a stern propeller.
 */
export function aerialShip(bin: Bin, uNight: U<number>) {
  const base = ship();
  const g = base.group;
  const M = new Mesher(true);
  // the balloon (red and cream gores, like the paw on the sail)
  const red = new THREE.Color('#c23b44');
  const cream = new THREE.Color('#f3e6c8');
  const bal = new THREE.SphereGeometry(3.3, 16, 12);
  bal.scale(1, 0.82, 1.35);
  M.add(bal, (p, out) => {
    const a = Math.atan2(p.z, p.x);
    out.copy(Math.floor(((a + Math.PI) / (Math.PI * 2)) * 10) % 2 ? red : cream);
    if (p.y < -2.3) out.set('#8c2a33');
  }, mat(0, 9.6, -0.3));
  // the net: ropes from the balloon's belly to the rails
  for (const [x, z] of [
    [-1.3, -2.4],
    [1.3, -2.4],
    [-1.4, 1.6],
    [1.4, 1.6],
    [-1.45, -0.4],
    [1.45, -0.4],
  ]) {
    const top = new THREE.Vector3(x * 1.6, 8, -0.3 + z * 1.05);
    const bot = new THREE.Vector3(x, 0.85, z);
    const len = top.distanceTo(bot);
    const c = new THREE.CylinderGeometry(0.035, 0.035, len, 3);
    const mid = top.clone().add(bot).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
    M.add(c, '#5c3b26', new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
  }
  // a brass ring where the net meets the balloon
  const ring = new THREE.TorusGeometry(2.5, 0.12, 4, 18);
  M.add(ring, '#d9a53a', mat(0, 7.7, -0.3, Math.PI / 2));
  // the stern engine housing
  M.add(new THREE.CylinderGeometry(0.3, 0.42, 1.0, 6), '#4a3a30', mat(0, 1.3, 3.5, Math.PI / 2));
  const kit = new THREE.Mesh(bin.add(M.build()), skyToon(bin, { uNight, key: 'ship' }));
  kit.castShadow = true;
  g.add(kit);
  // canvas wings (a fan of spars with a membrane), one per side: they beat slowly
  const wingGeo = bin.add(wingGeometry());
  const wingMat = bin.add(new THREE.MeshToonMaterial({ color: '#efe1c0', side: THREE.DoubleSide }));
  const wings: THREE.Mesh[] = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(wingGeo, wingMat);
    w.position.set(sx * 1.35, 1.0, -0.2);
    w.scale.set(sx, 1, 1);
    w.castShadow = true;
    g.add(w);
    wings.push(w);
  }
  const blades = new THREE.Mesh(bin.add(new THREE.BoxGeometry(0.16, 2.0, 0.06)), bin.add(new THREE.MeshBasicMaterial({ color: '#5c3b26' })));
  const b2 = blades.clone();
  b2.rotation.z = Math.PI / 2;
  const prop = new THREE.Group();
  prop.add(blades, b2);
  prop.position.set(0, 1.3, 4.05);
  g.add(prop);
  return {
    group: g,
    sails: base.sails,
    lantern: base.lantern as LocalLight,
    /** the Kit de Vuelo's own parts (balloon + net + engine, wings, propeller): hidden while your ship has no kit */
    kitParts: [kit, ...wings, prop] as THREE.Object3D[],
    update(t: number) {
      const beat = Math.sin(t * 1.4) * 0.16;
      wings[0].rotation.z = -0.18 + beat;
      wings[1].rotation.z = 0.18 - beat;
      prop.rotation.z = t * 5;
    },
  };
}

/** a bat-like canvas wing on +x: 3 spars and the scalloped membrane between them */
function wingGeometry() {
  const pos: number[] = [];
  const spars = [
    [3.6, 0.9, -1.4],
    [4.2, 0.3, 0.2],
    [3.2, -0.2, 1.6],
  ];
  const root = [0, 0, 0];
  const push = (...v: number[][]) => v.forEach((p) => pos.push(p[0], p[1], p[2]));
  // membrane between consecutive spars (scalloped toward the root)
  for (let i = 0; i < spars.length - 1; i++) {
    const a = spars[i];
    const b = spars[i + 1];
    const mid = [(a[0] + b[0]) * 0.36, (a[1] + b[1]) * 0.5 - 0.1, (a[2] + b[2]) * 0.5];
    push(root, a, mid, mid, a, b);
  }
  // the leading edge flap
  push(root, [1.2, 0.4, -1.9], spars[0]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
