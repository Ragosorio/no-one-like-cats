/**
 * Performance instrumentation + quality tiers (AgentGameEngine `core/perf`).
 * - FrameStats: ring buffer of frame intervals → fps, p50/p95/p99, long frames (>33 ms)
 * - QUALITY: one table that every system reads (DPR cap, shadows, water/terrain detail, particles)
 * - AutoQuality: steps DOWN one tier when p95 stays above budget (never up on its own: no flapping)
 */
export class FrameStats {
  private buf: Float32Array;
  private i = 0;
  private n = 0;
  long = 0;
  constructor(size = 240) {
    this.buf = new Float32Array(size);
  }
  push(ms: number) {
    this.buf[this.i] = ms;
    this.i = (this.i + 1) % this.buf.length;
    this.n = Math.min(this.n + 1, this.buf.length);
    if (ms > 33.4) this.long++;
  }
  pct(p: number) {
    if (!this.n) return 0;
    const a = Array.from(this.buf.subarray(0, this.n)).sort((x, y) => x - y);
    return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
  }
  get fps() {
    if (!this.n) return 0;
    let s = 0;
    for (let k = 0; k < this.n; k++) s += this.buf[k];
    return 1000 / (s / this.n);
  }
  reset() {
    this.n = 0;
    this.long = 0;
  }
}

export type Tier = 'bajo' | 'medio' | 'alto' | 'ultra';
export const TIERS: Tier[] = ['bajo', 'medio', 'alto', 'ultra'];

export interface QualityCfg {
  dprCap: number;
  /** 3D render scale on top of the DPR cap (UI stays native) */
  scale: number;
  shadowMap: number;
  shadows: boolean;
  waterSeg: number;
  terrainSeg: number;
  particles: number;
  catShadows: boolean;
  grass: number;
  msaa: boolean;
  /** re-render the sun shadow map every N frames (0 = never: shadows off). Casters are static props
   *  and slow sway; cats use their own projected silhouettes, so a 2–3 frame lag is invisible. */
  shadowEvery: number;
}

/** measured 2026-10-09 (docs/part-ii/11): the sun shadow is the #1 GPU cost, then MSAA and pixels */
export const QUALITY: Record<Tier, QualityCfg> = {
  bajo: { dprCap: 1, scale: 0.75, shadowMap: 1024, shadows: false, waterSeg: 80, terrainSeg: 120, particles: 0.35, catShadows: false, grass: 0.25, msaa: false, shadowEvery: 0 },
  medio: { dprCap: 1, scale: 1, shadowMap: 1024, shadows: true, waterSeg: 120, terrainSeg: 160, particles: 0.65, catShadows: true, grass: 0.5, msaa: false, shadowEvery: 3 },
  alto: { dprCap: 1.5, scale: 1, shadowMap: 2048, shadows: true, waterSeg: 180, terrainSeg: 200, particles: 1, catShadows: true, grass: 1, msaa: true, shadowEvery: 2 },
  ultra: { dprCap: 2.5, scale: 1, shadowMap: 4096, shadows: true, waterSeg: 300, terrainSeg: 256, particles: 1.3, catShadows: true, grass: 1.4, msaa: true, shadowEvery: 1 },
};

export class AutoQuality {
  private over = 0;
  enabled = true;
  /** ms budget for p95 (60 fps ≈ 16.7; allow headroom for vsync jitter) */
  budget = 20;
  constructor(
    public tier: Tier,
    private onChange: (t: Tier) => void,
  ) {}
  /** call ~once per second with the current p95 */
  sample(p95: number) {
    if (!this.enabled) return;
    if (p95 > this.budget) this.over++;
    else this.over = Math.max(0, this.over - 1);
    const idx = TIERS.indexOf(this.tier);
    if (this.over >= 4 && idx > 0) {
      this.over = 0;
      this.tier = TIERS[idx - 1];
      this.onChange(this.tier);
    }
  }
}

/** best-effort JS heap (Chrome only) in MB */
export function heapMB(): number | null {
  const m = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return m ? m.usedJSHeapSize / 1048576 : null;
}
