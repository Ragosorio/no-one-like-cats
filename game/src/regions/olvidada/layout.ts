/**
 * La Isla que Nadie Recuerda — YOUR island, read from your save (biblia 05 §4: «se genera a partir de tu propia
 * partida»). The land is the archipelago the 2D game draws for you (island/layout.ts islandPlan: home + every
 * expansion you bought that has a ruin on it), turned 45° so the default camera sees it the way the iso page
 * does; the ruins stand where YOUR habitats stand (state/sys/olvidada.ts olvidadaRuins: gx/gy in tiles), the
 * dead lighthouse, the broken pier and the prologue's raft where yours are.
 *
 * Pure and lazy: the engine samples `height` while it builds the world (after the save is loaded), so the
 * shape is computed on first use and cached per save signature (bought expansions + ruins).
 */
import * as THREE from 'three';
import { fbm, smoothstep, lerp } from '../../engine/core/noise';
import { islandPlan } from '../../island/layout';
import { key } from '../../island/archipelago';
import { tierFootprint } from '../../island/placement';
import { EXPANSIONS } from '../../data/content';
import { G } from '../../state/game';
import { olvidadaRuins, type Ruin } from '../../state/sys/olvidada';

export const HALF = 64;
/** how high the island's plateau sits */
const BASE = 1.5;

export interface RuinSpot {
  ruin: Ruin;
  /** index (0..7): the shaders address each ruin by it */
  i: number;
  x: number;
  z: number;
  y: number;
  /** radius of its yard (world units) */
  r: number;
}

export interface OlvLayout {
  sig: string;
  /** tile edge in world units */
  k: number;
  ruins: RuinSpot[];
  lighthouse: THREE.Vector3;
  port: THREE.Vector3;
  raft: THREE.Vector3;
  /** where the blank page floats (over your FIRST habitat's ruin) */
  page: THREE.Vector3;
  arrival: [number, number, number];
  center: THREE.Vector3;
  /** sea-ward direction of the chart's edge (where the strikethroughs point: El Umbral) */
  edgeDir: THREE.Vector3;
  radius: number;
  /** the decor of your island (island/layout.ts plans: palms, bushes, rocks…) where the page draws it */
  decor: { x: number; z: number; kind: string; v: number }[];
  toWorld(gx: number, gy: number): { x: number; z: number };
  field(x: number, z: number): number;
}

const N = 72;
let cache: OlvLayout | null = null;

function signature() {
  const ex = G.s?.expansions?.bought?.join(',') ?? '';
  const r = olvidadaRuins()
    .map((x) => `${x.id}@${x.gx},${x.gy}`)
    .join(';');
  return `${ex}|${r}`;
}

/** the layout of THIS save (cached until the save's shape changes) */
export function layout(): OlvLayout {
  const sig = G.s ? signature() : 'none';
  if (cache && cache.sig === sig) return cache;
  cache = build(sig);
  return cache;
}

function build(sig: string): OlvLayout {
  const plan = islandPlan();
  const ruins = G.s ? olvidadaRuins() : [];
  const bought = new Set((G.s?.expansions?.bought ?? []).map((n) => EXPANSIONS.find((e) => e.n === n)?.id).filter(Boolean) as string[]);
  // the regions that hold a ruin (home always): your island as you made it, without the far empty ones
  const ruinRegion = new Set<string>(['home']);
  for (const r of ruins) {
    if (r.kind !== 'habitat') continue;
    const t = plan.tiles.get(key(Math.round(r.gx), Math.round(r.gy)));
    if (t && (t.region === 'home' || bought.has(t.region))) ruinRegion.add(t.region);
  }
  const land = new Float32Array(N * N);
  let minU = 1e9;
  let maxU = -1e9;
  let minV = 1e9;
  let maxV = -1e9;
  for (const t of plan.tiles.values()) {
    if (!ruinRegion.has(t.region) || t.gx < 0 || t.gy < 0 || t.gx >= N || t.gy >= N) continue;
    land[t.gy * N + t.gx] = 1;
    const u = t.gx - t.gy;
    const v = t.gx + t.gy;
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }
  if (minU > maxU) {
    // no tiles (should never happen): a small round island around the home center
    const H = plan.regions[0];
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) if (Math.hypot(gx - H.cx, gy - H.cy) < 7) land[gy * N + gx] = 1;
    minU = -7;
    maxU = 7;
    minV = H.cx + H.cy - 7;
    maxV = H.cx + H.cy + 7;
  }
  // a soft field (two box blurs) so the coast is smooth, not tiled
  const blur = (src: Float32Array) => {
    const out = new Float32Array(N * N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let s = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= N || yy >= N) {
              n++;
              continue;
            }
            s += src[yy * N + xx];
            n++;
          }
        out[y * N + x] = s / n;
      }
    return out;
  };
  const f1 = blur(blur(blur(land)));
  // rotate 45° (iso → top-down) and fit into the world
  const S2 = Math.SQRT1_2;
  const ext = Math.max(maxU - minU + 4, maxV - minV + 4) * S2;
  const k = Math.min(3.1, 104 / ext);
  const s = k * S2;
  const cu = (minU + maxU) / 2;
  const cv = (minV + maxV) / 2;
  const toWorld = (gx: number, gy: number) => ({ x: (gx - gy - cu) * s, z: (gx + gy - cv) * s });
  const toTile = (x: number, z: number) => {
    const u = x / s + cu;
    const v = z / s + cv;
    return { gx: (u + v) / 2, gy: (v - u) / 2 };
  };
  const sample = (gx: number, gy: number) => {
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : f1[y * N + x]);
    return lerp(lerp(at(x0, y0), at(x0 + 1, y0), fx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), fx), fy);
  };
  const field = (x: number, z: number) => {
    const t = toTile(x, z);
    return sample(t.gx, t.gy);
  };

  // ruins: habitats at the center of their yard; the landmark ruins at your landmarks
  const H = plan.home;
  const spotC = (sp: { gx: number; gy: number; w: number; h: number }) => toWorld(sp.gx + sp.w / 2 - 0.5, sp.gy + sp.h / 2 - 0.5);
  const lighthouse = spotC(H.lighthouse);
  const port = spotC(H.port);
  const raft = spotC(H.boat);
  const home = spotC(H.sanctuary);
  const spots: RuinSpot[] = [];
  ruins.slice(0, 8).forEach((r, i) => {
    let p: { x: number; z: number };
    let rad = 3.2;
    if (r.kind === 'faro') p = lighthouse;
    else if (r.kind === 'muelle') p = port;
    else if (r.kind === 'casa') p = home;
    else {
      const fp = tierFootprint(r.tier);
      p = toWorld(r.gx + fp / 2 - 0.5, r.gy + fp / 2 - 0.5);
      rad = Math.max(2.8, Math.min(5.2, fp * k * 0.42));
    }
    spots.push({ ruin: r, i, x: p.x, z: p.z, y: 0, r: rad });
  });
  // keep yards from overlapping (a crowded save): push apart a little, never off the land
  for (let it = 0; it < 6; it++)
    for (const a of spots)
      for (const b of spots) {
        if (a === b) continue;
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        const want = a.r + b.r + 0.6;
        if (d < want && d > 0.01) {
          const push = (want - d) * 0.25;
          a.x += ((a.x - b.x) / d) * push;
          a.z += ((a.z - b.z) / d) * push;
        }
      }
  const center = new THREE.Vector3();
  for (const sp of spots) center.add(new THREE.Vector3(sp.x, 0, sp.z));
  if (spots.length) center.divideScalar(spots.length);
  // the first habitat you ever placed (the save's own order): the page floats over it
  const firstHab = G.s?.habitats?.[0]?.id;
  const pageSpot = spots.find((sp) => sp.ruin.id === firstHab) ?? spots[0];
  // arrival: the raft's beach (the prologue started there), pulled onto land
  const arrivalP = { x: lerp(raft.x, home.x, 0.35), z: lerp(raft.z, home.z, 0.35) };
  const decor: OlvLayout['decor'] = [];
  for (const id of ruinRegion) {
    const pl = plan.plans.get(id);
    for (const d of pl?.decor ?? []) {
      if (d.kind === 'grass' || decor.length >= 140) continue;
      const p = toWorld(d.gx, d.gy);
      if (spots.some((sp) => Math.hypot(p.x - sp.x, p.z - sp.z) < sp.r + 1.2)) continue;
      decor.push({ x: p.x, z: p.z, kind: d.kind, v: d.v });
    }
  }
  const L: OlvLayout = {
    sig,
    decor,
    k,
    ruins: spots,
    lighthouse: new THREE.Vector3(lighthouse.x, 0, lighthouse.z),
    port: new THREE.Vector3(port.x, 0, port.z),
    raft: new THREE.Vector3(raft.x, 0, raft.z),
    page: new THREE.Vector3(pageSpot?.x ?? 0, 0, pageSpot?.z ?? 0),
    arrival: [arrivalP.x, 0, arrivalP.z],
    center,
    edgeDir: new THREE.Vector3(1, 0, -0.55).normalize(),
    radius: (ext * k) / 2,
    toWorld,
    field,
  };
  // pads: every yard is flat; heights filled once the height fn exists
  cache = L;
  for (const sp of spots) sp.y = height(sp.x, sp.z);
  L.page.y = pageSpot ? pageSpot.y : height(0, 0);
  L.arrival[1] = height(L.arrival[0], L.arrival[2]) + 0.2;
  L.lighthouse.y = height(L.lighthouse.x, L.lighthouse.z);
  L.port.y = height(L.port.x, L.port.z);
  return L;
}

/** the ground: your coast (soft), a plateau, gentle hills; every ruin's yard flat */
export function height(x: number, z: number): number {
  const L = cache ?? layout();
  const f = L.field(x, z);
  const m = smoothstep(0.16, 0.72, f);
  if (m <= 0) return -3.2 - 7 * smoothstep(0.16, 0.0, f);
  let h = lerp(-2.4, BASE + 0.9 * (fbm(x * 0.05, z * 0.05, 3, 31) * 0.5 + 0.5), smoothstep(0, 0.7, m));
  for (const sp of L.ruins) {
    const d = Math.hypot(x - sp.x, z - sp.z);
    const w = 1 - smoothstep(sp.r * 0.9, sp.r * 1.5, d);
    if (w > 0) h = lerp(h, BASE + 0.15, w * smoothstep(0.2, 0.6, m));
  }
  return h;
}

export function walkable(x: number, z: number) {
  const h = height(x, z);
  if (h < 0.45) return false;
  const e = 0.6;
  const sl = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
  return sl < 1.1;
}

const ca = new THREE.Color();
const cb = new THREE.Color();
/**
 * Your island in its TRUE colors (the memory shader turns it sepia until it's repaired): the home island's grass,
 * warm sand, darker earth paths where your habitats' yards were. Abandoned: patches of dry grass everywhere.
 */
export function paint(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  if (h < 0.45) {
    out.set('#e8d2a4').lerp(ca.set('#9fc8c0'), smoothstep(0.45, -1.5, h));
    return;
  }
  if (h < 1.05) {
    out.set('#f2dcae');
    return;
  }
  const n = fbm(x * 0.07, z * 0.07, 3, 5) * 0.5 + 0.5;
  ca.set('#7cc46a').lerp(cb.set('#a9b65a'), smoothstep(0.45, 0.7, n));
  // dry, overgrown: nobody mowed this island
  ca.lerp(cb.set('#c9b98a'), smoothstep(0.62, 0.8, fbm(x * 0.13 + 4, z * 0.13, 2, 8) * 0.5 + 0.5) * 0.6);
  const L = cache;
  if (L) for (const sp of L.ruins) if (Math.hypot(x - sp.x, z - sp.z) < sp.r * 1.1) ca.lerp(cb.set('#c8b48c'), 0.55);
  if (slope > 0.9) ca.lerp(cb.set('#9a8a70'), smoothstep(0.9, 1.4, slope));
  out.copy(ca);
}
