/**
 * «Guiar el haz» — Isla Nácar's activity and the gate of its story battle.
 *
 * A prism on the east knoll catches the light (the sun by day, the moon by night) and throws a beam
 * west. Three nacre mirrors stand on the terrace; tapping one turns it 45° (a two-sided mirror has 4
 * distinct states). The path is traced in 2D on the XZ plane: mirrors reflect it, the geode, the
 * prism, the portal's rock and the terrain stop it (sparks), the sea swallows it. When it enters the
 * crystal door head-on, the door floods with light and shatters, and the cave stays open for good.
 *
 * While a mirror turns, the path is retraced every frame, so the beam SWEEPS across the island.
 */
import * as THREE from 'three';
import type { POI, RegionCtx } from '../types';
import { BEAM_Y, CAVE_DEPTH, DOOR, GEODE, MIRRORS, PRISM, SOLUTION, START, TERRACE, height } from './layout';
import { MAX_SEG, beamMaterial, crystalMaterial, mirrorMaterial, shaftMaterial, type Lit } from './materials';
import { PAL, type Halos } from './props';
import { toonGradient } from '../../engine/world/heightfield';
import type { LocalLight } from '../../engine/world/paperCat';
import { sfx } from '../../core/audio';

const Q = Math.PI / 4;
const ease = (k: number) => {
  // ease-out-back: a little overshoot, like a heavy mirror settling
  const c1 = 1.6;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};

export interface BeamEnd {
  kind: 'door' | 'block' | 'open';
  p: THREE.Vector3;
}

interface Trace {
  pts: THREE.Vector3[];
  /** indices (into pts) of mirror bounces */
  bounces: number[];
  end: BeamEnd;
}

const PRISM_Y = () => height(PRISM.x, PRISM.z) + 2.3;

/** 2D ray vs circle: distance along the ray, or Infinity */
function rayCircle(px: number, pz: number, dx: number, dz: number, cx: number, cz: number, r: number) {
  const ox = px - cx;
  const oz = pz - cz;
  const b = ox * dx + oz * dz;
  const c = ox * ox + oz * oz - r * r;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t > 0.05 ? t : Infinity;
}

const BLOCKERS = [
  { x: GEODE.x, z: GEODE.z, r: GEODE.r },
  { x: PRISM.x, z: PRISM.z, r: 1.3 },
  // the portal's rock shoulders on both sides of the door
  { x: DOOR.x - 5.4, z: DOOR.z - 2, r: 2.9 },
  { x: DOOR.x + 5.5, z: DOOR.z - 2.2, r: 2.9 },
];

/** trace the beam for the given mirror angles (radians, the mirror line's angle on XZ) */
export function traceBeam(angles: number[], open: boolean): Trace {
  const py = PRISM_Y();
  const pts = [new THREE.Vector3(PRISM.x - 0.6, py, PRISM.z)];
  const bounces: number[] = [];
  // the prism is aimed at the first mirror (fixed): the first leg always lands there
  const A = MIRRORS[0];
  pts.push(new THREE.Vector3(A.x, BEAM_Y, A.z));
  let x = A.x;
  let z = A.z;
  let dx = Math.sign(A.x - PRISM.x) || -1;
  let dz = 0;
  let last = 0;
  let y = BEAM_Y;
  const reflect = (i: number) => {
    const a = angles[i];
    const nx = -Math.sin(a);
    const nz = Math.cos(a);
    const d = dx * nx + dz * nz;
    dx -= 2 * d * nx;
    dz -= 2 * d * nz;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
  };
  reflect(0);
  bounces.push(1);
  for (let seg = 1; seg < MAX_SEG; seg++) {
    let best = 70;
    let kind: BeamEnd['kind'] | 'mirror' = 'open';
    let hitM = -1;
    for (let i = 0; i < MIRRORS.length; i++) {
      if (i === last) continue;
      const t = rayCircle(x, z, dx, dz, MIRRORS[i].x, MIRRORS[i].z, 0.85);
      if (t < best) {
        best = t;
        kind = 'mirror';
        hitM = i;
      }
    }
    for (const b of BLOCKERS) {
      const t = rayCircle(x, z, dx, dz, b.x, b.z, b.r);
      if (t < best) {
        best = t;
        kind = 'block';
      }
    }
    // the door plane (z = DOOR.z + 0.3): crossing it inside the arch's width
    if (Math.abs(dz) > 1e-4) {
      const t = (DOOR.z + 0.35 - z) / dz;
      const hx = x + dx * t;
      if (t > 0.05 && t < best && Math.abs(hx - DOOR.x) < DOOR.w / 2 + 0.4) {
        best = t;
        kind = dz < -0.86 && Math.abs(hx - DOOR.x) < DOOR.w / 2 - 0.3 ? 'door' : 'block';
      }
    }
    // terrain (the mountain's flank, the knoll, the dunes)
    for (let t = 0.5; t < best; t += 0.45) {
      if (height(x + dx * t, z + dz * t) > y - 0.2) {
        best = t;
        kind = 'block';
        break;
      }
    }
    x += dx * best;
    z += dz * best;
    if (kind === 'door' && open) {
      // the door is gone: the light pours down the tunnel
      const t = (DOOR.z - 1.6 - z) / dz;
      x += dx * t;
      z += dz * t;
    }
    pts.push(new THREE.Vector3(x, y, z));
    if (kind === 'mirror') {
      reflect(hitM);
      last = hitM;
      bounces.push(pts.length - 1);
      continue;
    }
    return { pts, bounces, end: { kind: kind as BeamEnd['kind'], p: pts[pts.length - 1].clone() } };
  }
  return { pts, bounces, end: { kind: 'open', p: pts[pts.length - 1].clone() } };
}

export interface BeamApi {
  group: THREE.Group;
  pois: POI[];
  lights: LocalLight[];
  /** current trace (for the lens + ground light) */
  trace: Trace;
  solved: boolean;
  update(dt: number, t: number, night: number, halos: Halos): void;
  /** dev: snap the mirrors to the answer (or scramble them) */
  setStates(s: number[]): void;
  tap(i: number): void;
}

export function beamPuzzle(
  ctx: RegionCtx,
  L: Lit,
  opts: { solved: boolean; onReach: () => Promise<void> | void; sky: { uZenith: THREE.IUniform; uHorizon: THREE.IUniform } },
): BeamApi {
  const group = new THREE.Group();
  const tmpO = new THREE.Object3D();
  const toonM = (c: THREE.ColorRepresentation) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient() });
  const pearlStone = toonM('#efe8fb');
  const lilacStone = toonM('#b9aedc');

  // ── prism on its pedestal ──
  const ky = height(PRISM.x, PRISM.z);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.35, 1.1, 6), lilacStone);
  ped.position.set(PRISM.x, ky + 0.45, PRISM.z);
  const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.18, 6), pearlStone);
  pedTop.position.set(PRISM.x, ky + 1.05, PRISM.z);
  const prismMat = crystalMaterial(L, { glow: 1.4 });
  // an upright three-sided prism (unit height; the crystal shader reads position.y as 0..1)
  const prismGeo = new THREE.CylinderGeometry(0.62, 0.62, 1, 3);
  prismGeo.translate(0, 0.5, 0);
  const prism = new THREE.Mesh(prismGeo, prismMat);
  prism.scale.set(1.5, 2.9, 1.5);
  prism.position.set(PRISM.x, ky + 1.0, PRISM.z);
  prism.rotation.set(0.12, 0.4, -0.1);
  prismMat.uniforms.uColor.value = new THREE.Color('#a9d6ff');
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 6, 40), new THREE.MeshBasicMaterial({ color: '#f4eeff', transparent: true, opacity: 0.7 }));
  ring.position.set(PRISM.x, PRISM_Y(), PRISM.z);
  ring.renderOrder = 3;
  group.add(ped, pedTop, prism, ring);
  for (const m of [ped, pedTop, prism]) m.castShadow = m.receiveShadow = true;

  // sun / moon shaft into the prism
  const shaftMat = shaftMaterial();
  const shaftGeo = new THREE.CylinderGeometry(1.5, 0.4, 1, 16, 1, true);
  shaftGeo.translate(0, 0.5, 0);
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.renderOrder = 6;
  shaft.frustumCulled = false;
  group.add(shaft);

  // ── mirrors ──
  const faceGeo = new THREE.CircleGeometry(1.25, 40);
  const frameGeo = new THREE.TorusGeometry(1.32, 0.16, 8, 44);
  const baseGeo = new THREE.CylinderGeometry(1.25, 1.45, 0.45, 8);
  const tickGeo = new THREE.BoxGeometry(0.12, 0.06, 0.4);
  const postGeo = new THREE.CylinderGeometry(0.16, 0.22, 1, 6);
  const finialGeo = new THREE.OctahedronGeometry(0.28, 0);
  const frameMat = crystalMaterial(L, { glow: 0.8 });
  frameMat.uniforms.uColor.value = new THREE.Color('#f3ecff');
  const finialMat = crystalMaterial(L, { glow: 1.4 });
  finialMat.uniforms.uColor.value = PAL.sky.clone();
  const mirrors = MIRRORS.map((p, i) => {
    const base = new THREE.Mesh(baseGeo, pearlStone);
    base.position.set(p.x, TERRACE + 0.15, p.z);
    base.receiveShadow = base.castShadow = true;
    group.add(base);
    const pivot = new THREE.Group();
    pivot.position.set(p.x, TERRACE, p.z);
    const post = new THREE.Mesh(postGeo, lilacStone);
    post.scale.y = BEAM_Y - TERRACE - 1.2;
    post.position.y = (BEAM_Y - TERRACE - 1.2) / 2 + 0.3;
    const mat = mirrorMaterial(L, opts.sky);
    const face = new THREE.Mesh(faceGeo, mat);
    face.scale.set(1, 1.3, 1);
    face.position.y = BEAM_Y - TERRACE;
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.scale.set(1, 1.3, 1);
    frame.position.y = BEAM_Y - TERRACE;
    const fin = new THREE.Mesh(finialGeo, finialMat);
    fin.position.y = BEAM_Y - TERRACE + 2.05;
    fin.scale.set(0.8, 1.4, 0.8);
    pivot.add(post, face, frame, fin);
    post.castShadow = frame.castShadow = true;
    group.add(pivot);
    const k0 = opts.solved ? SOLUTION[i] : START[i];
    return { pivot, mat, steps: k0, from: k0 * Q, to: k0 * Q, t: 1, hit: 0 };
  });
  // 8 notches around each base (the 45° steps), one instanced mesh
  const ticks = new THREE.InstancedMesh(tickGeo, lilacStone, MIRRORS.length * 8);
  MIRRORS.forEach((p, i) => {
    for (let k = 0; k < 8; k++) {
      const a = k * Q;
      tmpO.position.set(p.x + Math.cos(a) * 1.3, TERRACE + 0.4, p.z + Math.sin(a) * 1.3);
      tmpO.rotation.set(0, -a + Math.PI / 2, 0);
      tmpO.updateMatrix();
      ticks.setMatrixAt(i * 8 + k, tmpO.matrix);
    }
  });
  ticks.computeBoundingSphere();
  group.add(ticks);
  const angles = () => mirrors.map((m) => m.from + (m.to - m.from) * (m.t >= 1 ? 1 : ease(m.t)));
  const placeMirror = (m: (typeof mirrors)[number], a: number) => (m.pivot.rotation.y = -a);
  mirrors.forEach((m) => placeMirror(m, m.to));

  // ── the beam: one instanced cylinder per leg ──
  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
  beamGeo.translate(0, 0.5, 0);
  const beamMat = beamMaterial(L);
  const beam = new THREE.InstancedMesh(beamGeo, beamMat, MAX_SEG);
  const segAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_SEG * 4), 4);
  segAttr.setUsage(THREE.DynamicDrawUsage);
  beam.geometry.setAttribute('aSeg', segAttr);
  beam.frustumCulled = false;
  beam.renderOrder = 7;
  group.add(beam);

  const tmp = new THREE.Object3D();
  const Y = new THREE.Vector3(0, 1, 0);
  let solved = opts.solved;
  let reaching = false;
  let trace = traceBeam(angles(), solved);
  let dirty = true;
  const lights: LocalLight[] = MIRRORS.map((p) => ({ pos: new THREE.Vector3(p.x, BEAM_Y, p.z), color: new THREE.Color('#f2e8ff'), range: 7, intensity: 0 }));
  const endLight: LocalLight = { pos: new THREE.Vector3(), color: new THREE.Color('#e6dcff'), range: 6, intensity: 0 };
  lights.push(endLight);

  const drawBeam = () => {
    const P = trace.pts;
    let dist = 0;
    const n = Math.min(MAX_SEG, P.length - 1);
    for (let i = 0; i < n; i++) {
      const a = P[i];
      const b = P[i + 1];
      const len = a.distanceTo(b);
      const dir = b.clone().sub(a).normalize();
      tmp.position.copy(a);
      tmp.quaternion.setFromUnitVectors(Y, dir);
      const w = i === 0 ? 0.42 : 0.36;
      tmp.scale.set(w, len, w);
      tmp.updateMatrix();
      beam.setMatrixAt(i, tmp.matrix);
      // fade-out length at the end (world units): the open sea swallows it, the cave drinks it
      const last = i === n - 1;
      const fadeLen = last && trace.end.kind === 'open' ? len * 0.55 : last && trace.end.kind === 'door' && solved ? 2.6 : 0;
      segAttr.setXYZW(i, len, dist, fadeLen, w);
      dist += len;
    }
    beam.count = n;
    beam.instanceMatrix.needsUpdate = true;
    segAttr.needsUpdate = true;
  };

  const tap = (i: number) => {
    if (solved || reaching) return;
    const m = mirrors[i];
    const cur = angles()[i];
    m.steps++;
    m.from = cur;
    m.to = m.steps * Q;
    m.t = 0;
    dirty = true;
    sfx('tick', 0.9 + i * 0.1);
    sfx('whoosh', 1.3);
  };

  const pois: POI[] = mirrors.map((m, i) => ({
    id: `espejo_${i}`,
    pos: new THREE.Vector3(MIRRORS[i].x, BEAM_Y + 2.6, MIRRORS[i].z),
    label: 'GIRAR',
    kind: 'activity' as const,
    visible: () => !solved && !reaching,
    onTap: () => tap(i),
  }));

  let sparkT = 0;
  let lastEnd = '';
  const api: BeamApi = {
    group,
    pois,
    lights,
    get trace() {
      return trace;
    },
    get solved() {
      return solved;
    },
    setStates(s) {
      mirrors.forEach((m, i) => {
        m.steps = s[i];
        m.from = m.to = s[i] * Q;
        m.t = 1;
        placeMirror(m, m.to);
      });
      dirty = true;
    },
    tap,
    update(dt, t, night, halos) {
      let moving = false;
      for (const m of mirrors) {
        if (m.t < 1) {
          m.t = Math.min(1, m.t + dt / 0.6);
          moving = true;
          dirty = true;
        }
      }
      const ang = angles();
      mirrors.forEach((m, i) => placeMirror(m, ang[i]));
      if (dirty) {
        trace = traceBeam(ang, solved);
        drawBeam();
        dirty = moving;
        const key = `${trace.end.kind}:${trace.pts.length}`;
        if (!moving && key !== lastEnd) {
          if (trace.bounces.length > 1 && lastEnd) sfx('zap', 1 + trace.bounces.length * 0.12);
          lastEnd = key;
        }
        if (!moving && !solved && !reaching && trace.end.kind === 'door') {
          reaching = true;
          void Promise.resolve(opts.onReach()).then(() => {
            solved = true;
            reaching = false;
            dirty = true;
          });
        }
      }
      // light source: the sun's shaft by day, the moon's at night (paler)
      const L0 = night > 0.55 ? L.uMoonDir.value : L.uSunDir.value;
      const pp = trace.pts[0];
      shaft.position.copy(pp).add(new THREE.Vector3(0.6, 0, 0));
      shaft.quaternion.setFromUnitVectors(Y, L0.clone().normalize());
      shaft.scale.set(1, 34, 1);
      shaftMat.uniforms.uCol.value.set(night > 0.55 ? '#bcc8ff' : '#fff1d6');
      shaftMat.uniforms.uI.value = night > 0.55 ? 0.8 : Math.min(1, L.uSunI.value / 1.5) * 0.2 + 0.06;
      shaftMat.uniforms.uTime.value = t;
      beamMat.uniforms.uCol.value.set(night > 0.55 ? '#e8e2ff' : '#fff8f0');
      beamMat.uniforms.uI.value = (solved ? 0.6 : 0.85) + 0.15 * Math.sin(t * 3.1);
      prism.position.y = ky + 1.1 + Math.sin(t * 1.3) * 0.1;
      prism.rotation.y = 0.4 + Math.sin(t * 0.4) * 0.15;
      ring.rotation.set(Math.PI / 2 + Math.sin(t * 0.7) * 0.2, 0, t * 0.5);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.25 * Math.sin(t * 2);
      // halos: the prism, each bounce, the end
      halos.add(pp, 2.2 + Math.sin(t * 2.2) * 0.2, '#efe4ff', 0.22 + night * 0.3);
      halos.add(pp, 0.9, '#ffffff', 0.7);
      mirrors.forEach((m, i) => {
        const hit = trace.bounces.some((b) => trace.pts[b].distanceToSquared(lights[i].pos) < 1.5);
        m.hit += ((hit ? 1 : 0) - m.hit) * (1 - Math.exp(-dt * 8));
        m.mat.uniforms.uHit.value = m.hit * (0.75 + 0.25 * Math.sin(t * 6 + i));
        lights[i].intensity = m.hit * (0.9 + night * 1.2);
        if (m.hit > 0.02) halos.add(lights[i].pos, 2.6, '#f4ecff', m.hit * 0.8);
      });
      const e = trace.end;
      endLight.pos.copy(e.p);
      endLight.intensity = e.kind === 'open' ? 0 : 1 + night;
      if (e.kind === 'block') {
        halos.add(e.p, 1.8 + Math.sin(t * 14) * 0.25, '#e9ddff', 0.85);
        sparkT -= dt;
        if (sparkT <= 0) {
          sparkT = 0.06;
          ctx.world.pools.sparks.emit({ pos: e.p, velJitter: { x: 2.2, y: 2.6, z: 2.2 }, vel: { x: 0, y: 1.2, z: 0 }, life: 0.45, size: 0.3, color: '#ffffff', color2: '#b79cff', count: 3 });
        }
      } else if (e.kind === 'door') {
        halos.add(e.p, solved ? 2.6 : 4.5, solved ? '#d9c8ff' : '#ffffff', solved ? 0.3 : 0.9);
      }
    },
  };
  drawBeam();
  return api;
}
