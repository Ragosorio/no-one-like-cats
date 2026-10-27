/**
 * ACTO II — the shots the rule demonstrations draw, COMPUTED WITH THE REAL SIMULATOR (battle/demo.ts `ruleDemo`, which
 * runs Battle.integrate on a small fixed battle: no screen, no save, deterministic). The Act II rules (Onomatopeya,
 * the tangling thread, Rescate, Poder, Duelo limpio) aren't in the simulator yet, so each film draws its rule's
 * effect ON a real flight: the block letters a real shot runs into, the cannon a thread ties before it fires, the
 * one stroke each side throws. Pure (no Pixi): the sets map these arcs into their panels.
 */
import { ruleDemo, type RuleDemo } from '../../../../battle/demo';

export interface Arc {
  /** the flight, normalized to the field: x 0..1 from the player's ship to the enemy's, y 0..1 from the top of the
   *  highest point to the waterline (1) */
  pts: [number, number][];
  /** where it ended on the real field (a module, the hull, the sea) */
  landing: string;
  good: boolean;
}
let cache: { arcs: Arc[]; demo: RuleDemo | null } | null = null;

/** the real shots (cached: computed once per session, at the first film's loading screen) */
export function realArcs(): Arc[] {
  if (cache) return cache.arcs;
  let demo: RuleDemo | null = null;
  try {
    demo = ruleDemo('mareo');
  } catch (e) {
    console.warn('[acto2] sin simulador: se usa una parábola', e);
  }
  if (!demo || !demo.shots.length) {
    const pts: [number, number][] = Array.from({ length: 40 }, (_, i) => {
      const u = i / 39;
      return [u, 1 - 4 * u * (1 - u) * 0.9];
    });
    cache = { arcs: [{ pts, landing: 'casco', good: true }], demo: null };
    return cache.arcs;
  }
  const f = demo.field;
  const x0 = (f.player.x0 + f.player.x1) / 2;
  const x1 = (f.enemy.x0 + f.enemy.x1) / 2;
  const all = demo.shots.flatMap((s) => s.points);
  const top = Math.min(...all.map((p) => p.y));
  const arcs = demo.shots.map((s) => ({
    pts: s.points.map((p) => [(p.x - x0) / (x1 - x0), (p.y - top) / Math.max(1, f.waterY - top)] as [number, number]),
    landing: s.landing,
    good: s.good,
  }));
  cache = { arcs, demo };
  return arcs;
}
/** the honest caption the simulator wrote for its own demo (for the record; the films say their own rule) */
export const realDemo = () => (realArcs(), cache?.demo ?? null);

/** an arc mapped into a rect [x, y, w, h] (from its left to its right; `flip` = fired from the right) */
export function fitArc(a: Arc, rect: [number, number, number, number], flip = false): [number, number][] {
  const [x, y, w, h] = rect;
  return a.pts.map(([u, v]) => [x + (flip ? 1 - u : u) * w, y + v * h] as [number, number]);
}
/** the point at fraction t of a polyline (by length) and its heading */
export function along(pts: [number, number][], t: number): { x: number; y: number; ang: number } {
  if (pts.length < 2) return { x: pts[0]?.[0] ?? 0, y: pts[0]?.[1] ?? 0, ang: 0 };
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const want = Math.max(0, Math.min(1, t)) * L[L.length - 1];
  let i = 1;
  while (i < L.length - 1 && L[i] < want) i++;
  const k = (want - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
  const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k;
  const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k;
  return { x, y, ang: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) };
}
/** the first point of a polyline past x = xs (where a flight meets a wall) as a fraction of its length */
export function crossAt(pts: [number, number][], xs: number): number {
  let L = 0;
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push((L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])));
  for (let i = 1; i < pts.length; i++) if ((pts[i - 1][0] - xs) * (pts[i][0] - xs) <= 0) return seg[i] / Math.max(1e-6, L);
  return 1;
}
/**
 * an arc mapped so it STARTS at `from`, LANDS exactly on `to` and peaks at `peakY` (the real flight's shape, scaled):
 * a demo shot that hits the thing the rule is about (the K of a «¡KRAK!», a cannon, a rival).
 */
export function fitArcTo(a: Arc, from: [number, number], to: [number, number], peakY: number): [number, number][] {
  const p = a.pts;
  const u0 = p[0][0];
  const u1 = p[p.length - 1][0];
  const v0 = p[0][1];
  const v1 = p[p.length - 1][1];
  const vmin = Math.min(...p.map((q) => q[1]));
  return p.map(([u, v]) => {
    const k = (u - u0) / Math.max(1e-6, u1 - u0);
    const x = from[0] + (to[0] - from[0]) * k;
    // the straight line from start to end, plus the arc's own bulge (scaled to reach peakY)
    const base = v0 + (v1 - v0) * k;
    const bulge = (base - v) / Math.max(1e-6, Math.max(v0, v1) - vmin);
    const yLine = from[1] + (to[1] - from[1]) * k;
    const top = Math.max(1, Math.min(from[1], to[1]) - peakY);
    return [x, yLine - bulge * top] as [number, number];
  });
}
