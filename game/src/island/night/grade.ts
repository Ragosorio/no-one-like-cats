/** WorldLook → 5×4 color matrix (Pixi ColorMatrixFilter) for the island's WORLD layers. Pure. */
import type { WorldLook } from '../../state/sys/worldState';

const LR = 0.2126;
const LG = 0.7152;
const LB = 0.0722;

/** saturation around luma, then × tint × exposure, then + lift (offsets are 0..1) */
export function gradeMatrix(l: Pick<WorldLook, 'exposure' | 'tint' | 'saturation' | 'lift'>): number[] {
  const s = l.saturation;
  const e = l.exposure;
  const tr = (((l.tint >> 16) & 255) / 255) * e;
  const tg = (((l.tint >> 8) & 255) / 255) * e;
  const tb = ((l.tint & 255) / 255) * e;
  const lr = ((l.lift >> 16) & 255) / 255;
  const lg = ((l.lift >> 8) & 255) / 255;
  const lb = (l.lift & 255) / 255;
  const q = 1 - s;
  return [
    tr * (s + q * LR), tr * q * LG, tr * q * LB, 0, lr,
    tg * q * LR, tg * (s + q * LG), tg * q * LB, 0, lg,
    tb * q * LR, tb * q * LG, tb * (s + q * LB), 0, lb,
    0, 0, 0, 1, 0,
  ];
}

/** apply a matrix to an rgb triple (0..1) — tests and tooling */
export function applyGrade(m: number[], r: number, g: number, b: number): [number, number, number] {
  return [m[0] * r + m[1] * g + m[2] * b + m[4], m[5] * r + m[6] * g + m[7] * b + m[9], m[10] * r + m[11] * g + m[12] * b + m[14]];
}
