/**
 * Puerto Cometa's yard, built once into ONE merged mesh (metallic toon, one draw call): the googie
 * workshop of the fishbowl-helmet owner, the refinery of Combustible Astral, two drydocks where ships
 * are being turned into starships (gantries, catwalks, floodlights, glowing rivets), the launch rail and
 * its umbilical tower, the pier with its docking clamp, the observatory knoll, the PUERTO COMETA pylon,
 * the comet's heart in the crater (crystals), ice spires on the crest, lamps, bollards, barrels.
 * Returns the anchors the living parts need (lamps, welders, beacons, crane bases, sign spots…).
 */
import * as THREE from 'three';
import { Mesher, mat } from '../cielo/kit';
import { P, beam, girder, lattice, pipe, pipeline, rivets } from './kit';
import { convertingShip } from './hulls';
import { CRANES, CRATER, DOCKS, PIER, PYLON, RAIL_PTS, REFINERY, TALLER, TELESCOPE, Y, height } from './layout';
import type { SignPlacement } from './neon';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ground = (x: number, z: number) => height(x, z);

export interface PortAnchors {
  lamps: THREE.Vector3[];
  /** floodlights over the docks (bigger halos, light for the cats) */
  floods: THREE.Vector3[];
  /** red beacons that blink (antenna tips, gantry tops, pylon) */
  beacons: THREE.Vector3[];
  weld: THREE.Vector3[];
  /** violet glow of the converting ships' thruster bells */
  bells: THREE.Vector3[];
  signs: SignPlacement[];
  /** the taller's counter (the owner stands behind it) and its door */
  counter: THREE.Vector3;
  door: THREE.Vector3;
  /** the rooftop helmet of the taller (a glass bowl on a spire) */
  helmetTop: THREE.Vector3;
  /** refinery: sphere center, flare stack tip, the gauge, fuel pipe runs (glass tubes) */
  tank: THREE.Vector3;
  flare: THREE.Vector3;
  fuelRuns: THREE.Vector3[][];
  /** the comet's heart */
  heart: THREE.Vector3;
  crystals: THREE.Vector3[];
  /** the launch pad: rocket base pose + the countdown lights on the umbilical tower */
  padBase: THREE.Vector3;
  countdown: THREE.Vector3[];
  /** the pier's end (clamp pad) */
  clamp: THREE.Vector3;
  /** the telescope's pivot and the board by it */
  telePivot: THREE.Vector3;
  radar: THREE.Vector3;
  windows: THREE.Vector3[];
}

export function buildPort(M: Mesher, rng: () => number): PortAnchors {
  const A: PortAnchors = {
    lamps: [],
    floods: [],
    beacons: [],
    weld: [],
    bells: [],
    signs: [],
    counter: V(0, 0, 0),
    door: V(0, 0, 0),
    helmetTop: V(0, 0, 0),
    tank: V(0, 0, 0),
    flare: V(0, 0, 0),
    fuelRuns: [],
    heart: V(0, 0, 0),
    crystals: [],
    padBase: V(0, 0, 0),
    countdown: [],
    clamp: V(0, 0, 0),
    telePivot: V(0, 0, 0),
    radar: V(0, 0, 0),
    windows: [],
  };
  taller(M, A);
  refinery(M, A);
  DOCKS.forEach((d, i) => drydock(M, A, d, i));
  for (const c of CRANES) craneMast(M, A, c);
  launchPad(M, A);
  pier(M, A);
  observatory(M, A);
  pylon(M, A);
  heart(M, A, rng);
  crest(M, rng);
  yardBits(M, A, rng);
  markings(M);
  return A;
}

// ─────────────────────────────────────────────────────────────── the googie workshop
function taller(M: Mesher, A: PortAnchors) {
  const { x: cx, z: cz, w, d } = TALLER;
  const y0 = Y;
  const H = 3.8;
  // slab
  M.add(new THREE.BoxGeometry(w + 3, 0.3, d + 4), P.steel2, mat(cx, y0 + 0.1, cz + 0.6), 0.3);
  // the body: a capsule (box + two half drums), cream with a teal skirt and a coral cornice
  const bw = w - d;
  const band = (y0b: number, hh: number, color: string, r = d / 2) => {
    M.add(new THREE.BoxGeometry(bw, hh, r * 2), color, mat(cx, y0 + 0.25 + y0b + hh / 2, cz), 0.35);
    for (const sx of [-1, 1]) M.add(new THREE.CylinderGeometry(r, r, hh, 24, 1, false, sx > 0 ? 0 : Math.PI, Math.PI), color, mat(cx + (sx * bw) / 2, y0 + 0.25 + y0b + hh / 2, cz), 0.35);
  };
  band(0, 0.85, P.teal, d / 2 + 0.04);
  band(0.85, H - 1.2, P.cream);
  band(H - 0.35, 0.35, P.coral, d / 2 + 0.06);
  // big front window (glows warm at night) with chrome mullions, a door, the counter window
  const fz = cz + d / 2 + 0.03;
  M.add(new THREE.BoxGeometry(4.6, 2.0, 0.08), P.warm, mat(cx - 2.2, y0 + 2.25, fz), 0.2, 0.75);
  for (let i = 0; i <= 4; i++) M.add(new THREE.BoxGeometry(0.1, 2.1, 0.12), P.chrome, mat(cx - 4.5 + i * 1.15, y0 + 2.25, fz + 0.03), 0.9);
  M.add(new THREE.BoxGeometry(4.8, 0.12, 0.14), P.chrome, mat(cx - 2.2, y0 + 3.3, fz + 0.03), 0.9);
  M.add(new THREE.BoxGeometry(4.8, 0.12, 0.14), P.chrome, mat(cx - 2.2, y0 + 1.2, fz + 0.03), 0.9);
  // the door: dark, with a glowing outline and a round window
  A.door.set(cx + 1.4, y0 + 0.3, fz + 0.6);
  M.add(new THREE.BoxGeometry(1.4, 2.5, 0.08), P.dark, mat(cx + 1.4, y0 + 1.55, fz + 0.01), 0.4);
  M.add(new THREE.TorusGeometry(0.32, 0.06, 6, 16), P.chrome, mat(cx + 1.4, y0 + 2.2, fz + 0.07), 0.9);
  M.add(new THREE.CircleGeometry(0.28, 14), P.glass, mat(cx + 1.4, y0 + 2.2, fz + 0.06), 0.6, 0.6);
  for (const [x0, y0b, x1, y1] of [
    [-0.72, 0.3, -0.72, 2.8],
    [0.72, 0.3, 0.72, 2.8],
    [-0.72, 2.8, 0.72, 2.8],
  ])
    beam(M, V(cx + 1.4 + x0, y0 + y0b, fz + 0.08), V(cx + 1.4 + x1, y0 + y1, fz + 0.08), 0.07, P.neonCyan, 0, 1);
  // the counter: a serving window with a striped awning on the right drum
  const kx = cx + 4.1;
  M.add(new THREE.BoxGeometry(2.4, 1.3, 0.08), P.warm, mat(kx, y0 + 2.0, fz - 0.4), 0, 0.8);
  M.add(new THREE.BoxGeometry(2.8, 0.18, 0.9), P.chrome, mat(kx, y0 + 1.25, fz - 0.05), 0.9);
  for (let k = 0; k < 8; k++) M.add(new THREE.BoxGeometry(0.375, 0.08, 1.3), k & 1 ? P.cream : P.neonPink, mat(kx - 1.3125 + k * 0.375, y0 + 3.0, fz + 0.25, 0.35, 0, 0), 0.2);
  // the owner minds the counter from the street side (the shop is too full of parts for him to fit)
  A.counter.set(kx + 0.2, y0 + 0.3, fz + 1.0);
  // round portholes along the back and sides (chrome rings, glass that glows)
  for (let i = 0; i < 3; i++) {
    const px = cx - 3 + i * 3;
    M.add(new THREE.TorusGeometry(0.45, 0.09, 6, 18), P.chrome, mat(px, y0 + 2.4, cz - d / 2 - 0.04), 0.9);
    M.add(new THREE.CircleGeometry(0.4, 16), P.glass, mat(px, y0 + 2.4, cz - d / 2 - 0.05, 0, Math.PI, 0), 0.6, 0.7);
  }
  // the boomerang canopy: a thin slanted roof sweeping out over the front, on two V pylons
  const roofY = y0 + 0.25 + H + 0.25;
  M.add(new THREE.BoxGeometry(w + 2.4, 0.22, d + 3.4), P.cream2, mat(cx, roofY, cz + 1.2, -0.07, 0, 0), 0.4);
  M.add(new THREE.BoxGeometry(w + 2.6, 0.12, 0.3), P.chrome, mat(cx, roofY - 0.12, cz + d / 2 + 2.9, -0.07, 0, 0), 0.9);
  M.add(new THREE.BoxGeometry(w + 2.6, 0.06, 0.06), P.neonPink, mat(cx, roofY - 0.22, cz + d / 2 + 3.0, -0.07, 0, 0), 0, 1);
  for (const sx of [-1, 1]) {
    const bx = cx + sx * (w / 2 - 0.6);
    const bz = cz + d / 2 + 2.6;
    beam(M, V(bx, y0 + 0.2, bz), V(bx - sx * 1.1, roofY + 0.05, bz - 0.4), 0.18, P.coral, 0.6);
    beam(M, V(bx, y0 + 0.2, bz), V(bx + sx * 1.1, roofY + 0.25, bz - 0.4), 0.18, P.coral, 0.6);
    M.add(new THREE.SphereGeometry(0.22, 8, 6), P.chrome, mat(bx, y0 + 0.25, bz), 0.9);
  }
  // the sign on the canopy front, ABIERTO by the door, the small print on the counter
  A.signs.push({ id: 'taller', pos: V(cx - 1.2, roofY + 1.15, cz + d / 2 + 2.8), width: 8.6, ry: 0, rx: -0.07 });
  A.signs.push({ id: 'abierto', pos: V(cx + 1.4, y0 + 3.35, fz + 0.12), width: 1.9, ry: 0 });
  A.signs.push({ id: 'horas', pos: V(kx, y0 + 3.5, fz + 0.9), width: 2.7, ry: 0, rx: -0.3 });
  M.add(new THREE.BoxGeometry(8.9, 1.62, 0.12), P.steel2, mat(cx - 1.2, roofY + 1.15, cz + d / 2 + 2.72, -0.07, 0, 0), 0.6);
  beam(M, V(cx - 4.5, roofY, cz + d / 2 + 2.6), V(cx - 4.5, roofY + 0.4, cz + d / 2 + 2.7), 0.12, P.steel);
  beam(M, V(cx + 2.1, roofY, cz + d / 2 + 2.6), V(cx + 2.1, roofY + 0.4, cz + d / 2 + 2.7), 0.12, P.steel);
  // the rooftop spire with the fishbowl helmet (the glass bowl itself is its own mesh)
  const sx0 = cx - 4.3;
  const sz0 = cz - 1;
  M.add(new THREE.CylinderGeometry(0.12, 0.42, 6, 8), P.chrome, mat(sx0, roofY + 3, sz0), 0.9);
  for (let i = 0; i < 3; i++) M.add(new THREE.TorusGeometry(0.5 - i * 0.08, 0.05, 5, 16), P.neonCyan, mat(sx0, roofY + 1.4 + i * 1.3, sz0, Math.PI / 2, 0, 0), 0, 1);
  M.add(new THREE.TorusGeometry(1.25, 0.2, 8, 24), P.chrome, mat(sx0, roofY + 6.2, sz0, Math.PI / 2, 0, 0), 0.9);
  A.helmetTop.set(sx0, roofY + 7.35, sz0);
  A.beacons.push(V(sx0, roofY + 8.7, sz0));
  // a vending machine «LATAS ESPACIALES» and fuel barrels by the side
  M.add(new THREE.BoxGeometry(1.1, 2.0, 0.8), P.coral, mat(cx - w / 2 - 0.9, y0 + 1.25, cz + d / 2 + 0.2), 0.5);
  M.add(new THREE.BoxGeometry(0.8, 1.2, 0.05), P.glass, mat(cx - w / 2 - 0.9, y0 + 1.45, cz + d / 2 + 0.62), 0.3, 0.9);
  for (let i = 0; i < 4; i++) barrel(M, cx + w / 2 + 1.0 + (i % 2) * 0.9, cz + d / 2 - 0.4 - Math.floor(i / 2) * 0.9);
  A.windows.push(V(cx - 2.2, y0 + 2.2, fz + 0.4), V(kx, y0 + 2, fz + 0.2));
  // lamps in front (googie atoms)
  for (const lx of [cx - 7.5, cx + 7.5]) lamp(M, A, lx, cz + d / 2 + 4.6);
}

/** a googie lamp: a thin pole, a glowing ball and a tilted chrome orbit ring */
function lamp(M: Mesher, A: PortAnchors, x: number, z: number, h = 4.2) {
  const g = ground(x, z);
  M.add(new THREE.CylinderGeometry(0.07, 0.11, h, 6), P.steel2, mat(x, g + h / 2, z), 0.7);
  M.add(new THREE.CylinderGeometry(0.3, 0.38, 0.25, 8), P.dark, mat(x, g + 0.12, z), 0.4);
  M.add(new THREE.SphereGeometry(0.26, 10, 8), P.warm, mat(x, g + h + 0.2, z), 0, 1);
  M.add(new THREE.TorusGeometry(0.48, 0.035, 5, 18), P.chrome, mat(x, g + h + 0.2, z, 1.1, 0.4, 0), 0.9);
  A.lamps.push(V(x, g + h + 0.2, z));
}

function barrel(M: Mesher, x: number, z: number, lying = false) {
  const g = ground(x, z);
  const m = lying ? mat(x, g + 0.42, z, 0, x * 0.7, Math.PI / 2) : mat(x, g + 0.55, z);
  M.add(new THREE.CylinderGeometry(0.4, 0.4, 1.0, 10), (p, out) => void out.set(Math.abs(p.y) > 0.28 && Math.abs(p.y) < 0.36 ? P.chrome : P.fuel2), m, 0.6);
  if (!lying) M.add(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 10), P.fuel, mat(x, g + 1.07, z), 0, 1);
}

function crate(M: Mesher, x: number, z: number, s: number, ry: number, color: string = P.mustard) {
  const g = ground(x, z);
  M.add(new THREE.BoxGeometry(s, s, s), color, mat(x, g + s / 2, z, 0, ry, 0), 0.3);
  // two dark straps around it
  for (const o of [-0.25, 0.25]) M.add(new THREE.BoxGeometry(s * 1.02, s * 1.02, s * 0.12), P.steel2, mat(x + Math.sin(ry) * o * s, g + s / 2, z + Math.cos(ry) * o * s, 0, ry, 0), 0.5);
}

// ─────────────────────────────────────────────────────────────── the refinery
function refinery(M: Mesher, A: PortAnchors) {
  const { x: cx, z: cz } = REFINERY;
  const g0 = Y;
  const R = 4.1;
  const cy = g0 + 7.0;
  A.tank.set(cx, cy, cz);
  // the Horton sphere: white-chrome, a teal equator band, a glowing fuel band under it
  M.add(
    new THREE.SphereGeometry(R, 28, 18),
    (p, out) => {
      out.set(P.chrome).lerp(new THREE.Color('#ffffff'), 0.3);
      if (Math.abs(p.y) < 0.45) out.set(P.teal);
      if (p.y < -R * 0.82) out.set(P.steel2);
    },
    mat(cx, cy, cz),
    0.85,
  );
  M.add(new THREE.TorusGeometry(R * 0.985, 0.13, 6, 40), P.fuel, mat(cx, cy - 1.05, cz, Math.PI / 2, 0, 0), 0, 1);
  M.add(new THREE.TorusGeometry(R * 0.86, 0.11, 6, 40), P.fuel, mat(cx, cy + 2.05, cz, Math.PI / 2, 0, 0), 0, 1);
  // legs + braces
  const legs = 8;
  for (let i = 0; i < legs; i++) {
    const a = (i / legs) * Math.PI * 2;
    const top = V(cx + Math.cos(a) * R * 0.98, cy, cz + Math.sin(a) * R * 0.98);
    const bot = V(cx + Math.cos(a) * R * 1.02, g0, cz + Math.sin(a) * R * 1.02);
    beam(M, bot, top, 0.32, P.steel);
    M.add(new THREE.BoxGeometry(0.7, 0.25, 0.7), P.dark, mat(bot.x, g0 + 0.12, bot.z), 0.3);
    const a2 = ((i + 1) / legs) * Math.PI * 2;
    const nb = V(cx + Math.cos(a2) * R * 1.02, g0 + 0.4, cz + Math.sin(a2) * R * 1.02);
    beam(M, V(bot.x, g0 + 0.4, bot.z), V(cx + Math.cos(a2) * R * 1.0, cy - 2.6, cz + Math.sin(a2) * R * 1.0), 0.1, P.steel2);
    beam(M, nb, V(cx + Math.cos(a) * R * 1.0, cy - 2.6, cz + Math.sin(a) * R * 1.0), 0.1, P.steel2);
  }
  // a top platform with a rail and a beacon, and a ladder up the side
  M.add(new THREE.CylinderGeometry(1.5, 1.5, 0.15, 16), P.steel, mat(cx, cy + R + 0.02, cz), 0.6);
  M.add(new THREE.TorusGeometry(1.5, 0.05, 4, 20), P.mustard, mat(cx, cy + R + 0.9, cz, Math.PI / 2, 0, 0), 0.4);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    beam(M, V(cx + Math.cos(a) * 1.5, cy + R, cz + Math.sin(a) * 1.5), V(cx + Math.cos(a) * 1.5, cy + R + 0.9, cz + Math.sin(a) * 1.5), 0.05, P.mustard, 0.3);
  }
  A.beacons.push(V(cx, cy + R + 1.4, cz));
  M.add(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 4), P.steel, mat(cx, cy + R + 0.6, cz), 0.5);
  // two upright tanks (coral and cream, domed)
  for (const [tx, tz, r, h, c] of [
    [cx - 6.5, cz - 3.5, 1.9, 7.5, P.coral],
    [cx + 6.5, cz + 2, 1.7, 6, P.cream],
  ] as const) {
    M.add(new THREE.CylinderGeometry(r, r, h, 20), (p, out) => void out.set(Math.abs(p.y - h * 0.2) < 0.25 || Math.abs(p.y + h * 0.3) < 0.2 ? P.chrome : c), mat(tx, g0 + h / 2, tz), 0.7);
    M.add(new THREE.SphereGeometry(r, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), c, mat(tx, g0 + h, tz), 0.7);
    M.add(new THREE.TorusGeometry(r * 1.01, 0.08, 4, 24), P.fuel, mat(tx, g0 + h * 0.62, tz, Math.PI / 2, 0, 0), 0, 1);
    // a ladder
    beam(M, V(tx + r + 0.08, g0, tz - 0.25), V(tx + r + 0.08, g0 + h, tz - 0.25), 0.06, P.steel);
    beam(M, V(tx + r + 0.08, g0, tz + 0.25), V(tx + r + 0.08, g0 + h, tz + 0.25), 0.06, P.steel);
    for (let k = 0; k < h * 2.5; k++) beam(M, V(tx + r + 0.08, g0 + 0.3 + k * 0.4, tz - 0.25), V(tx + r + 0.08, g0 + 0.3 + k * 0.4, tz + 0.25), 0.04, P.steel);
  }
  // the distillation column with its platforms and the flare stack on top
  const colX = cx + 4.5;
  const colZ = cz - 5.2;
  const colH = 15;
  for (let k = 0; k < colH / 1.5; k++) {
    const hh = Math.min(1.5, colH - k * 1.5);
    M.add(new THREE.CylinderGeometry(0.85, 0.85, hh, 14, 1, true), k & 1 ? P.cream2 : P.cream, mat(colX, g0 + k * 1.5 + hh / 2, colZ), 0.6);
  }
  M.add(new THREE.CircleGeometry(0.85, 14), P.cream, mat(colX, g0 + colH, colZ, -Math.PI / 2, 0, 0), 0.6);
  for (let k = 1; k < 4; k++) {
    const yy = g0 + k * 3.6;
    M.add(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 14), P.steel, mat(colX, yy, colZ), 0.6);
    M.add(new THREE.TorusGeometry(1.6, 0.04, 4, 18), P.mustard, mat(colX, yy + 0.7, colZ, Math.PI / 2, 0, 0), 0.3);
  }
  M.add(new THREE.CylinderGeometry(0.22, 0.3, 3.5, 8), P.steel2, mat(colX, g0 + colH + 1.75, colZ), 0.7);
  A.flare.set(colX, g0 + colH + 3.7, colZ);
  // the gauge (a big round dial that glows) on the sphere's front
  M.add(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 20), P.chrome, mat(cx + 1.1, cy - 2.2, cz + R * 0.86, Math.PI / 2 - 0.5, 0, 0), 0.9);
  M.add(new THREE.CircleGeometry(0.75, 20), '#fff4e0', mat(cx + 1.1, cy - 2.18 + 0.06, cz + R * 0.86 + 0.07, -0.5, 0, 0), 0, 0.8);
  // pipework: from the crater (the heart) to the sphere, sphere to tanks, sphere to the docks
  const hx = CRATER.x + CRATER.r * 0.95;
  const runs: THREE.Vector3[][] = [
    [V(CRATER.x + 3, Y - 0.2, CRATER.z - 1), V(hx, Y + 1.2, CRATER.z - 2), V(cx - 9, Y + 1.2, cz + 1), V(cx - R - 0.6, cy - 3.4, cz + 1)],
    [V(cx + R * 0.7, cy - 2.6, cz + 2.6), V(cx + 6, g0 + 1.4, cz + 6), V(DOCKS[0].x - 3, g0 + 1.4, DOCKS[0].z - 4.2)],
    [V(cx - R * 0.8, cy - 2.4, cz - 1.8), V(cx - 6.5, g0 + 3, cz - 3.5 + 1.9)],
  ];
  for (const r of runs) pipeline(M, r, 0.24, P.steel2, 0.7);
  // the GLASS fuel tubes beside them (their own animated mesh) follow the same runs, lifted a little
  A.fuelRuns = runs.map((r) => r.map((p) => p.clone().add(V(0, 0.55, 0.0))));
  // supports under the pipe runs
  for (const r of runs)
    for (let i = 0; i < r.length - 1; i++) {
      const a = r[i];
      const b = r[i + 1];
      const n = Math.floor(a.distanceTo(b) / 4);
      for (let k = 1; k <= n; k++) {
        const p = a.clone().lerp(b, k / (n + 1));
        const gy = ground(p.x, p.z);
        if (p.y - gy > 0.6) beam(M, V(p.x, gy, p.z), V(p.x, p.y + 0.5, p.z), 0.14, P.steel);
      }
    }
  A.signs.push({ id: 'fuel', pos: V(cx - 1.5, g0 + 2.6, cz + R + 1.6), width: 7.6, ry: 0.12 });
  beam(M, V(cx - 4.8, g0, cz + R + 1.5), V(cx - 4.8, g0 + 3.4, cz + R + 1.5), 0.16, P.steel);
  beam(M, V(cx + 1.8, g0, cz + R + 1.9), V(cx + 1.8, g0 + 3.4, cz + R + 1.9), 0.16, P.steel);
  M.add(new THREE.BoxGeometry(7.8, 1.6, 0.12), P.steel2, mat(cx - 1.5, g0 + 2.6, cz + R + 1.5, 0, 0.12, 0), 0.6);
  for (let i = 0; i < 5; i++) barrel(M, cx - 9 + (i % 3) * 0.95, cz + 5 + Math.floor(i / 3) * 1.0);
  barrel(M, cx - 6.6, cz + 7.2, true);
}

// ─────────────────────────────────────────────────────────────── drydocks
function drydock(M: Mesher, A: PortAnchors, d: { x: number; z: number; ang: number }, i: number) {
  const g0 = Y;
  const m = new THREE.Matrix4().compose(V(d.x, g0, d.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -d.ang, 0)), V(1, 1, 1));
  const L = (x: number, y: number, z: number) => V(x, y, z).applyMatrix4(m);
  // the slip: two rails and cradle blocks
  for (const sz of [-1.2, 1.2]) M.add(new THREE.BoxGeometry(16, 0.25, 0.35), P.steel2, new THREE.Matrix4().multiplyMatrices(m, mat(0, 0.12, sz)), 0.7);
  for (let k = 0; k < 4; k++) M.add(new THREE.BoxGeometry(0.8, 1.0, 3.0), P.mustard, new THREE.Matrix4().multiplyMatrices(m, mat(-4.5 + k * 3, 0.5, 0)), 0.2);
  // the hull on its cradle
  const stage = i === 0 ? 0.42 : 0.82;
  const hm = new THREE.Matrix4().multiplyMatrices(m, mat(0, 0.75, 0));
  const s = convertingShip(M, hm, stage);
  A.weld.push(...s.weld);
  A.bells.push(...s.glowAt);
  // three gantry portals over it, a catwalk along the north side, stairs
  const GH = 8.5;
  for (const gx of [-5.5, 0, 5.5]) {
    for (const sz of [-3.4, 3.4]) lattice(M, L(gx, 0, sz), GH, 0.7, P.mustard, 1.4, 0.09);
    girder(M, L(gx, GH + 0.6, -3.6), L(gx, GH + 0.6, 3.6), 0.8, P.mustard, 1.2, 0.09);
  }
  for (const sz of [-3.4, 3.4]) girder(M, L(-5.9, GH + 0.6, sz), L(5.9, GH + 0.6, sz), 0.7, P.mustard, 1.4, 0.09);
  // catwalk at mid height with a rail
  const cwY = 4.2;
  M.add(new THREE.BoxGeometry(12.4, 0.12, 1.1), P.steel, new THREE.Matrix4().multiplyMatrices(m, mat(0, cwY, -2.75)), 0.6);
  beam(M, L(-6.2, cwY + 1, -2.25), L(6.2, cwY + 1, -2.25), 0.05, P.mustard, 0.3);
  for (let k = 0; k <= 8; k++) beam(M, L(-6.2 + k * 1.55, cwY, -2.25), L(-6.2 + k * 1.55, cwY + 1, -2.25), 0.04, P.mustard, 0.3);
  // stairs up to it at the stern end
  for (let k = 0; k < 10; k++) M.add(new THREE.BoxGeometry(0.42, 0.08, 1.0), P.steel, new THREE.Matrix4().multiplyMatrices(m, mat(-9.8 + k * 0.36, 0.25 + k * 0.42, -2.75)), 0.5);
  for (const sz of [-3.3, -2.2]) beam(M, L(-10.0, 0, sz), L(-6.2, cwY, sz), 0.08, P.steel);
  // floodlights on the gantry tops (warm), a beacon on the middle one
  for (const gx of [-5.5, 5.5]) {
    const p = L(gx, GH + 1.2, 3.6);
    M.add(new THREE.BoxGeometry(0.7, 0.5, 0.4), P.dark, mat(p.x, p.y, p.z), 0.4);
    M.add(new THREE.BoxGeometry(0.56, 0.36, 0.05), '#fff6dc', new THREE.Matrix4().multiplyMatrices(m, mat(gx, GH + 1.2, 3.83)), 0, 1);
    A.floods.push(L(gx, GH + 0.9, 2.8));
  }
  A.beacons.push(L(0, GH + 1.4, 0));
  // the sign
  const sp = L(0, GH + 2.0, 3.9);
  A.signs.push({ id: i === 0 ? 'dique1' : 'dique2', pos: sp, width: 3.6, ry: -d.ang });
  M.add(new THREE.BoxGeometry(3.7, 2.05, 0.12), P.steel2, new THREE.Matrix4().multiplyMatrices(m, mat(0, GH + 2.0, 3.82)), 0.6);
  // parts waiting by the dock: a spare fin, boxes, a thruster bell on a pallet
  crate(M, L(-7.8, 0, 4.4).x, L(-7.8, 0, 4.4).z, 1.0, d.ang + 0.3);
  crate(M, L(-7.0, 0, 5.4).x, L(-7.0, 0, 5.4).z, 0.8, d.ang - 0.2, P.teal);
  const bp = L(7.6, 0, -5.0);
  M.add(new THREE.BoxGeometry(1.6, 0.2, 1.6), P.wood, mat(bp.x, g0 + 0.1, bp.z, 0, d.ang, 0));
  M.add(new THREE.CylinderGeometry(0.55, 0.85, 1.3, 14, 1, true), P.steel2, mat(bp.x, g0 + 0.85, bp.z), 0.8);
}

/** a tower crane's mast (the slewing top is its own mesh: props.ts) */
function craneMast(M: Mesher, A: PortAnchors, c: { x: number; z: number; h: number }) {
  const g = ground(c.x, c.z);
  M.add(new THREE.BoxGeometry(2.6, 0.5, 2.6), P.dark, mat(c.x, g + 0.25, c.z), 0.3);
  lattice(M, V(c.x, g + 0.5, c.z), c.h - 0.5, 1.2, P.mustard, 1.3, 0.1);
}

// ─────────────────────────────────────────────────────────────── the launch rail
function launchPad(M: Mesher, A: PortAnchors) {
  const pts = RAIL_PTS.map(([x, y, z]) => V(x, y, z));
  const curve = new THREE.CatmullRomCurve3(pts);
  const n = 60;
  for (const sz of [-0.85, 0.85]) {
    const line: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) line.push(curve.getPointAt(i / n).add(V(0, 0, sz)));
    for (let i = 0; i < n; i++) pipe(M, line[i], line[i + 1], 0.13, P.chrome, 0.9, 0, 6);
    // a neon strip under each rail (it races at launch: the halos do that)
    for (let i = 0; i < n; i++) pipe(M, line[i].clone().add(V(0, -0.22, 0)), line[i + 1].clone().add(V(0, -0.22, 0)), 0.04, P.neonPink, 0, 1, 4);
  }
  // sleepers and supports
  for (let i = 0; i <= 34; i++) {
    const t = i / 34;
    const p = curve.getPointAt(t);
    const tg = curve.getTangentAt(t);
    const q = new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), tg);
    M.add(new THREE.BoxGeometry(0.3, 0.18, 2.3), P.dark, new THREE.Matrix4().compose(p.clone().add(V(0, -0.2, 0)), q, V(1, 1, 1)), 0.3);
    const gy = ground(p.x, p.z);
    if (i % 3 === 0) {
      if (gy > -5) {
        for (const sz of [-0.9, 0.9]) if (p.y - gy > 0.5) beam(M, V(p.x, gy, p.z + sz), V(p.x, p.y - 0.25, p.z + sz), 0.18, P.steel);
      } else {
        // over the void: struts back to the rim
        for (const sz of [-1, 1]) beam(M, V(-39.5, Y - 1.6, p.z + sz * 2.6), V(p.x, p.y - 0.25, p.z + sz * 0.9), 0.2, P.steel);
      }
    }
  }
  girder(M, V(-38.5, Y - 1.2, 3.8), V(-38.5, Y - 1.2, 10.2), 0.8, P.steel, 1.2, 0.1);
  // the rocket's sled and the blast deflector at the base
  A.padBase.set(pts[0].x - 2.4, pts[0].y + 0.15, pts[0].z);
  M.add(new THREE.BoxGeometry(3.4, 0.35, 2.1), P.coral2, mat(A.padBase.x, A.padBase.y - 0.05, A.padBase.z), 0.5);
  M.add(new THREE.BoxGeometry(1.2, 2.4, 3.4), P.steel2, mat(pts[0].x + 2.2, Y + 1.2, pts[0].z, 0, 0, -0.35), 0.6);
  // the umbilical tower beside the rail, with three countdown lamps
  const ux = pts[0].x - 1.5;
  const uz = pts[0].z - 3.1;
  lattice(M, V(ux, Y, uz), 10.5, 1.3, P.coral, 1.3, 0.1);
  beam(M, V(ux, Y + 4.2, uz + 0.6), V(ux - 1.2, Y + 3.2, uz + 2.2), 0.14, P.chrome);
  beam(M, V(ux, Y + 7.0, uz + 0.6), V(ux - 2.2, Y + 6.0, uz + 2.4), 0.14, P.chrome);
  for (let k = 0; k < 3; k++) {
    const p = V(ux + 0.75, Y + 8.6 - k * 0.8, uz + 0.4);
    M.add(new THREE.BoxGeometry(0.2, 0.5, 0.5), P.dark, mat(p.x, p.y, p.z), 0.3);
    A.countdown.push(p.clone().add(V(0.15, 0, 0)));
  }
  A.beacons.push(V(ux, Y + 11.2, uz));
  M.add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 4), P.steel, mat(ux, Y + 10.9, uz), 0.5);
  // the sign
  A.signs.push({ id: 'rampa', pos: V(pts[0].x + 3.5, Y + 2.2, pts[0].z + 3.6), width: 5.2, ry: 0.35 });
  beam(M, V(pts[0].x + 1.2, Y, pts[0].z + 2.8), V(pts[0].x + 1.2, Y + 2.5, pts[0].z + 2.8), 0.12, P.steel);
  beam(M, V(pts[0].x + 5.8, Y, pts[0].z + 4.4), V(pts[0].x + 5.8, Y + 2.5, pts[0].z + 4.4), 0.12, P.steel);
  M.add(new THREE.BoxGeometry(5.3, 1.55, 0.1), P.steel2, mat(pts[0].x + 3.5, Y + 2.2, pts[0].z + 3.53, 0, 0.35, 0), 0.6);
  // landing-circle bollards
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    bollard(M, pts[0].x - 3 + Math.cos(a) * 5.4, pts[0].z + Math.sin(a) * 5.4);
  }
}

function bollard(M: Mesher, x: number, z: number) {
  const g = ground(x, z);
  M.add(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8), (p, out) => void out.set(Math.floor((p.y + 0.35) / 0.18) & 1 ? P.mustard : P.dark), mat(x, g + 0.35, z), 0.3);
}

// ─────────────────────────────────────────────────────────────── the pier
function pier(M: Mesher, A: PortAnchors) {
  const { x, z0, z1, y } = PIER;
  const len = z1 - z0;
  M.add(new THREE.BoxGeometry(3.4, 0.25, len), (p, out) => void out.set(Math.floor((p.z + len / 2) / 1.5) & 1 ? P.steel : P.steel2), mat(x, y, (z0 + z1) / 2), 0.5);
  girder(M, V(x, y - 0.2, z0 + 1), V(x, y - 0.2, z1), 1.4, P.steel2, 1.6, 0.1);
  for (const sx of [-1.65, 1.65]) {
    beam(M, V(x + sx, y + 1.05, z0), V(x + sx, y + 1.05, z1), 0.06, P.mustard, 0.3);
    for (let k = 0; k <= len / 1.6; k++) beam(M, V(x + sx, y, z0 + k * 1.6), V(x + sx, y + 1.05, z0 + k * 1.6), 0.05, P.mustard, 0.3);
    // a neon edge
    beam(M, V(x + sx * 1.03, y + 0.14, z0 + 1), V(x + sx * 1.03, y + 0.14, z1), 0.05, P.neonCyan, 0, 1);
  }
  // the docking clamp: a lattice tower at the end with an arm and a magnetic pad toward the ship
  const tz = z1 - 1.5;
  lattice(M, V(x + 0.9, y, tz), 6.5, 0.9, P.teal, 1.3, 0.09);
  beam(M, V(x + 0.9, y + 5.5, tz), V(x - 4.2, y + 4.2, tz - 1), 0.22, P.teal);
  M.add(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 14), P.chrome, mat(x - 4.4, y + 4.1, tz - 1, 0, 0, Math.PI / 2), 0.9);
  M.add(new THREE.CircleGeometry(0.45, 14), P.neonCyan, mat(x - 4.56, y + 4.1, tz - 1, 0, -Math.PI / 2, 0), 0, 1);
  A.clamp.set(x - 4.6, y + 4.1, tz - 1);
  A.beacons.push(V(x + 0.9, y + 7.0, tz));
  for (const lz of [z0 + 4, z0 + 11]) {
    const lx = x + 1.65;
    M.add(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 6), P.steel2, mat(lx, y + 1.7, lz), 0.7);
    M.add(new THREE.SphereGeometry(0.24, 10, 8), P.warm, mat(lx, y + 3.55, lz), 0, 1);
    M.add(new THREE.TorusGeometry(0.42, 0.03, 5, 16), P.chrome, mat(lx, y + 3.55, lz, 1.1, 0.4, 0), 0.9);
    A.lamps.push(V(lx, y + 3.55, lz));
  }
  // VELOCIDAD MÁXIMA at the root of the pier
  A.signs.push({ id: 'luz', pos: V(x + 2.7, y + 2.3, z0 + 1.2), width: 2.4, ry: 0.2 });
  beam(M, V(x + 2.7, y - 0.2, z0 + 1.15), V(x + 2.7, y + 1.8, z0 + 1.15), 0.08, P.steel);
}

// ─────────────────────────────────────────────────────────────── the observatory knoll
function observatory(M: Mesher, A: PortAnchors) {
  const { x, z, top } = TELESCOPE;
  // the little dome (white, with a dark slit facing north-up)
  const dx = x - 4.5;
  const dz = z - 2;
  const gy = ground(dx, dz);
  M.add(new THREE.CylinderGeometry(2.7, 2.75, 0.7, 22), P.teal, mat(dx, gy + 0.35, dz), 0.4);
  M.add(new THREE.CylinderGeometry(2.6, 2.6, 1.5, 22), P.cream, mat(dx, gy + 1.45, dz), 0.4);
  M.add(new THREE.SphereGeometry(2.62, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), (p, out) => {
    const a = Math.atan2(p.x, -p.z);
    out.set(Math.abs(a) < 0.18 && p.y > 0.3 ? P.dark : P.chrome);
  }, mat(dx, gy + 2.2, dz, 0, 0.5, 0), 0.85);
  M.add(new THREE.BoxGeometry(0.9, 1.7, 0.08), P.dark, mat(dx, gy + 0.85, dz + 2.66), 0.3);
  M.add(new THREE.CircleGeometry(0.3, 12), P.warm, mat(dx + 1.4, gy + 1.5, dz + 2.3, 0, 0.55, 0), 0, 1);
  A.windows.push(V(dx + 1.4, gy + 1.5, dz + 2.5));
  // the big telescope's pedestal (its fork and tube turn: props.ts)
  const gt = top;
  M.add(new THREE.CylinderGeometry(0.75, 1.05, 2.0, 12), P.navy, mat(x, gt + 1.0, z), 0.6);
  M.add(new THREE.CylinderGeometry(1.4, 1.5, 0.25, 16), P.brass, mat(x, gt + 2.05, z), 0.85);
  A.telePivot.set(x, gt + 2.2, z);
  // a bench (to wait for the stars) and the sign
  M.add(new THREE.BoxGeometry(2.2, 0.12, 0.6), P.wood, mat(x + 3.2, gt + 0.55, z + 2.2, 0, -0.6, 0));
  for (const s of [-0.9, 0.9]) M.add(new THREE.BoxGeometry(0.1, 0.5, 0.5), P.steel2, mat(x + 3.2 + s * Math.cos(0.6), gt + 0.25, z + 2.2 + s * Math.sin(0.6), 0, -0.6, 0), 0.5);
  A.signs.push({ id: 'obs', pos: V(x + 2.4, gt + 1.9, z + 4.5), width: 3.6, ry: 0.3 });
  M.add(new THREE.BoxGeometry(3.7, 1.25, 0.1), P.steel2, mat(x + 2.4, gt + 1.9, z + 4.45, 0, 0.3, 0), 0.6);
  beam(M, V(x + 1.0, gt - 0.4, z + 4.0), V(x + 1.0, gt + 1.4, z + 4.0), 0.08, P.steel);
  beam(M, V(x + 3.8, gt - 0.4, z + 4.9), V(x + 3.8, gt + 1.4, z + 4.9), 0.08, P.steel);
  lamp(M, A, x + 4.6, z - 1.5, 3.2);
}

// ─────────────────────────────────────────────────────────────── the PUERTO COMETA pylon
function pylon(M: Mesher, A: PortAnchors) {
  const { x, z } = PYLON;
  const gl = ground(x - 7, z);
  const gr = ground(x + 7, z);
  const gTop = Math.max(gl, gr) + 11;
  for (const [sx, g] of [
    [-7, gl],
    [7, gr],
  ] as const) {
    lattice(M, V(x + sx, g, z), gTop - g, 1.1, P.steel, 1.4, 0.1);
    M.add(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 4), P.steel, mat(x + sx, gTop + 1.3, z), 0.5);
    A.beacons.push(V(x + sx, gTop + 2.7, z));
  }
  girder(M, V(x - 15.5, gTop - 1.6, z), V(x + 15.5, gTop - 1.6, z), 1.0, P.steel2, 1.3, 0.1);
  girder(M, V(x - 15.5, gTop - 6.6, z), V(x + 15.5, gTop - 6.6, z), 1.0, P.steel2, 1.3, 0.1);
  for (let k = 0; k <= 10; k++) beam(M, V(x - 15.5 + k * 3.1, gTop - 6.6, z - 0.35), V(x - 15.5 + k * 3.1, gTop - 1.6, z - 0.35), 0.08, P.steel2);
  A.signs.push({ id: 'cometa', pos: V(x, gTop - 4.05, z + 0.6), width: 32, ry: 0 });
}

// ─────────────────────────────────────────────────────────────── the comet's heart
function heart(M: Mesher, A: PortAnchors, rng: () => number) {
  const cx = CRATER.x;
  const cz = CRATER.z;
  const g = height(cx, cz);
  A.heart.set(cx, g + 2.2, cz);
  // the crystal cluster: tall faceted shards, cyan and pink, that glow
  const shard = (x: number, z: number, h: number, r: number, tilt: number, ang: number, col: string) => {
    const gg = height(x, z) - 0.3;
    const geo = new THREE.CylinderGeometry(0, r, h, 6, 1);
    geo.translate(0, h / 2, 0);
    M.add(geo, (p, out) => void out.set(col).lerp(new THREE.Color('#ffffff'), Math.max(0, p.y / h - 0.7) * 1.2), mat(x, gg, z, Math.cos(ang) * tilt, 0, Math.sin(ang) * tilt), 0.35, 0.38);
    A.crystals.push(V(x + Math.sin(ang) * tilt * h * -0.5, gg + h * 0.75, z + Math.cos(ang) * tilt * h * 0.5));
  };
  shard(cx, cz, 6.2, 0.95, 0.05, 0, '#5fe6ff');
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rng() * 0.3;
    const d = 1.2 + rng() * 1.6;
    shard(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 2.2 + rng() * 2.6, 0.38 + rng() * 0.3, 0.25 + rng() * 0.3, a + Math.PI / 2, i % 3 === 0 ? '#ff6fcf' : i % 3 === 1 ? '#5fe6ff' : '#9a7aff');
  }
  // small shards around the bowl's lip
  for (let i = 0; i < 16; i++) {
    const a = rng() * Math.PI * 2;
    const d = CRATER.r * (0.55 + rng() * 0.5);
    shard(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 0.7 + rng() * 1.2, 0.18 + rng() * 0.15, 0.3 + rng() * 0.35, a + Math.PI / 2 + (rng() - 0.5), rng() < 0.4 ? '#ff6fcf' : '#5fe6ff');
  }
  // the extraction ring: a chrome collar on the lip with three pump heads
  for (let k = 0; k < 3; k++) {
    const a = 0.3 + (k / 3) * Math.PI * 2;
    const px = cx + Math.cos(a) * (CRATER.r + 0.4);
    const pz = cz + Math.sin(a) * (CRATER.r + 0.4);
    const gy = height(px, pz);
    M.add(new THREE.CylinderGeometry(0.6, 0.75, 1.6, 10), P.coral, mat(px, gy + 0.8, pz), 0.6);
    M.add(new THREE.SphereGeometry(0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), P.chrome, mat(px, gy + 1.6, pz), 0.9);
    pipe(M, V(px, gy + 1.2, pz), V(cx + Math.cos(a) * 2.6, height(cx, cz) + 0.8, cz + Math.sin(a) * 2.6), 0.13, P.steel2);
    M.add(new THREE.SphereGeometry(0.16, 8, 6), P.fuel, mat(px, gy + 1.95, pz), 0, 1);
  }
}

/** ice spires on the north crest: the comet's old crust */
function crest(M: Mesher, rng: () => number) {
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI * (0.08 + rng() * 0.84);
    const r = 0.7 + rng() * 0.25;
    const rr = 40 * r;
    const x = Math.cos(a) * rr * 1.15;
    const z = Math.sin(a) * rr * 0.85;
    const g = height(x, z);
    if (g < Y - 0.5) continue;
    if (Math.hypot(x - PYLON.x, z - PYLON.z) < 9 || Math.hypot(x - REFINERY.x, z - REFINERY.z) < 11 || Math.hypot(x - TELESCOPE.x, z - TELESCOPE.z) < 9) continue;
    const h = 2.5 + rng() * 5;
    const geo = new THREE.CylinderGeometry(0, 0.5 + rng() * 0.9, h, 5, 1);
    geo.translate(0, h / 2, 0);
    M.add(geo, (p, out) => void out.set('#bfe6ff').lerp(new THREE.Color('#6f78c8'), Math.max(0, 0.6 - p.y / h)), mat(x, g - 0.4, z, (rng() - 0.5) * 0.4, rng() * 3, (rng() - 0.5) * 0.4), 0.45, 0.12);
  }
}

// ─────────────────────────────────────────────────────────────── the yard's odds and ends
function yardBits(M: Mesher, A: PortAnchors, rng: () => number) {
  // lamps around the plaza and the yard
  for (const [x, z] of [
    [-6, 15],
    [9, 4],
    [17, 11],
    [17, -5],
    [-14, 12],
    [-13, -1],
    [5, -15],
    [-20, 18],
  ])
    lamp(M, A, x, z);
  // an antenna mast with a radar dish (the dish turns: props.ts)
  const rx = 35;
  const rz = -12;
  const rg = ground(rx, rz);
  lattice(M, V(rx, rg, rz), 7, 0.8, P.steel, 1.2, 0.08);
  A.radar.set(rx, rg + 7.3, rz);
  // a second antenna (thin, three crossbars, beacon)
  const ax = -33;
  const az = -9;
  const ag = ground(ax, az);
  M.add(new THREE.CylinderGeometry(0.08, 0.16, 9, 6), P.steel, mat(ax, ag + 4.5, az), 0.7);
  for (let k = 0; k < 3; k++) M.add(new THREE.BoxGeometry(2.2 - k * 0.5, 0.06, 0.06), P.steel, mat(ax, ag + 5.5 + k * 1.2, az, 0, 0.6, 0), 0.7);
  A.beacons.push(V(ax, ag + 9.2, az));
  // crates and barrels in the yard, cones on the plaza
  for (let i = 0; i < 7; i++) crate(M, 17 + (i % 3) * 1.15, 18 + Math.floor(i / 3) * 1.2, 1.0, rng() * 0.3, i % 2 ? P.mustard : P.teal);
  for (let i = 0; i < 6; i++) barrel(M, -16 + (i % 3) * 0.95, 20 + Math.floor(i / 3) * 0.95);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = 27 + Math.cos(a) * 6.5;
    const z = 5 + Math.sin(a) * 6.5;
    const g = ground(x, z);
    M.add(new THREE.ConeGeometry(0.28, 0.75, 8), (p, out) => void out.set(Math.abs(p.y) < 0.1 ? '#ffffff' : '#ff7a2f'), mat(x, g + 0.38, z), 0.2);
  }
  // a fuel cart (a little tank on wheels) by the refinery
  const fx = 14;
  const fz = -8;
  const fg = ground(fx, fz);
  M.add(new THREE.CapsuleGeometry(0.8, 2.0, 4, 12).rotateZ(Math.PI / 2), P.fuel2, mat(fx, fg + 1.2, fz, 0, 0.4, 0), 0.7);
  for (const [wx, wz] of [
    [-1, -0.7],
    [1, -0.7],
    [-1, 0.7],
    [1, 0.7],
  ])
    M.add(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10), P.rubber, mat(fx + wx * Math.cos(0.4) + wz * Math.sin(0.4), fg + 0.35, fz - wx * Math.sin(0.4) + wz * Math.cos(0.4), Math.PI / 2, 0.4, 0));
  // pressure gauges along the refinery fence
  rivets(M, V(10, Y + 0.25, -9), V(14, Y + 0.25, -6), 6, P.neonCyan, 0.08, 1);
}

// ─────────────────────────────────────────────────────────────── deck markings (crisp: geometry, not paint)
/** a ring of dashes laid on the deck */
function dashRing(M: Mesher, cx: number, cz: number, r: number, n: number, w: number, a: string, b?: string, glow = 0) {
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const x = cx + Math.cos(ang) * r;
    const z = cz + Math.sin(ang) * r;
    const len = ((Math.PI * 2 * r) / n) * 0.62;
    M.add(new THREE.BoxGeometry(len, 0.04, w), b && i % 2 ? b : a, mat(x, ground(x, z) + 0.03, z, 0, -ang + Math.PI / 2, 0), 0, glow);
  }
}
/** a hazard band (yellow/black chevrons) from a to b on the deck */
function hazard(M: Mesher, ax: number, az: number, bx: number, bz: number, w = 0.6) {
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(2, Math.round(len / 0.7));
  const ang = Math.atan2(bz - az, bx - ax);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    M.add(new THREE.BoxGeometry(len / n, 0.04, w), i % 2 ? P.dark : P.mustard, mat(x, ground(x, z) + 0.03, z, 0, -ang, 0), 0.1);
  }
}
function markings(M: Mesher) {
  // the yard's landing circle (where the test rocket comes down) and its star
  dashRing(M, 27, 5, 6.5, 28, 0.35, '#f4f6fb');
  dashRing(M, 27, 5, 5.6, 40, 0.12, P.mustard);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    M.add(new THREE.BoxGeometry(2.6, 0.04, 0.45), '#f4f6fb', mat(27 + Math.cos(a) * 1.3, ground(27, 5) + 0.03, 5 + Math.sin(a) * 1.3, 0, -a, 0));
  }
  // the plaza: a neon ring (pink) and a white dashed one
  dashRing(M, 2, 9, 5.2, 36, 0.16, P.neonPink, undefined, 1);
  dashRing(M, 2, 9, 6.0, 24, 0.3, '#f4f6fb');
  // hazard bands: in front of the slips, at the pier root, by the rail's sled, around the refinery
  for (const d of DOCKS) {
    const ca = Math.cos(-d.ang);
    const sa = Math.sin(-d.ang);
    const P0 = (lx: number, lz: number) => [d.x + lx * ca + lz * sa, d.z - lx * sa + lz * ca] as const;
    const [ax, az] = P0(-8.6, -4.3);
    const [bx, bz] = P0(-8.6, 4.3);
    hazard(M, ax, az, bx, bz);
  }
  hazard(M, PIER.x - 1.9, PIER.z0 - 0.8, PIER.x + 1.9, PIER.z0 - 0.8, 0.5);
  hazard(M, RAIL_PTS[0][0] + 1.0, RAIL_PTS[0][2] - 2.4, RAIL_PTS[0][0] + 1.0, RAIL_PTS[0][2] + 2.4, 0.5);
  for (let k = 0; k < 4; k++) {
    const a0 = (k / 4) * Math.PI * 2 + 0.3;
    const a1 = a0 + 0.9;
    hazard(M, REFINERY.x + Math.cos(a0) * 6.2, REFINERY.z + Math.sin(a0) * 6.2, REFINERY.x + Math.cos(a1) * 6.2, REFINERY.z + Math.sin(a1) * 6.2, 0.45);
  }
}
