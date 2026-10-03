/** Deterministic projectile integration shared by the player preview, the AI and the live shot. */
export const GRAVITY = 980;
export const DT = 1 / 120;

export interface ShotParams {
  x: number;
  y: number;
  angle: number; // radians, 0 = right, negative = up
  power: number; // px/s
  wind: number; // px/s^2 horizontal accel
  gravityMul?: number;
}

export interface TracePoint {
  x: number;
  y: number;
  t: number;
}

/**
 * Integrate until `hit(x,y)` returns true, the projectile falls below `floorY`,
 * or leaves bounds. Returns the sampled path (every step).
 */
export function trace(
  p: ShotParams,
  hit: (x: number, y: number) => boolean,
  floorY: number,
  bounds = { minX: -400, maxX: 2400, maxT: 6 },
): { path: TracePoint[]; end: 'hit' | 'water' | 'out'; x: number; y: number } {
  let x = p.x;
  let y = p.y;
  let vx = Math.cos(p.angle) * p.power;
  let vy = Math.sin(p.angle) * p.power;
  const g = GRAVITY * (p.gravityMul ?? 1);
  const path: TracePoint[] = [{ x, y, t: 0 }];
  let t = 0;
  while (t < bounds.maxT) {
    // sub-sample to avoid tunnelling through 34px cells
    const steps = Math.max(1, Math.ceil((Math.hypot(vx, vy) * DT) / 8));
    const sdt = DT / steps;
    for (let i = 0; i < steps; i++) {
      vx += p.wind * sdt;
      vy += g * sdt;
      x += vx * sdt;
      y += vy * sdt;
      if (hit(x, y)) {
        path.push({ x, y, t });
        return { path, end: 'hit', x, y };
      }
    }
    t += DT;
    path.push({ x, y, t });
    if (y >= floorY) return { path, end: 'water', x, y };
    if (x < bounds.minX || x > bounds.maxX) return { path, end: 'out', x, y };
  }
  return { path, end: 'out', x, y };
}
